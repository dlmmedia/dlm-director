import React, { useState, useRef } from 'react';
import { ProjectConfig, ReferenceImage } from '@/types';
import { UploadIcon, CheckIcon, TrashIcon, LoadingSpinner } from './Icons';

interface ReferenceImagePickerProps {
  config: ProjectConfig;
  selectedRefs: ReferenceImage[];
  onUpdateRefs: (refs: ReferenceImage[]) => void;
  maxRefs?: number;
  label?: string;
  allowUpload?: boolean;
  allowProjectSelection?: boolean;
}

export const ReferenceImagePicker: React.FC<ReferenceImagePickerProps> = ({
  config,
  selectedRefs,
  onUpdateRefs,
  maxRefs = 3,
  label = "Reference Images",
  allowUpload = true,
  allowProjectSelection = true
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'project'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableProjectImages = config.scenes
    .filter(s => s.imageUrl)
    .map(s => ({
      id: `scene-${s.id}`,
      url: s.imageUrl!,
      sceneId: s.id
    }));

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = async (files: File[]) => {
    setIsProcessing(true);
    const newRefs: ReferenceImage[] = [];

    for (const file of files) {
      if (selectedRefs.length + newRefs.length >= maxRefs) break;
      if (!file.type.startsWith('image/')) continue;

      try {
        const base64 = await fileToBase64(file);
        newRefs.push({
          id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'INGREDIENT', // Default, can be changed by parent if needed
          source: 'UPLOAD',
          url: base64, // For display and usage
          base64: base64.split(',')[1], // Strip prefix for API
          mimeType: file.type
        });
      } catch (error) {
        console.error("Failed to process file", file.name, error);
      }
    }

    onUpdateRefs([...selectedRefs, ...newRefs]);
    setIsProcessing(false);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const toggleProjectImage = (url: string) => {
    const exists = selectedRefs.find(r => r.url === url);
    if (exists) {
      onUpdateRefs(selectedRefs.filter(r => r.url !== url));
    } else {
      if (selectedRefs.length >= maxRefs) return;
      
      // Determine mime type from URL or default
      let mimeType = 'image/png';
      if (url.startsWith('data:')) {
        const match = url.match(/data:([^;]+);/);
        if (match) mimeType = match[1];
      }

      const newRef: ReferenceImage = {
        id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'INGREDIENT',
        source: 'PROJECT_IMAGE',
        url: url,
        mimeType: mimeType
      };
      
      // If it's a data URI, we can extract base64, otherwise we might need to fetch it later
      if (url.startsWith('data:')) {
        newRef.base64 = url.split(',')[1];
      }

      onUpdateRefs([...selectedRefs, newRef]);
    }
  };

  const removeRef = (id: string) => {
    onUpdateRefs(selectedRefs.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-base font-medium text-gray-700 dark:text-gray-300">
          {label} <span className="text-gray-500">({selectedRefs.length}/{maxRefs})</span>
        </label>
      </div>

      {/* Selected Images Preview */}
      {selectedRefs.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {selectedRefs.map((ref) => (
            <div key={ref.id} className="relative group aspect-video bg-gray-100 dark:bg-black/40 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10">
              <img src={ref.url} crossOrigin="anonymous" alt="Reference" className="w-full h-full object-cover" />
              <button
                onClick={() => removeRef(ref.id)}
                className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Selection Area */}
      {selectedRefs.length < maxRefs && (
        <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden bg-gray-50 dark:bg-white/5">
          <div className="flex border-b border-gray-200 dark:border-white/10">
            {allowUpload && (
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'upload' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Upload
              </button>
            )}
            {allowProjectSelection && (
              <button
                onClick={() => setActiveTab('project')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'project' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                From Project
              </button>
            )}
          </div>

          <div className="p-4">
            {activeTab === 'upload' && allowUpload && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragging ? 'border-dlm-accent bg-dlm-accent/10' : 'border-gray-300 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/30'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                />
                <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                  {isProcessing ? (
                    <LoadingSpinner />
                  ) : (
                    <>
                      <UploadIcon />
                      <span className="text-sm">Click or drag images here</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'project' && allowProjectSelection && (
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                {availableProjectImages.length === 0 ? (
                  <div className="col-span-3 text-center py-4 text-gray-500 text-sm">
                    No generated images yet
                  </div>
                ) : (
                  availableProjectImages.map((img) => {
                    const isSelected = selectedRefs.some(r => r.url === img.url);
                    return (
                      <div
                        key={img.id}
                        onClick={() => toggleProjectImage(img.url)}
                        className={`relative aspect-video rounded-md overflow-hidden cursor-pointer border-2 transition-all ${
                          isSelected ? 'border-dlm-accent opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img.url} crossOrigin="anonymous" alt={`Scene ${img.sceneId}`} className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-dlm-accent/20 flex items-center justify-center">
                            <div className="bg-dlm-accent text-black rounded-full p-0.5">
                              <CheckIcon />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
