import React from 'react';
import { ProjectConfig, LightingGuide, LightingStyle } from '@/types';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
    <Card className="p-6 space-y-6 border-l-2 border-l-primary/50">
      <h3 className="text-lg font-medium flex items-center gap-2">
        Global Lighting System
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Base Style
          </Label>
          <Select
            value={config.lightingGuide.globalStyle}
            onValueChange={(value) => updateLighting('globalStyle', value)}
          >
            <SelectTrigger className="font-mono text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(LightingStyle).map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Contrast Ratio
          </Label>
          <Select
            value={config.lightingGuide.preferredRatios}
            onValueChange={(value) => updateLighting('preferredRatios', value)}
          >
            <SelectTrigger className="font-mono text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low_contrast">Low Contrast (Flat/Even)</SelectItem>
              <SelectItem value="balanced">Balanced</SelectItem>
              <SelectItem value="high_contrast">High Contrast (Dramatic)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Key Light Position
          </Label>
          <Select
            value={config.lightingGuide.keyLightPosition || 'right'}
            onValueChange={(value) => updateLighting('keyLightPosition', value)}
          >
            <SelectTrigger className="font-mono text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="right">Right</SelectItem>
              <SelectItem value="overhead">Overhead</SelectItem>
              <SelectItem value="bottom">Bottom (Horror/Unnatural)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
};
