import { ProjectData, LyricLine, WordTiming } from '../types/project';
import { MusicVisualizerRenderer } from './musicVisualizerRenderer';

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
  // 1. Clear background & Apply Cinematic Background Motion
  ctx.save();
  if (bgImage && project.background.type === 'image') {
    // Cinematic camera motion calculations (slow zoom, pan, beat scale pulse)
    const motion = project.aiDesignerConfig?.backgroundMotion;
    const totalDuration = project.audioDurationMs || 30000;
    const songProgress = Math.min(1, Math.max(0, timeMs / totalDuration));
    let motionZoom = 1.0;
    let motionPanX = 0;
    let motionPanY = 0;

    if (motion) {
      const intensity = motion.intensity || 1.0;
      const beatBump = Math.sin((timeMs / 1000) * 4) > 0.82 ? (motion.beatPulseScale - 1.0) : 0;
      if (motion.type === 'SLOW_ZOOM_IN') {
        motionZoom = 1.0 + songProgress * 0.12 * intensity + beatBump;
      } else if (motion.type === 'SLOW_ZOOM_OUT') {
        motionZoom = 1.12 - songProgress * 0.12 * intensity + beatBump;
      } else if (motion.type === 'PAN_HORIZONTAL') {
        motionZoom = 1.08 + beatBump;
        motionPanX = Math.sin(songProgress * Math.PI * 2) * 24 * intensity;
      } else if (motion.type === 'PAN_VERTICAL') {
        motionZoom = 1.08 + beatBump;
        motionPanY = Math.sin(songProgress * Math.PI * 2) * 28 * intensity;
      } else {
        // BEAT_SCALE_PULSE
        motionZoom = 1.04 + beatBump * 1.5;
      }
    }

    const hRatio = width / bgImage.width;
    const vRatio = height / bgImage.height;
    const baseRatio = Math.max(hRatio, vRatio);
    const finalRatio = baseRatio * motionZoom;
    const centerShiftX = (width - bgImage.width * finalRatio) / 2 + motionPanX;
    const centerShiftY = (height - bgImage.height * finalRatio) / 2 + motionPanY;

    ctx.drawImage(
      bgImage,
      0,
      0,
      bgImage.width,
      bgImage.height,
      centerShiftX,
      centerShiftY,
      bgImage.width * finalRatio,
      bgImage.height * finalRatio
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

  // 3. Check for active lyric line vs Instrumental Gap
  const activeLine = project.lyrics.find(
    (l) => timeMs >= l.startTimeMs && timeMs <= l.endTimeMs
  );

  const aiDesigner = project.aiDesignerConfig;

  // IF NO ACTIVE LYRIC: Activate AI Music Visualizer (Instrumental Gap)
  if (!activeLine) {
    if (aiDesigner) {
      MusicVisualizerRenderer.render({
        ctx,
        width,
        height,
        timeMs,
        visualizerType: aiDesigner.activeVisualizer,
        primaryColor: aiDesigner.primaryColor,
        accentColor: aiDesigner.accentColor,
        glowColor: aiDesigner.glowColor,
        energy: aiDesigner.visualEnergy,
        position: aiDesigner.visualizerPosition,
        opacity: 0.92,
        isGap: true,
      });
    }
    return;
  }

  // If lyrics ARE active, also render background visualizer gently if configured
  if (aiDesigner && aiDesigner.visualizerPosition === 'bottom') {
    MusicVisualizerRenderer.render({
      ctx,
      width,
      height,
      timeMs,
      visualizerType: aiDesigner.activeVisualizer,
      primaryColor: aiDesigner.primaryColor,
      accentColor: aiDesigner.accentColor,
      glowColor: aiDesigner.glowColor,
      energy: aiDesigner.visualEnergy,
      position: 'bottom',
      opacity: 0.3,
      isGap: false,
    });
  }

  // 4. Calculate vertical Y position & AI Designer Line Config
  const lineDesign = aiDesigner?.lines ? aiDesigner.lines[activeLine.id] : null;
  const { textStyle, animationStyle } = project;

  let targetY = height / 2;
  if (lineDesign) {
    targetY = (height * lineDesign.verticalPositionPercent) / 100;
  } else if (textStyle.verticalPosition === 'top') {
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

  // Handle AI Designer or Auto Animation or Manual animation
  if (lineDesign) {
    // AI Designer Entrance & Exit Kinematics
    if (lineProgress < 0.15) {
      const enterT = lineProgress / 0.15;
      opacity = enterT;
      if (lineDesign.entranceAnimation === 'scale_pop') scale = 0.88 + enterT * 0.12;
      else if (lineDesign.entranceAnimation === 'slide_up') offsetY = (1 - enterT) * 35;
      else if (lineDesign.entranceAnimation === 'blur_in') scale = 0.95 + enterT * 0.05;
    } else if (lineProgress > 0.88) {
      const exitT = (lineProgress - 0.88) / 0.12;
      opacity = 1 - exitT;
      if (lineDesign.exitAnimation === 'slide_down') offsetY = exitT * 30;
      else if (lineDesign.exitAnimation === 'zoom_out') scale = 1.0 + exitT * 0.12;
    } else {
      // Subtle float / breathing during line display
      scale = 1.0 + Math.sin(lineProgress * Math.PI) * 0.02;
    }
  } else {
    const isAutoMode = project.animationMode === 'auto';
    const autoConfig = project.autoAnimationConfig;
    const lineAutoAnim =
      isAutoMode && autoConfig?.timeline
        ? autoConfig.timeline.find((t) => t.lineId === activeLine.id)
        : null;

    if (isAutoMode && lineAutoAnim) {
      const intensity = autoConfig?.motionIntensity ?? 1.0;
      const accentScale = lineAutoAnim.accentScale ?? 1.15;

      switch (lineAutoAnim.motionEffect) {
        case 'PUNCH': {
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
          opacity = lineProgress < 0.15 ? lineProgress / 0.15 : lineProgress > 0.85 ? (1 - lineProgress) / 0.15 : 1.0;
          offsetX = (lineProgress - 0.5) * 30 * intensity;
          offsetY = Math.sin(lineProgress * Math.PI) * -8 * intensity;
          break;
        }
        case 'FLOAT': {
          opacity = lineProgress < 0.2 ? lineProgress / 0.2 : lineProgress > 0.8 ? (1 - lineProgress) / 0.2 : 1.0;
          offsetY = Math.sin(lineProgress * Math.PI * 2) * 12 * intensity;
          scale = 1.0 + Math.sin(lineProgress * Math.PI) * 0.04 * intensity;
          break;
        }
        case 'PULSE': {
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
  }

  ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
  ctx.translate(width / 2 + offsetX, targetY + offsetY);
  ctx.scale(scale, scale);

  // 6. RENDER WORDS: AI Lyric Visual Designer or Standard Line
  if (lineDesign && lineDesign.words && lineDesign.words.length > 0) {
    // Dynamic Tamil Typography Rendering
    const words = lineDesign.words;
    const rawWordTimings = activeLine.words || [];

    // Measure total line layout
    const wordMeasures = words.map((w) => {
      const scaledSize = w.fontSize * (width / 400);
      ctx.font = `700 ${scaledSize}px ${w.fontFamily || textStyle.fontFamily || 'sans-serif'}`;
      return {
        ...w,
        scaledSize,
        width: ctx.measureText(w.word).width,
      };
    });

    const spaceW = 12 * (width / 400);
    const totalW = wordMeasures.reduce((acc, curr) => acc + curr.width, 0) + spaceW * (words.length - 1);

    let curX = -totalW / 2;

    for (let i = 0; i < wordMeasures.length; i++) {
      const wm = wordMeasures[i];
      const timing = rawWordTimings[i];

      // Highlight status if word timings exist
      const isSung = timing ? timeMs >= timing.endTimeMs : lineProgress > (i / wordMeasures.length);
      const isCurrent = timing
        ? timeMs >= timing.startTimeMs && timeMs < timing.endTimeMs
        : lineProgress >= (i / wordMeasures.length) && lineProgress < ((i + 1) / wordMeasures.length);

      const wordCenter = curX + wm.width / 2 + (wm.offsetX * (width / 400));
      const wordY = (wm.offsetY * (width / 400));

      ctx.save();
      ctx.translate(wordCenter, wordY);

      // Organic rotation
      if (wm.rotationDeg !== 0) {
        ctx.rotate((wm.rotationDeg * Math.PI) / 180);
      }

      // Word animation micro-scaling (beat pop or emphasis)
      let wordScale = 1.0;
      if (isCurrent) {
        wordScale = wm.sizeTier === 'very_large' ? 1.18 : 1.08;
      }
      ctx.scale(wordScale, wordScale);

      ctx.font = `700 ${wm.scaledSize}px ${wm.fontFamily || textStyle.fontFamily || 'sans-serif'}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Color selection (Gold/Accent or Primary White)
      let fillCol = wm.color;
      if (isCurrent) {
        fillCol = aiDesigner?.accentColor || textStyle.highlightColor || '#F59E0B';
      }

      // Effects: Glow / Shadow / Stroke / Soft Neon
      if (wm.effect === 'glow' || isCurrent) {
        ctx.shadowColor = aiDesigner?.glowColor || '#F59E0B';
        ctx.shadowBlur = (isCurrent ? 24 : 14) * (width / 400);
      } else {
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 10 * (width / 400);
        ctx.shadowOffsetY = 4 * (width / 400);
      }

      // Stroke outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = Math.max(2, 4 * (width / 400));
      ctx.strokeText(wm.word, 0, 0);

      // Fill
      ctx.fillStyle = fillCol;
      ctx.fillText(wm.word, 0, 0);

      ctx.restore();
      curX += wm.width + spaceW;
    }
  } else {
    // Standard Line rendering fallback
    const scaledFontSize = textStyle.fontSize * (width / 400);
    const fontStyle = textStyle.isItalic ? 'italic ' : '';
    const fontWeight = textStyle.fontWeight || 700;
    ctx.font = `${fontStyle}${fontWeight} ${scaledFontSize}px ${textStyle.fontFamily || 'sans-serif'}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const hasWords = activeLine.words && activeLine.words.length > 0;
    const isKaraokeMode =
      (animationStyle === 'KARAOKE' || animationStyle === 'WORD_HIGHLIGHT') && hasWords;

    if (isKaraokeMode && activeLine.words) {
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

        if (textStyle.hasStroke) {
          ctx.strokeStyle = textStyle.strokeColor || '#000000';
          ctx.lineWidth = textStyle.strokeWidth * (width / 400);
          ctx.strokeText(w.word, wordCenter, 0);
        }

        ctx.fillStyle = fillCol;
        ctx.fillText(w.word, wordCenter, 0);
        ctx.restore();

        startX += wWidth + spaceWidth;
      }
    } else {
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
  }

  ctx.restore();
}
