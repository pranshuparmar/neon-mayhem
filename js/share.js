// Result cards. Finishing something worth finishing draws a picture of it that
// the player can hand to someone else — saved, copied, or passed to the OS
// share sheet. Everything is drawn here on a canvas, so it works offline and
// carries no assets.
GAME.share = (function () {
  var W = 1000, H = 560;
  var el = {}, canvas = null, ctx = null, lastBlob = null, current = null;

  function $(id) { return document.getElementById(id); }

  function init() {
    ['share-screen', 'share-canvas', 'share-send', 'share-save', 'share-copy', 'share-close', 'share-note']
      .forEach(function (id) { el[id] = $(id); });
    canvas = el['share-canvas'];
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    // A card is a 1000x560 bitmap, 2.2 MB, and it is only ever on screen for
    // a moment. It is sized when one is shown and let go of when it closes,
    // rather than held for the rest of the session after the first one.
    canvas.width = canvas.height = 0;
    el['share-close'].addEventListener('click', hide);
    el['share-save'].addEventListener('click', save);
    el['share-copy'].addEventListener('click', copy);
    el['share-send'].addEventListener('click', send);
    // the OS share sheet is not everywhere; only offer it where it exists
    if (!navigator.share) el['share-send'].style.display = 'none';
    if (!navigator.clipboard || !window.ClipboardItem) el['share-copy'].style.display = 'none';
  }

  // ---------- drawing ----------
  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  function drawBackdrop(g, accent) {
    var sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#140a2e');
    sky.addColorStop(0.45, '#3a1350');
    sky.addColorStop(0.62, '#7a1e5a');
    sky.addColorStop(0.72, '#12081f');
    sky.addColorStop(1, '#08040f');
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);

    // low sun, banded the way the era liked it
    var hz = H * 0.66, sr = 104;
    g.save();
    g.beginPath(); g.rect(0, 0, W, hz); g.clip();
    var sun = g.createLinearGradient(0, hz - sr, 0, hz);
    sun.addColorStop(0, '#ffd76a');
    sun.addColorStop(0.55, accent);
    sun.addColorStop(1, '#ff2f7a');
    g.fillStyle = sun;
    g.beginPath(); g.arc(W * 0.5, hz, sr, Math.PI, Math.PI * 2); g.fill();
    // bands painted back in with the sky itself. Cutting them with
    // destination-out erased the alpha as well, leaving the finished card
    // see-through wherever the sun was banded.
    g.fillStyle = sky;
    for (var by = 0; by < 6; by++) {
      var yy = hz - 14 - by * 17;
      g.fillRect(W * 0.5 - sr, yy, sr * 2, 3 + by * 1.4);
    }
    g.restore();

    // perspective floor
    g.strokeStyle = 'rgba(120,225,255,0.30)';
    g.lineWidth = 1.4;
    for (var i = -11; i <= 11; i++) {
      g.beginPath();
      g.moveTo(W / 2 + i * 26, hz);
      g.lineTo(W / 2 + i * 300, H);
      g.stroke();
    }
    for (var k = 0, yy2 = hz; yy2 < H; k++) {
      yy2 = hz + Math.pow(k, 2.1) * 2.6;
      g.beginPath(); g.moveTo(0, yy2); g.lineTo(W, yy2); g.stroke();
    }

    // skyline
    g.fillStyle = '#0b0618';
    var seed = 7;
    function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
    for (var x = -10; x < W + 10;) {
      var bw = 26 + rnd() * 46, bh = 40 + rnd() * 120;
      g.fillRect(x, hz - bh, bw, bh);
      x += bw + 6;
    }
    g.strokeStyle = 'rgba(255,47,122,0.55)';
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, hz); g.lineTo(W, hz); g.stroke();
  }

  function fitText(g, text, max, start, weight, style) {
    var size = start;
    do {
      g.font = (style || '') + ' ' + (weight || 900) + ' ' + size + 'px "Segoe UI","Helvetica Neue",Arial,sans-serif';
      if (g.measureText(text).width <= max) break;
      size -= 2;
    } while (size > 14);
    return size;
  }

  function draw(o) {
    var g = ctx, accent = o.accent || '#ff2f7a';
    g.clearRect(0, 0, W, H);
    drawBackdrop(g, accent);

    // eyebrow
    g.textAlign = 'center';
    g.fillStyle = 'rgba(190,230,255,0.9)';
    g.font = '700 20px "Segoe UI","Helvetica Neue",Arial,sans-serif';
    g.letterSpacing = '6px';
    g.fillText((o.eyebrow || 'COSTA ROSA · 1986').toUpperCase(), W / 2, 58);
    g.letterSpacing = '0px';

    // headline
    var hs = fitText(g, o.title, W - 120, 78, 900, 'italic');
    g.save();
    g.shadowColor = accent;
    g.shadowBlur = 34;
    g.fillStyle = '#ffffff';
    g.font = 'italic 900 ' + hs + 'px "Segoe UI","Helvetica Neue",Arial,sans-serif';
    g.letterSpacing = '2px';
    g.fillText(o.title, W / 2, 150);
    g.letterSpacing = '0px';
    g.restore();

    if (o.subtitle) {
      var ss = fitText(g, o.subtitle, W - 180, 26, 600);
      g.fillStyle = '#ffd9ee';
      g.font = '600 ' + ss + 'px "Segoe UI","Helvetica Neue",Arial,sans-serif';
      g.fillText(o.subtitle, W / 2, 194);
    }

    // stat chips
    var stats = (o.stats || []).slice(0, 4);
    if (stats.length) {
      var gap = 20;
      var cw = Math.min(214, (W - 90 - (stats.length - 1) * gap) / stats.length);
      var total = stats.length * cw + (stats.length - 1) * gap;
      var x0 = (W - total) / 2, y0 = 250, ch = 116;
      for (var i = 0; i < stats.length; i++) {
        var cx = x0 + i * (cw + gap);
        g.fillStyle = 'rgba(8,4,18,0.88)';
        roundRect(g, cx, y0, cw, ch, 16); g.fill();
        g.strokeStyle = 'rgba(120,225,255,0.45)'; g.lineWidth = 2;
        roundRect(g, cx, y0, cw, ch, 16); g.stroke();
        g.fillStyle = 'rgba(160,205,235,0.9)';
        g.font = '700 15px "Segoe UI","Helvetica Neue",Arial,sans-serif';
        g.letterSpacing = '3px';
        g.fillText(String(stats[i].label).toUpperCase(), cx + cw / 2, y0 + 36);
        g.letterSpacing = '0px';
        var vs = fitText(g, String(stats[i].value), cw - 30, 44, 900);
        g.fillStyle = '#ffffff';
        g.save(); g.shadowColor = 'rgba(120,225,255,0.8)'; g.shadowBlur = 16;
        g.font = '900 ' + vs + 'px "Segoe UI","Helvetica Neue",Arial,sans-serif';
        g.fillText(String(stats[i].value), cx + cw / 2, y0 + 88);
        g.restore();
      }
    }

    // footer
    g.fillStyle = 'rgba(8,4,16,0.72)';
    g.fillRect(0, H - 72, W, 72);
    g.strokeStyle = 'rgba(255,47,122,0.5)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, H - 72); g.lineTo(W, H - 72); g.stroke();
    g.textAlign = 'left';
    g.save();
    g.shadowColor = '#ff2f7a'; g.shadowBlur = 18;
    g.fillStyle = '#ffffff';
    g.font = 'italic 900 30px "Segoe UI","Helvetica Neue",Arial,sans-serif';
    g.fillText('NEON MAYHEM', 34, H - 26);
    g.restore();
    g.textAlign = 'right';
    g.fillStyle = 'rgba(180,220,245,0.92)';
    g.font = '600 18px "Segoe UI","Helvetica Neue",Arial,sans-serif';
    g.letterSpacing = '2px';
    g.fillText(shareUrl(), W - 34, H - 27);
    g.letterSpacing = '0px';
    g.textAlign = 'left';
  }

  function shareUrl() {
    try {
      var u = location.origin + location.pathname;
      if (/^https?:/.test(u)) return u.replace(/^https?:\/\//, '').replace(/\/index\.html$/, '/');
    } catch (e) { }
    return 'pranshuparmar.github.io/neon-mayhem/';
  }

  // ---------- output ----------
  function toBlob(cb) {
    if (lastBlob) return cb(lastBlob);
    canvas.toBlob(function (b) { lastBlob = b; cb(b); }, 'image/png');
  }
  function fileName() {
    return 'neon-mayhem-' + (current && current.slug ? current.slug : 'result') + '.png';
  }
  function note(text) {
    if (el['share-note']) el['share-note'].textContent = text || '';
  }
  function save() {
    toBlob(function (b) {
      if (!b) return note('Could not build the image.');
      var a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = fileName();
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      note('Saved.');
      GAME.track('result-card-saved');
    });
  }
  function copy() {
    toBlob(function (b) {
      if (!b) return note('Could not build the image.');
      try {
        navigator.clipboard.write([new window.ClipboardItem({ 'image/png': b })])
          .then(function () { note('Copied to the clipboard.'); GAME.track('result-card-copied'); })
          .catch(function () { note('Copy was blocked — save it instead.'); });
      } catch (e) { note('Copy was blocked — save it instead.'); }
    });
  }
  function send() {
    var text = current ? current.title + (current.subtitle ? ' — ' + current.subtitle : '') : 'Neon Mayhem';
    toBlob(function (b) {
      var file = null;
      try { file = new File([b], fileName(), { type: 'image/png' }); } catch (e) { }
      var payload = { title: 'NEON MAYHEM', text: text, url: 'https://' + shareUrl() };
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) payload.files = [file];
      navigator.share(payload).then(function () { note(''); GAME.track('result-card-shared'); }).catch(function () { });
    });
  }

  // ---------- visibility ----------
  function show(o) {
    if (!canvas || !o) return;
    current = o;
    lastBlob = null;
    note('');
    canvas.width = W; canvas.height = H;   // (resizing also resets the context; draw sets all it uses)
    draw(o);
    el['share-screen'].style.display = 'flex';
    GAME.shareOpen = true;
    // hand the mouse back at once — with the pointer still locked, the card's
    // buttons could not be clicked and the browser swallowed the first Esc
    GAME.releasePointer();
    if (GAME.syncOverlayMusic) GAME.syncOverlayMusic();
    GAME.track('result-card-shown');
  }
  function hide() {
    if (!el['share-screen']) return;
    el['share-screen'].style.display = 'none';
    GAME.shareOpen = false;
    lastBlob = null;
    current = null;
    if (canvas) canvas.width = canvas.height = 0;
    if (GAME.syncOverlayMusic) GAME.syncOverlayMusic();
    GAME.regainPointer();
  }

  return { init: init, show: show, hide: hide, get isOpen() { return !!GAME.shareOpen; } };
})();
