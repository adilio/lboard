import { useState } from "react";
import type { Preferences } from "../model";
import { animal, sfx } from "../audio";
import { Critter } from "../play/Critter";
import type { CritterKind, Mood } from "../play/Critter";
import { Thing } from "../play/Things";
import { usePicker } from "../play/picker";
import { say } from "../play/speech";
import { useSaved } from "../play/store";
// G1 Little Kitchen: take food from the fridge, chop it on the board, cook
// it in the pot, bake it in the oven or whizz it in the blender, then serve
// it to a hungry friend. Each friend has tastes, and silly combinations get
// silly reactions (fish smoothie!). Sequencing (wash, chop, cook), food
// words and pretend caring. Nothing ever burns.
type Food =
  | "tomato"
  | "carrot"
  | "banana"
  | "strawberry"
  | "broccoli"
  | "cheese"
  | "egg"
  | "bread"
  | "fish"
  | "apple"
  | "mushroom"
  | "lettuce";
const foods: Food[] = [
  "tomato",
  "carrot",
  "banana",
  "strawberry",
  "broccoli",
  "cheese",
  "egg",
  "bread",
  "fish",
  "apple",
  "mushroom",
  "lettuce",
];
const foodColour: Record<Food, [number, number, number]> = {
  tomato: [232, 68, 58],
  carrot: [255, 159, 58],
  banana: [255, 224, 102],
  strawberry: [232, 68, 90],
  broccoli: [79, 180, 94],
  cheese: [255, 201, 74],
  egg: [255, 236, 170],
  bread: [224, 176, 122],
  fish: [255, 159, 90],
  apple: [232, 96, 79],
  mushroom: [201, 162, 122],
  lettuce: [143, 209, 138],
};
type Station = "board" | "pot" | "oven" | "blender" | "plate";
type Item = {
  id: number;
  food: Food | "smoothie";
  cut: 0 | 1 | 2;
  cooked: boolean;
  baked: boolean;
  at: Station;
  rgb?: [number, number, number];
  parts?: Food[];
};
const limits: Record<Station, number> = {
  board: 4,
  pot: 6,
  oven: 4,
  blender: 5,
  plate: 6,
};
const friends: { kind: CritterKind; loves: Food[]; dislikes: Food[] }[] = [
  {
    kind: "bear",
    loves: ["fish", "strawberry", "banana", "bread"],
    dislikes: ["broccoli", "mushroom"],
  },
  {
    kind: "cat",
    loves: ["fish", "cheese", "egg"],
    dislikes: ["banana", "lettuce"],
  },
  {
    kind: "dragon",
    loves: ["tomato", "mushroom", "bread"],
    dislikes: ["strawberry"],
  },
  { kind: "robot", loves: [], dislikes: [] },
];
function FoodArt({ food }: { food: Food }) {
  switch (food) {
    case "carrot":
    case "banana":
    case "cheese":
    case "fish":
    case "apple":
    case "lettuce":
      return <Thing kind={food} />;
  }
  let d: React.ReactNode;
  switch (food) {
    case "tomato":
      d = (
        <>
          <circle cx="50" cy="56" r="32" fill="#E8443A" />
          <path d="M36 28l14 8 14-8-6 12 10 2-18 2-18-2 10-2z" fill="#4FB45E" />
          <ellipse cx="38" cy="48" rx="6" ry="9" fill="#fff" opacity=".4" />
        </>
      );
      break;
    case "strawberry":
      d = (
        <>
          <path d="M20 40q30-12 60 0-6 44-30 50-24-6-30-50z" fill="#E8445A" />
          <path d="M28 36q22-14 44 0-8-2-22 6-14-8-22-6z" fill="#4FB45E" />
          {[36, 50, 64, 42, 58, 50].map((x, i) => (
            <ellipse
              key={i}
              cx={x}
              cy={52 + (i > 2 ? 14 : 0) + (i === 5 ? 12 : 0)}
              rx="2"
              ry="3"
              fill="#FFE066"
            />
          ))}
        </>
      );
      break;
    case "broccoli":
      d = (
        <>
          <path d="M44 56h12l4 34H40z" fill="#8FD18A" />
          {[
            [34, 42],
            [50, 30],
            [66, 42],
            [50, 50],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="16" fill="#4FB45E" />
          ))}
        </>
      );
      break;
    case "egg":
      d = (
        <>
          <path
            d="M50 12q30 4 30 46 0 30-30 30T20 58q0-42 30-46z"
            fill="#FFF8EC"
            stroke="#EADFCB"
            strokeWidth="4"
          />
        </>
      );
      break;
    case "bread":
      d = (
        <>
          <path
            d="M18 46q0-26 32-26t32 26q0 8-8 8v30H26V54q-8 0-8-8z"
            fill="#E0B07A"
          />
          <path d="M26 54h48v30H26z" fill="#FFE8C2" />
        </>
      );
      break;
    case "mushroom":
      d = (
        <>
          <path d="M14 52q0-34 36-34t36 34z" fill="#E8604F" />
          <circle cx="36" cy="38" r="6" fill="#fff" />
          <circle cx="60" cy="32" r="5" fill="#fff" />
          <path d="M38 52h24l-4 34H42z" fill="#FFF3D6" />
        </>
      );
      break;
  }
  return (
    <svg className="thing" viewBox="0 0 100 100" aria-hidden="true">
      {d}
    </svg>
  );
}
function ItemArt({ item }: { item: Item }) {
  if (item.food === "smoothie") {
    const [r, g, b] = item.rgb!;
    return (
      <svg className="thing smoothie" viewBox="0 0 100 100" aria-hidden="true">
        <path
          d="M28 20h44l-6 70H34z"
          fill="#E8F4FF"
          stroke="#BCD7EE"
          strokeWidth="4"
        />
        <path d="M31 34h38l-5 54H36z" fill={`rgb(${r},${g},${b})`} />
        <path
          d="M58 6l-4 40"
          stroke="#FF7A6B"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  const f = item.food;
  const cls = `food-art ${item.cooked ? "cooked" : ""} ${item.baked ? "baked" : ""} cut-${item.cut}`;
  if (item.cut === 0)
    return (
      <span className={cls}>
        <FoodArt food={f} />
      </span>
    );
  return (
    <span className={cls}>
      {Array.from({ length: item.cut === 1 ? 2 : 4 }, (_, i) => (
        <span key={i} className={`piece p${i}`}>
          <FoodArt food={f} />
        </span>
      ))}
    </span>
  );
}
const key = "Little Kitchen";
let nextId = 1;
export default function LittleKitchen({ prefs }: { prefs: Preferences }) {
  const [items, setItems] = useSaved<Item[]>(key + ":items", () => []);
  const [fridge, setFridge] = useState(false);
  const [friendIx, setFriendIx] = useSaved(key + ":friend", () => 0);
  const [mood, setMood] = useState<{ m: Mood; n: number }>({
    m: "neutral",
    n: 0,
  });
  const [busy, setBusy] = useState<Station | null>(null);
  const [chop, setChop] = useState(0);
  const [msg, setMsg] = useState("");
  const friend = friends[friendIx % friends.length];
  const at = (s: Station) => items.filter((i) => i.at === s);
  const picker = usePicker(
    (item, target) => {
      const s = target as Station;
      if (!limits[s]) return;
      if (at(s).length >= limits[s]) {
        sfx(prefs, "clink", 0.7);
        setMsg("That one is full.");
        return;
      }
      if (item.startsWith("new:")) {
        const food = item.slice(4) as Food;
        setItems((list) => [
          ...list,
          { id: nextId++, food, cut: 0, cooked: false, baked: false, at: s },
        ]);
        setFridge(false);
        say(prefs, food, "word");
      } else {
        const id = Number(item.slice(5));
        setItems((list) =>
          list.map((i) => (i.id === id ? { ...i, at: s } : i)),
        );
      }
      sfx(prefs, s === "pot" || s === "blender" ? "plop" : "thunk", 1.1);
    },
    (item) => {
      if (item.startsWith("new:")) sfx(prefs, "pop", 1.2);
    },
  );
  function run(
    s: Station,
    ms: number,
    sound: () => void,
    change: (list: Item[]) => Item[],
  ) {
    if (!at(s).length || busy) return;
    setBusy(s);
    sound();
    setTimeout(() => {
      setItems(change);
      setBusy(null);
      sfx(prefs, "sparkle", 0.9);
    }, ms);
  }
  function serve() {
    const plate = at("plate");
    if (!plate.length) {
      animal(prefs, friend.kind);
      setMood((m) => ({ m: "yum", n: m.n + 1 }));
      setMsg(`The ${friend.kind} is hungry!`);
      return;
    }
    const allFoods = plate.flatMap((i) =>
      i.food === "smoothie" ? i.parts! : [i.food],
    );
    const silly =
      (allFoods.includes("fish") &&
        (allFoods.includes("strawberry") || allFoods.includes("banana"))) ||
      plate.some((i) => i.food === "smoothie" && i.parts!.includes("fish"));
    let result: Mood;
    let line: string;
    if (friend.kind === "robot") {
      const smoothies = plate.filter((i) => i.food === "smoothie").length;
      result = smoothies ? "happy" : "surprised";
      line = smoothies
        ? "Beep boop! Smoothie fuel! I love it!"
        : "Beep? Robots drink smoothies!";
    } else if (silly) {
      result = "bleh";
      line = "Bleh! Fish and fruit? Silly!";
    } else {
      let score = 0;
      for (const i of plate) {
        const fs = i.food === "smoothie" ? i.parts! : [i.food];
        for (const f of fs)
          score += friend.loves.includes(f)
            ? 2
            : friend.dislikes.includes(f)
              ? -2
              : 0.5;
        if (friend.kind === "dragon") score += i.cooked || i.baked ? 1.5 : -1;
        else if (i.cooked || i.baked) score += 0.5;
        if (i.cut) score += 0.3;
      }
      const avg = score / plate.length;
      result = avg >= 1.5 ? "happy" : avg >= 0.4 ? "chew" : "bleh";
      line =
        result === "happy"
          ? "Mmm! I love it!"
          : result === "chew"
            ? "Yummy, thank you!"
            : "Hmm, not my favourite!";
    }
    sfx(prefs, "munch");
    setMood((m) => ({ m: "chew", n: m.n + 1 }));
    setItems((list) => list.filter((i) => i.at !== "plate"));
    setTimeout(() => {
      setMood((m) => ({ m: result, n: m.n + 1 }));
      if (result === "happy") {
        animal(prefs, friend.kind);
        sfx(prefs, "tada");
      } else if (result === "bleh") sfx(prefs, "bleh");
      else if (result === "surprised") sfx(prefs, "boing");
      say(prefs, line, "prompt");
      setMsg(line);
    }, 800);
  }
  const station = (s: Station, label: string, extra?: React.ReactNode) => (
    <div className={`station st-${s} ${busy === s ? "busy" : ""}`}>
      <button className="station-zone" aria-label={label} {...picker.zone(s)} />
      <div className="station-items">
        {at(s).map((i) => (
          <button
            key={i.id}
            className={`k-item ${s === "board" ? `chop-${chop % 2}` : ""}`}
            aria-label={`${i.cooked ? "Cooked " : i.baked ? "Baked " : ""}${i.cut ? "chopped " : ""}${i.food}`}
            {...picker.item(`item:${i.id}`)}
          >
            <ItemArt item={i} />
          </button>
        ))}
      </div>
      {extra}
    </div>
  );
  return (
    <div className="act act-kitchen">
      <div className={`fridge ${fridge ? "open" : ""}`}>
        <button
          className="fridge-door"
          data-hint
          aria-label={fridge ? "Close the fridge" : "Open the fridge"}
          aria-expanded={fridge}
          onClick={() => {
            setFridge(!fridge);
            sfx(prefs, fridge ? "thunk" : "creak", 1.4);
          }}
        >
          <span className="handle" />
        </button>
        <div className="fridge-shelves">
          {fridge &&
            foods.map((f) => (
              <button
                key={f}
                className="fridge-food"
                aria-label={f[0].toUpperCase() + f.slice(1)}
                {...picker.item(`new:${f}`)}
              >
                <FoodArt food={f} />
              </button>
            ))}
        </div>
      </div>
      <div className="counter">
        {station(
          "board",
          "Cutting board",
          <button
            className="knife"
            aria-label="Chop"
            disabled={!at("board").length}
            onClick={() => {
              setChop((c) => c + 1);
              sfx(prefs, "chop", 0.9 + Math.random() * 0.3);
              setItems((list) =>
                list.map((i) =>
                  i.at === "board" && i.food !== "smoothie" && i.cut < 2
                    ? { ...i, cut: (i.cut + 1) as 1 | 2 }
                    : i,
                ),
              );
            }}
          />,
        )}
        {station(
          "pot",
          "Cooking pot",
          <button
            className="stove-knob"
            aria-label="Cook"
            disabled={!at("pot").length || !!busy}
            onClick={() =>
              run(
                "pot",
                1600,
                () => sfx(prefs, "sizzle"),
                (list) =>
                  list.map((i) =>
                    i.at === "pot" ? { ...i, cooked: true } : i,
                  ),
              )
            }
          />,
        )}
        {station(
          "oven",
          "Oven",
          <button
            className="oven-dial"
            aria-label="Bake"
            disabled={!at("oven").length || !!busy}
            onClick={() =>
              run(
                "oven",
                2000,
                () => sfx(prefs, "rumble", 1.6),
                (list) =>
                  list.map((i) =>
                    i.at === "oven" ? { ...i, baked: true } : i,
                  ),
              )
            }
          />,
        )}
        {station(
          "blender",
          "Blender",
          <button
            className="blend-btn"
            aria-label="Blend"
            disabled={!at("blender").length || !!busy}
            onClick={() =>
              run(
                "blender",
                1400,
                () => sfx(prefs, "whirr"),
                (list) => {
                  const parts = list.filter((i) => i.at === "blender");
                  const fs = parts.flatMap((i) =>
                    i.food === "smoothie" ? i.parts! : [i.food],
                  );
                  const rgb = fs
                    .map((f) => foodColour[f])
                    .reduce(
                      (a, c) => [
                        a[0] + c[0] / fs.length,
                        a[1] + c[1] / fs.length,
                        a[2] + c[2] / fs.length,
                      ],
                      [0, 0, 0],
                    )
                    .map(Math.round) as [number, number, number];
                  return [
                    ...list.filter((i) => i.at !== "blender"),
                    {
                      id: nextId++,
                      food: "smoothie",
                      cut: 0,
                      cooked: false,
                      baked: false,
                      at: "blender",
                      rgb,
                      parts: fs,
                    },
                  ];
                },
              )
            }
          />,
        )}
      </div>
      <div className="table-side">
        <button
          className={`diner mood-${mood.m}`}
          key={mood.n}
          aria-label={`Serve the ${friend.kind}`}
          onClick={serve}
        >
          <Critter kind={friend.kind} mood={mood.m} />
          {mood.m === "happy" && (
            <span className="hearts" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          )}
        </button>
        {station("plate", "Plate")}
        <button
          className="bell"
          aria-label="Ring the bell for the next friend"
          onClick={() => {
            setFriendIx((i) => i + 1);
            setMood((m) => ({ m: "neutral", n: m.n + 1 }));
            sfx(prefs, "clink", 1.4);
            setTimeout(
              () =>
                animal(prefs, friends[(friendIx + 1) % friends.length].kind),
              300,
            );
          }}
        />
      </div>
      <p className="sr-status" role="status">
        {msg}
      </p>
    </div>
  );
}
