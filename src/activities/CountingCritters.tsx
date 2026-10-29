import { useEffect, useRef, useState } from "react";
import type { Preferences } from "../model";
import { pentatonic, sfx, tone } from "../audio";
import { Thing } from "../play/Things";
import type { ThingKind } from "../play/Things";
import { say } from "../play/speech";
import { useSaved } from "../play/store";
// H1 Counting Critters: tap each critter to count it; it hops into the jar
// and the number is said aloud, so nothing is counted twice (one-to-one
// correspondence). When all are counted the number appears big and the
// critters dance. Difficulty grows quietly: 1–5 at first, up to 10 when
// she counts several rounds quickly.
const scenes: { id: string; critter: ThingKind; plural: string; bg: string }[] =
  [
    { id: "leaf", critter: "ladybug", plural: "ladybugs", bg: "leaf" },
    { id: "pond", critter: "fish", plural: "fish", bg: "pond" },
    { id: "night", critter: "firefly", plural: "fireflies", bg: "night" },
    { id: "beach", critter: "starfish", plural: "starfish", bg: "beach" },
  ];
const words = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
];
function layout(n: number) {
  // Spread critters on a jittered grid so none overlap.
  const cells = Array.from({ length: 12 }, (_, i) => i).sort(
    () => Math.random() - 0.5,
  );
  return cells.slice(0, n).map((c) => ({
    x: 12 + (c % 4) * 23 + Math.random() * 8,
    y: 14 + Math.floor(c / 4) * 28 + Math.random() * 10,
    r: (Math.random() - 0.5) * 40,
  }));
}
const key = "Counting Critters";
export default function CountingCritters({ prefs }: { prefs: Preferences }) {
  const [max, setMax] = useSaved(key + ":max", () => 5);
  const [fast, setFast] = useSaved(key + ":fast", () => 0);
  const [round, setRound] = useState(() => {
    const n = 1 + Math.floor(Math.random() * 5);
    return {
      scene: Math.floor(Math.random() * scenes.length),
      n,
      spots: layout(n),
      started: Date.now(),
    };
  });
  const [counted, setCounted] = useState<number[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const scene = scenes[round.scene];
  const done = counted.length === round.n;
  function count(i: number) {
    if (counted.includes(i)) return;
    const c = counted.length + 1;
    setCounted((list) => [...list, i]);
    tone(prefs, pentatonic[Math.min(12, c + 1)], "sine", 0.5);
    say(prefs, words[c], "word");
    if (c === round.n) {
      const quick = (Date.now() - round.started) / round.n < 1600;
      const f = quick ? fast + 1 : 0;
      setFast(f);
      if (f >= 2 && max < 10) {
        setMax(max + 1);
        setFast(0);
      }
      timers.current.push(
        setTimeout(() => {
          sfx(prefs, "tada");
          say(
            prefs,
            `${words[c]} ${c === 1 ? scene.critter : scene.plural}!`,
            "word",
          );
        }, 700),
      );
    }
  }
  function next() {
    const n = 1 + Math.floor(Math.random() * max);
    setRound((r) => ({
      scene: (r.scene + 1) % scenes.length,
      n,
      spots: layout(n),
      started: Date.now(),
    }));
    setCounted([]);
    sfx(prefs, "whoosh", 0.9);
  }
  return (
    <div className={`act act-count scene-${scene.bg}`}>
      <div className="count-scene">
        {round.spots.map((s, i) =>
          counted.includes(i) ? (
            <span
              key={`${round.started}-${i}`}
              className="critter-gone"
              style={{ left: `${s.x}%`, top: `${s.y}%` }}
              aria-hidden="true"
            >
              <Thing kind={scene.critter} />
            </span>
          ) : (
            <button
              key={`${round.started}-${i}`}
              className="count-critter"
              data-hint={i === 0 ? true : undefined}
              style={
                {
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  "--r": `${s.r}deg`,
                } as React.CSSProperties
              }
              aria-label={`Count the ${scene.critter}`}
              onClick={() => count(i)}
            >
              <Thing kind={scene.critter} />
            </button>
          ),
        )}
        {done && (
          <span className="big-number" key={round.started} aria-hidden="true">
            {round.n}
          </span>
        )}
      </div>
      <div className={`count-jar ${done ? "dance" : ""}`}>
        <div className="jar-inside">
          {counted.map((i, k) => (
            <span
              key={i}
              className="in-jar"
              style={{ "--k": k } as React.CSSProperties}
            >
              <Thing kind={scene.critter} />
              <b>{k + 1}</b>
            </span>
          ))}
        </div>
        <span className="jar-count" aria-hidden="true">
          {counted.length}
        </span>
      </div>
      <button
        className={`more-btn more-${scenes[(round.scene + 1) % scenes.length].bg} ${done ? "ready" : ""}`}
        aria-label="More critters"
        onClick={next}
      >
        <Thing kind={scenes[(round.scene + 1) % scenes.length].critter} />
      </button>
      <p className="sr-status" role="status">
        {done
          ? `${round.n} ${round.n === 1 ? scene.critter : scene.plural}!`
          : `${counted.length} counted`}
      </p>
    </div>
  );
}
