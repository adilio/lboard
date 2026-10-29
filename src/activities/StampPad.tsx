import { useState } from "react";
import type { Preferences } from "../model";
import { sfx } from "../audio";
import { ArtBoard, stampPaths } from "../play/ArtBoard";
import type { Op } from "../play/ArtBoard";
import { Palette, UndoBroom, paints } from "../play/ArtTools";
import { useSaved } from "../play/store";
// D2 Stamp Pad: big rubber stamps and ink. Tap to stamp, slide for a trail
// of stamps. Each stamp lands at a slightly different angle like real
// rubber, and the cat sometimes winks. Patterns, counting by accident.
const shapes = [
  "star",
  "heart",
  "cat",
  "leaf",
  "fish",
  "flower",
  "foot",
  "sun",
];
const sizes = [0.07, 0.11, 0.16];
const key = "Stamp Pad";
export default function StampPad({ prefs }: { prefs: Preferences }) {
  const [ops, setOps] = useSaved<Op[]>(key + ":ops", () => []);
  const [shape, setShape] = useState("star");
  const [colour, setColour] = useSaved(key + ":colour", () => paints[0][1]);
  const [size, setSize] = useState(1);
  const [inked, setInked] = useState(0);
  return (
    <div className="act act-art act-stamps">
      <div className="art-side stamp-rack" role="group" aria-label="Stamps">
        {shapes.map((s) => (
          <button
            key={s}
            className="stamp-handle"
            aria-label={`${s} stamp`}
            aria-pressed={shape === s}
            onClick={() => setShape(s)}
          >
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <path
                d={stampPaths[s]}
                fill={colour === "rainbow" ? "#8C6BE0" : colour}
              />
            </svg>
          </button>
        ))}
      </div>
      <ArtBoard
        label="Stamping paper"
        ops={ops}
        className="paper"
        extend="repeat"
        spacing={sizes[size] * 1.1}
        onCommit={(op) => {
          setOps((o) => [...o.slice(-399), op]);
          setInked((n) => n + 1);
        }}
        make={([x, y]) => {
          sfx(prefs, "thunk", 0.85 + Math.random() * 0.4);
          return {
            t: "stamp",
            shape,
            colour:
              colour === "rainbow"
                ? `hsl(${(inked * 37) % 360} 85% 58%)`
                : colour,
            size: sizes[size],
            x,
            y,
            rot: (Math.random() - 0.5) * 0.5,
            variant: Math.floor(Math.random() * 9),
          };
        }}
      />
      <div className="art-bottom">
        <Palette colour={colour} setColour={setColour} />
        <div className="stamp-sizes" role="group" aria-label="Stamp size">
          {["Small", "Middle", "Big"].map((n, i) => (
            <button
              key={n}
              className={`size-dot s${i}`}
              aria-label={`${n} stamp`}
              aria-pressed={size === i}
              onClick={() => setSize(i)}
            />
          ))}
        </div>
        <UndoBroom prefs={prefs} ops={ops} setOps={setOps} />
      </div>
    </div>
  );
}
