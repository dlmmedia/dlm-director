import React from 'react';
import { ProjectConfig, LightingGuide, LightingStyle } from '@/types';

interface LightingControlPanelProps {
  config: ProjectConfig;
  onUpdate: (updates: Partial<ProjectConfig>) => void;
}

export const LightingControlPanel: React.FC<LightingControlPanelProps> = ({ config, onUpdate }) => {
  // Guard against missing config
  if (!config.lightingGuide) return null;

  const updateLighting = (key: keyof LightingGuide, value: any) => {
    onUpdate({
       lightingGuide: {
          ...config.lightingGuide,
          [key]: value
       }
    });
  };

  return (
     <div className="card-elevated p-6 space-y-6">
       <h3 className="text-lg font-medium text-white flex items-center gap-2">
          Global Lighting System
       </h3>
       
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
             <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Base Style
             </label>
             <select
                value={config.lightingGuide.globalStyle}
                onChange={(e) => updateLighting('globalStyle', e.target.value)}
                className="input select w-full"
             >
                {Object.values(LightingStyle).map(s => (
                    <option key={s} value={s}>{s}</option>
                ))}
             </select>
          </div>

          <div className="space-y-2">
             <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Contrast Ratio
             </label>
             <select
                value={config.lightingGuide.preferredRatios}
                onChange={(e) => updateLighting('preferredRatios', e.target.value)}
                className="input select w-full"
             >
                <option value="low_contrast">Low Contrast (Flat/Even)</option>
                <option value="balanced">Balanced</option>
                <option value="high_contrast">High Contrast (Dramatic)</option>
             </select>
          </div>

           <div className="space-y-2">
             <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Key Light Position
             </label>
             <select
                value={config.lightingGuide.keyLightPosition || 'right'}
                onChange={(e) => updateLighting('keyLightPosition', e.target.value)}
                className="input select w-full"
             >
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="overhead">Overhead</option>
                <option value="bottom">Bottom (Horror/Unnatural)</option>
             </select>
          </div>
       </div>
    </div>
  );
};
