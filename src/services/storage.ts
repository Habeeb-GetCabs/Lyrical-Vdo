import { ProjectData, createNewProject } from '../types/project';

const DB_NAME = 'AILyricVideoMakerDB';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('updatedDate', 'updatedDate', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllProjects(): Promise<ProjectData[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const projects = (request.result as ProjectData[]) || [];
        // Sort descending by updatedDate
        projects.sort((a, b) => b.updatedDate - a.updatedDate);
        resolve(projects);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB unavailable or failed, returning memory fallback', err);
    return [];
  }
}

export async function getProject(id: string): Promise<ProjectData | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve((request.result as ProjectData) || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to load project from IndexedDB', err);
    return null;
  }
}

export async function saveProject(project: ProjectData): Promise<void> {
  const updatedProject: ProjectData = {
    ...project,
    updatedDate: Date.now(),
  };

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(updatedProject);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to save project to IndexedDB', err);
    // Fallback to localStorage
    try {
      localStorage.setItem('ai_lyric_active_project', JSON.stringify(updatedProject));
    } catch (_) {}
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to delete project', err);
  }
}

export function exportProjectToJson(project: ProjectData): void {
  const jsonStr = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.title.replace(/\s+/g, '_')}_project.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importProjectFromJson(jsonString: string): ProjectData {
  const parsed = JSON.parse(jsonString);
  if (!parsed.lyrics || !Array.isArray(parsed.lyrics)) {
    throw new Error('Invalid project file format: missing lyrics');
  }
  return {
    ...createNewProject(parsed.title || 'Imported Project'),
    ...parsed,
    id: 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    updatedDate: Date.now(),
  };
}
