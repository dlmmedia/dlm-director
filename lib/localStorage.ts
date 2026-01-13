import fs from 'fs/promises';
import path from 'path';
import { ProjectMetadata, ProjectsIndex } from '@/types';
import { nanoid } from 'nanoid';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const PROJECTS_INDEX_PATH = path.join(DATA_DIR, 'projects', 'index.json');

async function ensureDir(dir: string) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function ensureDataDir() {
  await ensureDir(path.join(DATA_DIR, 'projects'));
}

export async function getProjectsIndex(): Promise<ProjectsIndex> {
  try {
    await ensureDataDir();
    // #region agent log
    try {
        const stats = await fs.stat(PROJECTS_INDEX_PATH);
        fetch('http://127.0.0.1:7243/ingest/38be5295-f513-45bf-9b9a-128482a00dc2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/localStorage.ts:27',message:'Reading projects index',data:{PROJECTS_INDEX_PATH, size: stats.size},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
    } catch(e) {
        fetch('http://127.0.0.1:7243/ingest/38be5295-f513-45bf-9b9a-128482a00dc2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/localStorage.ts:29',message:'Projects index missing or error',data:{PROJECTS_INDEX_PATH, error: String(e)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
    }
    // #endregion
    const data = await fs.readFile(PROJECTS_INDEX_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { projects: [], lastUpdated: new Date().toISOString() };
  }
}

export async function updateProjectsIndex(index: ProjectsIndex): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(PROJECTS_INDEX_PATH, JSON.stringify(index, null, 2));
}

export async function createProject(title: string, initialData?: any): Promise<ProjectMetadata> {
  const id = nanoid(10);
  const now = new Date().toISOString();
  
  const project: ProjectMetadata = {
    id,
    title: title || 'Untitled Project',
    createdAt: now,
    updatedAt: now,
  };

  await ensureDir(path.join(DATA_DIR, 'projects', id));

  // Always create data.json
  const projectPath = path.join(DATA_DIR, 'projects', id, 'data.json');
  const dataToSave = initialData 
    ? { ...initialData, id, createdAt: now, updatedAt: now }
    : { ...project }; // Fallback to just metadata

  await fs.writeFile(projectPath, JSON.stringify(dataToSave, null, 2));

  const index = await getProjectsIndex();
  index.projects.unshift(project);
  index.lastUpdated = now;
  await updateProjectsIndex(index);

  return project;
}

export async function getProject(projectId: string): Promise<any | null> {
  try {
    const projectPath = path.join(DATA_DIR, 'projects', projectId, 'data.json');
    const data = await fs.readFile(projectPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function saveProject(projectId: string, data: any): Promise<string> {
  const projectDir = path.join(DATA_DIR, 'projects', projectId);
  
  try {
    await ensureDir(projectDir);
  } catch (error) {
    throw new Error(`Failed to create directory ${projectDir}: ${error}`);
  }
  
  const projectPath = path.join(projectDir, 'data.json');
  const now = new Date().toISOString();
  
  // Save project data
  try {
    await fs.writeFile(projectPath, JSON.stringify({ ...data, updatedAt: now }, null, 2));
  } catch (error) {
    throw new Error(`Failed to write project file ${projectPath}: ${error}`);
  }

  // Update index with new timestamp
  try {
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
  } catch (error) {
    console.warn('Failed to update project index (non-critical):', error);
  }

  return `/api/files/projects/${projectId}/data.json`;
}

export async function deleteProject(projectId: string): Promise<boolean> {
  try {
    const projectDir = path.join(DATA_DIR, 'projects', projectId);
    await fs.rm(projectDir, { recursive: true, force: true });

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

export async function uploadImage(
  projectId: string,
  sceneId: number,
  imageData: string | Buffer
): Promise<string> {
  const imagesDir = path.join(DATA_DIR, 'projects', projectId, 'images');
  await ensureDir(imagesDir);
  
  const fileName = `scene-${sceneId}-${Date.now()}.png`;
  const filePath = path.join(imagesDir, fileName);

  let buffer: Buffer;
  if (Buffer.isBuffer(imageData)) {
    buffer = imageData;
  } else if (typeof imageData === 'string' && imageData.startsWith('data:')) {
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    buffer = Buffer.from(base64Data, 'base64');
  } else {
    buffer = Buffer.from(imageData as string, 'base64');
  }

  await fs.writeFile(filePath, buffer);
  return `/api/files/projects/${projectId}/images/${fileName}`;
}

export async function uploadVideo(
  projectId: string,
  sceneId: number,
  videoData: Blob | Buffer
): Promise<string> {
  const videosDir = path.join(DATA_DIR, 'projects', projectId, 'videos');
  await ensureDir(videosDir);
  
  const fileName = `scene-${sceneId}-${Date.now()}.mp4`;
  const filePath = path.join(videosDir, fileName);

  let buffer: Buffer;
  if (Buffer.isBuffer(videoData)) {
    buffer = videoData;
  } else {
    buffer = Buffer.from(await (videoData as Blob).arrayBuffer());
  }

  await fs.writeFile(filePath, buffer);
  return `/api/files/projects/${projectId}/videos/${fileName}`;
}

export async function deleteAsset(url: string): Promise<boolean> {
  try {
    // URL is like /api/files/projects/... or legacy /data/projects/...
    let relativePath = '';
    
    if (url.startsWith('/api/files/')) {
       relativePath = url.substring('/api/files/'.length);
    } else if (url.startsWith('/data/')) {
       relativePath = url.substring('/data/'.length);
    } else {
       return false;
    }
    
    const filePath = path.join(DATA_DIR, relativePath);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting asset:', error);
    return false;
  }
}

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
