import { useState } from "react";
import type { Preferences } from "../model";
import { animal, sfx } from "../audio";
import { Critter } from "../play/Critter";
import type { CritterKind, Mood } from "../play/Critter";
import { Thing } from "../play/Things";
import type { ThingKind } from "../play/Things";
import { usePicker } from "../play/picker";
import { say } from "../play/speech";
import { useSaved } from "../play/store";
// G4 Teddy Care Clinic: toy patients come in with something small and not
// scary (a sniffle, a rumbly tummy, a loose button, a scraped knee). Every
// tool gets a reaction; the most helpful ones make the patient visibly
// happier, and after three kind helps the patient waves and goes home.
// Empathy, caring and doctor-visit words; no needles, no blood.
type Tool =
  | "thermometer"
  | "bandage"
  | "stethoscope"
  | "tissue"
  | "water"
  | "blanket";
const tools: Tool[] = [
  "thermometer",
  "stethoscope",
  "bandage",
  "tissue",
  "water",
  "blanket",
];
const patients: {
  kind: CritterKind;
  name: string;
  problem: string;
  helps: Tool[];
}[] = [
  {
    kind: "teddy",
    name: "Teddy",
    problem: "sniffle",
    helps: ["tissue", "blanket", "water", "thermometer"],
  },
  {
    kind: "rabbit",
    name: "Bunny",
    problem: "tummy",
    helps: ["water", "blanket", "stethoscope", "thermometer"],
  },
  {
    kind: "robot",
    name: "Robot",
    problem: "button",
    helps: ["bandage", "stethoscope", "thermometer"],
  },
  {
    kind: "dragon",
    name: "Dragon",
    problem: "knee",
    helps: ["bandage", "water", "blanket", "tissue"],
  },
];
const key = "Teddy Care Clinic";
export default function TeddyCareClinic({ prefs }: { prefs: Preferences }) {
  const [ix, setIx] = useSaved(key + ":patient", () => 0);
  const [care, setCare] = useState(0);
  const [used, setUsed] = useState<Tool[]>([]);
  const [effect, setEffect] = useState<{ tool: Tool; n: number } | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [msg, setMsg] = useState("");
  const p = patients[ix % patients.length];
  const mood: Mood =
    leaving || care >= 3
      ? "happy"
      : care === 0
        ? "unwell"
        : care === 1
          ? "neutral"
          : "happy";
  const picker = usePicker((tool, target) => {
    if (target === "patient") treat(tool as Tool);
  });
  function treat(tool: Tool) {
    if (leaving) return;
    setEffect({ tool, n: Date.now() });
    const helpful = p.helps.includes(tool) && !used.includes(tool);
    setUsed((u) => [...u, tool]);
    const sounds: Record<Tool, () => void> = {
      thermometer: () => sfx(prefs, "beep"),
      stethoscope: () =>
        p.kind === "robot" ? sfx(prefs, "beep") : sfx(prefs, "heartbeat"),
      bandage: () => sfx(prefs, "click", 0.7),
      tissue: () => sfx(prefs, "sneeze"),
      water: () => sfx(prefs, "glug"),
      blanket: () => sfx(prefs, "whoosh", 0.5),
    };
    sounds[tool]();
    const lines: Record<Tool, string> = {
      thermometer: "Just right!",
      stethoscope: p.kind === "robot" ? "Beep beep, all good!" : "Thump thump!",
      bandage: "All better.",
      tissue: "Achoo! Thank you.",
      water: "Gulp gulp. Ahh.",
      blanket: "So cosy.",
    };
    if (helpful) {
      const c = care + 1;
      setCare(c);
      setMsg(`${p.name}: ${lines[tool]}`);
      setTimeout(() => say(prefs, lines[tool], "prompt"), 400);
      if (c >= 3) {
        setTimeout(() => {
          setLeaving(true);
          animal(prefs, p.kind);
          sfx(prefs, "tada");
          say(prefs, `Thank you! ${p.name} feels better!`, "prompt");
          setMsg(`${p.name} feels better and waves goodbye!`);
        }, 1400);
        setTimeout(() => {
          setIx((i) => i + 1);
          setCare(0);
          setUsed([]);
          setEffect(null);
          setLeaving(false);
          setTimeout(() => sfx(prefs, "clink", 1.3), 200);
        }, 4200);
      }
    } else {
      setMsg(`${p.name} giggles.`);
      setTimeout(() => sfx(prefs, "boing", 1.3), 300);
    }
  }
  const has = (t: Tool) => used.includes(t);
  return (
    <div className="act act-clinic">
      <div className="clinic-room">
        <div className="clinic-window" aria-hidden="true" />
        <div
          className={`patient-spot ${leaving ? "leaving" : "arriving"}`}
          key={ix}
        >
          <button
            className={`patient prob-${p.problem} ${effect ? `fx-${effect.tool}` : ""}`}
            key={effect?.n ?? 0}
            aria-label={`${p.name}, the patient`}
            data-hint
            {...picker.zone("patient")}
          >
            <Critter kind={p.kind} mood={mood} />
            {p.problem === "sniffle" && !has("tissue") && (
              <span className="drip" aria-hidden="true" />
            )}
            {p.problem === "tummy" && care < 2 && (
              <span className="rumble-lines" aria-hidden="true" />
            )}
            {p.problem === "button" && !has("bandage") && (
              <span className="loose-button" aria-hidden="true" />
            )}
            {p.problem === "knee" && !has("bandage") && (
              <span className="scrape" aria-hidden="true" />
            )}
            {has("bandage") && (
              <span
                className={`stuck-bandage on-${p.problem}`}
                aria-hidden="true"
              />
            )}
            {has("blanket") && (
              <span className="blanket-on" aria-hidden="true" />
            )}
            {effect?.tool === "thermometer" && (
              <span className="thermo-readout" aria-hidden="true">
                ☺
              </span>
            )}
            {effect?.tool === "stethoscope" && (
              <span className="heart-beat" aria-hidden="true">
                ♥
              </span>
            )}
            {leaving && <span className="wave-hand" aria-hidden="true" />}
          </button>
          <span className="exam-bed" aria-hidden="true" />
        </div>
        <div className="care-hearts" aria-label={`${care} of 3 helps`}>
          {[0, 1, 2].map((i) => (
            <i key={i} className={i < care ? "full" : ""} />
          ))}
        </div>
      </div>
      <div className="tool-tray clinic-tools">
        {tools.map((t) => (
          <button
            key={t}
            className="clinic-tool"
            aria-label={t[0].toUpperCase() + t.slice(1)}
            {...picker.item(t)}
          >
            <Thing kind={t as ThingKind} />
          </button>
        ))}
      </div>
      <p className="sr-status" role="status">
        {msg}
      </p>
    </div>
  );
}
