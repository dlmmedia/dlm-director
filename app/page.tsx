'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  ProjectConfig, 
  Scene, 
  TrendingTopic,
  CharacterProfile,
  createDefaultConfig,
  VideoModel,
} from '@/types';
import { 
  generateScript, 
  generateSceneImage, 
  generateSceneVideo, 
  extendVideo,
  fetchTrendingTopics,
  extractCharactersFromPrompt,
  extractLocationsFromPrompt,
} from '@/services/geminiService';
import { StepIndicator } from '@/components/StepIndicator';
import { VideoPlayer } from '@/components/VideoPlayer';
import { Sidebar } from '@/components/Sidebar';
import { 
  fetchProject, 
  createProject as createProjectAPI,
  debouncedSave,
  saveProject,
  uploadSceneImage,
  uploadSceneVideo,
  cancelPendingSave
} from '@/lib/projectStore';
import { SaveIcon, UserIcon, LoadingSpinner } from '@/components/Icons';

// Import Steps
import ConceptStep from '@/components/steps/ConceptStep';
import ConfigStep from '@/components/steps/ConfigStep';
import ScriptReviewStep from '@/components/steps/ScriptReviewStep';
import ProductionStep from '@/components/steps/ProductionStep';

export default function Home() {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<ProjectConfig>(createDefaultConfig());
  const [trending, setTrending] = useState<TrendingTopic[]>([]);
  const [loadingScript, setLoadingScript] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [generatingAllVideos, setGeneratingAllVideos] = useState(false);
  const [researchLoading, setResearchLoading] = useState(false);
  const [extractingEntities, setExtractingEntities] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0);
  
  // AbortController for cancelling ongoing generation
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Ref to always have access to the latest config for callbacks/loops
  const configRef = useRef<ProjectConfig>(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Ref to track last saved state to prevent loop
  const lastSavedConfigRef = useRef<string>('');
  
  // Ref to track last synced title to refresh sidebar
  const lastSyncedTitleRef = useRef<string>('');

  // Sync Sidebar when title changes
  useEffect(() => {
    // If we have a project ID, the title is valid (not empty), it changed, and it's not the default "New Project"
    // (unless we actually renamed it to "New Project", but that's edge case)
    if (currentProjectId && config.title && config.title !== lastSyncedTitleRef.current) {
       // We rely on auto-save (debounced 2s).
       // So we trigger refresh after a delay to ensure backend is updated.
       const timer = setTimeout(() => {
          console.log('Refreshing sidebar due to title change');
          setSidebarRefreshTrigger(prev => prev + 1);
          lastSyncedTitleRef.current = config.title || '';
       }, 3000); // 2s debounce + 1s buffer
       return () => clearTimeout(timer);
    }
  }, [config.title, currentProjectId]);

  // Auto-save effect
  useEffect(() => {
    if (currentProjectId && config) {
      const currentConfigStr = JSON.stringify(config);
      
      // Skip if config hasn't changed from what we last loaded/saved
      if (currentConfigStr === lastSavedConfigRef.current) {
        return;
      }

      setSaveStatus('unsaved');
      debouncedSave(currentProjectId, config);
      
      // Update the reference to current
      lastSavedConfigRef.current = currentConfigStr;
      
      const timer = setTimeout(() => setSaveStatus('saved'), 2500);
      return () => clearTimeout(timer);
    }
  }, [config, currentProjectId]);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Handlers
  const handleNext = () => {
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(prev => prev - 1);
  };

  const handleProjectSelect = async (id: string) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/38be5295-f513-45bf-9b9a-128482a00dc2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/page.tsx:123',message:'handleProjectSelect',data:{id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H_PROJECT_SELECT'})}).catch(()=>{});
    // #endregion
    setSaveStatus('saving');
    try {
      const project = await fetchProject(id);
      if (project) {
        setCurrentProjectId(id);
        const projectConfig = project.config || createDefaultConfig();
        
        // MIGRATION: Fix old Veo 2.0 model ID if present
        if (projectConfig.videoModel === 'veo-2.0-generate-preview' as any) {
            projectConfig.videoModel = VideoModel.VEO_2_0;
        }
        
        setConfig(projectConfig);
        // Initialize lastSavedConfigRef with the loaded config to prevent immediate auto-save
        lastSavedConfigRef.current = JSON.stringify(projectConfig);
        lastSyncedTitleRef.current = projectConfig.title || '';
        setStep(projectConfig?.scenes?.length > 0 ? 2 : 0);
        setSaveStatus('saved');
      } else {
        // Project doesn't exist - it was cleaned up from the index by the API
        // Refresh the sidebar to remove stale entries
        setErrorMessage("Project not found. It may have been deleted.");
        setSidebarRefreshTrigger(prev => prev + 1);
        setSaveStatus('saved');
      }
    } catch (e) {
      setErrorMessage("Error loading project.");
      console.error(e);
      setSaveStatus('saved');
    }
  };


  const handleNewProject = async () => {
    try {
      const project = await createProjectAPI('New Project');
      if (project) {
        setCurrentProjectId(project.id);
        const newConfig = createDefaultConfig();
        setConfig(newConfig);
        lastSavedConfigRef.current = JSON.stringify(newConfig);
        setStep(0);
      } else {
        setErrorMessage("Failed to create project.");
      }
    } catch (e) {
      setErrorMessage("Error creating project.");
      console.error(e);
    }
  };

  const ensureProjectExists = async () => {
    if (currentProjectId) return currentProjectId;

    try {
      // Create project with current title or default
      const title = config.title || 'New Project';
      const project = await createProjectAPI(title);
      
      if (project) {
        console.log('Auto-created new project:', project.id);
        setCurrentProjectId(project.id);
        
        // Ensure config has the correct title
        const newConfig = { ...config, title: project.title };
        setConfig(newConfig);
        
        // Save immediately
        await saveProject(project.id, newConfig);
        lastSavedConfigRef.current = JSON.stringify(newConfig);
        
        return project.id;
      }
    } catch (e) {
      console.error("Failed to auto-create project:", e);
      setErrorMessage("Failed to create project automatically.");
    }
    return null;
  };

  const handleFetchTrending = async () => {
    setResearchLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchTrendingTopics(config.category);
      setTrending(data);
    } catch (e) {
      setErrorMessage("Failed to fetch trending topics.");
      console.error(e);
    } finally {
      setResearchLoading(false);
    }
  };

  const handleExtractEntities = async () => {
    if (!config.userPrompt) return;
    
    console.log("🚀 Extract Entities button clicked");
    setExtractingEntities(true);
    setErrorMessage(null);

    try {
        // Ensure project exists before starting work
        console.log("📂 Ensuring project exists...");
        const projectId = await ensureProjectExists();
        console.log("📂 Project ID:", projectId);
        
        if (!projectId) {
            console.error("❌ Failed to ensure project exists");
            setErrorMessage("Failed to create/save project.");
            return;
        }
    
        console.log("🧠 calling extractCharactersFromPrompt and extractLocationsFromPrompt...");
        const [characters, locations] = await Promise.all([
            extractCharactersFromPrompt(config.userPrompt).catch(err => {
                console.error("❌ extractCharactersFromPrompt failed:", err);
                return [];
            }),
            extractLocationsFromPrompt(config.userPrompt).catch(err => {
                console.error("❌ extractLocationsFromPrompt failed:", err);
                return [];
            })
        ]);
        
        console.log(`✅ Extraction complete. Characters: ${characters.length}, Locations: ${locations.length}`);
        
        setConfig(prev => {
            const newConfig = {
            ...prev,
            characters: [...prev.characters, ...characters],
            locations: [...prev.locations, ...locations]
            };
            
            // Save extraction results
            if (projectId) {
                saveProject(projectId, newConfig).catch(console.error);
            }
            
            return newConfig;
        });
    } catch (e) {
      setErrorMessage("Entity extraction failed.");
      console.error("Entity extraction failed:", e);
    } finally {
      console.log("🏁 Extraction process finished, resetting loading state.");
      setExtractingEntities(false);
    }
  };

  const handleGenerateScript = async (sceneCount: number = 5) => {
    const currentConfig = config;
    if (!currentConfig.userPrompt) return;

    console.log("🚀 Generate Script requested");
    setLoadingScript(true);
    setErrorMessage(null);

    try {
        // Ensure project exists before generation
        const projectId = await ensureProjectExists();
        if (!projectId) {
            console.error("❌ Failed to ensure project exists for script generation");
            setErrorMessage("Failed to create/save project.");
            return;
        }

        console.log("🧠 calling generateScript...");
        const scenes = await generateScript(
            currentConfig.category, 
            currentConfig.style, 
            currentConfig.userPrompt,
            currentConfig,
            sceneCount
        );
        console.log(`✅ Script generated with ${scenes.length} scenes`);
        setConfig(prev => {
            const newConfig = { ...prev, scenes };
            // Immediately save to ensure script is persisted
            if (projectId) {
            saveProject(projectId, newConfig).then(() => {
                console.log('✅ Project saved with generated script');
                lastSavedConfigRef.current = JSON.stringify(newConfig);
            });
            }
            return newConfig;
        });
        setStep(2); // Auto-advance
    } catch (e) {
      setErrorMessage("Failed to generate script. Please try again.");
      console.error("Script generation error:", e);
    } finally {
      console.log("🏁 Script generation process finished.");
      setLoadingScript(false);
    }
  };

  // Cancel any ongoing generation
  const handleCancelGeneration = useCallback((sceneId: number) => {
    console.log(`🛑 Cancelling generation for scene ${sceneId}`);
    
    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Reset the scene status
    setConfig(prev => {
      const scene = prev.scenes.find(s => s.id === sceneId);
      const newStatus = scene?.imageUrl ? 'image_ready' : (scene?.videoUrl ? 'video_ready' : 'pending');
      return {
        ...prev,
        scenes: prev.scenes.map(s => s.id === sceneId ? { 
          ...s, 
          status: newStatus as any,
          errorMsg: undefined 
        } : s)
      };
    });
    
    setErrorMessage(null);
  }, []);

  const handleGenerateImage = async (sceneId: number) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/38be5295-f513-45bf-9b9a-128482a00dc2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:321',message:'handleGenerateImage ENTRY',data:{sceneId,hasCurrentProjectId:!!currentProjectId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});
    // #endregion
    
    // Cancel any previous ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    // Get the current scene
    const currentConfig = configRef.current; // Use ref to get most recent state during async ops if needed, but for start is ok
    const scene = currentConfig.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    setConfig(prev => ({
      ...prev,
      scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, status: 'generating_image', errorMsg: undefined } : s)
    }));

    try {
      // Check if cancelled before making API call
      if (signal.aborted) {
        throw new Error('Generation cancelled');
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/38be5295-f513-45bf-9b9a-128482a00dc2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:337',message:'Before generateSceneImage call',data:{sceneId,visualPromptLength:scene.visualPrompt?.length,aspectRatio:currentConfig.aspectRatio},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,B'})}).catch(()=>{});
      // #endregion
      
      const imageData = await generateSceneImage(
        scene.visualPrompt, 
        currentConfig.aspectRatio,
        currentConfig,
        scene
      );
      
      // Check if cancelled after API call
      if (signal.aborted) {
        throw new Error('Generation cancelled');
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/38be5295-f513-45bf-9b9a-128482a00dc2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:348',message:'generateSceneImage returned SUCCESS',data:{hasImageData:!!imageData,imageDataLength:imageData?.length,isDataUrl:imageData?.startsWith?.('data:')},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,C'})}).catch(()=>{});
      // #endregion
      
      let imageUrl = imageData;
      if (currentProjectId) {
        const blobUrl = await uploadSceneImage(currentProjectId, sceneId, imageData);
        if (blobUrl) {
          imageUrl = blobUrl;
          console.log(`✅ Image for scene ${sceneId} uploaded to Blob:`, blobUrl);
        }
      }
      
      // Update config with the blob URL using functional update
      setConfig(prev => {
        const newConfig = {
          ...prev,
          scenes: prev.scenes.map(s => s.id === sceneId ? { 
            ...s, 
            status: 'image_ready' as const, 
            imageUrl 
          } : s)
        };
        
        // Immediately save to ensure the image URL is persisted
        if (currentProjectId) {
          saveProject(currentProjectId, newConfig).then(() => {
            console.log(`✅ Project saved with image for scene ${sceneId}`);
            lastSavedConfigRef.current = JSON.stringify(newConfig);
          });
        }
        
        return newConfig;
      });
    } catch (e: any) {
      // Don't show error if it was intentionally cancelled
      if (e.message === 'Generation cancelled' || signal.aborted) {
        console.log(`🛑 Generation was cancelled for scene ${sceneId}`);
        return;
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/38be5295-f513-45bf-9b9a-128482a00dc2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:385',message:'handleGenerateImage CATCH error',data:{error:e?.message,name:e?.name,stack:e?.stack?.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});
      // #endregion
      
      setConfig(prev => ({
        ...prev,
        scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, status: 'error', errorMsg: e?.message || 'Image generation failed' } : s)
      }));
      setErrorMessage(`Image generation failed for scene ${sceneId}: ${e?.message || 'Unknown error'}`);
    } finally {
      // Clean up the abort controller
      if (abortControllerRef.current?.signal === signal) {
        abortControllerRef.current = null;
      }
    }
  };

  const handleGenerateVideo = async (sceneId: number) => {
    // Get the current scene
    const currentConfig = configRef.current;
    const scene = currentConfig.scenes.find(s => s.id === sceneId);
    if (!scene || !scene.imageUrl) return;

    setConfig(prev => ({
      ...prev,
      scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, status: 'generating_video', errorMsg: undefined } : s)
    }));

    try {
      const videoData = await generateSceneVideo(
        scene.imageUrl, 
        scene.visualPrompt, 
        currentConfig.aspectRatio,
        currentConfig,
        scene
      );
      
      // Upload video to Vercel Blob for persistent storage
      let videoUrl = videoData;
      if (currentProjectId && videoData.startsWith('data:video')) {
        // Convert base64 to blob for upload
        const base64Data = videoData.replace(/^data:video\/mp4;base64,/, '');
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        const videoBlob = new Blob([binaryData], { type: 'video/mp4' });
        
        const blobUrl = await uploadSceneVideo(currentProjectId, sceneId, videoBlob);
        if (blobUrl) {
          videoUrl = blobUrl;
          console.log(`✅ Video for scene ${sceneId} uploaded to Blob:`, blobUrl);
        }
      }
      
      // Update config with the blob URL using functional update
      setConfig(prev => {
        const newConfig = {
          ...prev,
          scenes: prev.scenes.map(s => s.id === sceneId ? { 
            ...s, 
            status: 'video_ready' as const, 
            videoUrl 
          } : s)
        };
        
        // Immediately save to ensure the video URL is persisted
        if (currentProjectId) {
          saveProject(currentProjectId, newConfig).then(() => {
            console.log(`✅ Project saved with video for scene ${sceneId}`);
            lastSavedConfigRef.current = JSON.stringify(newConfig);
          });
        }
        
        return newConfig;
      });
    } catch (e: any) {
      let errorMsg = e.message || 'Video generation failed';
      if (e.message === 'API_KEY_REQUIRED') {
        errorMsg = "API Key Required for Veo";
      }
      setConfig(prev => ({
        ...prev,
        scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, status: 'error', errorMsg } : s)
      }));
      setErrorMessage(`Video generation failed for scene ${sceneId}: ${errorMsg}`);
    }
  };

  const handleExtendVideo = async (sceneId: number) => {
    // Get the current scene
    const currentConfig = configRef.current;
    const scene = currentConfig.scenes.find(s => s.id === sceneId);
    if (!scene || !scene.videoUrl) return;

    setConfig(prev => ({
      ...prev,
      scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, status: 'generating_video', errorMsg: undefined } : s)
    }));

    try {
      // Extend the video
      const extendedVideoData = await extendVideo(
        scene.videoUrl,
        scene.visualPrompt,
        currentConfig
      );
      
      // Upload extended video
      let videoUrl = extendedVideoData;
      if (currentProjectId && extendedVideoData.startsWith('data:video')) {
        const base64Data = extendedVideoData.replace(/^data:video\/mp4;base64,/, '');
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        const videoBlob = new Blob([binaryData], { type: 'video/mp4' });
        
        // We use the same scene ID but maybe we should append a suffix or update the scene
        const blobUrl = await uploadSceneVideo(currentProjectId, sceneId, videoBlob);
        if (blobUrl) {
          videoUrl = blobUrl;
        }
      }
      
      // Update scene with extended video URL and mark as extended
      setConfig(prev => {
        const newConfig = {
          ...prev,
          scenes: prev.scenes.map(s => s.id === sceneId ? { 
            ...s, 
            status: 'video_ready' as const, 
            videoUrl: videoUrl,
            extendedFromVideoUrl: scene.videoUrl, // Keep track
            durationEstimate: s.durationEstimate + 5 // Approximate extension
          } : s)
        };
        
        if (currentProjectId) {
          saveProject(currentProjectId, newConfig);
          lastSavedConfigRef.current = JSON.stringify(newConfig);
        }
        return newConfig;
      });

    } catch (e: any) {
        setConfig(prev => ({
            ...prev,
            scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, status: 'video_ready' as const, errorMsg: 'Extension failed: ' + e.message } : s)
        }));
        setErrorMessage(`Video extension failed: ${e.message}`);
    }
  };

  const handleUpdateScene = useCallback((sceneId: number, updates: Partial<Scene>) => {
    setConfig(prev => ({
      ...prev,
      scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, ...updates } : s)
    }));
  }, []);

  const handleAddCharacter = (character: CharacterProfile) => {
    setConfig(prev => ({
      ...prev,
      characters: [...prev.characters, character]
    }));
  };

  const handleUpdateCharacter = (id: string, updates: Partial<CharacterProfile>) => {
    setConfig(prev => ({
      ...prev,
      characters: prev.characters.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  };

  const handleRemoveCharacter = (id: string) => {
    setConfig(prev => ({
      ...prev,
      characters: prev.characters.filter(c => c.id !== id)
    }));
  };

  const generateAllVideos = async () => {
    setGeneratingAllVideos(true);
    setErrorMessage(null);
    try {
      // Use ref to get latest scene data
      const currentScenes = configRef.current.scenes;
      const scenesToProcess = currentScenes.filter(scene => {
        // Re-check from ref each iteration to get latest status
        const latestScene = configRef.current.scenes.find(s => s.id === scene.id);
        return latestScene && (latestScene.status === 'image_ready' || latestScene.imageUrl) && !latestScene.videoUrl;
      });

      // Process in chunks to avoid rate limits
      const CHUNK_SIZE = 2;
      for (let i = 0; i < scenesToProcess.length; i += CHUNK_SIZE) {
        const chunk = scenesToProcess.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(scene => handleGenerateVideo(scene.id)));
      }
    } catch (e) {
      setErrorMessage("Error generating all videos.");
    } finally {
      setGeneratingAllVideos(false);
    }
  };
  
  const generateAllImages = async () => {
    // Use ref to get latest scene data
    const currentScenes = configRef.current.scenes;
    const scenesToProcess = currentScenes.filter(scene => {
      // Re-check from ref each iteration to get latest status
      const latestScene = configRef.current.scenes.find(s => s.id === scene.id);
      return latestScene && (latestScene.status === 'pending' || latestScene.status === 'error') && !latestScene.imageUrl;
    });

    // Process in chunks
    const CHUNK_SIZE = 3;
    for (let i = 0; i < scenesToProcess.length; i += CHUNK_SIZE) {
       const chunk = scenesToProcess.slice(i, i + CHUNK_SIZE);
       await Promise.all(chunk.map(scene => handleGenerateImage(scene.id)));
    }
  };

  const handleApproveStoryboard = () => {
      setStep(3);
      generateAllImages();
  };

  const handleRenameProject = useCallback(async (id: string, newTitle: string) => {
    // If the renamed project is the current one, update local config title
    if (id === currentProjectId) {
      const newConfig = { ...config, title: newTitle };
      setConfig(newConfig);
      
      // Force immediate save to persist the new name
      // This bypasses the debounce logic which might revert the name if it triggers late
      cancelPendingSave();
      setSaveStatus('saving');
      
      try {
        await saveProject(id, newConfig);
        lastSavedConfigRef.current = JSON.stringify(newConfig);
        lastSyncedTitleRef.current = newTitle;
        setSaveStatus('saved');
        console.log('✅ Project renamed and saved immediately:', newTitle);
      } catch (e) {
        console.error('Failed to save renamed project:', e);
        setSaveStatus('unsaved');
      }
    }
  }, [currentProjectId, config]);

  const handleStepClick = (newStep: number) => {
    // Only allow navigating to steps that have data ready
    // Step 0: Always allowed
    // Step 1: Always allowed
    // Step 2: Only if scenes exist
    // Step 3: Only if step 2 was reached (which means scenes exist)
    
    if (newStep === 0 || newStep === 1) {
      setStep(newStep);
      return;
    }
    
    if (newStep >= 2 && (!config.scenes || config.scenes.length === 0)) {
       setErrorMessage("You need to generate a script before moving to this step.");
       return;
    }
    
    setStep(newStep);
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a]">
      {/* Sidebar */}
      <Sidebar
        currentProjectId={currentProjectId}
        onProjectSelect={handleProjectSelect}
        onNewProject={handleNewProject}
        onRename={handleRenameProject}
        refreshTrigger={sidebarRefreshTrigger}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">
        {/* Error Banner */}
        <AnimatePresence>
          {errorMessage && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-6 py-3 rounded-xl shadow-xl backdrop-blur-md border border-red-400/50 flex items-center gap-3" onClick={() => setErrorMessage(null)}>
               <span className="font-medium">{errorMessage}</span>
               <button onClick={() => setErrorMessage(null)} className="ml-2 hover:bg-white/20 rounded-full p-1">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
          )}
        </AnimatePresence>

        {/* Header */}
        <header className="border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl sticky top-0 z-40">
          <div className="px-6 h-20 flex items-center justify-between">
            <button 
              onClick={() => setStep(0)}
              className="flex items-center gap-4 hover:opacity-80 transition-opacity focus:outline-none"
              aria-label="Go to Home"
            >
              <div className="relative h-16 w-64">
                <Image 
                  src="/logo.png" 
                  alt="DLM Director" 
                  fill 
                  className="object-contain object-left"
                  priority
                />
              </div>
            </button>
            
            <div className="flex items-center gap-6">
              {/* Save Status */}
              <div className={`flex items-center gap-2 text-xs font-medium ${
                saveStatus === 'saved' ? 'text-green-500' : 
                saveStatus === 'saving' ? 'text-yellow-500' : 
                'text-gray-500'
              }`}>
                {saveStatus === 'saving' ? (
                  <LoadingSpinner size={14} color="currentColor" />
                ) : (
                  <SaveIcon />
                )}
                <span>
                  {saveStatus === 'saved' && 'Saved'}
                  {saveStatus === 'saving' && 'Saving...'}
                  {saveStatus === 'unsaved' && 'Unsaved'}
                </span>
              </div>
              
              {config.characters.length > 0 && (
                <span className="text-xs text-gray-500 flex items-center gap-2">
                  <UserIcon /> 
                  <span>{config.characters.length} characters</span>
                </span>
              )}
              
              <div className="text-xs text-gray-500 font-mono bg-white/5 px-3 py-1.5 rounded-lg">
                {config.title || 'Untitled Project'}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto" id="main-scroll-container">
          <div className="py-6">
            <StepIndicator currentStep={step} onStepClick={handleStepClick} />
          </div>
          
          {step === 0 && (
            <ConceptStep 
              config={config} 
              setConfig={setConfig} 
              trending={trending}
              researchLoading={researchLoading}
              onFetchTrending={handleFetchTrending}
              onNext={handleNext}
            />
          )}
          {step === 1 && (
            <ConfigStep 
              config={config}
              setConfig={setConfig}
              extractingEntities={extractingEntities}
              loadingScript={loadingScript}
              onExtractEntities={handleExtractEntities}
              onGenerateScript={handleGenerateScript}
              onBack={handleBack}
              onAddCharacter={handleAddCharacter}
              onUpdateCharacter={handleUpdateCharacter}
              onRemoveCharacter={handleRemoveCharacter}
            />
          )}
          {step === 2 && (
            <ScriptReviewStep 
              config={config}
              onUpdateScene={handleUpdateScene}
              onAddCharacter={handleAddCharacter}
              onUpdateCharacter={handleUpdateCharacter}
              onRemoveCharacter={handleRemoveCharacter}
              onBack={handleBack}
              onNext={handleApproveStoryboard}
            />
          )}
          {step === 3 && (
            <ProductionStep 
              config={config}
              onUpdateConfig={(updates) => setConfig(prev => ({ ...prev, ...updates }))}
              generatingAllVideos={generatingAllVideos}
              onGenerateAllVideos={generateAllVideos}
              onShowPlayer={() => setShowPlayer(true)}
              onGenerateImage={handleGenerateImage}
              onGenerateVideo={handleGenerateVideo}
              onExtendVideo={handleExtendVideo}
              onCancelGeneration={handleCancelGeneration}
            />
          )}
        </main>
      </div>

      {/* Video Player Modal */}
      <AnimatePresence>
        {showPlayer && (
          <VideoPlayer 
            scenes={config.scenes} 
            onClose={() => setShowPlayer(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
