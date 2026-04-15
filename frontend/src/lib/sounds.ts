// sounds.ts — Web Audio API tone generator for HatchQuest UI feedback.
// Uses synthesised tones (no .mp3 files required) so the demo never 404s.
// All calls are wrapped in try/catch — AudioContext can fail silently on some
// browsers and must never crash game flow.

/** Play a single oscillator tone at the given frequency and duration (seconds). */
function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine"
): void {
  // Guard: AudioContext is only available in the browser.
  if (typeof window === "undefined") return;

  try {
    const ctx = new AudioContext();

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Soft envelope — ramp down to avoid click at end.
    gainNode.gain.setValueAtTime(0.18, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);

    // Close context after playback to release resources.
    oscillator.addEventListener("ended", () => {
      void ctx.close();
    });
  } catch {
    // AudioContext blocked (e.g. no user gesture yet) — fail silently.
  }
}

export const sounds = {
  /** Short square click — button press feedback. */
  click(): void {
    playTone(880, 0.08, "square");
  },

  /** Low sawtooth warning — capital entering crisis territory. */
  crisis(): void {
    playTone(220, 0.4, "sawtooth");
  },

  /** Three-note ascending arpeggio — win / positive milestone. */
  win(): void {
    playTone(523, 0.15, "sine");
    setTimeout(() => playTone(659, 0.15, "sine"), 150);
    setTimeout(() => playTone(784, 0.3, "sine"), 300);
  },
} as const;
