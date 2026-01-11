import React, { useState, useEffect, useRef } from 'react';
import { ProjectConfig, VideoModel } from '@/types';
import { 
  LoadingSpinner, 
  VideoIcon, 
  PlayIcon,
  SaveIcon
} from '@/components/Icons';
import { ModelSelector } from '@/components/ModelSelector';
import { 
  downloadFile, 
  downloadImagesZip, 
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
}

export default function ProductionStep({
  config,
  onUpdateConfig,
  generatingAllVideos,
  onGenerateAllVideos,
  onShowPlayer,
  onGenerateImage,
  onGenerateVideo
}: ProductionStepProps) {
  
  const [stitching, setStitching] = useState(false);
  const [stitchProgress, setStitchProgress] = useState(0);
  const [stitchStatus, setStitchStatus] = useState('');
  const [playingSceneId, setPlayingSceneId] = useState<number | null>(null);
  
  // Safe play handling
  const videoRefs = useRef<{[key: number]: HTMLVideoElement | null}>({});

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
      }
    } catch (e) {
      console.error("Failed to stitch videos", e);
      setStitchStatus("Stitching failed");
    } finally {
      setStitching(false);
      setTimeout(() => setStitchStatus(''), 3000);
    }
  };
  
  const handlePlay = (sceneId: number) => {
      setPlayingSceneId(sceneId);
  };

  return (
    <div className="w-full max-w-[90rem] mx-auto px-6 py-8 space-y-8">
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
          <div className="flex items-center gap-3">
            {onUpdateConfig && (
              <ModelSelector 
                currentModel={config.videoModel} 
                onSelect={(model) => onUpdateConfig({ videoModel: model })}
                disabled={generatingAllVideos}
              />
            )}

            <div className="h-8 w-px bg-white/10 mx-2" />

            <button 
              onClick={handleDownloadAllImages}
              disabled={imagesReady === 0}
              className="btn-ghost"
              title="Download all images as ZIP"
            >
              <SaveIcon />
            </button>
            
            <button 
              onClick={handleStitchAndDownload}
              disabled={videosReady < 2 || stitching}
              className="btn-ghost relative"
              title="Download stitched video"
            >
              {stitching ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size={14} color="currentColor" />
                  <span className="text-xs w-8 text-center">{Math.round(stitchProgress)}%</span>
                </div>
              ) : (
                <VideoIcon />
              )}
              {stitchStatus && stitching && (
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] whitespace-nowrap text-gray-400">
                  {stitchStatus}
                </span>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {config.scenes.map((scene) => (
          <div key={scene.id} className="card-elevated overflow-hidden relative group">
            {/* Status Badge */}
            <div className="absolute top-3 left-3 z-20 pointer-events-none">
              <div className={`px-2.5 py-1 rounded-lg backdrop-blur-md text-[10px] font-semibold tracking-wide ${
                scene.status === 'pending' ? 'bg-black/60 text-gray-400' :
                scene.status === 'generating_image' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                scene.status === 'image_ready' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                scene.status === 'generating_video' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                scene.status === 'video_ready' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {scene.status === 'pending' && 'PENDING'}
                {scene.status === 'generating_image' && (
                  <span className="flex items-center gap-1.5">
                    <LoadingSpinner size={10} color="currentColor" />
                    GEN IMG
                  </span>
                )}
                {scene.status === 'image_ready' && 'IMG READY'}
                {scene.status === 'generating_video' && (
                  <span className="flex items-center gap-1.5">
                    <LoadingSpinner size={10} color="currentColor" />
                    RENDERING
                  </span>
                )}
                {scene.status === 'video_ready' && '✓ COMPLETE'}
                {scene.status === 'error' && 'ERROR'}
              </div>
            </div>

            {/* Quick Download Buttons */}
            <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               {scene.imageUrl && (
                 <button 
                  onClick={() => downloadFile(scene.imageUrl!, `scene_${scene.id}.png`)}
                  className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm shadow-lg border border-white/10"
                  title="Download Image"
                 >
                   <SaveIcon />
                 </button>
               )}
               {scene.videoUrl && (
                 <button 
                  onClick={() => downloadFile(scene.videoUrl!, `scene_${scene.id}.mp4`)}
                  className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm shadow-lg border border-white/10"
                  title="Download Video"
                 >
                   <VideoIcon />
                 </button>
               )}
            </div>

            {/* Main Visual Area */}
            <div className="aspect-video bg-black/50 relative flex items-center justify-center overflow-hidden">
              {playingSceneId === scene.id && scene.videoUrl ? (
                <video 
                  ref={el => { videoRefs.current[scene.id] = el; }}
                  src={scene.videoUrl} 
                  className="w-full h-full object-cover" 
                  autoPlay
                  controls 
                  playsInline
                  onEnded={() => setPlayingSceneId(null)}
                  onPlay={() => {
                     // Catch abort errors if play is interrupted
                     const video = videoRefs.current[scene.id];
                     if (video && video.paused && !video.ended) {
                         video.play().catch(e => {
                             if (e.name !== 'AbortError') console.error("Playback error:", e);
                         });
                     }
                  }}
                />
              ) : scene.imageUrl ? (
                <>
                  <img 
                    src={scene.imageUrl} 
                    alt={`Scene ${scene.id}`} 
                    className="w-full h-full object-cover"
                  />
                  {scene.videoUrl && (
                    <div 
                      className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                      onClick={() => handlePlay(scene.id)}
                    >
                      <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white shadow-2xl border border-white/20 transform hover:scale-110 transition-all">
                        <PlayIcon />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-gray-600">
                  {scene.status === 'generating_image' ? (
                    <LoadingSpinner size={32} />
                  ) : (
                    <span className="text-xs font-medium">No Image</span>
                  )}
                </div>
              )}
            </div>

            {/* Scene Info */}
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-dlm-accent font-bold text-sm">Scene {scene.id}</span>
                <span className="text-xs text-gray-500 font-mono">{scene.durationEstimate}s</span>
              </div>
              
              <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">{scene.narration}</p>
              
              {/* Cinematography tags */}
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-gray-500">
                  {scene.shotType.split(' ')[0]}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-gray-500">
                  {scene.cameraMovement.split(' ')[0]}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-gray-500">
                  {scene.lightingStyle.split(' ')[0]}
                </span>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => onGenerateImage(scene.id)}
                  disabled={scene.status === 'generating_image'}
                  className="flex-1 py-2.5 text-xs font-medium border border-white/10 text-gray-400 hover:text-white hover:border-white/20 rounded-xl transition-colors disabled:opacity-50"
                >
                  {scene.imageUrl ? 'Regenerate' : 'Generate'} Image
                </button>
                <button 
                  onClick={() => onGenerateVideo(scene.id)}
                  disabled={!scene.imageUrl || scene.status === 'generating_video'}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-colors disabled:opacity-30 ${
                    scene.videoUrl 
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                      : 'bg-dlm-accent text-black hover:brightness-110'
                  }`}
                >
                  {scene.videoUrl ? 'Re-Render' : 'Veo Render'}
                </button>
              </div>
              
              {scene.errorMsg && (
                <p className="text-red-400 text-xs bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                  {scene.errorMsg}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
