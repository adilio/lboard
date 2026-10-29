import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Preferences } from "../model";
import { animal, sfx } from "../audio";
import { say } from "../play/speech";
import { shuffle, useSaved } from "../play/store";
// A1 Light Switch Wall: five kinds of switch wired to five things in a
// little dollhouse. The wiring is shuffled each visit, so the fun is
// predicting and testing which switch does what. All off = night, and a
// sleepy cat opens its eyes.
type Sw = "rocker" | "toggle" | "cord" | "push" | "dimmer";
type Target = "lamp" | "fairy" | "fish" | "lantern" | "window";
const switches: { id: Sw; label: string }[] = [
  { id: "rocker", label: "Rocker switch" },
  { id: "toggle", label: "Toggle switch" },
  { id: "cord", label: "Pull cord" },
  { id: "push", label: "Push button" },
  { id: "dimmer", label: "Dimmer" },
];
const targets: Target[] = ["lamp", "fairy", "fish", "lantern", "window"];
const targetNames: Record<Target, string> = {
  lamp: "the lamp",
  fairy: "the fairy lights",
  fish: "the fish tank",
  lantern: "the porch lantern",
  window: "the star window",
};
const wireColours = ["#FF7A6B", "#3BA7E0", "#FFC94A", "#6CC07A", "#8C6BE0"];
const key = "Light Switch Wall";
export default function LightSwitchWall({ prefs }: { prefs: Preferences }) {
  const [wiring] = useSaved(key + ":wiring", () => shuffle(targets));
  const [on, setOn] = useSaved<Record<Sw, number>>(key + ":on", () => ({
    rocker: 1,
    toggle: 1,
    cord: 1,
    push: 1,
    dimmer: 0.8,
  }));
  const [pulse, setPulse] = useState<{ sw: Sw; n: number } | null>(null);
  const [cordPull, setCordPull] = useState(0);
  const [catMeow, setCatMeow] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const [wires, setWires] = useState<{ d: string; sw: Sw }[]>([]);
  const level = (t: Target) => {
    const sw = switches[wiring.indexOf(t)].id;
    return on[sw];
  };
  const night = targets.every((t) => level(t) < 0.05);
  const lit = targets.reduce((s, t) => s + Math.min(1, level(t)), 0) / 5;
  // Draw wires from each switch to the thing it powers.
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const draw = () => {
      const box = el.getBoundingClientRect();
      setWires(
        switches.map((s, i) => {
          const a = el
            .querySelector(`[data-sw="${s.id}"]`)
            ?.getBoundingClientRect();
          const b = el
            .querySelector(`[data-target="${wiring[i]}"]`)
            ?.getBoundingClientRect();
          if (!a || !b) return { d: "", sw: s.id };
          const x1 = a.right - box.left - 6,
            y1 = a.top + a.height / 2 - box.top;
          const x2 = b.left + b.width / 2 - box.left,
            y2 = b.top + b.height / 2 - box.top;
          const mx = (x1 + x2) / 2;
          return {
            d: `M${x1} ${y1}C${mx} ${y1} ${mx - 40} ${y2} ${x2} ${y2}`,
            sw: s.id,
          };
        }),
      );
    };
    draw();
    // Measure again once the zoom-in transition has settled.
    const settle = setTimeout(draw, 700);
    const ro = new ResizeObserver(draw);
    ro.observe(el);
    return () => {
      clearTimeout(settle);
      ro.disconnect();
    };
  }, [wiring]);
  const wasNight = useRef(night);
  useEffect(() => {
    if (night && !wasNight.current) {
      sfx(prefs, "snore", 1.4);
      say(prefs, "Goodnight!", "prompt", { queue: true });
    }
    if (!night && wasNight.current) sfx(prefs, "sparkle");
    wasNight.current = night;
  }, [night, prefs]);
  function flip(sw: Sw, value?: number) {
    const next = value ?? (on[sw] ? 0 : 1);
    setOn((o) => ({ ...o, [sw]: next }));
    setPulse({ sw, n: Date.now() });
    const sound: Record<Sw, () => void> = {
      rocker: () => sfx(prefs, "thunk", next ? 1.2 : 0.9),
      toggle: () => sfx(prefs, "click", next ? 1.3 : 1),
      cord: () => {
        sfx(prefs, "zip", 1.2);
        setTimeout(() => sfx(prefs, "click", 0.8), 120);
      },
      push: () => sfx(prefs, "click", next ? 0.7 : 0.6),
      dimmer: () => sfx(prefs, "tick", 0.8 + next * 0.6),
    };
    sound[sw]();
  }
  const T = (t: Target) => Math.min(1, level(t));
  return (
    <div className={`act act-lights ${night ? "is-night" : ""}`} ref={root}>
      <div
        className="switch-board"
        style={{ "--lit": lit } as React.CSSProperties}
      >
        <div className="sw-row">
          <button
            role="switch"
            aria-checked={!!on.rocker}
            aria-label="Rocker switch"
            data-sw="rocker"
            data-hint
            className={`sw sw-rocker ${on.rocker ? "on" : ""}`}
            onClick={() => flip("rocker")}
          >
            <span className="rocker-plate">
              <i />
            </span>
          </button>
          <button
            role="switch"
            aria-checked={!!on.toggle}
            aria-label="Toggle switch"
            data-sw="toggle"
            className={`sw sw-toggle ${on.toggle ? "on" : ""}`}
            onClick={() => flip("toggle")}
          >
            <span className="toggle-plate">
              <i />
            </span>
          </button>
        </div>
        <div className="sw-row">
          <button
            role="switch"
            aria-checked={!!on.cord}
            aria-label="Pull cord"
            data-sw="cord"
            className={`sw sw-cord ${on.cord ? "on" : ""}`}
            onClick={() => {
              flip("cord");
              setCordPull((n) => n + 1);
            }}
          >
            <span className="cord-line" key={cordPull}>
              <i />
            </span>
          </button>
          <button
            role="switch"
            aria-checked={!!on.push}
            aria-label="Push button"
            data-sw="push"
            className={`sw sw-push ${on.push ? "on" : ""}`}
            onClick={() => flip("push")}
          >
            <span className="push-cap" />
          </button>
        </div>
        <label className="sw sw-dimmer" data-sw="dimmer">
          <span aria-hidden="true">☾</span>
          <input
            type="range"
            aria-label="Dimmer"
            min="0"
            max="1"
            step="0.05"
            value={on.dimmer}
            onChange={(e) => flip("dimmer", +e.target.value)}
          />
          <span aria-hidden="true">☀</span>
        </label>
      </div>
      <svg className="wires" aria-hidden="true">
        {wires.map((w, i) => (
          <g key={w.sw}>
            <path d={w.d} className="wire" stroke={wireColours[i]} />
            {pulse?.sw === w.sw && on[w.sw] > 0 && (
              <path
                key={pulse.n}
                d={w.d}
                className="wire-pulse"
                stroke="#FFF6B0"
              />
            )}
          </g>
        ))}
      </svg>
      <div
        className="dollhouse"
        style={{ "--lit": lit } as React.CSSProperties}
      >
        <svg viewBox="0 0 600 520" role="img" aria-label="A little house">
          <defs>
            <radialGradient id="lampGlow">
              <stop offset="0" stopColor="#FFF3A8" stopOpacity=".95" />
              <stop offset="1" stopColor="#FFF3A8" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* sky behind the house */}
          <rect
            width="600"
            height="520"
            fill={night ? "#1E2650" : "#BDE7FF"}
            className="fade"
          />
          {night &&
            [80, 150, 520, 560, 40].map((x, i) => (
              <circle key={i} cx={x} cy={30 + i * 22} r="2.5" fill="#FFF6C9" />
            ))}
          <path d="M60 170 300 40l240 130z" fill="#E8604F" />
          <path d="M60 170 300 40l240 130h-36L300 62 96 170z" fill="#C2483A" />
          <rect x="80" y="166" width="440" height="330" fill="#FFE2BC" />
          <rect x="80" y="320" width="440" height="12" fill="#C98A55" />
          {/* upstairs: fairy lights + star window */}
          <rect x="96" y="182" width="408" height="132" fill="#FFF1DE" />
          <path
            d="M110 200Q200 240 300 200T490 200"
            fill="none"
            stroke="#6B5550"
            strokeWidth="3"
          />
          <g data-target="fairy">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
              const x = 120 + i * 45;
              const y = 200 + Math.sin(i * 0.9) * 14 + 8;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="8"
                  fill={
                    ["#FF7A6B", "#FFC94A", "#3BA7E0", "#6CC07A", "#E05A8C"][
                      i % 5
                    ]
                  }
                  opacity={0.25 + T("fairy") * 0.75}
                  style={{
                    filter:
                      T("fairy") > 0.05
                        ? "drop-shadow(0 0 8px currentColor)"
                        : "none",
                  }}
                />
              );
            })}
          </g>
          <g data-target="window">
            <circle cx="420" cy="262" r="40" fill="#2E2A3B" />
            <circle
              cx="420"
              cy="262"
              r="34"
              fill={T("window") > 0.05 ? "#3B4A8A" : "#4A4560"}
            />
            <g opacity={T("window")}>
              <circle cx="432" cy="250" r="12" fill="#FFF6C9" />
              <circle cx="438" cy="246" r="10" fill="#3B4A8A" />
              {[
                [404, 248],
                [410, 276],
                [430, 280],
                [398, 266],
              ].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="2.6" fill="#FFF6C9" />
              ))}
            </g>
          </g>
          <rect x="140" y="270" width="110" height="40" rx="8" fill="#8C6BE0" />
          <rect x="140" y="256" width="40" height="22" rx="8" fill="#fff" />
          {/* downstairs: ceiling lamp + fish tank */}
          <rect x="96" y="336" width="408" height="160" fill="#FFF8EC" />
          <g data-target="lamp">
            <path d="M200 336v26" stroke="#6B5550" strokeWidth="4" />
            <path d="M174 382q26-34 52 0z" fill="#FFC94A" />
            <ellipse
              cx="200"
              cy="440"
              rx="90"
              ry="70"
              fill="url(#lampGlow)"
              opacity={T("lamp")}
            />
            <circle
              cx="200"
              cy="384"
              r="8"
              fill={T("lamp") > 0.05 ? "#FFF3A8" : "#CDBFA8"}
            />
          </g>
          <rect
            x="130"
            y="456"
            width="140"
            height="32"
            rx="10"
            fill="#6CC07A"
          />
          <g data-target="fish">
            <rect
              x="340"
              y="400"
              width="130"
              height="80"
              rx="10"
              fill={T("fish") > 0.05 ? "#5FD3B5" : "#7A869A"}
              opacity={0.5 + T("fish") * 0.5}
            />
            <rect
              x="340"
              y="400"
              width="130"
              height="80"
              rx="10"
              fill="none"
              stroke="#2E2A3B"
              strokeWidth="5"
            />
            <g className={T("fish") > 0.05 ? "fish-swim" : ""}>
              <path
                d="M380 440q16-14 30 0q-14 14-30 0zm30 0 12-10v20z"
                fill="#FF9F5A"
              />
            </g>
            <g className={T("fish") > 0.05 ? "fish-swim fish-two" : ""}>
              <path
                d="M420 462q12-10 22 0q-10 10-22 0zm22 0 9-7v14z"
                fill="#FFC94A"
              />
            </g>
            <rect x="350" y="480" width="110" height="10" fill="#8A5A36" />
          </g>
          {/* porch */}
          <rect x="520" y="400" width="60" height="96" fill="#C98A55" />
          <g data-target="lantern">
            <circle
              cx="550"
              cy="380"
              r="60"
              fill="url(#lampGlow)"
              opacity={T("lantern")}
            />
            <rect
              x="538"
              y="360"
              width="24"
              height="34"
              rx="6"
              fill={T("lantern") > 0.05 ? "#FFE08A" : "#8A7E70"}
              stroke="#2E2A3B"
              strokeWidth="4"
            />
          </g>
          {/* night dimmer over everything */}
          <rect
            x="0"
            y="0"
            width="600"
            height="520"
            fill="#141838"
            opacity={night ? 0.55 : (1 - lit) * 0.35}
            pointerEvents="none"
            className="fade"
          />
          {night && (
            <g className="cat-eyes">
              <ellipse cx="290" cy="470" rx="8" ry="10" fill="#FFE66D" />
              <ellipse cx="316" cy="470" rx="8" ry="10" fill="#FFE66D" />
              <ellipse cx="290" cy="470" rx="2.5" ry="8" fill="#2E2A3B" />
              <ellipse cx="316" cy="470" rx="2.5" ry="8" fill="#2E2A3B" />
            </g>
          )}
        </svg>
        {night && (
          <button
            className="cat-button"
            aria-label="Sleepy cat"
            key={catMeow}
            onClick={() => {
              animal(prefs, "cat");
              setCatMeow((n) => n + 1);
            }}
          />
        )}
      </div>
      <p className="sr-status" role="status">
        {night
          ? "All the lights are off. Goodnight!"
          : switches
              .filter((s) => on[s.id] > 0.05)
              .map(
                (s) =>
                  `${s.label} lights ${targetNames[wiring[switches.indexOf(s)]]}`,
              )
              .join(". ")}
      </p>
    </div>
  );
}
