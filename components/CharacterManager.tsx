'use client';

// ========================================
// CHARACTER MANAGER COMPONENT
// Premium character management with animations
// ========================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CharacterProfile } from '../types';

interface Props {
  characters: CharacterProfile[];
  onAddCharacter: (character: CharacterProfile) => void;
  onUpdateCharacter: (id: string, updates: Partial<CharacterProfile>) => void;
  onRemoveCharacter: (id: string) => void;
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

// Icons
const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export const CharacterManager: React.FC<Props> = ({
  characters,
  onAddCharacter,
  onUpdateCharacter,
  onRemoveCharacter
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

  const inputClass = "w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2.5 text-white text-sm focus:border-dlm-accent focus:ring-1 focus:ring-dlm-accent/30 outline-none transition-all";
  const labelClass = "block text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1.5";

  const renderCharacterForm = (
    char: Partial<CharacterProfile>,
    onChange: (updates: Partial<CharacterProfile>) => void,
    isNew: boolean = false
  ) => (
    <motion.div 
      className="grid grid-cols-2 md:grid-cols-3 gap-4 p-5 bg-white/[0.02] rounded-xl border border-white/[0.06]"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="col-span-2 md:col-span-3">
        <label className={labelClass}>Character Name *</label>
        <input
          type="text"
          value={char.name || ''}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g., Sarah, The Detective"
          className={inputClass}
        />
      </div>
      
      <div>
        <label className={labelClass}>Age</label>
        <input
          type="text"
          value={char.age || ''}
          onChange={(e) => onChange({ age: e.target.value })}
          placeholder="e.g., 30, mid-twenties"
          className={inputClass}
        />
      </div>
      
      <div>
        <label className={labelClass}>Gender</label>
        <select
          value={char.gender || ''}
          onChange={(e) => onChange({ gender: e.target.value })}
          className={inputClass}
        >
          <option value="">Select...</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="non-binary">Non-binary</option>
          <option value="other">Other</option>
        </select>
      </div>
      
      <div>
        <label className={labelClass}>Skin Tone</label>
        <select
          value={char.skinTone || ''}
          onChange={(e) => onChange({ skinTone: e.target.value })}
          className={inputClass}
        >
          <option value="">Select...</option>
          {SKIN_TONES.map(tone => (
            <option key={tone} value={tone.toLowerCase()}>{tone}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className={labelClass}>Hair Style</label>
        <select
          value={char.hairStyle || ''}
          onChange={(e) => onChange({ hairStyle: e.target.value })}
          className={inputClass}
        >
          <option value="">Select...</option>
          {HAIR_STYLES.map(style => (
            <option key={style} value={style.toLowerCase()}>{style}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className={labelClass}>Hair Color</label>
        <select
          value={char.hairColor || ''}
          onChange={(e) => onChange({ hairColor: e.target.value })}
          className={inputClass}
        >
          <option value="">Select...</option>
          {HAIR_COLORS.map(color => (
            <option key={color} value={color.toLowerCase()}>{color}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className={labelClass}>Eye Color</label>
        <select
          value={char.eyeColor || ''}
          onChange={(e) => onChange({ eyeColor: e.target.value })}
          className={inputClass}
        >
          <option value="">Select...</option>
          {EYE_COLORS.map(color => (
            <option key={color} value={color.toLowerCase()}>{color}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className={labelClass}>Body Type</label>
        <select
          value={char.bodyType || ''}
          onChange={(e) => onChange({ bodyType: e.target.value })}
          className={inputClass}
        >
          <option value="">Select...</option>
          {BODY_TYPES.map(type => (
            <option key={type} value={type.toLowerCase()}>{type}</option>
          ))}
        </select>
      </div>
      
      <div className="col-span-2">
        <label className={labelClass}>Current Outfit</label>
        <input
          type="text"
          value={char.currentOutfit || ''}
          onChange={(e) => onChange({ currentOutfit: e.target.value })}
          placeholder="e.g., dark suit, white shirt, red dress"
          className={inputClass}
        />
      </div>
      
      <div>
        <label className={labelClass}>Accessories</label>
        <input
          type="text"
          value={char.accessories || ''}
          onChange={(e) => onChange({ accessories: e.target.value })}
          placeholder="e.g., glasses, watch, earrings"
          className={inputClass}
        />
      </div>
      
      <div className="col-span-2 md:col-span-3">
        <label className={labelClass}>Distinguishing Features</label>
        <input
          type="text"
          value={char.distinguishingFeatures || ''}
          onChange={(e) => onChange({ distinguishingFeatures: e.target.value })}
          placeholder="e.g., scar on left cheek, freckles, beard, tattoo on arm"
          className={inputClass}
        />
      </div>
      
      <div className="col-span-2 md:col-span-3">
        <label className={labelClass}>Additional Physical Description</label>
        <textarea
          value={char.physicalDescription || ''}
          onChange={(e) => onChange({ physicalDescription: e.target.value })}
          placeholder="Any additional details for consistency..."
          rows={2}
          className={`${inputClass} resize-none`}
        />
      </div>
      
      {isNew && (
        <div className="col-span-2 md:col-span-3 flex gap-3 mt-2">
          <motion.button
            onClick={handleAdd}
            disabled={!char.name}
            className="flex-1 py-2.5 bg-dlm-accent text-black font-semibold rounded-xl hover:brightness-110 disabled:opacity-50 transition-all"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            Add Character
          </motion.button>
          <motion.button
            onClick={() => setIsAdding(false)}
            className="px-5 py-2.5 border border-white/[0.08] text-gray-400 rounded-xl hover:text-white hover:border-white/[0.15] transition-all"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            Cancel
          </motion.button>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="heading-md text-white flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-dlm-accent/20 flex items-center justify-center text-dlm-accent">
            <UserIcon />
          </span>
          Characters
          <span className="text-sm text-gray-500 font-normal">({characters.length})</span>
        </h3>
        {!isAdding && (
          <motion.button
            onClick={() => setIsAdding(true)}
            className="btn-ghost text-dlm-accent"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.span
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <PlusIcon />
            </motion.span>
            <span>Add Character</span>
          </motion.button>
        )}
      </div>
      
      <p className="text-xs text-gray-500 leading-relaxed">
        Define characters for consistent appearance across all scenes. The more detail, the better consistency.
      </p>
      
      {/* Existing Characters */}
      <AnimatePresence>
        {characters.map((char, idx) => (
          <motion.div 
            key={char.id} 
            className="card-elevated rounded-xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ delay: idx * 0.05 }}
            layout
          >
            <motion.div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
              onClick={() => setEditingId(editingId === char.id ? null : char.id)}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
            >
              <div className="flex items-center gap-4">
                <motion.div 
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-dlm-accent/30 to-amber-500/20 flex items-center justify-center text-dlm-accent font-bold text-lg"
                  whileHover={{ scale: 1.05 }}
                >
                  {char.name.charAt(0).toUpperCase()}
                </motion.div>
                <div>
                  <h4 className="text-white font-medium">{char.name}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {[char.age, char.gender, char.hairColor ? `${char.hairColor} hair` : null].filter(Boolean).join(' • ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCharacter(char.id);
                  }}
                  className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <TrashIcon />
                </motion.button>
                <motion.div
                  animate={{ rotate: editingId === char.id ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-gray-500"
                >
                  <ChevronDownIcon />
                </motion.div>
              </div>
            </motion.div>
            
            <AnimatePresence>
              {editingId === char.id && (
                <motion.div 
                  className="border-t border-white/[0.06] p-4"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderCharacterForm(
                    char,
                    (updates) => onUpdateCharacter(char.id, updates)
                  )}
                </motion.div>
              )}
            </AnimatePresence>
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
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.03] flex items-center justify-center text-gray-600"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <UserIcon />
          </motion.div>
          <p className="text-sm text-gray-500">No characters defined yet</p>
          <p className="text-xs text-gray-600 mt-1">Add characters for better visual consistency</p>
        </motion.div>
      )}
    </div>
  );
};

export default CharacterManager;
