# Validation and release checks

Automated checks are development evidence, not sign-off against the specification's target iPads. The target iPad model, iPadOS versions, final hosting URL, and caregiver feedback are not yet known.

## Recorded cloud results

Validated with Node 24.19.0, npm 11.9.0, and local Chromium:

- Clean `npm ci`, strict type check, ESLint, and production build passed.
- 10 Vitest tests passed.
- 12 production browser tests passed against a plain static server, including all 20 toy entries, offline reload, cache detection/repair, and deliberate waiting-worker activation.
- The complete browser suite passes for both `/` (Netlify default) and explicit `/lboard/` builds. CI covers both bases. Published-asset checks reject missing JavaScript, incorrect MIME types, and HTML fallback for nonexistent assets.
- Desktop and phone screenshots were inspected. The development server's HTML, source loading, navigation, and switch interaction were also verified.
- Initial JavaScript is approximately 86 KB gzipped; the complete generated build is under 400 KB. This is a build-size measurement, not an iPad performance benchmark.

## Automated workflow

- TypeScript strict type check, ESLint, Vitest model tests, production Vite build.
- Chromium browser coverage: all 20 activity entries, reset and return paths; switch re-entry; paint stamps/undo/clear; colour combinations; parent gate cancellation and keyboard entry; saved calm mode; phone layout; scene placement and canceled drag; representative habitat, water, planting, picnic, shape, and counting interactions.
- Production PWA checks: complete cache status, offline page reload and toy interaction, missing cached asset detection, and a synthetic second worker version that waits during play and activates only by parent request.

Run `npm ci`, then the commands documented in the README. Browser test output reports exact counts and failures. CI performs the same production build and browser checks.

## Required before a device release

- Test current and previous major iPadOS on at least two actual iPad models. Record device, OS, Safari versus Home Screen mode, date, and observed failures.
- Install each copy online, check its own ready indicator, close it, enter airplane mode, then relaunch and exercise all 20 toys and sounds. Test interrupted precaching, storage eviction, repair, and an actual two-deployment update with multiple open clients.
- Repeat on root and `/lboard/` deployments. Do not assume local Chromium results establish Safari service-worker behavior.
- Test VoiceOver, keyboard navigation, 200% zoom, target sizes, contrast, both orientations, split view, and pointer cancellation/background transitions. Freehand painting remains a documented assistive-technology limitation; use stamp mode as a partial alternative.
- Test instrument slides, simultaneous touches, mute, device volume, silent switch, Bluetooth changes, interruptions, and optional music stopping in the background. No audio should start on return without a new gesture.
- Use for 20 minutes while observing memory, responsiveness, heat, and battery. Test at realistic scale; do not infer performance from the desktop browser.
- Offer voluntary caregiver-observed sessions without tracking, scores, or pressure to stay. Refine interests, targets, art, and sound based on those observations.

## Known limitations

The first implementation deliberately uses local synthesized tones and system fonts. It has not been audited for WCAG conformance, benchmarked on an iPad, or deployed. Some catalogue mechanics are simplified as described in README. Detailed animal vocalizations, recorded feeling words, draggable door hardware, draggable clouds, and a custom bundled font remain refinements. Old PWA caches are retained for mixed-client compatibility; automatic cache retirement needs a later lifecycle design.
