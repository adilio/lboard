import { useEffect, useRef, useState } from "react";
import type { PointerEvent as RP } from "react";
import type { Preferences } from "../model";
import { audioNow, bandNote, cymbal, drum, jingle, shaker } from "../audio";
import { Critter } from "../play/Critter";
// B2 Drum Circle: five drums and a soft cymbal in an arc, all multitouch so
// a grown-up can play too. The frog "beat buddy" keeps a steady beat on a
// woodblock when asked, to practise playing along (beat keeping), and
// stops whenever she taps it again.
type Kit = "bass" | "bongoL" | "bongoR" | "tamb" | "shaker" | "cymbal";
const kit: { id: Kit; label: string; colour: string }[] = [
  { id: "bongoL", label: "Low bongo", colour: "#FF9F3A" },
  { id: "tamb", label: "Tambourine", colour: "#FFC94A" },
  { id: "cymbal", label: "Cymbal", colour: "#E8C83A" },
  { id: "shaker", label: "Shaker", colour: "#6CC07A" },
  { id: "bongoR", label: "High bongo", colour: "#3BA7E0" },
  { id: "bass", label: "Big drum", colour: "#FF5A4E" },
];
const BPM = 96;
export default function DrumCircle({ prefs }: { prefs: Preferences }) {
  const [hit, setHit] = useState<Record<Kit, number>>(
    {} as Record<Kit, number>,
  );
  const [buddy, setBuddy] = useState(false);
  const [beat, setBeat] = useState(0);
  const loop = useRef<ReturnType<typeof setInterval> | null>(null);
  const shakeX = useRef<Record<number, number>>({});
  useEffect(
    () => () => {
      if (loop.current) clearInterval(loop.current);
    },
    [],
  );
  function play(id: Kit) {
    setHit((h) => ({ ...h, [id]: (h[id] ?? 0) + 1 }));
    if (id === "bass") drum(prefs, 70);
    if (id === "bongoL") drum(prefs, 190);
    if (id === "bongoR") drum(prefs, 290);
    if (id === "tamb") jingle(prefs);
    if (id === "shaker") shaker(prefs);
    if (id === "cymbal") cymbal(prefs);
  }
  function toggleBuddy() {
    if (buddy) {
      if (loop.current) clearInterval(loop.current);
      loop.current = null;
      setBuddy(false);
      return;
    }
    setBuddy(true);
    const spb = 60 / BPM;
    let next = audioNow() + 0.15;
    let n = 0;
    // Look-ahead scheduler: queue clicks on the audio clock.
    loop.current = setInterval(() => {
      while (next < audioNow() + 0.2) {
        bandNote(prefs, "hat", next);
        bandNote(prefs, n % 4 === 0 ? "kick" : "snare", next);
        const at = next;
        const k = n;
        setTimeout(() => setBeat(k + 1), Math.max(0, (at - audioNow()) * 1000));
        next += spb;
        n++;
      }
    }, 50);
  }
  const shake = (e: RP<HTMLButtonElement>) => {
    const last = shakeX.current[e.pointerId];
    if (last === undefined) return;
    if (Math.abs(e.clientX - last) > 40) {
      shakeX.current[e.pointerId] = e.clientX;
      play("shaker");
    }
  };
  return (
    <div className="act act-drums">
      <div className="drum-arc">
        {kit.map((k, i) => (
          <button
            key={k.id}
            className={`kit kit-${k.id}`}
            style={{ "--c": k.colour, "--i": i } as React.CSSProperties}
            aria-label={k.label}
            data-hint={k.id === "bass" ? true : undefined}
            onPointerDown={(e) => {
              if (e.pointerType === "mouse" && e.button > 0) return;
              if (k.id === "shaker") shakeX.current[e.pointerId] = e.clientX;
              play(k.id);
            }}
            onPointerMove={k.id === "shaker" ? shake : undefined}
            onPointerUp={(e) => delete shakeX.current[e.pointerId]}
            onClick={(e) => {
              if (e.detail === 0) play(k.id);
            }}
          >
            <span className="kit-body" />
            <span className="kit-head" key={hit[k.id] ?? 0}>
              <i className="ripple" />
            </span>
          </button>
        ))}
      </div>
      <button
        className={`beat-buddy ${buddy ? "on" : ""}`}
        aria-label={buddy ? "Stop the beat" : "Play a steady beat"}
        aria-pressed={buddy}
        onClick={toggleBuddy}
      >
        <span className={`buddy-bob ${buddy && beat % 2 ? "down" : ""}`}>
          <Critter kind="frog" mood={buddy ? "happy" : "neutral"} />
        </span>
        <span className="woodblock" />
      </button>
    </div>
  );
}
