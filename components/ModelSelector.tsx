import React from 'react';
import { VideoModel } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ModelSelectorProps {
  currentModel?: VideoModel;
  onSelect: (model: VideoModel) => void;
  disabled?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  currentModel = VideoModel.VEO_3_1, 
  onSelect,
  disabled = false
}) => {
  return (
    <div className="flex items-center gap-3 bg-muted px-4 py-2 rounded-xl border border-border">
      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Video Model</span>
      <div className="flex bg-background p-1 rounded-lg border border-border">
        <Button
          variant={currentModel === VideoModel.VEO_3_1 ? "default" : "ghost"}
          size="sm"
          onClick={() => onSelect(VideoModel.VEO_3_1)}
          disabled={disabled}
          className={cn(
            "h-7 px-3 text-sm",
            currentModel === VideoModel.VEO_3_1 && "shadow-lg"
          )}
        >
          Veo 3.1
        </Button>
        <Button
          variant={currentModel === VideoModel.VEO_2_0 || (currentModel as any) === 'veo-2.0-generate-preview' ? "default" : "ghost"}
          size="sm"
          onClick={() => onSelect(VideoModel.VEO_2_0)}
          disabled={disabled}
          className={cn(
            "h-7 px-3 text-sm",
            (currentModel === VideoModel.VEO_2_0 || (currentModel as any) === 'veo-2.0-generate-preview') && "shadow-lg"
          )}
        >
          Veo 2.0
        </Button>
      </div>
    </div>
  );
};
