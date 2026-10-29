import { useEffect, useState } from "react";
import type { Preferences } from "../model";
import { sfx } from "../audio";
import { RAINBOW } from "./ArtBoard";
import type { Op } from "./ArtBoard";
import { useSaved } from "./store";
export const paints: [string, string][] = [
  ["Red", "#FF5A4E"],
  ["Orange", "#FF9F3A"],
  ["Yellow", "#FFD23F"],
  ["Green", "#4FB45E"],
  ["Teal", "#2EC4B6"],
  ["Blue", "#2F80ED"],
  ["Purple", "#8C6BE0"],
  ["Pink", "#FF7EB6"],
  ["Brown", "#A0683C"],
  ["Black", "#2E2A3B"],
];
// Paint pots, including any colours she mixed in the Little Lab.
export function Palette({
  colour,
  setColour,
  rainbow = true,
}: {
  colour: string;
  setColour: (c: string) => void;
  rainbow?: boolean;
}) {
  const [shelf] = useSaved<{ css: string; name: string }[]>(
    "Colour Mixing Pots:shelf",
    () => [],
  );
  return (
    <div className="palette" role="group" aria-label="Paint pots">
      {paints.map(([name, c]) => (
        <button
          key={c}
          className="pot"
          style={{ "--paint": c } as React.CSSProperties}
          aria-label={`${name} paint`}
          aria-pressed={colour === c}
          onClick={() => setColour(c)}
        />
      ))}
      {shelf.map((s, i) => (
        <button
          key={i}
          className="pot mixed"
          style={{ "--paint": s.css } as React.CSSProperties}
          aria-label={`My ${s.name} paint`}
          aria-pressed={colour === s.css}
          onClick={() => setColour(s.css)}
        />
      ))}
      {rainbow && (
        <button
          className="pot rainbow"
          aria-label="Rainbow paint"
          aria-pressed={colour === RAINBOW}
          onClick={() => setColour(RAINBOW)}
        />
      )}
    </div>
  );
}
// Undo (a curling ribbon) and a broom that asks twice before sweeping
// everything away (spec §9.8): the first tap sweeps halfway; tap again to
// clear, anything else and it puts the broom back.
export function UndoBroom({
  prefs,
  ops,
  setOps,
}: {
  prefs: Preferences;
  ops: Op[];
  setOps: (f: (o: Op[]) => Op[]) => void;
}) {
  const [sweeping, setSweeping] = useState(false);
  const [undos, setUndos] = useState(0);
  const [lastLen, setLastLen] = useState(ops.length);
  if (ops.length > lastLen) {
    setLastLen(ops.length);
    setUndos(0);
  }
  useEffect(() => {
    if (!sweeping) return;
    const t = setTimeout(() => setSweeping(false), 3500);
    const cancel = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest(".broom")) setSweeping(false);
    };
    document.addEventListener("pointerdown", cancel, true);
    return () => {
      clearTimeout(t);
      document.removeEventListener("pointerdown", cancel, true);
    };
  }, [sweeping]);
  return (
    <div className="art-actions">
      <button
        className="undo"
        aria-label="Undo"
        disabled={!ops.length || undos >= 10}
        onClick={() => {
          setOps((o) => o.slice(0, -1));
          setLastLen(ops.length - 1);
          setUndos((u) => u + 1);
          sfx(prefs, "whoosh", 0.6);
        }}
      >
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path
            d="M14 20q10-12 22-2t-2 20"
            stroke="#E05A8C"
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M6 22l12-10 2 14z" fill="#E05A8C" />
        </svg>
      </button>
      <button
        className={`broom ${sweeping ? "sweeping" : ""}`}
        aria-label={sweeping ? "Sweep it all away" : "New page"}
        disabled={!ops.length}
        onClick={() => {
          if (!sweeping) {
            setSweeping(true);
            sfx(prefs, "whoosh", 0.8);
            return;
          }
          setSweeping(false);
          setOps(() => []);
          setLastLen(0);
          sfx(prefs, "sparkle", 0.8);
        }}
      >
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path d="m30 6 6 4-12 20-6-4z" fill="#C98A55" />
          <path d="M16 24 26 30l-4 12q-1 3-4 2L6 37q-3-1-1-4z" fill="#FFC94A" />
        </svg>
      </button>
    </div>
  );
}
