import { ProjectData, LyricLine, WordTiming } from '../types/project';

export interface ExportProgress {
  progress: number; // 0 to 1
  currentTimeMs: number;
  totalDurationMs: number;
  status: 'rendering' | 'encoding' | 'completed' | 'error' | 'cancelled';
  error?: string;
}

export class VideoExporter {
  private isCancelled = false;

  public cancel() {
    this.isCancelled = true;
  }

  public async exportVideo(
    project: ProjectData,
    audioElement: HTMLAudioElement | null,
    onProgress: (prog: ExportProgress) => void
  ): Promise<Blob> {
    this.isCancelled = false;
    const width = project.exportResolution === '1080p' ? 1080 : 720;
    const height = project.exportResolution === '1080p' ? 1920 : 1280;
    const fps = 30;
    const totalDurationMs = Math.max(5000, project.audioDurationMs || 30000);

    // Setup canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      throw new Error('Could not initialize 2D canvas context');
    }

    // Load background image if applicable
    let bgImage: HTMLImageElement | null = null;
    if (project.background.type === 'image' && project.background.mediaUrl) {
      try {
        bgImage = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Failed to load background image for video export'));
          img.src = project.background.mediaUrl!;
        });
      } catch (e) {
        console.warn('Background image could not be loaded for video export, fallback to gradient', e);
      }
    }

    // Setup Web Audio mixing for stream if audio is present
    let audioStreamTrack: MediaStreamTrack | null = null;
    let audioContext: AudioContext | null = null;
    let audioSourceNode: MediaElementAudioSourceNode | null = null;

    if (audioElement && audioElement.src) {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContext = new AudioContextClass();
        const dest = audioContext.createMediaStreamDestination();
        // Check if media element already has a source connected or create one
        try {
          audioSourceNode = audioContext.createMediaElementSource(audioElement);
          audioSourceNode.connect(dest);
          audioSourceNode.connect(audioContext.destination);
        } catch (_) {
          // In some browsers or repeated calls, createMediaElementSource throws if already created
        }
        audioStreamTrack = dest.stream.getAudioTracks()[0] || null;
      } catch (err) {
        console.warn('Could not capture audio stream for recording:', err);
      }
    }

    // Prepare MediaStream
    const canvasStream = canvas.captureStream(fps);
    const combinedTracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];
    if (audioStreamTrack) {
      combinedTracks.push(audioStreamTrack);
    }
    const combinedStream = new MediaStream(combinedTracks);

    // Select supported MIME type
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ];
    let selectedMime = '';
    for (const mime of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mime)) {
        selectedMime = mime;
        break;
      }
    }

    const recordedChunks: Blob[] = [];
    const mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType: selectedMime || undefined,
      videoBitsPerSecond: project.exportResolution === '1080p' ? 8000000 : 4000000,
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    mediaRecorder.start(200);

    // Render loop
    const frameIntervalMs = 1000 / fps;
    let currentMs = 0;

    // Play real audio if available
    if (audioElement) {
      audioElement.currentTime = 0;
      audioElement.play().catch(() => {});
    }

    const renderPromise = new Promise<Blob>((resolve, reject) => {
      mediaRecorder.onstop = () => {
        const outputBlob = new Blob(recordedChunks, { type: selectedMime || 'video/webm' });
        resolve(outputBlob);
      };
      mediaRecorder.onerror = (e) => reject(e);

      const loop = () => {
        if (this.isCancelled) {
          mediaRecorder.stop();
          if (audioElement) audioElement.pause();
          onProgress({
            progress: currentMs / totalDurationMs,
            currentTimeMs: currentMs,
            totalDurationMs,
            status: 'cancelled',
          });
          reject(new Error('Export cancelled by user'));
          return;
        }

        // Advance time
        if (audioElement && !audioElement.paused) {
          currentMs = Math.round(audioElement.currentTime * 1000);
        } else {
          currentMs += frameIntervalMs;
        }

        // Render Frame
        drawLyricFrame(ctx, width, height, project, currentMs, bgImage);

        // Notify progress
        const progressVal = Math.min(1, currentMs / totalDurationMs);
        onProgress({
          progress: progressVal,
          currentTimeMs: currentMs,
          totalDurationMs,
          status: progressVal >= 1 ? 'encoding' : 'rendering',
        });

        if (currentMs < totalDurationMs) {
          requestAnimationFrame(loop);
        } else {
          if (audioElement) audioElement.pause();
          mediaRecorder.stop();
        }
      };

      requestAnimationFrame(loop);
    });

    const result = await renderPromise;
    onProgress({
      progress: 1,
      currentTimeMs: totalDurationMs,
      totalDurationMs,
      status: 'completed',
    });
    return result;
  }
}

/**
 * Draws a single video frame with background, effects, and typography
 */
export function drawLyricFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  project: ProjectData,
  timeMs: number,
  bgImage: HTMLImageElement | null
) {
  // 1. Clear background
  ctx.save();
  if (bgImage && project.background.type === 'image') {
    // Draw cover
    const hRatio = width / bgImage.width;
    const vRatio = height / bgImage.height;
    const ratio = Math.max(hRatio, vRatio);
    const centerShiftX = (width - bgImage.width * ratio) / 2;
    const centerShiftY = (height - bgImage.height * ratio) / 2;
    ctx.drawImage(
      bgImage,
      0,
      0,
      bgImage.width,
      bgImage.height,
      centerShiftX,
      centerShiftY,
      bgImage.width * ratio,
      bgImage.height * ratio
    );
  } else if (project.background.type === 'gradient') {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#0F172A');
    grad.addColorStop(1, '#1E1B4B');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.fillStyle = project.background.color || '#0F172A';
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Dark Overlay
  ctx.fillStyle = project.background.overlayColor || '#000000';
  ctx.globalAlpha = project.background.overlayOpacity ?? 0.4;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1.0;
  ctx.restore();

  // 3. Find active lyric line
  const activeLine = project.lyrics.find(
    (l) => timeMs >= l.startTimeMs && timeMs <= l.endTimeMs
  );

  if (!activeLine) {
    return;
  }

  // 4. Calculate vertical Y position
  const { textStyle, animationStyle } = project;
  let targetY = height / 2;
  if (textStyle.verticalPosition === 'top') {
    targetY = height * 0.22;
  } else if (textStyle.verticalPosition === 'bottom') {
    targetY = height * 0.78;
  } else if (textStyle.verticalPosition === 'custom') {
    targetY = (height * (textStyle.customYPercent || 50)) / 100;
  }

  // 5. Animation interpolation
  const lineProgress = Math.max(
    0,
    Math.min(1, (timeMs - activeLine.startTimeMs) / (activeLine.endTimeMs - activeLine.startTimeMs))
  );

  ctx.save();
  let opacity = 1.0;
  let scale = 1.0;
  let offsetY = 0;

  if (animationStyle === 'FADE') {
    if (lineProgress < 0.15) opacity = lineProgress / 0.15;
    else if (lineProgress > 0.85) opacity = (1 - lineProgress) / 0.15;
  } else if (animationStyle === 'SLIDE') {
    if (lineProgress < 0.2) {
      offsetY = (1 - lineProgress / 0.2) * 40;
      opacity = lineProgress / 0.2;
    } else if (lineProgress > 0.85) {
      offsetY = -((lineProgress - 0.85) / 0.15) * 40;
      opacity = (1 - lineProgress) / 0.15;
    }
  } else if (animationStyle === 'ZOOM' || animationStyle === 'SCALE') {
    scale = 0.95 + lineProgress * 0.1;
  } else if (animationStyle === 'BOUNCE') {
    const t = Math.min(1, lineProgress * 4);
    scale = 1 + Math.sin(t * Math.PI) * 0.12;
  }

  ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
  ctx.translate(width / 2, targetY + offsetY);
  ctx.scale(scale, scale);

  // Setup font
  const scaledFontSize = textStyle.fontSize * (width / 400);
  const fontStyle = textStyle.isItalic ? 'italic ' : '';
  const fontWeight = textStyle.fontWeight || 700;
  ctx.font = `${fontStyle}${fontWeight} ${scaledFontSize}px ${textStyle.fontFamily || 'sans-serif'}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Check if karaoke or word highlight is enabled and word timings exist
  const hasWords = activeLine.words && activeLine.words.length > 0;
  const isKaraokeMode =
    (animationStyle === 'KARAOKE' || animationStyle === 'WORD_HIGHLIGHT') && hasWords;

  if (isKaraokeMode && activeLine.words) {
    // Measure total line width to position words
    const words = activeLine.words;
    const spaceWidth = ctx.measureText(' ').width;
    const wordWidths = words.map((w) => ctx.measureText(w.word).width);
    const totalLineWidth =
      wordWidths.reduce((a, b) => a + b, 0) + spaceWidth * (words.length - 1);

    let startX = -totalLineWidth / 2;

    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const wWidth = wordWidths[i];
      const wordCenter = startX + wWidth / 2;

      const isSung = timeMs >= w.endTimeMs;
      const isCurrent = timeMs >= w.startTimeMs && timeMs < w.endTimeMs;

      // Word color: highlight if sung or currently singing
      let fillCol = textStyle.textColor;
      if (isCurrent || isSung) {
        fillCol = textStyle.highlightColor;
      }

      ctx.save();
      if (textStyle.hasShadow) {
        ctx.shadowColor = textStyle.shadowColor || 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = textStyle.shadowBlur || 12;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
      }

      // Stroke
      if (textStyle.hasStroke) {
        ctx.strokeStyle = textStyle.strokeColor || '#000000';
        ctx.lineWidth = textStyle.strokeWidth * (width / 400);
        ctx.strokeText(w.word, wordCenter, 0);
      }

      // Fill
      ctx.fillStyle = fillCol;
      ctx.fillText(w.word, wordCenter, 0);
      ctx.restore();

      startX += wWidth + spaceWidth;
    }
  } else {
    // Standard line rendering
    if (textStyle.hasShadow) {
      ctx.shadowColor = textStyle.shadowColor || 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = textStyle.shadowBlur || 12;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;
    }

    if (textStyle.hasStroke) {
      ctx.strokeStyle = textStyle.strokeColor || '#000000';
      ctx.lineWidth = textStyle.strokeWidth * (width / 400);
      ctx.strokeText(activeLine.text, 0, 0);
    }

    ctx.fillStyle = textStyle.textColor;
    ctx.fillText(activeLine.text, 0, 0);
  }

  ctx.restore();
}
