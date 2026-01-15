import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectConfig, VideoModel, Scene } from '@/types';
import { saveAs } from 'file-saver';
import { 
  LoadingSpinner, 
  VideoIcon, 
  PlayIcon,
  SaveIcon,
  SettingsIcon,
  PlusIcon,
  XIcon,
  MoreIcon,
  TrashIcon,
  ChevronDownIcon,
  SparkleIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@/components/Icons';
import { ModelSelector } from '@/components/ModelSelector';
import { VideoGenerationSettings } from '@/components/VideoGenerationSettings';
import { 
  downloadFile, 
  downloadImagesZip, 
  downloadVideosZip,
  stitchVideos,
  type StitchClipSpec,
  type StitchOptions
} from '@/lib/download';

interface ProductionStepProps {
  config: ProjectConfig;
  onUpdateConfig?: (updates: Partial<ProjectConfig>) => void;
  generatingAllVideos: boolean;
  onGenerateAllVideos: () => void;
  onShowPlayer: () => void;
  onGenerateImage: (sceneId: number, revisionNote?: string) => void;
  onGenerateVideo: (sceneId: number, revisionNote?: string) => void;
  onExtendVideo?: (sceneId: number) => void;
  onCancelGeneration?: (sceneId: number) => void;
  onAddScene?: () => void;
  onDeleteScene?: (sceneId: number) => void;
}

export default function ProductionStep({
  config,
  onUpdateConfig,
  generatingAllVideos,
  onGenerateAllVideos,
  onShowPlayer,
  onGenerateImage,
  onGenerateVideo,
  onExtendVideo,
  onCancelGeneration,
  onAddScene,
  onDeleteScene
}: ProductionStepProps) {
  
  const [stitching, setStitching] = useState(false);
  const [stitchProgress, setStitchProgress] = useState(0);
  const [stitchStatus, setStitchStatus] = useState('');
  const [showStitchDialog, setShowStitchDialog] = useState(false);
  const [stitchAudioEnabled, setStitchAudioEnabled] = useState(true);
  const [postBrightness, setPostBrightness] = useState(0); // -1..1
  const [postContrast, setPostContrast] = useState(1); // 0..2
  const [postSaturation, setPostSaturation] = useState(1); // 0..3
  const [clipEdits, setClipEdits] = useState<Record<number, Omit<StitchClipSpec, 'url'>>>({});
  const [playingSceneId, setPlayingSceneId] = useState<number | null>(null);
  const [settingsSceneId, setSettingsSceneId] = useState<number | null>(null);
  const [menuSceneId, setMenuSceneId] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Safe play handling
  const videoRefs = useRef<{[key: number]: HTMLVideoElement | null}>({});

  // Helper to update a specific scene
  const handleUpdateScene = (sceneId: number, updates: Partial<Scene>) => {
    if (!onUpdateConfig) return;
    const newScenes = config.scenes.map(s => s.id === sceneId ? { ...s, ...updates } : s);
    onUpdateConfig({ scenes: newScenes });
  };

  // Helper to reorder scenes
  const handleMoveScene = (index: number, direction: 'up' | 'down') => {
    if (!onUpdateConfig) return;
    
    const newScenes = [...config.scenes];
    if (direction === 'up' && index > 0) {
      [newScenes[index], newScenes[index - 1]] = [newScenes[index - 1], newScenes[index]];
    } else if (direction === 'down' && index < newScenes.length - 1) {
      [newScenes[index], newScenes[index + 1]] = [newScenes[index + 1], newScenes[index]];
    }
    
    onUpdateConfig({ scenes: newScenes });
  };

  // Calculate stats
  const totalDuration = config.scenes.reduce((acc, s) => acc + s.durationEstimate, 0);
  const imagesReady = config.scenes.filter(s => s.imageUrl).length;
  const videosReady = config.scenes.filter(s => s.videoUrl).length;

  const handleDownloadAllImages = async () => {
    try {
      await downloadImagesZip(config.scenes, config.title || 'project');
    } catch (e) {
      console.error("Failed to download images", e);
    }
  };

  const handleDownloadAllVideos = async () => {
    try {
      await downloadVideosZip(config.scenes, config.title || 'project');
    } catch (e) {
      console.error("Failed to download videos", e);
    }
  };

  const handleStitchAndDownload = async (options: StitchOptions) => {
    setStitching(true);
    setStitchProgress(0);
    setStitchStatus('Initializing...');
    try {
      const blob = await stitchVideos(config.scenes, options, (progress, msg) => {
        setStitchProgress(progress);
        setStitchStatus(msg);
      });
      
      if (blob) {
        saveAs(blob, `${config.title || 'film'}_stitched.mp4`);
        setStitchStatus('Complete!');
      }
    } catch (e: any) {
      console.error("Failed to stitch videos", e);
      setStitchStatus(`Error: ${e.message}`);
    } finally {
      setTimeout(() => {
        setStitching(false);
        setStitchStatus('');
      }, 3000);
    }
  };

  const videoScenes = config.scenes.filter((s) => !!s.videoUrl);
  const estimatedDurationSec = videoScenes.reduce((acc, s) => {
    const edit = clipEdits[s.id] || {};
    const base = s.durationEstimate || 0;
    const speed = typeof edit.speed === 'number' && edit.speed > 0 ? edit.speed : 1;
    const trimStart = typeof edit.trimStartSec === 'number' ? edit.trimStartSec : 0;
    const trimEnd = typeof edit.trimEndSec === 'number' ? edit.trimEndSec : undefined;
    const trimmed = trimEnd !== undefined ? Math.max(0, trimEnd - trimStart) : Math.max(0, base - trimStart);
    return acc + (trimmed / speed);
  }, 0);
  
  const handlePlay = (sceneId: number) => {
      setPlayingSceneId(sceneId);
  };

  const settingsScene = settingsSceneId
    ? config.scenes.find(s => s.id === settingsSceneId) || null
    : null;

  return (
    <div className="w-full">
      <div className="w-full px-4 md:px-12 py-8 space-y-8">
        <div>
        <div className="flex justify-between items-end flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-light text-white mb-3">Production Studio</h2>
            <div className="flex gap-6 text-sm">
              <span className="text-gray-400">
                <strong className="text-blue-400">{imagesReady}</strong>/{config.scenes.length} Images
              </span>
              <span className="text-gray-400">
                <strong className="text-green-400">{videosReady}</strong>/{config.scenes.length} Videos
              </span>
              <span className="text-gray-400">
                {totalDuration}s Total
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {onUpdateConfig && (
              <div className="flex items-center gap-4">
                {onAddScene && (
                  <button onClick={onAddScene} className="btn-ghost">
                    <PlusIcon />
                    <span>Add Scene</span>
                  </button>
                )}
                <label className="flex items-center gap-2 cursor-pointer bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={config.audioEnabled || false}
                    onChange={(e) => onUpdateConfig({ audioEnabled: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-500 text-dlm-accent focus:ring-dlm-accent bg-transparent"
                  />
                  <span className="text-xs font-medium text-gray-300">Generate Audio</span>
                </label>
                <ModelSelector 
                  currentModel={config.videoModel} 
                  onSelect={(model) => onUpdateConfig && onUpdateConfig({ videoModel: model })}
                  disabled={generatingAllVideos}
                />
              </div>
            )}

            <div className="h-8 w-px bg-white/10 mx-2" />

            <div className="flex flex-col gap-2">
              <button 
                onClick={handleDownloadAllImages}
                disabled={imagesReady === 0}
                className="btn-ghost py-1 text-xs"
                title="Download all images as ZIP"
              >
                <SaveIcon />
                <span className="hidden xl:inline ml-2">Images</span>
              </button>
              <button 
                onClick={handleDownloadAllVideos}
                disabled={videosReady === 0}
                className="btn-ghost py-1 text-xs"
                title="Download all videos as ZIP"
              >
                <VideoIcon />
                <span className="hidden xl:inline ml-2">Videos</span>
              </button>
            </div>
            
            <button 
              onClick={() => setShowStitchDialog(true)}
              disabled={videosReady < 2 || stitching}
              className={`relative btn-ghost ${stitching ? 'opacity-100 cursor-not-allowed' : ''}`}
              title="Download stitched video"
            >
              {stitching ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size={14} color="currentColor" />
                  <span className="text-xs w-24 text-left truncate">{stitchStatus || `${Math.round(stitchProgress)}%`}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                   <VideoIcon />
                   <span>Download Film</span>
                </div>
              )}
            </button>

            <div className="h-8 w-px bg-white/10 mx-2" />

            <button 
              onClick={onGenerateAllVideos}
              disabled={generatingAllVideos || imagesReady === 0}
              className="btn-primary disabled:opacity-50"
            >
              {generatingAllVideos ? (
                <>
                  <LoadingSpinner size={18} color="#000" />
                  <span>Rendering Queue...</span>
                </>
              ) : (
                <>
                  <span>Render All Videos</span>
                  <VideoIcon />
                </>
              )}
            </button>
            <button 
              onClick={onShowPlayer}
              disabled={videosReady === 0}
              className="btn-secondary disabled:opacity-50"
            >
              <span>Watch Film</span>
              <PlayIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="card-elevated p-4">
        <div className="flex gap-1">
          {config.scenes.map((scene) => (
            <div 
              key={scene.id}
              className="flex-1 h-2 rounded-full relative overflow-hidden bg-white/10"
            >
              <div
                className={`absolute inset-0 rounded-full transition-all duration-500 ${
                  scene.videoUrl ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                  scene.imageUrl ? 'bg-gradient-to-r from-blue-500 to-cyan-400' :
                  scene.status === 'generating_image' || scene.status === 'generating_video' ? 'bg-yellow-500' :
                  scene.status === 'error' ? 'bg-red-500' :
                  'bg-white/10'
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Scene Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {config.scenes.map((scene, idx) => (
          <div
            key={scene.id}
            className="card-elevated overflow-hidden relative group flex flex-col h-full border-t-2 border-t-transparent hover:border-t-dlm-accent transition-all duration-300"
            onClick={() => setMenuSceneId(null)}
          >
            {/* Status Badge - OSD Style */}
            <div className="absolute top-4 left-4 z-20 pointer-events-none">
              <div className={`px-3 py-1.5 rounded bg-black/80 backdrop-blur-md border border-white/10 font-mono text-[10px] font-bold tracking-widest flex items-center gap-2 shadow-lg ${
                scene.status === 'pending' ? 'text-gray-400' :
                scene.status === 'generating_image' ? 'text-yellow-400 border-yellow-500/30' :
                scene.status === 'image_ready' ? 'text-blue-400 border-blue-500/30' :
                scene.status === 'generating_video' ? 'text-purple-400 border-purple-500/30' :
                scene.status === 'video_ready' ? 'text-green-400 border-green-500/30' :
                'text-red-400 border-red-500/30'
              }`}>
                {scene.status === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />}
                {scene.status === 'generating_image' && <LoadingSpinner size={10} color="currentColor" />}
                {scene.status === 'image_ready' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                {scene.status === 'generating_video' && <LoadingSpinner size={10} color="currentColor" />}
                {scene.status === 'video_ready' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                
                {scene.status === 'pending' && 'STANDBY'}
                {scene.status === 'generating_image' && 'PROCESSING IMG'}
                {scene.status === 'image_ready' && 'IMG LOCK'}
                {scene.status === 'generating_video' && 'RENDERING VEO'}
                {scene.status === 'video_ready' && 'REC COMPLETE'}
                {scene.status === 'error' && 'SYSTEM ERROR'}
              </div>
            </div>

            {/* Main Visual Area */}
            <div className="aspect-video bg-black/50 relative flex items-center justify-center overflow-hidden border-b border-white/5">
              {playingSceneId === scene.id && scene.videoUrl ? (
                <video 
                  ref={el => { videoRefs.current[scene.id] = el; }}
                  src={scene.videoUrl} 
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover" 
                  autoPlay
                  controls 
                  playsInline
                  onEnded={() => setPlayingSceneId(null)}
                />
              ) : scene.imageUrl ? (
                <>
                  <img 
                    src={scene.imageUrl} 
                    crossOrigin="anonymous"
                    alt={`Scene ${scene.id}`} 
                    className="w-full h-full object-cover cursor-zoom-in transition-transform duration-700 group-hover:scale-105"
                    onClick={() => setPreviewImage(scene.imageUrl!)}
                  />
                  {scene.videoUrl && (
                    <div 
                      className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                      onClick={() => handlePlay(scene.id)}
                    >
                      <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white shadow-2xl border border-white/20 transform hover:scale-110 transition-all group/play">
                        <div className="group-hover/play:text-dlm-accent transition-colors">
                            <PlayIcon />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-gray-600 flex flex-col items-center gap-3">
                  {scene.status === 'generating_image' ? (
                    <>
                        <LoadingSpinner size={32} />
                        <span className="text-[10px] font-mono tracking-widest uppercase animate-pulse">Generating...</span>
                    </>
                  ) : (
                    <span className="text-[10px] font-mono tracking-widest uppercase opacity-50">No Signal</span>
                  )}
                </div>
              )}
            </div>

            {/* Scene Info */}
            <div className="p-7 flex flex-col flex-grow gap-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="shrink-0 text-dlm-accent font-bold font-mono text-xs tracking-wider bg-dlm-accent/10 px-2 py-1 rounded border border-dlm-accent/20">
                    SCENE {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="text-xs text-gray-500 font-mono tracking-wider shrink-0">{scene.durationEstimate}S</span>
                </div>

                {/* Card Menu */}
                <div className="relative shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuSceneId(menuSceneId === scene.id ? null : scene.id);
                    }}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors"
                    title="Scene actions"
                    aria-haspopup="menu"
                    aria-expanded={menuSceneId === scene.id}
                  >
                    <MoreIcon />
                  </button>

                  <AnimatePresence>
                    {menuSceneId === scene.id && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-black/90 backdrop-blur-md shadow-2xl z-30 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                        role="menu"
                      >
                        <div className="px-3 py-2 text-[10px] font-mono tracking-widest uppercase text-gray-500 border-b border-white/10">
                          Scene {idx + 1}
                        </div>

                        <div className="p-2 space-y-1">
                          <button
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-white/10 transition-colors disabled:opacity-30"
                            onClick={() => { handleMoveScene(idx, 'up'); setMenuSceneId(null); }}
                            disabled={idx === 0}
                            role="menuitem"
                            title="Move scene up"
                          >
                            <ArrowUpIcon />
                            <span>Move up</span>
                          </button>
                          <button
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-white/10 transition-colors disabled:opacity-30"
                            onClick={() => { handleMoveScene(idx, 'down'); setMenuSceneId(null); }}
                            disabled={idx === config.scenes.length - 1}
                            role="menuitem"
                            title="Move scene down"
                          >
                            <ArrowDownIcon />
                            <span>Move down</span>
                          </button>

                          {onUpdateConfig && (
                            <button
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-white/10 transition-colors"
                              onClick={() => { setSettingsSceneId(scene.id); setMenuSceneId(null); }}
                              role="menuitem"
                              title="Open video generation settings"
                            >
                              <SettingsIcon />
                              <span>Settings</span>
                            </button>
                          )}

                          {scene.imageUrl && (
                            <button
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-white/10 transition-colors"
                              onClick={() => { downloadFile(scene.imageUrl!, `scene_${scene.id}.png`); setMenuSceneId(null); }}
                              role="menuitem"
                            >
                              <SaveIcon />
                              <span>Download image</span>
                            </button>
                          )}
                          {scene.videoUrl && (
                            <button
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-white/10 transition-colors"
                              onClick={() => { downloadFile(scene.videoUrl!, `scene_${scene.id}.mp4`); setMenuSceneId(null); }}
                              role="menuitem"
                            >
                              <VideoIcon />
                              <span>Download video</span>
                            </button>
                          )}

                          {scene.videoUrl && onExtendVideo && (
                            <button
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-white/10 transition-colors disabled:opacity-30"
                              onClick={() => { onExtendVideo(scene.id); setMenuSceneId(null); }}
                              disabled={scene.status === 'generating_video'}
                              role="menuitem"
                            >
                              <PlusIcon />
                              <span>Extend video</span>
                            </button>
                          )}

                          {onDeleteScene && (
                            <>
                              <div className="h-px bg-white/10 my-1" />
                              <button
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-300 hover:bg-red-500/10 transition-colors"
                                onClick={() => {
                                  if (confirm(`Delete Scene ${idx + 1}? This cannot be undone.`)) {
                                    onDeleteScene(scene.id);
                                  }
                                  setMenuSceneId(null);
                                }}
                                role="menuitem"
                              >
                                <TrashIcon />
                                <span>Delete scene</span>
                              </button>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <p className="text-gray-300 text-sm leading-relaxed min-h-[3rem]">{scene.narration}</p>
              
              {/* Cinematography tags */}
              <div className="flex flex-wrap gap-2">
                {[scene.shotType, scene.cameraMovement, scene.lightingStyle].map((tag, i) => (
                    <span key={i} className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-white/5 border border-white/5 text-gray-400 font-mono">
                      {tag.split(' ')[0]}
                    </span>
                ))}
              </div>

              {/* Refine (collapsible to avoid cramped cards) */}
              {(scene.imageUrl || scene.videoUrl) && (
                <details className="rounded-xl border border-white/10 bg-black/20 overflow-hidden group">
                  <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-gray-200">Refine</div>
                      <div className="text-[11px] text-gray-500 truncate">
                        Notes for regeneration / re-rendering
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-[10px] font-mono tracking-widest text-gray-500 group-open:text-gray-300">
                        {scene.imageRevisionNote || scene.videoRevisionNote ? 'EDITED' : 'ADD NOTE'}
                      </div>
                      <div className="text-gray-500 group-open:text-gray-300 transition-transform duration-200 group-open:rotate-180">
                        <ChevronDownIcon />
                      </div>
                    </div>
                  </summary>
                  <div className="p-4 space-y-4 border-t border-white/10">
                    {scene.imageUrl && (
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                          Image note
                        </label>
                        <textarea
                          value={scene.imageRevisionNote || ''}
                          onChange={(e) => handleUpdateScene(scene.id, { imageRevisionNote: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder:text-gray-600 resize-none"
                          placeholder="e.g. lower camera angle; fix composition; reduce highlights; move subject left"
                          rows={2}
                        />
                      </div>
                    )}
                    {scene.videoUrl && (
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                          Video note
                        </label>
                        <textarea
                          value={scene.videoRevisionNote || ''}
                          onChange={(e) => handleUpdateScene(scene.id, { videoRevisionNote: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder:text-gray-600 resize-none"
                          placeholder="e.g. slower push-in; less shake; keep framing consistent; reduce brightness"
                          rows={2}
                        />
                      </div>
                    )}
                  </div>
                </details>
              )}
              
              {/* Action Buttons */}
              <div className="mt-auto pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    {scene.status === 'generating_image' && onCancelGeneration && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onCancelGeneration(scene.id); }}
                        className="absolute top-2 right-2 p-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-lg border border-red-500/20 transition-colors"
                        title="Cancel image generation"
                      >
                        <XIcon />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); onGenerateImage(scene.id, scene.imageRevisionNote); }}
                      disabled={scene.status === 'generating_image'}
                      className={`w-full text-left p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-50 min-h-[84px] ${
                        scene.status === 'generating_image' && onCancelGeneration ? 'pr-12' : ''
                      }`}
                      title={scene.imageUrl ? 'Regenerate image' : 'Generate image'}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-black/30 border border-white/10 flex items-center justify-center text-white shrink-0">
                          {scene.status === 'generating_image' ? (
                            <LoadingSpinner size={16} color="currentColor" />
                          ) : (
                            <SparkleIcon />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold uppercase tracking-wide text-white leading-tight">
                            {scene.status === 'generating_image'
                              ? 'Generating…'
                              : (scene.imageUrl ? 'Regenerate image' : 'Generate image')}
                          </div>
                          <div className="text-[11px] text-gray-500 leading-snug">
                            Uses refine note (optional)
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="relative">
                    {scene.status === 'generating_video' && onCancelGeneration && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onCancelGeneration(scene.id); }}
                        className="absolute top-2 right-2 p-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-lg border border-red-500/20 transition-colors"
                        title="Cancel video generation"
                      >
                        <XIcon />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); onGenerateVideo(scene.id, scene.videoRevisionNote); }}
                      disabled={!scene.imageUrl || (scene.status === 'generating_video' && !scene.videoUrl)}
                      className={`w-full text-left p-4 rounded-xl transition-all disabled:opacity-30 min-h-[84px] ${
                        scene.videoUrl
                          ? 'border border-green-500/20 bg-green-500/10 hover:bg-green-500/20'
                          : 'bg-gradient-to-r from-dlm-accent to-yellow-500 text-black hover:brightness-110 border-0'
                      } ${scene.status === 'generating_video' && onCancelGeneration ? 'pr-12' : ''}`}
                      title={scene.videoUrl ? 'Re-render video' : 'Render video'}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                            scene.videoUrl
                              ? 'bg-black/30 border-green-500/20 text-green-200'
                              : 'bg-black/20 border-black/20 text-black'
                          }`}
                        >
                          {scene.status === 'generating_video' ? (
                            <LoadingSpinner size={16} color="currentColor" />
                          ) : (
                            <VideoIcon />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className={`text-xs font-bold uppercase tracking-wide leading-tight ${scene.videoUrl ? 'text-green-200' : 'text-black'}`}>
                            {scene.videoUrl
                              ? 'Re-render video'
                              : (scene.status === 'generating_video' ? 'Rendering…' : 'Render video')}
                          </div>
                          <div className={`text-[11px] leading-snug ${scene.videoUrl ? 'text-green-200/60' : 'text-black/60'}`}>
                            Requires an image
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
              
              {scene.errorMsg && (
                <p className="text-red-400 text-xs bg-red-500/10 rounded-lg p-3 border border-red-500/20 font-mono mt-2">
                  ERROR: {scene.errorMsg}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 sm:p-8"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-full max-h-full rounded-lg overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              >
                <XIcon />
              </button>
              <img
                src={previewImage}
                crossOrigin="anonymous"
                alt="Preview"
                className="max-w-full max-h-[90vh] object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stitch Options Modal */}
      <AnimatePresence>
        {showStitchDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[75] flex items-center justify-center bg-black/90 p-4 sm:p-8"
            onClick={() => !stitching && setShowStitchDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              className="w-full max-w-5xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black/70 backdrop-blur-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-white/10">
                <div className="min-w-0">
                  <div className="text-xs font-mono tracking-widest text-gray-500 uppercase">Stitch & Download</div>
                  <div className="text-sm text-white truncate">
                    {config.title || 'Film'} — {videoScenes.length} clips • Est. {Math.round(estimatedDurationSec)}s
                  </div>
                </div>
                <button
                  onClick={() => !stitching && setShowStitchDialog(false)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                  title="Close"
                  disabled={stitching}
                >
                  <XIcon />
                </button>
              </div>

              <div className="p-5 overflow-y-auto max-h-[calc(90vh-64px)] space-y-6">
                {/* Global options */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Audio</div>
                    <label className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-200">Include clip audio</span>
                      <input
                        type="checkbox"
                        checked={stitchAudioEnabled}
                        onChange={(e) => setStitchAudioEnabled(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-500 text-dlm-accent focus:ring-dlm-accent bg-transparent"
                        disabled={stitching}
                      />
                    </label>
                    <div className="mt-2 text-[11px] text-gray-500">
                      If a clip has no audio track, silence is used for that segment.
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-white/10 bg-white/5 lg:col-span-2">
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Post-processing</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                          <span>Brightness</span>
                          <span className="font-mono">{postBrightness.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min={-1}
                          max={1}
                          step={0.01}
                          value={postBrightness}
                          onChange={(e) => setPostBrightness(parseFloat(e.target.value))}
                          className="w-full"
                          disabled={stitching}
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                          <span>Contrast</span>
                          <span className="font-mono">{postContrast.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={2}
                          step={0.01}
                          value={postContrast}
                          onChange={(e) => setPostContrast(parseFloat(e.target.value))}
                          className="w-full"
                          disabled={stitching}
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                          <span>Saturation</span>
                          <span className="font-mono">{postSaturation.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={3}
                          step={0.01}
                          value={postSaturation}
                          onChange={(e) => setPostSaturation(parseFloat(e.target.value))}
                          className="w-full"
                          disabled={stitching}
                        />
                      </div>
                    </div>
                    <div className="mt-2 text-[11px] text-gray-500">
                      Neutral is brightness 0, contrast 1, saturation 1.
                    </div>
                  </div>
                </div>

                {/* Per-clip options */}
                <div className="rounded-xl border border-white/10 overflow-hidden">
                  <div className="px-4 py-3 bg-black/40 border-b border-white/10">
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Per-clip edits</div>
                  </div>
                  <div className="divide-y divide-white/10">
                    {videoScenes.map((scene, idx) => {
                      const edit = clipEdits[scene.id] || {};
                      const speed = typeof edit.speed === 'number' ? edit.speed : 1;
                      const trimStart = typeof edit.trimStartSec === 'number' ? edit.trimStartSec : 0;
                      const trimEnd = typeof edit.trimEndSec === 'number' ? edit.trimEndSec : undefined;
                      const fadeIn = typeof edit.fadeInSec === 'number' ? edit.fadeInSec : 0;
                      const fadeOut = typeof edit.fadeOutSec === 'number' ? edit.fadeOutSec : 0;

                      return (
                        <div key={scene.id} className="p-4">
                          <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="min-w-0">
                              <div className="text-sm text-white font-medium truncate">Scene {idx + 1}</div>
                              <div className="text-[11px] text-gray-500 truncate">{scene.videoUrl}</div>
                            </div>
                            <div className="text-[11px] text-gray-500 font-mono">
                              speed {speed.toFixed(2)}x
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-1 lg:grid-cols-4 gap-3">
                            <div className="lg:col-span-2">
                              <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                                <span>Speed</span>
                                <span className="font-mono">{speed.toFixed(2)}x</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <input
                                  type="range"
                                  min={0.25}
                                  max={2}
                                  step={0.01}
                                  value={speed}
                                  onChange={(e) => {
                                    const v = parseFloat(e.target.value);
                                    setClipEdits((prev) => ({ ...prev, [scene.id]: { ...prev[scene.id], speed: v } }));
                                  }}
                                  className="w-full"
                                  disabled={stitching}
                                />
                                <input
                                  type="number"
                                  value={speed}
                                  min={0.25}
                                  max={2}
                                  step={0.01}
                                  onChange={(e) => {
                                    const v = parseFloat(e.target.value || '1');
                                    setClipEdits((prev) => ({ ...prev, [scene.id]: { ...prev[scene.id], speed: Number.isFinite(v) ? v : 1 } }));
                                  }}
                                  className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono"
                                  disabled={stitching}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="text-[11px] text-gray-400 mb-1">Trim start (s)</div>
                              <input
                                type="number"
                                value={trimStart}
                                min={0}
                                step={0.1}
                                onChange={(e) => {
                                  const v = parseFloat(e.target.value || '0');
                                  setClipEdits((prev) => ({
                                    ...prev,
                                    [scene.id]: { ...prev[scene.id], trimStartSec: Number.isFinite(v) ? v : 0 },
                                  }));
                                }}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs"
                                disabled={stitching}
                              />
                            </div>
                            <div>
                              <div className="text-[11px] text-gray-400 mb-1">Trim end (s)</div>
                              <input
                                type="number"
                                value={trimEnd ?? ''}
                                min={0}
                                step={0.1}
                                placeholder="(full)"
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  const v = raw === '' ? undefined : parseFloat(raw);
                                  setClipEdits((prev) => ({ ...prev, [scene.id]: { ...prev[scene.id], trimEndSec: v } }));
                                }}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs"
                                disabled={stitching}
                              />
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <div className="text-[11px] text-gray-400 mb-1">Fade in (s)</div>
                              <input
                                type="number"
                                value={fadeIn}
                                min={0}
                                max={5}
                                step={0.1}
                                onChange={(e) => {
                                  const v = parseFloat(e.target.value || '0');
                                  setClipEdits((prev) => ({ ...prev, [scene.id]: { ...prev[scene.id], fadeInSec: Number.isFinite(v) ? v : 0 } }));
                                }}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs"
                                disabled={stitching}
                              />
                            </div>
                            <div>
                              <div className="text-[11px] text-gray-400 mb-1">Fade out (s)</div>
                              <input
                                type="number"
                                value={fadeOut}
                                min={0}
                                max={5}
                                step={0.1}
                                onChange={(e) => {
                                  const v = parseFloat(e.target.value || '0');
                                  setClipEdits((prev) => ({ ...prev, [scene.id]: { ...prev[scene.id], fadeOutSec: Number.isFinite(v) ? v : 0 } }));
                                }}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs"
                                disabled={stitching}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-gray-500">
                    {stitching ? (stitchStatus || `${Math.round(stitchProgress)}%`) : 'Ready'}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      className="btn-ghost"
                      onClick={() => {
                        setClipEdits({});
                        setStitchAudioEnabled(true);
                        setPostBrightness(0);
                        setPostContrast(1);
                        setPostSaturation(1);
                      }}
                      disabled={stitching}
                      title="Reset options"
                    >
                      Reset
                    </button>
                    <button
                      className="btn-primary"
                      disabled={stitching || videoScenes.length < 2}
                      onClick={async () => {
                        const options: StitchOptions = {
                          title: config.title || 'film',
                          audio: { enabled: stitchAudioEnabled },
                          post: { brightness: postBrightness, contrast: postContrast, saturation: postSaturation },
                          clips: videoScenes.map((s) => ({
                            url: s.videoUrl!,
                            ...(clipEdits[s.id] || {}),
                          })),
                        };
                        await handleStitchAndDownload(options);
                      }}
                    >
                      {stitching ? 'Stitching…' : 'Stitch & Download'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scene Settings Modal */}
      <AnimatePresence>
        {settingsScene && onUpdateConfig && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4 sm:p-8"
            onClick={() => setSettingsSceneId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black/70 backdrop-blur-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-white/10">
                <div className="min-w-0">
                  <div className="text-xs font-mono tracking-widest text-gray-500 uppercase">Scene Settings</div>
                  <div className="text-sm text-white truncate">
                    Scene {config.scenes.findIndex(s => s.id === settingsScene.id) + 1} — References, anchoring, audio
                  </div>
                </div>
                <button
                  onClick={() => setSettingsSceneId(null)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors"
                  title="Close"
                >
                  <XIcon />
                </button>
              </div>
              <div className="p-5 overflow-y-auto max-h-[calc(90vh-64px)]">
                <VideoGenerationSettings
                  config={config}
                  scene={settingsScene}
                  onUpdateScene={handleUpdateScene}
                  onUpdateConfig={onUpdateConfig}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
