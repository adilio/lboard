import { useState } from "react";
import type { Preferences } from "../model";
import { sfx } from "../audio";
import { ArtBoard } from "../play/ArtBoard";
import type { Op } from "../play/ArtBoard";
import { Palette, UndoBroom, paints } from "../play/ArtTools";
import { useSaved } from "../play/store";
// D1 Finger Paint: thick paint for up to five fingers at once. Paint mixes
// where it overlaps (yellow over blue turns green), and there are a few
// tools: finger, sponge, spray and a damp cloth to wipe. Colours mixed in
// the Little Lab show up as extra paint pots.
const tools = [
  { id: "finger", label: "Finger" },
  { id: "sponge", label: "Sponge" },
  { id: "spray", label: "Spray" },
  { id: "cloth", label: "Cloth" },
] as const;
type Tool = (typeof tools)[number]["id"];
const key = "Finger Paint";
export default function FingerPaint({ prefs }: { prefs: Preferences }) {
  const [ops, setOps] = useSaved<Op[]>(key + ":ops", () => []);
  const [colour, setColour] = useSaved(key + ":colour", () => paints[5][1]);
  const [tool, setTool] = useState<Tool>("finger");
  const [big, setBig] = useState(true);
  return (
    <div className="act act-art act-paint">
      <div className="art-side">
        {tools.map((t) => (
          <button
            key={t.id}
            className={`art-tool tool-${t.id}`}
            aria-label={t.label}
            aria-pressed={tool === t.id}
            onClick={() => setTool(t.id)}
          />
        ))}
        <button
          className={`art-tool tool-size ${big ? "big" : ""}`}
          aria-label={big ? "Thin brush" : "Thick brush"}
          onClick={() => setBig(!big)}
        />
      </div>
      <ArtBoard
        label="Painting paper"
        ops={ops}
        className="paper"
        onCommit={(op) => setOps((o) => [...o.slice(-299), op])}
        make={(p) => {
          sfx(prefs, "plop", 1.6);
          return {
            t: "paint",
            tool,
            colour: tool === "cloth" ? "#000" : colour,
            size:
              (big ? 0.05 : 0.022) *
              (tool === "cloth" ? 1.8 : tool === "spray" ? 1.6 : 1),
            pts: [p],
            seed: Math.floor(Math.random() * 1e9),
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
