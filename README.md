# Layla Board

A bright, tactile, local-first playroom for curious little hands: the 21 Release 1 activities from the research, across ten areas. Each activity asks a four-year-old to decide, predict or plan something: which switch lights the fish tank, whether the key will sink, who is behind the barn door, how many ladybugs are in the jar, how to spell her own name. There are no scores, timers or rewards.

Built from [the v1.0 research and product specification](docs/LAYLA_BOARD_SPEC_V1_RESEARCH.md) (and the [earlier research](docs/LAYLA_BOARD_RESEARCH_AND_SPEC.md)). [Release 1 notes](docs/RELEASE_1.md) describe every activity and what it builds; [the design refresh](docs/DESIGN_REFRESH.md) covers the visual and motion system. No backend, account, external assets, telemetry, or API keys.

## Develop

Use Node.js 24 and npm 11 (validated toolchain).

```sh
npm ci
npm run dev
```

The default base is `/`, suitable for Netlify and other root-hosted sites. The development server prints the local address. Service workers are registered only in production builds.

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
npm run test:browser
```

Browser tests use `/usr/bin/chromium` if installed. Otherwise run `npx playwright install chromium`; optionally set `CHROMIUM_PATH` to an existing browser. In a minimal Linux CI image, use `npx playwright install --with-deps chromium`.

Netlify reads `netlify.toml`: build with `npm run build`, publish `dist`, and use Node 24. The default build works at the site root without extra variables. Remove a previously configured `APP_BASE=/lboard/` override from Netlify's environment variables if one exists. Deploy the complete `dist/` directory over HTTPS.

For a GitHub Pages project site, explicitly use `APP_BASE=/lboard/ npm run build` and `APP_BASE=/lboard/ npm run preview`. The same base is applied to JavaScript, CSS, app icons, the manifest, and the offline worker. Browser tests use a plain static server, without Vite's base-path handling or HTML fallback. Run `APP_BASE=/lboard/ npm run test:browser` after that subpath build. GitHub Actions runs checks, not publication.

## Play

Choose a place on the playground map, then a toy (places with one toy open it straight away). Every touch answers with a small burst of confetti; places and cards lean towards the finger and zoom you in. After five quiet seconds a ghost hand shows one thing to try. Every activity is available immediately. Home returns to the room (or the map) in one tap; the broom at the top right resets just that activity. What she makes stays in memory while she moves around; reload starts fresh. Movable things work by tap-then-tap or by dragging.

Grown-up settings use a cancelable three-second hold followed by a written arithmetic question. Keyboard and screen-reader users can activate Hold directly. This is accidental-entry friction, not device security. Settings include sound, independent effect/music volume, opt-in soft chord, reduced motion, calm mode, spoken words (on / names only / off), the child's name and family names for Letter Friends, activity choices, and preference reset. Hidden/background apps stop sound; music never restarts itself.

## Offline

The production build generates raster app icons, a scoped manifest, a content-versioned worker, and a complete shell asset list. Installation uses atomic `cache.addAll`. The parent-only ready indicator checks every precached entry and requires an active controller. **Retry offline preparation** repairs missing cache entries without discarding current play. Offline mode cannot work before an online preparation, after storage eviction, or when the browser does not support service workers.

Updates wait while play is open. Grown-ups can deliberately restart from settings when an update is ready. Previous caches are retained so older tabs can still retrieve their release assets; repeated deployments can accumulate caches, and storage cleanup remains a future refinement. Do not clear origin storage during play.

Install on an iPad using Safari's Share → Add to Home Screen. Open the installed copy online and check its own ready indicator before testing airplane mode. Safari and the installed app can use separate storage.

## Implementation boundaries

This is an initial playable implementation, not a device-certified release. [Validation notes and remaining checks](docs/VALIDATION.md) distinguish automated evidence from the specification's real-iPad release gate.

- Art and icons are original local SVG/PNG under this repository's MIT license. Sound is synthesized locally with Web Audio (mallet, drum, shaker, pop, sparkle and whoosh voices through a limiter) rather than recorded samples. There is no narration.
- The interface uses the system rounded font (`ui-rounded`); letters in Letter Friends use Andika (SIL Open Font License), bundled locally.
- Spoken words use the device's built-in speech voice; recorded voice lines from the spec are not made yet.
- Motion is caused by touch, except one slow drifting cloud. The system reduced-motion setting or the parent toggle replaces zooms and confetti with short fades.
- All 21 Release 1 activities are present; Release 2 and later activities, the wind-down/Goodnight ending and the art gallery are not. See [Release 1 notes](docs/RELEASE_1.md).
- Painting keeps the last 300 marks (400 stamps, 150 mirror lines) at up to DPR 2. The canvases are not usable with a keyboard or screen reader.
- Touch target and visual accessibility refinements require real-device testing. No WCAG conformance, developmental outcome, or kiosk guarantee is claimed.
