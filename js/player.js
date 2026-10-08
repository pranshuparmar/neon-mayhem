GAME.player = {
  pos: null, mesh: null, heading: 0,
  inCar: false, car: null,
  health: 100, armor: 0, cash: 250,
  state: 'alive', stateT: 0,
  weapons: { fist: { have: true, ammo: Infinity } },
  currentWeapon: 'fist',
  moveSpeed: 0,
  // run-over cooldown. It has to start as a number: left undefined, the
  // `<= 0` gate on it was never true, and no car could hurt you on foot
  carHurtCd: 0,
  mantle: null,     // a climb onto a ledge in progress (tryMantle)
  // in the sea (updateSwimming): how far over into a stroke the body is,
  // where the arms are in it, the next splash, and whether the how-to has
  // been shown this session
  swimming: false, swimPitch: 0, swimPhase: 0, swimFx: 0, swimTold: false,
  interior: null    // the room you are in (interiors.js), or null out in the world
};

GAME.cam = { yaw: Math.PI, pitch: 0.32, dist: 6, freeT: 0, x: 0, y: 5, z: 0 };
GAME.cameraShake = 0;

// where the player effectively is (their vehicle when driving, else on foot)
GAME.focus = function () {
  var P = GAME.player;
  // in a room, the world carries on round its front door (interiors.js)
  if (P.interior && GAME.interiors && GAME.interiors.door) return GAME.interiors.door;
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
  // yaw, then pitch and roll about the body's own axes: a swimmer leans
  // forward into the stroke whichever way they face (with no pitch this is
  // exactly the default order, so nothing upright changes)
  mesh.rotation.order = 'YXZ';
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

// `fromX`/`fromZ`, when the caller knows them, are where it came from: the
// HUD turns an arc toward it
GAME.playerDamage = function (amt, cause, fromX, fromZ) {
  var P = GAME.player;
  if (!GAME.started || P.state !== 'alive' || GAME.godMode) return;
  // in the glass lift, out of everybody's reach for the ride (interiors.js)
  if (GAME.interiors && GAME.interiors.riding && GAME.interiors.riding()) return;
  if (fromX !== undefined) GAME.hud.hitFrom(fromX, fromZ);
  // a vest stops a bullet, not the pavement
  if (P.armor > 0 && cause !== 'fall') {
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
  var kept = GAME.jumpArsenal || GAME.unlimitedAmmo;   // the arsenal goes where you go
  var body = home
    ? 'You wake up at your place. Cash and weapons intact.'
    : ownsElsewhere
      ? 'You wake up at the local hospital — your bed is on the other island. ' + (kept ? 'Cash and weapons intact.' : 'Weapons gone, cash intact.')
      : 'You wake up at the hospital. ' + (kept ? 'Cash and weapons intact.' : 'Weapons gone, cash intact.');
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
  GAME.hud.showBig('busted', 'Released with a $' + fine + ' fine. ' +
    (GAME.jumpArsenal || GAME.unlimitedAmmo ? 'Your guns come back with you.' : 'Weapons confiscated.'));
  GAME.missions.failActive('You got busted.');
};

GAME.playerDrown = function () {
  var P = GAME.player;
  if (P.drowning || P.state !== 'alive') return;
  P.drowning = true;
  GAME.audio.splash();
  GAME.hud.fade(function () {
    if (P.inCar) forceExitCar(true);
    stopSwim();
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
    stopSwim();
    if (GAME.interiors) GAME.interiors.reset();
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
        // out of your own door the way a session starts there, not still
        // facing however you fell — which could put the camera in the awning
        P.heading = home.heading;
        GAME.cam.yaw = P.heading; GAME.cam.pitch = 0.32;
        GAME.cam.x = GAME.cam.y = GAME.cam.z = null;
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
    // every stunt jump found: the arsenal survives a hospital or cell visit
    var keepGear = GAME.jumpArsenal || (kind === 'wasted' && GAME.shops && GAME.shops.homeSpawn(P.pos.x, P.pos.z));
    if (!keepGear) {
      P.weapons = { fist: { have: true, ammo: Infinity } };
      P.currentWeapon = 'fist';
    }
    // everything finished: and it never runs dry
    if (GAME.unlimitedAmmo) GAME.combat.giveAllWeapons();
    GAME.combat.refreshWeaponHud();
    GAME.police.clearWanted();
    // The old life's fires are not your crimes: a cruiser rammed before
    // you went down used to cook off AFTER the respawn, and its kill_cop
    // handed you fresh stars at your own front door. Sever every player
    // attribution the previous life left smouldering in the world.
    GAME.world.cars.forEach(function (wc) { wc.byPlayer = false; });
    P.state = 'alive';
    // the first time back on your feet, what it cost and how to do better
    if (GAME.lola) GAME.lola.first(kind === 'busted' ? 'busted' : 'wasted');
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
  // nor is one that has gone into the sea (vehicles.js is taking it down),
  // or one still in the air off a ramp
  if (car.sinking || (car.air || 0) > 0.05) return false;
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
  stopSwim();
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
  // over the side of a boat from the water or down off a pier: to the
  // gunwale, not the "ground" under the sea
  P.pos.y = car.spec.boat ? U.damp(P.pos.y, car.pos.y + 0.5, 8, dt) : GAME.city.surfaceY(P.pos.x, P.pos.z, P.pos.y);
  P.mesh.rotation.y = P.heading;
  P.walkPhase = (P.walkPhase || 0) + dt * 11;
  var j = P.mesh.userData.joints;
  var s = Math.sin(P.walkPhase) * 0.6;
  j.legL.rotation.x = s; j.legR.rotation.x = -s;
  j.armL.rotation.x = -s * 0.7; j.armR.rotation.x = s * 0.7;
  if (e.t >= e.dur) {
    P.entering = null;
    j.legL.rotation.x = j.legR.rotation.x = j.armL.rotation.x = j.armR.rotation.x = 0;
    sitIn(car);
  }
}

// The pad, for the prompts said on climbing in: they named keys a
// controller does not have (controls.js says which device is in hand).
function promptOnPad() { return !!(GAME.controls && GAME.controls.usingPad && GAME.controls.usingPad()); }
function jobKey() { return promptOnPad() ? 'X' : 'J (or JOB)'; }

// In the seat: the end of the walk to the door, and all of a mission retry,
// which hands you the wheel on the start line behind a fade.
function sitIn(car) {
  var P = GAME.player;
  P.mantle = null;
  stopSwim();
  car.controls = { throttle: 0, steer: 0, handbrake: false };
  P.inCar = true;
  P.car = car;
  P.onBike = !!car.spec.bike;
  P.mesh.visible = P.onBike || !!car.spec.boat; // riders stay visible on a bike, and at a boat's helm
  GAME.cam.freeT = 0;
  GAME.audio.radio.setVolume(GAME.audio.muted ? 0 : 0.7);
  GAME.hud.message(car.spec.label, 1.6);
  if (GAME.lola) GAME.lola.first(car.spec.boat ? 'boat' : car.spec.heli ? 'heli' : car.spec.plane ? 'plane' : '');
  // the radio comes on tuned to whatever the last driver left it on — the
  // first time, wherever a stranger had it; after that wherever YOU did.
  // It was re-rolled at random every time you got in.
  if (!car.spec.heli && !car.spec.plane) {
    var R = GAME.audio.radio;
    GAME.hud.radioPopup(car.radioStation >= 0 ? R.tune(car.radioStation) : R.randomStation());
    car.radioStation = R.index;
  }
  var pad = promptOnPad();
  if (car.spec.gunship) GAME.hud.message(pad ? 'TALON — RT up · LT down · stick fly · RB chin gun · LB rockets · Y to exit'
    : 'TALON — Space up · Shift down · WASD fly · LMB/GUN chin gun · RMB/RKT rockets · F to exit', 5);
  else if (car.spec.plane) GAME.hud.message(pad ? 'Plane — RT throttle up the runway, pull back on the stick to climb once fast · stick turns · Y to bail out'
    : 'Plane — W throttle up the runway, Space to climb once fast · A/D turn · F to bail out', 4.5);
  else if (car.spec.heli) GAME.hud.message(pad ? 'Heli — RT up · LT down · stick fly · Y to exit (bail with a chute if high up)'
    : 'Heli — Space up · Shift down · WASD fly · F to exit (bail with a chute if high up)', 4);
  else if (car.type === 'taxi') GAME.hud.message('Cab — press ' + jobKey() + ' to start a fare', 3);
  else if (car.type === 'ambulance') GAME.hud.message('Ambulance — press ' + jobKey() + ' for a paramedic run', 3);
  else if (car.type === 'icecream') GAME.hud.message('Ice cream truck — press ' + jobKey() + ' to start a round', 3);
  else if (car.type === 'police') GAME.hud.message('Cruiser — G for lights and siren, J (or JOB) for vigilante work', 3.5);
  else if (car.spec.boat) GAME.hud.message(pad ? 'Boat — RT/LT throttle · stick steers · A to slide it round · Y to step off (onto a pier, or over the side)'
    : 'Boat — W/S throttle · A/D steer · Space to slide it round · F to step off (onto a pier, or over the side)', 4.5);
}

// a turn of the dial is this car's from now on (sitIn tunes back to it)
GAME.switchRadio = function (dir) {
  var R = GAME.audio.radio, name = R.switchStation(dir);
  if (GAME.player.inCar && GAME.player.car) GAME.player.car.radioStation = R.index;
  GAME.hud.radioPopup(name);
};

GAME.seatInCar = function (car) {
  var P = GAME.player;
  if (!car || car.dead || P.inCar) return false;
  P.entering = null;
  if (car.parkedSpot) { car.parkedSpot.live = null; car.parkedSpot = null; }
  car.occupied = 'player';
  car.ai = null;
  sitIn(car);
  return true;
};

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
  var overboard = false;
  P.velY = 0;
  if (car.spec.heli || car.spec.plane) {
    var roofY = GAME.city.surfaceY(car.pos.x, car.pos.z);
    if (roofY > GAME.city.groundY(car.pos.x, car.pos.z) + 1) {
      // step out onto the rooftop beside the aircraft (don't shove out of the footprint);
      // if you then walk off the edge, on-foot gravity takes over
      P.pos.set(ex, roofY, ez);
    } else {
      var rp = GAME.resolveCircle(ex, ez, 0.45);
      P.pos.set(rp.x, GAME.city.groundY(rp.x, rp.z), rp.z);
    }
    // a hovering exit (under chute height) steps out at altitude — you drop
    // the rest of the way on ordinary gravity rather than teleporting down
    // (the heli's origin now sits at skid level, so its cabin floor IS its pos)
    var feetY = car.pos.y - (car.spec.plane ? (car.spec.wheelH || 1.1) : 0.1);
    if (feetY > P.pos.y + 0.3) { P.pos.y = feetY; P.airborne = true; }
  } else if (car.spec.boat) {
    overboard = !stepOffBoat(car);
  } else {
    stepOutBeside(car, ex, ez);
  }
  P.heading = car.heading;
  P.inCar = false;
  P.car = null;
  P.onBike = false;
  resetRiderPose();
  P.mesh.visible = true;
  GAME.audio.engineState(false, 0);
  GAME.audio.radio.setVolume(0);
  GAME.audio.skid(0);
  if (overboard) GAME.startSwim();
}
GAME.exitCar = forceExitCar;

// Off a boat: onto whatever is alongside, if there is something to stand on
// within a step — a pier, a jetty, the beach it has run up on — trying the
// side you would step out of first, then the other, then over the bow.
// Nothing there, and it is over the side into the water. True if dry.
function stepOffBoat(car) {
  var P = GAME.player, C = GAME.city;
  var sea = C.seaY(car.pos.x, car.pos.z);
  var dirs = [car.heading - Math.PI / 2, car.heading + Math.PI / 2, car.heading];
  for (var i = 0; i < dirs.length; i++) {
    // (a long step: the moorings lie a couple of metres off the planks)
    var d0 = i < 2 ? car.spec.w / 2 + 0.8 : car.spec.l / 2 + 0.6;
    for (var d = d0; d <= d0 + 3.2; d += 0.8) {
      var x = car.pos.x + Math.sin(dirs[i]) * d, z = car.pos.z + Math.cos(dirs[i]) * d;
      var top = swimLanding(x, z, sea);
      if (top === null) continue;
      var rp = GAME.resolveCircle(x, z, 0.45, top);
      P.pos.set(rp.x, C.surfaceY(rp.x, rp.z, top + 0.3), rp.z);
      P.velY = 0; P.airborne = false;
      return true;
    }
  }
  var side = dirs[0], off = car.spec.w / 2 + 0.9;
  P.pos.set(car.pos.x + Math.sin(side) * off, sea, car.pos.z + Math.cos(side) * off);
  P.velY = 0; P.airborne = false;
  return false;
}

// Where somebody getting out of a ground vehicle ends up: beside it, at ITS
// level. Out of a car parked on a roof you stand on the roof; off a ramp
// deck, on the deck; out of one in mid-air off a lip, you are in the air too,
// and on-foot gravity takes you down from there. This used to put you at the
// street's height under wherever you stepped out, whatever the car was doing
// — in mid-air you were simply on the ground, and on a roof the collider then
// shoved you out of the building's footprint and down to the pavement.
//
// The car's height goes to both lookups: resolveCircle so a roof the car is
// standing on is not a wall to be pushed out of, and the surface lookup so a
// bridge deck overhead does not lift you onto it.
function stepOutBeside(car, x, z) {
  var P = GAME.player;
  var atY = car.pos.y;
  var rp = GAME.resolveCircle(x, z, 0.45, atY);
  var standY = GAME.city.surfaceY(rp.x, rp.z, atY);
  P.pos.set(rp.x, standY, rp.z);
  P.velY = 0;
  P.airborne = false;
  if (atY > standY + 0.3) {
    P.pos.y = atY;
    P.airborne = true;
    // still rising off the lip, you carry on up for a moment before you drop
    if ((car.air || 0) > 0.05) P.velY = car.vy || 0;
  }
}

function resetRiderPose() {
  var j = GAME.player.mesh.userData.joints;
  j.legL.rotation.set(0, 0, 0); j.legR.rotation.set(0, 0, 0);
  j.armL.rotation.set(0, 0, 0); j.armR.rotation.set(0, 0, 0);
  j.torso.rotation.x = 0;
  GAME.player.mesh.rotation.z = 0;
  GAME.player.mesh.rotation.x = 0;   // a boat's trim, or a swimmer's lean
}

// thrown off the bike on a hard crash
GAME.ejectBike = function (impact) {
  var P = GAME.player;
  if (!P.onBike || !P.car) return;
  var car = P.car;
  var side = car.heading + (Math.random() < 0.5 ? 1.4 : -1.4);
  forceExitCar();
  // thrown clear at the bike's level — a crash on a roof leaves you on the roof
  stepOutBeside(car, car.pos.x + Math.sin(side) * 4, car.pos.z + Math.cos(side) * 4);
  GAME.fx.spawn(P.pos.x, P.pos.y + 0.6, P.pos.z, { count: 6, color: 0xffd890, spread: 3, life: 0.5 });
  GAME.cameraShake = 0.8;
  GAME.playerDamage(Math.min(35, 10 + impact * 1.2), 'crash');
  GAME.hud.message('Thrown off the bike!', 2);
};

// ---------- one too many ----------
// The Lucky Gull's drinks patch you up, and they add up. A couple and you
// feel them; a few more and the night swims: the picture leans and runs with
// colour, your feet wander off the line you meant, and the wheel pulls. It
// wears off on its own (a drink's worth every forty-five seconds), and sleep,
// a hospital or a cell clears your head at once. Near the top the bartender
// stops serving (shops.js asks GAME.drunk.cutOff).
var BOOZE_FADE = 1 / 45, BOOZE_MAX = 8;
var booze = 0, drunkPainted = false;
function drunkLevel() { return U.clamp((booze - 2) / 4, 0, 1); }
GAME.drunk = {
  get booze() { return booze; },
  get level() { return drunkLevel(); },
  get cutOff() { return booze >= BOOZE_MAX - 1; },
  // a drink's strength in drinks; says how far gone you were and are
  drink: function (n) {
    var before = drunkLevel();
    booze = Math.min(BOOZE_MAX, booze + n);
    return { before: before, after: drunkLevel() };
  },
  sober: function () { booze = 0; paintDrunk(0); }
};
// the colours run (a CSS filter on the canvas: the HUD stays readable, and a
// photo is taken from the frame as drawn, sober)
function paintDrunk(lv) {
  var cv = GAME.renderer && GAME.renderer.domElement;
  if (!cv) return;
  if (lv <= 0) {
    if (drunkPainted) { cv.style.filter = ''; drunkPainted = false; }
    return;
  }
  var t = GAME.time;
  cv.style.filter = 'hue-rotate(' + Math.round(Math.sin(t * 0.35) * 80 * lv) + 'deg) saturate(' + (1 + 0.9 * lv).toFixed(2) +
    ') blur(' + (lv * (0.5 + 0.4 * Math.sin(t * 1.1))).toFixed(2) + 'px)';
  drunkPainted = true;
}
var drunkSaid = 0;
function stepDrunk(dt) {
  if (GAME.player.state !== 'alive') booze = 0;      // wasted or busted: you come round sober
  else if (booze > 0) booze = Math.max(0, booze - BOOZE_FADE * dt);
  var lv = drunkLevel();
  paintDrunk(lv);
  // said once as it takes hold, and once as it lets go
  if (lv > 0 && !drunkSaid) { drunkSaid = 1; GAME.hud.message('One too many — the night has started to swim.', 3); }
  else if (lv === 0 && drunkSaid) { drunkSaid = 0; if (GAME.player.state === 'alive') GAME.hud.message('Your head clears.', 2.5); }
}

GAME.updatePlayer = function (dt) {
  var P = GAME.player, inp = GAME.input, T = inp.touch;
  stepDrunk(dt);
  // a horn is let go of when you get out, crash out or come off
  if (hornSounding && !(P.inCar && P.car && !P.car.dead && P.state === 'alive')) playerHorn(false);
  // riding the glass lift: the ride has the body and the camera (interiors.js)
  if (GAME.interiors && GAME.interiors.riding && GAME.interiors.riding()) return;
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

  enterHint(dt);
  if (P.entering) { stepEnter(dt); updateCamera(dt); return; }
  if (P.parachuting) { GAME.aircraft.updateParachute(dt); updateCamera(dt); return; }
  if (P.inCar) { P.shotT = 0; updateDriving(dt); }
  else updateOnFoot(dt);

  // pickups
  GAME.combat.checkPickups();
  updateCamera(dt);
};

var enterLatch = false;
function wantsEnter() {
  // The key is the press, buffered (GAME.keyPressed): read as "is it down
  // right now", a quick tap between two frames on a slow machine was never
  // seen, and getting in took three or four goes. The touch button latches.
  var t = GAME.input.touch.enter;
  var fired = GAME.keyPressed('KeyF') || (t && !enterLatch);
  enterLatch = t;
  return fired;
}
// "F — get in": said when there is something to get into, so walking up to
// a car is not a guess at how close is close enough (the touch layer has its
// ENTER button for this)
var enterHintT = 0, enterHintCar = null;
function enterHint(dt) {
  if (GAME.isTouch) return;
  enterHintT -= dt;
  if (enterHintT > 0) return;
  enterHintT = 0.15;
  var P = GAME.player;
  var car = !P.inCar && !P.entering && P.state === 'alive' && !P.interior ? nearestEnterableCar() : null;
  if (car && P.swimming && !car.spec.boat) car = null;
  if (car === enterHintCar) return;
  enterHintCar = car;
  GAME.hud.enterHint(car ? (GAME.controls ? GAME.controls.label('KeyF') : 'F') + ' — ' +
    (car.occupied === 'ai' ? 'take the ' : 'get in the ') + car.spec.label : '');
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

var footPush = { x: 0, z: 0 };   // resolveCircle's answer for the player on foot, reused
// ---------- climbing ----------
// A jump tops out at about 1.2 m, and that was the most anything could be
// climbed: a wall at chest height, a shipping container, a low roof were all
// sheer. Jump facing a ledge that tops out between knee and well over head
// height — up to 2.6 m — and you pull yourself up onto it. Only something
// you could really stand on counts: a building, a wall or a container, at
// least a metre and a bit across, with headroom on top.
var MANTLE_MIN = 0.7, MANTLE_MAX = 2.6, MANTLE_REACH = 0.9;
var mantleBoxes = [];
function tryMantle(feet) {
  var P = GAME.player;
  if (P.inCar || GAME.combat.aiming) return false;
  var h = P.moveSpeed > 0.5 && P.moveH !== undefined ? P.moveH : P.heading;
  var fx = Math.sin(h), fz = Math.cos(h);
  var px = P.pos.x + fx * MANTLE_REACH, pz = P.pos.z + fz * MANTLE_REACH;
  var boxes = GAME.city.hash.queryInto(px, pz, 0.05, mantleBoxes), best = null;
  for (var i = 0; i < boxes.length; i++) {
    var b = boxes[i];
    if (b.h === undefined || b.minY !== undefined) continue;
    if (b.tag !== 'building' && b.tag !== 'prop' && b.tag !== 'fence') continue;
    if (b.maxX - b.minX < 1.2 || b.maxZ - b.minZ < 1.2) continue;
    if (px <= b.minX || px >= b.maxX || pz <= b.minZ || pz >= b.maxZ) continue;
    var rise = b.h - feet;
    if (rise < MANTLE_MIN || rise > MANTLE_MAX) continue;
    if (!best || b.h > best.h) best = b;
  }
  if (!best) return false;
  // land a little way in from the edge, and only where that top is the top
  var lx = px + fx * 0.5, lz = pz + fz * 0.5;
  if (lx <= best.minX || lx >= best.maxX || lz <= best.minZ || lz >= best.maxZ) { lx = px; lz = pz; }
  if (GAME.city.surfaceY(lx, lz, best.h + 0.2) > best.h + 0.05) return false;
  P.mantle = { t: 0, dur: 0.35 + (best.h - feet) * 0.12, x0: P.pos.x, y0: P.pos.y, z0: P.pos.z, x1: lx, y1: best.h, z1: lz,
    lx: P.pos.x, ly: P.pos.y, lz: P.pos.z };
  P.heading = h;
  P.moveSpeed = 0;
  GAME.audio.punch();
  return true;
}
function stepMantle(dt) {
  var P = GAME.player, m = P.mantle;
  // moved by something else since the last step (a respawn, a teleport, a
  // car): the climb is over, wherever that left you
  if (m.t > 0 && (Math.abs(P.pos.x - m.lx) > 1.5 || Math.abs(P.pos.z - m.lz) > 1.5 || Math.abs(P.pos.y - m.ly) > 1.5)) {
    P.mantle = null;
    return;
  }
  m.t += dt;
  var k = Math.min(1, m.t / m.dur);
  // up first, then over the top
  var up = Math.min(1, k / 0.6), over = U.clamp((k - 0.45) / 0.55, 0, 1);
  P.pos.y = m.y0 + (m.y1 - m.y0) * (1 - (1 - up) * (1 - up));
  P.pos.x = m.x0 + (m.x1 - m.x0) * over;
  P.pos.z = m.z0 + (m.z1 - m.z0) * over;
  P.velY = 0; P.airborne = false; P.moveSpeed = 0;
  P.mesh.rotation.y = P.heading;
  // out of the water, the swimmer's lean straightens up as they come out
  P.mesh.rotation.x = (m.pitch0 || 0) * (1 - k);
  var j = P.mesh.userData.joints;
  if (m.wade) {
    // walking up out of the shallows: a stride, not a haul
    var sw = Math.sin(k * Math.PI * 2) * 0.6;
    j.legL.rotation.x = sw; j.legR.rotation.x = -sw;
    j.armL.rotation.x = -sw * 0.8; j.armR.rotation.x = sw * 0.8;
  } else {
    j.armL.rotation.x = j.armR.rotation.x = -2.7 * (1 - over);
    j.legL.rotation.x = 0.7 * (1 - over); j.legR.rotation.x = -0.25 * (1 - over);
  }
  m.lx = P.pos.x; m.ly = P.pos.y; m.lz = P.pos.z;
  if (k >= 1) {
    P.mantle = null;
    P.pos.set(m.x1, m.y1, m.z1);
    P.mesh.rotation.x = 0;
    j.armL.rotation.x = j.armR.rotation.x = j.legL.rotation.x = j.legR.rotation.x = 0;
  }
}

// ---------- swimming ----------
// The sea used to be a wall with a fade on it: one step off the sand and the
// screen went dark and put you back on the beach. Now you are in it. You
// swim at the surface — slower than you walk, a little quicker with sprint —
// and you get out where the water lets you: up a beach, or hauled out onto a
// pier, a jetty or a low edge. Your hands are busy, so no guns. A car that
// goes into the sea still goes under, but you swim out of it, and a canopy
// brought down on the water leaves you swimming rather than on the sand.
var SWIM_SPEED = 2.4, SWIM_SPRINT = 3.6;
var SWIM_REACH = 2.9;                    // the highest edge you can pull yourself out onto, above the water
var SWIM_DEPTH = 1.35, SWIM_FLAT = 0.42; // feet under the surface: treading water, and stretched out in a stroke
var SWIM_LEAN = 1.3;                     // how far over a stroke lays you
var FULL_TURN = Math.PI * 2;
// water thrown up going in, by the arms in a stroke, and off you climbing out
var SWIM_SPLASH = { count: 10, color: 0xd8ecf8, spread: 2, vy: 3, life: 0.6, grav: -9, keep: true, floor: -9 };
var SWIM_STROKE = { count: 3, color: 0xe8f4ff, spread: 0.6, vy: 1.6, life: 0.4, grav: -8, keep: true, floor: -9 };
var SWIM_DRIP = { count: 6, color: 0xd8ecf8, spread: 1, vy: 1.5, life: 0.5, grav: -9, keep: true, floor: -9 };
// Something to stand on at (x, z) that a swimmer could get up onto — land,
// a pier, a jetty, the low end of a bridge — and how high it is; null for
// open water or anything out of reach (a bridge deck far overhead, a wall).
function swimLanding(x, z, sea) {
  var C = GAME.city, top = null;
  if (C.isOnPier(x, z) || C.islandAt(x, z)) top = C.surfaceY(x, z, sea + SWIM_REACH - 0.6);
  else {
    var cy = C.crossings.length ? C.crossingY(x, z, sea + SWIM_REACH - 2.5) : null;
    var dy = C.decks.length ? C.deckAt(x, z) : null;
    if (cy !== null) top = cy;
    if (dy !== null && dy <= sea + SWIM_REACH && (top === null || dy > top)) top = dy;
  }
  return top !== null && top <= sea + SWIM_REACH ? top : null;
}
GAME.startSwim = function () {
  var P = GAME.player;
  if (P.swimming || P.state !== 'alive' || P.inCar) return;
  if (P.parachuting) GAME.aircraft.land();
  P.swimming = true;
  if (GAME.lola) GAME.lola.first('swim');
  P.swimPitch = 0; P.swimPhase = 0; P.swimFx = 0;
  P.velY = 0; P.airborne = false; P.roofCar = null; P.mantle = null;
  P.moveSpeed = Math.min(P.moveSpeed || 0, SWIM_SPEED);
  var sea = GAME.city.seaY(P.pos.x, P.pos.z);
  P.pos.y = sea - SWIM_DEPTH;
  GAME.audio.splash();
  GAME.fx.spawn(P.pos.x, sea + 0.2, P.pos.z, SWIM_SPLASH);
  if (!P.swimTold) {
    P.swimTold = true;
    var fast = GAME.isTouch ? 'RUN' : (GAME.controls ? GAME.controls.label('ShiftLeft') : 'Shift');
    GAME.hud.message('Swimming — ' + fast + ' for a faster stroke. Climb out at a beach, a pier or a low edge.', 4.5);
  }
};
function stopSwim() {
  var P = GAME.player;
  if (!P.swimming) return;
  P.swimming = false;
  P.swimPitch = 0;
  P.mesh.rotation.x = 0;
  var j = P.mesh.userData.joints;
  j.armL.rotation.set(0, 0, 0); j.armR.rotation.set(0, 0, 0);
  j.legL.rotation.set(0, 0, 0); j.legR.rotation.set(0, 0, 0);
  j.torso.rotation.x = 0;
}
GAME.stopSwim = stopSwim;
// out through the window of a car going under, and swimming for it
GAME.swimOutOf = function (car) {
  var P = GAME.player;
  if (!P.inCar || P.car !== car) return;
  forceExitCar(true);
  P.airborne = false; P.velY = 0;
  GAME.hud.message('Out through the window — swim for it!', 2.2);
  if (GAME.city.isInWater(P.pos.x, P.pos.z, P.pos.y)) GAME.startSwim();
};

function updateSwimming(dt) {
  var P = GAME.player, T = GAME.input.touch, C = GAME.city;
  var sea = C.seaY(P.pos.x, P.pos.z);
  // put somewhere dry by something else — a respawn, a teleport — and done
  if (!C.isInWater(P.pos.x, P.pos.z, P.pos.y) || P.pos.y > sea + 0.6) { stopSwim(); return; }
  var mx = 0, mz = 0;
  if (GAME.key('KeyW')) mz += 1;
  if (GAME.key('KeyS')) mz -= 1;
  if (GAME.key('KeyA')) mx -= 1;
  if (GAME.key('KeyD')) mx += 1;
  if (T.active) { mx += T.stickX; mz += -T.stickY; }
  if (GAME.pad.on) { mx += GAME.pad.lx; mz += -GAME.pad.ly; }
  var mag = Math.min(1, U.len(mx, mz));
  var fast = GAME.key('ShiftLeft') || GAME.key('ShiftRight') || T.run;
  // water is slow to get going in and slow to stop in
  P.moveSpeed = U.damp(P.moveSpeed, mag * (fast ? SWIM_SPRINT : SWIM_SPEED), 2.5, dt);
  if (mag > 0.05) {
    var camYaw = GAME.cam.yaw;
    var wx = Math.sin(camYaw) * mz - Math.cos(camYaw) * mx;
    var wz = Math.cos(camYaw) * mz + Math.sin(camYaw) * mx;
    P.moveH = Math.atan2(wx, wz);
    P.heading = U.angleLerp(P.heading, P.moveH, Math.min(1, dt * 4));
  }
  var nx = P.pos.x + Math.sin(P.heading) * P.moveSpeed * dt;
  var nz = P.pos.z + Math.cos(P.heading) * P.moveSpeed * dt;
  var rp = GAME.resolveCircle(nx, nz, 0.45, P.pos.y, footPush);
  nx = rp.x; nz = rp.z;
  // where the water ends: up a beach, or out onto an edge within reach —
  // only while actually swimming at it; drifting up against one is not
  // asking to climb. Anything else that is not open water is a wall.
  var top = swimLanding(nx, nz, sea);
  if (top !== null) {
    if (P.moveSpeed > 0.5 && mag > 0.05) { climbOut(nx, nz, top, sea); return; }
    nx = P.pos.x; nz = P.pos.z;
  } else if (!C.isInWater(nx, nz, P.pos.y)) {
    nx = P.pos.x; nz = P.pos.z;
  }
  P.pos.x = nx; P.pos.z = nz;
  if (GAME.aircraft) GAME.aircraft.enforceSea(P.pos);
  // at the surface: low in the water treading it, stretched out along the
  // top of it in a stroke, and riding the swell either way
  sea = C.seaY(P.pos.x, P.pos.z);
  var stroking = P.moveSpeed > 0.6;
  P.swimPitch = U.damp(P.swimPitch, stroking ? SWIM_LEAN : 0.1, 4, dt);
  var flat = U.clamp(P.swimPitch / SWIM_LEAN, 0, 1);
  P.pos.y = sea - (SWIM_DEPTH + (SWIM_FLAT - SWIM_DEPTH) * flat);
  P.velY = 0; P.airborne = false;
  P.mesh.rotation.y = P.heading;
  P.mesh.rotation.x = P.swimPitch;
  // front crawl — the arms wheel over half a turn apart and the legs kick —
  // blending into treading water: arms out sculling, legs cycling
  P.swimPhase = (P.swimPhase + dt * (stroking ? 2 + P.moveSpeed * 1.2 : 2.6)) % FULL_TURN;
  var ph = P.swimPhase, j = P.mesh.userData.joints, tread = 1 - flat;
  var crawlL = (ph % FULL_TURN) - Math.PI, crawlR = ((ph + Math.PI) % FULL_TURN) - Math.PI;
  j.armL.rotation.x = crawlL * flat + Math.sin(ph) * 0.35 * tread;
  j.armR.rotation.x = crawlR * flat - Math.sin(ph) * 0.35 * tread;
  j.armL.rotation.z = -0.95 * tread; j.armR.rotation.z = 0.95 * tread;
  var kick = Math.sin(ph * 3) * 0.32 * flat + Math.sin(ph * 1.5) * 0.5 * tread;
  j.legL.rotation.x = kick; j.legR.rotation.x = -kick;
  j.torso.rotation.x = 0;
  if (stroking) {
    P.swimFx -= dt;
    if (P.swimFx <= 0) {
      P.swimFx = 0.3;
      GAME.fx.spawn(P.pos.x + Math.sin(P.heading) * 1.3, sea + 0.1, P.pos.z + Math.cos(P.heading) * 1.3, SWIM_STROKE);
    }
  }
  // a boat alongside: climb in over the side
  if (wantsEnter()) {
    var car = nearestEnterableCar();
    if (car && car.spec.boat) GAME.enterCar(car);
  }
  GAME.audio.engineState(false, 0);
}
function climbOut(x, z, top, sea) {
  var P = GAME.player;
  // land a little way in from the edge, where the same surface carries on
  var fx = Math.sin(P.heading), fz = Math.cos(P.heading);
  var lx = x + fx * 0.6, lz = z + fz * 0.6;
  var ly = swimLanding(lx, lz, sea);
  if (ly === null || Math.abs(ly - top) > 0.5) { lx = x; lz = z; ly = top; }
  var pitch0 = P.swimPitch, y0 = P.pos.y;
  stopSwim();
  // a beach runs on down under the water: walking up out of it is a stride
  var wade = ly < sea + 0.35;
  P.mantle = { t: 0, dur: wade ? 0.45 : 0.4 + (ly - y0) * 0.12, x0: P.pos.x, y0: y0, z0: P.pos.z, x1: lx, y1: ly, z1: lz,
    lx: P.pos.x, ly: y0, lz: P.pos.z, wade: wade, pitch0: pitch0 };
  P.moveSpeed = 0;
  GAME.fx.spawn(P.pos.x, sea + 0.3, P.pos.z, SWIM_DRIP);
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
  if (P.mantle) { stepMantle(dt); return; }
  if (P.swimming) { updateSwimming(dt); return; }
  var mx = 0, mz = 0;
  if (GAME.key('KeyW')) mz += 1;
  if (GAME.key('KeyS')) mz -= 1;
  if (GAME.key('KeyA')) mx -= 1;
  if (GAME.key('KeyD')) mx += 1;
  if (T.active) { mx += T.stickX; mz += -T.stickY; }
  if (GAME.pad.on) { mx += GAME.pad.lx; mz += -GAME.pad.ly; }   // the left stick
  // money down at Gull Downs: you stand at the terminal and watch your race
  // (derby.js; the jump button skips ahead instead)
  var held = !!(GAME.derby && GAME.derby.holding);
  if (held) { mx = 0; mz = 0; }
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
    // (drunk, your feet have their own idea of the line)
    var dlv = drunkLevel();
    if (dlv > 0) moveH += (Math.sin(GAME.time * 1.6) * 0.5 + Math.sin(GAME.time * 0.61 + 1) * 0.3) * dlv;
    if (!aiming) P.heading = U.angleLerp(P.heading, moveH, Math.min(1, dt * 10));
    P.moveH = moveH;
  }
  if (aiming) {
    // locked on, the whole body squares up to the TARGET — the hand points
    // where the bullets will actually go, not wherever the camera drifted
    var lockT = GAME.combat.lockTarget;
    P.heading = lockT ? Math.atan2(lockT.pos.x - P.pos.x, lockT.pos.z - P.pos.z) : GAME.cam.yaw;
  } else if (P.shotT > 0) {
    // fired from the hip: the body turns to the shot while the legs keep
    // going where you are going
    P.heading = U.angleLerp(P.heading, P.shotYaw, Math.min(1, dt * 18));
  }
  var shotPose = P.shotT > 0;
  if (shotPose) P.shotT -= dt;

  var h = (mag > 0.05) ? P.moveH : P.heading;
  var nx = P.pos.x + Math.sin(h) * P.moveSpeed * dt * (mag > 0.05 ? 1 : 0);
  var nz = P.pos.z + Math.cos(h) * P.moveSpeed * dt * (mag > 0.05 ? 1 : 0);
  var rp = GAME.resolveCircle(nx, nz, 0.45, P.pos.y, footPush);
  nx = rp.x; nz = rp.z;
  // solid cars — from the side. Above the body you're standing or sailing
  // over it, and neither the push nor the run-over check applies up there.
  var cars = GAME.world.cars, pushed = false;
  //
  // Against the BODY, a box turned to the car's heading, the way a car meets
  // a pedestrian. This was a circle most of a car-length across: a metre of
  // nothing beside every door, half a metre of bonnet you could stand in, and
  // — once the run-over check below was actually live — getting out of your
  // own car at speed put you inside its circle, so it ran you over as it left.
  for (var i = 0; i < cars.length; i++) {
    var c = cars[i];
    if (P.pos.y - c.pos.y > carBodyTop(c) - 0.35) continue;
    if (c.pos.y - P.pos.y > 1.8) continue;   // and below one: a helicopter overhead
    var cfx = Math.sin(c.heading), cfz = Math.cos(c.heading);
    var dx = nx - c.pos.x, dz = nz - c.pos.z;
    var lng = dx * cfx + dz * cfz, lat = dx * cfz - dz * cfx;
    var hl = c.spec.l / 2 + 0.4, hw = c.spec.w / 2 + 0.4;
    if (Math.abs(lng) >= hl || Math.abs(lat) >= hw) continue;
    // out through the nearer face
    var ox, oz;
    if (hw - Math.abs(lat) < hl - Math.abs(lng)) {
      var sl = lat >= 0 ? 1 : -1;
      ox = cfz * sl; oz = -cfx * sl;
      nx += ox * (hw - Math.abs(lat)); nz += oz * (hw - Math.abs(lat));
    } else {
      var sf = lng >= 0 ? 1 : -1;
      ox = cfx * sf; oz = cfz * sf;
      nx += ox * (hl - Math.abs(lng)); nz += oz * (hl - Math.abs(lng));
    }
    pushed = true;
    // one hit per contact: gate by a short cooldown so a single bump can't
    // drain health across many frames of overlap
    if (Math.abs(c.speed) > 8 && P.carHurtCd <= 0) {
      GAME.playerDamage(Math.min(30, Math.abs(c.speed) * 0.9), 'car', c.pos.x, c.pos.z);
      P.carHurtCd = 0.8;
      var kb = 3.2;
      nx += ox * kb; nz += oz * kb;
    }
  }
  // A car's shove (and the knock-back off a hit) came after the walls had
  // been dealt with, and nothing put the walls back: pinned between a car and
  // a building you were pushed inside its footprint, and the height lookup
  // stood you on its roof — seventeen, fifty metres up. The wall gets the
  // last word; at worst you are squeezed against the car.
  if (pushed) {
    rp = GAME.resolveCircle(nx, nz, 0.45, P.pos.y, footPush);
    nx = rp.x; nz = rp.z;
  }
  // A walled roof keeps you on it: the parapet round the helipad was drawn
  // but not solid (a solid wall up there would fight a helicopter's skids),
  // so you walked straight through it and off the tower. It holds anybody
  // walking at roof level; a jump that clears it still clears it.
  var rails = GAME.city.roofRails;
  for (var rr = 0; rails && rr < rails.length; rr++) {
    var rl = rails[rr];
    if (P.pos.y < rl.y - 0.3 || P.pos.y > rl.y + rl.h) continue;
    if (P.pos.x < rl.minX || P.pos.x > rl.maxX || P.pos.z < rl.minZ || P.pos.z > rl.maxZ) continue;
    nx = U.clamp(nx, rl.minX, rl.maxX); nz = U.clamp(nz, rl.minZ, rl.maxZ);
  }
  P.pos.x = nx; P.pos.z = nz;
  // the closed channel's line stops walkers too — parachuting onto the
  // bridge deck past the barrier used to leave a free stroll to the island
  if (GAME.aircraft) GAME.aircraft.enforceAirspace(P.pos);
  // in the water, not still falling towards it: stepping out of a car in the
  // air over the sea, you drop the rest of the way first. Then you swim.
  if (P.pos.y < 0.5 && GAME.city.isInWater(P.pos.x, P.pos.z, P.pos.y)) { GAME.startSwim(); return; }
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
  var jumpDown = GAME.key('Space') || T.jump, wantJump = jumpDown && !held;
  if (grounded && wantJump && !P.jumpLatch && tryMantle(surf)) { P.jumpLatch = true; return; }
  if (grounded && wantJump && !P.jumpLatch) {
    P.velY = 7.2 + Math.min(P.moveSpeed, 6) * 0.22;
    P.pos.y = surf + 0.07;
    GAME.audio.punch();
  }
  // (a skip held as the race ends is not a jump the moment you are let go)
  P.jumpLatch = jumpDown;
  P.airborne = P.pos.y > surf + 0.06;
  if (P.airborne) {
    P.velY = (P.velY || 0) - 22 * dt;
    P.pos.y += P.velY * dt;
    if (P.pos.y <= surf) {
      var impact = -(P.velY || 0);
      P.pos.y = surf; P.velY = 0; P.airborne = false;
      // the sea breaks a fall that the street would not
      if (surf < 0.5 && GAME.city.isInWater(P.pos.x, P.pos.z, surf)) { GAME.startSwim(); return; }
      landOnFeet(impact);
    }
  } else {
    // A fall whose last airborne step stopped inside the 6 cm the on-your-feet
    // test allows lands HERE, and this used to zero the speed without the
    // impact: 56 m/s off a 72 m tower and not a scratch, one fall in fifteen.
    var landing = -(P.velY || 0);
    P.pos.y = surf; P.velY = 0;
    if (surf < 0.5 && GAME.city.isInWater(P.pos.x, P.pos.z, surf)) { GAME.startSwim(); return; }
    landOnFeet(landing);
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
  } else if ((aiming || shotPose) && P.currentWeapon !== 'fist') {
    j.torso.rotation.y = 0;
    // the arm follows the lock in elevation too — raised at a rooftop
    // target, dropped at someone below, level otherwise. A shot from the hip
    // brings it up the same way for a moment, with the kick of the round in
    // it; a gun that takes two hands brings the other one up under it.
    var armT = GAME.combat.lockTarget, armX;
    if (armT) {
      var adx = armT.pos.x - P.pos.x, adz = armT.pos.z - P.pos.z;
      var ad = Math.sqrt(adx * adx + adz * adz) || 1;
      var aimUp = Math.atan2((armT.pos.y + 1.1) - (P.pos.y + 1.35), ad);
      armX = -Math.PI / 2 - U.clamp(aimUp, -0.7, 0.7);
    } else {
      armX = -Math.PI / 2 + GAME.cam.pitch * 0.5;
    }
    var kick = shotPose ? U.clamp((P.shotT - (SHOT_POSE - 0.14)) / 0.12, 0, 1) : 0;
    j.armR.rotation.x = armX - kick * 0.22;
    if (TWO_HANDED[P.currentWeapon]) {
      j.armL.rotation.x = armX + 0.12 - kick * 0.15;
      j.armL.rotation.z = -0.32;
    } else {
      j.armL.rotation.x = -s * 0.4;
      j.armL.rotation.z = 0;
    }
  } else {
    j.torso.rotation.y = 0;
    j.armL.rotation.x = -s * 0.8;
    j.armR.rotation.x = s * 0.8;
    j.armL.rotation.z = 0;
  }

  if (wantsEnter()) {
    var car = nearestEnterableCar();
    if (car) GAME.enterCar(car);
  }
  GAME.audio.engineState(false, 0);
}

// G (or the horn button): a stolen cruiser's lights and siren go on and off;
// anything else has a horn. Neither existed — a cruiser was a white car with
// a dead lightbar, and nobody could honk at anybody. The ice cream truck's
// horn is its chimes, as the van's was in Vice City: on a round, the jingle
// is what brings people to the hatch (missions.js).
var hornSounding = false;
function playerHorn(on, low) {
  if (on === hornSounding) return;
  hornSounding = on;
  if (GAME.audio.hornHold) GAME.audio.hornHold(on, low);
}
function hornAndSiren(car, dt, T) {
  var press = GAME.keyPressed('KeyG') || T.horn;
  T.horn = false;
  // a cruiser, or a harbour launch: the switch is the lights and siren
  if (car.isPolice) {
    if (press) {
      car.sirenOn = !car.sirenOn;
      GAME.hud.message(car.sirenOn ? 'Lights and siren on — traffic will pull over.' : 'Lights and siren off.', 1.8);
    }
  } else if (car.type === 'icecream') {
    // one jingle at a time: it runs a little over a second
    if (press && (car.honkCd || 0) <= 0) {
      car.honkCd = 1.25;
      GAME.audio.chime();
      if (GAME.missions.chimed) GAME.missions.chimed(car);
    }
  } else {
    // A horn sounds for as long as it is held, and a tap still gives a
    // proper beep. It was a blip that died away under the engine.
    if (press) car.hornMin = 0.25;
    var want = GAME.key('KeyG') || !!T.hornHeld || (car.hornMin || 0) > 0;
    if (car.hornMin > 0) car.hornMin -= dt;
    playerHorn(want, car.spec.l > 5);
  }
  if (car.honkCd > 0) car.honkCd -= dt;
  // the bar: flashing with the siren on, dark with it off (police.js leaves
  // the player's cruiser to this)
  var bars = car.mesh.userData.lightbar;
  if (bars) {
    var ph = (GAME.time * 7 | 0) % 2;
    bars[0].visible = car.sirenOn && ph === 0;
    bars[1].visible = car.sirenOn && ph === 1;
  }
}
// the player's own cruiser with its siren going, if they are in one
GAME.playerSiren = function () {
  var P = GAME.player;
  return P.inCar && P.car && P.car.isPolice && P.car.sirenOn && !P.car.dead ? P.car : null;
};

function updateDriving(dt) {
  var P = GAME.player, inp = GAME.input, T = inp.touch;
  var car = P.car;
  if (!car || car.dead) {
    if (car && car.dead) forceExitCar();
    return;
  }
  // Gone into the sea: nothing at the wheel answers any more. vehicles.js
  // takes the hull down, and the driver swims out of it (GAME.swimOutOf).
  if (car.sinking) {
    GAME.audio.engineState(false, 0);
    GAME.audio.skid(0);
    if (P.onBike) updateBikeRider(dt);
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
    if (GAME.keyPressed('Comma')) GAME.switchRadio(-1);
    if (GAME.keyPressed('Period')) GAME.switchRadio(1);
    return;
  }
  // ground vehicles answer to the closed channel's line too (a truck that
  // hopped the barrier onto the bridge deck is not a loophole); a boat keeps
  // to the sea's own edges (vehicles.js, stepBoat)
  if (GAME.aircraft && !car.spec.boat) GAME.aircraft.enforceAirspace(car.pos);
  hornAndSiren(car, dt, T);
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
    if (GAME.pad.on) { th += GAME.pad.rt - GAME.pad.lt; st -= GAME.pad.lx; }   // triggers and stick
    c.throttle = U.clamp(th, -1, 1);
    c.steer = U.clamp(st, -1, 1);
    // and the wheel pulls, under way, with a few drinks in you
    var dlc = drunkLevel();
    if (dlc > 0 && Math.abs(car.speed) > 2) c.steer = U.clamp(c.steer + (Math.sin(GAME.time * 0.8) * 0.3 + Math.sin(GAME.time * 2.1) * 0.12) * dlc, -1, 1);
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
  else if (car.spec.boat) updateHelm(car);

  // radio switching
  if (GAME.keyPressed('Comma')) GAME.switchRadio(-1);
  if (GAME.keyPressed('Period')) GAME.switchRadio(1);
}

// standing at a boat's wheel, behind the screen, moving with the hull
var _helm = null;
function updateHelm(car) {
  var P = GAME.player, m = P.mesh;
  if (!_helm) _helm = new THREE.Vector3();
  // at a boat's console, or astride a jet ski's saddle (vehicles.js poseHelm)
  var ski = !!car.spec.jetski;
  var seat = ski ? HELM_SEAT.jetski : HELM_SEAT.boat;
  _helm.set(0, seat.y, seat.z).applyEuler(car.mesh.rotation).add(car.pos);
  m.visible = true;
  m.position.copy(_helm);
  m.rotation.set(car.mesh.rotation.x, car.heading, car.mesh.rotation.z);
  poseHelm(m.userData.joints, ski);
}

// what coming down at `impact` m/s does to you
// A fall hurts in proportion to how hard you land, and a long one kills.
// It was capped at 95 — so from full health no height was fatal, and with a
// vest on (which soaked up most of it) seventy metres off the helipad tower
// cost a few points. Three metres is nothing, ten hurts badly, and from
// about nineteen nobody gets up.
function landOnFeet(impact) {
  if (impact <= 12) return;
  GAME.playerDamage((impact - 12) * 6, 'fall');
  GAME.cameraShake = Math.min(1, impact / 18);
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
var CAM_STANDOFF = 0.35;   // how far the camera keeps off a wall it is pulled in by
var BRIDGE_GIRDER = 1.6;   // the box girder under a bridge deck (isla.js buildSpans)
var camBoxes = [];   // the boxes between the camera and the player, refilled each frame
function updateCamera(dt) {
  var P = GAME.player, inp = GAME.input, cam = GAME.cam;
  var mdx = inp.mouseDX, mdy = inp.mouseDY;
  inp.mouseDX = 0; inp.mouseDY = 0;
  if (inp.touch.camDX) { mdx += inp.touch.camDX; mdy += inp.touch.camDY; inp.touch.camDX = 0; inp.touch.camDY = 0; }
  // the look settings (controls.js): how fast, and which way is up
  var Cs = GAME.controls;
  if (Cs) { mdx *= Cs.sens; mdy *= Cs.sens * (Cs.invertY ? -1 : 1); }

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
      // Behind the car whichever way it is rolling. It used to swing round to
      // face backwards above 2 m/s in reverse — so the steering read as
      // mirrored the moment it did (A pulled the car to the right of the
      // screen), and every three-point turn whipped the view round twice.
      cam.yaw = U.angleLerp(cam.yaw, P.car.heading, Math.min(1, dt * 3.4));
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
    // over-the-shoulder offset — as far as the wall beside you allows: with a
    // shoulder to a building the offset point was INSIDE it, and so was the
    // camera hung off it
    var shx = Math.sin(cam.yaw + Math.PI / 2) * 0.75, shz = Math.cos(cam.yaw + Math.PI / 2) * 0.75;
    var shT = 1;
    var shBoxes = GAME.city.hash.queryInto(fx + shx / 2, fz + shz / 2, 2, camBoxes);
    for (var si = 0; si < shBoxes.length; si++) {
      var sb = shBoxes[si];
      if (sb.noLOS || (sb.h !== undefined && sb.h < fy - 0.2) || (sb.minY !== undefined && sb.minY > fy + 0.5)) continue;
      var st = rayAABB(fx, fz, shx, shz, sb);
      if (st < shT) shT = Math.max(0, st - 0.3 / 0.75);
    }
    fx += shx * shT;
    fz += shz * shT;
  }
  var cy = fy + Math.sin(cam.pitch) * cam.dist + (P.inCar ? 0.6 : 0);
  var horiz = Math.cos(cam.pitch) * cam.dist;
  var cx = fx - Math.sin(cam.yaw) * horiz;
  var cz = fz - Math.cos(cam.yaw) * horiz;

  // Pull the camera in when a building blocks the view — and when there is
  // too little room behind to sit there at all, rise and look over the head
  // instead. The pull-in used to stop at 12% of the distance however close
  // the wall was: back to a building, the camera sat 0.7 m behind the head,
  // inside the wall, with the head filling the screen.
  var boxes = GAME.city.hash.queryInto((fx + cx) / 2, (fz + cz) / 2, cam.dist + 2, camBoxes);
  var dirX = cx - fx, dirZ = cz - fz;
  var hlen = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1;
  // looked along to a little past the camera, so it stands that much off a wall
  var reach = (hlen + CAM_STANDOFF) / hlen, clear = 1;
  for (var i = 0; i < boxes.length; i++) {
    var b = boxes[i];
    if (b.noLOS) continue;
    if (b.minY !== undefined && b.minY > cy + 0.5) continue;   // a deck overhead
    var t = rayAABB(fx, fz, dirX * reach, dirZ * reach, b);
    if (t >= clear) continue;
    // A block is in the way only if the line from you to the camera passes
    // through it, not over it. Asked as "is it lower than the camera", a
    // mid-height block between a car and a camera looking steeply down was
    // let through — it filled the screen and hid the car behind it.
    if (b.h !== undefined && b.h < fy + (cy - fy) * Math.min(1, t) - 0.3) continue;
    clear = t;
  }
  // room behind, in metres
  var room = Math.min(hlen, Math.max(0, clear * (hlen + CAM_STANDOFF) - CAM_STANDOFF));
  var bestT = Math.min(1, room / hlen);
  var tight = U.clamp(1 - room / 1.8, 0, 1);   // 0: room enough, 1: against the wall
  cx = fx + dirX * bestT; cz = fz + dirZ * bestT;
  cy = fy + (cy - fy) * (0.4 + 0.6 * bestT) + tight * 1.9;

  // Under a bridge, stay under it. Nothing above kept the camera off a deck
  // overhead (they are not walls), so a high look from a boat in the channel
  // went up through the girder and the roadway and looked down at it from
  // on top — a black screen for the length of the span. Wherever along the
  // line back to the camera a deck passes over you, the line is lowered to
  // run under its girder.
  if (GAME.city.crossings.length) {
    for (var k = 1; k <= 4; k++) {
      var tk = k / 4, dk = GAME.city.crossingY(fx + (cx - fx) * tk, fz + (cz - fz) * tk);
      // (a deck at your own level is the one you are driving on)
      if (dk === null || dk - BRIDGE_GIRDER <= fy) continue;
      cy = Math.min(cy, fy + (dk - BRIDGE_GIRDER - 0.4 - fy) / tk);
    }
  }

  if (GAME.cameraShake > 0.01) {
    // A rise means a fresh knock rather than the tail of the last one. The
    // shake is the game's existing "this happened to YOU" signal — every
    // caller already filtered for the player's own car, own fall, own
    // airframe — so one read here covers all of them without a hook at each.
    if (GAME.cameraShake > shakePrev + 0.05) GAME.haptics.knock(GAME.cameraShake - shakePrev);
    GAME.cameraShake *= Math.exp(-5 * dt);
    // SHAKE: OFF in the pause menu keeps the picture still; the knock above
    // still reaches the rumble, which is its own switch
    if (!(GAME.prefs && GAME.prefs.noShake)) {
      cx += (Math.random() - 0.5) * GAME.cameraShake * 0.6;
      cy += (Math.random() - 0.5) * GAME.cameraShake * 0.5;
      cz += (Math.random() - 0.5) * GAME.cameraShake * 0.6;
    }
  }
  shakePrev = GAME.cameraShake;

  cam.x = U.damp(cam.x || cx, cx, 20, dt);
  cam.y = U.damp(cam.y || cy, cy, 20, dt);
  cam.z = U.damp(cam.z || cz, cz, 20, dt);
  // indoors, under the ceiling rather than up through it
  var ceil = GAME.interiors && GAME.interiors.ceiling(cam.x, cam.z);
  if (ceil !== null && ceil !== undefined && cam.y > ceil) cam.y = ceil;
  // ...and under a bridge, under its girder however the camera was easing in
  // (the line above is lowered at once; the camera follows it a beat behind)
  var deckC = GAME.city.crossings.length ? GAME.city.crossingY(cam.x, cam.z) : null;
  if (deckC !== null && deckC - BRIDGE_GIRDER > fy) cam.y = Math.min(cam.y, deckC - BRIDGE_GIRDER - 0.4);
  // ...and upstairs, above the floor you are standing on, not under it
  var cfl = GAME.interiors && GAME.interiors.camFloor && GAME.interiors.camFloor(cam.x, cam.z);
  if (cfl !== null && cfl !== undefined && cam.y < cfl) cam.y = cfl;
  // (never below the drawn ground either: the beach slopes down to the
  // waterline underneath, but its sand is drawn level, and a camera held off
  // the slope sat under it — swimming off the beach you could not see yourself.
  // The ground where the camera is: asked with no height, a bridge deck
  // overhead IS the ground, and the camera was lifted out from under the span
  // onto the roadway. A deck counts only once the camera is up level with it
  // — the height lookup's own allowance is a car's, for driving up onto one.)
  GAME.cameraObj.position.set(cam.x, Math.max(cam.y, Math.max(0.2, GAME.city.groundY(cam.x, cam.z, cam.y - 2.4)) + 0.5), cam.z);
  var lookY = fy + (aiming ? Math.tan(-cam.pitch + 0.2) * 10 * 0 : 0);
  // risen over a wall at your back, look out ahead of you, not down at the crown
  var lookAhead = (aiming ? 4 : 0) + tight * 3;
  GAME.cameraObj.lookAt(fx + Math.sin(cam.yaw) * lookAhead, lookY, fz + Math.cos(cam.yaw) * lookAhead);
  // one too many: the picture leans and drifts (not with SHAKE: OFF — the
  // colours still run, but nothing moves that you did not move)
  var dl = drunkLevel();
  if (dl > 0 && !(GAME.prefs && GAME.prefs.noShake)) {
    var tt = GAME.time;
    GAME.cameraObj.rotateZ((Math.sin(tt * 0.9) * 0.07 + Math.sin(tt * 2.3) * 0.015) * dl);
    GAME.cameraObj.rotateY(Math.sin(tt * 0.47) * 0.04 * dl);
  }
}
