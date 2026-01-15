import { NextRequest, NextResponse } from 'next/server';
import { uploadImage, uploadVideo } from '@/lib/storageService';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/38be5295-f513-45bf-9b9a-128482a00dc2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'upload/route.ts:10',message:'Upload API ENTRY',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  
  try {
    const contentType = request.headers.get('content-type') || '';
    
    let projectId: string;
    let sceneId: number;
    let type: 'image' | 'video';
    let data: Buffer;
    let contentTypeHint: string | undefined;

    // Handle both FormData and JSON requests
    if (contentType.includes('application/json')) {
      // JSON request (for base64 image data)
      const body = await request.json();
      projectId = body.projectId;
      sceneId = parseInt(body.sceneId);
      type = body.type;
      
      // Handle base64 data
      const base64Data = body.data;
      if (!base64Data) {
        return NextResponse.json({ error: 'Missing data field' }, { status: 400 });
      }

      // If caller accidentally sends a URL, just return it (avoid corrupting it via base64 decode).
      if (
        typeof base64Data === 'string' &&
        (base64Data.startsWith('http://') ||
          base64Data.startsWith('https://') ||
          base64Data.startsWith('/api/') ||
          base64Data.startsWith('/data/'))
      ) {
        return NextResponse.json({ url: base64Data });
      }
      
      // Remove data URL prefix if present
      const matches = typeof base64Data === 'string'
        ? base64Data.match(/^data:([^;]+);base64,(.+)$/)
        : null;
      if (matches) {
        contentTypeHint = matches[1];
        data = Buffer.from(matches[2], 'base64');
      } else {
        const base64Clean = String(base64Data).replace(/^data:[^;]+;base64,/, '');
        data = Buffer.from(base64Clean, 'base64');
      }
    } else {
      // FormData request (for video files or binary uploads)
      const formData = await request.formData();
      projectId = formData.get('projectId') as string;
      sceneId = parseInt(formData.get('sceneId') as string);
      type = formData.get('type') as 'image' | 'video';
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json({ error: 'Missing file' }, { status: 400 });
      }
      
      contentTypeHint = file.type || undefined;
      data = Buffer.from(await file.arrayBuffer());
    }

    if (!projectId || isNaN(sceneId)) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId and sceneId' },
        { status: 400 }
      );
    }

    let url: string;

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/38be5295-f513-45bf-9b9a-128482a00dc2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'upload/route.ts:65',message:'Before storage upload',data:{projectId,sceneId,type,dataLength:data?.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    if (type === 'image') {
      url = await uploadImage(projectId, sceneId, data, contentTypeHint);
    } else if (type === 'video') {
      url = await uploadVideo(projectId, sceneId, data);
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/38be5295-f513-45bf-9b9a-128482a00dc2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'upload/route.ts:78',message:'Upload SUCCESS',data:{url},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    return NextResponse.json({ url });
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/38be5295-f513-45bf-9b9a-128482a00dc2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'upload/route.ts:85',message:'Upload FAILED',data:{error:error?.message,stack:error?.stack?.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
