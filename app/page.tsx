'use client';

// ========================================
// DLM DIRECTOR - MAIN PAGE
// Elite AI Cinematic Video Agent
// ========================================

import React, { useState, useCallback, useEffect } from 'react';
import { 
  VideoCategory, 
  AspectRatio, 
  ProjectConfig, 
  Scene, 
  TrendingTopic,
  CharacterProfile,
  VISUAL_STYLE_PRESETS,
  CINEMATIC_PALETTES,
  createDefaultConfig,
} from '@/types';
import { 
  generateScript, 
  generateSceneImage, 
  generateSceneVideo, 
  fetchTrendingTopics,
  extractCharactersFromPrompt,
  extractLocationsFromPrompt,
} from '@/services/geminiService';
import { StepIndicator } from '@/components/StepIndicator';
import { VideoPlayer } from '@/components/VideoPlayer';
import { CharacterManager } from '@/components/CharacterManager';
import { CinematographyControls, ShotPresets } from '@/components/CinematographyControls';
import { Sidebar } from '@/components/Sidebar';
import { 
  fetchProject, 
  saveProject as saveProjectToBlob,
  createProject as createProjectAPI,
  debouncedSave,
  uploadSceneImage,
  ProjectListItem
} from '@/lib/projectStore';

// --- SVG Icons ---
const FilmIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>;
const MagicIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
const RefreshIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const PlayIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>;
const VideoIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const UserIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const CameraIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const SparkleIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
const SaveIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>;

export default function Home() {
  // --- STATE ---
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<ProjectConfig>(createDefaultConfig());
  const [trending, setTrending] = useState<TrendingTopic[]>([]);
  const [loadingScript, setLoadingScript] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [generatingAllVideos, setGeneratingAllVideos] = useState(false);
  const [researchLoading, setResearchLoading] = useState(false);
  const [extractingEntities, setExtractingEntities] = useState(false);
  const [activeTab, setActiveTab] = useState<'scenes' | 'characters' | 'settings'>('scenes');
  const [expandedScene, setExpandedScene] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // --- AUTO-SAVE EFFECT ---
  useEffect(() => {
    if (currentProjectId && config) {
      setSaveStatus('unsaved');
      debouncedSave(currentProjectId, config);
      // Set saved status after debounce period
      const timer = setTimeout(() => setSaveStatus('saved'), 2500);
      return () => clearTimeout(timer);
    }
  }, [config, currentProjectId]);

  // --- HANDLERS ---

  const handleProjectSelect = async (id: string) => {
    setSaveStatus('saving');
    const project = await fetchProject(id);
    if (project) {
      setCurrentProjectId(id);
      setConfig(project.config || createDefaultConfig());
      setStep(project.config?.scenes?.length > 0 ? 2 : 0);
      setSaveStatus('saved');
    }
  };

  const handleNewProject = async () => {
    const project = await createProjectAPI('New Project');
    if (project) {
      setCurrentProjectId(project.id);
      setConfig(createDefaultConfig());
      setStep(0);
    }
  };

  const handleFetchTrending = async () => {
    setResearchLoading(true);
    const data = await fetchTrendingTopics(config.category);
    setTrending(data);
    setResearchLoading(false);
  };

  const handleExtractEntities = async () => {
    if (!config.userPrompt) return;
    setExtractingEntities(true);
    
    try {
      const [characters, locations] = await Promise.all([
        extractCharactersFromPrompt(config.userPrompt),
        extractLocationsFromPrompt(config.userPrompt)
      ]);
      
      setConfig(prev => ({
        ...prev,
        characters: [...prev.characters, ...characters],
        locations: [...prev.locations, ...locations]
      }));
    } catch (e) {
      console.error("Entity extraction failed:", e);
    } finally {
      setExtractingEntities(false);
    }
  };

  const handleGenerateScript = async () => {
    if (!config.userPrompt) return;
    setLoadingScript(true);
    try {
      const scenes = await generateScript(
        config.category, 
        config.style, 
        config.userPrompt,
        config,
        5
      );
      setConfig(prev => ({ ...prev, scenes }));
      setStep(2);
    } catch (e) {
      alert("Failed to generate script. Please try again.");
    } finally {
      setLoadingScript(false);
    }
  };

  const handleGenerateImage = async (sceneId: number) => {
    setConfig(prev => ({
      ...prev,
      scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, status: 'generating_image', errorMsg: undefined } : s)
    }));

    const scene = config.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    try {
      const imageData = await generateSceneImage(
        scene.visualPrompt, 
        config.aspectRatio,
        config,
        scene
      );
      
      // Upload to blob storage if we have a project ID
      let imageUrl = imageData;
      if (currentProjectId) {
        const blobUrl = await uploadSceneImage(currentProjectId, sceneId, imageData);
        if (blobUrl) {
          imageUrl = blobUrl;
        }
      }
      
      setConfig(prev => ({
        ...prev,
        scenes: prev.scenes.map(s => s.id === sceneId ? { 
          ...s, 
          status: 'image_ready', 
          imageUrl 
        } : s)
      }));
    } catch (e) {
      setConfig(prev => ({
        ...prev,
        scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, status: 'error', errorMsg: 'Image generation failed' } : s)
      }));
    }
  };

  const handleGenerateVideo = async (sceneId: number) => {
    setConfig(prev => ({
      ...prev,
      scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, status: 'generating_video', errorMsg: undefined } : s)
    }));

    const scene = config.scenes.find(s => s.id === sceneId);
    if (!scene || !scene.imageUrl) return;

    try {
      const videoUrl = await generateSceneVideo(
        scene.imageUrl, 
        scene.visualPrompt, 
        config.aspectRatio,
        config,
        scene
      );
      
      setConfig(prev => ({
        ...prev,
        scenes: prev.scenes.map(s => s.id === sceneId ? { 
          ...s, 
          status: 'video_ready', 
          videoUrl 
        } : s)
      }));
    } catch (e: any) {
      let errorMsg = 'Video generation failed';
      if (e.message === 'API_KEY_REQUIRED') {
        errorMsg = "API Key Required for Veo";
      }
      setConfig(prev => ({
        ...prev,
        scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, status: 'error', errorMsg } : s)
      }));
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

  const generateAllImages = async () => {
    for (const scene of config.scenes) {
      if (scene.status === 'pending' || scene.status === 'error') {
        await handleGenerateImage(scene.id);
      }
    }
  };

  const generateAllVideos = async () => {
    setGeneratingAllVideos(true);
    for (const scene of config.scenes) {
      if ((scene.status === 'image_ready' || scene.status === 'video_ready') && !scene.videoUrl) {
        await handleGenerateVideo(scene.id);
      }
    }
    setGeneratingAllVideos(false);
  };

  // Calculate stats
  const totalDuration = config.scenes.reduce((acc, s) => acc + s.durationEstimate, 0);
  const imagesReady = config.scenes.filter(s => s.imageUrl).length;
  const videosReady = config.scenes.filter(s => s.videoUrl).length;

  // --- VIEWS ---

  // STEP 0: CONCEPT
  const renderConceptStep = () => (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 animate-fade-in">
      <div className="text-center space-y-3 md:space-y-4">
        <h1 className="text-3xl md:text-5xl font-serif text-white tracking-tight">
          DLM Director <span className="text-dlm-accent">.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-400">Elite Cinematic Video Generation</p>
        <p className="text-xs md:text-sm text-gray-600 max-w-2xl mx-auto px-4">
          AI-powered film direction with character consistency, professional cinematography, 
          and seamless scene stitching. Create videos that look like they belong together.
        </p>
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm text-gray-400 mb-3 px-1">Project Type</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
          {Object.values(VideoCategory).map((cat) => (
            <button
              key={cat}
              onClick={() => setConfig({ ...config, category: cat })}
              className={`px-3 py-3 md:p-4 rounded-lg border transition-all duration-300 text-center ${
                config.category === cat 
                  ? 'border-dlm-accent bg-dlm-800 shadow-[0_0_20px_rgba(212,175,55,0.1)]' 
                  : 'border-dlm-700 bg-dlm-900 hover:border-dlm-600'
              }`}
            >
              <span className={`text-xs md:text-sm font-medium leading-tight block ${config.category === cat ? 'text-dlm-accent' : 'text-gray-300'}`}>
                {cat}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Trending / Research */}
      <div className="bg-dlm-800 rounded-xl p-6 border border-dlm-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-white flex items-center gap-2">
            <span className="text-dlm-secondary">●</span> Market Research
          </h2>
          <button 
            onClick={handleFetchTrending} 
            disabled={researchLoading}
            className="text-sm text-dlm-accent hover:text-white flex items-center gap-1 disabled:opacity-50 transition-colors"
          >
            <RefreshIcon /> {researchLoading ? 'Analyzing...' : 'Analyze Trends'}
          </button>
        </div>
        {trending.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-3">
            {trending.map((t, i) => (
              <div 
                key={i} 
                className="bg-dlm-900 p-4 rounded-lg border border-dlm-700 hover:border-dlm-accent cursor-pointer transition-colors"
                onClick={() => setConfig({...config, userPrompt: `Create a video about: ${t.title}. ${t.description}`})}
              >
                <h4 className="text-white font-medium mb-1 truncate">{t.title}</h4>
                <p className="text-xs text-gray-400 line-clamp-2">{t.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic">
            Analyze market trends to get data-driven inspiration for your {config.category}.
          </p>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <button 
          onClick={() => setStep(1)}
          className="px-8 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors"
        >
          Next: Configuration →
        </button>
      </div>
    </div>
  );

  // STEP 1: CONFIGURATION
  const renderConfigStep = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-serif text-white">Project Configuration</h2>
        <span className="text-sm text-gray-500">{config.category}</span>
      </div>
      
      {/* Visual Style */}
      <div className="bg-dlm-800 rounded-xl p-6 border border-dlm-700">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <CameraIcon /> Visual Style
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {VISUAL_STYLE_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => setConfig({ ...config, style: preset.id })}
              className={`p-3 rounded-lg border text-left transition-all ${
                config.style === preset.id
                  ? 'border-dlm-accent bg-dlm-700'
                  : 'border-dlm-600 bg-dlm-900 hover:border-dlm-500'
              }`}
            >
              <span className={`text-sm font-medium block ${config.style === preset.id ? 'text-dlm-accent' : 'text-white'}`}>
                {preset.name.split(',')[0]}
              </span>
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">Aspect Ratio</label>
            <select 
              value={config.aspectRatio}
              onChange={(e) => setConfig({...config, aspectRatio: e.target.value as AspectRatio})}
              className="w-full bg-dlm-900 border border-dlm-600 rounded-lg p-3 text-white focus:border-dlm-accent outline-none"
            >
              {Object.values(AspectRatio).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2">Color Palette</label>
            <select 
              value={config.defaultColorPalette}
              onChange={(e) => setConfig({...config, defaultColorPalette: e.target.value})}
              className="w-full bg-dlm-900 border border-dlm-600 rounded-lg p-3 text-white focus:border-dlm-accent outline-none"
            >
              {Object.entries(CINEMATIC_PALETTES).map(([key, palette]) => (
                <option key={key} value={key}>{palette.description.split(',')[0]}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex gap-4 mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.filmGrain}
              onChange={(e) => setConfig({ ...config, filmGrain: e.target.checked })}
              className="w-4 h-4 rounded border-dlm-600 bg-dlm-900 text-dlm-accent focus:ring-dlm-accent"
            />
            <span className="text-sm text-gray-300">Film Grain</span>
          </label>
        </div>
      </div>

      {/* Creative Prompt */}
      <div className="bg-dlm-800 rounded-xl p-6 border border-dlm-700">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <MagicIcon /> Creative Vision
        </h3>
        <textarea 
          value={config.userPrompt}
          onChange={(e) => setConfig({...config, userPrompt: e.target.value})}
          placeholder="Describe your video idea in detail... Include characters, settings, mood, and key moments."
          className="w-full h-36 bg-dlm-900 border border-dlm-600 rounded-lg p-4 text-white focus:border-dlm-accent outline-none resize-none"
        />
        <div className="flex justify-between items-center mt-3">
          <span className="text-xs text-gray-500">
            Tip: Be specific about characters and locations for better consistency
          </span>
          <button
            onClick={handleExtractEntities}
            disabled={!config.userPrompt || extractingEntities}
            className="text-sm text-dlm-accent hover:text-white flex items-center gap-1 disabled:opacity-50 transition-colors"
          >
            <SparkleIcon /> 
            {extractingEntities ? 'Extracting...' : 'Extract Characters & Locations'}
          </button>
        </div>
      </div>

      {/* Characters */}
      <div className="bg-dlm-800 rounded-xl p-6 border border-dlm-700">
        <CharacterManager
          characters={config.characters}
          onAddCharacter={handleAddCharacter}
          onUpdateCharacter={handleUpdateCharacter}
          onRemoveCharacter={handleRemoveCharacter}
        />
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button onClick={() => setStep(0)} className="text-gray-400 hover:text-white transition-colors">
          ← Back
        </button>
        <button 
          onClick={handleGenerateScript}
          disabled={loadingScript || !config.userPrompt}
          className="px-8 py-3 bg-dlm-accent text-black font-bold rounded-lg hover:bg-dlm-accentHover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {loadingScript ? (
            <>
              <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Script...
            </>
          ) : (
            <>
              <MagicIcon /> Generate Cinematic Script
            </>
          )}
        </button>
      </div>
    </div>
  );

  // STEP 2: SCRIPT REVIEW
  const renderScriptStep = () => (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif text-white">Script Review</h2>
          <p className="text-gray-500 text-sm mt-1">
            {config.scenes.length} Scenes • {totalDuration}s Total • {config.characters.length} Characters
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('scenes')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'scenes' ? 'bg-dlm-accent text-black' : 'bg-dlm-800 text-gray-300 hover:text-white'
            }`}
          >
            Scenes
          </button>
          <button
            onClick={() => setActiveTab('characters')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'characters' ? 'bg-dlm-accent text-black' : 'bg-dlm-800 text-gray-300 hover:text-white'
            }`}
          >
            Characters ({config.characters.length})
          </button>
        </div>
      </div>

      {activeTab === 'scenes' ? (
        <div className="space-y-4">
          {config.scenes.map((scene, idx) => (
            <div 
              key={scene.id} 
              className="bg-dlm-800 rounded-xl border border-dlm-700 hover:border-dlm-600 transition-colors overflow-hidden"
            >
              {/* Scene Header */}
              <div 
                className="flex items-start gap-4 p-5 cursor-pointer"
                onClick={() => setExpandedScene(expandedScene === scene.id ? null : scene.id)}
              >
                <div className="w-10 h-10 rounded-full bg-dlm-accent/20 flex items-center justify-center text-dlm-accent font-bold text-sm shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-dlm-700 text-gray-300">{scene.shotType}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-dlm-700 text-gray-300">{scene.cameraAngle}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-dlm-700 text-gray-300">{scene.cameraMovement}</span>
                  </div>
                  <p className="text-gray-300 line-clamp-2">{scene.narration}</p>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                  <span className="text-sm text-dlm-accent font-medium">{scene.durationEstimate}s</span>
                  <svg 
                    className={`w-4 h-4 text-gray-500 transition-transform ${expandedScene === scene.id ? 'rotate-180' : ''}`}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedScene === scene.id && (
                <div className="border-t border-dlm-700 p-5 space-y-4">
                  {/* Visual Prompt */}
                  <div>
                    <label className="text-xs text-dlm-accent uppercase tracking-wider font-semibold block mb-2">
                      Visual Prompt
                    </label>
                    <textarea 
                      value={scene.visualPrompt}
                      onChange={(e) => handleUpdateScene(scene.id, { visualPrompt: e.target.value })}
                      className="w-full bg-dlm-900/50 text-gray-300 text-sm p-3 rounded-lg border border-dlm-600 focus:border-dlm-accent outline-none resize-none"
                      rows={4}
                    />
                  </div>

                  {/* Cinematography Controls */}
                  <div>
                    <label className="text-xs text-blue-400 uppercase tracking-wider font-semibold block mb-2">
                      Cinematography
                    </label>
                    <ShotPresets onApply={(preset) => handleUpdateScene(scene.id, preset)} />
                    <div className="mt-3">
                      <CinematographyControls
                        scene={scene}
                        onChange={(updates) => handleUpdateScene(scene.id, updates)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-dlm-800 rounded-xl p-6 border border-dlm-700">
          <CharacterManager
            characters={config.characters}
            onAddCharacter={handleAddCharacter}
            onUpdateCharacter={handleUpdateCharacter}
            onRemoveCharacter={handleRemoveCharacter}
          />
        </div>
      )}

      <div className="flex justify-between pt-6">
        <button onClick={() => setStep(1)} className="text-gray-400 hover:text-white transition-colors">
          ← Back
        </button>
        <button 
          onClick={() => { setStep(3); generateAllImages(); }}
          className="px-8 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors"
        >
          Approve & Generate Storyboard →
        </button>
      </div>
    </div>
  );

  // STEP 3: STORYBOARD & PRODUCTION
  const renderStoryboardStep = () => (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-serif text-white mb-2">Production Studio</h2>
          <div className="flex gap-4 text-sm">
            <span className="text-gray-400">
              <span className="text-blue-400 font-medium">{imagesReady}</span>/{config.scenes.length} Images
            </span>
            <span className="text-gray-400">
              <span className="text-green-400 font-medium">{videosReady}</span>/{config.scenes.length} Videos
            </span>
            <span className="text-gray-400">
              {totalDuration}s Total
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={generateAllVideos}
            disabled={generatingAllVideos || imagesReady === 0}
            className="px-5 py-2 bg-dlm-accent text-black font-bold rounded-lg hover:bg-dlm-accentHover disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {generatingAllVideos ? 'Rendering Queue...' : 'Render All Videos'} <VideoIcon />
          </button>
          <button 
            onClick={() => setShowPlayer(true)}
            disabled={videosReady === 0}
            className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            Watch Film <PlayIcon />
          </button>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-dlm-800 rounded-lg p-4 border border-dlm-700">
        <div className="flex gap-1">
          {config.scenes.map((scene) => (
            <div 
              key={scene.id}
              className={`flex-1 h-2 rounded-full transition-colors ${
                scene.videoUrl ? 'bg-green-500' :
                scene.imageUrl ? 'bg-blue-500' :
                scene.status === 'generating_image' || scene.status === 'generating_video' ? 'bg-yellow-500 animate-pulse' :
                scene.status === 'error' ? 'bg-red-500' :
                'bg-dlm-600'
              }`}
              title={`Scene ${scene.id}: ${scene.status}`}
            />
          ))}
        </div>
      </div>

      {/* Scene Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {config.scenes.map((scene) => (
          <div key={scene.id} className="bg-dlm-800 rounded-xl overflow-hidden border border-dlm-700 group relative">
            {/* Status Badge */}
            <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded bg-black/70 backdrop-blur text-xs font-mono text-white">
              {scene.status === 'pending' && 'PENDING'}
              {scene.status === 'generating_image' && <span className="text-yellow-400 animate-pulse">GEN IMG...</span>}
              {scene.status === 'image_ready' && <span className="text-blue-400">IMG READY</span>}
              {scene.status === 'generating_video' && <span className="text-purple-400 animate-pulse">RENDERING VEO...</span>}
              {scene.status === 'video_ready' && <span className="text-green-400">✓ COMPLETE</span>}
              {scene.status === 'error' && <span className="text-red-500">ERROR</span>}
            </div>

            {/* Main Visual Area */}
            <div className="aspect-video bg-black relative flex items-center justify-center">
              {scene.imageUrl ? (
                <>
                  <img 
                    src={scene.imageUrl} 
                    alt={`Scene ${scene.id}`} 
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" 
                  />
                  {scene.videoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-green-500/80 backdrop-blur flex items-center justify-center text-white">
                        <PlayIcon />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-gray-700">
                  {scene.status === 'generating_image' ? (
                    <div className="w-8 h-8 border-2 border-dlm-accent border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-xs text-gray-600">No Image</span>
                  )}
                </div>
              )}
            </div>

            {/* Scene Info */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-dlm-accent font-bold">Scene {scene.id}</span>
                <span className="text-xs text-gray-500">{scene.durationEstimate}s</span>
              </div>
              
              <p className="text-gray-300 text-xs line-clamp-2 h-8">{scene.narration}</p>
              
              {/* Cinematography tags */}
              <div className="flex flex-wrap gap-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-dlm-700/50 text-gray-400">
                  {scene.shotType.split(' ')[0]}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-dlm-700/50 text-gray-400">
                  {scene.cameraMovement.split(' ')[0]}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-dlm-700/50 text-gray-400">
                  {scene.lightingStyle.split(' ')[0]}
                </span>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => handleGenerateImage(scene.id)}
                  disabled={scene.status === 'generating_image'}
                  className="flex-1 py-2 text-xs border border-dlm-600 text-gray-300 hover:text-white hover:border-gray-400 rounded-lg transition-colors disabled:opacity-50"
                >
                  {scene.imageUrl ? 'Regenerate' : 'Generate'} Image
                </button>
                <button 
                  onClick={() => handleGenerateVideo(scene.id)}
                  disabled={!scene.imageUrl || scene.status === 'generating_video'}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                    scene.videoUrl 
                      ? 'bg-green-900/40 text-green-400 border border-green-800 hover:bg-green-900/60'
                      : 'bg-dlm-accent text-black hover:bg-dlm-accentHover'
                  } disabled:opacity-30`}
                >
                  {scene.videoUrl ? 'Re-Render' : 'Veo Render'}
                </button>
              </div>
              
              {scene.errorMsg && (
                <p className="text-red-400 text-xs bg-red-900/20 rounded p-2">{scene.errorMsg}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // --- MAIN RENDER ---
  return (
    <div className="flex h-screen bg-[#050505]">
      {/* Sidebar */}
      <Sidebar
        currentProjectId={currentProjectId}
        onProjectSelect={handleProjectSelect}
        onNewProject={handleNewProject}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-dlm-800 bg-[#050505]/90 backdrop-blur-sm sticky top-0 z-40">
          <div className="px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-dlm-accent to-yellow-700 rounded-lg flex items-center justify-center text-black font-bold font-serif text-lg">
                D
              </div>
              <div>
                <span className="font-serif font-bold tracking-wide">DLM Director</span>
                <span className="text-xs text-dlm-accent ml-2 font-medium">ADVANCED</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Save Status */}
              <div className={`flex items-center gap-1.5 text-xs ${
                saveStatus === 'saved' ? 'text-green-500' : 
                saveStatus === 'saving' ? 'text-yellow-500' : 
                'text-gray-500'
              }`}>
                <SaveIcon />
                {saveStatus === 'saved' && 'Saved'}
                {saveStatus === 'saving' && 'Saving...'}
                {saveStatus === 'unsaved' && 'Unsaved changes'}
              </div>
              {config.characters.length > 0 && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <UserIcon /> {config.characters.length} characters
                </span>
              )}
              <div className="text-xs text-gray-500 font-mono">
                {config.title || 'Untitled Project'}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6 md:py-10">
          <StepIndicator currentStep={step} />
          
          <div className="mt-6 md:mt-8">
            {step === 0 && renderConceptStep()}
            {step === 1 && renderConfigStep()}
            {step === 2 && renderScriptStep()}
            {step === 3 && renderStoryboardStep()}
          </div>
        </main>
      </div>

      {/* Video Player Modal */}
      {showPlayer && (
        <VideoPlayer 
          scenes={config.scenes} 
          onClose={() => setShowPlayer(false)} 
        />
      )}

      {/* Custom Animation Styles */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
