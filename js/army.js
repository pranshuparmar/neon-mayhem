// The top of the ladder: at six stars the army comes, the way it did in Vice
// City — trucks of soldiers in with the cruisers (police.js sends those), and
// a tank. The tank is slow, all but indestructible, and flattens whatever it
// drives into; its turret swings to you and the gun goes off every few
// seconds. Get its crew out and it is yours: the turret follows your aim and
// LMB (FIRE) is the cannon.
GAME.army = (function () {
  var SPAWN_EVERY = 14, SHOT_R = 80, CRUSH = 900;
  var tankT = 6;

  function tanks() {
    var out = [], cars = GAME.world.cars;
    for (var i = 0; i < cars.length; i++) if (cars[i].spec.tank && !cars[i].dead && !cars[i].gone) out.push(cars[i]);
    return out;
  }
  function armyTank() {
    var t = tanks();
    for (var i = 0; i < t.length; i++) if (t[i].armyUnit && t[i].occupied === 'ai') return t[i];
    return null;
  }

  // one of theirs, sent from round a corner a way off
  function sendTank() {
    var f = GAME.focus(), C = GAME.city;
    for (var t = 0; t < 10; t++) {
      var a = Math.random() * Math.PI * 2, r = U.randRange(Math.random, 120, 180);
      var rp = C.nearestRoadPoint(f.x + Math.cos(a) * r, f.z + Math.sin(a) * r);
      if (C.isInWater(rp.x, rp.z) || C.inAirport(rp.x, rp.z)) continue;
      if (!!(GAME.isla && GAME.isla.contains(rp.x, rp.z)) !== !!(GAME.isla && GAME.isla.contains(f.x, f.z))) continue;
      if (U.dist2(rp.x, rp.z, f.x, f.z) > 230 * 230) continue;
      var car = GAME.vehicles.spawnCar('tank', rp.x, rp.z, Math.atan2(f.x - rp.x, f.z - rp.z), { occupied: 'ai', ai: { mode: 'chase' } });
      if (!car) continue;
      car.isPolice = true; car.armyUnit = true; car.copsOut = 2;
      car.shootT = 2; car.gunT = 3; car.tactic = 'ram';
      return car;
    }
    return null;
  }

  // the turret, toward what it is aimed at; the gun when it bears
  function turretTo(car, yaw, dt) {
    var tur = car.mesh.userData.turret;
    if (!tur) return 0;
    var want = U.wrapPI(yaw - car.heading);
    tur.rotation.y = U.angleLerp(tur.rotation.y, want, Math.min(1, dt * 3.2));
    return Math.abs(U.wrapPI(tur.rotation.y - want));
  }
  function muzzle(car) {
    var tur = car.mesh.userData.turret, yaw = car.heading + (tur ? tur.rotation.y : 0);
    return { x: car.pos.x + Math.sin(yaw) * 4.8, y: car.pos.y + 1.95, z: car.pos.z + Math.cos(yaw) * 4.8, yaw: yaw };
  }
  function fire(car, dy) {
    var m = muzzle(car);
    GAME.arsenal.fireShell(m.x, m.y, m.z, m.yaw, dy, car, true);
    car.speed *= 0.9;   // (it rocks back on its tracks)
  }

  // whatever it drives into, it drives over
  function crush(car, dt) {
    if (Math.abs(car.speed) < 1.5) return;
    var cars = GAME.world.cars, P = GAME.player, mine = P.inCar && P.car === car;
    for (var i = 0; i < cars.length; i++) {
      var c = cars[i];
      if (c === car || c.dead || c.spec.tank || c.spec.heli || c.spec.plane || c.spec.boat) continue;
      // (the bodies stop each other at about their circles: vehicles.js)
      var reach = (car.radius + c.radius) * 1.05;
      var ox = c.pos.x - car.pos.x, oz = c.pos.z - car.pos.z, od = Math.sqrt(ox * ox + oz * oz);
      if (od > reach) continue;
      // in the way of where it is going, not just going by alongside
      var dir = car.speed >= 0 ? 1 : -1;
      if ((ox * Math.sin(car.heading) + oz * Math.cos(car.heading)) * dir < od * 0.55) continue;
      GAME.vehicles.damageCar(c, CRUSH * dt * Math.min(1, Math.abs(car.speed) / 6), 'wall', mine);
      if (GAME.frame % 10 === 0) GAME.audio.crash(0.7, c.pos.x, c.pos.z);
      if (mine && c.isPolice && !c.mission) GAME.police.reportCrime('hit_cop_car', P.pos);
    }
  }

  var told = false;
  function update(dt) {
    if (!GAME.started) return;
    var P = GAME.player, s = GAME.police.wanted, inp = GAME.input, T = inp.touch;
    // the army's tank, at six stars, one at a time
    if (s >= 6 && P.state === 'alive' && !P.interior) {
      tankT -= dt;
      if (tankT <= 0) { tankT = SPAWN_EVERY; if (!armyTank()) sendTank(); }
    } else tankT = 6;
    var list = tanks(), f = GAME.focus();
    for (var i = 0; i < list.length; i++) {
      var car = list[i];
      car.gunT = (car.gunT || 0) - dt;
      crush(car, dt);
      if (P.inCar && P.car === car) {
        // yours: the turret follows the camera, LMB (or FIRE) is the gun
        if (!told) { told = true; GAME.hud.message('MASTODON — the turret follows your aim, ' + (GAME.isTouch ? 'FIRE' : 'LMB') + ' fires the cannon.', 4); }
        turretTo(car, GAME.cam.yaw, dt);
        var pull = (inp.lmbPressed || inp.lmb || T.fire);
        inp.lmbPressed = false;
        if (pull && car.gunT <= 0) { car.gunT = 1.3; fire(car, -Math.tan(GAME.cam.pitch - 0.3) * 0.25); }
        continue;
      }
      if (car.occupied !== 'ai' || !car.armyUnit) continue;
      // theirs: the turret on you, and the gun when it bears and can see you
      var d = Math.sqrt(U.dist2(car.pos.x, car.pos.z, f.x, f.z));
      var off = turretTo(car, Math.atan2(f.x - car.pos.x, f.z - car.pos.z), dt);
      if (s < 6) { if (d > 260) GAME.vehicles.removeCar(car); continue; }
      if (car.gunT <= 0 && d < SHOT_R && d > 12 && off < 0.08 && P.state === 'alive' && !GAME.godMode &&
          GAME.city.hash.segmentClear(car.pos.x, car.pos.z, f.x, f.z)) {
        car.gunT = U.randRange(Math.random, 3.2, 4.5);
        var fy = (P.inCar && P.car ? P.car.pos.y : P.pos.y) + 0.8;
        fire(car, (fy - (car.pos.y + 1.95)) / Math.max(1, d));
      }
    }
  }

  return {
    update: update,
    sendTank: sendTank,
    tanks: tanks,
    get armyTank() { return armyTank(); }
  };
})();
