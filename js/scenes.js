// Talking heads: the cut to somebody's place before a job, the way Vice City
// did it. Black bars come in, the camera cuts away to two people standing
// face to face — Lola at her lock-up, Rico on the marina — and they talk:
// the speaker's face and name in the subtitle, the words typing out in time
// with a voice that is all pitch and no words (cast.js). Then it cuts back to
// you, wherever you were, and the job goes on from there.
//
// The world holds still while it plays. main.js hands every tick here instead
// of to the sim, so the traffic, the police, the mission clock and GAME.time
// itself stop where they were; a fast-forward in the tests drives it the same
// way. A line types out, sits long enough to read and moves on by itself, or
// SPACE / ENTER / a click / a tap / A hurries it; ESC (or B, or the SKIP in
// the corner on a touchscreen) cuts the whole thing short.
//
// A script is either a list of [who, line] — Lola and you at her lock-up — or
// { shots: [{ set, cast: [left, right], lines: [[who, line], ...] }] }, where
// each shot is a cut to somewhere else. A set nobody can stand on (the island
// still shut, a lot not built) plays its lines over the frozen game instead.
GAME.scenes = (function () {
  var enabled = true;
  var cur = null;           // the scene playing
  var figs = {};            // the people who stand in them, built once each
  var played = 0;           // (headless) how many have started
  var OPEN = 0.45;          // the bars coming in before the cut

  function $(id) { return document.getElementById(id); }
  function P() { return GAME.player; }

  // ---------- the scripts ----------
  function normal(script) {
    if (!script) return null;
    var s = Array.isArray(script) ? { id: script.id, shots: [{ set: 'lockup', cast: ['lola', 'you'], lines: script }] } : script;
    var shots = (s.shots || []).filter(function (sh) { return sh.lines && sh.lines.length; });
    return shots.length ? { id: s.id || '', shots: shots } : null;
  }

  // ---------- the places ----------
  // A set is a point to stand at and the way to the camera (n): the two of
  // them face each other across it, and the camera stands off to that side.
  var SETS = {
    // Lola's lock-up on the harbour road (heist.js): in front of the roll-up
    // door, the camera out on the pavement looking back at it
    lockup: function () {
      var sh = GAME.heist && GAME.heist.shed && GAME.heist.shed();
      if (!sh) return null;
      var d = sh.door, rp = GAME.city.nearestRoadPoint(d.x, d.z);
      var nx = rp.x - d.x, nz = rp.z - d.z, nl = Math.hypot(nx, nz) || 1;
      nx /= nl; nz /= nl;
      return { x: d.x + nx * 2.4, z: d.z + nz * 2.4, nx: nx, nz: nz };
    },
    // wherever you are: she comes to you. On the pavement where you stand,
    // or beside the car you are sat in, the camera out toward the road.
    here: function () {
      var p = P(), f = GAME.focus(), x = f.x, z = f.z;
      if (p.interior) return null;
      if (p.inCar && p.car) {
        var h = p.car.heading + Math.PI / 2, off = (p.car.spec.w || 1.8) / 2 + 2.2;
        x += Math.sin(h) * off; z += Math.cos(h) * off;
      }
      var rp = GAME.city.nearestRoadPoint(x, z), nx = rp.x - x, nz = rp.z - z, nl = Math.hypot(nx, nz);
      if (nl < 1) { nx = -Math.sin(GAME.cam.yaw); nz = -Math.cos(GAME.cam.yaw); nl = 1; }
      return { x: x, z: z, nx: nx / nl, nz: nz / nl };
    },
    // the marina on Isla Verde, on the quay with the jetties and the boats
    // behind them — Rico's way out
    marina: function () {
      if (!GAME.isla || !GAME.isla.isOpen() || !GAME.isla.pois) return null;
      var M = GAME.isla.pois().marina;
      if (!M) return null;
      // (on the quay, clear of the jetties' decks, which start at the water)
      return { x: M.x + 13, z: M.z - 6, nx: 0.94, nz: 0.34 };
    }
  };
  // where a set is today, or null; the camera's side turned until nothing
  // solid stands between it and the two of them
  function stage(name) {
    var at = SETS[name] ? SETS[name]() : null;
    if (!at) return null;
    var C = GAME.city;
    if (C.isInWater(at.x, at.z)) return null;
    var base = Math.atan2(at.nx, at.nz), turns = [0, 0.35, -0.35, 0.7, -0.7, 1.05, -1.05];
    for (var i = 0; i < turns.length; i++) {
      var a = base + turns[i], nx = Math.sin(a), nz = Math.cos(a);
      var cx = at.x + nx * 4.8, cz = at.z + nz * 4.8;
      if (!C.hash || C.hash.segmentClear(cx, cz, at.x - nz * 0.8, at.z + nx * 0.8) && C.hash.segmentClear(cx, cz, at.x + nz * 0.8, at.z - nx * 0.8)) {
        return { x: at.x, z: at.z, nx: nx, nz: nz, y: C.groundY(at.x, at.z) };
      }
    }
    return { x: at.x, z: at.z, nx: at.nx, nz: at.nz, y: C.groundY(at.x, at.z) };
  }

  // ---------- the people ----------
  // A face on the front of the head: a town of blank heads reads fine at
  // street distance, but a close-up of one is the back of somebody's head.
  // Brows, eyes, and a mouth that opens when they talk.
  function dress(m, f) {
    var hcol = f.hairCol !== undefined ? f.hairCol : 0x2a1a14;
    [-0.065, 0.065].forEach(function (x) {
      var e = new THREE.Mesh(sharedBoxGeo(0.05, 0.036, 0.012), sharedBasic(0x1a1210));
      e.position.set(x, 1.632, 0.132);
      m.add(e);
      var b = new THREE.Mesh(sharedBoxGeo(0.072, 0.02, 0.012), sharedBasic(hcol));
      b.position.set(x, 1.68, 0.132);
      b.rotation.z = (x < 0 ? -1 : 1) * (f.shades ? 0.18 : -0.08);
      m.add(b);
    });
    var mo = new THREE.Mesh(sharedBoxGeo(0.09, 0.022, 0.012), sharedBasic(f.lips || 0x5a2a24));
    mo.position.set(0, 1.525, 0.132);
    m.add(mo);
    m.userData.mouth = mo;
    if (f.shades) {
      var s = new THREE.Mesh(sharedBoxGeo(0.28, 0.07, 0.04), sharedBasic(0x0c0a10));
      s.position.set(0, 1.64, 0.135);
      m.add(s);
    }
    if (f.hoops) {
      [-0.14, 0.14].forEach(function (x) {
        var e = new THREE.Mesh(sharedBoxGeo(0.03, 0.07, 0.03), sharedBasic(0xffd24a));
        e.position.set(x, 1.52, 0.02);
        m.add(e);
      });
    }
    // a white suit is a white suit: what is under it is dark
    if (f.shirt === 0xf4f1e8) {
      var v = new THREE.Mesh(sharedBoxGeo(0.14, 0.34, 0.02), sharedLambert(0x2a1830));
      v.position.set(0, 1.28, 0.135);
      m.add(v);
    }
  }
  function figure(id) {
    if (id === 'you') return double();
    if (figs[id]) return figs[id];
    var f = GAME.cast.fig(id);
    if (!f) return null;
    var m = GAME.peds.buildPedMesh({ look: { shirt: f.shirt, pants: f.pants, skin: f.skin, hair: f.hair, hairCol: f.hairCol } });
    dress(m, f);
    figs[id] = m;
    return m;
  }
  // you, as you are dressed today (shops.js): a stand-in, so the real you
  // can stay in the car at the ring while the scene is somewhere else
  function double() {
    var p = P(), j = p.mesh && p.mesh.userData.joints, o = (GAME.prefs && GAME.prefs.outfit) || {};
    if (!j) return null;
    var hm = p.hairMesh && p.hairMesh.children[0];
    var look = { shirt: j.torso.material.color.getHex(), pants: j.legL.children[0].material.color.getHex(),
      skin: j.head.material.color.getHex(), hair: o.hairStyle || 'crew', hairCol: hm ? hm.material.color.getHex() : 0x4a2c18 };
    var m = GAME.peds.buildPedMesh({ look: look });
    dress(m, look);
    return m;
  }

  // ---------- playing one ----------
  // Starts the scene and returns true, then calls done() when it is over —
  // or returns false at once (switched off, nothing to say) and calls
  // nothing, so a caller can run on as it always did.
  function play(script, done) {
    var s = normal(script);
    if (!enabled || !s || cur || !GAME.started || P().state !== 'alive') return false;
    cur = { s: s, shot: -1, line: -1, t: 0, done: done || null, fov: GAME.cameraObj.fov, playerVis: P().mesh.visible,
      on: [], at: null, typed: 0, hold: 0, after: 0, mouth: 0, lineT: 0, cam: null, faces: {} };
    played++;
    GAME.sceneOpen = true;
    if (GAME.hud.cine) GAME.hud.cine(true, function () { advance(); });
    var sk = $('cine-skip');
    if (sk) {
      sk.textContent = GAME.isTouch ? 'TAP · NEXT     SKIP ⏭' : 'SPACE · NEXT     ESC · SKIP';
      sk.onpointerdown = function (e) { e.preventDefault(); e.stopPropagation(); skip(); };
    }
    var sub = $('scene-sub');
    if (sub) sub.classList.remove('on');
    if (GAME.releasePointer) GAME.releasePointer();
    if (GAME.syncOverlayMusic) GAME.syncOverlayMusic();
    if (GAME.track) GAME.track('scene-' + (s.id || 'untitled'));
    return true;
  }

  function cutTo(n) {
    var c = cur, sh = c.s.shots[n];
    clearStage();
    c.shot = n; c.line = -1;
    c.at = sh.set ? stage(sh.set) : null;
    if (c.at) {
      var at = c.at, rx = at.nz, rz = -at.nx;      // the camera's right, along the ground
      (sh.cast || []).forEach(function (id, i) {
        var m = figure(id);
        if (!m) return;
        var side = i ? 1 : -1, x = at.x + rx * 0.8 * side, z = at.z + rz * 0.8 * side;
        var y = GAME.city.groundY(x, z);
        m.position.set(x, y, z);
        // facing the other one, cheated a little toward the camera
        var fx = -rx * side + at.nx * 0.85, fz = -rz * side + at.nz * 0.85;
        m.rotation.set(0, Math.atan2(fx, fz), 0);
        var J = m.userData.joints;
        J.armL.rotation.set(0, 0, 0); J.armR.rotation.set(0, 0, 0); J.legL.rotation.set(0, 0, 0); J.legR.rotation.set(0, 0, 0);
        m.visible = true;
        GAME.scene.add(m);
        c.on.push({ id: id, m: m, x: x, y: y, z: z });
      });
      if (c.on.some(function (o) { return o.id === 'you'; })) P().mesh.visible = false;
    }
    nextLine();
  }
  function clearStage() {
    var c = cur;
    for (var i = 0; i < c.on.length; i++) GAME.scene.remove(c.on[i].m);
    c.on = [];
    P().mesh.visible = c.playerVis;
  }
  function who(id) { for (var i = 0; i < cur.on.length; i++) if (cur.on[i].id === id) return cur.on[i]; return null; }

  function nextLine() {
    var c = cur, sh = c.s.shots[c.shot];
    c.line++;
    if (c.line >= sh.lines.length) {
      if (c.shot + 1 < c.s.shots.length) { cutTo(c.shot + 1); return; }
      end(false);
      return;
    }
    var ln = sh.lines[c.line];
    c.who = ln[0]; c.text = String(ln[1]);
    c.typed = 0; c.hold = 0; c.after = 0; c.lineT = 0; c.blips = 0;
    // the first line of a shot is the two of them; then over the listener's
    // shoulder onto whoever is talking, and back out every third line
    c.cam = c.line === 0 || c.line % 3 === 2 || !who(c.who) || c.on.length < 2 ? 'two' : 'ots';
    var face = $('scene-face'), name = $('scene-name'), sub = $('scene-sub');
    if (face) {
      if (!c.faces[c.who]) c.faces[c.who] = GAME.cast.portrait(c.who);
      face.innerHTML = c.faces[c.who];
    }
    if (name) { name.textContent = GAME.cast.name(c.who) || String(c.who).toUpperCase(); name.style.color = GAME.cast.color(c.who); }
    if (sub) { sub.classList.add('on'); sub.style.borderColor = GAME.cast.color(c.who); }
    showText();
  }
  function showText() {
    var t = $('scene-text');
    if (t) t.textContent = cur.text.slice(0, Math.floor(cur.typed));
  }
  // how long a finished line stays up to be read
  function readFor(text) { return 1.0 + text.length * 0.02; }

  function advance() {
    var c = cur;
    if (!c || c.shot < 0) return false;
    if (c.lineT < 0.15) return true;       // the press that brought this line on
    if (c.typed < c.text.length) { c.typed = c.text.length; c.after = readFor(c.text); showText(); return true; }
    nextLine();
    return true;
  }
  function skip() { if (cur) end(true); return true; }

  function end(skipped) {
    var c = cur;
    if (!c) return;
    clearStage();
    cur = null;
    GAME.sceneOpen = false;
    GAME.cast.hush();
    var cam = GAME.cameraObj;
    if (cam.fov !== c.fov) { cam.fov = c.fov; cam.updateProjectionMatrix(); }
    var sub = $('scene-sub');
    if (sub) sub.classList.remove('on');
    var sk = $('cine-skip');
    if (sk) sk.onpointerdown = null;
    if (GAME.hud.cine) GAME.hud.cine(false);
    if (GAME.syncOverlayMusic) GAME.syncOverlayMusic();
    if (GAME.regainPointer) GAME.regainPointer();
    if (GAME.track && skipped) GAME.track('scene-skipped');
    if (c.done) c.done(!!skipped);
  }

  // ---------- each tick (main.js, in place of the world's) ----------
  var PAUSE = { '.': 0.24, '!': 0.24, '?': 0.24, '—': 0.2, ',': 0.1, ';': 0.12, ':': 0.12 };
  function update(dt) {
    var c = cur;
    if (!c) return;
    c.t += dt;
    if (c.shot < 0) { if (c.t >= OPEN) cutTo(0); return; }
    c.lineT += dt;
    var v = GAME.cast.voice(c.who) || { cps: 34 };
    // the typewriter, a letter at a time, catching its breath at stops
    if (c.typed < c.text.length) {
      if (c.hold > 0) c.hold -= dt;
      else {
        var before = Math.floor(c.typed);
        c.typed = Math.min(c.text.length, c.typed + v.cps * dt);
        for (var i = before; i < Math.floor(c.typed); i++) {
          var ch = c.text.charAt(i);
          if (/[A-Za-z]/.test(ch) && (c.blips++ % 2 === 0)) {
            if (GAME.audio && GAME.audio.babble) GAME.audio.babble(v, ch);
            c.mouth = 0.075;
          }
          if (PAUSE[ch] && i < c.text.length - 1) { c.hold = PAUSE[ch]; c.typed = i + 1; break; }
        }
        showText();
        if (c.typed >= c.text.length) c.after = readFor(c.text);
      }
    } else {
      c.after -= dt;
      if (c.after <= 0) { nextLine(); if (!cur) return; }
    }
    c.mouth -= dt;
    var face = $('scene-face');
    if (face) face.classList.toggle('talk', c.mouth > 0);
    pose(dt);
    shoot();
  }

  // the one talking talks with their hands; everybody breathes
  function pose() {
    var c = cur;
    for (var i = 0; i < c.on.length; i++) {
      var o = c.on[i], J = o.m.userData.joints, talking = o.id === c.who && c.typed < c.text.length;
      var k = c.t * 3.1 + i * 1.7;
      J.armR.rotation.x += ((talking ? -0.35 - 0.3 * Math.abs(Math.sin(k)) : 0) - J.armR.rotation.x) * 0.15;
      J.armL.rotation.x += ((talking ? -0.12 - 0.12 * Math.abs(Math.sin(k * 0.7)) : 0) - J.armL.rotation.x) * 0.15;
      J.torso.position.y = 1.12 + Math.sin(c.t * 1.6 + i) * 0.006;
      if (o.m.userData.mouth) o.m.userData.mouth.scale.y = o.id === c.who && c.mouth > 0 ? 2.8 : 1;
    }
  }

  // the camera: the two-shot creeping in, or over a shoulder
  function shoot() {
    var c = cur, at = c.at;
    if (!at) return;
    var cam = GAME.cameraObj, k = Math.min(1, c.lineT / 6), y = at.y;
    var fov = 38;
    if (c.cam === 'ots') {
      var sp = who(c.who), ls = null;
      for (var i = 0; i < c.on.length; i++) if (c.on[i] !== sp) ls = c.on[i];
      if (sp && ls) {
        var bx = ls.x - sp.x, bz = ls.z - sp.z, bl = Math.hypot(bx, bz) || 1;
        bx /= bl; bz /= bl;
        var d = 1.75 - 0.15 * k;
        cam.position.set(ls.x + bx * d + at.nx * 0.95, ls.y + 1.72, ls.z + bz * d + at.nz * 0.95);
        cam.lookAt(sp.x - bx * 0.25, sp.y + 1.45, sp.z - bz * 0.25);
        fov = 30;
      }
    } else {
      var dd = 5.6 - 0.5 * k;
      cam.position.set(at.x + at.nx * dd, y + 1.45, at.z + at.nz * dd);
      cam.lookAt(at.x, y + 1.5, at.z);
    }
    if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
  }

  // ---------- the keys (main.js hands them over while one plays) ----------
  function key(code) {
    if (!cur) return false;
    if (code === 'Space' || code === 'Enter' || code === 'KeyF' || code === 'KeyE' || code === 'NumpadEnter') return advance();
    if (code === 'Escape' || code === 'Backspace' || code === 'KeyX') return skip();
    return false;
  }

  return {
    play: play,
    update: update,
    key: key,
    advance: advance,
    skip: skip,
    get enabled() { return enabled; },
    set enabled(v) { enabled = !!v; },
    get active() { return !!cur; },
    // headless: what is being said, how far it has typed, where it is
    get line() { return cur && cur.shot >= 0 ? { who: cur.who, text: cur.text, shown: cur.text.slice(0, Math.floor(cur.typed)), shot: cur.shot, cam: cur.cam } : null; },
    get on() { return cur ? cur.on.map(function (o) { return o.id; }) : []; },
    get played() { return played; },
    stage: stage
  };
})();
