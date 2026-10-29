// One shared character rig (spec §12.6): big head, small body, dot eyes and
// a mouth that changes with mood. Original designs; no reference app art.
export type Mood =
  | "neutral"
  | "happy"
  | "yum"
  | "chew"
  | "bleh"
  | "sleep"
  | "surprised"
  | "unwell";
export type CritterKind =
  | "rabbit"
  | "dog"
  | "bird"
  | "horse"
  | "cow"
  | "pig"
  | "sheep"
  | "duck"
  | "chick"
  | "cat"
  | "frog"
  | "bear"
  | "teddy"
  | "robot"
  | "dragon"
  | "owl"
  | "mouse";
const ink = "#2E2A3B";
type Look = {
  body: string;
  belly: string;
  head?: string;
  muzzle?: string;
  nose?: string;
  beak?: string;
};
const looks: Record<CritterKind, Look> = {
  rabbit: { body: "#FFF8EC", belly: "#FFE3EA", nose: "#FF8FB0" },
  dog: { body: "#E0A86B", belly: "#FFE2BC", muzzle: "#FFE2BC", nose: ink },
  bird: { body: "#3BA7E0", belly: "#BDE7FF", beak: "#FFB020" },
  horse: {
    body: "#B8794A",
    belly: "#E8B98A",
    muzzle: "#E8B98A",
    nose: "#8A5A36",
  },
  cow: {
    body: "#FFFFFF",
    belly: "#FFFFFF",
    muzzle: "#FFB3C7",
    nose: "#E07A9A",
  },
  pig: {
    body: "#FFB3C7",
    belly: "#FFD3DF",
    muzzle: "#FF8FB0",
    nose: "#E0607F",
  },
  sheep: {
    body: "#FFF8EC",
    belly: "#FFF8EC",
    head: "#6B5550",
    nose: "#3A2E2C",
  },
  duck: { body: "#FFD54A", belly: "#FFE88A", beak: "#FF9F3A" },
  chick: { body: "#FFE66D", belly: "#FFF3B0", beak: "#FF9F3A" },
  cat: { body: "#FFB36B", belly: "#FFE2BC", nose: "#FF8FB0" },
  frog: { body: "#7ED07A", belly: "#D7F5C9" },
  bear: { body: "#A0683C", belly: "#E0B07A", muzzle: "#E0B07A", nose: ink },
  teddy: {
    body: "#D9A066",
    belly: "#FFE2BC",
    muzzle: "#FFE2BC",
    nose: "#6B4A2E",
  },
  robot: { body: "#B8C4D6", belly: "#DDE5F0" },
  dragon: { body: "#6CC07A", belly: "#FFE66D", nose: "#3F8F4F" },
  owl: { body: "#A0683C", belly: "#F3D7A8", beak: "#FFB020" },
  mouse: { body: "#C9C2D6", belly: "#EFEAF5", nose: "#FF8FB0" },
};
function Ears({ kind, c }: { kind: CritterKind; c: Look }) {
  const h = c.head || c.body;
  switch (kind) {
    case "rabbit":
      return (
        <>
          <ellipse
            cx="74"
            cy="34"
            rx="14"
            ry="38"
            fill={h}
            transform="rotate(-10 74 34)"
          />
          <ellipse
            cx="126"
            cy="34"
            rx="14"
            ry="38"
            fill={h}
            transform="rotate(10 126 34)"
          />
          <ellipse
            cx="74"
            cy="36"
            rx="6"
            ry="26"
            fill="#FFB3C7"
            transform="rotate(-10 74 36)"
          />
          <ellipse
            cx="126"
            cy="36"
            rx="6"
            ry="26"
            fill="#FFB3C7"
            transform="rotate(10 126 36)"
          />
        </>
      );
    case "dog":
      return (
        <>
          <ellipse
            cx="46"
            cy="86"
            rx="18"
            ry="34"
            fill="#8A5A36"
            transform="rotate(18 46 86)"
          />
          <ellipse
            cx="154"
            cy="86"
            rx="18"
            ry="34"
            fill="#8A5A36"
            transform="rotate(-18 154 86)"
          />
        </>
      );
    case "cat":
      return (
        <>
          <path d="M50 70 56 22 92 50z" fill={h} />
          <path d="M150 70 144 22 108 50z" fill={h} />
          <path d="M58 58 61 34 80 50z" fill="#FFB3C7" />
          <path d="M142 58 139 34 120 50z" fill="#FFB3C7" />
        </>
      );
    case "bear":
    case "teddy":
      return (
        <>
          <circle cx="56" cy="46" r="20" fill={h} />
          <circle cx="144" cy="46" r="20" fill={h} />
          <circle cx="56" cy="46" r="10" fill={c.belly} />
          <circle cx="144" cy="46" r="10" fill={c.belly} />
        </>
      );
    case "mouse":
      return (
        <>
          <circle cx="50" cy="48" r="28" fill={h} />
          <circle cx="150" cy="48" r="28" fill={h} />
          <circle cx="50" cy="48" r="16" fill="#FFC9D9" />
          <circle cx="150" cy="48" r="16" fill="#FFC9D9" />
        </>
      );
    case "pig":
      return (
        <>
          <path d="M52 56 50 24 82 44z" fill={h} />
          <path d="M148 56 150 24 118 44z" fill={h} />
        </>
      );
    case "cow":
      return (
        <>
          <path
            d="M60 42q-14-20 2-28"
            stroke="#FFE2A8"
            strokeWidth="9"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M140 42q14-20-2-28"
            stroke="#FFE2A8"
            strokeWidth="9"
            fill="none"
            strokeLinecap="round"
          />
          <ellipse
            cx="40"
            cy="70"
            rx="18"
            ry="10"
            fill={h}
            transform="rotate(-20 40 70)"
          />
          <ellipse
            cx="160"
            cy="70"
            rx="18"
            ry="10"
            fill={h}
            transform="rotate(20 160 70)"
          />
        </>
      );
    case "horse":
      return (
        <>
          <path d="M62 50 58 18 86 40z" fill={h} />
          <path d="M138 50 142 18 114 40z" fill={h} />
          <path d="M84 36q16-22 34-2q-6 10-34 2z" fill="#5A3A22" />
        </>
      );
    case "sheep":
      return (
        <>
          {[40, 60, 80, 100, 120, 140, 160].map((x, i) => (
            <circle key={i} cx={x} cy={i % 2 ? 44 : 54} r="22" fill="#FFF8EC" />
          ))}
          <ellipse
            cx="44"
            cy="92"
            rx="18"
            ry="9"
            fill={c.head}
            transform="rotate(-20 44 92)"
          />
          <ellipse
            cx="156"
            cy="92"
            rx="18"
            ry="9"
            fill={c.head}
            transform="rotate(20 156 92)"
          />
        </>
      );
    case "dragon":
      return (
        <>
          <path d="M66 44 60 10 86 36z" fill="#FFC94A" />
          <path d="M134 44 140 10 114 36z" fill="#FFC94A" />
          <path d="M92 36l8-16 8 16z" fill="#3F8F4F" />
        </>
      );
    case "robot":
      return (
        <>
          <path d="M100 34V12" stroke="#7A869A" strokeWidth="5" />
          <circle cx="100" cy="10" r="8" fill="#FF7A6B" />
          <rect x="30" y="80" width="14" height="28" rx="5" fill="#7A869A" />
          <rect x="156" y="80" width="14" height="28" rx="5" fill="#7A869A" />
        </>
      );
    case "owl":
      return (
        <>
          <path d="M52 52 50 22 80 42z" fill={h} />
          <path d="M148 52 150 22 120 42z" fill={h} />
        </>
      );
    case "duck":
    case "chick":
      return <path d="M96 36q4-16 14-10q-6 2-8 12z" fill={c.body} />;
    case "bird":
      return <path d="M92 38q2-18 16-14q-8 4-6 14z" fill="#FF7A6B" />;
    default:
      return null;
  }
}
function Eyes({ mood, kind }: { mood: Mood; kind: CritterKind }) {
  const big = kind === "owl" || kind === "frog";
  const y = kind === "frog" ? 54 : kind === "horse" || kind === "cow" ? 82 : 90;
  const gap = kind === "frog" ? 30 : 22;
  const L = 100 - gap,
    R = 100 + gap;
  if (kind === "owl")
    return (
      <>
        <circle cx={L} cy={y} r="20" fill="#FFF8EC" />
        <circle cx={R} cy={y} r="20" fill="#FFF8EC" />
        {mood === "sleep" || mood === "happy" ? (
          <path
            d={`M${L - 10} ${y}q10 ${mood === "happy" ? -10 : 8} 20 0M${R - 10} ${y}q10 ${mood === "happy" ? -10 : 8} 20 0`}
            stroke={ink}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
        ) : (
          <>
            <circle cx={L} cy={y} r="9" fill={ink} />
            <circle cx={R} cy={y} r="9" fill={ink} />
            <circle cx={L + 3} cy={y - 3} r="3" fill="#fff" />
            <circle cx={R + 3} cy={y - 3} r="3" fill="#fff" />
          </>
        )}
      </>
    );
  const frogBumps = kind === "frog" && (
    <>
      <circle cx={L} cy={y} r="22" fill="#7ED07A" />
      <circle cx={R} cy={y} r="22" fill="#7ED07A" />
      <circle cx={L} cy={y} r="14" fill="#fff" />
      <circle cx={R} cy={y} r="14" fill="#fff" />
    </>
  );
  if (kind === "robot")
    return (
      <>
        <rect
          x={L - 14}
          y={y - 12}
          width="28"
          height="24"
          rx="6"
          fill="#2E3A55"
        />
        <rect
          x={R - 14}
          y={y - 12}
          width="28"
          height="24"
          rx="6"
          fill="#2E3A55"
        />
        {mood === "sleep" ? (
          <path
            d={`M${L - 8} ${y}h16M${R - 8} ${y}h16`}
            stroke="#7FE0FF"
            strokeWidth="4"
          />
        ) : mood === "happy" ? (
          <path
            d={`M${L - 8} ${y + 3}q8-10 16 0M${R - 8} ${y + 3}q8-10 16 0`}
            stroke="#7FE0FF"
            strokeWidth="4"
            fill="none"
          />
        ) : (
          <>
            <circle
              cx={L}
              cy={y}
              r={mood === "surprised" ? 8 : 6}
              fill="#7FE0FF"
            />
            <circle
              cx={R}
              cy={y}
              r={mood === "surprised" ? 8 : 6}
              fill="#7FE0FF"
            />
          </>
        )}
      </>
    );
  const shut = (up: boolean) =>
    `M${L - 9} ${y}q9 ${up ? -10 : 8} 18 0M${R - 9} ${y}q9 ${up ? -10 : 8} 18 0`;
  let eyes;
  if (mood === "happy" || mood === "chew")
    eyes = (
      <path
        d={shut(true)}
        stroke={ink}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
    );
  else if (mood === "sleep")
    eyes = (
      <path
        d={shut(false)}
        stroke={ink}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
    );
  else if (mood === "bleh")
    eyes = (
      <path
        d={`M${L - 8} ${y - 7}l14 7-14 7M${R + 8} ${y - 7}l-14 7 14 7`}
        stroke={ink}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  else {
    const r = mood === "surprised" ? 9 : big ? 8 : 7;
    eyes = (
      <>
        <ellipse cx={L} cy={y} rx={r} ry={r * 1.15} fill={ink} />
        <ellipse cx={R} cy={y} rx={r} ry={r * 1.15} fill={ink} />
        <circle cx={L + 2.5} cy={y - 3} r={r * 0.38} fill="#fff" />
        <circle cx={R + 2.5} cy={y - 3} r={r * 0.38} fill="#fff" />
        {mood === "unwell" && (
          <path
            d={`M${L - 12} ${y - 13}l16 -6M${R + 12} ${y - 13}l-16 -6`}
            stroke={ink}
            strokeWidth="4"
            strokeLinecap="round"
          />
        )}
      </>
    );
  }
  return (
    <>
      {frogBumps}
      {eyes}
    </>
  );
}
function Mouth({ mood, kind, c }: { mood: Mood; kind: CritterKind; c: Look }) {
  if (c.beak) {
    const open =
      mood === "yum" ||
      mood === "happy" ||
      mood === "surprised" ||
      mood === "bleh";
    const y = kind === "owl" ? 112 : 112;
    return open ? (
      <>
        <path d={`M86 ${y}l14-10 14 10z`} fill={c.beak} />
        <path d={`M88 ${y + 2}l12 12 12-12z`} fill="#E07A20" />
      </>
    ) : (
      <path d={`M84 ${y - 4}q16-12 32 0q-16 14-32 0z`} fill={c.beak} />
    );
  }
  const muzzleY = kind === "horse" || kind === "cow" ? 124 : 116;
  const mY = c.muzzle ? muzzleY + 10 : 118;
  let m;
  switch (mood) {
    case "happy":
      m = (
        <>
          <path d={`M84 ${mY - 4}q16 22 32 0z`} fill={ink} />
          <path d={`M92 ${mY + 6}q8-6 16 0q-8 6-16 0z`} fill="#FF7A6B" />
        </>
      );
      break;
    case "yum":
    case "surprised":
      m = (
        <ellipse
          cx="100"
          cy={mY + 2}
          rx={mood === "yum" ? 11 : 7}
          ry={mood === "yum" ? 12 : 8}
          fill={ink}
        />
      );
      break;
    case "chew":
      m = (
        <path
          d={`M86 ${mY}q7 6 14 0q7 6 14 0`}
          stroke={ink}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      );
      break;
    case "bleh":
      m = (
        <>
          <path
            d={`M84 ${mY}q8-6 16 0t16 0`}
            stroke={ink}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <path d={`M98 ${mY + 1}q4 16 14 2`} fill="#FF7A6B" />
        </>
      );
      break;
    case "sleep":
      m = <ellipse cx="100" cy={mY + 1} rx="5" ry="4" fill={ink} />;
      break;
    case "unwell":
      m = (
        <path
          d={`M88 ${mY + 4}q12-8 24 0`}
          stroke={ink}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      );
      break;
    default:
      m = (
        <path
          d={`M88 ${mY - 2}q12 10 24 0`}
          stroke={ink}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      );
  }
  if (kind === "robot")
    m = (
      <rect
        x="80"
        y={mY - 6}
        width="40"
        height={mood === "happy" || mood === "yum" ? 14 : 6}
        rx="3"
        fill="#2E3A55"
      />
    );
  return m;
}
export function Critter({
  kind,
  mood = "neutral",
  className = "",
}: {
  kind: CritterKind;
  mood?: Mood;
  className?: string;
}) {
  const c = looks[kind];
  const head = c.head || c.body;
  const muzzleY = kind === "horse" || kind === "cow" ? 124 : 116;
  return (
    <svg
      className={`critter critter-${kind} mood-${mood} ${className}`}
      viewBox="0 0 200 200"
      aria-hidden="true"
    >
      <g strokeLinejoin="round">
        {/* body */}
        {kind === "dragon" && (
          <path d="M150 168q40-6 36-40q-8 20-30 18z" fill={c.body} />
        )}
        {kind === "cat" && (
          <path
            d="M150 170q34 0 30-40"
            stroke={c.body}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
          />
        )}
        <ellipse
          cx="100"
          cy="164"
          rx="56"
          ry="34"
          fill={kind === "sheep" ? "#FFF8EC" : c.body}
        />
        <ellipse cx="100" cy="170" rx="34" ry="22" fill={c.belly} />
        {(kind === "duck" ||
          kind === "chick" ||
          kind === "bird" ||
          kind === "owl") && (
          <>
            <path d="M46 156q-18-6-12-26q14 6 22 18z" fill={c.body} />
            <path d="M154 156q18-6 12-26q-14 6-22 18z" fill={c.body} />
          </>
        )}
        <Ears kind={kind} c={c} />
        {/* head */}
        {kind === "robot" ? (
          <rect x="40" y="34" width="120" height="106" rx="26" fill={head} />
        ) : kind === "horse" || kind === "cow" ? (
          <ellipse cx="100" cy="94" rx="54" ry="62" fill={head} />
        ) : (
          <circle cx="100" cy="96" r="60" fill={head} />
        )}
        {kind === "cow" && (
          <>
            <path
              d="M58 64q14-10 22 6t-14 18q-12-8-8-24z"
              fill={ink}
              opacity=".85"
            />
            <circle cx="138" cy="70" r="10" fill={ink} opacity=".85" />
          </>
        )}
        {kind === "cat" && (
          <path
            d="M92 44l8 16 8-16"
            stroke="#E08A3A"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
        )}
        {kind === "teddy" && (
          <path
            d="M132 120l12 0m-6-6v12"
            stroke="#6B4A2E"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}
        {kind === "dragon" && (
          <ellipse
            cx="100"
            cy="122"
            rx="30"
            ry="18"
            fill={c.belly}
            opacity=".6"
          />
        )}
        {c.muzzle && (
          <ellipse cx="100" cy={muzzleY} rx="30" ry="22" fill={c.muzzle} />
        )}
        {c.nose && kind !== "pig" && kind !== "cow" && kind !== "horse" && (
          <ellipse
            cx="100"
            cy={c.muzzle ? muzzleY - 8 : 108}
            rx={c.muzzle ? 9 : 6}
            ry={c.muzzle ? 6 : 4}
            fill={c.nose}
          />
        )}
        {(kind === "pig" || kind === "cow" || kind === "horse") && (
          <>
            <circle cx="91" cy={muzzleY - 4} r="4.5" fill={c.nose} />
            <circle cx="109" cy={muzzleY - 4} r="4.5" fill={c.nose} />
          </>
        )}
        {kind === "cat" || kind === "mouse" || kind === "rabbit" ? (
          <path
            d="M60 110h-22M60 118l-20 6M140 110h22M140 118l20 6"
            stroke={ink}
            strokeWidth="2.5"
            opacity=".5"
            strokeLinecap="round"
          />
        ) : null}
        <Eyes mood={mood} kind={kind} />
        {kind !== "robot" && kind !== "owl" && (
          <>
            <ellipse
              cx="62"
              cy="114"
              rx="10"
              ry="6"
              fill="#FF8F8F"
              opacity=".45"
            />
            <ellipse
              cx="138"
              cy="114"
              rx="10"
              ry="6"
              fill="#FF8F8F"
              opacity=".45"
            />
          </>
        )}
        <Mouth mood={mood} kind={kind} c={c} />
        {mood === "sleep" && (
          <text
            x="150"
            y="40"
            fontSize="30"
            fontWeight="800"
            fill="#6C7FD8"
            fontFamily="ui-rounded, system-ui"
          >
            z
            <tspan x="168" y="20" fontSize="22">
              z
            </tspan>
          </text>
        )}
      </g>
    </svg>
  );
}
