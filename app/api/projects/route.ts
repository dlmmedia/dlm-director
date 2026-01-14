// ========================================
// DLM DIRECTOR - PROJECTS API
// GET: List all projects
// POST: Create new project
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import {
  getProjectsIndex,
  createProject,
  saveProject
} from '@/lib/storageService';
import { createDefaultConfig } from '@/types';

export async function GET() {
  try {
    const index = await getProjectsIndex();
    // #region agent log
    // fetch('http://127.0.0.1:7243/ingest/38be5295-f513-45bf-9b9a-128482a00dc2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/projects/route.ts:18',message:'Fetched projects index',data:{projectCount: index?.projects?.length, index},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
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
    const { title } = body;

    const project = await createProject(title, {
        config: createDefaultConfig(),
        scenes: []
    });
    
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
