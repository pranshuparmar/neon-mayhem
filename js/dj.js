// The radio's personality. Every station on the dial is somewhere on it, a
// sound and a voice: a frequency, what it plays, a DJ, and a jingle of its
// own when you tune in. Every minute or so the songs dip and the DJ talks,
// or an ad comes on — 1986's finest — in a caption under the station's
// name and a voice that is all pitch and no words, the way the people in
// the story talk (cast.js). It is all on the music's side: MUSIC: OFF, the
// car door and mute take it with the songs.
GAME.dj = (function () {
  var enabled = true;
  // the stations, by the name audio.js gives them
  var ID = {
    'WAVE 84': { freq: '84.3 FM', genre: 'NEW WAVE & SYNTH-POP', dj: 'JOHNNY WAVE', color: '#38e8ff',
      jingle: [64, 67, 71, 76], wave: 'sawtooth',
      voice: { base: 180, wave: 'square', cps: 40, spread: 9, formant: 1300, q: 1.6 },
      lines: [
        'This is WAVE 84, the sound of tomorrow, today. Tomorrow is mostly hairspray.',
        'If your car doesn\'t have a cassette deck, I don\'t know what to tell you. Get a new car. Steal one, I don\'t care.',
        'Somebody called in to say synthesizers aren\'t real instruments. Somebody is wrong.',
        'Johnny Wave here, coming to you live from a booth with no windows and a lot of opinions.',
        'Traffic on the strip is backed up past the Malibu. Again. Maybe walk. Ha. Nobody walks.',
        'Fun fact: this next one was recorded entirely on a home computer. The future is weird, Costa Rosa.'
      ] },
    'RIVIERA FM': { freq: '96.1 FM', genre: 'DISCO, BOOGIE & POP', dj: 'COCO RIVIERA', color: '#ffe14f',
      jingle: [72, 76, 79, 84, 79], wave: 'triangle',
      voice: { base: 300, wave: 'triangle', cps: 38, spread: 8, formant: 1600, q: 1.7 },
      lines: [
        'Riviera FM, darlings! Put the top down, the volume up, and the cares in the glovebox.',
        'Disco isn\'t dead. Disco moved to Costa Rosa and bought a boat.',
        'Coco here with a message for the gentleman in the white suit: we see you, and we like it.',
        'Hot one today. Hot one tomorrow. It\'s always a hot one. That\'s why you live here.',
        'Dancing is just walking with a beat. So dance to the corner store, darling.',
        'If you can hear this you\'re not dancing hard enough.'
      ] },
    'NIGHTFALL': { freq: '101.9 FM', genre: 'SLOW JAMS & LATE NIGHTS', dj: 'VELVET DEE', color: '#c86bff',
      jingle: [57, 64, 67, 72], wave: 'sine',
      voice: { base: 140, wave: 'sine', cps: 26, spread: 5, formant: 900, q: 1.4 },
      lines: [
        'Nightfall. One-oh-one point nine. Lower the lights, lower your voice, lower your expectations.',
        'This one goes out to everybody driving alone tonight. You\'re not alone. I\'m here. In your dashboard.',
        'Velvet Dee, keeping you company until the sun comes up and ruins everything.',
        'They say love is a battlefield. In this town it\'s more of a car chase.',
        'Slow down, baby. The song is slow. The night is slow. The police are not.',
        'If somebody broke your heart, call the station. If somebody broke your windshield, call somebody else.'
      ] },
    'TAPE DECK FM': { freq: '88.8 PIRATE', genre: 'ITALO FROM THE PIER', dj: 'CAPTAIN CASSETTE', color: '#7dff6a',
      jingle: [69, 72, 76, 81, 76, 81], wave: 'square',
      voice: { base: 210, wave: 'sawtooth', cps: 44, spread: 11, formant: 1450, q: 1.5 },
      lines: [
        'Captain Cassette, back on the air off the end of the pier! They shut me down, you found my tapes. Respect.',
        'This broadcast is not licensed. This broadcast is not legal. This broadcast is GOOD.',
        'Every tape you picked up off the pavement is a song I made in a garage. Thank you, kid.',
        'If the coastguard asks, you never heard this station.',
        'Italo disco: it\'s like regular disco, but it drives faster and doesn\'t wear a seatbelt.'
      ] }
  };
  // the ads, on any station
  var ADS = [
    'Gull Downs: where every horse is a winner until the race starts. Gull Downs, at the Lucky Gull.',
    'Is your hair big enough? Is anybody\'s? Mousse Américaine. For hair that enters a room before you do.',
    'Vulture GT. Zero to sixty in "don\'t ask". Gran Rosa Motors, on the boulevard.',
    'Sunny Scoops ice cream: made on Isla Verde, frozen solid, totally legal. Sunny Scoops!',
    'Are you a victim of a crime? Lawyer Stan Pike gets results. Results not guaranteed. Stan is not a lawyer.',
    'Costa Rosa Savings & Loan. Your money is safe with us. We\'re very, very sure. Please stop asking.',
    'The new Pocket Phone — only nine pounds! Make calls from anywhere you can carry nine pounds.',
    'THREADS on Centro Alto: pastel is not a colour, it\'s a lifestyle. Linen jackets half off.'
  ];
  var talkT = 40, seg = null, caption = null, deal = {};

  function $(id) { return document.getElementById(id); }
  function idOf(name) { return ID[name] || null; }
  // where it is on the dial, under its name, as you tune in — and its jingle
  function tuned(name) {
    var id = idOf(name), box = $('radio-popup');
    if (box) {
      box.innerHTML = '';
      box.appendChild(document.createTextNode('♪ ' + name));
      if (id) {
        var sub = document.createElement('div');
        sub.className = 'rsub';
        sub.textContent = id.freq + '  ·  ' + id.genre;
        sub.style.color = id.color;
        box.appendChild(sub);
      }
    }
    stopTalk();
    talkT = 20 + Math.random() * 25;
    if (enabled && id && GAME.audio && GAME.audio.radio && GAME.audio.radio.jingle) GAME.audio.radio.jingle(id.jingle, id.wave);
  }
  // the next of a list, round it, never the same twice running
  function next(key, list) {
    var i = deal[key] === undefined ? Math.floor(Math.random() * list.length) : (deal[key] + 1) % list.length;
    deal[key] = i;
    return list[i];
  }
  // a minute or so on: the DJ, or an ad
  function segment() {
    var R = GAME.audio && GAME.audio.radio;
    if (!R || !R.audible) return null;
    var id = idOf(R.name);
    if (!id) return null;
    // (an ad is for cruising: never in the middle of a job, a race, a favour
    // or a heist — Gull Downs' horses came on in the middle of a first
    // delivery. The DJ can still say a word; the ads wait.)
    var ad = roaming() && Math.random() < 0.4;
    var text = ad ? next('ads', ADS) : next(R.name, id.lines);
    var who = ad ? 'AD' : id.dj;
    var dur = Math.min(9, 2.5 + text.length * 0.045);
    seg = { text: text, who: who, t: 0, dur: dur, i: 0, voice: ad ? ID['RIVIERA FM'].voice : id.voice, letters: text.replace(/[^A-Za-z]/g, '') };
    R.duck(0.35, dur);
    var c = $('radio-talk');
    if (c) {
      c.innerHTML = '';
      var w = document.createElement('b');
      w.textContent = who + ': ';
      w.style.color = id.color;
      c.appendChild(w);
      c.appendChild(document.createTextNode(text));
      c.classList.add('on');
    }
    if (GAME.track) GAME.track(ad ? 'radio-ad' : 'radio-dj');
    return seg;
  }
  function roaming() {
    var G = GAME;
    return !((G.missions && G.missions.active) || (G.strangers && G.strangers.busy) || (G.heist && G.heist.busy) ||
      (G.rc && G.rc.running) || (G.robbery && G.robbery.busy) || (G.guide && G.guide.step) || G.player.interior);
  }
  function stopTalk() {
    seg = null;
    var c = $('radio-talk');
    if (c) c.classList.remove('on');
  }
  function update(dt) {
    if (!enabled || !GAME.started) return;
    var P = GAME.player, R = GAME.audio && GAME.audio.radio;
    var on = P.inCar && P.state === 'alive' && R && R.audible;
    if (!on) { if (seg) stopTalk(); return; }
    if (seg) {
      // (a job started half way through an ad: the ad is over)
      if (seg.who === 'AD' && !roaming()) { stopTalk(); R.duck(1, 0.3); return; }
      seg.t += dt;
      var v = seg.voice, want = Math.floor(seg.t * v.cps / 2);
      while (seg.i < want && seg.i * 2 < seg.letters.length) { R.talk(v, seg.letters.charAt(seg.i * 2)); seg.i++; }
      if (seg.t >= seg.dur) { stopTalk(); talkT = 45 + Math.random() * 35; }
      return;
    }
    talkT -= dt;
    if (talkT <= 0) { talkT = 50; segment(); }
  }

  return {
    update: update,
    tuned: tuned,
    segment: segment,
    get talking() { return seg ? { who: seg.who, text: seg.text } : null; },
    identity: idOf,
    roaming: roaming,
    get enabled() { return enabled; },
    set enabled(v) { enabled = !!v; if (!enabled) stopTalk(); },
    ADS: ADS
  };
})();
