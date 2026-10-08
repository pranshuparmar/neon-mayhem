// The two sides of the story, out in the street: Rico Salazar's crew and
// Lola's people, each in their colours, each with streets of their own.
//
// Salazar's men wear plum and black and drive black sedans; Lola's people
// wear her pink and white and drive pink sports cars. Their turf is where the
// story says it is: Lola has the strip from the start; Rico holds the harbour
// (Puerto Viejo) until LOOSE ENDS takes the ledger and him with it, and
// Puerto Dorado on the island until HIGH TIDE — and whatever he loses, her
// people move into.
//
// Before the warehouses (WAREHOUSE) his men are only a colour on the corner.
// After it Rico has put a price on you, and in his streets they draw on sight
// — on foot, and from the windows of their cars. Meet each other and the two
// sides go at it. Lola's people are on your side: they never start anything
// with you (hit one and he hits back, like anybody would).
GAME.gangs = (function () {
  var GANGS = {
    salazar: { name: 'SALAZAR CREW', shirt: 0x4a2a5a, pants: 0x14141a, hair: ['crew', 'pompadour', 'flattop'], hairCol: 0x0e0c0c,
      car: 'sedan', carColor: 0x1c1428, hp: 45 },
    lola: { name: 'LOLA\'S PEOPLE', shirt: 0xff4fa3, pants: 0xf2eee4, hair: ['mullet', 'ponytail', 'afro', 'crew'], hairCol: 0x24160f,
      car: 'sports', carColor: 0xff6fb8, hp: 40 }
  };
  var SKINS = [0xeac8a8, 0xc89878, 0x8a6848, 0x6a4c34, 0xb98260];
  var enabled = true;
  var MAX_MEN = 6, MAX_CARS = 1, SPAWN_EVERY = 1.6, SIGHT_R = 24, CLASH_R = 20, CARSHOT_R = 26;
  var spawnT = 0, carT = 4, told = false;

  function prefs() { GAME.prefs = GAME.prefs || {}; return GAME.prefs.gangs || (GAME.prefs.gangs = {}); }
  // where the story stands: a job passed is a job in GAME.bests
  function beat(id) { return !!(GAME.bests && GAME.bests[id] !== undefined); }
  // Rico's price on you: from the warehouses until he is gone
  function hostile() { return beat('rampage1') && !beat('hit2'); }

  // ---------- turf ----------
  // whose streets these are, or null for nobody's
  function turfAt(x, z) {
    var C = GAME.city;
    if (GAME.isla && GAME.isla.contains(x, z)) {
      if (!GAME.isla.isOpen()) return null;
      if (C.districtName(x, z) !== 'Puerto Dorado') return null;
      return beat('hit2') ? 'lola' : 'salazar';
    }
    var d = C.districtAt(x, z);
    if (d === 'strip') return 'lola';
    if (d === 'harbor') return beat('hit1') ? 'lola' : 'salazar';
    return null;
  }

  // ---------- the people ----------
  function lookFor(g) {
    var G = GANGS[g];
    return { shirt: G.shirt, pants: G.pants, skin: U.pick(Math.random, SKINS), hair: U.pick(Math.random, G.hair), hairCol: G.hairCol };
  }
  function count(g) {
    var n = 0, peds = GAME.world.peds;
    for (var i = 0; i < peds.length; i++) if (peds[i].gang === g && !peds[i].dead && !peds[i].gone) n++;
    return n;
  }
  // somewhere on the pavement you cannot see from here, in that turf
  var look = null;
  function offscreen(x, z) {
    var cam = GAME.cameraObj, f = GAME.focus();
    if (!look) look = new THREE.Vector3();
    cam.getWorldDirection(look);
    if ((x - cam.position.x) * look.x + (z - cam.position.z) * look.z < 0) return true;
    return !GAME.city.hash.segmentClear(f.x, f.z, x, z);
  }
  function pavementSpot(g, r0, r1) {
    var C = GAME.city, f = GAME.focus();
    for (var t = 0; t < 14; t++) {
      var a = Math.random() * Math.PI * 2, r = U.randRange(Math.random, r0, r1);
      var rp = C.nearestRoadPoint(f.x + Math.cos(a) * r, f.z + Math.sin(a) * r);
      var h = rp.axis === 'net' ? rp.heading : rp.axis === 'z' ? 0 : Math.PI / 2;
      var side = Math.random() < 0.5 ? 1 : -1;
      var x = rp.x + Math.cos(h) * 7.8 * side, z = rp.z - Math.sin(h) * 7.8 * side;
      if (C.isInWater(x, z) || C.inAirport(x, z) || turfAt(x, z) !== g) continue;
      var rc = GAME.resolveCircle(x, z, 0.5);
      if (Math.abs(rc.x - x) + Math.abs(rc.z - z) > 0.05) continue;
      if (!offscreen(x, z)) continue;
      return { x: x, z: z, rp: rp, h: h };
    }
    return null;
  }
  // two or three of them, stood about together
  function spawnGroup(g) {
    var at = pavementSpot(g, 45, 90);
    if (!at) return 0;
    var n = 2 + (Math.random() < 0.4 ? 1 : 0), made = 0;
    for (var i = 0; i < n; i++) {
      var p = GAME.peds.spawnPed(at.x + (i - 1) * 1.1, at.z + (i % 2) * 0.9, { look: lookFor(g) });
      if (!p) continue;
      dress(p, g);
      made++;
    }
    return made;
  }
  function dress(p, g) {
    p.gang = g;
    p.hp = GANGS[g].hp;
    p.carrying = true;              // every one of them is
    p.missionArmed = true;          // (and uses it, whatever the CITY knob says)
    p.temper = 1;
  }
  // a car of theirs, cruising their streets
  function spawnCar(g) {
    var at = pavementSpot(g, 70, 120);
    if (!at) return null;
    var G = GANGS[g], rp = at.rp;
    var car = GAME.vehicles.spawnCar(G.car, rp.x, rp.z, at.h + (Math.random() < 0.5 ? Math.PI : 0),
      { occupied: 'ai', ai: { mode: 'traffic', desired: 10, laneX: 0, laneZ: 0 }, color: G.carColor });
    if (car) { car.gang = g; car.shootT = 1.5; }
    return car;
  }
  function carCount(g) {
    var n = 0, cars = GAME.world.cars;
    for (var i = 0; i < cars.length; i++) if (cars[i].gang === g && !cars[i].dead && !cars[i].gone) n++;
    return n;
  }

  // ---------- each tick ----------
  function update(dt) {
    if (!enabled || !GAME.started) return;
    var P = GAME.player;
    if (P.state !== 'alive' || P.interior) return;
    var f = GAME.focus();
    var here = turfAt(f.x, f.z);
    // the news, once each: the price on you, and the end of it
    var pr = prefs();
    if (hostile() && !pr.warned && GAME.hud.pager) {
      pr.warned = true; GAME.save();
      GAME.hud.pager('LOLA', 'Rico\'s put a price on you, kid. His crew wears plum and black — in his streets they\'ll shoot on sight. Mine wear pink, and they\'ve got your back.', 9);
    }
    if (beat('hit2') && pr.warned && !pr.ended && GAME.hud.pager) {
      pr.ended = true; GAME.save();
      GAME.hud.pager('LOLA', 'Salazar\'s crew is finished. My people are moving into Puerto Dorado — wave if you see them.', 8);
    }
    spawnT -= dt;
    if (here && spawnT <= 0) {
      spawnT = SPAWN_EVERY;
      if (count(here) <= MAX_MEN - 3) spawnGroup(here);
    }
    carT -= dt;
    if (here && carT <= 0) {
      carT = 9;
      if (carCount(here) < MAX_CARS) spawnCar(here);
    }
    if (GAME.frame % 6 === 0) think(P, f);
    carsShoot(dt, P, f);
  }
  // who is looking at whom
  function think(P, f) {
    var peds = GAME.world.peds, hot = hostile();
    for (var i = 0; i < peds.length; i++) {
      var p = peds[i];
      if (!p.gang || p.dead || p.gone || p.state === 'attack' || p.state === 'inside') continue;
      var d2 = U.dist2(p.pos.x, p.pos.z, f.x, f.z);
      // Salazar's men, with the price on you: on sight
      if (p.gang === 'salazar' && hot && d2 < SIGHT_R * SIGHT_R &&
          GAME.city.hash.segmentClear(p.pos.x, p.pos.z, f.x, f.z)) {
        GAME.peds.startFight(p, { kind: 'player' }, 20);
        continue;
      }
      // the other side, near enough to see
      var foe = nearestOther(p);
      if (foe) GAME.peds.startFight(p, { kind: 'ped', ped: foe }, 15);
    }
  }
  function nearestOther(p) {
    var peds = GAME.world.peds, best = null, bd = CLASH_R * CLASH_R;
    for (var j = 0; j < peds.length; j++) {
      var q = peds[j];
      if (!q.gang || q.gang === p.gang || q.dead || q.gone) continue;
      var d = U.dist2(p.pos.x, p.pos.z, q.pos.x, q.pos.z);
      if (d < bd) { bd = d; best = q; }
    }
    return best;
  }
  // a drive-by from one of Rico's cars, once you have a price on you
  function carsShoot(dt, P, f) {
    if (!hostile() || GAME.godMode) return;
    var cars = GAME.world.cars;
    for (var i = 0; i < cars.length; i++) {
      var c = cars[i];
      if (c.gang !== 'salazar' || c.dead || c.gone || c.occupied !== 'ai') continue;
      if (U.dist2(c.pos.x, c.pos.z, f.x, f.z) > CARSHOT_R * CARSHOT_R) continue;
      if (!GAME.city.hash.segmentClear(c.pos.x, c.pos.z, f.x, f.z)) continue;
      c.shootT -= dt;
      if (c.shootT <= 0) {
        c.shootT = U.randRange(Math.random, 1.0, 1.8);
        GAME.combat.npcShoot(c.pos.x, c.pos.y + 1.3, c.pos.z, 0.18, 6, c);
      }
    }
  }

  // what the radar and the big map show of it (hud.js)
  function blips() {
    var out = [], f = GAME.focus(), peds = GAME.world.peds;
    for (var i = 0; i < peds.length; i++) {
      var p = peds[i];
      if (!p.gang || p.dead || p.gone) continue;
      if (U.dist2(p.pos.x, p.pos.z, f.x, f.z) > 110 * 110) continue;
      out.push({ x: p.pos.x, z: p.pos.z, color: p.gang === 'salazar' ? (hostile() ? '#c85aff' : '#8a6aa8') : '#ff8fc8', size: 2 });
    }
    return out;
  }

  return {
    update: update,
    turfAt: turfAt,
    hostile: hostile,
    blips: blips,
    count: count,
    get enabled() { return enabled; },
    set enabled(v) { enabled = !!v; },
    GANGS: GANGS,
    // headless: a group of them here and now, wherever you are looking
    testSpawn: function (g, x, z, n) {
      var out = [];
      for (var i = 0; i < (n || 2); i++) {
        var p = GAME.peds.spawnPed(x + i * 1.2, z, { look: lookFor(g) });
        if (p) { dress(p, g); out.push(p); }
      }
      return out;
    }
  };
})();
