'use server';

// ========================================
// DLM DIRECTOR - ENHANCED GEMINI SERVICE
// Character consistency & cinematic generation
// ========================================

import { GoogleGenAI } from "@google/genai";
import {
  Scene,
  ProjectConfig,
  VideoModel,
  VideoCategory,
  CharacterProfile,
  LocationProfile,
  TrendingTopic,
  createDefaultScene,
  ShotType,
  CameraAngle,
  CameraMovement,
  FocalLength,
  DepthOfField,
  LightingStyle,
  LightSource,
  TransitionType
} from "../types";
import {
  buildEnhancedPrompt,
  buildVideoMotionPrompt,
} from "./promptBuilder";

// API Key from environment variables (configure in Vercel dashboard or .env.local)
const API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.API_KEY || '';

// Helper to get AI instance
const getAi = () => {
  // Enhanced sanitization: trim whitespace and remove all newlines
  const trimmedKey = API_KEY.trim().replace(/[\r\n]+/g, '');
  if (!trimmedKey) {
    console.error("❌ GEMINI_API_KEY is missing from environment variables!");
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GoogleGenAI({ apiKey: trimmedKey });
};

// Retry helper for robust generation
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      console.warn(`[GeminiService] Operation failed, retrying... (${retries} attempts left). Error: ${error}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

// --- IMAGE GENERATION ---
// Can be called with just (scene, config) OR (visualPrompt, aspectRatio, config, scene) for backwards compatibility
// Using Nano Banana Pro (gemini-3-pro-image-preview) - the latest and best image generation model
export const generateSceneImage = async (
  sceneOrPrompt: Scene | string,
  configOrAspectRatio: ProjectConfig | string,
  optionalConfig?: ProjectConfig,
  optionalScene?: Scene
): Promise<string> => {
  // Handle both calling conventions
  let scene: Scene;
  let config: ProjectConfig;
  
  if (typeof sceneOrPrompt === 'string') {
    // Old calling style: (visualPrompt, aspectRatio, config, scene)
    scene = optionalScene!;
    config = optionalConfig!;
  } else {
    // New calling style: (scene, config)
    scene = sceneOrPrompt;
    config = configOrAspectRatio as ProjectConfig;
  }
  
  return withRetry(async () => {
    const ai = getAi();
    
    // Build the enhanced prompt
    const prompt = buildEnhancedPrompt(scene, config, { includeNegative: true });
    console.log(`[GeminiService] Generating Image for Scene ${scene.id} with Nano Banana Pro. Prompt length: ${prompt.length}`);

    // Use Nano Banana Pro model (latest and best for image generation)
    const modelId = 'nano-banana-pro-preview';
    
    // Map aspect ratio to a supported value
    const validAspectRatio = mapToSupportedAspectRatio(config.aspectRatio);
    
    console.log(`[GeminiService] Calling generateContent API with model ${modelId}, aspect ratio: ${validAspectRatio}...`);
    
    // Add timeout wrapper for the API call (90 seconds for higher quality model)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Image generation timeout after 90 seconds')), 90000);
    });

    let response: any;
    try {
      // Nano Banana Pro uses generateContent with IMAGE response modality
      const apiCall = ai.models.generateContent({
        model: modelId,
        contents: [{ 
          role: 'user', 
          parts: [{ text: prompt }] 
        }],
        config: {
          responseModalities: ['IMAGE'],
          // @ts-ignore - aspectRatio may not be in types but is supported
          aspectRatio: validAspectRatio,
        }
      });
      
      // Race between API call and timeout
      response = await Promise.race([apiCall, timeoutPromise]);
      
      console.log(`[GeminiService] generateContent API call completed`);
      
    } catch (apiErr: any) {
      console.error(`[GeminiService] generateContent API call FAILED:`, apiErr);
      throw apiErr;
    }

    // Extract image from Nano Banana Pro response structure
    const candidate = response?.candidates?.[0];
    const imagePart = candidate?.content?.parts?.[0];
    
    console.log(`[GeminiService] Image extraction result:`, {
      hasCandidate: !!candidate,
      hasImagePart: !!imagePart,
      hasInlineData: !!imagePart?.inlineData,
      dataLength: imagePart?.inlineData?.data?.length,
      mimeType: imagePart?.inlineData?.mimeType
    });
    
    if (!imagePart?.inlineData?.data) {
      console.error(`[GeminiService] No image data found in response. Full response:`, JSON.stringify(response, null, 2).substring(0, 1000));
      throw new Error(`No image generated. Response structure: ${JSON.stringify(Object.keys(response || {}))}`);
    }

    const mimeType = imagePart.inlineData.mimeType || 'image/png';
    return `data:${mimeType};base64,${imagePart.inlineData.data}`;
  }, 2, 3000); // 2 retries with 3 second delay
};

// --- ENHANCED VIDEO GENERATION ---
export const generateSceneVideo = async (
  imageBase64: string, // Input image (optional if purely prompt based, but usually i2v)
  prompt: string, // Fallback simple prompt
  aspectRatio: string,
  config?: ProjectConfig,
  scene?: Scene
): Promise<string> => {
  return withRetry(async () => {
    // Ensure we have a key selected for Veo if running in browser context (shim check)
    if (typeof window !== 'undefined' && (window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        throw new Error("API_KEY_REQUIRED");
      }
    }

    const ai = getAi();

    // Build motion-optimized prompt for Veo with explicit context
    let finalPrompt: string;
    if (config && scene) {
      finalPrompt = buildVideoMotionPrompt(scene, config);
    } else {
      finalPrompt = `Cinematic Video. ${prompt}`;
    }

    console.log(`[GeminiService] Generating Video. Model: ${config?.videoModel || VideoModel.VEO_3_1}`);
    console.log(`[GeminiService] Audio Enabled: ${config?.audioEnabled}`);
    console.log(`[GeminiService] Prompt: ${finalPrompt.substring(0, 100)}...`);

    // Prepare inputs
    let imageBytes = '';
    let mimeType = 'image/png';

    if (imageBase64) {
         if (imageBase64.startsWith('data:')) {
            const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
            if (matches) {
                mimeType = matches[1];
                imageBytes = matches[2];
            }
         } else {
             imageBytes = imageBase64; // assume raw base64
         }
    }

    // Prepare Reference Images (Ingredients)
    // @ts-ignore
    const referenceImages = [];
    if (scene?.referenceImages && scene.referenceImages.length > 0) {
        console.log(`[GeminiService] Using ${scene.referenceImages.length} reference images`);
        for (const refUrl of scene.referenceImages) {
            try {
                // Fetch only if it's a URL, otherwise parse base64
                let refBytes = '';
                let refMime = 'image/png';
                
                if (refUrl.startsWith('data:')) {
                    refBytes = refUrl.split(',')[1];
                } else {
                    const res = await fetch(refUrl);
                    const buf = await res.arrayBuffer();
                    refBytes = Buffer.from(buf).toString('base64');
                    // simple mime detect
                    if (refUrl.endsWith('.jpg') || refUrl.endsWith('.jpeg')) refMime = 'image/jpeg';
                }
                
                referenceImages.push({
                    imageBytes: refBytes,
                    mimeType: refMime
                });
            } catch (e) {
                console.warn('[GeminiService] Failed to load reference image', e);
            }
        }
    }

    // Determine Model
    const modelId = config?.videoModel || VideoModel.VEO_3_1;

    // Map aspect ratio to a supported value
    const validAspectRatio = mapToSupportedAspectRatio(aspectRatio);

    // Call API
    // @ts-ignore
    let operation = await ai.models.generateVideos({
      model: modelId,
      prompt: finalPrompt,
      // @ts-ignore
      image: imageBytes ? {
        imageBytes,
        mimeType,
      } : undefined,
       // @ts-ignore
      referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
      config: {
        numberOfVideos: 1,
        aspectRatio: validAspectRatio as any,
        // Only request audio if explicitly enabled in config
        // Note: SDK parameter might vary, usually 'sampleCount' or similar for audio? 
        // Veo 2/3 generates audio by default unless instructed otherwise in prompt or config.
        // We relying on the STRONG prompt instruction "Silent, no sound" added in promptBuilder if audioEnabled is false.
      }
    });

    // Polling loop
    console.log('[GeminiService] Polling for video generation...');
    let pollCount = 0;
    while (!operation.done) {
      pollCount++;
      if (pollCount > 60) { // 2 minutes timeout approx (2s sleep)
         throw new Error('Timeout waiting for video generation');
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
      // @ts-ignore
      operation = await ai.models.operations.get({ name: operation.name });
    }
    
    // @ts-ignore
    const result = operation.result;
    // @ts-ignore
    const video = result?.generatedVideos?.[0]?.video;

    if (!video || !video.videoUri) {
       throw new Error("No video URI in response");
    }

    console.log('[GeminiService] Video generated successfully');
    
    // Fetch the video from the URI to return as Base64 (or return URI if client handles it)
    // The previous implementation returned base64/url. 
    // Veo returns a short-lived URI. We should fetch it and save it.
    
    const videoRes = await fetch(video.videoUri);
    const videoBuf = await videoRes.arrayBuffer();
    const videoBase64 = Buffer.from(videoBuf).toString('base64');

    return `data:video/mp4;base64,${videoBase64}`;

  }, 3, 5000); // 3 retries, 5s initial delay
};

// --- VIDEO EXTENSION ---
export const extendVideo = async (
  videoBase64: string,
  prompt: string,
  config?: ProjectConfig
): Promise<string> => {
   return withRetry(async () => {
      const ai = getAi();
      const modelId = config?.videoModel || VideoModel.VEO_3_1;
      
      console.log(`[GeminiService] Extending video. Model: ${modelId}`);

      // Basic cleanup of video data
      let videoBytes = videoBase64.replace(/^data:video\/(mp4|webm);base64,/, '');
      let mimeType = 'video/mp4';

      // Map aspect ratio to a supported value
      const validAspectRatio = mapToSupportedAspectRatio(config?.aspectRatio);
      
      // @ts-ignore
      let operation = await ai.models.generateVideos({
          model: modelId,
          prompt: `Cinematic extension. ${prompt}`,
          // @ts-ignore - Hypothetical input structure for extension
          video: {
              videoBytes,
              mimeType
          },
          config: {
              numberOfVideos: 1,
              aspectRatio: validAspectRatio as any
          }
      });

      // Poll
      while (!operation.done) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          // @ts-ignore
          operation = await ai.models.operations.get({ name: operation.name });
      }

      // @ts-ignore
      const video = operation.result?.generatedVideos?.[0]?.video;
      if (!video?.videoUri) throw new Error("Extension failed");
      
      const res = await fetch(video.videoUri);
      const buf = await res.arrayBuffer();
      return `data:video/mp4;base64,${Buffer.from(buf).toString('base64')}`;

   });
};

// --- SCRIPT GENERATION ---
export const generateScript = async (
  category: VideoCategory,
  style: string,
  userPrompt: string,
  config: ProjectConfig,
  sceneCount: number = 5
): Promise<Scene[]> => {
  return withRetry(async () => {
    const ai = getAi();
    
    const systemPrompt = `You are an expert cinematic screenplay writer and director. Generate a detailed shot-by-shot breakdown for a ${category} video.

For each scene, provide:
- narration: What the voiceover or dialogue says
- visualPrompt: Detailed visual description for image/video generation
- durationEstimate: Estimated duration in seconds (should be 10 seconds per scene)
- shotType: One of [EXTREME_WIDE, WIDE, MEDIUM_WIDE, MEDIUM, MEDIUM_CLOSE, CLOSE_UP, EXTREME_CLOSE, INSERT, CUTAWAY, TWO_SHOT, GROUP]
- cameraAngle: One of [EYE_LEVEL, LOW_ANGLE, HIGH_ANGLE, BIRDS_EYE, DUTCH_TILT, OVER_SHOULDER, POV, WORMS_EYE]
- cameraMovement: One of [STATIC_TRIPOD, SLOW_PUSH_IN, SLOW_PULL_OUT, PAN_LEFT, PAN_RIGHT, TILT_UP, TILT_DOWN, HANDHELD, STEADICAM, DOLLY_IN, DOLLY_OUT, CRANE_UP, CRANE_DOWN, ORBIT, PARALLAX, TRACKING, WHIP_PAN]
- lightingStyle: One of [HIGH_KEY, LOW_KEY, CHIAROSCURO, SOFT_DIFFUSED, HARD_DIRECTIONAL, PRACTICAL, RIM_LIGHT, MOTIVATED, SILHOUETTE, SPLIT_LIGHT, REMBRANDT, BUTTERFLY]
- lightSource: One of [TUNGSTEN, DAYLIGHT, GOLDEN_HOUR, BLUE_HOUR, NEON, CANDLE_FIRE, MOONLIGHT, OVERCAST, MIXED]

Style direction: ${style}

Return a valid JSON array of ${sceneCount} scenes. Each scene should have these exact fields.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\nUser concept: ${userPrompt}\n\nGenerate exactly ${sceneCount} scenes as a JSON array.` }]
      }]
    });

    // @ts-ignore
    const text = response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON array found in response');
    }
    
    const rawScenes = JSON.parse(jsonMatch[0]);
    
    // Map to proper Scene objects with defaults
    const scenes: Scene[] = rawScenes.map((raw: Record<string, unknown>, index: number) => {
      const base = createDefaultScene(index + 1);
      return {
        ...base,
        narration: raw.narration as string || '',
        visualPrompt: raw.visualPrompt as string || '',
        durationEstimate: raw.durationEstimate as number || 10,
        shotType: mapShotType(raw.shotType as string),
        cameraAngle: mapCameraAngle(raw.cameraAngle as string),
        cameraMovement: mapCameraMovement(raw.cameraMovement as string),
        lightingStyle: mapLightingStyle(raw.lightingStyle as string),
        lightSource: mapLightSource(raw.lightSource as string),
      };
    });
    
    console.log(`[GeminiService] Generated ${scenes.length} scenes`);
    return scenes;
  });
};

// --- TRENDING TOPICS ---
export const fetchTrendingTopics = async (category: VideoCategory): Promise<TrendingTopic[]> => {
  return withRetry(async () => {
    const ai = getAi();
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{
        role: 'user',
        parts: [{ text: `Generate 5 trending video concepts for the category "${category}". 
Return a JSON array with objects containing:
- title: Short catchy title
- description: Brief 1-2 sentence description of the video concept

Focus on current trends, viral formats, and engaging content ideas.
Return ONLY a valid JSON array.` }]
      }]
    });

    // @ts-ignore
    const text = response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }
    
    const topics: TrendingTopic[] = JSON.parse(jsonMatch[0]);
    return topics;
  }, 2, 1000);
};

// --- CHARACTER EXTRACTION ---
export const extractCharactersFromPrompt = async (userPrompt: string): Promise<CharacterProfile[]> => {
  return withRetry(async () => {
    const ai = getAi();
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{
        role: 'user',
        parts: [{ text: `Analyze this video concept and extract all characters mentioned or implied:

"${userPrompt}"

For each character, provide:
- name: Character name or role (e.g., "The Hero", "Detective Sarah")
- physicalDescription: Brief overall appearance
- age: Approximate age or age range
- gender: Gender presentation
- skinTone: Skin tone description
- hairStyle: Hair style description
- hairColor: Hair color
- eyeColor: Eye color
- bodyType: Body type description
- distinguishingFeatures: Any unique features
- currentOutfit: What they're wearing
- accessories: Any accessories
- emotionalState: Their emotional state in the story

Return a JSON array of character objects. If no clear characters are mentioned, infer 1-2 main characters based on the concept.
Return ONLY a valid JSON array.` }]
      }]
    });

    // @ts-ignore
    const text = response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }
    
    const rawCharacters = JSON.parse(jsonMatch[0]);
    
    const characters: CharacterProfile[] = rawCharacters.map((raw: Record<string, unknown>, index: number) => ({
      id: `char_${Date.now()}_${index}`,
      name: raw.name as string || `Character ${index + 1}`,
      physicalDescription: raw.physicalDescription as string || '',
      age: raw.age as string || 'adult',
      gender: raw.gender as string || '',
      skinTone: raw.skinTone as string || '',
      hairStyle: raw.hairStyle as string || '',
      hairColor: raw.hairColor as string || '',
      eyeColor: raw.eyeColor as string || '',
      bodyType: raw.bodyType as string || '',
      distinguishingFeatures: raw.distinguishingFeatures as string || '',
      currentOutfit: raw.currentOutfit as string || '',
      accessories: raw.accessories as string || '',
      emotionalState: raw.emotionalState as string || ''
    }));
    
    console.log(`[GeminiService] Extracted ${characters.length} characters`);
    return characters;
  }, 2, 1000);
};

// --- LOCATION EXTRACTION ---
export const extractLocationsFromPrompt = async (userPrompt: string): Promise<LocationProfile[]> => {
  return withRetry(async () => {
    const ai = getAi();
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{
        role: 'user',
        parts: [{ text: `Analyze this video concept and extract all locations mentioned or implied:

"${userPrompt}"

For each location, provide:
- name: Location name
- type: Type of location (indoor/outdoor/mixed)
- description: Detailed description
- timeOfDay: Time of day (dawn, morning, noon, afternoon, dusk, night)
- weather: Weather conditions if relevant
- lighting: Lighting conditions
- keyElements: Array of key visual elements in the scene
- colorScheme: Dominant colors
- atmosphere: Overall mood/atmosphere

Return a JSON array of location objects. If no clear locations are mentioned, infer 1-2 main locations based on the concept.
Return ONLY a valid JSON array.` }]
      }]
    });

    // @ts-ignore
    const text = response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }
    
    const rawLocations = JSON.parse(jsonMatch[0]);
    
    const locations: LocationProfile[] = rawLocations.map((raw: Record<string, unknown>, index: number) => ({
      id: `loc_${Date.now()}_${index}`,
      name: raw.name as string || `Location ${index + 1}`,
      type: raw.type as string || 'mixed',
      description: raw.description as string || '',
      timeOfDay: raw.timeOfDay as string || 'day',
      weather: raw.weather as string || '',
      lighting: raw.lighting as string || 'natural',
      keyElements: (raw.keyElements as string[]) || [],
      colorScheme: raw.colorScheme as string || '',
      atmosphere: raw.atmosphere as string || ''
    }));
    
    console.log(`[GeminiService] Extracted ${locations.length} locations`);
    return locations;
  }, 2, 1000);
};

// --- ASPECT RATIO MAPPING ---
// Maps unsupported aspect ratios to the closest supported one
// Supported by Imagen/Veo: 1:1, 9:16, 16:9, 4:3, 3:4
function mapToSupportedAspectRatio(aspectRatio: string | undefined): string {
  const supportedRatios = ['1:1', '9:16', '16:9', '4:3', '3:4'];
  const input = aspectRatio || '16:9';
  
  // Direct match
  if (supportedRatios.includes(input)) {
    return input;
  }
  
  // Map common unsupported ratios to closest supported equivalent
  const ratioMapping: Record<string, string> = {
    '21:9': '16:9',    // Ultra-wide cinematic → widescreen
    '2.39:1': '16:9',  // Anamorphic → widescreen  
    '2.35:1': '16:9',  // CinemaScope → widescreen
    '1.85:1': '16:9',  // Academy flat → widescreen
    '1.78:1': '16:9',  // 16:9 decimal form
    '2:1': '16:9',     // Univisium → widescreen
    '1:2': '9:16',     // Tall format → portrait
    '5:4': '4:3',      // Near square → 4:3
    '4:5': '3:4',      // Portrait photo → 3:4
  };
  
  if (ratioMapping[input]) {
    console.warn(`⚠️ Aspect ratio ${input} is not supported. Mapping to ${ratioMapping[input]}.`);
    return ratioMapping[input];
  }
  
  // Fallback for any unknown ratio
  console.warn(`⚠️ Unknown aspect ratio ${input}. Defaulting to 16:9.`);
  return '16:9';
}

// --- HELPER MAPPERS ---
function mapShotType(value: string | undefined): ShotType {
  const map: Record<string, ShotType> = {
    'EXTREME_WIDE': ShotType.EXTREME_WIDE,
    'WIDE': ShotType.WIDE,
    'MEDIUM_WIDE': ShotType.MEDIUM_WIDE,
    'MEDIUM': ShotType.MEDIUM,
    'MEDIUM_CLOSE': ShotType.MEDIUM_CLOSE,
    'CLOSE_UP': ShotType.CLOSE_UP,
    'EXTREME_CLOSE': ShotType.EXTREME_CLOSE,
    'INSERT': ShotType.INSERT,
    'CUTAWAY': ShotType.CUTAWAY,
    'TWO_SHOT': ShotType.TWO_SHOT,
    'GROUP': ShotType.GROUP
  };
  return map[value || ''] || ShotType.MEDIUM;
}

function mapCameraAngle(value: string | undefined): CameraAngle {
  const map: Record<string, CameraAngle> = {
    'EYE_LEVEL': CameraAngle.EYE_LEVEL,
    'LOW_ANGLE': CameraAngle.LOW_ANGLE,
    'HIGH_ANGLE': CameraAngle.HIGH_ANGLE,
    'BIRDS_EYE': CameraAngle.BIRDS_EYE,
    'DUTCH_TILT': CameraAngle.DUTCH_TILT,
    'OVER_SHOULDER': CameraAngle.OVER_SHOULDER,
    'POV': CameraAngle.POV,
    'WORMS_EYE': CameraAngle.WORMS_EYE
  };
  return map[value || ''] || CameraAngle.EYE_LEVEL;
}

function mapCameraMovement(value: string | undefined): CameraMovement {
  const map: Record<string, CameraMovement> = {
    'STATIC_TRIPOD': CameraMovement.STATIC_TRIPOD,
    'SLOW_PUSH_IN': CameraMovement.SLOW_PUSH_IN,
    'SLOW_PULL_OUT': CameraMovement.SLOW_PULL_OUT,
    'PAN_LEFT': CameraMovement.PAN_LEFT,
    'PAN_RIGHT': CameraMovement.PAN_RIGHT,
    'TILT_UP': CameraMovement.TILT_UP,
    'TILT_DOWN': CameraMovement.TILT_DOWN,
    'HANDHELD': CameraMovement.HANDHELD,
    'STEADICAM': CameraMovement.STEADICAM,
    'DOLLY_IN': CameraMovement.DOLLY_IN,
    'DOLLY_OUT': CameraMovement.DOLLY_OUT,
    'CRANE_UP': CameraMovement.CRANE_UP,
    'CRANE_DOWN': CameraMovement.CRANE_DOWN,
    'ORBIT': CameraMovement.ORBIT,
    'PARALLAX': CameraMovement.PARALLAX,
    'TRACKING': CameraMovement.TRACKING,
    'WHIP_PAN': CameraMovement.WHIP_PAN
  };
  return map[value || ''] || CameraMovement.STATIC_TRIPOD;
}

function mapLightingStyle(value: string | undefined): LightingStyle {
  const map: Record<string, LightingStyle> = {
    'HIGH_KEY': LightingStyle.HIGH_KEY,
    'LOW_KEY': LightingStyle.LOW_KEY,
    'CHIAROSCURO': LightingStyle.CHIAROSCURO,
    'SOFT_DIFFUSED': LightingStyle.SOFT_DIFFUSED,
    'HARD_DIRECTIONAL': LightingStyle.HARD_DIRECTIONAL,
    'PRACTICAL': LightingStyle.PRACTICAL,
    'RIM_LIGHT': LightingStyle.RIM_LIGHT,
    'MOTIVATED': LightingStyle.MOTIVATED,
    'SILHOUETTE': LightingStyle.SILHOUETTE,
    'SPLIT_LIGHT': LightingStyle.SPLIT_LIGHT,
    'REMBRANDT': LightingStyle.REMBRANDT,
    'BUTTERFLY': LightingStyle.BUTTERFLY
  };
  return map[value || ''] || LightingStyle.SOFT_DIFFUSED;
}

function mapLightSource(value: string | undefined): LightSource {
  const map: Record<string, LightSource> = {
    'TUNGSTEN': LightSource.TUNGSTEN,
    'DAYLIGHT': LightSource.DAYLIGHT,
    'GOLDEN_HOUR': LightSource.GOLDEN_HOUR,
    'BLUE_HOUR': LightSource.BLUE_HOUR,
    'NEON': LightSource.NEON,
    'CANDLE_FIRE': LightSource.CANDLE_FIRE,
    'MOONLIGHT': LightSource.MOONLIGHT,
    'OVERCAST': LightSource.OVERCAST,
    'MIXED': LightSource.MIXED
  };
  return map[value || ''] || LightSource.DAYLIGHT;
}
