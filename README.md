# Aquarium A

Static page that plays a looping aquarium video, scaled to fit the viewport at its
original aspect ratio and letterboxed against black, with icon controls bottom-left.

Live at **https://xnw9.github.io/aquarium-a/**

## Files
| | |
|---|---|
| `index.html` | Markup — video element and controls |
| `style.css` | Viewport-fit layout, letterboxing, control styling |
| `script.js` | Play/pause toggle, stop (pause + rewind), spacebar |
| `favicon.svg` | Jellyfish tab icon |
| `assets/ambiance-recode.mp4` | The video — see `assets/README.md` for encoding |

## Develop
Open `index.html` directly in a browser. No build step, no dependencies.

Pushing to `main` redeploys the site automatically.

## Later
`.video-wrap` is `position: relative` and the controls sit inside it, so overlays
(pomodoro clock, click counter, click targets) can be added in the same stacking
context without restructuring. Pause/resume is on a button rather than
click-to-toggle, so it won't collide with interactive clicking.
