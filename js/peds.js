GAME.resolveCircle = function (x, z, r, feetY) {
  var boxes = GAME.city.hash.query(x, z, r + 1);
  for (var i = 0; i < boxes.length; i++) {
    var b = boxes[i];
    // if the entity is standing on top of this box (a rooftop), don't shove it off
    if (feetY !== undefined && b.h !== undefined && b.h <= feetY + 0.2) continue;
    // nor if the box belongs to a deck overhead — you walk under a bridge
    if (feetY !== undefined && b.minY !== undefined && feetY < b.minY - 1) continue;
    var cx = U.clamp(x, b.minX, b.maxX), cz = U.clamp(z, b.minZ, b.maxZ);
    var dx = x - cx, dz = z - cz;
    var d2 = dx * dx + dz * dz;
    if (d2 < r * r) {
      if (d2 < 0.0001) {
        // center inside the box: push out along smallest penetration
        var pl = x - b.minX, pr = b.maxX - x, pt = z - b.minZ, pb = b.maxZ - z;
        var m = Math.min(pl, pr, pt, pb);
        if (m === pl) x = b.minX - r; else if (m === pr) x = b.maxX + r;
        else if (m === pt) z = b.minZ - r; else z = b.maxZ + r;
      } else {
        var d = Math.sqrt(d2);
        x = cx + dx / d * r; z = cz + dz / d * r;
      }
    }
  }
  return { x: x, z: z };
};

// hair, built around the head's origin, and every style its own silhouette —
// when a flattop and a crew cut differ by six centimetres nobody can tell
// what the barber is selling. Everything stands proud of the head so no face
// is shared. 'buzz' returns null — bald is a choice now, not the rule.
function makeHair(style, colorHex) {
  if (style === 'buzz') return null;
  var g = new THREE.Group();
  // hair is never re-tinted in place — a new cut is a new mesh — so every
  // head of the same color shares one material and one box per shape
  var mat = sharedLambert(colorHex);
  function box(w, h, d, x, y, z) {
    var m = new THREE.Mesh(sharedBoxGeo(w, h, d), mat);
    m.position.set(x, y, z);
    g.add(m);
    return m;
  }
  switch (style) {
    case 'crew':       // short and tidy: low cap, trimmed back
      box(0.3, 0.1, 0.3, 0, 0.19, 0);
      box(0.3, 0.14, 0.06, 0, 0.08, -0.145);
      break;
    case 'flat':       // old saves called the flattop 'flat'
    case 'flattop':    // a proper landing pad, square and tall
      box(0.32, 0.3, 0.32, 0, 0.3, 0);
      break;
    case 'mohawk':     // a thin crest, nothing on the sides
      box(0.09, 0.3, 0.34, 0, 0.26, 0);
      break;
    case 'pompadour':  // swept up and forward, heavy over the brow
      box(0.3, 0.1, 0.3, 0, 0.19, 0);
      box(0.28, 0.22, 0.16, 0, 0.28, 0.08);
      break;
    case 'mullet':     // business up top, party down the neck
      box(0.3, 0.12, 0.3, 0, 0.2, 0);
      box(0.3, 0.34, 0.08, 0, -0.02, -0.16);
      break;
    case 'afro':       // full volume all round
      box(0.42, 0.3, 0.42, 0, 0.26, 0);
      box(0.36, 0.16, 0.36, 0, 0.06, -0.06);
      break;
    case 'ponytail':   // tight cap, tail out the back
      box(0.3, 0.1, 0.3, 0, 0.19, 0);
      box(0.09, 0.09, 0.2, 0, 0.16, -0.24);
      box(0.08, 0.3, 0.08, 0, -0.02, -0.3);
      break;
    default:           // unknown id: the crew cut is nobody's bad haircut
      box(0.3, 0.1, 0.3, 0, 0.19, 0);
      box(0.3, 0.14, 0.06, 0, 0.08, -0.145);
  }
  return g;
}

// the town's wardrobe, drawn from for every stranger (built once, not per ped)
var PED_SHIRTS = [0xf7a8c4, 0x9fe8d8, 0xf9d99a, 0x8fd0f0, 0xe86a8a, 0x8a6ae8, 0xf0f0e8, 0x60c890];
var PED_PANTS = [0x3a4a68, 0x684a3a, 0x2a2a34, 0x8a4a5a, 0xd8d0c0];
var PED_SKINS = [0xeac8a8, 0xc89878, 0x8a6848, 0x6a4c34, 0xf0d8c0];
var PED_HAIR_COLORS = [0x1c1a18, 0x5a3c22, 0x2e2018, 0xd8b86a, 0xa8482a, 0x8a8a90];
var PED_HAIR_STYLES = ['crew', 'crew', 'crew', 'flattop', 'flattop', 'pompadour', 'mullet', 'afro', 'ponytail', 'mohawk'];

function buildPedMesh(opts) {
  opts = opts || {};
  var g = new THREE.Group();
  // opts.look pins the whole appearance — the same person can step out of
  // the same car twice instead of a stranger wearing his job
  var look = opts.look || null;
  var shirt = opts.cop ? 0x2a4a8a : look ? look.shirt : U.pick(Math.random, PED_SHIRTS);
  var pants = opts.cop ? 0x1a2a4a : look ? look.pants : U.pick(Math.random, PED_PANTS);
  var skin = look ? look.skin : U.pick(Math.random, PED_SKINS);
  g.userData.look = { shirt: shirt, pants: pants, skin: skin };
  // The town shares its wardrobe: constant colors, constant box sizes, one
  // registry entry each — a ped spawn allocates wrappers, not buffers. The
  // PLAYER (and the wardrobe mirror) re-tints these materials in place, so
  // those two figures must own private copies or THREADS would dye every
  // pedestrian wearing the same shirt.
  var mats = opts.privateMats ? {
    shirt: new THREE.MeshLambertMaterial({ color: shirt }),
    pants: new THREE.MeshLambertMaterial({ color: pants }),
    skin: new THREE.MeshLambertMaterial({ color: skin })
  } : {
    shirt: sharedLambert(shirt),
    pants: sharedLambert(pants),
    skin: sharedLambert(skin)
  };
  var torso = new THREE.Mesh(sharedBoxGeo(0.46, 0.62, 0.26), mats.shirt);
  torso.position.y = 1.12;
  g.add(torso);
  var head = new THREE.Mesh(sharedBoxGeo(0.26, 0.28, 0.26), mats.skin);
  head.position.y = 1.6;
  g.add(head);
  if (opts.cop) {
    var cap = new THREE.Mesh(sharedBoxGeo(0.3, 0.1, 0.3), mats.pants);
    cap.position.y = 1.78;
    g.add(cap);
  } else if (!opts.noHair) {
    // nobody in this town is bald unless they paid the barber for it
    // (the player's own hair is the wardrobe's business — see shops.js)
    var hairStyle = look ? look.hair : U.pick(Math.random, PED_HAIR_STYLES);
    var hairCol = look ? look.hairCol : U.pick(Math.random, PED_HAIR_COLORS);
    var hair = makeHair(hairStyle, hairCol);
    if (hair) { hair.position.y = 1.6; g.add(hair); }
    g.userData.look.hair = hairStyle;
    g.userData.look.hairCol = hairCol;
  }
  function limb(w, len, mat, x, y) {
    var pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    var m = new THREE.Mesh(sharedBoxGeo(w, len, w), mat);
    m.position.y = -len / 2;
    pivot.add(m);
    g.add(pivot);
    return pivot;
  }
  var armL = limb(0.13, 0.58, mats.shirt, -0.3, 1.38);
  var armR = limb(0.13, 0.58, mats.shirt, 0.3, 1.38);
  var legL = limb(0.16, 0.8, mats.pants, -0.13, 0.82);
  var legR = limb(0.16, 0.8, mats.pants, 0.13, 0.82);
  g.userData.joints = { armL: armL, armR: armR, legL: legL, legR: legR, head: head, torso: torso };
  return g;
}

GAME.peds = (function () {
  var world = GAME.world;

  function spawnPed(x, z, opts) {
    opts = opts || {};
    var mesh = buildPedMesh(opts);
    mesh.position.set(x, GAME.city.groundY(x, z), z);
    GAME.scene.add(mesh);
    var ped = {
      kind: 'ped',
      mesh: mesh, pos: mesh.position,
      heading: Math.random() * Math.PI * 2,
      state: 'walk', speed: 0,
      walkPhase: Math.random() * 6,
      hp: opts.cop ? 60 : 30,
      isCop: !!opts.cop,
      armed: !!opts.cop,
      // how quick this one is to swing back rather than run
      temper: Math.random(),
      fleeT: 0, diveT: 0, deadT: 0, attackT: 0, punchT: 0,
      // how alert this one is, and how long they take to react to a car
      dodgeSkill: Math.random(),
      reactDelay: U.randRange(Math.random, 0.15, 0.45), reactT: 0,
      wpX: x, wpZ: z, wpT: 0,
      shootT: U.randRange(Math.random, 0.5, 1.5)
    };
    ped.look = mesh.userData.look;   // so a car can remember who drives it
    world.peds.push(ped);
    return ped;
  }

  function removePed(ped) {
    // anyone holding this one as a foe has to be able to tell it is gone —
    // ped.dead only covers being killed, not despawning off the bubble edge
    ped.gone = true;
    var i = world.peds.indexOf(ped);
    if (i >= 0) world.peds.splice(i, 1);
    GAME.scene.remove(ped.mesh);
    disposeTree(ped.mesh);
  }

  function kill(ped, cause, byPlayer, attacker) {
    if (ped.dead) return;
    ped.killedBy = attacker || null;
    ped.dead = true;
    ped.state = 'dead';
    ped.deadT = 0;
    // a dead owner can't come back for his car — forget him, so the next
    // jack doesn't raise him from the pavement
    if (ped.stolenCar && ped.stolenCar.lastDriver) ped.stolenCar.lastDriver = null;
    GAME.fx.spawn(ped.pos.x, 1.1, ped.pos.z, { count: 7, color: 0xc42848, spread: 1.6, vy: 1.5, life: 0.4, grav: -3 });
    GAME.audio.yelp(ped.pos.x, ped.pos.z);
    ped.mesh.rotation.x = Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2;
    ped.mesh.position.y = GAME.city.groundY(ped.pos.x, ped.pos.z) + 0.35;
    if (byPlayer) {
      if (ped.isCop) GAME.police.reportCrime('kill_cop', ped.pos);
      else GAME.police.reportCrime('kill_ped', ped.pos);
      GAME.missions.notifyChaos(ped.isCop ? 400 : 150);
    }
    // drops
    if (ped.isCop) GAME.combat.dropPickup(ped.pos.x, ped.pos.z, 'pistol');
    else if (Math.random() < 0.35) GAME.combat.dropPickup(ped.pos.x, ped.pos.z, 'cash');
    panic(ped.pos.x, ped.pos.z, 26);
  }

  // `force` overrides the mid-brawl exemption. Two men swinging at each other
  // are past being scared off by a shout or a body hitting the pavement — but
  // not by a car going up thirty metres away, which ends any argument.
  function panic(x, z, r, force) {
    var r2 = r * r;
    for (var i = 0; i < world.peds.length; i++) {
      var p = world.peds[i];
      // Job peds are left out of it. A fare, a patient or somebody crossing to
      // the ice cream hatch is steered by their mission every frame, which
      // overwrites heading and speed regardless of what this sets — so all a
      // scare could do was leave them carrying a 'flee' they could not act
      // on. A state nothing honours is worse than no state.
      if (p.dead || p.isCop || p.jobPed) continue;
      if (p.state === 'attack' && !force) continue;   // mid-brawl, past being scared off
      if (U.dist2(p.pos.x, p.pos.z, x, z) < r2) {
        p.state = 'flee';
        p.foe = null;                        // whatever it was about, it is over
        p.fleeT = U.randRange(Math.random, 4, 8);
        p.fleeX = x; p.fleeZ = z;
        if (Math.random() < 0.4) GAME.audio.yelp(p.pos.x, p.pos.z);
      }
    }
  }

  function newWaypoint(ped) {
    var a = Math.random() * Math.PI * 2;
    var x = ped.pos.x + Math.cos(a) * U.randRange(Math.random, 25, 60);
    var z = ped.pos.z + Math.sin(a) * U.randRange(Math.random, 25, 60);
    var rp = GAME.city.nearestRoadPoint(x, z);
    // the probe can land in the channel, and then the other landmass answers
    // for it — the waypoint stays on the one the stroller is standing on
    if (GAME.city.islandIdAt(rp.x, rp.z) !== GAME.city.islandIdAt(ped.pos.x, ped.pos.z)) {
      rp = GAME.city.nearestRoadPoint(ped.pos.x, ped.pos.z);
    }
    var off = 8.4 * (Math.random() < 0.5 ? 1 : -1);
    if (rp.axis === 'net') {
      // a curved road: the pavement is along its normal, not along an axis
      ped.wpX = rp.x + Math.cos(rp.heading) * off;
      ped.wpZ = rp.z - Math.sin(rp.heading) * off;
    } else if (rp.axis === 'z') { ped.wpX = rp.x + off; ped.wpZ = rp.z; }
    else { ped.wpX = rp.x; ped.wpZ = rp.z + off; }
    // The clamp box is the MAINLAND. Clamping an island stroller's waypoint to
    // it aimed every one of them at x=368 — the far side of the channel — and
    // they all set off west through the grass and downhill into the sea.
    if (rp.axis !== 'net') {
      ped.wpX = U.clamp(ped.wpX, -490, 368);
      ped.wpZ = U.clamp(ped.wpZ, -490, 490);
    }
    ped.wpT = U.randRange(Math.random, 10, 20);
  }

  // Who is this one fighting, and where are they right now?
  //
  // ped.foe names the target — the player, another stranger, or a vehicle —
  // and this turns it into the handful of numbers the attack state actually
  // uses. An unset foe means the player, so every caller that predates any of
  // this keeps working untouched.
  //
  // `valid` is the important field. A foe can stop being a thing to fight
  // between one frame and the next: the ped is killed, or despawns off the
  // edge of the bubble, or the car burns out. Everything that can dangle is
  // checked here rather than at each of the dozen places downstream.
  function foeState(ped, chaseCar) {
    var P = GAME.player;
    if (chaseCar) {
      return { valid: !chaseCar.dead, kind: 'car', car: chaseCar, ped: null,
        x: chaseCar.pos.x, z: chaseCar.pos.z, y: chaseCar.pos.y, speed: Math.abs(chaseCar.speed || 0) };
    }
    var foe = ped.foe;
    if (foe && foe.kind === 'ped') {
      var o = foe.ped;
      var ok = !!o && !o.dead && !o.gone;
      return { valid: ok, kind: 'ped', car: null, ped: o,
        x: ok ? o.pos.x : ped.pos.x, z: ok ? o.pos.z : ped.pos.z,
        y: ok ? o.pos.y : ped.pos.y, speed: ok ? Math.abs(o.speed || 0) : 0 };
    }
    if (foe && foe.kind === 'car') {
      var c = foe.car;
      var cok = !!c && !c.dead && !c.gone;
      return { valid: cok, kind: 'car', car: c, ped: null,
        x: cok ? c.pos.x : ped.pos.x, z: cok ? c.pos.z : ped.pos.z,
        y: cok ? c.pos.y : ped.pos.y, speed: cok ? Math.abs(c.speed || 0) : 0 };
    }
    var pc = P.inCar && P.car ? P.car : null;
    return { valid: P.state === 'alive', kind: 'player', car: pc, ped: null,
      x: pc ? pc.pos.x : P.pos.x, z: pc ? pc.pos.z : P.pos.z,
      y: pc ? pc.pos.y : P.pos.y, speed: pc ? Math.abs(pc.speed || 0) : 0 };
  }

  function animateWalk(ped, dt) {
    ped.walkPhase += ped.speed * dt * 2.2;
    var j = ped.mesh.userData.joints;
    var s = Math.sin(ped.walkPhase) * Math.min(1, ped.speed / 2.2) * 0.7;
    j.legL.rotation.x = s; j.legR.rotation.x = -s;
    if (!ped.aimPose) { j.armL.rotation.x = -s * 0.8; j.armR.rotation.x = s * 0.8; }
  }

  function update(dt) {
    var P = GAME.player;
    var fc = GAME.focus();
    for (var i = world.peds.length - 1; i >= 0; i--) {
      var ped = world.peds[i];
      var d2p = U.dist2(ped.pos.x, ped.pos.z, fc.x, fc.z);
      if (ped.dead) {
        ped.deadT += dt;
        // carry through a knock-back from a vehicle: tumble, then settle
        if (ped.knockY !== undefined) {
          var gy0 = GAME.city.groundY(ped.pos.x, ped.pos.z);
          ped.knockY -= 18 * dt;
          ped.pos.x += ped.knockX * dt;
          ped.pos.z += ped.knockZ * dt;
          ped.pos.y += ped.knockY * dt;
          ped.mesh.rotation.z += ped.knockSpin * dt;
          ped.knockX *= Math.exp(-2.2 * dt);
          ped.knockZ *= Math.exp(-2.2 * dt);
          if (ped.pos.y <= gy0 + 0.35) {
            ped.pos.y = gy0 + 0.35;
            ped.knockY = undefined; // come to rest
          }
        }
        if (ped.deadT > 12 || d2p > 190 * 190) removePed(ped);
        continue;
      }
      ped.bumpCd = Math.max(0, (ped.bumpCd || 0) - dt);
      if (!ped.isCop && !ped.jobPed && d2p > 180 * 180) { removePed(ped); continue; }
      if (ped.isCop) {
        // movement is driven by police.js, but officers are still flesh and blood:
        // a car at speed runs them down like anyone else
        for (var cc = 0; cc < world.cars.length; cc++) {
          var ccar = world.cars[cc];
          if (Math.abs(ccar.speed) < 4) continue;
          // the same body test the civilians get below — an officer standing
          // clear of a passing car is standing clear of it
          var cfx = Math.sin(ccar.heading), cfz = Math.cos(ccar.heading);
          var cdx = ped.pos.x - ccar.pos.x, cdz = ped.pos.z - ccar.pos.z;
          if (Math.abs(cdx * cfx + cdz * cfz) > ccar.spec.l / 2 + 0.45) continue;
          if (Math.abs(cdx * cfz - cdz * cfx) > ccar.spec.w / 2 + 0.45) continue;
          {
            var copByPlayer = (ccar === P.car && P.inCar);
            kill(ped, 'car', copByPlayer);
            GAME.audio.crash(0.4, ped.pos.x, ped.pos.z);
            // nothing here touches cameraShake, so the knock channel never saw
            // this: a body on the bonnet used to register as exactly nothing
            if (copByPlayer) GAME.haptics.splat(Math.min(1, Math.abs(ccar.speed) / 26));
            break;
          }
        }
        continue;
      }

      // dive away from fast cars — but not every time. People need a moment to
      // react, some are slower to notice than others, and once a bonnet is on
      // top of them it's simply too late.
      if (ped.state !== 'dive') {
        var threat = false;
        for (var c = 0; c < world.cars.length; c++) {
          var car = world.cars[c];
          var sp = Math.abs(car.speed);
          if (sp < 8) continue;
          var dx = ped.pos.x - car.pos.x, dz = ped.pos.z - car.pos.z;
          var d2 = dx * dx + dz * dz;
          if (d2 > 130) continue;
          var fx = Math.sin(car.heading), fz = Math.cos(car.heading);
          var ahead = dx * fx + dz * fz;
          if (ahead <= 0 || ahead > 10 || Math.abs(dx * fz - dz * fx) > 3) continue;
          threat = true;
          // reaction time: they have to have seen it coming for a beat
          ped.reactT = (ped.reactT || 0) + dt;
          if (ped.reactT < ped.reactDelay) break;
          if (ahead < 5.5) break;             // too close — no time left
          if (ped.dodgeSkill < 0.35) break;   // this one just freezes
          ped.state = 'dive';
          ped.diveT = ped.diveDur = 0.85;
          var side = (dx * fz - dz * fx) > 0 ? 1 : -1;
          ped.diveX = (fz * side) * 6.2; ped.diveZ = (-fx * side) * 6.2;
          ped.speed = 0;
          GAME.audio.yelp(ped.pos.x, ped.pos.z);
          break;
        }
        if (!threat) ped.reactT = 0;
      }

      if (ped.state === 'walk') {
        ped.wpT -= dt;
        var wd2 = U.dist2(ped.pos.x, ped.pos.z, ped.wpX, ped.wpZ);
        if (wd2 < 4 || ped.wpT <= 0) newWaypoint(ped);
        var th = Math.atan2(ped.wpX - ped.pos.x, ped.wpZ - ped.pos.z);
        ped.heading = U.angleLerp(ped.heading, th, Math.min(1, dt * 4));
        ped.speed = U.damp(ped.speed, 3.57, 3, dt);   // 0.85x the player's 4.2 walk
      } else if (ped.state === 'flee') {
        ped.fleeT -= dt;
        var fh = Math.atan2(ped.pos.x - ped.fleeX, ped.pos.z - ped.fleeZ);
        ped.heading = U.angleLerp(ped.heading, fh + Math.sin(GAME.time * 3 + i) * 0.5, Math.min(1, dt * 5));
        ped.speed = U.damp(ped.speed, 6.8, 4, dt);    // 0.85x the player's 8 sprint
        if (ped.fleeT <= 0) { ped.state = 'walk'; newWaypoint(ped); }
      } else if (ped.state === 'attack') {
        // this one is coming for someone — properly. They run their man down
        // faster than he can walk away, throw quick jabs off both hands, and
        // the one whose car was taken chases the CAR: bangs on it, hauls the
        // thief out of the seat, and drives off in it. They give up once the
        // target speeds away, gets too far, or the fight has gone on long
        // enough — then they run.
        //
        // WHO they are coming for is ped.foe, not "the player" — see
        // foeState(). Everything below is written against the resolved
        // target, so the same charge-and-jab serves a mugging on the
        // pavement, a driver hauling a stranger out of his own car, and the
        // original case of somebody deciding they have had enough of you.
        ped.attackT -= dt;
        if (ped.stolenCar && ped.stolenCar.gone) ped.stolenCar = null;   // despawned: nothing to take back
        var myCar = ped.stolenCar && !ped.stolenCar.dead && ped.stolenCar.occupied !== 'ai' ? ped.stolenCar : null;
        var chaseCar = myCar && U.dist2(ped.pos.x, ped.pos.z, myCar.pos.x, myCar.pos.z) < 55 * 55;
        var F = foeState(ped, chaseCar ? myCar : null);
        var tcar = F.car;
        var tx = F.x, tz = F.z, ty = F.y, tSpeed = F.speed;
        var ad2 = U.dist2(ped.pos.x, ped.pos.z, tx, tz);
        // Turning the knob off has to calm the street that is already going,
        // not merely stop the next one starting — a player reaching for the
        // escape hatch wants the brawl in front of them to stop. Fights with
        // the PLAYER are not chaos's to call off, and neither is a man taking
        // his own car back: both predate all of this and stand at OFF.
        var calledOff = !GAME.chaos.on && !chaseCar && F.kind !== 'player';
        if (ped.attackT <= 0 || !F.valid || ad2 > 55 * 55 || calledOff ||
          Math.abs(ty - ped.pos.y) > 3 || tSpeed > 10) {
          ped.state = 'flee';
          ped.fleeT = 4;
          ped.fleeX = tx; ped.fleeZ = tz;
          ped.aimPose = false;
          ped.foe = null;
        } else {
          var ah = Math.atan2(tx - ped.pos.x, tz - ped.pos.z);
          ped.heading = U.angleLerp(ped.heading, ah, Math.min(1, dt * 10));
          // The melee pose is HELD for a moment rather than recomputed from
          // scratch every frame. Two men swinging at each other jostle back
          // and forth across the 1.7 m reach boundary constantly, and the pose
          // was being switched on in reach and off on the charge — so the arms
          // flipped between a walk swing and a raised guard at sixty hertz.
          // It read exactly like what it was: a flicker, not an animation.
          ped.poseT = Math.max(0, (ped.poseT || 0) - dt);
          ped.aimPose = ped.poseT > 0;
          // The punch clock runs whether or not he is in reach. Ticking it
          // only within reach — and worse, resetting it on the frames he was
          // not — meant that two men jostling across the 1.7 m boundary threw
          // the swing animation back to its start over and over, mid-arc: an
          // arm jumping half a radian between frames, ten times in five
          // seconds. Left running, the arc simply finishes and the hand
          // settles back to a guard.
          ped.punchT -= dt;
          var targetCarBody = chaseCar ? myCar : tcar;
          var reach = targetCarBody ? (targetCarBody.spec.l / 2 + 1.5) : 1.7;
          // Carrying, and far enough away for it to be worth drawing — up
          // close he still swings, because a pistol at arm's length is a punch
          // with extra steps.
          //
          // Pointed at whoever he is fighting, the player included. Getting
          // into a fist fight with a man who turns out to be armed is the
          // point of him being armed; he just cannot start one from across the
          // street, because he only ever draws on someone he is already in the
          // attack state against, which for the player means they provoked it.
          var canShoot = ped.carrying && GAME.chaos.armedChance > 0 &&
            (F.kind === 'ped' ? !!F.ped : F.kind === 'player') &&
            ad2 > 36 && ad2 < 30 * 30 &&
            Math.abs(ty - ped.pos.y) < 3 &&
            GAME.city.hash.segmentClear(ped.pos.x, ped.pos.z, tx, tz);
          if (canShoot) {
            ped.speed = U.damp(ped.speed, 0, 6, dt);
            ped.poseT = POSE_HOLD;
            ped.aimPose = true;
            ped.mesh.userData.joints.armR.rotation.x = -Math.PI / 2;
            ped.mesh.userData.joints.armL.rotation.x = -0.4;
            ped.shootT -= dt;
            if (ped.shootT <= 0) {
              ped.shootT = U.randRange(Math.random, 0.9, 1.8);
              // A wilder shot than the law, deliberately. npcShoot's accuracy
              // is INVERTED — higher is tighter — and 0.55 made a man with a
              // pistol in his waistband a better shot than a three-star
              // officer, which was tolerable while he could only ever hit
              // another NPC and is not now. At 0.15 he lands about a quarter
              // of his rounds at twelve metres where an officer lands a third.
              GAME.combat.npcShoot(ped.pos.x, 1.35, ped.pos.z, 0.15, 6, ped,
                F.kind === 'ped' ? F.ped : undefined);
              // A gun in the street is a police matter whoever it is aimed at,
              // so this is reported either way — the officer who turns up
              // treats it as the serious call it is.
              if (GAME.police.reportIncident) GAME.police.reportIncident(ped.pos.x, ped.pos.z, ped, 2);
              panic(ped.pos.x, ped.pos.z, 22);
            }
          } else if (ad2 > reach * reach) {
            // Running, not swinging. The jab pose used to be applied on EVERY
            // frame of the attack state, charge included, and punchT does not
            // tick while closing — so both arms locked at head height and
            // stayed there for the whole run. Players called it what it looked
            // like: a zombie. Letting the hold above lapse hands the arms back
            // to the walk cycle below, over about a third of a second rather
            // than on the next frame.
            // A full 0.85x-sprint charge: faster than you can walk away.
            //
            // Chasing another NPC needs a little more than that. A fleeing
            // stranger runs at exactly the same 6.8 the charge uses, so the
            // two of them held station at whatever range the fight started —
            // measured, thirty metres apart for five straight seconds, one
            // jogging after the other and neither gaining an inch, until the
            // clock ran out. Against the PLAYER the 0.85 is a balance figure
            // and stays exactly what it was.
            ped.speed = U.damp(ped.speed, F.kind === 'ped' ? 7.7 : 6.8, 6, dt);
            ped.yankT = 0;
          } else {
            ped.poseT = POSE_HOLD;          // in reach: keep the guard up
            ped.aimPose = true;
            ped.speed = U.damp(ped.speed, 0, 9, dt);
            if (chaseCar && tSpeed < 2.5) {
              // hands on his own car: hammering first, a shouted warning at
              // the door, and only then the yank. The clock restarts whenever
              // possession changes, so time he spent banging while you were
              // still climbing in can never mature into an instant ejection.
              var mine = P.inCar && P.car === myCar;
              var boarding = P.entering && P.entering.car === myCar;
              if (mine !== ped.hadDriver) { ped.hadDriver = mine; ped.yankT = 0; ped.yankWarned = false; }
              ped.yankT = (ped.yankT || 0) + dt;
              if (mine && !ped.yankWarned && ped.yankT > 0.7) {
                ped.yankWarned = true;
                GAME.hud.message('He’s got the door handle — floor it or lose the seat.', 2);
                GAME.audio.yelp(ped.pos.x, ped.pos.z);
              }
              if (ped.yankT > 1.7) {
                if (mine) {
                  GAME.exitCar();
                  GAME.hud.message('He wants his ride back.', 2.5);
                  GAME.audio.yelp(ped.pos.x, ped.pos.z);
                  ped.yankT = 0;
                  ped.yankWarned = false;
                } else if (!boarding) {
                  // owner slides back in and drives off, done with you
                  myCar.occupied = 'ai';
                  myCar.ai = { mode: 'traffic', desired: 12, laneX: 0, laneZ: 0 };
                  if (myCar.parkedSpot) { myCar.parkedSpot.live = null; myCar.parkedSpot = null; }
                  removePed(ped);
                  continue;
                }
              } else if (ped.punchT <= 0) {
                ped.punchT = 0.5;
                GAME.vehicles.damageCar(myCar, 2, 'fists', false);
                GAME.audio.crash(0.15, ped.pos.x, ped.pos.z);
              }
            } else if (ped.punchT <= 0) {
              ped.punchT = PUNCH_CYCLE;
              ped.punchArm = !ped.punchArm;
              // whoever is on the end of it takes the punch
              if (tcar) {
                GAME.vehicles.damageCar(tcar, 2, 'fists', false);
                if (tcar === P.car && P.inCar) {
                  GAME.cameraShake = Math.max(GAME.cameraShake || 0, 0.12);
                } else if (tcar.occupied === 'ai' && GAME.chaos.on && !tcar.isPolice && !tcar.mission) {
                  // Somebody hammering on your bonnet does not go unanswered.
                  // Two blows in and the man inside gets out, and what was a
                  // person hitting a parked object becomes two people having
                  // it out — which is the thing worth watching.
                  ped.bangT = (ped.bangT || 0) + 0.55;
                  if (ped.bangT > 1) {
                    ped.bangT = 0;
                    var other = GAME.vehicles.ejectDriver(tcar);
                    if (other) {
                      other.temper = Math.max(other.temper || 0, 0.7);
                      ped.foe = { kind: 'ped', ped: other };
                      ped.attackT = Math.max(ped.attackT, 12);
                      startFight(other, { kind: 'ped', ped: ped }, 14);
                    }
                  }
                }
              } else if (F.kind === 'ped' && F.ped) {
                // a thrown punch is a provocation like any other: the man on
                // the receiving end gets to decide whether to swing back
                damage(F.ped, 6, false, ped);
              } else {
                GAME.playerDamage(6, 'fists');
              }
              GAME.audio.crash(0.18, ped.pos.x, ped.pos.z);
            }
          }
          // Quick jabs off alternating hands — but a jab, with a shape to it.
          //
          // This used to be a linear ramp across the whole cycle that then
          // SNAPPED back to the guard and handed over to the other arm, so
          // each hand jumped a radian instantly twice a second and the pair of
          // them read as frantic. Now the arm goes out fast, comes back
          // slower, and holds a guard for the rest of the cycle: out in 0.14 s,
          // back over 0.3, still for the remainder.
          if (ped.aimPose) {
            var aj = ped.mesh.userData.joints;
            var since = PUNCH_CYCLE - U.clamp(ped.punchT, 0, PUNCH_CYCLE);
            var out = since < 0.14 ? since / 0.14
              : Math.max(0, 1 - (since - 0.14) / 0.3);
            var lead = ped.punchArm ? 'armR' : 'armL';
            var off = ped.punchArm ? 'armL' : 'armR';
            var tl = -1.15 - out * 1.05;
            // Quick into the strike, eased into the guard — and neither one
            // allowed to teleport. Taking the stance from a dead run means the
            // arms are wherever the walk cycle left them, and the strike used
            // to be set OUTRIGHT: a punch beginning before the guard had eased
            // in abandoned the ease and jumped to full extension. Measured,
            // 1.41 rad in a single step, off an arm still carrying the swing.
            //
            // So whichever branch an arm is set from, its step is bounded. The
            // jab is untouched by that — it travels 7.5 rad/s, half the
            // ceiling — and the guard is bounded too, because easing is
            // proportional and an arm starting a long way out takes its
            // biggest step first: 0.4 rad off one frame, most of the way to
            // the jump this is here to stop.
            var cap = STRIKE_RATE * dt;
            var cur = aj[lead].rotation.x;
            var want = out > 0 ? tl : U.lerp(cur, tl, Math.min(1, dt * 14));
            aj[lead].rotation.x = cur + U.clamp(want - cur, -cap, cap);
            var offc = aj[off].rotation.x;
            var offw = U.lerp(offc, -1.15, Math.min(1, dt * 14));
            aj[off].rotation.x = offc + U.clamp(offw - offc, -cap, cap);
          }
        }
      } else if (ped.state === 'dive') {
        // a real dive: they leave their feet, arc through the air and land —
        // rather than sliding sideways with the walk cycle still playing
        ped.diveT -= dt;
        var dk = U.clamp(1 - ped.diveT / (ped.diveDur || 0.85), 0, 1);
        var slow = 1 - dk * 0.7;                       // bleed off speed on the way down
        ped.pos.x += ped.diveX * slow * dt;
        ped.pos.z += ped.diveZ * slow * dt;
        ped.diveY = Math.sin(dk * Math.PI) * 0.7;      // hop off the ground
        // throw themselves in the direction they're going
        ped.heading = U.angleLerp(ped.heading, Math.atan2(ped.diveX, ped.diveZ), Math.min(1, dt * 12));
        ped.mesh.rotation.y = ped.heading;
        ped.mesh.rotation.x = U.lerp(ped.mesh.rotation.x, -1.35, Math.min(1, dt * 12));
        var dj = ped.mesh.userData.joints;
        dj.armL.rotation.x = -2.45; dj.armR.rotation.x = -2.45;
        dj.legL.rotation.x = 0.4; dj.legR.rotation.x = 0.18;
        if (ped.diveT <= 0) {
          ped.mesh.rotation.x = 0;
          ped.diveY = 0;
          dj.armL.rotation.x = dj.armR.rotation.x = 0;
          ped.state = 'flee';
          ped.fleeT = 5;
          ped.fleeX = ped.pos.x - Math.sin(ped.heading); ped.fleeZ = ped.pos.z - Math.cos(ped.heading);
        }
      }

      var fx0 = ped.pos.x, fz0 = ped.pos.z;
      // Job peds are steered by their mission and moved BY IT — stepBoarding
      // sets heading and speed and then walks them in itself. Integrating
      // that same heading and speed here as well moved them twice a frame,
      // and since no branch above claims the 'wait' they sit in, the values
      // it stepped them with were still sitting there to be reapplied.
      // Measured on the ice cream round: a customer covering the ground at
      // 8.2 m/s — exactly twice the 4.1 stroll they are set to — which is the
      // serving pace the round was slowed to in the first place. It went
      // unseen because the check watched ped.speed, which read a truthful
      // 4.1 the whole way in; only the distance actually covered shows it.
      if (ped.state !== 'dive' && !ped.jobPed) {
        ped.pos.x += Math.sin(ped.heading) * ped.speed * dt;
        ped.pos.z += Math.cos(ped.heading) * ped.speed * dt;
        ped.mesh.rotation.y = ped.heading;
      }
      // no walking up a stunt ramp (see city.canWalkTo). Refusing the step
      // leaves the body where it was, which is exactly what the stuck check
      // below is looking for — so a ramp foot turns them around the same way
      // a palm tree does.
      if (!GAME.city.canWalkTo(fx0, fz0, ped.pos.x, ped.pos.z)) {
        ped.pos.x = fx0; ped.pos.z = fz0;
      }
      var rp2 = GAME.resolveCircle(ped.pos.x, ped.pos.z, 0.4);
      // walking into a palm tree forever is not a plan: when the legs move
      // but the body doesn't, sidestep and pick a new line. (Job peds are
      // steered by their mission every frame; leave them to it.)
      if (!ped.jobPed && ped.speed > 0.3 && ped.state !== 'dive') {
        var bdx = rp2.x - ped.prevX2, bdz = rp2.z - ped.prevZ2;
        if (ped.prevX2 !== undefined && bdx * bdx + bdz * bdz < Math.pow(ped.speed * dt * 0.25, 2)) {
          ped.stuckT = (ped.stuckT || 0) + dt;
          if (ped.stuckT > 1.1) {
            ped.stuckT = 0;
            var sside = Math.random() < 0.5 ? 1 : -1;
            if (ped.state === 'walk') {
              ped.wpX = ped.pos.x + Math.sin(ped.heading + sside * Math.PI / 2) * 7;
              ped.wpZ = ped.pos.z + Math.cos(ped.heading + sside * Math.PI / 2) * 7;
              ped.wpT = 3;
            } else ped.heading += sside * (1.1 + Math.random() * 0.8);
          }
        } else ped.stuckT = 0;
      }
      ped.prevX2 = rp2.x; ped.prevZ2 = rp2.z;
      ped.pos.x = rp2.x; ped.pos.z = rp2.z;
      // A stopped vehicle is solid: nobody walks through a parked truck. Fast
      // cars are left alone — the run-over check below is what handles those,
      // and pushing people clear of them would make everyone unhittable. Job
      // peds are exempt too: a fare climbing into the cab and a customer at
      // the ice cream hatch have to reach INSIDE the body's rectangle, and
      // the push held them at arm's length forever.
      if (!ped.jobPed) for (var cv = 0; cv < world.cars.length; cv++) {
        var pcv = world.cars[cv];
        if (pcv.dead || Math.abs(pcv.speed) >= 4) continue;
        if (Math.abs(pcv.pos.y - ped.pos.y) > 3) continue;
        var vdx = ped.pos.x - pcv.pos.x, vdz = ped.pos.z - pcv.pos.z;
        var vhl = pcv.spec.l / 2 + 0.4, vhw = pcv.spec.w / 2 + 0.4;
        if (vdx * vdx + vdz * vdz > (vhl + 1) * (vhl + 1)) continue;
        var vfx = Math.sin(pcv.heading), vfz = Math.cos(pcv.heading);
        var lng = vdx * vfx + vdz * vfz;          // along the body
        var lat2 = vdx * vfz - vdz * vfx;         // across it
        if (Math.abs(lng) >= vhl || Math.abs(lat2) >= vhw) continue;
        // A nudge is not nothing. Between a standstill and the 4 m/s where the
        // run-over check takes over there was a dead band: a car could shove
        // someone up the street all day and they would carry on walking as if
        // the bonnet were weather. Now they notice — most step back, some come
        // round to the window about it.
        if (Math.abs(pcv.speed) > 1.2 && (ped.bumpCd || 0) <= 0 && ped.state !== 'attack') {
          ped.bumpCd = 2.5;
          if (GAME.chaos.roll(GAME.chaos.reactChance)) {
            if ((ped.temper || 0) > 0.4 && GAME.chaos.roll(GAME.chaos.fightChance)) {
              startFight(ped, { kind: 'car', car: pcv }, 7);
            } else {
              startFlee(ped, pcv.pos.x, pcv.pos.z, 3);
              GAME.audio.yelp(ped.pos.x, ped.pos.z);
            }
          }
        }
        var penL = vhl - Math.abs(lng), penW = vhw - Math.abs(lat2);
        if (penW <= penL) {
          var ws = lat2 >= 0 ? 1 : -1;
          ped.pos.x += vfz * ws * penW; ped.pos.z += -vfx * ws * penW;
        } else {
          var ls = lng >= 0 ? 1 : -1;
          ped.pos.x += vfx * ls * penL; ped.pos.z += vfz * ls * penL;
        }
      }
      if (GAME.city.isInWater(ped.pos.x, ped.pos.z, ped.pos.y)) { removePed(ped); continue; }
      if (!ped.jobPed && GAME.city.inAirport(ped.pos.x, ped.pos.z)) { removePed(ped); continue; }
      ped.pos.y = GAME.city.groundY(ped.pos.x, ped.pos.z) + (ped.diveY || 0);
      // the dive drives its own pose; the walk cycle would just make it slide
      if (ped.state !== 'dive') animateWalk(ped, dt);

      // run over check
      for (var c2 = 0; c2 < world.cars.length; c2++) {
        var car2 = world.cars[c2];
        var sp2 = Math.abs(car2.speed);
        if (sp2 < 4) continue;
        if (Math.abs(car2.pos.y - ped.pos.y) > 3) continue;   // it's up on a roof
        // The bodywork, not a circle around it. This was `dist2 < 5.2` — a
        // 2.28 m circle measured from the car's CENTRE — while a sedan is
        // barely a metre from its centreline to its flank. So a metre and a
        // half of clear air beside a moving car was fatal: people died brushing
        // past cars that never touched them, and a driver pulled out of a
        // moving one was killed by it the instant he appeared alongside.
        var fx2 = Math.sin(car2.heading), fz2 = Math.cos(car2.heading);
        var rdx = ped.pos.x - car2.pos.x, rdz = ped.pos.z - car2.pos.z;
        if (Math.abs(rdx * fx2 + rdz * fz2) > car2.spec.l / 2 + 0.45) continue;
        if (Math.abs(rdx * fz2 - rdz * fx2) > car2.spec.w / 2 + 0.45) continue;
        {
          var byPlayer = (car2 === P.car && P.inCar);
          kill(ped, 'car', byPlayer);
          if (byPlayer) GAME.haptics.splat(Math.min(1, sp2 / 26));
          // thrown along the bonnet rather than dropping on the spot
          var kf = Math.min(1, sp2 / 26);
          ped.knockX = Math.sin(car2.heading) * (4 + sp2 * 0.35);
          ped.knockZ = Math.cos(car2.heading) * (4 + sp2 * 0.35);
          ped.knockY = 2.2 + kf * 3.2;
          ped.knockSpin = (Math.random() < 0.5 ? -1 : 1) * (4 + kf * 7);
          if (byPlayer) GAME.police.reportCrime('hit_ped', ped.pos);
          GAME.audio.crash(0.4, ped.pos.x, ped.pos.z);
          break;
        }
      }
    }
    if (GAME.frame % 20 === 5) spawnBubble();
    sparkTrouble(dt);
  }

  // Strangers finding their own reasons. Without this the only fights in the
  // city are ones the player started, which is its own kind of unreal — a
  // place where nothing happens unless somebody is looking at it. Rare by
  // design even at the top of the range: an argument every few seconds on a
  // street of eighteen people is already a lot of argument.
  function sparkTrouble(dt) {
    if (!GAME.chaos.on || GAME.chaos.sparkRate <= 0) return;
    if (fightCount() >= GAME.chaos.maxFights) return;
    var range2 = GAME.chaos.sparkRange * GAME.chaos.sparkRange;
    // Near the player — see GAME.chaos.nearPlayer for why.
    for (var i = 0; i < world.peds.length; i++) {
      var a = world.peds[i];
      if (a.dead || a.isCop || a.jobPed || a.state !== 'walk') continue;
      if ((a.temper || 0) < 0.5) continue;                 // the placid never start it
      // 85 m, not tighter. The crowd is SPAWNED at 60-150 m (see spawnBubble),
      // so nobody starts near the player at all — they only get close by
      // walking there or by the player driving to them. A 55 m gate sat
      // inside the spawn ring and starved a player who was standing still:
      // measured, forty-five seconds at the top of the range with a crowd of
      // twenty produced no fights whatsoever.
      if (!GAME.chaos.nearPlayer(a.pos.x, a.pos.z, 85)) continue;
      if (!GAME.chaos.rollRate(GAME.chaos.sparkRate, dt)) continue;
      for (var j = 0; j < world.peds.length; j++) {
        var b = world.peds[j];
        if (b === a || b.dead || b.isCop || b.jobPed) continue;
        if (U.dist2(a.pos.x, a.pos.z, b.pos.x, b.pos.z) > range2) continue;
        if (Math.abs(a.pos.y - b.pos.y) > 2) continue;
        // Long enough to come across. A ten-second scuffle three streets over
        // is a scuffle nobody saw; the same one running for twenty gives a
        // player driving past a chance to notice it and stop.
        startFight(a, { kind: 'ped', ped: b }, U.randRange(Math.random, 12, 22));
        return;                                             // one a frame, at most
      }
    }
  }

  function spawnBubble() {
    var fc = GAME.focus();
    var live = 0;
    for (var i = 0; i < world.peds.length; i++) if (!world.peds[i].isCop && !world.peds[i].dead) live++;
    var maxP = GAME.perf.budget(GAME.settings.maxPeds);
    for (var tries = 0; tries < 5 && live < maxP; tries++) {
      var a = Math.random() * Math.PI * 2;
      var r = U.randRange(Math.random, 60, GAME.settings.bubbleRadius);
      var x = fc.x + Math.cos(a) * r, z = fc.z + Math.sin(a) * r;
      var isla = GAME.isla && GAME.isla.contains(x, z);
      // the mainland's east edge is the boardwalk; over on the island the
      // pavement follows whatever curve the road takes
      if (!isla && x > 340 && x < 700) x = U.randRange(Math.random, 356, 372);
      var rp = GAME.city.nearestRoadPoint(x, z);
      var off = 8.4 * (Math.random() < 0.5 ? 1 : -1);
      var px, pz;
      if (rp.axis === 'net') {
        px = rp.x + Math.cos(rp.heading) * off;
        pz = rp.z - Math.sin(rp.heading) * off;
      } else if (rp.axis === 'z') { px = rp.x + off; pz = rp.z; }
      else { px = rp.x; pz = rp.z + off; }
      if (!isla && x > 340 && x < 700) { px = x; pz = z; }
      if (rp.axis !== 'net' && (px < -490 || px > 372 || Math.abs(pz) > 490)) continue;
      if (GAME.city.isInWater(px, pz)) continue;
      if (GAME.city.inAirport(px, pz)) continue; // no strollers on the runway
      var ped = spawnPed(px, pz);
      newWaypoint(ped);
      live++;
    }
  }

  // how many brawls are already going, so a bad roll cannot turn the whole
  // street into a boxing gym at once (GAME.chaos.maxFights)
  // One punch every PUNCH_CYCLE seconds, and how long the fighting pose
  // survives a frame out of reach. 0.55 was fast enough to read as flailing
  // once two people were doing it at each other.
  var PUNCH_CYCLE = 0.72, POSE_HOLD = 0.35;
  // How fast the leading arm is allowed to travel into a strike, rad/s. The
  // jab itself covers 1.05 rad in 0.14 s — 7.5 rad/s — so at twice that the
  // swing is not slowed at all and only a jump is clipped. See the punch
  // block for what was jumping.
  var STRIKE_RATE = 15;

  function fightCount() {
    var n = 0;
    for (var i = 0; i < world.peds.length; i++) {
      var p = world.peds[i];
      if (!p.dead && !p.isCop && p.state === 'attack') n++;
    }
    return n;
  }

  // Commit this one to a fight. Returns false if it did not take — the
  // ceiling is full, or the target is not something to fight.
  function startFight(ped, foe, secs) {
    if (ped.dead || ped.gone || ped.isCop || ped.jobPed) return false;
    if (foe && foe.kind === 'ped' && (!foe.ped || foe.ped.dead || foe.ped.gone || foe.ped === ped)) return false;
    // An existing brawler is already counted; a fresh one has to fit. But
    // SWINGING BACK is not a new fight, it is the other half of one that is
    // already running — and counting it as new was most of the reason fights
    // looked one-sided. The ceiling counts bodies, so a mutual brawl cost two
    // of them: at LIVELY's cap of three you could have one real fight and one
    // man being chased, and never two real ones.
    var answering = foe && foe.kind === 'ped' && foe.ped &&
      foe.ped.state === 'attack' && foe.ped.foe && foe.ped.foe.ped === ped;
    if (!answering && ped.state !== 'attack' && fightCount() >= GAME.chaos.maxFights) return false;
    ped.state = 'attack';
    ped.attackT = secs || 9;
    ped.foe = foe || null;
    ped.stuckT = 0;
    // Some of them are carrying. Rolled once and remembered, so the man who
    // pulled a gun in one scuffle is the same man in the next rather than a
    // fresh coin toss every time he squares up.
    if (ped.carrying === undefined) ped.carrying = GAME.chaos.roll(GAME.chaos.armedChance);
    GAME.audio.yelp(ped.pos.x, ped.pos.z);
    // Somebody may want a word about this. Only trouble between OTHER people
    // is reported — a fight the player is in is what the wanted level is for,
    // and routing it through here as well would have the law turn up twice
    // for the same thing.
    if (foe && foe.kind !== 'player' && GAME.police.reportIncident) {
      GAME.police.reportIncident(ped.pos.x, ped.pos.z, ped, 1);
    }
    return true;
  }

  // Turn and run from wherever the trouble came from.
  function startFlee(ped, fromX, fromZ, secs) {
    ped.state = 'flee';
    ped.fleeT = secs || 6;
    ped.fleeX = fromX; ped.fleeZ = fromZ;
    ped.foe = null;
  }

  // `attacker` is the ped who did it, or undefined when it was the player.
  // Which one it is decides both whether swinging back is even on the table
  // and, if not, which way they run.
  function damage(ped, amt, byPlayer, attacker) {
    if (ped.dead) return;
    ped.hp -= amt;
    GAME.fx.spawn(ped.pos.x, 1.2, ped.pos.z, { count: 3, color: 0xc42848, spread: 1, vy: 1, life: 0.3, grav: -3 });
    if (ped.hp <= 0) { kill(ped, 'shot', byPlayer, attacker); return; }
    if (ped.isCop) return;
    // Not everyone runs — and whoever DOES turn to fight, fights. The old
    // hp floor made every brawler quit after two punches, which read as
    // no fight at all. Once committed, they go the distance; only someone
    // nearly dead before it starts thinks better of it.
    var spirit = (ped.state === 'attack' || ((ped.temper || 0) > 0.45 && ped.hp > 4));
    var fights;
    if (attacker) {
      // Hit by another stranger. This is the case that did not exist at all
      // before — the old rule was `byPlayer && ...`, so a punch from anyone
      // else could not start anything and the pavement never fought with
      // itself. It is rated, because a city where every shove becomes a
      // brawl is as unreal as one where none of them do.
      // Hit by another stranger, and standing there taking it is the one
      // outcome nobody wants to watch. `spirit` alone gates on temper, which
      // already excludes about half of them; on top of that the roll used to
      // discard a further chunk, and the result was a lot of chasing and very
      // little fighting. Anyone with the temper for it now answers.
      fights = spirit && (GAME.chaos.fightChance > 0 || ped.state === 'attack');
    } else {
      fights = byPlayer && spirit;
    }
    var fromX = attacker ? attacker.pos.x : GAME.player.pos.x;
    var fromZ = attacker ? attacker.pos.z : GAME.player.pos.z;
    if (fights && startFight(ped, attacker ? { kind: 'ped', ped: attacker } : null, 9)) return;
    startFlee(ped, fromX, fromZ, 6);
  }

  return { spawnPed: spawnPed, removePed: removePed, kill: kill, panic: panic, damage: damage, update: update, buildPedMesh: buildPedMesh, makeHair: makeHair,
    // so a crash in vehicles.js can put somebody's back up without knowing
    // anything about how a fight is represented
    startFight: startFight, startFlee: startFlee, fightCount: fightCount };
})();
