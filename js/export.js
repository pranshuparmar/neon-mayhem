// Import/export: a crane on the harbour with a board of
// wanted cars beside it. Bring one that is on a list into the ring, in one
// piece, and it goes up on the hook and out on the next boat: paid for what
// it is and the state it is in, ticked off the board, and not wanted again.
// Fill a list and the buyer pays a bonus on top.
GAME.exporter = (function () {
  var LISTS = [
    { name: 'LIST ONE', bonus: 4000, cars: ['sedan', 'taxi', 'van', 'sports', 'motorcycle', 'police'] },
    { name: 'LIST TWO', bonus: 8000, cars: ['ambulance', 'pickup', 'limo', 'buggy', 'icecream', 'superbike'] }
  ];
  var PAY = { sedan: 600, taxi: 700, van: 800, sports: 1500, motorcycle: 900, police: 1800,
    ambulance: 1400, pickup: 1100, limo: 2200, buggy: 1000, icecream: 1600, superbike: 3000 };
  var RING_R = 6, MIN_HP = 0.4;
  var site = null, ring = null, board = null, boardTex = null, boardCv = null, enabled = true, hint = '';

  function prefs() { GAME.prefs = GAME.prefs || {}; return GAME.prefs.exported || (GAME.prefs.exported = {}); }
  function wanted(type) {
    if (prefs()[type]) return false;
    for (var i = 0; i < LISTS.length; i++) if (LISTS[i].cars.indexOf(type) >= 0) return true;
    return false;
  }
  function listOf(type) { for (var i = 0; i < LISTS.length; i++) if (LISTS[i].cars.indexOf(type) >= 0) return LISTS[i]; return null; }
  function done(list) { return list.cars.every(function (t) { return !!prefs()[t]; }); }
  function label(type) { var s = GAME.vehicles.TYPES[type]; return s ? s.label.toUpperCase() : type.toUpperCase(); }

  // ---------- the place: a crane on the quay, a board, a ring ----------
  function build() {
    if (site || !GAME.city || !GAME.city.hash) return;
    var C = GAME.city, rp = C.nearestRoadPoint(-330, 292);
    var h = rp.axis === 'net' ? rp.heading : rp.axis === 'z' ? 0 : Math.PI / 2;
    var sx = Math.cos(h), sz = -Math.sin(h);
    site = { x: rp.x, z: rp.z, y: C.groundY(rp.x, rp.z), side: { x: sx, z: sz } };
    // the ring, in the road: driven into
    ring = new THREE.Mesh(new THREE.CylinderGeometry(RING_R, RING_R, 0.2, 28, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffb35a, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
    ring.position.set(site.x, site.y + 0.3, site.z);
    GAME.scene.add(ring);
    // the crane and the board on the kerb beside it
    var kx = site.x + sx * 9.4 - sz * 6, kz = site.z + sz * 9.4 + sx * 6, ky = C.groundY(kx, kz);
    // (where the hook hangs: a car that ships goes up to it)
    site.hook = { x: kx - sx * 11, y: ky + 7.2, z: kz - sz * 11 };
    var g = new THREE.Group();
    function piece(x, y, z, w, hh, d, col) {
      var m = new THREE.Mesh(sharedBoxGeo(w, hh, d), sharedLambert(col));
      m.position.set(x, y, z); g.add(m); return m;
    }
    piece(kx, ky + 9, kz, 1.4, 18, 1.4, 0xd8a83a);                                 // the mast
    var arm = piece(kx - sx * 6, ky + 18.4, kz - sz * 6, Math.abs(sx) > 0.5 ? 14 : 1, 1, Math.abs(sx) > 0.5 ? 1 : 14, 0xd8a83a);
    piece(kx - sx * 11, ky + 13, kz - sz * 11, 0.1, 10, 0.1, 0x2a2a2a);            // the cable
    piece(kx - sx * 11, ky + 8, kz - sz * 11, 1.2, 0.6, 1.2, 0x3a3a3a);            // the hook
    piece(kx, ky + 1, kz, 3, 2, 3, 0x6a6a72);                                      // its footing
    C.addSolid(kx, kz, 3, 3, ky + 18);
    // the board: a canvas, redrawn when a car goes out
    boardCv = document.createElement('canvas');
    boardCv.width = 256; boardCv.height = 256;
    boardTex = new THREE.CanvasTexture(boardCv);
    board = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ map: boardTex }));
    var bx = site.x + sx * 8.8 + sz * 5, bz = site.z + sz * 8.8 - sx * 5;
    board.position.set(bx, C.groundY(bx, bz) + 2.6, bz);
    board.rotation.y = Math.atan2(-sx, -sz);
    g.add(board);
    piece(bx, C.groundY(bx, bz) + 0.4, bz, 0.25, 0.8, 0.25, 0x3a3a3a);
    GAME.scene.add(g);
    paint();
  }
  function paint() {
    if (!boardCv) return;
    var c = boardCv.getContext('2d');
    c.fillStyle = '#10141c'; c.fillRect(0, 0, 256, 256);
    c.strokeStyle = '#ffb35a'; c.lineWidth = 4; c.strokeRect(2, 2, 252, 252);
    c.fillStyle = '#ffb35a'; c.font = '900 20px "Segoe UI", Arial, sans-serif'; c.textAlign = 'center';
    c.fillText('EXPORT — WANTED', 128, 26);
    c.textAlign = 'left'; c.font = '700 13px "Segoe UI", Arial, sans-serif';
    var y = 48;
    LISTS.forEach(function (L) {
      c.fillStyle = done(L) ? '#7dff6a' : '#9fd8ff';
      c.fillText(L.name + (done(L) ? ' — DONE' : ''), 12, y); y += 16;
      L.cars.forEach(function (t) {
        var got = !!prefs()[t];
        c.fillStyle = got ? '#5a6a5a' : '#f4ecff';
        c.fillText((got ? '✓ ' : '· ') + label(t), 20, y); y += 15;
      });
      y += 6;
    });
    if (boardTex) boardTex.needsUpdate = true;
  }

  // ---------- each tick ----------
  function update(dt) {
    if (!enabled || !GAME.started) return;
    if (!site) build();
    if (!site) return;
    ring.material.opacity = 0.4 + 0.2 * Math.sin(GAME.time * 3);
    var P = GAME.player, f = GAME.focus();
    var d2 = U.dist2(f.x, f.z, site.x, site.z);
    ring.visible = d2 < 300 * 300;
    if (d2 > 40 * 40 || P.state !== 'alive') { hint = ''; return; }
    var car = P.inCar && P.car;
    if (!car) { hint = 'EXPORT — bring a car off the board into the ring'; return; }
    if (!wanted(car.type)) { hint = prefs()[car.type] ? 'EXPORT — already shipped one of those' : 'EXPORT — nobody wants a ' + label(car.type); return; }
    if (car.hp < car.spec.hp * MIN_HP) { hint = 'EXPORT — they want it in one piece. Fix it up first.'; return; }
    hint = 'EXPORT — ' + label(car.type) + ' wanted: drive into the ring and stop';
    if (d2 < RING_R * RING_R && Math.abs(car.speed) < 1.5 && !(GAME.missions && GAME.missions.active)) ship(car);
  }
  function ship(car) {
    var type = car.type, L = listOf(type);
    var pay = Math.round((PAY[type] || 500) * (0.5 + 0.5 * car.hp / car.spec.hp) / 10) * 10;
    prefs()[type] = true;
    GAME.exitCar();
    // up on the hook and over to the boat — it does not just blink out of
    // the ring in front of you
    GAME.vehicles.stow(car, site.hook || { x: car.pos.x, y: car.pos.y + 9, z: car.pos.z }, 4.5);
    GAME.addCash(pay);
    GAME.audio.sting('win');
    GAME.hud.message('EXPORTED: ' + label(type) + '  +$' + pay, 4);
    var finished = L && done(L);
    if (finished) {
      GAME.addCash(L.bonus);
      GAME.hud.message(L.name + ' COMPLETE — the buyer pays a bonus: +$' + L.bonus, 5);
      if (GAME.hud.pager) GAME.hud.pager('LOLA', 'Heard you filled a whole list down at the docks. The buyer wants to know who you are. I said nobody.', 7);
    }
    paint();
    if (GAME.track) GAME.track('export-' + type);
    if (GAME.save) GAME.save();
  }

  return {
    update: update,
    get hint() { return hint; },
    get site() { return site; },
    wanted: wanted,
    LISTS: LISTS,
    get enabled() { return enabled; },
    set enabled(v) { enabled = !!v; },
    blip: function () { return site ? { x: site.x, z: site.z, color: '#ffb35a' } : null; }
  };
})();
