# Aquarium A

Static page on GitHub Pages: a looping aquarium video full-screen, with canvas
effects over it. No build step, no dependencies, no framework. Plain ES5-style
IIFEs in separate files, loaded with `<script>` tags in `index.html`.

- Live: https://xnw9.github.io/aquarium-a/
- Repo: `xnw9/aquarium-a`, single branch `main`. Pushing to `main` redeploys.

## Layout

The video fills the viewport via `object-fit: contain`, letterboxed against
black. `.video-wrap` is `position: relative` and everything stacks inside it:

| z | what |
|---|------|
| — | `<video id="player">` |
| 1 | `.overlay` canvases: `#bubbles`, `#glare`, `#ripples` |
| 2 | `.controls` |
| 3 | `.landing` frosted glass |

All canvases are `pointer-events: none`.

## Files

`overlay.js` is the shared core for canvas effects: computes the video's
displayed rect under `object-fit: contain`, sizes the canvas to it, runs a
delta-timed rAF loop, wires the play/stop buttons. Each effect supplies only
constants plus `spawn`/`step`/`draw`.

- `bubbles.js`, `glare.js` — fixed cast, seeded once.
- `ripples.js` — event-driven: `add()` pushes particles in, `step()` returning
  `false` retires one. Uses `toggleStops: true` (single on/off button where off
  also clears).
- `script.js` play/pause/stop/spacebar + loop fade. `volume.js`, `filter.js`,
  `menu.js`, `landing.js` are self-contained.
- `sw.js` caches the video. `test/` holds the harnesses.

Every effect's tuning constants are named at the top of its own file.

## Decisions worth not re-litigating

**Video is 1280x720, 80 MB, H.264/AAC.** Re-encoded from a 292 MB 1080p source
at `-crf 20 -preset slow -vf scale=-2:720`. 1080p at the same CRF came out at
213 MB. Must stay under 100 MB: GitHub rejects larger files and **Pages does not
serve Git LFS**, so LFS is not an escape hatch. Keep `-movflags +faststart`.

**Highlight filter is an SVG tone curve on the video, not a blend overlay.**
A `darken` blend clips highlights hard; `multiply` dims shadows equally, which
is exposure, not highlights. `color-interpolation-filters="sRGB"` is load-bearing
— the default `linearRGB` shifts the whole picture.

**Service worker synthesises 206 responses.** `<video>` only ever issues range
requests, and a 200 with the full body breaks playback and seeking (Safari
strictest). The Cache API refuses to store a 206, so the first visit refetches
without a `Range` header and `tee()`s the stream — one download, not two.
**Bump `VERSION` in `sw.js` on every deploy that changes a cached file**, or
returning visitors get the old page. Currently `aquarium-a-v2.1`.

**The opening play skips the fade-in.** The loop fade derives opacity from
`currentTime`, so t=0 means opacity 0 — that would black out the first frame
behind the landing glass. `fadedInOnce` in `script.js` guards it; later loops
fade normally.

**Pause/resume is a button, not click-to-toggle,** so it never collides with the
click ripples. The ripple handler ignores `.controls` and anything outside the
video rect.

## Testing

`node test/run.js` — 8 suites, ~100 assertions. They stub the DOM and run the
real source under `vm`.

**They cannot catch CSS or visual regressions.** Nothing is laid out or painted.
A divider once went invisible (an empty `<span>` collapsed when the parent
gained `align-items: center`) and every suite still passed. Browser checks are
the user's; say plainly when something is unverified rather than implying a
passing suite means it looks right.

Add a suite when adding a feature; update assertions when behaviour genuinely
changes rather than working around them.

## Working style

- The user tests in a browser and reports back. Don't claim visual correctness.
- **Commit and push only when asked.** Pushing redeploys the live site.
- Split commits by feature. `index.html` and `style.css` accumulate changes from
  several features at once, so reconstruct intermediate states rather than
  lumping them — and verify each commit's `<script>` tags match the files
  present in that tree.
- **Edit files with a Node script using exact-match anchors that fail loudly.**
  A line-indexed replacement once matched the wrong occurrence and deleted two
  functions; shell heredocs have twice eaten backticks in Markdown.

## TODO

- **Pomodoro clock** — work/break timer over the video. Goes inside
  `.video-wrap`; nothing needs restructuring.
- Optional: `poster` JPEG for the landing frame, if a cold load shows frosted
  black before the first frame paints.
- Optional: persist the filter / effect toggles in `localStorage`.
