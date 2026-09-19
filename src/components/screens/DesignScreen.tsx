import React, { useRef, useState } from 'react';
import {
  ProjectData,
  TextStyleConfig,
  AnimationStyle,
  BackgroundConfig,
  TimelineImageItem,
  OverlayVideoConfig,
} from '../../types/project';
import {
  Sparkles,
  Type,
  Upload,
  Palette,
  Layers,
  CheckCircle2,
  Sliders,
  Maximize2,
  Lock,
  Unlock,
  Video,
  Image as ImageIcon,
  RefreshCw,
  Plus,
  Trash2,
  Tv,
  Layout,
  SlidersHorizontal,
  Flame,
} from 'lucide-react';

interface DesignScreenProps {
  project: ProjectData;
  onUpdateTextStyle: (style: Partial<TextStyleConfig>) => void;
  onUpdateAnimation: (anim: AnimationStyle) => void;
  onUpdateBackground: (bg: Partial<BackgroundConfig>) => void;
  onCustomFontUploaded: (name: string, family: string) => void;
  onUpdateProject?: (updates: Partial<ProjectData>) => void;
}

const PRESET_FONTS = [
  { name: 'Default Sans', family: 'sans-serif' },
  { name: 'Mukta Malar (Tamil & Latin)', family: "'Mukta Malar', sans-serif" },
  { name: 'Arima Madurai (Tamil Calligraphic)', family: "'Arima Madurai', cursive" },
  { name: 'Catamaran (Tamil Clean)', family: "'Catamaran', sans-serif" },
  { name: 'Playfair Display (Serif)', family: "'Playfair Display', serif" },
  { name: 'Outfit (Modern Display)', family: "'Outfit', sans-serif" },
];

const QURANIC_TEMPLATES = [
  {
    id: 'islamic_elegant',
    name: '🕌 Classic Islamic Elegant',
    desc: 'Classic serif typography with glowing golden color accents and wave visualizer.',
    style: 'CINEMATIC_FLOAT',
    palette: 'WHITE_GOLD',
    bg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&q=80',
    vis: 'WAVE_LINES',
    family: "'Playfair Display', serif",
  },
  {
    id: 'masjid_cinematic',
    name: '🕋 Masjid Silhouette',
    desc: 'Cinematic silhouette of mosque against deep dark blue stars, peaceful glow pulse.',
    style: 'CINEMATIC_FLOAT',
    palette: 'COOL_CINEMATIC',
    bg: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1080&q=80',
    vis: 'GLOW_PULSE',
    family: "'Playfair Display', serif",
  },
  {
    id: 'makkah_madinah',
    name: '🌸 Sacred Atmosphere (Makkah)',
    desc: 'Dawn lighting from the Holy Mosque, clean modern editorial spacing and dots visualizer.',
    style: 'MODERN_MINIMAL',
    palette: 'WHITE_YELLOW',
    bg: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1080&q=80',
    vis: 'MINIMAL_DOT_VISUALIZER',
    family: "'Outfit', sans-serif",
  },
  {
    id: 'moon_night',
    name: '🌙 Moon & Silent Night',
    desc: 'High contrast starry sky and crescent moon backdrop, dynamic text animation sequence.',
    style: 'DYNAMIC_POP',
    palette: 'WARM_CINEMATIC',
    bg: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1080&q=80',
    vis: 'WAVEFORM',
    family: "'Outfit', sans-serif",
  },
];

export const DesignScreen: React.FC<DesignScreenProps> = ({
  project,
  onUpdateTextStyle,
  onUpdateAnimation,
  onUpdateBackground,
  onCustomFontUploaded,
  onUpdateProject,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'typography' | 'background' | 'overlay' | 'actions'>('typography');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isAutoCreating, setIsAutoCreating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fontFileInputRef = useRef<HTMLInputElement | null>(null);
  const singleBgInputRef = useRef<HTMLInputElement | null>(null);
  const timelineBgInputRef = useRef<HTMLInputElement | null>(null);
  const bgVideoInputRef = useRef<HTMLInputElement | null>(null);
  const overlayVideoInputRef = useRef<HTMLInputElement | null>(null);

  const { textStyle, animationStyle, background } = project;
  const bgSource = background.bgSource || 'single';
  const quranLocked = background.quranLock ?? true;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Font upload
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
        showToast('✍️ Custom font uploaded and registered successfully!');
      } catch (err) {
        alert('Could not parse font. Please ensure it is a valid .ttf or .otf file.');
      }
    }
  };

  // Template selector
  const handleApplyTemplate = (tpl: typeof QURANIC_TEMPLATES[0]) => {
    onUpdateTextStyle({
      fontFamily: tpl.family || "'Playfair Display', serif",
      fontName: tpl.name.split(' ').slice(1).join(' '),
    });
    
    onUpdateBackground({
      type: 'image',
      bgSource: 'single',
      mediaUrl: tpl.bg,
      templateId: tpl.id,
    });

    if (onUpdateProject && project.aiDesignerConfig) {
      onUpdateProject({
        aiDesignerConfig: {
          ...project.aiDesignerConfig,
          activeStyle: tpl.style as any,
          colorPalette: tpl.palette as any,
          activeVisualizer: tpl.vis as any,
        },
      });
    }

    showToast(`🕌 Template "${tpl.name}" applied beautifully!`);
  };

  // AI Background Image Generation
  const handleAIGenerateBackground = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingImage(true);
    try {
      const response = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, aspectRatio: '9:16' }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      if (data.url) {
        onUpdateBackground({
          type: 'image',
          mediaUrl: data.url,
          bgSource: 'ai_generate',
        });
        showToast('✨ AI Background generated and applied instantly!');
      }
    } catch (err: any) {
      console.error(err);
      alert('AI Generation Error: ' + (err.message || 'Server did not return image.'));
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // AI Auto Create Full Video Layout
  const handleAIAutoCreate = async () => {
    setIsAutoCreating(true);
    try {
      const response = await fetch('/api/gemini/auto-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verses: project.lyrics.map(l => ({ text: l.text, startTimeMs: l.startTimeMs, endTimeMs: l.endTimeMs })),
          durationMs: project.audioDurationMs || 30000,
          theme: aiPrompt || 'auto',
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      if (data.designConfig && onUpdateProject) {
        onUpdateProject({
          aiDesignerConfig: {
            ...project.aiDesignerConfig,
            activeStyle: 'AI_AUTO',
            colorPalette: data.designConfig.colorPalette,
            activeVisualizer: data.designConfig.activeVisualizer,
            primaryFontFamily: data.designConfig.fontFamily,
            primaryFontName: data.designConfig.fontName,
          } as any,
          background: {
            ...background,
            bgSource: 'multiple',
            timelineImages: data.timelineImages,
          },
        });
        showToast('✨ AI Auto Create finished! Multi-image timeline arranged.');
      }
    } catch (err: any) {
      console.error(err);
      alert('AI Auto Create Error: ' + (err.message || 'Failed to auto create.'));
    } finally {
      setIsAutoCreating(false);
    }
  };

  // Timeline Images Handlers
  const handleAddTimelineSlot = () => {
    const totalMs = project.audioDurationMs || 30000;
    const timeline = background.timelineImages || [];
    const count = timeline.length;
    const slotDuration = count > 0 ? totalMs / (count + 1) : totalMs;

    const newItem: TimelineImageItem = {
      id: `img_${Date.now()}`,
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1080&q=80',
      startTimeMs: count * slotDuration,
      endTimeMs: (count + 1) * slotDuration,
      durationMs: slotDuration,
      zoom: 'slow_in',
      pan: 'none',
      transition: 'fade',
      scale: 1,
      positionX: 50,
      positionY: 50,
    };

    onUpdateBackground({
      timelineImages: [...timeline, newItem],
    });
    showToast('📸 Added new background timeline image slot!');
  };

  const handleUpdateTimelineItem = (id: string, updates: Partial<TimelineImageItem>) => {
    const timeline = background.timelineImages || [];
    onUpdateBackground({
      timelineImages: timeline.map(img => img.id === id ? { ...img, ...updates } : img),
    });
  };

  const handleRemoveTimelineItem = (id: string) => {
    const timeline = background.timelineImages || [];
    onUpdateBackground({
      timelineImages: timeline.filter(img => img.id !== id),
    });
  };

  const handleAutoDistributeTimeline = () => {
    const timeline = background.timelineImages || [];
    if (timeline.length === 0) return;
    const totalMs = project.audioDurationMs || 30000;
    const count = timeline.length;
    const step = totalMs / count;

    onUpdateBackground({
      timelineImages: timeline.map((img, i) => ({
        ...img,
        startTimeMs: Math.round(i * step),
        endTimeMs: Math.round((i + 1) * step),
        durationMs: Math.round(step),
      })),
    });
    showToast('📊 Auto-distributed images evenly over timeline duration!');
  };

  // Upload Local Video Background
  const handleUploadVideoBackground = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdateBackground({
        type: 'video',
        bgSource: 'video',
        videoUrl: url,
        videoFileName: file.name,
        videoLoop: true,
      });
      showToast('🎥 Local background video uploaded!');
    }
  };

  // Upload Overlay Video
  const handleUploadOverlayVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const initialOverlay: OverlayVideoConfig = {
        url,
        fileName: file.name,
        opacity: 0.8,
        brightness: 1.0,
        contrast: 1.0,
        saturation: 1.0,
        scale: 1.0,
        positionX: 50,
        positionY: 50,
        startTimeMs: 0,
        endTimeMs: project.audioDurationMs || 30000,
        blendMode: 'screen',
      };
      onUpdateBackground({
        overlayVideo: initialOverlay,
      });
      showToast('🎞️ Overlay lyric/verse video uploaded!');
    }
  };

  const handleUpdateOverlay = (updates: Partial<OverlayVideoConfig>) => {
    if (background.overlayVideo) {
      onUpdateBackground({
        overlayVideo: { ...background.overlayVideo, ...updates },
      });
    }
  };

  return (
    <div className="max-w-md mx-auto w-full flex-1 flex flex-col pb-8 select-none">
      {/* Quran Accuracy Lock Ribbon */}
      <div className={`mb-3 px-3.5 py-2.5 rounded-2xl border flex items-center justify-between text-xs transition-all ${
        quranLocked 
          ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-300' 
          : 'bg-amber-950/40 border-amber-500/20 text-amber-300'
      }`}>
        <div className="flex items-center gap-2">
          {quranLocked ? (
            <Lock className="w-4 h-4 text-emerald-400" />
          ) : (
            <Unlock className="w-4 h-4 text-amber-400 font-bold" />
          )}
          <div>
            <span className="font-bold">Quran Text Accuracy Lock</span>
            <p className="text-[10px] text-slate-400 leading-tight">Original Arabic/Tamil verses cannot be altered or AI-modified.</p>
          </div>
        </div>
        <button
          onClick={() => onUpdateBackground({ quranLock: !quranLocked })}
          className={`px-3 py-1 rounded-xl text-[10px] font-extrabold border transition ${
            quranLocked 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
          }`}
        >
          {quranLocked ? 'ACTIVE' : 'DISABLED'}
        </button>
      </div>

      {/* Sub Tab Buttons */}
      <div className="mb-4 bg-slate-900/95 border border-slate-800 p-1 rounded-2xl grid grid-cols-4 gap-1 text-[11px] font-bold">
        <button
          onClick={() => setActiveSubTab('typography')}
          className={`py-2 rounded-xl transition ${
            activeSubTab === 'typography' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Style & Fonts
        </button>
        <button
          onClick={() => setActiveSubTab('background')}
          className={`py-2 rounded-xl transition ${
            activeSubTab === 'background' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Backgrounds
        </button>
        <button
          onClick={() => setActiveSubTab('overlay')}
          className={`py-2 rounded-xl transition ${
            activeSubTab === 'overlay' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Video Overlay
        </button>
        <button
          onClick={() => setActiveSubTab('actions')}
          className={`py-2 rounded-xl transition ${
            activeSubTab === 'actions' ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          AI Automation
        </button>
      </div>

      {/* --- SUB TAB 1: TYPOGRAPHY & STYLE --- */}
      {activeSubTab === 'typography' && (
        <div className="space-y-4">
          {/* Preset templates carousel for simple look & feel triggers */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-violet-400" />
              Quick Quranic Templates
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {QURANIC_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleApplyTemplate(tpl)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    background.templateId === tpl.id
                      ? 'bg-violet-600/10 border-violet-500 text-violet-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <span className="block text-xs font-bold text-slate-200">{tpl.name}</span>
                  <span className="block text-[10px] text-slate-400 leading-tight mt-1">{tpl.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Core styling options */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
            {/* Font Select */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Typography Font</span>
                <span className="text-[10px] text-emerald-400">{textStyle.fontName}</span>
              </div>
              <select
                value={textStyle.fontFamily}
                onChange={(e) => {
                  const selected = PRESET_FONTS.find((f) => f.family === e.target.value);
                  onUpdateTextStyle({
                    fontFamily: e.target.value,
                    fontName: selected ? selected.name : textStyle.fontName,
                  });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                {PRESET_FONTS.map((font) => (
                  <option key={font.family} value={font.family}>
                    {font.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Font Size & Weight */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Font Size</span>
                <span className="text-violet-400 font-mono font-bold">{textStyle.fontSize}px</span>
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

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => onUpdateTextStyle({ isItalic: !textStyle.isItalic })}
                className={`py-1.5 rounded-xl text-xs font-semibold border transition ${
                  textStyle.isItalic ? 'bg-violet-600 border-violet-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                Italic Text
              </button>
              <button
                onClick={() => onUpdateTextStyle({ fontWeight: textStyle.fontWeight >= 700 ? 400 : 800 })}
                className={`py-1.5 rounded-xl text-xs font-semibold border transition ${
                  textStyle.fontWeight >= 700 ? 'bg-violet-600 border-violet-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                Bold Text
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SUB TAB 2: BACKGROUND LAYER CONTROLS --- */}
      {activeSubTab === 'background' && (
        <div className="space-y-4">
          {/* Background Source Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-violet-400" />
              Background Source Selector
            </span>
            <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl text-[10px] font-extrabold text-slate-400">
              <button
                onClick={() => onUpdateBackground({ bgSource: 'single', type: 'image' })}
                className={`py-1.5 rounded-lg transition ${bgSource === 'single' ? 'bg-slate-800 text-white' : 'hover:text-slate-200'}`}
              >
                Single Img
              </button>
              <button
                onClick={() => onUpdateBackground({ bgSource: 'multiple', type: 'image' })}
                className={`py-1.5 rounded-lg transition ${bgSource === 'multiple' ? 'bg-slate-800 text-white' : 'hover:text-slate-200'}`}
              >
                Timeline
              </button>
              <button
                onClick={() => onUpdateBackground({ bgSource: 'video', type: 'video' })}
                className={`py-1.5 rounded-lg transition ${bgSource === 'video' ? 'bg-slate-800 text-white' : 'hover:text-slate-200'}`}
              >
                Video bg
              </button>
              <button
                onClick={() => onUpdateBackground({ bgSource: 'ai_generate', type: 'image' })}
                className={`py-1.5 rounded-lg transition ${bgSource === 'ai_generate' ? 'bg-slate-800 text-white' : 'hover:text-slate-200'}`}
              >
                AI Gen
              </button>
            </div>
          </div>

          {/* Dynamic Panel based on selected source */}
          {bgSource === 'single' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-300">Single Background Image</span>
              {background.mediaUrl && (
                <div className="h-28 rounded-xl overflow-hidden border border-slate-800 relative bg-slate-950">
                  <img src={background.mediaUrl} className="w-full h-full object-cover" />
                </div>
              )}
              <button
                onClick={() => singleBgInputRef.current?.click()}
                className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4 text-violet-400" />
                Upload Local Image
              </button>
              <input ref={singleBgInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpdateBackground({ type: 'image', mediaUrl: URL.createObjectURL(file) });
              }} />
            </div>
          )}

          {bgSource === 'multiple' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Multi-Image Chronological Timeline</span>
                <button
                  onClick={handleAutoDistributeTimeline}
                  className="text-[10px] text-amber-400 font-extrabold flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg hover:bg-amber-500/20"
                >
                  <RefreshCw className="w-3 h-3 animate-spin-slow" />
                  AI Auto-Distribute
                </button>
              </div>

              {/* Loop list items */}
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {(background.timelineImages || []).map((img, index) => (
                  <div key={img.id} className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-bold font-mono">Image #{index + 1}</span>
                      <button
                        onClick={() => handleRemoveTimelineItem(img.id)}
                        className="p-1 hover:text-red-400 text-slate-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg border border-slate-800 overflow-hidden shrink-0 bg-slate-900 relative">
                        <img src={img.url} className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-1 grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="block text-slate-400">Start Time (sec)</span>
                          <input
                            type="number"
                            value={img.startTimeMs / 1000}
                            onChange={(e) => handleUpdateTimelineItem(img.id, { startTimeMs: parseFloat(e.target.value) * 1000 })}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5"
                          />
                        </div>
                        <div>
                          <span className="block text-slate-400">End Time (sec)</span>
                          <input
                            type="number"
                            value={img.endTimeMs / 1000}
                            onChange={(e) => handleUpdateTimelineItem(img.id, { endTimeMs: parseFloat(e.target.value) * 1000 })}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Transition effects selectors */}
                    <div className="grid grid-cols-3 gap-1.5 text-[9px] font-semibold text-slate-400">
                      <div>
                        <span className="block text-slate-400 mb-0.5">Zoom</span>
                        <select
                          value={img.zoom || 'none'}
                          onChange={(e) => handleUpdateTimelineItem(img.id, { zoom: e.target.value as any })}
                          className="w-full bg-slate-900 border border-slate-850 rounded py-0.5"
                        >
                          <option value="none">None</option>
                          <option value="slow_in">Slow Zoom In</option>
                          <option value="slow_out">Slow Zoom Out</option>
                        </select>
                      </div>

                      <div>
                        <span className="block text-slate-400 mb-0.5">Pan</span>
                        <select
                          value={img.pan || 'none'}
                          onChange={(e) => handleUpdateTimelineItem(img.id, { pan: e.target.value as any })}
                          className="w-full bg-slate-900 border border-slate-850 rounded py-0.5"
                        >
                          <option value="none">None</option>
                          <option value="left">Pan Left</option>
                          <option value="right">Pan Right</option>
                        </select>
                      </div>

                      <div>
                        <span className="block text-slate-400 mb-0.5">Transition</span>
                        <select
                          value={img.transition || 'none'}
                          onChange={(e) => handleUpdateTimelineItem(img.id, { transition: e.target.value as any })}
                          className="w-full bg-slate-900 border border-slate-850 rounded py-0.5"
                        >
                          <option value="none">None</option>
                          <option value="fade">Cross Fade</option>
                          <option value="slide">Slide Push</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddTimelineSlot}
                className="w-full py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700"
              >
                <Plus className="w-3.5 h-3.5 text-violet-400" />
                Add Timeline Image
              </button>
            </div>
          )}

          {bgSource === 'video' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
              <span className="text-xs font-bold text-slate-300">Background Video Layer</span>
              {background.videoFileName ? (
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-300 font-bold truncate max-w-[160px]">{background.videoFileName}</span>
                  </div>
                  <span className="text-[9px] text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded bg-emerald-500/10 font-bold">ACTIVE LOOP</span>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic">No background video uploaded yet.</p>
              )}

              <button
                onClick={() => bgVideoInputRef.current?.click()}
                className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4 text-violet-400" />
                Upload Background Video
              </button>
              <input ref={bgVideoInputRef} type="file" accept="video/*" className="hidden" onChange={handleUploadVideoBackground} />
            </div>
          )}

          {bgSource === 'ai_generate' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
              <span className="text-xs font-bold text-slate-300">AI Background Image Generator</span>
              <div className="space-y-1.5">
                <span className="block text-[10px] text-slate-400 uppercase tracking-wide">Enter Theme Prompt</span>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Mosque arch against majestic moon and star filled night sky, golden lighting..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-violet-500 min-h-[60px]"
                />
              </div>

              <button
                disabled={isGeneratingImage || !aiPrompt.trim()}
                onClick={handleAIGenerateBackground}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGeneratingImage ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Generate and Set Background</span>
              </button>
            </div>
          )}

          {/* Common dimming overlay controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Dark Dimming Contrast Mask</span>
              <span className="text-violet-400 font-mono font-bold">{Math.round(background.overlayOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.9"
              step="0.05"
              value={background.overlayOpacity}
              onChange={(e) => onUpdateBackground({ overlayOpacity: parseFloat(e.target.value) })}
              className="w-full accent-violet-500"
            />
          </div>
        </div>
      )}

      {/* --- SUB TAB 3: BLACK-BACKGROUND LYRIC OVERLAY --- */}
      {activeSubTab === 'overlay' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Tv className="w-4 h-4 text-violet-400" />
              Black-Background Verse Overlay
            </h3>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Upload a verse video recorded on a black background. The screen blend mode will discard black pixels, overlaying beautiful pre-rendered text exactly over your scenery.
            </p>

            {background.overlayVideo && background.overlayVideo.fileName ? (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="w-4.5 h-4.5 text-emerald-400" />
                    <span className="font-bold truncate max-w-[150px] text-slate-300">{background.overlayVideo.fileName}</span>
                  </div>
                  <button
                    onClick={() => onUpdateBackground({ overlayVideo: undefined })}
                    className="text-[10px] text-red-400 font-extrabold hover:underline"
                  >
                    Remove Overlay
                  </button>
                </div>

                {/* Blend Mode */}
                <div className="space-y-1 pt-2 border-t border-slate-900">
                  <span className="block text-[10px] text-slate-400">Blend Mode Filter</span>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold text-slate-400">
                    {(['screen', 'lighten', 'normal'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => handleUpdateOverlay({ blendMode: mode })}
                        className={`py-1 rounded-lg border transition capitalize ${
                          background.overlayVideo?.blendMode === mode
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                            : 'bg-slate-900 border-slate-850 hover:text-slate-200'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transparency / Opacity */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">Opacity / Transparency</span>
                    <span className="text-emerald-400 font-mono font-bold">{Math.round((background.overlayVideo.opacity ?? 1) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={background.overlayVideo.opacity}
                    onChange={(e) => handleUpdateOverlay({ opacity: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                </div>

                {/* Scale */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">Scale / Zoom</span>
                    <span className="text-emerald-400 font-mono font-bold">{Math.round((background.overlayVideo.scale ?? 1) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.05"
                    value={background.overlayVideo.scale}
                    onChange={(e) => handleUpdateOverlay({ scale: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                </div>

                {/* Position Y offset */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">Vertical Offset (Y Coordinate)</span>
                    <span className="text-emerald-400 font-mono font-bold">{background.overlayVideo.positionY}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={background.overlayVideo.positionY}
                    onChange={(e) => handleUpdateOverlay({ positionY: parseInt(e.target.value, 10) })}
                    className="w-full accent-emerald-500"
                  />
                </div>

                {/* Micro adjustments */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div>
                    <span className="block text-[9px] text-slate-400 mb-0.5">Brightness</span>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={background.overlayVideo.brightness}
                      onChange={(e) => handleUpdateOverlay({ brightness: parseFloat(e.target.value) })}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400 mb-0.5">Contrast</span>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={background.overlayVideo.contrast}
                      onChange={(e) => handleUpdateOverlay({ contrast: parseFloat(e.target.value) })}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400 mb-0.5">Saturation</span>
                    <input
                      type="range"
                      min="0.0"
                      max="2.0"
                      step="0.1"
                      value={background.overlayVideo.saturation}
                      onChange={(e) => handleUpdateOverlay({ saturation: parseFloat(e.target.value) })}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 italic">No black background overlay loaded yet.</p>
            )}

            <button
              onClick={() => overlayVideoInputRef.current?.click()}
              className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4 text-violet-400" />
              Upload Overlay Video
            </button>
            <input ref={overlayVideoInputRef} type="file" accept="video/*" className="hidden" onChange={handleUploadOverlayVideo} />
          </div>
        </div>
      )}

      {/* --- SUB TAB 4: AI AUTO CREATE CONTROLS --- */}
      {activeSubTab === 'actions' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-2 text-violet-400">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-100">✨ AI Auto-Produce Video</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Input a thematic direction. The AI will analyze your recitation timing, automatically arrange beautiful high-contrast background sceneries, assign elegant typography, set the visualizer, and apply matching cinematic camera motions in one click.
            </p>

            <div className="space-y-1.5">
              <span className="block text-[10px] text-slate-400">Thematic Focus / Prompts</span>
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., Starry desert night, crescent moon, sacred golden..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-violet-500"
              />
            </div>

            <button
              disabled={isAutoCreating}
              onClick={handleAIAutoCreate}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isAutoCreating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>AI AUTO CREATE ENTIRE VIDEO</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
