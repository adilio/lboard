import { useEffect, useRef, useState } from "react";
import type { Preferences } from "../model";
import { pentatonic, sfx, tone } from "../audio";
import { Critter } from "../play/Critter";
import type { CritterKind } from "../play/Critter";
import { Thing } from "../play/Things";
import type { ThingKind } from "../play/Things";
import { say } from "../play/speech";
import { shuffle, useSaved } from "../play/store";
// H5 Letter Friends: letter characters in an early-reader typeface (Andika,
// single-storey "a"). Tap a letter to hear it and see a word that starts
// with it act itself out. "My name" builds her name: the letters sit in a
// jumble and she taps the next one; after a pause the right one glows.
// Family names added by a grown-up appear as more name cards.
const words: Record<
  string,
  { word: string; critter?: CritterKind; thing?: ThingKind; move: string }
> = {
  A: { word: "apple", thing: "apple", move: "bounce" },
  B: { word: "ball", thing: "ball", move: "bounce" },
  C: { word: "cat", critter: "cat", move: "wiggle" },
  D: { word: "dog", critter: "dog", move: "jump" },
  E: { word: "egg", thing: "egg", move: "wobble" },
  F: { word: "fish", thing: "fish", move: "swim" },
  G: { word: "gift", thing: "gift", move: "jump" },
  H: { word: "horse", critter: "horse", move: "jump" },
  I: { word: "ice cream", thing: "icecream", move: "wobble" },
  J: { word: "jam", thing: "jam", move: "bounce" },
  K: { word: "kite", thing: "kite", move: "fly" },
  L: { word: "leaf", thing: "leaf", move: "float" },
  M: { word: "mouse", critter: "mouse", move: "wiggle" },
  N: { word: "note", thing: "note", move: "float" },
  O: { word: "owl", critter: "owl", move: "spin" },
  P: { word: "pig", critter: "pig", move: "jump" },
  Q: { word: "queen's crown", thing: "crown", move: "spin" },
  R: { word: "rainbow", thing: "rainbow", move: "grow" },
  S: { word: "star", thing: "star", move: "spin" },
  T: { word: "teddy", critter: "teddy", move: "wiggle" },
  U: { word: "umbrella", thing: "umbrella", move: "float" },
  V: { word: "van", thing: "car", move: "drive" },
  W: { word: "water", thing: "water", move: "wobble" },
  X: { word: "xylophone", thing: "xylophone", move: "bounce" },
  Y: { word: "yo-yo", thing: "yoyo", move: "yoyo" },
  Z: { word: "zebra", thing: "zebra", move: "jump" },
};
const letters = Object.keys(words);
const colours = [
  "#FF7A6B",
  "#FF9F3A",
  "#FFC94A",
  "#6CC07A",
  "#5FD3B5",
  "#3BA7E0",
  "#8C6BE0",
  "#E05A8C",
];
const colourOf = (l: string) =>
  colours[letters.indexOf(l.toUpperCase()) % colours.length];
const key = "Letter Friends";
export default function LetterFriends({ prefs }: { prefs: Preferences }) {
  const names = [prefs.childName, ...prefs.familyNames].filter(Boolean);
  const [mode, setMode] = useSaved<"abc" | number>(key + ":mode", () => 0);
  const [shown, setShown] = useState<{ l: string; n: number } | null>(null);
  return (
    <div className="act act-letters">
      <div className="letter-modes" role="group" aria-label="Letter games">
        {names.map((n, i) => (
          <button
            key={n + i}
            className="mode-card name-card"
            aria-pressed={mode === i}
            aria-label={`Spell ${n}`}
            onClick={() => setMode(i)}
          >
            {n}
          </button>
        ))}
        <button
          className="mode-card abc-card"
          aria-pressed={mode === "abc"}
          aria-label="All the letters"
          onClick={() => setMode("abc")}
        >
          a b c
        </button>
      </div>
      {mode === "abc" ? (
        <>
          <div className="word-stage" aria-live="polite">
            {shown && (
              <div
                className={`word-show move-${words[shown.l].move}`}
                key={shown.n}
              >
                <span className="word-pic">
                  {words[shown.l].critter ? (
                    <Critter kind={words[shown.l].critter!} mood="happy" />
                  ) : (
                    <Thing kind={words[shown.l].thing!} />
                  )}
                </span>
                <span className="word-text">
                  <b style={{ color: colourOf(shown.l) }}>
                    {words[shown.l].word[0]}
                  </b>
                  {words[shown.l].word.slice(1)}
                </span>
              </div>
            )}
          </div>
          <div className="alphabet">
            {letters.map((l, i) => (
              <button
                key={l}
                className="letter-friend"
                data-hint={i === 0 ? true : undefined}
                style={{ "--c": colourOf(l) } as React.CSSProperties}
                aria-label={`Letter ${l}`}
                onClick={() => {
                  setShown({ l, n: Date.now() });
                  tone(prefs, pentatonic[i % 8], "sine", 0.3);
                  say(prefs, `${l}. ${l} is for ${words[l].word}.`, "word");
                }}
              >
                <span className="lf-face" key={shown?.l === l ? shown.n : 0}>
                  <span className="glyph">{l.toLowerCase()}</span>
                  <i className="lf-eyes" />
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <NameBuilder
          prefs={prefs}
          name={names[Math.min(mode, names.length - 1)] ?? "Layla"}
          key={String(mode)}
        />
      )}
    </div>
  );
}
function NameBuilder({ prefs, name }: { prefs: Preferences; name: string }) {
  const target = name.toUpperCase().split("");
  // A jumble that never stacks letters on top of each other: each letter
  // gets its own cell of a grid, with a little wobble inside the cell.
  const make = () => {
    const cols = Math.min(innerWidth < 640 ? 3 : 5, target.length);
    const rows = Math.ceil(target.length / cols) + 1;
    const cells = shuffle(Array.from({ length: cols * rows }, (_, c) => c));
    return target.map((l, i) => {
      const c = cells[i];
      return {
        l,
        i,
        x: 4 + ((c % cols) + 0.15 + Math.random() * 0.25) * (80 / cols),
        y: 4 + (Math.floor(c / cols) + Math.random() * 0.2) * (88 / rows),
        r: (Math.random() - 0.5) * 24,
      };
    });
  };
  const [pile, setPile] = useState(make);
  const [done, setDone] = useState<number[]>([]);
  const [shake, setShake] = useState<number | null>(null);
  const [hint, setHint] = useState(false);
  const [cheer, setCheer] = useState(0);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const complete = done.length === target.length;
  useEffect(() => {
    if (idle.current) clearTimeout(idle.current);
    setHint(false);
    if (!complete) idle.current = setTimeout(() => setHint(true), 5000);
    return () => {
      if (idle.current) clearTimeout(idle.current);
    };
  }, [done, complete]);
  function tap(i: number) {
    const nextIndex = done.length;
    if (
      pile[i].i === nextIndex ||
      (pile[i].l === target[nextIndex] && !done.includes(pile[i].i))
    ) {
      const real = pile[i].l === target[nextIndex] ? nextIndex : pile[i].i;
      // Same letter twice (like the two A's in Layla): either one is right.
      setPile((p) =>
        p.map((x, j) =>
          j === i
            ? { ...x, i: real }
            : x.i === real
              ? { ...x, i: pile[i].i }
              : x,
        ),
      );
      const d = [...done, real];
      setDone(d);
      tone(prefs, pentatonic[Math.min(12, 4 + d.length)], "sine", 0.4);
      say(prefs, pile[i].l, "word", { rate: 0.9 });
      if (d.length === target.length) {
        setTimeout(() => {
          setCheer((c) => c + 1);
          sfx(prefs, "tada");
          say(prefs, `${name}!`, "word", { pitch: 1.3 });
        }, 600);
      }
    } else {
      setShake(i);
      sfx(prefs, "boing", 1.4);
      setTimeout(() => setShake(null), 500);
    }
  }
  return (
    <div className={`name-builder ${complete ? "complete" : ""}`} key={cheer}>
      <div
        className="name-slots"
        aria-label={`${name}: ${done.length} of ${target.length} letters`}
      >
        {target.map((l, k) => {
          const placed = done.includes(k);
          return (
            <span
              key={k}
              className={`name-slot ${placed ? "filled" : ""}`}
              style={{ "--c": colourOf(l), "--k": k } as React.CSSProperties}
            >
              {placed ? (
                <span className="lf-face">
                  <span className="glyph">{k === 0 ? l : l.toLowerCase()}</span>
                  <i className="lf-eyes" />
                </span>
              ) : (
                <span className="ghost-glyph">
                  {k === 0 ? l : l.toLowerCase()}
                </span>
              )}
            </span>
          );
        })}
      </div>
      <div className="letter-pile">
        {pile.map((p, j) =>
          done.includes(p.i) ? null : (
            <button
              key={j}
              className={`letter-friend loose ${shake === j ? "shake" : ""} ${hint && p.l === target[done.length] ? "hint" : ""}`}
              style={
                {
                  "--c": colourOf(p.l),
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  rotate: `${p.r}deg`,
                } as React.CSSProperties
              }
              aria-label={`Letter ${p.l}`}
              data-hint={p.l === target[done.length] ? true : undefined}
              onClick={() => tap(j)}
            >
              <span className="lf-face">
                <span className="glyph">
                  {p.i === 0 ? p.l : p.l.toLowerCase()}
                </span>
                <i className="lf-eyes" />
              </span>
            </button>
          ),
        )}
      </div>
      {complete && (
        <button
          className="again-btn"
          aria-label="Spell it again"
          onClick={() => {
            setPile(make());
            setDone([]);
            sfx(prefs, "whoosh");
          }}
        />
      )}
    </div>
  );
}
