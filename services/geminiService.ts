// ========================================
// DLM DIRECTOR - ENHANCED GEMINI SERVICE
// Character consistency & cinematic generation
// ========================================

import { GoogleGenAI, Type } from "@google/genai";
import { 
  Scene, 
  VideoCategory, 
  ProjectConfig,
  CharacterProfile,
  LocationProfile,
  ShotType,
  CameraAngle,
  CameraMovement,
  LightingStyle,
  LightSource,
  FocalLength,
  DepthOfField,
  TransitionType,
  createDefaultScene,
  VISUAL_STYLE_PRESETS,
  SHOT_FLOW_TEMPLATES
} from "../types";
import { 
  buildEnhancedPrompt, 
  buildVideoMotionPrompt,
  generateConsistencySignature,
  generateCharacterConsistencyPrompt,
  generateShotSequence
} from "./promptBuilder";

// API Key from environment variables (configure in Vercel dashboard or .env.local)
const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || '';

// Helper to get AI instance
const getAi = () => new GoogleGenAI({ apiKey: API_KEY });

// --- 1. RESEARCH / TRENDING ---
export const fetchTrendingTopics = async (category: VideoCategory): Promise<any[]> => {
  const ai = getAi();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-05-20',
      contents: `Find 3 trending or popular video topics/styles suitable for a ${category} project right now. Focus on what's working on social media and streaming platforms. Provide a JSON response.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
            }
          }
        }
      }
    });
    
    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (error) {
    console.error("Error fetching trending:", error);
    return [{ title: "Error fetching trends", description: "Please try manual input." }];
  }
};

// --- 2. ADVANCED SCRIPT GENERATION ---
export const generateScript = async (
  category: string,
  style: string,
  prompt: string,
  config?: Partial<ProjectConfig>,
  sceneCount: number = 5
): Promise<Scene[]> => {
  const ai = getAi();
  
  // Get style preset for context
  const stylePreset = VISUAL_STYLE_PRESETS.find(s => s.id === style || s.name === style) || VISUAL_STYLE_PRESETS[0];
  
  // Build character context if available
  const characterContext = config?.characters && config.characters.length > 0
    ? `\n\nCHARACTERS IN THIS PROJECT (maintain consistency):\n${generateCharacterConsistencyPrompt(config.characters)}`
    : '';
  
  // Build location context if available
  const locationContext = config?.locations && config.locations.length > 0
    ? `\n\nLOCATIONS:\n${config.locations.map(l => `- ${l.name}: ${l.description}, ${l.timeOfDay}, ${l.atmosphere}`).join('\n')}`
    : '';

  const systemInstruction = `You are a world-class film director, cinematographer, and screenwriter combined.
Create a professional visual script for a ${category} video.

VISUAL STYLE: ${stylePreset.prompt}
${characterContext}
${locationContext}

Break the story into exactly ${sceneCount} distinct scenes that flow naturally together like a single cohesive film.

CRITICAL REQUIREMENTS FOR CONSISTENCY:
1. If characters are defined, use EXACT descriptions in every scene they appear
2. Maintain consistent lighting and color palette across all scenes
3. Follow proper film grammar - start wide, move to close-ups, vary shot types
4. Each scene should logically connect to the next
5. Visual prompts should be hyper-detailed for AI image generation

For each scene, provide:
1. 'narration' - The voiceover or dialogue text
2. 'visualPrompt' - EXTREMELY detailed visual description including:
   - Subject description (be specific and consistent)
   - Action/pose
   - Environment/setting details
   - Lighting conditions
   - Camera perspective
   - Mood/atmosphere
   - Key props or elements
3. 'durationEstimate' - Duration in seconds (typically 3-6s)
4. 'shotType' - One of: "Extreme wide shot", "Wide / Establishing shot", "Medium wide shot", "Medium shot", "Medium close-up", "Close-up", "Extreme close-up", "Insert / Detail shot", "Cutaway", "Two-shot", "Group shot"
5. 'cameraAngle' - One of: "Eye-level", "Low-angle (heroic)", "High-angle (vulnerable)", "Bird's-eye / Top-down", "Dutch tilt", "Over-the-shoulder", "Point of view", "Worm's-eye"
6. 'cameraMovement' - One of: "Locked-off tripod", "Slow push-in", "Slow pull-out", "Pan left", "Pan right", "Tilt up", "Tilt down", "Handheld (controlled)", "Steadicam float", "Dolly-in", "Dolly-out", "Crane / Jib up", "Crane / Jib down", "Orbit / 360°", "Parallax movement", "Tracking shot", "Whip pan"
7. 'lightingStyle' - One of: "High-key (bright, even)", "Low-key (dramatic, shadows)", "Chiaroscuro (strong contrast)", "Soft diffused", "Hard directional", "Practical lights visible", "Rim / Edge lighting", "Motivated lighting", "Silhouette", "Split lighting", "Rembrandt lighting", "Butterfly / Paramount lighting"
8. 'lightSource' - One of: "Tungsten (warm)", "Daylight (5600K)", "Golden hour", "Blue hour / Magic hour", "Neon / LED", "Candle / Fire", "Moonlight", "Overcast / Cloudy", "Mixed sources"

FILM GRAMMAR RULES TO FOLLOW:
- Scene 1 should be establishing (wide shots)
- Build emotional intensity through shot progression
- Vary angles and movements to maintain visual interest
- Use close-ups for emotional peaks
- Match lighting continuity across scenes`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-05-20',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              narration: { type: Type.STRING },
              visualPrompt: { type: Type.STRING },
              durationEstimate: { type: Type.INTEGER },
              shotType: { type: Type.STRING },
              cameraAngle: { type: Type.STRING },
              cameraMovement: { type: Type.STRING },
              lightingStyle: { type: Type.STRING },
              lightSource: { type: Type.STRING }
            },
            required: ['narration', 'visualPrompt', 'durationEstimate', 'shotType', 'cameraAngle', 'cameraMovement', 'lightingStyle', 'lightSource']
          }
        }
      }
    });

    const data = JSON.parse(response.text || '[]');
    
    // Enrich with IDs, status, and map string values to enums
    return data.map((item: any, index: number) => {
      const scene = createDefaultScene(index + 1);
      return {
        ...scene,
        ...item,
        id: index + 1,
        status: 'pending' as const,
        // Map string values to closest enum values
        shotType: mapToShotType(item.shotType),
        cameraAngle: mapToCameraAngle(item.cameraAngle),
        cameraMovement: mapToCameraMovement(item.cameraMovement),
        lightingStyle: mapToLightingStyle(item.lightingStyle),
        lightSource: mapToLightSource(item.lightSource),
        focalLength: inferFocalLength(item.shotType),
        depthOfField: inferDepthOfField(item.shotType),
        characterIds: config?.characters?.map(c => c.id) || [],
        transitionIn: index === 0 ? TransitionType.FADE_BLACK : TransitionType.CUT,
        transitionOut: index === data.length - 1 ? TransitionType.FADE_BLACK : TransitionType.CUT
      };
    });

  } catch (error) {
    console.error("Script generation error:", error);
    throw new Error("Failed to generate script.");
  }
};

// --- 3. CHARACTER EXTRACTION ---
export const extractCharactersFromPrompt = async (prompt: string): Promise<CharacterProfile[]> => {
  const ai = getAi();
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-05-20',
      contents: `Analyze this video concept and extract any characters mentioned. For each character, provide detailed visual descriptions that can be used to maintain consistency across AI-generated images.

Concept: ${prompt}

Extract characters with extremely specific visual details. If details aren't specified, make reasonable creative choices that fit the concept.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              physicalDescription: { type: Type.STRING },
              age: { type: Type.STRING },
              gender: { type: Type.STRING },
              skinTone: { type: Type.STRING },
              hairStyle: { type: Type.STRING },
              hairColor: { type: Type.STRING },
              eyeColor: { type: Type.STRING },
              bodyType: { type: Type.STRING },
              distinguishingFeatures: { type: Type.STRING },
              currentOutfit: { type: Type.STRING },
              accessories: { type: Type.STRING },
              emotionalState: { type: Type.STRING }
            },
            required: ['name', 'physicalDescription', 'age', 'gender']
          }
        }
      }
    });

    const data = JSON.parse(response.text || '[]');
    return data.map((char: any, idx: number) => ({
      ...char,
      id: `char-${idx + 1}-${Date.now()}`
    }));
  } catch (error) {
    console.error("Character extraction error:", error);
    return [];
  }
};

// --- 4. LOCATION EXTRACTION ---
export const extractLocationsFromPrompt = async (prompt: string): Promise<LocationProfile[]> => {
  const ai = getAi();
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-05-20',
      contents: `Analyze this video concept and extract any locations/settings mentioned. For each location, provide detailed visual descriptions for AI image generation consistency.

Concept: ${prompt}

Extract locations with specific environmental details.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              type: { type: Type.STRING },
              description: { type: Type.STRING },
              timeOfDay: { type: Type.STRING },
              weather: { type: Type.STRING },
              lighting: { type: Type.STRING },
              keyElements: { type: Type.ARRAY, items: { type: Type.STRING } },
              colorScheme: { type: Type.STRING },
              atmosphere: { type: Type.STRING }
            },
            required: ['name', 'type', 'description']
          }
        }
      }
    });

    const data = JSON.parse(response.text || '[]');
    return data.map((loc: any, idx: number) => ({
      ...loc,
      id: `loc-${idx + 1}-${Date.now()}`
    }));
  } catch (error) {
    console.error("Location extraction error:", error);
    return [];
  }
};

// --- 5. ENHANCED SCENE IMAGE GENERATION (Nano Banana Pro / Imagen 3) ---
export const generateSceneImage = async (
  visualPrompt: string, 
  aspectRatio: string,
  config?: ProjectConfig,
  scene?: Scene
): Promise<string> => {
  const ai = getAi();
  
  // Build the enhanced prompt if we have full context
  let finalPrompt: string;
  
  if (config && scene) {
    finalPrompt = buildEnhancedPrompt(scene, config, { includeNegative: false });
  } else {
    // Fallback to basic enhancement
    finalPrompt = enhanceBasicPrompt(visualPrompt, config);
  }
  
  console.log('🎬 Generating image with enhanced prompt:', finalPrompt.substring(0, 200) + '...');
  
  try {
    const response = await ai.models.generateContent({
      model: 'imagen-3.0-generate-002',
      contents: finalPrompt,
      config: {
        responseModalities: ['IMAGE']
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Image gen error:", error);
    throw error;
  }
};

// --- 6. ENHANCED VIDEO GENERATION (Veo 3) ---
export const generateSceneVideo = async (
  imageBase64: string, 
  prompt: string, 
  aspectRatio: string,
  config?: ProjectConfig,
  scene?: Scene
): Promise<string> => {
  
  // Ensure we have a key selected for Veo
  if (typeof window !== 'undefined' && window.aistudio && window.aistudio.hasSelectedApiKey) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      throw new Error("API_KEY_REQUIRED");
    }
  }

  const ai = getAi();

  // Build motion-optimized prompt for Veo
  let finalPrompt: string;
  
  if (config && scene) {
    finalPrompt = buildVideoMotionPrompt(scene, config);
  } else {
    finalPrompt = enhanceVideoPrompt(prompt);
  }
  
  console.log('🎬 Generating video with prompt:', finalPrompt.substring(0, 200) + '...');

  // Veo expects raw base64 without data URI prefix
  const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.0-generate-preview',
      prompt: finalPrompt, 
      image: {
        imageBytes: cleanBase64,
        mimeType: 'image/png', 
      },
      config: {
        numberOfVideos: 1,
        durationSeconds: scene?.durationEstimate || 5,
        aspectRatio: aspectRatio as any
      }
    });

    // Polling loop
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video generation failed: No URI returned.");

    // Fetch the actual binary to play locally
    const res = await fetch(`${videoUri}&key=${API_KEY}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);

  } catch (error) {
    console.error("Video gen error:", error);
    throw error;
  }
};

// --- 7. REFINE VISUAL PROMPT ---
export const refineVisualPrompt = async (
  basicPrompt: string,
  config: ProjectConfig,
  sceneIndex: number
): Promise<string> => {
  const ai = getAi();
  const consistencySignature = generateConsistencySignature(config);
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-05-20',
      contents: `Enhance this visual prompt for AI image generation while maintaining style consistency.

Original prompt: ${basicPrompt}

Style signature to maintain: ${consistencySignature}

${config.characters.length > 0 ? `Characters (use EXACT descriptions): ${generateCharacterConsistencyPrompt(config.characters)}` : ''}

Scene number: ${sceneIndex + 1} of ${config.scenes.length}

Requirements:
1. Expand with more visual details
2. Add specific lighting and composition details
3. Include camera/lens information
4. Maintain character consistency if characters are present
5. Keep the same mood and atmosphere
6. Be extremely specific to reduce AI interpretation variance

Return ONLY the enhanced prompt, no explanations.`,
    });

    return response.text || basicPrompt;
  } catch (error) {
    console.error("Prompt refinement error:", error);
    return basicPrompt;
  }
};

// --- HELPER FUNCTIONS ---

function enhanceBasicPrompt(prompt: string, config?: ProjectConfig): string {
  const stylePreset = config?.style 
    ? VISUAL_STYLE_PRESETS.find(s => s.id === config.style) || VISUAL_STYLE_PRESETS[0]
    : VISUAL_STYLE_PRESETS[0];
  
  const enhancements = [
    prompt,
    stylePreset.prompt,
    '4K resolution, highly detailed, professional cinematography',
    config?.filmGrain ? 'subtle film grain texture' : '',
    config?.colorGrading || 'professional color grading'
  ].filter(Boolean);
  
  return enhancements.join('. ');
}

function enhanceVideoPrompt(prompt: string): string {
  return `${prompt}. Smooth cinematic motion, professional video quality, natural movement, subtle camera motion, atmospheric lighting.`;
}

// Mapping functions for string to enum conversion
function mapToShotType(value: string): ShotType {
  const map: Record<string, ShotType> = {
    'extreme wide shot': ShotType.EXTREME_WIDE,
    'wide': ShotType.WIDE,
    'wide / establishing shot': ShotType.WIDE,
    'establishing shot': ShotType.WIDE,
    'medium wide shot': ShotType.MEDIUM_WIDE,
    'medium wide': ShotType.MEDIUM_WIDE,
    'medium shot': ShotType.MEDIUM,
    'medium': ShotType.MEDIUM,
    'medium close-up': ShotType.MEDIUM_CLOSE,
    'medium close up': ShotType.MEDIUM_CLOSE,
    'close-up': ShotType.CLOSE_UP,
    'close up': ShotType.CLOSE_UP,
    'closeup': ShotType.CLOSE_UP,
    'extreme close-up': ShotType.EXTREME_CLOSE,
    'extreme close up': ShotType.EXTREME_CLOSE,
    'insert': ShotType.INSERT,
    'insert / detail shot': ShotType.INSERT,
    'detail shot': ShotType.INSERT,
    'cutaway': ShotType.CUTAWAY,
    'two-shot': ShotType.TWO_SHOT,
    'two shot': ShotType.TWO_SHOT,
    'group shot': ShotType.GROUP,
    'group': ShotType.GROUP
  };
  return map[value.toLowerCase()] || ShotType.MEDIUM;
}

function mapToCameraAngle(value: string): CameraAngle {
  const map: Record<string, CameraAngle> = {
    'eye-level': CameraAngle.EYE_LEVEL,
    'eye level': CameraAngle.EYE_LEVEL,
    'low-angle': CameraAngle.LOW_ANGLE,
    'low angle': CameraAngle.LOW_ANGLE,
    'low-angle (heroic)': CameraAngle.LOW_ANGLE,
    'high-angle': CameraAngle.HIGH_ANGLE,
    'high angle': CameraAngle.HIGH_ANGLE,
    'high-angle (vulnerable)': CameraAngle.HIGH_ANGLE,
    "bird's-eye": CameraAngle.BIRDS_EYE,
    "bird's eye": CameraAngle.BIRDS_EYE,
    "bird's-eye / top-down": CameraAngle.BIRDS_EYE,
    'top-down': CameraAngle.BIRDS_EYE,
    'dutch tilt': CameraAngle.DUTCH_TILT,
    'dutch angle': CameraAngle.DUTCH_TILT,
    'over-the-shoulder': CameraAngle.OVER_SHOULDER,
    'over the shoulder': CameraAngle.OVER_SHOULDER,
    'ots': CameraAngle.OVER_SHOULDER,
    'point of view': CameraAngle.POV,
    'pov': CameraAngle.POV,
    "worm's-eye": CameraAngle.WORMS_EYE,
    "worm's eye": CameraAngle.WORMS_EYE
  };
  return map[value.toLowerCase()] || CameraAngle.EYE_LEVEL;
}

function mapToCameraMovement(value: string): CameraMovement {
  const map: Record<string, CameraMovement> = {
    'locked-off tripod': CameraMovement.STATIC_TRIPOD,
    'static': CameraMovement.STATIC_TRIPOD,
    'tripod': CameraMovement.STATIC_TRIPOD,
    'slow push-in': CameraMovement.SLOW_PUSH_IN,
    'push-in': CameraMovement.SLOW_PUSH_IN,
    'push in': CameraMovement.SLOW_PUSH_IN,
    'slow pull-out': CameraMovement.SLOW_PULL_OUT,
    'pull-out': CameraMovement.SLOW_PULL_OUT,
    'pull out': CameraMovement.SLOW_PULL_OUT,
    'pan left': CameraMovement.PAN_LEFT,
    'pan right': CameraMovement.PAN_RIGHT,
    'tilt up': CameraMovement.TILT_UP,
    'tilt down': CameraMovement.TILT_DOWN,
    'handheld': CameraMovement.HANDHELD,
    'handheld (controlled)': CameraMovement.HANDHELD,
    'steadicam': CameraMovement.STEADICAM,
    'steadicam float': CameraMovement.STEADICAM,
    'dolly-in': CameraMovement.DOLLY_IN,
    'dolly in': CameraMovement.DOLLY_IN,
    'dolly-out': CameraMovement.DOLLY_OUT,
    'dolly out': CameraMovement.DOLLY_OUT,
    'crane': CameraMovement.CRANE_UP,
    'crane / jib up': CameraMovement.CRANE_UP,
    'crane up': CameraMovement.CRANE_UP,
    'jib up': CameraMovement.CRANE_UP,
    'crane / jib down': CameraMovement.CRANE_DOWN,
    'crane down': CameraMovement.CRANE_DOWN,
    'jib down': CameraMovement.CRANE_DOWN,
    'orbit': CameraMovement.ORBIT,
    'orbit / 360°': CameraMovement.ORBIT,
    '360': CameraMovement.ORBIT,
    'parallax': CameraMovement.PARALLAX,
    'parallax movement': CameraMovement.PARALLAX,
    'tracking': CameraMovement.TRACKING,
    'tracking shot': CameraMovement.TRACKING,
    'whip pan': CameraMovement.WHIP_PAN,
    'whip': CameraMovement.WHIP_PAN
  };
  return map[value.toLowerCase()] || CameraMovement.STATIC_TRIPOD;
}

function mapToLightingStyle(value: string): LightingStyle {
  const map: Record<string, LightingStyle> = {
    'high-key': LightingStyle.HIGH_KEY,
    'high key': LightingStyle.HIGH_KEY,
    'high-key (bright, even)': LightingStyle.HIGH_KEY,
    'low-key': LightingStyle.LOW_KEY,
    'low key': LightingStyle.LOW_KEY,
    'low-key (dramatic, shadows)': LightingStyle.LOW_KEY,
    'chiaroscuro': LightingStyle.CHIAROSCURO,
    'chiaroscuro (strong contrast)': LightingStyle.CHIAROSCURO,
    'soft diffused': LightingStyle.SOFT_DIFFUSED,
    'soft': LightingStyle.SOFT_DIFFUSED,
    'diffused': LightingStyle.SOFT_DIFFUSED,
    'hard directional': LightingStyle.HARD_DIRECTIONAL,
    'hard': LightingStyle.HARD_DIRECTIONAL,
    'directional': LightingStyle.HARD_DIRECTIONAL,
    'practical': LightingStyle.PRACTICAL,
    'practical lights visible': LightingStyle.PRACTICAL,
    'rim': LightingStyle.RIM_LIGHT,
    'rim lighting': LightingStyle.RIM_LIGHT,
    'rim / edge lighting': LightingStyle.RIM_LIGHT,
    'edge lighting': LightingStyle.RIM_LIGHT,
    'motivated': LightingStyle.MOTIVATED,
    'motivated lighting': LightingStyle.MOTIVATED,
    'silhouette': LightingStyle.SILHOUETTE,
    'split': LightingStyle.SPLIT_LIGHT,
    'split lighting': LightingStyle.SPLIT_LIGHT,
    'rembrandt': LightingStyle.REMBRANDT,
    'rembrandt lighting': LightingStyle.REMBRANDT,
    'butterfly': LightingStyle.BUTTERFLY,
    'butterfly / paramount lighting': LightingStyle.BUTTERFLY,
    'paramount': LightingStyle.BUTTERFLY
  };
  return map[value.toLowerCase()] || LightingStyle.SOFT_DIFFUSED;
}

function mapToLightSource(value: string): LightSource {
  const map: Record<string, LightSource> = {
    'tungsten': LightSource.TUNGSTEN,
    'tungsten (warm)': LightSource.TUNGSTEN,
    'warm': LightSource.TUNGSTEN,
    'daylight': LightSource.DAYLIGHT,
    'daylight (5600k)': LightSource.DAYLIGHT,
    'natural': LightSource.DAYLIGHT,
    'golden hour': LightSource.GOLDEN_HOUR,
    'sunset': LightSource.GOLDEN_HOUR,
    'sunrise': LightSource.GOLDEN_HOUR,
    'blue hour': LightSource.BLUE_HOUR,
    'blue hour / magic hour': LightSource.BLUE_HOUR,
    'magic hour': LightSource.BLUE_HOUR,
    'twilight': LightSource.BLUE_HOUR,
    'neon': LightSource.NEON,
    'neon / led': LightSource.NEON,
    'led': LightSource.NEON,
    'candle': LightSource.CANDLE_FIRE,
    'fire': LightSource.CANDLE_FIRE,
    'candle / fire': LightSource.CANDLE_FIRE,
    'candlelight': LightSource.CANDLE_FIRE,
    'firelight': LightSource.CANDLE_FIRE,
    'moonlight': LightSource.MOONLIGHT,
    'moon': LightSource.MOONLIGHT,
    'overcast': LightSource.OVERCAST,
    'overcast / cloudy': LightSource.OVERCAST,
    'cloudy': LightSource.OVERCAST,
    'mixed': LightSource.MIXED,
    'mixed sources': LightSource.MIXED
  };
  return map[value.toLowerCase()] || LightSource.DAYLIGHT;
}

function inferFocalLength(shotType: string): FocalLength {
  const lower = shotType.toLowerCase();
  if (lower.includes('extreme wide') || lower.includes('establishing')) return FocalLength.WIDE_24;
  if (lower.includes('wide')) return FocalLength.WIDE_28;
  if (lower.includes('close-up') || lower.includes('closeup')) return FocalLength.PORTRAIT_85;
  if (lower.includes('extreme close')) return FocalLength.TELEPHOTO_135;
  return FocalLength.STANDARD_50;
}

function inferDepthOfField(shotType: string): DepthOfField {
  const lower = shotType.toLowerCase();
  if (lower.includes('extreme wide') || lower.includes('wide')) return DepthOfField.DEEP_FOCUS;
  if (lower.includes('close-up') || lower.includes('closeup')) return DepthOfField.EXTREME_SHALLOW;
  return DepthOfField.CINEMATIC_SHALLOW;
}
