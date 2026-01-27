import React from 'react';
import { ProjectConfig, VISUAL_STYLE_PRESETS, VisualStylePreset } from '@/types';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Camera } from 'lucide-react';

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
    <Card className="p-6">
      <h3 className="text-lg font-medium mb-6 flex items-center gap-3">
        <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
          <Camera className="w-4 h-4" />
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
              className={cn(
                "text-left relative flex flex-col h-full rounded-xl transition-all duration-300 group overflow-hidden",
                isSelected
                  ? 'bg-accent/20 shadow-[0_0_20px_rgba(212,175,55,0.1)]'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              {/* Selection Border & Indicator */}
              <div className={cn(
                "absolute inset-0 rounded-xl border transition-colors",
                isSelected ? 'border-primary' : 'border-border group-hover:border-border/80'
              )} />
              
              {isSelected && (
                <div className="absolute top-0 right-0 p-2">
                  <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_#D4AF37]" />
                </div>
              )}

              <div className="p-5 flex flex-col h-full relative z-10">
                <div className="mb-4">
                  <span className={cn(
                    "text-base font-bold tracking-wide uppercase",
                    isSelected ? 'text-primary' : 'text-foreground'
                  )}>
                    {preset.name.split(',')[0]}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed line-clamp-3 flex-grow">
                  {preset.prompt}
                </p>
                
                {/* Tech Specs */}
                <div className="space-y-2 pt-4 border-t border-border font-mono text-xs text-muted-foreground uppercase tracking-wider">
                  <div className="flex items-center justify-between">
                    <span>Camera</span>
                    <span className="text-foreground">{(preset.defaultCamera || '').split(' ')[0]}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Lens</span>
                    <span className="text-foreground">{(preset.defaultLens || '').split(' ')[0]}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
};
