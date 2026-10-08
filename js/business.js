// Businesses that pay. The barber, the tailor, the two hardware stores and
// the bar in the Lucky Gull can be bought outright at their own counters
// (BUY THE BUSINESS), and from then on they take money for you: the till
// fills through every day the city runs, up to three days of it, and
// waits for you to come by and empty it (THE TILL). A full till is money
// left on the counter — Lola says so, once. And a shop that is yours is
// the one a thief would rather hold up: he runs with what is in the till,
// so it is yours to get back (streetlife.js).
GAME.business = (function () {
  var DEFS = {
    barber0: { price: 12000, day: 600 },
    dress0: { price: 20000, day: 1000 },
    hardware0: { price: 30000, day: 1500 },
    hardware1: { price: 30000, day: 1500 },
    bar0: { price: 45000, day: 2200 }
  };
  var KEEP_DAYS = 3;

  function prefs() {
    GAME.prefs = GAME.prefs || {};
    var b = GAME.prefs.business;
    if (!b) b = GAME.prefs.business = { owned: {}, till: {}, told: {} };
    if (!b.told) b.told = {};
    return b;
  }
  function owns(id) { return !!prefs().owned[id]; }
  function till(id) { return Math.floor(prefs().till[id] || 0); }
  function cap(id) { return DEFS[id].day * KEEP_DAYS; }
  function dayLen() { return GAME.DAY_SECONDS || 720; }
  function nameOf(id) {
    if (id === 'bar0') return 'THE GULL BAR';
    var l = GAME.shops && GAME.shops.locations().filter(function (q) { return q.id === id; })[0];
    return l ? l.name : id;
  }

  // the counter rows (shops.js puts them under the trade's own)
  function rows(loc) {
    var d = loc && DEFS[loc.id];
    if (!d) return [];
    if (!owns(loc.id)) {
      return [{ id: 'biz_buy', name: 'BUY THE BUSINESS', price: d.price,
        ds: 'Yours outright. It takes about $' + d.day.toLocaleString() + ' a day into the till — come by and empty it (it holds three days).' }];
    }
    var t = till(loc.id);
    return [{ id: 'biz_till', name: 'THE TILL', price: 0, noPrice: true, chip: 'TAKE', off: t < 1,
      ds: t < 1 ? 'Empty. It fills through the day.' : '$' + t.toLocaleString() + ' waiting' + (t >= cap(loc.id) ? ' — full.' : '.') }];
  }
  // what a row does (shops.js has already taken the price)
  function act(loc, id) {
    var s = prefs();
    if (id === 'biz_buy') {
      s.owned[loc.id] = true;
      s.till[loc.id] = 0;
      GAME.hud.message(nameOf(loc.id) + ' is yours. The till fills through the day — come by and empty it.', 4);
      if (GAME.track) GAME.track('business-bought');
      if (GAME.lola) GAME.lola.first('business');
    } else if (id === 'biz_till') {
      var t = till(loc.id);
      if (t < 1) return false;
      GAME.addCash(t);
      s.till[loc.id] = 0;
      s.told[loc.id] = false;
      GAME.hud.message('The takings: +$' + t.toLocaleString(), 3);
    }
    GAME.save();
    return true;
  }

  // the day's trade, while the city runs
  var saveT = 0;
  function update(dt) {
    if (!GAME.started) return;
    var s = prefs(), any = false;
    for (var id in s.owned) {
      if (!s.owned[id] || !DEFS[id]) continue;
      any = true;
      var c = cap(id), was = s.till[id] || 0;
      s.till[id] = Math.min(c, was + DEFS[id].day * dt / dayLen());
      if (s.till[id] >= c && was < c && !s.told[id]) {
        s.told[id] = true;
        GAME.hud.pager('LOLA', 'The till at ' + nameOf(id) + ' is full, kid. Money sat on a counter is money somebody else is looking at.', 7);
      }
    }
    // (kept, a few times a minute, rather than every tick)
    if (any && (saveT -= dt) <= 0) { saveT = 20; if (GAME.save) GAME.save(); }
  }

  // a thief at one of yours runs with the till (streetlife.js)
  function robbed(id) {
    if (!owns(id)) return 0;
    var t = till(id);
    prefs().till[id] = 0;
    return t;
  }

  return {
    DEFS: DEFS,
    rows: rows, act: act, update: update, robbed: robbed,
    owns: owns, till: till, cap: cap,
    get count() { var n = 0, o = prefs().owned; for (var k in o) if (o[k] && DEFS[k]) n++; return n; },
    get total() { return Object.keys(DEFS).length; },
    // headless: a stretch of trading without sitting through it
    accrue: function (secs) { update(secs); },
    reset: function () { GAME.prefs = GAME.prefs || {}; GAME.prefs.business = { owned: {}, till: {}, told: {} }; }
  };
})();
