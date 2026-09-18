import React, { useState, useRef } from 'react';
import { ProjectData, LyricLine } from '../../types/project';
import { WaveformEditor } from '../waveform/WaveformEditor';
import {
  Sliders,
  Play,
  Pause,
  Split,
  Merge,
  ChevronRight,
  RotateCcw,
  Volume2,
  Clock,
  ArrowRight,
  Undo,
  Redo,
  Sparkles,
} from 'lucide-react';

interface SyncScreenProps {
  project: ProjectData;
  onUpdateLyrics: (lyrics: LyricLine[]) => void;
  currentTimeMs: number;
  durationMs: number;
  isPlaying: boolean;
  onSeek: (ms: number) => void;
  onTogglePlay: () => void;
  audioBlob: Blob | null;
  onNavigateToWordSync: (lineIndex: number) => void;
}

export const SyncScreen: React.FC<SyncScreenProps> = ({
  project,
  onUpdateLyrics,
  currentTimeMs,
  durationMs,
  isPlaying,
  onSeek,
  onTogglePlay,
  audioBlob,
  onNavigateToWordSync,
}) => {
  // Tap-to-Sync modal state
  const [isTapModalOpen, setIsTapModalOpen] = useState(false);
  const [tapIndex, setTapIndex] = useState(0);
  const [recordedTimestamps, setRecordedTimestamps] = useState<number[]>([]);

  // History stack for Undo/Redo
  const [history, setHistory] = useState<LyricLine[][]>([]);
  const [redoStack, setRedoStack] = useState<LyricLine[][]>([]);

  // Push state to history
  const pushState = (newLyrics: LyricLine[]) => {
    setHistory((prev) => [...prev.slice(-15), project.lyrics]);
    setRedoStack([]);
    onUpdateLyrics(newLyrics);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack((prev) => [project.lyrics, ...prev]);
    setHistory((prev) => prev.slice(0, prev.length - 1));
    onUpdateLyrics(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setHistory((prev) => [...prev, project.lyrics]);
    setRedoStack((prev) => prev.slice(1));
    onUpdateLyrics(next);
  };

  // Adjust timing of single line
  const adjustLine = (index: number, deltaMs: number) => {
    const updated = project.lyrics.map((l, idx) => {
      if (idx !== index) return l;
      const newStart = Math.max(0, l.startTimeMs + deltaMs);
      const newEnd = Math.max(newStart + 300, l.endTimeMs + deltaMs);
      return {
        ...l,
        startTimeMs: newStart,
        endTimeMs: newEnd,
      };
    });
    pushState(updated);
  };

  // Shift ALL timestamps by delta
  const shiftAll = (deltaMs: number) => {
    const updated = project.lyrics.map((l) => ({
      ...l,
      startTimeMs: Math.max(0, l.startTimeMs + deltaMs),
      endTimeMs: Math.max(300, l.endTimeMs + deltaMs),
    }));
    pushState(updated);
  };

  // Split line
  const splitLine = (index: number) => {
    const target = project.lyrics[index];
    const words = target.text.split(' ').filter((w) => w.length > 0);
    if (words.length <= 1) return;

    const mid = Math.floor(words.length / 2);
    const firstHalf = words.slice(0, mid).join(' ');
    const secondHalf = words.slice(mid).join(' ');
    const midTime = Math.round((target.startTimeMs + target.endTimeMs) / 2);

    const firstLine: LyricLine = { ...target, text: firstHalf, endTimeMs: midTime };
    const secondLine: LyricLine = {
      id: 'line_' + Date.now(),
      text: secondHalf,
      startTimeMs: midTime,
      endTimeMs: target.endTimeMs,
    };

    const updated = [
      ...project.lyrics.slice(0, index),
      firstLine,
      secondLine,
      ...project.lyrics.slice(index + 1),
    ];
    pushState(updated);
  };

  // Merge line with next
  const mergeLine = (index: number) => {
    if (index >= project.lyrics.length - 1) return;
    const first = project.lyrics[index];
    const second = project.lyrics[index + 1];

    const merged: LyricLine = {
      ...first,
      text: `${first.text} ${second.text}`,
      endTimeMs: second.endTimeMs,
    };

    const updated = [
      ...project.lyrics.slice(0, index),
      merged,
      ...project.lyrics.slice(index + 2),
    ];
    pushState(updated);
  };

  // Tap-to-sync workflow
  const startTapSync = () => {
    if (project.lyrics.length === 0) {
      alert('Please enter lyrics first in the Lyrics tab.');
      return;
    }
    setTapIndex(0);
    setRecordedTimestamps([]);
    setIsTapModalOpen(true);
    onSeek(0);
    if (!isPlaying) onTogglePlay();
  };

  const handleRecordTap = () => {
    const nextList = [...recordedTimestamps, currentTimeMs];
    setRecordedTimestamps(nextList);
    const nextIdx = tapIndex + 1;

    if (nextIdx >= project.lyrics.length) {
      finishTapSync(nextList);
    } else {
      setTapIndex(nextIdx);
    }
  };

  const finishTapSync = (finalTimestamps = recordedTimestamps) => {
    const newLines: LyricLine[] = [];
    for (let i = 0; i < project.lyrics.length; i++) {
      const orig = project.lyrics[i];
      const start = finalTimestamps[i] !== undefined ? finalTimestamps[i] : orig.startTimeMs;
      const end =
        i + 1 < finalTimestamps.length
          ? Math.max(start + 500, finalTimestamps[i + 1] - 150)
          : start + 3500;

      newLines.push({
        ...orig,
        startTimeMs: start,
        endTimeMs: end,
      });
    }
    pushState(newLines);
    setIsTapModalOpen(false);
  };

  const activeLineIndex = project.lyrics.findIndex(
    (l) => currentTimeMs >= l.startTimeMs && currentTimeMs <= l.endTimeMs
  );

  const formatTime = (ms: number) => {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const cs = Math.floor((ms % 1000) / 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-lg mx-auto w-full flex-1 flex flex-col space-y-4 pb-8">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            Line Synchronization
          </h2>
          <p className="text-xs text-slate-400">
            Tap along to the vocal cues or fine-tune line start and end timings.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 border border-slate-800"
            title="Undo"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 border border-slate-800"
            title="Redo"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={startTapSync}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow transition active:scale-95"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Tap to Sync</span>
          </button>
        </div>
      </div>

      {/* Waveform Scrubber */}
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

      {/* Global Shift Bar */}
      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-400">Shift All Timings:</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => shiftAll(-500)}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 font-mono text-[11px]"
          >
            -0.5s
          </button>
          <button
            onClick={() => shiftAll(-100)}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 font-mono text-[11px]"
          >
            -0.1s
          </button>
          <button
            onClick={() => shiftAll(100)}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 font-mono text-[11px]"
          >
            +0.1s
          </button>
          <button
            onClick={() => shiftAll(500)}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 font-mono text-[11px]"
          >
            +0.5s
          </button>
        </div>
      </div>

      {/* Scrollable Lyric Lines List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {project.lyrics.map((line, idx) => {
          const isActive = idx === activeLineIndex;

          return (
            <div
              key={line.id}
              className={`p-3.5 rounded-2xl border transition-all duration-150 ${
                isActive
                  ? 'bg-violet-950/40 border-violet-500/80 shadow-lg'
                  : 'bg-slate-900 border-slate-800/90 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono font-bold ${
                      isActive ? 'text-amber-400' : 'text-violet-400'
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <span className="font-mono text-slate-400">
                    {formatTime(line.startTimeMs)} → {formatTime(line.endTimeMs)}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {/* Play Solo Line */}
                  <button
                    onClick={() => {
                      onSeek(line.startTimeMs);
                      if (!isPlaying) onTogglePlay();
                    }}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Play from this line"
                  >
                    <Play className="w-3 h-3" />
                  </button>

                  {/* Manual +/- 100ms */}
                  <button
                    onClick={() => adjustLine(idx, -100)}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px]"
                    title="-100ms"
                  >
                    -0.1s
                  </button>
                  <button
                    onClick={() => adjustLine(idx, 100)}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px]"
                    title="+100ms"
                  >
                    +0.1s
                  </button>

                  {/* Split */}
                  <button
                    onClick={() => splitLine(idx)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Split line"
                  >
                    <Split className="w-3 h-3" />
                  </button>

                  {/* Merge */}
                  {idx < project.lyrics.length - 1 && (
                    <button
                      onClick={() => mergeLine(idx)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Merge with next line"
                    >
                      <Merge className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Line Text */}
              <p
                className="text-sm text-slate-100 leading-snug"
                style={{ fontFamily: project.textStyle.fontFamily }}
              >
                {line.text}
              </p>

              {/* Word Sync CTA button */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">
                  {line.words?.length || 0} word timings
                </span>

                <button
                  onClick={() => onNavigateToWordSync(idx)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-violet-400 hover:text-violet-300"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Sync Words</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tap To Sync Interactive Fullscreen Modal */}
      {isTapModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col p-6 select-none animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              TAP TO SYNC RECORDING
            </span>
            <button
              onClick={() => setIsTapModalOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1 bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-md mx-auto w-full">
            <span className="text-xs text-slate-400 font-mono mb-4">
              Line {tapIndex + 1} of {project.lyrics.length}
            </span>

            <h2
              className="text-2xl font-bold text-white mb-6 leading-snug"
              style={{ fontFamily: project.textStyle.fontFamily }}
            >
              {project.lyrics[tapIndex]?.text}
            </h2>

            {tapIndex + 1 < project.lyrics.length && (
              <p
                className="text-xs text-slate-500 mb-8"
                style={{ fontFamily: project.textStyle.fontFamily }}
              >
                Up next: {project.lyrics[tapIndex + 1]?.text}
              </p>
            )}

            {/* Tap Target */}
            <button
              onClick={handleRecordTap}
              className="w-36 h-36 rounded-full bg-amber-500 active:scale-95 hover:bg-amber-400 text-slate-950 flex flex-col items-center justify-center font-bold text-sm shadow-2xl shadow-amber-500/30 transition-transform cursor-pointer border-4 border-amber-300"
            >
              <Sliders className="w-8 h-8 mb-1" />
              <span>TAP NOW</span>
              <span className="text-[10px] font-normal opacity-80">as line begins</span>
            </button>

            <span className="text-[11px] text-slate-400 mt-6 font-mono">
              Current Time: {formatTime(currentTimeMs)}
            </span>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => finishTapSync()}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-semibold transition"
            >
              Finish & Apply Recorded Timings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
