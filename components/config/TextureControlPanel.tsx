import React from 'react';
import { ProjectConfig, TextureConfig } from '@/types';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
    <Card className="p-6 space-y-6 border-l-2 border-l-primary/50">
      <h3 className="text-lg font-medium flex items-center gap-2">
        Texture & Materials
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skin Detail */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Skin Texture
          </Label>
          <Select
            value={config.textureConfig.skinDetail}
            onValueChange={(value) => updateTexture('skinDetail', value)}
          >
            <SelectTrigger className="font-mono text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="smooth">Smooth / Retouched</SelectItem>
              <SelectItem value="natural">Natural</SelectItem>
              <SelectItem value="highly_detailed">Highly Detailed (Pores)</SelectItem>
              <SelectItem value="rough">Rough / Weathered</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Fabric Texture */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Fabric Detail
          </Label>
          <Select
            value={config.textureConfig.fabricTexture}
            onValueChange={(value) => updateTexture('fabricTexture', value)}
          >
            <SelectTrigger className="font-mono text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="high_fidelity">High Fidelity</SelectItem>
              <SelectItem value="visible_weave">Visible Weave</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Environment Detail */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Environment Complexity
          </Label>
          <Select
            value={config.textureConfig.environmentDetail}
            onValueChange={(value) => updateTexture('environmentDetail', value)}
          >
            <SelectTrigger className="font-mono text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minimalist">Minimalist / Clean</SelectItem>
              <SelectItem value="balanced">Balanced</SelectItem>
              <SelectItem value="high_complexity">High Complexity / Cluttered</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Toggles */}
        <div className="space-y-3 pt-4">
          <div className="flex items-center gap-3 p-1.5 hover:bg-muted rounded transition-colors">
            <Switch
              checked={config.textureConfig.skinImperfections}
              onCheckedChange={(checked) => updateTexture('skinImperfections', checked)}
            />
            <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground cursor-pointer">
              Enable Skin Imperfections
            </Label>
          </div>

          <div className="flex items-center gap-3 p-1.5 hover:bg-muted rounded transition-colors">
            <Switch
              checked={config.textureConfig.reflectiveSurfaces}
              onCheckedChange={(checked) => updateTexture('reflectiveSurfaces', checked)}
            />
            <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground cursor-pointer">
              Enhanced Reflections
            </Label>
          </div>
        </div>
      </div>
    </Card>
  );
};
