import { useEffect, useRef, useState } from "react";
import type { Preferences } from "../model";
import { chime, pentatonic, sfx } from "../audio";
import { say } from "../play/speech";
import { useSaved } from "../play/store";
// I1 Breathing Balloon: hold the balloon to breathe in with it (it grows),
// let go to breathe out (it shrinks). The guide makes the balloon breathe
// on its own at a slow 4 seconds in, 6 seconds out, with a soft "in… out…".
// After five breaths it floats up and becomes a cloud. Never scored.
const MIN = 0.55,
  MAX = 1.12;
const colours = ["#FF8FC0", "#8C6BE0", "#3BA7E0", "#6CC07A", "#FFC94A"];
const key = "Breathing Balloon";
export default function BreathingBalloon({ prefs }: { prefs: Preferences }) {
  const [clouds, setClouds] = useSaved(key + ":clouds", () => 0);
  const [guide, setGuide] = useState(false);
  const [breaths, setBreaths] = useState(0);
  const [floating, setFloating] = useState(false);
  const [phase, setPhase] = useState<"in" | "out" | "rest">("rest");
  const holding = useRef(false);
  const size = useRef(MIN);
  const full = useRef(false);
  const balloon = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const guideStart = useRef(0);
  const lastPhase = useRef<"in" | "out" | "rest">("rest");
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;
  const breathsRef = useRef(0);
  const floatingRef = useRef(false);
  useEffect(() => {
    let last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      let target: "in" | "out";
      if (guide && !floatingRef.current) {
        const cyc = ((t - guideStart.current) / 1000) % 10;
        target = cyc < 4 ? "in" : "out";
      } else target = holding.current ? "in" : "out";
      if (!floatingRef.current) {
        // Easing towards full or empty: ~4 s to fill, ~6 s to empty.
        if (target === "in")
          size.current = Math.min(
            MAX,
            size.current +
              ((MAX - MIN) / 4) *
                dt *
                (1.4 - ((size.current - MIN) / (MAX - MIN)) * 0.8),
          );
        else
          size.current = Math.max(
            MIN,
            size.current -
              ((MAX - MIN) / 6) *
                dt *
                (0.6 + ((size.current - MIN) / (MAX - MIN)) * 0.8),
          );
      }
      const ph = floatingRef.current
        ? "rest"
        : target === "in" && size.current < MAX
          ? "in"
          : target === "out" && size.current > MIN + 0.01
            ? "out"
            : "rest";
      if (ph !== lastPhase.current) {
        lastPhase.current = ph;
        setPhase(ph);
        const p = prefsRef.current;
        if (ph === "in") {
          sfx(p, "whoosh", 0.45);
          if (guide) say(p, "Breathe in", "prompt", { rate: 0.7, pitch: 1 });
        }
        if (ph === "out") {
          sfx(p, "whoosh", 0.32);
          if (guide) say(p, "and out", "prompt", { rate: 0.6, pitch: 0.95 });
        }
      }
      if (size.current > MAX - 0.08) full.current = true;
      if (full.current && size.current < MIN + 0.12) {
        full.current = false;
        breathsRef.current += 1;
        setBreaths(breathsRef.current);
        chime(prefsRef.current, pentatonic[4 + breathsRef.current]);
        if (breathsRef.current >= 5) {
          floatingRef.current = true;
          setFloating(true);
          setTimeout(() => {
            setClouds((c) => Math.min(c + 1, 6));
            breathsRef.current = 0;
            setBreaths(0);
            size.current = MIN;
            floatingRef.current = false;
            setFloating(false);
            guideStart.current = performance.now();
          }, 3600);
        }
      }
      if (balloon.current)
        balloon.current.style.setProperty("--s", String(size.current));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [guide, setClouds]);
  const press = (on: boolean) => {
    holding.current = on;
  };
  const colour = colours[clouds % colours.length];
  return (
    <div className="act act-balloon">
      <div className="calm-sky">
        {Array.from({ length: clouds }, (_, i) => (
          <span
            key={i}
            className="made-cloud"
            style={{
              left: `${8 + ((i * 17) % 80)}%`,
              top: `${6 + (i % 3) * 10}%`,
            }}
            aria-hidden="true"
          />
        ))}
      </div>
      <div
        className={`balloon-wrap ${floating ? "float-away" : ""}`}
        key={clouds}
        ref={balloon}
        style={{ "--s": MIN, "--b": colour } as React.CSSProperties}
      >
        <button
          className={`balloon phase-${phase}`}
          data-hint
          aria-label={
            guide
              ? "The balloon is breathing"
              : "Hold to breathe in, let go to breathe out"
          }
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture?.(e.pointerId);
            press(true);
          }}
          onPointerUp={() => press(false)}
          onPointerCancel={() => press(false)}
          onLostPointerCapture={() => press(false)}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              press(true);
            }
          }}
          onKeyUp={() => press(false)}
          onContextMenu={(e) => e.preventDefault()}
        >
          <svg viewBox="0 0 200 240" aria-hidden="true">
            <ellipse cx="100" cy="100" rx="84" ry="96" fill="var(--b)" />
            <ellipse
              cx="70"
              cy="62"
              rx="16"
              ry="28"
              fill="#fff"
              opacity=".35"
            />
            <path d="M88 192h24l-12 14z" fill="var(--b)" />
            <path
              d="M80 104q8-8 16 0M104 104q8-8 16 0"
              stroke="#2E2A3B"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M90 126q10 8 20 0"
              stroke="#2E2A3B"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
            <ellipse
              cx="66"
              cy="120"
              rx="10"
              ry="6"
              fill="#fff"
              opacity=".35"
            />
            <ellipse
              cx="134"
              cy="120"
              rx="10"
              ry="6"
              fill="#fff"
              opacity=".35"
            />
          </svg>
        </button>
        <span className="string" aria-hidden="true" />
      </div>
      <div className="breath-dots" aria-label={`${breaths} breaths`}>
        {[0, 1, 2, 3, 4].map((i) => (
          <i key={i} className={i < breaths ? "on" : ""} />
        ))}
      </div>
      <button
        className={`guide-btn ${guide ? "on" : ""}`}
        aria-label={guide ? "Stop the guide" : "Breathe with the guide"}
        aria-pressed={guide}
        onClick={() => {
          guideStart.current = performance.now();
          setGuide(!guide);
        }}
      />
      <p className="sr-status" role="status">
        {phase === "in"
          ? "Breathing in"
          : phase === "out"
            ? "Breathing out"
            : ""}
      </p>
    </div>
  );
}
