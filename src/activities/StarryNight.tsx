import { useRef, useState } from "react";
import type { MouseEvent as RM } from "react";
import type { Preferences } from "../model";
import { chime, pentatonic, sfx } from "../audio";
import { Critter } from "../play/Critter";
import { Thing } from "../play/Things";
import { say } from "../play/speech";
import { useSaved } from "../play/store";
// I3 Starry Night: tap the sky to place stars; each one chimes, higher in
// the sky is higher in pitch. Stars placed near each other join with faint
// lines; tap back on the first star of a chain to close the shape and it
// becomes a glowing constellation animal chosen by its number of corners
// (3 bird, 4 fish, 5 cat, 6 owl, 7 or more dragon). The moon says goodnight.
const W = 1000,
  H = 560,
  SKY = 430;
type Star = { x: number; y: number };
type Con = { stars: number[]; kind: string };
const creature = (n: number) =>
  n === 3
    ? "bird"
    : n === 4
      ? "fish"
      : n === 5
        ? "cat"
        : n === 6
          ? "owl"
          : "dragon";
const key = "Starry Night";
export default function StarryNight({ prefs }: { prefs: Preferences }) {
  const [stars, setStars] = useSaved<Star[]>(key + ":stars", () => []);
  const [chain, setChain] = useSaved<number[]>(key + ":chain", () => []);
  const [cons, setCons] = useSaved<Con[]>(key + ":cons", () => []);
  const [night, setNight] = useState(false);
  const [msg, setMsg] = useState("");
  const svg = useRef<SVGSVGElement>(null);
  function tapSky(e: RM<HTMLButtonElement>) {
    if (night) {
      chime(prefs, pentatonic[8 + Math.floor(Math.random() * 4)]);
      return;
    }
    // Map the touch into sky coordinates (the sky is cropped to fill).
    const el = svg.current!;
    const ctm = el.getScreenCTM();
    let x = 100 + Math.random() * 800,
      y = 60 + Math.random() * 300;
    if (ctm && e.clientX) {
      const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(
        ctm.inverse(),
      );
      x = pt.x;
      y = pt.y;
    }
    y = Math.min(y, SKY - 20);
    x = Math.max(20, Math.min(W - 20, x));
    // Closing a shape: tap near the first star of the current chain.
    if (chain.length >= 3) {
      const first = stars[chain[0]];
      if (Math.hypot(first.x - x, first.y - y) < 55) {
        const kind = creature(chain.length);
        setCons((c) => [...c, { stars: chain, kind }]);
        setChain([]);
        [0, 2, 4, 7].forEach((n, i) =>
          setTimeout(() => chime(prefs, pentatonic[n + 3]), i * 140),
        );
        setTimeout(() => say(prefs, `A ${kind}!`, "word"), 700);
        setMsg(`The stars made a ${kind}!`);
        return;
      }
    }
    if (stars.length >= 30) {
      sfx(prefs, "sparkle", 0.6);
      setMsg("The sky is full of stars.");
      return;
    }
    const i = stars.length;
    const last = chain.length ? stars[chain[chain.length - 1]] : null;
    const joins = last && Math.hypot(last.x - x, last.y - y) < 260;
    setStars((s) => [...s, { x, y }]);
    setChain(joins ? [...chain, i] : [i]);
    chime(
      prefs,
      pentatonic[Math.max(0, Math.min(12, Math.round(12 - (y / SKY) * 12)))],
    );
    setMsg(
      chain.length >= 2 && joins
        ? "Tap the first star to close the shape."
        : "",
    );
  }
  return (
    <div className={`act act-stars ${night ? "goodnight" : ""}`}>
      <div className="night-sky">
        <svg
          ref={svg}
          viewBox={`0 0 ${W} ${H}`}
          aria-hidden="true"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="nightGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#141A3C" />
              <stop offset="1" stopColor="#3B4A8A" />
            </linearGradient>
            <radialGradient id="starGlow">
              <stop offset="0" stopColor="#FFF6C9" stopOpacity=".9" />
              <stop offset="1" stopColor="#FFF6C9" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width={W} height={H} fill="url(#nightGrad)" />
          {cons.map((c, k) => {
            const pts = c.stars.map((i) => stars[i]);
            const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
            const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
            const span = Math.max(
              80,
              Math.max(...pts.map((p) => Math.hypot(p.x - cx, p.y - cy))) * 1.6,
            );
            return (
              <g key={k} className="constellation">
                <polygon
                  points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="#FFF6C9"
                  fillOpacity=".08"
                  stroke="#FFF6C9"
                  strokeOpacity=".7"
                  strokeWidth="3"
                />
                <foreignObject
                  x={cx - span / 2}
                  y={cy - span / 2}
                  width={span}
                  height={span}
                >
                  <div className="con-creature">
                    {c.kind === "bird" || c.kind === "fish" ? (
                      <Thing kind={c.kind} />
                    ) : (
                      <Critter kind={c.kind as "cat"} mood="happy" />
                    )}
                  </div>
                </foreignObject>
              </g>
            );
          })}
          {chain.slice(1).map((i, k) => {
            const a = stars[chain[k]],
              b = stars[i];
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#FFF6C9"
                strokeOpacity=".45"
                strokeWidth="3"
                strokeDasharray="2 10"
                strokeLinecap="round"
              />
            );
          })}
          {stars.map((s, i) => (
            <g
              key={i}
              transform={`translate(${s.x} ${s.y})`}
              className="sky-star"
              style={{ animationDelay: `${(i % 7) * 0.4}s` }}
            >
              <circle r="26" fill="url(#starGlow)" />
              <path
                d="M0-14 4-4 14 0 4 4 0 14-4 4-14 0-4-4z"
                fill={
                  chain[0] === i && chain.length >= 3 ? "#FFE066" : "#FFF6C9"
                }
              />
              {chain[0] === i && chain.length >= 3 && (
                <circle
                  r="22"
                  fill="none"
                  stroke="#FFE066"
                  strokeWidth="3"
                  className="close-me"
                />
              )}
            </g>
          ))}
          <g className="village">
            <path
              d={`M0 ${H}V470l60-30 60 30v-40l50-26 50 26v50l70-36 70 36v-30l60-30 60 30v40l50-24 50 24v-50l60-32 60 32v30l70-34 70 34v-20l50-24 50 24V${H}z`}
              fill="#0E1230"
            />
            {[90, 205, 300, 400, 520, 640, 760, 880].map((x, i) => (
              <rect
                key={x}
                x={x}
                y={490 + (i % 3) * 10}
                width="16"
                height="18"
                rx="3"
                className={`window w${i}`}
                fill="#FFD36B"
              />
            ))}
          </g>
        </svg>
        <button
          className="sky-hit"
          data-hint
          aria-label="Put a star in the sky"
          onClick={tapSky}
        />
        <button
          className="moon-btn"
          aria-label={night ? "Wake up the village" : "Goodnight, moon"}
          aria-pressed={night}
          onClick={() => {
            const n = !night;
            setNight(n);
            if (n) {
              [7, 5, 4, 2, 0].forEach((k, i) =>
                setTimeout(() => chime(prefs, pentatonic[k]), i * 600),
              );
              say(prefs, "Goodnight, little village.", "prompt", { rate: 0.7 });
            } else sfx(prefs, "sparkle");
          }}
        />
      </div>
      <p className="sr-status" role="status">
        {msg || `${stars.length} stars in the sky`}
      </p>
    </div>
  );
}
