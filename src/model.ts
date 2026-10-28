export const areas = [
  {
    id: "busy",
    name: "Busy Board",
    tag: "Little hands, big discoveries",
    color: "#FFC94A",
    art: "switch",
    toys: ["Switchboard", "Latch House"],
  },
  {
    id: "music",
    name: "Music Room",
    tag: "Make a little happy noise",
    color: "#3BA7E0",
    art: "piano",
    toys: ["Little Piano", "Drum Basket"],
  },
  {
    id: "animals",
    name: "Animal World",
    tag: "Some new friends to meet",
    color: "#6CC07A",
    art: "rabbit",
    toys: ["Animal Friends", "Habitat Homes"],
  },
  {
    id: "creative",
    name: "Creative Studio",
    tag: "A world of your own making",
    color: "#E05A8C",
    art: "paint",
    toys: ["Finger Paint", "Sticker Stories"],
  },
  {
    id: "science",
    name: "Science Lab",
    tag: "A little “what happens if?”",
    color: "#5FD3B5",
    art: "flask",
    toys: ["Colour Kitchen", "Float or Sink"],
  },
  {
    id: "building",
    name: "Building Site",
    tag: "Dream it. Stack it. Try again.",
    color: "#FF9F5A",
    art: "blocks",
    toys: ["Block Builder", "Track Maker"],
  },
  {
    id: "pretend",
    name: "Pretend Play",
    tag: "Small stories start here",
    color: "#FF7A6B",
    art: "picnic",
    toys: ["Picnic Kitchen", "Garden Patch"],
  },
  {
    id: "learning",
    name: "Little Discoveries",
    tag: "Shapes, numbers & possibilities",
    color: "#8C6BE0",
    art: "shapes",
    toys: ["Counting Picnic", "Shape Sorter"],
  },
  {
    id: "calm",
    name: "Calm Corner",
    tag: "A soft place to slow down",
    color: "#6C7FD8",
    art: "cloud",
    toys: ["Cloud Window", "Feelings Faces"],
  },
  {
    id: "surprise",
    name: "Little Surprises",
    tag: "Wonderful things to wonder at",
    color: "#FF8FC0",
    art: "bubbles",
    toys: ["Bubble Meadow", "Silly Machine"],
  },
] as const;
// A picture of each toy's main object, used on its shelf card.
export const toyArt: Record<string, string> = {
  Switchboard: "switch",
  "Latch House": "door",
  "Little Piano": "piano",
  "Drum Basket": "drum",
  "Animal Friends": "rabbit",
  "Habitat Homes": "frog",
  "Finger Paint": "paint",
  "Sticker Stories": "stickers",
  "Colour Kitchen": "bowl",
  "Float or Sink": "boat",
  "Block Builder": "blocks",
  "Track Maker": "track",
  "Picnic Kitchen": "picnic",
  "Garden Patch": "flower",
  "Counting Picnic": "berries",
  "Shape Sorter": "shapes",
  "Cloud Window": "cloud",
  "Feelings Faces": "face",
  "Bubble Meadow": "bubbles",
  "Silly Machine": "machine",
};
export const toyIds = areas.flatMap((a) => [...a.toys]);
export type Preferences = {
  soundEnabled: boolean;
  effectsVolume: number;
  musicVolume: number;
  reducedMotion: boolean;
  calmMode: boolean;
  enabledActivityIds: string[];
};
export const defaults: Preferences = {
  soundEnabled: true,
  effectsVolume: 0.6,
  musicVolume: 0.3,
  reducedMotion: false,
  calmMode: false,
  enabledActivityIds: [...toyIds],
};
export function validatePreferences(raw: unknown): Preferences {
  const p =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const number = (key: string, fallback: number) =>
    typeof p[key] === "number" && Number.isFinite(p[key])
      ? Math.max(0, Math.min(1, p[key] as number))
      : fallback;
  const bool = (key: keyof Preferences) =>
    typeof p[key] === "boolean"
      ? (p[key] as boolean)
      : (defaults[key] as boolean);
  const ids = Array.isArray(p.enabledActivityIds)
    ? toyIds.filter((id) => (p.enabledActivityIds as unknown[]).includes(id))
    : [...toyIds];
  return {
    soundEnabled: bool("soundEnabled"),
    effectsVolume: number("effectsVolume", 0.6),
    musicVolume: number("musicVolume", 0.3),
    reducedMotion: bool("reducedMotion"),
    calmMode: bool("calmMode"),
    enabledActivityIds: ids.length ? ids : [...toyIds],
  };
}
export function mixColors(a: string, b: string) {
  return a === b
    ? a
    : (
        {
          "blue,red": "purple",
          "red,yellow": "orange",
          "blue,yellow": "green",
        } as Record<string, string>
      )[[a, b].sort().join(",")] || a;
}
export type Track = { kind: "straight" | "curve"; rotation: number };
export function traceTrack(cells: (Track | null)[]) {
  let cell = 0,
    enter = 3;
  const path: number[] = [];
  const seen = new Set<string>();
  while (cell >= 0 && cell < 6) {
    const t = cells[cell];
    if (!t) break;
    const key = `${cell}:${enter}`;
    if (seen.has(key)) break;
    seen.add(key);
    const ends =
      t.kind === "straight"
        ? [t.rotation % 4, (t.rotation + 2) % 4]
        : [t.rotation % 4, (t.rotation + 1) % 4];
    if (!ends.includes(enter)) break;
    path.push(cell);
    const exit = ends.find((x) => x !== enter)!;
    const row = Math.floor(cell / 3),
      col = cell % 3;
    const nextRow = row + [-1, 0, 1, 0][exit];
    const nextCol = col + [0, 1, 0, -1][exit];
    if (nextRow < 0 || nextRow > 1 || nextCol < 0 || nextCol > 2) break;
    cell = nextRow * 3 + nextCol;
    enter = (exit + 2) % 4;
  }
  return path;
}
