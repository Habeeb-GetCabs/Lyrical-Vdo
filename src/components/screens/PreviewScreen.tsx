import React, { useRef, useEffect } from 'react';
import { ProjectData } from '../../types/project';
import { WaveformEditor } from '../waveform/WaveformEditor';
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
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { textStyle, animationStyle, background } = project;
  const isAutoMode = project.animationMode === 'auto';
  const autoConfig = project.autoAnimationConfig;

  // Find active line
  const activeLineIndex = project.lyrics.findIndex(
    (l) => currentTimeMs >= l.startTimeMs && currentTimeMs <= l.endTimeMs
  );
  const activeLine = activeLineIndex !== -1 ? project.lyrics[activeLineIndex] : null;

  // Active line auto-animation config
  const lineAutoAnim =
    isAutoMode && activeLine && autoConfig?.timeline
      ? autoConfig.timeline.find((t) => t.lineId === activeLine.id)
      : null;

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
        {/* Background Image / Color */}
        {background.type === 'image' && background.mediaUrl ? (
          <img
            src={background.mediaUrl}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover transition-all"
            style={{
              filter: background.blur > 0 ? `blur(${background.blur}px)` : 'none',
              opacity: background.opacity,
            }}
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

        {/* Synchronized Animated Lyric Typography */}
        <div
          className={`absolute inset-x-6 z-10 pointer-events-none flex flex-col transition-all duration-200 ${positionClasses}`}
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
              {/* Karaoke Word-by-Word highlighting vs Line rendering */}
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
          ) : (
            <div className="text-slate-400 text-xs italic bg-black/60 px-3 py-1.5 rounded-full border border-slate-700/50 backdrop-blur-sm">
              Lyrics will animate here in sync with audio
            </div>
          )}
        </div>

        {/* Top Floating Badge & Fullscreen Button */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-auto">
          <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {isAutoMode ? '✨ Auto Animate Active' : 'Manual 9:16 Preview'}
            </span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

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
