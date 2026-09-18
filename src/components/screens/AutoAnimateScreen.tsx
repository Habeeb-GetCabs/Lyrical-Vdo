import React, { useState, useEffect } from 'react';
import {
  ProjectData,
  LyricLine,
  AutoAnimationPreset,
  AutoMotionEffect,
  LineAutoAnimation,
  AutoAnimationConfig,
} from '../../types/project';
import { AudioAnalyzer } from '../../services/audioAnalyzer';
import { AnimationDecisionEngine } from '../../services/animationDecisionEngine';
import {
  Sparkles,
  Zap,
  Sliders,
  Play,
  Pause,
  RefreshCw,
  Eye,
  Download,
  Flame,
  Activity,
  Check,
  ChevronRight,
  RotateCcw,
  Layers,
  Music,
  Upload,
  CheckCircle2,
} from 'lucide-react';

interface AutoAnimateScreenProps {
  project: ProjectData;
  onUpdateProject: (updates: Partial<ProjectData>) => void;
  currentTimeMs: number;
  durationMs: number;
  isPlaying: boolean;
  onSeek: (ms: number) => void;
  onTogglePlay: () => void;
  audioBlob: Blob | null;
  onNavigateToTab: (tab: any) => void;
  onAudioUpload?: (file: File) => void;
  onLoadDemoAudio?: () => void;
}

const PRESETS: {
  id: AutoAnimationPreset;
  name: string;
  desc: string;
  icon: string;
}[] = [
  {
    id: 'dynamic',
    name: 'Dynamic Rhythm',
    desc: 'Adaptive pacing, punches on accents, gentle drifts on verses',
    icon: '✨',
  },
  {
    id: 'smooth',
    name: 'Smooth Melodic',
    desc: 'Kinetic flowing drift, gentle scaling, and elegant transitions',
    icon: '🌊',
  },
  {
    id: 'kinetic',
    name: 'High Energy Kinetic',
    desc: 'Snappy accents, energetic pops, and bold motion for upbeat songs',
    icon: '⚡',
  },
  {
    id: 'cinematic',
    name: 'Cinematic Ambient',
    desc: 'Slow atmospheric breathing, soft dissolves, and calm mood',
    icon: '🎬',
  },
  {
    id: 'karaoke',
    name: 'Vocal Showcase',
    desc: 'Rhythm-synchronized word pulses with glowing vocal highlighting',
    icon: '🎤',
  },
];

const MOTION_EFFECTS: { id: AutoMotionEffect; label: string; desc: string }[] = [
  { id: 'PUNCH', label: 'Beat Punch', desc: 'Snappy punch on beat onset' },
  { id: 'POP_ACCENT', label: 'Pop Accent', desc: 'Sudden scale burst on vocal drop' },
  { id: 'DRIFT', label: 'Kinetic Drift', desc: 'Smooth horizontal / vertical flow' },
  { id: 'PULSE', label: 'Rhythm Pulse', desc: 'Subtle bounce synchronized to BPM' },
  { id: 'FLOAT', label: 'Ambient Float', desc: 'Gentle float for calm passages' },
  { id: 'ZOOM_IN', label: 'Scale Build', desc: 'Progressive zoom into climax' },
  { id: 'FADE_SLOW', label: 'Soft Dissolve', desc: 'Calm fade for quiet moments' },
];

export const AutoAnimateScreen: React.FC<AutoAnimateScreenProps> = ({
  project,
  onUpdateProject,
  currentTimeMs,
  durationMs,
  isPlaying,
  onSeek,
  onTogglePlay,
  audioBlob,
  onNavigateToTab,
  onAudioUpload,
  onLoadDemoAudio,
}) => {
  const audioFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activePreset, setActivePreset] = useState<AutoAnimationPreset>(
    project.autoAnimationConfig?.preset || 'dynamic'
  );
  const [sensitivity, setSensitivity] = useState<'low' | 'normal' | 'high'>(
    project.autoAnimationConfig?.sensitivity || 'normal'
  );
  const [motionIntensity, setMotionIntensity] = useState<number>(
    project.autoAnimationConfig?.motionIntensity ?? 1.0
  );
  const [accentResponse, setAccentResponse] = useState<'subtle' | 'punchy' | 'intense'>(
    project.autoAnimationConfig?.accentResponse || 'punchy'
  );

  const isAutoModeActive = project.animationMode === 'auto';
  const config = project.autoAnimationConfig;
  const analysis = config?.analysisSummary;

  // Auto-run initial analysis if none exists yet
  useEffect(() => {
    if (!config || !config.timeline || config.timeline.length === 0) {
      runAnalysisAndGenerate(activePreset, sensitivity, motionIntensity, accentResponse);
    }
  }, [project.lyrics.length, audioBlob]);

  const runAnalysisAndGenerate = async (
    preset = activePreset,
    sens = sensitivity,
    intensity = motionIntensity,
    accent = accentResponse
  ) => {
    setIsAnalyzing(true);
    try {
      const summary = await AudioAnalyzer.analyzeAudio(audioBlob, durationMs);
      const generated = AnimationDecisionEngine.generateAnimationTimeline(
        project.lyrics,
        summary,
        preset,
        sens,
        intensity,
        accent,
        config?.timeline
      );
      onUpdateProject({
        animationMode: 'auto',
        autoAnimationConfig: generated,
      });
    } catch (err) {
      console.error('Auto analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleMode = (mode: 'manual' | 'auto') => {
    onUpdateProject({ animationMode: mode });
  };

  const handlePresetSelect = (preset: AutoAnimationPreset) => {
    setActivePreset(preset);
    runAnalysisAndGenerate(preset, sensitivity, motionIntensity, accentResponse);
  };

  const handleSensitivityChange = (sens: 'low' | 'normal' | 'high') => {
    setSensitivity(sens);
    runAnalysisAndGenerate(activePreset, sens, motionIntensity, accentResponse);
  };

  const handleIntensityChange = (val: number) => {
    setMotionIntensity(val);
    runAnalysisAndGenerate(activePreset, sensitivity, val, accentResponse);
  };

  const handleAccentChange = (acc: 'subtle' | 'punchy' | 'intense') => {
    setAccentResponse(acc);
    runAnalysisAndGenerate(activePreset, sensitivity, motionIntensity, acc);
  };

  const handleLineOverride = (lineId: string, updates: Partial<LineAutoAnimation>) => {
    if (!config) return;
    const updated = AnimationDecisionEngine.updateLineOverride(config, lineId, updates);
    onUpdateProject({ autoAnimationConfig: updated });
  };

  const handleResetOverrides = () => {
    if (!config) return;
    const reset = AnimationDecisionEngine.resetOverrides(config, project.lyrics);
    onUpdateProject({ autoAnimationConfig: reset });
  };

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6 pb-12 select-none">
      {/* Top Banner & Mode Switcher: Option A (Manual) vs Option B (Auto Animate) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-950 via-slate-900 to-slate-950 p-5 sm:p-6 border border-violet-700/40 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-violet-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>AI Lyric Video Maker • Auto Motion Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>✨ Auto Animate Lyrics</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Automatically animate lyrics according to the timing, rhythm, pauses, accents, and
              energy of the audio.
            </p>
          </div>

          {/* Master Mode Switcher (Option A vs Option B) */}
          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <div className="text-[11px] font-semibold text-slate-400">Selected Workflow Mode:</div>
            <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => handleToggleMode('manual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  !isAutoModeActive
                    ? 'bg-slate-700 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Option A: Manual
              </button>
              <button
                onClick={() => handleToggleMode('auto')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  isAutoModeActive
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Option B: Auto Animate</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Indicator / Summary Row */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>
              {analysis ? (
                <>
                  Tempo: <strong className="text-emerald-400">{analysis.tempoBpm} BPM</strong> •
                  Beats Detected:{' '}
                  <strong className="text-violet-300">{analysis.beatCount}</strong> • Energy:{' '}
                  <strong className="text-amber-300">
                    {Math.round(analysis.averageEnergy * 100)}%
                  </strong>
                </>
              ) : (
                'Analyzing audio track...'
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => runAnalysisAndGenerate()}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold transition active:scale-95 shadow"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Analyzing...' : 'Regenerate Animation'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* STEP 1: LOAD YOUR SONG (Audio Track Selector) */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-5 space-y-3.5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>1. Audio Track & Song</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  Offline
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Current:{' '}
                <strong className="text-amber-300 font-medium">{project.audioFileName}</strong> (
                {formatTime(durationMs)})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onTogglePlay}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition active:scale-95"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isPlaying ? 'Pause' : 'Play Audio'}</span>
            </button>
          </div>
        </div>

        {/* The Two Choices: Select MP3 / Audio vs Load Demo Audio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => audioFileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-600/25 transition active:scale-[0.98]"
          >
            <Upload className="w-4 h-4 text-violet-200" />
            <span>Select MP3 / Audio</span>
          </button>

          {onLoadDemoAudio && (
            <button
              onClick={onLoadDemoAudio}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Load Demo Audio</span>
            </button>
          )}

          <input
            ref={audioFileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f && onAudioUpload) {
                onAudioUpload(f);
              }
            }}
          />
        </div>
      </div>

      {/* Audio Energy Envelope Visualizer */}
      {analysis && analysis.energyEnvelope && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Audio Dynamic Energy & Onset Profile
            </span>
            <span className="text-slate-400 text-[11px]">
              {formatTime(currentTimeMs)} / {formatTime(durationMs)}
            </span>
          </div>

          {/* Visualizer Heatmap Bar */}
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickPercent = (e.clientX - rect.left) / rect.width;
              onSeek(clickPercent * durationMs);
            }}
            className="relative h-14 bg-slate-950 rounded-xl border border-slate-800/80 overflow-hidden flex items-end px-1 cursor-pointer group"
          >
            {/* Energy Bars */}
            {analysis.energyEnvelope.map((val, idx) => {
              const barHeight = Math.max(12, val * 100);
              const isPeak = val > 0.75;
              const isMid = val > 0.45;
              return (
                <div
                  key={idx}
                  className="flex-1 mx-[1px] rounded-t transition-all group-hover:opacity-90"
                  style={{
                    height: `${barHeight}%`,
                    backgroundColor: isPeak
                      ? '#F59E0B' // amber
                      : isMid
                      ? '#8B5CF6' // violet
                      : '#3B82F6', // blue
                    opacity: 0.85,
                  }}
                />
              );
            })}

            {/* Playhead Marker */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none transition-all"
              style={{
                left: `${Math.min(100, Math.max(0, (currentTimeMs / durationMs) * 100))}%`,
              }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 -ml-[4px] -mt-1 shadow" />
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono px-1">
            <span>Intro</span>
            <span>Verse Dynamics</span>
            <span>Chorus Peak Drop</span>
            <span>Outro</span>
          </div>
        </div>
      )}

      {/* Animation Style Presets */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-violet-400" />
          Rhythm & Animation Presets
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {PRESETS.map((p) => {
            const isSelected = activePreset === p.id;
            return (
              <div
                key={p.id}
                onClick={() => handlePresetSelect(p.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-violet-950/40 border-amber-400/80 shadow-lg shadow-amber-500/10 scale-[1.02]'
                    : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg">{p.icon}</span>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                        <Check className="w-3 h-3 stroke-[3]" /> Active
                      </span>
                    )}
                  </div>
                  <h4 className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                    {p.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">{p.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Fine-Tuning Controls */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 space-y-4">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-violet-400" />
          Audio Sensitivity & Motion Tuning
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Audio Sensitivity */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-300 font-medium">
              <span>Energy Sensitivity</span>
              <span className="text-violet-400 font-mono capitalize">{sensitivity}</span>
            </div>
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {(['low', 'normal', 'high'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => handleSensitivityChange(s)}
                  className={`py-1 rounded-lg font-semibold capitalize text-[11px] transition ${
                    sensitivity === s
                      ? 'bg-violet-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Motion Intensity */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-300 font-medium">
              <span>Motion Scale</span>
              <span className="text-amber-400 font-mono">{Math.round(motionIntensity * 100)}%</span>
            </div>
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {[
                { label: '75%', val: 0.75 },
                { label: '100%', val: 1.0 },
                { label: '135%', val: 1.35 },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleIntensityChange(item.val)}
                  className={`py-1 rounded-lg font-semibold text-[11px] transition ${
                    motionIntensity === item.val
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Accent Response */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-300 font-medium">
              <span>Accent Response</span>
              <span className="text-emerald-400 font-mono capitalize">{accentResponse}</span>
            </div>
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {(['subtle', 'punchy', 'intense'] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => handleAccentChange(a)}
                  className={`py-1 rounded-lg font-semibold capitalize text-[11px] transition ${
                    accentResponse === a
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Per-Line Auto Animation Timeline & Manual Overrides */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Timeline Line Assignments ({project.lyrics.length})
          </h3>

          <button
            onClick={handleResetOverrides}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 px-2 py-1 rounded-lg transition"
            title="Clear all manual adjustments and recompute baseline"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Overrides</span>
          </button>
        </div>

        <div className="space-y-2">
          {project.lyrics.map((line, idx) => {
            const lineAnim = config?.timeline?.find((t) => t.lineId === line.id);
            const isPlayingThis = currentTimeMs >= line.startTimeMs && currentTimeMs <= line.endTimeMs;

            return (
              <div
                key={line.id}
                className={`p-3 rounded-2xl border transition-all ${
                  isPlayingThis
                    ? 'bg-violet-950/40 border-violet-500 shadow-md shadow-violet-500/10'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  {/* Left: Timing + Text + Energy badge */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => {
                        onSeek(line.startTimeMs);
                        if (!isPlaying) onTogglePlay();
                      }}
                      className={`p-2 rounded-xl transition shrink-0 ${
                        isPlayingThis
                          ? 'bg-violet-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                      title="Play this line"
                    >
                      {isPlayingThis && isPlaying ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5 ml-0.5" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-mono text-slate-400">
                          {formatTime(line.startTimeMs)} - {formatTime(line.endTimeMs)}
                        </span>

                        {/* Energy Level Badge */}
                        {lineAnim && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                              lineAnim.energyLevel === 'peak'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : lineAnim.energyLevel === 'high'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : lineAnim.energyLevel === 'medium'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}
                          >
                            {lineAnim.energyLevel} Energy
                          </span>
                        )}

                        {lineAnim?.isUserOverride && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-bold">
                            Override
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-slate-100 truncate">{line.text}</p>
                    </div>
                  </div>

                  {/* Right: Motion Effect Dropdown Override */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <select
                      value={lineAnim?.motionEffect || 'DRIFT'}
                      onChange={(e) =>
                        handleLineOverride(line.id, {
                          motionEffect: e.target.value as AutoMotionEffect,
                        })
                      }
                      className="bg-slate-950 border border-slate-700 text-slate-200 text-xs font-medium rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-400"
                    >
                      {MOTION_EFFECTS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Transport & Quick Jump Actions */}
      <div className="sticky bottom-0 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 pt-3 pb-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className="w-10 h-10 rounded-full bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center shadow-lg transition active:scale-95"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <div className="text-xs">
            <div className="font-bold text-slate-200">
              {isPlaying ? 'Playing Audio' : 'Preview Audio'}
            </div>
            <div className="text-slate-400 font-mono text-[11px]">{formatTime(currentTimeMs)}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => {
              onUpdateProject({ animationMode: 'auto' });
              onNavigateToTab('preview');
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 shadow transition active:scale-95"
          >
            <Eye className="w-3.5 h-3.5 text-violet-400" />
            <span>Open 9:16 Live Preview</span>
          </button>

          <button
            onClick={() => {
              onUpdateProject({ animationMode: 'auto' });
              onNavigateToTab('export');
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Auto Animated Video</span>
          </button>
        </div>
      </div>
    </div>
  );
};
