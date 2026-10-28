// Original flat "Sunny Workshop" illustrations: chunky toy shapes, flat
// shade steps and a warm ink. Every toy has a picture of its main object.
const ink = "#2E2A3B",
  cream = "#FFF8EC",
  coral = "#FF7A6B",
  sun = "#FFC94A",
  leaf = "#6CC07A",
  mint = "#5FD3B5",
  lagoon = "#3BA7E0",
  plum = "#8C6BE0",
  berry = "#E05A8C",
  wood = "#C98A55",
  woodDark = "#8A5A36",
  peach = "#FFB38A";
const Eyes = ({ x = 100, y = 100, gap = 18, r = 4.5 }) => (
  <>
    <circle cx={x - gap} cy={y} r={r} fill={ink} />
    <circle cx={x + gap} cy={y} r={r} fill={ink} />
    <circle cx={x - gap + 1.5} cy={y - 1.5} r={r * 0.35} fill="#fff" />
    <circle cx={x + gap + 1.5} cy={y - 1.5} r={r * 0.35} fill="#fff" />
  </>
);
const Smile = ({ x = 100, y = 112, w = 9 }) => (
  <path
    d={`M${x - w} ${y}q${w} ${w * 0.9} ${w * 2} 0`}
    fill="none"
    stroke={ink}
    strokeWidth="3.5"
    strokeLinecap="round"
  />
);
const Cheeks = ({ x = 100, y = 112, gap = 32 }) => (
  <>
    <ellipse cx={x - gap} cy={y} rx="8" ry="5" fill="#FF9C8F" opacity=".8" />
    <ellipse cx={x + gap} cy={y} rx="8" ry="5" fill="#FF9C8F" opacity=".8" />
  </>
);
const Shine = ({ d }: { d: string }) => (
  <path
    d={d}
    fill="none"
    stroke="#fff"
    strokeWidth="6"
    strokeLinecap="round"
    opacity=".75"
  />
);
const drawings: Record<string, () => React.ReactNode> = {
  switch: () => (
    <>
      <rect x="22" y="38" width="156" height="118" rx="22" fill={woodDark} />
      <rect x="22" y="30" width="156" height="114" rx="22" fill={wood} />
      <path
        d="M38 58h124M38 122h124"
        stroke={woodDark}
        strokeWidth="3"
        opacity=".35"
      />
      {[60, 100, 140].map((x, i) => (
        <g key={x}>
          <rect x={x - 13} y="68" width="26" height="46" rx="10" fill={ink} />
          <rect
            x={x - 10}
            y={i === 1 ? 92 : 70}
            width="20"
            height="20"
            rx="7"
            fill={cream}
          />
        </g>
      ))}
      <circle cx="60" cy="46" r="9" fill={sun} />
      <circle cx="100" cy="46" r="9" fill="#7A6A5A" />
      <circle cx="140" cy="46" r="9" fill={sun} />
      <Shine d="M36 44q2-8 12-9" />
    </>
  ),
  door: () => (
    <>
      <path d="M100 16 22 76h156z" fill={coral} />
      <path d="M100 16 22 76h22l56-42 56 42h22z" fill="#E8604F" />
      <rect x="38" y="74" width="124" height="88" rx="6" fill={peach} />
      <rect x="74" y="92" width="52" height="70" rx="6" fill={ink} />
      <ellipse
        cx="96"
        cy="112"
        rx="7"
        ry="16"
        fill={cream}
        transform="rotate(-12 96 112)"
      />
      <ellipse
        cx="112"
        cy="112"
        rx="7"
        ry="16"
        fill={cream}
        transform="rotate(12 112 112)"
      />
      <path d="M126 92v70l-26 8V100z" fill={lagoon} />
      <circle cx="108" cy="134" r="4" fill={sun} />
      <rect
        x="132"
        y="120"
        width="22"
        height="10"
        rx="5"
        fill={sun}
        stroke={woodDark}
        strokeWidth="2"
      />
      <rect x="48" y="92" width="18" height="18" rx="4" fill={cream} />
    </>
  ),
  piano: () => (
    <>
      <path
        d="M22 62q0-18 18-18h120q18 0 18 18v82q0 16-16 16H38q-16 0-16-16z"
        fill="#E8604F"
      />
      <path
        d="M22 56q0-18 18-18h120q18 0 18 18v80q0 16-16 16H38q-16 0-16-16z"
        fill={coral}
      />
      <rect x="34" y="72" width="132" height="68" rx="9" fill={cream} />
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d={`M${56 + i * 22} 74v64`}
          stroke="#E6D5BE"
          strokeWidth="3"
        />
      ))}
      {[0, 1, 3, 4].map((i) => (
        <rect
          key={i}
          x={48 + i * 22}
          y="72"
          width="15"
          height="38"
          rx="4"
          fill={ink}
        />
      ))}
      <path
        d="M134 32V12l22-5v20"
        fill="none"
        stroke={ink}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <ellipse cx="128" cy="33" rx="8" ry="6" fill={ink} />
      <ellipse cx="150" cy="28" rx="8" ry="6" fill={ink} />
      <Shine d="M36 52q3-6 12-7" />
    </>
  ),
  drum: () => (
    <>
      <path d="M40 70v62q0 26 60 26t60-26V70z" fill={coral} />
      <path
        d="M40 92l20 46 20-46 20 46 20-46 20 46 20-46"
        fill="none"
        stroke={cream}
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <ellipse
        cx="100"
        cy="70"
        rx="60"
        ry="20"
        fill={cream}
        stroke="#E8604F"
        strokeWidth="8"
      />
      <path
        d="m58 22 42 44M150 18l-46 48"
        stroke={wood}
        strokeWidth="9"
        strokeLinecap="round"
      />
      <circle cx="56" cy="20" r="11" fill={sun} />
      <circle cx="152" cy="16" r="11" fill={sun} />
    </>
  ),
  rabbit: () => (
    <>
      <path
        d="M70 84C38 8 80 2 88 74M112 74c-4-74 42-68 22 14"
        fill={cream}
        stroke="#EADFCB"
        strokeWidth="3"
      />
      <path
        d="M72 58 66 30m54 30 7-28"
        stroke="#FF9C8F"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <ellipse cx="101" cy="116" rx="56" ry="50" fill={cream} />
      <ellipse cx="54" cy="146" rx="18" ry="12" fill={cream} />
      <Eyes x={100} y={106} gap={19} />
      <path
        d="m95 120 6 5 6-5m-6 5v6"
        stroke={ink}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <Cheeks x={101} y={122} gap={31} />
      <path d="m144 148 28-34-10-7-32 28z" fill="#FF9F5A" />
      <path
        d="m168 112 6-17m-7 16 18-8"
        stroke={leaf}
        strokeWidth="6"
        strokeLinecap="round"
      />
    </>
  ),
  frog: () => (
    <>
      <ellipse cx="100" cy="150" rx="86" ry="22" fill={lagoon} />
      <path d="M30 148a50 14 0 0 0 100 0 50 14 0 0 0 -100 0z" fill={leaf} />
      <path d="M80 140 78 148 92 146z" fill={lagoon} />
      <ellipse cx="104" cy="112" rx="52" ry="40" fill="#7ED07A" />
      <circle cx="78" cy="74" r="18" fill="#7ED07A" />
      <circle cx="130" cy="74" r="18" fill="#7ED07A" />
      <circle cx="78" cy="72" r="10" fill={cream} />
      <circle cx="130" cy="72" r="10" fill={cream} />
      <circle cx="80" cy="72" r="5" fill={ink} />
      <circle cx="132" cy="72" r="5" fill={ink} />
      <path
        d="M80 112q24 18 48 0"
        fill="none"
        stroke={ink}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <Cheeks x={104} y={104} gap={36} />
      <path
        d="m168 40 5 10 11 2-8 7 2 11-10-5-10 5 2-11-8-7 11-2z"
        fill={sun}
      />
    </>
  ),
  paint: () => (
    <>
      <path
        d="M104 30c-74-8-102 98-36 120 26 10 62 3 46-21-8-13 17-25 30-15 34 25 56-64 6-76z"
        fill={cream}
        stroke="#EADFCB"
        strokeWidth="3"
      />
      <ellipse cx="122" cy="62" rx="13" ry="10" fill={plum} />
      <circle cx="76" cy="56" r="13" fill={coral} />
      <circle cx="48" cy="90" r="13" fill={sun} />
      <circle cx="64" cy="126" r="13" fill={lagoon} />
      <path d="m120 142 38-84 11 5-36 87z" fill={wood} />
      <path d="m154 66 9-28 16 7-11 27z" fill={berry} />
    </>
  ),
  stickers: () => (
    <>
      <g transform="rotate(-12 64 70)">
        <rect x="24" y="30" width="80" height="80" rx="18" fill="#fff" />
        <path
          d="m64 44 9 19 21 3-15 14 4 21-19-10-19 10 4-21-15-14 21-3z"
          fill={sun}
        />
      </g>
      <g transform="rotate(10 138 66)">
        <rect x="100" y="28" width="76" height="76" rx="18" fill="#fff" />
        <path
          d="M138 92c-30-18-30-44-12-46 8 0 12 6 12 10 0-4 4-10 12-10 18 2 18 28-12 46z"
          fill={berry}
        />
      </g>
      <g transform="rotate(-4 100 134)">
        <rect x="62" y="98" width="76" height="72" rx="18" fill="#fff" />
        <path
          d="M76 150c-14-2-12-20 2-20 0-16 24-20 30-6 16-4 22 22 8 26z"
          fill={lagoon}
        />
      </g>
    </>
  ),
  flask: () => (
    <>
      <path
        d="M78 22h44v14h-7v42l44 62q8 18-10 20H52q-18-2-10-20l44-62V36h-8z"
        fill={cream}
        stroke={lagoon}
        strokeWidth="5"
      />
      <path d="m70 110-22 33q-4 10 9 10h86q13 0 8-10l-22-33z" fill={mint} />
      <circle cx="96" cy="126" r="7" fill="#C9F3E6" />
      <circle cx="117" cy="141" r="5" fill="#C9F3E6" />
      <circle cx="96" cy="88" r="5" fill={mint} />
      <circle cx="108" cy="62" r="4" fill={mint} />
      <path d="m148 34 4 10 11 4-11 4-4 11-4-11-10-4 10-4z" fill={sun} />
    </>
  ),
  bowl: () => (
    <>
      <path d="M30 96h140q-6 64-70 64T30 96z" fill={lagoon} />
      <path d="M30 96h140q-2 10-6 18H36q-4-8-6-18z" fill="#2E8BC0" />
      <ellipse cx="100" cy="96" rx="70" ry="14" fill="#8FD18A" />
      <path
        d="M44 132q56 18 112 0"
        stroke={cream}
        strokeWidth="5"
        fill="none"
        opacity=".6"
        strokeLinecap="round"
      />
      <path d="M60 22q12 18 12 28a12 12 0 0 1-24 0q0-10 12-28z" fill={coral} />
      <path d="M100 12q12 18 12 28a12 12 0 0 1-24 0q0-10 12-28z" fill={sun} />
      <path
        d="M140 22q12 18 12 28a12 12 0 0 1-24 0q0-10 12-28z"
        fill={lagoon}
      />
    </>
  ),
  boat: () => (
    <>
      <rect x="16" y="96" width="168" height="66" rx="18" fill={lagoon} />
      <path
        d="M16 106q21-12 42 0t42 0 42 0 42 0"
        fill="none"
        stroke="#9BD8F5"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path d="M44 92h66l-10 20H54z" fill={coral} />
      <path d="M76 92V40l30 40z" fill={cream} />
      <path d="M76 40v52" stroke={woodDark} strokeWidth="4" />
      <ellipse cx="146" cy="96" rx="22" ry="14" fill={sun} />
      <circle cx="158" cy="76" r="13" fill={sun} />
      <path d="m168 76 12 4-12 4z" fill="#FF9F5A" />
      <circle cx="160" cy="73" r="2.6" fill={ink} />
      <circle cx="60" cy="146" r="9" fill="#7A869A" />
      <circle cx="118" cy="150" r="6" fill="#7A869A" />
    </>
  ),
  blocks: () => (
    <>
      <rect x="28" y="114" width="68" height="48" rx="8" fill={leaf} />
      <rect x="104" y="114" width="68" height="48" rx="8" fill={coral} />
      <rect x="60" y="62" width="80" height="48" rx="8" fill={sun} />
      <path d="m56 58 44-42 44 42z" fill={plum} />
      <path
        d="M38 124h48M114 124h48M70 72h60"
        stroke="#fff"
        strokeWidth="4"
        opacity=".5"
        strokeLinecap="round"
      />
      <circle cx="78" cy="86" r="4" fill={ink} />
      <circle cx="122" cy="86" r="4" fill={ink} />
      <path
        d="M92 94q8 6 16 0"
        fill="none"
        stroke={ink}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </>
  ),
  track: () => (
    <>
      <path
        d="M18 140h70q40 0 40-40V60q0-26 26-26h30"
        fill="none"
        stroke={woodDark}
        strokeWidth="34"
        strokeLinecap="round"
      />
      <path
        d="M18 140h70q40 0 40-40V60q0-26 26-26h30"
        fill="none"
        stroke={wood}
        strokeWidth="26"
        strokeLinecap="round"
      />
      <path
        d="M18 140h70q40 0 40-40V60q0-26 26-26h30"
        fill="none"
        stroke={cream}
        strokeWidth="5"
        strokeDasharray="8 10"
      />
      <circle cx="58" cy="122" r="16" fill={coral} />
      <circle cx="53" cy="117" r="5" fill="#fff" opacity=".8" />
    </>
  ),
  picnic: () => (
    <>
      <path d="M36 84h128l-12 70q-2 8-10 8H58q-8 0-10-8z" fill={coral} />
      <path
        d="M44 100h112M48 122h104M52 144h96M70 84l4 78M100 84v78M130 84l-4 78"
        stroke={cream}
        strokeWidth="6"
        opacity=".8"
      />
      <path
        d="M56 84q44-70 88 0"
        fill="none"
        stroke={wood}
        strokeWidth="9"
        strokeLinecap="round"
      />
      <circle cx="72" cy="74" r="16" fill="#E8604F" />
      <path
        d="M72 58q2-8 8-10"
        stroke={leaf}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="M100 56q24 2 36 22H96q-4-12 4-22z" fill={sun} />
      <circle cx="112" cy="70" r="3" fill="#E8A92E" />
      <circle cx="124" cy="72" r="3" fill="#E8A92E" />
    </>
  ),
  flower: () => (
    <>
      <path
        d="M100 132V66m0 42q-42-40-40-6 3 22 40 20m0-28q40-32 36-3-3 24-36 25"
        fill={leaf}
        stroke="#4FA35E"
        strokeWidth="5"
      />
      <path d="m62 124 10 40h56l10-40z" fill="#E07A4F" />
      <path
        d="M56 124h88"
        stroke="#FF9F5A"
        strokeWidth="14"
        strokeLinecap="round"
      />
      {[0, 1, 2, 3, 4].map((i) => (
        <ellipse
          key={i}
          cx="100"
          cy="44"
          rx="15"
          ry="25"
          fill={i % 2 ? "#FF9C8F" : coral}
          transform={`rotate(${i * 72} 100 65)`}
        />
      ))}
      <circle cx="100" cy="65" r="18" fill={sun} />
      <circle cx="94" cy="62" r="2.8" fill={ink} />
      <circle cx="106" cy="62" r="2.8" fill={ink} />
      <path
        d="M94 71q6 5 12 0"
        fill="none"
        stroke={ink}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </>
  ),
  berries: () => (
    <>
      <ellipse
        cx="100"
        cy="140"
        rx="80"
        ry="24"
        fill={cream}
        stroke="#EADFCB"
        strokeWidth="5"
      />
      {[
        [64, 112, coral],
        [100, 104, plum],
        [136, 112, coral],
        [82, 132, plum],
        [118, 132, coral],
      ].map(([x, y, c], i) => (
        <g key={i}>
          <circle cx={x as number} cy={y as number} r="18" fill={c as string} />
          <circle
            cx={(x as number) - 6}
            cy={(y as number) - 6}
            r="5"
            fill="#fff"
            opacity=".6"
          />
        </g>
      ))}
      <path
        d="M100 86q-6-14 4-22m-4 22q10-10 22-8"
        stroke={leaf}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <text
        x="34"
        y="52"
        fontSize="34"
        fontWeight="800"
        fill={sun}
        fontFamily="ui-rounded, system-ui"
      >
        1
      </text>
      <text
        x="150"
        y="48"
        fontSize="34"
        fontWeight="800"
        fill={lagoon}
        fontFamily="ui-rounded, system-ui"
      >
        2
      </text>
      <text
        x="92"
        y="40"
        fontSize="34"
        fontWeight="800"
        fill={berry}
        fontFamily="ui-rounded, system-ui"
      >
        3
      </text>
    </>
  ),
  shapes: () => (
    <>
      <rect x="24" y="92" width="70" height="68" rx="14" fill={coral} />
      <circle cx="136" cy="122" r="38" fill={lagoon} />
      <path d="m100 16 44 70H56z" fill={sun} />
      <Eyes x={59} y={118} gap={9} r={3.5} />
      <Smile x={59} y={132} w={6} />
    </>
  ),
  cloud: () => (
    <>
      <circle cx="140" cy="54" r="30" fill={sun} />
      <path
        d="M42 132c-40-8-28-52 2-52-2-42 66-54 80-12 46-10 60 56 22 64z"
        fill="#fff"
      />
      <Eyes x={88} y={104} gap={15} r={4} />
      <Smile x={88} y={116} w={8} />
      <Cheeks x={88} y={114} gap={30} />
      <path
        d="m60 152-3 8m42-8-3 8m40-8-3 8"
        stroke={lagoon}
        strokeWidth="6"
        strokeLinecap="round"
      />
    </>
  ),
  face: () => (
    <>
      <circle cx="100" cy="92" r="70" fill={sun} />
      <path d="M44 128a70 70 0 0 0 112 0 74 74 0 0 1-112 0z" fill="#E8A92E" />
      <path
        d="M68 78q10-12 20 0M112 78q10-12 20 0"
        fill="none"
        stroke={ink}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path d="M70 108q30 32 60 0z" fill={ink} />
      <path d="M84 120q16 10 32 0" fill="#FF7A6B" />
      <Cheeks x={100} y={102} gap={46} />
      <Shine d="M54 66q8-20 26-28" />
    </>
  ),
  bubbles: () => (
    <>
      {(
        [
          [62, 108, 38, "#BDE7FF"],
          [132, 62, 36, "#FFD6EC"],
          [140, 136, 25, "#D3F5DB"],
          [56, 38, 18, "#FFEFB8"],
        ] as const
      ).map(([x, y, r, c], i) => (
        <g key={i}>
          <circle
            cx={x}
            cy={y}
            r={r}
            fill={c}
            opacity=".85"
            stroke="#fff"
            strokeWidth="4"
          />
          <path
            d={`M${x - r * 0.55} ${y - r * 0.35}q3-${r * 0.3} ${r * 0.4}-${r * 0.3}`}
            fill="none"
            stroke="#fff"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </g>
      ))}
    </>
  ),
  machine: () => (
    <>
      <rect x="30" y="50" width="120" height="106" rx="20" fill={mint} />
      <rect x="30" y="140" width="120" height="16" rx="8" fill="#3EB596" />
      <rect x="46" y="66" width="88" height="56" rx="14" fill={cream} />
      <Eyes x={90} y={88} gap={16} r={5} />
      <path
        d="M78 104q12 10 24 0"
        fill="none"
        stroke={ink}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="166" cy="98" r="16" fill={sun} />
      <path
        d="M166 98 182 70"
        stroke={woodDark}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="182" cy="68" r="8" fill={coral} />
      <path
        d="M60 50V30m60 20V24"
        stroke={ink}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="60" cy="26" r="9" fill={berry} />
      <circle cx="120" cy="20" r="9" fill={sun} />
      <rect x="40" y="156" width="26" height="10" rx="4" fill={woodDark} />
      <rect x="114" y="156" width="26" height="10" rx="4" fill={woodDark} />
    </>
  ),
};
export function Art({
  kind,
  className = "",
}: {
  kind: string;
  className?: string;
}) {
  const draw = drawings[kind];
  return (
    <svg className={className} viewBox="0 0 200 180" aria-hidden="true">
      <g strokeLinejoin="round">
        {draw ? (
          draw()
        ) : (
          <>
            <circle cx="100" cy="90" r="55" fill={cream} />
            <Eyes x={100} y={84} gap={20} />
            <Smile x={100} y={106} w={14} />
          </>
        )}
      </g>
    </svg>
  );
}
export function Icon({
  name,
}: {
  name: "home" | "back" | "sound" | "mute" | "settings" | "reset" | "next";
}) {
  if (name === "home")
    return (
      <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">
        <path
          d="M8 22 24 8l16 14v18a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3z"
          fill={coral}
        />
        <path
          d="M5 23 24 6l19 17"
          fill="none"
          stroke="#E8604F"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="19" y="28" width="10" height="15" rx="3" fill={cream} />
        <rect x="31" y="24" width="6" height="6" rx="1.5" fill={sun} />
      </svg>
    );
  if (name === "reset")
    return (
      <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">
        <path d="m30 6 6 4-12 20-6-4z" fill={wood} />
        <path d="M16 24 26 30l-4 12q-1 3-4 2L6 37q-3-1-1-4z" fill={sun} />
        <path
          d="m11 32-4 6m8-3-3 6m8-4-2 6"
          stroke="#E8A92E"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    );
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "settings" ? (
        <>
          <rect x="5" y="10" width="14" height="11" rx="3" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
        </>
      ) : name === "back" ? (
        <path d="m14 6-6 6 6 6" />
      ) : name === "next" ? (
        <path d="m10 6 6 6-6 6" />
      ) : (
        <>
          <path d="m11 4-6 5H2v6h3l6 5z" />
          {name === "sound" ? (
            <path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
          ) : (
            <path d="m16 9 6 6m0-6-6 6" />
          )}
        </>
      )}
    </svg>
  );
}
