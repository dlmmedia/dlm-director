import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import { pool } from '@/lib/db';

// Migration endpoint to import projects from Vercel Blob to Neon DB
export async function POST() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN not configured' }, { status: 500 });
  }

  const client = await pool.connect();
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  try {
    // List all blobs to find project data files
    const { blobs } = await list({ prefix: 'projects/' });
    
    // Find all data.json files (these contain project data)
    const dataFiles = blobs.filter(b => b.pathname.endsWith('/data.json'));
    
    console.log(`Found ${dataFiles.length} project data files in Blob`);

    for (const blob of dataFiles) {
      try {
        // Extract project ID from path: projects/{id}/data.json
        const pathParts = blob.pathname.split('/');
        const projectId = pathParts[1];
        
        if (!projectId) continue;

        // Check if already in DB
        const existing = await client.query('SELECT id FROM projects WHERE id = $1', [projectId]);
        if (existing.rows.length > 0) {
          console.log(`Project ${projectId} already in DB, skipping`);
          skipped++;
          continue;
        }

        // Fetch project data from Blob
        const response = await fetch(blob.url, { cache: 'no-store' });
        if (!response.ok) {
          errors.push(`Failed to fetch ${projectId}: ${response.status}`);
          continue;
        }

        const text = await response.text();
        if (!text) {
          errors.push(`Empty data for ${projectId}`);
          continue;
        }

        const projectData = JSON.parse(text);
        
        // Insert into Neon
        await client.query(`
          INSERT INTO projects (id, title, config, thumbnail, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          projectId,
          projectData.title || projectData.config?.title || 'Untitled Project',
          projectData.config || {},
          projectData.thumbnail || null,
          projectData.createdAt || new Date().toISOString(),
          projectData.updatedAt || new Date().toISOString()
        ]);

        // Import scenes if present
        const scenes = projectData.scenes || projectData.config?.scenes || [];
        for (const scene of scenes) {
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
              imageUrl: scene.imageUrl,
              videoUrl: scene.videoUrl,
              narration: scene.narration,
              status: scene.status
            })
          ]);

          // Record assets
          if (scene.imageUrl) {
            await client.query(`
              INSERT INTO assets (id, project_id, scene_id, type, url)
              VALUES ($1, $2, $3, 'image', $4)
              ON CONFLICT DO NOTHING
            `, [`img-${projectId}-${scene.id}`, projectId, scene.id, scene.imageUrl]);
          }
          if (scene.videoUrl) {
            await client.query(`
              INSERT INTO assets (id, project_id, scene_id, type, url)
              VALUES ($1, $2, $3, 'video', $4)
              ON CONFLICT DO NOTHING
            `, [`vid-${projectId}-${scene.id}`, projectId, scene.id, scene.videoUrl]);
          }
        }

        console.log(`Imported project ${projectId}: ${projectData.title}`);
        imported++;
      } catch (e) {
        console.error(`Error importing project from ${blob.pathname}:`, e);
        errors.push(`${blob.pathname}: ${e}`);
      }
    }

    // Also check for index.json in blob
    const indexBlobs = blobs.filter(b => b.pathname === 'projects/index.json');
    if (indexBlobs.length > 0) {
      try {
        const indexRes = await fetch(indexBlobs[0].url, { cache: 'no-store' });
        const indexData = await indexRes.json();
        
        // Update thumbnails from index if available
        for (const proj of indexData.projects || []) {
          if (proj.thumbnail) {
            await client.query(
              'UPDATE projects SET thumbnail = $1 WHERE id = $2 AND thumbnail IS NULL',
              [proj.thumbnail, proj.id]
            );
          }
        }
      } catch (e) {
        console.warn('Could not process index.json:', e);
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      message: `Migration complete. Imported: ${imported}, Skipped: ${skipped}`
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed', details: String(error) }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'POST to this endpoint to migrate Vercel Blob projects to Neon DB' 
  });
}
