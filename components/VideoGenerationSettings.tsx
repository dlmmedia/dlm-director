import React, { useMemo } from 'react';
import { ProjectConfig, VideoModel, AspectRatio, Scene, AudioDialogueLine } from '@/types';
import { ModelSelector } from '@/components/ModelSelector';
import { ReferenceImagePicker } from '@/components/ReferenceImagePicker';
import { validateVideoPrompt, getRecommendedDuration, countActionsInPrompt } from '@/services/promptBuilder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { AlertTriangle, Info, X } from 'lucide-react';

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

  // Veo 3.1 Quality Assurance - Complexity Analysis
  const complexityAnalysis = useMemo(() => {
    const validation = validateVideoPrompt(scene, config);
    const recommended = getRecommendedDuration(scene);
    const actionCount = countActionsInPrompt(scene.visualPrompt);
    
    return {
      validation,
      recommended,
      actionCount,
      showWarning: !validation.isValid || scene.durationEstimate > recommended.duration
    };
  }, [scene, config]);

  return (
    <div className="space-y-6">
      {/* Veo 3.1 Complexity Warning */}
      {complexityAnalysis.showWarning && (
        <Card className="border-amber-500/30 p-4 bg-amber-500/10">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-amber-500 mb-2">Veo 3.1 Optimization Suggestions</h4>
              
              {/* Action count warning */}
              {complexityAnalysis.actionCount >= 2 && (
                <div className="text-xs text-amber-400/90 mb-2">
                  <span className="font-medium">Actions detected: {complexityAnalysis.actionCount}</span>
                  <span className="text-amber-400/70"> - Complex multi-action scenes may fragment.</span>
                </div>
              )}
              
              {/* Duration recommendation */}
              {scene.durationEstimate > complexityAnalysis.recommended.duration && (
                <div className="text-xs text-amber-400/90 mb-2">
                  <span className="font-medium">Recommended duration: {complexityAnalysis.recommended.duration}s</span>
                  <span className="text-amber-400/70"> - {complexityAnalysis.recommended.reason}</span>
                </div>
              )}
              
              {/* Validation warnings */}
              {complexityAnalysis.validation.warnings.length > 0 && (
                <ul className="text-xs text-amber-400/80 space-y-1 mt-2">
                  {complexityAnalysis.validation.warnings.map((warning, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-500">•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              )}
              
              {/* Suggestions */}
              {complexityAnalysis.validation.suggestions.length > 0 && (
                <div className="mt-3 pt-2 border-t border-amber-500/20">
                  <p className="text-xs text-amber-400/70 font-medium mb-1">Suggestions:</p>
                  <ul className="text-xs text-amber-400/60 space-y-1">
                    {complexityAnalysis.validation.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-500/50">→</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Quick action: Apply recommended duration */}
              {scene.durationEstimate > complexityAnalysis.recommended.duration && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateScene(scene.id, { durationEstimate: complexityAnalysis.recommended.duration })}
                  className="mt-3 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                >
                  Apply Recommended Duration ({complexityAnalysis.recommended.duration}s)
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      <div className="flex gap-4">
        <div className="flex-1">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Video Model</Label>
          <ModelSelector 
            currentModel={config.videoModel || VideoModel.VEO_3_1} 
            onSelect={(model) => onUpdateConfig({ videoModel: model })} 
          />
        </div>
        <div className="w-32">
          <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">Aspect Ratio</Label>
          <Select 
            value={config.aspectRatio || AspectRatio.WIDESCREEN}
            onValueChange={(value) => onUpdateConfig({ aspectRatio: value as AspectRatio })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(AspectRatio).map(r => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Audio Toggle */}
      <Card className="flex items-center gap-3 p-3">
        <Switch 
          checked={config.audioEnabled}
          onCheckedChange={(checked) => onUpdateConfig({ audioEnabled: checked })}
        />
        <span className="text-base">Generate Audio (Veo)</span>
      </Card>

      {/* Audio System (Veo 3.x) */}
      <Card className="p-4 space-y-5">
        <h4 className="text-base font-medium">Audio System</h4>

        {/* Audio Generation Info */}
        <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Info className="w-3 h-3 text-blue-400" />
          </div>
          <div className="text-xs text-blue-300/90">
            <p className="font-medium text-blue-400 mb-1">Sound Effects Only</p>
            <p>Generated audio includes dialogue, foley, and ambient sounds. Background music is excluded for easier stitching - add your own music in post-production.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Ambience (this scene)
            </Label>
            <Input
              value={scene.audio?.ambience || ''}
              onChange={(e) => updateSceneAudio({ ambience: e.target.value })}
              placeholder='e.g. "distant traffic, room tone, air conditioner hum"'
              disabled={!config.audioEnabled}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              SFX (this scene)
            </Label>
            <Input
              value={scene.audio?.sfx || ''}
              onChange={(e) => updateSceneAudio({ sfx: e.target.value })}
              placeholder='e.g. "footsteps on gravel, door creak, keys jingle"'
              disabled={!config.audioEnabled}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Dialogue (this scene)
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={addDialogueLine}
              disabled={!config.audioEnabled}
            >
              + Add Line
            </Button>
          </div>

          {dialogue.length === 0 ? (
            <div className="text-xs text-muted-foreground bg-muted rounded-lg p-3 border border-border">
              No dialogue lines yet.
            </div>
          ) : (
            <div className="space-y-3">
              {dialogue.map((line, i) => (
                <Card key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3">
                  <div className="md:col-span-3 space-y-1">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Speaker
                    </Label>
                    <Input
                      value={line.speaker}
                      onChange={(e) => updateDialogueLine(i, { speaker: e.target.value })}
                      className="h-8 text-xs"
                      disabled={!config.audioEnabled}
                    />
                  </div>
                  <div className="md:col-span-3 space-y-1">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Delivery
                    </Label>
                    <Input
                      value={line.delivery || ''}
                      onChange={(e) => updateDialogueLine(i, { delivery: e.target.value })}
                      className="h-8 text-xs"
                      placeholder='e.g. "whispered, tense"'
                      disabled={!config.audioEnabled}
                    />
                  </div>
                  <div className="md:col-span-5 space-y-1">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Text
                    </Label>
                    <Input
                      value={line.text}
                      onChange={(e) => updateDialogueLine(i, { text: e.target.value })}
                      className="h-8 text-xs"
                      placeholder="e.g. We don't have much time."
                      disabled={!config.audioEnabled}
                    />
                  </div>
                  <div className="md:col-span-1 flex items-end">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeDialogueLine(i)}
                      disabled={!config.audioEnabled}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Reference Images (Ingredients) */}
      <ReferenceImagePicker 
        config={config}
        selectedRefs={scene.referenceImages || []}
        onUpdateRefs={(refs) => onUpdateScene(scene.id, { referenceImages: refs })}
        maxRefs={3}
        label="Style/Character References (Ingredients)"
      />

      {/* Frame Anchoring (VEO 3.1) */}
      <Card className="p-4">
        <h4 className="text-base font-medium mb-3 flex items-center gap-2">
          Frame Anchoring
          <Badge variant="secondary" className="bg-primary/20 text-primary">VEO 3.1</Badge>
        </h4>
        <div className="grid grid-cols-2 gap-4">
          {/* First Frame */}
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">First Frame (Start)</Label>
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
            <Label className="text-sm text-muted-foreground mb-2 block">Last Frame (End)</Label>
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
      </Card>
    </div>
  );
};
