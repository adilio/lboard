import type { Preferences } from "./model";
// Small hand-built Web Audio engine: one context, a master limiter, separate
// effects and music buses, and short synthesized voices tuned to C major
// pentatonic so nothing a child plays can sound wrong.
type Voice = { stop: () => void; end: number };
let context: AudioContext | undefined;
let effects: GainNode | undefined;
let musicBus: GainNode | undefined;
let noise: AudioBuffer | undefined;
const voices: Voice[] = [];
let recent: number[] = [];
export const pentatonic = [
  261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5,
];
function ensure(): AudioContext | null {
  try {
    if (!context) {
      const session = (
        navigator as Navigator & { audioSession?: { type: string } }
      ).audioSession;
      if (session) session.type = "playback";
      context = new AudioContext();
      const limiter = context.createDynamicsCompressor();
      limiter.threshold.value = -6;
      limiter.ratio.value = 12;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.15;
      limiter.connect(context.destination);
      effects = context.createGain();
      musicBus = context.createGain();
      effects.connect(limiter);
      musicBus.connect(limiter);
      noise = context.createBuffer(
        1,
        context.sampleRate * 0.5,
        context.sampleRate,
      );
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    void context.resume().catch(() => {});
    return context;
  } catch {
    return null;
  }
}
function allowed(p: Preferences) {
  if (!p.soundEnabled || !p.effectsVolume || document.hidden) return false;
  const now = performance.now();
  recent = recent.filter((t) => now - t < 1000);
  if (recent.length >= 30) return false;
  // Merge identical rapid re-triggers (spam taps) into one sound.
  if (recent.length && now - recent[recent.length - 1] < 25) return false;
  recent.push(now);
  return true;
}
function claim(c: AudioContext) {
  const t = c.currentTime;
  for (let i = voices.length - 1; i >= 0; i--)
    if (voices[i].end < t) voices.splice(i, 1);
  if (voices.length >= (music ? 9 : 12)) voices.shift()?.stop();
}
function envelope(
  c: AudioContext,
  peak: number,
  attack: number,
  decay: number,
) {
  const g = c.createGain();
  const t = c.currentTime;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  return g;
}
function play(
  p: Preferences,
  build: (
    c: AudioContext,
    out: GainNode,
    level: number,
  ) => AudioScheduledSourceNode[],
  duration: number,
) {
  if (!allowed(p)) return;
  const c = ensure();
  if (!c || !effects) return;
  try {
    claim(c);
    effects.gain.value = p.effectsVolume;
    const out = c.createGain();
    out.connect(effects);
    const sources = build(c, out, 0.16);
    const end = c.currentTime + duration + 0.05;
    for (const s of sources) {
      s.start();
      s.stop(end);
    }
    const voice: Voice = {
      end,
      stop: () => {
        const t = c.currentTime;
        out.gain.setTargetAtTime(0, t, 0.005);
        for (const s of sources) {
          try {
            s.stop(t + 0.03);
          } catch {
            /* ended */
          }
        }
      },
    };
    voices.push(voice);
    sources[0].onended = () => {
      const i = voices.indexOf(voice);
      if (i >= 0) voices.splice(i, 1);
      out.disconnect();
    };
  } catch {
    /* visual play remains available */
  }
}
function osc(
  c: AudioContext,
  type: OscillatorType,
  freq: number,
  dest: AudioNode,
) {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  o.connect(dest);
  return o;
}
// A warm wooden mallet: fundamental plus a soft bright partial.
export function tone(
  p: Preferences,
  freq = 440,
  kind: OscillatorType = "sine",
  duration = 0.5,
) {
  if (kind === "triangle") return drum(p, freq);
  play(
    p,
    (c, out, level) => {
      const body = envelope(c, level, 0.006, duration);
      const shine = envelope(c, level * 0.28, 0.002, duration * 0.25);
      body.connect(out);
      shine.connect(out);
      return [
        osc(c, "sine", freq, body),
        osc(c, "triangle", freq * 2, body),
        osc(c, "sine", freq * 3.99, shine),
      ];
    },
    duration,
  );
}
// Soft felt drum: a short pitch drop; high pitches become a shaker.
export function drum(p: Preferences, freq = 150) {
  if (freq >= 600) {
    play(
      p,
      (c, out, level) => {
        const src = c.createBufferSource();
        src.buffer = noise!;
        const band = c.createBiquadFilter();
        band.type = "bandpass";
        band.frequency.value = 5200;
        band.Q.value = 1.2;
        const g = envelope(c, level * 0.9, 0.01, 0.16);
        src.connect(band).connect(g).connect(out);
        return [src];
      },
      0.2,
    );
    return;
  }
  play(
    p,
    (c, out, level) => {
      const g = envelope(c, level * 1.5, 0.003, 0.45);
      g.connect(out);
      const o = osc(c, "sine", freq * 2.2, g);
      o.frequency.exponentialRampToValueAtTime(freq, c.currentTime + 0.09);
      const tap = c.createBufferSource();
      tap.buffer = noise!;
      const lp = c.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1400;
      const tg = envelope(c, level * 0.5, 0.001, 0.05);
      tap.connect(lp).connect(tg).connect(out);
      return [o, tap];
    },
    0.5,
  );
}
// Named little effects used across the playroom.
export function sfx(
  p: Preferences,
  name: "pop" | "whoosh" | "boop" | "sparkle" | "plop" | "click",
  pitch = 1,
) {
  if (name === "boop") return tone(p, 523.25 * pitch, "sine", 0.35);
  play(
    p,
    (c, out, level) => {
      const t = c.currentTime;
      if (name === "pop") {
        const g = envelope(c, level * 1.2, 0.002, 0.12);
        g.connect(out);
        const o = osc(c, "sine", 700 * pitch, g);
        o.frequency.exponentialRampToValueAtTime(1500 * pitch, t + 0.05);
        return [o];
      }
      if (name === "plop") {
        const g = envelope(c, level * 1.3, 0.004, 0.22);
        g.connect(out);
        const o = osc(c, "sine", 520 * pitch, g);
        o.frequency.exponentialRampToValueAtTime(140 * pitch, t + 0.18);
        return [o];
      }
      if (name === "click") {
        const src = c.createBufferSource();
        src.buffer = noise!;
        const hp = c.createBiquadFilter();
        hp.type = "bandpass";
        hp.frequency.value = 2600 * pitch;
        hp.Q.value = 3;
        const g = envelope(c, level * 1.4, 0.001, 0.05);
        src.connect(hp).connect(g).connect(out);
        const tg = envelope(c, level * 0.5, 0.001, 0.08);
        tg.connect(out);
        return [src, osc(c, "triangle", 330 * pitch, tg)];
      }
      if (name === "sparkle") {
        const notes = [1046.5, 1318.5, 1568].map((f) => f * pitch);
        return notes.map((f, i) => {
          const g = c.createGain();
          g.gain.setValueAtTime(0, t);
          g.gain.setValueAtTime(0, t + i * 0.06);
          g.gain.linearRampToValueAtTime(level * 0.35, t + i * 0.06 + 0.005);
          g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.06 + 0.35);
          g.connect(out);
          return osc(c, "sine", f, g);
        });
      }
      // whoosh: a soft filtered breath of air for moving between places.
      const src = c.createBufferSource();
      src.buffer = noise!;
      src.loop = true;
      const band = c.createBiquadFilter();
      band.type = "bandpass";
      band.Q.value = 0.9;
      band.frequency.setValueAtTime(350 * pitch, t);
      band.frequency.exponentialRampToValueAtTime(1800 * pitch, t + 0.32);
      const g = c.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(level * 0.55, t + 0.12);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      src.connect(band).connect(g).connect(out);
      return [src];
    },
    name === "sparkle" ? 0.5 : 0.42,
  );
}
export function stopAudio() {
  for (const v of voices.splice(0)) v.stop();
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
  const c = ensure();
  if (!c || !musicBus) return false;
  try {
    const gain = c.createGain();
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(
      p.musicVolume * 0.6 * 0.035,
      c.currentTime + 1,
    );
    gain.connect(musicBus);
    const nodes = [174.61, 220, 261.63].map((f) => {
      const o = c.createOscillator();
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
