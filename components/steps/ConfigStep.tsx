import React from 'react';
import { 
  ProjectConfig, 
  AspectRatio, 
  VISUAL_STYLE_PRESETS, 
  CINEMATIC_PALETTES, 
  CharacterProfile 
} from '@/types';
import { 
  CameraIcon, 
  MagicIcon, 
  SparkleIcon, 
  ArrowLeftIcon, 
  LoadingSpinner 
} from '@/components/Icons';
import { CharacterManager } from '@/components/CharacterManager';

interface ConfigStepProps {
  config: ProjectConfig;
  setConfig: React.Dispatch<React.SetStateAction<ProjectConfig>>;
  extractingEntities: boolean;
  loadingScript: boolean;
  onExtractEntities: () => void;
  onGenerateScript: () => void;
  onBack: () => void;
  onAddCharacter: (character: CharacterProfile) => void;
  onUpdateCharacter: (id: string, updates: Partial<CharacterProfile>) => void;
  onRemoveCharacter: (id: string) => void;
}

export default function ConfigStep({
  config,
  setConfig,
  extractingEntities,
  loadingScript,
  onExtractEntities,
  onGenerateScript,
  onBack,
  onAddCharacter,
  onUpdateCharacter,
  onRemoveCharacter
}: ConfigStepProps) {
  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8 space-y-8">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-3xl font-light text-white">Project Configuration</h2>
          <span className="text-base text-gray-500 font-medium px-4 py-1.5 rounded-full bg-white/5">{config.category}</span>
        </div>
      </div>
      
      {/* Visual Style */}
      <div className="card-elevated p-6">
        <h3 className="text-lg font-medium text-white mb-5 flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-dlm-accent/20 flex items-center justify-center text-dlm-accent">
            <CameraIcon />
          </span>
          Visual Style
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {VISUAL_STYLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setConfig({ ...config, style: preset.id })}
              className={`p-4 rounded-xl border text-left transition-all ${
                config.style === preset.id
                  ? 'border-dlm-accent bg-dlm-accent/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <span className={`text-sm font-medium ${config.style === preset.id ? 'text-dlm-accent' : 'text-white'}`}>
                {preset.name.split(',')[0]}
              </span>
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Aspect Ratio</label>
            <select 
              value={config.aspectRatio}
              onChange={(e) => setConfig({...config, aspectRatio: e.target.value as AspectRatio})}
              className="input select"
            >
              {Object.values(AspectRatio).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Color Palette</label>
            <select 
              value={config.defaultColorPalette}
              onChange={(e) => setConfig({...config, defaultColorPalette: e.target.value})}
              className="input select"
            >
              {Object.entries(CINEMATIC_PALETTES).map(([key, palette]) => (
                <option key={key} value={key}>{palette.description.split(',')[0]}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex gap-4 mt-5">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                config.filmGrain 
                  ? 'border-dlm-accent bg-dlm-accent' 
                  : 'border-white/20 group-hover:border-white/40'
              }`}
            >
              {config.filmGrain && (
                <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <input
              type="checkbox"
              checked={config.filmGrain}
              onChange={(e) => setConfig({ ...config, filmGrain: e.target.checked })}
              className="sr-only"
            />
            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Film Grain</span>
          </label>
        </div>
      </div>

      {/* Creative Prompt */}
      <div className="card-elevated p-6">
        <h3 className="text-lg font-medium text-white mb-5 flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
            <MagicIcon />
          </span>
          Creative Vision
        </h3>
        <textarea 
          value={config.userPrompt}
          onChange={(e) => setConfig({...config, userPrompt: e.target.value})}
          placeholder="Describe your video idea in detail... Include characters, settings, mood, and key moments."
          className="input resize-none h-36"
        />
        <div className="flex justify-between items-center mt-4">
          <span className="text-xs text-gray-500">
            Tip: Be specific about characters and locations for better consistency
          </span>
          <button
            onClick={onExtractEntities}
            disabled={!config.userPrompt || extractingEntities}
            className="btn-ghost text-dlm-accent disabled:opacity-50"
          >
            {extractingEntities ? (
              <LoadingSpinner size={16} />
            ) : (
              <SparkleIcon />
            )}
            <span>{extractingEntities ? 'Extracting...' : 'Extract Characters & Locations'}</span>
          </button>
        </div>
      </div>

      {/* Characters */}
      <div className="card-elevated p-6">
        <CharacterManager
          characters={config.characters}
          onAddCharacter={onAddCharacter}
          onUpdateCharacter={onUpdateCharacter}
          onRemoveCharacter={onRemoveCharacter}
        />
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button onClick={onBack} className="btn-ghost">
          <ArrowLeftIcon />
          <span>Back</span>
        </button>
        <button 
          onClick={onGenerateScript}
          disabled={loadingScript || !config.userPrompt}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingScript ? (
            <>
              <LoadingSpinner size={20} color="#000" />
              <span>Generating Script...</span>
            </>
          ) : (
            <>
              <MagicIcon />
              <span>Generate Cinematic Script</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
