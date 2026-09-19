import { MusicVisualizerType } from '../types/project';

export interface VisualizerRenderOptions {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  timeMs: number;
  visualizerType: MusicVisualizerType;
  primaryColor: string;
  accentColor: string;
  glowColor: string;
  energy: number; // 0 to 100
  position: 'bottom' | 'top' | 'edges' | 'behind_lyrics' | 'center';
  opacity?: number; // 0 to 1
  isGap?: boolean;
}

export class MusicVisualizerRenderer {
  /**
   * Draws the active music visualizer directly onto a Canvas 2D context.
   */
  public static render(options: VisualizerRenderOptions): void {
    const {
      ctx,
      width,
      height,
      timeMs,
      visualizerType,
      primaryColor,
      accentColor,
      glowColor,
      energy,
      position,
      opacity = 1.0,
      isGap = true,
    } = options;

    if (opacity <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

    const t = timeMs / 1000;
    const energyFactor = (energy / 100) * (isGap ? 1.2 : 0.65);

    // Compute baseline Y anchor
    let baseY = height * 0.78;
    if (position === 'top') baseY = height * 0.22;
    else if (position === 'center' || position === 'behind_lyrics') baseY = height * 0.5;

    switch (visualizerType) {
      case 'AUDIO_EQUALIZER':
        this.drawEqualizer(ctx, width, baseY, t, energyFactor, accentColor, primaryColor);
        break;
      case 'CIRCULAR_EQUALIZER':
        this.drawCircularEqualizer(ctx, width / 2, height / 2, t, energyFactor, accentColor, glowColor);
        break;
      case 'WAVEFORM':
        this.drawWaveform(ctx, width, baseY, t, energyFactor, accentColor, primaryColor);
        break;
      case 'AUDIO_RINGS':
        this.drawAudioRings(ctx, width / 2, height / 2, t, energyFactor, accentColor, glowColor);
        break;
      case 'PARTICLE_PULSE':
        this.drawParticlePulse(ctx, width, height, t, energyFactor, accentColor, primaryColor);
        break;
      case 'GLOW_PULSE':
        this.drawGlowPulse(ctx, width / 2, baseY, t, energyFactor, glowColor, accentColor);
        break;
      case 'EDGE_VISUALIZER':
        this.drawEdgeVisualizer(ctx, width, height, t, energyFactor, accentColor, primaryColor);
        break;
      case 'WAVE_LINES':
        this.drawWaveLines(ctx, width, baseY, t, energyFactor, accentColor, primaryColor);
        break;
      case 'MINIMAL_DOT_VISUALIZER':
        this.drawMinimalDots(ctx, width, baseY, t, energyFactor, accentColor, primaryColor);
        break;
      case 'BASS_PULSE':
      default:
        this.drawBassPulseOverlay(ctx, width, height, t, energyFactor, accentColor);
        break;
    }

    ctx.restore();
  }

  // 1. Equalizer Bars
  private static drawEqualizer(
    ctx: CanvasRenderingContext2D,
    width: number,
    baseY: number,
    t: number,
    energy: number,
    accent: string,
    primary: string
  ): void {
    const barCount = 28;
    const totalW = width * 0.75;
    const barW = (totalW / barCount) * 0.65;
    const gap = (totalW / barCount) * 0.35;
    const startX = (width - totalW) / 2;

    for (let i = 0; i < barCount; i++) {
      // Harmonic oscillation simulating frequencies
      const freq = 1.8 + (i % 6) * 0.7;
      const hNorm =
        Math.abs(Math.sin(t * freq + i * 0.45) * Math.cos(t * 1.2 + i * 0.3)) * 0.85 +
        Math.abs(Math.sin(t * 4 + i * 0.2)) * 0.15;
      const barH = Math.max(6, hNorm * 110 * energy);

      const x = startX + i * (barW + gap);
      const y = baseY - barH / 2;

      ctx.save();
      const grad = ctx.createLinearGradient(x, y, x, y + barH);
      grad.addColorStop(0, accent);
      grad.addColorStop(1, primary);
      ctx.fillStyle = grad;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 8 * energy;

      // Rounded bar pill
      ctx.beginPath();
      const r = barW / 2;
      ctx.roundRect ? ctx.roundRect(x, y, barW, barH, [r, r, r, r]) : ctx.rect(x, y, barW, barH);
      ctx.fill();
      ctx.restore();
    }
  }

  // 2. Circular Equalizer
  private static drawCircularEqualizer(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    t: number,
    energy: number,
    accent: string,
    glow: string
  ): void {
    const bars = 48;
    const radius = 75;

    ctx.save();
    ctx.shadowColor = glow;
    ctx.shadowBlur = 12 * energy;

    for (let i = 0; i < bars; i++) {
      const angle = (i / bars) * Math.PI * 2 + t * 0.3;
      const hNorm = Math.abs(Math.sin(t * 2.5 + i * 0.6)) * 0.7 + Math.cos(t * 1.8 + i * 0.3) * 0.3;
      const barLen = 8 + Math.abs(hNorm) * 45 * energy;

      const x1 = cx + Math.cos(angle) * radius;
      const y1 = cy + Math.sin(angle) * radius;
      const x2 = cx + Math.cos(angle) * (radius + barLen);
      const y2 = cy + Math.sin(angle) * (radius + barLen);

      ctx.beginPath();
      ctx.strokeStyle = i % 4 === 0 ? accent : 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 3. Smooth Flowing Waveform
  private static drawWaveform(
    ctx: CanvasRenderingContext2D,
    width: number,
    baseY: number,
    t: number,
    energy: number,
    accent: string,
    primary: string
  ): void {
    const points = 60;
    const step = width / points;

    ctx.save();
    ctx.shadowColor = accent;
    ctx.shadowBlur = 10 * energy;

    // Glowing core wave
    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const x = i * step;
      const distFromCenter = 1 - Math.abs((i - points / 2) / (points / 2));
      const wave =
        Math.sin(i * 0.28 + t * 4) * 22 * distFromCenter * energy +
        Math.sin(i * 0.55 - t * 2.5) * 14 * distFromCenter * energy;
      const y = baseY + wave;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = accent;
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Subtle second harmonic wave
    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const x = i * step;
      const distFromCenter = 1 - Math.abs((i - points / 2) / (points / 2));
      const wave = Math.sin(i * 0.35 - t * 3.2) * -16 * distFromCenter * energy;
      const y = baseY + wave;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = primary;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.restore();
  }

  // 4. Concentric Audio Rings
  private static drawAudioRings(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    t: number,
    energy: number,
    accent: string,
    glow: string
  ): void {
    const ringCount = 4;
    ctx.save();
    ctx.shadowColor = glow;
    ctx.shadowBlur = 15;

    for (let i = 0; i < ringCount; i++) {
      const progress = ((t * 0.8 + i / ringCount) % 1);
      const r = 25 + progress * 130 * energy;
      const alpha = Math.max(0, (1 - progress) * 0.8);

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = i % 2 === 0 ? accent : 'rgba(255, 255, 255, 0.9)';
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  // 5. Particle Pulse
  private static drawParticlePulse(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    t: number,
    energy: number,
    accent: string,
    primary: string
  ): void {
    const count = 36;
    ctx.save();

    for (let i = 0; i < count; i++) {
      const seed = i * 137.5;
      const speed = 0.4 + (i % 5) * 0.15;
      const life = ((t * speed + i / count) % 1);

      const cx = (width * 0.15) + ((Math.sin(seed) * 0.5 + 0.5) * width * 0.7);
      const startY = height * 0.85;
      const py = startY - life * (height * 0.6);
      const px = cx + Math.sin(t * 2 + seed) * 24;

      const size = (2 + (i % 4) * 1.5) * (1 - life * 0.3) * energy;
      const alpha = (1 - life) * 0.85;

      ctx.beginPath();
      ctx.arc(px, py, Math.max(1, size), 0, Math.PI * 2);
      ctx.fillStyle = i % 3 === 0 ? accent : primary;
      ctx.globalAlpha = alpha;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 8;
      ctx.fill();
    }
    ctx.restore();
  }

  // 6. Glow Pulse Aura
  private static drawGlowPulse(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    t: number,
    energy: number,
    glow: string,
    accent: string
  ): void {
    const pulse = 0.8 + Math.abs(Math.sin(t * 2.8)) * 0.4 * energy;
    const r = 110 * pulse;

    ctx.save();
    const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
    grad.addColorStop(0, accent);
    grad.addColorStop(0.4, glow);
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.globalAlpha = 0.45 * energy;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 7. Edge Visualizer (Symmetric Vertical Bars on Screen Margins)
  private static drawEdgeVisualizer(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    t: number,
    energy: number,
    accent: string,
    primary: string
  ): void {
    const barCount = 18;
    const startY = height * 0.3;
    const totalH = height * 0.4;
    const stepY = totalH / barCount;

    ctx.save();
    for (let i = 0; i < barCount; i++) {
      const y = startY + i * stepY;
      const hNorm = Math.abs(Math.sin(t * 3 + i * 0.5)) * 0.8 + 0.2;
      const barW = hNorm * 38 * energy;

      // Left Edge
      ctx.fillStyle = i % 2 === 0 ? accent : primary;
      ctx.fillRect(8, y, barW, stepY * 0.6);

      // Right Edge (Symmetric)
      ctx.fillRect(width - 8 - barW, y, barW, stepY * 0.6);
    }
    ctx.restore();
  }

  // 8. Layered Wave Lines
  private static drawWaveLines(
    ctx: CanvasRenderingContext2D,
    width: number,
    baseY: number,
    t: number,
    energy: number,
    accent: string,
    primary: string
  ): void {
    const layers = 3;
    ctx.save();

    for (let l = 0; l < layers; l++) {
      const speed = 2.5 + l * 0.8;
      const freq = 0.015 + l * 0.006;
      const amp = (18 - l * 4) * energy;

      ctx.beginPath();
      for (let x = 0; x <= width; x += 12) {
        const y = baseY + Math.sin(x * freq + t * speed) * amp + l * 6;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = l === 0 ? accent : primary;
      ctx.globalAlpha = 0.7 - l * 0.2;
      ctx.lineWidth = 2.5 - l * 0.6;
      ctx.stroke();
    }
    ctx.restore();
  }

  // 9. Minimal Rhythm Dots
  private static drawMinimalDots(
    ctx: CanvasRenderingContext2D,
    width: number,
    baseY: number,
    t: number,
    energy: number,
    accent: string,
    primary: string
  ): void {
    const dotCount = 16;
    const spacing = 16;
    const totalW = dotCount * spacing;
    const startX = (width - totalW) / 2;

    ctx.save();
    for (let i = 0; i < dotCount; i++) {
      const x = startX + i * spacing;
      const pulse = Math.abs(Math.sin(t * 3.5 + i * 0.4));
      const r = (2.5 + pulse * 4 * energy);

      ctx.beginPath();
      ctx.arc(x, baseY, r, 0, Math.PI * 2);
      ctx.fillStyle = i % 3 === 0 ? accent : primary;
      ctx.globalAlpha = 0.4 + pulse * 0.6;
      ctx.fill();
    }
    ctx.restore();
  }

  // 10. Bass Pulse Overlay (Radial Vignette Pulse)
  private static drawBassPulseOverlay(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    t: number,
    energy: number,
    accent: string
  ): void {
    const pulse = Math.abs(Math.sin(t * 4)) * 0.25 * energy;
    ctx.save();
    const grad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      height * 0.2,
      width / 2,
      height / 2,
      height * 0.65
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, accent);

    ctx.globalAlpha = pulse * 0.4;
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}
