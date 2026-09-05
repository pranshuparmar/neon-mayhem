GAME.hud = (function () {
  var el = {};
  var lastClock = '';
  var shownCash = 0, targetCash = 0;
  var msgT = 0, countT = 0, zoneT = 0, lastZone = '';
  var radioT = 0;
  // the star count as the HUD last drew it, so wantedChanged can tell going up
  // from coming down — nothing that calls it passes the level you were on
  var wantedShown = 0;
  var mapBuffer = null, MAP_S = 0.5, MAP_OX = 520, MAP_OY = 560;
  var MAP_W = 1020, MAP_H = 560;   // world -520..1520 by -560..560, at 0.5 px/m
  var dmgFlash = null;
  var PICKUP_BLIP = {
    pistol: '#eef0ff', smg: '#ffe14f', shotgun: '#ff8a3d',
    health: '#ff4d6a', armor: '#39c8ff', rifle: '#8dffd8'
  };

  function $(id) { return document.getElementById(id); }

  function init() {
    ['minimap', 'clock', 'cash', 'wanted-stars', 'health-fill', 'armor-fill', 'weapon-line', 'radio-popup', 'zone-popup',
      'msg-line', 'count-big', 'poi-hint', 'mission-hud', 'mission-title', 'mission-obj', 'mission-timer', 'title-screen', 'pause-screen',
      'wasted-screen', 'busted-screen', 'fade-layer', 'crt-layer', 'press-enter', 'title-best', 'pause-controls',
      'controls-bar', 'map-screen', 'bigmap', 'map-clear', 'map-close']
      .forEach(function (id) { el[id] = $(id); });
    var stars = '';
    for (var i = 0; i < 5; i++) stars += '<span>★</span>';
    el['wanted-stars'].innerHTML = stars;
    el['pause-controls'].innerHTML = document.getElementById('controls-card').innerHTML;

    dmgFlash = document.createElement('div');
    dmgFlash.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:22;background:radial-gradient(ellipse at center, transparent 55%, rgba(255,30,60,.45) 100%);opacity:0;transition:opacity .35s;';
    document.body.appendChild(dmgFlash);

    buildMapBuffer();
    targetCash = shownCash = GAME.player.cash;
    updateCashText();
    // The trophy shelf, in plain words: how many marked missions have a
    // personal best on file, out of how many exist — "Best runs saved: 7"
    // answered a question nobody asked. While the channel is still closed,
    // the same count doubles as the road to the island, so say that too.
    var bests = GAME.bests || {};
    var defs = (GAME.missions && GAME.missions.DEFS) || [];
    var beaten = 0;
    for (var di = 0; di < defs.length; di++) if (bests[defs[di].id] !== undefined) beaten++;
    if (beaten) {
      var bl = 'Missions beaten: ' + beaten + ' of ' + defs.length;
      if (GAME.isla && !GAME.isla.isOpen()) {
        var need = GAME.isla.required || 4;
        bl += '  ·  ' + Math.min(beaten, need) + ' of ' + need + ' toward the bridges';
      }
      el['title-best'].textContent = bl + '  ·  Cash: $' + GAME.player.cash;
    } else if (GAME.player.cash !== 250) {
      el['title-best'].textContent = 'Cash: $' + GAME.player.cash;
    }

    el['press-enter'].addEventListener('click', function () { GAME.startGame(); });
    el['title-screen'].addEventListener('click', function () { GAME.startGame(); });
    // preventDefault matters: without it the browser follows the touch with a
    // synthetic mousedown ~300ms later — by then the title is hidden, the
    // click lands on the canvas, and the game opened with a punch or a shot
    el['title-screen'].addEventListener('touchend', function (e) { e.preventDefault(); GAME.startGame(); });

    // the in-game dialog's buttons; clicks must not fall through to whatever
    // screen is underneath (the pause screen resumes on any tap)
    ['click', 'touchend'].forEach(function (ev) {
      $('game-modal').addEventListener(ev, function (e) { e.stopPropagation(); e.preventDefault(); });
      $('game-modal-ok').addEventListener(ev, function (e) { e.stopPropagation(); e.preventDefault(); closeDialog(true); });
      $('game-modal-cancel').addEventListener(ev, function (e) { e.stopPropagation(); e.preventDefault(); closeDialog(false); });
    });

    // pause: tap anywhere resumes; buttons stop the bubble
    el['pause-screen'].addEventListener('click', function () { if (GAME.paused) GAME.togglePause(); });
    el['pause-screen'].addEventListener('touchend', function (e) { e.preventDefault(); if (GAME.paused) GAME.togglePause(); });
    function pauseBtn(id, fn) {
      var b = $(id);
      ['click', 'touchend'].forEach(function (ev) {
        b.addEventListener(ev, function (e) { e.stopPropagation(); e.preventDefault(); fn(); });
      });
    }
    pauseBtn('pause-resume', function () { if (GAME.paused) GAME.togglePause(); });
    pauseBtn('pause-map', function () { if (GAME.paused) GAME.togglePause(); api.toggleMap(true); });
    pauseBtn('pause-mute', function () { var m = GAME.audio.toggleMute(); $('pause-mute').textContent = m ? '🔇 MUTED' : '🔊 SOUND'; });
    // music and effects are separate taps: kill the radio and keep the crashes,
    // or the other way round. The choice is remembered.
    function paintAudioBtns() {
      $('pause-music').textContent = GAME.audio.musicOn ? '🎵 MUSIC: ON' : '🎵 MUSIC: OFF';
      $('pause-sfx').textContent = GAME.audio.sfxOn ? '💥 SFX: ON' : '💥 SFX: OFF';
    }
    pauseBtn('pause-music', function () {
      GAME.audio.setMusicOn(!GAME.audio.musicOn);
      if (GAME.prefs) { GAME.prefs.musicOff = !GAME.audio.musicOn; GAME.save(); }
      paintAudioBtns();
    });
    pauseBtn('pause-sfx', function () {
      GAME.audio.setSfxOn(!GAME.audio.sfxOn);
      if (GAME.prefs) { GAME.prefs.sfxOff = !GAME.audio.sfxOn; GAME.save(); }
      paintAudioBtns();
    });
    if (GAME.prefs) {
      if (GAME.prefs.musicOff) GAME.audio.setMusicOn(false);
      if (GAME.prefs.sfxOff) GAME.audio.setSfxOn(false);
    }
    paintAudioBtns();
    // Rumble sits with the other outputs and is remembered the same way. The
    // button only appears where a buzz could actually happen: a phone with the
    // API. Desktop Chrome has navigator.vibrate and no motor to run it, and a
    // switch for something that cannot occur is worse than no switch.
    function paintHapticBtn() {
      $('pause-haptic').textContent = GAME.haptics.on ? '📳 RUMBLE: ON' : '📳 RUMBLE: OFF';
    }
    if (GAME.isTouch && GAME.haptics.available) {
      pauseBtn('pause-haptic', function () {
        GAME.haptics.setOn(!GAME.haptics.on);
        // switching it on and feeling nothing reads as a promise rather than
        // as a thing that happened, so show what was just switched on
        if (GAME.haptics.on) GAME.haptics.demo();
        if (GAME.prefs) { GAME.prefs.rumbleOff = !GAME.haptics.on; GAME.save(); }
        paintHapticBtn();
      });
      if (GAME.prefs && GAME.prefs.rumbleOff) GAME.haptics.setOn(false);
      paintHapticBtn();
    } else {
      $('pause-haptic').style.display = 'none';
    }
    // How much the city fights with itself. A cycle rather than a slider,
    // because the other settings here are all buttons and a five-stop range
    // reads fine as one. It is on every platform: unlike rumble there is
    // nothing device-specific about wanting a quieter street.
    function paintChaosBtn() {
      $('pause-chaos').textContent = '🌆 CITY: ' + GAME.chaos.name;
    }
    pauseBtn('pause-chaos', function () {
      GAME.chaos.cycle();
      if (GAME.prefs) { GAME.prefs.chaos = GAME.chaos.level; GAME.save(); }
      paintChaosBtn();
      GAME.hud.message('City set to ' + GAME.chaos.name + '.', 2);
    });
    if (GAME.prefs && GAME.prefs.chaos !== undefined) GAME.chaos.set(GAME.prefs.chaos);
    paintChaosBtn();

    // Handedness, remembered like the rest. touch.init() runs before the save
    // is read, so the stored choice can only be applied from here — the same
    // reason the rumble switch above reads its pref at this point.
    function paintLeftyBtn() {
      $('pause-lefty').textContent = GAME.touch.lefty ? '🎮 CONTROLS: LEFT' : '🎮 CONTROLS: RIGHT';
    }
    if (GAME.isTouch) {
      pauseBtn('pause-lefty', function () {
        GAME.touch.setLefty(!GAME.touch.lefty);
        if (GAME.prefs) { GAME.prefs.lefty = GAME.touch.lefty; GAME.save(); }
        paintLeftyBtn();
      });
      if (GAME.prefs && GAME.prefs.lefty) GAME.touch.setLefty(true);
      paintLeftyBtn();
    } else {
      $('pause-lefty').style.display = 'none';
    }
    pauseBtn('pause-crt', function () { GAME.hud.toggleCRT(); });
    pauseBtn('pause-day', function () { api.refreshTimeBtn(GAME.cycleTimeMode()); });
    api.refreshTimeBtn(GAME.timeMode);
    // the save travels: export downloads a file, import reads one back and
    // reloads into the imported life
    pauseBtn('pause-export', function () {
      var blob = new Blob([GAME.exportSave()], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'neon-mayhem-save.json';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      GAME.track('save-exported');
    });
    pauseBtn('pause-import', function () {
      // an import is an overwrite: make sure the player knows the life they
      // are living right now is about to be replaced, and offer the way out
      dialog({
        title: 'IMPORT SAVE',
        body: 'Importing REPLACES your current progress — cash, property, garage, your look, everything.\nWant to keep this life? Cancel and use EXPORT SAVE first.',
        ok: 'IMPORT & OVERWRITE', danger: true,
        onOk: function () { $('save-file').click(); }
      });
    });
    pauseBtn('pause-reset', function () {
      // a reset is the import warning with no way back — so it points at the
      // way out first, then asks once more before burning it all down
      dialog({
        title: 'RESET PROGRESS',
        body: 'This erases EVERYTHING — cash, missions, stunt jumps, property, garage, your look. There is no undo.\nWant a backup? Cancel and use EXPORT SAVE first.',
        ok: 'ERASE EVERYTHING', danger: true,
        onOk: function () {
          dialog({
            title: 'LAST CHANCE',
            body: 'Wipe the save and start Costa Rosa from nothing?',
            ok: 'WIPE THE SAVE', danger: true,
            onOk: function () {
              GAME.track('progress-reset');
              try { localStorage.clear(); } catch (e) { }
              location.reload();
            }
          });
        }
      });
    });
    $('save-file').addEventListener('change', function () {
      var f = this.files && this.files[0];
      this.value = '';
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        var r = GAME.importSave(String(rd.result));
        if (r.ok) { GAME.track('save-imported'); location.reload(); }
        else dialog({ title: 'IMPORT FAILED', body: r.why, ok: 'OK', cancel: false });
      };
      rd.readAsText(f);
    });
    pauseBtn('pause-exit', function () { location.reload(); });
    // death screens: tap to skip the wait
    ['wasted-screen', 'busted-screen'].forEach(function (id) {
      ['click', 'touchend'].forEach(function (ev) {
        el[id].addEventListener(ev, function () { GAME.skipScreen = true; });
      });
    });
    // corner fullscreen button
    var fsb = $('fs-btn');
    ['click', 'touchend'].forEach(function (ev) {
      fsb.addEventListener(ev, function (e) { e.stopPropagation(); e.preventDefault(); GAME.toggleFullscreen(); });
    });
    api.refreshFsBtn();
    ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) {
      document.addEventListener(ev, function () { api.refreshFsBtn(); });
    });

    el['bigmap'].addEventListener('click', onMapClick);
    el['map-clear'].addEventListener('click', function () { GAME.nav.clear(); drawBigMap(); });
    el['map-close'].addEventListener('click', function () { api.toggleMap(false); });
    // like the pause screen: a click on the dark around the map closes it
    ['click', 'touchend'].forEach(function (ev) {
      el['map-screen'].addEventListener(ev, function (e) {
        if (e.target === el['map-screen']) { e.preventDefault(); api.toggleMap(false); }
      });
    });

    // legend entries behave like a mixer's solo buttons: tap one to show ONLY
    // that marker family, tap again to show all. The choice persists.
    mapSolo = (GAME.prefs && GAME.prefs.mapSolo) || null;
    refreshLegend();
  }

  // ---------- toggleable legend ----------
  var LEGEND = [
    ['#ff8a3d', 'Race', 'race'], ['#38e8ff', 'Courier', 'courier'], ['#ff4fa3', 'Rampage', 'rampage'],
    ['#c86bff', 'S — Respray', 'respray'], ['#ff8aa8', 'H — Hospital', 'hospital'], ['#5aa0ff', 'P — Police', 'police'],
    ['#eef0ff', 'Weapon', 'weapon'], ['#ff4d6a', 'Health', 'health'], ['#39c8ff', 'Armor', 'armor'],
    ['#8de0ff', '✈ Airport · Ⓗ Helipad', 'airport'], ['#ffd7e4', '☀ Ice cream depot', 'icecream'],
    ['#8de8b0', '$ Shops & property', 'shops'], ['#5dff9e', '⌂ Your safehouse', 'home'],
    ['#ff8aff', 'Destination', 'dest'], ['#ffe14f', 'Objective', 'objective']
  ];
  // Tap-to-SOLO, like muting a mixing desk: tap a legend and everything ELSE
  // is struck — only that category (plus navigation) stays on the map. Tap it
  // again (or tap another) to release/switch. Your destination and the active
  // objective are never filtered: a route you just plotted must always show.
  var mapSolo = null;
  var NAV_ALWAYS = { dest: 1, objective: 1 };
  function catVis(k) { return !!NAV_ALWAYS[k] || !mapSolo || mapSolo === k; }
  function pickupCat(t) { return t === 'health' ? 'health' : t === 'armor' ? 'armor' : 'weapon'; }
  function toggleCat(k) {
    if (NAV_ALWAYS[k]) return;            // navigation rows are labels, not filters
    mapSolo = mapSolo === k ? null : k;
    GAME.prefs = GAME.prefs || {};
    GAME.prefs.mapSolo = mapSolo;
    GAME.save();
    refreshLegend();
    if (GAME.mapOpen) drawBigMap();
  }
  function refreshLegend() {
    var box = $('map-legend');
    box.innerHTML = LEGEND.map(function (e) {
      return '<span class="lgd' + (!catVis(e[2]) ? ' off' : '') + (mapSolo === e[2] ? ' sel' : '') + '" data-k="' + e[2] + '">' +
        '<i style="background:' + e[0] + '"></i>' + e[1] + '</span>';
    }).join('');
    for (var i = 0; i < box.children.length; i++) {
      // taps don't reliably become clicks in this app (same reason the pause
      // screen and fs button bind both); touchend's preventDefault also stops
      // the browser double-firing a synthetic click after it
      ['click', 'touchend'].forEach(function (ev) {
        box.children[i].addEventListener(ev, function (e) {
          e.preventDefault();
          e.stopPropagation();
          toggleCat(this.getAttribute('data-k'));
        });
      });
    }
  }

  // ---------- full-screen map ----------
  var mapScale = 1, mapOffY = 0;
  function drawBigMap() {
    var cv = el.bigmap;
    // short screens hand more of their height to the legend and buttons —
    // a map you can see all of beats a bigger map with the CLOSE button
    // pushed off the bottom
    var hFactor = window.innerHeight < 460 ? 0.52 : 0.68;
    var size = Math.floor(Math.min(window.innerWidth * 0.92, window.innerHeight * hFactor * MAP_W / MAP_H, 900));
    cv.width = size; cv.height = Math.floor(size * MAP_H / MAP_W);
    var g = cv.getContext('2d');
    mapScale = size / MAP_W; mapOffY = 0;
    g.fillStyle = '#141020';
    g.fillRect(0, 0, cv.width, cv.height);
    g.drawImage(mapBuffer, 0, 0, MAP_W * mapScale, MAP_H * mapScale);
    function w2mx(x) { return (x + MAP_OX) * MAP_S * mapScale; }
    function w2my(z) { return mapOffY + (z + MAP_OY) * MAP_S * mapScale; }
    // route + destination
    var P = GAME.player;
    var px = P.inCar && P.car ? P.car.pos.x : P.pos.x;
    var pz = P.inCar && P.car ? P.car.pos.z : P.pos.z;
    if (GAME.nav.dest && catVis('dest')) {
      // an empty path is "no route" (a destination the streets can't reach,
      // e.g. the island while the bridges are closed) — stroking through it
      // drew one confident straight line across the water. Marker only.
      if (GAME.nav.path.length) {
        g.strokeStyle = 'rgba(141,255,216,.95)';
        g.lineWidth = 2.5;
        g.beginPath();
        g.moveTo(w2mx(px), w2my(pz));
        GAME.nav.path.forEach(function (n) { g.lineTo(w2mx(n.x), w2my(n.z)); });
        g.lineTo(w2mx(GAME.nav.dest.x), w2my(GAME.nav.dest.z));
        g.stroke();
      }
      g.fillStyle = '#ff8aff';
      g.beginPath();
      g.arc(w2mx(GAME.nav.dest.x), w2my(GAME.nav.dest.z), 6, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke();
    }
    // active mission route
    var mroute = catVis('objective') ? GAME.missions.getRoutePoints() : null;
    if (mroute && mroute.length) {
      g.strokeStyle = 'rgba(255,138,61,.95)';
      g.lineWidth = 2.5;
      g.beginPath();
      g.moveTo(w2mx(px), w2my(pz));
      for (var mr = 0; mr < mroute.length; mr++) g.lineTo(w2mx(mroute[mr][0]), w2my(mroute[mr][1]));
      g.stroke();
      var mobj2 = GAME.missions.getObjectivePoint();
      if (mobj2) {
        g.fillStyle = '#ffe14f';
        g.beginPath();
        g.arc(w2mx(mobj2[0]), w2my(mobj2[1]), 5, 0, Math.PI * 2);
        g.fill();
      }
    }
    // mission / respray blips
    var mb = GAME.missions.getBlips();
    for (var i = 0; i < mb.length; i++) {
      if (mb[i].kind && !catVis(mb[i].kind)) continue;
      g.fillStyle = mb[i].color;
      g.beginPath();
      g.arc(w2mx(mb[i].x), w2my(mb[i].z), 5, 0, Math.PI * 2);
      g.fill();
    }
    // labelled POI badges
    function badge(x, z, color, letter) {
      g.fillStyle = color;
      g.beginPath();
      g.arc(w2mx(x), w2my(z), 8, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1.2; g.stroke();
      g.fillStyle = '#0c0816';
      g.font = 'bold 11px Arial, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(letter, w2mx(x), w2my(z) + 0.5);
    }
    // weapon / health / armor pickups
    GAME.world.pickups.forEach(function (pk) {
      if (pk.taken || !PICKUP_BLIP[pk.type]) return;
      if (!catVis(pickupCat(pk.type))) return;
      g.fillStyle = PICKUP_BLIP[pk.type];
      g.beginPath();
      g.arc(w2mx(pk.pos.x), w2my(pk.pos.z), 3.5, 0, Math.PI * 2);
      g.fill();
    });
    if (catVis('hospital')) GAME.city.pois.hospitals.forEach(function (hp) { badge(hp.x, hp.z, '#ff8aa8', 'H'); });
    if (catVis('police')) GAME.city.pois.stations.forEach(function (st) { badge(st.x, st.z, '#5aa0ff', 'P'); });
    if (catVis('respray')) GAME.city.pois.resprays.forEach(function (r) { badge(r.door.x, r.door.z, '#c86bff', 'S'); });
    if (GAME.shops) GAME.shops.blips().forEach(function (s) {
      if (!catVis(s.home ? 'home' : 'shops')) return;
      if (!s.home) { badge(s.x, s.z, s.color, s.label); return; }
      // property you OWN is a landmark, not a shop dot: a ringed disc with a
      // drawn house (fonts can't be trusted with ⌂) — the legend does the
      // talking, the way a map should
      var hx = w2mx(s.x), hy = w2my(s.z);
      g.fillStyle = s.color;
      g.beginPath(); g.arc(hx, hy, 11, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#ffffff'; g.lineWidth = 2.2; g.stroke();
      g.fillStyle = '#0c2418';
      g.beginPath();                        // roof
      g.moveTo(hx - 6, hy - 0.5); g.lineTo(hx, hy - 6); g.lineTo(hx + 6, hy - 0.5);
      g.closePath(); g.fill();
      g.fillRect(hx - 4, hy - 0.5, 8, 5.5); // walls
      g.fillStyle = s.color;
      g.fillRect(hx - 1.2, hy + 1.4, 2.4, 3.6); // door
    });
    if (catVis('airport')) badge(GAME.city.airport.apron.x, GAME.city.airport.apron.z, '#8de0ff', '✈');
    if (catVis('icecream') && GAME.city.islaPois) badge(GAME.city.islaPois.factory.x, GAME.city.islaPois.factory.z, '#ffd7e4', '☀');
    // helipad: a ringed cyan disc with an H
    if (catVis('airport')) {
      var hpb = GAME.city.helipad;
      g.fillStyle = '#8de0ff';
      g.beginPath(); g.arc(w2mx(hpb.x), w2my(hpb.z), 8, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#ffffff'; g.lineWidth = 1.5; g.stroke();
      g.strokeStyle = '#0c0816'; g.lineWidth = 2;
      g.beginPath();
      g.moveTo(w2mx(hpb.x) - 3, w2my(hpb.z) - 3.5); g.lineTo(w2mx(hpb.x) - 3, w2my(hpb.z) + 3.5);
      g.moveTo(w2mx(hpb.x) + 3, w2my(hpb.z) - 3.5); g.lineTo(w2mx(hpb.x) + 3, w2my(hpb.z) + 3.5);
      g.moveTo(w2mx(hpb.x) - 3, w2my(hpb.z)); g.lineTo(w2mx(hpb.x) + 3, w2my(hpb.z));
      g.stroke();
    }
    // player arrow
    var h = P.inCar && P.car ? P.car.heading : P.heading;
    g.save();
    g.translate(w2mx(px), w2my(pz));
    g.rotate(-h);
    g.fillStyle = '#ffffff'; g.strokeStyle = '#ff4fa3'; g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(0, 8); g.lineTo(6, -7); g.lineTo(0, -3); g.lineTo(-6, -7);
    g.closePath(); g.fill(); g.stroke();
    g.restore();
    // compass rose — the big map is drawn north-up, and now it says so
    var rcx = cv.width - 42, rcy = 42, RR = 24;
    g.fillStyle = 'rgba(8,4,18,.78)';
    g.beginPath(); g.arc(rcx, rcy, RR + 8, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,105,180,.8)'; g.lineWidth = 1.5;
    g.beginPath(); g.arc(rcx, rcy, RR + 8, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#ff5f8f';                 // the needle's north half
    g.beginPath(); g.moveTo(rcx, rcy - RR + 10); g.lineTo(rcx - 4.5, rcy); g.lineTo(rcx + 4.5, rcy);
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(230,240,255,.4)';    // and its tail
    g.beginPath(); g.moveTo(rcx, rcy + RR - 10); g.lineTo(rcx - 4.5, rcy); g.lineTo(rcx + 4.5, rcy);
    g.closePath(); g.fill();
    g.font = '800 11px "Segoe UI", Arial, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#9df3ff';
    g.fillText('N', rcx, rcy - RR + 2);
    g.fillStyle = 'rgba(207,230,255,.75)';
    g.fillText('E', rcx + RR - 2, rcy);
    g.fillText('S', rcx, rcy + RR - 1);
    g.fillText('W', rcx - RR + 2, rcy);
  }

  function onMapClick(e) {
    var rect = el.bigmap.getBoundingClientRect();
    var cx = e.clientX - rect.left, cy = e.clientY - rect.top;
    var wx = cx / mapScale / MAP_S - MAP_OX;
    var wz = (cy - mapOffY) / mapScale / MAP_S - MAP_OY;
    wx = U.clamp(wx, -495, 1500);
    wz = U.clamp(wz, -540, 540);
    // no charting a course into open sea: a click on the water walks the pin
    // to the nearest road instead (a bridge deck is a fine destination as-is)
    if (GAME.city.isInWater(wx, wz)) {
      var rp = GAME.city.nearestRoadPoint(wx, wz);
      if (GAME.city.isInWater(rp.x, rp.z)) return;   // nothing honest to aim at
      wx = rp.x; wz = rp.z;
    }
    GAME.nav.setDest(wx, wz);
    drawBigMap();
  }

  // ---------- controls hint bar ----------
  var ctlMode = '';
  function refreshControlsBar() {
    if (GAME.isTouch) { el['controls-bar'].style.display = 'none'; return; }
    var hidden = GAME.prefs && GAME.prefs.hideCtl;
    if (!GAME.started || hidden) { el['controls-bar'].style.display = 'none'; ctlMode = ''; return; }
    var mode = GAME.player.parachuting ? 'chute'
      : (GAME.player.inCar && GAME.player.car && GAME.player.car.spec.plane) ? 'plane'
        : (GAME.player.inCar && GAME.player.car && GAME.player.car.spec.heli) ? 'heli'
          : GAME.player.inCar ? 'car' : 'foot';
    if (mode === ctlMode && el['controls-bar'].style.display === 'block') return;
    ctlMode = mode;
    var txt = {
      car: '<b>WASD</b> drive · <b>Space</b> handbrake · <b>Q/E</b> drive-by · <b>F</b> exit · <b>,/.</b> radio · <b>P</b> map · <b>H</b> hide',
      foot: '<b>WASD</b> move · <b>Shift</b> sprint · <b>Space</b> jump · <b>RMB</b> aim · <b>LMB</b> fire · <b>1-5</b> weapons · <b>F</b> enter car · <b>P</b> map · <b>H</b> hide',
      heli: '<b>Space</b> up · <b>Shift</b> down · <b>W/S</b> forward · <b>A/D</b> yaw · <b>F</b> exit / bail out · <b>P</b> map',
      plane: '<b>W/S</b> throttle · <b>Space</b> climb · <b>Shift</b> dive · <b>A/D</b> turn · <b>Q/E</b> barrel roll · <b>F</b> bail out',
      chute: '<b>WASD</b> steer your descent · glide down to land'
    };
    el['controls-bar'].innerHTML = txt[mode];
    el['controls-bar'].style.display = 'block';
  }

  function buildMapBuffer() {
    mapBuffer = document.createElement('canvas');
    mapBuffer.width = MAP_W; mapBuffer.height = MAP_H;
    var g = mapBuffer.getContext('2d');
    function mx(x) { return (x + MAP_OX) * MAP_S; }
    function my(z) { return (z + MAP_OY) * MAP_S; }
    // island: water everywhere, then scan-fill the landmass with a sand rim
    var c = GAME.city;
    g.fillStyle = '#16305a';
    g.fillRect(0, 0, MAP_W, MAP_H);
    // every landmass draws the same way, so a second island needs no second
    // branch here — it is land if some island contains it
    function isLand(x, z) { return !!c.islandAt(x, z); }
    var CELL = 8;
    for (var wx = -520; wx < 1520; wx += CELL) {
      for (var wz = -560; wz < 560; wz += CELL) {
        var cxm = wx + CELL / 2, czm = wz + CELL / 2;
        if (!isLand(cxm, czm)) continue;
        var rim = !isLand(cxm + CELL, czm) || !isLand(cxm - CELL, czm) || !isLand(cxm, czm + CELL) || !isLand(cxm, czm - CELL);
        // relief shading, so the hills read on the map as well as underfoot
        var gy = rim ? 0 : c.groundY(cxm, czm);
        g.fillStyle = rim ? '#8a7a58' : gy > 2
          ? 'rgb(' + Math.round(20 + gy * 1.5) + ',' + Math.round(16 + gy * 2.2) + ',' + Math.round(32 + gy * 0.8) + ')'
          : '#141020';
        g.fillRect(mx(wx), my(wz), CELL * MAP_S + 0.5, CELL * MAP_S + 0.5);
      }
    }
    // east beach band
    g.fillStyle = '#3a3350';
    g.beginPath();
    g.moveTo(mx(368), my(-500));
    for (var z = -500; z <= 500; z += 25) g.lineTo(mx(GAME.city.shoreline(z) - 4), my(z));
    g.lineTo(mx(368), my(500));
    g.closePath();
    g.fill();
    // roads
    g.strokeStyle = '#4a4462';
    g.lineWidth = 5 * MAP_S * 2.4;
    var R = GAME.city.R;
    for (var i = 0; i < R.length; i++) {
      g.beginPath(); g.moveTo(mx(R[i]), my(-480)); g.lineTo(mx(R[i]), my(480)); g.stroke();
      g.beginPath(); g.moveTo(mx(-480), my(R[i])); g.lineTo(mx(350), my(R[i])); g.stroke();
    }
    g.strokeStyle = '#5a5478';
    g.beginPath(); g.moveTo(mx(350), my(-480)); g.lineTo(mx(350), my(480)); g.stroke();
    // Isla Verde: its roads are polylines, so they draw as polylines
    if (GAME.city.isla) {
      var IS = GAME.city.isla;
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.strokeStyle = '#4a4462';
      IS.net.forEach(function (seg) {
        g.lineWidth = Math.max(2, seg.w * MAP_S * 2.0);
        g.beginPath();
        for (var k = 0; k < seg.pts.length; k++) {
          var pt = seg.pts[k];
          if (k) g.lineTo(mx(pt[0]), my(pt[1])); else g.moveTo(mx(pt[0]), my(pt[1]));
        }
        g.stroke();
      });
      // the bridges, in the same pink they are lit in
      g.strokeStyle = '#b8548a'; g.lineWidth = 5;
      IS.spans.forEach(function (sp) {
        g.beginPath();
        for (var k2 = 0; k2 < sp.pts.length; k2++) {
          var q = sp.pts[k2];
          if (k2) g.lineTo(mx(q[0]), my(q[1])); else g.moveTo(mx(q[0]), my(q[1]));
        }
        g.stroke();
      });
      g.lineCap = 'butt'; g.lineJoin = 'miter';
    }
    // piers
    g.strokeStyle = '#6a5a48'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(mx(360), my(250)); g.lineTo(mx(505), my(250)); g.stroke();
    g.beginPath(); g.moveTo(mx(360), my(-180)); g.lineTo(mx(470), my(-180)); g.stroke();
    // airport: fenced apron, a runway strip with a dashed centreline
    var A = GAME.city.airport;
    g.fillStyle = 'rgba(60,66,84,0.55)';
    g.fillRect(mx(A.fx0), my(A.fz0), (A.fx1 - A.fx0) * MAP_S, (A.fz1 - A.fz0) * MAP_S);
    g.strokeStyle = '#7a808e'; g.lineWidth = 1;
    g.strokeRect(mx(A.fx0), my(A.fz0), (A.fx1 - A.fx0) * MAP_S, (A.fz1 - A.fz0) * MAP_S);
    g.fillStyle = '#2a2c34';
    g.fillRect(mx(A.minX), my(A.cz - 13), (A.maxX - A.minX) * MAP_S, 26 * MAP_S);
    g.strokeStyle = '#d8c46a'; g.lineWidth = 1; g.setLineDash([4, 4]);
    g.beginPath(); g.moveTo(mx(A.minX + 8), my(A.cz)); g.lineTo(mx(A.maxX - 8), my(A.cz)); g.stroke();
    g.setLineDash([]);
    // helipad: cyan ring
    var hp = GAME.city.helipad;
    g.strokeStyle = '#8de0ff'; g.lineWidth = 2;
    g.beginPath(); g.arc(mx(hp.x), my(hp.z), 5, 0, Math.PI * 2); g.stroke();
    // POI markers are NOT baked in here: the big map draws them live as
    // legend-filterable badges, and squares burned into the base image sat
    // underneath, immune to the legend's solo/strike
    // the landmasses name themselves, written on the sea below each one
    g.font = 'italic 700 17px "Segoe UI", Arial, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(150,200,240,0.85)';
    g.fillText('ISLA ROSA', mx(-70), my(542));
    if (GAME.city.isla) {
      // just under the island's own southernmost point, wherever that is
      var southZ = -1e9, cxIsla = 0, n = 0;
      for (var la = 0; la < Math.PI * 2; la += 0.05) {
        var q = GAME.city.isla.ringPt(la, 1);
        southZ = Math.max(southZ, q[1]); cxIsla += q[0]; n++;
      }
      g.fillText('ISLA VERDE', mx(cxIsla / n), my(Math.min(southZ + 26, 545)));
    }
  }

  // Where a home you own goes on the radar, and as WHAT.
  //
  // In range it is a dot on its real position. Out of range it becomes an
  // arrow on the rim pointing at it, because the radar's job there is to say
  // which way home is, not to claim it is somewhere it is not. Kept out of
  // the drawing code so the decision can be tested without a canvas.
  //
  // The rim is 90 — the canvas is 180 square, drawn from its centre — and the
  // arrow tip needs room, so the anchor sits at 80 and the point reaches 85.
  var RADAR_RIM = 80;
  function homeMarker(dx, dz, zoom) {
    var rx = dx * MAP_S, rz = dz * MAP_S;
    var rr = Math.sqrt(rx * rx + rz * rz);
    var lim = RADAR_RIM / zoom;
    if (rr <= lim) return { mode: 'dot', x: rx, z: rz, ux: 0, uz: 0, dist: rr };
    var ux = rx / rr, uz = rz / rr;
    return { mode: 'arrow', x: ux * lim, z: uz * lim, ux: ux, uz: uz, dist: rr };
  }

  function drawMinimap() {
    var cv = el.minimap, g = cv.getContext('2d');
    var P = GAME.player;
    var px = P.inCar && P.car ? P.car.pos.x : P.pos.x;
    var pz = P.inCar && P.car ? P.car.pos.z : P.pos.z;
    var h = P.inCar && P.car ? P.car.heading : P.heading;
    g.clearRect(0, 0, 180, 180);
    var zoom = P.inCar ? 0.62 : 0.85;
    g.save();
    g.translate(90, 90);
    // heading-up radar: rotate so the player's forward direction points up
    g.rotate(h - Math.PI);
    g.scale(zoom, zoom);
    g.drawImage(mapBuffer, -(px + MAP_OX) * MAP_S, -(pz + MAP_OY) * MAP_S);
    // blips (drawn in the rotated frame so they track the map)
    function blip(x, z, color, size) {
      g.fillStyle = color;
      g.beginPath();
      g.arc((x - px) * MAP_S, (z - pz) * MAP_S, size, 0, Math.PI * 2);
      g.fill();
    }
    // weapon / health / armor pickups near the player
    var pk = GAME.world.pickups;
    for (var pu = 0; pu < pk.length; pu++) {
      var pp = pk[pu];
      if (pp.taken || !PICKUP_BLIP[pp.type]) continue;
      if (!catVis(pickupCat(pp.type))) continue;
      if (U.dist2(pp.pos.x, pp.pos.z, px, pz) > 150 * 150) continue;
      blip(pp.pos.x, pp.pos.z, PICKUP_BLIP[pp.type], 2.6 / zoom);
    }
    // nearby shops and property, so the doormats are findable from the radar.
    // Homes you own ignore the range gate and wear a white ring — wherever
    // you are, the radar says which way home is.
    if (GAME.shops) {
      var sb = GAME.shops.blips();
      for (var sbi = 0; sbi < sb.length; sbi++) {
        var sbp = sb[sbi];
        if (!catVis(sbp.home ? 'home' : 'shops')) continue;
        if (!sbp.home && U.dist2(sbp.x, sbp.z, px, pz) > 170 * 170) continue;
        if (sbp.home) {
          var hm = homeMarker(sbp.x - px, sbp.z - pz, zoom);
          g.fillStyle = sbp.color;
          if (hm.mode === 'dot') {
            g.beginPath(); g.arc(hm.x, hm.z, 4.4 / zoom, 0, Math.PI * 2); g.fill();
            g.strokeStyle = '#ffffff'; g.lineWidth = 1.6 / zoom; g.stroke();
          } else {
            // Out of range: an ARROW on the rim pointing the way, not a dot.
            //
            // A clamped dot drawn exactly like an in-range one is the same
            // picture as a house sitting that far from you — so as you drove,
            // your property appeared to hold station off your shoulder and
            // then snap onto its real spot the moment it came into range. It
            // was doing what it was told; it just said the wrong thing.
            var s2 = 5.5 / zoom;
            g.beginPath();
            g.moveTo(hm.x + hm.ux * s2, hm.z + hm.uz * s2);
            g.lineTo(hm.x - hm.ux * s2 * 0.55 - hm.uz * s2 * 0.85,
                     hm.z - hm.uz * s2 * 0.55 + hm.ux * s2 * 0.85);
            g.lineTo(hm.x - hm.ux * s2 * 0.55 + hm.uz * s2 * 0.85,
                     hm.z - hm.uz * s2 * 0.55 - hm.ux * s2 * 0.85);
            g.closePath();
            g.fill();
            g.strokeStyle = '#ffffff'; g.lineWidth = 1.2 / zoom; g.stroke();
          }
        } else {
          blip(sbp.x, sbp.z, sbp.color, 3.2 / zoom);
        }
      }
    }
    // active mission route (race checkpoints / current delivery stop)
    var mroute = catVis('objective') ? GAME.missions.getRoutePoints() : null;
    if (mroute && mroute.length) {
      g.strokeStyle = 'rgba(255,138,61,.95)';
      g.lineWidth = 2.4 / zoom;
      g.beginPath();
      g.moveTo(0, 0);
      for (var mr = 0; mr < mroute.length; mr++) g.lineTo((mroute[mr][0] - px) * MAP_S, (mroute[mr][1] - pz) * MAP_S);
      g.stroke();
      var mobj = GAME.missions.getObjectivePoint();
      if (mobj) blip(mobj[0], mobj[1], '#ffe14f', 4.5 / zoom);
    }
    // nav route — same rule as the big map: an empty path strokes nothing,
    // the destination blip alone tells the story
    if (GAME.nav.dest && catVis('dest')) {
      if (GAME.nav.path.length) {
        g.strokeStyle = 'rgba(141,255,216,.95)';
        g.lineWidth = 2.4 / zoom;
        g.beginPath();
        g.moveTo(0, 0);
        var path = GAME.nav.path;
        for (var np = 0; np < path.length; np++) g.lineTo((path[np].x - px) * MAP_S, (path[np].z - pz) * MAP_S);
        g.lineTo((GAME.nav.dest.x - px) * MAP_S, (GAME.nav.dest.z - pz) * MAP_S);
        g.stroke();
      }
      blip(GAME.nav.dest.x, GAME.nav.dest.z, '#ff8aff', 4.5 / zoom);
    }
    var mb = GAME.missions.getBlips();
    for (var i = 0; i < mb.length; i++) {
      if (mb[i].kind && !catVis(mb[i].kind)) continue;
      blip(mb[i].x, mb[i].z, mb[i].color, mb[i].size);
    }
    // airport + helipad landmarks: a ringed cyan blip so they stand out on the radar
    function landmark(x, z) {
      var lx = (x - px) * MAP_S, lz = (z - pz) * MAP_S;
      g.fillStyle = '#8de0ff';
      g.beginPath(); g.arc(lx, lz, 3.4 / zoom, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#ffffff'; g.lineWidth = 1.2 / zoom;
      g.beginPath(); g.arc(lx, lz, 5.6 / zoom, 0, Math.PI * 2); g.stroke();
    }
    // POI dots, live and legend-aware (they used to be baked into the base
    // image, where the legend couldn't touch them)
    if (catVis('hospital')) GAME.city.pois.hospitals.forEach(function (H2) { blip(H2.x, H2.z, '#ff8aa8', 3); });
    if (catVis('police')) GAME.city.pois.stations.forEach(function (st2) { blip(st2.x, st2.z, '#5aa0ff', 3); });
    if (catVis('respray')) GAME.city.pois.resprays.forEach(function (r2) { blip(r2.door.x, r2.door.z, '#c86bff', 3); });
    if (catVis('airport')) {
      landmark(GAME.city.airport.apron.x, GAME.city.airport.apron.z);
      landmark(GAME.city.helipad.x, GAME.city.helipad.z);
    }
    if (catVis('icecream') && GAME.city.islaPois) landmark(GAME.city.islaPois.factory.x, GAME.city.islaPois.factory.z);
    var cars = GAME.world.cars;
    for (var c = 0; c < cars.length; c++) {
      var pc = cars[c];
      // only actively-pursuing cruisers show as blips (not idle/parked ones)
      if (pc.isPolice && !pc.dead && pc.ai && (pc.ai.mode === 'chase' || pc.ai.mode === 'roadblock')) blip(pc.pos.x, pc.pos.z, '#5aa0ff', 3);
    }
    var peds = GAME.world.peds;
    for (var pd = 0; pd < peds.length; pd++) {
      if (peds[pd].isCop && !peds[pd].dead) blip(peds[pd].pos.x, peds[pd].pos.z, '#5aa0ff', 2);
    }
    g.restore();
    // player arrow: fixed, always pointing up (the radar rotates beneath it)
    g.save();
    g.translate(90, 90);
    g.fillStyle = '#ffffff';
    g.strokeStyle = '#ff4fa3';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(0, -8); g.lineTo(6, 6); g.lineTo(0, 2); g.lineTo(-6, 6);
    g.closePath(); g.fill(); g.stroke();
    g.restore();
    // the radar is heading-up, so north moves — ride an N badge around the
    // rim so there is always a sense of direction at a glance
    var nx2 = 90 - 74 * Math.sin(h), ny2 = 90 + 74 * Math.cos(h);
    g.fillStyle = 'rgba(8,4,18,.85)';
    g.beginPath(); g.arc(nx2, ny2, 8, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,105,180,.8)'; g.lineWidth = 1.2;
    g.beginPath(); g.arc(nx2, ny2, 8, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#ffd9f2';
    g.font = '800 10px "Segoe UI", Arial, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('N', nx2, ny2 + 0.5);
  }

  function updateCashText() {
    el.cash.textContent = '$' + Math.floor(shownCash);
  }

  function update(dt) {
    if (!mapBuffer) return;
    GAME.nav.update(dt);
    if (GAME.frame % 3 === 0) drawMinimap();
    if (GAME.frame % 10 === 0) { refreshControlsBar(); api.refreshFsBtn(); }
    // cash tick-up
    if (shownCash !== targetCash) {
      var diff = targetCash - shownCash;
      var step = Math.max(1, Math.abs(diff) * dt * 4);
      shownCash += Math.sign(diff) * Math.min(Math.abs(diff), step);
      if (Math.abs(targetCash - shownCash) < 1) shownCash = targetCash;
      else if (GAME.frame % 4 === 0) GAME.audio.cashTick();
      updateCashText();
    }
    var P = GAME.player;
    // The town clock: dayPhase 0 is midnight, 0.5 is noon, 24 hours around
    // the wheel — pinned day or night freezes it with the sun. The 150 s day
    // makes a raw minute hand a blur (9.6 game-minutes a second), so it
    // reads in ten-minute steps, ticking about once a real second.
    var cm = Math.floor(GAME.dayPhase * 144) * 10 % 1440;
    var ct = (cm < 600 ? '0' : '') + Math.floor(cm / 60) + ':' + (cm % 60 === 0 ? '00' : cm % 60);
    if (ct !== lastClock) { lastClock = ct; el.clock.textContent = ct; }
    el['health-fill'].style.width = U.clamp(P.health, 0, 100) + '%';
    el['armor-fill'].style.width = U.clamp(P.armor, 0, 100) + '%';
    // aircraft wear their condition on the HUD: their damage is otherwise
    // invisible until the explosion, and "wasted out of nowhere" was just a
    // dying airframe nobody could see
    var vl = document.getElementById('vehicle-line');
    if (vl) {
      var av = P.inCar && P.car && (P.car.spec.heli || P.car.spec.plane) ? P.car : null;
      if (av) {
        var af = U.clamp(av.hp / av.spec.hp, 0, 1);
        vl.textContent = 'AIRFRAME ' + Math.round(af * 100) + '%';
        vl.style.color = af > 0.6 ? '#8dffd8' : af > 0.3 ? '#ffd24a' : '#ff5d7a';
        vl.style.display = 'block';
      } else vl.style.display = 'none';
    }
    if (msgT > 0) { msgT -= dt; if (msgT <= 0) el['msg-line'].style.opacity = 0; }
    if (countT > 0) { countT -= dt; if (countT <= 0) el['count-big'].style.opacity = 0; }
    if (radioT > 0) { radioT -= dt; if (radioT <= 0) el['radio-popup'].style.opacity = 0; }
    zoneT -= dt;
    if (zoneT <= 0) {
      zoneT = 2;
      var zf = GAME.focus();
      var zn = GAME.city.districtName(zf.x, zf.z);
      if (zn !== lastZone) {
        lastZone = zn;
        el['zone-popup'].textContent = zn;
        el['zone-popup'].style.opacity = 1;
        setTimeout(function () { el['zone-popup'].style.opacity = 0; }, 2600);
      }
    }
  }

  // ---------- in-game dialog (the game never throws browser popups) ----------
  var dlgOnOk = null;
  function dialog(opts) {
    dlgOnOk = opts.onOk || null;
    $('game-modal-title').textContent = opts.title || '';
    $('game-modal-body').textContent = opts.body || '';
    var ok = $('game-modal-ok'), cancel = $('game-modal-cancel');
    ok.textContent = opts.ok || 'CONFIRM';
    ok.className = 'mbtn' + (opts.danger ? ' danger' : '');
    cancel.style.display = opts.cancel === false ? 'none' : '';
    $('game-modal').style.display = 'flex';
  }
  function closeDialog(confirmed) {
    $('game-modal').style.display = 'none';
    var fn = confirmed ? dlgOnOk : null;
    dlgOnOk = null;
    if (fn) fn();
  }

  var api = {
    init: init,
    update: update,
    dialog: dialog,
    dialogOpen: function () { return !!$('game-modal') && $('game-modal').style.display === 'flex'; },
    dialogKey: function (code) {
      if (code === 'Enter' || code === 'KeyE') closeDialog(true);
      else if (code === 'Escape') closeDialog(false);
    },
    toggleMap: function (force) {
      if (!GAME.started) return;
      var open = force !== undefined ? force : !GAME.mapOpen;
      GAME.mapOpen = open;
      el['map-screen'].style.display = open ? 'flex' : 'none';
      // the sim loop halts while the map is open; syncOverlayMusic below
      // silences every voice the halted tick would otherwise leave held
      if (open) drawBigMap();
      else if (!GAME.paused) GAME.audio.resume(); // don't leave the context suspended
      // the map is a mouse screen: hand the cursor back without touching
      // fullscreen (Esc would drop both, which is why we never make the
      // player reach for it)
      if (open) GAME.releasePointer();
      else GAME.regainPointer();
      if (GAME.syncOverlayMusic) GAME.syncOverlayMusic();
      api.refreshFsBtn();
    },
    mapClear: function () { GAME.nav.clear(); if (GAME.mapOpen) drawBigMap(); },
    redrawMap: function () { if (GAME.mapOpen) drawBigMap(); },
    toggleControlsBar: function () {
      GAME.prefs = GAME.prefs || {};
      GAME.prefs.hideCtl = !GAME.prefs.hideCtl;
      GAME.save();
      ctlMode = '';
      refreshControlsBar();
      return !GAME.prefs.hideCtl;
    },
    cashChanged: function () { targetCash = GAME.player.cash; },
    wantedChanged: function (n) {
      var spans = el['wanted-stars'].children;
      for (var i = 0; i < 5; i++) spans[i].className = i < n ? 'lit' : '';
      // Both police.js paths already funnel through here, so this is the one
      // place that sees every change — but neither of them passes the level
      // you were ON, and the direction is the whole message. Keep it here.
      if (n > wantedShown) GAME.haptics.wantedUp(n);
      else if (n === 0 && wantedShown > 0) GAME.haptics.wantedClear();
      wantedShown = n;
    },
    setWeapon: function (name, ammo) {
      if (!el['weapon-line']) return; // may fire before the HUD is wired up
      el['weapon-line'].textContent = name + (ammo === '' ? '' : '  ·  ' + ammo);
    },
    message: function (text, dur) {
      el['msg-line'].textContent = text;
      el['msg-line'].style.opacity = 1;
      msgT = dur || 2.5;
    },
    // the huge centre numeral for mission countdowns. Callers repeat it every
    // frame while the count runs; it lets go of the screen on its own once
    // they stop (which is how "GO!" gets its moment and then clears itself)
    bigCount: function (text) {
      var e = el['count-big'];
      text = String(text);
      if (e.textContent !== text) e.textContent = text;
      e.style.opacity = 1;
      countT = 0.8;
    },
    radioPopup: function (name) {
      el['radio-popup'].textContent = '♪ ' + name;
      el['radio-popup'].style.opacity = 1;
      radioT = 2.2;
    },
    damageFlash: function () {
      GAME.haptics.hurt();
      dmgFlash.style.opacity = 1;
      setTimeout(function () { dmgFlash.style.opacity = 0; }, 120);
    },
    missionStart: function (title, obj) {
      el['mission-hud'].style.display = 'block';
      el['mission-title'].textContent = title;
      el['mission-obj'].textContent = obj;
      el['mission-timer'].textContent = '';
    },
    missionObjective: function (obj) { el['mission-obj'].textContent = obj; },
    missionTimer: function (t, countdown) {
      var s = Math.max(0, t);
      var mm = Math.floor(s / 60), ss = Math.floor(s % 60);
      el['mission-timer'].textContent = mm + ':' + (ss < 10 ? '0' : '') + ss;
      el['mission-timer'].style.color = countdown && s < 12 ? '#ff5d7a' : '#8dffd8';
    },
    missionEnd: function () { el['mission-hud'].style.display = 'none'; },
    // the corner fullscreen control — available everywhere (menus, portrait
    // overlay and in-game) and hidden only once you're actually fullscreen.
    refreshFsBtn: function () {
      var e = $('fs-btn');
      if (!e) return;
      // always on hand until you're actually fullscreen, then it's redundant
      e.style.display = document.fullscreenElement ? 'none' : 'flex';
    },
    // AUTO runs the day/night cycle; DAY / NIGHT pin it
    refreshTimeBtn: function (mode) {
      var e = $('pause-day');
      if (!e) return;
      e.textContent = mode === 'day' ? '☀ TIME: DAY' : mode === 'night' ? '🌙 TIME: NIGHT' : '🕓 TIME: AUTO';
    },
    // names the POI you're near ('' hides it)
    setPoiHint: function (text) {
      var e = el['poi-hint'];
      if (!e) return;
      if (text) { if (e.textContent !== text) e.textContent = text; e.style.opacity = 1; }
      else e.style.opacity = 0;
    },
    showBig: function (kind, sub) {
      var scr = el[kind + '-screen'];
      scr.style.display = 'flex';
      scr.querySelector('.big-sub').textContent = sub || '';
      var hint = scr.querySelector('.big-hint');
      if (hint) hint.textContent = GAME.isTouch ? 'TAP TO CONTINUE' : 'PRESS R TO CONTINUE';
    },
    hideBig: function () {
      el['wasted-screen'].style.display = 'none';
      el['busted-screen'].style.display = 'none';
    },
    fade: function (cb) {
      el['fade-layer'].style.opacity = 1;
      setTimeout(function () {
        try { cb && cb(); } finally {
          setTimeout(function () { el['fade-layer'].style.opacity = 0; }, 150);
        }
      }, 550);
    },
    // the raw dimmer, for rituals that keep their own time (mission starts
    // count the blackout in game ticks, so pausing pauses it)
    fadeSet: function (v) { el['fade-layer'].style.opacity = v; },
    hideTitle: function () {
      el['title-screen'].style.display = 'none';
      document.getElementById('hud').style.display = 'block';
      api.refreshFsBtn();
    },
    setPaused: function (p) {
      el['pause-screen'].style.display = p ? 'flex' : 'none';
      var sj = $('pause-stunts');
      if (sj && GAME.stunts) {
        sj.textContent = 'STUNT JUMPS  ' + GAME.stunts.found + ' / ' + GAME.stunts.total +
          (GAME.stunts.complete ? '   ·   ALL FOUND' : '');
      }
      // missions alongside the jumps: distinct marked missions finished, and
      // what the count is FOR while the bridges are still shut
      var pm = $('pause-missions');
      if (pm && GAME.missions) {
        var defs = GAME.missions.DEFS, bests = GAME.bests || {}, done = 0;
        for (var mi = 0; mi < defs.length; mi++) if (bests[defs[mi].id] !== undefined) done++;
        var open = !GAME.isla || GAME.isla.isOpen();
        pm.textContent = 'MISSIONS  ' + done + ' / ' + defs.length +
          (open ? (done >= defs.length ? '   ·   ALL DONE' : '') : '   ·   4 OPEN THE BRIDGES');
      }
      api.refreshFsBtn();
    },
    toggleCRT: function () {
      var on = el['crt-layer'].style.display !== 'block';
      el['crt-layer'].style.display = on ? 'block' : 'none';
      return on;
    },
    // headless hook: where a home you own lands on the radar, and as what
    testHomeMarker: homeMarker
  };
  return api;
})();

// destination routing along the road graph
GAME.nav = (function () {
  var dest = null, path = [], recompT = 0;

  function key(n) { return n.id; }

  // Dijkstra over edge length along the road-node graph; [{x,z}...] start->goal.
  // Hop-count BFS minimized the wrong thing once the island joined: its lane
  // links run ~34 m against the mainland's ~100 m blocks, so "fewest edges"
  // biased routes onto fewer-but-longer mainland legs. Metres win now. The
  // graph is a few hundred nodes and this runs at most every 1.5 s, so the
  // heapless closest-first scan is comfortably inside budget.
  function roadPath(x0, z0, x1, z1) {
    var start = GAME.city.nearestNode(x0, z0);
    var goal = GAME.city.nearestNode(x1, z1);
    if (!start || !goal) return [];
    // a closed bridge doesn't route: while the gates are down the spans are
    // off the graph, so a cross-channel destination degrades to a stub at
    // the far end instead of a confident line through the police barrier
    var gated = GAME.isla && !GAME.isla.isOpen();
    var dist = {}, prev = {}, done = {}, open = [start];
    dist[key(start)] = 0; prev[key(start)] = null;
    while (open.length) {
      var bi = 0;
      for (var i = 1; i < open.length; i++) if (dist[key(open[i])] < dist[key(open[bi])]) bi = i;
      var n = open.splice(bi, 1)[0];
      var nk = key(n);
      if (done[nk]) continue;
      done[nk] = true;
      if (n === goal) break;
      var nbs = GAME.city.neighbors(n);
      for (var j = 0; j < nbs.length; j++) {
        var b = nbs[j];
        if (gated && b.span) continue;
        var bk = key(b);
        if (done[bk]) continue;
        var d = dist[nk] + U.dist(n.x, n.z, b.x, b.z);
        if (dist[bk] === undefined || d < dist[bk]) {
          dist[bk] = d; prev[bk] = n;
          open.push(b);
        }
      }
    }
    // an unreached goal is no route at all: the degraded walk-back used to
    // hand back a single far-end stub, and the map drew the player-to-stub
    // connector as a confident schematic line straight across the water
    if (!(key(goal) in prev)) return [];
    var out = [], cur = goal;
    while (cur) { out.unshift({ x: cur.x, z: cur.z }); cur = prev[key(cur)]; }
    return out;
  }

  function computePath() {
    if (!dest) { path = []; return; }
    var P = GAME.player;
    var px = P.inCar && P.car ? P.car.pos.x : P.pos.x;
    var pz = P.inCar && P.car ? P.car.pos.z : P.pos.z;
    // route to the road nearest the destination, then a short hop off the road,
    // so the drawn line stays on the streets instead of cutting through blocks
    var rp = GAME.city.nearestRoadPoint(dest.x, dest.z);
    dest.rx = rp.x; dest.rz = rp.z;
    path = roadPath(px, pz, rp.x, rp.z);
    // no route, no line — the destination marker alone tells the story
    if (path.length) path.push({ x: rp.x, z: rp.z });
  }

  return {
    get dest() { return dest; },
    get path() { return path; },
    roadPath: roadPath,
    setDest: function (x, z) {
      dest = { x: x, z: z };
      computePath();
      GAME.hud.message('Destination set — follow the route.', 2);
    },
    clear: function () { dest = null; path = []; },
    update: function (dt) {
      if (!dest) return;
      recompT -= dt;
      if (recompT <= 0) { recompT = 1.5; computePath(); }
      var P = GAME.player;
      var px = P.inCar && P.car ? P.car.pos.x : P.pos.x;
      var pz = P.inCar && P.car ? P.car.pos.z : P.pos.z;
      // Arrived means near, not on top of. A map click often lands mid-block,
      // somewhere no road passes — so pulling up on the kerb beside it counts,
      // and a car counts from further out than a person walking the last bit.
      var R2 = P.inCar ? 26 * 26 : 12 * 12;
      var dNow = U.dist2(px, pz, dest.x, dest.z);
      var dRoad = dest.rx !== undefined ? U.dist2(px, pz, dest.rx, dest.rz) : 1e18;
      if (dNow < R2 || (dRoad < R2 && dNow < 55 * 55)) {
        dest = null; path = [];
        GAME.hud.message('You have arrived.', 2.5);
        GAME.audio.pickup();
        GAME.haptics.checkpoint();
      }
    }
  };
})();
