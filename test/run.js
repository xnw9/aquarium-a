/* Runs every harness against the repo root. `node test/run.js`
   These stub the DOM and assert on JavaScript behaviour only — nothing is
   laid out or painted, so they cannot catch CSS or visual regressions. */
'use strict';
var cp = require('child_process');
var path = require('path');
var ROOT = path.join(__dirname, '..');

var SUITES = [
  ['stubtest',    'overlay core, bubbles and glare: 300 frames, finite draw args'],
  ['fadetest',    'loop fade curve, no dip on the opening play'],
  ['voltest',     'volume panel, icon thresholds, mute at zero'],
  ['swtest',      'service worker range handling, 206 slicing, one fetch'],
  ['rippletest',  'click ripples: placement, retirement, no particle leak'],
  ['filtertest',  'highlight tone curve: monotonic, neutral, toggle class'],
  ['menutest',    'controls collapse, volume panel closes with it'],
  ['landingtest', 'landing glass, opening play, transitionend fallback']
];

var failed = [];
SUITES.forEach(function (s) {
  var r = cp.spawnSync(process.execPath, [path.join(__dirname, s[0] + '.js'), ROOT],
                       { encoding: 'utf8' });
  var ok = r.status === 0;
  if (!ok) failed.push(s[0]);
  console.log((ok ? 'PASS  ' : 'FAIL  ') + s[0].padEnd(12) + s[1]);
  if (!ok) console.log(r.stdout + r.stderr);
});

console.log('');
console.log(failed.length ? failed.length + ' suite(s) failed: ' + failed.join(', ')
                          : 'all ' + SUITES.length + ' suites passed');
process.exit(failed.length ? 1 : 0);
