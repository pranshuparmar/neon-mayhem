// THE BIG SCORE. Once the bridges are open and the strip has heard of you,
// Lola wants the Costa Rosa Savings & Loan. It is a job in four parts, each
// its own outing, picked up from her (L, THE BIG SCORE) when you are ready
// for the next, and kept once it is done:
//
//   1. CASE IT     your camera: the front from across the street, and the
//                  vault from inside, as a customer;
//   2. THE EAR     Benny, who can open anything with a dial, from the
//                  marina on Isla Verde to her lock-up by the harbour;
//   3. THE WHEELS  a Vulture GT, a fresh colour on it from the paint shop,
//                  left at the lock-up under a tarp;
//   4. THE JOB     the car out of the lock-up, Benny in it, to the bank. In:
//                  everybody down, Benny on the dial, and you keep the
//                  floor — a teller reaching for the alarm, the guard for
//                  his radio — until the door swings. The bags, and out to
//                  a street about to fill with police (more of them if
//                  anybody got to that alarm). Lose them, and back to the
//                  lock-up to count it.
//
// A job that goes wrong is tried again from that part, not from the camera.
GAME.heist = (function () {
  var PAY = 25000, CRACK = 32, REACH = 4.5;
  var STEPS = ['CASE IT', 'THE EAR', 'THE WHEELS', 'THE JOB'];
  var LOCKUP = { x: -140, z: 206 };
  var job = null, enabled = true, route = null, routeT = 0, ring = null, abandonAsk = 0;
  var bankRoom = null, bankLoc = null, shed = null, benny = null;

  function P() { return GAME.player; }
  function prefs() { GAME.prefs = GAME.prefs || {}; var h = GAME.prefs.heist; if (!h) h = GAME.prefs.heist = { step: 0 }; return h; }
  function step() { return prefs().step || 0; }
  function say(t, s) { GAME.hud.message(t, s || 3.5); }
  function lola(t, s) { GAME.hud.pager('LOLA', t, s || 7); }
  function dist(a, x, z) { return Math.sqrt(U.dist2(a.x, a.z, x, z)); }
  function open() { return !GAME.isla || GAME.isla.isOpen(); }
  // up for it: the bridges open (the strip knows your name by then)
  function offered() { return open() && step() < STEPS.length; }
  function land(car) { return car && !car.spec.boat && !car.spec.heli && !car.spec.plane && !car.spec.bike; }
  function photoKey() { return GAME.isTouch ? '📷' : GAME.controls ? GAME.controls.label('KeyC') : 'C'; }

  // ---------- the places ----------
  function bank() {
    if (!bankLoc && GAME.shops) bankLoc = GAME.shops.locations().filter(function (l) { return l.kind === 'bank'; })[0] || null;
    return bankLoc;
  }
  function room() {
    if (!bankRoom && GAME.interiors) bankRoom = GAME.interiors.rooms().filter(function (r) { return r.shop === 'bank'; })[0] || null;
    return bankRoom;
  }
  function inBank() { var p = P(); return !!p.interior && p.interior === room(); }
  // which way the bank faces: from the road to its door
  function bankFront() {
    var b = bank(), rp = GAME.city.nearestRoadPoint(b.at.x, b.at.z);
    var dx = b.at.x - rp.x, dz = b.at.z - rp.z, dl = Math.hypot(dx, dz) || 1;
    return { x: b.at.x, z: b.at.z, nx: -dx / dl, nz: -dz / dl };   // (nx, nz): out of the door, toward the road
  }
  // a pavement spot near (x, z): off the carriageway, out of the water, clear of walls
  function kerb(x, z) {
    var C = GAME.city;
    for (var r = 0; r < 60; r += 4) {
      for (var a = 0; a < 12; a++) {
        var px = x + Math.cos(a / 12 * Math.PI * 2) * r, pz = z + Math.sin(a / 12 * Math.PI * 2) * r;
        if (C.isInWater(px, pz)) continue;
        var rp = C.nearestRoadPoint(px, pz), rd = Math.sqrt(U.dist2(px, pz, rp.x, rp.z));
        if (rd < 6.6 || rd > 11) continue;
        var boxes = C.hash.query(px, pz, 2), hit = false;
        for (var b = 0; b < boxes.length && !hit; b++) {
          var q = boxes[b];
          if (px > q.minX - 1 && px < q.maxX + 1 && pz > q.minZ - 1 && pz < q.maxZ + 1) hit = true;
        }
        if (!hit) return { x: px, z: pz };
      }
    }
    return { x: x, z: z };   // (where asked: never a road on another landmass)
  }

  // Lola's lock-up: a garage on the harbour road, its roll-up door to the
  // street and a lamp over it. Built at boot, on a lot city.js keeps clear.
  function buildShed() {
    var C = GAME.city, rp = C.nearestRoadPoint(LOCKUP.x, LOCKUP.z);
    var dx = LOCKUP.x - rp.x, dz = LOCKUP.z - rp.z, dl = Math.hypot(dx, dz) || 1;
    var ix = dx / dl, iz = dz / dl;                 // into the shed, away from the road
    var W = 9, D = 7, H = 4.4, cx = LOCKUP.x + ix * (1.2 + D / 2), cz = LOCKUP.z + iz * (1.2 + D / 2);
    var gy = C.groundY(cx, cz), alongX = Math.abs(ix) > 0.5;
    var g = new THREE.Group();
    function piece(x, y, z, w, h, d, col) {
      var m = new THREE.Mesh(sharedBoxGeo(alongX ? d : w, h, alongX ? w : d), sharedBasic(col));
      m.position.set(x, y, z);
      g.add(m);
      return m;
    }
    var fx = LOCKUP.x + ix * 1.2, fz = LOCKUP.z + iz * 1.2;     // the door face
    piece(cx, gy + H / 2, cz, W, H, D, 0x6a625a);                 // the shed
    piece(cx, gy + H + 0.15, cz, W + 0.4, 0.3, D + 0.4, 0x3a342e); // its roof lip
    piece(fx - ix * 0.06, gy + 1.6, fz - iz * 0.06, W - 2.4, 3.2, 0.1, 0x8a8e94);   // the roll-up door
    for (var s = 0; s < 6; s++) piece(fx - ix * 0.12, gy + 0.4 + s * 0.5, fz - iz * 0.12, W - 2.5, 0.05, 0.06, 0x5a5e64);
    piece(fx - ix * 0.14, gy + 3.55, fz - iz * 0.14, 3.2, 0.5, 0.08, 0xe8c86a);    // a painted board over it
    piece(fx - ix * 0.5, gy + 3.9, fz - iz * 0.5, 0.5, 0.25, 0.5, 0xfff0c0);       // the lamp
    GAME.scene.add(g);
    C.addSolid(cx, cz, alongX ? D : W, alongX ? W : D, gy + H);
    shed = { g: g, door: { x: fx, z: fz } };
  }

  // ---------- running a part ----------
  function objective(t) { if (job) { job.obj = t; GAME.hud.missionObjective(t); } }
  function target(x, z) {
    if (!job) return;
    if (x === null) { job.target = null; route = null; if (ring) ring.visible = false; return; }
    if (job.target && job.target[0] === x && job.target[1] === z) return;
    job.target = [x, z]; routeT = 0;
  }
  // The pitch, the first time: a cut to the lock-up, where she says what she
  // has been saving you for (scenes.js). Once said, a second go — after a
  // part that went wrong — goes straight in.
  var PITCH = { id: 'bigscore', shots: [{ set: 'lockup', cast: ['lola', 'you'], lines: [
    ['lola', 'Every job you did for me was practice for this one.'],
    ['you', 'Which one?'],
    ['lola', 'The Costa Rosa Savings & Loan. A Mosler vault, a door nobody ever opened, and twenty-five thousand behind it.'],
    ['you', 'Nobody walks out of a bank with that.'],
    ['lola', 'So we walk in first. Take a camera and case it: the front from across the street, then the vault, as a customer.']] }] };
  // and Benny, the first time he gets in your car: no cut, just his say
  var BENNY = { id: 'benny', shots: [{ set: null, lines: [
    ['benny', 'Lola\'s friend? Nice car. Don\'t talk while I\'m thinking.'],
    ['you', 'I didn\'t say anything.'],
    ['benny', 'You were thinking about it. Drive.']] }] };
  function begin() {
    if (job || !offered()) return false;
    var p = P(), M = GAME.missions;
    if (p.state !== 'alive' || (M && M.active) || (GAME.strangers && GAME.strangers.busy) || GAME.police.wanted > 0) return false;
    var n = step();
    if (n === 0 && !prefs().pitched && GAME.scenes &&
        GAME.scenes.play(PITCH, function () { prefs().pitched = true; GAME.save(); begin(); })) return true;
    job = { step: n, t: 0, phase: '', target: null, bits: [], t0: GAME.time };
    GAME.hud.missionStart('THE BIG SCORE — ' + STEPS[n], '');
    GAME.audio.pickup();
    if (GAME.track) GAME.track('heist-' + n);
    [caseBegin, earBegin, wheelsBegin, jobBegin][n](job);
    return true;
  }
  function tidy() {
    if (!job) return;
    for (var i = 0; i < job.bits.length; i++) {
      var b = job.bits[i];
      if (b.kind === 'car' && !b.o.gone) { b.o.keep = false; b.o.mission = false; }
      else if (b.kind === 'mesh') { GAME.scene.remove(b.o); disposeTree(b.o); }
      else if (b.kind === 'ped' && !b.o.gone && !b.o.dead) GAME.peds.removePed(b.o);
    }
    if (benny) { GAME.scene.remove(benny); benny = null; }
    resetBank();
    GAME.hud.missionEnd();
    GAME.hud.missionTimer && GAME.hud.missionTimer(null);
    target(null);
    job = null;
  }
  function done(line) {
    var n = job.step, s = prefs();
    s.step = n + 1;
    GAME.audio.sting('win');
    if (GAME.haptics && GAME.haptics.win) GAME.haptics.win();
    say('THE BIG SCORE — ' + STEPS[n] + ': DONE' + (line ? '  ·  ' + line : ''), 5);
    GAME.save();
    tidy();
    var next = [
      'Nice pictures. That vault is a Mosler — and the man who can open a Mosler is Benny "the Ear", at the marina on Isla Verde. Call me when you want him.',
      'Benny\'s settled in at the lock-up. He says no getaway car of his is going to be a colour anybody has seen. Call me.',
      'Under the tarp, and pretty. That\'s everything. When you\'re ready — and I mean ready — call me, and we go.'
    ][n];
    if (next) lola(next, 9);
  }
  function fail(reason) {
    GAME.audio.sting('wasted');
    say('THE BIG SCORE — ' + STEPS[job.step] + ' is off: ' + reason + '  ·  call Lola to go again', 4.5);
    tidy();
  }
  function abandon() {
    if (!job) return false;
    abandonAsk = 0;
    fail('you walked away from it');
    return true;
  }

  // ---------- 1. CASE IT ----------
  function caseBegin(j) {
    j.snap0 = GAME.photo ? GAME.photo.lastSnap : 0;
    j.front = false; j.vault = false;
    objective('Two pictures (' + photoKey() + '): the Savings & Loan from across the street, and its vault from inside.');
    var b = bank();
    target(b.at.x, b.at.z);
  }
  function caseStep(j) {
    var snap = GAME.photo ? GAME.photo.lastSnap : 0;
    if (snap === j.snap0) return;
    j.snap0 = snap;
    if (inBank()) {
      // the vault, in the middle of the frame, from this side of the rope
      var R = room().bank, cam = GAME.cameraObj, v = R.vaultFace, d = dist(cam.position, v.x, v.z);
      var fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
      var tx = v.x - cam.position.x, ty = 1.75 - cam.position.y, tz = v.z - cam.position.z, tl = Math.hypot(tx, ty, tz) || 1;
      var dot = (fwd.x * tx + fwd.y * ty + fwd.z * tz) / tl;
      if (d < 13 && dot > 0.85) {
        if (!j.vault) { j.vault = true; say('The vault. Benny will want to see that.', 3); }
      } else say('Not much use — the vault is the round door at the back.', 2.5);
    } else {
      var F = bankFront(), c = GAME.cameraObj.position, cd = dist(c, F.x, F.z), gy = GAME.city.groundY(F.x, F.z);
      if (cd < 12) say('Too close — from across the street.', 2.5);
      else if (cd > 95) say('Too far — she wants the bank, not the block.', 2.5);
      else if (!GAME.inPlainView(F.x + F.nx * 0.8, gy + 5, F.z + F.nz * 0.8)) say('No bank in that one. Try again.', 2.5);
      else if (!j.front) { j.front = true; say('The front. Doors, windows, the way out.', 3); }
    }
    if (j.front && j.vault) done('"Nice pictures," says Lola.');
    else objective(j.front ? 'Now the vault, from inside (' + photoKey() + ') — walk in like a customer.'
      : j.vault ? 'Now the front, from across the street (' + photoKey() + ').'
        : 'Two pictures (' + photoKey() + '): the Savings & Loan from across the street, and its vault from inside.');
  }

  // ---------- 2. THE EAR ----------
  function earBegin(j) {
    // (by the marina gate, on the island road: the marina itself is jetties)
    var M = GAME.city.islaPois.marina;
    j.spot = kerb(M.x + 30, M.z + 8);
    j.phase = 'find';
    objective('Pick up Benny "the Ear" at the marina on Isla Verde — in something with four wheels.');
    target(j.spot.x, j.spot.z);
  }
  function earStep(j, dt) {
    var p = P(), f = GAME.focus();
    if (j.phase === 'find') {
      // he is there when you are near enough to see him
      if (!j.ped && dist(f, j.spot.x, j.spot.z) < 140) {
        var ped = GAME.peds.spawnPed(j.spot.x, j.spot.z, { look: { shirt: 0x6a5a8a, pants: 0x2a2a34, skin: 0xd8a888, hair: 'pompadour', hairCol: 0xc0c0c8 } });
        if (ped) { ped.jobPed = true; ped.state = 'wait'; ped.speed = 0; j.ped = ped; j.bits.push({ kind: 'ped', o: ped }); }
      }
      var car = p.inCar && p.car;
      if (j.ped && car && land(car) && dist(car.pos, j.ped.pos.x, j.ped.pos.z) < 12 && Math.abs(car.speed) < 2) {
        j.phase = 'board'; j.car = car;
        if (!prefs().bennyMet && GAME.scenes && GAME.scenes.play(BENNY)) prefs().bennyMet = true;
        else say('BENNY: "Lola\'s friend? Nice car. Don\'t talk while I\'m thinking."', 3.5);
      } else if (j.ped && car && !land(car) && dist(car.pos, j.ped.pos.x, j.ped.pos.z) < 20 && !j.told) {
        j.told = true; say('BENNY: "In that? Four wheels, kid."', 2.5);
      }
      return;
    }
    if (j.phase === 'board') {
      // he walks to the car and gets in
      var c = j.car, ped2 = j.ped;
      if (!p.inCar || p.car !== c) { j.phase = 'find'; return; }
      var dx = c.pos.x - ped2.pos.x, dz = c.pos.z - ped2.pos.z, dd = Math.hypot(dx, dz);
      if (dd < 2.2) {
        GAME.peds.removePed(ped2); j.ped = null;
        j.phase = 'ride';
        objective('Get Benny to Lola\'s lock-up by the harbour.');
        target(LOCKUP.x, LOCKUP.z);
        return;
      }
      ped2.heading = Math.atan2(dx, dz);
      ped2.pos.x += dx / dd * 3 * dt; ped2.pos.z += dz / dd * 3 * dt;
      ped2.mesh.rotation.y = ped2.heading;
      return;
    }
    if (j.phase === 'ride') {
      var rc = p.inCar && p.car;
      if (rc && dist(rc.pos, LOCKUP.x, LOCKUP.z) < 10 && Math.abs(rc.speed) < 3) done('Benny is at the lock-up.');
      else if (!rc && dist(p.pos, LOCKUP.x, LOCKUP.z) < 6) done('Benny is at the lock-up.');
    }
  }

  // ---------- 3. THE WHEELS ----------
  function wheelsBegin(j) {
    objective('A Vulture GT — the sports car — through the paint shop, then into the lock-up.');
    target(null);
  }
  function nearestSpray(x, z) {
    var D = GAME.city.pois.resprays, best = null, bd = 1e18;
    for (var i = 0; i < D.length; i++) {
      var d = U.dist2(x, z, D[i].door.x, D[i].door.z);
      if (d < bd) { bd = d; best = D[i].door; }
    }
    return best;
  }
  function wheelsStep(j) {
    var p = P(), car = p.inCar && p.car;
    if (!car) {
      if (j.phase !== 'foot') { j.phase = 'foot'; objective('A Vulture GT — the sports car — through the paint shop, then into the lock-up.'); target(null); }
      return;
    }
    if (car.type !== 'sports') {
      if (j.phase !== 'wrong') { j.phase = 'wrong'; objective('Not that. A Vulture GT — the sports car.'); target(null); }
      return;
    }
    var fresh = car.resprayT >= j.t0;
    if (!fresh) {
      if (j.phase !== 'paint') {
        j.phase = 'paint';
        var sp = nearestSpray(car.pos.x, car.pos.z);
        objective('That\'ll do. Now a fresh colour on it — the paint shop.');
        if (sp) target(sp.x, sp.z);
      }
      return;
    }
    if (j.phase !== 'home') { j.phase = 'home'; objective('Fresh paint. Into the lock-up with it.'); target(LOCKUP.x, LOCKUP.z); }
    if (dist(car.pos, LOCKUP.x, LOCKUP.z) < 9 && Math.abs(car.speed) < 2) {
      prefs().car = { type: car.type, color: car.color };
      GAME.exitCar();
      // and it does: a tarp where it stood (it used to blink out of the
      // street in front of you), till you are well off
      coverUp(car);
      GAME.vehicles.removeCar(car);
      done('It goes under a tarp.');
    }
  }

  // ---------- 4. THE JOB ----------
  function jobBegin(j) {
    j.phase = 'lockup';
    objective('To the lock-up: the car and Benny are waiting.');
    target(LOCKUP.x, LOCKUP.z);
  }
  function spawnRide(j) {
    var C = GAME.city, rp = C.nearestRoadPoint(LOCKUP.x, LOCKUP.z), k = prefs().car || { type: 'sports', color: 0x1c1c26 };
    var h = Math.atan2(rp.x - LOCKUP.x, rp.z - LOCKUP.z);
    var car = GAME.vehicles.spawnCar(k.type, LOCKUP.x + (rp.x - LOCKUP.x) * 0.3, LOCKUP.z + (rp.z - LOCKUP.z) * 0.3, h, { color: k.color });
    if (!car) return null;
    car.keep = true; car.mission = true;
    j.bits.push({ kind: 'car', o: car });
    return car;
  }
  function jobStep(j, dt) {
    var p = P(), f = GAME.focus(), b = bank();
    if (j.phase === 'lockup') {
      if (!j.car && dist(f, LOCKUP.x, LOCKUP.z) < 60) j.car = spawnRide(j);
      if (j.car && p.inCar && p.car === j.car) {
        j.phase = 'drive';
        say('BENNY: "Bags are in the back. So am I. Drive normal."', 3);
        objective('To the Savings & Loan. Park out front.');
        target(b.at.x, b.at.z);
      } else if (j.car && dist(f, LOCKUP.x, LOCKUP.z) < 30) objective('Get in. Benny\'s in the back.');
      return;
    }
    if (j.car && (j.car.dead || j.car.gone) && (j.phase === 'drive' || j.phase === 'lockup')) return fail('the car is gone, and Benny with it.');
    if (j.phase === 'drive' || j.phase === 'walk') {
      var c = j.car;
      // (parked out front or not, through the door is through the door)
      if (inBank()) { holdUp(j); return; }
      if (j.phase === 'drive' && p.inCar && p.car === c && dist(c.pos, b.at.x, b.at.z) < 16 && Math.abs(c.speed) < 2) {
        j.phase = 'walk';
        objective('Out, and in through the door. Benny\'s behind you.');
      }
      return;
    }
    if (j.phase === 'floor' || j.phase === 'bags') { floorStep(j, dt); return; }
    if (j.phase === 'out') {
      if (inBank()) return;
      // out the door: the street, and what is coming down it
      j.phase = 'run';
      GAME.police.setWanted(j.alarm ? 4 : 3);
      say(j.alarm ? 'They were waiting for you. GO!' : 'The alarm\'s ringing all down the strip. GO!', 3);
      objective('Lose the heat, then back to the lock-up.');
      target(LOCKUP.x, LOCKUP.z);
      return;
    }
    if (j.phase === 'run') {
      var hot = GAME.police.wanted > 0;
      if (GAME.frame % 20 === 0) objective(hot ? 'Lose the heat, then back to the lock-up.' : 'Clean. Back to the lock-up.');
      if (!hot && dist(f, LOCKUP.x, LOCKUP.z) < 12) payday(j);
    }
  }
  // In through the door: everybody down. Hands go up behind the counter and
  // in the line, Benny is at the dial, and the clock starts.
  function holdUp(j) {
    var R = room().bank;
    j.phase = 'floor'; j.crack = CRACK; j.alarm = false; j.reach = null;
    j.inT = GAME.time;
    // three tries for the alarm, at different times, by different people
    var who = [R.tellers[0], R.tellers[1], R.tellers[2], R.guard].sort(function () { return Math.random() - 0.5; }).slice(0, 3);
    j.events = who.map(function (fig, k) { return { at: 5 + k * 8 + Math.random() * 2.5, fig: fig, guard: fig === R.guard }; });
    handsUp(true);
    benny = GAME.peds.buildPedMesh({ look: { shirt: 0x6a5a8a, pants: 0x2a2a34, skin: 0xd8a888, hair: 'pompadour', hairCol: 0xc0c0c8 } });
    benny.position.set(R.vault.x, 0, R.vault.z + 0.8);
    benny.rotation.y = 0;
    GAME.scene.add(benny);
    say('EVERYBODY DOWN! — Benny goes for the dial. Keep the floor.', 3.5);
    objective('Keep the floor while Benny works the dial.');
    GAME.hud.missionTimer(j.crack, false);
  }
  function handsUp(up) {
    var R = room() && room().bank;
    if (!R) return;
    // (interiors.js poses them: its idle sway would have the arms back down)
    R.tellers.concat(R.customers, [R.guard]).forEach(function (fig) { fig.userData.pose = up ? 'up' : null; });
  }
  function floorStep(j, dt) {
    var R = room().bank, p = P();
    if (!inBank()) return fail(j.phase === 'floor' ? 'you walked out on Benny.' : 'you left the bags.');
    if (j.phase === 'floor') {
      j.crack -= dt;
      GAME.hud.missionTimer(Math.max(0, j.crack), false);
      // somebody going for the alarm (or the radio): get to them first
      var el = GAME.time - j.inT;
      if (!j.reach && !j.alarm) {
        for (var i = 0; i < j.events.length; i++) {
          var e = j.events[i];
          if (e.done || el < e.at) continue;
          e.done = true;
          var fp = e.fig.position, sx = e.guard ? fp.x + 0.9 : fp.x, sz = e.guard ? fp.z - 0.9 : R.vault.z - 2.6;
          if (!e.guard) sz = fp.z - 2.0;     // the customer's side of the counter
          var m = new THREE.Mesh(new THREE.RingGeometry(0.75, 1.0, 28), new THREE.MeshBasicMaterial({
            color: 0xff3a3a, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
          m.rotation.x = -Math.PI / 2;
          m.position.set(sx, 0.05, sz);
          GAME.scene.add(m);
          j.reach = { e: e, x: sx, z: sz, t: REACH, mesh: m };
          e.fig.userData.pose = 'reach';
          say(e.guard ? 'The guard is going for his radio — get over there!' : 'A teller is reaching for the alarm — stop her!', 2.5);
          break;
        }
      }
      if (j.reach) {
        var rr = j.reach;
        rr.t -= dt;
        rr.mesh.material.opacity = 0.5 + 0.4 * Math.abs(Math.sin(GAME.time * 8));
        if (U.dist2(p.pos.x, p.pos.z, rr.x, rr.z) < 1.4 * 1.4) {
          say(rr.e.guard ? '"Easy, easy." He puts it down.' : 'She thinks better of it.', 2);
          rr.e.fig.userData.pose = 'up';
          GAME.scene.remove(rr.mesh); rr.mesh.geometry.dispose(); rr.mesh.material.dispose();
          j.reach = null;
        } else if (rr.t <= 0) {
          j.alarm = true;
          say(rr.e.guard ? 'He got a word out on the radio — they know.' : 'The silent alarm\'s gone — they\'ll be outside when you come out.', 3.5);
          GAME.scene.remove(rr.mesh); rr.mesh.geometry.dispose(); rr.mesh.material.dispose();
          j.reach = null;
        }
      }
      if (j.crack <= 0) {
        if (j.reach) { GAME.scene.remove(j.reach.mesh); j.reach = null; }
        j.phase = 'bags'; j.swing = 0;
        R.trolley.visible = true;
        var bm = new THREE.Mesh(new THREE.RingGeometry(0.75, 1.0, 28), new THREE.MeshBasicMaterial({
          color: 0xe8c86a, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
        bm.rotation.x = -Math.PI / 2;
        bm.position.set(R.vault.x, 0.05, R.vault.z);
        GAME.scene.add(bm);
        j.bits.push({ kind: 'mesh', o: bm });
        GAME.hud.missionTimer(null);
        if (GAME.audio.ding) GAME.audio.ding();
        say('BENNY: "And... open." — get the bags.', 3);
        objective('The bags, on the trolley in the vault.');
      }
      return;
    }
    // the door swings, and the bags are yours
    j.swing = Math.min(1, j.swing + dt / 1.4);
    R.door.rotation.y = -1.9 * j.swing * j.swing * (3 - 2 * j.swing);
    // (once it is open: there is a steel door in the way till then)
    if (R.trolley.visible && j.swing > 0.85 && U.dist2(p.pos.x, p.pos.z, R.vault.x, R.vault.z) < 1.6 * 1.6) {
      R.trolley.visible = false;
      j.phase = 'out';
      say('Bags in hand. OUT — the car is at the door.', 3);
      objective('Out the door.');
    }
  }
  // the bank put back the way it was, for the next customer
  function resetBank() {
    var r = room();
    if (!r || !r.bank) return;
    r.bank.door.rotation.y = 0;
    r.bank.trolley.visible = false;
    handsUp(false);
  }
  function payday(j) {
    var took = Math.round(GAME.time - j.t0);
    GAME.addCash(PAY);
    prefs().step = STEPS.length;
    prefs().car = null;
    GAME.audio.sting('win');
    if (GAME.haptics && GAME.haptics.win) GAME.haptics.win();
    say('THE BIG SCORE  +$' + PAY.toLocaleString() + '  ·  Benny counts it twice.', 6);
    GAME.save();
    if (GAME.herald) GAME.herald.front('heist', { alarm: j.alarm });
    if (GAME.share && GAME.share.show) {
      GAME.share.show({
        slug: 'big-score', eyebrow: 'Costa Rosa · 1986', title: 'THE BIG SCORE', subtitle: 'The Savings & Loan, cleaned out',
        accent: '#e8c86a',
        stats: [
          { label: 'Take', value: '$' + PAY.toLocaleString() },
          { label: 'Alarm', value: j.alarm ? 'Tripped' : 'Quiet' },
          { label: 'Time', value: Math.floor(took / 60) + ':' + ('0' + (took % 60)).slice(-2) }
        ]
      });
    }
    if (GAME.track) GAME.track('heist-done');
    tidy();
    lola('Kid. I\'ve been in this town thirty years and nobody ever did that. Go somewhere warm for a while.', 9);
  }

  // ---------- each tick ----------
  var nudged = false;
  var tarp = null;
  function coverUp(car) {
    dropTarp();
    var s = car.spec, g = new THREE.Group(), cloth = sharedLambert(0x4e5a44);
    var body = new THREE.Mesh(sharedBoxGeo(s.w + 0.35, (s.bodyH || 0.6) + (s.cabinH || 0.5) + 0.25, s.l + 0.3), cloth);
    body.position.y = ((s.bodyH || 0.6) + (s.cabinH || 0.5) + 0.25) / 2 + 0.1;
    g.add(body);
    var hem = new THREE.Mesh(sharedBoxGeo(s.w + 0.6, 0.12, s.l + 0.55), cloth);
    hem.position.y = 0.12;
    g.add(hem);
    g.position.set(car.pos.x, GAME.city.groundY(car.pos.x, car.pos.z), car.pos.z);
    g.rotation.y = car.heading;
    GAME.scene.add(g);
    tarp = g;
  }
  function dropTarp() { if (tarp) { GAME.scene.remove(tarp); tarp = null; } }
  function update(dt) {
    if (!GAME.started) return;
    if (tarp) { var f0 = GAME.focus(); if (U.dist2(f0.x, f0.z, tarp.position.x, tarp.position.z) > 160 * 160) dropTarp(); }
    if (!shed && GAME.city && GAME.city.hash) buildShed();
    // she pages once, when the bridges have opened and it is quiet
    if (enabled && !nudged && offered() && !prefs().told && !job && P().state === 'alive' && !(GAME.missions && GAME.missions.active) &&
        !(GAME.strangers && GAME.strangers.busy) && GAME.police.wanted === 0) {
      nudged = true; prefs().told = true; GAME.save();
      lola('Kid — call me when you have a minute. I\'ve got something bigger than a ring on a map.', 8);
    }
    if (!job) return;
    job.t += dt;
    if (P().state !== 'alive') return fail(P().state === 'busted' ? 'you got busted.' : 'you went down.');
    // X twice walks away from it, as from a favour
    if (GAME.keyPressed('KeyX')) {
      if (GAME.time < abandonAsk) { abandon(); return; }
      abandonAsk = GAME.time + 3;
      say((GAME.controls ? GAME.controls.label('KeyX') : 'X') + ' again to walk away from THE BIG SCORE', 3);
    }
    [caseStep, earStep, wheelsStep, jobStep][job.step](job, dt);
    stepRoute(dt);
  }
  // what the way there looks like on the map, along the streets
  function stepRoute(dt) {
    if (!job || !job.target) return;
    routeT -= dt;
    if (routeT > 0) return;
    routeT = 1;
    var f = GAME.focus(), t = job.target;
    var nodes = GAME.nav.roadPath(f.x, f.z, t[0], t[1]), pts = [];
    for (var i = 0; i < nodes.length; i++) pts.push([nodes[i].x, nodes[i].z]);
    pts.push([t[0], t[1]]);
    route = pts;
    if (!ring) {
      ring = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 6, 20, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xe8c86a, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false }));
      GAME.scene.add(ring);
    }
    ring.visible = !P().interior;
    ring.position.set(t[0], GAME.city.groundY(t[0], t[1]) + 3, t[1]);
  }
  var blipOut = [];
  function blips() {
    blipOut.length = 0;
    if (job && job.target) blipOut.push({ x: job.target[0], z: job.target[1], color: '#e8c86a', size: 4.5 });
    return blipOut;
  }
  // what Lola says about it, and what comes next
  function board() {
    var n = step(), lines = STEPS.map(function (s, i) { return (i < n ? '✓ ' : i === n ? '▶ ' : '· ') + s; }).join('   ');
    if (n >= STEPS.length) return { say: 'We did it, kid. The Savings & Loan is still trying to work out how.', next: null };
    var why = GAME.police.wanted > 0 ? ' Not with the law on you, though — lose them first.' : '';
    var say0 = n === 0
      ? 'The Costa Rosa Savings & Loan, on the strip. Rico banked there; so does everybody. I want it — and I want it done properly. First, pictures: the front from across the street, and the vault from inside. ' + lines + why
      : 'Where we are: ' + lines + '. Next is ' + STEPS[n] + '.' + why;
    return { say: say0, next: GAME.police.wanted > 0 ? null : STEPS[n] };
  }

  return {
    update: update,
    begin: begin,
    abandon: abandon,
    blips: blips,
    board: board,
    offered: offered,
    resprayed: function (car) { /* (the wheels part reads car.resprayT itself) */ },
    route: function () { return job ? route : null; },
    target: function () { return job && job.target ? job.target : null; },
    get busy() { return !!job; },
    get job() { return job; },
    get activeJob() { return job ? { def: { job: false } } : null; },
    get step() { return step(); },
    set step(n) { prefs().step = n; },
    get enabled() { return enabled; },
    set enabled(v) { enabled = !!v; },
    get LOCKUP() { return LOCKUP; },
    get PAY() { return PAY; },
    bank: bank,
    room: room,
    shed: function () { return shed; },
    // headless: back to before Lola ever asked
    reset: function () { dropTarp(); if (job) tidy(); GAME.prefs = GAME.prefs || {}; GAME.prefs.heist = { step: 0, told: true }; nudged = true; }
  };
})();
