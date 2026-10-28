// Small original object drawings shared by several activities.
const ink = "#2E2A3B";
export type ThingKind =
  | "ball"
  | "bell"
  | "star"
  | "rainbow"
  | "musicbox"
  | "balloon"
  | "car"
  | "clock"
  | "cupcake"
  | "rubberduck"
  | "hello"
  | "apple"
  | "rock"
  | "key"
  | "leaf"
  | "coin"
  | "sponge"
  | "boat"
  | "spoon"
  | "cork"
  | "carrot"
  | "bone"
  | "seeds"
  | "hay"
  | "lettuce"
  | "fish"
  | "cheese"
  | "banana"
  | "berries"
  | "flower"
  | "bird"
  | "note"
  | "thermometer"
  | "bandage"
  | "stethoscope"
  | "tissue"
  | "water"
  | "blanket"
  | "ladybug"
  | "starfish"
  | "firefly"
  | "egg"
  | "gift"
  | "icecream"
  | "jam"
  | "kite"
  | "crown"
  | "umbrella"
  | "yoyo"
  | "zebra"
  | "xylophone";
export function Thing({
  kind,
  className = "",
}: {
  kind: ThingKind;
  className?: string;
}) {
  let d: React.ReactNode;
  switch (kind) {
    case "ball":
      d = (
        <>
          <circle cx="50" cy="52" r="34" fill="#FF7A6B" />
          <path
            d="M16 52q34-22 68 0M50 18q-18 34 0 68"
            stroke="#fff"
            strokeWidth="6"
            fill="none"
          />
          <circle cx="38" cy="38" r="7" fill="#fff" opacity=".6" />
        </>
      );
      break;
    case "bell":
      d = (
        <>
          <path d="M22 72q4-48 28-50 24 2 28 50z" fill="#FFC94A" />
          <rect x="16" y="68" width="68" height="10" rx="5" fill="#E8A92E" />
          <circle cx="50" cy="84" r="8" fill="#E8A92E" />
          <circle cx="50" cy="18" r="6" fill="#E8A92E" />
        </>
      );
      break;
    case "star":
      d = (
        <path
          d="m50 10 12 26 28 3-21 19 6 28-25-14-25 14 6-28-21-19 28-3z"
          fill="#FFC94A"
          stroke="#E8A92E"
          strokeWidth="4"
        />
      );
      break;
    case "rainbow":
      d = (
        <>
          {["#FF7A6B", "#FFC94A", "#6CC07A", "#3BA7E0", "#8C6BE0"].map(
            (c, i) => (
              <path
                key={c}
                d={`M${10 + i * 7} 74a${40 - i * 7} ${40 - i * 7} 0 0 1 ${80 - i * 14} 0`}
                stroke={c}
                strokeWidth="7"
                fill="none"
              />
            ),
          )}
          <circle cx="16" cy="76" r="10" fill="#fff" />
          <circle cx="84" cy="76" r="10" fill="#fff" />
        </>
      );
      break;
    case "musicbox":
      d = (
        <>
          <rect x="16" y="46" width="68" height="40" rx="8" fill="#E05A8C" />
          <path d="M16 46l10-16h48l10 16z" fill="#FF8FC0" />
          <circle cx="84" cy="66" r="6" fill="#FFC94A" />
          <path
            d="M44 18v18m0-18 14 4"
            stroke={ink}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="40" cy="36" r="5" fill={ink} />
        </>
      );
      break;
    case "balloon":
      d = (
        <>
          <ellipse cx="50" cy="40" rx="26" ry="32" fill="#8C6BE0" />
          <path
            d="M46 72h8l-4 6zM50 78q-6 10 2 18"
            stroke={ink}
            strokeWidth="2"
            fill="#8C6BE0"
          />
          <ellipse cx="40" cy="28" rx="6" ry="10" fill="#fff" opacity=".5" />
        </>
      );
      break;
    case "car":
      d = (
        <>
          <path
            d="M12 66v-14q0-8 8-8h12l12-14h22l12 14h6q6 0 6 8v14z"
            fill="#3BA7E0"
          />
          <path d="M48 34h16l9 10H40z" fill="#BDE7FF" />
          <circle cx="30" cy="68" r="11" fill={ink} />
          <circle cx="72" cy="68" r="11" fill={ink} />
          <circle cx="30" cy="68" r="4" fill="#fff" />
          <circle cx="72" cy="68" r="4" fill="#fff" />
        </>
      );
      break;
    case "clock":
      d = (
        <>
          <circle cx="50" cy="52" r="34" fill="#6CC07A" />
          <circle cx="50" cy="52" r="26" fill="#fff" />
          <path
            d="M50 52V34M50 52l12 8"
            stroke={ink}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="28" cy="20" r="9" fill="#FFC94A" />
          <circle cx="72" cy="20" r="9" fill="#FFC94A" />
        </>
      );
      break;
    case "cupcake":
      d = (
        <>
          <path d="M24 54h52l-8 34H32z" fill="#FF9F5A" />
          <path d="M20 56q0-30 30-30t30 30z" fill="#FFB3C7" />
          <circle cx="50" cy="22" r="8" fill="#E8604F" />
          {[34, 46, 60, 68].map((x, i) => (
            <rect
              key={i}
              x={x}
              y={36 + (i % 2) * 8}
              width="6"
              height="3"
              rx="1.5"
              fill={["#3BA7E0", "#FFC94A", "#6CC07A", "#fff"][i]}
            />
          ))}
        </>
      );
      break;
    case "rubberduck":
      d = (
        <>
          <path
            d="M14 62q0 24 36 24t36-24q-6-12-24-10 6-28-18-30-22 2-18 26-12 2-12 14z"
            fill="#FFD54A"
          />
          <path d="M28 36q-12 0-16 6 6 4 16 2z" fill="#FF9F3A" />
          <circle cx="40" cy="30" r="4" fill={ink} />
        </>
      );
      break;
    case "hello":
      d = (
        <>
          <path
            d="M10 22q0-12 12-12h56q12 0 12 12v34q0 12-12 12H42l-18 16 4-16h-6q-12 0-12-12z"
            fill="#fff"
            stroke="#3BA7E0"
            strokeWidth="4"
          />
          <text
            x="50"
            y="48"
            textAnchor="middle"
            fontSize="20"
            fontWeight="800"
            fill="#3BA7E0"
            fontFamily="ui-rounded, system-ui"
          >
            hi!
          </text>
        </>
      );
      break;
    case "apple":
      d = (
        <>
          <path
            d="M50 30q-30-14-34 18 0 34 34 38 34-4 34-38-4-32-34-18z"
            fill="#E8604F"
          />
          <path
            d="M50 30q0-14 8-18"
            stroke="#8A5A36"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path d="M56 20q14-8 20 2-12 8-20-2z" fill="#6CC07A" />
          <ellipse cx="34" cy="44" rx="6" ry="9" fill="#fff" opacity=".4" />
        </>
      );
      break;
    case "rock":
      d = (
        <path
          d="M14 70q-4-26 20-36 14-14 34-6 22 6 20 30 4 22-24 24H30q-14 0-16-12z"
          fill="#8A93A6"
          stroke="#6B7386"
          strokeWidth="4"
        />
      );
      break;
    case "key":
      d = (
        <>
          <circle
            cx="30"
            cy="50"
            r="18"
            fill="none"
            stroke="#FFC94A"
            strokeWidth="10"
          />
          <path
            d="M48 50h40m-12 0v12m-12-12v8"
            stroke="#FFC94A"
            strokeWidth="10"
            strokeLinecap="round"
          />
        </>
      );
      break;
    case "leaf":
      d = (
        <>
          <path d="M14 82Q10 22 86 14 86 78 14 82z" fill="#6CC07A" />
          <path
            d="M18 78Q44 48 76 24"
            stroke="#4FA35E"
            strokeWidth="4"
            fill="none"
          />
        </>
      );
      break;
    case "coin":
      d = (
        <>
          <circle
            cx="50"
            cy="50"
            r="32"
            fill="#FFC94A"
            stroke="#E8A92E"
            strokeWidth="6"
          />
          <path
            d="M42 36h14q8 0 8 7t-8 7H44q-8 0-8 7t8 7h14"
            stroke="#E8A92E"
            strokeWidth="5"
            fill="none"
          />
        </>
      );
      break;
    case "sponge":
      d = (
        <>
          <rect x="14" y="30" width="72" height="44" rx="10" fill="#FFE66D" />
          <rect x="14" y="58" width="72" height="16" rx="6" fill="#6CC07A" />
          {[28, 46, 62, 36, 72].map((x, i) => (
            <circle key={i} cx={x} cy={40 + (i % 2) * 8} r="4" fill="#E8C83A" />
          ))}
        </>
      );
      break;
    case "boat":
      d = (
        <>
          <path d="M12 60h76l-12 22H24z" fill="#FF7A6B" />
          <path
            d="M50 58V14l28 40z"
            fill="#fff"
            stroke="#3BA7E0"
            strokeWidth="3"
          />
          <path d="M50 14v46" stroke="#8A5A36" strokeWidth="4" />
        </>
      );
      break;
    case "spoon":
      d = (
        <>
          <ellipse
            cx="34"
            cy="34"
            rx="16"
            ry="22"
            fill="#C9D3E3"
            transform="rotate(-40 34 34)"
          />
          <path
            d="M44 46l38 38"
            stroke="#C9D3E3"
            strokeWidth="10"
            strokeLinecap="round"
          />
        </>
      );
      break;
    case "cork":
      d = (
        <path
          d="M30 24h40l-6 56H36z"
          fill="#D9A066"
          stroke="#B8794A"
          strokeWidth="4"
        />
      );
      break;
    case "carrot":
      d = (
        <>
          <path d="M30 34q20-6 30 4L26 90q-8 4-6-6z" fill="#FF9F3A" />
          <path
            d="M50 30q-2-16 10-20M54 32q8-12 22-8M58 38q14-4 22 6"
            stroke="#6CC07A"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
        </>
      );
      break;
    case "bone":
      d = (
        <path
          d="M24 38a10 10 0 1 1 10-12l32 32a10 10 0 1 1 12 10 10 10 0 1 1-10 12L36 48a10 10 0 1 1-12-10z"
          fill="#FFF8EC"
          stroke="#E2CFAE"
          strokeWidth="4"
        />
      );
      break;
    case "seeds":
      d = (
        <>
          <path d="M18 60q32-28 64 0-4 26-32 26T18 60z" fill="#C98A55" />
          {[34, 46, 58, 66, 40, 52].map((x, i) => (
            <ellipse
              key={i}
              cx={x}
              cy={56 + (i % 3) * 6}
              rx="5"
              ry="3"
              fill="#FFE2A8"
              transform={`rotate(${i * 30} ${x} ${56 + (i % 3) * 6})`}
            />
          ))}
        </>
      );
      break;
    case "hay":
      d = (
        <>
          <rect x="16" y="36" width="68" height="44" rx="8" fill="#FFD54A" />
          <path
            d="M16 50h68M16 64h68M30 36v44M70 36v44"
            stroke="#E8A92E"
            strokeWidth="4"
          />
        </>
      );
      break;
    case "lettuce":
      d = (
        <>
          <circle cx="50" cy="54" r="32" fill="#8FD18A" />
          <path
            d="M50 26q-14 28 0 56M30 40q14 10 20 30M70 40q-14 10-20 30"
            stroke="#6CC07A"
            strokeWidth="5"
            fill="none"
          />
        </>
      );
      break;
    case "fish":
      d = (
        <>
          <path d="M16 50q28-30 56 0-28 30-56 0z" fill="#FF9F5A" />
          <path d="M70 50l18-16v32z" fill="#FF9F5A" />
          <circle cx="32" cy="46" r="4" fill={ink} />
        </>
      );
      break;
    case "cheese":
      d = (
        <>
          <path d="M14 70V44l70-20v46z" fill="#FFC94A" />
          <path d="M14 44l70-20-10-6z" fill="#FFE08A" />
          <circle cx="34" cy="56" r="6" fill="#E8A92E" />
          <circle cx="62" cy="46" r="5" fill="#E8A92E" />
        </>
      );
      break;
    case "banana":
      d = (
        <path
          d="M18 34q4 46 64 36-40-4-50-40z"
          fill="#FFE066"
          stroke="#E8C83A"
          strokeWidth="4"
        />
      );
      break;
    case "berries":
      d = (
        <>
          {[
            [36, 52],
            [58, 48],
            [48, 68],
            [66, 66],
          ].map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="13"
              fill={i % 2 ? "#8C6BE0" : "#E05A8C"}
            />
          ))}
          <path
            d="M48 36q0-14 10-16"
            stroke="#6CC07A"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
        </>
      );
      break;
    case "flower":
      d = (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <ellipse
              key={i}
              cx="50"
              cy="30"
              rx="11"
              ry="18"
              fill="#FF8FC0"
              transform={`rotate(${i * 72} 50 48)`}
            />
          ))}
          <circle cx="50" cy="48" r="11" fill="#FFC94A" />
        </>
      );
      break;
    case "bird":
      d = (
        <>
          <ellipse cx="48" cy="54" rx="28" ry="22" fill="#3BA7E0" />
          <circle cx="66" cy="38" r="14" fill="#3BA7E0" />
          <path d="M78 38l12 4-12 4z" fill="#FFB020" />
          <circle cx="70" cy="35" r="3" fill={ink} />
          <path d="M40 46q-20-20-24 4z" fill="#7CC8F2" />
        </>
      );
      break;
    case "note":
      d = (
        <>
          <path
            d="M40 70V22l34-8v46"
            stroke={ink}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
          <ellipse cx="32" cy="72" rx="12" ry="9" fill={ink} />
          <ellipse cx="66" cy="62" rx="12" ry="9" fill={ink} />
        </>
      );
      break;
    case "thermometer":
      d = (
        <>
          <rect
            x="40"
            y="12"
            width="20"
            height="60"
            rx="10"
            fill="#fff"
            stroke="#9AA6BA"
            strokeWidth="4"
          />
          <circle cx="50" cy="78" r="14" fill="#FF7A6B" />
          <rect x="46" y="40" width="8" height="34" fill="#FF7A6B" />
        </>
      );
      break;
    case "bandage":
      d = (
        <g transform="rotate(-30 50 50)">
          <rect x="12" y="36" width="76" height="28" rx="14" fill="#FFB38A" />
          <rect x="36" y="36" width="28" height="28" fill="#FFD9C2" />
          {[42, 50, 58].map((x) => (
            <circle key={x} cx={x} cy="50" r="2" fill="#E8A07A" />
          ))}
        </g>
      );
      break;
    case "stethoscope":
      d = (
        <>
          <path
            d="M28 14v26q0 22 22 22t22-22V14"
            stroke="#3BA7E0"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M50 62v10q0 14 14 14"
            stroke="#3BA7E0"
            strokeWidth="6"
            fill="none"
          />
          <circle
            cx="70"
            cy="84"
            r="10"
            fill="#C9D3E3"
            stroke="#7A869A"
            strokeWidth="4"
          />
        </>
      );
      break;
    case "tissue":
      d = (
        <>
          <rect x="16" y="44" width="68" height="40" rx="8" fill="#BDE7FF" />
          <path
            d="M38 46q-6-30 12-30t10 30"
            fill="#fff"
            stroke="#DDE5F0"
            strokeWidth="3"
          />
        </>
      );
      break;
    case "water":
      d = (
        <>
          <path
            d="M26 20h48l-6 66H32z"
            fill="#DDF3FF"
            stroke="#9AC8E8"
            strokeWidth="4"
          />
          <path d="M30 44h40l-4 40H34z" fill="#7CC8F2" />
        </>
      );
      break;
    case "blanket":
      d = (
        <>
          <path d="M14 30h72v50H14z" fill="#8C6BE0" />
          {[22, 40, 58, 76].map((x) => (
            <path key={x} d={`M${x} 30v50`} stroke="#B39CFF" strokeWidth="6" />
          ))}
          <path d="M14 30h72" stroke="#FFC94A" strokeWidth="6" />
        </>
      );
      break;
    case "ladybug":
      d = (
        <>
          <circle cx="50" cy="28" r="12" fill={ink} />
          <ellipse cx="50" cy="56" rx="30" ry="28" fill="#E8604F" />
          <path d="M50 30v54" stroke={ink} strokeWidth="4" />
          {[
            [36, 48],
            [64, 48],
            [36, 68],
            [64, 68],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="6" fill={ink} />
          ))}
          <circle cx="45" cy="25" r="3" fill="#fff" />
          <circle cx="55" cy="25" r="3" fill="#fff" />
        </>
      );
      break;
    case "starfish":
      d = (
        <>
          <path
            d="m50 10 10 28 30 2-24 18 9 29-25-17-25 17 9-29-24-18 30-2z"
            fill="#FF9F5A"
          />
          <circle cx="44" cy="44" r="3.5" fill={ink} />
          <circle cx="56" cy="44" r="3.5" fill={ink} />
          <path
            d="M44 54q6 5 12 0"
            stroke={ink}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </>
      );
      break;
    case "firefly":
      d = (
        <>
          <circle cx="50" cy="62" r="22" fill="#FFF3A8" opacity=".6" />
          <ellipse cx="50" cy="62" rx="12" ry="14" fill="#FFE066" />
          <ellipse cx="50" cy="40" rx="12" ry="12" fill="#4A4560" />
          <ellipse cx="34" cy="44" rx="14" ry="8" fill="#DDE5F0" opacity=".8" />
          <ellipse cx="66" cy="44" rx="14" ry="8" fill="#DDE5F0" opacity=".8" />
          <circle cx="46" cy="38" r="3" fill="#fff" />
          <circle cx="54" cy="38" r="3" fill="#fff" />
        </>
      );
      break;
    case "egg":
      d = (
        <>
          <path
            d="M50 10q32 4 32 48 0 32-32 32T18 58q0-44 32-48z"
            fill="#FFF8EC"
            stroke="#EADFCB"
            strokeWidth="4"
          />
          <ellipse cx="38" cy="40" rx="6" ry="10" fill="#fff" />
        </>
      );
      break;
    case "gift":
      d = (
        <>
          <rect x="16" y="40" width="68" height="48" rx="6" fill="#8C6BE0" />
          <rect x="12" y="30" width="76" height="16" rx="5" fill="#B39CFF" />
          <path d="M46 30h8v58h-8z" fill="#FFC94A" />
          <path
            d="M50 30q-26-20-20-4 4 6 20 4 16 2 20-4 6-16-20 4z"
            fill="#FFC94A"
          />
        </>
      );
      break;
    case "icecream":
      d = (
        <>
          <path d="M30 52h40L50 94z" fill="#E0B07A" />
          <path
            d="M34 60l20 12M46 56l18 14M36 52l8 22"
            stroke="#C98A55"
            strokeWidth="3"
          />
          <circle cx="40" cy="44" r="16" fill="#FFB3C7" />
          <circle cx="60" cy="44" r="16" fill="#FFF3B0" />
          <circle cx="50" cy="28" r="16" fill="#8FD18A" />
          <circle cx="50" cy="12" r="6" fill="#E8604F" />
        </>
      );
      break;
    case "jam":
      d = (
        <>
          <rect x="24" y="30" width="52" height="58" rx="10" fill="#E8445A" />
          <rect
            x="20"
            y="20"
            width="60"
            height="14"
            rx="4"
            fill="#FFF8EC"
            stroke="#E8445A"
            strokeWidth="3"
          />
          <rect x="34" y="50" width="32" height="22" rx="4" fill="#FFF8EC" />
          <path
            d="M44 62q6-8 12 0"
            stroke="#E8445A"
            strokeWidth="3"
            fill="none"
          />
        </>
      );
      break;
    case "kite":
      d = (
        <>
          <path d="M50 6l26 34-26 34-26-34z" fill="#FF7A6B" />
          <path d="M50 6v68M24 40h52" stroke="#fff" strokeWidth="3" />
          <path
            d="M50 74q-10 8 0 14t-4 12"
            stroke="#2E2A3B"
            strokeWidth="2"
            fill="none"
          />
          <path d="M44 86l6-4 2 6zM46 96l6-4 2 6z" fill="#FFC94A" />
        </>
      );
      break;
    case "crown":
      d = (
        <>
          <path
            d="M14 76l-4-44 22 18 18-28 18 28 22-18-4 44z"
            fill="#FFC94A"
            stroke="#E8A92E"
            strokeWidth="4"
          />
          <circle cx="50" cy="56" r="6" fill="#E05A8C" />
          <circle cx="30" cy="62" r="4" fill="#3BA7E0" />
          <circle cx="70" cy="62" r="4" fill="#3BA7E0" />
        </>
      );
      break;
    case "umbrella":
      d = (
        <>
          <path
            d="M8 48Q50-6 92 48q-7-6-14 0-7-6-14 0-7-6-14 0-7-6-14 0-7-6-14 0-7-6-14 0z"
            fill="#3BA7E0"
          />
          <path
            d="M50 14v62q0 12-12 8"
            stroke="#2E2A3B"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
        </>
      );
      break;
    case "yoyo":
      d = (
        <>
          <path d="M50 6v34" stroke="#2E2A3B" strokeWidth="3" />
          <circle cx="50" cy="64" r="26" fill="#6CC07A" />
          <circle cx="50" cy="64" r="16" fill="#8FD18A" />
          <circle cx="50" cy="64" r="5" fill="#2E2A3B" />
        </>
      );
      break;
    case "zebra":
      d = (
        <>
          <path
            d="M30 20q30-14 44 18l8 40q2 14-14 14H44q-14 0-12-14z"
            fill="#fff"
            stroke="#2E2A3B"
            strokeWidth="3"
          />
          <path
            d="M40 30l20 4M36 44l26 2M36 58l28 0M40 72l24-2"
            stroke="#2E2A3B"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path d="M28 20q-6-14 8-12z" fill="#2E2A3B" />
          <ellipse cx="62" cy="84" rx="16" ry="10" fill="#C9C2D6" />
          <circle cx="56" cy="84" r="2.5" fill="#2E2A3B" />
          <circle cx="68" cy="84" r="2.5" fill="#2E2A3B" />
          <circle cx="58" cy="44" r="4" fill="#2E2A3B" />
        </>
      );
      break;
    case "xylophone":
      d = (
        <>
          {["#FF5A4E", "#FFC94A", "#6CC07A", "#3BA7E0", "#8C6BE0"].map(
            (c, i) => (
              <rect
                key={c}
                x={12 + i * 16}
                y={20 + i * 5}
                width="12"
                height={64 - i * 10}
                rx="4"
                fill={c}
              />
            ),
          )}
          <path d="M8 36l84 16M8 72l84-4" stroke="#8A5A36" strokeWidth="4" />
        </>
      );
      break;
  }
  return (
    <svg
      className={`thing thing-${kind} ${className}`}
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <g strokeLinejoin="round">{d}</g>
    </svg>
  );
}
