// Holding up a shop: walk in, put a gun on whoever is
// behind the counter, and keep it there. Their hands go up and the till
// empties into your pocket for as long as you hold the aim — let it drop, or
// clean them out, and the alarm has already gone: two stars as you leave,
// three if you took a lot. Each shop takes a day to restock its till before
// it is worth robbing again, and a shop you own is never one you rob.
//
// The gun shops, THREADS and the barber can be held up. The Savings & Loan
// is a job of its own (heist.js); the sergeant's desk is not a till.
GAME.robbery = (function () {
  // what a till holds, by trade; how fast it comes over the counter
  var HAUL = { hardware: 1500, dress: 1000, barber: 650 };
  var RATE = 160, FACE = 0.42, REACH = 10;
  var job = null, tipped = false;

  function prefs() { GAME.prefs = GAME.prefs || {}; return GAME.prefs.robbed || (GAME.prefs.robbed = {}); }
  function dayLen() { return GAME.DAY_SECONDS || 720; }
  function room() {
    var r = GAME.interiors && GAME.interiors.current;
    return r && r.kind === 'shop' && HAUL[r.shop] ? r : null;
  }
  function locId() { var l = GAME.interiors && GAME.interiors.loc; return l ? l.id : null; }
  // whoever is behind the counter
  function clerk(r) {
    for (var i = 0; i < r.anim.length; i++) if (r.anim[i].fig) return r.anim[i].fig;
    return null;
  }
  function restocking(id) { return (prefs()[id] || 0) > 0; }
  function ownsIt(id) { return !!(GAME.business && GAME.business.owns && GAME.business.owns(id)); }
  // a gun that can make somebody empty a till: not fists, a blade or a bottle
  function gunInHand() {
    var w = GAME.player.currentWeapon, wd = WEAPONS[w];
    return !!wd && w !== 'fist' && !wd.melee && !wd.thrown;
  }
  // somewhere a gun may be pointed indoors at all (combat.js asks)
  function armedRoom() { return !!room(); }
  function onHim(fig) {
    var P = GAME.player, dx = fig.position.x - P.pos.x, dz = fig.position.z - P.pos.z;
    if (dx * dx + dz * dz > REACH * REACH) return false;
    return Math.abs(U.wrapPI(Math.atan2(dx, dz) - GAME.cam.yaw)) < FACE;
  }

  function begin(r, fig, id) {
    job = { room: r, fig: fig, id: id, took: 0, owed: 0, cap: HAUL[r.shop], t: 0 };
    fig.userData.pose = 'up';
    GAME.audio.yelp(fig.position.x, fig.position.z);
    GAME.hud.message('HANDS UP! — keep the gun on him and the till empties.', 3);
    GAME.hud.missionStart('STORE ROBBERY', '');
    if (GAME.lola && !tipped) { tipped = true; GAME.lola.first('robbery'); }
    if (GAME.track) GAME.track('robbery-' + r.shop);
  }
  function end(why) {
    var j = job;
    job = null;
    if (j.fig) j.fig.userData.pose = null;
    GAME.hud.missionEnd();
    if (j.owed > 0) { GAME.addCash(Math.round(j.owed)); j.owed = 0; }
    prefs()[j.id] = dayLen();
    // the alarm went the moment their hands did: the law is outside
    var stars = j.took >= j.cap * 0.6 ? 3 : 2;
    if (GAME.police.wanted < stars) GAME.police.setWanted(stars);
    GAME.hud.message((why === 'emptied' ? 'TILL EMPTIED' : 'STORE ROBBED') + '  +$' + Math.round(j.took) + '  ·  the alarm\'s gone — get out of here', 4);
    GAME.audio.sting('win');
    if (GAME.save) GAME.save();
  }

  function update(dt) {
    if (!GAME.started) return;
    // tills restock, a day at a time
    var pr = prefs();
    for (var k in pr) if (pr[k] > 0) pr[k] = Math.max(0, pr[k] - dt);
    var P = GAME.player, r = room();
    if (job && (!r || r !== job.room || P.state !== 'alive')) { end('left'); return; }
    if (!r || P.state !== 'alive') return;
    var fig = clerk(r), id = locId();
    if (!fig || !id) return;
    var aimed = GAME.combat.aiming && gunInHand() && onHim(fig);
    if (!job) {
      if (!aimed) return;
      // (not in the middle of somebody else's job)
      if ((GAME.missions && GAME.missions.active) || (GAME.strangers && GAME.strangers.busy) || (GAME.heist && GAME.heist.busy)) return;
      if (ownsIt(id)) { if (GAME.frame % 90 === 0) GAME.hud.message('It\'s your own till, kid. Take it from THE COUNTER.', 2.5); return; }
      if (restocking(id)) { if (GAME.frame % 90 === 0) GAME.hud.message('Cleaned out — this till won\'t be worth it until tomorrow.', 2.5); return; }
      begin(r, fig, id);
      return;
    }
    job.t += dt;
    if (!aimed) { end('stopped'); return; }
    var more = Math.min(RATE * dt, job.cap - job.took);
    job.took += more; job.owed += more;
    // over the counter twenty dollars at a time
    if (job.owed >= 20) { GAME.addCash(Math.floor(job.owed)); job.owed -= Math.floor(job.owed); GAME.audio.cashTick(); }
    GAME.hud.missionObjective('Keep the gun on him  ·  $' + Math.floor(job.took) + ' / $' + job.cap);
    if (job.took >= job.cap) end('emptied');
  }

  return {
    update: update,
    armedRoom: armedRoom,
    get busy() { return !!job; },
    get took() { return job ? job.took : 0; },
    restocking: restocking,
    HAUL: HAUL
  };
})();
