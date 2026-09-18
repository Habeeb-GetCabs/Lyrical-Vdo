import React, { useState } from 'react';
import { ProjectData } from '../../types/project';
import { VideoExporter, ExportProgress } from '../../services/videoExporter';
import { exportToLRC, exportToSRT } from '../../services/lrcParser';
import { exportProjectToJson } from '../../services/storage';
import {
  Download,
  Video,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Share2,
} from 'lucide-react';

interface ExportScreenProps {
  project: ProjectData;
  onUpdateProject: (updated: Partial<ProjectData>) => void;
  audioElement: HTMLAudioElement | null;
}

export const ExportScreen: React.FC<ExportScreenProps> = ({
  project,
  onUpdateProject,
  audioElement,
}) => {
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exporterInstance, setExporterInstance] = useState<VideoExporter | null>(null);

  // Trigger Video Export
  const handleStartVideoExport = async () => {
    setIsExportingVideo(true);
    setExportedVideoUrl(null);
    const exporter = new VideoExporter();
    setExporterInstance(exporter);

    try {
      const blob = await exporter.exportVideo(project, audioElement, (prog) => {
        setExportProgress(prog);
      });

      const url = URL.createObjectURL(blob);
      setExportedVideoUrl(url);

      // Auto trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title.replace(/\s+/g, '_')}_lyric_video.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      if (err.message !== 'Export cancelled by user') {
        alert(`Export error: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsExportingVideo(false);
      setExporterInstance(null);
    }
  };

  const handleCancelVideoExport = () => {
    if (exporterInstance) {
      exporterInstance.cancel();
    }
    setIsExportingVideo(false);
  };

  // Download Standard LRC
  const handleDownloadStandardLrc = () => {
    const lrc = exportToLRC(project.lyrics, {
      title: project.title,
      artist: project.artist,
      album: project.album,
    }, false);
    downloadTextFile(lrc, `${project.title}_lyrics.lrc`);
  };

  // Download Enhanced LRC (with word timestamps)
  const handleDownloadEnhancedLrc = () => {
    const lrc = exportToLRC(project.lyrics, {
      title: project.title,
      artist: project.artist,
      album: project.album,
    }, true);
    downloadTextFile(lrc, `${project.title}_enhanced_karaoke.lrc`);
  };

  // Download SRT Subtitles
  const handleDownloadSrt = () => {
    const srt = exportToSRT(project.lyrics);
    downloadTextFile(srt, `${project.title}_subtitles.srt`);
  };

  // Helper
  const downloadTextFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-lg mx-auto w-full space-y-4 pb-8">
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Download className="w-5 h-5 text-amber-400" />
          Export & Share
        </h2>
        <p className="text-xs text-slate-400">
          Render finished video, download synced LRC files, SRT subtitles, or project backup.
        </p>
      </div>

      {/* 1. Main Video Render Card */}
      <div className="bg-gradient-to-br from-violet-950/40 via-slate-900 to-slate-950 rounded-2xl border border-violet-800/40 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">Video Export (MP4/WebM)</h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
            9:16 Vertical
          </span>
        </div>

        <p className="text-xs text-slate-300">
          Renders high-definition vertical video with animated custom fonts, background imagery, and audio synchronization.
        </p>

        {/* Resolution selector */}
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-slate-400">Resolution</span>
          <div className="flex gap-2">
            {(['720p', '1080p'] as const).map((res) => (
              <button
                key={res}
                onClick={() => onUpdateProject({ exportResolution: res })}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                  project.exportResolution === res
                    ? 'bg-violet-600 border-violet-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {res}
              </button>
            ))}
          </div>
        </div>

        {/* Export Progress Bar */}
        {isExportingVideo && exportProgress && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-400 font-medium capitalize flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {exportProgress.status === 'encoding' ? 'Finalizing encoding...' : 'Rendering video frames...'}
              </span>
              <span className="text-slate-300 font-mono font-bold">
                {Math.round(exportProgress.progress * 100)}%
              </span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-amber-400 transition-all duration-150"
                style={{ width: `${Math.round(exportProgress.progress * 100)}%` }}
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleCancelVideoExport}
                className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Cancel Render
              </button>
            </div>
          </div>
        )}

        {/* Ready Download Link */}
        {exportedVideoUrl && (
          <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-800/40 flex items-center justify-between">
            <span className="text-xs text-emerald-300 flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Video successfully rendered!
            </span>
            <a
              href={exportedVideoUrl}
              download={`${project.title.replace(/\s+/g, '_')}_video.webm`}
              className="text-xs font-bold text-amber-400 underline"
            >
              Re-download
            </a>
          </div>
        )}

        {/* Export Button */}
        <button
          onClick={handleStartVideoExport}
          disabled={isExportingVideo}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
        >
          {isExportingVideo ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Rendering in Progress...</span>
            </>
          ) : (
            <>
              <Video className="w-4 h-4" />
              <span>Render & Download Finished Video</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Lyrics & Subtitles Export Cards */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-violet-400" />
          Lyrics & Subtitle Formats
        </h3>

        <div className="space-y-2">
          {/* Standard LRC */}
          <button
            onClick={handleDownloadStandardLrc}
            className="w-full p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs transition group text-left"
          >
            <div>
              <div className="font-bold text-slate-100 group-hover:text-violet-300">
                Standard LRC (.lrc)
              </div>
              <div className="text-[11px] text-slate-500">
                Timestamped lines [mm:ss.xx] compatible with Spotify, Apple Music & Android players.
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-violet-400 shrink-0 ml-2" />
          </button>

          {/* Enhanced LRC */}
          <button
            onClick={handleDownloadEnhancedLrc}
            className="w-full p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs transition group text-left"
          >
            <div>
              <div className="font-bold text-slate-100 group-hover:text-violet-300 flex items-center gap-1.5">
                <span>Enhanced Karaoke LRC (.lrc)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  Word Timings
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Contains millisecond word timestamps &lt;mm:ss.xx&gt; for advanced karaoke engines.
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-violet-400 shrink-0 ml-2" />
          </button>

          {/* SRT Subtitle */}
          <button
            onClick={handleDownloadSrt}
            className="w-full p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs transition group text-left"
          >
            <div>
              <div className="font-bold text-slate-100 group-hover:text-violet-300">
                SubRip Subtitles (.srt)
              </div>
              <div className="text-[11px] text-slate-500">
                Universal subtitle file for YouTube, VLC, and video editors.
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-violet-400 shrink-0 ml-2" />
          </button>
        </div>
      </div>

      {/* 3. Project Backup JSON */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold text-slate-200">Project Backup (.json)</h3>
          <p className="text-[11px] text-slate-400">
            Save a backup file to import on other devices or reload later.
          </p>
        </div>

        <button
          onClick={() => exportProjectToJson(project)}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-violet-400" />
          <span>Save Backup</span>
        </button>
      </div>
    </div>
  );
};
