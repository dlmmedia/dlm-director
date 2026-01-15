import React, { useState } from 'react';
import { ProjectConfig, Scene, CharacterProfile } from '@/types';
import { 
  ChevronDownIcon, 
  ArrowLeftIcon, 
  ArrowRightIcon,
  PlusIcon,
  XIcon
} from '@/components/Icons';
import { CharacterManager } from '@/components/CharacterManager';
import { CinematographyControls, ShotPresets } from '@/components/CinematographyControls';

interface ScriptReviewStepProps {
  config: ProjectConfig;
  onUpdateScene: (sceneId: number, updates: Partial<Scene>) => void;
  onAddCharacter: (character: CharacterProfile) => void;
  onUpdateCharacter: (id: string, updates: Partial<CharacterProfile>) => void;
  onRemoveCharacter: (id: string) => void;
  onAddScene: () => void;
  onDeleteScene: (sceneId: number) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function ScriptReviewStep({
  config,
  onUpdateScene,
  onAddCharacter,
  onUpdateCharacter,
  onRemoveCharacter,
  onAddScene,
  onDeleteScene,
  onBack,
  onNext
}: ScriptReviewStepProps) {
  const [activeTab, setActiveTab] = useState<'scenes' | 'characters'>('scenes');
  const [expandedScene, setExpandedScene] = useState<number | null>(null);

  // Calculate stats
  const totalDuration = config.scenes.reduce((acc, s) => acc + s.durationEstimate, 0);

  return (
    <div className="w-full px-4 md:px-12 py-8 space-y-8">
      <div>
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-light text-white mb-3">Script Review</h2>
            <div className="flex gap-4 text-sm text-gray-400">
              <span><strong className="text-white">{config.scenes.length}</strong> Scenes</span>
              <span><strong className="text-white">{totalDuration}s</strong> Total</span>
              <span><strong className="text-white">{config.characters.length}</strong> Characters</span>
            </div>
          </div>
          
          {/* Status Overview */}
          <div className="flex gap-4">
             <div className="flex flex-col items-end text-xs text-gray-400">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Ready</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span>Pending</span>
                </div>
             </div>
             
             {/* Tabs */}
             <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
            {(['scenes', 'characters'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab 
                    ? 'bg-dlm-accent text-black' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab === 'scenes' ? 'Scenes' : `Characters (${config.characters.length})`}
              </button>
            ))}
          </div>
        </div>
      </div>
      </div>

      {activeTab === 'scenes' ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={onAddScene} className="btn-ghost">
              <PlusIcon />
              <span>Add Scene</span>
            </button>
          </div>
          {config.scenes.map((scene, idx) => (
            <div key={scene.id} className="card-elevated overflow-hidden group hover:border-white/20 transition-all duration-300">
              {/* Scene Header */}
              <div 
                className="flex items-start gap-5 p-5 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpandedScene(expandedScene === scene.id ? null : scene.id)}
              >
                {/* Scene Slate */}
                <div className="w-14 h-14 bg-black/40 border border-white/10 rounded flex flex-col items-center justify-center shrink-0 font-mono">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">SCENE</span>
                    <span className="text-xl font-bold text-dlm-accent">{idx + 1}</span>
                </div>

                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-[10px] px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-400 font-mono tracking-wide uppercase">{scene.shotType}</span>
                    <span className="text-[10px] px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-400 font-mono tracking-wide uppercase">{scene.cameraAngle}</span>
                    <span className="text-[10px] px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-400 font-mono tracking-wide uppercase">{scene.cameraMovement}</span>
                  </div>
                  <p className="text-gray-200 text-sm line-clamp-2 font-medium leading-relaxed">{scene.narration}</p>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end gap-3 pt-1">
                  <div className="flex items-center gap-2 font-mono text-xs text-dlm-accent bg-dlm-accent/10 px-2 py-1 rounded border border-dlm-accent/20">
                     <span>{scene.durationEstimate}s</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete Scene ${idx + 1}? This cannot be undone.`)) {
                        if (expandedScene === scene.id) setExpandedScene(null);
                        onDeleteScene(scene.id);
                      }
                    }}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                    title="Delete Scene"
                  >
                    <XIcon />
                  </button>
                  <div className={`text-gray-500 transition-transform duration-300 ${expandedScene === scene.id ? 'rotate-180 text-white' : ''}`}>
                    <ChevronDownIcon />
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedScene === scene.id && (
                <div className="border-t border-white/10 bg-black/20 p-6 space-y-6 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-dlm-accent mb-3">Visual Prompt</label>
                    <textarea 
                      value={scene.visualPrompt}
                      onChange={(e) => onUpdateScene(scene.id, { visualPrompt: e.target.value })}
                      className="input resize-none bg-black/40 border-white/10 font-mono text-sm leading-relaxed"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-4">Cinematography</label>
                    <ShotPresets onApply={(preset) => onUpdateScene(scene.id, preset)} />
                    <div className="mt-5 p-4 rounded-xl border border-white/5 bg-white/5">
                      <CinematographyControls
                        scene={scene}
                        onChange={(updates) => onUpdateScene(scene.id, updates)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card-elevated p-6">
          <CharacterManager
            characters={config.characters}
            onAddCharacter={onAddCharacter}
            onUpdateCharacter={onUpdateCharacter}
            onRemoveCharacter={onRemoveCharacter}
          />
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button onClick={onBack} className="btn-ghost">
          <ArrowLeftIcon />
          <span>Back</span>
        </button>
        <button 
          onClick={onNext}
          className="btn-primary"
        >
          {config.scenes.some(s => s.status === 'image_ready' || s.imageUrl) ? (
            <span>Look at Generated Project</span>
          ) : (
            <span>Approve & Generate Storyboard</span>
          )}
          <ArrowRightIcon />
        </button>
      </div>
    </div>
  );
}
