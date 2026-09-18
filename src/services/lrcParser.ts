import { LyricLine, WordTiming, ProjectMetadata } from '../types/project';

export interface ParsedLrcResult {
  metadata: ProjectMetadata;
  lines: LyricLine[];
}

/**
 * Parses millisecond time string [mm:ss.xx] or <mm:ss.xx> into milliseconds.
 */
export function timeStringToMs(timeStr: string): number {
  const clean = timeStr.replace(/[\[\]<>]/g, '').trim();
  const parts = clean.split(':');
  if (parts.length < 2) return 0;

  const minutes = parseInt(parts[0], 10) || 0;
  const secParts = parts[1].split('.');
  const seconds = parseInt(secParts[0], 10) || 0;
  let fractionMs = 0;
  if (secParts.length > 1) {
    const rawFrac = secParts[1];
    if (rawFrac.length === 1) fractionMs = parseInt(rawFrac, 10) * 100;
    else if (rawFrac.length === 2) fractionMs = parseInt(rawFrac, 10) * 10;
    else fractionMs = parseInt(rawFrac.substring(0, 3), 10);
  }
  return minutes * 60000 + seconds * 1000 + fractionMs;
}

/**
 * Formats milliseconds into [mm:ss.xx]
 */
export function msToTimeString(ms: number, delimiter: 'brackets' | 'tags' = 'brackets'): string {
  const clamped = Math.max(0, ms);
  const totalSeconds = Math.floor(clamped / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centis = Math.floor((clamped % 1000) / 10);

  const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
  return delimiter === 'tags' ? `<${formatted}>` : `[${formatted}]`;
}

/**
 * Formats milliseconds into SRT time 00:00:00,000
 */
export function msToSrtTime(ms: number): string {
  const clamped = Math.max(0, ms);
  const hours = Math.floor(clamped / 3600000);
  const minutes = Math.floor((clamped % 3600000) / 60000);
  const seconds = Math.floor((clamped % 60000) / 1000);
  const millis = clamped % 1000;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${millis.toString().padStart(3, '0')}`;
}

/**
 * Parse an LRC string (Standard or Enhanced word-level LRC)
 */
export function parseLRC(lrcText: string): ParsedLrcResult {
  const lines = lrcText.split(/\r?\n/);
  const metadata: ProjectMetadata = {
    title: '',
    artist: '',
    album: '',
  };

  const rawEntries: { timeMs: number; text: string; rawWords?: WordTiming[] }[] = [];

  const metaRegex = /^\[(ti|ar|al|by|offset):(.*)\]$/i;
  const timeTagRegex = /\[(\d{1,2}:\d{2}(?:\.\d{1,3})?)\]/g;
  const wordTagRegex = /<(\d{1,2}:\d{2}(?:\.\d{1,3})?)>([^<]+)/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check metadata
    const metaMatch = trimmed.match(metaRegex);
    if (metaMatch) {
      const key = metaMatch[1].toLowerCase();
      const val = metaMatch[2].trim();
      if (key === 'ti') metadata.title = val;
      else if (key === 'ar') metadata.artist = val;
      else if (key === 'al') metadata.album = val;
      continue;
    }

    // Check if line contains timestamp tags
    const timeMatches = Array.from(trimmed.matchAll(timeTagRegex));
    if (timeMatches.length > 0) {
      // Extract text portion after all initial [mm:ss.xx] tags
      let textPortion = trimmed.replace(timeTagRegex, '').trim();

      // Check if line contains Enhanced LRC word timestamps: e.g. <00:12.30>word <00:12.80>next
      const words: WordTiming[] = [];
      const wordMatches = Array.from(textPortion.matchAll(wordTagRegex));

      if (wordMatches.length > 0) {
        for (let w = 0; w < wordMatches.length; w++) {
          const wTime = timeStringToMs(wordMatches[w][1]);
          const wText = wordMatches[w][2].trim();
          const nextWTime = w + 1 < wordMatches.length ? timeStringToMs(wordMatches[w + 1][1]) : wTime + 600;
          words.push({
            id: 'word_' + w + '_' + Math.random().toString(36).substring(2, 5),
            word: wText,
            startTimeMs: wTime,
            endTimeMs: Math.max(wTime + 100, nextWTime),
          });
        }
        // Plain text is just all words joined
        textPortion = words.map((w) => w.word).join(' ');
      }

      for (const tm of timeMatches) {
        const timeMs = timeStringToMs(tm[1]);
        rawEntries.push({
          timeMs,
          text: textPortion,
          rawWords: words.length > 0 ? words : undefined,
        });
      }
    }
  }

  // Sort chronologically
  rawEntries.sort((a, b) => a.timeMs - b.timeMs);

  // Compute end times based on next line's start
  const resultLines: LyricLine[] = [];
  for (let i = 0; i < rawEntries.length; i++) {
    const entry = rawEntries[i];
    const nextEntry = rawEntries[i + 1];
    const startTimeMs = entry.timeMs;
    const endTimeMs = nextEntry
      ? Math.max(startTimeMs + 500, nextEntry.timeMs - 150)
      : startTimeMs + 3500;

    let lineWords = entry.rawWords;
    // If no word timing exists, initialize equal-slice word timings for karaoke readiness
    if (!lineWords && entry.text) {
      const splitWords = entry.text.split(/\s+/).filter((w) => w.length > 0);
      if (splitWords.length > 0) {
        const wordDuration = (endTimeMs - startTimeMs) / splitWords.length;
        lineWords = splitWords.map((w, widx) => ({
          id: `w_${i}_${widx}`,
          word: w,
          startTimeMs: Math.round(startTimeMs + widx * wordDuration),
          endTimeMs: Math.round(startTimeMs + (widx + 1) * wordDuration),
        }));
      }
    }

    resultLines.push({
      id: 'line_' + (i + 1),
      text: entry.text,
      startTimeMs,
      endTimeMs,
      words: lineWords,
    });
  }

  return { metadata, lines: resultLines };
}

/**
 * Parse plain text lines into initial LyricLine items
 */
export function parseTXT(text: string, defaultLineDurationMs = 3500): LyricLine[] {
  const clean = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return clean.map((lineText, idx) => {
    const start = idx * 4000;
    const end = start + defaultLineDurationMs;
    const words = lineText.split(/\s+/).filter((w) => w.length > 0);
    const wordDur = words.length > 0 ? (end - start) / words.length : end - start;

    return {
      id: 'txt_line_' + (idx + 1),
      text: lineText,
      startTimeMs: start,
      endTimeMs: end,
      words: words.map((w, widx) => ({
        id: `w_${idx}_${widx}`,
        word: w,
        startTimeMs: Math.round(start + widx * wordDur),
        endTimeMs: Math.round(start + (widx + 1) * wordDur),
      })),
    };
  });
}

/**
 * Export to Standard LRC or Enhanced LRC (with word timestamps)
 */
export function exportToLRC(
  lines: LyricLine[],
  metadata?: ProjectMetadata,
  enhancedWordSync = false
): string {
  const out: string[] = [];

  if (metadata) {
    if (metadata.title) out.push(`[ti:${metadata.title}]`);
    if (metadata.artist) out.push(`[ar:${metadata.artist}]`);
    if (metadata.album) out.push(`[al:${metadata.album}]`);
    out.push('[by:AI Lyric Video Maker]');
    out.push('');
  }

  for (const line of lines) {
    const timeTag = msToTimeString(line.startTimeMs, 'brackets');
    if (enhancedWordSync && line.words && line.words.length > 0) {
      const wordsStr = line.words
        .map((w) => `${msToTimeString(w.startTimeMs, 'tags')}${w.word}`)
        .join(' ');
      out.push(`${timeTag} ${wordsStr}`);
    } else {
      out.push(`${timeTag}${line.text}`);
    }
  }

  return out.join('\n');
}

/**
 * Export to standard SubRip Subtitle (.SRT)
 */
export function exportToSRT(lines: LyricLine[]): string {
  const out: string[] = [];
  lines.forEach((line, idx) => {
    out.push((idx + 1).toString());
    out.push(`${msToSrtTime(line.startTimeMs)} --> ${msToSrtTime(line.endTimeMs)}`);
    out.push(line.text);
    out.push('');
  });
  return out.join('\n');
}
