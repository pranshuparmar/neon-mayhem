// The camera: an old film SLR the player carries everywhere.
//
// Press C (or 📷 on a touchscreen, or click the left stick) and it goes off —
// the viewfinder blacks out for the mirror, the shutter clacks — and the
// frame is kept: the city as the game drew it, without the HUD, developed the
// way a print from 1986 looks. Warm film, grain, the corners falling off, and
// the orange date the camera burned into the corner of every frame.
//
// Shots go to an album (PHOTOS on the pause screen) where any of them can be
// downloaded — or, with AUTO-DOWNLOAD on, each one is saved the moment it is
// taken. The album survives a reload (IndexedDB, where the browser allows it;
// otherwise it lasts the session).
GAME.photo = (function () {
  var MAX = 36, MAX_W = 1920, MAX_W_TOUCH = 1440;
  var album = [];              // { id, t, name, blob, url, thumb }
  var pending = false, toastT = 0, albumOpen = false, nextId = 1;
  var toastShot = null;        // the shot on the print that slid in
  var viewing = null, viewPaused = false;   // the one open at full size
  var el = {};
  function $(id) { return document.getElementById(id); }
  function prefs() { GAME.prefs = GAME.prefs || {}; return GAME.prefs; }

  // ---------- taking one ----------
  function snap() {
    if (pending || !GAME.started || GAME.paused || GAME.mapOpen || GAME.shopOpen || GAME.shareOpen || GAME.lolaOpen) return false;
    pending = true;
    if (GAME.audio.shutter) GAME.audio.shutter();
    if (GAME.haptics && GAME.haptics.uiTap) GAME.haptics.uiTap();
    // the mirror: a blink of black through the viewfinder
    if (el.shutter) {
      el.shutter.classList.remove('blink');
      void el.shutter.offsetWidth;
      el.shutter.classList.add('blink');
    }
    return true;
  }

  // main.js calls this straight after drawing a frame, while the picture is
  // still in the WebGL canvas (it is cleared by the next one)
  function capture(canvas) {
    if (grabs.length) pressPhoto(canvas);
    if (!pending) return;
    pending = false;
    var cap = GAME.isTouch ? MAX_W_TOUCH : MAX_W;
    var k = Math.min(1, cap / canvas.width);
    var w = Math.max(2, Math.round(canvas.width * k)), h = Math.max(2, Math.round(canvas.height * k));
    var out = document.createElement('canvas');
    out.width = w; out.height = h;
    var g = out.getContext('2d');
    try { g.drawImage(canvas, 0, 0, w, h); } catch (e) { return; }
    develop(g, w, h);
    var t = Date.now();
    var shot = { id: nextId++, t: t, name: fileName(t), blob: null, url: '', thumb: thumbOf(out) };
    out.toBlob(function (b) {
      if (!b) return;
      shot.blob = b;
      shot.url = URL.createObjectURL(b);
      keep(shot);
      if (prefs().photoAuto) download(shot);
      toast(shot);
      if (GAME.lola) GAME.lola.first('photo');
      if (GAME.track) GAME.track('photo-taken');
    }, 'image/jpeg', 0.9);
  }

  // The papers' photographer (herald.js): the next frame drawn, small, and
  // printed the way a front page prints a photograph — grey, hard, and
  // screened into dots of ink on newsprint.
  var grabs = [];
  function grab(cb) { grabs.push(cb); }
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function pressPhoto(canvas) {
    var list = grabs; grabs = [];
    var w = 320, h = Math.max(2, Math.round(w * canvas.height / canvas.width));
    var out = document.createElement('canvas');
    out.width = w; out.height = h;
    var g = out.getContext('2d');
    try { g.drawImage(canvas, 0, 0, w, h); } catch (e) { return; }
    var img = g.getImageData(0, 0, w, h), d = img.data;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var i = (y * w + x) * 4;
        var l = (0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]) / 255;
        l = U.clamp((l - 0.5) * 1.35 + 0.56, 0, 1);
        // four tones of ink, the screen deciding between them
        var q = Math.floor(l * 3 + BAYER[(y & 3) * 4 + (x & 3)] / 16);
        var t = U.clamp(q / 3, 0, 1);
        d[i] = 26 + (233 - 26) * t; d[i + 1] = 24 + (226 - 24) * t; d[i + 2] = 20 + (207 - 20) * t;
      }
    }
    g.putImageData(img, 0, 0);
    for (var k = 0; k < list.length; k++) { try { list[k](out); } catch (e) { } }
  }

  // A print from 1986: warm and a little faded, grain across it, the corners
  // falling away, and the date in orange in the corner.
  function develop(g, w, h) {
    var img = g.getImageData(0, 0, w, h), d = img.data, seed = 1;
    for (var i = 0; i < d.length; i += 4) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      var n = ((seed >> 16) & 255) / 255 - 0.5;
      var r = d[i], gg = d[i + 1], b = d[i + 2];
      // lifted blacks and a soft shoulder, warmer in the reds, cooler blues
      r = 14 + r * 0.93 * 1.05; gg = 10 + gg * 0.93; b = 12 + b * 0.93 * 0.9;
      var grain = n * 16;
      d[i] = r + grain; d[i + 1] = gg + grain; d[i + 2] = b + grain;
    }
    g.putImageData(img, 0, 0);
    var vg = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) * 0.6);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(10,4,0,0.5)');
    g.fillStyle = vg;
    g.fillRect(0, 0, w, h);
    // the date back: '86 and today's month and day, in the camera's orange
    var now = new Date();
    var stamp = "'86  " + pad(now.getMonth() + 1) + '  ' + pad(now.getDate());
    var px = Math.round(h * 0.034);
    g.font = 'bold ' + px + 'px "Courier New", Courier, monospace';
    g.textAlign = 'right'; g.textBaseline = 'alphabetic';
    g.shadowColor = 'rgba(255,90,0,0.85)'; g.shadowBlur = px * 0.35;
    g.fillStyle = '#ffa23a';
    g.fillText(stamp, w - px * 1.6, h - px * 1.3);
    g.shadowBlur = 0;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fileName(t) {
    var d = new Date(t);
    return 'costa-rosa-1986-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' +
      pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()) + '.jpg';
  }
  function thumbOf(src) {
    var tw = 240, th = Math.round(tw * src.height / src.width);
    var c = document.createElement('canvas');
    c.width = tw; c.height = th;
    c.getContext('2d').drawImage(src, 0, 0, tw, th);
    return c.toDataURL('image/jpeg', 0.75);
  }

  // ---------- the album ----------
  function keep(shot) {
    album.push(shot);
    while (album.length > MAX) forget(album[0]);
    store(shot);
    paintButton();
    if (albumOpen) renderAlbum();
  }
  function forget(shot) {
    if (viewing === shot) closeView();
    var i = album.indexOf(shot);
    if (i >= 0) album.splice(i, 1);
    if (shot.url) URL.revokeObjectURL(shot.url);
    unstore(shot);
  }
  function download(shot) {
    if (!shot || !shot.url) return;
    var a = document.createElement('a');
    a.href = shot.url;
    a.download = shot.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (GAME.track) GAME.track('photo-downloaded');
  }

  // Kept across a reload where the browser will hold them. Every call is
  // allowed to fail: a private window, a blocked store, a full disk — the
  // album then simply lasts the session.
  var db = null, DB = 'neon-mayhem-photos';
  function openDb(cb) {
    if (db) return cb(db);
    try {
      var rq = indexedDB.open(DB, 1);
      rq.onupgradeneeded = function () { rq.result.createObjectStore('shots', { keyPath: 't' }); };
      rq.onsuccess = function () { db = rq.result; cb(db); };
      rq.onerror = function () { cb(null); };
    } catch (e) { cb(null); }
  }
  function store(shot) {
    openDb(function (d) {
      if (!d || !shot.blob) return;
      try { d.transaction('shots', 'readwrite').objectStore('shots').put({ t: shot.t, name: shot.name, blob: shot.blob, thumb: shot.thumb }); } catch (e) { }
    });
  }
  function unstore(shot) {
    openDb(function (d) {
      if (!d) return;
      try { d.transaction('shots', 'readwrite').objectStore('shots').delete(shot.t); } catch (e) { }
    });
  }
  function restore() {
    openDb(function (d) {
      if (!d) return;
      try {
        var rq = d.transaction('shots', 'readonly').objectStore('shots').getAll();
        rq.onsuccess = function () {
          (rq.result || []).sort(function (a, b) { return a.t - b.t; }).slice(-MAX).forEach(function (r) {
            if (!r || !r.blob || album.some(function (s) { return s.t === r.t; })) return;
            album.push({ id: nextId++, t: r.t, name: r.name, blob: r.blob, url: URL.createObjectURL(r.blob), thumb: r.thumb });
          });
          album.sort(function (a, b) { return a.t - b.t; });
          paintButton();
        };
      } catch (e) { }
    });
  }

  // ---------- on screen ----------
  function toast(shot) {
    if (!el.toast) return;
    toastShot = shot;
    el.toastImg.src = shot.thumb;
    // how to see it full size: tap the print; on a keyboard the mouse is
    // aiming, so a key; on a pad, the album
    var pad = GAME.controls && GAME.controls.usingPad && GAME.controls.usingPad();
    var see = GAME.isTouch ? 'Tap to view' : pad ? 'START → PHOTOS' : (GAME.controls ? GAME.controls.label('KeyV') : 'V') + ' to view';
    el.toastText.textContent = (prefs().photoAuto ? 'Saved to your downloads' : 'In your album') + ' · ' + see;
    el.toast.classList.add('on');
    toastT = 3.2;
  }

  // ---------- one at full size ----------
  // The print that slides in and every photo in the album open here: the
  // whole frame as it was taken, DOWNLOAD, and the rest of the album either
  // side. Opened from play it pauses the world, and closing it carries on.
  function openView(shot) {
    if (!shot || !el.view) return false;
    if (GAME.started && !GAME.paused) { GAME.togglePause(); viewPaused = true; }
    viewing = shot;
    paintView();
    el.view.style.display = 'flex';
    if (el.toast) el.toast.classList.remove('on');
    toastT = 0;
    if (GAME.track) GAME.track('photo-viewed');
    return true;
  }
  function closeView() {
    if (!viewing) return;
    viewing = null;
    el.view.style.display = 'none';
    el.viewImg.removeAttribute('src');   // the full-size decode goes with it
    if (viewPaused) {
      viewPaused = false;
      if (GAME.paused && !albumOpen) GAME.togglePause();
    }
    if (albumOpen) paintFocus();
  }
  // the album runs newest first, so "next" is the older one
  function stepView(dir) {
    var i = album.indexOf(viewing), j = i - dir;
    if (i < 0 || j < 0 || j >= album.length) return;
    viewing = album[j];
    paintView();
    if (albumOpen) { focus = album.length - 1 - j; paintFocus(); }
  }
  function paintView() {
    var i = album.indexOf(viewing), n = album.length;
    el.viewImg.src = viewing.url || viewing.thumb;
    el.viewImg.alt = viewing.name;
    var d = new Date(viewing.t);
    el.viewName.textContent = viewing.name + '  ·  ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + (i >= 0 ? '  ·  ' + (n - i) + ' of ' + n : '');
    el.viewPrev.style.visibility = i >= 0 && i < n - 1 ? '' : 'hidden';
    el.viewNext.style.visibility = i > 0 ? '' : 'hidden';
  }
  function paintButton() {
    if (el.btn) el.btn.textContent = '📷 PHOTOS' + (album.length ? ' (' + album.length + ')' : '');
  }
  function paintAuto() {
    if (el.auto) el.auto.textContent = 'AUTO-DOWNLOAD: ' + (prefs().photoAuto ? 'ON' : 'OFF');
  }
  function renderAlbum() {
    if (!el.grid) return;
    el.grid.innerHTML = '';
    el.empty.style.display = album.length ? 'none' : '';
    for (var i = album.length - 1; i >= 0; i--) (function (shot) {
      var card = document.createElement('div');
      card.className = 'ph-card';
      var im = document.createElement('img');
      im.src = shot.thumb; im.alt = shot.name;
      var when = document.createElement('div');
      when.className = 'ph-when';
      var dt = new Date(shot.t);
      when.textContent = pad(dt.getHours()) + ':' + pad(dt.getMinutes());
      var save = document.createElement('span');
      save.className = 'mbtn ph-save'; save.textContent = '⤓ SAVE';
      var del = document.createElement('span');
      del.className = 'mbtn ph-del'; del.textContent = '✕';
      tap(save, function () { download(shot); });
      tap(del, function () { forget(shot); renderAlbum(); paintButton(); });
      // the photo itself opens it full size (a click only: a touchend here
      // would also be the end of a swipe scrolling the album)
      card.addEventListener('click', function (e) { e.preventDefault(); openView(shot); });
      card.appendChild(im); card.appendChild(when); card.appendChild(save); card.appendChild(del);
      el.grid.appendChild(card);
    })(album[i]);
  }
  function tap(node, fn) {
    ['click', 'touchend'].forEach(function (ev) {
      node.addEventListener(ev, function (e) { e.preventDefault(); e.stopPropagation(); fn(); });
    });
  }
  function openAlbum() {
    albumOpen = true;
    focus = 0;
    paintAuto();
    renderAlbum();
    paintFocus();
    if (el.album) el.album.style.display = 'flex';
  }
  function closeAlbum() {
    albumOpen = false;
    if (el.album) el.album.style.display = 'none';
  }
  // keys while the album is up — the keyboard and a pad's d-pad and A/B
  // (controls.js maps them onto these): the arrows walk the photos, newest
  // first, Enter opens the lit one full size, Esc puts the album away. With
  // one open full size: the arrows walk the album, Enter downloads it, Esc
  // closes it.
  var focus = 0;
  function paintFocus() {
    var cards = el.grid ? el.grid.children : [];
    if (!cards.length) return;
    focus = Math.max(0, Math.min(cards.length - 1, focus));
    for (var i = 0; i < cards.length; i++) cards[i].classList.toggle('kfocus', i === focus);
  }
  function key(code) {
    if (viewing) {
      if (code === 'Escape' || code === 'Backspace') closeView();
      else if (code === 'Enter' || code === 'Space') download(viewing);
      else if (code === 'ArrowRight' || code === 'ArrowDown') stepView(1);
      else if (code === 'ArrowLeft' || code === 'ArrowUp') stepView(-1);
      return true;
    }
    if (!albumOpen) return false;
    if (code === 'Escape') { closeAlbum(); return true; }
    var n = album.length;
    if (code === 'ArrowRight' || code === 'ArrowDown') focus++;
    else if (code === 'ArrowLeft' || code === 'ArrowUp') focus--;
    else if ((code === 'Enter' || code === 'Space') && n) { openView(album[n - 1 - Math.max(0, Math.min(n - 1, focus))]); return true; }
    paintFocus();
    return true;
  }

  function init() {
    el.shutter = $('shutter');
    el.toast = $('photo-toast'); el.toastImg = $('photo-toast-img'); el.toastText = $('photo-toast-text');
    el.album = $('photo-album'); el.grid = $('photo-grid'); el.empty = $('photo-empty');
    el.btn = $('pause-photos'); el.auto = $('photo-auto');
    if (el.btn) tap(el.btn, openAlbum);
    if (el.auto) tap(el.auto, function () { prefs().photoAuto = !prefs().photoAuto; if (GAME.save) GAME.save(); paintAuto(); });
    var all = $('photo-all');
    if (all) tap(all, function () { album.forEach(function (s, i) { setTimeout(function () { download(s); }, i * 250); }); });
    var close = $('photo-close');
    if (close) tap(close, closeAlbum);
    el.view = $('photo-view'); el.viewImg = $('photo-view-img'); el.viewName = $('photo-view-name');
    el.viewPrev = $('photo-view-prev'); el.viewNext = $('photo-view-next');
    if (el.view) {
      tap($('photo-view-save'), function () { if (viewing) download(viewing); });
      tap($('photo-view-close'), closeView);
      tap(el.viewPrev, function () { stepView(-1); });
      tap(el.viewNext, function () { stepView(1); });
      // the dark around the photo closes it, as it does on any lightbox
      el.view.addEventListener('click', function (e) { if (e.target === el.view) closeView(); });
    }
    // the print that slid in: tap or click it to see the photo full size
    // (only while it is out: hidden, it takes no clicks — see #photo-toast)
    if (el.toast) el.toast.addEventListener('click', function (e) { e.preventDefault(); if (toastShot) openView(toastShot); });
    paintButton();
    restore();
  }

  function update(dt) {
    if (GAME.keyPressed('KeyC') || (GAME.input.touch && GAME.input.touch.photo)) {
      if (GAME.input.touch) GAME.input.touch.photo = false;
      snap();
    }
    // V: the last photo, full size (the print can't be clicked while the
    // mouse is aiming)
    if (GAME.keyPressed('KeyV') && album.length) openView(album[album.length - 1]);
    if (toastT > 0) {
      toastT -= dt;
      if (toastT <= 0 && el.toast) el.toast.classList.remove('on');
    }
  }

  return {
    init: init, update: update, snap: snap, capture: capture, grab: grab, key: key,
    open: openAlbum, close: closeAlbum, download: download,
    view: openView, closeView: closeView,
    get albumOpen() { return albumOpen; },
    get viewing() { return viewing; },
    get count() { return album.length; },
    get pending() { return pending; },
    // headless: the shots themselves; and the album dropped from memory and
    // read back from the browser's store, the way a fresh visit finds it
    album: function () { return album; },
    testReload: function () {
      album.forEach(function (sh) { if (sh.url) URL.revokeObjectURL(sh.url); });
      album.length = 0;
      restore();
    }
  };
})();
