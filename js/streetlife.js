// The city getting on with its own business. Every so often something
// happens near you that has nothing to do with you — unless you make it so:
//
//  - a getaway car tearing past with a cruiser on its tail, siren going;
//  - a shop held up, and the thief running off down the street with the bag;
//  - an armoured van doing its rounds, if you are that way inclined;
//  - and, stopped in a car, somebody pulls up alongside and revs at you.
//
// It all rides the CITY knob (chaos.js), like everything else the strangers
// in the street do: OFF is the city as it was, with none of this, and the
// busier the setting the more often something comes along.
GAME.streetlife = (function () {
  var EVERY = [0, 150, 100, 70, 45];   // seconds between happenings, by CITY level
  var nextT = 40, ev = null;
  var racerT = 45, stillT = 0, racer = null;
  var blipBuf = [];

  function P() { return GAME.player; }
  function quiet() {
    var p = P(), M = GAME.missions;
    if (!GAME.started || p.state !== 'alive' || p.interior || p.swimming) return false;
    if (M && M.active) return false;
    if (GAME.strangers && GAME.strangers.busy) return false;
    if (GAME.heist && GAME.heist.busy) return false;
    if (GAME.police.wanted > 0) return false;
    if (GAME.guide && GAME.guide.step) return false;
    if (p.inCar && p.car && (p.car.spec.heli || p.car.spec.plane || p.car.spec.boat)) return false;
    return true;
  }
  function sameSide(x, z) {
    var f = GAME.focus();
    return !GAME.isla || GAME.isla.contains(x, z) === GAME.isla.contains(f.x, f.z);
  }
  // a stretch of road a fair way off, out of sight, on your own island
  function roadSpot(r0, r1) {
    var f = GAME.focus(), C = GAME.city;
    for (var t = 0; t < 14; t++) {
      var a = Math.random() * Math.PI * 2, r = U.randRange(Math.random, r0, r1);
      var rp = C.nearestRoadPoint(f.x + Math.cos(a) * r, f.z + Math.sin(a) * r);
      if (!rp || rp.kind === 'local' || C.isInWater(rp.x, rp.z) || C.inAirport(rp.x, rp.z)) continue;
      if (!sameSide(rp.x, rp.z)) continue;
      var d2 = U.dist2(rp.x, rp.z, f.x, f.z);
      if (d2 < r0 * r0 * 0.6 || d2 > r1 * r1 * 1.4) continue;
      if (GAME.inPlainView(rp.x, C.groundY(rp.x, rp.z), rp.z)) continue;
      var near = false, cars = GAME.world.cars;
      for (var i = 0; i < cars.length && !near; i++) if (U.dist2(cars[i].pos.x, cars[i].pos.z, rp.x, rp.z) < 14 * 14) near = true;
      if (near) continue;
      return rp;
    }
    return null;
  }
  // the way along the road that points nearest to (x, z)
  function roadHeading(rp, x, z) {
    var h = rp.axis === 'net' ? rp.heading : rp.axis === 'z' ? 0 : Math.PI / 2;
    var want = Math.atan2(x - rp.x, z - rp.z);
    return Math.abs(U.wrapPI(want - h)) > Math.PI / 2 ? h + Math.PI : h;
  }
  function say(text, s) { GAME.hud.message(text, s || 3.5); }
  function pay(n, text) {
    GAME.addCash(n);
    GAME.audio.sting('win');
    if (GAME.haptics && GAME.haptics.win) GAME.haptics.win();
    say(text + '  +$' + n, 4);
  }

  // ---------- a chase going by ----------
  // A getaway car, sent your way, with a cruiser on its tail and the siren
  // going. Leave them to it, or put the getaway car into a wall yourself: the
  // law is grateful, in cash, and the papers notice. Nothing you do to the
  // car in front is a crime (it is an outlaw's).
  function startChase() {
    var f = GAME.focus(), C = GAME.city;
    var rp = roadSpot(110, 170);
    if (!rp) return false;
    var h = roadHeading(rp, f.x, f.z);
    var perp = GAME.vehicles.spawnCar(Math.random() < 0.6 ? 'sports' : 'sedan', rp.x, rp.z, h,
      { occupied: 'ai', ai: { mode: 'traffic', desired: 19, laneX: 0, laneZ: 0, reckless: true, toward: { x: f.x, z: f.z } }, color: 0x1c1c26 });
    if (!perp) return false;
    perp.outlaw = true; perp.keep = true; perp.speed = 12;
    var bp = C.nearestRoadPoint(rp.x - Math.sin(h) * 18, rp.z - Math.cos(h) * 18);
    var cop = GAME.vehicles.spawnCar('police', bp.x, bp.z, h,
      { occupied: 'ai', ai: { mode: 'traffic', desired: 20, laneX: 0, laneZ: 0, reckless: true, follow: perp } });
    if (!cop) { GAME.vehicles.removeCar(perp); return false; }
    cop.sirenOn = true; cop.keep = true; cop.speed = 12;
    ev = { kind: 'chase', t: 0, perp: perp, cop: cop, hp0: perp.hp, aimT: 0, near: false };
    return true;
  }
  function stepChase(dt) {
    var f = GAME.focus(), perp = ev.perp, cop = ev.cop;
    var d = Math.sqrt(U.dist2(perp.pos.x, perp.pos.z, f.x, f.z));
    if (d < 60) ev.near = true;
    // made for you while it is still coming; past you, wherever it likes
    if (perp.ai && perp.ai.toward) {
      ev.aimT -= dt;
      if (d < 45) perp.ai.toward = null;
      else if (ev.aimT <= 0) { ev.aimT = 2; perp.ai.toward = { x: f.x, z: f.z }; }
    }
    // taken: wrecked, the driver out of it, or knocked about till they give up
    var out = perp.dead || perp.occupied !== 'ai';
    if (!out && perp.hp < ev.hp0 * 0.35) {
      var dr = GAME.vehicles.ejectDriver(perp);
      if (dr) GAME.peds.startFlee(dr, cop.pos.x, cop.pos.z, 12);
      out = true;
    }
    if (out) {
      var mine = !!perp.byPlayer;
      // the cruiser pulls up by it, lights going, and that is that
      if (cop && !cop.gone && cop.ai) { cop.ai.follow = null; cop.ai.desired = 0.01; ev.holdT = 8; }   // (0 reads as unset)
      if (mine) {
        pay(250, "CITIZEN'S ARREST — the department thanks you.");
        if (GAME.herald) GAME.herald.front('hero', { what: 'getaway' });
      }
      ev.kind = 'chaseDone';
      return;
    }
    if (perp.gone || d > 280 || ev.t > 80) end();
  }

  // ---------- a hold-up ----------
  // A shop near you is robbed, and the thief comes out of the door at a run
  // with the takings. Put him down — he is an outlaw, it is no crime — and
  // the bag is on the pavement for whoever picks it up.
  var ROB_KINDS = { hardware: 1, dress: 1, barber: 1 };
  function startRobbery() {
    var f = GAME.focus(), locs = GAME.shops.locations(), pick = [];
    for (var i = 0; i < locs.length; i++) {
      var l = locs[i];
      if (!ROB_KINDS[l.kind] || !l.at) continue;
      var d2 = U.dist2(l.at.x, l.at.z, f.x, f.z);
      if (d2 < 45 * 45 || d2 > 120 * 120 || !sameSide(l.at.x, l.at.z)) continue;
      pick.push(l);
    }
    if (!pick.length) return false;
    // one of yours, if there is one about: the till there is worth the
    // trouble (business.js)
    var B = GAME.business, mine = B ? pick.filter(function (l) { return B.owns(l.id); }) : [];
    if (mine.length) pick = mine;
    var shop = pick[Math.floor(Math.random() * pick.length)];
    var thief = GAME.peds.spawnPed(shop.at.x, shop.at.z);
    if (!thief) return false;
    thief.outlaw = true;
    thief.hp0 = thief.hp;
    // the bag, in his hand
    var bag = new THREE.Mesh(sharedBoxGeo(0.26, 0.3, 0.16), sharedLambert(0x2c2418));
    bag.position.set(0, -0.62, 0);
    thief.mesh.userData.joints.armR.add(bag);
    thief.bag = bag;
    // running from the door, and on for a good while
    GAME.peds.startFlee(thief, shop.at.x, shop.at.z, 60);
    GAME.audio.yelp(shop.at.x, shop.at.z);
    var stolen = B && B.owns(shop.id) ? B.robbed(shop.id) : 0;
    say(B && B.owns(shop.id)
      ? '"STOP, THIEF!" — your place, ' + shop.name + ', has been held up' + (stolen ? ', and he has the till — $' + stolen.toLocaleString() + '.' : '.') + ' He\'s running for it.'
      : '"STOP, THIEF!" — ' + shop.name + ' has been held up. The thief is running for it.', 4.5);
    ev = { kind: 'robbery', t: 0, thief: thief, shop: shop, near: false, stolen: stolen };
    return true;
  }
  function stepRobbery() {
    var f = GAME.focus(), th = ev.thief;
    var d = Math.sqrt(U.dist2(th.pos.x, th.pos.z, f.x, f.z));
    if (d < 40) ev.near = true;
    if (th.dead || (th.knockT || 0) > 0 || th.hp < (th.hp0 || 30) * 0.6) {
      // down: the bag goes on the pavement
      if (th.bag) { th.bag.parent.remove(th.bag); th.bag = null; }
      // (the till he took from one of yours, if that is more)
      var amt = Math.max(ev.stolen || 0, 150 + Math.floor(Math.random() * 7) * 25);
      GAME.combat.dropPickup(th.pos.x, th.pos.z, 'cash', amt);
      // yours, if it was you that put him down (a passing car is not a hero)
      if (th.byPlayer) {
        say('Thief down — the takings are on the pavement.', 3.5);
        if (GAME.herald) GAME.herald.front('hero', { what: 'thief', shop: ev.shop.name });
      } else if (ev.near) say('Somebody\'s stopped the thief — the bag is on the pavement.', 3);
      end();
      return;
    }
    if (th.gone || d > 150 || ev.t > 55) {
      if (ev.stolen) say('The thief got away with your takings — $' + ev.stolen.toLocaleString() + '.', 3);
      else if (ev.near) say('The thief got away with it.', 2.5);
      end();
    }
  }

  // ---------- the armoured van ----------
  // A security van on its rounds: grey, heavy, three and a half times the
  // hull of a van. Lola mentions it. Get it down far enough and the back
  // doors give — three bags on the road and three stars on you.
  function startVan() {
    var f = GAME.focus();
    var rp = roadSpot(120, 200);
    if (!rp) return false;
    var van = GAME.vehicles.spawnCar('van', rp.x, rp.z, roadHeading(rp, f.x, f.z),
      { occupied: 'ai', ai: { mode: 'traffic', desired: 9, laneX: 0, laneZ: 0 }, color: 0x5d6673 });
    if (!van) return false;
    van.hp = van.spec.hp * 3.5;
    van.armoured = true; van.keep = true;
    ev = { kind: 'van', t: 0, van: van, hp0: van.hp };
    if (GAME.hud.pager) GAME.hud.pager('LOLA', 'There\'s a security van doing its rounds near you — grey, slow, heavy. I\'m not telling you to do anything. I\'m just telling you.');
    return true;
  }
  function stepVan() {
    var f = GAME.focus(), van = ev.van;
    if (van.dead || van.hp < ev.hp0 * 0.3) {
      // the back doors give
      var bx = -Math.sin(van.heading) * (van.spec.l / 2 + 1.2), bz = -Math.cos(van.heading) * (van.spec.l / 2 + 1.2);
      for (var i = 0; i < 3; i++) GAME.combat.dropPickup(van.pos.x + bx + (i - 1) * 1.1, van.pos.z + bz, 'cash', 250);
      if (!van.dead && van.occupied === 'ai') {
        var dr = GAME.vehicles.ejectDriver(van);
        if (dr) GAME.peds.startFlee(dr, f.x, f.z, 12);
      }
      GAME.police.setWanted(Math.max(GAME.police.wanted, 3));
      say('The back doors give — three bags on the road. Every cop in town heard that.', 4);
      if (GAME.herald) GAME.herald.front('van', {});
      end();
      return;
    }
    if (van.gone || U.dist2(van.pos.x, van.pos.z, f.x, f.z) > 300 * 300 || ev.t > 120) end();
  }

  // ---------- at the lights ----------
  // Stopped in a car on a road for a moment, and somebody pulls up alongside
  // in something quick and revs at you. Floor it and it is a race to the
  // flag, half a kilometre up the road; sit there and they shrug and go.
  var RACE_LEN = 450, FINISH_R = 14;
  function routeAhead(car, len) {
    var C = GAME.city;
    var node = C.nearestNode(car.pos.x + Math.sin(car.heading) * 8, car.pos.z + Math.cos(car.heading) * 8);
    var prev = null, pts = [], run = 0, hx = Math.sin(car.heading), hz = Math.cos(car.heading);
    var gated = GAME.isla && !GAME.isla.isOpen();
    pts.push([node.x, node.z]);
    run = Math.sqrt(U.dist2(node.x, node.z, car.pos.x, car.pos.z));
    for (var k = 0; k < 40 && run < len; k++) {
      var nbs = C.neighbors(node), best = null, bestT = 9;
      for (var i = 0; i < nbs.length; i++) {
        var n = nbs[i];
        if (n === prev || (gated && n.span)) continue;
        var vx = n.x - node.x, vz = n.z - node.z, vl = Math.sqrt(vx * vx + vz * vz) || 1;
        var turn = Math.acos(U.clamp((vx * hx + vz * hz) / vl, -1, 1));
        if (turn < bestT) { bestT = turn; best = n; }
      }
      if (!best || bestT > 1.7) break;
      run += Math.sqrt(U.dist2(best.x, best.z, node.x, node.z));
      hx = best.x - node.x; hz = best.z - node.z;
      var hl = Math.sqrt(hx * hx + hz * hz) || 1; hx /= hl; hz /= hl;
      prev = node; node = best;
      pts.push([node.x, node.z]);
    }
    return run >= len * 0.6 ? pts : null;
  }
  function lookForRacer(dt, force) {
    var p = P(), car = p.car;
    racerT -= dt;
    if (!p.inCar || !car || car.dead || car.spec.boat || car.spec.heli || car.spec.plane || car.spec.bike) { stillT = 0; return; }
    if (Math.abs(car.speed) > 0.5) { stillT = 0; return; }
    stillT += dt;
    if (stillT < 1.2 || racerT > 0) return;
    racerT = 40;
    if (!force && Math.random() > 0.45) return;
    var rp = GAME.city.nearestRoadPoint(car.pos.x, car.pos.z);
    if (!rp || U.dist2(rp.x, rp.z, car.pos.x, car.pos.z) > 6 * 6) return;
    var route = routeAhead(car, RACE_LEN);
    if (!route) return;
    // turns up from behind, in the lane beside yours
    var fx = Math.sin(car.heading), fz = Math.cos(car.heading), lx = fz, lz = -fx;   // (lx, lz): your left
    var sx = car.pos.x - fx * 32 + lx * 3.4, sz = car.pos.z - fz * 32 + lz * 3.4;
    var r = GAME.vehicles.spawnCar('sports', sx, sz, car.heading, { occupied: 'ai', ai: { mode: 'race' }, color: U.pick(Math.random, [0xffe14f, 0x38e8ff, 0xb040ff, 0xff2f7a]) });
    if (!r) return;
    r.speed = 9; r.raceEdge = 1;
    racer = { car: r, state: 'pull', t: 0, route: route, idx: 0, fin: route[route.length - 1], marker: null };
    ev = { kind: 'racer', t: 0 };
  }
  // drive `car` along `pts` at up to `top`, slowing for the corners and for
  // anything in the way (the same reading of the road the race rivals use)
  function drive(car, pts, top, dt) {
    var c = car.controls;
    while (racer.idx < pts.length - 1 && U.dist2(car.pos.x, car.pos.z, pts[racer.idx][0], pts[racer.idx][1]) < 12 * 12) racer.idx++;
    var t = pts[racer.idx];
    var dx = t[0] - car.pos.x, dz = t[1] - car.pos.z;
    var dh = U.wrapPI(Math.atan2(dx, dz) - car.heading), ad = Math.abs(dh);
    var vmax = ad > 1.0 ? 8 : ad > 0.55 ? 13 : ad > 0.3 ? 20 : top;
    var th = car.speed > vmax ? -0.6 : 1;
    var fx = Math.sin(car.heading), fz = Math.cos(car.heading), look = 6 + Math.abs(car.speed) * 0.55, bias = 0;
    var cars = GAME.world.cars, blk = null;
    for (var i = 0; i < cars.length; i++) {
      var o = cars[i];
      if (o === car || o.dead) continue;
      var ox = o.pos.x - car.pos.x, oz = o.pos.z - car.pos.z, fd = ox * fx + oz * fz;
      if (fd < 0.5 || fd > look || Math.abs(ox * fz - oz * fx) > 2.8) continue;
      th = fd < look * 0.45 ? -0.6 : Math.min(th, 0);
      bias = (ox * fz - oz * fx) > 0 ? -0.45 : 0.45;
      blk = o;
      break;
    }
    // Something stopped in the way — your car pulled up on the line, a van
    // left in the road — is gone round, not queued behind for good: braking
    // to nothing and steering is no way past it, because a car at rest does
    // not turn. Out past it at a crawl, hard over to the freer side.
    if (blk && Math.abs(blk.speed) < 2 && Math.abs(car.speed) < 6) { th = 0.45; bias *= 2; }
    // and wedged, whatever it was trying to do: back off and have another go
    // (it only ever backed off while it was asking to go forward, so a car
    // braking for something stopped in front sat there till the race ran out)
    if (Math.abs(car.speed) < 1) car.unstickT = (car.unstickT || 0) + dt; else car.unstickT = 0;
    if (car.unstickT > 1.5) { car.reverseT = 0.9; car.unstickT = 0; }
    if (car.reverseT > 0) { car.reverseT -= dt; c.throttle = -1; c.steer = dh > 0 ? -1 : 1; c.handbrake = false; return; }
    c.throttle = th; c.steer = U.clamp(dh * 2.6 + bias, -1, 1); c.handbrake = false;
  }
  function finishMarker(x, z) {
    var g = new THREE.Group();
    var ring = new THREE.Mesh(new THREE.CylinderGeometry(FINISH_R * 0.6, FINISH_R * 0.6, 7, 24, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffe14f, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false }));
    ring.position.y = 3.5;
    g.add(ring);
    g.position.set(x, GAME.city.groundY(x, z), z);
    GAME.scene.add(g);
    return g;
  }
  function dropRacer(keep) {
    if (!racer) return;
    if (racer.marker) { GAME.scene.remove(racer.marker); disposeTree(racer.marker); racer.marker = null; }
    var r = racer.car;
    if (r && !r.gone && !r.dead) {
      // back to being traffic, somewhere up the road
      if (r.occupied === 'ai') r.ai = { mode: 'traffic', desired: keep ? 14 : 12, laneX: 0, laneZ: 0 };
    }
    racer = null;
    if (ev && ev.kind === 'racer') end();
  }
  function stepRacer(dt) {
    var p = P(), r = racer.car, mine = p.car;
    racer.t += dt;
    if (!racer.solo && (!r || r.gone || r.dead || r.occupied !== 'ai')) {
      // crashed out mid-race: the flag is still up, and it is yours to take
      if (racer.state !== 'race') { dropRacer(); return; }
      racer.solo = true;
      say('They\'ve crashed out — the flag is yours if you want it.', 3);
    }
    if (!p.inCar || !mine || mine.dead || p.state !== 'alive') { dropRacer(); return; }
    var c = r.controls;
    if (racer.state === 'pull') {
      // up alongside, on your left, and stop there
      var fx = Math.sin(mine.heading), fz = Math.cos(mine.heading);
      var tx = mine.pos.x + fz * 3.4 + fx * 0.6, tz = mine.pos.z - fx * 3.4 + fz * 0.6;
      var dx = tx - r.pos.x, dz = tz - r.pos.z, d = Math.sqrt(dx * dx + dz * dz);
      var dh = U.wrapPI(Math.atan2(dx, dz) - r.heading);
      var vd = Math.min(12, d * 0.8);
      c.steer = d > 2 ? U.clamp(dh * 2.2, -1, 1) : U.clamp(U.wrapPI(mine.heading - r.heading) * 2, -1, 1);
      c.throttle = U.clamp((vd - r.speed) * 0.35, -1, 1); c.handbrake = false;
      if (d < 2.2 && Math.abs(r.speed) < 1.2) {
        racer.state = 'rev'; racer.t = 0;
        GAME.vehicles.honk(r);
        say('Somebody pulls up alongside and revs at you — floor it to race to the flag, ' + Math.round(RACE_LEN / 50) * 50 + ' m up the road. Or don\'t.', 4.5);
        racer.marker = finishMarker(racer.fin[0], racer.fin[1]);
      }
      if (racer.t > 14 || Math.abs(mine.speed) > 3) dropRacer();
      return;
    }
    if (racer.state === 'rev') {
      c.throttle = 0; c.steer = 0; c.handbrake = true;
      if (mine.speed > 3 && mine.controls && mine.controls.throttle > 0.5) {
        racer.state = 'race'; racer.t = 0;
        say('GO!', 1.2);
        GAME.audio.pickup();
      } else if (racer.t > 6 || Math.abs(mine.speed) > 3) {
        // no takers: off they go
        say('No? Suit yourself.', 2);
        dropRacer();
      }
      return;
    }
    // the race
    if (!racer.solo) drive(r, racer.route, 30, dt);
    var f = racer.fin;
    if (U.dist2(mine.pos.x, mine.pos.z, f[0], f[1]) < FINISH_R * FINISH_R) {
      pay(300, racer.solo ? 'You take the flag — they never made it.' : 'You take them at the flag.');
      dropRacer(true);
      return;
    }
    if (!racer.solo && U.dist2(r.pos.x, r.pos.z, f[0], f[1]) < FINISH_R * FINISH_R) {
      say('They take it by a length.', 3);
      dropRacer(true);
      return;
    }
    if (racer.t > 70) { say('The race peters out.', 2); dropRacer(); }
  }

  // ---------- the running order ----------
  var KINDS = [['chase', 3, startChase], ['robbery', 3, startRobbery], ['van', 2, startVan]];
  function roll() {
    var total = 0, i;
    for (i = 0; i < KINDS.length; i++) total += KINDS[i][1];
    var r = Math.random() * total, order = [];
    for (i = 0; i < KINDS.length; i++) { r -= KINDS[i][1]; if (r <= 0) { order.push(KINDS[i]); break; } }
    for (i = 0; i < KINDS.length; i++) if (order.indexOf(KINDS[i]) < 0) order.push(KINDS[i]);
    for (i = 0; i < order.length; i++) if (order[i][2]()) return true;
    return false;
  }
  function end() {
    // whatever was kept for it goes back to being ordinary traffic
    if (ev && ev.perp) ev.perp.keep = false;
    if (ev && ev.cop) ev.cop.keep = false;
    if (ev && ev.van) ev.van.keep = false;
    if (ev && ev.kind === 'chase' || ev && ev.kind === 'chaseDone') {
      var cop = ev.cop;
      if (cop && !cop.gone && !cop.dead) {
        cop.sirenOn = false;
        if (cop.ai) { cop.ai.follow = null; cop.ai.desired = 11; }
        var lb = cop.mesh.userData.lightbar;
        if (lb) { lb[0].visible = false; lb[1].visible = false; }
      }
      var perp = ev.perp;
      if (perp && !perp.gone && perp.ai) { perp.ai.toward = null; perp.ai.desired = 12; }
    }
    ev = null;
    nextT = EVERY[GAME.chaos.level] * U.randRange(Math.random, 0.7, 1.3);
  }
  function update(dt) {
    var lvl = GAME.chaos.level;
    if (racer) stepRacer(dt);
    if (ev) {
      ev.t += dt;
      if (ev.kind === 'chase') stepChase(dt);
      else if (ev.kind === 'chaseDone') {
        ev.holdT -= dt;
        if (ev.holdT <= 0 || ev.cop.gone) end();
      }
      else if (ev.kind === 'robbery') stepRobbery();
      else if (ev.kind === 'van') stepVan();
      // the cruiser's bar, while its siren is going (police.js leaves a car
      // with its siren on to whoever switched it on)
      if (ev && (ev.kind === 'chase' || ev.kind === 'chaseDone') && ev.cop && !ev.cop.gone && !ev.cop.dead) {
        var lb = ev.cop.mesh.userData.lightbar, ph = (GAME.time * 8 | 0) % 2;
        if (lb) { lb[0].visible = ph === 0; lb[1].visible = ph === 1; }
      }
      return;
    }
    if (!lvl || !quiet()) return;
    lookForRacer(dt);
    if (ev) return;
    nextT -= dt;
    if (nextT > 0) return;
    if (!roll()) nextT = 10;
  }

  // what the radar shows of it: the getaway car, the thief, the van, the flag
  function blips() {
    var n = 0;
    function put(x, z, color, size) {
      var b = blipBuf[n] || (blipBuf[n] = { x: 0, z: 0, color: '', size: 0 });
      b.x = x; b.z = z; b.color = color; b.size = size; n++;
    }
    if (ev && ev.kind === 'chase' && !ev.perp.gone) put(ev.perp.pos.x, ev.perp.pos.z, '#ff3b3b', 3.5);
    if (ev && ev.kind === 'robbery' && !ev.thief.gone) put(ev.thief.pos.x, ev.thief.pos.z, '#ff3b3b', 3);
    if (ev && ev.kind === 'van' && !ev.van.gone) put(ev.van.pos.x, ev.van.pos.z, '#d8dde6', 3.5);
    if (racer && racer.marker) put(racer.fin[0], racer.fin[1], '#ffe14f', 4.5);
    blipBuf.length = n;
    return blipBuf;
  }

  return {
    update: update,
    blips: blips,
    // the cruiser going by with its siren on, if there is one (police.js and
    // the traffic that pulls over for it)
    siren: function () {
      return ev && ev.kind === 'chase' && ev.cop && !ev.cop.gone && !ev.cop.dead ? ev.cop : null;
    },
    get now() { return ev ? ev.kind : racer ? 'racer' : null; },
    get event() { return ev; },
    get racer() { return racer; },
    // headless hooks: make one happen now, and clear the board
    start: function (kind) {
      if (ev) end();
      if (kind === 'racer') { racerT = 0; stillT = 9; lookForRacer(0, true); return !!racer; }
      for (var i = 0; i < KINDS.length; i++) if (KINDS[i][0] === kind) return KINDS[i][2]();
      return false;
    },
    reset: function () {
      if (racer) dropRacer();
      if (ev) end();
      nextT = 40; racerT = 45; stillT = 0;
    }
  };
})();
