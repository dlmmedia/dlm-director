import React, { useState } from 'react';
import { ProjectConfig, Scene, CharacterProfile } from '@/types';
import { 
  ChevronDownIcon, 
  ArrowLeftIcon, 
  ArrowRightIcon 
} from '@/components/Icons';
import { CharacterManager } from '@/components/CharacterManager';
import { CinematographyControls, ShotPresets } from '@/components/CinematographyControls';

interface ScriptReviewStepProps {
  config: ProjectConfig;
  onUpdateScene: (sceneId: number, updates: Partial<Scene>) => void;
  onAddCharacter: (character: CharacterProfile) => void;
  onUpdateCharacter: (id: string, updates: Partial<CharacterProfile>) => void;
  onRemoveCharacter: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function ScriptReviewStep({
  config,
  onUpdateScene,
  onAddCharacter,
  onUpdateCharacter,
  onRemoveCharacter,
  onBack,
  onNext
}: ScriptReviewStepProps) {
  const [activeTab, setActiveTab] = useState<'scenes' | 'characters'>('scenes');
  const [expandedScene, setExpandedScene] = useState<number | null>(null);

  // Calculate stats
  const totalDuration = config.scenes.reduce((acc, s) => acc + s.durationEstimate, 0);

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-8 space-y-8">
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
          {config.scenes.map((scene, idx) => (
            <div key={scene.id} className="card-elevated overflow-hidden">
              {/* Scene Header */}
              <div 
                className="flex items-start gap-4 p-5 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpandedScene(expandedScene === scene.id ? null : scene.id)}
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-dlm-accent/30 to-amber-500/20 flex items-center justify-center text-dlm-accent font-bold text-sm shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[10px] px-2 py-1 rounded-md bg-white/10 text-gray-400 font-medium">{scene.shotType}</span>
                    <span className="text-[10px] px-2 py-1 rounded-md bg-white/10 text-gray-400 font-medium">{scene.cameraAngle}</span>
                    <span className="text-[10px] px-2 py-1 rounded-md bg-white/10 text-gray-400 font-medium">{scene.cameraMovement}</span>
                  </div>
                  <p className="text-gray-300 text-sm line-clamp-2">{scene.narration}</p>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end gap-2">
                  <span className="text-sm text-dlm-accent font-semibold">{scene.durationEstimate}s</span>
                  <div className={`text-gray-500 transition-transform ${expandedScene === scene.id ? 'rotate-180' : ''}`}>
                    <ChevronDownIcon />
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedScene === scene.id && (
                <div className="border-t border-white/10 p-5 space-y-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-dlm-accent mb-2">Visual Prompt</label>
                    <textarea 
                      value={scene.visualPrompt}
                      onChange={(e) => onUpdateScene(scene.id, { visualPrompt: e.target.value })}
                      className="input resize-none"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-blue-400 mb-3">Cinematography</label>
                    <ShotPresets onApply={(preset) => onUpdateScene(scene.id, preset)} />
                    <div className="mt-4">
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
