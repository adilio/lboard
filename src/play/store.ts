import { useCallback, useState } from "react";
// Session memory for activities: what she made stays while she visits other
// places, and is gone on reload (spec: the app reopens on the map).
const saved = new Map<string, unknown>();
export function useSaved<T>(
  key: string,
  init: () => T,
): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() =>
    saved.has(key) ? (saved.get(key) as T) : init(),
  );
  const set = useCallback(
    (next: T | ((prev: T) => T)) =>
      setValue((prev) => {
        const v =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        saved.set(key, v);
        return v;
      }),
    [key],
  );
  return [value, set];
}
export function clearSaved(prefix: string) {
  for (const k of [...saved.keys()])
    if (k === prefix || k.startsWith(prefix + ":")) saved.delete(k);
}
export const pick = <T>(list: readonly T[]) =>
  list[Math.floor(Math.random() * list.length)];
export function shuffle<T>(list: readonly T[]) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
