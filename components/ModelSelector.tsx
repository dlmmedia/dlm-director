import React from 'react';
import { VideoModel } from '@/types';

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
    <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Video Model</span>
      <div className="flex bg-black/40 p-1 rounded-lg">
        <button
          onClick={() => onSelect(VideoModel.VEO_3_1)}
          disabled={disabled}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            currentModel === VideoModel.VEO_3_1 
              ? 'bg-dlm-accent text-black shadow-lg' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Veo 3.1
        </button>
        <button
          onClick={() => onSelect(VideoModel.VEO_2_0)}
          disabled={disabled}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            currentModel === VideoModel.VEO_2_0 
              ? 'bg-dlm-accent text-black shadow-lg' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Veo 2.0
        </button>
      </div>
    </div>
  );
};
