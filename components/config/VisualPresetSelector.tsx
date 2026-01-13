import React from 'react';
import { ProjectConfig, VISUAL_STYLE_PRESETS, VisualStylePreset } from '@/types';
import { CameraIcon } from '@/components/Icons';

interface VisualPresetSelectorProps {
  config: ProjectConfig;
  setConfig: (updates: Partial<ProjectConfig>) => void;
}

export const VisualPresetSelector: React.FC<VisualPresetSelectorProps> = ({ config, setConfig }) => {
  const handleSelectPreset = (preset: VisualStylePreset) => {
    setConfig({
      style: preset.id,
      defaultCamera: preset.defaultCamera,
      defaultLens: preset.defaultLens,
      textureConfig: preset.defaultTextureConfig,
      lightingGuide: preset.defaultLighting,
      subjectBehavior: preset.defaultSubjectBehavior,
      aspectRatio: preset.defaultAspectRatio,
      globalStyle: preset.prompt,
      negativePrompt: preset.negativePrompt
    });
  };

  return (
    <div className="card-elevated p-6">
      <h3 className="text-lg font-medium text-white mb-5 flex items-center gap-3">
        <span className="w-8 h-8 rounded-lg bg-dlm-accent/20 flex items-center justify-center text-dlm-accent">
          <CameraIcon />
        </span>
        Visual Style Presets
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {VISUAL_STYLE_PRESETS.map((preset) => {
          const isSelected = config.style === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className={`text-left p-4 rounded-xl border transition-all h-full flex flex-col ${
                isSelected
                  ? 'border-dlm-accent bg-dlm-accent/10 shadow-[0_0_15px_rgba(255,215,0,0.1)]'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-sm font-medium ${isSelected ? 'text-dlm-accent' : 'text-white'}`}>
                  {preset.name.split(',')[0]}
                </span>
                {isSelected && (
                   <span className="w-2 h-2 rounded-full bg-dlm-accent animate-pulse" />
                )}
              </div>
              <p className="text-xs text-gray-400 mb-3 line-clamp-2 leading-relaxed">
                {preset.prompt}
              </p>
              
              <div className="mt-auto space-y-1 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                   <span>Camera</span>
                   <span className="text-gray-300">{(preset.defaultCamera || '').split(' ')[0]}</span>
                </div>
                 <div className="flex items-center justify-between text-[10px] text-gray-500">
                   <span>Lens</span>
                   <span className="text-gray-300">{(preset.defaultLens || '').split(' ')[0]}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
