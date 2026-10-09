// MINI MAYHEM RACE, a toy-car side job: a ring at
// the gate of Memorial Stadium (landmarks.js), and in it a remote-control
// buggy on the pitch with three others on the grid. Two laps round the
// cones; first past the last gate wins. The camera comes down to the toy's
// level, the clock runs, and if one of theirs gets home first, or yours is
// smashed, or you put the controller down (F), it is over.
GAME.rc = (function () {
  var LAPS = 2, PAY = 800, PAY_AGAIN = 200, RING_R = 2.4;
  // the course on the pitch, in the stadium's own frame (front +z, the gate)
  var COURSE = [[0, 10], [15, 8], [16, -12], [0, -15], [-16, -12], [-15, 8]];
  var ring = null, cpMesh = null, run = null, enabled = true, hint = '', site = null;
  // (after a race the ring waits for you to step off it before it takes you again)
  var armed = true;

  function prefs() { GAME.prefs = GAME.prefs || {}; return GAME.prefs.rc || (GAME.prefs.rc = {}); }
  function stadium() {
    if (site) return site;
    var L = GAME.landmarks && GAME.landmarks.sites();
    var s = L && L.filter(function (x) { return x.id === 'stadium'; })[0];
    if (!s || !s.frame) return null;
    var F = s.frame;
    site = { F: F, ring: F.at(0, 27), back: F.at(3.5, 28.5), grid: F.at(0, 13), cps: [] };
    for (var l = 0; l < LAPS; l++) COURSE.forEach(function (c) { site.cps.push(F.at(c[0], c[1])); });
    site.cps.push(F.at(0, 11));   // and home
    return site;
  }
  function build() {
    var s = stadium();
    if (!s || ring) return;
    var y = GAME.city.groundY(s.ring.x, s.ring.z);
    ring = new THREE.Mesh(new THREE.CylinderGeometry(RING_R, RING_R, 0.18, 22, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x7dff6a, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
    ring.position.set(s.ring.x, y + 0.35, s.ring.z);
    GAME.scene.add(ring);
    cpMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 1.2, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffe14f, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
    cpMesh.visible = false;
    GAME.scene.add(cpMesh);
  }
  function busy() {
    return (GAME.missions && GAME.missions.active) || (GAME.strangers && GAME.strangers.busy) || (GAME.heist && GAME.heist.busy);
  }

  // ---------- the race ----------
  function begin() {
    var s = stadium(), P = GAME.player;
    var h = s.F.yaw + Math.PI;     // facing into the stadium, away from the gate
    var mine = GAME.vehicles.spawnCar('rc', s.grid.x, s.grid.z, h, { color: 0x38e8ff });
    if (!mine) return false;
    run = { car: mine, rivals: [], cp: 0, t: 0, count: 3, state: 'count', back: { x: s.back.x, z: s.back.z }, lastNum: 0 };
    armed = false;
    GAME.seatInCar(mine);
    [[-1.2, -1.4, 0xff4fa3], [1.2, -1.4, 0xffe14f], [0, -2.8, 0xb040ff]].forEach(function (g) {
      var fx = Math.sin(h), fz = Math.cos(h), rx = fz, rz = -fx;
      var x = s.grid.x + fx * g[1] * -1 + rx * g[0], z = s.grid.z + fz * g[1] * -1 + rz * g[0];
      var c = GAME.vehicles.spawnCar('rc', x, z, h, { occupied: 'ai', ai: { mode: 'race' }, mission: true, color: g[2] });
      if (c) { c.cpIndex = 0; c.rcSkill = 0.7 + Math.random() * 0.15; run.rivals.push(c); }
    });
    GAME.hud.missionStart('MINI MAYHEM RACE', 'Two laps round the cones');
    GAME.audio.pickup();
    if (GAME.track) GAME.track('rc-started');
    return true;
  }
  function end(win, why) {
    var r = run, P = GAME.player;
    run = null;
    cpMesh.visible = false;
    GAME.hud.missionEnd();
    GAME.hud.missionTimer && GAME.hud.missionTimer(null);
    if (P.inCar && P.car === r.car) GAME.exitCar();
    GAME.vehicles.removeCar(r.car);
    r.rivals.forEach(function (c) { GAME.vehicles.removeCar(c); });
    // back on your feet at the gate, the controller down
    P.pos.set(r.back.x, GAME.city.groundY(r.back.x, r.back.z), r.back.z);
    P.mesh.visible = true;
    if (win) {
      var pr = prefs(), first = !pr.won, t = Math.round(r.t * 10) / 10;
      var pay = first ? PAY : PAY_AGAIN;
      pr.won = true;
      var best = !pr.best || t < pr.best;
      if (best) pr.best = t;
      GAME.addCash(pay);
      GAME.audio.sting('win');
      GAME.hud.message('RC RACE WON  ·  ' + t.toFixed(1) + 's  ·  +$' + pay + (best ? '  ·  NEW BEST' : ''), 4.5);
      if (GAME.save) GAME.save();
    } else {
      GAME.audio.sting('wasted');
      GAME.hud.message('RC RACE LOST — ' + why, 3.5);
    }
  }
  // the toys steer for the next cone, flat out, and lift for the turns
  function rivalControls(c) {
    var s = site, t = s.cps[c.cpIndex];
    if (!t) return { throttle: 0, steer: 0, handbrake: true };
    var dh = U.wrapPI(Math.atan2(t.x - c.pos.x, t.z - c.pos.z) - c.heading);
    var thr = Math.abs(dh) > 0.9 && c.speed > 6 ? 0.2 : c.rcSkill;
    if (Math.abs(c.speed) < 0.6 && (c.stuckT = (c.stuckT || 0) + 1 / 60) > 1) { c.reverseT = 0.6; c.stuckT = 0; }
    if (c.reverseT > 0) { c.reverseT -= 1 / 60; return { throttle: -0.8, steer: dh > 0 ? -1 : 1, handbrake: false }; }
    return { throttle: thr, steer: U.clamp(dh * 2, -1, 1), handbrake: false };
  }
  function step(dt) {
    var r = run, P = GAME.player, s = site, n = s.cps.length;
    if (P.state !== 'alive') { end(false, 'you went down.'); return; }
    if (r.car.dead || r.car.gone) { end(false, 'your buggy is in bits.'); return; }
    if (!P.inCar || P.car !== r.car) { end(false, 'you put the controller down.'); return; }
    if (r.state === 'count') {
      r.count -= dt;
      r.car.controls.throttle = 0; r.car.speed = 0;
      r.rivals.forEach(function (c) { c.controls = { throttle: 0, steer: 0, handbrake: true }; });
      var num = Math.max(1, Math.ceil(r.count));
      if (num !== r.lastNum) { r.lastNum = num; GAME.audio.cashTick(); }
      GAME.hud.bigCount(r.count > 0 ? num : 'GO!');
      if (r.count <= 0) { r.state = 'run'; GAME.audio.pickup(); }
      return;
    }
    r.t += dt;
    GAME.hud.missionTimer(r.t, false);
    for (var i = 0; i < r.rivals.length; i++) {
      var c = r.rivals[i];
      if (c.dead || c.gone) continue;
      var ct = s.cps[c.cpIndex];
      if (ct && U.dist2(c.pos.x, c.pos.z, ct.x, ct.z) < 2.2 * 2.2) c.cpIndex++;
      if (c.cpIndex >= n) { end(false, 'one of theirs got home first.'); return; }
      c.controls = rivalControls(c);
    }
    var cp = s.cps[r.cp];
    if (U.dist2(r.car.pos.x, r.car.pos.z, cp.x, cp.z) < 2.4 * 2.4) {
      r.cp++;
      GAME.audio.pickup();
      if (r.cp >= n) { end(true); return; }
      cp = s.cps[r.cp];
    }
    cpMesh.visible = true;
    cpMesh.position.set(cp.x, GAME.city.groundY(cp.x, cp.z) + 0.6, cp.z);
    cpMesh.material.opacity = 0.45 + 0.2 * Math.sin(GAME.time * 5);
    var lap = Math.min(LAPS, Math.floor(r.cp / COURSE.length) + 1);
    var place = 1;
    r.rivals.forEach(function (c) { if (c.cpIndex > r.cp) place++; });
    if (GAME.frame % 10 === 0) GAME.hud.missionObjective('Lap ' + lap + ' / ' + LAPS + '   ·   ' + ['1st', '2nd', '3rd', '4th'][place - 1] + ' / 4');
  }

  function update(dt) {
    if (!enabled || !GAME.started) return;
    if (!ring) build();
    if (!ring) return;
    if (run) { hint = ''; step(dt); return; }
    var P = GAME.player, s = site;
    ring.material.opacity = 0.5 + 0.2 * Math.sin(GAME.time * 3);
    var d2 = U.dist2(P.pos.x, P.pos.z, s.ring.x, s.ring.z);
    hint = '';
    if (d2 > (RING_R + 1.5) * (RING_R + 1.5)) armed = true;
    if (P.inCar || P.state !== 'alive' || d2 > 30 * 30) return;
    hint = 'MINI MAYHEM RACE — step into the ring' + (prefs().best ? '  ·  best ' + prefs().best.toFixed(1) + 's' : '');
    if (armed && d2 < RING_R * RING_R && !busy() && GAME.police.wanted === 0) begin();
  }

  return {
    update: update,
    get hint() { return hint; },
    get running() { return run ? { cp: run.cp, state: run.state, rivals: run.rivals.length, t: run.t } : null; },
    get site() { return stadium(); },
    end: function () { if (run) end(false, 'called off'); },
    get enabled() { return enabled; },
    set enabled(v) { enabled = !!v; if (!enabled && run) end(false, 'called off'); }
  };
})();
