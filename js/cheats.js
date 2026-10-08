// Cheats, the Vice City way: the same words, typed in. Vice City took them
// straight off the keyboard mid-game, but here half the alphabet already does
// something (P is the map, N the night, M the sound), so they are typed into
// CHEATS on the pause screen instead — which a touchscreen's keyboard can
// reach too. A code that is not one is just "nothing happens".
GAME.cheats = (function () {
  var used = 0;
  function P() { return GAME.player; }
  function msg(t) { GAME.hud.message(t, 3); }
  function arm(list) {
    list.forEach(function (w) { GAME.combat.giveWeapon(w[0], w[1]); });
    GAME.combat.selectWeapon(list[list.length - 1][0]);
  }
  // a vehicle of your own, beside you
  function ride(type) {
    var p = P(), f = GAME.focus(), h = p.inCar && p.car ? p.car.heading : p.heading;
    var x = f.x + Math.sin(h + Math.PI / 2) * 5, z = f.z + Math.cos(h + Math.PI / 2) * 5;
    if (GAME.city.isInWater(x, z)) { x = f.x + Math.sin(h) * 7; z = f.z + Math.cos(h) * 7; }
    return GAME.vehicles.spawnCar(type, x, z, h, {});
  }
  var CODES = {
    ASPIRINE: function () { P().health = 100; return 'Health restored'; },
    PRECIOUSPROTECTION: function () { P().armor = 100; return 'Armour'; },
    THUGSTOOLS: function () { arm([['bat'], ['molotov', 10], ['pistol', 100], ['shotgun', 50], ['smg', 200], ['rifle', 50]]); return 'Weapons — the thug\'s set'; },
    PROFESSIONALTOOLS: function () { arm([['knife'], ['grenade', 10], ['pistol', 100], ['shotgun', 50], ['smg', 200], ['rifle', 50], ['sniper', 30]]); return 'Weapons — the professional\'s set'; },
    NUTTERTOOLS: function () { arm([['chainsaw'], ['grenade', 10], ['pistol', 100], ['shotgun', 50], ['smg', 200], ['sniper', 30], ['rocket', 10]]); return 'Weapons — the nutter\'s set'; },
    LEAVEMEALONE: function () { GAME.police.clearWanted(); return 'Wanted level cleared'; },
    YOUWONTTAKEMEALIVE: function () { GAME.police.setWanted(Math.min(GAME.police.MAX_STARS || 6, GAME.police.wanted + 2)); return 'Wanted level up'; },
    PANZER: function () { return ride('tank') ? 'Tank' : null; },
    GETTHEREFAST: function () { return ride('sports') ? 'A fast car' : null; },
    GETTHEREAMAZINGLYFAST: function () { return ride('superbike') ? 'A very fast bike' : null; },
    ROCKANDROLLCAR: function () { return ride('limo') ? 'Limousine' : null; },
    RUBBISHCAR: function () { return ride('van') ? 'A van' : null; },
    BETTERTHANWALKING: function () { return ride('buggy') ? 'A buggy' : null; },
    BIGBANG: function () {
      var f = GAME.focus(), n = 0;
      GAME.world.cars.slice().forEach(function (c) {
        if (c.dead || c === P().car || c.spec.heli || c.spec.plane || c.spec.boat) return;
        if (U.dist2(c.pos.x, c.pos.z, f.x, f.z) > 90 * 90) return;
        GAME.vehicles.explodeCar(c, 'fire', true); n++;
      });
      return n ? 'Everything nearby goes up' : 'Nothing nearby to go up';
    },
    ICANTTAKEITANYMORE: function () { if (GAME.godMode) return null; P().health = 0; GAME.playerWasted('cheat'); return 'Goodbye, cruel world'; },
    ALOVELYDAY: function () { GAME.weather.setMode('clear'); return 'Sunny'; },
    APLEASANTDAY: function () { GAME.weather.setMode('clear'); return 'Fine weather'; },
    CATSANDDOGS: function () { GAME.weather.setMode('rain'); return 'Rain'; },
    LIFEISPASSINGMEBY: function () { GAME.dayPhase = (GAME.dayPhase + 0.25) % 1; return 'Six hours later'; }
  };
  // Enter a code; what it did, or null for nothing
  function enter(text) {
    var code = String(text || '').toUpperCase().replace(/[^A-Z]/g, '');
    var fn = CODES[code];
    if (!fn || !GAME.started || P().state !== 'alive') return null;
    var said = fn();
    if (!said) return null;
    used++;
    GAME.prefs = GAME.prefs || {};
    GAME.prefs.cheats = (GAME.prefs.cheats || 0) + 1;
    GAME.audio.sting('win');
    msg('CHEAT ACTIVATED — ' + said);
    if (GAME.track) GAME.track('cheat-' + code.toLowerCase());
    return said;
  }

  // ---------- the box on the pause screen ----------
  function $(id) { return document.getElementById(id); }
  function open() {
    var box = $('cheat-box'), inp = $('cheat-input');
    if (!box) return;
    GAME.cheatOpen = true;
    box.style.display = 'flex';
    $('cheat-said').textContent = '';
    inp.value = '';
    setTimeout(function () { try { inp.focus(); } catch (e) { } }, 30);
  }
  function close() {
    var box = $('cheat-box');
    if (box) box.style.display = 'none';
    GAME.cheatOpen = false;
    try { $('cheat-input').blur(); } catch (e) { }
  }
  function submit() {
    var inp = $('cheat-input'), said = enter(inp.value);
    $('cheat-said').textContent = said ? '✓ ' + said : 'Nothing happens.';
    inp.value = '';
    if (said) setTimeout(function () { close(); if (GAME.paused) GAME.togglePause(); }, 700);
  }
  function init() {
    var inp = $('cheat-input');
    if (!inp) return;
    inp.addEventListener('keydown', function (e) {
      e.stopPropagation();
      if (e.key === 'Enter') { e.preventDefault(); submit(); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
    });
    ['keyup', 'keypress'].forEach(function (ev) { inp.addEventListener(ev, function (e) { e.stopPropagation(); }); });
    $('cheat-ok').addEventListener('click', function (e) { e.stopPropagation(); submit(); });
    $('cheat-close').addEventListener('click', function (e) { e.stopPropagation(); close(); });
    $('cheat-box').addEventListener('click', function (e) { e.stopPropagation(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  return {
    enter: enter,
    open: open,
    close: close,
    get used() { return used; },
    codes: function () { return Object.keys(CODES); }
  };
})();
