// Simple Web Audio API synthesizer for Typewriter sounds

let audioCtx: AudioContext | null = null;
let isMuted = false;

export const setAudioMuted = (muted: boolean) => {
  isMuted = muted;
};

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const playTypewriterSound = (char: string) => {
  if (isMuted) return;
  const ctx = initAudio();
  if (!ctx) return;

  const t = ctx.currentTime;
  
  // 1. Noise burst (mechanical impact)
  const bufferSize = ctx.sampleRate * 0.05; // 50ms
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.value = 1000;

  const noiseGain = ctx.createGain();
  
  // 2. Tone (Key resonance)
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  
  // Logic for different keys
  if (char === ' ') {
    // Spacebar: Lower pitch, duller
    noiseFilter.frequency.value = 600;
    noiseGain.gain.setValueAtTime(0.5, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    
    osc.frequency.value = 150;
    osc.type = 'square';
    oscGain.gain.setValueAtTime(0.1, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

  } else if (/[0-9]/.test(char)) {
     // Numbers: Slightly higher pitch
     noiseFilter.frequency.value = 1200;
     noiseGain.gain.setValueAtTime(0.6, t);
     noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

     osc.frequency.value = 400;
     osc.type = 'triangle';
     oscGain.gain.setValueAtTime(0.1, t);
     oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

  } else {
    // Letters: Standard click
    noiseFilter.frequency.value = 1000;
    noiseGain.gain.setValueAtTime(0.6, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
    
    osc.frequency.value = 300 + (Math.random() * 50); // Slight variation
    osc.type = 'triangle';
    oscGain.gain.setValueAtTime(0.15, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
  }

  // Connect Graph
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  
  osc.connect(oscGain);
  oscGain.connect(ctx.destination);

  // Play
  noise.start(t);
  osc.start(t);
  osc.stop(t + 0.1);
};

export const playDing = () => {
    if (isMuted) return;
    const ctx = initAudio();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.setValueAtTime(1200, t);
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 1.5);
};