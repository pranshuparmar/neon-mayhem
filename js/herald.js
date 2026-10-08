// The papers. After the big moments — a manhunt you slipped, an armoured van
// hit, a getaway stopped by somebody passing, Rico Salazar's last ride — the
// next morning's front page slides in for a few seconds: the masthead, the
// date, the headline, and the scene in newsprint grey (photo.js takes it).
//
// It never stops the game: it hangs at the top of the screen, waits out any
// menu or map, goes when it has been read, and a click sends it away sooner.
// The same kind of story twice reads differently, and a big one comes once.
GAME.herald = (function () {
  var SHOW = 9, COOLDOWN = 150;   // seconds on screen, and between front pages
  var lastT = -1e9, queue = [], showing = null, showT = 0, el = null, printed = [], total = 0;
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // what each kind of story says, by how many times it has run before
  var STORIES = {
    manhunt: [
      function (o) { return { head: 'MANHUNT ENDS IN THIN AIR', sub: 'A ' + o.stars + '-star search across the city is called off. "We had them, and then we didn\'t," says a captain who would rather not be named.' }; },
      function (o) { return { head: 'POLICE LOSE SUSPECT — AGAIN', sub: 'Cruisers, roadblocks and a helicopter, and still no arrest. The department says it is "reviewing procedures."' }; },
      function (o) { return { head: 'WHO IS THE GHOST OF COSTA ROSA?', sub: 'Another ' + o.stars + '-star chase, another empty street. Officers off the record admit they have no name and no face.' }; }
    ],
    van: [
      function () { return { head: 'ARMORED VAN HIT IN BROAD DAYLIGHT', sub: 'Guards shaken but unhurt as the takings vanish into thin air. Security firm "deeply embarrassed."' }; },
      function () { return { head: 'ANOTHER VAN, ANOTHER HEIST', sub: 'Security firms double the guard on their rounds. Insurers ask whether that will be enough.' }; }
    ],
    hero: [
      function (o) { return o.what === 'thief'
        ? { head: 'HAVE-A-GO HERO FOILS HOLD-UP', sub: 'A passer-by brings down a thief fleeing ' + (o.shop || 'a store') + ' with the takings. "Didn\'t think twice," says a witness.' }
        : { head: 'GETAWAY ENDS IN A HEAP', sub: 'A fleeing car is run off the road by a bystander mid-chase. The department, in a statement, says thank you.' }; },
      function (o) { return { head: 'CITY\'S MYSTERY CRIME-STOPPER STRIKES AGAIN', sub: 'Another collar, another stranger who would not leave a name. The police are grateful. Mostly.' }; }
    ],
    samaritan: [
      function () { return { head: 'THE STRANGER WHO HELPS STRANGERS', sub: 'A missed flight, a stolen bike, a lost dog, a date — Costa Rosa is full of people with a story about the same kind soul. Nobody got a name.' }; }
    ],
    rico: [
      function () { return { head: 'SALAZAR\'S LAST RIDE ENDS AT THE MARINA', sub: 'Rico Salazar, long said to run the harbour, is gone at high tide. The strip, they say, belongs to Lola Reyes now.' }; }
    ],
    heist: [
      function (o) { return { head: 'SAVINGS & LOAN CLEANED OUT', sub: o.alarm
        ? 'The alarm was ringing, the street was full of police, and still the vault on the strip stands empty. "Professionals," says a detective, with something like respect.'
        : 'Nobody heard a thing. The vault on the strip was opened like a tin of sardines, and the getaway car was a colour no witness can agree on.' }; }
    ]
  };
  var ONCE = { rico: true, samaritan: true, heist: true };

  function prefs() { GAME.prefs = GAME.prefs || {}; return GAME.prefs; }
  function runs(kind) { var h = prefs().herald || {}; return h[kind] || 0; }
  function counted(kind) {
    var p = prefs(); p.herald = p.herald || {};
    p.herald[kind] = (p.herald[kind] || 0) + 1;
    if (GAME.save) GAME.save();
  }
  // the camera's way with the date: today's, in 1986
  function dateline() {
    var now = new Date(), d = new Date(1986, now.getMonth(), now.getDate());
    return DAYS[d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate() + ', 1986';
  }

  function build() {
    el = document.getElementById('herald');
    if (!el) return;
    el.addEventListener('click', function () { if (showing) showT = Math.min(showT, 0.35); });
  }
  function busy() {
    return GAME.paused || GAME.mapOpen || GAME.shopOpen || GAME.shareOpen || GAME.lolaOpen ||
      (GAME.photo && (GAME.photo.albumOpen || GAME.photo.viewing));
  }

  // Run a story. Returns whether it made the paper — a once-only story that
  // already ran, or anything inside the cooldown of the last one, does not
  // (unless it is `big`).
  function front(kind, o) {
    var list = STORIES[kind];
    if (!list) return false;
    var n = runs(kind);
    if (ONCE[kind] && n > 0) return false;
    if (!ONCE[kind] && GAME.time - lastT < COOLDOWN) return false;
    lastT = GAME.time;
    var story = list[Math.min(n, list.length - 1)](o || {});
    counted(kind);
    var page = { kind: kind, head: story.head, sub: story.sub, date: dateline(), photo: null };
    printed.push(page); total++;
    if (printed.length > 3) printed.shift();   // (a photograph each: keep only the last few)
    // the scene, as it is right now
    if (GAME.photo && GAME.photo.grab) GAME.photo.grab(function (c) { page.photo = c; if (showing === page) fill(page); });
    queue.push(page);
    if (GAME.track) GAME.track('front-page');
    return true;
  }

  function fill(page) {
    if (!el) return;
    el.querySelector('.hd-date').textContent = page.date + '  ·  Final edition  ·  25¢';
    el.querySelector('.hd-head').textContent = page.head;
    el.querySelector('.hd-sub').textContent = page.sub;
    var ph = el.querySelector('.hd-photo');
    ph.innerHTML = '';
    if (page.photo) ph.appendChild(page.photo);
    ph.style.display = page.photo ? '' : 'none';
  }
  function update(dt) {
    if (!el) return;
    if (showing) {
      // a menu over it puts it away until the game is back
      if (busy()) { el.classList.remove('on'); return; }
      el.classList.add('on');
      showT -= dt;
      if (showT <= 0) { showing = null; el.classList.remove('on'); }
      return;
    }
    if (!queue.length || busy()) return;
    showing = queue.shift();
    showT = SHOW;
    fill(showing);
    el.classList.add('on');
  }

  return {
    init: build,
    front: front,
    update: update,
    get showing() { return showing; },
    get printed() { return printed; },
    get total() { return total; },   // pages run this session (printed keeps the last few)
    // headless hook: let the next story run whatever ran last
    resetCooldown: function () { lastT = -1e9; }
  };
})();
