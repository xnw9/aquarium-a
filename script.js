(function () {
  'use strict';

  var FADE = 1.5;   // seconds to fade in at the start and out at the end of each loop

  var video  = document.getElementById('player');
  var toggle = document.getElementById('toggle');
  var stop   = document.getElementById('stop');

  var fading = false;

  /* ---- loop fade ---------------------------------------------------------
     The video sits on a black wrapper, so ramping its opacity dips the picture
     to black at the loop seam and brings it back. Driven by rAF rather than
     the video's timeupdate event, which only fires ~4x a second and would
     make the fade visibly steppy. */
  var fadedInOnce = false;

  function opacityAt(t, dur) {
    if (!dur || !isFinite(dur) || dur < FADE * 2) return 1;
    // The first frame is already on screen behind the landing glass, so the
    // opening play must not dip to black. Later loops fade in normally.
    if (t >= FADE) fadedInOnce = true;
    if (t < FADE) return fadedInOnce ? t / FADE : 1;    // fading in
    if (t > dur - FADE) return (dur - t) / FADE;        // fading out
    return 1;
  }

  function applyFade() {
    var o = opacityAt(video.currentTime, video.duration);
    video.style.opacity = Math.max(0, Math.min(1, o)).toFixed(3);
  }

  function fadeLoop() {
    if (!fading) return;
    applyFade();
    requestAnimationFrame(fadeLoop);
  }

  function startFade() {
    if (fading) return;
    fading = true;
    requestAnimationFrame(fadeLoop);
  }

  function stopFade() { fading = false; }

  /* ---- playback ---------------------------------------------------------- */
  function sync() {
    var playing = !video.paused;
    toggle.dataset.state = playing ? 'playing' : 'paused';
    toggle.setAttribute('aria-label', playing ? 'Pause' : 'Resume');
    toggle.setAttribute('title', playing ? 'Pause' : 'Resume');
  }

  function togglePlayback() {
    if (video.paused) {
      video.play().catch(function () { /* blocked without a user gesture */ });
    } else {
      video.pause();
    }
  }

  toggle.addEventListener('click', togglePlayback);

  // Stop = pause and rewind, so the next press starts from the beginning.
  stop.addEventListener('click', function () {
    video.pause();
    video.currentTime = 0;
    video.style.opacity = '1';   // don't leave a black screen sitting there
  });

  // Keep the icon honest regardless of how playback changed.
  video.addEventListener('play', function () { sync(); startFade(); });
  video.addEventListener('pause', function () { sync(); stopFade(); });
  // Show the first frame rather than applying the fade's t=0 value.
  video.addEventListener('loadedmetadata', function () { video.style.opacity = '1'; });

  document.addEventListener('keydown', function (e) {
    if (e.code !== 'Space' && e.key !== ' ') return;
    var t = document.activeElement;
    if (t && (t.tagName === 'BUTTON' || t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    e.preventDefault();
    togglePlayback();
  });

  sync();
})();
