// What combat.js fires, past the guns: the weapon wheel, the icons it shows,
// things you throw, a rocket, a fire, a scope, and the bang at the end of it.
//
// Every icon is a little SVG drawn here, in the HUD's neon — nothing is
// loaded. The wheel is Vice City's slots laid out in a ring: fists, a melee
// weapon, something to throw, then the guns from pistol up to the rocket
// launcher, one weapon a slot (pick up a katana and the bat goes, as it did).
// Hold the wheel key — Z, D-pad down, or WPN on a touchscreen — and the world
// slows while you point at one; a quick tap still steps to the next weapon.
GAME.arsenal = (function () {
  // ---------- the icons ----------
  var INK = '#1a0c2a';
  var KIND_COL = { melee: '#ffd24a', gun: '#8dffd8', thrown: '#ff8a3d', heavy: '#ff6fb8' };
  var SHAPES = {
    fist: '<rect x="15" y="21" width="30" height="25" rx="8"/><rect x="40" y="27" width="11" height="14" rx="5"/>' +
      '<path d="M23 21v11M30 21v11M37 21v11" fill="none" stroke="' + INK + '" stroke-width="2"/>',
    bat: '<path d="M11 51l4 4 40-38c3-3 1-9-4-9-2 0-4 1-5 3z"/><circle cx="12" cy="54" r="4"/>',
    knife: '<path d="M18 46l22-22c8-8 14-12 18-13-1 5-5 11-13 19L23 51z" fill="#e8f0ff"/><path d="M9 55l9-9 5 5-9 9z"/>',
    katana: '<path d="M20 42L54 9l2 2-33 34z" fill="#e8f0ff"/><ellipse cx="20" cy="45" rx="7" ry="3" transform="rotate(-45 20 45)"/><path d="M7 56l11-10 2 2-10 11z"/>',
    chainsaw: '<rect x="6" y="28" width="22" height="20" rx="3"/><path d="M28 33h26a5 5 0 010 10H28z" fill="#e8f0ff"/>' +
      '<path d="M30 31h24M30 45h24" fill="none" stroke="' + INK + '" stroke-width="2" stroke-dasharray="2 3"/><path d="M10 28c0-8 14-8 14 0" fill="none" stroke-width="3"/>',
    grenade: '<ellipse cx="30" cy="39" rx="14" ry="16"/><rect x="25" y="17" width="10" height="7" rx="1"/><path d="M35 19l10 4" fill="none" stroke-width="3"/>' +
      '<circle cx="47" cy="17" r="4" fill="none" stroke-width="2"/><path d="M17 39h26M30 24v30" fill="none" stroke="' + INK + '" stroke-width="1.6"/>',
    molotov: '<path d="M25 57h14V33c0-5-3-8-4-10v-7h-6v7c-1 2-4 5-4 10z"/><path d="M30 15c-2-7 6-9 6-14 4 5 6 12-2 15z" fill="#ff5a2a"/>' +
      '<rect x="27" y="38" width="10" height="9" fill="#fff4c0" stroke="none"/>',
    pistol: '<path d="M8 21h42v10H27l-4 19H12l4-19H8z"/>',
    smg: '<path d="M5 23h45v8h8v6H32l-2 6h5l-2 14h-8l2-14h-3l-4-6H5z"/><rect x="40" y="37" width="6" height="14"/>',
    shotgun: '<rect x="18" y="24" width="42" height="6"/><rect x="26" y="31" width="20" height="5"/><path d="M4 25h16v11L8 44H3z"/>',
    rifle: '<rect x="20" y="25" width="40" height="5"/><path d="M4 26h20v9l-6 3v8h-6v-7H3z"/><rect x="26" y="30" width="7" height="12"/>',
    sniper: '<rect x="20" y="28" width="42" height="4"/><path d="M4 28h20v8l-6 3v9h-6v-8H3z"/><rect x="18" y="19" width="18" height="6" rx="2"/><rect x="26" y="32" width="5" height="10"/>',
    rocket: '<rect x="6" y="25" width="46" height="11" rx="2"/><path d="M52 23l9 7.5-9 7.5z"/><rect x="18" y="36" width="6" height="12"/><rect x="32" y="36" width="5" height="8"/>'
  };
  function icon(w) {
    var wd = WEAPONS[w];
    if (!wd || !SHAPES[w]) return '';
    var col = KIND_COL[wd.melee ? 'melee' : wd.thrown ? 'thrown' : wd.heavy ? 'heavy' : w === 'fist' ? 'melee' : 'gun'];
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" class="wicon"><g fill="' + col + '" stroke="' + col + '" stroke-linejoin="round">' +
      '<g stroke="' + INK + '" stroke-width="2.4">' + SHAPES[w] + '</g></g></svg>';
  }

  // ---------- the bang ----------
  // A grenade, a rocket, anything that goes off: the flash, the sound, the
  // shake, and everything inside `rad` hurt by how close it was — cars, the
  // people in the street, and you, if you threw it too short.
  function blast(x, y, z, rad, dmg, from) {
    GAME.audio.explosion(x, z);
    GAME.fx.flash(x, y + 1, z, 9);
    GAME.fx.spawn(x, y + 0.8, z, { count: 28, color: 0xff9030, spread: rad * 0.7, vy: 5, life: 0.9, grav: -2 });
    GAME.fx.spawn(x, y + 1.2, z, { count: 14, color: 0x333333, spread: rad * 0.5, vy: 3, life: 1.4, grav: -0.5 });
    var P = GAME.player, f = GAME.focus();
    // (yours, unless it came out of somebody else's gun: the army's tank)
    var mine = !from || (P.inCar && from === P.car);
    var pd = Math.sqrt(U.dist2(f.x, f.z, x, z));
    GAME.cameraShake = Math.max(GAME.cameraShake || 0, U.clamp(1 - pd / 40, 0, 0.8));
    if (GAME.haptics && pd < 30) GAME.haptics.blast(1 - pd / 30);
    var cars = GAME.world.cars;
    for (var i = 0; i < cars.length; i++) {
      var c = cars[i];
      if (c.dead || c === from) continue;
      var cd = Math.sqrt(U.dist2(c.pos.x, c.pos.z, x, z));
      if (cd > rad || Math.abs(c.pos.y - y) > 6) continue;
      GAME.vehicles.throwRider(c);
      GAME.vehicles.damageCar(c, dmg * (1.4 - cd / rad), 'shot', mine);
      if (mine && c.isPolice && !c.mission) GAME.police.reportCrime('hit_cop_car', P.pos);
    }
    var peds = GAME.world.peds;
    for (var j = 0; j < peds.length; j++) {
      var q = peds[j];
      if (q.dead) continue;
      var qd = Math.sqrt(U.dist2(q.pos.x, q.pos.z, x, z));
      if (qd > rad || Math.abs(q.pos.y - y) > 5) continue;
      if (qd < rad * 0.55) GAME.peds.kill(q, 'explosion', mine);
      else GAME.peds.damage(q, dmg * (1 - qd / rad), mine);
    }
    if (!(P.inCar && P.car && P.car.dead)) {
      var my = P.inCar && P.car ? P.car : null;
      if (my && pd < rad) GAME.vehicles.damageCar(my, dmg * (1.2 - pd / rad), 'shot');
      else if (!my && pd < rad && Math.abs(P.pos.y - y) < 5) GAME.playerDamage(Math.round(dmg * 0.6 * (1 - pd / rad)), 'explosion', x, z);
    }
    GAME.peds.panic(x, z, 45);
    if (mine) { GAME.police.noteGunfire({ x: x, z: z }); GAME.missions.notifyChaos(60); }
  }

  // ---------- what you throw, and what you fire ----------
  var shots = [], fires = [];
  var GRAV = 20, GREN_FUSE = 2.3, GREN_R = 7.5, GREN_DMG = 130, ROCKET_SPEED = 46, ROCKET_R = 8, ROCKET_DMG = 160;
  var FIRE_LIFE = 6, FIRE_R = 3.6;
  function shotMesh(kind) {
    var g = new THREE.Group();
    if (kind === 'grenade') {
      g.add(new THREE.Mesh(sharedBoxGeo(0.18, 0.22, 0.18), sharedLambert(0x3a5a2a)));
    } else if (kind === 'molotov') {
      g.add(new THREE.Mesh(sharedBoxGeo(0.12, 0.3, 0.12), sharedLambert(0x3a7a4a)));
      var rag = new THREE.Mesh(sharedBoxGeo(0.08, 0.1, 0.08), sharedBasic(0xff7a2a));
      rag.position.y = 0.2; g.add(rag);
    } else {
      var body = new THREE.Mesh(sharedBoxGeo(0.16, 0.16, 0.7), sharedLambert(0x5a6a3a));
      g.add(body);
      var tip = new THREE.Mesh(sharedBoxGeo(0.1, 0.1, 0.18), sharedBasic(0xffd24a));
      tip.position.z = 0.42; g.add(tip);
    }
    GAME.scene.add(g);
    return g;
  }
  // where a thrown thing should land: the target you are locked on, or
  // eighteen metres ahead along the camera
  function landing(yaw, target) {
    var P = GAME.player;
    if (target && !target.dead) return { x: target.pos.x, y: target.pos.y, z: target.pos.z };
    var d = 18;
    var x = P.pos.x + Math.sin(yaw) * d, z = P.pos.z + Math.cos(yaw) * d;
    return { x: x, y: GAME.city.groundY(x, z), z: z };
  }
  function throwIt(kind, yaw, target) {
    var P = GAME.player, at = landing(yaw, target);
    var ox = P.pos.x + Math.sin(yaw) * 0.5, oy = P.pos.y + 1.7, oz = P.pos.z + Math.cos(yaw) * 0.5;
    var dx = at.x - ox, dz = at.z - oz, dh = Math.sqrt(dx * dx + dz * dz);
    var T = U.clamp(dh / 17, 0.35, 1.25);
    var s = { kind: kind, x: ox, y: oy, z: oz, vx: dx / T, vz: dz / T, vy: (at.y + 0.3 - oy + 0.5 * GRAV * T * T) / T, t: 0, mesh: shotMesh(kind) };
    shots.push(s);
    P.punchT = 0.26;          // the throwing arm (player.js swings it like a punch)
    GAME.audio.whoosh(0.5);
    return s;
  }
  function fireRocket(yaw, target) {
    var P = GAME.player;
    var ox = P.pos.x + Math.sin(yaw) * 0.8, oy = P.pos.y + 1.5, oz = P.pos.z + Math.cos(yaw) * 0.8;
    var dy = 0;
    if (target && !target.dead) {
      var td = Math.sqrt(U.dist2(target.pos.x, target.pos.z, ox, oz)) || 1;
      dy = (target.pos.y + 0.9 - oy) / td;
    } else dy = -Math.tan(GAME.cam.pitch - 0.25) * 0.35;
    var len = Math.sqrt(1 + dy * dy);
    var s = { kind: 'rocket', x: ox, y: oy, z: oz, vx: Math.sin(yaw) / len * ROCKET_SPEED, vz: Math.cos(yaw) / len * ROCKET_SPEED,
      vy: dy / len * ROCKET_SPEED, t: 0, mesh: shotMesh('rocket') };
    shots.push(s);
    GAME.audio.gunshot('rocket');
    GAME.fx.flash(ox, oy, oz, 3);
    GAME.police.noteGunfire(P.pos);
    GAME.peds.panic(P.pos.x, P.pos.z, 30);
    return s;
  }
  // a shell from somewhere else — the tank's gun (army.js): out of the
  // muzzle along a yaw and a climb, bursting like a rocket, a bigger one
  function fireShell(x, y, z, yaw, dy, from, big) {
    var len = Math.sqrt(1 + dy * dy), sp = 60;
    var s = { kind: 'rocket', x: x, y: y, z: z, vx: Math.sin(yaw) / len * sp, vz: Math.cos(yaw) / len * sp, vy: dy / len * sp,
      t: 0, mesh: shotMesh('rocket'), from: from || null, r: big ? 9 : ROCKET_R, dmg: big ? 220 : ROCKET_DMG };
    shots.push(s);
    GAME.audio.gunshot('rocket', x, z);
    GAME.fx.flash(x, y, z, 4);
    GAME.cameraShake = Math.max(GAME.cameraShake || 0, 0.25);
    return s;
  }
  var FX_TRAIL = { count: 1, color: 0xffd080, spread: 0.12, life: 0.2 };
  var FX_SMOKE = { count: 1, color: 0x8a8a90, spread: 0.2, life: 0.5, vy: 0.6 };
  function stepShots(dt) {
    var C = GAME.city;
    for (var i = shots.length - 1; i >= 0; i--) {
      var s = shots[i];
      s.t += dt;
      var nx = s.x + s.vx * dt, nz = s.z + s.vz * dt, ny = s.y + s.vy * dt;
      if (s.kind !== 'rocket') s.vy -= GRAV * dt;
      // a wall in the way: a rocket and a bottle stop there, a grenade bounces off
      var wall = !C.hash.segmentClear(s.x, s.z, nx, nz, s.y);
      var gy = C.surfaceY(nx, nz, s.y + 0.5);
      var down = ny <= gy + 0.1;
      var hit = s.kind !== 'grenade' && s.t > 0.08 && touching(nx, ny, nz, s.kind === 'rocket' ? 1.8 : 0.9, s.from);
      if (s.kind === 'grenade') {
        // (off a wall, or off the side of a car)
        if (wall || (s.t > 0.1 && touching(nx, ny, nz, 0.6))) { s.vx *= -0.4; s.vz *= -0.4; nx = s.x; nz = s.z; }
        if (down) {
          ny = gy + 0.1;
          if (s.vy < -2) GAME.audio.tick(nx, nz);
          s.vy = Math.abs(s.vy) > 2 ? -s.vy * 0.35 : 0;
          s.vx *= 0.6; s.vz *= 0.6;
        }
      }
      s.x = nx; s.y = ny; s.z = nz;
      s.mesh.position.set(nx, ny, nz);
      if (s.kind === 'rocket') {
        s.mesh.rotation.y = Math.atan2(s.vx, s.vz);
        GAME.fx.spawn(nx, ny, nz, FX_TRAIL);
        if (GAME.frame % 2 === 0) GAME.fx.spawn(nx, ny, nz, FX_SMOKE);
      } else s.mesh.rotation.x += dt * 9;
      var end = false;
      if (s.kind === 'grenade' && s.t >= GREN_FUSE) { blast(s.x, s.y, s.z, GREN_R, GREN_DMG); end = true; }
      else if (s.kind === 'molotov' && (down || wall || hit || s.t > 3)) { light(s.x, Math.max(gy, s.y - 0.2), s.z); end = true; }
      else if (s.kind === 'rocket' && (down || wall || hit || s.t > 4)) { blast(s.x, Math.max(gy, s.y), s.z, s.r || ROCKET_R, s.dmg || ROCKET_DMG, s.from); end = true; }
      if (end) {
        GAME.scene.remove(s.mesh);
        shots.splice(i, 1);
      }
    }
  }
  // anything solid in the air there: a car body or a person
  function touching(x, y, z, r, from) {
    var cars = GAME.world.cars, P = GAME.player;
    for (var i = 0; i < cars.length; i++) {
      var c = cars[i];
      if (c.dead || c === (from || P.car) || Math.abs(c.pos.y + 0.8 - y) > 1.6) continue;
      if (U.dist2(c.pos.x, c.pos.z, x, z) < (c.radius * 0.8 + r * 0.3) * (c.radius * 0.8 + r * 0.3)) return true;
    }
    var peds = GAME.world.peds;
    for (var j = 0; j < peds.length; j++) {
      var q = peds[j];
      if (q.dead || Math.abs(q.pos.y + 1 - y) > 1.2) continue;
      if (U.dist2(q.pos.x, q.pos.z, x, z) < r * r * 0.5) return true;
    }
    return false;
  }

  // ---------- fire ----------
  // A Molotov breaks and the ground burns for a few seconds: anybody stood
  // in it is hurt and runs, a car in it catches, and you are not immune.
  var flameGeo = null, flameMat = null;
  function light(x, y, z) {
    GAME.audio.glass(x, z);
    if (!flameGeo) {
      flameGeo = new THREE.CircleGeometry(FIRE_R, 18); flameGeo.userData.shared = true;
      flameMat = new THREE.MeshBasicMaterial({ color: 0xff6a1a, transparent: true, opacity: 0.55, depthWrite: false });
      flameMat.userData.shared = true;
    }
    var m = new THREE.Mesh(flameGeo, flameMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y + 0.06, z);
    GAME.scene.add(m);
    fires.push({ x: x, y: y, z: z, t: 0, hurtT: 0, mesh: m });
    GAME.police.noteGunfire({ x: x, z: z });
    GAME.peds.panic(x, z, 25);
    GAME.missions.notifyChaos(40);
  }
  var FX_FLAME = { count: 2, color: 0xff8a2a, spread: FIRE_R * 0.8, vy: 2.5, life: 0.45, grav: -1 };
  function stepFires(dt) {
    var P = GAME.player;
    for (var i = fires.length - 1; i >= 0; i--) {
      var F = fires[i];
      F.t += dt;
      F.mesh.scale.setScalar(Math.min(1, F.t * 4) * (1 - Math.max(0, F.t - FIRE_LIFE + 1)));
      GAME.fx.spawn(F.x, F.y + 0.3, F.z, FX_FLAME);
      if (GAME.frame % 20 === 0) GAME.audio.crackle(F.x, F.z);
      F.hurtT -= dt;
      if (F.hurtT <= 0) {
        F.hurtT = 0.5;
        var peds = GAME.world.peds;
        for (var j = 0; j < peds.length; j++) {
          var q = peds[j];
          if (q.dead || U.dist2(q.pos.x, q.pos.z, F.x, F.z) > FIRE_R * FIRE_R || Math.abs(q.pos.y - F.y) > 2) continue;
          GAME.peds.damage(q, 16, true);
        }
        var cars = GAME.world.cars;
        for (var k = 0; k < cars.length; k++) {
          var c = cars[k];
          if (c.dead || U.dist2(c.pos.x, c.pos.z, F.x, F.z) > FIRE_R * FIRE_R) continue;
          GAME.vehicles.damageCar(c, 14, 'shot', true);
        }
        if (!P.inCar && U.dist2(P.pos.x, P.pos.z, F.x, F.z) < FIRE_R * FIRE_R && Math.abs(P.pos.y - F.y) < 2) GAME.playerDamage(8, 'fire', F.x, F.z);
      }
      if (F.t >= FIRE_LIFE) { GAME.scene.remove(F.mesh); fires.splice(i, 1); }
    }
  }

  // ---------- the scope ----------
  // The sniper rifle, aimed on foot, is your eye down the glass: the view
  // closes to a circle, the mouse slows right down, and the round goes where
  // the crosshair is.
  var scopeOn = false, baseFov = 62, scopePitch = 0;
  function scoped() {
    var P = GAME.player;
    return !!(GAME.combat && GAME.combat.aiming && P.currentWeapon === 'sniper' && !P.inCar && P.state === 'alive');
  }
  // player.js asks this first every tick; true means the camera is done
  function scopeCam(mdx, mdy) {
    var on = scoped(), cam = GAME.cameraObj, P = GAME.player;
    if (on !== scopeOn) {
      scopeOn = on;
      var el = document.getElementById('scope');
      if (el) el.style.display = on ? 'block' : 'none';
      if (on) { baseFov = cam.fov; scopePitch = 0; }
      cam.fov = on ? 13 : baseFov;
      cam.updateProjectionMatrix();
      if (on) P.mesh.visible = false; else if (!P.inCar) P.mesh.visible = true;
    }
    if (!on) return false;
    GAME.cam.yaw -= mdx * 0.0007;
    scopePitch = U.clamp(scopePitch - mdy * 0.0006, -0.5, 0.45);
    var ex = P.pos.x + Math.sin(GAME.cam.yaw) * 0.3, ez = P.pos.z + Math.cos(GAME.cam.yaw) * 0.3, ey = P.pos.y + 1.62;
    cam.position.set(ex, ey, ez);
    cam.lookAt(ex + Math.sin(GAME.cam.yaw) * Math.cos(scopePitch) * 20, ey + Math.sin(scopePitch) * 20, ez + Math.cos(GAME.cam.yaw) * Math.cos(scopePitch) * 20);
    P.heading = GAME.cam.yaw;
    return true;
  }

  // ---------- the wheel ----------
  // Vice City's slots, round a ring. Each slot shows what you carry in it.
  var SLOTS = [
    { id: 'fist', list: ['fist'] },
    { id: 'melee', list: ['bat', 'knife', 'katana', 'chainsaw'] },
    { id: 'thrown', list: ['grenade', 'molotov'] },
    { id: 'pistol', list: ['pistol'] },
    { id: 'shotgun', list: ['shotgun'] },
    { id: 'smg', list: ['smg'] },
    { id: 'rifle', list: ['rifle'] },
    { id: 'sniper', list: ['sniper'] },
    { id: 'heavy', list: ['rocket'] }
  ];
  function owned(w) { var v = GAME.player.weapons[w]; return !!(v && v.have && (w === 'fist' || WEAPONS[w].melee || v.ammo > 0)); }
  function inSlot(slot) {
    for (var i = 0; i < slot.list.length; i++) if (owned(slot.list[i])) return slot.list[i];
    return null;
  }
  var wheelOpen = false, wheelSel = -1, wx = 0, wy = 0, holdT = 0, held = false, built = false;
  function buildWheel() {
    var box = document.getElementById('wheel-ring');
    if (!box || built) return;
    built = true;
    box.innerHTML = '';
    SLOTS.forEach(function (s, i) {
      var a = i / SLOTS.length * Math.PI * 2 - Math.PI / 2;
      var d = document.createElement('div');
      d.className = 'wslot';
      d.style.left = 'calc(50% + ' + Math.round(Math.cos(a) * 128) + 'px)';
      d.style.top = 'calc(50% + ' + Math.round(Math.sin(a) * 128) + 'px)';
      d.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); wheelSel = i; closeWheel(true); });
      box.appendChild(d);
    });
  }
  function paintWheel() {
    var box = document.getElementById('wheel-ring');
    if (!box) return;
    var P = GAME.player;
    SLOTS.forEach(function (s, i) {
      var d = box.children[i], w = inSlot(s);
      if (!d) return;
      var inv = w && P.weapons[w];
      var ammo = !w || w === 'fist' || WEAPONS[w].melee ? '' : GAME.unlimitedAmmo ? '∞' : String(inv.ammo);
      d.innerHTML = w ? icon(w) + '<span>' + ammo + '</span>' : '';
      d.classList.toggle('empty', !w);
      d.classList.toggle('sel', i === wheelSel);
      d.classList.toggle('cur', !!w && w === P.currentWeapon);
    });
    var lbl = document.getElementById('wheel-name'), sw = wheelSel >= 0 ? inSlot(SLOTS[wheelSel]) : P.currentWeapon;
    if (lbl) lbl.textContent = sw ? WEAPONS[sw].name : '—';
  }
  function openWheel() {
    if (wheelOpen) return;
    buildWheel();
    wheelOpen = true; wx = 0; wy = 0;
    wheelSel = -1;
    var cur = GAME.player.currentWeapon;
    SLOTS.forEach(function (s, i) { if (s.list.indexOf(cur) >= 0) wheelSel = i; });
    var el = document.getElementById('weapon-wheel');
    if (el) el.style.display = 'flex';
    GAME.timeScale = 0.25;
    GAME.audio.whoosh(0.2);
    paintWheel();
  }
  function closeWheel(take) {
    if (!wheelOpen) return;
    wheelOpen = false;
    var el = document.getElementById('weapon-wheel');
    if (el) el.style.display = 'none';
    if (GAME.timeScale === 0.25) GAME.timeScale = 1;
    var w = take && wheelSel >= 0 ? inSlot(SLOTS[wheelSel]) : null;
    if (w) GAME.combat.select(w);
  }
  // the mouse (or the right stick, which arrives the same way) points
  function wheelMove(mdx, mdy) {
    wx = U.clamp(wx + mdx, -120, 120); wy = U.clamp(wy + mdy, -120, 120);
    if (wx * wx + wy * wy < 30 * 30) return;
    var a = Math.atan2(wy, wx) + Math.PI / 2;
    var i = Math.round(((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / (Math.PI * 2) * SLOTS.length) % SLOTS.length;
    if (i !== wheelSel && inSlot(SLOTS[i])) { wheelSel = i; GAME.audio.cashTick(); paintWheel(); }
  }
  // Z (or D-pad down, or WPN): a tap steps to the next weapon, a hold is the wheel
  var HOLD = 0.25;
  function stepWheelKey(dt) {
    var T = GAME.input.touch, P = GAME.player;
    var down = GAME.key('KeyZ') || !!T.wpnHeld;
    // (a press that came and went between two ticks is still a tap)
    var tapped = GAME.keyPressed('KeyZ') || !!T.wpnTap;
    T.wpnTap = false;
    if (P.inCar || P.state !== 'alive' || P.swimming || P.interior) { if (wheelOpen) closeWheel(false); held = false; return; }
    if (down) {
      if (!held) { held = true; holdT = 0; }
      holdT += dt / Math.max(0.05, GAME.timeScale);
      if (!wheelOpen && holdT > HOLD) openWheel();
    } else if (held) {
      held = false;
      if (wheelOpen) closeWheel(true);
      else GAME.combat.cycle(1);
    } else if (tapped) GAME.combat.cycle(1);
  }

  function update(dt) {
    stepWheelKey(dt);
    stepShots(dt);
    stepFires(dt);
  }
  // put everything in the air and on fire away (a respawn, the title)
  function clear() {
    shots.forEach(function (s) { GAME.scene.remove(s.mesh); });
    fires.forEach(function (f) { GAME.scene.remove(f.mesh); });
    shots.length = 0; fires.length = 0;
    closeWheel(false);
  }

  return {
    icon: icon,
    blast: blast,
    fireShell: fireShell,
    throwIt: throwIt,
    fireRocket: fireRocket,
    update: update,
    clear: clear,
    scopeCam: scopeCam,
    get scoped() { return scopeOn; },
    get wheelOpen() { return wheelOpen; },
    wheelMove: wheelMove,
    openWheel: openWheel,
    closeWheel: closeWheel,
    get shots() { return shots.length; },
    get fires() { return fires.length; },
    SLOTS: SLOTS,
    inSlot: function (id) { for (var i = 0; i < SLOTS.length; i++) if (SLOTS[i].id === id) return inSlot(SLOTS[i]); return null; }
  };
})();
