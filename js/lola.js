// Lola, as the voice in your ear and not only the one with work for you.
//
// The first time something happens that the game never explains — a cassette
// picked up off the pavement, a ramp that pays, a star, a boat — nobody said
// what it was or why it mattered. Now Lola pages it, once: the first tape,
// the first jump, the first star, the first time in each kind of vehicle, the
// first shift on offer, the first night in hospital. Each line is said once
// for the life of the save, and TIPS on the pause screen turns them off for
// anybody who knows the town already.
GAME.lola = (function () {
  function K(code) { return GAME.controls ? GAME.controls.label(code) : code.replace(/^Key/, ''); }
  function onPad() { return !!(GAME.controls && GAME.controls.usingPad && GAME.controls.usingPad()); }
  function touch() { return !!GAME.isTouch; }
  // the lines, written as she talks; a function where it names a control
  var TIPS = {
    tape: 'That\'s a lost tape. A pirate DJ broadcast off the end of the pier till they shut him down, and his mixtapes went everywhere — thirty of them, both islands. Each one pays; the radar glints when you\'re close. Find them all and he\'s back on the air.',
    stunt: 'Unique stunt jump! Every ramp in town pays the first time you clear it — the faster the better. Find them all and it\'s worth your while.',
    islaJump: 'Isla Verde keeps its own ten jumps, on a tally of their own — and a prize of its own when you\'ve cleared them all.',
    star: 'You\'ve caught the law\'s eye. Get out of sight and lie low and it fades. Fresh paint at a respray loses a star or two, and the desk sergeant at the station can lose the paperwork — for a price.',
    stars3: 'Three stars: they know your face now, so paint won\'t fool them. Break their line of sight and lie low, or go and see the sergeant. A night at home helps too.',
    wasted: 'You\'ll live. The hospital keeps your cash but your guns are gone. Own a place and you wake up there instead, with everything.',
    busted: 'Busted. They take a fine and your hardware. Next time lose the stars before they box you in — a car stopped next to a cruiser is a car they can cuff you out of.',
    boat: 'A boat! No cruiser can follow you out on the water — but the harbour patrol has launches of its own. The bay has work too: look for the rings by the piers.',
    heli: function () { return touch() ? 'Now you\'re flying. UP and DN take her up and down. The ceiling\'s around two hundred metres — and the law follows up here with a helicopter of its own.'
      : 'Now you\'re flying. ' + K('Space') + ' takes her up, ' + K('ShiftLeft') + ' down. The ceiling\'s around two hundred metres — and the law follows up here with a helicopter of its own.'; },
    plane: function () { return 'Runway\'s that way. Build some speed, pull up, and if it all goes wrong, ' + (touch() ? 'EXIT' : K('KeyF')) + ' gets you out with a parachute.'; },
    swim: 'Swimming? You can\'t hold a gun in the water. Climb out up the sand, onto a pier, or anywhere low enough to grab.',
    respray: 'Fresh paint, fresh start — up to two stars go with the old colour. From three up they know your face, and paint won\'t help.',
    job: function () { return 'That ride has work in it. ' + (touch() ? 'Press JOB' : 'Press ' + K('KeyJ')) + ' to start a shift — every run pays, and each level asks a bit more of you.'; },
    shop: 'Shops are walk-ins: stand on the glowing mat at the door. Guns, clothes, cars, a place to live — if you\'ve got the money.',
    home: 'Your own place. Sleep it off to skip eight hours and shed some heat, and if you go down nearby you wake up here instead of the hospital.',
    casino: 'The Lucky Gull. The wheel\'s honest, mostly, the horses run on the screens down the right, and the bar patches you up. Spend what you can afford to lose.',
    derby: 'Gull Downs! Pick a horse and a stake. The odds are on the board: a 4/1 shot pays four times your stake plus your money back, and the long shots pay big because they mostly lose. Then watch it run.',
    wardrobe: 'Everything you own hangs in here, and changing is free. Buy something at THREADS and it turns up in every place you own.',
    business: 'A business of your own. The till fills through the day — three days of it, no more — and sits there till you come and empty it at the counter. Leave it too long and somebody with a mask will empty it for you.',
    photo: function () { return 'Nice shot. Your photos are kept in the album — ' + (touch() ? 'PAUSE' : 'Esc') + ', then PHOTOS — and you can download the ones you like.'; }
  };

  function prefs() { GAME.prefs = GAME.prefs || {}; return GAME.prefs; }
  function seen() { var p = prefs(); return p.lolaSeen || (p.lolaSeen = {}); }
  function tipsOn() { return !prefs().tipsOff; }

  // The first time `key` comes up: say it (if tips are on) and remember it
  // was said either way, so switching tips back on later does not bring a
  // backlog of everything that happened while they were off.
  function first(key) {
    var line = TIPS[key];
    if (!line) return false;
    var s = seen();
    if (s[key]) return false;
    s[key] = true;
    if (GAME.save) GAME.save();
    if (!tipsOn() || !GAME.hud || !GAME.hud.pager) return false;
    GAME.hud.pager('LOLA', typeof line === 'function' ? line() : line);
    if (GAME.track) GAME.track('tip-' + key);
    return true;
  }
  function setTips(on) {
    prefs().tipsOff = !on;
    if (GAME.save) GAME.save();
  }

  // ---------- call her ----------
  // Lola as an assistant you can ask, not only a pager that goes off: L (or
  // ASK LOLA on the pause screen, which is how a phone reaches her) and she
  // asks what she can do for you — what to do next, how to lose the law,
  // where the money is, the way to a shop or home, what a thing is, how you
  // are doing, the controls. Where an answer is a place, she marks it on
  // your map. The game holds still while you talk, as it does on the map.
  var view = null, sel = 0, opts = [];
  function $(id) { return document.getElementById(id); }
  function F() { return GAME.focus(); }
  function dist(x, z) { var f = F(); return Math.hypot(x - f.x, z - f.z); }
  function far(x, z) {
    var d = dist(x, z);
    return d < 1000 ? Math.round(d / 10) * 10 + ' m' : (d / 1000).toFixed(1) + ' km';
  }
  // which way, as the map has it: north is up the map (-z), east is right (+x)
  function way(x, z) {
    var f = F(), a = Math.atan2(x - f.x, -(z - f.z)) * 180 / Math.PI;
    return ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'][Math.round(((a + 360) % 360) / 45) % 8];
  }
  function there(x, z) { return far(x, z) + ' ' + way(x, z) + ' of you'; }
  function islaOpen() { return !GAME.isla || GAME.isla.isOpen(); }
  function onIsla(x, z) { return !!(GAME.isla && GAME.isla.contains && GAME.isla.contains(x, z)); }
  function reachable(x, z) { return islaOpen() || !onIsla(x, z); }
  function nearest(list, xz) {
    var best = null, bd = 1e18;
    list.forEach(function (it) {
      var p = xz(it);
      if (!p || !reachable(p.x, p.z)) return;
      var d = dist(p.x, p.z);
      if (d < bd) { bd = d; best = { it: it, x: p.x, z: p.z }; }
    });
    return best;
  }
  function locs(kind) { return GAME.shops && GAME.shops.locations ? GAME.shops.locations().filter(function (l) { return l.kind === kind && l.at; }) : []; }
  function mark(x, z, what) {
    return { label: '📍 MARK IT ON MY MAP', fn: function () {
      if (GAME.nav) GAME.nav.setDest(x, z);
      close();
      if (GAME.hud && GAME.hud.pager) GAME.hud.pager('LOLA', 'Marked: ' + what + '. Follow the line on your radar.');
    } };
  }

  // -- the answers --
  function nextThing() {
    var M = GAME.missions, a = M && M.active;
    if (!a && GAME.guide && GAME.guide.step) return { say: GAME.guide.now() };
    if (a) {
      return { say: 'You\'re on ' + a.def.name + ' right now: ' + (M.objectiveText() || 'see it through') +
        '. Finish it — or ' + (touch() || onPad() ? 'ABANDON on the pause screen' : K('KeyX') + ' twice') + ' if you want out.' };
    }
    var bests = GAME.bests || {};
    var left = M ? M.DEFS.filter(function (d) { return bests[d.id] === undefined && (!d.isla || islaOpen()); }) : [];
    var n = nearest(left, function (d) { return d.start; });
    if (n) {
      var d = n.it, kind = { race: 'a race', courier: 'a delivery', takedown: 'a takedown', rampage: 'a rampage' }[d.type] || 'a job';
      var won = M.DEFS.filter(function (dd) { return bests[dd.id] !== undefined; }).length, more = Math.max(1, 4 - won);
      var shut = !islaOpen() ? ' Win ' + (more === 1 ? 'one more' : more + ' more') + ' of my jobs and they open the bridges to Isla Verde.' : '';
      return { say: d.name + ' — ' + kind + ', ' + there(n.x, n.z) + '. That\'s the closest thing on my list you haven\'t done.' + shut,
        acts: [mark(n.x, n.z, d.name)] };
    }
    var ST = GAME.stunts, T = GAME.tapes;
    if (ST && ST.found < ST.total) return { say: 'Every job on my list is done — nice. There are still stunt jumps you haven\'t cleared (' + ST.found + ' of ' + ST.total + '), and the radar glints near a lost tape.' };
    return { say: 'Honestly? You\'ve done it all. Go spend some of that money — the casino on the pier would love to see you.' };
  }
  function theLaw() {
    var w = GAME.police.wanted, acts = [];
    if (w <= 0) return { say: 'You\'re clean. Keep it that way — and remember a cruiser stopped next to you can cuff you out of a car.' };
    var rs = nearest(GAME.city.pois.resprays || [], function (r) { return r.door; });
    var desk = nearest(locs('bribe'), function (l) { return l.at; });
    var home = nearest(locs('safehouse').filter(function (l) { return GAME.shops.owns(l.sh.id); }), function (l) { return l.at; });
    var say;
    if (w <= 2) {
      say = (w === 1 ? 'One star.' : 'Two stars.') + ' Break their line of sight and lie low and it fades. Or fresh paint: ' +
        (rs ? 'the nearest respray is ' + there(rs.x, rs.z) + '.' : 'any respray will do.');
      if (rs) acts.push(mark(rs.x, rs.z, 'the respray'));
    } else {
      say = w + ' stars — they know your face, so paint won\'t fool them. Get out of sight and lie low, or have a word with the desk sergeant' +
        (desk ? ' at the station ' + there(desk.x, desk.z) : '') + ' — he loses paperwork, for a price.' +
        (home ? ' Or go home and sleep it off: yours is ' + there(home.x, home.z) + '.' : '');
      if (desk) acts.push(mark(desk.x, desk.z, 'the desk sergeant'));
    }
    if (home && w <= 2) say += ' Your own place is ' + there(home.x, home.z) + ' — nobody sees in.';
    if (home) acts.push({ label: '🏠 MARK MY PLACE', fn: mark(home.x, home.z, home.it.sh.name).fn });
    return { say: say, acts: acts };
  }
  function money() {
    var bests = GAME.bests || {}, M = GAME.missions, ST = GAME.stunts, T = GAME.tapes;
    var left = M ? M.DEFS.filter(function (d) { return bests[d.id] === undefined && (!d.isla || islaOpen()); }).length : 0;
    var lines = [];
    lines.push('Jobs pay every run: get in a taxi, an ambulance or a police cruiser and press ' + (touch() ? 'JOB' : K('KeyJ')) + '.' + (islaOpen() ? ' The ice cream truck on Isla Verde has rounds too — the horn plays the chimes.' : ''));
    if (left) lines.push(left + ' of my jobs are still waiting for you, and the first win on each pays best.');
    if (ST && ST.found < ST.total) lines.push((ST.total - ST.found) + ' stunt jumps still pay their first-time money.');
    if (T && T.found < T.total) lines.push((T.total - T.found) + ' lost tapes are out there, each worth something.');
    var B = GAME.business;
    if (B && B.count < B.total) lines.push('Or let money come to you: buy a business — the barber, THREADS, a hardware store, the bar in the Lucky Gull — and its till fills every day.');
    else if (B && B.count) lines.push('Your businesses are taking money for you — go and empty the tills.');
    lines.push('And there\'s the Lucky Gull, if you feel lucky.');
    return { say: lines.join(' ') };
  }
  var PLACES = [
    ['hardware', '🔫 GUNS & ARMOR', 'the gun shop'], ['dress', '👕 CLOTHES', 'THREADS'], ['barber', '💈 A HAIRCUT', 'the barber'],
    ['showroom', '🏎 A NEW RIDE', 'the showroom'], ['home', '🏠 MY PLACE', 'your place'], ['casino', '🎰 THE CASINO', 'the Lucky Gull'],
    ['hospital', '➕ A HOSPITAL', 'the hospital'], ['bribe', '🚔 THE DESK SERGEANT', 'the station desk']
  ];
  function placeOf(kind) {
    if (kind === 'hospital') return nearest(GAME.city.pois.hospitals || [], function (h) { return h; });
    if (kind === 'home') {
      var owned = locs('safehouse').filter(function (l) { return GAME.shops.owns(l.sh.id); });
      return nearest(owned.length ? owned : locs('safehouse'), function (l) { return l.at; });
    }
    return nearest(locs(kind), function (l) { return l.at; });
  }
  function takeMe() {
    return { say: 'Where to? I\'ll put it on your map.', list: PLACES.map(function (p) {
      return { label: p[1], fn: function () {
        var n = placeOf(p[0]);
        if (!n) { answer({ say: 'Nothing like that I can get you to right now.' }); return; }
        var name = p[0] === 'home' && n.it.sh ? (GAME.shops.owns(n.it.sh.id) ? n.it.sh.name : n.it.sh.name + ' (for sale)') : n.it.name || p[2];
        answer({ say: (name || p[2]) + ' is ' + there(n.x, n.z) + '.', acts: [mark(n.x, n.z, name || p[2])] });
      } };
    }) };
  }
  var TOPICS = [['tape', 'Lost tapes'], ['stunt', 'Stunt jumps'], ['star', 'The law'], ['job', 'Jobs in a vehicle'],
    ['shop', 'Shops'], ['home', 'A place of your own'], ['wardrobe', 'Your wardrobe'], ['casino', 'The casino'], ['derby', 'The horses'],
    ['boat', 'Boats'], ['heli', 'Helicopters'], ['plane', 'Planes'], ['swim', 'Swimming'], ['respray', 'Resprays'], ['photo', 'Your camera']];
  function explain() {
    return { say: 'Ask away. What do you want to know about?', list: TOPICS.map(function (t) {
      return { label: t[1].toUpperCase(), fn: function () { answer({ say: lineOf(t[0]) }); } };
    }) };
  }
  function lineOf(k) { var l = TIPS[k]; return typeof l === 'function' ? l() : l; }
  function howAmI() {
    var bests = GAME.bests || {}, M = GAME.missions, ST = GAME.stunts, T = GAME.tapes, P = GAME.player, done = 0;
    if (M) M.DEFS.forEach(function (d) { if (bests[d.id] !== undefined) done++; });
    var homes = GAME.shops ? locs('safehouse').filter(function (l) { return GAME.shops.owns(l.sh.id); }).length : 0;
    var g = GAME.shops && GAME.shops.garage ? GAME.shops.garage().length : 0;
    var pct = Math.round(100 * (done + (ST ? ST.found + (ST.islaFound || 0) : 0) + (T ? T.found : 0)) /
      Math.max(1, (M ? M.DEFS.length : 0) + (ST ? ST.total + (ST.islaTotal || 0) : 0) + (T ? T.total : 0)));
    return { say: 'Jobs on my list: ' + done + ' of ' + (M ? M.DEFS.length : 0) + '. Stunt jumps: ' + (ST ? ST.found + ' of ' + ST.total : '—') +
      (ST && ST.islaTotal && islaOpen() ? ', and ' + ST.islaFound + ' of ' + ST.islaTotal + ' on the island' : '') + '. Lost tapes: ' + (T ? T.found + ' of ' + T.total : '—') +
      (GAME.strangers ? '. Strangers helped: ' + GAME.strangers.done + ' of ' + GAME.strangers.total : '') +
      (GAME.heist && (GAME.heist.offered() || GAME.heist.step > 0) ? '. The big score: ' + Math.min(GAME.heist.step, 4) + ' of 4 parts' : '') +
      (GAME.business && GAME.business.count ? '. Businesses: ' + GAME.business.count + ' of ' + GAME.business.total : '') +
      '. You\'re holding $' + P.cash.toLocaleString() + ', you own ' + homes + ' of 3 places' + (g ? ' and ' + g + ' in the garage' : '') +
      '. Call it ' + pct + '% of Costa Rosa. ' + (pct < 25 ? 'Plenty left.' : pct < 75 ? 'Getting somewhere.' : 'Nearly there, kid.') };
  }
  // the Savings & Loan: where it stands, and the next part to go and do
  function bigScore() {
    var H = GAME.heist, b = H.board();
    return { say: b.say, list: b.next ? [{ label: '▶ ' + b.next, fn: function () { close(); H.begin(); } }] : [] };
  }
  function controlsHelp() {
    if (onPad()) return { say: 'Left stick moves, right stick looks. RT fires and LT aims on foot; in anything with an engine they are the throttle and the brake. ' +
      'A jumps, B sprints, Y gets in and out, X starts a job. LB and RB pick a target or fire out of the window, R3 the horn, L3 a photo, the D-pad weapons and the radio. ' +
      'BACK is the map. START pauses — and that is where you find me.' };
    if (touch()) return { say: 'Left thumb: wherever it lands is your stick. Right side: FIRE, JUMP and RUN on foot, the pedals in a car. EXIT gets you in and out, JOB starts a shift, 📢 is the horn, 📷 takes a photo. PAUSE has the map, your settings — and me.' };
    return { say: K('KeyW') + K('KeyA') + K('KeyS') + K('KeyD') + ' to move, the mouse to look, left click to fire and right click (or ' + K('Tab') + ') to lock on. ' +
      K('KeyF') + ' gets in and out, ' + K('Space') + ' jumps or climbs, ' + K('ShiftLeft') + ' sprints. ' + K('KeyJ') + ' starts a job, ' + K('KeyG') + ' the horn, ' +
      K('KeyC') + ' a photo (' + K('KeyV') + ' to see it), ' + K('KeyP') + ' the map, and ' + K('KeyL') + ' gets me. CONTROLS on the pause screen rebinds the lot.' };
  }

  function topLevel() {
    var w = GAME.police && GAME.police.wanted > 0, law;
    var list = [
      { label: '🧭 WHAT SHOULD I DO NEXT?', fn: function () { answer(nextThing()); } },
      // her guided first day (guide.js), for anyone who turned it down or
      // walked off part way, until it has been seen through once
      GAME.guide && GAME.guide.canStart() ? { label: '🎓 SHOW ME THE ROPES', fn: function () { close(); GAME.guide.begin(); } } : null,
      // her big score, once the bridges are open (heist.js)
      GAME.heist && GAME.heist.offered() && !GAME.heist.busy ? { label: '💰 THE BIG SCORE', fn: function () { answer(bigScore()); } } : null,
      law = { label: w ? '🚨 I\'VE GOT THE LAW ON ME' : '🚨 HOW DO I LOSE THE LAW?', fn: function () { answer(theLaw()); } },
      { label: '💰 WHERE\'S THE MONEY?', fn: function () { answer(money()); } },
      { label: '📍 TAKE ME SOMEWHERE', fn: function () { answer(takeMe()); } },
      { label: '📖 TELL ME ABOUT…', fn: function () { answer(explain()); } },
      { label: '📊 HOW AM I DOING?', fn: function () { answer(howAmI()); } },
      { label: '🎮 REMIND ME OF THE CONTROLS', fn: function () { answer(controlsHelp()); } },
      { label: '👋 NOTHING, THANKS', fn: close }
    ];
    list = list.filter(Boolean);
    // with the law on you, that comes first
    if (w) { list.splice(list.indexOf(law), 1); list.unshift(law); }
    var h = GAME.timeOfDay !== undefined && GAME.timeOfDay < 0.35 ? 'Up late, kid?' : 'Hey, kid.';
    return { say: h + (w ? ' Sounds busy where you are.' : '') + ' What can I do for you?', list: list, top: true };
  }

  // -- the screen --
  function render() {
    var v = view;
    // (somebody else asking — a stranger on the pavement: strangers.js)
    $('lola-from').textContent = v.from || '📟 LOLA';
    $('lola-say').textContent = v.say;
    opts = (v.list || []).slice();
    (v.acts || []).forEach(function (a) { opts.push(a); });
    if (!v.top) {
      opts.push({ label: '↩ SOMETHING ELSE', fn: function () { show(topLevel()); }, back: true });
      opts.push({ label: '✓ THANKS, LOLA', fn: close });
    }
    sel = Math.min(sel, opts.length - 1);
    var box = $('lola-opts');
    box.innerHTML = '';
    opts.forEach(function (o, i) {
      var b = document.createElement('div');
      b.className = 'lola-opt' + (i === sel ? ' sel' : '');
      b.textContent = o.label;
      b.addEventListener('click', function (e) { e.preventDefault(); sel = i; pick(); });
      box.appendChild(b);
    });
    var cur = box.children[sel];
    if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest' });
    $('lola-hint').textContent = touch() ? 'Tap one' : '↑↓ and Enter, or click  ·  Esc ' + (v.escSays || 'to go back');
  }
  function show(v) { view = v; sel = 0; render(); }
  function answer(v) { if (GAME.audio) GAME.audio.cashTick(); show(v); }
  // a choice is an answer: whatever it does, closing after it is not a no
  function pick() { var o = opts[sel]; if (o) { onClose = null; o.fn(); } }
  function open() {
    if (GAME.lolaOpen || !GAME.started || GAME.mapOpen || GAME.shopOpen || GAME.shareOpen) return false;
    if (GAME.player.state !== 'alive') return false;
    if (GAME.paused) GAME.togglePause();
    GAME.lolaOpen = true;
    $('lola-screen').style.display = 'flex';
    if (GAME.audio && GAME.audio.pagerBeep) GAME.audio.pagerBeep();
    if (GAME.releasePointer) GAME.releasePointer();
    if (GAME.syncOverlayMusic) GAME.syncOverlayMusic();
    show(topLevel());
    if (GAME.track) GAME.track('lola-called');
    return true;
  }
  // Open on a question of somebody else's (guide.js), rather than her menu.
  // Closing it without an answer — Esc, L, B — is an answer too: onClose.
  var onClose = null;
  function offer(v) {
    if (!open()) return false;
    onClose = v.onClose || null;
    show(v);
    return true;
  }
  function close() {
    if (!GAME.lolaOpen) return;
    var then = onClose;
    onClose = null;
    GAME.lolaOpen = false;
    $('lola-screen').style.display = 'none';
    if (GAME.syncOverlayMusic) GAME.syncOverlayMusic();
    if (GAME.regainPointer) GAME.regainPointer();
    if (then) then();
  }
  function key(code) {
    if (code === 'ArrowDown' || code === 'KeyS') { sel = (sel + 1) % opts.length; render(); }
    else if (code === 'ArrowUp' || code === 'KeyW') { sel = (sel - 1 + opts.length) % opts.length; render(); }
    else if (code === 'Enter' || code === 'Space' || code === 'KeyE') pick();
    else if (code === 'Escape' || code === 'Backspace' || code === 'KeyL') { if (view && !view.top) show(topLevel()); else close(); }
    else if (/^Digit[1-9]$/.test(code)) { var n = +code.slice(5) - 1; if (n < opts.length) { sel = n; pick(); } }
  }

  return {
    first: first,
    setTips: setTips,
    open: open,
    offer: offer,
    close: close,
    key: key,
    get isOpen() { return !!GAME.lolaOpen; },
    // headless: what is on offer, and choosing one by its label
    options: function () { return opts.map(function (o) { return o.label; }); },
    choose: function (re) { for (var i = 0; i < opts.length; i++) if (re.test(opts[i].label)) { sel = i; pick(); return true; } return false; },
    get says() { return view ? view.say : ''; },
    get tips() { return tipsOn(); },
    keys: function () { return Object.keys(TIPS); },
    // headless: what a tip says, as it would be said now
    line: function (key) { var l = TIPS[key]; return typeof l === 'function' ? l() : l; }
  };
})();
