// Release 1 catalogue from docs/LAYLA_BOARD_SPEC_V1_RESEARCH.md §8.4:
// ten areas, 21 activities, each area opening with its best-scoring member.
export const areas = [
  {
    id: "workshop",
    name: "Workshop Wall",
    tag: "Switches, latches and gears",
    color: "#FFC94A",
    art: "workshop",
    toys: ["Light Switch Wall", "Door and Latch Panel", "Gear Wall"],
  },
  {
    id: "music",
    name: "Music Garden",
    tag: "Every note sounds lovely",
    color: "#3BA7E0",
    art: "xylophone",
    toys: ["Rainbow Xylophone", "Drum Circle", "Animal Band Mixer"],
  },
  {
    id: "meadow",
    name: "Animal Meadow",
    tag: "Who lives here?",
    color: "#6CC07A",
    art: "barn",
    toys: ["Barn Doors Peekaboo", "Feed the Friends"],
  },
  {
    id: "art",
    name: "Art Studio",
    tag: "Paint, stamp and sparkle",
    color: "#E05A8C",
    art: "paint",
    toys: ["Finger Paint", "Stamp Pad", "Magic Mirror"],
  },
  {
    id: "lab",
    name: "Little Lab",
    tag: "What will happen?",
    color: "#5FD3B5",
    art: "flask",
    toys: ["Colour Mixing Pots", "Sink or Float Tub"],
  },
  {
    id: "build",
    name: "Build Yard",
    tag: "Shapes make pictures",
    color: "#FF9F5A",
    art: "blocks",
    toys: ["Shape Pictures"],
  },
  {
    id: "town",
    name: "Pretend Town",
    tag: "Cook, care and share",
    color: "#FF7A6B",
    art: "town",
    toys: ["Little Kitchen", "Teddy Care Clinic"],
  },
  {
    id: "treehouse",
    name: "Thinking Treehouse",
    tag: "Counting and letters",
    color: "#8C6BE0",
    art: "treehouse",
    toys: ["Counting Critters", "Letter Friends"],
  },
  {
    id: "nook",
    name: "Cozy Nook",
    tag: "A soft place to slow down",
    color: "#6C7FD8",
    art: "tent",
    toys: ["Breathing Balloon", "Starry Night"],
  },
  {
    id: "park",
    name: "Surprise Park",
    tag: "Pop, pop, surprise!",
    color: "#FF8FC0",
    art: "bubbles",
    toys: ["Bubble Pop Field"],
  },
] as const;
// A picture of each activity's main object, used on its room card.
export const toyArt: Record<string, string> = {
  "Light Switch Wall": "switch",
  "Door and Latch Panel": "door",
  "Gear Wall": "gears",
  "Rainbow Xylophone": "xylophone",
  "Drum Circle": "drum",
  "Animal Band Mixer": "band",
  "Barn Doors Peekaboo": "barn",
  "Feed the Friends": "feed",
  "Finger Paint": "paint",
  "Stamp Pad": "stamp",
  "Magic Mirror": "mirror",
  "Colour Mixing Pots": "bowl",
  "Sink or Float Tub": "boat",
  "Shape Pictures": "shapes",
  "Little Kitchen": "kitchen",
  "Teddy Care Clinic": "clinic",
  "Counting Critters": "critters",
  "Letter Friends": "letters",
  "Breathing Balloon": "balloon",
  "Starry Night": "stars",
  "Bubble Pop Field": "bubbles",
};
export const toyIds = areas.flatMap((a) => [...a.toys]);
// Calm Mode keeps only the gentlest corners (spec §10).
export const calmIds = [
  "Breathing Balloon",
  "Starry Night",
  "Finger Paint",
  "Stamp Pad",
  "Magic Mirror",
  "Rainbow Xylophone",
];
export type Voice = "on" | "names" | "off";
export type Preferences = {
  soundEnabled: boolean;
  effectsVolume: number;
  musicVolume: number;
  reducedMotion: boolean;
  calmMode: boolean;
  enabledActivityIds: string[];
  voice: Voice;
  childName: string;
  familyNames: string[];
};
export const defaults: Preferences = {
  soundEnabled: true,
  effectsVolume: 0.6,
  musicVolume: 0.3,
  reducedMotion: false,
  calmMode: false,
  enabledActivityIds: [...toyIds],
  voice: "on",
  childName: "Layla",
  familyNames: [],
};
export function cleanName(raw: unknown) {
  return typeof raw === "string"
    ? raw.replace(/[^A-Za-z]/g, "").slice(0, 10)
    : "";
}
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
  const name = cleanName(p.childName);
  return {
    soundEnabled: bool("soundEnabled"),
    effectsVolume: number("effectsVolume", 0.6),
    musicVolume: number("musicVolume", 0.3),
    reducedMotion: bool("reducedMotion"),
    calmMode: bool("calmMode"),
    enabledActivityIds: ids.length ? ids : [...toyIds],
    voice: (["on", "names", "off"] as const).includes(p.voice as Voice)
      ? (p.voice as Voice)
      : "on",
    childName: name || "Layla",
    familyNames: Array.isArray(p.familyNames)
      ? p.familyNames.map(cleanName).filter(Boolean).slice(0, 6)
      : [],
  };
}

// Paint mixing (spec §9.6): parts are RYB weights averaged, then converted
// to RGB by trilinear interpolation over the RYB cube so yellow + blue is
// green and red + blue is purple, as in preschool art.
export type Paint = { r: number; y: number; b: number; w: number; k: number };
const corners: [number, number, number][] = [
  [255, 255, 255], // none: white
  [254, 39, 18], // red
  [254, 238, 0], // yellow
  [252, 136, 0], // red + yellow: orange
  [2, 71, 254], // blue
  [134, 1, 175], // red + blue: purple
  [0, 168, 74], // yellow + blue: green
  [56, 32, 18], // all: dark brown
];
export function rybToRgb(
  r: number,
  y: number,
  b: number,
): [number, number, number] {
  const out: number[] = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    let v = 0;
    for (let i = 0; i < 8; i++) {
      const wr = i & 1 ? r : 1 - r;
      const wy = i & 2 ? y : 1 - y;
      const wb = i & 4 ? b : 1 - b;
      v += corners[i][c] * wr * wy * wb;
    }
    out[c] = v;
  }
  return out as [number, number, number];
}
export function mixPaint(
  parts: (keyof Paint)[],
): [number, number, number] | null {
  if (!parts.length) return null;
  const n = parts.length;
  const count = (k: keyof Paint) => parts.filter((p) => p === k).length / n;
  const r = count("r"),
    y = count("y"),
    b = count("b"),
    w = count("w"),
    k = count("k");
  const hue = r + y + b,
    top = Math.max(r, y, b);
  // Scale by the strongest pigment so equal parts land on the secondary
  // colour (red + blue = purple) instead of a washed-out midpoint.
  let rgb: [number, number, number] = hue
    ? rybToRgb(r / top, y / top, b / top)
    : [255, 255, 255];
  if (!hue && k) rgb = [30, 30, 36];
  const tint = hue ? w / (hue + w + k) : 0,
    shade = hue ? k / (hue + w + k) : 0;
  return rgb.map((c) =>
    Math.round(
      Math.max(
        0,
        Math.min(255, (c * (1 - tint) + 255 * tint) * (1 - shade * 0.8)),
      ),
    ),
  ) as [number, number, number];
}
// Colour names with a real object of that colour (colour-blind support §7 E1).
export const colourNames: [string, string, [number, number, number]][] = [
  ["red", "strawberry", [230, 40, 30]],
  ["orange", "orange", [250, 140, 20]],
  ["yellow", "banana", [250, 225, 40]],
  ["green", "frog", [40, 160, 70]],
  ["blue", "whale", [30, 90, 230]],
  ["purple", "grapes", [130, 30, 170]],
  ["pink", "flamingo", [250, 160, 170]],
  ["brown", "teddy", [120, 70, 35]],
  ["white", "cloud", [250, 250, 250]],
  ["grey", "elephant", [140, 140, 150]],
  ["black", "night", [30, 30, 36]],
  ["light blue", "sky", [130, 190, 250]],
  ["light green", "leaf", [150, 220, 140]],
  ["peach", "peach", [255, 205, 140]],
  ["lilac", "flower", [200, 160, 230]],
];
export function nameColour(rgb: [number, number, number]) {
  let best = colourNames[0],
    dist = Infinity;
  for (const c of colourNames) {
    const d = c[2].reduce((s, v, i) => s + (v - rgb[i]) ** 2, 0);
    if (d < dist) {
      dist = d;
      best = c;
    }
  }
  return { name: best[0], object: best[1] };
}
export const css = (rgb: [number, number, number]) =>
  `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
