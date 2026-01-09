// ========================================
// DLM DIRECTOR - BLOB STORAGE SERVICE
// Handles all Vercel Blob operations
// ========================================

import { put, del, list, head } from '@vercel/blob';
import { nanoid } from 'nanoid';

// --- TYPES ---
export interface ProjectMetadata {
  id: string;
  title: string;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectsIndex {
  projects: ProjectMetadata[];
  lastUpdated: string;
}

// --- CONSTANTS ---
const PROJECTS_INDEX_PATH = 'projects/index.json';

// --- PROJECT INDEX OPERATIONS ---

export async function getProjectsIndex(): Promise<ProjectsIndex> {
  try {
    const { blobs } = await list({ prefix: PROJECTS_INDEX_PATH });
    
    if (blobs.length === 0) {
      return { projects: [], lastUpdated: new Date().toISOString() };
    }

    const response = await fetch(blobs[0].url);
    const data = await response.json();
    return data as ProjectsIndex;
  } catch (error) {
    console.error('Error fetching projects index:', error);
    return { projects: [], lastUpdated: new Date().toISOString() };
  }
}

export async function updateProjectsIndex(index: ProjectsIndex): Promise<void> {
  const blob = await put(PROJECTS_INDEX_PATH, JSON.stringify(index, null, 2), {
    access: 'public',
    contentType: 'application/json',
  });
  console.log('Updated projects index:', blob.url);
}

// --- PROJECT CRUD ---

export async function createProject(title: string): Promise<ProjectMetadata> {
  const id = nanoid(10);
  const now = new Date().toISOString();
  
  const project: ProjectMetadata = {
    id,
    title: title || 'Untitled Project',
    createdAt: now,
    updatedAt: now,
  };

  // Update index
  const index = await getProjectsIndex();
  index.projects.unshift(project);
  index.lastUpdated = now;
  await updateProjectsIndex(index);

  return project;
}

export async function getProject(projectId: string): Promise<any | null> {
  try {
    const projectPath = `projects/${projectId}/data.json`;
    const { blobs } = await list({ prefix: projectPath });
    
    if (blobs.length === 0) {
      return null;
    }

    const response = await fetch(blobs[0].url);
    return await response.json();
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
}

export async function saveProject(projectId: string, data: any): Promise<string> {
  const projectPath = `projects/${projectId}/data.json`;
  const now = new Date().toISOString();
  
  // Save project data
  const blob = await put(projectPath, JSON.stringify({ ...data, updatedAt: now }, null, 2), {
    access: 'public',
    contentType: 'application/json',
  });

  // Update index with new timestamp
  const index = await getProjectsIndex();
  const projectIndex = index.projects.findIndex(p => p.id === projectId);
  
  if (projectIndex !== -1) {
    index.projects[projectIndex].updatedAt = now;
    if (data.title) {
      index.projects[projectIndex].title = data.title;
    }
    index.lastUpdated = now;
    await updateProjectsIndex(index);
  }

  return blob.url;
}

export async function deleteProject(projectId: string): Promise<boolean> {
  try {
    // Delete all project files
    const { blobs } = await list({ prefix: `projects/${projectId}/` });
    
    for (const blob of blobs) {
      await del(blob.url);
    }

    // Update index
    const index = await getProjectsIndex();
    index.projects = index.projects.filter(p => p.id !== projectId);
    index.lastUpdated = new Date().toISOString();
    await updateProjectsIndex(index);

    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
    return false;
  }
}

// --- ASSET UPLOAD ---

export async function uploadImage(
  projectId: string,
  sceneId: number,
  imageData: string // base64 or Blob
): Promise<string> {
  const path = `projects/${projectId}/images/scene-${sceneId}.png`;
  
  // Convert base64 to buffer if needed
  let data: Buffer | Blob;
  if (typeof imageData === 'string' && imageData.startsWith('data:')) {
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    data = Buffer.from(base64Data, 'base64');
  } else if (typeof imageData === 'string') {
    data = Buffer.from(imageData, 'base64');
  } else {
    data = imageData;
  }

  const blob = await put(path, data, {
    access: 'public',
    contentType: 'image/png',
  });

  return blob.url;
}

export async function uploadVideo(
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

export async function deleteAsset(url: string): Promise<boolean> {
  try {
    await del(url);
    return true;
  } catch (error) {
    console.error('Error deleting asset:', error);
    return false;
  }
}

// --- THUMBNAIL ---

export async function updateProjectThumbnail(
  projectId: string,
  imageUrl: string
): Promise<void> {
  const index = await getProjectsIndex();
  const projectIndex = index.projects.findIndex(p => p.id === projectId);
  
  if (projectIndex !== -1) {
    index.projects[projectIndex].thumbnail = imageUrl;
    await updateProjectsIndex(index);
  }
}
