'use client';

// ========================================
// ENHANCED VIDEO PLAYER
// Premium playback with smooth animations
// ========================================

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scene, TransitionType } from '../types';
import { MaximizeIcon, MinimizeIcon, PictureInPictureIcon } from './Icons';

interface Props {
  scenes: Scene[];
  onClose: () => void;
}

// Icons
const PlayIcon = () => (
  <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
  </svg>
);

const PrevIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
  </svg>
);

const NextIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M16 18h2V6h-2v12zM6 18l8.5-6L6 6v12z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const VideoPlayer: React.FC<Props> = ({ scenes, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

  // Reset error when index changes
  useEffect(() => {
    setError(null);
  }, [currentIndex]);

  // Filter only ready scenes with valid video URLs
  const playableScenes = useMemo(() => 
    scenes.filter(s => s.status === 'video_ready' && s.videoUrl),
    [scenes]
  );

  const currentScene = playableScenes[currentIndex];

  // Progress tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener('timeupdate', updateProgress);
    return () => video.removeEventListener('timeupdate', updateProgress);
  }, [currentIndex]);

  // Play video when index changes
  useEffect(() => {
    if (videoRef.current && playableScenes[currentIndex]) {
      videoRef.current.src = playableScenes[currentIndex].videoUrl!;
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(e => {
          if (e.name !== 'AbortError') {
            console.error(e);
          }
        });
    }
  }, [currentIndex, playableScenes]);

  // Auto-hide controls
  useEffect(() => {
    const hideControls = () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      setShowControls(true);
      controlsTimeout.current = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    };

    window.addEventListener('mousemove', hideControls);
    return () => {
      window.removeEventListener('mousemove', hideControls);
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    };
  }, [isPlaying]);

  const handleEnded = () => {
    if (currentIndex < playableScenes.length - 1) {
      const outTransition = currentScene?.transitionOut || TransitionType.CUT;
      
      if (outTransition !== TransitionType.CUT) {
        setTransitioning(true);
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
          setTransitioning(false);
        }, 500);
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    } else {
      setIsPlaying(false);
    }
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (index: number) => {
    setCurrentIndex(index);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case ' ':
        e.preventDefault();
        handlePlayPause();
        break;
      case 'f':
      case 'F':
        toggleFullscreen();
        break;
      case 'ArrowLeft':
        if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
        break;
      case 'ArrowRight':
        if (currentIndex < playableScenes.length - 1) setCurrentIndex(currentIndex + 1);
        break;
      case 'Escape':
        if (isFullscreen) {
           toggleFullscreen();
        } else {
           onClose();
        }
        break;
    }
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    console.error('Video Error Event:', e);
    console.error('Video Source:', video.src);
    
    let msg = 'Playback Error';
    if (video.error) {
      console.error('Video Error Details:', {
        code: video.error.code,
        message: video.error.message,
        src: video.src
      });
      
      switch (video.error.code) {
        case 1: msg = 'Aborted (The fetching of the associated resource was aborted by the user)'; break;
        case 2: msg = 'Network Error (Some kind of network error occurred which prevented the media from being successfully fetched)'; break;
        case 3: msg = 'Decoding Error (Despite having previously been determined to be usable, an error occurred while trying to decode the media resource)'; break;
        case 4: msg = 'Source Not Supported (The associated resource or media provider object (such as a MediaStream) has been found to be unsuitable)'; break;
      }
      if (video.error.message) {
        msg += `: ${video.error.message}`;
      }
    } else {
        // Fallback if error object is null but event fired
        console.warn('Video error event fired but video.error is null', e);
        if (video.networkState === 3) { // NETWORK_NO_SOURCE
            msg = 'Source Not Found or Not Supported';
        }
    }
    setError(msg);
    setIsPlaying(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const togglePictureInPicture = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error('PiP failed:', error);
    }
  };

  if (playableScenes.length === 0) {
    return (
      <motion.div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="text-center max-w-md mx-auto px-6"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div
            className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/[0.05] flex items-center justify-center"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </motion.div>
          <h3 className="text-xl font-medium text-white mb-2">No Videos Ready</h3>
          <p className="text-gray-500 text-sm mb-8">Generate video clips from your storyboard first</p>
          <motion.button
            onClick={onClose}
            className="px-8 py-3 bg-dlm-accent text-black font-semibold rounded-xl"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Return to Studio
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Top Bar */}
      <motion.div 
        className="absolute top-0 left-0 right-0 z-20"
        initial={{ y: -20, opacity: 0 }}
        animate={{ 
          y: showControls ? 0 : -20, 
          opacity: showControls ? 1 : 0 
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-gradient-to-b from-black/90 to-transparent p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h2 className="text-white font-serif text-xl tracking-tight">DLM Director Preview</h2>
              <p className="text-gray-400 text-sm mt-1">
                Scene {currentIndex + 1} of {playableScenes.length}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <motion.button 
                onClick={togglePictureInPicture}
                className="p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Picture in Picture"
              >
                <PictureInPictureIcon />
              </motion.button>
              
              <motion.button 
                onClick={toggleFullscreen}
                className="p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
              </motion.button>

              <div className="w-px h-6 bg-white/10 mx-2" />

              <motion.button 
                onClick={onClose}
                className="p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <CloseIcon />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Video Container */}
      <div className="relative w-full max-w-6xl aspect-video">
        {/* Transition Overlay */}
        <AnimatePresence>
          {transitioning && (
            <motion.div 
              className="absolute inset-0 bg-black z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
        
        <motion.video
          ref={videoRef}
          crossOrigin="anonymous"
          className="w-full h-full object-contain"
          onEnded={handleEnded}
          onClick={handlePlayPause}
          onError={handleVideoError}
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ 
            scale: transitioning ? 0.98 : 1, 
            opacity: transitioning ? 0 : 1 
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Error Overlay */}
        <AnimatePresence>
          {error && (
            <motion.div 
              className="absolute inset-0 flex items-center justify-center bg-black/80 z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center p-6 bg-red-900/20 border border-red-500/30 rounded-xl backdrop-blur-md">
                <div className="text-red-500 font-bold mb-2 text-xl">Video Error</div>
                <p className="text-white/80">{error}</p>
                <button 
                  onClick={() => {
                    setError(null);
                    if (videoRef.current) {
                        videoRef.current.load();
                        videoRef.current.play().catch(console.error);
                    }
                  }}
                  className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors text-sm"
                >
                  Retry
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Narration Overlay */}
        <AnimatePresence>
          {currentScene && showControls && (
            <motion.div 
              className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <p className="text-white/90 text-lg font-light max-w-4xl mx-auto text-center leading-relaxed italic">
                "{currentScene.narration}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Play/Pause Overlay */}
        <AnimatePresence>
          {!isPlaying && (
            <motion.div 
              className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
              onClick={handlePlayPause}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center text-white border border-white/20"
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.2)' }}
                whileTap={{ scale: 0.95 }}
              >
                <PlayIcon />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Controls */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 z-20"
        initial={{ y: 20, opacity: 0 }}
        animate={{ 
          y: showControls ? 0 : 20, 
          opacity: showControls ? 1 : 0 
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-gradient-to-t from-black/90 to-transparent p-6 pb-8">
          <div className="max-w-6xl mx-auto space-y-5">
            {/* Progress Bar */}
            <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer group">
              <motion.div 
                className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-dlm-accent to-amber-400"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
              <motion.div
                className="absolute left-0 top-0 h-full rounded-full bg-dlm-accent/50 blur-md"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Scene Timeline */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {playableScenes.map((scene, idx) => (
                <motion.button
                  key={scene.id}
                  onClick={() => handleSeek(idx)}
                  className={`flex-shrink-0 w-24 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === currentIndex 
                      ? 'border-dlm-accent shadow-lg shadow-dlm-accent/30' 
                      : idx < currentIndex
                        ? 'border-green-500/30 opacity-50'
                        : 'border-transparent opacity-40 hover:opacity-70'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: idx === currentIndex ? 1 : idx < currentIndex ? 0.5 : 0.4, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  {scene.imageUrl ? (
                    <img src={scene.imageUrl} crossOrigin="anonymous" alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/[0.05] flex items-center justify-center text-xs text-gray-500 font-mono">
                      {idx + 1}
                    </div>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-6">
              <motion.button
                onClick={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="p-2 text-white/60 hover:text-white disabled:opacity-30 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <PrevIcon />
              </motion.button>
              
              <motion.button
                onClick={handlePlayPause}
                className="p-5 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm border border-white/10"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </motion.button>
              
              <motion.button
                onClick={() => currentIndex < playableScenes.length - 1 && setCurrentIndex(currentIndex + 1)}
                disabled={currentIndex === playableScenes.length - 1}
                className="p-2 text-white/60 hover:text-white disabled:opacity-30 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <NextIcon />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Keyboard shortcuts hint */}
      <motion.div 
        className="absolute bottom-28 left-6 text-xs text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: showControls ? 1 : 0 }}
      >
        <p className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <kbd className="px-2 py-0.5 bg-white/10 rounded text-[10px]">Space</kbd>
            Play/Pause
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-2 py-0.5 bg-white/10 rounded text-[10px]">←→</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-2 py-0.5 bg-white/10 rounded text-[10px]">Esc</kbd>
            Close
          </span>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default VideoPlayer;
