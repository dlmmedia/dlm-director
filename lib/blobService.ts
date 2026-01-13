// ========================================
// DLM DIRECTOR - STORAGE SERVICE
// Handles Vercel Blob operations with Local Storage fallback
// ========================================

import { put, del, list, head } from '@vercel/blob';
import { nanoid } from 'nanoid';
import * as local from './localStorage';
import { ProjectMetadata, ProjectsIndex } from '@/types';

// Re-export types
export type { ProjectMetadata, ProjectsIndex };

// Feature Flag: Use Blob only if token is present
const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;
const PROJECTS_INDEX_PATH = 'projects/index.json';

let _baseUrl: string | null = null;

console.log(`Storage Service Initialized. Using ${USE_BLOB ? 'Vercel Blob' : 'Local Storage'}`);

// --- BLOB IMPLEMENTATION ---

// Helper to determine base URL
async function getBaseUrl(): Promise<string | null> {
  if (_baseUrl) return _baseUrl;

  try {
    // Try to list the index file to discover the base URL
    const { blobs } = await list({ limit: 1 });
    if (blobs.length > 0) {
      const url = blobs[0].url;
      // Extract base from any blob URL
      // Format: https://<store>.public.blob.vercel-storage.com/<path>
      const match = url.match(/^(https:\/\/[^/]+)\//);
      if (match) {
        _baseUrl = match[1];
        return _baseUrl;
      }
    }
    return null;
  } catch (error) {
    console.warn('Failed to determine Blob base URL:', error);
    return null;
  }
}

async function blobGetProjectsIndex(): Promise<ProjectsIndex> {
  try {
    // Try to fetch directly if we know the base URL (fast path)
    const baseUrl = await getBaseUrl();
    if (baseUrl) {
      try {
        const response = await fetch(`${baseUrl}/${PROJECTS_INDEX_PATH}`, { cache: 'no-store' });
        if (response.ok) {
          return await response.json() as ProjectsIndex;
        }
      } catch (e) {
        // Fallback to list if direct fetch fails (e.g. if we guessed wrong or file doesn't exist yet)
      }
    }

    // Fallback: Use list to find it (slow path / eventually consistent)
    const { blobs } = await list({ prefix: PROJECTS_INDEX_PATH });
    
    if (blobs.length === 0) {
      return { projects: [], lastUpdated: new Date().toISOString() };
    }

    const indexBlob = blobs.find(b => b.pathname === PROJECTS_INDEX_PATH) || blobs[0];
    
    // Cache the base URL if we found it
    if (!_baseUrl) {
       const match = indexBlob.url.match(/^(https:\/\/[^/]+)\//);
       if (match) _baseUrl = match[1];
    }

    const response = await fetch(indexBlob.url, { cache: 'no-store' });
    return await response.json() as ProjectsIndex;
  } catch (error) {
    console.error('Error fetching projects index from Blob:', error);
    return { projects: [], lastUpdated: new Date().toISOString() };
  }
}

async function blobUpdateProjectsIndex(index: ProjectsIndex): Promise<void> {
  const blob = await put(PROJECTS_INDEX_PATH, JSON.stringify(index, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false, // Ensure predictable URL
    cacheControlMaxAge: 0, // Ensure immediate updates
  });
  
  // Update base URL cache if needed
  if (!_baseUrl) {
      const match = blob.url.match(/^(https:\/\/[^/]+)\//);
      if (match) _baseUrl = match[1];
  }
  
  console.log('Updated projects index in Blob:', blob.url);
}

async function blobCreateProject(title: string, initialData?: any): Promise<ProjectMetadata> {
  const id = nanoid(10);
  const now = new Date().toISOString();
  
  const project: ProjectMetadata = {
    id,
    title: title || 'Untitled Project',
    createdAt: now,
    updatedAt: now,
  };

  // If initial data is provided, save it first
  if (initialData) {
    const projectPath = `projects/${id}/data.json`;
    const blob = await put(projectPath, JSON.stringify({ ...initialData, id, createdAt: now, updatedAt: now }, null, 2), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false, // Ensure predictable URL
      cacheControlMaxAge: 0, // Ensure immediate updates
    });
    
    if (!_baseUrl) {
        const match = blob.url.match(/^(https:\/\/[^/]+)\//);
        if (match) _baseUrl = match[1];
    }
  }

  // Update index
  const index = await blobGetProjectsIndex();
  index.projects.unshift(project);
  index.lastUpdated = now;
  await blobUpdateProjectsIndex(index);

  return project;
}

async function blobGetProject(projectId: string): Promise<any | null> {
  try {
    const projectPath = `projects/${projectId}/data.json`;
    
    // Fast path: Try predictable URL
    const baseUrl = await getBaseUrl();
    if (baseUrl) {
        const url = `${baseUrl}/${projectPath}`;
        try {
            const response = await fetch(url, { cache: 'no-store' });
            if (response.ok) {
                return await response.json();
            } else if (response.status === 404) {
                // Might be legacy project with random suffix, fall through to list
            }
        } catch (e) {
            // Network error, fall through
        }
    }

    // Slow path: List (for legacy projects or if base URL unknown)
    const { blobs } = await list({ prefix: projectPath });
    
    if (blobs.length === 0) {
      return null;
    }

    const response = await fetch(blobs[0].url, { cache: 'no-store' });
    return await response.json();
  } catch (error) {
    console.error('Error fetching project from Blob:', error);
    return null;
  }
}

async function blobSaveProject(projectId: string, data: any): Promise<string> {
  const projectPath = `projects/${projectId}/data.json`;
  const now = new Date().toISOString();
  
  // Save project data
  const blob = await put(projectPath, JSON.stringify({ ...data, updatedAt: now }, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false, // Ensure predictable URL
    cacheControlMaxAge: 0, // Ensure immediate updates
  });

  if (!_baseUrl) {
      const match = blob.url.match(/^(https:\/\/[^/]+)\//);
      if (match) _baseUrl = match[1];
  }

  // Update index with new timestamp
  const index = await blobGetProjectsIndex();
  const projectIndex = index.projects.findIndex(p => p.id === projectId);
  
  if (projectIndex !== -1) {
    index.projects[projectIndex].updatedAt = now;
    if (data.title) {
      index.projects[projectIndex].title = data.title;
    }
    index.lastUpdated = now;
    await blobUpdateProjectsIndex(index);
  }

  return blob.url;
}

async function blobDeleteProject(projectId: string): Promise<boolean> {
  try {
    // Delete all project files
    const { blobs } = await list({ prefix: `projects/${projectId}/` });
    
    for (const blob of blobs) {
      await del(blob.url);
    }

    // Update index
    const index = await blobGetProjectsIndex();
    index.projects = index.projects.filter(p => p.id !== projectId);
    index.lastUpdated = new Date().toISOString();
    await blobUpdateProjectsIndex(index);

    return true;
  } catch (error) {
    console.error('Error deleting project from Blob:', error);
    return false;
  }
}

async function blobUploadImage(
  projectId: string,
  sceneId: number,
  imageData: string | Buffer | Blob
): Promise<string> {
  const path = `projects/${projectId}/images/scene-${sceneId}.png`;
  
  // Convert base64 to buffer if needed
  let data: Buffer | Blob | string;
  if (typeof imageData === 'string' && imageData.startsWith('data:')) {
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    data = Buffer.from(base64Data, 'base64');
  } else if (typeof imageData === 'string') {
    // Check if it's base64 or raw string
    try {
        data = Buffer.from(imageData, 'base64');
    } catch {
        data = imageData;
    }
  } else {
    data = imageData;
  }

  const blob = await put(path, data, {
    access: 'public',
    contentType: 'image/png',
    // We keep random suffix for images to avoid caching issues when regenerating scene
    // Or we could use timestamp in filename.
    // Let's stick to default for images for now as they are not critical for "project existence"
  });

  return blob.url;
}

async function blobUploadVideo(
  projectId: string,
  sceneId: number,
  videoData: Blob | Buffer
): Promise<string> {
  const path = `projects/${projectId}/videos/scene-${sceneId}.mp4`;
  
  const blob = await put(path, videoData, {
    access: 'public',
    contentType: 'video/mp4',
  });

  return blob.url;
}

async function blobDeleteAsset(url: string): Promise<boolean> {
  try {
    await del(url);
    return true;
  } catch (error) {
    console.error('Error deleting asset from Blob:', error);
    return false;
  }
}

async function blobUpdateProjectThumbnail(
  projectId: string,
  imageUrl: string
): Promise<void> {
  const index = await blobGetProjectsIndex();
  const projectIndex = index.projects.findIndex(p => p.id === projectId);
  
  if (projectIndex !== -1) {
    index.projects[projectIndex].thumbnail = imageUrl;
    await blobUpdateProjectsIndex(index);
  }
}

// --- EXPORTED FACADE ---

export async function getProjectsIndex(): Promise<ProjectsIndex> {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/38be5295-f513-45bf-9b9a-128482a00dc2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/blobService.ts:302',message:'getProjectsIndex called',data:{USE_BLOB},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion
  return USE_BLOB ? blobGetProjectsIndex() : local.getProjectsIndex();
}

export async function updateProjectsIndex(index: ProjectsIndex): Promise<void> {
  return USE_BLOB ? blobUpdateProjectsIndex(index) : local.updateProjectsIndex(index);
}

export async function createProject(title: string, initialData?: any): Promise<ProjectMetadata> {
  return USE_BLOB ? blobCreateProject(title, initialData) : local.createProject(title, initialData);
}

export async function getProject(projectId: string): Promise<any | null> {
  return USE_BLOB ? blobGetProject(projectId) : local.getProject(projectId);
}

export async function saveProject(projectId: string, data: any): Promise<string> {
  return USE_BLOB ? blobSaveProject(projectId, data) : local.saveProject(projectId, data);
}

export async function deleteProject(projectId: string): Promise<boolean> {
  return USE_BLOB ? blobDeleteProject(projectId) : local.deleteProject(projectId);
}

export async function uploadImage(
  projectId: string,
  sceneId: number,
  imageData: string | Buffer | Blob
): Promise<string> {
  return USE_BLOB ? blobUploadImage(projectId, sceneId, imageData) : local.uploadImage(projectId, sceneId, imageData as string | Buffer);
}

export async function uploadVideo(
  projectId: string,
  sceneId: number,
  videoData: Blob | Buffer
): Promise<string> {
  return USE_BLOB ? blobUploadVideo(projectId, sceneId, videoData) : local.uploadVideo(projectId, sceneId, videoData);
}

export async function deleteAsset(url: string): Promise<boolean> {
  return USE_BLOB ? blobDeleteAsset(url) : local.deleteAsset(url);
}

export async function updateProjectThumbnail(
  projectId: string,
  imageUrl: string
): Promise<void> {
  return USE_BLOB ? blobUpdateProjectThumbnail(projectId, imageUrl) : local.updateProjectThumbnail(projectId, imageUrl);
}
