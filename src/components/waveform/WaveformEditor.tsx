import React, { useRef, useEffect, useState, useMemo } from 'react';
import { LyricLine } from '../../types/project';
import { ZoomIn, ZoomOut, Play, Pause, RotateCcw } from 'lucide-react';

interface WaveformEditorProps {
  currentTimeMs: number;
  durationMs: number;
  isPlaying: boolean;
  onSeek: (timeMs: number) => void;
  onTogglePlay: () => void;
  lyricLines: LyricLine[];
  activeLineIndex: number;
  audioBlob?: Blob | null;
}

export const WaveformEditor: React.FC<WaveformEditorProps> = ({
  currentTimeMs,
  durationMs,
  isPlaying,
  onSeek,
  onTogglePlay,
  lyricLines,
  activeLineIndex,
  audioBlob,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [peaks, setPeaks] = useState<number[]>([]);

  // Synthesize or decode real audio peaks
  useEffect(() => {
    let cancelled = false;

    if (audioBlob) {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioBlob
        .arrayBuffer()
        .then((buf) => audioCtx.decodeAudioData(buf))
        .then((decoded) => {
          if (cancelled) return;
          const channelData = decoded.getChannelData(0);
          const sampleCount = 200;
          const blockSize = Math.floor(channelData.length / sampleCount);
          const computedPeaks: number[] = [];
          for (let i = 0; i < sampleCount; i++) {
            let max = 0;
            const start = i * blockSize;
            for (let j = 0; j < blockSize; j += 10) {
              const val = Math.abs(channelData[start + j] || 0);
              if (val > max) max = val;
            }
            computedPeaks.push(Math.min(1, max * 1.5));
          }
          setPeaks(computedPeaks);
        })
        .catch(() => {
          // Fallback to generated peaks
          generateFallbackPeaks();
        });
    } else {
      generateFallbackPeaks();
    }

    function generateFallbackPeaks() {
      const generated: number[] = [];
      const totalBars = 200;
      for (let i = 0; i < totalBars; i++) {
        const rad = (i / totalBars) * Math.PI * 6;
        const val = 0.25 + Math.abs(Math.sin(rad) * 0.4 + Math.sin(rad * 2.7) * 0.25 + Math.cos(rad * 0.5) * 0.1);
        generated.push(Math.min(0.95, val));
      }
      setPeaks(generated);
    }

    return () => {
      cancelled = true;
    };
  }, [audioBlob]);

  // Handle click to seek
  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollLeft = containerRef.current.scrollLeft;
    const clickX = e.clientX - rect.left + scrollLeft;
    const totalWidth = containerRef.current.scrollWidth;
    const ratio = Math.max(0, Math.min(1, clickX / totalWidth));
    onSeek(Math.round(ratio * durationMs));
  };

  // Auto-scroll waveform when playing
  useEffect(() => {
    if (isPlaying && containerRef.current) {
      const progress = durationMs > 0 ? currentTimeMs / durationMs : 0;
      const totalWidth = containerRef.current.scrollWidth;
      const targetScroll = progress * totalWidth - containerRef.current.clientWidth / 2;
      containerRef.current.scrollLeft = Math.max(0, targetScroll);
    }
  }, [currentTimeMs, durationMs, isPlaying]);

  const progressRatio = durationMs > 0 ? Math.min(1, currentTimeMs / durationMs) : 0;

  return (
    <div className="bg-slate-900/95 rounded-2xl border border-slate-800 p-3 shadow-xl backdrop-blur-md">
      {/* Top Controls: Zoom and Playhead indicators */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium shadow transition"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
          <button
            onClick={() => onSeek(0)}
            className="p-1 text-slate-400 hover:text-slate-200"
            title="Reset to 0:00"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Zoom: {zoom}x</span>
          <button
            onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
            disabled={zoom <= 1}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(4, z + 0.5))}
            disabled={zoom >= 4}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable Waveform Canvas View */}
      <div
        ref={containerRef}
        onClick={handleWaveformClick}
        className="relative h-24 w-full overflow-x-auto overflow-y-hidden cursor-pointer bg-slate-950/70 rounded-xl border border-slate-800/60 select-none scrollbar-thin scrollbar-thumb-slate-700"
      >
        <div
          className="relative h-full flex items-center px-4"
          style={{ width: `${zoom * 100}%`, minWidth: '100%' }}
        >
          {/* Lyric Line Markers Region */}
          {lyricLines.map((line, idx) => {
            const startRatio = durationMs > 0 ? line.startTimeMs / durationMs : 0;
            const endRatio = durationMs > 0 ? line.endTimeMs / durationMs : 0;
            const leftPercent = startRatio * 100;
            const widthPercent = Math.max(1, (endRatio - startRatio) * 100);
            const isActive = idx === activeLineIndex;

            return (
              <div
                key={line.id}
                className={`absolute top-1 bottom-1 rounded border pointer-events-none transition-colors ${
                  isActive
                    ? 'bg-violet-500/20 border-violet-400 z-10'
                    : 'bg-slate-800/40 border-slate-700/60'
                }`}
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                }}
              >
                <div
                  className={`text-[9px] px-1 truncate font-mono ${
                    isActive ? 'text-violet-300 font-bold' : 'text-slate-500'
                  }`}
                >
                  L{idx + 1}
                </div>
              </div>
            );
          })}

          {/* Waveform Bars */}
          <div className="w-full h-16 flex items-center gap-[2px] z-0">
            {peaks.map((peak, idx) => {
              const barProgress = idx / peaks.length;
              const isPlayed = barProgress <= progressRatio;

              return (
                <div
                  key={idx}
                  className={`flex-1 rounded-full transition-colors duration-75 ${
                    isPlayed ? 'bg-amber-400' : 'bg-slate-700/80 hover:bg-slate-600'
                  }`}
                  style={{
                    height: `${Math.max(12, peak * 100)}%`,
                  }}
                />
              );
            })}
          </div>

          {/* Glowing Vertical Playhead Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400 shadow-[0_0_10px_#f59e0b] z-20 pointer-events-none"
            style={{
              left: `${progressRatio * 100}%`,
            }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 -translate-x-[4px] -translate-y-1 shadow-md" />
          </div>
        </div>
      </div>
    </div>
  );
};
