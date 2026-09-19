export interface WordTiming {
  id: string;
  word: string;
  startTimeMs: number;
  endTimeMs: number;
}

export interface LyricLine {
  id: string;
  text: string;
  startTimeMs: number;
  endTimeMs: number;
  words?: WordTiming[];
}

export type AnimationStyle =
  | 'FADE'
  | 'SLIDE'
  | 'SCALE'
  | 'BOUNCE'
  | 'TYPEWRITER'
  | 'KARAOKE'
  | 'WORD_HIGHLIGHT'
  | 'POP'
  | 'ZOOM'
  | 'GLOW';

export interface TextStyleConfig {
  fontFamily: string;
  fontName: string;
  fontSize: number;
  fontWeight: number;
  isItalic: boolean;
  letterSpacing: number;
  lineSpacing: number;
  textColor: string;
  highlightColor: string;
  hasShadow: boolean;
  shadowColor: string;
  shadowBlur: number;
  hasStroke: boolean;
  strokeColor: string;
  strokeWidth: number;
  hasGlow: boolean;
  glowColor: string;
  alignment: 'left' | 'center' | 'right';
  verticalPosition: 'top' | 'center' | 'bottom' | 'custom';
  customYPercent: number; // 10% to 90%
}

export interface TimelineImageItem {
  id: string;
  url: string;
  startTimeMs: number;
  endTimeMs: number;
  durationMs: number;
  crop?: string;
  positionX?: number; // 0 to 100
  positionY?: number; // 0 to 100
  scale?: number;     // 0.1 to 3
  zoom?: 'none' | 'slow_in' | 'slow_out';
  pan?: 'none' | 'left' | 'right' | 'up' | 'down';
  transition?: 'none' | 'fade' | 'slide' | 'zoom';
}

export interface OverlayVideoConfig {
  url: string | null;
  fileName?: string;
  opacity: number;      // 0 to 1
  brightness: number;   // 0 to 2
  contrast: number;     // 0 to 2
  saturation: number;   // 0 to 2
  scale: number;        // 0.1 to 3
  positionX: number;    // percent 0 to 100
  positionY: number;    // percent 0 to 100
  crop?: string;
  startTimeMs: number;
  endTimeMs: number;
  blendMode: 'screen' | 'lighten' | 'normal';
}

export interface BackgroundConfig {
  type: 'color' | 'gradient' | 'image' | 'video';
  color: string;
  gradient: string;
  mediaUrl: string | null;
  blur: number;
  opacity: number;
  overlayColor: string;
  overlayOpacity: number;
  
  // Quranic Cinematic additions
  bgSource?: 'single' | 'multiple' | 'video' | 'ai_generate';
  timelineImages?: TimelineImageItem[];
  videoUrl?: string | null;
  videoFileName?: string;
  videoLoop?: boolean;
  overlayVideo?: OverlayVideoConfig;
  quranLock?: boolean;
  templateId?: string;
}

export type AnimationMode = 'manual' | 'auto';

export type AutoAnimationPreset =
  | 'dynamic' // Balanced rhythm & energy accents
  | 'smooth' // Flowing melodic drift & gentle scale
  | 'kinetic' // Bold punch, upbeat pops & quick cuts
  | 'cinematic' // Slow atmospheric breathing & ambient glow
  | 'karaoke'; // Rhythm-synchronized word pulses

export type AutoMotionEffect =
  | 'PUNCH' // Snappy accent on beat onset
  | 'DRIFT' // Smooth kinetic drift/glide
  | 'FLOAT' // Gentle breathing & ambient floating
  | 'PULSE' // Rhythmic bounce matching tempo
  | 'FADE_SLOW' // Calm cinematic fade
  | 'ZOOM_IN' // Build up scale
  | 'POP_ACCENT'; // Sudden pop on drop/transient

export interface LineAutoAnimation {
  lineId: string;
  energyLevel: 'low' | 'medium' | 'high' | 'peak';
  averageEnergy: number; // 0.0 to 1.0
  peakOnsetMs: number; // relative to line start or absolute
  motionEffect: AutoMotionEffect;
  accentScale: number; // 1.0 to 1.3
  glowIntensity: number; // 0 to 1
  isUserOverride?: boolean;
}

export interface AudioAnalysisSummary {
  sampleRate: number;
  totalDurationMs: number;
  tempoBpm: number;
  averageEnergy: number;
  peakEnergy: number;
  beatCount: number;
  onsetTimestampsMs: number[];
  energyEnvelope: number[]; // e.g. 50-100 normalized points across track
}

export interface AutoAnimationConfig {
  preset: AutoAnimationPreset;
  sensitivity: 'low' | 'normal' | 'high';
  motionIntensity: number; // 0.5 to 1.5 (default 1.0)
  accentResponse: 'subtle' | 'punchy' | 'intense';
  timeline: LineAutoAnimation[];
  analysisSummary?: AudioAnalysisSummary;
  lastGeneratedDate?: number;
}

export interface ProjectMetadata {
  title: string;
  artist: string;
  album: string;
}

export type AILyricDesignStyle =
  | 'AI_AUTO'
  | 'DYNAMIC_POP'
  | 'CINEMATIC_FLOAT'
  | 'SCATTERED_WORDS'
  | 'BIG_SMALL'
  | 'BEAT_POP'
  | 'KINETIC_TYPOGRAPHY'
  | 'WORD_REVEAL'
  | 'HANDWRITTEN'
  | 'MODERN_MINIMAL'
  | 'CINEMATIC_CHAOS'
  | 'AI_MIX';

export type MusicVisualizerType =
  | 'AUDIO_EQUALIZER'
  | 'CIRCULAR_EQUALIZER'
  | 'WAVEFORM'
  | 'AUDIO_RINGS'
  | 'PARTICLE_PULSE'
  | 'GLOW_PULSE'
  | 'BASS_PULSE'
  | 'EDGE_VISUALIZER'
  | 'WAVE_LINES'
  | 'MINIMAL_DOT_VISUALIZER';

export type ColorPalettePreset =
  | 'WHITE_GOLD'
  | 'WHITE_YELLOW'
  | 'WHITE_RED'
  | 'WHITE_CYAN'
  | 'WHITE_PINK'
  | 'WARM_CINEMATIC'
  | 'COOL_CINEMATIC'
  | 'NEON_PASTEL'
  | 'MONOCHROME';

export interface FontItem {
  id: string;
  name: string;
  family: string;
  category: 'unicode' | 'decorative' | 'handwritten' | 'cinematic' | 'bold' | 'modern';
  isCustom?: boolean;
  dataUrl?: string;
}

export type WordSizeTier = 'small' | 'medium' | 'large' | 'very_large';

export type WordAnimation =
  | 'scale_pop'
  | 'slide_left'
  | 'slide_right'
  | 'fade_zoom'
  | 'rise_bottom'
  | 'blur_reveal'
  | 'beat_impact'
  | 'kinetic_drift'
  | 'float'
  | 'letter_reveal'
  | 'mask_reveal'
  | 'wipe';

export interface WordVisualDesign {
  wordId: string;
  word: string;
  sizeTier: WordSizeTier;
  fontSize: number;
  colorRole: 'primary' | 'accent' | 'secondary';
  color: string;
  fontFamily: string;
  animation: WordAnimation;
  rotationDeg: number;
  effect: 'none' | 'glow' | 'shadow' | 'stroke' | 'soft_neon' | 'gradient';
  offsetX: number;
  offsetY: number;
}

export type LineLayoutType =
  | 'centered'
  | 'scattered'
  | 'staggered_diagonal'
  | 'upper_emphasis'
  | 'lower_floating'
  | 'stacked_contrast';

export interface LineVisualDesign {
  lineId: string;
  layoutType: LineLayoutType;
  verticalPositionPercent: number; // 15% to 85%
  horizontalPositionPercent: number; // 15% to 85%
  entranceAnimation: 'fade' | 'slide_up' | 'scale_pop' | 'blur_in' | 'rise_up' | 'zoom_in';
  exitAnimation: 'fade_out' | 'slide_down' | 'zoom_out' | 'blur_out';
  words: WordVisualDesign[];
}

export interface CinematicBackgroundMotion {
  type: 'SLOW_ZOOM_IN' | 'SLOW_ZOOM_OUT' | 'PAN_HORIZONTAL' | 'PAN_VERTICAL' | 'PARALLAX' | 'BEAT_SCALE_PULSE';
  intensity: number; // 0.5 to 1.5
  beatPulseScale: number; // e.g. 1.02
}

export interface AILyricDesignerConfig {
  activeStyle: AILyricDesignStyle;
  activeVisualizer: MusicVisualizerType;
  visualizerPosition: 'bottom' | 'top' | 'edges' | 'behind_lyrics' | 'center';
  colorPalette: ColorPalettePreset;
  primaryColor: string;
  accentColor: string;
  secondaryColor: string;
  glowColor: string;
  shadowColor: string;
  visualEnergy: number; // 0 to 100
  backgroundMotion: CinematicBackgroundMotion;
  primaryFontFamily: string;
  primaryFontName: string;
  secondaryFontFamily: string;
  secondaryFontName: string;
  decorativeFontFamily: string;
  decorativeFontName: string;
  lines: Record<string, LineVisualDesign>;
  fontLibrary?: FontItem[];
  referenceVideoName?: string;
  referenceAnalysis?: {
    detectedPalette: string;
    detectedRhythm: string;
    detectedTypography: string;
    notes: string;
  };
}

export interface ProjectData {
  id: string;
  title: string;
  artist: string;
  album: string;
  createdDate: number;
  updatedDate: number;
  audioUrl: string | null;
  audioFileName: string;
  audioDurationMs: number;
  lyrics: LyricLine[];
  textStyle: TextStyleConfig;
  animationStyle: AnimationStyle;
  background: BackgroundConfig;
  exportResolution: '720p' | '1080p';
  animationMode?: AnimationMode;
  autoAnimationConfig?: AutoAnimationConfig;
  aiDesignerConfig?: AILyricDesignerConfig;
}

export const BUILTIN_TAMIL_FONTS: FontItem[] = [
  { id: 'mukta', name: 'Mukta Malar (Clean Tamil)', family: "'Mukta Malar', sans-serif", category: 'unicode' },
  { id: 'arima', name: 'Arima Madurai (Calligraphic)', family: "'Arima Madurai', cursive", category: 'decorative' },
  { id: 'catamaran', name: 'Catamaran (Modern Tamil)', family: "'Catamaran', sans-serif", category: 'modern' },
  { id: 'kavivanar', name: 'Kavivanar (Tamil Handwritten)', family: "'Kavivanar', cursive", category: 'handwritten' },
  { id: 'coiny', name: 'Coiny (Bold Display Pop)', family: "'Coiny', cursive", category: 'bold' },
  { id: 'outfit', name: 'Outfit (Sleek Display)', family: "'Outfit', sans-serif", category: 'cinematic' },
  { id: 'playfair', name: 'Playfair Display (Serif)', family: "'Playfair Display', serif", category: 'cinematic' },
];

export const COLOR_PALETTE_PRESETS: Record<ColorPalettePreset, { name: string; primary: string; accent: string; secondary: string; glow: string; shadow: string }> = {
  WHITE_GOLD: { name: 'White & Royal Gold', primary: '#FFFFFF', accent: '#F59E0B', secondary: '#FDE68A', glow: '#D97706', shadow: '#000000' },
  WHITE_YELLOW: { name: 'White & Electric Yellow', primary: '#FFFFFF', accent: '#FACC15', secondary: '#FEF08A', glow: '#EAB308', shadow: '#000000' },
  WHITE_RED: { name: 'White & Crimson Red', primary: '#FFFFFF', accent: '#EF4444', secondary: '#FCA5A5', glow: '#DC2626', shadow: '#000000' },
  WHITE_CYAN: { name: 'White & Electric Cyan', primary: '#FFFFFF', accent: '#06B6D4', secondary: '#A5F3FC', glow: '#0891B2', shadow: '#000000' },
  WHITE_PINK: { name: 'White & Lotus Pink', primary: '#FFFFFF', accent: '#EC4899', secondary: '#FBCFE8', glow: '#DB2777', shadow: '#000000' },
  WARM_CINEMATIC: { name: 'Warm Cinematic (Cream & Amber)', primary: '#FFFBEB', accent: '#F97316', secondary: '#FDE047', glow: '#EA580C', shadow: '#000000' },
  COOL_CINEMATIC: { name: 'Cool Cinematic (Ice & Violet)', primary: '#F0F9FF', accent: '#8B5CF6', secondary: '#38BDF8', glow: '#7C3AED', shadow: '#000000' },
  NEON_PASTEL: { name: 'Neon Pastel (Mint & Peach)', primary: '#FDF2F8', accent: '#10B981', secondary: '#FB7185', glow: '#059669', shadow: '#000000' },
  MONOCHROME: { name: 'Monochrome Cinema', primary: '#F8FAFC', accent: '#E2E8F0', secondary: '#94A3B8', glow: '#64748B', shadow: '#000000' },
};

export const DEFAULT_AI_DESIGNER_CONFIG: AILyricDesignerConfig = {
  activeStyle: 'AI_AUTO',
  activeVisualizer: 'WAVEFORM',
  visualizerPosition: 'bottom',
  colorPalette: 'WHITE_GOLD',
  primaryColor: '#FFFFFF',
  accentColor: '#F59E0B',
  secondaryColor: '#FDE68A',
  glowColor: '#D97706',
  shadowColor: '#000000',
  visualEnergy: 65,
  backgroundMotion: {
    type: 'SLOW_ZOOM_IN',
    intensity: 1.0,
    beatPulseScale: 1.02,
  },
  primaryFontFamily: "'Mukta Malar', sans-serif",
  primaryFontName: 'Mukta Malar (Clean Tamil)',
  secondaryFontFamily: "'Arima Madurai', cursive",
  secondaryFontName: 'Arima Madurai (Calligraphic)',
  decorativeFontFamily: "'Kavivanar', cursive",
  decorativeFontName: 'Kavivanar (Tamil Handwritten)',
  lines: {},
  fontLibrary: BUILTIN_TAMIL_FONTS,
};

export const DEFAULT_TEXT_STYLE: TextStyleConfig = {
  fontFamily: 'sans-serif',
  fontName: 'Default Sans',
  fontSize: 28,
  fontWeight: 700,
  isItalic: false,
  letterSpacing: 0.5,
  lineSpacing: 1.35,
  textColor: '#FFFFFF',
  highlightColor: '#F59E0B',
  hasShadow: true,
  shadowColor: '#000000',
  shadowBlur: 10,
  hasStroke: true,
  strokeColor: '#000000',
  strokeWidth: 2,
  hasGlow: false,
  glowColor: '#8B5CF6',
  alignment: 'center',
  verticalPosition: 'center',
  customYPercent: 50,
};

export const DEFAULT_BACKGROUND: BackgroundConfig = {
  type: 'image',
  color: '#0F172A',
  gradient: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
  mediaUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1080&q=80',
  blur: 0,
  opacity: 1,
  overlayColor: '#000000',
  overlayOpacity: 0.4,
};

export const SAMPLE_LYRICS: LyricLine[] = [
  {
    id: '1',
    text: 'கண்ணே கலைமானே கன்னி மயிலென',
    startTimeMs: 1500,
    endTimeMs: 5800,
    words: [
      { id: '1-1', word: 'கண்ணே', startTimeMs: 1500, endTimeMs: 2400 },
      { id: '1-2', word: 'கலைமானே', startTimeMs: 2400, endTimeMs: 3800 },
      { id: '1-3', word: 'கன்னி', startTimeMs: 3800, endTimeMs: 4600 },
      { id: '1-4', word: 'மயிலென', startTimeMs: 4600, endTimeMs: 5800 },
    ],
  },
  {
    id: '2',
    text: 'கண்டேன் உனை நானே',
    startTimeMs: 6200,
    endTimeMs: 10500,
    words: [
      { id: '2-1', word: 'கண்டேன்', startTimeMs: 6200, endTimeMs: 7600 },
      { id: '2-2', word: 'உனை', startTimeMs: 7600, endTimeMs: 8800 },
      { id: '2-3', word: 'நானே', startTimeMs: 8800, endTimeMs: 10500 },
    ],
  },
  {
    id: '3',
    text: 'அந்தியில் மலர்ந்த ரோஜா மலரே',
    startTimeMs: 11000,
    endTimeMs: 15800,
    words: [
      { id: '3-1', word: 'அந்தியில்', startTimeMs: 11000, endTimeMs: 12200 },
      { id: '3-2', word: 'மலர்ந்த', startTimeMs: 12200, endTimeMs: 13400 },
      { id: '3-3', word: 'ரோஜா', startTimeMs: 13400, endTimeMs: 14500 },
      { id: '3-4', word: 'மலரே', startTimeMs: 14500, endTimeMs: 15800 },
    ],
  },
  {
    id: '4',
    text: 'Sweet melody playing in the calm night',
    startTimeMs: 16200,
    endTimeMs: 21000,
    words: [
      { id: '4-1', word: 'Sweet', startTimeMs: 16200, endTimeMs: 16900 },
      { id: '4-2', word: 'melody', startTimeMs: 16900, endTimeMs: 17800 },
      { id: '4-3', word: 'playing', startTimeMs: 17800, endTimeMs: 18700 },
      { id: '4-4', word: 'in', startTimeMs: 18700, endTimeMs: 19100 },
      { id: '4-5', word: 'the', startTimeMs: 19100, endTimeMs: 19500 },
      { id: '4-6', word: 'calm', startTimeMs: 19500, endTimeMs: 20100 },
      { id: '4-7', word: 'night', startTimeMs: 20100, endTimeMs: 21000 },
    ],
  },
  {
    id: '5',
    text: 'Loving memories glowing so bright',
    startTimeMs: 21500,
    endTimeMs: 26000,
    words: [
      { id: '5-1', word: 'Loving', startTimeMs: 21500, endTimeMs: 22300 },
      { id: '5-2', word: 'memories', startTimeMs: 22300, endTimeMs: 23400 },
      { id: '5-3', word: 'glowing', startTimeMs: 23400, endTimeMs: 24500 },
      { id: '5-4', word: 'so', startTimeMs: 24500, endTimeMs: 25100 },
      { id: '5-5', word: 'bright', startTimeMs: 25100, endTimeMs: 26000 },
    ],
  },
  {
    id: '6',
    text: 'உன் நினைவுகள் நெஞ்சில் வாழும் என்றும்',
    startTimeMs: 26500,
    endTimeMs: 31500,
    words: [
      { id: '6-1', word: 'உன்', startTimeMs: 26500, endTimeMs: 27200 },
      { id: '6-2', word: 'நினைவுகள்', startTimeMs: 27200, endTimeMs: 28500 },
      { id: '6-3', word: 'நெஞ்சில்', startTimeMs: 28500, endTimeMs: 29800 },
      { id: '6-4', word: 'வாழும்', startTimeMs: 29800, endTimeMs: 30700 },
      { id: '6-5', word: 'என்றும்', startTimeMs: 30700, endTimeMs: 31500 },
    ],
  },
];

export function createNewProject(title = 'Untitled Lyric Video'): ProjectData {
  return {
    id: 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    title,
    artist: 'Tamil / English Artist',
    album: 'Single',
    createdDate: Date.now(),
    updatedDate: Date.now(),
    audioUrl: null,
    audioFileName: 'Melodic Demo Track',
    audioDurationMs: 32000,
    lyrics: SAMPLE_LYRICS,
    textStyle: { ...DEFAULT_TEXT_STYLE },
    animationStyle: 'KARAOKE',
    background: { ...DEFAULT_BACKGROUND },
    exportResolution: '1080p',
    aiDesignerConfig: { ...DEFAULT_AI_DESIGNER_CONFIG },
  };
}
