'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CharacterProfile, ProjectConfig, ReferenceImage } from '../types';
import { ReferenceImagePicker } from './ReferenceImagePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Plus, Trash2, ChevronDown, User } from 'lucide-react';

interface Props {
  characters: CharacterProfile[];
  onAddCharacter: (character: CharacterProfile) => void;
  onUpdateCharacter: (id: string, updates: Partial<CharacterProfile>) => void;
  onRemoveCharacter: (id: string) => void;
  config?: ProjectConfig;
}

const SKIN_TONES = [
  'Very fair', 'Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Brown', 'Dark brown', 'Deep'
];

const HAIR_STYLES = [
  'Short cropped', 'Buzz cut', 'Crew cut', 'Medium length', 'Long flowing',
  'Curly', 'Wavy', 'Straight', 'Braided', 'Ponytail', 'Bun', 'Dreadlocks',
  'Afro', 'Pixie cut', 'Bob', 'Slicked back', 'Messy/tousled', 'Bald'
];

const HAIR_COLORS = [
  'Black', 'Dark brown', 'Brown', 'Light brown', 'Auburn', 'Red', 'Ginger',
  'Strawberry blonde', 'Blonde', 'Platinum blonde', 'Gray', 'White', 'Silver',
  'Blue', 'Purple', 'Pink', 'Green', 'Rainbow/multicolored'
];

const EYE_COLORS = [
  'Dark brown', 'Brown', 'Hazel', 'Amber', 'Green', 'Blue-green', 'Blue',
  'Light blue', 'Gray', 'Violet'
];

const BODY_TYPES = [
  'Slim/slender', 'Athletic/toned', 'Average build', 'Muscular', 'Curvy',
  'Plus size', 'Petite', 'Tall and lean', 'Stocky', 'Broad-shouldered'
];

export const CharacterManager: React.FC<Props> = ({
  characters,
  onAddCharacter,
  onUpdateCharacter,
  onRemoveCharacter,
  config
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCharacter, setNewCharacter] = useState<Partial<CharacterProfile>>({
    name: '',
    physicalDescription: '',
    age: '',
    gender: '',
    skinTone: '',
    hairStyle: '',
    hairColor: '',
    eyeColor: '',
    bodyType: '',
    distinguishingFeatures: '',
    currentOutfit: '',
    accessories: '',
    emotionalState: 'neutral'
  });

  const handleAdd = () => {
    if (!newCharacter.name) return;
    
    const character: CharacterProfile = {
      id: `char-${Date.now()}`,
      name: newCharacter.name || 'Unnamed Character',
      physicalDescription: newCharacter.physicalDescription || '',
      age: newCharacter.age || 'adult',
      gender: newCharacter.gender || 'unspecified',
      skinTone: newCharacter.skinTone || 'medium',
      hairStyle: newCharacter.hairStyle || 'short',
      hairColor: newCharacter.hairColor || 'dark brown',
      eyeColor: newCharacter.eyeColor || 'brown',
      bodyType: newCharacter.bodyType || 'average build',
      distinguishingFeatures: newCharacter.distinguishingFeatures || '',
      currentOutfit: newCharacter.currentOutfit || '',
      accessories: newCharacter.accessories || '',
      emotionalState: newCharacter.emotionalState || 'neutral'
    };
    
    onAddCharacter(character);
    setNewCharacter({
      name: '',
      physicalDescription: '',
      age: '',
      gender: '',
      skinTone: '',
      hairStyle: '',
      hairColor: '',
      eyeColor: '',
      bodyType: '',
      distinguishingFeatures: '',
      currentOutfit: '',
      accessories: '',
      emotionalState: 'neutral'
    });
    setIsAdding(false);
  };

  const renderCharacterForm = (
    char: Partial<CharacterProfile>,
    onChange: (updates: Partial<CharacterProfile>) => void,
    isNew: boolean = false
  ) => (
    <motion.div 
      className="grid grid-cols-2 md:grid-cols-3 gap-4 p-5 bg-muted/50 rounded-xl border border-border"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="col-span-2 md:col-span-3 space-y-2">
        <Label className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Character Name *</Label>
        <Input
          type="text"
          value={char.name || ''}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g., Sarah, The Detective"
        />
      </div>
      
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Age</Label>
        <Input
          type="text"
          value={char.age || ''}
          onChange={(e) => onChange({ age: e.target.value })}
          placeholder="e.g., 30, mid-twenties"
        />
      </div>
      
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Gender</Label>
        <Select value={char.gender || ''} onValueChange={(value) => onChange({ gender: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="non-binary">Non-binary</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Skin Tone</Label>
        <Select value={char.skinTone || ''} onValueChange={(value) => onChange({ skinTone: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {SKIN_TONES.map(tone => (
              <SelectItem key={tone} value={tone.toLowerCase()}>{tone}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Hair Style</Label>
        <Select value={char.hairStyle || ''} onValueChange={(value) => onChange({ hairStyle: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {HAIR_STYLES.map(style => (
              <SelectItem key={style} value={style.toLowerCase()}>{style}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Hair Color</Label>
        <Select value={char.hairColor || ''} onValueChange={(value) => onChange({ hairColor: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {HAIR_COLORS.map(color => (
              <SelectItem key={color} value={color.toLowerCase()}>{color}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Eye Color</Label>
        <Select value={char.eyeColor || ''} onValueChange={(value) => onChange({ eyeColor: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {EYE_COLORS.map(color => (
              <SelectItem key={color} value={color.toLowerCase()}>{color}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Body Type</Label>
        <Select value={char.bodyType || ''} onValueChange={(value) => onChange({ bodyType: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {BODY_TYPES.map(type => (
              <SelectItem key={type} value={type.toLowerCase()}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="col-span-2 space-y-2">
        <Label className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Current Outfit</Label>
        <Input
          type="text"
          value={char.currentOutfit || ''}
          onChange={(e) => onChange({ currentOutfit: e.target.value })}
          placeholder="e.g., dark suit, white shirt, red dress"
        />
      </div>
      
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Accessories</Label>
        <Input
          type="text"
          value={char.accessories || ''}
          onChange={(e) => onChange({ accessories: e.target.value })}
          placeholder="e.g., glasses, watch, earrings"
        />
      </div>
      
      <div className="col-span-2 md:col-span-3 space-y-2">
        <Label className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Distinguishing Features</Label>
        <Input
          type="text"
          value={char.distinguishingFeatures || ''}
          onChange={(e) => onChange({ distinguishingFeatures: e.target.value })}
          placeholder="e.g., scar on left cheek, freckles, beard, tattoo on arm"
        />
      </div>
      
      <div className="col-span-2 md:col-span-3">
        <ReferenceImagePicker
          config={config || { scenes: [] } as any}
          selectedRefs={char.referenceImageUrl ? [{
            id: 'char-ref',
            type: 'SUBJECT',
            source: 'UPLOAD',
            url: char.referenceImageUrl,
            mimeType: 'image/png'
          }] : []}
          onUpdateRefs={(refs) => onChange({ referenceImageUrl: refs[0]?.url })}
          maxRefs={1}
          label="Reference Image (for consistency)"
          allowProjectSelection={!!config}
        />
      </div>

      <div className="col-span-2 md:col-span-3 space-y-2">
        <Label className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Additional Physical Description</Label>
        <Textarea
          value={char.physicalDescription || ''}
          onChange={(e) => onChange({ physicalDescription: e.target.value })}
          placeholder="Any additional details for consistency..."
          rows={2}
          className="resize-none"
        />
      </div>
      
      {isNew && (
        <div className="col-span-2 md:col-span-3 flex gap-3 mt-2">
          <Button
            variant="gold"
            onClick={handleAdd}
            disabled={!char.name}
            className="flex-1"
          >
            Add Character
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsAdding(false)}
          >
            Cancel
          </Button>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
            <User className="w-4 h-4" />
          </span>
          Characters
          <span className="text-base text-muted-foreground font-normal">({characters.length})</span>
        </h3>
        {!isAdding && (
          <Button
            variant="ghost"
            onClick={() => setIsAdding(true)}
            className="text-primary hover:text-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Add Character</span>
          </Button>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground leading-relaxed">
        Define characters for consistent appearance across all scenes. The more detail, the better consistency.
      </p>
      
      {/* Existing Characters */}
      <AnimatePresence>
        {characters.map((char, idx) => (
          <motion.div 
            key={char.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ delay: idx * 0.05 }}
            layout
          >
            <Collapsible open={editingId === char.id} onOpenChange={(open) => setEditingId(open ? char.id : null)}>
              <Card className="overflow-hidden">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-amber-500/20 flex items-center justify-center text-primary font-bold text-lg">
                        {char.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-medium text-base">{char.name}</h4>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {[char.age, char.gender, char.hairColor ? `${char.hairColor} hair` : null].filter(Boolean).join(' • ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveCharacter(char.id);
                        }}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <motion.div
                        animate={{ rotate: editingId === char.id ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-muted-foreground"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </div>
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="border-t border-border p-4">
                    {renderCharacterForm(
                      char,
                      (updates) => onUpdateCharacter(char.id, updates)
                    )}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Add New Character Form */}
      <AnimatePresence>
        {isAdding && renderCharacterForm(
          newCharacter,
          (updates) => setNewCharacter(prev => ({ ...prev, ...updates })),
          true
        )}
      </AnimatePresence>
      
      {characters.length === 0 && !isAdding && (
        <motion.div 
          className="text-center py-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <User className="w-6 h-6" />
          </motion.div>
          <p className="text-base text-muted-foreground">No characters defined yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Add characters for better visual consistency</p>
        </motion.div>
      )}
    </div>
  );
};

export default CharacterManager;
