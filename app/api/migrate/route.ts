import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';

const INDEX_PATH = 'projects/index.json';

function clampInt(value: unknown, min: number, max: number, fallback: number) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function blobBaseUrlFromAnyBlobUrl(url: string): string | null {
  const match = url.match(/^(https:\/\/[^/]+)\//);
  return match?.[1] ?? null;
}

// Migration endpoint to import projects from Vercel Blob to Neon DB
export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN not configured' }, { status: 500 });
  }

  const client = await getPool().connect();
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  try {
    const url = new URL(request.url);
    const limit = clampInt(url.searchParams.get('limit'), 1, 200, 25);
    const offset = clampInt(url.searchParams.get('offset'), 0, 1_000_000, 0);

    // Prefer using the projects index to avoid listing the entire bucket (can be slow).
    const { blobs: indexCandidates } = await list({ prefix: INDEX_PATH, limit: 10 });
    const indexBlob = indexCandidates.find((b) => b.pathname === INDEX_PATH) ?? indexCandidates[0];
    const baseUrl = indexBlob?.url ? blobBaseUrlFromAnyBlobUrl(indexBlob.url) : null;

    let projectIds: string[] = [];
    if (indexBlob?.url) {
      try {
        const indexRes = await fetch(indexBlob.url, { cache: 'no-store' });
        if (indexRes.ok) {
          const indexData = await indexRes.json();
          projectIds = Array.isArray(indexData?.projects)
            ? indexData.projects.map((p: any) => p?.id).filter((id: any): id is string => typeof id === 'string' && id.length > 0)
            : [];
        }
      } catch (e) {
        console.warn('Could not fetch/parse projects index.json, falling back to listing.', e);
      }
    }

    // Fallback: list data.json blobs under projects/ (may be expensive).
    if (projectIds.length === 0) {
      const { blobs } = await list({ prefix: 'projects/' });
      const dataFiles = blobs.filter((b) => b.pathname.endsWith('/data.json'));
      projectIds = dataFiles
        .map((b) => b.pathname.split('/')[1])
        .filter((id): id is string => !!id);
    }

    const total = projectIds.length;
    const slice = projectIds.slice(offset, offset + limit);
    console.log(`Migrating projects ${offset}..${offset + slice.length - 1} (limit=${limit}) out of ${total}`);

    async function fetchProjectData(projectId: string): Promise<any | null> {
      const projectPath = `projects/${projectId}/data.json`;

      // Fast path: predictable URL (newer writes use addRandomSuffix:false)
      if (baseUrl) {
        try {
          const res = await fetch(`${baseUrl}/${projectPath}`, { cache: 'no-store' });
          if (res.ok) {
            const text = await res.text();
            return text ? JSON.parse(text) : null;
          }
        } catch (_) {
          // fall through
        }
      }

      // Slow path: list exact prefix for legacy random-suffix blobs
      try {
        const { blobs } = await list({ prefix: projectPath, limit: 1 });
        if (blobs.length === 0) return null;
        const res = await fetch(blobs[0].url, { cache: 'no-store' });
        if (!res.ok) return null;
        const text = await res.text();
        return text ? JSON.parse(text) : null;
      } catch (_) {
        return null;
      }
    }

    for (const projectId of slice) {
      try {
        // Check if already in DB
        const existing = await client.query('SELECT id FROM projects WHERE id = $1', [projectId]);
        if (existing.rows.length > 0) {
          console.log(`Project ${projectId} already in DB, skipping`);
          skipped++;
          continue;
        }

        const projectData = await fetchProjectData(projectId);
        if (!projectData) {
          errors.push(`Missing data.json for ${projectId}`);
          continue;
        }
        
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
        console.error(`Error importing project ${projectId}:`, e);
        errors.push(`${projectId}: ${e}`);
      }
    }

    const nextOffset = offset + slice.length;
    const done = nextOffset >= total;

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      total,
      offset,
      limit,
      nextOffset: done ? null : nextOffset,
      done,
      message: done
        ? `Migration complete. Imported: ${imported}, Skipped: ${skipped}`
        : `Batch complete. Imported: ${imported}, Skipped: ${skipped}. Next offset: ${nextOffset}`
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
