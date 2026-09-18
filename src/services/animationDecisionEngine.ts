import {
  LyricLine,
  AudioAnalysisSummary,
  AutoAnimationPreset,
  AutoMotionEffect,
  LineAutoAnimation,
  AutoAnimationConfig,
} from '../types/project';

/**
 * Intelligent Animation Decision Engine
 * Maps audio dynamics, onsets, pauses, and cadence to nuanced lyric motion behaviors.
 * Avoids monotonous beat jumping by employing structural variation across song phases.
 */
export class AnimationDecisionEngine {
  /**
   * Generates a complete auto animation configuration for the project.
   */
  public static generateAnimationTimeline(
    lyrics: LyricLine[],
    analysis: AudioAnalysisSummary,
    preset: AutoAnimationPreset = 'dynamic',
    sensitivity: 'low' | 'normal' | 'high' = 'normal',
    motionIntensity = 1.0,
    accentResponse: 'subtle' | 'punchy' | 'intense' = 'punchy',
    existingTimeline?: LineAutoAnimation[]
  ): AutoAnimationConfig {
    const existingOverrides = new Map<string, LineAutoAnimation>();
    if (existingTimeline) {
      for (const item of existingTimeline) {
        if (item.isUserOverride) {
          existingOverrides.set(item.lineId, item);
        }
      }
    }

    const sensitivityMultiplier =
      sensitivity === 'low' ? 0.75 : sensitivity === 'high' ? 1.25 : 1.0;

    const accentScaleBase =
      accentResponse === 'subtle' ? 1.05 : accentResponse === 'intense' ? 1.25 : 1.15;

    const timeline: LineAutoAnimation[] = lyrics.map((line, index) => {
      // Check if user has explicitly overridden this line
      if (existingOverrides.has(line.id)) {
        return existingOverrides.get(line.id)!;
      }

      // Compute line metrics from analysis
      const lineDuration = Math.max(500, line.endTimeMs - line.startTimeMs);
      const lineMidTime = line.startTimeMs + lineDuration / 2;
      const progressInSong = Math.max(0, Math.min(1, lineMidTime / analysis.totalDurationMs));

      // Calculate approximate energy in this line from energy envelope
      const envIndex = Math.min(
        analysis.energyEnvelope.length - 1,
        Math.floor(progressInSong * analysis.energyEnvelope.length)
      );
      let rawEnergy = analysis.energyEnvelope[envIndex] || analysis.averageEnergy;
      rawEnergy = Math.min(1, rawEnergy * sensitivityMultiplier);

      // Find onsets occurring during this line
      const onsetsInLine = analysis.onsetTimestampsMs.filter(
        (t) => t >= line.startTimeMs - 150 && t <= line.endTimeMs + 100
      );
      const hasStrongOnset = onsetsInLine.length > 0;
      const peakOnsetMs = hasStrongOnset ? onsetsInLine[0] - line.startTimeMs : 0;

      // Classify energy level
      let energyLevel: 'low' | 'medium' | 'high' | 'peak' = 'medium';
      if (rawEnergy < 0.38) energyLevel = 'low';
      else if (rawEnergy < 0.65) energyLevel = 'medium';
      else if (rawEnergy < 0.85) energyLevel = 'high';
      else energyLevel = 'peak';

      // Determine motion effect based on preset + audio context + line metrics
      const motionEffect = this.decideMotionEffect(
        preset,
        energyLevel,
        lineDuration,
        hasStrongOnset,
        Boolean(line.words && line.words.length > 0),
        index
      );

      // Scale and glow calculation
      let calculatedScale = 1.0;
      let glowIntensity = 0.0;

      if (motionEffect === 'PUNCH' || motionEffect === 'POP_ACCENT') {
        calculatedScale = 1.0 + (accentScaleBase - 1.0) * motionIntensity;
        glowIntensity = energyLevel === 'peak' ? 0.9 : 0.6;
      } else if (motionEffect === 'PULSE') {
        calculatedScale = 1.0 + 0.08 * motionIntensity;
        glowIntensity = 0.4;
      } else if (motionEffect === 'ZOOM_IN') {
        calculatedScale = 1.0 + 0.12 * motionIntensity;
        glowIntensity = 0.3;
      } else if (motionEffect === 'DRIFT' || motionEffect === 'FLOAT') {
        calculatedScale = 1.02;
        glowIntensity = 0.2;
      }

      return {
        lineId: line.id,
        energyLevel,
        averageEnergy: Math.round(rawEnergy * 100) / 100,
        peakOnsetMs,
        motionEffect,
        accentScale: Math.round(calculatedScale * 100) / 100,
        glowIntensity: Math.round(glowIntensity * 100) / 100,
        isUserOverride: false,
      };
    });

    return {
      preset,
      sensitivity,
      motionIntensity,
      accentResponse,
      timeline,
      analysisSummary: analysis,
      lastGeneratedDate: Date.now(),
    };
  }

  /**
   * Decides appropriate motion effect avoiding monotonous repetitiveness.
   */
  private static decideMotionEffect(
    preset: AutoAnimationPreset,
    energyLevel: 'low' | 'medium' | 'high' | 'peak',
    durationMs: number,
    hasStrongOnset: boolean,
    hasWordTimings: boolean,
    lineIndex: number
  ): AutoMotionEffect {
    // If preset is specifically Karaoke and word timings exist
    if (preset === 'karaoke' && hasWordTimings) {
      return energyLevel === 'peak' ? 'POP_ACCENT' : 'PULSE';
    }

    if (preset === 'smooth') {
      if (energyLevel === 'low') return 'FLOAT';
      if (energyLevel === 'peak') return 'ZOOM_IN';
      return 'DRIFT';
    }

    if (preset === 'cinematic') {
      if (energyLevel === 'low') return 'FADE_SLOW';
      if (energyLevel === 'peak') return 'ZOOM_IN';
      return 'FLOAT';
    }

    if (preset === 'kinetic') {
      if (energyLevel === 'peak') return 'PUNCH';
      if (energyLevel === 'high') return hasStrongOnset ? 'POP_ACCENT' : 'DRIFT';
      if (energyLevel === 'low') return 'FLOAT';
      return lineIndex % 2 === 0 ? 'DRIFT' : 'PULSE';
    }

    // Default: 'dynamic' preset (intelligent balanced pacing)
    if (energyLevel === 'peak') {
      return 'PUNCH';
    }

    if (energyLevel === 'high') {
      if (hasStrongOnset) return 'POP_ACCENT';
      return durationMs > 3500 ? 'ZOOM_IN' : 'PULSE';
    }

    if (energyLevel === 'low') {
      return durationMs > 4000 ? 'FLOAT' : 'FADE_SLOW';
    }

    // Medium energy: alternate tastefully between melodic drift and subtle pulse
    return lineIndex % 2 === 0 ? 'DRIFT' : 'PULSE';
  }

  /**
   * Helper to manually update a single line's auto-animation configuration.
   */
  public static updateLineOverride(
    config: AutoAnimationConfig,
    lineId: string,
    updates: Partial<LineAutoAnimation>
  ): AutoAnimationConfig {
    const updatedTimeline = config.timeline.map((item) => {
      if (item.lineId === lineId) {
        return {
          ...item,
          ...updates,
          isUserOverride: true,
        };
      }
      return item;
    });

    return {
      ...config,
      timeline: updatedTimeline,
    };
  }

  /**
   * Resets all user overrides back to algorithmic baseline.
   */
  public static resetOverrides(
    config: AutoAnimationConfig,
    lyrics: LyricLine[]
  ): AutoAnimationConfig {
    if (!config.analysisSummary) return config;
    return this.generateAnimationTimeline(
      lyrics,
      config.analysisSummary,
      config.preset,
      config.sensitivity,
      config.motionIntensity,
      config.accentResponse,
      undefined // clear existing overrides
    );
  }
}
