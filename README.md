# Layla Board

A quiet, local-first playroom for curious little hands. Twenty open-ended toys across ten areas, with original SVG illustrations, gentle synthesized sound, touch and keyboard controls, and an installable offline shell.

Built from [the supplied research and specification](docs/LAYLA_BOARD_RESEARCH_AND_SPEC.md). No backend, account, external assets, telemetry, or API keys.

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

Choose a world, then a toy. Every toy is available immediately. Home returns to its shelf in one tap. Switches, scenes, and art stay in memory while navigating; reload starts a fresh session. Only validated preferences are stored on the device.

Select a piece and then a destination to place it, or drag it into the destination. Track Maker uses a six-cell board; select a cell using the **Cell** button and rotate its track using **Rotate**. The ball starts at the left edge of cell 1 and follows connected endpoints. Finger Paint supports freehand drawing, colour and brush selection, undo, a confirmed clear, and a keyboard-accessible stamp grid.

Grown-up settings use a cancelable three-second hold followed by a written arithmetic question. Keyboard and screen-reader users can activate Hold directly. This is accidental-entry friction, not device security. Settings include sound, independent effect/music volume, opt-in soft chord, reduced motion, calm mode, activity choices, and preference reset. Hidden/background apps stop sound; music never restarts itself.

## Offline

The production build generates raster app icons, a scoped manifest, a content-versioned worker, and a complete shell asset list. Installation uses atomic `cache.addAll`. The parent-only ready indicator checks every precached entry and requires an active controller. **Retry offline preparation** repairs missing cache entries without discarding current play. Offline mode cannot work before an online preparation, after storage eviction, or when the browser does not support service workers.

Updates wait while play is open. Grown-ups can deliberately restart from settings when an update is ready. Previous caches are retained so older tabs can still retrieve their release assets; repeated deployments can accumulate caches, and storage cleanup remains a future refinement. Do not clear origin storage during play.

Install on an iPad using Safari's Share → Add to Home Screen. Open the installed copy online and check its own ready indicator before testing airplane mode. Safari and the installed app can use separate storage.

## Implementation boundaries

This is an initial playable implementation, not a device-certified release. [Validation notes and remaining checks](docs/VALIDATION.md) distinguish automated evidence from the specification's real-iPad release gate.

- Art and icons are original local SVG/PNG under this repository's MIT license. Sound is synthesized locally with Web Audio; this implementation uses gentle tones rather than recorded piano, animal, or voice samples. There is no narration.
- System fonts keep the app small and avoid remote font requests; a custom bundled rounded font has not been added.
- The 20 initial toys are present; later R2/R3 catalogue activities are not included. Garden growth is explicit tap-to-plant / tap-to-water, and clouds use a tap-to-move control. Some scene pieces use geometric symbols rather than detailed illustrated objects.
- Painting is bounded to 200 strokes, 1,500 points per stroke, and DPR 2. Stamps provide a limited assistive alternative, not equivalent freehand expression. Free scenes allow up to 36 pieces, picnic plates 12 ingredients, counting plates five berries each, and instruments eight voices globally including optional music.
- Touch target and visual accessibility refinements require real-device testing. No WCAG conformance, developmental outcome, or kiosk guarantee is claimed.
