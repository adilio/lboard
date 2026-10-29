import { useState } from "react";
import type { Preferences } from "../model";
import { sfx } from "../audio";
import { Critter } from "../play/Critter";
import type { Mood } from "../play/Critter";
import { Thing } from "../play/Things";
import type { ThingKind } from "../play/Things";
import { usePicker } from "../play/picker";
import { say } from "../play/speech";
import { useSaved } from "../play/store";
// E2 Sink or Float Tub: pick something from the shelf and it hovers over
// the water while two picture buttons ask "float or sink?". Guessing is
// optional; tapping the water just drops it. A wrong guess earns a
// delighted "Oh, surprise!" from the duck, never a buzzer. The board keeps
// pictures of what floated and what sank: predict, test, record.
const objects: { kind: ThingKind; name: string; floats: boolean }[] = [
  { kind: "apple", name: "apple", floats: true },
  { kind: "rock", name: "rock", floats: false },
  { kind: "rubberduck", name: "rubber duck", floats: true },
  { kind: "key", name: "key", floats: false },
  { kind: "leaf", name: "leaf", floats: true },
  { kind: "coin", name: "coin", floats: false },
  { kind: "sponge", name: "sponge", floats: true },
  { kind: "boat", name: "toy boat", floats: true },
  { kind: "spoon", name: "spoon", floats: false },
  { kind: "cork", name: "cork", floats: true },
];
const key = "Sink or Float Tub";
export default function SinkOrFloatTub({ prefs }: { prefs: Preferences }) {
  const [inTub, setInTub] = useSaved<
    { kind: ThingKind; x: number; n: number }[]
  >(key + ":tub", () => []);
  const [board, setBoard] = useSaved<ThingKind[]>(key + ":board", () => []);
  const [duck, setDuck] = useState<{ mood: Mood; n: number }>({
    mood: "neutral",
    n: 0,
  });
  const [msg, setMsg] = useState("");
  const picker = usePicker((item, target) => {
    if (target === "water") drop(item as ThingKind, null);
  });
  const held = picker.held as ThingKind | null;
  function drop(kind: ThingKind, guess: boolean | null) {
    picker.setHeld(null);
    const o = objects.find((x) => x.kind === kind)!;
    const used = inTub.map((t) => t.x);
    const slots = [12, 30, 48, 66, 84, 21, 39, 57, 75, 90];
    const x = slots.find((s) => !used.includes(s)) ?? 50;
    setInTub((t) => [
      ...t.filter((i) => i.kind !== kind),
      { kind, x, n: Date.now() },
    ]);
    setBoard((b) => (b.includes(kind) ? b : [...b, kind]));
    sfx(
      prefs,
      "splash",
      ["rock", "coin", "key", "spoon"].includes(kind) ? 1.2 : 0.8,
    );
    if (!o.floats) setTimeout(() => sfx(prefs, "bubbles"), 500);
    const result = o.floats ? "floats" : "sinks";
    if (guess === null) {
      setMsg(`The ${o.name} ${result}.`);
      setTimeout(() => say(prefs, `It ${result}!`, "prompt"), 700);
      return;
    }
    const right = guess === o.floats;
    setTimeout(() => {
      setDuck((d) => ({ mood: right ? "happy" : "surprised", n: d.n + 1 }));
      if (right) {
        sfx(prefs, "sparkle");
        say(prefs, `It ${result}! You guessed it!`, "prompt");
        setMsg(`The ${o.name} ${result}. You guessed it!`);
      } else {
        sfx(prefs, "boing");
        say(prefs, `Oh, surprise! It ${result}!`, "prompt");
        setMsg(`Oh, surprise! The ${o.name} ${result}.`);
      }
    }, 1100);
  }
  const shelfItems = objects.filter(
    (o) => !inTub.some((t) => t.kind === o.kind),
  );
  return (
    <div className="act act-tub">
      <div className="tub-shelf">
        {shelfItems.map((o, i) => (
          <button
            key={o.kind}
            className="tub-object"
            data-hint={i === 0 ? true : undefined}
            aria-label={o.name[0].toUpperCase() + o.name.slice(1)}
            {...picker.item(o.kind)}
          >
            <Thing kind={o.kind} />
          </button>
        ))}
      </div>
      <div className="tub-area">
        <button
          className="tub"
          aria-label={held ? "Drop it in the water" : "The water"}
          {...picker.zone("water")}
        >
          <span className="water" />
          <span className="shimmer" />
          {inTub.map((t) => {
            const o = objects.find((x) => x.kind === t.kind)!;
            return (
              <span
                key={t.kind + t.n}
                className={`in-water ${o.floats ? "floating" : "sinking"}`}
                style={{ left: `${t.x}%` }}
              >
                <Thing kind={t.kind} />
                {!o.floats && (
                  <span className="bubble-trail" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                )}
              </span>
            );
          })}
        </button>
        {held && (
          <div className="hover-guess" key={held}>
            <span className="hover-object">
              <Thing kind={held} />
            </span>
            <div className="guess-buttons">
              <button
                className="guess guess-float"
                aria-label="I think it floats"
                onClick={() => drop(held, true)}
              >
                <svg viewBox="0 0 100 100" aria-hidden="true">
                  <rect y="58" width="100" height="42" rx="8" fill="#7CC8F2" />
                  <path
                    d="M0 60q12-8 25 0t25 0 25 0 25 0"
                    stroke="#3BA7E0"
                    strokeWidth="5"
                    fill="none"
                  />
                  <path d="M30 56q0 -24 22-22 18 0 16 18z" fill="#FFD54A" />
                  <path d="M66 40q12-2 14 6l-12 2z" fill="#FF9F3A" />
                  <path
                    d="M50 14v14M42 22l8-8 8 8"
                    stroke="#2E2A3B"
                    strokeWidth="5"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <button
                className="guess guess-sink"
                aria-label="I think it sinks"
                onClick={() => drop(held, false)}
              >
                <svg viewBox="0 0 100 100" aria-hidden="true">
                  <rect y="20" width="100" height="80" rx="8" fill="#7CC8F2" />
                  <path
                    d="M24 92q-2-16 14-20 10-10 24-4 16 4 14 20z"
                    fill="#8A93A6"
                  />
                  <path
                    d="M50 30v24M42 46l8 8 8-8"
                    stroke="#2E2A3B"
                    strokeWidth="5"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
        <span
          className={`tub-duck d-${duck.mood}`}
          key={duck.n}
          aria-hidden="true"
        >
          <Critter kind="duck" mood={duck.mood} />
        </span>
      </div>
      <div className="guess-board" aria-label="What happened">
        <div className="col col-float">
          <span className="col-head head-float" aria-label="Floats" />
          {board
            .filter((k) => objects.find((o) => o.kind === k)!.floats)
            .map((k) => (
              <Thing key={k} kind={k} />
            ))}
        </div>
        <div className="col col-sink">
          <span className="col-head head-sink" aria-label="Sinks" />
          {board
            .filter((k) => !objects.find((o) => o.kind === k)!.floats)
            .map((k) => (
              <Thing key={k} kind={k} />
            ))}
        </div>
      </div>
      <button
        className="empty-tub"
        aria-label="Take everything out"
        disabled={!inTub.length}
        onClick={() => {
          setInTub([]);
          sfx(prefs, "splash", 1.4);
        }}
      />
      <p className="sr-status" role="status">
        {msg}
      </p>
    </div>
  );
}
