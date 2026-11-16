/* Service worker: keeps the video on disk so repeat visits don't re-stream it.
   GitHub Pages sends Cache-Control: max-age=600 and we can't change that, so
   the HTTP cache alone would revalidate every 10 minutes and browsers evict
   large media early. The Cache API ignores both problems. */
'use strict';

var VERSION = 'aquarium-a-v2.1';
var VIDEO   = 'assets/ambiance-recode.mp4';

// Small files, precached so the page works offline.
var SHELL = [
  './', 'index.html', 'style.css', 'script.js',
  'volume.js', 'overlay.js', 'bubbles.js', 'glare.js', 'ripples.js',
  'filter.js', 'menu.js', 'landing.js',
  'favicon.svg'
];

function videoUrl() { return new URL(VIDEO, self.registration.scope).href; }

/* Serve a byte range out of a cached full response. The video element always
   requests ranges, and handing it a 200 with the whole body breaks playback
   and seeking in some browsers (Safari most strictly) — it needs a real 206
   with a matching Content-Range. */
async function serveRange(cached, rangeHeader) {
  var blob  = await cached.blob();          // lazy; .slice() doesn't load it all
  var total = blob.size;
  var type  = cached.headers.get('Content-Type') || 'video/mp4';

  if (!rangeHeader) {
    return new Response(blob, {
      status: 200,
      headers: { 'Content-Type': type, 'Content-Length': String(total),
                 'Accept-Ranges': 'bytes' }
    });
  }

  var m = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
  if (!m) return new Response(null, { status: 416 });

  var start = m[1] === '' ? 0 : parseInt(m[1], 10);
  var end   = m[2] === '' ? total - 1 : parseInt(m[2], 10);
  if (isNaN(start) || start >= total) return new Response(null, {
    status: 416, headers: { 'Content-Range': 'bytes */' + total }
  });
  if (end >= total) end = total - 1;
  if (end < start) end = start;

  return new Response(blob.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': type,
      'Content-Length': String(end - start + 1),
      'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
      'Accept-Ranges': 'bytes'
    }
  });
}

/* First visit: fetch the whole file once (no Range header, so a plain 200),
   split the stream, hand one half to the video and store the other. One
   download, and playback still starts progressively. */
async function fetchAndCache(request, waitUntil) {
  var cache = await caches.open(VERSION);
  var net   = await fetch(videoUrl());
  if (!net.ok || !net.body) return fetch(request);

  var parts = net.body.tee();
  var headers = new Headers(net.headers);
  waitUntil(cache.put(videoUrl(), new Response(parts[1], { status: 200, headers: headers })));

  var range = request.headers.get('range');
  var total = parseInt(headers.get('Content-Length'), 10);
  if (range && !isNaN(total)) {
    // Only the opening "bytes=0-" reaches here, so the whole body is the
    // requested range.
    return new Response(parts[0], {
      status: 206,
      headers: {
        'Content-Type': headers.get('Content-Type') || 'video/mp4',
        'Content-Length': String(total),
        'Content-Range': 'bytes 0-' + (total - 1) + '/' + total,
        'Accept-Ranges': 'bytes'
      }
    });
  }
  return new Response(parts[0], { status: 200, headers: headers });
}

async function handleVideo(request, waitUntil) {
  var cache  = await caches.open(VERSION);
  var cached = await cache.match(videoUrl());
  if (cached) return serveRange(cached, request.headers.get('range'));

  // Only an open-ended "bytes=0-" is worth caching from: it asks for the whole
  // file anyway. A mid-file seek, or a bounded head request made before
  // anything is cached, goes to the network rather than pulling 80 MB to
  // satisfy a few bytes.
  var range = request.headers.get('range');
  if (range && !/^bytes=0-$/.test(range.trim())) return fetch(request);

  return fetchAndCache(request, waitUntil);
}


/* Everything else is network-first so a redeploy shows up immediately,
   falling back to the cache when offline. */
async function handleShell(request) {
  try {
    var net = await fetch(request);
    if (net && net.ok) {
      var cache = await caches.open(VERSION);
      cache.put(request, net.clone());
    }
    return net;
  } catch (e) {
    var hit = await caches.match(request);
    if (hit) return hit;
    throw e;
  }
}

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) {
    return c.addAll(SHELL);
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) {
      return k === VERSION ? null : caches.delete(k);
    }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith(VIDEO)) {
    e.respondWith(handleVideo(req, e.waitUntil.bind(e)));
  } else {
    e.respondWith(handleShell(req));
  }
});

// Exported for the test harness; harmless in the browser.
self._internals = { serveRange: serveRange, handleVideo: handleVideo };
