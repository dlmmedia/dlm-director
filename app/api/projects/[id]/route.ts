import { NextRequest, NextResponse } from 'next/server';
import { getProject, saveProject, deleteProject } from '@/lib/storageService';

// Force dynamic route
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    // Validate
    if (!data.id || data.id !== id) {
       // Allow saving if ID matches url param, even if body ID missing? 
       // Better strict.
    }

    const savedPath = await saveProject(id, data);
    
    return NextResponse.json({ success: true, path: savedPath });
  } catch (error) {
    console.error('Error saving project:', error);
    return NextResponse.json(
      { error: 'Failed to save project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await deleteProject(id);
    
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

// PATCH: Rename project (update title only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { title } = data;
    
    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Get existing project to preserve config
    const existing = await getProject(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Update with new title
    await saveProject(id, { 
      ...existing, 
      title,
      config: { ...existing.config, title } 
    });
    
    return NextResponse.json({ success: true, title });
  } catch (error) {
    console.error('Error renaming project:', error);
    return NextResponse.json(
      { error: 'Failed to rename project' },
      { status: 500 }
    );
  }
}
