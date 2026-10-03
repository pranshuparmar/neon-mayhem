// Places that take your money. Jobs, fares and rampages pour cash in; this is
// where it goes back out — a gun counter, a tailor, a barber, property with
// your name on it, a showroom, the desk sergeant's open palm and a crooked
// wheel on the pier. Every shop is a walk-in: stand on the glowing doormat and
// the counter opens. The world freezes while you browse, the way the map does.
GAME.shops = (function () {
  var el = {}, openShop = null, sel = 0, pendingBuy = null, locations = [], markerMesh = null, markerData = [];
  var leftSince = {};   // reopen only after you step off the mat
  var lastWX = null, lastWZ = null;   // where the walk-in scan last saw the player
  var lastUnlocked = null;   // island gate state at the last walk-in scan
  var spinProps = [];   // slow turntables: the showroom's display car, etc.
  // the Gran Rosa Motors hall (buildHall): its interiors.js entry, its
  // sliding doors, and what stands on its floor and its roof
  var hall = null, hallDoor = null, hallStock = [], inHall = false, hallHello = -1e9;

  // sign-atlas slots for the storefront names — indexes into city.js SIGN_TEXTS,
  // which appends these nine in this exact order after 'ISLA ROSA' (slot 33)
  var SIGN_SLOT = {
    hardware0: 34, hardware1: 35, dress0: 36, barber0: 37,
    showroom0: 38, casino0: 39, home_dock: 40, home_condo: 41, home_villa: 42
  };

  // ---------- wardrobe ----------
  var SHIRTS = [
    { id: 'white', name: 'Club White', hex: 0xf0f0f8 },
    { id: 'flamingo', name: 'Flamingo Pink', hex: 0xf78ab8 },
    { id: 'mint', name: 'Mint Breeze', hex: 0x9fe8d8 },
    { id: 'banana', name: 'Banana Cream', hex: 0xf9d99a },
    { id: 'skyline', name: 'Skyline Blue', hex: 0x8fd0f0 },
    { id: 'violet', name: 'Violet Hour', hex: 0x8a6ae8 },
    { id: 'ember', name: 'Ember Red', hex: 0xe86a5a },
    { id: 'noir', name: 'Midnight Noir', hex: 0x23242e }
  ];
  var PANTS = [
    { id: 'teal', name: 'Teal Classics', hex: 0x38b8c8 },
    { id: 'navy', name: 'Navy Slacks', hex: 0x3a4a68 },
    { id: 'sand', name: 'Sand Chinos', hex: 0xd8c8a8 },
    { id: 'brick', name: 'Brick Cords', hex: 0x8a4a4a },
    { id: 'charcoal', name: 'Charcoal', hex: 0x2a2a34 },
    { id: 'lilac', name: 'Lilac Flares', hex: 0xb090d8 }
  ];
  var HAIRSTYLES = [
    { id: 'crew', name: 'Crew Cut' },
    { id: 'flattop', name: 'Flattop' },
    { id: 'pompadour', name: 'Pompadour' },
    { id: 'mullet', name: 'Mullet' },
    { id: 'afro', name: 'Afro' },
    { id: 'ponytail', name: 'Ponytail' },
    { id: 'mohawk', name: 'Mohawk' },
    { id: 'buzz', name: 'Shaved (back to bald)' }
  ];
  var HAIRCOLORS = [
    { id: 'black', name: 'Black', hex: 0x1c1a18 },
    { id: 'brown', name: 'Brown', hex: 0x5a3c22 },
    { id: 'blond', name: 'Blond', hex: 0xd8b86a },
    { id: 'red', name: 'Copper Red', hex: 0xa8482a },
    { id: 'pink', name: 'Hot Pink', hex: 0xf050a0 },
    { id: 'cyan', name: 'Electric Cyan', hex: 0x38c8e8 }
  ];

  // The same skin palette the crowd draws from, named for the barber's
  // counter. The player's default is FIXED — the fair tone, every browser,
  // every fresh save. It used to be rolled once per save, which read as
  // "my character changes between machines". A tone bought at the barber
  // (skinPicked) is a choice, and choices stick.
  var SKINTONES = [
    { id: 'fair', name: 'Fair', hex: 0xeac8a8 },
    { id: 'porcelain', name: 'Porcelain', hex: 0xf0d8c0 },
    { id: 'tan', name: 'Tan', hex: 0xc89878 },
    { id: 'bronze', name: 'Bronze', hex: 0x8a6848 },
    { id: 'deep', name: 'Deep', hex: 0x6a4c34 }
  ];
  var DEFAULT_SKIN = 0xeac8a8;
  function outfit() {
    GAME.prefs = GAME.prefs || {};
    if (!GAME.prefs.outfit) GAME.prefs.outfit = { shirt: 'white', pants: 'teal', hairStyle: 'crew', hairColor: 'black' };
    // rolled tones from old saves were never a choice — the default wins
    // until the barber has actually been paid for a different one
    if (!GAME.prefs.outfit.skinPicked || !GAME.prefs.outfit.skin) GAME.prefs.outfit.skin = DEFAULT_SKIN;
    if (GAME.prefs.outfit.hairStyle === 'flat') GAME.prefs.outfit.hairStyle = 'flattop'; // old save id
    return GAME.prefs.outfit;
  }
  function byId(list, id, fallback) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return list[fallback || 0];
  }

  // the player's look, rebuilt from the saved outfit — called at boot and
  // after every purchase in the changing room
  function applyOutfit() {
    var P = GAME.player, o = outfit();
    if (!P.mesh) return;
    var j = P.mesh.userData.joints;
    j.torso.material.color.setHex(byId(SHIRTS, o.shirt).hex);
    j.legL.children[0].material.color.setHex(byId(PANTS, o.pants).hex);
    j.head.material.color.setHex(o.skin);
    // hair rides the head so aiming poses carry it
    if (P.hairMesh) { P.hairMesh.parent.remove(P.hairMesh); disposeTree(P.hairMesh); P.hairMesh = null; }
    var hair = GAME.peds.makeHair(o.hairStyle, byId(HAIRCOLORS, o.hairColor).hex);
    if (hair) {
      // the head sits at y=1.6 in the body group; makeHair builds around origin
      hair.position.y = 1.6;
      P.mesh.add(hair);
      P.hairMesh = hair;
    }
  }

  // ---------- safehouses ----------
  var SAFEHOUSES = [
    { id: 'dock', name: 'DOCKSIDE FLAT', price: 6000, at: { x: -404, z: 64 }, tag: 'A cot over the harbor. It counts.' },
    { id: 'condo', name: 'STRIP CONDO', price: 18000, at: { x: 337, z: 208 }, tag: 'Neon out every window.' },
    { id: 'villa', name: 'MARINA VILLA', price: 45000, at: null, isla: true, tag: 'The good life, across the channel.' }
  ];
  function ownedList() {
    GAME.prefs = GAME.prefs || {};
    if (!GAME.prefs.safehouses) GAME.prefs.safehouses = [];
    return GAME.prefs.safehouses;
  }
  function owns(id) { return ownedList().indexOf(id) >= 0; }
  function ownsAny() {
    var unlocked = !GAME.isla || GAME.isla.isOpen();
    for (var i = 0; i < SAFEHOUSES.length; i++) {
      if (owns(SAFEHOUSES[i].id) && (!SAFEHOUSES[i].isla || unlocked)) return true;
    }
    return false;
  }
  // Where you wake up when you own property: the nearest owned bed ON THE
  // ISLAND WHERE YOU WENT DOWN. Death is local — going down on Isla Verde
  // and waking on the mainland strip made no sense, and it made the condo
  // WORSE to own the further you ranged. A bed on each island is now a real
  // reason to buy twice; with no bed on this island it's the local hospital.
  function homeSpawn(x, z) {
    var unlocked = !GAME.isla || GAME.isla.isOpen();
    var onIsla = !!(GAME.isla && GAME.isla.contains(x, z));
    var best = null, bd = 1e18;
    for (var i = 0; i < SAFEHOUSES.length; i++) {
      var s = SAFEHOUSES[i];
      if (!owns(s.id) || !s.at) continue;
      if (s.isla && !unlocked) continue;
      if (!!s.isla !== onIsla) continue;
      var d = U.dist2(x, z, s.at.x, s.at.z);
      if (d < bd) { bd = d; best = { x: s.at.x, z: s.at.z, name: s.name, heading: homeHeading(s) }; }
    }
    return best;
  }

  // Which way to stand at your door: toward town, but turned no more than
  // 60° from facing the door. Facing straight into town put your back along
  // the house front, and the camera behind you hung beside the facade at the
  // awning's own height — a mint slab filled the screen. Within 60° of the
  // door the camera sits out over the pavement, looking past the house.
  var HOME_TURN = Math.PI / 3;
  function homeHeading(s) {
    var hc = GAME.city.islandAt(s.at.x, s.at.z), c = (hc && hc.centre) || { x: -70, z: 0 };
    var toTown = Math.atan2(c.x - s.at.x, c.z - s.at.z);
    if (!s.face) return toTown;
    var door = Math.atan2(s.face.x, s.face.z);
    var dd = Math.atan2(Math.sin(toTown - door), Math.cos(toTown - door));
    return door + Math.max(-HOME_TURN, Math.min(HOME_TURN, dd));
  }

  // Where a new session starts: the bed you last slept in (or bought), else
  // any you own. It was always the strip, so owning a place changed nothing
  // about coming back to the game.
  function startSpawn() {
    var unlocked = !GAME.isla || GAME.isla.isOpen();
    var last = GAME.prefs && GAME.prefs.lastHome, pick = null;
    for (var i = 0; i < SAFEHOUSES.length; i++) {
      var s = SAFEHOUSES[i];
      if (!owns(s.id) || !s.at || (s.isla && !unlocked)) continue;
      if (!pick || s.id === last) pick = s;
    }
    return pick ? { x: pick.at.x, z: pick.at.z, name: pick.name, heading: homeHeading(pick) } : null;
  }

  // ---------- placement ----------
  // nudge a doormat off roads, water, ramps and out of walls — the same spiral
  // hunt the island uses for its POIs
  function clearSpot(x, z) {
    for (var ring = 0; ring < 9; ring++) {
      for (var a = 0; a < 8; a++) {
        var px = x + Math.cos(a / 8 * Math.PI * 2) * ring * 3;
        var pz = z + Math.sin(a / 8 * Math.PI * 2) * ring * 3;
        if (GAME.city.isInWater(px, pz) && !GAME.city.isOnPier(px, pz)) continue;
        if (GAME.city.inAirport(px, pz)) continue;
        if (GAME.city.nearCrossing && GAME.city.nearCrossing(px, pz, 12)) continue;
        if (GAME.city.rampAt(px, pz)) continue;
        var rp = GAME.city.nearestRoadPoint(px, pz);
        if (U.dist2(px, pz, rp.x, rp.z) < 9.5 * 9.5) continue;
        var boxes = GAME.city.hash.query(px, pz, 2.5), hit = false;
        for (var b = 0; b < boxes.length; b++) {
          var q = boxes[b];
          if (px > q.minX - 1.6 && px < q.maxX + 1.6 && pz > q.minZ - 1.6 && pz < q.maxZ + 1.6) { hit = true; break; }
        }
        if (hit) continue;
        // ...and never on top of a parked vehicle. The spot hunt vetted
        // water, roads and walls but not CARS, so a second showroom
        // purchase was delivered squarely onto the first — a helicopter
        // set down on the dune buggy bought a minute earlier.
        var cars = GAME.world.cars, gy = GAME.city.groundY(px, pz);
        for (var ci = 0; ci < cars.length; ci++) {
          var cc = cars[ci];
          if (cc.dead) continue;
          if (Math.abs(cc.pos.y - gy) > 5) continue;   // a car on a roof doesn't block the street
          if (U.dist2(px, pz, cc.pos.x, cc.pos.z) < 6.5 * 6.5) { hit = true; break; }
        }
        if (!hit) return { x: px, z: pz };
      }
    }
    return { x: x, z: z };
  }

  // ---------- catalogue ----------
  function hardwareItems() {
    var P = GAME.player;
    function gun(id, name, price, ammo, ds) {
      var have = P.weapons[id] && P.weapons[id].have;
      return { id: id, name: name + (have ? '  ·  ammo +' + ammo : ''), ds: ds, price: price };
    }
    return [
      gun('pistol', 'PISTOL', 400, 40, 'Reliable. Forty rounds in the box.'),
      gun('smg', 'SMG', 2500, 120, 'Spray-friendly, drive-by approved.'),
      gun('shotgun', 'SHOTGUN', 1500, 24, 'Ends conversations at close range.'),
      gun('rifle', 'RIFLE', 5000, 30, 'The observatory special, over the counter.'),
      { id: 'armor', name: 'BODY ARMOR', ds: 'Takes the hits so you don’t.', price: 800, off: P.armor >= 100 },
      { id: 'medkit', name: 'FIRST-AID KIT', ds: 'Patches you back to full.', price: 150, off: P.health >= 100 }
    ];
  }
  // What you own, as opposed to what you have on: two outfits from the
  // start — the club whites and teals you arrive in, and a day at the beach —
  // and every piece bought at THREADS after that. Hangs in the wardrobe at
  // any place you own; at THREADS it is yours to put back on for nothing.
  function closet() {
    var p = GAME.prefs = GAME.prefs || {};
    var c = p.closet || (p.closet = { shirts: ['white', 'banana'], pants: ['teal', 'sand'] });
    var o = outfit();
    if (c.shirts.indexOf(o.shirt) < 0) c.shirts.push(o.shirt);   // whatever an older save had on
    if (c.pants.indexOf(o.pants) < 0) c.pants.push(o.pants);
    return c;
  }
  function clothesRow(kind, s, o, c, forSale) {
    var shirt = kind === 'shirt', worn = shirt ? o.shirt === s.id : o.pants === s.id;
    var have = (shirt ? c.shirts : c.pants).indexOf(s.id) >= 0;
    var row = { id: kind + '_' + s.id, name: (shirt ? 'SHIRT · ' : 'PANTS · ') + s.name, price: forSale && !have ? 150 : 0, sw: s.hex, owned: worn,
      ds: worn ? (shirt ? 'Wearing it now.' : 'Wearing them now.') : have ? 'In your wardrobe — free to put on.' : '' };
    if (worn) row.ownedLabel = 'WEARING';
    else if (have) { row.noPrice = true; row.chip = 'WEAR'; row.idle = forSale ? 'OWNED' : ''; }
    return row;
  }
  function dressItems() {
    var o = outfit(), c = closet(), rows = [];
    SHIRTS.forEach(function (s) { rows.push(clothesRow('shirt', s, o, c, true)); });
    PANTS.forEach(function (s) { rows.push(clothesRow('pants', s, o, c, true)); });
    return rows;
  }
  function wardrobeItems() {
    var o = outfit(), c = closet(), rows = [];
    SHIRTS.forEach(function (s) { if (c.shirts.indexOf(s.id) >= 0) rows.push(clothesRow('shirt', s, o, c, false)); });
    PANTS.forEach(function (s) { if (c.pants.indexOf(s.id) >= 0) rows.push(clothesRow('pants', s, o, c, false)); });
    return rows;
  }
  function barberItems() {
    // cuts first, then dye, then complexion — and every row names its trade
    // out loud, because an unlabeled color swatch next to a head reads as
    // something it isn't
    var o = outfit(), rows = [];
    HAIRSTYLES.forEach(function (s) {
      rows.push({ id: 'style_' + s.id, name: 'CUT · ' + s.name, price: 150, owned: o.hairStyle === s.id, ds: o.hairStyle === s.id ? 'Your current cut.' : '' });
    });
    HAIRCOLORS.forEach(function (s) {
      rows.push({ id: 'color_' + s.id, name: 'HAIR COLOR · ' + s.name, price: 100, sw: s.hex, owned: o.hairColor === s.id, ds: o.hairColor === s.id ? 'Your current color.' : '' });
    });
    SKINTONES.forEach(function (s) {
      rows.push({ id: 'skin_' + s.id, name: 'SKIN TONE · ' + s.name, price: 100, sw: s.hex, owned: o.skin === s.hex, ds: o.skin === s.hex ? 'Your tone.' : '' });
    });
    return rows;
  }
  function safehouseItems(loc) {
    var s = loc.sh;
    if (owns(s.id)) {
      // your own bed is not merchandise: no price tag, no FREE, no BUY chip —
      // "the condo, FREE" read as a purchase you were about to make
      return [{ id: 'rest', name: 'SLEEP IT OFF', ds: 'Eight hours pass. Health back, and the heat cools — all of it from three stars down; a four- or five-star manhunt only drops two.', price: 0, noPrice: true, chip: 'REST' }];
    }
    return [{ id: 'buy', name: 'BUY ' + s.name, ds: s.tag + '  You’ll wake up here, gear intact.', price: s.price }];
  }
  // Money is the only gate: every machine is on the floor from day one.
  // Progression used to hold back the helicopter (bridges) and the gunship
  // (full completion), but a showroom that refuses your cash isn't a shop.
  function showroomItems() {
    function row(id, name, ds, price) {
      var inGarage = garage().indexOf(id) >= 0;
      return { id: id, name: name, price: price,
        owned: inGarage, ds: inGarage ? 'In your garage — one waits here and at every place you own.' : ds };
    }
    return [
      row('motorcycle', 'NEON STREAK', 'The bike. Fast, loud, unwise.', 4000),
      row('superbike', 'CORMORÁN GT', 'Showroom exclusive. Nobody else rides one.', 20000),
      row('buggy', 'DUNE BUGGY', 'Made for sand and bad decisions.', 9000),
      row('limo', 'STRETCH LIMO', 'Arrive like you own the strip.', 18000),
      row('monster', 'SLEDGEHAMMER', 'The monster truck, no stunt jumps required.', 35000),
      row('helicopter', 'PELICANO', 'Your own bird, delivered outside.', 60000),
      row('gunship', 'TALON', 'Army surplus. Guns live, rockets included.', 250000)
    ];
  }
  function bribeItems() {
    var w = GAME.police.wanted;
    // rank pricing: the sergeant charges by how hot you are. Losing the top
    // star of a five-star manhunt is dearer work than shaking off a fender-
    // bender — $150 a star at one star, $750 at five. CLEAN SLATE is the
    // whole ladder summed (no discount, no trap: singles total the same),
    // and it steps aside when one star is all the books hold — two rows
    // selling the identical favor at the identical price read as a bug.
    var ww = Math.max(1, w);
    return [
      { id: 'star', name: 'LOSE ONE STAR', ds: w > 0 ? 'The sergeant looks away.' : 'You’re clean already.', price: 150 * ww, off: w <= 0 },
      { id: 'slate', name: 'CLEAN SLATE', price: 75 * ww * (ww + 1), off: w <= 1,
        ds: w > 1 ? 'All ' + w + ' stars, forgotten.' : w === 1 ? 'One star on the books — just lose it.' : 'Nothing on the books.' }
    ];
  }
  function casinoItems() {
    return [
      { id: 'bet100', name: 'SPIN THE WHEEL · $100', ds: 'Mostly it eats your money. Mostly.', price: 100, verb: 'SPIN' },
      { id: 'bet500', name: 'SPIN THE WHEEL · $500', ds: 'Now it’s interesting.', price: 500, verb: 'SPIN' },
      { id: 'bet2000', name: 'SPIN THE WHEEL · $2,000', ds: 'The gull always wins. Probably.', price: 2000, verb: 'SPIN' }
    ];
  }

  // The Lucky Gull's bar: a drink puts you back together, a dear one with
  // your vest done up as well.
  function barItems() {
    var P = GAME.player;
    return [
      { id: 'cuba', name: 'CUBA LIBRE', price: 40, ds: P.health >= 100 ? 'You’re fine — but it’s a nice drink.' : 'A good long swallow: +35 health.' },
      { id: 'punch', name: 'NEON PUNCH', price: 120, ds: 'Back on your feet: health full.' },
      { id: 'special', name: 'THE GULL SPECIAL', price: 400, ds: 'Health full and armor strapped on. Don’t ask what’s in it.' }
    ];
  }
  function buyBar(id) {
    var P = GAME.player;
    if (id === 'cuba') P.health = Math.min(100, P.health + 35);
    else P.health = 100;
    if (id === 'special') P.armor = 100;
    note(id === 'special' ? 'The bartender winks.' : 'Cheers.');
    GAME.track('bar-drink');
  }

  // ---------- buying ----------
  function buyHardware(id) {
    var P = GAME.player;
    if (id === 'armor') { P.armor = 100; note('Strapped in.'); }
    else if (id === 'medkit') { P.health = 100; note('Good as new.'); }
    else {
      var packs = { pistol: 40, smg: 120, shotgun: 24, rifle: 30 };
      GAME.combat.giveWeapon(id, packs[id]);
      note('Bagged, no questions asked.');
    }
    GAME.combat.refreshWeaponHud();
  }
  function buyDress(id, fromWardrobe) {
    var o = outfit(), c = closet(), shirt = id.indexOf('shirt_') === 0, piece = id.slice(6);
    var had = (shirt ? c.shirts : c.pants).indexOf(piece) >= 0;
    if (shirt) o.shirt = piece; else o.pants = piece;
    if (!had) (shirt ? c.shirts : c.pants).push(piece);   // it hangs in your wardrobe from now on
    applyOutfit(); GAME.save();
    note(fromWardrobe || had ? 'Changed.' : 'Looking sharp — it\'s in your wardrobe now.');
  }
  function buyBarber(id) {
    var o = outfit();
    if (id.indexOf('style_') === 0) o.hairStyle = id.slice(6);
    else if (id.indexOf('skin_') === 0) { o.skin = byId(SKINTONES, id.slice(5)).hex; o.skinPicked = true; }
    else o.hairColor = id.slice(6);
    applyOutfit(); GAME.save();
    note(id.indexOf('skin_') === 0 ? 'New tone, same you.'
      : o.hairStyle === 'buzz' ? 'Clean down to the skin.' : 'Fresh off the chair.');
  }
  function buySafehouse(loc, id) {
    var P = GAME.player;
    if (id === 'rest') {
      // no sleeping on the clock: a fare in the back seat or a race half
      // run does not pause for a nap
      if (GAME.missions && GAME.missions.active) { note('No sleeping on the clock.'); return; }
      GAME.prefs.lastHome = loc.sh.id;   // and the next load starts here (startSpawn)
      close();
      GAME.hud.fade(function () {
        // eight hours pass behind the blackout: a third of the day wheel,
        // the law loses interest, taken pickups age toward their return,
        // and the body resets. The bed outranks a pinned sky — "respecting"
        // a day/night pin here meant four sleeps changed nothing outside,
        // which read as the feature being broken. Sleeping is the loudest
        // possible statement that time should move, so it unpins the sun.
        GAME.player.health = 100;
        // Eight hours is long enough for the law to forget a three-star
        // night, not a manhunt: five stars wake up as three, four as two.
        // (The units that were out there have gone home either way; whoever
        // is still looking starts again from scratch.)
        var woke = GAME.police.wanted, still = woke >= 5 ? 3 : woke === 4 ? 2 : 0;
        GAME.police.clearWanted();
        if (still) GAME.police.setWanted(still);
        var unpinned = GAME.timeMode !== 'auto';
        if (unpinned) GAME.setTimeMode('auto');   // persists the preference too
        GAME.dayPhase = (GAME.dayPhase + 8 / 24) % 1;
        if (GAME.weather && GAME.weather.pass) GAME.weather.pass(GAME.DAY_SECONDS / 3);   // and the sky's eight hours
        GAME.applyTimeOfDay(0.5 - 0.5 * Math.cos(GAME.dayPhase * Math.PI * 2));
        GAME.world.pickups.forEach(function (p) {
          if (p.taken && isFinite(p.respawnT)) p.respawnT -= GAME.DAY_SECONDS / 3;
        });
        GAME.hud.message((still
          ? 'Eight hours later. Rested and good as new — but they have not stopped looking for you.'
          : 'Eight hours later. Rested, forgotten by the law, good as new.')
          + (unpinned ? ' The sky is back on the clock.' : ''), 5);
        GAME.track('safehouse-rest');
      });
      return;
    }
    ownedList().push(loc.sh.id);
    GAME.prefs.lastHome = loc.sh.id;
    GAME.save();
    refreshGarageSpots();   // this lot joins the fleet's rounds
    GAME.track('safehouse-bought');
    if (GAME.lola) GAME.lola.first('home');
    GAME.hud.message(loc.sh.name + ' is yours — you’ll wake up here from now on, weapons and all, with your garage parked outside.', 5);
    // The keys are yours, so in you go. The menu used to stay up and turn
    // straight into SLEEP IT OFF — the first thing a new owner saw of the
    // place was the offer of a nap on the pavement. The card comes once you
    // are through the door (or at once, if the door is not open to you now:
    // on a job, say).
    close();
    var card = function () { showDeedCard(loc); };
    if (!(GAME.interiors && GAME.interiors.enter(loc, card) && GAME.interiors.busy)) card();
  }
  function showDeedCard(loc) {
    GAME.share.show({
      slug: 'safehouse-' + loc.sh.id,
      eyebrow: 'COSTA ROSA · 1986',
      title: 'HOME SWEET HOME',
      subtitle: loc.sh.name + ' — bought with honest-ish money',
      accent: '#8de8b0',
      stats: [{ label: 'Property', value: loc.sh.name.split(' ')[0] },
        { label: 'Paid', value: '$' + loc.sh.price.toLocaleString() },
        { label: 'Perk', value: 'GEAR KEPT' }]
    });
  }
  // ---------- the garage ----------
  // A deed, not a rental: every vehicle you buy is registered to a parking
  // spot at the showroom AND at each property you own — the same fleet,
  // waiting at every address.
  // The parked-vehicle spawner already guarantees specials at their spot, so
  // wreck it, sink it or leave it across the channel — a fresh one is waiting
  // at home. The registry persists; the spots are rebuilt every boot.
  var garageSpots = {};   // type -> the live parkedSpot object
  function garage() {
    GAME.prefs = GAME.prefs || {};
    if (!GAME.prefs.garage) GAME.prefs.garage = [];
    return GAME.prefs.garage;
  }
  function garageBases() {
    // every lot you can call yours hosts the whole fleet: the showroom
    // forecourt always, and each property as you buy it — so a bought
    // vehicle is wherever you happen to be, not at one address you have
    // to remember ("from where do I pick them up?")
    var bases = [];
    var sr = locations.filter(function (l) { return l.kind === 'showroom'; })[0];
    // narrow: the dealer lot is the strip between the x=50 road and the glass
    // hall — the grid must run DOWN it, not across it. Seeded wide it walked
    // into the grown building on one side or the carriageway on the other,
    // and clearSpot scattered the fleet out of sight ("my cars vanished").
    if (sr) bases.push({ id: 'showroom', x: sr.forecourt.x, z: sr.forecourt.z, heading: sr.heading || 0, narrow: true });
    var unlocked = !GAME.isla || GAME.isla.isOpen();
    for (var i = 0; i < SAFEHOUSES.length; i++) {
      var s = SAFEHOUSES[i];
      if (!owns(s.id) || !s.at) continue;
      if (s.isla && !unlocked) continue;
      bases.push({ id: s.id, x: s.at.x, z: s.at.z, heading: 0 });
    }
    return bases;
  }
  function refreshGarageSpots() {
    // A wider grid than the old 5 x 6 m: the parked spawner keeps ~7.7 m
    // clear around a spot, so five-metre neighbours BLOCKED each other —
    // half the fleet never appeared, and what did appear crowded one pile.
    // Spots are also kept clear of each other after the spiral hunt moves
    // them, for the same reason.
    var fleet = garage();
    garageBases().forEach(function (base) {
      var placedNow = [];
      fleet.forEach(function (type, i) {
        var seedX, seedZ;
        if (base.narrow) {
          // two columns deep, marching south down the dealer strip
          seedX = base.x - 3.5 + (i % 2) * 9;
          seedZ = base.z + 6 + Math.floor(i / 2) * 10;
        } else {
          seedX = base.x + 6 + (i % 3) * 9;
          seedZ = base.z + 6 + Math.floor(i / 3) * 10;
        }
        var s = clearSpot(seedX, seedZ);
        for (var t = 0; t < 3; t++) {
          var clash = false;
          for (var p = 0; p < placedNow.length; p++) {
            if (U.dist2(placedNow[p].x, placedNow[p].z, s.x, s.z) < 8 * 8) { clash = true; break; }
          }
          if (!clash) break;
          if (base.narrow) seedZ += 10; else seedX += 9;
          s = clearSpot(seedX, seedZ);
        }
        placedNow.push(s);
        var key = base.id + ':' + type;
        var g = garageSpots[key];
        if (!g) {
          g = { x: s.x, z: s.z, heading: base.heading, vtype: type, owned: true };
          garageSpots[key] = g;
          GAME.city.parkedSpots.push(g);
        } else {
          g.x = s.x; g.z = s.z; g.heading = base.heading;
        }
      });
    });
  }

  function buyShowroom(loc, id) {
    var at = loc.forecourt;
    var spot = clearSpot(at.x, at.z);
    if (id === 'monster') GAME.city.unlockMonsterTruck();
    if (garage().indexOf(id) < 0) garage().push(id);
    GAME.save();
    // Register the type first, so the forecourt bay this car belongs in
    // exists before the car does.
    refreshGarageSpots();
    // The delivered car IS this type's garage car at the showroom, and has to
    // be spawned as that bay's occupant rather than as a loose extra. Left
    // unlinked the bay reads empty, and the parked spawner drops a second
    // identical vehicle into it within a few frames, in plain sight — the
    // restock guard cannot help, because it matches on fromSpot, which only
    // the spawner itself ever sets. Same wiring the spawner uses, so boarding
    // frees the bay and driving off restocks it exactly as it always did.
    var bay = garageSpots['showroom:' + id];
    var opts = bay && !bay.live ? { parkedSpot: bay, ai: { mode: 'parked' } } : {};
    var car = GAME.vehicles.spawnCar(id, spot.x, spot.z, loc.heading || 0, opts);
    if (bay && !bay.live) { bay.live = car; car.fromSpot = bay; }
    GAME.fx.flash(spot.x, 1.5, spot.z, 5);
    GAME.audio.sting('win');
    GAME.haptics.win();
    GAME.track('showroom-' + id);
    var spec = GAME.vehicles.TYPES[id];
    note('Keys in the ignition, right outside.');
    GAME.hud.message('Delivered to the forecourt — and registered to your garage: a fresh one waits here' +
      (ownsAny() ? ' and at every place you own' : '') + '.', 5);
    GAME.share.show({
      slug: 'bought-' + id,
      eyebrow: 'GRAN ROSA MOTORS · 1986',
      title: (spec ? spec.label.toUpperCase() : id.toUpperCase()),
      subtitle: 'Bought outright, registered to your garage',
      accent: '#8dffd8',
      stats: [{ label: 'Paid', value: '$' + (items(loc).filter(function (r) { return r.id === id; })[0] || { price: 0 }).price.toLocaleString() },
        { label: 'Plate', value: 'ROSA-' + String(garage().length).padStart(2, '0') },
        { label: 'Kept at', value: ownsAny() ? 'ALL YOUR LOTS' : 'SHOWROOM' }]
    });
    return car;
  }
  function buyBribe(id) {
    var w = GAME.police.wanted;
    if (id === 'star') GAME.police.setWanted(Math.max(0, w - 1));
    else GAME.police.clearWanted();
    GAME.track('bribe-paid');
    note(GAME.police.wanted > 0 ? 'One star quietly shredded.' : 'The file is empty. What file?');
  }
  // The wheel is seen to spin before it pays. The outcome is decided up
  // front, but the counter ticks through the segments — fast, then slowing
  // like a real wheel — and only then is the result revealed and the payout
  // made. Closing the shop mid-spin can't eat a win: the payout runs on its
  // own timer whether anyone is watching or not.
  var spinning = false;
  function spinWheel(bet) {
    var r = Math.random(), mult, label;
    if (r < 0.60) { mult = 0; label = 'THE GULL EATS IT.'; }
    else if (r < 0.85) { mult = 1.5; label = 'SMALL WIN!'; }
    else if (r < 0.95) { mult = 3; label = 'TRIPLE!'; }
    else { mult = 5; label = 'JACKPOT!'; }
    var win = Math.round(bet * mult);
    var SEGS = ['🐦 GULL', '× 1.5', '🐦 GULL', '× 3', '🐦 GULL', '× 1.5', '★ JACKPOT ★', '🐦 GULL'];
    spinning = true;
    var step = 0, steps = 14 + Math.floor(Math.random() * 5);
    function tick(delay) {
      setTimeout(function () {
        var inCasino = openShop && openShop.kind === 'casino';
        if (step < steps) {
          if (inCasino) note('THE WHEEL SPINS…   ▸ ' + SEGS[step % SEGS.length]);
          GAME.audio.cashTick();
          step++;
          // each click takes longer than the last — the wheel is running down
          tick(55 + Math.pow(step / steps, 2) * 300);
        } else {
          spinning = false;
          if (win > 0) { GAME.addCash(win); GAME.audio.sting('win'); GAME.haptics.win(); }
          else { GAME.audio.crash(0.2); GAME.haptics.deny(); }
          GAME.track(win > 0 ? 'casino-win' : 'casino-loss');
          if (inCasino) {
            note(label + (win > 0 ? '  +$' + win.toLocaleString() : '') + '  (stake included)');
            render();
          }
        }
      }, delay);
    }
    tick(140);
  }

  // ---------- shop registry ----------
  function buildLocations() {
    var stations = GAME.city.pois.stations || [];
    locations = [
      // the strip shops live IN the western building row, facing the strip —
      // reserved slots in city.js keep those footprints clear, so the shops
      // replace nameless blocks instead of squatting on the beach footpath
      { id: 'hardware0', kind: 'hardware', name: 'ROSA HARDWARE', tag: 'Tools for loud problems', at: clearSpot(337, -64), color: 0xffd24a },
      { id: 'dress0', kind: 'dress', name: 'THREADS', tag: 'The changing room is that way', at: clearSpot(337, 92), color: 0xff8fd0 },
      { id: 'barber0', kind: 'barber', name: 'CORTES CUTS', tag: 'Walk-ins welcome', at: clearSpot(337, -120), color: 0x8fd0ff },
      // the dealership sits on the southern arterial with room for a glass
      // hall and a forecourt — it used to squat at the airport's entry gate
      { id: 'showroom0', kind: 'showroom', name: 'GRAN ROSA MOTORS', tag: 'Special orders, delivered outside', at: clearSpot(90, 378), forecourt: { x: 64, z: 384 }, heading: Math.PI / 2, color: 0x8dffd8 },
      // the casino stands on its own terrace off the pier's south rail —
      // planted mid-deck it was a wall across the way to the ferris wheel
      { id: 'casino0', kind: 'casino', name: 'THE LUCKY GULL', tag: 'A wheel, a bird, your wallet', at: { x: 452, z: 255.3 }, face: { x: 0, z: 1 }, color: 0xffe14f }
    ];
    // a bribe desk at every station, both sides of the channel
    stations.forEach(function (st, i) {
      locations.push({
        id: 'bribe' + i, kind: 'bribe', name: 'DESK SERGEANT', tag: 'Certain paperwork can be lost',
        at: clearSpot(st.spawn.x + 10, st.spawn.z + 6), isla: !!st.isla, color: 0x4da3ff
      });
    });
    // property: the island villa anchors to the marina once the island exists.
    // South of the jetty field, not inside it — the old seed put the front
    // yard across a plank row and beached a hull on the doorstep, and the
    // parked fleet threaded a metre-wide gap between boat and water's edge.
    SAFEHOUSES.forEach(function (s) {
      if (!s.at && s.isla && GAME.isla) {
        // (city.js keeps the island's stunt jumps out of this yard)
        var Y = GAME.city.villaYard, M = GAME.isla.pois().marina;
        s.at = Y ? clearSpot(Y.x, Y.z) : clearSpot(M.x - 7, M.z + 40);
      } else if (s.at) {
        s.at = clearSpot(s.at.x, s.at.z);
      }
      if (s.at) locations.push({
        id: 'home_' + s.id, kind: 'safehouse', name: s.name, tag: owns(s.id) ? 'Yours' : 'For sale',
        at: s.at, sh: s, isla: !!s.isla, color: 0x8de8b0
      });
    });
    // hardware over the channel too — on the Puerto Dorado grid, where a
    // tool counter belongs. It used to stand at the ice cream factory's
    // gates, hard against the storefront on the same forecourt.
    if (GAME.isla) {
      locations.push({ id: 'hardware1', kind: 'hardware', name: 'VERDE HARDWARE', tag: 'Tools for loud problems', at: clearSpot(935, 100), isla: true, color: 0xffd24a });
    }
  }

  // ---------- storefronts ----------
  // Every shop is a real building: the doormat sits at its door and the name
  // is up in lights on the face. The door always looks toward the road the
  // mat was placed off of, and the whole footprint is vetted against solids,
  // roads, water and ramps — with sideways nudges before giving up.
  function buildShopfronts(scene) {
    // Each trade gets its own building, sized and dressed for what it sells —
    // not one grey hut with different labels. Walls are tinted per kind so the
    // row of shops reads at a glance against the city's plain blocks.
    // Proportions are part of the read: a palace must out-bulk a bungalow,
    // and a shop must hold the street wall against 7-18 m neighbours. The
    // first sizes were hut-scale — a 5.5 m THREADS read as a kiosk beside
    // the apartment rows, and the "palace" barely cleared a villa.
    var SIZES = {
      hardware: { w: 20, d: 12, h: 9, wall: 0xd8a25a },
      dress: { w: 18, d: 11, h: 8.5, wall: 0xf0c8dc },
      barber: { w: 14, d: 9, h: 7.5, wall: 0xbcd8f0 },
      showroom: { w: 34, d: 18, h: 9, wall: 0x3c4258 },
      casino: { w: 24, d: 16, h: 9, wall: 0xe8c86a },
      safehouse: { w: 11, d: 9, h: 10, wall: 0xc8bca8 }
    };
    // Property is priced $6k / $18k / $45k, and the buildings have to tell
    // that story: the flat is a weathered harbor box, the condo a slim
    // tower with a neon balcony, the villa a wide two-tier spread. One
    // shared template made the villa the worst deal on the map.
    var SAFE_SIZES = {
      dock: { w: 11, d: 9, h: 8, wall: 0x9a8f80 },
      condo: { w: 13, d: 10, h: 14, wall: 0xc8bca8 },
      villa: { w: 17, d: 12, h: 9, wall: 0xe8e0d0 }
    };
    var walls = new GeoBatch();      // window-textured shells
    var trims = new GeoBatch();      // doors, awnings, roof lips (unlit color)
    var signs = new GeoBatch();
    var pools = new GeoBatch();      // additive light on the pavement
    // a single live mesh for anything that turns, blinks or breathes
    function neonBox(w, h, d, color, mat) {
      var mo = { color: color };
      if (mat) for (var mm in mat) mo[mm] = mat[mm];
      return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial(mo));
    }
    // ---- Gran Rosa Motors, inside ----
    // The hall is walked into where it stands, through sliding doors in the
    // glass — it used to be a room out in the fog, so from inside the glass
    // front was a blank wall. Now the street through the glass is the
    // street, and the street sees in. On the floor, each under its own
    // light, every machine on the price list that runs on wheels; at the
    // back the sales desk, whose mat is the shop's; up the stairs on the
    // left, the roof, and the two helicopters standing on their pads. All
    // of it is stock, not traffic: nothing here can be driven, and what you
    // buy waits outside on the forecourt.
    // `a` runs along the glass from the door, `b` back from it.
    function buildHall(loc, placed, S, gy, fx, fz, px2) {
      var dir = placed.dir, flip = dir.x !== 0;
      var IN = S.w / 2 - 1, BACK = S.d - 1;          // the inside faces of the walls
      var ROOF = gy + S.h, UNDER = ROOF - 0.6, PARA = 1.1;
      // the stairs up the left-hand wall as you come in, and the hole in the
      // roof over the top of them (cut where the ceiling would meet your head)
      var SA0 = IN - 2.2, SB0 = 3.2, SB1 = 15.2, HB0 = 11.2;
      var DESK = 15.7, MAT = 12.8, WALL = 0x343a4c, MINT = 0x8dffd8;
      var inward = Math.atan2(dir.x, dir.z), along = Math.atan2(px2.x, px2.z);
      function X(a, b) { return fx + px2.x * a + dir.x * b; }
      function Z(a, b) { return fz + px2.z * a + dir.z * b; }
      // a box: `wa` along the glass, `db` back from it, `h` tall from y0
      function lbox(a, b, y0, wa, h, db, color) {
        trims.addBox(X(a, b), y0 + h / 2, Z(a, b), flip ? db : wa, h, flip ? wa : db, 0, color, 0);
      }
      function lquad(a, b, y, wa, db, color) {
        trims.addGroundQuad(X(a, b), y, Z(a, b), flip ? db : wa, flip ? wa : db, 0, color);
      }
      function lsolid(a0, a1, b0, b1, top, tag, minY, noLOS) {
        return GAME.city.addSolid(X((a0 + a1) / 2, (b0 + b1) / 2), Z((a0 + a1) / 2, (b0 + b1) / 2),
          flip ? b1 - b0 : a1 - a0, flip ? a1 - a0 : b1 - b0, top, tag || 'building', noLOS, minY);
      }
      // a round plinth: a top and a rim of twenty-four facets
      function disc(x, z, r, y0, h, color) {
        var y1 = y0 + h, N = 24;
        for (var q = 0; q < N; q++) {
          var t0 = q / N * Math.PI * 2, t1 = (q + 1) / N * Math.PI * 2, tm = (t0 + t1) / 2;
          var x0 = x + Math.cos(t0) * r, z0 = z + Math.sin(t0) * r, x1 = x + Math.cos(t1) * r, z1 = z + Math.sin(t1) * r;
          trims.addQuad([x0, y1, z0], [x1, y1, z1], [x, y1, z], [x, y1, z], color, [0, 1, 0]);
          trims.addQuad([x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0], color, [Math.cos(tm), 0, Math.sin(tm)]);
        }
      }
      // the stock glows like it is under the lamps, not parked in a cave
      function unlit(m) {
        m.traverse(function (o) {
          if (o.isMesh && o.material && o.material.isMeshLambertMaterial) {
            o.material = new THREE.MeshBasicMaterial({ color: o.material.color.clone(), vertexColors: !!o.material.vertexColors });
          }
        });
      }

      // ---- what stops you: three walls, and the glass either side of the
      // door, which the law can see you through. Each runs up past the roof
      // to make its parapet; the stock's solids start under the floor, so
      // nobody climbs onto a car on display.
      lsolid(-IN - 1, IN + 1, BACK, S.d, ROOF + PARA);
      lsolid(-IN - 1, -IN, 0, BACK, ROOF + PARA);
      lsolid(IN, IN + 1, 0, BACK, ROOF + PARA);
      lsolid(-IN - 1, -1.75, -0.45, 0.4, ROOF + PARA, 'building', undefined, true);
      lsolid(1.75, IN + 1, -0.45, 0.4, ROOF + PARA, 'building', undefined, true);
      lsolid(-IN - 1, IN + 1, 0.4, 0.95, ROOF + PARA, 'building', gy + 5.9);   // the header, walked under
      // bollards: a door for people (and a bike), not for a car
      [-0.95, 0.95].forEach(function (ba) {
        lbox(ba, -0.95, gy, 0.3, 0.95, 0.3, 0x3a3f52);
        lbox(ba, -0.95, gy + 0.95, 0.34, 0.12, 0.34, MINT);
        lsolid(ba - 0.15, ba + 0.15, -1.1, -0.8, gy + 1.0, 'prop');
      });
      lquad(0, -1.6, gy + 0.08, 3.4, 2.2, 0x1f3a36);

      // ---- the floor, the walls and the ceiling, all lit from within
      lquad(0, BACK / 2, gy + 0.05, IN * 2, BACK, 0xd4d8e4);
      for (var ga = -IN + 4; ga < IN; ga += 4) lquad(ga, BACK / 2, gy + 0.09, 0.06, BACK, 0xb4b8c6);
      for (var gb = 4; gb < BACK; gb += 4) lquad(0, gb, gy + 0.09, IN * 2, 0.06, 0xb4b8c6);
      lbox(0, BACK - 0.05, gy, IN * 2, UNDER - gy, 0.1, WALL);
      [-1, 1].forEach(function (ws) {
        lbox(ws * (IN - 0.05), (0.4 + BACK) / 2, gy, 0.1, UNDER - gy, BACK - 0.4, WALL);
        lbox(ws * (IN - 0.12), (0.4 + BACK) / 2, gy, 0.04, 0.14, BACK - 0.4, MINT);
      });
      lbox(0, BACK - 0.12, gy, IN * 2, 0.14, 0.04, MINT);
      // the roof: a slab you can stand on, a ceiling of light panels under
      // it, and the hole the stairs come up through
      function roofPiece(a0, a1, b0, b1, sb0) {
        lbox((a0 + a1) / 2, (b0 + b1) / 2, UNDER, a1 - a0, ROOF - UNDER, b1 - b0, 0x3e4352);
        lbox((a0 + a1) / 2, (b0 + b1) / 2, UNDER - 0.05, a1 - a0, 0.05, b1 - b0, 0xe6eaf2);
        lsolid(a0, a1, sb0 || b0, b1, ROOF, 'building', UNDER);
      }
      roofPiece(-IN, SA0, 0.95, BACK);
      roofPiece(SA0, IN, 0.95, HB0);
      // (where the stairs arrive, the slab's edge would be a kerb to whoever
      // is a stride from the top, their feet still a step below it: the
      // landing is a deck to walk out onto, and the slab starts past it)
      roofPiece(SA0, IN, SB1, BACK, SB1 + 0.6);
      GAME.city.addDeck({ x: X((SA0 + IN) / 2, (SB1 + BACK) / 2), z: Z((SA0 + IN) / 2, (SB1 + BACK) / 2),
        w: IN - SA0, len: BACK - SB1, rot: inward, y0: ROOF, y1: ROOF, floor: true });
      for (var sl = -IN + 3; sl < SA0 - 1; sl += 5.5) lbox(sl + 1.5, 7.5, UNDER - 0.09, 3.0, 0.04, 9, 0xfffaf0);
      // the parapet round the top, standing on the walls (the old flat cap
      // was a lid; you can walk up here now)
      lbox(0, 0.325, ROOF, IN * 2 + 2.6, PARA, 1.25, 0x241a36);
      lbox(0, BACK + 0.65, ROOF, IN * 2 + 2.6, PARA, 1.3, 0x241a36);
      [-1, 1].forEach(function (ps) {
        lbox(ps * (IN + 0.65), (0.95 + BACK) / 2, ROOF, 1.3, PARA, BACK - 0.95, 0x241a36);
      });

      // ---- the sales desk, the salesman behind it, and the shop's mat
      // in front of it: the counter is where the doormat used to be
      lbox(0, DESK, gy, 6, 1.05, 0.9, 0x2a2e3a);
      lbox(0, DESK, gy + 1.05, 6.2, 0.06, 1.0, MINT);
      lsolid(-3.1, 3.1, DESK - 0.5, DESK + 0.5, gy + 1.1, 'prop', gy - 0.5);
      var sales = GAME.peds.buildPedMesh({ look: { shirt: 0xf4f4f8, pants: 0x2a2a34, skin: 0xc89870, hair: 'slick', hairCol: 0x2a1a10 } });
      sales.position.set(X(0, DESK + 0.85), gy, Z(0, DESK + 0.85));
      sales.rotation.y = inward + Math.PI;
      scene.add(sales);
      lbox(0, BACK - 0.13, gy + 1.0, 14, 3.4, 0.06, 0xffe9cc);
      lbox(0, BACK - 0.13, gy + 5.0, 9, 0.5, 0.06, MINT);
      loc.at = { x: X(0, MAT), z: Z(0, MAT) };
      // a corner to wait in, and green in the corners
      lbox(-IN + 2.2, BACK - 1.6, gy, 2.6, 0.45, 0.9, 0xf0f0f4);
      lbox(-IN + 2.2, BACK - 1.15, gy, 2.6, 0.95, 0.25, 0xf0f0f4);
      lbox(-IN + 2.2, BACK - 3.0, gy, 1.4, 0.4, 0.8, 0x2a2e3a);
      lsolid(-IN, -IN + 3.6, BACK - 3.5, BACK, gy + 1.0, 'prop', gy - 0.5);
      [[-IN + 0.7, 1.4], [SA0 - 1.0, BACK - 0.7]].forEach(function (pl) {
        lbox(pl[0], pl[1], gy, 0.7, 0.6, 0.7, 0x5a4a3a);
        lbox(pl[0], pl[1], gy + 0.6, 1.0, 1.2, 1.0, 0x3aa860);
        lsolid(pl[0] - 0.45, pl[0] + 0.45, pl[1] - 0.45, pl[1] + 0.45, gy + 1.8, 'prop', gy - 0.5);
      });

      // ---- the stock: every machine on the price list with wheels, on a
      // plinth under its own light, three of them turning
      // [type, a, b, facing (0: nose at the glass; 'along': side-on), turn rate, plinth radius]
      [['monster', -10.5, 6.0, 0.6, 0.16, 3.4],
        ['limo', -8.6, 13.0, 'along', 0, 0],
        ['buggy', 7.2, 5.8, -0.5, -0.22, 2.5],
        ['motorcycle', 5.0, 12.0, 0.9, 0, 1.4],
        ['superbike', 9.6, 12.0, -0.3, 0.3, 1.6]].forEach(function (st) {
        var a = st[1], b = st[2], r = st[5], cx = X(a, b), cz = Z(a, b);
        var m = GAME.vehicles.buildMesh(st[0]);
        if (!m) return;
        unlit(m);
        m.position.set(cx, gy + 0.2, cz);
        m.rotation.y = st[3] === 'along' ? along : inward + Math.PI + st[3];
        scene.add(m);
        if (st[4]) spinProps.push({ mesh: m, rate: st[4] });
        var hi = new THREE.Box3().setFromObject(m).max.y;
        if (r) {
          disc(cx, cz, r + 0.12, gy, 0.12, MINT);
          disc(cx, cz, r, gy, 0.2, 0xe8ecf2);
          lsolid(a - r, a + r, b - r, b + r, hi, 'prop', gy - 0.5);
        } else {
          lbox(a, b, gy, 8.6, 0.12, 3.2, MINT);
          lbox(a, b, gy, 8.4, 0.2, 3.0, 0xe8ecf2);
          lsolid(a - 3.8, a + 3.8, b - 1.2, b + 1.2, hi, 'prop', gy - 0.5);
        }
        lbox(a, b, UNDER - 0.14, 1.8, 0.04, 1.8, 0xf6f8ff);
        hallStock.push({ type: st[0], x: cx, z: cz, mesh: m });
      });

      // ---- the stairs: fifty steps up the left-hand wall, a glass
      // balustrade on the open side, and a closet under the top
      var steps = 50, run = SB1 - SB0, rise = ROOF - gy, tread = run / steps;
      GAME.city.addDeck({ x: X((SA0 + IN) / 2, (SB0 + SB1) / 2), z: Z((SA0 + IN) / 2, (SB0 + SB1) / 2),
        w: IN - SA0, len: run, rot: inward, y0: gy, y1: ROOF, floor: true });
      for (var sp = 0; sp < steps; sp++) {
        lbox((SA0 + IN) / 2, SB0 + tread * (sp + 0.5), gy, IN - SA0, rise * (sp + 1) / steps, tread, sp % 2 ? 0xe4e8f0 : 0xc4c8d4);
      }
      // the open side: nobody walks off it, or in under it — up to the
      // ceiling, then a rail round the hole on the roof, then the closet
      lsolid(SA0 - 0.25, SA0, SB0, HB0, UNDER, 'prop');
      lsolid(SA0 - 0.25, SA0, HB0, SB1, ROOF + 1.0, 'prop');
      lsolid(SA0 - 0.25, SA0, SB1, BACK, UNDER, 'prop');
      lsolid(SA0, IN, HB0 - 0.15, HB0 + 0.1, ROOF + 1.0, 'prop', UNDER);
      lbox(SA0 - 0.125, (SB1 + BACK) / 2, gy, 0.25, UNDER - gy, BACK - SB1, WALL);
      lbox(SA0 - 0.26, (SB1 + BACK) / 2, gy, 0.03, 2.2, 1.0, 0x22283a);
      var slope = Math.atan2(rise, run), slen = Math.hypot(rise, run);
      var bal = new THREE.Group();
      bal.rotation.y = inward;
      bal.position.set(X(SA0 - 0.1, (SB0 + SB1) / 2), gy + rise / 2, Z(SA0 - 0.1, (SB0 + SB1) / 2));
      var hrail = new THREE.Mesh(sharedBoxGeo(0.08, 0.08, slen), sharedBasic(MINT));
      hrail.position.y = 1.0; hrail.rotation.x = -slope;
      var pane = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.85, slen), new THREE.MeshBasicMaterial({ color: 0x9fd8e8, transparent: true, opacity: 0.22 }));
      pane.position.y = 0.5; pane.rotation.x = -slope;
      bal.add(hrail); bal.add(pane);
      scene.add(bal);
      for (var bp = 0; bp <= 6; bp++) lbox(SA0 - 0.1, SB0 + run * bp / 6, gy + rise * bp / 6, 0.06, 1.0, 0.06, MINT);
      // the rail round the hole, up on the roof
      lbox(SA0 - 0.1, (HB0 + SB1) / 2, ROOF + 0.96, 0.08, 0.08, SB1 - HB0, MINT);
      lbox((SA0 + IN) / 2, HB0, ROOF + 0.96, IN - SA0, 0.08, 0.08, MINT);
      [HB0, (HB0 + SB1) / 2].forEach(function (rb) { lbox(SA0 - 0.1, rb, ROOF, 0.06, 1.0, 0.06, MINT); });
      lbox(IN - 0.1, HB0, ROOF, 0.06, 1.0, 0.06, MINT);

      // ---- the roof: a pad for each helicopter, lit round its rim, and
      // the two of them standing on it — for show, like the rest
      [['helicopter', -9.0, 8.6, -1], ['gunship', 5.0, 8.6, 1]].forEach(function (hc) {
        var a = hc[1], b = hc[2], cx = X(a, b), cz = Z(a, b);
        disc(cx, cz, 5.4, ROOF, 0.05, 0x2a2e3a);
        lbox(a - 1.1, b, ROOF, 0.45, 0.1, 3.2, 0xf0f0f4);
        lbox(a + 1.1, b, ROOF, 0.45, 0.1, 3.2, 0xf0f0f4);
        lbox(a, b, ROOF, 1.8, 0.1, 0.45, 0xf0f0f4);
        for (var q = 0; q < 12; q++) {
          var t = q / 12 * Math.PI * 2;
          trims.addBox(cx + Math.cos(t) * 5.1, ROOF + 0.11, cz + Math.sin(t) * 5.1, 0.26, 0.12, 0.26, 0, q % 2 ? MINT : 0xffe14f, 0);
        }
        var m = GAME.vehicles.buildMesh(hc[0]);
        if (!m) return;
        unlit(m);
        // noses out to either end of the roof, tails to the middle, and the
        // body (nose to tail-boom tip) centred on its pad
        var ha = a + hc[3] * 1.8;
        m.position.set(X(ha, b), ROOF + 0.05, Z(ha, b));
        m.rotation.y = hc[3] > 0 ? along : along + Math.PI;
        if (m.userData.rotor) m.userData.rotor.rotation.y = 0.5;    // parked, blades off the line
        scene.add(m);
        m.updateMatrixWorld(true);
        // solid where it is: the cabin (with the gunship's pylons), and the
        // thin boom behind it — one box round the lot walled off the gap
        // between the two tails
        var body = m.userData.bodyMesh, hw = 1.1;
        if (body) {
          if (!body.geometry.boundingBox) body.geometry.computeBoundingBox();
          hw = body.geometry.boundingBox.max.x;
        }
        [[-hw, -2.6, hw, 1.95], [-0.32, -5.5, 0.32, -2.6]].forEach(function (lb) {
          var bx = new THREE.Box3(new THREE.Vector3(lb[0], 0, lb[1]), new THREE.Vector3(lb[2], 2.45, lb[3])).applyMatrix4(m.matrixWorld);
          GAME.city.addSolid((bx.min.x + bx.max.x) / 2, (bx.min.z + bx.max.z) / 2, bx.max.x - bx.min.x, bx.max.z - bx.min.z,
            bx.max.y, 'prop', false, ROOF - 0.2);
        });
        hallStock.push({ type: hc[0], x: m.position.x, z: m.position.z, mesh: m, roof: true });
      });
      // lamps on the roof's corners
      [[-IN + 0.6, 1.6], [-IN + 0.6, BACK - 0.6], [IN - 0.6, 1.6]].forEach(function (lp) {
        lbox(lp[0], lp[1], ROOF, 0.16, 2.4, 0.16, 0x3a3f52);
        lbox(lp[0], lp[1], ROOF + 2.4, 0.4, 0.3, 0.4, 0xfff2c8);
      });

      // ---- the doors: two glass leaves that part as you come up to them
      var leaves = [-1, 1].map(function (ls) {
        var m = neonBox(flip ? 0.08 : 1.7, 3.35, flip ? 1.7 : 0.08, 0xbfe8f0, { transparent: true, opacity: 0.3 });
        m.position.set(X(ls * 0.85, 0.06), gy + 1.72, Z(ls * 0.85, 0.06));
        scene.add(m);
        return { m: m, side: ls };
      });
      hallDoor = { leaves: leaves, x: X(0, 0), z: Z(0, 0), y: gy, px: px2, ox: X(0, 0.06), oz: Z(0, 0.06), open: 0 };
      // and what the camera and the rain need to know (interiors.js)
      var c0x = X(-IN, 0.4), c0z = Z(-IN, 0.4), c1x = X(IN, BACK), c1z = Z(IN, BACK);
      hall = GAME.interiors.addHall({ minX: Math.min(c0x, c1x), maxX: Math.max(c0x, c1x), minZ: Math.min(c0z, c1z), maxZ: Math.max(c0z, c1z),
        under: UNDER, roof: ROOF, floor: gy, loc: loc, door: { x: X(0, 0), z: Z(0, 0) }, inward: { x: dir.x, z: dir.z },
        stairs: { x: X((SA0 + IN) / 2, SB0 - 0.8), z: Z((SA0 + IN) / 2, SB0 - 0.8), topX: X((SA0 + IN) / 2, SB1 + 0.9), topZ: Z((SA0 + IN) / 2, SB1 + 0.9) } });
    }

    // ramps were placed before the shops existed, and their placement vetted
    // an empty air corridor past the lip — don't build a wall into it now
    function corridorClear(cx, cz, sx, sz) {
      var ramps = GAME.city.ramps || [];
      var half = Math.max(sx, sz) / 2;
      for (var i = 0; i < ramps.length; i++) {
        var r = ramps[i];
        var ux = Math.sin(r.rot), uz = Math.cos(r.rot);
        var lx = r.x + ux * r.len / 2, lz = r.z + uz * r.len / 2;
        // (a metered ramp keeps the corridor it had when it was dressed as
        // a booster, so taking the dress off moved no shop)
        var L = r.boost || r.cap ? 260 : 90;
        var t = ((cx - lx) * ux + (cz - lz) * uz) / L;
        if (t < -0.15 || t > 1) continue;
        var px = lx + ux * t * L, pz = lz + uz * t * L;
        if (U.dist2(cx, cz, px, pz) < Math.pow(r.w / 2 + half + 3, 2)) return false;
      }
      return true;
    }
    function footprintClear(cx, cz, sx, sz) {
      if (!corridorClear(cx, cz, sx, sz)) return false;
      var pts = [[0, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]];
      for (var i = 0; i < pts.length; i++) {
        var px = cx + pts[i][0] * (sx / 2 + 0.6), pz = cz + pts[i][1] * (sz / 2 + 0.6);
        if (GAME.city.isInWater(px, pz) && !GAME.city.isOnPier(px, pz)) return false;
        if (GAME.city.rampAt(px, pz)) return false;
        if (GAME.city.nearCrossing && GAME.city.nearCrossing(px, pz, 10)) return false;
        var rp = GAME.city.nearestRoadPoint(px, pz);
        if (U.dist2(px, pz, rp.x, rp.z) < 8.5 * 8.5) return false;
        var boxes = GAME.city.hash.query(px, pz, 1);
        for (var b = 0; b < boxes.length; b++) {
          var q = boxes[b];
          if (px > q.minX - 0.4 && px < q.maxX + 0.4 && pz > q.minZ - 0.4 && pz < q.maxZ + 0.4) return false;
        }
      }
      return true;
    }
    locations.forEach(function (loc) {
      if (loc.kind === 'bribe') {
        // The station is already a building, but the sergeant's WINDOW on
        // the street gets its own furniture: a breathing blue lamp on a
        // post, a notice board of pinned bills, and cold blue light on the
        // mat — so the spot reads as police business before the counter
        // opens.
        var ba = loc.at;
        var bgy = GAME.city.groundY(ba.x, ba.z);
        var bst = GAME.city.nearestStation(ba.x, ba.z);
        var bdx = bst.x - ba.x, bdz = bst.z - ba.z;
        var bl2 = Math.hypot(bdx, bdz) || 1; bdx /= bl2; bdz /= bl2;   // toward the station
        var bsx = -bdz, bsz = bdx;                                     // sideways along its wall
        trims.addBox(ba.x + bsx * 2.2, bgy + 1.5, ba.z + bsz * 2.2, 0.22, 3.0, 0.22, 0, 0x2c3a6a, 0);
        var blamp = neonBox(0.55, 0.7, 0.55, 0x4da3ff);
        blamp.position.set(ba.x + bsx * 2.2, bgy + 3.35, ba.z + bsz * 2.2);
        scene.add(blamp);
        GAME.city.kinetics.push({ m: blamp, pulse: 2.2, lo: 0.5, hi: 1.0 });
        // the notice board faces the mat; the bills are pinned proud of it
        var bbx = ba.x - bsx * 2.4, bbz = ba.z - bsz * 2.4;
        var brot = Math.atan2(bdx, bdz);
        [-0.8, 0.8].forEach(function (bp) {
          trims.addBox(bbx + bdx * bp, bgy + 0.85, bbz + bdz * bp, 0.15, 1.7, 0.15, brot, 0x2c3a6a, 0);
        });
        trims.addBox(bbx, bgy + 1.85, bbz, 2.0, 1.25, 0.1, brot, 0x1c2438, 0);
        [[-0.6, 0.2, 0xf0f0e8], [0.05, -0.12, 0xe8d890], [0.62, 0.14, 0xf0f0e8]].forEach(function (bill) {
          trims.addBox(bbx + bdx * bill[0] + bsx * 0.09, bgy + 1.85 + bill[1], bbz + bdz * bill[0] + bsz * 0.09,
            0.36, 0.48, 0.05, brot, bill[2], 0);
        });
        pools.addGroundQuad(ba.x, bgy + 0.1, ba.z, 7, 7, 0, 0x14335a);
        return;
      }
      var S = SIZES[loc.kind];
      if (loc.kind === 'safehouse' && loc.sh && SAFE_SIZES[loc.sh.id]) S = SAFE_SIZES[loc.sh.id];
      if (!S) return;
      // Hunt outward from the intended spot for a mat whose building fits:
      // the door faces whatever road is nearest to each candidate. Boot-time,
      // a handful of shops — the ring search costs nothing and survives any
      // future reshuffle of ramps and blocks around it.
      var placed = null;
      var cands = [[0, 0]];
      for (var ring = 1; ring <= 6 && !placed; ring++) {
        for (var a = 0; a < 8; a++) cands.push([Math.cos(a / 8 * Math.PI * 2) * ring * 5, Math.sin(a / 8 * Math.PI * 2) * ring * 5]);
      }
      for (var si = 0; si < cands.length && !placed; si++) {
        var mx = loc.at.x + cands[si][0], mz = loc.at.z + cands[si][1];
        var rp = GAME.city.nearestRoadPoint(mx, mz);
        var dx = mx - rp.x, dz = mz - rp.z;
        // a shop can dictate which way it faces (the pier casino must face
        // the walkway, not the distant beach road)
        var dir = loc.face || (Math.abs(dx) >= Math.abs(dz) ? { x: Math.sign(dx) || 1, z: 0 } : { x: 0, z: Math.sign(dz) || 1 });
        // the mat itself must be standable and off the carriageway
        if (GAME.city.isInWater(mx, mz) && !GAME.city.isOnPier(mx, mz)) continue;
        if (GAME.city.rampAt(mx, mz)) continue;
        if (U.dist2(mx, mz, rp.x, rp.z) < 9.5 * 9.5) continue;
        var sx = dir.x !== 0 ? S.d : S.w, sz = dir.x !== 0 ? S.w : S.d;
        var cx = mx + dir.x * (S.d / 2 + 1.2), cz = mz + dir.z * (S.d / 2 + 1.2);
        if (footprintClear(cx, cz, sx, sz)) placed = { mx: mx, mz: mz, cx: cx, cz: cz, sx: sx, sz: sz, dir: dir };
      }
      if (!placed) return;                // mat-only fallback; rare
      var dir = placed.dir;
      loc.at = { x: placed.mx, z: placed.mz };
      if (loc.sh) loc.sh.at = loc.at;     // you respawn at the door, not where the mat first landed
      if (loc.sh) loc.sh.face = { x: dir.x, z: dir.z };   // which way is in (homeHeading)
      var gy = GAME.city.groundY(placed.cx, placed.cz);
      // the door face and its outward normal (-dir); everything on the
      // facade hangs off these
      var fx = placed.cx - dir.x * (S.d / 2), fz = placed.cz - dir.z * (S.d / 2);
      var px2 = { x: dir.z, z: -dir.x };  // along-facade axis
      var doorW = Math.min(2.6, S.w - 2);
      function onFace(out, along, y, w, h, thick, color) {
        // a box on the facade plane: `along` slides it sideways, `out` stands
        // it proud, w × h in the face, `thick` into it
        trims.addBox(fx - dir.x * out + px2.x * along, y, fz - dir.z * out + px2.z * along,
          dir.x !== 0 ? thick : w, h, dir.x !== 0 ? w : thick, 0, color, 0);
      }
      // shell, sunk half a metre so sloped ground never shows a gap. The
      // showroom is the exception: a glass hall is glass because there is
      // NOTHING behind the pane but the hall — with the normal shell, the
      // glazing sat over a textured wall and read as an apartment block
      // wearing a windscreen. It gets back and side walls and an open front
      // for the glass, and is walked into where it stands (buildHall: its
      // roof, its floor and what is on it); everyone else keeps the full box.
      if (loc.kind === 'showroom') {
        var bwx = placed.cx + dir.x * (S.d / 2 - 0.5), bwz = placed.cz + dir.z * (S.d / 2 - 0.5);
        walls.addBox(bwx, gy + S.h / 2 - 0.25, bwz, dir.x !== 0 ? 1 : S.w, S.h + 0.5, dir.x !== 0 ? S.w : 1, 0, S.wall, 28);
        [-1, 1].forEach(function (ss) {
          walls.addBox(placed.cx + px2.x * ss * (S.w / 2 - 0.5), gy + S.h / 2 - 0.25,
            placed.cz + px2.z * ss * (S.w / 2 - 0.5),
            dir.x !== 0 ? S.d : 1, S.h + 0.5, dir.x !== 0 ? 1 : S.d, 0, S.wall, 28);
        });
      } else {
        walls.addBox(placed.cx, gy + S.h / 2 - 0.25, placed.cz, placed.sx, S.h + 0.5, placed.sz, 0, S.wall, 28);
        trims.addBox(placed.cx, gy + S.h + 0.22, placed.cz, placed.sx + 0.6, 0.34, placed.sz + 0.6, 0, 0x241a36, 0);
        GAME.city.addSolid(placed.cx, placed.cz, placed.sx, placed.sz, gy + S.h);
      }
      if (loc.kind !== 'showroom') {
        // door
        onFace(0.09, 0, gy + 1.5, doorW, 3.0, 0.18, 0x120c1e);
        // awning in the shop's color
        onFace(0.55, 0, gy + 3.15, S.w - 1.2, 0.16, 1.1, loc.color);
      }
      // ---- per-trade dressing ----
      if (loc.kind === 'dress') {
        // lit display windows flanking the door, a dressed dummy in each,
        // and a pink script-line breathing under the name — boutique, not box
        [-1, 1].forEach(function (sside) {
          var off = sside * (doorW / 2 + 2.4);
          onFace(0.12, off, gy + 1.7, 3.2, 2.6, 0.14, 0xfff4e0);
          onFace(0.3, off, gy + 1.15, 0.5, 0.9, 0.3, sside < 0 ? 0xf78ab8 : 0x8fd0f0);
          onFace(0.3, off, gy + 1.85, 0.34, 0.34, 0.3, 0xeac8a8);
        });
        var vst = neonBox(dir.x !== 0 ? 0.16 : S.w - 3.5, 0.22, dir.x !== 0 ? S.w - 3.5 : 0.16, 0xff8fd0, { transparent: true, opacity: 0.9 });
        vst.position.set(fx - dir.x * 0.2, gy + S.h - 1.9, fz - dir.z * 0.2);
        scene.add(vst);
        GAME.city.kinetics.push({ m: vst, pulse: 1.9, lo: 0.45, hi: 1.0 });
      } else if (loc.kind === 'barber') {
        // the pole TURNS now — offset courses on a spinning column read as
        // the classic spiral — and the checkerboard floor spills out the door
        var bpx = fx - dir.x * 0.6 + px2.x * (doorW / 2 + 1.1);
        var bpz = fz - dir.z * 0.6 + px2.z * (doorW / 2 + 1.1);
        var poleG = new THREE.Group();
        for (var pb = 0; pb < 6; pb++) {
          var pc = neonBox(0.4, 0.34, 0.4, pb % 3 === 0 ? 0xe23a3a : pb % 3 === 1 ? 0xf2f2f2 : 0x3a6ae2);
          pc.position.set(Math.cos(pb * 2.1) * 0.1, 0.95 + pb * 0.34, Math.sin(pb * 2.1) * 0.1);
          poleG.add(pc);
        }
        poleG.position.set(bpx, gy, bpz);
        scene.add(poleG);
        GAME.city.kinetics.push({ m: poleG, spin: 2.6 });
        onFace(0.12, -(doorW / 2 + 1.9), gy + 1.8, 2.4, 2.2, 0.14, 0xfff4e0);
        // the checkerboard spills three full rows onto the pavement, tiles
        // big enough to read from the street — it was a doormat-sized patch,
        // and every tile of it was DARK: the parity test ran on the half-tile
        // column OFFSET (-1.5, -0.5, ...), never an even number, so the
        // "white" squares never drew and the floor was black on black
        for (var ck = 0; ck < 12; ck++) {
          var cki = ck % 4, ckr = Math.floor(ck / 4), ckc = cki - 1.5;
          trims.addGroundQuad(fx - dir.x * (0.85 + ckr * 1.15) + px2.x * ckc * 1.15, gy + 0.07,
            fz - dir.z * (0.85 + ckr * 1.15) + px2.z * ckc * 1.15, 1.1, 1.1, 0,
            (cki + ckr) % 2 ? 0x16161c : 0xe8e8ec);
        }
      } else if (loc.kind === 'hardware') {
        // pawn-shop menace, per the vision: a barred lit window, ammo crates
        // by the door, sodium spill, and an OPEN sign that can't quite die
        onFace(0.1, doorW / 2 + 2.6, gy + 1.6, 4.0, 3.2, 0.16, 0x585c66);
        onFace(0.3, 0, gy + S.h - 1.9, S.w - 1.0, 0.5, 0.2, 0x585c66);
        onFace(0.12, -(doorW / 2 + 2.1), gy + 1.8, 2.8, 2.2, 0.14, 0xffe9b8);
        // bars heavy enough to read from the street, not just the doormat —
        // four verticals and a crossbar in near-black
        [-1.15, -0.38, 0.38, 1.15].forEach(function (bx) {
          onFace(0.22, -(doorW / 2 + 2.1) + bx, gy + 1.8, 0.26, 2.6, 0.12, 0x14101c);
        });
        onFace(0.24, -(doorW / 2 + 2.1), gy + 1.95, 2.8, 0.24, 0.12, 0x14101c);
        var crx = fx - dir.x * 1.4 + px2.x * (S.w / 2 - 1.3);
        var crz = fz - dir.z * 1.4 + px2.z * (S.w / 2 - 1.3);
        trims.addBox(crx, gy + 0.5, crz, 1.05, 1.0, 1.05, 0.3, 0x8a6a3a, 0);
        trims.addBox(crx + 0.2, gy + 1.3, crz - 0.1, 0.85, 0.6, 0.85, 0.8, 0x6a5a4a, 0);
        var open = neonBox(1.5, 0.7, 0.14, 0xff4a3a);
        open.position.set(fx - dir.x * 0.22 + px2.x * (doorW / 2 + 1.3), gy + 3.0, fz - dir.z * 0.22 + px2.z * (doorW / 2 + 1.3));
        scene.add(open);
        GAME.city.kinetics.push({ m: open, blink: 1.15, duty: 0.78 });
        pools.addGroundQuad(fx - dir.x * 2.2, gy + 0.1, fz - dir.z * 2.2, 12, 9, 0, 0x6a4210);
      } else if (loc.kind === 'casino') {
        // THE LUCKY GULL, palace edition: a second tier and a dark crown over
        // the gold hall, a deco sunburst stacked over the doors, the gull's
        // wheel actually turning, bulbs down every lip, a red carpet to the
        // mat and two searchlights sweeping the sky off the roof
        var t2w = 16, t2d = 11, t2h = 5;
        var t2x = placed.cx + dir.x * 1.8, t2z = placed.cz + dir.z * 1.8;
        walls.addBox(t2x, gy + S.h + t2h / 2 - 0.1, t2z, dir.x !== 0 ? t2d : t2w, t2h, dir.x !== 0 ? t2w : t2d, 0, S.wall, 28);
        GAME.city.addSolid(t2x, t2z, dir.x !== 0 ? t2d : t2w, dir.x !== 0 ? t2w : t2d, gy + S.h + t2h - 0.1);
        trims.addBox(t2x, gy + S.h + t2h + 1.0, t2z, 8, 2.1, 5.5, 0, 0x241a36, 0);
        // gold lips on both tiers, and a row of warm bulbs under the first
        onFace(0.2, 0, gy + S.h - 0.28, S.w - 0.6, 0.4, 0.24, 0xffd24a);
        var t2fx = t2x - dir.x * (t2d / 2), t2fz = t2z - dir.z * (t2d / 2);
        trims.addBox(t2fx - dir.x * 0.12, gy + S.h + t2h - 0.28, t2fz - dir.z * 0.12,
          dir.x !== 0 ? 0.24 : t2w - 0.6, 0.4, dir.x !== 0 ? t2w - 0.6 : 0.24, 0, 0xffd24a, 0);
        for (var bl = 0; bl < 9; bl++) {
          onFace(0.24, (bl - 4) * (S.w - 2.6) / 8, gy + S.h - 0.85, 0.28, 0.28, 0.2, 0xfff0b8);
        }
        // the sunburst: gold and pink courses stepping wider over the doors
        for (var sb = 0; sb < 5; sb++) {
          onFace(0.16 + sb * 0.012, 0, gy + 3.45 + sb * 0.42, 3.4 + sb * 1.45, 0.34, 0.14, sb % 2 ? 0xff4fa3 : 0xffd24a);
        }
        onFace(0.11, 0, gy + 3.12, doorW + 0.9, 0.28, 0.2, 0xffd24a);   // gilt door head
        // the gull's wheel, turning over the crown
        var wheelG = new THREE.Group();
        for (var cs = 0; cs < 8; cs++) {
          var ca = cs / 8 * Math.PI * 2;
          var wb2 = neonBox(0.8, 0.8, 0.24, cs % 2 ? 0xffe14f : 0xff4fa3);
          wb2.position.set(Math.cos(ca) * 1.6, Math.sin(ca) * 1.6, 0);
          wheelG.add(wb2);
        }
        wheelG.add(neonBox(0.7, 0.7, 0.26, 0xfff6d8));
        wheelG.position.set(t2fx - dir.x * 0.5, gy + S.h + t2h + 2.1, t2fz - dir.z * 0.5);
        scene.add(wheelG);
        GAME.city.kinetics.push({ m: wheelG, spinZ: 0.8 });
        // searchlights: tilted beams on the second-tier corners, sweeping slow
        [-1, 1].forEach(function (sside) {
          var slx = t2x + px2.x * sside * (t2w / 2 - 1.4), slz = t2z + px2.z * sside * (t2w / 2 - 1.4);
          trims.addBox(slx, gy + S.h + t2h + 0.4, slz, 0.8, 0.8, 0.8, 0, 0x3a3040, 0);
          var sl = new THREE.Group();
          var tilt = new THREE.Group();
          tilt.rotation.z = 0.4;
          var beam = neonBox(0.6, 26, 0.6, 0xfff2c8, { transparent: true, opacity: 0.22, depthWrite: false });
          beam.position.y = 13;
          tilt.add(beam);
          sl.add(tilt);
          sl.position.set(slx, gy + S.h + t2h + 0.8, slz);
          scene.add(sl);
          GAME.city.kinetics.push({ m: sl, spin: 0.5 + sside * 0.13 });
        });
        // the red carpet, rolled from the doors to the mat, edged in gold
        trims.addGroundQuad(fx - dir.x * 2.8, gy + 0.09, fz - dir.z * 2.8, dir.x !== 0 ? 5.6 : 2.2, dir.x !== 0 ? 2.2 : 5.6, 0, 0x9a1626);
        pools.addGroundQuad(fx - dir.x * 3, gy + 0.11, fz - dir.z * 3, 16, 12, 0, 0x7a5a12);
      } else if (loc.kind === 'showroom') {
        // the glass jewel box: glazing you can SEE THROUGH to lit machines on
        // the showroom floor, a chrome band breathing along the roofline,
        // pennants across the forecourt and a rotating totem out by the road
        // the pane itself: barely-there blue, framed like real curtain glass —
        // header beam above, corner posts and slim mullions, mint entry posts
        // The glass stops at the door now: two panes either side of it and a
        // transom over it, and the door itself two leaves that slide apart
        // as you come up to them (update, below).
        [-1, 1].forEach(function (gs) {
          var pw = S.w / 2 - 1 - 1.7;
          var glz = neonBox(dir.x !== 0 ? 0.14 : pw, 5.6, dir.x !== 0 ? pw : 0.14, 0x9fd8e8, { transparent: true, opacity: 0.18 });
          glz.position.set(fx - dir.x * 0.12 + px2.x * gs * (1.7 + pw / 2), gy + 3.1, fz - dir.z * 0.12 + px2.z * gs * (1.7 + pw / 2));
          scene.add(glz);
        });
        var tsm = neonBox(dir.x !== 0 ? 0.14 : 3.4, 2.25, dir.x !== 0 ? 3.4 : 0.14, 0x9fd8e8, { transparent: true, opacity: 0.18 });
        tsm.position.set(fx - dir.x * 0.12, gy + 4.78, fz - dir.z * 0.12);
        scene.add(tsm);
        onFace(-0.5, 0, gy + (5.9 + S.h) / 2, S.w - 2.2, S.h - 5.9, 0.9, 0x2e3346);
        [-1, 1].forEach(function (mp) {
          onFace(0.02, mp * (S.w / 2 - 0.9), gy + 3.1, 0.8, 5.6, 0.8, 0x2e3346);
          onFace(0.02, mp * (S.w / 6), gy + 3.1, 0.26, 5.6, 0.3, 0x223040);
          onFace(0.05, mp * 1.7, gy + 1.7, 0.22, 3.4, 0.26, 0x8dffd8);
        });
        onFace(0.05, 0, gy + 3.55, 3.7, 0.2, 0.22, 0x8dffd8);
        // the skirt strip stands clear of the glazing's planes — at 0.2 its
        // inner face shared the glass's and the two banded strips flickered.
        // And it is muted on purpose: painted the marker's own mint it read
        // as one enormous glowing doormat across the whole front, as if the
        // entry highlight were the width of the building. It stops either
        // side of the door, which you walk through.
        [-1, 1].forEach(function (ks) {
          onFace(0.3, ks * (S.w / 4 + 0.6), gy + 0.35, S.w / 2 - 2.8, 0.7, 0.3, 0x2a544c);
        });
        buildHall(loc, placed, S, gy, fx, fz, px2);
        // chrome band, breathing
        var chase = neonBox(dir.x !== 0 ? 0.2 : S.w - 0.8, 0.35, dir.x !== 0 ? S.w - 0.8 : 0.2, 0xf0f6ff, { transparent: true, opacity: 0.9 });
        chase.position.set(fx - dir.x * 0.34, gy + S.h - 0.35, fz - dir.z * 0.34);
        scene.add(chase);
        GAME.city.kinetics.push({ m: chase, pulse: 2.6, lo: 0.45, hi: 1.0 });
        // the totem: a pole by the road, the mint machine turning on top
        var ttx = fx - dir.x * 9 + px2.x * (S.w / 2 + 3.5), ttz = fz - dir.z * 9 + px2.z * (S.w / 2 + 3.5);
        trims.addBox(ttx, gy + 5.5, ttz, 0.5, 11, 0.5, 0, 0x3a3f52, 0);
        GAME.city.addSolid(ttx, ttz, 0.7, 0.7, gy + 11, 'prop', true);
        var head = new THREE.Group();
        head.add(neonBox(3.6, 2.4, 0.24, 0x141020));
        var sil = neonBox(2.4, 0.62, 0.3, 0x8dffd8); sil.position.y = -0.5; head.add(sil);
        var silc = neonBox(1.2, 0.5, 0.3, 0x8dffd8); silc.position.set(0.15, 0.05, 0); head.add(silc);
        var hring = neonBox(3.9, 0.18, 0.28, 0xff4fa3); hring.position.y = 1.0; head.add(hring);
        head.position.set(ttx, gy + 12.3, ttz);
        scene.add(head);
        GAME.city.kinetics.push({ m: head, spin: 1.1 });
        // pennants strung from the facade corner to the totem
        var pcx = fx + px2.x * (S.w / 2 - 1), pcz = fz + px2.z * (S.w / 2 - 1);
        for (var pf = 0; pf <= 6; pf++) {
          var pt = pf / 6;
          trims.addBox(U.lerp(pcx, ttx, pt), gy + 5.6 - Math.sin(pt * Math.PI) * 0.5, U.lerp(pcz, ttz, pt),
            0.34, 0.42, 0.1, Math.atan2(ttx - pcx, ttz - pcz), [0x8dffd8, 0xff4fa3, 0xffe14f][pf % 3], 0);
        }
        pools.addGroundQuad(placed.cx - dir.x * (S.d / 2 + 3), gy + 0.1, placed.cz - dir.z * (S.d / 2 + 3), 22, 10, 0, 0x2e5a50);
        // the forecourt lot, painted like it means it: your garage lives here
        // until you own a place — a pad down the strip beside the hall, a
        // mint border on the road side, bay lines where the fleet parks
        if (loc.forecourt) {
          // paint layers a clear step apart — 0.015 gaps shimmered from the air
          var fcx = loc.forecourt.x + 1.5, fcz = loc.forecourt.z + 15;
          trims.addGroundQuad(fcx, gy + 0.04, fcz, 13, 34, 0, 0x1f1f28);
          trims.addGroundQuad(fcx - 6.2, gy + 0.16, fcz, 0.5, 34, 0, 0x8dffd8);
          trims.addGroundQuad(fcx, gy + 0.16, fcz + 16.8, 13, 0.5, 0, 0x8dffd8);
          trims.addGroundQuad(fcx, gy + 0.16, fcz - 16.8, 13, 0.5, 0, 0x8dffd8);
          [-10, 0, 10].forEach(function (bz) {
            trims.addGroundQuad(fcx, gy + 0.24, fcz + bz, 11, 0.35, 0, 0xd8d8e0);
          });
        }
        var plX = fx - dir.x * 7 + px2.x * (S.w / 2 - 3);
        var plZ = fz - dir.z * 7 + px2.z * (S.w / 2 - 3);
        trims.addBox(plX, gy + 0.4, plZ, 4.4, 0.8, 4.4, 0, 0x8dffd8, 0);
        GAME.city.addSolid(plX, plZ, 4.4, 4.4, gy + 0.8, 'prop', true);
        var showCar = GAME.vehicles.buildMesh('sports');
        if (showCar) {
          showCar.position.set(plX, gy + 0.8, plZ);
          scene.add(showCar);
          spinProps.push({ mesh: showCar, rate: 0.35 });
        }
      } else if (loc.kind === 'safehouse') {
        // every home keeps the porch lamp — domestic warmth, the only light
        // temperature in the city that says "lived in" — and then each tier
        // tells its own story on top
        onFace(0.45, doorW / 2 + 0.8, gy + 3.4, 0.3, 0.5, 0.3, 0xffd890);
        pools.addGroundQuad(fx - dir.x * 1.4 + px2.x * (doorW / 2 + 0.8), gy + 0.1,
          fz - dir.z * 1.4 + px2.z * (doorW / 2 + 0.8), 7, 7, 0, 0x7a5a20);
        var shid = loc.sh && loc.sh.id;
        if (shid === 'dock') {
          // a cot over the harbor: one dim window, a drying net on the wall,
          // crates by the door and a gull holding the roofline
          onFace(0.12, 0, gy + S.h - 2.65, S.w - 5, 1.2, 0.14, 0xd8c890);
          onFace(0.1, -(doorW / 2 + 1.9), gy + 2.2, 2.0, 1.6, 0.08, 0x4a5240);
          var dcx = fx - dir.x * 1.0 + px2.x * (S.w / 2 - 1.2);
          var dcz = fz - dir.z * 1.0 + px2.z * (S.w / 2 - 1.2);
          trims.addBox(dcx, gy + 0.45, dcz, 0.9, 0.9, 0.9, 0.2, 0x8a6a3a, 0);
          trims.addBox(dcx - 0.15, gy + 1.2, dcz + 0.1, 0.75, 0.6, 0.75, 0.7, 0x6a5a4a, 0);
          trims.addBox(fx + px2.x * (S.w / 2 - 1), gy + S.h + 0.55, fz + px2.z * (S.w / 2 - 1), 0.3, 0.3, 0.42, 0, 0xf0f0f4, 0);
          trims.addBox(fx + px2.x * (S.w / 2 - 1) - dir.x * 0.22, gy + S.h + 0.78, fz + px2.z * (S.w / 2 - 1) - dir.z * 0.22, 0.14, 0.16, 0.18, 0, 0xf0f0f4, 0);
        } else if (shid === 'condo') {
          // neon out every window: three lit floors and a pink balcony rail
          // breathing across the face
          [S.h - 2.65, S.h - 5.65, S.h - 8.65].forEach(function (wy) {
            onFace(0.12, 0, gy + wy, S.w - 3, 1.6, 0.14, 0xffe9b0);
          });
          [-1, 0, 1].forEach(function (bp) {
            onFace(0.6, bp * (S.w / 2 - 2.4), gy + 5.6, 0.16, 1.3, 0.16, 0x3a3346);
          });
          var rail = neonBox(dir.x !== 0 ? 0.18 : S.w - 3.4, 0.2, dir.x !== 0 ? S.w - 3.4 : 0.18, 0xff8fd0, { transparent: true, opacity: 0.9 });
          rail.position.set(fx - dir.x * 0.66, gy + 6.25, fz - dir.z * 0.66);
          scene.add(rail);
          GAME.city.kinetics.push({ m: rail, pulse: 2.0, lo: 0.5, hi: 1.0 });
          // a palm by the door — the strip address comes with one
          var ptx = fx - dir.x * 1.6 - px2.x * (doorW / 2 + 2.2);
          var ptz = fz - dir.z * 1.6 - px2.z * (doorW / 2 + 2.2);
          trims.addBox(ptx, gy + 1.4, ptz, 0.32, 2.8, 0.32, 0, 0x7a5a38, 0);
          trims.addBox(ptx, gy + 2.9, ptz, 2.3, 0.16, 0.5, 0.55, 0x3aa860, 0);
          trims.addBox(ptx, gy + 2.9, ptz, 2.3, 0.16, 0.5, -0.55, 0x3aa860, 0);
        } else {
          // the good life: two lit floors, a setback upper tier with a
          // terrace behind a row of warm bulbs, and a pool by the door
          onFace(0.12, 0, gy + S.h - 2.65, S.w - 3, 1.6, 0.14, 0xffe9b0);
          onFace(0.12, 0, gy + S.h - 5.4, S.w - 3, 1.4, 0.14, 0xffe9b0);
          var vtw = dir.x !== 0 ? S.d / 2 : S.w - 4, vtd = dir.x !== 0 ? S.w - 4 : S.d / 2;
          var vtx = placed.cx + dir.x * (S.d / 4 - 0.2), vtz = placed.cz + dir.z * (S.d / 4 - 0.2);
          walls.addBox(vtx, gy + S.h + 2.1, vtz, vtw, 4.6, vtd, 0, S.wall, 28);
          GAME.city.addSolid(vtx, vtz, vtw, vtd, gy + S.h + 4.3);
          trims.addBox(placed.cx - dir.x * (S.d / 4), gy + S.h + 0.1, placed.cz - dir.z * (S.d / 4),
            dir.x !== 0 ? S.d / 2 - 0.6 : S.w - 2, 0.2, dir.x !== 0 ? S.w - 2 : S.d / 2 - 0.6, 0, 0xd8ccb8, 0);
          for (var vb = -2; vb <= 2; vb++) {
            trims.addBox(fx - dir.x * 0.5 + px2.x * vb * (S.w / 5 - 0.4), gy + S.h + 1.0,
              fz - dir.z * 0.5 + px2.z * vb * (S.w / 5 - 0.4), 0.22, 0.22, 0.22, 0, 0xffe9b0, 0);
          }
          // the pool, decked and glowing, off the door side of the front
          var plx = fx - dir.x * 4.2 - px2.x * (S.w / 2 + 3.4);
          var plz = fz - dir.z * 4.2 - px2.z * (S.w / 2 + 3.4);
          trims.addGroundQuad(plx, gy + 0.08, plz, 6.2, 4.8, 0, 0xd8d0c0);
          trims.addGroundQuad(plx, gy + 0.14, plz, 4.8, 3.4, 0, 0x2a9ad8);
          pools.addGroundQuad(plx, gy + 0.18, plz, 6.5, 5, 0, 0x1a5a7a);
        }
      }
      // the name in lights
      var slot = SIGN_SLOT[loc.id];
      if (slot !== undefined) {
        var rotY = dir.x !== 0 ? (dir.x < 0 ? Math.PI / 2 : -Math.PI / 2) : (dir.z < 0 ? 0 : Math.PI);
        // a dark board behind the glyphs so the name reads day and night
        onFace(0.12, 0, gy + S.h - 0.85, Math.min(S.w - 0.8, 11) + 0.8, 1.9, 0.14, 0x14101f);
        GAME.city.addSign(signs, slot, fx - dir.x * 0.22, gy + S.h - 0.85, fz - dir.z * 0.22,
          rotY, Math.min(S.w - 0.8, 11), 1.6);
      }
    });
    var wallMesh = new THREE.Mesh(walls.build(), GAME.city.lam(GAME.city.tex.strip));
    wallMesh.matrixAutoUpdate = false;
    scene.add(wallMesh);
    var trimMesh = new THREE.Mesh(trims.build(), new THREE.MeshBasicMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
    trimMesh.matrixAutoUpdate = false;
    scene.add(trimMesh);
    var signMesh = new THREE.Mesh(signs.build(), GAME.city.signMesh.material);
    signMesh.matrixAutoUpdate = false;
    scene.add(signMesh);
    var poolsMesh = new THREE.Mesh(pools.build(), new THREE.MeshBasicMaterial({
      vertexColors: true, map: GAME.city.glowTexture('rgba(255,255,255,0.6)'),
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    poolsMesh.matrixAutoUpdate = false;
    scene.add(poolsMesh);
    // these come after the city packed and released its static meshes, so
    // they go through the same here (see packStatic, releaseStatic)
    [wallMesh, trimMesh, signMesh, poolsMesh].forEach(function (m) { packStatic(m); releaseStatic(m); });
  }

  // one instanced-ish batch of glowing doormats, pulsing in update()
  function buildMarkers(scene) {
    var g = new THREE.Group();
    locations.forEach(function (loc) {
      var y = GAME.city.groundY(loc.at.x, loc.at.z);
      var ring = new THREE.Mesh(
        new THREE.CylinderGeometry(2.2, 2.2, 0.18, 18, 1, true),
        new THREE.MeshBasicMaterial({ color: loc.color, transparent: true, opacity: 0.75, side: THREE.DoubleSide })
      );
      ring.position.set(loc.at.x, y + 0.35, loc.at.z);
      g.add(ring);
      var post = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 2.6, 0.5),
        new THREE.MeshBasicMaterial({ color: loc.color, transparent: true, opacity: 0.5 })
      );
      post.position.set(loc.at.x, y + 1.5, loc.at.z);
      g.add(post);
      markerData.push({ ring: ring, post: post, loc: loc, y: y });
    });
    scene.add(g);
    markerMesh = g;
  }

  // ---------- the counter (DOM) ----------
  function $(id) { return document.getElementById(id); }
  function note(t) { if (el.note) el.note.textContent = t || ''; }
  function items(loc) {
    switch (loc.kind) {
      case 'hardware': return hardwareItems();
      case 'dress': return dressItems();
      case 'barber': return barberItems();
      case 'safehouse': return safehouseItems(loc);
      case 'showroom': return showroomItems();
      case 'bribe': return bribeItems();
      case 'casino': return casinoItems();
      case 'bar': return barItems();
      case 'wardrobe': return wardrobeItems();
      case 'derby': return GAME.derby.items();
    }
    return [];
  }
  function render() {
    if (!openShop) return;
    var P = GAME.player, list = items(openShop);
    el.title.textContent = openShop.name;
    // the boot-time tag goes stale the moment a safehouse changes hands, and
    // the hint with it — buying your condo mid-visit must not leave a footer
    // still promising a BUY that no longer exists. Both live here in render.
    if (openShop.kind === 'safehouse') openShop.tag = owns(openShop.sh.id) ? 'Yours' : 'For sale';
    el.tag.textContent = openShop.tag || '';
    var hint = $('shop-hint');
    if (hint) hint.textContent =
      openShop.kind === 'wardrobe'
        ? 'Click or W/S to see it on you  ·  WEAR (or Enter) puts it on  ·  Esc leave'
      : openShop.kind === 'derby'
        ? GAME.derby.hint() + '  ·  Set your stake, pick a horse — BET asks before it takes it  ·  Esc leave'
      : openShop.kind === 'dress' || openShop.kind === 'barber'
        ? 'Click or W/S to try it on — the mirror is you, free of charge  ·  BUY asks before it charges  ·  Esc leave'
        : openShop.kind === 'showroom'
          ? 'Click or W/S to put it on the turntable  ·  BUY asks before it charges  ·  Esc leave'
          : openShop.kind === 'safehouse' && owns(openShop.sh.id)
            ? 'Your place — Enter to sleep it off, nothing to buy here  ·  Esc leave'
            : 'Click or W/S to select  ·  BUY (or Enter) asks before it charges  ·  Esc leave';
    el.cash.textContent = '$' + P.cash.toLocaleString();
    el.items.innerHTML = '';
    sel = Math.max(0, Math.min(sel, list.length - 1));
    list.forEach(function (it, i) {
      var row = document.createElement('div');
      var afford = P.cash >= it.price;
      var buyable = !it.owned && !it.off && afford;
      row.className = 'shop-row' + (i === sel ? ' sel' : '') + ((it.off || !afford) && !it.owned ? ' off' : '') + (it.owned ? ' owned' : '');
      var sw = it.sw !== undefined ? '<span class="sw" style="background:#' + it.sw.toString(16).padStart(6, '0') + '"></span>' : '';
      // Trying is free; paying goes through a gate. Hover or click previews;
      // the selected row wears a BUY chip, and BUY (or Enter, or a second
      // click) opens a confirmation card — nothing is ever bought without
      // answering it. Re-visiting a row can only ever re-preview it.
      var armed = i === sel && buyable;
      // noPrice rows are actions, not goods (sleeping in your own bed):
      // never print FREE or a BUY chip on them — that read as a purchase
      var priceCell = it.owned ? (it.ownedLabel || 'YOURS')
        : it.noPrice ? (armed ? (it.chip || 'GO') : (it.idle || ''))
          : armed ? (it.verb || 'BUY') + ' · ' + (it.price > 0 ? '$' + it.price.toLocaleString() : 'FREE')
            : it.price > 0 ? '$' + it.price.toLocaleString() : 'FREE';
      row.innerHTML = '<div><div class="nm">' + sw + it.name + '</div>' + (it.ds ? '<div class="ds">' + it.ds + '</div>' : '') + '</div>' +
        '<div class="pr' + (armed ? ' buychip' : '') + '">' + priceCell + '</div>';
      // the row only ever selects and previews. Money moves through the BUY
      // chip alone — hover already selects, so a click-anywhere-to-buy meant
      // the first click on a hovered row spent money while "just previewing".
      row.addEventListener('click', function () {
        if (sel !== i) { sel = i; render(); }
      });
      var chip = row.querySelector('.pr');
      chip.addEventListener('click', function (ev) {
        ev.stopPropagation();
        if (sel !== i) { sel = i; render(); return; }
        openConfirm(it);
      });
      row.addEventListener('mouseenter', function () { if (sel !== i) { sel = i; render(); } });
      el.items.appendChild(row);
    });
    // the keyboard walks the whole list: keep the selected row in view
    var selRow = el.items.children[sel];
    if (selRow && selRow.scrollIntoView) selRow.scrollIntoView({ block: 'nearest' });
    setPreview(list[sel]);
  }

  // ---------- the turntable ----------
  // A live 3D preview beside the list: the mannequin wears whatever the
  // selected row would put on you, the showroom spins the actual machine.
  // Its own tiny renderer, driven from the main loop's rAF (the sim is
  // frozen behind a shop, the render loop is not).
  var pv = { renderer: null, scene: null, cam: null, obj: null, key: '', on: false };
  function ensurePv() {
    if (pv.renderer) return;
    var canvas = $('shop-preview');
    pv.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    pv.renderer.setSize(300, 340, false);
    pv.scene = new THREE.Scene();
    pv.scene.add(new THREE.HemisphereLight(0xcfd8ff, 0x2a2038, 1.0));
    var dl = new THREE.DirectionalLight(0xfff0d8, 0.9);
    dl.position.set(3, 5, 4);
    pv.scene.add(dl);
    pv.cam = new THREE.PerspectiveCamera(38, 300 / 340, 0.1, 60);
  }
  function clearPvObj() {
    if (!pv.obj) return;
    pv.scene.remove(pv.obj);
    disposeTree(pv.obj);
    pv.obj = null;
  }
  // The preview's context is its own, a second WebGL context with its own
  // buffers and shaders, and it used to live for the rest of the session from
  // the first visit to any counter. Now it goes when the shop closes and is
  // made again on the next visit, while the game is frozen behind the shop.
  //
  // That only lets go cleanly if the preview has drawn nothing shared: r128
  // ties every geometry and material a renderer draws to that renderer until
  // the resource is disposed, and the town's shared ones never are — so one
  // shared car body or shirt colour drawn here would hold every torn-down
  // preview renderer alive. The preview therefore draws copies of anything
  // shared (a few small buffers), and they are disposed with it.
  function ownCopies(root) {
    root.traverse(function (o) {
      var g = o.geometry;
      if (g && g.userData && g.userData.shared) { o.geometry = g.clone(); o.geometry.userData = {}; }
      if (o.material && !Array.isArray(o.material) && o.material.userData && o.material.userData.shared) {
        o.material = o.material.clone();
        o.material.userData = {};
      }
    });
    return root;
  }
  function releasePv() {
    clearPvObj();
    if (!pv.renderer) return;
    pv.renderer.dispose();
    pv.renderer.forceContextLoss();
    // a canvas whose context was lost cannot be given a new one
    var old = $('shop-preview');
    if (old && old.parentNode) old.parentNode.replaceChild(old.cloneNode(false), old);
    pv.renderer = pv.scene = pv.cam = null;
  }
  function previewOutfit(it) {
    var o = { shirt: outfit().shirt, pants: outfit().pants, hairStyle: outfit().hairStyle, hairColor: outfit().hairColor, skin: outfit().skin };
    if (it) {
      if (it.id.indexOf('shirt_') === 0) o.shirt = it.id.slice(6);
      else if (it.id.indexOf('pants_') === 0) o.pants = it.id.slice(6);
      else if (it.id.indexOf('style_') === 0) o.hairStyle = it.id.slice(6);
      else if (it.id.indexOf('color_') === 0) o.hairColor = it.id.slice(6);
      else if (it.id.indexOf('skin_') === 0) o.skin = byId(SKINTONES, it.id.slice(5)).hex;
    }
    return o;
  }
  // small helper for the prop previews: a colored box added to a group
  function pbox(g, x, y, z, w, h, d, color, glow) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
      new THREE.MeshLambertMaterial(glow
        ? { color: color, emissive: color, emissiveIntensity: 0.6 }
        : { color: color }));
    m.position.set(x, y, z);
    g.add(m);
    return m;
  }
  // every counter shows its goods: guns and kit at the hardware store, the
  // cash itself at the police desk, a chip stack at the casino, the house
  // at a safehouse — nothing is bought sight unseen
  function propPreview(kind, it) {
    var g = new THREE.Group();
    pbox(g, 0, 0.03, 0, 3.4, 0.06, 3.4, 0x2a2f4a);            // display plinth
    if (kind === 'hardware') {
      var shape = { armor: 'armor', medkit: 'health' }[it.id] || it.id;
      var m = GAME.combat.pickupShape(shape);
      m.scale.set(2.1, 2.1, 2.1);
      m.position.y = 1.0;
      g.add(m);
    } else if (kind === 'bribe') {
      // the bribe is money on the table — CLEAN SLATE stacks one bundle per star
      var n = it.id === 'slate' ? Math.max(1, GAME.police.wanted) : 1;
      for (var i = 0; i < n; i++) {
        var b = GAME.combat.pickupShape('cash');
        b.scale.set(1.7, 1.7, 1.7);
        b.position.y = 0.55 + i * 0.42;
        b.rotation.y = (i % 2) * 0.5 - 0.25;
        g.add(b);
      }
    } else if (kind === 'casino') {
      // your stake as a chip stack: taller bet, taller tower
      var chips = { bet100: 4, bet500: 9, bet2000: 18 }[it.id] || 4;
      var cols = [0xff2d95, 0x2de8ff, 0xf5f0ff];
      for (var c = 0; c < chips; c++) {
        var chip = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.12, 18),
          new THREE.MeshLambertMaterial({ color: cols[c % 3], emissive: cols[c % 3], emissiveIntensity: 0.35 }));
        chip.position.set(Math.sin(c * 2.4) * 0.03, 0.62 + c * 0.13, Math.cos(c * 2.4) * 0.03);
        g.add(chip);
      }
    } else if (kind === 'safehouse') {
      var sh = openShop.sh || {};
      if (sh.id === 'dock') {
        [-0.7, 0.7].forEach(function (px) { [-0.55, 0.55].forEach(function (pz) {
          pbox(g, px, 0.31, pz, 0.09, 0.5, 0.09, 0x7a5b3e); }); });
        pbox(g, 0, 0.6, 0, 1.9, 0.08, 1.6, 0x9a7b52);          // deck on stilts
        pbox(g, 0, 1.1, 0, 1.5, 0.92, 1.2, 0x9adfe8);          // the shack
        pbox(g, 0, 1.6, 0, 1.7, 0.08, 1.4, 0xf2f2f6);          // flat roof
        pbox(g, 0.3, 1.0, 0.62, 0.34, 0.56, 0.05, 0x30323e);   // door
        pbox(g, -0.32, 1.2, 0.62, 0.34, 0.3, 0.04, 0xfff3b8, true);
      } else if (sh.id === 'villa') {
        pbox(g, 0.2, 0.56, 0, 2.5, 1.0, 1.7, 0xffe8d1);        // ground floor
        pbox(g, -0.35, 1.46, 0, 1.3, 0.8, 1.3, 0xffd9e8);      // upper wing
        pbox(g, -0.35, 1.9, 0, 1.5, 0.08, 1.5, 0xf2f2f6);
        pbox(g, 0.85, 1.1, 0, 1.3, 0.08, 1.8, 0xf2f2f6);       // terrace lip
        pbox(g, 0.6, 0.62, 0.88, 0.36, 0.62, 0.05, 0x30323e);  // door
        pbox(g, 0.6, 1.02, 0.92, 0.8, 0.07, 0.3, 0xff7fb8);    // awning
        [-0.2, -0.9].forEach(function (px) { pbox(g, px, 0.62, 0.88, 0.4, 0.34, 0.04, 0xb8f6ff, true); });
      } else {
        pbox(g, 0, 1.2, 0, 1.35, 2.3, 1.35, 0xf3d9e2);         // the condo tower
        pbox(g, 0, 2.4, 0, 1.5, 0.09, 1.5, 0xffffff);
        for (var r = 0; r < 4; r++) for (var q = -1; q <= 1; q++)
          pbox(g, q * 0.4, 0.82 + r * 0.42, 0.69, 0.26, 0.24, 0.03, 0xfff3b8, true);
        pbox(g, 0, 0.45, 0.69, 0.34, 0.7, 0.04, 0x30323e);     // lobby door
      }
    }
    return g;
  }
  function setPreview(it) {
    var kind = openShop && openShop.kind;
    // (nothing to turn on a stand at the bar, and the horses are on the screens)
    var wants = it && kind && kind !== 'bar' && kind !== 'derby';
    var side = $('shop-side');
    pv.on = !!wants;
    if (side) side.style.display = wants ? 'block' : 'none';
    if (!wants) { clearPvObj(); pv.key = ''; return; }
    ensurePv();
    var tag = $('shop-preview-tag');
    if (kind === 'hardware' || kind === 'bribe' || kind === 'casino' || kind === 'safehouse') {
      var pkey2 = 'prop:' + kind + ':' + it.id + (kind === 'bribe' ? ':' + GAME.police.wanted : '');
      if (tag) tag.textContent = kind === 'safehouse' ? openShop.sh.name : it.name;
      if (pkey2 === pv.key) return;
      pv.key = pkey2;
      clearPvObj();
      pv.obj = propPreview(kind, it);
      var tall = kind === 'safehouse' && (!openShop.sh || openShop.sh.id !== 'dock' && openShop.sh.id !== 'villa');
      pv.cam.position.set(0, tall ? 2.2 : 1.8, tall ? 4.8 : 4.0);
      pv.cam.lookAt(0, tall ? 1.2 : 0.85, 0);
    } else if (kind === 'showroom') {
      var key = 'car:' + it.id;
      if (tag) tag.textContent = it.name;
      if (key === pv.key) return;
      pv.key = key;
      clearPvObj();
      pv.obj = GAME.vehicles.buildMesh(it.id);
      if (!pv.obj) return;
      var spec = GAME.vehicles.TYPES[it.id];
      var r = Math.max(spec.l, 4) * 0.62 + 2.2;
      pv.cam.position.set(r * 0.75, spec.l * 0.28 + 1.6, r * 0.75);
      pv.cam.lookAt(0, Math.max(0.8, spec.l * 0.1), 0);
    } else {
      // an honest mirror: YOUR skin, YOUR current outfit, with only the
      // hovered row swapped in — this is exactly how you'd walk out
      var o = previewOutfit(it);
      var pkey = 'ped:' + o.shirt + '/' + o.pants + '/' + o.hairStyle + '/' + o.hairColor + '/' + o.skin;
      if (tag) tag.textContent = 'YOU · wearing ' + it.name.replace(/^(SHIRT|PANTS|CUT|HAIR COLOR|SKIN TONE) · /, '');
      if (pkey === pv.key) return;
      pv.key = pkey;
      clearPvObj();
      var m = GAME.peds.buildPedMesh({ noHair: true });
      var j = m.userData.joints;
      j.torso.material = new THREE.MeshLambertMaterial({ color: byId(SHIRTS, o.shirt).hex });
      j.armL.children[0].material = j.torso.material;
      j.armR.children[0].material = j.torso.material;
      j.legL.children[0].material = new THREE.MeshLambertMaterial({ color: byId(PANTS, o.pants).hex });
      j.legR.children[0].material = j.legL.children[0].material;
      j.head.material = new THREE.MeshLambertMaterial({ color: o.skin });
      var hair = GAME.peds.makeHair(o.hairStyle, byId(HAIRCOLORS, o.hairColor).hex);
      if (hair) { hair.position.y = 1.6; m.add(hair); }
      pv.obj = m;
      pv.cam.position.set(0, 1.5, 3.2);
      pv.cam.lookAt(0, 1.0, 0);
    }
    pv.scene.add(ownCopies(pv.obj));
  }
  function renderPreview() {
    if (!pv.on || !pv.renderer || !pv.obj || !GAME.shopOpen) return;
    // the chip stack whirls while the wheel is going
    pv.obj.rotation.y += spinning && openShop && openShop.kind === 'casino' ? 0.14 : 0.016;
    pv.renderer.render(pv.scene, pv.cam);
  }
  // the purchase gate. The card names the thing and its price; only CONFIRM
  // (or Enter while it's up) actually spends money, in every shop alike.
  function openConfirm(it) {
    if (!openShop || !it || it.owned || it.off) return;
    if (spinning) { note('The wheel is still spinning…'); return; }
    // no money moves on a noPrice action, so the gate would only ask
    // "buy this? Free" — the exact wording the condo bug shipped. Act directly.
    if (it.noPrice) { buy(it.id); return; }
    var P = GAME.player;
    if (P.cash < it.price) { note('You’re $' + (it.price - P.cash).toLocaleString() + ' short.'); GAME.audio.crash(0.12); GAME.haptics.deny(); return; }
    pendingBuy = it.id;
    $('shop-confirm-name').textContent = it.name;
    $('shop-confirm-price').textContent = it.price > 0 ? (it.verb ? 'Stake: $' : 'Price: $') + it.price.toLocaleString() : 'Free';
    $('shop-confirm').style.display = 'flex';
  }
  function cancelConfirm() {
    pendingBuy = null;
    var c = $('shop-confirm');
    if (c) c.style.display = 'none';
  }
  function confirmYes() {
    var id = pendingBuy;
    cancelConfirm();
    if (id) buy(id);
  }

  function buy(id) {
    if (!openShop) return false;
    if (spinning) { note('The wheel is still spinning…'); return false; }
    var list = items(openShop), it = null;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) { it = list[i]; break; }
    if (!it || it.owned || it.off) { render(); return false; }
    var P = GAME.player;
    if (P.cash < it.price) { note('You’re $' + (it.price - P.cash).toLocaleString() + ' short.'); GAME.audio.crash(0.12); GAME.haptics.deny(); return false; }
    GAME.addCash(-it.price);
    switch (openShop.kind) {
      case 'hardware': buyHardware(id); break;
      case 'dress': buyDress(id); break;
      case 'barber': buyBarber(id); break;
      case 'safehouse': buySafehouse(openShop, id); break;
      case 'showroom': buyShowroom(openShop, id); break;
      case 'bribe': buyBribe(id); break;
      case 'casino': spinWheel(it.price); break;
      case 'bar': buyBar(id); break;
      case 'wardrobe': buyDress(id, true); break;
      case 'derby':
        // a horse: the stake is down, so off you go to watch it run
        if (GAME.derby.choose(id) === 'bet') { close(); GAME.hud.message('Your money\'s down. Watch the screens!', 3); }
        break;
    }
    if (openShop) render();   // a purchase can close the shop (share card) — guard
    GAME.audio.pickup();
    return true;
  }
  function open(idOrLoc) {
    var loc = typeof idOrLoc === 'string' ? locations.filter(function (l) { return l.id === idOrLoc; })[0] : idOrLoc;
    if (!loc || openShop) return false;
    openShop = loc;
    sel = 0;
    // The mirror greets you AS YOU ARE. In the changing room and the chair
    // the cursor starts on the row you're already wearing, so the first
    // thing the glass shows is the player, exactly — clothes, cut, color,
    // skin — not row one's shirt pulled over your head.
    if (loc.kind === 'dress' || loc.kind === 'barber' || loc.kind === 'wardrobe') {
      var list0 = items(loc);
      for (var oi = 0; oi < list0.length; oi++) if (list0[oi].owned) { sel = oi; break; }
    }
    if (loc.kind === 'derby') sel = 1;   // the first horse, under the stake
    cancelConfirm();
    note('');
    el.screen.style.display = 'flex';
    GAME.shopOpen = true;
    GAME.releasePointer();
    if (GAME.syncOverlayMusic) GAME.syncOverlayMusic();
    render();
    GAME.track('shop-open-' + loc.kind);
    if ((loc.kind === 'derby' || loc.kind === 'wardrobe') && GAME.lola) GAME.lola.first(loc.kind);
    return true;
  }
  function close() {
    if (!openShop) return;
    if (pendingBuy !== null) { cancelConfirm(); return; }   // Esc backs out of the card first
    leftSince[openShop.id] = false;   // must step off the mat before it reopens
    openShop = null;
    el.screen.style.display = 'none';
    GAME.shopOpen = false;
    pv.on = false;
    releasePv();
    pv.key = '';
    if (GAME.syncOverlayMusic) GAME.syncOverlayMusic();
    GAME.regainPointer();
  }

  // A key for the open shop, as the game hears it (main.js hands it over),
  // so a pad's D-pad and A — which arrive that way and no other — browse
  // and buy. It used to listen to the browser's own key events, which a
  // controller never makes: on a pad a shop opened and could only be shut.
  // Esc is left to main.js, which closes the card and then the shop.
  function key(code) {
    if (!GAME.shopOpen || !openShop) return false;
    if (pendingBuy !== null) {
      // the confirmation card owns the keys while it's up
      if (code === 'Enter' || code === 'KeyE') { confirmYes(); return true; }
      return code !== 'Escape';
    }
    var list = items(openShop);
    if (code === 'KeyS' || code === 'ArrowDown') { sel = (sel + 1) % list.length; render(); }
    else if (code === 'KeyW' || code === 'ArrowUp') { sel = (sel - 1 + list.length) % list.length; render(); }
    else if (code === 'Enter' || code === 'KeyE') { if (list[sel]) openConfirm(list[sel]); }
    else return false;
    return true;
  }

  function init(scene) {
    ['shop-screen', 'shop-title', 'shop-tag', 'shop-cash', 'shop-items', 'shop-note', 'shop-close']
      .forEach(function (id) { el[id.replace('shop-', '')] = $(id); });
    if (el.close) el.close.addEventListener('click', close);
    ['click', 'touchend'].forEach(function (ev) {
      $('shop-confirm-yes').addEventListener(ev, function (e) { e.preventDefault(); confirmYes(); });
      $('shop-confirm-no').addEventListener(ev, function (e) { e.preventDefault(); cancelConfirm(); });
    });
    buildLocations();
    buildShopfronts(scene);   // may slide a doormat to fit its building
    buildMarkers(scene);
    refreshGarageSpots();     // bought vehicles wait at home from last session
    applyOutfit();
  }

  // walk-in check + marker pulse; the hint line is served to missions.js so it
  // shares the one POI readout instead of fighting over it
  function update(dt) {
    var P = GAME.player;
    for (var i = 0; i < markerData.length; i++) {
      var m = markerData[i];
      var pulse = 0.55 + 0.3 * Math.sin(GAME.time * 3 + i);
      m.ring.material.opacity = pulse;
      m.ring.rotation.y += dt * 0.8;
      // owned property mats calm down to a steady glow
      if (m.loc.kind === 'safehouse' && owns(m.loc.sh.id)) m.ring.material.opacity = 0.35;
    }
    for (var sp = 0; sp < spinProps.length; sp++) spinProps[sp].mesh.rotation.y += dt * spinProps[sp].rate;
    if (hallDoor) stepHall(dt);
    if (GAME.shopOpen || !GAME.started || P.state !== 'alive') return;
    // a walk-in must be WALKED in. Feet cover under a metre per tick, so a
    // multi-metre move between scans is a teleport — waking up at your own
    // condo, a mission repositioning you, a loaded save — and any mat you
    // land on stays shut until you step off and come back meaning it
    var jumped = lastWX !== null && U.dist2(P.pos.x, P.pos.z, lastWX, lastWZ) > 12 * 12;
    lastWX = P.pos.x; lastWZ = P.pos.z;
    var unlocked = !GAME.isla || GAME.isla.isOpen();
    // the bridges opening adds the island lots — re-plan the fleet then
    if (unlocked !== lastUnlocked) { lastUnlocked = unlocked; refreshGarageSpots(); }
    for (var k = 0; k < locations.length; k++) {
      var loc = locations[k];
      if (loc.isla && !unlocked) continue;
      var d2 = U.dist2(P.pos.x, P.pos.z, loc.at.x, loc.at.z);
      // (a mat is on the floor it is on: up on the showroom's roof, over
      // the sales desk, you are not at the sales desk)
      if (loc.atY === undefined) loc.atY = GAME.city.groundY(loc.at.x, loc.at.z);
      if (d2 > 5.5 * 5.5 || P.pos.y > loc.atY + 3) { leftSince[loc.id] = true; continue; }
      if (P.inCar || d2 > 2.6 * 2.6) continue;
      if (leftSince[loc.id] === false) continue;   // still standing where it closed
      if (leftSince[loc.id] === undefined || jumped) { leftSince[loc.id] = false; continue; }
      // a home you own and the casino are rooms now: the mat takes you in
      // (or the doorman turns you away), and either way it waits until you
      // have stepped off it again
      if (GAME.interiors && GAME.interiors.enterable(loc) && GAME.interiors.enter(loc)) {
        leftSince[loc.id] = false;
        return;
      }
      open(loc);
      return;
    }
  }

  // The hall's doors part for you, or for anybody on foot coming through
  // (a cop on your tail walked through shut glass), and close behind; and
  // walking in, you are told where things are.
  var doorWho = 0;
  function stepHall(dt) {
    var D = hallDoor, P = GAME.player, near = false;
    if (Math.abs(P.pos.y - D.y) < 3 && U.dist2(P.pos.x, P.pos.z, D.x, D.z) < 5 * 5) near = true;
    else if (D.open > 0 || (doorWho = (doorWho + 1) % 10) === 0) {
      // (the rest of the street is asked a few times a second while shut)
      var peds = GAME.world.peds;
      for (var i = 0; i < peds.length && !near; i++) {
        var pd = peds[i];
        if (pd.dead || !pd.pos) continue;
        if (U.dist2(pd.pos.x, pd.pos.z, D.x, D.z) < 3.5 * 3.5 && Math.abs(pd.pos.y - D.y) < 3) near = true;
      }
    }
    var was = D.open;
    D.open = U.clamp(D.open + (near ? 2.4 : -1.6) * dt, 0, 1);
    if (D.open !== was || !D.placed) {
      D.placed = true;
      var e = D.open * D.open * (3 - 2 * D.open);
      for (var k = 0; k < D.leaves.length; k++) {
        var lf = D.leaves[k], a = lf.side * (0.85 + 1.65 * e);
        lf.m.position.x = D.ox + D.px.x * a;
        lf.m.position.z = D.oz + D.px.z * a;
      }
    }
    var inside = !!hall && P.state === 'alive' && !P.inCar && GAME.interiors.hall() === hall && P.pos.y < hall.under;
    if (inside && !inHall) {
      GAME.track('showroom-hall');
      if (GAME.time - hallHello > 45) {
        hallHello = GAME.time;
        GAME.hud.message('GRAN ROSA MOTORS — the sales desk is at the back. The stairs on the left go up to the roof and the helicopters.', 4);
      }
    }
    inHall = inside;
  }

  // the nearest doormat's label for the shared POI hint line
  // (asked every tick near a doormat: the nearest is found as a distance,
  // and its words — a formatted price among them — are made again only when
  // the doormat, its owner or the player's mode changes)
  var hintOut = { d: 0, text: '' }, hintLoc = null, hintForSale = false, hintInCar = false;
  function nearHint(px, pz) {
    var unlocked = !GAME.isla || GAME.isla.isOpen();
    var best = null, bd = 0;
    for (var i = 0; i < locations.length; i++) {
      var loc = locations[i];
      if (loc.isla && !unlocked) continue;
      var d = U.dist2(px, pz, loc.at.x, loc.at.z);
      if (d < 30 * 30 && (!best || d < bd)) { best = loc; bd = d; }
    }
    if (!best) return null;
    var forSale = best.kind === 'safehouse' && !owns(best.sh.id), inCar = GAME.player.inCar;
    if (best !== hintLoc || forSale !== hintForSale || inCar !== hintInCar) {
      hintLoc = best; hintForSale = forSale; hintInCar = inCar;
      hintOut.text = best.name + (forSale ? ' · $' + best.sh.price.toLocaleString() : '') +
        (best.kind === 'showroom' ? ' — walk in: the light is at the sales desk' : ' — step onto the light') + (inCar ? ' (on foot)' : '');
    }
    hintOut.d = bd;
    return hintOut;
  }

  // (kept and rewritten rather than built new: the radar asks twenty times a
  // second, and its callers read the list straight away and keep none of it;
  // written by index and cut to length, since emptying it would drop its
  // storage every time)
  var blipList = [], blipPool = [];
  function blips() {
    var n = 0;
    for (var i = 0; i < locations.length; i++) {
      var loc = locations[i];
      // the desk sergeant lives inside the police station — the P badge
      // already marks it, and a $ stacked on top just clutters the map
      if (loc.kind === 'bribe') continue;
      var home = loc.kind === 'safehouse' && owns(loc.sh.id);
      if (!loc.blipColor) loc.blipColor = '#' + loc.color.toString(16).padStart(6, '0');
      var b = blipPool[n] || (blipPool[n] = {});
      b.x = loc.at.x; b.z = loc.at.z;
      b.color = home ? '#5dff9e' : loc.blipColor;
      b.label = loc.kind === 'safehouse' ? (home ? '⌂' : '$') : '$';
      b.home = home;
      blipList[n++] = b;
    }
    blipList.length = n;
    return blipList;
  }

  return {
    init: init, update: update, open: open, close: close, buy: buy, key: key,
    nearHint: nearHint, blips: blips, applyOutfit: applyOutfit,
    homeSpawn: homeSpawn, ownsAny: ownsAny, owns: owns, startSpawn: startSpawn,
    renderPreview: renderPreview,
    garage: function () { return garage().slice(); },
    // a prize, not a purchase: straight into the garage, parked at every base
    grantVehicle: function (type) {
      var g = garage();
      if (g.indexOf(type) >= 0) return false;
      g.push(type);
      GAME.save();
      refreshGarageSpots();
      return true;
    },
    garageSpot: function (type) {
      // the fleet parks at every base now — answer with the nearest copy
      var P = GAME.player, best = null, bd = 1e18;
      for (var k in garageSpots) {
        var g = garageSpots[k];
        if (g.vtype !== type) continue;
        var d = U.dist2(P.pos.x, P.pos.z, g.x, g.z);
        if (d < bd) { bd = d; best = g; }
      }
      return best;
    },
    get isOpen() { return !!openShop; },
    get current() { return openShop; },
    get selected() { return openShop ? items(openShop)[sel] : null; },
    locations: function () { return locations; },
    // the Gran Rosa Motors hall: its bounds and stairs, what is on display,
    // and how far its doors stand open
    hall: function () { return hall; },
    hallStock: function () { return hallStock; },
    hallDoor: function () { return hallDoor ? hallDoor.open : null; },
    wardrobe: { SHIRTS: SHIRTS, PANTS: PANTS, HAIRSTYLES: HAIRSTYLES, HAIRCOLORS: HAIRCOLORS, SKINTONES: SKINTONES },
    closet: closet
  };
})();
