import { useRef, useState } from "react";
import type { Preferences } from "../model";
import { animal, sfx } from "../audio";
import { usePicker } from "../play/picker";
import { say } from "../play/speech";
import { useSaved } from "../play/store";
// F3 Shape Pictures: make pictures from big shapes. Outline pages show a
// faint house, rocket, cat or tree; a shape dropped near a matching space
// snaps in (and takes the right turn). Finished pictures come alive. The
// blank page is free building. Shape names are spoken when picked up.
type Kind = "circle" | "square" | "triangle" | "rect" | "half" | "star";
const kinds: Kind[] = ["circle", "square", "triangle", "rect", "half", "star"];
const names: Record<Kind, string> = {
  circle: "circle",
  square: "square",
  triangle: "triangle",
  rect: "rectangle",
  half: "half circle",
  star: "star",
};
const palette = [
  "#FF7A6B",
  "#FFC94A",
  "#3BA7E0",
  "#6CC07A",
  "#8C6BE0",
  "#E05A8C",
  "#FF9F3A",
];
type Slot = {
  kind: Kind;
  x: number;
  y: number;
  s: number;
  rot: number;
  colour: string;
};
type Placed = {
  kind: Kind;
  x: number;
  y: number;
  s: number;
  rot: number;
  colour: string;
  slot: number | null;
};
const pages: { id: string; name: string; slots: Slot[] }[] = [
  {
    id: "house",
    name: "house",
    slots: [
      { kind: "square", x: 300, y: 290, s: 180, rot: 0, colour: "#FFC94A" },
      { kind: "triangle", x: 300, y: 150, s: 230, rot: 0, colour: "#FF7A6B" },
      { kind: "rect", x: 300, y: 330, s: 100, rot: 0, colour: "#8C6BE0" },
      { kind: "circle", x: 248, y: 262, s: 50, rot: 0, colour: "#3BA7E0" },
      { kind: "circle", x: 352, y: 262, s: 50, rot: 0, colour: "#3BA7E0" },
    ],
  },
  {
    id: "rocket",
    name: "rocket",
    slots: [
      { kind: "rect", x: 300, y: 230, s: 190, rot: 0, colour: "#E8EEF6" },
      { kind: "triangle", x: 300, y: 104, s: 104, rot: 0, colour: "#FF7A6B" },
      { kind: "circle", x: 300, y: 200, s: 58, rot: 0, colour: "#3BA7E0" },
      { kind: "triangle", x: 226, y: 300, s: 80, rot: 0, colour: "#FF7A6B" },
      { kind: "triangle", x: 374, y: 300, s: 80, rot: 0, colour: "#FF7A6B" },
      { kind: "half", x: 300, y: 344, s: 90, rot: 180, colour: "#FFC94A" },
    ],
  },
  {
    id: "cat",
    name: "cat",
    slots: [
      { kind: "half", x: 300, y: 330, s: 250, rot: 0, colour: "#FF9F3A" },
      { kind: "circle", x: 300, y: 170, s: 170, rot: 0, colour: "#FF9F3A" },
      { kind: "triangle", x: 240, y: 92, s: 72, rot: 0, colour: "#FF9F3A" },
      { kind: "triangle", x: 360, y: 92, s: 72, rot: 0, colour: "#FF9F3A" },
      { kind: "rect", x: 452, y: 300, s: 110, rot: 45, colour: "#FF9F3A" },
    ],
  },
  {
    id: "tree",
    name: "tree",
    slots: [
      { kind: "rect", x: 300, y: 360, s: 80, rot: 0, colour: "#A0683C" },
      { kind: "triangle", x: 300, y: 270, s: 240, rot: 0, colour: "#4FB45E" },
      { kind: "triangle", x: 300, y: 180, s: 180, rot: 0, colour: "#6CC07A" },
      { kind: "triangle", x: 300, y: 104, s: 124, rot: 0, colour: "#8FD18A" },
      { kind: "star", x: 300, y: 36, s: 70, rot: 0, colour: "#FFC94A" },
    ],
  },
  { id: "free", name: "free", slots: [] },
];
function ShapeGeom({
  kind,
  s,
  ...rest
}: { kind: Kind; s: number } & React.SVGProps<SVGPathElement>) {
  const h = s / 2;
  let d = "";
  switch (kind) {
    case "circle":
      d = `M${-h} 0a${h} ${h} 0 1 0 ${s} 0a${h} ${h} 0 1 0 ${-s} 0z`;
      break;
    case "square":
      d = `M${-h} ${-h}h${s}v${s}h${-s}z`;
      break;
    case "triangle":
      d = `M0 ${-s * 0.45}L${h} ${s * 0.42}H${-h}z`;
      break;
    case "rect":
      d = `M${-s * 0.27} ${-h}h${s * 0.54}v${s}h${-s * 0.54}z`;
      break;
    case "half":
      d = `M${-h} ${s * 0.22}a${h} ${h} 0 0 1 ${s} 0z`;
      break;
    case "star": {
      const pts = Array.from({ length: 10 }, (_, i) => {
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        const r = i % 2 ? h * 0.45 : h;
        return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`;
      });
      d = `M${pts.join("L")}z`;
    }
  }
  return <path d={d} strokeLinejoin="round" {...rest} />;
}
const key = "Shape Pictures";
export default function ShapePictures({ prefs }: { prefs: Preferences }) {
  const [pageIx, setPageIx] = useSaved(key + ":page", () => 0);
  const [placedAll, setPlacedAll] = useSaved<Record<string, Placed[]>>(
    key + ":placed",
    () => ({}),
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [alive, setAlive] = useState(0);
  const svg = useRef<SVGSVGElement>(null);
  const page = pages[pageIx];
  const placed = placedAll[page.id] ?? [];
  const setPlaced = (f: (p: Placed[]) => Placed[]) =>
    setPlacedAll((a) => ({ ...a, [page.id]: f(a[page.id] ?? []) }));
  const filled = (i: number) => placed.some((p) => p.slot === i);
  const toSvg = (x: number, y: number) => {
    const r = svg.current!.getBoundingClientRect();
    return [((x - r.left) / r.width) * 600, ((y - r.top) / r.height) * 420];
  };
  function put(kind: Kind, x: number, y: number, moving: number | null) {
    const [sx, sy] = toSvg(x, y);
    let best: { i: number; d: number } | null = null;
    page.slots.forEach((sl, i) => {
      if (sl.kind !== kind || (filled(i) && placed[moving ?? -1]?.slot !== i))
        return;
      const d = Math.hypot(sl.x - sx, sl.y - sy);
      if (d < 95 && (!best || d < best.d)) best = { i, d };
    });
    const b = best as { i: number; d: number } | null;
    const before = moving !== null ? placed[moving] : null;
    const next: Placed = b
      ? { ...page.slots[b.i], slot: b.i }
      : {
          kind,
          x: Math.max(40, Math.min(560, sx)),
          y: Math.max(40, Math.min(380, sy)),
          s: before?.s ?? 110,
          rot: before?.rot ?? 0,
          colour: before?.colour ?? palette[kinds.indexOf(kind)],
          slot: null,
        };
    const list =
      moving !== null
        ? placed.map((p, i) => (i === moving ? next : p))
        : [...placed, next].slice(-30);
    setPlaced(() => list);
    sfx(prefs, b ? "clink" : "plop", b ? 1.1 : 1);
    if (
      b &&
      page.slots.length &&
      page.slots.every((_, i) => list.some((p) => p.slot === i))
    ) {
      setTimeout(() => {
        setAlive((a) => a + 1);
        sfx(prefs, "tada");
        if (page.id === "cat") setTimeout(() => animal(prefs, "cat"), 500);
        if (page.id === "rocket")
          setTimeout(() => sfx(prefs, "whoosh", 0.6), 300);
        say(prefs, `You made a ${page.name}!`, "prompt");
      }, 350);
    }
  }
  const picker = usePicker(
    (item, target, x, y) => {
      if (target === "tray") {
        if (item.startsWith("placed:")) {
          const i = Number(item.split(":")[1]);
          setPlaced((p) => p.filter((_, j) => j !== i));
          setSelected(null);
          sfx(prefs, "pop", 0.8);
        }
        return;
      }
      if (item.startsWith("placed:"))
        put(
          placed[Number(item.split(":")[1])].kind,
          x,
          y,
          Number(item.split(":")[1]),
        );
      else put(item as Kind, x, y, null);
    },
    (item) => {
      if (!item.startsWith("placed:")) say(prefs, names[item as Kind], "word");
    },
  );
  const done = page.slots.length > 0 && page.slots.every((_, i) => filled(i));
  return (
    <div className="act act-shapes">
      <div className="page-picker" role="group" aria-label="Pictures">
        {pages.map((p, i) => (
          <button
            key={p.id}
            className={`page-thumb pt-${p.id}`}
            aria-label={p.id === "free" ? "Blank page" : `Make a ${p.name}`}
            aria-pressed={pageIx === i}
            onClick={() => {
              setPageIx(i);
              setSelected(null);
            }}
          >
            <svg viewBox="0 0 600 420" aria-hidden="true">
              {p.slots.map((sl, j) => (
                <g
                  key={j}
                  transform={`translate(${sl.x} ${sl.y}) rotate(${sl.rot})`}
                >
                  <ShapeGeom kind={sl.kind} s={sl.s} fill={sl.colour} />
                </g>
              ))}
            </svg>
          </button>
        ))}
      </div>
      <div className={`shape-canvas page-${page.id} ${done ? "complete" : ""}`}>
        <svg ref={svg} viewBox="0 0 600 420" aria-hidden="true">
          <g
            className={`picture alive-${done ? alive % 2 : "x"}`}
            key={`${page.id}-${alive}`}
          >
            {page.slots.map((sl, i) => (
              <g
                key={i}
                transform={`translate(${sl.x} ${sl.y}) rotate(${sl.rot})`}
              >
                <ShapeGeom
                  kind={sl.kind}
                  s={sl.s}
                  className={`slot ${filled(i) ? "slot-filled" : ""} ${picker.held === sl.kind ? "slot-hot" : ""}`}
                />
              </g>
            ))}
            {placed.map((p, i) => (
              <g
                key={i}
                transform={`translate(${p.x} ${p.y}) rotate(${p.rot})`}
                className={`placed-shape ${selected === i ? "sel" : ""}`}
              >
                <ShapeGeom
                  kind={p.kind}
                  s={p.s}
                  fill={p.colour}
                  stroke="#2E2A3B"
                  strokeOpacity=".2"
                  strokeWidth="4"
                />
              </g>
            ))}
            {done && page.id === "house" && (
              <g className="smoke">
                <circle cx="370" cy="70" r="14" fill="#fff" />
                <circle cx="384" cy="44" r="18" fill="#fff" />
              </g>
            )}
            {done && page.id === "cat" && (
              <g>
                <circle cx="272" cy="168" r="9" fill="#2E2A3B" />
                <circle cx="328" cy="168" r="9" fill="#2E2A3B" />
                <path
                  d="M290 200q10 10 20 0"
                  stroke="#2E2A3B"
                  strokeWidth="5"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M226 196h-40M226 206l-36 10M374 196h40M374 206l36 10"
                  stroke="#2E2A3B"
                  strokeWidth="3"
                />
              </g>
            )}
          </g>
        </svg>
        <button
          className="canvas-hit"
          aria-label={picker.held ? "Put it here" : "Picture"}
          {...picker.zone("canvas")}
          onClick={(e) => {
            if (picker.held) picker.zone("canvas").onClick(e);
            else setSelected(null);
          }}
        />
        {placed.map((p, i) => (
          <button
            key={i}
            className="placed-hit"
            style={{
              left: `${(p.x / 600) * 100}%`,
              top: `${(p.y / 420) * 100}%`,
              width: `${(p.s / 600) * 100}%`,
              height: `${(p.s / 420) * 100}%`,
            }}
            aria-label={`${names[p.kind]} ${i + 1}: change colour`}
            {...picker.item(`placed:${i}`)}
            onClick={() => {
              if (picker.held) return;
              setSelected(i);
              setPlaced((list) =>
                list.map((q, j) =>
                  j === i
                    ? {
                        ...q,
                        colour:
                          palette[
                            (palette.indexOf(q.colour) + 1) % palette.length
                          ],
                      }
                    : q,
                ),
              );
              sfx(prefs, "boop", 1 + (i % 5) * 0.12);
            }}
          />
        ))}
      </div>
      <div
        className="tool-tray shape-tray"
        {...picker.zone("tray")}
        onClick={undefined}
      >
        {kinds.map((k) => (
          <button
            key={k}
            className="shape-piece"
            data-hint={k === "square" ? true : undefined}
            aria-label={`${names[k]} shape`}
            {...picker.item(k)}
          >
            <svg viewBox="-60 -60 120 120" aria-hidden="true">
              <ShapeGeom
                kind={k}
                s={k === "rect" ? 100 : 92}
                fill={palette[kinds.indexOf(k)]}
              />
            </svg>
          </button>
        ))}
        <button
          className="turn-btn"
          aria-label="Turn the shape"
          disabled={selected === null}
          onClick={() => {
            if (selected === null) return;
            setPlaced((list) =>
              list.map((q, j) =>
                j === selected
                  ? { ...q, rot: (q.rot + 45) % 360, slot: null }
                  : q,
              ),
            );
            sfx(prefs, "click", 1.2);
          }}
        />
        <button
          className="tidy-btn"
          aria-label="Tidy up"
          disabled={!placed.length}
          onClick={() => {
            setPlaced(() => []);
            setSelected(null);
            sfx(prefs, "whoosh", 0.7);
          }}
        />
      </div>
      <p className="sr-status" role="status">
        {done
          ? `You made a ${page.name}!`
          : page.slots.length
            ? `${page.slots.filter((_, i) => filled(i)).length} of ${page.slots.length} shapes in place.`
            : ""}
      </p>
    </div>
  );
}
