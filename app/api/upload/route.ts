// ========================================
// DLM DIRECTOR - ASSET UPLOAD API
// POST: Upload images/videos to Vercel Blob
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { uploadImage, uploadVideo, updateProjectThumbnail } from '@/lib/blobService';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // Handle FormData (for video uploads)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const projectId = formData.get('projectId') as string;
      const sceneId = parseInt(formData.get('sceneId') as string, 10);
      const type = formData.get('type') as string;

      if (!file || !projectId || isNaN(sceneId)) {
        return NextResponse.json(
          { error: 'Missing required fields: file, projectId, sceneId' },
          { status: 400 }
        );
      }

      if (type === 'video') {
        const buffer = Buffer.from(await file.arrayBuffer());
        const url = await uploadVideo(projectId, sceneId, buffer);
        return NextResponse.json({ url, type: 'video' });
      }

      // Fallback to image upload
      const buffer = Buffer.from(await file.arrayBuffer());
      const url = await uploadImage(projectId, sceneId, buffer.toString('base64'));
      
      // Update thumbnail if this is scene 1
      if (sceneId === 1) {
        await updateProjectThumbnail(projectId, url);
      }

      return NextResponse.json({ url, type: 'image' });
    }

    // Handle JSON (for base64 image uploads)
    const body = await request.json();
    const { projectId, sceneId, type, data } = body;

    if (!projectId || sceneId === undefined || !type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, sceneId, type, data' },
        { status: 400 }
      );
    }

    if (type === 'image') {
      const url = await uploadImage(projectId, sceneId, data);
      
      // Update thumbnail if this is scene 1
      if (sceneId === 1) {
        await updateProjectThumbnail(projectId, url);
      }

      return NextResponse.json({ url, type: 'image' });
    }

    if (type === 'video') {
      // For video, data should be base64
      const buffer = Buffer.from(data, 'base64');
      const url = await uploadVideo(projectId, sceneId, buffer);
      return NextResponse.json({ url, type: 'video' });
    }

    return NextResponse.json(
      { error: 'Invalid type. Must be "image" or "video"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error uploading asset:', error);
    return NextResponse.json(
      { error: 'Failed to upload asset' },
      { status: 500 }
    );
  }
}
