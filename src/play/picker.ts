import { useEffect, useRef, useState } from "react";
import type { PointerEvent as RP } from "react";
// Pick-up-and-place for preschool hands (spec §9.3). Every movable thing
// works two ways at once:
//  - tap it (it lifts and wiggles), then tap where it should go;
//  - or drag it there. If the finger slips off before reaching a
//    destination, the item stays picked up, so one tap on the
//    destination still finishes the move (our form of lift grace).
// Destinations are elements with data-drop="<id>"; a near miss within
// 60 px still counts.
type Drag = {
  id: string;
  pointer: number;
  x0: number;
  y0: number;
  dx: number;
  dy: number;
  el: HTMLElement;
  moved: boolean;
};
export function usePicker(
  onPlace: (item: string, target: string, x: number, y: number) => void,
  onPick?: (item: string) => void,
) {
  const [held, setHeld] = useState<string | null>(null);
  const drag = useRef<Drag | null>(null);
  const suppress = useRef(false);
  const place = useRef(onPlace);
  place.current = onPlace;
  const picked = useRef(onPick);
  picked.current = onPick;
  // A held item settles back after 8 s with no touch.
  useEffect(() => {
    if (!held) return;
    const t = setTimeout(() => setHeld(null), 8000);
    return () => clearTimeout(t);
  }, [held]);
  useEffect(() => {
    const cancel = () => {
      if (drag.current) drag.current.el.style.translate = "";
      drag.current = null;
    };
    window.addEventListener("blur", cancel);
    return () => window.removeEventListener("blur", cancel);
  }, []);
  function dropAt(x: number, y: number) {
    let best: { el: HTMLElement; d: number } | null = null;
    for (const el of document.querySelectorAll<HTMLElement>("[data-drop]")) {
      const r = el.getBoundingClientRect();
      const d = Math.hypot(
        Math.max(r.left - x, 0, x - r.right),
        Math.max(r.top - y, 0, y - r.bottom),
      );
      if (d <= 60 && (!best || d < best.d)) best = { el, d };
    }
    return best?.el.dataset.drop ?? null;
  }
  function item(id: string) {
    return {
      "data-item": id,
      "aria-pressed": held === id,
      onPointerDown: (e: RP<HTMLElement>) => {
        if (drag.current || e.button > 0) return;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        drag.current = {
          id,
          pointer: e.pointerId,
          x0: e.clientX,
          y0: e.clientY,
          dx: 0,
          dy: 0,
          el: e.currentTarget,
          moved: false,
        };
      },
      onPointerMove: (e: RP<HTMLElement>) => {
        const d = drag.current;
        if (!d || d.pointer !== e.pointerId) return;
        d.dx = e.clientX - d.x0;
        d.dy = e.clientY - d.y0;
        if (!d.moved && Math.hypot(d.dx, d.dy) > 12) {
          d.moved = true;
          d.el.classList.add("dragging");
          setHeld(id);
          picked.current?.(id);
        }
        if (d.moved) d.el.style.translate = `${d.dx}px ${d.dy}px`;
      },
      onPointerUp: (e: RP<HTMLElement>) => {
        const d = drag.current;
        if (!d || d.pointer !== e.pointerId) return;
        drag.current = null;
        d.el.style.translate = "";
        d.el.classList.remove("dragging");
        if (!d.moved) return;
        suppress.current = true;
        const target = dropAt(e.clientX, e.clientY);
        if (target) {
          setHeld(null);
          place.current(id, target, e.clientX, e.clientY);
        }
      },
      onPointerCancel: () => {
        if (drag.current) {
          drag.current.el.style.translate = "";
          drag.current.el.classList.remove("dragging");
        }
        drag.current = null;
      },
      onClick: () => {
        if (suppress.current) {
          suppress.current = false;
          return;
        }
        if (held === id) setHeld(null);
        else {
          setHeld(id);
          picked.current?.(id);
        }
      },
    };
  }
  function zone(id: string) {
    return {
      "data-drop": id,
      "data-armed": held ? "on" : undefined,
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        if (!held) return;
        const it = held;
        setHeld(null);
        place.current(it, id, e.clientX, e.clientY);
      },
    };
  }
  return { held, setHeld, item, zone };
}
