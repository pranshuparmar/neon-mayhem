GAME.touch = (function () {
  var layer, stickZone, stickBase, stickNub;
  var stickId = null, camId = null, camLX = 0, camLY = 0;
  var baseX = 0, baseY = 0;
  var footBtns = [], carBtns = [];
  var btns = {};
  var enabled = false;     // the layer has been built (once, on first use)
  var touchMode = false;   // ...and is what the player is using right now
  var lastCarRef = null;   // the vehicle (or null) the flags were last cleared for
  var wasPlaying = false;  // were the on-foot/in-car controls applying last frame
  var lefty = false;       // stick under the right thumb, buttons under the left
  var lolaShown = null;    // whether her button is in the top row right now

  // Start on touch only where a finger is the main way in. Being ABLE to
  // take a touch is not that: a touchscreen laptop, a Surface, a Chromebook
  // all report touch points, and treating them as phones put the buttons over
  // the screen, cut the crowd and switched the mouse off. Those start on the
  // mouse; touching the screen switches over, and the mouse switches back.
  function detect() {
    var mq = window.matchMedia;
    if (mq && mq('(pointer: coarse)').matches) return true;
    if (mq && mq('(any-pointer: fine)').matches) return false;
    return ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  }

  function mkBtn(label, right, bottom, size, opts) {
    var b = document.createElement('div');
    b.className = 'tbtn';
    b.textContent = label;
    b.__inset = right;   // authored as an inset from the thumb's own edge
    b.style.right = right + 'px';
    b.style.bottom = bottom + 'px';
    b.style.width = size + 'px';
    b.style.height = size + 'px';
    b.style.minWidth = size + 'px';
    b.style.minHeight = size + 'px';
    layer.appendChild(b);
    opts = opts || {};
    var T = GAME.input.touch;
    b.addEventListener('touchstart', function (e) {
      e.preventDefault(); e.stopPropagation();
      b.classList.add('held');
      // a virtual button has no travel and no click of its own, so without
      // this it never feels pressed at all. Bottom tier: a thumb resting on
      // GAS must never be able to talk over a crash.
      GAME.haptics.uiTap();
      if (opts.toggle) {
        T[opts.flag] = !T[opts.flag];
        b.style.background = T[opts.flag] ? 'rgba(140,255,210,.4)' : '';
      } else if (opts.flag) T[opts.flag] = true;
      if (opts.press) opts.press();
    }, { passive: false });
    var release = function (e) {
      e.preventDefault(); e.stopPropagation();
      b.classList.remove('held');
      if (opts.flag && !opts.toggle) T[opts.flag] = false;
      if (opts.release) opts.release();
    };
    b.addEventListener('touchend', release, { passive: false });
    // touchcancel fires instead of touchend on an OS interruption (call, shade,
    // app switch) — without this the button would stay stuck held
    b.addEventListener('touchcancel', release, { passive: false });
    return b;
  }

  function init() {
    if (detect()) enable();
    // a real touch at any point switches to touch, whatever boot decided...
    window.addEventListener('touchstart', function () { if (!touchMode) enable(); }, { passive: true });
    // ...and a real mouse switches back. Pointer events, not mouse ones: the
    // mouse events a browser makes up after a tap must not count, and those
    // never arrive as a pointer of type 'mouse'.
    var back = function (e) { if (touchMode && e.pointerType === 'mouse') useMouse(); };
    window.addEventListener('pointerdown', back, true);
    window.addEventListener('pointermove', function (e) {
      if (touchMode && e.pointerType === 'mouse' && (e.movementX || e.movementY)) useMouse();
    }, true);
  }

  // What switching to touch changes outside the layer, so switching back can
  // put it back as it was.
  var saved = null;
  var TOUCH_BUDGET = { pixelRatioCap: 1.4, bubbleRadius: 110, maxTraffic: 8, maxPeds: 12, maxParked: 9, maxBoats: 3 };
  function applySettings(vals, fogFar) {
    var S = GAME.settings;
    for (var k in vals) S[k] = vals[k];
    // after boot: apply what the renderer already consumed (through the
    // graphics setting, which scales whatever is authored here)
    if (GAME.applyQuality) GAME.applyQuality();
    if (GAME.scene && GAME.scene.fog && fogFar) GAME.scene.fog.far = fogFar;
  }
  function moveCorner(el, css) {
    if (!el) return;
    if (el.__mouseCss === undefined) el.__mouseCss = el.getAttribute('style') || '';
    for (var k in css) el.style[k] = css[k];
  }
  function restoreCorner(el) {
    if (el && el.__mouseCss !== undefined) el.setAttribute('style', el.__mouseCss);
  }

  function enable() {
    if (touchMode) return;
    touchMode = true;
    GAME.isTouch = true;
    GAME.input.touch.active = true;
    var S = GAME.settings;
    if (!saved) {
      saved = { fogFar: GAME.scene && GAME.scene.fog ? GAME.scene.fog.far : 0, vals: {} };
      for (var k in TOUCH_BUDGET) saved.vals[k] = S[k];
    }
    applySettings(TOUCH_BUDGET, 320);
    if (!GAME.started) {
      var pe = document.getElementById('press-enter');
      if (pe && !pe.classList.contains('loading')) pe.textContent = 'TAP TO START';
    }
    // the radar moves to the top-left on touch: the bottom-left corner is the
    // virtual stick's zone, and the two were fighting for the same thumb.
    // PAUSE sits just right of it, then the camera, and fullscreen keeps its
    // own control after those (shown only while not full screen, see
    // hud.refreshFsBtn) — last in the row, so hiding it leaves no gap, and
    // never on top of the camera, which it covered when the two shared a slot
    moveCorner(document.getElementById('minimap-wrap'), { bottom: 'auto', left: '10px', top: '10px', width: '132px', height: '132px', pointerEvents: 'auto' });
    lolaShown = null;   // (and her button decides the fullscreen slot again)
    moveCorner(document.getElementById('fs-btn'), { bottom: 'auto', right: 'auto', left: 'calc(260px + env(safe-area-inset-left, 0px))',
      top: 'calc(12px + env(safe-area-inset-top, 0px))', width: '46px', height: '46px' });
    if (enabled) {
      if (layer) layer.style.display = '';
      checkOrientation();
      return;
    }
    build();
  }

  // Back to the mouse and keyboard: the layer goes, the HUD corners and the
  // crowd budget come back, and the mouse fires and looks again.
  function useMouse() {
    if (!touchMode) return;
    touchMode = false;
    GAME.isTouch = false;
    var T = GAME.input.touch;
    T.active = false;
    T.stickX = T.stickY = 0;
    releaseButtons();
    stickId = null; camId = null;
    if (stickBase) { stickBase.style.display = 'none'; stickNub.style.display = 'none'; }
    if (layer) { layer.style.display = 'none'; layer._disp = 'none'; }
    var rh = document.getElementById('rotate-hint');
    if (rh) rh.style.display = 'none';
    GAME.isPortrait = false;
    if (saved) applySettings(saved.vals, saved.fogFar);
    restoreCorner(document.getElementById('minimap-wrap'));
    restoreCorner(document.getElementById('fs-btn'));
    if (!GAME.started) {
      var pe = document.getElementById('press-enter');
      if (pe && !pe.classList.contains('loading')) pe.textContent = 'PRESS ENTER';
    }
    // (the controls bar comes back on the HUD's own refresh)
    if (GAME.hud && GAME.hud.refreshFsBtn) GAME.hud.refreshFsBtn();
  }

  function build() {
    enabled = true;

    layer = document.getElementById('touch-layer');
    stickZone = document.getElementById('tstick-zone');
    stickBase = document.getElementById('tstick-base');
    stickNub = document.getElementById('tstick-nub');
    var T = GAME.input.touch;
    T.active = true;

    // ---- right-thumb action cluster, laid out like the classic console port:
    // the primary action sits in the very corner under the thumb, its partner
    // (brake / jump) directly beside it on the same bottom row, and the
    // secondary controls step up and inboard from there. Buttons show/hide by
    // context in update(). ----
    // on foot
    btns.fire = mkBtn('FIRE', 24, 24, 96, { flag: 'fire', press: function () { T.firePressed = true; } });
    btns.jump = mkBtn('JUMP', 134, 24, 82, { flag: 'jump' });
    btns.aim = mkBtn('AIM', 34, 132, 68, { flag: 'aim', toggle: true });
    btns.enter = mkBtn('ENTER', 122, 122, 62, { flag: 'enter' });
    btns.run = mkBtn('RUN', 228, 30, 62, { flag: 'run', toggle: true });
    btns.wpn = mkBtn('WPN', 116, 200, 54, { press: function () { T.weaponCycle = true; } });
    footBtns.push(btns.fire, btns.jump, btns.aim, btns.enter, btns.run, btns.wpn);
    // in car: GAS in the corner, BRAKE right next to it (never stacked above)
    btns.gas = mkBtn('GAS', 24, 24, 96, { flag: 'gas' });
    btns.brake = mkBtn('BRAKE', 134, 24, 86, { flag: 'brake' });
    btns.handbrake = mkBtn('⇋', 34, 132, 68, { flag: 'handbrake' });
    btns.exit = mkBtn('EXIT', 122, 124, 62, { flag: 'enter' });
    btns.driveby = mkBtn('FIRE', 232, 30, 68, { flag: 'driveByAuto' });
    btns.job = mkBtn('JOB', 116, 200, 54, { press: function () { T.job = true; } });
    btns.radio = mkBtn('♪', 200, 200, 50, { press: function () { GAME.switchRadio(1); } });
    btns.horn = mkBtn('📢', 232, 112, 56, { flag: 'hornHeld', press: function () { T.horn = true; } });
    // the TALON's arsenal: chin gun and rockets, shown only in the gunship
    // (they drive the same fire/aim flags the gunship reads in aircraft.js)
    btns.gsGun = mkBtn('GUN', 232, 30, 68, { flag: 'fire' });
    btns.gsRkt = mkBtn('RKT', 232, 112, 62, { flag: 'aim' });
    // the plane's barrel roll, which Q/E and a pad's bumpers had and a
    // touchscreen did not; they take the slots the horn and handbrake leave
    // empty in the air
    btns.rollL = mkBtn('⟲', 232, 112, 62, { flag: 'rollL' });
    btns.rollR = mkBtn('⟳', 34, 132, 62, { flag: 'rollR' });
    carBtns.push(btns.gas, btns.brake, btns.handbrake, btns.driveby, btns.exit, btns.radio, btns.job, btns.gsGun, btns.gsRkt, btns.horn,
      btns.rollL, btns.rollR);
    // a failed run's retry offer, on foot or at the wheel (missions.js)
    btns.retry = mkBtn('RETRY', 24, 236, 62, { press: function () { T.retry = true; } });

    // the radar (moved top-left by enable()) opens the full map on a tap
    var mm = document.getElementById('minimap-wrap');
    if (mm) {
      // tap the radar to open the full map
      mm.addEventListener('touchend', function (e) { e.preventDefault(); e.stopPropagation(); GAME.hud.toggleMap(true); }, { passive: false });
    }
    // PAUSE sits just right of the radar; sound / CRT / time / fullscreen all
    // live in the pause menu
    var pauseB = mkBtn('❚❚', 0, 0, 46, { press: function () { GAME.togglePause(); } });
    pauseB.style.right = ''; pauseB.style.bottom = '';
    pauseB.style.left = '152px'; pauseB.style.top = '12px';
    pauseB.style.fontSize = '15px';
    // and the camera beside it: a shot is always one tap away (photo.js)
    var photoB = mkBtn('📷', 0, 0, 46, { press: function () { T.photo = true; } });
    photoB.style.right = ''; photoB.style.bottom = '';
    photoB.style.left = '206px'; photoB.style.top = '12px';
    photoB.style.fontSize = '18px';
    // and Lola beside that, while her tips are on: the pause screen was the
    // only way a touchscreen could reach her (lola.js)
    btns.lola = mkBtn('📟', 0, 0, 46, { press: function () { if (GAME.lola) GAME.lola.open(); } });
    btns.lola.style.right = ''; btns.lola.style.bottom = '';
    btns.lola.style.left = '260px'; btns.lola.style.top = '12px';
    btns.lola.style.fontSize = '18px';

    // virtual stick
    stickZone.addEventListener('touchstart', function (e) {
      e.preventDefault();
      var t = e.changedTouches[0];
      stickId = t.identifier;
      baseX = t.clientX; baseY = t.clientY;
      stickBase.style.display = 'block';
      stickBase.style.left = (baseX - 60) + 'px';
      stickBase.style.top = (baseY - 60) + 'px';
      stickNub.style.display = 'block';
      moveNub(t.clientX, t.clientY);
    }, { passive: false });
    window.addEventListener('touchmove', function (e) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        if (t.identifier === stickId) moveNub(t.clientX, t.clientY);
        else if (t.identifier === camId) {
          GAME.input.touch.camDX = (GAME.input.touch.camDX || 0) + (t.clientX - camLX) * 2.2;
          GAME.input.touch.camDY = (GAME.input.touch.camDY || 0) + (t.clientY - camLY) * 2.2;
          camLX = t.clientX; camLY = t.clientY;
        }
      }
    }, { passive: true });
    // release the stick / camera finger on lift OR on an OS-cancelled touch,
    // otherwise the stick can stay deflected (car drives itself) after an interruption
    function releaseStick() {
      stickId = null;
      T.stickX = 0; T.stickY = 0;
      stickBase.style.display = 'none';
      stickNub.style.display = 'none';
    }
    function endTouch(e) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        if (t.identifier === stickId) releaseStick();
        if (t.identifier === camId) camId = null;
      }
    }
    window.addEventListener('touchend', endTouch);
    window.addEventListener('touchcancel', endTouch);
    // camera drag on the game canvas outside the stick zone / buttons
    document.getElementById('game-canvas').addEventListener('touchstart', function (e) {
      var t = e.changedTouches[0];
      if (camHalf(t.clientX) && camId === null && stickId !== t.identifier) {
        camId = t.identifier;
        camLX = t.clientX; camLY = t.clientY;
      }
    }, { passive: true });

    applyHandedness();
    checkOrientation();
    // A viewport change is an interruption like any other, and the one the
    // release above did not cover. The stick is placed where your thumb
    // landed and steers by the offset from that point, in client
    // coordinates — turn the device (or gain and lose the browser's chrome,
    // or enter fullscreen) mid-drag and the origin it is measuring from
    // belongs to a screen that no longer exists. It can end up off the new
    // viewport entirely, which reads as a stick pinned hard over that no
    // amount of thumb movement can bring back. Let go instead: a neutral
    // stick and a re-touch is a moment's interruption, a stuck one drives
    // you into the sea.
    window.addEventListener('resize', function () {
      checkOrientation();
      if (stickId !== null) releaseStick();
      camId = null;
    });

    function moveNub(x, y) {
      var dx = x - baseX, dy = y - baseY;
      var len = Math.sqrt(dx * dx + dy * dy);
      var max = 52;
      if (len > max) { dx = dx / len * max; dy = dy / len * max; }
      stickNub.style.left = (baseX + dx - 26) + 'px';
      stickNub.style.top = (baseY + dy - 26) + 'px';
      T.stickX = dx / max;
      T.stickY = dy / max;
    }
  }

  // Left-handed layout. Every button is authored as an inset from the edge its
  // thumb comes from, so mirroring is a matter of applying that same inset to
  // the other side. The stick zone and the camera-drag half have to travel
  // with them: leave either behind and both thumbs end up on the same side of
  // the screen, arguing over it.
  //
  // The radar and PAUSE stay where they are. They sit along the top, out of
  // either thumb's way, and the comment above them says why they were moved
  // there in the first place.
  function applyHandedness() {
    if (!enabled) return;
    var all = footBtns.concat(carBtns);
    for (var i = 0; i < all.length; i++) {
      var b = all[i];
      if (b.__inset === undefined) continue;
      b.style.right = lefty ? 'auto' : b.__inset + 'px';
      b.style.left = lefty ? b.__inset + 'px' : 'auto';
    }
    if (stickZone) {
      stickZone.style.left = lefty ? 'auto' : '0';
      stickZone.style.right = lefty ? '0' : 'auto';
    }
  }
  // the half of the screen the stick does NOT own
  function camHalf(x) {
    return lefty ? x < window.innerWidth * 0.55 : x > window.innerWidth * 0.45;
  }

  function checkOrientation() {
    if (!GAME.isTouch) return;
    var portrait = window.innerHeight > window.innerWidth;
    GAME.isPortrait = portrait;
    document.getElementById('rotate-hint').style.display = portrait ? 'flex' : 'none';
    // the rotate overlay is a menu too — you should be able to go fullscreen from it
    if (GAME.hud && GAME.hud.refreshFsBtn) GAME.hud.refreshFsBtn();
  }

  // The layer is refreshed every tick and almost nothing on it changes from
  // one tick to the next, so each element remembers what it was last given
  // and is written only when that differs — a DOM write is not free even when
  // it changes nothing, and setting textContent replaces the text node.
  // Nothing outside this file touches these elements.
  function setDisplay(el, v) { if (el._disp !== v) { el._disp = v; el.style.display = v; } }
  function setText(el, v) { if (el._text !== v) { el._text = v; el.textContent = v; } }
  function show(btn, on) { if (btn) setDisplay(btn, on ? 'flex' : 'none'); }

  // Every flag the buttons own, let go together.
  //
  // A TOGGLE keeps its state in two places — the flag in GAME.input.touch and
  // the lit background on the button — so anything that takes the controls
  // away has to put both back. Miss the flag and it survives the interruption
  // and starts applying again the moment control returns; miss the background
  // and the button lies about what it is doing. RUN was surviving both a
  // boarding and a death: you would step out of the car, or come round at the
  // hospital, already sprinting and with the button still lit, having pressed
  // nothing. It is the same rule endTouch states for the stick — release on
  // any interruption — applied to the buttons beside it.
  function releaseButtons() {
    var T = GAME.input.touch;
    T.gas = T.brake = T.handbrake = T.driveByAuto = T.rollL = T.rollR = false;
    T.fire = T.jump = T.aim = T.run = T.enter = false;
    T.firePressed = T.weaponCycle = T.job = T.retry = T.photo = T.hornHeld = false;
    for (var k in btns) {
      if (!btns[k]) continue;
      btns[k].classList.remove('held');
      btns[k].style.background = '';
    }
  }

  // Lola's button sits in the top row while her tips are on; fullscreen keeps
  // the last slot of the row either way, so it steps along when she is there
  function stepLola() {
    var on = !!(GAME.lola && GAME.lola.tips);
    if (on === lolaShown) return;
    lolaShown = on;
    show(btns.lola, on);
    var fsb = document.getElementById('fs-btn');
    if (fsb) fsb.style.left = 'calc(' + (on ? 314 : 260) + 'px + env(safe-area-inset-left, 0px))';
  }

  function update() {
    if (!enabled || !touchMode || !GAME.started) return;
    var T = GAME.input.touch;
    var P = GAME.player;
    stepLola();
    // hide all controls behind menus / death screens
    var playing = !GAME.paused && !GAME.mapOpen && P.state === 'alive' && !P.parachuting;
    setDisplay(layer, 'block');
    if (!playing) {
      // Hiding a button is not releasing it. Dying, pausing or opening the map
      // with a toggle on left the flag set behind the overlay and the button
      // lit when it came back — which is how a death could hand you back a
      // sprinting player. Once, on the way out, not every frame we are away.
      if (wasPlaying) { wasPlaying = false; releaseButtons(); }
      for (var i = 0; i < footBtns.length; i++) setDisplay(footBtns[i], 'none');
      for (var j = 0; j < carBtns.length; j++) setDisplay(carBtns[j], 'none');
      show(btns.retry, false);
      return;
    }
    wasPlaying = true;
    show(btns.retry, !!GAME.retryAvailable);
    var inCar = P.inCar;

    // Stepping into or out of any vehicle lets the whole set go. The two sides
    // do not share a control scheme, so nothing held on one has any business
    // still being held on the other: the foot AIM toggle must not fire the
    // TALON's rockets on boarding, a held RKT must not leave you stuck aiming
    // when you step out, and RUN must not be waiting for you at the kerb.
    var carNow = inCar ? P.car : null;
    if (carNow !== lastCarRef) {
      lastCarRef = carNow;
      releaseButtons();
    }

    if (!inCar) {
      // in the water: RUN is the faster stroke, and nothing else applies
      // but climbing into a boat
      var swim = !!P.swimming;
      show(btns.fire, !swim);
      show(btns.run, true);
      show(btns.jump, !swim);
      // AIM only with a gun drawn (fists auto-target on the fire button)
      show(btns.aim, !swim && P.currentWeapon !== 'fist');
      // weapon switch only when more than one weapon is owned
      var owned = 0;
      for (var w in P.weapons) if (P.weapons[w] && P.weapons[w].have) owned++;
      show(btns.wpn, !swim && owned > 1);
      // ENTER only when a car is within reach (a boat, from the water)
      var near = GAME.vehicles.findNearestCar(P.pos.x, P.pos.z, 5.5, null);
      show(btns.enter, !!near && (!swim || !!near.spec.boat));
      for (var c = 0; c < carBtns.length; c++) setDisplay(carBtns[c], 'none');
    } else {
      var heli = P.car && P.car.spec.heli;
      var plane = P.car && P.car.spec.plane;
      var gunship = !!(P.car && P.car.spec.gunship);
      var air = heli || plane;
      show(btns.gas, true); show(btns.brake, true); show(btns.exit, true);
      // aircraft repurpose GAS/BRAKE; hide ground-only buttons
      setText(btns.gas, heli ? '▲ UP' : plane ? 'THR+' : 'GAS');
      setText(btns.brake, heli ? '▼ DN' : plane ? 'THR−' : 'BRAKE');
      show(btns.handbrake, !air);
      // the radio plays in the air too (, and . work there on a keyboard):
      // its slot is free in every aircraft, so the button stays
      show(btns.radio, true);
      show(btns.horn, !air);
      var hasSMG = !air && P.weapons.smg && P.weapons.smg.have && P.weapons.smg.ammo > 0;
      show(btns.driveby, hasSMG);
      // JOB starts a shift and, during one, ends it (J does both on a
      // keyboard) — it used to vanish the moment the shift began, so a
      // touchscreen had no way to clock off but stepping out
      var onShift = !!(GAME.missions && GAME.missions.active && GAME.missions.active.def.job);
      show(btns.job, !air && (onShift || !!GAME.jobAvailable));
      setText(btns.job, onShift ? 'END' : 'JOB');
      // the gunship gets its own trigger pair — before this, the TALON had
      // no way to fire on touch at all (FIRE/AIM live in the foot cluster)
      show(btns.gsGun, gunship);
      show(btns.gsRkt, gunship);
      show(btns.rollL, !!plane);
      show(btns.rollR, !!plane);
      for (var f = 0; f < footBtns.length; f++) setDisplay(footBtns[f], 'none');
    }

    // drive-by auto-aims at the nearest side
    if (inCar && T.driveByAuto && P.car) {
      var car = P.car, side = 1, bd = 1e9, peds = GAME.world.peds;
      for (var p = 0; p < peds.length; p++) {
        var pd = peds[p];
        if (pd.dead) continue;
        var d2 = U.dist2(pd.pos.x, pd.pos.z, car.pos.x, car.pos.z);
        if (d2 < bd && d2 < 1600) {
          bd = d2;
          var dx = pd.pos.x - car.pos.x, dz = pd.pos.z - car.pos.z;
          side = (dx * Math.cos(car.heading) - dz * Math.sin(car.heading)) > 0 ? 1 : -1;
        }
      }
      T.driveByL = side > 0; T.driveByR = side < 0;
    } else { T.driveByL = false; T.driveByR = false; }
  }

  return {
    init: init, update: update, useMouse: useMouse, useTouch: enable,
    get lefty() { return lefty; },
    setLefty: function (v) { lefty = !!v; applyHandedness(); return lefty; }
  };
})();
