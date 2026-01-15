// ========================================
// DLM DIRECTOR - PROJECT STORE
// Client-side project state management
// ========================================

import { ProjectConfig, createDefaultConfig } from '../types';

export interface SavedProject {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  config: ProjectConfig;
}

export interface ProjectListItem {
  id: string;
  title: string;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

// --- API CALLS ---

export async function fetchProjects(): Promise<ProjectListItem[]> {
  try {
    const response = await fetch('/api/projects');
    if (!response.ok) throw new Error('Failed to fetch projects');
    
    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : { projects: [] };
    } catch (e) {
      console.warn('Failed to parse projects response:', e);
      data = { projects: [] };
    }

    return data.projects || [];
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
}

export async function fetchProject(id: string): Promise<SavedProject | null> {
  try {
    const response = await fetch(`/api/projects/${id}`);
    if (!response.ok) return null;
    
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
}

export async function createProject(title?: string): Promise<ProjectListItem | null> {
  try {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title || 'Untitled Project' }),
    });
    if (!response.ok) throw new Error('Failed to create project');
    return await response.json();
  } catch (error) {
    console.error('Error creating project:', error);
    return null;
  }
}

export async function saveProject(
  id: string,
  config: ProjectConfig
): Promise<boolean> {
  try {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error saving project:', error);
    return false;
  }
}

export async function deleteProject(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
    });
    return response.ok;
  } catch (error) {
    console.error('Error deleting project:', error);
    return false;
  }
}

export async function renameProject(id: string, title: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error renaming project:', error);
    return false;
  }
}

// Helper for timeouts
const withTimeout = <T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(errorMsg)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
};

// --- ASSET UPLOAD ---

export async function uploadSceneImage(
  projectId: string,
  sceneId: number,
  imageData: string
): Promise<string | null> {
  try {
    // If the "image" is already a URL (e.g. server-side persisted), do not upload again.
    if (
      imageData.startsWith('http://') ||
      imageData.startsWith('https://') ||
      imageData.startsWith('/') ||
      imageData.startsWith('/api/') ||
      imageData.startsWith('/data/')
    ) {
      return imageData;
    }

    console.log(`📤 Uploading image for scene ${sceneId} to storage...`);

    // Prefer multipart upload to avoid huge JSON payload limits.
    let mimeType = 'image/png';
    let base64 = imageData;
    if (imageData.startsWith('data:')) {
      const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1] || mimeType;
        base64 = matches[2] || '';
      }
    }

    const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const file = new Blob([binary], { type: mimeType });

    const formData = new FormData();
    formData.append('file', file, `scene-${sceneId}.${mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/webp' ? 'webp' : 'png'}`);
    formData.append('projectId', projectId);
    formData.append('sceneId', sceneId.toString());
    formData.append('type', 'image');

    const response = await withTimeout(fetch('/api/upload', {
      method: 'POST',
      body: formData,
    }), 60000, "Image upload timed out"); // 60s timeout for large images

    if (!response.ok) throw new Error('Failed to upload image');
    const result = await response.json();
    return result.url;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
}

export async function uploadSceneVideo(
  projectId: string,
  sceneId: number,
  videoBlob: Blob
): Promise<string | null> {
  try {
    console.log(`📤 Uploading video for scene ${sceneId} to Blob...`);
    const formData = new FormData();
    formData.append('file', videoBlob, `scene-${sceneId}.mp4`);
    formData.append('projectId', projectId);
    formData.append('sceneId', sceneId.toString());
    formData.append('type', 'video');

    const response = await withTimeout(fetch('/api/upload', {
      method: 'POST',
      body: formData,
    }), 60000, "Video upload timed out"); // 60s timeout for video

    if (!response.ok) throw new Error('Failed to upload video');
    const result = await response.json();
    return result.url;
  } catch (error) {
    console.error('Error uploading video:', error);
    return null;
  }
}

// --- DEBOUNCED AUTO-SAVE ---

let saveTimeout: NodeJS.Timeout | null = null;
let pendingSave: { projectId: string; config: ProjectConfig } | null = null;

export function debouncedSave(
  projectId: string,
  config: ProjectConfig,
  delayMs: number = 2000
): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  // Track the pending save data
  pendingSave = { projectId, config };

  saveTimeout = setTimeout(async () => {
    console.log('Auto-saving project:', projectId);
    const result = await saveProject(projectId, config);
    if (result) {
      console.log('✅ Auto-save completed for:', projectId);
    } else {
      console.error('❌ Auto-save failed for:', projectId);
    }
    saveTimeout = null;
    pendingSave = null;
  }, delayMs);
}

export function cancelPendingSave(): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  pendingSave = null;
}

// Flush any pending save immediately (for beforeunload)
export async function flushPendingSave(): Promise<boolean> {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  
  if (pendingSave) {
    console.log('Flushing pending save for:', pendingSave.projectId);
    const result = await saveProject(pendingSave.projectId, pendingSave.config);
    pendingSave = null;
    return result;
  }
  
  return true;
}

// Check if there's a pending save
export function hasPendingSave(): boolean {
  return pendingSave !== null;
}
