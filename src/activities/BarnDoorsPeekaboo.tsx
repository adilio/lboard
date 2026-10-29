import { useState } from "react";
import type { Preferences } from "../model";
import { animal, sfx } from "../audio";
import { Critter } from "../play/Critter";
import type { CritterKind } from "../play/Critter";
import { say } from "../play/speech";
import { shuffle, useSaved } from "../play/store";
// C1 Barn Doors Peekaboo: six barn doors and a hayloft window. Each hides
// an animal (shuffled every visit). Tap the little ear to hear who is
// inside and guess before opening: listening, predicting and naming.
// Tapping an animal again makes it do something different.
const animals: CritterKind[] = [
  "cow",
  "pig",
  "sheep",
  "horse",
  "duck",
  "chick",
  "dog",
  "cat",
  "rabbit",
  "mouse",
  "frog",
];
const actions = ["jump", "spin", "wiggle", "nod"];
const key = "Barn Doors Peekaboo";
export default function BarnDoorsPeekaboo({ prefs }: { prefs: Preferences }) {
  const [who] = useSaved(key + ":who", () => [
    ...shuffle(animals).slice(0, 6),
    "owl" as CritterKind,
  ]);
  const [open, setOpen] = useSaved<boolean[]>(key + ":open", () =>
    Array(7).fill(false),
  );
  const [act, setAct] = useState<Record<number, number>>({});
  const [listen, setListen] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  function toggle(i: number) {
    const was = open[i];
    setOpen((o) => o.map((v, j) => (j === i ? !v : v)));
    if (was) {
      sfx(prefs, "creak", 1.3);
      return;
    }
    sfx(prefs, "creak");
    setTimeout(() => animal(prefs, who[i]), 300);
    setTimeout(() => say(prefs, `${who[i]}!`, "word"), 1100);
    setMsg(`It's a ${who[i]}!`);
  }
  function poke(i: number) {
    setAct((a) => ({ ...a, [i]: (a[i] ?? 0) + 1 }));
    animal(prefs, who[i]);
    if ((act[i] ?? 0) % 2) sfx(prefs, "boing", 1.2);
  }
  return (
    <div className="act act-barn">
      <div className="barn">
        <div className="barn-roof" aria-hidden="true" />
        <div className="hayloft">
          <Door
            i={6}
            who={who[6]}
            open={open[6]}
            act={act[6] ?? 0}
            listening={listen === 6}
            onToggle={toggle}
            onPoke={poke}
          />
          <ListenButton
            i={6}
            onListen={(i) => {
              setListen(i);
              animal(prefs, who[i]);
              setTimeout(() => setListen(null), 900);
            }}
            disabled={open[6]}
          />
        </div>
        <div className="barn-body">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="stall">
              <Door
                i={i}
                who={who[i]}
                open={open[i]}
                act={act[i] ?? 0}
                listening={listen === i}
                onToggle={toggle}
                onPoke={poke}
              />
              <ListenButton
                i={i}
                disabled={open[i]}
                onListen={(n) => {
                  setListen(n);
                  animal(prefs, who[n]);
                  setMsg("Who could that be?");
                  setTimeout(() => setListen(null), 900);
                }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="hay-bales" aria-hidden="true">
        <i />
        <i />
      </div>
      <p className="sr-status" role="status">
        {msg}
      </p>
    </div>
  );
}
function ListenButton({
  i,
  onListen,
  disabled,
}: {
  i: number;
  onListen: (i: number) => void;
  disabled: boolean;
}) {
  return (
    <button
      className="ear-button"
      aria-label={`Listen at door ${i + 1}`}
      disabled={disabled}
      onClick={() => onListen(i)}
    >
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <path
          d="M14 30q-6-4-6-12a12 12 0 0 1 24 0q0 6-6 9-4 2-4 6a4 4 0 0 1-8 0"
          fill="#FFB38A"
          stroke="#C2483A"
          strokeWidth="3"
        />
        <path
          d="M16 18a5 5 0 0 1 10 0q0 4-4 5"
          fill="none"
          stroke="#C2483A"
          strokeWidth="3"
        />
      </svg>
    </button>
  );
}
function Door({
  i,
  who,
  open,
  act,
  listening,
  onToggle,
  onPoke,
}: {
  i: number;
  who: CritterKind;
  open: boolean;
  act: number;
  listening: boolean;
  onToggle: (i: number) => void;
  onPoke: (i: number) => void;
}) {
  return (
    <div
      className={`barn-door ${open ? "open" : ""} ${listening ? "listening" : ""}`}
    >
      <div className="stall-inside">
        {open && (
          <button
            className={`peek-animal do-${actions[act % actions.length]}`}
            key={act}
            aria-label={`Pet the ${who}`}
            onClick={() => onPoke(i)}
          >
            <Critter
              kind={who}
              mood={
                act % 3 === 1 ? "happy" : act % 3 === 2 ? "surprised" : "happy"
              }
            />
          </button>
        )}
      </div>
      <button
        className="door-swing"
        data-hint={i === 0 ? true : undefined}
        aria-label={`Barn door ${i + 1}${open ? ", open: close it" : ""}`}
        onClick={() => onToggle(i)}
      >
        <span className="plank-x" />
      </button>
    </div>
  );
}
