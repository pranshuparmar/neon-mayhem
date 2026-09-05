GAME.city = (function () {
  // Roads on a grid; +x east toward the ocean, +z south. Boulevard is the x=350 road.
  var R = [-450, -350, -250, -150, -50, 50, 150, 250, 350];
  var ROAD_HALF = 6, SIDEWALK_OUT = 10;
  var BOARDWALK_X0 = 360, BOARDWALK_X1 = 370, SAND_X0 = 370;
  var rng = mulberry32(198619);

  var city = {
    R: R,
    ROAD_HALF: ROAD_HALF,
    hash: new SpatialHash(25),
    parkedSpots: [],
    pickupSpots: [],
    palmSpots: [],
    signNames: [],
    pois: {
      hospitals: [
        { x: 0, z: 128, spawn: { x: 0, z: 138 } },
        { x: -400, z: 18, spawn: { x: -400, z: 40 } }
      ],
      police: { x: -100, z: -122, spawn: { x: -100, z: -134 } },
      // every landmass gets its own station; stations[] is what the game asks
      stations: [],
      resprays: [
        { x: 180, z: -80, door: { x: 166, z: -80 } },
        { x: -428, z: -180, door: { x: -442, z: -180 } },
        { x: 272, z: -420, door: { x: 258, z: -420 } }
      ]
    },
    landBounds: { minX: -500, maxX: 356, minZ: -500, maxZ: 500 }
  };

  city.shoreline = function (z) {
    return 432 + 20 * Math.sin(z * 0.006) + 8 * Math.sin(z * 0.021 + 2);
  };
  // the city is an island: curved waterlines on the other three sides
  // These waterlines are the LOGICAL coast, and they must not be more
  // generous than the drawn land plane (x -500..360, z -500..500): the old
  // curved shores reached up to 19m past it, leaving a band of "dry" open
  // sea on three sides where a car could drive along the water's surface.
  city.westShore = function (z) { return -498; };
  city.northShore = function (x) { return -498; };
  city.southShore = function (x) { return 498; };
  // the east piers. The z=150 slot belongs to the south bridge now, so the
  // pier that used to sit there stepped down a block.
  var PIERS = [[250, 505], [-180, 470]];
  city.isOnPier = function (x, z) {
    // the casino's terrace pad, hung off the south side of the wheel pier —
    // the casino used to stand square on the walkway and block the wheel.
    // Grown for the palace: a pier casino deserves more deck than a hut.
    if (x > 438 && x < 466 && z > 250 && z < 277) return true;
    // the deck starts past the boardwalk (x=370); it used to claim from 356
    // and swallow the footpath in front of it
    for (var i = 0; i < PIERS.length; i++) {
      if (x > 370 && x < PIERS[i][1] && Math.abs(z - PIERS[i][0]) < 8) return true;
    }
    return false;
  };

  // The world is a set of landmasses rather than one. Costa Rosa is the first;
  // anything else registers itself here before the city is built, and every
  // water test goes through the same list — so a new island is dry land to the
  // ocean mesh, the drown check and the spawners without any of them knowing
  // there is more than one.
  city.islands = [{
    id: 'costa', name: 'Isla Rosa', centre: { x: -70, z: 0 },
    contains: function (x, z) {
      return x <= city.shoreline(z) + 2 && x >= city.westShore(z) &&
        z >= city.northShore(x) && z <= city.southShore(x);
    }
  }];
  city.addIsland = function (isl) { city.islands.push(isl); return isl; };
  city.islandAt = function (x, z) {
    for (var i = 0; i < city.islands.length; i++) {
      if (city.islands[i].contains(x, z)) return city.islands[i];
    }
    return null;
  };
  // which landmass a point belongs to, by id — '' for open water
  city.islandIdAt = function (x, z) {
    var isl = city.islandAt(x, z);
    return isl ? isl.id : '';
  };

  // spans of road carried over water, registered the same way. A crossing is
  // dry land for the water tests and drivable ground for the height lookup.
  city.crossings = [];
  city.addCrossing = function (c) { city.crossings.push(c); return c; };
  // `atY`, when given, is the height of whatever is asking. A deck only counts
  // as ground once you are up at its level: without that, its height applies to
  // anything inside its footprint, so driving up the sand alongside a bridge
  // and turning in lifts you onto the deck — past whatever was blocking it.
  city.crossingY = function (x, z, atY) {
    for (var i = 0; i < city.crossings.length; i++) {
      var y = city.crossings[i].deckY(x, z);
      if (y === null) continue;
      if (atY !== undefined && atY < y - 2.5) continue;
      return y;
    }
    return null;
  };

  // Walkable surfaces that are not terrain: a flight of steps, a terrace.
  // A deck is a rectangle that may slope along its local +z, so one entry
  // describes a staircase and another the landing at the top of it.
  city.decks = [];
  city.addDeck = function (d) {
    d.cos = Math.cos(d.rot || 0); d.sin = Math.sin(d.rot || 0);
    var r = Math.max(d.w, d.len) / 2 + 1;
    d.minX = d.x - r; d.maxX = d.x + r; d.minZ = d.z - r; d.maxZ = d.z + r;
    city.decks.push(d);
    return d;
  };
  city.deckAt = function (x, z) {
    var best = null;
    for (var i = 0; i < city.decks.length; i++) {
      var d = city.decks[i];
      if (x < d.minX || x > d.maxX || z < d.minZ || z > d.maxZ) continue;
      var dx = x - d.x, dz = z - d.z;
      var lx = dx * d.cos - dz * d.sin, lz = dx * d.sin + dz * d.cos;
      if (Math.abs(lx) > d.w / 2 || Math.abs(lz) > d.len / 2) continue;
      var t = (lz + d.len / 2) / d.len;
      var y = d.y0 + (d.y1 - d.y0) * t;
      if (best === null || y > best) best = y;
    }
    return best;
  };

  // `atY` matters here for the same reason it matters to the height lookup: a
  // bridge overhead does not keep you dry when you are in the sea under it.
  // is this within `pad` of a bridge deck, at any height? For deciding where
  // not to plant a palm or stand a lamp post
  city.nearCrossing = function (x, z, pad) {
    for (var i = 0; i < city.crossings.length; i++) {
      var c = city.crossings[i];
      if (c.nearBy && c.nearBy(x, z, pad)) return true;
    }
    return false;
  };

  city.isInWater = function (x, z, atY) {
    if (city.isOnPier(x, z)) return false;
    if (city.crossings.length && city.crossingY(x, z, atY) !== null) return false;
    // a walkable deck keeps you dry too — a jetty plank can run out past the
    // waterline, and standing on its end is not swimming
    if (city.decks.length) {
      var dy = city.deckAt(x, z);
      if (dy !== null && (atY === undefined || atY >= dy - 1.2)) return false;
    }
    return !city.islandAt(x, z);
  };
  // Is there sea under this point, whatever is carried over it? A bridge deck
  // is not water for the drown check, but it is still water underneath — which
  // is what decides whether anything could be standing down there.
  city.isOpenWater = function (x, z) {
    return !city.isOnPier(x, z) && !city.islandAt(x, z);
  };
  city.isOnSand = function (x, z) {
    if (city.isOnPier(x, z)) return false;
    return x > BOARDWALK_X1 && x <= city.shoreline(z) + 2;
  };
  // stunt ramps. Each is a wedge rising along its local +z; rampAt returns the
  // deck height and the slope so vehicles get launched off the lip.
  city.ramps = [];
  city.rampAt = function (x, z) {
    for (var i = 0; i < city.ramps.length; i++) {
      var r = city.ramps[i];
      if (x < r.minX || x > r.maxX || z < r.minZ || z > r.maxZ) continue;
      var dx = x - r.x, dz = z - r.z;
      var lx = dx * r.cos - dz * r.sin;      // across the ramp
      var lz = dx * r.sin + dz * r.cos;      // up the ramp
      if (Math.abs(lx) > r.w / 2 || lz < -r.len / 2 || lz > r.len / 2) continue;
      var t = (lz + r.len / 2) / r.len;
      // a ramp can sit on a roof: base lifts the whole wedge
      return { idx: r.idx, y: (r.base || 0) + r.h * t, slope: r.h / r.len, rot: r.rot, boost: r.boost, cap: r.cap };
    }
    return null;
  };

  // A ramp is a SURFACE, not a solid, which is what lets a car ride up one —
  // but feet ride up just as well, and the raked flanks beside the deck are
  // walls. A stroller who wandered onto a wedge was left milling about on top
  // for half a minute with nowhere to go but back down the way they came or
  // off the lip. So nobody on foot climbs: above ankle height on a ramp, the
  // only step left is one that brings you back DOWN it, which is what lets
  // anyone already up there walk off.
  //
  // The comparison is strictly downhill on purpose. Allowing "near enough
  // level" — even a 2 cm tolerance — is not a tolerance at all but a climb
  // rate, because the rule is asked once per FRAME: a stroller covers under
  // 3 cm in a sixtieth of a second, which on any of these wedges gains barely
  // more than a centimetre of height, so every step qualifies as level and
  // the whole ramp goes by a centimetre at a time. Measured, a 2 cm slack let
  // 777 frames of climbing through.
  var STEP_UP = 0.45;
  city.canWalkTo = function (fromX, fromZ, toX, toZ) {
    if (!city.ramps.length) return true;
    var to = city.rampAt(toX, toZ);
    if (!to || to.y <= STEP_UP) return true;
    var from = city.rampAt(fromX, fromZ);
    return !!from && to.y < from.y;
  };

  city.groundY = function (x, z, atY) {
    if (city.ramps.length) {
      var rp = city.rampAt(x, z);
      if (rp) return rp.y;
    }
    if (city.crossings.length) {
      var cy = city.crossingY(x, z, atY);
      if (cy !== null) return cy;
    }
    if (city.decks.length) {
      var dy = city.deckAt(x, z);
      if (dy !== null) return dy;
    }
    // a landmass may carry its own relief; Costa Rosa is flat, others need not be
    for (var ii = 1; ii < city.islands.length; ii++) {
      var isl = city.islands[ii];
      if (isl.groundY && isl.contains(x, z)) return isl.groundY(x, z);
    }
    if (city.isOnPier(x, z) && x > BOARDWALK_X1) return 0.5;
    if (x > BOARDWALK_X0 && x <= BOARDWALK_X1) return 0.3;
    if (city.isOnSand(x, z)) {
      var sh = city.shoreline(z);
      var t = U.clamp((x - SAND_X0) / Math.max(1, sh - SAND_X0), 0, 1);
      return 0.25 - 0.85 * t;
    }
    return 0;
  };
  // the surface a ground vehicle rests on at (x,z), given it is currently at
  // height y. A roof only counts once you're actually up at its level, so
  // street traffic never snaps onto a building — but a car that clears a roof
  // on a jump can land on it and drive around up there.
  city.driveSurfaceY = function (x, z, y) {
    var best = city.groundY(x, z, y);
    var boxes = city.hash.query(x, z, 1);
    for (var i = 0; i < boxes.length; i++) {
      var b = boxes[i];
      if (b.tag !== 'building' || b.h === undefined) continue;
      if (b.h <= best || b.h > y + 1.4) continue;
      if (x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ) best = b.h;
    }
    return best;
  };
  // top surface at a point: the tallest solid building roof containing it,
  // else the terrain height. Used so aircraft can set down on rooftops.
  city.surfaceY = function (x, z, atY) {
    var y = city.groundY(x, z, atY);
    var boxes = city.hash.query(x, z, 1);
    for (var i = 0; i < boxes.length; i++) {
      var b = boxes[i];
      if (b.tag !== 'building') continue; // land on buildings, not props/fences
      if (x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ && b.h > y) y = b.h;
    }
    return y;
  };

  city.districtAt = function (x, z) {
    if (x >= 160) return 'strip';
    if (x <= -140 && z >= 140) return 'harbor';
    if (x >= -260 && x <= 60 && z >= -260 && z <= 60) return 'downtown';
    return 'residential';
  };
  // the station or hospital you would actually be taken to from here
  city.nearestStation = function (x, z) {
    var list = city.pois.stations, best = null, bd = 1e18;
    var unlocked = !GAME.isla || GAME.isla.isOpen();
    for (var i = 0; i < list.length; i++) {
      // a station behind a locked bridge cannot be where you're released
      if (list[i].isla && !unlocked) continue;
      var d = U.dist2(x, z, list[i].x, list[i].z);
      if (d < bd) { bd = d; best = list[i]; }
    }
    return best || city.pois.police;
  };
  // The shore you would actually crawl out onto. Every landmass answers for
  // its own coast; the mainland's is four curves, the island's is one.
  city.washAshore = function (x, z) {
    var best = null, bd = 1e18;
    var unlocked = !GAME.isla || GAME.isla.isOpen();
    for (var i = 0; i < city.islands.length; i++) {
      var isl = city.islands[i];
      // you do not wash up on a shore the game has not opened yet — drowning
      // in the channel is not a ferry to the locked island
      if (isl.id !== 'costa' && !unlocked) continue;
      var c = isl.centre || { x: -70, z: 0 };
      var d = U.dist2(x, z, c.x, c.z);
      if (d < bd) { bd = d; best = isl; }
    }
    if (best && best.shorePoint) return best.shorePoint(x, z);
    var px = U.clamp(x, -560, 560), pz = U.clamp(z, -560, 560);
    if (px > city.shoreline(pz)) px = city.shoreline(pz) - 22;
    if (px < city.westShore(pz)) px = city.westShore(pz) + 24;
    if (pz < city.northShore(px)) pz = city.northShore(px) + 24;
    if (pz > city.southShore(px)) pz = city.southShore(px) - 24;
    return { x: px, z: pz };
  };

  city.districtName = function (x, z) {
    if (GAME.isla && GAME.isla.contains(x, z)) return GAME.isla.districtName(x, z);
    if (x > 340) return 'Ocean Strip';
    var d = city.districtAt(x, z);
    return d === 'strip' ? 'Ocean Strip' : d === 'harbor' ? 'Puerto Viejo' : d === 'downtown' ? 'Centro Alto' : 'Las Colinas';
  };
  city.nearestRoadPoint = function (x, z) {
    // each landmass answers for its own roads; asking the mainland grid where
    // the nearest road is when you are stood on the island puts you in the sea
    for (var ii = 1; ii < city.islands.length; ii++) {
      var isl = city.islands[ii];
      if (isl.nearestRoadPoint && isl.contains(x, z)) return isl.nearestRoadPoint(x, z);
    }
    var bx = R[0], bz = R[0], dx = 1e9, dz = 1e9;
    for (var i = 0; i < R.length; i++) {
      if (Math.abs(R[i] - x) < dx) { dx = Math.abs(R[i] - x); bx = R[i]; }
      if (Math.abs(R[i] - z) < dz) { dz = Math.abs(R[i] - z); bz = R[i]; }
    }
    // snap the closer axis, keep the other free (stay on that road line)
    if (dx < dz) return { x: bx, z: U.clamp(z, -480, 480), axis: 'z' };
    return { x: U.clamp(x, -480, 340), z: bz, axis: 'x' };
  };

  // reserved rects that block generation must not overlap
  var reserved = [
    { minX: -40, maxX: 40, minZ: 95, maxZ: 165 },      // hospitals
    { minX: -440, maxX: -360, minZ: -10, maxZ: 48 },
    { minX: -195, maxX: -105, minZ: -138, maxZ: -85 }, // police station
    { minX: 155, maxX: 215, minZ: -110, maxZ: -50 },   // respray garages
    { minX: -26, maxX: 26, minZ: -226, maxZ: -174 },   // the helipad tower
    // shop slots in the strip's western building row: the storefronts build
    // into these gaps and read as part of the street, not beach clutter
    { minX: 318, maxX: 346, minZ: -78, maxZ: -50 },    // hardware
    { minX: 318, maxX: 346, minZ: 78, maxZ: 106 },     // tailor
    { minX: 318, maxX: 346, minZ: -134, maxZ: -106 },  // barber
    { minX: 318, maxX: 346, minZ: 194, maxZ: 222 },    // strip condo
    { minX: -448, maxX: -408, minZ: -200, maxZ: -160 },
    { minX: 252, maxX: 292, minZ: -440, maxZ: -400 }
  ];
  function overlapsReserved(minX, maxX, minZ, maxZ) {
    for (var i = 0; i < reserved.length; i++) {
      var r = reserved[i];
      if (minX < r.maxX && maxX > r.minX && minZ < r.maxZ && maxZ > r.minZ) return true;
    }
    return false;
  }

  // `minY`, when given, is the level the solid starts at — anything well below
  // it passes underneath instead of hitting it
  function addSolid(cx, cz, sx, sz, h, tag, noLOS, minY) {
    var box = { minX: cx - sx / 2, maxX: cx + sx / 2, minZ: cz - sz / 2, maxZ: cz + sz / 2, h: h, tag: tag || 'building', noLOS: !!noLOS };
    if (minY !== undefined) box.minY = minY;
    city.hash.insert(box);
    return box;
  }

  city.addSolid = function (cx, cz, sx, sz, h, tag, noLOS, minY) { return addSolid(cx, cz, sx, sz, h, tag, noLOS, minY); };
  city.addSign = function (batch, slotIdx, x, y, z, rotY, w, h, tint) { addSign(batch, slotIdx, x, y, z, rotY, w, h, tint); };

  // ---------- canvas textures ----------
  function windowTexture(bg, litColors, cols, rows, litProb, bandColor) {
    var cv = document.createElement('canvas');
    cv.width = 512; cv.height = 384;
    var g = cv.getContext('2d');
    g.fillStyle = bg; g.fillRect(0, 0, 512, 384);
    var cw = 512 / cols, ch = 384 / rows;
    for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) {
      var lit = rng() < litProb;
      var pad = cw * 0.22;
      g.fillStyle = lit ? litColors[Math.floor(rng() * litColors.length)] : 'rgba(30,34,58,0.9)';
      g.fillRect(i * cw + pad, j * ch + ch * 0.2, cw - pad * 2, ch * 0.55);
    }
    if (bandColor) {
      g.fillStyle = bandColor;
      for (var b = 0; b < rows; b++) g.fillRect(0, b * ch - 2, 512, 5);
    }
    // keep left column dark so roof uvs sample facade color
    g.fillStyle = bg; g.fillRect(0, 0, Math.floor(cw * 0.2), 384);
    var tex = new THREE.CanvasTexture(cv);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  var SIGN_TEXTS = ['CLUB FLAMINGO', 'HOTEL MIRAJE', "ROXY'S", 'EL DORADO', 'NEON PALMS', 'TIKI LOUNGE',
    'LA SIRENA', 'STARDUST', 'CASA AZUL', 'VOLTAGE', 'PINK IGUANA', 'INFERNO ROOM',
    'COCKTAILS', 'ARCADE', 'HOTEL RIVIERA', 'PALM COURT', 'DISCO 2000', 'MOTEL LUNA',
    'RESPRAY', 'HOSPITAL', 'POLICE', 'AXIS TOWER', 'COSTA ROSA PIER', 'FUN FAIR',
    // Isla Verde keeps its own names; appended, so every index above still holds
    'SUNNY SCOOPS', 'EL FARO', 'PUERTO DORADO', 'MARINA VERDE', 'MIRADOR',
    'CASA DEL SOL', 'BAHIA CLUB', 'VERDE MOTORS',
    // The two ends of the world, for the signs over the bridges. Costa Rosa
    // is the CITY — the whole map, both islands. The mainland is Isla Rosa,
    // the neon island; Isla Verde is the green one across the channel.
    'ISLA VERDE', 'ISLA ROSA',
    // storefronts — the shops are real buildings with their names in lights
    // (slots consumed by js/shops.js; keep this order in sync with SIGN_SLOT there)
    'ROSA HARDWARE', 'VERDE HARDWARE', 'THREADS', 'CORTES CUTS',
    'GRAN ROSA MOTORS', 'THE LUCKY GULL', 'DOCKSIDE FLAT', 'STRIP CONDO', 'MARINA VILLA',
    // civic lettering for the landmark dressing (43, 44)
    'EMERGENCY', 'DEPARTURES'];
  var SIGN_COLORS = ['#ff4fa3', '#38e8ff', '#ffe14f', '#7dff6a', '#ff8a3d', '#c86bff', '#ff5d5d', '#59ffc8'];
  function signAtlas() {
    var cv = document.createElement('canvas');
    cv.width = 1024; cv.height = 1024;
    var g = cv.getContext('2d');
    g.fillStyle = '#07040c'; g.fillRect(0, 0, 1024, 1024);
    var slots = [];
    // Rows are sized from the list, so adding a name never overruns the canvas
    // — and the glyphs and their glow are sized to the row, because a 52 px
    // face with a 22 px halo in a 60 px row bleeds into the slots above and
    // below it, and every quad using those slots shows the neighbour's smear.
    var ROW = Math.floor(1024 / Math.ceil(SIGN_TEXTS.length / 2));
    var FONT = Math.min(52, ROW - 20), HALO = Math.min(22, Math.floor(ROW * 0.17));
    for (var i = 0; i < SIGN_TEXTS.length; i++) {
      var col = i % 2, row = Math.floor(i / 2);
      var x = col * 512, y = row * ROW;
      var color = SIGN_TEXTS[i] === 'HOSPITAL' || SIGN_TEXTS[i] === 'EMERGENCY' ? '#ff6a6a'
        : SIGN_TEXTS[i] === 'POLICE' ? '#5aa0ff' : SIGN_COLORS[i % SIGN_COLORS.length];
      g.save();
      g.font = 'italic 900 ' + FONT + 'px "Segoe UI", Arial, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.shadowColor = color; g.shadowBlur = HALO;
      g.strokeStyle = color; g.lineWidth = 2;
      g.fillStyle = '#ffffff';
      g.strokeText(SIGN_TEXTS[i], x + 256, y + ROW / 2, 490);
      g.shadowBlur = Math.min(10, HALO);
      g.fillText(SIGN_TEXTS[i], x + 256, y + ROW / 2, 490);
      g.restore();
      slots.push({ u0: x / 1024, v0: 1 - (y + ROW) / 1024, u1: (x + 512) / 1024, v1: 1 - y / 1024 });
    }
    return { tex: new THREE.CanvasTexture(cv), slots: slots };
  }
  function radialGlowTexture(color) {
    var cv = document.createElement('canvas');
    cv.width = 128; cv.height = 128;
    var g = cv.getContext('2d');
    var gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    gr.addColorStop(0, color); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(cv);
  }
  city.glowTexture = radialGlowTexture;

  // ---------- kinetic props ----------
  // Single live meshes for the handful of things that turn, blink or breathe.
  // Everything else stays in the static batches; these are the exceptions
  // that make a landmark read as switched on.
  city.kinetics = [];
  function kmesh(w, h, d, color, x, y, z, k, matOpts) {
    var mo = { color: color };
    if (matOpts) for (var mk in matOpts) mo[mk] = matOpts[mk];
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial(mo));
    m.position.set(x, y, z);
    city.scene.add(m);
    if (k) { k.m = m; city.kinetics.push(k); }
    return m;
  }
  city.kmesh = kmesh;

  // ---------- build ----------
  city.pois.stations.push(city.pois.police);

  city.build = function (scene) {
    // second landmass registers first: the ocean mask, the drown test and every
    // spawner ask the water model, and it has to know the full world by then
    if (GAME.isla) GAME.isla.register(city);
    city.scene = scene;
    var batches = {
      ground: new GeoBatch(),
      marks: new GeoBatch(),
      downtown: new GeoBatch(),
      strip: new GeoBatch(),
      generic: new GeoBatch(),
      harbor: new GeoBatch(),
      wood: new GeoBatch(),
      glow: new GeoBatch(),
      signs: new GeoBatch()
    };
    var atlas = signAtlas();
    city.signSlots = atlas.slots;

    // base land
    batches.ground.addGroundQuad(-70, 0, 0, 860, 1000, 0, 0x17131f);
    // asphalt: vertical roads
    var asphalt = new GeoBatch();
    // the grid stops at the airport fence: the roads that used to run the full
    // strip carried straight across the runway. Anything overlapping the fence
    // box ends just north of it instead.
    var AP = city.airport;
    for (var i = 0; i < R.length; i++) {
      var hitsAirport = R[i] + ROAD_HALF > AP.fx0 && R[i] - ROAD_HALF < AP.fx1;
      var zEnd = hitsAirport ? AP.fz0 - 1 : 480;
      asphalt.addGroundQuad(R[i], 0.03, (-480 + zEnd) / 2, ROAD_HALF * 2, zEnd + 480, 0, 0x100e16);
      asphalt.addGroundQuad(-72, 0.03, R[i], 856, ROAD_HALF * 2, 0, 0x100e16);
      // dashed center lines
      for (var d = -470; d < 470; d += 12) {
        if (d + 5 < zEnd) batches.marks.addGroundQuad(R[i], 0.06, d + 3, 0.25, 4, 0, 0xd8c46a);
        if (d > -500 && d < 350) batches.marks.addGroundQuad(d + 3, 0.06, R[i], 4, 0.25, 0, 0xd8c46a);
      }
    }
    // sidewalks around each block
    for (var bi = 0; bi < R.length - 1; bi++) for (var bj = 0; bj < R.length - 1; bj++) {
      var cx = (R[bi] + R[bi + 1]) / 2, cz = (R[bj] + R[bj + 1]) / 2;
      batches.ground.addBox(cx, 0.09, cz - 42, 88, 0.18, 4, 0, 0x2c2838, 0);
      batches.ground.addBox(cx, 0.09, cz + 42, 88, 0.18, 4, 0, 0x2c2838, 0);
      batches.ground.addBox(cx - 42, 0.085, cz, 4, 0.17, 80, 0, 0x2c2838, 0);
      batches.ground.addBox(cx + 42, 0.085, cz, 4, 0.17, 80, 0, 0x2c2838, 0);
    }
    // boulevard east sidewalk
    batches.ground.addBox(358, 0.09, 0, 4, 0.18, 960, 0, 0x2c2838, 0);

    buildBlocks(batches, atlas);
    buildPOIs(batches, atlas);
    buildBeach(scene, batches);
    buildSky(scene);

    // no boundary walls: the surrounding sea is the soft boundary

    // materials + meshes
    var texDowntown = windowTexture('#101322', ['#ffe9a8', '#a8e8ff', '#ffd0e8', '#c8ffe0'], 10, 8, 0.5);
    var texStrip = windowTexture('#241a2e', ['#ffe9a8', '#ffd0e8'], 8, 5, 0.4, 'rgba(90,60,90,0.8)');
    var texGeneric = windowTexture('#181420', ['#ffe0a0', '#d8c8ff'], 9, 7, 0.3);
    var texHarbor = windowTexture('#1a1a20', ['#ffd890'], 6, 3, 0.15, 'rgba(60,62,70,0.9)');

    function lam(tex) {
      return new THREE.MeshLambertMaterial({ map: tex, emissive: 0xbbbbcc, emissiveMap: tex, vertexColors: true });
    }
    // the second landmass draws its own meshes but shares the city's window
    // textures and sign atlas, so the two read as one world
    city.tex = { downtown: texDowntown, strip: texStrip, generic: texGeneric, harbor: texHarbor };
    city.signTex = atlas.tex;
    city.lam = lam;
    function addMesh(batch, mat) {
      var m = new THREE.Mesh(batch.build(), mat);
      m.matrixAutoUpdate = false;
      scene.add(m);
      return m;
    }
    addMesh(batches.ground, new THREE.MeshLambertMaterial({ vertexColors: true }));
    addMesh(asphalt, new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 70, specular: 0x232e42 }));
    // road paint always wins its tie against the asphalt beneath it — a
    // depth-only nudge toward the camera, so no altitude can blur the two
    addMesh(batches.marks, new THREE.MeshBasicMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
    addMesh(batches.downtown, lam(texDowntown));
    addMesh(batches.strip, lam(texStrip));
    addMesh(batches.generic, lam(texGeneric));
    addMesh(batches.harbor, lam(texHarbor));
    addMesh(batches.wood, new THREE.MeshLambertMaterial({ vertexColors: true }));
    city.signMesh = addMesh(batches.signs, new THREE.MeshBasicMaterial({ map: atlas.tex, transparent: true, vertexColors: true, side: THREE.DoubleSide }));
    var glowMat = new THREE.MeshBasicMaterial({ map: radialGlowTexture('rgba(255,176,102,0.55)'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    addMesh(batches.glow, glowMat);

    buildInstancedProps(scene);
    buildLandmarks(scene);
    buildAirport(scene);
    // last, so its clearance tests can see every structure in the world — the
    // terminal, the hospitals, the station, the tower and the bridges all
    // register after the streets do, and a ramp placed before them can end up
    // inside one, or square across a bridge deck
    if (GAME.isla) GAME.isla.build(scene);
    buildRamps(scene);
    buildLaneGraph();
    buildSpots();
  };

  function addSign(batch, slotIdx, x, y, z, rotY, w, h, tint) {
    var s = city.signSlots[slotIdx];
    batch.addWallQuad(x, y, z, w, h, rotY, tint === undefined ? 0xffffff : tint, s.u0, s.v0, s.u1, s.v1);
  }

  function buildBlocks(batches, atlas) {
    for (var bi = 0; bi < R.length - 1; bi++) for (var bj = 0; bj < R.length - 1; bj++) {
      var cx = (R[bi] + R[bi + 1]) / 2, cz = (R[bj] + R[bj + 1]) / 2;
      var d = city.districtAt(cx, cz);
      if (d === 'downtown') buildDowntownBlock(batches, cx, cz);
      else if (d === 'strip') buildStripBlock(batches, cx, cz, bi === R.length - 2);
      else if (d === 'harbor') buildHarborBlock(batches, cx, cz);
      else buildGenericBlock(batches, cx, cz);
    }
  }

  // true if the footprint would sit on a driving lane of any road
  function overlapsRoad(minX, maxX, minZ, maxZ) {
    var m = ROAD_HALF + 1.5;
    for (var i = 0; i < R.length; i++) {
      if (minX < R[i] + m && maxX > R[i] - m) return true;
      if (minZ < R[i] + m && maxZ > R[i] - m) return true;
    }
    return false;
  }

  function tryBuilding(batch, cx, cz, sx, sz, h, color, uvScale) {
    if (overlapsReserved(cx - sx / 2, cx + sx / 2, cz - sz / 2, cz + sz / 2)) return false;
    // never build across a carriageway — it blocks the street and makes map
    // routes look like they run straight through the block
    if (overlapsRoad(cx - sx / 2, cx + sx / 2, cz - sz / 2, cz + sz / 2)) return false;
    batch.addBox(cx, h / 2, cz, sx, h, sz, 0, color, uvScale);
    addSolid(cx, cz, sx, sz, h);
    return true;
  }

  function buildDowntownBlock(batches, cx, cz) {
    var shades = [0x8a94b8, 0x6a7aa0, 0x9aa8c8, 0x5a6488, 0x7a88b0];
    for (var lx = -1; lx <= 1; lx += 2) for (var lz = -1; lz <= 1; lz += 2) {
      if (rng() < 0.22) continue;
      var w = U.randRange(rng, 18, 30), dep = U.randRange(rng, 18, 30);
      var h = U.randRange(rng, 32, 88) * (1 - U.dist(cx, cz, -100, -100) / 900);
      var x = cx + lx * 19, z = cz + lz * 19;
      if (tryBuilding(batches.downtown, x, z, w, dep, h, U.pick(rng, shades), 32)) {
        batches.downtown.addBox(x, 1.5, z, w + 4, 3, dep + 4, 0, 0x3a3448, 0);
        if (rng() < 0.28) {
          var slot = U.randInt(rng, 0, 17);
          addSign(batches.signs, slot, x, h + 3, z, rng() * Math.PI * 2, 22, 5);
        }
      }
    }
  }

  function buildStripBlock(batches, cx, cz, frontRow) {
    var pastel = [0xf7a8c4, 0x9fe8d8, 0xf9d99a, 0xb8a8e8, 0x8fd0f0, 0xf0b090, 0xe8f0b0];
    var n = frontRow ? 2 : U.randInt(rng, 2, 3);
    for (var k = 0; k < n; k++) {
      var w = U.randRange(rng, 22, 34), dep = U.randRange(rng, 16, 24);
      var h = U.randRange(rng, 14, 30);
      var x = frontRow ? cx + 18 : cx + U.randRange(rng, -20, 20);
      var z = cz - 38 + dep / 2 + k * (76 / n) + U.randRange(rng, 0, 76 / n - dep - 2);
      z = U.clamp(z, cz - 38 + dep / 2, cz + 38 - dep / 2);
      var col = U.pick(rng, pastel);
      if (tryBuilding(batches.strip, x, z, w, dep, h, col, 24)) {
        // stepped art-deco top
        batches.strip.addBox(x, h + 1.5, z, w * 0.6, 3, dep * 0.6, 0, col, 0);
        batches.strip.addBox(x, h + 3.7, z, w * 0.3, 1.6, dep * 0.3, 0, 0xfff0f8, 0);
        var slot = U.randInt(rng, 0, 17);
        var face = frontRow ? Math.PI / 2 : (rng() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
        var sx = x + (face > 0 ? w / 2 + 0.3 : -w / 2 - 0.3);
        addSign(batches.signs, slot, sx, h * 0.75, z, face > 0 ? Math.PI / 2 : -Math.PI / 2, Math.min(20, dep * 0.9), 4.5);
        city.palmSpots.push({ x: x + U.randRange(rng, -w, w) * 0.7, z: z + dep / 2 + 3, s: U.randRange(rng, 0.8, 1.15) });
      }
    }
  }

  function buildHarborBlock(batches, cx, cz) {
    var w = U.randRange(rng, 46, 62), dep = U.randRange(rng, 26, 34);
    var h = U.randRange(rng, 9, 13);
    tryBuilding(batches.harbor, cx, cz - 16, w, dep, h, U.pick(rng, [0x8a6a58, 0x6a7078, 0x707a68, 0x806858]), 40);
    // container stacks
    var colors = [0xc85040, 0x4078a8, 0x50a068, 0xb89040, 0x9060a0];
    for (var r = 0; r < 3; r++) {
      var zz = cz + 14 + r * 8;
      if (rng() < 0.3) continue;
      var count = U.randInt(rng, 2, 4);
      for (var c = 0; c < count; c++) {
        var xx = cx - 28 + c * 16 + U.randRange(rng, 0, 4);
        var stack = U.randInt(rng, 1, 3);
        for (var s = 0; s < stack; s++) {
          containerData.push({ x: xx, y: 1.3 + s * 2.6, z: zz, rot: U.randRange(rng, -0.06, 0.06), color: colors[U.randInt(rng, 0, colors.length - 1)] });
        }
        addSolid(xx, zz, 12.2, 2.6, 2.6 * stack, 'prop');
      }
    }
  }

  function buildGenericBlock(batches, cx, cz) {
    var shades = [0xb08878, 0x88a090, 0xa898b0, 0x90a8b8, 0xb0a080];
    var n = U.randInt(rng, 3, 5);
    for (var k = 0; k < n; k++) {
      var w = U.randRange(rng, 14, 26), dep = U.randRange(rng, 14, 26);
      var h = U.randRange(rng, 7, 18);
      var x = cx + U.randRange(rng, -24, 24), z = cz + U.randRange(rng, -24, 24);
      var ok = true;
      var q = city.hash.query(x, z, Math.max(w, dep) * 0.72);
      for (var qq = 0; qq < q.length; qq++) if (q[qq].tag === 'building') { ok = false; break; }
      if (ok) tryBuilding(batches.generic, x, z, w, dep, h, U.pick(rng, shades), 28);
    }
    if (rng() < 0.4) city.palmSpots.push({ x: cx + U.randRange(rng, -30, 30), z: cz + U.randRange(rng, -30, 30), s: U.randRange(rng, 0.8, 1.1) });
  }

  function buildPOIs(batches, atlas) {
    var P = city.pois;
    // soft pools of light under the civic glow — one additive mesh for all of
    // them, tinted per quad, so a lantern or a canopy lights its pavement
    var pools = new GeoBatch();
    // hospitals (the island builds its own; this is Costa Rosa's). The
    // universal read, per the vision: white slab, a red cross TOWER you can
    // see down the avenue, a red-underlit EMERGENCY canopy you can drive
    // beneath, and cool lit window bands. Not a white shoebox.
    P.hospitals.forEach(function (H) {
      if (H.isla) return;
      batches.generic.addBox(H.x, 9, H.z - 12, 60, 18, 28, 0, 0xd8e8f0, 28);
      addSolid(H.x, H.z - 12, 60, 28, 18);
      batches.generic.addBox(H.x, 1.5, H.z - 12, 60.6, 3, 28.6, 0, 0xc05a6a, 0);      // base band
      // cornice as a RIM, not a slab — a slab across the roof re-buries
      // anyone standing on the solid beneath it (the observatory lesson).
      // The short strips BUTT against the long ones instead of running the
      // full depth — overlapped corners are two coplanar faces flickering
      [[0, -14.15, 60.6, 0.9], [0, 14.15, 60.6, 0.9], [-30.15, 0, 0.9, 27.4], [30.15, 0, 0.9, 27.4]].forEach(function (c) {
        batches.generic.addBox(H.x + c[0], 18.35, H.z - 12 + c[1], c[2], 0.7, c[3], 0, 0xb8ccd8, 0);
      });
      batches.generic.addBox(H.x - 22, 20.4, H.z - 12, 10, 4, 10, 0, 0xc8dce8, 0);    // plant room
      // the cross tower: an ivory fin on the front corner, taller than the
      // roof, wearing a red cross on three faces — the thing you steer by
      batches.generic.addBox(H.x + 26, 13, H.z + 1, 4, 26, 4, 0, 0xe6f0f6, 0);
      addSolid(H.x + 26, H.z + 1, 4, 4, 26);
      // an equal-armed PLUS, both bars centred on one point — the old long
      // vertical with its crossbar riding high read as a church steeple,
      // not a clinic. (The two bars sit at different depths off the face
      // on purpose: coplanar overlap at the middle would flicker.)
      // ...as ONE cross THROUGH the fin, not a plate per face. Per-face
      // plates sat at different depths, their 5 m arms overhung the 4 m
      // tower, and any diagonal view jumbled the side plates in front of
      // the front one. Two concentric bars extruded through each axis read
      // as a clean plus from every direction instead. (The tiny size
      // nudges keep overlapping faces off each other's planes.)
      batches.marks.addBox(H.x + 26, 21.6, H.z + 1, 1.3, 3.8, 4.5, 0, 0xe23a4a, 0);
      batches.marks.addBox(H.x + 26, 21.6, H.z + 1, 3.8, 1.32, 4.48, 0, 0xe23a4a, 0);
      batches.marks.addBox(H.x + 26, 21.6, H.z + 1, 4.5, 3.78, 1.28, 0, 0xe23a4a, 0);
      batches.marks.addBox(H.x + 26, 21.6, H.z + 1, 4.48, 1.3, 3.82, 0, 0xe23a4a, 0);
      // lit ward bands across the facade, cool white — a hospital never sleeps
      [7, 10.5, 14].forEach(function (wy) {
        batches.marks.addBox(H.x - 4, wy, H.z + 2.07, 46, 0.8, 0.12, 0, 0xcfe8f4, 0);
      });
      // the EMERGENCY canopy: drive-through height, red glow underneath,
      // the word itself on the fascia, and a red wash on the bay beneath
      batches.generic.addBox(H.x, 5.3, H.z + 5.4, 22, 0.8, 7, 0, 0xe8f0f4, 0);
      batches.marks.addBox(H.x, 4.82, H.z + 5.4, 21, 0.18, 6.2, 0, 0xe23a4a, 0);
      [[-9.5, 3.2], [9.5, 3.2], [-9.5, 7.6], [9.5, 7.6]].forEach(function (cc) {
        batches.generic.addBox(H.x + cc[0], 2.45, H.z + cc[1], 0.7, 4.9, 0.7, 0, 0xe8f0f4, 0);
      });
      addSign(batches.signs, 43, H.x, 5.35, H.z + 9.05, 0, 16, 1.7);
      pools.addGroundQuad(H.x, 0.1, H.z + 5.4, 24, 10, 0, 0x8a1622);
      batches.marks.addGroundQuad(H.x - 8, 0.09, H.z + 5.4, 0.5, 6, 0, 0xe8e8ec);
      batches.marks.addGroundQuad(H.x + 8, 0.09, H.z + 5.4, 0.5, 6, 0, 0xe8e8ec);
      // roof cross, for the air
      batches.marks.addGroundQuad(H.x, 18.08, H.z - 12, 2.2, 8, 0, 0xe23a4a);
      batches.marks.addGroundQuad(H.x, 18.08, H.z - 12, 8, 2.2, 0, 0xe23a4a);
      addSign(batches.signs, 19, H.x - 6, 15.2, H.z + 2.3, 0, 26, 4.4);
      // the beacon over the cross tower, blinking ambulance-red
      kmesh(0.7, 0.7, 0.7, 0xff3b4e, H.x + 26, 26.8, H.z + 1, { blink: 1.6, duty: 0.55 });
    });
    // The find: a helipad crowning a downtown tower, with a helicopter on it.
    // It shows on no map — the way onto it is out of the sky, a parachute off
    // the plane onto the roof, and the reward for arriving is a way off again.
    // This is the mainland's only helicopter. It used to sit on the hospital
    // roof, but eighteen metres is barely a find; now it takes real flying.
    var HT = { x: 0, z: -200, h: 72 };
    batches.downtown.addBox(HT.x, HT.h / 2, HT.z, 30, HT.h, 30, 0, 0xb8c4e8, 28);
    addSolid(HT.x, HT.z, 30, 30, HT.h);
    var roofY = HT.h + 0.06, padX = HT.x, padZ = HT.z;
    // low parapet, scenery only — a wall solid up here would fight the skids.
    // Inset from the tower edge (outer faces shared the wall planes) and
    // mitred at the corners (the bars used to overlap there, both faces
    // fighting for the same pixels on approach from the air)
    [[-14.3, 0, 1.2, 29.8], [14.3, 0, 1.2, 29.8], [0, -14.3, 27.4, 1.2], [0, 14.3, 27.4, 1.2]].forEach(function (pp) {
      batches.generic.addBox(HT.x + pp[0], HT.h + 0.5, HT.z + pp[1], pp[2], 1.0, pp[3], 0, 0x8a94b8, 0);
    });
    batches.ground.addGroundQuad(padX, roofY + 0.06, padZ, 16, 16, 0, 0x1a1a22);
    batches.marks.addGroundQuad(padX - 2.2, roofY + 0.12, padZ, 1, 7, 0, 0xf0d020);
    batches.marks.addGroundQuad(padX + 2.2, roofY + 0.12, padZ, 1, 7, 0, 0xf0d020);
    batches.marks.addGroundQuad(padX, roofY + 0.12, padZ, 3.6, 1, 0, 0xf0d020);
    // the pad ring breathes now — four bars in their own little mesh, pulsing
    // so the pad can be found from the air the way the vision asks
    var ringB = new GeoBatch();
    [[-6.6, 0, 1.2, 13.6], [6.6, 0, 1.2, 13.6], [0, -6.6, 13.6, 1.2], [0, 6.6, 13.6, 1.2]].forEach(function (q) {
      ringB.addGroundQuad(padX + q[0], roofY + 0.1, padZ + q[1], q[2], q[3], 0, 0x3ac8e0);
    });
    var ringMesh = new THREE.Mesh(ringB.build(), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.8 }));
    ringMesh.matrixAutoUpdate = false;
    city.scene.add(ringMesh);
    city.kinetics.push({ m: ringMesh, pulse: 2.1, lo: 0.35, hi: 0.95 });
    // the corporate crown: a lit band under the parapet, and aircraft-warning
    // reds on the corners blinking in alternating pairs — the downtown
    // silhouette is the one with the moving lights
    [[0, -14.9, 29.4, 0.5], [0, 14.9, 29.4, 0.5], [-14.9, 0, 0.5, 28.6], [14.9, 0, 0.5, 28.6]].forEach(function (cb) {
      batches.marks.addBox(HT.x + cb[0], HT.h - 1.6, HT.z + cb[1], cb[2], 0.7, cb[3], 0, 0x8fb4ff, 0);
    });
    [[-14.2, -14.2, 0], [14.2, 14.2, 0], [-14.2, 14.2, 0.7], [14.2, -14.2, 0.7]].forEach(function (bc) {
      kmesh(0.55, 0.55, 0.55, 0xff2f3e, HT.x + bc[0], HT.h + 1.55, HT.z + bc[1], { blink: 1.4, duty: 0.5, phase: bc[2] });
    });
    addSign(batches.signs, 21, HT.x, HT.h - 5.5, HT.z - 15.1, Math.PI, 22, 3.2);
    addSign(batches.signs, 21, HT.x, HT.h - 5.5, HT.z + 15.1, 0, 22, 3.2);
    city.roofHelipad = { x: padX, z: padZ, y: roofY };
    // the find has to be findable: the tower shows from half the map, so the
    // helicopter on it exists at long range instead of popping in at 210 m —
    // an empty pad seen from the strip read as "there is no helicopter"
    city.parkedSpots.push({ x: padX, z: padZ, y: roofY, heading: Math.PI / 2, vtype: 'helicopter', range: 420, despawn: 480 });

    // police station (Costa Rosa's; the island builds its own): a navy deco
    // fortress, per the vision — raised steps to the portico, twin glowing
    // blue lantern globes (the oldest cop-shop signal there is), a pulsing
    // blue parapet band like a lightbar at rest, and the badge on the face
    batches.generic.addBox(P.police.x, 7, P.police.z + 10, 70, 14, 26, 0, 0x8a94c0, 28);
    addSolid(P.police.x, P.police.z + 10, 70, 26, 14);
    batches.generic.addBox(P.police.x, 1.4, P.police.z + 10, 70.6, 2.8, 26.6, 0, 0x2c3a6a, 0);   // base band
    // short cornice strips butt against the long ones — mitred, not overlapped
    [[0, -13.15, 70.6, 0.9], [0, 13.15, 70.6, 0.9], [-35.15, 0, 0.9, 25.4], [35.15, 0, 0.9, 25.4]].forEach(function (c) {
      batches.generic.addBox(P.police.x + c[0], 14.35, P.police.z + 10 + c[1], c[2], 0.7, c[3], 0, 0x6a76a8, 0);
    });
    batches.generic.addBox(P.police.x, 4.9, P.police.z - 4.6, 16, 0.7, 4.4, 0, 0x2c3a6a, 0);      // portico
    [-6, 6].forEach(function (cx3) {
      batches.generic.addBox(P.police.x + cx3, 2.45, P.police.z - 6.2, 0.8, 4.9, 0.8, 0, 0xc8d0e8, 0);
    });
    // steps up to the doors
    batches.generic.addBox(P.police.x, 0.18, P.police.z - 6.9, 16, 0.36, 1.6, 0, 0x9aa4c4, 0);
    batches.generic.addBox(P.police.x, 0.5, P.police.z - 5.8, 14.5, 0.32, 1.3, 0, 0x9aa4c4, 0);
    // lantern globes on posts flanking the steps, with light on the pavement
    [-5.6, 5.6].forEach(function (lx) {
      batches.generic.addBox(P.police.x + lx, 1.5, P.police.z - 8.4, 0.35, 3.0, 0.35, 0, 0x3a4472, 0);
      batches.marks.addBox(P.police.x + lx, 3.3, P.police.z - 8.4, 0.8, 0.9, 0.8, 0, 0x66b4ff, 0);
      pools.addGroundQuad(P.police.x + lx, 0.1, P.police.z - 8.4, 9, 9, 0, 0x1c4a9a);
    });
    // cool light over the doors
    batches.marks.addBox(P.police.x, 5.65, P.police.z - 3.1, 14, 0.35, 0.16, 0, 0xbcd7ff, 0);
    // the badge: shield and star over the portico
    batches.marks.addBox(P.police.x, 9.2, P.police.z - 3.12, 3.0, 3.4, 0.2, 0, 0x2456c8, 0);
    batches.marks.addBox(P.police.x, 9.2, P.police.z - 3.2, 2.0, 2.3, 0.14, 0, 0xdce8ff, 0);
    batches.marks.addBox(P.police.x, 9.2, P.police.z - 3.3, 0.8, 0.8, 0.1, 0, 0x2456c8, 0);
    // parapet band, breathing slow blue — its own mesh so it can pulse
    var pbB = new GeoBatch();
    [[0, -13.05, 69.8, 0.45], [0, 13.05, 69.8, 0.45], [-34.9, 0, 0.45, 25.2], [34.9, 0, 0.45, 25.2]].forEach(function (pb) {
      // proud of the roofline — flush with it, band top and roof top shimmered
      pbB.addBox(P.police.x + pb[0], 13.95, P.police.z + 10 + pb[1], pb[2], 0.5, pb[3], 0, 0x3a78e8, 0);
    });
    var pbMesh = new THREE.Mesh(pbB.build(), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.8 }));
    pbMesh.matrixAutoUpdate = false;
    city.scene.add(pbMesh);
    city.kinetics.push({ m: pbMesh, pulse: 1.5, lo: 0.4, hi: 0.95 });
    batches.generic.addBox(P.police.x + 28, 9, P.police.z - 2, 0.4, 18, 0.4, 0, 0xb8c0d8, 0);     // mast
    batches.marks.addBox(P.police.x + 29.2, 16.5, P.police.z - 2, 2.4, 1.4, 0.1, 0, 0x4da3ff, 0); // pennant
    addSign(batches.signs, 20, P.police.x, 11.6, P.police.z - 3.3, Math.PI, 26, 4.5);
    // respray garages: three walls + roof, opening faces west toward a road —
    // grease with a neon wink, per the vision: a spray gun dripping neon on
    // the fascia, a fan of paint chips, tires and a barrel at the mouth, and
    // work-lamp warmth inside instead of showroom white
    P.resprays.forEach(function (G) {
      batches.generic.addBox(G.x, 4, G.z - 7, 24, 8, 2, 0, 0x585068, 0);
      batches.generic.addBox(G.x, 4, G.z + 7, 24, 8, 2, 0, 0x585068, 0);
      batches.generic.addBox(G.x + 11, 4, G.z, 2, 8, 12, 0, 0x585068, 0);
      batches.generic.addBox(G.x, 8.5, G.z, 26, 1.4, 17, 0, 0x484058, 0);
      addSolid(G.x, G.z - 7, 24, 2, 8, 'building');
      addSolid(G.x, G.z + 7, 24, 2, 8, 'building');
      addSolid(G.x + 11, G.z, 2, 12, 8, 'building');
      city.dressRespray(batches.generic, batches.marks, pools, G.x, G.z, 0);
      addSign(batches.signs, 18, G.x - 12.6, 6.7, G.z, -Math.PI / 2, 10, 2.5);
    });
    // DEPARTURES over the terminal doors, and an amber band along its face —
    // the airport's own buildings are dressed in buildAirport; the lettering
    // lives here because this is where the sign batch is
    var A2 = city.airport;
    addSign(batches.signs, 44, A2.cx + 30, 7.6, A2.cz + 36.1, 0, 24, 2.4);
    batches.marks.addBox(A2.cx + 30, 9.3, A2.cz + 36.08, 60, 0.5, 0.14, 0, 0xffb44a, 0);
    var poolsMesh = new THREE.Mesh(pools.build(), new THREE.MeshBasicMaterial({
      vertexColors: true, map: radialGlowTexture('rgba(255,255,255,0.6)'),
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    poolsMesh.matrixAutoUpdate = false;
    city.scene.add(poolsMesh);
  }

  // the respray trade dress, shared by every garage in the city (the island
  // calls this too): neon spray gun with drips that actually drip, paint
  // chips across the roof edge, tires and a barrel, a warm lamp inside.
  // The mouth faces -x; gy lifts everything onto island terrain.
  city.dressRespray = function (b, marks, pools, gx, gz, gy) {
    // backboard and the gun in neon: body, grip, nozzle, and a pink fan
    marks.addBox(gx - 13.25, gy + 10.3, gz, 0.2, 2.6, 4.2, 0, 0x14101f, 0);
    marks.addBox(gx - 13.4, gy + 10.7, gz + 0.3, 0.22, 0.8, 1.7, 0, 0x38e8ff, 0);   // body
    marks.addBox(gx - 13.4, gy + 9.9, gz + 0.9, 0.2, 1.0, 0.5, 0, 0x38e8ff, 0);     // grip
    marks.addBox(gx - 13.4, gy + 10.7, gz - 0.8, 0.2, 0.34, 0.5, 0, 0x38e8ff, 0);   // nozzle
    [[-1.5, 0.5], [-1.75, 0.0], [-1.5, -0.5]].forEach(function (sp) {
      marks.addBox(gx - 13.4, gy + 10.7 + sp[1], gz - 0.8 + sp[0], 0.18, 0.26, 0.26, 0, 0xff4fa3, 0);
    });
    // the drips, blinking down the board in sequence
    [0, 1, 2].forEach(function (di) {
      city.kmesh(0.26, 0.3, 0.26, 0xff4fa3, gx - 13.42, gy + 9.6 - di * 0.55, gz - 2.05,
        { blink: 1.8, duty: 0.34, phase: 1.8 - di * 0.6 });
    });
    // paint chips along the roof edge over the mouth
    [0xff4fa3, 0x38e8ff, 0xffe14f, 0x7dff6a, 0xc86bff, 0xff8a3d].forEach(function (chip, ci) {
      marks.addBox(gx - 13.06, gy + 8.5, gz - 4.0 + ci * 1.6, 0.14, 0.8, 0.9, 0, chip, 0);
    });
    // tires one side of the mouth, a barrel the other
    [0, 1, 2].forEach(function (ti) {
      b.addBox(gx - 12.6, gy + 0.28 + ti * 0.56, gz - 9.3, 1.5, 0.52, 1.5, ti * 0.5, 0x1a1a20, 0);
    });
    b.addBox(gx - 12.6, gy + 0.7, gz + 9.2, 0.95, 1.4, 0.95, 0, 0xd8862e, 0);
    // work-lamp warmth on the back wall, and its wash on the floor
    marks.addBox(gx + 9.85, gy + 5.4, gz, 0.16, 0.9, 7, 0, 0xffd890, 0);
    pools.addGroundQuad(gx + 2, gy + 0.12, gz, 16, 12, 0, 0x6a4a16);
  };

  var containerData = [];

  function buildBeach(scene, batches) {
    // Boardwalk planks and railing, in lengths with a gap wherever a bridge
    // approach crosses. Laid as one long run it put a handrail straight across
    // the road onto the bridge.
    function crossed(z) {
      // The beach's four doorways: the two piers and the two bridge
      // approaches (those register as crossings). Everywhere else the rail
      // runs unbroken — and SOLID, so these gaps are the only ground-level
      // ways through for cars and walkers.
      for (var pi2 = 0; pi2 < PIERS.length; pi2++) if (Math.abs(z - PIERS[pi2][0]) <= 8) return true;
      return city.crossings.length &&
        (city.crossingY(360, z) !== null || city.crossingY(371, z) !== null);
    }
    var runZ = null;
    for (var bz = -490; bz <= 490; bz += 2) {
      var open = !crossed(bz);
      if (open && runZ === null) runZ = bz;
      if ((!open || bz >= 490) && runZ !== null) {
        var mid = (runZ + bz) / 2, span = bz - runZ;
        if (span > 4) {
          batches.wood.addBox(365, 0.15, mid, 10, 0.3, span, 0, 0x7a5a40, 0);
          // hip height now, and real: the rail stops cars and pedestrians,
          // while a standing jump (apex ~1.2 m) clears the 1.05 m top — on
          // foot you can always vault onto the sand and back
          batches.wood.addBox(370.2, 0.98, mid, 0.24, 0.14, span - 1, 0, 0xb08a60, 0);
          addSolid(370.2, mid, 0.36, span - 1, 1.05, 'rail', true);
        }
        runZ = null;
      }
    }
    for (var z = -488; z < 488; z += 6) {
      if ((z / 6 | 0) % 2 === 0 && !crossed(z)) batches.wood.addBox(365, 0.32, z, 10, 0.04, 3, 0, 0x6a4c34, 0);
    }
    for (var zr = -486; zr < 488; zr += 4) {
      if (!crossed(zr)) batches.wood.addBox(370.2, 0.52, zr, 0.18, 1.04, 0.18, 0, 0x9a7a58, 0);
    }
    // Each pier's mouth gets a threshold apron: the boardwalk SLAB continues
    // across the band to the deck. The crossed() gap exists for the RAILING —
    // leaving the ground out with it showed sixteen metres of open sea
    // between the road and the first plank of the pier.
    // The apron runs 18 m, one metre off-centre to the south: the boardwalk
    // runs are laid on a 2 m grid, and the run south of the mouth resumes at
    // pz+10 while the old 16 m apron ended at pz+8 — a two-metre slot of
    // MISSING TIMBER at every pier entry, open water showing through it.
    PIERS.forEach(function (pp) {
      batches.wood.addBox(365.1, 0.15, pp[0] + 1, 10.2, 0.3, 18, 0, 0x7a5a40, 0);
      batches.wood.addBox(365, 0.32, pp[0] - 4, 10, 0.04, 3, 0, 0x6a4c34, 0);
      batches.wood.addBox(365, 0.32, pp[0] + 4, 10, 0.04, 3, 0, 0x6a4c34, 0);
    });

    // Sand strip built as segments following the shoreline. The segments
    // overhang their neighbours half a metre so no seam ever opens — but
    // overhangs at the SAME height are the flicker audit's biggest family:
    // from a plane, every overlap shimmered. Neighbours now alternate
    // heights, and the wet band floats well clear of the dry sand.
    var sand = new GeoBatch();
    var sandShades = [0xd8c496, 0xd0bc8e, 0xdcc89c, 0xccb888];
    var sIdx = 0;
    // The two channel bridges leave the strip at z -350 and z 150 and cross
    // the whole beach at deck height before they climb. The sand carpet must
    // part around those corridors: laid straight through, the anti-flicker
    // height tiers sat ON TOP of the flat approach — the road sunk in sand.
    // The cut has to match the DECK, and it did not: the decks are 14 m wide
    // (half: 7, isla.js) spanning z -357..-343 and 143..157, while these cuts
    // took out 18 m. That left two metres of bare nothing down each side of
    // each bridge — and since the beach there is already below sea level, what
    // showed through was open water, a slot of sea cut into the sand right
    // where you drive onto the span.
    //
    // The cuts are the band the deck covers at EVERY x across the beach, not
    // its width at one of them: the spans drift as they cross (the north
    // deck's south edge walks from z -357 at x=376 to -355.25 at x=426), so a
    // cut sized to the near end opens a sliver at the far end and a cut sized
    // to the far end is a slot at the near one. The measured intersections
    // are what is written above.
    //
    // What this costs is a strip about 1.4 m wide beside the north approach
    // where sand now lies under the deck's edge. Over the beach that approach
    // runs at y=0 (flat from x=360 to about x=400, climbing only past 405)
    // while the sand tiers sit at 0.06, so the sand stands a few centimetres
    // proud of the road there. Sand at the edge of a beach road is a great
    // deal less wrong than a slot of open water beside the bridge.
    //
    // Coupled to isla.js by hand because the spans are built long after this
    // carpet is; city.bridgeCuts is exported so a test can hold the two to
    // each other.
    var BRIDGE_CUTS = [[-355.2, -343.05], [144.05, 156.95]];
    city.bridgeCuts = BRIDGE_CUTS;
    function bandSegs(z0, z1) {
      var segs = [[z0, z1]];
      for (var bc = 0; bc < BRIDGE_CUTS.length; bc++) {
        var cut = BRIDGE_CUTS[bc], next = [];
        for (var sg = 0; sg < segs.length; sg++) {
          var a = segs[sg][0], b2 = segs[sg][1];
          if (cut[1] <= a || cut[0] >= b2) { next.push([a, b2]); continue; }
          if (cut[0] > a) next.push([a, cut[0]]);
          if (cut[1] < b2) next.push([cut[1], b2]);
        }
        segs = next;
      }
      return segs;
    }
    for (var sz = -500; sz < 500; sz += 20) {
      var mid = sz + 10;
      var w = city.shoreline(mid) + 6 - SAND_X0;
      // one shade draw per strip, split or not — the rng stream feeds every
      // placement after this loop, and an extra draw would reshuffle the city
      var shade = U.pick(rng, sandShades);
      var segs = bandSegs(sz - 0.25, sz + 20.25);
      for (var sg2 = 0; sg2 < segs.length; sg2++) {
        var za = segs[sg2][0], zb = segs[sg2][1];
        if (zb - za < 0.6) continue;
        sand.addGroundQuad(SAND_X0 + w / 2, 0.06 + (sIdx % 2) * 0.06, (za + zb) / 2, w, zb - za, 0, shade);
        // darker wet band at the waterline
        sand.addGroundQuad(SAND_X0 + w - 4, 0.2, (za + zb) / 2, 9, zb - za, 0, 0xb0a078);
      }
      sIdx++;
    }
    // Narrow sand fringes along the island's other shores. Each family of
    // strips lives on its own height tier: where the west fringe crosses the
    // north and south runs at the map corners, same-tier overlaps shimmered
    // from the air just like the beach bands did.
    for (var fz = -520; fz < 520; fz += 20) {
      var wsh = city.westShore(fz + 10);
      sand.addGroundQuad(wsh + 6, 0.22 + (sIdx % 2) * 0.06, fz + 10, 26, 20.5, 0, U.pick(rng, sandShades));
      sIdx++;
    }
    for (var fx = -520; fx < 380; fx += 20) {
      var nsh = city.northShore(fx + 10);
      sand.addGroundQuad(fx + 10, 0.46 + (sIdx % 2) * 0.06, nsh + 6, 20.5, 26, 0, U.pick(rng, sandShades));
      var ssh = city.southShore(fx + 10);
      sand.addGroundQuad(fx + 10, 0.46 + ((sIdx + 1) % 2) * 0.06, ssh - 6, 20.5, 26, 0, U.pick(rng, sandShades));
      sIdx++;
    }
    var sandMesh = new THREE.Mesh(sand.build(), new THREE.MeshLambertMaterial({ vertexColors: true }));
    sandMesh.matrixAutoUpdate = false;
    scene.add(sandMesh);

    // piers
    var pier = new GeoBatch();
    PIERS.forEach(function (p) {
      // the deck begins past the boardwalk (which ends at x=370) — it used
      // to start at 362 and lay its planks across the footpath to the road
      var pz = p[0], x0 = 370.2, endX = p[1];
      // top face at 0.5 — exactly where groundY puts feet and wheels on the
      // pier (the old box topped out at 0.75 and everyone waded through it)
      pier.addBox((x0 + endX) / 2, 0.375, pz, endX - x0, 0.25, 14, 0, 0x7a5a40, 0);
      for (var px = 376; px < endX; px += 12) {
        pier.addBox(px, -0.7, pz - 6, 0.8, 3.4, 0.8, 0, 0x4a3828, 0);
        pier.addBox(px, -0.7, pz + 6, 0.8, 3.4, 0.8, 0, 0x4a3828, 0);
      }
      pier.addBox((x0 + endX) / 2, 1.35, pz - 6.8, endX - x0, 0.12, 0.2, 0, 0xb08a60, 0);
      if (pz === 250) {
        // the casino terrace: a pad off the south rail, the rail parted
        // around its mouth so the walkway to the wheel stays clear. Sized
        // for the palace now, with a double row of piles under the weight.
        pier.addBox(452, 0.375, 266, 27, 0.25, 20, 0, 0x7a5a40, 0);
        [[443.5, 268.5], [452, 272.5], [460.5, 268.5], [443.5, 274.8], [460.5, 274.8]].forEach(function (cp) {
          pier.addBox(cp[0], -0.7, cp[1], 0.8, 3.4, 0.8, 0, 0x4a3828, 0);
        });
        pier.addBox((x0 + 442) / 2, 1.35, pz + 6.8, 442 - x0, 0.12, 0.2, 0, 0xb08a60, 0);
        pier.addBox((462 + endX) / 2, 1.35, pz + 6.8, endX - 462, 0.12, 0.2, 0, 0xb08a60, 0);
      } else {
        pier.addBox((x0 + endX) / 2, 1.35, pz + 6.8, endX - x0, 0.12, 0.2, 0, 0xb08a60, 0);
      }
    });
    var pierMesh = new THREE.Mesh(pier.build(), new THREE.MeshLambertMaterial({ vertexColors: true }));
    pierMesh.matrixAutoUpdate = false;
    scene.add(pierMesh);
    // the pier's name board arches OVER the mouth now — it used to hang low
    // across the north half of the walk like a wall
    addSign(batches.signs, 22, 380, 7.9, 250, -Math.PI / 2, 18, 3.2);
    addSign(batches.signs, 23, 470, 7, -173, -Math.PI / 2, 14, 3.5);

    // ocean surrounds the island
    // wide enough to reach past the far island; the plane has to hold both
    // landmasses and the horizon beyond them
    var og = new THREE.PlaneGeometry(3600, 3000, 72, 60);
    og.rotateX(-Math.PI / 2);
    og.translate(450, -0.35, 0);
    city.oceanGeo = og;
    city.oceanBase = og.attributes.position.array.slice();
    // the ocean plane spans the whole map, so its inland vertices sit just under
    // the streets. Sink those and never animate them — otherwise wave crests rise
    // through the asphalt as flickering blue patches.
    var ob = city.oceanBase, mask = new Uint8Array(ob.length / 3);
    for (var vi = 0, m = 0; vi < ob.length; vi += 3, m++) {
      var vx = ob[vi], vz = ob[vi + 2];
      mask[m] = city.isInWater(vx, vz) ? 1 : 0;
      if (!mask[m]) og.attributes.position.array[vi + 1] = -4;
    }
    city.oceanMask = mask;
    og.attributes.position.needsUpdate = true;
    var om = new THREE.MeshPhongMaterial({ color: 0x0d2242, shininess: 120, specular: 0x8899cc, transparent: true, opacity: 0.93 });
    var ocean = new THREE.Mesh(og, om);
    scene.add(ocean);

    // moon glitter streak
    var streakTex = radialGlowTexture('rgba(200,220,255,0.8)');
    var streak = new THREE.Mesh(new THREE.PlaneGeometry(30, 320), new THREE.MeshBasicMaterial({ map: streakTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.35 }));
    streak.rotation.x = -Math.PI / 2;
    streak.position.set(600, -0.1, -60);
    scene.add(streak);
    city.streak = streak;

    // beach palms along the boardwalk
    for (var bz = -470; bz < 480; bz += 24) {
      city.palmSpots.push({ x: 372.8, z: bz + U.randRange(rng, -3, 3), s: U.randRange(rng, 0.9, 1.25) });
      if (rng() < 0.5) city.palmSpots.push({ x: U.randRange(rng, 380, 400), z: bz + U.randRange(rng, 0, 20), s: U.randRange(rng, 0.75, 1.1) });
    }
  }

    function skyGradient(stops) {
      var cv = document.createElement('canvas');
      cv.width = 32; cv.height = 256;
      var g = cv.getContext('2d');
      var gr = g.createLinearGradient(0, 256, 0, 0);
      for (var i = 0; i < stops.length; i++) gr.addColorStop(stops[i][0], stops[i][1]);
      g.fillStyle = gr; g.fillRect(0, 0, 32, 256);
      return new THREE.CanvasTexture(cv);
    }

  function buildSky(scene) {
    var nightTex = skyGradient([
      [0, '#3a1440'], [0.12, '#5a1e52'], [0.24, '#8a2a5e'],
      [0.38, '#4a2266'], [0.6, '#221244'], [1, '#0a0620']
    ]);
    var dayTex = skyGradient([
      [0, '#ffd7a8'], [0.14, '#ffb98a'], [0.3, '#8fb8e8'],
      [0.55, '#5a92d8'], [1, '#2f63b0']
    ]);
    city.skyTextures = { night: nightTex, day: dayTex };
    // The whole celestial set rides in one group that follows the camera.
    // Built world-anchored, the dome circled the MAINLAND's origin — and Isla
    // Verde's east coast reaches within 240 m of its rim, where the horizon
    // band stood up out of the sea like a wall and the ocean plane carried on
    // past it. A horizon you can drive to isn't a horizon; pinned to the
    // viewer it is unreachable from every island, including future ones.
    var celestial = new THREE.Group();
    scene.add(celestial);
    city.skyAnchor = celestial;
    // base dusk/night dome (tinted darker at deep night) with a day dome fading over it
    var sky = new THREE.Mesh(new THREE.SphereGeometry(1400, 20, 14), new THREE.MeshBasicMaterial({ map: nightTex, side: THREE.BackSide, fog: false, depthWrite: false }));
    sky.renderOrder = -10;
    celestial.add(sky);
    city.sky = sky;
    var skyDay = new THREE.Mesh(new THREE.SphereGeometry(1390, 20, 14), new THREE.MeshBasicMaterial({ map: dayTex, side: THREE.BackSide, fog: false, depthWrite: false, transparent: true, opacity: 0 }));
    skyDay.renderOrder = -9;
    celestial.add(skyDay);
    city.skyDay = skyDay;

    var starPos = [];
    for (var i = 0; i < 420; i++) {
      var az = rng() * Math.PI * 2, el = 0.12 + rng() * 1.35;
      var r2 = 1300;
      starPos.push(r2 * Math.cos(el) * Math.cos(az), r2 * Math.sin(el), r2 * Math.cos(el) * Math.sin(az));
    }
    var sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    var stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xcfd8ff, size: 2.6, fog: false, sizeAttenuation: false }));
    celestial.add(stars);
    city.stars = stars;

    var moon = new THREE.Mesh(new THREE.CircleGeometry(60, 24), new THREE.MeshBasicMaterial({ color: 0xf0ead8, fog: false }));
    moon.position.set(1150, 520, -220);
    moon.lookAt(0, 0, 0);
    celestial.add(moon);
    city.moon = moon;
    var halo = new THREE.Mesh(new THREE.CircleGeometry(130, 24), new THREE.MeshBasicMaterial({ map: radialGlowTexture('rgba(220,225,255,0.5)'), transparent: true, blending: THREE.AdditiveBlending, fog: false, depthWrite: false }));
    halo.position.copy(moon.position).multiplyScalar(0.985);
    halo.lookAt(0, 0, 0);
    celestial.add(halo);
    city.moonHalo = halo;
  }

  // df in [0,1]: 0 = deep night, ~0.4 = dusk/sunset, 1 = full day
  city.applyTimeOfDay = function (df) {
    if (city.sky) city.sky.material.color.setScalar(U.clamp(0.32 + df * 1.1, 0.32, 1));
    if (city.skyDay) city.skyDay.material.opacity = U.clamp((df - 0.6) / 0.32, 0, 1);
    if (city.stars) { city.stars.material.opacity = U.clamp(1 - df * 2.2, 0, 1); city.stars.material.transparent = true; city.stars.visible = df < 0.5; }
    if (city.moon) city.moon.material.opacity = U.clamp(1 - df * 1.6, 0.05, 1), city.moon.material.transparent = true;
    if (city.moonHalo) city.moonHalo.material.opacity = U.clamp(0.5 - df * 0.8, 0, 0.5);
    // street lamps burn at night, fade out through dusk, and are off in daylight
    var lampOn = U.clamp(1 - (df - 0.45) / 0.35, 0, 1);
    if (city.lampGlow) {
      city.lampGlow.material.opacity = lampOn;
      city.lampGlow.visible = lampOn > 0.02;
    }
    if (city.lampHeads) {
      city.lampHeads.material.color.setRGB(
        U.lerp(0.42, 1, lampOn), U.lerp(0.44, 0.784, lampOn), U.lerp(0.5, 0.54, lampOn));
    }
    city.dayMode = df > 0.7;
  };
  city.setDaytime = function (day) { city.applyTimeOfDay(day ? 1 : 0); };
  // finishing EVERYTHING trades the rooftop tour helicopter for the TALON —
  // the mainland helipad spot re-arms with the gunship
  city.gunshipUnlocked = false;
  city.unlockGunship = function () {
    if (city.gunshipUnlocked) return;
    city.gunshipUnlocked = true;
    for (var i = 0; i < city.parkedSpots.length; i++) {
      var sp = city.parkedSpots[i];
      if (sp.vtype === 'helicopter' && sp.y !== undefined) {
        sp.vtype = 'gunship';
        if (sp.live && !sp.live.dead && sp.live !== GAME.player.car) { GAME.vehicles.removeCar(sp.live); sp.live = null; }
      }
    }
  };
  // reward for finding every stunt jump: a monster truck waiting at the airport
  city.monsterSpot = null;
  city.unlockMonsterTruck = function () {
    if (city.monsterSpot) return;
    city.monsterSpot = { x: city.airport.apron.x + 14, z: city.airport.apron.z + 16, heading: 0, vtype: 'monster' };
    city.parkedSpots.push(city.monsterSpot);
  };

  function buildInstancedProps(scene) {
    var dummy = new THREE.Object3D();

    // palms
    // extra palms scattered on boulevard sidewalks
    for (var z = -460; z < 480; z += 40) {
      city.palmSpots.push({ x: 341.5, z: z, s: 1 });
    }
    // nothing gets planted where a bridge runs — a palm through the deck is
    // as wrong as a building on it
    // nothing gets planted on a pier's walkway either — a palm mid-deck was
    // a tree trunk square in the path to the ferris wheel
    var palms = city.palmSpots.filter(function (q) {
      if (city.nearCrossing(q.x, q.z, 9)) return false;
      if (q.x > 366 && (Math.abs(q.z - 250) < 10 || Math.abs(q.z + 180) < 10)) return false;
      return true;
    });
    var trunkGeo = new THREE.CylinderGeometry(0.16, 0.3, 6.4, 5);
    trunkGeo.translate(0, 3.2, 0);
    var trunkMesh = new THREE.InstancedMesh(trunkGeo, new THREE.MeshLambertMaterial({ color: 0x6a4c34 }), palms.length);
    var frondB = new GeoBatch();
    for (var f = 0; f < 7; f++) {
      var a = f / 7 * Math.PI * 2;
      var fl = 2.6;
      frondB.addBox(Math.cos(a) * fl * 0.42, 6.3 + 0.28 - 0.34 * (fl * 0.42 / fl), Math.sin(a) * fl * 0.42, fl, 0.1, 0.55, -a, 0x2e7a4a, 0);
    }
    var frondGeo = frondB.build();
    // tilt fronds downward by shifting outer edge: cheap visual, skip exact droop
    var frondMesh = new THREE.InstancedMesh(frondGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), palms.length);
    for (var p = 0; p < palms.length; p++) {
      var pp = palms[p];
      dummy.position.set(pp.x, city.groundY(pp.x, pp.z), pp.z);
      dummy.rotation.set(0, rng() * Math.PI * 2, 0);
      dummy.scale.setScalar(pp.s || 1);
      dummy.updateMatrix();
      trunkMesh.setMatrixAt(p, dummy.matrix);
      frondMesh.setMatrixAt(p, dummy.matrix);
      if (pp.x < 356) addSolid(pp.x, pp.z, 0.8, 0.8, 6, 'prop', true);
    }
    scene.add(trunkMesh); scene.add(frondMesh);

    // streetlights along roads; skip spots that land inside a crossing road
    function nearAnyRoad(v) {
      for (var r = 0; r < R.length; r++) if (Math.abs(v - R[r]) < 13) return true;
      return false;
    }
    var lightSpots = [];
    function addLight(x, z, rot) {
      if (city.inAirport(x, z) || city.nearCrossing(x, z, 9)) return;
      lightSpots.push({ x: x, z: z, rot: rot });
    }
    for (var i = 0; i < R.length; i++) {
      for (var d = -450; d <= 450; d += 60) {
        if (!nearAnyRoad(d + 20)) addLight(R[i] + 7.4, d + 20, Math.PI);
        if (!nearAnyRoad(d - 10)) addLight(R[i] - 7.4, d - 10, 0);
        if (d >= -480 && d + 20 < 356) {
          if (!nearAnyRoad(d + 20)) addLight(d + 20, R[i] + 7.4, Math.PI / 2);
          if (!nearAnyRoad(d - 10)) addLight(d - 10, R[i] - 7.4, -Math.PI / 2);
        }
      }
    }
    var poleB = new GeoBatch();
    poleB.addBox(0, 3, 0, 0.22, 6, 0.22, 0, 0x3a3f4a, 0);
    poleB.addBox(0.9, 5.9, 0, 2, 0.16, 0.16, 0, 0x3a3f4a, 0);
    var poleGeo = poleB.build();
    var poleMesh = new THREE.InstancedMesh(poleGeo, new THREE.MeshLambertMaterial({ vertexColors: true }), lightSpots.length);
    var headGeo = new THREE.BoxGeometry(0.7, 0.22, 0.3);
    headGeo.translate(1.8, 5.8, 0);
    var headMesh = new THREE.InstancedMesh(headGeo, new THREE.MeshBasicMaterial({ color: 0xffc88a }), lightSpots.length);
    var glowB = new GeoBatch();
    for (var L = 0; L < lightSpots.length; L++) {
      var ls = lightSpots[L];
      dummy.position.set(ls.x, 0, ls.z);
      dummy.rotation.set(0, ls.rot, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      poleMesh.setMatrixAt(L, dummy.matrix);
      headMesh.setMatrixAt(L, dummy.matrix);
      addSolid(ls.x, ls.z, 0.5, 0.5, 6, 'prop', true);
    }
    scene.add(poleMesh); scene.add(headMesh);
    // warm pools of light on the road
    var glowGeoB = new GeoBatch();
    for (var L2 = 0; L2 < lightSpots.length; L2++) {
      var ls2 = lightSpots[L2];
      glowGeoB.addGroundQuad(ls2.x + Math.cos(ls2.rot) * 1.8, 0.07, ls2.z - Math.sin(ls2.rot) * 1.8, 11, 11, 0, 0xffffff);
    }
    var glowMesh = new THREE.Mesh(glowGeoB.build(), new THREE.MeshBasicMaterial({ map: radialGlowTexture('rgba(255,170,90,0.34)'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    glowMesh.matrixAutoUpdate = false;
    scene.add(glowMesh);
    // the lamps switch off in daylight (see applyTimeOfDay)
    city.lampHeads = headMesh;
    city.lampGlow = glowMesh;

    // hydrants at intersection corners
    var hyd = [];
    for (var hi = 0; hi < R.length - 1; hi++) for (var hj = 0; hj < R.length - 1; hj++) {
      if ((hi + hj) % 3 !== 0) continue;
      hyd.push({ x: R[hi] + 8.2, z: R[hj] + 8.2 });
    }
    var hydGeo = new THREE.CylinderGeometry(0.24, 0.3, 0.8, 6);
    hydGeo.translate(0, 0.55, 0);
    var hydMesh = new THREE.InstancedMesh(hydGeo, new THREE.MeshLambertMaterial({ color: 0xc84848 }), hyd.length);
    for (var hh = 0; hh < hyd.length; hh++) {
      dummy.position.set(hyd[hh].x, 0, hyd[hh].z);
      dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(1);
      dummy.updateMatrix();
      hydMesh.setMatrixAt(hh, dummy.matrix);
      addSolid(hyd[hh].x, hyd[hh].z, 0.6, 0.6, 1, 'prop', true);
    }
    scene.add(hydMesh);

    // benches on the boardwalk
    var benches = [];
    for (var bz = -440; bz < 460; bz += 55) benches.push({ x: 367.5, z: bz });
    var benchB = new GeoBatch();
    benchB.addBox(0, 0.5, 0, 0.5, 0.08, 2.2, 0, 0x8a6a48, 0);
    benchB.addBox(-0.25, 0.75, 0, 0.08, 0.6, 2.2, 0, 0x8a6a48, 0);
    benchB.addBox(0.18, 0.25, -0.9, 0.1, 0.5, 0.1, 0, 0x44403a, 0);
    benchB.addBox(0.18, 0.25, 0.9, 0.1, 0.5, 0.1, 0, 0x44403a, 0);
    var benchMesh = new THREE.InstancedMesh(benchB.build(), new THREE.MeshLambertMaterial({ vertexColors: true }), benches.length);
    for (var bb = 0; bb < benches.length; bb++) {
      dummy.position.set(benches[bb].x, 0.3, benches[bb].z);
      dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(1); dummy.updateMatrix();
      benchMesh.setMatrixAt(bb, dummy.matrix);
    }
    scene.add(benchMesh);

    // shipping containers
    if (containerData.length) {
      var contGeo = new THREE.BoxGeometry(12, 2.6, 2.6);
      var contMesh = new THREE.InstancedMesh(contGeo, new THREE.MeshLambertMaterial(), containerData.length);
      var col = new THREE.Color();
      for (var ci = 0; ci < containerData.length; ci++) {
        var cd = containerData[ci];
        dummy.position.set(cd.x, cd.y, cd.z);
        dummy.rotation.set(0, cd.rot, 0); dummy.scale.setScalar(1); dummy.updateMatrix();
        contMesh.setMatrixAt(ci, dummy.matrix);
        contMesh.setColorAt(ci, col.setHex(cd.color));
      }
      scene.add(contMesh);
    }
  }

  function buildLandmarks(scene) {
    // central tower with lit crown
    var twr = new GeoBatch();
    twr.addBox(-100, 55, -100, 26, 110, 26, Math.PI / 4, 0x9aa8d0, 32);
    twr.addBox(-100, 113, -100, 14, 6, 14, Math.PI / 4, 0x30284a, 0);
    // the tower is rotated 45°: its AABB is 26·√2 ≈ 37 wide. The old 30x30
    // solid undershot the corners, so a helicopter setting down near one
    // stood on air and fell through "the roof". The crown gets its own cap.
    addSolid(-100, -100, 37, 37, 110);
    addSolid(-100, -100, 15, 15, 111.2);
    var twrTex = windowTexture('#0e1226', ['#a8e8ff', '#ffd0e8', '#ffe9a8'], 10, 9, 0.6);
    var twrMesh = new THREE.Mesh(twr.build(), new THREE.MeshLambertMaterial({ map: twrTex, emissive: 0xccccdd, emissiveMap: twrTex, vertexColors: true }));
    twrMesh.matrixAutoUpdate = false;
    scene.add(twrMesh);
    var crown = new THREE.Mesh(new THREE.BoxGeometry(15, 1.6, 15), new THREE.MeshBasicMaterial({ color: 0xff4fa3 }));
    crown.position.set(-100, 110.4, -100);
    crown.rotation.y = Math.PI / 4;
    scene.add(crown);
    var signB = new GeoBatch();
    // the two faces used to sit in the SAME plane — two double-sided quads
    // fighting for depth is exactly the flicker the name board showed
    addSign(signB, 21, -100, 119, -100.25, 0, 26, 5);
    addSign(signB, 21, -100, 119, -99.75, Math.PI, 26, 5);
    var sm = new THREE.Mesh(signB.build(), city.signMesh.material);
    sm.matrixAutoUpdate = false;
    scene.add(sm);

    // ferris wheel at the end of the long pier — an outer group orients it,
    // an inner group spins about the hub (local Z) with rim, spokes and cabs rigid
    var wheel = new THREE.Group();
    var spin = new THREE.Group();
    wheel.add(spin);
    var rim = new THREE.Mesh(new THREE.TorusGeometry(15, 0.5, 6, 22), new THREE.MeshBasicMaterial({ color: 0x38e8ff }));
    spin.add(rim);
    var spokeMat = new THREE.MeshBasicMaterial({ color: 0xff4fa3 });
    for (var sI = 0; sI < 4; sI++) {
      var spoke = new THREE.Mesh(new THREE.BoxGeometry(30, 0.34, 0.34), spokeMat);
      spoke.rotation.z = sI / 4 * Math.PI; // spread in the wheel's XY plane
      spin.add(spoke);
    }
    var cabGeo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
    var cabs = new THREE.InstancedMesh(cabGeo, new THREE.MeshBasicMaterial({ color: 0xffe14f }), 8);
    spin.add(cabs);
    city.wheelCabs = cabs;
    city.wheelSpin = spin;
    // stand the wheel up facing the shore. It rides the pier, and the pier
    // moved a block south when the bridge took the z=150 slot.
    var WZ = PIERS[0][0];
    wheel.rotation.y = Math.PI / 2;
    wheel.position.set(492, 17.5, WZ);
    scene.add(wheel);
    city.wheel = wheel;
    var supB = new GeoBatch();
    supB.addBox(492, 8.5, WZ - 6, 1.2, 17, 1.2, 0, 0x555a6a, 0);
    supB.addBox(492, 8.5, WZ + 6, 1.2, 17, 1.2, 0, 0x555a6a, 0);
    var sup = new THREE.Mesh(supB.build(), new THREE.MeshLambertMaterial({ vertexColors: true }));
    sup.matrixAutoUpdate = false;
    scene.add(sup);
    addSolid(492, WZ, 3, 14, 17, 'prop');

    // harbor cranes
    var craneB = new GeoBatch();
    [[-380, 460], [-260, 460]].forEach(function (c) {
      craneB.addBox(c[0] - 6, 14, c[1], 1.6, 28, 1.6, 0, 0xb0b060, 0);
      craneB.addBox(c[0] + 6, 14, c[1], 1.6, 28, 1.6, 0, 0xb0b060, 0);
      craneB.addBox(c[0], 28.5, c[1], 30, 2, 2.4, 0, 0xb0b060, 0);
      craneB.addBox(c[0] - 10, 22, c[1], 1, 12, 1, 0, 0x888840, 0);
      addSolid(c[0] - 6, c[1], 2, 2, 28, 'prop');
      addSolid(c[0] + 6, c[1], 2, 2, 28, 'prop');
    });
    var craneMesh = new THREE.Mesh(craneB.build(), new THREE.MeshLambertMaterial({ vertexColors: true }));
    craneMesh.matrixAutoUpdate = false;
    scene.add(craneMesh);
  }

  // long runway in the open southern strip (no blocks are generated past z=350)
  city.airport = {
    cx: -230, cz: 432, minX: -430, maxX: -30, z0: 419, z1: 445, apron: { x: -412, z: 432 },
    fx0: -448, fx1: -12, fz0: 404, fz1: 488, gate: { x: -160, w: 26 } // perimeter fence + a gate gap
  };
  function buildAirport(scene) {
    var A = city.airport;
    buildAirportFence(scene, A);
    var b = new GeoBatch();
    var marks = new GeoBatch();
    // runway asphalt
    b.addGroundQuad((A.minX + A.maxX) / 2, 0.04, A.cz, A.maxX - A.minX, 26, 0, 0x0e0c14);
    // dashed centerline, lifted clear of the asphalt so altitude can't blur them together
    for (var x = A.minX + 12; x < A.maxX - 12; x += 14) marks.addGroundQuad(x, 0.13, A.cz, 6, 0.5, 0, 0xd8c46a);
    // threshold bars at each end
    for (var t = -1; t <= 1; t += 2) {
      for (var k = -4; k <= 4; k += 2) {
        marks.addGroundQuad(A.cx + t * ((A.maxX - A.minX) / 2 - 6), 0.13, A.cz + k * 1.4, 4, 0.9, 0, 0xf0f0f0);
      }
    }
    // apron pad — it overlaps the runway strip, so it sits a clear step above
    b.addGroundQuad(A.apron.x, 0.17, A.apron.z, 34, 34, 0, 0x1a1a22);
    // threshold end lights: green where you land, red where you must not
    for (var te = -4; te <= 4; te += 2) {
      marks.addGroundQuad(A.minX + 2, 0.13, A.cz + te * 1.4, 1.2, 1.0, 0, 0x38e878);
      marks.addGroundQuad(A.maxX - 2, 0.13, A.cz + te * 1.4, 1.2, 1.0, 0, 0xe23a4a);
    }
    var rw = new THREE.Mesh(b.build(), new THREE.MeshLambertMaterial({ vertexColors: true }));
    rw.matrixAutoUpdate = false; scene.add(rw);
    // terminal building + control tower, south of the runway — jet-age, per
    // the vision: a green-glazed cab you can read from the runway, a rotating
    // beacon above it, and a windsock on the apron
    var tb = new GeoBatch();
    tb.addBox(A.cx + 30, 6, A.cz + 28, 84, 12, 16, 0, 0x8a94b0, 28);
    tb.addBox(A.cx + 40, 12, A.cz + 26, 8, 24, 8, 0, 0x9aa8c8, 0); // tower
    tb.addBox(A.cx + 40, 25, A.cz + 26, 11, 4, 11, 0, 0x141824, 0); // tower cab
    tb.addBox(A.apron.x + 20, 3, A.apron.z - 14, 0.3, 6, 0.3, 0, 0xd0d4dc, 0);  // windsock pole
    var mk = new THREE.Mesh(marks.build(), new THREE.MeshBasicMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
    mk.matrixAutoUpdate = false; scene.add(mk);
    // cab glazing, lit controller-green on all four faces — standing a hand
    // proud of the cab, because flush with it the two planes fought (the
    // flickering tower glass of the audit's origin story)
    var cabB = new GeoBatch();
    [[0, 5.85, 10.6, 0.3], [0, -5.85, 10.6, 0.3], [5.85, 0, 0.3, 10.0], [-5.85, 0, 0.3, 10.0]].forEach(function (cg) {
      cabB.addBox(A.cx + 40 + cg[0], 25.1, A.cz + 26 + cg[1], cg[2], 1.6, cg[3], 0, 0x8fffc8, 0);
    });
    var cabMesh = new THREE.Mesh(cabB.build(), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9 }));
    cabMesh.matrixAutoUpdate = false; scene.add(cabMesh);
    city.kinetics.push({ m: cabMesh, pulse: 1.1, lo: 0.55, hi: 1.0 });
    // the beacon: a bright bar sweeping over the cab
    city.kmesh(2.6, 0.22, 0.22, 0xf4f8ff, A.cx + 40, 27.5, A.cz + 26, { spin: 3.4 });
    // windsock: three fading orange segments, stiff in the sea breeze
    var wsB = new GeoBatch();
    [[0.0, 1.3, 0.7, 0xff7a2e], [1.2, 1.0, 0.55, 0xff9a52], [2.2, 0.8, 0.4, 0xffc088]].forEach(function (ws) {
      wsB.addBox(A.apron.x + 20.9 + ws[0], 5.7, A.apron.z - 14, ws[1], ws[2], ws[2], 0, ws[3], 0);
    });
    var wsMesh = new THREE.Mesh(wsB.build(), new THREE.MeshBasicMaterial({ vertexColors: true }));
    wsMesh.matrixAutoUpdate = false; scene.add(wsMesh);
    var tbm = new THREE.Mesh(tb.build(), new THREE.MeshLambertMaterial({ vertexColors: true }));
    tbm.matrixAutoUpdate = false; scene.add(tbm);
    addSolid(A.cx + 30, A.cz + 28, 84, 16, 12);
    addSolid(A.cx + 40, A.cz + 26, 8, 8, 24);
    // runway edge lights
    var glowB = new GeoBatch();
    for (var gx = A.minX; gx <= A.maxX; gx += 24) {
      glowB.addGroundQuad(gx, 0.06, A.cz - 13.5, 2, 2, 0, 0xffffff);
      glowB.addGroundQuad(gx, 0.06, A.cz + 13.5, 2, 2, 0, 0xffffff);
    }
    var glowMesh = new THREE.Mesh(glowB.build(), new THREE.MeshBasicMaterial({ map: radialGlowTexture('rgba(120,180,255,0.6)'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    glowMesh.matrixAutoUpdate = false; scene.add(glowMesh);
  }
  city.inAirport = function (x, z) {
    var A = city.airport;
    return x > A.fx0 && x < A.fx1 && z > A.fz0 && z < A.fz1;
  };

  function buildAirportFence(scene, A) {
    var b = new GeoBatch();
    var railColor = 0x9aa0ac, postColor = 0x6a7078;
    // posts + top rail along a segment (x0,z0)->(x1,z1)
    function run(x0, z0, x1, z1) {
      var len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / 5));
      for (var k = 0; k <= n; k++) {
        var t = k / n, px = x0 + (x1 - x0) * t, pz = z0 + (z1 - z0) * t;
        b.addBox(px, 1.4, pz, 0.24, 2.8, 0.24, 0, postColor, 0);
      }
      var mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, ang = Math.atan2(x1 - x0, z1 - z0);
      b.addBox(mx, 2.5, mz, 0.1, 0.16, len, ang, railColor, 0);
      b.addBox(mx, 1.7, mz, 0.1, 0.12, len, ang, railColor, 0);
      b.addBox(mx, 0.9, mz, 0.1, 0.12, len, ang, railColor, 0);
    }
    // north edge split around the gate
    var gL = A.gate.x - A.gate.w / 2, gR = A.gate.x + A.gate.w / 2;
    run(A.fx0, A.fz0, gL, A.fz0); run(gR, A.fz0, A.fx1, A.fz0);
    run(A.fx0, A.fz1, A.fx1, A.fz1);       // south
    run(A.fx0, A.fz0, A.fx0, A.fz1);       // west
    run(A.fx1, A.fz0, A.fx1, A.fz1);       // east
    var mesh = new THREE.Mesh(b.build(), new THREE.MeshLambertMaterial({ vertexColors: true }));
    mesh.matrixAutoUpdate = false;
    scene.add(mesh);
    // solid collision segments (thin walls), leaving the gate open
    addSolid((A.fx0 + gL) / 2, A.fz0, gL - A.fx0, 0.5, 3, 'fence', true);
    addSolid((gR + A.fx1) / 2, A.fz0, A.fx1 - gR, 0.5, 3, 'fence', true);
    addSolid((A.fx0 + A.fx1) / 2, A.fz1, A.fx1 - A.fx0, 0.5, 3, 'fence', true);
    addSolid(A.fx0, (A.fz0 + A.fz1) / 2, 0.5, A.fz1 - A.fz0, 3, 'fence', true);
    addSolid(A.fx1, (A.fz0 + A.fz1) / 2, 0.5, A.fz1 - A.fz0, 3, 'fence', true);
  }

  // The only helipad in the world is on the Alta Verde lookout now — Isla Verde
  // sets this when it registers. Until the bridges open there is no helicopter
  // anywhere, which is the point.
  city.helipad = { x: 402, z: 300 };

  // wedge-shaped jump ramps scattered around the city. They are drivable
  // surfaces (see rampAt / groundY), not solids, so you ride up and launch.
  // Lay out the 25 stunt-jump ramps. Anchors go near landmarks; the rest fill
  // in along road verges, spread out and clear of buildings and water.
  function rollStuntSpots() {
    var A = city.airport, H = city.pois.hospitals, PL = city.pois.police;
    var anchors = [
      { x: -194, z: 208, rot: Math.PI / 2, h: 6.6, len: 22 },   // harbour warehouses
      { x: -294, z: 308, rot: Math.PI / 2, h: 6.6, len: 22 },
      { x: -430, z: -170, rot: Math.PI, h: 5.6, len: 24 },      // riverside
      { x: 366, z: -230, rot: Math.PI, h: 5.0, len: 26 },       // boardwalk
      { x: -78, z: A.cz, rot: Math.PI / 2, h: 7.2, len: 32, boost: true }, // runway end -> over the fence
      { x: A.cx + 30, z: 462, rot: Math.PI / 2, h: 6.4, len: 30 }, // airport apron
      { x: A.cx - 90, z: 462, rot: -Math.PI / 2, h: 6.4, len: 30 },
      { x: H[0].x + 34, z: H[0].z + 30, rot: 0, h: 4.6, len: 22 },  // hospital
      { x: H[1].x + 34, z: H[1].z + 30, rot: 0, h: 4.6, len: 22 },
      { x: PL.x + 34, z: PL.z + 30, rot: 0, h: 4.6, len: 22 },      // police station
      { x: 232, z: 132, rot: Math.PI, h: 4.6, len: 22 },            // ferris wheel side
      { x: 68, z: -168, rot: 0, h: 4.2, len: 20 },
      { x: -168, z: -68, rot: Math.PI / 2, h: 4.2, len: 20 }
    ];
    var out = [], TARGET = 25;
    // Footprint-vs-carriageway clearance, 2 m margin. The old test looked
    // only at a ramp's CENTER against the gridlines, so a 34 m deck placed
    // beside a cross-street could stick nine metres of its base into the
    // traffic lanes — a jump ramp parked in the middle of the road.
    function roadClearRect(x, z, rot, w, len) {
      var alongX = Math.abs(Math.sin(rot)) > 0.5;
      var hx = (alongX ? len : w) / 2 + 2, hz = (alongX ? w : len) / 2 + 2;
      for (var i = 0; i < R.length; i++) {
        if (x + hx > R[i] - ROAD_HALF && x - hx < R[i] + ROAD_HALF) return false;
        if (z + hz > R[i] - ROAD_HALF && z - hz < R[i] + ROAD_HALF) return false;
      }
      return true;
    }
    // The chained jump, staged like it means it: a boosted launcher a real
    // gap back from a DEEP flat roof, so you land ON the roof with room to
    // drive, and a second lip at the far parapet drops you back onto the
    // street beyond. The host is found, not assumed: the deepest low roof
    // that gives the launcher a legal pad, a clear flight in, a long
    // rooftop run and an open landing. Capped at 26 m/s on an (h+0.4)-high
    // deck, touchdown falls ~2.17*(h+0.4) past the lip; the gap is sized to
    // put that five metres onto the roof.
    function placeChain() {
      var hosts = [];
      var all = city.hash.all;
      for (var i = 0; i < all.length; i++) {
        var B = all[i];
        if (B.tag !== 'building' || B.h === undefined || B.h < 7 || B.h > 11.5) continue;
        var bdx = B.maxX - B.minX, bdz = B.maxZ - B.minZ;
        if (Math.max(bdx, bdz) < 44 || Math.min(bdx, bdz) < 14) continue;
        var bcx = (B.minX + B.maxX) / 2, bcz = (B.minZ + B.maxZ) / 2;
        if (bcx < -450 || bcx > 340 || Math.abs(bcz) > 470) continue;
        hosts.push(B);
      }
      hosts.sort(function (a, b) {
        return Math.max(b.maxX - b.minX, b.maxZ - b.minZ) - Math.max(a.maxX - a.minX, a.maxZ - a.minZ);
      });
      for (var h2 = 0; h2 < hosts.length; h2++) {
        var HB = hosts[h2];
        var roofY2 = HB.h;
        var axisX = (HB.maxX - HB.minX) >= (HB.maxZ - HB.minZ);
        var lo = axisX ? HB.minX : HB.minZ, hiF = axisX ? HB.maxX : HB.maxZ;
        var across = axisX ? (HB.minZ + HB.maxZ) / 2 : (HB.minX + HB.maxX) / 2;
        // The cap is solved, not fixed: a faster launcher throws a longer,
        // flatter arc, which lets the pad sit on the FAR side of a road
        // hugging the building — you fly the whole street on the way up.
        // vy at the lip equals cap*(h/26); drag bleeds ~20% of the throw in
        // the air, so the drag-free touchdown distance is aimed twelve
        // metres past the wall to actually set down a few metres onto it.
        var CAPS = [26, 29, 32, 34, 36, 38];
        for (var ci2 = 0; ci2 < CAPS.length; ci2++) {
        var cap2 = CAPS[ci2];
        var hL = roofY2 + 0.5;
        var vyL = cap2 * hL / 26;
        var dTouch = cap2 * (vyL + Math.sqrt(vyL * vyL + 48 * (hL - roofY2))) / 24;
        var G = dTouch - 12;
        for (var ds = 0; ds < 2; ds++) {
          var sgn = ds === 0 ? 1 : -1;
          var near = sgn > 0 ? lo : hiF, far = sgn > 0 ? hiF : lo;
          var lipA = near - sgn * G;
          var launchA = lipA - sgn * 13;                 // launcher centre (len 26)
          var lx = axisX ? launchA : across, lz = axisX ? across : launchA;
          var rot = axisX ? (sgn > 0 ? Math.PI / 2 : -Math.PI / 2) : (sgn > 0 ? 0 : Math.PI);
          if (lx < -460 || lx > 386 || Math.abs(lz) > 470) continue;
          if (city.isInWater(lx, lz) || city.inAirport(lx, lz)) continue;
          if (!roadClearRect(lx, lz, rot, 12, 26)) continue;
          // the launcher pad itself must stand on open ground
          var pad = city.hash.query(lx, lz, 20), blocked = false;
          var phx = (axisX ? 26 : 12) / 2 + 1.5, phz = (axisX ? 12 : 26) / 2 + 1.5;
          for (var pb = 0; pb < pad.length; pb++) {
            var q2 = pad[pb];
            if (lx + phx > q2.minX && lx - phx < q2.maxX && lz + phz > q2.minZ && lz - phz < q2.maxZ) { blocked = true; break; }
          }
          if (blocked) continue;
          // a capped booster hauls any entry speed up to its cap on the deck
          // itself, so it needs a mouthful of approach, not a runway: 20 m
          var app = true;
          for (var as2 = 2; as2 <= 20 && app; as2 += 3) {
            var aA = launchA - sgn * (13 + as2);
            for (var aw2 = -1; aw2 <= 1 && app; aw2++) {
              var apx = axisX ? aA : across + aw2 * 6;
              var apz = axisX ? across + aw2 * 6 : aA;
              var ab2 = city.hash.query(apx, apz, 2.5);
              for (var ai2 = 0; ai2 < ab2.length; ai2++) {
                var q3 = ab2[ai2];
                if (apx > q3.minX - 1.5 && apx < q3.maxX + 1.5 && apz > q3.minZ - 1.5 && apz < q3.maxZ + 1.5) { app = false; break; }
              }
            }
          }
          if (!app) continue;
          // clear flight in (nothing near roof height between lip and wall),
          // and an open landing past the far parapet — street is fair game,
          // towers are not, and neither is the sea
          var ok2 = true;
          for (var t2 = 2; t2 < G - 2 && ok2; t2 += 4) {
            var sx2 = (axisX ? lipA + sgn * t2 : across), sz2 = (axisX ? across : lipA + sgn * t2);
            var fb = city.hash.query(sx2, sz2, 7);
            for (var fi = 0; fi < fb.length; fi++) {
              if (fb[fi] !== HB && fb[fi].h !== undefined && fb[fi].h > roofY2 - 2) { ok2 = false; break; }
            }
          }
          if (!ok2) continue;
          // The drop is metered too: ramp2 is a capped strip (22 m/s), so
          // the landing falls a known ~30 m past the parapet. The corridor
          // check covers that plus margin; thin posts (lamps) don't count —
          // only real massing closes a landing zone.
          for (var t3 = 4; t3 <= 40 && ok2; t3 += 4) {
            var lx2 = (axisX ? far + sgn * t3 : across), lz2 = (axisX ? across : far + sgn * t3);
            if (lx2 < -466 || lx2 > 392 || Math.abs(lz2) > 472 || city.isInWater(lx2, lz2)) { ok2 = false; break; }
            var lb = city.hash.query(lx2, lz2, 7);
            for (var li = 0; li < lb.length; li++) {
              var lbb = lb[li];
              if (lbb === HB || lbb.h === undefined || lbb.h <= 4) continue;
              if (Math.min(lbb.maxX - lbb.minX, lbb.maxZ - lbb.minZ) < 3) continue;   // a post, not a wall
              ok2 = false; break;
            }
          }
          if (!ok2) continue;
          // launcher over the roofline, and the second lip at the far edge
          out.push({ x: lx, z: lz, rot: rot, w: 12, len: 26, h: hL, boost: true, cap: cap2 });
          var c2a = far - sgn * (0.5 + 8);               // ramp2 centre (len 16), lip at the edge
          out.push({ x: axisX ? c2a : across, z: axisX ? across : c2a, rot: rot, w: 12, len: 16, h: 4.6, base: roofY2, boost: true, cap: 22 });
          return true;
        }
        }
      }
      return false;
    }
    if (!placeChain()) {
      // fallback: the old hand-placed pair against the strip building
      var chainRoofY = city.surfaceY(2.2, 211.9);
      if (chainRoofY > 6 && chainRoofY < 10) {
        out.push({ x: -29.4, z: 211.9, rot: Math.PI / 2, w: 12, len: 26, h: chainRoofY + 0.4, boost: true, cap: 26 });
        out.push({ x: 2.2, z: 211.9, rot: Math.PI / 2, w: 12, len: 22, h: 5.0, base: chainRoofY });
      }
    }
    // ramps come in four sizes so no two jumps feel the same; every third one
    // gets a booster strip that slams the throttle open as you ride up it
    var SHAPES = [
      { w: 9, len: 16, h: 3.2 },    // kicker  — narrow, line it up
      { w: 13, len: 22, h: 4.4 },   // standard
      { w: 17, len: 28, h: 5.8 },   // long
      { w: 22, len: 34, h: 7.4 }    // mega    — wide enough to hit at an angle
    ];
    function varyRamp(x, z, rot, n) {
      var sh = SHAPES[n % SHAPES.length];
      return { x: x, z: z, rot: rot, w: sh.w, len: sh.len, h: sh.h, boost: n % 3 === 2 };
    }
    function ok(x, z) {
      if (city.isInWater(x, z)) return false;
      if (city.nearCrossing(x, z, 16)) return false;   // not on a bridge approach
      if (x < -470 || x > 396 || Math.abs(z) > 476) return false;
      for (var i = 0; i < out.length; i++) if (U.dist2(x, z, out[i].x, out[i].z) < 78 * 78) return false;
      var boxes = city.hash.query(x, z, 18);
      for (var b = 0; b < boxes.length; b++) {
        var q = boxes[b];
        if (x > q.minX - 14 && x < q.maxX + 14 && z > q.minZ - 14 && z < q.maxZ + 14) return false;
      }
      return true;
    }
    function offRoad(x, z) {
      for (var i = 0; i < R.length; i++) if (Math.abs(x - R[i]) < 12 || Math.abs(z - R[i]) < 12) return false;
      return true;
    }
    // The ramp deck and the run-up leading to it have to be clear across the
    // full width — testing only the centre point lets a wall sit square across
    // the approach, and then the jump can never be lined up at all.
    function approachClear(x, z, rot, w, len) {
      var c = Math.cos(rot), s = Math.sin(rot);
      for (var lz = -len / 2 - 34; lz <= len / 2; lz += 4) {
        for (var lx = -w / 2; lx <= w / 2 + 0.01; lx += w / 2) {
          var px = x + lx * c + lz * s, pz = z - lx * s + lz * c;
          var boxes = city.hash.query(px, pz, 3);
          for (var b = 0; b < boxes.length; b++) {
            var q = boxes[b];
            if (px > q.minX - 1.5 && px < q.maxX + 1.5 && pz > q.minZ - 1.5 && pz < q.maxZ + 1.5) return false;
          }
        }
      }
      return true;
    }
    // A jump you cannot land is not a jump. Range grows with the square of the
    // exit speed, so a boosted ramp throws you the better part of a block —
    // check where that puts you down before committing to the direction.
    function landingOk(x, z, rot, h, len, boost) {
      var v = boost ? 100 : 34;
      var range = v * v * (h / len) / 12;
      var ux = Math.sin(rot), uz = Math.cos(rot);
      for (var t = 0.45; t <= 1.3; t += 0.085) {
        var lx = x + ux * (len / 2 + range * t);
        var lz = z + uz * (len / 2 + range * t);
        if (lx < -466 || lx > 392 || Math.abs(lz) > 472) return false;
        if (city.isInWater(lx, lz)) return false;
      }
      // and nothing tall in the air corridor: a wall two metres past the lip
      // turns the jump into a face-plant that can never be credited
      for (var t2 = 0.1; t2 <= 1.3; t2 += 0.06) {
        var cx2 = x + ux * (len / 2 + range * t2);
        var cz2 = z + uz * (len / 2 + range * t2);
        var boxes = city.hash.query(cx2, cz2, 3);
        for (var b2 = 0; b2 < boxes.length; b2++) {
          var q2 = boxes[b2];
          if (q2.h === undefined || q2.h < 3) continue;
          if (cx2 > q2.minX - 2 && cx2 < q2.maxX + 2 && cz2 > q2.minZ - 2 && cz2 < q2.maxZ + 2) return false;
        }
      }
      return true;
    }
    for (var a = 0; a < anchors.length && out.length < TARGET; a++) {
      var an = anchors[a];
      // nudge an anchor off the carriageway if it landed on one
      for (var n = 0; n < 8 && !offRoad(an.x, an.z); n++) { an.x += 4; an.z += 4; }
      if (offRoad(an.x, an.z) && ok(an.x, an.z)) {
        var abst = an.boost !== undefined ? an.boost : (a % 3 === 1);
        // keep the hand-placed direction if it lands, else fire it the other way
        var arot = an.rot, aok = false;
        for (var f = 0; f < 2; f++) {
          if (roadClearRect(an.x, an.z, arot, 12, an.len) &&
            landingOk(an.x, an.z, arot, an.h, an.len, abst) && approachClear(an.x, an.z, arot, 12, an.len)) { aok = true; break; }
          arot += Math.PI;
        }
        if (!aok) continue;
        out.push({ x: an.x, z: an.z, rot: arot, w: 12, len: an.len, h: an.h, boost: abst });
      }
    }
    // fill the rest along road verges, alternating orientation
    for (var pass = 0; pass < 4 && out.length < TARGET; pass++) {
      for (var i2 = 0; i2 < R.length && out.length < TARGET; i2++) {
        for (var d = -400; d <= 400 && out.length < TARGET; d += 100) {
          var side = (i2 + pass) % 2 ? 1 : -1;
          var jitter = ((i2 * 37 + d + pass * 13) % 60) - 30;
          // wider ramps sit further from the kerb so they never reach the lanes
          var shape = SHAPES[out.length % SHAPES.length];
          var vergeOut = 11 + shape.w / 2;
          var bst = out.length % 3 === 2;
          // verge beside a north-south road, launching along it. The airfield
          // is off-limits to the filler: a random ramp beside the apron sat
          // right where the plane parks. (The hand-placed runway jumps stay.)
          var vx = R[i2] + side * vergeOut, vz = d + jitter;
          if (city.inAirport(vx, vz)) continue;
          if (offRoad(vx, vz) && ok(vx, vz)) {
            var vrot = side > 0 ? 0 : Math.PI, vok = false;
            for (var fv = 0; fv < 2; fv++) {
              if (roadClearRect(vx, vz, vrot, shape.w, shape.len) &&
                landingOk(vx, vz, vrot, shape.h, shape.len, bst) && approachClear(vx, vz, vrot, shape.w, shape.len)) { vok = true; break; }
              vrot += Math.PI;
            }
            if (vok) { out.push(varyRamp(vx, vz, vrot, out.length)); continue; }
          }
          // verge beside an east-west road
          var hx = d + jitter, hz = R[i2] + side * vergeOut;
          if (city.inAirport(hx, hz)) continue;
          if (hx < 340 && offRoad(hx, hz) && ok(hx, hz)) {
            var hrot = side > 0 ? Math.PI / 2 : -Math.PI / 2, hok = false;
            for (var fh = 0; fh < 2; fh++) {
              if (roadClearRect(hx, hz, hrot, shape.w, shape.len) &&
                landingOk(hx, hz, hrot, shape.h, shape.len, bst) && approachClear(hx, hz, hrot, shape.w, shape.len)) { hok = true; break; }
              hrot += Math.PI;
            }
            if (!hok) continue;
            out.push(varyRamp(hx, hz, hrot, out.length));
          }
        }
      }
    }
    return out;
  }

  function buildRamps(scene) {
    // 25 unique stunt jumps scattered across the city: construction ramps
    // parked on verges and aprons near landmarks, each one a find.
    var SPOTS = rollStuntSpots();
    var pos = [], col = [], nrm = [];
    function tri(ax, ay, az, bx, by, bz, cx2, cy, cz2, r, g, b) {
      var ux = bx - ax, uy = by - ay, uz = bz - az;
      var vx = cx2 - ax, vy = cy - ay, vz = cz2 - az;
      var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      var l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      nx /= l; ny /= l; nz /= l;
      pos.push(ax, ay, az, bx, by, bz, cx2, cy, cz2);
      for (var k = 0; k < 3; k++) { nrm.push(nx, ny, nz); col.push(r, g, b); }
    }
    for (var i = 0; i < SPOTS.length; i++) {
      var s = SPOTS[i];
      var c = Math.cos(s.rot), sn = Math.sin(s.rot);
      // world position of a local (across, along, up) point — `base` lifts
      // the whole wedge onto a roof when the spot calls for one
      function P(lx, lz, ly) {
        return [s.x + lx * c + lz * sn, ly + (s.base || 0), s.z - lx * sn + lz * c];
      }
      var hw = s.w / 2, hl = s.len / 2;
      var a0 = P(-hw, -hl, 0), b0 = P(hw, -hl, 0);      // bottom lip
      var a1 = P(-hw, hl, s.h), b1 = P(hw, hl, s.h);    // top lip
      var a1g = P(-hw, hl, 0), b1g = P(hw, hl, 0);      // top lip at ground
      // weathered concrete deck with a hazard-striped lip, like a construction
      // ramp left on site — not a neon prop
      var R1 = 0.44, G1 = 0.43, B1 = 0.47;
      if (s.boost) { R1 = 0.16; G1 = 0.72; B1 = 0.80; }   // booster strip
      var lipT = P(-hw, hl - 2.2, s.h * (1 - 2.2 / s.len)), lipB = P(hw, hl - 2.2, s.h * (1 - 2.2 / s.len));
      tri(a0[0], a0[1], a0[2], b0[0], b0[1], b0[2], lipB[0], lipB[1], lipB[2], R1, G1, B1);
      tri(a0[0], a0[1], a0[2], lipB[0], lipB[1], lipB[2], lipT[0], lipT[1], lipT[2], R1, G1, B1);
      // yellow warning band across the take-off edge
      var lipR = s.boost ? 0.30 : 0.85, lipG = s.boost ? 1.0 : 0.70, lipB2 = s.boost ? 1.0 : 0.18;
      tri(lipT[0], lipT[1], lipT[2], lipB[0], lipB[1], lipB[2], b1[0], b1[1], b1[2], lipR, lipG, lipB2);
      tri(lipT[0], lipT[1], lipT[2], b1[0], b1[1], b1[2], a1[0], a1[1], a1[2], lipR, lipG, lipB2);
      // booster decks wear chevrons up both edges so you can read the direction
      if (s.boost) {
        var deckY = function (lz) { return s.h * ((lz + hl) / s.len) + 0.07; };
        for (var ci = 0; ci < 3; ci++) {
          var cz2 = -hl + s.len * (0.28 + ci * 0.22);
          for (var sgn = -1; sgn <= 1; sgn += 2) {
            var ax2 = sgn * (s.w / 2 - 1.5);
            var tip = P(ax2, cz2 + 1.5, deckY(cz2 + 1.5));
            var bl = P(ax2 - 1.1, cz2 - 0.7, deckY(cz2 - 0.7));
            var br = P(ax2 + 1.1, cz2 - 0.7, deckY(cz2 - 0.7));
            tri(bl[0], bl[1], bl[2], br[0], br[1], br[2], tip[0], tip[1], tip[2], 0.60, 1.0, 1.0);
          }
        }
      }
      // back face
      tri(a1[0], a1[1], a1[2], b1[0], b1[1], b1[2], b1g[0], b1g[1], b1g[2], 0.20, 0.19, 0.23);
      tri(a1[0], a1[1], a1[2], b1g[0], b1g[1], b1g[2], a1g[0], a1g[1], a1g[2], 0.20, 0.19, 0.23);
      // side walls, tucked 2 cm inboard of the deck edge. Flush with it, a
      // ramp parked against the boardwalk put its side in the exact plane of
      // the boardwalk's raised lip and the two flickered — the audit found
      // two ramps doing precisely that. The 2 cm eave is invisible.
      var sa0 = P(-hw + 0.02, -hl, 0), sa1 = P(-hw + 0.02, hl, s.h), sa1g = P(-hw + 0.02, hl, 0);
      var sb0 = P(hw - 0.02, -hl, 0), sb1 = P(hw - 0.02, hl, s.h), sb1g = P(hw - 0.02, hl, 0);
      tri(sa0[0], sa0[1], sa0[2], sa1[0], sa1[1], sa1[2], sa1g[0], sa1g[1], sa1g[2], 0.31, 0.30, 0.34);
      tri(sb0[0], sb0[1], sb0[2], sb1g[0], sb1g[1], sb1g[2], sb1[0], sb1[1], sb1[2], 0.31, 0.30, 0.34);

      var rad = Math.max(s.w, s.len) / 2 + 2;
      city.ramps.push({
        idx: i, x: s.x, z: s.z, rot: s.rot, w: s.w, len: s.len, h: s.h, base: s.base || 0, boost: !!s.boost, cap: s.cap,
        cos: c, sin: sn,
        minX: s.x - rad, maxX: s.x + rad, minZ: s.z - rad, maxZ: s.z + rad
      });
      // the tall back face is solid: come at it from behind and you hit a wall.
      // It sits just beyond the lip and stops short of it, so a car launching
      // off the top sails over while one approaching from behind is stopped.
      var bc = P(0, hl + 1.1, 0);
      var across = Math.abs(Math.cos(s.rot)) > 0.5;
      addSolid(bc[0], bc[2], across ? s.w : 2.0, across ? 2.0 : s.w, (s.base || 0) + s.h * 0.62, 'building');
      // the raked flanks are solid too. Every ramp is axis-aligned, so each
      // side is three stepped boxes rising with the deck — walk or drive into
      // the side and you hit a wall, while anyone ON the deck stands above the
      // step beside them and riding up the low quarter still works for angled
      // hits on the approach. Boxes run lengthways along the ramp (world axis
      // depends on the rotation), one metre thick, flush with the deck edge.
      for (var sd = -1; sd <= 1; sd += 2) {
        for (var st = 0; st < 3; st++) {
          var t0 = 0.25 + st * 0.25, t1 = t0 + 0.25;
          var lzMid = -hl + s.len * (t0 + t1) / 2, lzLen = s.len * 0.25 + 0.2;
          var wc = P(sd * (s.w / 2 + 0.5), lzMid, 0);
          // each step tops out just BELOW the deck at its own low end, not at
          // its high end: capped at t1 the wall stood up to a quarter of the
          // ramp's height above the deck beside it, and stepping (or steering)
          // off the side hit solid air. Below-deck it still walls off anyone
          // coming at the flank from the ground, while the deck clears it.
          addSolid(wc[0], wc[2],
            across ? 1.0 : lzLen, across ? lzLen : 1.0,
            (s.base || 0) + Math.max(0.3, s.h * t0 - 0.35), 'prop', true);
        }
      }
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nrm), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3));
    var mesh = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
    mesh.matrixAutoUpdate = false;
    scene.add(mesh);
  }

  // One graph for the whole world. The mainland's is a grid and the island's
  // follows its curves, but both are just nodes with a neighbour list — traffic
  // and the map router never learn which landmass they are on.
  function buildLaneGraph() {
    var nodes = [], i, j;
    var grid = [];
    for (i = 0; i < R.length; i++) for (j = 0; j < R.length; j++) {
      grid.push({ x: R[i], z: R[j], i: i, j: j, nb: [] });
    }
    function gridAt(a, b) {
      if (a < 0 || b < 0 || a >= R.length || b >= R.length) return null;
      return grid[a * R.length + b];
    }
    grid.forEach(function (n) {
      [gridAt(n.i - 1, n.j), gridAt(n.i + 1, n.j), gridAt(n.i, n.j - 1), gridAt(n.i, n.j + 1)]
        .forEach(function (a) { if (a) n.nb.push(a); });
    });
    nodes = grid;
    if (GAME.isla) {
      var isl = GAME.isla.laneNodes(), spans = GAME.isla.spanNodes();
      nodes = nodes.concat(isl, spans);
      // stitch each bridge's end nodes into whichever graph is nearest
      spans.forEach(function (s) {
        var best = null, bd = 60 * 60;
        for (var k = 0; k < nodes.length; k++) {
          var n = nodes[k];
          if (n.span) continue;
          var d = U.dist2(s.x, s.z, n.x, n.z);
          if (d < bd) { bd = d; best = n; }
        }
        if (best) { s.nb.push(best); best.nb.push(s); }
      });
    }
    for (i = 0; i < nodes.length; i++) nodes[i].id = i;
    city.nodes = nodes;
    city.neighbors = function (n) { return n.nb; };
    city.nearestNode = function (x, z) {
      var best = null, bd = 1e18;
      for (var k = 0; k < nodes.length; k++) {
        var d = U.dist2(x, z, nodes[k].x, nodes[k].z);
        if (d < bd) { bd = d; best = nodes[k]; }
      }
      return best;
    };
  }

  function buildSpots() {
    // Parked cars hug the kerb of the road they are ON — but the grid crosses
    // itself every hundred metres, and a spot dropped at a junction hugs
    // nothing: it sits BROADSIDE in the middle of the road going the other
    // way. A car parked along z presents its whole length across an east-west
    // carriageway, which is a roadblock rather than a parked car, and traffic
    // piles up behind it. Eleven percent of them landed there, up to 5.7 m
    // past the crossing centreline.
    //
    // Clearance is measured to that centreline and has to cover the crossing
    // road's half-width plus the parked car's own half-length, or the nose
    // still pokes into the outside lane.
    var CROSS_CLEAR = ROAD_HALF + 3.2;
    function clearOfCrossings(along) {
      for (var c = 0; c < R.length; c++) if (Math.abs(along - R[c]) < CROSS_CLEAR) return false;
      return true;
    }
    for (var i = 0; i < R.length; i++) {
      for (var d = -430; d < 440; d += U.randRange(rng, 45, 90)) {
        if (rng() < 0.55 && clearOfCrossings(d)) {
          city.parkedSpots.push({ x: R[i] + (rng() < 0.5 ? 5.3 : -5.3), z: d, heading: 0 });
        }
        var hx = d + U.randRange(rng, 0, 30);
        if (hx < 340 && rng() < 0.45 && clearOfCrossings(hx)) {
          city.parkedSpots.push({ x: hx, z: R[i] + (rng() < 0.5 ? 5.3 : -5.3), heading: Math.PI / 2 });
        }
      }
    }
    // pickups at seeded sidewalk corners
    var types = ['health', 'health', 'health', 'armor', 'armor', 'pistol', 'pistol', 'pistol', 'smg', 'smg', 'smg', 'shotgun', 'shotgun', 'health', 'armor', 'smg'];
    var ti = 0;
    for (var pi = 0; pi < R.length - 1 && ti < types.length; pi += 1) {
      for (var pj = (pi % 2); pj < R.length - 1 && ti < types.length; pj += 2) {
        if (rng() < 0.55) continue;
        city.pickupSpots.push({ x: R[pi] + 8.4, z: R[pj] - 8.4, type: types[ti++] });
      }
    }
    // guarantee some key ones
    // parked police cruisers outside the station (stealable)
    city.parkedSpots.push({ x: -108, z: -95, heading: 0, police: true });
    city.parkedSpots.push({ x: -108, z: -70, heading: 0, police: true });
    // an ambulance idling at each hospital (for paramedic jobs)
    city.pois.hospitals.forEach(function (H) {
      city.parkedSpots.push({ x: H.x + 22, z: H.spawn.z, heading: Math.PI / 2, vtype: 'ambulance' });
    });
    // airplane on the runway apron, lined up to taxi east
    city.parkedSpots.push({ x: city.airport.apron.x, z: city.airport.apron.z, heading: Math.PI / 2, vtype: 'airplane' });
    // motorcycles: a couple along the boardwalk and by the strip
    city.parkedSpots.push({ x: 360, z: 20, heading: 0, vtype: 'motorcycle' });
    city.parkedSpots.push({ x: 360, z: -40, heading: 0, vtype: 'motorcycle' });
    city.parkedSpots.push({ x: 342, z: 200, heading: 0, vtype: 'motorcycle' });
    city.parkedSpots.push({ x: -152, z: 150, heading: 0, vtype: 'motorcycle' });

    // starter pickups within sight of the spawn point (356, 40)
    city.pickupSpots.push({ x: 358, z: 34, type: 'pistol' });
    city.pickupSpots.push({ x: 358, z: 48, type: 'health' });
    city.pickupSpots.push({ x: 358, z: 60, type: 'smg' });
    city.pickupSpots.push({ x: 358, z: -260, type: 'shotgun' });
    city.pickupSpots.push({ x: 8.4, z: 158.4, type: 'health' });
    city.pickupSpots.push({ x: -141.6, z: -158.4, type: 'armor' });
    city.pickupSpots.push({ x: 365, z: 250, type: 'pistol' });
  }

  city.update = function (dt, t) {
    if (city.oceanGeo) {
      var pos = city.oceanGeo.attributes.position;
      var arr = pos.array, base = city.oceanBase, mask = city.oceanMask;
      for (var i = 0, mi = 0; i < arr.length; i += 3, mi++) {
        if (mask && !mask[mi]) continue; // inland vertex: stays sunk under the streets
        var x = base[i], z = base[i + 2];
        arr[i + 1] = base[i + 1] + Math.sin(x * 0.045 + t * 1.1) * 0.28 + Math.sin(z * 0.06 + t * 0.7) * 0.22;
      }
      pos.needsUpdate = true;
    }
    if (city.wheelSpin) {
      city.wheelSpin.rotation.z += dt * 0.15; // spin about the hub axis
      if (!city.cabsSet) {
        var dummy = new THREE.Object3D();
        for (var c = 0; c < 8; c++) {
          var a = c / 8 * Math.PI * 2;
          dummy.position.set(Math.cos(a) * 15, Math.sin(a) * 15, 0);
          dummy.updateMatrix();
          city.wheelCabs.setMatrixAt(c, dummy.matrix);
        }
        city.wheelCabs.instanceMatrix.needsUpdate = true;
        city.cabsSet = true;
      }
    }
    if (city.streak) city.streak.material.opacity = 0.3 + 0.08 * Math.sin(t * 0.7);
    if (city.signMesh) {
      var pulse = 0.9 + 0.1 * Math.sin(t * 2.3);
      city.signMesh.material.color.setScalar(pulse);
    }
    // the kinetic props: everything on the skyline that turns, blinks or
    // breathes. Landmarks move and filler stands still — that one rule is
    // most of what makes a landmark read as alive.
    for (var ki = 0; ki < city.kinetics.length; ki++) {
      var K = city.kinetics[ki];
      if (K.spin) K.m.rotation.y += dt * K.spin;
      if (K.spinZ) K.m.rotation.z += dt * K.spinZ;
      if (K.blink) K.m.visible = ((t + (K.phase || 0)) % K.blink) < K.blink * (K.duty || 0.5);
      if (K.pulse) K.m.material.opacity = K.lo + (K.hi - K.lo) * (0.5 + 0.5 * Math.sin(t * K.pulse + (K.phase || 0)));
    }
  };

  return city;
})();
