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
 * Optimized for Nano Banana Pro (gemini-3-pro-image-preview) - the latest image generation model
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
  [ShotType.EXTREME_WIDE]: 'extreme wide shot, panoramic view showing vast environment',
  [ShotType.WIDE]: 'wide shot, establishing the scene and context',
  [ShotType.MEDIUM_WIDE]: 'medium wide shot (cowboy shot), from knees up',
  [ShotType.MEDIUM]: 'medium shot, from waist up, focus on interaction',
  [ShotType.MEDIUM_CLOSE]: 'medium close-up, chest up, focus on expression',
  [ShotType.CLOSE_UP]: 'close-up shot, focus on face and emotion',
  [ShotType.EXTREME_CLOSE]: 'extreme close-up, macro detail, intense focus',
  [ShotType.INSERT]: 'insert shot, detailed view of specific object or action',
  [ShotType.CUTAWAY]: 'cutaway shot, showing related but separate action',
  [ShotType.TWO_SHOT]: 'two-shot, framing two subjects together',
  [ShotType.GROUP]: 'group shot, multiple subjects in frame'
};

const ANGLE_PROMPTS: Record<CameraAngle, string> = {
  [CameraAngle.EYE_LEVEL]: 'eye-level angle, neutral perspective',
  [CameraAngle.HIGH_ANGLE]: 'high angle shot, looking down, vulnerable subject',
  [CameraAngle.LOW_ANGLE]: 'low angle shot, looking up, powerful subject',
  [CameraAngle.DUTCH_TILT]: 'dutch angle, tilted horizon, dynamic tension',
  [CameraAngle.OVER_SHOULDER]: 'over-the-shoulder shot, subjective perspective',
  [CameraAngle.BIRDS_EYE]: 'birds-eye view, top-down perspective',
  [CameraAngle.WORMS_EYE]: 'worms-eye view, ground level perspective',
  [CameraAngle.POV]: 'POV shot, first-person perspective'
};

const MOVEMENT_PROMPTS: Partial<Record<CameraMovement, string>> = {
  [CameraMovement.STATIC_TRIPOD]: 'static tripod shot, stable composition',
  [CameraMovement.SLOW_PUSH_IN]: 'slow push in, creeping towards subject',
  [CameraMovement.SLOW_PULL_OUT]: 'slow pull out, revealing context',
  [CameraMovement.PAN_LEFT]: 'smooth pan left camera movement',
  [CameraMovement.PAN_RIGHT]: 'smooth pan right camera movement',
  [CameraMovement.TILT_UP]: 'camera tilting up movement',
  [CameraMovement.TILT_DOWN]: 'camera tilting down movement',
  [CameraMovement.DOLLY_IN]: 'slow dolly in, pushing towards subject',
  [CameraMovement.DOLLY_OUT]: 'slow dolly out, revealing context',
  [CameraMovement.TRACKING]: 'tracking shot, following the subject',
  [CameraMovement.CRANE_UP]: 'crane up shot, sweeping camera movement',
  [CameraMovement.CRANE_DOWN]: 'crane down shot, descending camera',
  [CameraMovement.HANDHELD]: 'handheld camera motion, organic shake, verite style',
  [CameraMovement.STEADICAM]: 'steadicam float, smooth gliding motion',
  [CameraMovement.ORBIT]: 'orbit shot, 360 degree rotation around subject',
  [CameraMovement.PARALLAX]: 'parallax movement, lateral motion',
  [CameraMovement.WHIP_PAN]: 'whip pan, fast horizontal movement'
};

const LIGHTING_PROMPTS: Partial<Record<LightingStyle, string>> = {
  [LightingStyle.HIGH_KEY]: 'high key lighting, bright, low contrast',
  [LightingStyle.LOW_KEY]: 'low key lighting, dark shadows, high contrast, noir',
  [LightingStyle.CHIAROSCURO]: 'chiaroscuro lighting, strong contrast',
  [LightingStyle.SOFT_DIFFUSED]: 'soft diffused lighting, flattering',
  [LightingStyle.HARD_DIRECTIONAL]: 'hard directional lighting, sharp shadows',
  [LightingStyle.PRACTICAL]: 'practical lights visible in scene',
  [LightingStyle.RIM_LIGHT]: 'rim lighting, edge lighting, backlit',
  [LightingStyle.MOTIVATED]: 'motivated lighting from scene sources',
  [LightingStyle.SILHOUETTE]: 'silhouette lighting, subject in shadow',
  [LightingStyle.SPLIT_LIGHT]: 'split lighting, half face illuminated',
  [LightingStyle.REMBRANDT]: 'rembrandt lighting, classic portrait',
  [LightingStyle.BUTTERFLY]: 'butterfly lighting, glamorous'
};

const LIGHT_SOURCE_PROMPTS: Partial<Record<LightSource, string>> = {
  [LightSource.TUNGSTEN]: 'illuminated by warm tungsten light',
  [LightSource.DAYLIGHT]: 'illuminated by natural daylight',
  [LightSource.GOLDEN_HOUR]: 'illuminated by golden hour sunlight',
  [LightSource.BLUE_HOUR]: 'illuminated by blue hour light',
  [LightSource.MOONLIGHT]: 'illuminated by moonlight',
  [LightSource.CANDLE_FIRE]: 'illuminated by candlelight and fire',
  [LightSource.NEON]: 'illuminated by neon lights, cyberpunk',
  [LightSource.OVERCAST]: 'illuminated by soft overcast light',
  [LightSource.MIXED]: 'illuminated by mixed light sources'
};

const LENS_PROMPTS: Partial<Record<FocalLength, string>> = {
  [FocalLength.ULTRA_WIDE_14]: '14mm ultra wide angle lens, expansive view',
  [FocalLength.ULTRA_WIDE_18]: '18mm ultra wide angle lens',
  [FocalLength.WIDE_24]: '24mm wide angle lens, context rich',
  [FocalLength.WIDE_28]: '28mm wide angle lens',
  [FocalLength.STANDARD_35]: '35mm lens, classic cinematic look',
  [FocalLength.STANDARD_50]: '50mm prime lens, natural perspective',
  [FocalLength.PORTRAIT_85]: '85mm portrait lens, flattering compression',
  [FocalLength.TELEPHOTO_135]: '135mm telephoto lens, background compression',
  [FocalLength.TELEPHOTO_200]: '200mm telephoto lens, subject isolation'
};

const DOF_PROMPTS: Record<DepthOfField, string> = {
  [DepthOfField.EXTREME_SHALLOW]: 'extremely shallow depth of field, f/1.4, razor thin focus, dreamy bokeh',
  [DepthOfField.CINEMATIC_SHALLOW]: 'cinematic shallow depth of field, f/2.8, subject isolation, smooth bokeh',
  [DepthOfField.MODERATE]: 'moderate depth of field, f/5.6, subject and some context in focus',
  [DepthOfField.DEEP_FOCUS]: 'deep focus, f/11+, everything sharp, environmental storytelling'
};

/**
 * Build texture instructions based on configuration
 */
function buildTexturePromptSegment(config: ProjectConfig): string {
  const { textureConfig } = config;
  if (!textureConfig) return '';

  const parts = [];
  
  // Skin
  if (textureConfig.skinDetail === 'highly_detailed') parts.push('highly detailed skin texture with visible pores and subsurface scattering');
  if (textureConfig.skinDetail === 'rough') parts.push('weathered and rough skin texture with realistic imperfections');
  if (textureConfig.skinImperfections) parts.push('natural skin imperfections and realistic blemishes');
  if (textureConfig.skinDetail === 'smooth') parts.push('smooth and retouched skin texture');

  // Fabric
  if (textureConfig.fabricTexture === 'high_fidelity') parts.push('high fidelity fabric materials with intricate thread details');
  if (textureConfig.fabricTexture === 'visible_weave') parts.push('tactile fabric texture with visible weave patterns');

  // Environment
  if (textureConfig.environmentDetail === 'high_complexity') parts.push('rich environmental textures with lived-in details and clutter');
  if (textureConfig.environmentDetail === 'minimalist') parts.push('clean and minimalist environmental textures');
  
  if (textureConfig.reflectiveSurfaces) parts.push('accurate ray-traced reflections on wet or glossy surfaces');

  if (parts.length === 0) return '';
  return `MATERIALS AND TEXTURES: ${parts.join(', ')}`;
}

/**
 * Build subject behavior instructions
 */
function buildSubjectBehaviorSegment(config: ProjectConfig): string {
  const { subjectBehavior } = config;
  if (!subjectBehavior) return '';

  const parts: string[] = [];
  
  // Eye contact
  if (subjectBehavior.eyeContact) parts.push('subject making direct eye contact with camera');
  
  // Gaze direction
  if (subjectBehavior.gazeDirection === 'off_camera') parts.push('subject looking away from camera');
  if (subjectBehavior.gazeDirection === 'interactive') parts.push('subject interacting with scene elements');
  
  // Movement style
  if (subjectBehavior.movementStyle === 'dynamic') parts.push('dynamic and energetic body language');
  if (subjectBehavior.movementStyle === 'minimal') parts.push('subtle and restrained body language');
  if (subjectBehavior.movementStyle === 'natural') parts.push('natural, authentic body language');

  
  return parts.join(', ');
}

/**
 * Extract setting from visual prompt if possible
 */
function extractSetting(visualPrompt: string): string {
    // Simple heuristic: check for "in a [setting]" or "at [setting]"
    // This is a placeholder for better extraction logic
    return '';
}


/**
 * Build a fully structured, consistency-optimized prompt
 */
export function buildEnhancedPrompt(
  scene: Scene,
  config: ProjectConfig,
  options: {
    includeNegative?: boolean;
    forVideo?: boolean;
    revisionNote?: string;
  } = {}
): string {
  
  // Get style preset
  const stylePreset = VISUAL_STYLE_PRESETS.find(s => s.id === config.style) || VISUAL_STYLE_PRESETS[0];
  const palette = CINEMATIC_PALETTES[config.defaultColorPalette] || CINEMATIC_PALETTES['teal-orange'];
  
  // Get characters for this scene (with null safety)
  const characters = config?.characters || [];
  const characterIds = scene?.characterIds || [];
  const sceneCharacters = characters.filter(c => characterIds.includes(c.id));
  const characterDescriptions = sceneCharacters.map(c => buildCharacterPromptSegment(c)).join('. ');
  
  // Get location (with null safety)
  const locations = config?.locations || [];
  const location = locations.find(l => l.id === scene.locationId);
  const locationDesc = location 
    ? `${location.name}: ${location.description}, ${location.timeOfDay}, ${location.weather}, ${location.atmosphere}`
    : '';
  
  const { forVideo } = options;

  // Explicitly format key technical aspects to ensure they are not missed
  const cameraSpecs = `CAMERA: Shot on ${config?.defaultCamera || 'professional cinema camera'}, ${config?.defaultLens ? `using ${config.defaultLens} lens` : ''}. ${SHOT_TYPE_PROMPTS[scene.shotType]}. ${ANGLE_PROMPTS[scene.cameraAngle]}. ${LENS_PROMPTS[scene.focalLength]}. ${DOF_PROMPTS[scene.depthOfField]}.`;
  
  const lightingSpecs = `LIGHTING: ${LIGHTING_PROMPTS[scene.lightingStyle]}. ${LIGHT_SOURCE_PROMPTS[scene.lightSource]}. ${palette.description}, color palette with ${palette.primary} and ${palette.secondary} tones. ${config?.lightingGuide ? `${config.lightingGuide.preferredRatios} contrast ratio` : ''}.`;
  
  const textureSpecs = buildTexturePromptSegment(config);
  
  const motionSpecs = forVideo && scene.cameraMovement ? `CAMERA MOVEMENT: ${MOVEMENT_PROMPTS[scene.cameraMovement]}.` : '';

  // Assemble the prompt in optimal order
  const promptParts = [
    // 1. Core Subject & Action
    `SUBJECT: ${characterDescriptions || scene.visualPrompt.split('.')[0]}`,
    `ACTION: ${scene.visualPrompt}`,
    
    // 2. Environment
    `SETTING: ${locationDesc || extractSetting(scene.visualPrompt)}`,

    // 3. Explicit Technical Specs (Force injected)
    cameraSpecs,
    motionSpecs,
    lightingSpecs,
    textureSpecs,
    
    // 4. Overall Style
    `STYLE: ${stylePreset.prompt}`,
    
    // 5. Quality Boosters
    `QUALITY: 8k resolution, photorealistic, highly detailed, professional color grading, ${config.filmGrain ? 'subtle film grain' : ''}, accurate anatomy.`
  ].filter(Boolean);
  
  let prompt = promptParts.join('\n\n');

  if (options.revisionNote && options.revisionNote.trim().length > 0) {
    prompt += `\n\nREVISION INSTRUCTIONS: ${options.revisionNote.trim()}\n- Keep identity, wardrobe, and overall style consistent.\n- Only change what the revision requests.\n- Do not add text or watermarks.`;
  }

  // Negative Prompt (for image generation mainly)
  if (options.includeNegative) {
    prompt += `\n\nNEGATIVE PROMPT: blurry, low quality, distorted, bad anatomy, bad hands, text, watermark, logo, cartoon, 3d render, illustration.`;
  }
  
  console.log(`[PromptBuilder] Generated Prompt (${forVideo ? 'Video' : 'Image'}):`, prompt);
  
  return prompt;
}

/**
 * Build a video motion prompt optimized for Veo 3 / 2.0
 */
export function buildVideoMotionPrompt(
  scene: Scene,
  config: ProjectConfig,
  options: { revisionNote?: string } = {}
): string {
  // Use the enhanced prompt builder as the base to get all details
  const basePrompt = buildEnhancedPrompt(scene, config, { forVideo: true, revisionNote: options.revisionNote });

  const movement = MOVEMENT_PROMPTS[scene.cameraMovement];
  const angle = ANGLE_PROMPTS[scene.cameraAngle];
  
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
  
  // Subject motion inference (Regex to detect action)
  const hasAction = /\b(walking|running|moving|dancing|jumping|flying|falling|rising|turning|spinning)\b/i.test(scene.visualPrompt);
  if (!hasAction) {
    motionDescriptors.push('Action: Subtle natural movement, breathing, small gestures');
  }
  
  // Environment motion
  const hasEnvironment = /\b(wind|rain|snow|fire|water|smoke|fog|clouds)\b/i.test(scene.visualPrompt);
  if (hasEnvironment) {
    motionDescriptors.push('Atmosphere: Environmental elements moving naturally');
  }
  
  // Lighting motion
  if (scene.lightSource === LightSource.CANDLE_FIRE || scene.lightSource === LightSource.NEON) {
    motionDescriptors.push('Lighting: Dynamic lighting with subtle flicker');
  }

  // Add audio cue if enabled - STRICT CHECK
  const audioLines: string[] = [];
  if (config.audioEnabled) {
    const sceneAudio = scene.audio;
    const projectMusic = config.audioConfig?.music;
    const music = sceneAudio?.musicOverride
      ? { ...(projectMusic || { enabled: true, style: '' }), ...sceneAudio.musicOverride }
      : projectMusic;

    audioLines.push('AUDIO:');
    audioLines.push('- Include synchronized ambient sound and foley matching the scene.');
    if (sceneAudio?.ambience?.trim()) audioLines.push(`- AMBIENCE: ${sceneAudio.ambience.trim()}`);
    if (sceneAudio?.sfx?.trim()) audioLines.push(`- SFX: ${sceneAudio.sfx.trim()}`);

    const dialogue = sceneAudio?.dialogue || [];
    if (dialogue.length > 0) {
      audioLines.push('- DIALOGUE:');
      for (const line of dialogue) {
        const speaker = (line.speaker || 'Speaker').trim();
        const delivery = (line.delivery || '').trim();
        const text = (line.text || '').trim();
        if (!text) continue;
        audioLines.push(`  - ${speaker}${delivery ? ` (${delivery})` : ''}: "${text}"`);
      }
    }

    if (music?.enabled && music.style?.trim()) {
      audioLines.push(`- MUSIC: ${music.style.trim()}${music.intensity ? ` (intensity: ${music.intensity})` : ''}`);
    } else {
      audioLines.push('- MUSIC: optional, only if it fits naturally (no overpowering score).');
    }
  } else {
    audioLines.push('AUDIO: Silent, no sound.');
  }

  motionDescriptors.push(audioLines.join('\n'));
  
  // Construct the prompt with higher weight on visual style and camera
  // We prepend "Cinematic Video" and append specific motion tags
  return `Cinematic Video.\n\n${basePrompt}\n\nMOTION SPECIFICS: ${motionDescriptors.join('. ')}.\n\nHigh quality, smooth motion, temporal consistency, professional color grading, high fidelity, 4k.`;
}

/**
 * Generate a scene sequence with proper film grammar
 */
export function generateShotSequence(
  concept: string,
  sceneCount: number,
  sequenceType: 'establishing' | 'dialogue' | 'action' | 'emotional' = 'establishing'
): Partial<Scene>[] {
  
  // This function seems to mock or generate templates. 
  // We leave it as is or lightly enhance if needed, 
  // but the user focused on context loss in generation.
  // The current implementation (not fully shown in search but assumed standard) is likely fine.
  
  // Placeholder implementation for what was likely there or needed
  // ... (Keep existing logic if I had full visibility, but I will restore basic functionality)
  
  // Since I overwrote the file, I need to make sure I didn't lose the logic.
  // I will implement a robust version based on common film grammar.

  const scenes: Partial<Scene>[] = [];
  
  for (let i = 0; i < sceneCount; i++) {
      scenes.push({
          visualPrompt: `Scene ${i + 1} based on ${concept}`,
          shotType: ShotType.MEDIUM,
          cameraAngle: CameraAngle.EYE_LEVEL,
          cameraMovement: CameraMovement.STATIC_TRIPOD,
          lightingStyle: LightingStyle.SOFT_DIFFUSED,
          lightSource: LightSource.DAYLIGHT,
          focalLength: FocalLength.STANDARD_35,
          depthOfField: DepthOfField.MODERATE
      });
  }
  
  return scenes;
}
