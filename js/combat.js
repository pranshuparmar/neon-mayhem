var WEAPONS = {
  fist: { name: 'FISTS', slot: 1, damage: 14, range: 2.0, rate: 0.42, auto: false },
  pistol: { name: 'PISTOL', slot: 2, damage: 26, range: 60, rate: 0.34, auto: false, spread: 0.012 },
  smg: { name: 'SMG', slot: 3, damage: 11, range: 48, rate: 0.085, auto: true, spread: 0.045, driveby: true },
  shotgun: { name: 'SHOTGUN', slot: 4, damage: 11, range: 24, rate: 0.95, auto: false, spread: 0.085, pellets: 7 },
  // The world's only PICKUP for it sits on the observatory terrace on Isla
  // Verde — but the hardware counters sell it over the counter for $5,000
  // (with refills), and the all-25-jumps arsenal includes it. Scarce as a
  // find, not as a purchase.
  rifle: { name: 'RIFLE', slot: 5, damage: 68, range: 150, rate: 0.85, auto: false, spread: 0.002 }
};
var WEAPON_ORDER = ['fist', 'pistol', 'smg', 'shotgun', 'rifle'];

GAME.combat = (function () {
  var aiming = false, lockTarget = null, lockIdx = 0;
  var cooldown = 0, aimToggle = false, aimYawRef = 0, rmbWas = false;
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
  function candidates() {
    var P = GAME.player, cam = GAME.cam;
    var list = [];
    var range = lockRange();
    var eye = P.pos.y + 1.35;
    var peds = GAME.world.peds;
    for (var i = 0; i < peds.length; i++) {
      var t = peds[i];
      if (t.dead) continue;
      var dx = t.pos.x - P.pos.x, dz = t.pos.z - P.pos.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      if (d > range || d < 0.5) continue;
      var ang = Math.abs(U.wrapPI(Math.atan2(dx, dz) - cam.yaw));
      if (ang > 0.75) continue;
      if (!GAME.city.hash.segmentClear(P.pos.x, P.pos.z, t.pos.x, t.pos.z, eye)) continue;
      list.push({ t: t, score: ang * 30 + d });
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
      if (!GAME.city.hash.segmentClear(P.pos.x, P.pos.z, car.pos.x, car.pos.z, eye)) continue;
      // ...except one with a rider out in the open: that is a person too
      list.push({ t: car, score: cang * 30 + cd + (GAME.vehicles.exposedRider(car) ? 0 : 14) });
    }
    list.sort(function (a, b) { return a.score - b.score; });
    return list.map(function (e) { return e.t; });
  }

  function setAiming(on) {
    if (on === aiming) return;
    aiming = on;
    if (on) {
      var c = candidates();
      lockTarget = c.length ? c[0] : null;
      lockIdx = 0;
      aimYawRef = GAME.cam.yaw;
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
    var boxes = GAME.city.hash.query(ox + dirX * bestT / 2, oz + dirZ * bestT / 2, bestT / 2 + 15);
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
          GAME.fx.spawn(hx, 0.8, hz, { count: 3, color: 0xffe0a0, spread: 2, life: 0.3 });
          if (res.hit.obj.isPolice && !res.hit.obj.mission) GAME.police.reportCrime('hit_cop_car', P.pos);
          else if (res.hit.obj.ai && res.hit.obj.ai.mode === 'traffic') GAME.police.reportCrime('shoot_car', P.pos);
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

  function punch() {
    var P = GAME.player;
    P.punchT = 0.26; // drives the swing animation in player.js
    GAME.audio.punch();
    var fx = Math.sin(P.heading), fz = Math.cos(P.heading);
    var px = P.pos.x + fx * 1.2, pz = P.pos.z + fz * 1.2;
    var peds = GAME.world.peds;
    for (var i = 0; i < peds.length; i++) {
      var p = peds[i];
      if (p.dead) continue;
      if (U.dist2(p.pos.x, p.pos.z, px, pz) < 1.7) {
        GAME.peds.damage(p, WEAPONS.fist.damage, true);
        GAME.police.reportCrime('hit_ped', P.pos);
        GAME.missions.notifyChaos(20);
        return;
      }
    }
    var car = GAME.vehicles.findNearestCar(px, pz, 2.2, P.car);
    // a rider is within reach where a driver behind glass is not
    var rider = car && GAME.vehicles.throwRider(car);
    if (rider) {
      GAME.peds.damage(rider, WEAPONS.fist.damage, true);
      GAME.police.reportCrime('hit_ped', P.pos);
      GAME.missions.notifyChaos(20);
      return;
    }
    if (car) {
      GAME.vehicles.damageCar(car, 6, 'fist');
      GAME.fx.spawn(px, 1, pz, { count: 3, color: 0xffe0a0, spread: 1, life: 0.3 });
    }
  }

  function update(dt) {
    var P = GAME.player, inp = GAME.input, T = inp.touch;
    cooldown -= dt;
    if (P.state !== 'alive' || P.entering) { setAiming(false); aimToggle = false; inp.lmbPressed = false; return; }

    // weapon select
    for (var i = 0; i < WEAPON_ORDER.length; i++) {
      if (GAME.keyPressed('Digit' + (i + 1))) selectWeapon(WEAPON_ORDER[i]);
    }
    if (T.weaponCycle) {
      T.weaponCycle = false;
      var have = WEAPON_ORDER.filter(function (w) { return P.weapons[w] && P.weapons[w].have; });
      var idx = have.indexOf(P.currentWeapon);
      selectWeapon(have[(idx + 1) % have.length]);
    }

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
      // The cursor picks the target: swing the camera while locked and the
      // lock re-acquires whatever the hand now points at, instead of staying
      // glued to the first thing it grabbed. A manual Q/E/wheel pick holds
      // until the camera genuinely moves again.
      if (Math.abs(U.wrapPI(GAME.cam.yaw - aimYawRef)) > 0.055) {
        aimYawRef = GAME.cam.yaw;
        var cams = candidates();
        if (cams.length) lockTarget = cams[0];
      }
      var keep = lockRange() + 8;
      if (lockTarget && (lockTarget.dead || U.dist2(lockTarget.pos.x, lockTarget.pos.z, P.pos.x, P.pos.z) > keep * keep)) {
        var c = candidates();
        lockTarget = c.length ? c[0] : null;
      }
      if (!lockTarget && GAME.frame % 20 === 0) {
        var c2 = candidates();
        if (c2.length) lockTarget = c2[0];
      }
    } else {
      inp.wheel = 0;
    }

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
      if (w === 'fist') punch();
      else {
        var yaw;
        if (aiming && lockTarget) {
          yaw = Math.atan2(lockTarget.pos.x - P.pos.x, lockTarget.pos.z - P.pos.z);
          P.heading = yaw;
        } else {
          yaw = GAME.cam.yaw;
          if (aiming) P.heading = yaw;
        }
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

  function giveWeapon(id, ammo) {
    var P = GAME.player;
    if (!WEAPONS[id]) return;
    if (!P.weapons[id]) P.weapons[id] = { have: true, ammo: 0 };
    P.weapons[id].have = true;
    if (id !== 'fist') P.weapons[id].ammo += (ammo || 30);
    P.currentWeapon = id;
    refreshWeaponHud();
  }

  // the full arsenal — unlimited ammo is no use without something to fire it from
  function giveAllWeapons() {
    var P = GAME.player;
    ['pistol', 'smg', 'shotgun', 'rifle'].forEach(function (w) {
      P.weapons[w] = { have: true, ammo: Math.max(999, (P.weapons[w] && P.weapons[w].ammo) || 0) };
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
    GAME.hud.setWeapon(wd.name, P.currentWeapon === 'fist' ? ''
      : GAME.unlimitedAmmo ? '∞'
      : (inv ? inv.ammo : 0));
  }

  // ---------- pickups ----------
  var PICKUP_DEFS = {
    health: { color: 0xff4d6a, label: 'HEALTH' },
    armor: { color: 0x39c8ff, label: 'ARMOR' },
    pistol: { color: 0xd8d8e8, label: 'PISTOL AMMO' },
    smg: { color: 0xffe14f, label: 'SMG AMMO' },
    shotgun: { color: 0xff8a3d, label: 'SHOTGUN AMMO' },
    rifle: { color: 0x8dffd8, label: 'RIFLE' },
    cash: { color: 0x8dffd8, label: 'CASH' }
  };

  // each pickup reads as the thing it gives: a pistol/SMG/shotgun silhouette,
  // a medical cross, a shield, or a cash bundle — instead of a generic cube
  function pickupShape(type, color) {
    color = color || (PICKUP_DEFS[type] ? PICKUP_DEFS[type].color : 0xd8d8e8);
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
    } else { // cash bundle
      b.addBox(0, 0.06, 0, 0.52, 0.10, 0.30, 0, color, 0);
      b.addBox(0, 0.17, 0, 0.50, 0.09, 0.28, 0.16, color, 0);
      b.addBox(0, 0.12, 0, 0.14, 0.24, 0.32, 0, 0x2a6a52, 0);      // paper band
    }
    return new THREE.Mesh(b.build(), new THREE.MeshLambertMaterial({ vertexColors: true, emissive: color, emissiveIntensity: 0.55 }));
  }

  function pickupMesh(type) {
    var def = PICKUP_DEFS[type];
    var g = new THREE.Group();
    var core = pickupShape(type, def.color);
    core.position.y = 0.1;
    g.add(core);
    g.userData.core = core;
    var halo = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.62, 16), new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
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
  function dropPickup(x, z, type) {
    if (GAME.world.pickups.length > 60) return;
    addPickup(x + (Math.random() - 0.5), z + (Math.random() - 0.5), type, false);
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
      else if (p.type === 'cash') { var amt = 10 + Math.floor(Math.random() * 30); GAME.addCash(amt); label = '$' + amt; }
      else giveWeapon(p.type, p.type === 'pistol' ? 24 : p.type === 'smg' ? 50 : p.type === 'rifle' ? 20 : 10);
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
    var d = U.dist(fromX, fromZ, tx, tz);

    // Officers are individuals. One spawns a better shot than the next and
    // stays that way for the whole chase, rather than being re-rolled at every
    // trigger pull — without it a roadblock is four copies of the same machine.
    if (shooter && shooter.aimSkill === undefined) shooter.aimSkill = 0.78 + Math.random() * 0.5;
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
    GAME.fx.tracer(fromX, fromY, fromZ, fromX + dx * d, 1.2, fromZ + dz * d);
    // how far off it passes at your range, against how wide you are: what you
    // saw happen is now what happened
    if (Math.abs(Math.sin(err)) * d <= (inCar ? NPC_AIM.car : NPC_AIM.torso)) {
      if (!atPlayer) GAME.peds.damage(victim, damage, false, shooter);
      else if (inCar) GAME.vehicles.damageCar(P.car, damage * 0.7, 'cop');
      else GAME.playerDamage(damage, 'shot');
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
    selectWeapon: selectWeapon,
    dropPickup: dropPickup,
    pickupShape: pickupShape,
    refreshWeaponHud: refreshWeaponHud,
    npcShoot: npcShoot,
    setAimTouch: function (on) { GAME.input.touch.aim = on; }
  };
})();
