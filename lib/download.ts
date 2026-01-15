import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Scene } from '@/types';

export type StitchAudioOptions = {
  enabled: boolean;
};

export type StitchClipSpec = {
  url: string;
  // seconds
  trimStartSec?: number;
  trimEndSec?: number;
  // playback rate: 0.25–2.0 (server clamps)
  speed?: number;
  // seconds
  fadeInSec?: number;
  fadeOutSec?: number;
};

export type StitchPostSpec = {
  // ffmpeg eq filter ranges (server clamps)
  // brightness: -1..1, contrast: 0..2, saturation: 0..3
  brightness?: number;
  contrast?: number;
  saturation?: number;
};

export type StitchOptions = {
  title?: string;
  audio?: StitchAudioOptions;
  clips?: StitchClipSpec[];
  post?: StitchPostSpec;
};

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
  options: StitchOptions,
  onProgress: (progress: number, message: string) => void
): Promise<Blob | null> => {
  const videoScenes = scenes.filter((s) => !!s.videoUrl);
  if (videoScenes.length < 2) return null;

  try {
    onProgress(0, 'Preparing...');
    onProgress(10, 'Stitching on server...');

    const clips: StitchClipSpec[] = options?.clips?.length
      ? options.clips
      : videoScenes.map((s) => ({
          url: s.videoUrl!,
        }));

    const res = await fetch('/api/stitch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: options?.title,
        audio: options?.audio,
        post: options?.post,
        clips,
      }),
    });

    if (!res.ok) {
      let msg = `Stitch request failed (${res.status})`;
      try {
        const data = await res.json();
        if (data?.error) msg = data.error;
      } catch (_) {
        try {
          const text = await res.text();
          if (text) msg = text;
        } catch (_) {}
      }
      throw new Error(msg);
    }

    onProgress(90, 'Downloading film...');
    const blob = await res.blob();
    onProgress(100, 'Complete!');
    return blob;
  } catch (error: any) {
    console.error('Stitching failed:', error);
    onProgress(0, `Error: ${error.message || 'Stitching failed'}`);
    throw error;
  }
};
