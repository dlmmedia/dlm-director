import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';
import { getPool } from '@/lib/db';

export const runtime = 'nodejs';

const INDEX_PATH = 'projects/index.json';
const DEFAULT_SOURCE = 'https://dlm-director-new.vercel.app';
const ALLOWED_SOURCES = new Set<string>([
  'https://dlm-director-new.vercel.app',
  // Alternate domain Vercel assigned to this project
  'https://dlm-director-new-albertmusic102-4703s-projects.vercel.app',
]);

function clampInt(value: unknown, min: number, max: number, fallback: number) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function blobBaseUrlFromAnyBlobUrl(url: string): string | null {
  const match = url.match(/^(https:\/\/[^/]+)\//);
  return match?.[1] ?? null;
}

function normalizeSource(input: string | null): string | null {
  const raw = (input || '').trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

async function upsertProjectToNeon(client: any, projectId: string, projectData: any) {
  const title = projectData?.title || projectData?.config?.title || 'Untitled Project';
  const config = projectData?.config || {};
  const thumbnail = projectData?.thumbnail || null;
  const createdAt = projectData?.createdAt || new Date().toISOString();
  const updatedAt = projectData?.updatedAt || new Date().toISOString();

  await client.query(
    `
    INSERT INTO projects (id, title, config, thumbnail, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      config = EXCLUDED.config,
      thumbnail = EXCLUDED.thumbnail,
      updated_at = EXCLUDED.updated_at
    `,
    [projectId, title, config, thumbnail, createdAt, updatedAt]
  );

  // Replace scenes/assets for deterministic sync
  await client.query('DELETE FROM scenes WHERE project_id = $1', [projectId]);
  await client.query('DELETE FROM assets WHERE project_id = $1', [projectId]);

  const scenes = projectData?.scenes || projectData?.config?.scenes || [];
  for (const scene of scenes) {
    await client.query(
      `
      INSERT INTO scenes (
        project_id, sequence_order, visual_prompt, enhanced_prompt,
        shot_type, camera_angle, camera_movement,
        lighting_style, light_source, focal_length, depth_of_field,
        config
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (project_id, sequence_order) DO UPDATE SET
        visual_prompt = EXCLUDED.visual_prompt,
        enhanced_prompt = EXCLUDED.enhanced_prompt,
        shot_type = EXCLUDED.shot_type,
        camera_angle = EXCLUDED.camera_angle,
        camera_movement = EXCLUDED.camera_movement,
        lighting_style = EXCLUDED.lighting_style,
        light_source = EXCLUDED.light_source,
        focal_length = EXCLUDED.focal_length,
        depth_of_field = EXCLUDED.depth_of_field,
        config = EXCLUDED.config
      `,
      [
        projectId,
        scene.id,
        scene.visualPrompt,
        scene.enhancedPrompt,
        scene.shotType,
        scene.cameraAngle,
        scene.cameraMovement,
        scene.lightingStyle,
        scene.lightSource,
        scene.focalLength,
        scene.depthOfField,
        JSON.stringify({
          frameAnchoring: scene.frameAnchoring,
          referenceImages: scene.referenceImages,
          characterIds: scene.characterIds,
          locationId: scene.locationId,
          imageUrl: scene.imageUrl,
          videoUrl: scene.videoUrl,
          narration: scene.narration,
          status: scene.status,
          durationEstimate: scene.durationEstimate,
        }),
      ]
    );

    // Note: Assets are NOT inserted here because:
    // 1. URLs are already stored in scene config JSONB (imageUrl, videoUrl fields)
    // 2. assets.scene_id FK references scenes.id (auto-generated), not sequence_order
    // The assets table is used for cleanup/tracking only when uploading new media
  }
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
    const mode = (url.searchParams.get('mode') || '').trim();
    const source = normalizeSource(url.searchParams.get('source'));

    // If requested, import from the previous Vercel deployment API (fastest way to capture DB-backed projects).
    if (mode === 'vercel' || source) {
      const src = source || DEFAULT_SOURCE;
      if (!ALLOWED_SOURCES.has(src)) {
        return NextResponse.json({ error: `Source not allowed: ${src}` }, { status: 400 });
      }

      const indexRes = await fetch(`${src}/api/projects`, { cache: 'no-store' });
      if (!indexRes.ok) {
        return NextResponse.json({ error: `Failed to fetch source projects index (${indexRes.status})` }, { status: 502 });
      }
      const indexData = await indexRes.json();
      const projectIds: string[] = Array.isArray(indexData?.projects)
        ? indexData.projects
            .map((p: any) => p?.id)
            .filter((id: any): id is string => typeof id === 'string' && id.length > 0)
        : [];

      const total = projectIds.length;
      const slice = projectIds.slice(offset, offset + limit);
      console.log(`Migrating from source ${src}: projects ${offset}..${offset + slice.length - 1} (limit=${limit}) out of ${total}`);

      for (const projectId of slice) {
        try {
          const existing = await client.query('SELECT id, updated_at FROM projects WHERE id = $1', [projectId]);
          if (existing.rows.length > 0) {
            // Still fetch + upsert to ensure titles/scenes match the source of truth
            // (do not increment skipped here; treat as sync)
          }

          const res = await fetch(`${src}/api/projects/${encodeURIComponent(projectId)}`, { cache: 'no-store' });
          if (!res.ok) {
            errors.push(`${projectId}: failed to fetch (${res.status})`);
            continue;
          }
          const projectData = await res.json();
          await upsertProjectToNeon(client, projectId, projectData);
          imported++;
        } catch (e) {
          console.error(`Error importing project ${projectId} from source:`, e);
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
          ? `Source migration complete. Imported/synced: ${imported}`
          : `Source batch complete. Imported/synced: ${imported}. Next offset: ${nextOffset}`,
      });
    }

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
        
        await upsertProjectToNeon(client, projectId, projectData);

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
