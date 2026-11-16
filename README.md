# Aquarium A

Static page that plays a looping aquarium video, scaled to fit the viewport at its
original aspect ratio and letterboxed against black, with icon controls bottom-left.

Live at **https://xnw9.github.io/aquarium-a/**

## What's on the page

The video loops continuously, fading in and out at the seam. Two canvas effects sit
over it — rising glowy bubbles, circular bokeh glare, and ripples where you click, all in
white and `#94ecdd`. Each
effect runs independently of the video and of the other, with its own play/pause and
stop buttons. A volume button opens a vertical slider.

Every effect's tuning constants (count, size, speed, opacity, colour ratio) are named
at the top of its own file.

## Develop

Open `index.html` directly in a browser. No build step, no dependencies.

Pushing to `main` redeploys the site automatically.

A service worker (`sw.js`) caches the video on disk, so repeat visits do not
re-stream 80 MB. It needs HTTPS, so it stays inactive when you open `index.html`
straight from the filesystem — serve the folder over HTTP to exercise it. Static
files are network-first, so a redeploy is never masked by a stale cache.

Bump `VERSION` in `sw.js` when the video filename changes, so the old one is
evicted from visitors' caches.

## TODO

- **Pomodoro clock** — work/break timer over the video.

`.video-wrap` is `position: relative` and the overlays sit inside it, so a clock can
be added in the same stacking context without restructuring. The canvases are
`pointer-events: none` and the ripple handler ignores anything inside `.controls`,
so clicks reach whatever they should.
