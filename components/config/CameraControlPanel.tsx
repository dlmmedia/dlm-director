import React from 'react';
import { ProjectConfig, CameraBody, LensType, FocalLength, AspectRatio } from '@/types';

interface CameraControlPanelProps {
  config: ProjectConfig;
  onUpdate: (updates: Partial<ProjectConfig>) => void;
}

export const CameraControlPanel: React.FC<CameraControlPanelProps> = ({ config, onUpdate }) => {
  return (
    <div className="card-elevated p-6 space-y-6 border-l-2 border-l-dlm-accent/50">
       <h3 className="text-lg font-medium text-white flex items-center gap-2">
          Camera & Lens System
       </h3>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Camera Body */}
          <div className="space-y-2">
             <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Camera Body
             </label>
             <select
                value={config.defaultCamera}
                onChange={(e) => onUpdate({ defaultCamera: e.target.value as CameraBody })}
                className="input select w-full font-mono text-xs bg-black/40 border-white/10"
             >
                {Object.values(CameraBody).map(cam => (
                   <option key={cam} value={cam}>{cam}</option>
                ))}
             </select>
          </div>

          {/* Lens Type */}
          <div className="space-y-2">
             <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Lens System
             </label>
             <select
                value={config.defaultLens}
                onChange={(e) => onUpdate({ defaultLens: e.target.value as LensType })}
                className="input select w-full font-mono text-xs bg-black/40 border-white/10"
             >
                {Object.values(LensType).map(lens => (
                   <option key={lens} value={lens}>{lens}</option>
                ))}
             </select>
          </div>
          
           {/* Aspect Ratio */}
           <div className="space-y-2">
             <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Aspect Ratio
             </label>
             <select
                value={config.aspectRatio}
                onChange={(e) => onUpdate({ aspectRatio: e.target.value as AspectRatio })}
                className="input select w-full font-mono text-xs bg-black/40 border-white/10"
             >
                {Object.values(AspectRatio).map(ratio => (
                   <option key={ratio} value={ratio}>{ratio}</option>
                ))}
             </select>
          </div>
          
          {/* Film Grain Toggle */}
           <div className="space-y-2 flex items-end pb-1">
              <label className="flex items-center gap-3 cursor-pointer group w-full p-2 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
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
                  onChange={(e) => onUpdate({ filmGrain: e.target.checked })}
                  className="sr-only"
                />
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 group-hover:text-white transition-colors">
                    Film Grain Simulation
                </span>
              </label>
           </div>
       </div>
    </div>
  );
};
