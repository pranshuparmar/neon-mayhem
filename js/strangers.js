// Strangers with a favour to ask. Six people round the mainland, each where
// you can find them — a ? over their head, and on the radar once you are
// near — with one odd job apiece: a salesman late for a plane, a wife who
// wants a car followed, a kid whose bike has been taken, an old lady's lost
// dog, a crew whose driver never showed, and a nervous man with a date.
//
// Walk up (or pull up) and they ask. A favour runs like a job: a title, an
// objective, a route on the map; X twice walks away from it. Done is done —
// they thank you and are not there again — and Lola keeps the tally.
GAME.strangers = (function () {
  var NEAR_R = 120, KEEP_R = 170, TALK_R = 4.5, CAR_TALK_R = 8;
  var people = null;        // { def, at, ped, mark, asked }
  var job = null;           // the favour under way
  var routeT = 0, route = null, ring = null, abandonAsk = 0;
  // (the regression suite stands them down, the way it pins the CITY knob)
  var enabled = true;

  function P() { return GAME.player; }
  function prefs() { GAME.prefs = GAME.prefs || {}; return GAME.prefs; }
  function done(id) { var s = prefs().strangers || {}; return !!s[id]; }
  function doneCount() { var n = 0; for (var i = 0; i < DEFS.length; i++) if (done(DEFS[i].id)) n++; return n; }
  function say(t, s) { GAME.hud.message(t, s || 3.5); }
  function dist(a, x, z) { return Math.sqrt(U.dist2(a.x, a.z, x, z)); }
  function land(car) { return !!car && !car.dead && !car.spec.boat && !car.spec.heli && !car.spec.plane; }
  function inLand() { var p = P(); return p.inCar && land(p.car) ? p.car : null; }

  // ---------- places ----------
  // A pavement spot near (x, z): off the nearest road, clear of anything solid.
  function pavement(x, z) {
    var C = GAME.city, rp = C.nearestRoadPoint(x, z);
    // a corner first: if this stretch is a crossing, step along the road
    // until it is not
    for (var w = 0; w < 6; w++) {
      var tryAt = pavementAt(rp);
      if (tryAt) return tryAt;
      var hh = roadHeading(rp);
      rp = C.nearestRoadPoint(rp.x + Math.sin(hh) * 14, rp.z + Math.cos(hh) * 14);
    }
    var h0 = roadHeading(rp);
    return { x: rp.x + Math.cos(h0) * 7.8, z: rp.z - Math.sin(h0) * 7.8 };
  }
  function pavementAt(rp) {
    var C = GAME.city;
    var h = rp.axis === 'z' ? 0 : rp.axis === 'x' ? Math.PI / 2 : rp.heading || 0;
    var sx = Math.cos(h), sz = -Math.sin(h);
    var sides = [1, -1], offs = [7.8, 8.6, 7];
    for (var i = 0; i < 2; i++) for (var k = 0; k < offs.length; k++) {
      var px = rp.x + sx * offs[k] * sides[i], pz = rp.z + sz * offs[k] * sides[i];
      if (C.isInWater(px, pz) || C.inAirport(px, pz)) continue;
      // (off every road, not only this one: a corner has a cross street)
      var rq = C.nearestRoadPoint(px, pz);
      if (U.dist2(rq.x, rq.z, px, pz) < 6.6 * 6.6) continue;
      var r = GAME.resolveCircle(px, pz, 0.5);
      if (Math.abs(r.x - px) + Math.abs(r.z - pz) < 0.05) return { x: px, z: pz };
    }
    return null;
  }
  // a road point some way off, on the mainland, for a job to send you to
  function roadAway(from, r0, r1) {
    var C = GAME.city;
    for (var t = 0; t < 30; t++) {
      var a = Math.random() * Math.PI * 2, r = U.randRange(Math.random, r0, r1);
      var rp = C.nearestRoadPoint(from.x + Math.cos(a) * r, from.z + Math.sin(a) * r);
      if (!rp || rp.kind === 'local' || C.isInWater(rp.x, rp.z) || C.inAirport(rp.x, rp.z)) continue;
      if (GAME.isla && GAME.isla.contains(rp.x, rp.z)) continue;
      var d = dist(from, rp.x, rp.z);
      if (d < r0 * 0.75 || d > r1 * 1.25) continue;
      return rp;
    }
    return null;
  }
  function roadHeading(rp) { return rp.axis === 'net' ? rp.heading : rp.axis === 'z' ? 0 : Math.PI / 2; }

  // ---------- the six ----------
  var LOOK = {
    ray: { shirt: 0xf0f0e8, pants: 0x2a2a34, skin: 0xeac8a8, hair: 'crew', hairCol: 0x5a3c22 },
    dani: { shirt: 0xf7a8c4, pants: 0xd8d0c0, skin: 0xc89878, hair: 'ponytail', hairCol: 0x1c1a18 },
    tito: { shirt: 0x9fe8d8, pants: 0x3a4a68, skin: 0x8a6848, hair: 'afro', hairCol: 0x1c1a18 },
    rosa: { shirt: 0x8a6ae8, pants: 0x684a3a, skin: 0xf0d8c0, hair: 'pompadour', hairCol: 0x8a8a90 },
    vince: { shirt: 0x2a2a34, pants: 0x2a2a34, skin: 0xeac8a8, hair: 'flattop', hairCol: 0x2e2018 },
    marco: { shirt: 0xf9d99a, pants: 0x3a4a68, skin: 0x6a4c34, hair: 'pompadour', hairCol: 0x1c1a18 }
  };
  var DEFS = [
    { id: 'ray', who: 'RAY', title: 'AIRPORT RUSH', pay: 400, where: [262, -40],
      ask: 'My flight leaves in a couple of minutes and the cab never came. The airport — please! It\'s worth your while.',
      begin: rayBegin, step: rayStep },
    { id: 'dani', who: 'DANI', title: 'FOLLOW THAT CAR', pay: 350, where: [60, -205],
      ask: 'My husband says he\'s working late. That\'s his car — the white one. Follow him, and for God\'s sake don\'t let him see you.',
      begin: daniBegin, step: daniStep },
    { id: 'tito', who: 'TITO', title: 'STOLEN BIKE', pay: 300, where: [-250, 150],
      ask: 'Some creep just took my bike — the red one! There he goes! Get it back for me? Please?',
      begin: titoBegin, step: titoStep },
    { id: 'rosa', who: 'MRS. ALBESCU', title: 'BISCUIT', pay: 200, where: [-150, -300],
      ask: 'Have you seen my Biscuit? Little brown dog, this high. He slipped his lead and ran off. He\'ll come to anybody kind.',
      begin: rosaBegin, step: rosaStep },
    { id: 'vince', who: 'VINCE', title: 'THE NO-SHOW', pay: 1200, where: [150, 250],
      ask: 'Our driver never showed, and the job\'s on. The bank\'s round the corner. Wait outside with the engine running, then get us out of there.',
      begin: vinceBegin, step: vinceStep },
    { id: 'marco', who: 'MARCO', title: 'A DATE IN STYLE', pay: 500, where: [340, 160],
      ask: 'I\'ve a date with the girl of my dreams and my car\'s in the shop. Pick her up in something classy — a limo, something fast — and get her to the casino. Gently.',
      begin: marcoBegin, step: marcoStep }
  ];
  function def(id) { for (var i = 0; i < DEFS.length; i++) if (DEFS[i].id === id) return DEFS[i]; return null; }

  // ---------- the people on the pavement ----------
  function setup() {
    people = DEFS.map(function (d) { return { def: d, at: pavement(d.where[0], d.where[1]), ped: null, mark: null, asked: false }; });
  }
  var markGeo = null, markMat = null;
  function markMesh() {
    if (!markGeo) {
      markGeo = new THREE.OctahedronGeometry(0.32, 0); markGeo.userData.shared = true;
      markMat = new THREE.MeshBasicMaterial({ color: 0xc86bff }); markMat.userData.shared = true;
    }
    var m = new THREE.Mesh(markGeo, markMat);
    GAME.scene.add(m);
    return m;
  }
  function putOut(p) {
    var ped = GAME.peds.spawnPed(p.at.x, p.at.z, { look: LOOK[p.def.id] });
    if (!ped) return;
    ped.jobPed = true; ped.state = 'wait'; ped.speed = 0; ped.stranger = p.def.id;
    p.ped = ped; p.mark = markMesh();
  }
  function takeIn(p) {
    if (p.ped && !p.ped.gone && !p.ped.dead) GAME.peds.removePed(p.ped);
    p.ped = null;
    if (p.mark) { GAME.scene.remove(p.mark); p.mark = null; }
  }
  function tend(dt) {
    var f = GAME.focus();
    for (var i = 0; i < people.length; i++) {
      var p = people[i], d2 = U.dist2(p.at.x, p.at.z, f.x, f.z);
      var gone = done(p.def.id) || (job && job.def === p.def && job.away);
      if (p.ped && (p.ped.dead || p.ped.gone)) { if (p.mark) { GAME.scene.remove(p.mark); p.mark = null; } p.ped = null; }
      if (!p.ped && !gone && d2 < NEAR_R * NEAR_R) putOut(p);
      else if (p.ped && (gone || d2 > KEEP_R * KEEP_R)) takeIn(p);
      if (p.ped && p.mark) {
        p.mark.visible = !job;
        p.mark.position.set(p.ped.pos.x, p.ped.pos.y + 2.5 + Math.sin(GAME.time * 3 + i) * 0.12, p.ped.pos.z);
        p.mark.rotation.y += dt * 1.6;
        // and they face whoever is coming up to them
        if (d2 < 30 * 30) {
          p.ped.heading = Math.atan2(f.x - p.ped.pos.x, f.z - p.ped.pos.z);
          p.ped.mesh.rotation.y = p.ped.heading;
        }
      }
      if (p.asked && d2 > 14 * 14) p.asked = false;
    }
  }
  // close enough, at the right pace, with nothing else going on: they ask
  function canAsk() {
    var p = P(), M = GAME.missions;
    if (job || p.state !== 'alive' || p.interior || p.swimming || GAME.lolaOpen || GAME.shopOpen || GAME.mapOpen) return false;
    if (M && M.active) return false;
    if (GAME.police.wanted > 0) return false;
    if (GAME.guide && GAME.guide.step) return false;
    if (p.inCar && (!land(p.car) || Math.abs(p.car.speed) > 2.5)) return false;
    return true;
  }
  function listen() {
    if (!canAsk()) return;
    var p = P(), at = p.inCar ? p.car.pos : p.pos, r = p.inCar ? CAR_TALK_R : TALK_R;
    for (var i = 0; i < people.length; i++) {
      var q = people[i];
      if (!q.ped || q.asked || done(q.def.id)) continue;
      if (dist(q.ped.pos, at.x, at.z) > r) continue;
      q.asked = true;
      ask(q);
      return;
    }
  }
  function ask(q) {
    var d = q.def;
    GAME.lola.offer({
      from: '🗣 ' + d.who,
      say: d.ask,
      top: true,
      escSays: 'to walk on',
      list: [
        { label: '✓ I\'LL DO IT', fn: function () { GAME.lola.close(); begin(q); } },
        { label: '✗ NOT RIGHT NOW', fn: function () { GAME.lola.close(); } }
      ]
    });
  }

  // ---------- a favour under way ----------
  function begin(q) {
    var d = q.def;
    job = { def: d, who: q, t: 0, phase: '', target: null, timer: null, away: false, bits: [] };
    GAME.hud.missionStart(d.title, '');
    GAME.audio.pickup();
    if (GAME.track) GAME.track('stranger-started');
    d.begin(job);
  }
  function objective(t) { if (job) { job.obj = t; GAME.hud.missionObjective(t); } }
  function target(x, z) {
    if (!job) return;
    if (x === null) { job.target = null; route = null; if (ring) ring.visible = false; return; }
    job.target = [x, z]; routeT = 0;
  }
  function tidy() {
    if (!job) return;
    for (var i = 0; i < job.bits.length; i++) {
      var b = job.bits[i];
      if (b.kind === 'car' && !b.o.gone) {
        // back to being nobody's business: traffic, or towed away
        b.o.mission = false; b.o.outlaw = false;
        if (b.o.ai && b.o.occupied === 'ai') { b.o.ai = { mode: 'traffic', desired: 11, laneX: 0, laneZ: 0 }; }
      } else if (b.kind === 'mesh') { GAME.scene.remove(b.o); disposeTree(b.o); }
      else if (b.kind === 'ped' && !b.o.gone && !b.o.dead) GAME.peds.removePed(b.o);
    }
    GAME.hud.missionEnd();
    target(null);
    job = null;
  }
  function win(line) {
    var d = job.def, s = prefs();
    s.strangers = s.strangers || {};
    s.strangers[d.id] = true;
    GAME.addCash(d.pay);
    GAME.audio.sting('win');
    if (GAME.haptics && GAME.haptics.win) GAME.haptics.win();
    say('FAVOUR DONE — ' + d.title + '  +$' + d.pay + (line ? '  ·  ' + line : '') + '  ·  strangers ' + doneCount() + ' of ' + DEFS.length, 5);
    if (GAME.track) GAME.track('stranger-done');
    GAME.save();
    tidy();
    // all six: the papers have heard about you
    if (doneCount() === DEFS.length && GAME.herald) GAME.herald.front('samaritan');
  }
  function fail(reason) {
    GAME.audio.sting('wasted');
    say('FAVOUR FAILED — ' + reason + '  ·  they may ask again', 4);
    var q = job.who;
    tidy();
    if (q) q.asked = true;   // (not again until you have walked off and come back)
  }
  function abandon() {
    if (!job) return false;
    abandonAsk = 0;
    fail('you walked away from it');
    return true;
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
        new THREE.MeshBasicMaterial({ color: 0xc86bff, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false }));
      GAME.scene.add(ring);
    }
    ring.visible = true;
    ring.position.set(t[0], GAME.city.groundY(t[0], t[1]) + 3, t[1]);
  }

  // ---------- RAY: the airport ----------
  var GATE = { x: -160, z: 396 };
  function rayBegin(j) {
    j.phase = 'car';
    if (inLand()) rayAboard(j);
    else objective('Get a car — Ray is coming with you.');
  }
  function rayAboard(j) {
    takeIn(j.who); j.away = true;
    say('Ray piles in with his sample case. "The airport — step on it!"', 3);
    var f = GAME.focus(), nodes = GAME.nav.roadPath(f.x, f.z, GATE.x, GATE.z), len = 0;
    for (var i = 1; i < nodes.length; i++) len += Math.sqrt(U.dist2(nodes[i].x, nodes[i].z, nodes[i - 1].x, nodes[i - 1].z));
    j.timer = Math.max(70, Math.round(len / 13 + 30));
    j.phase = 'drive';
    objective('Get Ray to the airport gate before his flight goes.');
    target(GATE.x, GATE.z);
  }
  function rayStep(j, dt) {
    var car = inLand();
    if (j.phase === 'car') {
      if (car && dist(car.pos, j.who.at.x, j.who.at.z) < 30) rayAboard(j);
      else target(j.who.at.x, j.who.at.z);
      return;
    }
    j.timer -= dt;
    GAME.hud.missionTimer(j.timer, true);
    if (!car) { j.outT = (j.outT || 0) + dt; if (j.outT > 6) return fail('Ray grabbed a cab.'); }
    else j.outT = 0;
    if (P().car && P().car.dead) return fail('Ray is not getting in another wreck with you.');
    if (j.timer <= 0) return fail('He missed his flight.');
    if (car && dist(car.pos, GATE.x, GATE.z) < 14) win('Ray runs for the gate, case and all.');
  }

  // ---------- DANI: follow that car ----------
  function daniBegin(j) {
    var at = j.who.at, rp = roadAway(at, 35, 70);
    // (a junction, not mid-block: making for a node, a driver gets there)
    var far = roadAway(at, 520, 720), to = far ? GAME.city.nearestNode(far.x, far.z) : null;
    if (!rp || !to) return fail('He is nowhere to be seen.');
    var car = GAME.vehicles.spawnCar('sedan', rp.x, rp.z, roadHeading(rp), { occupied: 'ai', mission: true, color: 0xf0f0f4,
      ai: { mode: 'traffic', desired: 0.01, laneX: 0, laneZ: 0, toward: { x: to.x, z: to.z } } });
    if (!car) return fail('He is nowhere to be seen.');
    j.husband = car; j.dest = to; j.bits.push({ kind: 'car', o: car });
    j.phase = 'car';
    objective(inLand() ? 'Follow the white car — not too close.' : 'Get a car — he is about to pull out.');
  }
  function daniStep(j, dt) {
    var h = j.husband, car = P().inCar ? P().car : null;
    if (!h || h.gone || h.dead) return fail('Something happened to his car. Dani is not paying for that.');
    if (j.phase === 'car') {
      target(h.pos.x, h.pos.z);
      if (car && !car.dead) { j.phase = 'tail'; h.ai.desired = 11; objective('Follow the white car — not too close.'); }
      return;
    }
    j.t += dt;
    target(null);
    if (!car || car.dead) { j.outT = (j.outT || 0) + dt; if (j.outT > 8) return fail('You lost him.'); }
    else j.outT = 0;
    var at = car ? car.pos : P().pos, d = dist(at, h.pos.x, h.pos.z);
    if (d < 14) { j.closeT = (j.closeT || 0) + dt; if (j.closeT > 3) return fail('He saw you. Dani will never hear the end of it.'); }
    else j.closeT = Math.max(0, (j.closeT || 0) - dt);
    if (d > 110) { j.farT = (j.farT || 0) + dt; if (j.farT > 5) return fail('You lost him.'); }
    else j.farT = 0;
    if (GAME.frame % 20 === 0) objective(d < 18 ? 'Too close — drop back!' : d > 80 ? 'You are losing him…' : 'Follow the white car — not too close.');
    // he gets where he is going, or goes nowhere in particular for long enough
    if (dist(h.pos, j.dest.x, j.dest.z) < 25) {
      h.ai.desired = 0.01;
      j.parkedT = (j.parkedT || 0) + dt;
      if (j.parkedT > 2) win('A motel. Of course it is a motel.');
    } else if (j.t > 150) win('He only drove round in circles. Dani is relieved — she thinks.');
  }

  // ---------- TITO: the stolen bike ----------
  function titoBegin(j) {
    var at = j.who.at, rp = roadAway(at, 45, 80), to = roadAway(at, 500, 700);
    if (!rp || !to) return fail('The thief is long gone.');
    var bike = GAME.vehicles.spawnCar('motorcycle', rp.x, rp.z, roadHeading(rp), { occupied: 'ai', mission: true, color: 0xe83838,
      ai: { mode: 'traffic', desired: 14, laneX: 0, laneZ: 0, reckless: true, toward: { x: to.x, z: to.z } } });
    if (!bike) return fail('The thief is long gone.');
    bike.outlaw = true;
    j.bike = bike; j.bits.push({ kind: 'car', o: bike });
    j.phase = 'chase';
    objective('Get Tito\'s red bike back off the thief.');
  }
  function titoStep(j) {
    var b = j.bike, p = P();
    if (!b || b.gone) return fail('The thief got clean away.');
    if (b.dead) return fail('The bike is wrecked.');
    if (j.phase === 'chase') {
      target(b.pos.x, b.pos.z);
      if (b.occupied !== 'ai') { j.phase = 'back'; objective('Ride the bike back to Tito.'); say('He\'s off it! Now get it back to Tito.', 2.5); }
      else if (U.dist2(b.pos.x, b.pos.z, GAME.focus().x, GAME.focus().z) > 320 * 320) return fail('The thief got clean away.');
      return;
    }
    var at = j.who.at;
    if (p.inCar && p.car === b) {
      target(at.x, at.z);
      if (dist(b.pos, at.x, at.z) < 9) win('Tito\'s grin is the size of the bay.');
    } else target(b.pos.x, b.pos.z);
  }

  // ---------- MRS. ALBESCU: Biscuit ----------
  // a little brown dog: a body, a head with ears, four legs that trot, a tail
  function dogMesh() {
    var g = new THREE.Group(), fur = sharedLambert(0x8a5a32), dark = sharedLambert(0x3a2414);
    function box(w, h, d, x, y, z, m) { var b = new THREE.Mesh(sharedBoxGeo(w, h, d), m); b.position.set(x, y, z); g.add(b); return b; }
    box(0.3, 0.26, 0.62, 0, 0.36, 0, fur);
    box(0.24, 0.22, 0.24, 0, 0.56, 0.38, fur);
    box(0.12, 0.1, 0.14, 0, 0.5, 0.54, dark);                 // nose
    box(0.06, 0.12, 0.06, 0.09, 0.7, 0.36, dark);              // ears
    box(0.06, 0.12, 0.06, -0.09, 0.7, 0.36, dark);
    var tail = box(0.06, 0.06, 0.24, 0, 0.48, -0.38, fur);
    tail.rotation.x = -0.6;
    var legs = [];
    [[0.1, 0.22], [-0.1, 0.22], [0.1, -0.22], [-0.1, -0.22]].forEach(function (q) {
      var pv = new THREE.Group(); pv.position.set(q[0], 0.26, q[1]);
      var l = new THREE.Mesh(sharedBoxGeo(0.07, 0.26, 0.07), fur); l.position.y = -0.13; pv.add(l);
      g.add(pv); legs.push(pv);
    });
    g.userData.legs = legs; g.userData.tail = tail;
    GAME.scene.add(g);
    return g;
  }
  function rosaBegin(j) {
    var at = j.who.at, rp = roadAway(at, 110, 180);
    if (!rp) return fail('Biscuit is nowhere about.');
    var spot = pavement(rp.x, rp.z);
    var dog = dogMesh();
    dog.position.set(spot.x, GAME.city.groundY(spot.x, spot.z), spot.z);
    j.dog = dog; j.home = { x: spot.x, z: spot.z }; j.bits.push({ kind: 'mesh', o: dog });
    var a = Math.random() * Math.PI * 2, r = U.randRange(Math.random, 8, 26);
    j.area = [spot.x + Math.cos(a) * r, spot.z + Math.sin(a) * r];
    j.phase = 'find'; j.wagT = 0;
    objective('Find Biscuit — somewhere round the marked spot. Walk up to him.');
    target(j.area[0], j.area[1]);
  }
  function rosaStep(j, dt) {
    var dog = j.dog, p = P(), dp = dog.position, at = j.who.at;
    var tx = dp.x, tz = dp.z, run = 0;
    if (j.phase === 'find') {
      // pottering about where he got to
      j.wagT -= dt;
      if (j.wagT <= 0) { j.wagT = U.randRange(Math.random, 1.5, 3.5); var a = Math.random() * Math.PI * 2; j.sniff = [j.home.x + Math.cos(a) * 4, j.home.z + Math.sin(a) * 4]; }
      if (j.sniff) { tx = j.sniff[0]; tz = j.sniff[1]; run = 1.4; }
      if (!p.inCar && dist(p.pos, dp.x, dp.z) < 5) {
        j.phase = 'home'; say('Biscuit wags his whole back end and trots after you.', 3);
        objective('Walk Biscuit home to Mrs. Albescu.');
        target(at.x, at.z);
      }
    } else {
      if (p.inCar) {
        if (!j.toldCar) { j.toldCar = true; say('Biscuit won\'t get in a car — walk him home.', 3); }
      } else {
        // at your heel, a couple of metres back
        var bx = p.pos.x - Math.sin(p.heading) * 1.6, bz = p.pos.z - Math.cos(p.heading) * 1.6;
        var gap = dist(p.pos, dp.x, dp.z);
        if (gap < 80) { tx = bx; tz = bz; run = Math.min(8, dist(dp, bx, bz) * 2.2); }
        // A dog finds his own way round a corner: hung up on a wall with you
        // getting away, he turns up at your heel rather than sitting there.
        if (gap > 12 && run > 0) {
          j.lastGap = j.lastGap === undefined ? gap : j.lastGap;
          if (gap >= j.lastGap - 0.05) j.stuckT = (j.stuckT || 0) + dt; else j.stuckT = 0;
          j.lastGap = gap;
          if (j.stuckT > 1.5) {
            j.stuckT = 0; j.lastGap = undefined;
            var r0 = GAME.resolveCircle(bx - Math.sin(p.heading) * 1.5, bz - Math.cos(p.heading) * 1.5, 0.3);
            dp.x = r0.x; dp.z = r0.z;
          }
        } else j.stuckT = 0;
      }
      if (dist(dp, at.x, at.z) < 6) return win('"Biscuit!" He licks her face all over.');
    }
    var dx = tx - dp.x, dz = tz - dp.z, dd = Math.sqrt(dx * dx + dz * dz);
    var legs = dog.userData.legs;
    if (dd > 0.3 && run > 0) {
      var step = Math.min(dd, run * dt);
      var nx = dp.x + dx / dd * step, nz = dp.z + dz / dd * step;
      var r = GAME.resolveCircle(nx, nz, 0.3);
      dp.x = r.x; dp.z = r.z;
      dp.y = GAME.city.groundY(dp.x, dp.z);
      dog.rotation.y = Math.atan2(dx, dz);
      var sw = Math.sin(GAME.time * 16) * 0.6;
      legs[0].rotation.x = legs[3].rotation.x = sw; legs[1].rotation.x = legs[2].rotation.x = -sw;
    } else for (var i = 0; i < 4; i++) legs[i].rotation.x = 0;
    dog.userData.tail.rotation.y = Math.sin(GAME.time * 12) * 0.5;
  }

  // ---------- VINCE: the no-show ----------
  function vinceBegin(j) {
    var at = j.who.at, bank = roadAway(at, 150, 240), lock = roadAway(at, 420, 620);
    if (!bank || !lock) return fail('The job is off.');
    j.bank = bank; j.lock = lock;
    j.phase = 'car';
    if (vinceCar()) vinceGo(j); else objective('Get a car — four doors, nothing on two wheels.');
  }
  function vinceCar() { var c = inLand(); return c && !c.spec.bike ? c : null; }
  function vinceGo(j) {
    takeIn(j.who); j.away = true;
    say('Vince and two friends climb in with a holdall. "The bank. Nice and easy."', 3);
    j.phase = 'bank';
    objective('Drive to the bank and stop outside.');
    target(j.bank.x, j.bank.z);
  }
  function vinceStep(j, dt) {
    var car = vinceCar();
    if (j.phase === 'car') {
      if (car && dist(car.pos, j.who.at.x, j.who.at.z) < 30) vinceGo(j);
      else target(j.who.at.x, j.who.at.z);
      return;
    }
    if (!car) { j.outT = (j.outT || 0) + dt; if (j.outT > 4) return fail('The crew bolts on foot. No driver, no cut.'); }
    else j.outT = 0;
    if (!car) return;
    if (j.phase === 'bank') {
      if (dist(car.pos, j.bank.x, j.bank.z) < 10 && Math.abs(car.speed) < 2) {
        j.phase = 'wait'; j.waitT = 8;
        target(null);
        objective('Keep the engine running…');
        say('They\'re in. Keep it running.', 2.5);
      }
      return;
    }
    if (j.phase === 'wait') {
      j.waitT -= dt;
      GAME.hud.missionTimer(j.waitT, false);
      if (dist(car.pos, j.bank.x, j.bank.z) > 25) return fail('You left them behind. They will remember that.');
      if (j.waitT <= 0) {
        j.phase = 'run';
        GAME.police.setWanted(Math.max(GAME.police.wanted, 3));
        say('"GO! GO! GO!" — the alarm is ringing down the street.', 3);
        objective('Lose the heat, then get them to the lock-up.');
        target(j.lock.x, j.lock.z);
      }
      return;
    }
    // the getaway
    var hot = GAME.police.wanted > 0;
    if (GAME.frame % 20 === 0) objective(hot ? 'Lose the heat, then get them to the lock-up.' : 'Clean. Now the lock-up.');
    if (dist(car.pos, j.lock.x, j.lock.z) < 12) {
      if (hot) { if (!j.toldHot) { j.toldHot = true; say('Not with the cops on us! Lose them first.', 2.5); } }
      else win('Vince counts out your cut. "Same time next year?"');
    }
  }

  // ---------- MARCO: a date in style ----------
  var CLASSY = { limo: 1, sports: 1 };
  var CASINO = { x: 346, z: 250 };   // the kerb at the foot of the casino pier
  function marcoCar() { var c = inLand(); return c && CLASSY[c.type] ? c : null; }
  function marcoBegin(j) {
    var her = roadAway(j.who.at, 150, 240);
    if (!her) return fail('She cancelled.');
    j.her = pavement(her.x, her.z);
    var gina = GAME.peds.spawnPed(j.her.x, j.her.z, { look: { shirt: 0xe86a8a, pants: 0x2a2a34, skin: 0xc89878, hair: 'ponytail', hairCol: 0xa8482a } });
    if (gina) { gina.jobPed = true; gina.state = 'wait'; gina.speed = 0; j.gina = gina; j.bits.push({ kind: 'ped', o: gina }); }
    j.phase = 'car';
    marcoNext(j);
  }
  function marcoNext(j) {
    if (j.phase === 'car' && marcoCar()) j.phase = 'pick';
    if (j.phase === 'car') { objective('Find something classy — a limo or a sports car.'); target(null); }
    else if (j.phase === 'pick') { objective('Pick up Gina.'); target(j.her.x, j.her.z); }
  }
  function marcoStep(j, dt) {
    var car = marcoCar();
    if (j.phase === 'car' || j.phase === 'pick') {
      var was = j.phase;
      j.phase = car ? 'pick' : 'car';
      if (j.phase !== was) marcoNext(j);
      if (car && dist(car.pos, j.her.x, j.her.z) < 9 && Math.abs(car.speed) < 2) {
        if (j.gina && !j.gina.gone) GAME.peds.removePed(j.gina);
        j.gina = null;
        j.phase = 'drive'; j.hp0 = car.hp; j.car = car; j.heat0 = GAME.police.wanted;
        say('Gina slides in. "Marco sent a car? Classy."', 3);
        objective('Get Gina to the casino — smoothly.');
        target(CASINO.x, CASINO.z);
      }
      return;
    }
    var c = P().inCar ? P().car : null;
    if (c !== j.car) return fail('Gina is not walking anywhere in those heels.');
    if (c.dead || c.hp < j.hp0 - c.spec.hp * 0.15) return fail('She has had enough of your driving and gets out.');
    if (GAME.police.wanted > j.heat0) return fail('Cops? On a first date? She gets out at the lights.');
    if (dist(c.pos, CASINO.x, CASINO.z) < 12 && Math.abs(c.speed) < 3) win('She\'s smiling. Marco owes you.');
  }

  // ---------- each tick ----------
  function update(dt) {
    if (!GAME.started) return;
    if (!enabled) { if (people) { if (job) tidy(); people.forEach(takeIn); } return; }
    if (!people) setup();
    tend(dt);
    if (!job) { listen(); return; }
    var p = P();
    job.t0 = (job.t0 || 0) + dt;
    if (p.state !== 'alive') return fail(p.state === 'busted' ? 'you got busted' : 'you went down');
    // X twice walks away from it, as from any job
    if (GAME.keyPressed('KeyX')) {
      if (GAME.time < abandonAsk) { abandon(); return; }
      abandonAsk = GAME.time + 3;
      say((GAME.controls ? GAME.controls.label('KeyX') : 'X') + ' again to walk away from ' + job.def.title, 3);
    }
    job.def.step(job, dt);
    if (!job) return;
    stepRoute(dt);
    if (ring && ring.visible) ring.material.opacity = 0.25 + 0.12 * Math.sin(GAME.time * 4);
  }

  // the radar: the strangers waiting, and the white car / the bike / the dog
  var blipBuf = [];
  function blips() {
    var n = 0, f = GAME.focus();
    function put(x, z, color, size) {
      var b = blipBuf[n] || (blipBuf[n] = { x: 0, z: 0, color: '', size: 0 });
      b.x = x; b.z = z; b.color = color; b.size = size; n++;
    }
    if (people && !job) {
      for (var i = 0; i < people.length; i++) {
        var q = people[i];
        if (done(q.def.id)) continue;
        if (U.dist2(q.at.x, q.at.z, f.x, f.z) < 220 * 220) put(q.at.x, q.at.z, '#c86bff', 3.5);
      }
    }
    if (job && job.husband && !job.husband.gone) put(job.husband.pos.x, job.husband.pos.z, '#f0f0f4', 3.5);
    blipBuf.length = n;
    return blipBuf;
  }

  return {
    update: update,
    blips: blips,
    abandon: abandon,
    get busy() { return !!job; },
    get enabled() { return enabled; },
    set enabled(v) { enabled = !!v; },
    get job() { return job; },
    // the pause screen's ABANDON button, and the map's route and marker
    get activeJob() { return job ? { def: { job: false, name: job.def.title } } : null; },
    route: function () { return job && job.target ? route : null; },
    target: function () { return job ? job.target : null; },
    get done() { return doneCount(); },
    get total() { return DEFS.length; },
    // headless: who is where, and asking one of them straight away
    people: function () { if (!people) setup(); return people; },
    ask: function (id) { if (!people) setup(); for (var i = 0; i < people.length; i++) if (people[i].def.id === id) { begin(people[i]); return true; } return false; },
    reset: function () { if (job) tidy(); if (people) people.forEach(takeIn); people = null; }
  };
})();
