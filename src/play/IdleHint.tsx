import { useEffect, useState } from "react";
// Idle hint (spec §7.0, §4.5): after 5 s with no touch, a ghost hand shows
// one thing to try by tapping it once, then stays quiet for 30 s. Each
// activity marks its best first thing with data-hint.
export function IdleHint() {
  const [spot, setSpot] = useState<{ x: number; y: number; n: number } | null>(
    null,
  );
  useEffect(() => {
    let wait: ReturnType<typeof setTimeout>;
    let hide: ReturnType<typeof setTimeout>;
    let quietUntil = 0;
    const arm = () => {
      clearTimeout(wait);
      wait = setTimeout(show, Math.max(5000, quietUntil - Date.now()));
    };
    const show = () => {
      const stage = document.querySelector(".activity-stage");
      const el = [
        ...(stage?.querySelectorAll<HTMLElement>("[data-hint]") ?? []),
      ].find((e) => {
        const r = e.getBoundingClientRect();
        return (
          r.width > 0 &&
          r.bottom > 0 &&
          r.top < innerHeight &&
          !(e as HTMLButtonElement).disabled
        );
      });
      if (!el || document.hidden || document.querySelector(".modal-backdrop"))
        return arm();
      const r = el.getBoundingClientRect();
      const s = stage!.getBoundingClientRect();
      setSpot({
        x: r.left + r.width / 2 - s.left,
        y: r.top + r.height / 2 - s.top,
        n: Date.now(),
      });
      quietUntil = Date.now() + 30000;
      hide = setTimeout(() => setSpot(null), 2600);
      arm();
    };
    const touched = () => {
      setSpot(null);
      clearTimeout(hide);
      arm();
    };
    document.addEventListener("pointerdown", touched, true);
    document.addEventListener("keydown", touched, true);
    arm();
    return () => {
      clearTimeout(wait);
      clearTimeout(hide);
      document.removeEventListener("pointerdown", touched, true);
      document.removeEventListener("keydown", touched, true);
    };
  }, []);
  if (!spot) return null;
  return (
    <span
      className="ghost-hand"
      key={spot.n}
      style={{ left: spot.x, top: spot.y }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 60 70">
        <path
          d="M22 8a6 6 0 0 1 12 0v22l4-1a6 6 0 0 1 7 4l1 1a6 6 0 0 1 8 5l1 14q0 12-10 16H26q-8 0-12-8L4 40a6 6 0 0 1 9-7l9 8z"
          fill="#fff"
          stroke="#2E2A3B"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
