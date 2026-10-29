import { useState } from "react";
import type { Preferences } from "../model";
import { animal, chime, drum, pentatonic, sfx, tone } from "../audio";
import { Critter } from "../play/Critter";
import type { CritterKind } from "../play/Critter";
import { Thing } from "../play/Things";
import type { ThingKind } from "../play/Things";
import { say } from "../play/speech";
import { shuffle, useSaved } from "../play/store";
// A2 Door and Latch Panel: six little doors, each closed a different way.
// Undo the latch, then open the door (two steps); the magnet and push
// doors open in one. Behind each door is a surprise from a rotating pool,
// so reopening is worth it.
type Mech = "bolt" | "hook" | "turn" | "magnet" | "push" | "hatch";
const doors: { mech: Mech; label: string; colour: string }[] = [
  { mech: "bolt", label: "Slide the bolt", colour: "#FF7A6B" },
  { mech: "hook", label: "Lift the hook", colour: "#3BA7E0" },
  { mech: "turn", label: "Turn the latch", colour: "#6CC07A" },
  { mech: "magnet", label: "", colour: "#8C6BE0" },
  { mech: "push", label: "", colour: "#FFC94A" },
  { mech: "hatch", label: "Pull the catch", colour: "#E05A8C" },
];
type Surprise = { critter?: CritterKind; thing?: ThingKind; name: string };
const pool: Surprise[] = [
  ...(
    [
      "cat",
      "dog",
      "rabbit",
      "duck",
      "chick",
      "frog",
      "owl",
      "mouse",
      "pig",
      "sheep",
      "cow",
      "bear",
      "dragon",
      "robot",
      "bird",
      "horse",
      "teddy",
    ] as CritterKind[]
  ).map((c) => ({ critter: c, name: c })),
  ...(
    [
      "ball",
      "bell",
      "star",
      "rainbow",
      "musicbox",
      "balloon",
      "car",
      "clock",
      "rubberduck",
      "hello",
    ] as ThingKind[]
  ).map((t) => ({
    thing: t,
    name:
      t === "rubberduck" ? "rubber duck" : t === "musicbox" ? "music box" : t,
  })),
];
const key = "Door and Latch Panel";
export default function DoorAndLatchPanel({ prefs }: { prefs: Preferences }) {
  const [order] = useSaved(key + ":order", () =>
    shuffle(pool.map((_, i) => i)),
  );
  const [state, setState] = useSaved(key + ":doors", () =>
    doors.map((d) => ({
      locked: d.mech !== "magnet" && d.mech !== "push",
      open: false,
      surprise: -1,
    })),
  );
  const [next, setNext] = useSaved(key + ":next", () => 0);
  const [rattle, setRattle] = useState<number | null>(null);
  const [action, setAction] = useState<Record<number, number>>({});
  const [msg, setMsg] = useState("");
  const update = (i: number, part: Partial<(typeof state)[0]>) =>
    setState((s) => s.map((d, j) => (j === i ? { ...d, ...part } : d)));
  function surpriseSound(s: Surprise) {
    if (s.critter) return animal(prefs, s.critter);
    const t = s.thing!;
    const sounds: Partial<Record<ThingKind, () => void>> = {
      ball: () => sfx(prefs, "boing"),
      bell: () =>
        [0, 1, 2].forEach((i) =>
          setTimeout(() => chime(prefs, pentatonic[7 + i]), i * 120),
        ),
      star: () => sfx(prefs, "sparkle"),
      rainbow: () => sfx(prefs, "tada"),
      musicbox: () =>
        [7, 9, 8, 6, 7].forEach((n, i) =>
          setTimeout(() => tone(prefs, pentatonic[n], "sine", 0.4), i * 220),
        ),
      balloon: () => sfx(prefs, "squeak", 0.6),
      car: () => sfx(prefs, "whoosh", 1.3),
      clock: () =>
        [0, 1, 2, 3].forEach((i) =>
          setTimeout(() => sfx(prefs, "tick"), i * 300),
        ),
      rubberduck: () => sfx(prefs, "squeak"),
      hello: () => {
        say(prefs, "Hello!", "prompt");
        setTimeout(
          () =>
            say(prefs, "hello", "prompt", { queue: true, pitch: 1.6, rate: 1 }),
          50,
        );
      },
    };
    (sounds[t] ?? (() => drum(prefs, 150)))();
  }
  function openDoor(i: number) {
    const d = state[i];
    if (d.open) {
      update(i, { open: false });
      sfx(prefs, "creak", 1.2);
      setMsg("");
      return;
    }
    if (d.locked) {
      setRattle(i);
      sfx(prefs, "clink", 0.7);
      setTimeout(() => setRattle(null), 450);
      setMsg("The door is latched. Try the latch first.");
      return;
    }
    const s = order[next % order.length];
    setNext((n) => n + 1);
    update(i, { open: true, surprise: s });
    sfx(prefs, doors[i].mech === "magnet" ? "thunk" : "creak");
    setTimeout(() => surpriseSound(pool[s]), 260);
    if (pool[s].critter || pool[s].thing !== "hello")
      setTimeout(() => say(prefs, pool[s].name, "word"), 900);
    setMsg(`Peekaboo! A ${pool[s].name}.`);
  }
  function latch(i: number) {
    const d = state[i];
    if (d.open) return;
    update(i, { locked: !d.locked });
    const m = doors[i].mech;
    if (m === "bolt") sfx(prefs, "zip", 0.8);
    else sfx(prefs, "clink", d.locked ? 1.1 : 0.9);
  }
  return (
    <div className="act act-latches">
      <div className="latch-board">
        {doors.map((door, i) => {
          const d = state[i];
          const s = d.surprise >= 0 ? pool[d.surprise] : null;
          return (
            <div
              key={i}
              className={`latch-cell mech-${door.mech} ${d.open ? "open" : ""} ${d.locked ? "locked" : "unlocked"} ${rattle === i ? "rattle" : ""}`}
              style={{ "--door": door.colour } as React.CSSProperties}
            >
              <div className="cubby">
                {s && d.open && (
                  <button
                    className={`surprise act-${(action[i] ?? 0) % 4}`}
                    key={`${d.surprise}-${action[i] ?? 0}`}
                    aria-label={`Play with the ${s.name}`}
                    onClick={() => {
                      setAction((a) => ({ ...a, [i]: (a[i] ?? 0) + 1 }));
                      surpriseSound(s);
                    }}
                  >
                    {s.critter ? (
                      <Critter
                        kind={s.critter}
                        mood={(action[i] ?? 0) % 2 ? "happy" : "surprised"}
                      />
                    ) : (
                      <Thing kind={s.thing!} />
                    )}
                  </button>
                )}
              </div>
              <button
                className="door-leaf"
                data-hint={i === 0 ? true : undefined}
                aria-label={`Door ${i + 1}${d.open ? ", open: close it" : d.locked ? ", latched" : ""}`}
                onClick={() => openDoor(i)}
              >
                <span className="door-panel" />
                <span className="door-knob" />
                <span className="hinge h1" />
                <span className="hinge h2" />
                {door.mech === "magnet" && (
                  <span className="magnet" aria-hidden="true" />
                )}
                {door.mech === "push" && (
                  <span className="push-dot" aria-hidden="true" />
                )}
              </button>
              {door.label && (
                <button
                  className={`mechanism mech-${door.mech}-btn ${d.locked ? "" : "undone"}`}
                  aria-label={`${door.label}, ${d.locked ? "latched" : "unlatched"}`}
                  aria-pressed={!d.locked}
                  disabled={d.open}
                  onClick={() => latch(i)}
                >
                  <span className="mech-part" />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="sr-status" role="status">
        {msg}
      </p>
    </div>
  );
}
