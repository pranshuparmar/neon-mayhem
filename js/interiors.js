// Interiors you can walk into.
//
// Every door in the city was a menu: step on the mat of the condo you own and
// a SLEEP IT OFF card came up on the pavement; the casino was a counter on the
// pier. Now the homes you own and the casino are rooms. Step on the mat and
// you go in — a bed at the back of your place (it is where you sleep it off
// now), a couch and a TV and a window on the night; the Lucky Gull's wheel up
// on the back wall, a bar with drinks that patch you up, slot machines, and a
// floor of people who are not going anywhere. Step back on the mat by the
// door to leave.
//
// The rooms are built out past the edge of the world, in the fog nobody flies
// into, and while you are in one the rest of the game goes on around its
// front door: that is where the streets stay filled, where the radar points,
// and where anybody hunting you is waiting when you come back out. Nobody
// sees you in there — a home is somewhere to lie low — but the casino's
// doorman will not let you in with the law on your tail.
GAME.interiors = (function () {
  var ROOM_X = -3400, ROOM_GAP = 80, FADE = 0.45;
  var ROOMS = [
    { id: 'home_dock', name: 'DOCKSIDE FLAT', kind: 'home', layout: 'flat', w: 9, d: 8, h: 3.0,
      floor: 0x7a6248, wall: 0xa59a86, trim: 0x5a4a3a, accent: 0x38b8c8, sofa: 0x6a7a8a,
      where: 'the bed is at the back, your wardrobe on the left' },
    { id: 'home_condo', name: 'STRIP CONDO', kind: 'home', layout: 'condo', w: 14, d: 11, h: 3.2,
      floor: 0x2e2440, wall: 0xe8dff0, trim: 0x8a6ab0, accent: 0xff4fa3, sofa: 0xf0f0f4,
      where: 'the bedroom is through the door at the back, your wardrobe in it' },
    { id: 'home_villa', name: 'MARINA VILLA', kind: 'home', layout: 'villa', w: 18, d: 14, h: 7.2, upper: 3.6,
      floor: 0xd8c8a8, wall: 0xf6f1e6, trim: 0xb8a888, accent: 0x38b8c8, sofa: 0x3a8a9a,
      where: 'the bedroom is up the stairs, your wardrobe with it' },
    { id: 'casino0', name: 'THE LUCKY GULL', kind: 'casino', w: 24, d: 18, h: 5.5,
      floor: 0x6a1428, wall: 0x2a1236, trim: 0xffd24a, accent: 0xff4fa3, music: true }
  ];
  // Every business has a room too: walk in through the door, do your
  // business at the counter, walk out. One template per trade; each shop in
  // the world gets its own room from it at build time (shops.js has the
  // list), so both hardware stores and every station's desk have one.
  // Gran Rosa Motors has none: its glass hall is walked into where it stands
  // (shops.js builds it; the halls below keep the camera under its roof).
  var SHOP_ROOMS = {
    hardware: { w: 12, d: 10, h: 3.4, floor: 0x45464c, wall: 0x7a7a62, trim: 0x2a2a22, accent: 0xffd24a,
      hello: ' — guns on the wall, the counter at the back.' },
    dress: { w: 12, d: 10, h: 3.4, floor: 0xe6dce6, wall: 0xf6e6ee, trim: 0xd86aa8, accent: 0xff8fd0,
      hello: ' — the racks are on the walls, the mirror at the back.' },
    barber: { w: 10, d: 9, h: 3.2, floor: 0xeeeeee, wall: 0xdcecf4, trim: 0x3a6a8a, accent: 0x8fd0ff,
      hello: ' — take the empty chair.' },
    bribe: { w: 12, d: 10, h: 3.6, floor: 0x5c6272, wall: 0xb4bccc, trim: 0x22305a, accent: 0x4da3ff,
      hello: ' — the sergeant is at the desk.' },
    bank: { w: 18, d: 14, h: 4.6, floor: 0xd8d2c4, wall: 0xece4d0, trim: 0x2e4a3a, accent: 0xe8c86a,
      hello: ' — the tellers are at the back, the vault behind the rope.' }
  };
  var byId = {};
  var cur = null;            // { room, loc, door: {x,y,z}, heading }
  var pending = null;        // a fade in progress: { t, fn, half }
  var built = false;

  // ---------- building ----------
  // Unlit, with the light baked into the faces: a room looks the same at
  // midnight as at noon, which is what a lit room does.
  function shade(b, from) {
    for (var i = from; i < b.n; i++) {
      var ny = b.nrm[i * 3 + 1], nx = b.nrm[i * 3];
      var k = ny > 0.5 ? 1 : ny < -0.5 ? 0.55 : Math.abs(nx) > 0.5 ? 0.84 : 0.7;
      b.col[i * 3] *= k; b.col[i * 3 + 1] *= k; b.col[i * 3 + 2] *= k;
    }
  }
  function box(b, x, y, z, w, h, d, color) {
    var n0 = b.n;
    b.addBox(x, y, z, w, h, d, 0, color, 0);
    shade(b, n0);
  }
  // (minY: a solid on an upper floor, which the floor below walks under)
  function solid(x, z, w, d, h, minY) { GAME.city.addSolid(x, z, w, d, h, 'prop', false, minY); }
  // A mat on the floor at height y (0: downstairs), and `via`, the way to it
  // from the front door where a straight line would meet a wall: a doorway,
  // the foot and the head of the stairs.
  function ring(room, x, z, color, label, act, y, via) {
    var m = new THREE.Mesh(new THREE.RingGeometry(0.75, 1.0, 32), new THREE.MeshBasicMaterial({
      color: color, transparent: true, opacity: 0.7, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, (y || 0) + 0.04, z);
    GAME.scene.add(m);
    room.rings.push({ x: x, z: z, y: y || 0, via: via || null, mesh: m, label: label, act: act, armed: false });
  }
  function glow(x, y, z, w, h, d, color) {
    var m = new THREE.Mesh(sharedBoxGeo(w, h, d), sharedBasic(color));
    m.position.set(x, y, z);
    GAME.scene.add(m);
    return m;
  }
  function figure(x, z, heading, look) {
    var m = GAME.peds.buildPedMesh(look || {});
    m.position.set(x, 0, z);
    m.rotation.y = heading;
    GAME.scene.add(m);
    return m;
  }

  function buildRoom(b, room, i) {
    var ox = ROOM_X - i * ROOM_GAP, oz = 0, w = room.w, d = room.d, h = room.h;
    room.ox = ox; room.oz = oz;
    room.rings = []; room.anim = [];
    room.entry = { x: ox, z: oz - d / 2 + 1.7 };
    // what you stand on (a deck: out here it would otherwise be open sea)
    GAME.city.addDeck({ x: ox, z: oz, w: w, len: d, rot: 0, y0: 0, y1: 0 });
    box(b, ox, -0.1, oz, w, 0.2, d, room.floor);
    box(b, ox, h + 0.1, oz, w + 0.6, 0.2, d + 0.6, room.kind === 'casino' ? 0x1a0a22 : 0xf4f0ea);
    // four walls, solid, and a skirting board round the bottom
    box(b, ox, h / 2, oz + d / 2 + 0.15, w + 0.6, h, 0.3, room.wall);
    box(b, ox, h / 2, oz - d / 2 - 0.15, w + 0.6, h, 0.3, room.wall);
    box(b, ox - w / 2 - 0.15, h / 2, oz, 0.3, h, d, room.wall);
    box(b, ox + w / 2 + 0.15, h / 2, oz, 0.3, h, d, room.wall);
    GAME.city.addSolid(ox, oz + d / 2 + 0.4, w + 1.4, 0.8, h + 0.4, 'building');
    GAME.city.addSolid(ox, oz - d / 2 - 0.4, w + 1.4, 0.8, h + 0.4, 'building');
    GAME.city.addSolid(ox - w / 2 - 0.4, oz, 0.8, d + 1.4, h + 0.4, 'building');
    GAME.city.addSolid(ox + w / 2 + 0.4, oz, 0.8, d + 1.4, h + 0.4, 'building');
    box(b, ox, 0.08, oz + d / 2 - 0.02, w, 0.16, 0.04, room.trim);
    box(b, ox - w / 2 + 0.02, 0.08, oz, 0.04, 0.16, d, room.trim);
    box(b, ox + w / 2 - 0.02, 0.08, oz, 0.04, 0.16, d, room.trim);
    // the way you came in, and the mat that takes you back out
    box(b, ox, 1.15, oz - d / 2 + 0.04, 1.4, 2.3, 0.08, room.kind === 'casino' ? 0x3a2410 : room.trim);
    box(b, ox + 0.5, 1.1, oz - d / 2 + 0.1, 0.08, 0.08, 0.08, 0xffd24a);
    ring(room, ox, oz - d / 2 + 1.0, 0x8de8b0, 'EXIT — step on to go back out', exitRoom);
    if (room.kind === 'home') furnishHome(b, room);
    else if (room.kind === 'shop') furnishShop(b, room);
    else furnishCasino(b, room);
  }

  // ---------- homes ----------
  // Each place is laid out the way its outside promises. The Dockside Flat
  // is a harbor box, and inside it is one room: you walk in on the bed. The
  // Strip Condo is a slim tower flat — a living room with the kitchen and the
  // neon out the window, and the bedroom through a door at the back. The
  // Marina Villa is the two-tier spread it looks like from the road: a hall,
  // a lounge under a double-height ceiling, a kitchen and a dining table
  // under the gallery, and stairs up to the bedroom.
  function openHome() { if (GAME.shops && cur && cur.loc) GAME.shops.open(cur.loc); }
  // what stands at y0 (0 downstairs) is solid on its own floor only
  function solidAt(x, z, w, d, h, y0) { if (y0) solid(x, z, w, d, y0 + h, y0); else solid(x, z, w, d, h); }
  function bed(b, room, bx, bz, y0, side, via) {
    box(b, bx, y0 + 0.22, bz, 2.0, 0.44, 2.6, room.trim);
    box(b, bx, y0 + 0.56, bz, 1.86, 0.24, 2.46, 0xf4f0ea);
    box(b, bx, y0 + 0.74, bz + 0.92, 1.4, 0.14, 0.42, 0xffffff);
    box(b, bx, y0 + 0.71, bz - 0.38, 1.9, 0.1, 1.66, room.accent);
    box(b, bx, y0 + 0.85, bz + 1.32, 2.0, 1.2, 0.12, room.trim);
    solidAt(bx, bz, 2.0, 2.6, 0.7, y0);
    // a nightstand and its lamp, on the side away from the mat (if the wall
    // is not right there)
    var nx = bx - side * 1.35;
    if (Math.abs(nx - room.ox) < room.w / 2 - 0.3) {
      box(b, nx, y0 + 0.3, bz + 0.9, 0.5, 0.6, 0.5, room.trim);
      glow(nx, y0 + 0.78, bz + 0.9, 0.26, 0.3, 0.26, 0xffe2a8);
      solidAt(nx, bz + 0.9, 0.5, 0.5, 0.6, y0);
    }
    ring(room, bx + side * 1.75, bz - 0.5, room.accent, 'YOUR BED — step on to sleep it off', openHome, y0, via);
  }
  // a wardrobe against a side wall; face is the way its doors open (+1: +x)
  function wardrobe(b, room, wx, wz, y0, face, via) {
    var door = (room.trim & 0xfefefe) >> 1;
    box(b, wx, y0 + 1.05, wz, 0.6, 2.1, 1.3, room.trim);
    box(b, wx + face * 0.31, y0 + 1.05, wz - 0.32, 0.02, 1.9, 0.6, door);
    box(b, wx + face * 0.31, y0 + 1.05, wz + 0.32, 0.02, 1.9, 0.6, door);
    box(b, wx + face * 0.33, y0 + 1.1, wz - 0.06, 0.04, 0.16, 0.04, 0xffd24a);
    box(b, wx + face * 0.33, y0 + 1.1, wz + 0.06, 0.04, 0.16, 0.04, 0xffd24a);
    solidAt(wx, wz, 0.6, 1.3, 2.1, y0);
    ring(room, wx + face * 1.25, wz, room.accent, 'YOUR WARDROBE — step on to change', function () {
      if (GAME.shops) GAME.shops.open(WARDROBE);
    }, y0, via);
  }
  // a couch facing (fx, fz) — one of them 0 — and a TV facing back at it
  function couch(b, room, cx, cz, fx, fz, y0) {
    var alongX = fz !== 0;
    function part(lx, lz, w, h, d, y) {
      var x = alongX ? cx + lx : cx + lz * fx, z = alongX ? cz + lz * fz : cz + lx;
      box(b, x, y0 + y, z, alongX ? w : d, h, alongX ? d : w, room.sofa);
    }
    part(0, 0, 2.6, 0.48, 0.95, 0.24);
    part(0, -0.4, 2.6, 0.8, 0.2, 0.62);
    part(-1.38, 0, 0.18, 0.8, 0.95, 0.4);
    part(1.38, 0, 0.18, 0.8, 0.95, 0.4);
    solidAt(alongX ? cx : cx - fx * 0.1, alongX ? cz - fz * 0.1 : cz, alongX ? 3.0 : 1.1, alongX ? 1.1 : 3.0, 0.8, y0);
  }
  function tv(b, room, x, z, fx, fz, y0) {
    var alongX = fz !== 0;
    box(b, x, y0 + 0.3, z, alongX ? 1.8 : 0.5, 0.6, alongX ? 0.5 : 1.8, room.trim);
    box(b, x, y0 + 1.1, z, alongX ? 1.5 : 0.1, 0.9, alongX ? 0.1 : 1.5, 0x101016);
    solidAt(x, z, alongX ? 1.8 : 0.6, alongX ? 0.6 : 1.8, 1.5, y0);
    var screen = glow(x + fx * 0.06, y0 + 1.1, z + fz * 0.06, alongX ? 1.34 : 0.02, 0.76, alongX ? 0.02 : 1.34, 0x5a8ad8);
    screen.material = new THREE.MeshBasicMaterial({ color: 0x5a8ad8 });
    room.anim.push({ tv: screen });
  }
  // A window on the night, on a wall running along x (alongX) or z; nrm is
  // the side the room is on (+1/-1 along the wall's normal). 'city' is a
  // skyline with lit windows, 'sea' the marina: water, the far shore, masts.
  function nightWindow(b, x, z, alongX, nrm, w, y0, hgt, view) {
    var cy = y0 + 0.9 + hgt / 2;
    function bx(a, off, ww, hh, dd, y, col) {
      box(b, alongX ? x + a : x + nrm * off, y, alongX ? z + nrm * off : z + a, alongX ? ww : dd, hh, alongX ? dd : ww, col);
    }
    bx(0, 0, w, hgt, 0.04, cy, 0x0c1430);
    var n = Math.max(3, Math.round((w - 0.3) / 0.3) + 1), lo = cy - hgt / 2;
    for (var k = 0; k < n; k++) {
      var a = -w / 2 + 0.15 + k * (w - 0.3) / (n - 1), q = (k * 37) % 7;
      if (view === 'sea') {
        if (k % 3 === 1) {
          bx(a, 0.03, 0.04, hgt * 0.45, 0.02, lo + 0.2 + hgt * 0.225, 0xc8d0e0);           // a mast
          bx(a, 0.04, 0.06, 0.06, 0.02, lo + 0.2 + hgt * 0.45, 0xffe9a0);                  // its light
        }
      } else {
        var bh = Math.min(hgt * 0.8, 0.3 + q * 0.12);
        bx(a, 0.03, 0.22, bh, 0.02, lo + bh / 2 + 0.05, 0x1c2850);
        bx(a, 0.04, 0.05, 0.05, 0.02, lo + 0.05 + bh * 0.6, 0xffe9a0);
      }
    }
    if (view === 'sea') {
      bx(0, 0.02, w, 0.2, 0.02, lo + 0.1, 0x123a5a);                // the water
      bx(0, 0.025, w, 0.03, 0.02, lo + 0.22, 0x2a7a9a);             // a line of moonlight on it
      bx(0, 0.02, w, 0.12, 0.02, lo + hgt * 0.62, 0x1a2440);        // the far shore
    }
    bx(0, 0.03, w - 0.2, 0.04, 0.02, lo + hgt - 0.06, 0xff4fa3);   // the neon line up top
    bx(0, 0.05, w + 0.1, 0.06, 0.06, cy, 0x8a8a90);                 // the transom
  }
  function plant(b, x, z, y0) {
    box(b, x, y0 + 0.25, z, 0.5, 0.5, 0.5, 0xb06a3a);
    box(b, x, y0 + 0.8, z, 0.7, 0.7, 0.7, 0x3a8a4a);
    box(b, x, y0 + 1.25, z, 0.45, 0.45, 0.45, 0x4aa05a);
    solidAt(x, z, 0.6, 0.6, 1.0, y0);
  }
  function floorLamp(b, x, z, y0) {
    box(b, x, y0 + 0.8, z, 0.08, 1.6, 0.08, 0x30303a);
    glow(x, y0 + 1.7, z, 0.5, 0.36, 0.5, 0xffe2a8);
  }
  function rug(b, x, z, w, d, y0, col) { box(b, x, y0 + 0.012, z, w, 0.024, d, col); }
  // a kitchen run along a wall: base units, the worktop, the cupboards
  function kitchen(b, x, z, alongX, len, nrm, y0) {
    var off = 0.45 * nrm;
    var bx2 = alongX ? x : x + off, bz2 = alongX ? z + off : z;
    box(b, bx2, y0 + 0.45, bz2, alongX ? len : 0.8, 0.9, alongX ? 0.8 : len, 0xd8d8e0);
    box(b, bx2, y0 + 0.92, bz2, alongX ? len + 0.06 : 0.86, 0.06, alongX ? 0.86 : len + 0.06, 0x30303a);
    var ux = alongX ? x : x + 0.2 * nrm, uz = alongX ? z + 0.2 * nrm : z;
    box(b, ux, y0 + 1.75, uz, alongX ? len - 0.4 : 0.4, 0.7, alongX ? 0.4 : len - 0.4, 0xe8e8f0);
    solidAt(bx2, bz2, alongX ? len : 0.8, alongX ? 0.8 : len, 1.0, y0);
  }
  function table(b, x, z, w, d, y0, col, chairs) {
    box(b, x, y0 + 0.74, z, w, 0.06, d, col);
    box(b, x, y0 + 0.37, z, 0.14, 0.74, 0.14, 0x30303a);
    solidAt(x, z, w, d, 0.8, y0);
    for (var c = 0; c < (chairs || 0); c++) {
      var side = c % 2 ? 1 : -1, along = Math.floor(c / 2), na = Math.ceil(chairs / 2);
      var cx = x + (na > 1 ? -w / 2 + w * (along + 0.5) / na : 0), cz = z + side * (d / 2 + 0.35);
      box(b, cx, y0 + 0.45, cz, 0.42, 0.06, 0.42, 0x6a4a32);
      box(b, cx, y0 + 0.75, cz + side * 0.19, 0.42, 0.55, 0.05, 0x6a4a32);
    }
  }
  // an inside wall along x at z, from x0 to x1, with a doorway (y0: its floor)
  function partition(b, room, z, x0, x1, doorX, doorW, y0, top) {
    var hh = top - y0, d0 = doorX - doorW / 2, d1 = doorX + doorW / 2;
    [[x0, d0], [d1, x1]].forEach(function (seg) {
      var len = seg[1] - seg[0];
      if (len <= 0.05) return;
      box(b, (seg[0] + seg[1]) / 2, y0 + hh / 2, z, len, hh, 0.2, room.wall);
      solidAt((seg[0] + seg[1]) / 2, z, len, 0.24, hh, y0);
    });
    box(b, doorX, top - (hh - 2.3) / 2, z, doorW, hh - 2.3, 0.2, room.wall);    // over the door
    box(b, doorX, y0 + 2.32, z, doorW + 0.16, 0.06, 0.26, room.trim);           // the frame
    box(b, d0 - 0.04, y0 + 1.15, z, 0.08, 2.3, 0.26, room.trim);
    box(b, d1 + 0.04, y0 + 1.15, z, 0.08, 2.3, 0.26, room.trim);
  }

  function furnishHome(b, room) {
    if (room.layout === 'villa') furnishVilla(b, room);
    else if (room.layout === 'condo') furnishCondo(b, room);
    else furnishFlat(b, room);
  }
  // one room: the bed at the back, a couch and a TV, a window on the night
  function furnishFlat(b, room) {
    var ox = room.ox, oz = room.oz, w = room.w, d = room.d;
    rug(b, ox, oz + 0.3, w * 0.42, d * 0.38, 0, (room.accent & 0xfefefe) >> 1);
    bed(b, room, ox + w / 2 - 1.3, oz + d / 2 - 1.6, 0, -1);
    couch(b, room, ox - w / 2 + 2.2, oz + d / 2 - 3.4, 0, 1, 0);
    tv(b, room, ox - w / 2 + 2.2, oz + d / 2 - 0.5, 0, -1, 0);
    nightWindow(b, ox - 0.2, oz + d / 2 - 0.02, true, -1, 2.8, 0, 1.4, 'city');
    floorLamp(b, ox - w / 2 + 0.6, oz - d / 2 + 0.9, 0);
    plant(b, ox + w / 2 - 0.6, oz - d / 2 + 0.9, 0);
    wardrobe(b, room, ox - w / 2 + 0.35, oz - 0.5, 0, 1);
    box(b, ox + w / 4, 1.7, oz - d / 2 + 0.03, 1.2, 0.8, 0.04, room.accent);
    box(b, ox + w / 4, 1.7, oz - d / 2 + 0.05, 1.0, 0.6, 0.04, 0xf4e0c0);
  }
  // a living room with the kitchen, and the bedroom through a door at the back
  function furnishCondo(b, room) {
    var ox = room.ox, oz = room.oz, w = room.w, d = room.d, h = room.h;
    var pz = oz + 1.0, doorX = ox + 3.6;
    var via = [{ x: doorX, z: pz - 1.2 }, { x: doorX, z: pz + 1.2 }];
    room.via = via;
    // the bedroom
    bed(b, room, ox - 3.4, oz + d / 2 - 1.6, 0, 1, via);
    wardrobe(b, room, ox + w / 2 - 0.35, oz + d / 2 - 1.7, 0, -1, via);
    rug(b, ox - 1.2, oz + 3.2, 4.2, 2.6, 0, (room.accent & 0xfefefe) >> 1);
    nightWindow(b, ox + 1.6, oz + d / 2 - 0.02, true, -1, 3.0, 0, 1.4, 'city');
    partition(b, room, pz, ox - w / 2, ox + w / 2, doorX, 1.6, 0, h);
    // the living room: the TV against the bedroom wall, the couch facing it
    tv(b, room, ox - 3.2, pz - 0.45, 0, -1, 0);
    couch(b, room, ox - 3.2, oz - 2.1, 0, 1, 0);
    rug(b, ox - 3.2, oz - 0.9, 3.8, 2.6, 0, 0x3a2a5a);
    kitchen(b, ox - w / 2, oz - 3.0, false, 3.4, 1, 0);
    table(b, ox + 2.6, oz - 3.1, 1.4, 0.9, 0, 0x8a6ab0, 2);
    // neon out every window: the long one down the right-hand wall
    nightWindow(b, ox + w / 2 - 0.02, oz - 2.3, false, -1, 3.8, 0, 1.6, 'city');
    floorLamp(b, ox - w / 2 + 0.6, oz - d / 2 + 0.6, 0);
    plant(b, ox + w / 2 - 0.6, oz - d / 2 + 0.7, 0);
    box(b, ox + w / 4, 1.7, oz - d / 2 + 0.03, 1.2, 0.8, 0.04, room.accent);
    box(b, ox + w / 4, 1.7, oz - d / 2 + 0.05, 1.0, 0.6, 0.04, 0xf4e0c0);
    glow(ox - 2, h - 0.06, oz - 2, 2.4, 0.05, 0.3, 0xfff2dc);
    glow(ox - 1, h - 0.06, oz + 3.2, 2.0, 0.05, 0.3, 0xfff2dc);
  }
  // two storeys: the hall and the lounge, the kitchen and the dining table
  // under the gallery, and the stairs up to the bedroom
  function furnishVilla(b, room) {
    var ox = room.ox, oz = room.oz, w = room.w, d = room.d, h = room.h;
    var Y = room.upper, under = Y - 0.25;
    var sx = ox - w / 2 + 0.8, sw = 1.5, s0 = oz - 6.0, s1 = oz;      // the stairs
    var up = [{ x: sx, z: s0 - 0.5 }, { x: sx, z: s1 + 0.9 }];
    room.via = up;
    room.slab = { y: Y, under: under, minX: ox - w / 2, maxX: ox + w / 2, minZ: s1, maxZ: oz + d / 2 };
    // ---- upstairs: the floor, and the bedroom on it
    GAME.city.addDeck({ x: ox, z: (s1 + oz + d / 2) / 2, w: w, len: oz + d / 2 - s1, rot: 0, y0: Y, y1: Y, floor: true });
    box(b, ox, Y - 0.125, (s1 + oz + d / 2) / 2, w, 0.25, oz + d / 2 - s1, room.floor);
    bed(b, room, ox + 2.0, oz + d / 2 - 1.6, Y, -1, up);
    wardrobe(b, room, ox - w / 2 + 0.35, oz + 4.5, Y, 1, up);
    rug(b, ox + 2.0, oz + 4.6, 4.4, 3.4, Y, (room.accent & 0xfefefe) >> 1);
    nightWindow(b, ox - 2.6, oz + d / 2 - 0.02, true, -1, 3.2, Y, 1.9, 'sea');
    nightWindow(b, ox + w / 2 - 0.02, oz + 3.6, false, -1, 3.0, Y, 1.5, 'sea');
    table(b, ox + w / 2 - 1.0, oz + 1.6, 0.9, 1.6, Y, room.trim, 0);   // a desk
    floorLamp(b, ox + w / 2 - 0.5, oz + 0.6, Y);
    plant(b, ox - 3.6, oz + d / 2 - 0.6, Y);
    glow(ox + 2, h - 0.06, oz + 4.2, 3.0, 0.05, 0.4, 0xfff2dc);
    // the gallery rail along the edge of the upstairs, open where the stairs arrive
    var r0 = sx + sw / 2, r1 = ox + w / 2;
    box(b, (r0 + r1) / 2, Y + 1.0, s1 + 0.05, r1 - r0, 0.08, 0.12, room.trim);
    for (var bl = r0 + 0.25; bl < r1; bl += 0.5) box(b, bl, Y + 0.5, s1 + 0.05, 0.05, 1.0, 0.05, room.trim);
    solid((r0 + r1) / 2, s1 + 0.05, r1 - r0, 0.24, Y + 1.0, Y);
    // ---- the stairs: eighteen steps up the left-hand wall
    GAME.city.addDeck({ x: sx, z: (s0 + s1) / 2, w: sw, len: s1 - s0, rot: 0, y0: 0, y1: Y, floor: true });
    var steps = 18, tread = (s1 - s0) / steps;
    for (var st = 0; st < steps; st++) {
      var top = Y * (st + 1) / steps;
      box(b, sx, top / 2, s0 + tread * (st + 0.5), sw, top, tread, st % 2 ? room.trim : (room.trim & 0xfefefe) >> 1);
    }
    // Nobody walks in under them, past the part low enough to step onto
    // from the side. Kept low, so it is always under the toes of somebody
    // climbing: their feet are a few centimetres lower than the stair at the
    // front of them, and a taller block stopped them at the third step.
    var hi = s0 + (s1 - s0) * 0.6 / Y;
    solid(sx, (hi + s1) / 2, sw, s1 - hi, 0.45);
    // the handrail up the open side
    var rise = Math.atan2(Y, s1 - s0), rl = Math.hypot(Y, s1 - s0);
    var rail = new THREE.Mesh(sharedBoxGeo(0.07, 0.07, rl), sharedBasic(room.trim));
    rail.position.set(sx + sw / 2, Y / 2 + 0.95, (s0 + s1) / 2);
    rail.rotation.x = -rise;
    GAME.scene.add(rail);
    for (var bp = 1; bp < 6; bp++) {
      var pzz = s0 + (s1 - s0) * bp / 6, py = Y * bp / 6;
      box(b, sx + sw / 2, py + 0.48, pzz, 0.05, 0.95, 0.05, room.trim);
    }
    // ---- downstairs: the hall, under a double-height ceiling and a chandelier
    plant(b, ox - 1.4, oz - d / 2 + 0.7, 0);
    plant(b, ox + 1.4, oz - d / 2 + 0.7, 0);
    rug(b, ox, oz - 4.2, 3.0, 3.6, 0, (room.accent & 0xfefefe) >> 1);
    for (var ch = 0; ch < 5; ch++) glow(ox + Math.sin(ch * 1.26) * 0.5, h - 1.4 - (ch % 2) * 0.25, oz - 3.6 + Math.cos(ch * 1.26) * 0.5, 0.18, 0.3, 0.18, 0xfff0c8);
    glow(ox, h - 0.6, oz - 3.6, 0.06, 1.2, 0.06, 0xb8a888);
    // the lounge, to the right: a couch facing the TV on the wall, and the
    // marina out of a window two storeys high
    tv(b, room, ox + w / 2 - 0.35, oz - 3.4, -1, 0, 0);
    couch(b, room, ox + 4.4, oz - 3.4, 1, 0, 0);
    table(b, ox + 6.0, oz - 3.4, 0.8, 1.4, 0, 0x3a2a20, 0);
    rug(b, ox + 5.6, oz - 3.4, 3.6, 4.0, 0, 0x2a6a7a);
    nightWindow(b, ox + 5.0, oz - d / 2 + 0.02, true, 1, 4.4, 0, 4.6, 'sea');
    // a piano by the stairs, because it is a villa
    box(b, ox - 4.6, 0.5, oz - 3.2, 1.5, 1.0, 1.8, 0x101014);
    box(b, ox - 4.6, 1.02, oz - 3.95, 1.4, 0.06, 0.3, 0xf4f4f4);
    solid(ox - 4.6, oz - 3.2, 1.5, 1.8, 1.0);
    // under the gallery: the kitchen along the back wall, an island, and the
    // dining table
    kitchen(b, ox + 3.0, oz + d / 2, true, 7.0, -1, 0);
    box(b, ox + 3.0, 0.48, oz + 4.2, 3.0, 0.96, 1.0, 0xd8d8e0);
    box(b, ox + 3.0, 0.98, oz + 4.2, 3.1, 0.05, 1.1, 0x30303a);
    solid(ox + 3.0, oz + 4.2, 3.0, 1.0, 1.0);
    table(b, ox - 3.4, oz + 3.4, 2.4, 1.1, 0, 0x6a4a32, 6);
    for (var cl = 0; cl < 3; cl++) glow(ox - 4 + cl * 4, under - 0.04, oz + 3.6, 1.6, 0.05, 0.3, 0xfff2dc);
    box(b, ox - w / 4, 1.7, oz - d / 2 + 0.03, 1.4, 1.0, 0.04, room.accent);
    box(b, ox - w / 4, 1.7, oz - d / 2 + 0.05, 1.2, 0.8, 0.04, 0xf4e0c0);
  }

  function furnishCasino(b, room) {
    var ox = room.ox, oz = room.oz, w = room.w, d = room.d, h = room.h;
    // a gold-flecked carpet
    for (var gx = -w / 2 + 1.5; gx < w / 2; gx += 3) {
      for (var gz = -d / 2 + 1.5; gz < d / 2; gz += 3) box(b, ox + gx, 0.005, oz + gz, 0.3, 0.01, 0.3, 0xb8902a);
    }
    // the wheel, up on the back wall, and its mat
    var wz = oz + d / 2 - 0.25, wy = 3.0;
    var wheel = new THREE.Group();
    var segCols = [0xff2d95, 0xf5f0ff, 0x2de8ff, 0xffd24a];
    for (var s = 0; s < 12; s++) {
      var seg = new THREE.Mesh(sharedBoxGeo(0.5, 2.0, 0.12), sharedBasic(segCols[s % 4]));
      var a = s / 12 * Math.PI * 2;
      seg.position.set(Math.sin(a) * 1.05, Math.cos(a) * 1.05, 0);
      seg.rotation.z = -a;
      wheel.add(seg);
    }
    var hub = new THREE.Mesh(sharedBoxGeo(0.6, 0.6, 0.2), sharedBasic(0xffd24a));
    wheel.add(hub);
    wheel.position.set(ox, wy, wz);
    GAME.scene.add(wheel);
    box(b, ox, wy, wz + 0.12, 4.9, 4.9, 0.1, 0x14061c);
    box(b, ox, wy + 2.25, wz - 0.1, 0.3, 0.5, 0.2, 0xffd24a);   // the pointer
    room.anim.push({ wheel: wheel });
    var stage = oz + d / 2 - 2.6;
    ring(room, ox, stage, 0xffd24a, 'THE WHEEL — step on to place a bet', function () {
      if (GAME.shops && cur && cur.loc) GAME.shops.open(cur.loc);
    });
    // the sign
    glow(ox, h - 0.6, oz + d / 2 - 0.08, 6.5, 0.5, 0.06, 0xff4fa3);
    glow(ox, h - 1.05, oz + d / 2 - 0.08, 4.0, 0.16, 0.06, 0xffd24a);
    // the bar, down the left wall, with somebody behind it
    var bx = ox - w / 2 + 2.0, bz = oz + 1.0;
    box(b, bx, 0.55, bz, 1.0, 1.1, 7.0, 0x3a1a10);
    box(b, bx, 1.13, bz, 1.12, 0.06, 7.1, 0xffd24a);
    box(b, ox - w / 2 + 0.35, 1.8, bz, 0.5, 0.06, 6.6, 0x5a3a20);
    box(b, ox - w / 2 + 0.35, 2.5, bz, 0.5, 0.06, 6.6, 0x5a3a20);
    var bottle = [0x40c070, 0xc04060, 0xf0d070, 0x6080e0, 0xe0e0f0];
    for (var bt = 0; bt < 14; bt++) {
      box(b, ox - w / 2 + 0.35, 2.0 + (bt % 2) * 0.7, bz - 3 + bt * 0.45, 0.14, 0.36, 0.14, bottle[bt % 5]);
    }
    solid(bx, bz, 1.0, 7.0, 1.2);
    for (var st = 0; st < 5; st++) {
      box(b, bx + 1.0, 0.36, bz - 2.6 + st * 1.3, 0.45, 0.72, 0.45, 0x2a2a30);
      box(b, bx + 1.0, 0.76, bz - 2.6 + st * 1.3, 0.55, 0.08, 0.55, 0xc02848);
    }
    room.anim.push({ fig: figure(ox - w / 2 + 1.0, bz + 0.5, Math.PI / 2, { look: { shirt: 0xf4f4f8, pants: 0x14141a, skin: 0xc89870, hair: 'slick', hairCol: 0x1a1210 } }), sway: 0.5 });
    ring(room, bx + 2.2, bz, 0xff8fc8, 'THE BAR — step on for a drink', function () {
      if (GAME.shops) GAME.shops.open(BAR);
    });
    // Gull Downs (derby.js): race terminals down the right wall, every one
    // of them showing the race, a big screen above them all, and the
    // regulars at their terminals, cheering their horses home
    var raceTex = GAME.derby ? GAME.derby.texture() : null;
    var screenMat = raceTex ? new THREE.MeshBasicMaterial({ map: raceTex }) : sharedBasic(0x101018);
    function screen(x, y, z, sw, sh) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), screenMat);
      m.position.set(x, y, z);
      m.rotation.y = -Math.PI / 2;     // facing into the room
      GAME.scene.add(m);
      return m;
    }
    for (var sm = 0; sm < 6; sm++) {
      var sx = ox + w / 2 - 0.6, sz = oz - d / 2 + 3 + sm * 2.0;
      box(b, sx, 0.8, sz, 0.8, 1.6, 1.0, 0x30205a);
      box(b, sx - 0.42, 1.55, sz, 0.06, 0.52, 0.9, 0x101018);
      screen(sx - 0.46, 1.55, sz, 0.84, 0.42);
      box(b, sx - 0.5, 1.0, sz, 0.3, 0.06, 0.8, 0xffd24a);          // the betting slip shelf
      solid(sx, sz, 0.8, 1.0, 1.6);
      var lamp = glow(sx - 0.1, 1.75 + 0.2, sz, 0.3, 0.12, 0.8, sm % 2 ? 0x2de8ff : 0xff2d95);
      room.anim.push({ blink: lamp, phase: sm * 0.7 });
      if (sm % 2 === 0) room.anim.push({ fig: figure(sx - 1.2, sz, Math.PI / 2), sway: 0.3 + sm * 0.1, fan: true });
    }
    var bigZ = oz - d / 2 + 8;
    box(b, ox + w / 2 - 0.08, 3.75, bigZ, 0.12, 3.5, 6.8, 0x101018);
    screen(ox + w / 2 - 0.16, 3.75, bigZ, 6.4, 3.2);
    room.screen = { x: ox + w / 2 - 0.16, y: 3.75, z: bigZ };
    glow(ox + w / 2 - 0.12, 2.0, bigZ, 0.06, 0.08, 6.8, 0x6fe08a);
    // the free terminal in the middle is yours
    ring(room, ox + w / 2 - 1.8, oz - d / 2 + 9, 0x6fe08a, 'GULL DOWNS — step up to bet on the horses', function () {
      if (!GAME.shops || !GAME.derby) return;
      GAME.shops.open(GAME.derby.loc);
    });
    // two card tables with players round them
    [[-2.5, -1.5], [3.5, -2.5]].forEach(function (t, k) {
      var tx = ox + t[0], tz = oz + t[1];
      box(b, tx, 0.38, tz, 2.6, 0.76, 1.6, 0x0e5a34);
      box(b, tx, 0.8, tz, 2.8, 0.08, 1.8, 0x3a1a10);
      solid(tx, tz, 2.8, 1.8, 0.85);
      room.anim.push({ fig: figure(tx, tz - 1.4, 0), sway: 0.2 + k * 0.3 });
      room.anim.push({ fig: figure(tx + 1.7, tz, -Math.PI / 2), sway: 0.6 + k * 0.2 });
      room.anim.push({ fig: figure(tx, tz + 1.4, Math.PI), sway: 0.9 + k * 0.1 });
    });
    // and lights hung from the ceiling
    for (var cl = 0; cl < 3; cl++) glow(ox - 6 + cl * 6, h - 0.35, oz - 1, 1.2, 0.3, 1.2, 0xffe2a8);
  }

  // ---------- the businesses ----------
  function counterRing(room, x, z, label) {
    ring(room, x, z, room.accent, label, function () {
      if (GAME.shops && cur && cur.loc) GAME.shops.open(cur.loc);
    });
  }
  function furnishShop(b, room) {
    var ox = room.ox, oz = room.oz, w = room.w, d = room.d, h = room.h, back = oz + d / 2;
    var fn = { hardware: furnishHardware, dress: furnishThreads, barber: furnishBarber, bribe: furnishDesk, bank: furnishBank }[room.shop];
    if (fn) fn(b, room, ox, oz, w, d, h, back);
    // a strip light or two across the ceiling, whatever the trade
    glow(ox, h - 0.08, oz, Math.min(6, w * 0.4), 0.06, 0.4, 0xfff2dc);
  }
  // a counter across the back with somebody behind it, and its ring
  function counter(b, room, ox, back, len, top, col, clerkLook, label) {
    var cz = back - 2.2;
    box(b, ox, 0.55, cz, len, 1.1, 0.9, col);
    box(b, ox, 1.13, cz, len + 0.1, 0.06, 1.0, top);
    solid(ox, cz, len, 0.9, 1.15);
    room.anim.push({ fig: figure(ox, back - 1.2, Math.PI, clerkLook), sway: 0.4 });
    counterRing(room, ox, cz - 1.5, label);
  }
  function furnishHardware(b, room, ox, oz, w, d, h, back) {
    counter(b, room, ox, back, 5, 0x1a1a14, 0x5a4a32, { look: { shirt: 0x6a7a4a, pants: 0x2a2a22, skin: 0xb08060, hair: 'crew', hairCol: 0x2a2018 } },
      'THE COUNTER — step up to buy');
    // the gun wall: pegboard, and what hangs on it
    box(b, ox, 1.9, back - 0.06, w - 2, 1.8, 0.06, 0x6a5a3a);
    for (var g = 0; g < 7; g++) {
      var gx = ox - (w - 3) / 2 + g * (w - 3) / 6;
      box(b, gx, 2.45, back - 0.12, 1.3, 0.12, 0.06, 0x16161a);        // a long gun
      box(b, gx - 0.5, 2.38, back - 0.12, 0.3, 0.2, 0.06, 0x3a2a1a);   // its stock
      box(b, gx, 1.6, back - 0.12, 0.42, 0.12, 0.06, 0x1e1e24);        // a pistol
      box(b, gx + 0.14, 1.5, back - 0.12, 0.1, 0.2, 0.06, 0x1e1e24);
    }
    // shelves of rounds down both sides
    [-1, 1].forEach(function (sd) {
      var sx = ox + sd * (w / 2 - 0.4);
      for (var sh = 0; sh < 3; sh++) {
        box(b, sx, 0.5 + sh * 0.7, oz + 0.5, 0.6, 0.05, 5.5, 0x4a3a28);
        for (var k = 0; k < 6; k++) box(b, sx, 0.62 + sh * 0.7, oz - 1.8 + k * 0.9, 0.36, 0.2, 0.5, [0xd8b030, 0x3a7a3a, 0xc04030][(k + sh) % 3]);
      }
      solid(sx, oz + 0.5, 0.6, 5.5, 2.2);
    });
    // and a target on the side wall, for the look of the place
    box(b, ox - w / 2 + 0.05, 1.7, back - 3.2, 0.04, 1.0, 1.0, 0xf4f0e8);
    box(b, ox - w / 2 + 0.07, 1.7, back - 3.2, 0.04, 0.6, 0.6, 0xc02020);
    box(b, ox - w / 2 + 0.09, 1.7, back - 3.2, 0.04, 0.25, 0.25, 0xf4f0e8);
  }
  function furnishThreads(b, room, ox, oz, w, d, h, back) {
    var W = GAME.shops && GAME.shops.wardrobe, shirts = W ? W.SHIRTS : [], pants = W ? W.PANTS : [];
    // racks down both walls: a rail, and what hangs on it in this season's colours
    [-1, 1].forEach(function (sd) {
      var rx = ox + sd * (w / 2 - 0.8);
      box(b, rx, 1.75, oz, 0.06, 0.06, 6.0, 0xc0c0c8);
      box(b, rx, 0.9, oz - 3, 0.06, 1.8, 0.06, 0xc0c0c8);
      box(b, rx, 0.9, oz + 3, 0.06, 1.8, 0.06, 0xc0c0c8);
      var list = sd < 0 ? shirts : pants;
      for (var k = 0; k < 10; k++) {
        var c = list.length ? list[k % list.length].hex : 0xff8fd0;
        box(b, rx, sd < 0 ? 1.35 : 1.15, oz - 2.6 + k * 0.58, 0.5, sd < 0 ? 0.7 : 1.1, 0.07, c);
      }
      solid(rx, oz, 0.7, 6.2, 1.9);
    });
    // mannequins in the window, dressed
    room.anim.push({ fig: figure(ox - 2.2, oz - d / 2 + 2.0, 0, { look: { shirt: 0xf78ab8, pants: 0xd8c8a8, skin: 0xe8e0d8, hair: 'none', hairCol: 0 } }), sway: 0 });
    room.anim.push({ fig: figure(ox + 2.2, oz - d / 2 + 2.0, 0, { look: { shirt: 0x8fd0f0, pants: 0x2a2a34, skin: 0xe8e0d8, hair: 'none', hairCol: 0 } }), sway: 0 });
    // the mirror and the changing booth at the back
    glow(ox, 1.4, back - 0.08, 1.4, 2.2, 0.04, 0xcfe6f6);
    box(b, ox, 1.4, back - 0.04, 1.6, 2.4, 0.04, room.trim);
    box(b, ox + 3, 1.3, back - 0.9, 0.06, 2.6, 1.6, 0xff8fd0);
    box(b, ox - 3, 1.3, back - 0.9, 0.06, 2.6, 1.6, 0xff8fd0);
    room.anim.push({ fig: figure(ox + 4.4, back - 1.2, Math.PI, { look: { shirt: 0x23242e, pants: 0x23242e, skin: 0xd8a888, hair: 'ponytail', hairCol: 0x6a2a4a } }), sway: 0.7 });
    counterRing(room, ox, back - 1.6, 'THE MIRROR — step on to try things on');
  }
  function furnishBarber(b, room, ox, oz, w, d, h, back) {
    // the checkerboard
    for (var tx = 0; tx < w; tx++) for (var tz = 0; tz < d; tz++) {
      if ((tx + tz) % 2) box(b, ox - w / 2 + tx + 0.5, 0.006, oz - d / 2 + tz + 0.5, 1, 0.012, 1, 0x1a1a22);
    }
    // two chairs before two mirrors; somebody is in one of them
    [-2, 2].forEach(function (cx, k) {
      var x = ox + cx;
      glow(x, 1.6, back - 0.06, 1.3, 1.1, 0.04, 0xdcecf8);
      for (var bl = 0; bl < 5; bl++) glow(x - 0.6 + bl * 0.3, 2.25, back - 0.06, 0.1, 0.1, 0.06, 0xffe9a0);
      box(b, x, 0.9, back - 0.25, 1.6, 0.06, 0.4, 0xe8e8f0);
      box(b, x, 0.2, back - 1.6, 0.3, 0.4, 0.3, 0xc0c0c8);
      box(b, x, 0.52, back - 1.6, 0.75, 0.16, 0.7, 0xc02838);
      box(b, x, 0.95, back - 1.25, 0.75, 0.8, 0.14, 0xc02838);
      solid(x, back - 1.6, 0.8, 0.8, 1.0);
      if (k === 0) room.anim.push({ fig: figure(x + 1.0, back - 1.9, Math.PI * 0.75, { look: { shirt: 0xf4f4f8, pants: 0x2a2a34, skin: 0xa87050, hair: 'slick', hairCol: 0x1a1210 } }), sway: 0.6 });
    });
    // the pole by the door, turning
    var pole = new THREE.Group();
    for (var ps = 0; ps < 6; ps++) {
      var band = new THREE.Mesh(sharedBoxGeo(0.22, 0.16, 0.22), sharedBasic(ps % 2 ? 0xf4f4f8 : 0xd02030));
      band.position.y = ps * 0.16;
      band.rotation.y = ps * 0.4;
      pole.add(band);
    }
    pole.position.set(ox + w / 2 - 0.6, 1.1, oz - d / 2 + 1.0);
    GAME.scene.add(pole);
    room.anim.push({ pole: pole });
    // the waiting bench
    box(b, ox - w / 2 + 0.6, 0.4, oz - 0.5, 0.7, 0.12, 3.0, 0x5a3a28);
    solid(ox - w / 2 + 0.6, oz - 0.5, 0.7, 3.0, 0.5);
    counterRing(room, ox + 2, back - 2.7, 'THE CHAIR — sit down for a cut');
  }
  function furnishDesk(b, room, ox, oz, w, d, h, back) {
    counter(b, room, ox, back, 5, 0x22305a, 0x3a4a6a, { cop: true }, 'THE DESK — a word with the sergeant');
    // the badge on the wall behind him, and a WANTED board
    glow(ox, 2.5, back - 0.06, 1.0, 1.0, 0.04, 0xffd24a);
    glow(ox, 2.5, back - 0.08, 0.6, 0.6, 0.04, 0x22305a);
    box(b, ox - w / 2 + 0.05, 1.7, oz, 0.04, 1.2, 2.4, 0x5a4a32);
    for (var wp = 0; wp < 4; wp++) box(b, ox - w / 2 + 0.08, 1.75 + (wp % 2 ? -0.3 : 0.25), oz - 0.8 + (wp >> 1) * 1.0 + (wp % 2) * 0.5, 0.03, 0.45, 0.35, 0xf0ece0);
    // benches for the waiting, a flag in the corner
    [-1, 1].forEach(function (sd) {
      box(b, ox + sd * (w / 2 - 0.6), 0.4, oz - 1.0, 0.6, 0.12, 3.2, 0x3a3a42);
      solid(ox + sd * (w / 2 - 0.6), oz - 1.0, 0.6, 3.2, 0.5);
    });
    box(b, ox + w / 2 - 0.8, 1.3, back - 0.8, 0.06, 2.6, 0.06, 0xc0c0c8);
    box(b, ox + w / 2 - 0.8, 2.25, back - 1.25, 0.04, 0.6, 0.9, 0x4da3ff);
  }

  // The Savings & Loan: marble and brass, a long counter at the back with a
  // teller at each window, a guard by the rope, and in the back wall the
  // vault — a round steel door on a hinge, which heist.js swings open.
  // `room.bank` hands the job what it needs: who is standing where, the
  // door, and the spot in front of it.
  function furnishBank(b, room, ox, oz, w, d, h, back) {
    var cx = ox - 3, cz = back - 3.0, len = 10;
    // the counter, its marble top, and a brass grille between the windows
    box(b, cx, 0.55, cz, len, 1.1, 0.9, 0x5a4632);
    box(b, cx, 1.13, cz, len + 0.1, 0.06, 1.0, 0xe8e2d4);
    solid(cx, cz, len, 0.9, 1.15);
    for (var gr = 0; gr < 4; gr++) box(b, cx - len / 2 + 0.2 + gr * (len - 0.4) / 3, 1.75, cz, 0.08, 1.2, 0.08, 0xb89a4a);
    box(b, cx, 2.38, cz, len, 0.08, 0.1, 0xb89a4a);
    var looks = [{ shirt: 0xf0f0f4, pants: 0x2a2a34, skin: 0xa8704a, hair: 'afro', hairCol: 0x1a1010 },
      { shirt: 0xc8d8e8, pants: 0x2a2a34, skin: 0x8a5a3a, hair: 'crew', hairCol: 0x141010 },
      { shirt: 0xf0e0f0, pants: 0x3a2a3a, skin: 0xf0d0b8, hair: 'ponytail', hairCol: 0x8a5a2a }];
    var tellers = [];
    [-3.3, 0, 3.3].forEach(function (tx, k) {
      var fig = figure(cx + tx, back - 2.0, Math.PI, { look: looks[k] });
      room.anim.push({ fig: fig, sway: 0.3 + k * 0.2 });
      tellers.push(fig);
    });
    ring(room, cx, cz - 1.5, room.accent, 'THE TELLER — step up', function () {
      GAME.hud.message(GAME.heist && GAME.heist.busy ? '"Can I help — oh."' : '"Good afternoon! Deposits at any window. We close at six."', 2.5);
    });
    // the vault: a frame in the back wall, the dark of the strongroom in it,
    // and the door — a pivot at its hinge, so it swings
    var vx = ox + w / 2 - 3.2, vz = back - 0.06;
    box(b, vx, 1.75, vz, 3.4, 3.3, 0.12, 0x6a6e76);
    box(b, vx, 1.75, vz - 0.02, 2.7, 2.7, 0.1, 0x0c0c10);
    var pivot = new THREE.Group();
    pivot.position.set(vx - 1.3, 1.75, vz - 0.32);
    var disc = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.4, 28), new THREE.MeshBasicMaterial({ color: 0x9aa0aa }));
    disc.rotation.x = Math.PI / 2;
    disc.position.x = 1.3;
    pivot.add(disc);
    var hub = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.5, 18), new THREE.MeshBasicMaterial({ color: 0xc8a850 }));
    hub.rotation.x = Math.PI / 2;
    hub.position.set(1.3, 0, -0.1);
    pivot.add(hub);
    for (var sp = 0; sp < 3; sp++) {
      var spoke = new THREE.Mesh(sharedBoxGeo(1.5, 0.1, 0.1), sharedBasic(0xc8a850));
      spoke.position.set(1.3, 0, -0.32);
      spoke.rotation.z = sp * Math.PI / 3;
      pivot.add(spoke);
    }
    GAME.scene.add(pivot);
    // and the takings, on a trolley in the strongroom, out of sight behind it
    var trolley = new THREE.Group();
    for (var tb = 0; tb < 4; tb++) {
      var bag = new THREE.Mesh(sharedBoxGeo(0.55, 0.5, 0.45), sharedBasic(tb % 2 ? 0x4a6a3a : 0x3a5a2e));
      bag.position.set((tb % 2) * 0.6 - 0.3, 0.95 + (tb >> 1) * 0.45, 0);
      trolley.add(bag);
    }
    var deckT = new THREE.Mesh(sharedBoxGeo(1.4, 0.08, 0.7), sharedBasic(0x8a8e96));
    deckT.position.y = 0.7;
    trolley.add(deckT);
    trolley.position.set(vx, 0, vz - 1.2);
    trolley.visible = false;
    GAME.scene.add(trolley);
    // the rope across the way to it, on brass posts
    for (var rp = 0; rp < 3; rp++) {
      var rx = vx - 2.4 + rp * 2.4;
      box(b, rx, 0.5, back - 3.4, 0.14, 1.0, 0.14, 0xb89a4a);
    }
    box(b, vx, 0.85, back - 3.4, 4.8, 0.08, 0.08, 0x9a1626);
    // the guard by it, and two customers in the line
    var guard = figure(vx - 3.6, back - 4.2, Math.PI * 0.85, { look: { shirt: 0x3a4a6a, pants: 0x1e2430, skin: 0xc89878, hair: 'crew', hairCol: 0x2a2018 } });
    room.anim.push({ fig: guard, sway: 0.15 });
    var custs = [figure(cx - 1.2, cz - 2.7, 0.15), figure(cx + 2.4, cz - 3.4, -0.2)];
    custs.forEach(function (c, k) { room.anim.push({ fig: c, sway: 0.5 + k * 0.3 }); });
    // columns down both sides, a clock on the back wall, a desk by the door
    [-1, 1].forEach(function (sd) {
      for (var cc = 0; cc < 2; cc++) {
        var px = ox + sd * (w / 2 - 1.3), pz = oz - 2.5 + cc * 4.5;
        box(b, px, h / 2, pz, 0.7, h, 0.7, 0xf2ead6);
        box(b, px, 0.15, pz, 0.95, 0.3, 0.95, 0xd8ccb0);
        solid(px, pz, 0.7, 0.7, h);
      }
    });
    box(b, ox - 3, 3.6, back - 0.08, 1.1, 1.1, 0.06, 0xf6f0e0);
    box(b, ox - 3, 3.7, back - 0.12, 0.06, 0.45, 0.04, 0x14101c);
    box(b, ox - 2.85, 3.6, back - 0.12, 0.35, 0.06, 0.04, 0x14101c);
    box(b, ox - w / 2 + 2.6, 0.4, oz - d / 2 + 3.4, 2.0, 0.8, 1.0, 0x5a4632);
    solid(ox - w / 2 + 2.6, oz - d / 2 + 3.4, 2.0, 1.0, 0.85);
    glow(ox - w / 2 + 2.2, 1.0, oz - d / 2 + 3.4, 0.3, 0.3, 0.3, 0x9adf8a);
    for (var cl = 0; cl < 3; cl++) glow(ox - 5 + cl * 5, h - 0.3, oz, 1.4, 0.2, 1.4, 0xfff2d0);
    room.bank = {
      tellers: tellers, guard: guard, customers: custs,
      door: pivot, trolley: trolley,
      vault: { x: vx, z: back - 2.2 },        // where you stand to get at it
      vaultFace: { x: vx, z: vz },
      floor: { x: ox - 1, z: oz - 0.5 }       // the middle of the room
    };
  }

  // the counter at the bar is a shop like any other (shops.js, kind 'bar')
  var BAR = { id: 'bar0', kind: 'bar', name: 'THE GULL BAR', tag: 'Drinks that put you back together', color: 0xff8fc8, at: { x: 0, z: 0 } };
  // and so is the wardrobe at home (kind 'wardrobe')
  var WARDROBE = { id: 'wardrobe0', kind: 'wardrobe', name: 'YOUR WARDROBE', tag: 'Everything you own, on hangers', color: 0xff8fd0, at: { x: 0, z: 0 } };

  function build() {
    if (built) return;
    built = true;
    var b = new GeoBatch();
    // a room for every business in the world, from its trade's template
    var shops = GAME.shops && GAME.shops.locations ? GAME.shops.locations() : [];
    shops.forEach(function (loc) {
      var tpl = SHOP_ROOMS[loc.kind];
      if (!tpl || byId[loc.id]) return;
      var room = { id: loc.id, name: loc.name, kind: 'shop', shop: loc.kind };
      for (var k in tpl) room[k] = tpl[k];
      ROOMS.push(room);
      byId[loc.id] = room;
    });
    for (var i = 0; i < ROOMS.length; i++) {
      byId[ROOMS[i].id] = ROOMS[i];
      buildRoom(b, ROOMS[i], i);
    }
    var mesh = new THREE.Mesh(b.build(), sharedVertexBasic());
    mesh.matrixAutoUpdate = false;
    GAME.scene.add(mesh);
    // built after the city packed and released its own static meshes, so it
    // goes through the same: down to what an unlit material reads, and off
    // this side once it is on the GPU (main.js draws everything once at boot)
    packStatic(mesh);
    releaseStatic(mesh);
    buildLift();
  }

  // ---------- the tower lift ----------
  // The downtown helipad was out of the sky or nothing: a helicopter on a roof
  // seventy metres up with no way to it on foot. A ring at the lobby doors and
  // one by the lift house on the roof now; step on either and you ride to the
  // other (city.js builds the doors). It runs whatever is going on — a lift
  // to a helicopter is a fine way to leave a chase.
  var lift = null, LIFT_ON = 1.0, LIFT_REARM = 1.7, LIFT_HINT = 8;
  // The ride is a ride: seventy metres up the outside of the tower in a glass
  // car, seen through your own eyes, with the street dropping away and the
  // city opening out to the sea — doors, a smooth climb, doors. It used to be
  // a fade to black and a teleport. Any key or a tap skips it.
  var LIFT_RIDE = 9.5, LIFT_DOORS = 0.9, ridingNow = null, skipRide = false;
  function buildLift() {
    var L = GAME.city.towerLift;
    if (!L) return;
    lift = [];
    [['street', 'roof', 'ELEVATOR — step on to ride up to the helipad'],
      ['roof', 'street', 'ELEVATOR — step on to go down to the street']].forEach(function (s) {
      var at = L[s[0]];
      var m = new THREE.Mesh(new THREE.RingGeometry(0.75, 1.0, 32), new THREE.MeshBasicMaterial({
        color: 0x8fb4ff, transparent: true, opacity: 0.7, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
      m.rotation.x = -Math.PI / 2;
      m.position.set(at.x, at.y + 0.09, at.z);
      GAME.scene.add(m);
      lift.push({ id: s[0], at: at, to: L[s[1]], toId: s[1], mesh: m, label: s[2], armed: true });
    });
  }
  // ---- its doors ----
  // Each stop's doors, the car's and the landing's together, open while the
  // car waits there and somebody is at the door, and shut for the ride: walk
  // up and they part, step in and they close, and at the other end they open
  // onto the street or the roof and close behind you as you walk off. Walk
  // up to a stop the car is not at and it comes to you, down (or up) the
  // glass. It used to be a box with no doors that you were inside of.
  var DOOR_NEAR = 4.5, DOOR_TIME = 0.7, CALL_NEAR = 10, CALL_SPEED = 14;
  var doorOpen = { street: 0, roof: 0 };
  function stopY(id) { var L = GAME.city.towerLift; return id === 'roof' ? L.shaft.top : 0.02; }
  function cabAt(id) { return Math.abs(GAME.city.towerLift.cab.position.y - stopY(id)) < 0.05; }
  function moveDoor(id, want, dt) {
    var D = GAME.city.towerLift.doors && GAME.city.towerLift.doors[id];
    var v = U.clamp(doorOpen[id] + U.clamp(want - doorOpen[id], -dt / DOOR_TIME, dt / DOOR_TIME), 0, 1);
    if (!D || (v === doorOpen[id] && D.placed)) return;
    doorOpen[id] = v; D.placed = true;
    var e = v * v * (3 - 2 * v);
    D.cab.m.position.x = D.cab.x0 + (D.cab.x1 - D.cab.x0) * e;
    D.landing.m.position.x = D.landing.x0 + (D.landing.x1 - D.landing.x0) * e;
  }
  function stepDoors(dt) {
    var P = GAME.player, L = GAME.city.towerLift, called = null;
    for (var k = 0; k < lift.length; k++) {
      var s = lift[k], want = 0;
      var near = P.state === 'alive' && Math.abs(P.pos.y - s.at.y) < 2.5 ? U.dist2(P.pos.x, P.pos.z, s.at.x, s.at.z) : 1e9;
      if (ridingNow) {
        // shut behind you as you set off; open on arrival, the car stopped
        if (s.id === ridingNow.s.toId && ridingNow.t >= LIFT_RIDE - LIFT_DOORS) want = 1;
      } else if (cabAt(s.id)) {
        if (near < DOOR_NEAR * DOOR_NEAR) want = 1;
      } else if (near < CALL_NEAR * CALL_NEAR) called = s.id;
      moveDoor(s.id, want, dt);
    }
    // the car answers a call once the doors it is behind have shut
    if (called && !ridingNow && doorOpen.street + doorOpen.roof === 0) {
      var y = L.cab.position.y, ty = stopY(called), dy = ty - y;
      var v = Math.min(CALL_SPEED, 1.5 + Math.abs(dy) * 1.5) * dt;
      L.cab.position.y = Math.abs(dy) <= v ? ty : y + Math.sign(dy) * v;
    }
  }
  function stepLift(dt) {
    var P = GAME.player;
    if (!lift) return;
    stepDoors(dt || 1 / 60);
    if (ridingNow) { stepRide(dt || 1 / 60); return; }
    for (var i = 0; i < lift.length; i++) lift[i].mesh.material.opacity = 0.5 + 0.25 * Math.sin(GAME.time * 3 + i);
    if (P.state !== 'alive' || P.inCar || P.swimming || P.parachuting || P.mantle) return;
    var hint = '';
    for (var k = 0; k < lift.length; k++) {
      var s = lift[k];
      var d2 = Math.abs(P.pos.y - s.at.y) < 2.5 ? U.dist2(P.pos.x, P.pos.z, s.at.x, s.at.z) : 1e9;
      if (d2 > LIFT_REARM * LIFT_REARM) s.armed = true;
      if (d2 < LIFT_HINT * LIFT_HINT) hint = s.label;
      if (s.armed && d2 < LIFT_ON * LIFT_ON && !P.airborne && !GAME.shopOpen) { ride(s); return; }
    }
    if (hint) GAME.hud.setPoiHint(hint);
  }
  function ride(s) {
    var P = GAME.player, L = GAME.city.towerLift, up = s.toId === 'roof';
    s.armed = false;
    GAME.audio.pagerBeep();
    ridingNow = { s: s, t: 0, up: up, y0: up ? 0.02 : L.shaft.top, y1: up ? L.shaft.top : 0.02, yaw0: Math.random() < 0.5 ? -1 : 1 };
    skipRide = false;
    P.mesh.visible = false;
    P.velY = 0; P.airborne = false; P.moveSpeed = 0; P.mantle = null; P.roofCar = null;
    GAME.hud.setPoiHint('');
    if (GAME.hud.cine) GAME.hud.cine(true, function () { skipRide = true; });
    GAME.track('lift-ride-' + s.toId);
  }
  function stepRide(dt) {
    var R = ridingNow, P = GAME.player, L = GAME.city.towerLift;
    R.t += dt;
    // any key that means "go", a tap, or the button that means "out"
    var T = GAME.input.touch;
    if (R.t > 0.5 && (skipRide || GAME.keyPressed('Space') || GAME.keyPressed('KeyF') || GAME.keyPressed('Enter') || T.jump || T.enter)) R.t = LIFT_RIDE;
    if (P.state !== 'alive') { endRide(false); return; }
    // doors, then a smooth climb (eased in and out), then doors
    var m = U.clamp((R.t - LIFT_DOORS) / (LIFT_RIDE - 2 * LIFT_DOORS), 0, 1), e = m * m * (3 - 2 * m);
    var y = R.y0 + (R.y1 - R.y0) * e;
    L.cab.position.y = y;
    P.pos.set(L.shaft.x, y, L.shaft.z);
    // a passenger at the back of the car looking out through the glass: the
    // view drifts across the city as it opens out, and tips down to the
    // street on the way up (and up to the skyline on the way down)
    var k = R.up ? e : 1 - e;
    // (kept between the car's front posts: swung further, a post stood
    // down the middle of the picture)
    var yaw = R.yaw0 * 0.34 * Math.sin(Math.min(1, R.t / LIFT_RIDE) * Math.PI * 0.9);
    // facing the doors as they shut and as they open — the street door looks
    // out the way the ride does, the roof door is behind it — turning to the
    // view once under way, and back to the door coming in to the roof
    var turnOut = R.s.id === 'roof' ? 1 - U.clamp((R.t - LIFT_DOORS) / 1.2, 0, 1) : 0;
    var turnIn = R.s.toId === 'roof' ? U.clamp((R.t - (LIFT_RIDE - LIFT_DOORS - 1.2)) / 1.2, 0, 1) : 0;
    var turn = Math.max(turnOut, turnIn);
    yaw = yaw * (1 - turn) + R.yaw0 * Math.PI * (turn * turn * (3 - 2 * turn));
    var pitch = (-0.04 + 0.24 * Math.sin(k * Math.PI * 0.85) + 0.06 * k) * (1 - turn);
    var ex = L.shaft.x - Math.sin(yaw) * 0.55, ez = L.shaft.z - Math.cos(yaw) * 0.55, ey = y + 1.62 + Math.sin(R.t * 1.7) * 0.01;
    var cam = GAME.cameraObj;
    cam.position.set(ex, ey, ez);
    cam.lookAt(ex + Math.sin(yaw) * Math.cos(pitch) * 10, ey - Math.sin(pitch) * 10, ez + Math.cos(yaw) * Math.cos(pitch) * 10);
    if (R.t >= LIFT_RIDE) endRide(true);
  }
  function endRide(arrived) {
    var R = ridingNow, P = GAME.player, L = GAME.city.towerLift;
    ridingNow = null;
    if (GAME.hud.cine) GAME.hud.cine(false);
    P.mesh.visible = true;
    var to = arrived ? R.s.to : R.s.at, up = arrived ? R.up : !R.up;
    L.cab.position.y = up ? L.shaft.top : 0.02;
    if (P.state !== 'alive') return;
    var y = up ? to.y : GAME.city.groundY(to.out.x, to.out.z);
    P.pos.set(to.out.x, y, to.out.z);
    P.heading = to.heading; P.velY = 0; P.airborne = false; P.moveSpeed = 0;
    GAME.cam.yaw = P.heading; GAME.cam.pitch = 0.25; GAME.cam.x = GAME.cam.y = GAME.cam.z = 0;
    for (var i = 0; i < lift.length; i++) lift[i].armed = false;
    if (GAME.audio.ding) GAME.audio.ding();
    GAME.hud.message(up ? 'HELIPAD — seventy metres up. Mind the edge.' : 'Street level.', 2.5);
    GAME.track('lift-' + R.s.toId);
  }

  // ---------- going in and out ----------
  function enterable(loc) {
    if (!loc || !byId[loc.id]) return false;
    if (loc.kind === 'casino' || byId[loc.id].kind === 'shop') return true;
    return loc.kind === 'safehouse' && !!(GAME.shops && GAME.shops.owns(loc.sh.id));
  }
  // true when the mat has been dealt with here — gone in, or turned away.
  // `then` runs once you are through the door.
  function enter(loc, then) {
    var room = byId[loc.id], P = GAME.player;
    if (!room || cur || pending) return false;
    // (a shop can be popped into mid-job, the way its doormat always could)
    if (GAME.missions && GAME.missions.active && room.kind !== 'shop') {
      GAME.hud.message('Not now — you are on a job.', 2.2);
      return true;
    }
    if (room.kind === 'casino' && GAME.police.wanted > 0) {
      GAME.hud.message('The doorman takes one look at you — not with the law on your tail.', 3);
      return true;
    }
    var heading = P.heading;
    fadeThen(function () {
      cur = { room: room, loc: loc, door: { x: loc.at.x, y: GAME.city.groundY(loc.at.x, loc.at.z), z: loc.at.z }, heading: heading };
      P.interior = room;
      if (GAME.stopSwim) GAME.stopSwim();
      P.pos.set(room.entry.x, 0, room.entry.z);
      P.heading = 0; P.velY = 0; P.airborne = false; P.moveSpeed = 0; P.mantle = null; P.roofCar = null;
      GAME.cam.yaw = 0; GAME.cam.pitch = 0.2; GAME.cam.x = 0;
      for (var i = 0; i < room.rings.length; i++) room.rings[i].armed = false;
      GAME.hud.message(room.name + (room.kind === 'home'
        ? (GAME.police.wanted > 0 ? ' — nobody can see you in here. ' + room.where.charAt(0).toUpperCase() + room.where.slice(1) + '.'
          : ' — ' + room.where + '. The mat by the door takes you out.')
        : room.kind === 'shop' ? room.hello + (GAME.police.wanted > 0 && room.shop !== 'bribe' ? ' The law is waiting outside.' : '')
          : ' — the wheel is at the back, the bar on the left. The mat by the door takes you out.'), 4);
      if (room.music && GAME.audio.radio && !GAME.audio.muted) GAME.audio.radio.setVolume(0.45);
      GAME.applyTimeOfDay(GAME.timeOfDay);   // the room's own light (main.js)
      GAME.track('interior-' + room.id);
      if (room.kind === 'casino' && GAME.lola) GAME.lola.first('casino');
      if (then) then();
    });
    return true;
  }
  function exitRoom() {
    if (!cur) return;
    var P = GAME.player, c = cur;
    fadeThen(function () { leave(c); });
  }
  function leave(c) {
    var P = GAME.player;
    cur = null;
    P.interior = null;
    P.pos.set(c.door.x, GAME.city.groundY(c.door.x, c.door.z), c.door.z);
    P.heading = c.heading + Math.PI;
    P.velY = 0; P.airborne = false; P.moveSpeed = 0;
    GAME.cam.yaw = P.heading; GAME.cam.x = 0;
    if (c.room.music && GAME.audio.radio) GAME.audio.radio.setVolume(0);
    GAME.applyTimeOfDay(GAME.timeOfDay);
    GAME.hud.setPoiHint('');
  }
  // out without ceremony: a respawn, a teleport, a reload
  function reset() {
    pending = null;
    if (ridingNow) {
      // (out of the lift without ceremony too: a teleport mid-ride)
      ridingNow = null;
      if (GAME.hud.cine) GAME.hud.cine(false);
      GAME.player.mesh.visible = true;
    }
    if (!cur) return;
    var c = cur;
    cur = null;
    GAME.player.interior = null;
    if (c.room.music && GAME.audio.radio) GAME.audio.radio.setVolume(0);
    GAME.applyTimeOfDay(GAME.timeOfDay);
    GAME.hud.fadeSet(0);
  }
  // the fade runs on game time, so a pause holds it
  function fadeThen(fn) {
    pending = { t: FADE, fn: fn, half: false };
    GAME.hud.fadeSet(1);
  }

  // ---------- inside ----------
  function update(dt) {
    var P = GAME.player;
    if (pending) {
      pending.t -= dt;
      if (pending.t <= 0) {
        var fn = pending.fn;
        pending = null;
        fn();
        GAME.hud.fadeSet(0);
      }
      return;
    }
    if (!cur) { stepLift(dt); return; }
    if (P.state !== 'alive') return;
    var room = cur.room, hint = '', hd = 1e9;
    for (var i = 0; i < room.rings.length; i++) {
      var r = room.rings[i];
      r.mesh.material.opacity = 0.5 + 0.25 * Math.sin(GAME.time * 3 + i);
      var d2 = U.dist2(P.pos.x, P.pos.z, r.x, r.z);
      if (Math.abs(P.pos.y - r.y) > 1.2) d2 = 1e9;     // a mat on the other floor
      if (d2 > 1.7 * 1.7) r.armed = true;
      if (d2 < 16 && d2 < hd) { hd = d2; hint = r.label; }
      if (r.armed && d2 < 1.0 && !GAME.shopOpen) { r.armed = false; r.act(); return; }
    }
    // watching your race at Gull Downs, what the screen says is the hint
    if (GAME.derby && GAME.derby.holding) hint = GAME.derby.holdHint();
    GAME.hud.setPoiHint(hint);
    var t = GAME.time;
    for (var a = 0; a < room.anim.length; a++) {
      var an = room.anim[a];
      if (an.wheel) an.wheel.rotation.z += dt * 0.35;
      else if (an.pole) an.pole.rotation.y += dt * 1.6;
      else if (an.turntable) an.turntable.rotation.y += dt * an.rate;
      else if (an.tv) an.tv.material.color.setHSL((t * 0.05) % 1, 0.45, 0.45 + 0.08 * Math.sin(t * 9) * Math.sin(t * 2.3));
      else if (an.blink) an.blink.visible = Math.sin(t * 4 + an.phase) > -0.3;
      else if (an.fig) {
        var j = an.fig.userData.joints, s = Math.sin(t * 1.6 + an.sway * 7);
        if (an.fan && GAME.derby && GAME.derby.cheering) {
          // come on, number four!
          var c = Math.sin(t * 9 + an.sway * 5);
          j.armL.rotation.x = -2.5 + c * 0.35; j.armR.rotation.x = -2.6 - c * 0.35;
          an.fig.position.y = Math.max(0, c) * 0.06;
          continue;
        }
        an.fig.position.y = 0;
        // held up (heist.js): hands where everybody can see them — or one
        // going for the alarm under the counter
        var pose = an.fig.userData.pose;
        if (pose) {
          j.armL.rotation.x = pose === 'reach' ? -0.3 : -2.7 + s * 0.06;
          j.armR.rotation.x = pose === 'reach' ? -1.5 : -2.75 - s * 0.06;
          j.torso.rotation.y = 0;
          continue;
        }
        j.armL.rotation.x = s * 0.12; j.armR.rotation.x = -s * 0.1 - 0.2;
        j.torso.rotation.y = s * 0.05;
      }
    }
  }

  // What the camera at (x, z) may not rise past, in here: the room's
  // ceiling — or, downstairs in a house with an upstairs, the underside of
  // that floor whenever you or the camera are under it (above it, the camera
  // would be looking at the top of the floor and not at you). Out in the
  // double-height hall it has the whole height. And upstairs it stays above
  // the floor you stand on.
  function onUpper(room) { return room.slab && GAME.player.pos.y >= room.slab.y - 1.0; }
  function ceiling(x, z) {
    if (!cur) return hallCeiling(x, z);
    var room = cur.room, sl = room.slab;
    if (sl && !onUpper(room) && (GAME.player.pos.z > sl.minZ - 0.6 || z === undefined || z > sl.minZ - 0.6)) return sl.under - 0.3;
    return room.h - 0.3;
  }
  function camFloor(x, z) {
    if (!cur) return hallFloor(x, z);
    if (!onUpper(cur.room)) return null;
    var sl = cur.room.slab;
    return x > sl.minX && x < sl.maxX && z > sl.minZ - 0.3 && z < sl.maxZ ? sl.y + 0.45 : null;
  }

  // ---------- halls ----------
  // A building walked into where it stands, with no fade and no room out in
  // the fog: the Gran Rosa Motors hall (shops.js builds it). Through its
  // glass is the street, because it IS the street. All that is minded here
  // is the roof: under it, the camera stays below the ceiling and the rain
  // stays out; up on it, the camera stays above it.
  // { minX, maxX, minZ, maxZ, under: the ceiling, roof: the top you stand on }
  var halls = [];
  function hallOf(x, z) {
    for (var i = 0; i < halls.length; i++) {
      var h = halls[i];
      if (x > h.minX && x < h.maxX && z > h.minZ && z < h.maxZ) return h;
    }
    return null;
  }
  // under its roof: on the floor, or low enough on the stairs that the
  // ceiling is still over your head
  function underHall() {
    var P = GAME.player, h = halls.length ? hallOf(P.pos.x, P.pos.z) : null;
    return h && P.pos.y < h.under - 1.0 ? h : null;
  }
  function hallCeiling(x, z) {
    var h = underHall();
    if (!h || (x !== undefined && (x <= h.minX || x >= h.maxX || z <= h.minZ || z >= h.maxZ))) return null;
    return h.under - 0.3;
  }
  function hallFloor(x, z) {
    var P = GAME.player, h = halls.length ? hallOf(P.pos.x, P.pos.z) : null;
    if (!h || P.pos.y < h.roof - 0.5 || hallOf(x, z) !== h) return null;
    return h.roof + 0.45;
  }

  return {
    build: build, update: update, enter: enter, enterable: enterable, reset: reset, ceiling: ceiling, camFloor: camFloor,
    addHall: function (h) { halls.push(h); return h; },
    // turn to the casino's big screen, for a race you have money on (derby.js)
    faceScreen: function () {
      var sc = cur && cur.room.screen, P = GAME.player;
      if (!sc) return;
      P.heading = Math.atan2(sc.x - P.pos.x, sc.z - P.pos.z);
      P.moveSpeed = 0;
      GAME.cam.yaw = P.heading; GAME.cam.pitch = 0.08;
    },
    // under a roof, indoors or in a hall: no rain falls here
    sheltered: function () { return !!GAME.player.interior || !!underHall(); },
    hall: function () { return hallOf(GAME.player.pos.x, GAME.player.pos.z); },
    get current() { return cur ? cur.room : null; },
    get door() { return cur ? cur.door : null; },
    get busy() { return !!pending || !!ridingNow; },
    riding: function () { return !!ridingNow; },
    leave: exitRoom,
    // headless: the two lift stops
    lift: function () { return lift; },
    liftDoors: function () { return doorOpen; },
    rooms: function () { return ROOMS; },
    bar: BAR
  };
})();
