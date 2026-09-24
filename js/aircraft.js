GAME.aircraft = (function () {
  var chute = null, rig = null;
  var CHUTE_LINES = 6;

  // While the bridges are shut the channel is restricted airspace: you can fly
  // out over the water and see the far shore, and that is as far as you get.
  var CLOSED_X = 560, warnT = 0, warnCount = 0;
  // two fixed answers, handed out rather than built on every ask — everything
  // that moves asks every tick, and nobody writes to them
  var LIMIT_OPEN = { maxX: 1560, minZ: -600, maxZ: 600 };
  var LIMIT_CLOSED = { maxX: CLOSED_X, minZ: -524, maxZ: 524 };
  function airLimit() {
    return GAME.isla && GAME.isla.isOpen() ? LIMIT_OPEN : LIMIT_CLOSED;
  }
  // Three strikes, not one: pressing the line gets a warning, pressing it
  // again gets a final warning, and only the THIRD violation scrambles the
  // air units. Stay clear for half a minute and the count forgives itself.
  function warnAirspace(x, lim) {
    if (x < lim.maxX - 1 || lim.maxX > CLOSED_X) return;
    if (GAME.time - warnT < 4) return;
    if (GAME.time - warnT > 30) warnCount = 0;   // stayed clear: the log is wiped
    warnT = GAME.time;
    warnCount++;
    if (warnCount === 1) GAME.hud.message('RESTRICTED AIRSPACE — turn back.', 2.5);
    else if (warnCount === 2) GAME.hud.message('RESTRICTED AIRSPACE — FINAL WARNING. Turn back NOW.', 2.5);
    else if (GAME.police.airspaceStrike) GAME.police.airspaceStrike();
  }
  // The restriction starts at SEA LEVEL, not at altitude. The barrier gate
  // and the aircraft clamp used to be the only teeth the closed channel had:
  // parachute down onto the bridge deck past the gate and nothing stopped a
  // stroll to the island. Now the line at x=560 stops ANYTHING — a walker on
  // the deck, a car that hopped the gate, a drifting canopy — with the same
  // clamp and the same three-strike ladder the aircraft get.
  function enforceAirspace(pos) {
    var lim = airLimit();
    if (pos.x > lim.maxX) pos.x = lim.maxX;
    warnAirspace(pos.x, lim);
  }

  // The airframe wears its damage out loud. Hard landings and wall grazes
  // chip aircraft hp silently, and the first anyone knew was the explosion
  // on the next takeoff — "I was at 100% health" (the PLAYER was; the
  // aircraft wasn't). Threshold crossings now announce themselves.
  function warnAirframe(car) {
    var f = car.hp / car.spec.hp;
    if (f <= 0.2 && car.airframeWarn !== 2) {
      car.airframeWarn = 2;
      GAME.hud.message('The airframe is coming apart — one more knock ends it.', 3.5);
      GAME.audio.sting('busted');
      GAME.haptics.onFire();
    } else if (f <= 0.45 && f > 0.2 && car.airframeWarn !== 1) {
      car.airframeWarn = 1;
      GAME.hud.message('The airframe is damaged — land gently.', 3);
      GAME.haptics.smoking();
    }
  }

  // arcade helicopter: collective (up/down), cyclic (nose tilt = forward),
  // pedal (yaw). Called from player.js while the player flies a heli.
  function updateHeli(dt) {
    var P = GAME.player, car = P.car, inp = GAME.input, T = inp.touch;
    var up = 0, fwd = 0, yaw = 0;
    if (GAME.key('Space')) up += 1;
    if (GAME.key('ShiftLeft') || GAME.key('ShiftRight') || GAME.key('ControlLeft')) up -= 1;
    if (GAME.key('KeyW')) fwd += 1;
    if (GAME.key('KeyS')) fwd -= 1;
    if (GAME.key('KeyA')) yaw += 1;
    if (GAME.key('KeyD')) yaw -= 1;
    if (T.active) {
      fwd += -T.stickY; yaw += -T.stickX;
      up += (T.gas ? 1 : 0) - (T.brake ? 1 : 0); // GAS climbs, BRAKE descends
    }

    car.heading += yaw * 1.7 * dt;

    // vertical: lift vs gravity, hover a touch above neutral so it drifts down slowly
    car.vy = (car.vy || 0) + (up * 16 - 9.2) * dt;
    car.vy = U.clamp(car.vy * Math.exp(-0.8 * dt), -14, 15);
    car.pos.y += car.vy * dt;

    // horizontal: tilt the nose to slide in the facing direction
    car.heliSpeed = U.damp(car.heliSpeed || 0, fwd * car.spec.maxSpeed, 1.6, dt);
    var nx = car.pos.x + Math.sin(car.heading) * car.heliSpeed * dt;
    var nz = car.pos.z + Math.cos(car.heading) * car.heliSpeed * dt;
    // blocked only when flying into a wall below its roof; above the roof you fly over / land on it
    if (car.pos.y < GAME.city.surfaceY(nx, nz) - 0.8) {
      nx = car.pos.x; nz = car.pos.z;
      if (Math.abs(car.heliSpeed) > 9) { GAME.vehicles.damageCar(car, 7, 'wall'); GAME.cameraShake = 0.5; }
      car.heliSpeed *= 0.25;
    }
    var lim = airLimit();
    car.pos.x = U.clamp(nx, -524, lim.maxX);
    car.pos.z = U.clamp(nz, lim.minZ, lim.maxZ);
    warnAirspace(car.pos.x, lim);

    // Land on whatever surface is below (terrain or a rooftop). The floor is
    // skid height, not cabin height — at +1.4 a "landed" helicopter hung in
    // the air over the road, skids a full metre off the tarmac.
    var minY = GAME.city.surfaceY(car.pos.x, car.pos.z) + 0.05;
    if (car.pos.y < minY) {
      car.pos.y = minY;
      // no floats on this airframe: set down on open water and it goes under
      if (GAME.city.isInWater(car.pos.x, car.pos.z, car.pos.y)) {
        GAME.hud.message('The sea took it.', 3);
        GAME.vehicles.sinkCar(car);
        return;
      }
      if (car.vy < -9) { GAME.vehicles.damageCar(car, -car.vy * 3, 'wall'); GAME.cameraShake = Math.min(1, -car.vy / 12); }
      if (car.vy < 0) car.vy = 0;
    }

    GAME.audio.engineState(true, 0.42 + Math.min(0.5, Math.abs(car.heliSpeed) / car.spec.maxSpeed * 0.4 + (up > 0 ? 0.15 : 0)), 'heli');
    car.mesh.rotation.set(fwd * -0.16, car.heading, -yaw * 0.18);
    if (car.spec.gunship) updateGunship(car, dt, inp, T);
    warnAirframe(car);
  }

  // ---------- the TALON's arsenal ----------
  // Chin gun rakes the ground ahead of the nose (hold fire), rockets thump
  // out on the right hand (or the AIM button) and detonate where they land.
  var rockets = [];
  // a rocket's trail, laid every tick of its flight (made once; fx.spawn only reads it)
  var FX_ROCKET_TRAIL = { count: 1, color: 0xffd080, spread: 0.12, life: 0.16 };
  function hitAt(x, z, rad, dmg, byPlayer) {
    var cars = GAME.world.cars, P = GAME.player;
    for (var i = 0; i < cars.length; i++) {
      var c = cars[i];
      if (c.dead || (P.inCar && c === P.car)) continue;
      if (U.dist2(c.pos.x, c.pos.z, x, z) < rad * rad) {
        // 'shot' is the NPC-fire source, which attribution deliberately
        // ignores — without the explicit flag the TALON's guns were
        // invisible to the law against vehicles (ped hits already counted):
        // rocketing a cruiser next to a witness left the warrant at zero
        GAME.vehicles.damageCar(c, dmg, 'shot', byPlayer);
        // and the same two crimes the ground guns report on these hits
        if (byPlayer) {
          if (c.isPolice && !c.mission) GAME.police.reportCrime('hit_cop_car', P.pos);
          else if (c.ai && c.ai.mode === 'traffic') GAME.police.reportCrime('shoot_car', P.pos);
        }
      }
    }
    var peds = GAME.world.peds;
    var pr = rad * 0.7;
    for (var j = 0; j < peds.length; j++) {
      var pd = peds[j];
      if (pd.dead) continue;
      if (U.dist2(pd.pos.x, pd.pos.z, x, z) < pr * pr) GAME.peds.damage(pd, dmg, true);
    }
  }
  function updateGunship(car, dt, inp, T) {
    car.mgT = (car.mgT || 0) - dt;
    if ((inp.lmb || T.fire) && car.mgT <= 0) {
      car.mgT = 0.09;
      GAME.audio.gunshot('smg');
      var fx2 = Math.sin(car.heading), fz2 = Math.cos(car.heading);
      var alt = Math.max(0, car.pos.y - GAME.city.surfaceY(car.pos.x, car.pos.z));
      var d = U.clamp(alt * 1.6 + 14, 16, 80);
      var ix = car.pos.x + fx2 * d + (Math.random() - 0.5) * 2.6;
      var iz = car.pos.z + fz2 * d + (Math.random() - 0.5) * 2.6;
      var iy = GAME.city.surfaceY(ix, iz);
      GAME.fx.spawn(ix, iy + 0.3, iz, { count: 4, color: 0xffe0a0, spread: 0.9, life: 0.25 });
      hitAt(ix, iz, 3.2, 8, true);
      GAME.police.noteGunfire(car.pos);   // the chin gun is as loud as any gun
    }
    car.rkT = (car.rkT || 0) - dt;
    if ((inp.rmb || T.aim) && car.rkT <= 0) {
      car.rkT = 1.2;
      GAME.audio.gunshot('shotgun');
      // the rocket dives at the same ground point the gun rakes — one aim
      var fx3 = Math.sin(car.heading), fz3 = Math.cos(car.heading);
      var mx2 = car.pos.x + fx3 * 3.2, my2 = car.pos.y - 0.5, mz2 = car.pos.z + fz3 * 3.2;
      var alt2 = Math.max(0, car.pos.y - GAME.city.surfaceY(car.pos.x, car.pos.z));
      var d2 = U.clamp(alt2 * 1.6 + 14, 16, 80);
      var tx = car.pos.x + fx3 * d2, tz = car.pos.z + fz3 * d2;
      var ty = GAME.city.surfaceY(tx, tz);
      var ddx = tx - mx2, ddy = ty - my2, ddz = tz - mz2;
      var dl = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz) || 1;
      rockets.push({ x: mx2, y: my2, z: mz2,
        vx: ddx / dl * 55, vy: ddy / dl * 55, vz: ddz / dl * 55, t: 0, from: car });
      GAME.police.noteGunfire(car.pos);
    }
  }

  // Rockets fly on whatever the player does next. They used to be advanced
  // only inside the gunship's own update, so bailing out left any in flight
  // frozen in the air — each holding the TALON it came from — until the next
  // flight picked them up mid-air. The tick advances them now, flown or not.
  function updateRockets(dt) {
    for (var i = rockets.length - 1; i >= 0; i--) {
      var r = rockets[i];
      r.t += dt;
      r.x += r.vx * dt; r.z += r.vz * dt; r.y += r.vy * dt;
      r.vy -= 9 * dt;
      GAME.fx.spawn(r.x, r.y, r.z, FX_ROCKET_TRAIL);
      var sy = GAME.city.surfaceY(r.x, r.z);
      var hitCar = null;
      if (r.t > 0.15) {
        var cars = GAME.world.cars;
        for (var ci = 0; ci < cars.length; ci++) {
          var cc = cars[ci];
          if (cc === r.from || cc.dead) continue;
          if (Math.abs(cc.pos.y - r.y) < 3 && U.dist2(cc.pos.x, cc.pos.z, r.x, r.z) < 9) { hitCar = cc; break; }
        }
      }
      if (r.y <= sy + 0.2 || hitCar || r.t > 3.5) {
        var ey = Math.max(r.y, sy + 0.6);
        GAME.fx.spawn(r.x, ey, r.z, { count: 26, color: 0xff8030, spread: 4, vy: 4, life: 0.7, grav: 0.4 });
        GAME.fx.flash(r.x, ey + 0.6, r.z, 8);
        GAME.audio.crash(1, r.x, r.z);
        GAME.cameraShake = Math.max(GAME.cameraShake || 0, 0.55);
        // rockets in this array only ever leave the player's TALON
        hitAt(r.x, r.z, 7, 85, true);
        rockets.splice(i, 1);
      }
    }
  }

  // arcade fixed-wing: throttle for speed, pitch to climb once past stall,
  // yaw to turn. Needs runway room to take off and land.
  function updatePlane(dt) {
    var P = GAME.player, car = P.car, inp = GAME.input, T = inp.touch;
    var thr = 0, pitchIn = 0, yawIn = 0, rollIn = 0;
    if (GAME.key('KeyW')) thr += 1;
    if (GAME.key('KeyS')) thr -= 1;
    if (GAME.key('Space')) pitchIn += 1;
    if (GAME.key('ShiftLeft') || GAME.key('ShiftRight') || GAME.key('ControlLeft')) pitchIn -= 1;
    if (GAME.key('KeyA')) yawIn += 1;
    if (GAME.key('KeyD')) yawIn -= 1;
    // Q/E barrel-roll the airframe right the way round
    if (GAME.key('KeyQ')) rollIn += 1;
    if (GAME.key('KeyE')) rollIn -= 1;
    // touch: THR+/THR- buttons drive throttle; the stick is a yoke — pull it
    // back (down) to bring the nose up and climb, push forward (up) to dive.
    if (T.active) { thr += (T.gas ? 1 : 0) - (T.brake ? 1 : 0); pitchIn += T.stickY; yawIn += -T.stickX; }

    var gy = GAME.city.surfaceY(car.pos.x, car.pos.z);
    var onGround = car.pos.y <= gy + car.spec.wheelH + 0.35;
    // the sea is not a runway. Wheels-down on open water the plane is lost —
    // fast and it breaks up, slow and it goes under, leaving you swimming.
    // (Checked here, before the ground branches treat the water as tarmac and
    // let it ski along the surface.)
    if (onGround && GAME.city.isInWater(car.pos.x, car.pos.z, car.pos.y)) {
      if (car.speed > 20) {
        GAME.cameraShake = 1;
        GAME.hud.message('You ditched it in the sea.', 3);
        GAME.vehicles.explodeCar(car, 'water');
      } else {
        GAME.hud.message('The sea took it.', 3);
        GAME.vehicles.sinkCar(car);
      }
      return;
    }

    // on the wheels the engine has to haul the airframe up to rotation
    // speed — the takeoff run is real. At 0.42 the roll was ~20 m and the
    // plane leapt off any side street; 0.17 stretches it past 60 m against
    // the same drag, so a departure needs a genuine runway's worth of
    // ground. Stalled in the air the throttle is nearly useless (no airflow
    // over the wings): recovery comes from the DIVE, so a rooftop departure
    // genuinely drops before it climbs.
    var wasFlying = (car.speed || 0) >= car.spec.stall;
    var acc = car.spec.accel * (onGround && thr > 0 ? 0.17 : (!onGround && !wasFlying ? 0.15 : 1));
    // and on the ground it can taxi backwards out of a corner
    car.speed = U.clamp((car.speed || 0) + thr * acc * dt, onGround ? -7 : 0, car.spec.maxSpeed);
    car.speed *= Math.exp(-0.09 * dt);
    // a booster strip slams a plane's throttle open too — pure speed, no
    // stunt credit (planes never enter the jump scorer)
    if (onGround) {
      var rmp = GAME.city.rampAt(car.pos.x, car.pos.z);
      if (rmp && rmp.boost) {
        if (!car.boostPing) { car.boostPing = true; GAME.audio.pickup(); }
        car.speed = Math.min(car.spec.maxSpeed, car.speed + 55 * dt);
      } else car.boostPing = false;
    }

    car.pitch = car.pitch || 0;
    car.roll = car.roll || 0;
    // on the ground the nose only rotates up once you're at rotation (stall) speed
    if (onGround && car.speed < car.spec.stall) { car.pitch = U.damp(car.pitch, 0, 6, dt); car.roll = U.damp(car.roll, 0, 6, dt); }
    else if (onGround) car.pitch = U.clamp(car.pitch + pitchIn * 1.1 * dt, 0, 0.7);
    else {
      // airborne the elevator is unrestricted, so you can pull a full loop
      car.pitch = U.wrapPI(car.pitch + pitchIn * 1.35 * dt);
      car.roll = U.wrapPI(car.roll + rollIn * 3.2 * dt);
    }

    var yawEff = Math.min(1, car.speed / 22);
    car.heading += yawIn * 1.15 * yawEff * dt;

    // Once stalled, the wings don't bite again at rotation speed: recovery
    // needs a genuine dive to well past stall. Without the hysteresis a
    // rooftop "takeoff" off two metres of gravel barely dipped — the dive
    // term handed the speed back almost before the fall had begun.
    if (onGround) car.stalled = false;
    var flying = car.speed >= car.spec.stall * (car.stalled ? 1.25 : 1);
    var vy;
    if (onGround && (!flying || car.pitch <= 0.06)) {
      vy = 0; car.pos.y = gy + car.spec.wheelH; car.sinkV = 0;
    } else if (flying) {
      car.stalled = false;
      vy = car.speed * Math.sin(car.pitch); car.sinkV = 0;
    } else {
      // stalled: the nose drops and the fall gathers real pace — and the
      // dive trades that height for airspeed. Roll off a rooftop with no
      // runway and the plane genuinely DIVES: it takes a proper drop for the
      // wings to bite, so a low roof is a crash and a tower is a recovery.
      car.stalled = true;
      car.sinkV = Math.min((car.sinkV || 0) + 20 * dt, 26);
      vy = -car.sinkV;
      car.pitch = U.damp(car.pitch, -0.85, 3, dt);
      car.speed = Math.min(car.spec.maxSpeed, car.speed + 14 * Math.sin(-Math.min(car.pitch, 0)) * dt);
    }
    car.pos.y += vy * dt;

    var horiz = car.speed * Math.cos(car.pitch);
    var nx = car.pos.x + Math.sin(car.heading) * horiz * dt;
    var nz = car.pos.z + Math.cos(car.heading) * horiz * dt;
    // flying into a building at speed is a crash, not a bump
    if (car.pos.y < GAME.city.surfaceY(nx, nz) - 0.8) {
      if (car.speed > 18) {
        GAME.cameraShake = 1;
        GAME.hud.message('You flew it into a building.', 3);
        GAME.vehicles.explodeCar(car, 'wall');
        return;
      }
      GAME.vehicles.damageCar(car, car.speed, 'wall');
      car.speed *= 0.3; nx = car.pos.x; nz = car.pos.z;
    }
    var lim = airLimit();
    car.pos.x = U.clamp(nx, -524, lim.maxX);
    car.pos.z = U.clamp(nz, lim.minZ, lim.maxZ);
    warnAirspace(car.pos.x, lim);

    var surf = GAME.city.surfaceY(car.pos.x, car.pos.z);
    if (car.pos.y < surf + car.spec.wheelH) {
      car.pos.y = surf + car.spec.wheelH;
      // a steep arrival over water is the same ditching, caught mid-descent
      if (GAME.city.isInWater(car.pos.x, car.pos.z, car.pos.y)) {
        if (car.speed > 20 || vy < -12) {
          GAME.cameraShake = 1;
          GAME.hud.message('You ditched it in the sea.', 3);
          GAME.vehicles.explodeCar(car, 'water');
        } else {
          GAME.hud.message('The sea took it.', 3);
          GAME.vehicles.sinkCar(car);
        }
        return;
      }
      // a steep arrival, or touching down inverted, writes the aircraft off
      var inverted = Math.abs(U.wrapPI(car.roll || 0)) > 1.1 || Math.abs(U.wrapPI(car.pitch)) > 1.2;
      if (vy < -18 || (vy < -6 && inverted)) {
        GAME.cameraShake = 1;
        GAME.hud.message('Crash landing.', 3);
        GAME.vehicles.explodeCar(car, 'wall');
        return;
      }
      if (vy < -11) { GAME.vehicles.damageCar(car, -vy * 3, 'wall'); GAME.cameraShake = Math.min(1, -vy / 12); }
      // wings level out once you're rolling on the wheels again
      car.roll = U.damp(car.roll, 0, 5, dt);
    }

    GAME.audio.engineState(true, 0.35 + Math.min(0.6, car.speed / car.spec.maxSpeed * 0.6), 'plane');
    // The airframe on tarmac. Speed is what actually shakes it, so one number
    // covers both ends of a flight: the run building up to rotation and the
    // rollout bleeding off after touchdown. The throttle floor is on top of
    // that for the run-up — stood on the brakes with the engine open, a plane
    // is not still. Called every frame this is true and not otherwise, which
    // is the whole of turning it off: step out, pause, or leave the ground and
    // the keepalive lapses on its own.
    GAME.haptics.rumble(onGround
      ? Math.max(Math.abs(car.speed) / car.spec.stall, thr > 0 ? 0.25 : 0)
      : 0);
    // bank into turns on top of any barrel roll the pilot is holding
    car.mesh.rotation.set(-car.pitch, car.heading, car.roll - yawIn * 0.4);
    warnAirframe(car);
  }

  function startParachute(x, y, z, heading) {
    GAME.track('parachute-opened');
    var P = GAME.player;
    P.parachuting = true;
    P.inCar = false; P.car = null; P.onBike = false;
    P.mesh.visible = true;
    P.pos.set(x, y, z);
    P.heading = heading || 0;
    if (!chute) {
      chute = new THREE.Mesh(
        new THREE.SphereGeometry(2.3, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshLambertMaterial({ color: 0xff2f7a, side: THREE.DoubleSide, emissive: 0x40101f })
      );
      GAME.scene.add(chute);
      // rigging lines from the canopy rim down to the harness, so you read as
      // hanging from the chute rather than floating under it
      var lg = new THREE.BufferGeometry();
      lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(CHUTE_LINES * 6), 3));
      rig = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0xf7d8e4 }));
      rig.frustumCulled = false;
      GAME.scene.add(rig);
    }
    chute.visible = true;
    if (rig) rig.visible = true;
    GAME.audio.engineState(false, 0);
    GAME.haptics.chuteOpen();
    GAME.hud.message('Parachute out — WASD to steer, glide to the ground', 3.5);
  }

  function updateParachute(dt) {
    var P = GAME.player, inp = GAME.input, T = inp.touch;
    var mx = 0, mz = 0;
    if (GAME.key('KeyW')) mz += 1;
    if (GAME.key('KeyS')) mz -= 1;
    if (GAME.key('KeyA')) mx -= 1;
    if (GAME.key('KeyD')) mx += 1;
    if (T.active) { mx += T.stickX; mz += -T.stickY; }
    var camYaw = GAME.cam.yaw;
    var wx = Math.sin(camYaw) * mz - Math.cos(camYaw) * mx;
    var wz = Math.cos(camYaw) * mz + Math.sin(camYaw) * mx;
    P.pos.x += wx * 6.5 * dt;
    P.pos.z += wz * 6.5 * dt;
    P.pos.y -= 4.5 * dt;
    // a canopy is still traffic in the restricted zone — no drifting across
    enforceAirspace(P.pos);
    if (mx || mz) P.heading = U.angleLerp(P.heading, Math.atan2(wx, wz), Math.min(1, dt * 5));

    // land on whatever's below — street or a rooftop
    var gy = GAME.city.surfaceY(P.pos.x, P.pos.z);
    P.mesh.position.set(P.pos.x, P.pos.y, P.pos.z);
    P.mesh.rotation.set(0, P.heading, 0);
    var j = P.mesh.userData.joints;
    j.armL.rotation.set(-2.5, 0, -0.3); j.armR.rotation.set(-2.5, 0, 0.3);
    j.legL.rotation.x = 0.25; j.legR.rotation.x = -0.15;
    if (chute) chute.position.set(P.pos.x, P.pos.y + 3.2, P.pos.z);
    if (rig) {
      // canopy rim -> shoulders, swinging with the player's facing
      var a = rig.geometry.attributes.position.array;
      var sy = P.pos.y + 1.45, cy = P.pos.y + 3.3, rr = 2.1;
      for (var i = 0; i < CHUTE_LINES; i++) {
        var ang = P.heading + i / CHUTE_LINES * Math.PI * 2;
        var sx = Math.sin(ang) * 0.24, sz = Math.cos(ang) * 0.24;
        a[i * 6] = P.pos.x + sx; a[i * 6 + 1] = sy; a[i * 6 + 2] = P.pos.z + sz;
        a[i * 6 + 3] = P.pos.x + Math.sin(ang) * rr;
        a[i * 6 + 4] = cy;
        a[i * 6 + 5] = P.pos.z + Math.cos(ang) * rr;
      }
      rig.geometry.attributes.position.needsUpdate = true;
    }

    // Open sea BELOW you is not the same as being in it. isInWater answers for
    // the whole column at (x, z) — its y argument only rules out a deck or a
    // crossing carried over the top, it never asks how high up you are — so
    // testing it every frame of a glide put you in the water the moment you
    // stepped out over the bay, sixty metres up, with the whole beach still
    // inside the canopy's reach. Come down first. What is under you when you
    // get there is what decides which of the two it was.
    if (P.pos.y <= gy + 0.05) {
      land();
      if (GAME.city.isInWater(P.pos.x, P.pos.z, P.pos.y)) { GAME.playerDrown(); return; }
      P.pos.y = gy; P.velY = 0;
      // touchdown, not the other two ways out of a canopy: land() is also what
      // drowning and dying call, and neither of those is a landing
      GAME.haptics.chuteLand();
      GAME.hud.message('Feet dry.', 1.5);
    }
  }

  function land() {
    var P = GAME.player;
    P.parachuting = false;
    if (chute) chute.visible = false;
    if (rig) rig.visible = false;
    var j = P.mesh.userData.joints;
    j.armL.rotation.set(0, 0, 0); j.armR.rotation.set(0, 0, 0);
    j.legL.rotation.x = j.legR.rotation.x = 0;
  }

  return {
    updateHeli: updateHeli,
    updatePlane: updatePlane,
    updateRockets: updateRockets,
    startParachute: startParachute,
    updateParachute: updateParachute,
    land: land,
    enforceAirspace: enforceAirspace,
    get parachuting() { return GAME.player.parachuting; }
  };
})();
