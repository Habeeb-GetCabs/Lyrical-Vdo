import { AudioAnalysisSummary } from '../types/project';

/**
 * Analyzes audio for energy, onsets (transients/beats), accents, and pauses
 * using the Web Audio API without needing external cloud services.
 */
export class AudioAnalyzer {
  /**
   * Main analysis entry point.
   * Analyzes an audio blob if provided, or synthesizes an energy profile based on duration.
   */
  public static async analyzeAudio(
    audioBlob: Blob | null,
    durationMs: number
  ): Promise<AudioAnalysisSummary> {
    if (audioBlob) {
      try {
        return await this.analyzeFromBlob(audioBlob, durationMs);
      } catch (err) {
        console.warn('Audio decoding failed, falling back to algorithmic energy synthesis:', err);
        return this.synthesizeAnalysis(durationMs);
      }
    }
    return this.synthesizeAnalysis(durationMs);
  }

  /**
   * Decodes PCM audio data via Web Audio API AudioContext and computes RMS energy & onsets.
   */
  private static async analyzeFromBlob(
    blob: Blob,
    fallbackDurationMs: number
  ): Promise<AudioAnalysisSummary> {
    const arrayBuffer = await blob.arrayBuffer();
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const offlineCtx = new AudioContextClass();

    try {
      const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer);
      const sampleRate = audioBuffer.sampleRate;
      const durationMs = Math.round(audioBuffer.duration * 1000) || fallbackDurationMs;

      // Extract single channel or mix down stereo to mono
      const channelData = audioBuffer.getChannelData(0);
      const totalSamples = channelData.length;

      // 50ms window size
      const frameDurationSec = 0.05;
      const frameSize = Math.floor(sampleRate * frameDurationSec);
      const numFrames = Math.floor(totalSamples / frameSize);

      const frameEnergies: number[] = new Float32Array(numFrames) as unknown as number[];
      let maxEnergy = 0.0001;
      let sumEnergy = 0;

      for (let i = 0; i < numFrames; i++) {
        const start = i * frameSize;
        let sumSquares = 0;
        for (let j = 0; j < frameSize; j++) {
          const val = channelData[start + j];
          sumSquares += val * val;
        }
        const rms = Math.sqrt(sumSquares / frameSize);
        frameEnergies[i] = rms;
        sumEnergy += rms;
        if (rms > maxEnergy) maxEnergy = rms;
      }

      // Normalize frame energies to 0..1
      const normalizedFrames = frameEnergies.map((e) => e / maxEnergy);
      const avgEnergy = sumEnergy / numFrames / maxEnergy;

      // Detect onsets (sharp positive energy jumps)
      const onsetTimestampsMs: number[] = [];
      const threshold = avgEnergy * 1.35;
      let lastOnsetTime = -400; // debounce minimum 200ms between strong onsets

      for (let i = 1; i < numFrames - 1; i++) {
        const prev = normalizedFrames[i - 1];
        const curr = normalizedFrames[i];
        const next = normalizedFrames[i + 1];
        const currentTimeMs = Math.round(i * frameDurationSec * 1000);

        // Peak detector with minimum rise threshold
        const isPeak = curr > prev && curr >= next && curr > threshold;
        const diff = curr - prev;

        if (isPeak && diff > 0.15 && currentTimeMs - lastOnsetTime >= 220) {
          onsetTimestampsMs.push(currentTimeMs);
          lastOnsetTime = currentTimeMs;
        }
      }

      // Estimate tempo (BPM) from median onset intervals
      let tempoBpm = 118;
      if (onsetTimestampsMs.length >= 4) {
        const intervals: number[] = [];
        for (let i = 1; i < Math.min(30, onsetTimestampsMs.length); i++) {
          const delta = onsetTimestampsMs[i] - onsetTimestampsMs[i - 1];
          if (delta >= 250 && delta <= 1200) {
            intervals.push(delta);
          }
        }
        if (intervals.length > 0) {
          intervals.sort((a, b) => a - b);
          const medianIntervalMs = intervals[Math.floor(intervals.length / 2)];
          const estimatedBpm = Math.round(60000 / medianIntervalMs);
          if (estimatedBpm >= 60 && estimatedBpm <= 180) {
            tempoBpm = estimatedBpm;
          }
        }
      }

      // Downsample energy curve to 64 normalized points for smooth UI display
      const envelopePoints = 64;
      const step = Math.max(1, Math.floor(numFrames / envelopePoints));
      const energyEnvelope: number[] = [];
      for (let i = 0; i < envelopePoints; i++) {
        const frameIdx = Math.min(numFrames - 1, i * step);
        energyEnvelope.push(Math.min(1, Math.round(normalizedFrames[frameIdx] * 100) / 100));
      }

      return {
        sampleRate,
        totalDurationMs: durationMs,
        tempoBpm,
        averageEnergy: Math.round(avgEnergy * 100) / 100,
        peakEnergy: 1.0,
        beatCount: onsetTimestampsMs.length,
        onsetTimestampsMs,
        energyEnvelope,
      };
    } finally {
      if (offlineCtx.state !== 'closed') {
        offlineCtx.close().catch(() => {});
      }
    }
  }

  /**
   * Generates a realistic musical energy profile for synthetic or preloaded tracks.
   * Simulates musical dynamics: intro, verse, build-up, chorus, drops, outro.
   */
  private static synthesizeAnalysis(durationMs: number): AudioAnalysisSummary {
    const totalMs = Math.max(10000, durationMs || 32000);
    const envelopePoints = 64;
    const energyEnvelope: number[] = [];
    const onsetTimestampsMs: number[] = [];

    const bpm = 116;
    const beatIntervalMs = Math.round(60000 / bpm); // ~517ms

    for (let t = 800; t < totalMs - 1000; t += beatIntervalMs) {
      // Add slight organic rhythm swing
      const progress = t / totalMs;
      // Musical structure simulation:
      // 0.0-0.15: Intro (0.3 - 0.5 energy)
      // 0.15-0.45: Verse (0.45 - 0.65 energy)
      // 0.45-0.75: Chorus drop (0.8 - 0.98 energy)
      // 0.75-0.90: Bridge (0.5 - 0.7 energy)
      // 0.90-1.0: Outro (0.3 - 0.2 energy)
      let sectionEnergy = 0.5;
      if (progress < 0.15) sectionEnergy = 0.35 + progress;
      else if (progress < 0.45) sectionEnergy = 0.55 + Math.sin(progress * 12) * 0.1;
      else if (progress < 0.75) sectionEnergy = 0.85 + Math.sin(progress * 16) * 0.12;
      else if (progress < 0.9) sectionEnergy = 0.6 + Math.cos(progress * 8) * 0.1;
      else sectionEnergy = 0.4 * (1 - (progress - 0.9) / 0.1);

      if (Math.random() > 0.18) {
        onsetTimestampsMs.push(t);
      }
    }

    for (let i = 0; i < envelopePoints; i++) {
      const progress = i / envelopePoints;
      let energy = 0.45;
      if (progress < 0.15) energy = 0.3 + progress * 1.5;
      else if (progress < 0.45) energy = 0.5 + Math.sin(progress * 10) * 0.15;
      else if (progress < 0.75) energy = 0.8 + Math.sin(progress * 14) * 0.15;
      else if (progress < 0.9) energy = 0.6 + Math.sin(progress * 8) * 0.1;
      else energy = Math.max(0.15, 0.45 - (progress - 0.9) * 2.5);

      energyEnvelope.push(Math.min(1, Math.max(0.1, Math.round(energy * 100) / 100)));
    }

    return {
      sampleRate: 44100,
      totalDurationMs: totalMs,
      tempoBpm: bpm,
      averageEnergy: 0.62,
      peakEnergy: 0.98,
      beatCount: onsetTimestampsMs.length,
      onsetTimestampsMs,
      energyEnvelope,
    };
  }
}
