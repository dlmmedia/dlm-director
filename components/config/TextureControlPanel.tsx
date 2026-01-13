import React from 'react';
import { ProjectConfig, TextureConfig } from '@/types';

interface TextureControlPanelProps {
  config: ProjectConfig;
  onUpdate: (updates: Partial<ProjectConfig>) => void;
}

export const TextureControlPanel: React.FC<TextureControlPanelProps> = ({ config, onUpdate }) => {
  // Guard against missing config
  if (!config.textureConfig) return null;

  const updateTexture = (key: keyof TextureConfig, value: any) => {
    onUpdate({
       textureConfig: {
          ...config.textureConfig,
          [key]: value
       }
    });
  };

  return (
    <div className="card-elevated p-6 space-y-6 border-l-2 border-l-dlm-accent/50">
       <h3 className="text-lg font-medium text-white flex items-center gap-2">
          Texture & Materials
       </h3>
       
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Skin Detail */}
          <div className="space-y-2">
             <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Skin Texture
             </label>
             <select
                value={config.textureConfig.skinDetail}
                onChange={(e) => updateTexture('skinDetail', e.target.value)}
                className="input select w-full font-mono text-xs bg-black/40 border-white/10"
             >
                <option value="smooth">Smooth / Retouched</option>
                <option value="natural">Natural</option>
                <option value="highly_detailed">Highly Detailed (Pores)</option>
                <option value="rough">Rough / Weathered</option>
             </select>
          </div>

          {/* Fabric Texture */}
          <div className="space-y-2">
             <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Fabric Detail
             </label>
             <select
                value={config.textureConfig.fabricTexture}
                onChange={(e) => updateTexture('fabricTexture', e.target.value)}
                className="input select w-full font-mono text-xs bg-black/40 border-white/10"
             >
                <option value="standard">Standard</option>
                <option value="high_fidelity">High Fidelity</option>
                <option value="visible_weave">Visible Weave</option>
             </select>
          </div>
          
           {/* Environment Detail */}
          <div className="space-y-2">
             <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Environment Complexity
             </label>
             <select
                value={config.textureConfig.environmentDetail}
                onChange={(e) => updateTexture('environmentDetail', e.target.value)}
                className="input select w-full font-mono text-xs bg-black/40 border-white/10"
             >
                <option value="minimalist">Minimalist / Clean</option>
                <option value="balanced">Balanced</option>
                <option value="high_complexity">High Complexity / Cluttered</option>
             </select>
          </div>
          
           {/* Toggles */}
           <div className="space-y-3 pt-4">
              <label className="flex items-center gap-3 cursor-pointer group p-1.5 hover:bg-white/5 rounded transition-colors">
                <input
                  type="checkbox"
                  checked={config.textureConfig.skinImperfections}
                  onChange={(e) => updateTexture('skinImperfections', e.target.checked)}
                  className="w-3 h-3 rounded border-white/20 bg-white/5 text-dlm-accent focus:ring-offset-0 focus:ring-dlm-accent"
                />
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 group-hover:text-white transition-colors">Enable Skin Imperfections</span>
              </label>

               <label className="flex items-center gap-3 cursor-pointer group p-1.5 hover:bg-white/5 rounded transition-colors">
                <input
                  type="checkbox"
                  checked={config.textureConfig.reflectiveSurfaces}
                  onChange={(e) => updateTexture('reflectiveSurfaces', e.target.checked)}
                   className="w-3 h-3 rounded border-white/20 bg-white/5 text-dlm-accent focus:ring-offset-0 focus:ring-dlm-accent"
                />
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 group-hover:text-white transition-colors">Enhanced Reflections</span>
              </label>
           </div>
       </div>
    </div>
  );
};
