// Weather, and what the time of day does besides the lighting.
//
// The sky only ever did one thing: get darker and lighter. Now spells of rain
// roll in and out — streaks round the camera, a lower, greyer fog, darker
// light, the odd fork of lightning with its thunder a beat behind, and roads
// that hold a car a little less well. The night and the rain also change who
// is about and how far anybody can see: fewer people on the pavement, fewer
// cars, and witnesses and police who need you closer before they notice.
//
// AUTO rolls the spells itself; CLEAR and RAIN pin it (the pause screen's
// WEATHER button, remembered with the other settings).
GAME.weather = (function () {
  var MODES = ['auto', 'clear', 'rain'];
  var mode = 'auto';
  var rain = 0, target = 0;          // how hard it is raining now, and heading for
  var spellT = 240;                  // seconds left of this spell; the first one is dry
  var flash = 0, boltT = 12, thunderT = -1, thunderGain = 0;
  var lastApplied = 0;
  var RAMP = 18;                     // seconds for a shower to set in or clear

  // ---------- the streaks ----------
  var N = 0, lines = null, posArr = null, drops = null;
  var BOX = 44, HALF = BOX / 2, H = 30, FALL = 26, LEN = 0.9, WIND_X = 2.2, WIND_Z = 0.8;
  function build(scene) {
    N = GAME.isTouch ? 500 : 1400;
    posArr = new Float32Array(N * 6);
    drops = new Float32Array(N * 3);
    for (var i = 0; i < N; i++) {
      drops[i * 3] = (Math.random() - 0.5) * BOX;
      drops[i * 3 + 1] = Math.random() * H;
      drops[i * 3 + 2] = (Math.random() - 0.5) * BOX;
    }
    var geo = new THREE.BufferGeometry();
    var attr = new THREE.BufferAttribute(posArr, 3);
    if (attr.setUsage) attr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', attr);
    lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
      color: 0xa9bedc, transparent: true, opacity: 0, depthWrite: false
    }));
    lines.frustumCulled = false;   // it is always round the camera
    lines.visible = false;
    scene.add(lines);
  }
  // drops live in a box that follows the camera; one that falls out of the
  // bottom comes back at the top, and the box wraps sideways as you move
  function stepDrops(dt) {
    var cam = GAME.cameraObj;
    if (!lines || !cam) return;
    // not indoors, nor under the showroom's roof
    var dry = GAME.interiors && GAME.interiors.sheltered ? GAME.interiors.sheltered() : !!GAME.player.interior;
    lines.visible = rain > 0.02 && !dry;
    if (!lines.visible) return;
    var cx = cam.position.x, cy = cam.position.y, cz = cam.position.z;
    var shown = Math.floor(N * Math.min(1, rain * 1.3) * (GAME.qualityCrowd ? Math.max(0.5, GAME.qualityCrowd()) : 1));
    var dy = FALL * dt;
    for (var i = 0; i < N; i++) {
      var k = i * 3;
      drops[k + 1] -= dy;
      if (drops[k + 1] < 0) {
        drops[k + 1] += H;
        drops[k] = (Math.random() - 0.5) * BOX;
        drops[k + 2] = (Math.random() - 0.5) * BOX;
      }
      // world position, wrapped into the box round the camera
      var x = drops[k] + cx, z = drops[k + 2] + cz;
      x = cx + ((((x - cx) + HALF) % BOX + BOX) % BOX - HALF);
      z = cz + ((((z - cz) + HALF) % BOX + BOX) % BOX - HALF);
      var y = cy - H * 0.45 + drops[k + 1];
      var p = i * 6;
      if (i >= shown) { posArr[p] = posArr[p + 3] = x; posArr[p + 1] = posArr[p + 4] = -1000; posArr[p + 2] = posArr[p + 5] = z; continue; }
      posArr[p] = x; posArr[p + 1] = y; posArr[p + 2] = z;
      posArr[p + 3] = x - WIND_X * LEN / FALL * 4; posArr[p + 4] = y + LEN; posArr[p + 5] = z - WIND_Z * LEN / FALL * 4;
    }
    lines.geometry.attributes.position.needsUpdate = true;
    lines.material.opacity = 0.42 * Math.min(1, rain * 1.2);
  }

  // ---------- the spells ----------
  function nextSpell() {
    if (target > 0) {                 // a shower ends: dry for a while
      target = 0;
      spellT = 180 + Math.random() * 240;
    } else if (Math.random() < 0.45) { // a dry spell ends in rain...
      target = 0.55 + Math.random() * 0.45;
      spellT = 90 + Math.random() * 150;
    } else {                          // ...or does not
      spellT = 120 + Math.random() * 180;
    }
  }

  function update(dt) {
    if (mode === 'auto') {
      spellT -= dt;
      if (spellT <= 0) nextSpell();
    } else target = mode === 'rain' ? 1 : 0;
    var was = rain;
    rain += U.clamp(target - rain, -dt / RAMP, dt / RAMP);
    // lightning in a proper downpour: a flash now, the thunder a beat later
    if (rain > 0.6) {
      boltT -= dt;
      if (boltT <= 0) {
        boltT = 9 + Math.random() * 22;
        flash = 1;
        var near = Math.random();
        thunderT = 0.25 + near * 2.2;
        thunderGain = 1 - near * 0.6;
      }
    }
    if (thunderT >= 0) {
      thunderT -= dt;
      if (thunderT < 0 && GAME.audio.thunder) GAME.audio.thunder(thunderGain);
    }
    flash *= Math.exp(-11 * dt);
    if (flash < 0.01) flash = 0;
    stepDrops(dt);
    // (muffled to a patter on the roof indoors)
    if (GAME.audio.rain) GAME.audio.rain(GAME.interiors && GAME.interiors.sheltered && GAME.interiors.sheltered() ? rain * 0.25 : rain);
    // the lighting reads rain and flash (main.js applyTimeOfDay); it is only
    // re-run by the clock in AUTO time, so run it here while either is live
    if (rain > 0 || flash > 0 || was !== rain || lastApplied > 0) {
      lastApplied = rain + flash;
      GAME.applyTimeOfDay(GAME.timeOfDay);
    }
  }

  // Hours going by at once — a night's sleep. The spells run their course
  // over them and you wake to whatever the sky has come round to, all at
  // once rather than on the eighteen-second ramp. A sleep used to leave the
  // weather exactly as it was: two nights in a row, the same shower. (A
  // pinned CLEAR or RAIN stays pinned; that is a setting, not the sky.)
  function pass(sec) {
    if (mode === 'auto') {
      while (sec > 0) {
        if (spellT <= 0) nextSpell();
        var step = Math.min(sec, spellT);
        spellT -= step; sec -= step;
      }
      if (spellT <= 0) nextSpell();
    } else target = mode === 'rain' ? 1 : 0;
    rain = target; flash = 0; thunderT = -1;
    lastApplied = 1;   // the next update re-lights the sky for it
  }

  function setMode(m, quiet) {
    if (MODES.indexOf(m) < 0) m = 'auto';
    mode = m;
    if (m === 'auto') { target = 0; spellT = 120 + Math.random() * 120; }
    if (!quiet && GAME.prefs) { GAME.prefs.weather = m; GAME.save(); }
    return m;
  }

  var night = function () { return 1 - (GAME.timeOfDay === undefined ? 1 : GAME.timeOfDay); };
  return {
    build: build,
    update: update,
    setMode: setMode,
    pass: pass,
    cycle: function () { return setMode(MODES[(MODES.indexOf(mode) + 1) % MODES.length]); },
    get mode() { return mode; },
    get rain() { return rain; },
    get flash() { return flash; },
    // wet roads: a car holds the road a little less well
    grip: function () { return 1 - 0.18 * rain; },
    // how far somebody notices what you do: shorter at night and in rain
    visibility: function () { return (1 - 0.35 * night()) * (1 - 0.25 * rain); },
    // who is about: fewer on foot at night and fewer still in the rain
    crowd: function () { return (1 - 0.3 * night()) * (1 - 0.4 * rain); },
    traffic: function () { return 1 - 0.25 * night(); },
    // headless: set it raining (or not) right now, with no ramp
    testSet: function (v) { rain = target = v; flash = 0; }
  };
})();
