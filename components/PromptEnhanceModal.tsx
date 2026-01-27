'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { SparkleIcon, LoadingSpinner, ChevronDownIcon } from '@/components/Icons';
import { enhancePrompt, EnhancePromptContext } from '@/services/geminiService';
import { Scene, ProjectConfig } from '@/types';
import { cn } from '@/lib/utils';

// Wand icon for the magic enhance button
const WandIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
  </svg>
);

interface PromptEnhanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialPrompt: string;
  onSave: (enhancedPrompt: string) => void;
  contextType: EnhancePromptContext['type'];
  scene?: Partial<Scene>;
  config?: Partial<ProjectConfig>;
}

export function PromptEnhanceModal({
  isOpen,
  onClose,
  title,
  initialPrompt,
  onSave,
  contextType,
  scene,
  config
}: PromptEnhanceModalProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showContext, setShowContext] = useState(false);

  // Reset prompt when modal opens with new initial value
  useEffect(() => {
    if (isOpen) {
      setPrompt(initialPrompt);
    }
  }, [isOpen, initialPrompt]);

  const handleEnhance = async () => {
    if (!prompt.trim() || isEnhancing) return;
    
    setIsEnhancing(true);
    try {
      const enhanced = await enhancePrompt(prompt, {
        type: contextType,
        scene,
        config
      });
      setPrompt(enhanced);
    } catch (error) {
      console.error('Failed to enhance prompt:', error);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSave = () => {
    onSave(prompt);
    onClose();
  };

  // Build context object for display
  const contextData: Record<string, unknown> = {};
  
  if (scene) {
    contextData.scene = {
      id: scene.id,
      shotType: scene.shotType,
      cameraAngle: scene.cameraAngle,
      cameraMovement: scene.cameraMovement,
      focalLength: scene.focalLength,
      depthOfField: scene.depthOfField,
      lightingStyle: scene.lightingStyle,
      lightSource: scene.lightSource,
      hasImage: !!scene.imageUrl,
      hasVideo: !!scene.videoUrl,
      visualPrompt: scene.visualPrompt?.substring(0, 100) + (scene.visualPrompt && scene.visualPrompt.length > 100 ? '...' : '')
    };
  }
  
  if (config) {
    contextData.project = {
      category: config.category,
      style: config.style,
      aspectRatio: config.aspectRatio,
      defaultCamera: config.defaultCamera,
      defaultLens: config.defaultLens,
      colorPalette: config.defaultColorPalette,
      characters: config.characters?.map(c => c.name) || []
    };
  }

  const contextTypeLabels: Record<EnhancePromptContext['type'], string> = {
    concept: 'Creative Vision',
    visual: 'Visual Prompt',
    image_refine: 'Image Refinement',
    video_refine: 'Video Refinement'
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
              <SparkleIcon />
            </div>
            <div>
              <DialogTitle className="text-lg">{title}</DialogTitle>
              <DialogDescription>
                {contextTypeLabels[contextType]} Enhancement
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Context Panel (Collapsible) */}
          {Object.keys(contextData).length > 0 && (
            <Collapsible open={showContext} onOpenChange={setShowContext}>
              <div className="rounded-xl border border-border bg-muted/50 overflow-hidden">
                <CollapsibleTrigger asChild>
                  <button className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Context Reference
                    </div>
                    <motion.div
                      animate={{ rotate: showContext ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-muted-foreground"
                    >
                      <ChevronDownIcon />
                    </motion.div>
                  </button>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="border-t border-border p-4">
                    <pre className="text-xs font-mono text-muted-foreground bg-background rounded-lg p-3 overflow-x-auto border border-border">
                      {JSON.stringify(contextData, null, 2)}
                    </pre>
                    <p className="text-xs text-muted-foreground mt-2">
                      This context is used to generate more relevant enhancements
                    </p>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}

          {/* Main Textarea */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Your Prompt
              </label>
              <Button
                onClick={handleEnhance}
                disabled={!prompt.trim() || isEnhancing}
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
              >
                {isEnhancing ? (
                  <>
                    <LoadingSpinner size={14} color="currentColor" />
                    <span>Enhancing...</span>
                  </>
                ) : (
                  <>
                    <WandIcon />
                    <span>Auto Enhance</span>
                  </>
                )}
              </Button>
            </div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              className="h-64 resize-none bg-background"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Tip: Click "Auto Enhance" to improve your prompt with AI</span>
              <span>{prompt.length} characters</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="border-t border-border pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="gold" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
