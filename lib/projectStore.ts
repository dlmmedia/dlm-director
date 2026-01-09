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
    const data = await response.json();
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
    return await response.json();
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

// --- ASSET UPLOAD ---

export async function uploadSceneImage(
  projectId: string,
  sceneId: number,
  imageData: string
): Promise<string | null> {
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        sceneId,
        type: 'image',
        data: imageData,
      }),
    });
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
    const formData = new FormData();
    formData.append('file', videoBlob, `scene-${sceneId}.mp4`);
    formData.append('projectId', projectId);
    formData.append('sceneId', sceneId.toString());
    formData.append('type', 'video');

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
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

export function debouncedSave(
  projectId: string,
  config: ProjectConfig,
  delayMs: number = 2000
): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(async () => {
    console.log('Auto-saving project:', projectId);
    await saveProject(projectId, config);
    saveTimeout = null;
  }, delayMs);
}

export function cancelPendingSave(): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
}
