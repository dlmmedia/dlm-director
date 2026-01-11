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
    console.log('API POST /api/projects - request body:', body);
    const title = body.title || 'Untitled Project';

    // Create default config first
    const defaultConfig = createDefaultConfig();
    defaultConfig.title = title;

    // Create project metadata and initial data atomically
    console.log('Creating project in blob with title:', title);
    const project = await createProjectInBlob(title, {
      title,
      config: defaultConfig,
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    console.error('CRITICAL Error in POST /api/projects:', error);
    return NextResponse.json(
      {
        error: 'Failed to create project',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
