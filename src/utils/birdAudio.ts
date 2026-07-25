// Simple Web Audio API bird chirp sound generator
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playBirdChirp(frequencies: number[] = [2800, 3200, 2900, 3500]) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      
      const startTime = now + idx * 0.12;
      const duration = 0.08;

      // Frequency glide for natural chirp
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.25, startTime + duration * 0.5);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.9, startTime + duration);

      // Envelope
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  } catch (err) {
    console.warn('Audio playback not allowed or failed:', err);
  }
}
