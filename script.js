(function () {
  'use strict';

  var video = document.getElementById('player');
  var toggle = document.getElementById('toggle');
  var stop = document.getElementById('stop');

  // Drives which icon shows (via CSS) and the accessible name.
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
  });

  // Keep the icon honest regardless of how playback changed.
  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);

  document.addEventListener('keydown', function (e) {
    if (e.code !== 'Space' && e.key !== ' ') return;
    var t = document.activeElement;
    if (t && (t.tagName === 'BUTTON' || t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    e.preventDefault();
    togglePlayback();
  });

  sync();
})();
