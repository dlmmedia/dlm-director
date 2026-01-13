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
      <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-3">
        <span className="w-8 h-8 rounded-lg bg-dlm-accent/20 flex items-center justify-center text-dlm-accent">
          <CameraIcon />
        </span>
        Visual Style Presets
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {VISUAL_STYLE_PRESETS.map((preset) => {
          const isSelected = config.style === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className={`text-left relative flex flex-col h-full rounded-xl transition-all duration-300 group overflow-hidden ${
                isSelected
                  ? 'bg-white/10 shadow-[0_0_20px_rgba(212,175,55,0.1)]'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              {/* Selection Border & Indicator */}
              <div className={`absolute inset-0 rounded-xl border transition-colors ${
                 isSelected ? 'border-dlm-accent' : 'border-white/10 group-hover:border-white/20'
              }`} />
              
              {isSelected && (
                 <div className="absolute top-0 right-0 p-2">
                    <div className="w-2 h-2 rounded-full bg-dlm-accent shadow-[0_0_10px_#D4AF37]" />
                 </div>
              )}

              <div className="p-5 flex flex-col h-full relative z-10">
                <div className="mb-4">
                    <span className={`text-sm font-bold tracking-wide uppercase ${
                        isSelected ? 'text-dlm-accent' : 'text-white'
                    }`}>
                      {preset.name.split(',')[0]}
                    </span>
                </div>
                
                <p className="text-xs text-gray-400 mb-6 leading-relaxed line-clamp-3 flex-grow">
                  {preset.prompt}
                </p>
                
                {/* Tech Specs */}
                <div className="space-y-2 pt-4 border-t border-white/5 font-mono text-[10px] text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-between">
                     <span>Camera</span>
                     <span className="text-gray-300">{(preset.defaultCamera || '').split(' ')[0]}</span>
                  </div>
                   <div className="flex items-center justify-between">
                     <span>Lens</span>
                     <span className="text-gray-300">{(preset.defaultLens || '').split(' ')[0]}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
