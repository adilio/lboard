import type { Preferences } from "../model";
// Spoken words use the device's own on-board voice (no network). The spec
// asks for recorded lines (§9.7); this is the stand-in until they exist.
// "names" speaks only content words (numbers, letters, names, colours).
let voice: SpeechSynthesisVoice | null | undefined;
function pickVoice() {
  if (voice !== undefined || !("speechSynthesis" in window)) return voice;
  const all = speechSynthesis.getVoices();
  if (!all.length) return null;
  const en = all.filter((v) => v.lang.startsWith("en"));
  voice =
    en.find((v) => /samantha|karen|moira|tessa|serena/i.test(v.name)) ||
    en.find((v) => v.localService) ||
    en[0] ||
    null;
  return voice;
}
if (typeof window !== "undefined" && "speechSynthesis" in window)
  speechSynthesis.addEventListener?.("voiceschanged", () => {
    voice = undefined;
  });
export function say(
  p: Preferences,
  text: string,
  kind: "word" | "prompt" = "word",
  opts: { pitch?: number; rate?: number; queue?: boolean } = {},
) {
  if (!p.soundEnabled || p.voice === "off" || document.hidden) return;
  if (p.voice === "names" && kind === "prompt") return;
  if (!("speechSynthesis" in window)) return;
  try {
    if (!opts.queue) speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice();
    if (v) u.voice = v;
    u.lang = v?.lang || "en-US";
    u.rate = opts.rate ?? 0.85;
    u.pitch = opts.pitch ?? 1.15;
    u.volume = Math.min(1, 0.4 + p.effectsVolume);
    speechSynthesis.speak(u);
  } catch {
    /* words are a bonus; play continues silently */
  }
}
export function hush() {
  try {
    speechSynthesis.cancel();
  } catch {
    /* unsupported */
  }
}
if (typeof document !== "undefined")
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) hush();
  });
