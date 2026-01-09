// ========================================
// ENHANCED VIDEO PLAYER
// With scene transitions and narration overlay
// ========================================

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Scene, TransitionType } from '../types';

interface Props {
  scenes: Scene[];
  onClose: () => void;
}

// Transition CSS animations
const getTransitionClass = (type: TransitionType, phase: 'enter' | 'exit'): string => {
  const transitions: Record<TransitionType, { enter: string; exit: string }> = {
    [TransitionType.CUT]: { enter: '', exit: '' },
    [TransitionType.MATCH_CUT]: { enter: '', exit: '' },
    [TransitionType.CROSS_DISSOLVE]: { 
      enter: 'animate-fade-in', 
      exit: 'animate-fade-out' 
    },
    [TransitionType.FADE_BLACK]: { 
      enter: 'animate-fade-from-black', 
      exit: 'animate-fade-to-black' 
    },
    [TransitionType.FADE_WHITE]: { 
      enter: 'animate-fade-from-white', 
      exit: 'animate-fade-to-white' 
    },
    [TransitionType.WHIP_PAN]: { 
      enter: 'animate-slide-in-right', 
      exit: 'animate-slide-out-left' 
    },
    [TransitionType.L_CUT]: { enter: '', exit: '' },
    [TransitionType.J_CUT]: { enter: '', exit: '' },
    [TransitionType.WIPE]: { 
      enter: 'animate-wipe-in', 
      exit: 'animate-wipe-out' 
    },
    [TransitionType.ZOOM_TRANSITION]: { 
      enter: 'animate-zoom-in', 
      exit: 'animate-zoom-out' 
    },
    [TransitionType.LIGHT_FLASH]: { 
      enter: 'animate-flash-in', 
      exit: 'animate-flash-out' 
    }
  };
  return transitions[type]?.[phase] || '';
};

export const VideoPlayer: React.FC<Props> = ({ scenes, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

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
        .catch(e => console.error(e));
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
        }, 500); // Transition duration
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
      case 'ArrowLeft':
        if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
        break;
      case 'ArrowRight':
        if (currentIndex < playableScenes.length - 1) setCurrentIndex(currentIndex + 1);
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  if (playableScenes.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md">
        <div className="text-center">
          <p className="text-white text-lg mb-4">No video scenes ready to play</p>
          <p className="text-gray-500 text-sm mb-6">Generate video clips from your storyboard first</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-dlm-accent text-black font-bold rounded hover:bg-dlm-accentHover"
          >
            Return to Studio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Top Bar */}
      <div className={`absolute top-0 left-0 right-0 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h2 className="text-white font-serif text-xl">DLM Director Preview</h2>
              <p className="text-gray-400 text-sm">Scene {currentIndex + 1} of {playableScenes.length}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-white/50 hover:text-white transition-colors rounded-full hover:bg-white/10"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Video Container */}
      <div className="relative w-full max-w-6xl aspect-video">
        {/* Transition Overlay */}
        {transitioning && (
          <div className="absolute inset-0 bg-black z-10 animate-pulse" />
        )}
        
        <video
          ref={videoRef}
          className={`w-full h-full object-contain ${
            transitioning ? 'opacity-0' : 'opacity-100'
          } transition-opacity duration-300`}
          onEnded={handleEnded}
          onClick={handlePlayPause}
        />

        {/* Narration Overlay */}
        {currentScene && (
          <div className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            <p className="text-white/90 text-lg font-light max-w-4xl mx-auto text-center leading-relaxed">
              "{currentScene.narration}"
            </p>
          </div>
        )}

        {/* Play/Pause Overlay */}
        {!isPlaying && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
            onClick={handlePlayPause}
          >
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30 transition-colors">
              <svg className="w-10 h-10 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="bg-gradient-to-t from-black/80 to-transparent p-6">
          <div className="max-w-6xl mx-auto space-y-4">
            {/* Progress Bar */}
            <div className="relative h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-dlm-accent transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Scene Timeline */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {playableScenes.map((scene, idx) => (
                <button
                  key={scene.id}
                  onClick={() => handleSeek(idx)}
                  className={`flex-shrink-0 w-20 h-12 rounded overflow-hidden border-2 transition-all ${
                    idx === currentIndex 
                      ? 'border-dlm-accent scale-110 shadow-lg shadow-dlm-accent/30' 
                      : idx < currentIndex
                        ? 'border-green-500/50 opacity-60'
                        : 'border-transparent opacity-50 hover:opacity-80'
                  }`}
                >
                  {scene.imageUrl ? (
                    <img src={scene.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-dlm-700 flex items-center justify-center text-xs text-gray-500">
                      {idx + 1}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="p-2 text-white/60 hover:text-white disabled:opacity-30 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>
              
              <button
                onClick={handlePlayPause}
                className="p-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                {isPlaying ? (
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              
              <button
                onClick={() => currentIndex < playableScenes.length - 1 && setCurrentIndex(currentIndex + 1)}
                disabled={currentIndex === playableScenes.length - 1}
                className="p-2 text-white/60 hover:text-white disabled:opacity-30 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 18h2V6h-2v12zM6 18l8.5-6L6 6v12z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className={`absolute bottom-24 left-4 text-xs text-gray-500 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <p>Space: Play/Pause • ←→: Navigate • Esc: Close</p>
      </div>
    </div>
  );
};
