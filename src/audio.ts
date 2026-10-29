import type { Preferences } from "./model";
// Small hand-built Web Audio engine (spec §13, §15.4): one context, a master
// limiter, separate effects and music buses, and short synthesized voices.
// Melodic things use C major pentatonic so nothing a child plays sounds wrong.
type Voice = { stop: () => void; end: number };
let context: AudioContext | undefined;
let effects: GainNode | undefined;
let musicBus: GainNode | undefined;
let noise: AudioBuffer | undefined;
const voices: Voice[] = [];
let recent: { t: number; key: string }[] = [];
export const pentatonic = [
  261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5,
  1174.66, 1318.51,
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
      noise = context.createBuffer(1, context.sampleRate, context.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    // iPadOS can leave a context "running" but silent after interruptions;
    // resuming on every touch is the cheap first line of recovery (§16.4).
    if (context.state !== "running") void context.resume().catch(() => {});
    return context;
  } catch {
    return null;
  }
}
export function audioNow() {
  return ensure()?.currentTime ?? 0;
}
function allowed(p: Preferences, key: string) {
  if (!p.soundEnabled || !p.effectsVolume || document.hidden) return false;
  const now = performance.now();
  recent = recent.filter((r) => now - r.t < 1000);
  if (recent.length >= 40) return false;
  // The same sound re-triggered within 40 ms is merged (spec §13.2).
  if (recent.some((r) => r.key === key && now - r.t < 40)) return false;
  recent.push({ t: now, key });
  return true;
}
function claim(c: AudioContext) {
  const t = c.currentTime;
  for (let i = voices.length - 1; i >= 0; i--)
    if (voices[i].end < t) voices.splice(i, 1);
  if (voices.length >= 16) voices.shift()?.stop();
}
function env(
  c: AudioContext,
  peak: number,
  attack: number,
  decay: number,
  t = c.currentTime,
) {
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  return g;
}
type Build = (
  c: AudioContext,
  out: GainNode,
  level: number,
  t: number,
) => AudioScheduledSourceNode[];
function play(
  p: Preferences,
  build: Build,
  duration: number,
  key = "",
  opts: { when?: number; bus?: "fx" | "music"; skipLimit?: boolean } = {},
): Voice | undefined {
  if (opts.skipLimit) {
    if (!p.soundEnabled || document.hidden) return;
  } else if (!allowed(p, key || String(Math.random()))) return;
  const c = ensure();
  if (!c || !effects || !musicBus) return;
  try {
    claim(c);
    effects.gain.value = p.effectsVolume;
    musicBus.gain.value = Math.max(p.musicVolume, 0.15) * 1.4;
    const out = c.createGain();
    out.connect(opts.bus === "music" ? musicBus : effects);
    const t = Math.max(opts.when ?? c.currentTime, c.currentTime);
    const sources = build(c, out, 0.16, t);
    const end = t + duration + 0.05;
    for (const s of sources) {
      s.start(t);
      s.stop(end);
    }
    const voice: Voice = {
      end,
      stop: () => {
        const n = c.currentTime;
        out.gain.setTargetAtTime(0, n, 0.01);
        for (const s of sources) {
          try {
            s.stop(n + 0.05);
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
    return voice;
  } catch {
    return undefined;
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
function noiseSrc(c: AudioContext, loop = false) {
  const s = c.createBufferSource();
  s.buffer = noise!;
  s.loop = loop;
  return s;
}
function filter(c: AudioContext, type: BiquadFilterType, f: number, q = 1) {
  const b = c.createBiquadFilter();
  b.type = type;
  b.frequency.value = f;
  b.Q.value = q;
  return b;
}
// A warm wooden mallet (xylophone, marimba): fundamental plus soft partials.
export function tone(
  p: Preferences,
  freq = 440,
  kind: OscillatorType = "sine",
  duration = 0.6,
) {
  if (kind === "triangle") return drum(p, freq);
  play(
    p,
    (c, out, level, t) => {
      const body = env(c, level, 0.004, duration, t);
      const shine = env(c, level * 0.35, 0.001, duration * 0.18, t);
      body.connect(out);
      shine.connect(out);
      return [
        osc(c, "sine", freq, body),
        osc(c, "sine", freq * 2, body),
        osc(c, "sine", freq * 3.99, shine),
      ];
    },
    duration,
    "tone" + freq,
  );
}
// A celesta-like chime with a long soft tail (stars, wind chimes).
export function chime(p: Preferences, freq: number, when?: number) {
  play(
    p,
    (c, out, level, t) => {
      const g = env(c, level * 0.8, 0.003, 1.6, t);
      const h = env(c, level * 0.25, 0.002, 0.5, t);
      g.connect(out);
      h.connect(out);
      return [osc(c, "sine", freq, g), osc(c, "sine", freq * 4.2, h)];
    },
    1.7,
    "chime" + freq,
    { when },
  );
}
// Drums: bass, bongo, tom, with a pitch drop and a felt tap.
export function drum(p: Preferences, freq = 150, when?: number, gain = 1) {
  if (freq >= 600) return shaker(p, when, gain);
  play(
    p,
    (c, out, level, t) => {
      const g = env(c, level * 1.6 * gain, 0.003, 0.5, t);
      g.connect(out);
      const o = osc(c, "sine", freq * 2.2, g);
      o.frequency.setValueAtTime(freq * 2.2, t);
      o.frequency.exponentialRampToValueAtTime(freq, t + 0.08);
      const tap = noiseSrc(c);
      const tg = env(c, level * 0.6 * gain, 0.001, 0.05, t);
      tap
        .connect(filter(c, "lowpass", 1600))
        .connect(tg)
        .connect(out);
      return [o, tap];
    },
    0.5,
    "drum" + freq,
    { when, skipLimit: when !== undefined },
  );
}
export function shaker(p: Preferences, when?: number, gain = 1) {
  play(
    p,
    (c, out, level, t) => {
      const s = noiseSrc(c);
      const g = env(c, level * 0.9 * gain, 0.012, 0.14, t);
      s.connect(filter(c, "bandpass", 6000, 1.2))
        .connect(g)
        .connect(out);
      return [s];
    },
    0.18,
    "shaker",
    { when, skipLimit: when !== undefined },
  );
}
export function jingle(p: Preferences) {
  play(
    p,
    (c, out, level, t) => {
      const s = noiseSrc(c);
      const g = env(c, level * 0.8, 0.002, 0.35, t);
      s.connect(filter(c, "highpass", 7000))
        .connect(g)
        .connect(out);
      const r = env(c, level * 0.2, 0.002, 0.3, t);
      r.connect(out);
      return [s, osc(c, "square", 2700, r), osc(c, "square", 3510, r)];
    },
    0.4,
    "jingle",
  );
}
export function cymbal(p: Preferences) {
  play(
    p,
    (c, out, level, t) => {
      const s = noiseSrc(c, true);
      const g = env(c, level * 0.35, 0.01, 1.4, t);
      s.connect(filter(c, "highpass", 5000))
        .connect(g)
        .connect(out);
      return [s];
    },
    1.5,
    "cymbal",
  );
}
// Named little effects used across the playroom.
export type Sfx =
  | "pop"
  | "whoosh"
  | "boop"
  | "sparkle"
  | "plop"
  | "click"
  | "splash"
  | "bubbles"
  | "chop"
  | "sizzle"
  | "whirr"
  | "glug"
  | "creak"
  | "clink"
  | "thunk"
  | "heartbeat"
  | "munch"
  | "bleh"
  | "tada"
  | "squeak"
  | "boing"
  | "tick"
  | "zip"
  | "sneeze"
  | "rumble"
  | "beep"
  | "snore";
export function sfx(p: Preferences, name: Sfx, pitch = 1) {
  if (name === "boop") return tone(p, 523.25 * pitch, "sine", 0.35);
  const durations: Partial<Record<Sfx, number>> = {
    sparkle: 0.6,
    whirr: 1.4,
    sizzle: 1.2,
    heartbeat: 1.2,
    tada: 0.9,
    munch: 0.7,
    bubbles: 0.8,
    splash: 0.6,
    snore: 1.2,
    rumble: 0.9,
    sneeze: 0.6,
  };
  play(
    p,
    (c, out, level, t) => {
      const sweep = (
        type: OscillatorType,
        a: number,
        b: number,
        d: number,
        at = 0,
        lvl = 1,
      ) => {
        const g = env(c, level * lvl, 0.004, d, t + at);
        g.connect(out);
        const o = osc(c, type, a * pitch, g);
        o.frequency.setValueAtTime(a * pitch, t + at);
        o.frequency.exponentialRampToValueAtTime(b * pitch, t + at + d);
        return o;
      };
      const hiss = (
        type: BiquadFilterType,
        f: number,
        d: number,
        at = 0,
        lvl = 1,
        q = 1,
      ) => {
        const s = noiseSrc(c, true);
        const g = env(c, level * lvl, 0.006, d, t + at);
        s.connect(filter(c, type, f * pitch, q))
          .connect(g)
          .connect(out);
        return s;
      };
      switch (name) {
        case "pop":
          return [sweep("sine", 700, 1500, 0.1, 0, 1.2)];
        case "plop":
          return [sweep("sine", 520, 140, 0.2, 0, 1.3)];
        case "click":
          return [
            hiss("bandpass", 2600, 0.04, 0, 1.4, 3),
            sweep("triangle", 330, 300, 0.06, 0, 0.5),
          ];
        case "tick":
          return [hiss("bandpass", 4000, 0.02, 0, 0.8, 4)];
        case "thunk":
          return [
            sweep("sine", 180, 90, 0.12, 0, 1.6),
            hiss("lowpass", 900, 0.05, 0, 0.6),
          ];
        case "clink":
          return [
            sweep("sine", 2400, 2300, 0.25, 0, 0.5),
            sweep("sine", 3300, 3200, 0.2, 0, 0.3),
          ];
        case "sparkle":
          return [1046.5, 1318.5, 1568].map((f, i) =>
            sweep("sine", f, f, 0.35, i * 0.06, 0.35),
          );
        case "tada":
          return [523.25, 659.25, 783.99, 1046.5].map((f, i) =>
            sweep("triangle", f, f, 0.45, i * 0.08, 0.4),
          );
        case "splash":
          return [
            hiss("lowpass", 2500, 0.5, 0, 1.2),
            sweep("sine", 400, 120, 0.15, 0, 0.8),
          ];
        case "bubbles":
          return [0, 0.12, 0.22, 0.35, 0.5].map((at, i) =>
            sweep("sine", 300 + i * 90, 900 + i * 120, 0.07, at, 0.6),
          );
        case "chop":
          return [
            hiss("bandpass", 3000, 0.05, 0, 1.4, 2),
            sweep("sine", 220, 120, 0.06, 0, 1),
          ];
        case "sizzle":
          return [hiss("highpass", 4000, 1.1, 0, 0.45)];
        case "whirr": {
          const g = env(c, level * 0.35, 0.15, 1.2, t);
          g.connect(out);
          const o = osc(c, "sawtooth", 90 * pitch, g);
          return [o, hiss("bandpass", 1200, 1.2, 0, 0.4, 0.8)];
        }
        case "glug":
          return [0, 0.15, 0.3].map((at) =>
            sweep("sine", 260, 520, 0.1, at, 0.9),
          );
        case "creak": {
          const g = env(c, level * 0.35, 0.05, 0.4, t);
          const b = filter(c, "bandpass", 700, 6);
          b.connect(g).connect(out);
          const o = osc(c, "sawtooth", 70 * pitch, b);
          o.frequency.setValueAtTime(70 * pitch, t);
          o.frequency.linearRampToValueAtTime(110 * pitch, t + 0.4);
          return [o];
        }
        case "heartbeat":
          return [0, 0.18, 0.75, 0.93].map((at, i) =>
            sweep("sine", i % 2 ? 60 : 75, 40, 0.14, at, 1.6),
          );
        case "munch":
          return [0, 0.18, 0.36, 0.54].map((at) =>
            hiss("bandpass", 1800, 0.06, at, 1.1, 2),
          );
        case "bleh":
          return [sweep("sawtooth", 180, 140, 0.45, 0, 0.35)];
        case "squeak":
          return [sweep("sine", 1800, 2600, 0.12, 0, 0.6)];
        case "boing": {
          const g = env(c, level, 0.004, 0.5, t);
          g.connect(out);
          const o = osc(c, "sine", 200 * pitch, g);
          const lfo = osc(c, "sine", 14, c.createGain());
          const depth = c.createGain();
          depth.gain.value = 60 * pitch;
          lfo.disconnect();
          lfo.connect(depth).connect(o.frequency);
          o.frequency.setValueAtTime(200 * pitch, t);
          o.frequency.exponentialRampToValueAtTime(420 * pitch, t + 0.4);
          return [o, lfo];
        }
        case "zip":
          return [hiss("bandpass", 2000, 0.25, 0, 0.8, 1.5)];
        case "sneeze":
          return [
            hiss("bandpass", 1500, 0.25, 0, 0.7, 1),
            hiss("highpass", 3000, 0.2, 0.25, 1),
          ];
        case "rumble":
          return [sweep("sawtooth", 70, 55, 0.8, 0, 0.35)];
        case "beep":
          return [
            sweep("square", 880, 880, 0.1, 0, 0.25),
            sweep("square", 1320, 1320, 0.1, 0.14, 0.25),
          ];
        case "snore":
          return [sweep("sawtooth", 90, 70, 1, 0, 0.18)];
        default: {
          // whoosh: a soft filtered breath of air for moving between places.
          const s = noiseSrc(c, true);
          const band = filter(c, "bandpass", 350 * pitch, 0.9);
          band.frequency.setValueAtTime(350 * pitch, t);
          band.frequency.exponentialRampToValueAtTime(1800 * pitch, t + 0.32);
          const g = c.createGain();
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(level * 0.55, t + 0.12);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
          s.connect(band).connect(g).connect(out);
          return [s];
        }
      }
    },
    durations[name] ?? 0.45,
    name + pitch,
  );
}
// Gentle synthesized animal calls, all at a similar loudness: no roars.
export function animal(p: Preferences, kind: string) {
  const call: Record<string, () => void> = {};
  const voiced = (
    type: OscillatorType,
    path: [number, number][],
    opts: {
      vib?: number;
      f?: number;
      q?: number;
      lvl?: number;
      reps?: number;
      gap?: number;
    } = {},
  ) =>
    play(
      p,
      (c, out, level, t) => {
        const srcs: AudioScheduledSourceNode[] = [];
        const dur = path[path.length - 1][0];
        for (let r = 0; r < (opts.reps ?? 1); r++) {
          const t0 = t + r * (dur + (opts.gap ?? 0.08));
          const g = env(c, level * (opts.lvl ?? 1), 0.03, dur, t0);
          const out2 = opts.f ? filter(c, "bandpass", opts.f, opts.q ?? 2) : g;
          if (opts.f) out2.connect(g);
          g.connect(out);
          const o = osc(c, type, path[0][1], out2);
          o.frequency.setValueAtTime(path[0][1], t0);
          for (const [at, f] of path.slice(1))
            o.frequency.linearRampToValueAtTime(f, t0 + at);
          if (opts.vib) {
            const lfo = c.createOscillator();
            lfo.frequency.value = opts.vib;
            const d = c.createGain();
            d.gain.value = path[0][1] * 0.04;
            lfo.connect(d).connect(o.frequency);
            srcs.push(lfo);
          }
          srcs.unshift(o);
        }
        return srcs;
      },
      1.4,
      "animal" + kind,
    );
  call.cow = () =>
    voiced(
      "sawtooth",
      [
        [0, 140],
        [0.35, 125],
        [0.9, 100],
      ],
      { f: 500, q: 1.5, lvl: 1.4 },
    );
  call.sheep = () =>
    voiced(
      "sawtooth",
      [
        [0, 340],
        [0.6, 320],
      ],
      { vib: 9, f: 1100, q: 1.2, lvl: 1.2 },
    );
  call.pig = () =>
    voiced(
      "square",
      [
        [0, 260],
        [0.12, 220],
      ],
      { f: 700, q: 3, reps: 2, lvl: 1.3 },
    );
  call.duck = () =>
    voiced(
      "square",
      [
        [0, 560],
        [0.14, 460],
      ],
      { f: 1100, q: 2.5, reps: 2, lvl: 0.9 },
    );
  call.chick = () =>
    voiced(
      "sine",
      [
        [0, 2600],
        [0.08, 3200],
      ],
      { reps: 3, gap: 0.06, lvl: 0.6 },
    );
  call.bird = () =>
    voiced(
      "sine",
      [
        [0, 2200],
        [0.07, 2900],
        [0.14, 2400],
      ],
      { reps: 3, gap: 0.04, lvl: 0.6 },
    );
  call.dog = () =>
    voiced(
      "sawtooth",
      [
        [0, 420],
        [0.12, 180],
      ],
      { f: 800, q: 1.5, reps: 2, gap: 0.12, lvl: 1.3 },
    );
  call.cat = () =>
    voiced(
      "sawtooth",
      [
        [0, 480],
        [0.25, 760],
        [0.6, 520],
      ],
      { f: 1400, q: 2, lvl: 0.8 },
    );
  call.horse = () =>
    voiced(
      "sawtooth",
      [
        [0, 700],
        [0.3, 1100],
        [0.9, 600],
      ],
      { vib: 18, f: 1500, q: 1.5, lvl: 0.8 },
    );
  call.frog = () =>
    voiced(
      "square",
      [
        [0, 140],
        [0.1, 120],
      ],
      { f: 500, q: 4, reps: 2, gap: 0.05, lvl: 1.4 },
    );
  call.owl = () =>
    voiced(
      "sine",
      [
        [0, 420],
        [0.3, 380],
      ],
      { reps: 2, gap: 0.15, lvl: 1 },
    );
  call.mouse = () =>
    voiced(
      "sine",
      [
        [0, 2600],
        [0.06, 3000],
      ],
      { reps: 2, gap: 0.05, lvl: 0.5 },
    );
  call.rabbit = () => sfx(p, "squeak", 0.8);
  call.bear = () =>
    voiced(
      "sawtooth",
      [
        [0, 110],
        [0.5, 95],
      ],
      { f: 400, q: 1.5, lvl: 0.9 },
    );
  call.teddy = call.bear;
  call.robot = () => sfx(p, "beep");
  call.dragon = () =>
    voiced(
      "sawtooth",
      [
        [0, 220],
        [0.3, 330],
        [0.6, 200],
      ],
      { f: 900, q: 1.2, lvl: 0.7 },
    );
  (call[kind] ?? (() => sfx(p, "boop")))();
}
// Scheduled musical voices for the animal band (beat-accurate on the audio
// clock, never setTimeout timing).
export type BandVoice =
  | "bass"
  | "flute"
  | "kick"
  | "snare"
  | "hat"
  | "piano"
  | "shaker";
export function bandNote(
  p: Preferences,
  v: BandVoice,
  when: number,
  freq = 0,
  dur = 0.3,
) {
  const build: Build = (c, out, level, t) => {
    switch (v) {
      case "bass": {
        const g = env(c, level * 1.4, 0.01, dur, t);
        g.connect(out);
        return [osc(c, "triangle", freq, g), osc(c, "sine", freq / 2, g)];
      }
      case "flute": {
        const g = env(c, level * 0.7, 0.05, dur, t);
        g.connect(out);
        const o = osc(c, "sine", freq, g);
        const lfo = c.createOscillator();
        lfo.frequency.value = 5;
        const d = c.createGain();
        d.gain.value = freq * 0.01;
        lfo.connect(d).connect(o.frequency);
        return [o, lfo];
      }
      case "piano": {
        const g = env(c, level * 0.45, 0.004, dur, t);
        g.connect(out);
        return [osc(c, "triangle", freq, g), osc(c, "sine", freq * 2, g)];
      }
      case "kick": {
        const g = env(c, level * 1.8, 0.002, 0.3, t);
        g.connect(out);
        const o = osc(c, "sine", 120, g);
        o.frequency.setValueAtTime(120, t);
        o.frequency.exponentialRampToValueAtTime(48, t + 0.12);
        return [o];
      }
      case "snare": {
        const s = noiseSrc(c);
        const g = env(c, level * 0.7, 0.002, 0.16, t);
        s.connect(filter(c, "bandpass", 1800, 0.8))
          .connect(g)
          .connect(out);
        return [s];
      }
      case "hat":
      case "shaker": {
        const s = noiseSrc(c);
        const g = env(c, level * (v === "hat" ? 0.25 : 0.35), 0.008, 0.06, t);
        s.connect(filter(c, "highpass", v === "hat" ? 8000 : 5500))
          .connect(g)
          .connect(out);
        return [s];
      }
    }
  };
  return play(p, build, dur + 0.1, "", { when, bus: "music", skipLimit: true });
}
export function stopAudio() {
  for (const v of voices.splice(0)) v.stop();
}
if (typeof document !== "undefined")
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAudio();
      void context?.suspend();
    }
  });
if (typeof window !== "undefined")
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
if (typeof document !== "undefined")
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopMusic();
  });
if (typeof window !== "undefined")
  window.addEventListener("pagehide", stopMusic);
