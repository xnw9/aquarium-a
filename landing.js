/* Landing state: the first frame behind frosted glass, one play button, and
   nothing else. Clicking it starts playback, fades the glass out and fades
   the controls in. */
(function () {
  'use strict';

  var landing = document.getElementById('landing');
  var button  = document.getElementById('landingPlay');
  var video   = document.getElementById('player');
  if (!landing || !button || !video) return;

  var dismissed = false;

  function dismiss() {
    if (dismissed) return;
    dismissed = true;

    video.play().catch(function () { /* blocked — glass still clears */ });
    document.body.classList.add('ready');   // fades the controls in
    landing.classList.add('is-gone');       // fades the glass out

    // Once faded, take it out of the layout entirely so it can't swallow
    // clicks or sit in the accessibility tree. The timeout is a fallback for
    // when transitionend never fires (reduced motion, interrupted transition).
    var remove = function () { landing.hidden = true; };
    landing.addEventListener('transitionend', remove, { once: true });
    setTimeout(remove, 1500);
  }

  button.addEventListener('click', dismiss);
})();
