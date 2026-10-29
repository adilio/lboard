import { useRef, useState } from "react";
import type { Preferences, Paint } from "../model";
import { css, mixPaint, nameColour } from "../model";
import { sfx } from "../audio";
import { Thing } from "../play/Things";
import type { ThingKind } from "../play/Things";
import { say } from "../play/speech";
import { useSaved } from "../play/store";
// E1 Colour Mixing Pots: pour splashes of red, yellow, blue, white and black
// into the bowl. The colours swirl unmixed until she stirs, which leaves a
// moment to guess what will happen. New colours are named with a real
// object of that colour, and can be kept on the shelf, where they become
// paint pots in Finger Paint.
const jars: { k: keyof Paint; name: string; colour: string }[] = [
  { k: "r", name: "Red", colour: "#FF2E1F" },
  { k: "y", name: "Yellow", colour: "#FFE000" },
  { k: "b", name: "Blue", colour: "#1F5BFF" },
  { k: "w", name: "White", colour: "#FFFFFF" },
  { k: "k", name: "Black", colour: "#24222E" },
];
const objectArt: Record<string, ThingKind> = {
  strawberry: "berries",
  orange: "carrot",
  banana: "banana",
  frog: "lettuce",
  whale: "bird",
  grapes: "berries",
  flamingo: "flower",
  teddy: "cork",
  cloud: "bone",
  elephant: "rock",
  sky: "water",
  leaf: "leaf",
  peach: "sponge",
  flower: "balloon",
};
const key = "Colour Mixing Pots";
export default function ColourMixingPots({ prefs }: { prefs: Preferences }) {
  const [parts, setParts] = useSaved<(keyof Paint)[]>(key + ":parts", () => []);
  const [stirred, setStirred] = useSaved(key + ":stirred", () => false);
  const [shelf, setShelf] = useSaved<{ css: string; name: string }[]>(
    key + ":shelf",
    () => [],
  );
  const [made, setMade] = useSaved<string[]>(key + ":made", () => []);
  const [pouring, setPouring] = useState<{ k: keyof Paint; n: number } | null>(
    null,
  );
  const [stirring, setStirring] = useState(false);
  const [named, setNamed] = useState<{ name: string; object: string } | null>(
    null,
  );
  const asked = useRef(false);
  const mixed = mixPaint(parts);
  const kinds = [...new Set(parts)];
  function pour(k: keyof Paint) {
    if (parts.length >= 12) {
      sfx(prefs, "glug", 0.7);
      return;
    }
    setPouring({ k, n: Date.now() });
    sfx(prefs, "glug", 0.9 + parts.length * 0.03);
    setParts((p) => [...p, k]);
    setStirred(false);
    setNamed(null);
    if (!asked.current && new Set([...parts, k]).size >= 2) {
      asked.current = true;
      setTimeout(
        () => say(prefs, "What colour will it make? Stir and see!", "prompt"),
        500,
      );
    }
  }
  function stir() {
    if (!parts.length || stirring) return;
    setStirring(true);
    sfx(prefs, "whoosh", 0.8);
    setTimeout(() => sfx(prefs, "whoosh", 1), 300);
    setTimeout(() => {
      setStirring(false);
      setStirred(true);
      const n = nameColour(mixed!);
      setNamed(n);
      const isNew = !made.includes(n.name);
      if (isNew) {
        setMade((m) => [...m, n.name]);
        sfx(prefs, "tada");
      } else sfx(prefs, "sparkle");
      say(
        prefs,
        isNew ? `${n.name}! Like a ${n.object}!` : `${n.name}!`,
        "word",
      );
    }, 900);
  }
  const swirl = kinds.length
    ? `conic-gradient(from 30deg, ${parts.map((k, i) => `${jars.find((j) => j.k === k)!.colour} ${(i / parts.length) * 100}% ${((i + 1) / parts.length) * 100}%`).join(", ")})`
    : "none";
  return (
    <div className="act act-pots">
      <div className="jar-shelf">
        {jars.map((j) => (
          <button
            key={j.k}
            className={`paint-jar ${pouring?.k === j.k ? "tipping" : ""}`}
            data-hint={j.k === "y" ? true : undefined}
            style={{ "--paint": j.colour } as React.CSSProperties}
            aria-label={`${j.name} paint jar`}
            onClick={() => pour(j.k)}
          >
            <span className="jar-glass">
              <span className="jar-paint" />
            </span>
            <span className="jar-lid" />
          </button>
        ))}
      </div>
      <div className="mix-station">
        <div className="bowl-wrap">
          {pouring && (
            <span
              className="pour-stream"
              key={pouring.n}
              style={
                {
                  "--paint": jars.find((j) => j.k === pouring.k)!.colour,
                } as React.CSSProperties
              }
            />
          )}
          <div className={`mix-bowl ${stirring ? "stirring" : ""}`}>
            <span
              className="bowl-paint"
              style={{
                background: stirred && mixed ? css(mixed) : swirl,
                opacity: parts.length ? 1 : 0,
                transform: `scale(${0.55 + Math.min(parts.length, 12) * 0.035})`,
              }}
            />
          </div>
          <button
            className={`spoon ${stirring ? "stirring" : ""}`}
            aria-label="Stir"
            disabled={!parts.length}
            onClick={stir}
          >
            <span />
          </button>
          <button
            className="drain"
            aria-label="Empty the bowl"
            disabled={!parts.length}
            onClick={() => {
              setParts([]);
              setStirred(false);
              setNamed(null);
              sfx(prefs, "glug", 0.6);
            }}
          />
        </div>
        <div className="colour-card" aria-live="polite">
          {named && mixed && (
            <div className="named" key={named.name}>
              <span className="swatch" style={{ background: css(mixed) }} />
              {objectArt[named.object] && (
                <Thing kind={objectArt[named.object]} />
              )}
              <strong>{named.name}</strong>
              <button
                className="keep-btn"
                aria-label={`Keep ${named.name}`}
                disabled={
                  shelf.some((s) => s.css === css(mixed)) || shelf.length >= 8
                }
                onClick={() => {
                  setShelf((s) => [
                    ...s,
                    { css: css(mixed), name: named.name },
                  ]);
                  sfx(prefs, "pop");
                }}
              >
                <span
                  className="mini-jar"
                  style={{ "--paint": css(mixed) } as React.CSSProperties}
                />
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="colour-shelf" aria-label="My colours">
        {shelf.map((s, i) => (
          <span
            key={i}
            className="mini-jar kept"
            style={{ "--paint": s.css } as React.CSSProperties}
            title={s.name}
          />
        ))}
      </div>
      <p className="sr-status" role="status">
        {named
          ? `It made ${named.name}.`
          : parts.length
            ? `${parts.length} splashes in the bowl. Stir to mix.`
            : ""}
      </p>
    </div>
  );
}
