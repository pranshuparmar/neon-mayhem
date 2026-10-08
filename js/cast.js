// The people in the story, as you meet them: a face and a voice each.
//
// There are no picture files and no recordings in this game, so both are made
// here. A face is an SVG string, drawn from a handful of shapes in the town's
// 1986 palette — a sunset behind, a grid on the horizon, a neon edge on the
// cheek — and a voice is the Animal Crossing trick: a short pitched blip per
// syllable, through a filter, with its own pitch, pace and timbre per person,
// so Lola sounds like Lola and Rico like Rico without a word being spoken.
//
// The pager, Lola's card, a stranger's question and the scenes (scenes.js)
// all ask here: portrait(id) for the face, voice(id) for how they talk.
GAME.cast = (function () {
  // who's who. `face` is the portrait, `voice` the babble, `fig` how they
  // stand in the world when a scene puts them there (peds.js buildPedMesh's
  // look, plus whatever they wear on the face)
  //   voice: base Hz, wave, cps (letters a second), spread (semitones),
  //          formant (the filter's centre — the vowel colour), q
  var CAST = {
    lola: {
      name: 'LOLA', full: 'Lola Reyes', color: '#ff6fb8',
      face: { bg: ['#ff5fa8', '#4a1478'], sun: '#ffd36e', rim: '#ff9ad8', skin: '#c8916a', hair: 'big', hairCol: '#24160f',
        eyes: 'lashes', eyeCol: '#5a3518', lips: '#ff2d7a', brows: 'arch', outfit: 'blazer', col: '#ff4fa3', col2: '#1a1022', extras: ['hoops'] },
      voice: { base: 290, wave: 'triangle', cps: 34, spread: 8, formant: 1500, q: 1.6 },
      fig: { shirt: 0xff4fa3, pants: 0xf2eee4, skin: 0xc8916a, hair: 'afro', hairCol: 0x24160f, hoops: true, lips: 0xff2d7a }
    },
    rico: {
      name: 'RICO', full: 'Rico Salazar', color: '#ffd24a',
      face: { bg: ['#19c8bc', '#161236'], sun: '#ffcf5a', rim: '#6ff8ea', skin: '#b98260', hair: 'slick', hairCol: '#120e10',
        eyes: 'aviators', brows: 'mean', mouth: 'smirk', outfit: 'suit', col: '#f4f1e8', col2: '#2a1830', extras: ['stubble', 'tash', 'chain'] },
      voice: { base: 112, wave: 'sawtooth', cps: 25, spread: 5, formant: 760, q: 2.2 },
      fig: { shirt: 0xf4f1e8, pants: 0xf4f1e8, skin: 0xb98260, hair: 'pompadour', hairCol: 0x120e10, shades: true }
    },
    // the player: nobody in town ever got a name (herald.js), so YOU
    you: {
      name: 'YOU', full: 'You', color: '#5ff0ff',
      face: { bg: ['#38e8ff', '#2a1460'], sun: '#ff8a3d', rim: '#9ff6ff', skin: '#e2b48e', hair: 'short', hairCol: '#4a2c18',
        eyes: 'plain', eyeCol: '#3a5a7a', brows: 'flat', outfit: 'crockett', col: '#f4f4f8', col2: '#4fd6c8', extras: ['stubble'] },
      voice: { base: 168, wave: 'square', cps: 38, spread: 6, formant: 1100, q: 1.8 }
    },
    // Rico's driver, at his elbow on the marina
    manny: {
      name: 'MANNY', full: 'Manny', color: '#b48cff',
      face: { bg: ['#8a4cff', '#140c2a'], sun: '#ff5f8a', rim: '#c8a8ff', skin: '#9a6a48', hair: 'slick', hairCol: '#0e0c0c',
        eyes: 'shades', brows: 'mean', outfit: 'shirt', col: '#3a2a5a', col2: '#c8b8e8', extras: ['chain', 'stubble'] },
      voice: { base: 96, wave: 'sawtooth', cps: 30, spread: 4, formant: 640, q: 2.4 },
      fig: { shirt: 0x3a2a5a, pants: 0x1c1a22, skin: 0x9a6a48, hair: 'crew', hairCol: 0x0e0c0c, shades: true }
    },
    // the heist crew (heist.js)
    benny: {
      name: 'BENNY', full: 'Benny "the Ear"', color: '#ffb35a',
      face: { bg: ['#ffb35a', '#3a1a50'], sun: '#fff0a0', rim: '#ffd8a0', skin: '#d8a888', hair: 'pomp', hairCol: '#c0c0c8',
        eyes: 'glasses', eyeCol: '#4a4a3a', brows: 'arch', outfit: 'cardigan', col: '#6a5a8a', col2: '#f0e8d0' },
      voice: { base: 150, wave: 'triangle', cps: 27, spread: 10, formant: 980, q: 1.4 }
    },
    // the strangers with a favour to ask (strangers.js), keyed by their id
    ray: { name: 'RAY', color: '#8fd0f0',
      face: { bg: ['#8fd0f0', '#24204a'], sun: '#ffe08a', rim: '#c8f0ff', skin: '#eac8a8', hair: 'short', hairCol: '#6a5040',
        eyes: 'glasses', brows: 'worry', outfit: 'tie', col: '#c8c0b0', col2: '#a8482a' },
      voice: { base: 160, wave: 'square', cps: 44, spread: 7, formant: 1300, q: 1.6 } },
    dani: { name: 'DANI', color: '#ff8a6a',
      face: { bg: ['#ff8a6a', '#3a1040'], sun: '#ffe0a0', rim: '#ffc0a8', skin: '#f0d8c0', hair: 'bob', hairCol: '#a8482a',
        eyes: 'lashes', eyeCol: '#3a6a4a', lips: '#e8406a', brows: 'arch', outfit: 'shirt', col: '#e86a8a', col2: '#fff0f4', extras: ['studs'] },
      voice: { base: 270, wave: 'triangle', cps: 36, spread: 7, formant: 1600, q: 1.8 } },
    tito: { name: 'TITO', color: '#ffe14f',
      face: { bg: ['#ffe14f', '#2a1460'], sun: '#ff5fa8', rim: '#fff4a0', skin: '#8a6848', hair: 'cap', hairCol: '#1c1a18', col3: '#e83a3a',
        eyes: 'plain', eyeCol: '#2a1a10', brows: 'worry', outfit: 'tee', col: '#38b8c8', col2: '#38b8c8' },
      voice: { base: 330, wave: 'square', cps: 40, spread: 9, formant: 1800, q: 1.5 } },
    rosa: { name: 'MRS. ALBESCU', color: '#d8b8ff',
      face: { bg: ['#d8b8ff', '#3a2a5a'], sun: '#fff0c8', rim: '#f0e0ff', skin: '#f0d8c0', hair: 'bun', hairCol: '#b8b8c0',
        eyes: 'glasses', eyeCol: '#5a6a8a', lips: '#c86a8a', brows: 'arch', outfit: 'cardigan', col: '#a888c8', col2: '#f4f0f8', extras: ['pearls'] },
      voice: { base: 240, wave: 'triangle', cps: 24, spread: 11, formant: 1200, q: 1.3 } },
    vince: { name: 'VINCE', color: '#ff5f5f',
      face: { bg: ['#ff5f5f', '#1a0c24'], sun: '#ffd060', rim: '#ffa0a0', skin: '#c89878', hair: 'mullet', hairCol: '#5a3c22',
        eyes: 'shades', brows: 'mean', mouth: 'smirk', outfit: 'tee', col: '#1c1a22', col2: '#1c1a22', extras: ['stubble', 'chain'] },
      voice: { base: 120, wave: 'sawtooth', cps: 34, spread: 5, formant: 820, q: 2 } },
    marco: { name: 'MARCO', color: '#ff9ad8',
      face: { bg: ['#ff9ad8', '#2a1a4a'], sun: '#a8f0ff', rim: '#ffd0f0', skin: '#e2b48e', hair: 'pomp', hairCol: '#1c1a18',
        eyes: 'plain', eyeCol: '#4a3018', brows: 'worry', outfit: 'bowtie', col: '#f0f0e8', col2: '#d0306a' },
      voice: { base: 190, wave: 'square', cps: 42, spread: 10, formant: 1250, q: 1.7 } },
    nina: { name: 'NINA', color: '#60e8b0',
      face: { bg: ['#60e8b0', '#14284a'], sun: '#ffb0d8', rim: '#b0ffd8', skin: '#6a4c34', hair: 'curly', hairCol: '#1c1410',
        eyes: 'lashes', eyeCol: '#2a1a10', lips: '#c8406a', brows: 'arch', outfit: 'tee', col: '#ffe14f', col2: '#ffe14f', extras: ['band', 'hoops'] },
      voice: { base: 250, wave: 'triangle', cps: 36, spread: 7, formant: 1450, q: 1.8 } },
    sal: { name: 'SAL', color: '#a8b8ff',
      face: { bg: ['#4a5aa8', '#0c0a20'], sun: '#f0f0ff', rim: '#c8d8ff', skin: '#d8a888', hair: 'bald', hairCol: '#8a8a90',
        eyes: 'glasses', eyeCol: '#3a3a5a', brows: 'arch', outfit: 'cardigan', col: '#5a6a4a', col2: '#e8e0c8', extras: ['beard'] },
      voice: { base: 130, wave: 'triangle', cps: 26, spread: 6, formant: 900, q: 1.6 } },
    cookie: { name: 'COOKIE', color: '#ffc0d8',
      face: { bg: ['#ffc0d8', '#3a1a3a'], sun: '#a8fff0', rim: '#fff0f8', skin: '#eac8a8', hair: 'paper', hairCol: '#d8b86a', col3: '#e84a6a',
        eyes: 'plain', eyeCol: '#3a5a7a', brows: 'worry', outfit: 'shirt', col: '#f8f4f0', col2: '#e84a6a' },
      voice: { base: 210, wave: 'square', cps: 46, spread: 9, formant: 1500, q: 1.6 } },
    gus: { name: 'GUS', color: '#60c8f0',
      face: { bg: ['#60c8f0', '#10283a'], sun: '#ffd88a', rim: '#a8e8ff', skin: '#c89878', hair: 'beanie', hairCol: '#8a8a90', col3: '#2a5a8a',
        eyes: 'plain', eyeCol: '#2a3a4a', brows: 'flat', outfit: 'shirt', col: '#e8c84a', col2: '#c8a83a', extras: ['beard'] },
      voice: { base: 108, wave: 'sawtooth', cps: 24, spread: 5, formant: 700, q: 1.8 } },
    lupe: { name: 'LUPE', color: '#fff0a0',
      face: { bg: ['#ffd27a', '#5a1a5a'], sun: '#fff8e0', rim: '#fff4c0', skin: '#e8c0a0', hair: 'long', hairCol: '#f0d890',
        eyes: 'aviators', lips: '#e8203a', brows: 'arch', outfit: 'blazer', col: '#f8f4ec', col2: '#e8203a', extras: ['hoops'] },
      voice: { base: 310, wave: 'triangle', cps: 32, spread: 9, formant: 1700, q: 2 } },
    walt: { name: 'WALT', color: '#c8a888',
      face: { bg: ['#c87a5a', '#1a1424'], sun: '#ffe0a0', rim: '#ffc8a8', skin: '#eac8a8', hair: 'bald', hairCol: '#5a4a40',
        eyes: 'plain', eyeCol: '#3a3a3a', brows: 'mean', outfit: 'shirt', col: '#5a7a9a', col2: '#3a5a7a', extras: ['tash', 'stubble'] },
      voice: { base: 124, wave: 'sawtooth', cps: 30, spread: 6, formant: 860, q: 1.9 } }
  };

  // ---------- the face ----------
  function hex(c) { return parseInt(c.slice(1), 16); }
  function rgb(n) { return '#' + ('00000' + n.toString(16)).slice(-6); }
  // darker (f < 1) or lighter (f > 1), by channel
  function tone(c, f) {
    var n = hex(c), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    function ch(v) { return Math.max(0, Math.min(255, Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1)))); }
    return rgb((ch(r) << 16) | (ch(g) << 8) | ch(b));
  }
  var uid = 0;
  // Each portrait gets its own gradient ids: two of the same face on the page
  // at once (the pager and a scene) would otherwise share the first one's
  // defs, and lose them with it when it is taken down.
  function draw(f) {
    var u = 'cf' + (++uid), s = f.skin, sh = tone(s, 0.72), hc = f.hairCol, x = [];
    function P(d, fill, more) { x.push('<path d="' + d + '" fill="' + fill + '"' + (more || '') + '/>'); }
    function L(d, stroke, w, more) { x.push('<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="' + w + '" stroke-linecap="round"' + (more || '') + '/>'); }
    function C(cx, cy, r, fill, more) { x.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + fill + '"' + (more || '') + '/>'); }
    function E(cx, cy, rx, ry, fill, more) { x.push('<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '"' + (more || '') + '/>'); }
    var has = {};
    (f.extras || []).forEach(function (e) { has[e] = true; });
    x.push('<defs><linearGradient id="' + u + 'b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + f.bg[0] + '"/>' +
      '<stop offset="1" stop-color="' + f.bg[1] + '"/></linearGradient>' +
      '<linearGradient id="' + u + 'l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1a0c30"/><stop offset=".6" stop-color="#3a1a5a"/>' +
      '<stop offset="1" stop-color="' + f.rim + '"/></linearGradient></defs>');
    // the sky: a sunset, a striped sun going down behind them, the grid
    x.push('<rect width="100" height="100" fill="url(#' + u + 'b)"/>');
    C(76, 34, 15, f.sun, ' opacity=".9"');
    x.push('<rect x="58" y="36" width="36" height="1.4" fill="' + f.bg[1] + '" opacity=".55"/>' +
      '<rect x="58" y="40.5" width="36" height="2" fill="' + f.bg[1] + '" opacity=".6"/>' +
      '<rect x="58" y="45.5" width="36" height="2.6" fill="' + f.bg[1] + '" opacity=".65"/>');
    var grid = '';
    for (var gy = 0; gy < 4; gy++) grid += 'M0 ' + [82, 86, 91, 98][gy] + 'H100';
    for (var gx = -40; gx <= 140; gx += 20) grid += 'M50 76L' + gx + ' 100';
    L(grid, f.rim, 0.5, ' opacity=".35"');
    // hair that falls behind the head
    if (f.hair === 'big') P('M20 52C12 32 24 12 43 12C50 5 66 7 72 16C86 19 92 37 83 53C89 63 80 75 71 70C64 64 36 64 29 70C18 73 13 61 20 52Z', hc);
    if (f.hair === 'bob') P('M29 58C25 34 35 21 50 21C65 21 75 34 71 58L62 60C64 46 60 35 50 35C40 35 36 46 38 60Z', hc);
    if (f.hair === 'long') P('M26 78C19 50 26 20 50 18C74 20 81 50 74 78L64 78C66 60 64 44 60 38L40 38C36 44 34 60 36 78Z', hc);
    if (f.hair === 'mullet') P('M35 48C33 60 35 72 41 77L59 77C65 72 67 60 65 48Z', hc);
    if (f.hair === 'bun') C(50, 22, 7.5, hc);
    if (f.hair === 'curly') {
      [[33, 36, 7], [38, 26, 8], [50, 21, 9], [62, 26, 8], [67, 36, 7], [31, 48, 6], [69, 48, 6], [33, 58, 5], [67, 58, 5]].forEach(function (c) { C(c[0], c[1], c[2], hc); });
    }
    // neck, the shadow under the chin
    P('M43.5 58L43.5 75Q50 78 56.5 75L56.5 58Z', s);
    E(50, 65.5, 7.5, 3, sh, ' opacity=".55"');
    // what they wear, over the shoulders
    var o = f.outfit, col = f.col, c2 = f.col2, dk = tone(col, 0.78);
    var wide = o === 'blazer' || o === 'suit';
    P(wide ? 'M3 100C4 82 19 75.5 40 74L60 74C81 75.5 96 82 97 100Z' : 'M9 100C11 84 24 77 41 75L59 75C76 77 89 84 91 100Z', col);
    if (o === 'blazer') {
      P('M41 74.5L50 93L59 74.5Z', c2);
      L('M40 74.5L50 95M60 74.5L50 95', dk, 2.4);
      L('M24 79Q30 77 37 76.5M76 79Q70 77 63 76.5', tone(col, 1.25), 1.2, ' opacity=".7"');   // the shoulder pads
    } else if (o === 'suit') {
      P('M41.5 74.5L50 92L58.5 74.5Z', c2);
      P('M45 74.5L50 84L55 74.5Z', s);
      L('M40.5 74.5L49 96M59.5 74.5L51 96', dk, 2.2);
    } else if (o === 'crockett') {
      P('M41 75Q50 80 59 75L56.5 100L43.5 100Z', c2);
      L('M40.5 75L45 100M59.5 75L55 100', dk, 1.8);
    } else if (o === 'cardigan') {
      P('M42 75L50 88L58 75Z', c2);
      L('M50 88V100', dk, 1.2);
      C(50, 92, 0.9, dk); C(50, 97, 0.9, dk);
    } else if (o === 'tee') {
      P('M43 75Q50 81.5 57 75Z', s);
    } else {
      // a shirt with a collar, and what goes under it
      P('M42 74.5L46 82L50 76Z', tone(col, 1.2)); P('M58 74.5L54 82L50 76Z', tone(col, 1.2));
      if (o === 'tie') P('M48.6 77L51.4 77L52.6 92L50 95L47.4 92Z', c2);
      else if (o === 'bowtie') P('M44.5 76L50 78.4L55.5 76L55.5 81L50 78.6L44.5 81Z', c2);
      else P('M46 76L50 84L54 76Z', s);
    }
    if (has.chain) { L('M42.5 76Q50 87 57.5 76', '#ffd24a', 1.1); C(50, 85, 1.7, '#ffd24a'); }
    if (has.pearls) { for (var pi = 0; pi < 9; pi++) { var a = Math.PI * (0.1 + pi * 0.1); C(50 - Math.cos(a) * 8, 75 + Math.sin(a) * 5.5, 1.1, '#fffaf0'); } }
    // the head: ears behind, a jaw, the cheek in shadow, a neon edge
    E(34.6, 47.5, 2.6, 4.6, sh); E(65.4, 47.5, 2.6, 4.6, sh);
    P('M34.5 44C34.5 30 41 26 50 26C59 26 65.5 30 65.5 44C65.5 56 60 66 50 67C40 66 34.5 56 34.5 44Z', s);
    P('M36 50C37 60 43 65.5 50 66.5C44 63 39 57 38 48Z', sh, ' opacity=".45"');
    L('M64.8 38C66 48 63 60 55 65.5', f.rim, 1.3, ' opacity=".85"');
    if (has.stubble) P('M38.5 53C40 62 45 66.3 50 66.6C55 66.3 60 62 61.5 53C58 58.5 54 61 50 61C46 61 42 58.5 38.5 53Z', '#1a1010', ' opacity=".2"');
    if (has.beard) P('M36 50C36 64 43 71 50 71.5C57 71 64 64 64 50C61 57 56 59.5 50 59.5C44 59.5 39 57 36 50Z', f.hairCol);
    // the eyes, or what is over them
    var e = f.eyes || 'plain', ec = f.eyeCol || '#2a1a10';
    if (e === 'plain' || e === 'lashes' || e === 'glasses') {
      [43.4, 56.6].forEach(function (ex, i) {
        E(ex, 46.4, 2.7, 1.7, '#fff8f0');
        C(ex + 0.2, 46.4, 1.35, ec);
        C(ex + 0.2, 46.4, 0.6, '#0c0808');
        C(ex + 0.6, 45.9, 0.38, '#ffffff');
        L(i ? 'M53.8 45.6Q56.6 44.2 59.4 45.4' : 'M40.6 45.4Q43.4 44.2 46.2 45.6', '#2a1a14', 0.8);
        if (e === 'lashes') L(i ? 'M59.4 45.4L60.8 44.4' : 'M40.6 45.4L39.2 44.4', '#2a1a14', 0.8);
      });
    }
    // the brows, which do most of the acting
    var bw = f.brows === 'mean' ? 1.9 : 1.4;
    var BROWS = { arch: ['M39.8 42Q43.4 39.4 47 41.2', 'M53 41.2Q56.6 39.4 60.2 42'], flat: ['M40 41.6L47 41.2', 'M53 41.2L60 41.6'],
      mean: ['M40 40.2L47.2 42.2', 'M52.8 42.2L60 40.2'], worry: ['M40 42.4L47 40.4', 'M53 40.4L60 42.4'] };
    var bb = BROWS[f.brows] || BROWS.flat;
    if (e !== 'aviators' && e !== 'shades') { L(bb[0], hc === '#c0c0c8' ? '#8a8a90' : hc, bw); L(bb[1], hc === '#c0c0c8' ? '#8a8a90' : hc, bw); }
    if (e === 'glasses') {
      x.push('<g fill="#ffffff" fill-opacity=".14" stroke="#2a2420" stroke-width=".9"><circle cx="43.4" cy="46.4" r="4"/><circle cx="56.6" cy="46.4" r="4"/></g>');
      L('M47.4 46L52.6 46M39.4 46L35.4 45.4M60.6 46L64.6 45.4', '#2a2420', 0.9);
    }
    if (e === 'aviators' || e === 'shades') {
      var lens = e === 'aviators'
        ? 'M38.4 43.2Q38.2 50.2 43.6 50.2Q48 50 48.2 44.2L48.2 43.2ZM61.6 43.2Q61.8 50.2 56.4 50.2Q52 50 51.8 44.2L51.8 43.2Z'
        : 'M38 43.2H48.4V47.6Q48.4 49.4 46.4 49.4H40Q38 49.4 38 47.6ZM62 43.2H51.6V47.6Q51.6 49.4 53.6 49.4H60Q62 49.4 62 47.6Z';
      P(lens, 'url(#' + u + 'l)', ' stroke="' + (e === 'aviators' ? '#ffd24a' : '#0c0a10') + '" stroke-width=".8"');
      L('M48.2 43.8L51.8 43.8M38.4 44L34.8 45M61.6 44L65.2 45', e === 'aviators' ? '#ffd24a' : '#0c0a10', 0.8);
      L('M40 44.6L42.4 44.6', '#ffffff', 0.7, ' opacity=".7"');
      L(bb[0], hc, bw, ' opacity=".9" transform="translate(0 -1.6)"'); L(bb[1], hc, bw, ' opacity=".9" transform="translate(0 -1.6)"');
    }
    // the nose; a moustache
    L('M50.2 47.4Q48.6 53 49.2 54.4Q50.4 55.2 51.8 54.2', sh, 0.95);
    if (has.tash) P('M43.8 57C46.8 54.6 49 55.6 50 56.2C51 55.6 53.2 54.6 56.2 57C53.6 58.4 51.6 57.6 50 57.3C48.4 57.6 46.4 58.4 43.8 57Z', hc === '#c0c0c8' ? '#8a8a90' : hc);
    // the mouth: closed, and open (scenes.js flips between them as they talk)
    var lip = f.lips || tone(s, 0.62);
    x.push('<g class="mc">');
    if (f.lips) {
      P('M45 59.2Q47.5 57.4 50 58.4Q52.5 57.4 55 59.2Q50 60.2 45 59.2Z', lip);
      P('M45 59.2Q50 62.6 55 59.2Q50 60.2 45 59.2Z', lip);
    } else L(f.mouth === 'smirk' ? 'M45.6 59.6Q50 60.4 54.8 58.2' : 'M45.6 59.2Q50 60.8 54.4 59.2', lip, 1.3);
    x.push('</g><g class="mo" style="display:none">');
    E(50, 59.8, 3.6, 2.5, '#3a0c18', ' stroke="' + lip + '" stroke-width="' + (f.lips ? 1.4 : 0.9) + '"');
    P('M47 58.2H53V59.2H47Z', '#fff4ea');
    x.push('</g>');
    // hair over the brow, and anything on top
    var H = {
      big: 'M34.5 41C35 28 44 21 55 23C63 24 68 32 66 43C62 34 56 30.5 50 31.5C46 36.5 40 39.5 34.5 41Z',
      slick: 'M34 44C33 30 41 24.5 50 24.5C59 24.5 67 30 66 44C65 38 62 33 58 31.5C52 30 46 30 42 31.5C38 33 35.5 38 34 44Z',
      short: 'M34.3 43C33 29 40 23 50 23.5C57 22.5 63 25 65.5 31C67 36 66.5 40 65.7 43C64 37 61 34 57 33.5C55 31 52 30.5 49 32C45 33.5 40 34 37 36.5C35.5 38.5 34.8 41 34.3 43Z',
      pomp: 'M34.5 42C33 30 38 19 50 18C62 17 67 26 65.5 42C64 35 60 31 54 31C48 30.5 40 32 34.5 42Z',
      bob: 'M35 39C36 27 44 23.5 50 23.5C56 23.5 64 27 65 39C60 35 40 35 35 39Z',
      long: 'M35 41C35 27 43 21 52 22C61 23 66 30 65.5 40C58 33 46 31 35 41Z',
      mullet: 'M34.3 42C33.5 29 40 23.5 50 23.5C60 23.5 66.5 29 65.7 42C63 35 58 32 50 32C42 32 37 35 34.3 42Z',
      bun: 'M34.5 42C34 30 41 25 50 25C59 25 66 30 65.5 42C62 34 56 31 50 31C44 31 38 34 34.5 42Z',
      curly: 'M35 40C37 30 43 27 50 27C57 27 63 30 65 40C61 35 55 33 50 34C45 33 39 35 35 40Z',
      bald: 'M34.5 47C34 41 35 38 37.2 35.6L37.8 47ZM65.5 47C66 41 65 38 62.8 35.6L62.2 47Z'
    };
    if (H[f.hair]) P(H[f.hair], hc);
    if (f.hair === 'slick' || f.hair === 'big' || f.hair === 'pomp') L(f.hair === 'big' ? 'M44 25Q54 22 62 27' : 'M42 27.6Q50 25.4 58 27.6', '#ffffff', 0.9, ' opacity=".3"');
    if (f.hair === 'slick') P('M34.6 40.5L36.6 40.5L37 50L35.2 50Z', hc);
    if (f.hair === 'bald') L('M42 30Q50 27 57 30', '#ffffff', 1.2, ' opacity=".35"');
    if (f.hair === 'cap') {
      P('M35.2 44L37 50L38.5 44ZM64.8 44L63 50L61.5 44Z', hc);
      P('M34 38.5C34 26 42 21.5 50 21.5C58 21.5 66 26 66 38.5Z', f.col3);
      P('M46 37.5C56 35.8 68 36.2 73 39.4C66 41 56 41 46 40Z', tone(f.col3, 0.75));
      C(50, 22, 1.2, tone(f.col3, 0.75));
    }
    if (f.hair === 'beanie') {
      P('M33.6 40C33 26 41 19.5 50 19.5C59 19.5 67 26 66.4 40Z', f.col3);
      P('M33 36.5H67V41.5H33Z', tone(f.col3, 0.8));
    }
    if (f.hair === 'paper') {
      P('M34.5 42C34 32 41 28 50 28C59 28 66 32 65.5 42C62 36 56 34 50 34C44 34 38 36 34.5 42Z', hc);
      P('M35 33L37.5 21H62.5L65 33Z', '#fbf8f4');
      P('M36 28.5H64V30.5H36Z', f.col3);
    }
    if (has.band) P('M34.6 35.5C40 31.5 60 31.5 65.4 35.5L65.6 38.4C60 34.5 40 34.5 34.4 38.4Z', '#ff4fa3');
    if (has.hoops) { C(34.8, 55, 3, 'none', ' stroke="#ffd24a" stroke-width="1.2"'); C(65.2, 55, 3, 'none', ' stroke="#ffd24a" stroke-width="1.2"'); }
    if (has.studs) { C(34.8, 52.6, 1, '#fff4c0'); C(65.2, 52.6, 1, '#fff4c0'); }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="face">' + x.join('') + '</svg>';
  }

  // the cast member a pager's sender is, by name ('LOLA', '🗣 RAY')
  function idFor(from) {
    if (!from) return null;
    var k = String(from).replace(/^[^A-Za-z]+/, '').toUpperCase();
    for (var id in CAST) if (CAST[id].name === k || id.toUpperCase() === k) return id;
    return null;
  }
  // A face, as a string of SVG; '' for somebody nobody drew. Drawn fresh each
  // time — it is a few hundred bytes of text and nobody asks often.
  function portrait(id) {
    var c = CAST[id];
    return c ? draw(c.face) : '';
  }

  // ---------- the voice ----------
  // A line, said: one blip per couple of letters as it types out, pitched by
  // the letter (the same letter always lands on the same note, which is what
  // makes it sound like words rather than noise). scenes.js times the blips
  // to its typewriter; anybody else can just say a line and let it run.
  function voice(id) { var c = CAST[id]; return c ? c.voice : null; }
  var talk = null;
  function say(id, text, maxSec) {
    var v = voice(id);
    if (!v || !GAME.audio || !GAME.audio.ctx) return;
    stopTalking();
    var letters = String(text).replace(/[^A-Za-z]/g, '').slice(0, Math.round((maxSec || 1.8) * v.cps));
    var i = 0;
    talk = setInterval(function () {
      if (i >= letters.length) { stopTalking(); return; }
      GAME.audio.babble(v, letters.charAt(i));
      i += 2;
    }, 2000 / v.cps);
  }
  function stopTalking() { if (talk) { clearInterval(talk); talk = null; } }

  return {
    portrait: portrait,
    voice: voice,
    say: say,
    hush: stopTalking,
    idFor: idFor,
    has: function (id) { return !!CAST[id]; },
    name: function (id) { return CAST[id] ? CAST[id].name : ''; },
    color: function (id) { return CAST[id] ? CAST[id].color : '#ffffff'; },
    fig: function (id) { return CAST[id] ? CAST[id].fig || null : null; },
    ids: function () { return Object.keys(CAST); }
  };
})();
