import React, { useState } from 'react';
import { ProjectConfig, Scene, CharacterProfile } from '@/types';
import { 
  ChevronDownIcon, 
  ArrowLeftIcon, 
  ArrowRightIcon,
  PlusIcon,
  XIcon,
  SparkleIcon
} from '@/components/Icons';
import { CharacterManager } from '@/components/CharacterManager';
import { CinematographyControls, ShotPresets } from '@/components/CinematographyControls';
import { PromptEnhanceModal } from '@/components/PromptEnhanceModal';

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
  const [enhanceModalScene, setEnhanceModalScene] = useState<Scene | null>(null);

  // Calculate stats
  const totalDuration = config.scenes.reduce((acc, s) => acc + s.durationEstimate, 0);

  return (
    <div className="w-full px-4 md:px-12 py-8 space-y-8">
      <div>
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-light text-gray-900 dark:text-white mb-3">Script Review</h2>
            <div className="flex gap-4 text-base text-gray-500 dark:text-gray-400">
              <span><strong className="text-gray-900 dark:text-white">{config.scenes.length}</strong> Scenes</span>
              <span><strong className="text-gray-900 dark:text-white">{totalDuration}s</strong> Total</span>
              <span><strong className="text-gray-900 dark:text-white">{config.characters.length}</strong> Characters</span>
            </div>
          </div>
          
          {/* Status Overview */}
          <div className="flex gap-4">
             <div className="flex flex-col items-end text-sm text-gray-500 dark:text-gray-400">
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
             <div className="flex gap-2 bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
            {(['scenes', 'characters'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-base font-medium transition-all ${
                  activeTab === tab 
                    ? 'bg-dlm-accent text-black' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
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
            <div key={scene.id} className="card-elevated overflow-hidden group hover:border-gray-300 dark:hover:border-white/20 transition-all duration-300">
              {/* Scene Header */}
              <div 
                className="flex items-start gap-5 p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                onClick={() => setExpandedScene(expandedScene === scene.id ? null : scene.id)}
              >
                {/* Scene Slate */}
                <div className="w-14 h-14 bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded flex flex-col items-center justify-center shrink-0 font-mono">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">SCENE</span>
                    <span className="text-xl font-bold text-dlm-accent">{idx + 1}</span>
                </div>

                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 font-mono tracking-wide uppercase">{scene.shotType}</span>
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 font-mono tracking-wide uppercase">{scene.cameraAngle}</span>
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 font-mono tracking-wide uppercase">{scene.cameraMovement}</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-200 text-base line-clamp-2 font-medium leading-relaxed">{scene.narration}</p>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end gap-3 pt-1">
                  <div className="flex items-center gap-2 font-mono text-sm text-dlm-accent bg-dlm-accent/10 px-2 py-1 rounded border border-dlm-accent/20">
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
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/20 transition-colors"
                    title="Delete Scene"
                  >
                    <XIcon />
                  </button>
                  <div className={`text-gray-500 transition-transform duration-300 ${expandedScene === scene.id ? 'rotate-180 text-gray-900 dark:text-white' : ''}`}>
                    <ChevronDownIcon />
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedScene === scene.id && (
                <div className="border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 p-6 space-y-6 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-xs font-bold uppercase tracking-widest text-dlm-accent">Visual Prompt</label>
                      <button
                        onClick={() => setEnhanceModalScene(scene)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-sm hover:shadow-md"
                        title="Auto-enhance visual prompt with AI"
                      >
                        <SparkleIcon />
                        <span>Enhance</span>
                      </button>
                    </div>
                    <textarea 
                      value={scene.visualPrompt}
                      onChange={(e) => onUpdateScene(scene.id, { visualPrompt: e.target.value })}
                      className="input resize-none bg-white dark:bg-black/40 border-gray-200 dark:border-white/10 font-mono text-base leading-relaxed"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-4">Cinematography</label>
                    <ShotPresets onApply={(preset) => onUpdateScene(scene.id, preset)} />
                    <div className="mt-5 p-4 rounded-xl border border-gray-200 dark:border-white/5 bg-white dark:bg-white/5">
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

      {/* Visual Prompt Enhance Modal */}
      <PromptEnhanceModal
        isOpen={!!enhanceModalScene}
        onClose={() => setEnhanceModalScene(null)}
        title={`Enhance Scene ${enhanceModalScene ? config.scenes.findIndex(s => s.id === enhanceModalScene.id) + 1 : ''} Visual Prompt`}
        initialPrompt={enhanceModalScene?.visualPrompt || ''}
        onSave={(enhanced) => {
          if (enhanceModalScene) {
            onUpdateScene(enhanceModalScene.id, { visualPrompt: enhanced });
          }
        }}
        contextType="visual"
        scene={enhanceModalScene || undefined}
        config={config}
      />
    </div>
  );
}
