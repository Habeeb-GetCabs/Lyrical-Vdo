/**
 * Generates an instant, offline-ready synthesized rhythmic demo audio track
 * with kicks, snares, hi-hats, and melodic chord pads using the Web Audio API.
 * Produces a standard 44.1kHz 16-bit PCM WAV Blob.
 */

export async function generateDemoRhythmAudioBlob(durationSeconds = 24): Promise<{ blob: Blob; fileName: string; durationMs: number }> {
  const sampleRate = 44100;
  const numFrames = sampleRate * durationSeconds;
  const offlineCtx = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(
    2,
    numFrames,
    sampleRate
  );

  const bpm = 110;
  const beatDuration = 60 / bpm; // ~0.545 seconds
  const eighthNote = beatDuration / 2;

  // Chord progression: Cm -> Ab -> Eb -> Bb
  const chordFreqs = [
    [130.81, 155.56, 196.0], // C3, Eb3, G3 (Cm)
    [103.83, 130.81, 164.81], // Ab2, C3, Eb3 (Ab)
    [155.56, 196.0, 233.08], // Eb3, G3, Bb3 (Eb)
    [116.54, 146.83, 174.61], // Bb2, D3, F3 (Bb)
  ];

  // Synthesize Chords
  const chordLength = beatDuration * 4;
  for (let t = 0; t < durationSeconds; t += chordLength) {
    const chordIndex = Math.floor(t / chordLength) % chordFreqs.length;
    const freqs = chordFreqs[chordIndex];

    freqs.forEach((freq) => {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(0.08, t + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + chordLength - 0.05);

      osc.connect(gain);
      gain.connect(offlineCtx.destination);

      osc.start(t);
      osc.stop(t + chordLength);
    });
  }

  // Synthesize Beats (Kick, Snare, Hi-hat)
  let beatCount = 0;
  for (let t = 0; t < durationSeconds - 0.2; t += beatDuration) {
    const beatInMeasure = beatCount % 4;

    // 1. Kick Drum (Beat 0 and 2, plus occasional upbeat)
    if (beatInMeasure === 0 || beatInMeasure === 2 || (beatInMeasure === 3 && beatCount % 8 === 7)) {
      const kickOsc = offlineCtx.createOscillator();
      const kickGain = offlineCtx.createGain();

      kickOsc.frequency.setValueAtTime(140, t);
      kickOsc.frequency.exponentialRampToValueAtTime(38, t + 0.12);

      kickGain.gain.setValueAtTime(0.45, t);
      kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      kickOsc.connect(kickGain);
      kickGain.connect(offlineCtx.destination);

      kickOsc.start(t);
      kickOsc.stop(t + 0.26);
    }

    // 2. Snare / Clap (Beat 1 and 3)
    if (beatInMeasure === 1 || beatInMeasure === 3) {
      // Noise burst for snare snap
      const bufferSize = sampleRate * 0.15;
      const noiseBuffer = offlineCtx.createBuffer(1, bufferSize, sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = offlineCtx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = offlineCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1000;

      const snareGain = offlineCtx.createGain();
      snareGain.gain.setValueAtTime(0.28, t);
      snareGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      whiteNoise.connect(filter);
      filter.connect(snareGain);
      snareGain.connect(offlineCtx.destination);

      whiteNoise.start(t);
      whiteNoise.stop(t + 0.16);
    }

    // 3. Hi-hats (every 8th note)
    for (let sub = 0; sub < 2; sub++) {
      const subTime = t + sub * eighthNote;
      if (subTime >= durationSeconds) break;

      const hatSize = sampleRate * 0.04;
      const hatBuffer = offlineCtx.createBuffer(1, hatSize, sampleRate);
      const data = hatBuffer.getChannelData(0);
      for (let i = 0; i < hatSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const hatSource = offlineCtx.createBufferSource();
      hatSource.buffer = hatBuffer;

      const hatFilter = offlineCtx.createBiquadFilter();
      hatFilter.type = 'highpass';
      hatFilter.frequency.value = 6000;

      const hatGain = offlineCtx.createGain();
      hatGain.gain.setValueAtTime(sub === 0 ? 0.09 : 0.05, subTime);
      hatGain.gain.exponentialRampToValueAtTime(0.0001, subTime + 0.035);

      hatSource.connect(hatFilter);
      hatFilter.connect(hatGain);
      hatGain.connect(offlineCtx.destination);

      hatSource.start(subTime);
      hatSource.stop(subTime + 0.04);
    }

    beatCount++;
  }

  // Render to AudioBuffer
  const renderedBuffer = await offlineCtx.startRendering();

  // Convert AudioBuffer to WAV Blob
  const wavBlob = audioBufferToWavBlob(renderedBuffer);

  return {
    blob: wavBlob,
    fileName: 'Lyrical_Demo_Beat_110bpm.wav',
    durationMs: durationSeconds * 1000,
  };
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const length = buffer.length * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + length, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * blockAlign, true);
  /* block align */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, length, true);

  // Interleave channels and write 16-bit PCM samples
  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      let sample = channels[channel][i];
      // Clamp between -1.0 and 1.0
      sample = Math.max(-1, Math.min(1, sample));
      // Convert to 16-bit signed integer (-32768 to 32767)
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
