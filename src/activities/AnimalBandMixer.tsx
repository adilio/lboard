import { useEffect, useRef, useState } from "react";
import type { Preferences } from "../model";
import { audioNow, bandNote, cymbal, pentatonic, stopAudio } from "../audio";
import type { BandVoice } from "../audio";
import { Critter } from "../play/Critter";
import type { CritterKind } from "../play/Critter";
import { useSaved } from "../play/store";
// B4 Animal Band Mixer: five musicians, each with a part of the same song.
// Tap a musician to bring them in or out; they join on the next bar so it
// always sounds right. Listening for parts and layering them is the play.
// The conductor's baton ends the song with a flourish.
const BPM = 96;
const spb = 60 / BPM; // seconds per beat
const C = 130.81,
  A = 110,
  F = 87.31,
  G = 98;
const chords = [
  [C, [261.63, 329.63, 392]],
  [A, [220, 261.63, 329.63]],
  [F, [220, 261.63, 349.23]],
  [G, [196, 246.94, 293.66]],
] as const;
// An original eight-bar tune: pairs of [pentatonic note, length in eighths].
const tune = [
  [7, 2, 9, 2, 8, 2, 7, 2],
  [5, 2, 7, 2, -1, 4],
  [4, 2, 5, 2, 7, 2, 8, 2],
  [7, 6, -1, 2],
  [9, 2, 8, 2, 7, 2, 5, 2],
  [7, 2, 5, 2, -1, 4],
  [4, 2, 5, 2, 7, 2, 5, 2],
  [5, 6, -1, 2],
];
type Part = {
  id: string;
  animal: CritterKind;
  label: string;
  instrument: string;
};
const parts: Part[] = [
  { id: "bass", animal: "frog", label: "Frog on bass", instrument: "bass" },
  { id: "drums", animal: "bear", label: "Bear on drums", instrument: "drums" },
  { id: "piano", animal: "cat", label: "Cat on piano", instrument: "piano" },
  {
    id: "shaker",
    animal: "duck",
    label: "Duck on shaker",
    instrument: "shaker",
  },
  { id: "flute", animal: "bird", label: "Bird on flute", instrument: "flute" },
];
const key = "Animal Band Mixer";
export default function AnimalBandMixer({ prefs }: { prefs: Preferences }) {
  const [want, setWant] = useSaved<string[]>(key + ":on", () => []);
  const [playing, setPlaying] = useState<string[]>([]);
  const [beat, setBeat] = useState(0);
  const [flourish, setFlourish] = useState(0);
  const sched = useRef<{
    timer: ReturnType<typeof setInterval>;
    next: number;
    beat: number;
  } | null>(null);
  const wantRef = useRef(want);
  wantRef.current = want;
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;
  const active = useRef<string[]>([]);
  const ui = useRef<ReturnType<typeof setTimeout>[]>([]);
  function scheduleBeat(b: number, t: number) {
    const p = prefsRef.current;
    const bar = Math.floor(b / 4) % 8;
    const inBar = b % 4;
    // Parts change only on bar boundaries.
    if (inBar === 0) active.current = [...wantRef.current];
    const on = (id: string) => active.current.includes(id);
    const [root, triad] = chords[bar % 4];
    if (on("bass")) {
      if (inBar === 0 || inBar === 2) bandNote(p, "bass", t, root, spb * 1.4);
      if (inBar === 3) bandNote(p, "bass", t + spb / 2, root * 1.5, spb * 0.4);
    }
    if (on("drums")) {
      if (inBar === 0 || inBar === 2) bandNote(p, "kick", t);
      if (inBar === 1 || inBar === 3) bandNote(p, "snare", t);
      bandNote(p, "hat", t);
      bandNote(p, "hat", t + spb / 2);
    }
    if (on("piano") && (inBar === 1 || inBar === 3))
      for (const f of triad) bandNote(p, "piano", t, f, spb * 0.8);
    if (on("shaker"))
      for (let k = 0; k < 4; k++)
        bandNote(p, "shaker" as BandVoice, t + (k * spb) / 4);
    if (on("flute")) {
      // Each bar of the tune is pairs of [note, eighths].
      const line = tune[bar];
      let pos = 0;
      for (let k = 0; k < line.length; k += 2) {
        const [n, len] = [line[k], line[k + 1]];
        const startBeat = pos / 2;
        if (Math.floor(startBeat) === inBar && n >= 0)
          bandNote(
            p,
            "flute",
            t + (startBeat - inBar) * spb,
            pentatonic[n],
            (len / 2) * spb * 0.95,
          );
        pos += len;
      }
    }
    ui.current.push(
      setTimeout(
        () => {
          setBeat(b);
          setPlaying(active.current);
        },
        Math.max(0, (t - audioNow()) * 1000),
      ),
    );
  }
  function ensureRunning() {
    if (sched.current) return;
    const start = audioNow() + 0.1;
    sched.current = {
      next: start,
      beat: 0,
      timer: setInterval(() => {
        const s = sched.current!;
        while (s.next < audioNow() + 0.25) {
          scheduleBeat(s.beat, s.next);
          s.next += spb;
          s.beat++;
        }
        if (!wantRef.current.length && s.beat % 4 === 0) stop();
      }, 40),
    };
  }
  function stop() {
    if (sched.current) clearInterval(sched.current.timer);
    sched.current = null;
    active.current = [];
    ui.current.forEach(clearTimeout);
    ui.current = [];
    setPlaying([]);
  }
  useEffect(() => {
    if (want.length) ensureRunning();
    // Starting is a response to her tap; resuming on entry needs a new tap.
  }, [want]);
  useEffect(
    () => () => {
      stop();
      setWant([]);
    },
    [],
  );
  return (
    <div className="act act-band">
      <div className="stage-lights" aria-hidden="true" />
      <div className="band-row">
        {parts.map((p) => {
          const isOn = want.includes(p.id);
          const live = playing.includes(p.id);
          return (
            <button
              key={p.id}
              className={`musician m-${p.id} ${isOn ? "on" : ""} ${live ? "live" : ""} ${live && beat % 2 ? "bob" : ""}`}
              aria-label={p.label}
              aria-pressed={isOn}
              data-hint={p.id === "drums" ? true : undefined}
              onClick={() =>
                setWant((w) =>
                  w.includes(p.id) ? w.filter((x) => x !== p.id) : [...w, p.id],
                )
              }
            >
              <span className="spotlight" />
              <Critter kind={p.animal} mood={live ? "happy" : "neutral"} />
              <span className={`instrument-icon ii-${p.instrument}`} />
            </button>
          );
        })}
      </div>
      <button
        className="baton"
        aria-label="Big finish"
        key={flourish}
        disabled={!want.length}
        onClick={() => {
          setFlourish((f) => f + 1);
          const t = audioNow() + 0.05;
          [0, 2, 4, 5, 7, 9, 10].forEach((n, k) =>
            bandNote(prefs, "piano", t + k * 0.09, pentatonic[n], 0.4),
          );
          bandNote(prefs, "kick", t + 0.65);
          setTimeout(() => cymbal(prefs), 650);
          setWant([]);
          setTimeout(() => {
            stop();
            stopAudio();
          }, 2000);
        }}
      >
        <span className="baton-stick" />
      </button>
      <p className="sr-status" role="status">
        {playing.length
          ? `Playing: ${parts
              .filter((p) => playing.includes(p.id))
              .map((p) => p.label)
              .join(", ")}`
          : "The band is waiting."}
      </p>
    </div>
  );
}
