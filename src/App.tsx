import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ProjectData, createNewProject, LyricLine, TextStyleConfig, AnimationStyle, BackgroundConfig } from './types/project';
import { saveProject, getAllProjects } from './services/storage';
import { HomeScreen } from './components/screens/HomeScreen';
import { SongScreen } from './components/screens/SongScreen';
import { LyricsScreen } from './components/screens/LyricsScreen';
import { SyncScreen } from './components/screens/SyncScreen';
import { WordSyncScreen } from './components/screens/WordSyncScreen';
import { DesignScreen } from './components/screens/DesignScreen';
import { PreviewScreen } from './components/screens/PreviewScreen';
import { ExportScreen } from './components/screens/ExportScreen';
import { CIGuideScreen } from './components/screens/CIGuideScreen';
import { AutoAnimateScreen } from './components/screens/AutoAnimateScreen';
import { AIVisualDesignerScreen } from './components/screens/AIVisualDesignerScreen';
import { PWAInstallButton } from './components/pwa/PWAInstallButton';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { generateDemoRhythmAudioBlob } from './services/demoAudioGenerator';
import {
  Sparkles,
  Music,
  FileText,
  Sliders,
  Play,
  Palette,
  Download,
  Home,
  Github,
  Check,
  Zap,
} from 'lucide-react';

export type TabType =
  | 'home'
  | 'song'
  | 'lyrics'
  | 'sync'
  | 'words'
  | 'auto_animate'
  | 'design'
  | 'ai_designer'
  | 'preview'
  | 'export'
  | 'ci_guide';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [project, setProject] = useState<ProjectData>(() => createNewProject());
  const [selectedWordSyncLine, setSelectedWordSyncLine] = useState<number>(0);

  // Audio Playback states
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);
  const [durationMs, setDurationMs] = useState<number>(project.audioDurationMs || 32000);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  // Audio element ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-load latest project from IndexedDB on startup
  useEffect(() => {
    getAllProjects().then((list) => {
      if (list.length > 0) {
        setProject(list[0]);
        setDurationMs(list[0].audioDurationMs || 32000);
      } else {
        // Save initial default project
        saveProject(project);
      }
    });
  }, []);

  // Debounced auto-save project whenever it changes
  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveProject(project);
    }, 600);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [project]);

  // Audio element timeupdate & sync loop
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = playbackRate;
    audio.volume = volume;

    const handleTimeUpdate = () => {
      if (audio.currentTime !== undefined) {
        setCurrentTimeMs(Math.round(audio.currentTime * 1000));
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTimeMs(0);
    };

    const handleLoadedMeta = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        const ms = Math.round(audio.duration * 1000);
        setDurationMs(ms);
        setProject((prev) => ({ ...prev, audioDurationMs: ms }));
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMeta);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMeta);
    };
  }, [playbackRate, volume]);

  // Fallback timer when no audio source is present
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const hasAudioSrc = !!audioRef.current?.src;

    if (isPlaying && !hasAudioSrc) {
      const stepMs = Math.round(100 * playbackRate);
      interval = setInterval(() => {
        setCurrentTimeMs((prev) => {
          const next = prev + stepMs;
          if (next >= durationMs) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, durationMs, playbackRate]);

  // Toggle Play/Pause
  const handleTogglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (isPlaying) {
      if (audio && audio.src) audio.pause();
      setIsPlaying(false);
    } else {
      if (audio && audio.src) {
        audio.play().catch(() => {});
      }
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Seek time
  const handleSeek = useCallback((timeMs: number) => {
    const clamped = Math.max(0, Math.min(durationMs, timeMs));
    setCurrentTimeMs(clamped);
    if (audioRef.current && audioRef.current.src) {
      audioRef.current.currentTime = clamped / 1000;
    }
  }, [durationMs]);

  // Handle Audio File Upload
  const handleAudioUpload = (file: File) => {
    setAudioBlob(file);
    const url = URL.createObjectURL(file);
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.load();
    }
    setProject((prev) => ({
      ...prev,
      audioUrl: url,
      audioFileName: file.name,
    }));
  };

  // Handle Load Synthesized Offline Demo Audio
  const handleLoadDemoAudio = async () => {
    try {
      const demo = await generateDemoRhythmAudioBlob(24);
      setAudioBlob(demo.blob);
      const url = URL.createObjectURL(demo.blob);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.load();
      }
      setDurationMs(demo.durationMs);
      setProject((prev) => ({
        ...prev,
        audioUrl: url,
        audioFileName: demo.fileName,
        audioDurationMs: demo.durationMs,
      }));
    } catch (e) {
      console.error('Failed to generate demo audio', e);
    }
  };

  // Custom Font Uploaded
  const handleCustomFontUploaded = (name: string, family: string) => {
    setProject((prev) => ({
      ...prev,
      textStyle: {
        ...prev.textStyle,
        fontName: name,
        fontFamily: family,
      },
    }));
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      {/* Hidden Audio Tag */}
      <audio ref={audioRef} preload="auto" />

      {/* Offline Connectivity Notification Banner */}
      <OfflineIndicator />

      {/* Top Application Header */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div
            onClick={() => setActiveTab('home')}
            className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400 font-bold cursor-pointer hover:bg-violet-600/30 transition"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div onClick={() => setActiveTab('home')} className="cursor-pointer">
            <h1 className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
              <span>AI Lyric Maker</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 font-mono">
                PWA
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 truncate max-w-[150px] sm:max-w-xs">
              {project.title} • {project.artist}
            </p>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center space-x-2">
          {/* Quick Workflow Switcher Pill */}
          <button
            onClick={() => setActiveTab('auto_animate')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold transition"
            title="Switch or customize lyric animation workflow"
          >
            {project.animationMode === 'auto' ? (
              <span className="text-amber-400 flex items-center gap-1 font-bold">
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                <span className="hidden sm:inline">Option B:</span> Auto Animate
              </span>
            ) : (
              <span className="text-slate-300 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Option A:</span> Manual
              </span>
            )}
          </button>

          {/* In-app PWA install button */}
          <PWAInstallButton />

          {/* Android CI Guide shortcut */}
          <button
            onClick={() => setActiveTab('ci_guide')}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            title="GitHub Actions Android APK Build"
          >
            <Github className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden sm:inline">APK</span>
          </button>
        </div>
      </header>

      {/* Secondary Top Sub-Navigation for all screen sizes (horizontally scrollable on mobile) */}
      <div className="flex h-11 bg-slate-900/60 border-b border-slate-800/60 px-4 items-center gap-1.5 overflow-x-auto text-xs shrink-0 scrollbar-none scroll-smooth">
        {[
          { id: 'home', label: 'Home', icon: Home },
          { id: 'song', label: 'Song & Audio', icon: Music },
          { id: 'lyrics', label: 'Lyrics', icon: FileText },
          { id: 'sync', label: 'Line Sync', icon: Sliders },
          { id: 'words', label: 'Word Karaoke', icon: Sparkles },
          { id: 'auto_animate', label: '✨ Auto Animate', icon: Zap },
          { id: 'design', label: 'Designer & Fonts', icon: Palette },
          { id: 'ai_designer', label: '✨ AI Tamil Designer', icon: Sparkles },
          { id: 'preview', label: 'Live Preview', icon: Play },
          { id: 'export', label: 'Export Video', icon: Download },
        ].map((tab) => {
          const Icon = tab.icon;
          const isCurrent = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
                isCurrent
                  ? tab.id === 'auto_animate'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Screen Content View */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-950 p-3 sm:p-5">
        {activeTab === 'home' && (
          <HomeScreen
            onOpenProject={(p) => {
              setProject(p);
              setDurationMs(p.audioDurationMs || 32000);
              setActiveTab('preview');
            }}
            onNavigateToTab={(t) => setActiveTab(t)}
            onLoadDemoAudio={handleLoadDemoAudio}
            onAudioUpload={handleAudioUpload}
          />
        )}

        {activeTab === 'song' && (
          <SongScreen
            project={project}
            onUpdateProject={(upd) => setProject((prev) => ({ ...prev, ...upd }))}
            currentTimeMs={currentTimeMs}
            durationMs={durationMs}
            isPlaying={isPlaying}
            onSeek={handleSeek}
            onTogglePlay={handleTogglePlay}
            audioBlob={audioBlob}
            onAudioUpload={handleAudioUpload}
            onLoadDemoAudio={handleLoadDemoAudio}
            playbackRate={playbackRate}
            onChangePlaybackRate={setPlaybackRate}
            volume={volume}
            onChangeVolume={setVolume}
          />
        )}

        {activeTab === 'lyrics' && (
          <LyricsScreen
            project={project}
            onUpdateLyrics={(lyrics) => setProject((prev) => ({ ...prev, lyrics }))}
            onUpdateMetadata={(meta) => setProject((prev) => ({ ...prev, ...meta }))}
            onNavigateToTab={(t) => setActiveTab(t)}
          />
        )}

        {activeTab === 'sync' && (
          <SyncScreen
            project={project}
            onUpdateLyrics={(lyrics) => setProject((prev) => ({ ...prev, lyrics }))}
            currentTimeMs={currentTimeMs}
            durationMs={durationMs}
            isPlaying={isPlaying}
            onSeek={handleSeek}
            onTogglePlay={handleTogglePlay}
            audioBlob={audioBlob}
            onNavigateToWordSync={(lineIdx) => {
              setSelectedWordSyncLine(lineIdx);
              setActiveTab('words');
            }}
            onNavigateToTab={(t) => setActiveTab(t)}
          />
        )}

        {activeTab === 'words' && (
          <WordSyncScreen
            project={project}
            onUpdateLyrics={(lyrics) => setProject((prev) => ({ ...prev, lyrics }))}
            selectedLineIndex={selectedWordSyncLine}
            onSelectLineIndex={setSelectedWordSyncLine}
            currentTimeMs={currentTimeMs}
            durationMs={durationMs}
            isPlaying={isPlaying}
            onSeek={handleSeek}
            onTogglePlay={handleTogglePlay}
            onBackToSync={() => setActiveTab('sync')}
          />
        )}

        {activeTab === 'auto_animate' && (
          <AutoAnimateScreen
            project={project}
            onUpdateProject={(upd) => setProject((prev) => ({ ...prev, ...upd }))}
            currentTimeMs={currentTimeMs}
            durationMs={durationMs}
            isPlaying={isPlaying}
            onSeek={handleSeek}
            onTogglePlay={handleTogglePlay}
            audioBlob={audioBlob}
            onNavigateToTab={(t) => setActiveTab(t)}
            onAudioUpload={handleAudioUpload}
            onLoadDemoAudio={handleLoadDemoAudio}
          />
        )}

        {activeTab === 'design' && (
          <DesignScreen
            project={project}
            onUpdateTextStyle={(textStyle) =>
              setProject((prev) => ({
                ...prev,
                textStyle: { ...prev.textStyle, ...textStyle },
              }))
            }
            onUpdateAnimation={(animationStyle) =>
              setProject((prev) => ({ ...prev, animationStyle }))
            }
            onUpdateBackground={(background) =>
              setProject((prev) => ({
                ...prev,
                background: { ...prev.background, ...background },
              }))
            }
            onCustomFontUploaded={handleCustomFontUploaded}
          />
        )}

        {activeTab === 'ai_designer' && (
          <AIVisualDesignerScreen
            project={project}
            onUpdateProject={(upd) => setProject((prev) => ({ ...prev, ...upd }))}
            onNavigateToTab={(t) => setActiveTab(t)}
          />
        )}

        {activeTab === 'preview' && (
          <PreviewScreen
            project={project}
            currentTimeMs={currentTimeMs}
            durationMs={durationMs}
            isPlaying={isPlaying}
            onSeek={handleSeek}
            onTogglePlay={handleTogglePlay}
            audioBlob={audioBlob}
            onNavigateToTab={(t) => setActiveTab(t)}
            onUpdateProject={(upd) => setProject((prev) => ({ ...prev, ...upd }))}
          />
        )}

        {activeTab === 'export' && (
          <ExportScreen
            project={project}
            onUpdateProject={(upd) => setProject((prev) => ({ ...prev, ...upd }))}
            audioElement={audioRef.current}
          />
        )}

        {activeTab === 'ci_guide' && <CIGuideScreen />}
      </main>

      {/* Mobile Bottom Navigation Bar (Hidden on desktop) */}
      <nav className="md:hidden h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-around px-1 z-20 shrink-0 select-none">
        {[
          { id: 'home', label: 'Home', icon: Home },
          { id: 'song', label: 'Audio', icon: Music },
          { id: 'lyrics', label: 'Lyrics', icon: FileText },
          { id: 'sync', label: 'Sync', icon: Sliders },
          { id: 'auto_animate', label: '✨ Auto', icon: Zap },
          { id: 'design', label: 'Design', icon: Palette },
          { id: 'preview', label: 'Preview', icon: Play },
          { id: 'export', label: 'Export', icon: Download },
        ].map((item) => {
          const IconComp = item.icon;
          const isSelected = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isSelected
                  ? item.id === 'auto_animate'
                    ? 'text-amber-400 font-bold scale-105'
                    : 'text-amber-400 scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <IconComp className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
