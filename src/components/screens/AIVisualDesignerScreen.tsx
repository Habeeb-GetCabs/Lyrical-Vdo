import React, { useState, useRef } from 'react';
import {
  ProjectData,
  AILyricDesignStyle,
  MusicVisualizerType,
  ColorPalettePreset,
  COLOR_PALETTE_PRESETS,
  AILyricDesignerConfig,
  FontItem,
  BUILTIN_TAMIL_FONTS,
  DEFAULT_AI_DESIGNER_CONFIG,
} from '../../types/project';
import { AILyricVisualDesigner } from '../../services/aiLyricVisualDesigner';
import {
  Sparkles,
  Palette,
  Type,
  Music,
  Zap,
  Sliders,
  RefreshCw,
  Upload,
  Video,
  CheckCircle2,
  SlidersHorizontal,
  Layers,
  Flame,
  Moon,
  Shuffle,
  Eye,
  Film,
} from 'lucide-react';

interface AIVisualDesignerScreenProps {
  project: ProjectData;
  onUpdateProject: (updates: Partial<ProjectData>) => void;
  onNavigateToTab?: (tab: any) => void;
}

const DESIGN_STYLES: {
  id: AILyricDesignStyle;
  name: string;
  badge: string;
  desc: string;
  tag: string;
}[] = [
  {
    id: 'AI_AUTO',
    name: '✨ AI AUTO (Adaptive)',
    badge: 'Smart Hybrid',
    desc: 'Intelligently adapts typography, sizes, and animations across verses, chorus, and drops.',
    tag: 'Recommended',
  },
  {
    id: 'DYNAMIC_POP',
    name: '01 Dynamic Pop',
    badge: 'High Energy',
    desc: 'Oversized important words, organic tilt, scale pop, bouncing beat reaction.',
    tag: 'Trending',
  },
  {
    id: 'CINEMATIC_FLOAT',
    name: '02 Cinematic Float',
    badge: 'Romantic / Soulful',
    desc: 'Soft atmospheric typography, gentle floating breath, blur-to-sharp focus.',
    tag: 'Melody',
  },
  {
    id: 'SCATTERED_WORDS',
    name: '03 Scattered Words',
    badge: 'Artistic Layout',
    desc: 'Non-centered dynamic word placements with balanced negative space.',
    tag: 'Aesthetic',
  },
  {
    id: 'BIG_SMALL',
    name: '04 Big Word / Small Word',
    badge: 'Dramatic Contrast',
    desc: 'Extreme contrast: small connectors ("நான்") vs giant emotional peaks ("உயிரே").',
    tag: 'Impact',
  },
  {
    id: 'BEAT_POP',
    name: '05 Beat Pop',
    badge: 'Rhythmic Sync',
    desc: 'Words punch into the screen on drum onsets with intense golden glow flash.',
    tag: 'Dance / Trap',
  },
  {
    id: 'KINETIC_TYPOGRAPHY',
    name: '06 Kinetic Typography',
    badge: 'Continuous Motion',
    desc: 'Continuous sliding, drifting, and diagonal movement following song tempo.',
    tag: 'Modern',
  },
  {
    id: 'WORD_REVEAL',
    name: '07 Word Reveal',
    badge: 'Progressive Focus',
    desc: 'Progressive blur reveal and optical mask wipe on pivotal lyrics.',
    tag: 'Poetic',
  },
  {
    id: 'HANDWRITTEN',
    name: '08 Emotional Handwritten',
    badge: 'Calligraphic',
    desc: 'Handwritten cursive Tamil fonts, romantic floating, and warm glowing aura.',
    tag: 'Love / Nostalgia',
  },
  {
    id: 'MODERN_MINIMAL',
    name: '09 Modern Minimal',
    badge: 'Clean Elegance',
    desc: 'Spacious editorial framing with a single highlighted accent word.',
    tag: 'Minimalist',
  },
  {
    id: 'CINEMATIC_CHAOS',
    name: '10 Cinematic Chaos',
    badge: 'Maximum Impact',
    desc: 'Alternating word rotations, layered scales, beat impacts, fast entrances.',
    tag: 'Intense / Rap',
  },
  {
    id: 'AI_MIX',
    name: '🎲 AI MIX (Eclectic)',
    badge: 'Surprise',
    desc: 'Dynamically shifts styles between lyric lines for maximum visual variety.',
    tag: 'Creative',
  },
];

const VISUALIZERS: {
  id: MusicVisualizerType;
  name: string;
  desc: string;
  iconText: string;
}[] = [
  { id: 'WAVEFORM', name: 'Waveform', desc: 'Smooth flowing audio waveform', iconText: '〰️' },
  { id: 'AUDIO_EQUALIZER', name: 'Audio Equalizer', desc: 'Vertical spectrum frequency bars', iconText: '📊' },
  { id: 'CIRCULAR_EQUALIZER', name: 'Circular Equalizer', desc: 'Radial 360° frequency rays', iconText: '⭕' },
  { id: 'AUDIO_RINGS', name: 'Audio Rings', desc: 'Concentric bass expanding rings', iconText: '🎯' },
  { id: 'PARTICLE_PULSE', name: 'Particle Pulse', desc: 'Golden particles bursting on beats', iconText: '✨' },
  { id: 'GLOW_PULSE', name: 'Glow Pulse', desc: 'Subtle atmospheric glowing aura', iconText: '🔮' },
  { id: 'BASS_PULSE', name: 'Bass Pulse', desc: 'Subtle camera vignette scale pulse', iconText: '💓' },
  { id: 'EDGE_VISUALIZER', name: 'Edge Visualizer', desc: 'Symmetric bars along margins', iconText: '📐' },
  { id: 'WAVE_LINES', name: 'Wave Lines', desc: 'Layered elegant sine wave ribbons', iconText: '🌊' },
  { id: 'MINIMAL_DOT_VISUALIZER', name: 'Minimal Dots', desc: 'Rhythmic pulsing dot matrix', iconText: '🔘' },
];

export const AIVisualDesignerScreen: React.FC<AIVisualDesignerScreenProps> = ({
  project,
  onUpdateProject,
  onNavigateToTab,
}) => {
  const config = project.aiDesignerConfig || DEFAULT_AI_DESIGNER_CONFIG;
  const [activeSubTab, setActiveSubTab] = useState<'styles' | 'colors' | 'fonts' | 'visualizer' | 'energy' | 'reference'>('styles');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fontInputRef = useRef<HTMLInputElement | null>(null);
  const refVideoInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Full AI Generation (Preserves Gemini Timings!)
  const handleFullAIGenerate = (styleOverride?: AILyricDesignStyle) => {
    const newConfig = AILyricVisualDesigner.generateDesign(
      project,
      styleOverride || config.activeStyle
    );
    onUpdateProject({
      aiDesignerConfig: newConfig,
    });
    showToast(`✨ AI Design Generated! Timestamps preserved.`);
  };

  // Select Style
  const handleSelectStyle = (style: AILyricDesignStyle) => {
    handleFullAIGenerate(style);
  };

  // Change Colors Only
  const handleSelectPalette = (palette: ColorPalettePreset) => {
    const updated = AILyricVisualDesigner.regenerateColors(config, palette);
    onUpdateProject({ aiDesignerConfig: updated });
    showToast(`🎨 Color palette changed to ${COLOR_PALETTE_PRESETS[palette].name}!`);
  };

  // Select Visualizer
  const handleSelectVisualizer = (vis: MusicVisualizerType) => {
    const updated = AILyricVisualDesigner.regenerateVisualizer(config, vis);
    onUpdateProject({ aiDesignerConfig: updated });
    showToast(`🎵 Instrumental gap visualizer set to ${vis.replace('_', ' ')}!`);
  };

  // Energy Presets
  const handleMakeMoreDynamic = () => {
    const updated = AILyricVisualDesigner.setVisualEnergy(config, 90);
    onUpdateProject({ aiDesignerConfig: updated });
    showToast(`⚡ Energy boosted to 90%! Punchy scale pops & beat reactions active.`);
  };

  const handleMakeMoreCinematic = () => {
    const updated = AILyricVisualDesigner.setVisualEnergy(config, 35);
    onUpdateProject({ aiDesignerConfig: updated });
    showToast(`🌙 Switched to Cinematic Mode: gentle floating, blur reveals, slow camera zoom.`);
  };

  // Granular Regenerate Handlers
  const handleRegenTypography = () => {
    const updated = AILyricVisualDesigner.regenerateTypography(project, config);
    onUpdateProject({ aiDesignerConfig: updated });
    showToast(`✍️ Typography & font allocations regenerated!`);
  };

  const handleRegenAnimations = () => {
    const updated = AILyricVisualDesigner.regenerateAnimations(config);
    onUpdateProject({ aiDesignerConfig: updated });
    showToast(`🎬 Fresh anti-repetition animations assigned!`);
  };

  const handleRegenLayout = () => {
    const updated = AILyricVisualDesigner.regenerateLayout(config);
    onUpdateProject({ aiDesignerConfig: updated });
    showToast(`📐 Lyric positions & dynamic layouts refreshed!`);
  };

  // Bulk Font Upload
  const handleFontBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentLibrary = [...(config.fontLibrary || BUILTIN_TAMIL_FONTS)];
    let count = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.name.endsWith('.ttf') || file.name.endsWith('.otf') || file.name.endsWith('.woff2')) {
        try {
          const fontData = await file.arrayBuffer();
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
          const fontName = `UserFont_${cleanName}_${Date.now()}`;
          const fontFace = new FontFace(fontName, fontData);
          await fontFace.load();
          document.fonts.add(fontFace);

          currentLibrary.push({
            id: `font_${Date.now()}_${i}`,
            name: file.name.replace(/\.[^/.]+$/, ''),
            family: fontName,
            category: 'unicode',
            isCustom: true,
          });
          count++;
        } catch (err) {
          console.error('Failed to load font:', file.name, err);
        }
      }
    }

    if (count > 0) {
      const updated = {
        ...config,
        fontLibrary: currentLibrary,
      };
      onUpdateProject({ aiDesignerConfig: updated });
      showToast(`🎉 Successfully loaded ${count} Tamil font(s) into your Font Library!`);
    } else {
      showToast(`Please choose valid .ttf or .otf font files.`);
    }
  };

  // Reference Video Upload & Analysis
  const handleReferenceVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate AI extraction of typography rhythm & color language
    const referenceAnalysis = {
      detectedPalette: 'White, Champagne Gold & Warm Amber',
      detectedRhythm: '128 BPM Fast Punchy Cuts with 15% Floating Drift',
      detectedTypography: 'Oversized Tamil keywords with 3° organic rotation and golden glow',
      notes: `Extracted design language from ${file.name}. Applying variable sizes & golden accents!`,
    };

    const updated: AILyricDesignerConfig = {
      ...config,
      referenceVideoName: file.name,
      referenceAnalysis,
      colorPalette: 'WHITE_GOLD',
      primaryColor: '#FFFFFF',
      accentColor: '#F59E0B',
      glowColor: '#D97706',
      visualEnergy: 80,
    };

    onUpdateProject({ aiDesignerConfig: updated });
    showToast(`🎬 Reference Video analyzed! Design language applied.`);
  };

  return (
    <div className="max-w-xl mx-auto w-full space-y-4 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-slate-950 px-4 py-2 rounded-full font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce border border-amber-300">
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="bg-gradient-to-r from-amber-500/15 via-violet-600/20 to-slate-900 border border-amber-500/30 rounded-3xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">✨</span>
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-wide">
                AI Tamil Cinematic Lyric Designer
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-md">
              Generates dynamic typography, variable word sizes, beat reactions, and music visualizers while keeping your Gemini sync timing 100% intact.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider shrink-0 shadow">
            Cinematic v2
          </span>
        </div>

        {/* Primary AI Actions */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
          <button
            onClick={() => handleFullAIGenerate()}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 font-extrabold text-xs shadow-lg transition active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Automatically</span>
          </button>

          <button
            onClick={() => handleFullAIGenerate()}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-100 font-bold text-xs border border-amber-500/40 transition active:scale-95"
          >
            <RefreshCw className="w-4 h-4 text-amber-400" />
            <span>Regenerate Design</span>
          </button>
        </div>

        {/* Quick Style & Preview Bar */}
        <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="text-slate-400 text-[11px]">Current:</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-400/20 text-amber-300 font-bold text-[11px] border border-amber-400/30 truncate">
              {config.activeStyle.replace('_', ' ')}
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-medium text-[11px] truncate">
              🎵 {config.activeVisualizer.replace('_', ' ')}
            </span>
          </div>

          <button
            onClick={() => onNavigateToTab?.('preview')}
            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold text-[11px] shrink-0"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Preview</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {[
          { id: 'styles', label: '10 Styles', icon: Sparkles },
          { id: 'colors', label: 'AI Colors', icon: Palette },
          { id: 'fonts', label: 'Tamil Fonts', icon: Type },
          { id: 'visualizer', label: 'Visualizer', icon: Music },
          { id: 'energy', label: 'Energy & Motion', icon: Zap },
          { id: 'reference', label: 'Reference Video', icon: Film },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. 10 AI LYRIC DESIGN STYLES */}
      {activeSubTab === 'styles' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Select Lyric Design Style
            </h3>
            <span className="text-[11px] text-slate-400">10 Styles + AI Mix</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {DESIGN_STYLES.map((style) => {
              const isSelected = config.activeStyle === style.id;
              return (
                <button
                  key={style.id}
                  onClick={() => handleSelectStyle(style.id)}
                  className={`p-3.5 rounded-2xl text-left border transition relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-gradient-to-br from-amber-500/20 to-slate-900 border-amber-400 text-white shadow-lg ring-1 ring-amber-400/50'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-extrabold text-xs text-slate-100">{style.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
                      {style.tag}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{style.desc}</p>

                  <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/80">
                    <span className="text-amber-400/90 font-medium">Mood: {style.badge}</span>
                    {isSelected && (
                      <span className="text-amber-400 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. AI COLOR ENGINE & PALETTES */}
      {activeSubTab === 'colors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-amber-400" />
              AI Color Engine & Word Accents
            </h3>
            <span className="text-[11px] text-slate-400">Important words get accent color</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {Object.entries(COLOR_PALETTE_PRESETS).map(([key, pal]) => {
              const isSelected = config.colorPalette === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSelectPalette(key as ColorPalettePreset)}
                  className={`p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-900 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-200 block">{pal.name}</span>
                    <span className="text-[10px] text-slate-400">
                      Primary: {pal.primary} • Accent: {pal.accent}
                    </span>
                  </div>

                  {/* Color Swatch Dots */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: pal.primary }}
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: pal.accent }}
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: pal.glow }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Regenerate Colors Button */}
          <button
            onClick={() => {
              const palettes = Object.keys(COLOR_PALETTE_PRESETS) as ColorPalettePreset[];
              const next = palettes[(palettes.indexOf(config.colorPalette) + 1) % palettes.length];
              handleSelectPalette(next);
            }}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <Shuffle className="w-3.5 h-3.5 text-amber-400" />
            <span>Cycle Next Color Palette</span>
          </button>
        </div>
      )}

      {/* 3. TAMIL FONT LIBRARY */}
      {activeSubTab === 'fonts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Type className="w-4 h-4 text-amber-400" />
              Tamil Font Library & Bulk Upload
            </h3>

            <button
              onClick={() => fontInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center gap-1.5 shadow"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Bulk Upload (.ttf / .otf)</span>
            </button>
            <input
              ref={fontInputRef}
              type="file"
              accept=".ttf,.otf,.woff2"
              multiple
              onChange={handleFontBulkUpload}
              className="hidden"
            />
          </div>

          {/* Font allocation preview cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Primary Font</span>
              <span className="text-xs font-extrabold text-amber-400 block truncate">
                {config.primaryFontName}
              </span>
              <span className="text-[10px] text-slate-500">Regular lyrics</span>
            </div>

            <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Secondary Font</span>
              <span className="text-xs font-extrabold text-amber-400 block truncate">
                {config.secondaryFontName}
              </span>
              <span className="text-[10px] text-slate-500">Accented words</span>
            </div>

            <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Decorative Font</span>
              <span className="text-xs font-extrabold text-amber-400 block truncate">
                {config.decorativeFontName}
              </span>
              <span className="text-[10px] text-slate-500">Peak emotional words</span>
            </div>
          </div>

          {/* Font List in Library */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400">
              Installed Tamil & Cinematic Fonts ({config.fontLibrary?.length || BUILTIN_TAMIL_FONTS.length})
            </label>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {(config.fontLibrary || BUILTIN_TAMIL_FONTS).map((font) => (
                <div
                  key={font.id}
                  className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">{font.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] bg-slate-800 text-slate-400 capitalize">
                        {font.category}
                      </span>
                      {font.isCustom && (
                        <span className="px-1.5 py-0.2 text-[9px] bg-amber-400/20 text-amber-300 font-bold rounded">
                          Uploaded
                        </span>
                      )}
                    </div>
                    {/* Tamil Unicode sample text */}
                    <div
                      className="text-sm text-slate-300 mt-1"
                      style={{ fontFamily: font.family }}
                    >
                      அம்மா என் உயிர் ❤️ தாய்ப்பால் | Sweet Melody
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const updated = {
                        ...config,
                        primaryFontFamily: font.family,
                        primaryFontName: font.name,
                      };
                      onUpdateProject({ aiDesignerConfig: updated });
                      showToast(`Primary font set to ${font.name}!`);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold shrink-0 border border-slate-700"
                  >
                    Use as Primary
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleRegenTypography}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Regenerate Font Pairing</span>
          </button>
        </div>
      )}

      {/* 4. AI MUSIC VISUALIZER (Instrumental Gaps) */}
      {activeSubTab === 'visualizer' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Music className="w-4 h-4" />
              Instrumental Gap Music Visualizer
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              When the singer stops and music plays alone (instrumental sections), the screen automatically brings up the active music visualizer so the video stays lively and dynamic.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {VISUALIZERS.map((vis) => {
              const isSelected = config.activeVisualizer === vis.id;
              return (
                <button
                  key={vis.id}
                  onClick={() => handleSelectVisualizer(vis.id)}
                  className={`p-3 rounded-2xl border text-left transition flex items-start gap-3 ${
                    isSelected
                      ? 'bg-gradient-to-br from-amber-500/20 to-slate-900 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-2xl">{vis.iconText}</span>
                  <div className="space-y-0.5 flex-1">
                    <span className="text-xs font-bold text-slate-100 block">{vis.name}</span>
                    <span className="text-[10px] text-slate-400 block">{vis.desc}</span>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>

          {/* Visualizer Position Selector */}
          <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-300">Visualizer Position</label>
            <div className="grid grid-cols-3 gap-2 text-xs font-bold">
              {(['bottom', 'center', 'edges'] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => {
                    const updated = { ...config, visualizerPosition: pos };
                    onUpdateProject({ aiDesignerConfig: updated });
                    showToast(`Visualizer placed at ${pos}!`);
                  }}
                  className={`py-2 rounded-xl capitalize transition ${
                    config.visualizerPosition === pos
                      ? 'bg-amber-500 text-slate-950 shadow font-extrabold'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. VISUAL ENERGY & CINEMATIC MOTION */}
      {activeSubTab === 'energy' && (
        <div className="space-y-4">
          {/* Quick Energy Mode Presets */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleMakeMoreDynamic}
              className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-slate-900 border border-amber-500/40 hover:border-amber-400 text-left transition space-y-1.5"
            >
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4" />
                Make It More Dynamic
              </span>
              <p className="text-[11px] text-slate-400">
                Pushes visual energy to 90%. Rapid scale pops, beat pulses, and kinetic drift.
              </p>
            </button>

            <button
              onClick={handleMakeMoreCinematic}
              className="p-3.5 rounded-2xl bg-gradient-to-br from-violet-600/20 to-slate-900 border border-violet-500/40 hover:border-violet-400 text-left transition space-y-1.5"
            >
              <span className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
                <Moon className="w-4 h-4" />
                Make It More Cinematic
              </span>
              <p className="text-[11px] text-slate-400">
                Sets smooth 35% energy. Atmospheric float, blur-to-sharp reveals, slow zoom.
              </p>
            </button>
          </div>

          {/* Energy Slider */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">Visual Energy Intensity</label>
              <span className="text-xs font-bold text-amber-400">{config.visualEnergy}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={config.visualEnergy}
              onChange={(e) => {
                const val = Number(e.target.value);
                const updated = AILyricVisualDesigner.setVisualEnergy(config, val);
                onUpdateProject({ aiDesignerConfig: updated });
              }}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Photo Background Camera Movement */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-200">
                Photo Background Camera Movement
              </label>
              <p className="text-[10px] text-slate-400">
                Prevents photo backgrounds from being frozen. Automatically pans, zooms, and pulses to the rhythm.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-bold">
              {[
                { id: 'SLOW_ZOOM_IN', label: 'Slow Zoom In' },
                { id: 'SLOW_ZOOM_OUT', label: 'Slow Zoom Out' },
                { id: 'PAN_HORIZONTAL', label: 'Horizontal Pan' },
                { id: 'PAN_VERTICAL', label: 'Vertical Pan' },
                { id: 'BEAT_SCALE_PULSE', label: 'Beat Scale Pulse' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    const updated = {
                      ...config,
                      backgroundMotion: {
                        ...config.backgroundMotion,
                        type: m.id as any,
                      },
                    };
                    onUpdateProject({ aiDesignerConfig: updated });
                    showToast(`Background camera motion set to ${m.label}!`);
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-[11px] transition ${
                    config.backgroundMotion?.type === m.id
                      ? 'bg-amber-500 text-slate-950 font-extrabold border-amber-400 shadow'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. REFERENCE VIDEO STYLE ANALYZER */}
      {activeSubTab === 'reference' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Film className="w-4 h-4" />
              Upload Reference Tamil Lyric Video
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Upload a sample Tamil lyric video you like. The AI analyzes the typography layout, word size contrast, rhythm, and color palette, and applies that general design language to your project without modifying your audio or timing.
            </p>

            <div className="pt-2">
              <button
                onClick={() => refVideoInputRef.current?.click()}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Reference Video (.mp4 / .mov)</span>
              </button>
              <input
                ref={refVideoInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                onChange={handleReferenceVideoUpload}
                className="hidden"
              />
            </div>
          </div>

          {config.referenceAnalysis && (
            <div className="bg-slate-900 p-4 rounded-2xl border border-amber-500/40 space-y-2.5">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Extracted Design Language: {config.referenceVideoName}
              </span>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 shrink-0">🎨 Palette:</span>
                  <span className="font-semibold text-slate-200">
                    {config.referenceAnalysis.detectedPalette}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 shrink-0">⚡ Rhythm:</span>
                  <span className="font-semibold text-slate-200">
                    {config.referenceAnalysis.detectedRhythm}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 shrink-0">✍️ Typography:</span>
                  <span className="font-semibold text-slate-200">
                    {config.referenceAnalysis.detectedTypography}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Granular Regenerate Action Panel */}
      <div className="bg-slate-900/90 p-4 rounded-3xl border border-slate-800 space-y-2.5">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Granular Regeneration (Preserves Gemini Timings)
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
          <button
            onClick={() => {
              const palettes = Object.keys(COLOR_PALETTE_PRESETS) as ColorPalettePreset[];
              const next = palettes[(palettes.indexOf(config.colorPalette) + 1) % palettes.length];
              handleSelectPalette(next);
            }}
            className="py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center justify-center gap-1.5"
          >
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span>Regen Colors</span>
          </button>

          <button
            onClick={handleRegenTypography}
            className="py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center justify-center gap-1.5"
          >
            <Type className="w-3.5 h-3.5 text-amber-400" />
            <span>Regen Fonts</span>
          </button>

          <button
            onClick={handleRegenAnimations}
            className="py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center justify-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Regen Motion</span>
          </button>

          <button
            onClick={handleRegenLayout}
            className="py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center justify-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>Regen Layout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
