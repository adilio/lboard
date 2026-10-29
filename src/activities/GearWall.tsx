import { useEffect, useRef, useState } from "react";
import type { Preferences } from "../model";
import { pentatonic, sfx, tone } from "../audio";
import { usePicker } from "../play/picker";
import { say } from "../play/speech";
import { useSaved } from "../play/store";
import { reducedMotion } from "../fx";
// A4 Gear Wall: put gears on pegs to build a chain from the crank to a toy.
// Only connected gears turn, neighbours turn opposite ways, and small gears
// spin faster than big ones. Spatial reasoning with a soft goal: reach the
// carousel (or fan, or music box) and make it go.
type Size = "S" | "M" | "L";
const radius: Record<Size, number> = { S: 50, M: 60, L: 70 };
const teeth: Record<Size, number> = { S: 8, M: 10, L: 12 };
const sizeName: Record<Size, string> = { S: "Small", M: "Middle", L: "Big" };
const gearColour: Record<Size, string> = {
  S: "#FF7A6B",
  M: "#3BA7E0",
  L: "#6CC07A",
};
const W = 1000,
  H = 520;
const cols = [255, 375, 495, 615, 735];
const rows = [200, 320];
const pegs = rows.flatMap((y, r) => cols.map((x, c) => ({ x, y, r, c })));
const crank = { x: 130, y: 260, size: "M" as Size };
const goal = { x: 870, y: 260, size: "M" as Size };
// Pegs mesh with left/right/up/down neighbours; crank and toy touch the
// nearest column.
function neighbours(i: number) {
  const p = pegs[i];
  return pegs
    .map((q, j) => ({ q, j }))
    .filter(
      ({ q }) =>
        (q.r === p.r && Math.abs(q.c - p.c) === 1) ||
        (q.c === p.c && q.r !== p.r),
    )
    .map(({ j }) => j);
}
function gearPath(r: number, n: number) {
  const pts: string[] = [];
  const inner = r - 11;
  for (let i = 0; i < n * 2; i++) {
    const a0 = (i / (n * 2)) * Math.PI * 2;
    const a1 = ((i + 1) / (n * 2)) * Math.PI * 2;
    const rr = i % 2 ? inner : r;
    pts.push(
      `${(Math.cos(a0 + 0.08) * rr).toFixed(1)},${(Math.sin(a0 + 0.08) * rr).toFixed(1)}`,
      `${(Math.cos(a1 - 0.08) * rr).toFixed(1)},${(Math.sin(a1 - 0.08) * rr).toFixed(1)}`,
    );
  }
  return `M${pts.join("L")}Z`;
}
function Gear({
  size,
  colour,
  spokes = true,
}: {
  size: Size;
  colour: string;
  spokes?: boolean;
}) {
  const r = radius[size];
  return (
    <>
      <path
        d={gearPath(r, teeth[size])}
        fill={colour}
        stroke="#2E2A3B"
        strokeOpacity=".25"
        strokeWidth="3"
      />
      <circle r={r - 22} fill="#ffffff33" />
      {spokes &&
        [0, 60, 120].map((a) => (
          <rect
            key={a}
            x={-4}
            y={-(r - 18)}
            width="8"
            height={(r - 18) * 2}
            rx="4"
            fill="#ffffff66"
            transform={`rotate(${a})`}
          />
        ))}
      <circle r="12" fill="#FFF8EC" />
      <circle r="5" fill="#8A5A36" />
    </>
  );
}
type Toy = "carousel" | "fan" | "musicbox";
const key = "Gear Wall";
export default function GearWall({ prefs }: { prefs: Preferences }) {
  const [placed, setPlaced] = useSaved<(Size | null)[]>(key + ":pegs", () =>
    Array(pegs.length).fill(null),
  );
  const [toy, setToy] = useSaved<Toy>(key + ":toy", () => "carousel");
  const [angle, setAngle] = useState(0);
  const [wobble, setWobble] = useState(0);
  const spin = useRef<{
    from: number;
    to: number;
    t0: number;
    dur: number;
  } | null>(null);
  const raf = useRef(0);
  const lastTick = useRef(0);
  const lastNote = useRef(0);
  const cheered = useRef(false);
  const dragA = useRef<number | null>(null);
  const turned = useRef(0);
  // Which gears are driven, with direction and ratio relative to the crank.
  const drive = new Map<number, number>();
  const queue: { i: number; ratio: number }[] = [];
  pegs.forEach((p, i) => {
    if (placed[i] && p.c === 0) {
      const ratio = -teeth[crank.size] / teeth[placed[i]!];
      drive.set(i, ratio);
      queue.push({ i, ratio });
    }
  });
  while (queue.length) {
    const { i, ratio } = queue.shift()!;
    for (const j of neighbours(i)) {
      if (!placed[j] || drive.has(j)) continue;
      const r = -ratio * (teeth[placed[i]!] / teeth[placed[j]!]);
      drive.set(j, r);
      queue.push({ i: j, ratio: r });
    }
  }
  const lastCol = [...drive.keys()].filter(
    (i) => pegs[i].c === cols.length - 1,
  );
  const goalRatio = lastCol.length
    ? -drive.get(lastCol[0])! * (teeth[placed[lastCol[0]]!] / teeth[goal.size])
    : 0;
  const connected = lastCol.length > 0;
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  function onTurn(next: number) {
    const crankStep = Math.floor(next / 30);
    if (crankStep !== lastTick.current) {
      lastTick.current = crankStep;
      sfx(prefs, "tick", connected ? 1.2 : 0.9);
    }
    if (connected) {
      const goalAngle = next * goalRatio;
      const n = Math.floor(Math.abs(goalAngle) / 90);
      if (n !== lastNote.current) {
        lastNote.current = n;
        if (toy === "musicbox")
          tone(prefs, pentatonic[[5, 7, 9, 8, 7, 5, 6, 4][n % 8]], "sine", 0.5);
      }
      if (!cheered.current && Math.abs(goalAngle) > 120) {
        cheered.current = true;
        sfx(prefs, "tada");
        say(
          prefs,
          `The ${toy === "musicbox" ? "music box" : toy} is going!`,
          "prompt",
        );
      }
    }
  }
  function startSpin() {
    setWobble((w) => w + 1);
    const from = angle;
    spin.current = {
      from,
      to: from + 1080,
      t0: performance.now(),
      dur: reducedMotion() ? 600 : 2600,
    };
    cancelAnimationFrame(raf.current);
    const step = (t: number) => {
      const s = spin.current;
      if (!s) return;
      const k = Math.min(1, (t - s.t0) / s.dur);
      const eased = 1 - (1 - k) ** 3;
      const a = s.from + (s.to - s.from) * eased;
      setAngle(a);
      onTurn(a);
      if (k < 1) raf.current = requestAnimationFrame(step);
      else spin.current = null;
    };
    raf.current = requestAnimationFrame(step);
  }
  const picker = usePicker((item, target) => {
    const i = Number(target.split("-")[1]);
    if (Number.isNaN(i)) return;
    const size = item as Size;
    setPlaced((p) => p.map((s, j) => (j === i ? size : s)));
    sfx(prefs, "clink", size === "S" ? 1.3 : size === "M" ? 1 : 0.8);
    cheered.current = false;
  });
  const rot = (i: number) => (drive.has(i) ? angle * drive.get(i)! : 0);
  return (
    <div className="act act-gears">
      <div className="gear-board">
        <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <defs>
            <pattern
              id="pegholes"
              width="30"
              height="30"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="15" cy="15" r="3" fill="#8A5A36" opacity=".35" />
            </pattern>
          </defs>
          <rect width={W} height={H} rx="30" fill="#E2A46B" />
          <rect width={W} height={H} rx="30" fill="url(#pegholes)" />
          {pegs.map((p, i) => (
            <g key={i} transform={`translate(${p.x} ${p.y})`}>
              {placed[i] ? (
                <g
                  transform={`rotate(${rot(i)})`}
                  className={!drive.has(i) && wobble ? "gear-wobble" : ""}
                  key={`${wobble}-${i}`}
                >
                  <Gear size={placed[i]!} colour={gearColour[placed[i]!]} />
                </g>
              ) : (
                <circle
                  r="14"
                  fill="#8A5A36"
                  stroke="#FFF8EC"
                  strokeWidth="5"
                  opacity=".8"
                />
              )}
            </g>
          ))}
          <g transform={`translate(${crank.x} ${crank.y})`}>
            <g transform={`rotate(${angle})`}>
              <Gear size={crank.size} colour="#FFC94A" spokes={false} />
              <rect
                x="-6"
                y="-58"
                width="12"
                height="58"
                rx="6"
                fill="#8A5A36"
              />
              <circle
                cy="-58"
                r="16"
                fill="#E8604F"
                stroke="#fff"
                strokeWidth="4"
              />
            </g>
          </g>
          <g transform={`translate(${goal.x} ${goal.y})`}>
            <g transform={`rotate(${connected ? angle * goalRatio : 0})`}>
              <Gear size={goal.size} colour="#8C6BE0" />
            </g>
            <g
              transform="translate(0 -150)"
              className={connected && spin.current ? "toy-going" : ""}
            >
              {toy === "carousel" && (
                <g>
                  <path d="M-70 0h140L0-50z" fill="#FF7A6B" />
                  <path d="M-70 0h140" stroke="#FFC94A" strokeWidth="8" />
                  <g
                    transform={`rotate(${connected ? angle * goalRatio * 0.5 : 0} 0 40) scale(1 .35) translate(0 40)`}
                  >
                    {[0, 90, 180, 270].map((a) => (
                      <circle
                        key={a}
                        cx={Math.cos((a * Math.PI) / 180) * 56}
                        cy={Math.sin((a * Math.PI) / 180) * 56}
                        r="16"
                        fill={
                          ["#3BA7E0", "#FFC94A", "#6CC07A", "#E05A8C"][a / 90]
                        }
                      />
                    ))}
                  </g>
                  <rect x="-4" y="0" width="8" height="80" fill="#8A5A36" />
                  <ellipse cy="80" rx="70" ry="14" fill="#FFC94A" />
                </g>
              )}
              {toy === "fan" && (
                <g transform="translate(0 30)">
                  <g
                    transform={`rotate(${connected ? angle * goalRatio * 3 : 0})`}
                  >
                    {[0, 120, 240].map((a) => (
                      <ellipse
                        key={a}
                        cy="-34"
                        rx="16"
                        ry="34"
                        fill="#5FD3B5"
                        transform={`rotate(${a})`}
                      />
                    ))}
                    <circle r="12" fill="#2E2A3B" />
                  </g>
                </g>
              )}
              {toy === "musicbox" && (
                <g transform="translate(0 30)">
                  <rect
                    x="-60"
                    y="-30"
                    width="120"
                    height="70"
                    rx="12"
                    fill="#E05A8C"
                  />
                  <path d="M-60-30l14-24h92l14 24z" fill="#FF8FC0" />
                  <g
                    transform={`rotate(${connected ? angle * goalRatio : 0} 0 -54)`}
                  >
                    <circle cy="-54" r="10" fill="#FFC94A" />
                    <path d="M0-54v-28" stroke="#FFC94A" strokeWidth="6" />
                  </g>
                </g>
              )}
            </g>
          </g>
        </svg>
        {pegs.map((p, i) => (
          <button
            key={i}
            className="peg-spot"
            style={{ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%` }}
            aria-label={`Peg ${i + 1}, ${placed[i] ? `${sizeName[placed[i]!]} gear: take it off` : "empty"}`}
            {...picker.zone(`peg-${i}`)}
            onClick={(e) => {
              if (picker.held) return picker.zone(`peg-${i}`).onClick(e);
              if (placed[i]) {
                setPlaced((pl) => pl.map((s, j) => (j === i ? null : s)));
                sfx(prefs, "pop", 0.9);
              }
            }}
          />
        ))}
        <button
          className="crank-spot"
          data-hint
          style={{
            left: `${(crank.x / W) * 100}%`,
            top: `${(crank.y / H) * 100}%`,
          }}
          aria-label="Turn the crank"
          onClick={() => {
            if (turned.current < 15) startSpin();
          }}
          onPointerDown={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            dragA.current = Math.atan2(
              e.clientY - (r.top + r.height / 2),
              e.clientX - (r.left + r.width / 2),
            );
            turned.current = 0;
            e.currentTarget.setPointerCapture?.(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (dragA.current === null) return;
            const r = e.currentTarget.getBoundingClientRect();
            const a = Math.atan2(
              e.clientY - (r.top + r.height / 2),
              e.clientX - (r.left + r.width / 2),
            );
            let d = a - dragA.current;
            if (d > Math.PI) d -= Math.PI * 2;
            if (d < -Math.PI) d += Math.PI * 2;
            if (Math.abs(d) > Math.PI / 2) d = 0;
            dragA.current = a;
            turned.current += Math.abs((d * 180) / Math.PI);
            if (turned.current < 15) return;
            spin.current = null;
            setAngle((x) => {
              const n = x + (d * 180) / Math.PI;
              onTurn(n);
              return n;
            });
          }}
          onPointerUp={() => (dragA.current = null)}
          onPointerCancel={() => (dragA.current = null)}
        />
        <div className="toy-picker" style={{ left: `${(goal.x / W) * 100}%` }}>
          {(["carousel", "fan", "musicbox"] as Toy[]).map((t) => (
            <button
              key={t}
              aria-label={
                t === "musicbox" ? "Music box" : t[0].toUpperCase() + t.slice(1)
              }
              aria-pressed={toy === t}
              className={`toy-choice tc-${t}`}
              onClick={() => setToy(t)}
            />
          ))}
        </div>
      </div>
      <div className="tool-tray gear-tray">
        {(["S", "M", "L"] as Size[]).map((s) => (
          <button
            key={s}
            className={`gear-piece gp-${s}`}
            aria-label={`${sizeName[s]} gear`}
            {...picker.item(s)}
          >
            <svg viewBox="-80 -80 160 160" aria-hidden="true">
              <Gear size={s} colour={gearColour[s]} />
            </svg>
          </button>
        ))}
      </div>
      <p className="sr-status" role="status">
        {connected
          ? "The gears reach the toy. Turn the crank!"
          : `${drive.size} gears are connected to the crank.`}
      </p>
    </div>
  );
}
