GAME.world = { cars: [], peds: [], pickups: [] };

// pooled particle + tracer effects
GAME.fx = (function () {
  var MAXP = 360, MAXT = 32;
  var parts = [], tracers = [], flashes = [];
  var pGeo, pPts, tGeo, tLines, scene;

  function init(sc) {
    scene = sc;
    var pos = new Float32Array(MAXP * 3), col = new Float32Array(MAXP * 3);
    for (var i = 0; i < MAXP; i++) { pos[i * 3 + 1] = -1000; parts.push({ life: 0 }); }
    pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    pPts = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.85, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false }));
    pPts.frustumCulled = false;
    scene.add(pPts);

    var tpos = new Float32Array(MAXT * 6);
    tGeo = new THREE.BufferGeometry();
    tGeo.setAttribute('position', new THREE.BufferAttribute(tpos, 3));
    tLines = new THREE.LineSegments(tGeo, new THREE.LineBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
    tLines.frustumCulled = false;
    for (var t = 0; t < MAXT; t++) tracers.push({ life: 0 });
    scene.add(tLines);

    for (var f = 0; f < 4; f++) {
      var m = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffb050, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      m.visible = false;
      scene.add(m);
      flashes.push({ mesh: m, life: 0, max: 0 });
    }
  }

  var pCursor = 0, tCursor = 0;
  function spawn(x, y, z, o) {
    var n = o.count || 6;
    for (var i = 0; i < n; i++) {
      var p = parts[pCursor];
      pCursor = (pCursor + 1) % MAXP;
      p.life = p.maxLife = (o.life || 0.6) * (0.6 + Math.random() * 0.7);
      p.x = x; p.y = y; p.z = z;
      var sp = o.spread || 1;
      p.vx = (Math.random() - 0.5) * sp + (o.vx || 0);
      p.vy = Math.random() * sp * 0.8 + (o.vy || 1);
      p.vz = (Math.random() - 0.5) * sp + (o.vz || 0);
      p.grav = o.grav !== undefined ? o.grav : -2;
      p.color = o.color !== undefined ? o.color : 0xff8040;
    }
  }
  function tracer(x0, y0, z0, x1, y1, z1) {
    var slot = tCursor, t = tracers[slot];
    tCursor = (tCursor + 1) % MAXT;
    t.life = 0.07;
    var a = tGeo.attributes.position.array, i = t.i = slot * 6;
    a[i] = x0; a[i + 1] = y0; a[i + 2] = z0; a[i + 3] = x1; a[i + 4] = y1; a[i + 5] = z1;
    tGeo.attributes.position.needsUpdate = true;
  }
  function flash(x, y, z, scale) {
    for (var i = 0; i < flashes.length; i++) {
      if (flashes[i].life <= 0) {
        var f = flashes[i];
        f.mesh.position.set(x, y, z);
        f.mesh.visible = true;
        f.life = f.max = 0.45;
        f.scale = scale || 5;
        return;
      }
    }
  }
  function update(dt) {
    if (!pGeo) return;
    var pa = pGeo.attributes.position.array, ca = pGeo.attributes.color.array;
    // The buffers go to the GPU only when something in them moved: all 360
    // slots were re-uploaded every tick, 520 KB a second, with not a spark
    // in the air.
    var moved = false, hid = false;
    for (var i = 0; i < MAXP; i++) {
      var p = parts[i];
      if (p.life > 0) {
        moved = true;
        p.life -= dt;
        p.vy += p.grav * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        if (p.y < 0.1 && p.grav < 0) { p.y = 0.1; p.vy = 0; }
        pa[i * 3] = p.x; pa[i * 3 + 1] = p.life > 0 ? p.y : -1000; pa[i * 3 + 2] = p.z;
        var c = p.color, fade = Math.max(0, p.life / p.maxLife);
        ca[i * 3] = ((c >> 16 & 255) / 255) * fade;
        ca[i * 3 + 1] = ((c >> 8 & 255) / 255) * fade;
        ca[i * 3 + 2] = ((c & 255) / 255) * fade;
      } else if (pa[i * 3 + 1] > -999) { pa[i * 3 + 1] = -1000; hid = true; }
    }
    if (moved || hid) pGeo.attributes.position.needsUpdate = true;
    if (moved) pGeo.attributes.color.needsUpdate = true;
    var ta = tGeo.attributes.position.array;
    for (var t = 0; t < MAXT; t++) {
      var tr = tracers[t];
      if (tr.life > 0) {
        tr.life -= dt;
        if (tr.life <= 0) { ta[t * 6] = 0; ta[t * 6 + 1] = -1000; ta[t * 6 + 2] = 0; ta[t * 6 + 3] = 0; ta[t * 6 + 4] = -1000; ta[t * 6 + 5] = 0; tGeo.attributes.position.needsUpdate = true; }
      }
    }
    for (var f = 0; f < flashes.length; f++) {
      var fl = flashes[f];
      if (fl.life > 0) {
        fl.life -= dt;
        var k = 1 - fl.life / fl.max;
        fl.mesh.scale.setScalar(0.5 + k * fl.scale);
        fl.mesh.material.opacity = 0.9 * (1 - k);
        if (fl.life <= 0) fl.mesh.visible = false;
      }
    }
  }
  return { init: init, spawn: spawn, tracer: tracer, flash: flash, update: update };
})();

var VEHICLES = {
  sports: { label: 'Vulture GT', maxSpeed: 40, accel: 17, grip: 3.6, turn: 2.7, hp: 150, l: 4.3, w: 1.95, cabinH: 0.5, bodyH: 0.5, colors: [0xff2f7a, 0x38e8ff, 0xffe14f, 0xffffff, 0xb040ff] },
  sedan: { label: 'Cadenza', maxSpeed: 29, accel: 10, grip: 5.2, turn: 2.1, hp: 175, l: 4.5, w: 1.9, cabinH: 0.62, bodyH: 0.55, colors: [0x9fb4c8, 0xc0a0d8, 0x88c8a8, 0xd8d0c0, 0x8090b0] },
  taxi: { label: 'Taxi', maxSpeed: 30, accel: 10.5, grip: 5.2, turn: 2.2, hp: 175, l: 4.5, w: 1.9, cabinH: 0.62, bodyH: 0.55, colors: [0xf0c020] },
  van: { label: 'Cargo Van', maxSpeed: 23, accel: 7, grip: 6, turn: 1.7, hp: 260, l: 5.1, w: 2.1, cabinH: 1.0, bodyH: 0.9, colors: [0x9a8a78, 0x7888a0, 0xa87868] },
  police: { label: 'Cruiser', maxSpeed: 35, accel: 13.5, grip: 5.0, turn: 2.4, hp: 200, l: 4.6, w: 1.95, cabinH: 0.6, bodyH: 0.55, colors: [0xe8ecf2] },
  ambulance: { label: 'Ambulance', maxSpeed: 27, accel: 8.5, grip: 5.6, turn: 1.8, hp: 240, l: 5.3, w: 2.15, cabinH: 1.15, bodyH: 1.0, colors: [0xf2f2f6] },
  motorcycle: { label: 'Neon Streak', maxSpeed: 46, accel: 22, grip: 2.9, turn: 3.1, hp: 130, l: 2.2, w: 0.7, cabinH: 0.0, bodyH: 0.45, colors: [0xff2f7a, 0x38e8ff, 0x20242e, 0xffe14f], bike: true },
  // showroom exclusive: never in traffic, never parked on a verge — the only
  // way onto one is to pay GRAN ROSA MOTORS for it
  superbike: { label: 'Cormorán GT', maxSpeed: 55, accel: 27, grip: 3.5, turn: 3.3, hp: 150, l: 2.3, w: 0.72, cabinH: 0.0, bodyH: 0.5, colors: [0x101018], bike: true, trim: 0x38e8ff },
  helicopter: { label: 'Pelicano', maxSpeed: 34, accel: 12, grip: 4, turn: 2, hp: 130, l: 8.5, w: 2.4, cabinH: 1.4, bodyH: 1.5, colors: [0x2a2e3a, 0xf0f0f0, 0xff2f7a], heli: true },
  // the big bird: guns and rockets — granted by finishing everything, or
  // bought over the showroom counter by anyone with the money
  gunship: { label: 'Talon', maxSpeed: 42, accel: 12, grip: 4, turn: 2, hp: 420, l: 8.5, w: 2.4, cabinH: 1.4, bodyH: 1.5, colors: [0x3a4632, 0x2c3626, 0x46523a], heli: true, gunship: true },
  monster: { label: 'Sledgehammer', maxSpeed: 33, accel: 15, grip: 5.8, turn: 2.3, hp: 420, l: 5.2, w: 2.6, cabinH: 1.1, bodyH: 1.2, colors: [0x7a3ad8, 0x38e8ff, 0xff2f7a], monster: true },
  // wheelH is the real gear length: the mesh reaches 0.5 below its origin, and
  // at 1.1 the whole plane taxied and parked six tenths of a metre in the air
  airplane: { label: 'Skywhistle', maxSpeed: 72, accel: 20, grip: 4, turn: 2, hp: 150, l: 11, w: 3, cabinH: 1.4, bodyH: 1.4, colors: [0xf0f0f4, 0xff2f7a, 0x38e8ff], plane: true, stall: 17, wheelH: 0.5 },
  // Isla Verde's own stock. The buggy is for the cove, the pickup for the
  // villa lanes, the limo for the resort — and the truck sells ice cream.
  buggy: { label: 'Dune Hopper', maxSpeed: 33, accel: 15, grip: 4.2, turn: 3.0, hp: 110, l: 3.4, w: 1.85, cabinH: 0.0, bodyH: 0.42, colors: [0xffb03a, 0x6ae8a0, 0xff6a8a, 0xf0f0f4], buggy: true },
  pickup: { label: 'Sierra 4x4', maxSpeed: 30, accel: 10, grip: 6.0, turn: 2.0, hp: 240, l: 5.0, w: 2.05, cabinH: 0.78, bodyH: 0.78, colors: [0x7a8a68, 0xa8683a, 0x486888, 0xd0c0a0], pickup: true },
  limo: { label: 'Vista Royale', maxSpeed: 31, accel: 8.5, grip: 5.4, turn: 1.5, hp: 210, l: 7.2, w: 2.0, cabinH: 0.62, bodyH: 0.55, colors: [0x14141a, 0xf0ece0] },
  icecream: { label: 'Sunny Scoops', maxSpeed: 21, accel: 6.2, grip: 5.8, turn: 1.7, hp: 200, l: 5.2, w: 2.2, cabinH: 0, bodyH: 0.55, colors: [0xfdf6ec], icecream: true }
};

// Merged bodies are keyed by everything that shapes their vertices — type
// plus the baked-in colors. The palettes are small and finite, so the cache
// tops out at a few dozen geometries and every spawn after the first reuses
// them: the bubble stops paying typed-array and GPU-upload tax per car.
// The builder's boxes are laid only on a miss, too. They used to be laid on
// every spawn and thrown away on a hit, and that was not near-free: seventy-
// odd small arrays a box, 100-350 KB of garbage for every car the bubble made.
var carGeoCache = {};
function cachedGeo(key, fill) {
  var g = carGeoCache[key];
  if (!g) {
    var b = new GeoBatch();
    fill(b);
    g = b.build(); g.userData.shared = true; carGeoCache[key] = g;
  }
  return g;
}

function buildBikeMesh(colorHex, trim) {
  var g = new THREE.Group();
  var body = new THREE.Mesh(cachedGeo('bike|' + colorHex + '|' + (trim || 0), function (b) {
    b.addBox(0, 0.62, 0, 0.28, 0.34, 1.5, 0, colorHex, 0);       // fuel tank / frame
    b.addBox(0, 0.78, -0.55, 0.42, 0.14, 0.5, 0, 0x141824, 0);    // seat
    b.addBox(0, 0.98, 0.62, 0.5, 0.1, 0.1, 0, 0x101014, 0);       // handlebars
    b.addBox(0, 0.7, 0.7, 0.2, 0.24, 0.24, 0, 0x0c0c10, 0);       // front cowl — wider than the wheel so their side faces don't share a plane
    if (trim) {
      // the GT wears a full fairing, a tail cowl and racing stripes in its
      // trim color — reads as a different machine at a glance
      b.addBox(0, 0.56, 0.42, 0.4, 0.34, 0.6, 0, colorHex, 0);    // fairing
      b.addBox(0, 0.6, 0.455, 0.44, 0.1, 0.62, 0, trim, 0);       // fairing stripe — nosed past the tank so their front faces split
      b.addBox(0, 0.82, -0.86, 0.34, 0.16, 0.34, 0, colorHex, 0); // tail cowl
      b.addBox(0, 0.8, 0, 0.32, 0.06, 1.56, 0, trim, 0);          // spine stripe — its top clears the seat's by 2 cm
      b.addBox(0, 0.9, 0.58, 0.34, 0.16, 0.1, 0, 0x141824, 0);    // screen
    }
  }), sharedVertexLambert());
  g.add(body);
  g.add(new THREE.Mesh(cachedGeo('bikewheels', function (wheel) {
    wheel.addBox(0, 0.34, 0.82, 0.16, 0.68, 0.68, 0, 0x0c0c10, 0);
    wheel.addBox(0, 0.34, -0.82, 0.16, 0.68, 0.68, 0, 0x0c0c10, 0);
  }), sharedVertexLambert()));
  var hl = new THREE.Mesh(sharedBoxGeo(0.2, 0.14, 0.06), sharedBasic(0xfff2c0));
  hl.position.set(0, 0.72, 0.83);
  g.add(hl);
  g.userData.bodyMesh = body;
  return g;
}

// a seated rider posed to straddle a bike, added as a child of the bike group
// so it moves and leans with it. Used for AI traffic bikes (and reusable).
function buildBikeRider() {
  var r = GAME.peds.buildPedMesh({});
  var j = r.userData.joints;
  j.torso.rotation.x = 0.34;                       // lean toward the bars
  j.legL.rotation.x = -0.55; j.legR.rotation.x = -0.55;
  j.legL.rotation.z = 0.2; j.legR.rotation.z = -0.2; // straddle the tank
  j.armL.rotation.x = -1.05; j.armR.rotation.x = -1.05; // reach the handlebars
  r.position.set(0, -0.02, -0.35);                 // hips on the seat
  return r;
}

function buildHeliMesh(colorHex, gunship) {
  var g = new THREE.Group();
  var body = new THREE.Mesh(cachedGeo('heli|' + colorHex + '|' + (gunship ? 1 : 0), function (b) {
    b.addBox(0, 1.2, -0.6, 2.2, 1.7, 3.6, 0, colorHex, 0);        // cabin
    if (gunship) {
      // chin gun, stub wings and rocket pods — it reads military at a glance
      b.addBox(0, 0.62, 1.35, 0.26, 0.26, 1.1, 0, 0x161a12, 0);
      for (var gs = -1; gs <= 1; gs += 2) {
        b.addBox(gs * 1.85, 1.05, -0.9, 1.5, 0.16, 0.56, 0, 0x2c3626, 0);
        b.addBox(gs * 2.45, 0.82, -0.9, 0.52, 0.5, 1.7, 0, 0x1f2a1a, 0);
      }
    }
    // the canopy rides proud of the cabin roof — flush tops fight for depth
    // (the airplane's cockpit learned this first)
    b.addBox(0, 1.52, 1.2, 1.7, 1.1, 1.4, 0, 0x141824, 0);        // canopy glass
    b.addBox(0, 1.4, -3.4, 0.5, 0.5, 3.6, 0, colorHex, 0);        // tail boom
    b.addBox(0, 1.9, -5.1, 0.16, 1.1, 0.7, 0, colorHex, 0);       // tail fin
    b.addBox(-0.9, 0.1, -0.4, 0.14, 0.14, 3.4, 0, 0x0c0c10, 0);   // left skid
    b.addBox(0.9, 0.1, -0.4, 0.14, 0.14, 3.4, 0, 0x0c0c10, 0);    // right skid
    b.addBox(-0.9, 0.5, 0.6, 0.1, 0.7, 0.1, 0, 0x0c0c10, 0);
    b.addBox(0.9, 0.5, 0.6, 0.1, 0.7, 0.1, 0, 0x0c0c10, 0);
    b.addBox(0, 2.05, -0.6, 0.24, 0.3, 0.24, 0, 0x0c0c10, 0);     // rotor mast
  }), sharedVertexLambert());
  g.add(body);
  // spinning main rotor
  var rotor = new THREE.Mesh(cachedGeo('helirotor', function (rg) {
    // the blades stack 2 cm apart at the hub, like real ones — crossing in the
    // same plane, their top and bottom faces flickered where they met
    rg.addBox(0, 0, 0, 0.3, 0.06, 11, 0, 0x1a1a20, 0);
    rg.addBox(0, 0.08, 0, 11, 0.06, 0.3, 0, 0x1a1a20, 0);
  }), sharedVertexLambert());
  rotor.position.set(0, 2.3, -0.6);
  g.add(rotor);
  var tail = new THREE.Mesh(cachedGeo('helitail', function (tg) {
    tg.addBox(0, 0, 0, 0.14, 0.05, 2.2, 0, 0x1a1a20, 0);
  }), sharedVertexLambert());
  tail.position.set(0.2, 1.9, -5.1);
  g.add(tail);
  var hl = new THREE.Mesh(sharedBoxGeo(0.3, 0.16, 0.06), sharedBasic(0xfff2c0));
  hl.position.set(0, 1.2, 2.0);
  g.add(hl);
  g.userData.bodyMesh = body;
  g.userData.rotor = rotor;
  g.userData.tailRotor = tail;
  return g;
}

function buildPlaneMesh(colors) {
  var body = colors[0], accent = colors[1] || 0xff2f7a;
  var g = new THREE.Group();
  g.rotation.order = 'YXZ';
  var mesh = new THREE.Mesh(cachedGeo('plane|' + body + '|' + accent, function (b) {
    b.addBox(0, 1.2, 0, 1.5, 1.5, 9, 0, body, 0);            // fuselage
    // the canopy rides proud of the fuselage: with both tops on the same plane
    // (1.95) the dark glass and the body fought for depth and the roof flickered
    b.addBox(0, 1.62, 3.0, 1.1, 0.9, 2.2, 0, 0x141824, 0);   // cockpit glass
    b.addBox(0, 1.35, -0.4, 12, 0.28, 2.2, 0, body, 0);      // main wing
    // the stripe stands clear of the wing on every face — flush tops shimmer
    b.addBox(0, 1.35, -0.4, 12.1, 0.36, 0.36, 0, accent, 0); // wing stripe
    b.addBox(0, 1.4, -4.4, 4.4, 0.22, 1.2, 0, body, 0);      // tailplane
    b.addBox(0, 2.1, -4.4, 0.22, 1.6, 1.16, 0, accent, 0);   // vertical fin — a shade shorter than the tailplane so their edges don't share planes
    b.addBox(-0.55, 0.35, 1.0, 0.14, 0.7, 0.14, 0, 0x0c0c10, 0);
    b.addBox(0.55, 0.35, 1.0, 0.14, 0.7, 0.14, 0, 0x0c0c10, 0);
    b.addBox(0, 0.4, -3.5, 0.12, 0.5, 0.12, 0, 0x0c0c10, 0);
  }), sharedVertexLambert());
  g.add(mesh);
  // nose light + spinning prop
  var prop = new THREE.Mesh(cachedGeo('planeprop', function (pg) {
    // same trick as the rotor: crossed blades sit 2 cm apart in depth
    pg.addBox(0, 0, 0, 0.24, 3.4, 0.14, 0, 0x1a1a20, 0);
    pg.addBox(0, 0, 0.02, 3.4, 0.24, 0.14, 0, 0x1a1a20, 0);
  }), sharedVertexLambert());
  prop.position.set(0, 1.2, 4.7);
  g.add(prop);
  var hl = new THREE.Mesh(sharedBoxGeo(0.3, 0.16, 0.06), sharedBasic(0xfff2c0));
  hl.position.set(0, 1.2, 4.8);
  g.add(hl);
  g.userData.bodyMesh = mesh;
  g.userData.prop = prop;
  return g;
}

function buildMonsterMesh(colorHex) {
  var g = new THREE.Group();
  var body = new THREE.Mesh(cachedGeo('monster|' + colorHex, function (b) {
    b.addBox(0, 1.85, 0, 2.3, 0.9, 4.6, 0, colorHex, 0);          // chassis
    b.addBox(0, 2.65, -0.3, 1.9, 0.85, 2.2, 0, 0x141824, 0);      // cab
    b.addBox(0, 1.25, 0, 0.5, 0.35, 4.0, 0, 0x22262e, 0);         // spine
    b.addBox(0, 1.85, 2.35, 2.2, 0.5, 0.2, 0, 0x22262e, 0);       // bar
  }), sharedVertexLambert());
  g.add(body);
  g.add(new THREE.Mesh(cachedGeo('monsterwheels', function (wh) {
    // the tyre tops used to land on exactly the chassis top (both y=2.30) and the
    // two coplanar faces fought for depth wherever they overlapped — tucked under
    // it now, still sitting on the ground at y=0
    [[1.25, 1.5], [-1.25, 1.5], [1.25, -1.5], [-1.25, -1.5]].forEach(function (w) {
      wh.addBox(w[0], 1.06, w[1], 0.62, 2.12, 2.12, 0, 0x0c0c10, 0);
    });
  }), sharedVertexLambert()));
  g.add(new THREE.Mesh(cachedGeo('monsterglow', function (glow) {
    glow.addBox(0.7, 2.1, 2.32, 0.4, 0.2, 0.06, 0, 0xfff2c0, 0);
    glow.addBox(-0.7, 2.1, 2.32, 0.4, 0.2, 0.06, 0, 0xfff2c0, 0);
  }), sharedVertexBasic()));
  g.userData.bodyMesh = body;
  return g;
}

function buildCarMesh(type, colorHex) {
  var s = VEHICLES[type];
  if (s.monster) return buildMonsterMesh(colorHex);
  if (s.plane) return buildPlaneMesh(s.colors);
  if (s.heli) return buildHeliMesh(colorHex, s.gunship);
  if (s.bike) return buildBikeMesh(colorHex, s.trim);
  var g = new THREE.Group();
  var hl = s.l / 2, hw = s.w / 2;
  var body = new THREE.Mesh(cachedGeo('car|' + type + '|' + colorHex, function (b) {
    b.addBox(0, 0.42, 0, s.w, s.bodyH, s.l, 0, colorHex, 0);
    if (type === 'ambulance') {
      // tall box body + red cross panels
      b.addBox(0, 0.42 + s.bodyH / 2 + 0.5, -0.2, s.w, 1.0, s.l * 0.62, 0, colorHex, 0);
      // the cross's two bars sit a centimetre apart in depth — sharing one
      // plane, they fought where they crossed
      b.addBox(hw + 0.01, 1.3, -0.2, 0.05, 0.5, 0.16, 0, 0xd83040, 0);
      b.addBox(hw + 0.02, 1.3, -0.2, 0.05, 0.16, 0.5, 0, 0xd83040, 0);
      b.addBox(-hw - 0.01, 1.3, -0.2, 0.05, 0.5, 0.16, 0, 0xd83040, 0);
      b.addBox(-hw - 0.02, 1.3, -0.2, 0.05, 0.16, 0.5, 0, 0xd83040, 0);
    }
    if (type === 'icecream') {
      // A tall, square, upright van: one slab of a body from the windscreen to
      // the back doors, a stripe round it, a serving hatch with an awning on the
      // kerb side, and a pair of cones on the roof you can see three streets
      // away. The tall body stands 2 cm proud of the chassis slab underneath it:
      // give them the same width and the two coplanar side faces fight for
      // depth — that was the truck's flicker.
      var boxTop = 2.55, bw = s.w + 0.04, bhw = bw / 2;
      b.addBox(0, 1.5, -0.25, bw, 2.1, s.l * 0.78, 0, colorHex, 0);          // body
      b.addBox(0, 1.02, hl - 0.42, s.w * 0.98, 0.92, 0.9, 0, colorHex, 0);   // stubby bonnet
      b.addBox(0, 1.9, hl - 0.5, s.w * 0.84, 0.86, 0.14, 0, 0x141824, 0);    // windscreen
      b.addBox(bhw - 0.02, 1.9, hl - 1.25, 0.1, 0.7, 1.0, 0, 0x141824, 0);   // cab windows
      b.addBox(-bhw + 0.02, 1.9, hl - 1.25, 0.1, 0.7, 1.0, 0, 0x141824, 0);
      // the livery: a pink band and a blue pinstripe wrapped round the van.
      // Wider AND longer than the body — with the same length their end faces
      // shared the body's front and rear planes, and the tail flickered
      b.addBox(0, 1.28, -0.25, bw + 0.08, 0.34, s.l * 0.78 + 0.06, 0, 0xff7fb2, 0);
      b.addBox(0, 1.02, -0.25, bw + 0.08, 0.1, s.l * 0.78 + 0.06, 0, 0x53c8ea, 0);
      // serving hatch, awning and counter on the kerb side — the hatch sits
      // clear of the stripe band's face rather than in the same plane as it
      b.addBox(bhw + 0.07, 1.82, -0.5, 0.08, 0.9, 1.9, 0, 0x2a2230, 0);
      b.addBox(bhw + 0.38, 2.36, -0.5, 0.72, 0.08, 2.1, 0, 0xff7fb2, 0);
      b.addBox(bhw + 0.2, 1.3, -0.5, 0.34, 0.1, 2.0, 0, 0xf0e6d2, 0);
      // roof cones, two abreast: both show from the front, and from the side
      // they sit in the same slice so they read as one
      [-0.5, 0.5].forEach(function (cx2) {
        b.addBox(cx2, boxTop + 0.05, -0.3, 0.5, 0.5, 0.5, 0.7, 0xe0a860, 0);
        b.addBox(cx2, boxTop + 0.42, -0.3, 0.66, 0.34, 0.66, 0.35, 0xffd7e4, 0);
        b.addBox(cx2, boxTop + 0.72, -0.3, 0.5, 0.3, 0.5, 0.9, 0xfff0f4, 0);
        b.addBox(cx2, boxTop + 0.94, -0.3, 0.28, 0.24, 0.28, 0, 0xffd7e4, 0);
      });
      // a chime horn on the roof, because the chimes have to come from somewhere
      b.addBox(-0.62, boxTop + 0.15, 0.9, 0.3, 0.3, 0.44, 0, 0xd8c47a, 0);
    }
    if (type === 'pickup') {
      b.addBox(0, 0.42 + s.bodyH / 2 + 0.22, -1.05, s.w, 0.45, s.l * 0.44, 0, 0x2a2a34, 0);   // bed walls
    }
    var cabL = s.l * (type === 'van' ? 0.85 : type === 'icecream' ? 0.34 : type === 'limo' ? 0.72 : 0.5);
    var cabZ = type === 'sports' ? -0.35 : type === 'van' ? -0.1
      : type === 'icecream' ? s.l * 0.28 : type === 'pickup' ? 0.35 : -0.15;
    if (s.buggy) {
      // no cabin at all: a roll hoop over an open tub. The cross bar is wider
      // than the posts — matching widths put their side faces in one plane
      b.addBox(0, 1.05, -0.5, 0.12, 1.2, 0.12, 0, 0x2a2a34, 0);
      b.addBox(0, 1.05, 0.5, 0.12, 1.2, 0.12, 0, 0x2a2a34, 0);
      b.addBox(0, 1.6, 0, 0.16, 0.12, 1.1, 0, 0x2a2a34, 0);
    }
    if (s.cabinH > 0) {
      b.addBox(0, 0.42 + s.bodyH / 2 + s.cabinH / 2 - 0.05, cabZ, s.w * 0.82, s.cabinH, cabL, 0, type === 'police' ? 0x20242e : 0x141824, 0);
    }
    b.addBox(0, 0.28, hl * 0.72, s.w * 0.9, 0.32, 0.55, 0, 0x22262e, 0);
    b.addBox(0, 0.28, -hl * 0.72, s.w * 0.9, 0.32, 0.55, 0, 0x22262e, 0);
    var wy = 0.32, wx = hw - 0.12, wz = hl * 0.56;
    [[wx, wz], [-wx, wz], [wx, -wz], [-wx, -wz]].forEach(function (w) {
      b.addBox(w[0], wy, w[1], 0.32, 0.64, 0.72, 0, 0x0c0c10, 0);
    });
    if (type === 'police') {
      // a centimetre up: its underside used to share the cabin's bottom plane
      b.addBox(0, 0.42 + s.bodyH / 2 + 0.01, s.l * 0.28, s.w * 0.7, 0.1, 1.2, 0, 0x30405a, 0);
    }
  }), sharedVertexLambert());
  g.add(body);

  var glowMesh = new THREE.Mesh(cachedGeo('carglow|' + type, function (glow) {
    glow.addBox(hw * 0.55, 0.5, hl + 0.02, 0.38, 0.16, 0.06, 0, 0xfff2c0, 0);
    glow.addBox(-hw * 0.55, 0.5, hl + 0.02, 0.38, 0.16, 0.06, 0, 0xfff2c0, 0);
    glow.addBox(hw * 0.55, 0.5, -hl - 0.02, 0.38, 0.14, 0.06, 0, 0xff3040, 0);
    glow.addBox(-hw * 0.55, 0.5, -hl - 0.02, 0.38, 0.14, 0.06, 0, 0xff3040, 0);
    if (type === 'taxi') glow.addBox(0, 1.35, -0.1, 0.7, 0.24, 0.34, 0, 0xffd040, 0);
  }), sharedVertexBasic());
  g.add(glowMesh);

  if (type === 'police') {
    var barR = new THREE.Mesh(sharedBoxGeo(0.42, 0.22, 0.34), sharedBasic(0xff2030));
    barR.position.set(0.28, 1.28, -0.5);
    var barB = new THREE.Mesh(sharedBoxGeo(0.42, 0.22, 0.34), sharedBasic(0x2050ff));
    barB.position.set(-0.28, 1.28, -0.5);
    g.add(barR); g.add(barB);
    g.userData.lightbar = [barR, barB];
  }
  g.userData.bodyMesh = body;
  return g;
}

GAME.vehicles = (function () {
  var world = GAME.world;
  var carRng = mulberry32(777);

  function spawnCar(type, x, z, heading, opts) {
    opts = opts || {};
    var spec = VEHICLES[type] || VEHICLES.sedan;
    var color = opts.color !== undefined ? opts.color : U.pick(carRng, spec.colors);
    var mesh = buildCarMesh(type, color);
    // Yaw first, then pitch and roll about the body's own axes. On the default
    // XYZ order the pitch is applied about the world X axis after the heading,
    // so a vehicle driving east or west got no pitch at all and sat flat while
    // the ramp climbed out from under its nose.
    if (!spec.heli && !spec.plane) mesh.rotation.order = 'YXZ';
    // aircraft rest on their gear, not on their bellies: a plane spawned at
    // raw ground level buried its wheels half a metre in the apron
    var restH = spec.plane ? (spec.wheelH || 1.1) : spec.heli ? 0.05 : 0;
    mesh.position.set(x, GAME.city.groundY(x, z) + restH, z);
    mesh.rotation.y = heading || 0;
    GAME.scene.add(mesh);
    var car = {
      kind: 'car',
      type: type, spec: spec, mesh: mesh,
      pos: mesh.position,
      heading: heading || 0,
      speed: 0, lat: 0,
      hp: spec.hp, stage: 0, dead: false, fireFuse: 0,
      occupied: opts.occupied || null,
      isPolice: type === 'police',
      controls: { throttle: 0, steer: 0, handbrake: false },
      ai: opts.ai || null,
      parkedSpot: opts.parkedSpot || null,
      mission: opts.mission || false,
      smokeT: 0, unstickT: 0, reverseT: 0,
      radius: spec.l * 0.42
    };
    // AI-ridden bikes get a visible rider (empty motorbikes look abandoned)
    if (spec.bike && car.occupied === 'ai') {
      var rider = buildBikeRider();
      mesh.add(rider);
      car.riderMesh = rider;
    }
    world.cars.push(car);
    return car;
  }

  function removeCar(car) {
    var i = world.cars.indexOf(car);
    if (i >= 0) world.cars.splice(i, 1);
    // said out loud, as a ped's `gone` is: a despawned car is not dead, and
    // anything still holding one (a stranger's grudge, a stolen-car chase, a
    // lock-on) must let go of it rather than keep chasing where it last stood
    car.gone = true;
    if (car.parkedSpot) car.parkedSpot.live = null;
    GAME.scene.remove(car.mesh);
    disposeTree(car.mesh);
  }

  function fwdX(car) { return Math.sin(car.heading); }
  function fwdZ(car) { return Math.cos(car.heading); }

  function surfaceGrip(car) {
    if (GAME.city.isOnSand(car.pos.x, car.pos.z)) return 0.45;
    return 1;
  }

  function stepPhysics(car, dt) {
    var c = car.controls, spec = car.spec;
    var surf = surfaceGrip(car);
    // booster strips slam the throttle open for a moment, so you leave the lip
    // far faster than you arrived. A bike is already the quickest thing on the
    // road and takes a smaller multiplier — giving it the same 3x a car gets
    // would fire it off the ramp at half again everything else.
    car.boostT = Math.max(0, (car.boostT || 0) - dt);
    car.hitCd = Math.max(0, (car.hitCd || 0) - dt);
    var boost = car.boostT > 0 ? (spec.bike ? 2 : 3) : 1;
    // a rival's rubber band (missions.js) moves what the car can DO rather
    // than what its driver asks for — they race the same machine you do, so
    // more pedal could only ever match your speed, never close on you
    var edge = car.raceEdge || 1;
    var maxSp = spec.maxSpeed * boost * (surf < 1 ? 0.55 : 1) * (car.spiked ? 0.55 : 1) * edge;
    var accel = spec.accel * boost * boost * (surf < 1 ? 0.6 : 1) * edge;
    if (car.stage >= 2) { maxSp *= 0.6; accel *= 0.5; }

    // Wheels off the ground, nothing to push against. The trajectory is the
    // one the lip gave you and the pedals stop mattering until you land: you
    // could brake in mid-jump, and — because a stunt jump pays by the metre —
    // hold the throttle to buy distance that was never earned on the ramp.
    // Tyres have nothing to grip either, so speed and slip are held rather
    // than left to drag and decay, which also keeps the steering authority you
    // took off with.
    //
    // The WHEEL still works. Spins are scored off heading (see jumpSpin
    // below), and you want to be able to straighten up before you land.
    var flying = car.airVX !== undefined;
    if (!flying) {
      if (c.throttle > 0) car.speed += accel * c.throttle * dt;
      else if (c.throttle < 0) {
        car.speed += (car.speed > 1 ? accel * 1.6 : accel * 0.6) * c.throttle * dt;
      }
      car.speed = U.clamp(car.speed, -maxSp * 0.4, maxSp);
      car.speed *= Math.exp(-0.25 * dt);
      // Rolling backwards with nobody asking for reverse is a shunt, not a
      // gear. The drag above models a coast — four seconds to shed 1/e — and
      // that is right for a car rolling forward off the throttle, but a car
      // shoved backwards has its wheels pointed the other way and the
      // drivetrain against it, so it comes to rest rather than cruising. Ask
      // for reverse and this stops applying; it only ever kills a push you
      // did not ask for.
      if (car.speed < 0 && c.throttle >= 0) car.speed *= Math.exp(-SHUNT_DRAG * dt);
      if (Math.abs(car.speed) < 0.06 && c.throttle === 0) car.speed = 0;
    }

    var steerFactor = Math.min(1, Math.abs(car.speed) / 7) / (1 + Math.abs(car.speed) * 0.022);
    var dir = car.speed < -0.5 ? -1 : 1;
    car.heading += c.steer * spec.turn * steerFactor * dir * dt;

    if (!flying) {
      var grip = spec.grip * surf * (c.handbrake ? 0.22 : 1) * (car.spiked ? 0.5 : 1);
      if (c.handbrake) car.speed *= Math.exp(-0.9 * dt);
      // lateral slip decays toward zero; handbrake keeps it alive for drifts
      var slip = c.steer * car.speed * 0.16 * (c.handbrake ? 2.4 : 1);
      car.lat = (car.lat + slip * dt * 8) * Math.exp(-grip * dt);
    }

    var fx = fwdX(car), fz = fwdZ(car);
    var sx = fz, sz = -fx;
    var vx = flying ? car.airVX : fx * car.speed + sx * car.lat;
    var vz = flying ? car.airVZ : fz * car.speed + sz * car.lat;
    car.vx = vx; car.vz = vz;
    car.pos.x += vx * dt;
    car.pos.z += vz * dt;

    // vertical: ride the ground (or a ramp deck / a roof you've landed on), and
    // go ballistic off a lip
    var gy = GAME.city.driveSurfaceY(car.pos.x, car.pos.z, car.pos.y);
    var ramp = GAME.city.rampAt(car.pos.x, car.pos.z);
    var wasAirborne = (car.air || 0) > 0.05;
    var stickTol = car.air ? 0.08 : 0.6;   // already flying? tight. On wheels? follow the road down.
    if (car.pos.y > gy + stickTol) {
      if (!car.air) {
        // the velocity the lip handed over, held until the wheels are back down
        car.airVX = vx; car.airVZ = vz;
        car.jumpX = car.pos.x; car.jumpZ = car.pos.z; car.jumpSpin = 0;
        // A stunt jump is EARNED at the lip: the launch only carries the
        // ramp's credit if the car left over the TOP edge, roughly along the
        // ramp's own direction, with real pace. Rolling off the SIDE of the
        // deck (or crawling over the lip) is a fall, not a jump.
        car.jumpRamp = null;
        if (car.onRampIdx !== null && car.onRampIdx !== undefined) {
          var jr = GAME.city.ramps[car.onRampIdx];
          var jsp = U.len(car.vx || 0, car.vz || 0);
          if (jr && jsp > 10) {
            var jux = Math.sin(jr.rot), juz = Math.cos(jr.rot);
            var jAlong = (car.pos.x - jr.x) * jux + (car.pos.z - jr.z) * juz;
            var jDot = ((car.vx || 0) * jux + (car.vz || 0) * juz) / jsp;
            if (jDot > 0.8 && jAlong > jr.len / 2 - 1.5) car.jumpRamp = car.onRampIdx;
          }
        }
      }
      car.jumpSpin = (car.jumpSpin || 0) + U.wrapPI(car.heading - (car.lastHeading || car.heading));
      car.vy = (car.vy || 0) - 24 * dt;
      car.pos.y += car.vy * dt;
      car.air = (car.air || 0) + dt;
      if (car.pos.y <= gy) {
        var impact = -(car.vy || 0);
        car.pos.y = gy; car.vy = 0;
        landStunt(car, impact);
      }
    } else {
      car.pos.y = gy;
      // on a ramp the deck itself drives the climb rate; carry that off the lip
      car.vy = ramp ? Math.max(0, car.speed) * ramp.slope : 0;
      car.onRampIdx = ramp ? ramp.idx : null;
      if (ramp && ramp.boost) {
        if (!car.boostT && !car.capPing && car === GAME.player.car && GAME.player.inCar) {
          GAME.audio.pickup();
          GAME.cameraShake = 0.35;
        }
        if (ramp.cap) {
          // the chain launcher: it accelerates you TO its speed, never past
          // it — the landing is a rooftop, and the rooftop is only so deep
          car.capPing = true;
          car.boostT = 0;
          car.speed = car.speed < ramp.cap ? Math.min(ramp.cap, car.speed + 80 * dt) : ramp.cap;
        } else {
          car.boostT = 1.4;
          car.speed = Math.max(car.speed, 12);   // a standing start still gets launched
        }
      } else car.capPing = false;
      if (car.air) landStunt(car, 0);
    }
    car.mesh.rotation.y = car.heading;
    // Pitch to the ground under the axles rather than to one point beneath the
    // middle. A centre-only slope reads flat until the middle crosses the lip
    // and then jumps to the full grade, and while the body eases into that the
    // nose is buried in the ramp — worst on the long vehicles. Sampling front
    // and rear means the body tips as it rides on, and once it is fully on the
    // ramp the chord is the ramp's own slope anyway.
    var wb = spec.l * 0.36;
    var fyF = GAME.city.driveSurfaceY(car.pos.x + fx * wb, car.pos.z + fz * wb, car.pos.y);
    var fyR = GAME.city.driveSurfaceY(car.pos.x - fx * wb, car.pos.z - fz * wb, car.pos.y);
    var chord = Math.atan2(fyF - fyR, wb * 2);
    // over the lip the front sample has already dropped past the ramp — hold
    // the nose up on the ramp's own grade until the wheels actually leave
    // negative pitches the nose up about the body's lateral axis
    var pitch = -(car.air > 0.05 ? U.clamp((car.vy || 0) * 0.035, -0.5, 0.5)
      : ramp ? Math.max(chord, Math.atan(ramp.slope)) : chord);
    // touching back down puts the wheels on the surface at once, so the body
    // takes the new grade immediately instead of easing out of its flight pose
    // and burying the nose in the ramp it just landed on
    var justLanded = wasAirborne && !((car.air || 0) > 0.05);
    // The angle above is the GROUND's — the grade under the wheels, or the
    // flight pose in the air — so it is tracked on its own rather than read
    // back off the mesh. What the body does ON TOP of it is load transfer,
    // and adding the two is what lets a car climbing a ramp still squat under
    // power instead of one angle overwriting the other.
    car.bodyPitch = justLanded || car.bodyPitch === undefined
      ? pitch : U.lerp(car.bodyPitch, pitch, Math.min(1, dt * 22));

    // Weight moves when speed does: open the throttle and it goes to the back
    // and the nose lifts, stand on the brakes and it goes to the front and the
    // nose dives. A spring rather than an ease, because the overshoot as it
    // settles is the part that reads as suspension and not as a slider —
    // about 1.9 Hz at a damping ratio near 0.7, so it is done in half a
    // second. Nothing loads the springs in mid-air, so the targets go to zero
    // there and the body simply hangs at its flight pose.
    var susp = car.susp || (car.susp = { p: 0, v: 0 });
    var airborne = (car.air || 0) > 0.05;
    var accel = (car.speed - (car.suspSpeed === undefined ? car.speed : car.suspSpeed)) / Math.max(dt, 1e-4);
    car.suspSpeed = car.speed;
    // bikes lean, they do not sit on a body that pitches on its springs, and
    // the rider code owns their attitude anyway
    var load = (airborne || spec.bike) ? 0 : U.clamp(-accel * 0.0045, -0.07, 0.07);
    susp.v += (-140 * (susp.p - load) - 16 * susp.v) * dt;
    susp.p += susp.v * dt;

    car.mesh.rotation.x = car.bodyPitch + susp.p;
    // Roll is left exactly as it was. Leaning out of a corner already exists
    // here — lateral slip IS the cornering load — and swapping its ease for a
    // spring would change how the car reads in a direction change without
    // adding anything the body was not already doing.
    car.mesh.rotation.z = U.lerp(car.mesh.rotation.z, -car.lat * 0.02, dt * 6);
    car.lastHeading = car.heading;

    collideStatic(car, dt);
    if (GAME.city.isInWater(car.pos.x, car.pos.z, car.pos.y)) sinkCar(car);
  }

  // a jump has ended: score it if the player pulled it off, and take the knock
  function landStunt(car, impact) {
    var airT = car.air || 0;
    car.air = 0;
    // Touching down, the held trajectory becomes the car's motion again, split
    // along wherever the body finished up pointing: what lines up with the nose
    // is speed, what does not is slip. Land straight and you keep everything;
    // land sideways and the difference is exactly the scrub that costs you.
    if (car.airVX !== undefined) {
      var lfx = Math.sin(car.heading), lfz = Math.cos(car.heading);
      car.speed = car.airVX * lfx + car.airVZ * lfz;
      car.lat = car.airVX * lfz - car.airVZ * lfx;
      car.airVX = car.airVZ = undefined;
    }
    var isPlayer = car === GAME.player.car && GAME.player.inCar;
    var earned = car.jumpRamp !== undefined && car.jumpRamp !== null;
    var dist = U.dist(car.pos.x, car.pos.z, car.jumpX || car.pos.x, car.jumpZ || car.pos.z);
    // earned, not stumbled into: rolling off the side of a ramp (or crawling
    // off the lip) is a fall — hang time alone doesn't pay, distance does
    if (isPlayer && airT > 0.45 && dist > 7) {
      var spins = Math.floor(Math.abs(car.jumpSpin || 0) / (Math.PI * 2));
      var cash = Math.round(airT * 120 + dist * 6 + spins * 400);
      var label = spins > 0 ? (spins > 1 ? spins + 'x SPIN!' : '360 SPIN!')
        : airT > 1.6 ? 'INSANE JUMP!' : airT > 1.0 ? 'BIG AIR!' : 'NICE JUMP!';
      GAME.addCash(cash);
      GAME.audio.sting('win');
      GAME.haptics.stunt();
      GAME.hud.message(label + '   ' + airT.toFixed(1) + 's · ' + Math.round(dist) + 'm · +$' + cash, 3);
      GAME.missions.notifyChaos(60);
      // a jump launched off one of the city's ramps also logs it as found
      if (car.jumpRamp !== undefined && car.jumpRamp !== null) GAME.stunts.credit(car.jumpRamp, airT, dist);
    }
    car.jumpSpin = 0; car.jumpRamp = null;
    // hard landings still hurt
    if (impact > 16) {
      damageCar(car, Math.min(40, (impact - 16) * 2.2), 'wall');
      GAME.audio.crash(Math.min(1, impact / 30), car.pos.x, car.pos.z);
      if (isPlayer) GAME.cameraShake = Math.min(1, impact / 26);
      // Wheels-down off a real ramp is a landing, not a crash: a jump earned
      // at the lip keeps its rider short of the truly catastrophic, however
      // hard the boost ramp threw them. Getting tossed is for FALLS — riding
      // off a roof or a cliff with no ramp under the launch — where coming
      // down at 24 m/s means a twelve-metre drop nobody aimed.
      var botched = earned ? impact > 34 : impact > 24;
      if (car.spec.bike && isPlayer && GAME.player.onBike && botched) GAME.ejectBike(impact);
    }
  }

  // How fast an unasked-for reverse dies (see the drive step): a shunt is not
  // a gear, so it decays on its own constant rather than the coasting one.
  var SHUNT_DRAG = 2.2;

  // What comes back off a wall: the same share of the closing speed as ever,
  // but never more than MAX_BOUNCE of it.
  //
  // There is deliberately no friction term along the face, and two things
  // were tried and dropped. A Coulomb scrub on the tangent took a 24 m/s pass
  // five degrees off the face from the 2.1 m/s it survives with on the old
  // code down to 0.35 — stickier than this game has ever been, and nobody's
  // complaint. Holding SHUNT_DRAG off while a car is still touching (on the
  // theory that a scrape oscillates car.speed through zero and each dip gets
  // damped) recovered only 0.9 -> 1.1 of that 2.1, which is not what it
  // claimed to do. All three land in the same place anyway: grind a wall for
  // a second at 24 m/s and you have stopped, before this change and after it.
  // The reversing AWAY from the wall is the part that was wrong.
  var REST_WALL = 0.4, MAX_BOUNCE = 3.5;

  function collideStatic(car, dt) {
    var fx = fwdX(car), fz = fwdZ(car);
    var sxv = fz, szv = -fx;
    var hl = car.spec.l / 2 - 0.2, hw = car.spec.w / 2;
    // Exact body-vs-box overlap (separating axes: world X/Z + the car's own),
    // not sample points. Sampling always had gaps: a thin post could pass
    // between samples, and a BUILDING CORNER could poke through the body
    // between two of them — you could clip through the corner of a block.
    var boxes = GAME.city.hash.query(car.pos.x, car.pos.z, car.spec.l);
    if (!boxes.length) return;
    var afx = Math.abs(fx), afz = Math.abs(fz);
    for (var bi = 0; bi < boxes.length; bi++) {
      var b = boxes[bi];
      // Jumped clear of it — or STANDING ON it. A car parked on a roof sits
      // at exactly the box's top, and the old `top < y - 0.3` test still
      // counted the building as a wall — the collider shoved any car that
      // landed on a roof straight off the edge, which is why the rooftop leg
      // of the chain jump never held. Same rule the on-foot check uses.
      if (b.h !== undefined && b.h <= car.pos.y + 0.3) continue;
      // and don't clip a car driving under one: a bridge parapet belongs to
      // the deck it stands on, not to the road it crosses over
      if (b.minY !== undefined && car.pos.y < b.minY - 1) continue;
      var bcx = (b.minX + b.maxX) / 2, bcz = (b.minZ + b.maxZ) / 2;
      var bhx = (b.maxX - b.minX) / 2, bhz = (b.maxZ - b.minZ) / 2;
      var dxc = car.pos.x - bcx, dzc = car.pos.z - bcz;
      var oX = (afx * hl + Math.abs(sxv) * hw) + bhx - Math.abs(dxc);
      if (oX <= 0) continue;
      var oZ = (afz * hl + Math.abs(szv) * hw) + bhz - Math.abs(dzc);
      if (oZ <= 0) continue;
      var dF = dxc * fx + dzc * fz;
      var oF = hl + (bhx * afx + bhz * afz) - Math.abs(dF);
      if (oF <= 0) continue;
      var dS = dxc * sxv + dzc * szv;
      var oS = hw + (bhx * Math.abs(sxv) + bhz * Math.abs(szv)) - Math.abs(dS);
      if (oS <= 0) continue;
      // overlapping on every axis: push out along the least-overlap axis
      var m = Math.min(oX, oZ, oF, oS);
      var nx, nz;
      if (m === oX) { nx = dxc >= 0 ? 1 : -1; nz = 0; }
      else if (m === oZ) { nx = 0; nz = dzc >= 0 ? 1 : -1; }
      else if (m === oF) { var sf = dF >= 0 ? 1 : -1; nx = fx * sf; nz = fz * sf; }
      else { var ss = dS >= 0 ? 1 : -1; nx = sxv * ss; nz = szv * ss; }
      car.pos.x += nx * m; car.pos.z += nz * m;
      var impact = Math.abs(car.vx * nx + car.vz * nz);
      var vn = car.vx * nx + car.vz * nz;
      if (vn < 0) {
        // Come off the wall, but not with a running start.
        //
        // The rebound used to be pure proportion — 40% of the closing speed,
        // however fast you arrived — and nothing ever took it back off you:
        // it was decomposed straight into car.speed and left to a drag with a
        // four-second time constant. Measured, a 26 m/s hit rebounded at
        // 7.6 m/s, reversed 21 metres and was still rolling backwards at
        // 2.3 m/s six seconds later. That is not a bounce, it is a reverse
        // gear you did not select.
        //
        // The share is unchanged, so a nudge at walking pace comes off the
        // wall exactly as it always did. What is new is a CEILING on it: a
        // hull crumples, and past about 9 m/s of closing speed the extra goes
        // into the bodywork rather than back into the car. What kills what is
        // left is SHUNT_DRAG, up in the drive step — the two go together, and
        // neither is much use without the other.
        var close = -vn;
        var tx = car.vx - nx * vn, tz = car.vz - nz * vn;      // along the face
        var out = Math.min(close * REST_WALL, MAX_BOUNCE);
        car.vx = tx + nx * out; car.vz = tz + nz * out;
        // decompose back into speed/lat
        car.speed = car.vx * fx + car.vz * fz;
        car.lat = car.vx * fz + car.vz * -fx;
      }
      // one event per contact: a car grinding along a wall reports a hit
      // every frame, which both shreds its health and machine-guns the
      // crash sound until it works free
      if (impact > 4 && (car.hitCd || 0) <= 0) {
        car.hitCd = 0.25;
        damageCar(car, Math.min(32, impact * 1.5), 'wall');
        GAME.audio.crash(impact / 18, car.pos.x, car.pos.z);
        GAME.fx.spawn(car.pos.x + nx, car.pos.y + 0.7, car.pos.z + nz, { count: 5, color: 0xffd890, spread: 3, life: 0.4, grav: -4 });
        if (car === GAME.player.car) GAME.cameraShake = Math.min(1, impact / 16);
        // riders get thrown off in a hard wall hit
        if (car.spec.bike && car === GAME.player.car && GAME.player.onBike && impact > 9) {
          GAME.ejectBike(impact);
        }
      }
      return;
    }
  }

  // Get the driver out from behind the wheel and leave the car standing. The
  // same person every time — lastDriver remembers the face and the temper —
  // so the man who got out to argue about a dent is the man who was driving.
  function ejectDriver(car) {
    if (!car || car.dead || car.occupied !== 'ai' || car.isPolice) return null;
    var side = car.heading + Math.PI / 2;
    var stepOut = car.spec.w / 2 + 1;      // clear of his own car's flank
    var d = GAME.peds.spawnPed(car.pos.x + Math.sin(side) * stepOut, car.pos.z + Math.cos(side) * stepOut,
      car.lastDriver ? { look: car.lastDriver } : undefined);
    if (!d) return null;
    if (car.lastDriver) d.temper = car.lastDriver.temper;
    else car.lastDriver = { shirt: d.look.shirt, pants: d.look.pants, skin: d.look.skin,
      hair: d.look.hair, hairCol: d.look.hairCol, temper: d.temper };
    car.occupied = null;
    car.ai = null;
    car.controls = { throttle: 0, steer: 0, handbrake: true };
    car.speed = 0; car.lat = 0;
    if (car.riderMesh) { car.mesh.remove(car.riderMesh); disposeTree(car.riderMesh); car.riderMesh = null; }
    // a flag, not the car: holding the car here kept a despawned car's whole
    // object graph alive for as long as its old driver walked about
    d.leftCar = true;
    return d;
  }

  function collideCars(dt) {
    var cars = world.cars;
    for (var i = 0; i < cars.length; i++) {
      var a = cars[i];
      var aAir = !!(a.spec.heli || a.spec.plane);
      for (var j = i + 1; j < cars.length; j++) {
        var b = cars[j];
        var bAir = !!(b.spec.heli || b.spec.plane);
        // two airframes are each other's business, and nobody else's
        if (aAir && bAir) continue;
        // one of them is up on a roof and the other at street level — they
        // pass each other, they don't crash
        if (Math.abs(a.pos.y - b.pos.y) > 3) continue;
        var dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z;
        var rr = a.radius + b.radius;
        var d2 = dx * dx + dz * dz;
        if (d2 > rr * rr || d2 < 0.0001) continue;
        var d = Math.sqrt(d2), nx = dx / d, nz = dz / d;
        var overlap = rr - d;
        // A parked airframe is a solid thing to drive into.
        //
        // Aircraft used to be skipped here outright, so a helicopter setting
        // down would not bulldoze the street it landed on — but skipping them
        // meant traffic drove straight THROUGH one, and the Alta Verde summit
        // road ends at a helipad with a helicopter standing on it. Cars went
        // in one side and out the other, all afternoon.
        //
        // Mixed pairs resolve ONE WAY instead: the car is pushed clear, the
        // airframe never moves. That keeps the reason the skip existed — an
        // aircraft still shoves nothing — while making it something you stop
        // against. It also takes no damage from being bumped: traffic nudging
        // a parked helicopter for long enough should not eventually blow it up
        // and leave a wreck on the pad.
        if (aAir || bAir) {
          var ground = aAir ? b : a;
          var sign = aAir ? 1 : -1;   // push the car away from the airframe
          ground.pos.x += nx * overlap * sign;
          ground.pos.z += nz * overlap * sign;
          var gv = ((ground.vx || 0) * nx + (ground.vz || 0) * nz) * sign;
          if (gv < 0) {
            ground.speed *= 0.3; ground.lat *= 0.3;
            if ((ground.hitCd || 0) <= 0 && -gv > 3) {
              ground.hitCd = 0.25;
              damageCar(ground, Math.min(20, -gv * 1.1), 'wall');
              GAME.audio.crash(Math.min(1, -gv / 20), ground.pos.x, ground.pos.z);
            }
          }
          continue;
        }
        a.pos.x -= nx * overlap / 2; a.pos.z -= nz * overlap / 2;
        b.pos.x += nx * overlap / 2; b.pos.z += nz * overlap / 2;
        var avx = a.vx || 0, avz = a.vz || 0, bvx = b.vx || 0, bvz = b.vz || 0;
        var rel = (avx - bvx) * nx + (avz - bvz) * nz;
        if (rel > 3 && (a.hitCd || 0) <= 0 && (b.hitCd || 0) <= 0) {
          a.hitCd = 0.25; b.hitCd = 0.25;
          var dmg = Math.min(26, rel * 1.3);
          damageCar(a, dmg * 0.6, b); damageCar(b, dmg * 0.6, a);
          GAME.audio.crash(rel / 20, (a.pos.x + b.pos.x) / 2, (a.pos.z + b.pos.z) / 2);
          GAME.fx.spawn((a.pos.x + b.pos.x) / 2, (a.pos.y + b.pos.y) / 2 + 0.8, (a.pos.z + b.pos.z) / 2, { count: 6, color: 0xffe0a0, spread: 3, life: 0.35 });
          if (a === GAME.player.car || b === GAME.player.car) GAME.cameraShake = Math.min(1, rel / 18);
          var pc = GAME.player.car;
          if ((a === pc || b === pc) && rel > 6) {
            var other = a === pc ? b : a;
            // a mission rival in a cruiser is a racer, not the law
            if (other.isPolice && !other.mission) GAME.police.reportCrime('hit_cop_car', pc.pos);
            else if (other.ai && other.ai.mode === 'traffic') GAME.police.reportCrime('hit_car', pc.pos);
          }
        }
        // Somebody gets out about it. A shunt between two strangers used to be
        // a noise and a dent and nothing else — no horn, no words, both cars
        // driving on as if metal meeting metal were weather. Now the one who
        // was hit can stop, get out, and go and have it out with the other
        // driver, which is the version of this that happens where the player
        // is actually looking rather than somewhere behind them.
        if (rel > 7 && GAME.chaos.nearPlayer(a.pos.x, a.pos.z, 60) &&
          GAME.chaos.roll(GAME.chaos.reactChance * 0.8) &&
          a.occupied === 'ai' && b.occupied === 'ai' && !a.isPolice && !b.isPolice &&
          !a.mission && !b.mission) {
          // whoever was hit from behind or the side is the aggrieved party
          var hitFirst = (avx * nx + avz * nz) > 0 ? b : a;   // a drove into b
          var other = hitFirst === a ? b : a;
          var out = ejectDriver(hitFirst);
          if (out) {
            out.temper = Math.max(out.temper || 0, 0.6);
            GAME.peds.startFight(out, { kind: 'car', car: other }, 14);
          }
        }
        // transfer momentum crudely
        var push = rel > 0 ? rel * 0.35 : 0;
        a.speed -= push * (nx * fwdX(a) + nz * fwdZ(a)) * 0.5;
        b.speed += push * (nx * fwdX(b) + nz * fwdZ(b)) * 0.5;
      }
    }
  }

  function damageCar(car, amt, source, byPlayer) {
    if (car.dead) return;
    var pc = GAME.player.car;
    // remember if the player is responsible, so a delayed burn-out still counts
    if (byPlayer || source === 'gun' || source === 'fist' ||
      (source === pc && pc && Math.abs(pc.speed) > 9)) car.byPlayer = true;
    car.hp -= amt;
    if (car.hp < car.spec.hp * 0.35 && car.stage < 1) car.stage = 1;
    if (car.hp < car.spec.hp * 0.14 && car.stage < 2) { car.stage = 2; car.fireFuse = 5.5; }
    // The hull tells its driver out loud. Scraping uphill through the grass
    // (or grinding a wall you can barely see) shreds hp with no single big
    // crash, and the first the player knew was waking up in hospital — the
    // fire fuse detonated a car they never realized was dying. Threshold
    // crossings now announce themselves, the way the aircraft already do.
    if (car === pc && GAME.player.inCar) {
      // The fire is news for every hull, aircraft included: the airframe
      // warnings say "damaged", never "burning", so a fuse lit under a
      // landed heli used to burn in silence — and the blast a second after
      // stepping out was a death nobody saw coming.
      if (car.stage >= 2 && car.stageWarn !== 2) {
        car.stageWarn = 2;
        GAME.hud.message('YOUR RIDE IS ON FIRE — get out before it blows!', 4);
        GAME.audio.sting('busted');
        GAME.haptics.onFire();
      } else if (car.stage === 1 && !car.stageWarn && !car.spec.heli && !car.spec.plane) {
        car.stageWarn = 1;
        GAME.hud.message('Your ride is smoking — it won\'t take much more.', 3);
        GAME.haptics.smoking();
      }
    }
    if (car.hp <= 0) {
      // The ride the player is sitting in never detonates out of nowhere: a
      // killing blow leaves it at a sliver, IN FLAMES, and the explosion a
      // breath later is what kills — visibly — instead of a ledger hitting
      // zero mid-smoke. (One last chance to bail, the way the fire stage
      // always promised.) Everyone else's cars still go up on the spot.
      if (car === pc && GAME.player.inCar) {
        car.hp = 1;
        car.fireFuse = car.stage >= 2 && car.fireFuse > 0 ? Math.min(car.fireFuse, 1.2) : 1.2;
        car.stage = 2;
        if (car.stageWarn !== 2) {
          car.stageWarn = 2;
          GAME.hud.message('YOUR RIDE IS ON FIRE — get out before it blows!', 4);
          GAME.audio.sting('busted');
          GAME.haptics.onFire();
        }
      } else explodeCar(car, source, car.byPlayer);
    }
  }

  function explodeCar(car, source, byPlayerIn) {
    if (car.dead) return;
    car.dead = true; car.stage = 3;
    // player-caused if this blast (or the damage that led to it) traces to the player
    var byPlayer = !!(byPlayerIn || car.byPlayer);
    GAME.audio.explosion(car.pos.x, car.pos.z);
    // the blast happens where the CAR is — at world height 1.5 a car
    // exploding on a bridge deck flashed under the roadway, unseen
    GAME.fx.flash(car.pos.x, car.pos.y + 1.5, car.pos.z, 9);
    GAME.fx.spawn(car.pos.x, car.pos.y + 1.2, car.pos.z, { count: 30, color: 0xff9030, spread: 7, vy: 5, life: 1.1, grav: -3 });
    GAME.fx.spawn(car.pos.x, car.pos.y + 1.5, car.pos.z, { count: 20, color: 0x333333, spread: 4, vy: 4, life: 1.6, grav: -0.5 });
    var oldMat = car.mesh.userData.bodyMesh.material;
    // the charred coat is the same for every wreck, so it is shared too
    car.mesh.userData.bodyMesh.material = sharedLambert(0x1a1a1a);
    // the body material is usually the SHARED vertex-color workhorse now —
    // disposing it here tore down the material every living car was wearing
    // (three quietly rebuilds it next frame, at the cost of a hitch and the
    // pooling win). Only a private material may be freed.
    if (oldMat && oldMat.dispose && !(oldMat.userData && oldMat.userData.shared)) oldMat.dispose();
    if (car.mesh.userData.lightbar) car.mesh.userData.lightbar.forEach(function (m) { m.visible = false; });
    car.speed *= 0.2;
    // area damage
    var p = GAME.player;
    // Felt further than it hurts, which is the point: the damage radius below
    // is 8 m, and a wreck going up thirty metres away is still the loudest
    // physical thing in the street. Gated on the player being alive so a
    // cascade under the wasted screen cannot buzz a corpse.
    if (p.state === 'alive') {
      var bd = U.dist2(p.pos.x, p.pos.z, car.pos.x, car.pos.z);
      var bdy = Math.abs(p.pos.y - car.pos.y);
      if (p.inCar && p.car === car) GAME.haptics.blast(1);
      else if (bd < 900 && bdy < 12) GAME.haptics.blast(1 - Math.sqrt(bd) / 30);
    }
    if (!p.inCar || p.car !== car) {
      // altitude counts: a wreck going up underneath you shouldn't catch you
      // while you're hanging off a parachute or standing on a roof
      var dy = Math.abs(p.pos.y - car.pos.y);
      var dd = U.dist2(p.pos.x, p.pos.z, car.pos.x, car.pos.z);
      // the blast fades with distance: standing over it is nearly fatal, and
      // every step away is worth something — a flat 55 made "walked clear of
      // the wreck" and "stood in the fireball" the same wound
      if (dd < 64 && dy < 7) GAME.playerDamage(Math.round(75 - Math.sqrt(dd) * 6.8), 'explosion');
    }
    if (p.car === car) GAME.playerDamage(200, 'explosion');
    world.peds.forEach(function (ped) {
      if (!ped.dead && U.dist2(ped.pos.x, ped.pos.z, car.pos.x, car.pos.z) < 55) GAME.peds.kill(ped, 'explosion', byPlayer);
    });
    // And everyone else runs. An explosion is the loudest thing that happens
    // in this city and until now nobody looked up: the only scattering was
    // indirect, because kill() panics a 26 m circle — so a blast that happened
    // to catch somebody got a reaction, and one that caught nobody got none at
    // all. It is felt far past where it hurts (the damage radius is 8 m), and
    // an airframe going up is bigger again.
    //
    // Not rated by GAME.chaos. Running from a fireball is not the city picking
    // fights with itself, it is what anybody would do, and it belongs at every
    // setting including OFF.
    var wide = (car.spec.plane || car.spec.heli) ? 85 : 55;
    GAME.peds.panic(car.pos.x, car.pos.z, wide, true);
    world.cars.forEach(function (c2) {
      if (c2 !== car && !c2.dead && U.dist2(c2.pos.x, c2.pos.z, car.pos.x, car.pos.z) < 60) damageCar(c2, 40, 'explosion', byPlayer);
    });
    if (car.isPolice && byPlayer) GAME.police.reportCrime('kill_cop', car.pos);
    if (car.occupied === 'ai') car.occupied = null;
    GAME.missions.notifyChaos(500);
  }

  function sinkCar(car) {
    if (car.sinking) return;
    car.sinking = true;
    GAME.audio.splash();
    GAME.fx.spawn(car.pos.x, 0.5, car.pos.z, { count: 14, color: 0x88bbdd, spread: 3, vy: 3, life: 0.8 });
    if (car === GAME.player.car) GAME.playerDrown();
    else setTimeout(function () { removeCar(car); }, 900);
  }

  // ---------- traffic AI ----------
  // keep right of the direction of travel
  function setLane(ai, mx, mz) {
    var ml = Math.sqrt(mx * mx + mz * mz) || 1;
    ai.laneX = (mz / ml) * 3.1;
    ai.laneZ = (-mx / ml) * 3.1;
  }

  // Controls are written into the object they will be read from — the car's
  // own, unless the caller hands another — never returned new: every AI car
  // asks for them every tick, and a fresh object per ask was most of a
  // thousand small allocations a second in ordinary traffic.
  function setControls(c, throttle, steer, handbrake) {
    c.throttle = throttle; c.steer = steer; c.handbrake = handbrake;
    return c;
  }
  function trafficControls(car, dt, out) {
    out = out || car.controls;
    var ai = car.ai;
    var city = GAME.city;
    if (!ai.node) {
      ai.node = city.nearestNode(car.pos.x, car.pos.z);
      ai.prev = null;
      // Take a lane straight away, off the way the car is already pointing.
      //
      // The offset below is only worked out on ARRIVAL at a node, when the
      // next one is chosen — and every driver starts life with laneX/laneZ at
      // zero, so the whole first segment was driven at the centreline. That is
      // not a rare state: it is every car the spawner puts down, every cruiser
      // standing down after a chase, every owner taking their car back, every
      // mission car handed to traffic. A quarter of the moving traffic was
      // aiming down the middle of the road at any moment.
      //
      // Heading is the right thing to read it from: a car is put on the road
      // pointing along it, so where its nose is IS its direction of travel
      // before it has been anywhere.
      setLane(ai, Math.sin(car.heading), Math.cos(car.heading));
    }
    var tx = ai.node.x + ai.laneX, tz = ai.node.z + ai.laneZ;
    var dx = tx - car.pos.x, dz = tz - car.pos.z;
    var distN = Math.sqrt(dx * dx + dz * dz);
    if (distN < 6) {
      // a closed bridge is closed to traffic too: while the channel gates are
      // down, span nodes don't exist as far as a wandering car cares — else
      // it turned onto the approach and nosed into the police line forever
      var gated = GAME.isla && !GAME.isla.isOpen();
      var nbs = city.neighbors(ai.node).filter(function (n) { return n !== ai.prev && !(gated && n.span); });
      if (!nbs.length) nbs = [ai.prev];
      // Follow the road by ANGLE, not by coordinate sign: the old straight
      // test compared signs, which only means "straight" on the grid — on
      // the island's curves it failed at nearly every node and traffic took
      // a random exit each time, swerving between cross-linked lanes and
      // U-turning mid-road. Score each neighbour by the heading change it
      // asks for, follow the smallest, and only sometimes take a real fork.
      var hx = ai.prev ? ai.node.x - ai.prev.x : Math.sin(car.heading);
      var hz = ai.prev ? ai.node.z - ai.prev.z : Math.cos(car.heading);
      var hl = Math.sqrt(hx * hx + hz * hz) || 1; hx /= hl; hz /= hl;
      var scored = nbs.map(function (n) {
        var vx = n.x - ai.node.x, vz = n.z - ai.node.z;
        var vl = Math.sqrt(vx * vx + vz * vz) || 1;
        return { n: n, turn: Math.acos(U.clamp((vx * hx + vz * hz) / vl, -1, 1)) };
      }).sort(function (a, b) { return a.turn - b.turn; });
      // a near-U-turn is only for the cornered (dead ends)
      var options = scored.filter(function (s) { return s.turn < 2.4; });
      var next;
      if (!options.length) next = scored[0].n;
      else if (options.length > 1 && Math.random() < 0.25) {
        next = options[1 + Math.floor(Math.random() * (options.length - 1))].n;
      } else next = options[0].n;
      ai.prev = ai.node; ai.node = next;
      setLane(ai, next.x - ai.prev.x, next.z - ai.prev.z);
      tx = ai.node.x + ai.laneX; tz = ai.node.z + ai.laneZ;
      dx = tx - car.pos.x; dz = tz - car.pos.z;
    }
    var targetH = Math.atan2(dx, dz);
    var dh = U.wrapPI(targetH - car.heading);
    var steer = U.clamp(dh * 2.2, -1, 1);

    // wedged against something: back out
    if (Math.abs(car.speed) < 0.8 && distN > 8) car.unstickT += dt; else car.unstickT = 0;
    if (car.unstickT > 1.6) { car.reverseT = 1.1; car.unstickT = 0; }
    if (car.reverseT > 0) {
      car.reverseT -= dt;
      return setControls(out, -0.8, dh > 0 ? -1 : 1, false);
    }

    var desired = ai.desired || 11;
    // a bend is not a straight: ease off in proportion to how hard the
    // wheel is over, so hairpins are taken at hairpin speed instead of
    // overshot onto the grass
    var bend = Math.min(1, Math.abs(dh) / 1.1);
    desired = Math.max(3.5, desired * (1 - bend * 0.65));
    // brake for things ahead
    var fx = fwdX(car), fz = fwdZ(car);
    var lookA = 5 + car.speed * 0.8;
    var ax = car.pos.x + fx * lookA, az = car.pos.z + fz * lookA;
    var blocked = false, hard = false;
    var cars = world.cars;
    for (var i = 0; i < cars.length; i++) {
      var o = cars[i];
      if (o === car) continue;
      if (Math.abs(o.pos.y - car.pos.y) > 3) continue;   // not on the same level
      var odx = o.pos.x - car.pos.x, odz = o.pos.z - car.pos.z;
      var fd = odx * fx + odz * fz;
      if (fd < 1 || fd > lookA + 3) continue;
      var side = Math.abs(odx * fz - odz * fx);
      if (side < 2.6) { blocked = true; if (fd < 7) hard = true; }
    }
    var P = GAME.player;
    if (!P.inCar && Math.abs(P.pos.y - car.pos.y) < 3) {
      var pdx = P.pos.x - car.pos.x, pdz = P.pos.z - car.pos.z;
      var pfd = pdx * fx + pdz * fz;
      if (pfd > 0 && pfd < lookA + 2 && Math.abs(pdx * fz - pdz * fx) < 2.4) { blocked = true; if (pfd < 6) hard = true; }
    }
    var peds = world.peds;
    for (var pi = 0; pi < peds.length; pi++) {
      var pd = peds[pi];
      if (pd.dead) continue;
      if (Math.abs(pd.pos.y - car.pos.y) > 3) continue;   // not on the same level
      var qdx = pd.pos.x - car.pos.x, qdz = pd.pos.z - car.pos.z;
      var qfd = qdx * fx + qdz * fz;
      if (qfd > 0 && qfd < lookA && Math.abs(qdx * fz - qdz * fx) < 2.2) { blocked = true; if (qfd < 6) hard = true; }
    }
    var throttle;
    if (hard) throttle = car.speed > 0.5 ? -1 : 0;
    else if (blocked) throttle = car.speed > desired * 0.4 ? -0.4 : 0.15;
    else throttle = car.speed < desired ? 0.55 : 0;
    return setControls(out, throttle, steer, false);
  }

  function spawnTraffic() {
    var fc = GAME.focus();
    var live = 0;
    for (var i = 0; i < world.cars.length; i++) {
      if (world.cars[i].ai && world.cars[i].ai.mode === 'traffic') live++;
    }
    var maxT = GAME.perf.budget(GAME.settings.maxTraffic);
    if (live >= maxT) return;
    var city = GAME.city;
    for (var tries = 0; tries < 6 && live < maxT; tries++) {
      var ang = Math.random() * Math.PI * 2;
      var r = U.randRange(Math.random, 80, GAME.settings.bubbleRadius);
      var x = fc.x + Math.cos(ang) * r, z = fc.z + Math.sin(ang) * r;
      var rp = city.nearestRoadPoint(x, z);
      var onIsla = rp.axis === 'net';
      if (!onIsla && (rp.x < -480 || rp.x > 352 || Math.abs(rp.z) > 480)) continue;
      if (city.inAirport(rp.x, rp.z)) continue; // keep the airfield clear
      if (rp.kind === 'local') continue;        // no through traffic down a cul-de-sac
      // avoid spawning on top of others
      var clear = true;
      for (var c = 0; c < world.cars.length; c++) {
        if (U.dist2(world.cars[c].pos.x, world.cars[c].pos.z, rp.x, rp.z) < 100) { clear = false; break; }
      }
      if (!clear) continue;
      // the island runs a different mix, so crossing a bridge changes the
      // traffic around you as well as the scenery
      var types = onIsla
        ? ['sedan', 'buggy', 'pickup', 'van', 'sports', 'limo', 'motorcycle']
        : ['sedan', 'sedan', 'taxi', 'sports', 'van', 'motorcycle'];
      var type = types[Math.floor(Math.random() * types.length)];
      var heading = onIsla ? rp.heading + (Math.random() < 0.5 ? 0 : Math.PI)
        : rp.axis === 'z' ? (Math.random() < 0.5 ? 0 : Math.PI) : (Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
      var car = spawnCar(type, rp.x, rp.z, heading, { occupied: 'ai', ai: { mode: 'traffic', desired: U.randRange(Math.random, 9, 13), laneX: 0, laneZ: 0 } });
      car.speed = 6;
      live++;
    }
  }

  function spawnParked() {
    var fc = GAME.focus();
    var P = GAME.player;
    var spots = GAME.city.parkedSpots;
    var maxParked = GAME.perf.budget(GAME.settings.maxParked);
    var live = 0;
    for (var i = 0; i < spots.length; i++) if (spots[i].live) live++;
    for (var s = 0; s < spots.length; s++) {
      var sp = spots[s];
      var d2 = U.dist2(sp.x, sp.z, fc.x, fc.z);
      // special vehicles (police/ambulance/bikes/aircraft) are guaranteed near their
      // spot — no distance floor, larger spawn range, and exempt from the parked cap
      var special = sp.police || sp.vtype;
      if (!special && GAME.city.inAirport(sp.x, sp.z)) continue; // no random cars on the airfield
      // Don't restock the spot the player's CURRENT vehicle was taken from —
      // or is halfway through the door of (the spot is freed the moment
      // boarding starts, and during the walk-to-the-seat beat the player
      // still counts as on foot; the helipad used to restock itself in that
      // half-second, dropping a second helicopter on the first). Matching by
      // TYPE was too broad: flying your own bought helicopter past the tower
      // pad kept the tower's find hidden the whole time.
      var pcar = (P.inCar && P.car) || (P.entering && P.entering.car) || null;
      if (sp.vtype && !sp.live && pcar && pcar.fromSpot === sp) continue;
      var minD = special ? 0 : 40 * 40;
      // a spot can ask to exist at longer range: the helipad finds sit on
      // towers and summits you can see from half the map, and an empty pad
      // at that distance reads as "there is no helicopter in this game"
      var range = sp.range || (special ? 210 : 140);
      var despawnR = sp.despawn || (special ? 260 : 190);
      if (!sp.live && (special || live < maxParked) && d2 < range * range && d2 >= minD) {
        var clear = true;
        // The check is height-aware — street traffic far below a rooftop pad
        // must not block it — but it has to measure against the spot's OWN
        // level. A spot with no explicit y (its height IS the terrain, like
        // the Alta Verde helipad on its summit) used to compare against sea
        // level, so nothing actually standing on it ever counted as blocking.
        var spY = sp.y !== undefined ? sp.y : GAME.city.groundY(sp.x, sp.z);
        for (var c = 0; c < world.cars.length; c++) {
          if (U.dist2(world.cars[c].pos.x, world.cars[c].pos.z, sp.x, sp.z) < 60 &&
            Math.abs(world.cars[c].pos.y - spY) < 6) { clear = false; break; }
        }
        if (!clear) continue;
        var types = sp.isla ? ['sedan', 'buggy', 'pickup', 'van', 'limo', 'sports']
          : ['sedan', 'sports', 'taxi', 'van', 'sedan'];
        var type = sp.police ? 'police' : (sp.vtype || types[Math.floor(Math.random() * types.length)]);
        // special vehicles keep their exact heading; ordinary parked cars flip randomly
        var head = special ? sp.heading : sp.heading + (Math.random() < 0.5 ? 0 : Math.PI);
        var car = spawnCar(type, sp.x, sp.z, head, { parkedSpot: sp, ai: { mode: 'parked' } });
        if (sp.y !== undefined) car.pos.y = sp.y;   // a spot up on a roof
        // remember the origin for the restock guard: parkedSpot is unbound
        // the moment the player boards, but where it CAME from doesn't change
        car.fromSpot = sp;
        sp.live = car;
        live++;
      } else if (sp.live && d2 > despawnR * despawnR && sp.live !== GAME.player.car && !sp.live.dead) {
        removeCar(sp.live);
      }
    }
  }

  // Emitters that fire every tick — a wreck smoulders, a fire burns — hand
  // fx.spawn the same settings each time, so they are made once here rather
  // than as a fresh object per car per tick. fx.spawn only reads them.
  var FX_WRECK_SMOKE = { count: 1, color: 0x222222, spread: 0.5, vy: 1.5, life: 1.4, grav: 0.2 };
  var FX_FLAME = { count: 3, color: 0xff7020, spread: 0.8, vy: 2.6, life: 0.35, grav: 1.5 };
  var FX_FLAME_CORE = { count: 2, color: 0xffc040, spread: 0.5, vy: 3.2, life: 0.25, grav: 1.5 };
  var FX_FIRE_SMOKE = { count: 2, color: 0x2a2a2e, spread: 0.7, vy: 2.4, life: 1.3, grav: 0.6 };
  var FX_ENGINE_SMOKE = { count: 3, color: 0x555560, spread: 0.7, vy: 2.2, life: 1.0, grav: 0.5 };
  function update(dt) {
    var P = GAME.player;
    var fc = GAME.focus();
    var cars = world.cars;
    for (var i = cars.length - 1; i >= 0; i--) {
      var car = cars[i];
      // despawn far traffic
      if (car.ai && car.ai.mode === 'traffic' && !car.mission) {
        if (U.dist2(car.pos.x, car.pos.z, fc.x, fc.z) > 200 * 200) { removeCar(car); continue; }
      }
      // abandoned rides don't pile up forever: anything ownerless, off-duty
      // and out of sight for long enough is towed. Parked-spot cars have
      // their own lifecycle, and the garage replaces anything you bought.
      if (!car.ai && !car.parkedSpot && !car.mission && car.occupied !== 'player' && car !== P.car && !car.dead) {
        if (U.dist2(car.pos.x, car.pos.z, fc.x, fc.z) > 280 * 280) {
          car.abandonT = (car.abandonT || 0) + dt;
          if (car.abandonT > 18) { removeCar(car); continue; }
        } else car.abandonT = 0;
      }
      if (car.dead) {
        if (!car.deadT) car.deadT = 0;
        car.deadT += dt;
        GAME.fx.spawn(car.pos.x, car.pos.y + 1.2, car.pos.z, FX_WRECK_SMOKE);
        if (car.deadT > 14 && car !== P.car) { removeCar(car); continue; }
        continue;
      }
      if (car.stage >= 1) {
        car.smokeT -= dt;
        if (car.smokeT <= 0) {
          // Burning reads like burning, wherever the car is. The emitter
          // used to sit at WORLD height 1 m — a taxi cooking off on a bridge
          // deck pushed its smoke and flames out nine metres BELOW the road,
          // so the first visible sign of the fire was the detonation. And a
          // stage-2 "fire" was two faint dots: it's a real blaze now —
          // flames at the engine, black smoke rolling off, a flickering glow.
          var bnY = car.pos.y + 1.0;
          var bnX = car.pos.x + fwdX(car) * 1.4, bnZ = car.pos.z + fwdZ(car) * 1.4;
          if (car.stage >= 2) {
            car.smokeT = 0.09;
            GAME.fx.spawn(bnX, bnY, bnZ, FX_FLAME);
            GAME.fx.spawn(bnX, bnY + 0.4, bnZ, FX_FLAME_CORE);
            GAME.fx.spawn(bnX, bnY + 0.8, bnZ, FX_FIRE_SMOKE);
            car.fireGlowT = (car.fireGlowT || 0) - 0.09;
            if (car.fireGlowT <= 0) { car.fireGlowT = 0.4; GAME.fx.flash(bnX, bnY + 0.4, bnZ, 1.6); }
          } else {
            car.smokeT = 0.12;
            GAME.fx.spawn(bnX, bnY, bnZ, FX_ENGINE_SMOKE);
          }
        }
        if (car.stage >= 2) {
          car.fireFuse -= dt;
          if (car.fireFuse <= 0) explodeCar(car, 'fire');
        }
      }
      if (car.spec.heli || car.spec.plane) {
        // aircraft are flown from player.js; abandoned airborne ones fall.
        // The police air unit flies itself (police.js) and never falls.
        var powered = (car === P.car && P.inCar) || !!car.aiAir;
        // skid-level rest, same as spawn (+0.05) and player landings — this
        // branch kept the old cabin-origin 1.4, so an abandoned heli (and
        // the wreck it usually becomes) settled hovering 1.35 m off the road
        var restY = car.spec.plane ? (car.spec.wheelH || 1.1) : 0.05;
        if (!powered) {
          // the surface, not the street: an abandoned or parked aircraft over
          // a rooftop settles on the roof instead of falling through it
          var hgy = GAME.city.surfaceY(car.pos.x, car.pos.z, car.pos.y);
          if (car.pos.y > hgy + restY + 0.05) {
            car.vy = (car.vy || 0) - 12 * dt;
            car.pos.y += car.vy * dt;
            if (car.pos.y <= hgy + restY) {
              car.pos.y = hgy + restY;
              if (car.vy < -6) { explodeCar(car, 'fire'); continue; }
              car.vy = 0;
            }
          }
          car.speed = (car.speed || 0) * Math.exp(-1.5 * dt);
        }
        car.rotorSpin = U.damp(car.rotorSpin || 0, (powered || (car.vy || 0) < -2) ? 42 : 0, 1.5, dt);
        if (car.mesh.userData.rotor) car.mesh.userData.rotor.rotation.y += car.rotorSpin * dt;
        if (car.mesh.userData.tailRotor) car.mesh.userData.tailRotor.rotation.x += car.rotorSpin * dt;
        if (car.mesh.userData.prop) car.mesh.userData.prop.rotation.z += (powered ? 40 : car.rotorSpin) * dt;
        continue;
      }
      if (car === P.car && P.inCar) {
        // controls set by player.js
        stepPhysics(car, dt);
      } else if (car.ai && car.ai.mode === 'traffic' && car.occupied === 'ai') {
        trafficControls(car, dt, car.controls);
        stepPhysics(car, dt);
      } else if (car.ai && car.ai.mode === 'chase') {
        stepPhysics(car, dt); // controls written by police.js
      } else if (car.ai && car.ai.mode === 'race') {
        stepPhysics(car, dt); // controls written by missions.js
      } else {
        // ownerless: coast to a stop
        if (Math.abs(car.speed) > 0.1 || Math.abs(car.lat) > 0.1) {
          setControls(car.controls, 0, 0, false);
          stepPhysics(car, dt);
        }
      }
    }
    collideCars(dt);
    if (GAME.frame % 15 === 0) { spawnTraffic(); spawnParked(); }
  }

  function findNearestCar(x, z, maxDist, excl) {
    var best = null, bd = maxDist * maxDist;
    for (var i = 0; i < world.cars.length; i++) {
      var c = world.cars[i];
      if (c.dead || c === excl) continue;
      var d = U.dist2(c.pos.x, c.pos.z, x, z);
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  }

  return {
    TYPES: VEHICLES,
    spawnCar: spawnCar,
    removeCar: removeCar,
    ejectDriver: ejectDriver,
    update: update,
    damageCar: damageCar,
    explodeCar: explodeCar,
    sinkCar: sinkCar,
    trafficControls: trafficControls,
    findNearestCar: findNearestCar,
    // a display copy of a vehicle's mesh, for the showroom's turntable
    buildMesh: function (type) {
      var s = VEHICLES[type];
      return s ? buildCarMesh(type, s.colors[0]) : null;
    },
    fwdX: fwdX, fwdZ: fwdZ
  };
})();
