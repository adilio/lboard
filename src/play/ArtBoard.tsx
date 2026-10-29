import { useEffect, useLayoutEffect, useRef } from "react";
import type { PointerEvent as RP } from "react";
// Shared canvas for the Art Studio (spec D1–D3). Points are stored relative
// to the paper (0..1) so art survives rotation and resizing. Finished marks
// are composited onto a base canvas; marks in progress live on an overlay,
// so each finger draws smoothly and several fingers can paint at once.
export type Pt = [number, number];
export type Op =
  | {
      t: "paint";
      tool: "finger" | "sponge" | "spray" | "cloth";
      colour: string;
      size: number;
      pts: Pt[];
      seed: number;
    }
  | {
      t: "stamp";
      shape: string;
      colour: string;
      size: number;
      x: number;
      y: number;
      rot: number;
      variant: number;
    }
  | {
      t: "mirror";
      n: number;
      colour: string;
      size: number;
      pts: Pt[];
      hue: number;
    };
export const RAINBOW = "rainbow";
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const stampPaths: Record<string, string> = {
  star: "M50 6l13 28 30 3-23 21 7 31-27-16-27 16 7-31L7 37l30-3z",
  heart:
    "M50 88C14 62 6 40 18 24c10-13 26-10 32 4 6-14 22-17 32-4 12 16 4 38-32 64z",
  leaf: "M12 88Q8 18 88 10q4 72-76 78z",
  fish: "M8 50q30-34 62-10l22-16v52L70 60Q38 84 8 50z",
  flower:
    "M50 30a14 14 0 1 1 14 24 14 14 0 1 1-14 24 14 14 0 1 1-14-24 14 14 0 1 1 14-24z",
  foot: "M40 90c-16 0-20-20-14-38s28-20 30 0-2 38-16 38zM24 30a7 9 0 1 1 0 1zM38 20a7 9 0 1 1 0 1zM54 22a6 8 0 1 1 0 1zM66 32a5 7 0 1 1 0 1z",
  cat: "M18 40 14 8l26 18q10-4 20 0L86 8l-4 32q12 14 6 30-8 22-38 22T12 70q-6-16 6-30z",
  sun: "M50 26a24 24 0 1 1 0 48 24 24 0 1 1 0-48zM46 2h8v16h-8zM46 82h8v16h-8zM2 46h16v8H2zM82 46h16v8H82z",
};
const paths: Record<string, Path2D> = {};
const path = (s: string) => (paths[s] ??= new Path2D(stampPaths[s]));
function colourAt(op: { colour: string; hue?: number }, i: number) {
  if (op.colour !== RAINBOW) return op.colour;
  return `hsl(${((op.hue ?? 0) + i * 4) % 360} 90% 58%)`;
}
export function drawOp(
  ctx: CanvasRenderingContext2D,
  op: Op,
  w: number,
  h: number,
) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (op.t === "stamp") {
    const s = op.size * w;
    ctx.translate(op.x * w, op.y * h);
    ctx.rotate(op.rot);
    ctx.scale(s / 100, s / 100);
    ctx.translate(-50, -50);
    ctx.fillStyle = op.colour;
    ctx.fill(path(op.shape));
    // Hand-stamped look: tiny gaps in the ink, and faces on the cat.
    ctx.globalCompositeOperation = "destination-out";
    const r = rng(op.variant * 977 + Math.round(op.x * 1000));
    for (let i = 0; i < 14; i++) {
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(10 + r() * 80, 10 + r() * 80, 1 + r() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (op.shape === "cat") {
      ctx.beginPath();
      if (op.variant % 3 === 2) {
        ctx.lineWidth = 5;
        ctx.moveTo(30, 52);
        ctx.lineTo(42, 52);
        ctx.stroke();
      } else {
        ctx.arc(36, 52, 6, 0, Math.PI * 2);
      }
      ctx.arc(64, 52, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(42, 68);
      ctx.quadraticCurveTo(50, 76, 58, 68);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  const pts = op.pts.map(([x, y]) => [x * w, y * h] as Pt);
  const size = op.size * w;
  const stroke = (p: Pt[], colourFor: (i: number) => string) => {
    if (p.length === 1) {
      ctx.fillStyle = colourFor(0);
      ctx.beginPath();
      ctx.arc(p[0][0], p[0][1], size / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    if (op.colour === RAINBOW)
      for (let i = 1; i < p.length; i++) {
        ctx.strokeStyle = colourFor(i);
        ctx.beginPath();
        ctx.moveTo(...p[i - 1]);
        ctx.lineTo(...p[i]);
        ctx.stroke();
      }
    else {
      ctx.strokeStyle = colourFor(0);
      ctx.beginPath();
      ctx.moveTo(...p[0]);
      for (const q of p.slice(1)) ctx.lineTo(...q);
      ctx.stroke();
    }
  };
  if (op.t === "mirror") {
    const cx = w / 2,
      cy = h / 2;
    const rel = pts.map(([x, y]) => [x - cx, y - cy] as Pt);
    ctx.translate(cx, cy);
    for (let k = 0; k < op.n; k++) {
      for (const flip of [1, -1]) {
        ctx.save();
        ctx.rotate((k * Math.PI * 2) / op.n);
        ctx.scale(1, flip);
        // Soft glow underneath, then the bright line.
        ctx.globalAlpha = 0.25;
        ctx.lineWidth = size * 2.6;
        stroke(rel, (i) => colourAt(op, i));
        ctx.globalAlpha = 1;
        ctx.lineWidth = size;
        stroke(rel, (i) => colourAt(op, i));
        ctx.restore();
      }
    }
    ctx.restore();
    return;
  }
  if (op.tool === "finger" || op.tool === "cloth") {
    ctx.lineWidth = size;
    stroke(pts, (i) => (op.tool === "cloth" ? "#000" : colourAt(op, i)));
  } else {
    const r = rng(op.seed);
    for (let i = 0; i < pts.length; i++) {
      const [x, y] = pts[i];
      ctx.fillStyle = colourAt(op, i);
      const n = op.tool === "sponge" ? 16 : 10;
      for (let k = 0; k < n; k++) {
        const a = r() * Math.PI * 2,
          d = Math.sqrt(r()) * size * (op.tool === "sponge" ? 0.55 : 0.9);
        ctx.globalAlpha = op.tool === "sponge" ? 0.75 : 0.5;
        ctx.beginPath();
        ctx.arc(
          x + Math.cos(a) * d,
          y + Math.sin(a) * d,
          op.tool === "sponge" ? size * (0.08 + r() * 0.12) : 1 + r() * 2.2,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }
  }
  ctx.restore();
}
export function ArtBoard({
  ops,
  onCommit,
  make,
  extend = "line",
  spacing = 0.06,
  blend = "multiply",
  className = "",
  label,
}: {
  ops: Op[];
  onCommit: (op: Op) => void;
  make: (p: Pt) => Op | null;
  extend?: "line" | "repeat";
  spacing?: number;
  blend?: "multiply" | "normal";
  className?: string;
  label: string;
}) {
  const base = useRef<HTMLCanvasElement>(null);
  const live = useRef<HTMLCanvasElement>(null);
  const scratch = useRef<HTMLCanvasElement | null>(null);
  const active = useRef(new Map<number, Op>());
  const lastStamp = useRef(new Map<number, Pt>());
  const size = useRef({ w: 1, h: 1, d: 1 });
  const commitTo = (ctx: CanvasRenderingContext2D, op: Op) => {
    const { w, h, d } = size.current;
    const s = (scratch.current ??= document.createElement("canvas"));
    if (s.width !== w * d || s.height !== h * d) {
      s.width = w * d;
      s.height = h * d;
    }
    const sc = s.getContext("2d")!;
    sc.setTransform(1, 0, 0, 1, 0, 0);
    sc.clearRect(0, 0, s.width, s.height);
    sc.setTransform(d, 0, 0, d, 0, 0);
    drawOp(sc, op, w, h);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation =
      op.t === "paint" && op.tool === "cloth"
        ? "destination-out"
        : blend === "multiply"
          ? "multiply"
          : "source-over";
    ctx.globalAlpha = blend === "multiply" ? 0.92 : 1;
    ctx.drawImage(s, 0, 0);
    ctx.restore();
  };
  const redrawBase = () => {
    const c = base.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    for (const op of ops) commitTo(ctx, op);
    drawn.current = ops;
  };
  const redrawLive = () => {
    const c = live.current;
    if (!c) return;
    const { w, h, d } = size.current;
    const ctx = c.getContext("2d")!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.setTransform(d, 0, 0, d, 0, 0);
    for (const op of active.current.values()) drawOp(ctx, op, w, h);
  };
  useLayoutEffect(() => {
    const c = base.current!;
    const resize = () => {
      const r = c.getBoundingClientRect();
      const d = Math.min(window.devicePixelRatio || 1, 2);
      size.current = { w: Math.max(1, r.width), h: Math.max(1, r.height), d };
      for (const el of [base.current!, live.current!]) {
        el.width = Math.round(r.width * d);
        el.height = Math.round(r.height * d);
      }
      redrawBase();
      redrawLive();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    return () => ro.disconnect();
    // Ops changes are handled by the effect below.
  }, []);
  // Adding one mark composites just that mark; undo and clear redraw all.
  const drawn = useRef<Op[]>([]);
  useEffect(() => {
    const prev = drawn.current;
    const c = base.current;
    if (
      c &&
      ops.length === prev.length + 1 &&
      (prev.length === 0 || ops[prev.length - 1] === prev[prev.length - 1])
    )
      commitTo(c.getContext("2d")!, ops[ops.length - 1]);
    else redrawBase();
    drawn.current = ops;
  }, [ops]);
  const at = (e: RP<HTMLCanvasElement>): Pt => {
    const r = e.currentTarget.getBoundingClientRect();
    return [
      Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
      Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
    ];
  };
  const finish = (id: number, keep: boolean) => {
    const op = active.current.get(id);
    active.current.delete(id);
    lastStamp.current.delete(id);
    if (op && keep && extend === "line") onCommit(op);
    redrawLive();
  };
  return (
    <div className={`art-board ${className}`}>
      <canvas ref={base} className="art-base" />
      <canvas
        ref={live}
        className={`art-live ${blend === "multiply" ? "blend-multiply" : ""}`}
        role="img"
        aria-label={label}
        onPointerDown={(e) => {
          if (active.current.size >= 5) return;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          const p = at(e);
          const op = make(p);
          if (!op) return;
          if (extend === "repeat") {
            onCommit(op);
            lastStamp.current.set(e.pointerId, p);
            active.current.set(e.pointerId, op);
            return;
          }
          active.current.set(e.pointerId, op);
          redrawLive();
        }}
        onPointerMove={(e) => {
          const op = active.current.get(e.pointerId);
          if (!op) return;
          const p = at(e);
          if (extend === "repeat") {
            const last = lastStamp.current.get(e.pointerId)!;
            if (Math.hypot(p[0] - last[0], p[1] - last[1]) >= spacing) {
              lastStamp.current.set(e.pointerId, p);
              const next = make(p);
              if (next) onCommit(next);
            }
            return;
          }
          if (op.t === "stamp" || op.pts.length > 1500) return;
          const last = op.pts[op.pts.length - 1];
          if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 0.003) return;
          op.pts.push(p);
          redrawLive();
        }}
        onPointerUp={(e) => finish(e.pointerId, true)}
        onPointerCancel={(e) => finish(e.pointerId, false)}
      />
    </div>
  );
}
