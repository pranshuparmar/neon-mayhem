// Optional, anonymous visit counting via GoatCounter (goatcounter.com).
//
// The game must never depend on this. When the counter script is blocked,
// offline, or absent, every call here is a silent no-op — nothing is retried
// forever, nothing throws, and nothing is stored in the visitor's browser.
//
// The counter is only reached for on a real deployment: opened from file://,
// localhost, or a LAN address, this module does nothing at all and never
// touches the network, so the game keeps working offline and local play does
// not land in the numbers.
//
// count.js loads async, so events fired before it arrives are queued and
// flushed once it is ready; if it never arrives the queue is quietly
// abandoned. Each event counts at most once per page load — the interesting
// figures are per-visit ratios (started vs finished), not repeat presses.
GAME.analytics = (function () {
  var ENDPOINT = 'https://neon-mayhem.goatcounter.com/count';
  var seen = {}, queue = [], timer = null, tries = 0, started = false;

  // Where the page was opened from does not change while it is open, and
  // track() is asked every tick in the air: the answer is worked out once.
  var local = null;
  function isLocal() {
    if (local === null) local = checkLocal();
    return local;
  }
  function checkLocal() {
    try {
      if (location.protocol === 'file:') return true;
      var h = location.hostname;
      if (!h || h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '::1') return true;
      if (h.slice(-6) === '.local') return true;
      return /^192\.168\./.test(h) || /^10\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h);
    } catch (e) { return true; }
  }

  function start() {
    if (started || isLocal()) return;
    started = true;
    var s = document.createElement('script');
    s.async = true;
    s.setAttribute('data-goatcounter', ENDPOINT);
    s.src = 'https://gc.zgo.at/count.js';
    s.onerror = function () { queue.length = 0; };   // blocked: stop caring
    (document.head || document.documentElement).appendChild(s);
  }

  function flush() {
    var gc = window.goatcounter;
    if (!gc || typeof gc.count !== 'function') return false;
    while (queue.length) {
      var path = queue.shift();
      try {
        gc.count({ path: path, event: true });
      } catch (e) {
        // counting must never surface an error into the game
      }
    }
    return true;
  }

  function track(name) {
    if (!name || seen[name] || isLocal()) return;
    seen[name] = 1;
    queue.push(name);
    if (flush() || timer) return;
    timer = setInterval(function () {
      if (flush() || ++tries >= 15) { clearInterval(timer); timer = null; }
    }, 1000);
  }

  return { start: start, track: track };
})();

// one call site for the rest of the game; harmless everywhere
GAME.track = function (name) { GAME.analytics.track(name); };
