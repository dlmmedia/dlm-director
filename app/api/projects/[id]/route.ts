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
import { createDefaultConfig } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Helper to remove stale project entries from index
async function cleanupStaleProject(id: string): Promise<void> {
  try {
    const index = await getProjectsIndex();
    const projectExists = index.projects.some(p => p.id === id);
    if (projectExists) {
      console.log(`Cleaning up stale project from index: ${id}`);
      index.projects = index.projects.filter(p => p.id !== id);
      index.lastUpdated = new Date().toISOString();
      await updateProjectsIndex(index);
    }
  } catch (error) {
    console.error('Error cleaning up stale project:', error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const project = await getProject(id);

    if (!project) {
      // Clean up stale entry from index if it exists
      await cleanupStaleProject(id);
      
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

    // Safety check: Ensure config object exists
    if (!updated.config) {
      if (existing && existing.config) {
        console.warn('PUT request missing config, preserving existing config');
        updated.config = existing.config;
      } else {
        console.warn('Project has no config, creating default');
        updated.config = createDefaultConfig();
        updated.config.title = updated.title || 'Untitled Project';
      }
    }

    await saveProject(id, updated);

    // Update index if title changed or just to update timestamp
    try {
      const index = await getProjectsIndex();
      const projectIndex = index.projects.findIndex(p => p.id === id);
      
      if (projectIndex !== -1) {
        let shouldUpdate = false;
        
        // Update timestamp
        if (index.projects[projectIndex].updatedAt !== updated.updatedAt) {
          index.projects[projectIndex].updatedAt = updated.updatedAt;
          shouldUpdate = true;
        }
        
        // Update title if changed in config
        if (body.config && body.config.title && body.config.title !== index.projects[projectIndex].title) {
          index.projects[projectIndex].title = body.config.title;
          shouldUpdate = true;
        }

        // Update thumbnail if available in scenes
        if (body.config && body.config.scenes && Array.isArray(body.config.scenes)) {
            // Find the first scene with a valid image URL
            const firstSceneWithImage = body.config.scenes.find((s: any) => s.imageUrl);
            if (firstSceneWithImage && firstSceneWithImage.imageUrl) {
                const newThumbnail = firstSceneWithImage.imageUrl;
                if (newThumbnail !== index.projects[projectIndex].thumbnail) {
                    index.projects[projectIndex].thumbnail = newThumbnail;
                    shouldUpdate = true;
                }
            }
        }

        if (shouldUpdate) {
          await updateProjectsIndex(index);
        }
      }
    } catch (indexError) {
      console.error('Failed to update project index during PUT:', indexError);
      // Don't fail the request if index update fails, as the project data is saved
    }

    return NextResponse.json({ success: true, updatedAt: updated.updatedAt });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update project',
        details: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
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
