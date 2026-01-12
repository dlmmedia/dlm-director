import React from 'react';
import { ProjectConfig, VideoModel, AspectRatio, ReferenceImage, Scene } from '@/types';
import { ModelSelector } from '@/components/ModelSelector';
import { ReferenceImagePicker } from '@/components/ReferenceImagePicker';

interface VideoGenerationSettingsProps {
  config: ProjectConfig;
  scene: Scene;
  onUpdateScene: (sceneId: number, updates: Partial<Scene>) => void;
  onUpdateConfig: (updates: Partial<ProjectConfig>) => void;
}

export const VideoGenerationSettings: React.FC<VideoGenerationSettingsProps> = ({
  config,
  scene,
  onUpdateScene,
  onUpdateConfig
}) => {
  const handleUpdateFrameAnchor = (type: 'first' | 'last', url?: string) => {
    const newAnchoring = { ...scene.frameAnchoring };
    if (type === 'first') {
      newAnchoring.firstFrameUrl = url;
    } else {
      newAnchoring.lastFrameUrl = url;
    }
    onUpdateScene(scene.id, { frameAnchoring: newAnchoring });
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Video Model</label>
          <ModelSelector 
            currentModel={config.videoModel} 
            onSelect={(model) => onUpdateConfig({ videoModel: model })} 
          />
        </div>
        <div className="w-32">
           <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Aspect Ratio</label>
           <select 
              value={config.aspectRatio}
              onChange={(e) => onUpdateConfig({ aspectRatio: e.target.value as AspectRatio })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
            >
              {Object.values(AspectRatio).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
        </div>
      </div>

      {/* Reference Images (Ingredients) */}
      <ReferenceImagePicker 
        config={config}
        selectedRefs={scene.referenceImages || []}
        onUpdateRefs={(refs) => onUpdateScene(scene.id, { referenceImages: refs })}
        maxRefs={3}
        label="Style/Character References (Ingredients)"
      />

      {/* Frame Anchoring (VEO 3.1) */}
      <div className="border border-white/10 rounded-xl p-4 bg-white/5">
        <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
           Frame Anchoring
           <span className="text-[10px] bg-dlm-accent/20 text-dlm-accent px-1.5 py-0.5 rounded">VEO 3.1</span>
        </h4>
        <div className="grid grid-cols-2 gap-4">
           {/* First Frame */}
           <div>
              <label className="block text-xs text-gray-400 mb-2">First Frame (Start)</label>
              <ReferenceImagePicker 
                config={config}
                selectedRefs={scene.frameAnchoring?.firstFrameUrl ? [{
                    id: 'first-frame', type: 'INGREDIENT', source: 'PROJECT_IMAGE', 
                    url: scene.frameAnchoring.firstFrameUrl, mimeType: 'image/png'
                }] : []}
                onUpdateRefs={(refs) => handleUpdateFrameAnchor('first', refs[0]?.url)}
                maxRefs={1}
                label=""
              />
           </div>

           {/* Last Frame */}
           <div>
              <label className="block text-xs text-gray-400 mb-2">Last Frame (End)</label>
              <ReferenceImagePicker 
                config={config}
                selectedRefs={scene.frameAnchoring?.lastFrameUrl ? [{
                    id: 'last-frame', type: 'INGREDIENT', source: 'PROJECT_IMAGE', 
                    url: scene.frameAnchoring.lastFrameUrl, mimeType: 'image/png'
                }] : []}
                onUpdateRefs={(refs) => handleUpdateFrameAnchor('last', refs[0]?.url)}
                maxRefs={1}
                label=""
              />
           </div>
        </div>
      </div>
    </div>
  );
};
