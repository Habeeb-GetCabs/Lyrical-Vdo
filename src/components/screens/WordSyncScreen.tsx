import React, { useState, useEffect } from 'react';
import { ProjectData, LyricLine, WordTiming } from '../../types/project';
import {
  Sparkles,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Volume2,
} from 'lucide-react';

interface WordSyncScreenProps {
  project: ProjectData;
  onUpdateLyrics: (lyrics: LyricLine[]) => void;
  selectedLineIndex: number;
  onSelectLineIndex: (idx: number) => void;
  currentTimeMs: number;
  durationMs: number;
  isPlaying: boolean;
  onSeek: (ms: number) => void;
  onTogglePlay: () => void;
  onBackToSync: () => void;
}

export const WordSyncScreen: React.FC<WordSyncScreenProps> = ({
  project,
  onUpdateLyrics,
  selectedLineIndex,
  onSelectLineIndex,
  currentTimeMs,
  durationMs,
  isPlaying,
  onSeek,
  onTogglePlay,
  onBackToSync,
}) => {
  const line = project.lyrics[selectedLineIndex] || project.lyrics[0];

  // If words array doesn't exist, generate from space splitting
  const ensureWords = (targetLine: LyricLine): WordTiming[] => {
    if (targetLine.words && targetLine.words.length > 0) {
      return targetLine.words;
    }
    const words = targetLine.text.split(/\s+/).filter((w) => w.length > 0);
    const duration = targetLine.endTimeMs - targetLine.startTimeMs;
    const wordDur = words.length > 0 ? duration / words.length : duration;

    return words.map((w, idx) => ({
      id: `w_${selectedLineIndex}_${idx}`,
      word: w,
      startTimeMs: Math.round(targetLine.startTimeMs + idx * wordDur),
      endTimeMs: Math.round(targetLine.startTimeMs + (idx + 1) * wordDur),
    }));
  };

  const [words, setWords] = useState<WordTiming[]>(() => ensureWords(line));
  const [activeWordTapIndex, setActiveWordTapIndex] = useState<number>(0);
  const [isWordTapActive, setIsWordTapActive] = useState<boolean>(false);

  // Sync state when selectedLineIndex changes
  useEffect(() => {
    if (line) {
      setWords(ensureWords(line));
      setActiveWordTapIndex(0);
      setIsWordTapActive(false);
    }
  }, [selectedLineIndex, line]);

  // Update words back into project.lyrics
  const saveWords = (newWords: WordTiming[]) => {
    setWords(newWords);
    const updatedLyrics = project.lyrics.map((l, idx) => {
      if (idx !== selectedLineIndex) return l;
      return {
        ...l,
        words: newWords,
      };
    });
    onUpdateLyrics(updatedLyrics);
  };

  // Start word-level tap mode
  const startWordTapMode = () => {
    setIsWordTapActive(true);
    setActiveWordTapIndex(0);
    onSeek(Math.max(0, line.startTimeMs - 300));
    if (!isPlaying) onTogglePlay();
  };

  // Record tap for word
  const handleRecordWordTap = () => {
    const nextWords = [...words];
    const currentW = nextWords[activeWordTapIndex];
    if (!currentW) return;

    const start = currentTimeMs;
    currentW.startTimeMs = start;

    // Previous word ends when this starts
    if (activeWordTapIndex > 0) {
      nextWords[activeWordTapIndex - 1].endTimeMs = Math.max(
        nextWords[activeWordTapIndex - 1].startTimeMs + 80,
        start
      );
    }

    // Default end time for this word
    currentW.endTimeMs = start + 500;

    saveWords(nextWords);

    if (activeWordTapIndex + 1 < words.length) {
      setActiveWordTapIndex(activeWordTapIndex + 1);
    } else {
      // Completed line words!
      setIsWordTapActive(false);
      // Auto-advance to next line if available
      if (selectedLineIndex + 1 < project.lyrics.length) {
        onSelectLineIndex(selectedLineIndex + 1);
      }
    }
  };

  // Adjust single word timing
  const adjustWord = (wIdx: number, deltaMs: number) => {
    const nextWords = words.map((w, i) => {
      if (i !== wIdx) return w;
      const newStart = Math.max(line.startTimeMs, w.startTimeMs + deltaMs);
      const newEnd = Math.max(newStart + 80, w.endTimeMs + deltaMs);
      return { ...w, startTimeMs: newStart, endTimeMs: newEnd };
    });
    saveWords(nextWords);
  };

  // Reset words to even slices across line
  const handleResetEven = () => {
    const splitWords = line.text.split(/\s+/).filter((w) => w.length > 0);
    const duration = line.endTimeMs - line.startTimeMs;
    const wordDur = splitWords.length > 0 ? duration / splitWords.length : duration;

    const evenWords: WordTiming[] = splitWords.map((w, idx) => ({
      id: `w_${selectedLineIndex}_${idx}_${Date.now()}`,
      word: w,
      startTimeMs: Math.round(line.startTimeMs + idx * wordDur),
      endTimeMs: Math.round(line.startTimeMs + (idx + 1) * wordDur),
    }));
    saveWords(evenWords);
  };

  const formatSec = (ms: number) => {
    return (ms / 1000).toFixed(2) + 's';
  };

  return (
    <div className="max-w-lg mx-auto w-full flex-1 flex flex-col space-y-4 pb-8">
      {/* Top Header & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToSync}
          className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-200"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Lines</span>
        </button>

        {/* Line Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectLineIndex(Math.max(0, selectedLineIndex - 1))}
            disabled={selectedLineIndex <= 0}
            className="p-1 rounded bg-slate-800 hover:bg-slate-750 disabled:opacity-30 text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-violet-400">
            Line {selectedLineIndex + 1} / {project.lyrics.length}
          </span>
          <button
            onClick={() =>
              onSelectLineIndex(Math.min(project.lyrics.length - 1, selectedLineIndex + 1))
            }
            disabled={selectedLineIndex >= project.lyrics.length - 1}
            className="p-1 rounded bg-slate-800 hover:bg-slate-750 disabled:opacity-30 text-slate-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Karaoke Preview Card */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl text-center">
        <span className="text-[11px] font-mono text-slate-400 block mb-3">
          Interactive Karaoke Highlighting Preview
        </span>

        {/* Real-time word highlight display */}
        <div
          className="text-xl sm:text-2xl font-bold flex flex-wrap items-center justify-center gap-2 leading-relaxed"
          style={{ fontFamily: project.textStyle.fontFamily }}
        >
          {words.map((w, idx) => {
            const isSung = currentTimeMs >= w.endTimeMs;
            const isCurrent = currentTimeMs >= w.startTimeMs && currentTimeMs < w.endTimeMs;
            const isTargetTap = isWordTapActive && idx === activeWordTapIndex;

            return (
              <span
                key={w.id}
                onClick={() => {
                  onSeek(w.startTimeMs);
                  if (!isPlaying) onTogglePlay();
                }}
                className={`cursor-pointer transition-all duration-150 px-1.5 py-0.5 rounded-md ${
                  isCurrent
                    ? 'text-amber-400 scale-110 shadow-sm underline font-black'
                    : isSung
                    ? 'text-violet-300'
                    : isTargetTap
                    ? 'text-amber-300 bg-amber-500/20 border border-amber-400/50 animate-pulse'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {w.word}
              </span>
            );
          })}
        </div>

        {/* Playback Scrubber for Line */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <button
            onClick={() => {
              onSeek(line.startTimeMs);
              if (!isPlaying) onTogglePlay();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>Play Line</span>
          </button>

          <span className="font-mono text-slate-400">
            {formatSec(line.startTimeMs)} → {formatSec(line.endTimeMs)}
          </span>
        </div>
      </div>

      {/* Tap Word by Word CTA */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Tap Word by Word
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Tap in real-time as each word is sung for perfect karaoke alignment.
          </p>
        </div>

        <button
          onClick={startWordTapMode}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 shrink-0"
        >
          Start Word Tap
        </button>
      </div>

      {/* Word Timings Detail Table */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Words ({words.length})</span>
          <button
            onClick={handleResetEven}
            className="text-violet-400 hover:underline flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Distribute Evenly
          </button>
        </div>

        {words.map((w, idx) => (
          <div
            key={w.id}
            className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="font-mono text-slate-500 text-[11px]">#{idx + 1}</span>
              <span
                className="font-bold text-slate-100 text-sm truncate"
                style={{ fontFamily: project.textStyle.fontFamily }}
              >
                {w.word}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-slate-400 text-[11px]">
                {formatSec(w.startTimeMs)}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => adjustWord(idx, -50)}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px]"
                >
                  -50ms
                </button>
                <button
                  onClick={() => adjustWord(idx, 50)}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px]"
                >
                  +50ms
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen Word Tap Modal */}
      {isWordTapActive && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col p-6 select-none animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              RECORDING WORD TIMINGS
            </span>
            <button
              onClick={() => setIsWordTapActive(false)}
              className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1 bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-md mx-auto w-full">
            <span className="text-xs text-slate-400 font-mono mb-4">
              Word {activeWordTapIndex + 1} of {words.length}
            </span>

            <h2
              className="text-3xl font-black text-amber-400 mb-2 leading-snug"
              style={{ fontFamily: project.textStyle.fontFamily }}
            >
              {words[activeWordTapIndex]?.word}
            </h2>

            {activeWordTapIndex + 1 < words.length && (
              <p
                className="text-sm text-slate-500 mb-8"
                style={{ fontFamily: project.textStyle.fontFamily }}
              >
                Up next: {words[activeWordTapIndex + 1]?.word}
              </p>
            )}

            {/* Giant Circular Tap Button */}
            <button
              onClick={handleRecordWordTap}
              className="w-40 h-40 rounded-full bg-amber-500 active:scale-95 hover:bg-amber-400 text-slate-950 flex flex-col items-center justify-center font-black text-base shadow-2xl shadow-amber-500/40 transition-transform cursor-pointer border-4 border-amber-300"
            >
              <Sparkles className="w-8 h-8 mb-1" />
              <span>TAP WORD</span>
              <span className="text-[10px] font-normal opacity-80">as word is spoken</span>
            </button>

            <span className="text-xs text-slate-400 mt-6 font-mono">
              Current Time: {(currentTimeMs / 1000).toFixed(2)}s
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
