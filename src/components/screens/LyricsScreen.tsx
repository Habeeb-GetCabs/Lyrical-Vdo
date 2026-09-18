import React, { useState, useRef } from 'react';
import { ProjectData, LyricLine } from '../../types/project';
import { parseLRC, parseTXT } from '../../services/lrcParser';
import { searchLrcLib, LrcLibTrack } from '../../services/lrclib';
import {
  FileText,
  Upload,
  Globe,
  Search,
  Sparkles,
  CheckCircle2,
  X,
  Loader2,
  Sliders,
} from 'lucide-react';

interface LyricsScreenProps {
  project: ProjectData;
  onUpdateLyrics: (lyrics: LyricLine[]) => void;
  onUpdateMetadata: (meta: { title?: string; artist?: string; album?: string }) => void;
  onNavigateToTab: (tab: any) => void;
}

export const LyricsScreen: React.FC<LyricsScreenProps> = ({
  project,
  onUpdateLyrics,
  onUpdateMetadata,
  onNavigateToTab,
}) => {
  const [rawText, setRawText] = useState(
    project.lyrics.map((l) => l.text).join('\n')
  );

  // LRCLIB Search Modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(`${project.title} ${project.artist}`.trim());
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<LrcLibTrack[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const lrcFileInputRef = useRef<HTMLInputElement | null>(null);
  const txtFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleApplyRawText = () => {
    const parsed = parseTXT(rawText);
    onUpdateLyrics(parsed);
  };

  const handleImportLrcFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const parsed = parseLRC(content);
      if (parsed.lines.length > 0) {
        onUpdateLyrics(parsed.lines);
        setRawText(parsed.lines.map((l) => l.text).join('\n'));
        if (parsed.metadata.title || parsed.metadata.artist) {
          onUpdateMetadata({
            title: parsed.metadata.title || project.title,
            artist: parsed.metadata.artist || project.artist,
            album: parsed.metadata.album || project.album,
          });
        }
        alert(`Successfully imported ${parsed.lines.length} synchronized lyric lines from LRC!`);
      } else {
        alert('Could not detect timestamped lines in this LRC file.');
      }
    };
    reader.readAsText(file);
  };

  const handleImportTxtFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setRawText(content);
      const parsed = parseTXT(content);
      onUpdateLyrics(parsed);
    };
    reader.readAsText(file);
  };

  // Perform LRCLIB Search
  const handleSearchLrcLib = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await searchLrcLib(searchQuery);
      setSearchResults(results);
      if (results.length === 0) {
        setSearchError('No matching lyrics found on LRCLIB. Try searching with track or artist name.');
      }
    } catch (err: any) {
      setSearchError('Search failed. Check your internet connection or try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectTrack = (track: LrcLibTrack) => {
    if (track.syncedLyrics) {
      const parsed = parseLRC(track.syncedLyrics);
      if (parsed.lines.length > 0) {
        onUpdateLyrics(parsed.lines);
        setRawText(parsed.lines.map((l) => l.text).join('\n'));
        onUpdateMetadata({
          title: track.trackName || track.name,
          artist: track.artistName,
          album: track.albumName,
        });
        setIsSearchOpen(false);
        alert(`Imported ${parsed.lines.length} synced lyric lines for "${track.name}"!`);
        return;
      }
    }

    if (track.plainLyrics) {
      setRawText(track.plainLyrics);
      const parsed = parseTXT(track.plainLyrics);
      onUpdateLyrics(parsed);
      onUpdateMetadata({
        title: track.trackName || track.name,
        artist: track.artistName,
        album: track.albumName,
      });
      setIsSearchOpen(false);
      alert(`Imported plain lyrics for "${track.name}". Ready for Tap to Sync!`);
      return;
    }

    alert('This track has no lyrics available.');
  };

  return (
    <div className="max-w-lg mx-auto w-full flex-1 flex flex-col space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-400" />
            Authoritative Lyrics
          </h2>
          <p className="text-xs text-slate-400">
            Paste lyrics directly, import standard LRC, or search online.
          </p>
        </div>

        <button
          onClick={() => {
            setSearchQuery(`${project.title} ${project.artist}`.trim());
            setIsSearchOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow transition"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Online Search</span>
        </button>
      </div>

      {/* Action Import Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => lrcFileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-medium border border-slate-800 transition"
        >
          <Upload className="w-3.5 h-3.5 text-violet-400" />
          <span>Import .LRC File</span>
        </button>
        <input
          ref={lrcFileInputRef}
          type="file"
          accept=".lrc"
          onChange={handleImportLrcFile}
          className="hidden"
        />

        <button
          onClick={() => txtFileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-medium border border-slate-800 transition"
        >
          <Upload className="w-3.5 h-3.5 text-amber-400" />
          <span>Import .TXT File</span>
        </button>
        <input
          ref={txtFileInputRef}
          type="file"
          accept=".txt"
          onChange={handleImportTxtFile}
          className="hidden"
        />
      </div>

      {/* Authoritative Textarea */}
      <div className="flex-1 flex flex-col">
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Paste or type Tamil / English lyrics here... Every line break is strictly preserved."
          className="flex-1 min-h-[320px] w-full p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-100 text-sm focus:outline-none focus:border-violet-500 font-sans resize-none leading-relaxed shadow-inner"
        />
      </div>

      {/* Status and Synchronize CTA */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-slate-400 font-mono">
          {rawText.split('\n').filter((l) => l.trim()).length} lines detected
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={handleApplyRawText}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            Update Lines
          </button>
          <button
            onClick={() => {
              handleApplyRawText();
              onNavigateToTab('sync');
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition active:scale-95"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Go to Line Sync</span>
          </button>
        </div>
      </div>

      {/* LRCLIB Online Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md max-h-[85vh] rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-violet-400" />
                Search Online Lyrics (LRCLIB)
              </h3>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSearchLrcLib} className="mt-4 flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Song title or artist name..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-violet-500 outline-none"
                autoFocus
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Search</span>
              </button>
            </form>

            {searchError && (
              <p className="mt-3 text-xs text-amber-400 bg-amber-950/40 p-2.5 rounded-lg border border-amber-900/50">
                {searchError}
              </p>
            )}

            {/* Results List */}
            <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1">
              {searchResults.map((track) => (
                <div
                  key={track.id}
                  onClick={() => handleSelectTrack(track)}
                  className="p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800/80 cursor-pointer transition flex items-center justify-between gap-3 group"
                >
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-slate-100 group-hover:text-violet-300 truncate">
                      {track.trackName || track.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      {track.artistName} {track.albumName ? `• ${track.albumName}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {track.syncedLyrics ? (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                        Synced
                      </span>
                    ) : track.plainLyrics ? (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                        Plain
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
