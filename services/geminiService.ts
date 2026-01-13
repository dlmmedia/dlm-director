'use server';

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
  SHOT_FLOW_TEMPLATES,
  VideoModel
} from "../types";
import {
  buildEnhancedPrompt,
  buildVideoMotionPrompt,
  generateConsistencySignature,
  generateCharacterConsistencyPrompt,
  generateShotSequence
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

// Helper for timeouts
const withTimeout = <T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(errorMsg)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
};

// --- 1. RESEARCH / TRENDING ---
export const fetchTrendingTopics = async (category: VideoCategory): Promise<any[]> => {
  const ai = getAi();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash', // Updated to valid stable model
      contents: `Find 3 trending or popular video topics/styles suitable for a ${category} project right now. Focus on what's working on social media and streaming platforms. Provide a JSON response.`,
      config: {
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
      const responseAny = response as any;
      let cleanText = typeof responseAny.text === 'function' ? responseAny.text() : responseAny.text;
      if (!cleanText) return [];
      
      cleanText = cleanText.replace(/```json/g, "").replace(/```/g, "").trim();
      if (!cleanText) return [];
      
      try {
        return JSON.parse(cleanText);
      } catch (e) {
        console.error("Failed to parse trending topics JSON:", e);
        return [];
      }
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
  console.log('🎬 Starting script generation...');
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

  // Build texture/lighting context
  const cinematographyContext = `
  CINEMATOGRAPHY SETTINGS:
  - Camera: ${config?.defaultCamera}
  - Lens: ${config?.defaultLens}
  - Lighting Style: ${config?.lightingGuide?.globalStyle || 'Dynamic'}
  - Texture Detail: ${config?.textureConfig?.skinDetail || 'Natural'}
  `;

  const systemInstruction = `You are a world-class film director, cinematographer, and screenwriter combined.
  Create a professional visual script for a ${category} video.

  VISUAL STYLE: ${stylePreset.prompt}
  ${cinematographyContext}
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
    console.log('📤 Sending prompt to Gemini for script generation...');
    const response = await withTimeout(ai.models.generateContent({
      model: 'gemini-2.0-flash',
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
    }), 60000, "Script generation timed out");

    console.log('📥 Received response from Gemini for script');
    const responseAny = response as any;
    let rawText = (typeof responseAny.text === 'function' ? responseAny.text() : responseAny.text) || '[]';
    
    // Remove markdown code blocks if present (Gemini often wraps JSON in ```json ... ```)
    rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

    if (!rawText) rawText = '[]';

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      console.error("Failed to parse script JSON:", e);
      throw new Error("Received invalid JSON from script generator");
    }

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
    throw new Error(`Failed to generate script: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// --- 3. CHARACTER EXTRACTION ---
export const extractCharactersFromPrompt = async (prompt: string): Promise<CharacterProfile[]> => {
  console.log('🔍 Starting character extraction...');
  const ai = getAi();

  try {
    console.log('📤 Sending prompt to Gemini for characters...');
    const response = await withTimeout(ai.models.generateContent({
      model: 'gemini-2.0-flash',
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
    }), 30000, "Character extraction timed out");

    console.log('📥 Received response from Gemini for characters');
    let cleanText = response.text || '[]';
    cleanText = cleanText.replace(/```json/g, "").replace(/```/g, "");
    const data = JSON.parse(cleanText);
    console.log(`✅ Extracted ${data.length} characters`);
    return data.map((char: any, idx: number) => ({
      ...char,
      id: `char-${idx + 1}-${Date.now()}`
    }));
  } catch (error) {
    console.error("❌ Character extraction error:", error);
    return [];
  }
};

// --- 4. LOCATION EXTRACTION ---
export const extractLocationsFromPrompt = async (prompt: string): Promise<LocationProfile[]> => {
  console.log('🔍 Starting location extraction...');
  const ai = getAi();

  try {
    console.log('📤 Sending prompt to Gemini for locations...');
    const response = await withTimeout(ai.models.generateContent({
      model: 'gemini-2.0-flash',
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
    }), 30000, "Location extraction timed out");

    console.log('📥 Received response from Gemini for locations');
    let cleanText = response.text || '[]';
    cleanText = cleanText.replace(/```json/g, "").replace(/```/g, "");
    const data = JSON.parse(cleanText);
    console.log(`✅ Extracted ${data.length} locations`);
    return data.map((loc: any, idx: number) => ({
      ...loc,
      id: `loc-${idx + 1}-${Date.now()}`
    }));
  } catch (error) {
    console.error("❌ Location extraction error:", error);
    return [];
  }
};

// --- 5. ENHANCED SCENE IMAGE GENERATION (Nano Banana Pro / Imagen 3/4) ---
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
  console.log(`📐 Image Aspect Ratio: ${aspectRatio}`);

  // Prepare reference images if any
  // @ts-ignore
  const referenceImages = [];
  
  if (config && scene && scene.referenceImages && scene.referenceImages.length > 0) {
    console.log(`🖼️ Using ${scene.referenceImages.length} reference images for Image Generation`);
    
    // Add explicitly selected scene references
    for (const ref of scene.referenceImages) {
      if (ref.type === 'INGREDIENT') continue; // Ingredients are for video only
      
      let imageBytes = ref.base64;
      if (!imageBytes && ref.url.startsWith('data:')) {
        imageBytes = ref.url.split(',')[1];
      }

      if (imageBytes) {
        referenceImages.push({
          referenceType: ref.type, // STYLE or SUBJECT
          image: {
            imageBytes: imageBytes,
            mimeType: ref.mimeType
          },
          referenceId: ref.id // Optional but good for tracking
        });
      }
    }
  }

  // Add global style references if any (and not already added)
  if (config?.globalReferenceImages) {
    for (const ref of config.globalReferenceImages) {
      // Avoid duplicates
      if (referenceImages.some((r: any) => r.referenceId === ref.id)) continue;
      
      if (ref.type === 'STYLE') {
        let imageBytes = ref.base64;
        if (!imageBytes && ref.url.startsWith('data:')) {
            imageBytes = ref.url.split(',')[1];
        }

        if (imageBytes) {
           referenceImages.push({
            referenceType: 'STYLE',
            image: { imageBytes, mimeType: ref.mimeType },
            referenceId: ref.id
          });
        }
      }
    }
  }

  try {
    // Convert reference images to inlineData parts for generateContent
    const contentParts: any[] = [{ text: finalPrompt }];
    
    // @ts-ignore
    if (referenceImages.length > 0) {
      console.log(`🖼️ Attaching ${referenceImages.length} reference images to prompt`);
      // @ts-ignore
      referenceImages.forEach(ref => {
        contentParts.push({
          inlineData: {
            mimeType: ref.image.mimeType,
            data: ref.image.imageBytes
          }
        });
      });
    }

    console.log(`📤 Sending image generation request to Gemini (Nano Banana Pro)...`);
    const response = await withTimeout(ai.models.generateContent({
      model: 'nano-banana-pro-preview',
      contents: [{ role: 'user', parts: contentParts }],
      config: {
        responseModalities: ['IMAGE'],
        // @ts-ignore
        aspectRatio: aspectRatio === '9:16' ? '9:16' : (aspectRatio || '16:9')
      }
    }), 45000, "Image generation timed out"); // 45s timeout

    console.log('📥 Received response from Gemini for image');

    // Parse generateContent response
    const candidate = response.candidates?.[0];
    const imagePart = candidate?.content?.parts?.[0];
    
    if (imagePart?.inlineData?.data) {
      const mimeType = imagePart.inlineData.mimeType || 'image/png';
      return `data:${mimeType};base64,${imagePart.inlineData.data}`;
    }
    
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Image gen error:", error);
    throw error;
  }
};

// --- 6. ENHANCED VIDEO GENERATION (Veo 3.1) ---
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

  console.log(`🎬 Generating video for Scene ${scene ? scene.id : 'unknown'}`);
  console.log(`📝 Video Prompt: ${finalPrompt}`);
  console.log(`📐 Aspect Ratio: ${aspectRatio}`);
  if (config?.audioEnabled) {
    console.log('🔊 Audio generation requested via prompt');
  }

  // --- VEO 3.1 INPUTS ---
  // @ts-ignore
  const referenceImages = [];
  
  // 1. Scene Ingredients (Reference Images)
  if (config && scene && scene.referenceImages && scene.referenceImages.length > 0) {
    console.log(`🖼️ Using ${scene.referenceImages.length} reference images (ingredients) for Veo`);
    
    for (const ref of scene.referenceImages) {
      let imageBytes = ref.base64;
      if (!imageBytes && ref.url.startsWith('data:')) {
        imageBytes = ref.url.split(',')[1];
      } else if (!imageBytes && ref.url.startsWith('http')) {
        // Need to fetch URL if base64 is missing
        try {
            const res = await fetch(ref.url);
            const buf = await res.arrayBuffer();
            imageBytes = Buffer.from(buf).toString('base64');
        } catch(e) { console.error("Failed to fetch ref image", e); continue; }
      }

      if (imageBytes) {
        referenceImages.push({
          image: {
            imageBytes: imageBytes,
            mimeType: ref.mimeType
          },
          referenceId: ref.id
        });
      }
    }
  }

  // 2. Main Input Image (Image-to-Video)
  // Helper to get base64 from input (which might be a URL or data URI)
  let imageBytes: string | undefined;
  let mimeType = 'image/png';

  if (imageBase64) {
    if (imageBase64.startsWith('http')) {
        console.log('⬇️ Fetching source image from URL:', imageBase64);
        const imgRes = await fetch(imageBase64);
        if (!imgRes.ok) throw new Error(`Failed to fetch source image: ${imgRes.status}`);
        const arrayBuffer = await imgRes.arrayBuffer();
        imageBytes = Buffer.from(arrayBuffer).toString('base64');
        const contentType = imgRes.headers.get('content-type');
        if (contentType) mimeType = contentType;
    } else {
        // It's likely a data URI
        imageBytes = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
        const match = imageBase64.match(/^data:(image\/[a-z]+);base64,/);
        if (match) mimeType = match[1];
    }
  }

  // 3. Frame Anchoring (First/Last Frame)
  let lastFrameImage: any = undefined;
  
  if (scene?.frameAnchoring?.lastFrameUrl) {
     console.log('⚓ Using last frame anchor');
     let lastBytes = '';
     if (scene.frameAnchoring.lastFrameUrl.startsWith('data:')) {
        lastBytes = scene.frameAnchoring.lastFrameUrl.split(',')[1];
     } else {
         const res = await fetch(scene.frameAnchoring.lastFrameUrl);
         const buf = await res.arrayBuffer();
         lastBytes = Buffer.from(buf).toString('base64');
     }
     
     lastFrameImage = {
         imageBytes: lastBytes,
         mimeType: 'image/png' // Assuming png or detect from url
     };
  }

  try {
    // Switch to Veo 3.1 or user selected model
    const modelId = config?.videoModel || VideoModel.VEO_3_1;
    console.log(`🤖 Using model: ${modelId}`);

    // Handle aspect ratio fix for 21:9
    let validAspectRatio = aspectRatio;
    if (aspectRatio === '21:9') {
      console.warn('⚠️ 21:9 aspect ratio is not supported by Veo. Auto-correcting to 16:9.');
      validAspectRatio = '16:9';
    }

    let operation = await ai.models.generateVideos({
      model: modelId,
      prompt: finalPrompt,
      // @ts-ignore - SDK supports image input
      image: imageBytes ? {
        imageBytes,
        mimeType,
      } : undefined,
      // @ts-ignore - SDK supports reference images
      referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
      // @ts-ignore - SDK supports last frame
      lastFrameImage: lastFrameImage,
      config: {
        numberOfVideos: 1,
        // @ts-ignore - SDK might use durationSeconds or similar
        // Note: Providing 'durationSeconds' (even 5) causes a 400 error with Veo 3.1 currently.
        // We let the model use its default (5s).
        // durationSeconds: 5,
        aspectRatio: validAspectRatio as any
      }
    });

    // Polling loop
    console.log('⏳ Polling for video generation...');
    let pollCount = 0;
    while (!operation.done) {
      pollCount++;
      if (pollCount > 120) throw new Error("Video generation timed out (10 minutes)");

      await new Promise(resolve => setTimeout(resolve, 5000));
      // Pass the name, not the whole object if possible, or check SDK usage.
      // If operation is the response object, it has a name.
      console.log(`Polling attempt ${pollCount}, operation name: ${operation.name}`);

      try {
        // @ts-ignore - SDK type definition mismatch with runtime requirement
        operation = await ai.operations.getVideosOperation({ operation: operation });
      } catch (pollError) {
        console.error("Polling error details:", pollError);
        throw pollError;
      }
    }

    // @ts-ignore
    console.log('✅ Video generation complete. Result:', JSON.stringify(operation.result || operation.response, null, 2));

    // @ts-ignore
    const videoUri = operation.result?.generatedVideos?.[0]?.video?.uri || operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!videoUri) {
      console.error("Full operation response:", JSON.stringify(operation, null, 2));
      throw new Error("Video generation failed: No URI returned.");
    }

    console.log('⬇️ Fetching video from:', videoUri);

    // Fetch the actual binary to play locally
    // Note: The URI usually needs the API key if it's a direct API reference
    const fetchUrl = videoUri.includes('key=') ? videoUri : `${videoUri}${videoUri.includes('?') ? '&' : '?'}key=${API_KEY}`;

    const res = await fetch(fetchUrl);
    if (!res.ok) {
      throw new Error(`Failed to download video: ${res.status} ${res.statusText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return `data:video/mp4;base64,${base64}`;

  } catch (error: any) {
    console.error("❌ Video gen error:", error);

    // Detailed error logging
    if (error.response) {
      console.error("Error details:", JSON.stringify(error.response, null, 2));

      // Handle Quota/Rate Limit specifically
      if (error.response.status === 429 || (error.message && error.message.includes("429"))) {
        console.error("⚠️ QUOTA EXCEEDED (429). The user needs to check their billing or wait.");
        throw new Error(`Quota Exceeded: You have reached the rate limit for the ${config?.videoModel || 'Veo'} model. Please wait a moment or check your API plan.`);
      }
    }

    // Specific error logging for debugging scene 3 issues
    if (scene) {
      console.error(`FAILED SCENE ID: ${scene.id}`);
      console.error(`FAILED PROMPT: ${finalPrompt}`);
    }
    throw error;
  }
};

// --- 8. VIDEO EXTENSION (Veo 3.1) ---
export const extendVideo = async (
  videoBase64: string,
  prompt: string,
  config?: ProjectConfig
): Promise<string> => {
    // Ensure we have a key selected for Veo
  if (typeof window !== 'undefined' && window.aistudio && window.aistudio.hasSelectedApiKey) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      throw new Error("API_KEY_REQUIRED");
    }
  }

  const ai = getAi();
  
  // Clean up prompt
  const finalPrompt = enhanceVideoPrompt(prompt);
  console.log(`⏩ Extending video with prompt: ${finalPrompt}`);

  // Process input video
  let videoBytes = videoBase64.replace(/^data:video\/(mp4|webm);base64,/, '');
  let mimeType = 'video/mp4';

  try {
     // Switch to Veo 3.1
    const modelId = config?.videoModel || VideoModel.VEO_3_1;
    
    // Note: Video extension typically uses the 'generateVideos' endpoint but with video input
    // The current SDK might handle this via 'generateVideos' with a video object if supported
    // OR it might be a separate method. We'll try passing it as 'video' content.
    
    // IMPORTANT: As of early 2026, check if SDK supports video input for extension directly
    // If not, we might need to rely on the backend API structure.
    
    // Attempting via standard generateVideos with video input (hypothetical SDK support)
    // If this fails, we might need to use raw REST call or check updated SDK docs
    
    let operation = await ai.models.generateVideos({
      model: modelId,
      prompt: finalPrompt,
      // @ts-ignore - Hypothetical SDK support for video input in generateVideos
      video: {
          videoBytes,
          mimeType
      },
      config: {
          numberOfVideos: 1,
          aspectRatio: config?.aspectRatio as any || '16:9'
      }
    });

     // Polling loop
    console.log('⏳ Polling for video extension...');
    let pollCount = 0;
    while (!operation.done) {
      pollCount++;
      if (pollCount > 120) throw new Error("Video extension timed out");

      await new Promise(resolve => setTimeout(resolve, 5000));
      // @ts-ignore
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    // @ts-ignore
    const videoUri = operation.result?.generatedVideos?.[0]?.video?.uri;
    
    if (!videoUri) throw new Error("Extension failed: No URI");

    const fetchUrl = videoUri.includes('key=') ? videoUri : `${videoUri}${videoUri.includes('?') ? '&' : '?'}key=${API_KEY}`;
    const res = await fetch(fetchUrl);
    if (!res.ok) throw new Error("Failed to download extended video");
    
    const arrayBuffer = await res.arrayBuffer();
    return `data:video/mp4;base64,${Buffer.from(arrayBuffer).toString('base64')}`;

  } catch (error) {
      console.error("Video extension error:", error);
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
      model: 'gemini-2.0-flash',
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
    'masterpiece, best quality, 4K resolution, highly detailed, professional cinematography, sharp focus',
    config?.filmGrain ? 'subtle film grain texture, analog film look' : '',
    config?.colorGrading || 'professional color grading, cinematic lighting'
  ].filter(Boolean);

  return enhancements.join('. ');
}

function enhanceVideoPrompt(prompt: string): string {
  return `${prompt}. Cinematic motion, temporal consistency, smooth transition, professional video quality, high fidelity, natural movement, atmospheric lighting, 4k.`;
}

// Mapping functions for string to enum conversion
function mapToShotType(value: string | undefined | null): ShotType {
  if (!value || typeof value !== 'string') return ShotType.MEDIUM;
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

function mapToCameraAngle(value: string | undefined | null): CameraAngle {
  if (!value || typeof value !== 'string') return CameraAngle.EYE_LEVEL;
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

function mapToCameraMovement(value: string | undefined | null): CameraMovement {
  if (!value || typeof value !== 'string') return CameraMovement.STATIC_TRIPOD;
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

function mapToLightingStyle(value: string | undefined | null): LightingStyle {
  if (!value || typeof value !== 'string') return LightingStyle.SOFT_DIFFUSED;
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

function mapToLightSource(value: string | undefined | null): LightSource {
  if (!value || typeof value !== 'string') return LightSource.DAYLIGHT;
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

function inferFocalLength(shotType: string | undefined | null): FocalLength {
  if (!shotType || typeof shotType !== 'string') return FocalLength.STANDARD_50;
  const lower = shotType.toLowerCase();
  if (lower.includes('extreme wide') || lower.includes('establishing')) return FocalLength.WIDE_24;
  if (lower.includes('wide')) return FocalLength.WIDE_28;
  if (lower.includes('close-up') || lower.includes('closeup')) return FocalLength.PORTRAIT_85;
  if (lower.includes('extreme close')) return FocalLength.TELEPHOTO_135;
  return FocalLength.STANDARD_50;
}

function inferDepthOfField(shotType: string | undefined | null): DepthOfField {
  if (!shotType || typeof shotType !== 'string') return DepthOfField.CINEMATIC_SHALLOW;
  const lower = shotType.toLowerCase();
  if (lower.includes('extreme wide') || lower.includes('wide')) return DepthOfField.DEEP_FOCUS;
  if (lower.includes('close-up') || lower.includes('closeup')) return DepthOfField.EXTREME_SHALLOW;
  return DepthOfField.CINEMATIC_SHALLOW;
}
