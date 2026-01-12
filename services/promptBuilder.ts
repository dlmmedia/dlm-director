// ========================================
// DLM DIRECTOR - ADVANCED PROMPT BUILDER
// Cinematic consistency through structured prompts
// ========================================

import {
  Scene,
  CharacterProfile,
  LocationProfile,
  ProjectConfig,
  ShotType,
  CameraAngle,
  CameraMovement,
  LightingStyle,
  LightSource,
  FocalLength,
  DepthOfField,
  VISUAL_STYLE_PRESETS,
  CINEMATIC_PALETTES,
  buildCharacterPromptSegment,
  buildCinematographyPromptSegment
} from '../types';

/**
 * MASTER PROMPT STRUCTURE
 * Based on community best practices for Imagen 3 / Nano Banana Pro
 * 
 * Structure:
 * 1. [SUBJECT] - Main focus with detailed description
 * 2. [ACTION/RELATIONSHIP] - What's happening
 * 3. [SETTING] - Environment, time, weather
 * 4. [STYLE/MEDIUM] - Artistic style, camera
 * 5. [COMPOSITION] - Shot type, angle, lens
 * 6. [LIGHTING/COLOR] - Lighting, color grading
 * 7. [QUALITY] - Technical specifications
 * 8. [CONSTRAINTS] - Negative prompt elements
 */

export interface PromptComponents {
  subject: string;
  action: string;
  setting: string;
  style: string;
  composition: string;
  lighting: string;
  quality: string;
  constraints: string;
}

// --- SHOT TYPE DESCRIPTORS ---
const SHOT_TYPE_PROMPTS: Record<ShotType, string> = {
  [ShotType.EXTREME_WIDE]: 'extreme wide shot showing vast environment, tiny figure in landscape',
  [ShotType.WIDE]: 'wide establishing shot, full environment visible, subject in context',
  [ShotType.MEDIUM_WIDE]: 'medium wide shot, full body visible with environment context',
  [ShotType.MEDIUM]: 'medium shot, waist up, conversational framing',
  [ShotType.MEDIUM_CLOSE]: 'medium close-up, chest and head, intimate framing',
  [ShotType.CLOSE_UP]: 'close-up shot, face fills frame, emotional intensity',
  [ShotType.EXTREME_CLOSE]: 'extreme close-up, eyes or specific detail fills frame',
  [ShotType.INSERT]: 'insert shot, specific detail or object, narrative importance',
  [ShotType.CUTAWAY]: 'cutaway shot, reaction or environment detail',
  [ShotType.TWO_SHOT]: 'two-shot, both subjects in frame, balanced composition',
  [ShotType.GROUP]: 'group shot, multiple subjects, ensemble composition'
};

// --- CAMERA ANGLE PROMPTS ---
const ANGLE_PROMPTS: Record<CameraAngle, string> = {
  [CameraAngle.EYE_LEVEL]: 'eye-level angle, neutral perspective, direct connection',
  [CameraAngle.LOW_ANGLE]: 'low angle, looking up at subject, heroic and powerful',
  [CameraAngle.HIGH_ANGLE]: 'high angle, looking down, vulnerable or diminished',
  [CameraAngle.BIRDS_EYE]: "bird's eye view, directly overhead, god's eye perspective",
  [CameraAngle.DUTCH_TILT]: 'dutch angle, tilted horizon, tension and unease',
  [CameraAngle.OVER_SHOULDER]: 'over-the-shoulder shot, subjective viewpoint',
  [CameraAngle.POV]: 'point of view shot, first person perspective',
  [CameraAngle.WORMS_EYE]: "worm's eye view, extreme low angle from ground"
};

// --- CAMERA MOVEMENT PROMPTS ---
const MOVEMENT_PROMPTS: Record<CameraMovement, string> = {
  [CameraMovement.STATIC_TRIPOD]: 'static locked-off tripod shot, stable and composed',
  [CameraMovement.SLOW_PUSH_IN]: 'slow dolly push-in, building tension and focus',
  [CameraMovement.SLOW_PULL_OUT]: 'slow dolly pull-out, revealing context',
  [CameraMovement.PAN_LEFT]: 'panning left, following action or revealing space',
  [CameraMovement.PAN_RIGHT]: 'panning right, following action or revealing space',
  [CameraMovement.TILT_UP]: 'tilting up, revealing height or grandeur',
  [CameraMovement.TILT_DOWN]: 'tilting down, revealing depth or descent',
  [CameraMovement.HANDHELD]: 'handheld camera, controlled shake, documentary feel',
  [CameraMovement.STEADICAM]: 'steadicam float, smooth following movement, elegant',
  [CameraMovement.DOLLY_IN]: 'dolly-in movement, approaching subject',
  [CameraMovement.DOLLY_OUT]: 'dolly-out movement, retreating from subject',
  [CameraMovement.CRANE_UP]: 'crane shot rising up, epic reveal',
  [CameraMovement.CRANE_DOWN]: 'crane shot descending, intimate approach',
  [CameraMovement.ORBIT]: '360 orbit around subject, dynamic perspective',
  [CameraMovement.PARALLAX]: 'parallax movement, depth revealed through motion',
  [CameraMovement.TRACKING]: 'tracking shot, moving alongside subject',
  [CameraMovement.WHIP_PAN]: 'whip pan, fast movement, transition energy'
};

// --- LIGHTING PROMPTS ---
const LIGHTING_PROMPTS: Record<LightingStyle, string> = {
  [LightingStyle.HIGH_KEY]: 'high-key lighting, bright and even, minimal shadows, uplifting mood',
  [LightingStyle.LOW_KEY]: 'low-key lighting, dramatic shadows, film noir, mysterious',
  [LightingStyle.CHIAROSCURO]: 'chiaroscuro lighting, strong contrast between light and dark, painterly',
  [LightingStyle.SOFT_DIFFUSED]: 'soft diffused lighting, gentle shadows, flattering, dreamy',
  [LightingStyle.HARD_DIRECTIONAL]: 'hard directional lighting, sharp shadows, dramatic, intense',
  [LightingStyle.PRACTICAL]: 'practical lighting visible in frame, motivated sources, realistic',
  [LightingStyle.RIM_LIGHT]: 'rim lighting, edge light separating subject from background, cinematic',
  [LightingStyle.MOTIVATED]: 'motivated lighting from scene elements, natural and logical',
  [LightingStyle.SILHOUETTE]: 'silhouette lighting, subject dark against bright background, graphic',
  [LightingStyle.SPLIT_LIGHT]: 'split lighting, half face lit half in shadow, dramatic duality',
  [LightingStyle.REMBRANDT]: 'Rembrandt lighting, triangle of light on cheek, classic portrait',
  [LightingStyle.BUTTERFLY]: 'butterfly lighting, overhead key light, glamorous, beauty'
};

// --- LIGHT SOURCE PROMPTS ---
const LIGHT_SOURCE_PROMPTS: Record<LightSource, string> = {
  [LightSource.TUNGSTEN]: 'warm tungsten lighting, 3200K, cozy orange glow',
  [LightSource.DAYLIGHT]: 'natural daylight, 5600K, clean and neutral',
  [LightSource.GOLDEN_HOUR]: 'golden hour sunlight, warm amber tones, long shadows, magical',
  [LightSource.BLUE_HOUR]: 'blue hour light, twilight, cool tones, ethereal',
  [LightSource.NEON]: 'neon lighting, colorful LED, cyberpunk, urban night',
  [LightSource.CANDLE_FIRE]: 'candlelight or firelight, flickering warm glow, intimate',
  [LightSource.MOONLIGHT]: 'moonlight, cool silver blue, night scene, mysterious',
  [LightSource.OVERCAST]: 'overcast sky, soft even light, no harsh shadows',
  [LightSource.MIXED]: 'mixed lighting sources, color contrast, complex mood'
};

// --- LENS/DOF PROMPTS ---
const LENS_PROMPTS: Record<FocalLength, string> = {
  [FocalLength.ULTRA_WIDE_14]: '14mm ultra-wide lens, dramatic perspective, environmental',
  [FocalLength.ULTRA_WIDE_18]: '18mm wide lens, expansive view, slight distortion',
  [FocalLength.WIDE_24]: '24mm wide lens, documentary feel, environmental portrait',
  [FocalLength.WIDE_28]: '28mm lens, street photography, natural perspective',
  [FocalLength.STANDARD_35]: '35mm lens, cinematic standard, natural field of view',
  [FocalLength.STANDARD_50]: '50mm lens, human eye perspective, versatile',
  [FocalLength.PORTRAIT_85]: '85mm portrait lens, flattering compression, beautiful bokeh',
  [FocalLength.TELEPHOTO_135]: '135mm telephoto, subject isolation, creamy background',
  [FocalLength.TELEPHOTO_200]: '200mm telephoto, strong compression, distant subject'
};

const DOF_PROMPTS: Record<DepthOfField, string> = {
  [DepthOfField.EXTREME_SHALLOW]: 'extremely shallow depth of field, f/1.4, razor thin focus, dreamy bokeh',
  [DepthOfField.CINEMATIC_SHALLOW]: 'cinematic shallow depth of field, f/2.8, subject isolation, smooth bokeh',
  [DepthOfField.MODERATE]: 'moderate depth of field, f/5.6, subject and some context in focus',
  [DepthOfField.DEEP_FOCUS]: 'deep focus, f/11+, everything sharp, environmental storytelling'
};

/**
 * Build a fully structured, consistency-optimized prompt
 */
export function buildEnhancedPrompt(
  scene: Scene,
  config: ProjectConfig,
  options: {
    includeNegative?: boolean;
    forVideo?: boolean;
  } = {}
): string {
  const { includeNegative = true, forVideo = false } = options;
  
  // Get style preset
  const stylePreset = VISUAL_STYLE_PRESETS.find(s => s.id === config.style) || VISUAL_STYLE_PRESETS[0];
  const palette = CINEMATIC_PALETTES[config.defaultColorPalette] || CINEMATIC_PALETTES['teal-orange'];
  
  // Get characters for this scene
  const sceneCharacters = config.characters.filter(c => scene.characterIds.includes(c.id));
  const characterDescriptions = sceneCharacters.map(c => buildCharacterPromptSegment(c)).join('. ');
  
  // Get location
  const location = config.locations.find(l => l.id === scene.locationId);
  const locationDesc = location 
    ? `${location.description}, ${location.timeOfDay}, ${location.weather}, ${location.atmosphere}`
    : '';
  
  // Build structured prompt components
  const components: PromptComponents = {
    subject: characterDescriptions || scene.visualPrompt.split('.')[0],
    action: scene.visualPrompt,
    setting: locationDesc || extractSetting(scene.visualPrompt),
    style: stylePreset.prompt,
    composition: [
      SHOT_TYPE_PROMPTS[scene.shotType],
      ANGLE_PROMPTS[scene.cameraAngle],
      LENS_PROMPTS[scene.focalLength],
      DOF_PROMPTS[scene.depthOfField],
      !forVideo ? '' : MOVEMENT_PROMPTS[scene.cameraMovement]
    ].filter(Boolean).join(', '),
    lighting: [
      LIGHTING_PROMPTS[scene.lightingStyle],
      LIGHT_SOURCE_PROMPTS[scene.lightSource],
      `${palette.description}, color palette with ${palette.primary} and ${palette.secondary} tones`
    ].join(', '),
    quality: [
      '4K resolution',
      'photorealistic',
      'highly detailed',
      'professional cinematography',
      config.filmGrain ? 'subtle film grain' : '',
      'realistic skin texture',
      'accurate anatomy'
    ].filter(Boolean).join(', '),
    constraints: ''
  };
  
  // Assemble the prompt in optimal order
  const promptParts = [
    components.subject,
    components.action,
    components.setting,
    components.composition,
    components.lighting,
    components.style,
    components.quality
  ].filter(Boolean);
  
  let prompt = promptParts.join('. ');
  
  // Add consistency anchors for character-heavy scenes
  if (sceneCharacters.length > 0) {
    prompt += '. IMPORTANT: Maintain exact character appearance consistency.';
  }
  
  // Add negative prompt for image generation
  if (includeNegative && !forVideo) {
    prompt += ` [Negative: ${config.negativePrompt || stylePreset.negativePrompt}]`;
  }
  
  return prompt;
}

/**
 * Build a video motion prompt optimized for Veo 3
 */
export function buildVideoMotionPrompt(
  scene: Scene,
  config: ProjectConfig
): string {
  const movement = MOVEMENT_PROMPTS[scene.cameraMovement];
  const angle = ANGLE_PROMPTS[scene.cameraAngle];
  const basePrompt = scene.enhancedPrompt || scene.visualPrompt;
  
  // Veo 3 works best with clear motion descriptions
  const motionDescriptors = [];
  
  // Explicitly state camera behavior first for better adherence
  if (scene.cameraMovement !== CameraMovement.STATIC_TRIPOD) {
    motionDescriptors.push(`Camera movement: ${movement}`);
  } else {
    motionDescriptors.push('Camera: locked off, stable composition');
  }

  // Add Camera Angle
  motionDescriptors.push(`Angle: ${angle}`);
  
  // Subject motion inference
  const hasAction = /\b(walking|running|moving|dancing|jumping|flying|falling|rising|turning|spinning)\b/i.test(basePrompt);
  if (!hasAction) {
    motionDescriptors.push('Action: Subtle natural movement, breathing, small gestures');
  }
  
  // Environment motion
  const hasEnvironment = /\b(wind|rain|snow|fire|water|smoke|fog|clouds)\b/i.test(basePrompt);
  if (hasEnvironment) {
    motionDescriptors.push('Atmosphere: Environmental elements moving naturally');
  }
  
  // Lighting motion
  if (scene.lightSource === LightSource.CANDLE_FIRE || scene.lightSource === LightSource.NEON) {
    motionDescriptors.push('Lighting: Dynamic lighting with subtle flicker');
  }

  // Add audio cue if enabled
  if (config.audioEnabled) {
    motionDescriptors.push('Audio: Ambient sound and foley matching the scene');
  }
  
  // Construct the prompt with higher weight on visual style and camera
  return `Cinematic Video. ${basePrompt}. 
  
  VISUAL STYLE: ${config.style}.
  CAMERA: ${movement}, ${angle}.
  MOTION: ${motionDescriptors.join('. ')}.
  
  High quality, smooth motion, professional color grading.`;
}

/**
 * Generate a scene sequence with proper film grammar
 */
export function generateShotSequence(
  concept: string,
  sceneCount: number,
  sequenceType: 'establishing' | 'dialogue' | 'action' | 'emotional' = 'establishing'
): Partial<Scene>[] {
  const sequences: Partial<Scene>[] = [];
  
  const shotProgression: ShotType[] = [];
  const movementProgression: CameraMovement[] = [];
  
  switch (sequenceType) {
    case 'establishing':
      shotProgression.push(
        ShotType.EXTREME_WIDE,
        ShotType.WIDE,
        ShotType.MEDIUM,
        ShotType.MEDIUM_CLOSE,
        ShotType.CLOSE_UP
      );
      movementProgression.push(
        CameraMovement.CRANE_DOWN,
        CameraMovement.SLOW_PUSH_IN,
        CameraMovement.STATIC_TRIPOD,
        CameraMovement.SLOW_PUSH_IN,
        CameraMovement.STATIC_TRIPOD
      );
      break;
    case 'action':
      shotProgression.push(
        ShotType.WIDE,
        ShotType.MEDIUM,
        ShotType.CLOSE_UP,
        ShotType.INSERT,
        ShotType.WIDE
      );
      movementProgression.push(
        CameraMovement.TRACKING,
        CameraMovement.HANDHELD,
        CameraMovement.WHIP_PAN,
        CameraMovement.STATIC_TRIPOD,
        CameraMovement.CRANE_UP
      );
      break;
    case 'emotional':
      shotProgression.push(
        ShotType.MEDIUM,
        ShotType.MEDIUM_CLOSE,
        ShotType.CLOSE_UP,
        ShotType.EXTREME_CLOSE,
        ShotType.MEDIUM
      );
      movementProgression.push(
        CameraMovement.STATIC_TRIPOD,
        CameraMovement.SLOW_PUSH_IN,
        CameraMovement.SLOW_PUSH_IN,
        CameraMovement.STATIC_TRIPOD,
        CameraMovement.SLOW_PULL_OUT
      );
      break;
    default:
      // dialogue
      shotProgression.push(
        ShotType.TWO_SHOT,
        ShotType.MEDIUM_CLOSE,
        ShotType.CLOSE_UP,
        ShotType.MEDIUM_CLOSE,
        ShotType.CLOSE_UP
      );
      movementProgression.push(
        CameraMovement.STATIC_TRIPOD,
        CameraMovement.STATIC_TRIPOD,
        CameraMovement.STATIC_TRIPOD,
        CameraMovement.STATIC_TRIPOD,
        CameraMovement.SLOW_PUSH_IN
      );
  }
  
  for (let i = 0; i < sceneCount; i++) {
    const idx = i % shotProgression.length;
    sequences.push({
      id: i + 1,
      shotType: shotProgression[idx],
      cameraMovement: movementProgression[idx],
      cameraAngle: CameraAngle.EYE_LEVEL,
      focalLength: shotProgression[idx] === ShotType.CLOSE_UP ? FocalLength.PORTRAIT_85 : FocalLength.STANDARD_50,
      depthOfField: shotProgression[idx] === ShotType.WIDE ? DepthOfField.DEEP_FOCUS : DepthOfField.CINEMATIC_SHALLOW,
      lightingStyle: LightingStyle.SOFT_DIFFUSED,
      lightSource: LightSource.DAYLIGHT
    });
  }
  
  return sequences;
}

/**
 * Extract setting from a raw prompt
 */
function extractSetting(prompt: string): string {
  // Common location/setting keywords
  const settingPatterns = [
    /in (?:a |the )?([\w\s]+?)(?:,|\.|\s+with|\s+under|\s+during)/i,
    /(?:at|on) (?:a |the )?([\w\s]+?)(?:,|\.)/i,
    /([\w\s]+ (?:room|street|forest|beach|office|city|mountain|desert|ocean|space|building))/i
  ];
  
  for (const pattern of settingPatterns) {
    const match = prompt.match(pattern);
    if (match) return match[1].trim();
  }
  
  return '';
}

/**
 * Ensure consistency tokens across scenes
 * Returns a consistency signature that should be included in all related prompts
 */
export function generateConsistencySignature(config: ProjectConfig): string {
  const parts: string[] = [];
  
  // Style consistency
  const stylePreset = VISUAL_STYLE_PRESETS.find(s => s.id === config.style);
  if (stylePreset) {
    parts.push(stylePreset.prompt);
  }
  
  // Color palette consistency
  const palette = CINEMATIC_PALETTES[config.defaultColorPalette];
  if (palette) {
    parts.push(palette.description);
  }
  
  // Camera consistency
  parts.push(`Shot on ${config.defaultCamera}`);
  parts.push(`${config.defaultLens} lens`);
  
  // Technical consistency
  if (config.filmGrain) {
    parts.push('subtle film grain texture');
  }
  parts.push(config.colorGrading);
  
  return parts.join(', ');
}

/**
 * Generate character consistency prompt section
 */
export function generateCharacterConsistencyPrompt(characters: CharacterProfile[]): string {
  if (characters.length === 0) return '';
  
  const charPrompts = characters.map((char, idx) => {
    const parts = [
      `Character ${idx + 1}: ${char.name}`,
      char.physicalDescription,
      `${char.age}, ${char.gender}`,
      `${char.hairColor} ${char.hairStyle} hair`,
      `${char.eyeColor} eyes`,
      char.skinTone,
      char.bodyType,
      char.distinguishingFeatures && `Notable: ${char.distinguishingFeatures}`,
      char.currentOutfit && `Wearing: ${char.currentOutfit}`,
      char.accessories && `Accessories: ${char.accessories}`
    ].filter(Boolean);
    
    return parts.join(', ');
  });
  
  return charPrompts.join('. ');
}
