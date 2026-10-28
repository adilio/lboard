import type { Preferences } from "./model";
let context: AudioContext | undefined;
const voices: OscillatorNode[] = [];
let recent: number[] = [];
export function stopAudio() {
  for (const v of voices.splice(0)) {
    try {
      v.stop();
    } catch {
      /* already stopped */
    }
  }
}
export function tone(
  p: Preferences,
  freq = 440,
  kind: OscillatorType = "sine",
  duration = 0.32,
) {
  if (!p.soundEnabled || !p.effectsVolume || document.hidden) return;
  const now = performance.now();
  recent = recent.filter((t) => now - t < 1000);
  if (recent.length >= 24) return;
  recent.push(now);
  try {
    context ??= new AudioContext();
    void context.resume().catch(() => {});
    if (voices.length >= (music ? 5 : 8)) {
      const old = voices.shift();
      try {
        old?.stop();
      } catch {
        /* ended */
      }
    }
    const o = context.createOscillator(),
      g = context.createGain();
    o.type = kind;
    o.frequency.setValueAtTime(freq, context.currentTime);
    g.gain.setValueAtTime(0, context.currentTime);
    g.gain.linearRampToValueAtTime(
      p.effectsVolume * 0.6 * 0.12,
      context.currentTime + 0.012,
    );
    g.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    o.connect(g);
    g.connect(context.destination);
    voices.push(o);
    o.onended = () => {
      const i = voices.indexOf(o);
      if (i >= 0) voices.splice(i, 1);
      o.disconnect();
      g.disconnect();
    };
    o.start();
    o.stop(context.currentTime + duration + 0.02);
  } catch {
    /* visual play remains available */
  }
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopAudio();
    void context?.suspend();
  }
});
window.addEventListener("pagehide", stopAudio);
// Optional, locally synthesized pad. Deliberate parent activation only.
let music: { nodes: OscillatorNode[]; gain: GainNode } | null = null;
export function stopMusic() {
  if (!music) return;
  for (const n of music.nodes) {
    try {
      n.stop();
    } catch {
      /* stopped */
    }
    n.disconnect();
  }
  music.gain.disconnect();
  music = null;
}
export function musicLevel(p: Preferences) {
  if (music && context)
    music.gain.gain.setTargetAtTime(
      p.soundEnabled ? p.musicVolume * 0.6 * 0.035 : 0,
      context.currentTime,
      0.03,
    );
}
export function startMusic(p: Preferences) {
  stopMusic();
  stopAudio();
  if (!p.soundEnabled || document.hidden) return false;
  try {
    context ??= new AudioContext();
    void context.resume().catch(stopMusic);
    const gain = context.createGain();
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(
      p.musicVolume * 0.6 * 0.035,
      context.currentTime + 1,
    );
    gain.connect(context.destination);
    const nodes = [174.61, 220, 261.63].map((f) => {
      const o = context!.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      o.connect(gain);
      o.start();
      return o;
    });
    music = { nodes, gain };
    return true;
  } catch {
    return false;
  }
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopMusic();
});
window.addEventListener("pagehide", stopMusic);
