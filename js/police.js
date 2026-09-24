GAME.police = (function () {
  var heat = 0, lastSeen = 0, pinTimer = 0, grabTimer = 0, lastCrime = -99;
  var crimeCooldown = {};
  var roadblockT = 0, spikes = [];
  // What each star COSTS, in offences. The gaps used to be 50/70/90/110/120
  // against a 70-heat pedestrian death, so every level was one more body: run
  // down five people and you had five stars, and a single one you never meant
  // to hit was already a star. Worse, an offence was worth MORE the higher you
  // were flying (see ESCALATION), so the ladder got easier as it went up —
  // exactly backwards.
  //
  // These gaps are set so a serious street crime (kill_ped, 70) takes
  //
  //     2 offences to reach 1 star, then 3, then 4, then 5, then 6
  //
  // — twenty to earn a five-star manhunt from a standing start, against five
  // before. The escalation below is folded into the arithmetic, so those are
  // the counts you actually get and not the counts before it is applied.
  var THRESH = [0, 138, 366, 698, 1148, 1730];
  var HEAT_CEIL = 2200;
  // Offending while already wanted still counts for a little more — the
  // response is ramping up and so is their patience — but at 0.22 it was
  // undoing the ladder faster than the gaps built it.
  var ESCALATION = 0.10;
  var CAR_CAP = [0, 1, 2, 3, 4, 6];

  function stars() {
    var s = 0;
    for (var i = 5; i >= 1; i--) { if (heat >= THRESH[i]) { s = i; break; } }
    return s;
  }

  var CRIME_HEAT = { hit_ped: 20, kill_ped: 70, jack: 58, shoot_car: 18, hit_car: 5, kill_cop: 170, steal_police: 75, hit_cop_car: 26 };
  // crimes that always draw heat even unwitnessed (attacking the law, loud gunfire)
  var ALWAYS = { kill_cop: 1, steal_police: 1 };
  // deaths count per victim — mowing down a crowd shouldn't dedupe to one crime
  var PER_VICTIM = { kill_ped: 1, kill_cop: 1 };

  // a crime only raises the alarm if a cop (any range, LOS) or a civilian
  // (close, LOS) actually sees it — bumping a fender in an empty street is free
  function witnessed(pos) {
    var peds = GAME.world.peds;
    for (var i = 0; i < peds.length; i++) {
      var p = peds[i];
      if (p.dead) continue;
      var range = p.isCop ? 95 : 32;
      if (U.dist2(p.pos.x, p.pos.z, pos.x, pos.z) < range * range &&
        GAME.city.hash.segmentClear(p.pos.x, p.pos.z, pos.x, pos.z)) return true;
    }
    return false;
  }

  var lastCopKillT = -99;
  function reportCrime(type, pos) {
    // dead men draw no stars: while the wasted/busted screen is up nothing
    // the world does — a rammed cruiser cooking off, a fire spreading — can
    // hang new heat on the player
    if (GAME.player.state !== 'alive') return;
    var now = GAME.time;
    if (!PER_VICTIM[type] && crimeCooldown[type] && now - crimeCooldown[type] < 1.2) return;
    if (!ALWAYS[type] && !witnessed(pos)) return; // nobody saw it
    crimeCooldown[type] = now;
    lastCrime = now;
    var before = stars();
    // offending while already wanted escalates faster — the response ramps up
    var gain = (CRIME_HEAT[type] || 20) * (1 + before * ESCALATION);
    if (type === 'kill_cop') {
      // a burst of cop kills is ONE firefight, not a ladder to five stars:
      // two officers stepping into your bumper used to jump 1 -> 5 in a
      // second. Kills inside the same eight seconds barely add heat; the
      // floor still guarantees that killing the law is serious at once.
      if (now - lastCopKillT < 8) gain = 60;
      lastCopKillT = now;
    }
    heat = Math.min(HEAT_CEIL, heat + gain);
    // TWO stars for the first officer, not three. Killing the law has to be
    // instantly serious or the floor means nothing — but landing on three left
    // one more offence of any kind sitting on the edge of a four-star response,
    // which is how a single mistake at one star turned into a manhunt. It
    // takes three officers to reach three stars now, five for four, eight for
    // five.
    if (type === 'kill_cop') heat = Math.max(heat, THRESH[2] + 10);
    if (type === 'steal_police') heat = Math.max(heat, THRESH[1] + 5);
    // and no single offence moves the needle more than one star past where
    // you stood (except that cop-kill floor) — five stars are EARNED
    var capStar = Math.max(type === 'kill_cop' ? 2 : 0, Math.min(5, before + 1));
    if (capStar < 5) heat = Math.min(heat, THRESH[capStar + 1] - 8);
    lastSeen = 0;
    var after = stars();
    if (after > before) { GAME.hud.wantedChanged(after); if (after >= 3) GAME.track('wanted-' + after); }
  }

  function noteGunfire(pos) {
    if (GAME.player.state !== 'alive') return;   // see reportCrime
    var now = GAME.time;
    if (crimeCooldown.gunfire && now - crimeCooldown.gunfire < 2.5) return;
    // public gunfire: anyone nearby to hear it
    var heard = false;
    var peds = GAME.world.peds;
    for (var i = 0; i < peds.length; i++) {
      if (!peds[i].dead && U.dist2(peds[i].pos.x, peds[i].pos.z, pos.x, pos.z) < 1600) { heard = true; break; }
    }
    if (!heard) return;
    crimeCooldown.gunfire = now;
    lastCrime = now;
    var before = stars();
    heat = Math.max(heat + 55 * (1 + before * ESCALATION), THRESH[1] + 5);
    heat = Math.min(HEAT_CEIL, heat);
    lastSeen = 0;
    if (stars() > before) GAME.hud.wantedChanged(stars());
  }

  function setWanted(n) {
    n = U.clamp(Math.floor(n), 0, 5);
    heat = n === 0 ? 0 : THRESH[n] + 25;
    // treat it like a fresh offence so the level doesn't bleed away instantly
    if (n > 0) lastCrime = GAME.time;
    GAME.hud.wantedChanged(n);
    if (n === 0) clearCops();
  }

  function clearWanted() { setWanted(0); }

  function clearCops() {
    // Stand down, don't vanish: a cruiser deleted mid-frame in front of the
    // player reads as a magic trick. Pursuers turn back into ordinary
    // traffic and drive off; officers on foot holster up and walk away as
    // civilians — the regular distance cleanup collects them all off-screen.
    var cars = GAME.world.cars;
    for (var i = cars.length - 1; i >= 0; i--) {
      var c = cars[i];
      var pursuing = c.ai && (c.ai.mode === 'chase' || c.ai.mode === 'roadblock');
      if (c.isPolice && !c.dead && pursuing && c !== GAME.player.car) {
        c.ai = { mode: 'traffic', desired: 11, laneX: 0, laneZ: 0 };
      }
    }
    var peds = GAME.world.peds;
    for (var j = peds.length - 1; j >= 0; j--) {
      var p = peds[j];
      if (p.isCop && !p.dead) {
        p.isCop = false;               // released from police.js's control
        p.temper = 0;                  // and not looking for a rematch
        p.aimPose = false;
        p.state = 'flee';
        p.fleeT = 8;
        p.fleeX = GAME.player.pos.x; p.fleeZ = GAME.player.pos.z;
      }
    }
    clearSpikes();
    pinTimer = 0;
  }

  function clearSpikes() {
    for (var i = 0; i < spikes.length; i++) { GAME.scene.remove(spikes[i].mesh); disposeTree(spikes[i].mesh); }
    spikes = [];
  }
  // A long chase at four stars lays a strip at every roadblock, and nothing
  // took them up again until the stars ran out: twenty minutes in, a hundred
  // of them across the city. Only the newest few are ever ahead of anyone, so
  // the oldest goes when a new one is laid, and any the chase has left far
  // behind are taken up (the same range at which a cruiser is sent home).
  var MAX_SPIKES = 3, SPIKE_KEEP_R = 260;
  function dropSpike(i) {
    GAME.scene.remove(spikes[i].mesh);
    disposeTree(spikes[i].mesh);
    spikes.splice(i, 1);
  }

  // The pursuit's working lists are asked for every tick, so they are kept
  // and refilled rather than built new each time: a caller reads one before
  // the next tick asks again, and nobody holds on to it past that.
  var copBuf = [], chaseBuf = [], pedBuf = [];
  function copCars() {
    copBuf.length = 0;
    var cars = GAME.world.cars;
    for (var i = 0; i < cars.length; i++) {
      var c = cars[i];
      if (c.isPolice && !c.dead && c.ai && (c.ai.mode === 'chase' || c.ai.mode === 'roadblock')) copBuf.push(c);
    }
    return copBuf;
  }

  // ---------- the air unit ----------
  // The chopper is the top of the response ladder: it lifts off at 4-5
  // stars. Restricted airspace runs a three-strike ladder (see aircraft.js):
  // two warnings first, and the THIRD violation is the 5-star response,
  // birds up and firing.
  var airUnits = [];
  // The searchlight never changes shape or colour, so every bird carries the
  // same cone and material, built the first time one lifts off. Shared, so
  // disposeTree leaves them for the next one.
  var beamGeo = null, beamMat = null;
  function airspaceStrike() {
    if (stars() < 5) {
      setWanted(5);
      GAME.hud.message('RESTRICTED AIRSPACE VIOLATION — air units scrambled.', 3);
    } else setWanted(5);   // keep the heat pegged while the line is pressed
  }
  function spawnAirUnit() {
    var f = GAME.focus();
    var a = Math.random() * Math.PI * 2;
    var h = GAME.vehicles.spawnCar('helicopter', f.x + Math.cos(a) * 120, f.z + Math.sin(a) * 120, 0, { color: 0x24365e });
    if (!h) return;
    h.aiAir = true; h.isPolice = true;
    h.ai = { mode: 'air' };
    // "I was getting shot at but couldn't see police helicopters anywhere" —
    // a near-black airframe hanging behind and above the player at night was
    // invisible. The unit now announces itself the way a police bird does:
    // a searchlight cone reaching down toward the target, and red/blue
    // strobes. Both ride the mesh, so they move, blink and die with it.
    if (!beamGeo) {
      beamGeo = new THREE.ConeGeometry(7, 26, 12, 1, true);
      beamGeo.userData.shared = true;
      beamMat = new THREE.MeshBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: 0.15, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
      beamMat.userData.shared = true;
    }
    var beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(0, -12.6, 1.6);   // apex under the chin, cone reaching down
    beam.rotation.x = -0.12;            // leant toward whatever the nose points at
    h.mesh.add(beam);
    // the strobes blink by `visible`, never by material, so they can wear the
    // same shared lamps as a cruiser's lightbar
    var strobeR = new THREE.Mesh(sharedBoxGeo(0.5, 0.28, 0.5), sharedBasic(0xff2030));
    strobeR.position.set(-0.9, 2.3, -0.6);
    var strobeB = new THREE.Mesh(sharedBoxGeo(0.5, 0.28, 0.5), sharedBasic(0x2050ff));
    strobeB.position.set(0.9, 2.3, -0.6);
    var strobeT = new THREE.Mesh(sharedBoxGeo(0.34, 0.34, 0.34), sharedBasic(0xff2030));
    strobeT.position.set(0, 1.9, -5.1);   // tail beacon
    h.mesh.add(strobeR); h.mesh.add(strobeB); h.mesh.add(strobeT);
    h.airLights = [strobeR, strobeB, strobeT];
    var P = GAME.player;
    var fy = P.inCar && P.car ? P.car.pos.y : P.pos.y;
    h.pos.y = Math.max(GAME.city.surfaceY(h.pos.x, h.pos.z), fy) + 34;
    airUnits.push(h);
  }
  function updateAirUnits(dt, s) {
    var P = GAME.player;
    var want = s >= 5 ? 2 : s >= 4 ? 1 : 0;
    // compacted in place: this runs every tick, birds or no birds
    var keep = 0;
    for (var k = 0; k < airUnits.length; k++) {
      var au = airUnits[k];
      if (!au.dead && GAME.world.cars.indexOf(au) >= 0) airUnits[keep++] = au;
    }
    airUnits.length = keep;
    if (airUnits.length < want && GAME.frame % 90 === 0) spawnAirUnit();
    var f = GAME.focus();
    var fy = P.inCar && P.car ? P.car.pos.y : P.pos.y;
    for (var i = airUnits.length - 1; i >= 0; i--) {
      var h = airUnits[i];
      var leaving = i >= want;
      var dx = f.x - h.pos.x, dz = f.z - h.pos.z;
      var d = Math.sqrt(dx * dx + dz * dz) || 1;
      // hold station ~20m off the target; a spare or dismissed bird flies out
      var spd = leaving ? 26 : U.clamp((d - 20) * 0.8, 0, 38);
      var sgn = leaving ? -1 : 1;
      h.pos.x += sgn * (dx / d) * spd * dt;
      h.pos.z += sgn * (dz / d) * spd * dt;
      h.heading = Math.atan2(dx, dz);
      var targetY = Math.max(GAME.city.surfaceY(h.pos.x, h.pos.z) + 22, fy + (leaving ? 42 : 16));
      h.pos.y = U.damp(h.pos.y, targetY, 1.4, dt);
      h.mesh.rotation.set(spd > 4 && !leaving ? -0.12 : 0, h.heading, 0);
      // strobes: the same two-phase flash the cruisers run
      if (h.airLights) {
        var phase = (GAME.time * 8 | 0) % 2 === 0;
        h.airLights[0].visible = phase;
        h.airLights[1].visible = !phase;
        h.airLights[2].visible = phase;
      }
      if (leaving) {
        if (d > 240) { GAME.vehicles.removeCar(h); airUnits.splice(i, 1); }
        continue;
      }
      if (s >= 4) {
        h.fireT = (h.fireT || 0) - dt;
        if (d < 85 && h.fireT <= 0) {
          h.fireT = 1.35;
          GAME.audio.gunshot('smg', h.pos.x, h.pos.z);
          // a fast target is hard to hit from a hovering doorway — and a
          // runner on foot gets suppressing fire, not a firing squad (the
          // sprint to a parked getaway plane must stay survivable)
          var onFoot = !(P.inCar && P.car);
          var mspd = onFoot ? (P.moveSpeed || 0) : Math.abs(P.car.speed);
          var hit = Math.random() < U.clamp(0.5 - mspd * 0.018, 0.1, 0.5) * (onFoot ? 0.5 : 1);
          var ix = f.x + (Math.random() - 0.5) * (hit ? 1.2 : 8);
          var iz = f.z + (Math.random() - 0.5) * (hit ? 1.2 : 8);
          // the fire visibly comes FROM the bird: muzzle flash at the door
          // gun and a tracer down to the impact, so getting shot at is never
          // a mystery even when the airframe itself is behind the camera
          GAME.fx.flash(h.pos.x, h.pos.y - 0.6, h.pos.z, 1.2);
          GAME.fx.tracer(h.pos.x, h.pos.y - 0.8, h.pos.z, ix, fy + 0.5, iz);
          GAME.fx.spawn(ix, fy + 0.4, iz, { count: 6, color: 0xffe0a0, spread: 1.2, life: 0.3 });
          if (hit) {
            if (P.inCar && P.car) GAME.vehicles.damageCar(P.car, 4, 'shot');
            else GAME.playerDamage(3, 'shot');
          }
        }
      }
    }
  }

  function spawnCruiser() {
    var P = GAME.player;
    var px = P.inCar && P.car ? P.car.pos.x : P.pos.x;
    var pz = P.inCar && P.car ? P.car.pos.z : P.pos.z;
    for (var tries = 0; tries < 6; tries++) {
      var a = Math.random() * Math.PI * 2;
      var r = U.randRange(Math.random, 130, 190);
      var rp = GAME.city.nearestRoadPoint(px + Math.cos(a) * r, pz + Math.sin(a) * r);
      // island road points come back with axis 'net' and live far outside the
      // mainland box — the same convention traffic already honors. Without it
      // Isla Verde had no pursuit below air-unit stars: nothing ever spawned,
      // nothing ever saw you, and the heat quietly erased itself.
      var onIsla = rp.axis === 'net';
      if (!onIsla && (rp.x < -480 || rp.x > 352 || Math.abs(rp.z) > 480)) continue;
      // the candidate ring is 130-190 m out, but mid-channel the nearest
      // ROAD to a candidate can be a distant shore — a cruiser spawned there
      // was culled by the 260 m rule the next frame, a spawn into the void
      if (U.dist2(rp.x, rp.z, px, pz) > 230 * 230) continue;
      var clear = true;
      for (var c = 0; c < GAME.world.cars.length; c++) {
        if (U.dist2(GAME.world.cars[c].pos.x, GAME.world.cars[c].pos.z, rp.x, rp.z) < 80) { clear = false; break; }
      }
      if (!clear) continue;
      var heading = Math.atan2(px - rp.x, pz - rp.z);
      var car = GAME.vehicles.spawnCar('police', rp.x, rp.z, heading, { occupied: 'ai', ai: { mode: 'chase' } });
      car.copsOut = 0;
      car.shootT = U.randRange(Math.random, 0.6, 1.6);
      return car;
    }
    return null;
  }

  function spawnFootCop(x, z) {
    var cop = GAME.peds.spawnPed(x, z, { cop: true });
    cop.state = 'chase';
    return cop;
  }

  // at 2+ stars officers close in on foot too, appearing from nearby streets
  var footSpawnT = 0;
  function maintainFootCops(s, dt) {
    if (s < 2) return;
    footSpawnT -= dt;
    if (footSpawnT > 0) return;
    footSpawnT = U.randRange(Math.random, 1.6, 3.2);
    var footCount = 0;
    for (var i = 0; i < GAME.world.peds.length; i++) if (GAME.world.peds[i].isCop && !GAME.world.peds[i].dead) footCount++;
    if (footCount >= Math.min(1 + s, 6)) return;
    var f = GAME.focus();
    for (var t = 0; t < 8; t++) {
      var a = Math.random() * Math.PI * 2, r = U.randRange(Math.random, 26, 48);
      var rp = GAME.city.nearestRoadPoint(f.x + Math.cos(a) * r, f.z + Math.sin(a) * r);
      // same island-aware bounds as the cruisers above
      if (rp.axis !== 'net' && (rp.x < -470 || rp.x > 352 || Math.abs(rp.z) > 470)) continue;
      if (GAME.city.isInWater(rp.x, rp.z)) continue;
      // near-ring candidates (26-48 m) can also resolve to a distant shore
      // mid-channel — an officer materializing 300 m away serves nobody
      if (U.dist2(rp.x, rp.z, f.x, f.z) < 22 * 22 || U.dist2(rp.x, rp.z, f.x, f.z) > 80 * 80) continue;
      spawnFootCop(rp.x, rp.z);
      return;
    }
  }

  // ---- the beat, and what happens on it -------------------------------
  //
  // Everything below is about police who are NOT after the player. It is
  // deliberately not a second wanted level: there is no per-suspect heat, no
  // stars for anyone else, no dispatch model. An incident is a place, a
  // suspect and a clock, and an officer walks over and deals with it. That
  // buys the thing that was missing — the law reacting to something you did
  // not do — without turning a module built around one pursuit into one
  // built around many.
  //
  // The hard rule is at the bottom: the player's pursuit always wins. An
  // officer in the middle of a scuffle drops it the moment you earn a star.
  var incidents = [];
  var patrolT = 0;

  function patrolCount() {
    var n = 0;
    for (var i = 0; i < GAME.world.peds.length; i++) {
      var p = GAME.world.peds[i];
      if (p.isCop && p.patrol && !p.dead) n++;
    }
    return n;
  }

  // A couple of officers on foot in the bubble, so there is somebody to
  // notice. Kept small on purpose: this is scenery that can act, not a
  // garrison, and every one of them costs the same per-frame work a stroller
  // does out of a budget of eighteen.
  function maintainPatrol(dt) {
    if (!GAME.chaos.policeRespond) return;
    patrolT -= dt;
    if (patrolT > 0) return;
    patrolT = U.randRange(Math.random, 3, 6);
    var want = GAME.chaos.level >= 3 ? 2 : 1;
    if (patrolCount() >= want) return;
    var f = GAME.focus();
    for (var t = 0; t < 6; t++) {
      var a = Math.random() * Math.PI * 2, r = U.randRange(Math.random, 45, 85);
      var rp = GAME.city.nearestRoadPoint(f.x + Math.cos(a) * r, f.z + Math.sin(a) * r);
      if (rp.axis !== 'net' && (rp.x < -470 || rp.x > 352 || Math.abs(rp.z) > 470)) continue;
      if (GAME.city.isInWater(rp.x, rp.z)) continue;
      var d2 = U.dist2(rp.x, rp.z, f.x, f.z);
      if (d2 < 35 * 35 || d2 > 110 * 110) continue;
      var cop = GAME.peds.spawnPed(rp.x, rp.z, { cop: true });
      cop.patrol = true;
      cop.state = 'walk';
      cop.armed = true;
      return;
    }
  }

  // Somebody did something. `severity` 1 is a scuffle, 2 is a body or a gun.
  function reportIncident(x, z, suspect, severity) {
    if (!GAME.chaos.policeRespond) return null;
    if (!suspect || suspect.dead || suspect.gone) return null;
    // one open case per suspect — a long brawl is not twenty incidents
    for (var i = 0; i < incidents.length; i++) {
      if (incidents[i].suspect === suspect) {
        incidents[i].severity = Math.max(incidents[i].severity, severity || 1);
        incidents[i].t = 0;
        incidents[i].x = x; incidents[i].z = z;
        return incidents[i];
      }
    }
    if (incidents.length > 4) return null;
    var inc = { x: x, z: z, suspect: suspect, severity: severity || 1, t: 0, cop: null };
    incidents.push(inc);
    return inc;
  }

  // An officer attending: walk to the scene, then to the suspect; the suspect
  // legs it when the law gets close. It ends when the suspect is gone, the
  // clock runs out, or the player earns a star and everyone has better things
  // to do.
  function updateIncidents(dt, s) {
    for (var i = incidents.length - 1; i >= 0; i--) {
      var inc = incidents[i];
      inc.t += dt;
      var sus = inc.suspect;
      var dead = !sus || sus.dead || sus.gone;
      if (dead || inc.t > 26 || s > 0 || !GAME.chaos.policeRespond) {
        if (inc.cop && !inc.cop.dead && !inc.cop.gone) { inc.cop.onCase = null; inc.cop.state = 'walk'; }
        incidents.splice(i, 1);
        continue;
      }
      inc.x = sus.pos.x; inc.z = sus.pos.z;
      if (!inc.cop || inc.cop.dead || inc.cop.gone) {
        inc.cop = null;
        // nearest free officer on the beat
        var best = null, bd = 1e9;
        for (var c = 0; c < GAME.world.peds.length; c++) {
          var p = GAME.world.peds[c];
          if (!p.isCop || !p.patrol || p.dead || p.onCase) continue;
          var d2 = U.dist2(p.pos.x, p.pos.z, inc.x, inc.z);
          if (d2 < bd) { bd = d2; best = p; }
        }
        if (!best) continue;
        inc.cop = best;
        best.onCase = inc;
      }
      var cop = inc.cop;
      var d = stepCop(cop, inc.x, inc.z, dt, 6.4);
      // A gun is a different call. The officer does not walk up to a man who
      // is shooting: he stops at a distance and draws, and the aim model is
      // the same one that decides whether his round finds the player.
      if (inc.severity >= 2 && d < 26 && d > 4 &&
        GAME.city.hash.segmentClear(cop.pos.x, cop.pos.z, inc.x, inc.z)) {
        cop.speed = U.damp(cop.speed, 0, 6, dt);
        cop.mesh.userData.joints.armR.rotation.x = -Math.PI / 2;
        cop.shootT -= dt;
        if (cop.shootT <= 0) {
          cop.shootT = U.randRange(Math.random, 1.0, 1.9);
          GAME.combat.npcShoot(cop.pos.x, 1.35, cop.pos.z, 0.35, 8, cop, sus);
        }
        continue;
      }
      // close enough to be told to break it up: the fight stops and they run
      if (d < 3.2) {
        if (sus.state === 'attack') GAME.peds.startFlee(sus, cop.pos.x, cop.pos.z, 7);
        if (inc.t > 3) {
          cop.onCase = null; cop.state = 'walk';
          incidents.splice(i, 1);
        }
      }
    }
  }

  // Walk an officer toward a point and animate the legs. Returns how far away
  // it still is. Shared by the callout and the idle beat below — peds.js does
  // not move officers (it skips them entirely), so anything a cop does when
  // there is no pursuit has to be driven from here.
  function stepCop(cop, tx, tz, dt, want) {
    var dx = tx - cop.pos.x, dz = tz - cop.pos.z;
    var d = Math.sqrt(dx * dx + dz * dz);
    cop.heading = U.angleLerp(cop.heading, Math.atan2(dx, dz), Math.min(1, dt * 6));
    cop.speed = U.damp(cop.speed, d > 2.2 ? want : 0, 5, dt);
    var kx = cop.pos.x, kz = cop.pos.z;
    cop.pos.x += Math.sin(cop.heading) * cop.speed * dt;
    cop.pos.z += Math.cos(cop.heading) * cop.speed * dt;
    if (!GAME.city.canWalkTo(kx, kz, cop.pos.x, cop.pos.z)) { cop.pos.x = kx; cop.pos.z = kz; }
    var rp = GAME.resolveCircle(cop.pos.x, cop.pos.z, 0.4);
    cop.pos.x = rp.x; cop.pos.z = rp.z;
    cop.pos.y = GAME.city.groundY(cop.pos.x, cop.pos.z);
    cop.mesh.rotation.y = cop.heading;
    cop.walkPhase += cop.speed * dt * 2.2;
    var j = cop.mesh.userData.joints;
    var sw = Math.sin(cop.walkPhase) * Math.min(1, cop.speed / 2.2) * 0.7;
    j.legL.rotation.x = sw; j.legR.rotation.x = -sw;
    j.armL.rotation.x = -sw * 0.8; j.armR.rotation.x = sw * 0.8;
    return d;
  }

  // An officer with nothing to attend still has to look like an officer on a
  // beat rather than a bollard in a hat.
  function walkTheBeat(dt) {
    var f = GAME.focus();
    for (var i = 0; i < GAME.world.peds.length; i++) {
      var cop = GAME.world.peds[i];
      if (!cop.isCop || !cop.patrol || cop.dead || cop.onCase) continue;
      if (U.dist2(cop.pos.x, cop.pos.z, f.x, f.z) > 150 * 150) { GAME.peds.removePed(cop); continue; }
      cop.beatT = (cop.beatT || 0) - dt;
      if (cop.beatT <= 0 || U.dist2(cop.pos.x, cop.pos.z, cop.beatX || 0, cop.beatZ || 0) < 9) {
        cop.beatT = U.randRange(Math.random, 8, 16);
        var a = Math.random() * Math.PI * 2, r = U.randRange(Math.random, 20, 55);
        var rp = GAME.city.nearestRoadPoint(cop.pos.x + Math.cos(a) * r, cop.pos.z + Math.sin(a) * r);
        var off = 8.4 * (Math.random() < 0.5 ? 1 : -1);
        cop.beatX = rp.axis === 'z' ? rp.x + off : rp.x;
        cop.beatZ = rp.axis === 'z' ? rp.z : rp.z + off;
        if (GAME.city.isInWater(cop.beatX, cop.beatZ)) { cop.beatX = cop.pos.x; cop.beatZ = cop.pos.z; }
      }
      stepCop(cop, cop.beatX, cop.beatZ, dt, 2.6);
    }
  }

  // The player's pursuit outranks the beat, always. Whatever an officer was
  // dealing with, a star means they are yours now — otherwise the law can be
  // busy elsewhere at exactly the moment it matters, which reads as broken
  // rather than as a living city.
  function releasePatrolToPursuit() {
    if (!incidents.length) return;
    for (var i = 0; i < incidents.length; i++) {
      var c = incidents[i].cop;
      if (c && !c.dead && !c.gone) { c.onCase = null; c.state = 'chase'; }
    }
    incidents.length = 0;
  }

  // written into the car's own controls, never returned new — see
  // trafficControls in vehicles.js, which every cruiser would otherwise be
  // allocating alongside, one object per car per tick
  function setControls(c, throttle, steer, handbrake) {
    c.throttle = throttle; c.steer = steer; c.handbrake = handbrake;
  }
  function chaseControls(car, dt, s) {
    var P = GAME.player;
    var pxr = P.inCar && P.car ? P.car.pos.x : P.pos.x;
    var pzr = P.inCar && P.car ? P.car.pos.z : P.pos.z;
    // a modest lead on a moving target — enough to cut a corner, not clairvoyant
    var aimX = pxr + (P.inCar && P.car ? (P.car.vx || 0) * 0.3 : 0);
    var aimZ = pzr + (P.inCar && P.car ? (P.car.vz || 0) * 0.3 : 0);
    // reaction lag: pursue a smoothed estimate of the target, so cruisers don't
    // mirror sharp turns the instant you make them
    if (car.aiTX === undefined) { car.aiTX = aimX; car.aiTZ = aimZ; }
    car.aiTX = U.damp(car.aiTX, aimX, 4.5, dt);
    car.aiTZ = U.damp(car.aiTZ, aimZ, 4.5, dt);
    var dx = car.aiTX - car.pos.x, dz = car.aiTZ - car.pos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    var targetH = Math.atan2(dx, dz);
    var dh = U.wrapPI(targetH - car.heading);

    // unstick: reverse out when wedged
    if (Math.abs(car.speed) < 1.2 && dist > 6) car.unstickT += dt; else car.unstickT = 0;
    if (car.unstickT > 1.4) { car.reverseT = 1.0; car.unstickT = 0; }
    if (car.reverseT > 0) {
      car.reverseT -= dt;
      setControls(car.controls, -1, dh > 0 ? -1 : 1, false);
      return;
    }

    // gentler steering, eased frame-to-frame (no instant snap to your heading)
    var rawSteer = U.clamp(dh * 1.5, -1, 1);
    car.aiSteer = U.lerp(car.aiSteer || 0, rawSteer, Math.min(1, dt * 5));
    var steer = car.aiSteer;

    // pull up and stop near an on-foot target so officers can get out
    if (!P.inCar && dist < 22) { setControls(car.controls, car.speed > 2 ? -0.7 : 0, steer, dist < 12); return; }

    // keep a pursuit gap rather than gluing to the bumper
    var gap = s === 1 ? 22 : 9;
    var throttle;
    if (dist > gap + 6) throttle = 1;
    else if (dist > gap) throttle = 0.55;
    else if (dist > gap - 4) throttle = 0.1;
    else throttle = -0.35; // too close — ease back
    // can't corner flat out: lift or brake for hard turns at speed
    if (Math.abs(dh) > 0.7 && car.speed > 16) throttle = Math.min(throttle, -0.2);
    else if (Math.abs(dh) > 0.4 && car.speed > 24) throttle = Math.min(throttle, 0.2);
    setControls(car.controls, throttle, steer, false);
  }

  function updateCopCar(car, dt, s) {
    var P = GAME.player;
    if (car.ai.mode === 'roadblock') {
      var px = P.inCar && P.car ? P.car.pos.x : P.pos.x;
      var pz = P.inCar && P.car ? P.car.pos.z : P.pos.z;
      if (U.dist2(car.pos.x, car.pos.z, px, pz) < 33 * 33) {
        car.ai.mode = 'chase';
        car.occupied = 'ai';
      }
      return;
    }
    chaseControls(car, dt, s);

    // occupant fires from the car at 2 stars and up
    if (s >= 2 && !GAME.godMode) {
      car.shootT -= dt;
      if (car.shootT <= 0) {
        var px2 = P.inCar && P.car ? P.car.pos.x : P.pos.x;
        var pz2 = P.inCar && P.car ? P.car.pos.z : P.pos.z;
        var py2 = P.inCar && P.car ? P.car.pos.y : P.pos.y;
        var d2 = U.dist2(car.pos.x, car.pos.z, px2, pz2);
        // no shooting at someone a storey above or below you
        if (d2 < 40 * 40 && Math.abs(py2 - car.pos.y) < 3
            && GAME.city.hash.segmentClear(car.pos.x, car.pos.z, px2, pz2)) {
          GAME.combat.npcShoot(car.pos.x, 1.3, car.pos.z, 0.25 + s * 0.07, 5 + s * 1.5, car);
        }
        car.shootT = U.randRange(Math.random, 1.1, 2.2) / Math.max(1, s * 0.5);
      }
    }

    // officers bail out to engage on foot: when the player is out of their
    // car, or when the player's car is cornered (stopped)
    var onFoot = !P.inCar;
    var cornered = P.inCar && P.car && Math.abs(P.car.speed) < 3.5;
    if ((onFoot || cornered) && car.copsOut < 2 && Math.abs(car.speed) < 8) {
      var f = GAME.focus();
      var d = U.dist(car.pos.x, car.pos.z, f.x, f.z);
      if (d < (onFoot ? 26 : 18)) {
        var footCount = 0, wp = GAME.world.peds;
        for (var fi = 0; fi < wp.length; fi++) if (wp[fi].isCop && !wp[fi].dead) footCount++;
        if (footCount < Math.min(2 + s, 7) && (car.deployT = (car.deployT || 0) + dt) > 0.5) {
          car.deployT = 0;
          var side = car.heading + Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1);
          spawnFootCop(car.pos.x + Math.sin(side) * 1.8, car.pos.z + Math.cos(side) * 1.8);
          car.copsOut++;
        }
      }
    }
  }

  function updateFootCop(cop, dt, s) {
    var P = GAME.player;
    // track wherever the player actually is (their car when driving)
    var f = GAME.focus();
    var dx = f.x - cop.pos.x, dz = f.z - cop.pos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    // officers on foot give up on a target that's flown out of reach
    var alt = (P.inCar && P.car && (P.car.spec.heli || P.car.spec.plane))
      ? P.car.pos.y - GAME.city.groundY(P.car.pos.x, P.car.pos.z) : 0;
    if (s === 0 || dist > 120 || alt > 26) {
      GAME.peds.removePed(cop);
      return;
    }
    var th = Math.atan2(dx, dz);
    cop.heading = U.angleLerp(cop.heading, th, Math.min(1, dt * 6));
    // fire at the player on foot, or at a slow/stopped car
    var playerSlow = !P.inCar || (P.car && Math.abs(P.car.speed) < 9);
    var los = GAME.city.hash.segmentClear(cop.pos.x, cop.pos.z, f.x, f.z)
      && Math.abs(f.y - cop.pos.y) < 3;   // not through a floor
    var wantShoot = s >= 2 && dist < 28 && playerSlow && los;
    var chaseSpeed = 6.8;   // 0.85x the player's 8 sprint — outrunnable, barely
    cop.speed = U.damp(cop.speed, wantShoot && dist < 14 ? 0 : chaseSpeed, 5, dt);
    var cx0 = cop.pos.x, cz0 = cop.pos.z;
    cop.pos.x += Math.sin(cop.heading) * cop.speed * dt;
    cop.pos.z += Math.cos(cop.heading) * cop.speed * dt;
    // an officer is on foot too, and a ramp deck with walled flanks is as
    // good a trap for the chase as it is for a stroller (city.canWalkTo)
    if (!GAME.city.canWalkTo(cx0, cz0, cop.pos.x, cop.pos.z)) {
      cop.pos.x = cx0; cop.pos.z = cz0;
    }
    var rp = GAME.resolveCircle(cop.pos.x, cop.pos.z, 0.4);
    cop.pos.x = rp.x; cop.pos.z = rp.z;
    cop.pos.y = GAME.city.groundY(cop.pos.x, cop.pos.z);
    cop.mesh.rotation.y = cop.heading;
    // reuse walk animation
    cop.walkPhase += cop.speed * dt * 2.2;
    var j = cop.mesh.userData.joints;
    var sw = Math.sin(cop.walkPhase) * Math.min(1, cop.speed / 2.2) * 0.7;
    j.legL.rotation.x = sw; j.legR.rotation.x = -sw;
    if (wantShoot) {
      j.armR.rotation.x = -Math.PI / 2;
      cop.shootT -= dt;
      if (cop.shootT <= 0) {
        GAME.combat.npcShoot(cop.pos.x, 1.35, cop.pos.z, 0.3 + s * 0.06, 5 + s, cop);
        cop.shootT = U.randRange(Math.random, 0.9, 1.8);
      }
    } else {
      j.armL.rotation.x = -sw * 0.8; j.armR.rotation.x = sw * 0.8;
    }
    // a cop can only cuff you if you're on foot and not sprinting away
    if (!P.inCar && dist < 1.7 && Math.abs(f.y - cop.pos.y) < 3 && s <= 3 && P.moveSpeed < 3.4) cop.grabbing = true;
  }

  function placeRoadblock(s) {
    var P = GAME.player;
    if (!P.inCar || !P.car) return;
    var vx = P.car.vx || 0, vz = P.car.vz || 0;
    var sp = U.len(vx, vz);
    if (sp < 6) return;
    var ahead = 110 + Math.random() * 50;
    var nx = P.car.pos.x + vx / sp * ahead, nz = P.car.pos.z + vz / sp * ahead;
    var node = GAME.city.nearestNode(nx, nz);
    if (!node || U.dist2(node.x, node.z, P.car.pos.x, P.car.pos.z) < 70 * 70) return;
    var perp = Math.atan2(vx, vz) + Math.PI / 2;
    for (var k = -1; k <= 1; k += 2) {
      var cx = node.x + Math.sin(perp) * 2.6 * k, cz = node.z + Math.cos(perp) * 2.6 * k;
      var car = GAME.vehicles.spawnCar('police', cx, cz, perp, { occupied: 'ai', ai: { mode: 'roadblock' } });
      car.copsOut = 2;
      car.shootT = 1;
    }
    spawnFootCop(node.x + Math.sin(perp) * 8, node.z + Math.cos(perp) * 8);
    if (s >= 4) {
      var toward = Math.atan2(P.car.pos.x - node.x, P.car.pos.z - node.z);
      var sx = node.x + Math.sin(toward) * 10, sz = node.z + Math.cos(toward) * 10;
      var mesh = new THREE.Mesh(sharedBoxGeo(11, 0.12, 0.9), sharedLambert(0x777788));
      mesh.position.set(sx, 0.1, sz);
      mesh.rotation.y = perp;
      GAME.scene.add(mesh);
      if (spikes.length >= MAX_SPIKES) dropSpike(0);
      spikes.push({ mesh: mesh, x: sx, z: sz });
    }
  }

  function update(dt) {
    var P = GAME.player;
    var s = stars();

    // lightbar flash on all police cars
    var flashOn = (GAME.time * 8 | 0) % 2 === 0;
    var cars = GAME.world.cars;
    for (var i = 0; i < cars.length; i++) {
      var c = cars[i];
      if (c.isPolice && c.mesh.userData.lightbar && !c.dead) {
        var active = s > 0 && c.ai && (c.ai.mode === 'chase' || c.ai.mode === 'roadblock');
        c.mesh.userData.lightbar[0].visible = active && flashOn;
        c.mesh.userData.lightbar[1].visible = active && !flashOn;
      }
    }

    if (P.state !== 'alive') { GAME.audio.siren(0); return; }

    // the air unit runs even at zero stars — the airspace escort is not a
    // wanted-level response
    updateAirUnits(dt, s);

    if (s === 0) {
      GAME.audio.siren(0);
      if (heat > 0) heat = Math.max(0, heat - dt * 16);
      // Pursuit units stand down — but the beat does not. Until now this
      // deleted every officer in the world every sixtieth frame, which is the
      // deepest reason the police were never after anybody but you: at zero
      // stars there were no police. A patrol officer is a different thing
      // from a unit sent after the player, and only the latter goes home.
      if (GAME.frame % 60 === 0) {
        var strays = copCars();
        for (var st = 0; st < strays.length; st++) if (!strays[st].patrol) GAME.vehicles.removeCar(strays[st]);
        // Pursuit officers always stand down here. A patrol officer normally
        // stays — that is the whole point of the beat — but goes home too when
        // the knob says the police are not part of this, so switching to OFF
        // empties the street rather than leaving one man walking it forever.
        var beatOn = GAME.chaos.policeRespond;
        GAME.world.peds.slice().forEach(function (p) {
          if (p.isCop && !p.dead && (!p.patrol || !beatOn)) GAME.peds.removePed(p);
        });
        clearSpikes();
      }
      maintainPatrol(dt);
      updateIncidents(dt, 0);
      walkTheBeat(dt);
      return;
    }
    // the player's own pursuit outranks anything on the beat: an officer
    // already dealing with a scuffle drops it and comes for you
    releasePatrolToPursuit();

    // high in an aircraft you're out of reach: ground units stop being sent and
    // stop counting as eyes on you, so the heat can cool
    var flownOff = false;
    if (P.inCar && P.car && (P.car.spec.heli || P.car.spec.plane)) {
      flownOff = P.car.pos.y > GAME.city.groundY(P.car.pos.x, P.car.pos.z) + 26;
    }

    // pursuit cars
    var active = copCars();
    var chasing = chaseBuf;
    chasing.length = 0;
    for (var ch = 0; ch < active.length; ch++) if (active[ch].ai.mode === 'chase') chasing.push(active[ch]);
    if (!flownOff && chasing.length < CAR_CAP[s] && GAME.frame % 45 === 0) spawnCruiser();
    var pf = GAME.focus();
    for (var a = 0; a < active.length; a++) {
      updateCopCar(active[a], dt, s);
      if (U.dist2(active[a].pos.x, active[a].pos.z, pf.x, pf.z) > 260 * 260) GAME.vehicles.removeCar(active[a]);
    }

    if (!flownOff) maintainFootCops(s, dt);

    // foot cops
    // a snapshot, because an officer's turn can add or remove people
    var peds = pedBuf, wpeds = GAME.world.peds;
    peds.length = 0;
    for (var pi = 0; pi < wpeds.length; pi++) peds.push(wpeds[pi]);
    var anyGrab = false;
    for (var f = 0; f < peds.length; f++) {
      if (peds[f].isCop && !peds[f].dead) {
        peds[f].grabbing = false;
        updateFootCop(peds[f], dt, s);
        if (peds[f].grabbing) anyGrab = true;
      }
    }
    // arrest needs a cop holding you for a moment, not mere contact
    if (anyGrab) { grabTimer += dt; if (grabTimer > 0.6) GAME.playerBusted(); }
    else grabTimer = Math.max(0, grabTimer - dt * 2);

    // roadblocks
    if (s >= 3) {
      roadblockT -= dt;
      if (roadblockT <= 0) {
        placeRoadblock(s);
        roadblockT = U.randRange(Math.random, 9, 15);
      }
    }
    // spike strips
    var sf = GAME.focus();
    for (var so = spikes.length - 1; so >= 0; so--) {
      if (U.dist2(spikes[so].x, spikes[so].z, sf.x, sf.z) > SPIKE_KEEP_R * SPIKE_KEEP_R) dropSpike(so);
    }
    if (P.inCar && P.car && !P.car.spiked) {
      for (var sp = 0; sp < spikes.length; sp++) {
        if (U.dist2(P.car.pos.x, P.car.pos.z, spikes[sp].x, spikes[sp].z) < 27) {
          P.car.spiked = true;
          GAME.fx.spawn(P.car.pos.x, 0.4, P.car.pos.z, { count: 10, color: 0xffe0a0, spread: 3, life: 0.4 });
          GAME.audio.crash(0.5, P.car.pos.x, P.car.pos.z);
          GAME.hud.message('Tires shredded!', 2);
        }
      }
    }

    // line-of-sight decay
    var seen = false;
    var px = P.inCar && P.car ? P.car.pos.x : P.pos.x;
    var pz = P.inCar && P.car ? P.car.pos.z : P.pos.z;
    if (flownOff) active = []; // nothing on the ground can hold eyes on you up there
    for (var v = 0; v < active.length; v++) {
      if (U.dist2(active[v].pos.x, active[v].pos.z, px, pz) < 70 * 70 &&
        GAME.city.hash.segmentClear(active[v].pos.x, active[v].pos.z, px, pz)) { seen = true; break; }
    }
    // the air unit's eyes work at altitude — a 4-5 star bird on your tail
    // means climbing away no longer cools the heat
    for (var av = 0; av < airUnits.length; av++) {
      if (U.dist2(airUnits[av].pos.x, airUnits[av].pos.z, px, pz) < 90 * 90) { seen = true; break; }
    }
    if (!seen && !flownOff) {
      for (var fc = 0; fc < peds.length; fc++) {
        var pd = peds[fc];
        if (pd.isCop && !pd.dead && U.dist2(pd.pos.x, pd.pos.z, px, pz) < 60 * 60) { seen = true; break; }
      }
    }
    if (seen) lastSeen = 0;
    else {
      lastSeen += dt;
      if (lastSeen > 16) {
        var cur = stars();
        heat = cur > 1 ? THRESH[cur - 1] + 20 : 0;
        lastSeen = 8; // next star drops sooner once hidden
        GAME.hud.wantedChanged(stars());
        if (stars() === 0) clearCops();
      }
    }

    // interest fades if you stop offending — otherwise a tail that keeps you in
    // sight means the heat never cools and a 1-star pursuit runs forever
    if (GAME.time - lastCrime > 8) {
      var before2 = stars();
      heat = Math.max(0, heat - dt * (seen ? 18 : 55));
      var after2 = stars();
      if (after2 < before2) {
        GAME.hud.wantedChanged(after2);
        if (after2 === 0) clearCops();
      }
    }

    // pinned arrest at 1-2 stars
    if (s <= 2 && P.inCar && P.car && Math.abs(P.car.speed) < 1.5) {
      var pinned = false;
      for (var pc = 0; pc < chasing.length; pc++) {
        if (U.dist2(chasing[pc].pos.x, chasing[pc].pos.z, P.car.pos.x, P.car.pos.z) < 30) { pinned = true; break; }
      }
      if (pinned) {
        pinTimer += dt;
        if (pinTimer > 2.6) GAME.playerBusted();
      } else pinTimer = Math.max(0, pinTimer - dt);
    } else pinTimer = 0;

    // siren from nearest active car
    var nd = 1e9, nx = 0, nz = 0;
    for (var n = 0; n < chasing.length; n++) {
      var d2s = U.dist2(chasing[n].pos.x, chasing[n].pos.z, px, pz);
      if (d2s < nd) { nd = d2s; nx = chasing[n].pos.x; nz = chasing[n].pos.z; }
    }
    if (nd < 1e9) {
      var dd = Math.sqrt(nd);
      GAME.audio.siren(U.clamp(1 - dd / 130, 0, 1), 1 + U.clamp((60 - dd) / 400, -0.1, 0.15), nx, nz);
    } else GAME.audio.siren(0);
  }

  return {
    get wanted() { return stars(); },
    get heat() { return heat; },
    reportCrime: reportCrime,
    reportIncident: reportIncident,
    get incidentCount() { return incidents.length; },
    get patrolCount() { return patrolCount(); },
    noteGunfire: noteGunfire,
    airspaceStrike: airspaceStrike,
    get airUnitCount() { return airUnits.length; },
    setWanted: setWanted,
    clearWanted: clearWanted,
    update: update
  };
})();
