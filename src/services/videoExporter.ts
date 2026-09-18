import { ProjectData, LyricLine, WordTiming } from '../types/project';

export interface ExportProgress {
  progress: number; // 0 to 1
  currentTimeMs: number;
  totalDurationMs: number;
  status: 'rendering' | 'encoding' | 'completed' | 'error' | 'cancelled';
  frameIndex?: number;
  totalFrames?: number;
  secondsRemaining?: number;
  error?: string;
}

export interface ExportOptions {
  maxDurationMs?: number;
  onFrameRendered?: (canvas: HTMLCanvasElement) => void;
}

export class VideoExporter {
  private isCancelled = false;

  public cancel() {
    this.isCancelled = true;
  }

  public async exportVideo(
    project: ProjectData,
    audioElement: HTMLAudioElement | null,
    onProgress: (prog: ExportProgress) => void,
    options?: ExportOptions
  ): Promise<Blob> {
    this.isCancelled = false;
    const width = project.exportResolution === '1080p' ? 1080 : 720;
    const height = project.exportResolution === '1080p' ? 1920 : 1280;
    const fps = 30;
    
    // Determine target total duration
    const projectDuration = project.audioDurationMs || 30000;
    const totalDurationMs = options?.maxDurationMs
      ? Math.min(options.maxDurationMs, projectDuration)
      : Math.max(5000, projectDuration);

    // Setup canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      throw new Error('Could not initialize 2D canvas context');
    }

    // Load background image with 1.5s timeout (never hang the export)
    let bgImage: HTMLImageElement | null = null;
    if (project.background.type === 'image' && project.background.mediaUrl) {
      try {
        bgImage = await Promise.race([
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Image failed to load'));
            img.src = project.background.mediaUrl!;
          }),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
        ]);
      } catch {
        bgImage = null;
      }
    }

    // Pre-render the very first frame onto canvas so captureStream has initial bitmap data
    drawLyricFrame(ctx, width, height, project, 0, bgImage);
    if (options?.onFrameRendered) {
      options.onFrameRendered(canvas);
    }

    // Setup Web Audio mixing for stream if audio is present
    let audioStreamTrack: MediaStreamTrack | null = null;
    let audioContext: AudioContext | null = null;

    if (audioElement && audioElement.src && audioElement.src !== '') {
      try {
        const anyAudio = audioElement as any;
        if (typeof anyAudio.captureStream === 'function') {
          const stream = anyAudio.captureStream();
          audioStreamTrack = stream.getAudioTracks()[0] || null;
        } else if (typeof anyAudio.mozCaptureStream === 'function') {
          const stream = anyAudio.mozCaptureStream();
          audioStreamTrack = stream.getAudioTracks()[0] || null;
        }
      } catch (_) {}

      if (!audioStreamTrack) {
        try {
          const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          audioContext = new AudioContextClass();
          if (audioContext.state === 'suspended') {
            await audioContext.resume().catch(() => {});
          }
          const dest = audioContext.createMediaStreamDestination();
          try {
            const audioSourceNode = audioContext.createMediaElementSource(audioElement);
            audioSourceNode.connect(dest);
            audioSourceNode.connect(audioContext.destination);
          } catch (_) {}
          audioStreamTrack = dest.stream.getAudioTracks()[0] || null;
        } catch (err) {
          console.warn('Audio capture warning (continuing video export):', err);
        }
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
      'video/mp4;codecs=avc1,mp4a',
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

    // Play audio if available, but DO NOT DEPEND on it for timing
    if (audioElement && audioElement.src && audioElement.src !== '') {
      audioElement.currentTime = 0;
      audioElement.play().catch(() => {});
    }

    const renderStartTime = performance.now();
    let currentMs = 0;
    const totalFrames = Math.max(1, Math.round((totalDurationMs / 1000) * fps));

    const renderPromise = new Promise<Blob>((resolve, reject) => {
      mediaRecorder.onstop = () => {
        const outputBlob = new Blob(recordedChunks, { type: selectedMime || 'video/webm' });
        resolve(outputBlob);
      };

      mediaRecorder.onerror = (e) => reject(e);

      const loop = () => {
        if (this.isCancelled) {
          if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
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

        try {
          const now = performance.now();
          // STRICT MONOTONIC PROGRESSION: Time is derived directly from performance.now()
          // This guarantees it can NEVER freeze at 0% even if the audio element stalls
          const elapsed = now - renderStartTime;
          currentMs = Math.min(totalDurationMs, elapsed);

          // Render Frame
          drawLyricFrame(ctx, width, height, project, currentMs, bgImage);
          if (options?.onFrameRendered) {
            options.onFrameRendered(canvas);
          }

          // Calculate progress and remaining time
          const progressVal = Math.min(1, currentMs / totalDurationMs);
          const currentFrame = Math.min(totalFrames, Math.round((currentMs / 1000) * fps));
          const secondsRemaining = Math.max(0, Math.round((totalDurationMs - currentMs) / 1000));

          onProgress({
            progress: progressVal,
            currentTimeMs: currentMs,
            totalDurationMs,
            frameIndex: currentFrame,
            totalFrames,
            secondsRemaining,
            status: progressVal >= 1 ? 'encoding' : 'rendering',
          });

          if (currentMs < totalDurationMs) {
            requestAnimationFrame(loop);
          } else {
            if (audioElement) audioElement.pause();
            if (mediaRecorder.state !== 'inactive') {
              mediaRecorder.stop();
            }
          }
        } catch (err) {
          console.error('Render error:', err);
          if (audioElement) audioElement.pause();
          if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
          reject(err);
        }
      };

      // Initial progress trigger
      onProgress({
        progress: 0.01,
        currentTimeMs: 0,
        totalDurationMs,
        frameIndex: 1,
        totalFrames,
        secondsRemaining: Math.round(totalDurationMs / 1000),
        status: 'rendering',
      });

      requestAnimationFrame(loop);
    });

    const result = await renderPromise;
    onProgress({
      progress: 1,
      currentTimeMs: totalDurationMs,
      totalDurationMs,
      frameIndex: totalFrames,
      totalFrames,
      secondsRemaining: 0,
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
  let offsetX = 0;
  let offsetY = 0;

  const isAutoMode = project.animationMode === 'auto';
  const autoConfig = project.autoAnimationConfig;
  const lineAutoAnim =
    isAutoMode && autoConfig?.timeline
      ? autoConfig.timeline.find((t) => t.lineId === activeLine.id)
      : null;

  if (isAutoMode && lineAutoAnim) {
    // Auto Animation Kinematics
    const intensity = autoConfig?.motionIntensity ?? 1.0;
    const accentScale = lineAutoAnim.accentScale ?? 1.15;

    switch (lineAutoAnim.motionEffect) {
      case 'PUNCH': {
        // Sharp punch on beat entry, settles smoothly
        if (lineProgress < 0.2) {
          const punchT = lineProgress / 0.2;
          scale = 0.9 + Math.sin(punchT * Math.PI) * (accentScale - 0.9) * intensity;
          opacity = Math.min(1, punchT * 1.5);
        } else if (lineProgress > 0.85) {
          opacity = (1 - lineProgress) / 0.15;
        } else {
          scale = 1.0;
        }
        break;
      }
      case 'POP_ACCENT': {
        if (lineProgress < 0.25) {
          const popT = lineProgress / 0.25;
          scale = 0.85 + Math.sin(popT * (Math.PI / 2)) * (accentScale - 0.85);
          opacity = popT;
        } else if (lineProgress > 0.88) {
          opacity = (1 - lineProgress) / 0.12;
        } else {
          scale = 1.0 + (accentScale - 1.0) * 0.2;
        }
        break;
      }
      case 'DRIFT': {
        // Flowing kinetic horizontal/vertical drift
        opacity = lineProgress < 0.15 ? lineProgress / 0.15 : lineProgress > 0.85 ? (1 - lineProgress) / 0.15 : 1.0;
        offsetX = (lineProgress - 0.5) * 30 * intensity;
        offsetY = Math.sin(lineProgress * Math.PI) * -8 * intensity;
        break;
      }
      case 'FLOAT': {
        // Gentle breathing atmospheric float
        opacity = lineProgress < 0.2 ? lineProgress / 0.2 : lineProgress > 0.8 ? (1 - lineProgress) / 0.2 : 1.0;
        offsetY = Math.sin(lineProgress * Math.PI * 2) * 12 * intensity;
        scale = 1.0 + Math.sin(lineProgress * Math.PI) * 0.04 * intensity;
        break;
      }
      case 'PULSE': {
        // Rhythmic pulsing bounce
        opacity = lineProgress < 0.1 ? lineProgress / 0.1 : lineProgress > 0.9 ? (1 - lineProgress) / 0.1 : 1.0;
        scale = 1.0 + Math.abs(Math.sin(lineProgress * Math.PI * 4)) * 0.08 * intensity;
        break;
      }
      case 'ZOOM_IN': {
        opacity = lineProgress < 0.15 ? lineProgress / 0.15 : lineProgress > 0.85 ? (1 - lineProgress) / 0.15 : 1.0;
        scale = 0.92 + lineProgress * 0.16 * intensity;
        break;
      }
      case 'FADE_SLOW': {
        if (lineProgress < 0.25) opacity = lineProgress / 0.25;
        else if (lineProgress > 0.75) opacity = (1 - lineProgress) / 0.25;
        break;
      }
      default: {
        if (lineProgress < 0.15) opacity = lineProgress / 0.15;
        else if (lineProgress > 0.85) opacity = (1 - lineProgress) / 0.15;
      }
    }
  } else {
    // Manual animation calculation
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
  }

  ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
  ctx.translate(width / 2 + offsetX, targetY + offsetY);
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
