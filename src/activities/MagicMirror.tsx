import { useRef } from "react";
import type { Preferences } from "../model";
import { chime, pentatonic } from "../audio";
import { ArtBoard, RAINBOW } from "../play/ArtBoard";
import type { Op } from "../play/ArtBoard";
import { Palette, UndoBroom } from "../play/ArtTools";
import { useSaved } from "../play/store";
// D3 Magic Mirror: whatever she draws is mirrored 2, 4, 6 or 8 ways around
// the middle, so any scribble becomes a kaleidoscope flower. Symmetry and
// pattern, with a soft shimmer that rises in pitch away from the centre.
const counts = [2, 4, 6, 8];
const key = "Magic Mirror";
export default function MagicMirror({ prefs }: { prefs: Preferences }) {
  const [ops, setOps] = useSaved<Op[]>(key + ":ops", () => []);
  const [n, setN] = useSaved(key + ":n", () => 6);
  const [colour, setColour] = useSaved(key + ":colour", () => RAINBOW);
  const [dark, setDark] = useSaved(key + ":dark", () => true);
  const hue = useRef(0);
  return (
    <div className={`act act-art act-mirror ${dark ? "dark" : ""}`}>
      <div className="art-side" role="group" aria-label="Mirrors">
        {counts.map((c) => (
          <button
            key={c}
            className="mirror-count"
            aria-label={`${c} mirrors`}
            aria-pressed={n === c}
            onClick={() => setN(c)}
          >
            <svg viewBox="-50 -50 100 100" aria-hidden="true">
              {Array.from({ length: c }, (_, i) => (
                <ellipse
                  key={i}
                  cx="0"
                  cy="-22"
                  rx={c > 4 ? 9 : 13}
                  ry="22"
                  fill={`hsl(${(i * 360) / c} 80% 62%)`}
                  transform={`rotate(${(i * 360) / c})`}
                />
              ))}
              <circle r="9" fill="#FFF8EC" />
            </svg>
          </button>
        ))}
        <button
          className={`art-tool tool-night ${dark ? "on" : ""}`}
          aria-label={dark ? "Daytime paper" : "Night paper"}
          onClick={() => setDark(!dark)}
        />
      </div>
      <ArtBoard
        label="Mirror drawing"
        ops={ops}
        blend="normal"
        className={`mirror-paper ${dark ? "dark" : ""}`}
        onCommit={(op) => setOps((o) => [...o.slice(-149), op])}
        make={([x, y]) => {
          hue.current = (hue.current + 47) % 360;
          const dist = Math.hypot(x - 0.5, y - 0.5);
          chime(prefs, pentatonic[Math.min(12, 3 + Math.round(dist * 18))]);
          return {
            t: "mirror",
            n,
            colour,
            size: 0.012,
            pts: [[x, y]],
            hue: hue.current,
          };
        }}
      />
      <div className="art-bottom">
        <Palette colour={colour} setColour={setColour} />
        <UndoBroom prefs={prefs} ops={ops} setOps={setOps} />
      </div>
    </div>
  );
}
