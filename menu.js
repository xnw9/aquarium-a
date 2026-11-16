/* Menu button: the only control visible until you ask for the rest. */
(function () {
  'use strict';

  var button = document.getElementById('menuToggle');
  var group  = document.getElementById('controlsGroup');
  if (!button || !group) return;

  var open = false;

  function sync() {
    group.hidden = !open;
    button.dataset.state = open ? 'open' : 'closed';
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    var label = open ? 'Hide controls' : 'Show controls';
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
  }

  button.addEventListener('click', function () {
    open = !open;
    sync();
    // Close the volume panel with the menu, or it would be left floating
    // over the video with nothing beneath it.
    if (!open) {
      var panel = document.getElementById('volumePanel');
      var vol   = document.getElementById('volumeBtn');
      if (panel && !panel.hidden) {
        panel.hidden = true;
        if (vol) vol.setAttribute('aria-expanded', 'false');
      }
    }
  });

  sync();
})();
