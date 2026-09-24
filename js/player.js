GAME.player = {
  pos: null, mesh: null, heading: 0,
  inCar: false, car: null,
  health: 100, armor: 0, cash: 250,
  state: 'alive', stateT: 0,
  weapons: { fist: { have: true, ammo: Infinity } },
  currentWeapon: 'fist',
  moveSpeed: 0
};

GAME.cam = { yaw: Math.PI, pitch: 0.32, dist: 6, freeT: 0, x: 0, y: 5, z: 0 };
GAME.cameraShake = 0;

// where the player effectively is (their vehicle when driving, else on foot)
GAME.focus = function () {
  var P = GAME.player;
  return P.inCar && P.car ? P.car.pos : P.pos;
};

GAME.initPlayer = function () {
  var P = GAME.player;
  // privateMats: the wardrobe re-tints this figure in place — shared
  // materials here would dress the whole town every time you change shirts
  var mesh = GAME.peds.buildPedMesh({ noHair: true, privateMats: true }); // the wardrobe supplies the hair
  // fixed outfit so the player reads distinctly — tint the private materials
  // in place (the arms already share the torso's, the legs each other's)
  // rather than replacing them, which orphaned two fresh materials at boot
  mesh.userData.joints.torso.material.color.setHex(0xf0f0f8);
  mesh.userData.joints.legL.children[0].material.color.setHex(0x38b8c8);
  GAME.scene.add(mesh);
  P.mesh = mesh;
  P.pos = mesh.position;
  P.pos.set(356, 0.18, 40);
  P.heading = Math.PI;
  mesh.visible = false; // hidden during title attract mode; shown on start
  // weapon prop in right hand
  var wm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.42), new THREE.MeshLambertMaterial({ color: 0x222228 }));
  wm.position.set(0, -0.55, 0.2);
  wm.visible = false;
  mesh.userData.joints.armR.add(wm);
  P.weaponMesh = wm;
  loadSave();
};

function loadSave() {
  try {
    var s = JSON.parse(localStorage.getItem('neonMayhemSave') || '{}');
    var P = GAME.player;
    if (typeof s.cash === 'number') P.cash = s.cash;
    GAME.bests = s.bests || {};
    GAME.prefs = s.prefs || {};
    // the body comes back the way it was left: condition, armor, and the
    // whole loadout with its ammo (fists are a birthright, not cargo)
    if (typeof s.health === 'number') P.health = U.clamp(s.health, 1, 100);
    if (typeof s.armor === 'number') P.armor = U.clamp(s.armor, 0, 100);
    if (s.loadout) {
      for (var w in s.loadout) {
        if (typeof s.loadout[w] === 'number') P.weapons[w] = { have: true, ammo: s.loadout[w] };
      }
      if (s.currentWeapon && P.weapons[s.currentWeapon]) P.currentWeapon = s.currentWeapon;
    }
    if (GAME.prefs.timeMode && GAME.setTimeMode) GAME.setTimeMode(GAME.prefs.timeMode);
    // the island decided its gates at build time, before this save existed in
    // memory — re-judge now that the mission record is actually loaded
    if (GAME.isla) GAME.isla.syncUnlock();
  } catch (e) { GAME.bests = {}; GAME.prefs = {}; }
}
GAME.save = function () {
  try {
    var P = GAME.player;
    // the loadout, minus fists (Infinity has no JSON form and needs none)
    var loadout = {};
    for (var w in P.weapons) {
      if (w !== 'fist' && P.weapons[w].have && isFinite(P.weapons[w].ammo)) loadout[w] = P.weapons[w].ammo;
    }
    localStorage.setItem('neonMayhemSave', JSON.stringify({
      cash: P.cash, bests: GAME.bests || {}, prefs: GAME.prefs || {},
      health: Math.round(P.health), armor: Math.round(P.armor),
      loadout: loadout, currentWeapon: P.currentWeapon
    }));
  } catch (e) { }
};
GAME.addCash = function (n) {
  GAME.player.cash = Math.max(0, GAME.player.cash + n);
  GAME.hud.cashChanged();
  GAME.save();
};

// The whole save as a portable string, and the way back. The export first
// flushes the live state (health, ammo, everything GAME.save carries) and
// then copies EVERY localStorage key verbatim — if a future feature adds a
// second key, it rides along without this code changing. Import restores
// all keys and reloads into the imported life.
GAME.exportSave = function () {
  GAME.save();   // snapshot the moment, not the last checkpoint
  var storage = {};
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      storage[k] = localStorage.getItem(k);
    }
  } catch (e) { }
  return JSON.stringify({ game: 'neon-mayhem', v: 2, exported: new Date().toISOString(), storage: storage }, null, 1);
};
GAME.importSave = function (text) {
  var o;
  try { o = JSON.parse(text); } catch (e) { return { ok: false, why: 'That file is not a save.' }; }
  try {
    if (o && o.game === 'neon-mayhem' && o.storage && typeof o.storage === 'object') {
      // v2: the full storage dump
      if (typeof o.storage.neonMayhemSave !== 'string') return { ok: false, why: 'That save file is missing its game data.' };
      JSON.parse(o.storage.neonMayhemSave);   // must at least be JSON
      for (var k in o.storage) {
        if (typeof o.storage[k] === 'string') localStorage.setItem(k, o.storage[k]);
      }
      return { ok: true };
    }
    // v1 wrapped a single save object; a bare save object is also accepted
    var s = o && o.game === 'neon-mayhem' ? o.save : o;
    if (!s || typeof s !== 'object' || (s.cash === undefined && !s.prefs && !s.bests)) {
      return { ok: false, why: 'That file is not a Neon Mayhem save.' };
    }
    localStorage.setItem('neonMayhemSave', JSON.stringify(s));
    return { ok: true };
  } catch (e) { return { ok: false, why: 'Could not write the save.' }; }
};

GAME.playerDamage = function (amt, cause) {
  var P = GAME.player;
  if (!GAME.started || P.state !== 'alive' || GAME.godMode) return;
  if (P.armor > 0) {
    var absorbed = Math.min(P.armor, amt * 0.7);
    P.armor -= absorbed;
    amt -= absorbed;
  }
  P.health -= amt;
  GAME.hud.damageFlash();
  if (P.health <= 0) {
    P.health = 0;
    GAME.playerWasted(cause);
  }
};

// silence every looping voice — the player update stops running once you're
// down, so anything still held open would drone until respawn
function killLoopingAudio() {
  GAME.audio.engineState(false, 0);
  GAME.audio.skid(0);
  GAME.audio.siren(0);
  GAME.audio.radio.setVolume(0);
}

// the canopy is held open the same way, and nothing else puts it away: dying
// under it (a 4-star bird strafes a glider, and a bailed-out airframe blows up
// beneath one) left P.parachuting set through the whole wasted screen, so the
// chute hung in the air over the body — and then the first living frame at the
// hospital ran a glide step and reported "Feet dry." on solid ground.
function stowParachute() {
  if (GAME.player.parachuting && GAME.aircraft) GAME.aircraft.land();
}

GAME.playerWasted = function (cause) {
  var P = GAME.player;
  if (P.state !== 'alive') return;
  P.state = 'wasted'; P.stateT = 0;
  GAME.track('wasted');
  GAME.timeScale = 0.35;
  killLoopingAudio();
  stowParachute();
  // the card tells the truth about THIS death: a bed only counts on the
  // island you went down on — and if you own one elsewhere, say why it
  // didn't help, so the rule teaches itself
  var home = GAME.shops && GAME.shops.homeSpawn(P.pos.x, P.pos.z);
  var ownsElsewhere = !home && GAME.shops && GAME.shops.ownsAny();
  var body = home
    ? 'You wake up at your place. Cash and weapons intact.'
    : ownsElsewhere
      ? 'You wake up at the local hospital — your bed is on the other island. Weapons gone, cash intact.'
      : 'You wake up at the hospital. Weapons gone, cash intact.';
  // An explosion death gets its beat: the banner used to slam on in the very
  // frame the blast spawned, so dying in a burning car read as "I suddenly
  // died" — the fireball was behind the card. Let the slow-mo blast play,
  // THEN call it.
  var delay = cause === 'explosion' ? 900 : 0;
  var show = function () {
    if (P.state !== 'wasted' || P.respawnQueued) return;
    GAME.audio.sting('wasted');
    GAME.haptics.wasted();
    GAME.hud.showBig('wasted', body);
  };
  if (delay) setTimeout(show, delay); else show();
  GAME.missions.failActive('You got wasted.');
};

GAME.playerBusted = function () {
  var P = GAME.player;
  if (P.state !== 'alive') return;
  P.state = 'busted'; P.stateT = 0;
  GAME.track('busted');
  GAME.timeScale = 0.4;
  killLoopingAudio();
  stowParachute();
  GAME.audio.sting('busted');
  GAME.haptics.busted();
  var fine = Math.min(P.cash, 200);
  P.pendingFine = fine;
  GAME.hud.showBig('busted', 'Released with a $' + fine + ' fine. Weapons confiscated.');
  GAME.missions.failActive('You got busted.');
};

GAME.playerDrown = function () {
  var P = GAME.player;
  if (P.drowning || P.state !== 'alive') return;
  P.drowning = true;
  GAME.audio.splash();
  GAME.hud.fade(function () {
    if (P.inCar) forceExitCar(true);
    // wash up on whichever shore was crossed, on whichever island that was
    var c = GAME.city;
    var sh = c.washAshore(P.pos.x, P.pos.z);
    P.pos.set(sh.x, c.groundY(sh.x, sh.z), sh.z);
    var isl = c.islandAt(sh.x, sh.z);
    var ic = (isl && isl.centre) || { x: -70, z: 0 };
    P.heading = Math.atan2(ic.x - sh.x, ic.z - sh.z);
    P.drowning = false;
    GAME.hud.message('You wash up on the beach, soaked.');
  });
};

function respawnAfterScreen() {
  var P = GAME.player;
  var kind = P.state;
  GAME.hud.fade(function () {
    GAME.hud.hideBig();
    GAME.timeScale = 1;
    if (P.inCar) forceExitCar(true);
    // Dying mid walk-to-the-door must cancel the entry: the pending
    // P.entering used to sit frozen through the death screen, resume on the
    // first living frame, and seat you in the car — waking you up in the
    // ride you'd pressed F on instead of at the hospital.
    if (P.entering) {
      var ecar = P.entering.car;
      if (ecar && !ecar.dead && ecar.occupied === 'player') {
        ecar.occupied = null;
        ecar.controls = { throttle: 0, steer: 0, handbrake: true };
      }
      P.entering = null;
      resetRiderPose();
    }
    P.health = 100;
    if (kind === 'busted') {
      GAME.addCash(-(P.pendingFine || 0));
      P.pendingFine = 0;
      // released from whichever station covers where you were picked up
      var sp = GAME.city.nearestStation(P.pos.x, P.pos.z).spawn;
      P.pos.set(sp.x, GAME.city.groundY(sp.x, sp.z), sp.z);
    } else {
      P.armor = 0;
      // Property changes everything: own a safehouse and you wake up in your
      // own bed with your arsenal untouched. Otherwise it's the nearest
      // hospital YOU CAN BE IN — crash at the channel's edge and the island
      // hospital is closest by distance, but a hospital behind a locked
      // bridge cannot be where you wake up.
      var home = GAME.shops && GAME.shops.homeSpawn(P.pos.x, P.pos.z);
      if (home) {
        P.pos.set(home.x, GAME.city.groundY(home.x, home.z), home.z);
      } else {
        // the hospital on the island you went down on — an ambulance does
        // not carry you across the channel. Off-island beds only come into
        // it if this island somehow has none you can be in.
        var unlocked = !GAME.isla || GAME.isla.isOpen();
        var onIsla = !!(GAME.isla && GAME.isla.contains(P.pos.x, P.pos.z));
        var hs = GAME.city.pois.hospitals;
        var sh = hs[0].spawn;
        var bd = 1e18;
        for (var hi = 0; hi < hs.length; hi++) {
          if (hs[hi].isla && !unlocked) continue;
          var d = U.dist2(P.pos.x, P.pos.z, hs[hi].x, hs[hi].z);
          if (!!hs[hi].isla !== onIsla) d += 1e12;
          if (d < bd) { bd = d; sh = hs[hi].spawn; }
        }
        P.pos.set(sh.x, GAME.city.groundY(sh.x, sh.z), sh.z);
      }
    }
    var keepGear = kind === 'wasted' && GAME.shops && GAME.shops.homeSpawn(P.pos.x, P.pos.z);
    if (!keepGear) {
      P.weapons = { fist: { have: true, ammo: Infinity } };
      P.currentWeapon = 'fist';
    }
    // every stunt jump found: the arsenal survives a hospital or cell visit
    if (GAME.unlimitedAmmo) GAME.combat.giveAllWeapons();
    GAME.combat.refreshWeaponHud();
    GAME.police.clearWanted();
    // The old life's fires are not your crimes: a cruiser rammed before
    // you went down used to cook off AFTER the respawn, and its kill_cop
    // handed you fresh stars at your own front door. Sever every player
    // attribution the previous life left smouldering in the world.
    GAME.world.cars.forEach(function (wc) { wc.byPlayer = false; });
    P.state = 'alive';
  });
}

function nearestEnterableCar() {
  var P = GAME.player;
  var car = GAME.vehicles.findNearestCar(P.pos.x + Math.sin(P.heading) * 1.2, P.pos.z + Math.cos(P.heading) * 1.2, 4.6, null);
  // same level only: a helicopter on a roof cannot be boarded from the street
  if (car && Math.abs(car.pos.y - P.pos.y) > 3) return null;
  return car;
}

GAME.enterCar = function (car) {
  var P = GAME.player;
  if (!car || car.dead || P.inCar || P.entering) return false;
  // boarding is a same-level act everywhere it can be asked for — a rooftop
  // helicopter is not takeable from the pavement under it
  if (Math.abs(car.pos.y - P.pos.y) > 3) return false;
  if (car.occupied === 'ai') {
    // jack: the driver bails — and not all of them run. The short-tempered
    // turn on you and try to take their ride back with their fists.
    var side = car.heading + Math.PI / 2;
    // clear of the bodywork, whatever is being jacked: a flat 1.6 m put the
    // driver of anything wide inside his own car's kill box
    var stepOut = car.spec.w / 2 + 1;
    var dx = Math.sin(side) * stepOut, dz = Math.cos(side) * stepOut;
    // The car remembers its driver. Jack it, let the owner take it back,
    // jack it again — the SAME person climbs out both times, same clothes
    // and same temper, instead of a fresh stranger materializing at the
    // wheel of a car that already had an owner.
    var driver = GAME.peds.spawnPed(car.pos.x + dx, car.pos.z + dz,
      car.isPolice ? { cop: true } : car.lastDriver ? { look: car.lastDriver } : undefined);
    if (!car.isPolice) {
      if (car.lastDriver) driver.temper = car.lastDriver.temper;
      else {
        car.lastDriver = { shirt: driver.look.shirt, pants: driver.look.pants, skin: driver.look.skin,
          hair: driver.look.hair, hairCol: driver.look.hairCol, temper: driver.temper };
      }
    }
    if (!car.isPolice && driver.temper > 0.55) {
      driver.state = 'attack';
      driver.attackT = 12;
      driver.stolenCar = car;   // it's THEIR car — they'll try to take it back
    } else {
      driver.state = 'flee';
      driver.fleeT = 8;
      driver.fleeX = car.pos.x; driver.fleeZ = car.pos.z;
    }
    if (car.isPolice) driver.isCop = false; // he's fleeing his stolen cruiser, not chasing
    GAME.audio.yelp();
    GAME.police.reportCrime(car.isPolice ? 'steal_police' : 'jack', car.pos);
    GAME.track('car-jacked');
    GAME.missions.notifyChaos(100);
  } else if (car.isPolice) {
    // stealing an empty/parked cruiser is still a crime
    GAME.police.reportCrime('steal_police', car.pos);
  }
  if (car.isPolice && car.ai) car.ai = null;
  // an AI bike's seated rider gives way to the player (driver flees separately)
  if (car.riderMesh) { car.mesh.remove(car.riderMesh); disposeTree(car.riderMesh); car.riderMesh = null; }
  // once you take it, it's no longer a parked-spot car (else its spot despawns it)
  if (car.parkedSpot) { car.parkedSpot.live = null; car.parkedSpot = null; }
  car.occupied = 'player';
  if (car.ai) car.ai = null;
  car.controls = { throttle: 0, steer: 0, handbrake: true };
  // short walk-to-the-door transition before sitting in
  P.entering = { car: car, t: 0, dur: 0.55 };
  return true;
};

function stepEnter(dt) {
  var P = GAME.player;
  var e = P.entering;
  var car = e.car;
  if (!car || car.dead) { P.entering = null; return; }
  e.t += dt;
  var side = car.heading - Math.PI / 2;
  var doorX = car.pos.x + Math.sin(side) * 1.5;
  var doorZ = car.pos.z + Math.cos(side) * 1.5;
  P.heading = U.angleLerp(P.heading, Math.atan2(doorX - P.pos.x, doorZ - P.pos.z), Math.min(1, dt * 10));
  P.pos.x = U.damp(P.pos.x, doorX, 9, dt);
  P.pos.z = U.damp(P.pos.z, doorZ, 9, dt);
  P.pos.y = GAME.city.surfaceY(P.pos.x, P.pos.z, P.pos.y);
  P.mesh.rotation.y = P.heading;
  P.walkPhase = (P.walkPhase || 0) + dt * 11;
  var j = P.mesh.userData.joints;
  var s = Math.sin(P.walkPhase) * 0.6;
  j.legL.rotation.x = s; j.legR.rotation.x = -s;
  j.armL.rotation.x = -s * 0.7; j.armR.rotation.x = s * 0.7;
  if (e.t >= e.dur) {
    P.entering = null;
    j.legL.rotation.x = j.legR.rotation.x = j.armL.rotation.x = j.armR.rotation.x = 0;
    car.controls = { throttle: 0, steer: 0, handbrake: false };
    P.inCar = true;
    P.car = car;
    P.onBike = !!car.spec.bike;
    P.mesh.visible = P.onBike; // riders stay visible on a bike
    GAME.cam.freeT = 0;
    GAME.audio.radio.setVolume(GAME.audio.muted ? 0 : 0.7);
    GAME.hud.message(car.spec.label, 1.6);
    // the radio comes on tuned to whatever the last driver left it on
    if (!car.spec.heli && !car.spec.plane) GAME.hud.radioPopup(GAME.audio.radio.randomStation());
    if (car.spec.gunship) GAME.hud.message('TALON — Space up · Shift down · WASD fly · LMB/GUN chin gun · RMB/RKT rockets · F to exit', 5);
    else if (car.spec.plane) GAME.hud.message('Plane — W throttle up the runway, Space to climb once fast · A/D turn · F to bail out', 4.5);
    else if (car.spec.heli) GAME.hud.message('Heli — Space up · Shift down · WASD fly · F to exit (bail with a chute if high up)', 4);
    else if (car.type === 'taxi') GAME.hud.message('Cab — press J (or JOB) to start a fare', 3);
    else if (car.type === 'ambulance') GAME.hud.message('Ambulance — press J (or JOB) for a paramedic run', 3);
    else if (car.type === 'icecream') GAME.hud.message('Ice cream truck — press J (or JOB) to start a round', 3);
  }
}

function forceExitCar(silent) {
  var P = GAME.player;
  if (!P.inCar) return;
  var car = P.car;
  // bailing out of a burning ride resets the fuse to scramble length: the
  // killing blow keeps its short cinematic fuse while you're aboard, but
  // once you're out the door the blast should be a thing you can outwalk
  if (car.fireFuse > 0 && !car.dead) car.fireFuse = Math.max(car.fireFuse, 2.5);
  car.controls = { throttle: 0, steer: 0, handbrake: false };
  car.occupied = null;
  var side = car.heading - Math.PI / 2;
  var ex = car.pos.x + Math.sin(side) * 2.2, ez = car.pos.z + Math.cos(side) * 2.2;
  var roofY = GAME.city.surfaceY(car.pos.x, car.pos.z);
  var onRoof = (car.spec.heli || car.spec.plane) && roofY > GAME.city.groundY(car.pos.x, car.pos.z) + 1;
  if (onRoof) {
    // step out onto the rooftop beside the aircraft (don't shove out of the footprint);
    // if you then walk off the edge, on-foot gravity takes over
    P.pos.set(ex, roofY, ez);
  } else {
    var rp = GAME.resolveCircle(ex, ez, 0.45);
    P.pos.set(rp.x, GAME.city.groundY(rp.x, rp.z), rp.z);
  }
  // a hovering exit (under chute height) steps out at altitude — you drop
  // the rest of the way on ordinary gravity rather than teleporting down
  if (car.spec.heli || car.spec.plane) {
    // the heli's origin now sits at skid level, so its cabin floor IS its pos
    var feetY = car.pos.y - (car.spec.plane ? (car.spec.wheelH || 1.1) : 0.1);
    if (feetY > P.pos.y + 0.3) { P.pos.y = feetY; P.airborne = true; }
  }
  P.velY = 0;
  P.heading = car.heading;
  P.inCar = false;
  P.car = null;
  P.onBike = false;
  resetRiderPose();
  P.mesh.visible = true;
  GAME.audio.engineState(false, 0);
  GAME.audio.radio.setVolume(0);
  GAME.audio.skid(0);
}
GAME.exitCar = forceExitCar;

function resetRiderPose() {
  var j = GAME.player.mesh.userData.joints;
  j.legL.rotation.set(0, 0, 0); j.legR.rotation.set(0, 0, 0);
  j.armL.rotation.set(0, 0, 0); j.armR.rotation.set(0, 0, 0);
  j.torso.rotation.x = 0;
  GAME.player.mesh.rotation.z = 0;
}

// thrown off the bike on a hard crash
GAME.ejectBike = function (impact) {
  var P = GAME.player;
  if (!P.onBike || !P.car) return;
  var car = P.car;
  var side = car.heading + (Math.random() < 0.5 ? 1.4 : -1.4);
  forceExitCar();
  var tx = car.pos.x + Math.sin(side) * 4, tz = car.pos.z + Math.cos(side) * 4;
  var rp = GAME.resolveCircle(tx, tz, 0.45);
  P.pos.set(rp.x, GAME.city.groundY(rp.x, rp.z), rp.z);
  GAME.fx.spawn(P.pos.x, 0.6, P.pos.z, { count: 6, color: 0xffd890, spread: 3, life: 0.5 });
  GAME.cameraShake = 0.8;
  GAME.playerDamage(Math.min(35, 10 + impact * 1.2), 'crash');
  GAME.hud.message('Thrown off the bike!', 2);
};

GAME.updatePlayer = function (dt) {
  var P = GAME.player, inp = GAME.input, T = inp.touch;
  if (P.state !== 'alive') {
    P.stateT += dt;
    // R means NOW: it arms almost immediately, and the automatic continue
    // sits far enough out that pressing it visibly matters
    if (P.stateT > 0.6 && !P.respawnQueued && (P.stateT > 6 || GAME.key('KeyR') || GAME.key('Enter') || GAME.skipScreen)) {
      GAME.skipScreen = false;
      P.respawnQueued = true;
      respawnAfterScreen();
      setTimeout(function () { P.respawnQueued = false; }, 1500);
    }
    updateCamera(dt);
    return;
  }

  if (P.entering) { stepEnter(dt); updateCamera(dt); return; }
  if (P.parachuting) { GAME.aircraft.updateParachute(dt); updateCamera(dt); return; }
  if (P.inCar) updateDriving(dt);
  else updateOnFoot(dt);

  // pickups
  GAME.combat.checkPickups();
  updateCamera(dt);
};

var enterLatch = false;
function wantsEnter() {
  var v = GAME.key('KeyF') || GAME.input.touch.enter;
  var fired = v && !enterLatch;
  enterLatch = v;
  return fired;
}

// The roof height of a car at a point in its own frame — what your feet
// stand on when you're up there. Bikes have nothing to stand on; aircraft
// only support you over the fuselage/cabin (not the empty air by the tail).
function carRoofY(c, lx, lz) {
  var s = c.spec;
  if (s.bike) return null;
  if (s.icecream) return 2.62;
  if (s.monster) return (Math.abs(lx) < 0.95 && lz > -1.4 && lz < 0.8) ? 3.1 : 2.32;
  if (s.heli) return (lz > -2.4 && lz < 1.9) ? 2.07 : null;
  if (s.plane) {
    if (Math.abs(lx) < 0.78 && Math.abs(lz) < 4.5) return 1.97;      // fuselage
    if (Math.abs(lx) < 6 && Math.abs(lz + 0.4) < 1.1) return 1.51;   // wing
    return null;
  }
  var top = 0.42 + s.bodyH / 2;
  // the cabin is a second step up, roughly amidships
  if (s.cabinH > 0 && Math.abs(lx) < s.w * 0.41 && Math.abs(lz + 0.15) < s.l * 0.26)
    top = 0.42 + s.bodyH / 2 + s.cabinH - 0.05;
  return top;
}
// the LOWEST standable level, for deciding when someone is "above" the car
// The world height of a point on a car's deck, given that point in the body's
// own frame. carRoofY answers in that frame, and the body is not level:
// vehicles.js pitches the chassis over ramps and rolls it through corners
// (mesh.rotation.x / .z), so adding car.pos.y alone stood a rider on the flat
// roof the car would have had sitting still — hanging in the air off the back
// of a nose-up truck, or sunk into the front of it.
//
// The heading is deliberately zeroed rather than reused: lx/lz arrive already
// turned into the body frame, so putting it back would apply it twice.
// Rebuilding through the mesh's OWN euler order matters — ground cars are set
// to YXZ (so a ramp pitches them whichever way they face) while aircraft keep
// the default XYZ, and the two do not compose alike.
var _deckE = null, _deckQ = null, _deckV = null;
function deckWorldY(c, lx, ly, lz) {
  var r = c.mesh.rotation;
  if (!r.x && !r.z) return c.pos.y + ly;   // sitting level: nothing to turn
  if (!_deckV) { _deckV = new THREE.Vector3(); _deckE = new THREE.Euler(); _deckQ = new THREE.Quaternion(); }
  _deckE.set(r.x, 0, r.z, r.order);
  _deckQ.setFromEuler(_deckE);
  _deckV.set(lx, ly, lz).applyQuaternion(_deckQ);
  return c.pos.y + _deckV.y;
}

function carBodyTop(c) {
  var s = c.spec;
  return s.icecream ? 2.6 : s.monster ? 2.3 : s.plane ? 1.4 : s.heli ? 1.9 : s.bike ? 1.0 : 0.42 + s.bodyH / 2;
}

function updateOnFoot(dt) {
  var P = GAME.player, inp = GAME.input, T = inp.touch;
  var aiming = GAME.combat.aiming;

  // Riding: standing on a car means moving with it. Chase its transform from
  // last frame's snapshot — position delta plus rotation about its center —
  // before your own legs add anything.
  if (P.roofCar) {
    var rc = P.roofCar;
    // a teleport or respawn can leave a stale ride reference — if the player
    // is nowhere near the car any more, it isn't under their feet
    if (rc.dead || GAME.world.cars.indexOf(rc) < 0 ||
        U.dist2(P.pos.x, P.pos.z, rc.pos.x, rc.pos.z) > (rc.radius + 5) * (rc.radius + 5)) { P.roofCar = null; }
    else {
      var pr = P.roofPrev;
      var dh2 = rc.heading - pr.h;
      var ox = P.pos.x - pr.x, oz = P.pos.z - pr.z;
      var cs2 = Math.cos(dh2), sn2 = Math.sin(dh2);
      P.pos.x = rc.pos.x + ox * cs2 + oz * sn2;
      P.pos.z = rc.pos.z + oz * cs2 - ox * sn2;
      P.pos.y += rc.pos.y - pr.y;
      P.heading += dh2;
      pr.x = rc.pos.x; pr.z = rc.pos.z; pr.y = rc.pos.y; pr.h = rc.heading;
    }
  }
  var mx = 0, mz = 0;
  if (GAME.key('KeyW')) mz += 1;
  if (GAME.key('KeyS')) mz -= 1;
  if (GAME.key('KeyA')) mx -= 1;
  if (GAME.key('KeyD')) mx += 1;
  if (T.active) { mx += T.stickX; mz += -T.stickY; }
  var mag = Math.min(1, U.len(mx, mz));
  if (P.carHurtCd > 0) P.carHurtCd -= dt;
  // Run is a CHOICE: Shift on desktop, the RUN toggle on touch. Full stick
  // deflection used to count as sprinting too, which meant nobody ever
  // walked — a pinned stick is simply how you move on a phone, and on any
  // desktop whose browser reports touch (most precision touchpads do) the
  // layer enables and a held W read as a pinned stick.
  var run = ((GAME.key('ShiftLeft') || GAME.key('ShiftRight')) || T.run) && !aiming;
  var target = mag * (aiming ? 2.0 : run ? 8 : 4.2);   // the 2.8 walk read as slow motion, and sprint keeps its lead over it
  P.moveSpeed = U.damp(P.moveSpeed, target, 8, dt);

  if (mag > 0.05) {
    // camera-relative: forward = dir(yaw), screen-right = dir(yaw - pi/2) = (-cos, sin)
    var camYaw = GAME.cam.yaw;
    var wx = Math.sin(camYaw) * mz - Math.cos(camYaw) * mx;
    var wz = Math.cos(camYaw) * mz + Math.sin(camYaw) * mx;
    var moveH = Math.atan2(wx, wz);
    if (!aiming) P.heading = U.angleLerp(P.heading, moveH, Math.min(1, dt * 10));
    P.moveH = moveH;
  }
  if (aiming) {
    // locked on, the whole body squares up to the TARGET — the hand points
    // where the bullets will actually go, not wherever the camera drifted
    var lockT = GAME.combat.lockTarget;
    P.heading = lockT ? Math.atan2(lockT.pos.x - P.pos.x, lockT.pos.z - P.pos.z) : GAME.cam.yaw;
  }

  var h = (mag > 0.05) ? P.moveH : P.heading;
  var nx = P.pos.x + Math.sin(h) * P.moveSpeed * dt * (mag > 0.05 ? 1 : 0);
  var nz = P.pos.z + Math.cos(h) * P.moveSpeed * dt * (mag > 0.05 ? 1 : 0);
  var rp = GAME.resolveCircle(nx, nz, 0.45, P.pos.y);
  nx = rp.x; nz = rp.z;
  // solid cars — from the side. Above the body you're standing or sailing
  // over it, and neither the push nor the run-over check applies up there.
  var cars = GAME.world.cars;
  for (var i = 0; i < cars.length; i++) {
    var c = cars[i];
    if (P.pos.y - c.pos.y > carBodyTop(c) - 0.35) continue;
    var dx = nx - c.pos.x, dz = nz - c.pos.z;
    var d2 = dx * dx + dz * dz;
    var rr = c.radius + 0.4;
    if (d2 < rr * rr && d2 > 0.001) {
      var d = Math.sqrt(d2);
      nx = c.pos.x + dx / d * rr;
      nz = c.pos.z + dz / d * rr;
      // one hit per contact: gate by a short cooldown so a single bump can't
      // drain health across many frames of overlap
      if (Math.abs(c.speed) > 8 && P.carHurtCd <= 0) {
        GAME.playerDamage(Math.min(30, Math.abs(c.speed) * 0.9), 'car');
        P.carHurtCd = 0.8;
        var kb = 3.2;
        nx += dx / d * kb; nz += dz / d * kb;
      }
    }
  }
  P.pos.x = nx; P.pos.z = nz;
  // the closed channel's line stops walkers too — parachuting onto the
  // bridge deck past the barrier used to leave a free stroll to the island
  if (GAME.aircraft) GAME.aircraft.enforceAirspace(P.pos);
  if (GAME.city.isInWater(P.pos.x, P.pos.z, P.pos.y)) { GAME.playerDrown(); return; }
  // vertical: stand on the surface below (street or rooftop); walk off an edge and fall
  var surf = GAME.city.surfaceY(P.pos.x, P.pos.z, P.pos.y);
  // ...and car roofs count as ground: come down inside a car's rectangle at
  // roof height and you stand on it (and ride it, if it drives off)
  var roofCar = null;
  for (var rci = 0; rci < cars.length; rci++) {
    var rcc = cars[rci];
    if (rcc.dead) continue;
    var rdx = P.pos.x - rcc.pos.x, rdz = P.pos.z - rcc.pos.z;
    var rad = rcc.radius + 1;
    if (rdx * rdx + rdz * rdz > rad * rad) continue;
    var rsn = Math.sin(rcc.heading), rcs = Math.cos(rcc.heading);
    var rlz = rdx * rsn + rdz * rcs, rlx = rdx * rcs - rdz * rsn;
    if (Math.abs(rlx) > rcc.spec.w / 2 + 0.12 || Math.abs(rlz) > rcc.spec.l / 2 + 0.12) continue;
    var rY = carRoofY(rcc, rlx, rlz);
    if (rY === null) continue;
    rY = deckWorldY(rcc, rlx, rY, rlz);
    if (P.pos.y >= rY - 0.5 && rY > surf) { surf = rY; roofCar = rcc; }
  }
  // Space jumps when you're on your feet (running gives you a longer hop)
  var grounded = P.pos.y <= surf + 0.06;
  var wantJump = GAME.key('Space') || T.jump;
  if (grounded && wantJump && !P.jumpLatch) {
    P.velY = 7.2 + Math.min(P.moveSpeed, 6) * 0.22;
    P.pos.y = surf + 0.07;
    GAME.audio.punch();
  }
  P.jumpLatch = wantJump;
  P.airborne = P.pos.y > surf + 0.06;
  if (P.airborne) {
    P.velY = (P.velY || 0) - 22 * dt;
    P.pos.y += P.velY * dt;
    if (P.pos.y <= surf) {
      var impact = -(P.velY || 0);
      P.pos.y = surf; P.velY = 0; P.airborne = false;
      if (impact > 12) {
        GAME.playerDamage(Math.min(95, (impact - 12) * 6), 'fall');
        GAME.cameraShake = Math.min(1, impact / 18);
      }
    }
  } else {
    P.pos.y = surf; P.velY = 0;
  }
  // grounded on a car: remember it (and snapshot its transform on first
  // contact) so next frame's ride-follow moves you with it
  if (!P.airborne && roofCar) {
    if (P.roofCar !== roofCar) {
      P.roofPrev = { x: roofCar.pos.x, z: roofCar.pos.z, y: roofCar.pos.y, h: roofCar.heading };
    }
    P.roofCar = roofCar;
  } else {
    P.roofCar = null;
  }
  P.mesh.rotation.y = P.heading;

  // walk anim — the same gait throughout; cadence follows moveSpeed
  P.walkPhase = (P.walkPhase || 0) + P.moveSpeed * dt * 2.2;
  var j = P.mesh.userData.joints;
  var s = Math.sin(P.walkPhase) * Math.min(1, P.moveSpeed / 2.5) * 0.7;
  j.legL.rotation.x = s; j.legR.rotation.x = -s;
  j.torso.rotation.x = 0;
  if (P.airborne) {
    // airborne: tuck the legs and throw the arms up
    j.legL.rotation.x = -0.75; j.legR.rotation.x = -0.35;
    j.armL.rotation.x = -2.2; j.armR.rotation.x = -2.2;
    j.torso.rotation.x = 0.1;
  } else if (P.punchT > 0) {
    // throwing a punch: drive the lead arm out, overriding the walk swing
    P.punchT -= dt;
    var k = 1 - P.punchT / 0.26;
    var ext = Math.sin(U.clamp(k, 0, 1) * Math.PI);
    j.armR.rotation.x = -1.75 * ext;
    j.armL.rotation.x = -s * 0.5;
    j.torso.rotation.y = -0.35 * ext;
  } else if (aiming && P.currentWeapon !== 'fist') {
    j.torso.rotation.y = 0;
    // the arm follows the lock in elevation too — raised at a rooftop
    // target, dropped at someone below, level otherwise
    var armT = GAME.combat.lockTarget;
    if (armT) {
      var adx = armT.pos.x - P.pos.x, adz = armT.pos.z - P.pos.z;
      var ad = Math.sqrt(adx * adx + adz * adz) || 1;
      var aimUp = Math.atan2((armT.pos.y + 1.1) - (P.pos.y + 1.35), ad);
      j.armR.rotation.x = -Math.PI / 2 - U.clamp(aimUp, -0.7, 0.7);
    } else {
      j.armR.rotation.x = -Math.PI / 2 + GAME.cam.pitch * 0.5;
    }
    j.armL.rotation.x = -s * 0.4;
  } else {
    j.torso.rotation.y = 0;
    j.armL.rotation.x = -s * 0.8;
    j.armR.rotation.x = s * 0.8;
  }

  if (wantsEnter()) {
    var car = nearestEnterableCar();
    if (car) GAME.enterCar(car);
  }
  GAME.audio.engineState(false, 0);
}

function updateDriving(dt) {
  var P = GAME.player, inp = GAME.input, T = inp.touch;
  var car = P.car;
  if (!car || car.dead) {
    if (car && car.dead) forceExitCar();
    return;
  }
  if (car.spec.heli || car.spec.plane) {
    GAME.track(car.spec.plane ? 'flew-plane' : 'flew-helicopter');
    if (wantsEnter()) {
      // the chute is for real air, not for stepping off a landed aircraft.
      // Measure to whatever is directly beneath — street OR rooftop — and
      // only bail out with about three floors of open drop below the wheels.
      var sy = GAME.city.surfaceY(car.pos.x, car.pos.z);
      if (car.pos.y > sy + 9) {
        car.occupied = null; // the abandoned airframe is now ownerless (it will fall)
        GAME.aircraft.startParachute(car.pos.x, car.pos.y, car.pos.z, car.heading);
      } else forceExitCar();
      return;
    }
    if (car.spec.plane) GAME.aircraft.updatePlane(dt);
    else GAME.aircraft.updateHeli(dt);
    if (GAME.keyPressed('Comma')) GAME.hud.radioPopup(GAME.audio.radio.switchStation(-1));
    if (GAME.keyPressed('Period')) GAME.hud.radioPopup(GAME.audio.radio.switchStation(1));
    return;
  }
  // ground vehicles answer to the closed channel's line too (a truck that
  // hopped the barrier onto the bridge deck is not a loophole)
  if (GAME.aircraft) GAME.aircraft.enforceAirspace(car.pos);
  var c = car.controls;
  if (GAME.autopilot) {
    if (!car.ai || car.ai.mode !== 'traffic') car.ai = { mode: 'traffic', desired: 13, laneX: 0, laneZ: 0 };
    GAME.vehicles.trafficControls(car, dt, c);
  } else {
    // steering: positive heading delta turns left in this parametrization, so D maps to -1
    var th = 0, st = 0;
    if (GAME.key('KeyW')) th += 1;
    if (GAME.key('KeyS')) th -= 1;
    if (GAME.key('KeyA')) st += 1;
    if (GAME.key('KeyD')) st -= 1;
    if (T.active) {
      th += (T.gas ? 1 : 0) + (T.brake ? -1 : 0);
      st -= T.stickX;
    }
    c.throttle = U.clamp(th, -1, 1);
    c.steer = U.clamp(st, -1, 1);
    // the monster truck's party trick: Space launches it straight up
    var wantHop = GAME.key('Space') || T.handbrake;
    if (car.spec.monster) {
      var mgy = GAME.city.driveSurfaceY(car.pos.x, car.pos.z, car.pos.y);
      if (wantHop && !P.hopLatch && car.pos.y <= mgy + 0.1) {
        car.vy = 13.5;
        car.pos.y = mgy + 0.12;
        GAME.audio.crash(0.35, car.pos.x, car.pos.z);
        GAME.cameraShake = 0.4;
      }
      P.hopLatch = wantHop;
      c.handbrake = false;
    } else {
      P.hopLatch = false;
      c.handbrake = wantHop;
    }
  }

  var sp = Math.abs(car.speed);
  GAME.audio.engineState(true, sp / car.spec.maxSpeed);
  var slide = Math.abs(car.lat);
  GAME.audio.skid(slide > 2.5 || (c.handbrake && sp > 8) ? Math.min(1, slide / 8 + 0.3) : 0);

  if (wantsEnter()) { forceExitCar(); return; }

  if (P.onBike) updateBikeRider(dt);

  // radio switching
  if (GAME.keyPressed('Comma')) GAME.hud.radioPopup(GAME.audio.radio.switchStation(-1));
  if (GAME.keyPressed('Period')) GAME.hud.radioPopup(GAME.audio.radio.switchStation(1));
}

function updateBikeRider(dt) {
  var P = GAME.player, car = P.car;
  // lean the bike into turns / slides
  var lean = U.clamp(-car.controls.steer * Math.min(1, Math.abs(car.speed) / 12) * 0.5 - car.lat * 0.03, -0.6, 0.6);
  car.mesh.rotation.z = U.lerp(car.mesh.rotation.z, lean, Math.min(1, dt * 8));
  // seat the rider low on the saddle, sharing the bike's lean, straddling it
  var m = P.mesh;
  m.visible = true;
  m.position.set(car.pos.x, car.pos.y - 0.02, car.pos.z);
  m.rotation.set(0, car.heading, car.mesh.rotation.z);
  m.translateZ(-0.35); // sit back on the seat
  var j = m.userData.joints;
  j.torso.rotation.x = 0.34;                          // lean toward the bars
  j.legL.rotation.x = -0.55; j.legR.rotation.x = -0.55;
  j.legL.rotation.z = 0.2; j.legR.rotation.z = -0.2;  // knees out around the tank
  j.armL.rotation.x = -1.05; j.armR.rotation.x = -1.05; // hands on the handlebars
}

var shakePrev = 0;
function updateCamera(dt) {
  var P = GAME.player, inp = GAME.input, cam = GAME.cam;
  var mdx = inp.mouseDX, mdy = inp.mouseDY;
  inp.mouseDX = 0; inp.mouseDY = 0;
  if (inp.touch.camDX) { mdx += inp.touch.camDX; mdy += inp.touch.camDY; inp.touch.camDX = 0; inp.touch.camDY = 0; }

  var aiming = GAME.combat.aiming && !P.inCar;

  if (P.inCar && P.car) {
    // any mouse action holds the free look; two idle seconds and the camera
    // swings itself back behind the car so the road ahead is visible again
    if (Math.abs(mdx) > 0.5 || Math.abs(mdy) > 0.5) cam.freeT = 2.0;
    cam.freeT = Math.max(0, cam.freeT - dt);
    if (cam.freeT > 0) {
      cam.yaw -= mdx * 0.0032;
      cam.pitch = U.clamp(cam.pitch + mdy * 0.002, 0.08, 1.1);
    } else {
      var behind = P.car.heading + (P.car.speed < -2 ? Math.PI : 0);
      cam.yaw = U.angleLerp(cam.yaw, behind, Math.min(1, dt * 3.4));
      cam.pitch = U.damp(cam.pitch, 0.26, 2.6, dt);
    }
    var heli = P.car.spec.heli, plane = P.car.spec.plane;
    var sp = heli ? Math.abs(P.car.heliSpeed || 0) : Math.abs(P.car.speed);
    var base = plane ? 16 : heli ? 13 : 7.2;
    cam.dist = U.damp(cam.dist, base + sp * (plane ? 0.06 : 0.13), 3, dt);
  } else {
    cam.yaw -= mdx * 0.0032;
    cam.pitch = U.clamp(cam.pitch + mdy * 0.002, -0.15, 1.2);
    cam.dist = U.damp(cam.dist, aiming ? 3.1 : 5.6, 6, dt);
  }

  var focus = P.inCar && P.car ? P.car.pos : P.pos;
  var fy = focus.y + (P.inCar ? 1.7 : 1.55);
  var fx = focus.x, fz = focus.z;
  if (aiming) {
    // over-the-shoulder offset
    fx += Math.sin(cam.yaw + Math.PI / 2) * 0.75;
    fz += Math.cos(cam.yaw + Math.PI / 2) * 0.75;
  }
  var cy = fy + Math.sin(cam.pitch) * cam.dist + (P.inCar ? 0.6 : 0);
  var horiz = Math.cos(cam.pitch) * cam.dist;
  var cx = fx - Math.sin(cam.yaw) * horiz;
  var cz = fz - Math.cos(cam.yaw) * horiz;

  // pull camera in when a building blocks the view
  var boxes = GAME.city.hash.query((fx + cx) / 2, (fz + cz) / 2, cam.dist + 2);
  var dirX = cx - fx, dirZ = cz - fz;
  var bestT = 1;
  for (var i = 0; i < boxes.length; i++) {
    var b = boxes[i];
    if (b.noLOS || (b.h && b.h < cy - 1)) continue;
    var t = rayAABB(fx, fz, dirX, dirZ, b);
    if (t < bestT) bestT = Math.max(0.12, t - 0.05);
  }
  cx = fx + dirX * bestT; cz = fz + dirZ * bestT;
  cy = fy + (cy - fy) * (0.4 + 0.6 * bestT);

  if (GAME.cameraShake > 0.01) {
    // A rise means a fresh knock rather than the tail of the last one. The
    // shake is the game's existing "this happened to YOU" signal — every
    // caller already filtered for the player's own car, own fall, own
    // airframe — so one read here covers all of them without a hook at each.
    if (GAME.cameraShake > shakePrev + 0.05) GAME.haptics.knock(GAME.cameraShake - shakePrev);
    GAME.cameraShake *= Math.exp(-5 * dt);
    cx += (Math.random() - 0.5) * GAME.cameraShake * 0.6;
    cy += (Math.random() - 0.5) * GAME.cameraShake * 0.5;
    cz += (Math.random() - 0.5) * GAME.cameraShake * 0.6;
  }
  shakePrev = GAME.cameraShake;

  cam.x = U.damp(cam.x || cx, cx, 20, dt);
  cam.y = U.damp(cam.y || cy, cy, 20, dt);
  cam.z = U.damp(cam.z || cz, cz, 20, dt);
  GAME.cameraObj.position.set(cam.x, Math.max(cam.y, GAME.city.groundY(cam.x, cam.z) + 0.5), cam.z);
  var lookY = fy + (aiming ? Math.tan(-cam.pitch + 0.2) * 10 * 0 : 0);
  GAME.cameraObj.lookAt(fx + Math.sin(cam.yaw) * 4 * (aiming ? 1 : 0), lookY, fz + Math.cos(cam.yaw) * 4 * (aiming ? 1 : 0));
}
