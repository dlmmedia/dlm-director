import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { Scene } from '@/types';

// Helper to download a single file
export const downloadFile = async (url: string, filename: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}`);
    const blob = await response.blob();
    saveAs(blob, filename);
  } catch (error) {
    console.error("Download failed:", error);
    // Fallback to direct link for data URIs or if fetch fails (e.g. CORS on some setups)
    saveAs(url, filename);
  }
};

// Download all images as ZIP
export const downloadImagesZip = async (scenes: Scene[], projectTitle: string) => {
  const zip = new JSZip();
  const folder = zip.folder(projectTitle || 'images');
  
  const imageScenes = scenes.filter(s => s.imageUrl);
  if (imageScenes.length === 0) return;

  const promises = imageScenes.map(async (scene, i) => {
    if (!scene.imageUrl) return;
    try {
      const response = await fetch(scene.imageUrl);
      const blob = await response.blob();
      const ext = blob.type.split('/')[1] || 'png';
      folder?.file(`scene_${i + 1}_${scene.id}.${ext}`, blob);
    } catch (e) {
      console.error(`Failed to add image for scene ${scene.id}`, e);
    }
  });

  await Promise.all(promises);
  
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${projectTitle.replace(/[^a-z0-9]/gi, '_')}_images.zip`);
};

// Download all videos as ZIP
export const downloadVideosZip = async (scenes: Scene[], projectTitle: string) => {
  const zip = new JSZip();
  const folder = zip.folder(projectTitle || 'videos');
  
  const videoScenes = scenes.filter(s => s.videoUrl);
  if (videoScenes.length === 0) return;

  const promises = videoScenes.map(async (scene, i) => {
    if (!scene.videoUrl) return;
    try {
      const response = await fetch(scene.videoUrl);
      const blob = await response.blob();
      const ext = blob.type.split('/')[1] || 'mp4';
      folder?.file(`scene_${i + 1}_${scene.id}.${ext}`, blob);
    } catch (e) {
      console.error(`Failed to add video for scene ${scene.id}`, e);
    }
  });

  await Promise.all(promises);
  
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${projectTitle.replace(/[^a-z0-9]/gi, '_')}_videos.zip`);
};

// Stitch videos using ffmpeg.wasm
export const stitchVideos = async (
  scenes: Scene[], 
  onProgress: (progress: number, message: string) => void
): Promise<Blob | null> => {
  // Check for Cross-Origin Isolation
  if (typeof window !== 'undefined' && !window.crossOriginIsolated) {
      const errorMsg = "Browser is not cross-origin isolated. COOP/COEP headers required.";
      console.error(errorMsg);
      throw new Error(errorMsg);
  }

  const videoScenes = scenes.filter(s => s.videoUrl);
  if (videoScenes.length === 0) {
    return null;
  }

  const ffmpeg = new FFmpeg();
  
  // Log all ffmpeg messages
  ffmpeg.on('log', ({ message }) => {
    console.log('[FFmpeg]', message);
  });
  
  // Track progress
  ffmpeg.on('progress', ({ progress, time }) => {
    // Progress is 0-1. Convert to 50-90 range for the stitching phase
    onProgress(50 + (progress * 40), 'Stitching videos...');
  });

    try {
    onProgress(0, 'Loading FFmpeg...');
    
    // Use relative paths - let the browser resolve them against the public folder
    await ffmpeg.load({
      coreURL: '/ffmpeg/ffmpeg-core.js',
      wasmURL: '/ffmpeg/ffmpeg-core.wasm',
    });

    onProgress(10, 'Downloading clips...');
    
    // Write all video files to ffmpeg filesystem
    const inputFiles: string[] = [];
    
    for (let i = 0; i < videoScenes.length; i++) {
      const scene = videoScenes[i];
      if (!scene.videoUrl) continue;
      
      const filename = `input${i}.mp4`;
      
      try {
        onProgress(10 + Math.round((i / videoScenes.length) * 30), `Downloading clip ${i + 1}/${videoScenes.length}...`);
        const data = await fetchFile(scene.videoUrl);
        await ffmpeg.writeFile(filename, data);
        inputFiles.push(filename);
      } catch (fetchError: any) {
        console.error(`Failed to load video for scene ${scene.id}:`, fetchError);
        // Continue but skip this file? Or fail? 
        // Failing is probably safer as the output would be incomplete
        throw new Error(`Failed to download video for scene ${scene.id}`);
      }
    }

    if (inputFiles.length === 0) {
      throw new Error("No video files could be loaded.");
    }

    onProgress(40, 'Generating concat list...');
    
    // Create concat file list
    const fileListContent = inputFiles.map(f => `file '${f}'`).join('\n');
    await ffmpeg.writeFile('list.txt', fileListContent);

    onProgress(50, 'Stitching videos...');

    // Attempt 1: Copy (Fast, but requires identical codecs)
    console.log('[FFmpeg] Attempting Stream Copy...');
    let returnCode = await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', 'output.mp4']);
    
    // Attempt 2: Re-encode (Slow, but robust)
    if (returnCode !== 0) {
        console.warn('[FFmpeg] Stream Copy failed. Falling back to re-encoding...');
        onProgress(50, 'Optimizing video (this may take a while)...');
        
        // Delete partial output if any
        try { await ffmpeg.deleteFile('output.mp4'); } catch (e) {}
        
        // Re-encode with ultrafast preset for speed
        returnCode = await ffmpeg.exec([
            '-f', 'concat', 
            '-safe', '0', 
            '-i', 'list.txt', 
            '-c:v', 'libx264', 
            '-preset', 'ultrafast', 
            '-c:a', 'aac', 
            'output.mp4'
        ]);
    }

    if (returnCode !== 0) {
        throw new Error(`FFmpeg exited with code ${returnCode}`);
    }
    
    onProgress(90, 'Finalizing...');
    
    const data = await ffmpeg.readFile('output.mp4');
    const blob = new Blob([data], { type: 'video/mp4' });
    
    return blob;

  } catch (error: any) {
    console.error('Stitching failed:', error);
    onProgress(0, `Error: ${error.message || 'Stitching failed'}`);
    throw error;
  } finally {
    // Attempt to terminate if possible
    try {
      // @ts-ignore
      if (ffmpeg.terminate) ffmpeg.terminate();
    } catch (e) {
      // ignore
    }
  }
};
