export function Art({
  kind,
  className = "",
}: {
  kind: string;
  className?: string;
}) {
  const ink = "#35434a",
    coral = "#df7f6b",
    cream = "#fff7e7";
  let drawing;
  switch (kind) {
    case "switch":
      drawing = (
        <>
          <rect x="26" y="34" width="148" height="112" rx="22" fill="#c58e59" />
          <rect x="32" y="28" width="136" height="110" rx="20" fill="#e5b77f" />
          <path d="M42 57h115M44 117h113" stroke="#d1a16b" strokeWidth="2" />
          <path
            d="M64 74v22m36-22v22m36-22v22"
            stroke={ink}
            strokeWidth="15"
            strokeLinecap="round"
          />
          <path
            d="M64 66v17m36 9v17m36-43v17"
            stroke={cream}
            strokeWidth="13"
            strokeLinecap="round"
          />
          <circle cx="64" cy="48" r="8" fill="#fff0a2" />
          <circle cx="100" cy="48" r="8" fill="#d67d63" />
          <circle cx="136" cy="48" r="8" fill="#fff0a2" />
        </>
      );
      break;
    case "piano":
      drawing = (
        <>
          <path
            d="M25 58q0-15 18-15h114q18 0 18 15v76q0 14-16 14H41q-16 0-16-14z"
            fill={coral}
          />
          <rect x="35" y="75" width="130" height="61" rx="9" fill={cream} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path
              key={i}
              d={`M${35 + i * 22} 77v58`}
              stroke="#cdbfb0"
              strokeWidth="2"
            />
          ))}
          {[0, 1, 3, 4].map((i) => (
            <rect
              key={i}
              x={48 + i * 22}
              y="75"
              width="12"
              height="36"
              rx="3"
              fill={ink}
            />
          ))}
          <path
            d="M83 30v-13l16-4v13"
            fill="none"
            stroke={ink}
            strokeWidth="4"
          />
          <circle cx="78" cy="31" r="6" fill={ink} />
          <circle cx="94" cy="28" r="6" fill={ink} />
        </>
      );
      break;
    case "rabbit":
      drawing = (
        <>
          <path
            d="M68 82C35 5 79 0 85 72M110 74c-3-75 40-68 21 13"
            fill={cream}
            stroke="#dfd7c0"
            strokeWidth="3"
          />
          <path
            d="M71 56 65 29m54 29 7-28"
            stroke="#e4aaa2"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <ellipse cx="101" cy="116" rx="55" ry="49" fill={cream} />
          <ellipse cx="56" cy="143" rx="18" ry="12" fill={cream} />
          <circle cx="81" cy="108" r="4" fill={ink} />
          <circle cx="119" cy="108" r="4" fill={ink} />
          <path
            d="m95 121 6 5 6-5m-6 5v6"
            stroke={ink}
            strokeWidth="3"
            fill="none"
          />
          <ellipse cx="71" cy="122" rx="9" ry="5" fill="#edb8a8" />
          <ellipse cx="132" cy="122" rx="9" ry="5" fill="#edb8a8" />
          <path d="m144 146 26-33-9-6-31 27z" fill="#de9460" />
          <path
            d="m166 112 6-16m-7 15 17-8"
            stroke="#6d946e"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </>
      );
      break;
    case "paint":
      drawing = (
        <>
          <path
            d="M104 32c-72-8-100 95-36 118 26 10 61 3 45-21-8-13 17-25 30-15 33 25 54-62 7-74z"
            fill={cream}
          />
          <ellipse cx="121" cy="64" rx="13" ry="10" fill="#bdc0d7" />
          <circle cx="75" cy="58" r="12" fill={coral} />
          <circle cx="48" cy="91" r="12" fill="#e7c365" />
          <circle cx="65" cy="126" r="12" fill="#87b4a5" />
          <path d="m120 140 37-83 10 5-35 86z" fill="#9a795f" />
          <path d="m153 66 8-26 15 6-10 25z" fill="#7aa4af" />
        </>
      );
      break;
    case "flask":
      drawing = (
        <>
          <path
            d="M78 23h44v14h-7v42l43 62q8 16-10 18H53q-16-2-9-18l42-62V37h-8z"
            fill={cream}
            stroke="#6f9ca8"
            strokeWidth="4"
          />
          <path d="m71 111-21 32q-4 9 9 9h83q12 0 7-9l-21-32z" fill="#8dbbb6" />
          <circle cx="97" cy="126" r="6" fill="#d4e9d0" />
          <circle cx="116" cy="141" r="4" fill="#d4e9d0" />
          <circle cx="95" cy="89" r="5" fill="#9fc9bd" />
          <circle cx="108" cy="61" r="4" fill="#9fc9bd" />
          <path d="m146 37 3 9 10 3-10 4-3 10-4-10-9-4 9-3z" fill="#e6ba61" />
        </>
      );
      break;
    case "blocks":
      drawing = (
        <>
          <rect x="31" y="112" width="65" height="47" rx="7" fill="#9cbca7" />
          <rect x="102" y="112" width="65" height="47" rx="7" fill="#d78b73" />
          <rect x="62" y="61" width="74" height="46" rx="7" fill="#efcb77" />
          <path d="m58 56 41-40 41 40z" fill="#9dacc9" />
          <path
            d="M42 123h40m31 1h41M73 72h51"
            stroke={cream}
            strokeWidth="3"
            opacity=".5"
          />
        </>
      );
      break;
    case "flower":
      drawing = (
        <>
          <path
            d="M100 133V66m0 41q-41-40-39-6 3 22 39 20m0-27q38-31 35-3-3 23-35 24"
            fill="#83a17a"
            stroke="#75946d"
            strokeWidth="5"
          />
          <path d="m64 124 9 40h57l9-40z" fill="#cd8b6b" />
          <path
            d="M58 124h86"
            stroke="#e0a183"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {[0, 1, 2, 3, 4].map((i) => (
            <ellipse
              key={i}
              cx="100"
              cy="45"
              rx="14"
              ry="24"
              fill="#ecd27d"
              transform={`rotate(${i * 72} 100 65)`}
            />
          ))}
          <circle cx="100" cy="65" r="17" fill="#b37c59" />
          <circle cx="95" cy="63" r="2.5" fill={ink} />
          <circle cx="105" cy="63" r="2.5" fill={ink} />
          <path d="M95 71q5 5 10 0" fill="none" stroke={ink} strokeWidth="2" />
        </>
      );
      break;
    case "shapes":
      drawing = (
        <>
          <rect x="27" y="94" width="66" height="65" rx="12" fill="#d88a73" />
          <circle cx="134" cy="122" r="36" fill="#8eb8b8" />
          <path d="m100 18 41 66H59z" fill="#eac779" />
          <circle cx="57" cy="122" r="3" fill={ink} />
          <circle cx="72" cy="122" r="3" fill={ink} />
          <path d="M57 135q8 6 15 0" fill="none" stroke={ink} strokeWidth="2" />
        </>
      );
      break;
    case "cloud":
      drawing = (
        <>
          <circle cx="135" cy="56" r="29" fill="#e9c67b" />
          <path
            d="M43 131c-38-8-26-49 1-49-2-41 64-52 77-12 44-10 57 54 21 61z"
            fill={cream}
          />
          <circle cx="72" cy="104" r="3" fill={ink} />
          <circle cx="101" cy="104" r="3" fill={ink} />
          <path
            d="M78 115q8 6 15 0"
            fill="none"
            stroke={ink}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="m58 151-3 7m42-7-3 7m39-7-3 7"
            stroke="#8ba9c1"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </>
      );
      break;
    case "bubbles":
      drawing = (
        <>
          {[
            [61, 108, 37],
            [130, 64, 36],
            [139, 137, 24],
            [57, 38, 17],
          ].map(([x, y, r], i) => (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r={r}
                fill={["#d0dce5", "#f3dcc7", "#d4ddd0", "#f5e6b6"][i]}
                stroke="#fff7ed"
                strokeWidth="4"
              />
              <path
                d={`M${x - r * 0.55} ${y - r * 0.35}q3-${r * 0.3} ${r * 0.4}-${r * 0.3}`}
                fill="none"
                stroke="white"
                strokeWidth="5"
                strokeLinecap="round"
              />
            </g>
          ))}
        </>
      );
      break;
    default:
      drawing = (
        <>
          <circle cx="100" cy="90" r="55" fill={cream} />
          <path
            d="M70 85h5m45 0h5M80 110q20 17 40 0"
            fill="none"
            stroke={ink}
            strokeWidth="7"
            strokeLinecap="round"
          />
        </>
      );
  }
  return (
    <svg className={className} viewBox="0 0 200 180" aria-hidden="true">
      <g strokeLinejoin="round">{drawing}</g>
    </svg>
  );
}
export function Icon({
  name,
}: {
  name: "home" | "back" | "sound" | "mute" | "settings" | "reset" | "next";
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "home" ? (
        <path d="m3 11 9-8 9 8v10h-7v-7h-4v7H3z" />
      ) : name === "settings" ? (
        <>
          <rect x="5" y="10" width="14" height="11" rx="3" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
        </>
      ) : name === "reset" ? (
        <>
          <path d="M4 10a8 8 0 1 1 1 8M4 4v6h6" />
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
