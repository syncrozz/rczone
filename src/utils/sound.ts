/**
 * Web Audio API Sound Synthesizer for RC Fun Ride Manager
 * Generates pleasant chimes and session notifications without harsh buzzing.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playTapSound(enabled = true): void {
  // Silent - UI click beeps disabled to prevent annoying sounds during normal interactions
  return;
}

export function playSessionStartSound(enabled = true): void {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      const startTime = ctx.currentTime + index * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.18, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  } catch (e) {
    console.warn('Audio play error:', e);
  }
}

export function playEndingSoonSound(enabled = true): void {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Dual soft harmonic chime (A5, C#6)
    [880, 1108.73].forEach((freq, index) => {
      const startTime = ctx.currentTime + index * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  } catch (e) {
    console.warn('Audio play error:', e);
  }
}

let activeAlarmInterval: number | null = null;

export function playTimeUpAlarm(enabled = true, repeat = false): void {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const playChimePattern = () => {
      // 3 pleasant bell chimes (F5 -> A5 -> C6)
      const frequencies = [698.46, 880.00, 1046.50];
      frequencies.forEach((freq, index) => {
        const startTime = ctx.currentTime + index * 0.14;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine'; // Clean melodic tone, zero harsh buzzing
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.22, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    };

    playChimePattern();

    if (repeat) {
      if (activeAlarmInterval) clearInterval(activeAlarmInterval);
      activeAlarmInterval = window.setInterval(() => {
        playChimePattern();
      }, 3000);
    }
  } catch (e) {
    console.warn('Audio play error:', e);
  }
}

export function stopAlarm(): void {
  if (activeAlarmInterval) {
    clearInterval(activeAlarmInterval);
    activeAlarmInterval = null;
  }
}

export function triggerVibration(pattern: number[] = [150, 100, 150], enabled = true): void {
  if (!enabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    navigator.vibrate(pattern);
  } catch (e) {
    console.warn('Vibration error:', e);
  }
}
