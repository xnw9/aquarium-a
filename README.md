# Aquarium A

Static page that plays a looping aquarium video, scaled to fit the viewport at its
original aspect ratio and letterboxed against black, with icon controls bottom-left.

Live at **https://xnw9.github.io/aquarium-a/**

## What's on the page

The video loops continuously, fading in and out at the seam. Two canvas effects sit
over it — rising glowy bubbles, and circular bokeh glare in white and `#94ecdd`. Each
effect runs independently of the video and of the other, with its own play/pause and
stop buttons. A volume button opens a vertical slider.

Every effect's tuning constants (count, size, speed, opacity, colour ratio) are named
at the top of its own file.

## Develop

Open `index.html` directly in a browser. No build step, no dependencies.

Pushing to `main` redeploys the site automatically.

## TODO

- **Pomodoro clock** — work/break timer over the video.
- **Click effect** — something visual on click, e.g. a ripple or burst at the pointer.

`.video-wrap` is `position: relative` and the overlays sit inside it, so these can be
added in the same stacking context without restructuring. The canvases are
`pointer-events: none`, and pause/resume is on a button rather than click-to-toggle,
so neither will swallow the clicks.
