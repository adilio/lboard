import { useRef, useState } from "react";
import type { Preferences } from "../model";
import { animal, sfx } from "../audio";
import { Critter } from "../play/Critter";
import type { CritterKind, Mood } from "../play/Critter";
import { Thing } from "../play/Things";
import type { ThingKind } from "../play/Things";
import { usePicker } from "../play/picker";
import { say } from "../play/speech";
// C2 Feed the Friends: four animals and a basket of food. Favourites earn a
// happy dance; anything else gets a funny "not for me" face and goes back
// in the basket. Testing every food on every animal is the point: it is
// categorising (who eats what) with jokes. Three snacks and a friend naps.
const friends: { kind: CritterKind; likes: ThingKind[] }[] = [
  { kind: "rabbit", likes: ["carrot", "lettuce"] },
  { kind: "dog", likes: ["bone", "cheese"] },
  { kind: "bird", likes: ["seeds", "berries"] },
  { kind: "horse", likes: ["apple", "hay"] },
];
const foods: ThingKind[] = [
  "carrot",
  "bone",
  "seeds",
  "apple",
  "lettuce",
  "cheese",
  "berries",
  "hay",
  "banana",
  "fish",
];
export default function FeedTheFriends({ prefs }: { prefs: Preferences }) {
  const [mood, setMood] = useState<Record<string, Mood>>({});
  const [eaten, setEaten] = useState<Record<string, number>>({});
  const [anim, setAnim] = useState<Record<string, { n: number; kind: string }>>(
    {},
  );
  const [msg, setMsg] = useState("");
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>[]>>({});
  const later = (who: string, ms: number, fn: () => void) => {
    (timers.current[who] ??= []).push(setTimeout(fn, ms));
  };
  const picker = usePicker(
    (food, who) => feed(who as CritterKind, food as ThingKind),
    () => {
      // Everyone opens up in anticipation when food is picked up.
      setMood((m) => {
        const n = { ...m };
        for (const f of friends) if (n[f.kind] !== "sleep") n[f.kind] = "yum";
        return n;
      });
    },
  );
  function feed(who: CritterKind, food: ThingKind) {
    const f = friends.find((x) => x.kind === who)!;
    if (mood[who] === "sleep") {
      sfx(prefs, "snore");
      setMsg(`Shh, the ${who} is napping.`);
      return;
    }
    (timers.current[who] ?? []).forEach(clearTimeout);
    timers.current[who] = [];
    const yes = f.likes.includes(food);
    setMood((m) => {
      const n = { ...m };
      for (const x of friends) if (n[x.kind] === "yum") n[x.kind] = "neutral";
      n[who] = yes ? "chew" : "bleh";
      return n;
    });
    setAnim((a) => ({
      ...a,
      [who]: { n: (a[who]?.n ?? 0) + 1, kind: yes ? "dance" : "shake" },
    }));
    if (yes) {
      sfx(prefs, "munch");
      later(who, 700, () => {
        animal(prefs, who);
        setMood((m) => ({ ...m, [who]: "happy" }));
      });
      setMsg(`The ${who} loves the ${food}!`);
      say(prefs, `Yum! ${food}!`, "prompt");
      const count = (eaten[who] ?? 0) + 1;
      setEaten((e) => ({ ...e, [who]: count }));
      if (count >= 3) {
        later(who, 1800, () => {
          setMood((m) => ({ ...m, [who]: "sleep" }));
          sfx(prefs, "snore");
          setMsg(`The ${who} is full and takes a little nap.`);
        });
        later(who, 9000, () => {
          setMood((m) => ({ ...m, [who]: "happy" }));
          setEaten((e) => ({ ...e, [who]: 0 }));
          animal(prefs, who);
        });
      } else
        later(who, 2600, () => setMood((m) => ({ ...m, [who]: "neutral" })));
    } else {
      sfx(prefs, "bleh");
      setMsg(`Not for me! The ${who} gives back the ${food}.`);
      say(prefs, "Bleh! Not for me!", "prompt");
      later(who, 1800, () => setMood((m) => ({ ...m, [who]: "neutral" })));
    }
  }
  return (
    <div className="act act-feed">
      <div className="fence" aria-hidden="true" />
      <div className="friend-line">
        {friends.map((f) => (
          <button
            key={f.kind}
            className={`hungry-friend ${anim[f.kind]?.kind ?? ""}`}
            aria-label={`Feed the ${f.kind}`}
            {...picker.zone(f.kind)}
            onClick={(e) => {
              if (picker.held) picker.zone(f.kind).onClick(e);
              else {
                animal(prefs, f.kind);
                setAnim((a) => ({
                  ...a,
                  [f.kind]: { n: (a[f.kind]?.n ?? 0) + 1, kind: "dance" },
                }));
              }
            }}
          >
            <span className="friend-body" key={anim[f.kind]?.n ?? 0}>
              <Critter kind={f.kind} mood={mood[f.kind] ?? "neutral"} />
            </span>
            <span className="tummy" aria-hidden="true">
              {Array.from(
                { length: Math.min(3, eaten[f.kind] ?? 0) },
                (_, i) => (
                  <i key={i} />
                ),
              )}
            </span>
          </button>
        ))}
      </div>
      <div className="basket">
        {foods.map((food, i) => (
          <button
            key={food}
            className="food-item"
            data-hint={i === 0 ? true : undefined}
            aria-label={food[0].toUpperCase() + food.slice(1)}
            {...picker.item(food)}
          >
            <Thing kind={food} />
          </button>
        ))}
      </div>
      <p className="sr-status" role="status">
        {msg}
      </p>
    </div>
  );
}
