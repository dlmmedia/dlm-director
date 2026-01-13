import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectConfig, VideoModel, Scene } from '@/types';
import { 
  LoadingSpinner, 
  VideoIcon, 
  PlayIcon,
  SaveIcon,
  SettingsIcon,
  PlusIcon,
  XIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@/components/Icons';
import { ModelSelector } from '@/components/ModelSelector';
import { VideoGenerationSettings } from '@/components/VideoGenerationSettings';
import { 
  downloadFile, 
  downloadImagesZip, 
  downloadVideosZip,
  stitchVideos 
} from '@/lib/download';

interface ProductionStepProps {
  config: ProjectConfig;
  onUpdateConfig?: (updates: Partial<ProjectConfig>) => void;
  generatingAllVideos: boolean;
  onGenerateAllVideos: () => void;
  onShowPlayer: () => void;
  onGenerateImage: (sceneId: number) => void;
  onGenerateVideo: (sceneId: number) => void;
  onExtendVideo?: (sceneId: number) => void;
}

export default function ProductionStep({
  config,
  onUpdateConfig,
  generatingAllVideos,
  onGenerateAllVideos,
  onShowPlayer,
  onGenerateImage,
  onGenerateVideo,
  onExtendVideo
}: ProductionStepProps) {
  
  const [stitching, setStitching] = useState(false);
  const [stitchProgress, setStitchProgress] = useState(0);
  const [stitchStatus, setStitchStatus] = useState('');
  const [playingSceneId, setPlayingSceneId] = useState<number | null>(null);
  const [expandedSceneId, setExpandedSceneId] = useState<number | null>(null);
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

  const handleStitchAndDownload = async () => {
    setStitching(true);
    setStitchProgress(0);
    setStitchStatus('Initializing...');
    try {
      const blob = await stitchVideos(config.scenes, (progress, msg) => {
        setStitchProgress(progress);
        setStitchStatus(msg);
      });
      
      if (blob) {
        const url = URL.createObjectURL(blob);
        await downloadFile(url, `${config.title || 'film'}_stitched.mp4`);
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
  
  const handlePlay = (sceneId: number) => {
      setPlayingSceneId(sceneId);
  };

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
              onClick={handleStitchAndDownload}
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
          <div key={scene.id} className="card-elevated overflow-hidden relative group flex flex-col h-full border-t-2 border-t-transparent hover:border-t-dlm-accent transition-all duration-300">
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

            {/* Quick Download Buttons */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
               {scene.imageUrl && (
                 <button 
                  onClick={() => downloadFile(scene.imageUrl!, `scene_${scene.id}.png`)}
                  className="p-2.5 bg-black/80 hover:bg-white text-white hover:text-black rounded-lg backdrop-blur-sm shadow-lg border border-white/10 transition-all"
                  title="Download Image"
                 >
                   <SaveIcon />
                 </button>
               )}
               {scene.videoUrl && (
                 <button 
                  onClick={() => downloadFile(scene.videoUrl!, `scene_${scene.id}.mp4`)}
                  className="p-2.5 bg-black/80 hover:bg-white text-white hover:text-black rounded-lg backdrop-blur-sm shadow-lg border border-white/10 transition-all"
                  title="Download Video"
                 >
                   <VideoIcon />
                 </button>
               )}
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
            <div className="p-6 flex flex-col flex-grow space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-dlm-accent font-bold font-mono text-xs tracking-wider bg-dlm-accent/10 px-2 py-1 rounded border border-dlm-accent/20">SCENE {String(idx + 1).padStart(2, '0')}</span>
                  
                  {/* Reorder Controls */}
                   <div className="flex bg-white/5 rounded-lg border border-white/5">
                      <button 
                          onClick={() => handleMoveScene(idx, 'up')} 
                          disabled={idx === 0}
                          className="p-1.5 text-gray-500 hover:text-white disabled:opacity-20 hover:bg-white/10 rounded-l-lg transition-colors"
                          title="Move Up"
                      >
                          <ArrowUpIcon /> 
                      </button>
                      <div className="w-px bg-white/10 my-1" />
                      <button 
                          onClick={() => handleMoveScene(idx, 'down')} 
                          disabled={idx === config.scenes.length - 1}
                          className="p-1.5 text-gray-500 hover:text-white disabled:opacity-20 hover:bg-white/10 rounded-r-lg transition-colors"
                          title="Move Down"
                      >
                          <ArrowDownIcon />
                      </button>
                   </div>

                  <button
                    onClick={() => setExpandedSceneId(expandedSceneId === scene.id ? null : scene.id)}
                    className={`p-1.5 rounded-lg transition-colors ${expandedSceneId === scene.id ? 'bg-dlm-accent text-black' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}
                    title="Video Generation Settings (References & Anchoring)"
                  >
                    <SettingsIcon />
                  </button>
                </div>
                <span className="text-xs text-gray-500 font-mono tracking-wider">{scene.durationEstimate}S</span>
              </div>
              
              {/* Detailed Settings Panel */}
              {expandedSceneId === scene.id && onUpdateConfig && (
                <div className="mb-4 bg-black/40 rounded-xl p-4 border border-white/10 animate-in fade-in slide-in-from-top-2 relative">
                   <div className="absolute top-0 left-4 -translate-y-1/2 w-3 h-3 bg-black border-t border-l border-white/10 rotate-45 transform" />
                   <VideoGenerationSettings 
                      config={config} 
                      scene={scene}
                      onUpdateScene={handleUpdateScene}
                      onUpdateConfig={onUpdateConfig}
                   />
                </div>
              )}
              
              <p className="text-gray-300 text-sm leading-relaxed min-h-[3rem]">{scene.narration}</p>
              
              {/* Cinematography tags */}
              <div className="flex flex-wrap gap-2">
                {[scene.shotType, scene.cameraMovement, scene.lightingStyle].map((tag, i) => (
                    <span key={i} className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-white/5 border border-white/5 text-gray-400 font-mono">
                      {tag.split(' ')[0]}
                    </span>
                ))}
              </div>
              
              {/* Action Buttons */}
              <div className="mt-auto pt-4 flex gap-3">
                <button 
                  onClick={() => onGenerateImage(scene.id)}
                  disabled={scene.status === 'generating_image'}
                  className="flex-1 py-3 text-xs font-bold uppercase tracking-wide border border-white/10 text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/5 rounded-xl transition-all disabled:opacity-50"
                >
                  {scene.imageUrl ? 'Regen Image' : 'Gen Image'}
                </button>
                  <div className="flex-1 flex gap-2">
                    {/* Stuck State Reset */}
                    {scene.status === 'generating_video' && (
                       <button
                        onClick={() => handleUpdateScene(scene.id, { status: scene.videoUrl ? 'video_ready' : 'image_ready' })}
                        className="px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/10 transition-colors"
                        title="Reset Status (if stuck)"
                      >
                        <XIcon />
                      </button>
                    )}
                   <button 
                    onClick={() => onGenerateVideo(scene.id)}
                    disabled={!scene.imageUrl || (scene.status === 'generating_video' && !scene.videoUrl)}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide rounded-xl transition-all shadow-lg disabled:opacity-30 disabled:shadow-none ${
                      scene.videoUrl 
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                        : 'bg-gradient-to-r from-dlm-accent to-yellow-500 text-black hover:brightness-110 border-0'
                    }`}
                  >
                    {scene.videoUrl ? 'Re-Render' : (scene.status === 'generating_video' ? 'Rendering...' : 'Render Video')}
                  </button>
                  {scene.videoUrl && onExtendVideo && (
                    <button
                      onClick={() => onExtendVideo(scene.id)}
                      disabled={scene.status === 'generating_video'}
                      className="px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 transition-colors"
                      title="Extend Video"
                    >
                      <PlusIcon />
                    </button>
                  )}
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
      </div>
    </div>
  );
}
