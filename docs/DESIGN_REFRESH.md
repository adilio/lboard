# Design refresh: "Sunny Workshop"

This pass replaced the muted, website-like first build with a bright, tactile, toy-like playroom. Decisions trace back to [the v1.0 research and product specification](LAYLA_BOARD_SPEC_V1_RESEARCH.md) (section numbers below refer to it).

## What changed

| Area           | Before                                       | Now                                                                                                                                                                                                                              | Spec basis                                                  |
| -------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Home           | Paged carousel of 5 cards with text taglines | One non-scrolling Playground Map: all ten places on a sky with hills, no paging                                                                                                                                                  | §10 depth rule, §11.1 map                                   |
| Depth          | Flat cards with a thin shadow                | Chunky 3D tiles: flat offset "lift" shadow, glossy top highlight, art floating above the face in real CSS 3D                                                                                                                     | §12.4 lift shadow, §12.1 painted-wood/glossy-plastic toys   |
| Motion         | Hover nudge only                             | Tiles lean towards the finger in 3D, sink when pressed, squash and spring back; places pop in once when the map appears; screens zoom in from the tapped place and back out                                                      | §13.3 squash and stretch, spring easing, caused not ambient |
| Touch feedback | None outside the toy                         | Every touch makes a small confetti burst at the finger (a soft ring in reduced motion)                                                                                                                                           | §9.1 "every touch answers", Principle 2                     |
| Colour         | Dusty pastels                                | Spec colour tokens (`--sun`, `--coral`, `--lagoon`, `--leaf`, `--plum`, `--berry`, `--mint`), one per area                                                                                                                       | §12.2                                                       |
| Illustration   | Ten drawings reused across toys              | A picture of each of the 20 toys' main object, with a white "sticker" outline                                                                                                                                                    | §11.2 cards show the real object, §12.5, §12.6              |
| Controls       | Text-ish icons                               | Home is a picture of a house, reset is a broom, both large round discs                                                                                                                                                           | §11.4, §12.5                                                |
| Chrome         | Header rule, footer taglines, bottom bar     | Removed; activity is a full stage with Home top-left                                                                                                                                                                             | §11.3 "no other chrome"                                     |
| Sound          | One bare sine tone                           | Small Web Audio engine: master limiter, effects and music buses, wooden mallet, felt drum and shaker, pop, plop, click, sparkle and whoosh voices; places and cards play C major pentatonic                                      | §13.1, §13.2, §15.4                                         |
| Toys           | Flat panels                                  | Rainbow piano keys that sink and glow, drums with rims and bodies, rocker switches that spring, doors that swing open on a 3D hinge, iridescent bubbles that pop into flowers, splashing float/sink, growing sprouts and flowers | §7, §13.3                                                   |

## Guard rails kept

- **Calm by default.** The only ambient motion is one slow cloud (§13.3 rule 1). Everything else moves because a finger caused it. Nothing loops to attract attention and nothing flashes (§13.3 rules 5 and 6, AX-2).
- **Reduced motion.** The system setting or the parent toggle swaps zooms and pop-ins for short crossfades, stops the cloud and the 3D tilt, and shrinks confetti to a single fading ring (§13.4).
- **Battery.** The confetti canvas only runs `requestAnimationFrame` while particles are alive and caps them at 220. The 3D effects are CSS transforms; there is no WebGL or 3D engine (§15.6).
- **No new dependencies or network requests.** Fonts use the system rounded face (`ui-rounded`, which is SF Pro Rounded on iPad). The CSP and offline precache are unchanged.
- **No manipulation patterns.** No stars, streaks, timers or sad characters were added (§5.3).
- **Labels stay for grown-ups and assistive technology.** The map hides area taglines visually but keeps them in each button's accessible name.

## Not done yet (from the spec)

- Spoken labels, Andika font for letters, personal name, wind-down and Goodnight ending, recently played list, and the 21-activity Release 1 catalogue (§20) are separate work.
- Real recorded or loudness-normalized samples (§13.1). The current sounds are synthesized.
- Hit-padding, palm rejection and lift-grace drag from §9 are not implemented.
- All of this still needs testing on a real iPad (§19.2). Desktop Chromium screenshots do not show iPad performance or touch feel.
