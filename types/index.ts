// ========================================
// DLM DIRECTOR - ADVANCED TYPE SYSTEM
// ========================================

// --- VIDEO CATEGORIES ---
export enum VideoCategory {
  CINEMATIC = 'Cinematic Trailer',
  FEATURE_FILM = 'Feature Film Scene',
  YOUTUBE = 'YouTube Content',
  MUSIC_VIDEO = 'Music Video',
  COMMERCIAL = 'Commercial / Ad',
  DOCUMENTARY = 'Documentary',
  FASHION = 'Fashion Film',
  SHORTS = 'Vertical Short / Reel',
  EXPLAINER = 'Explainer / Voiceover',
  EXPERIMENTAL = 'Experimental / Art Film'
}

// --- VIDEO MODELS ---
export enum VideoModel {
  VEO_3_1 = 'veo-3.1-generate-preview',
  VEO_2_0 = 'veo-2.0-generate-001'
}

// --- ASPECT RATIOS ---
export enum AspectRatio {
  WIDESCREEN = '16:9',
  PORTRAIT = '9:16',
  SQUARE = '1:1',
  CINEMA = '21:9',
  IMAX = '1.43:1'
}

// --- CAMERA SYSTEMS ---
export enum CameraBody {
  ARRI_ALEXA_MINI = 'ARRI Alexa Mini LF',
  ARRI_ALEXA_65 = 'ARRI Alexa 65',
  RED_KOMODO = 'RED Komodo',
  RED_V_RAPTOR = 'RED V-Raptor',
  SONY_VENICE = 'Sony Venice 2',
  SONY_FX3 = 'Sony FX3',
  BLACKMAGIC_URSA = 'Blackmagic URSA Mini Pro',
  IMAX_LF = 'IMAX Large Format',
  IMAX_1570 = 'IMAX 15/70mm Film',
  PANAVISION_DXL2 = 'Panavision DXL2',
  CANON_C500 = 'Canon EOS C500 Mark II',
  HASSELBLAD_PRIME = 'Hasselblad X2D 100C'
}

export enum LensType {
  SPHERICAL_PRIME = 'Spherical Prime',
  ANAMORPHIC_2X = 'Anamorphic 2x Squeeze',
  ANAMORPHIC_1_8X = 'Anamorphic 1.8x Squeeze',
  VINTAGE_COOKE = 'Vintage Cooke Panchro',
  VINTAGE_LOMO = 'Vintage Lomo Anamorphic',
  MODERN_ZEISS = 'Modern Zeiss Master Prime',
  PANAVISION_PRIMO = 'Panavision Primo 70',
  LEICA_SUMMILUX = 'Leica Summilux-C',
  HASSELBLAD_PRIME = 'Hasselblad Prime',
  SIGMA_CINE = 'Sigma Cine High-Speed'
}

export enum FocalLength {
  ULTRA_WIDE_14 = '14mm',
  ULTRA_WIDE_18 = '18mm',
  WIDE_24 = '24mm',
  WIDE_28 = '28mm',
  STANDARD_35 = '35mm',
  STANDARD_50 = '50mm',
  PORTRAIT_85 = '85mm',
  TELEPHOTO_135 = '135mm',
  TELEPHOTO_200 = '200mm'
}

export enum DepthOfField {
  EXTREME_SHALLOW = 'Extremely shallow (f/1.4)',
  CINEMATIC_SHALLOW = 'Cinematic shallow (f/2.8)',
  MODERATE = 'Moderate (f/5.6)',
  DEEP_FOCUS = 'Deep focus (f/11+)'
}

// --- CAMERA ANGLES ---
export enum CameraAngle {
  EYE_LEVEL = 'Eye-level',
  LOW_ANGLE = 'Low-angle (heroic)',
  HIGH_ANGLE = 'High-angle (vulnerable)',
  BIRDS_EYE = "Bird's-eye / Top-down",
  DUTCH_TILT = 'Dutch tilt',
  OVER_SHOULDER = 'Over-the-shoulder',
  POV = 'Point of view',
  WORMS_EYE = "Worm's-eye"
}

// --- CAMERA MOVEMENTS ---
export enum CameraMovement {
  STATIC_TRIPOD = 'Locked-off tripod',
  SLOW_PUSH_IN = 'Slow push-in',
  SLOW_PULL_OUT = 'Slow pull-out',
  PAN_LEFT = 'Pan left',
  PAN_RIGHT = 'Pan right',
  TILT_UP = 'Tilt up',
  TILT_DOWN = 'Tilt down',
  HANDHELD = 'Handheld (controlled)',
  STEADICAM = 'Steadicam float',
  DOLLY_IN = 'Dolly-in',
  DOLLY_OUT = 'Dolly-out',
  CRANE_UP = 'Crane / Jib up',
  CRANE_DOWN = 'Crane / Jib down',
  ORBIT = 'Orbit / 360°',
  PARALLAX = 'Parallax movement',
  TRACKING = 'Tracking shot',
  WHIP_PAN = 'Whip pan'
}

// --- SHOT TYPES ---
export enum ShotType {
  EXTREME_WIDE = 'Extreme wide shot',
  WIDE = 'Wide / Establishing shot',
  MEDIUM_WIDE = 'Medium wide shot',
  MEDIUM = 'Medium shot',
  MEDIUM_CLOSE = 'Medium close-up',
  CLOSE_UP = 'Close-up',
  EXTREME_CLOSE = 'Extreme close-up',
  INSERT = 'Insert / Detail shot',
  CUTAWAY = 'Cutaway',
  TWO_SHOT = 'Two-shot',
  GROUP = 'Group shot'
}

// --- LIGHTING ---
export enum LightingStyle {
  HIGH_KEY = 'High-key (bright, even)',
  LOW_KEY = 'Low-key (dramatic, shadows)',
  CHIAROSCURO = 'Chiaroscuro (strong contrast)',
  SOFT_DIFFUSED = 'Soft diffused',
  HARD_DIRECTIONAL = 'Hard directional',
  PRACTICAL = 'Practical lights visible',
  RIM_LIGHT = 'Rim / Edge lighting',
  MOTIVATED = 'Motivated lighting',
  SILHOUETTE = 'Silhouette',
  SPLIT_LIGHT = 'Split lighting',
  REMBRANDT = 'Rembrandt lighting',
  BUTTERFLY = 'Butterfly / Paramount lighting'
}

export enum LightSource {
  TUNGSTEN = 'Tungsten (warm)',
  DAYLIGHT = 'Daylight (5600K)',
  GOLDEN_HOUR = 'Golden hour',
  BLUE_HOUR = 'Blue hour / Magic hour',
  NEON = 'Neon / LED',
  CANDLE_FIRE = 'Candle / Fire',
  MOONLIGHT = 'Moonlight',
  OVERCAST = 'Overcast / Cloudy',
  MIXED = 'Mixed sources'
}

// --- COLOR & STYLE ---
export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  shadows: string;
  highlights: string;
  description: string;
}

export const CINEMATIC_PALETTES: Record<string, ColorPalette> = {
  'teal-orange': {
    primary: '#008080',
    secondary: '#FF8C00',
    accent: '#FFD700',
    shadows: '#1a3a3a',
    highlights: '#FFE4B5',
    description: 'Classic Hollywood teal and orange color grading'
  },
  'noir': {
    primary: '#1C1C1C',
    secondary: '#C0C0C0',
    accent: '#8B0000',
    shadows: '#0D0D0D',
    highlights: '#FFFFFF',
    description: 'Film noir high contrast black and white with red accent'
  },
  'neon-cyberpunk': {
    primary: '#FF00FF',
    secondary: '#00FFFF',
    accent: '#FF1493',
    shadows: '#0D0221',
    highlights: '#E0E0E0',
    description: 'Cyberpunk neon with magenta and cyan'
  },
  'warm-vintage': {
    primary: '#CD853F',
    secondary: '#8B4513',
    accent: '#FFD700',
    shadows: '#3E2723',
    highlights: '#FFF8DC',
    description: 'Warm vintage 35mm film look with amber tones'
  },
  'cold-thriller': {
    primary: '#1E3A5F',
    secondary: '#4A7C8C',
    accent: '#87CEEB',
    shadows: '#0C1929',
    highlights: '#E8F4F8',
    description: 'Cold blue thriller atmosphere'
  },
  'earthy-natural': {
    primary: '#556B2F',
    secondary: '#8B7355',
    accent: '#F4A460',
    shadows: '#2F4F2F',
    highlights: '#FFFAF0',
    description: 'Natural earthy documentary tones'
  }
};

// --- CHARACTER PROFILE (for consistency) ---
export interface CharacterProfile {
  id: string;
  name: string;
  physicalDescription: string;
  age: string;
  gender: string;
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  bodyType: string;
  distinguishingFeatures: string;
  currentOutfit: string;
  accessories: string;
  emotionalState: string;
  referenceImageUrl?: string;
}

// --- LOCATION PROFILE (for continuity) ---
export interface LocationProfile {
  id: string;
  name: string;
  type: string;
  description: string;
  timeOfDay: string;
  weather: string;
  lighting: string;
  keyElements: string[];
  colorScheme: string;
  atmosphere: string;
}

// --- REFERENCES ---
export interface ReferenceImage {
  id: string;
  type: 'STYLE' | 'SUBJECT' | 'INGREDIENT';
  source: 'UPLOAD' | 'PROJECT_IMAGE';
  url: string; // Could be a blob URL or base64 data URI
  base64?: string; // Optional raw base64 data for API transmission
  mimeType: string;
}

// --- VIDEO GENERATION CONFIG (VEO 3.1) ---
export interface VideoGenerationConfig {
  model: VideoModel;
  aspectRatio: AspectRatio;
  durationSeconds?: number;
  fps?: number;
  resolution?: '1080p' | '4k';
  seed?: number;
  personGeneration?: 'allow_adult' | 'dont_allow';
}

// --- AUDIO SYSTEM (VEO 3.x) ---
export type MusicIntensity = 'low' | 'med' | 'high';

export interface AudioDialogueLine {
  speaker: string;
  text: string;
  delivery?: string; // e.g. "whispered, tense"
}

export interface AudioMusicConfig {
  enabled: boolean;
  style: string; // e.g. "cinematic orchestral", "lofi", "ambient drone"
  intensity?: MusicIntensity;
}

export interface AudioConfig {
  music?: AudioMusicConfig;
}

export interface SceneAudioConfig {
  ambience?: string; // e.g. "room tone, distant traffic"
  sfx?: string; // e.g. "footsteps on gravel, door creak"
  dialogue?: AudioDialogueLine[];
  musicOverride?: Partial<AudioMusicConfig>; // optional per-scene override
}

// --- SCENE (enhanced) ---
export interface Scene {
  id: number;
  narration: string;
  visualPrompt: string;
  enhancedPrompt?: string; // AI-enriched prompt
  durationEstimate: number;
  status: 'pending' | 'generating_image' | 'image_ready' | 'generating_video' | 'video_ready' | 'error';
  imageUrl?: string;
  videoUrl?: string;
  errorMsg?: string;

  // Regeneration feedback (user-driven refinement)
  imageRevisionNote?: string;
  videoRevisionNote?: string;
  revisionHistory?: { type: 'image' | 'video'; note: string; at: string }[];
  audio?: SceneAudioConfig;
  
  // Cinematography
  shotType: ShotType;
  cameraAngle: CameraAngle;
  cameraMovement: CameraMovement;
  focalLength: FocalLength;
  depthOfField: DepthOfField;
  
  // Lighting
  lightingStyle: LightingStyle;
  lightSource: LightSource;
  
  // References
  characterIds: string[];
  locationId?: string;
  referenceImages: ReferenceImage[]; // Array of reference images for this scene
  
  // Frame Anchoring (VEO 3.1)
  frameAnchoring?: {
    firstFrameImageId?: string; // ID referencing a ReferenceImage or project image
    lastFrameImageId?: string;
    firstFrameUrl?: string;
    lastFrameUrl?: string;
  };

  // Video Extension
  extendedFromVideoUrl?: string; // If this scene extends another video
  
  // Transitions
  transitionIn?: TransitionType;
  transitionOut?: TransitionType;
}

// --- TRANSITIONS ---
export enum TransitionType {
  CUT = 'Hard cut',
  MATCH_CUT = 'Match cut',
  CROSS_DISSOLVE = 'Cross dissolve',
  FADE_BLACK = 'Fade to black',
  FADE_WHITE = 'Fade to white',
  WHIP_PAN = 'Whip pan transition',
  L_CUT = 'L-cut (audio leads)',
  J_CUT = 'J-cut (audio precedes)',
  WIPE = 'Wipe',
  ZOOM_TRANSITION = 'Zoom transition',
  LIGHT_FLASH = 'Light flash transition'
}

// --- PROJECT CONFIG (enhanced) ---
export interface ProjectConfig {
  title: string;
  category: VideoCategory;
  aspectRatio: AspectRatio;
  style: string;
  userPrompt: string;
  scenes: Scene[];
  
  // Cinematography defaults
  defaultCamera: CameraBody;
  defaultLens: LensType;
  defaultColorPalette: string;
  
  // Advanced Visual Config
  textureConfig: TextureConfig;
  lightingGuide: LightingGuide;
  subjectBehavior: SubjectBehavior;
  
  // Characters & Locations
  characters: CharacterProfile[];
  locations: LocationProfile[];
  
  // Global References
  globalReferenceImages: ReferenceImage[];

  // Style consistency
  globalStyle: string;
  negativePrompt: string;
  colorGrading: string;
  filmGrain: boolean;
  
  // Audio
  voiceoverEnabled: boolean;
  audioEnabled?: boolean;
  musicStyle?: string;
  audioConfig?: AudioConfig;

  // Video Model
  videoModel?: VideoModel;
};

// --- TRENDING ---
export interface TrendingTopic {
  title: string;
  description: string;
  url?: string;
}

// --- PROJECT METADATA ---
export interface ProjectMetadata {
  id: string;
  title: string;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectsIndex {
  projects: ProjectMetadata[];
  lastUpdated: string;
}

// --- PROMPT TEMPLATES ---
export interface PromptTemplate {
  id: string;
  name: string;
  category: VideoCategory;
  structure: string;
  examples: string[];
}

// --- VISUAL CONFIGURATION TYPES ---
export interface TextureConfig {
  skinDetail: 'smooth' | 'natural' | 'highly_detailed' | 'rough';
  skinImperfections: boolean; // pores, blemishes
  fabricTexture: 'standard' | 'high_fidelity' | 'visible_weave';
  environmentDetail: 'balanced' | 'high_complexity' | 'minimalist';
  reflectiveSurfaces: boolean;
}

export interface LightingGuide {
  globalStyle: LightingStyle;
  preferredRatios: 'high_contrast' | 'balanced' | 'low_contrast';
  keyLightPosition?: 'left' | 'right' | 'overhead' | 'bottom';
  fillLightIntensity?: 'none' | 'subtle' | 'strong';
}

export interface SubjectBehavior {
  gazeDirection: 'camera' | 'off_camera' | 'interactive' | 'variable';
  eyeContact: boolean; // generally false for cinematic
  movementStyle: 'natural' | 'stylized' | 'minimal' | 'dynamic';
}

// --- VISUAL STYLE PRESETS ---
export interface VisualStylePreset {
  id: string;
  name: string;
  prompt: string;
  negativePrompt: string;
  defaultCamera: CameraBody;
  defaultLens: LensType;
  defaultTextureConfig: TextureConfig;
  defaultLighting: LightingGuide;
  defaultSubjectBehavior: SubjectBehavior;
  defaultAspectRatio: AspectRatio;
}

export const VISUAL_STYLE_PRESETS: VisualStylePreset[] = [
  {
    id: 'cinematic-realistic',
    name: 'Realistic, Cinematic Lighting, 4K',
    prompt: 'photorealistic, cinematic lighting, 4K resolution, film grain, shallow depth of field, professional color grading',
    negativePrompt: 'cartoon, anime, illustration, drawing, painting, low quality, blurry, watermark, text overlay',
    defaultCamera: CameraBody.ARRI_ALEXA_MINI,
    defaultLens: LensType.ANAMORPHIC_2X,
    defaultTextureConfig: {
      skinDetail: 'highly_detailed',
      skinImperfections: true,
      fabricTexture: 'high_fidelity',
      environmentDetail: 'balanced',
      reflectiveSurfaces: false
    },
    defaultLighting: {
      globalStyle: LightingStyle.SOFT_DIFFUSED,
      preferredRatios: 'balanced',
      keyLightPosition: 'right',
      fillLightIntensity: 'subtle'
    },
    defaultSubjectBehavior: {
      gazeDirection: 'off_camera',
      eyeContact: false,
      movementStyle: 'natural'
    },
    defaultAspectRatio: AspectRatio.CINEMA
  },
  {
    id: 'cinematic-film',
    name: 'Cinematic Film / Movie Still',
    prompt: '35mm film still, cinematic framing, narrative atmosphere, detailed texture, authentic film grain',
    negativePrompt: 'digital, glossy, oversharpened, artificial, studio strobe',
    defaultCamera: CameraBody.ARRI_ALEXA_65,
    defaultLens: LensType.VINTAGE_COOKE,
    defaultTextureConfig: {
      skinDetail: 'natural',
      skinImperfections: true,
      fabricTexture: 'visible_weave',
      environmentDetail: 'high_complexity',
      reflectiveSurfaces: false
    },
    defaultLighting: {
      globalStyle: LightingStyle.CHIAROSCURO,
      preferredRatios: 'high_contrast',
      fillLightIntensity: 'subtle'
    },
    defaultSubjectBehavior: {
      gazeDirection: 'off_camera',
      eyeContact: false,
      movementStyle: 'natural'
    },
    defaultAspectRatio: AspectRatio.CINEMA
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk, Neon, High Contrast',
    prompt: 'cyberpunk aesthetic, neon lights, rain-slicked streets, holographic elements, futuristic, high contrast, blade runner inspired',
    negativePrompt: 'daylight, natural, pastoral, cartoon, low quality, blurry',
    defaultCamera: CameraBody.SONY_VENICE,
    defaultLens: LensType.ANAMORPHIC_2X,
    defaultTextureConfig: {
      skinDetail: 'smooth',
      skinImperfections: false,
      fabricTexture: 'standard',
      environmentDetail: 'high_complexity',
      reflectiveSurfaces: true
    },
    defaultLighting: {
      globalStyle: LightingStyle.HARD_DIRECTIONAL,
      preferredRatios: 'high_contrast',
      fillLightIntensity: 'none'
    },
    defaultSubjectBehavior: {
      gazeDirection: 'variable',
      eyeContact: true,
      movementStyle: 'stylized'
    },
    defaultAspectRatio: AspectRatio.CINEMA
  },
  {
    id: 'anime-ghibli',
    name: 'Anime Style, Studio Ghibli inspired',
    prompt: 'studio ghibli style, anime, hand-painted backgrounds, soft lighting, whimsical, japanese animation aesthetic',
    negativePrompt: 'photorealistic, 3D render, western cartoon, dark, gritty',
    defaultCamera: CameraBody.ARRI_ALEXA_MINI, // Placeholder for anime
    defaultLens: LensType.SPHERICAL_PRIME,
    defaultTextureConfig: {
      skinDetail: 'smooth',
      skinImperfections: false,
      fabricTexture: 'standard',
      environmentDetail: 'balanced',
      reflectiveSurfaces: false
    },
    defaultLighting: {
      globalStyle: LightingStyle.SOFT_DIFFUSED,
      preferredRatios: 'low_contrast',
      fillLightIntensity: 'strong'
    },
    defaultSubjectBehavior: {
      gazeDirection: 'variable',
      eyeContact: true,
      movementStyle: 'stylized'
    },
    defaultAspectRatio: AspectRatio.WIDESCREEN
  },
  {
    id: 'vintage-35mm',
    name: 'Vintage 35mm Film Grain',
    prompt: '35mm film photography, vintage aesthetic, film grain, warm color cast, nostalgic, kodak portra colors, slight vignette',
    negativePrompt: 'digital, clean, modern, high definition, neon, futuristic',
    defaultCamera: CameraBody.ARRI_ALEXA_MINI, // Or analog equiv
    defaultLens: LensType.VINTAGE_LOMO,
    defaultTextureConfig: {
      skinDetail: 'natural',
      skinImperfections: true,
      fabricTexture: 'visible_weave',
      environmentDetail: 'balanced',
      reflectiveSurfaces: false
    },
    defaultLighting: {
      globalStyle: LightingStyle.MOTIVATED,
      preferredRatios: 'balanced',
      fillLightIntensity: 'subtle'
    },
    defaultSubjectBehavior: {
      gazeDirection: 'off_camera',
      eyeContact: false,
      movementStyle: 'natural'
    },
    defaultAspectRatio: AspectRatio.WIDESCREEN
  },
  {
    id: 'fashion-editorial',
    name: 'Fashion / Editorial',
    prompt: 'fashion editorial, high fashion, studio lighting, sharp focus, trendy, detailed fabric, pose',
    negativePrompt: 'casual, candid, messy, blurry, low quality',
    defaultCamera: CameraBody.HASSELBLAD_PRIME,
    defaultLens: LensType.SPHERICAL_PRIME,
    defaultTextureConfig: {
      skinDetail: 'highly_detailed',
      skinImperfections: false, // Retouched look
      fabricTexture: 'high_fidelity',
      environmentDetail: 'minimalist',
      reflectiveSurfaces: false
    },
    defaultLighting: {
      globalStyle: LightingStyle.BUTTERFLY,
      preferredRatios: 'balanced',
      fillLightIntensity: 'strong'
    },
    defaultSubjectBehavior: {
      gazeDirection: 'camera',
      eyeContact: false, // Aloof
      movementStyle: 'stylized'
    },
    defaultAspectRatio: AspectRatio.PORTRAIT
  },
  {
    id: 'dark-fantasy',
    name: 'Dark Fantasy, Detailed Texture',
    prompt: 'dark fantasy, intricate details, dramatic lighting, mystical atmosphere, gothic elements, rich textures, cinematic',
    negativePrompt: 'bright, cheerful, cartoon, simple, minimalist, modern',
    defaultCamera: CameraBody.ARRI_ALEXA_MINI,
    defaultLens: LensType.SPHERICAL_PRIME,
    defaultTextureConfig: {
      skinDetail: 'rough',
      skinImperfections: true,
      fabricTexture: 'high_fidelity',
      environmentDetail: 'high_complexity',
      reflectiveSurfaces: false
    },
    defaultLighting: {
      globalStyle: LightingStyle.CHIAROSCURO,
      preferredRatios: 'high_contrast',
      fillLightIntensity: 'none'
    },
    defaultSubjectBehavior: {
      gazeDirection: 'variable',
      eyeContact: true,
      movementStyle: 'stylized'
    },
    defaultAspectRatio: AspectRatio.CINEMA
  },
  {
    id: 'documentary-natural',
    name: 'Documentary, Natural Light',
    prompt: 'documentary style, natural lighting, authentic, candid moments, raw footage aesthetic, realistic colors',
    negativePrompt: 'stylized, fantasy, neon, dramatic, artificial lighting',
    defaultCamera: CameraBody.SONY_FX3,
    defaultLens: LensType.SPHERICAL_PRIME,
    defaultTextureConfig: {
      skinDetail: 'natural',
      skinImperfections: true,
      fabricTexture: 'standard',
      environmentDetail: 'balanced',
      reflectiveSurfaces: false
    },
    defaultLighting: {
      globalStyle: LightingStyle.MOTIVATED,
      preferredRatios: 'balanced',
      fillLightIntensity: 'subtle'
    },
    defaultSubjectBehavior: {
      gazeDirection: 'off_camera',
      eyeContact: false,
      movementStyle: 'natural'
    },
    defaultAspectRatio: AspectRatio.WIDESCREEN
  },
  {
    id: 'music-video-stylized',
    name: 'Music Video, Stylized, Dynamic',
    prompt: 'music video aesthetic, dynamic angles, stylized color grading, dramatic lighting, performance energy, cinematic slow motion',
    negativePrompt: 'static, documentary, muted colors, talking heads',
    defaultCamera: CameraBody.RED_V_RAPTOR,
    defaultLens: LensType.ANAMORPHIC_2X,
    defaultTextureConfig: {
      skinDetail: 'smooth',
      skinImperfections: false,
      fabricTexture: 'standard',
      environmentDetail: 'high_complexity',
      reflectiveSurfaces: true
    },
    defaultLighting: {
      globalStyle: LightingStyle.HARD_DIRECTIONAL,
      preferredRatios: 'high_contrast',
      fillLightIntensity: 'none'
    },
    defaultSubjectBehavior: {
      gazeDirection: 'camera',
      eyeContact: true,
      movementStyle: 'dynamic'
    },
    defaultAspectRatio: AspectRatio.CINEMA
  },
  {
    id: 'commercial-clean',
    name: 'Commercial, Clean, Premium',
    prompt: 'commercial photography, clean aesthetic, premium look, perfect lighting, product shot quality, aspirational',
    negativePrompt: 'grungy, dark, dramatic, vintage, film grain, low budget',
    defaultCamera: CameraBody.ARRI_ALEXA_MINI,
    defaultLens: LensType.SPHERICAL_PRIME,
    defaultTextureConfig: {
      skinDetail: 'smooth',
      skinImperfections: false,
      fabricTexture: 'high_fidelity',
      environmentDetail: 'minimalist',
      reflectiveSurfaces: true
    },
    defaultLighting: {
      globalStyle: LightingStyle.HIGH_KEY,
      preferredRatios: 'low_contrast',
      fillLightIntensity: 'strong'
    },
    defaultSubjectBehavior: {
      gazeDirection: 'camera',
      eyeContact: true,
      movementStyle: 'minimal'
    },
    defaultAspectRatio: AspectRatio.WIDESCREEN
  }
];

// --- SHOT FLOW TEMPLATES ---
export const SHOT_FLOW_TEMPLATES = {
  'establishing': [
    { shot: ShotType.EXTREME_WIDE, purpose: 'Set location and context' },
    { shot: ShotType.WIDE, purpose: 'Show environment details' },
    { shot: ShotType.MEDIUM, purpose: 'Introduce characters' },
    { shot: ShotType.CLOSE_UP, purpose: 'Emotional connection' },
    { shot: ShotType.INSERT, purpose: 'Important detail' }
  ],
  'dialogue': [
    { shot: ShotType.TWO_SHOT, purpose: 'Show both speakers' },
    { shot: ShotType.MEDIUM_CLOSE, purpose: 'Speaker A perspective' },
    { shot: ShotType.CLOSE_UP, purpose: 'Reaction shot B' },
    { shot: ShotType.MEDIUM_CLOSE, purpose: 'Speaker B perspective' },
    { shot: ShotType.CLOSE_UP, purpose: 'Reaction shot A' }
  ],
  'action': [
    { shot: ShotType.WIDE, purpose: 'Show action geography' },
    { shot: ShotType.MEDIUM, purpose: 'Action in progress' },
    { shot: ShotType.CLOSE_UP, purpose: 'Impact moment' },
    { shot: ShotType.INSERT, purpose: 'Key detail' },
    { shot: ShotType.EXTREME_WIDE, purpose: 'Aftermath' }
  ],
  'emotional': [
    { shot: ShotType.MEDIUM_CLOSE, purpose: 'Character focus' },
    { shot: ShotType.CLOSE_UP, purpose: 'Build emotion' },
    { shot: ShotType.EXTREME_CLOSE, purpose: 'Peak emotion (eyes)' },
    { shot: ShotType.MEDIUM, purpose: 'Release / reaction' },
    { shot: ShotType.WIDE, purpose: 'Isolation / context' }
  ]
};

// --- HELPER FUNCTIONS ---
export function createDefaultScene(id: number): Scene {
  return {
    id,
    narration: '',
    visualPrompt: '',
    durationEstimate: 10,
    status: 'pending',
    shotType: ShotType.MEDIUM,
    cameraAngle: CameraAngle.EYE_LEVEL,
    cameraMovement: CameraMovement.STATIC_TRIPOD,
    focalLength: FocalLength.STANDARD_50,
    depthOfField: DepthOfField.CINEMATIC_SHALLOW,
    lightingStyle: LightingStyle.SOFT_DIFFUSED,
    lightSource: LightSource.DAYLIGHT,
    characterIds: [],
    referenceImages: [],
    transitionIn: TransitionType.CUT,
    transitionOut: TransitionType.CUT
  };
}

export function createDefaultConfig(): ProjectConfig {
  const defaultPreset = VISUAL_STYLE_PRESETS[0];
  return {
    title: '',
    category: VideoCategory.CINEMATIC,
    aspectRatio: AspectRatio.WIDESCREEN,
    style: defaultPreset.id,
    userPrompt: '',
    scenes: [],
    defaultCamera: defaultPreset.defaultCamera,
    defaultLens: defaultPreset.defaultLens,
    defaultColorPalette: 'teal-orange',
    textureConfig: defaultPreset.defaultTextureConfig,
    lightingGuide: defaultPreset.defaultLighting,
    subjectBehavior: defaultPreset.defaultSubjectBehavior,
    characters: [],
    locations: [],
    globalReferenceImages: [],
    globalStyle: defaultPreset.prompt,
    negativePrompt: defaultPreset.negativePrompt,
    colorGrading: 'professional cinematic color grading',
    filmGrain: true,
    voiceoverEnabled: false,
    audioEnabled: false,
    videoModel: VideoModel.VEO_3_1
  };
}

export function buildCharacterPromptSegment(char: CharacterProfile): string {
  const parts = [
    char.physicalDescription,
    `${char.age} years old`,
    `${char.hairColor} ${char.hairStyle} hair`,
    `${char.eyeColor} eyes`,
    char.skinTone && `${char.skinTone} skin`,
    char.bodyType,
    char.distinguishingFeatures && `with ${char.distinguishingFeatures}`,
    char.currentOutfit && `wearing ${char.currentOutfit}`,
    char.accessories && `with ${char.accessories}`,
    char.emotionalState && `looking ${char.emotionalState}`
  ].filter(Boolean);
  
  return parts.join(', ');
}

export function buildCinematographyPromptSegment(scene: Scene): string {
  return [
    scene.shotType,
    scene.cameraAngle,
    scene.focalLength + ' lens',
    scene.depthOfField,
    scene.cameraMovement,
    scene.lightingStyle,
    scene.lightSource + ' lighting'
  ].join(', ');
}
