// Out on the water: people having a day of it — jet skis buzzing about the
// bay, a speedboat off up the coast, one sat still with its engine off — and
// the helm that every boat nobody is driving steers by, which the harbour
// patrol (police.js) uses as well.
//
// The fleet is sized off its own line of the frame budget (maxBoats, beside
// maxTraffic) and thinned the way the crowd on the pavement is: fewer out
// after dark, hardly anybody in the rain.
GAME.sealife = (function () {
  var fleet = [], spawnT = 0;
  // where a new one is put out (out of sight), and how far it lasts
  var SPAWN_MIN = 130, SPAWN_MAX = 260, KEEP_R = 380, DROP_R = 620;

  // ---------- the water a hull can use ----------
  // inside the box the player's own boat is held in (aircraft.js), and a
  // little way in from it: nothing the helm steers for lies outside
  function inSea(x, z, pad) {
    var e = GAME.aircraft.edges(), lim = GAME.isla && GAME.isla.isOpen() ? e.open : e.closed;
    return x > e.west + pad && x < lim.maxX - pad && z > lim.minZ + pad && z < lim.maxZ - pad;
  }
  // and clear of the bridge legs standing in the channel
  function offPiers(x, z, r) {
    var bp = GAME.city.bridgePiers;
    for (var i = 0; i < bp.length; i++) if (U.dist2(x, z, bp[i].x, bp[i].z) < r * r) return false;
    return true;
  }
  // and nothing standing in it down at the waterline: a bridge leg, the low
  // end of a bridge approach, the wheel's footings — what collideStatic in
  // vehicles.js would stop a hull against
  var solidBuf = [];
  function noSolid(x, z) {
    var boxes = GAME.city.hash.queryInto(x, z, 1.5, solidBuf), sea = GAME.city.seaLevel;
    for (var i = 0; i < boxes.length; i++) {
      var b = boxes[i];
      if (b.h !== undefined && b.h <= sea + 0.3) continue;
      if (b.minY !== undefined && sea < b.minY - 1) continue;
      return false;
    }
    return true;
  }
  function wet(x, z) {
    return GAME.city.isBoatWater(x, z) && inSea(x, z, 12) && offPiers(x, z, 6) && noSolid(x, z);
  }
  // Hulls sitting still — moored, drifting with the engine off, a boat you
  // have stopped — are in the way as surely as a pier is. Gathered once a
  // tick (update), and looked for along every run the helm considers.
  var hulls = [];
  function gatherHulls() {
    var n = 0, cars = GAME.world.cars;
    for (var i = 0; i < cars.length; i++) {
      var c = cars[i];
      if (!c.spec.boat || c.dead || c.sinking || Math.abs(c.speed) > 3) continue;
      var h = hulls[n] || (hulls[n] = { car: null, x: 0, z: 0, r: 0 });
      h.car = c; h.x = c.pos.x; h.z = c.pos.z; h.r = c.spec.l / 2 + 1;
      n++;
    }
    hulls.length = n;
  }
  // A hull at speed does not go where its bow points — it slides round a
  // turn on an arc that cuts inside the line the helm chose — so the berth
  // it gives grows with its way. And yours is wider again: nobody out for
  // the day comes buzzing past close enough to swamp you.
  function hullAt(car, x, z, beam) {
    var P = GAME.player, way = Math.max(0, car.speed) * 0.25;
    for (var i = 0; i < hulls.length; i++) {
      var h = hulls[i];
      if (h.car === car || h.car === car.helmIgnore) continue;   // (a launch's quarry is not in its way)
      var r = h.r + beam + way + (h.car === P.car && car.leisure ? 6 : 0);
      if (U.dist2(x, z, h.x, h.z) < r * r) return true;
    }
    // (and a swimmer is a hull with nothing round them)
    if (P.swimming && car.leisure) {
      var rs = 2 + beam + way + 6;
      if (U.dist2(x, z, P.pos.x, P.pos.z) < rs * rs) return true;
    }
    return false;
  }
  // somewhere to head for, or to fool about: not on top of anybody
  function clearOfFolk(x, z, r) {
    var f = GAME.focus(), P = GAME.player;
    if ((P.swimming || (P.inCar && P.car && P.car.spec.boat)) && U.dist2(x, z, f.x, f.z) < (r + 20) * (r + 20)) return false;
    for (var i = 0; i < hulls.length; i++) if (U.dist2(x, z, hulls[i].x, hulls[i].z) < r * r) return false;
    return true;
  }
  // Open water with room round it for a hull to sit and to turn: two rings
  // of looks, at the radius and halfway in. (Four looks at the radius alone
  // stepped straight over a pier — sixteen metres wide — and put marks a few
  // metres off its side.)
  var RING = [];
  for (var ri = 0; ri < 8; ri++) RING.push([Math.sin(ri * Math.PI / 4), Math.cos(ri * Math.PI / 4)]);
  function roomy(x, z, r) {
    if (!wet(x, z) || !offPiers(x, z, r + 6)) return false;
    for (var i = 0; i < 8; i++) {
      if (!wet(x + RING[i][0] * r, z + RING[i][1] * r) || !wet(x + RING[i][0] * r / 2, z + RING[i][1] * r / 2)) return false;
    }
    return true;
  }
  // nothing but water from one point to the other, a sample every few metres
  function clearRun(x0, z0, x1, z1) {
    var dx = x1 - x0, dz = z1 - z0, d = Math.sqrt(dx * dx + dz * dz), n = Math.ceil(d / 4);
    for (var i = 1; i <= n; i++) {
      var t = i / n;
      if (!wet(x0 + dx * t, z0 + dz * t)) return false;
    }
    return true;
  }
  // the water nearest a point on land, looking back the way `from` lies —
  // where a launch waits for somebody who has gone ashore
  function seaward(x, z, fromX, fromZ) {
    var dx = fromX - x, dz = fromZ - z, d = Math.sqrt(dx * dx + dz * dz) || 1;
    for (var s = 0; s <= Math.min(d, 240); s += 5) {
      var sx = x + dx / d * s, sz = z + dz / d * s;
      if (roomy(sx, sz, 4)) return { x: sx, z: sz };
    }
    return { x: fromX, z: fromZ };
  }

  // ---------- the helm ----------
  // Steer `car` for (tx, tz) at up to `want` throttle, writing its controls.
  // Straight there while the water ahead is clear; otherwise the nearest
  // heading either side of it that is — the side it took last time first,
  // so it does not dither — and astern off anything the bow has found. The
  // way ahead is looked at a few times a second, not every tick: each look
  // is a few dozen samples of the coast, for every hull out there.
  var OFFS = [0, 0.45, 0.9, 1.4, 2.0, 2.6];
  // (close in, a look every three metres: a bridge leg can stand between
  // two looks five metres apart, and one did)
  function runClear(car, h, reach) {
    // (wider with way on: see hullAt on how a hull slides through a turn)
    var beam = car.spec.w / 2 + 1 + Math.max(0, car.speed) * 0.15;
    var fx = Math.sin(h), fz = Math.cos(h), bx = fz * beam, bz = -fx * beam;
    for (var d = 3; d <= reach; d += d < 15 ? 3 : 5) {
      var x = car.pos.x + fx * d, z = car.pos.z + fz * d;
      if (!wet(x, z) || !wet(x + bx, z + bz) || !wet(x - bx, z - bz) || hullAt(car, x, z, beam)) return false;
    }
    return true;
  }
  function helm(car, tx, tz, want, dt) {
    var c = car.controls, dx = tx - car.pos.x, dz = tz - car.pos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (car.reverseT > 0) {
      // backing off whatever it ran onto (astern, the rudder works the other way)
      car.reverseT -= dt;
      // (astern swings the stern the way the wheel is put, so the bow comes
      // round toward the mark)
      c.throttle = -0.8; c.steer = U.wrapPI(Math.atan2(dx, dz) - car.heading) > 0 ? -1 : 1; c.handbrake = false;
      return dist;
    }
    car.helmT = (car.helmT || 0) - dt;
    if (car.helmT <= 0 || car.helmH === undefined) {
      car.helmT = 0.25;
      var toward = Math.atan2(dx, dz), side = car.helmSide || 1, pick = null;
      // only as far as the mark (it can lie by the water's edge), but never
      // so short a look that it noses into a pier it could have seen
      var reach = Math.max(9, Math.min(10 + Math.max(0, car.speed) * 1.3, dist));
      for (var i = 0; i < OFFS.length && pick === null; i++) {
        for (var k = 0; k < (i ? 2 : 1); k++) {
          var sg = k ? -side : side, h = toward + OFFS[i] * sg;
          if (runClear(car, h, reach)) { pick = h; if (i) car.helmSide = sg; break; }
        }
      }
      // Nothing clear anywhere is one of two things. Out past where it
      // should be — over the line, or in amongst something — every look
      // starts on the wrong side, so it simply makes for the mark, which is
      // always good water. In good water with every way shut, it is nosed
      // into a corner, and backs out.
      if (pick === null && !wet(car.pos.x, car.pos.z)) pick = toward;
      car.helmBlocked = pick === null;
      car.helmH = pick === null ? car.heading : pick;
      car.helmStraight = pick !== null && Math.abs(U.wrapPI(pick - toward)) < 0.01;
      // A hull slides: the way it is going lags where its bow points, by a
      // long way at speed. So the look that decides whether to brake is
      // down the way it is actually travelling, as far as it takes to stop.
      var sp = Math.sqrt(car.vx * car.vx + car.vz * car.vz);
      car.helmBrake = sp > 5 && wet(car.pos.x, car.pos.z) &&
        !runClear(car, Math.atan2(car.vx, car.vz), 8 + sp * 1.3);
    }
    if (car.helmBlocked) {
      // hemmed in: take the way off, then back out of it
      c.throttle = car.speed > 1.5 ? -1 : 0; c.steer = 0; c.handbrake = false;
      if (car.speed <= 1.5) { car.reverseT = 1.4; car.helmT = 0; }
      return dist;
    }
    // stopped dead with the throttle on means aground or against something
    if (want > 0.2 && Math.abs(car.speed) < 0.8) car.unstickT = (car.unstickT || 0) + dt;
    else car.unstickT = 0;
    if (car.unstickT > 1.6) { car.unstickT = 0; car.reverseT = 1.2; car.helmT = 0; }
    var dh = U.wrapPI(car.helmH - car.heading);
    car.aiSteer = U.lerp(car.aiSteer || 0, U.clamp(dh * 1.8, -1, 1), Math.min(1, dt * 6));
    // a hull only turns with way on it, so lift for a hard turn, never stop
    var th = want;
    if (Math.abs(dh) > 1.3) th = Math.min(th, 0.45);
    else if (Math.abs(dh) > 0.7) th = Math.min(th, 0.75);
    // picking a way round something, not at full chat
    if (!car.helmStraight) th = Math.min(th, 0.6);
    if (car.helmBrake) th = -1;
    c.throttle = th; c.steer = car.aiSteer; c.handbrake = false;
    return dist;
  }

  // ---------- out for the day ----------
  function size() {
    var S = GAME.settings;
    if (!S.maxBoats) return 0;
    return Math.round(GAME.perf.budget(S.maxBoats) * GAME.weather.crowd());
  }
  function boatJob() {
    var m = GAME.missions && GAME.missions.active;
    return !!(m && m.def && m.def.boat);
  }
  function putOut() {
    var f = GAME.focus(), C = GAME.city;
    for (var tries = 0; tries < 6; tries++) {
      var a = Math.random() * Math.PI * 2, r = U.randRange(Math.random, SPAWN_MIN, SPAWN_MAX);
      var x = f.x + Math.cos(a) * r, z = f.z + Math.sin(a) * r;
      if (!roomy(x, z, 14)) continue;
      // never where you are looking (GAME.inPlainView)
      if (GAME.inPlainView(x, C.seaY(x, z), z)) continue;
      var near = false, cars = GAME.world.cars;
      for (var i = 0; i < cars.length && !near; i++) if (U.dist2(cars[i].pos.x, cars[i].pos.z, x, z) < 30 * 30) near = true;
      if (near) continue;
      // a mix out there: whichever is fewer, a coin when they are level
      var skis = 0;
      for (var k = 0; k < fleet.length; k++) if (fleet[k].spec.jetski) skis++;
      var ski = skis * 2 < fleet.length || (skis * 2 === fleet.length && Math.random() < 0.55);
      var car = GAME.vehicles.spawnCar(ski ? 'jetski' : 'boat', x, z, Math.random() * Math.PI * 2,
        { occupied: 'ai', ai: { mode: 'cruise' } });
      car.pos.y = C.seaY(x, z);
      car.leisure = true;
      // a jet ski is ridden hard; a boat is pottered about in, mostly
      car.cruise = { pace: ski ? U.randRange(Math.random, 0.6, 0.85) : U.randRange(Math.random, 0.4, 0.7),
        wp: null, hp: car.hp, fleeT: 0, idleT: 0, spinT: 0, spinDir: 1 };
      chart(car);
      fleet.push(car);
      return car;
    }
    return null;
  }
  // Somewhere to go next: mostly on the way it is already heading, open
  // water the whole way there, and drawn back toward you if it has strayed
  // out of the part of the sea you are in.
  function chart(car) {
    var s = car.cruise, f = GAME.focus();
    var home = U.dist2(car.pos.x, car.pos.z, f.x, f.z) > 220 * 220;
    var base = home ? Math.atan2(f.x - car.pos.x, f.z - car.pos.z) : car.heading;
    // (ahead first; and if ahead is all shore — a launch standing down off
    // the beach it chased you onto is facing it — any way at all)
    for (var t = 0; t < 22; t++) {
      var a = t < 14 ? base + U.randRange(Math.random, -1.5, 1.5) : U.randRange(Math.random, -Math.PI, Math.PI);
      var r = U.randRange(Math.random, 60, 200);
      var x = car.pos.x + Math.sin(a) * r, z = car.pos.z + Math.cos(a) * r;
      if (!roomy(x, z, 26) || !clearOfFolk(x, z, 25) || !clearRun(car.pos.x, car.pos.z, x, z)) continue;
      s.wp = { x: x, z: z };
      return;
    }
    // Boxed in somewhere — a corner of the bay, under a bridge — so take
    // the nearest stretch of open water that can be reached from here.
    s.wp = anchor(car.pos.x, car.pos.z) || { x: car.pos.x - Math.sin(car.heading) * 30, z: car.pos.z - Math.cos(car.heading) * 30 };
  }
  // Stretches of open water, found once (a look every 40 m over the whole
  // sea) and kept: where anything that cannot find its own way heads for.
  var anchors = null;
  function anchor(x, z) {
    if (!anchors) {
      anchors = [];
      var e = GAME.aircraft.edges();
      for (var ax = e.west + 30; ax < e.open.maxX - 30; ax += 40) {
        for (var az = e.open.minZ + 30; az < e.open.maxZ - 30; az += 40) {
          if (roomy(ax, az, 24)) anchors.push({ x: ax, z: az });
        }
      }
    }
    var best = null, bd = 1e18, any = null, ad = 1e18;
    for (var i = 0; i < anchors.length; i++) {
      var a = anchors[i];
      if (!inSea(a.x, a.z, 30)) continue;     // (the far side of a shut channel)
      var d = U.dist2(x, z, a.x, a.z);
      if (d < 30 * 30) continue;
      if (d < ad) { ad = d; any = a; }
      if (d < bd && d < 300 * 300 && clearRun(x, z, a.x, a.z)) { bd = d; best = a; }
    }
    return best || any;
  }
  // At the mark: a boat sometimes cuts the engine and sits a while; a jet
  // ski sometimes throws a few doughnuts, where there is room for them.
  function arrive(car) {
    var s = car.cruise;
    if (!car.spec.jetski && Math.random() < 0.3) s.idleT = U.randRange(Math.random, 5, 11);
    else if (car.spec.jetski && Math.random() < 0.3 && roomy(car.pos.x, car.pos.z, 24) && clearOfFolk(car.pos.x, car.pos.z, 40)) {
      s.spinT = U.randRange(Math.random, 2.5, 4.5);
      s.spinDir = Math.random() < 0.5 ? -1 : 1;
    }
    chart(car);
  }
  // shot at, or run into: off the other way, flat out
  function scarper(car) {
    var s = car.cruise, f = GAME.focus();
    s.fleeT = 10; s.idleT = 0; s.spinT = 0;
    var a0 = Math.atan2(car.pos.x - f.x, car.pos.z - f.z);
    for (var t = 0; t < 7; t++) {
      var a = a0 + (t ? (t % 2 ? 1 : -1) * Math.ceil(t / 2) * 0.45 : 0);
      var x = car.pos.x + Math.sin(a) * 160, z = car.pos.z + Math.cos(a) * 160;
      if (roomy(x, z, 26) && clearRun(car.pos.x, car.pos.z, x, z)) { s.wp = { x: x, z: z }; return; }
    }
  }
  function sail(car, dt) {
    var s = car.cruise, c = car.controls, f = GAME.focus();
    // hurt with you about — shot at, or run into: off, the other way. Hurt
    // with nobody about, it has run into something on the way to a mark it
    // cannot reach from here: somewhere else, then.
    if (car.hp < s.hp - 0.5) {
      if (U.dist2(car.pos.x, car.pos.z, f.x, f.z) < 70 * 70) scarper(car);
      else if (s.fleeT <= 0) chart(car);
    }
    s.hp = car.hp;
    if (s.fleeT > 0) s.fleeT -= dt;
    if (s.idleT > 0) {
      s.idleT -= dt;
      c.throttle = 0; c.steer = 0; c.handbrake = false;
      return;
    }
    // (a doughnut is cut short by anybody coming near)
    if (s.spinT > 0 && !clearOfFolk(car.pos.x, car.pos.z, 22)) s.spinT = 0;
    if (s.spinT > 0) {
      s.spinT -= dt;
      c.throttle = 0.8; c.steer = s.spinDir; c.handbrake = true;
      return;
    }
    // easing off on the way in to the mark, as anybody would
    var togo = Math.sqrt(U.dist2(car.pos.x, car.pos.z, s.wp.x, s.wp.z));
    var d = helm(car, s.wp.x, s.wp.z, s.fleeT > 0 ? 0.95 : s.pace * U.clamp(togo / 60, 0.3, 1), dt);
    if (d < 16) arrive(car);
    // a jet ski weaves for the fun of it — out in the open, on a clear run
    if (car.spec.jetski && s.fleeT <= 0 && car.helmStraight && !car.helmBrake && d > 40 && !(car.reverseT > 0)) {
      c.steer = U.clamp(c.steer + Math.sin(GAME.time * 1.9 + car.serial) * 0.35, -1, 1);
    }
    giveWay(car, f, dt);
  }
  // And nobody runs anybody down. A hull sitting still is the helm's to
  // steer round (hullAt); one under way is asked where it and this one will
  // be at their closest, and if that is too close and soon, this one eases
  // off and turns away from the spot — and holds the turn a moment, rather
  // than letting the helm swing it straight back. A swimmer dead ahead is
  // steered round as well.
  function giveWay(car, f, dt) {
    var c = car.controls, fx = Math.sin(car.heading), fz = Math.cos(car.heading);
    if (car.giveT > 0) {
      car.giveT -= dt;
      c.throttle = Math.min(c.throttle, car.giveTh); c.steer = car.giveSteer;
      return;
    }
    var cars = GAME.world.cars, P = GAME.player;
    for (var i = -1; i < cars.length; i++) {
      var ox, oz, ovx = 0, ovz = 0;
      if (i < 0) { if (!P.swimming) continue; ox = f.x; oz = f.z; }
      else {
        var o = cars[i];
        if (o === car || !o.spec.boat || o.dead || Math.abs(o.speed) <= 3) continue;
        ox = o.pos.x; oz = o.pos.z; ovx = o.vx; ovz = o.vz;
      }
      var rx = ox - car.pos.x, rz = oz - car.pos.z;
      if (rx * rx + rz * rz > 50 * 50) continue;
      var vx = ovx - car.vx, vz = ovz - car.vz, vv = vx * vx + vz * vz;
      if (vv < 1) continue;
      var tca = -(rx * vx + rz * vz) / vv;
      if (tca < 0 || tca > 3) continue;
      var mx = rx + vx * tca, mz = rz + vz * tca;
      if (mx * mx + mz * mz > 9 * 9) continue;
      car.giveT = 0.6;
      car.giveTh = tca < 1.2 ? -0.6 : 0.2;
      car.giveSteer = (mx * fz - mz * fx) > 0 ? -1 : 1;
      c.throttle = Math.min(c.throttle, car.giveTh); c.steer = car.giveSteer;
      return;
    }
  }

  function update(dt) {
    var f = GAME.focus(), P = GAME.player;
    gatherHulls();
    for (var i = fleet.length - 1; i >= 0; i--) {
      var car = fleet[i];
      // taken (or its rider thrown off): it is not out for the day any more
      if (car.gone || car.dead || !car.ai || car.ai.mode !== 'cruise' || car.occupied !== 'ai') { fleet.splice(i, 1); continue; }
      var d2 = U.dist2(car.pos.x, car.pos.z, f.x, f.z);
      if (d2 > DROP_R * DROP_R || (d2 > KEEP_R * KEEP_R && !GAME.inPlainView(car.pos.x, car.pos.y, car.pos.z))) {
        GAME.vehicles.removeCar(car);
        fleet.splice(i, 1);
        continue;
      }
      sail(car, dt);
    }
    spawnT -= dt;
    if (spawnT > 0) return;
    spawnT = 0.8;
    if (P.state !== 'alive' || P.interior || boatJob()) return;
    if (fleet.length < size()) putOut();
  }

  // A hull somebody else is done with — a launch standing down when the
  // heat is off — taken on as one more boat out for the day, so it heads
  // off about the bay rather than sitting dead in the water where it stopped
  function adopt(car) {
    if (!car || car.gone || car.dead || fleet.indexOf(car) >= 0) return;
    car.ai = { mode: 'cruise' };
    car.cruise = { pace: 0.6, wp: null, hp: car.hp, fleeT: 0, idleT: 0, spinT: 0, spinDir: 1 };
    car.helmT = 0;
    chart(car);
    fleet.push(car);
  }

  // everybody back in: a fresh start, or the city switched quiet
  function clear() {
    for (var i = 0; i < fleet.length; i++) if (!fleet[i].gone) GAME.vehicles.removeCar(fleet[i]);
    fleet.length = 0;
  }

  return {
    update: update,
    helm: helm,
    roomy: roomy,
    clearRun: clearRun,
    seaward: seaward,
    adopt: adopt,
    clear: clear,
    get fleet() { return fleet; }
  };
})();
