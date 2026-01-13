import React from 'react';
import { 
  ProjectConfig, 
  CharacterProfile 
} from '@/types';
import { 
  MagicIcon, 
  SparkleIcon, 
  ArrowLeftIcon, 
  LoadingSpinner 
} from '@/components/Icons';
import { CharacterManager } from '@/components/CharacterManager';
import { VisualPresetSelector } from '@/components/config/VisualPresetSelector';
import { CameraControlPanel } from '@/components/config/CameraControlPanel';
import { TextureControlPanel } from '@/components/config/TextureControlPanel';
import { LightingControlPanel } from '@/components/config/LightingControlPanel';

interface ConfigStepProps {
  config: ProjectConfig;
  setConfig: React.Dispatch<React.SetStateAction<ProjectConfig>>;
  extractingEntities: boolean;
  loadingScript: boolean;
  onExtractEntities: () => void;
  onGenerateScript: (sceneCount: number) => void;
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
  const [sceneCount, setSceneCount] = React.useState(5);
  const [customCount, setCustomCount] = React.useState('5');
  const [isCustom, setIsCustom] = React.useState(false);

  const handleSceneCountSelect = (val: number | 'custom') => {
    if (val === 'custom') {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      setSceneCount(val);
      setCustomCount(val.toString());
    }
  };

  const handleCustomCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomCount(val);
    const num = parseInt(val);
    if (!isNaN(num) && num > 0) {
      setSceneCount(num);
    }
  };
  
  const updateConfig = (updates: Partial<ProjectConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8 space-y-8">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-3xl font-light text-white">Project Configuration</h2>
          <span className="text-base text-gray-500 font-medium px-4 py-1.5 rounded-full bg-white/5">{config.category}</span>
        </div>
      </div>
      
      {/* 1. Visual Style Presets (The "Brain") */}
      <VisualPresetSelector config={config} setConfig={updateConfig} />

      {/* 2. Deep Configuration Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Camera & Lens */}
         <CameraControlPanel config={config} onUpdate={updateConfig} />
         
         {/* Texture & Material */}
         <TextureControlPanel config={config} onUpdate={updateConfig} />
         
         {/* Lighting */}
         <LightingControlPanel config={config} onUpdate={updateConfig} />
      </div>

      {/* 3. Creative Prompt */}
      <div className="card-elevated p-6">
        <h3 className="text-lg font-medium text-white mb-5 flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
            <MagicIcon />
          </span>
          Creative Vision
        </h3>
        <textarea 
          value={config.userPrompt}
          onChange={(e) => updateConfig({ userPrompt: e.target.value })}
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

      {/* 4. Characters */}
      <div className="card-elevated p-6">
        <CharacterManager
          characters={config.characters}
          config={config}
          onAddCharacter={onAddCharacter}
          onUpdateCharacter={onUpdateCharacter}
          onRemoveCharacter={onRemoveCharacter}
        />
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-end pt-6">
        <button onClick={onBack} className="btn-ghost">
          <ArrowLeftIcon />
          <span>Back</span>
        </button>
        
        <div className="flex flex-col items-end gap-3">
            {/* Scene Count Selector */}
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
                <span className="text-xs text-gray-500 font-medium px-2">Scenes:</span>
                {[5, 10, 15].map(num => (
                    <button
                        key={num}
                        onClick={() => handleSceneCountSelect(num)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                            !isCustom && sceneCount === num 
                                ? 'bg-white/20 text-white shadow-sm' 
                                : 'text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        {num}
                    </button>
                ))}
                <button
                    onClick={() => handleSceneCountSelect('custom')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                        isCustom
                            ? 'bg-white/20 text-white shadow-sm' 
                            : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                >
                    Custom
                </button>
                {isCustom && (
                    <input 
                        type="number" 
                        min="1" 
                        max="50"
                        value={customCount}
                        onChange={handleCustomCountChange}
                        className="w-12 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white text-center focus:border-dlm-accent outline-none"
                    />
                )}
            </div>

            <button 
            onClick={() => onGenerateScript(sceneCount)}
            disabled={loadingScript || !config.userPrompt}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
            {loadingScript ? (
                <>
                <LoadingSpinner size={20} color="#000" />
                <span>Generating Script ({sceneCount} scenes)...</span>
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
    </div>
  );
}
