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

export interface BackgroundConfig {
  type: 'color' | 'gradient' | 'image' | 'video';
  color: string;
  gradient: string;
  mediaUrl: string | null;
  blur: number;
  opacity: number;
  overlayColor: string;
  overlayOpacity: number;
}

export interface ProjectMetadata {
  title: string;
  artist: string;
  album: string;
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
}

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
  };
}
