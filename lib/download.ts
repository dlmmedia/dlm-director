import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Scene, TransitionType } from '@/types';

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
      const response = await fetch(scene.imageUrl);
      const blob = await response.blob();
      const ext = blob.type.split('/')[1] || 'png';
      folder.file(`scene_${index + 1}_${scene.id}.${ext}`, blob);
    } catch (e) {
      console.error(`Failed to download image for scene ${scene.id}`, e);
    }
  }));

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, `${projectTitle.replace(/[^a-z0-9]/gi, '_')}_images.zip`);
};

// Stitch videos using ffmpeg.wasm
export const stitchVideos = async (
  scenes: Scene[], 
  onProgress: (progress: number, message: string) => void
): Promise<Blob | null> => {
  const videoScenes = scenes.filter(s => s.videoUrl);
  if (videoScenes.length === 0) return null;

  const ffmpeg = new FFmpeg();
  
  try {
    onProgress(0, 'Loading FFmpeg...');
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';
    
    // Load single-threaded core
    // We use toBlobURL to avoid issues with loading scripts from remote URLs directly in workers
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    onProgress(10, 'Downloading clips...');
    
    // Write all video files to ffmpeg filesystem
    const inputFiles: string[] = [];
    
    for (let i = 0; i < videoScenes.length; i++) {
      const scene = videoScenes[i];
      if (!scene.videoUrl) continue;
      
      const filename = `input${i}.mp4`;
      const data = await fetchFile(scene.videoUrl);
      await ffmpeg.writeFile(filename, data);
      inputFiles.push(filename);
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

  } catch (error) {
    console.error('Stitching failed:', error);
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
