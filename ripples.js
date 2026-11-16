/* Click ripples — soft expanding rings in white and #94ecdd, spawned where
   you click on the picture. Independent of the video and the other effects;
   own play/stop buttons. Tune with the constants below. */
(function () {
  'use strict';

  var RINGS       = 2;      // rings per click, staggered
  var STAGGER     = 0.12;   // seconds between them
  var START_R     = 0.01;   // starting radius, as a fraction of video height
  var END_R       = 0.22;   // radius at which a ring has fully faded
  var GROW        = 0.9;    // seconds to travel from START_R to END_R
  var ALPHA_MAX   = 0.45;   // peak opacity — 'lighter' sums overlaps
  var TEAL_SHARE  = 0.5;    // fraction of rings that are #94ecdd rather than white

  var O = window.Overlay;
  var rand = O.rand;

  /* A soft annulus: transparent at the centre, brightest around 0.78 of the
     radius, fading to nothing at the rim. Same sprite-scaling approach as the
     bubbles and bokeh, so the edges stay soft at any size. */
  var RING = [
    [0.00, 0], [0.45, 0], [0.62, 0.18],
    [0.78, 0.95], [0.90, 0.25], [1.00, 0]
  ];
  var white = O.sprite('255,255,255', RING);
  var teal  = O.sprite('148,236,221', RING);   // #94ecdd

  var layer = O.create({
    canvas: 'ripples', toggle: 'rippleToggle',
    playLabel: 'Enable click ripples', pauseLabel: 'Disable click ripples',
    toggleStops: true,                         // one on/off button; off clears
    count: 0,                                  // nothing until you click

    spawn: function (p, w, h) {
      p.r0     = START_R * h;
      p.r1     = END_R * h;
      p.t      = -(p.delay || 0);              // negative = still waiting its turn
      p.sprite = (p.teal === undefined ? Math.random() < TEAL_SHARE : p.teal)
                 ? teal : white;
      return p;
    },

    step: function (p, dt) {
      p.t += dt;
      if (p.t > GROW) return false;            // faded out — retire it
    },

    draw: function (ctx, p) {
      if (p.t < 0) return;                     // staggered ring, not started
      var k = p.t / GROW;                      // 0 -> 1 over its lifetime
      // Ease out, so the ring leaps away from the click then slows.
      var r = p.r0 + (p.r1 - p.r0) * (1 - Math.pow(1 - k, 3));
      var a = ALPHA_MAX * (1 - k) * Math.min(1, k * 6);   // quick in, slow out
      if (a <= 0.001) return;
      ctx.globalAlpha = a;
      ctx.drawImage(p.sprite, p.x - r, p.y - r, r * 2, r * 2);
    }
  });

  window.ripples = layer;
  if (!layer) return;

  /* Clicks land on the video or the wrapper — the canvases are
     pointer-events:none. Ignore anything on the controls, and anything
     outside the picture itself, so ripples never appear on the black bars. */
  var wrap   = document.getElementById('videoWrap');
  var canvas = document.getElementById('ripples');

  wrap.addEventListener('click', function (e) {
    if (!layer.isRunning()) return;
    if (e.target.closest && e.target.closest('.controls')) return;

    var box = canvas.getBoundingClientRect();
    var x = e.clientX - box.left;
    var y = e.clientY - box.top;
    if (x < 0 || y < 0 || x > box.width || y > box.height) return;

    var teal = Math.random() < TEAL_SHARE;
    for (var i = 0; i < RINGS; i++) {
      layer.add({ x: x, y: y, delay: i * STAGGER, teal: i === 0 ? teal : !teal });
    }
  });
})();
