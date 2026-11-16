/* Volume button with a pop-out vertical slider. */
(function () {
  'use strict';

  var video  = document.getElementById('player');
  var wrap   = document.getElementById('volume');
  var button = document.getElementById('volumeBtn');
  var panel  = document.getElementById('volumePanel');
  var slider = document.getElementById('volumeSlider');

  if (!video || !wrap || !button || !panel || !slider) return;

  function level() {
    if (video.muted || video.volume === 0) return 'mute';
    return video.volume < 0.5 ? 'low' : 'high';
  }

  function sync() {
    button.dataset.level = level();
    var pct = Math.round(video.volume * 100);
    var label = 'Volume ' + (video.muted ? 'muted' : pct + '%');
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
    slider.setAttribute('aria-valuetext', pct + '%');
  }

  function open() {
    panel.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    slider.focus();
  }

  function close() {
    panel.hidden = true;
    button.setAttribute('aria-expanded', 'false');
  }

  function isOpen() { return !panel.hidden; }

  button.addEventListener('click', function (e) {
    e.stopPropagation();
    if (isOpen()) close(); else open();
  });

  slider.addEventListener('input', function () {
    video.volume = parseFloat(slider.value);
    video.muted = video.volume === 0;
    sync();
  });

  // Keep the panel's own clicks from reaching the document handler below.
  panel.addEventListener('click', function (e) { e.stopPropagation(); });

  document.addEventListener('click', function () { if (isOpen()) close(); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) { close(); button.focus(); }
  });

  // Reflect volume changed by any other means (keyboard on the slider, OS, etc).
  video.addEventListener('volumechange', function () {
    slider.value = video.muted ? 0 : video.volume;
    sync();
  });

  slider.value = video.volume;
  sync();
})();
