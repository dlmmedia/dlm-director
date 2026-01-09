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
  RED_KOMODO = 'RED Komodo',
  RED_V_RAPTOR = 'RED V-Raptor',
  SONY_VENICE = 'Sony Venice 2',
  BLACKMAGIC_URSA = 'Blackmagic URSA Mini Pro',
  IMAX_LF = 'IMAX Large Format',
  PANAVISION_DXL2 = 'Panavision DXL2'
}

export enum LensType {
  SPHERICAL_PRIME = 'Spherical Prime',
  ANAMORPHIC_2X = 'Anamorphic 2x Squeeze',
  ANAMORPHIC_1_8X = 'Anamorphic 1.8x Squeeze',
  VINTAGE_COOKE = 'Vintage Cooke Panchro',
  MODERN_ZEISS = 'Modern Zeiss Master Prime',
  PANAVISION_PRIMO = 'Panavision Primo 70',
  LEICA_SUMMILUX = 'Leica Summilux-C'
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
  
  // Characters & Locations
  characters: CharacterProfile[];
  locations: LocationProfile[];
  
  // Style consistency
  globalStyle: string;
  negativePrompt: string;
  colorGrading: string;
  filmGrain: boolean;
  
  // Audio (future)
  voiceoverEnabled: boolean;
  musicStyle?: string;
}

// --- TRENDING ---
export interface TrendingTopic {
  title: string;
  description: string;
  url?: string;
}

// --- PROMPT TEMPLATES ---
export interface PromptTemplate {
  id: string;
  name: string;
  category: VideoCategory;
  structure: string;
  examples: string[];
}

// --- VISUAL STYLE PRESETS ---
export const VISUAL_STYLE_PRESETS = [
  {
    id: 'cinematic-realistic',
    name: 'Realistic, Cinematic Lighting, 4K',
    prompt: 'photorealistic, cinematic lighting, 4K resolution, film grain, shallow depth of field, professional color grading',
    negativePrompt: 'cartoon, anime, illustration, drawing, painting, low quality, blurry, watermark, text overlay'
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk, Neon, High Contrast',
    prompt: 'cyberpunk aesthetic, neon lights, rain-slicked streets, holographic elements, futuristic, high contrast, blade runner inspired',
    negativePrompt: 'daylight, natural, pastoral, cartoon, low quality, blurry'
  },
  {
    id: 'anime-ghibli',
    name: 'Anime Style, Studio Ghibli inspired',
    prompt: 'studio ghibli style, anime, hand-painted backgrounds, soft lighting, whimsical, japanese animation aesthetic',
    negativePrompt: 'photorealistic, 3D render, western cartoon, dark, gritty'
  },
  {
    id: 'vintage-35mm',
    name: 'Vintage 35mm Film Grain',
    prompt: '35mm film photography, vintage aesthetic, film grain, warm color cast, nostalgic, kodak portra colors, slight vignette',
    negativePrompt: 'digital, clean, modern, high definition, neon, futuristic'
  },
  {
    id: 'dark-fantasy',
    name: 'Dark Fantasy, Detailed Texture',
    prompt: 'dark fantasy, intricate details, dramatic lighting, mystical atmosphere, gothic elements, rich textures, cinematic',
    negativePrompt: 'bright, cheerful, cartoon, simple, minimalist, modern'
  },
  {
    id: 'documentary-natural',
    name: 'Documentary, Natural Light',
    prompt: 'documentary style, natural lighting, authentic, candid moments, raw footage aesthetic, realistic colors',
    negativePrompt: 'stylized, fantasy, neon, dramatic, artificial lighting'
  },
  {
    id: 'music-video-stylized',
    name: 'Music Video, Stylized, Dynamic',
    prompt: 'music video aesthetic, dynamic angles, stylized color grading, dramatic lighting, performance energy, cinematic slow motion',
    negativePrompt: 'static, documentary, muted colors, talking heads'
  },
  {
    id: 'commercial-clean',
    name: 'Commercial, Clean, Premium',
    prompt: 'commercial photography, clean aesthetic, premium look, perfect lighting, product shot quality, aspirational',
    negativePrompt: 'grungy, dark, dramatic, vintage, film grain, low budget'
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
    durationEstimate: 4,
    status: 'pending',
    shotType: ShotType.MEDIUM,
    cameraAngle: CameraAngle.EYE_LEVEL,
    cameraMovement: CameraMovement.STATIC_TRIPOD,
    focalLength: FocalLength.STANDARD_50,
    depthOfField: DepthOfField.CINEMATIC_SHALLOW,
    lightingStyle: LightingStyle.SOFT_DIFFUSED,
    lightSource: LightSource.DAYLIGHT,
    characterIds: [],
    transitionIn: TransitionType.CUT,
    transitionOut: TransitionType.CUT
  };
}

export function createDefaultConfig(): ProjectConfig {
  return {
    title: '',
    category: VideoCategory.CINEMATIC,
    aspectRatio: AspectRatio.WIDESCREEN,
    style: 'cinematic-realistic',
    userPrompt: '',
    scenes: [],
    defaultCamera: CameraBody.ARRI_ALEXA_MINI,
    defaultLens: LensType.SPHERICAL_PRIME,
    defaultColorPalette: 'teal-orange',
    characters: [],
    locations: [],
    globalStyle: 'photorealistic, cinematic lighting, 4K resolution, film grain, shallow depth of field',
    negativePrompt: 'cartoon, anime, illustration, low quality, blurry, watermark, text overlay, deformed, ugly, bad anatomy',
    colorGrading: 'professional cinematic color grading',
    filmGrain: true,
    voiceoverEnabled: false
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
