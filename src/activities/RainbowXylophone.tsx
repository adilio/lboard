import { useEffect, useRef, useState } from "react";
import type { PointerEvent as RP } from "react";
import type { Preferences } from "../model";
import { pentatonic, sfx, tone } from "../audio";
import { pick } from "../play/store";
// B1 Rainbow Xylophone: eight pentatonic bars, longest to shortest. Tap,
// slide for a glissando, or play with two hands (or two people). The music
// box plays a little phrase with the bars glowing, then listens: whatever
// she plays back is welcome, and copying it closely gets a little cheer.
const colours = [
  "#FF5A4E",
  "#FF9F3A",
  "#FFC94A",
  "#6CC07A",
  "#5FD3B5",
  "#3BA7E0",
  "#8C6BE0",
  "#E05A8C",
];
const notes = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => pentatonic[i]);
const names = ["C", "D", "E", "G", "A", "high C", "high D", "high E"];
const phrases = [
  [0, 1, 2, 1, 0],
  [2, 3, 4, 3, 2],
  [0, 2, 4, 2, 0],
  [4, 3, 2, 1, 0],
  [0, 0, 4, 4, 5],
  [7, 5, 4, 2, 0],
  [2, 4, 5, 4, 2],
];
export default function RainbowXylophone({ prefs }: { prefs: Preferences }) {
  const [hits, setHits] = useState<Record<number, number>>({});
  const [glow, setGlow] = useState<number | null>(null);
  const [mallet, setMallet] = useState(3);
  const [listening, setListening] = useState<number[] | null>(null);
  const [cheer, setCheer] = useState(0);
  const [sprites, setSprites] = useState<{ id: number; bar: number }[]>([]);
  const answer = useRef<number[]>([]);
  const pointers = useRef(new Map<number, number>());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const spriteId = useRef(0);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  function strike(i: number) {
    tone(prefs, notes[i], "sine", 0.9);
    setHits((h) => ({ ...h, [i]: (h[i] ?? 0) + 1 }));
    setMallet(i);
    const id = ++spriteId.current;
    setSprites((s) => [...s.slice(-10), { id, bar: i }]);
    timers.current.push(
      setTimeout(() => setSprites((s) => s.filter((x) => x.id !== id)), 900),
    );
    if (listening) {
      answer.current.push(i);
      if (answer.current.length === listening.length) {
        const same = answer.current.filter((n, k) => n === listening[k]).length;
        if (same >= listening.length - 1) {
          timers.current.push(setTimeout(() => sfx(prefs, "tada"), 300));
          setCheer((c) => c + 1);
        } else
          timers.current.push(setTimeout(() => sfx(prefs, "sparkle"), 300));
        setListening(null);
      }
    }
  }
  function playPhrase() {
    timers.current.forEach(clearTimeout);
    const phrase = pick(phrases);
    setListening(null);
    answer.current = [];
    phrase.forEach((n, k) =>
      timers.current.push(
        setTimeout(
          () => {
            tone(prefs, notes[n], "sine", 0.7);
            setGlow(n);
            setMallet(n);
          },
          400 + k * 480,
        ),
      ),
    );
    timers.current.push(
      setTimeout(
        () => {
          setGlow(null);
          setListening(phrase);
        },
        400 + phrase.length * 480,
      ),
    );
  }
  const barAt = (x: number, y: number) => {
    const el = document
      .elementFromPoint(x, y)
      ?.closest<HTMLElement>("[data-bar]");
    return el ? Number(el.dataset.bar) : null;
  };
  const down = (e: RP<HTMLButtonElement>, i: number) => {
    if (e.pointerType === "mouse" && e.button > 0) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, i);
    strike(i);
  };
  const move = (e: RP<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    const b = barAt(e.clientX, e.clientY);
    if (b !== null && b !== pointers.current.get(e.pointerId)) {
      pointers.current.set(e.pointerId, b);
      strike(b);
    }
  };
  const up = (e: RP<HTMLDivElement>) => pointers.current.delete(e.pointerId);
  return (
    <div className="act act-xylo">
      <div className="xylo-top">
        <button
          className={`music-box-btn ${listening ? "listening" : ""}`}
          aria-label="Play me a tune"
          onClick={playPhrase}
        >
          <span className="mb-lid" />
          <span className="mb-box" />
          <span className="mb-key" />
        </button>
        <div
          className={`mallet-friend cheer-${cheer % 2}`}
          style={{ "--bar": mallet } as React.CSSProperties}
          key={cheer}
          aria-hidden="true"
        >
          <span className="mallet-head" />
          <span className="mallet-stick" />
        </div>
      </div>
      <div
        className="xylophone"
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={up}
      >
        <span className="rail rail-top" />
        <span className="rail rail-bottom" />
        {notes.map((_, i) => (
          <button
            key={i}
            data-bar={i}
            data-hint={i === 2 ? true : undefined}
            className={`bar ${glow === i ? "glow" : ""} ${listening?.includes(i) ? "" : ""}`}
            style={
              {
                "--c": colours[i],
                "--h": `${100 - i * 7}%`,
              } as React.CSSProperties
            }
            aria-label={`Play ${names[i]}`}
            onPointerDown={(e) => down(e, i)}
            onClick={(e) => {
              if (e.detail === 0) strike(i);
            }}
          >
            <span className="bar-face" key={hits[i] ?? 0}>
              <i className="bolt" />
              <i className="bolt" />
            </span>
          </button>
        ))}
        {sprites.map((s) => (
          <span
            key={s.id}
            className="note-sprite"
            style={
              { "--bar": s.bar, "--c": colours[s.bar] } as React.CSSProperties
            }
            aria-hidden="true"
          >
            ♪
          </span>
        ))}
      </div>
      <p className="sr-status" role="status">
        {listening ? "Your turn! Play anything." : ""}
      </p>
    </div>
  );
}
