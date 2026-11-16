/* Highlight rolloff — compresses the top of the tonal range so large white
   areas stop glaring, while shadows and midtones pass through untouched.
   Single on/off button. The curve itself lives in the SVG filter in
   index.html; this just switches it on and off. */
(function () {
  'use strict';

  var video  = document.getElementById('player');
  var button = document.getElementById('filterToggle');
  if (!video || !button) return;

  var on = false;

  function sync() {
    button.dataset.state = on ? 'on' : 'off';
    button.setAttribute('aria-pressed', on ? 'true' : 'false');
    var label = on ? 'Highlight rolloff on' : 'Highlight rolloff off';
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
  }

  button.addEventListener('click', function () {
    on = !on;
    // Class rather than inline style, so it can't fight the loop fade, which
    // drives the video's opacity.
    if (on) video.classList.add('filtered');
    else video.classList.remove('filtered');
    sync();
  });

  sync();
})();
