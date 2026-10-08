(function () {
  var renderer, accumulator = 0, lastT = 0;
  GAME.frame = 0;

  function boot() {
    // a save being brought in on a phone: its own light page, no city (below)
    if (/^#import/.test(location.hash)) { importScreen(); return; }
    var canvas = document.getElementById('game-canvas');
    GAME.touch.init();

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !GAME.isTouch, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, GAME.settings.pixelRatioCap));
    renderer.setSize(window.innerWidth, window.innerHeight);
    GAME.renderer = renderer;

    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x2a1440, 110, GAME.isTouch ? 320 : 430);
    GAME.scene = scene;

    // the near plane here is only a placeholder: the render loop drives it
    // every frame before drawing — 0.1 down among things, 2.0 at altitude
    // where depth precision matters more than closeness (see render())
    var camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.35, 3000);
    camera.position.set(340, 6, 30);
    GAME.cameraObj = camera;

    var hemi = new THREE.HemisphereLight(0x4a3a7a, 0x1a1024, 0.85);
    scene.add(hemi);
    var moon = new THREE.DirectionalLight(0x8a94ff, 0.55);
    moon.position.set(500, 400, -150);
    scene.add(moon);
    var warm = new THREE.AmbientLight(0x40203a, 0.7);
    scene.add(warm);
    // headlights: one spot that follows whatever the player is driving, lit
    // only after dark. A single light keeps this cheap on mobile.
    var head = new THREE.SpotLight(0xfff0c8, 0, 95, 0.70, 0.42, 1.0);
    head.position.set(0, 1.2, 0);
    head.target.position.set(0, 0, 1);
    scene.add(head);
    scene.add(head.target);
    GAME.lights = { hemi: hemi, dir: moon, ambient: warm, head: head };

    GAME.city.build(scene);
    GAME.weather.build(scene);
    GAME.fx.init(scene);
    GAME.initPlayer();
    GAME.combat.initPickups();
    GAME.missions.init();
    GAME.tapes.init(scene);
    GAME.stunts.load();
    GAME.hud.init();
    GAME.controls.init();
    GAME.photo.init();
    GAME.herald.init();
    GAME.share.init();
    GAME.shops.init(scene);
    GAME.interiors.build();
    GAME.initInput(canvas);
    GAME.combat.refreshWeaponHud();
    GAME.hud.wantedChanged(0);

    // One draw of everything, unculled, before the first real frame: the
    // whole world goes up to the GPU now, and its arrays go with it (see
    // releaseStatic), rather than each piece the first time it comes into
    // view — which was also a stall mid-game, the first time you turned
    // toward something new.
    var culled = [];
    scene.traverse(function (o) { if (o.frustumCulled) { culled.push(o); o.frustumCulled = false; } });
    renderer.render(scene, camera);
    for (var ci = 0; ci < culled.length; ci++) culled[ci].frustumCulled = true;
    // only now can a press do anything: the title stops saying LOADING
    GAME.hud.titleReady();

    window.addEventListener('resize', function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    GAME.onKeyDown = function (code) {
      if (code === 'Enter' && !GAME.started) { GAME.startGame(); return; }
      if (!GAME.started) return;
      // an open dialog owns the keys — Esc must cancel it, not unpause
      if (GAME.hud.dialogOpen()) { GAME.hud.dialogKey(code); return; }
      // and so does Lola, while you are talking to her
      if (GAME.lolaOpen) { GAME.lola.key(code); return; }
      // and a scene, all but the sound and the screen's own switches
      if (GAME.sceneOpen && (GAME.scenes.key(code) || (code !== 'KeyM' && code !== 'KeyT'))) return;
      // and so does the photo album, over the pause screen
      if (GAME.photo.key(code)) return;
      // and an open shop its list and its confirmation card (Esc below)
      if (GAME.shopOpen && GAME.shops.key(code)) return;
      // the full map: A (or Enter) sets the route at a pad's cursor
      if (GAME.mapOpen && code === 'Enter' && GAME.hud.mapPick()) return;
      // and the arrows step its legend's solo (one kind of marker at a time)
      if (GAME.mapOpen && (code === 'ArrowLeft' || code === 'ArrowRight')) { GAME.hud.mapSoloStep(code === 'ArrowRight' ? 1 : -1); return; }
      // the result card closes on any of the keys a hand is likely to be on —
      // it never needed the mouse
      if (GAME.shareOpen && (code === 'Escape' || code === 'Enter' || code === 'Space')) {
        GAME.share.hide();
        return;
      }
      // the pause screen's buttons answer the arrows, Enter and Space
      if (GAME.paused && !GAME.mapOpen && !GAME.shopOpen && GAME.hud.pauseKey(code)) return;
      if (code === 'Escape') {
        if (GAME.shopOpen) GAME.shops.close();
        else if (GAME.mapOpen) GAME.hud.toggleMap(false);
        else GAME.togglePause();
      }
      if (code === 'KeyP') GAME.hud.toggleMap();
      if (code === 'KeyL' && !GAME.paused && !GAME.mapOpen && !GAME.shopOpen && !GAME.shareOpen) GAME.lola.open();
      if (code === 'KeyC' && GAME.mapOpen) GAME.hud.mapClear();
      if ((code === 'Equal' || code === 'NumpadAdd') && GAME.mapOpen) GAME.hud.mapZoom(1.5);
      if ((code === 'Minus' || code === 'NumpadSubtract') && GAME.mapOpen) GAME.hud.mapZoom(1 / 1.5);
      if (code === 'KeyH') GAME.hud.toggleControlsBar();
      if (code === 'KeyM') {
        var m = GAME.hud.toggleMute();
        GAME.hud.message(m ? 'Muted' : 'Sound on', 1.2);
      }
      if (code === 'KeyT') GAME.hud.toggleCRT();
      if (code === 'KeyN') GAME.setDaytime();
    };

    // start on a bright late afternoon (the cycle then rolls toward sunset/night)
    GAME.applyTimeOfDay(0.5 - 0.5 * Math.cos(GAME.dayPhase * Math.PI * 2));

    // The title's soothing pads can only begin on a user gesture — the
    // browser's rule, not ours. The first press or tap on the title starts
    // them; if that same gesture starts the game, they bow out to the radio.
    function titleGesture() {
      if (GAME.started) return;
      GAME.audio.init();
      GAME.audio.titleMusic(true);
    }
    window.addEventListener('pointerdown', titleGesture);
    window.addEventListener('keydown', titleGesture);

    lastT = performance.now();
    requestAnimationFrame(loop);
  }

  // iPhone Safari has no fullscreen for pages at all (iPad only the webkit
  // one), so the corner button did nothing there. It says what does work —
  // Add to Home Screen, which index.html declares a full-screen app — and
  // goes away once the game is running that way.
  var docEl = document.documentElement;
  var reqFs = docEl.requestFullscreen || docEl.webkitRequestFullscreen;
  GAME.canFullscreen = !!reqFs;
  GAME.isStandalone = function () {
    return !!(navigator.standalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches));
  };
  GAME.fullscreenEl = function () { return document.fullscreenElement || document.webkitFullscreenElement || null; };
  // `asked` is the corner button, where a refusal should say so: the start
  // tap and the resume tap try quietly, but a button that does nothing at all
  // reads as a broken game, when it is the browser saying no.
  GAME.enterFullscreen = function (asked) {
    function refused(why) {
      if (asked && GAME.hud) GAME.hud.message('The browser would not go full screen' + (why ? ' (' + why + ')' : '') +
        '. Close this tab and open the game in a fresh one — that clears it.', 7);
    }
    try {
      var std = docEl.requestFullscreen, req = std || docEl.webkitRequestFullscreen;
      if (GAME.fullscreenEl() || !req) return;
      if (document.fullscreenEnabled === false && document.webkitFullscreenEnabled !== true) { refused('not allowed on this page'); return; }
      // navigationUI 'hide' asks Android to fold the system bars away too
      // (the old webkit call takes a flags number, not options)
      var pr = std ? std.call(docEl, { navigationUI: 'hide' }) : req.call(docEl);
      if (pr && pr.then) pr
        .then(function () {
          try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(function () { }); } catch (e) { }
          // hold the keyboard lock on Esc while fullscreen: the press is then
          // DELIVERED to the game (it pauses) instead of tearing fullscreen
          // down. Holding Esc still force-exits — the browser's escape hatch.
          try { navigator.keyboard && navigator.keyboard.lock && navigator.keyboard.lock(['Escape']).catch(function () { }); } catch (e) { }
        })
        .catch(function (e) { refused(e && e.name); });
    } catch (e) { refused(e && e.name); }
  };
  // Esc on the pause screen also throws the browser out of fullscreen — its
  // rule, not ours, and the Esc keydown carries no user activation so we
  // cannot put it back right then. Remember that the exit was not asked for,
  // and re-enter on the next real gesture (a click back into the game).
  var fsRestore = false, fsManual = false;
  GAME.toggleFullscreen = function () {
    if (!GAME.canFullscreen) {
      GAME.hud.message('This browser has no full screen for web pages — Share ▸ Add to Home Screen plays it full screen.', 6);
      return;
    }
    if (GAME.fullscreenEl()) {
      fsManual = true;
      var ex = document.exitFullscreen || document.webkitExitFullscreen;
      var pr = ex && ex.call(document);
      if (pr && pr.catch) pr.catch(function () { });
    } else { fsRestore = false; GAME.enterFullscreen(true); }
  };
  function onFsChange() {
    if (GAME.fullscreenEl()) { fsRestore = false; return; }
    try { navigator.keyboard && navigator.keyboard.unlock && navigator.keyboard.unlock(); } catch (e) { }
    if (fsManual) { fsManual = false; return; }
    if (GAME.started) fsRestore = true;
  }
  document.addEventListener('fullscreenchange', onFsChange);
  document.addEventListener('webkitfullscreenchange', onFsChange);
  GAME.maybeRestoreFullscreen = function () {
    if (fsRestore && !GAME.fullscreenEl()) GAME.enterFullscreen();
  };
  // Full screen at the next click, key or tap, for a request made where the
  // browser would refuse it: a controller's press, which not every browser
  // counts as a gesture (hud.js, the pause screen's FULL SCREEN)
  GAME.fullscreenOnNextGesture = function (on) { fsRestore = on !== false; };

  // ---------- bringing a save in, on a page of its own ----------
  // A phone's file picker sends the browser to the background, and a tab
  // holding the whole city on the GPU is the first thing Android reclaims
  // when it is short of memory: importing from inside the game could come
  // back to a crashed tab (and Chrome, after a crash mid-fullscreen, can
  // refuse full screen to that tab until it is closed). So on a touch
  // device IMPORT SAVE reloads as index.html#import, which builds nothing
  // but this card; the game loads fresh behind it once the save is in.
  function importScreen() {
    var title = document.getElementById('title-screen');
    if (title) title.style.display = 'none';
    var wrap = document.createElement('div');
    wrap.id = 'import-screen';
    wrap.innerHTML = '<div id="import-card"><div id="import-title">IMPORT SAVE</div>' +
      '<div id="import-body">Pick the save you exported (neon-mayhem-save.json). It replaces the progress on this device.</div>' +
      '<button id="import-pick" class="ibtn danger">CHOOSE SAVE FILE</button>' +
      '<div id="import-msg"></div>' +
      '<button id="import-back" class="ibtn">BACK TO THE GAME</button></div>';
    document.body.appendChild(wrap);
    var input = document.getElementById('save-file'), msg = document.getElementById('import-msg');
    function toGame() { location.replace(location.pathname + location.search); }
    document.getElementById('import-pick').addEventListener('click', function () { msg.textContent = ''; input.click(); });
    document.getElementById('import-back').addEventListener('click', toGame);
    input.addEventListener('change', function () {
      var f = this.files && this.files[0];
      this.value = '';
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        var r = GAME.importSave(String(rd.result));
        if (!r.ok) { msg.textContent = r.why; msg.className = 'bad'; return; }
        GAME.track('save-imported');
        msg.textContent = 'Imported. Loading your game…'; msg.className = 'good';
        setTimeout(toGame, 600);
      };
      rd.onerror = function () { msg.textContent = 'Could not read that file.'; msg.className = 'bad'; };
      rd.readAsText(f);
    });
  }

  // night (df 0) and day (df 1) endpoint palettes; intermediate df gives dusk
  var TOD_NIGHT = { fog: 0x2a1440, near: 110, hemi: 0x4a3a7a, ground: 0x1a1024, hemiI: 0.85, dir: 0x8a94ff, dirI: 0.55, amb: 0x40203a, ambI: 0.7, clear: 0x0a0714 };
  var TOD_DAY = { fog: 0xbcd0e8, near: 150, hemi: 0xcfe0ff, ground: 0x9a8a70, hemiI: 1.05, dir: 0xfff2d0, dirI: 1.0, amb: 0x6a6674, ambI: 0.5, clear: 0x9fbce0 };
  var _cN = new THREE.Color(), _cD = new THREE.Color(), _cT = new THREE.Color(), _cR = new THREE.Color();
  var RAIN_NIGHT = 0x231c2e, RAIN_DAY = 0x7c8394;   // what the fog turns to under rain
  function lerpHex(a, b, t, target) { _cN.setHex(a); _cD.setHex(b); target.copy(_cN).lerp(_cD, t); return target; }

  GAME.timeOfDay = 0.4;
  GAME.applyTimeOfDay = function (df) {
    GAME.timeOfDay = df;
    GAME.city.applyTimeOfDay(df);
    var scene = GAME.scene, L = GAME.lights, farBase = GAME.isTouch ? 320 : 430;
    // rain greys and closes in the fog and dims the light; lightning lifts it
    var wet = GAME.weather ? GAME.weather.rain : 0, bolt = GAME.weather ? GAME.weather.flash : 0;
    lerpHex(TOD_NIGHT.fog, TOD_DAY.fog, df, scene.fog.color);
    if (wet > 0) scene.fog.color.lerp(lerpHex(RAIN_NIGHT, RAIN_DAY, df, _cR), wet * 0.7);
    scene.fog.near = U.lerp(TOD_NIGHT.near, TOD_DAY.near, df) * (1 - 0.55 * wet);
    scene.fog.far = (farBase + df * 90) * QUALITY[GAME.quality].fog * (1 - 0.4 * wet);   // GFX draws it in
    lerpHex(TOD_NIGHT.hemi, TOD_DAY.hemi, df, L.hemi.color);
    lerpHex(TOD_NIGHT.ground, TOD_DAY.ground, df, L.hemi.groundColor);
    L.hemi.intensity = U.lerp(TOD_NIGHT.hemiI, TOD_DAY.hemiI, df);
    lerpHex(TOD_NIGHT.dir, TOD_DAY.dir, df, L.dir.color);
    L.dir.intensity = U.lerp(TOD_NIGHT.dirI, TOD_DAY.dirI, df);
    lerpHex(TOD_NIGHT.amb, TOD_DAY.amb, df, L.ambient.color);
    L.ambient.intensity = U.lerp(TOD_NIGHT.ambI, TOD_DAY.ambI, df);
    if (wet > 0 || bolt > 0) {
      L.hemi.intensity = L.hemi.intensity * (1 - 0.3 * wet) + bolt * 1.4;
      L.dir.intensity *= 1 - 0.55 * wet;
    }
    // indoors (interiors.js): the room's own light whatever the hour, and no
    // fog across a room — the people in it were lit by the night outside
    if (GAME.player && GAME.player.interior) {
      L.hemi.color.setHex(0xfff0e0); L.hemi.groundColor.setHex(0x40303a);
      L.hemi.intensity = 0.95; L.dir.intensity = 0.3; L.ambient.intensity = 0.6;
      scene.fog.near = 400; scene.fog.far = 900;
    }
    lerpHex(TOD_NIGHT.clear, TOD_DAY.clear, df, _cT);
    if (wet > 0) _cT.lerp(scene.fog.color, wet * 0.8);
    if (bolt > 0) _cT.lerp(_cR.setHex(0xdfe6ff), bolt * 0.5);
    renderer.setClearColor(_cT, 1);
  };

  // auto day/night cycle. Start on a bright, low-sun late afternoon that visibly
  // slides into sunset, then night, then the sun rises again and it loops.
  // df = 0.5 - 0.5*cos(2*pi*phase).
  // phase 0.63 -> df~0.85 sunny afternoon; 0.75 -> sunset; 1.0 -> night.
  // Twelve real minutes a day. It was two and a half, so night lasted under a
  // minute and the clock was something that happened to the sky rather than
  // to the evening you were having.
  var CYCLE = 720, START_PHASE = 0.63;
  // one full in-game day in real seconds — pickups' respawn clock keys off it
  GAME.DAY_SECONDS = CYCLE;
  GAME.dayPhase = START_PHASE;
  // 'auto' runs the cycle; 'day' / 'night' pin the clock where you want it
  GAME.timeMode = 'auto';
  var TIME_MODES = ['auto', 'day', 'night'];
  GAME.setTimeMode = function (mode) {
    if (TIME_MODES.indexOf(mode) < 0) mode = 'auto';
    GAME.timeMode = mode;
    if (mode === 'day') { GAME.dayPhase = 0.5; GAME.applyTimeOfDay(1); }
    else if (mode === 'night') { GAME.dayPhase = 0.0; GAME.applyTimeOfDay(0); }
    if (GAME.prefs) { GAME.prefs.timeMode = mode; GAME.save(); }
    return mode;
  };
  GAME.cycleTimeMode = function () {
    var i = TIME_MODES.indexOf(GAME.timeMode);
    return GAME.setTimeMode(TIME_MODES[(i + 1) % TIME_MODES.length]);
  };
  // kept for the scripted test API
  GAME.setDaytime = function (force) {
    var day = force !== undefined ? !!force : GAME.timeOfDay < 0.5;
    GAME.setTimeMode(day ? 'day' : 'night');
    return day;
  };
  GAME.advanceDayCycle = function (dt) {
    if (GAME.timeMode !== 'auto') return; // clock is pinned
    GAME.dayPhase = (GAME.dayPhase + dt / CYCLE) % 1;
    GAME.applyTimeOfDay(0.5 - 0.5 * Math.cos(GAME.dayPhase * Math.PI * 2));
  };

  GAME.startGame = function () {
    if (GAME.started) return;
    GAME.started = true;
    GAME.analytics.start();
    GAME.track(GAME.isTouch ? 'started-touch' : 'started-desktop');
    GAME.audio.init();
    GAME.audio.titleMusic(false);
    // leave attract mode: place the player on the strip, camera snaps behind
    var P = GAME.player;
    P.pos.set(356, 0.18, 40);
    P.heading = Math.PI;
    // a save with a bed in it starts at that bed, not on the strip
    var home = GAME.shops && GAME.shops.startSpawn();
    if (home) {
      P.pos.set(home.x, GAME.city.groundY(home.x, home.z), home.z);
      P.heading = home.heading;   // toward town, camera out over the pavement (shops.js)
    }
    P.mesh.visible = true;
    GAME.cam.yaw = P.heading; GAME.cam.pitch = 0.32;
    GAME.cam.x = GAME.cam.y = GAME.cam.z = null;
    GAME.enterFullscreen(); // same user gesture — desktop and touch alike
    // the gesture that started the game is not gameplay input — and neither
    // is anything the browser synthesizes right behind it (ghost clicks on
    // touch): open the same settle window the pointer lock uses
    GAME.input.keys = {};
    GAME.input.pressed = {};
    GAME.input.lmb = false; GAME.input.lmbPressed = false; GAME.input.rmb = false;
    GAME.input.lockGraceT = performance.now();
    // start sunny (~late afternoon); sunset ~18s in, night ~55s. A pinned
    // clock keeps its hour — resetting the phase under a pin left the HUD
    // clock saying 15:00 over a midnight-frozen sky
    if (GAME.timeMode === 'auto') GAME.dayPhase = 0.63;
    GAME.hud.hideTitle();
    // the click (or Enter) that started the game is a gesture the lock can
    // ride on: without this the mouse did nothing until an unexplained second
    // click into the canvas
    GAME.regainPointer();
    GAME.hud.message(home ? 'Back at ' + home.name + '.' : 'Welcome to Costa Rosa. Steal a ride and see the strip.', 4);
  };

  // attract mode: the live city plays behind the title with spectator cuts
  var ATTRACT_CUTS = [
    { pos: [330, 10, -80], look: [351, 1, -10], drift: [0.3, 0.05, 2.0] },
    { pos: [400, 8, 205], look: [490, 14, 150], drift: [-0.8, 0.1, -1.2] },
    { pos: [-30, 46, -30], look: [-100, 52, -100], drift: [1.6, 0.3, 1.6] },
    { pos: [55, 12, -165], look: [50, 2, -95], drift: [-1.5, 0.1, 0.5] },
    { pos: [393, 7, 35], look: [364, 2, 110], drift: [0.2, 0.05, 2.2] }
  ];
  var attractIdx = -1, attractT = 1e9;
  function tickAttractCam(dt) {
    attractT += dt;
    if (attractT > 13) {
      attractT = 0;
      attractIdx = (attractIdx + 1) % ATTRACT_CUTS.length;
      var nc = ATTRACT_CUTS[attractIdx];
      // the hidden player anchors the traffic/ped spawn bubble at the shot
      GAME.player.pos.set(nc.look[0], 0, nc.look[2]);
    }
    var c = ATTRACT_CUTS[attractIdx];
    GAME.cameraObj.position.set(c.pos[0] + c.drift[0] * attractT, c.pos[1] + c.drift[1] * attractT, c.pos[2] + c.drift[2] * attractT);
    GAME.cameraObj.lookAt(c.look[0], c.look[1], c.look[2]);
  }
  GAME.tickAttract = function (dt) {
    GAME.time += dt;
    GAME.frame++;
    GAME.city.update(dt, GAME.time);
    GAME.vehicles.update(dt);
    GAME.peds.update(dt);
    GAME.fx.update(dt);
    tickAttractCam(dt);
  };

  // On desktop the mouse is pointer-locked while playing, and the browser
  // swallows the Esc keydown that releases the lock — so the first Esc did
  // nothing you could see and only the second reached the game. The lock
  // going away IS the Esc press: treat it as one.
  document.addEventListener('pointerlockchange', function () {
    if (document.pointerLockElement) return;
    // an unlock within a beat of the game releasing the lock itself (an
    // overlay opening) is not the user's Esc — grants and exits resolve
    // asynchronously, so our own release can arrive a tick displaced
    if (GAME.releasePointerT && performance.now() - GAME.releasePointerT < 1500) return;
    if (GAME.started && !GAME.paused && !GAME.mapOpen && !GAME.shareOpen && !GAME.shopOpen && !GAME.lolaOpen &&
      GAME.player.state === 'alive') GAME.togglePause();
  });

  // The soothing pads from the title also play under every overlay — pause,
  // the map, a result card. One place decides; everyone who opens or closes
  // an overlay calls it.
  //
  // It silences the live world too. Every looping voice is a held gain node
  // that the tick keeps current, and the tick STOPS behind an overlay — so
  // whatever was playing when one opened holds that level until it closes.
  // Each caller used to silence its own, and the result card silenced
  // nothing at all: finishing a mission in a car left the engine, the skid,
  // the siren, the rotor and the radio droning under the pads. Doing it here
  // means no overlay can forget. Engine, skid and siren are re-armed by the
  // next tick; the radio's level is set once on boarding, so it is restored
  // by hand — and only to a living driver, or closing the map over your own
  // corpse would undo the silence death just asked for.
  GAME.syncOverlayMusic = function () {
    var over = !GAME.started || GAME.paused || GAME.mapOpen || !!GAME.shareOpen || !!GAME.shopOpen || !!GAME.lolaOpen;
    if (over) GAME.hud.lockHint(false);   // an overlay is a mouse screen: no "click to look" under it
    if (!GAME.audio.ctx) return;
    // a scene stops the tick too, but it is not a menu: the loops go quiet
    // under the voices, and no pads
    var quiet = over || !!GAME.sceneOpen;
    if (quiet) GAME.audio.rain(0);   // the tick that keeps it level stops behind an overlay
    var P = GAME.player;
    GAME.audio.titleMusic(over);
    if (quiet) {
      GAME.audio.engineState(false, 0);
      GAME.audio.skid(0);
      GAME.audio.siren(0);
      GAME.ambience.silence();
      GAME.audio.radio.setVolume(0);
    } else if (P && P.inCar && P.car && P.state === 'alive') {
      GAME.audio.radio.setVolume(GAME.audio.muted ? 0 : 0.7);
    } else if (P && P.interior && P.interior.music && P.state === 'alive') {
      GAME.audio.radio.setVolume(GAME.audio.muted ? 0 : 0.45);   // the casino's music
    }
  };

  GAME.togglePause = function () {
    if (!GAME.started) return;
    GAME.paused = !GAME.paused;
    GAME.hud.setPaused(GAME.paused);
    if (GAME.paused) {
      // the context stays running so the title pads keep the pause screen
      // warm; syncOverlayMusic below stops the looping voices. They do NOT
      // stop on their own — a held gain node with no tick to update it just
      // sustains, and the radio's scheduler is an interval, not the tick.
      GAME.releasePointer();
    } else {
      GAME.audio.resume();
      // On touch the resume tap is a real gesture and play means fullscreen,
      // full stop — the same promise starting the game makes. Restoring only
      // when we recorded losing it (fsRestore) missed every path where the
      // exit was manual or the earlier request failed, which is why the game
      // "sometimes" came back windowed on mobile. Desktop keeps the nuance:
      // a windowed desktop player chose to be windowed.
      if (GAME.isTouch) GAME.enterFullscreen();
      else GAME.maybeRestoreFullscreen();
      GAME.regainPointer();
    }
    GAME.syncOverlayMusic();
  };

  // auto-pause when the tab/app is backgrounded or loses focus, and freeze
  // audio. Pausing no longer suspends the context (the pads play on), so a
  // hidden tab always suspends explicitly here.
  function onHide() {
    if (GAME.started && !GAME.paused && !GAME.mapOpen && !GAME.shareOpen && !GAME.shopOpen && !GAME.lolaOpen && GAME.player.state === 'alive') GAME.togglePause();
    GAME.audio.suspend();
  }
  function onShow() {
    // always bring the context back: if we sit on the pause screen the pads
    // should be heard again, and an open map must not strand it suspended
    GAME.audio.resume();
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) onHide(); else onShow();
  });
  window.addEventListener('blur', onHide);
  window.addEventListener('focus', onShow);

  // park the headlight on the player's vehicle, aimed down the road ahead.
  // Intensity follows the clock, so it only lights up as dusk falls.
  function updateHeadlight() {
    var L = GAME.lights, P = GAME.player;
    if (!L || !L.head) return;
    var h = L.head;
    var car = P.inCar && P.car ? P.car : null;
    var night = U.clamp(1 - GAME.timeOfDay * 1.6, 0, 1);
    if (!car || !night) { h.intensity = 0; return; }
    h.intensity = night * (car.spec.heli || car.spec.plane ? 2.4 : 3.6);
    var fx = Math.sin(car.heading), fz = Math.cos(car.heading);
    var nose = car.spec.l * 0.45;
    h.position.set(car.pos.x + fx * nose, car.pos.y + 0.85, car.pos.z + fz * nose);
    // aim slightly down so the cone lands on the road rather than the skyline
    h.target.position.set(car.pos.x + fx * 30, car.pos.y - 1.6, car.pos.z + fz * 30);
    h.target.updateMatrixWorld();
  }

  GAME.tick = function (dt) {
    // A scene holds the world still and takes the tick for itself (scenes.js):
    // the clock, the traffic, the law and every mission timer wait it out.
    if (GAME.sceneOpen) {
      GAME.scenes.update(dt);
      GAME.clearPressed();
      return;
    }
    GAME.time += dt;
    GAME.frame++;
    // set the ears before anything this tick has a chance to make a noise
    var ears = GAME.focus();
    GAME.audio.setListener(ears.x, ears.z, GAME.cam.yaw);
    GAME.advanceDayCycle(dt);
    GAME.weather.update(dt);
    GAME.city.update(dt, GAME.time);
    GAME.vehicles.update(dt);
    GAME.peds.update(dt);
    GAME.updatePlayer(dt);
    GAME.aircraft.updateRockets(dt);
    GAME.combat.update(dt);
    GAME.arsenal.update(dt);
    GAME.combat.updatePickups(dt);
    GAME.police.update(dt);
    GAME.sealife.update(dt);
    GAME.streetlife.update(dt);
    GAME.strangers.update(dt);
    GAME.gangs.update(dt);
    GAME.heist.update(dt);
    GAME.business.update(dt);
    GAME.missions.update(dt);
    GAME.guide.update(dt);
    GAME.tapes.update(dt);
    if (GAME.isla) GAME.isla.tick(dt);
    GAME.shops.update(dt);
    GAME.interiors.update(dt);
    GAME.robbery.update(dt);
    GAME.derby.update(dt);
    GAME.photo.update(dt);
    // slow autosave heartbeat: health and ammo drift without touching cash,
    // and the save should never be more than ten seconds behind the life
    if (GAME.frame % 600 === 599 && GAME.player.state === 'alive') GAME.save();
    // the endgame watch: notices the last mission or jump landing
    if (GAME.frame % 300 === 150) GAME.missions.checkCompletion();
    GAME.fx.update(dt);
    // last of the sound: everything has moved, so it hears where things are
    GAME.ambience.tick(dt);
    GAME.herald.update(dt);
    updateHeadlight();
    GAME.touch.update();
    GAME.hud.update(dt);
    // every press since the last tick has now been offered to everyone who
    // wanted it; anything unclaimed was for a mode that is not running and
    // must not survive into one that is
    GAME.clearPressed();
  };

  // ---------- graphics quality ----------
  // There was no setting at all: a slow laptop got the full-resolution city
  // and its full crowd, and could only hope the auto-thinning below noticed.
  // Three steps, each a share of the authored numbers rather than numbers of
  // its own, so it sits on top of the phone budget (touch.js) as well.
  var QUALITY = {
    high: { res: 1, fog: 1, crowd: 1 },
    medium: { res: 0.8, fog: 0.85, crowd: 0.75 },
    low: { res: 0.6, fog: 0.7, crowd: 0.5 }
  };
  GAME.quality = 'high';
  GAME.qualityCrowd = function () { return QUALITY[GAME.quality].crowd; };
  // the authored values are re-read every time, so switching touch on or off
  // underneath a lowered setting cannot compound it; the draw distance rides
  // on the day cycle's (applyTimeOfDay), which is re-run to pick it up
  GAME.applyQuality = function () {
    var q = QUALITY[GAME.quality], S = GAME.settings;
    if (GAME.renderer) GAME.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, S.pixelRatioCap) * q.res);
    if (GAME.scene && GAME.scene.fog && GAME.lights) GAME.applyTimeOfDay(GAME.timeOfDay);
  };
  GAME.setQuality = function (name, quiet) {
    if (!QUALITY[name]) return;
    GAME.quality = name;
    GAME.applyQuality();
    if (!quiet) {
      GAME.prefs = GAME.prefs || {};
      GAME.prefs.quality = name;
      GAME.save();
    }
  };

  // ---------- what the frame can afford ----------
  // The crowd costs what it costs, and on a slow machine — or in a five star
  // chase, where every cruiser is another body, another driver and another
  // pair of eyes — the frame stops fitting in its 16 ms. Rather than let the
  // whole simulation go soft, spend fewer bodies.
  //
  // GAME.settings stays the authored ceiling: the desktop numbers, or the
  // lower ones touch.js writes for a phone. This scales what is actually
  // spawned underneath whichever of those is in force, and never writes to
  // them — a live measurement must not overwrite a considered choice.
  //
  // Nothing is ever culled. All three caps gate NEW spawns only, so a cut
  // budget drains through the bubble's own despawn rather than popping cars
  // out of the street in front of you, and a restored one refills the same
  // way. That is also why it moves in small steps on a slow clock: the street
  // should thin out and fill back in, not blink.
  GAME.perf = (function () {
    var TARGET = 1000 / 60;
    var SHRINK_AT = 22;   // ~45 fps: late enough to see
    var GROW_AT = 18;     // ~55 fps: only climb back with room to spare, so
                          // the two thresholds cannot chase each other
    var FLOOR = 0.35;     // an empty city is a worse bug than a slow one
    var STEP = 0.08;
    var EVERY = 0.5;      // seconds between adjustments
    var WARMUP = 3;       // boot, shader compiles and texture uploads are not
                          // evidence about the crowd
    var ema = TARGET, scale = 1, since = 0, warm = 0;

    var longRun = 0;
    function sample(ms) {
      if (!(ms > 0)) return;
      // a stalled frame — tab switch, GC, a breakpoint — says nothing about
      // what the crowd costs, and folding it in would drag the average for
      // seconds afterwards. But a RUN of them is the machine: dropping every
      // frame over 80 ms meant a device under 12 fps fed this nothing at all,
      // and the thinning never reached the one place that needed it most.
      if (ms > 80) {
        if (++longRun < 4) return;
        ms = 80;
      } else longRun = 0;
      ema += (ms - ema) * 0.06;
    }
    function update(dt) {
      warm += dt;
      if (warm < WARMUP) return;
      since += dt;
      if (since < EVERY) return;
      since = 0;
      if (ema > SHRINK_AT) scale = Math.max(FLOOR, scale - STEP);
      else if (ema < GROW_AT) scale = Math.min(1, scale + STEP);
    }
    return {
      get scale() { return scale; },
      get frameMs() { return ema; },
      sample: sample,
      update: update,
      // how many of a thing the budget currently allows. Never zero: a street
      // with nobody on it reads as broken, not as thrifty.
      budget: function (n) { return Math.max(1, Math.round(n * scale * GAME.qualityCrowd())); },
      // headless hooks: pretend the frames have been this long, and start over
      testFrames: function (ms) { ema = ms; warm = WARMUP; since = EVERY; },
      testReset: function () { ema = TARGET; scale = 1; since = 0; warm = 0; }
    };
  })();

  // Catch-up is capped at TWO sim ticks per rendered frame. The old cap of
  // five meant a machine that fell behind (an integrated GPU with other tabs
  // open) paid up to 5x the sim cost per frame exactly when it could least
  // afford it — a spiral that read as sluggishness everywhere. Two keeps the
  // sim realtime all the way down to 30 fps and sheds work below that
  // (fractionally slower motion) instead of digging the hole deeper.
  var STEP = 1 / 60, MAX_TICKS = 2;
  function loop(now) {
    requestAnimationFrame(loop);
    var rawMs = now - lastT;
    var real = Math.min(0.1, rawMs / 1000);
    lastT = now;
    // a controller is read every frame, overlays included (Start unpauses)
    GAME.controls.poll(real);
    if (!GAME.started) {
      accumulator += real;
      var g0 = 0;
      while (accumulator >= STEP && g0 < MAX_TICKS) {
        GAME.tickAttract(STEP);
        accumulator -= STEP;
        g0++;
      }
      if (g0 === MAX_TICKS) accumulator = 0;
    } else if (!GAME.paused && !GAME.mapOpen && !GAME.shareOpen && !GAME.shopOpen && !GAME.lolaOpen) {
      // only while the sim is actually running: a paused or overlaid frame
      // draws a still city and says nothing about what the crowd costs
      GAME.perf.sample(rawMs);
      GAME.perf.update(real);
      accumulator += real * GAME.timeScale;
      var guard = 0;
      while (accumulator >= STEP && guard < MAX_TICKS) {
        GAME.tick(STEP);
        accumulator -= STEP;
        guard++;
      }
      if (guard === MAX_TICKS) accumulator = 0;
    } else {
      // behind pause, the map, a shop or a result card nothing ticks, so
      // nothing would drain the buffer: keystrokes on an overlay are not
      // gameplay input and must not fire the moment it closes
      GAME.clearPressed();
    }
    // From altitude the road layers sat closer together than the depth buffer
    // could tell apart (0.03m of separation against ~0.2m of precision at half
    // a kilometre with near=0.1), and the streets shimmered from the plane.
    // Nothing is ever close to a camera that is high above the ground, so the
    // near plane climbs with it — 20x the depth precision — and drops back the
    // moment the camera is down among things it could clip. Hysteresis keeps
    // it from toggling on the boundary.
    var cam = GAME.cameraObj;
    // the sky (domes, stars, moon) tracks the viewer so its rim can never be
    // reached — horizon height stays at world level, hence y locked to 0
    if (GAME.city.skyAnchor) GAME.city.skyAnchor.position.set(cam.position.x, 0, cam.position.z);
    var relH = cam.position.y - GAME.city.surfaceY(cam.position.x, cam.position.z, cam.position.y);
    var wantNear = relH > (cam.near > 0.2 ? 34 : 46) ? 2.0 : 0.1;
    if (wantNear !== cam.near) { cam.near = wantNear; cam.updateProjectionMatrix(); }
    renderer.render(GAME.scene, GAME.cameraObj);
    // a photo is taken from the frame just drawn (photo.js)
    GAME.photo.capture(renderer.domElement);
    // the shop's turntable preview spins even while the sim is frozen
    if (GAME.shops && GAME.shops.renderPreview) GAME.shops.renderPreview();
  }

  // headless-drivable test hooks
  GAME.test = {
    start: function () { GAME.startGame(); },
    teleport: function (x, z) {
      var P = GAME.player;
      if (P.inCar && P.car) {
        // set down on whatever is at the destination, so a teleport off a
        // height isn't mistaken for a fall (and scored as a jump)
        P.car.pos.set(x, GAME.city.groundY(x, z), z);
        P.car.speed = 0; P.car.lat = 0; P.car.vy = 0; P.car.air = 0; P.car.jumpRamp = null;
        // and drop the held trajectory with it — set down out of a jump
        // without this and the car keeps flying the old one on the ground,
        // deaf to the pedals, because nothing else clears it but a landing
        P.car.airVX = P.car.airVZ = undefined;
      } else {
        if (GAME.stopSwim) GAME.stopSwim();   // (into water, you start again there)
        if (GAME.interiors) GAME.interiors.reset();
        P.pos.set(x, GAME.city.groundY(x, z), z);
        P.velY = 0; P.airborne = false;
      }
      return GAME.test.getState();
    },
    giveWeapon: function (id, ammo) { GAME.combat.giveWeapon(id, ammo || 60); },
    setWanted: function (n) { GAME.police.setWanted(n); },
    setHealth: function (h) { GAME.player.health = h; },
    addCash: function (n) { GAME.addCash(n); },
    // Offsets are from wherever the player IS, which behind a wheel is the
    // car. P.pos does not follow you into one — the whole game reads position
    // through GAME.focus() for that reason — so these used to place things
    // relative to the spot you last got OUT at, quietly, and a caller who had
    // driven anywhere since got them somewhere else entirely.
    spawnCar: function (type, dx, dz) {
      var f = GAME.focus();
      return GAME.vehicles.spawnCar(type || 'sedan', f.x + (dx || 5), f.z + (dz || 0), 0, {});
    },
    spawnPed: function (dx, dz) {
      var f = GAME.focus();
      return GAME.peds.spawnPed(f.x + (dx || 5), f.z + (dz || 0));
    },
    // Hand it the car you want and it takes that one. "Nearest" is a lottery
    // on a live street — traffic spawns around the player, so a car passing by
    // can be closer than the one you just put down, and you board that instead
    // — and an unpowered aircraft does not even stay where it was made. Almost
    // every caller has the car in its hand already.
    enterNearestCar: function (car) {
      var P = GAME.player;
      if (P.inCar) return true;
      if (!car) car = GAME.vehicles.findNearestCar(P.pos.x, P.pos.z, 10, null);
      return car ? GAME.enterCar(car) : false;
    },
    exitCar: function () { GAME.exitCar(); },
    autopilotDrive: function (on) { GAME.autopilot = !!on; },
    fastForward: function (seconds) {
      if (!GAME.started) GAME.startGame();
      var steps = Math.floor(seconds / STEP);
      for (var i = 0; i < steps; i++) GAME.tick(STEP);
      return GAME.test.getState();
    },
    pressKey: function (code, down) {
      var d = down !== false;
      GAME.input.keys[code] = d;
      if (d) GAME.input.pressed[code] = true;   // same edge a real keydown leaves
    },
    getState: function () {
      var P = GAME.player;
      var info = GAME.renderer ? GAME.renderer.info.render : { calls: 0, triangles: 0 };
      var traffic = 0, copsCars = 0, footCops = 0, civs = 0;
      GAME.world.cars.forEach(function (c) { if (c.isPolice) copsCars++; else if (c.ai && c.ai.mode === 'traffic') traffic++; });
      GAME.world.peds.forEach(function (p) { if (p.dead) return; if (p.isCop) footCops++; else civs++; });
      return {
        x: Math.round((P.inCar && P.car ? P.car.pos.x : P.pos.x) * 10) / 10,
        z: Math.round((P.inCar && P.car ? P.car.pos.z : P.pos.z) * 10) / 10,
        mode: P.inCar ? 'car' : 'foot',
        carType: P.inCar && P.car ? P.car.type : null,
        speed: P.inCar && P.car ? Math.round(P.car.speed * 10) / 10 : Math.round(P.moveSpeed * 10) / 10,
        health: Math.round(P.health), armor: Math.round(P.armor),
        cash: P.cash,
        wanted: GAME.police.wanted,
        heat: Math.round(GAME.police.heat),
        weapon: P.currentWeapon,
        ammo: P.weapons[P.currentWeapon] ? P.weapons[P.currentWeapon].ammo : 0,
        state: P.state,
        mission: GAME.missions.active ? GAME.missions.active.def.id : null,
        missionObjective: GAME.missions.objectiveText(),
        cars: GAME.world.cars.length, traffic: traffic, policeCars: copsCars,
        peds: civs, footCops: footCops,
        pickups: GAME.world.pickups.length,
        drawCalls: info.calls, triangles: info.triangles,
        time: Math.round(GAME.time * 10) / 10,
        started: GAME.started, paused: GAME.paused
      };
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
