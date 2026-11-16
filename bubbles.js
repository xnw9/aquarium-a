/* Rising glowy bubbles. Independent of video playback — own play/stop buttons.
   Tune with the constants below. */
(function () {
  'use strict';

  var COUNT       = 28;      // how many bubbles on screen at once
  var SIZE_MIN    = 0.015;   // radius, as a fraction of video height
  var SIZE_MAX    = 0.15;
  var SPEED_MIN   = 0.015;   // upward speed, in video-heights per second
  var SPEED_MAX   = 0.06;
  var ALPHA_MIN   = 0.10;    // peak opacity at the bubble's centre
  var ALPHA_MAX   = 0.35;
  var DRIFT       = 0.012;   // horizontal sway amplitude, fraction of video width
  var DRIFT_SPEED = 0.35;    // sway cycles per second

  var O = window.Overlay;
  var rand = O.rand;

  var sprite = O.sprite('255,255,255', [
    [0.00, 1], [0.25, 0.55], [0.55, 0.18], [0.80, 0.04], [1.00, 0]
  ]);

  window.bubbles = O.create({
    canvas: 'bubbles', toggle: 'bubbleToggle', stop: 'bubbleStop',
    playLabel: 'Play bubbles', pauseLabel: 'Pause bubbles',
    count: COUNT,

    spawn: function (b, w, h, scatter) {
      b.r     = rand(SIZE_MIN, SIZE_MAX) * h;
      b.x     = rand(0, w);
      b.y     = scatter ? rand(-b.r, h + b.r) : h + b.r;
      b.speed = rand(SPEED_MIN, SPEED_MAX) * h;
      b.alpha = rand(ALPHA_MIN, ALPHA_MAX);
      b.phase = rand(0, Math.PI * 2);
      return b;
    },

    step: function (b, dt, w, h) {
      b.y -= b.speed * dt;
      b.phase += DRIFT_SPEED * dt * Math.PI * 2;
      if (b.y + b.r < 0) {                   // off the top — respawn below
        b.r     = rand(SIZE_MIN, SIZE_MAX) * h;
        b.x     = rand(0, w);
        b.y     = h + b.r;
        b.speed = rand(SPEED_MIN, SPEED_MAX) * h;
        b.alpha = rand(ALPHA_MIN, ALPHA_MAX);
      }
    },

    draw: function (ctx, b, w) {
      var x = b.x + Math.sin(b.phase) * DRIFT * w;
      var d = b.r * 2;
      ctx.globalAlpha = b.alpha;
      ctx.drawImage(sprite, x - b.r, b.y - b.r, d, d);
    }
  });
})();
