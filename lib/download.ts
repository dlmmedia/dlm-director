import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { fetchFile } from '@ffmpeg/util';
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
  const folder = zip.folder(`${projectTitle.replace(/[^a-z0-9]/gi, '_')}_images`);

  if (!folder) throw new Error("Failed to create zip folder");

  const imageScenes = scenes.filter(s => s.imageUrl);
  
  await Promise.all(imageScenes.map(async (scene, index) => {
    try {
      if (!scene.imageUrl) return;
      // Handle data URIs and URLs differently
      if (scene.imageUrl.startsWith('data:')) {
         const base64Data = scene.imageUrl.split(',')[1];
         folder.file(`scene_${index + 1}_${scene.id}.png`, base64Data, { base64: true });
      } else {
        const response = await fetch(scene.imageUrl, { mode: 'cors' });
        if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
        const blob = await response.blob();
        const ext = blob.type.split('/')[1] || 'png';
        folder.file(`scene_${index + 1}_${scene.id}.${ext}`, blob);
      }
    } catch (e) {
      console.error(`Failed to download image for scene ${scene.id}`, e);
    }
  }));

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `${projectTitle.replace(/[^a-z0-9]/gi, '_')}_images.zip`);
};

// Download all videos as ZIP
export const downloadVideosZip = async (scenes: Scene[], projectTitle: string) => {
  const zip = new JSZip();
  const folder = zip.folder(`${projectTitle.replace(/[^a-z0-9]/gi, '_')}_videos`);

  if (!folder) throw new Error("Failed to create zip folder");

  const videoScenes = scenes.filter(s => s.videoUrl);
  
  await Promise.all(videoScenes.map(async (scene, index) => {
    try {
      if (!scene.videoUrl) return;
      if (scene.videoUrl.startsWith('data:')) {
        const base64Data = scene.videoUrl.split(',')[1];
        folder.file(`scene_${index + 1}_${scene.id}.mp4`, base64Data, { base64: true });
      } else {
        const response = await fetch(scene.videoUrl, { mode: 'cors' });
         if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
        const blob = await response.blob();
        folder.file(`scene_${index + 1}_${scene.id}.mp4`, blob);
      }
    } catch (e) {
      console.error(`Failed to download video for scene ${scene.id}`, e);
    }
  }));

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `${projectTitle.replace(/[^a-z0-9]/gi, '_')}_videos.zip`);
};

// Stitch videos using ffmpeg.wasm
export const stitchVideos = async (
  scenes: Scene[], 
  onProgress: (progress: number, message: string) => void
): Promise<Blob | null> => {
  const videoScenes = scenes.filter(s => s.videoUrl);
  if (videoScenes.length === 0) return null;

  const ffmpeg = new FFmpeg();
  
  // Log all ffmpeg messages
  ffmpeg.on('log', ({ message }) => {
    console.log('[FFmpeg]', message);
  });
  
    try {
    onProgress(0, 'Loading FFmpeg...');
    
    // Use local files from public/ffmpeg to avoid CORS and Webpack blob import issues
    const baseURL = typeof window !== 'undefined' ? window.location.origin : '';
    
    await ffmpeg.load({
      coreURL: `${baseURL}/ffmpeg/ffmpeg-core.js`,
      wasmURL: `${baseURL}/ffmpeg/ffmpeg-core.wasm`,
    });

    onProgress(10, 'Downloading clips...');
    
    // Write all video files to ffmpeg filesystem
    const inputFiles: string[] = [];
    
    for (let i = 0; i < videoScenes.length; i++) {
      const scene = videoScenes[i];
      if (!scene.videoUrl) continue;
      
      const filename = `input${i}.mp4`;
      
      try {
        const data = await fetchFile(scene.videoUrl);
        await ffmpeg.writeFile(filename, data);
        inputFiles.push(filename);
      } catch (fetchError) {
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

    // Simple Concat (safer, faster)
    await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', 'output.mp4']);
    
    onProgress(90, 'Finalizing...');
    
    const data = await ffmpeg.readFile('output.mp4');
    const blob = new Blob([data], { type: 'video/mp4' });
    
    return blob;

  } catch (error: any) {
    console.error('Stitching failed:', error);
    onProgress(0, `Error: ${error.message || 'Stitching failed'}`);
    throw error;
  } finally {
    // Attempt to terminate if possible, but for single-threaded it's less critical
    try {
      // ffmpeg.terminate() is not always available on the instance depending on version/setup
      // but if it is, use it.
      // @ts-ignore
      if (ffmpeg.terminate) ffmpeg.terminate();
    } catch (e) {
      // ignore
    }
  }
};
