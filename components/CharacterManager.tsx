// ========================================
// CHARACTER MANAGER COMPONENT
// For maintaining character consistency
// ========================================

import React, { useState } from 'react';
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

  const renderCharacterForm = (
    char: Partial<CharacterProfile>,
    onChange: (updates: Partial<CharacterProfile>) => void,
    isNew: boolean = false
  ) => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-dlm-900 rounded-lg border border-dlm-700">
      <div className="col-span-2 md:col-span-3">
        <label className="block text-xs text-gray-500 mb-1">Character Name *</label>
        <input
          type="text"
          value={char.name || ''}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g., Sarah, The Detective"
          className="w-full bg-dlm-800 border border-dlm-600 rounded px-3 py-2 text-white text-sm focus:border-dlm-accent outline-none"
        />
      </div>
      
      <div>
        <label className="block text-xs text-gray-500 mb-1">Age</label>
        <input
          type="text"
          value={char.age || ''}
          onChange={(e) => onChange({ age: e.target.value })}
          placeholder="e.g., 30, mid-twenties"
          className="w-full bg-dlm-800 border border-dlm-600 rounded px-3 py-2 text-white text-sm focus:border-dlm-accent outline-none"
        />
      </div>
      
      <div>
        <label className="block text-xs text-gray-500 mb-1">Gender</label>
        <select
          value={char.gender || ''}
          onChange={(e) => onChange({ gender: e.target.value })}
          className="w-full bg-dlm-800 border border-dlm-600 rounded px-3 py-2 text-white text-sm focus:border-dlm-accent outline-none"
        >
          <option value="">Select...</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="non-binary">Non-binary</option>
          <option value="other">Other</option>
        </select>
      </div>
      
      <div>
        <label className="block text-xs text-gray-500 mb-1">Skin Tone</label>
        <select
          value={char.skinTone || ''}
          onChange={(e) => onChange({ skinTone: e.target.value })}
          className="w-full bg-dlm-800 border border-dlm-600 rounded px-3 py-2 text-white text-sm focus:border-dlm-accent outline-none"
        >
          <option value="">Select...</option>
          {SKIN_TONES.map(tone => (
            <option key={tone} value={tone.toLowerCase()}>{tone}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-xs text-gray-500 mb-1">Hair Style</label>
        <select
          value={char.hairStyle || ''}
          onChange={(e) => onChange({ hairStyle: e.target.value })}
          className="w-full bg-dlm-800 border border-dlm-600 rounded px-3 py-2 text-white text-sm focus:border-dlm-accent outline-none"
        >
          <option value="">Select...</option>
          {HAIR_STYLES.map(style => (
            <option key={style} value={style.toLowerCase()}>{style}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-xs text-gray-500 mb-1">Hair Color</label>
        <select
          value={char.hairColor || ''}
          onChange={(e) => onChange({ hairColor: e.target.value })}
          className="w-full bg-dlm-800 border border-dlm-600 rounded px-3 py-2 text-white text-sm focus:border-dlm-accent outline-none"
        >
          <option value="">Select...</option>
          {HAIR_COLORS.map(color => (
            <option key={color} value={color.toLowerCase()}>{color}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-xs text-gray-500 mb-1">Eye Color</label>
        <select
          value={char.eyeColor || ''}
          onChange={(e) => onChange({ eyeColor: e.target.value })}
          className="w-full bg-dlm-800 border border-dlm-600 rounded px-3 py-2 text-white text-sm focus:border-dlm-accent outline-none"
        >
          <option value="">Select...</option>
          {EYE_COLORS.map(color => (
            <option key={color} value={color.toLowerCase()}>{color}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-xs text-gray-500 mb-1">Body Type</label>
        <select
          value={char.bodyType || ''}
          onChange={(e) => onChange({ bodyType: e.target.value })}
          className="w-full bg-dlm-800 border border-dlm-600 rounded px-3 py-2 text-white text-sm focus:border-dlm-accent outline-none"
        >
          <option value="">Select...</option>
          {BODY_TYPES.map(type => (
            <option key={type} value={type.toLowerCase()}>{type}</option>
          ))}
        </select>
      </div>
      
      <div className="col-span-2">
        <label className="block text-xs text-gray-500 mb-1">Current Outfit</label>
        <input
          type="text"
          value={char.currentOutfit || ''}
          onChange={(e) => onChange({ currentOutfit: e.target.value })}
          placeholder="e.g., dark suit, white shirt, red dress"
          className="w-full bg-dlm-800 border border-dlm-600 rounded px-3 py-2 text-white text-sm focus:border-dlm-accent outline-none"
        />
      </div>
      
      <div>
        <label className="block text-xs text-gray-500 mb-1">Accessories</label>
        <input
          type="text"
          value={char.accessories || ''}
          onChange={(e) => onChange({ accessories: e.target.value })}
          placeholder="e.g., glasses, watch, earrings"
          className="w-full bg-dlm-800 border border-dlm-600 rounded px-3 py-2 text-white text-sm focus:border-dlm-accent outline-none"
        />
      </div>
      
      <div className="col-span-2 md:col-span-3">
        <label className="block text-xs text-gray-500 mb-1">Distinguishing Features</label>
        <input
          type="text"
          value={char.distinguishingFeatures || ''}
          onChange={(e) => onChange({ distinguishingFeatures: e.target.value })}
          placeholder="e.g., scar on left cheek, freckles, beard, tattoo on arm"
          className="w-full bg-dlm-800 border border-dlm-600 rounded px-3 py-2 text-white text-sm focus:border-dlm-accent outline-none"
        />
      </div>
      
      <div className="col-span-2 md:col-span-3">
        <label className="block text-xs text-gray-500 mb-1">Additional Physical Description</label>
        <textarea
          value={char.physicalDescription || ''}
          onChange={(e) => onChange({ physicalDescription: e.target.value })}
          placeholder="Any additional details for consistency..."
          rows={2}
          className="w-full bg-dlm-800 border border-dlm-600 rounded px-3 py-2 text-white text-sm focus:border-dlm-accent outline-none resize-none"
        />
      </div>
      
      {isNew && (
        <div className="col-span-2 md:col-span-3 flex gap-2 mt-2">
          <button
            onClick={handleAdd}
            disabled={!char.name}
            className="flex-1 py-2 bg-dlm-accent text-black font-bold rounded hover:bg-dlm-accentHover disabled:opacity-50 transition-colors"
          >
            Add Character
          </button>
          <button
            onClick={() => setIsAdding(false)}
            className="px-4 py-2 border border-dlm-600 text-gray-400 rounded hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white flex items-center gap-2">
          <span className="text-dlm-accent">◈</span> Characters
          <span className="text-xs text-gray-500 font-normal">({characters.length})</span>
        </h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-sm text-dlm-accent hover:text-white flex items-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Character
          </button>
        )}
      </div>
      
      <p className="text-xs text-gray-500">
        Define characters for consistent appearance across all scenes. The more detail, the better consistency.
      </p>
      
      {/* Existing Characters */}
      {characters.map(char => (
        <div key={char.id} className="bg-dlm-800 rounded-lg border border-dlm-700 overflow-hidden">
          <div 
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-dlm-700 transition-colors"
            onClick={() => setEditingId(editingId === char.id ? null : char.id)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-dlm-accent/20 flex items-center justify-center text-dlm-accent font-bold">
                {char.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-white font-medium">{char.name}</h4>
                <p className="text-xs text-gray-500">
                  {[char.age, char.gender, char.hairColor + ' hair'].filter(Boolean).join(' • ')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveCharacter(char.id);
                }}
                className="p-1 text-gray-500 hover:text-red-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <svg 
                className={`w-4 h-4 text-gray-500 transition-transform ${editingId === char.id ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          {editingId === char.id && (
            <div className="border-t border-dlm-700 p-3">
              {renderCharacterForm(
                char,
                (updates) => onUpdateCharacter(char.id, updates)
              )}
            </div>
          )}
        </div>
      ))}
      
      {/* Add New Character Form */}
      {isAdding && renderCharacterForm(
        newCharacter,
        (updates) => setNewCharacter(prev => ({ ...prev, ...updates })),
        true
      )}
      
      {characters.length === 0 && !isAdding && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No characters defined yet</p>
          <p className="text-xs mt-1">Add characters for better visual consistency</p>
        </div>
      )}
    </div>
  );
};
