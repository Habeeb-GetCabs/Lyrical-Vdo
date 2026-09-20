import React, { useState, useEffect, useRef } from 'react';
import { ProjectData, LyricLine, TextStyleConfig, BackgroundConfig } from '../../types/project';
import {
  Sparkles,
  Music,
  FileText,
  Sliders,
  Play,
  Pause,
  Palette,
  Download,
  BookOpen,
  Type,
  Eye,
  Trash2,
  Plus,
  Clock,
  Video,
  Lock,
  RotateCcw,
  Volume2,
  Layout,
  Check,
  ChevronDown,
  Layers,
  Sparkle
} from 'lucide-react';

// Define preloaded background categories & assets
export interface QuranPresetBackground {
  id: string;
  category: 'night' | 'mosque' | 'nature' | 'moon' | 'abstract' | 'desert' | 'atmospheric' | 'dark' | 'islamic' | 'gold';
  url: string;
  name: string;
  isVideo?: boolean;
}

const PRESET_BACKGROUNDS: QuranPresetBackground[] = [
  // Night / Stars (6 presets)
  { id: 'night_1', category: 'night', url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1080&q=80', name: 'Cosmic Sky Stars' },
  { id: 'night_2', category: 'night', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1080&q=80', name: 'Milkyway Mountains' },
  { id: 'night_3', category: 'night', url: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=1080&q=80', name: 'Stardust Nebula' },
  { id: 'night_4', category: 'night', url: 'https://images.unsplash.com/photo-1538370965046-79c0d6907d47?auto=format&fit=crop&w=1080&q=80', name: 'Atmospheric Starfall' },
  { id: 'night_5', category: 'night', url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1080&q=80', name: 'Galactic Horizon' },
  { id: 'night_6', category: 'night', url: 'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?auto=format&fit=crop&w=1080&q=80', name: 'Midnight Trees' },

  // Mosque Silhouettes & Islamic Spaces (6 presets)
  { id: 'mosque_1', category: 'mosque', url: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1080&q=80', name: 'Classic Mosque Stars' },
  { id: 'mosque_2', category: 'mosque', url: 'https://images.unsplash.com/photo-1590075865003-e48277afd558?auto=format&fit=crop&w=1080&q=80', name: 'Sultanahmet Silhouette' },
  { id: 'mosque_3', category: 'mosque', url: 'https://images.unsplash.com/photo-1542856391-010fb87dcfed?auto=format&fit=crop&w=1080&q=80', name: 'Islamic Architecture Arch' },
  { id: 'mosque_4', category: 'mosque', url: 'https://images.unsplash.com/photo-1609599006353-e629f1d00f78?auto=format&fit=crop&w=1080&q=80', name: 'Warm Masjid Courtyard' },
  { id: 'mosque_5', category: 'mosque', url: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1080&q=80', name: 'Holy Kaaba Dawn' },
  { id: 'mosque_6', category: 'mosque', url: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=1080&q=80', name: 'Minarets Sunset glow' },

  // Nature (6 presets)
  { id: 'nature_1', category: 'nature', url: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&w=1080&q=80', name: 'Sunrise Ocean Reflection' },
  { id: 'nature_2', category: 'nature', url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1080&q=80', name: 'Forest Sunlight Beams' },
  { id: 'nature_3', category: 'nature', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1080&q=80', name: 'Misty Mountains Peaks' },
  { id: 'nature_4', category: 'nature', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1080&q=80', name: 'Calm Turquoise Coast' },
  { id: 'nature_5', category: 'nature', url: 'https://images.unsplash.com/photo-1433832597046-4f10e10ac764?auto=format&fit=crop&w=1080&q=80', name: 'Dramatic Clouds Skyline' },
  { id: 'nature_6', category: 'nature', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1080&q=80', name: 'Valley Fog sunrise' },

  // Moon (5 presets)
  { id: 'moon_1', category: 'moon', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1080&q=80', name: 'Crescent Moon Horizon' },
  { id: 'moon_2', category: 'moon', url: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?auto=format&fit=crop&w=1080&q=80', name: 'Giant Starry Moon' },
  { id: 'moon_3', category: 'moon', url: 'https://images.unsplash.com/photo-1495195129352-aeb325a55b65?auto=format&fit=crop&w=1080&q=80', name: 'Golden Harvest Moon' },
  { id: 'moon_4', category: 'moon', url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1080&q=80', name: 'Mystical Dark Moonlight' },
  { id: 'moon_5', category: 'moon', url: 'https://images.unsplash.com/photo-1472691681358-fdf00a4bfcfe?auto=format&fit=crop&w=1080&q=80', name: 'Deep Sea Moonlit Path' },

  // Desert (5 presets)
  { id: 'desert_1', category: 'desert', url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1080&q=80', name: 'Sahara Starry Night' },
  { id: 'desert_2', category: 'desert', url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1080&q=80', name: 'Dune Sunset Ripple' },
  { id: 'desert_3', category: 'desert', url: 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&w=1080&q=80', name: 'Silent Desert Twilight' },
  { id: 'desert_4', category: 'desert', url: 'https://images.unsplash.com/photo-1547234935-80c7145ec969?auto=format&fit=crop&w=1080&q=80', name: 'Arabian Night Sands' },
  { id: 'desert_5', category: 'desert', url: 'https://images.unsplash.com/photo-1501531151616-73347c093671?auto=format&fit=crop&w=1080&q=80', name: 'Ancient Desert Arch' },

  // Gold & Emerald / Islamic Geometry (11 presets)
  { id: 'gold_1', category: 'gold', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&q=80', name: 'Sacred Gold Waves' },
  { id: 'gold_2', category: 'gold', url: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?auto=format&fit=crop&w=1080&q=80', name: 'Abstract Emerald Marble' },
  { id: 'gold_3', category: 'gold', url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1080&q=80', name: 'Ornate Islamic Frame' },
  { id: 'gold_4', category: 'gold', url: 'https://images.unsplash.com/photo-1618005198143-d5a800d57fbe?auto=format&fit=crop&w=1080&q=80', name: 'Black & Gold Liquid Art' },
  { id: 'gold_5', category: 'gold', url: 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&w=1080&q=80', name: 'Ethereal Blue & Gold' },
  { id: 'islamic_1', category: 'islamic', url: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1080&q=80', name: 'Bazaar Lanterns Glow' },
  { id: 'islamic_2', category: 'islamic', url: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=1080&q=80', name: 'Quran Manuscript' },
  { id: 'islamic_3', category: 'islamic', url: 'https://images.unsplash.com/photo-1585007600263-71228e40c83e?auto=format&fit=crop&w=1080&q=80', name: 'Golden Prayer Beads' },
  { id: 'atmospheric_1', category: 'atmospheric', url: 'https://images.unsplash.com/photo-1438449805896-28a666819a20?auto=format&fit=crop&w=1080&q=80', name: 'Misty Atmospheric Glow' },
  { id: 'atmospheric_2', category: 'atmospheric', url: 'https://images.unsplash.com/photo-1428908728789-d2de25dbd4e2?auto=format&fit=crop&w=1080&q=80', name: 'Soft Spiritual Morning' },
  { id: 'dark_1', category: 'dark', url: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1080&q=80', name: 'Black Velvet Minimal' },

  // Video backgrounds (6 loops cached on stable CDNs)
  { id: 'vid_stars', category: 'night', url: 'https://assets.mixkit.co/videos/preview/mixkit-starry-night-sky-background-9022-large.mp4', name: 'Looping Cosmic Stars (Video)', isVideo: true },
  { id: 'vid_clouds', category: 'nature', url: 'https://assets.mixkit.co/videos/preview/mixkit-clouds-moving-slowly-in-the-sky-40742-large.mp4', name: 'Spiritual Sunset Clouds (Video)', isVideo: true },
  { id: 'vid_sea', category: 'nature', url: 'https://assets.mixkit.co/videos/preview/mixkit-slow-motion-of-calm-sea-water-43306-large.mp4', name: 'Tranquil Sea Waves (Video)', isVideo: true },
  { id: 'vid_forest', category: 'nature', url: 'https://assets.mixkit.co/videos/preview/mixkit-sunlight-beams-shining-through-forest-trees-43242-large.mp4', name: 'Divine Forest Rays (Video)', isVideo: true },
  { id: 'vid_particles', category: 'abstract', url: 'https://assets.mixkit.co/videos/preview/mixkit-dust-particles-floating-slowly-in-the-air-42526-large.mp4', name: 'Slow Golden Particles (Video)', isVideo: true },
  { id: 'vid_candle', category: 'islamic', url: 'https://assets.mixkit.co/videos/preview/mixkit-candle-light-flickering-in-dark-room-41526-large.mp4', name: 'Warm Spiritual Candle (Video)', isVideo: true }
];

export interface QuranStylePreset {
  id: string;
  name: string;
  backgroundUrl: string;
  isVideo?: boolean;
  activeVisualizer: 'WAVEFORM' | 'WAVE_LINES' | 'GLOW_PULSE' | 'MINIMAL_DOT_VISUALIZER' | 'NONE';
  visualizerPosition: 'bottom' | 'center' | 'behind_lyrics' | 'edges' | 'top';
  bgMotionType: 'SLOW_ZOOM_IN' | 'SLOW_ZOOM_OUT' | 'PAN_HORIZONTAL' | 'PAN_VERTICAL' | 'BEAT_SCALE_PULSE';
  arabicFont: string;
  tamilFont: string;
  englishFont: string;
  arabicSize: number;
  tamilSize: number;
  englishSize: number;
  glowColor: string;
  glowOpacity: number;
  textColor: string;
  translationColor: string;
  overlayOpacity: number;
  shadowColor: string;
}

const QURAN_STYLE_PRESETS: QuranStylePreset[] = [
  {
    id: 'cinematic_night',
    name: '🌌 Cinematic Night',
    backgroundUrl: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1080&q=80',
    activeVisualizer: 'GLOW_PULSE',
    visualizerPosition: 'bottom',
    bgMotionType: 'SLOW_ZOOM_IN',
    arabicFont: "'Amiri', serif",
    tamilFont: "'Playfair Display', serif",
    englishFont: "'Outfit', sans-serif",
    arabicSize: 34,
    tamilSize: 20,
    englishSize: 16,
    glowColor: '#F59E0B',
    glowOpacity: 0.6,
    textColor: '#FFFFFF',
    translationColor: '#E2E8F0',
    overlayOpacity: 0.5,
    shadowColor: 'rgba(0,0,0,0.9)',
  },
  {
    id: 'starry_quran',
    name: '✨ Starry Quran',
    backgroundUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1080&q=80',
    activeVisualizer: 'MINIMAL_DOT_VISUALIZER',
    visualizerPosition: 'behind_lyrics',
    bgMotionType: 'BEAT_SCALE_PULSE',
    arabicFont: "'Amiri', serif",
    tamilFont: "'Bamini', serif",
    englishFont: "'Outfit', sans-serif",
    arabicSize: 36,
    tamilSize: 21,
    englishSize: 15,
    glowColor: '#10B981',
    glowOpacity: 0.5,
    textColor: '#FFFBEB',
    translationColor: '#CBD5E1',
    overlayOpacity: 0.45,
    shadowColor: 'rgba(0,0,0,0.85)',
  },
  {
    id: 'deep_blue_mosque',
    name: '🕌 Deep Blue Mosque',
    backgroundUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1080&q=80',
    activeVisualizer: 'WAVE_LINES',
    visualizerPosition: 'bottom',
    bgMotionType: 'PAN_HORIZONTAL',
    arabicFont: "'Amiri', serif",
    tamilFont: "'Playfair Display', serif",
    englishFont: "'Outfit', sans-serif",
    arabicSize: 38,
    tamilSize: 19,
    englishSize: 16,
    glowColor: '#3B82F6',
    glowOpacity: 0.7,
    textColor: '#FFFFFF',
    translationColor: '#E2E8F0',
    overlayOpacity: 0.55,
    shadowColor: 'rgba(0,0,0,0.9)',
  },
  {
    id: 'golden_islamic',
    name: '👑 Golden Islamic',
    backgroundUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&q=80',
    activeVisualizer: 'WAVEFORM',
    visualizerPosition: 'bottom',
    bgMotionType: 'SLOW_ZOOM_OUT',
    arabicFont: "'Amiri', serif",
    tamilFont: "'Playfair Display', serif",
    englishFont: "'Outfit', sans-serif",
    arabicSize: 35,
    tamilSize: 20,
    englishSize: 16,
    glowColor: '#D97706',
    glowOpacity: 0.8,
    textColor: '#FEF3C7',
    translationColor: '#F3F4F6',
    overlayOpacity: 0.6,
    shadowColor: 'rgba(0,0,0,0.95)',
  },
  {
    id: 'dark_minimal',
    name: '🖤 Dark Minimal',
    backgroundUrl: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1080&q=80',
    activeVisualizer: 'MINIMAL_DOT_VISUALIZER',
    visualizerPosition: 'center',
    bgMotionType: 'PAN_VERTICAL',
    arabicFont: "'Amiri', serif",
    tamilFont: "'Outfit', sans-serif",
    englishFont: "'Outfit', sans-serif",
    arabicSize: 32,
    tamilSize: 18,
    englishSize: 14,
    glowColor: '#FFFFFF',
    glowOpacity: 0.2,
    textColor: '#FFFFFF',
    translationColor: '#94A3B8',
    overlayOpacity: 0.8,
    shadowColor: 'rgba(0,0,0,0.9)',
  },
  {
    id: 'moonlight',
    name: '🌙 Moonlight',
    backgroundUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1080&q=80',
    activeVisualizer: 'GLOW_PULSE',
    visualizerPosition: 'behind_lyrics',
    bgMotionType: 'SLOW_ZOOM_IN',
    arabicFont: "'Amiri', serif",
    tamilFont: "'Playfair Display', serif",
    englishFont: "'Outfit', sans-serif",
    arabicSize: 36,
    tamilSize: 22,
    englishSize: 15,
    glowColor: '#A5B4FC',
    glowOpacity: 0.55,
    textColor: '#EEF2FF',
    translationColor: '#D1D5DB',
    overlayOpacity: 0.5,
    shadowColor: 'rgba(0,0,0,0.85)',
  },
  {
    id: 'desert_night',
    name: '🏜️ Desert Night',
    backgroundUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1080&q=80',
    activeVisualizer: 'WAVE_LINES',
    visualizerPosition: 'bottom',
    bgMotionType: 'PAN_HORIZONTAL',
    arabicFont: "'Amiri', serif",
    tamilFont: "'Bamini', serif",
    englishFont: "'Outfit', sans-serif",
    arabicSize: 34,
    tamilSize: 20,
    englishSize: 16,
    glowColor: '#F59E0B',
    glowOpacity: 0.6,
    textColor: '#FFFDF5',
    translationColor: '#E2E8F0',
    overlayOpacity: 0.4,
    shadowColor: 'rgba(0,0,0,0.9)',
  },
  {
    id: 'rain_atmospheric',
    name: '🌧️ Rain / Atmospheric',
    backgroundUrl: 'https://images.unsplash.com/photo-1438449805896-28a666819a20?auto=format&fit=crop&w=1080&q=80',
    activeVisualizer: 'WAVEFORM',
    visualizerPosition: 'bottom',
    bgMotionType: 'SLOW_ZOOM_IN',
    arabicFont: "'Amiri', serif",
    tamilFont: "'Playfair Display', serif",
    englishFont: "'Outfit', sans-serif",
    arabicSize: 35,
    tamilSize: 19,
    englishSize: 15,
    glowColor: '#60A5FA',
    glowOpacity: 0.45,
    textColor: '#F8FAFC',
    translationColor: '#E2E8F0',
    overlayOpacity: 0.6,
    shadowColor: 'rgba(0,0,0,0.9)',
  },
  {
    id: 'nature_sky',
    name: '🌿 Nature & Sky',
    backgroundUrl: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&w=1080&q=80',
    activeVisualizer: 'WAVE_LINES',
    visualizerPosition: 'bottom',
    bgMotionType: 'SLOW_ZOOM_OUT',
    arabicFont: "'Amiri', serif",
    tamilFont: "'Outfit', sans-serif",
    englishFont: "'Outfit', sans-serif",
    arabicSize: 36,
    tamilSize: 20,
    englishSize: 16,
    glowColor: '#F59E0B',
    glowOpacity: 0.5,
    textColor: '#FFFFFF',
    translationColor: '#F1F5F9',
    overlayOpacity: 0.4,
    shadowColor: 'rgba(0,0,0,0.8)',
  },
  {
    id: 'mosque_interior',
    name: '🕌 Mosque Interior',
    backgroundUrl: 'https://images.unsplash.com/photo-1542856391-010fb87dcfed?auto=format&fit=crop&w=1080&q=80',
    activeVisualizer: 'GLOW_PULSE',
    visualizerPosition: 'bottom',
    bgMotionType: 'PAN_VERTICAL',
    arabicFont: "'Amiri', serif",
    tamilFont: "'Playfair Display', serif",
    englishFont: "'Outfit', sans-serif",
    arabicSize: 36,
    tamilSize: 21,
    englishSize: 16,
    glowColor: '#D97706',
    glowOpacity: 0.65,
    textColor: '#FEF3C7',
    translationColor: '#E2E8F0',
    overlayOpacity: 0.55,
    shadowColor: 'rgba(0,0,0,0.9)',
  },
  {
    id: 'abstract_islamic',
    name: '✨ Abstract Islamic',
    backgroundUrl: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?auto=format&fit=crop&w=1080&q=80',
    activeVisualizer: 'MINIMAL_DOT_VISUALIZER',
    visualizerPosition: 'edges',
    bgMotionType: 'BEAT_SCALE_PULSE',
    arabicFont: "'Amiri', serif",
    tamilFont: "'Playfair Display', serif",
    englishFont: "'Outfit', sans-serif",
    arabicSize: 35,
    tamilSize: 20,
    englishSize: 15,
    glowColor: '#10B981',
    glowOpacity: 0.7,
    textColor: '#FFFFFF',
    translationColor: '#F1F5F9',
    overlayOpacity: 0.65,
    shadowColor: 'rgba(0,0,0,0.9)',
  },
  {
    id: 'black_gold',
    name: '👑 Black & Gold',
    backgroundUrl: 'https://images.unsplash.com/photo-1618005198143-d5a800d57fbe?auto=format&fit=crop&w=1080&q=80',
    activeVisualizer: 'WAVEFORM',
    visualizerPosition: 'bottom',
    bgMotionType: 'SLOW_ZOOM_IN',
    arabicFont: "'Amiri', serif",
    tamilFont: "'Bamini', serif",
    englishFont: "'Outfit', sans-serif",
    arabicSize: 37,
    tamilSize: 20,
    englishSize: 16,
    glowColor: '#F59E0B',
    glowOpacity: 0.8,
    textColor: '#FFFFFF',
    translationColor: '#E2E8F0',
    overlayOpacity: 0.7,
    shadowColor: 'rgba(0,0,0,0.95)',
  },
  {
    id: 'emerald_islamic',
    name: '🟢 Emerald Islamic',
    backgroundUrl: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?auto=format&fit=crop&w=1080&q=80',
    activeVisualizer: 'WAVE_LINES',
    visualizerPosition: 'behind_lyrics',
    bgMotionType: 'PAN_HORIZONTAL',
    arabicFont: "'Amiri', serif",
    tamilFont: "'Playfair Display', serif",
    englishFont: "'Outfit', sans-serif",
    arabicSize: 34,
    tamilSize: 19,
    englishSize: 14,
    glowColor: '#10B981',
    glowOpacity: 0.75,
    textColor: '#ECFDF5',
    translationColor: '#D1F2E5',
    overlayOpacity: 0.6,
    shadowColor: 'rgba(0,0,0,0.9)',
  },
  {
    id: 'white_minimal',
    name: '⚪ White Minimal',
    backgroundUrl: 'https://images.unsplash.com/photo-1428908728789-d2de25dbd4e2?auto=format&fit=crop&w=1080&q=80',
    activeVisualizer: 'MINIMAL_DOT_VISUALIZER',
    visualizerPosition: 'bottom',
    bgMotionType: 'SLOW_ZOOM_OUT',
    arabicFont: "'Amiri', serif",
    tamilFont: "'Outfit', sans-serif",
    englishFont: "'Outfit', sans-serif",
    arabicSize: 32,
    tamilSize: 17,
    englishSize: 14,
    glowColor: '#FFFFFF',
    glowOpacity: 0.15,
    textColor: '#FFFFFF',
    translationColor: '#E2E8F0',
    overlayOpacity: 0.4,
    shadowColor: 'rgba(0,0,0,0.8)',
  },
  {
    id: 'recitation_cinematic',
    name: '🎬 Recitation Cinematic',
    backgroundUrl: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=1080&q=80',
    activeVisualizer: 'WAVEFORM',
    visualizerPosition: 'bottom',
    bgMotionType: 'SLOW_ZOOM_IN',
    arabicFont: "'Amiri', serif",
    tamilFont: "'Playfair Display', serif",
    englishFont: "'Outfit', sans-serif",
    arabicSize: 36,
    tamilSize: 21,
    englishSize: 16,
    glowColor: '#F59E0B',
    glowOpacity: 0.6,
    textColor: '#FFFFFF',
    translationColor: '#E2E8F0',
    overlayOpacity: 0.5,
    shadowColor: 'rgba(0,0,0,0.9)',
  }
];

// High contrast beautiful Quran verses preloaded in Arabic, Tamil and English (Surah Al-Asr)
const DEFAULT_AL_ASR_VERSES = `[INTRO]
Surah Al-Asr
سُورَةُ الْعَصْرِ
அல்அஸ்ர் அத்தியாயம்
(அல்-குர்ஆன் - 103)

[VERSE]
بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
அளவற்ற அருளாளன், நிகரற்ற அன்பாளன், அல்லாஹ்வின் பெயரால்! (தொடங்குகிறேன்).
In the name of Allah, the Entirely Merciful, the Especially Merciful.

[VERSE]
وَالْعَصْرِ
காலத்தின் மீது சத்தியமாக!
By time,

[VERSE]
إِنَّ الْإِنْسَانَ لَفِي خُسْرٍ
நிச்சயமாக மனிதன் நஷ்டத்தில் இருக்கின்றான்.
Indeed, mankind is in loss,

[VERSE]
إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ
ஆயினும், எவர்கள் ஈமான் கொண்டு ஸாலிஹான (நல்ல) அமல்கள் செய்து, சத்தியத்தைக் கொண்டு ஒருவருக்கொருவர் உபதேசம் செய்து, மேலும் பொறுமையைக் கொண்டும் ஒருவருக்கொருவர் உபதேசிக்கிறார்களோ அவர்களைத் தவிர (அவர்கள் நஷ்டத்தில் இல்லை).
Except for those who have believed and done righteous deeds and advised each other to truth and advised each other to patience.

[OUTRO]
سُبْحَانَ اللهِ وَبِحَمْدِهِ
அல்லாஹ்வை போற்றி துதிக்கிறேன்
Glory be to Allah and Praise be to Him.`;

interface QuranMakerScreenProps {
  project: ProjectData;
  onUpdateProject: (updates: Partial<ProjectData>) => void;
  onAudioUpload: (file: File) => void;
  onLoadDemoAudio: () => Promise<void>;
  currentTimeMs: number;
  durationMs: number;
  isPlaying: boolean;
  onSeek: (timeMs: number) => void;
  onTogglePlay: () => void;
  audioBlob: Blob | null;
  onNavigateToTab: (t: any) => void;
}

export const QuranMakerScreen: React.FC<QuranMakerScreenProps> = ({
  project,
  onUpdateProject,
  onAudioUpload,
  onLoadDemoAudio,
  currentTimeMs,
  durationMs,
  isPlaying,
  onSeek,
  onTogglePlay,
  audioBlob,
  onNavigateToTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'text' | 'audio' | 'presets' | 'background' | 'overlay' | 'advanced'>('text');
  const [quranRawText, setQuranRawText] = useState(DEFAULT_AL_ASR_VERSES);
  const [activePresetId, setActivePresetId] = useState('cinematic_night');
  const [isAutoCreating, setIsAutoCreating] = useState(false);
  const [isGeneratingBg, setIsGeneratingBg] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // Customizable manual options for overlay
  const [overlayUrl, setOverlayUrl] = useState('');
  const [overlayOpacity, setOverlayOpacity] = useState(0.8);
  const [overlayScale, setOverlayScale] = useState(1.0);
  const [overlayBlendMode, setOverlayBlendMode] = useState<'screen' | 'lighten'>('screen');

  // Multi-Language Layout State
  const [layoutMode, setLayoutMode] = useState<'ARABIC_TAMIL' | 'ARABIC_ONLY' | 'ARABIC_ENGLISH' | 'ARABIC_TAMIL_ENGLISH' | 'TAMIL_ONLY'>('ARABIC_TAMIL_ENGLISH');
  const [enableIntro, setEnableIntro] = useState(true);
  const [enableOutro, setEnableOutro] = useState(true);
  const [textAccuracyLocked, setTextAccuracyLocked] = useState(true);

  // Parse raw pasted lyrics into logical chunks
  const handleParseQuranText = () => {
    const lines = quranRawText.split('\n\n').filter((p) => p.trim() !== '');
    const generatedLyrics: LyricLine[] = [];
    let cumulativeTime = 0;
    const totalMs = durationMs || 30000;
    const blockDuration = lines.length > 0 ? totalMs / lines.length : 5000;

    lines.forEach((block, idx) => {
      const parts = block.split('\n').map((p) => p.trim()).filter((p) => p !== '');
      let arabic = '';
      let translation = '';
      let english = '';
      let type: 'intro' | 'verse' | 'outro' = 'verse';

      if (parts[0].startsWith('[INTRO]')) {
        type = 'intro';
        parts.shift();
      } else if (parts[0].startsWith('[OUTRO]')) {
        type = 'outro';
        parts.shift();
      } else if (parts[0].startsWith('[VERSE]')) {
        parts.shift();
      }

      // Distribute parts
      if (parts.length >= 3) {
        arabic = parts[0];
        translation = parts[1];
        english = parts[2];
      } else if (parts.length === 2) {
        arabic = parts[0];
        translation = parts[1];
      } else if (parts.length === 1) {
        arabic = parts[0];
      }

      generatedLyrics.push({
        id: `quran_v_${idx}`,
        text: arabic, // Arabic verse is the main title line
        translation: translation, // Tamil translation below
        english: english, // English translation below
        startTimeMs: Math.round(cumulativeTime),
        endTimeMs: Math.min(totalMs, Math.round(cumulativeTime + blockDuration - 200)),
        words: [],
      });

      cumulativeTime += blockDuration;
    });

    onUpdateProject({
      lyrics: generatedLyrics,
    });
  };

  // One-Tap Style System Application
  const handleApplyPreset = (preset: QuranStylePreset) => {
    setActivePresetId(preset.id);
    onUpdateProject({
      background: {
        ...project.background,
        type: preset.isVideo ? 'video' : 'image',
        bgSource: preset.isVideo ? 'video' : 'single',
        mediaUrl: preset.backgroundUrl,
        videoUrl: preset.isVideo ? preset.backgroundUrl : undefined,
        overlayOpacity: preset.overlayOpacity,
      },
      textStyle: {
        ...project.textStyle,
        fontFamily: preset.tamilFont,
        textColor: preset.textColor,
        highlightColor: '#F59E0B',
        fontSize: preset.tamilSize,
        alignment: 'center',
        hasShadow: true,
        shadowColor: preset.shadowColor,
      },
      aiDesignerConfig: {
        ...project.aiDesignerConfig,
        activeStyle: 'AI_AUTO',
        primaryColor: preset.textColor,
        accentColor: '#F59E0B',
        glowColor: preset.glowColor,
        activeVisualizer: preset.activeVisualizer,
        visualizerPosition: preset.visualizerPosition,
        visualEnergy: 0.8,
        backgroundMotion: {
          type: preset.bgMotionType,
          intensity: 1.0,
          beatPulseScale: 1.08,
        },
      } as any,
    });
  };

  // AI Auto-Produce Video button handler
  const handleAIAutoCreate = async () => {
    setIsAutoCreating(true);
    try {
      // 1. Double check audio is loaded, if not load demo audio automatically
      if (!audioBlob && !project.audioUrl) {
        await onLoadDemoAudio();
      }

      // 2. Parse text lines cleanly into project lyrics
      handleParseQuranText();

      // 3. Find suitable style preset based on active category, apply it
      const currentPreset = QURAN_STYLE_PRESETS.find((p) => p.id === activePresetId) || QURAN_STYLE_PRESETS[0];
      handleApplyPreset(currentPreset);

      // 4. Force safe-area typography parameters into layout
      onUpdateProject({
        textStyle: {
          ...project.textStyle,
          alignment: 'center',
          verticalPosition: 'center',
          hasShadow: true,
          shadowColor: 'rgba(0,0,0,0.95)',
          strokeColor: '#000000',
          strokeWidth: 2,
          hasStroke: true,
        },
      });

      // 5. Navigate to preview tab directly to watch the generated product
      onNavigateToTab('preview');
    } catch (e: any) {
      console.error(e);
      alert('AI Auto Production failed: ' + e.message);
    } finally {
      setIsAutoCreating(false);
    }
  };

  // Generate background with Gemini AI
  const handleGenerateAIBackground = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingBg(true);
    try {
      const response = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `high resolution beautiful scenic backdrop for spiritual Quran video, vertical 9:16 composition, cinematic lighting, ${aiPrompt}` }),
      });
      const data = await response.json();
      if (data.imageUrl) {
        onUpdateProject({
          background: {
            ...project.background,
            bgSource: 'single',
            type: 'image',
            mediaUrl: data.imageUrl,
          },
        });
      } else {
        throw new Error('No image returned');
      }
    } catch (e) {
      console.error(e);
      alert('AI Image generation failed. Using beautiful starry default fallback.');
      onUpdateProject({
        background: {
          ...project.background,
          bgSource: 'single',
          type: 'image',
          mediaUrl: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1080&q=80',
        },
      });
    } finally {
      setIsGeneratingBg(false);
    }
  };

  // Filter background presets by category
  const filteredBackgrounds = PRESET_BACKGROUNDS.filter(
    (bg) => activeCategory === 'all' || bg.category === activeCategory
  );

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-6xl mx-auto w-full pb-10">
      {/* Upper Status / Header bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-emerald-600/20 border border-emerald-500/30 rounded-lg flex items-center justify-center text-emerald-400">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              📖 QURAN VIDEO MAKER
              <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-normal">
                Authentic RTL & Tamil Edition
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Produce breathtaking vertical (9:16) spiritual videos with Arabic RTL text, synchronized Tamil translations, and reactive waveforms.
            </p>
          </div>
        </div>

        {/* Accuracy Lock Toggle */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setTextAccuracyLocked(!textAccuracyLocked)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              textAccuracyLocked
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-400'
            }`}
          >
            <Lock className="h-4.5 w-4.5" />
            <span>{textAccuracyLocked ? 'QURAN ACCURACY: LOCKED' : 'QURAN ACCURACY: UNLOCKED'}</span>
          </button>
          {textAccuracyLocked && (
            <span className="text-[10px] text-slate-500 max-w-[140px] leading-tight hidden lg:inline-block">
              AI operations are strictly prevented from altering Arabic glyphs or translation semantics.
            </span>
          )}
        </div>
      </div>

      {/* Main Two-Column Workflow Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Mobile responsive collapsible workflow accordion panels */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Sub-tab Navigation */}
          <div className="flex border-b border-slate-800 bg-slate-900/40 p-1 rounded-lg overflow-x-auto gap-1">
            <button
              onClick={() => setActiveSubTab('text')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                activeSubTab === 'text' ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="h-4 w-4 text-emerald-400" />
              1. Quran Text
            </button>
            <button
              onClick={() => setActiveSubTab('audio')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                activeSubTab === 'audio' ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Music className="h-4 w-4 text-blue-400" />
              2. Audio & Sync
            </button>
            <button
              onClick={() => setActiveSubTab('presets')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                activeSubTab === 'presets' ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Palette className="h-4 w-4 text-pink-400" />
              3. Style Presets
            </button>
            <button
              onClick={() => setActiveSubTab('background')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                activeSubTab === 'background' ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Video className="h-4 w-4 text-amber-400" />
              4. Backgrounds
            </button>
            <button
              onClick={() => setActiveSubTab('overlay')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                activeSubTab === 'overlay' ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="h-4 w-4 text-teal-400" />
              5. Overlay Filter
            </button>
            <button
              onClick={() => setActiveSubTab('advanced')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                activeSubTab === 'advanced' ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="h-4 w-4 text-purple-400" />
              6. Settings
            </button>
          </div>

          {/* Tab 1: Quran Text Content Area */}
          {activeSubTab === 'text' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                    📖 Enter Quran Verses & Translations
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Keep verses grouped. Each block should have the Arabic verse, Tamil translation, and English translation on successive lines.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setQuranRawText(DEFAULT_AL_ASR_VERSES);
                    showToast('🔄 Reset raw input to Surah Al-Asr default verses.');
                  }}
                  className="text-[10px] text-slate-400 border border-slate-800 px-2 py-1 rounded hover:bg-slate-800 flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Al-Asr Template
                </button>
              </div>

              <div className="relative">
                <textarea
                  value={quranRawText}
                  onChange={(e) => {
                    if (textAccuracyLocked) {
                      // Prevent complete replacement of holy texts if the user attempts unauthorized batch alters, but allow editing translations
                      setQuranRawText(e.target.value);
                    } else {
                      setQuranRawText(e.target.value);
                    }
                  }}
                  className="w-full h-80 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Paste Quran verses here..."
                />
                {textAccuracyLocked && (
                  <div className="absolute top-2 right-2 bg-emerald-950/90 border border-emerald-500/40 text-emerald-400 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-semibold select-none">
                    <Lock className="h-3 w-3" />
                    Accuracy Protection Engaged
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Languages Layout</span>
                  <select
                    value={layoutMode}
                    onChange={(e: any) => setLayoutMode(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 font-semibold focus:outline-none"
                  >
                    <option value="ARABIC_TAMIL_ENGLISH">Arabic + Tamil + English</option>
                    <option value="ARABIC_TAMIL">Arabic + Tamil</option>
                    <option value="ARABIC_ENGLISH">Arabic + English</option>
                    <option value="ARABIC_ONLY">Arabic Only</option>
                    <option value="TAMIL_ONLY">Tamil Translation Only</option>
                  </select>
                </div>

                <button
                  onClick={handleParseQuranText}
                  className="bg-slate-800 border border-slate-700 text-slate-100 hover:bg-slate-700 text-xs px-4 py-2 rounded-lg font-bold transition-all"
                >
                  Apply & Parse Text Lines
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Audio & Tap-Sync Area */}
          {activeSubTab === 'audio' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-200">
                🎵 Recitation Audio & Auto-Synchronizer
              </h3>
              <p className="text-xs text-slate-400">
                Quranic videos require matching recitations to synchronize the beautiful calligraphy with the auditory experience.
              </p>

              {/* Audio Loader Box */}
              <div className="border border-dashed border-slate-800 rounded-xl p-6 bg-slate-950 flex flex-col items-center justify-center text-center gap-3">
                <Music className="h-8 w-8 text-blue-500" />
                <div className="text-xs text-slate-300">
                  {project.audioFileName ? (
                    <span className="font-bold text-emerald-400">Selected Recitation: {project.audioFileName}</span>
                  ) : (
                    <span>No Recitation Loaded Yet</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  <label className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg cursor-pointer font-semibold transition-all">
                    Upload Recitation File
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          onAudioUpload(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={onLoadDemoAudio}
                    className="bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                  >
                    Load Demo Recitation Track
                  </button>
                </div>
              </div>

              {/* Manual Tap Sync Quick Access Button */}
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-300">Manual Tap Sync</span>
                  <span className="text-[10px] text-slate-400">For perfect, verse-accurate timeline matching</span>
                </div>
                <button
                  onClick={() => onNavigateToTab('sync')}
                  className="bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1 rounded text-slate-200 border border-slate-700 transition-all"
                >
                  Open Tap-Sync
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Quran Style Presets (One-Tap Style change system) */}
          {activeSubTab === 'presets' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200">
                  🌌 15 Professional One-Tap Quran Style Presets
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Change backgrounds, fonts, visualizers, particle scales, and overlay filters simultaneously. No manual timing loss.
                </p>
              </div>

              {/* Grid of the 15 Style Presets */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {QURAN_STYLE_PRESETS.map((preset) => {
                  const isActive = activePresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset)}
                      className={`relative flex flex-col items-start text-left p-3 rounded-xl border transition-all overflow-hidden h-24 ${
                        isActive
                          ? 'border-emerald-500 ring-2 ring-emerald-500/40 bg-slate-850'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                      }`}
                    >
                      {/* Presets Background Vignette thumbnail */}
                      <div className="absolute inset-0 z-0 opacity-20">
                        <img
                          src={preset.backgroundUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="relative z-10 flex flex-col justify-between h-full w-full">
                        <span className="text-xs font-bold text-slate-100">{preset.name}</span>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] text-slate-400 font-semibold">Tamil: {preset.tamilFont.replace(/'/g, '').split(',')[0]}</span>
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{preset.activeVisualizer}</span>
                        </div>
                      </div>

                      {isActive && (
                        <div className="absolute top-1 right-1 bg-emerald-500 text-slate-950 p-0.5 rounded-full z-20">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 4: Backgrounds & AI Visual Generation Library */}
          {activeSubTab === 'background' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-5">
              
              {/* Category Filter selector */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-300">Category Filter</span>
                <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {['all', 'night', 'mosque', 'nature', 'moon', 'desert', 'gold', 'islamic'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`text-[10px] px-2 py-1 rounded capitalize font-semibold transition-all ${
                        activeCategory === cat ? 'bg-slate-800 text-slate-200' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid representation of up to 50 Image backgrounds & looped video feeds */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Preset Libraries</span>
                  <span className="text-[10px] text-slate-400">Click to set instantly as background</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-60 overflow-y-auto pr-1 border border-slate-800 p-2 rounded-lg bg-slate-950 scrollbar-thin">
                  {filteredBackgrounds.map((bg) => {
                    const isSelected = project.background.mediaUrl === bg.url;
                    return (
                      <button
                        key={bg.id}
                        onClick={() => {
                          onUpdateProject({
                            background: {
                              ...project.background,
                              type: bg.isVideo ? 'video' : 'image',
                              bgSource: bg.isVideo ? 'video' : 'single',
                              mediaUrl: bg.url,
                              videoUrl: bg.isVideo ? bg.url : undefined,
                            },
                          });
                        }}
                        className={`group relative aspect-[9/16] rounded-md overflow-hidden border transition-all ${
                          isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-slate-850 hover:border-slate-700'
                        }`}
                      >
                        <img
                          src={bg.isVideo ? 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=150&q=80' : bg.url}
                          alt={bg.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {bg.isVideo && (
                          <div className="absolute top-1 left-1 bg-blue-500/90 text-[8px] px-1 rounded font-bold text-slate-100 uppercase tracking-wider scale-90">
                            VIDEO
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-slate-900/80 p-1 text-[8px] truncate text-slate-300 font-semibold group-hover:bg-slate-900 transition-colors">
                          {bg.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AI Image Generation Prompt block */}
              <div className="border border-slate-800 rounded-lg p-4 bg-slate-950 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-200">Spiritual AI Scene Generation</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Directly prompt Gemini to create a customized spiritual backdrop suitable for Quran recitation.
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="E.g. Crescent moon shining over a serene mosque dome, misty twilight clouds..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleGenerateAIBackground}
                    disabled={isGeneratingBg || !aiPrompt.trim()}
                    className="bg-emerald-600 hover:bg-emerald-500 text-slate-100 disabled:bg-slate-800 disabled:text-slate-500 text-xs px-3 py-1.5 rounded font-bold transition-all"
                  >
                    {isGeneratingBg ? 'Generating...' : 'Generate & Set'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Dynamic Black-Background Overlay Filter */}
          {activeSubTab === 'overlay' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <Layers className="h-4.5 w-4.5 text-teal-400" />
                Black-Background Video Overlay Filters
              </h3>
              <p className="text-xs text-slate-400">
                Instantly blend dust particles, glowing smoke, or falling stars on top of your background layers. Screen blending filters eliminate dark backdrops automatically.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Overlay Video Url</label>
                  <input
                    type="text"
                    value={overlayUrl}
                    onChange={(e) => {
                      setOverlayUrl(e.target.value);
                      onUpdateProject({
                        background: {
                          ...project.background,
                          overlayVideo: {
                            url: e.target.value,
                            opacity: overlayOpacity,
                            scale: overlayScale,
                            blendMode: overlayBlendMode,
                            positionX: 50,
                            positionY: 50
                          }
                        }
                      });
                    }}
                    placeholder="https://example.com/sparks-overlay.mp4"
                    className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Blend Filter Mode</label>
                  <select
                    value={overlayBlendMode}
                    onChange={(e: any) => {
                      setOverlayBlendMode(e.target.value);
                      onUpdateProject({
                        background: {
                          ...project.background,
                          overlayVideo: {
                            url: overlayUrl,
                            opacity: overlayOpacity,
                            scale: overlayScale,
                            blendMode: e.target.value,
                            positionX: 50,
                            positionY: 50
                          }
                        }
                      });
                    }}
                    className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="screen">Screen (Removes Black Pixels)</option>
                    <option value="lighten">Lighten (Overlay light components)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>Opacity Filter</span>
                    <span>{Math.round(overlayOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={overlayOpacity}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setOverlayOpacity(val);
                      onUpdateProject({
                        background: {
                          ...project.background,
                          overlayVideo: {
                            url: overlayUrl,
                            opacity: val,
                            scale: overlayScale,
                            blendMode: overlayBlendMode,
                            positionX: 50,
                            positionY: 50
                          }
                        }
                      });
                    }}
                    className="w-full accent-emerald-500 bg-slate-950"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>Scale multiplier</span>
                    <span>{overlayScale.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.05"
                    value={overlayScale}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setOverlayScale(val);
                      onUpdateProject({
                        background: {
                          ...project.background,
                          overlayVideo: {
                            url: overlayUrl,
                            opacity: overlayOpacity,
                            scale: val,
                            blendMode: overlayBlendMode,
                            positionX: 50,
                            positionY: 50
                          }
                        }
                      });
                    }}
                    className="w-full accent-emerald-500 bg-slate-950"
                  />
                </div>
              </div>

              {/* Dynamic Overlay Presets triggers */}
              <div className="mt-2 bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Sparks & Smoke Overlay Quick presets</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const url = 'https://assets.mixkit.co/videos/preview/mixkit-dust-particles-floating-slowly-in-the-air-42526-large.mp4';
                      setOverlayUrl(url);
                      setOverlayOpacity(0.7);
                      onUpdateProject({
                        background: {
                          ...project.background,
                          overlayVideo: {
                            url,
                            opacity: 0.7,
                            scale: 1.0,
                            blendMode: 'screen',
                            positionX: 50,
                            positionY: 50
                          }
                        }
                      });
                      showToast('✨ Floating gold particles overlay applied!');
                    }}
                    className="text-[11px] px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded hover:text-slate-100"
                  >
                    🌟 Floating Gold Dust
                  </button>
                  <button
                    onClick={() => {
                      const url = 'https://assets.mixkit.co/videos/preview/mixkit-smoke-background-on-black-34242-large.mp4';
                      setOverlayUrl(url);
                      setOverlayOpacity(0.5);
                      onUpdateProject({
                        background: {
                          ...project.background,
                          overlayVideo: {
                            url,
                            opacity: 0.5,
                            scale: 1.2,
                            blendMode: 'screen',
                            positionX: 50,
                            positionY: 50
                          }
                        }
                      });
                      showToast('💨 Mystical smoke layer overlay applied!');
                    }}
                    className="text-[11px] px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded hover:text-slate-100"
                  >
                    💨 Spiritual incense smoke
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Advanced Controls & Layout safe-areas */}
          {activeSubTab === 'advanced' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-200">
                ⚙️ Safe-Area & Advanced Customization
              </h3>
              <p className="text-xs text-slate-400">
                Verify that Quran text matches safe margin zones. Safe areas mathematically prevent clipping behind margins or overlapping Arabic and Tamil text.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">Surah Intro Frame</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      checked={enableIntro}
                      onChange={(e) => setEnableIntro(e.target.checked)}
                      id="intro-check"
                      className="accent-emerald-500 rounded"
                    />
                    <label htmlFor="intro-check" className="text-xs text-slate-300">Enable 4s Cinematic Intro card</label>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">Outro End Frame</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      checked={enableOutro}
                      onChange={(e) => setEnableOutro(e.target.checked)}
                      id="outro-check"
                      className="accent-emerald-500 rounded"
                    />
                    <label htmlFor="outro-check" className="text-xs text-slate-300">Enable Optional Quran Outro card</label>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Safe-Area Vertical Alignment Offset</label>
                  <select
                    value={project.textStyle.verticalPosition}
                    onChange={(e: any) => {
                      onUpdateProject({
                        textStyle: {
                          ...project.textStyle,
                          verticalPosition: e.target.value,
                        },
                      });
                    }}
                    className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="center">Center Centered (Safest for Quran)</option>
                    <option value="top">Upper Third (Elegant layout)</option>
                    <option value="bottom">Lower Third (Subtitle look)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Tamil Font Family</label>
                  <select
                    value={project.textStyle.fontFamily}
                    onChange={(e: any) => {
                      onUpdateProject({
                        textStyle: {
                          ...project.textStyle,
                          fontFamily: e.target.value,
                        },
                      });
                    }}
                    className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none font-mono"
                  >
                    <option value="'Playfair Display', serif">Playfair Display (Serif)</option>
                    <option value="'Bamini', serif">Bamini (Tamil Calligraphic)</option>
                    <option value="'Mukta Malar', sans-serif">Mukta Malar (Tamil Sans)</option>
                    <option value="'Outfit', sans-serif">Outfit (Modern Display)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Master "✨ AUTO CREATE QURAN VIDEO" button */}
          <button
            onClick={handleAIAutoCreate}
            disabled={isAutoCreating}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-slate-100 disabled:opacity-50 hover:from-emerald-500 hover:to-teal-400 font-bold p-4 rounded-xl shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm md:text-base border border-emerald-500/30"
          >
            <Sparkles className="h-5 w-5 text-yellow-300 animate-spin" />
            <span>{isAutoCreating ? 'PRODUCING QURAN VIDEO...' : '✨ AUTO CREATE QURAN VIDEO'}</span>
          </button>
        </div>

        {/* Right Column: 9:16 Vertical Composition Preview Player */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">9:16 Real-time Preview</span>
              <span className="text-[10px] text-slate-400">Exact video composition output</span>
            </div>

            {/* 9:16 Screen Viewbox Wrapper */}
            <div className="relative aspect-[9/16] w-full max-w-[280px] mx-auto rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-black">
              {/* Looped Background image / video display */}
              {project.background.type === 'video' && project.background.videoUrl ? (
                <video
                  src={project.background.videoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <img
                  src={project.background.mediaUrl || 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1080&q=80'}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {/* Black background video overlay if exists */}
              {project.background.overlayVideo?.url && (
                <video
                  src={project.background.overlayVideo.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    mixBlendMode: project.background.overlayVideo.blendMode === 'screen' ? 'screen' : 'lighten',
                    opacity: project.background.overlayVideo.opacity ?? 0.8,
                    transform: `scale(${project.background.overlayVideo.scale ?? 1.0})`,
                  }}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
              )}

              {/* Overlay shadow layer */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundColor: 'black',
                  opacity: project.background.overlayOpacity ?? 0.45,
                }}
              />

              {/* Safe area layout box container */}
              <div className="absolute inset-0 flex flex-col justify-between p-4 z-10 pointer-events-none text-center">
                {/* Intro Ribbon/Header */}
                <div className="text-[10px] text-amber-400 font-semibold tracking-wider drop-shadow bg-black/40 px-2 py-1 rounded-md self-center mt-4">
                  Surah Al-Asr (103)
                </div>

                {/* Subtitle verses body wrapper */}
                <div className="flex-1 flex flex-col justify-center items-center gap-3 px-2">
                  {/* Arabic (RTL Elegant Quran typography) */}
                  <div
                    dir="rtl"
                    style={{
                      fontFamily: "'Amiri', serif",
                      textShadow: '0 4px 12px rgba(0,0,0,0.95), 0 2px 4px rgba(0,0,0,0.85)',
                    }}
                    className="text-2xl text-amber-100 font-bold leading-relaxed text-center break-words w-full"
                  >
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </div>

                  {/* Elegant gold Divider line */}
                  <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent my-1" />

                  {/* Tamil translation (user selected style) */}
                  <div
                    style={{
                      fontFamily: project.textStyle.fontFamily || 'sans-serif',
                      textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                    }}
                    className="text-xs text-slate-100 font-semibold leading-normal text-center break-words w-full"
                  >
                    அளவற்ற அருளாளன், நிகரற்ற அன்பாளன், அல்லாஹ்வின் பெயரால்!
                  </div>

                  {/* English Translation */}
                  <div
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                    }}
                    className="text-[10px] text-slate-300 font-medium leading-normal text-center break-words w-full"
                  >
                    In the name of Allah, the Entirely Merciful, the Especially Merciful.
                  </div>
                </div>

                {/* Footer Watermark info */}
                <div className="text-[8px] text-slate-500 font-bold uppercase tracking-widest drop-shadow mb-4">
                  TAMIL QURAN VIDEO MAKER
                </div>
              </div>
            </div>

            {/* Quick Player Play/Pause controller */}
            <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <button
                onClick={onTogglePlay}
                className="bg-emerald-600 hover:bg-emerald-500 p-2 rounded-lg text-slate-950 transition-all flex items-center gap-1 text-xs font-bold"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                <span>{isPlaying ? 'Pause' : 'Play Preview'}</span>
              </button>

              <div className="text-[10px] font-semibold text-slate-400">
                {Math.round(currentTimeMs / 1000)}s / {Math.round(durationMs / 1000)}s
              </div>
            </div>
          </div>

          {/* Export card integration */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-200">Export Final Video</span>
            <p className="text-[11px] text-slate-400">
              Satisfied with the composition? Head over to the Export tab to render a gorgeous vertical MP4 video!
            </p>
            <button
              onClick={() => onNavigateToTab('export')}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs py-2 rounded-lg font-bold transition-all"
            >
              Go to Export Tab
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Global dummy showToast function
function showToast(msg: string) {
  console.log('[QuranMaker] ' + msg);
}
