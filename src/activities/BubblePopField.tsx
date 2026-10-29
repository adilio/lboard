import { useEffect, useRef, useState } from "react";
import type { Preferences } from "../model";
import { chime, pentatonic, sfx } from "../audio";
import { Thing } from "../play/Things";
import { useSaved } from "../play/store";
// J1 Bubble Pop Field: the bubble machine puffs out big, slow bubbles.
// Pop them (any finger, several at once; a near miss counts). Some hold a
// surprise: a little bird flies out, a note plays, or a flower drops into
// the meadow and stays there. The machine rests at 12 bubbles, and tapping
// it blows a fresh puff.
type Bubble = {
  id: number;
  x: number;
  y: number;
  drift: number;
  size: number;
  speed: number;
  phase: number;
  surprise: "" | "bird" | "note" | "flower";
  hue: number;
};
type Pop = {
  id: number;
  x: number;
  y: number;
  surprise: Bubble["surprise"];
  size: number;
};
let nextId = 1;
const key = "Bubble Pop Field";
export default function BubblePopField({ prefs }: { prefs: Preferences }) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [pops, setPops] = useState<Pop[]>([]);
  const [flowers, setFlowers] = useSaved<{ x: number; hue: number }[]>(
    key + ":flowers",
    () => [],
  );
  const field = useRef<HTMLDivElement>(null);
  const live = useRef<Bubble[]>([]);
  const els = useRef(new Map<number, HTMLButtonElement>());
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;
  const make = (): Bubble => ({
    id: nextId++,
    x: 14 + Math.random() * 6,
    y: 78,
    drift: 2 + Math.random() * 7,
    size: 90 + Math.random() * 70,
    speed: 5 + Math.random() * 4,
    phase: Math.random() * 6,
    surprise:
      Math.random() < 0.3
        ? (["bird", "note", "flower"] as const)[Math.floor(Math.random() * 3)]
        : "",
    hue: Math.random() * 360,
  });
  function add(n: number) {
    const room = 12 - live.current.length;
    const list = Array.from({ length: Math.max(0, Math.min(n, room)) }, make);
    if (!list.length) return;
    live.current = [...live.current, ...list];
    setBubbles(live.current);
  }
  useEffect(() => {
    let last = performance.now();
    let spawn = 0;
    let raf = 0;
    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      spawn += dt;
      if (spawn > 1.4 && live.current.length < 12) {
        spawn = 0;
        add(1);
      }
      let gone = false;
      for (const b of live.current) {
        b.y -= b.speed * dt;
        b.x = Math.min(92, b.x + b.drift * dt);
        const el = els.current.get(b.id);
        if (el)
          el.style.transform = `translateX(${Math.sin(t / 1100 + b.phase) * 10}px)`;
        if (el) {
          el.style.left = `${b.x}%`;
          el.style.top = `${b.y}%`;
        }
        if (b.y < -15) gone = true;
      }
      if (gone) {
        live.current = live.current.filter((b) => b.y >= -15);
        setBubbles(live.current);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    add(3);
    return () => cancelAnimationFrame(raf);
  }, []);
  function pop(b: Bubble) {
    if (!live.current.includes(b)) return;
    live.current = live.current.filter((x) => x !== b);
    setBubbles(live.current);
    const p = prefsRef.current;
    sfx(p, "pop", 1.5 - (b.size - 90) / 140);
    setPops((ps) => [
      ...ps.slice(-8),
      { id: b.id, x: b.x, y: b.y, surprise: b.surprise, size: b.size },
    ]);
    if (b.surprise === "note")
      setTimeout(
        () =>
          [0, 2, 4].forEach((n, i) =>
            setTimeout(
              () => chime(p, pentatonic[5 + n + Math.floor(Math.random() * 3)]),
              i * 120,
            ),
          ),
        100,
      );
    if (b.surprise === "bird") setTimeout(() => sfx(p, "squeak", 1.2), 150);
    if (b.surprise === "flower") {
      setTimeout(() => sfx(p, "plop", 1.2), 700);
      setFlowers((f) => [
        ...f.slice(-19),
        { x: Math.max(4, Math.min(94, b.x)), hue: b.hue },
      ]);
    }
    setTimeout(() => setPops((ps) => ps.filter((x) => x.id !== b.id)), 1600);
  }
  return (
    <div className="act act-bubbles" ref={field}>
      <div className="meadow" aria-hidden="true">
        {flowers.map((f, i) => (
          <span
            key={i}
            className="meadow-flower"
            style={{ left: `${f.x}%`, filter: `hue-rotate(${f.hue}deg)` }}
          >
            <Thing kind="flower" />
          </span>
        ))}
      </div>
      <button
        className="bubble-machine"
        data-hint
        aria-label="Blow more bubbles"
        onClick={() => {
          add(3);
          sfx(prefs, "whoosh", 1.2);
        }}
      >
        <span className="bm-body" />
        <span className="bm-wand" />
      </button>
      {bubbles.map((b) => (
        <button
          key={b.id}
          ref={(el) => {
            if (el) els.current.set(b.id, el);
            else els.current.delete(b.id);
          }}
          className={`float-bubble ${b.surprise ? `has-${b.surprise}` : ""}`}
          style={
            {
              width: b.size,
              height: b.size,
              left: `${b.x}%`,
              top: `${b.y}%`,
              "--h": `${b.hue}deg`,
            } as React.CSSProperties
          }
          aria-label="Pop the bubble"
          onPointerDown={(e) => {
            if (e.pointerType === "mouse" && e.button > 0) return;
            pop(b);
          }}
          onClick={(e) => {
            if (e.detail === 0) pop(b);
          }}
        >
          {b.surprise && (
            <span className="inside">
              <Thing kind={b.surprise === "note" ? "note" : b.surprise} />
            </span>
          )}
        </button>
      ))}
      {pops.map((p) => (
        <span
          key={p.id}
          className={`pop-spot pop-${p.surprise || "plain"}`}
          style={
            {
              left: `${p.x}%`,
              top: `${p.y}%`,
              "--s": `${p.size}px`,
            } as React.CSSProperties
          }
          aria-hidden="true"
        >
          <i className="ring" />
          {p.surprise && (
            <Thing kind={p.surprise === "note" ? "note" : p.surprise} />
          )}
        </span>
      ))}
    </div>
  );
}
