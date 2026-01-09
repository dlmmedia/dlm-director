// ========================================
// DLM DIRECTOR - PROJECTS API
// GET: List all projects
// POST: Create new project
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { 
  getProjectsIndex, 
  createProject as createProjectInBlob,
  saveProject 
} from '@/lib/blobService';
import { createDefaultConfig } from '@/types';

export async function GET() {
  try {
    const index = await getProjectsIndex();
    return NextResponse.json({ 
      projects: index.projects,
      lastUpdated: index.lastUpdated 
    });
  } catch (error) {
    console.error('Error listing projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const title = body.title || 'Untitled Project';

    // Create project metadata
    const project = await createProjectInBlob(title);

    // Create initial project data with default config
    const defaultConfig = createDefaultConfig();
    defaultConfig.title = title;

    await saveProject(project.id, {
      id: project.id,
      title,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      config: defaultConfig,
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
