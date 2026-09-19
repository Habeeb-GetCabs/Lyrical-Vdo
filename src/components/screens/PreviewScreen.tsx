import React, { useRef, useEffect, useState } from 'react';
import { ProjectData, ColorPalettePreset, COLOR_PALETTE_PRESETS, MusicVisualizerType } from '../../types/project';
import { WaveformEditor } from '../waveform/WaveformEditor';
import { MusicVisualizerRenderer } from '../../services/musicVisualizerRenderer';
import { AILyricVisualDesigner } from '../../services/aiLyricVisualDesigner';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  Maximize2,
  Minimize2,
  Sparkles,
  Download,
  Sliders,
  Palette,
  Music,
  Zap,
  Moon,
  RefreshCw,
} from 'lucide-react';

interface PreviewScreenProps {
  project: ProjectData;
  currentTimeMs: number;
  durationMs: number;
  isPlaying: boolean;
  onSeek: (ms: number) => void;
  onTogglePlay: () => void;
  audioBlob: Blob | null;
  onNavigateToTab: (tab: any) => void;
  onUpdateProject?: (updates: Partial<ProjectData>) => void;
}

export const PreviewScreen: React.FC<PreviewScreenProps> = ({
  project,
  currentTimeMs,
  durationMs,
  isPlaying,
  onSeek,
  onTogglePlay,
  audioBlob,
  onNavigateToTab,
  onUpdateProject,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const visualizerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const overlayVideoRef = useRef<HTMLVideoElement | null>(null);

  const { textStyle, animationStyle, background } = project;
  const isAutoMode = project.animationMode === 'auto';
  const autoConfig = project.autoAnimationConfig;
  const aiDesigner = project.aiDesignerConfig;
  const bgSource = background.bgSource || 'single';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Find active timeline background image
  let activeTimelineImage: any = null;
  if (bgSource === 'multiple' && background.timelineImages && background.timelineImages.length > 0) {
    activeTimelineImage = background.timelineImages.find(
      (img) => currentTimeMs >= img.startTimeMs && currentTimeMs <= img.endTimeMs
    ) || background.timelineImages[0];
  }

  // Sync background video element
  useEffect(() => {
    const video = bgVideoRef.current;
    if (video) {
      if (isPlaying) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
      const dur = video.duration;
      if (dur && dur > 0) {
        const targetSec = (currentTimeMs / 1000) % dur;
        if (Math.abs(video.currentTime - targetSec) > 0.4) {
          video.currentTime = targetSec;
        }
      }
    }
  }, [currentTimeMs, isPlaying]);

  // Sync overlay video element
  useEffect(() => {
    const video = overlayVideoRef.current;
    if (video) {
      if (isPlaying) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
      const dur = video.duration;
      if (dur && dur > 0) {
        const targetSec = (currentTimeMs / 1000) % dur;
        if (Math.abs(video.currentTime - targetSec) > 0.4) {
          video.currentTime = targetSec;
        }
      }
    }
  }, [currentTimeMs, isPlaying]);

  // Find active line
  const activeLineIndex = project.lyrics.findIndex(
    (l) => currentTimeMs >= l.startTimeMs && currentTimeMs <= l.endTimeMs
  );
  const activeLine = activeLineIndex !== -1 ? project.lyrics[activeLineIndex] : null;
  const activeLineDesign = activeLine && aiDesigner?.lines ? aiDesigner.lines[activeLine.id] : null;

  // Active line auto-animation config
  const lineAutoAnim =
    isAutoMode && activeLine && autoConfig?.timeline
      ? autoConfig.timeline.find((t) => t.lineId === activeLine.id)
      : null;

  // Real-time canvas music visualizer rendering (active during gaps & subtle in background)
  useEffect(() => {
    const canvas = visualizerCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (aiDesigner) {
      const isGap = !activeLine;
      const shouldRender = isGap || aiDesigner.visualizerPosition === 'bottom';

      if (shouldRender) {
        MusicVisualizerRenderer.render({
          ctx,
          width: canvas.width,
          height: canvas.height,
          timeMs: currentTimeMs,
          visualizerType: aiDesigner.activeVisualizer,
          primaryColor: aiDesigner.primaryColor,
          accentColor: aiDesigner.accentColor,
          glowColor: aiDesigner.glowColor,
          energy: aiDesigner.visualEnergy,
          position: aiDesigner.visualizerPosition,
          opacity: isGap ? 0.95 : 0.28,
          isGap,
        });
      }
    }
  }, [currentTimeMs, isPlaying, activeLine, aiDesigner]);

  // Compute CSS animation class for the active line
  let animationClass = '';
  let autoDynamicStyle: React.CSSProperties = {};

  if (isAutoMode && lineAutoAnim) {
    switch (lineAutoAnim.motionEffect) {
      case 'PUNCH':
        animationClass = 'animate-auto-punch';
        break;
      case 'POP_ACCENT':
        animationClass = 'animate-auto-pop';
        break;
      case 'DRIFT':
        animationClass = 'animate-auto-drift';
        break;
      case 'FLOAT':
        animationClass = 'animate-auto-float';
        break;
      case 'PULSE':
        animationClass = 'animate-auto-pulse';
        break;
      case 'ZOOM_IN':
        animationClass = 'animate-zoom';
        break;
      case 'FADE_SLOW':
        animationClass = 'animate-auto-fade-slow';
        break;
      default:
        animationClass = 'animate-fade-in';
    }

    if (lineAutoAnim.glowIntensity > 0.4) {
      autoDynamicStyle.filter = `drop-shadow(0 0 ${lineAutoAnim.glowIntensity * 12}px ${
        textStyle.highlightColor || '#F59E0B'
      })`;
    }
  } else {
    // Manual animation style
    if (animationStyle === 'FADE') animationClass = 'animate-fade-in';
    else if (animationStyle === 'SLIDE') animationClass = 'animate-slide-up';
    else if (animationStyle === 'ZOOM' || animationStyle === 'SCALE') animationClass = 'animate-zoom';
    else if (animationStyle === 'BOUNCE') animationClass = 'animate-bounce';
  }

  // Camera Motion calculations for background image
  const motion = aiDesigner?.backgroundMotion;
  const songProgress = Math.min(1, Math.max(0, currentTimeMs / (durationMs || 30000)));
  let bgTransform = 'scale(1.0)';
  if (motion) {
    const beatBump = Math.sin((currentTimeMs / 1000) * 4) > 0.85 ? 0.02 : 0;
    if (motion.type === 'SLOW_ZOOM_IN') {
      bgTransform = `scale(${1.0 + songProgress * 0.12 + beatBump})`;
    } else if (motion.type === 'SLOW_ZOOM_OUT') {
      bgTransform = `scale(${1.12 - songProgress * 0.12 + beatBump})`;
    } else if (motion.type === 'PAN_HORIZONTAL') {
      const panX = Math.sin(songProgress * Math.PI * 2) * 18;
      bgTransform = `scale(1.08) translateX(${panX}px)`;
    } else if (motion.type === 'PAN_VERTICAL') {
      const panY = Math.sin(songProgress * Math.PI * 2) * 18;
      bgTransform = `scale(1.08) translateY(${panY}px)`;
    } else {
      bgTransform = `scale(${1.04 + beatBump * 1.4})`;
    }
  }

  // Quick Action AI handlers
  const handleQuickAIGenerate = () => {
    if (!onUpdateProject) return;
    const newConfig = AILyricVisualDesigner.generateDesign(project);
    onUpdateProject({ aiDesignerConfig: newConfig });
    showToast('✨ AI Cinematic Design regenerated!');
  };

  const handleQuickCycleColors = () => {
    if (!onUpdateProject || !aiDesigner) return;
    const palettes = Object.keys(COLOR_PALETTE_PRESETS) as ColorPalettePreset[];
    const nextPal = palettes[(palettes.indexOf(aiDesigner.colorPalette) + 1) % palettes.length];
    const updated = AILyricVisualDesigner.regenerateColors(aiDesigner, nextPal);
    onUpdateProject({ aiDesignerConfig: updated });
    showToast(`🎨 Color Palette: ${COLOR_PALETTE_PRESETS[nextPal].name}`);
  };

  const handleQuickCycleVisualizer = () => {
    if (!onUpdateProject || !aiDesigner) return;
    const allVis: MusicVisualizerType[] = [
      'WAVEFORM',
      'AUDIO_EQUALIZER',
      'CIRCULAR_EQUALIZER',
      'AUDIO_RINGS',
      'PARTICLE_PULSE',
      'GLOW_PULSE',
      'BASS_PULSE',
      'EDGE_VISUALIZER',
      'WAVE_LINES',
      'MINIMAL_DOT_VISUALIZER',
    ];
    const nextVis = allVis[(allVis.indexOf(aiDesigner.activeVisualizer) + 1) % allVis.length];
    const updated = AILyricVisualDesigner.regenerateVisualizer(aiDesigner, nextVis);
    onUpdateProject({ aiDesignerConfig: updated });
    showToast(`🎵 Visualizer: ${nextVis.replace('_', ' ')}`);
  };

  const handleQuickDynamic = () => {
    if (!onUpdateProject || !aiDesigner) return;
    const updated = AILyricVisualDesigner.setVisualEnergy(aiDesigner, 90);
    onUpdateProject({ aiDesignerConfig: updated });
    showToast('⚡ Dynamic Mode: 90% energy');
  };

  const handleQuickCinematic = () => {
    if (!onUpdateProject || !aiDesigner) return;
    const updated = AILyricVisualDesigner.setVisualEnergy(aiDesigner, 35);
    onUpdateProject({ aiDesignerConfig: updated });
    showToast('🌙 Cinematic Mode: atmospheric float');
  };

  // Toggle fullscreen on video card
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const formatTime = (ms: number) => {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const cs = Math.floor((ms % 1000) / 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
  };

  // Compute vertical Y position class/style
  let positionClasses = 'top-1/2 -translate-y-1/2';
  let customStyle: React.CSSProperties = {};
  if (textStyle.verticalPosition === 'top') {
    positionClasses = 'top-12';
  } else if (textStyle.verticalPosition === 'bottom') {
    positionClasses = 'bottom-16';
  } else if (textStyle.verticalPosition === 'custom') {
    positionClasses = '';
    customStyle = { top: `${textStyle.customYPercent || 50}%`, transform: 'translateY(-50%)' };
  }

  return (
    <div className="max-w-md mx-auto w-full flex-1 flex flex-col pb-8 select-none">
      {/* Workflow Mode Comparison Selector: Option A (Manual) vs Option B (Auto Animate) */}
      <div className="mb-2.5 bg-slate-900/90 rounded-2xl border border-slate-800 p-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 pl-1.5">
          <span className="text-[11px] font-semibold text-slate-400">Workflow:</span>
          {isAutoMode && lineAutoAnim && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-500/30 font-semibold truncate max-w-[130px]">
              ✨ {lineAutoAnim.motionEffect}
            </span>
          )}
        </div>

        <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-[11px]">
          <button
            onClick={() => onUpdateProject?.({ animationMode: 'manual' })}
            className={`px-2.5 py-1 rounded-lg font-semibold transition ${
              !isAutoMode
                ? 'bg-slate-700 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            A: Manual
          </button>
          <button
            onClick={() => onUpdateProject?.({ animationMode: 'auto' })}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
              isAutoMode
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>B: Auto Animate</span>
          </button>
        </div>
      </div>

      {/* 9:16 Aspect Ratio Canvas Card */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-[360px] max-h-[580px] w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center select-none"
      >
        {/* Background Image / Color with Cinematic Camera Motion */}
        {bgSource === 'multiple' && activeTimelineImage ? (
          <img
            src={activeTimelineImage.url}
            alt="Timeline Background"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out"
            style={{
              filter: background.blur > 0 ? `blur(${background.blur}px)` : 'none',
              opacity: background.opacity,
              transform: bgTransform,
            }}
            referrerPolicy="no-referrer"
          />
        ) : bgSource === 'video' && background.videoUrl ? (
          <video
            ref={bgVideoRef}
            src={background.videoUrl}
            muted
            playsInline
            loop
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              filter: background.blur > 0 ? `blur(${background.blur}px)` : 'none',
              opacity: background.opacity,
            }}
          />
        ) : (background.type === 'image' || bgSource === 'single' || bgSource === 'ai_generate') && background.mediaUrl ? (
          <img
            src={background.mediaUrl}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out"
            style={{
              filter: background.blur > 0 ? `blur(${background.blur}px)` : 'none',
              opacity: background.opacity,
              transform: bgTransform,
            }}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: background.gradient || background.color || '#0F172A',
            }}
          />
        )}

        {/* Contrast Overlay Layer */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: background.overlayColor || '#000000',
            opacity: background.overlayOpacity ?? 0.4,
          }}
        />

        {/* Dynamic Black-Background Verse Lyric Overlay with Blend Modes */}
        {background.overlayVideo && background.overlayVideo.url && (
          <video
            ref={overlayVideoRef}
            src={background.overlayVideo.url}
            muted
            playsInline
            loop
            className="absolute pointer-events-none origin-center"
            style={{
              mixBlendMode: background.overlayVideo.blendMode === 'screen'
                ? 'screen'
                : background.overlayVideo.blendMode === 'lighten'
                ? 'lighten'
                : 'normal',
              opacity: background.overlayVideo.opacity ?? 0.8,
              filter: `
                brightness(${background.overlayVideo.brightness ?? 1.0})
                contrast(${background.overlayVideo.contrast ?? 1.0})
                saturate(${background.overlayVideo.saturation ?? 1.0})
              `,
              transform: `
                translate(
                  calc(-50% + ${(background.overlayVideo.positionX ?? 50) - 50}%),
                  calc(-50% + ${(background.overlayVideo.positionY ?? 50) - 50}%)
                )
                scale(${background.overlayVideo.scale ?? 1.0})
              `,
              left: '50%',
              top: '50%',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              zIndex: 8,
            }}
          />
        )}

        {/* Real-time Music Visualizer Canvas (Active in Instrumental Gaps) */}
        <canvas
          ref={visualizerCanvasRef}
          width={360}
          height={640}
          className="absolute inset-0 w-full h-full pointer-events-none z-5"
        />

        {/* Synchronized Animated Lyric Typography */}
        <div
          className={`absolute inset-x-4 z-10 pointer-events-none flex flex-col transition-all duration-200 ${positionClasses}`}
          style={{
            ...customStyle,
            alignItems:
              textStyle.alignment === 'left'
                ? 'flex-start'
                : textStyle.alignment === 'right'
                ? 'flex-end'
                : 'center',
          }}
        >
          {activeLine ? (
            activeLineDesign && activeLineDesign.words && activeLineDesign.words.length > 0 ? (
              /* AI Lyric Visual Designer Dynamic Tamil Typography */
              <div
                key={activeLine.id}
                className={`transition-all text-center flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 px-2 ${animationClass}`}
              >
                {activeLineDesign.words.map((w, idx) => {
                  const rawWordTimings = activeLine.words || [];
                  const timing = rawWordTimings[idx];
                  const lineProgress = Math.max(
                    0,
                    Math.min(
                      1,
                      (currentTimeMs - activeLine.startTimeMs) /
                        (activeLine.endTimeMs - activeLine.startTimeMs)
                    )
                  );
                  const isSung = timing
                    ? currentTimeMs >= timing.endTimeMs
                    : lineProgress > idx / activeLineDesign.words.length;
                  const isCurrent = timing
                    ? currentTimeMs >= timing.startTimeMs && currentTimeMs < timing.endTimeMs
                    : lineProgress >= idx / activeLineDesign.words.length &&
                      lineProgress < (idx + 1) / activeLineDesign.words.length;

                  let sizeClass = 'text-base font-bold';
                  let pixelSize = 26;
                  if (w.sizeTier === 'small') {
                    sizeClass = 'text-xs sm:text-sm font-medium opacity-85';
                    pixelSize = 19;
                  } else if (w.sizeTier === 'large') {
                    sizeClass = 'text-lg sm:text-2xl font-extrabold';
                    pixelSize = 34;
                  } else if (w.sizeTier === 'very_large') {
                    sizeClass = 'text-2xl sm:text-3xl font-black scale-105';
                    pixelSize = 42;
                  }

                  const activeColor =
                    isCurrent || isSung
                      ? aiDesigner?.accentColor || textStyle.highlightColor || '#F59E0B'
                      : w.color || textStyle.textColor || '#FFFFFF';

                  return (
                    <span
                      key={w.wordId || `w_${idx}`}
                      className={`inline-block transition-all duration-100 ${sizeClass}`}
                      style={{
                        fontFamily: w.fontFamily || textStyle.fontFamily,
                        fontSize: `${pixelSize}px`,
                        color: activeColor,
                        transform: `rotate(${w.rotationDeg}deg) scale(${isCurrent ? 1.12 : 1.0})`,
                        textShadow:
                          w.effect === 'glow' || isCurrent
                            ? `0 0 16px ${aiDesigner?.glowColor || '#F59E0B'}, 0 3px 6px rgba(0,0,0,0.9)`
                            : `0 2px 8px rgba(0,0,0,0.9)`,
                        WebkitTextStroke: textStyle.hasStroke
                          ? `${Math.max(1, textStyle.strokeWidth * 0.7)}px ${
                              textStyle.strokeColor || '#000000'
                            }`
                          : 'none',
                      }}
                    >
                      {w.word}
                    </span>
                  );
                })}
              </div>
            ) : (
              /* Standard / Manual / Auto Line rendering */
              <div
                key={activeLine.id}
                className={`transition-all text-center ${animationClass}`}
                style={{
                  fontFamily: textStyle.fontFamily,
                  fontSize: `${textStyle.fontSize}px`,
                  fontWeight: textStyle.fontWeight,
                  fontStyle: textStyle.isItalic ? 'italic' : 'normal',
                  letterSpacing: `${textStyle.letterSpacing}px`,
                  lineHeight: textStyle.lineSpacing,
                  textAlign: textStyle.alignment,
                  textShadow: textStyle.hasShadow
                    ? `0 ${textStyle.shadowBlur / 3}px ${textStyle.shadowBlur}px ${
                        textStyle.shadowColor || 'rgba(0,0,0,0.9)'
                      }`
                    : 'none',
                  WebkitTextStroke: textStyle.hasStroke
                    ? `${textStyle.strokeWidth}px ${textStyle.strokeColor || '#000'}`
                    : 'none',
                  ...autoDynamicStyle,
                }}
              >
                {activeLine.words && activeLine.words.length > 0 ? (
                  <span className="inline-flex flex-wrap justify-center gap-x-1.5">
                    {activeLine.words.map((w) => {
                      const isSung = currentTimeMs >= w.endTimeMs;
                      const isCurrent =
                        currentTimeMs >= w.startTimeMs && currentTimeMs < w.endTimeMs;

                      return (
                        <span
                          key={w.id}
                          className="transition-colors duration-100"
                          style={{
                            color:
                              isCurrent || isSung
                                ? textStyle.highlightColor
                                : textStyle.textColor,
                          }}
                        >
                          {w.word}
                        </span>
                      );
                    })}
                  </span>
                ) : (
                  <span style={{ color: textStyle.textColor }}>{activeLine.text}</span>
                )}
              </div>
            )
          ) : (
            /* Instrumental Gap Indicator */
            <div className="flex flex-col items-center gap-1.5">
              <div className="text-amber-300 text-xs font-bold bg-black/70 px-3.5 py-1.5 rounded-full border border-amber-500/40 backdrop-blur-md shadow-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>
                  🎵 Instrumental Music •{' '}
                  {aiDesigner?.activeVisualizer.replace('_', ' ') || 'Visualizer'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Top Floating Badge & Fullscreen Button */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-auto">
          <div className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 text-[10px] text-slate-300 flex items-center gap-1.5 shadow">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">
              {aiDesigner ? `✨ ${aiDesigner.activeStyle.replace('_', ' ')}` : 'Manual Preview'}
            </span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white transition shadow"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Quick AI Lyric Designer Action Bar (Direct one-tap adjustments) */}
      <div className="mt-2.5 bg-slate-900/90 rounded-2xl border border-slate-800 p-2 space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI Designer Controls
          </span>
          <button
            onClick={() => onNavigateToTab('ai_designer')}
            className="text-[10px] font-bold text-slate-300 hover:text-amber-300 transition"
          >
            Open Full Designer →
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-[11px] font-bold">
          <button
            onClick={handleQuickAIGenerate}
            className="py-1.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-1 shadow transition active:scale-95"
            title="Regenerate full AI visual design (preserves Gemini sync timing)"
          >
            <Sparkles className="w-3 h-3 shrink-0" />
            <span className="truncate">AI Auto</span>
          </button>

          <button
            onClick={handleQuickCycleColors}
            className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1 transition"
            title="Change color palette and word accents"
          >
            <Palette className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">Colors</span>
          </button>

          <button
            onClick={handleQuickCycleVisualizer}
            className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1 transition"
            title="Cycle active music visualizer for gaps"
          >
            <Music className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">Visualizer</span>
          </button>

          <button
            onClick={handleQuickDynamic}
            className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1 transition"
            title="Make animations more dynamic & punchy"
          >
            <Zap className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">Dynamic</span>
          </button>

          <button
            onClick={handleQuickCinematic}
            className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1 transition"
            title="Atmospheric floating cinematic transitions"
          >
            <Moon className="w-3 h-3 text-violet-400 shrink-0" />
            <span className="truncate">Cinematic</span>
          </button>

          <button
            onClick={() => onNavigateToTab('ai_designer')}
            className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1 transition"
            title="Tamil font library & styles"
          >
            <Sliders className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">Designer</span>
          </button>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-slate-950 px-3.5 py-1.5 rounded-full font-bold text-xs shadow-2xl flex items-center gap-1.5 border border-amber-300 animate-bounce">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Waveform Scrubber with Playhead */}
      <div className="mt-3">
        <WaveformEditor
          currentTimeMs={currentTimeMs}
          durationMs={durationMs}
          isPlaying={isPlaying}
          onSeek={onSeek}
          onTogglePlay={onTogglePlay}
          lyricLines={project.lyrics}
          activeLineIndex={activeLineIndex}
          audioBlob={audioBlob}
        />
      </div>

      {/* Quick Transport Controls */}
      <div className="mt-3 bg-slate-900/90 rounded-2xl border border-slate-800 p-3 flex items-center justify-between text-xs">
        <span className="text-amber-400 font-mono font-bold">{formatTime(currentTimeMs)}</span>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onSeek(Math.max(0, currentTimeMs - 5000))}
            className="p-2 text-slate-400 hover:text-slate-200 transition"
            title="Rewind 5s"
          >
            <Rewind className="w-4 h-4" />
          </button>

          <button
            onClick={onTogglePlay}
            className="w-11 h-11 rounded-full bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center shadow-lg transition active:scale-95"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <button
            onClick={() => onSeek(Math.min(durationMs, currentTimeMs + 5000))}
            className="p-2 text-slate-400 hover:text-slate-200 transition"
            title="Fast Forward 5s"
          >
            <FastForward className="w-4 h-4" />
          </button>
        </div>

        <span className="text-slate-400 font-mono">{formatTime(durationMs)}</span>
      </div>

      {/* Quick Action Navigation Bar */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => onNavigateToTab('style')}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>Edit Design & Fonts</span>
        </button>

        <button
          onClick={() => onNavigateToTab('export')}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 text-xs font-bold shadow-md transition active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Video & LRC</span>
        </button>
      </div>
    </div>
  );
};
