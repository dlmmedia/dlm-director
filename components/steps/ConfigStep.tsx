import React, { useState } from 'react';
import { 
  ProjectConfig, 
  CharacterProfile 
} from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { CharacterManager } from '@/components/CharacterManager';
import { VisualPresetSelector } from '@/components/config/VisualPresetSelector';
import { CameraControlPanel } from '@/components/config/CameraControlPanel';
import { TextureControlPanel } from '@/components/config/TextureControlPanel';
import { LightingControlPanel } from '@/components/config/LightingControlPanel';
import { PromptEnhanceModal } from '@/components/PromptEnhanceModal';
import { cn } from '@/lib/utils';
import { 
  Wand2, 
  Sparkles, 
  ArrowLeft, 
  Loader2 
} from 'lucide-react';

interface ConfigStepProps {
  config: ProjectConfig;
  setConfig: React.Dispatch<React.SetStateAction<ProjectConfig>>;
  extractingEntities: boolean;
  loadingScript: boolean;
  onExtractEntities: () => void;
  onGenerateScript: (sceneCount: number) => void;
  onBack: () => void;
  onAddCharacter: (character: CharacterProfile) => void;
  onUpdateCharacter: (id: string, updates: Partial<CharacterProfile>) => void;
  onRemoveCharacter: (id: string) => void;
}

export default function ConfigStep({
  config,
  setConfig,
  extractingEntities,
  loadingScript,
  onExtractEntities,
  onGenerateScript,
  onBack,
  onAddCharacter,
  onUpdateCharacter,
  onRemoveCharacter
}: ConfigStepProps) {
  const [sceneCount, setSceneCount] = useState(5);
  const [customCount, setCustomCount] = useState('5');
  const [isCustom, setIsCustom] = useState(false);
  const [showEnhanceModal, setShowEnhanceModal] = useState(false);

  const handleSceneCountSelect = (val: number | 'custom') => {
    if (val === 'custom') {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      setSceneCount(val);
      setCustomCount(val.toString());
    }
  };

  const handleCustomCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomCount(val);
    const num = parseInt(val);
    if (!isNaN(num) && num > 0) {
      setSceneCount(num);
    }
  };
  
  const updateConfig = (updates: Partial<ProjectConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="w-full px-4 md:px-12 py-8 space-y-8">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-3xl font-light">Project Configuration</h2>
          <span className="text-base text-muted-foreground font-medium px-4 py-1.5 rounded-full bg-muted">{config.category}</span>
        </div>
      </div>
      
      {/* 1. Visual Style Presets */}
      <VisualPresetSelector config={config} setConfig={updateConfig} />

      {/* 2. Deep Configuration Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CameraControlPanel config={config} onUpdate={updateConfig} />
        <TextureControlPanel config={config} onUpdate={updateConfig} />
        <LightingControlPanel config={config} onUpdate={updateConfig} />
      </div>

      {/* 3. Creative Prompt */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-medium flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-500">
              <Wand2 className="w-4 h-4" />
            </span>
            Creative Vision
          </h3>
          <Button
            onClick={() => setShowEnhanceModal(true)}
            size="sm"
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
          >
            <Sparkles className="w-4 h-4" />
            <span>Enhance</span>
          </Button>
        </div>
        <Textarea 
          value={config.userPrompt}
          onChange={(e) => updateConfig({ userPrompt: e.target.value })}
          placeholder="Describe your video idea in detail... Include characters, settings, mood, and key moments."
          className="h-36 resize-none"
        />
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-muted-foreground">
            Tip: Be specific about characters and locations for better consistency
          </span>
          <Button
            variant="ghost"
            onClick={onExtractEntities}
            disabled={!config.userPrompt || extractingEntities}
            className="text-primary hover:text-primary"
          >
            {extractingEntities ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{extractingEntities ? 'Extracting...' : 'Extract Characters & Locations'}</span>
          </Button>
        </div>
      </Card>

      {/* Prompt Enhance Modal */}
      <PromptEnhanceModal
        isOpen={showEnhanceModal}
        onClose={() => setShowEnhanceModal(false)}
        title="Enhance Creative Vision"
        initialPrompt={config.userPrompt}
        onSave={(enhanced) => updateConfig({ userPrompt: enhanced })}
        contextType="concept"
        config={config}
      />

      {/* 4. Characters */}
      <Card className="p-6">
        <CharacterManager
          characters={config.characters}
          config={config}
          onAddCharacter={onAddCharacter}
          onUpdateCharacter={onUpdateCharacter}
          onRemoveCharacter={onRemoveCharacter}
        />
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-end pt-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
        
        <div className="flex flex-col items-end gap-3">
          {/* Scene Count Selector */}
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg border border-border">
            <span className="text-sm text-muted-foreground font-medium px-2">Scenes:</span>
            {[5, 10, 15].map(num => (
              <Button
                key={num}
                variant={!isCustom && sceneCount === num ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleSceneCountSelect(num)}
                className={cn(
                  "h-8 px-3",
                  !isCustom && sceneCount === num && "bg-background shadow-sm"
                )}
              >
                {num}
              </Button>
            ))}
            <Button
              variant={isCustom ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleSceneCountSelect('custom')}
              className={cn(
                "h-8 px-3",
                isCustom && "bg-background shadow-sm"
              )}
            >
              Custom
            </Button>
            {isCustom && (
              <Input 
                type="number" 
                min="1" 
                max="50"
                value={customCount}
                onChange={handleCustomCountChange}
                className="w-14 h-8 text-center"
              />
            )}
          </div>

          <Button 
            variant="gold"
            size="lg"
            onClick={() => onGenerateScript(sceneCount)}
            disabled={loadingScript || !config.userPrompt}
          >
            {loadingScript ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating Script ({sceneCount} scenes)...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                <span>Generate Cinematic Script</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
