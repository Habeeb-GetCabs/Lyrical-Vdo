import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Upload,
  Image as ImageIcon,
  Music,
  Type,
  Sliders,
  Sparkles,
  RotateCcw,
  FastForward,
  Rewind,
  CheckCircle2,
  Download,
  Github,
  Split,
  Merge,
  ChevronRight,
  ExternalLink,
  Code2
} from 'lucide-react';

interface LyricLine {
  id: string;
  text: string;
  startTimeMs: number;
  endTimeMs: number;
}

type AnimationStyle = 'FADE' | 'SLIDE' | 'HIGHLIGHT' | 'ZOOM' | 'TYPEWRITER';

const SAMPLE_TAMIL_ENGLISH_LYRICS = `கண்ணே கலைமானே கன்னி மயிலென
கண்டேன் உனை நானே
அந்தியில் மலர்ந்த ரோஜா மலரே
Sweet melody playing in the calm night
Loving memories glowing so bright
உன் நினைவுகள் நெஞ்சில் வாழும் என்றும்`;

export default function App() {
  const [activeTab, setActiveTab] = useState<'preview' | 'assets' | 'lyrics' | 'timeline' | 'style' | 'ci_guide'>('preview');

  // Asset States
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(
    'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1080&q=80'
  );
  const [lyricsText, setLyricsText] = useState<string>(SAMPLE_TAMIL_ENGLISH_LYRICS);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string>('Melodic Demo Track');
  const [customFontName, setCustomFontName] = useState<string | null>('Mukta Malar (Tamil & Latin)');
  const [customFontFamily, setCustomFontFamily] = useState<string>('sans-serif');

  // Playback & Waveform States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);
  const [durationMs, setDurationMs] = useState<number>(32000); // 32s demo duration
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Synchronized Lyric Lines
  const [lyricLines, setLyricLines] = useState<LyricLine[]>([
    { id: '1', text: 'கண்ணே கலைமானே கன்னி மயிலென', startTimeMs: 2000, endTimeMs: 6500 },
    { id: '2', text: 'கண்டேன் உனை நானே', startTimeMs: 6800, endTimeMs: 11200 },
    { id: '3', text: 'அந்தியில் மலர்ந்த ரோஜா மலரே', startTimeMs: 11500, endTimeMs: 16800 },
    { id: '4', text: 'Sweet melody playing in the calm night', startTimeMs: 17200, endTimeMs: 22000 },
    { id: '5', text: 'Loving memories glowing so bright', startTimeMs: 22400, endTimeMs: 27000 },
    { id: '6', text: 'உன் நினைவுகள் நெஞ்சில் வாழும் என்றும்', startTimeMs: 27400, endTimeMs: 31500 }
  ]);

  // Styling & Animation States
  const [fontSize, setFontSize] = useState<number>(26);
  const [textColor, setTextColor] = useState<string>('#FFFFFF');
  const [verticalPosition, setVerticalPosition] = useState<'top' | 'center' | 'bottom'>('center');
  const [textAlignment, setTextAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [hasShadow, setHasShadow] = useState<boolean>(true);
  const [hasStroke, setHasStroke] = useState<boolean>(true);
  const [animationStyle, setAnimationStyle] = useState<AnimationStyle>('FADE');

  // Tap-to-Sync Interactive Mode
  const [isTapSyncing, setIsTapSyncing] = useState<boolean>(false);
  const [tapSyncIndex, setTapSyncIndex] = useState<number>(0);
  const [tapSyncLines, setTapSyncLines] = useState<string[]>([]);
  const [recordedTimestamps, setRecordedTimestamps] = useState<number[]>([]);

  // Synthesized Waveform peaks
  const waveformPeaks = useRef<number[]>(
    Array.from({ length: 64 }, (_, i) => {
      const angle = (i / 64) * Math.PI * 4;
      return 0.2 + Math.abs(Math.sin(angle) * 0.5 + Math.sin(angle * 2.3) * 0.3);
    })
  ).current;

  // Track playback time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTimeMs((prev) => {
          const next = prev + 100;
          if (next >= durationMs) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, durationMs]);

  // Current active line index
  const activeLineIndex = lyricLines.findIndex(
    (line) => currentTimeMs >= line.startTimeMs && currentTimeMs <= line.endTimeMs
  );
  const activeLine = activeLineIndex !== -1 ? lyricLines[activeLineIndex] : null;

  // Format Milliseconds to MM:SS.SS
  const formatTime = (ms: number) => {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    const centis = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
  };

  // Upload Handlers
  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBackgroundUrl(url);
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setAudioFileName(file.name);
      // Read audio duration if possible
      const tempAudio = new Audio(url);
      tempAudio.onloadedmetadata = () => {
        if (tempAudio.duration && !isNaN(tempAudio.duration)) {
          setDurationMs(Math.round(tempAudio.duration * 1000));
        }
      };
    }
  };

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const fontData = await file.arrayBuffer();
        const fontFace = new FontFace('CustomUploadedFont', fontData);
        await fontFace.load();
        document.fonts.add(fontFace);
        setCustomFontFamily('CustomUploadedFont, sans-serif');
        setCustomFontName(file.name);
      } catch (err) {
        alert('Could not load font file. Please ensure it is a valid .ttf or .otf file.');
      }
    }
  };

  // Start Tap-to-Sync workflow
  const startTapSync = () => {
    const clean = lyricsText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (clean.length === 0) {
      alert('Please enter lyrics first in the Lyrics tab.');
      return;
    }
    setTapSyncLines(clean);
    setTapSyncIndex(0);
    setRecordedTimestamps([]);
    setIsTapSyncing(true);
    setCurrentTimeMs(0);
    setIsPlaying(true);
  };

  const recordTap = () => {
    const nextRecorded = [...recordedTimestamps, currentTimeMs];
    setRecordedTimestamps(nextRecorded);
    const nextIndex = tapSyncIndex + 1;

    if (nextIndex >= tapSyncLines.length) {
      // Completed!
      finishTapSync(nextRecorded);
    } else {
      setTapSyncIndex(nextIndex);
    }
  };

  const finishTapSync = (timestamps = recordedTimestamps) => {
    const newLines: LyricLine[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const start = timestamps[i];
      const end = i + 1 < timestamps.length ? Math.max(start + 500, timestamps[i + 1] - 150) : start + 3500;
      newLines.push({
        id: (i + 1).toString(),
        text: tapSyncLines[i],
        startTimeMs: start,
        endTimeMs: end
      });
    }
    setLyricLines(newLines);
    setIsTapSyncing(false);
  };

  // Timeline Adjustments
  const moveLine = (index: number, deltaMs: number) => {
    setLyricLines((prev) =>
      prev.map((line, idx) => {
        if (idx !== index) return line;
        const newStart = Math.max(0, line.startTimeMs + deltaMs);
        const newEnd = Math.max(newStart + 300, line.endTimeMs + deltaMs);
        return { ...line, startTimeMs: newStart, endTimeMs: newEnd };
      })
    );
  };

  const splitLine = (index: number) => {
    const target = lyricLines[index];
    const words = target.text.split(' ').filter((w) => w.length > 0);
    if (words.length <= 1) return;

    const mid = Math.floor(words.length / 2);
    const firstHalf = words.slice(0, mid).join(' ');
    const secondHalf = words.slice(mid).join(' ');
    const midTime = Math.round((target.startTimeMs + target.endTimeMs) / 2);

    const firstLine: LyricLine = { ...target, text: firstHalf, endTimeMs: midTime };
    const secondLine: LyricLine = {
      id: Date.now().toString(),
      text: secondHalf,
      startTimeMs: midTime,
      endTimeMs: target.endTimeMs
    };

    setLyricLines((prev) => [
      ...prev.slice(0, index),
      firstLine,
      secondLine,
      ...prev.slice(index + 1)
    ]);
  };

  const mergeLine = (index: number) => {
    if (index >= lyricLines.length - 1) return;
    const first = lyricLines[index];
    const second = lyricLines[index + 1];

    const merged: LyricLine = {
      ...first,
      text: `${first.text} ${second.text}`,
      endTimeMs: second.endTimeMs
    };

    setLyricLines((prev) => [
      ...prev.slice(0, index),
      merged,
      ...prev.slice(index + 2)
    ]);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      {/* Top App Header */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400 font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-100 tracking-tight flex items-center gap-2">
              AI Lyric Video Maker
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                CI Ready
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">
              {audioFileName}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={startTapSync}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Start</span> Tap to Sync
          </button>

          <button
            onClick={() => setActiveTab('ci_guide')}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            title="GitHub Actions APK Build Info"
          >
            <Github className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden sm:inline">APK Workflow</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Content Tabs */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-slate-950 p-4">
          {/* TAB 1: LIVE PREVIEW & VIDEO PLAYER */}
          {activeTab === 'preview' && (
            <div className="max-w-md w-full mx-auto flex-1 flex flex-col">
              {/* 9:16 Video Preview Card */}
              <div className="relative flex-1 min-h-[360px] max-h-[580px] w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
                {/* Background Image Layer */}
                {backgroundUrl ? (
                  <img
                    src={backgroundUrl}
                    alt="Lyric Video Background"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900" />
                )}

                {/* Dark Contrast Overlay */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[0.5px]" />

                {/* Synchronized Lyric Display with Dynamic Font & Animation */}
                <div
                  className={`absolute inset-x-6 z-10 transition-all duration-300 pointer-events-none flex flex-col ${
                    verticalPosition === 'top'
                      ? 'top-12'
                      : verticalPosition === 'bottom'
                      ? 'bottom-12'
                      : 'top-1/2 -translate-y-1/2'
                  }`}
                  style={{
                    alignItems:
                      textAlignment === 'left'
                        ? 'flex-start'
                        : textAlignment === 'right'
                        ? 'flex-end'
                        : 'center'
                  }}
                >
                  {activeLine ? (
                    <div
                      key={activeLine.id}
                      className={`text-center transition-all ${
                        animationStyle === 'FADE'
                          ? 'animate-fade-in'
                          : animationStyle === 'SLIDE'
                          ? 'animate-slide-up'
                          : animationStyle === 'ZOOM'
                          ? 'animate-zoom'
                          : ''
                      }`}
                      style={{
                        fontFamily: customFontFamily,
                        fontSize: `${fontSize}px`,
                        color: textColor,
                        textAlign: textAlignment,
                        lineHeight: 1.35,
                        textShadow: hasShadow
                          ? '0 3px 12px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.8)'
                          : 'none',
                        WebkitTextStroke: hasStroke ? '1px rgba(0,0,0,0.85)' : 'none'
                      }}
                    >
                      {activeLine.text}
                    </div>
                  ) : (
                    <div className="text-slate-400 text-xs italic bg-black/50 px-3 py-1.5 rounded-full border border-slate-700/50">
                      Synchronized lyrics will animate here during playback
                    </div>
                  )}
                </div>

                {/* Watermark / Badge */}
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-[10px] text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                  1080p Android Render Canvas
                </div>
              </div>

              {/* Waveform Scrubber Component */}
              <div className="mt-4 bg-slate-900 p-3 rounded-xl border border-slate-800">
                <div
                  className="h-12 w-full flex items-center gap-0.5 cursor-pointer select-none px-1"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    setCurrentTimeMs(Math.round(ratio * durationMs));
                  }}
                >
                  {waveformPeaks.map((peak, i) => {
                    const progress = currentTimeMs / durationMs;
                    const isPlayed = i / waveformPeaks.length <= progress;
                    return (
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-75 ${
                          isPlayed ? 'bg-violet-500' : 'bg-slate-700'
                        }`}
                        style={{ height: `${Math.max(15, peak * 100)}%` }}
                      />
                    );
                  })}
                </div>

                {/* Time & Playback Controls */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-xs">
                  <span className="text-violet-400 font-mono font-bold">
                    {formatTime(currentTimeMs)}
                  </span>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCurrentTimeMs((t) => Math.max(0, t - 5000))}
                      className="p-1.5 text-slate-400 hover:text-slate-200 transition"
                      title="Back 5s"
                    >
                      <Rewind className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-10 h-10 rounded-full bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center shadow-lg transition"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>

                    <button
                      onClick={() => setCurrentTimeMs((t) => Math.min(durationMs, t + 5000))}
                      className="p-1.5 text-slate-400 hover:text-slate-200 transition"
                      title="Forward 5s"
                    >
                      <FastForward className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="text-slate-400 font-mono">
                    {formatTime(durationMs)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ASSETS & MEDIA */}
          {activeTab === 'assets' && (
            <div className="max-w-lg w-full mx-auto space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Media & Typography Assets</h2>
                <p className="text-xs text-slate-400">
                  Import local files from your device. In the native Android APK, these use Android's PhotoPicker and SAF file providers.
                </p>
              </div>

              {/* 1. Background Image */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-violet-400" />
                    <span className="font-semibold text-sm text-slate-200">1. Background Image</span>
                  </div>
                  {backgroundUrl && <span className="text-[11px] text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ready</span>}
                </div>
                <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium cursor-pointer border border-slate-700 transition">
                  <Upload className="w-4 h-4 text-violet-400" />
                  <span>{backgroundUrl ? 'Replace Background' : 'Upload Background Image'}</span>
                  <input type="file" accept="image/*" onChange={handleBackgroundUpload} className="hidden" />
                </label>
              </div>

              {/* 2. Audio Track */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Music className="w-5 h-5 text-violet-400" />
                    <span className="font-semibold text-sm text-slate-200">2. Audio Track (MP3, WAV, M4A)</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {audioFileName}</span>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Analyzed with AndroidX Media3 ExoPlayer & lightweight peak downsampling.
                </p>
                <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium cursor-pointer border border-slate-700 transition">
                  <Upload className="w-4 h-4 text-violet-400" />
                  <span>Upload Audio File</span>
                  <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
                </label>
              </div>

              {/* 3. Custom TTF/OTF Font */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Type className="w-5 h-5 text-violet-400" />
                    <span className="font-semibold text-sm text-slate-200">3. Custom Font File (.TTF / .OTF)</span>
                  </div>
                  {customFontName && <span className="text-[11px] text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {customFontName}</span>}
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Crucial for Tamil Unicode ligatures (புள்ளி, கொம்புகள்). Dynamically parsed into native Typeface.
                </p>
                <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium cursor-pointer border border-slate-700 transition">
                  <Upload className="w-4 h-4 text-violet-400" />
                  <span>Upload Custom Font (.TTF / .OTF)</span>
                  <input type="file" accept=".ttf,.otf" onChange={handleFontUpload} className="hidden" />
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: LYRICS EDITOR */}
          {activeTab === 'lyrics' && (
            <div className="max-w-lg w-full mx-auto flex-1 flex flex-col space-y-3">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Authoritative Lyrics</h2>
                <p className="text-xs text-slate-400">
                  Paste Tamil, English, or mixed lyrics. Exact line breaks are strictly preserved.
                </p>
              </div>

              <textarea
                value={lyricsText}
                onChange={(e) => setLyricsText(e.target.value)}
                placeholder="Paste or type lyrics here..."
                className="flex-1 w-full p-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-violet-500 font-sans resize-none leading-relaxed"
                rows={10}
              />

              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>{lyricsText.split('\n').filter((l) => l.trim()).length} total lines detected</span>
                <button
                  onClick={() => {
                    // re-initialize default timeline lines
                    const lines = lyricsText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
                    setLyricLines(
                      lines.map((text, i) => ({
                        id: (i + 1).toString(),
                        text,
                        startTimeMs: i * 4000,
                        endTimeMs: i * 4000 + 3500
                      }))
                    );
                    setActiveTab('timeline');
                  }}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition"
                >
                  Generate Timeline Cards
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: TIMELINE & SYNC */}
          {activeTab === 'timeline' && (
            <div className="max-w-lg w-full mx-auto flex-1 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">Lyric Timeline</h2>
                  <p className="text-xs text-slate-400">{lyricLines.length} synchronized lines</p>
                </div>
                <button
                  onClick={startTapSync}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:bg-amber-400 transition"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Tap to Sync
                </button>
              </div>

              {/* List of lines */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {lyricLines.map((line, idx) => {
                  const isActive = idx === activeLineIndex;
                  return (
                    <div
                      key={line.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isActive
                          ? 'bg-violet-950/40 border-violet-500 shadow-md'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className={`font-mono font-bold ${isActive ? 'text-amber-400' : 'text-violet-400'}`}>
                          Line {idx + 1} • {formatTime(line.startTimeMs)} → {formatTime(line.endTimeMs)}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveLine(idx, -250)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                            title="Move 250ms earlier"
                          >
                            -250ms
                          </button>
                          <button
                            onClick={() => moveLine(idx, 250)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                            title="Move 250ms later"
                          >
                            +250ms
                          </button>
                          <button
                            onClick={() => splitLine(idx)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="Split line"
                          >
                            <Split className="w-3 h-3" />
                          </button>
                          {idx < lyricLines.length - 1 && (
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

                      <p
                        className="text-sm text-slate-100"
                        style={{ fontFamily: customFontFamily }}
                      >
                        {line.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: STYLE & ANIMATION */}
          {activeTab === 'style' && (
            <div className="max-w-lg w-full mx-auto space-y-4">
              <h2 className="text-lg font-bold text-slate-100">Typography & Animation Controls</h2>

              {/* Animation Style */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <label className="text-xs font-semibold text-slate-300">Animation Style</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['FADE', 'SLIDE', 'ZOOM', 'HIGHLIGHT', 'TYPEWRITER'] as AnimationStyle[]).map((style) => (
                    <button
                      key={style}
                      onClick={() => setAnimationStyle(style)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                        animationStyle === style
                          ? 'bg-violet-600 border-violet-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size Slider */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-300">Font Size</span>
                  <span className="text-violet-400 font-bold">{fontSize} px</span>
                </div>
                <input
                  type="range"
                  min="18"
                  max="44"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-violet-500 cursor-pointer"
                />
              </div>

              {/* Vertical Position */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <label className="text-xs font-semibold text-slate-300">Vertical Alignment</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['top', 'center', 'bottom'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setVerticalPosition(pos)}
                      className={`py-2 px-3 rounded-lg text-xs capitalize font-semibold border transition ${
                        verticalPosition === pos
                          ? 'bg-violet-600 border-violet-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              {/* Effects: Shadow & Stroke */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Drop Shadow</span>
                  <input
                    type="checkbox"
                    checked={hasShadow}
                    onChange={(e) => setHasShadow(e.target.checked)}
                    className="w-4 h-4 accent-violet-500 rounded"
                  />
                </div>
                <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                  <span className="text-xs font-semibold text-slate-300">Text Outline / Stroke</span>
                  <input
                    type="checkbox"
                    checked={hasStroke}
                    onChange={(e) => setHasStroke(e.target.checked)}
                    className="w-4 h-4 accent-violet-500 rounded"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: GITHUB ACTIONS CI & APK GUIDE */}
          {activeTab === 'ci_guide' && (
            <div className="max-w-lg w-full mx-auto space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400">
                  <Github className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-100">GitHub Actions CI & APK Pipeline</h2>
                  <p className="text-xs text-slate-400">Configured for 100% cloud builds from mobile.</p>
                </div>
              </div>

              {/* Step by step card */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  How to get your APK on your phone:
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
                  <li>
                    <strong className="text-slate-100">Push to GitHub:</strong> In Google AI Studio, push your changes to your linked repository.
                  </li>
                  <li>
                    <strong className="text-slate-100">Automated Build:</strong> GitHub Actions immediately triggers <code className="bg-slate-800 px-1.5 py-0.5 rounded text-violet-300">.github/workflows/build.yml</code> using Ubuntu + JDK 17.
                  </li>
                  <li>
                    <strong className="text-slate-100">APK Compilation:</strong> Runs <code className="bg-slate-800 px-1.5 py-0.5 rounded text-violet-300">./gradlew assembleDebug</code> and outputs <code className="bg-slate-800 px-1.5 py-0.5 rounded text-violet-300">app-debug.apk</code>.
                  </li>
                  <li>
                    <strong className="text-slate-100">Download:</strong> On your mobile browser, go to your GitHub repo → <strong>Actions</strong> tab → click the latest run → download <strong>AI-Lyric-Video-Maker-debug</strong> artifact!
                  </li>
                </ol>
              </div>

              {/* File tree verification */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <h3 className="font-bold text-slate-200 text-xs flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-violet-400" />
                  Committed Native Android Files:
                </h3>
                <div className="bg-slate-950 p-3 rounded-lg font-mono text-[11px] text-slate-400 space-y-1">
                  <div>✓ .github/workflows/build.yml</div>
                  <div>✓ gradlew & gradlew.bat (executable)</div>
                  <div>✓ gradle/wrapper/gradle-wrapper.jar (v8.7)</div>
                  <div>✓ settings.gradle.kts & root build.gradle.kts</div>
                  <div>✓ app/build.gradle.kts (SDK 34, Compose, Media3)</div>
                  <div>✓ app/src/main/AndroidManifest.xml</div>
                  <div>✓ app/src/main/java/com/ailyricvideomaker/app/...</div>
                  <div>✓ app/src/main/res/ (strings, colors, themes)</div>
                  <div>✓ README.md & .gitignore</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-around px-2 z-10 shrink-0">
        {[
          { id: 'preview', label: 'Preview', icon: Play },
          { id: 'assets', label: 'Assets', icon: ImageIcon },
          { id: 'lyrics', label: 'Lyrics', icon: Type },
          { id: 'timeline', label: 'Timeline', icon: Sliders },
          { id: 'style', label: 'Style', icon: Sparkles }
        ].map((item) => {
          const IconComp = item.icon;
          const isSelected = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                isSelected ? 'text-violet-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <IconComp className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Fullscreen Interactive Tap-to-Sync Modal */}
      {isTapSyncing && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col p-6 select-none animate-fade-in">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              TAP TO SYNC RECORDING
            </span>
            <button
              onClick={() => setIsTapSyncing(false)}
              className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1 bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
          </div>

          {/* Central Tap Target & Current Line Display */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-md mx-auto w-full">
            <span className="text-xs text-slate-400 font-mono mb-4">
              Line {tapSyncIndex + 1} of {tapSyncLines.length}
            </span>

            <h2
              className="text-2xl font-bold text-white mb-6 leading-snug"
              style={{ fontFamily: customFontFamily }}
            >
              {tapSyncLines[tapSyncIndex]}
            </h2>

            {tapSyncIndex + 1 < tapSyncLines.length && (
              <p
                className="text-xs text-slate-500 mb-8"
                style={{ fontFamily: customFontFamily }}
              >
                Up next: {tapSyncLines[tapSyncIndex + 1]}
              </p>
            )}

            {/* Giant Circular Tap Button */}
            <button
              onClick={recordTap}
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

          {/* Bottom Complete Button */}
          <div className="flex justify-center">
            <button
              onClick={() => finishTapSync()}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
            >
              Finish & Save Timings Early
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
