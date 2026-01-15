import React from 'react';
import { ProjectConfig, VideoModel, AspectRatio, Scene, AudioDialogueLine, AudioMusicConfig, MusicIntensity } from '@/types';
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
  const dialogue = scene.audio?.dialogue || [];
  const projectMusic: AudioMusicConfig = {
    enabled: config.audioConfig?.music?.enabled ?? true,
    style: config.audioConfig?.music?.style ?? '',
    intensity: config.audioConfig?.music?.intensity
  };

  const updateProjectMusic = (updates: Partial<AudioMusicConfig>) => {
    onUpdateConfig({
      audioConfig: {
        ...(config.audioConfig || {}),
        music: { ...projectMusic, ...updates }
      }
    });
  };

  const updateSceneAudio = (updates: Partial<NonNullable<Scene['audio']>>) => {
    onUpdateScene(scene.id, {
      audio: { ...(scene.audio || {}), ...updates }
    });
  };

  const updateDialogueLine = (index: number, updates: Partial<AudioDialogueLine>) => {
    const next = dialogue.map((d, i) => (i === index ? { ...d, ...updates } : d));
    updateSceneAudio({ dialogue: next });
  };

  const addDialogueLine = () => {
    const next = [...dialogue, { speaker: 'Speaker', text: '', delivery: '' }];
    updateSceneAudio({ dialogue: next });
  };

  const removeDialogueLine = (index: number) => {
    const next = dialogue.filter((_, i) => i !== index);
    updateSceneAudio({ dialogue: next });
  };

  const handleUpdateFrameAnchor = (type: 'first' | 'last', url?: string) => {
    const newAnchoring = { ...(scene.frameAnchoring || {}) };
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
            currentModel={config.videoModel || VideoModel.VEO_3_1} 
            onSelect={(model) => onUpdateConfig({ videoModel: model })} 
          />
        </div>
        <div className="w-32">
           <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Aspect Ratio</label>
           <select 
              value={config.aspectRatio || AspectRatio.WIDESCREEN}
              onChange={(e) => onUpdateConfig({ aspectRatio: e.target.value as AspectRatio })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
            >
              {Object.values(AspectRatio).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
        </div>
      </div>

       {/* Audio Toggle (Explicit) */}
      <div className="flex items-center gap-3 border border-white/10 rounded-xl p-3 bg-white/5">
         <div 
           className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${config.audioEnabled ? 'bg-dlm-accent' : 'bg-white/20'}`}
           onClick={() => onUpdateConfig({ audioEnabled: !config.audioEnabled })}
         >
            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${config.audioEnabled ? 'translate-x-4' : ''}`} />
         </div>
         <span className="text-sm text-gray-300">Generate Audio (Veo)</span>
      </div>

      {/* Audio System (Veo 3.x) */}
      <div className="border border-white/10 rounded-xl p-4 bg-white/5 space-y-5">
        <h4 className="text-sm font-medium text-white">Audio System</h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Music Style (project-wide)
            </label>
            <input
              value={projectMusic.style}
              onChange={(e) => updateProjectMusic({ style: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              placeholder='e.g. "cinematic orchestral score", "ambient synth pads", "no music"'
              disabled={!config.audioEnabled}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Music Intensity
            </label>
            <select
              value={projectMusic.intensity || 'med'}
              onChange={(e) => updateProjectMusic({ intensity: e.target.value as MusicIntensity })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              disabled={!config.audioEnabled}
            >
              <option value="low">low</option>
              <option value="med">med</option>
              <option value="high">high</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Ambience (this scene)
            </label>
            <input
              value={scene.audio?.ambience || ''}
              onChange={(e) => updateSceneAudio({ ambience: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              placeholder='e.g. "distant traffic, room tone, air conditioner hum"'
              disabled={!config.audioEnabled}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              SFX (this scene)
            </label>
            <input
              value={scene.audio?.sfx || ''}
              onChange={(e) => updateSceneAudio({ sfx: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              placeholder='e.g. "footsteps on gravel, door creak, keys jingle"'
              disabled={!config.audioEnabled}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Dialogue (this scene)
            </label>
            <button
              type="button"
              onClick={addDialogueLine}
              className="btn-ghost py-1 text-xs"
              disabled={!config.audioEnabled}
            >
              + Add Line
            </button>
          </div>

          {dialogue.length === 0 ? (
            <div className="text-xs text-gray-500 bg-black/20 border border-white/10 rounded-lg p-3">
              No dialogue lines yet.
            </div>
          ) : (
            <div className="space-y-3">
              {dialogue.map((line, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2 bg-black/20 border border-white/10 rounded-lg p-3">
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-600 mb-1">
                      Speaker
                    </label>
                    <input
                      value={line.speaker}
                      onChange={(e) => updateDialogueLine(i, { speaker: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs"
                      disabled={!config.audioEnabled}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-600 mb-1">
                      Delivery
                    </label>
                    <input
                      value={line.delivery || ''}
                      onChange={(e) => updateDialogueLine(i, { delivery: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs"
                      placeholder='e.g. "whispered, tense"'
                      disabled={!config.audioEnabled}
                    />
                  </div>
                  <div className="md:col-span-5">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-600 mb-1">
                      Text
                    </label>
                    <input
                      value={line.text}
                      onChange={(e) => updateDialogueLine(i, { text: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs"
                      placeholder='e.g. "We don’t have much time."'
                      disabled={!config.audioEnabled}
                    />
                  </div>
                  <div className="md:col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={() => removeDialogueLine(i)}
                      className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 px-2 py-2 text-xs"
                      disabled={!config.audioEnabled}
                      title="Remove line"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
