import React, { useRef } from 'react';
import { ProjectData, TextStyleConfig, AnimationStyle, BackgroundConfig } from '../../types/project';
import {
  Sparkles,
  Type,
  Upload,
  Palette,
  Layers,
  CheckCircle2,
  Sliders,
  Maximize2,
} from 'lucide-react';

interface DesignScreenProps {
  project: ProjectData;
  onUpdateTextStyle: (style: Partial<TextStyleConfig>) => void;
  onUpdateAnimation: (anim: AnimationStyle) => void;
  onUpdateBackground: (bg: Partial<BackgroundConfig>) => void;
  onCustomFontUploaded: (name: string, family: string) => void;
}

const PRESET_FONTS = [
  { name: 'Default Sans', family: 'sans-serif' },
  { name: 'Mukta Malar (Tamil & Latin)', family: "'Mukta Malar', sans-serif" },
  { name: 'Arima Madurai (Tamil Calligraphic)', family: "'Arima Madurai', cursive" },
  { name: 'Catamaran (Tamil Clean)', family: "'Catamaran', sans-serif" },
  { name: 'Playfair Display (Serif)', family: "'Playfair Display', serif" },
  { name: 'Outfit (Modern Display)', family: "'Outfit', sans-serif" },
];

const PRESET_BACKGROUNDS = [
  'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1080&q=80',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1080&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1080&q=80',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1080&q=80',
];

export const DesignScreen: React.FC<DesignScreenProps> = ({
  project,
  onUpdateTextStyle,
  onUpdateAnimation,
  onUpdateBackground,
  onCustomFontUploaded,
}) => {
  const fontFileInputRef = useRef<HTMLInputElement | null>(null);
  const bgImageInputRef = useRef<HTMLInputElement | null>(null);

  const { textStyle, animationStyle, background } = project;

  // Font upload handler
  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const fontData = await file.arrayBuffer();
        const fontName = 'CustomFont_' + Date.now();
        const fontFace = new FontFace(fontName, fontData);
        await fontFace.load();
        document.fonts.add(fontFace);
        onCustomFontUploaded(file.name, fontName);
      } catch (err) {
        alert('Could not parse font. Please ensure it is a valid .ttf or .otf file.');
      }
    }
  };

  // Background image upload handler
  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdateBackground({
        type: 'image',
        mediaUrl: url,
      });
    }
  };

  return (
    <div className="max-w-lg mx-auto w-full space-y-4 pb-8">
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-400" />
          Video Designer & Typography
        </h2>
        <p className="text-xs text-slate-400">
          Customize fonts, colors, stroke, animations, and video backgrounds.
        </p>
      </div>

      {/* 1. Animation Styles */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2.5">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Animation Style
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              'KARAOKE',
              'FADE',
              'SLIDE',
              'SCALE',
              'BOUNCE',
              'TYPEWRITER',
              'WORD_HIGHLIGHT',
              'ZOOM',
              'GLOW',
            ] as AnimationStyle[]
          ).map((anim) => (
            <button
              key={anim}
              onClick={() => onUpdateAnimation(anim)}
              className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border transition ${
                animationStyle === anim
                  ? 'bg-violet-600 border-violet-500 text-white shadow-md'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {anim.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Typography & Fonts */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Type className="w-4 h-4 text-violet-400" />
            Font Family & Ligatures
          </label>
          <span className="text-[11px] text-emerald-400 font-medium">
            {textStyle.fontName}
          </span>
        </div>

        {/* Font Select */}
        <select
          value={textStyle.fontFamily}
          onChange={(e) => {
            const selected = PRESET_FONTS.find((f) => f.family === e.target.value);
            onUpdateTextStyle({
              fontFamily: e.target.value,
              fontName: selected ? selected.name : textStyle.fontName,
            });
          }}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-violet-500"
        >
          {PRESET_FONTS.map((font) => (
            <option key={font.family} value={font.family}>
              {font.name}
            </option>
          ))}
          {textStyle.fontName &&
            !PRESET_FONTS.some((f) => f.family === textStyle.fontFamily) && (
              <option value={textStyle.fontFamily}>{textStyle.fontName} (Uploaded)</option>
            )}
        </select>

        {/* Custom TTF / OTF Upload */}
        <button
          onClick={() => fontFileInputRef.current?.click()}
          className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition"
        >
          <Upload className="w-4 h-4 text-violet-400" />
          <span>Upload Custom Font (.TTF / .OTF)</span>
        </button>
        <input
          ref={fontFileInputRef}
          type="file"
          accept=".ttf,.otf"
          onChange={handleFontUpload}
          className="hidden"
        />

        {/* Font Size Slider */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Font Size</span>
            <span className="text-violet-400 font-bold font-mono">{textStyle.fontSize}px</span>
          </div>
          <input
            type="range"
            min="18"
            max="54"
            value={textStyle.fontSize}
            onChange={(e) => onUpdateTextStyle({ fontSize: parseInt(e.target.value, 10) })}
            className="w-full accent-violet-500"
          />
        </div>

        {/* Italic and Weight */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => onUpdateTextStyle({ isItalic: !textStyle.isItalic })}
            className={`py-1.5 px-3 rounded-xl text-xs font-semibold border transition ${
              textStyle.isItalic
                ? 'bg-violet-600 border-violet-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            Italic
          </button>
          <button
            onClick={() =>
              onUpdateTextStyle({ fontWeight: textStyle.fontWeight >= 700 ? 400 : 800 })
            }
            className={`py-1.5 px-3 rounded-xl text-xs font-semibold border transition ${
              textStyle.fontWeight >= 700
                ? 'bg-violet-600 border-violet-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            Bold Weight
          </button>
        </div>
      </div>

      {/* 3. Color & Highlights */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Palette className="w-4 h-4 text-violet-400" />
          Color & Contrast
        </label>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="block text-slate-400 mb-1">Text Color</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={textStyle.textColor}
                onChange={(e) => onUpdateTextStyle({ textColor: e.target.value })}
                className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
              />
              <span className="font-mono text-slate-300">{textStyle.textColor}</span>
            </div>
          </div>

          <div>
            <span className="block text-slate-400 mb-1">Karaoke Highlight</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={textStyle.highlightColor}
                onChange={(e) => onUpdateTextStyle({ highlightColor: e.target.value })}
                className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
              />
              <span className="font-mono text-slate-300">{textStyle.highlightColor}</span>
            </div>
          </div>
        </div>

        {/* Shadow & Outline */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
          <label className="flex items-center justify-between text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span>Drop Shadow</span>
            <input
              type="checkbox"
              checked={textStyle.hasShadow}
              onChange={(e) => onUpdateTextStyle({ hasShadow: e.target.checked })}
              className="w-4 h-4 accent-violet-500 rounded"
            />
          </label>

          <label className="flex items-center justify-between text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span>Text Stroke</span>
            <input
              type="checkbox"
              checked={textStyle.hasStroke}
              onChange={(e) => onUpdateTextStyle({ hasStroke: e.target.checked })}
              className="w-4 h-4 accent-violet-500 rounded"
            />
          </label>
        </div>
      </div>

      {/* 4. Vertical Positioning */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Vertical Screen Placement
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(['top', 'center', 'bottom', 'custom'] as const).map((pos) => (
            <button
              key={pos}
              onClick={() => onUpdateTextStyle({ verticalPosition: pos })}
              className={`py-1.5 rounded-xl text-xs font-semibold capitalize border transition ${
                textStyle.verticalPosition === pos
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>

        {textStyle.verticalPosition === 'custom' && (
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Position Y</span>
              <span className="text-violet-400 font-mono font-bold">
                {textStyle.customYPercent}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              value={textStyle.customYPercent}
              onChange={(e) =>
                onUpdateTextStyle({ customYPercent: parseInt(e.target.value, 10) })
              }
              className="w-full accent-violet-500"
            />
          </div>
        )}
      </div>

      {/* 5. Video Background */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-violet-400" />
            Background Layer
          </label>
          <span className="text-[11px] text-slate-400 capitalize">{background.type}</span>
        </div>

        {/* Presets */}
        <div className="grid grid-cols-4 gap-2">
          {PRESET_BACKGROUNDS.map((url, i) => (
            <button
              key={i}
              onClick={() => onUpdateBackground({ type: 'image', mediaUrl: url })}
              className={`h-14 rounded-xl overflow-hidden border-2 transition ${
                background.mediaUrl === url ? 'border-amber-400 scale-105' : 'border-slate-800'
              }`}
            >
              <img src={url} alt="Preset" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        {/* Upload Custom BG */}
        <button
          onClick={() => bgImageInputRef.current?.click()}
          className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition"
        >
          <Upload className="w-4 h-4 text-violet-400" />
          <span>Upload Device Background Image</span>
        </button>
        <input
          ref={bgImageInputRef}
          type="file"
          accept="image/*"
          onChange={handleBgImageUpload}
          className="hidden"
        />

        {/* Dark Contrast Overlay Slider */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Dark Dimming Overlay</span>
            <span className="text-violet-400 font-mono font-bold">
              {Math.round(background.overlayOpacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="0.9"
            step="0.05"
            value={background.overlayOpacity}
            onChange={(e) =>
              onUpdateBackground({ overlayOpacity: parseFloat(e.target.value) })
            }
            className="w-full accent-violet-500"
          />
        </div>
      </div>
    </div>
  );
};
