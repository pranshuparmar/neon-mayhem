// Unique stunt jumps: 25 ramps hidden around the city. Clear one cleanly and
// it's logged; find them all and the city opens up. Isla Verde has ten of its
// own on a separate tally (and a prize of its own), so the mainland's count —
// and the bridges it can open — is exactly what it always was.
GAME.stunts = (function () {
  var found = {}, total = 25, rewarded = false;
  var islaFound = {}, islaRewarded = false;
  var ISLA_PRIZE = 25000;

  function count() { var n = 0; for (var k in found) if (found[k]) n++; return n; }
  function islaCount() { var n = 0; for (var k in islaFound) if (islaFound[k]) n++; return n; }
  function ramps() { return (GAME.city && GAME.city.ramps) || []; }
  function mainTotal() {
    var r = ramps(), n = 0;
    for (var i = 0; i < r.length; i++) if (!r[i].isla) n++;
    return n || total;
  }
  function islaTotal() {
    var r = ramps(), n = 0;
    for (var i = 0; i < r.length; i++) if (r[i].isla) n++;
    return n;
  }

  // The 25 jumps' prize is the full arsenal: kept through a hospital bed or
  // a cell, refilled for nothing at any hardware counter. It used to be
  // unlimited ammo, which came early (the jumps are a drive round town) and
  // for driving, and once it did it switched off every shootout, every ammo
  // pickup, the gun counter and losing your guns. Unlimited ammo is the
  // prize for finishing everything now (missions.js, full completion). A
  // save that earned it the old way keeps it: its record has no `v`.
  var REWARD_V = 2;
  function load() {
    var s = (GAME.prefs && GAME.prefs.stunts) || null;
    if (s) {
      found = s.found || {}; rewarded = !!s.rewarded;
      islaFound = s.isla || {}; islaRewarded = !!s.islaRewarded;
      if (rewarded && s.v !== REWARD_V) GAME.prefs.ammoForever = true;
    }
    if (rewarded) {
      GAME.jumpArsenal = true;
      GAME.combat.giveAllWeapons(GAME.combat.FULL_LOAD);
      GAME.city.unlockMonsterTruck();   // the truck stays unlocked between sessions
    }
    if (GAME.prefs && GAME.prefs.ammoForever) {
      GAME.unlimitedAmmo = true;
      GAME.combat.giveAllWeapons();
    }
  }
  function save() {
    if (!GAME.prefs) GAME.prefs = {};
    GAME.prefs.stunts = { found: found, rewarded: rewarded, isla: islaFound, islaRewarded: islaRewarded, v: REWARD_V };
    GAME.save();
  }

  // called when a jump that started on ramp `idx` lands successfully
  function credit(idx, airT, dist) {
    if (idx === undefined || idx === null) return 0;
    var ramp = ramps()[idx];
    if (ramp && ramp.idx === idx && ramp.isla) return creditIsla(ramp.islaN);
    total = mainTotal();
    if (found[idx]) return 0;
    found[idx] = true;
    var n = count();
    var bonus = 250 + n * 50;
    GAME.addCash(bonus);
    GAME.audio.sting('win');
    GAME.haptics.win();
    var left = total - n;
    GAME.hud.message('UNIQUE STUNT JUMP  ' + n + ' / ' + total + '   ·   +$' + bonus +
      (left > 0 ? '   —   ' + left + ' more for a special reward' : ''), 4.5);
    GAME.track('stunt-jump-found');
    if (GAME.lola) GAME.lola.first('stunt');
    if (n >= total && !rewarded) grantReward();
    save();
    return bonus;
  }
  // keyed by the island ramp's own number, not its place in the whole list
  function creditIsla(k) {
    if (k === undefined || k < 0 || islaFound[k]) return 0;
    islaFound[k] = true;
    var n = islaCount(), all = islaTotal();
    var bonus = 400 + n * 75;
    GAME.addCash(bonus);
    GAME.audio.sting('win');
    GAME.haptics.win();
    var left = all - n;
    GAME.hud.message('ISLA VERDE STUNT JUMP  ' + n + ' / ' + all + '   ·   +$' + bonus +
      (left > 0 ? '   —   ' + left + ' more on the island' : ''), 4.5);
    GAME.track('isla-stunt-jump-found');
    if (GAME.lola) GAME.lola.first('islaJump');
    if (n >= all && !islaRewarded) {
      islaRewarded = true;
      GAME.addCash(ISLA_PRIZE);
      if (GAME.shops && GAME.shops.grantVehicle) GAME.shops.grantVehicle('buggy');
      GAME.hud.message('ALL ' + all + ' ISLA VERDE JUMPS!  +$' + ISLA_PRIZE.toLocaleString() + '  ·  a DUNE HOPPER joins your garage', 8);
      GAME.track('all-isla-stunt-jumps');
    }
    save();
    return bonus;
  }

  function grantReward() {
    rewarded = true;
    GAME.track('all-stunt-jumps');
    GAME.jumpArsenal = true;
    GAME.combat.giveAllWeapons(GAME.combat.FULL_LOAD);
    GAME.addCash(50000);
    GAME.city.unlockMonsterTruck();
    GAME.hud.message('ALL ' + total + ' STUNT JUMPS!  +$50,000  ·  every weapon, yours to keep, with free refills at the hardware counter  ·  MONSTER TRUCK unlocked at the airport', 8);
    GAME.share.show({
      slug: 'all-stunt-jumps',
      eyebrow: 'Costa Rosa · 1986',
      title: 'ALL ' + total + ' STUNT JUMPS',
      subtitle: 'Every ramp in the city, found and cleared',
      accent: '#ffb03a',
      stats: [
        { label: 'Jumps', value: total + ' / ' + total },
        { label: 'Payout', value: '$50,000' },
        { label: 'Unlocked', value: 'MONSTER TRUCK' },
        { label: 'Arsenal', value: 'KEPT · FREE REFILLS' }
      ]
    });
    // clearing every jump is the other way across the channel
    if (GAME.isla) GAME.isla.checkUnlock();
  }

  return {
    get found() { return count(); },
    get total() { return mainTotal(); },
    get complete() { return rewarded; },
    get islaFound() { return islaCount(); },
    get islaTotal() { return islaTotal(); },
    // nothing to find over there is nothing left to find
    get islaComplete() { return islaRewarded || islaTotal() === 0; },
    load: load, credit: credit,
    isFound: function (i) {
      var r = ramps()[i];
      return r && r.isla ? !!islaFound[r.islaN] : !!found[i];
    }
  };
})();

GAME.missions = (function () {
  var DEFS = [
    {
      id: 'race0', type: 'race', name: 'STRIP SPRINT', reward: 500, start: { x: 350, z: -350 },
      cps: [[350, -150], [350, 50], [350, 250], [250, 350], [150, 250], [150, 50]]
    },
    {
      id: 'race1', type: 'race', name: 'HARBOR LOOP', reward: 550, start: { x: -450, z: -100 },
      cps: [[-450, 150], [-350, 250], [-250, 350], [-150, 250], [-150, 50], [-250, -50], [-350, -50]]
    },
    {
      id: 'race2', type: 'race', name: 'DOWNTOWN DASH', reward: 600, start: { x: 50, z: 250 },
      cps: [[50, 50], [150, -50], [50, -250], [-50, -350], [-150, -250], [-150, -50], [-50, 50]]
    },
    // courier drops are generated fresh each run (see rollCourierStops)
    // Courier clocks are set from the stopwatch, not from generosity: the
    // sampled routes run 2.3-2.9 km and the race rivals prove ~22 m/s is what
    // "competitive" means on these streets, so each clock is that drive plus
    // a fifth for traffic and corners. A flat-out clean run beats them
    // narrowly; a stroll does not finish.
    { id: 'courier0', type: 'courier', name: 'HOT PLATES', reward: 300, time: 130, start: { x: 158.4, z: 41.6 }, drops: 4, legMin: 330, legMax: 720 },
    { id: 'courier1', type: 'courier', name: 'NIGHT MAIL', reward: 320, time: 130, start: { x: -241.6, z: -41.6 }, drops: 4, legMin: 360, legMax: 780 },
    // (BEACH RUN is the first job Lola shows a new player, and it sat sixty
    // metres from where a new game starts: in and out of the ring before the
    // first drive was a drive. It waits a few blocks in off the strip, by
    // the Malibu, now — the best part of half a kilometre and three turns.)
    { id: 'courier2', type: 'courier', name: 'BEACH RUN', reward: 340, time: 115, start: { x: 204, z: 225 }, drops: 4, legMin: 300, legMax: 660 },
    { id: 'rampage0', type: 'rampage', name: 'STRIP HAVOC', reward: 400, time: 30, target: 3000, weapon: 'smg', ammo: 160, start: { x: 241.6, z: -258.4 } },
    { id: 'rampage1', type: 'rampage', name: 'HARBOR HAVOC', reward: 450, time: 30, target: 3500, weapon: 'shotgun', ammo: 30, start: { x: -341.6, z: 258.4 } },
    { id: 'rampage2', type: 'rampage', name: 'UPTOWN HAVOC', reward: 400, time: 30, target: 2500, weapon: 'smg', ammo: 160, start: { x: 41.6, z: -341.6 } },
    // On the water, in the bay between the beach and the channel: both start
    // beside a mooring where a boat waits, and both are run in one.
    //   BAY REGATTA — out under both bridges (through the gaps between their
    //   piers, where the deck is high), round a mark past the far one and
    //   home; every leg is open water, so the field races the line.
    //   CONTRABAND — packages a fishing crew dumped overboard when the
    //   coastguard came by, bobbing about the bay: fish them out and bring
    //   them in to the pier before the clock runs out. Fresh spots each run.
    {
      id: 'boat0', type: 'race', boat: true, name: 'BAY REGATTA', reward: 700, start: { x: 515, z: 215 },
      cps: [[518, 150], [520, 0], [500, -180], [499, -340], [520, -440], [545, -340], [530, -180], [530, 0], [518, 150], [530, 230]]
    },
    { id: 'boat1', type: 'courier', boat: true, name: 'CONTRABAND', reward: 520, time: 120, start: { x: 472, z: -150 }, drops: 3, legMin: 200, legMax: 380 },
    // Isla Verde's own work, and it stays over here — every checkpoint, drop
    // and target is on the island, so nothing ever asks you to cross mid-run.
    // Coordinates come from the island itself once it has registered.
    { id: 'race3', type: 'race', name: 'ALTA VERDE CLIMB', reward: 750, isla: 'climb', start: null, cps: null },
    { id: 'race4', type: 'race', name: 'MIRADOR RUN', reward: 800, isla: 'mirador', start: null, cps: null },
    { id: 'courier3', type: 'courier', name: 'COLD CHAIN', reward: 420, time: 180, isla: 'port', start: null, drops: 4, legMin: 330, legMax: 720 },
    { id: 'rampage3', type: 'rampage', name: 'DORADO HAVOC', reward: 550, time: 30, target: 3200, weapon: 'smg', ammo: 160, isla: 'dorado', start: null },
    // Takedowns: somebody in a car, somewhere out in the traffic, who has to
    // stop being a problem before the clock runs out. They drive about until
    // they see you, then run — and some of them shoot back.
    //   car    what they drive        armor  hit points, as a multiple
    //   flee   their speed once made  shoots whether they fire back ('hurt':
    //                                        once you have hurt the car)
    //   early  running from the off (they know you are coming)
    //   foot   how much of him there is once he is out of it
    //   ledger he has something of Lola's on him, and somebody wants it back
    // The car is locked while he is in it, and nobody hands it over: wreck it
    // or knock it about till he bails — and then he comes at you with a gun.
    // The job is done when HE is.
    { id: 'hit0', type: 'takedown', name: 'THE COLLECTOR', reward: 1200, time: 150, car: 'limo', armor: 2.15, flee: 19, shoots: true, early: false, foot: 70, start: { x: 250, z: 350 } },
    { id: 'hit1', type: 'takedown', name: 'LOOSE ENDS', reward: 1000, time: 110, car: 'sports', armor: 1.15, flee: 24, shoots: 'hurt', early: true, foot: 45, ledger: true, start: { x: -50, z: -150 } },
    { id: 'hit2', type: 'takedown', name: 'HIGH TIDE', reward: 2000, time: 160, car: 'pickup', armor: 2.85, flee: 21, shoots: true, early: false, foot: 100, isla: 'marina', start: null, flees: true }
  ];

  // Lola Reyes runs the strip, and she is who the rings on your map are
  // from: a line from her when a job starts, a word when it is done the
  // first time, and the story of the two islands strung between them —
  // Rico Salazar's crew pushing in on her harbour, and pushed back out.
  var LOLA = {
    boat0: ['The yacht club thinks the bay is theirs. Take one of the boats by the pier and show them whose it is.',
      'Sailing types don\'t lose gracefully. Enjoy it.'],
    boat1: ['A crew dumped a cargo of mine over the side when the coastguard came sniffing. Fish it out of the bay before it drifts.',
      'Every package, dry enough to sell. You\'re handy on the water, kid.'],
    race0: ['New in town? Then nobody knows your name. The strip racers will — win this and they stop laughing.',
      'Not bad, kid. People are asking who you are. Let\'s give them more to talk about.'],
    race1: ['The harbour crews run a loop past the warehouses every night. Beat them on their own turf.',
      'The harbour\'s buzzing about you. The Salazar boys aren\'t happy. Good.'],
    race2: ['Downtown money likes a show. Give them one — first past the last gate.',
      'Now the suits know your face too. That cuts both ways, so be careful.'],
    courier0: ['A friend needs some plates moved before the cops run them. Every stop, against the clock.',
      'Plates gone, friend happy, you richer. That\'s how this works.'],
    courier1: ['Envelopes. Don\'t open them. Don\'t be late.',
      'Not one envelope opened. I knew I liked you.'],
    courier2: ['The beach bars need their "supplies" before the lunch crowd. Drive.',
      'Every bar on the sand pays me now — and so, a little, you.'],
    rampage0: ['Somebody\'s selling on my strip without asking. Make a mess they\'ll remember.',
      'Message received, I\'d say. Nobody\'s selling there tonight.'],
    rampage1: ['Rico Salazar\'s people moved into my warehouses. Show them what that costs.',
      'The Salazars are packing. The harbour\'s quiet again.'],
    rampage2: ['Uptown thinks it\'s above all this. Remind them.',
      'Uptown remembers now.'],
    hit0: ['Rico\'s collector drives a black limo round MY strip, picking up MY money. Put him out of business — he shoots back.',
      'No more collections. Rico will be furious, and furious men make mistakes.'],
    hit1: ['A Salazar bookkeeper is skipping town with my ledger, in something fast. He already knows you\'re coming, and he\'s scared enough to shoot. Stop him and bring me that book.',
      'The ledger\'s home. Rico has nothing left on the mainland — he\'s run for Isla Verde.'],
    race3: ['Isla Verde\'s rich kids race the Alta Verde switchbacks. Beat them to the top and the island hears your name.',
      'Top of the hill. Rico heard that one.'],
    race4: ['The Mirador loop: fast, blind, and a long way down. Win it.',
      'Still in one piece? Then you won. Nicely done.'],
    courier3: ['The ice cream factory moves more than ice cream. Keep it cold and keep it moving.',
      'Delivered cold. The factory belongs to us now.'],
    rampage3: ['Rico\'s holed up in Puerto Dorado. Shake his new home until it falls on him.',
      'He\'s out of friends over there. Not out of boats.'],
    hit2: ['Rico himself, in a black pickup, heading for the marina and a boat out at high tide. This ends today.',
      'It\'s over. Costa Rosa\'s ours, kid — both islands. Enjoy the view.']
  };
  function lola(text, dur) { if (text && GAME.hud.pager) GAME.hud.pager('LOLA', text, dur); }
  function rico(text, dur) { if (text && GAME.hud.pager) GAME.hud.pager('RICO', text, dur); }

  // And the same story told face to face (scenes.js): the cut to Lola's
  // lock-up before a job you have not done yet, her and you at the roll-up
  // door. What she pages above is what she says here, in more words — the
  // pager line is still how a job you have done before starts, and how all
  // of them start with the scenes switched off. Rico gets his own cut to the
  // marina on Isla Verde, once he has run there.
  var SCENES = {
    race0: [['lola', 'New in town? Then nobody knows your name yet.'],
      ['you', 'Is that a problem?'],
      ['lola', 'It\'s an opportunity. The strip racers meet tonight — win, and they stop laughing.']],
    race1: [['lola', 'The harbour crews run a loop past the warehouses every night.'],
      ['you', 'Whose crews?'],
      ['lola', 'Rico Salazar\'s. Beat them on their own turf, kid, and let him hear about it.']],
    race2: [['lola', 'Downtown money likes a show. The suits bet on these races like it\'s the stock market.'],
      ['you', 'And you?'],
      ['lola', 'I bet on you. First past the last gate — don\'t make me look stupid.']],
    courier0: [['lola', 'A friend needs some plates moved before the cops run them.'],
      ['you', 'How many stops?'],
      ['lola', 'All of them, against the clock. Don\'t sightsee.']],
    courier1: [['lola', 'Envelopes. Don\'t open them.'],
      ['you', 'What\'s in them?'],
      ['lola', 'That was opening them, kid. And don\'t be late.']],
    courier2: [['lola', 'The beach bars need their "supplies" before the lunch crowd.'],
      ['you', 'Supplies.'],
      ['lola', 'Ice. Limes. Napkins. Whatever helps you sleep — just drive.']],
    rampage0: [['lola', 'Somebody\'s selling on my strip without asking.'],
      ['you', 'Want me to ask them to stop?'],
      ['lola', 'Make a mess they\'ll remember. That IS asking, round here.']],
    rampage1: [['lola', 'Rico Salazar\'s people moved into my warehouses last night. Walked in like they had the keys.'],
      ['you', 'Did they?'],
      ['lola', 'They had bolt cutters. Show them what that costs.']],
    rampage2: [['lola', 'Uptown thinks it\'s above all this. Doormen, tennis clubs, private security.'],
      ['you', 'And?'],
      ['lola', 'And they buy from the same people everybody does. Remind them.']],
    boat0: [['lola', 'The yacht club thinks the bay is theirs.'],
      ['you', 'I\'ve never sailed.'],
      ['lola', 'Neither have they — they pay people. Take a boat off the pier and show them whose bay it is.']],
    boat1: [['lola', 'A crew of mine dumped a cargo over the side when the coastguard came sniffing.'],
      ['you', 'And it floats?'],
      ['lola', 'Wrapped tight, it floats. Fish it out of the bay before it drifts to Havana.']],
    hit0: [['lola', 'Rico\'s collector drives a black limo round MY strip, picking up MY money.'],
      ['you', 'You want it back?'],
      ['lola', 'I want him out of business. Careful, kid — he shoots back.']],
    hit1: [['lola', 'A Salazar bookkeeper is skipping town with my ledger. Names, numbers — everybody I pay.'],
      ['you', 'Skipping in what?'],
      ['lola', 'Something fast. He knows you\'re coming and he\'s scared enough to shoot. Stop him and bring me that book.']],
    race3: [['lola', 'Isla Verde\'s rich kids race the Alta Verde switchbacks.'],
      ['you', 'On Rico\'s island.'],
      ['lola', 'For now. Beat them to the top and the whole island hears your name.']],
    race4: [['lola', 'The Mirador loop. Fast, blind, and a long way down.'],
      ['you', 'Any advice?'],
      ['lola', 'Win it. Second place is a long fall.']],
    courier3: [['lola', 'The ice cream factory moves more than ice cream.'],
      ['you', 'I figured.'],
      ['lola', 'Then figure this: it melts. Keep it cold and keep it moving.']],
    rampage3: { shots: [
      { set: 'marina', cast: ['rico', 'manny'], lines: [
        ['rico', 'She sends a kid. Lola Reyes sends a KID to take my island.'],
        ['manny', 'He took the hill, boss. And the factory.'],
        ['rico', 'Then Puerto Dorado is where he stops. Tell the boys.']] },
      { set: 'lockup', cast: ['lola', 'you'], lines: [
        ['lola', 'Rico\'s holed up in Puerto Dorado, and he thinks it\'s a fortress.'],
        ['you', 'Is it?'],
        ['lola', 'Shake it and find out. Bring it down on him.']] }] },
    hit2: { shots: [
      { set: 'marina', cast: ['rico', 'manny'], lines: [
        ['manny', 'Boat\'s fuelled, boss. Tide turns at six.'],
        ['rico', 'Load the pickup. Costa Rosa can keep its sunshine.'],
        ['rico', 'And if the kid shows up — he doesn\'t leave the marina.']] },
      { set: 'lockup', cast: ['lola', 'you'], lines: [
        ['lola', 'Rico\'s running. A black pickup, heading for the marina and a boat out at high tide.'],
        ['you', 'Then I\'d better be early.'],
        ['lola', 'This ends today, kid. Both islands.']] }] }
  };
  for (var sk in SCENES) SCENES[sk].id = sk;
  // What comes after each job's own part (see "the acts after the job"
  // below). The races bring sore losers or the law, the deliveries a sting
  // in the tail, the rampages the people behind the mess, and the island's
  // last two the men at the top. HIGH TIDE ends on the marina.
  var THUG = { shirt: 0x2a2a34, pants: 0x1a1a22, skin: 0xc89878, hair: 'crew', hairCol: 0x141210 };
  function marinaQuay() {
    var M = GAME.isla && GAME.isla.pois ? GAME.isla.pois().marina : null;
    return M ? { x: M.x + 10, z: M.z - 4 } : { x: active.def.start.x, z: active.def.start.z };
  }
  var ACTS = {
    race1: [{ kind: 'heavies', time: 150, say: 'The harbour boys don\'t lose quietly — a black sedan is coming for you.',
      lola: 'Salazar\'s racers want their pride back. Don\'t give it to them.', obj: 'Wreck the sore losers', late: 'They lost you — and they\'ll tell it differently.' }],
    race2: [{ kind: 'heat', stars: 2, say: 'Somebody downtown called it in.',
      lola: 'Cops at the finish — some suit lost his shirt on you. Lose them.', obj: 'Lose the cops' }],
    courier0: [{ kind: 'heat', stars: 2, say: 'The last stop was being watched — the plates were hot.', obj: 'Lose the cops' }],
    courier1: [{ kind: 'heavies', time: 150, say: 'One of those envelopes was Rico\'s. His men want it back.',
      lola: 'You opened one, didn\'t you? No? Then Rico\'s men are just rude. Deal with them.', obj: 'Rico\'s men want their envelope' }],
    courier2: [{ kind: 'deliver', time: 150, say: 'The bars paid up.', lola: 'Bring me the takings at the lock-up, kid. All of them.',
      obj: 'The takings to Lola\'s lock-up', late: 'Out of time — Lola counts that as stealing.' }],
    rampage0: [{ kind: 'heavies', time: 150, say: 'The seller had friends, and they\'re on their way.', obj: 'His friends — put them down' }],
    rampage1: [{ kind: 'crew', at: 'start', men: 3, boss: 'foreman', bossLook: { shirt: 0xd8c070, pants: 0x3a3a44, skin: 0xb98260, hair: 'mullet', hairCol: 0x2a1a10 }, bossHp: 110,
      time: 180, say: 'Salazar\'s foreman is still in the warehouse office.', lola: 'The foreman stayed. Make him wish he hadn\'t.',
      obj: 'The foreman and his crew', lost: 'The foreman slipped out the back.' }],
    rampage2: [{ kind: 'heat', stars: 3, say: 'Uptown has the police on speed dial.', obj: 'Lose the cops' }],
    boat1: [{ kind: 'heat', stars: 2, say: 'The coastguard is back — and this time they saw you.', obj: 'Lose the harbour patrol' }],
    hit0: [{ kind: 'grab', at: 'here', color: 0x2a2a30, say: 'He dropped the collection bag.', obj: 'Take back the bag', got: 'Lola\'s money — every envelope he picked up.' },
      { kind: 'deliver', time: 150, heavies: true, heavyT: 10, lola: 'That\'s my money. The lock-up, kid, before Rico sends somebody for it.',
        obj: 'The bag to Lola\'s lock-up', late: 'Out of time — the money never made it.' }],
    race3: [{ kind: 'heavies', time: 150, rico: 'Told you. My boys were waiting at the top.', obj: 'Rico\'s boys, at the top of the hill' }],
    courier3: [{ kind: 'heat', stars: 2, say: 'The port police want to see inside the van.', obj: 'Lose the port police' }],
    rampage3: [{ kind: 'crew', at: 'start', men: 4, boss: 'lieutenant', bossLook: { shirt: 0x8a1a2a, pants: 0x1a1a22, skin: 0x9a6a48, hair: 'pompadour', hairCol: 0x0e0c0c }, bossHp: 140,
      time: 200, rico: 'You want Dorado, kid? My lieutenant says come and take it.', obj: 'Rico\'s lieutenant and his men', lost: 'The lieutenant got away.' }],
    hit2: [
      { kind: 'scene', script: function () {
        return active.ricoDead
          ? { id: 'hightide-manny', shots: [{ set: null, lines: [['manny', 'The boss is gone! Everybody — the marina, now!']] }] }
          : { id: 'hightide-run', shots: [{ set: null, lines: [['rico', 'Manny! Start the boat!'], ['manny', 'The marina, boss — go, go!'], ['you', 'Not on this tide.']] }] };
      } },
      { kind: 'crew', at: marinaQuay, boss: function () { return active.ricoDead ? null : 'rico'; }, second: 'manny', men: 3, bossHp: 180,
        time: 200, say: 'Rico\'s making his stand on the marina.', obj: 'Rico and his crew, on the marina', lost: 'Rico got out on the tide.' },
      { kind: 'scene', script: { id: 'hightide-end', shots: [{ set: 'lockup', cast: ['lola', 'you'], lines: [
        ['lola', 'So that\'s Rico Salazar. Gone on his own marina.'],
        ['you', 'He should have taken the boat earlier.'],
        ['lola', 'Both islands are ours, kid. Go and enjoy the view — you earned it.']] }] } }
    ]
  };
  DEFS.forEach(function (d) { if (ACTS[d.id]) d.then = ACTS[d.id]; });
  // Rico has his say too, by pager, the first time a job of yours costs him
  var RICO = {
    rampage1: 'Those were MY warehouses for one night. Enjoy them while you can, kid.',
    hit0: 'My collector. You took my collector. I\'ll remember your face — I\'m very good with faces.',
    race3: 'You like my hills? Come up them again. My boys will be waiting at the top.'
  };

  // Island mission anchors, resolved after the island registers. A race's
  // checkpoints are road points around a named loop, so the route follows the
  // curves instead of cutting across a hillside.
  function placeIslaDefs() {
    if (!GAME.city.isla) return;
    var I = GAME.city.isla, tx = I.tx, tz = I.tz;
    function onRoad(x, z) {
      var rp = GAME.city.nearestRoadPoint(x, z);
      return [Math.round(rp.x), Math.round(rp.z)];
    }
    // a point a fraction of the way along a road's polyline, by length rather
    // than by vertex count — the switchback legs are sampled evenly in ANGLE,
    // so their outer vertices are further apart than their inner ones
    // Gate spacing, in metres of road. The hill wants them tight — its legs
    // are short and its bends are 20-130 m radius — where the ring is one long
    // sweep and can carry them further apart for the same straightness.
    var CP_SPACING = 70, RING_SPACING = 110;
    function legLength(leg) {
      var pts = leg.pts, d = 0;
      for (var i = 1; i < pts.length; i++) {
        d += Math.sqrt(U.dist2(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]));
      }
      return d;
    }
    function alongLeg(leg, t) {
      var pts = leg.pts, cum = [0], i;
      for (i = 1; i < pts.length; i++) {
        cum.push(cum[i - 1] + Math.sqrt(U.dist2(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1])));
      }
      var want = cum[cum.length - 1] * U.clamp(t, 0, 1);
      for (i = 1; i < cum.length; i++) {
        if (cum[i] >= want) {
          var f = (want - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
          return [Math.round(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f),
                  Math.round(pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f)];
        }
      }
      var last = pts[pts.length - 1];
      return [Math.round(last[0]), Math.round(last[1])];
    }
    function ringLoop(f, a0, n) {
      var out = [];
      for (var i = 0; i < n; i++) {
        var q = I.ringPt(a0 + i / n * Math.PI * 2, f);
        out.push(onRoad(q[0], q[1]));
      }
      return out;
    }
    DEFS.forEach(function (d) {
      if (!d.isla) return;
      if (d.isla === 'climb') {
        // Straight off the switchback's own legs, foot to summit.
        //
        // These were five hand-written points snapped with nearestRoadPoint,
        // and every one of them landed somewhere else: the start on a PORT
        // road at sea level three hundred metres from the hill, the second
        // checkpoint forty metres off its mark and out on the COAST RING. The
        // route it described was port, up to a hill connector, back down to
        // the shore, then up — which is the "wrong way and then no road" it
        // played as. Snapping to the nearest road cannot tell you it picked
        // the wrong road; it has no idea which one you meant.
        //
        // Spaced by LENGTH along each leg, so consecutive checkpoints sit on
        // the same arc and the straight line between them stays on the tarmac.
        // That is what stops the climb being skippable: with one gate per leg
        // the hairpins land on opposite sides of the hill and the line between
        // them runs straight across the hillside. The outer legs are nearly
        // three times the length of the inner ones, so a fixed count per leg
        // leaves the same hole at the bottom — measured, the line strays 65 m
        // off-road with the old route, 14 m at two per leg, 7 m at this
        // spacing, and the road is 11 m wide.
        var legs = I.climb || [];
        if (legs.length) {
          var cps = [];
          legs.forEach(function (leg, li) {
            var n = Math.max(1, Math.ceil(legLength(leg) / CP_SPACING));
            for (var k = 1; k <= n; k++) cps.push(alongLeg(leg, k / n));
          });
          d.cps = cps;
          var foot = alongLeg(legs[0], 0);
          d.start = { x: foot[0], z: foot[1] };
        }
      } else if (d.isla === 'mirador') {
        // A lap of the coastal ring, gated along the road rather than around
        // the compass. Seven points spread evenly in ANGLE over a 2.2 km ring
        // put 320 m between gates, and the straight line between two of them
        // cut 61 m inland — across ground that is open, dry and drivable, so
        // the lap was quicker not driven. Same lesson as the hill climb: even
        // in angle is not even along the road, and the gaps decide whether
        // there is a shortcut to find.
        var ring = I.ring;
        if (ring) {
          var n = Math.max(6, Math.round(legLength(ring) / RING_SPACING));
          var lap = [];
          // phase kept where the old start marker stood, a tenth of a turn in
          for (var g = 0; g < n; g++) lap.push(alongLeg(ring, (g / n + 0.05) % 1));
          d.start = { x: lap[0][0], z: lap[0][1] };
          d.cps = lap.slice(1).concat([lap[0]]);
        }
      } else if (d.isla === 'port') {
        var st = onRoad(tx(860), tz(100));
        d.start = { x: st[0], z: st[1] };
      } else if (d.isla === 'marina') {
        // up the hill from the marina, where the target is heading
        var M = GAME.isla.pois().marina;
        var sm = onRoad(M.x + 60, M.z + 110);
        d.start = { x: sm[0], z: sm[1] };
      } else {
        var sd = onRoad(tx(800), tz(130));
        d.start = { x: sd[0], z: sd[1] };
      }
    });
  }

  var active = null;
  var markers = [];
  var cpMarker = null;
  var resprayCooldown = 0;

  var MARKER_COLORS = { race: 0xff8a3d, courier: 0x38e8ff, rampage: 0xff4fa3, takedown: 0xff3b3b };
  var MARKER_HEX = {};
  Object.keys(MARKER_COLORS).forEach(function (k) { MARKER_HEX[k] = '#' + MARKER_COLORS[k].toString(16).padStart(6, '0'); });
  // The radar asks for the blips twenty times a second, so the list and its
  // entries are kept and rewritten instead of built new: a caller reads it
  // straight away and never keeps it. (Written by index and cut to length at
  // the end: emptied with `length = 0` it would drop its storage every time.)
  var blipList = [], blipPool = [], blipN = 0;
  // `name` and `done` are for the big map: a mission marker is labelled, and
  // one you have beaten is drawn as such rather than like a new one
  function putBlip(x, z, color, size, kind, name, done) {
    var b = blipPool[blipN] || (blipPool[blipN] = {});
    b.x = x; b.z = z; b.color = color; b.size = size; b.kind = kind;
    b.name = name || ''; b.done = !!done;
    blipList[blipN++] = b;
  }
  var TYPE_LABEL = { race: 'STREET RACE', courier: 'COURIER RUN', rampage: 'RAMPAGE', takedown: 'TAKEDOWN' };
  var BOAT_LABEL = { race: 'BOAT RACE', courier: 'SEA RUN' };
  function typeLabel(d) { return (d.boat && BOAT_LABEL[d.type]) || TYPE_LABEL[d.type]; }
  // the POI line's words for a marker (kind 1) or a respray door (kind 2),
  // made again only when what is nearest, or its note, changes
  var HINT_NOTES = ['', '   —   lose the heat first', '   —   come back in a vehicle',
    '   —   not in an aircraft', '   —   starting…', '   —   pull up in the ring to start',
    '   —   leave the ring to go again', '   —   come back in a boat'];
  // A car mission starts when you pull up in its ring, not when you drive
  // through it: race starts sit on the road, so cruising the Strip pulled
  // people into BEACH RUN at 25 m/s with no way to say no.
  var START_SPEED = 4;
  // the most heat a passed rampage leaves you with (see finish)
  var RAMPAGE_HEAT_LEFT = 2;
  // and the one that just ended waits until you have left it — failing a race
  // you sat out on its own start line used to start it again on the next tick
  var leaveFirst = null, REARM_R2 = 9 * 9;
  var hintK = 0, hintO = null, hintN = -1, hintText = '';
  function poiHintText(k, o, n) {
    if (k !== hintK || o !== hintO || n !== hintN) {
      hintK = k; hintO = o; hintN = n;
      hintText = k === 1 ? typeLabel(o) + ' · ' + o.name + HINT_NOTES[n]
        : 'RESPRAY · $100 — repairs your ride; fresh paint clears up to two stars' + (n ? '' : '   —   drive in');
    }
    return hintText;
  }

  function makeMarkerMesh(color, r) {
    var m = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, 3.4, 18, 1, true),
      new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.4, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    return m;
  }

  // A job you start in a vehicle starts where a vehicle can get to. Three of
  // the mainland's sat on the pavement, eight to fourteen metres off the
  // road behind its palms and lamp posts, while the ring takes a vehicle
  // within four and a half — BEACH RUN was out on the boardwalk, and from
  // the lane nobody could reach it. They are brought to the kerbside lane.
  var KERB_LANE = 3;
  function reachableStarts() {
    for (var i = 0; i < DEFS.length; i++) {
      var d = DEFS[i];
      if (!d.start || d.type === 'rampage' || d.boat) continue;
      var rp = GAME.city.nearestRoadPoint(d.start.x, d.start.z);
      var dx = d.start.x - rp.x, dz = d.start.z - rp.z, dl = Math.sqrt(dx * dx + dz * dz);
      if (dl <= KERB_LANE + 0.5) continue;
      d.start = { x: rp.x + dx / dl * KERB_LANE, z: rp.z + dz / dl * KERB_LANE };
    }
  }

  function init() {
    placeIslaDefs();
    reachableStarts();
    for (var i = 0; i < DEFS.length; i++) {
      var d = DEFS[i];
      if (d.isla && !d.start) continue;      // island never registered
      var mesh = makeMarkerMesh(MARKER_COLORS[d.type], d.boat ? 3.4 : 2.2);
      mesh.position.set(d.start.x, markerFloor(d, d.start.x, d.start.z) + 1.7, d.start.z);
      GAME.scene.add(mesh);
      markers.push({ def: d, mesh: mesh });
    }
    cpMarker = makeMarkerMesh(0xffe14f, 3.2);
    cpMarker.visible = false;
    GAME.scene.add(cpMarker);
    // respray markers
    GAME.city.pois.resprays.forEach(function (g) {
      var rm = makeMarkerMesh(0xc86bff, 3.0);
      rm.position.set(g.door.x - 4, 1.7, g.door.z);
      GAME.scene.add(rm);
    });
  }

  function bestKey(d) { return d.id; }

  // island work only shows up once the bridges are open
  function defAvailable(d) { return !d.isla || (GAME.isla && GAME.isla.isOpen()); }

  // a kerbside spot between minR and maxR of the origin. Verifies the result is
  // actually that far away — snapping to the road grid can pull a point much
  // closer than the radius asked for, which made every fare a short hop.
  function randomRoadPoint(fromX, fromZ, minR, maxR) {
    var best = null, bestErr = 1e18;
    // '' means over water — which includes a BRIDGE DECK. A crossing connects
    // two landmasses, so a run started mid-bridge may be sent to either side.
    // Comparing every candidate against '' used to reject them all, and the
    // fallback then returned the caller's own position: a taxi shift started
    // on a bridge kept declaring the driver to be the pickup, and the ped it
    // spawned at their feet promptly vanished — "your fare is gone", forever.
    var fromIsle = GAME.city.islandIdAt(fromX, fromZ);
    for (var t = 0; t < 60; t++) {
      var a = Math.random() * Math.PI * 2, r = U.randRange(Math.random, minR, maxR);
      var rp = GAME.city.nearestRoadPoint(fromX + Math.cos(a) * r, fromZ + Math.sin(a) * r);
      // the mainland grid has hard edges; the island answers for its own roads
      if (rp.axis !== 'net' && (rp.x < -470 || rp.x > 352 || Math.abs(rp.z) > 470)) continue;
      if (GAME.city.isInWater(rp.x, rp.z)) continue;
      // stay on the landmass you started on: a courier leg that crosses the
      // channel is not a delivery run, it is a swim
      if (fromIsle && GAME.city.islandIdAt(rp.x, rp.z) !== fromIsle) continue;
      // nudge onto the sidewalk edge, clear of the driving lanes
      var sgn = Math.random() < 0.5 ? 1 : -1;
      var off = rp.axis === 'net' ? [Math.cos(rp.heading) * 9 * sgn, -Math.sin(rp.heading) * 9 * sgn]
        : rp.axis === 'z' ? [9 * sgn, 0] : [0, 9 * sgn];
      var px = Math.round(rp.x + off[0]), pz = Math.round(rp.z + off[1]);
      // a marker part-way up a stunt ramp is a stop you cannot pull in at
      if (!offRamp(px, pz)) continue;
      var d = U.dist(px, pz, fromX, fromZ);
      if (d >= minR && d <= maxR) return [px, pz];
      // keep the closest near-miss in case nothing lands inside the band
      var err = d < minR ? minR - d : d - maxR;
      if (err < bestErr) { bestErr = err; best = [px, pz]; }
    }
    if (best) return best;
    // last resort: a real road point, never the caller's own position
    var fb = GAME.city.nearestRoadPoint(fromX, fromZ);
    return [Math.round(fb.x), Math.round(fb.z)];
  }

  // a route that stays on the streets: road-graph nodes, then in along the
  // nearest road line, then a short hop to the exact marker (never across a block)
  function roadRoute(fromX, fromZ, toX, toZ) {
    var rp = GAME.city.nearestRoadPoint(toX, toZ);
    var nodes = GAME.nav.roadPath(fromX, fromZ, rp.x, rp.z);
    var pts = [];
    for (var i = 0; i < nodes.length; i++) pts.push([nodes[i].x, nodes[i].z]);
    pts.push([rp.x, rp.z]);
    pts.push([toX, toZ]);
    return pts;
  }

  // lay out a fresh delivery round: each drop is a leg away from the last, kept
  // apart from the others so the run covers ground instead of doubling back
  // Packages adrift in the bay: open water a boat can reach, clear of the
  // piers and the bridge legs, spread out, each leg a fresh length — and the
  // last stop is home, the pier the run started from.
  var SEA_BOX = { x0: 474, x1: 548, z0: -455, z1: 455 };
  function seaSpotClear(x, z) {
    var C = GAME.city;
    if (!C.isBoatWater(x, z) || !C.isBoatWater(x + 6, z) || !C.isBoatWater(x - 6, z) ||
      !C.isBoatWater(x, z + 6) || !C.isBoatWater(x, z - 6)) return false;
    for (var i = 0; i < C.bridgePiers.length; i++) {
      if (U.dist2(x, z, C.bridgePiers[i].x, C.bridgePiers[i].z) < 16 * 16) return false;
    }
    return true;
  }
  function rollSeaStops(def) {
    var stops = [], cx = def.start.x, cz = def.start.z;
    for (var i = 0; i < (def.drops || 3); i++) {
      var pt = null;
      for (var t = 0; t < 60 && !pt; t++) {
        var x = U.randRange(Math.random, SEA_BOX.x0, SEA_BOX.x1), z = U.randRange(Math.random, SEA_BOX.z0, SEA_BOX.z1);
        var d = Math.sqrt(U.dist2(cx, cz, x, z));
        if (d < def.legMin * (t < 40 ? 1 : 0.6) || d > def.legMax * (t < 40 ? 1 : 1.5)) continue;
        if (!seaSpotClear(x, z)) continue;
        var near = false;
        for (var j = 0; j < stops.length; j++) if (U.dist2(x, z, stops[j][0], stops[j][1]) < 90 * 90) near = true;
        if (!near) pt = [x, z];
      }
      if (!pt) pt = [U.clamp(cx, SEA_BOX.x0, SEA_BOX.x1), cz > 0 ? cz - 200 : cz + 200];
      stops.push(pt);
      cx = pt[0]; cz = pt[1];
    }
    stops.push([def.start.x, def.start.z]);   // and bring them in
    return stops;
  }

  // The package on the water at the current pickup: a crate with a float
  // lashed to it, bobbing on the swell (a ring alone said "go here", not
  // "pick this up").
  var crate = null;
  function placeCrate() {
    var a = active, show = !!(a && a.def.boat && a.def.type === 'courier' && a.stops && a.cpIndex < a.stops.length - 1);
    if (!show) { if (crate) crate.visible = false; return; }
    if (!crate) {
      var b = new GeoBatch();
      b.addBox(0, 0.3, 0, 1.0, 0.6, 0.8, 0, 0x7a5a36, 0);
      b.addBox(0, 0.32, 0, 1.02, 0.12, 0.82, 0, 0x2a2a30, 0);
      b.addBox(0.62, 0.35, 0, 0.32, 0.32, 0.32, 0, 0xff7a1a, 0);
      crate = new THREE.Mesh(b.build(), sharedVertexLambert());
      GAME.scene.add(crate);
    }
    var st = a.stops[a.cpIndex];
    crate.visible = true;
    crate.position.set(st[0], GAME.city.seaLevel, st[1]);
  }
  function bobCrate() {
    if (!crate || !crate.visible) return;
    var t = GAME.time;
    crate.position.y = GAME.city.seaY(crate.position.x, crate.position.z) - 0.18;
    crate.rotation.set(Math.sin(t * 1.3) * 0.12, t * 0.25, Math.sin(t * 1.7) * 0.1);
  }

  function rollCourierStops(def) {
    if (def.boat) return rollSeaStops(def);
    var stops = [];
    var cx = def.start.x, cz = def.start.z;
    // Each leg draws its own length inside the run's band rather than every
    // leg using the same one, so the same delivery is a different shape each
    // time you take it instead of the same lap with the pins moved.
    var lo0 = def.legMin || 110, hi0 = def.legMax || 240;
    for (var i = 0; i < (def.drops || 4); i++) {
      var lo = U.randRange(Math.random, lo0 * 0.7, lo0 * 1.25);
      var hi = U.randRange(Math.random, Math.max(lo + 70, hi0 * 0.75), hi0 * 1.45);
      var pt = null;
      for (var t = 0; t < 16; t++) {
        var c = randomRoadPoint(cx, cz, lo, hi);
        var ok = true;
        for (var j = 0; j < stops.length; j++) {
          if (U.dist2(c[0], c[1], stops[j][0], stops[j][1]) < 70 * 70) { ok = false; break; }
        }
        if (U.dist2(c[0], c[1], def.start.x, def.start.z) < 60 * 60) ok = false;
        if (ok) { pt = c; break; }
      }
      if (!pt) pt = randomRoadPoint(cx, cz, lo, hi);
      stops.push(pt);
      cx = pt[0]; cz = pt[1];
    }
    return stops;
  }

  // ---------- the ice cream round ----------
  // Isla Verde's own shift. You drive, the chimes play, and people come out to
  // the hatch when you stop. Each level wants more sales in the time you have.
  function startIceCream() {
    var P = GAME.player;
    GAME.track('job-started-icecream');
    clearIceServed();   // belt and braces: a fresh shift owes nobody history
    active = {
      def: { type: 'icecream', name: 'ICE CREAM ROUND', id: 'icecream', job: true },
      state: 'run', t: 0, cpIndex: 0, score: 0, racers: [],
      phase: 'sell', level: 1, sales: 0, quota: 4, jobCount: 0, earned: 0,
      targets: [], timeLeft: 60, callT: 0, routeCp: null
    };
    setMarkersVisible(false);
    updateCp();
    GAME.hud.missionStart(active.def.name, objectiveText());
    GAME.hud.message('Round 1 — sell 4 before the clock runs out. Pull up where there are people on the pavement and sound the horn (' + hornKey() +
      '): the chimes bring them to the hatch. Leave the truck to clock off.', 6);
    GAME.audio.pickup();
  }

  // ---------- vigilante ----------
  // A stolen cruiser had no job of its own: a white car with a lightbar,
  // nothing more. J in one now calls in a suspect somewhere out there. Close
  // on them and they run; wreck their car, or knock it about until they give
  // up on it and bail. Each one taken off the street pays more than the last
  // — and takes a star off your own record, which is the only way a car you
  // stole off the police was ever going to be allowed to do this job.
  var PERP_SPOT_R = 45, PERP_GIVE_UP = 0.35, PERP_TIME = 80;
  // ---------- takedown ----------
  // a road spot `rMin`–`rMax` out from you, on the island asked for (or
  // either), never on a bridge-end lane, in the water or on the airfield
  function roadSpotOut(rMin, rMax, onIsla) {
    var f = GAME.focus(), C = GAME.city;
    for (var tries = 0; tries < 40; tries++) {
      var a = Math.random() * Math.PI * 2, r = U.randRange(Math.random, rMin, rMax);
      var rp = C.nearestRoadPoint(f.x + Math.cos(a) * r, f.z + Math.sin(a) * r);
      if (C.isInWater(rp.x, rp.z) || C.inAirport(rp.x, rp.z) || rp.kind === 'local') continue;
      // the job's own island, never across a bridge
      if (onIsla !== undefined && !!(GAME.isla && GAME.isla.contains(rp.x, rp.z)) !== onIsla) continue;
      if (U.dist2(rp.x, rp.z, f.x, f.z) < rMin * 0.8 * rMin * 0.8) continue;
      rp.heading = rp.axis === 'net' ? rp.heading : rp.axis === 'z' ? 0 : Math.PI / 2;
      return rp;
    }
    return null;
  }
  function spawnTarget(def) {
    for (var tries = 0; tries < 6; tries++) {
      var rp = roadSpotOut(140, 230, !!def.isla);
      if (!rp) return false;
      var car = GAME.vehicles.spawnCar(def.car, rp.x, rp.z, rp.heading,
        { occupied: 'ai', ai: { mode: 'traffic', desired: 11, laneX: 0, laneZ: 0 }, mission: true, color: 0x14141a });
      if (!car) continue;
      car.hp = car.spec.hp * def.armor;
      car.perp = true;
      // he sits on his locks (player.js asks rattled() instead of handing it over)
      car.locked = true;
      active.perp = car; active.fleeing = false; active.shootT = 2;
      active.maxHp = car.hp;
      active.phase = 'car'; active.foot = null; active.rattles = 0;
      if (def.early) runFor(car, def);
      return true;
    }
    return false;
  }
  // Made, and running: flat out, round anything in his way and through you
  // if you stand in the road (vehicles.js reads `bolt`), and he does not
  // wait about behind it.
  function runFor(car, def) {
    active.fleeing = true;
    if (car.ai) { car.ai.desired = def.flee; car.ai.reckless = true; car.ai.bolt = true; }
  }
  // F at his window. The handle does not give, and he does not sit there to
  // find out what you meant by it: he backs off you and goes.
  function rattled(car) {
    if (!active || active.def.type !== 'takedown' || active.perp !== car) { GAME.hud.message('Locked.', 1.5); return; }
    GAME.audio.horn(car.pos.x, car.pos.z, false);
    if (!active.fleeing) runFor(car, active.def);
    if (Math.abs(car.speed) < 3) { car.reverseT = 0.9; car.unstickT = 0; }
    GAME.hud.message(active.rattles++ ? 'Locked. Wreck it — or hurt it till he gives it up.'
      : 'Locked — he\'s not opening up for you. He\'s going!', 2.6);
  }
  // Out of the car, one way or another: on his feet with a pistol, and he
  // would rather it was you than him. Whoever he was in the traffic, he is
  // the job now.
  function armUp(ped, hp) {
    ped.temper = 1; ped.carrying = true; ped.missionArmed = true; ped.missionFoe = true;
    ped.hp = Math.max(ped.hp, hp);
    GAME.peds.startFight(ped, { kind: 'player' }, 30);
  }
  function onFoot(ped) {
    var d = active.def;
    // Rico does not stand and fight in the street: he is out of the pickup
    // and away to the marina, where his boat and his men are (ACTS.hit2)
    if (d.flees && actsOn) {
      active.downAt = { x: ped.pos.x, z: ped.pos.z };
      // (off up the street at a run, not out of the world in front of you:
      // the street lets him go once he is out of sight, and he is waiting
      // on the marina when you get there)
      ped.jobPed = false; ped.outlaw = true; ped.missionArmed = false; ped.missionFoe = false;
      GAME.peds.startFlee(ped, GAME.player.pos.x, GAME.player.pos.z, 40);
      finish(true);
      return;
    }
    active.phase = 'foot'; active.foot = ped;
    armUp(ped, d.foot || 50);
    active.timeLeft = Math.max(active.timeLeft, 45);
    GAME.hud.message('He\'s out of it — and he\'s pulled a gun. Put him down.', 3);
  }
  // whoever climbed out of this car (vehicles.js remembers which, by serial)
  function outOf(car) {
    var peds = GAME.world.peds;
    for (var i = 0; i < peds.length; i++) if (!peds[i].dead && !peds[i].gone && peds[i].leftCar === car.serial) return peds[i];
    return null;
  }
  var TARGET_SPOT_R = 60, TARGET_SHOOT_R = 38, TARGET_GIVE_UP = 0.2, TARGET_LOST_R = 520;
  var FOOT_LOST_R = 150, HURT_SHOOTS = 0.7;
  function updateTakedown(dt, P) {
    var d = active.def, p = active.perp;
    active.timeLeft -= dt;
    if (active.phase === 'foot') { updateTargetOnFoot(dt, P); return; }
    if (active.phase === 'ledger' || active.phase === 'deliver') { updateLedger(dt, P); return; }
    if (!p || p.gone) { finish(false, 'The target got away.'); return; }
    // wrecked, or the driver out of it one way or another: whoever got out
    // is the job now, and one who went up with it was the end of it
    if (p.dead || p.occupied !== 'ai') {
      var who = outOf(p);
      if (who) { onFoot(who); return; }
      if (d.flees && actsOn) active.ricoDead = true;
      targetDown(p.pos.x, p.pos.z);
      return;
    }
    if (p.hp < active.maxHp * TARGET_GIVE_UP) {
      var out = GAME.vehicles.ejectDriver(p);
      if (out) { onFoot(out); return; }
      targetDown(p.pos.x, p.pos.z);
      return;
    }
    if (active.timeLeft <= 0) { finish(false, 'Out of time — the target got away.'); return; }
    var f = GAME.focus();
    var dist = Math.sqrt(U.dist2(f.x, f.z, p.pos.x, p.pos.z));
    if (dist > TARGET_LOST_R) { finish(false, 'You lost the target.'); return; }
    if (!active.fleeing && dist < TARGET_SPOT_R) {
      runFor(p, d);
      GAME.hud.message('They have made you — they are running!', 2.5);
    }
    // the ones who shoot back do it once they are running and you are close —
    // and a frightened man once you have put a few dents in him
    var shoots = d.shoots === true || (d.shoots === 'hurt' && p.hp < active.maxHp * HURT_SHOOTS);
    if (shoots && d.shoots === 'hurt' && !active.armed) {
      active.armed = true;
      GAME.hud.message('He\'s shooting back out of the window!', 2.5);
    }
    if (shoots && active.fleeing && dist < TARGET_SHOOT_R && !GAME.godMode) {
      active.shootT -= dt;
      if (active.shootT <= 0) {
        active.shootT = U.randRange(Math.random, 1.1, 2.0);
        GAME.combat.npcShoot(p.pos.x, p.pos.y + 1.3, p.pos.z, 0.32, 7, p);
      }
    }
    active.routeT = (active.routeT || 0) - dt;
    if (active.routeT <= 0) { active.routeT = 1; active.courierRoute = roadRoute(f.x, f.z, p.pos.x, p.pos.z); }
    updateCp();
    GAME.hud.missionTimer(active.timeLeft, true);
    if (GAME.frame % 12 === 0) GAME.hud.missionObjective(objectiveText());
  }
  // He is on his feet and armed. Let him run from a car coming at him (he
  // would), but whenever you are on foot or have slowed up near him he turns
  // and has it out with you, for as long as it takes.
  function updateTargetOnFoot(dt, P) {
    var ped = active.foot, f = GAME.focus();
    if (!ped || ped.gone) { finish(false, 'He got away on foot.'); return; }
    if (ped.dead) { targetDown(ped.pos.x, ped.pos.z); return; }
    if (active.timeLeft <= 0) { finish(false, 'Out of time — he got away.'); return; }
    var dist = Math.sqrt(U.dist2(f.x, f.z, ped.pos.x, ped.pos.z));
    if (dist > FOOT_LOST_R) { finish(false, 'You lost him.'); return; }
    keepFighting(ped, dist, P);
    active.routeT = (active.routeT || 0) - dt;
    if (active.routeT <= 0) { active.routeT = 1; active.courierRoute = roadRoute(f.x, f.z, ped.pos.x, ped.pos.z); }
    updateCp();
    GAME.hud.missionTimer(active.timeLeft, true);
    if (GAME.frame % 12 === 0) GAME.hud.missionObjective(objectiveText());
  }
  function keepFighting(ped, dist, P) {
    var slow = !P.inCar || !P.car || Math.abs(P.car.speed) < 6;
    if (ped.state === 'attack') ped.attackT = Math.max(ped.attackT, 6);
    else if (slow && dist < 40 && P.state === 'alive') GAME.peds.startFight(ped, { kind: 'player' }, 30);
  }
  // The target is down. That is the job — unless he had something on him.
  function targetDown(x, z) {
    active.downAt = { x: x, z: z };
    if (!active.def.ledger) { finish(true); return; }
    active.phase = 'ledger';
    active.foot = null;
    dropLedger(x, z);
    GAME.hud.message('He\'s down. The ledger\'s on him — take it.', 3);
    updateCp();
    GAME.hud.missionObjective(objectiveText());
  }

  // ---------- the ledger (LOOSE ENDS) ----------
  // Lola's book, where he went down. Take it and Rico's people know inside a
  // minute: a car of them comes for it, shooting, and it has to get to her
  // lock-up on the harbour road whatever they do about it.
  var LEDGER_REACH = 2.4, LEDGER_REACH_CAR = 4, DROP_R = 7, HEAVY_SHOOT_R = 32;
  function dropLedger(x, z) {
    var g = new THREE.Group();
    var case_ = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.4, 0.14), new THREE.MeshLambertMaterial({ color: 0x5a3a22 }));
    var handle = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.06), new THREE.MeshLambertMaterial({ color: 0x1a1410 }));
    handle.position.y = 0.24;
    g.add(case_); g.add(handle);
    var gy = GAME.city.groundY(x, z);
    g.position.set(x, gy + 0.45, z);
    GAME.scene.add(g);
    active.ledger = { x: x, z: z, mesh: g, held: false };
  }
  function lockupDrop() {
    var H = GAME.heist, sh = H && H.shed && H.shed();
    var at = sh ? sh.door : H ? H.LOCKUP : { x: -140, z: 206 };
    // out in the road in front of the door, where a car can pull up on it
    var rp = GAME.city.nearestRoadPoint(at.x, at.z);
    return { x: (at.x + rp.x) / 2, z: (at.z + rp.z) / 2 };
  }
  function updateLedger(dt, P) {
    var L = active.ledger, f = GAME.focus();
    if (active.timeLeft <= 0) { finish(false, L && L.held ? 'Out of time — the ledger never made it.' : 'Out of time — the ledger\'s gone.'); return; }
    if (!L.held) {
      L.mesh.rotation.y += dt * 2.2;
      L.mesh.position.y = GAME.city.groundY(L.x, L.z) + 0.45 + Math.sin(GAME.time * 3) * 0.08;
      var reach = P.inCar ? LEDGER_REACH_CAR : LEDGER_REACH;
      if (U.dist2(f.x, f.z, L.x, L.z) < reach * reach && P.state === 'alive') takeLedger();
    } else {
      updateHeavies(dt, P);
      var drop = active.drop;
      if (U.dist2(f.x, f.z, drop.x, drop.z) < DROP_R * DROP_R && P.state === 'alive') { finish(true); return; }
    }
    active.routeT = (active.routeT || 0) - dt;
    if (active.routeT <= 0) {
      var cp = currentCp();
      active.routeT = 1;
      if (cp) active.courierRoute = roadRoute(f.x, f.z, cp[0], cp[1]);
    }
    updateCp();
    GAME.hud.missionTimer(active.timeLeft, true);
    if (GAME.frame % 12 === 0) GAME.hud.missionObjective(objectiveText());
  }
  function takeLedger() {
    var L = active.ledger;
    L.held = true;
    GAME.scene.remove(L.mesh); disposeTree(L.mesh); L.mesh = null;
    active.phase = 'deliver';
    active.drop = lockupDrop();
    active.timeLeft = Math.max(active.timeLeft, 90);
    active.heavies = null; active.heavyT = 4;   // they are a few seconds behind the news
    GAME.audio.pickup();
    GAME.hud.message('Got the ledger. Get it to Lola\'s lock-up on the harbour road.', 3.5);
    lola('That\'s my book. Rico\'s boys will know you have it before you\'re round the corner — bring it to the lock-up, and don\'t stop for anybody.', 7);
    updateCp();
    GAME.hud.missionObjective(objectiveText());
  }
  // Rico's men: two of them in a dark sedan, coming straight for you and
  // shooting from the windows when they are close. Pull up on foot near them
  // or smash the car up enough and they get out and do it on foot.
  function spawnHeavies() {
    var rp = roadSpotOut(110, 170, GAME.isla ? !!GAME.isla.contains(GAME.focus().x, GAME.focus().z) : undefined);
    if (!rp) return false;
    // by the roads while they are coming (bearing on you at every junction,
    // round anything slow and through you if you are in the road), and
    // straight at you once they can see you
    // (pointed your way along it: traffic does not turn round in the road,
    // and facing off they went a block the wrong way before they came)
    var f = GAME.focus(), h = rp.heading;
    if (Math.sin(h) * (f.x - rp.x) + Math.cos(h) * (f.z - rp.z) < 0) h += Math.PI;
    var car = GAME.vehicles.spawnCar('sedan', rp.x, rp.z, h, { occupied: 'ai',
      ai: { mode: 'traffic', desired: 22, laneX: 0, laneZ: 0, reckless: true, bolt: true, toward: { x: f.x, z: f.z } }, mission: true, color: 0x0e0e14 });
    if (!car) return false;
    car.hp = car.spec.hp * 1.6;
    car.heavy = true; car.locked = true;
    active.heavies = { car: car, maxHp: car.hp, shootT: 2, men: [], out: false, bestD: 1e9, stallT: 0 };
    GAME.hud.message('Rico\'s men are on you — a black sedan. Don\'t let them take it back.', 3.2);
    GAME.audio.yelp();
    return true;
  }
  function heaviesOut(hv) {
    hv.out = true;
    var car = hv.car;
    var first = car.occupied === 'ai' ? GAME.vehicles.ejectDriver(car) : outOf(car);
    if (first) hv.men.push(first);
    var side = car.heading - Math.PI / 2;
    var second = GAME.peds.spawnPed(car.pos.x + Math.sin(side) * (car.spec.w / 2 + 1), car.pos.z + Math.cos(side) * (car.spec.w / 2 + 1));
    if (second) hv.men.push(second);
    hv.men.forEach(function (m) { armUp(m, 50); });
    car.heavy = false; car.locked = false;
    GAME.hud.message('They\'re out and coming for you!', 2.2);
  }
  function updateHeavies(dt, P) {
    if (!active.heavies) {
      if ((active.heavyT -= dt) <= 0 && !spawnHeavies()) active.heavyT = 2;
      return;
    }
    var hv = active.heavies, car = hv.car, f = GAME.focus();
    if (!hv.out) {
      if (car.gone) { hv.out = true; return; }
      var dist = Math.sqrt(U.dist2(f.x, f.z, car.pos.x, car.pos.z));
      if (car.dead || car.occupied !== 'ai' || car.hp < hv.maxHp * 0.3 ||
          (!P.inCar && dist < 16 && Math.abs(car.speed) < 4)) {
        if (!car.dead || outOf(car)) heaviesOut(hv); else hv.out = true;
        return;
      }
      // Getting nowhere — a jam, a wrong turn, a block the long way round —
      // they find another way: out of your sight, a street or two closer.
      if (dist < hv.bestD - 10) { hv.bestD = dist; hv.stallT = 0; }
      else if ((hv.stallT += dt) > 8 && dist > 70) { hv.stallT = 0; if (comeRound(car)) hv.bestD = 1e9; }
      var seen = dist < HEAVY_SHOOT_R && GAME.city.hash.segmentClear(car.pos.x, car.pos.z, f.x, f.z);
      var ai = car.ai;
      ai.toward.x = f.x; ai.toward.z = f.z;
      if (seen && dist < 38 && ai.mode === 'traffic') ai.mode = 'chase';
      else if (ai.mode === 'chase' && (dist > 48 || (!seen && dist > 20))) { ai.mode = 'traffic'; ai.node = null; }
      if (ai.mode === 'chase') heavyDrive(car, dt, P, dist);
      if (dist < HEAVY_SHOOT_R && !GAME.godMode && P.state === 'alive' &&
          GAME.city.hash.segmentClear(car.pos.x, car.pos.z, f.x, f.z)) {
        hv.shootT -= dt;
        if (hv.shootT <= 0) {
          hv.shootT = U.randRange(Math.random, 0.7, 1.4);   // two of them at the windows
          GAME.combat.npcShoot(car.pos.x, car.pos.y + 1.3, car.pos.z, 0.22, 6, car);
          GAME.fx.spawn(car.pos.x, car.pos.y + 1.3, car.pos.z, { count: 2, color: 0xffe0a0, spread: 0.6, life: 0.12 });
        }
      }
      return;
    }
    for (var i = 0; i < hv.men.length; i++) {
      var m = hv.men[i];
      if (m.dead || m.gone) continue;
      keepFighting(m, Math.sqrt(U.dist2(f.x, f.z, m.pos.x, m.pos.z)), P);
    }
  }
  // somewhere you cannot see from where you are: behind the camera, or with
  // a building in the way
  var lookDir = new THREE.Vector3();
  function outOfSight(x, z) {
    var cam = GAME.cameraObj, f = GAME.focus();
    cam.getWorldDirection(lookDir);
    if ((x - cam.position.x) * lookDir.x + (z - cam.position.z) * lookDir.z < 0) return true;
    return !GAME.city.hash.segmentClear(f.x, f.z, x, z);
  }
  function comeRound(car) {
    var f = GAME.focus(), onIsla = GAME.isla ? !!GAME.isla.contains(f.x, f.z) : undefined;
    for (var tries = 0; tries < 12; tries++) {
      var rp = roadSpotOut(60, 100, onIsla);
      if (!rp || !outOfSight(rp.x, rp.z)) continue;
      car.pos.set(rp.x, GAME.city.groundY(rp.x, rp.z), rp.z);
      car.heading = Math.atan2(f.x - rp.x, f.z - rp.z);
      car.speed = 0; car.lat = 0; car.vx = car.vz = 0;
      car.mesh.rotation.y = car.heading;
      car.ai.mode = 'traffic'; car.ai.node = null; car.ai.prev = null; car.ai.passT = 0;
      return true;
    }
    return false;
  }
  // Straight at you, the way a cruiser comes (police.js) but with no gap kept:
  // they would like to be in your door.
  function heavyDrive(car, dt, P, dist) {
    var f = GAME.focus();
    var lead = P.inCar && P.car ? 0.35 : 0;
    var tx = f.x + (lead ? (P.car.vx || 0) * lead : 0), tz = f.z + (lead ? (P.car.vz || 0) * lead : 0);
    var dh = U.wrapPI(Math.atan2(tx - car.pos.x, tz - car.pos.z) - car.heading);
    var c = car.controls;
    if (Math.abs(car.speed) < 1.2 && dist > 6) car.unstickT += dt; else car.unstickT = 0;
    if (car.unstickT > 1.0) { car.reverseT = 1.0; car.unstickT = 0; }
    if (car.reverseT > 0) { car.reverseT -= dt; c.throttle = -1; c.steer = dh > 0 ? -1 : 1; c.handbrake = false; return; }
    car.aiSteer = U.lerp(car.aiSteer || 0, U.clamp(dh * 1.6, -1, 1), Math.min(1, dt * 6));
    var th = 1;
    if (!P.inCar && dist < 16) th = car.speed > 2 ? -0.8 : 0;      // pulling up by you, to get out
    else if (Math.abs(dh) > 0.8 && car.speed > 14) th = -0.3;       // can't take a corner flat out
    var probe = 4 + Math.max(0, car.speed) * 0.7;
    if (GAME.city.isInWater(car.pos.x + Math.sin(car.heading) * probe, car.pos.z + Math.cos(car.heading) * probe)) th = car.speed > 0.5 ? -1 : 0;
    c.throttle = th; c.steer = car.aiSteer; c.handbrake = false;
  }
  // put everything the job had out there back the way the street has it
  function releaseTakedown() {
    var p = active.perp;
    if (p && !p.gone) { p.locked = false; if (p.ai) { p.ai.bolt = false; p.ai.reckless = false; } }
    var unarm = function (m) { if (m && !m.dead) { m.missionArmed = false; m.missionFoe = false; } };
    unarm(active.foot);
    var hv = active.heavies;
    if (hv) {
      hv.men.forEach(unarm);
      var hc = hv.car;
      if (hc && !hc.gone) {
        hc.heavy = false; hc.locked = false; hc.mission = false;
        if (hc.occupied === 'ai' && !hc.dead) hc.ai = { mode: 'traffic', desired: 11, laneX: 0, laneZ: 0 };
      }
    }
    if (active.ledger && active.ledger.mesh) { GAME.scene.remove(active.ledger.mesh); disposeTree(active.ledger.mesh); active.ledger.mesh = null; }
  }

  // ---------- the acts after the job (story missions) ----------
  // A story job used to be one of five templates with a pager line on it:
  // win the race, and that was the job. Now its win can be the first act of
  // several. `then` on a def lists what comes after, played in order, built
  // from the same pieces LOOSE ENDS was:
  //   grab     something to pick up where the last act ended (a bag, a case)
  //   deliver  get it, or yourself, to a place — Lola's lock-up by default —
  //            with Rico's men on you if `heavies` says so
  //   heavies  a carload of Rico's men comes for you, and it is over when
  //            they are
  //   heat     the law, at so many stars, and it is over when you lose them
  //   crew     the finale: a boss and his men at a place of their own, armed
  //            and waiting; it is over when nobody there is standing
  //   scene    a cut away mid-job (scenes.js), or the same lines on the pager
  // Each act sets its own clock (`time`), and says something going in
  // (`say` on the message line, `lola` / `rico` on the pager). A run that
  // fails anywhere fails as the job, and a retry starts it from the top.
  var CREW_WAKE_R = 48, CREW_SPAWN_R = 150, CREW_LOST_R = 700;
  // (the regression suite plays the jobs as they were, one part each, the
  // way it stands the scenes down; its acts group switches this back on)
  var actsOn = true;
  function hasActs(d) { return actsOn && !!(d.then && d.then.length); }
  // the job's own part is won: put away what it had out, and go on
  function beginActs() {
    var d = active.def, P = GAME.player, f = GAME.focus();
    active.wonT = active.t;
    active.field = 1 + active.racers.length;
    active.lastAt = active.downAt || { x: f.x, z: f.z };
    // (the race's field goes home — driving off with the traffic, not
    // vanishing off the finish line round you — the rampage hands back its
    // gun and cools off, a takedown lets the street have its cars back)
    releaseRacers();
    if (d.type === 'rampage') {
      reclaimGrant();
      if (GAME.police.wanted > RAMPAGE_HEAT_LEFT) GAME.police.setWanted(RAMPAGE_HEAT_LEFT);
    }
    if (d.type === 'takedown') { releaseTakedown(); active.perp = null; active.foot = null; active.heavies = null; }
    if (crate) crate.visible = false;
    active.acts = d.then; active.actIndex = -1; active.stage = null;
    GAME.audio.sting('win');
    GAME.haptics.checkpoint();
    nextAct();
    return true;
  }
  function nextAct() {
    if (!active) return;
    var prev = active.stage;
    if (prev) endAct(prev);
    active.actIndex++;
    var a = active.acts[active.actIndex];
    if (!a) { active.stage = { kind: 'done' }; finish(true); return; }
    var s = active.stage = { kind: a.kind, a: a, t: 0 };
    active.courierRoute = null; active.routeT = 0;
    if (a.time) active.timeLeft = a.time;
    if (a.say) GAME.hud.message(a.say, 3.5);
    if (a.lola) lola(a.lola, 7);
    if (a.rico) rico(a.rico, 7);
    if (a.kind === 'grab') {
      var at = a.at ? place(a.at) : active.lastAt;
      s.item = dropItem(at.x, at.z, a.color || 0x5a3a22);
    } else if (a.kind === 'deliver') {
      s.to = a.to && a.to !== 'lockup' ? place(a.to) : lockupDrop();
      if (a.heavies) { active.heavies = null; active.heavyT = a.heavyT || 4; }
    } else if (a.kind === 'heavies') {
      active.heavies = null; active.heavyT = a.heavyT || 2;
    } else if (a.kind === 'heat') {
      GAME.police.setWanted(Math.max(GAME.police.wanted, a.stars || 2));
    } else if (a.kind === 'crew') {
      s.at = place(a.at);
      s.men = [];
    } else if (a.kind === 'scene') {
      // nothing ticks under a scene, so it is done when it says so
      var go = function () { if (active && active.stage === s) nextAct(); };
      var script = typeof a.script === 'function' ? a.script() : a.script;
      if (!(GAME.scenes && GAME.scenes.play(script, go))) {
        sceneOnPager(script);
        go();
        return;
      }
    }
    updateCp();
    GAME.hud.missionObjective(objectiveText());
  }
  // with the scenes off, what was said goes out on the pager instead
  function sceneOnPager(script) {
    var shots = Array.isArray(script) ? [{ lines: script }] : (script && script.shots) || [];
    shots.forEach(function (sh) {
      sh.lines.forEach(function (ln) { if (ln[0] !== 'you') GAME.hud.pager(GAME.cast ? GAME.cast.name(ln[0]) : ln[0], ln[1], 5); });
    });
  }
  // a place an act names: 'lockup', 'start' (the job's own ring), 'marina',
  // a function of the island's landmarks, or a point
  function place(p) {
    if (p === 'lockup') return lockupDrop();
    // (round the corner from the ring, not on it: you finished the job's own
    // part standing there, and the people it brought are down the street)
    if (p === 'start') return spotNear(active.def.start.x, active.def.start.z, 60, 95);
    if (p === 'here') return active.lastAt;
    if (typeof p === 'function') return p();
    return p;
  }
  function spotNear(x, z, r0, r1) {
    var C = GAME.city, isla = !!(GAME.isla && GAME.isla.contains(x, z));
    for (var t = 0; t < 40; t++) {
      var a = Math.random() * Math.PI * 2, r = U.randRange(Math.random, r0, r1);
      var rp = C.nearestRoadPoint(x + Math.cos(a) * r, z + Math.sin(a) * r);
      if (C.isInWater(rp.x, rp.z) || C.inAirport(rp.x, rp.z)) continue;
      if (!!(GAME.isla && GAME.isla.contains(rp.x, rp.z)) !== isla) continue;
      if (U.dist2(rp.x, rp.z, x, z) < r0 * r0 * 0.6) continue;
      return { x: rp.x, z: rp.z };
    }
    return { x: x, z: z };
  }
  function endAct(s) {
    if (s.item && s.item.mesh) { GAME.scene.remove(s.item.mesh); disposeTree(s.item.mesh); s.item.mesh = null; }
    if (s.kind === 'deliver' || s.kind === 'heavies') releaseHeavies();
    if (s.men) s.men.forEach(function (m) { if (m && !m.dead && !m.gone) { m.missionArmed = false; m.missionFoe = false; m.jobPed = false; } });
  }
  function releaseHeavies() {
    var hv = active.heavies;
    if (!hv) return;
    hv.men.forEach(function (m) { if (m && !m.dead) { m.missionArmed = false; m.missionFoe = false; } });
    var hc = hv.car;
    if (hc && !hc.gone) {
      hc.heavy = false; hc.locked = false; hc.mission = false;
      if (hc.occupied === 'ai' && !hc.dead) hc.ai = { mode: 'traffic', desired: 11, laneX: 0, laneZ: 0 };
    }
    active.heavies = null;
  }
  function dropItem(x, z, color) {
    var g = new THREE.Group();
    var body = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.4, 0.2), new THREE.MeshLambertMaterial({ color: color }));
    var handle = new THREE.Mesh(sharedBoxGeo(0.2, 0.06, 0.06), sharedLambert(0x1a1410));
    handle.position.y = 0.24;
    g.add(body); g.add(handle);
    g.position.set(x, GAME.city.groundY(x, z) + 0.45, z);
    GAME.scene.add(g);
    return { x: x, z: z, mesh: g };
  }
  // the heavies are done with when nobody from that car is still in it
  function heaviesBeaten() {
    var hv = active.heavies;
    if (!hv) return false;
    if (!hv.out) return !!hv.car.gone;
    return hv.men.every(function (m) { return m.dead || m.gone; });
  }
  function crewSpawn(s) {
    var a = s.a, at = s.at, n = a.men || 3;
    var who = [], boss = typeof a.boss === 'function' ? a.boss() : a.boss;
    if (boss) who.push({ look: a.bossLook || lookOf(boss) || THUG, hp: a.bossHp || 120, boss: true });
    if (a.second) who.push({ look: lookOf(a.second), hp: 80 });
    for (var i = 0; i < n; i++) who.push({ look: THUG, hp: 50 });
    who.forEach(function (w, k) {
      var ang = k / who.length * Math.PI * 2, r = k === 0 ? 1.5 : 4 + (k % 2) * 3;
      var x = at.x + Math.cos(ang) * r, z = at.z + Math.sin(ang) * r;
      if (GAME.city.isInWater(x, z)) { x = at.x; z = at.z; }
      var ped = GAME.peds.spawnPed(x, z, { look: w.look });
      if (!ped) return;
      ped.jobPed = true; ped.state = 'wait'; ped.speed = 0; ped.hp = w.hp; ped.boss = !!w.boss;
      ped.heading = Math.random() * Math.PI * 2;
      s.men.push(ped);
    });
    s.spawned = true;
  }
  // a member of the cast, as a ped: how cast.js says they stand
  function lookOf(id) {
    var f = GAME.cast && GAME.cast.fig(id);
    return f ? { shirt: f.shirt, pants: f.pants, skin: f.skin, hair: f.hair, hairCol: f.hairCol } : null;
  }
  function updateAct(dt, P) {
    var s = active.stage, a = s.a, f = GAME.focus();
    s.t += dt;
    if (s.kind === 'done' || s.kind === 'scene') return;
    if (a.time) {
      active.timeLeft -= dt;
      GAME.hud.missionTimer(active.timeLeft, true);
      if (active.timeLeft <= 0) { finish(false, a.late || 'Out of time.'); return; }
    } else GAME.hud.missionTimer(null);
    if (s.kind === 'grab') {
      var it = s.item;
      it.mesh.rotation.y += dt * 2.2;
      it.mesh.position.y = GAME.city.groundY(it.x, it.z) + 0.45 + Math.sin(GAME.time * 3) * 0.08;
      var reach = P.inCar ? LEDGER_REACH_CAR : LEDGER_REACH;
      if (U.dist2(f.x, f.z, it.x, it.z) < reach * reach && P.state === 'alive') {
        GAME.audio.pickup();
        if (a.got) GAME.hud.message(a.got, 3);
        nextAct();
        return;
      }
    } else if (s.kind === 'deliver') {
      if (a.heavies) updateHeavies(dt, P);
      if (a.car && !(P.inCar && P.car && !P.car.dead)) { s.needCar = true; }
      else s.needCar = false;
      if (U.dist2(f.x, f.z, s.to.x, s.to.z) < DROP_R * DROP_R && P.state === 'alive' && !s.needCar) { nextAct(); return; }
    } else if (s.kind === 'heavies') {
      updateHeavies(dt, P);
      if (heaviesBeaten()) { nextAct(); return; }
    } else if (s.kind === 'heat') {
      if (GAME.police.wanted === 0) { nextAct(); return; }
    } else if (s.kind === 'crew') {
      var d2 = Math.sqrt(U.dist2(f.x, f.z, s.at.x, s.at.z));
      if (!s.spawned && d2 < CREW_SPAWN_R) crewSpawn(s);
      if (s.spawned) {
        var left = 0;
        for (var i = 0; i < s.men.length; i++) {
          var m = s.men[i];
          if (m.dead || m.gone) continue;
          left++;
          var md = Math.sqrt(U.dist2(f.x, f.z, m.pos.x, m.pos.z));
          if (!m.missionArmed && (md < CREW_WAKE_R || s.woke)) { armUp(m, m.hp); s.woke = true; }
          else if (m.missionArmed) keepFighting(m, md, P);
        }
        if (!s.woke && s.men.some(function (m) { return m.dead || m.hp < 50 && m.boss; })) s.woke = true;
        s.left = left;
        if (!left) { nextAct(); return; }
      }
      if (d2 > CREW_LOST_R && s.woke) { finish(false, a.lost || 'They got away.'); return; }
    }
    active.routeT = (active.routeT || 0) - dt;
    if (active.routeT <= 0) {
      active.routeT = 1;
      var cp = currentCp();
      active.courierRoute = cp ? roadRoute(f.x, f.z, cp[0], cp[1]) : null;
    }
    updateCp();
    if (GAME.frame % 12 === 0) GAME.hud.missionObjective(objectiveText());
  }
  function actCp() {
    var s = active.stage;
    if (s.kind === 'grab') return [s.item.x, s.item.z];
    if (s.kind === 'deliver') return [s.to.x, s.to.z];
    if (s.kind === 'heavies') {
      var hv = active.heavies;
      if (!hv) return null;
      if (!hv.out) return hv.car.gone ? null : [hv.car.pos.x, hv.car.pos.z];
      for (var i = 0; i < hv.men.length; i++) if (!hv.men[i].dead && !hv.men[i].gone) return [hv.men[i].pos.x, hv.men[i].pos.z];
      return null;
    }
    if (s.kind === 'crew') {
      if (s.woke) for (var k = 0; k < s.men.length; k++) if (!s.men[k].dead && !s.men[k].gone) return [s.men[k].pos.x, s.men[k].pos.z];
      return [s.at.x, s.at.z];
    }
    return null;
  }
  function actText() {
    var s = active.stage, a = s.a || {}, f = GAME.focus(), cp = actCp();
    var m = cp ? '  ·  ' + Math.round(Math.sqrt(U.dist2(f.x, f.z, cp[0], cp[1]))) + ' m' : '';
    if (s.kind === 'grab') return (a.obj || 'Pick it up') + m;
    if (s.kind === 'deliver') {
      if (s.needCar) return 'Get a car';
      var hv = active.heavies, chased = hv && (!hv.out ? !hv.car.dead : hv.men.some(function (x) { return !x.dead && !x.gone; }));
      return (a.obj || 'To Lola\'s lock-up') + m + (chased ? '  ·  Rico\'s men on you' : '');
    }
    if (s.kind === 'heavies') return (a.obj || 'Deal with Rico\'s men') + m;
    if (s.kind === 'heat') return (a.obj || 'Lose the heat') + '  ·  ' + GAME.police.wanted + '★';
    if (s.kind === 'crew') return (a.obj || 'Take them down') + (s.spawned ? '  ·  ' + (s.left === undefined ? s.men.length : s.left) + ' left' : '') + m;
    return '';
  }

  function startVigilante() {
    GAME.track('job-started-vigilante');
    active = {
      def: { type: 'vigilante', name: 'VIGILANTE', id: 'vigilante', job: true },
      state: 'run', t: 0, cpIndex: 0, score: 0, racers: [], level: 1,
      jobCount: 0, earned: 0, targets: [], timeLeft: PERP_TIME, perp: null, fleeing: false,
      routeCp: null, routeT: 0, courierRoute: null
    };
    setMarkersVisible(false);
    if (!spawnPerp()) { GAME.hud.message('Dispatch has nothing for you here.', 2.5); cleanup(); return; }
    GAME.hud.missionStart(active.def.name, objectiveText());
    GAME.hud.message('Level 1 — a suspect is marked on your radar. Run them down: wreck the car or make them give it up. Leave the cruiser to clock off.', 6);
    GAME.audio.pickup();
  }
  function spawnPerp() {
    var f = GAME.focus(), C = GAME.city;
    var lv = active.level;
    var types = lv >= 4 ? ['sports', 'sports', 'motorcycle'] : lv >= 2 ? ['sedan', 'sports', 'van'] : ['sedan', 'van', 'taxi'];
    for (var tries = 0; tries < 24; tries++) {
      var a = Math.random() * Math.PI * 2, r = U.randRange(Math.random, 130, 230);
      var rp = C.nearestRoadPoint(f.x + Math.cos(a) * r, f.z + Math.sin(a) * r);
      if (C.isInWater(rp.x, rp.z) || C.inAirport(rp.x, rp.z) || rp.kind === 'local') continue;
      if (!defAvailable({ isla: GAME.isla && GAME.isla.contains(rp.x, rp.z) })) continue;
      var heading = rp.axis === 'net' ? rp.heading : rp.axis === 'z' ? 0 : Math.PI / 2;
      var car = GAME.vehicles.spawnCar(types[Math.floor(Math.random() * types.length)], rp.x, rp.z, heading,
        { occupied: 'ai', ai: { mode: 'traffic', desired: 10, laneX: 0, laneZ: 0 }, mission: true, color: 0xff3b3b });
      if (!car) continue;
      car.perp = true;
      active.perp = car; active.fleeing = false; active.timeLeft = PERP_TIME;
      return true;
    }
    return false;
  }
  function perpTaken() {
    var lv = active.level;
    var pay = 150 + lv * 100;
    GAME.addCash(pay);
    active.earned += pay; active.jobCount++;
    var w = GAME.police.wanted;
    if (w > 0) GAME.police.setWanted(w - 1);
    GAME.audio.sting('win');
    GAME.haptics.win();
    GAME.hud.message('SUSPECT DOWN  +$' + pay + (w > 0 ? '  ·  one star off your own record' : '') + '  ·  next call coming in', 4);
    var p = active.perp;
    if (p && !p.gone) { p.perp = false; p.mission = false; }
    active.level++;
    active.perp = null;
    if (!spawnPerp()) endJob('no more calls');
  }
  function updateVigilante(dt, P) {
    if (!P.inCar || !P.car || P.car.type !== 'police') { endJob('clocked off'); return; }
    if (P.car.dead) { endJob('cruiser totalled'); return; }
    active.timeLeft -= dt;
    var p = active.perp;
    if (!p || p.gone) { endJob('the suspect got away'); return; }
    if (active.timeLeft <= 0) { endJob('the suspect got away'); return; }
    var f = GAME.focus();
    var d = Math.sqrt(U.dist2(f.x, f.z, p.pos.x, p.pos.z));
    // they run once they have seen you coming
    if (!active.fleeing && d < PERP_SPOT_R) {
      active.fleeing = true;
      if (p.ai) p.ai.desired = 17 + Math.min(active.level, 6) * 1.5;
      GAME.hud.message('They have made you — they are running!', 2.5);
    }
    // taken: wrecked, or knocked about until the driver gives it up and bails
    if (p.dead || p.occupied !== 'ai') { perpTaken(); return; }
    if (p.hp < p.spec.hp * PERP_GIVE_UP) {
      var out = GAME.vehicles.ejectDriver(p);
      if (out) GAME.peds.startFlee(out, f.x, f.z, 10);
      perpTaken();
      return;
    }
    active.routeT -= dt;
    if (active.routeT <= 0) { active.routeT = 1; active.courierRoute = roadRoute(f.x, f.z, p.pos.x, p.pos.z); }
    updateCp();
    GAME.hud.missionTimer(active.timeLeft, true);
    GAME.hud.missionObjective(objectiveText());
  }

  function iceCreamSale(tgt) {
    var i = active.targets.indexOf(tgt);
    if (i >= 0) active.targets.splice(i, 1);
    dropArrow(tgt);
    // served, not spirited away: they walk off with it — and one cone is
    // enough. Unflagged, the same person took a few steps, heard the chimes
    // again and rejoined the queue forever.
    if (tgt.ped && !tgt.ped.dead) { tgt.ped.jobPed = false; tgt.ped.state = 'walk'; tgt.ped.iceServed = true; }
    var pay = 30 + active.level * 12;
    GAME.addCash(pay);
    active.earned += pay;
    active.sales++; active.jobCount++;
    GAME.audio.pickup();
    GAME.haptics.pickup();
    if (active.sales >= active.quota) {
      active.level++;
      active.sales = 0;
      active.quota += 2;
      active.timeLeft += 30;
      GAME.hud.message('ROUND ' + active.level + ' — +30s, sell ' + active.quota + '  ·  +$' + pay, 3.4);
      GAME.audio.sting('win');
      GAME.haptics.win();
    } else {
      GAME.hud.message('Sold — +$' + pay + '  ·  ' + active.sales + ' / ' + active.quota, 2);
    }
    GAME.hud.missionObjective(objectiveText());
    active.routeCp = null;
    updateCp();
  }

  // the horn on the ice cream truck is its chimes (player.js): on a round,
  // they carry for a while, and that is when people come
  var CHIME_CARRY = 9, CHIME_R = 30;
  function hornKey() { return GAME.isTouch ? '📢' : GAME.controls ? GAME.controls.label('KeyG') : 'G'; }
  function chimed() {
    if (!active || active.def.type !== 'icecream') return;
    active.callT = CHIME_CARRY;
    active.walkUpT = Math.min(active.walkUpT || 0, 0.4);
  }
  function updateIceCream(dt, P) {
    if (!P.inCar || !P.car || P.car.type !== 'icecream') { endJob('clocked off'); return; }
    if (P.car.dead) { endJob('truck totalled'); return; }
    active.timeLeft -= dt;
    if (active.timeLeft <= 0) { endJob('out of time'); return; }
    var f = GAME.focus();
    // No marker, no route, no "crowd" pin — you roam, and you play the
    // chimes where there are people. The map pointing at a spot made it a
    // delivery run, which it isn't. The chimes used to play by themselves on
    // a loop; now they are the horn, and nobody
    // comes who has not heard them.
    active.callT = Math.max(0, (active.callT || 0) - dt);
    // Anyone on the pavement in earshot of the chimes: stop the truck and
    // whoever is close enough wanders over to the hatch. That is the entire
    // job — nobody is spawned waiting for you and nobody is flagging you
    // down. One cone per person: the served walk away and stay away.
    replaceLostTargets();
    active.walkUpT = (active.walkUpT || 0) - dt;
    if (active.callT > 0 && Math.abs(P.car.speed) < 3.5 && active.walkUpT <= 0) {
      var peds = GAME.world.peds;
      for (var w = 0; w < peds.length; w++) {
        var pd = peds[w];
        if (pd.dead || pd.isCop || pd.jobPed || pd.iceServed) continue;
        if (U.dist2(f.x, f.z, pd.pos.x, pd.pos.z) > CHIME_R * CHIME_R) continue;
        pd.jobPed = true;
        pd.state = 'wait';
        active.targets.push({ x: pd.pos.x, z: pd.pos.z, ped: pd, boarding: true, walkUp: true });
        active.walkUpT = 1.2;
        break;
      }
    }
    stepBoarding(dt, f, P);
    updateArrows(dt);
    // the sold/quota line was set once at the start of the round and never
    // again — it read as a frozen shift readout however much you sold
    if (GAME.frame % 12 === 0) GAME.hud.missionObjective(objectiveText());
    GAME.hud.missionTimer(active.timeLeft, true);
  }

  function startJob(kind) {
    var P = GAME.player;
    if (active || !P.inCar || !P.car) return;
    if (kind === 'icecream') { startIceCream(); return; }
    if (kind === 'vigilante') { startVigilante(); return; }
    GAME.track('job-started-' + kind);
    active = {
      def: { type: kind, name: kind === 'ambulance' ? 'PARAMEDIC' : 'TAXI DRIVER', id: kind, job: true },
      state: 'run', t: 0, cpIndex: 0, score: 0, racers: [],
      phase: 'pickup', pickup: null, dropoff: null,
      // an ambulance fills up before running to the hospital; a cab takes one fare
      capacity: kind === 'ambulance' ? 3 : 1,
      level: 1, targets: [], aboard: 0,
      // the opening clock covers the first call and a breath, no more — the
      // shift is earned fare by fare (see completeFare)
      timeLeft: kind === 'ambulance' ? 70 : 60,
      jobCount: 0, earned: 0, routeCp: null, hospital: null
    };
    startRound();
    // no auto-orient here: taxi and ambulance shifts start from a moving cab
    // at whatever heading you were driving — spinning the car under the
    // player mid-motion is course-correction nobody asked for. Marker
    // missions (races, couriers) keep it: they begin from a standstill at a
    // fixed start line.
    setMarkersVisible(false);
    updateCp();
    GAME.hud.missionStart(active.def.name, objectiveText());
    GAME.hud.message(kind === 'ambulance'
      ? 'Level 1 — collect the patient and run them to a hospital. Each level adds more patients, further out. Leave the ambulance to clock off.'
      : 'Level 1 — pick up your fare and drive them to the drop-off. Fares get further out each level. Leave the cab to clock off.', 5);
    GAME.audio.pickup();
  }

  // push a point out of any road corridor onto the nearest kerb, so drop-offs
  // never land in a live traffic lane
  function clearOfRoad(x, z) {
    // the island's roads are curves, so push out along the road's own normal
    if (GAME.isla && GAME.isla.contains(x, z)) {
      var ip = GAME.city.nearestRoadPoint(x, z);
      var d = U.dist(x, z, ip.x, ip.z);
      if (d > 11) return [Math.round(x), Math.round(z)];
      var ux = d > 0.01 ? (x - ip.x) / d : Math.cos(ip.heading);
      var uz = d > 0.01 ? (z - ip.z) / d : -Math.sin(ip.heading);
      return [Math.round(ip.x + ux * 11), Math.round(ip.z + uz * 11)];
    }
    var half = (GAME.city.ROAD_HALF || 6) + 3;
    var lanes = [-450, -350, -250, -150, -50, 50, 150, 250, 350];
    for (var i = 0; i < lanes.length; i++) {
      if (Math.abs(x - lanes[i]) < half) x = lanes[i] + (x >= lanes[i] ? half : -half);
      if (Math.abs(z - lanes[i]) < half) z = lanes[i] + (z >= lanes[i] ? half : -half);
    }
    return [Math.round(x), Math.round(z)];
  }

  // how far out this level's calls are: ramps with the level and then plateaus.
  // Ambulance calls run at 3x — the hospital is the fixed drop-off, so the
  // pickups ARE the distance. Cab pickups sit halfway out (the fare's ride is
  // where the cab's distance lives — see dropBand).
  function targetBand() {
    var kind = active.def.id, lv = active.level;
    var minR = kind === 'ambulance' ? Math.min(165 + (lv - 1) * 66, 560) : Math.min(120 + (lv - 1) * 30, 345);
    var maxR = kind === 'ambulance' ? Math.min(minR + 285, 800) : Math.min(minR + 255, 600);
    return [minR, maxR];
  }

  // Where a fare wants to go — at 3x the old band, a fare is a run across the
  // map, not the same two blocks. The band opens up with the level, and each
  // individual fare draws its own leg inside it, so a shift is a mix of long
  // runs and longer ones rather than one distance repeated.
  function dropBand() {
    var lv = active.level;
    var minR = Math.min(210 + (lv - 1) * 135, 640);
    var maxR = Math.min(minR + 540 + (lv - 1) * 180, 1100);
    // each fare picks its own slice of that band
    var lo = U.randRange(Math.random, minR, minR + (maxR - minR) * 0.62);
    return [lo, U.randRange(Math.random, lo + 45, maxR)];
  }

  // one level of the shift: more people, spread further out, each level
  function startRound() {
    var kind = active.def.id;
    var lv = active.level;
    var count = kind === 'ambulance' ? Math.min(lv, 5) : 1;
    var band = targetBand(), minR = band[0], maxR = band[1];
    var P = GAME.player;
    var ox = P.car ? P.car.pos.x : P.pos.x, oz = P.car ? P.car.pos.z : P.pos.z;
    active.targets = [];
    for (var i = 0; i < count; i++) {
      var pt = null;
      // keep the pickups spread apart so it's a real route, not one clump
      for (var tries = 0; tries < 14; tries++) {
        var c = randomRoadPoint(ox, oz, minR, maxR);
        var ok = true;
        for (var j = 0; j < active.targets.length; j++) {
          if (U.dist2(c[0], c[1], active.targets[j].x, active.targets[j].z) < 60 * 60) { ok = false; break; }
        }
        if (ok) { pt = c; break; }
      }
      if (!pt) pt = randomRoadPoint(ox, oz, minR, maxR);
      // the marker is where the vehicle pulls up; the person waits on the
      // pavement beside it and walks over once you stop
      var wp = kerbWaitSpot(pt[0], pt[1]);
      active.targets.push({ x: pt[0], z: pt[1], ped: spawnWaitingPed(wp[0], wp[1]), boarding: false });
    }
    active.phase = 'pickup';
    active.aboard = 0;
    active.routeCp = null;
  }

  // a spot on the pavement beside the pickup marker, pushed clear of the
  // carriageway on the same side of the road and jittered along the kerb.
  //
  // Stunt ramps stand on the verge from 11 m out (see city.js rollStuntSpots),
  // and 14 m lands squarely inside that band: about one fare in fifty was set
  // down on the slope of a wedge, where nobody on foot can reach them and the
  // cab certainly cannot pull up. So the spot is rolled — a fresh place along
  // the kerb first, then in against the pavement, which is inside the ramps —
  // until it stands on something you can walk up to.
  var WAIT_OUT = [14, 14, 14, 9.5, 9.5, 8];
  function kerbWaitSpot(x, z) {
    var rp = GAME.city.nearestRoadPoint(x, z);
    var first = null;
    // one candidate: `out` metres off the road centre on the marker's own
    // side, `along` metres up or down the kerb from it. Answers null if it
    // came out on a wedge.
    function candidate(out, along) {
      var wx, wz;
      if (rp.axis === 'net') {       // a curved road: step out along its normal
        var sgn = U.dist2(x, z, rp.x + Math.cos(rp.heading), rp.z - Math.sin(rp.heading)) <
          U.dist2(x, z, rp.x - Math.cos(rp.heading), rp.z + Math.sin(rp.heading)) ? 1 : -1;
        wx = rp.x + Math.cos(rp.heading) * out * sgn + Math.sin(rp.heading) * along;
        wz = rp.z - Math.sin(rp.heading) * out * sgn + Math.cos(rp.heading) * along;
      } else if (rp.axis === 'z') {          // road runs along z; step out in x
        wx = rp.x + (x >= rp.x ? out : -out);
        wz = z + along;
      } else {                        // road runs along x; step out in z
        wx = x + along;
        wz = rp.z + (z >= rp.z ? out : -out);
      }
      // resolveCircle can shove the point clear of a wall and onto a ramp, so
      // the wedge test comes after the push-out, not before it
      var s = GAME.resolveCircle(wx, wz, 0.5);
      if (!first) first = [s.x, s.z];
      return offRamp(s.x, s.z) ? [s.x, s.z] : null;
    }
    for (var t = 0; t < WAIT_OUT.length; t++) {
      var got = candidate(WAIT_OUT[t], U.randRange(Math.random, -5, 5));
      if (got) return got;
    }
    // Six rolls beaten means a wedge covering the whole width of this stretch
    // of pavement — one of the hand-placed ramps by a landmark, not a verge
    // one. Jittering again would just be more of the same luck, so walk ALONG
    // the kerb in strides instead: a ramp is 34 m end to end at the longest,
    // and two strides leave the longest of them behind for certain.
    for (var d = 12; d <= 24; d += 12) {
      for (var sd = -1; sd <= 1; sd += 2) {
        var g2 = candidate(9.5, d * sd);
        if (g2) return g2;
      }
    }
    return first;
  }

  // flat enough to stand a fare on: the very foot of a wedge is still pavement
  function offRamp(x, z) {
    var r = GAME.city.rampAt(x, z);
    return !r || r.y <= 0.45;
  }

  // Somebody still waiting on you when the shift ends: the arm comes down
  // and they walk off (they used to blink out of the kerb where they stood)
  function letGo(ped) {
    if (!ped || ped.gone || ped.dead) return;
    var j = ped.mesh.userData.joints;
    if (j) { j.armR.rotation.x = 0; j.armR.rotation.z = 0; }
    ped.jobPed = false; ped.state = 'walk'; ped.wpT = 0;
  }
  // The race's field, once it is over: off with the rest of the traffic (a
  // boat to potter about the bay), and gone the usual way once out of sight
  // (`keep` leaves them on the list — the result reads where they finished)
  function releaseRacers(keep) {
    if (!active) return;
    for (var i = 0; i < active.racers.length; i++) {
      var c = active.racers[i];
      if (!c || c.gone) continue;
      if (c.dead || c.spec.heli || c.spec.plane || c.occupied !== 'ai') { if (c.dead) { c.mission = false; continue; } GAME.vehicles.removeCar(c); continue; }
      c.mission = false; c.path = null; c.hp = Math.min(c.hp, c.spec.hp);
      if (c.spec.boat && GAME.sealife && GAME.sealife.adopt) GAME.sealife.adopt(c);
      else c.ai = { mode: 'traffic', desired: 11, laneX: 0, laneZ: 0 };
    }
    if (!keep) active.racers = [];
  }
  // someone standing at the kerb waiting — arm raised, and they stay put
  // (state 'wait' is handled by no movement branch in peds.update)
  function spawnWaitingPed(x, z) {
    var ped = GAME.peds.spawnPed(x, z);
    ped.jobPed = true;
    ped.state = 'wait';
    ped.speed = 0;
    var j = ped.mesh.userData.joints;
    j.armR.rotation.x = -2.6;   // hailing / calling for help
    j.armR.rotation.z = 0.3;
    return ped;
  }

  // the floating marker that hovers over whoever is waiting for you
  function makeArrow() {
    var g = new THREE.ConeGeometry(0.45, 1.0, 4);
    g.rotateX(Math.PI);           // point the tip down at their head
    var m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffe14f }));
    GAME.scene.add(m);
    return m;
  }
  function dropArrow(t) {
    if (!t || !t.arrow) return;
    GAME.scene.remove(t.arrow);
    disposeTree(t.arrow);
    t.arrow = null;
  }
  // if a fare or patient is killed (run over, caught in a blast) the call is
  // reassigned somewhere else — you're never left waiting at a marker for
  // someone who can't come
  function replaceLostTargets() {
    var kind = active.def.id;
    if (kind === 'icecream') {
      // nobody on this job was called out, so nobody is owed a replacement
      for (var w = 0; w < active.targets.length; w++) {
        var wt = active.targets[w];
        if (!wt.ped || wt.ped.dead || GAME.world.peds.indexOf(wt.ped) < 0) {
          dropArrow(wt); active.targets.splice(w--, 1);
        }
      }
      return;
    }
    for (var i = 0; i < active.targets.length; i++) {
      var t = active.targets[i];
      var gone = !t.ped || t.ped.dead || GAME.world.peds.indexOf(t.ped) < 0;
      if (!gone) continue;
      dropArrow(t);

      var f = GAME.focus();
      var band = targetBand();
      var pt = randomRoadPoint(f.x, f.z, band[0], band[1]);
      var wp = kerbWaitSpot(pt[0], pt[1]);
      t.x = pt[0]; t.z = pt[1];
      t.ped = spawnWaitingPed(wp[0], wp[1]);
      t.boarding = false;
      active.routeCp = null;
      updateCp();
      GAME.hud.message(kind === 'ambulance'
        ? 'You lost that patient — a new call is marked.'
        : 'That fare is gone — a new pickup is marked.', 3);
    }
  }

  // bob and spin each arrow above its person
  function updateArrows(dt) {
    if (!active || !active.targets) return;
    for (var i = 0; i < active.targets.length; i++) {
      var t = active.targets[i];
      if (!t.ped || t.ped.dead) { dropArrow(t); continue; }
      if (!t.arrow) t.arrow = makeArrow();
      t.arrow.position.set(t.ped.pos.x, t.ped.pos.y + 2.75 + Math.sin(GAME.time * 3 + i) * 0.18, t.ped.pos.z);
      t.arrow.rotation.y += dt * 2.2;
    }
  }

  // walk anyone who's been hailed over to the vehicle and load them in
  // how long somebody stands at the hatch before they have their cone
  var SERVE_TIME = 1.3;

  function stepBoarding(dt, f, P) {
    for (var i = active.targets.length - 1; i >= 0; i--) {
      var t = active.targets[i];
      if (!t.boarding) continue;
      var ped = t.ped;
      if (!ped || ped.dead) { t.boarding = false; continue; }
      // drove off again — they go back to waiting
      if (U.dist2(f.x, f.z, t.x, t.z) > 40 * 40) { t.boarding = false; continue; }
      var dx = f.x - ped.pos.x, dz = f.z - ped.pos.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      // Ice cream is not an emergency (walkUp is only ever set on the round's
      // customers). A fare hurrying to a waiting cab can sprint; somebody
      // strolling over for a cone should not, and they were covering the
      // ground at 0.85x the player's full sprint and then completing the sale
      // the instant they touched the truck — no walk to it and no moment at
      // the hatch, just people teleporting money into the till.
      var stroll = !!t.walkUp;
      if (d < 2.2) {
        if (!stroll) { collectTarget(t); continue; }
        // served, not spirited: a beat at the window while it is handed over
        t.serveT = (t.serveT || 0) + dt;
        ped.speed = 0;
        ped.heading = Math.atan2(dx, dz);
        ped.mesh.rotation.y = ped.heading;
        var sj = ped.mesh.userData.joints;
        sj.legL.rotation.x = sj.legR.rotation.x = 0;
        // an arm up to the hatch, and back down as they turn away with it
        var reach = U.clamp(t.serveT / (SERVE_TIME * 0.45), 0, 1) *
          U.clamp((SERVE_TIME - t.serveT) / (SERVE_TIME * 0.3) + 1, 0, 1);
        sj.armR.rotation.x = -1.25 * reach;
        sj.armL.rotation.x = 0;
        if (t.serveT >= SERVE_TIME) collectTarget(t);
        continue;
      }
      ped.heading = Math.atan2(dx, dz);
      ped.speed = stroll ? 4.1 : 6.8;   // 6.8 is 0.85x the player's 8 sprint
      ped.pos.x += Math.sin(ped.heading) * ped.speed * dt;
      ped.pos.z += Math.cos(ped.heading) * ped.speed * dt;
      var rp = GAME.resolveCircle(ped.pos.x, ped.pos.z, 0.4);
      ped.pos.x = rp.x; ped.pos.z = rp.z;
      ped.pos.y = GAME.city.groundY(ped.pos.x, ped.pos.z);
      ped.mesh.rotation.y = ped.heading;
      // a run if they are hurrying, an ordinary walk if they are just coming
      // over for one
      ped.walkPhase += ped.speed * dt * (stroll ? 2.2 : 3);
      var j = ped.mesh.userData.joints;
      var sw = Math.sin(ped.walkPhase) * (stroll ? 0.6 : 0.9);
      j.legL.rotation.x = sw; j.legR.rotation.x = -sw;
      j.armL.rotation.x = -sw * (stroll ? 0.8 : 1); j.armR.rotation.set(sw * (stroll ? 0.8 : 1), 0, 0);
    }
  }

  function nearestTarget() {
    if (!active.targets.length) return null;
    var f = GAME.focus(), best = active.targets[0], bd = 1e18;
    for (var i = 0; i < active.targets.length; i++) {
      var d = U.dist2(f.x, f.z, active.targets[i].x, active.targets[i].z);
      if (d < bd) { bd = d; best = active.targets[i]; }
    }
    return best;
  }

  // hospital drop-off: the ambulance bay apron, clear of both the parking spot
  // and any traffic lane (patients were being unloaded in the middle of a road)
  function hospitalDropoff(f) {
    var hs = GAME.city.pois.hospitals, best = null, bd = 1e18;
    var here = GAME.city.islandIdAt(f.x, f.z);
    for (var hi = 0; hi < hs.length; hi++) {
      // the run stays on this landmass — a shift never sends you over a
      // bridge. Mid-crossing ('' — the deck is over water) either side's
      // hospital is fair: the bridge leads to both.
      if (here && GAME.city.islandIdAt(hs[hi].x, hs[hi].z) !== here) continue;
      var dd = U.dist2(f.x, f.z, hs[hi].x, hs[hi].z);
      if (dd < bd) { bd = dd; best = hs[hi]; }
    }
    best = best || hs[0];
    active.hospital = best;
    return clearOfRoad(best.x + 30, best.spawn.z);
  }
  // Where the patients go in: the middle of the hospital's front face. Every
  // hospital faces +z; its main block is the biggest building box across its
  // own x (the cross tower beside it is a thin fin).
  function hospitalDoor(H) {
    var best = null, area = 0;
    GAME.city.hash.query(H.x, H.z, 40).forEach(function (b) {
      if (b.tag !== 'building' || b.h === undefined || b.minX > H.x || b.maxX < H.x) return;
      var a = (b.maxX - b.minX) * (b.maxZ - b.minZ);
      if (a > area) { area = a; best = b; }
    });
    return best ? { x: H.x, z: best.maxZ + 0.6 } : { x: H.spawn.x, z: H.spawn.z };
  }

  // collect whoever is at this stop
  function collectTarget(tgt) {
    if (active.def.id === 'icecream') { iceCreamSale(tgt); return; }
    var i = active.targets.indexOf(tgt);
    if (i >= 0) active.targets.splice(i, 1);
    dropArrow(tgt);
    if (tgt.ped && !tgt.ped.dead) GAME.peds.removePed(tgt.ped);
    active.aboard++;
    GAME.audio.pickup();
    GAME.haptics.pickup();
    var kind = active.def.id;
    var who = kind === 'ambulance' ? 'Patient' : 'Fare';
    // head for the drop-off once we're full or there's nobody else left
    if (active.aboard >= active.capacity || !active.targets.length) {
      active.phase = 'dropoff';
      var db = dropBand();
      active.dropoff = kind === 'ambulance' ? hospitalDropoff(GAME.focus())
        : randomRoadPoint(GAME.focus().x, GAME.focus().z, db[0], db[1]);
      GAME.hud.message(who + ' aboard (' + active.aboard + '/' + active.capacity + ') — ' +
        (kind === 'ambulance' ? 'get to the hospital!' : 'to the drop-off!'), 2.6);
    } else {
      GAME.hud.message(who + ' aboard (' + active.aboard + '/' + active.capacity + ') — ' +
        active.targets.length + ' more waiting', 2.6);
    }
    active.routeCp = null;
    updateCp();
    GAME.hud.missionObjective(objectiveText());
  }

  // everyone aboard is delivered: pay out, then either go back for the rest of
  // this level's people or move up a level
  function completeFare(kind, f, tgt) {
    var n = active.aboard;
    active.jobCount += n;
    var per = (kind === 'ambulance' ? 180 : 130) + active.level * 15;
    var fare = per * n;
    GAME.addCash(fare); active.earned += fare;
    // (a cab firm of yours counts them: business.js)
    if (kind !== 'ambulance' && GAME.business) GAME.business.fare(n);
    GAME.audio.sting('win');
    GAME.haptics.win();
    // Patients walk in through the hospital doors and are gone; they used to
    // step out and wander off into town like anybody else, straight past the
    // place they had been rushed to. A fare still steps off and goes about
    // their business.
    var door = kind === 'ambulance' && active.hospital ? hospitalDoor(active.hospital) : null;
    for (var i = 0; i < n; i++) {
      var out = GAME.peds.spawnPed(tgt[0] + (i - n / 2) * 1.4, tgt[1] + 1.5);
      if (door) GAME.peds.walkInto(out, door.x + (i - (n - 1) / 2) * 0.9, door.z);
      else { out.state = 'flee'; out.fleeT = 3.5; out.fleeX = f.x; out.fleeZ = f.z; }
    }
    active.aboard = 0;
    var word = kind === 'ambulance' ? (n > 1 ? n + ' patients delivered' : 'Patient delivered') : 'Fare dropped';
    var msg = word + '! +$' + fare;
    // Each fare buys the next call and loose change at best — measured, not
    // guessed: a fare's legs route 0.8-1.4 km, 40-60 s at the pace the race
    // rivals set, plus the kerbside pickup, and the calls stretch with the
    // level while the refill does not. Early fares bank a little, the mid
    // shift breaks even, and the deep shift bleeds: a shift is a run at a
    // high score, not a loop you can hold forever. The tight bank cap means
    // even a flawless streak never sits on a cushion.
    active.timeLeft = Math.min(active.timeLeft + (kind === 'ambulance' ? 40 + n * 12 : 48 + n * 8), 120);

    if (active.targets.length) {
      // still people waiting on this level — go back out for them
      active.phase = 'pickup';
      GAME.hud.message(msg + '  ·  ' + active.targets.length + ' still waiting — go back', 3.4);
    } else {
      active.level++;
      var bonus = 100 * (active.level - 1);
      GAME.addCash(bonus); active.earned += bonus;
      msg += '   —   LEVEL ' + active.level + '!  bonus +$' + bonus;
      if (active.level % 5 === 0) {
        var streak = 250 * (active.level / 5);
        GAME.addCash(streak); active.earned += streak;
        msg += '  ·  STREAK +$' + streak;
      }
      // any stars at all and dispatch holds the next round: the drop you just
      // made was the last call until you're clean (the shift stays alive)
      if (GAME.police.wanted > 0) {
        active.holdHeat = true;
        msg += '   —   dispatch holds the next ' + (kind === 'ambulance' ? 'patients' : 'fares') + ' until the heat is off';
        GAME.hud.message(msg, 4.5);
      } else {
        GAME.hud.message(msg, 4);
        startRound();
      }
    }
    active.routeCp = null;
    updateCp();
    GAME.hud.missionObjective(objectiveText());
  }

  // end an ongoing taxi/ambulance shift (clock off, totalled, or timed out)
  // "One cone per person" only holds within a shift. The flag lives on peds
  // that outlive the job — swept here so the next round starts with every
  // pavement a fresh market, however the last one ended (clock-off, totalled,
  // timed out, cut off by dispatch, or the driver getting wasted).
  function clearIceServed() {
    var peds = GAME.world.peds;
    for (var i = 0; i < peds.length; i++) if (peds[i].iceServed) peds[i].iceServed = false;
  }

  function endJob(reason) {
    if (active.def.id === 'icecream') clearIceServed();
    var count = active.jobCount, earned = active.earned, lv = active.level;
    var unit = active.def.id === 'ambulance' ? 'patient' : active.def.id === 'icecream' ? 'sale' : active.def.id === 'vigilante' ? 'suspect' : 'fare';
    // send any waiting people home with the shift. Someone who only wandered
    // over for an ice cream was an ordinary passer-by a minute ago, so they get
    // to carry on being one rather than vanishing off the pavement.
    for (var i = 0; i < active.targets.length; i++) {
      dropArrow(active.targets[i]);
      var tp2 = active.targets[i].ped;
      if (!tp2 || tp2.dead) continue;
      letGo(tp2);
    }
    active.targets = [];
    if (count > 0) {
      GAME.audio.sting('win');
      GAME.haptics.win();
      GAME.hud.message('SHIFT OVER — level ' + lv + ', ' + count + ' ' + unit + (count === 1 ? '' : 's') +
        ', $' + earned + ' earned' + (reason ? '  (' + reason + ')' : ''), 4.5);
      var id = active.def.id;
      var CARD = {
        ambulance: { slug: 'paramedic-shift', eyebrow: 'PARAMEDIC', sub: 'Costa Rosa General — patients delivered', accent: '#ff4d6a', unit: 'Patients' },
        taxifare: { slug: 'taxi-shift', eyebrow: 'TAXI DRIVER', sub: 'Costa Rosa cabs — fares run', accent: '#f0c020', unit: 'Fares' },
        icecream: { slug: 'icecream-round', eyebrow: 'ICE CREAM ROUND', sub: 'Isla Verde — the chimes did their work', accent: '#ffd7e4', unit: 'Sales' },
        vigilante: { slug: 'vigilante-shift', eyebrow: 'VIGILANTE', sub: 'Costa Rosa — suspects taken off the street', accent: '#5aa0ff', unit: 'Suspects' }
      }[id] || { slug: id, eyebrow: 'SHIFT', sub: '', accent: '#38e8ff', unit: 'Jobs' };
      GAME.track('job-completed-' + id);
      GAME.share.show({
        slug: CARD.slug, eyebrow: CARD.eyebrow, title: 'SHIFT OVER', subtitle: CARD.sub,
        accent: CARD.accent,
        stats: [
          { label: 'Level', value: String(lv) },
          { label: CARD.unit, value: String(count) },
          { label: 'Earned', value: '$' + earned }
        ]
      });
    } else {
      GAME.hud.message('Shift over.' + (reason ? ' ' + reason.charAt(0).toUpperCase() + reason.slice(1) + '.' : ''), 2.5);
    }
    cleanup();
  }

  // seed a crowd + traffic around the player so a rampage always has targets
  function spawnRampageTargets(nPeds, nCars) {
    var f = GAME.focus();
    var px = f.x, pz = f.z;
    for (var i = 0; i < nPeds; i++) {
      var a = Math.random() * Math.PI * 2, r = U.randRange(Math.random, 7, 34);
      var x = px + Math.cos(a) * r, z = pz + Math.sin(a) * r;
      if (GAME.city.isInWater(x, z)) continue;
      var rp = GAME.resolveCircle(x, z, 0.5);
      GAME.peds.spawnPed(rp.x, rp.z);
    }
    var types = ['sedan', 'taxi', 'sports', 'van'];
    for (var c = 0; c < nCars; c++) {
      var a2 = Math.random() * Math.PI * 2, r2 = U.randRange(Math.random, 12, 40);
      var rp2 = GAME.city.nearestRoadPoint(px + Math.cos(a2) * r2, pz + Math.sin(a2) * r2);
      if (GAME.city.isInWater(rp2.x, rp2.z)) continue;
      GAME.vehicles.spawnCar(types[Math.floor(Math.random() * types.length)], rp2.x, rp2.z,
        Math.random() * Math.PI * 2,
        { occupied: 'ai', ai: { mode: 'traffic', desired: U.randRange(Math.random, 7, 11), laneX: 0, laneZ: 0 } });
    }
  }

  // point the driver (and the camera) at the first objective, so a run never
  // begins facing a wall you have to three-point-turn away from
  function faceToward(x, z) {
    var P = GAME.player;
    if (P.inCar && P.car) {
      P.car.heading = Math.atan2(x - P.car.pos.x, z - P.car.pos.z);
      P.car.lat = 0;
      GAME.cam.yaw = P.car.heading;
    } else {
      P.heading = Math.atan2(x - P.pos.x, z - P.pos.z);
      GAME.cam.yaw = P.heading;
    }
    GAME.cam.freeT = 0;
  }

  // Into a job from its ring: the cut to Lola's first, if this is one you have
  // not done yet (scenes.js), and the job when she is done talking. A retry
  // never comes this way — relaunch goes straight to start — so a run you
  // just failed is not talked through twice.
  function begin(def) {
    var base = def.orig || def, sc = SCENES[base.id];
    if (sc && (GAME.bests || {})[bestKey(base)] === undefined && GAME.scenes &&
        GAME.scenes.play(sc, function () { start(def, true); })) return;
    start(def);
  }

  function start(def, briefed) {
    var P = GAME.player;
    GAME.track('mission-started-' + def.type);
    retry = null;
    active = {
      def: def, t: 0, cpIndex: 0, score: 0,
      // what you set off in, for a retry to hand back if it did not survive
      carType: P.inCar && P.car && !P.car.spec.heli && !P.car.spec.plane ? P.car.type : null,
      timeLeft: def.time || 0, racers: [], state: 'fade', countdown: 3,
      // a fresh set of drops every time you take the run
      stops: def.type === 'courier' ? rollCourierStops(def) : null
    };
    // races and couriers line you up on the first objective — but the
    // about-face happens behind a fade to black, because watching your own
    // car spun to a new heading read as the game grabbing the wheel. Then
    // everyone waits out the countdown; nothing starts until GO. The blackout
    // runs on game time, not a timer: pausing holds it, and a throttled tab
    // can't leave a mission stranded half-started.
    var first = def.type === 'race' ? def.cps[0] : active.stops ? active.stops[0] : null;
    function arm() {
      if (def.type === 'race' && (!P.inCar || !P.car)) {
        // stepped out of the car during the blackout: scratch the start
        cleanup();
        GAME.hud.message('Race scratched — you left your ride.', 2.5);
        return;
      }
      if (first) faceToward(first[0], first[1]);
      if (def.type === 'race') {
        // The field turns up in something QUICKER than you brought, so the
        // rivals start with an edge rather than having to be handed one.
        //
        // Still within your own class, though. Matching the player's exact car
        // was a fix for rivals in sports cars against a player's motorcycle,
        // which decided the race at the start line — so a bike race is still a
        // bike race, it is just their bike that is better. And the upgrade is
        // capped: a quarter quicker is an edge, twice as quick is a cutscene.
        var rival = rivalUpgrade(P.car && P.car.type);
        var rivalType = rival.type;
        // nothing in the class was faster (you brought the best of it) — then
        // the edge has to come from the engine instead, so they are quicker
        // whatever you arrive in
        active.rivalEdge = rival.edge;
        // The grid forms in FRONT of you and you start on the back row. Lined
        // up behind, all three sat in the chase camera's blind spot: the field
        // was invisible from the lights to the flag, and a race you never see
        // is just a drive. Staggered left and right of the racing line so the
        // lane you launch into is open.
        for (var i = 0; i < 3; i++) {
          // (boats are longer and need room to the side: a hull's length apart)
          var off = (i + 1) * (def.boat ? 9 : 6), side = def.boat ? 4.5 : 3.5;
          var rx = def.start.x + Math.sin(P.car.heading) * off + Math.cos(P.car.heading) * (i % 2 ? side : -side);
          var rz = def.start.z + Math.cos(P.car.heading) * off - Math.sin(P.car.heading) * (i % 2 ? side : -side);
          var car = GAME.vehicles.spawnCar(rivalType, rx, rz, P.car.heading, { occupied: 'ai', ai: { mode: 'race' }, mission: true, color: [0xffe14f, 0xb040ff, 0x38e8ff][i] });
          car.cpIndex = 0;
          // rivals shrug off scrapes — a race should be decided on the road, not by
          // one of them cooking off against a lamp post
          car.hp = car.spec.hp * 5;
          active.racers.push(car);
        }
      } else if (def.type === 'rampage') {
        // the arsenal arrives on GO, and on loan — what was granted is
        // remembered so it can be reclaimed at the end (otherwise the marker
        // is a free-ammo dispenser on repeat), and a start that never reaches
        // GO grants nothing, so there is nothing to claw back
        active.goSetup = function () {
          active.grantWeapon = def.weapon;
          active.grantAmmo = def.ammo;
          active.grantHad = !!(P.weapons[def.weapon] && P.weapons[def.weapon].have);
          GAME.combat.giveWeapon(def.weapon, def.ammo);
          active.topupT = 0;
          spawnRampageTargets(14, 6);
          GAME.hud.message('Cause $' + def.target + ' of mayhem! Wreck cars and crowds.', 3.5);
        };
      } else if (def.type === 'takedown') {
        active.goSetup = function () {
          if (!spawnTarget(def)) { finish(false, 'The target is nowhere to be found.'); return; }
          GAME.hud.message(def.early ? 'The target is running — catch and wreck them!' : 'The target is marked. Wreck the car — or make the driver give it up.', 3.5);
        };
      } else {
        active.goSetup = function () { GAME.hud.message(def.boat ? 'First package is marked — it\'s floating out in the bay.' : 'First delivery is marked.', 3); };
      }
      active.state = 'countdown';
      GAME.hud.missionObjective(objectiveText());
    }
    if (first) { active.arm = arm; active.fadeT = 0.55; GAME.hud.fadeSet(1); }
    else arm();
    setMarkersVisible(false);
    GAME.hud.missionStart(def.name, objectiveText());
    GAME.audio.pickup();
    if (LOLA[def.id] && !briefed) lola(LOLA[def.id][0]);
    updateCp();
  }

  // A rival is still racing while there is somebody at their wheel: a wreck is
  // out, and so is a car its driver has bailed out of, or a bike its rider was
  // shot off — rolling to a stop with nobody aboard is not a place in the field.
  function inRace(r) { return !r.dead && r.occupied === 'ai'; }

  // race position: further along the checkpoint list wins, ties broken by who's
  // closer to the next one. Returns 1-based place among player + rivals.
  function racePosition() {
    if (!active || active.def.type !== 'race') return 1;
    var d = active.def, P = GAME.player;
    var px = P.car ? P.car.pos.x : P.pos.x, pz = P.car ? P.car.pos.z : P.pos.z;
    var pcp = d.cps[Math.min(active.cpIndex, d.cps.length - 1)];
    var pd = U.dist2(px, pz, pcp[0], pcp[1]);
    var place = 1;
    for (var i = 0; i < active.racers.length; i++) {
      var r = active.racers[i];
      if (!inRace(r)) continue;
      var ri = r.cpIndex || 0;
      if (ri > active.cpIndex) { place++; continue; }
      if (ri < active.cpIndex) continue;
      var rcp = d.cps[Math.min(ri, d.cps.length - 1)];
      if (U.dist2(r.pos.x, r.pos.z, rcp[0], rcp[1]) < pd) place++;
    }
    return place;
  }
  function ordinal(n) { return n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'); }

  function objectiveText() {
    if (!active) return '';
    var d = active.def;
    if (active.stage) return actText();
    if (d.type === 'race') {
      var field = 1 + active.racers.filter(inRace).length;
      return ordinal(racePosition()) + ' / ' + field + '   ·   Checkpoint ' + (active.cpIndex + 1) + ' / ' + d.cps.length;
    }
    if (d.type === 'courier' && d.boat) {
      var pk = active.stops.length - 1;
      return active.cpIndex < pk ? 'Package ' + (active.cpIndex + 1) + ' / ' + pk : 'Bring them in to the pier';
    }
    if (d.type === 'courier') return 'Delivery ' + (active.cpIndex + 1) + ' / ' + active.stops.length;
    if (d.type === 'icecream') {
      return 'Round ' + active.level + '  ·  sold ' + active.sales + ' / ' + active.quota +
        '  ·  $' + active.earned + ' taken' + (active.callT > 0 ? '' : '  ·  ' + hornKey() + ' plays the chimes');
    }
    if (d.type === 'vigilante') {
      var pp = active.perp, ff = GAME.focus();
      var dm = pp && !pp.gone ? Math.round(Math.sqrt(U.dist2(ff.x, ff.z, pp.pos.x, pp.pos.z))) : 0;
      return 'Lv ' + active.level + '  ·  ' + (active.fleeing ? 'Stop the suspect' : 'Find the suspect') +
        '  ·  ' + dm + ' m  ·  ' + active.jobCount + ' down';
    }
    if (d.type === 'takedown' && active.phase && active.phase !== 'car') {
      var pt = currentCp(), pf = GAME.focus();
      var pm = pt ? Math.round(Math.sqrt(U.dist2(pf.x, pf.z, pt[0], pt[1]))) : 0;
      if (active.phase === 'foot') return 'Put him down  ·  ' + pm + ' m';
      if (active.phase === 'ledger') return 'Take the ledger off him  ·  ' + pm + ' m';
      var hv = active.heavies, chased = hv && !hv.out ? !hv.car.dead : hv && hv.men.some(function (m) { return !m.dead && !m.gone; });
      return 'The ledger to Lola\'s lock-up  ·  ' + pm + ' m' + (chased ? '  ·  Rico\'s men on you' : '');
    }
    if (d.type === 'takedown') {
      var tg = active.perp, tf = GAME.focus();
      if (!tg) return 'Find the target';
      var tm = Math.round(Math.sqrt(U.dist2(tf.x, tf.z, tg.pos.x, tg.pos.z)));
      var arm = Math.max(0, Math.round(100 * (tg.hp - active.maxHp * TARGET_GIVE_UP) / (active.maxHp * (1 - TARGET_GIVE_UP))));
      return (active.fleeing ? 'Stop the target' : 'Find the target') + '  ·  ' + tm + ' m  ·  ' + arm + '% left in it';
    }
    if (d.type === 'taxifare' || d.type === 'ambulance') {
      var amb = d.type === 'ambulance';
      var head = active.phase === 'pickup'
        ? (amb ? 'Collect patient' : 'Pick up the fare') + (active.targets.length > 1 ? ' (' + active.targets.length + ' waiting)' : '')
        : (amb ? 'To the hospital' : 'To the drop-off');
      var load = active.capacity > 1 ? '  ·  aboard ' + active.aboard + '/' + active.capacity : '';
      return 'Lv ' + active.level + '  ·  ' + head + load + '  ·  ' + active.jobCount + ' done';
    }
    return '$' + Math.floor(active.score) + ' / $' + d.target;
  }

  function currentCp() {
    var d = active.def;
    if (active.stage) return actCp();
    if (d.type === 'race') return d.cps[active.cpIndex] || null;
    if (d.type === 'courier') return active.stops[active.cpIndex] || null;
    if (d.type === 'taxifare' || d.type === 'ambulance') {
      if (active.phase !== 'pickup') return active.dropoff;
      var t = nearestTarget();
      return t ? [t.x, t.z] : null;
    }
    if (d.type === 'icecream') return null;   // no destination: the chimes ARE the job
    if (d.type === 'takedown' && active.phase === 'foot') return active.foot && !active.foot.gone ? [active.foot.pos.x, active.foot.pos.z] : null;
    if (d.type === 'takedown' && active.phase === 'ledger') return [active.ledger.x, active.ledger.z];
    if (d.type === 'takedown' && active.phase === 'deliver') return [active.drop.x, active.drop.z];
    if (d.type === 'vigilante' || d.type === 'takedown') return active.perp && !active.perp.gone ? [active.perp.pos.x, active.perp.pos.z] : null;
    return null;
  }

  // where a ring stands: the road, or for a job on the water, the sea
  function markerFloor(d, x, z) { return d.boat ? GAME.city.seaLevel : GAME.city.groundY(x, z); }
  function updateCp() {
    if (!active || (active.def.type === 'rampage' && !active.stage)) { if (cpMarker) cpMarker.visible = false; return; }
    var cp = currentCp();
    if (cp) {
      cpMarker.visible = true;
      cpMarker.position.set(cp[0], markerFloor(active.def, cp[0], cp[1]) + 1.7, cp[1]);
    } else cpMarker.visible = false;
    placeCrate();
  }

  function setMarkersVisible(v) {
    for (var i = 0; i < markers.length; i++) markers[i].mesh.visible = v;
  }

  function finish(win, reason) {
    var d = active.def;
    // the job's own part won, with more of the story still to play
    if (win && hasActs(d) && !active.stage) { beginActs(); return; }
    if (GAME.guide) GAME.guide.finished(d, win, reason === ABANDONED);
    if (d.id === 'icecream') clearIceServed();   // the wasted/failed path skips endJob
    var reward = active.reward || d.reward || 0;
    if (win) {
      var value = d.type === 'rampage' ? Math.floor(active.score) : Math.round((active.wonT !== undefined ? active.wonT : active.t) * 10) / 10;
      var bests = GAME.bests || (GAME.bests = {});
      var prev = bests[bestKey(d)];
      var isBest = d.type === 'rampage' ? (!prev || value > prev) : (!prev || value < prev);
      if (isBest) bests[bestKey(d)] = value;
      // Rico's last ride makes the papers (herald.js — the once-only story)
      if (d.id === 'hit2' && prev === undefined && GAME.herald) GAME.herald.front('rico');
      GAME.addCash(reward);
      // finishing enough work is what opens the channel
      var opened = GAME.isla && GAME.isla.checkUnlock();
      GAME.audio.sting('win');
      GAME.haptics.win();
      var head = d.job ? 'JOB DONE! +$' : 'MISSION PASSED! +$';
      // races report the finishing place and time alongside the payout
      if (d.type === 'race') {
        var field = active.field || 1 + active.racers.length;
        head = 'RACE WON — 1st / ' + field + '  ·  ' + value.toFixed(1) + 's  ·  +$';
      }
      // A rampage won is paid for with the heat it raised: twenty bodies
      // walked you up to four stars, and the pass took the gun straight back
      // (cleanup) — leaving you at a roadblock with your fists. Whoever set
      // the job up makes the worst of it go away; two stars is still yours.
      var cooled = d.type === 'rampage' && GAME.police.wanted > RAMPAGE_HEAT_LEFT;
      if (cooled) GAME.police.setWanted(RAMPAGE_HEAT_LEFT);
      GAME.hud.message(head + reward + (isBest ? '  ·  NEW BEST!' : '') +
        (cooled ? '  ·  your people cooled it down to two stars' : ''), 4.5);
      // what it counts toward, while the channel is still shut — said only on
      // the title and pause screens before, never in play
      if (!d.job && !opened && GAME.isla && !GAME.isla.isOpen()) {
        var up = GAME.isla.unlockProgress();
        GAME.hud.message(up.done + ' of ' + up.need + ' missions toward the bridges to Isla Verde', 4.5);
      }
      GAME.track('mission-completed-' + d.type);
      // a finished run is worth showing off — the card carries the numbers
      var cardStats = [{ label: 'Reward', value: '$' + reward }];
      if (d.type === 'race') {
        cardStats.unshift({ label: 'Place', value: '1st / ' + (active.field || 1 + active.racers.length) });
        cardStats.push({ label: 'Time', value: value.toFixed(1) + 's' });
      } else if (d.type === 'rampage') {
        cardStats.push({ label: 'Mayhem', value: '$' + value });
      } else {
        cardStats.push({ label: 'Time', value: value.toFixed(1) + 's' });
      }
      if (isBest) cardStats.push({ label: 'Result', value: 'NEW BEST' });
      // Lola's word on it, the first time — and the next chapter when the
      // bridges open, or the last when there is no work of hers left
      if (prev === undefined && LOLA[d.id]) lola(LOLA[d.id][1]);
      if (prev === undefined && RICO[d.id]) rico(RICO[d.id], 7);
      if (opened) lola('The bridges east are open. Isla Verde is waiting for you — and so is Rico. Find my rings over there.', 7);
      else if (prev === undefined && !d.job && namedDone() === DEFS.length) {
        lola('That\'s every job I had. The town is yours to enjoy — and somebody told me about tapes hidden all over it…', 8);
      }
      if (opened) return cleanup();     // the bridges card takes the screen
      GAME.share.show({
        slug: d.id,
        eyebrow: typeLabel(d) || 'COSTA ROSA · 1986',
        title: d.type === 'race' ? 'RACE WON' : 'MISSION PASSED',
        subtitle: d.name,
        accent: d.type === 'race' ? '#ff8a3d' : d.type === 'rampage' ? '#ff4fa3' : d.type === 'takedown' ? '#ff3b3b' : '#38e8ff',
        stats: cardStats
      });
    } else {
      GAME.audio.sting('wasted');
      var tail = '', quit = reason === ABANDONED;
      if (d.type === 'race' && !quit) {
        var f2 = 1 + active.racers.length;
        // abandoning the car is a DNF — don't credit a position you walked away from
        tail = (GAME.player.inCar && GAME.player.car && !GAME.player.car.dead)
          ? '  ·  finished ' + ordinal(racePosition()) + ' / ' + f2
          : '  ·  DNF';
      }
      // a death or an arrest offers it once you are back on your feet
      var down = GAME.player.state !== 'alive';
      if (!d.job) retry = { def: d, carType: active.carType, until: GAME.time + RETRY_WINDOW, waitRespawn: down };
      GAME.hud.message((quit ? 'MISSION ABANDONED' : 'MISSION FAILED — ' + reason) + tail + (retry && !down ? '  ·  ' + retryHint() : ''), 4);
    }
    cleanup();
  }

  // A failed run left you to make your own way back to its marker: often a
  // kilometre from where a race or a delivery came apart, and further still
  // from the hospital. For a few seconds after it fails, Y (or RETRY) puts
  // you back on the start line in what you set off in and runs it again. The
  // heat still closes every start line, this one included.
  var RETRY_WINDOW = 12;
  // the retry key as it is bound, or the pad's button while on the pad
  function retryHint() { return (GAME.controls ? GAME.controls.label('KeyY') : 'Y') + ' to retry'; }
  var retry = null;
  function stepRetry(dt, P, hot) {
    if (retry.fadeT !== undefined) {
      retry.fadeT -= dt;
      if (retry.fadeT <= 0) { var r = retry; retry = null; relaunch(r); }
      return true;
    }
    if (retry.waitRespawn) {
      retry.waitRespawn = false;
      retry.until = GAME.time + RETRY_WINDOW;
      GAME.hud.message(retryHint() + ': ' + retry.def.name, 4);
    }
    if (GAME.time > retry.until || !defAvailable(retry.def)) { retry = null; return false; }
    if (GAME.keyPressed('KeyY') || GAME.input.touch.retry) {
      GAME.input.touch.retry = false;
      if (hot) {
        GAME.hud.message('Lose the stars first — nobody starts a run with the heat on you.', 2.5);
        return true;
      }
      retry.fadeT = 0.45;
      GAME.hud.fadeSet(1);
      return true;
    }
    return false;
  }
  function relaunch(r) {
    var P = GAME.player, d = r.def;
    var need = d.type === 'race' || d.type === 'courier';
    var ride = P.inCar && P.car && !P.car.dead && !P.car.sinking && !P.car.spec.heli && !P.car.spec.plane &&
      !!P.car.spec.boat === !!d.boat ? P.car : null;
    if (P.inCar && !ride) GAME.exitCar();
    if (need && !ride) {
      ride = GAME.vehicles.spawnCar(d.boat ? 'boat' : r.carType || 'sedan', d.start.x, d.start.z, 0, {});
      if (ride) GAME.seatInCar(ride);
    }
    if (ride && P.car === ride) {
      ride.pos.set(d.start.x, d.boat ? GAME.city.seaLevel : GAME.city.groundY(d.start.x, d.start.z), d.start.z);
      ride.speed = 0; ride.lat = 0; ride.vy = 0; ride.air = 0; ride.jumpRamp = null;
      ride.airVX = ride.airVZ = undefined;
    } else {
      P.pos.set(d.start.x, GAME.city.groundY(d.start.x, d.start.z), d.start.z);
      P.velY = 0; P.airborne = false;
    }
    start(d);
    // a run with no first objective to turn you toward arms at once, with no
    // blackout of its own to lift
    if (active && active.state !== 'fade') GAME.hud.fadeSet(0);
    if (!active) GAME.hud.fadeSet(0);
  }

  function cleanup() {
    if (active) {
      releaseRacers(true);
      // a vigilante suspect still out there goes back to being ordinary
      // traffic, however the shift ended
      if (active.perp && !active.perp.gone) { active.perp.perp = false; active.perp.mission = false; }
      if (active.def.type === 'takedown') releaseTakedown();
      if (active.targets) {
        for (var ti = 0; ti < active.targets.length; ti++) {
          var tp = active.targets[ti].ped;
          dropArrow(active.targets[ti]);
          if (!tp || tp.dead) continue;
          letGo(tp);
        }
      }
      // reclaim the rampage loadout so the marker can't be farmed for ammo
      reclaimGrant();
      // and whatever an act after the job had out (a bag, a crew, a car of
      // Rico's men) goes back to being the street's
      if (active.stage && active.stage.a) endAct(active.stage);
    }
    // whichever marker that was waits until you have left it (see START_SPEED)
    // (a gentler copy of a job — guide.js — still means its own ring)
    if (active && active.def) leaveFirst = active.def.orig || active.def;
    active = null;
    abandonAsk = 0;
    cpMarker.visible = false;
    if (crate) crate.visible = false;
    setMarkersVisible(true);
    GAME.hud.fadeSet(0);   // a start that dies mid-blackout takes the black with it
    GAME.hud.missionEnd();
    GAME.save();
  }

  function reclaimGrant() {
    if (!active.grantWeapon) return;
    var inv = GAME.player.weapons[active.grantWeapon];
    if (inv) {
      inv.ammo = Math.max(0, inv.ammo - (active.grantAmmo || 0));
      if (!active.grantHad && inv.ammo <= 0) inv.have = false;
      if (GAME.player.currentWeapon === active.grantWeapon && !inv.have) GAME.player.currentWeapon = 'fist';
    }
    active.grantWeapon = null;
    GAME.combat.refreshWeaponHud();
  }

  function failActive(reason) {
    if (active) finish(false, reason);
  }
  // walking away: a shift clocks off (pay for what you did), a mission fails
  // as abandoned — and offers the retry like any other, which makes it the
  // restart button too
  var ABANDON_CONFIRM = 3, ABANDONED = 'abandoned', abandonAsk = 0;
  function abandon() {
    abandonAsk = 0;
    if (!active) return (GAME.strangers && GAME.strangers.abandon()) || (GAME.heist ? GAME.heist.abandon() : false);
    GAME.track('mission-abandoned');
    if (active.def.job) endJob('clocked off');
    else finish(false, ABANDONED);
    return true;
  }

  function notifyChaos(pts) {
    if (active && active.def.type === 'rampage' && active.state === 'run' && !active.stage) {
      active.score += pts;
      GAME.hud.missionObjective(objectiveText());
    }
  }

  // The quickest thing in the player's own class that is not more than a
  // quarter faster than what they brought. Aircraft are never rivals in a
  // street race, and neither is a police cruiser — it is the law, not a rival,
  // and a white car with a lightbar in the field reads as a chase.
  var RIVAL_CAP = 1.25, RIVAL_ENGINE_EDGE = 1.08;
  function rivalUpgrade(playerType) {
    var T = GAME.vehicles.TYPES;
    var mine = T[playerType];
    if (!mine) return { type: 'sports', edge: 1 };
    var best = playerType, bestSp = mine.maxSpeed;
    for (var k in T) {
      var s = T[k];
      // (nor the law's own launch, nor a jet ski: a regatta is raced in boats)
      if (s.heli || s.plane || k === 'police' || s.police || s.jetski || s.army || s.rc) continue;
      if (!!s.bike !== !!mine.bike || !!s.boat !== !!mine.boat) continue;
      if (s.maxSpeed > bestSp && s.maxSpeed <= mine.maxSpeed * RIVAL_CAP) { best = k; bestSp = s.maxSpeed; }
    }
    // (a boat race is the one class with nothing quicker in it, and no
    // corners or traffic to lose time to either: an edge on the engine there
    // is a race decided at the start, so the field races the boat you brought)
    return { type: best, edge: best === playerType && !mine.boat ? RIVAL_ENGINE_EDGE : 1 };
  }

  function racerControls(car, dt) {
    var d = active.def;
    var cp = d.cps[Math.min(car.cpIndex, d.cps.length - 1)];
    if (U.dist2(car.pos.x, car.pos.z, cp[0], cp[1]) < 144) {
      car.cpIndex++;
      if (car.cpIndex >= d.cps.length) return null; // finished
      cp = d.cps[car.cpIndex];
      car.path = null;
    }
    // rivals drive the streets to the next checkpoint. Beelining at a diagonal
    // checkpoint just parks them against a building, which is what made the
    // field look slow — they were stuck, not slow. (A boat race is laid out
    // in open water, every leg clear: a boat makes straight for the mark.)
    car.pathT = (car.pathT || 0) - dt;
    if (car.spec.boat) car.path = [cp];
    else if (!car.path || !car.path.length || car.pathT <= 0) {
      car.pathT = 2.5;
      var nodes = GAME.nav.roadPath(car.pos.x, car.pos.z, cp[0], cp[1]);
      var pts = [];
      for (var i = 0; i < nodes.length; i++) pts.push([nodes[i].x, nodes[i].z]);
      pts.push(cp);
      var toCp = U.dist2(car.pos.x, car.pos.z, cp[0], cp[1]);
      // drop leading nodes we're already on top of, or that would send us
      // backwards away from the checkpoint (the nearest node can be behind us)
      while (pts.length > 1 && (U.dist2(car.pos.x, car.pos.z, pts[0][0], pts[0][1]) < 400 ||
        U.dist2(pts[0][0], pts[0][1], cp[0], cp[1]) > toCp)) pts.shift();
      car.path = pts;
    }
    var tgt = car.path[0];
    if (car.path.length > 1 && U.dist2(car.pos.x, car.pos.z, tgt[0], tgt[1]) < 256) {
      car.path.shift();
      tgt = car.path[0];
    }
    var dx = tgt[0] - car.pos.x, dz = tgt[1] - car.pos.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    var dh = U.wrapPI(Math.atan2(dx, dz) - car.heading);
    // committed on the straights, but genuinely brake for corners — flat-out
    // into a junction just puts them into a wall
    var ad = Math.abs(dh);
    var throttle = 1;
    if (ad > 1.0 && Math.abs(car.speed) > 16) throttle = -0.5;
    else if (ad > 0.55) throttle = 0.45;
    else if (ad > 0.3) throttle = 0.78;
    // ease off on the approach so they arrive at a sane speed
    else if (dist < 26 && Math.abs(car.speed) > 30) throttle = 0.5;
    // Two-way rubber band: leaders ease a little, stragglers get a push, so
    // the pack stays on your bumper instead of falling away.
    //
    // It used to scale THROTTLE and clamp the result at 1, which handed a
    // trailing rival nothing whatsoever — on a straight they are already flat
    // out, so the boost was thrown away by the clamp. And every rival trails,
    // because they all start behind you. Worse, rivals drive the same car you
    // do by design, so matching your throttle can only ever match your speed:
    // no amount of pedal closes a gap. The band moves what the car is CAPABLE
    // of instead, which is the only lever that can.
    var lead = car.cpIndex - active.cpIndex;
    var edge;
    // On the water the band is gentler: open-water legs are all straights,
    // so a rival pushed past your top speed simply could not be beaten.
    var bandUp = car.spec.boat ? 0.05 : 0.13, bandDown = car.spec.boat ? 0.09 : 0.05;
    if (lead > 0) edge = 1 - bandDown;
    else if (lead < 0) edge = 1 + bandUp;
    else {
      // same checkpoint, so whoever is further from it is the one behind
      var pc = GAME.player.car;
      var cpNow = d.cps[Math.min(active.cpIndex, d.cps.length - 1)];
      var mine = U.dist(car.pos.x, car.pos.z, cpNow[0], cpNow[1]);
      var yours = pc ? U.dist(pc.pos.x, pc.pos.z, cpNow[0], cpNow[1]) : mine;
      edge = 1 + U.clamp((mine - yours) / 320, -bandDown, bandUp);
    }
    // the band rides on top of whatever edge the field started with
    car.raceEdge = edge * (active.rivalEdge || 1);
    // the handbrake is for genuine hairpins only; using it mid-corner spins them
    var handbrake = ad > 1.5 && Math.abs(car.speed) > 30;

    // look ahead and lift for anything in the way — rivals shouldn't win by
    // shunting the player off the start line
    var fx = Math.sin(car.heading), fz = Math.cos(car.heading);
    var look = 6 + Math.abs(car.speed) * 0.55;
    var steerBias = 0;
    var cars = GAME.world.cars;
    for (var oi = 0; oi < cars.length; oi++) {
      var o = cars[oi];
      if (o === car || o.dead) continue;
      var odx = o.pos.x - car.pos.x, odz = o.pos.z - car.pos.z;
      var fd = odx * fx + odz * fz;
      if (fd < 0.5 || fd > look) continue;
      if (Math.abs(odx * fz - odz * fx) > 2.8) continue;
      throttle = fd < look * 0.45 ? -0.6 : Math.min(throttle, 0);
      // ease around rather than sitting on their bumper
      steerBias = (odx * fz - odz * fx) > 0 ? -0.45 : 0.45;
      break;
    }
    if (Math.abs(car.speed) < 1) { car.unstickT = (car.unstickT || 0) + dt; } else car.unstickT = 0;
    if (car.unstickT > 1.5) car.reverseT = 0.9;
    if (car.reverseT > 0) { car.reverseT -= dt; return { throttle: -1, steer: dh > 0 ? -1 : 1, handbrake: false }; }
    return { throttle: throttle, steer: U.clamp(dh * 2.6 + steerBias, -1, 1), handbrake: handbrake };
  }

  // Lola introduces herself a few seconds into a first game, once
  var introT = 0;
  function storyIntro(dt, P) {
    if (!GAME.started || P.state !== 'alive' || active) return;
    if (GAME.prefs && GAME.prefs.storyIntro) return;
    introT += dt;
    if (introT < 3) return;
    GAME.prefs = GAME.prefs || {};
    GAME.prefs.storyIntro = true;
    GAME.save();
    // a brand new save: she offers to show you around instead (guide.js)
    if (GAME.guide && GAME.guide.offer()) return;
    lola('Welcome to Costa Rosa, kid. I\'m Lola — I run the strip. You need work, I have work: the rings on your map are mine. Start with a race, and win it.', 9);
  }

  function update(dt) {
    resprayCooldown -= dt;
    var P = GAME.player;
    var t = GAME.time;
    storyIntro(dt, P);
    // pulse markers
    for (var i = 0; i < markers.length; i++) {
      if (markers[i].mesh.visible) {
        markers[i].mesh.material.opacity = 0.3 + 0.15 * Math.sin(t * 3 + i);
        markers[i].mesh.rotation.y += dt * 0.6;
      }
    }
    if (cpMarker.visible) cpMarker.material.opacity = 0.35 + 0.2 * Math.sin(t * 4);

    checkRespray();

    if (!active) {
      if (P.state !== 'alive') return;
      // a stranger's favour under way is finished (or walked away from)
      // before anything else starts (strangers.js)
      // (and so is a part of Lola's big score: heist.js)
      if ((GAME.strangers && GAME.strangers.busy) || (GAME.heist && GAME.heist.busy)) { GAME.jobAvailable = null; GAME.retryAvailable = false; GAME.hud.setPoiHint(''); return; }
      // taxi / ambulance jobs start from within the vehicle
      var jobKind = null;
      if (P.inCar && P.car) {
        if (P.car.spec.cab) jobKind = 'taxifare';     // a fleet cab or the Zebra Cab
        else if (P.car.type === 'ambulance') jobKind = 'ambulance';
        else if (P.car.type === 'icecream') jobKind = 'icecream';
        else if (P.car.type === 'police') jobKind = 'vigilante';
      }
      // Nobody hires a driver the police are actively chasing: no mission or
      // shift starts while you carry stars. Lose the heat first — respray,
      // bribe, or lie low.
      var hot = GAME.police.wanted > 0;
      // ...except the one job that works off your record: a stolen cruiser is
      // stars on you by definition, and vigilante work is how they come off
      var jobHot = hot && jobKind !== 'vigilante';
      GAME.jobAvailable = jobHot ? null : jobKind;
      if (GAME.jobAvailable && GAME.lola) GAME.lola.first('job');
      GAME.retryAvailable = !!retry && !retry.waitRespawn && retry.fadeT === undefined;
      if (retry && stepRetry(dt, P, hot)) return;
      if (jobKind && (GAME.keyPressed('KeyJ') || GAME.input.touch.job)) {
        GAME.input.touch.job = false;
        if (jobHot) {
          GAME.hud.message('Nobody rides with the heat on you — lose the stars first.', 2.5);
          return;
        }
        startJob(jobKind);
        return;
      }
      var px = P.inCar ? P.car.pos.x : P.pos.x, pz = P.inCar ? P.car.pos.z : P.pos.z;
      var py = P.inCar ? P.car.pos.y : P.pos.y;
      // Everything below is a street-level prompt and every test for it looks
      // only at the ground plane, so flying over a marker reads as standing on
      // it. Set down first — a landed aircraft is close enough to count.
      if (py - GAME.city.groundY(px, pz) > 4) { GAME.hud.setPoiHint(''); return; }
      // The nearest thing worth naming, kept as a few numbers — what it is,
      // which one, how far, and which note it carries — and put into words
      // only when that changes (poiHintText). Every marker in range used to
      // build its whole label every tick, shown or not.
      var hk = 0, ho = null, hd = 0, hn = 0;
      for (var m = 0; m < markers.length; m++) {
        var d = markers[m].def;
        if (!defAvailable(d)) { markers[m].mesh.visible = false; continue; }
        markers[m].mesh.visible = true;
        // races and courier deliveries need a vehicle; rampages can start on foot
        var need = d.type === 'race' || d.type === 'courier' || d.type === 'takedown';
        var air = P.car && (P.car.spec.heli || P.car.spec.plane);
        // and a job on the water wants a boat under you (a road job never
        // finds one there: its ring is on the street)
        var wrongHull = need && P.inCar && !!d.boat !== !!(P.car && P.car.spec.boat);
        var dd = U.dist2(px, pz, d.start.x, d.start.z);
        // (six metres for a vehicle: four and a half took five or ten goes
        // of shuffling back and forth to land in)
        var inRing = dd < (need ? 36 : 7);
        var slow = !P.inCar || Math.abs(P.car.speed) < START_SPEED;
        if (leaveFirst === d && dd > REARM_R2) leaveFirst = null;
        // name what the marker is (and what it wants) whenever you're standing near it
        if (dd < 34 * 34 && (!hk || dd < hd)) {
          hk = 1; ho = d; hd = dd;
          hn = hot ? 1 : need && !P.inCar ? (d.boat ? 7 : 2) : wrongHull ? (d.boat ? 7 : 2) : d.type === 'race' && air ? 3
            : leaveFirst === d ? 6 : inRing ? (slow ? 4 : 5) : 0;
        }
        if (hot) continue;   // wanted stars close every start line
        if (need && !P.inCar) continue;
        if (wrongHull) continue;
        // no cheesing a street race from a helicopter or plane
        if (d.type === 'race' && air) continue;
        if (inRing && slow && leaveFirst !== d) {
          // her guided first run is the same job, made gentler (guide.js)
          begin(GAME.guide ? GAME.guide.jobFor(d) : d);
          hk = 0;
          break;
        }
      }
      // respray garages announce themselves the same way
      var doors = GAME.city.pois.resprays;
      for (var rg = 0; rg < doors.length; rg++) {
        var rd = U.dist2(px, pz, doors[rg].door.x, doors[rg].door.z);
        if (rd < 34 * 34 && (!hk || rd < hd)) { hk = 2; ho = doors[rg]; hd = rd; hn = P.inCar ? 1 : 0; }
      }
      // and the shops share the one readout instead of talking over it
      var sh = GAME.shops && GAME.shops.nearHint(px, pz);
      if (sh && (!hk || sh.d < hd)) {
        GAME.hud.setPoiHint(sh.text);
        if (GAME.lola && !P.inCar) GAME.lola.first('shop');   // the first door you walk up to
      }
      else GAME.hud.setPoiHint(hk ? poiHintText(hk, ho, hn) : '');
      return;
    }
    GAME.jobAvailable = null;
    GAME.retryAvailable = false;
    GAME.hud.setPoiHint('');
    // J (or the JOB button) again clocks off an ongoing shift
    if (active.def.job && (GAME.keyPressed('KeyJ') || GAME.input.touch.job)) {
      GAME.input.touch.job = false;
      endJob('clocked off');
      return;
    }
    // X walks away from it. There was no way out of a run you had gone off
    // short of dying or getting arrested — a race that started by accident
    // had to be lost the long way. Once asks, again inside three seconds
    // means it (ABANDON on the pause screen asks the same way).
    if (GAME.keyPressed('KeyX')) {
      if (GAME.time < abandonAsk) { abandon(); return; }
      abandonAsk = GAME.time + ABANDON_CONFIRM;
      var xk = GAME.controls ? GAME.controls.label('KeyX') : 'X';
      GAME.hud.message(xk + ' again to ' + (active.def.job ? 'clock off' : 'abandon ' + active.def.name), ABANDON_CONFIRM);
    }

    // active mission
    var d2 = active.def;
    active.t += dt;
    if (active.state === 'fade' || active.state === 'countdown') {
      // held on the line: the car sits, the rivals sit, no mission clock runs
      if (P.car) { P.car.controls.throttle = 0; P.car.speed *= 0.9; }
      for (var r0 = 0; r0 < active.racers.length; r0++) active.racers[r0].controls = { throttle: 0, steer: 0, handbrake: true };
      if (active.state === 'fade') {
        active.fadeT -= dt;
        if (active.fadeT <= 0) {
          GAME.hud.fadeSet(0);
          var armFn = active.arm; active.arm = null;
          if (armFn) armFn();   // may scratch the start, which clears `active`
        }
        return;
      }
      if (active.state === 'countdown') {
        active.countdown -= dt;
        if (active.countdown <= 0) {
          active.state = 'run'; active.t = 0;
          GAME.hud.bigCount('GO!');
          GAME.audio.pickup();
          GAME.haptics.checkpoint();
          if (active.goSetup) { active.goSetup(); active.goSetup = null; }
          // the way out of a run, said the first time one starts
          if (GAME.prefs && !GAME.prefs.abandonTold) {
            GAME.prefs.abandonTold = true;
            GAME.save();
            var padNow = GAME.controls && GAME.controls.usingPad();
            GAME.hud.message(GAME.isTouch || padNow ? 'Changed your mind? Pause' + (padNow ? ' (START)' : '') + ' → ABANDON MISSION walks away from a run.'
              : 'Changed your mind? ' + (GAME.controls ? GAME.controls.label('KeyX') : 'X') + ' twice walks away from a run.', 4);
          }
        } else {
          var num = Math.max(1, Math.ceil(active.countdown));
          if (num !== active.lastNum) { active.lastNum = num; GAME.audio.cashTick(); }
          GAME.hud.bigCount(num);
        }
      }
      return;
    }

    if (active.stage) {
      updateAct(dt, P);
    } else if (d2.type === 'race') {
      if (!P.inCar || !P.car || P.car.dead) { finish(false, 'You lost your ride.'); return; }
      for (var r = 0; r < active.racers.length; r++) {
        var rc = active.racers[r];
        if (!inRace(rc)) continue;
        var ctl = racerControls(rc, dt);
        if (ctl === null) { finish(false, 'A rival finished first.'); return; }
        rc.controls = ctl;
      }
      var cp = currentCp();
      if (cp && U.dist2(P.car.pos.x, P.car.pos.z, cp[0], cp[1]) < 100) {
        active.cpIndex++;
        GAME.audio.pickup();
        GAME.haptics.checkpoint();
        if (active.cpIndex >= d2.cps.length) { finish(true); return; }
        GAME.hud.missionObjective(objectiveText());
        updateCp();
      }
      // keep the live position readout current
      if (GAME.frame % 12 === 0) GAME.hud.missionObjective(objectiveText());
      // draw the race line along the streets (checkpoints can be diagonal neighbors)
      active.routeT = (active.routeT || 0) - dt;
      if (active.routeT <= 0 || active.routeCp !== active.cpIndex) {
        active.routeT = 1.0; active.routeCp = active.cpIndex;
        // Only the first leg, from wherever the car is now, changes during a
        // race; the legs between checkpoints are the same all the way round.
        // They were routed afresh every second regardless — twenty legs of
        // path-finding a second on the long island races — and are kept now,
        // routed again only if the bridge gates change what can be driven.
        var gated = !!(GAME.isla && !GAME.isla.isOpen());
        if (!active.legs || active.legsGated !== gated) { active.legs = []; active.legsGated = gated; }
        var pts = [];
        var here = P.car ? P.car.pos : P.pos;
        var wet = !!d2.boat, road = function (ax, az, bx, bz) { return wet ? [[ax, az], [bx, bz]] : roadRoute(ax, az, bx, bz); };
        var first = road(here.x, here.z, d2.cps[active.cpIndex][0], d2.cps[active.cpIndex][1]);
        for (var si = 0; si < first.length; si++) pts.push(first[si]);
        for (var k = active.cpIndex + 1; k < d2.cps.length; k++) {
          var seg = active.legs[k] || (active.legs[k] = road(d2.cps[k - 1][0], d2.cps[k - 1][1], d2.cps[k][0], d2.cps[k][1]));
          for (si = 0; si < seg.length; si++) pts.push(seg[si]);
        }
        active.raceRoute = pts;
      }
      GAME.hud.missionTimer(active.t, false);
    } else if (d2.type === 'courier') {
      active.timeLeft -= dt;
      if (active.timeLeft <= 0) { finish(false, 'Out of time.'); return; }
      var px2 = P.inCar ? P.car.pos.x : P.pos.x, pz2 = P.inCar ? P.car.pos.z : P.pos.z;
      var stop = currentCp();
      bobCrate();
      if (stop && U.dist2(px2, pz2, stop[0], stop[1]) < (d2.boat ? 49 : 25)) {
        active.cpIndex++;
        GAME.audio.pickup();
        GAME.haptics.checkpoint();
        if (active.cpIndex >= active.stops.length) { finish(true); return; }
        GAME.hud.message(!d2.boat ? 'Delivered! Next stop is marked.'
          : active.cpIndex < active.stops.length - 1 ? 'Package aboard! The next one is marked.'
            : 'Got them all — bring them in to the pier!', 2);
        GAME.hud.missionObjective(objectiveText());
        active.routeCp = -1; // force route recompute for the new stop
        updateCp();
      }
      // road-route the line to the current stop so it follows streets
      active.routeT = (active.routeT || 0) - dt;
      if (active.routeT <= 0 || active.routeCp !== active.cpIndex) {
        active.routeT = 1.0; active.routeCp = active.cpIndex;
        var st2 = currentCp();
        // (on the water the line runs straight: there are no streets to follow)
        active.courierRoute = !st2 ? null : d2.boat ? [[px2, pz2], st2] : roadRoute(px2, pz2, st2[0], st2[1]);
      }
      GAME.hud.missionTimer(active.timeLeft, true);
    } else if (d2.type === 'rampage') {
      active.timeLeft -= dt;
      GAME.hud.missionTimer(active.timeLeft, true);
      // keep a crowd around the player so there's always something to wreck
      active.topupT -= dt;
      if (active.topupT <= 0) {
        active.topupT = 3;
        var f = GAME.focus(), near = 0;
        for (var pi = 0; pi < GAME.world.peds.length; pi++) {
          var pd = GAME.world.peds[pi];
          if (!pd.dead && !pd.isCop && U.dist2(pd.pos.x, pd.pos.z, f.x, f.z) < 55 * 55) near++;
        }
        if (near < 8) spawnRampageTargets(9, 3);
      }
      if (active.score >= d2.target) { finish(true); return; }
      if (active.timeLeft <= 0) { finish(false, 'Time up — $' + Math.floor(active.score) + ' of $' + d2.target); return; }
    } else if (d2.type === 'icecream') {
      updateIceCream(dt, P);
    } else if (d2.type === 'vigilante') {
      updateVigilante(dt, P);
    } else if (d2.type === 'takedown') {
      updateTakedown(dt, P);
    } else if (d2.type === 'taxifare' || d2.type === 'ambulance') {
      // clock off simply by leaving the vehicle; the shift also ends if it's totalled
      if (!P.inCar || !P.car) { endJob('clocked off'); return; }
      if (P.car.dead) { endJob('vehicle totalled'); return; }
      active.timeLeft -= dt;
      if (active.timeLeft <= 0) { endJob('out of time'); return; }
      var f = GAME.focus(), tgt = currentCp();
      var amb = d2.type === 'ambulance';
      // --- the heat ladder for shifts. One or two stars: the run in progress
      // plays out, but dispatch stops calling. Three: whoever is aboard bails
      // at the kerb — the shift itself survives. Four or five: nobody works
      // through a war zone; the shift ends on the spot, earnings kept.
      var w = GAME.police.wanted;
      if (w >= 4) { endJob('dispatch cut you off — too hot'); return; }
      if (w >= 3 && active.aboard > 0) {
        var nb = active.aboard;
        for (var bi = 0; bi < nb; bi++) {
          var bo = GAME.peds.spawnPed(f.x + (bi - nb / 2) * 1.4 + 2.2, f.z + 1.6);
          if (bo) { bo.state = 'flee'; bo.fleeT = 4.5; bo.fleeX = f.x; bo.fleeZ = f.z; }
        }
        active.aboard = 0;
        active.phase = 'pickup';
        active.routeCp = null;
        // if they were the last of the round, dispatch holds until you're clean
        if (!active.targets.length) active.holdHeat = true;
        updateCp();
        GAME.hud.message(amb
          ? 'Your patients scramble out — three stars is no stretcher run.'
          : 'Your fare bails out — nobody rides through three stars.', 3.5);
        GAME.hud.missionObjective(objectiveText());
      }
      // dispatch resumes the moment the heat is gone
      if (active.holdHeat && w === 0) {
        active.holdHeat = false;
        startRound();
        active.routeCp = null;
        updateCp();
        GAME.hud.message('Heat’s off — dispatch calls in new ' + (amb ? 'patients' : 'fares') + '.', 3);
        GAME.hud.missionObjective(objectiveText());
      }
      if (active.phase === 'pickup') {
        replaceLostTargets();
        // stop on the marker and whoever is waiting will come to you — unless
        // you're wearing three stars, in which case nobody gets in
        var near = nearestTarget();
        if (near && U.dist2(f.x, f.z, near.x, near.z) < 90 && Math.abs(P.car.speed) < 5 && !near.boarding) {
          if (w >= 3) {
            active.noBoardHintT = (active.noBoardHintT || 0) - dt;
            if (active.noBoardHintT <= 0) {
              active.noBoardHintT = 5;
              GAME.hud.message('Nobody gets in with three stars on you — lose the heat.', 2.5);
            }
          } else {
            near.boarding = true;
            GAME.hud.message(amb ? 'Patient is coming — hold still.' : 'Your fare is coming over.', 2);
          }
        }
        stepBoarding(dt, f, P);
      } else if (tgt && active.aboard > 0 && U.dist2(f.x, f.z, tgt[0], tgt[1]) < 38 && Math.abs(P.car.speed) < 4) {
        // aboard > 0 is load-bearing: when dispatch holds the next round for
        // heat, the phase stays 'dropoff' with an empty cab — without the
        // guard, idling on the drop-off re-completed the "delivery" every
        // tick, and a 3-fare shift compounded to level 143 and a million
        // dollars in level bonuses before the driver's foot left the brake
        completeFare(d2.type, f, tgt);
      }
      updateArrows(dt);
      active.routeT = (active.routeT || 0) - dt;
      if (active.routeT <= 0 || active.routeCp !== active.phase) {
        active.routeT = 1.0; active.routeCp = active.phase;
        var jt = currentCp();
        active.courierRoute = jt ? roadRoute(f.x, f.z, jt[0], jt[1]) : null;
      }
      GAME.hud.missionTimer(active.timeLeft, true);
    }
  }

  // ---------- full completion ----------
  // Every mission (races, rampages, deliveries, the lot) and every stunt
  // jump, both islands. Property is a pastime, not progress. The prize: the
  // TALON gunship on the mainland helipad (and in the showroom), unlimited
  // ammo in every gun (the end of the game is where a perk that ends every
  // fight belongs), and a million dollars, once. It used to pin your cash at $9,999,999 for good,
  // which ended the economy: nothing cost anything again, and every payout
  // after that was a number that changed nothing.
  function namedDone() {
    var b = GAME.bests || {}, n = 0;
    for (var i = 0; i < DEFS.length; i++) if (b[DEFS[i].id] !== undefined) n++;
    return n;
  }
  // a hundred per cent: every marked job, every jump on both islands, every
  // lost tape
  function completionDone() {
    var S = GAME.stunts, T = GAME.tapes;
    return namedDone() >= DEFS.length && !!(S && S.complete && S.islaComplete) && !!(!T || T.complete);
  }
  var COMPLETION_BONUS = 1000000;
  function applyComplete() {
    GAME.city.unlockGunship();
    if (!GAME.unlimitedAmmo) {
      GAME.unlimitedAmmo = true;
      GAME.combat.giveAllWeapons();
    }
  }
  function checkCompletion() {
    if (GAME.prefs && GAME.prefs.gameComplete) { applyComplete(); return true; }
    if (!completionDone()) return false;
    GAME.prefs = GAME.prefs || {};
    GAME.prefs.gameComplete = true;
    GAME.addCash(COMPLETION_BONUS);
    GAME.save();
    applyComplete();
    GAME.track('game-complete');
    GAME.audio.sting('win');
    GAME.haptics.win();
    GAME.hud.dialog({
      title: 'COSTA ROSA, COMPLETE',
      body: 'Every mission, every race, every jump, every lost tape — both islands.\nThe TALON is warming up on the mainland helipad (guns live, rockets loaded), the showroom will sell you spares, every gun you carry will never run dry again, and there is a million dollars in your pocket that was not there this morning.',
      ok: 'CARRY ON', cancel: false
    });
    return true;
  }

  // what the paint shop has in: loud enough to read as a different car
  var RESPRAY_COATS = [0xd83040, 0x2a6ad8, 0xf0f0f4, 0x1c1c26, 0xe8c040, 0x3aa860, 0xff7a2a, 0x8a4ad8, 0x38e8ff, 0xff4fa3];
  function checkRespray() {
    var P = GAME.player;
    if (!P.inCar || !P.car || resprayCooldown > 0 || P.state !== 'alive') return;
    // the garage sprays what rolls IN it, not what flies OVER it — without
    // the height check an airplane crossing above the block got resprayed
    // mid-air, $100 lighter and suddenly clean
    if (P.car.pos.y > GAME.city.groundY(P.car.pos.x, P.car.pos.z) + 3) return;
    var doors = GAME.city.pois.resprays;
    var near = false;
    for (var i = 0; i < doors.length; i++) {
      if (U.dist2(P.car.pos.x, P.car.pos.z, doors[i].door.x, doors[i].door.z) <= 36) { near = true; break; }
    }
    if (!near) return;
    if (P.cash < 100) {
      GAME.hud.message('Respray costs $100 — you\'re short.', 2.5);
      resprayCooldown = 4;
      return;
    }
    GAME.addCash(-100);
    // Paint convinces a patrol, not a manhunt. At one or two stars the law
    // is hunting a CAR, and the car just changed — clean. From three up
    // they know your face (fares bail at three, air units fly): the garage
    // still fixes the metal, but the warrant survives. Deep trouble is the
    // desk sergeant's ladder or a night's sleep — $100 of paint clearing a
    // five-star manhunt made the sergeant's $2,250 rate card a joke.
    var w = GAME.police.wanted;
    if (w > 0 && w <= 2) GAME.police.clearWanted();
    if (GAME.lola) GAME.lola.first('respray');
    // works for any driven vehicle, motorcycles included: full repair + fresh
    // paint. Hand the body back to the SHARED vertex-color material (un-
    // burning it), and free a private burnt coat if that's what it wore —
    // never the shared one every living car is dressed in.
    var car = P.car;
    car.hp = car.spec.hp; car.stage = 0; car.stageWarn = 0; car.spiked = false; car.fireFuse = 0;
    if (GAME.vehicles.mend) GAME.vehicles.mend(car);
    if (car.mesh.userData.bodyMesh) {
      var oldPaint = car.mesh.userData.bodyMesh.material;
      car.mesh.userData.bodyMesh.material = sharedVertexLambert();
      if (oldPaint && oldPaint.dispose && !(oldPaint.userData && oldPaint.userData.shared)) oldPaint.dispose();
    }
    // and it is a respray: it comes out another colour. (It used to come out
    // the colour it went in — the paint was baked in at the factory.)
    var coats = RESPRAY_COATS.filter(function (c) { return c !== car.color; });
    GAME.vehicles.repaint(car, coats[Math.floor(Math.random() * coats.length)]);
    car.resprayT = GAME.time;
    if (GAME.heist && GAME.heist.resprayed) GAME.heist.resprayed(car);
    GAME.fx.flash(car.pos.x, 1.5, car.pos.z, 4);
    GAME.audio.pickup();
    GAME.hud.message(w >= 3
      ? 'Resprayed & fully repaired — but three stars is past paint. They know your face.'
      : 'Resprayed & fully repaired — the heat is off.', 3);
    GAME.track('respray-used');
    resprayCooldown = 8;
  }

  return {
    DEFS: DEFS,
    checkCompletion: checkCompletion,
    get acts() { return actsOn; },
    set acts(v) { actsOn = !!v; },
    // headless: which act a story job is on, and what it is
    get act() { return active && active.stage ? { index: active.actIndex, kind: active.stage.kind, left: active.stage.left, men: active.stage.men ? active.stage.men.length : 0 } : null; },
    get active() { return active; },
    // headless hooks, so the generators can be sampled without playing a shift
    testDropBand: function (lv) { var a = active; active = { level: lv, def: { id: 'taxifare' } }; var r = dropBand(); active = a; return r; },
    testWaitSpot: kerbWaitSpot,
    testRandomRoadPoint: randomRoadPoint,
    testRollCourier: rollCourierStops,
    testCollect: collectTarget,
    testStartRound: startRound,
    testRivalUpgrade: rivalUpgrade,
    init: init,
    update: update,
    failActive: failActive,
    abandon: abandon,
    notifyChaos: notifyChaos,
    chimed: chimed,
    rattled: rattled,
    objectiveText: objectiveText,
    getRoutePoints: function () {
      // (a stranger's favour has its own way there: strangers.js)
      if (!active) return (GAME.strangers && GAME.strangers.route()) || (GAME.heist ? GAME.heist.route() : null);
      if (active.state === 'fade' || active.state === 'countdown') return null;
      if (active.stage) return active.courierRoute || null;
      if (active.def.type === 'race') return active.raceRoute || active.def.cps.slice(active.cpIndex);
      if (active.courierRoute) return active.courierRoute; // courier / taxi / ambulance
      return null;
    },
    // the immediate target marker (checkpoint / stop / pickup / drop-off)
    getObjectivePoint: function () {
      if (!active) return (GAME.strangers && GAME.strangers.target()) || (GAME.heist ? GAME.heist.target() : null);
      if (active.state === 'fade' || active.state === 'countdown') return null;
      return currentCp();
    },
    getBlips: function () {
      // `kind` keys each blip to its legend entry, so the map legend can
      // hide and show marker families like a chart legend
      blipN = 0;
      var rs = GAME.city.pois.resprays;
      for (var r = 0; r < rs.length; r++) putBlip(rs[r].door.x, rs[r].door.z, '#c86bff', 4, 'respray');
      if (!active) {
        for (var i = 0; i < markers.length; i++) {
          var d = markers[i].def;
          if (!defAvailable(d)) continue;
          var kind = d.type === 'race' ? 'race' : d.type === 'courier' ? 'courier' : d.type === 'takedown' ? 'takedown' : 'rampage';
          putBlip(d.start.x, d.start.z, MARKER_HEX[d.type], 4, kind, d.name, (GAME.bests || {})[d.id] !== undefined);
        }
      } else {
        // every waiting fare/patient shows on the map, not just the nearest
        if (active.targets) {
          for (var t = 0; t < active.targets.length; t++) {
            putBlip(active.targets[t].x, active.targets[t].z, '#ffe14f', 4, 'objective');
          }
        }
        if (cpMarker.visible) putBlip(cpMarker.position.x, cpMarker.position.z, '#ffe14f', 5, 'objective');
      }
      blipList.length = blipN;
      return blipList;
    }
  };
})();
