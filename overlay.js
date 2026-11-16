/* Shared core for the canvas overlay effects (bubbles, glare, ...).
   Handles the video rect, canvas sizing, the animation loop and the
   play/pause + stop buttons. Each effect supplies its own particles. */
(function () {
  'use strict';

  var video = document.getElementById('player');

  /* The video's displayed rect. object-fit: contain letterboxes the picture
     inside the viewport, so the visible image is smaller than the wrapper.
     The later click targets will need this same rect. */
  function videoRect() {
    var W = video.clientWidth, H = video.clientHeight;
    var vw = video.videoWidth, vh = video.videoHeight;
    if (!vw || !vh) return { left: 0, top: 0, width: W, height: H };
    var scale = Math.min(W / vw, H / vh);
    var rw = vw * scale, rh = vh * scale;
    return { left: (W - rw) / 2, top: (H - rh) / 2, width: rw, height: rh };
  }

  /* Build a soft radial-gradient sprite once, then drawImage it scaled per
     particle. Far cheaper than a gradient per frame, and gives a genuinely
     soft edge without any blur filter. */
  function makeSprite(rgb, stops) {
    var S = 128;
    var cv = document.createElement('canvas');
    cv.width = cv.height = S;
    var c = cv.getContext('2d');
    var g = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    for (var i = 0; i < stops.length; i++) {
      g.addColorStop(stops[i][0], 'rgba(' + rgb + ',' + stops[i][1] + ')');
    }
    c.fillStyle = g;
    c.fillRect(0, 0, S, S);
    return cv;
  }

  function rand(min, max) { return min + Math.random() * (max - min); }

  /* opts: { canvas, toggle, stop, count, spawn(p, w, h, scatter, i),
              step(p, dt, w, h) -> false to retire, draw(ctx, p, w, h),
              toggleStops } */
  function create(opts) {
    var canvas  = document.getElementById(opts.canvas);
    var toggle  = document.getElementById(opts.toggle);
    var stopBtn = document.getElementById(opts.stop);
    if (!canvas) return null;

    var ctx = canvas.getContext('2d');
    var w = 0, h = 0;
    var items = [];
    var running = false;
    var last = 0;

    function resize() {
      var r = videoRect();
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      canvas.style.left   = r.left + 'px';
      canvas.style.top    = r.top + 'px';
      canvas.style.width  = r.width + 'px';
      canvas.style.height = r.height + 'px';
      // Deliberately DPR 1: soft blobs gain nothing from a retina backing
      // store, and this page stays open for long stretches.
      canvas.width = w;
      canvas.height = h;
    }

    function seed() {
      items = [];
      for (var i = 0; i < opts.count; i++) items.push(opts.spawn({}, w, h, true, i));
    }

    /* Effects with a fixed cast seed once and keep the same particles. Ones
       driven by events (ripples) declare count 0 and push particles in as they
       happen; step() returning false retires them. */
    function add(init) {
      if (!running) return null;
      var p = opts.spawn(init || {}, w, h, false, items.length);
      items.push(p);
      return p;
    }

    function render() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);   // undo any per-particle rotation
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';   // overlaps glow brighter
      for (var i = 0; i < items.length; i++) opts.draw(ctx, items[i], w, h);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    function frame(now) {
      if (!running) return;
      // Per-second speed via delta time, so 60Hz and 144Hz match. Clamped
      // because rAF pauses in background tabs — without this, particles
      // teleport when you come back.
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      // Backwards, so retiring a particle doesn't skip its neighbour.
      for (var i = items.length - 1; i >= 0; i--) {
        if (opts.step(items[i], dt, w, h) === false) items.splice(i, 1);
      }
      render();
      requestAnimationFrame(frame);
    }

    function sync() {
      if (!toggle) return;
      var label = running ? opts.pauseLabel : opts.playLabel;
      toggle.dataset.state = running ? 'playing' : 'paused';
      toggle.setAttribute('aria-label', label);
      toggle.setAttribute('title', label);
    }

    function start() {
      if (running) return;
      if (!items.length) seed();
      running = true;
      last = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      requestAnimationFrame(frame);
      sync();
    }

    function pause() { running = false; sync(); }                 // freeze in place

    function stop() {                                             // clear and reset
      running = false;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);
      items = [];
      sync();
    }

    function refit() {
      resize();
      if (items.length) { seed(); if (!running) render(); }
    }

    if (toggle)  toggle.addEventListener('click', function () {
      // toggleStops: a single on/off button, where off also clears. Effects
      // with a separate stop button freeze in place instead.
      if (running) { if (opts.toggleStops) stop(); else pause(); }
      else start();
    });
    if (stopBtn) stopBtn.addEventListener('click', stop);

    // Position tracks the video's rect; playback is independent of it.
    video.addEventListener('loadedmetadata', refit);
    window.addEventListener('resize', refit);

    resize();
    sync();

    return { start: start, pause: pause, stop: stop, add: add,
             isRunning: function () { return running; } };
  }

  window.Overlay = { create: create, rect: videoRect, sprite: makeSprite, rand: rand };
})();
