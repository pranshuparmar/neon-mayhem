// Controls: key rebinding, mouse sensitivity, invert-Y, field of view, and a
// gamepad. There were none of these — the keys were what they were, the mouse
// turned at one fixed rate, and a controller did nothing at all.
//
// Rebinding is one translation step where keys come in (utils.js): the game
// still asks for 'KeyF' or 'Space' everywhere, and this decides which
// physical key that means. A key whose action has moved elsewhere stops
// meaning anything until something is bound to it.
GAME.controls = (function () {
  // the actions you can rebind, by the key the game asks for, in screen order
  var ACTIONS = [
    ['KeyW', 'Forward / throttle'], ['KeyS', 'Back / brake'], ['KeyA', 'Left'], ['KeyD', 'Right'],
    ['Space', 'Jump · climb · handbrake'], ['ShiftLeft', 'Sprint · descend'], ['KeyF', 'Enter / exit vehicle'],
    ['KeyQ', 'Target left · drive-by left'], ['KeyE', 'Target right · drive-by right'], ['Tab', 'Aim lock (toggle)'],
    ['KeyJ', 'Start a job'], ['KeyX', 'Abandon the mission (twice)'], ['KeyC', 'Take a photo'], ['KeyV', 'View your last photo'], ['KeyL', 'Call Lola'], ['KeyG', 'Horn · siren'], ['Comma', 'Radio back'], ['Period', 'Radio next'],
    ['KeyY', 'Retry a failed run'], ['KeyP', 'Map'], ['KeyM', 'Mute'], ['KeyH', 'Hide the hints'], ['KeyT', 'CRT filter'],
    ['KeyR', 'Continue after WASTED / BUSTED']
  ];
  var IS_ACTION = {};
  ACTIONS.forEach(function (a) { IS_ACTION[a[0]] = true; });
  var bound = {};     // action code -> physical code, only where it differs
  var rev = {};       // physical code -> action code
  function rebuild() {
    rev = {};
    for (var k in bound) rev[bound[k]] = k;
  }
  function physicalFor(action) { return bound[action] || action; }
  // a physical key, as the game should hear it: what it is bound to; itself,
  // unless it is an action that now lives on another key; or nothing
  function map(code) {
    if (code === 'Escape') return code;   // never rebindable: it is the way out
    if (rev[code]) return rev[code];
    if (IS_ACTION[code] && bound[code] && bound[code] !== code) return null;
    return code;
  }
  function bind(action, code) {
    if (!IS_ACTION[action] || !code || code === 'Escape') return false;
    // whatever had this key gets this action's old one: a swap, never a hole
    var old = physicalFor(action);
    for (var i = 0; i < ACTIONS.length; i++) {
      var a = ACTIONS[i][0];
      if (a !== action && physicalFor(a) === code) setBound(a, old);
    }
    setBound(action, code);
    rebuild();
    save();
    return true;
  }
  function setBound(action, code) {
    if (code === action) delete bound[action]; else bound[action] = code;
  }
  function reset() { bound = {}; rebuild(); save(); }
  // the key an action is on, for the keyboard's own screens
  function keyLabel(code) {
    var c = physicalFor(code);
    var NAMES = { Space: 'Space', ShiftLeft: 'Shift', ShiftRight: 'R-Shift', ControlLeft: 'Ctrl', ControlRight: 'R-Ctrl',
      AltLeft: 'Alt', Tab: 'Tab', Comma: ',', Period: '.', Slash: '/', Semicolon: ';', Quote: "'", BracketLeft: '[',
      BracketRight: ']', Backquote: '`', Minus: '-', Equal: '=', Enter: 'Enter', Backspace: 'Bksp',
      ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', CapsLock: 'Caps' };
    if (NAMES[c]) return NAMES[c];
    if (/^Key[A-Z]$/.test(c)) return c.slice(3);
    if (/^Digit\d$/.test(c)) return c.slice(5);
    if (/^Numpad/.test(c)) return 'Num' + c.slice(6);
    return c;
  }
  // The pad's button for an action, by the key it stands for (see BUTTONS),
  // or null where the pad reaches it some other way (Lola, abandon, mute and
  // the rest are on the pause screen).
  var PAD_NAME = { Space: 'A', ShiftLeft: 'B', KeyJ: 'X', KeyF: 'Y', KeyQ: 'LB', KeyE: 'RB', KeyP: 'BACK',
    Escape: 'START', KeyC: 'L3', KeyG: 'R3', KeyY: 'D-PAD ↑', Comma: 'D-PAD ←', Period: 'D-PAD →',
    KeyR: 'A', Tab: 'LT', Enter: 'A' };
  function padName(code) { return PAD_NAME[code] || null; }
  // What a prompt calls an action: the button in your hands while you are
  // playing on the pad, the key otherwise. Every prompt said the key, so a
  // pad player was told to press F to get in, R to carry on, X twice to
  // walk away from a run — keys their hands were nowhere near.
  function label(code) { return usingPad() && PAD_NAME[code] ? PAD_NAME[code] : keyLabel(code); }

  // ---------- look ----------
  var sens = 1, invertY = false, fov = 62;
  var SENS_STEPS = [0.5, 0.7, 0.85, 1, 1.25, 1.5, 2], FOV_STEPS = [55, 62, 70, 80, 90];
  function applyFov() {
    var cam = GAME.cameraObj;
    if (cam && cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
  }

  function save() {
    if (!GAME.prefs) return;
    GAME.prefs.controls = { bound: bound, sens: sens, invertY: invertY, fov: fov };
    if (GAME.save) GAME.save();
    if (GAME.hud && GAME.hud.keysChanged) GAME.hud.keysChanged();
  }
  function load() {
    var c = GAME.prefs && GAME.prefs.controls;
    if (!c) return;
    bound = c.bound || {};
    for (var k in bound) if (!IS_ACTION[k]) delete bound[k];
    rebuild();
    if (GAME.hud && GAME.hud.keysChanged) GAME.hud.keysChanged();
    if (c.sens) sens = c.sens;
    invertY = !!c.invertY;
    if (c.fov) fov = c.fov;
    applyFov();
  }

  // ---------- the gamepad ----------
  // Standard mapping. Sticks and triggers are analog and read where the touch
  // stick is (GAME.pad); the buttons become the keys they stand for, pressed
  // and released like a keyboard would, so everything that answers a key
  // answers the pad without knowing it exists.
  var pad = { on: false, lx: 0, ly: 0, rx: 0, ry: 0, lt: 0, rt: 0 };
  var DEAD = 0.18;
  // D-pad down (13) is the next weapon, and only that: it was also Lola for
  // a while, so every weapon change opened her menu over the game. She is
  // ASK LOLA on the pause screen.
  var BUTTONS = {
    0: 'Space', 1: 'ShiftLeft', 2: 'KeyJ', 3: 'KeyF', 4: 'KeyQ', 5: 'KeyE',
    8: 'KeyP', 9: 'Escape', 10: 'KeyC', 11: 'KeyG', 12: 'KeyY', 14: 'Comma', 15: 'Period'
  };
  // what the buttons mean on a menu (pause screen arrows and Enter)
  var MENU = { 0: 'Enter', 1: 'Escape', 9: 'Escape', 12: 'ArrowUp', 13: 'ArrowDown', 14: 'ArrowLeft', 15: 'ArrowRight' };
  // and on the full map, where the left stick moves a cursor (hud.mapPad):
  // A sets the route there, X clears it, the bumpers zoom, the D-pad steps
  // the legend's solo, BACK — which opened it — or B shuts it
  var MAP = { 0: 'Enter', 1: 'Escape', 9: 'Escape', 8: 'KeyP', 2: 'KeyC', 4: 'Minus', 5: 'Equal', 14: 'ArrowLeft', 15: 'ArrowRight' };
  // held: which buttons are down; sent: the key each one pressed, so its
  // release lets go of THAT key. Looked up afresh on release, a button held
  // across a change of screen let go of some other key: A held as the
  // handbrake through a pause came up as Enter, and the handbrake stayed on.
  var held = {}, sent = {}, fireHeld = false, aimHeld = false, toldPad = false;
  // Whether the pad is what you are playing with right now — the last thing
  // touched — which decides what the prompts call things.
  var lastPad = false;
  function usingPad() { return pad.on && lastPad; }
  function noteDevice(isPad) {
    if (isPad === lastPad) return;
    lastPad = isPad;
    if (GAME.hud && GAME.hud.keysChanged) GAME.hud.keysChanged();
    if (open) render();
  }
  function axis(v) { return Math.abs(v) < DEAD ? 0 : (v - (v > 0 ? DEAD : -DEAD)) / (1 - DEAD); }
  function keyDown(code) {
    // the CONTROLS screen takes its keys before the game sees them, as it
    // does from the keyboard (utils.js); without this B closed the pause
    // screen underneath it and left it standing over the game
    if (open) { key(code); return; }
    var inp = GAME.input;
    if (!inp.keys[code]) { inp.keys[code] = true; inp.pressed[code] = true; }
    if (GAME.onKeyDown) GAME.onKeyDown(code);
  }
  function keyUp(code) { GAME.input.keys[code] = false; }
  // what button b means right now
  function codeFor(b, menu) {
    var dialog = GAME.hud && GAME.hud.dialogOpen && GAME.hud.dialogOpen();
    if (dialog || open) return MENU[b] || null;
    if (GAME.mapOpen) return MAP[b] || null;
    if (menu) return MENU[b] || null;
    // WASTED / BUSTED: A carries on, as R does (player.js)
    var P = GAME.player;
    if (b === 0 && P && P.state !== 'alive') return 'KeyR';
    return BUTTONS[b] || null;
  }
  function poll(dt) {
    var list = navigator.getGamepads ? navigator.getGamepads() : null, g = null;
    if (list) for (var i = 0; i < list.length; i++) if (list[i] && list[i].connected) { g = list[i]; break; }
    if (!g) {
      if (pad.on) release();
      return;
    }
    if (!pad.on) {
      pad.on = true;
      if (!toldPad && GAME.started) { toldPad = true; GAME.hud.message('Controller connected — sticks to move and look, RT/LT throttle and brake (fire and aim on foot), A jump, Y vehicle, Start pause.', 6); }
    }
    var ax = g.axes || [], bt = g.buttons || [];
    pad.lx = axis(ax[0] || 0); pad.ly = axis(ax[1] || 0);
    pad.rx = axis(ax[2] || 0); pad.ry = axis(ax[3] || 0);
    pad.lt = bt[6] ? bt[6].value : 0; pad.rt = bt[7] ? bt[7].value : 0;
    var inp = GAME.input, P = GAME.player;
    // an in-world dialog (the hud's modal) is a menu too: A answers it
    var dialog = !!(GAME.hud && GAME.hud.dialogOpen && GAME.hud.dialogOpen());
    var menu = dialog || open || GAME.paused || GAME.mapOpen || GAME.shopOpen || GAME.shareOpen || GAME.lolaOpen || !GAME.started;
    var touched = pad.lx || pad.ly || pad.rx || pad.ry || pad.lt > 0.2 || pad.rt > 0.2;
    for (var bi = 0; bi < bt.length && !touched; bi++) if (bt[bi] && bt[bi].pressed) touched = true;
    if (touched) noteDevice(true);
    // the right stick turns the camera at a rate, as the mouse does in pixels
    if (!menu) {
      inp.mouseDX += pad.rx * 900 * dt;
      inp.mouseDY += pad.ry * 600 * dt;
    }
    // on the map the left stick moves its cursor (which pans a zoomed map)
    if (GAME.mapOpen && !dialog && !open && GAME.hud.mapPad) GAME.hud.mapPad(dt, pad.lx, pad.ly);
    // triggers on foot: fire and aim. In the TALON the triggers fly it, so
    // its chin gun is RB and its rockets LB (in a helicopter the bumpers
    // have nothing else to do); they read only the mouse buttons and touch,
    // and on a pad the gunship had no guns.
    var onFoot = !(P && P.inCar);
    var gunship = !onFoot && !menu && P.car && P.car.spec.gunship;
    var fire = !menu && (onFoot ? pad.rt > 0.5 : !!(gunship && bt[5] && bt[5].pressed));
    var aim = !menu && (onFoot ? pad.lt > 0.5 : !!(gunship && bt[4] && bt[4].pressed));
    if (fire && !fireHeld) { inp.lmb = true; inp.lmbPressed = true; }
    if (!fire && fireHeld) inp.lmb = false;
    if (aim !== aimHeld) inp.rmb = aim;
    fireHeld = fire; aimHeld = aim;
    for (var b = 0; b < bt.length; b++) {
      var down = !!(bt[b] && bt[b].pressed), was = !!held[b];
      if (down === was) continue;
      held[b] = down;
      if (!down) {
        if (sent[b]) keyUp(sent[b]);
        sent[b] = null;
        continue;
      }
      if (!menu && b === 13) inp.touch.weaponCycle = true;   // d-pad down: next weapon
      var code = codeFor(b, menu);
      sent[b] = code;
      if (code) keyDown(code);
    }
  }
  function release() {
    pad.on = false;
    pad.lx = pad.ly = pad.rx = pad.ry = pad.lt = pad.rt = 0;
    for (var b in sent) if (sent[b]) keyUp(sent[b]);
    held = {}; sent = {};
    noteDevice(false);
    if (fireHeld) GAME.input.lmb = false;
    if (aimHeld) GAME.input.rmb = false;
    fireHeld = aimHeld = false;
  }

  // ---------- the CONTROLS screen ----------
  var waiting = null;   // the action waiting for its new key
  function $(id) { return document.getElementById(id); }
  function render() {
    var box = $('controls-list');
    if (!box) return;
    box.innerHTML = ACTIONS.map(function (a) {
      var w = waiting === a[0];
      return '<div class="crow"><span>' + a[1] + '</span><span class="mbtn ckey' + (w ? ' wait' : '') + '" data-a="' + a[0] + '">' +
        (w ? 'press a key…' : keyLabel(a[0])) + '</span></div>';
    }).join('');
    Array.prototype.forEach.call(box.querySelectorAll('.ckey'), function (el) {
      el.addEventListener('click', function (e) { e.stopPropagation(); waiting = el.getAttribute('data-a'); render(); });
    });
    $('ctl-sens').textContent = 'MOUSE: ' + sens.toFixed(2) + '×';
    $('ctl-invert').textContent = 'INVERT Y: ' + (invertY ? 'ON' : 'OFF');
    $('ctl-fov').textContent = 'FIELD OF VIEW: ' + fov + '°';
    $('ctl-pad').textContent = pad.on ? '🎮 Controller connected — ' + PAD_LAYOUT
      : '🎮 Plug in a controller and press a button — it works straight away';
    paintSel();
  }
  // the whole pad, said once where the keys are listed (it is not rebindable)
  var PAD_LAYOUT = 'left stick move · right stick look · RT fire / throttle · LT aim / brake · A jump, handbrake · ' +
    'B sprint · X job · Y get in / out · LB / RB target, drive-by · L3 photo · R3 horn · D-pad ↑ retry, ↓ weapon, ← → radio · ' +
    'BACK map · START pause (Lola, abandon, full screen and the rest are there).';
  // The screen's own buttons, for the arrows and a pad's D-pad: a pad could
  // open this screen and not change a thing on it — invert-Y and the look
  // speed (the right stick turns at it too) were out of reach.
  var OPTS = ['ctl-sens', 'ctl-invert', 'ctl-fov', 'ctl-reset', 'ctl-close'], optSel = -1, ACT = {};
  function paintSel() {
    OPTS.forEach(function (id, i) { var el = $(id); if (el) el.classList.toggle('kfocus', i === optSel); });
  }
  function step(list, v, dir) {
    var i = list.indexOf(v);
    if (i < 0) i = 0;
    return list[(i + dir + list.length) % list.length];
  }
  var open = false;
  function show(on) {
    open = on;
    waiting = null;
    optSel = on && usingPad() ? 0 : -1;
    var el = $('controls-screen');
    if (el) el.style.display = on ? 'flex' : 'none';
    if (on) render();
  }
  // a key pressed while the screen is open: the one being rebound takes it
  function key(code) {
    if (!open) return false;
    if (waiting) {
      if (code !== 'Escape') bind(waiting, code);
      waiting = null;
      render();
      return true;
    }
    if (code === 'Escape') { show(false); return true; }
    if (code === 'ArrowDown' || code === 'ArrowRight') { optSel = (optSel + 1) % OPTS.length; paintSel(); }
    else if (code === 'ArrowUp' || code === 'ArrowLeft') { optSel = optSel <= 0 ? OPTS.length - 1 : optSel - 1; paintSel(); }
    else if ((code === 'Enter' || code === 'Space') && optSel >= 0) {
      var id = OPTS[optSel];
      ACT[id]();
      if (open) render();
    }
    return true;   // the screen owns the keyboard while it is up
  }
  function init() {
    load();
    var wire = function (id, fn) {
      ACT[id] = fn;
      var el = $(id);
      if (!el) return;
      ['click', 'touchend'].forEach(function (ev) {
        el.addEventListener(ev, function (e) { e.preventDefault(); e.stopPropagation(); fn(); render(); });
      });
    };
    wire('ctl-sens', function () { sens = step(SENS_STEPS, sens, 1); save(); });
    wire('ctl-invert', function () { invertY = !invertY; save(); });
    wire('ctl-fov', function () { fov = step(FOV_STEPS, fov, 1); applyFov(); save(); });
    wire('ctl-reset', function () { reset(); sens = 1; invertY = false; fov = 62; applyFov(); save(); });
    wire('ctl-close', function () { show(false); });
    window.addEventListener('gamepadconnected', function () { toldPad = false; });
  }

  return {
    ACTIONS: ACTIONS,
    map: map, bind: bind, reset: reset, label: label, keyLabel: keyLabel, padName: padName, init: init,
    show: show, key: key, poll: poll,
    usingPad: usingPad, noteDevice: noteDevice,
    get open() { return open; },
    get sens() { return sens; },
    get invertY() { return invertY; },
    get fov() { return fov; },
    setSens: function (v) { sens = v; save(); },
    setInvertY: function (v) { invertY = !!v; save(); },
    setFov: function (v) { fov = v; applyFov(); save(); },
    pad: pad
  };
})();
GAME.pad = GAME.controls.pad;
