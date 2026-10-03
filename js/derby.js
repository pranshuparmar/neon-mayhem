// Gull Downs: the horse racing on the screens at the Lucky Gull.
//
// The slot machines down the casino's right wall are race terminals now, and
// a big screen above them shows the races: six runners, the odds posted on
// the board, then the race itself run out on a drawn track — the field
// bunching, a front-runner fading, a closer coming wide — and the result.
// Step up to the free terminal, pick a horse and a stake, and your race is
// run on every screen in the room (and on a set of your own up top while it
// runs). The races go on without you, too, every half a minute, with the
// regulars at the terminals cheering their horses home.
//
// Each race is decided at the off, by the odds: a horse at 4/1 wins about
// one race in five, less the house's cut, and pays the stake back and four
// times over. The running is then drawn to that result.
GAME.derby = (function () {
  var NAMES = ['NEON DANCER', 'GULL\'S REVENGE', 'PINK FLAMINGO', 'BAY BREEZE', 'ROSA ROCKET', 'PALM READER',
    'LAST ORDERS', 'CASH COW', 'SLOW MOTION', 'OFFSHORE BOB', 'TUESDAY\'S CHILD', 'HOT SAUCE',
    'MIDNIGHT TAXI', 'SALT N VINEGAR', 'BACK TAXES', 'DOG FOOD', 'ISLA DREAM', 'SUNBURN', 'NO REFUNDS',
    'LUCKY BREAK', 'TIDE\'S OUT', 'GLITTERBALL', 'SECOND WIFE', 'UNDERCOVER'];
  // saddle cloths by number, as on any racecourse: red, white, blue, yellow,
  // green, black — and the number on each in a colour that reads on it
  var CLOTH = ['#d8282c', '#f4f4f4', '#2a56d8', '#f2d22a', '#2a9a48', '#18181c'];
  var CLOTH_HEX = [0xd8282c, 0xf4f4f4, 0x2a56d8, 0xf2d22a, 0x2a9a48, 0x18181c];
  var NUM = ['#fff', '#111', '#fff', '#111', '#fff', '#ffd24a'];
  var COATS = ['#8a4a22', '#5a3018', '#9a9a9a', '#2a2220', '#c8a060', '#3a2010', '#6a3a1c'];
  // the odds a field can go off at: each set sums to a bit over a book of
  // 100%, which is the house's cut (about one bet in ten)
  var BOOKS = [[1, 3, 5, 8, 12, 20], [2, 3, 4, 6, 9, 14], [2, 2, 5, 6, 10, 16], [3, 3, 4, 5, 8, 12], [1, 4, 4, 7, 10, 25]];
  var BOARD_IDLE = 20;     // seconds the board is up when nobody has bet
  var BOARD_BET = 3;       // ...and once somebody has
  var RESULT_HOLD = 6;
  var LOC = { id: 'derby0', kind: 'derby', name: 'GULL DOWNS', tag: 'Six runners. Pick one.', color: 0x6fe08a, at: { x: 0, z: 0 } };
  var STAKES = [100, 500, 2000];

  var W = 512, H = 256;
  var canvas = null, ctx = null, tex = null, drawAcc = 0;
  var state = 'board', clock = 0, raceNo = 1, field = null, next = null, mine = null, stake = 100;
  var order = null, rig = null, said = '', saidT = 0, tv = null;

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function newField(no) {
    var names = shuffle(NAMES.slice()).slice(0, 6);
    var book = shuffle(BOOKS[Math.floor(Math.random() * BOOKS.length)].slice());
    var sum = 0;
    book.forEach(function (o) { sum += 1 / (o + 1); });
    var coats = shuffle(COATS.slice());
    return {
      no: no,
      runners: names.map(function (nm, i) {
        return { n: i + 1, name: nm, odds: book[i], p: 1 / (book[i] + 1) / sum, coat: coats[i % coats.length], x: 0, phase: Math.random() * 6 };
      })
    };
  }
  function oddsText(o) { return o === 1 ? 'EVENS' : o + '/1'; }
  function upcoming() { return state === 'board' ? field : next; }

  // the result, drawn at the off: a winner by the odds, then the places
  // the same way among whoever is left
  function draw(pool) {
    var tot = 0, i;
    for (i = 0; i < pool.length; i++) tot += pool[i].p;
    var r = Math.random() * tot;
    for (i = 0; i < pool.length; i++) { r -= pool[i].p; if (r <= 0) return i; }
    return pool.length - 1;
  }
  function off() {
    var pool = field.runners.slice(), fin = [];
    if (rig) {
      for (var k = 0; k < pool.length; k++) if (pool[k].n === rig) { fin.push(pool.splice(k, 1)[0]); break; }
      rig = null;
    }
    while (pool.length) fin.push(pool.splice(draw(pool), 1)[0]);
    // when each crosses the line, and how each runs the race: some go off
    // fast and hang on or fade, some come from the back
    var t = 12 + Math.random() * 1.2;
    fin.forEach(function (h, i) {
      if (i > 0) t += 0.12 + Math.random() * (i < 3 ? 0.35 : 0.7);
      h.fin = t;
      h.shape = 0.78 + Math.random() * 0.5;
      h.wob = Math.random() * 6;
      h.x = 0;
    });
    order = fin;
    state = 'running'; clock = 0;
    next = newField(raceNo + 1);
    say('AND THEY\'RE OFF!');
    if (here()) GAME.audio.chime();
  }
  function say(s) { if (s !== said) { said = s; saidT = 0; } }

  function here() {
    var room = GAME.interiors && GAME.interiors.current;
    return !!(room && room.kind === 'casino');
  }

  // With money down you watch your race from the terminal: held where you
  // stand (player.js) from the bet until the result is in and read, your
  // own set up top showing it. You could walk off mid-race — out of the
  // door, to the bar, into another menu — and leave it running for nobody.
  // Space, Enter (A on a pad) or JUMP on a touchscreen skips ahead: the
  // race in front of yours, the count to the off, the running itself.
  var AFTER = 2.5, afterT = 0, skipLatch = true, wasHeld = false;
  function holding() { return here() && GAME.player.state === 'alive' && !GAME.player.inCar && (!!mine || afterT > 0); }
  function skipAhead() {
    if (state === 'board') { if (mine) off(); return; }
    if (state === 'running') {
      var last = 0;
      for (var i = 0; i < order.length; i++) last = Math.max(last, order[i].fin);
      clock = Math.max(clock, last + 0.8);      // over the line: the next tick has the result
      return;
    }
    clock = RESULT_HOLD;                         // on to the next race's board
  }
  function holdHint() {
    var key = GAME.isTouch ? 'JUMP' : GAME.controls ? GAME.controls.label('Space') : 'Space';
    if (!mine) return 'THE RESULT IS IN';
    var now = mine.race === field.no;
    return (now ? (state === 'board' ? 'YOUR RACE IS OFF IN A MOMENT' : 'YOUR RACE IS ON') : 'YOUR RACE IS NEXT') +
      ' — ' + key + ' skips ahead';
  }

  function settle() {
    if (!mine || mine.race !== field.no) return;
    if (here()) afterT = AFTER;
    var bet = mine; mine = null;
    var win = order[0];
    var horse = field.runners[bet.n - 1];
    if (win.n === bet.n) {
      var pay = bet.stake * (horse.odds + 1);
      GAME.addCash(pay);
      GAME.audio.sting('win'); GAME.haptics.win();
      GAME.hud.message(bet.n + ' ' + horse.name + ' WINS!  You collect $' + pay.toLocaleString(), 4);
      GAME.track('derby-win');
    } else {
      GAME.audio.crash(0.15); GAME.haptics.deny();
      GAME.hud.message('Race ' + field.no + ': ' + win.n + ' ' + win.name + ' won it. ' + bet.n + ' ' + horse.name + ' came in ' + place(order.indexOf(horse) + 1) + '.', 4);
      GAME.track('derby-loss');
    }
    if (GAME.save) GAME.save();
  }
  function place(k) { return k + (k === 1 ? 'st' : k === 2 ? 'nd' : k === 3 ? 'rd' : 'th'); }

  // ---------- the clock ----------
  function update(dt) {
    if (!field) { field = newField(raceNo); next = null; }
    var watching = here();
    // with nobody in the room and nothing riding on it, nothing runs
    if (!watching && !mine) { showTv(false); return; }
    clock += dt; saidT += dt;
    if (afterT > 0) afterT -= dt;
    var held = holding();
    if (held && !wasHeld && GAME.interiors.faceScreen) GAME.interiors.faceScreen();
    wasHeld = held;
    if (held) {
      var T = GAME.input.touch, tap = !!T.jump && !skipLatch;
      skipLatch = !!T.jump;
      if ((GAME.keyPressed('Space') || GAME.keyPressed('Enter') || tap) && mine) skipAhead();
    } else skipLatch = true;
    if (state === 'board') {
      var wait = mine ? BOARD_BET : BOARD_IDLE;
      if (clock >= wait) off();
    } else if (state === 'running') {
      var lead = 0, last = 0;
      field.runners.forEach(function (h) {
        var u = Math.min(1, clock / h.fin);
        var x = Math.pow(u, h.shape) + 0.012 * u * (1 - u) * Math.sin(clock * 2.2 + h.wob);
        // past the post they pull up, still moving
        if (u >= 1) x = 1 + (clock - h.fin) * 0.05 * Math.max(0, 1 - (clock - h.fin) / 4);
        h.x = x;
        h.phase += dt * (u >= 1 ? 9 : 15);
        if (x > lead) lead = x;
        last = Math.max(last, h.fin);
      });
      var front = order.slice().sort(function (a, b) { return b.x - a.x; })[0];
      if (clock > order[0].fin) say(order[0].n + ' ' + order[0].name + ' WINS IT!');
      else if (lead > 0.8) say('INTO THE LAST FURLONG — ' + front.n + ' ' + front.name + '!');
      else if (lead > 0.25 && saidT > 2.5) say(front.n + ' ' + front.name + ' LEADS');
      if (clock > last + 0.8) {
        state = 'result'; clock = 0;
        settle();
      }
    } else if (state === 'result') {
      if (clock >= RESULT_HOLD) {
        raceNo++;
        field = next || newField(raceNo); next = null;
        state = 'board'; clock = 0; said = '';
      }
    }
    // the screens: a fresh frame thirty times a second, while anybody's looking
    drawAcc += dt;
    if (watching && drawAcc >= 1 / 30) { drawAcc = 0; paint(); }
    showTv(watching && !!(mine || (state !== 'board' && lastMine === field.no)));
  }
  var lastMine = -1;

  // ---------- the screens ----------
  function ensureCanvas() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    canvas.id = 'derby-canvas';
    ctx = canvas.getContext('2d');
    if (window.THREE) {
      tex = new THREE.CanvasTexture(canvas);
      tex.minFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
    }
  }
  function texture() {
    ensureCanvas();
    if (!field) field = newField(raceNo);
    paint();
    return tex;
  }
  function showTv(on) {
    if (!tv) tv = document.getElementById('derby-tv');
    if (!tv) return;
    if (on && canvas && canvas.parentNode !== tv) tv.appendChild(canvas);
    var want = on ? 'block' : 'none';
    if (tv.style.display !== want) tv.style.display = want;
  }

  function paint() {
    ensureCanvas();
    if (!ctx || !field) return;
    if (state === 'board') paintBoard(); else paintRace();
    if (tex) tex.needsUpdate = true;
  }
  function header(left, right) {
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(0, 0, W, 30);
    ctx.fillStyle = '#1a0a22'; ctx.font = 'bold 18px sans-serif'; ctx.textBaseline = 'middle';
    ctx.textAlign = 'left'; ctx.fillText(left, 12, 16);
    ctx.textAlign = 'right'; ctx.fillText(right, W - 12, 16);
  }
  function cloth(x, y, n, sz) {
    ctx.fillStyle = CLOTH[n - 1]; ctx.fillRect(x, y, sz, sz);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, sz - 1, sz - 1);
    ctx.fillStyle = NUM[n - 1]; ctx.font = 'bold ' + Math.round(sz * 0.7) + 'px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(n), x + sz / 2, y + sz / 2 + 1);
  }
  function paintBoard() {
    ctx.fillStyle = '#0b1f16'; ctx.fillRect(0, 0, W, H);
    header('GULL DOWNS', 'RACE ' + field.no);
    ctx.textBaseline = 'middle';
    field.runners.forEach(function (h, i) {
      var y = 38 + i * 30;
      ctx.fillStyle = i % 2 ? '#10281d' : '#0d2219'; ctx.fillRect(0, y, W, 30);
      cloth(14, y + 4, h.n, 22);
      var yours = mine && mine.race === field.no && mine.n === h.n;
      ctx.fillStyle = yours ? '#ffd24a' : '#e8f4ec'; ctx.font = 'bold 17px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(h.name + (yours ? '  ◀ YOURS' : ''), 48, y + 16);
      ctx.fillStyle = '#6fe08a'; ctx.textAlign = 'right'; ctx.font = 'bold 19px sans-serif';
      ctx.fillText(oddsText(h.odds), W - 16, y + 16);
    });
    ctx.fillStyle = '#ff2d95'; ctx.fillRect(0, H - 34, W, 34);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
    var left = Math.max(0, Math.ceil((mine ? BOARD_BET : BOARD_IDLE) - clock));
    var line = mine ? 'YOUR $' + mine.stake.toLocaleString() + ' ON ' + mine.n + ' ' + field.runners[mine.n - 1].name + '  ·  OFF IN ' + left
      : 'BETS AT THE TERMINALS  ·  NEXT OFF IN 0:' + (left < 10 ? '0' : '') + left;
    ctx.fillText(line, W / 2, H - 16);
  }
  function paintRace() {
    var runners = field.runners, lead = 0, i;
    for (i = 0; i < runners.length; i++) lead = Math.max(lead, runners[i].x);
    var SCALE = W * 2.1, CX = W * 0.7;
    var cam = Math.min(lead, 1.06);
    function sx(p) { return CX + (p - cam) * SCALE; }
    // sky, and the grandstand going by
    var g = ctx.createLinearGradient(0, 0, 0, 70);
    g.addColorStop(0, '#2a1a5a'); g.addColorStop(1, '#ff8fb0');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 70);
    var off0 = (cam * SCALE * 0.35) % 64;
    for (i = -1; i < W / 64 + 2; i++) {
      var gx = i * 64 - off0;
      ctx.fillStyle = '#3a2a48'; ctx.fillRect(gx, 34, 60, 34);
      ctx.fillStyle = '#ffe2a8'; for (var c = 0; c < 4; c++) ctx.fillRect(gx + 6 + c * 14, 42, 6, 5);
      ctx.fillStyle = '#5a3a6a'; ctx.fillRect(gx - 2, 30, 64, 5);
    }
    // the turf, with the mower's stripes going by under the field
    ctx.fillStyle = '#2f8a3a'; ctx.fillRect(0, 70, W, H - 70);
    var st = (cam * SCALE) % 80;
    ctx.fillStyle = '#34963f';
    for (i = -1; i < W / 80 + 2; i++) ctx.fillRect(i * 80 - st, 78, 40, H - 112);
    // the rails, posts every few lengths
    ctx.fillStyle = '#f4f4f4'; ctx.fillRect(0, 74, W, 3); ctx.fillRect(0, H - 32, W, 3);
    var post = 0.025;
    for (var pp = Math.floor((cam - 0.4) / post); pp * post < cam + 0.3; pp++) {
      var px = sx(pp * post);
      ctx.fillRect(px, 72, 3, 8); ctx.fillRect(px, H - 34, 3, 8);
    }
    // the furlong poles
    ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (var fl = 1; fl < 6; fl++) {
      var fx = sx(fl / 6);
      if (fx < -20 || fx > W + 20) continue;
      ctx.fillStyle = '#c02020'; ctx.fillRect(fx - 2, 58, 4, 20);
      ctx.fillStyle = '#fff'; ctx.fillRect(fx - 11, 50, 22, 12);
      ctx.fillStyle = '#c02020'; ctx.fillText((6 - fl) + 'F', fx, 56);
    }
    // the winning post
    var wx = sx(1);
    if (wx > -30 && wx < W + 30) {
      for (var k = 0; k < 10; k++) { ctx.fillStyle = k % 2 ? '#fff' : '#c02020'; ctx.fillRect(wx - 3, 74 + k * 15, 6, 15); }
      ctx.fillStyle = '#c02020'; ctx.fillRect(wx - 30, 40, 60, 16);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.fillText('FINISH', wx, 48);
    }
    // the field, back lane first so the near horses overlap the far ones
    for (i = 0; i < runners.length; i++) {
      var h = runners[i];
      horse(sx(h.x), 104 + i * 22, h, state === 'running' || clock < 3);
    }
    // the running order, and the commentary
    var now = state === 'result' ? order : runners.slice().sort(function (a, b) { return b.x - a.x; });
    ctx.fillStyle = 'rgba(10,4,20,.78)'; ctx.fillRect(0, 0, W, 26);
    ctx.fillStyle = '#ffd24a'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('RACE ' + field.no, 8, 13);
    for (i = 0; i < 6; i++) cloth(W - 6 - (6 - i) * 24, 3, now[i].n, 20);
    ctx.fillStyle = 'rgba(10,4,20,.82)'; ctx.fillRect(0, H - 28, W, 28);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(state === 'result' ? 'RESULT: 1st ' + order[0].n + ' ' + order[0].name + '  ·  2nd ' + order[1].n + '  ·  3rd ' + order[2].n + '  ·  WON AT ' + oddsText(order[0].odds)
      : said, W / 2, H - 14);
    if (state === 'result') {
      ctx.fillStyle = 'rgba(10,4,20,.8)'; ctx.fillRect(W / 2 - 150, 92, 300, 66);
      ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 2; ctx.strokeRect(W / 2 - 150, 92, 300, 66);
      cloth(W / 2 - 138, 104, order[0].n, 40);
      ctx.fillStyle = '#ffd24a'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('WINNER', W / 2 - 88, 112);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif';
      ctx.fillText(order[0].name, W / 2 - 88, 138);
    }
  }
  // one runner, side on, at the gallop: x is where the nose is
  function horse(x, y, h, moving) {
    if (x < -60 || x > W + 60) return;
    var ph = moving ? h.phase : 0, bob = moving ? Math.sin(ph * 2) * 1.5 : 0;
    var bx = x - 22, by = y + bob;
    ctx.lineCap = 'round';
    // legs: far pair darker, swinging against the near pair
    for (var L = 0; L < 4; L++) {
      var front = L < 2, hipX = bx + (front ? 9 : -9), far = L % 2 === 0;
      var a = Math.sin(ph + (front ? 0 : 2.2) + (far ? 0.9 : 0)) * 0.75;
      var kx = hipX + Math.sin(a) * 7, ky = by + Math.cos(a) * 7;
      var a2 = a + (front ? -0.5 : 0.6) * (0.5 + 0.5 * Math.sin(ph + (front ? 0.6 : 2.8)));
      ctx.strokeStyle = far ? '#1a1008' : h.coat; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(hipX, by - 2); ctx.lineTo(kx, ky); ctx.lineTo(kx + Math.sin(a2) * 7, ky + Math.cos(a2) * 7); ctx.stroke();
    }
    // tail, body, neck and head
    ctx.strokeStyle = '#1a1008'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(bx - 13, by - 9); ctx.quadraticCurveTo(bx - 22, by - 8 + Math.sin(ph) * 3, bx - 24, by + 2); ctx.stroke();
    ctx.fillStyle = h.coat;
    ctx.beginPath(); ctx.ellipse(bx, by - 7, 15, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(bx + 8, by - 12); ctx.lineTo(bx + 17, by - 22); ctx.lineTo(bx + 22, by - 19); ctx.lineTo(bx + 14, by - 5); ctx.fill();
    ctx.beginPath(); ctx.ellipse(bx + 21, by - 20, 6, 3, 0.45, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(bx + 15, by - 26, 2, 4);
    // the saddle cloth and its number
    ctx.fillStyle = CLOTH[h.n - 1]; ctx.fillRect(bx - 7, by - 13, 11, 9);
    ctx.fillStyle = NUM[h.n - 1]; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(h.n), bx - 1.5, by - 8);
    // the jockey, crouched, in the colours
    ctx.fillStyle = CLOTH[h.n - 1];
    ctx.beginPath(); ctx.moveTo(bx - 4, by - 14); ctx.lineTo(bx + 6, by - 22); ctx.lineTo(bx + 10, by - 18); ctx.lineTo(bx + 1, by - 12); ctx.fill();
    ctx.beginPath(); ctx.arc(bx + 10, by - 23, 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(bx + 7, by - 19); ctx.lineTo(bx + 16, by - 18); ctx.stroke();
  }

  // ---------- betting ----------
  function bet(n, amount) {
    var f = upcoming();
    if (!f || mine) return false;
    mine = { race: f.no, n: n, stake: amount };
    lastMine = f.no;
    if (state === 'board') clock = 0;   // a three-second count to the off, from when you walk away
    GAME.track('derby-bet');
    return true;
  }
  function items() {
    var f = upcoming(), rows = [];
    if (!f) return rows;
    // the stake first, one row that steps through the three: on a phone the
    // bottom of a list of six horses is a long way down
    rows.push({ id: 'stake', name: 'YOUR STAKE · $' + stake.toLocaleString(), price: 0, noPrice: true, chip: 'CHANGE', idle: 'CHANGE',
      ds: STAKES.map(function (s) { return s === stake ? '[$' + s.toLocaleString() + ']' : '$' + s.toLocaleString(); }).join('  ·  ') });
    f.runners.forEach(function (h) {
      var row = { id: 'horse' + h.n, name: h.n + ' · ' + h.name + ' · ' + oddsText(h.odds), price: stake, sw: CLOTH_HEX[h.n - 1], verb: 'BET',
        ds: 'Wins you $' + (stake * (h.odds + 1)).toLocaleString() + ' back on a $' + stake.toLocaleString() + ' stake.' };
      if (mine) { row.off = true; row.ds = mine.n === h.n ? 'Your $' + mine.stake.toLocaleString() + ' is on this one.' : 'One bet a race — yours is on.'; }
      rows.push(row);
    });
    return rows;
  }
  // a row chosen in the menu (shops.js has already taken the stake for a horse)
  function choose(id) {
    if (id === 'stake') { stake = STAKES[(STAKES.indexOf(stake) + 1) % STAKES.length]; return 'stake'; }
    if (id.indexOf('horse') === 0) return bet(+id.slice(5), stake) ? 'bet' : 'no';
    return 'no';
  }

  return {
    update: update,
    texture: texture,
    loc: LOC,
    items: items,
    choose: choose,
    hint: function () {
      var f = upcoming();
      return f ? 'Race ' + f.no + (state === 'board' ? '' : ' — off when this one\'s in') : '';
    },
    get state() { return state; },
    get race() { return field ? field.no : 0; },
    get bet() { return mine; },
    get stake() { return stake; },
    get busy() { return !!mine; },
    // you are at the terminal watching your race (player.js holds you still)
    get holding() { return holding(); },
    holdHint: holdHint,
    get cheering() { return state === 'running' && here(); },
    // headless
    field: function () { return upcoming(); },
    order: function () { return order ? order.map(function (h) { return h.n; }) : null; },
    rig: function (n) { rig = n; },
    paint: paint
  };
})();
