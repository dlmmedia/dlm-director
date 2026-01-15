// ========================================
// DLM DIRECTOR - STORAGE SERVICE
// Handles Metadata in Neon DB & Assets in Vercel Blob
// ========================================

import { put, del } from '@vercel/blob';
import { nanoid } from 'nanoid';
import { getPool } from './db';
import { ProjectMetadata, ProjectsIndex, Scene } from '@/types';

// Re-export types
export type { ProjectMetadata, ProjectsIndex };

const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

// --- DATABASE IMPLEMENTATION ---

export async function getProjectsIndex(): Promise<ProjectsIndex> {
  try {
    const client = await getPool().connect();
    try {
      const result = await client.query(`
        SELECT id, title, updated_at, thumbnail 
        FROM projects 
        ORDER BY updated_at DESC
      `);
      
      const projects = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        updatedAt: row.updated_at.toISOString(),
        createdAt: row.updated_at.toISOString(), // fallback
        thumbnail: row.thumbnail
      }));

      return {
        projects,
        lastUpdated: new Date().toISOString()
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching projects index:', error);
    return { projects: [], lastUpdated: new Date().toISOString() };
  }
}

export async function createProject(title: string, initialData?: any): Promise<ProjectMetadata> {
  const id = nanoid(10);
  const now = new Date();
  
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      INSERT INTO projects (id, title, config, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
    `, [id, title || 'Untitled Project', initialData?.config || {}, now, now]);

    // Insert initial scenes if present
    if (initialData?.scenes && Array.isArray(initialData.scenes)) {
        for (const scene of initialData.scenes) {
            await client.query(`
                INSERT INTO scenes (
                    project_id, sequence_order, visual_prompt, enhanced_prompt, 
                    shot_type, camera_angle, camera_movement, 
                    lighting_style, light_source, focal_length, depth_of_field,
                    config
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `, [
                id, scene.id, scene.visualPrompt, scene.enhancedPrompt,
                scene.shotType, scene.cameraAngle, scene.cameraMovement,
                scene.lightingStyle, scene.lightSource, scene.focalLength, scene.depthOfField,
                JSON.stringify({ frameAnchoring: scene.frameAnchoring, referenceImages: scene.referenceImages })
            ]);
        }
    }

    await client.query('COMMIT');

    return {
      id,
      title: title || 'Untitled Project',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating project:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function getProject(projectId: string): Promise<any | null> {
  const client = await getPool().connect();
  try {
    // Fetch project
    const projectRes = await client.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (projectRes.rows.length === 0) return null;
    const project = projectRes.rows[0];

    // Fetch scenes
    const scenesRes = await client.query(`
        SELECT * FROM scenes 
        WHERE project_id = $1 
        ORDER BY sequence_order ASC
    `, [projectId]);

    const scenes = scenesRes.rows.map(row => {
        const configData = typeof row.config === 'string' ? JSON.parse(row.config) : (row.config || {});
        return {
            id: row.sequence_order, // Using sequence_order as ID for now to match frontend expectations
            visualPrompt: row.visual_prompt || '',
            enhancedPrompt: row.enhanced_prompt || '',
            shotType: row.shot_type || 'MEDIUM',
            cameraAngle: row.camera_angle || 'EYE_LEVEL',
            cameraMovement: row.camera_movement || 'STATIC_TRIPOD',
            lightingStyle: row.lighting_style || 'CINEMATIC',
            lightSource: row.light_source || 'DAYLIGHT',
            focalLength: row.focal_length || 'STANDARD_35MM',
            depthOfField: row.depth_of_field || 'CINEMATIC_SHALLOW',
            // From config JSONB
            frameAnchoring: configData.frameAnchoring,
            referenceImages: configData.referenceImages || [],
            characterIds: configData.characterIds || [],
            locationId: configData.locationId,
            narration: configData.narration || '',
            durationEstimate: configData.durationEstimate || 10,
            status: configData.status || 'pending',
            imageUrl: configData.imageUrl,
            videoUrl: configData.videoUrl,
        };
    });

    // URLs are stored directly in scene config JSONB, no need to query assets table
    // Just use the scenes as reconstructed above
    
    // Ensure config has the latest reconstructed scenes
    const finalConfig = {
        ...project.config,
        scenes: scenes.length > 0 ? scenes : (project.config?.scenes || [])
    };

    return {
        id: project.id,
        title: project.title,
        config: finalConfig,
        createdAt: project.created_at.toISOString(),
        updatedAt: project.updated_at.toISOString(),
    };
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  } finally {
    client.release();
  }
}

export async function saveProject(projectId: string, data: any): Promise<string> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const now = new Date();

    const title = data.title || data.config?.title || 'Untitled Project';
    const scenes = data.scenes || data.config?.scenes || [];

    // Ensure config has the correct title synced
    const config = { ...(data.config || {}), title };

    // Update project metadata
    await client.query(`
        UPDATE projects 
        SET title = $1, config = $2, updated_at = $3
        WHERE id = $4
    `, [title, config, now, projectId]);

    // Upsert Scenes
    // First, we might need to clear old scenes or handle updates carefully.
    // For simplicity and robustness, delete existing scenes for this project and re-insert (transactional).
    // This ensures no "ghost" scenes from other projects or stale data.
    
    await client.query('DELETE FROM scenes WHERE project_id = $1', [projectId]);
    
    if (scenes && Array.isArray(scenes)) {
        for (const scene of scenes) {
             // Extract URLs to assets table for indexing/isolation if new
             // (We also store them in the scene record for easy retrieval)
             
             // Check if assets exist in assets table, if not insert them?
             // Actually, uploadAsset handles the assets table.
             // Here we just save the scene state.
             
            await client.query(`
                INSERT INTO scenes (
                    project_id, sequence_order, visual_prompt, enhanced_prompt, 
                    shot_type, camera_angle, camera_movement, 
                    lighting_style, light_source, focal_length, depth_of_field,
                    config
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `, [
                projectId, scene.id, scene.visualPrompt, scene.enhancedPrompt,
                scene.shotType, scene.cameraAngle, scene.cameraMovement,
                scene.lightingStyle, scene.lightSource, scene.focalLength, scene.depthOfField,
                JSON.stringify({ 
                    frameAnchoring: scene.frameAnchoring, 
                    referenceImages: scene.referenceImages,
                    characterIds: scene.characterIds,
                    locationId: scene.locationId,
                    narration: scene.narration,
                    durationEstimate: scene.durationEstimate,
                    status: scene.status,
                    // Store URLs in config/jsonb for easy reconstruction
                    imageUrl: scene.imageUrl,
                    videoUrl: scene.videoUrl
                })
            ]);
            
            // Note: Assets are managed separately via uploadImage/uploadVideo
            // No need to sync here as URLs are stored in scene config JSONB
        }
    }

    await client.query('COMMIT');
    return projectId; // Return ID instead of file path
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving project:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteProject(projectId: string): Promise<boolean> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    // Get assets to delete from Blob
    const res = await client.query('SELECT url FROM assets WHERE project_id = $1', [projectId]);
    const urls = res.rows.map(r => r.url);

    // Delete from DB (Cascades to scenes and assets)
    await client.query('DELETE FROM projects WHERE id = $1', [projectId]);
    
    await client.query('COMMIT');

    // Cleanup Blobs (Async)
    for (const url of urls) {
        try {
             await del(url);
        } catch (e) {
            console.warn('Failed to delete blob:', url, e);
        }
    }

    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting project:', error);
    return false;
  } finally {
    client.release();
  }
}

export async function uploadImage(
  projectId: string,
  sceneId: number,
  imageData: string | Buffer | Blob,
  contentTypeHint?: string
): Promise<string> {
  // If we are accidentally handed an already-persisted URL, just return it.
  // Treating URLs as base64 corrupts the bytes and results in broken images.
  if (
    typeof imageData === 'string' &&
    (imageData.startsWith('http://') ||
      imageData.startsWith('https://') ||
      imageData.startsWith('/api/') ||
      imageData.startsWith('/data/'))
  ) {
    return imageData;
  }

  // Normalize into Buffer when possible (so we can detect mime type)
  let data: Buffer | Blob | string = imageData;
  let detectedContentType: string | undefined = contentTypeHint;

  if (typeof imageData === 'string' && imageData.startsWith('data:')) {
    const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      detectedContentType = detectedContentType || matches[1];
      data = Buffer.from(matches[2], 'base64');
    }
  } else if (typeof imageData === 'string') {
    // If it's not a data URL, treat it as base64 when it decodes cleanly
    try {
      data = Buffer.from(imageData, 'base64');
    } catch {
      data = imageData;
    }
  }

  // If we have a Buffer, do minimal magic-byte sniffing to avoid mismatched content-type
  if (Buffer.isBuffer(data) && !detectedContentType) {
    // JPEG: FF D8 FF
    if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
      detectedContentType = 'image/jpeg';
    }
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    else if (
      data.length >= 8 &&
      data[0] === 0x89 &&
      data[1] === 0x50 &&
      data[2] === 0x4e &&
      data[3] === 0x47 &&
      data[4] === 0x0d &&
      data[5] === 0x0a &&
      data[6] === 0x1a &&
      data[7] === 0x0a
    ) {
      detectedContentType = 'image/png';
    }
    // WEBP: "RIFF....WEBP"
    else if (
      data.length >= 12 &&
      data.toString('ascii', 0, 4) === 'RIFF' &&
      data.toString('ascii', 8, 12) === 'WEBP'
    ) {
      detectedContentType = 'image/webp';
    } else {
      detectedContentType = 'application/octet-stream';
    }
  }

  const contentType = detectedContentType || 'application/octet-stream';
  const ext =
    contentType === 'image/jpeg' ? 'jpg' :
    contentType === 'image/png' ? 'png' :
    contentType === 'image/webp' ? 'webp' :
    'bin';

  // Upload to Blob (preserve real mime type)
  const path = `projects/${projectId}/images/scene-${sceneId}-${nanoid(6)}.${ext}`;
  const blob = await put(path, data, {
    access: 'public',
    contentType,
  });

  // Note: Asset URL is stored in scene config JSONB via saveProject
  // The assets table can be used for cleanup/tracking but FK to scenes is problematic
  // since scene_id here is sequence_order, not DB id
  console.log(`✅ Image uploaded to Blob: ${blob.url}`);

  return blob.url;
}

export async function uploadVideo(
  projectId: string,
  sceneId: number,
  videoData: Blob | Buffer
): Promise<string> {
  const path = `projects/${projectId}/videos/scene-${sceneId}-${nanoid(6)}.mp4`;
  
  const blob = await put(path, videoData, {
    access: 'public',
    contentType: 'video/mp4',
  });

  // Note: Asset URL is stored in scene config JSONB via saveProject
  // The assets table can be used for cleanup/tracking but FK to scenes is problematic
  console.log(`✅ Video uploaded to Blob: ${blob.url}`);

  return blob.url;
}

export async function deleteAsset(url: string): Promise<boolean> {
  const client = await getPool().connect();
  try {
    await client.query('DELETE FROM assets WHERE url = $1', [url]);
    await del(url);
    return true;
  } catch (error) {
    console.error('Error deleting asset:', error);
    return false;
  } finally {
    client.release();
  }
}

export async function updateProjectThumbnail(
  projectId: string,
  imageUrl: string
): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query('UPDATE projects SET thumbnail = $1, updated_at = NOW() WHERE id = $2', [imageUrl, projectId]);
  } finally {
    client.release();
  }
}
