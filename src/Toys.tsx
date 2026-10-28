import { useEffect, useRef, useState } from "react";
import type { PointerEvent as RP, ReactNode } from "react";
import { Art } from "./Art";
import { tone, sfx, stopAudio } from "./audio";
import { mixColors, traceTrack } from "./model";
import type { Preferences, Track } from "./model";
type State = {
  values: number[];
  items: string[];
  cells: (Track | null)[];
  positions: Record<string, { x: number; y: number }>;
  strokes: Stroke[];
  message: string;
};
type Stroke = {
  color: string;
  width: number;
  points: { x: number; y: number }[];
};
export const freshState = (): State => ({
  values: [],
  items: [],
  cells: Array(6).fill(null),
  positions: {},
  strokes: [],
  message: "",
});
const colors = ["#FF7A6B", "#FFC94A", "#3BA7E0", "#6CC07A"];
const labels = ["Coral", "Honey", "Sky", "Leaf"];
const symbols = ["☀", "✿", "☁", "★", "♥", "☾", "◆", "♧"];
export function Toy({
  name,
  prefs,
  state,
  onChange,
}: {
  name: string;
  prefs: Preferences;
  state: State;
  onChange: (s: State) => void;
}) {
  const [selected, setSelected] = useState("");
  const suppressClick = useRef(false);
  const instrumentPointers = useRef(new Map<number, number>());
  const latest = useRef(state);
  latest.current = state;
  const [pressed, setPressed] = useState<number[]>([]);
  const [confirm, setConfirm] = useState(false);
  const [brush, setBrush] = useState(0);
  const [width, setWidth] = useState(12);
  const [stamp, setStamp] = useState(false);
  const [ball, setBall] = useState<number | null>(null);
  const clearDialog = useRef<HTMLDivElement>(null);
  const clearTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (confirm) clearDialog.current?.querySelector("button")?.focus();
  }, [confirm]);
  const closeClear = () => {
    setConfirm(false);
    requestAnimationFrame(() => clearTrigger.current?.focus());
  };
  const canvas = useRef<HTMLCanvasElement>(null);
  const strokes = useRef(new Map<number, Stroke>());
  const drag = useRef<{
    id: string;
    pointer: number;
    startX: number;
    startY: number;
    x: number;
    y: number;
    el: HTMLElement;
  } | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const s = state;
  const update = (part: Partial<State>) => {
    latest.current = { ...latest.current, ...part };
    onChange(latest.current);
  };
  const val = (i: number, initial = 0) => s.values[i] ?? initial;
  const setVal = (i: number, n: number) => {
    const values = [...s.values];
    values[i] = n;
    update({ values });
  };
  const sound = (f = 320) => tone(prefs, f);
  useEffect(() => {
    const cancel = () => {
      setPressed([]);
      setSelected("");
      instrumentPointers.current.clear();
      timers.current.forEach(clearTimeout);
      strokes.current.clear();
      if (drag.current) {
        drag.current.el.style.transform = "";
        drag.current = null;
      }
      stopAudio();
    };
    window.addEventListener("blur", cancel);
    window.addEventListener("resize", cancel);
    document.addEventListener("visibilitychange", cancel);
    return () => {
      cancel();
      timers.current.forEach(clearTimeout);
      window.removeEventListener("blur", cancel);
      window.removeEventListener("resize", cancel);
      document.removeEventListener("visibilitychange", cancel);
    };
  }, []);
  useEffect(() => {
    if (name !== "Finger Paint" || !canvas.current) return;
    const c = canvas.current;
    const draw = () => {
      const r = c.getBoundingClientRect(),
        d = Math.min(window.devicePixelRatio || 1, 2);
      c.width = r.width * d;
      c.height = r.height * d;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.scale(d, d);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (const line of [...s.strokes, ...strokes.current.values()]) {
        ctx.strokeStyle = line.color;
        ctx.fillStyle = line.color;
        ctx.lineWidth = line.width;
        ctx.beginPath();
        line.points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x * r.width, p.y * r.height);
          else ctx.lineTo(p.x * r.width, p.y * r.height);
        });
        if (line.points.length === 1) {
          const p = line.points[0];
          ctx.arc(
            p.x * r.width,
            p.y * r.height,
            line.width / 2,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        } else ctx.stroke();
      }
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(c);
    return () => ro.disconnect();
  }, [name, s.strokes, pressed]);
  function drawPoint(e: RP<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
      y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
    };
  }
  function startDraw(e: RP<HTMLCanvasElement>) {
    if (s.strokes.length + strokes.current.size >= 200) {
      update({
        message: "Your paper is full. Undo a mark or start a fresh page.",
      });
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    strokes.current.set(e.pointerId, {
      color: colors[brush],
      width,
      points: [drawPoint(e)],
    });
    setPressed((p) => [...p, e.pointerId]);
  }
  function endDraw(e: RP<HTMLCanvasElement>, cancel = false) {
    const line = strokes.current.get(e.pointerId);
    strokes.current.delete(e.pointerId);
    setPressed((p) => p.filter((x) => x !== e.pointerId));
    if (line && !cancel) update({ strokes: [...latest.current.strokes, line] });
  }
  function draggable(id: string) {
    return {
      onPointerDown: (e: RP<HTMLButtonElement>) => {
        if (drag.current) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = {
          id,
          pointer: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          x: 0,
          y: 0,
          el: e.currentTarget,
        };
        setSelected(id);
      },
      onPointerMove: (e: RP<HTMLButtonElement>) => {
        const d = drag.current;
        if (!d || d.pointer !== e.pointerId) return;
        d.x = e.clientX - d.startX;
        d.y = e.clientY - d.startY;
        if (Math.hypot(d.x, d.y) > 8)
          d.el.style.transform = `translate(${d.x}px,${d.y}px)`;
      },
      onPointerUp: (e: RP<HTMLButtonElement>) => {
        const d = drag.current;
        if (!d || d.pointer !== e.pointerId) return;
        d.el.style.transform = "";
        drag.current = null;
        if (Math.hypot(d.x, d.y) <= 8) return;
        suppressClick.current = true;
        const zones = [
          ...document.querySelectorAll<HTMLElement>("[data-drop]"),
        ];
        const zone = zones
          .map((el) => {
            const r = el.getBoundingClientRect();
            return {
              el,
              dist: Math.hypot(
                Math.max(r.left - e.clientX, 0, e.clientX - r.right),
                Math.max(r.top - e.clientY, 0, e.clientY - r.bottom),
              ),
            };
          })
          .filter((z) => z.dist <= 40)
          .sort((a, b) => a.dist - b.dist)[0];
        if (zone) place(d.id, zone.el.dataset.drop!, e.clientX, e.clientY);
      },
      onPointerCancel: () => {
        if (drag.current) drag.current.el.style.transform = "";
        drag.current = null;
        setSelected("");
      },
      onLostPointerCapture: () => {
        if (drag.current) drag.current.el.style.transform = "";
        drag.current = null;
      },
    };
  }
  const piece = (id: string, content: ReactNode, label = id) => (
    <button
      key={id}
      className={`piece ${selected === id ? "selected" : ""}`}
      aria-label={label}
      aria-pressed={selected === id}
      {...draggable(id)}
      onClick={() => {
        if (suppressClick.current) {
          suppressClick.current = false;
          return;
        }
        setSelected(id);
      }}
    >
      {content}
    </button>
  );
  const zone = (id: string, content: ReactNode, label: string, extra = "") => (
    <button
      key={id}
      data-drop={id}
      className={`drop-zone ${extra}`}
      aria-label={label}
      onClick={(e) => place(selected, id, e.clientX, e.clientY)}
    >
      {content}
    </button>
  );
  function place(id: string, target: string, x = 0, y = 0) {
    if (!id) {
      setSelected("");
      return;
    }
    sfx(prefs, "plop", 0.8 + Math.random() * 0.5);
    if (name === "Colour Kitchen") {
      if (s.items.length < 2) update({ items: [...s.items, id] });
      if (s.items.length === 1) sfx(prefs, "sparkle");
    }
    if (name === "Habitat Homes") {
      update({
        positions: { ...s.positions, [id]: { x: Number(target), y: 0 } },
        message: `${id} is visiting the ${["pond", "meadow", "tree"][Number(target)]}.`,
      });
    }
    if (name === "Float or Sink")
      update({
        items: [...new Set([...s.items, id])],
        message: `${id} ${id === "Stone" ? "sinks" : "floats"}.`,
      });
    if (name === "Picnic Kitchen") {
      if (s.items.length < 12) update({ items: [...s.items, id], message: "" });
      else
        update({
          message: "A lovely full plate. Remove something to make room.",
        });
    }
    if (name === "Counting Picnic") {
      const i = Number(target);
      setVal(i, Math.min(5, val(i) + 1));
    }
    if (name === "Shape Sorter") {
      if (id === target) {
        sfx(prefs, "sparkle");
        update({
          items: [...new Set([...s.items, id])],
          message: `${id} is home.`,
        });
      } else update({ message: "Try another shape, or keep exploring." });
    }
    if (name === "Block Builder" || name === "Sticker Stories") {
      const r = document
        .querySelector('[data-drop="scene"]')!
        .getBoundingClientRect();
      const px = x
        ? Math.max(0.1, Math.min(0.9, (x - r.left) / r.width))
        : 0.3 + (s.items.length % 3) * 0.2;
      const py = y
        ? Math.max(0.15, Math.min(0.85, (y - r.top) / r.height))
        : 0.75 - Math.floor(s.items.length / 3) * 0.15;
      const key = id.startsWith("placed:")
        ? id
        : `placed:${s.items.length}:${id}`;
      if (s.items.length >= 36 && !id.startsWith("placed:")) {
        update({ message: "A full scene. Remove a piece to make room." });
        return;
      }
      update({
        items: s.items.includes(key) ? s.items : [...s.items, key],
        positions: { ...s.positions, [key]: { x: px, y: py } },
      });
    }
    if (name === "Track Maker") {
      const cells = [...s.cells];
      cells[Number(target)] = {
        kind: id === "curve" ? "curve" : "straight",
        rotation: id === "curve" ? 2 : 1,
      };
      update({ cells });
      setBall(null);
    }
    if (name === "Animal Friends")
      update({
        message: `${target} is playing with the ${id.toLowerCase()}.`,
        positions: { ...s.positions, [target]: { x: 1, y: 0 } },
      });
    setSelected("");
  }
  function strike(i: number) {
    tone(
      prefs,
      (name === "Little Piano"
        ? [261.63, 293.66, 329.63, 349.23, 392, 440]
        : [90, 150, 230, 700])[i],
      name === "Little Piano" ? "sine" : "triangle",
      0.5,
    );
  }
  function instrumentDown(e: RP<HTMLButtonElement>, i: number) {
    e.currentTarget.setPointerCapture(e.pointerId);
    instrumentPointers.current.set(e.pointerId, i);
    setPressed([...instrumentPointers.current.values()]);
    strike(i);
  }
  function releaseInstrument(id: number) {
    instrumentPointers.current.delete(id);
    setPressed([...instrumentPointers.current.values()]);
  }
  let content: ReactNode;
  switch (name) {
    case "Switchboard":
      content = (
        <div className="switch-panel">
          {" "}
          <div className="lamps">
            {["Round", "Triangle", "Square"].map((shape, i) => (
              <div
                key={shape}
                className={`lamp lamp-${i} ${val(i) ? "lit" : ""}`}
                style={{ opacity: val(i) ? 0.25 + val(3, 0.5) * 0.75 : 1 }}
              >
                <span>
                  {shape === "Round" ? "●" : shape === "Triangle" ? "▲" : "■"}
                </span>
                <i />
              </div>
            ))}
          </div>
          <div className="switch-row">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                role="switch"
                aria-checked={!!val(i)}
                aria-label={`${["Round", "Triangle", "Square"][i]} lamp`}
                className={`toggle ${val(i) ? "on" : ""}`}
                onClick={() => {
                  setVal(i, 1 - val(i));
                  sfx(prefs, "click", val(i) ? 0.8 : 1.2);
                }}
              >
                <span />
              </button>
            ))}
          </div>
          <label className="dimmer">
            ☼{" "}
            <input
              aria-label="Lamp brightness"
              type="range"
              min="0"
              max="1"
              step=".05"
              value={val(3, 0.5)}
              onChange={(e) => setVal(3, +e.target.value)}
            />{" "}
            ☀
          </label>
        </div>
      );
      break;
    case "Latch House":
      content = (
        <div className="doors">
          {["Slide bolt", "Turn knob", "Lift latch"].map((label, i) => (
            <div className={`house house-${i}`} key={label}>
              <div className="roof" />
              <button
                className={`door ${val(i) === 2 ? "open" : ""}`}
                aria-label={`Door ${i + 1}, ${val(i) === 2 ? "open: close" : val(i) === 1 ? "unlatched: open" : "latched"}`}
                onClick={() => {
                  if (val(i)) {
                    setVal(i, val(i) === 2 ? 1 : 2);
                    if (val(i) === 1) sfx(prefs, "sparkle", 0.9 + i * 0.1);
                  } else
                    update({ message: "Touch the latch to open the door." });
                }}
              >
                {val(i) === 2 ? (
                  <Art kind={["rabbit", "flower", "cloud"][i]} />
                ) : (
                  <span>{["○", "△", "□"][i]}</span>
                )}
              </button>
              <button
                className="latch"
                aria-label={`${label}, ${val(i) ? "unlatched" : "latched"}`}
                onClick={() => {
                  setVal(i, val(i) ? 0 : 1);
                  sfx(prefs, "click", 0.7);
                }}
              >
                {val(i) ? "↔" : i === 0 ? "━" : i === 1 ? "◉" : "⌁"}
              </button>
            </div>
          ))}
        </div>
      );
      break;
    case "Little Piano":
    case "Drum Basket":
      content = (
        <div className={name === "Little Piano" ? "piano" : "drums"}>
          {(name === "Little Piano"
            ? ["C", "D", "E", "F", "G", "A"]
            : ["Low drum", "Middle drum", "High drum", "Shaker"]
          ).map((key, i) => (
            <button
              key={key}
              aria-label={`Play ${key}`}
              className={`instrument key-${i} ${pressed.includes(i) ? "playing" : ""}`}
              data-note={i}
              onPointerDown={(e) => instrumentDown(e, i)}
              onPointerMove={(e) => {
                if (!instrumentPointers.current.has(e.pointerId)) return;
                const element = document
                  .elementFromPoint(e.clientX, e.clientY)
                  ?.closest<HTMLElement>("[data-note]");
                if (!element) return;
                const next = Number(element.dataset.note);
                if (instrumentPointers.current.get(e.pointerId) !== next) {
                  instrumentPointers.current.set(e.pointerId, next);
                  setPressed([...instrumentPointers.current.values()]);
                  strike(next);
                }
              }}
              onPointerUp={(e) => releaseInstrument(e.pointerId)}
              onPointerCancel={(e) => releaseInstrument(e.pointerId)}
              onLostPointerCapture={(e) => releaseInstrument(e.pointerId)}
              onClick={(e) => {
                if (e.detail === 0) {
                  strike(i);
                  setPressed([i]);
                  timers.current.push(setTimeout(() => setPressed([]), 160));
                }
              }}
            >
              <span>
                {name === "Little Piano"
                  ? ["●", "◆", "✿", "▲", "★", "☾"][i]
                  : i === 3
                    ? "⌁"
                    : "◎"}
              </span>
              <small>{key}</small>
            </button>
          ))}
        </div>
      );
      break;
    case "Animal Friends":
      content = (
        <>
          <div className="friend-row">
            {["Rabbit", "Bird", "Cat"].map((a, i) => (
              <button
                key={a}
                data-drop={a}
                className="friend"
                aria-label={`Play with ${a}`}
                onClick={() => {
                  if (selected) place(selected, a);
                  else {
                    sound([540, 740, 330][i]);
                    update({
                      message: `${a} ${["wiggles its nose", "sings a little note", "stretches in the sun"][i]}.`,
                      positions: {
                        ...s.positions,
                        [a]: { x: (s.positions[a]?.x || 0) + 1, y: 0 },
                      },
                    });
                  }
                }}
              >
                {a === "Rabbit" ? (
                  <Art kind="rabbit" />
                ) : (
                  <Creature kind={a} happy={!!s.positions[a]} />
                )}
                <span>{a}</span>
                {s.positions[a] && (
                  <b className="reaction">
                    {symbols[(s.positions[a].x || 1) % 8]}
                  </b>
                )}
              </button>
            ))}
          </div>
          <div className="tool-tray">
            {piece("Ball", <span className="ball-art">●</span>)}
            {piece("Flower", <span className="flower-art">✿</span>)}
          </div>
        </>
      );
      break;
    case "Habitat Homes":
      content = (
        <>
          <div className="habitats">
            {["Pond", "Meadow", "Tree"].map((h, i) =>
              zone(
                String(i),
                <>
                  <span className="habitat-icon">{["≈", "✿", "♧"][i]}</span>
                  <strong>{h}</strong>
                  <div className="residents">
                    {["Frog", "Rabbit", "Bird"]
                      .filter((a) => s.positions[a]?.x === i)
                      .map((a) => (
                        <Creature key={a} kind={a} />
                      ))}
                  </div>
                </>,
                `Place animal in ${h}`,
              ),
            )}
          </div>
          <div className="tool-tray">
            {["Frog", "Rabbit", "Bird"].map((a) =>
              piece(a, <Creature kind={a} />, `Select ${a}`),
            )}
          </div>
        </>
      );
      break;
    case "Finger Paint":
      content = (
        <>
          <div className="paint-paper">
            {stamp ? (
              <div className="stamp-grid">
                {Array.from({ length: 12 }, (_, i) => (
                  <button
                    key={i}
                    aria-label={`Stamp in square ${i + 1}`}
                    onClick={() => {
                      if (s.strokes.length >= 200) {
                        update({
                          message:
                            "Your paper is full. Undo or clear to make room.",
                        });
                        return;
                      }
                      update({
                        strokes: [
                          ...s.strokes,
                          {
                            color: colors[brush],
                            width: width * 3,
                            points: [
                              {
                                x: ((i % 4) + 0.5) / 4,
                                y: (Math.floor(i / 4) + 0.5) / 3,
                              },
                            ],
                          },
                        ],
                      });
                    }}
                  >
                    ＋
                  </button>
                ))}
              </div>
            ) : null}
            <canvas
              ref={canvas}
              aria-label="Drawing paper. Use stamp mode for keyboard placement."
              onPointerDown={startDraw}
              onPointerMove={(e) => {
                const line = strokes.current.get(e.pointerId);
                if (line) {
                  if (line.points.length < 1500) {
                    line.points.push(drawPoint(e));
                    setPressed((p) => [...p]);
                  } else if (
                    s.message !== "Lift your finger to start another mark."
                  )
                    update({
                      message: "Lift your finger to start another mark.",
                    });
                }
              }}
              onPointerUp={(e) => endDraw(e)}
              onPointerCancel={(e) => endDraw(e, true)}
              onLostPointerCapture={(e) => {
                if (strokes.current.has(e.pointerId)) endDraw(e, true);
              }}
            />
          </div>
          <div className="tool-tray paint-tools">
            {colors.map((c, i) => (
              <button
                key={c}
                aria-label={`${labels[i]} paint`}
                aria-pressed={brush === i}
                className={`swatch ${brush === i ? "selected" : ""}`}
                style={{ background: c }}
                onClick={() => setBrush(i)}
              >
                {["●", "◆", "▲", "■"][i]}
              </button>
            ))}
            <button
              aria-label="Small brush"
              aria-pressed={width === 12}
              onClick={() => setWidth(12)}
            >
              ●
            </button>
            <button
              aria-label="Large brush"
              aria-pressed={width === 28}
              onClick={() => setWidth(28)}
            >
              ⬤
            </button>
            <button aria-pressed={stamp} onClick={() => setStamp(!stamp)}>
              Stamp
            </button>
            <button
              disabled={!s.strokes.length}
              onClick={() => update({ strokes: s.strokes.slice(0, -1) })}
            >
              Undo
            </button>
            <button ref={clearTrigger} onClick={() => setConfirm(true)}>
              Clear
            </button>
          </div>
        </>
      );
      break;
    case "Colour Kitchen": {
      const result =
        s.items.length === 2 ? mixColors(s.items[0], s.items[1]) : s.items[0];
      content = (
        <>
          <div className="tool-tray">
            {["red", "yellow", "blue"].map((c, i) =>
              piece(
                c,
                <>
                  <span
                    className="dropper"
                    style={{ color: ["#FF5A4E", "#FFC94A", "#3BA7E0"][i] }}
                  >
                    {["●", "◆", "▲"][i]}
                  </span>
                  <small>{c}</small>
                </>,
              ),
            )}
          </div>
          {zone(
            "bowl",
            <>
              <span
                className="mix-liquid"
                style={{
                  background:
                    (
                      {
                        red: "#FF5A4E",
                        yellow: "#FFC94A",
                        blue: "#3BA7E0",
                        orange: "#FF9F3A",
                        purple: "#8C6BE0",
                        green: "#6CC07A",
                      } as Record<string, string>
                    )[result] || "#F3E8D6",
                }}
              >
                {s.items.map((c, i) => (
                  <span key={i} className="mix-token">
                    {c === "red" ? "●" : c === "blue" ? "▲" : "◆"}
                  </span>
                ))}
              </span>
              <span>{result || "A little of this…"}</span>
            </>,
            s.items.length === 2
              ? `Bowl: ${result}. Empty to mix again.`
              : "Add selected colour to bowl",
            "mix-bowl",
          )}
          <button className="text-tool" onClick={() => update({ items: [] })}>
            Empty bowl
          </button>
        </>
      );
      break;
    }
    case "Float or Sink":
      content = (
        <>
          <div className="tool-tray">
            {["Wood", "Stone", "Leaf", "Cork"].map((a, i) =>
              piece(
                a,
                <>
                  <span className={`water-piece object-${i}`}>
                    {["▰", "●", "❧", "▥"][i]}
                  </span>
                  <small>{a}</small>
                </>,
              ),
            )}
          </div>
          {zone(
            "tank",
            <>
              <div className="water-line" />
              {s.items.map((a, i) => (
                <span
                  key={a}
                  className={`floating-item ${a === "Stone" ? "sunk" : ""}`}
                  style={{ left: `${15 + i * 22}%` }}
                >
                  {
                    ["▰", "●", "❧", "▥"][
                      ["Wood", "Stone", "Leaf", "Cork"].indexOf(a)
                    ]
                  }
                  <small>{a}</small>
                </span>
              ))}
            </>,
            "Put selected object in water",
            "water-tank",
          )}
          <button className="text-tool" onClick={() => update({ items: [] })}>
            Take objects out
          </button>
        </>
      );
      break;
    case "Block Builder":
    case "Sticker Stories": {
      const block = name === "Block Builder";
      content = (
        <>
          <div
            className={`free-scene ${block ? "block-scene" : `backdrop-${val(0) % 3}`}`}
            data-drop="scene"
            role="group"
            aria-label="Play scene"
          >
            <div className="scene-grid">
              {Array.from({ length: 12 }, (_, i) => (
                <button
                  key={i}
                  aria-label={`Place selected piece in row ${Math.floor(i / 4) + 1}, column ${(i % 4) + 1}`}
                  onClick={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    place(
                      selected,
                      "scene",
                      r.left + r.width / 2,
                      r.top + r.height / 2,
                    );
                  }}
                />
              ))}
            </div>
            {s.items.map((key) => {
              const i = Number(key.split(":").at(-1));
              const p = s.positions[key] || { x: 0.5, y: 0.5 };
              return (
                <button
                  key={key}
                  className={`placed ${selected === key ? "selected" : ""} ${block ? `block block-${i}` : "sticker"}`}
                  style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
                  aria-label={`Move ${block ? "block" : "sticker"} ${i + 1}`}
                  {...draggable(key)}
                  onClick={() => {
                    if (suppressClick.current) {
                      suppressClick.current = false;
                      return;
                    }
                    setSelected(key);
                  }}
                >
                  {block ? ["■", "▬", "▲", "▰", "◒", "▮"][i] : symbols[i]}
                </button>
              );
            })}
          </div>
          <div className="tool-tray">
            {Array.from({ length: block ? 6 : 8 }, (_, i) =>
              piece(
                String(i),
                <span className={block ? `block block-${i}` : "sticker"}>
                  {block ? ["■", "▬", "▲", "▰", "◒", "▮"][i] : symbols[i]}
                </span>,
                `Select ${block ? "block" : "sticker"} ${i + 1}`,
              ),
            )}
          </div>
          <div className="secondary-tools">
            {!block && (
              <button onClick={() => setVal(0, (val(0) + 1) % 3)}>
                Change scene
              </button>
            )}
            <button
              disabled={!s.items.length}
              onClick={() => {
                const id = selected.startsWith("placed:")
                  ? selected
                  : s.items.at(-1);
                update({ items: s.items.filter((k) => k !== id) });
                setSelected("");
              }}
            >
              Remove piece
            </button>
          </div>
        </>
      );
      break;
    }
    case "Track Maker":
      content = (
        <>
          <div className="tracks">
            {s.cells.map((c, i) =>
              zone(
                String(i),
                <>
                  {c && (
                    <svg viewBox="0 0 100 100" aria-hidden="true">
                      <g transform={`rotate(${c.rotation * 90} 50 50)`}>
                        <path
                          d={
                            c.kind === "straight"
                              ? "M50 0v100"
                              : "M50 0Q50 50 100 50"
                          }
                          fill="none"
                          stroke="#C98A55"
                          strokeWidth="22"
                        />
                        <path
                          d={
                            c.kind === "straight"
                              ? "M50 0v100"
                              : "M50 0Q50 50 100 50"
                          }
                          fill="none"
                          stroke="#fff6df"
                          strokeWidth="8"
                          strokeDasharray="5 9"
                        />
                      </g>
                    </svg>
                  )}
                  {ball === i && <span className="track-ball">●</span>}
                  <small>{i + 1}</small>
                </>,
                `Place track in cell ${i + 1}`,
              ),
            )}
          </div>
          <div className="tool-tray">
            {piece("straight", <span>┃</span>, "Select straight track")}
            {piece("curve", <span>┗</span>, "Select curved track")}
            <button
              onClick={() => {
                const i = val(0);
                const cells = [...s.cells];
                if (cells[i])
                  cells[i] = {
                    ...cells[i]!,
                    rotation: (cells[i]!.rotation + 1) % 4,
                  };
                update({ cells });
              }}
            >
              ↻ Rotate {val(0) + 1}
            </button>
            <button onClick={() => setVal(0, (val(0) + 1) % 6)}>
              Cell {val(0) + 1} →
            </button>
            <button
              onClick={() => {
                timers.current.forEach(clearTimeout);
                timers.current = [];
                const path = traceTrack(s.cells);
                if (!path.length) {
                  setBall(null);
                  update({
                    message:
                      "The ball starts at the left of the first square. Add a connected track.",
                  });
                  return;
                }
                path.forEach((cell, i) =>
                  timers.current.push(
                    setTimeout(() => {
                      setBall(cell);
                      sound(220 + i * 25);
                    }, i * 450),
                  ),
                );
                update({
                  message: "The ball follows your track and rests at the end.",
                });
              }}
            >
              ● Roll
            </button>
          </div>
        </>
      );
      break;
    case "Picnic Kitchen":
      content = (
        <>
          <button
            className="serve-friend"
            aria-label="Serve the picnic"
            onClick={() => {
              update({
                message: s.items.length
                  ? [
                      "A lovely little picnic.",
                      "A colourful plate to share.",
                      "A cosy feast with a friend.",
                    ][s.items.length % 3]
                  : "A friend is here whenever you like.",
              });
              sound(390);
            }}
          >
            <Art kind="rabbit" />
          </button>
          {zone(
            "plate",
            <div className="food-stack">
              {s.items.map((a, i) => (
                <span
                  key={i}
                  style={{ transform: `rotate(${i % 2 ? 12 : -8}deg)` }}
                >
                  {a}
                </span>
              ))}
            </div>,
            "Place selected food on plate",
            "picnic-plate",
          )}
          <div className="tool-tray">
            {["●", "▲", "▰", "❧", "◒", "▥"].map((a, i) =>
              piece(
                a,
                <span className={`food food-${i}`}>{a}</span>,
                ["Berry", "Cheese", "Bread", "Lettuce", "Apple", "Biscuit"][i],
              ),
            )}
          </div>
          <div className="secondary-tools">
            <button onClick={() => update({ items: s.items.slice(0, -1) })}>
              Remove one
            </button>
            <button onClick={() => update({ items: [] })}>Clear plate</button>
          </div>
        </>
      );
      break;
    case "Garden Patch":
      content = (
        <>
          <div className="pots">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                className={`pot pot-${i}`}
                aria-label={`Pot ${i + 1}: ${["plant seed", "water seed", "pick flower"][val(i) % 3]}`}
                onClick={() => {
                  setVal(i, (val(i) + 1) % 3);
                  if (val(i) === 1) sfx(prefs, "sparkle", 1 + i * 0.12);
                  else sfx(prefs, "plop", 1 + i * 0.15);
                }}
              >
                {val(i) === 2 ? (
                  <Art kind="flower" />
                ) : (
                  <>
                    <span className="sprout">{val(i) === 1 ? "❧" : "·"}</span>
                    <span className="pot-body" />
                  </>
                )}
              </button>
            ))}
          </div>
          <p className="gentle-hint">
            A seed. A little water. Something lovely.
          </p>
        </>
      );
      break;
    case "Counting Picnic":
      content = (
        <>
          <div className="count-plates">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i}>
                {zone(
                  String(i),
                  <>
                    <div className="berries">
                      {Array.from({ length: val(i) }, (_, j) => (
                        <span key={j}>●</span>
                      ))}
                    </div>
                    <span className="count-number">{val(i)}</span>
                  </>,
                  `Plate ${i + 1}, ${val(i)} berries. Add a berry.`,
                  "count-plate",
                )}
                <button
                  className="remove-berry"
                  aria-label={`Remove berry from plate ${i + 1}`}
                  disabled={!val(i)}
                  onClick={() => setVal(i, Math.max(0, val(i) - 1))}
                >
                  −
                </button>
              </div>
            ))}
          </div>
          <div className="tool-tray">
            {piece("berry", <span className="berry">●</span>, "Select a berry")}
          </div>
        </>
      );
      break;
    case "Shape Sorter":
      content = (
        <>
          <div className="sorter">
            {["Circle", "Triangle", "Square"].map((a, i) =>
              zone(
                a,
                <span
                  className={`shape shape-${i} ${s.items.includes(a) ? "filled" : ""}`}
                >
                  {["●", "▲", "■"][i]}
                </span>,
                `${a} space${s.items.includes(a) ? ", filled" : ""}`,
              ),
            )}
          </div>
          <div className="tool-tray">
            {["Circle", "Triangle", "Square"]
              .filter((a) => !s.items.includes(a))
              .map((a) => {
                const i = ["Circle", "Triangle", "Square"].indexOf(a);
                return piece(
                  a,
                  <span className={`shape shape-${i} filled`}>
                    {["●", "▲", "■"][i]}
                  </span>,
                  `Select ${a}`,
                );
              })}
          </div>
        </>
      );
      break;
    case "Cloud Window":
      content = (
        <div className="cloud-window">
          <div className="sun">☀</div>
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              aria-label={`Move cloud ${i + 1}`}
              className={`cloud cloud-${i}`}
              style={{
                left: `${(val(i, i * 24) + 12) % 78}%`,
                top: `${15 + i * 18}%`,
              }}
              onClick={() => {
                setVal(i, (val(i, i * 24) + 22) % 78);
                sfx(prefs, "whoosh", 0.6 + i * 0.1);
              }}
            >
              <svg viewBox="0 0 200 100" aria-hidden="true">
                <path
                  d="M35 90C-8 86-3 35 39 35 46-12 116-6 126 33c61-10 77 56 30 57z"
                  fill="#fffdf4"
                />
              </svg>
            </button>
          ))}
          <div className="sky-hills" />
        </div>
      );
      break;
    case "Feelings Faces":
      content = (
        <>
          <div className="face">
            <button
              className="eyes"
              aria-label="Change eyes"
              onClick={() => setVal(0, (val(0) + 1) % 3)}
            >
              {["●  ●", "⌒  ⌒", "−  −"][val(0) % 3]}
            </button>
            <span className="cheek cheek-left" />
            <span className="cheek cheek-right" />
            <button
              className={`mouth mouth-${val(1) % 3}`}
              aria-label="Change mouth"
              onClick={() => setVal(1, (val(1) + 1) % 3)}
            >
              {["◡", "○", "―"][val(1) % 3]}
            </button>
          </div>
          <div className="feeling-words">
            {["Happy", "Quiet", "Curious", "Sleepy"].map((a) => (
              <button
                key={a}
                aria-pressed={s.message === a}
                onClick={() => update({ message: a })}
              >
                {a}
              </button>
            ))}
          </div>
        </>
      );
      break;
    case "Bubble Meadow":
      content = (
        <div className="bubble-field">
          {Array.from({ length: 9 }, (_, i) => (
            <button
              key={i}
              aria-label={val(i) ? `Flower ${i + 1}` : `Pop bubble ${i + 1}`}
              aria-pressed={!!val(i)}
              className={`bubble bubble-${i % 4} ${val(i) ? "popped" : ""}`}
              onClick={() => {
                if (!val(i)) {
                  setVal(i, 1);
                  sfx(prefs, "pop", 0.8 + i * 0.07);
                }
              }}
            >
              {val(i) ? "✿" : <span />}
            </button>
          ))}
        </div>
      );
      break;
    case "Silly Machine":
      content = (
        <div className="machine">
          <div className="machine-inputs">
            {[0, 1].map((i) => (
              <div key={i}>
                <span className="slot-label">
                  {i === 0 ? "A little of this" : "A little of that"}
                </span>
                <div>
                  {["☀", "✿", "☁"].map((a, j) => (
                    <button
                      key={a}
                      aria-label={`Slot ${i + 1}: ${["sun", "flower", "cloud"][j]}`}
                      aria-pressed={val(i, -1) === j}
                      onClick={() => setVal(i, j)}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="machine-body">
            <div className="machine-window">
              {s.message ? (
                <>
                  <span className="silly-output">{s.message}</span>
                  <span className="silly-eyes">• •</span>
                </>
              ) : (
                <span className="neutral-output">○</span>
              )}
            </div>
            <button
              className="crank"
              aria-label="Turn the crank"
              onClick={() => {
                update({
                  message:
                    (["☀", "✿", "☁"][val(0, -1)] || "○") +
                    (["☀", "✿", "☁"][val(1, -1)] || "○"),
                });
                sfx(prefs, "whoosh", 1.4);
                timers.current.push(
                  setTimeout(() => sfx(prefs, "sparkle", 1.2), 260),
                );
              }}
            >
              ↻
            </button>
          </div>
          <div className="machine-feet">
            <i />
            <i />
          </div>
        </div>
      );
      break;
    default:
      content = null;
  }
  return (
    <div className={`toy toy-${name.toLowerCase().replaceAll(" ", "-")}`}>
      <div className="play-content" inert={confirm}>
        {content}
      </div>
      <div className="sr-status" role="status">
        {s.message}
      </div>
      {s.message && name !== "Silly Machine" && (
        <p className="toy-message" aria-hidden="true">
          {s.message}
        </p>
      )}
      {confirm && (
        <div
          ref={clearDialog}
          className="inline-confirm"
          onKeyDown={(e) => {
            if (e.key === "Escape") closeClear();
            if (e.key === "Tab") {
              e.preventDefault();
              const buttons = [
                ...clearDialog.current!.querySelectorAll("button"),
              ];
              buttons[document.activeElement === buttons[0] ? 1 : 0]?.focus();
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Clear the paper?"
        >
          <span>A fresh piece of paper?</span>
          <button autoFocus onClick={closeClear}>
            Keep this one
          </button>
          <button
            onClick={() => {
              update({ strokes: [], message: "" });
              closeClear();
            }}
          >
            Clear paper
          </button>
        </div>
      )}
    </div>
  );
}
export function Creature({
  kind,
  happy = false,
}: {
  kind: string;
  happy?: boolean;
}) {
  return (
    <svg viewBox="0 0 160 150" aria-hidden="true">
      {kind === "Rabbit" ? (
        <>
          <ellipse cx="57" cy="38" rx="13" ry="33" fill="#fff5e2" />
          <ellipse cx="99" cy="38" rx="13" ry="33" fill="#fff5e2" />
        </>
      ) : kind === "Cat" ? (
        <path d="m34 65-1-46 35 29m31 0 30-30 2 48" fill="#FFB38A" />
      ) : null}
      <ellipse
        cx="80"
        cy="90"
        rx={kind === "Bird" ? 43 : 55}
        ry="47"
        fill={
          kind === "Frog"
            ? "#7ED07A"
            : kind === "Bird"
              ? "#3BA7E0"
              : kind === "Cat"
                ? "#FFB38A"
                : "#fff5e2"
        }
      />
      {kind === "Frog" && (
        <>
          <circle cx="49" cy="51" r="18" fill="#7ED07A" />
          <circle cx="109" cy="51" r="18" fill="#7ED07A" />
        </>
      )}
      <circle cx="60" cy="80" r="4" fill="#2E2A3B" />
      <circle cx="99" cy="80" r="4" fill="#2E2A3B" />
      {kind === "Bird" ? (
        <path d="m72 90 18 0-9 12z" fill="#FFC94A" />
      ) : (
        <path
          d={happy ? "M61 101q19 19 38 0" : "M69 103q11 8 22 0"}
          fill="none"
          stroke="#2E2A3B"
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}
      <ellipse cx="48" cy="97" rx="8" ry="5" fill="#FF9C8F" />
      <ellipse cx="112" cy="97" rx="8" ry="5" fill="#FF9C8F" />
    </svg>
  );
}
