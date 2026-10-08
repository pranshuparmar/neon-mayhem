var WEAPONS = {
  fist: { name: 'FISTS', slot: 1, damage: 14, range: 2.0, rate: 0.42, auto: false },
  pistol: { name: 'PISTOL', slot: 2, damage: 26, range: 60, rate: 0.34, auto: false, spread: 0.012 },
  smg: { name: 'SMG', slot: 3, damage: 11, range: 48, rate: 0.085, auto: true, spread: 0.045, driveby: true },
  shotgun: { name: 'SHOTGUN', slot: 4, damage: 11, range: 24, rate: 0.95, auto: false, spread: 0.085, pellets: 7 },
  // The world's only PICKUP for it sits on the observatory terrace on Isla
  // Verde — but the hardware counters sell it over the counter for $5,000
  // (with refills), and the all-25-jumps arsenal includes it. Scarce as a
  // find, not as a purchase.
  rifle: { name: 'RIFLE', slot: 5, damage: 68, range: 150, rate: 0.85, auto: false, spread: 0.002 },
  // Hand-to-hand, one at a time (a new one replaces the old, as in Vice
  // City): `reach` in metres, and the chainsaw keeps cutting while held.
  bat: { name: 'BASEBALL BAT', melee: true, damage: 26, reach: 2.2, rate: 0.62, swing: 'bat' },
  knife: { name: 'KNIFE', melee: true, damage: 34, reach: 1.8, rate: 0.42, swing: 'knife', blood: true },
  katana: { name: 'KATANA', melee: true, damage: 55, reach: 2.5, rate: 0.58, swing: 'katana', blood: true },
  chainsaw: { name: 'CHAINSAW', melee: true, damage: 12, reach: 2.1, rate: 0.09, auto: true, swing: 'chainsaw', blood: true },
  // thrown, one kind at a time, by the count (arsenal.js flies them)
  grenade: { name: 'GRENADES', thrown: 'grenade', rate: 0.9 },
  molotov: { name: 'MOLOTOVS', thrown: 'molotov', rate: 0.9 },
  // the heavy end: a scoped rifle that drops anybody it hits, and a rocket
  sniper: { name: 'SNIPER RIFLE', damage: 140, range: 280, rate: 1.25, auto: false, spread: 0, scope: true },
  rocket: { name: 'ROCKET LAUNCHER', heavy: true, range: 200, rate: 1.5 }
};
var WEAPON_ORDER = ['fist', 'bat', 'knife', 'katana', 'chainsaw', 'pistol', 'smg', 'shotgun', 'rifle', 'sniper', 'rocket', 'grenade', 'molotov'];
// one of each of these at a time: a new one replaces whatever you had
var WEAPON_GROUP = { bat: 'melee', knife: 'melee', katana: 'melee', chainsaw: 'melee', grenade: 'thrown', molotov: 'thrown' };
// how long the gun stays up after a shot from the hip (player.js), and which
// guns take both hands
var SHOT_POSE = 0.6, TWO_HANDED = { smg: true, shotgun: true, rifle: true, sniper: true, rocket: true, chainsaw: true };
// The number keys: 1-5 as they always were, then the hand-to-hand weapon
// you carry, the thing you throw, the sniper rifle and the rocket launcher.
var WEAPON_KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9'];
var WEAPON_KEY_SLOT = ['fist', 'pistol', 'smg', 'shotgun', 'rifle', 'melee', 'thrown', 'sniper', 'heavy'];

GAME.combat = (function () {
  var aiming = false, lockTarget = null, lockIdx = 0;
  var cooldown = 0, aimToggle = false, aimYawRef = 0, rmbWas = false;
  // the lock holds what it is on: the view follows it, and only a real flick
  // of the camera (or Q/E/the wheel) moves it to somebody else
  var flickAcc = 0, LOCK_FLICK = 0.44, LOCK_FOLLOW = 5;
  var reticle = null;

  function initReticle() {
    reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.7, 20),
      new THREE.MeshBasicMaterial({ color: 0x8dffd8, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthTest: false })
    );
    reticle.visible = false;
    reticle.renderOrder = 5;
    GAME.scene.add(reticle);
  }

  // the rifle locks on at most of its range; everything else stays close-in.
  // Eye-height line of sight means a parapet or a rooftop's own edge no
  // longer hides the whole street below — the sniper's perch finally works.
  function lockRange() {
    var wd = WEAPONS[GAME.player.currentWeapon];
    return wd && wd.range >= 100 ? wd.range * 0.85 : 44;
  }
  // Everything the lock could take, in range and in the cone, with a score
  // (lower is better) — but not yet asked whether it can be seen. Kept in a
  // reused list of reused entries; gather() returns the eye height to test
  // sight lines from.
  var scored = [], scoredN = 0;
  function score(t, sc) {
    var e = scored[scoredN] || (scored[scoredN] = { t: null, score: 0 });
    e.t = t; e.score = sc; scoredN++;
  }
  function gather() {
    var P = GAME.player, cam = GAME.cam;
    var range = lockRange();
    scoredN = 0;
    var peds = GAME.world.peds;
    for (var i = 0; i < peds.length; i++) {
      var t = peds[i];
      if (t.dead) continue;
      var dx = t.pos.x - P.pos.x, dz = t.pos.z - P.pos.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      if (d > range || d < 0.5) continue;
      var ang = Math.abs(U.wrapPI(Math.atan2(dx, dz) - cam.yaw));
      if (ang > 0.75) continue;
      score(t, ang * 30 + d);
    }
    // vehicles are lockable too (pursuing cruisers etc.), weighted after people
    var cars = GAME.world.cars;
    for (var ci = 0; ci < cars.length; ci++) {
      var car = cars[ci];
      if (car.dead || car === P.car) continue;
      var cdx = car.pos.x - P.pos.x, cdz = car.pos.z - P.pos.z;
      var cd = Math.sqrt(cdx * cdx + cdz * cdz);
      if (cd > range || cd < 0.5) continue;
      var cang = Math.abs(U.wrapPI(Math.atan2(cdx, cdz) - cam.yaw));
      if (cang > 0.7) continue;
      // ...except one with a rider out in the open: that is a person too
      score(car, cang * 30 + cd + (GAME.vehicles.exposedRider(car) ? 0 : 14));
    }
    return P.pos.y + 1.35;
  }
  // In view: no building in the way, and no car either — a car body stops
  // your rounds (raycast), so somebody crouched behind one is not a target you
  // can lock on to and then never hit.
  function inView(P, t, eye) {
    if (!GAME.city.hash.segmentClear(P.pos.x, P.pos.z, t.pos.x, t.pos.z, eye)) return false;
    var dx = t.pos.x - P.pos.x, dz = t.pos.z - P.pos.z;
    var d = Math.sqrt(dx * dx + dz * dz);
    if (d < 0.01) return true;
    dx /= d; dz /= d;
    var cars = GAME.world.cars;
    for (var i = 0; i < cars.length; i++) {
      var c = cars[i];
      if (c === t || c === P.car || c.sinking) continue;
      if (Math.abs(c.pos.y - P.pos.y) > 2.5) continue;
      var tc = rayCarBody(P.pos.x, P.pos.z, dx, dz, c);
      if (tc >= 0 && tc < d - 0.3) return false;
    }
    return true;
  }
  // every target in view, best first: what Q/E and the wheel step through
  function candidates() {
    var P = GAME.player, eye = gather(), list = [];
    for (var i = 0; i < scoredN; i++) {
      var e = scored[i];
      if (inView(P, e.t, eye)) list.push({ t: e.t, score: e.score });
      e.t = null;
    }
    list.sort(function (a, b) { return a.score - b.score; });
    return list.map(function (e) { return e.t; });
  }
  // candidates()[0] — the same target, ties and all — without building the
  // list or looking along a sight line at anything that could not win: the
  // best-scored is tested first, and the first one in view is the answer.
  // Swinging the camera while aiming asks this up to sixty times a second.
  function bestCandidate() {
    var P = GAME.player, eye = gather(), found = null;
    while (!found) {
      var bi = -1;
      for (var i = 0; i < scoredN; i++) {
        if (scored[i].t && (bi < 0 || scored[i].score < scored[bi].score)) bi = i;
      }
      if (bi < 0) break;
      var t = scored[bi].t;
      scored[bi].t = null;
      if (inView(P, t, eye)) found = t;
    }
    for (var k = 0; k < scoredN; k++) scored[k].t = null;
    return found;
  }

  function setAiming(on) {
    if (on === aiming) return;
    aiming = on;
    if (on) {
      lockTarget = bestCandidate();
      lockIdx = 0;
      aimYawRef = GAME.cam.yaw;
      flickAcc = 0;
    } else {
      lockTarget = null;
    }
    document.getElementById('crosshair').style.display = (on && !GAME.player.inCar) ? 'block' : 'none';
  }

  function cycleTarget(dir) {
    var c = candidates();
    if (!c.length) { lockTarget = null; return; }
    if (!lockTarget) { lockTarget = c[0]; lockIdx = 0; return; }
    var cur = c.indexOf(lockTarget);
    if (cur < 0) cur = 0;
    lockTarget = c[(cur + dir + c.length) % c.length];
  }

  function muzzlePos() {
    var P = GAME.player;
    if (P.inCar && P.car) return { x: P.car.pos.x, y: P.car.pos.y + 1.0, z: P.car.pos.z };
    return { x: P.pos.x + Math.sin(P.heading) * 0.4, y: P.pos.y + 1.35, z: P.pos.z + Math.cos(P.heading) * 0.4 };
  }

  // hitscan against peds, cars, buildings; returns nearest hit
  var shotBoxes = [];   // raycast's list of boxes along the shot, refilled per shot
  function raycast(ox, oy, oz, dirX, dirZ, maxRange, ignoreCar) {
    var bestT = maxRange, hit = null;
    var peds = GAME.world.peds;
    for (var i = 0; i < peds.length; i++) {
      var p = peds[i];
      if (p.dead) continue;
      var t = rayCircle(ox, oz, dirX, dirZ, p.pos.x, p.pos.z, 0.55);
      if (t >= 0 && t < bestT) { bestT = t; hit = { kind: 'ped', obj: p, t: t }; }
    }
    var cars = GAME.world.cars;
    for (var c = 0; c < cars.length; c++) {
      var car = cars[c];
      if (car === ignoreCar) continue;
      // A rider sits up above the machine, square in the line of fire: a
      // round through where they sit is theirs, not the bodywork's. Without
      // this the bike's own circle, which the seat sits inside, took them all.
      if (GAME.vehicles.exposedRider(car)) {
        var seat = GAME.vehicles.seatPos(car);
        var tr = rayCircle(ox, oz, dirX, dirZ, seat.x, seat.z, 0.5);
        if (tr >= 0 && tr < bestT) { bestT = tr; hit = { kind: 'rider', obj: car, t: tr }; continue; }
      }
      var tc = rayCircle(ox, oz, dirX, dirZ, car.pos.x, car.pos.z, car.radius * 0.9);
      if (tc >= 0 && tc < bestT) { bestT = tc; hit = { kind: 'car', obj: car, t: tc }; }
    }
    var boxes = GAME.city.hash.queryInto(ox + dirX * bestT / 2, oz + dirZ * bestT / 2, bestT / 2 + 15, shotBoxes);
    for (var b = 0; b < boxes.length; b++) {
      var bx = boxes[b];
      if (bx.noLOS) continue;
      // the world blocks at muzzle height: shots clear anything that tops out
      // below the barrel (kerbs, low parapets — firing down off a roof) and
      // pass under anything that only starts above it (a bridge deck)
      if (bx.h !== undefined && bx.h < oy - 0.4) continue;
      if (bx.minY !== undefined && bx.minY > oy + 0.6) continue;
      var tb = rayAABB(ox, oz, dirX, dirZ, bx);
      if (tb < bestT) { bestT = tb; hit = { kind: 'wall', t: tb }; }
    }
    return { t: bestT, hit: hit };
  }

  // A ray against a car's body as it actually sits — a box, length by width,
  // turned to its heading. Distance to where it enters, or -1.
  function rayCarBody(ox, oz, dx, dz, car) {
    var fx = Math.sin(car.heading), fz = Math.cos(car.heading);
    var rx = ox - car.pos.x, rz = oz - car.pos.z;
    var tmin = -Infinity, tmax = Infinity;
    for (var k = 0; k < 2; k++) {
      var ax = k ? fz : fx, az = k ? -fx : fz;          // forward, then side
      var half = k ? car.spec.w / 2 : car.spec.l / 2;
      var o = rx * ax + rz * az, v = dx * ax + dz * az;
      if (Math.abs(v) < 1e-9) { if (Math.abs(o) > half) return -1; continue; }
      var t1 = (-half - o) / v, t2 = (half - o) / v;
      if (t1 > t2) { var tt = t1; t1 = t2; t2 = tt; }
      if (t1 > tmin) tmin = t1;
      if (t2 < tmax) tmax = t2;
      if (tmin > tmax) return -1;
    }
    if (tmax < 0) return -1;
    return tmin < 0 ? 0 : tmin;
  }

  function rayCircle(ox, oz, dx, dz, cx, cz, r) {
    var mx = ox - cx, mz = oz - cz;
    var b = mx * dx + mz * dz;
    var c = mx * mx + mz * mz - r * r;
    if (c > 0 && b > 0) return -1;
    var disc = b * b - c;
    if (disc < 0) return -1;
    var t = -b - Math.sqrt(disc);
    return t < 0 ? 0 : t;
  }

  function fireGun(w, dirYaw, isDriveBy) {
    var P = GAME.player;
    var wd = WEAPONS[w];
    var m = muzzlePos();
    var inv = P.weapons[w];
    // holding a gun with nothing in it: click once, then swap to the next
    // loaded one (covers a loaded save that comes back empty)
    if (!inv || inv.ammo <= 0) {
      GAME.audio.ricochet();
      if (P.currentWeapon === w) { P.currentWeapon = fallbackFrom(w); refreshWeaponHud(); }
      return;
    }
    if (!GAME.unlimitedAmmo) inv.ammo--;
    GAME.audio.gunshot(w);
    GAME.haptics.shot();
    GAME.fx.flash(m.x + Math.sin(dirYaw) * 0.6, m.y, m.z + Math.cos(dirYaw) * 0.6, 0.8);
    var pellets = wd.pellets || 1;
    for (var p = 0; p < pellets; p++) {
      var yaw = dirYaw + (Math.random() - 0.5) * 2 * wd.spread * (pellets > 1 ? 2.2 : 1);
      var dx = Math.sin(yaw), dz = Math.cos(yaw);
      var res = raycast(m.x, m.y, m.z, dx, dz, wd.range, P.car);
      var t = res.t;
      var ey = m.y + (lockTarget && !isDriveBy ? (lockTarget.pos.y + 1.1 - m.y) * Math.min(1, t / Math.max(1, U.dist(m.x, m.z, lockTarget.pos.x, lockTarget.pos.z))) : 0);
      GAME.fx.tracer(m.x, m.y, m.z, m.x + dx * t, ey, m.z + dz * t);
      if (res.hit) {
        var hx = m.x + dx * t, hz = m.z + dz * t;
        if (res.hit.kind === 'ped') {
          GAME.haptics.hit();
          GAME.peds.damage(res.hit.obj, wd.damage, true);
        } else if (res.hit.kind === 'rider') {
          // off the bike and onto the road, wounded or worse — and the lock
          // goes with the person, not the machine rolling on without them
          GAME.haptics.hit();
          var rider = GAME.vehicles.throwRider(res.hit.obj);
          if (rider) {
            if (lockTarget === res.hit.obj) lockTarget = rider;
            GAME.peds.damage(rider, wd.damage, true);
          }
        } else if (res.hit.kind === 'car') {
          GAME.haptics.hit();
          GAME.vehicles.damageCar(res.hit.obj, wd.damage * 0.8, 'gun');
          GAME.vehicles.shotAt(res.hit.obj);   // and whoever is driving it reacts (vehicles.js)
          GAME.fx.spawn(hx, 0.8, hz, { count: 3, color: 0xffe0a0, spread: 2, life: 0.3 });
          if (res.hit.obj.isPolice && !res.hit.obj.mission) GAME.police.reportCrime('hit_cop_car', P.pos);
          else if (res.hit.obj.ai && (res.hit.obj.ai.mode === 'traffic' || res.hit.obj.ai.mode === 'cruise') && !res.hit.obj.outlaw) GAME.police.reportCrime('shoot_car', P.pos);
        } else {
          GAME.fx.spawn(hx, m.y, hz, { count: 3, color: 0xccccdd, spread: 1.5, life: 0.25 });
          if (Math.random() < 0.4) GAME.audio.ricochet();
        }
      }
    }
    GAME.police.noteGunfire(P.pos);
    GAME.peds.panic(P.pos.x, P.pos.z, 30);
    GAME.missions.notifyChaos(2);
    // the last round spends the gun: an empty weapon hands off to the next
    // loaded one on its own instead of dry-clicking in a firefight
    if (inv.ammo <= 0 && P.currentWeapon === w) {
      var next = fallbackFrom(w);
      P.currentWeapon = next;
      GAME.hud.message('Out of ammo — ' + (next === 'fist' ? 'fists up.' : WEAPONS[next].name + ' up.'), 2);
    }
    refreshWeaponHud();
  }

  // the next loaded gun in 1-5 order after the spent one, wrapping round the
  // coat — or fists, which are always loaded, when every magazine is empty
  function fallbackFrom(w) {
    var P = GAME.player, at = WEAPON_ORDER.indexOf(w);
    for (var i = 1; i < WEAPON_ORDER.length; i++) {
      var cand = WEAPON_ORDER[(at + i) % WEAPON_ORDER.length];
      if (cand === 'fist') continue;
      var cinv = P.weapons[cand];
      if (cinv && cinv.have && cinv.ammo > 0) return cand;
    }
    return 'fist';
  }

  // a fist, or whatever hand-to-hand weapon is in it
  function punch(w) {
    var P = GAME.player, wd = WEAPONS[w || 'fist'];
    var reach = wd.reach || 1.3;
    P.punchT = 0.26; // drives the swing animation in player.js
    if (wd.swing) GAME.audio.swing(wd.swing); else GAME.audio.punch();
    var fx = Math.sin(P.heading), fz = Math.cos(P.heading);
    var px = P.pos.x + fx * (reach - 0.1), pz = P.pos.z + fz * (reach - 0.1);
    var hitR2 = 1.7 * (reach / 1.3);
    var peds = GAME.world.peds;
    for (var i = 0; i < peds.length; i++) {
      var p = peds[i];
      if (p.dead) continue;
      if (U.dist2(p.pos.x, p.pos.z, px, pz) < hitR2) {
        GAME.peds.damage(p, wd.damage, true);
        if (wd.swing) GAME.audio.thud(wd.swing);
        if (wd.blood) GAME.fx.spawn(p.pos.x, p.pos.y + 1.2, p.pos.z, { count: 4, color: 0xaa1020, spread: 0.6, vy: 1.5, life: 0.4, grav: 6 });
        // (an outlaw — a thief on the run — is fair game: streetlife.js)
        if (!p.outlaw) GAME.police.reportCrime('hit_ped', P.pos);
        GAME.missions.notifyChaos(20);
        return;
      }
    }
    var car = GAME.vehicles.findNearestCar(px, pz, 2.2, P.car);
    // a rider is within reach where a driver behind glass is not
    var rider = car && GAME.vehicles.throwRider(car);
    if (rider) {
      GAME.peds.damage(rider, wd.damage, true);
      if (!rider.outlaw) GAME.police.reportCrime('hit_ped', P.pos);
      GAME.missions.notifyChaos(20);
      return;
    }
    if (car) {
      GAME.vehicles.damageCar(car, wd.melee ? wd.damage * 0.5 : 6, 'fist');
      GAME.fx.spawn(px, 1, pz, { count: 3, color: 0xffe0a0, spread: 1, life: 0.3 });
    }
  }

  function update(dt) {
    var P = GAME.player, inp = GAME.input, T = inp.touch;
    cooldown -= dt;
    // (and no gunplay in the water: both hands are swimming)
    if (P.state !== 'alive' || P.entering || P.swimming || P.interior) { setAiming(false); aimToggle = false; inp.lmbPressed = false; return; }

    // weapon select: the number keys, by slot (arsenal.js), a step to the
    // next, and the wheel (which steps on a tap and opens on a hold)
    for (var i = 0; i < WEAPON_KEYS.length; i++) {
      if (GAME.keyPressed(WEAPON_KEYS[i])) {
        var slotted = GAME.arsenal ? GAME.arsenal.inSlot(WEAPON_KEY_SLOT[i]) : WEAPON_KEY_SLOT[i];
        if (slotted) selectWeapon(slotted);
      }
    }
    if (T.weaponCycle) {
      T.weaponCycle = false;
      cycle(1);
    }
    if (GAME.arsenal && GAME.arsenal.wheelOpen) { inp.lmbPressed = false; return; }

    if (GAME.keyPressed('Tab')) aimToggle = !aimToggle;
    // A Tab-latched aim must never outlive the moment: releasing RMB ends
    // aiming (latch included), and boarding a vehicle clears it. A stale
    // latch used to survive car rides and hospital visits, after which RMB
    // read as completely broken — aim was already stuck on, so holding or
    // releasing the button changed nothing.
    if (rmbWas && !inp.rmb) aimToggle = false;
    rmbWas = inp.rmb;
    if (P.inCar) aimToggle = false;
    var aimHeld = inp.rmb || aimToggle || T.aim;
    setAiming(aimHeld && !P.inCar);

    if (aiming) {
      if (GAME.keyPressed('KeyQ')) { cycleTarget(-1); aimYawRef = GAME.cam.yaw; }
      if (GAME.keyPressed('KeyE')) { cycleTarget(1); aimYawRef = GAME.cam.yaw; }
      if (inp.wheel !== 0) { cycleTarget(inp.wheel > 0 ? 1 : -1); inp.wheel = 0; aimYawRef = GAME.cam.yaw; }
      // The lock holds its target. It used to re-pick on any camera turn of
      // three degrees, so a nudge of the mouse handed it to whoever stood
      // nearest the new line, and nothing turned the view after whoever it
      // was on, so a runner took the lock straight out of the frame. Now what
      // the HAND turned since the last tick is added up (and lets go of itself
      // over a moment): past ~25 degrees it is a flick, and the lock goes to
      // whoever the view now points at; short of that the view eases round to
      // follow the target.
      flickAcc = flickAcc * Math.exp(-3 * dt) + U.wrapPI(GAME.cam.yaw - aimYawRef);
      if (Math.abs(flickAcc) > LOCK_FLICK) {
        flickAcc = 0;
        var best = bestCandidate();
        if (best) lockTarget = best;
      } else if (lockTarget && !P.inCar) {
        var bearing = Math.atan2(lockTarget.pos.x - P.pos.x, lockTarget.pos.z - P.pos.z);
        GAME.cam.yaw = U.angleLerp(GAME.cam.yaw, bearing, Math.min(1, LOCK_FOLLOW * dt));
      }
      aimYawRef = GAME.cam.yaw;
      var keep = lockRange() + 8;
      if (lockTarget && (lockTarget.dead || lockTarget.gone || U.dist2(lockTarget.pos.x, lockTarget.pos.z, P.pos.x, P.pos.z) > keep * keep)) {
        lockTarget = bestCandidate();
      }
      if (!lockTarget && GAME.frame % 20 === 0) lockTarget = bestCandidate();
    } else {
      // (not aiming, the mouse wheel steps through what you carry — the
      // way Vice City's did)
      if (inp.wheel !== 0 && !P.inCar) cycle(inp.wheel > 0 ? 1 : -1);
      inp.wheel = 0;
    }

    // down the scope there is no lock: the round goes where the crosshair is
    if (GAME.arsenal && GAME.arsenal.scoped) lockTarget = null;
    if (reticle) {
      if (aiming && lockTarget) {
        reticle.visible = true;
        reticle.position.set(lockTarget.pos.x, lockTarget.pos.y + 1.1, lockTarget.pos.z);
        reticle.lookAt(GAME.cameraObj.position);
        var sc = 1 + 0.12 * Math.sin(GAME.time * 8);
        reticle.scale.setScalar(sc);
      } else reticle.visible = false;
    }

    var w = P.currentWeapon, wd = WEAPONS[w];
    if (P.weaponMesh) P.weaponMesh.visible = (w !== 'fist' && !P.inCar);

    // drive-by: Q/E pick a side; LMB (or FIRE) alone fires toward the side you're
    // looking, matching the on-screen prompt "LMB — Fire (drive-by w/ SMG)"
    // clicks in the instant after the pointer locks are still part of
    // arriving — the tail of a double-click, not a trigger pull
    var settling = !!inp.lockGraceT && performance.now() - inp.lockGraceT < 450;

    if (P.inCar) {
      // no drive-by from an aircraft: the TALON's own weapons read LMB/FIRE,
      // and the SMG going off alongside the chin gun was a double trigger —
      // every burst of gunship fire also burned drive-by ammo sideways
      var airCar = P.car && (P.car.spec.heli || P.car.spec.plane);
      var hasSMG = !airCar && P.weapons.smg && P.weapons.smg.have && P.weapons.smg.ammo > 0;
      var left = GAME.key('KeyQ') || T.driveByL;
      var right = GAME.key('KeyE') || T.driveByR;
      var fireBtn = (inp.lmb && !settling) || T.fire;
      if (hasSMG && (left || right || fireBtn)) {
        if (cooldown <= 0) {
          cooldown = WEAPONS.smg.rate;
          // left of travel = heading + pi/2 in this parametrization
          var side;
          if (left) side = 1;
          else if (right) side = -1;
          else side = U.wrapPI(GAME.cam.yaw - P.car.heading) > 0 ? 1 : -1;
          var yaw = P.car.heading + side * Math.PI / 2 + (Math.random() - 0.5) * 0.15;
          fireGun('smg', yaw, true);
        }
      }
      inp.lmbPressed = false;
      return;
    }

    // on-foot firing
    var fireHeld = (inp.lmb && !settling) || T.fire;
    var firePressed = (inp.lmbPressed && !settling) || T.firePressed;
    inp.lmbPressed = false; T.firePressed = false;
    var wantFire = wd.auto ? fireHeld : firePressed;
    if (wantFire && cooldown <= 0) {
      cooldown = wd.rate;
      var scoped = GAME.arsenal && GAME.arsenal.scoped;
      if (w === 'fist' || wd.melee) punch(w);
      else if (wd.thrown || wd.heavy) {
        var inv2 = P.weapons[w];
        if (!inv2 || inv2.ammo <= 0) { P.currentWeapon = fallbackFrom(w); refreshWeaponHud(); return; }
        var ty = aiming && lockTarget ? Math.atan2(lockTarget.pos.x - P.pos.x, lockTarget.pos.z - P.pos.z) : GAME.cam.yaw;
        P.heading = ty; P.shotT = SHOT_POSE; P.shotYaw = ty;
        if (wd.heavy) GAME.arsenal.fireRocket(ty, aiming ? lockTarget : null);
        else GAME.arsenal.throwIt(wd.thrown, ty, aiming ? lockTarget : null);
        if (!GAME.unlimitedAmmo) inv2.ammo--;
        if (inv2.ammo <= 0) {
          var nx = fallbackFrom(w);
          P.currentWeapon = nx;
          if (wd.thrown) inv2.have = false;
          GAME.hud.message('Out of ' + wd.name.toLowerCase() + ' — ' + WEAPONS[nx].name + ' up.', 2);
        }
        refreshWeaponHud();
      } else {
        var yaw;
        if (scoped) {
          yaw = GAME.cam.yaw;
          P.heading = yaw;
        } else if (aiming && lockTarget) {
          yaw = Math.atan2(lockTarget.pos.x - P.pos.x, lockTarget.pos.z - P.pos.z);
          P.heading = yaw;
        } else {
          yaw = GAME.cam.yaw;
          if (aiming) P.heading = yaw;
        }
        // fired from the hip as much as down the sights, the gun comes up
        // the way the shot goes and the body turns to it (player.js poses it)
        P.shotT = SHOT_POSE; P.shotYaw = yaw;
        fireGun(w, yaw, false);
      }
    }
  }

  function selectWeapon(w) {
    var P = GAME.player;
    if (!w || !P.weapons[w] || !P.weapons[w].have) return;
    P.currentWeapon = w;
    refreshWeaponHud();
  }
  // the next (or last) thing you carry that can be used, round the order
  function cycle(dir) {
    var P = GAME.player;
    var have = WEAPON_ORDER.filter(function (w) {
      var v = P.weapons[w];
      return v && v.have && (w === 'fist' || WEAPONS[w].melee || v.ammo > 0);
    });
    if (!have.length) return;
    var idx = have.indexOf(P.currentWeapon);
    selectWeapon(have[(idx + (dir < 0 ? have.length - 1 : 1)) % have.length]);
  }

  function giveWeapon(id, ammo) {
    var P = GAME.player;
    if (!WEAPONS[id]) return;
    // one of a kind: a new hand-to-hand weapon, or a new thing to throw,
    // takes the place of the one you had
    var grp = WEAPON_GROUP[id];
    if (grp) {
      for (var o in WEAPON_GROUP) {
        if (o === id || WEAPON_GROUP[o] !== grp || !P.weapons[o]) continue;
        P.weapons[o].have = false; P.weapons[o].ammo = 0;
      }
    }
    if (!P.weapons[id]) P.weapons[id] = { have: true, ammo: 0 };
    P.weapons[id].have = true;
    // (a club does not run out: it is counted as one, so the save keeps it)
    if (WEAPONS[id].melee) P.weapons[id].ammo = 1;
    else if (id !== 'fist') P.weapons[id].ammo += (ammo || 30);
    P.currentWeapon = id;
    refreshWeaponHud();
  }

  // the full arsenal — with no stock given, for unlimited ammo (which is no
  // use without something to fire it from); given one, topped up to it
  var FULL_LOAD = { pistol: 120, smg: 360, shotgun: 72, rifle: 90 };   // three boxes of each
  function giveAllWeapons(stock) {
    var P = GAME.player;
    ['pistol', 'smg', 'shotgun', 'rifle'].forEach(function (w) {
      var want = stock ? stock[w] : 999;
      P.weapons[w] = { have: true, ammo: Math.max(want, (P.weapons[w] && P.weapons[w].ammo) || 0) };
    });
    if (P.currentWeapon === 'fist') P.currentWeapon = 'pistol';
    refreshWeaponHud();
  }

  function refreshWeaponHud() {
    var P = GAME.player;
    var wd = WEAPONS[P.currentWeapon];
    var inv = P.weapons[P.currentWeapon];
    // the reward for all 25 jumps stops the decrement but leaves the count
    // parked on its starting 999, which reads as "999 bullets left", not
    // "never reload again". Say what it actually is.
    GAME.hud.setWeapon(wd.name, P.currentWeapon === 'fist' || wd.melee ? ''
      : GAME.unlimitedAmmo ? '∞'
      : (inv ? inv.ammo : 0), GAME.arsenal ? GAME.arsenal.icon(P.currentWeapon) : '');
    dressProp(P.currentWeapon);
  }

  // what is in your hand, roughly the shape of it (player.js hangs it there)
  var PROPS = {
    bat: [0.8, 0.6, 2.4, 0xc89858], knife: [0.4, 0.25, 0.8, 0xd8dce8], katana: [0.3, 0.22, 3.0, 0xe8ecf4],
    chainsaw: [2.2, 2.0, 2.4, 0xff8a2a], grenade: [1.4, 1.4, 0.45, 0x3a5a2a], molotov: [1, 1.6, 0.45, 0x3a7a4a],
    sniper: [0.8, 0.9, 3.2, 0x2a2a34], rocket: [1.8, 1.6, 3.2, 0x5a6a3a]
  };
  function dressProp(w) {
    var m = GAME.player.weaponMesh;
    if (!m) return;
    var p = PROPS[w];
    m.scale.set(p ? p[0] : 1, p ? p[1] : 1, p ? p[2] : 1);
    m.material.color.setHex(p ? p[3] : 0x222228);
  }

  // ---------- pickups ----------
  var PICKUP_DEFS = {
    health: { color: 0xff4d6a, label: 'HEALTH' },
    armor: { color: 0x4a6cff, label: 'ARMOR' },   // the map's armour blue (hud.js PICKUP_BLIP)
    pistol: { color: 0xd8d8e8, label: 'PISTOL AMMO' },
    smg: { color: 0xffe14f, label: 'SMG AMMO' },
    shotgun: { color: 0xff8a3d, label: 'SHOTGUN AMMO' },
    rifle: { color: 0x8dffd8, label: 'RIFLE' },
    cash: { color: 0x8dffd8, label: 'CASH' },
    // the rest of the arsenal (arsenal.js), out in the city where Vice City
    // left its own: on corners, for whoever looks
    bat: { color: 0xffd24a, label: 'BASEBALL BAT' },
    knife: { color: 0xffd24a, label: 'KNIFE' },
    katana: { color: 0xffd24a, label: 'KATANA' },
    chainsaw: { color: 0xffd24a, label: 'CHAINSAW' },
    grenade: { color: 0xff8a3d, label: 'GRENADES' },
    molotov: { color: 0xff8a3d, label: 'MOLOTOVS' },
    sniper: { color: 0x8dffd8, label: 'SNIPER RIFLE' },
    rocket: { color: 0xff6fb8, label: 'ROCKET LAUNCHER' }
  };

  // A shape, its halo and their materials are fixed by type and colour, so
  // every pickup of a kind wears the same ones instead of building four GPU
  // objects of its own — and pickups come and go: every downed cop drops one,
  // and so do a third of the civilians. Marked shared, so disposeTree leaves
  // them be.
  var pickupGeos = {}, pickupMats = {}, haloGeo = null, haloMats = {};
  function pickupShape(type, color) {
    color = color || (PICKUP_DEFS[type] ? PICKUP_DEFS[type].color : 0xd8d8e8);
    var key = type + '|' + color;
    var geo = pickupGeos[key];
    if (!geo) {
      geo = buildPickupGeo(type, color);
      geo.userData.shared = true;
      pickupGeos[key] = geo;
    }
    var mat = pickupMats[color];
    if (!mat) {
      mat = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: color, emissiveIntensity: 0.55 });
      mat.userData.shared = true;
      pickupMats[color] = mat;
    }
    return new THREE.Mesh(geo, mat);
  }
  // each pickup reads as the thing it gives: a pistol/SMG/shotgun silhouette,
  // a medical cross, a shield, or a cash bundle — instead of a generic cube
  function buildPickupGeo(type, color) {
    var b = new GeoBatch();
    if (type === 'pistol') {
      b.addBox(0, 0.10, 0.06, 0.09, 0.13, 0.46, 0, color, 0);   // slide
      b.addBox(0, -0.06, -0.10, 0.08, 0.24, 0.13, 0.35, color, 0); // grip
      b.addBox(0, 0.02, 0.12, 0.05, 0.05, 0.10, 0, 0x2a2a34, 0);   // trigger guard
    } else if (type === 'smg') {
      b.addBox(0, 0.10, 0.00, 0.09, 0.14, 0.62, 0, color, 0);   // body
      b.addBox(0, -0.08, -0.06, 0.07, 0.22, 0.12, 0, color, 0);    // grip
      b.addBox(0, -0.02, 0.10, 0.06, 0.16, 0.10, 0, 0x2a2a34, 0);  // magazine
      b.addBox(0, 0.10, -0.40, 0.06, 0.09, 0.22, 0, 0x2a2a34, 0);  // stock
    } else if (type === 'shotgun') {
      b.addBox(0, 0.10, 0.10, 0.10, 0.11, 0.78, 0, color, 0);   // barrel
      b.addBox(0, 0.00, 0.10, 0.09, 0.09, 0.34, 0, 0x2a2a34, 0);   // pump
      b.addBox(0, 0.01, -0.40, 0.08, 0.20, 0.26, 0, color, 0);     // stock
    } else if (type === 'rifle') {
      b.addBox(0, 0.11, 0.22, 0.07, 0.08, 1.00, 0, color, 0);      // long barrel
      b.addBox(0, 0.06, -0.10, 0.09, 0.16, 0.44, 0, 0x2a2a34, 0);  // receiver
      b.addBox(0, -0.06, -0.06, 0.07, 0.18, 0.12, 0, 0x2a2a34, 0); // grip
      b.addBox(0, 0.02, -0.46, 0.08, 0.20, 0.30, 0, color, 0);     // stock
      b.addBox(0, 0.22, -0.02, 0.06, 0.10, 0.34, 0, 0xffffff, 0);  // scope
    } else if (type === 'health') {
      b.addBox(0, 0.10, 0, 0.62, 0.20, 0.16, 0, color, 0);      // cross bar
      b.addBox(0, 0.10, 0, 0.20, 0.62, 0.16, 0, color, 0);      // cross post
    } else if (type === 'armor') {
      b.addBox(0, 0.16, 0, 0.46, 0.34, 0.14, 0, color, 0);      // shield body
      b.addBox(0, -0.10, 0, 0.26, 0.26, 0.14, 0, color, 0);     // tapered point
      b.addBox(0, 0.16, 0.08, 0.16, 0.16, 0.04, 0, 0xffffff, 0);   // emblem
    } else if (type === 'bat' || type === 'katana') {
      var kat = type === 'katana';
      b.addBox(0, 0.10, 0.12, kat ? 0.04 : 0.09, kat ? 0.07 : 0.1, kat ? 0.9 : 0.8, 0, kat ? 0xe8ecf4 : color, 0);
      b.addBox(0, 0.10, -0.38, 0.07, 0.08, 0.26, 0, kat ? 0x2a2a34 : 0x8a6a3a, 0);
      if (kat) b.addBox(0, 0.10, -0.24, 0.16, 0.12, 0.04, 0, color, 0);
    } else if (type === 'knife') {
      b.addBox(0, 0.10, 0.10, 0.04, 0.09, 0.34, 0, 0xe8ecf4, 0);
      b.addBox(0, 0.10, -0.14, 0.07, 0.1, 0.16, 0, color, 0);
    } else if (type === 'chainsaw') {
      b.addBox(0, 0.10, -0.12, 0.2, 0.24, 0.32, 0, color, 0);
      b.addBox(0, 0.10, 0.28, 0.05, 0.12, 0.5, 0, 0xe8ecf4, 0);
    } else if (type === 'grenade' || type === 'molotov') {
      var mol = type === 'molotov';
      b.addBox(-0.12, 0.10, 0, 0.16, mol ? 0.3 : 0.2, 0.16, 0, mol ? 0x3a7a4a : 0x3a5a2a, 0);
      b.addBox(0.12, 0.10, 0, 0.16, mol ? 0.3 : 0.2, 0.16, 0, mol ? 0x3a7a4a : 0x3a5a2a, 0);
      b.addBox(0, 0.30, 0, 0.36, 0.05, 0.05, 0, color, 0);
    } else if (type === 'sniper') {
      b.addBox(0, 0.11, 0.26, 0.06, 0.07, 1.2, 0, color, 0);
      b.addBox(0, 0.04, -0.2, 0.09, 0.16, 0.5, 0, 0x2a2a34, 0);
      b.addBox(0, 0.24, 0.0, 0.08, 0.1, 0.4, 0, 0xffffff, 0);
    } else if (type === 'rocket') {
      b.addBox(0, 0.12, 0.05, 0.18, 0.18, 1.1, 0, 0x5a6a3a, 0);
      b.addBox(0, 0.12, 0.66, 0.12, 0.12, 0.14, 0, color, 0);
      b.addBox(0, -0.06, -0.1, 0.07, 0.2, 0.1, 0, 0x2a2a34, 0);
    } else { // cash bundle
      b.addBox(0, 0.06, 0, 0.52, 0.10, 0.30, 0, color, 0);
      b.addBox(0, 0.17, 0, 0.50, 0.09, 0.28, 0.16, color, 0);
      b.addBox(0, 0.12, 0, 0.14, 0.24, 0.32, 0, 0x2a6a52, 0);      // paper band
    }
    return b.build();
  }

  function pickupMesh(type) {
    var def = PICKUP_DEFS[type];
    var g = new THREE.Group();
    var core = pickupShape(type, def.color);
    core.position.y = 0.1;
    g.add(core);
    g.userData.core = core;
    if (!haloGeo) { haloGeo = new THREE.RingGeometry(0.5, 0.62, 16); haloGeo.userData.shared = true; }
    var haloMat = haloMats[def.color];
    if (!haloMat) {
      haloMat = new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
      haloMat.userData.shared = true;
      haloMats[def.color] = haloMat;
    }
    var halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = -0.5;
    g.add(halo);
    return g;
  }

  function initPickups() {
    initReticle();
    var spots = GAME.city.pickupSpots;
    for (var i = 0; i < spots.length; i++) {
      addPickup(spots[i].x, spots[i].z, spots[i].type, true, spots[i].y);
    }
  }
  function addPickup(x, z, type, fixed, y) {
    var mesh = pickupMesh(type);
    mesh.position.set(x, y === undefined ? GAME.city.groundY(x, z) + 1.0 : y, z);
    GAME.scene.add(mesh);
    var p = { mesh: mesh, pos: mesh.position, type: type, fixed: !!fixed, respawnT: 0, ttl: fixed ? Infinity : 30, taken: false };
    GAME.world.pickups.push(p);
    return p;
  }
  // (`amount`: a cash bag with a sum in it — a thief's takings, a van's
  // load — rather than a dead man's loose change, and it lasts longer)
  function dropPickup(x, z, type, amount) {
    if (GAME.world.pickups.length > 60) return null;
    var p = addPickup(x + (Math.random() - 0.5), z + (Math.random() - 0.5), type, false);
    if (amount) { p.amount = amount; p.ttl = 90; }
    return p;
  }

  function updatePickups(dt) {
    var ps = GAME.world.pickups;
    for (var i = ps.length - 1; i >= 0; i--) {
      var p = ps[i];
      if (p.taken) {
        p.respawnT -= dt;
        if (p.respawnT <= 0) { p.taken = false; p.mesh.visible = true; }
        continue;
      }
      if (!p.fixed) {
        p.ttl -= dt;
        if (p.ttl <= 0) { GAME.scene.remove(p.mesh); disposeTree(p.mesh); ps.splice(i, 1); continue; }
      }
      if (U.dist2(p.pos.x, p.pos.z, GAME.player.pos.x, GAME.player.pos.z) < 90 * 90) {
        p.mesh.rotation.y += dt * 2.4;
        p.mesh.children[0].position.y = 0.1 + 0.1 * Math.sin(GAME.time * 3 + i);
      }
    }
  }

  var PICKUP_AMMO = { pistol: 24, smg: 50, rifle: 20, shotgun: 10, grenade: 5, molotov: 5, sniper: 10, rocket: 4 };
  function checkPickups() {
    var P = GAME.player;
    var ps = GAME.world.pickups;
    for (var i = ps.length - 1; i >= 0; i--) {
      var p = ps[i];
      if (p.taken) continue;
      if (U.dist2(p.pos.x, p.pos.z, P.pos.x, P.pos.z) > 1.9) continue;
      // and on the same level: a pickup on a terrace is not collectable from
      // the pavement underneath it
      if (Math.abs(p.pos.y - (P.pos.y + 1)) > 3) continue;
      var label = PICKUP_DEFS[p.type].label;
      if (p.type === 'health') { if (P.health >= 100) continue; P.health = Math.min(100, P.health + 50); }
      else if (p.type === 'armor') { if (P.armor >= 100) continue; P.armor = Math.min(100, P.armor + 50); }
      else if (p.type === 'cash') { var amt = p.amount || 10 + Math.floor(Math.random() * 30); GAME.addCash(amt); label = '$' + amt; }
      else giveWeapon(p.type, PICKUP_AMMO[p.type] || 10);
      GAME.audio.pickup();
      GAME.haptics.pickup();
      GAME.hud.message(label, 1.2);
      // Off the street means off the street: a fixed pickup stays gone for a
      // full in-game day (one whole day/night cycle). The old 45 seconds made
      // every gun rack an infinite free-ammo glitch and the shops pointless.
      if (p.fixed) { p.taken = true; p.respawnT = GAME.DAY_SECONDS || 150; p.mesh.visible = false; }
      else { GAME.scene.remove(p.mesh); disposeTree(p.mesh); ps.splice(i, 1); }
    }
  }

  // shots fired by police at the player
  // An officer is not a turret. What decides whether a round lands is where
  // the round actually WENT — the same yaw the tracer is drawn along — and not
  // a dice roll taken beside it. That disconnect was the whole of the problem:
  // the shot you watched fly wide still hurt you, the one drawn straight
  // through you might not, and because the roll was a flat constant the hit
  // rate was the same at five metres and at forty, standing still or at a
  // sprint. Nothing you did changed it, so it read as a tax rather than as
  // somebody shooting at you.
  //
  // Everything that should make a marksman worse widens the cone instead.
  var CAR_ROUND = 0.35;   // share of a round's damage the player's car takes
  var NPC_AIM = {
    base: 0.09,        // rad — a settled shooter at arm's length, about 5 degrees
    perMetre: 0.0032,  // range: a pistol at forty metres is a different proposition
    moving: 0.085,     // a target at speed has to be led, and they lead it badly
    fresh: 0.07,       // the first shot of a burst, before they have settled on you
    torso: 0.5,        // half-width of a person...
    car: 1.15          // ...and of the car they might be sitting in
  };
  // `victim` is who is being shot at: a ped, or omitted for the player. The
  // aim model, the tracer and the hit test are the same either way — a round
  // does not care whose gun it left — but who takes the damage, how wide the
  // target is, and whether the shot is a crime all follow from it.
  function npcShoot(fromX, fromY, fromZ, accuracy, damage, shooter, victim) {
    var P = GAME.player;
    var atPlayer = !victim;
    if (victim && (victim.dead || victim.gone)) return false;
    var inCar = atPlayer && !!(P.inCar && P.car);
    var tx = atPlayer ? (inCar ? P.car.pos.x : P.pos.x) : victim.pos.x;
    var tz = atPlayer ? (inCar ? P.car.pos.z : P.pos.z) : victim.pos.z;
    var ty = (atPlayer ? (inCar ? P.car.pos.y : P.pos.y) : victim.pos.y) + 1.2;
    var d = U.dist(fromX, fromZ, tx, tz);

    // Officers are individuals. One spawns a better shot than the next and
    // stays that way for the whole chase, rather than being re-rolled at every
    // trigger pull — without it a roadblock is four copies of the same machine.
    if (shooter && isNaN(shooter.aimSkill)) shooter.aimSkill = 0.78 + Math.random() * 0.5;
    var skill = (shooter ? shooter.aimSkill : 1) * (1.35 - U.clamp(accuracy, 0, 1));
    // brought the gun up just now, or has been firing at you for a while?
    var fresh = !shooter || GAME.time - (shooter.lastShotT || -99) > 2.5;
    if (shooter) shooter.lastShotT = GAME.time;

    var speed = atPlayer ? (inCar ? Math.abs(P.car.speed || 0) : (P.moveSpeed || 0))
      : Math.abs(victim.speed || 0);
    var spread = (NPC_AIM.base
      + d * NPC_AIM.perMetre
      + Math.min(1, speed / 11) * NPC_AIM.moving
      + (fresh ? NPC_AIM.fresh : 0)) * skill;

    var err = (Math.random() * 2 - 1) * spread;
    var yaw = Math.atan2(tx - fromX, tz - fromZ) + err;
    var dx = Math.sin(yaw), dz = Math.cos(yaw);
    GAME.audio.gunshot('pistol', fromX, fromZ);
    // A car in the line takes the round. Only buildings ever stopped these,
    // so the police shot straight through the van you were crouched behind —
    // a quarter of their rounds at twelve metres — while yours stopped dead on
    // the same van. The shooter's own car and the one you are in don't count,
    // and nor does anything well above or below the shooter (a helicopter
    // passing over, a car on the deck overhead).
    var sy = shooter && shooter.pos ? shooter.pos.y : 0;
    var stop = d, cars = GAME.world.cars;
    for (var ci = 0; ci < cars.length; ci++) {
      var cv = cars[ci];
      if (cv === shooter || cv.sinking || (inCar && cv === P.car)) continue;
      if (Math.abs(cv.pos.y - sy) > 2.5) continue;
      var tc = rayCarBody(fromX, fromZ, dx, dz, cv);
      if (tc >= 0 && tc < stop) stop = tc;
    }
    // to wherever it stopped, at the height it had got to on the way there
    // (up at a roof edge, down from a deck), not at a fixed 1.2 m off sea level
    GAME.fx.tracer(fromX, fromY, fromZ, fromX + dx * stop, fromY + (ty - fromY) * (stop / (d || 1)), fromZ + dz * stop);
    if (stop < d - 0.3) return false;
    // how far off it passes at your range, against how wide you are: what you
    // saw happen is now what happened
    if (Math.abs(Math.sin(err)) * d <= (inCar ? NPC_AIM.car : NPC_AIM.torso)) {
      if (!atPlayer) GAME.peds.damage(victim, damage, false, shooter);
      // A car is cover you are sitting in. Rounds did 70% of their damage to
      // the bodywork, which took a sports car apart in fifteen seconds of a
      // three-star chase — gone before any getaway could begin. Half that.
      else if (inCar) { GAME.vehicles.damageCar(P.car, damage * CAR_ROUND, 'cop'); GAME.hud.hitFrom(fromX, fromZ); }
      else GAME.playerDamage(damage, 'shot', fromX, fromZ);
      return true;
    }
    return false;
  }

  return {
    WEAPONS: WEAPONS,
    get aiming() { return aiming; },
    get lockTarget() { return lockTarget; },
    update: update,
    updatePickups: updatePickups,
    checkPickups: checkPickups,
    initPickups: initPickups,
    giveWeapon: giveWeapon,
    giveAllWeapons: giveAllWeapons,
    FULL_LOAD: FULL_LOAD,
    selectWeapon: selectWeapon,
    select: selectWeapon,
    cycle: cycle,
    melee: punch,
    dropPickup: dropPickup,
    pickupShape: pickupShape,
    refreshWeaponHud: refreshWeaponHud,
    npcShoot: npcShoot,
    setAimTouch: function (on) { GAME.input.touch.aim = on; }
  };
})();
