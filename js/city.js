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
  city.bridgePiers = [];   // where the bridges stand in the water (isla.js), for whoever needs them
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
  //
  // A deck marked `floor` is one storey of a building with more than one (an
  // upstairs, and the stairs up to it): it is underfoot only for somebody up
  // at its level, so the ground floor under it stays the ground floor. Asked
  // with no height, only the part of it at street level counts.
  city.decks = [];
  var FLOOR_STEP = 0.6;
  city.addDeck = function (d) {
    d.cos = Math.cos(d.rot || 0); d.sin = Math.sin(d.rot || 0);
    var r = Math.max(d.w, d.len) / 2 + 1;
    d.minX = d.x - r; d.maxX = d.x + r; d.minZ = d.z - r; d.maxZ = d.z + r;
    city.decks.push(d);
    return d;
  };
  city.deckAt = function (x, z, atY) {
    var best = null;
    for (var i = 0; i < city.decks.length; i++) {
      var d = city.decks[i];
      if (x < d.minX || x > d.maxX || z < d.minZ || z > d.maxZ) continue;
      var dx = x - d.x, dz = z - d.z;
      var lx = dx * d.cos - dz * d.sin, lz = dx * d.sin + dz * d.cos;
      if (Math.abs(lx) > d.w / 2 || Math.abs(lz) > d.len / 2) continue;
      var t = (lz + d.len / 2) / d.len;
      var y = d.y0 + (d.y1 - d.y0) * t;
      if (d.floor && (atY === undefined ? y > 0.5 : atY < y - FLOOR_STEP)) continue;
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
  // The height of the sea's surface at a point, swell and all — what a swimmer
  // keeps their head above and a hull rides on. The swell is worked out on the
  // GPU (see the ocean below), one vertex every 50 m; between vertices the
  // surface is a flat facet, and because the swell is a sum of one wave along
  // x and one along z, the facet is exactly the two waves each interpolated
  // along their own axis. So this is the drawn surface, not an approximation
  // of it that a hull would hover over or sink into.
  //
  // It is worked out the way the mesh is drawn: each vertex's own height
  // (open sea, or a land vertex held just under the coast — see the ocean),
  // the swell on the sea ones only, and the cell's two triangles, which
  // PlaneGeometry splits along the diagonal from (x0, z1) to (x1, z0).
  var SEA_LEVEL = -0.35, OCEAN_SHORE = -1.05, OCEAN_X0 = -1350, OCEAN_Z0 = -1500, OCEAN_CELL = 50;
  var OCEAN_NX = 73, OCEAN_NZ = 61;
  city.seaLevel = SEA_LEVEL;
  function oceanVertY(i, j, w) {
    i = U.clamp(i, 0, OCEAN_NX - 1); j = U.clamp(j, 0, OCEAN_NZ - 1);
    var b = city.oceanBase ? city.oceanBase[j * OCEAN_NX + i] : SEA_LEVEL;
    if (b <= -0.5 || !w) return b;
    return b + Math.sin((OCEAN_X0 + i * OCEAN_CELL) * 0.045 + w.x) * 0.28 + Math.sin((OCEAN_Z0 + j * OCEAN_CELL) * 0.06 + w.y) * 0.22;
  }
  city.seaY = function (x, z) {
    var w = city.oceanWave;
    var gx = (x - OCEAN_X0) / OCEAN_CELL, gz = (z - OCEAN_Z0) / OCEAN_CELL;
    var i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j;
    if (u + v <= 1) {
      var ha = oceanVertY(i, j, w);
      return ha + (oceanVertY(i + 1, j, w) - ha) * u + (oceanVertY(i, j + 1, w) - ha) * v;
    }
    var hc = oceanVertY(i + 1, j + 1, w);
    return hc + (oceanVertY(i, j + 1, w) - hc) * (1 - u) + (oceanVertY(i + 1, j, w) - hc) * (1 - v);
  };
  // Water a hull can be on: open sea, not under a pier or a jetty's planks
  // (a bridge overhead is fine — boats go under the bridges)
  city.isBoatWater = function (x, z) {
    if (!city.isOpenWater(x, z)) return false;
    return !city.decks.length || city.deckAt(x, z) === null;
  };
  city.moorings = [];   // where the boats are kept (for the map)
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
      // (an island ramp may sit on a gentle grade: its foot at `base`, the
      // ground under its lip at `base1`, and the deck rising on top of that)
      var b0 = r.base || 0, b1 = r.base1 !== undefined ? r.base1 : b0;
      return { idx: r.idx, y: b0 + (b1 - b0 + r.h) * t, t: t, slope: (r.h + b1 - b0) / r.len, rot: r.rot, boost: r.boost, cap: r.cap, capUp: r.capUp };
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
    // Nobody but you goes into the sea. A stroller, a fleeing driver or an
    // officer after you stops at the water's edge — they used to walk on in
    // and vanish, which is also how a cop "followed" a swimmer. (Land first:
    // it is the cheap test, and almost every step is on it.)
    if (!city.islandAt(toX, toZ) && city.isInWater(toX, toZ) && !city.isInWater(fromX, fromZ)) return false;
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
      var dy = city.deckAt(x, z, atY);
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
  // (both keep a list of boxes and refill it — three height asks a tick for
  // every car used to build three fresh lists; see SpatialHash.queryInto)
  var driveBoxes = [], surfBoxes = [];
  city.driveSurfaceY = function (x, z, y) {
    var best = city.groundY(x, z, y);
    var boxes = city.hash.queryInto(x, z, 1, driveBoxes);
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
  //
  // With `atY` — the height of whoever is asking — a roof more than a step
  // above it is not underfoot: somebody standing in the street who has been
  // shoved inside a building's footprint is in the street, not on the roof.
  // Without that, any way of getting your feet inside a wall (a car pinning
  // you against it, getting out beside one) stood you on top of the building.
  // Asked with no height (the aircraft do), it is the tallest roof as before.
  var SURFACE_STEP = 0.6;
  city.surfaceY = function (x, z, atY) {
    var y = city.groundY(x, z, atY);
    var boxes = city.hash.queryInto(x, z, 1, surfBoxes);
    for (var i = 0; i < boxes.length; i++) {
      var b = boxes[i];
      if (b.tag !== 'building') continue; // land on buildings, not props/fences
      if (atY !== undefined && b.h > atY + SURFACE_STEP) continue;
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
    // Three plots in the strip's western row once held the hardware store,
    // the tailor and the barber, and with the bank and the condo that was
    // five storefronts down one block of beach. They have moved out into
    // the city (below). The plots stay reserved, with ordinary strip
    // buildings put up in them on a stream of their own (stripInfill): let
    // go, the blocks around them would be drawn from a different point in
    // the city's one random stream, and every building after them — signs,
    // palms, all the way down the map — would land somewhere else.
    { minX: 318, maxX: 346, minZ: -78, maxZ: -50, infill: true },
    { minX: 318, maxX: 346, minZ: 78, maxZ: 106, infill: true },
    { minX: 318, maxX: 346, minZ: -134, maxZ: -106, infill: true },
    { minX: 318, maxX: 346, minZ: 194, maxZ: 222 },    // strip condo
    // ...and where they went, one to a district (shops.js). Each is a lot the
    // blocks had left empty, so reserving it moves nothing else.
    { minX: -285, maxX: -255, minZ: 204, maxZ: 236 },  // ROSA HARDWARE, Puerto Viejo's harbour road
    { minX: -96, maxX: -64, minZ: 15, maxZ: 45 },      // THREADS, Centro Alto
    { minX: 64, maxX: 96, minZ: 155, maxZ: 185 },      // CORTES CUTS, Las Colinas
    { minX: 316, maxX: 346, minZ: -16, maxZ: 24 },     // the Savings & Loan (shops.js)
    { minX: -146, maxX: -124, minZ: 194, maxZ: 218 },  // Lola's lock-up by the harbour (heist.js)
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
    // `knock` is set on the few props a car can flatten (knockProp)
    var box = { minX: cx - sx / 2, maxX: cx + sx / 2, minZ: cz - sz / 2, maxZ: cz + sz / 2, h: h, tag: tag || 'building', noLOS: !!noLOS, knock: null };
    if (minY !== undefined) box.minY = minY;
    city.hash.insert(box);
    return box;
  }

  city.addSolid = function (cx, cz, sx, sz, h, tag, noLOS, minY) { return addSolid(cx, cz, sx, sz, h, tag, noLOS, minY); };
  city.addSign = function (batch, slotIdx, x, y, z, rotY, w, h, tint) { addSign(batch, slotIdx, x, y, z, rotY, w, h, tint); };

  // ---------- canvas textures ----------
  function repeatTex(cv) {
    var t = new THREE.CanvasTexture(cv);
    t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
    return t;
  }
  // Once a canvas texture is on the GPU, the canvas behind it is a second copy
  // that nothing reads again: none of these is ever redrawn. So the copy is
  // shrunk to nothing right after the first upload, about 10 MB of 2D canvas
  // across the city's textures. The cost is the one the static geometry
  // already pays: a lost WebGL context would come back with these blank, and
  // the game does not restore contexts. Only for textures drawn by the main
  // renderer — the shop preview's own context never samples any of them.
  function releaseAfterUpload(tex) {
    tex.onUpdate = function () {
      tex.onUpdate = null;
      var im = tex.image;
      // what went up, for anyone counting texture memory after the fact
      // (an r128 texture has no userData of its own)
      if (im) { tex.userData = tex.userData || {}; tex.userData.w = im.width; tex.userData.h = im.height; }
      if (im && im.getContext) im.width = im.height = 1;
    };
    return tex;
  }

  // Two images, not one, and the reason is the whole business of a building
  // having a colour at all.
  //
  // A facade's colour arrives as the VERTEX TINT and multiplies whatever the
  // map holds, so a map that bakes a near-black wall crushes every palette
  // into the same block: the generic wall was 0x181420, a ninth of full
  // brightness, and a tan and a sage multiplied through it land a few units
  // apart — indistinguishable at any distance, in any light. Five careful
  // shades per district, and not one of them could be seen. The wall is kept
  // pale here so the tint is what you actually look at.
  //
  // But the same texture was ALSO the emissive map, and a pale wall there
  // lights the whole block up like a paper lantern — tried it, the street
  // turned into a row of glowing white slabs. So a pale wall's glow gets an
  // image of its own: black everywhere except the windows that are lit.
  //
  // A DARK wall is still its own glow, as it always was. Its wall, its bands
  // and its unlit glass give off a faint light all day and all night, and
  // that is part of how the hospitals, the stations, the shops and the tower
  // were lit. A black glow behind them took a third off a hospital at night
  // and a sixth at noon, measured against the build before any of this, and
  // spent five more textures doing it.
  // `rnd` defaults to the city's own stream. The pale twins below pass a
  // PRIVATE one, and they have to: this generator burns a roll per window,
  // and the stream is shared with everything generated after the textures —
  // the props, the landmarks, the airport, the stunt ramps, the parking. Four
  // more textures drawing from it would have shifted every one of them, and
  // silently: same city, every ramp somewhere else.
  // `opts` is for the pale-walled twins only: { rnd, dim, glowAll }.
  function windowTexture(wall, litColors, cols, rows, litProb, bandColor, opts) {
    opts = opts || {};
    var rnd = opts.rnd || rng;
    // What an UNLIT window is painted with. Near-opaque by default, which is
    // right over a dark wall and quite wrong over a pale one: it turns half
    // the facade into black holes that look the same on a charcoal tower and
    // a limestone one, so the building's colour ends up expressed by a thin
    // grid between them. The pale-walled twins pass something thinner, and
    // the glass then carries the tint like the rest of the wall does.
    var dim = opts.dim || 'rgba(30,34,58,0.9)';
    var cv = document.createElement('canvas');
    cv.width = 512; cv.height = 384;
    var g = cv.getContext('2d');
    g.fillStyle = wall; g.fillRect(0, 0, 512, 384);
    // only the pale twins have a glow apart from their map (see above)
    var gv = null, e = null;
    if (opts.glowAll) {
      // Half the resolution of the wall, drawn in the wall's own coordinates.
      // The glow only says which windows are lit and how brightly, and at a
      // street's distance or further the two sizes cannot be told apart; up
      // against a facade a lit window's edge is a little softer. It saves
      // three quarters of each one's GPU memory, about 0.8 MB a texture, four
      // of them. (Compared side by side at street level and across the
      // skyline before it was chosen.)
      gv = document.createElement('canvas');
      gv.width = 256; gv.height = 192;
      e = gv.getContext('2d');
      e.scale(0.5, 0.5);
      e.fillStyle = '#000'; e.fillRect(0, 0, 512, 384);
    }
    var cw = 512 / cols, ch = 384 / rows;
    for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) {
      var lit = rnd() < litProb;
      var pad = cw * 0.22;
      // the rng draw order is untouched: one roll for lit, one more only when
      // it is — the same city comes out of the same seed either way
      var col = lit ? litColors[Math.floor(rnd() * litColors.length)] : dim;
      var wx = i * cw + pad, wy = j * ch + ch * 0.2, ww = cw - pad * 2, wh = ch * 0.55;
      g.fillStyle = col; g.fillRect(wx, wy, ww, wh);
      // Every window has a light of its own in the glow, for the night to
      // switch on building by building (see lamBlock). An unlit one takes its
      // colour from where it sits, not from the stream, so the daylight
      // pattern above comes out of exactly the rolls it always did.
      if (e) {
        e.fillStyle = lit ? col : litColors[(i * 7 + j * 3) % litColors.length];
        e.fillRect(wx, wy, ww, wh);
      }
    }
    if (bandColor) {
      g.fillStyle = bandColor;
      for (var b = 0; b < rows; b++) g.fillRect(0, b * ch - 2, 512, 5);
    }
    // keep the left column plain so roof uvs sample the wall — and black in
    // a separate glow, or every pale roof in the city would be lit from inside
    g.fillStyle = wall; g.fillRect(0, 0, Math.floor(cw * 0.2), 384);
    if (e) { e.fillStyle = '#000'; e.fillRect(0, 0, Math.floor(cw * 0.2), 384); }
    // the wall's brightest channel, 0-1: where a lit window stops and wall begins
    var wv = parseInt(wall.slice(1), 16);
    var wallMax = Math.max((wv >> 16) & 255, (wv >> 8) & 255, wv & 255) / 255;
    // the wall as painted, read back off the canvas while it still has one
    // (x=2 is inside the plain left column), for testFacadeContrast
    var px = g.getImageData(2, 2, 1, 1).data;
    var wallLum = (px[0] * 0.299 + px[1] * 0.587 + px[2] * 0.114) / 255;
    var map = releaseAfterUpload(repeatTex(cv));
    return { map: map, glow: gv ? releaseAfterUpload(repeatTex(gv)) : map, cells: [cols, rows], wallMax: wallMax, wallLum: wallLum };
  }

  // ---------- window light ----------
  // After dark every ordinary block used to light the same share of its
  // windows, in the same colours, at the same strength, so the skyline was
  // one lit building repeated — and from any distance the night city looked
  // just as it did before a single wall was painted. Each building now has a
  // share of its own (some nearly dark, like offices after hours; some
  // blazing), a warmth of its own (tubes in an office, lamps at home), and
  // its own choice of WHICH windows.
  //
  // All of it is decided in the block material's shader from one small
  // per-vertex attribute (GeoBatch.addBox writes it): no extra draw calls, no
  // extra textures, no extra texture reads — a hash, a step and a few mixes a
  // pixel, on building pixels only, and by day not even that. Measured on a
  // CPU renderer, which is where shader arithmetic costs most, frame times
  // stayed inside the spread between two runs of the same build.
  //
  // By day a window glows exactly when it did, which the shader reads off the
  // map it has already sampled: a lit window is painted at full strength
  // there, and the wall and the glass are not. Frozen noon frames against the
  // last build differ in a tenth of a percent of their pixels, the outermost
  // fringe of the lit windows. Night takes over on the street lamps' own
  // curve, and one shared value drives every block material on both islands.
  var windowNight = { value: 1 };
  city.windowNight = windowNight;
  var WINDOW_VERT_HEAD = 'attribute vec3 winLight;\nvarying vec3 vWinLight;';
  var WINDOW_FRAG_HEAD = [
    'uniform float uNight;',
    'uniform float uWall;',
    'uniform vec2 uCells;',
    'varying vec3 vWinLight;',
    // hash without sine: stable on the mediump-leaning GPUs phones carry
    'float winHash( vec2 p ) {',
    '  vec3 p3 = fract( vec3( p.xyx ) * 0.1031 );',
    '  p3 += dot( p3, p3.yzx + 33.33 );',
    '  return fract( ( p3.x + p3.y ) * p3.z );',
    '}'].join('\n');
  var WINDOW_FRAG_BODY = [
    '{',
    // a plinth or a deco cap (negative share) keeps the windows it always had
    '  float nightMix = uNight * step( 0.0, vWinLight.x );',
    // Lit by day: painted at full strength on the map. Every lit colour has a
    // channel at 255 and the glass sits well below the wall, so filtering
    // pulls a lit window's edge ABOVE its wall and a dark one's BELOW it —
    // which makes this district's own wall the line between them. A fixed
    // line above every wall trimmed the blended edge of each lit window a
    // second time; measured on screen, lit windows a fraction smaller by day.
    '  float dayLit = smoothstep( uWall + 0.008, uWall + 0.03, max( texelColor.r, max( texelColor.g, texelColor.b ) ) );',
    '  vec3 glowMask = vec3( dayLit );',
    // Everything after dark sits behind the clock. uNight is one value for
    // the whole draw, so every pixel takes the same side of this and the GPU
    // skips it outright by day: half the cycle, the cost is the four lines
    // above.
    '  if ( uNight > 0.0 ) {',
    // lit at night: this building's own share, decided window by window
    '    float nightLit = step( winHash( floor( vUv * uCells ) + floor( vWinLight.z + 0.5 ) * vec2( 7.0, 3.0 ) ), vWinLight.x );',
    '    vec3 warmth = mix( vec3( 0.82, 0.92, 1.14 ), vec3( 1.16, 0.93, 0.68 ), vWinLight.y );',
    '    glowMask = mix( glowMask, nightLit * warmth, nightMix );',
    // A window lit in the DAY pattern but dark tonight is still painted bright
    // on the map, and read as a faint pastel square after dark rather than as
    // glass; take it down to the glass it is while the night holds.
    '    diffuseColor.rgb *= 1.0 - 0.6 * dayLit * ( 1.0 - nightLit ) * nightMix;',
    '  }',
    '  totalEmissiveRadiance *= glowMask;',
    '}'].join('\n');
  function lamBlock(t) {
    var cells = new THREE.Vector2(t.cells[0], t.cells[1]);
    var m = new THREE.MeshLambertMaterial({ map: t.map, emissive: 0xbbbbcc, emissiveMap: t.glow, vertexColors: true });
    // The source text is the same for every block material, so three.js
    // compiles this program once and shares it; the uniforms stay per material.
    m.onBeforeCompile = function (sh) {
      sh.uniforms.uNight = windowNight;
      sh.uniforms.uCells = { value: cells };
      sh.uniforms.uWall = { value: t.wallMax };
      var hook = '#include <emissivemap_fragment>';
      // a three.js that renamed its chunks would otherwise drop this silently
      if (sh.fragmentShader.indexOf(hook) < 0 || sh.vertexShader.indexOf('#include <begin_vertex>') < 0) {
        console.error('window light: the shader chunks it hooks are missing');
      }
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\n' + WINDOW_VERT_HEAD)
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWinLight = winLight;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\n' + WINDOW_FRAG_HEAD)
        .replace(hook, hook + '\n' + WINDOW_FRAG_BODY);
    };
    return m;
  }
  city.lamBlock = lamBlock;

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
    'EMERGENCY', 'DEPARTURES',
    // the bank on the strip (45: shops.js SIGN_SLOT)
    'SAVINGS & LOAN',
    // the cab firm on Isla Verde (46)
    'VERDE CABS'];
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
    return { tex: releaseAfterUpload(new THREE.CanvasTexture(cv)), slots: slots };
  }
  // One canvas per colour: the city, the island and the shops each ask for the
  // same soft pool, and each ask used to draw and upload a copy of its own.
  // Callers share what they are handed, so none may change it.
  var glowTexCache = {};
  function radialGlowTexture(color) {
    if (glowTexCache[color]) return glowTexCache[color];
    var cv = document.createElement('canvas');
    cv.width = 128; cv.height = 128;
    var g = cv.getContext('2d');
    var gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    gr.addColorStop(0, color); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    return (glowTexCache[color] = releaseAfterUpload(new THREE.CanvasTexture(cv)));
  }
  city.glowTexture = radialGlowTexture;

  // ---------- kinetic props ----------
  // Single live meshes for the handful of things that turn, blink or breathe.
  // Everything else stays in the static batches; these are the exceptions
  // that make a landmark read as switched on.
  city.kinetics = [];
  function kmesh(w, h, d, color, x, y, z, k, matOpts) {
    // A blinker or a spinner changes `visible` or its rotation, never its
    // material, so it wears the shared box and colour. Anything that pulses
    // writes its material's opacity every frame, and options make it more
    // than a colour — those two still get a private material.
    var mat;
    if (matOpts || (k && k.pulse)) {
      var mo = { color: color };
      if (matOpts) for (var mk in matOpts) mo[mk] = matOpts[mk];
      mat = new THREE.MeshBasicMaterial(mo);
    } else mat = sharedBasic(color);
    var m = new THREE.Mesh(sharedBoxGeo(w, h, d), mat);
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
      generic: new GeoBatch(),
      // The ordinary blocks draw from their own batches so they can have a
      // material of their own. Everything already designed — the hospitals,
      // the stations, the shops, the tower, the island — shares the batches
      // above and keeps the dark-walled texture its colours were chosen
      // against; only the anonymous stock gets a wall pale enough to take a
      // colour. Same geometry, same builders, different mesh.
      blkDowntown: new GeoBatch(),
      blkStrip: new GeoBatch(),
      blkGeneric: new GeoBatch(),
      blkHarbor: new GeoBatch(),
      wood: new GeoBatch(),
      signs: new GeoBatch()
    };
    // How much of an ordinary block is lit after dark on average, and how
    // warm the light. `lit` is the district's own window share — the figure
    // its texture is drawn with below — so the night keeps roughly the
    // brightness it had and mostly spreads it unevenly; `warm` leans offices
    // toward tube-white and homes toward lamplight. Read by GeoBatch.addBox.
    city.blockLight = {
      downtown: { lit: 0.34, warm: 0.3 }, strip: { lit: 0.4, warm: 0.6 },
      generic: { lit: 0.3, warm: 0.8 }, harbor: { lit: 0.15, warm: 0.5 }
    };
    batches.blkDowntown.light = city.blockLight.downtown;
    batches.blkStrip.light = city.blockLight.strip;
    batches.blkGeneric.light = city.blockLight.generic;
    batches.blkHarbor.light = city.blockLight.harbor;
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
      // Dashed centre lines — stopping short of every crossing, the way the
      // paint does. They used to run on straight through each junction, and
      // the two roads' lines crossed in a plus in the middle of every box.
      for (var d = -470; d < 470; d += 12) {
        if (d + 5 < zEnd && !atCrossing(d + 1, d + 5)) { batches.marks.addGroundQuad(R[i], 0.06, d + 3, 0.25, 4, 0, 0xd8c46a); markStats.dashes.push([R[i], d + 1, R[i], d + 5]); }
        if (d > -500 && d < 350 && !atCrossing(d + 1, d + 5)) { batches.marks.addGroundQuad(d + 3, 0.06, R[i], 4, 0.25, 0, 0xd8c46a); markStats.dashes.push([d + 1, R[i], d + 5, R[i]]); }
      }
    }
    // and at every crossing, what the lines stop for
    for (var ji = 0; ji < R.length; ji++) {
      var jEnd = R[ji] + ROAD_HALF > AP.fx0 && R[ji] - ROAD_HALF < AP.fx1 ? AP.fz0 - 1 : 480;
      for (var jj = 0; jj < R.length; jj++) junctionMarks(batches.marks, R[ji], R[jj], jEnd);
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

    // the boardwalk's railing posts and the airport's fence posts: several
    // hundred identical boxes, drawn as copies of one (see BoxSet)
    postSet = new BoxSet();
    buildBlocks(batches, atlas);
    stripInfill(batches);
    buildPOIs(batches, atlas);
    buildBeach(scene, batches);
    buildSky(scene);

    // no boundary walls: the surrounding sea is the soft boundary

    // materials + meshes
    var texDowntown = windowTexture('#101322', ['#ffe9a8', '#a8e8ff', '#ffd0e8', '#c8ffe0'], 10, 8, 0.5);
    var texStrip = windowTexture('#241a2e', ['#ffe9a8', '#ffd0e8'], 8, 5, 0.4, 'rgba(90,60,90,0.8)');
    var texGeneric = windowTexture('#181420', ['#ffe0a0', '#d8c8ff'], 9, 7, 0.3);
    // The harbour's dark-walled texture has nothing left to wear it — every
    // harbour block paints from the pale set below — but it is still drawn and
    // thrown away: it takes its rolls from the shared stream, and skipping them
    // would move every ramp, prop and parking spot generated after it. Unworn,
    // it never reaches the GPU.
    windowTexture('#1a1a20', ['#ffd890'], 6, 3, 0.15, 'rgba(60,62,70,0.9)');

    // The same windows over a wall pale enough that the building's own colour
    // is what you see. Only the block batches use these.
    var wrng = mulberry32(90210);          // private: see windowTexture
    // Downtown lights fewer of them than it did. At half lit, over a wall now
    // pale enough to have a colour, the towers read as a glowing grid with a
    // building somewhere behind it — measured on screen, a charcoal tower and
    // a limestone one three doors apart and no telling them apart.
    var DIM = 'rgba(26,30,48,0.42)';
    var BL = city.blockLight, PALE = { rnd: wrng, dim: DIM, glowAll: true };
    var blkDowntown = windowTexture('#848994', ['#ffe9a8', '#a8e8ff', '#ffd0e8', '#c8ffe0'], 10, 8, BL.downtown.lit, null, PALE);
    var blkStrip = windowTexture('#a79fa6', ['#ffe9a8', '#ffd0e8'], 8, 5, BL.strip.lit, 'rgba(120,92,116,0.45)', PALE);
    var blkGeneric = windowTexture('#8d887e', ['#ffe0a0', '#d8c8ff'], 9, 7, BL.generic.lit, null, PALE);
    var blkHarbor = windowTexture('#828079', ['#ffd890'], 6, 3, BL.harbor.lit, 'rgba(78,80,88,0.5)', PALE);

    function lam(t) {
      return new THREE.MeshLambertMaterial({ map: t.map, emissive: 0xbbbbcc, emissiveMap: t.glow, vertexColors: true });
    }
    // the second landmass draws its own meshes but shares the city's window
    // textures and sign atlas, so the two read as one world
    city.tex = { downtown: texDowntown, strip: texStrip, generic: texGeneric };
    city.signTex = atlas.tex;
    city.lam = lam;
    function addMesh(batch, mat) {
      var m = new THREE.Mesh(batch.build(), mat);
      m.matrixAutoUpdate = false;
      scene.add(m);
      return m;
    }
    addMesh(batches.ground, sharedVertexLambert());
    addMesh(asphalt, new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 70, specular: 0x232e42 }));
    // road paint always wins its tie against the asphalt beneath it — a
    // depth-only nudge toward the camera, so no altitude can blur the two
    addMesh(batches.marks, new THREE.MeshBasicMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
    // (the Strip's dark-walled texture has no mesh here either: its blocks
    // paint from the pale set, and the only thing still wearing it is the
    // showroom in shops.js, which reaches it through city.tex)
    addMesh(batches.downtown, lam(texDowntown));
    addMesh(batches.generic, lam(texGeneric));
    var blockMeshes = [
      addMesh(batches.blkDowntown, lamBlock(blkDowntown)),
      addMesh(batches.blkStrip, lamBlock(blkStrip)),
      addMesh(batches.blkGeneric, lamBlock(blkGeneric)),
      addMesh(batches.blkHarbor, lamBlock(blkHarbor))
    ];
    // Shared with the island, which builds after this and paints its own
    // ordinary blocks over the same pale walls. It adds its meshes to the
    // list and its districts to the walls; null there means a block with no
    // window texture at all, whose colour is its colour.
    city.texBlk = { downtown: blkDowntown, strip: blkStrip, generic: blkGeneric, harbor: blkHarbor };
    city.blockMeshes = blockMeshes;
    city.facadeWalls = { downtown: blkDowntown, strip: blkStrip,
                         residential: blkGeneric, harbor: blkHarbor };
    // headless hook: can a building's colour be SEEN? Per district, the wall
    // its tint multiplies — sampled out of the map as it was painted (see
    // windowTexture: the canvas itself is gone once it is on the GPU) — times
    // the spread of the colours actually PICKED for that district's blocks.
    //
    // What this is: a floor against the bug it was written for, where a wall
    // at a ninth of full brightness crushed a whole palette into one block
    // and the separation between the palest building on a street and the
    // darkest came to two hundredths. What it is NOT: a judgement of whether
    // a street looks varied. Downtown cleared this comfortably while every
    // tower on it was the same grey — half its facade is lit window, and no
    // number here knows that. For that, look at the thing.
    city.testFacadeContrast = function () {
      var out = [];
      Object.keys(city.facadePicks).forEach(function (d) {
        var picks = city.facadePicks[d];
        if (!picks.length || !(d in city.facadeWalls)) return;
        var t = city.facadeWalls[d], wall = 1;
        if (t) {
          if (typeof t.wallLum !== 'number') return;
          wall = t.wallLum;
        }
        var lo = [255, 255, 255], hi = [0, 0, 0], spread = 0;
        for (var i = 0; i < picks.length; i++) {
          var ch = [(picks[i] >> 16) & 255, (picks[i] >> 8) & 255, picks[i] & 255];
          for (var c = 0; c < 3; c++) {
            if (ch[c] < lo[c]) lo[c] = ch[c];
            if (ch[c] > hi[c]) hi[c] = ch[c];
          }
        }
        for (var c2 = 0; c2 < 3; c2++) spread = Math.max(spread, (hi[c2] - lo[c2]) / 255);
        out.push({ district: d, buildings: picks.length, wall: +wall.toFixed(3),
          spread: +spread.toFixed(3), seen: +(spread * wall).toFixed(3) });
      });
      return out;
    };

    // headless hook: the neighbour rule, stated as a count. Every pair of
    // blocks standing within NEAR2 of each other, and how many of those pairs
    // are close enough in colour to read as the same building twice. This is
    // the thing a palette on its own does not give you.
    city.testFacadeNeighbours = function () {
      var out = [];
      Object.keys(facadeNear).forEach(function (d) {
        var a = facadeNear[d], pairs = 0, same = 0;
        for (var i = 0; i < a.length; i++) {
          for (var j = i + 1; j < a.length; j++) {
            var dx = a[i].x - a[j].x, dz = a[i].z - a[j].z;
            if (dx * dx + dz * dz > NEAR2) continue;
            pairs++;
            if (channelGap(a[i].c, a[j].c) < MIN_GAP) same++;
          }
        }
        out.push({ district: d, blocks: a.length, pairs: pairs, same: same });
      });
      return out;
    };

    // headless hook: every facade colour baked into the ordinary blocks, as
    // one number, plus how many distinct colours are actually in there.
    // Determinism is the point — the same seed has to paint the same building
    // the same colour on every load, or the city changes clothes behind your
    // back — and `distinct` is what keeps the check honest, because a hash
    // agreeing with itself proves nothing about a city painted all one shade.
    // The picks are folded in as well as the meshes: a villa has no window
    // texture and lives in the island's plain batch among the roads and the
    // trees, so the record of what it was dealt is the clean way to see it.
    city.testFacadeColors = function () {
      var seen = {}, n = 0, h = 2166136261;
      Object.keys(city.facadePicks).sort().forEach(function (d) {
        city.facadePicks[d].forEach(function (c) { h = Math.imul(h ^ c, 16777619) >>> 0; });
      });
      for (var i = 0; i < city.blockMeshes.length; i++) {
        var a = city.blockMeshes[i].geometry.attributes.color;
        if (!a) continue;
        for (var v = 0; v < a.count; v++) {
          var key = (Math.round(a.getX(v) * 255) << 16) |
                    (Math.round(a.getY(v) * 255) << 8) | Math.round(a.getZ(v) * 255);
          seen[key] = 1; n++;
          h = Math.imul(h ^ key, 16777619) >>> 0;
        }
      }
      return { verts: n, distinct: Object.keys(seen).length, hash: h };
    };
    addMesh(batches.wood, sharedVertexLambert());
    city.signMesh = addMesh(batches.signs, new THREE.MeshBasicMaterial({ map: atlas.tex, transparent: true, vertexColors: true, side: THREE.DoubleSide }));

    buildInstancedProps(scene);
    buildLandmarks(scene);
    buildAirport(scene);
    scene.add(postSet.build(sharedInstanceLambert()));
    postSet = null;
    // last, so its clearance tests can see every structure in the world — the
    // terminal, the hospitals, the station, the tower and the bridges all
    // register after the streets do, and a ramp placed before them can end up
    // inside one, or square across a bridge deck
    if (GAME.isla) GAME.isla.build(scene);
    buildRamps(scene);
    buildLaneGraph();
    buildSpots();
    // down to what each material reads, and gone from this side once it is
    // on the GPU (see packStatic, releaseStatic); the blocks stay as built,
    // since their colours, uvs and window light are read back
    var blocks = new Set(city.blockMeshes.map(function (m) { return m.geometry; }));
    packStatic(scene, blocks);
    releaseStatic(scene, blocks);
  };

  function addSign(batch, slotIdx, x, y, z, rotY, w, h, tint) {
    var s = city.signSlots[slotIdx];
    batch.addWallQuad(x, y, z, w, h, rotY, tint === undefined ? 0xffffff : tint, s.u0, s.v0, s.u1, s.v1);
  }

  // Crossings of the street grid. The centre dashes stop JUNCTION_CLEAR
  // short of the crossing road's centre; between there and the box, each arm
  // of the junction where the road really goes on (not onto the beach past
  // the boulevard, nor the airfield fence) gets a zebra crossing from kerb
  // to kerb, in line with the pavements, and a stop line across the lane
  // that comes in — the lane the traffic actually drives (vehicles.js
  // setLane: travelling along (mx, mz), it keeps to (mz, -mx) * 3.1).
  var JUNCTION_CLEAR = 12.5, ZEBRA_IN = 7, ZEBRA_OUT = 10, STOP_AT = 11;
  var PAINT = 0xbcbcb4;   // a weathered white: the marks draw unlit, and full white glared at night
  // what was painted, for a test to hold the grid to (each dash end to end,
  // and each stop line's centre)
  var markStats = city.roadMarks = { dashes: [], stops: [], zebraArms: 0 };
  function atCrossing(a, b) {
    for (var k = 0; k < R.length; k++) if (b > R[k] - JUNCTION_CLEAR && a < R[k] + JUNCTION_CLEAR) return true;
    return false;
  }
  function junctionMarks(b, x, z, zEnd) {
    var zl = (ZEBRA_IN + ZEBRA_OUT) / 2, zw = ZEBRA_OUT - ZEBRA_IN, k, sg;
    // the north-south road's two arms
    for (sg = -1; sg <= 1; sg += 2) {
      var zArm = z + sg * ZEBRA_OUT;
      if (zArm < -480 || zArm > zEnd) continue;
      for (k = -4; k <= 4; k++) b.addGroundQuad(x + k * 1.2, 0.06, z + sg * zl, 0.55, zw, 0, PAINT);
      // coming in from this side means travelling -sg along z: that lane is x - sg * 3.1
      b.addGroundQuad(x - sg * 3, 0.06, z + sg * STOP_AT, 5.6, 0.45, 0, PAINT);
      markStats.stops.push({ x: x - sg * 3, z: z + sg * STOP_AT, dir: [0, -sg] }); markStats.zebraArms++;
    }
    // and the east-west road's
    for (sg = -1; sg <= 1; sg += 2) {
      var xArm = x + sg * ZEBRA_OUT;
      if (xArm < -500 || xArm > 356) continue;
      for (k = -4; k <= 4; k++) b.addGroundQuad(x + sg * zl, 0.06, z + k * 1.2, zw, 0.55, 0, PAINT);
      // coming in from this side means travelling -sg along x: that lane is z + sg * 3.1
      b.addGroundQuad(x + sg * STOP_AT, 0.06, z + sg * 3, 0.45, 5.6, 0, PAINT);
      markStats.stops.push({ x: x + sg * STOP_AT, z: z + sg * 3, dir: [-sg, 0] }); markStats.zebraArms++;
    }
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
    batch.addBox(cx, h / 2, cz, sx, h, sz, 0, color, uvScale, true);
    addSolid(cx, cz, sx, sz, h);
    return true;
  }

  // ---------- facade paint ----------
  // Every ordinary block on both islands takes its colour through here: one
  // roll from the caller's seeded stream (exactly the one U.pick used to
  // spend, so the world that comes out of the seed is the same world), then a
  // deterministic step away from whatever its neighbours are already wearing.
  //
  // Every pick is recorded, per district, because the mesh cannot be asked
  // afterwards: a block's plinth and a deco cap live in the same geometry as
  // its walls, and reading colours back off it measured those too. That is
  // not a hypothetical — the downtown check sat at 0.44 and passing while
  // every tower on the street was the same grey, because half that mesh is
  // a dark base band.
  city.facadePicks = {};
  var facadeNear = {};
  // How far apart two buildings have to be before they may share a shade, and
  // how different "different" is (largest channel gap, 0-1).
  var NEAR2 = 70 * 70, MIN_GAP = 0.12;
  function channelGap(a, b) {
    return Math.max(Math.abs(((a >> 16) & 255) - ((b >> 16) & 255)),
                    Math.abs(((a >> 8) & 255) - ((b >> 8) & 255)),
                    Math.abs((a & 255) - (b & 255))) / 255;
  }
  // A palette is not the same thing as a varied street. Drawing independently
  // from one puts near-identical neighbours side by side often enough that a
  // block of six can come out looking like one building repeated — which is
  // what downtown did: every tower on the street within a few units of the
  // same pale grey, out of a list holding a charcoal and a limestone.
  //
  // So the draw is checked against what is ALREADY STANDING nearby, and steps
  // along the list until it finds a shade that is not its neighbour's. The
  // step is deterministic and costs no rng at all — the one roll below is the
  // caller's, and spending more of them would move everything generated
  // after it: every stunt ramp here, every palm and parked car over there.
  //
  // `rnd` is that caller's stream. The island draws from its own, and has
  // to: its blocks, its planting and its parking all come out of one seed.
  //
  // The scan covers every block already placed in the district, not a recent
  // window. It used to look back forty, which only works when blocks are
  // laid down street by street — the mainland's are, the island scatters
  // its own across the whole landmass, so its nearest neighbour can be the
  // third block placed rather than the last. At a few dozen per district the
  // full scan costs nothing, and it means the rule and the check that counts
  // its failures are finally looking at the same pairs.
  function facadeShade(district, list, x, z, rnd) {
    var i = Math.floor(Math.pow((rnd || rng)(), 1.15) * list.length);
    if (i >= list.length) i = list.length - 1;
    var near = facadeNear[district] = facadeNear[district] || [];
    // The first shade in step order that clears every neighbour wins. When
    // none does — four neighbours inside the radius can block a whole list
    // between them — the one LEAST like its neighbours wins instead. It used
    // to fall back to the original draw, which is the one shade already known
    // to clash. Nothing in the world as built reaches this branch: the dense
    // island shops that ran out were fixed by giving them more colours, and
    // with those, every block finds a clean shade. It is here for the street
    // somebody makes denser, or the list somebody makes shorter.
    var best = i, bestGap = -1;
    for (var t = 0; t < list.length; t++) {
      var j = (i + t) % list.length, worst = 1;
      for (var k = 0; k < near.length; k++) {
        var n = near[k];
        var dx = n.x - x, dz = n.z - z;
        if (dx * dx + dz * dz > NEAR2) continue;
        var g = channelGap(list[j], n.c);
        if (g < worst) worst = g;
      }
      if (worst >= MIN_GAP) { best = j; break; }
      if (worst > bestGap) { bestGap = worst; best = j; }
    }
    i = best;
    var c = list[i];
    near.push({ x: x, z: z, c: c });
    (city.facadePicks[district] = city.facadePicks[district] || []).push(c);
    return c;
  }
  city.facadeShade = facadeShade;

  function buildDowntownBlock(batches, cx, cz) {
    // Downtown gets its variety from VALUE, not hue. Nine shades of the same
    // pale blue-grey is what this was, and a street of it reads as one
    // building repeated however many shades the list technically holds — the
    // towers came back looking exactly as flat as the near-black ones they
    // replaced. What tells one tower from the next in a real downtown is a
    // dark glass slab standing against pale concrete, so the spread here runs
    // from near-black glass to limestone and stays desaturated the whole way.
    // The order matters: the draw is front-weighted, so the first few carry
    // the contrast rather than saving it for a tail nobody sees.
    var shades = [0xc6cad2, 0x8f96a3, 0xd2cec2, 0x6e7686, 0xb0b6c0,
                  0xbdb4a4, 0x545c6e, 0x7d8a92, 0x9a8f80, 0x3f4557];
    for (var lx = -1; lx <= 1; lx += 2) for (var lz = -1; lz <= 1; lz += 2) {
      if (rng() < 0.22) continue;
      var w = U.randRange(rng, 18, 30), dep = U.randRange(rng, 18, 30);
      var h = U.randRange(rng, 32, 88) * (1 - U.dist(cx, cz, -100, -100) / 900);
      var x = cx + lx * 19, z = cz + lz * 19;
      if (tryBuilding(batches.blkDowntown, x, z, w, dep, h, facadeShade('downtown', shades, x, z), 32)) {
        batches.blkDowntown.addBox(x, 1.5, z, w + 4, 3, dep + 4, 0, 0x3a3448, 0);
        if (rng() < 0.28) {
          var slot = U.randInt(rng, 0, 17);
          addSign(batches.signs, slot, x, h + 3, z, rng() * Math.PI * 2, 22, 5);
        }
      }
    }
  }

  function buildStripBlock(batches, cx, cz, frontRow) {
    // deco pastels, which is what the strip is for — but pastels, not poster
    // paint: they used to be picked at full saturation and then buried under
    // the dark wall, so nobody ever saw how loud they were
    var pastel = [0xe3cbbc, 0xe6d6b8, 0xd9d3c6, 0xe2c6cc,
                  0xc5d6cd, 0xe0b89c, 0xd6b4ca, 0xb4c8dc];
    var n = frontRow ? 2 : U.randInt(rng, 2, 3);
    for (var k = 0; k < n; k++) {
      var w = U.randRange(rng, 22, 34), dep = U.randRange(rng, 16, 24);
      var h = U.randRange(rng, 14, 30);
      var x = frontRow ? cx + 18 : cx + U.randRange(rng, -20, 20);
      var z = cz - 38 + dep / 2 + k * (76 / n) + U.randRange(rng, 0, 76 / n - dep - 2);
      z = U.clamp(z, cz - 38 + dep / 2, cz + 38 - dep / 2);
      var col = facadeShade('strip', pastel, x, z);
      if (tryBuilding(batches.blkStrip, x, z, w, dep, h, col, 24)) {
        // stepped art-deco top
        batches.blkStrip.addBox(x, h + 1.5, z, w * 0.6, 3, dep * 0.6, 0, col, 0);
        batches.blkStrip.addBox(x, h + 3.7, z, w * 0.3, 1.6, dep * 0.3, 0, 0xfff0f8, 0);
        var slot = U.randInt(rng, 0, 17);
        var face = frontRow ? Math.PI / 2 : (rng() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
        var sx = x + (face > 0 ? w / 2 + 0.3 : -w / 2 - 0.3);
        addSign(batches.signs, slot, sx, h * 0.75, z, face > 0 ? Math.PI / 2 : -Math.PI / 2, Math.min(20, dep * 0.9), 4.5);
        city.palmSpots.push({ x: x + U.randRange(rng, -w, w) * 0.7, z: z + dep / 2 + 3, s: U.randRange(rng, 0.8, 1.15) });
      }
    }
  }

  // The strip plots the shops left (see `reserved`): a strip building in
  // each, dressed as its neighbours are, from its own random stream so the
  // rest of the city is drawn exactly as it was.
  function stripInfill(batches) {
    var irng = mulberry32(47011);
    // (the strip's pastels and four more of the same family, each clear of
    // every one of the eight by the facade rule's margin: a plot in the
    // middle of the row has all eight within a street of it)
    var pastel = [0xe3cbbc, 0xe6d6b8, 0xd9d3c6, 0xe2c6cc, 0xc5d6cd, 0xe0b89c, 0xd6b4ca, 0xb4c8dc,
                  0xe8d8ec, 0xc4e8f0, 0xe4f8c4, 0xacc8ac];
    for (var i = 0; i < reserved.length; i++) {
      var r = reserved[i];
      if (!r.infill) continue;
      var w = U.randRange(irng, 20, 25), dep = U.randRange(irng, 20, 25), h = U.randRange(irng, 14, 28);
      var x = r.minX + 2 + w / 2, z = (r.minZ + r.maxZ) / 2;
      var col = facadeShade('strip', pastel, x, z, irng);
      batches.blkStrip.addBox(x, h / 2, z, w, h, dep, 0, col, 24, true);
      addSolid(x, z, w, dep, h);
      batches.blkStrip.addBox(x, h + 1.5, z, w * 0.6, 3, dep * 0.6, 0, col, 0);
      batches.blkStrip.addBox(x, h + 3.7, z, w * 0.3, 1.6, dep * 0.3, 0, 0xfff0f8, 0);
      addSign(batches.signs, U.randInt(irng, 0, 17), x + w / 2 + 0.3, h * 0.75, z, Math.PI / 2, Math.min(20, dep * 0.9), 4.5);
    }
  }

  function buildHarborBlock(batches, cx, cz) {
    var w = U.randRange(rng, 46, 62), dep = U.randRange(rng, 26, 34);
    var h = U.randRange(rng, 9, 13);
    // brick and warehouse: weathered red, grey-brown, an oxide and a steel
    tryBuilding(batches.blkHarbor, cx, cz - 16, w, dep, h,
      facadeShade('harbor', [0xa8a096, 0x8d8a80, 0x9a8b7c, 0x7a7268, 0x8e5f4c, 0x6f7c82], cx, cz - 16), 40);
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
    // stucco and painted concrete: bone, sand, cream, taupe — then a
    // terracotta, a sage and a dusty blue for the few that stand out
    var shades = [0xd9d0c0, 0xcabda8, 0xd5c8b4, 0xc2b8a8, 0xdad3c6,
                  0xc7b294, 0xb9ac9c, 0xcd9276, 0xa8b69e, 0x9fb2bd];
    var n = U.randInt(rng, 3, 5);
    for (var k = 0; k < n; k++) {
      var w = U.randRange(rng, 14, 26), dep = U.randRange(rng, 14, 26);
      var h = U.randRange(rng, 7, 18);
      var x = cx + U.randRange(rng, -24, 24), z = cz + U.randRange(rng, -24, 24);
      var ok = true;
      var q = city.hash.query(x, z, Math.max(w, dep) * 0.72);
      for (var qq = 0; qq < q.length; qq++) if (q[qq].tag === 'building') { ok = false; break; }
      if (ok) tryBuilding(batches.blkGeneric, x, z, w, dep, h, facadeShade('residential', shades, x, z), 28);
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
    // A helipad crowning a downtown tower, with a helicopter on it — the
    // mainland's only one. It used to sit on the hospital roof, but eighteen
    // metres was barely worth the trip; now it takes real flying, because the
    // way onto it is out of the sky, a parachute off the plane onto the roof,
    // and the reward for arriving is a way off again. It is on the map and
    // the radar like any other pad: knowing where it is was never the hard
    // part, and hiding it only made people wonder whether it existed.
    var HT = { x: 0, z: -200, h: 72 };
    batches.downtown.addBox(HT.x, HT.h / 2, HT.z, 30, HT.h, 30, 0, 0xb8c4e8, 28);
    addSolid(HT.x, HT.z, 30, 30, HT.h);
    var roofY = HT.h + 0.06, padX = HT.x, padZ = HT.z;
    // The glass lift runs up the outside of the north face, west of the
    // lobby doors (below), and the parapet stands open where it arrives.
    var SHX = HT.x - 8, LZ = HT.z + 15, SHZ = LZ + 1.7, SHW = 3.0;
    // Low parapet. Not a solid box — a wall solid up here would fight the
    // skids — but a rail that holds anybody walking (roofRails, player.js).
    // Inset from the tower edge (outer faces shared the wall planes) and
    // mitred at the corners (the bars used to overlap there, both faces
    // fighting for the same pixels on approach from the air)
    var gap0 = SHX - HT.x - 1.4, gap1 = SHX - HT.x + 1.4;
    [[-14.3, 0, 1.2, 29.8], [14.3, 0, 1.2, 29.8], [0, -14.3, 27.4, 1.2],
      [(-13.7 + gap0) / 2, 14.3, gap0 + 13.7, 1.2], [(gap1 + 13.7) / 2, 14.3, 13.7 - gap1, 1.2]].forEach(function (pp) {
      batches.generic.addBox(HT.x + pp[0], HT.h + 0.5, HT.z + pp[1], pp[2], 1.0, pp[3], 0, 0x8a94b8, 0);
    });
    city.roofRails = city.roofRails || [];
    city.roofRails.push({ minX: HT.x - 13.25, maxX: HT.x + 13.25, minZ: HT.z - 13.25, maxZ: HT.z + 13.25, y: HT.h + 0.06, h: 1.0 });
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
    // and a lift, for anybody who arrives on foot. The way up used to be out
    // of the sky and nothing else, and a helicopter sitting on a roof with no
    // door to it read as a find you were not allowed. A lit lobby on the north
    // face, and beside it a glass lift up the outside of the tower, with a
    // ring at its door in the street and another on the roof where it
    // arrives (interiors.js rides you up, looking out through the glass).
    // Plain-lit, not the window-textured batches.
    batches.marks.addBox(HT.x, 1.6, LZ + 0.06, 5.4, 3.2, 0.14, 0, 0xffe2a8, 0);        // the lit doors
    batches.wood.addBox(HT.x, 1.6, LZ + 0.1, 0.18, 3.2, 0.12, 0, 0x2a2e3a, 0);      // the split between them
    batches.wood.addBox(HT.x, 3.5, LZ + 1.6, 7.4, 0.3, 3.2, 0, 0x2a2e3a, 0);        // canopy
    batches.marks.addBox(HT.x, 3.32, LZ + 3.1, 7.2, 0.1, 0.12, 0, 0x8fb4ff, 0);        // its lit lip
    [[-3.5], [3.5]].forEach(function (cp) {
      batches.wood.addBox(HT.x + cp[0], 1.7, LZ + 3.0, 0.24, 3.4, 0.24, 0, 0x8a94b8, 0);
    });
    // ---- the glass lift: a steel frame up the face, glass between, a lit
    // head at the top, and a glass car that rides it
    var shTop = roofY + 4.2;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) {
      batches.wood.addBox(SHX + c[0] * SHW / 2, shTop / 2, SHZ + c[1] * SHW / 2, 0.2, shTop, 0.2, 0, 0x8a94b8, 0);
    });
    for (var fy = 6; fy < shTop; fy += 6) {
      batches.wood.addBox(SHX, fy, SHZ + SHW / 2, SHW, 0.12, 0.12, 0, 0x8a94b8, 0);
      batches.wood.addBox(SHX - SHW / 2, fy, SHZ, 0.12, 0.12, SHW, 0, 0x8a94b8, 0);
      batches.wood.addBox(SHX + SHW / 2, fy, SHZ, 0.12, 0.12, SHW, 0, 0x8a94b8, 0);
    }
    batches.wood.addBox(SHX, shTop + 0.3, SHZ - 0.4, SHW + 0.6, 0.6, SHW + 1.4, 0, 0x2a2e3a, 0);      // the head
    batches.marks.addBox(SHX, shTop - 0.02, SHZ, SHW, 0.06, SHW, 0, 0x8fb4ff, 0);                     // lit underneath
    batches.wood.addBox(SHX, roofY - 0.05, (LZ - 0.6 + SHZ - SHW / 2) / 2, SHW - 0.4, 0.12, SHZ - SHW / 2 - LZ + 0.6, 0, 0x5a6278, 0);  // the sill to the roof
    var glass = new THREE.Mesh(new THREE.BoxGeometry(SHW - 0.1, shTop, SHW - 0.1),
      new THREE.MeshBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.16, depthWrite: false }));
    glass.position.set(SHX, shTop / 2, SHZ);
    city.scene.add(glass);
    addSolid(SHX, SHZ, SHW, SHW, shTop);
    // the car itself: glass east and west, a floor, a lit roof, and a door
    // at each end — the street end opens at the lobby, the tower end at the
    // roof. Each is half fixed glass and half a framed leaf that slides
    // across behind it (interiors.js works them, with the landing doors in
    // the shaft below, as you come and go).
    var cab = new THREE.Group(), CW = SHW - 0.35;
    function cabPart(w, h, d, x, y, z, mat, into) { var m = new THREE.Mesh(sharedBoxGeo(w, h, d), mat); m.position.set(x, y, z); (into || cab).add(m); return m; }
    var steel = sharedBasic(0x9aa4c4);
    var pane = new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide });
    // a sliding leaf: glass in a steel frame, a kick plate, and a lit edge
    // where it meets the fixed half — glass alone would slide unseen
    function leaf(w, h) {
      var g = new THREE.Group();
      cabPart(w, h, 0.02, 0, 0, 0, pane, g);
      cabPart(0.07, h, 0.05, -w / 2, 0, 0, steel, g);
      cabPart(0.07, h, 0.05, w / 2, 0, 0, steel, g);
      cabPart(w, 0.07, 0.05, 0, h / 2, 0, steel, g);
      cabPart(w, 0.26, 0.04, 0, -h / 2 + 0.13, 0, steel, g);
      cabPart(0.03, h - 0.4, 0.06, -w / 2 + 0.06, 0, 0, sharedBasic(0x8fb4ff), g);
      return g;
    }
    cabPart(CW, 0.12, CW, 0, 0.06, 0, sharedBasic(0x6a7288));
    cabPart(CW, 0.1, CW, 0, 2.75, 0, steel);
    cabPart(CW - 0.6, 0.04, CW - 0.6, 0, 2.69, 0, sharedBasic(0xfff2dc));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) { cabPart(0.09, 2.7, 0.09, c[0] * CW / 2, 1.4, c[1] * CW / 2, steel); });
    cabPart(0.02, 2.6, CW, -CW / 2, 1.4, 0, pane);
    cabPart(0.02, 2.6, CW, CW / 2, 1.4, 0, pane);
    // the rails you hold on the way up, along the sides (across the door
    // they stood in the doorway)
    cabPart(0.06, 0.06, CW - 0.4, -CW / 2 + 0.12, 1.0, 0, steel);
    cabPart(0.06, 0.06, CW - 0.4, CW / 2 - 0.12, 1.0, 0, steel);
    var doors = {};
    [['street', 1], ['roof', -1]].forEach(function (f) {
      var zf = f[1] * CW / 2;
      cabPart(CW / 2, 2.6, 0.02, -CW / 4, 1.4, zf, pane);
      cabPart(0.06, 2.6, 0.06, 0, 1.4, zf, steel);
      var lf = leaf(CW / 2 - 0.04, 2.56);
      lf.position.set(CW / 4, 1.4, zf + f[1] * 0.06);
      cab.add(lf);
      doors[f[0]] = { cab: { m: lf, x0: CW / 4, x1: -CW / 4 + 0.1 } };
    });
    cab.position.set(SHX, 0.02, SHZ);
    city.scene.add(cab);
    // and the landing doors in the shaft: at the street on the lobby side,
    // up top on the tower side, framed in steel with a lit call button
    [['street', 0.02, 1], ['roof', roofY, -1]].forEach(function (f) {
      var zf = SHZ + f[2] * (SHW / 2 + 0.09), y0 = f[1], DW = SHW - 0.3;
      batches.wood.addBox(SHX - DW / 2 - 0.06, y0 + 1.45, zf, 0.12, 2.9, 0.16, 0, 0x8a94b8, 0);
      batches.wood.addBox(SHX + DW / 2 + 0.06, y0 + 1.45, zf, 0.12, 2.9, 0.16, 0, 0x8a94b8, 0);
      batches.wood.addBox(SHX, y0 + 2.92, zf, DW + 0.24, 0.16, 0.16, 0, 0x8a94b8, 0);
      batches.marks.addBox(SHX + DW / 2 + 0.36, y0 + 1.15, zf, 0.16, 0.3, 0.06, 0, 0x8fb4ff, 0);
      var fixed = new THREE.Mesh(sharedBoxGeo(DW / 2, 2.8, 0.02), pane);
      fixed.position.set(SHX - DW / 4, y0 + 1.42, zf);
      city.scene.add(fixed);
      var lf = leaf(DW / 2 - 0.04, 2.76);
      lf.position.set(SHX + DW / 4, y0 + 1.42, zf + f[2] * 0.06);
      city.scene.add(lf);
      doors[f[0]].landing = { m: lf, x0: SHX + DW / 4, x1: SHX - DW / 4 + 0.1 };
    });
    city.towerLift = {
      street: { x: SHX, z: SHZ + SHW / 2 + 1.2, y: 0, heading: 0, out: { x: SHX, z: SHZ + SHW / 2 + 2.6 } },
      roof: { x: SHX, z: HT.z + 12.4, y: roofY, heading: Math.PI, out: { x: SHX, z: HT.z + 11.0 } },
      shaft: { x: SHX, z: SHZ, top: roofY },
      cab: cab,
      doors: doors
    };
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
  var postSet = null;   // the fence posts, while the city is being built

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
      if (!crossed(zr)) postSet.addBox(370.2, 0.52, zr, 0.18, 1.04, 0.18, 0, 0x9a7a58);
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
    // Each strip follows the shoreline from one end to the other, out to just
    // past the waterline, and drops to the water in a short wet face. They
    // were rectangles reaching six metres past the coast to cover its curve,
    // which drew sand over open water — a swimmer there was under the beach,
    // and a boat run in at it sat up on the "sand".
    var EDGE = 0.5;
    // the bank: from the wet sand's height, starting `back` inside the edge,
    // down to its toe `out` past it
    var BANK = city.beachBank = { top: 0.2, toe: -1.2, back: 2, out: 2 };
    for (var sz = -500; sz < 500; sz += 20) {
      // one shade draw per strip, split or not — the rng stream feeds every
      // placement after this loop, and an extra draw would reshuffle the city
      var shade = U.pick(rng, sandShades);
      var segs = bandSegs(sz - 0.25, sz + 20.25);
      var sy = 0.06 + (sIdx % 2) * 0.06;
      for (var sg2 = 0; sg2 < segs.length; sg2++) {
        var za = segs[sg2][0], zb = segs[sg2][1];
        if (zb - za < 0.6) continue;
        var ea = city.shoreline(za) + EDGE, eb = city.shoreline(zb) + EDGE;
        sand.addQuad([SAND_X0, sy, za], [ea, sy, za], [eb, sy, zb], [SAND_X0, sy, zb], shade, [0, 1, 0]);
        // darker wet sand toward the waterline, and the bank shelving away
        // under the sea. The bank was a sheer face at the coast, half a
        // metre of it standing out of the water: from a boat or a swimmer's
        // eye the whole beach ended in a kerb, and it read as a wall. It
        // leans out four metres now, meeting the water about at the coast,
        // and its last metre and a half stays under the surface.
        var K = BANK;
        sand.addQuad([ea - 6, K.top, za], [ea - K.back, K.top, za], [eb - K.back, K.top, zb], [eb - 6, K.top, zb], 0xb0a078, [0, 1, 0]);
        sand.addQuad([ea - K.back, K.top, za], [eb - K.back, K.top, zb], [eb + K.out, K.toe, zb], [ea + K.out, K.toe, za], 0xa29268, [K.top - K.toe, K.back + K.out, 0]);
      }
      sIdx++;
    }
    // Narrow sand fringes along the island's other shores. Each family of
    // strips lives on its own height tier: where the west fringe crosses the
    // north and south runs at the map corners, same-tier overlaps shimmered
    // from the air just like the beach bands did.
    //
    // Each fringe runs inland FROM the waterline. They used to be centred six
    // metres in, which drew seven metres of sand out over the water — and the
    // ends of the west run, like the west ends of the north and south ones,
    // ran on past the corners into the sea. It looked like beach and was a
    // swim: you drowned walking onto it. Clipped to the island, with the same
    // colour drawn for every strip as before (the rng stream feeds the rest
    // of the city), including the ones that now have no dry land to cover.
    function fringe(x0, x1, z0, z1, y, color) {
      x0 = Math.max(x0, city.westShore((z0 + z1) / 2));
      z0 = Math.max(z0, city.northShore((x0 + x1) / 2));
      z1 = Math.min(z1, city.southShore((x0 + x1) / 2));
      if (x1 - x0 < 0.5 || z1 - z0 < 0.5) return;
      sand.addGroundQuad((x0 + x1) / 2, y, (z0 + z1) / 2, x1 - x0, z1 - z0, 0, color);
    }
    for (var fz = -520; fz < 520; fz += 20) {
      var wsh = city.westShore(fz + 10);
      fringe(wsh, wsh + 26, fz - 0.25, fz + 20.25, 0.22 + (sIdx % 2) * 0.06, U.pick(rng, sandShades));
      sIdx++;
    }
    for (var fx = -520; fx < 380; fx += 20) {
      var nsh = city.northShore(fx + 10);
      fringe(fx - 0.25, fx + 20.25, nsh, nsh + 26, 0.46 + (sIdx % 2) * 0.06, U.pick(rng, sandShades));
      var ssh = city.southShore(fx + 10);
      fringe(fx - 0.25, fx + 20.25, ssh - 26, ssh, 0.46 + ((sIdx + 1) % 2) * 0.06, U.pick(rng, sandShades));
      sIdx++;
    }
    var sandMesh = new THREE.Mesh(sand.build(), sharedVertexLambert());
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
    var pierMesh = new THREE.Mesh(pier.build(), sharedVertexLambert());
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
    // the ocean plane spans the whole map, so its inland vertices sit just under
    // the streets. Sink those and never animate them — otherwise wave crests rise
    // through the asphalt as flickering blue patches.
    //
    // Only so far, though. Every vertex on land used to go down four metres,
    // and with one vertex every 50 m that dragged the water along each coast
    // down with it: the last fifty metres of sea sloped away toward the
    // shore, three metres down by the beach. Nobody was ever in it before;
    // a swimmer or a moored boat sat a metre or more above what was drawn.
    // Land vertices next to the sea now sit just under the lowest sand and
    // keep the coastal water nearly level; the rest still go deep. (The
    // water test is the land itself: under a pier or a bridge is still sea.)
    var OX = 73, OZ = 61;
    var base = new Float32Array(OX * OZ), wet = new Uint8Array(OX * OZ);
    for (var iz = 0; iz < OZ; iz++) {
      for (var ix = 0; ix < OX; ix++) {
        wet[iz * OX + ix] = city.islandAt(OCEAN_X0 + ix * OCEAN_CELL, OCEAN_Z0 + iz * OCEAN_CELL) ? 0 : 1;
      }
    }
    for (iz = 0; iz < OZ; iz++) {
      for (ix = 0; ix < OX; ix++) {
        var k = iz * OX + ix;
        if (wet[k]) { base[k] = SEA_LEVEL; continue; }
        var shore = false;
        for (var dz2 = -1; dz2 <= 1 && !shore; dz2++) {
          for (var dx2 = -1; dx2 <= 1; dx2++) {
            var nx2 = ix + dx2, nz2 = iz + dz2;
            if (nx2 >= 0 && nx2 < OX && nz2 >= 0 && nz2 < OZ && wet[nz2 * OX + nx2]) { shore = true; break; }
          }
        }
        base[k] = shore ? OCEAN_SHORE : -4;
      }
    }
    city.oceanBase = base;
    var op = og.attributes.position.array;
    for (var vi = 0; vi < op.length; vi += 3) {
      var gi = Math.round((op[vi] - OCEAN_X0) / OCEAN_CELL), gj = Math.round((op[vi + 2] - OCEAN_Z0) / OCEAN_CELL);
      op[vi + 1] = base[gj * OX + gi];
    }
    var om = new THREE.MeshPhongMaterial({ color: 0x0d2242, shininess: 120, specular: 0x8899cc, transparent: true, opacity: 0.93 });
    // The swell is worked out on the GPU. It used to be a loop over all 4,453
    // vertices on every frame, and the whole position buffer sent up again
    // after it, which also meant keeping a second copy of the plane to work
    // from. The sea's own vertices lie at -0.35 and the sunk ones at -4, so
    // the shader tells them apart by height and needs no mask. The two phases
    // are wrapped here, in double precision, so a long session never runs
    // the GPU's single-precision sine out of digits.
    var wave = { value: new THREE.Vector2() };
    om.onBeforeCompile = function (sh) {
      sh.uniforms.uWave = wave;
      if (sh.vertexShader.indexOf('#include <begin_vertex>') < 0) console.error('ocean: the shader chunk it hooks is missing');
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nuniform vec2 uWave;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n' +
          'if (position.y > -0.5) transformed.y += sin(position.x * 0.045 + uWave.x) * 0.28 + sin(position.z * 0.06 + uWave.y) * 0.22;');
    };
    city.oceanWave = wave.value;
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
      return releaseAfterUpload(new THREE.CanvasTexture(cv));
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
    // under rain the sky clouds over: the blue day dome fades toward the grey
    // the fog has turned, and the stars and the moon go in
    var wet = GAME.weather ? GAME.weather.rain : 0, clear = 1 - wet;
    if (city.sky) city.sky.material.color.setScalar(U.clamp(0.32 + df * 1.1, 0.32, 1) * (1 - 0.45 * wet));
    if (city.skyDay) {
      city.skyDay.material.opacity = U.clamp((df - 0.6) / 0.32, 0, 1);
      // the blue taken out of it, toward a flat overcast grey
      city.skyDay.material.color.setRGB(1 - 0.42 * wet, 1 - 0.4 * wet, 1 - 0.5 * wet);
    }
    if (city.stars) { city.stars.material.opacity = U.clamp(1 - df * 2.2, 0, 1) * clear; city.stars.material.transparent = true; city.stars.visible = df < 0.5 && wet < 0.9; }
    if (city.moon) city.moon.material.opacity = U.clamp(1 - df * 1.6, 0.05, 1) * U.clamp(clear, 0.05, 1), city.moon.material.transparent = true;
    if (city.moonHalo) city.moonHalo.material.opacity = U.clamp(0.5 - df * 0.8, 0, 0.5) * clear;
    // street lamps burn at night, fade out through dusk, and are off in daylight
    var lampOn = U.clamp(1 - (df - 0.45) / 0.35, 0, 1);
    // and so do the windows' own lights, building by building (see lamBlock)
    windowNight.value = lampOn;
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
    // The vertex-coloured props below share one material. It is not the
    // shared workhorse the static meshes wear: r128 keeps one program per
    // material, and a material worn by instanced and plain meshes alike
    // swaps its program every time the draw order alternates between them.
    var instLam = new THREE.MeshLambertMaterial({ vertexColors: true });

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
    var frondMesh = new THREE.InstancedMesh(frondGeo, instLam, palms.length);
    for (var p = 0; p < palms.length; p++) {
      var pp = palms[p];
      dummy.position.set(pp.x, city.groundY(pp.x, pp.z), pp.z);
      dummy.rotation.set(0, rng() * Math.PI * 2, 0);
      dummy.scale.setScalar(pp.s || 1);
      dummy.updateMatrix();
      trunkMesh.setMatrixAt(p, dummy.matrix);
      frondMesh.setMatrixAt(p, dummy.matrix);
      // every trunk is solid: the beach ones were left out, and a car went
      // straight through them
      addSolid(pp.x, pp.z, 0.8, 0.8, 6, 'prop', true);
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
    var poleMesh = new THREE.InstancedMesh(poleGeo, instLam, lightSpots.length);
    var headGeo = new THREE.BoxGeometry(0.7, 0.22, 0.3);
    headGeo.translate(1.8, 5.8, 0);
    var headMesh = new THREE.InstancedMesh(headGeo, new THREE.MeshBasicMaterial({ color: 0xffc88a }), lightSpots.length);
    for (var L = 0; L < lightSpots.length; L++) {
      var ls = lightSpots[L];
      dummy.position.set(ls.x, 0, ls.z);
      dummy.rotation.set(0, ls.rot, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      poleMesh.setMatrixAt(L, dummy.matrix);
      headMesh.setMatrixAt(L, dummy.matrix);
      addSolid(ls.x, ls.z, 0.5, 0.5, 6, 'prop', true).knock =
        { kind: 'pole', mesh: poleMesh, extra: headMesh, i: L, x: ls.x, z: ls.z, rot: ls.rot, down: false, t: 0, m0: null };
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
      // Bolted to the water main: a car stops on a hydrant the way it does on
      // a bollard. It used to be knocked down like a lamp post — and with
      // nothing to lay over, "down" was simply gone: drive at one and it
      // vanished from under the bonnet.
      addSolid(hyd[hh].x, hyd[hh].z, 0.6, 0.6, 1, 'prop', true).hydrant = true;
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
    var benchMesh = new THREE.InstancedMesh(benchB.build(), instLam, benches.length);
    for (var bb = 0; bb < benches.length; bb++) {
      dummy.position.set(benches[bb].x, 0.3, benches[bb].z);
      dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(1); dummy.updateMatrix();
      benchMesh.setMatrixAt(bb, dummy.matrix);
      // solid, as a bench is — a car went through these as if they were paint
      addSolid(benches[bb].x, benches[bb].z, 0.7, 2.2, 0.9, 'prop', true).knock =
        { kind: 'flat', mesh: benchMesh, extra: null, i: bb, x: 0, z: 0, rot: 0, down: false, t: 0, m0: null };
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
    var twrMesh = new THREE.Mesh(twr.build(), new THREE.MeshLambertMaterial({ map: twrTex.map, emissive: 0xccccdd, emissiveMap: twrTex.glow, vertexColors: true }));
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
    var spokeGeo = new THREE.BoxGeometry(30, 0.34, 0.34);
    for (var sI = 0; sI < 4; sI++) {
      var spoke = new THREE.Mesh(spokeGeo, spokeMat);
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
    var sup = new THREE.Mesh(supB.build(), sharedVertexLambert());
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
    var craneMesh = new THREE.Mesh(craneB.build(), sharedVertexLambert());
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
    var rw = new THREE.Mesh(b.build(), sharedVertexLambert());
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
    var tbm = new THREE.Mesh(tb.build(), sharedVertexLambert());
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
        postSet.addBox(px, 1.4, pz, 0.24, 2.8, 0.24, 0, postColor);
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
    var mesh = new THREE.Mesh(b.build(), sharedVertexLambert());
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
          // The drop is metered too: ramp2 sets a 22 m/s pace by its lip, so
          // the landing falls a known ~30 m past the parapet. It is a plain
          // ramp, not a booster — that pace brings almost everything DOWN,
          // and a car thrown off it any faster lands against the wall of the
          // next block. The corridor check covers that plus margin; thin
          // posts (lamps) don't count — only real massing closes a landing
          // zone.
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
          out.push({ x: axisX ? c2a : across, z: axisX ? across : c2a, rot: rot, w: 12, len: 16, h: 4.6, base: roofY2, cap: 22 });
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

  // Isla Verde's own jumps — ten, on a tally of their own, so the mainland's
  // twenty-five (and what finding them opens) stay exactly as they were. The
  // island is hills and curves rather than a grid, so its ramps are found
  // rather than laid out: flat open ground off the roads, square to the
  // compass like every other ramp (their flanks are boxes), with a clear
  // run-up behind, dry land ahead for the landing, and spread over the whole
  // island. Seeded, so they are in the same places every visit.
  var ISLA_STUNTS = 10;
  // a third of them boosted, capped at a pace whose landing has been looked at
  var ISLA_BOOSTS = 3, ISLA_BOOST_CAP = 44, ISLA_BOOST_RUN = 104;
  function rollIslaStuntSpots() {
    var I = city.isla;
    if (!I || !GAME.isla) return [];
    var rng = mulberry32(4271);
    var B = I.bounds, out = [];
    var SH = [{ w: 13, len: 22, h: 4.4 }, { w: 16, len: 26, h: 5.4 }, { w: 11, len: 18, h: 3.6 }, { w: 20, len: 30, h: 6.4 }];
    var pois = GAME.isla.pois(), poiList = [];
    for (var pk in pois) if (pois[pk] && pois[pk].x !== undefined) poiList.push(pois[pk]);
    // the Marina Villa's lot, south of the jetties: shops.js builds the house
    // there later, so this is where it learns the spot (villaYard), and the
    // jumps learn to keep clear of it (below)
    city.villaYard = pois.marina ? { x: pois.marina.x - 7, z: pois.marina.z + 40, r: 60 } : null;
    function land(x, z) { return I.contains(x, z) && !city.isInWater(x, z); }
    function solidNear(x, z, r, topAbove) {
      var bx = city.hash.query(x, z, r);
      for (var i = 0; i < bx.length; i++) {
        var b = bx[i];
        if (b.h !== undefined && b.h <= topAbove) continue;
        if (x + r > b.minX && x - r < b.maxX && z + r > b.minZ && z - r < b.maxZ) return true;
      }
      return false;
    }
    var why = city.islaStuntWhy = {};
    function no(k) { why[k] = (why[k] || 0) + 1; return null; }
    function fits(x, z, rot, sh, boost) {
      for (var i = 0; i < out.length; i++) if (U.dist2(x, z, out[i].x, out[i].z) < 80 * 80) return no('spacing');
      for (var j = 0; j < poiList.length; j++) if (U.dist2(x, z, poiList[j].x, poiList[j].z) < 35 * 35) return no('poi');
      var fx = Math.sin(rot), fz = Math.cos(rot), sx = fz, sz = -fx;
      var hw = sh.w / 2 + 2, hl = sh.len / 2 + 2;
      // ground under the foot and under the lip: the ramp may run up or down
      // a gentle grade, but not across one
      var base0 = I.groundY(x - fx * sh.len / 2, z - fz * sh.len / 2);
      var base1 = I.groundY(x + fx * sh.len / 2, z + fz * sh.len / 2);
      if (Math.abs(base1 - base0) > sh.len * 0.16) return no('grade');
      // set downhill, the grade eats the ramp: keep two metres of real rise
      if (sh.h + base1 - base0 < 2.4) return no('grade');
      var base = base0;
      // the footprint: on land, off the roads and bridges, true to that
      // grade, and empty
      for (var a = -1; a <= 1; a += 0.5) {
        var along = base0 + (base1 - base0) * (a * hl / sh.len + 0.5);
        for (var c = -1; c <= 1; c += 0.5) {
          var px = x + fx * hl * a + sx * hw * c, pz = z + fz * hl * a + sz * hw * c;
          if (!land(px, pz) || I.inland(px, pz) < 0.02) return no('land');
          if (I.onRoad(px, pz, 2) || city.nearCrossing(px, pz, 12)) return no('road');
          if (Math.abs(I.groundY(px, pz) - along) > 0.6) return no('flat');
        }
      }
      if (solidNear(x, z, Math.max(hw, hl), -1e9)) return no('solid');
      // nor where a car gets parked
      for (var q = 0; q < city.parkedSpots.length; q++) {
        if (U.dist2(x, z, city.parkedSpots[q].x, city.parkedSpots[q].z) < Math.pow(Math.max(hw, hl) + 4, 2)) return no('parked');
      }
      // a run-up behind the low lip: land, not a cliff, nothing standing
      for (var r = 4; r <= 28; r += 4) {
        var rx = x - fx * (sh.len / 2 + r), rz = z - fz * (sh.len / 2 + r);
        if (!land(rx, rz) || Math.abs(I.groundY(rx, rz) - base0) > 1 + r * 0.15) return no('runup');
        if (solidNear(rx, rz, 2, I.groundY(rx, rz) + 0.6)) return no('runupSolid');
      }
      // and somewhere to come down: dry land the whole way out, not rising
      // into a hillside, nothing tall to fly into along the line
      var reach = boost ? 110 : 60;
      for (var f = 8; f <= reach; f += 4) {
        var lx = x + fx * (sh.len / 2 + f), lz = z + fz * (sh.len / 2 + f);
        if (!land(lx, lz)) return no('landing');
        var gy = I.groundY(lx, lz);
        if (gy > base1 + 1 + f * 0.04 || gy < base1 - 30) return no('slope');
        if (solidNear(lx, lz, 2, gy + 1.5)) return no('landingSolid');
      }
      return { x: x, z: z, rot: rot, w: sh.w, len: sh.len, h: sh.h, base: base0, base1: base1, boost: boost, isla: true };
    }
    var cands = [];
    var ex = B.rx * 1.2, ez = B.rz * 1.2;
    for (var cx = B.cx - ex; cx <= B.cx + ex; cx += 9) {
      for (var cz = B.cz - ez; cz <= B.cz + ez; cz += 9) {
        if (I.contains(cx, cz) && I.inland(cx, cz) > 0.06) cands.push([cx, cz]);
      }
    }
    for (var k = cands.length - 1; k > 0; k--) {
      var m = Math.floor(rng() * (k + 1)), tmp = cands[k]; cands[k] = cands[m]; cands[m] = tmp;
    }
    var ROTS = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
    // the shape wanted next is tried first, then the smaller ones: the hills
    // leave room for a kicker in places a long ramp will not go
    for (var ci = 0; ci < cands.length && out.length < ISLA_STUNTS; ci++) {
      // (no boosters over here: launched that hard off a hillside, the
      // landing is somewhere far down the slope, and too hard to live)
      var want = out.length % SH.length, boost = false;
      var r0 = Math.floor(rng() * 4), spot = null;
      for (var si = 0; si < SH.length && !spot; si++) {
        var sh = SH[(want + si) % SH.length];
        for (var ri = 0; ri < 4 && !spot; ri++) spot = fits(cands[ci][0], cands[ci][1], ROTS[(r0 + ri) % 4], sh, boost);
      }
      if (spot) out.push(spot);
    }
    // A jump rolled into the villa's front yard stood between the road and
    // the house and hid it outright. It is swapped, in its own slot, for the
    // next spot that fits clear of the yard — not rerolled with the rest:
    // every other jump keeps its place and its number, and the number is
    // what a saved game knows a found jump by.
    var Y = city.villaYard;
    for (var oi = 0; Y && oi < out.length; oi++) {
      if (U.dist2(out[oi].x, out[oi].z, Y.x, Y.z) >= Y.r * Y.r) continue;
      var was = out.splice(oi, 1)[0], swap = null;
      var w0 = SH.map(function (q) { return q.len; }).indexOf(was.len);
      for (var cj = 0; cj < cands.length && !swap; cj++) {
        if (U.dist2(cands[cj][0], cands[cj][1], Y.x, Y.z) < Y.r * Y.r) continue;
        for (var sj = 0; sj < SH.length && !swap; sj++) {
          for (var rj = 0; rj < 4 && !swap; rj++) swap = fits(cands[cj][0], cands[cj][1], ROTS[rj], SH[(Math.max(0, w0) + sj) % SH.length], false);
        }
      }
      out.splice(oi, 0, swap || was);
    }
    // Boosters, then — a third of them, as on the mainland, but only where
    // the way down is fit for one. They were left off over here because a
    // full booster fired off a hillside came down somewhere far below and
    // too hard to live; these are picked from the jumps already placed (no
    // jump moves, and none changes its number) for a long, dry, level run
    // out past the lip, and they are capped: they haul you up to their pace
    // and leave anything already quicker alone, so where you come down is
    // somewhere this has looked.
    for (var bi = 0, nb = 0; bi < out.length && nb < ISLA_BOOSTS; bi++) {
      if (!boostLands(out[bi])) continue;
      out[bi].boost = true; out[bi].cap = ISLA_BOOST_CAP; out[bi].capUp = true;
      nb++;
    }
    function boostLands(sp) {
      var fx = Math.sin(sp.rot), fz = Math.cos(sp.rot);
      for (var f = 8; f <= ISLA_BOOST_RUN; f += 4) {
        var lx = sp.x + fx * (sp.len / 2 + f), lz = sp.z + fz * (sp.len / 2 + f);
        if (!land(lx, lz) || I.inland(lx, lz) < 0.02 || city.nearCrossing(lx, lz, 10)) return false;
        var gy = I.groundY(lx, lz);
        if (gy > sp.base1 + 0.5 + f * 0.03 || gy < sp.base1 - 6) return false;
        if (solidNear(lx, lz, 2, gy + 1.5)) return false;
      }
      return true;
    }
    return out;
  }

  function buildRamps(scene) {
    // 25 unique stunt jumps scattered across the city: construction ramps
    // parked on verges and aprons near landmarks, each one a find — and
    // Isla Verde's ten after them (their own tally; see GAME.stunts).
    // The island's come LAST so the mainland's keep the numbers a saved
    // game knows them by.
    var SPOTS = rollStuntSpots().concat(rollIslaStuntSpots());
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
    var islaN = 0;
    for (var i = 0; i < SPOTS.length; i++) {
      var s = SPOTS[i];
      var c = Math.cos(s.rot), sn = Math.sin(s.rot);
      // world position of a local (across, along, up) point — `base` lifts
      // the whole wedge onto a roof when the spot calls for one
      function P(lx, lz, ly) {
        return [s.x + lx * c + lz * sn, ly + baseAt(lz), s.z - lx * sn + lz * c];
      }
      var hw = s.w / 2, hl = s.len / 2;
      // the ground the wedge stands on, foot to lip (level, but for an island
      // ramp set on a grade)
      // (rb0/rb1: sb0/sb1 below are the side walls' corners)
      var rb0 = s.base || 0, rb1 = s.base1 !== undefined ? s.base1 : rb0;
      function baseAt(lz) { return rb0 + (rb1 - rb0) * U.clamp((lz + hl) / s.len, 0, 1); }
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
        idx: i, x: s.x, z: s.z, rot: s.rot, w: s.w, len: s.len, h: s.h, base: s.base || 0, base1: s.base1, boost: !!s.boost, cap: s.cap, capUp: !!s.capUp,
        isla: !!s.isla, islaN: s.isla ? islaN++ : -1,
        cos: c, sin: sn,
        minX: s.x - rad, maxX: s.x + rad, minZ: s.z - rad, maxZ: s.z + rad
      });
      // the tall back face is solid: come at it from behind and you hit a wall.
      // It sits just beyond the lip and stops short of it, so a car launching
      // off the top sails over while one approaching from behind is stopped.
      var bc = P(0, hl + 1.1, 0);
      var across = Math.abs(Math.cos(s.rot)) > 0.5;
      addSolid(bc[0], bc[2], across ? s.w : 2.0, across ? 2.0 : s.w, rb1 + s.h * 0.62, 'building');
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
            baseAt(-hl + s.len * t0) + Math.max(0.3, s.h * t0 - 0.35), 'prop', true);
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
    // a speedboat moored off each of the east piers, bow out to sea, close
    // enough alongside to step down into from the planks
    city.moorings.push({ x: 485, z: 238.5 }, { x: 445, z: -168.5 });
    // and a jet ski at the northern pier's other side — on your left, walking
    // out along it — for anybody who wants the bay at a gallop
    city.moorings.push({ x: 445, z: -191.5, vtype: 'jetski' });
    // (these three only: Isla Verde lays out its own moorings first, with
    // their own spots — a second spot each here put two boats on every one)
    city.moorings.forEach(function (mo) {
      if (mo.isla) return;
      city.parkedSpots.push({ x: mo.x, z: mo.z, y: -0.35, heading: Math.PI / 2, vtype: mo.vtype || 'boat' });
    });

    // the rest of the arsenal (arsenal.js) on corners the loop above never
    // takes — it only ever pairs rows and columns of the same parity — so
    // nothing already lying about moves to make room
    [[1, 2, 'bat'], [2, 5, 'knife'], [4, 1, 'grenade'], [5, 2, 'molotov'], [6, 3, 'katana'], [3, 6, 'chainsaw'], [1, 6, 'sniper'], [6, 1, 'rocket']].forEach(function (s) {
      if (s[0] < R.length - 1 && s[1] < R.length - 1) city.pickupSpots.push({ x: R[s[0]] + 8.4, z: R[s[1]] - 8.4, type: s[2] });
    });
    // starter pickups within sight of the spawn point (356, 40)
    city.pickupSpots.push({ x: 358, z: 34, type: 'pistol' });
    city.pickupSpots.push({ x: 358, z: 48, type: 'health' });
    city.pickupSpots.push({ x: 358, z: 60, type: 'smg' });
    city.pickupSpots.push({ x: 358, z: -260, type: 'shotgun' });
    city.pickupSpots.push({ x: 8.4, z: 158.4, type: 'health' });
    city.pickupSpots.push({ x: -141.6, z: -158.4, type: 'armor' });
    city.pickupSpots.push({ x: 365, z: 250, type: 'pistol' });
  }

  // ---------- things a car can knock down ----------
  // Lamp posts and boardwalk benches (hydrants stand: see above). A
  // half-metre post stopped a car at 29 m/s as dead as a building would; now
  // something moving takes it
  // down for a little of its pace and a dent (vehicles.js collideStatic), and
  // it is put back up once nobody has been near it for a while.
  var knocked = [], knockCheckT = 0, KNOCK_BACK_AFTER = 45, KNOCK_BACK_R = 120;
  var kq = new THREE.Quaternion(), kq2 = new THREE.Quaternion(), kAxis = new THREE.Vector3();
  var kPos = new THREE.Vector3(), kScl = new THREE.Vector3(1, 1, 1), kM = new THREE.Matrix4();
  function setKnock(k, m) {
    k.mesh.setMatrixAt(k.i, m); k.mesh.instanceMatrix.needsUpdate = true;
    if (k.extra) { k.extra.setMatrixAt(k.i, m); k.extra.instanceMatrix.needsUpdate = true; }
  }
  city.knockProp = function (box, heading) {
    var k = box.knock;
    if (!k || k.down) return false;
    k.down = true; k.t = 0;
    city.hash.remove(box);
    if (!k.m0) { k.m0 = new THREE.Matrix4(); k.mesh.getMatrixAt(k.i, k.m0); }
    if (k.kind === 'pole') {
      // laid over in the direction it was hit, hinged at its foot
      kq.setFromAxisAngle(kAxis.set(Math.cos(heading), 0, -Math.sin(heading)), Math.PI * 0.46);
      kq2.setFromAxisAngle(kAxis.set(0, 1, 0), k.rot);
      kq.multiply(kq2);
      kM.compose(kPos.set(k.x, 0, k.z), kq, kScl.set(1, 1, 1));
    } else kM.makeScale(0, 0, 0);
    setKnock(k, kM);
    knocked.push(box);
    return true;
  };
  function standKnockedBack(dt) {
    if (!knocked.length || (knockCheckT -= dt) > 0) return;
    knockCheckT = 2;
    var f = GAME.focus();
    for (var i = knocked.length - 1; i >= 0; i--) {
      var b = knocked[i], k = b.knock;
      k.t += 2;
      if (k.t < KNOCK_BACK_AFTER) continue;
      if (U.dist2(f.x, f.z, (b.minX + b.maxX) / 2, (b.minZ + b.maxZ) / 2) < KNOCK_BACK_R * KNOCK_BACK_R) continue;
      k.down = false;
      city.hash.insert(b);
      setKnock(k, k.m0);
      knocked.splice(i, 1);
    }
  }

  city.update = function (dt, t) {
    standKnockedBack(dt);
    // the swell's two phases (see the ocean in buildBeach)
    if (city.oceanWave) city.oceanWave.set((t * 1.1) % (Math.PI * 2), (t * 0.7) % (Math.PI * 2));
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
