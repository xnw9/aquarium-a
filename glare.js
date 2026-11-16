/* Circular bokeh glare — large out-of-focus discs held at fixed random
   positions, fading in and out, in white and #94ecdd. Independent of the
   video and the bubbles; own play/stop buttons. Tune with the constants
   below. Positions are re-randomised on Stop, and on a window resize. */
(function () {
  'use strict';

  var COUNT      = 6;       // how many discs at once — keep to a multiple of 3 for an exact ratio
  var SIZE_MIN   = 0.10;    // radius, as a fraction of video height
  var SIZE_MAX   = 0.38;
  var ALPHA_MAX  = 0.50;    // peak opacity — 'lighter' sums overlaps, so keep modest
  var FADE_MIN   = 10;      // seconds for one full fade in-and-out cycle
  var FADE_MAX   = 26;
  var TEAL_PER_WHITE = 2;   // ratio of #94ecdd discs to white ones (2 means 2:1)
  var BLUR_SHARE = 0.35;    // fraction rendered as the softer, further-out-of-focus kind

  var O = window.Overlay;
  var rand = O.rand;

  /* Bokeh profile: a near-flat interior that holds its brightness most of the
     way out, then falls off over the last third. The slight lift at 0.72 is the
     rim an out-of-focus highlight shows. This is what makes it read as a disc
     rather than a gaussian smudge. */
  var DISC = [
    [0.00, 0.80], [0.45, 0.82], [0.62, 0.86],
    [0.72, 0.92], [0.82, 0.55], [0.92, 0.14], [1.00, 0]
  ];
  /* Discs further from the focal plane lose the rim and spread wider. */
  var SOFT = [
    [0.00, 0.70], [0.40, 0.62], [0.60, 0.42],
    [0.78, 0.18], [0.90, 0.05], [1.00, 0]
  ];

  var sprites = {
    white: O.sprite('255,255,255', DISC),
    teal:  O.sprite('148,236,221', DISC),       // #94ecdd
    whiteSoft: O.sprite('255,255,255', SOFT),
    tealSoft:  O.sprite('148,236,221', SOFT)
  };

  window.glare = O.create({
    canvas: 'glare', toggle: 'glareToggle', stop: 'glareStop',
    playLabel: 'Play glare', pauseLabel: 'Pause glare',
    count: COUNT,

    spawn: function (g, w, h, scatter, i) {
      g.r  = rand(SIZE_MIN, SIZE_MAX) * h;
      // Fixed for the life of the disc. The overflow past the edges lets some
      // discs sit part-cropped at the frame border, as in the reference shot.
      g.x  = rand(-0.1, 1.1) * w;
      g.y  = rand(-0.1, 1.1) * h;

      // Assigned by index rather than at random, so the ratio is exact rather
      // than only correct on average. At COUNT 6 that is 4 teal : 2 white.
      var teal = (i % (TEAL_PER_WHITE + 1)) !== TEAL_PER_WHITE;
      var soft = Math.random() < BLUR_SHARE;
      g.sprite = sprites[(teal ? 'teal' : 'white') + (soft ? 'Soft' : '')];

      g.period = rand(FADE_MIN, FADE_MAX);
      // Scattered discs start mid-cycle so the layer isn't empty on first play.
      g.t = scatter ? rand(0, g.period) : 0;
      return g;
    },

    // Discs never move — only the fade cycle advances.
    step: function (g, dt) {
      g.t += dt;
      if (g.t > g.period) g.t -= g.period;
    },

    draw: function (ctx, g) {
      // Smooth 0 -> peak -> 0 over the period, so discs breathe in and out.
      var a = ALPHA_MAX * (0.5 - 0.5 * Math.cos(g.t / g.period * Math.PI * 2));
      if (a <= 0.001) return;
      var d = g.r * 2;
      ctx.globalAlpha = a;
      ctx.drawImage(g.sprite, g.x - g.r, g.y - g.r, d, d);
    }
  });
})();
