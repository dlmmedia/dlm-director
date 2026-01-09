// ========================================
// DLM DIRECTOR - SINGLE PROJECT API
// GET: Fetch project by ID
// PUT: Update project
// PATCH: Rename project
// DELETE: Delete project
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { 
  getProject, 
  saveProject, 
  deleteProject as deleteProjectFromBlob,
  getProjectsIndex,
  updateProjectsIndex
} from '@/lib/blobService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const project = await getProject(id);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get existing project to merge with updates
    const existing = await getProject(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Merge and save
    const updated = {
      ...existing,
      ...body,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    };

    await saveProject(id, updated);

    return NextResponse.json({ success: true, updatedAt: updated.updatedAt });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Update project data
    const existing = await getProject(id);
    if (existing) {
      existing.title = body.title;
      if (existing.config) {
        existing.config.title = body.title;
      }
      await saveProject(id, existing);
    }

    // Update index
    const index = await getProjectsIndex();
    const projectIndex = index.projects.findIndex(p => p.id === id);
    
    if (projectIndex !== -1) {
      index.projects[projectIndex].title = body.title;
      index.projects[projectIndex].updatedAt = new Date().toISOString();
      await updateProjectsIndex(index);
    }

    return NextResponse.json({ success: true, title: body.title });
  } catch (error) {
    console.error('Error renaming project:', error);
    return NextResponse.json(
      { error: 'Failed to rename project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const success = await deleteProjectFromBlob(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete project' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
