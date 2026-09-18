export interface LrcLibTrack {
  id: number;
  name: string;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
}

export async function searchLrcLib(query: string): Promise<LrcLibTrack[]> {
  if (!query.trim()) return [];
  const url = `https://lrclib.net/api/search?q=${encodeURIComponent(query.trim())}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'AILyricVideoMaker/1.0 (Web/PWA)',
      },
    });
    if (!res.ok) {
      throw new Error(`LRCLIB error: ${res.status}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('LRCLIB search error:', err);
    throw err;
  }
}
