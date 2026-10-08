// One landmark a district, on a lot the city's blocks left empty: the places
// Vice City had — a nightclub on the strip, a stadium, a film lot and a
// mansion in the hills — built in Costa Rosa's own boxes, with their names
// on signs painted onto a canvas here.
//
//   THE MALIBU            the club on the Ocean Strip's south end: pink
//                         stucco, neon bands, a marquee, searchlights
//   MEMORIAL STADIUM      Las Colinas: a bowl of stands round a pitch, the
//                         gate open to the road, floodlights on four masts
//   ROSA PICTURES         Centro Alto: a gate arch, two sound stages, a
//                         water tower with the logo, a western street set
//   VILLA SALAZAR         up in the Las Colinas hills: Rico's white villa,
//                         columns, a pool, a wall and a gate
//
// Each faces the road that runs past it; each is solid where it should be
// and open where you would walk or drive in.
GAME.landmarks = (function () {
  var SITES = [
    { id: 'malibu', name: 'THE MALIBU', x: 196, z: 418, lot: 56 },
    { id: 'stadium', name: 'MEMORIAL STADIUM', x: 98, z: 450, lot: 58 },
    { id: 'pictures', name: 'ROSA PICTURES', x: 18, z: 18, lot: 42 },
    { id: 'villa', name: 'VILLA SALAZAR', x: -14, z: -298, lot: 42 }
  ];
  var built = false, signTex = null, list = [];

  // ---------- the signs: one canvas, a row each ----------
  var SIGN_ROWS = [
    { text: 'THE MALIBU', col: '#ff4fa3', font: 'italic 900 50px "Segoe UI", Arial, sans-serif' },
    { text: 'MEMORIAL STADIUM', col: '#38e8ff', font: '900 40px "Segoe UI", Arial, sans-serif' },
    { text: 'ROSA PICTURES', col: '#ffe14f', font: 'italic 900 44px Georgia, serif' },
    { text: 'VILLA SALAZAR', col: '#f4f1e8', font: '700 40px Georgia, serif' }
  ];
  function signs() {
    if (signTex) return signTex;
    var cv = document.createElement('canvas');
    cv.width = 512; cv.height = 256;
    var g = cv.getContext('2d');
    g.fillStyle = '#07040c'; g.fillRect(0, 0, 512, 256);
    SIGN_ROWS.forEach(function (r, i) {
      g.save();
      g.font = r.font; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.shadowColor = r.col; g.shadowBlur = 14;
      g.strokeStyle = r.col; g.lineWidth = 2;
      g.strokeText(r.text, 256, i * 64 + 32, 480);
      g.fillStyle = '#ffffff'; g.shadowBlur = 6;
      g.fillText(r.text, 256, i * 64 + 32, 480);
      g.restore();
    });
    var tex = new THREE.CanvasTexture(cv);
    // (gone from this side once it is on the card, like the city's own)
    tex.onUpdate = function () { tex.onUpdate = null; if (cv.getContext) cv.width = cv.height = 1; };
    signTex = tex;
    return tex;
  }

  // ---------- building in a site's own frame ----------
  // Local +z is the front, toward the road; every box is laid in that frame
  // and turned into the world's. Yaw is a quarter-turn (the streets are a
  // grid), so a solid stays a box the hash can hold.
  function frame(site) {
    var C = GAME.city, rp = C.nearestRoadPoint(site.x, site.z);
    var dx = rp.x - site.x, dz = rp.z - site.z;
    var yaw = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? Math.PI / 2 : -Math.PI / 2) : (dz > 0 ? 0 : Math.PI);
    var c = Math.cos(yaw), s = Math.sin(yaw), gy = C.groundY(site.x, site.z);
    return {
      yaw: yaw, gy: gy,
      at: function (lx, lz) { return { x: site.x + lx * c + lz * s, z: site.z - lx * s + lz * c }; },
      // a box: local centre, size, colour; solid if `solid` (its height)
      box: function (b, lx, ly, lz, w, h, d, col, solid) {
        var p = this.at(lx, lz);
        b.addBox(p.x, gy + ly, p.z, w, h, d, yaw, col, 0);
        if (solid) {
          var q = Math.abs(s) > 0.5;
          C.addSolid(p.x, p.z, q ? d : w, q ? w : d, gy + (solid === true ? ly + h / 2 : solid), 'building');
        }
      }
    };
  }
  function sign(group, F, row, lx, ly, lz, w, h, faceYaw) {
    var p = F.at(lx, lz);
    var geo = new THREE.PlaneGeometry(w, h);
    var uv = geo.attributes.uv;
    for (var i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * 0.25 + (3 - row) * 0.25);
    var m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: signs(), transparent: false }));
    m.position.set(p.x, F.gy + ly, p.z);
    m.rotation.y = F.yaw + (faceYaw || 0);
    group.add(m);
    return m;
  }

  // ---------- THE MALIBU ----------
  function malibu(site, b, glow, group) {
    var F = frame(site), PINK = 0xf2b8d2, TEAL = 0x7fd8d0;
    F.box(b, 0, 4.5, -4, 34, 9, 22, PINK, true);                     // the club
    F.box(b, 0, 10.2, -6, 24, 2.4, 14, PINK, true);                  // the upper deck
    F.box(b, -12, 6, 7.2, 8, 12, 4, TEAL, true);                     // the stair tower
    F.box(b, 0, 3.4, 8.6, 12, 0.3, 5, 0x2a1a30, false);              // the marquee
    F.box(glow, 0, 3.22, 8.6, 12.1, 0.12, 5.1, 0xff4fa3, false);     // its neon underside
    [1.6, 5.2, 8.4].forEach(function (y) { F.box(glow, 0, y, 7.05, 34.2, 0.18, 0.12, y > 5 ? 0x38e8ff : 0xff4fa3, false); });
    F.box(b, 0, 1.4, 7.05, 3.2, 2.8, 0.2, 0x140a1a, false);          // the doors
    F.box(glow, 0, 2.95, 7.1, 3.6, 0.12, 0.12, 0xffe14f, false);
    // two searchlights on the roof, raking the sky
    [-9, 9].forEach(function (x) {
      F.box(b, x, 9.6, -12, 1.4, 1.2, 1.4, 0x2a2a34, false);
      var p = F.at(x, -12), beam = new THREE.Mesh(sharedBoxGeo(0.7, 60, 0.7),
        new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.14, depthWrite: false, blending: THREE.AdditiveBlending }));
      beam.position.set(p.x, F.gy + 10, p.z);
      beam.geometry = beam.geometry;   // (shared box; the beam swings in update)
      beam.userData.sweep = x < 0 ? 0 : 2;
      beam.userData.base = { x: p.x, y: F.gy + 10, z: p.z };
      group.add(beam);
      list.push({ beam: beam });
    });
    sign(group, F, 0, 0, 12.8, 1.2, 18, 2.25);
    return F;
  }

  // ---------- MEMORIAL STADIUM ----------
  function stadium(site, b, glow, group) {
    var F = frame(site), CONC = 0xc8c2b4, SEAT = [0x3a6aa8, 0xd8d8e0, 0xc83a4a];
    F.box(b, 0, 0.04, -2, 40, 0.08, 28, 0x3c8a40, false);           // the pitch
    for (var k = 0; k < 9; k++) F.box(b, -16 + k * 4, 0.1, -2, 2, 0.02, 28, k % 2 ? 0x46944a : 0x3c8a40, false);
    F.box(b, 0, 0.1, -2, 0.2, 0.03, 28, 0xf0f0f0, false);           // the halfway line
    // the stands: three tiers each side and at the back, stepped up and out
    for (var t = 0; t < 3; t++) {
      var h = 1.4 + t * 1.6, off = t * 2.4;
      F.box(b, 0, h / 2, -18.5 - off, 46 + off * 2, h, 2.6, SEAT[t], true);          // back
      F.box(b, -22.5 - off, h / 2, -3, 2.6, h, 34, SEAT[t], true);                   // left
      F.box(b, 22.5 + off, h / 2, -3, 2.6, h, 34, SEAT[t], true);                    // right
      F.box(b, -15 - off, h / 2, 14 + off, 16, h, 2.6, SEAT[t], true);               // front, either side of the gate
      F.box(b, 15 + off, h / 2, 14 + off, 16, h, 2.6, SEAT[t], true);
    }
    F.box(b, 0, 7.2, -25.5, 56, 1.0, 2, CONC, true);                 // the rim at the back
    // the gate, open, under its sign
    F.box(b, -7.5, 4, 21.5, 1.4, 8, 1.4, CONC, true);
    F.box(b, 7.5, 4, 21.5, 1.4, 8, 1.4, CONC, true);
    F.box(b, 0, 8.6, 21.5, 16.4, 1.2, 1.4, CONC, false);
    sign(group, F, 1, 0, 8.6, 22.25, 14, 1.75);
    // floodlights on four masts
    [[-26, -24], [26, -24], [-26, 19], [26, 19]].forEach(function (m) {
      F.box(b, m[0], 9, m[1], 0.8, 18, 0.8, 0x6a6a74, true);
      F.box(glow, m[0], 18.4, m[1], 4.2, 1.6, 0.5, 0xfffbe0, false);
    });
    return F;
  }

  // ---------- ROSA PICTURES ----------
  function pictures(site, b, glow, group) {
    var F = frame(site), STAGE = 0xd8cdb4, ROOF = 0x8a7a64;
    // the arch over the gate
    F.box(b, -5.5, 3.8, 18, 1.4, 7.6, 1.4, 0xe8d8a8, true);
    F.box(b, 5.5, 3.8, 18, 1.4, 7.6, 1.4, 0xe8d8a8, true);
    F.box(b, 0, 8.1, 18, 13, 1.4, 1.6, 0xe8d8a8, false);
    sign(group, F, 2, 0, 8.1, 18.85, 11, 1.4);
    // two sound stages, numbered in big white
    [[-10, -6, 'S1'], [10, -6, 'S2']].forEach(function (st) {
      F.box(b, st[0], 6, st[1], 15, 12, 20, STAGE, true);
      F.box(b, st[0], 12.4, st[1], 15.6, 0.8, 20.6, ROOF, false);
      F.box(b, st[0], 1.8, st[1] + 10.05, 5, 3.6, 0.2, 0x5a4a3a, false);   // the big door
      F.box(glow, st[0] + 3.4, 3.4, st[1] + 10.1, 0.5, 0.5, 0.1, 0xff3030, false);   // ON AIR, near enough
    });
    // the water tower with the logo on it
    F.box(b, 16, 7, 14, 0.6, 14, 0.6, 0x5a5a64, true);
    F.box(b, 19, 7, 14, 0.6, 14, 0.6, 0x5a5a64, false);
    F.box(b, 17.5, 15.5, 14, 5, 3.6, 5, 0xc8c8d0, false);
    F.box(b, 17.5, 17.6, 14, 4, 0.8, 4, 0x8a8a94, false);
    // a western street, front only: a saloon and a jail, propped up behind
    F.box(b, -15, 3.2, 12, 8, 6.4, 0.3, 0xa87848, true);
    F.box(b, -15, 2.2, 12.2, 2, 2.4, 0.1, 0x3a2414, false);
    F.box(b, -15, 6.8, 12.1, 8.4, 0.8, 0.3, 0x7a5030, false);
    F.box(b, -15, 3, 10.4, 0.3, 6, 0.3, 0x5a4a3a, false);
    return F;
  }

  // ---------- VILLA SALAZAR ----------
  function villa(site, b, glow, group) {
    var F = frame(site), WHITE = 0xf2eee4, TILE = 0xb85a3a;
    F.box(b, 0, 4, -6, 24, 8, 14, WHITE, true);                       // the house
    F.box(b, 0, 8.4, -6, 25, 0.8, 15, TILE, false);                   // its roof
    F.box(b, 0, 9.6, -6, 14, 1.6, 8, TILE, false);
    F.box(b, 0, 9.2, 1.2, 10, 0.5, 2.8, WHITE, false);                 // the portico
    [-4, -1.4, 1.4, 4].forEach(function (x) { F.box(b, x, 4.5, 1.6, 0.6, 9, 0.6, 0xfffaf0, true); });
    F.box(b, 0, 0.3, 3, 10, 0.6, 3, 0xe8e0d0, false);                  // the steps
    // the pool, and a fountain on the drive
    F.box(b, 12, 0.2, 6, 8, 0.4, 5, 0xe8e0d0, false);
    F.box(glow, 12, 0.42, 6, 7, 0.06, 4, 0x48c8f0, false);
    F.box(b, -6, 0.6, 10, 3, 1.2, 3, 0xe8e0d0, true);
    F.box(glow, -6, 1.25, 10, 2.4, 0.1, 2.4, 0x7fd8ff, false);
    // the wall round it and the gate in it
    F.box(b, -12.5, 1.3, 18.5, 15, 2.6, 0.6, WHITE, true);
    F.box(b, 12.5, 1.3, 18.5, 15, 2.6, 0.6, WHITE, true);
    F.box(b, -19.7, 1.3, 2, 0.6, 2.6, 33, WHITE, true);
    F.box(b, 19.7, 1.3, 2, 0.6, 2.6, 33, WHITE, true);
    F.box(b, -5, 2, 18.5, 1.2, 4, 1.2, WHITE, true);
    F.box(b, 5, 2, 18.5, 1.2, 4, 1.2, WHITE, true);
    F.box(glow, -5, 4.2, 18.5, 0.8, 0.5, 0.8, 0xffe8a0, false);
    F.box(glow, 5, 4.2, 18.5, 0.8, 0.5, 0.8, 0xffe8a0, false);
    sign(group, F, 3, 10.5, 1.6, 18.85, 6.4, 0.8);
    return F;
  }

  var BUILD = { malibu: malibu, stadium: stadium, pictures: pictures, villa: villa };
  function build() {
    if (built || !GAME.city || !GAME.city.hash) return;
    built = true;
    var b = new GeoBatch(), glow = new GeoBatch(), group = new THREE.Group();
    SITES.forEach(function (s) { s.frame = BUILD[s.id](s, b, glow, group); });
    var mesh = new THREE.Mesh(b.build(), sharedVertexLambert());
    var lit = new THREE.Mesh(glow.build(), sharedVertexBasic());
    mesh.matrixAutoUpdate = false; lit.matrixAutoUpdate = false;
    group.add(mesh); group.add(lit);
    GAME.scene.add(group);
    // built after the city packed and released its own, so through the same
    [mesh, lit].forEach(function (m) { packStatic(m); releaseStatic(m); });
  }
  // the searchlights sweep the sky over the club
  function update(dt) {
    if (!built) return;
    var t = GAME.time;
    for (var i = 0; i < list.length; i++) {
      var bm = list[i].beam, ph = t * 0.6 + bm.userData.sweep;
      bm.rotation.set(0.35 * Math.sin(ph), 0, 0.35 * Math.cos(ph * 0.8));
      var bs = bm.userData.base;
      bm.position.set(bs.x + Math.sin(bm.rotation.z) * -30, bs.y + 29, bs.z + Math.sin(bm.rotation.x) * 30);
      // only after dark
      bm.visible = GAME.timeOfDay < 0.45;
    }
  }

  return {
    build: build,
    update: update,
    sites: function () { return SITES; },
    near: function (x, z, r) {
      for (var i = 0; i < SITES.length; i++) if (U.dist2(x, z, SITES[i].x, SITES[i].z) < r * r) return SITES[i];
      return null;
    }
  };
})();
