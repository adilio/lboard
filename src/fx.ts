// Touch feedback that makes the playroom feel like a real toy:
// - every touch answers with a small burst of confetti at the finger,
// - pressed toys squash and spring back,
// - elements marked .tilt lean towards the finger in 3D.
// Everything is caused by a touch; nothing loops on its own.
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  max: number;
  color: string;
  shape: 0 | 1 | 2;
  spin: number;
  angle: number;
};
const palette = [
  "#FFC94A",
  "#FF7A6B",
  "#3BA7E0",
  "#6CC07A",
  "#8C6BE0",
  "#E05A8C",
  "#5FD3B5",
];
const springy = "cubic-bezier(.34,1.56,.64,1)";
export function reducedMotion() {
  return (
    document.documentElement.dataset.reduced === "true" ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
export function squash(el: Element, strength = 1) {
  if (reducedMotion() || !("animate" in el)) return;
  const s = 0.1 * strength;
  el.animate(
    [
      { scale: "1 1" },
      { scale: `${1 + s * 0.6} ${1 - s}`, offset: 0.25 },
      { scale: `${1 - s * 0.4} ${1 + s * 0.5}`, offset: 0.6 },
      { scale: "1 1" },
    ],
    { duration: 420, easing: "ease-out" },
  );
}
export function bounceIn(el: Element) {
  if (reducedMotion() || !("animate" in el)) return;
  el.animate(
    [
      { scale: "0.3", opacity: 0 },
      { scale: "1.12", opacity: 1, offset: 0.6 },
      { scale: "1" },
    ],
    { duration: 480, easing: springy },
  );
}
export function startTouchFX(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const particles: Particle[] = [];
  let raf = 0;
  let last = 0;
  let tilted: HTMLElement | null = null;
  const resize = () => {
    const d = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * d;
    canvas.height = innerHeight * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
  };
  resize();
  const star = (r: number) => {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const rr = i % 2 ? r * 0.45 : r;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
  };
  const frame = (t: number) => {
    const dt = Math.min(0.05, (t - (last || t)) / 1000);
    last = t;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += dt;
      if (p.life >= p.max) {
        particles.splice(i, 1);
        continue;
      }
      p.vy += 900 * dt * (p.shape === 2 ? 0 : 1);
      p.vx *= 1 - 2.2 * dt;
      p.vy *= 1 - 1.4 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.angle += p.spin * dt;
      const k = p.life / p.max;
      ctx.save();
      ctx.globalAlpha = 1 - k * k;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;
      if (p.shape === 2) {
        ctx.lineWidth = 4 * (1 - k);
        ctx.beginPath();
        ctx.arc(0, 0, p.r + k * 46, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === 1) star(p.r * (1 - k * 0.4));
      else {
        ctx.beginPath();
        ctx.arc(0, 0, p.r * (1 - k * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    raf = particles.length ? requestAnimationFrame(frame) : 0;
    if (!raf) {
      last = 0;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
    }
  };
  const burst = (x: number, y: number, tint: string, big: boolean) => {
    const calm = reducedMotion();
    particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      r: 10,
      life: 0,
      max: 0.45,
      color: tint || "#FFFFFF",
      shape: 2,
      spin: 0,
      angle: 0,
    });
    if (!calm) {
      const n = big ? 14 : 7;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
        const v = (big ? 380 : 240) * (0.6 + Math.random() * 0.6);
        particles.push({
          x,
          y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - 160,
          r: 4 + Math.random() * (big ? 7 : 4),
          life: 0,
          max: 0.6 + Math.random() * 0.35,
          color:
            i % 3 === 0 && tint
              ? tint
              : palette[(Math.random() * palette.length) | 0],
          shape: Math.random() < 0.35 ? 1 : 0,
          spin: (Math.random() - 0.5) * 10,
          angle: Math.random() * 6,
        });
      }
    }
    if (particles.length > 220) particles.splice(0, particles.length - 220);
    if (!raf) raf = requestAnimationFrame(frame);
  };
  const lean = (el: HTMLElement, x: number, y: number) => {
    const r = el.getBoundingClientRect();
    const dx = (x - r.left) / r.width - 0.5;
    const dy = (y - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${(dx * 16).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${(-dy * 16).toFixed(2)}deg`);
    el.style.setProperty("--gx", `${((dx + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${((dy + 0.5) * 100).toFixed(1)}%`);
  };
  const unlean = () => {
    if (!tilted) return;
    tilted.style.removeProperty("--rx");
    tilted.style.removeProperty("--ry");
    tilted = null;
  };
  const down = (e: PointerEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target || target.closest(".modal-backdrop")) return;
    const card = target.closest<HTMLElement>(".tilt");
    if (card && !reducedMotion()) {
      tilted = card;
      lean(card, e.clientX, e.clientY);
    }
    const button = target.closest<HTMLElement>("button:not(:disabled)");
    const tint = button
      ? getComputedStyle(button).getPropertyValue("--area").trim()
      : "";
    if (target.tagName !== "CANVAS")
      burst(
        e.clientX,
        e.clientY,
        tint,
        !!button?.closest(".area-card, .activity-card"),
      );
    // Big play surfaces, instruments and movable pieces have their own feel.
    const own =
      ".sky-hit, .tub, .canvas-hit, .station-zone, .peg-spot, .crank-spot, .placed-hit, .float-bubble, .bar, .kit, .balloon, .door-swing, .door-leaf, .k-item, [data-item]";
    if (button && !button.matches(own))
      squash(button.closest(".tilt") ?? button);
  };
  const move = (e: PointerEvent) => {
    if (reducedMotion() || (e.pointerType === "touch" && !e.pressure)) return;
    const el = (e.target as HTMLElement | null)?.closest<HTMLElement>(".tilt");
    if (el !== tilted) unlean();
    if (!el) return;
    tilted = el;
    lean(el, e.clientX, e.clientY);
  };
  document.addEventListener("pointerdown", down, true);
  document.addEventListener("pointermove", move, { passive: true });
  document.addEventListener("pointerup", unlean, true);
  document.addEventListener("pointercancel", unlean, true);
  document.addEventListener("pointerleave", unlean);
  window.addEventListener("resize", resize);
  return () => {
    cancelAnimationFrame(raf);
    document.removeEventListener("pointerdown", down, true);
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerup", unlean, true);
    document.removeEventListener("pointercancel", unlean, true);
    document.removeEventListener("pointerleave", unlean);
    window.removeEventListener("resize", resize);
  };
}
