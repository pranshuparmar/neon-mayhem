GAME.audio = (function () {
  var ctx = null, master, sfxBus, radioBus, engineBus, verb;
  var sfxSwitch = null, musicSwitch = null;
  var muted = false, musicOn = true, sfxOn = true;
  var noiseBuf = null;
  var engine = null, skidNode = null, sirenNode = null, rotorNode = null;
  var lastCrashT = -9, lastCrashV = 0;

  function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }

  function makeNoiseBuffer() {
    var len = ctx.sampleRate * 1.5;
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }
  function makeImpulse(seconds, decay) {
    var len = ctx.sampleRate * seconds;
    var buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  function init() {
    if (ctx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    // master chain: buses -> limiter -> out. The limiter stops layered SFX
    // (explosions over sirens over the radio) from clipping into a buzz.
    var limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -10;
    limiter.knee.value = 6;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.004;
    limiter.release.value = 0.18;
    limiter.connect(ctx.destination);
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(limiter);
    // two switches under the master, so the music and everything else can be
    // turned off on their own: the radio is one side, every effect the other
    musicSwitch = ctx.createGain(); musicSwitch.gain.value = musicOn ? 1 : 0; musicSwitch.connect(master);
    sfxSwitch = ctx.createGain(); sfxSwitch.gain.value = sfxOn ? 1 : 0; sfxSwitch.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.72; sfxBus.connect(sfxSwitch);
    radioBus = ctx.createGain(); radioBus.gain.value = 0; radioBus.connect(musicSwitch);
    // the engine sits under everything else and is gently rolled off up top so
    // it doesn't mask the radio
    engineBus = ctx.createGain(); engineBus.gain.value = 0;
    var engTone = ctx.createBiquadFilter(); engTone.type = 'lowpass'; engTone.frequency.value = 900;
    engineBus.connect(engTone); engTone.connect(sfxSwitch);
    noiseBuf = makeNoiseBuffer();
    verb = ctx.createConvolver(); verb.buffer = makeImpulse(1.8, 3.2);
    var verbGain = ctx.createGain(); verbGain.gain.value = 0.35;
    verb.connect(verbGain); verbGain.connect(radioBus);
    initEngine();
    initRotor();
    initSkid();
    initSiren();
    radio.start();
  }

  // ---------- where the ears are ----------
  // Position from the player, heading from the camera. The game already
  // measures every distance from the player, and a third-person camera
  // orbits its subject — so taking the origin from one and the facing from
  // the other is what keeps a siren behind you sounding behind you while the
  // camera swings around.
  var lisX = 0, lisZ = 0, lisSin = 0, lisCos = 1;
  function setListener(x, z, yaw) {
    lisX = x; lisZ = z;
    lisSin = Math.sin(yaw); lisCos = Math.cos(yaw);
  }

  // Screen-relative pan for a world point: the direction to it projected
  // onto the camera's right vector. Forward is (sin yaw, cos yaw) — the
  // basis updateOnFoot turns WASD through, and the one updateCamera aims
  // lookAt down — so right is cross(forward, up) = (-cos yaw, sin yaw).
  //
  // Straight ahead and straight behind both land on centre, which two
  // speakers cannot tell apart anyway; the callers' own distance falloff
  // carries the rest. The cap keeps a little of every sound in both ears,
  // because a voice pinned entirely to one is a headphone artifact rather
  // than a direction.
  function panAt(x, z) {
    var dx = x - lisX, dz = z - lisZ;
    var d = Math.sqrt(dx * dx + dz * dz);
    if (d < 0.5) return 0;   // on top of the listener: centred, and no jitter
    return U.clamp((dx * -lisCos + dz * lisSin) / d * 0.85, -1, 1);
  }

  // A one-shot somewhere in the world: its voices are routed through a panner
  // of their own, which lets go once they have all finished. `life` is the
  // longest of them, and the only reason this has to be told — the voices
  // disconnect themselves on ended, but the panner between them and the bus
  // has no callback to hang that on, and a graph that only grows crackles.
  // No position (a UI buzz, your own fists) or no StereoPanner in this
  // browser: straight to the bus, centred, exactly as before.
  function spatialBus(x, z, life) {
    if (x === undefined || x === null || !ctx.createStereoPanner) return sfxBus;
    var p = ctx.createStereoPanner();
    p.pan.value = panAt(x, z);
    p.connect(sfxBus);
    setTimeout(function () { try { p.disconnect(); } catch (e) { } }, (life + 0.3) * 1000);
    return p;
  }

  function noiseBurst(dur, filterFreq, gain, type, when, bus) {
    if (!ctx) return;
    var t = when || ctx.currentTime;
    var src = ctx.createBufferSource(); src.buffer = noiseBuf;
    var f = ctx.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = filterFreq;
    var g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(bus || sfxBus);
    src.start(t); src.stop(t + dur + 0.05);
    // drop the nodes out of the graph as soon as they've played; a busy scene
    // makes a lot of these and a graph that only grows starts to crackle
    src.onended = function () { try { src.disconnect(); f.disconnect(); g.disconnect(); } catch (e) { } };
  }
  function tone(freq, dur, gain, type, slideTo, when, bus) {
    if (!ctx) return;
    var t = when || ctx.currentTime;
    var o = ctx.createOscillator(); o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    var g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(bus || sfxBus);
    o.start(t); o.stop(t + dur + 0.05);
    o.onended = function () { try { o.disconnect(); g.disconnect(); } catch (e) { } };
  }

  // continuous engine voice, pitch driven by speed
  function initEngine() {
    var o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 55;
    var o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = 27;
    var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 380; f.Q.value = 2;
    var g = ctx.createGain(); g.gain.value = 0.5;
    o.connect(f); o2.connect(f); f.connect(g); g.connect(engineBus);
    o.start(); o2.start();
    engine = { o: o, o2: o2, f: f };
  }
  // Rotor voice for aircraft. A helicopter is blade slap — filtered noise
  // chopped by a low oscillator — over a turbine whine, which is nothing like
  // the piston drone a car runs on. A plane uses the same parts with the chop
  // run up to propeller speed and the whine pushed higher.
  function initRotor() {
    var src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 260; f.Q.value = 0.9;
    var chopG = ctx.createGain(); chopG.gain.value = 0.35;      // depth of the slap
    var lfo = ctx.createOscillator(); lfo.type = 'sawtooth'; lfo.frequency.value = 13;
    var lfoG = ctx.createGain(); lfoG.gain.value = 0.5;
    lfo.connect(lfoG); lfoG.connect(chopG.gain);
    src.connect(f); f.connect(chopG);
    var whine = ctx.createOscillator(); whine.type = 'triangle'; whine.frequency.value = 620;
    var whineG = ctx.createGain(); whineG.gain.value = 0.035;
    whine.connect(whineG);
    var g = ctx.createGain(); g.gain.value = 0;
    chopG.connect(g); whineG.connect(g); g.connect(sfxSwitch);
    src.start(); lfo.start(); whine.start();
    rotorNode = { g: g, f: f, lfo: lfo, whine: whine };
  }
  function initSkid() {
    var src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    var f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 1.2;
    var g = ctx.createGain(); g.gain.value = 0;
    src.connect(f); f.connect(g); g.connect(sfxBus);
    src.start();
    skidNode = { g: g, f: f };
  }
  function initSiren() {
    var o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 700;
    var lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.8;
    var lfoG = ctx.createGain(); lfoG.gain.value = 260;
    lfo.connect(lfoG); lfoG.connect(o.frequency);
    // roll off the top so the wail reads as distant rather than piercing
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
    var g = ctx.createGain(); g.gain.value = 0;
    o.connect(lp); lp.connect(g);
    // the one continuous voice that belongs to somebody else, so the one
    // that keeps a panner rather than borrowing one per shot
    var pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pan) { g.connect(pan); pan.connect(sfxBus); } else g.connect(sfxBus);
    o.start(); lfo.start();
    sirenNode = { g: g, o: o, pan: pan };
  }

  // ---------- generative radio ----------
  var radio = (function () {
    var current = 0, playing = false, timer = null;
    var nextTime = 0, step = 0;
    // what setVolume last asked the bus for, and when its fade down to that
    // is inaudible — the 0.3 s time constant is under -60 dB after 2 s
    var volume = 0, fadeEnd = 0;
    var stations = [
      {
        name: 'WAVE 84', bpm: 104,
        chords: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]],
        bass: [45, 41, 43, 40],
        play: function (t, st, bar, chord, bass) {
          var spb = 60 / this.bpm / 4;
          if (st % 4 === 0) { tone(52, 0.14, 0.85, 'sine', 30, t, radioBus); noiseBurst(0.03, 3000, 0.12, 'highpass', t, radioBus); }
          if (st % 8 === 4) noiseBurst(0.14, 1800, 0.35, 'bandpass', t, radioBus);
          if (st % 2 === 1) noiseBurst(0.03, 8000, 0.09, 'highpass', t, radioBus);
          tone(midi(bass + 12 * (st % 2)), spb * 0.9, 0.22, 'sawtooth', 0, t, radioBus);
          var arpN = chord[st % chord.length] + 12 * (1 + ((st >> 2) % 2));
          // straight into the reverb like every other verb-bound voice — a
          // per-note unity wrapper here outlived tone()'s onended cleanup,
          // leaking one GainNode into the bus per arp note (~7 a second)
          tone(midi(arpN), spb * 1.6, 0.13, 'sawtooth', 0, t, verb);
          if (st % 16 === 0) for (var i = 0; i < chord.length; i++) tone(midi(chord[i]), spb * 14, 0.05, 'sawtooth', 0, t, verb);
        }
      },
      {
        name: 'RIVIERA FM', bpm: 121,
        chords: [[60, 64, 67], [57, 60, 64], [62, 65, 69], [55, 59, 62]],
        bass: [48, 45, 50, 43],
        mel: [72, 74, 76, 79, 81, 76, 74, 72],
        play: function (t, st, bar, chord, bass) {
          var spb = 60 / this.bpm / 4;
          if (st % 4 === 0) { tone(55, 0.13, 0.9, 'sine', 32, t, radioBus); }
          if (st % 4 === 2) noiseBurst(0.04, 9000, 0.13, 'highpass', t, radioBus);
          if (st % 8 === 4) noiseBurst(0.12, 2200, 0.32, 'bandpass', t, radioBus);
          tone(midi(bass + (st % 4 === 3 ? 12 : 0)), spb * 0.85, 0.24, 'square', 0, t, radioBus);
          if (st % 2 === 0) {
            var m = this.mel[(st / 2 + bar * 3) % this.mel.length];
            tone(midi(m), spb * 1.8, 0.11, 'square', 0, t, verb);
          }
          if (st % 8 === 0) for (var i = 0; i < chord.length; i++) tone(midi(chord[i] + 12), spb * 3, 0.06, 'triangle', 0, t, radioBus);
        }
      },
      {
        name: 'NIGHTFALL', bpm: 80,
        chords: [[57, 60, 64, 67], [55, 59, 62, 65], [53, 57, 60, 64], [52, 55, 59, 62]],
        bass: [45, 43, 41, 40],
        play: function (t, st, bar, chord, bass) {
          var spb = 60 / this.bpm / 4;
          if (st % 8 === 0) tone(50, 0.2, 0.5, 'sine', 34, t, radioBus);
          if (st % 16 === 8) noiseBurst(0.08, 1500, 0.16, 'bandpass', t, radioBus);
          if (st % 4 === 2) noiseBurst(0.03, 9000, 0.05, 'highpass', t, radioBus);
          if (st % 8 === 0) tone(midi(bass), spb * 7, 0.2, 'sine', 0, t, radioBus);
          if (st % 16 === 0) for (var i = 0; i < chord.length; i++) tone(midi(chord[i] + 12), spb * 15, 0.045, 'triangle', 0, t, verb);
          if (st % 4 === 0 && (st >> 2) % 3 !== 2) {
            tone(midi(chord[(st >> 2) % chord.length] + 24), spb * 3.4, 0.06, 'sine', 0, t, verb);
          }
        }
      }
    ];
    // On foot, with MUSIC: OFF or muted, the radio is a clock with nothing on
    // the end of it — but a clock that built its ~60 voices a second anyway.
    // A step nobody can hear is still counted, so the beat is where it would
    // have been when the radio comes back, rather than restarting the bar.
    function schedule() {
      if (!ctx || !playing || ctx.state !== 'running') return;
      var s = stations[current];
      var spb = 60 / s.bpm / 4;
      var on = musicOn && !muted;
      while (nextTime < ctx.currentTime + 0.25) {
        if (on && (volume > 0 || nextTime < fadeEnd)) {
          var bar = Math.floor(step / 16);
          var ci = bar % s.chords.length;
          s.play(nextTime, step % 64, bar, s.chords[ci], s.bass[ci]);
        }
        nextTime += spb;
        step++;
      }
    }
    return {
      stations: stations,
      get name() { return stations[current].name; },
      start: function () {
        if (playing || !ctx) return;
        playing = true;
        nextTime = ctx.currentTime + 0.1; step = 0;
        timer = setInterval(schedule, 90);
      },
      switchStation: function (dir) {
        current = (current + dir + stations.length) % stations.length;
        step = 0;
        if (ctx) nextTime = ctx.currentTime + 0.08;
        return stations[current].name;
      },
      // tune to a random station — the dial isn't always left where you found it
      randomStation: function () {
        current = Math.floor(Math.random() * stations.length) % stations.length;
        step = 0;
        if (ctx) nextTime = ctx.currentTime + 0.08;
        return stations[current].name;
      },
      setVolume: function (v) {
        if (!ctx) return;
        // keep playing into the fade rather than cutting it off short
        if (v <= 0 && volume > 0) fadeEnd = ctx.currentTime + 2;
        volume = v;
        radioBus.gain.setTargetAtTime(v, ctx.currentTime, 0.3);
      }
    };
  })();

  // ---------- title pads ----------
  // Slow, warm chords under the attract mode: two detuned sines per note with
  // a long swell in and out, nothing percussive. It runs through the music
  // switch, and the moment the game starts it fades away under the radio.
  var title = (function () {
    var gain = null, timer = null, step = 0, nextT = 0;
    var CHORDS = [[57, 60, 64, 71], [53, 57, 60, 69], [48, 55, 60, 67], [55, 59, 62, 67]];
    function pad(freq, dur, amp, when) {
      [0, 1.7].forEach(function (detune) {
        var o = ctx.createOscillator(); o.type = 'sine';
        o.frequency.value = freq + detune;
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, when);
        g.gain.linearRampToValueAtTime(amp, when + dur * 0.35);
        g.gain.setValueAtTime(amp, when + dur * 0.6);
        g.gain.linearRampToValueAtTime(0.0001, when + dur);
        o.connect(g); g.connect(gain);
        o.start(when); o.stop(when + dur + 0.1);
        o.onended = function () { try { o.disconnect(); g.disconnect(); } catch (e) { } };
      });
    }
    function schedule() {
      while (nextT < ctx.currentTime + 1.2) {
        var chord = CHORDS[step % CHORDS.length];
        for (var i = 0; i < chord.length; i++) {
          pad(midi(chord[i]), 6.4, 0.028 - i * 0.004, nextT + i * 0.12);
        }
        // a high, quiet answer note halfway through every other bar
        if (step % 2 === 1) pad(midi(chord[1] + 24), 3.2, 0.008, nextT + 2.6);
        nextT += 5.2;
        step++;
      }
    }
    return {
      start: function () {
        if (!ctx || timer) return;
        if (!gain) { gain = ctx.createGain(); gain.connect(musicSwitch); }
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 2.0);
        nextT = ctx.currentTime + 0.1; step = 0;
        schedule();
        timer = setInterval(schedule, 400);
      },
      stop: function () {
        if (timer) { clearInterval(timer); timer = null; }
        if (ctx && gain) gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.25);
      },
      get on() { return !!timer; }
    };
  })();

  return {
    get ctx() { return ctx; },
    init: init,
    setListener: setListener,
    // headless hook, so the stereo image can be sampled without ears
    testPan: panAt,
    radio: radio,
    titleMusic: function (on) { if (on) title.start(); else title.stop(); },
    get titleMusicOn() { return title.on; },
    // freeze all audio (pause / tab backgrounded); resume brings it back
    suspend: function () {
      if (ctx && ctx.state === 'running') { engineBus.gain.value = 0; try { ctx.suspend(); } catch (e) { } }
    },
    resume: function () {
      if (ctx && ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { } }
    },
    get muted() { return muted; },
    toggleMute: function () {
      muted = !muted;
      if (ctx) master.gain.setTargetAtTime(muted ? 0 : 0.8, ctx.currentTime, 0.05);
      return muted;
    },
    // music and effects each have their own tap, independent of the master
    get musicOn() { return musicOn; },
    get sfxOn() { return sfxOn; },
    setMusicOn: function (v) {
      musicOn = !!v;
      if (ctx && musicSwitch) musicSwitch.gain.setTargetAtTime(musicOn ? 1 : 0, ctx.currentTime, 0.05);
      return musicOn;
    },
    setSfxOn: function (v) {
      sfxOn = !!v;
      if (ctx && sfxSwitch) sfxSwitch.gain.setTargetAtTime(sfxOn ? 1 : 0, ctx.currentTime, 0.05);
      return sfxOn;
    },
    // `kind` picks the voice: 'heli' and 'plane' run the rotor, anything else
    // the piston engine. Only one is ever audible.
    engineState: function (on, speedNorm, kind) {
      if (!ctx) return;
      var t = ctx.currentTime;
      var sn = U.clamp(speedNorm || 0, 0, 1);
      var air = on && (kind === 'heli' || kind === 'plane');
      // idle sits well back; it only leans in as you wind the revs out, so the
      // radio stays audible while cruising
      engineBus.gain.setTargetAtTime(on && !air ? 0.024 + sn * 0.022 : 0, t, 0.12);
      if (on && !air) {
        var f = 45 + sn * 160;
        engine.o.frequency.setTargetAtTime(f, t, 0.08);
        engine.o2.frequency.setTargetAtTime(f * 0.5, t, 0.08);
        engine.f.frequency.setTargetAtTime(300 + sn * 1100, t, 0.1);
      }
      rotorNode.g.gain.setTargetAtTime(air ? 0.10 + sn * 0.06 : 0, t, 0.15);
      if (air) {
        var plane = kind === 'plane';
        rotorNode.lfo.frequency.setTargetAtTime((plane ? 34 : 11) + sn * (plane ? 20 : 7), t, 0.2);
        rotorNode.f.frequency.setTargetAtTime((plane ? 420 : 210) + sn * 220, t, 0.2);
        rotorNode.whine.frequency.setTargetAtTime((plane ? 300 : 560) + sn * 420, t, 0.2);
      }
    },
    skid: function (amount) {
      if (!ctx) return;
      skidNode.g.gain.setTargetAtTime(U.clamp(amount, 0, 1) * 0.16, ctx.currentTime, 0.05);
    },
    siren: function (vol, pitchShift, x, z) {
      if (!ctx) return;
      sirenNode.g.gain.setTargetAtTime(U.clamp(vol, 0, 1) * 0.1, ctx.currentTime, 0.15);
      sirenNode.o.frequency.setTargetAtTime(700 * (pitchShift || 1), ctx.currentTime, 0.2);
      // glide the pan instead of jumping it: a cruiser overtaking you crosses
      // from one side to the other in a frame or two, and a hard cut on the
      // frame it passes your nose reads as a glitch rather than a pass
      if (sirenNode.pan && x !== undefined) sirenNode.pan.pan.setTargetAtTime(panAt(x, z), ctx.currentTime, 0.08);
    },
    gunshot: function (type, x, z) {
      if (!ctx) return;
      var b = spatialBus(x, z, 0.35);
      if (type === 'pistol') { noiseBurst(0.12, 2500, 0.5, null, null, b); tone(160, 0.08, 0.4, 'square', 60, null, b); }
      else if (type === 'smg') { noiseBurst(0.07, 3200, 0.35, null, null, b); tone(220, 0.05, 0.3, 'square', 90, null, b); }
      else if (type === 'shotgun') { noiseBurst(0.3, 1200, 0.8, null, null, b); tone(90, 0.2, 0.6, 'square', 40, null, b); }
      else { tone(120, 0.07, 0.3, 'square', 70, null, b); }
    },
    ricochet: function () { if (ctx) tone(2400, 0.09, 0.12, 'sine', 700); },
    punch: function () { if (ctx) { noiseBurst(0.06, 500, 0.4); tone(90, 0.07, 0.4, 'sine', 45); } },
    explosion: function (x, z) {
      if (!ctx) return;
      var b = spatialBus(x, z, 1.15);
      noiseBurst(1.1, 900, 0.7, null, null, b);
      tone(110, 0.9, 0.55, 'sine', 28, null, b);
      noiseBurst(0.35, 4000, 0.2, 'highpass', null, b);
    },
    crash: function (v, x, z) {
      if (!ctx) return;
      // A pile-up reports contact from several pairs on every frame, and a car
      // wedged against a wall reports one for as long as it stays there. Without
      // a floor between voices those stack into a buzz that outlives the crash
      // that started it, so only the hardest hit in each window is heard.
      var now = ctx.currentTime;
      if (now - lastCrashT < 0.07) { if (v > lastCrashV) lastCrashV = v; return; }
      lastCrashT = now; lastCrashV = v;
      var a = U.clamp(v, 0.1, 1);
      var b = spatialBus(x, z, 0.3);
      noiseBurst(0.18 * a + 0.08, 1400, 0.5 * a, null, null, b);
      tone(140, 0.1, 0.3 * a, 'square', 50, null, b);
    },
    yelp: function (x, z) { if (ctx) tone(500 + Math.random() * 300, 0.18, 0.14, 'triangle', 900, null, spatialBus(x, z, 0.25)); },
    pickup: function () { if (ctx) { tone(880, 0.09, 0.2, 'sine'); tone(1320, 0.14, 0.2, 'sine', 0, ctx.currentTime + 0.08); } },
    // the ice cream chimes: a little run of bells, thin and carrying
    chime: function () {
      if (!ctx) return;
      var t = ctx.currentTime;
      var notes = [1046, 1318, 1568, 1318, 1046, 784];
      for (var i = 0; i < notes.length; i++) {
        tone(notes[i], 0.26, 0.075, 'triangle', 0, t + i * 0.19);
        tone(notes[i] * 2, 0.13, 0.028, 'sine', 0, t + i * 0.19);
      }
    },
    cashTick: function () { if (ctx) tone(1560, 0.04, 0.08, 'square'); },
    splash: function () { if (ctx) noiseBurst(0.5, 700, 0.4); },
    sting: function (kind) {
      if (!ctx) return;
      var t = ctx.currentTime;
      var notes = kind === 'busted' ? [64, 63, 62, 57] : kind === 'win' ? [60, 64, 67, 72] : [62, 58, 55, 50];
      for (var i = 0; i < notes.length; i++) {
        tone(midi(notes[i]), 0.55, 0.25, kind === 'win' ? 'triangle' : 'sawtooth', 0, t + i * 0.22, sfxBus);
        tone(midi(notes[i] - 12), 0.55, 0.2, 'sine', 0, t + i * 0.22, sfxBus);
      }
    }
  };
})();
