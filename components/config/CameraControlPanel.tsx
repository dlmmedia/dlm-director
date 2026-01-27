import React from 'react';
import { ProjectConfig, CameraBody, LensType, AspectRatio } from '@/types';
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

interface CameraControlPanelProps {
  config: ProjectConfig;
  onUpdate: (updates: Partial<ProjectConfig>) => void;
}

export const CameraControlPanel: React.FC<CameraControlPanelProps> = ({ config, onUpdate }) => {
  return (
    <Card className="p-6 space-y-6 border-l-2 border-l-primary/50">
      <h3 className="text-lg font-medium flex items-center gap-2">
        Camera & Lens System
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Camera Body */}
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Camera Body
          </Label>
          <Select
            value={config.defaultCamera}
            onValueChange={(value) => onUpdate({ defaultCamera: value as CameraBody })}
          >
            <SelectTrigger className="font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(CameraBody).map(cam => (
                <SelectItem key={cam} value={cam}>{cam}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lens Type */}
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Lens System
          </Label>
          <Select
            value={config.defaultLens}
            onValueChange={(value) => onUpdate({ defaultLens: value as LensType })}
          >
            <SelectTrigger className="font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(LensType).map(lens => (
                <SelectItem key={lens} value={lens}>{lens}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Aspect Ratio */}
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Aspect Ratio
          </Label>
          <Select
            value={config.aspectRatio}
            onValueChange={(value) => onUpdate({ aspectRatio: value as AspectRatio })}
          >
            <SelectTrigger className="font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(AspectRatio).map(ratio => (
                <SelectItem key={ratio} value={ratio}>{ratio}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Film Grain Toggle */}
        <div className="space-y-2 flex items-end pb-1">
          <div className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border">
            <Switch
              checked={config.filmGrain}
              onCheckedChange={(checked) => onUpdate({ filmGrain: checked })}
            />
            <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground cursor-pointer">
              Film Grain Simulation
            </Label>
          </div>
        </div>
      </div>
    </Card>
  );
};
