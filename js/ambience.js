// The world going on around you, kept quiet. Without it a walk down the
// strip was silent: no traffic, nobody about, not even your own feet, and a
// swim made no sound at all. Everything here sits under the effects and the
// radio, on its own bus (audio.js amb), and follows what is actually near
// you rather than playing a tape:
//   - a city bed, a low distant roar that rises with the traffic around you,
//     drops at night and on Isla Verde, and is muffled indoors and in a car;
//   - the nearest few cars going by, each a voice of its own that pans with
//     the car and dips in pitch as it passes;
//   - a murmur when there are people about, by how many;
//   - your own footsteps, by what you are walking on (road, sand, planks,
//     grass), and your strokes and splashes when you swim;
//   - the surf, from the direction of the nearest water, swelling slowly;
//   - now and then a gull by the sea in the day, and crickets on the
//     island at night.
// The tick stops behind an overlay, so silence() is called from there
// (main.js syncOverlayMusic); the next tick brings it all back.
GAME.ambience = (function () {
  var V = null;            // the held voices, made the first time they are needed
  var levelT = 0, scanT = 0, gullT = 9, lapT = 0;
  var stepIdx = null, strokeIdx = null;
  var water = { d: 999, x: 0, z: 0 };
  var gullAt;              // when the last gull called (game time)
  var last = {};           // what the levels were last set to, for the tests

  // ---- the held voices ----
  function loopOf(buf) {
    var ctx = GAME.audio.ctx;
    var s = ctx.createBufferSource(); s.buffer = buf; s.loop = true;
    s.start(0, Math.random() * buf.duration);
    return s;
  }
  function filt(type, f, q) {
    var b = GAME.audio.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f;
    if (q !== undefined) b.Q.value = q;
    return b;
  }
  function gain(v) { var g = GAME.audio.ctx.createGain(); g.gain.value = v; return g; }
  function lfo(freq, depth, into, type) {
    var o = GAME.audio.ctx.createOscillator(); o.type = type || 'sine'; o.frequency.value = freq;
    var d = gain(depth); o.connect(d); d.connect(into); o.start();
    return o;
  }
  function panner() {
    var ctx = GAME.audio.ctx;
    return ctx.createStereoPanner ? ctx.createStereoPanner() : gain(1);
  }

  function build() {
    var A = GAME.audio.amb, ctx = GAME.audio.ctx;
    if (!ctx || !A.bus) return null;
    var v = {};
    // city: the low roar, and a little road hiss over it
    v.cityTone = filt('lowpass', 320, 0.5);
    v.city = gain(0);
    loopOf(A.brown).connect(v.cityTone); v.cityTone.connect(v.city);
    var hiss = filt('bandpass', 1100, 0.6), hissG = gain(0.05);
    loopOf(A.white).connect(hiss); hiss.connect(hissG); hissG.connect(v.cityTone);
    v.city.connect(A.bus);
    // people: two voice bands, the level wandering at the pace of talk
    v.crowd = gain(0);
    var talk = gain(0.55);
    lfo(3.1, 0.22, talk.gain); lfo(4.7, 0.16, talk.gain); lfo(0.37, 0.12, talk.gain);
    var b1 = filt('bandpass', 520, 1.1), b2 = filt('bandpass', 1500, 2.2), b2g = gain(0.5);
    var src = loopOf(A.white);
    src.connect(b1); src.connect(b2); b2.connect(b2g);
    b1.connect(talk); b2g.connect(talk); talk.connect(v.crowd); v.crowd.connect(A.bus);
    // the sea: a slow swell, from where the water is
    v.surf = gain(0);
    v.surfPan = panner();
    var swell = gain(0.55);
    lfo(0.11, 0.3, swell.gain); lfo(0.067, 0.2, swell.gain);
    var surfLow = filt('lowpass', 750, 0.6);
    loopOf(A.brown).connect(surfLow); surfLow.connect(swell);
    var wash = filt('bandpass', 2400, 0.5), washG = gain(0.06);
    loopOf(A.white).connect(wash); wash.connect(washG); washG.connect(swell);
    swell.connect(v.surf); v.surf.connect(v.surfPan); v.surfPan.connect(A.bus);
    // crickets: a high note chopped into chirps, and the chirps into bursts
    v.crickets = gain(0);
    var cOsc = ctx.createOscillator(); cOsc.type = 'sine'; cOsc.frequency.value = 4300; cOsc.start();
    var chirp = gain(0.5), burst = gain(0.5);
    lfo(17, 0.5, chirp.gain, 'square'); lfo(0.8, 0.5, burst.gain, 'square');
    cOsc.connect(chirp); chirp.connect(burst); burst.connect(v.crickets); v.crickets.connect(A.bus);
    // cars going by: three voices, handed to the nearest moving traffic
    v.cars = [];
    for (var i = 0; i < 3; i++) {
      var c = { car: null, d: 0 };
      c.out = gain(0); c.pan = panner();
      c.tyreTone = filt('lowpass', 650, 0.7);
      c.tyre = gain(0.9);
      loopOf(A.brown).connect(c.tyreTone); c.tyreTone.connect(c.tyre); c.tyre.connect(c.out);
      c.eng = ctx.createOscillator(); c.eng.type = 'sawtooth'; c.eng.frequency.value = 55; c.eng.start();
      c.engTone = filt('lowpass', 380, 1.2);
      c.engG = gain(0.14);
      c.eng.connect(c.engTone); c.engTone.connect(c.engG); c.engG.connect(c.out);
      c.out.connect(c.pan); c.pan.connect(A.bus);
      v.cars.push(c);
    }
    return v;
  }

  function set(param, value, tc) {
    param.setTargetAtTime(value, GAME.audio.ctx.currentTime, tc || 0.25);
  }

  // ---- what is around you ----
  // Distance to the nearest sea, and where it is: sixteen bearings out to a
  // hundred and thirty metres, about the width of the beach and the strip. Twice a second is plenty for something that swells.
  var RADII = [6, 12, 20, 32, 48, 70, 100, 130];
  function scanWater(x, z) {
    var C = GAME.city, best = 999, bx = x, bz = z;
    for (var a = 0; a < 16; a++) {
      var ang = a / 16 * Math.PI * 2, sx = Math.sin(ang), cz = Math.cos(ang);
      for (var r = 0; r < RADII.length && RADII[r] < best; r++) {
        var px = x + sx * RADII[r], pz = z + cz * RADII[r];
        if (C.isOpenWater(px, pz)) { best = RADII[r]; bx = px; bz = pz; break; }
      }
    }
    water.d = best; water.x = bx; water.z = bz;
  }

  // what is underfoot, for the sound of a step
  function surfaceAt(x, z) {
    var C = GAME.city, P = GAME.player, I = C.isla;
    if (P.interior) return 'hard';
    if (C.isOnPier(x, z)) return 'wood';
    if (C.deckAt(x, z, P.pos.y) !== null) return 'hard';
    if (I && I.contains(x, z)) {
      if (I.onRoad(x, z, 1)) return 'hard';
      return I.inland(x, z) < 0.05 ? 'sand' : 'grass';
    }
    if (x >= 360 && x < 370 && Math.abs(z) < 470) return 'wood';   // the boardwalk
    if (C.isOnSand(x, z)) return 'sand';
    return 'hard';
  }

  function step(kind, hard) {
    var A = GAME.audio.amb, k = (0.85 + Math.random() * 0.3) * (hard ? 1.35 : 1), f = 0.9 + Math.random() * 0.2;
    if (kind === 'sand') { A.noise(0.11, 900 * f, 0.13 * k, 'lowpass'); return; }
    if (kind === 'grass') { A.noise(0.08, 2600 * f, 0.09 * k, 'bandpass'); A.noise(0.05, 500 * f, 0.07 * k, 'lowpass'); return; }
    if (kind === 'wood') { A.noise(0.06, 650 * f, 0.15 * k, 'bandpass'); A.tone(190 * f, 0.08, 0.11 * k, 'sine', 120); return; }
    A.noise(0.045, 1900 * f, 0.15 * k, 'bandpass'); A.tone(115 * f, 0.05, 0.09 * k, 'sine', 70);
  }
  function stroke(strong) {
    var A = GAME.audio.amb, k = (0.85 + Math.random() * 0.3) * (strong ? 1.25 : 1);
    A.noise(0.3, 1300 * (0.9 + Math.random() * 0.2), 0.15 * k, 'lowpass');
    A.noise(0.12, 3200, 0.05 * k, 'bandpass');
  }
  function lap() {
    GAME.audio.amb.noise(0.6, 480 + Math.random() * 120, 0.07, 'lowpass');
  }
  function gull(x, z) {
    var A = GAME.audio.amb, ctx = GAME.audio.ctx, t = ctx.currentTime;
    var bus = A.at(x, z, 1.6), n = 1 + Math.floor(Math.random() * 3), f = 1250 + Math.random() * 350;
    for (var i = 0; i < n; i++) {
      A.tone(f, 0.22, 0.016, 'sawtooth', f * 0.62, t + i * 0.3, bus);
      A.tone(f * 2, 0.18, 0.006, 'triangle', f * 1.3, t + i * 0.3, bus);
    }
  }

  // the cars to voice: moving, near, and not your own; the nearest three,
  // each kept on the voice it already has so nobody jumps across the stereo
  function pickCars(fx, fz) {
    var P = GAME.player, list = [];
    GAME.world.cars.forEach(function (c) {
      if (c.dead || c === P.car || c.spec.heli || c.spec.plane || c.spec.boat) return;
      var sp = Math.abs(c.speed || 0);
      if (sp < 1.5) return;
      var d = Math.hypot(c.pos.x - fx, c.pos.z - fz);
      if (d > 55) return;
      list.push({ car: c, d: d, score: d - sp * 0.4 });
    });
    list.sort(function (a, b) { return a.score - b.score; });
    return list.slice(0, 3);
  }

  function silence() {
    if (!V) return;
    var t = GAME.audio.ctx.currentTime;
    [V.city, V.crowd, V.surf, V.crickets].forEach(function (g) { g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0, t, 0.05); });
    V.cars.forEach(function (c) { c.out.gain.cancelScheduledValues(t); c.out.gain.setTargetAtTime(0, t, 0.05); c.car = null; });
    last = { silent: true };
  }

  function tick(dt) {
    var au = GAME.audio;
    if (!au.ctx || !au.amb.bus) return;
    if (!V) V = build();
    if (!V) return;
    var P = GAME.player, C = GAME.city;
    var alive = P.state === 'alive';
    var car = P.inCar && P.car ? P.car : null;
    var room = !!P.interior;
    var f = GAME.focus(), fx = f.x, fz = f.z;

    // ---- one-shots, every tick: they have to land on the beat ----
    var onFoot = alive && !car && !P.swimming;
    if (onFoot && !P.airborne && P.moveSpeed > 0.7) {
      var si = Math.floor((P.walkPhase || 0) / Math.PI);
      if (stepIdx !== null && si !== stepIdx) step(surfaceAt(P.pos.x, P.pos.z), P.moveSpeed > 5);
      stepIdx = si;
    } else stepIdx = null;
    if (alive && P.swimming) {
      if (P.moveSpeed > 0.6) {
        var wi = Math.floor((P.swimPhase || 0) / Math.PI);
        if (strokeIdx !== null && wi !== strokeIdx) stroke(P.moveSpeed > 2);
        strokeIdx = wi;
      } else {
        strokeIdx = null;
        lapT -= dt;
        if (lapT <= 0) { lap(); lapT = 1.4 + Math.random() * 1.2; }
      }
    } else strokeIdx = null;

    // ---- the held levels, ten times a second ----
    levelT -= dt;
    if (levelT > 0) return;
    levelT = 0.1;
    scanT -= 0.1;
    if (scanT <= 0) { scanT = 0.5; if (room) water.d = 999; else if (P.swimming) water.d = 0; else scanWater(fx, fz); }

    var day = U.clamp(GAME.timeOfDay === undefined ? 1 : GAME.timeOfDay, 0, 1);
    var I = C.isla, onIsla = !!(I && I.contains(fx, fz));
    var rain = GAME.weather && GAME.weather.rain > 0 ? GAME.weather.rain : 0;
    // up in the air the street falls away
    var y = car ? car.pos.y : P.pos.y;
    var up = room ? 1 : U.clamp(1 - (y - 18) / 60, 0, 1);
    // a car's cabin muffles the outside; a bike has none
    var cabin = car && !car.spec.bike && !car.spec.boat ? 0.5 : 1;
    var hall = !room && GAME.interiors && GAME.interiors.sheltered && GAME.interiors.sheltered() ? 0.55 : 1;
    var alv = alive ? 1 : 0.4;

    // traffic around you, for the bed
    var moving = 0, people = 0;
    GAME.world.cars.forEach(function (c) {
      if (c.dead || c === car || Math.abs(c.speed || 0) < 1) return;
      var d = Math.hypot(c.pos.x - fx, c.pos.z - fz);
      if (d < 140) moving += d < 50 ? 1 : 0.5;
    });
    var px = room ? P.pos.x : fx, pz = room ? P.pos.z : fz;
    GAME.world.peds.forEach(function (p) {
      if (p.dead || p.gone) return;
      var d = Math.hypot(p.pos.x - px, p.pos.z - pz);
      if (d < 28) people += d < 12 ? 1 : 0.5;
    });
    var busy = U.clamp(moving / 8, 0, 1);

    var city = room ? 0.12 : (0.32 + 0.68 * busy) * (onIsla ? 0.55 : 1) * (0.72 + 0.28 * day) * up * cabin * hall;
    // one or two passers-by are footsteps, not a murmur: it starts at a few
    var crowd = U.clamp((people - 1.5) / 7, 0, 1);
    crowd = Math.pow(crowd, 0.8) * (room ? 1 : up * cabin * hall) * (rain ? 0.6 : 1);
    var near = room ? 0 : U.clamp(1 - water.d / 140, 0, 1);
    var surf = (P.swimming ? 0.75 : Math.pow(near, 1.3)) * up * cabin * hall;
    var night = U.clamp((0.35 - day) / 0.25, 0, 1);
    var crick = !room && onIsla && !car && !rain ? night * U.clamp((I.inland(fx, fz) - 0.08) / 0.2, 0, 1) * (1 - busy) : 0;

    set(V.city.gain, 0.055 * city * alv);
    set(V.cityTone.frequency, room ? 220 : car && cabin < 1 ? 240 : 320);
    set(V.crowd.gain, 0.16 * crowd * alv);
    set(V.surf.gain, 0.16 * surf * alv);
    if (V.surfPan.pan) set(V.surfPan.pan, P.swimming ? 0 : au.amb.pan(water.x, water.z) * 0.8, 0.3);
    set(V.crickets.gain, 0.006 * crick * alv);
    last = { city: +(0.055 * city * alv).toFixed(4), crowd: +(0.16 * crowd * alv).toFixed(4), surf: +(0.16 * surf * alv).toFixed(4),
      crickets: +(0.006 * crick * alv).toFixed(5), water: water.d, people: people, moving: moving, cars: [], gull: gullAt };

    // cars going by
    var picks = room ? [] : pickCars(fx, fz);
    var free = V.cars.filter(function (c) { return !picks.some(function (p) { return p.car === c.car; }); });
    picks.forEach(function (p) {
      if (V.cars.some(function (c) { return c.car === p.car; })) return;
      var c = free.shift(); if (!c) return;
      c.car = p.car; c.d = p.d;
    });
    V.cars.forEach(function (c) {
      var p = c.car && picks.filter(function (q) { return q.car === c.car; })[0];
      if (!p) { set(c.out.gain, 0, 0.15); c.car = null; return; }
      var sp = Math.abs(p.car.speed);
      var vr = (p.d - c.d) / 0.1;       // closing (negative) or opening (positive)
      c.d = p.d;
      var shift = U.clamp(1 - vr / 200, 0.88, 1.12);
      var fall = Math.pow(U.clamp(1 - p.d / 55, 0, 1), 2);
      var loud = U.clamp(sp / 22, 0.2, 1) * fall * up * cabin * hall * alv;
      set(c.out.gain, 0.2 * loud, 0.12);
      set(c.eng.frequency, (36 + sp * 2.3) * shift, 0.1);
      set(c.tyreTone.frequency, (380 + sp * 18) * shift, 0.1);
      var pan = au.amb.pan(p.car.pos.x, p.car.pos.z);
      if (c.pan.pan) set(c.pan.pan, pan, 0.08);
      last.cars.push({ g: +(0.2 * loud).toFixed(4), pan: +pan.toFixed(2), hz: Math.round((36 + sp * 2.3) * shift) });
    });

    // a gull, now and then, by the sea in the day
    gullT -= 0.1;
    if (gullT <= 0) {
      gullT = 12 + Math.random() * 22;
      if (!room && alive && day > 0.5 && !rain && water.d <= 100 && up > 0.5) {
        var ga = Math.random() * Math.PI * 2;
        gull(fx + Math.sin(ga) * 30, fz + Math.cos(ga) * 30);
        last.gull = gullAt = GAME.time;
      }
    }
  }

  return {
    tick: tick,
    silence: silence,
    get levels() { return last; },
    // headless hooks
    surfaceAt: surfaceAt,
    get voices() { return V; }
  };
})();
