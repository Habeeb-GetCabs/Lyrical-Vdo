import React, { useRef } from 'react';
import { ProjectData } from '../../types/project';
import { WaveformEditor } from '../waveform/WaveformEditor';
import { Music, Upload, CheckCircle2, Volume2, Gauge, Disc } from 'lucide-react';

interface SongScreenProps {
  project: ProjectData;
  onUpdateProject: (updated: Partial<ProjectData>) => void;
  currentTimeMs: number;
  durationMs: number;
  isPlaying: boolean;
  onSeek: (ms: number) => void;
  onTogglePlay: () => void;
  audioBlob: Blob | null;
  onAudioUpload: (file: File) => void;
  playbackRate: number;
  onChangePlaybackRate: (rate: number) => void;
  volume: number;
  onChangeVolume: (vol: number) => void;
}

export const SongScreen: React.FC<SongScreenProps> = ({
  project,
  onUpdateProject,
  currentTimeMs,
  durationMs,
  isPlaying,
  onSeek,
  onTogglePlay,
  audioBlob,
  onAudioUpload,
  playbackRate,
  onChangePlaybackRate,
  volume,
  onChangeVolume,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAudioUpload(file);
    }
  };

  return (
    <div className="max-w-lg mx-auto w-full space-y-4 pb-8">
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Music className="w-5 h-5 text-violet-400" />
          Song & Audio Setup
        </h2>
        <p className="text-xs text-slate-400">
          Upload your song or vocal track. Control playback speed for precise synchronization.
        </p>
      </div>

      {/* Track Metadata Card */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Disc className="w-4 h-4 text-violet-400" />
          Song Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Song Title</label>
            <input
              type="text"
              value={project.title}
              onChange={(e) => onUpdateProject({ title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-violet-500 outline-none"
              placeholder="e.g. Kannazhaga"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Artist / Singer</label>
            <input
              type="text"
              value={project.artist}
              onChange={(e) => onUpdateProject({ artist: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:border-violet-500 outline-none"
              placeholder="e.g. Anirudh, Dhanush"
            />
          </div>
        </div>
      </div>

      {/* Audio File Card */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Audio Source</span>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {project.audioFileName}
          </span>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition active:scale-[0.99]"
        >
          <Upload className="w-4 h-4 text-violet-400" />
          <span>Upload Audio File (MP3, WAV, M4A, FLAC)</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <p className="text-[11px] text-slate-500">
          Audio is decoded locally in your browser and will play offline.
        </p>
      </div>

      {/* Playback Controls & Speed */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-amber-400" />
            Playback Speed (Slow for Sync)
          </span>
          <span className="font-mono text-amber-400 font-bold">{playbackRate}x</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[0.5, 0.75, 1.0, 1.25].map((rate) => (
            <button
              key={rate}
              onClick={() => onChangePlaybackRate(rate)}
              className={`py-1.5 rounded-lg text-xs font-semibold border transition ${
                playbackRate === rate
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Volume */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <Volume2 className="w-4 h-4 text-violet-400" />
            Volume
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
            className="flex-1 max-w-[160px] accent-violet-500"
          />
          <span className="text-slate-400 font-mono w-8 text-right">{Math.round(volume * 100)}%</span>
        </div>
      </div>

      {/* Waveform Inspection */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          Audio Waveform & Scrubbing
        </h3>
        <WaveformEditor
          currentTimeMs={currentTimeMs}
          durationMs={durationMs}
          isPlaying={isPlaying}
          onSeek={onSeek}
          onTogglePlay={onTogglePlay}
          lyricLines={project.lyrics}
          activeLineIndex={project.lyrics.findIndex(
            (l) => currentTimeMs >= l.startTimeMs && currentTimeMs <= l.endTimeMs
          )}
          audioBlob={audioBlob}
        />
      </div>
    </div>
  );
};
