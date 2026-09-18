import React, { useEffect, useState } from 'react';
import { ProjectData, createNewProject } from '../../types/project';
import { getAllProjects, saveProject, deleteProject, importProjectFromJson } from '../../services/storage';
import {
  Plus,
  Upload,
  FolderOpen,
  Trash2,
  Copy,
  Clock,
  Music,
  FileText,
  Sparkles,
  Smartphone,
  ChevronRight,
} from 'lucide-react';

interface HomeScreenProps {
  onOpenProject: (project: ProjectData) => void;
  onNavigateToTab: (tab: any) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onOpenProject, onNavigateToTab }) => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = async () => {
    setLoading(true);
    const list = await getAllProjects();
    setProjects(list);
    setLoading(false);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateNew = async () => {
    const title = prompt('Enter project name:', 'My Lyric Video') || 'Untitled Lyric Video';
    const newProj = createNewProject(title);
    await saveProject(newProj);
    await loadProjects();
    onOpenProject(newProj);
  };

  const handleDuplicate = async (proj: ProjectData, e: React.MouseEvent) => {
    e.stopPropagation();
    const duplicated: ProjectData = {
      ...proj,
      id: 'proj_' + Date.now(),
      title: `${proj.title} (Copy)`,
      createdDate: Date.now(),
      updatedDate: Date.now(),
    };
    await saveProject(duplicated);
    await loadProjects();
  };

  const handleDelete = async (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete project "${title}"?`)) {
      await deleteProject(id);
      await loadProjects();
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const imported = importProjectFromJson(text);
        await saveProject(imported);
        await loadProjects();
        onOpenProject(imported);
      } catch (err) {
        alert('Invalid project JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6 pb-8">
      {/* Welcome Hero / Quick Action Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-950/80 via-slate-900 to-slate-950 p-6 border border-violet-800/40 shadow-2xl">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[11px] font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Mobile Studio & Native Android
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              AI Lyric Video Maker
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md">
              Create synchronized lyric videos with custom Tamil/English typography, audio waveforms, tap-to-sync, and MP4 video export.
            </p>
          </div>

          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 transition active:scale-95 shrink-0"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>New Project</span>
          </button>
        </div>

        {/* Action Buttons Row */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer border border-slate-700 transition">
            <Upload className="w-3.5 h-3.5 text-violet-400" />
            <span>Import Project (.json)</span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          <button
            onClick={() => onNavigateToTab('ci_guide')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Android APK Guide</span>
          </button>
        </div>
      </div>

      {/* Projects List */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-violet-400" />
            Recent Projects ({projects.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">Loading projects from local storage...</div>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center bg-slate-900/40">
            <Music className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No saved projects yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Start by creating a new lyric video or exploring the preloaded demo project.
            </p>
            <button
              onClick={handleCreateNew}
              className="mt-4 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow"
            >
              Create First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => onOpenProject(proj)}
                className="group relative rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-violet-600/50 p-4 transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-slate-100 group-hover:text-violet-300 transition truncate">
                      {proj.title}
                    </h4>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={(e) => handleDuplicate(proj, e)}
                        className="p-1 text-slate-400 hover:text-slate-200 rounded"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(proj.id, proj.title, e)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-1 truncate">
                    {proj.artist || 'Unknown Artist'} • {proj.audioFileName}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3 text-violet-400" />
                    {proj.lyrics.length} lines
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(proj.updatedDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
