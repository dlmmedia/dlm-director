import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import mime from 'mime';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    
    // Construct file path
    // We serve files from public/data
    const filePath = path.join(process.cwd(), 'public', 'data', ...pathSegments);
    
    // Security check: ensure path is within public/data
    const dataDir = path.join(process.cwd(), 'public', 'data');
    const resolvedPath = path.resolve(filePath);
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/38be5295-f513-45bf-9b9a-128482a00dc2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/files/[...path]/route.ts:24',message:'Serving file',data:{pathSegments, resolvedPath, dataDir, exists: fs.existsSync(resolvedPath)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion

    if (!resolvedPath.startsWith(dataDir)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    try {
      await fsPromises.access(resolvedPath);
    } catch {
      return new NextResponse('File not found', { status: 404 });
    }

    const stat = await fsPromises.stat(resolvedPath);
    const fileSize = stat.size;
    const contentType = mime.getType(resolvedPath) || 'application/octet-stream';
    const range = request.headers.get('range');

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      const fileStream = fs.createReadStream(resolvedPath, { start, end });
      
      // Convert node stream to web stream
      const stream = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk) => controller.enqueue(chunk));
          fileStream.on('end', () => controller.close());
          fileStream.on('error', (err) => controller.error(err));
        }
      });

      return new NextResponse(stream, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize.toString(),
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
          'Cross-Origin-Resource-Policy': 'cross-origin',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } else {
       const fileStream = fs.createReadStream(resolvedPath);
       // Convert node stream to web stream
       const stream = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk) => controller.enqueue(chunk));
          fileStream.on('end', () => controller.close());
          fileStream.on('error', (err) => controller.error(err));
        }
      });

      return new NextResponse(stream, {
        headers: {
          'Content-Length': fileSize.toString(),
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
          'Accept-Ranges': 'bytes',
          'Cross-Origin-Resource-Policy': 'cross-origin',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
