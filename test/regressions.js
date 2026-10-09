// Regression test — one check per bug that has been fixed, so it stays fixed.
//
//   node test/regressions.js
//
// Same setup as smoke.js: the `playwright` npm package and a Chromium
// (CHROMIUM_PATH env var, or Playwright's own browser install), the repo
// served on an ephemeral port — no other setup, no network.
//
// Where smoke.js asks "does the game still run", this asks "do these
// particular bugs stay dead". Every check here fails on the code as it was
// before its fix, which is the only thing that makes a regression check
// worth having: a test that cannot fail is decoration.
//
// What it holds the game to:
//   1. OVERLAY AUDIO  — the tick halts behind pause, the map and a result
//      card, and every looping voice is a held gain node the tick would
//      otherwise leave sustaining. Each overlay must stop engine, skid,
//      siren and radio, and hand the radio back only to a LIVING driver.
//   2. EDGE INPUT     — every caller of GAME.keyPressed sits behind a mode
//      gate, so a press must be claimable exactly once and an unclaimed one
//      must not survive the tick it arrived in, in either direction.
//   3. PARACHUTE      — a life that ends under the canopy must stow it, so
//      it is not left hanging over the body through the wasted screen and
//      the first living frame does not run a glide step at the hospital.
//   5a. THE BIGGER GAPS — completion pays once rather than pinning your cash;
//       a day lasts twelve minutes, night hides you and thins the streets,
//       and rain loosens the road, closes the fog in and brings lightning;
//       aircraft are turned back at the map's edges and stop at a ceiling;
//       the lock-on holds and follows its target; you can climb a ledge;
//       new traffic and people are never made where you are looking;
//       traffic goes round what is stopped, honks at you, and answers a ram;
//       cars have horns, a cruiser has a siren and a vigilante shift;
//       keys rebind, the mouse has a speed and an invert, the field of view
//       is a setting, and a controller plays the game.
//   5b. THE WATER — off the beach you swim, at the surface and with no guns,
//       and climb out up the sand or onto a pier; the sea along the coast is
//       level where you swim in it; boats moored by the piers ride the
//       swell, stop dead at land, keep out of the closed channel and set you
//       on the pier or over the side; cruisers stop at the water's edge and
//       send the helicopter; nobody else walks into the sea.
//   5c. MORE TO DO — Lola pages a line when a job starts and another when it
//       is done; takedowns put a target in the traffic that runs, and some
//       shoot back; Isla Verde has ten stunt jumps on a tally of its own;
//       thirty lost tapes hide on both islands, pay as they are found, glint
//       on the radar up close, and all of them put a new station on the dial.
//   5d. INDOORS — the mat of a home you own takes you inside, where the bed
//       is how you sleep it off; walls hold, the camera stays under the
//       ceiling, no rain falls and nobody hunting you can see in; the casino
//       has a wheel, a bar that patches you up, and a doorman who keeps out
//       anybody with stars; the mat by the door takes you back out.
//   5e. FROM THE PLAYTEST — every job you start in a vehicle starts where a
//       vehicle can reach; a quick tap of F is never lost, and there is a
//       prompt saying what you can get into; a block between you and the
//       camera pulls it in even when it looks down from above the roofline;
//       the camera stays above the drawn sand; a nudge does not dent a car.
//   5f. YOUR ANSWERS — cars take about 40% more before they burn (takedown
//       targets as tuned); one star holds twenty seconds, forty-five in
//       sight, then goes; X twice (or ABANDON on the pause screen) walks
//       away from a mission or clocks off a shift (on touch, JOB stays up
//       as END); a lift runs from the helipad tower's lobby to its roof and
//       back; starting or waking at home, the camera clears the house front;
//       no island jump stands in the Marina Villa's front yard.
//   5g. FROM YOUR PLAY — Isla Verde's districts are named on the map;
//       a delivered patient walks in through the hospital doors; a night's
//       sleep runs the weather on; a plane you jump out of rolls on.
//   5h. THE WATER, AGAIN — a plane left in the air flies on and noses down;
//       the edge of the world is well out to sea; boats hit bridge piers;
//       a regatta against rival boats, and contraband to fish out of the bay.
//   5i. LOLA'S TIPS, AND THE CAMERA — Lola pages what a thing is the first
//       time you meet it, once, and the pause screen switches her off; C
//       takes a photo of the frame, developed like a 1986 print, into an
//       album you save from (or straight to your downloads), kept between visits.
//   5j. WALK-IN BUSINESSES — the gun shop, THREADS, the barber and the
//       sergeant's desk are rooms you walk into, the menu at the counter; a wardrobe at home holds two outfits from the start and all
//       you buy; the casino's terminals run horse races at posted odds.
//   5k. HOMES LIKE THEIR OUTSIDES — buying a place takes you in; the flat is
//       one room, the condo's bedroom is through a door, the villa has stairs
//       up to its bedroom; the ice cream truck's horn is its chimes.
//   5l. SHOT AT, AND LOLA ON CALL — a driver you shoot reacts (flee, bail,
//       fight, shoot back); the tower lift is a glass ride up the outside;
//       the helipad's parapet holds and a long fall kills; L calls Lola.
//   5m. A CONTROLLER REACHES EVERYTHING — a pad browses and buys in a shop,
//       moves a cursor on the map, routes to it and filters its legend,
//       works the CONTROLS
//       screen, answers a dialog, carries on from WASTED, fires the TALON;
//       D-pad down changes weapon without calling Lola, a held button lets go
//       of the key it pressed, and the prompts name the pad's buttons; and a
//       touchscreen can barrel-roll the plane like the other two.
//   5n. GRAN ROSA MOTORS, WALKED INTO — the glass hall is entered where it
//       stands, through doors that part; the street is through the glass;
//       every land vehicle on its price list is on the floor and both
//       helicopters on the roof, none of them drivable; stairs go up there.
//       With money on a Gull Downs race you watch it from the terminal; the
//       beach shelves into the sea instead of ending in a wall.
//   5o. DOORS, BOOSTERS, DRINKS, THE GUN — the tower lift's doors part as
//       you come and shut for the ride, and the car comes to your stop; a
//       third of Isla Verde's jumps are capped boosters; a few drinks too
//       many and the night swims (and wears off); a shot from the hip turns
//       you to it and brings the gun up, both hands for a two-handed gun;
//       the horn sounds for as long as it is held, over a dipped engine;
//       all 25 jumps give the arsenal, kept and refilled free (unlimited
//       ammo is for finishing everything), and older saves keep theirs.
//   5p. THE CITY YOU HEAR — on foot the speakers are not silent, and not
//       loud; your steps sound by what is underfoot; a swim strokes and
//       laps; the surf is there by the sea and gone downtown; a car going by
//       is a voice on its own side; people murmur only when they are about;
//       a car's cabin and a room muffle it all; the island has crickets at
//       night and the sea has gulls by day; an overlay silences it.
//   5q. LOLA'S FIRST DAY — a fresh save is asked whether it wants showing
//       around (closing her is no, and says the island is shut; a save with
//       a job done is never asked); shown around, a parked car is marked, the
//       ring is routed, BEACH RUN runs kinder (three drops, 150 s) and a
//       failure or a retry stays kind; paid, she waits out the card and sends
//       you to CORTES CUTS, and after the chair the wider picture; driving
//       off or abandoning lets you go, and her menu has the way back.
//   5r. OUT ON THE WATER — a Wave Rider is moored off the northern pier and
//       you ride it astride; switched on, people come out on jet skis and
//       boats, keep to the water, go places and give you a wide berth; run
//       one down and it is a crime and they flee; one can be taken from the
//       water; they are held at the shut channel; a hull on the sand backs
//       off it; inland the bay empties. Wanted at sea, the harbour patrol
//       sends launches — none on land, one at two stars, two at three —
//       that come alongside a stopped boat, haul a swimmer out, wait off
//       the beach for you, and stand down to potter off when the heat goes.
//   5s. STREET LIFE — with the CITY on, a getaway car comes past with a
//       cruiser on its tail; a shop is held up and the thief runs; an
//       armoured van does its rounds; a racer pulls up at the lights. An
//       outlaw is fair game, and stopping one pays (and makes the papers —
//       a slipped four-star manhunt does too, a bust does not). Six
//       strangers on the mainland pavements ask a favour each, six more on
//       Isla Verde once the bridges open, and Lola counts them.
//   5t. THE BIG SCORE — once the bridges open, Lola's job on the strip's
//       Savings & Loan, part by part: the camera (front and vault), Benny
//       from the marina, a Vulture GT through the paint shop (which sends a
//       car out another colour), and the job — hands up, the floor kept or
//       the alarm let go, the vault, the bags, the street, the lock-up.
//   5u. BUSINESSES — the barber bought at its counter; a day fills its till,
//       which empties into your pocket; left, it stops at three days and
//       Lola pages once; a hold-up there runs with the till, and stopping
//       the thief gets it back. The bar is for sale too; Lola counts them.
//   5v. ISLA VERDE BOATS — four moorings on the island, two at the marina
//       and two at a jetty in the east-coast cove, each afloat; the cove's
//       speedboat is boarded from the planks and taken out. And the map's
//       depot sits in the Shops & property row, and its solo.
//   5w. UNDER A BRIDGE — a boat crossing under a span keeps the camera under
//       the girder, level or looked steeply up.
//   5x. LOOSE ENDS — the target's car is locked (F rattles it, and he goes);
//       boxed in across the road he gets out of it; hurt, he shoots out of
//       the window; bailed, he is on foot with a gun and the job waits on
//       him; down, the ledger is on him; taken, Rico's men come for it in a
//       locked car, close in and get out armed; at Lola's lock-up it passes.
//   5y. THE CITY, SPREAD OUT — the hardware store, the tailor and the barber
//       each in a district of their own and none on the strip, each a real
//       building off the road; the plots they left on the strip are built
//       on. VERDE CABS on Isla Verde: an open garage walked into off the
//       street, a cab either side to take, for sale at its desk; bought, the
//       Tiger Cab is in the middle bay and takes fares, each one putting more
//       on the firm's board, and its till fills at the bigger rate.
//   4y. AROUND THE GAME — messages stack; the district name keeps out of a
//       mission's title; every overlay uses the game's face; the title says
//       LOADING until it can answer; pause takes keys, ignores a click that
//       just missed a button and resumes on its empty screen; the map zooms,
//       names missions and marks beaten ones in
//       colours no two families share; a car keeps its radio dial, which has
//       an OFF; a bed means a home start; shake and graphics have switches;
//       a slow machine still thins; hits show their direction, low health
//       pulses, and a browser with no fullscreen says what to do instead.
//   4z. THE PLAY LOOP — a roof is not a hiding place: officers below see
//       and shoot up at its edge, its middle is cover, and nobody climbing
//       after you brings the helicopter early. A failed run can be retried
//       from where it failed, or from the hospital, for a few seconds.
//       A car at a crawl knocks people down rather than killing them, and a
//       lamp post goes down to a car at speed instead of stopping it dead.
//   3z. THE LAW CAN BE LOST — break contact and the police hunt where they
//       last saw you; lie low and even four stars go, though not in a hurry.
//       Sleeping off a manhunt takes two stars, not all of them; the same
//       jump pays once per cooldown; a passed rampage leaves you on two stars.
//   3y. THE PLAYER-FACING AUDIT — things that happened to somebody playing:
//       a car hurts you on foot and cannot lift you onto a roof; the camera
//       stays out of the wall and your head; a fall that ends in the
//       on-your-feet margin still lands; a mission marker is somewhere you
//       pull up, not a tripwire, and does not restart under you; traffic gets
//       past a kerb-parked car and never U-turns to a junction behind it; the
//       helicopter hovers; a car between you and the police is cover; a car
//       can knock you off a bike; you fight back at CITY: OFF; mute is one
//       remembered switch; the closed bridge says so once, on the deck; the
//       next arrest takes as long as the first; a touchscreen laptop keeps
//       its mouse.
//   3x. OUT IN THE AIR — getting out of a car leaves you at the car's level:
//       in mid-air you fall from there, and on a roof you stay on the roof.
//   3w. BOOSTERS — a booster strip pushes whether or not your foot is down,
//       its push ends at the lip rather than firing into the road on
//       landing, the speed it hands back comes off smoothly, and the capped
//       chain launcher gets every car to its pace, not just the fast ones.
//       The chain's rooftop ramp is a metered drop and no longer poses as a
//       booster; it eases you to its pace instead of snapping you to it.
//   3v. INTO THE SEA — a vehicle that goes into the water goes UNDER and is
//       cleared away, the player's own included, rather than skimming out
//       across the surface and stopping there for good.
//   3u. WINDOW LIGHT — after dark each ordinary block lights its own share of
//       its windows, warm or cool, and the walls keep the colours they were
//       dealt; checked on a real render, not just on the numbers behind it.
//   3t. FACADE PAINT — the ordinary blocks on both islands are painted in
//       more than one shade, no two neighbours are painted the same shade
//       twice, each shows its own arrangement of windows, and the seed paints
//       the same building the same way every load; the buildings with a
//       design of their own keep the light they always had.
//   3s. THE HELIPADS — both pads show, on the map and on the radar alike,
//       from one shared list the legend can strike; and nothing
//       marker-shaped is baked into the base image, where no filter reaches.
//   3r. THE BEACH AT THE BRIDGES — the sand parts for the span and for
//       nothing else, so no slot of open sea is left beside it.
//   3q. THE RADAR'S HOME MARKER — a property in range is a dot where it
//       actually is; one off the radar is not drawn at all.
//   3p. THE ICE CREAM ROUND — a customer walks over and is SERVED, rather
//       than sprinting at the hatch and teleporting money into the till.
//   3o. PICKUPS ON DRY LAND — nothing you are meant to walk to stands at
//       the waterline, where reaching for it is a swim.
//   3m. A BLAST CLEARS THE STREET — an explosion is felt far past where it
//       hurts, it ends whatever anyone was doing, and an airframe is bigger.
//   3l. THE LAW OFF THE PLAYER'S BACK — there are police on the street when
//       you are clean, they attend other people's trouble, and none of it
//       reaches your wanted level. A drawn gun is pointed at another NPC.
//   3k. A CITY THAT FIGHTS ITSELF — strangers react to each other, the knob
//       that rates it is monotone, and OFF is the old game exactly.
//   3j. BOUNCING OFF A WALL — the shove off what you hit is capped and it
//       dies, instead of handing the car a reverse gear it never selected.
//   3i. ON FOOT, NOT UP THE RAMP — a stunt ramp is a drivable surface with
//       walled flanks, so anyone who walks onto the deck is stuck up there.
//       Nobody on foot climbs one, and no fare is set down on one.
//   3h. KERBSIDE PARKING — a parked car is beside a road, never across one.
//   3g. LANE KEEPING — a driver takes its lane from the first metre, not
//       from the first node it reaches.
//   3f. PARKED AIRFRAME — solid to drive into, and still shoves nobody.
//   3e. ISLAND RACES — the gates follow the road they are named for, and sit
//       close enough together that the line between two of them stays on it.
//   3d. POLICE AIM — the round lands where the tracer put it, and range,
//       speed and the officer holding the gun all decide where that is.
//   3c. WANTED LADDER — each star has to cost more offences than the last.
//   3b. CANOPY OVER WATER — open sea BELOW a glide is not the sea you are in.
//   4. UNLIMITED AMMO — the all-jumps reward must read as ∞, not as the
//      frozen 999 the stopped decrement leaves behind.
//   5. STEREO IMAGE   — a sound's pan must agree with the direction the
//      player actually moves, so the field can never end up mirrored.
//   5b. THE RADIO'S OWN TAP — every voice a station plays goes through the
//       radio's bus, so none of it ticks on through the car door or past
//       MUSIC: OFF; and a radio nobody can hear builds no voices at all, yet
//       comes back on the beat it left.
//   6. RIDING A ROOF  — a chassis that pitches has to carry its passenger
//      with it, rather than leaving them on the roof it would have had
//      sitting still.
//   6b. WHOEVER IS ABOARD — a rider is a person to a round, a fist, a blast
//       and a car driven into them, not the bike under them; nobody sits in
//       a burning vehicle of any kind, and whoever is still aboard when one
//       goes up dies with it.
//   7. HAPTICS        — a buzz per knock, rationed, silenceable, and safe on
//      a browser with no motor at all. Then the vocabulary on top of that: no
//      two kinds may feel the same, the tiers must preempt in one direction
//      only, and the events with a body behind them — a run-over, a star, a
//      fire, a blast, a canopy touching down — are driven through the game
//      rather than through the module door. Then the one SUSTAINED channel,
//      which runs on its own timer: it has to keep pulsing, stop itself when
//      the caller goes quiet, and never take the channel from a one-shot.
//   8. FRAME BUDGET   — the crowd thins when frames run late and, more to
//      the point, comes BACK when they do not.
//   9. SHOWROOM       — a bought vehicle is delivered once, not twice.
//  10. RACE GRID      — the field lines up where you can see it, and the
//      rubber band moves something that can actually close a gap.
//  11. AIR CONTROL    — the pedals stop at the lip and the wheel does not.
//  12. SUSPENSION     — weight moves when speed does: the nose lifts under
//      power and dives under the brakes, on TOP of whatever grade the wheels
//      are on, and settles back to it.
//  13. TOUCH STICK    — a viewport change mid-drag must let the stick go
//      rather than keep steering from an origin on the old screen.
//  13b. MEMORY      — what the memory work took off stays off: spike strips
//      are capped, the result card, the map and uploaded textures let their
//      canvases go, the ocean moves on the GPU, batches and static meshes
//      drop their arrays (the interiors and shop fronts too), the island is
//      instanced and indexed, entities keep one shape, a shop's preview
//      renderer goes when the shop closes, and nothing is spawned out at sea
//      only to be thrown away the next tick.
//  15. TALKING HEADS  — a job not done yet opens on a scene that holds the
//      world still, types its lines under the speaker's face, moves on by
//      key or by itself and skips on Esc; then the job starts. A retry and a
//      job already passed go straight in. Every face is valid SVG, the pager
//      shows its sender's, and a voice makes nothing while muted.
//  16. STORY ACTS     — a story job's own part won goes on: Rico's men, a
//      crew down the street, a bag to the lock-up, Rico's stand on the
//      marina; a failure in a later act retries from the top.
//  17. GANGS          — Lola's people and Rico's crew on their own turf, in
//      their colours; his men draw on sight after the warehouses, the two
//      sides fight each other and not their own, and turf follows the story.
//  18. ARSENAL        — melee, throwables, a scoped rifle and a rocket, one
//      blade and one throwable at a time, SVG icons, and the weapon wheel.
//  19. ROBBERY        — a gun on the clerk empties the till while held;
//      dropping it brings the stars; a day to restock; never your own.
//  20. THE TOP END    — a sixth star and the army; a tank you can take,
//      whose cannon and tracks work for you; cruisers that ram, PIT, box.
//  21. CHEATS         — the codes, typed into CHEATS on the pause
//      screen; a word that is not one does nothing.
//  22. LANDMARKS      — a club, a stadium, a film lot and a villa, solid,
//      signed, open at the gate, with nothing buried in them.
//  23. WEAR           — bumpers off at the end that took it, a sprung bonnet,
//      burst tyres that sit the car down; the paint shop mends them.
//  24. THE RADIO      — a place on the dial, a jingle and a DJ for every
//      station, talk and ads in captions and a voice; MUSIC: OFF takes them.
//  25. EXPORT         — wanted cars into the ring at the harbour crane, paid
//      and ticked off once each; wrecks turned away; a full list's bonus.
//  26. RC RACE        — the toy buggy race on the stadium pitch: start, quit
//      back to the gate, and a win that pays.
//  27. ROUTES         — the route line stops at the destination: never on to
//      the next corner and back, nor back to the one behind you first.
//  28. FIRST DAY II   — Lola comes to you to say well done after the first
//      pay, and outside the barber's to offer THREADS; no radio ads in a
//      job; a shop you own is on the house; a door mat by your parked car
//      takes you in.
//  29. PARKED         — every parked vehicle's spot is out of the traffic
//      lanes, out of the water, clear of walls and props at its level, and
//      not in front of a door.
//  30. NOBODY VANISHES — a stranger asks face to face and thanks you face to
//      face (or on the phone); then Tito rides off on his bike and leaves
//      you on foot, Ray gets out and goes in at the gate, Mrs. Albescu walks
//      off with Biscuit at her heel; a race's field drives off; an exported
//      car goes up on the hook.
//  31. ONE JOB AT A TIME — on a job, the rings and marks for the others are
//      out of the street and off the radar, and back when it is over.
//  32. FIRST IMPRESSION — every title-screen camera shot, all the way along
//      its drift, stays out of the buildings with a clear view ahead.
//  33. THE CARD ON TOP — a car bought in the showroom shows its card over the
//      shop, not behind it, and the list under it hears none of the keys.
//  34. A FULL WHEEL — you always have a bat: from the start, and after a
//      hospital visit takes the rest; a blade you carry still replaces it.
//  35. THE DEAD STAY DOWN — a stranger shot on their spot is not stood back
//      up beside the body; they are there again once you have been away.
//  14. BROADPHASE     — a non-finite lookup has to return, not spin. This
//      group runs LAST and under a timeout of its own: without the guard the
//      page does not fail, it stops answering.
var http = require('http');
var fs = require('fs');
var path = require('path');
var { chromium } = require('playwright');

var ROOT = path.join(__dirname, '..');
var MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml' };

function serve() {
  return new Promise(function (resolve) {
    var srv = http.createServer(function (req, res) {
      var p = path.normalize(path.join(ROOT, decodeURIComponent(req.url.split('?')[0])));
      if (!p.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
      if (p === ROOT || p === ROOT + path.sep) p = path.join(ROOT, 'index.html');
      fs.readFile(p, function (err, data) {
        if (err) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
        res.end(data);
      });
    });
    srv.listen(0, '127.0.0.1', function () { resolve(srv); });
  });
}

// the three overlays that halt the tick and start the title pads
var OVERLAYS = [
  { name: 'result card', key: 'share' },
  { name: 'pause', key: 'pause' },
  { name: 'map', key: 'map' }
];

// A page that hangs never rejects, so the one group that can hang gets a
// deadline in the runner rather than in the browser.
function withTimeout(p, ms) {
  var timer;
  return Promise.race([
    p.then(function (v) { clearTimeout(timer); return v; },
           function (e) { clearTimeout(timer); throw e; }),
    new Promise(function (_, reject) { timer = setTimeout(function () { reject(new Error('hung')); }, ms); })
  ]);
}

(async function () {
  var failures = [];
  function check(name, ok, detail) {
    console.log((ok ? '  PASS  ' : '  FAIL  ') + name + (detail ? '  —  ' + detail : ''));
    if (!ok) failures.push(name);
  }

  var srv = await serve();
  var origin = 'http://127.0.0.1:' + srv.address().port;
  var browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    // the autoplay flag is belt-and-braces: these checks spy on the audio
    // API rather than on real gain, so a suspended context would pass too
    args: ['--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required']
  });
  var page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  var pageErrors = [], consoleErrors = [];
  page.on('pageerror', function (e) { pageErrors.push(String(e.message).slice(0, 200)); });
  page.on('console', function (m) { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });

  // Playwright's evaluate carries a user gesture, so every overlay that hands
  // the screen back (GAME.regainPointer) really took the pointer lock here.
  // Headless grants and exits land up to a second late, and under load an
  // exit could land past the game's 1.5 s grace — which reads, correctly for
  // a player, as Esc, and pauses. The checks that drive the sim through
  // fastForward ran on regardless; the few on the real loop (the radio, the
  // shake) then measured a paused game. Nothing here is about the lock, so
  // the page never takes one.
  await page.addInitScript(function () {
    Element.prototype.requestPointerLock = function () { return Promise.resolve(); };
  });

  await page.goto(origin + '/index.html');
  await page.waitForFunction(function () {
    return window.GAME && GAME.test && GAME.city && GAME.city.nodes && GAME.city.nodes.length > 0;
  }, null, { timeout: 30000 });

  // The looping voices live on gain nodes private to the audio module, so
  // the only thing observable from out here is the API that drives them.
  // Record the calls and assert on those.
  await page.evaluate(function () {
    GAME.test.start();
    // And the weather dry: rain changes grip, sight and the crowd, and every
    // group measures what it measured before there was any. Group 5a turns it
    // on for itself.
    GAME.weather.setMode('clear', true);
    // Pin the city quiet for the whole suite. OFF is by definition the game as
    // it was before any of the chaos work, so every group below measures what
    // it always measured — and the alternative is not hypothetical: with the
    // default LIVELY the suspension group started failing one run in two
    // because a brawl or a passing officer had leaned on the car it was
    // reading springs off. The two groups that are ABOUT the knob turn it up
    // themselves and put it back.
    GAME.chaos.set(0);
    // And Lola's first-time tips off: every group below measures the pager
    // as it was before she had them. Group 5i turns them on for itself.
    if (GAME.lola) GAME.lola.setTips(false);
    // And her welcome answered: a fresh save is offered a guided first day
    // (guide.js), and her question would hold the game and take the keys
    // three seconds in. Every group below measures the game as it was
    // before she offered; group 5q asks it for itself.
    GAME.prefs.guide = 'done';
    // And the bay empty: the leisure fleet (sealife.js) puts boats out
    // wherever there is sea near you, and the groups on the water measure
    // races, swims and moorings as they were before anybody else was out
    // there. Group 5r puts them out for itself.
    GAME.settings.maxBoats = 0;
    // And the strangers with favours to ask stood down: walk past one and
    // she asks, with her question over the game, which no group above
    // expects. Group 5s brings them back for itself.
    if (GAME.strangers) GAME.strangers.enabled = false;
    // and Lola keeps her big score to herself until a group asks (heist.js)
    if (GAME.heist) GAME.heist.enabled = false;
    // And the talking-head scenes off (scenes.js): a job's first start cuts
    // away to Lola's lock-up and holds the world still while she talks, and
    // every group below starts jobs and measures them from the first tick.
    // The scenes group switches them on for itself.
    if (GAME.scenes) GAME.scenes.enabled = false;
    // And the story jobs one part each, as they were: a won race, delivery or
    // rampage went on to Rico's men, the law or a crew (missions.js ACTS),
    // and every group below measures the job ending where its part does.
    // The acts group switches them on for itself.
    GAME.missions.acts = false;
    // And the two sides' people off the corners (gangs.js): Lola's people
    // stand about the strip, where most groups below measure the street, and
    // a crowd of armed men changes every count of peds and fights. The gangs
    // group puts them back for itself.
    if (GAME.gangs) GAME.gangs.enabled = false;
    // And the chase at a polite distance, as it always was: from three stars
    // cruisers now ram, PIT and box you in (police.js tactics), and the
    // groups below measure pursuits that only ever followed. The tactics
    // group turns them on for itself.
    GAME.police.tactics = false;
    // And the cars as they were, whole whatever is done to them: a knock now
    // costs a bumper, a bonnet or a tyre (vehicles.js wear), and the groups
    // below drive, shoot at and measure cars that never lost anything.
    GAME.vehicles.wear = false;
    // And the radio's DJs quiet (dj.js): a station's jingle and the talk
    // over it are notes of their own, and the radio groups below count
    // every voice a station plays and where it lands on the beat.
    GAME.dj.enabled = false;
    GAME.test.fastForward(1);
    var a = GAME.audio;
    var engine0 = a.engineState, skid0 = a.skid, siren0 = a.siren, vol0 = a.radio.setVolume;
    window.__spy = null;
    window.__record = function () { window.__spy = { engine: [], skid: [], siren: [], radio: [], amb: [] }; };
    var amb0 = GAME.ambience.silence;
    GAME.ambience.silence = function () { if (window.__spy) window.__spy.amb.push(true); return amb0.apply(GAME.ambience, arguments); };
    a.engineState = function (on) { if (window.__spy) window.__spy.engine.push(!!on); return engine0.apply(a, arguments); };
    a.skid = function (v) { if (window.__spy) window.__spy.skid.push(v); return skid0.apply(a, arguments); };
    a.siren = function (v) { if (window.__spy) window.__spy.siren.push(v); return siren0.apply(a, arguments); };
    a.radio.setVolume = function (v) { if (window.__spy) window.__spy.radio.push(v); return vol0.apply(a.radio, arguments); };
    window.__msgs = [];
    var msg0 = GAME.hud.message;
    GAME.hud.message = function (t) { window.__msgs.push(String(t)); return msg0.apply(GAME.hud, arguments); };
    window.__overlay = function (key, open) {
      if (key === 'share') {
        if (open) GAME.share.show({ slug: 'regress', eyebrow: 'test', title: 'T', subtitle: 's', accent: '#ffffff', stats: [] });
        else GAME.share.hide();
      } else if (key === 'pause') GAME.togglePause();
      else GAME.hud.toggleMap(open);
    };
  });

  // ---------- 1: overlay audio ----------
  var driving = await page.evaluate(function () {
    var _ride = GAME.test.spawnCar('sedan', 4, 0);
    GAME.test.fastForward(0.2);
    GAME.test.enterNearestCar(_ride);
    GAME.test.fastForward(1.2);
    return GAME.player.inCar === true;
  });
  check('setup: player is driving', driving);

  for (var i = 0; i < OVERLAYS.length; i++) {
    var ov = OVERLAYS[i];
    var r = await page.evaluate(function (key) {
      window.__record();
      window.__overlay(key, true);
      var opened = window.__spy;
      window.__record();
      window.__overlay(key, false);
      return { opened: opened, closed: window.__spy };
    }, ov.key);
    check(ov.name + ': engine silenced', r.opened.engine.indexOf(false) >= 0, JSON.stringify(r.opened.engine));
    check(ov.name + ': skid silenced', r.opened.skid.indexOf(0) >= 0, JSON.stringify(r.opened.skid));
    check(ov.name + ': siren silenced', r.opened.siren.indexOf(0) >= 0, JSON.stringify(r.opened.siren));
    check(ov.name + ': radio silenced', r.opened.radio.indexOf(0) >= 0, JSON.stringify(r.opened.radio));
    check(ov.name + ': ambience silenced', r.opened.amb.length > 0, JSON.stringify(r.opened.amb));
    check(ov.name + ': radio restored on close',
      r.closed.radio.some(function (v) { return v > 0; }), JSON.stringify(r.closed.radio));
  }

  // the radio belongs to the car, not the player: it must not come back for
  // someone on foot (nor, by the same rule, over their own corpse)
  var onFoot = await page.evaluate(function () {
    GAME.test.exitCar();
    GAME.test.fastForward(0.5);
    window.__record();
    GAME.togglePause();
    GAME.togglePause();
    return { foot: !GAME.player.inCar, radio: window.__spy.radio };
  });
  check('on foot: radio stays silent through pause',
    onFoot.foot && !onFoot.radio.some(function (v) { return v > 0; }), JSON.stringify(onFoot.radio));

  // ---------- 2: edge-triggered input ----------
  var edge = await page.evaluate(function () {
    // a press is claimable once, by whoever asks first
    GAME.test.pressKey('KeyZ', true);
    var first = GAME.keyPressed('KeyZ'), second = GAME.keyPressed('KeyZ');
    GAME.test.pressKey('KeyZ', false);
    // and a press nobody claims must die with the tick it arrived in — while
    // the key is still physically DOWN, which is the case the old cache got
    // wrong: never written while nobody was asking, it read a hold nobody
    // had claimed as a brand new press the next time somebody did
    GAME.test.pressKey('KeyX', true);
    GAME.test.fastForward(0.1);
    var lingered = GAME.keyPressed('KeyX');
    GAME.test.pressKey('KeyX', false);
    return { first: first, second: second, lingered: lingered };
  });
  check('edge input: a press fires exactly once', edge.first === true && edge.second === false,
    'first=' + edge.first + ' second=' + edge.second);
  check('edge input: a held but unclaimed press does not survive its tick', edge.lingered === false);

  // The same thing through the game rather than through the API. Comma and
  // Period are asked for only while driving, so a hold that starts on foot
  // is not a car input — but the old cache had no entry for the gate being
  // shut, so the hold was read as a fresh press the moment the door closed
  // and changed station on its own.
  var radio = await page.evaluate(function () {
    var n = 0, sw = GAME.audio.radio.switchStation;
    GAME.audio.radio.switchStation = function () { n++; return sw.apply(GAME.audio.radio, arguments); };
    GAME.test.exitCar();
    GAME.test.fastForward(0.6);
    GAME.test.pressKey('Comma', true);      // held where nothing polls it
    GAME.test.fastForward(0.6);
    var onFoot = n;
    GAME.test.enterNearestCar();            // ...and still held on the way in
    GAME.test.fastForward(2.0);
    var onEntry = n;
    GAME.test.pressKey('Comma', false);     // a real press still has to work
    GAME.test.fastForward(0.1);
    GAME.test.pressKey('Comma', true);
    GAME.test.fastForward(0.1);
    var afterPress = n;
    GAME.test.pressKey('Comma', false);
    GAME.audio.radio.switchStation = sw;
    return { onFoot: onFoot, onEntry: onEntry, afterPress: afterPress, inCar: GAME.player.inCar };
  });
  check('edge input: holding a car-only key on foot changes nothing', radio.onFoot === 0, 'switches=' + radio.onFoot);
  check('edge input: and it does not fire itself off when the door closes', radio.onEntry === 0, 'switches=' + radio.onEntry);
  check('edge input: a real press in the car still switches the station',
    radio.inCar && radio.afterPress === 1, 'in car=' + radio.inCar + ' switches=' + radio.afterPress);

  // an overlay halts the tick, so nothing there would drain the buffer
  await page.evaluate(function () { GAME.togglePause(); GAME.test.pressKey('KeyC', true); });
  var drained = true;
  try {
    await page.waitForFunction(function () { return !(GAME.input.pressed || {})['KeyC']; }, null, { timeout: 5000 });
  } catch (e) { drained = false; }
  await page.evaluate(function () { GAME.test.pressKey('KeyC', false); GAME.togglePause(); });
  check('edge input: a press behind an overlay is not gameplay input', drained);

  // ---------- 3: parachute stowed when the life ends ----------
  var chute = await page.evaluate(function () {
    GAME.aircraft.startParachute(GAME.player.pos.x, GAME.player.pos.y + 60, GAME.player.pos.z, 0);
    // the canopy is the only 2.3-radius half sphere in the scene
    var mesh = null;
    GAME.scene.traverse(function (m) {
      var g = m.geometry;
      if (g && g.type === 'SphereGeometry' && g.parameters && g.parameters.radius === 2.3) mesh = m;
    });
    var gliding = GAME.player.parachuting, up = !!(mesh && mesh.visible);
    window.__msgs = [];
    GAME.playerWasted('shot');
    return {
      gliding: gliding, found: !!mesh, up: up,
      stowed: GAME.player.parachuting === false,
      hidden: !!(mesh && !mesh.visible)
    };
  });
  check('parachute: canopy opened', chute.gliding === true);
  check('parachute: found the canopy mesh (detector sanity)', chute.found);
  check('parachute: canopy IS visible while gliding (detector sanity)', chute.up);
  check('parachute: stowed the moment the life ends', chute.stowed);
  check('parachute: canopy not left hanging over the body', chute.hidden);

  // Now a REAL respawn, which is the half that catches the glide step. The
  // sim clock arms the R-to-continue gate (stateT > 0.6) and calls
  // respawnAfterScreen(); its fade callback is a 550 ms setTimeout, so only
  // wall time gets us the other side of it — fastForward never would.
  await page.evaluate(function () {
    GAME.input.keys['KeyR'] = true;
    GAME.test.fastForward(1.2);
    GAME.input.keys['KeyR'] = false;
  });
  var revived = true;
  try {
    await page.waitForFunction(function () { return GAME.player.state === 'alive'; }, null, { timeout: 10000 });
  } catch (e) { revived = false; }
  var respawn = await page.evaluate(function () {
    // give a stuck glide step every chance to run and announce itself, so
    // this catches the bug instead of racing the toast off the screen
    GAME.test.fastForward(3);
    return { parachuting: GAME.player.parachuting, msgs: window.__msgs };
  });
  check('parachute: real respawn completed', revived);
  check('parachute: still stowed after a real respawn', respawn.parachuting === false);
  check('parachute: no glide step ran at the hospital ("Feet dry.")',
    !respawn.msgs.some(function (m) { return m.indexOf('Feet dry') >= 0; }),
    JSON.stringify(respawn.msgs.slice(-3)));

  // ---------- 3b: a canopy over the sea has not landed in it ----------
  // isInWater answers for the whole column at (x, z): its y argument only
  // rules out a deck or a crossing carried over the top, and never asks how
  // high up the point is. Asked once a frame through a glide, that soaked you
  // on the FIRST frame after stepping out over the bay — sixty metres up, with
  // the beach still well inside the canopy's reach.
  var sea = await page.evaluate(function () {
    var P = GAME.player, r = {};
    GAME.police.clearWanted();
    P.health = 100;
    if (P.inCar) GAME.exitCar();
    // open sea, no pier, nothing built over it
    var wx = null, wz = null;
    for (var x = 380; x <= 900 && wx === null; x += 8) {
      for (var z = -240; z <= 240; z += 24) {
        if (GAME.city.isInWater(x, z) && !GAME.city.isOnPier(x, z)) { wx = x; wz = z; break; }
      }
    }
    r.found = wx !== null;
    if (!r.found) return r;
    r.at = [wx, wz];
    r.seaLevel = GAME.city.surfaceY(wx, wz);

    window.__msgs = [];
    GAME.aircraft.startParachute(wx, 60, wz, 0);
    r.opened = !!P.parachuting;
    // two seconds of glide, high over open water
    GAME.test.fastForward(2);
    r.aloft = { para: !!P.parachuting, y: Math.round(P.pos.y), wet: !!(P.drowning || P.swimming) };
    // then all the way down onto it
    for (var i = 0; i < 60 * 25 && P.parachuting; i++) GAME.test.fastForward(1 / 60);
    r.down = { para: !!P.parachuting, y: Math.round(P.pos.y), wet: !!(P.drowning || P.swimming), swimming: !!P.swimming, drowning: !!P.drowning };
    r.msgs = window.__msgs.slice();
    return r;
  });
  check('parachute: there is open sea to glide over, at sea level (anchor sanity)',
    sea.found === true && sea.seaLevel <= 0.05 && sea.opened === true,
    'at=' + JSON.stringify(sea.at) + ' level=' + sea.seaLevel + ' opened=' + sea.opened);
  check('parachute: gliding OVER the sea is not being in it',
    sea.aloft && sea.aloft.para === true && sea.aloft.wet === false && sea.aloft.y > 40,
    'after 2s: ' + JSON.stringify(sea.aloft));
  check('parachute: but coming all the way down onto it still is',
    sea.down && sea.down.para === false && sea.down.wet === true,
    'at the end: ' + JSON.stringify(sea.down));
  check('parachute: and it never claimed feet dry over open water',
    !(sea.msgs || []).some(function (m) { return m.indexOf('Feet dry') >= 0; }),
    JSON.stringify((sea.msgs || []).slice(-3)));

  // The sea is not a fade back to the beach any more: you come down in it
  // and swim, at the surface, alive.
  var ashore = await page.evaluate(function () {
    var P = GAME.player, C = GAME.city;
    GAME.test.fastForward(0.5);
    return { swimming: !!P.swimming, drowning: !!P.drowning, state: P.state,
             depth: +(C.seaY(P.pos.x, P.pos.z) - P.pos.y).toFixed(2),
             soaked: window.__msgs.some(function (m) { return m.indexOf('soaked') >= 0; }) };
  });
  check('parachute: and the canopy leaves you swimming at the surface, not washed up on the beach',
    sea.down && sea.down.swimming === true && sea.down.drowning === false &&
    ashore.swimming === true && ashore.state === 'alive' && ashore.soaked === false &&
    ashore.depth > 0.3 && ashore.depth < 1.6,
    'down=' + JSON.stringify(sea.down) + ' after=' + JSON.stringify(ashore));

  // ---------- 3v: what goes into the sea goes under ----------
  // A sinking car used to be removed only if nobody was driving it, on a
  // wall-clock timer, and the player's own was left to the drown fade — which
  // takes the driver out of the seat and nothing else. Still flagged as
  // sinking, the car never asked again: it carried on under the last throttle,
  // skimmed out across the water and stopped on the surface for good. Bail out
  // on the sand as the wheels reached the water and it was still yours on the
  // tick it got there, so the same. The beach near z = -60 runs straight from
  // the sand into open sea, with no pier in the way — but the beach palms are
  // solid trunks now, so take the nearest lane with nothing standing in it.
  var intoSea = await page.evaluate(function () {
    var P = GAME.player, C = GAME.city, r = {};
    GAME.police.clearWanted();
    P.health = 100;
    if (P.inCar) GAME.exitCar();
    window.__beachZ = function () {
      for (var k = 0; k < 20; k++) {
        var z = -60 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 2, sh = C.shoreline(z), ok = true;
        for (var x = sh - 50; x < sh + 6 && ok; x += 1) {
          ok = !C.hash.query(x, z, 2.2).some(function (b) { return b.h > 0.4 && b.minY === undefined; });
        }
        if (ok) return z;
      }
      return -60;
    };
    var z = window.__beachZ(), sh = C.shoreline(z);
    GAME.test.teleport(sh - 50, z);
    GAME.test.fastForward(0.2);
    var car = GAME.vehicles.spawnCar('sedan', sh - 46, z, Math.PI / 2, {});
    GAME.test.fastForward(0.1);
    GAME.test.enterNearestCar(car);
    GAME.test.fastForward(1.2);
    r.driving = P.inCar && P.car === car;
    GAME.test.pressKey('KeyW', true);
    // foot down, straight off the beach — and keep it down: what the old code
    // did with that throttle once the car was in is the bug
    var surfaceRun = 0;
    for (var i = 0; i < 60 * 8; i++) {
      GAME.test.fastForward(1 / 60);
      if (car.sinking && car.pos.y > -0.3) surfaceRun = Math.max(surfaceRun, car.pos.x - sh);
    }
    r.sinking = car.sinking;
    r.surfaceRun = Math.round(surfaceRun);
    r.swimming = !!P.swimming;
    r.inCar = P.inCar;
    r.drowning = !!P.drowning;
    window.__seaCar = car;
    return r;
  });
  check('sea: the car went off the beach into the water (anchor sanity)',
    intoSea.driving === true && intoSea.sinking === true, JSON.stringify(intoSea));
  check('sea: the water takes the way off it — it does not skim on across the top',
    intoSea.surfaceRun < 15, 'still on the surface ' + intoSea.surfaceRun + ' m past the waterline');
  check('sea: and the driver gets out and swims for it — no fade back to the beach',
    intoSea.inCar === false && intoSea.swimming === true && intoSea.drowning === false, JSON.stringify(intoSea));
  var seaAfter = await page.evaluate(function () {
    var P = GAME.player, car = window.__seaCar;
    GAME.test.pressKey('KeyW', false);
    GAME.test.fastForward(5);
    return { swimming: !!P.swimming, inCar: P.inCar, gone: car.gone === true, y: +car.pos.y.toFixed(2) };
  });
  check('sea: and the car they drove in goes under and is gone, not left on the surface',
    seaAfter.gone && seaAfter.y < -1 && seaAfter.swimming === true, JSON.stringify(seaAfter));

  // bailing out on the sand, short of the water, with the car still rolling
  var bail = await page.evaluate(function () {
    var P = GAME.player, C = GAME.city, r = {};
    var z = window.__beachZ(), sh = C.shoreline(z);
    GAME.test.teleport(sh - 50, z);
    GAME.test.fastForward(0.2);
    var car = GAME.vehicles.spawnCar('sedan', sh - 46, z, Math.PI / 2, {});
    GAME.test.fastForward(0.1);
    GAME.test.enterNearestCar(car);
    GAME.test.fastForward(1.2);
    GAME.test.pressKey('KeyW', true);
    for (var i = 0; i < 60 * 8 && P.inCar; i++) {
      GAME.test.fastForward(1 / 60);
      if (car.pos.x > sh - 12) { GAME.test.pressKey('KeyW', false); GAME.test.exitCar(); }
    }
    r.bailed = !P.inCar && !P.drowning;
    var lowest = car.pos.y, t = 0;
    for (; t < 8 && !car.gone; t += 1 / 60) {
      GAME.test.fastForward(1 / 60);
      if (!car.gone) lowest = Math.min(lowest, car.pos.y);
    }
    r.sank = car.sinking;
    r.gone = car.gone === true;
    r.t = +t.toFixed(1);
    r.lowest = +lowest.toFixed(2);
    r.dry = !P.drowning;
    return r;
  });
  check('sea: a car left rolling at the waterline runs in (anchor sanity)',
    bail.bailed === true && bail.sank === true && bail.dry === true, JSON.stringify(bail));
  check('sea: and it goes under before it goes, inside a few seconds',
    bail.gone && bail.lowest < -1 && bail.t < 6, JSON.stringify(bail));

  // An empty helicopter settling on the sea — the one you stepped out of under
  // a canopy — and one coming down hard enough to go up: neither stays on top.
  var heliSea = await page.evaluate(function () {
    var r = {};
    var wx = null, wz = null;
    for (var x = 480; x <= 900 && wx === null; x += 8) {
      for (var z = -240; z <= 240; z += 24) {
        if (GAME.city.isInWater(x, z) && !GAME.city.isOnPier(x, z)) { wx = x; wz = z; break; }
      }
    }
    r.found = wx !== null;
    if (!r.found) return r;
    GAME.test.teleport(wx - 140, wz);
    var soft = GAME.vehicles.spawnCar('helicopter', wx, wz, 0, {});
    soft.pos.y = 1;
    var hard = GAME.vehicles.spawnCar('helicopter', wx, wz + 30, 0, {});
    hard.pos.y = 30;
    GAME.test.fastForward(8);
    r.soft = { gone: soft.gone === true, dead: soft.dead, y: +soft.pos.y.toFixed(2) };
    r.hard = { gone: hard.gone === true, dead: hard.dead, y: +hard.pos.y.toFixed(2) };
    return r;
  });
  check('sea: an empty helicopter settling on the water goes under',
    heliSea.found && heliSea.soft.gone && !heliSea.soft.dead, JSON.stringify(heliSea));
  check('sea: and a wreck that came down on it hard does not float there either',
    heliSea.found && heliSea.hard.gone && heliSea.hard.dead, JSON.stringify(heliSea));

  // ---------- 3w: a booster pushes on its deck and nowhere else ----------
  // A booster strip only ever raised what the throttle COULD do, so with the
  // pedal up on the deck it did nothing; and its 1.4 s window outlived the
  // flight off the shorter ramps, so it fired into the road on touchdown —
  // nine times the car's acceleration, then the whole excess clamped away in
  // one frame when it ran out. The capped chain launcher had the opposite
  // fault: the car's own top speed clamped its pace back every frame, so only
  // a car that could already do the cap on the flat ever reached the roof.
  var boost = await page.evaluate(function () {
    var C = GAME.city, P = GAME.player, S = GAME.settings, r = {};
    GAME.police.clearWanted();
    P.health = 100;
    // These read speeds a tick apart, so a car that meets traffic in the air
    // or on landing reads as the booster misbehaving (84 -> 68 m/s in one
    // tick, once in a dozen runs). Nobody else on the road for this.
    var keep = { t: S.maxTraffic, p: S.maxParked };
    S.maxTraffic = 0; S.maxParked = 0;
    // Up to the lip from a standing approach and on until the wheels are back
    // down; `lift` takes the foot off for as long as the car is on the deck.
    function run(ramp, type, lift, after) {
      if (P.inCar) GAME.exitCar();
      var ux = Math.sin(ramp.rot), uz = Math.cos(ramp.rot);
      var back = ramp.cap ? 18 : 30;
      var sx = ramp.x - ux * (ramp.len / 2 + back), sz = ramp.z - uz * (ramp.len / 2 + back);
      var o = { reached: false };
      // one of the coastal ramps has its run-up out over the water this far
      // back: standing there is a swim, so it sits this out
      if (C.isInWater(sx, sz) || C.isInWater(sx - uz * 4, sz + ux * 4)) return o;
      GAME.test.teleport(sx - uz * 4, sz + ux * 4);
      GAME.world.cars.slice().forEach(function (c) {
        if (U.dist2(c.pos.x, c.pos.z, ramp.x, ramp.z) < 250 * 250) GAME.vehicles.removeCar(c);
      });
      var car = GAME.vehicles.spawnCar(type, sx, sz, ramp.rot, {});
      if (ramp.base) { car.pos.y = ramp.base; P.pos.y = ramp.base; }
      GAME.test.enterNearestCar(car);
      GAME.test.fastForward(0.7);
      if (!P.inCar) { GAME.vehicles.removeCar(car); return o; }
      car.speed = car.spec.maxSpeed * 0.8;
      var wasDeck = false, t = 0, landT = -1;
      for (var i = 0; i < 60 * 8; i++) {
        var deck = car.onRampIdx === ramp.idx && !(car.air > 0.05);
        GAME.test.pressKey('KeyW', !(lift && deck));
        GAME.test.fastForward(1 / 60); t += 1 / 60;
        if (deck) { o.reached = true; wasDeck = true; }
        // Never on to the sea. A car knocked off line short of a deck near
        // the coast drove on, foot down, and into the water — and the drown
        // fade that starts runs on a real timer, so it washed the player
        // ashore in the middle of whichever group came next. Give up on a
        // deck that has not been reached in a few seconds, and stop the
        // moment anything starts to sink (before the splash, which is where
        // the drown begins).
        if (car.sinking || (!wasDeck && t > 4)) break;
        if (wasDeck && o.lip === undefined && car.air > 0) o.lip = Math.hypot(car.airVX, car.airVZ);
        if (o.lip !== undefined && landT < 0 && !(car.air > 0)) {
          landT = t; o.land = car.speed; o.boostAtLand = car.boostT; o.landY = car.pos.y; o.maxSp = car.spec.maxSpeed;
          GAME.test.fastForward(1 / 60); t += 1 / 60;
          o.nextTick = car.speed; o.peak = car.speed;
        }
        if (landT >= 0) {
          o.peak = Math.max(o.peak, car.speed);
          if (t - landT > (after || 1)) break;
        }
      }
      GAME.test.pressKey('KeyW', false);
      o.endY = car.pos.y;
      GAME.exitCar();
      GAME.vehicles.removeCar(car);
      return o;
    }
    var street = C.ramps.filter(function (q) { return q.boost && !q.cap && !q.base; });
    r.boosters = street.length;
    // the pedal, on one of them
    var held = run(street[0], 'sedan', false), lifted = run(street[0], 'sedan', true);
    r.pedal = { reached: held.reached && lifted.reached, held: held.lip, lifted: lifted.lip };
    // touchdown, on every one of them
    r.landings = street.map(function (q) {
      var o = run(q, 'sedan', false);
      return { idx: q.idx, reached: o.reached, lip: o.lip, land: o.land, boostAtLand: o.boostAtLand,
               rise: o.peak - Math.max(o.land, o.maxSp) };
    });
    // and the one tick after it, on a car the boost takes well past its own top
    var sp = run(street[0], 'sports', false);
    r.snap = { land: sp.land, next: sp.nextTick, maxSp: sp.maxSp };
    // the chain launcher, in cars slower than its cap
    var launcher = C.ramps.filter(function (q) { return q.cap && !q.base; })[0];
    var roof = C.ramps.filter(function (q) { return q.cap && q.base; })[0];
    r.chain = launcher && roof ? ['sedan', 'van'].map(function (type) {
      var o = run(launcher, type, false, 0.5);
      return { type: type, reached: o.reached, cap: launcher.cap, lip: o.lip, landY: o.landY, roofY: roof.base };
    }) : null;
    r.drowning = !!P.drowning;
    P.health = 100;
    S.maxTraffic = keep.t; S.maxParked = keep.p;
    return r;
  });
  check('booster: and no run ended in the sea with a drown pending (anchor sanity)',
    boost.drowning === false, 'drowning=' + boost.drowning);
  check('booster: there are street boosters, and the car gets up them (anchor sanity)',
    boost.boosters >= 3 && boost.pedal.reached && boost.landings.filter(function (l) { return l.reached; }).length >= 3,
    'boosters=' + boost.boosters + ' reached=' + boost.landings.filter(function (l) { return l.reached; }).length);
  check('booster: it pushes whether or not your foot is down on the deck',
    boost.pedal.lifted >= boost.pedal.held * 0.95,
    'off the lip: pedal held ' + (boost.pedal.held || 0).toFixed(1) + ' m/s, lifted ' + (boost.pedal.lifted || 0).toFixed(1));
  check('booster: nothing of the push is left when the wheels come back down',
    boost.landings.every(function (l) { return !l.reached || l.boostAtLand === 0; }),
    JSON.stringify(boost.landings.map(function (l) { return [l.idx, +(l.boostAtLand || 0).toFixed(2)]; })));
  check('booster: so the road does not shove the car on after landing',
    boost.landings.every(function (l) { return !l.reached || l.rise <= 0.5; }),
    JSON.stringify(boost.landings.map(function (l) { return [l.idx, +(l.rise || 0).toFixed(1)]; })));
  check('booster: and the speed it handed over comes off smoothly, not in one frame',
    boost.snap.land > boost.snap.maxSp * 1.3 && boost.snap.next > boost.snap.land * 0.9,
    'touchdown ' + (boost.snap.land || 0).toFixed(1) + ' -> next tick ' + (boost.snap.next || 0).toFixed(1) +
    ' m/s (top speed ' + boost.snap.maxSp + ')');
  check('booster: the chain launcher and its rooftop are there (anchor sanity)',
    !!boost.chain && boost.chain.every(function (c) { return c.reached; }), JSON.stringify(boost.chain));
  check('booster: the chain launcher gets a car slower than its cap up to it',
    !!boost.chain && boost.chain.every(function (c) { return c.lip >= c.cap - 0.5; }),
    JSON.stringify((boost.chain || []).map(function (c) { return c.type + ' ' + (c.lip || 0).toFixed(1) + '/' + c.cap; })));
  check('booster: and onto the roof it was aimed at',
    !!boost.chain && boost.chain.every(function (c) { return Math.abs(c.landY - c.roofY) < 0.5; }),
    JSON.stringify((boost.chain || []).map(function (c) { return c.type + ' landed y=' + (c.landY || 0).toFixed(1) + ' roof=' + c.roofY.toFixed(1); })));

  // The chain's rooftop ramp is a metered drop, not a booster: it sets the
  // pace the drop leaves at (any faster and it lands against the next block),
  // which is slower than nearly anything drives. It used to dress as a booster
  // — the ping, the shake, the paint — and then snap the car down to that pace
  // on its first tick of deck.
  var drop = await page.evaluate(function () {
    var C = GAME.city, P = GAME.player;
    var roof = C.ramps.filter(function (q) { return q.cap && q.base; })[0];
    if (!roof) return { found: false };
    if (P.inCar) GAME.exitCar();
    var ux = Math.sin(roof.rot), uz = Math.cos(roof.rot);
    var sx = roof.x - ux * (roof.len / 2 + 14), sz = roof.z - uz * (roof.len / 2 + 14);
    GAME.test.teleport(sx - uz * 4, sz + ux * 4);
    var car = GAME.vehicles.spawnCar('sports', sx, sz, roof.rot, {});
    car.pos.y = roof.base; P.pos.y = roof.base;
    GAME.test.enterNearestCar(car);
    GAME.test.fastForward(0.7);
    var r = { found: true, boost: roof.boost, cap: roof.cap, aboard: P.inCar };
    car.speed = car.spec.maxSpeed;
    r.entry = car.speed;
    var pings = 0, pk0 = GAME.audio.pickup;
    GAME.audio.pickup = function () { pings++; return pk0.apply(GAME.audio, arguments); };
    GAME.test.pressKey('KeyW', true);
    var onDeck = false, maxStep = 0, lip = null, landY = null;
    for (var i = 0; i < 400; i++) {
      var before = car.speed;
      GAME.test.fastForward(1 / 60);
      if (car.onRampIdx === roof.idx && !(car.air > 0.05)) { onDeck = true; maxStep = Math.max(maxStep, before - car.speed); }
      if (onDeck && lip === null && car.air > 0) lip = Math.hypot(car.airVX, car.airVZ);
      if (lip !== null && !(car.air > 0)) { landY = car.pos.y; break; }
    }
    GAME.test.pressKey('KeyW', false);
    GAME.audio.pickup = pk0;
    r.onDeck = onDeck; r.pings = pings; r.maxStep = maxStep; r.lip = lip; r.landY = landY;
    r.street = landY === null ? null : C.groundY(car.pos.x, car.pos.z, 0);
    GAME.exitCar();
    GAME.vehicles.removeCar(car);
    P.health = 100;
    return r;
  });
  check('drop: a sports car rides onto the rooftop ramp at full pace (anchor sanity)',
    drop.found && drop.aboard && drop.onDeck && drop.entry > drop.cap + 10, JSON.stringify(drop));
  check('drop: the rooftop ramp is not dressed as a booster, and does not ping as one',
    drop.found && !drop.boost && drop.pings === 0, 'boost=' + drop.boost + ' pings=' + drop.pings);
  check('drop: it brings the car to its pace over the deck, not on the first tick',
    drop.found && drop.maxStep < 3, 'largest drop in one tick ' + (drop.maxStep || 0).toFixed(2) + ' m/s');
  check('drop: and still sends it off the lip at that pace, down onto the street',
    drop.found && drop.lip >= drop.cap - 0.5 && drop.lip <= drop.cap + 1.5 && drop.landY !== null &&
    Math.abs(drop.landY - drop.street) < 0.3,
    'lip ' + (drop.lip || 0).toFixed(1) + ' m/s (pace ' + drop.cap + '), landed y=' + drop.landY + ' street=' + drop.street);

  // ---------- 3x: out of a car, at the car's level ----------
  // Getting out put you at the street's height under wherever you stepped out:
  // out of a car in mid-air off a lip you were simply on the ground, and out
  // of one parked on a roof the collider then shoved you out of the
  // building's footprint and down to the pavement.
  var outAir = await page.evaluate(function () {
    var C = GAME.city, P = GAME.player, r = {};
    P.health = 100;
    if (P.inCar) GAME.exitCar();
    var launcher = C.ramps.filter(function (q) { return q.cap && !q.base; })[0];
    var roof = C.ramps.filter(function (q) { return q.cap && q.base; })[0];
    if (!launcher || !roof) return { found: false };
    r.found = true;
    function board(x, z, h, y) {
      if (P.inCar) GAME.exitCar();
      GAME.test.teleport(x - Math.cos(h) * 4, z + Math.sin(h) * 4);
      var car = GAME.vehicles.spawnCar('sedan', x, z, h, {});
      if (y !== undefined) { car.pos.y = y; P.pos.y = y; }
      GAME.test.enterNearestCar(car);
      GAME.test.fastForward(0.7);
      return car;
    }
    // off the launcher, out at the top of the climb
    var ux = Math.sin(launcher.rot), uz = Math.cos(launcher.rot);
    var car = board(launcher.x - ux * (launcher.len / 2 + 18), launcher.z - uz * (launcher.len / 2 + 18), launcher.rot);
    car.speed = 24;
    GAME.test.pressKey('KeyW', true);
    for (var i = 0; i < 600 && !(car.air > 0.2); i++) GAME.test.fastForward(1 / 60);
    GAME.test.pressKey('KeyW', false);
    r.carY = car.pos.y;
    GAME.test.exitCar();
    r.outY = P.pos.y;
    var t = 0, falling = 0;
    for (; t < 4; t += 1 / 60) {
      GAME.test.fastForward(1 / 60);
      if (P.airborne) falling += 1 / 60;
      else if (t > 0.1) break;
    }
    r.fell = falling;
    r.endY = P.pos.y;
    r.ground = C.surfaceY(P.pos.x, P.pos.z, P.pos.y);
    GAME.vehicles.removeCar(car);
    P.health = 100;
    // parked on the chain's roof, short of its second ramp
    var u1x = Math.sin(roof.rot), u1z = Math.cos(roof.rot);
    car = board(roof.x - u1x * (roof.len / 2 + 14), roof.z - u1z * (roof.len / 2 + 14), roof.rot, roof.base);
    GAME.test.fastForward(0.3);
    r.roofCarY = car.pos.y;
    GAME.test.exitCar();
    GAME.test.fastForward(0.5);
    r.roofOutY = P.pos.y;
    r.roofY = roof.base;
    GAME.vehicles.removeCar(car);
    // and back down to the street for whoever is next
    GAME.test.teleport(launcher.x - ux * (launcher.len / 2 + 22), launcher.z - uz * (launcher.len / 2 + 22));
    P.health = 100;
    return r;
  });
  check('exit: the car was up in the air when they got out (anchor sanity)',
    outAir.found && outAir.carY > 5, JSON.stringify(outAir));
  check('exit: out in mid-air, they are in the air beside it — not on the street',
    outAir.found && Math.abs(outAir.outY - outAir.carY) < 0.5,
    'car at y=' + (outAir.carY || 0).toFixed(1) + ', stepped out at y=' + (outAir.outY || 0).toFixed(1));
  check('exit: and fall from there, all the way to the ground',
    outAir.found && outAir.fell > 0.8 && Math.abs(outAir.endY - outAir.ground) < 0.1,
    'fell ' + (outAir.fell || 0).toFixed(2) + ' s to y=' + (outAir.endY || 0).toFixed(1));
  check('exit: out of a car parked on a roof, they stay on the roof',
    outAir.found && Math.abs(outAir.roofCarY - outAir.roofY) < 0.3 && Math.abs(outAir.roofOutY - outAir.roofY) < 0.3,
    'car y=' + (outAir.roofCarY || 0).toFixed(1) + ' player y=' + (outAir.roofOutY || 0).toFixed(1) + ' roof=' + (outAir.roofY || 0).toFixed(1));

  // ---------- 3y: the player-facing audit ----------
  // A pass over the game as a player meets it, each of these something that
  // happened to somebody playing rather than a corner of the code: a car that
  // could not hurt you, a car that put you on a roof, a mission you drove
  // through, traffic jammed behind a parked car, a laptop with a touchscreen
  // losing its mouse, a helicopter that could not hover, cover that only
  // worked for the police, a camera inside the wall, a fall that did nothing,
  // and a handful of smaller ones.

  // a tall building with open street along its south face, for the wall checks
  var wallSpot = function () {
    var all = GAME.city.hash.all, best = null;
    for (var i = 0; i < all.length && !best; i++) {
      var b = all[i];
      if (b.tag !== 'building' || !(b.h > 15) || b.minY !== undefined) continue;
      if (b.maxX - b.minX < 12 || b.maxZ - b.minZ < 12) continue;
      var cx = (b.minX + b.maxX) / 2;
      if (GAME.city.hash.segmentClear(cx - 5, b.minZ - 0.6, cx - 5, b.minZ - 12) &&
        GAME.city.hash.segmentClear(cx + 5, b.minZ - 0.6, cx + 5, b.minZ - 12) &&
        !GAME.city.isInWater(cx, b.minZ - 6)) best = b;
    }
    return best;
  };

  var foot = await page.evaluate(function (wallSrc) {
    var wallSpot = new Function('return (' + wallSrc + ')')();
    var P = GAME.player, r = {};
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    P.health = 100; P.armor = 0;
    // run over: a sedan at 15 m/s, straight at someone standing on the strip
    GAME.test.teleport(356, 60);
    GAME.test.fastForward(0.3);
    var car = GAME.vehicles.spawnCar('sedan', 356, 40, 0, {});
    car.speed = 15;
    var h0 = P.health;
    for (var i = 0; i < 150 && P.health === h0; i++) GAME.test.fastForward(1 / 60);
    r.runOver = h0 - P.health;
    GAME.vehicles.removeCar(car);
    P.health = 100;
    // and getting out of your own car at speed is not being run over by it
    var own = GAME.vehicles.spawnCar('sedan', 356, 24, 0, {});
    GAME.test.teleport(352, 24);
    GAME.test.fastForward(0.2);
    GAME.test.enterNearestCar(own);
    GAME.test.fastForward(0.8);
    own.speed = 25;
    GAME.test.fastForward(0.2);
    GAME.test.exitCar();
    GAME.test.fastForward(0.5);
    r.bailHurt = 100 - P.health;
    GAME.vehicles.removeCar(own);
    P.health = 100;

    var b = wallSpot();
    r.wall = !!b;
    if (b) {
      var bx = (b.minX + b.maxX) / 2;
      r.roofH = b.h;
      // parked flank-on to the wall, and out of the wall side
      var hug = GAME.vehicles.spawnCar('sedan', bx + 3, b.minZ - 0.95 - 0.15, Math.PI / 2, {});
      GAME.test.teleport(bx + 3, b.minZ - 6);
      GAME.test.fastForward(0.2);
      GAME.test.enterNearestCar(hug);
      GAME.test.fastForward(1.0);
      r.hugIn = P.inCar;
      GAME.test.exitCar();
      var top = 0;
      for (var s2 = 0; s2 < 30; s2++) { GAME.test.fastForward(1 / 60); top = Math.max(top, P.pos.y); }
      r.exitTop = top;
      GAME.vehicles.removeCar(hug);
      // pinned against the wall by a car rolling in
      GAME.test.teleport(bx - 3, b.minZ - 0.5);
      GAME.test.fastForward(0.2);
      var roll = GAME.vehicles.spawnCar('sedan', bx - 3, b.minZ - 6, 0, {});
      top = 0;
      for (var s3 = 0; s3 < 80; s3++) {
        roll.pos.z += 0.05;
        GAME.test.fastForward(1 / 60);
        top = Math.max(top, P.pos.y);
        if (roll.pos.z > b.minZ - 1.2) break;
      }
      r.pinTop = top;
      GAME.vehicles.removeCar(roll);
      // the camera with your back to the wall, all the way round
      GAME.test.teleport(bx, b.minZ - 0.5);
      GAME.test.fastForward(0.3);
      var inside = 0, near = 0, all = GAME.city.hash.all;
      for (var yi = 0; yi < 16; yi++) {
        GAME.cam.yaw = yi / 16 * Math.PI * 2 - Math.PI;
        GAME.cam.pitch = 0.32;
        GAME.test.fastForward(0.3);
        var cp = GAME.cameraObj.position;
        for (var k = 0; k < all.length; k++) {
          var q = all[k];
          if (q.noLOS || q.h === undefined) continue;
          if (cp.x > q.minX && cp.x < q.maxX && cp.z > q.minZ && cp.z < q.maxZ && cp.y < q.h &&
            (q.minY === undefined || cp.y > q.minY)) { inside++; break; }
        }
        var hx = cp.x - P.pos.x, hy = cp.y - (P.pos.y + 1.55), hz = cp.z - P.pos.z;
        if (Math.sqrt(hx * hx + hy * hy + hz * hz) < 1.0) near++;
      }
      r.camInside = inside; r.camInHead = near;
    }
    // a fall whose last airborne step ends inside the on-your-feet margin
    GAME.test.teleport(356, 60);
    GAME.test.fastForward(0.3);
    P.health = 100;
    var surf = GAME.city.surfaceY(P.pos.x, P.pos.z, P.pos.y);
    // (22 m/s: a fall that hurts badly but not one of the ones that kill now)
    P.pos.y = surf + 0.04; P.velY = -22; P.airborne = false;
    GAME.test.fastForward(1 / 60);
    r.fallHurt = 100 - P.health;
    P.health = 100;
    GAME.test.fastForward(0.3);
    r.alive = P.state === 'alive';
    return r;
  }, wallSpot.toString());
  check('audit: a car at speed hurts you on foot',
    foot.runOver > 5, 'took ' + (foot.runOver || 0).toFixed(1) + ' hp from a sedan at 15 m/s');
  check('audit: and getting out of your own car at speed is not being run over by it',
    foot.bailHurt < 1, 'took ' + (foot.bailHurt || 0).toFixed(1) + ' hp bailing out at 25 m/s');
  check('audit: there is a tall building with open street in front of it (anchor sanity)',
    foot.wall === true && foot.hugIn === true, JSON.stringify({ wall: foot.wall, in: foot.hugIn, h: foot.roofH }));
  check('audit: out of a car parked against a wall, you stay in the street',
    foot.exitTop < 1, 'highest point ' + (foot.exitTop || 0).toFixed(1) + ' m (roof at ' + (foot.roofH || 0).toFixed(1) + ')');
  check('audit: and pinned against one by a car, you are not lifted onto the roof',
    foot.pinTop < 1, 'highest point ' + (foot.pinTop || 0).toFixed(1) + ' m');
  check('audit: back to the wall, the camera is never inside the building',
    foot.camInside === 0, foot.camInside + ' of 16 angles inside');
  check('audit: nor inside your own head',
    foot.camInHead === 0, foot.camInHead + ' of 16 angles within 1 m of the head');
  check('audit: a fall that ends inside the on-your-feet margin still lands',
    foot.fallHurt > 50, 'took ' + (foot.fallHurt || 0).toFixed(1) + ' hp coming down at 22 m/s');
  check('audit: and the group leaves the player alive (anchor sanity)', foot.alive === true);

  // A mission marker is a place you pull up at, not a tripwire, and the one
  // that just ended waits for you to leave before it starts again.
  var marker = await page.evaluate(function () {
    var P = GAME.player, r = {};
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    if (GAME.missions.active) GAME.missions.failActive('test');
    P.health = 100;
    var def = GAME.missions.DEFS.filter(function (d) { return d.id === 'race0'; })[0];
    GAME.test.teleport(def.start.x, def.start.z - 40);
    GAME.test.fastForward(0.5);
    var ride = GAME.test.spawnCar('sedan', 4, 0);
    GAME.test.fastForward(0.3);
    GAME.test.enterNearestCar(ride);
    GAME.test.fastForward(1.2);
    r.driving = P.inCar;
    // through it at 22 m/s
    GAME.test.teleport(def.start.x, def.start.z);
    P.car.speed = 22;
    GAME.test.fastForward(0.4);
    r.throughStarted = !!GAME.missions.active;
    if (GAME.missions.active) GAME.missions.failActive('test');
    // pulled up in it
    GAME.test.teleport(def.start.x + 30, def.start.z);
    GAME.test.fastForward(0.3);
    GAME.test.teleport(def.start.x, def.start.z);
    GAME.test.fastForward(0.5);
    r.stoppedStarted = !!(GAME.missions.active && GAME.missions.active.def.id === 'race0');
    // fail it where you stand
    if (GAME.missions.active) GAME.missions.failActive('test');
    GAME.test.teleport(def.start.x, def.start.z);
    GAME.test.fastForward(1.5);
    r.restartedInPlace = !!GAME.missions.active;
    if (GAME.missions.active) GAME.missions.failActive('test');
    // leave, come back, pull up
    GAME.test.teleport(def.start.x + 30, def.start.z);
    GAME.test.fastForward(0.3);
    GAME.test.teleport(def.start.x, def.start.z);
    GAME.test.fastForward(0.5);
    r.again = !!GAME.missions.active;
    if (GAME.missions.active) GAME.missions.failActive('test');
    GAME.test.teleport(def.start.x + 30, def.start.z);
    GAME.test.fastForward(0.3);
    GAME.exitCar();
    GAME.vehicles.removeCar(ride);
    GAME.test.fastForward(0.3);
    r.clean = !GAME.missions.active && !P.inCar;
    return r;
  });
  check('audit: driving a car to race0 (anchor sanity)', marker.driving === true);
  check('audit: driving through a race start at speed does not start the race',
    marker.throughStarted === false, 'started=' + marker.throughStarted);
  check('audit: pulling up in the ring does (anchor sanity)', marker.stoppedStarted === true);
  check('audit: failing it on its own start line does not start it again',
    marker.restartedInPlace === false, 'restarted=' + marker.restartedInPlace);
  check('audit: leave the ring and come back, and it starts again',
    marker.again === true && marker.clean === true, JSON.stringify(marker));

  // Traffic gets past a car parked at the kerb, and a fresh driver does not
  // U-turn back to a junction behind it.
  var traffic = await page.evaluate(function () {
    var C = GAME.city, P = GAME.player, S = GAME.settings, r = {};
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    var keep = { t: S.maxTraffic, p: S.maxParked };
    S.maxTraffic = 0; S.maxParked = 0;
    // a straight block of mainland road along z, clear in its +z lane
    var R = [-250, -150, -50, 50, 150, 250], spot = null;
    for (var i = 0; i < R.length && !spot; i++) {
      for (var j = 0; j < R.length - 1 && !spot; j++) {
        var x = R[i], z0 = R[j] + 12, z1 = R[j] + 88;
        if (C.isInWater(x, z0) || C.isInWater(x, z1)) continue;
        if (C.hash.segmentClear(x + 3.1, z0, x + 3.1, z1) && C.hash.segmentClear(x + 5.3, z0 + 10, x + 5.3, z0 + 40)) spot = { x: x, z: R[j] };
      }
    }
    r.found = !!spot;
    if (!spot) { S.maxTraffic = keep.t; S.maxParked = keep.p; return r; }
    function clearNear() {
      GAME.world.cars.slice().forEach(function (c) {
        if (U.dist2(c.pos.x, c.pos.z, spot.x, spot.z + 50) < 120 * 120) GAME.vehicles.removeCar(c);
      });
    }
    GAME.test.teleport(spot.x - 30, spot.z + 40);
    GAME.test.fastForward(0.3);
    clearNear();
    var parked = GAME.vehicles.spawnCar('sedan', spot.x + 5.3, spot.z + 40, 0, { ai: { mode: 'parked' } });
    var driver = GAME.vehicles.spawnCar('sedan', spot.x + 3.1, spot.z + 14, 0,
      { occupied: 'ai', ai: { mode: 'traffic', desired: 11, laneX: 0, laneZ: 0 } });
    var hp0 = driver.hp, t = 0, passed = false;
    for (; t < 15 && !passed; t += 1 / 60) {
      GAME.test.fastForward(1 / 60);
      if (driver.pos.z > parked.pos.z + 6) passed = true;
    }
    r.passed = passed; r.t = +t.toFixed(1); r.dented = hp0 - driver.hp;
    r.lane = +(driver.pos.x - spot.x).toFixed(2);
    GAME.vehicles.removeCar(parked); GAME.vehicles.removeCar(driver);
    // a fresh driver mid-block with the nearest junction BEHIND it
    var fresh = GAME.vehicles.spawnCar('sedan', spot.x + 3.1, spot.z + 9, 0,
      { occupied: 'ai', ai: { mode: 'traffic', desired: 11, laneX: 0, laneZ: 0 } });
    fresh.speed = 6;
    var zf0 = fresh.pos.z;
    GAME.test.fastForward(3);
    r.freshAhead = +(fresh.pos.z - zf0).toFixed(1);
    r.freshHeading = +Math.cos(fresh.heading).toFixed(2);
    GAME.vehicles.removeCar(fresh);
    S.maxTraffic = keep.t; S.maxParked = keep.p;
    return r;
  });
  check('audit: a straight block of road to test traffic on (anchor sanity)', traffic.found === true);
  check('audit: traffic gets past a car parked at the kerb',
    traffic.passed === true && traffic.dented < 1, JSON.stringify(traffic));
  check('audit: and keeps its lane doing it',
    Math.abs(traffic.lane - 3.1) < 1, 'ended ' + traffic.lane + ' m off the centreline (lane 3.1)');
  check('audit: a fresh driver carries on ahead rather than U-turning to a junction behind',
    traffic.freshAhead > 10 && traffic.freshHeading > 0.7,
    'moved ' + traffic.freshAhead + ' m along its nose, heading cos=' + traffic.freshHeading);

  // The helicopter holds its height hands-off; police rounds stop on a car
  // between you and them; a car hit throws you off a bike; you fight back at
  // CITY: OFF; the next arrest after a bust takes as long as the first.
  var misc = await page.evaluate(function () {
    var P = GAME.player, r = {};
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    P.health = 100;
    GAME.test.teleport(356, 60);
    GAME.test.fastForward(0.3);
    // hover
    var heli = GAME.vehicles.spawnCar('helicopter', 352, 60, 0, {});
    GAME.test.fastForward(0.2);
    GAME.test.enterNearestCar(heli);
    GAME.test.fastForward(1);
    r.flying = P.inCar && P.car === heli;
    heli.pos.y = GAME.city.groundY(heli.pos.x, heli.pos.z) + 30; heli.vy = 0;
    var y0 = heli.pos.y;
    GAME.test.fastForward(3);
    r.hoverDrop = +(y0 - heli.pos.y).toFixed(2);
    heli.pos.y = GAME.city.groundY(heli.pos.x, heli.pos.z) + 0.05;
    GAME.test.fastForward(0.2);
    GAME.exitCar();
    GAME.vehicles.removeCar(heli);
    // cover
    GAME.test.teleport(356, 60);
    GAME.test.fastForward(0.3);
    var hits = 0, dmg0 = GAME.playerDamage;
    GAME.playerDamage = function () { hits++; };
    var cop = GAME.peds.spawnPed(356, 72, { cop: true });
    cop.state = 'idle';
    function volley() {
      hits = 0;
      for (var v = 0; v < 300; v++) {
        cop.lastShotT = GAME.time;   // past the first-shot wobble every time
        GAME.combat.npcShoot(cop.pos.x, 1.35, cop.pos.z, 0.35, 8, cop);
      }
      return hits / 300;
    }
    r.openRate = volley();
    var van = GAME.vehicles.spawnCar('van', 356, 66, Math.PI / 2, {});
    r.coverRate = volley();
    GAME.playerDamage = dmg0;
    GAME.vehicles.removeCar(van);
    GAME.peds.removePed(cop);
    P.health = 100;
    // a bike, run into from behind at 20 m/s
    var bike = GAME.vehicles.spawnCar('motorcycle', 352, 60, 0, {});
    GAME.test.fastForward(0.2);
    GAME.test.enterNearestCar(bike);
    GAME.test.fastForward(1);
    r.riding = P.inCar && P.onBike;
    var ram = GAME.vehicles.spawnCar('sedan', bike.pos.x, bike.pos.z - 14, 0, {});
    ram.speed = 20;
    for (var b2 = 0; b2 < 90 && P.inCar; b2++) GAME.test.fastForward(1 / 60);
    r.thrown = !P.inCar;
    if (P.inCar) GAME.exitCar();
    GAME.vehicles.removeCar(ram); GAME.vehicles.removeCar(bike);
    P.health = 100;
    GAME.test.fastForward(0.5);
    // fighting back with the city switched off
    var was = GAME.chaos.level;
    GAME.chaos.set(0);
    var tough = GAME.peds.spawnPed(P.pos.x, P.pos.z + 1.6);
    tough.state = 'idle'; tough.speed = 0; tough.temper = 0.95; tough.hp = 200;
    GAME.cam.yaw = 0; P.heading = 0;
    GAME.peds.damage(tough, 4, true);
    r.foughtBack = tough.state === 'attack';
    GAME.peds.removePed(tough);
    GAME.chaos.set(was);
    P.health = 100;
    r.alive = P.state === 'alive';
    return r;
  });
  check('audit: in a helicopter, thirty metres up (anchor sanity)', misc.flying === true);
  check('audit: hands off, the helicopter holds its height',
    Math.abs(misc.hoverDrop) < 1, 'moved ' + misc.hoverDrop + ' m in 3 s');
  check('audit: an officer at 12 m hits you in the open (anchor sanity)',
    misc.openRate > 0.15, 'hit rate in the open=' + misc.openRate.toFixed(2));
  check('audit: and not through a van between you',
    misc.coverRate === 0, 'hit rate behind the van=' + misc.coverRate.toFixed(2));
  check('audit: on a bike (anchor sanity)', misc.riding === true);
  check('audit: a car running into the bike throws you off it', misc.thrown === true);
  check('audit: at CITY: OFF a hot-tempered man you hit still fights back',
    misc.foughtBack === true, 'state after the punch: ' + (misc.foughtBack ? 'attack' : 'not attack'));
  check('audit: and the group leaves the player alive (anchor sanity)', misc.alive === true);

  // mute: one switch, remembered, and the pause screen says which way it is
  var mute = await page.evaluate(function () {
    var r = {};
    var before = GAME.audio.muted;
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM', key: 'm', bubbles: true }));
    r.muted = GAME.audio.muted;
    r.label = document.getElementById('pause-mute').textContent;
    r.pref = !!(GAME.prefs && GAME.prefs.muted);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM', key: 'm', bubbles: true }));
    r.back = GAME.audio.muted === before;
    r.backPref = !!(GAME.prefs && GAME.prefs.muted);
    return r;
  });
  check('audit: M mutes, says so on the pause screen, and is remembered',
    mute.muted === true && mute.label.indexOf('MUTED') >= 0 && mute.pref === true, JSON.stringify(mute));
  check('audit: and M again undoes all three', mute.back === true && mute.backPref === false, JSON.stringify(mute));

  // The closed bridge explains itself once per approach, up on the deck — not
  // every six seconds to whoever is on the beach underneath.
  var gate = await page.evaluate(function () {
    var C = GAME.city, P = GAME.player, r = {};
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    P.health = 100;
    var was = GAME.isla.isOpen();
    GAME.isla.setOpen(false);
    var g = null;
    C.hash.all.forEach(function (b) {
      if (!g && b.tag === 'gate' && b.gateH !== undefined &&
        !C.isInWater((b.minX + b.maxX) / 2, (b.minZ + b.maxZ) / 2, 0)) g = b;
    });
    r.found = !!g;
    if (!g) { GAME.isla.setOpen(was); return r; }
    var gx = (g.minX + g.maxX) / 2, gz = (g.minZ + g.maxZ) / 2, deckY = g.gateH - 2.6;
    // the deck runs along the barrier's short side; take the mainland end
    var ax = (g.maxX - g.minX) < (g.maxZ - g.minZ) ? 1 : 0, az = 1 - ax;
    var sgn = U.dist2(gx + ax * 10, gz + az * 10, -70, 0) < U.dist2(gx - ax * 10, gz - az * 10, -70, 0) ? 1 : -1;
    var told = function () { return window.__msgs.filter(function (m) { return m.indexOf('BRIDGE CLOSED') >= 0; }).length; };
    // underneath, on the sand
    window.__msgs = [];
    var ux = gx + ax * sgn * 3, uz = gz + az * sgn * 3;
    GAME.test.teleport(ux, uz);
    P.pos.y = C.groundY(ux, uz, 0); P.velY = 0;
    GAME.test.fastForward(8);
    r.under = told(); r.underY = +P.pos.y.toFixed(1); r.deckY = +deckY.toFixed(1);
    // on the deck, walking up to it
    window.__msgs = [];
    GAME.test.teleport(gx + ax * sgn * 12, gz + az * sgn * 12);
    r.onDeckY = +P.pos.y.toFixed(1);
    GAME.test.fastForward(2);
    r.first = told();
    GAME.test.fastForward(10);
    r.stayed = told();
    // and flying over it is not arriving at it (a plane over the barrier
    // was told the bridge was shut)
    GAME.test.teleport(-60, 40); GAME.test.fastForward(0.5);
    var hx = gx + ax * sgn * 12, hz = gz + az * sgn * 12;
    // (boarded well away from it: stood on the deck by the gate, you are
    // told before you ever take off)
    var heli = GAME.vehicles.spawnCar('helicopter', -56, 40, 0, {});
    GAME.enterCar(heli); GAME.test.fastForward(1.5);
    window.__msgs = [];
    for (var hf = 0; hf < 180; hf++) { heli.pos.set(hx, deckY + 25, hz); heli.speed = 0; heli.vy = 0; GAME.test.fastForward(1 / 60); }
    r.over = { inHeli: P.inCar && P.car === heli, told: told() };
    if (P.inCar) GAME.exitCar();
    GAME.test.fastForward(0.3);
    GAME.vehicles.removeCar(heli);
    GAME.isla.setOpen(was);
    GAME.test.teleport(-60, 40);
    GAME.test.fastForward(0.3);
    return r;
  });
  check('audit: a closed bridge gate standing over dry land (anchor sanity)',
    gate.found === true && gate.onDeckY > gate.underY + 1.5, JSON.stringify(gate));
  check('audit: underneath it on the sand, nobody tells you the bridge is closed',
    gate.under === 0, gate.under + ' banners in 8 s at y=' + gate.underY + ' under a deck at ' + gate.deckY);
  check('audit: up on the deck, it says so once — and not again while you stand there',
    gate.first === 1 && gate.stayed === 1, 'first=' + gate.first + ' after 12 s=' + gate.stayed);
  check('audit: flying over a closed gate, nobody tells you the bridge is closed', gate.over && gate.over.inHeli && gate.over.told === 0, JSON.stringify(gate.over));

  // The next arrest after a bust takes as long as the first one. The hold
  // timer used to be left where the last arrest put it, so the second came
  // after a single tick of contact.
  var bustOnce = function () {
    return page.evaluate(function () {
      var P = GAME.player;
      if (P.inCar) GAME.exitCar();
      P.health = 100;
      GAME.test.teleport(-60, 40);
      GAME.test.fastForward(0.3);
      GAME.test.setWanted(1);
      var cop = GAME.peds.spawnPed(P.pos.x + 1.2, P.pos.z, { cop: true });
      cop.state = 'chase';
      var t = 0;
      while (P.state === 'alive' && t < 6) { GAME.test.fastForward(0.05); t += 0.05; }
      return { state: P.state, t: +t.toFixed(2) };
    });
  };
  // Back on your feet after a bust. The screen has to have been up a moment
  // before R counts, and a bust slows the clock: left to the real frame loop,
  // a slow machine (two ticks a frame at most) used to run out of tries with
  // the player still in the cells — and every group after it ran busted.
  // So the time on the screen is fast-forwarded, R is down for it, and only
  // the fade back in (a real-clock timer) is waited for.
  var comeBack = async function () {
    for (var w = 0; w < 25; w++) {
      var up = await page.evaluate(function () {
        if (GAME.player.state === 'alive') return true;
        GAME.test.pressKey('KeyR', true); GAME.test.fastForward(0.7); GAME.test.pressKey('KeyR', false);
        return GAME.player.state === 'alive';
      });
      if (up) break;
      await page.waitForTimeout(400);
    }
    return page.evaluate(function () {
      GAME.police.clearWanted();
      GAME.player.health = 100;
      return GAME.player.state;
    });
  };
  var bust1 = await bustOnce();
  var back1 = await comeBack();
  var bust2 = bust1.state === 'busted' && back1 === 'alive' ? await bustOnce() : { state: 'skipped', t: 0 };
  var back2 = bust2.state === 'busted' ? await comeBack() : back1;
  check('audit: an officer holding you busts you (anchor sanity)',
    bust1.state === 'busted' && back1 === 'alive' && back2 === 'alive', JSON.stringify([bust1, back1, bust2, back2]));
  check('audit: and the next arrest takes the same hold as the first',
    bust2.state === 'busted' && bust2.t >= 0.5, 'first ' + bust1.t + ' s, second ' + bust2.t + ' s');

  // A touchscreen laptop is a laptop: it starts on the mouse, a touch on the
  // screen switches to the touch controls, and the mouse switches back.
  var hctx = await browser.newContext({ viewport: { width: 1000, height: 600 } });
  await hctx.addInitScript(function () {
    Object.defineProperty(Navigator.prototype, 'maxTouchPoints', { get: function () { return 10; } });
    window.ontouchstart = null;
  });
  var hpage = await hctx.newPage();
  var hybridErrors = [];
  hpage.on('pageerror', function (e) { hybridErrors.push(String(e.message).slice(0, 200)); });
  // a second city building beside the first one, still running: give it
  // longer than the default 30 s, which a loaded machine has run past
  await hpage.goto(origin + '/index.html', { timeout: 90000 });
  await hpage.waitForFunction(function () {
    return window.GAME && GAME.test && GAME.city && GAME.city.nodes && GAME.city.nodes.length > 0;
  }, null, { timeout: 90000 });
  var hybrid = await hpage.evaluate(function () {
    GAME.prefs.guide = 'done';   // her welcome answered, as on the main page
    if (GAME.strangers) GAME.strangers.enabled = false;   // and the strangers stood down, as there
    if (GAME.heist) GAME.heist.enabled = false;
    if (GAME.scenes) GAME.scenes.enabled = false;   // and the scenes off
    GAME.missions.acts = false;   // and the jobs one part each
    if (GAME.gangs) GAME.gangs.enabled = false;   // and the gangs off the corners
    GAME.police.tactics = false;   // and the chase polite
    GAME.vehicles.wear = false;   // and the cars whole
    GAME.dj.enabled = false;   // and the DJs quiet
    GAME.test.start();
    GAME.test.fastForward(0.5);
    var layer = document.getElementById('touch-layer');
    var r = { touchPoints: navigator.maxTouchPoints, bootTouch: GAME.isTouch };
    var t = new Touch({ identifier: 3, target: document.body, clientX: 500, clientY: 300 });
    document.body.dispatchEvent(new TouchEvent('touchstart', { touches: [t], changedTouches: [t], bubbles: true }));
    GAME.test.fastForward(0.2);
    r.afterTouch = GAME.isTouch;
    r.layerShown = getComputedStyle(layer).display !== 'none';
    window.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'mouse', bubbles: true }));
    GAME.test.fastForward(0.2);
    r.afterMouse = GAME.isTouch;
    r.layerHidden = getComputedStyle(layer).display === 'none';
    r.stickOff = GAME.input.touch.active === false;
    return r;
  });
  await hctx.close();
  check('audit: a laptop reporting touch points (anchor sanity)', hybrid.touchPoints === 10, JSON.stringify(hybrid));
  check('audit: starts on the mouse and keyboard, not the phone controls', hybrid.bootTouch === false);
  check('audit: a touch on the screen switches to the touch controls',
    hybrid.afterTouch === true && hybrid.layerShown === true, JSON.stringify(hybrid));
  check('audit: and the mouse switches back',
    hybrid.afterMouse === false && hybrid.layerHidden === true && hybrid.stickOff === true, JSON.stringify(hybrid));
  check('audit: with no page errors on the way', hybridErrors.length === 0, hybridErrors.join(' | '));

  // ---------- 3z: the law can be lost, and the payouts have limits ----------
  // Three stars and up could not be escaped. The police steered for where you
  // were, not where they had seen you; the helicopter counted as eyes on you
  // through any building; and officers on foot were spawned around your live
  // position every couple of seconds wherever you had hidden. Now they hunt
  // the last place they saw you — and lying low still takes a while, longer
  // the hotter it is. Alongside it: sleeping off a manhunt takes two stars,
  // not all of them; the same jump pays once per cooldown; and passing a
  // rampage cools you to two stars rather than leaving you at four with
  // your fists.
  var lost = await page.evaluate(function () {
    var P = GAME.player, r = {};
    if (P.inCar) GAME.exitCar();
    GAME.police.clearWanted();
    GAME.test.fastForward(0.5);
    GAME.test.teleport(150, -100);
    var car = GAME.test.spawnCar('sports', 2, 0);
    GAME.test.enterNearestCar(car);
    GAME.test.fastForward(1.5);
    r.driving = P.inCar;
    GAME.godMode = true;
    // a spree's worth of heat, held while they arrive and engage
    for (var e = 0; e < 12; e++) {
      GAME.test.setWanted(4);
      for (var k = 0; k < 3; k++) GAME.police.reportCrime('kill_ped', GAME.focus());
      if (P.car) P.car.hp = 1e6;
      GAME.test.fastForward(1);
    }
    // (back on four: three killings a second sit just under the five-star
    // line, and a cruiser shunting the car in the last of them tips it over)
    GAME.test.setWanted(4);
    GAME.test.fastForward(0.2);
    r.engaged = { stars: GAME.police.wanted, spotted: GAME.police.spotted, cruisers: GAME.test.getState().policeCars };
    // got clean away: across town, parked down a street
    GAME.test.teleport(-150 + 3.1, 140);
    var t = 0, lostAt = null;
    for (; t < 150 && GAME.police.wanted > 0 && P.state === 'alive'; t++) {
      if (P.car) P.car.hp = 1e6;
      GAME.test.fastForward(1);
      if (lostAt === null && !GAME.police.spotted) lostAt = t;
    }
    r.lostAt = lostAt;
    r.clearedIn = GAME.police.wanted === 0 ? t : null;
    r.state = P.state;
    GAME.godMode = false;
    if (P.car) P.car.hp = P.car.spec.hp;
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    if (car && !car.gone) GAME.vehicles.removeCar(car);
    P.health = 100;
    return r;
  });
  check('law: four stars, and the police have you in sight (anchor sanity)',
    lost.driving === true && lost.engaged.stars === 4 && lost.engaged.spotted === true && lost.engaged.cruisers > 0,
    JSON.stringify(lost.engaged));
  check('law: get clean away and they lose you',
    lost.lostAt !== null && lost.lostAt <= 5, 'lost sight after ' + lost.lostAt + ' s');
  check('law: stay hidden and four stars go — escapable',
    lost.clearedIn !== null && lost.state === 'alive', 'cleared in ' + lost.clearedIn + ' s, ' + lost.state);
  check('law: but not in a hurry — it takes the best part of a minute',
    lost.clearedIn !== null && lost.clearedIn >= 35, 'cleared in ' + lost.clearedIn + ' s');

  // A new offence somewhere else puts the hunt on you — not back on wherever
  // they lost you last time. Being marked spotted used to leave the last
  // sighting where the previous chase had ended, and every unit dispatched
  // for the new one drove off across town to search it.
  var fresh = await page.evaluate(function () {
    var P = GAME.player, r = {};
    if (P.inCar) GAME.exitCar();
    GAME.police.clearWanted();
    GAME.test.fastForward(1);
    GAME.godMode = true;
    GAME.test.teleport(-250, -150);
    GAME.test.fastForward(0.5);
    GAME.test.setWanted(3);
    GAME.test.fastForward(8);
    GAME.test.teleport(-300, 300);          // lost them
    GAME.test.fastForward(6);
    GAME.police.clearWanted();
    GAME.test.fastForward(1);
    GAME.test.teleport(350, 300);           // and later, across the map
    GAME.test.fastForward(0.5);
    GAME.test.setWanted(3);
    var t = 0, near = 1e9;
    for (; t < 15 * 60 && near > 130; t++) {
      GAME.test.fastForward(1 / 60);
      GAME.world.cars.forEach(function (c) {
        if (c.isPolice && c.ai && c.ai.mode === 'chase') near = Math.min(near, U.dist(c.pos.x, c.pos.z, P.pos.x, P.pos.z));
      });
    }
    r.near = Math.round(near); r.t = +(t / 60).toFixed(1);
    GAME.godMode = false;
    GAME.police.clearWanted();
    GAME.test.fastForward(1);
    P.health = 100;
    return r;
  });
  check('law: a new offence brings them to you, not to where the last chase was lost',
    fresh.near <= 130, 'nearest cruiser ' + fresh.near + ' m after ' + fresh.t + ' s');

  // sleeping it off: three stars or fewer is forgotten, a manhunt only cools
  var slept = [];
  for (var sl = 0; sl < 3; sl++) {
    var stars0 = [5, 4, 3][sl];
    var asleep = await page.evaluate(function (stars) {
      var P = GAME.player;
      if (P.inCar) GAME.exitCar();
      var home = GAME.shops.locations().filter(function (l) { return l.kind === 'safehouse'; })[0];
      if (!home) return { found: false };
      GAME.prefs.safehouses = GAME.prefs.safehouses || [];
      window.__ownedBefore = GAME.prefs.safehouses.slice();
      if (GAME.prefs.safehouses.indexOf(home.sh.id) < 0) GAME.prefs.safehouses.push(home.sh.id);
      GAME.test.setWanted(stars);
      window.__msgs = [];
      var opened = GAME.shops.open(home);
      var rested = GAME.shops.buy('rest');
      return { found: true, opened: opened, rested: rested, before: GAME.police.wanted };
    }, stars0);
    // the night passes behind a real fade, so wait for morning rather than a clock
    try {
      await page.waitForFunction(function () {
        return window.__msgs.some(function (m) { return m.indexOf('Eight hours later') >= 0; });
      }, null, { timeout: 8000 });
    } catch (e) { /* reported below as an unchanged level */ }
    var woke = await page.evaluate(function () {
      var r = { after: GAME.police.wanted, health: GAME.player.health };
      GAME.prefs.safehouses = window.__ownedBefore;
      if (GAME.shops.isOpen) GAME.shops.close();
      GAME.police.clearWanted();
      return r;
    });
    slept.push({ from: stars0, found: asleep.found, rested: asleep.rested, before: asleep.before, after: woke.after });
  }
  check('sleep: a safehouse to sleep in (anchor sanity)',
    slept.every(function (s) { return s.found && s.rested && s.before === s.from; }), JSON.stringify(slept));
  check('sleep: five stars wake up as three, four as two, three as none',
    slept[0].after === 3 && slept[1].after === 2 && slept[2].after === 0,
    slept.map(function (s) { return s.from + '->' + s.after; }).join(' '));

  // the same jump pays once per cooldown
  var jumps = await page.evaluate(function () {
    var P = GAME.player, r = { pays: [] };
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    GAME.test.teleport(356, 50);
    GAME.test.fastForward(0.5);
    var car = GAME.test.spawnCar('sedan', 4, 0);
    GAME.test.fastForward(0.3);
    GAME.test.enterNearestCar(car);
    GAME.test.fastForward(1.5);
    r.driving = P.inCar;
    function jump() {
      var c = P.car;
      c.pos.set(356, GAME.city.groundY(356, 60), 60);
      c.air = 0; c.airVX = c.airVZ = undefined;
      GAME.test.fastForward(1 / 60);
      c.pos.set(356, GAME.city.groundY(356, 60) + 6, 60);
      c.heading = 0; c.speed = 26; c.lat = 0; c.vy = 9; c.air = 0;
      c.airVX = c.airVZ = undefined; c.jumpRamp = null; c.jumpSpin = 0;
      c.hp = c.spec.hp; c.stage = 0;
      var cash0 = P.cash;
      for (var i = 0; i < 400; i++) { GAME.test.fastForward(1 / 60); if (!c.air && i > 2) break; }
      c.speed = 0;
      return P.cash - cash0;
    }
    r.pays.push(jump());
    GAME.test.fastForward(20);
    r.pays.push(jump());
    GAME.test.fastForward(121);
    r.pays.push(jump());
    GAME.exitCar();
    GAME.vehicles.removeCar(car);
    return r;
  });
  check('jumps: the first jump pays (anchor sanity)', jumps.driving && jumps.pays[0] > 0, JSON.stringify(jumps.pays));
  check('jumps: the same jump again inside two minutes does not',
    jumps.pays[1] === 0, 'paid $' + jumps.pays[1] + ' twenty seconds later');
  check('jumps: and once the cooldown is up it pays again',
    jumps.pays[2] > 0, 'paid $' + jumps.pays[2] + ' after the cooldown');

  // a rampage you pass leaves you on two stars, not at a roadblock with fists
  var rage = await page.evaluate(function () {
    var P = GAME.player, r = {};
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    if (GAME.missions.active) GAME.missions.failActive('test');
    var def = GAME.missions.DEFS.filter(function (d) { return d.id === 'rampage0'; })[0];
    GAME.test.teleport(def.start.x + 20, def.start.z);
    GAME.test.fastForward(0.5);
    GAME.test.teleport(def.start.x, def.start.z);
    for (var i = 0; i < 60 * 8 && !(GAME.missions.active && GAME.missions.active.state === 'run'); i++) GAME.test.fastForward(1 / 60);
    r.running = !!(GAME.missions.active && GAME.missions.active.def.id === 'rampage0' && GAME.missions.active.state === 'run');
    if (!r.running) { if (GAME.missions.active) GAME.missions.failActive('test'); return r; }
    GAME.godMode = true;
    GAME.test.setWanted(4);
    r.during = GAME.police.wanted;
    GAME.missions.notifyChaos(def.target + 100);
    GAME.test.fastForward(0.5);
    r.passed = !GAME.missions.active;
    r.after = GAME.police.wanted;
    GAME.godMode = false;
    if (GAME.share && GAME.share.hide) GAME.share.hide();
    GAME.police.clearWanted();
    GAME.test.teleport(def.start.x + 30, def.start.z);
    GAME.test.fastForward(0.5);
    P.health = 100;
    return r;
  });
  check('rampage: running, at four stars (anchor sanity)', rage.running === true && rage.during === 4, JSON.stringify(rage));
  check('rampage: passing it cools you to two stars',
    rage.passed === true && rage.after === 2, 'passed=' + rage.passed + ' stars after=' + rage.after);

  // ---------- 4z: the play loop ----------
  // A roof was a safe house. Officers would not shoot at anyone more than
  // 3 m above them, and the flat sight line from the street runs into the
  // building you are standing on, so at two or three stars you could wait
  // the heat out up there untouched. Officers' own shots are counted here,
  // so the helicopter's do not blur the edge/middle answer.
  var roof = await page.evaluate(function () {
    var C = GAME.city, P = GAME.player, out = { found: false };
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    var pick = null, spots = [[-100, -100], [100, 100], [-100, 100], [100, -100]];
    for (var sp = 0; sp < spots.length && !pick; sp++) {
      var cands = C.hash.query(spots[sp][0], spots[sp][1], 60);
      for (var i = 0; i < cands.length && !pick; i++) {
        var b = cands[i];
        if (b.tag !== 'building' || b.noLOS || !(b.h > 10 && b.h < 30) || b.minY !== undefined) continue;
        if (b.maxX - b.minX < 16 || b.maxZ - b.minZ < 10) continue;
        var bz = (b.minZ + b.maxZ) / 2;
        if (C.hash.query(b.maxX + 12, bz, 4).length || C.isInWater(b.maxX + 12, bz)) continue;
        if (!C.hash.segmentClear(b.maxX + 0.2, bz, b.maxX + 18, bz)) continue;
        pick = b;
      }
    }
    if (!pick) return out;
    out.found = true;
    var cz = (pick.minZ + pick.maxZ) / 2;
    var shoot0 = GAME.combat.npcShoot, copShots = 0;
    GAME.combat.npcShoot = function () {
      var sh = arguments[5];
      if (sh && (sh.isCop || sh.isPolice) && !arguments[6]) copShots++;
      return shoot0.apply(GAME.combat, arguments);
    };
    function trial(inset) {
      GAME.police.clearWanted();
      GAME.world.peds.slice().forEach(function (p) { if (p.isCop) GAME.peds.removePed(p); });
      GAME.test.teleport(pick.maxX - inset, cz);
      P.pos.y = pick.h;
      GAME.test.fastForward(0.3);
      var o = { standY: P.pos.y, h: pick.h, air0: GAME.police.airUnitCount };
      GAME.test.setWanted(2);
      window.__msgs = [];
      copShots = 0;
      var heliAt = null;
      for (var t = 0; t < 60 * 8; t++) {
        // two officers held on the pavement below, square on to the face
        var cops = GAME.world.peds.filter(function (p) { return p.isCop && !p.dead; });
        for (var k = 0; k < Math.min(2, cops.length); k++) { cops[k].pos.x = pick.maxX + 12; cops[k].pos.z = cz + (k ? 3 : -3); }
        GAME.test.setWanted(2);
        P.health = 100;
        GAME.test.fastForward(1 / 60);
        if (heliAt === null && GAME.police.airUnitCount > 0) heliAt = +(t / 60).toFixed(1);
      }
      o.copShots = copShots;
      o.heliAt = heliAt;
      o.told = window.__msgs.some(function (m) { return m.indexOf('air support') >= 0; });
      o.stillUp = P.pos.y > pick.h - 0.5;
      return o;
    }
    try {
      out.edge = trial(0.6);
      out.middle = trial((pick.maxX - pick.minX) / 2);
    } finally {
      GAME.combat.npcShoot = shoot0;
      GAME.police.clearWanted();
      GAME.world.peds.slice().forEach(function (p) { if (p.isCop) GAME.peds.removePed(p); });
      GAME.test.teleport(pick.maxX + 12, cz);
      GAME.test.fastForward(0.5);
      P.health = 100;
    }
    return out;
  });
  check('roof: a roof to stand on with a clear street below (anchor sanity)',
    roof.found && roof.edge.standY === roof.edge.h && roof.edge.stillUp && roof.middle.stillUp && roof.edge.air0 === 0,
    JSON.stringify(roof));
  check('roof: at its edge, the officers below shoot up at you',
    roof.found && roof.edge.copShots > 0, 'shots from the street in 8 s: ' + (roof.edge && roof.edge.copShots));
  check('roof: well back from the edge, the roof is cover',
    roof.found && roof.middle.copShots === 0, 'shots from the street in 8 s: ' + (roof.middle && roof.middle.copShots));
  check('roof: and nobody can climb up, so the helicopter comes early',
    roof.found && roof.edge.heliAt !== null && roof.edge.told,
    'air unit up after ' + (roof.edge && roof.edge.heliAt) + ' s at two stars, told=' + (roof.edge && roof.edge.told));

  // No retry after a failed run: you drove back to its marker yourself, a
  // kilometre and more, and from the hospital after a death. Now Y (or
  // RETRY) puts you back on the start line for a few seconds after it fails,
  // in what you set off in — once you are back on your feet, after a death.
  var rt = await page.evaluate(function () {
    var P = GAME.player, M = GAME.missions, C = GAME.city, r = {};
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    if (M.active) M.failActive('test');
    var def = M.DEFS.filter(function (d) { return d.id === 'race0'; })[0];
    function line() { var f = GAME.focus(); return Math.hypot(f.x - def.start.x, f.z - def.start.z); }
    function lineUp(car) {
      GAME.test.teleport(def.start.x, def.start.z);
      for (var i = 0; i < 60 * 6 && !(M.active && M.active.state === 'run'); i++) GAME.test.fastForward(1 / 60);
      return !!(M.active && M.active.def === def && M.active.state === 'run' && P.car === car);
    }
    function pressY() { GAME.test.pressKey('KeyY'); GAME.test.fastForward(1 / 60); GAME.test.pressKey('KeyY', false); }
    GAME.test.teleport(def.start.x + 40, def.start.z);
    var car = GAME.test.spawnCar('sports', 2, 0);
    GAME.test.fastForward(0.3);
    GAME.test.enterNearestCar(car);
    GAME.test.fastForward(1.2);
    r.ran = lineUp(car);
    // the run comes apart a long way off
    var far = C.nearestRoadPoint(def.start.x - 450, def.start.z + 350);
    GAME.test.teleport(far.x, far.z);
    window.__msgs = [];
    M.failActive('test');
    GAME.test.fastForward(1 / 60);
    r.far = Math.round(line());
    r.offered = window.__msgs.some(function (m) { return m.indexOf('Y to retry') >= 0; });
    r.button = GAME.retryAvailable === true;
    // not with the heat on
    GAME.test.setWanted(1);
    window.__msgs = [];
    pressY();
    GAME.test.fastForward(1);
    r.hotRefused = !M.active && window.__msgs.some(function (m) { return m.indexOf('Lose the stars') >= 0; });
    GAME.police.clearWanted();
    pressY();
    GAME.test.fastForward(1.2);
    r.back = !!(M.active && M.active.def === def);
    r.backAt = Math.round(line());
    r.sameCar = P.inCar && P.car === car;
    for (var i = 0; i < 60 * 6 && !(M.active && M.active.state === 'run'); i++) GAME.test.fastForward(1 / 60);
    r.racing = !!(M.active && M.active.state === 'run' && M.active.racers.length > 0);
    // and an offer left alone lapses
    M.failActive('test');
    GAME.test.fastForward(13);
    pressY();
    GAME.test.fastForward(1.2);
    r.lapsed = !M.active && GAME.retryAvailable === false;
    // a death: lined up again, then wasted mid-run
    GAME.test.teleport(def.start.x + 40, def.start.z);
    GAME.test.fastForward(0.5);
    r.ranAgain = lineUp(car);
    window.__msgs = [];
    GAME.godMode = false;
    GAME.playerWasted('test');
    r.carType = car.type;
    return r;
  });
  await page.evaluate(function () {
    GAME.input.keys['KeyR'] = true;
    GAME.test.fastForward(1.2);
    GAME.input.keys['KeyR'] = false;
  });
  try {
    await page.waitForFunction(function () { return GAME.player.state === 'alive'; }, null, { timeout: 10000 });
  } catch (e) { /* reported below */ }
  var rt2 = await page.evaluate(function () {
    var P = GAME.player, M = GAME.missions, r = {};
    var def = M.DEFS.filter(function (d) { return d.id === 'race0'; })[0];
    GAME.test.fastForward(0.2);
    r.alive = P.state === 'alive';
    r.offered = window.__msgs.some(function (m) { return m.indexOf('Y to retry: ' + def.name) >= 0; });
    r.onFoot = !P.inCar;
    GAME.test.pressKey('KeyY'); GAME.test.fastForward(1 / 60); GAME.test.pressKey('KeyY', false);
    GAME.test.fastForward(1.2);
    var f = GAME.focus();
    r.back = !!(M.active && M.active.def === def);
    r.backAt = Math.round(Math.hypot(f.x - def.start.x, f.z - def.start.z));
    r.rideType = P.inCar && P.car ? P.car.type : null;
    // leave nothing running for the groups after this one
    if (M.active) M.failActive('test');
    GAME.test.fastForward(13);
    if (P.inCar) { var c = P.car; GAME.exitCar(); GAME.vehicles.removeCar(c); }
    // and the car the death left on the line
    GAME.world.cars.slice().forEach(function (wc) {
      if (!wc.occupied && wc.type === 'sports' && Math.hypot(wc.pos.x - def.start.x, wc.pos.z - def.start.z) < 30) GAME.vehicles.removeCar(wc);
    });
    GAME.test.fastForward(0.5);
    P.health = 100;
    return r;
  });
  check('retry: a race to fail, run from its line (anchor sanity)', rt.ran && rt.far > 300, JSON.stringify(rt));
  check('retry: failing it offers a retry, on the key and the button',
    rt.offered && rt.button, 'message=' + rt.offered + ' button=' + rt.button);
  check('retry: not with stars on you', rt.hotRefused);
  check('retry: Y puts you back on its start line, in your own car, and runs it',
    rt.back && rt.backAt < 25 && rt.sameCar && rt.racing,
    'back=' + rt.back + ' ' + rt.backAt + ' m from the line, same car=' + rt.sameCar + ', racing=' + rt.racing);
  check('retry: an offer left alone lapses', rt.lapsed);
  check('retry: after a death it is offered once you are back on your feet',
    rt.ranAgain && rt2.alive && rt2.offered && rt2.onFoot, JSON.stringify(rt2));
  check('retry: and hands you back the kind of car you set off in',
    rt2.back && rt2.backAt < 25 && rt2.rideType === rt.carType,
    'back=' + rt2.back + ' ' + rt2.backAt + ' m from the line in a ' + rt2.rideType + ' (set off in a ' + rt.carType + ')');

  // Too fragile and too solid. Every touch from 4 m/s up killed whoever it
  // touched — a jog — and two of them were a wanted star; while a half-metre
  // lamp post stopped a car at 29 m/s as dead as a building, and the car
  // went straight through benches and the beach palms.
  var soft = await page.evaluate(function () {
    var P = GAME.player, C = GAME.city, S = GAME.settings, r = {};
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    var keep = { t: S.maxTraffic, p: S.maxParked };
    S.maxTraffic = 0; S.maxParked = 0;
    // a clear straight on a mainland street, and a car on it
    var x = -150 + 3.1, z0 = -40;
    GAME.test.teleport(x - 4, z0);
    GAME.world.cars.slice().forEach(function (c) { if (Math.hypot(c.pos.x - x, c.pos.z - z0) < 120) GAME.vehicles.removeCar(c); });
    var car = GAME.vehicles.spawnCar('sedan', x, z0, 0, {});
    GAME.test.enterNearestCar(car);
    GAME.test.fastForward(1);
    r.driving = P.car === car;
    // walk into someone at a crawl, twice; then at a proper speed — with
    // somebody across the street to see it, or no crime is ever reported
    GAME.world.peds.slice().forEach(function (p) { if (Math.hypot(p.pos.x - x, p.pos.z - z0) < 60) GAME.peds.removePed(p); });
    var wit = GAME.peds.spawnPed(x + 10, z0 + 6);
    function hold() { wit.pos.x = x + 10; wit.pos.z = z0 + 6; wit.state = 'idle'; wit.speed = 0; }
    function hitAt(sp) {
      GAME.world.peds.slice().forEach(function (p) { if (p !== wit && Math.hypot(p.pos.x - car.pos.x, p.pos.z - car.pos.z) < 40) GAME.peds.removePed(p); });
      car.pos.set(x, C.groundY(x, z0), z0); car.heading = 0; car.lat = 0; car.vy = 0;
      var ped = GAME.peds.spawnPed(x, z0 + 6);
      ped.state = 'idle'; ped.speed = 0; ped.temper = 0;
      var o = { hp0: ped.hp, wasDive: false, peakHeat: 0 };
      for (var t = 0; t < 60 * 3; t++) {
        car.speed = o.wasDive ? 0 : sp; car.controls.throttle = 0;   // and stop once you have hit them
        hold();
        GAME.test.fastForward(1 / 60);
        o.peakHeat = Math.max(o.peakHeat, Math.round(GAME.police.heat));
        if (ped.state === 'dive') o.wasDive = true;
        if (ped.dead || Math.hypot(ped.pos.x - car.pos.x, ped.pos.z - car.pos.z) > 25) break;
      }
      for (var t2 = 0; t2 < 60 && !ped.dead; t2++) { car.speed = 0; hold(); GAME.test.fastForward(1 / 60); }
      o.dead = !!ped.dead; o.hp = ped.hp; o.state = ped.state;
      if (!ped.dead) GAME.peds.removePed(ped);
      return o;
    }
    r.bump1 = hitAt(6);
    r.bump2 = hitAt(6);
    r.starsAfterBumps = GAME.police.wanted;
    r.heatAfterBumps = Math.max(r.bump1.peakHeat, r.bump2.peakHeat);   // the witness saw them (anchor)
    r.fast = hitAt(16);
    GAME.police.clearWanted();
    GAME.peds.removePed(wit);
    // a lamp post at speed, and one at a crawl
    // a lamp post is the 0.5 m, 6 m tall prop (found by shape, not by the
    // flag the fix added, so this reads the same on code without it)
    function isPost(b) { return b.tag === 'prop' && Math.abs(b.maxX - b.minX - 0.5) < 0.01 && b.h === 6; }
    function isDown(b) { return !!(b.knock && b.knock.down); }
    var posts = C.hash.all.filter(isPost);
    r.posts = posts.length;
    function postAt(sp) {
      // the nearest standing post to the west street, approached along +z
      var px = 0, best = null;
      for (var i = 0; i < posts.length; i++) {
        var b = posts[i]; if (isDown(b)) continue;
        var bx = (b.minX + b.maxX) / 2, bz = (b.minZ + b.maxZ) / 2;
        if (C.isInWater(bx, bz - 20) || !C.hash.segmentClear(bx, bz - 20, bx, bz - 1)) continue;
        if (!best || Math.hypot(bx + 150, bz) < Math.hypot(px + 150, best.z)) { best = { b: b, x: bx, z: bz }; px = bx; }
      }
      if (!best) return { found: false };
      car.pos.set(best.x, C.groundY(best.x, best.z - 10), best.z - 10); car.heading = 0; car.lat = 0; car.vy = 0;
      car.speed = sp; car.hp = car.spec.hp;
      // the most it lost in any one tick, as a share of what it had: a dead
      // stop is all of it
      var o = { found: true, before: sp, maxDrop: 0 };
      for (var t = 0; t < 60 * 2; t++) {
        car.controls.throttle = 0;
        var was = car.speed;
        GAME.test.fastForward(1 / 60);
        if (was > 0.5) o.maxDrop = Math.max(o.maxDrop, (was - car.speed) / was);
        if (car.pos.z > best.z + 4) break;
      }
      o.past = car.pos.z > best.z + 2;
      o.down = isDown(best.b);
      o.inHash = C.hash.all.indexOf(best.b) >= 0;
      o.box = best.b;
      return o;
    }
    var fastPost = postAt(26);
    r.fastPost = { found: fastPost.found, maxDrop: +fastPost.maxDrop.toFixed(2), past: fastPost.past, down: fastPost.down, inHash: fastPost.inHash };
    var slowPost = postAt(3);
    r.slowPost = { found: slowPost.found, past: slowPost.past, down: slowPost.down };
    // a fire hydrant is bolted down: a car at speed stops on it, it does not
    // vanish from under the bonnet (found by shape: 0.6 m square, 1 m tall)
    function isHydrant(b) { return b.tag === 'prop' && Math.abs(b.maxX - b.minX - 0.6) < 0.01 && b.h === 1; }
    var hb = null;
    C.hash.all.filter(isHydrant).forEach(function (b2) {
      if (hb) return;
      var hx = (b2.minX + b2.maxX) / 2, hz = (b2.minZ + b2.maxZ) / 2;
      if (C.isInWater(hx, hz - 20) || !C.hash.segmentClear(hx, hz - 20, hx, hz - 1)) return;
      hb = { b: b2, x: hx, z: hz };
    });
    if (hb) {
      car.pos.set(hb.x, C.groundY(hb.x, hb.z - 10), hb.z - 10); car.heading = 0; car.lat = 0; car.vy = 0;
      car.speed = 20; car.hp = car.spec.hp;
      for (var ht = 0; ht < 120; ht++) { car.controls.throttle = 0; GAME.test.fastForward(1 / 60); if (car.pos.z > hb.z + 4) break; }
      r.hydrant = { found: true, past: car.pos.z > hb.z + 2, inHash: C.hash.all.indexOf(hb.b) >= 0, down: !!(hb.b.knock && hb.b.knock.down) };
    } else r.hydrant = { found: false };
    // the beach palms and the boardwalk benches are solid now
    r.beachPalm = C.hash.query(372.8, 0, 14).some(function (b) { return b.tag === 'prop' && b.maxX - b.minX < 1 && b.minX > 370; });
    r.bench = C.hash.query(367.5, 0, 30).some(function (b) { return b.tag === 'prop' && b.h < 1.5 && b.maxZ - b.minZ > 2; });
    // and a flattened post is put back up once nobody is near it
    GAME.exitCar();
    GAME.vehicles.removeCar(car);
    if (fastPost.box) {
      var fb = fastPost.box;
      GAME.test.teleport((fb.minX + fb.maxX) / 2 + 300 > 340 ? (fb.minX + fb.maxX) / 2 - 300 : (fb.minX + fb.maxX) / 2 + 300, (fb.minZ + fb.maxZ) / 2);
      GAME.test.fastForward(50);
      r.backUp = !isDown(fb) && C.hash.all.indexOf(fb) >= 0;
    }
    S.maxTraffic = keep.t; S.maxParked = keep.p;
    P.health = 100;
    return r;
  });
  check('bump: a car on a clear street (anchor sanity)', soft.driving, JSON.stringify(soft));
  check('bump: a car at a crawl knocks someone down, it does not kill them',
    !soft.bump1.dead && soft.bump1.wasDive && soft.bump1.hp < soft.bump1.hp0 && !soft.bump2.dead,
    JSON.stringify([soft.bump1, soft.bump2]));
  check('bump: and two of those are not a wanted star, in front of a witness',
    soft.starsAfterBumps === 0 && soft.heatAfterBumps > 0, 'stars=' + soft.starsAfterBumps + ' on heat ' + soft.heatAfterBumps);
  check('bump: a car at speed still kills', soft.fast.dead, JSON.stringify(soft.fast));
  check('props: a lamp post at speed goes down, and the car goes on through',
    soft.fastPost.found && soft.fastPost.down && !soft.fastPost.inHash && soft.fastPost.past && soft.fastPost.maxDrop < 0.3,
    JSON.stringify(soft.fastPost));
  check('props: at a crawl it is still a post', soft.slowPost.found && !soft.slowPost.down && !soft.slowPost.past,
    JSON.stringify(soft.slowPost));
  check('props: a fire hydrant stops a car at speed, and is still there', soft.hydrant.found && !soft.hydrant.past && soft.hydrant.inHash && !soft.hydrant.down,
    JSON.stringify(soft.hydrant));
  check('props: the beach palms and the boardwalk benches are solid', soft.beachPalm && soft.bench,
    'palm=' + soft.beachPalm + ' bench=' + soft.bench);
  check('props: and a flattened post is back up once nobody is near it', soft.backUp === true, 'backUp=' + soft.backUp);

  // ---------- 4y: the screen around the game ----------
  // Section 4 of the gameplay audit: what you see and press around the play.
  var html = await (await fetch(origin + '/index.html')).text();
  var ux = await page.evaluate(function () {
    var r = {}, H = GAME.hud, P = GAME.player;
    function $(id) { return document.getElementById(id); }
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    P.health = 100;
    GAME.test.fastForward(0.5);
    // messages stack, newest last, and a repeat refreshes instead of doubling
    var box = $('msg-line');
    for (var i = 0; i < box.children.length; i++) box.children[i].remove();
    GAME.test.fastForward(1);
    H.message('one', 5); H.message('two', 5); H.message('three', 5);
    r.three = Array.prototype.map.call(box.querySelectorAll('.msg:not(.out)'), function (e) { return e.textContent; });
    H.message('three', 5);
    H.message('four', 5);
    r.four = Array.prototype.map.call(box.querySelectorAll('.msg:not(.out)'), function (e) { return e.textContent; });
    // the district name goes under a running mission's title, not over it
    H.missionStart('TEST RUN', 'objective');
    var zp = $('zone-popup'), mh = $('mission-hud');
    r.zoneTop = zp.offsetTop; r.missionBottom = mh.offsetTop + mh.offsetHeight;
    H.missionEnd();
    r.zoneBack = zp.offsetTop;
    // every overlay screen in the page's own face, not the browser default
    r.fonts = ['wasted-screen', 'pause-screen', 'title-screen', 'map-screen'].map(function (id) { return getComputedStyle($(id)).fontFamily; });
    r.hintPx = parseFloat(getComputedStyle($('controls-bar')).fontSize);
    // the title answers when it says it will
    r.title = { cls: $('press-enter').className, text: $('press-enter').textContent };
    // pause: a click that just misses a button is not a RESUME (the empty
    // screen is, below), and the keys work
    GAME.togglePause();
    var ps = $('pause-screen'), rb = $('pause-resume').getBoundingClientRect();
    ps.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: rb.right + 6, clientY: rb.top + rb.height / 2 }));
    r.stillPaused = GAME.paused === true;
    r.lockHintUnderPause = $('lock-hint').style.display;
    GAME.onKeyDown('ArrowDown');
    r.lit = (document.querySelector('#pause-screen .kfocus') || {}).id;
    // down to SETTINGS opens its card; right goes into it and left comes out
    var hops = 0;
    while ((document.querySelector('#pause-screen .kfocus') || {}).id !== 'ptab-settings' && hops++ < 10) GAME.onKeyDown('ArrowDown');
    r.settingsOpen = $('pp-settings').classList.contains('on');
    GAME.onKeyDown('ArrowRight');
    r.inCard = (document.querySelector('#pause-screen .kfocus') || {}).id;
    GAME.onKeyDown('ArrowLeft');
    r.backOut = (document.querySelector('#pause-screen .kfocus') || {}).id;
    while ((document.querySelector('#pause-screen .kfocus') || {}).id !== 'pause-resume' && hops++ < 20) GAME.onKeyDown('ArrowUp');
    GAME.onKeyDown('Enter');
    r.resumedByEnter = GAME.paused === false;
    // with no mouse capture (this page never takes one) it says how to get it
    GAME.test.fastForward(0.1);
    r.lockHint = $('lock-hint').style.display;
    // the empty pause screen resumes on a click or a tap, but a drag that
    // scrolled a short screen is not a tap
    GAME.togglePause();
    ps.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 8, clientY: 8 }));
    r.clickResumed = GAME.paused === false;
    var pauseTouch = function (x0, y0, x1, y1) {
      var a = new Touch({ identifier: 21, target: ps, clientX: x0, clientY: y0 });
      var b = new Touch({ identifier: 21, target: ps, clientX: x1, clientY: y1 });
      ps.dispatchEvent(new TouchEvent('touchstart', { touches: [a], changedTouches: [a], bubbles: true }));
      ps.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [b], bubbles: true, cancelable: true }));
    };
    GAME.togglePause();
    pauseTouch(8, 200, 8, 120);
    r.dragStill = GAME.paused === true;
    pauseTouch(8, 8, 9, 10);
    r.tapResumed = GAME.paused === false;
    if (GAME.paused) GAME.togglePause();
    // the touches switched the page to touch: a mouse switches it back
    window.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'mouse', bubbles: true }));
    r.mouseBack = GAME.isTouch === false;
    // the map zooms, names its missions, and tells a beaten one from a new one
    GAME.bests = GAME.bests || {};
    var bestKeep = GAME.bests.race0;
    GAME.bests.race0 = 42;
    var blips = GAME.missions.getBlips().filter(function (b) { return b.name; });
    // ticked exactly where there is a best on file — groups before this one
    // pass missions of their own, so the set is read, not assumed
    var beaten = GAME.missions.DEFS.filter(function (d) { return GAME.bests[d.id] !== undefined; }).map(function (d) { return d.name; });
    r.blips = { named: blips.length, done: blips.filter(function (b) { return b.done; }).map(function (b) { return b.name; }) };
    r.blips.match = blips.every(function (b) { return b.done === (beaten.indexOf(b.name) >= 0); }) &&
      r.blips.done.indexOf('STRIP SPRINT') >= 0 && r.blips.done.length < r.blips.named;
    if (bestKeep === undefined) delete GAME.bests.race0; else GAME.bests.race0 = bestKeep;
    H.toggleMap(true);
    H.mapZoom(1.5); H.mapZoom(1.5);
    r.zoom = H.mapZoomLevel;
    H.mapZoom(1 / 10);
    r.zoomBack = H.mapZoomLevel;
    H.toggleMap(false);
    var legend = Array.prototype.map.call(document.querySelectorAll('#map-legend .lgd'), function (e) {
      return { k: e.getAttribute('data-k'), c: e.querySelector('i').style.background };
    });
    function col(k) { return (legend.filter(function (l) { return l.k === k; })[0] || {}).c; }
    r.colours = { courier: col('courier'), armor: col('armor'), rampage: col('rampage'), hospital: col('hospital'), dest: col('dest') };
    r.legendUnique = legend.length > 0 && legend.every(function (a, i) { return legend.every(function (b, j) { return i === j || a.c !== b.c; }); });
    // the radio remembers each car's dial, and the dial has an OFF
    var R = GAME.audio.radio;
    var carA = GAME.test.spawnCar('sedan', 4, 0), carB = GAME.test.spawnCar('sedan', -4, 0);
    GAME.test.fastForward(0.2);
    GAME.test.enterNearestCar(carA); GAME.test.fastForward(1.2);
    for (var k = 0; k < 6 && !R.off; k++) GAME.switchRadio(1);
    r.offName = R.name;
    GAME.exitCar(); GAME.test.fastForward(0.6);
    GAME.test.enterNearestCar(carB); GAME.test.fastForward(1.2);
    r.otherCar = R.name;
    GAME.exitCar(); GAME.test.fastForward(0.6);
    GAME.test.enterNearestCar(carA); GAME.test.fastForward(1.2);
    r.backInA = R.name;
    GAME.exitCar(); GAME.test.fastForward(0.3);
    GAME.vehicles.removeCar(carA); GAME.vehicles.removeCar(carB);
    // a save with a bed in it starts the next session there
    var sh = GAME.shops.locations().filter(function (l) { return l.kind === 'safehouse'; })[0];
    var owned0 = (GAME.prefs.safehouses || []).slice(), last0 = GAME.prefs.lastHome;
    GAME.prefs.safehouses = [];
    r.noHome = GAME.shops.startSpawn();
    GAME.prefs.safehouses = [sh.sh.id]; GAME.prefs.lastHome = sh.sh.id;
    var home = GAME.shops.startSpawn();
    r.home = home ? { name: home.name, near: Math.hypot(home.x - sh.sh.at.x, home.z - sh.sh.at.z) < 1 } : null;
    GAME.prefs.safehouses = owned0; GAME.prefs.lastHome = last0;
    // SHAKE: OFF holds the picture still through a knock. Measured against
    // the same twenty frames with no knock at all: the camera is still
    // settling from the car this group just stepped out of, and that
    // movement (anywhere from 0.002 to 0.022 m a frame, run to run) is not
    // shake and was being scored as if it were.
    function jitter(k) {
      var xs = [];
      for (var f = 0; f < 20; f++) { GAME.cameraShake = k; GAME.test.fastForward(1 / 60); xs.push(GAME.cameraObj.position.y); }
      var m = 0; for (var q = 1; q < xs.length; q++) m = Math.max(m, Math.abs(xs[q] - xs[q - 1]));
      return m;
    }
    GAME.godMode = true;
    GAME.test.fastForward(1.5);
    r.shakeBase = +jitter(0).toFixed(3);
    r.shakeOn = +jitter(0.9).toFixed(3);
    GAME.prefs.noShake = true;
    // (a few frames for the camera to ease back from the shaken ones, with
    // the knock still going, before the still frames are the ones measured)
    for (var sf = 0; sf < 15; sf++) { GAME.cameraShake = 0.9; GAME.test.fastForward(1 / 60); }
    r.shakeOff = +jitter(0.9).toFixed(3);
    GAME.prefs.noShake = false;
    GAME.cameraShake = 0;
    GAME.godMode = false;
    // graphics: three steps, back to where it was
    var pr0 = GAME.renderer.getPixelRatio(), fog0 = GAME.scene.fog.far, b0 = GAME.perf.budget(20);
    GAME.setQuality('low', true);
    r.low = { pr: +(GAME.renderer.getPixelRatio() / pr0).toFixed(2), fog: +(GAME.scene.fog.far / fog0).toFixed(2), crowd: GAME.perf.budget(20) / b0 };
    GAME.setQuality('high', true);
    r.highBack = GAME.renderer.getPixelRatio() === pr0 && GAME.scene.fog.far === fog0;
    // a device under 12 fps is still measured, and the crowd thins for it
    GAME.perf.testReset();
    for (var fr = 0; fr < 60; fr++) GAME.perf.sample(120);
    GAME.perf.update(4);
    r.slowScale = GAME.perf.scale;
    GAME.perf.testReset();
    // which way it came from: a hit from the camera's right lights the right
    var f0 = GAME.focus(), yaw = GAME.cam.yaw;
    P.health = 100;
    GAME.playerDamage(1, 'test', f0.x - Math.cos(yaw) * 10, f0.z + Math.sin(yaw) * 10);
    var m = /rotate\(([-0-9.]+)rad\)/.exec($('hit-dir').style.transform);
    r.hitAngle = m ? +m[1] : null;
    r.hitShown = $('hit-dir').style.opacity === '1';
    // and below a quarter of your health the edges pulse
    P.health = 12; GAME.test.fastForward(0.1);
    r.lowOn = $('low-health').style.display;
    // for ten seconds, not for ever: then it fades, and a fresh hit lights it
    var lc = function () { return $('low-health').classList.contains('spent'); };
    GAME.test.fastForward(9); r.lowStill = !lc();
    GAME.test.fastForward(1.5); r.lowFaded = lc();
    P.health = 10; GAME.test.fastForward(0.1); r.lowRelit = !lc();
    P.health = 100; GAME.test.fastForward(0.1);
    r.lowOff = $('low-health').style.display;
    // no fullscreen API (an iPhone): the button says what does work instead
    var can0 = GAME.canFullscreen;
    GAME.canFullscreen = false;
    window.__msgs = [];
    GAME.toggleFullscreen();
    r.iphone = window.__msgs.some(function (t) { return t.indexOf('Add to Home Screen') >= 0; });
    GAME.canFullscreen = can0;
    GAME.test.fastForward(1);
    return r;
  });
  check('ux: messages stack, newest last, and a repeat does not double up',
    ux.three.join() === 'one,two,three' && ux.four.join() === 'two,three,four', JSON.stringify([ux.three, ux.four]));
  check('ux: the district name sits under a running mission title, and back up after',
    ux.zoneTop >= ux.missionBottom && ux.zoneBack < ux.missionBottom, 'zone at ' + ux.zoneTop + ' px, mission ends at ' + ux.missionBottom + ', back to ' + ux.zoneBack);
  check('ux: the overlay screens use the game face, not Times New Roman',
    ux.fonts.every(function (f) { return /Arial|Segoe|Helvetica/.test(f); }), JSON.stringify(ux.fonts));
  check('ux: the controls hint is at least 13 px', ux.hintPx >= 13, ux.hintPx + ' px');
  check('ux: the title says LOADING until it can answer, then asks for a press',
    /id="press-enter" class="loading"/.test(html) && ux.title.cls.indexOf('loading') < 0 && /PRESS ENTER|TAP TO START/.test(ux.title.text),
    JSON.stringify(ux.title));
  check('ux: a click just beside a pause button does not resume', ux.stillPaused);
  check('ux: a click or a tap on the empty pause screen resumes, a scrolling drag does not',
    ux.clickResumed && ux.dragStill && ux.tapResumed && ux.mouseBack,
    'click=' + ux.clickResumed + ' drag stays=' + ux.dragStill + ' tap=' + ux.tapResumed + ' mouse back=' + ux.mouseBack);
  check('ux: the pause menu answers the arrows and Enter — down the menu, into a card and back out',
    ux.lit === 'pause-map' && ux.settingsOpen && ux.inCard === 'pause-mute' && ux.backOut === 'ptab-settings' && ux.resumedByEnter,
    JSON.stringify({ lit: ux.lit, open: ux.settingsOpen, inCard: ux.inCard, back: ux.backOut, resumed: ux.resumedByEnter }));
  check('ux: no mouse capture says CLICK TO LOOK AROUND, but not under an overlay',
    ux.lockHint === 'block' && ux.lockHintUnderPause === 'none', 'playing=' + ux.lockHint + ' paused=' + ux.lockHintUnderPause);
  check('ux: the map names its missions and marks the beaten ones',
    ux.blips.named >= 5 && ux.blips.match, JSON.stringify(ux.blips));
  check('ux: the map zooms in and back out', ux.zoom > 2 && ux.zoomBack === 1, 'in=' + ux.zoom + ' out=' + ux.zoomBack);
  check('ux: no two map families share a colour (armour was the courier cyan)',
    ux.legendUnique && ux.colours.armor !== ux.colours.courier, JSON.stringify(ux.colours));
  check('ux: the radio has an OFF, and a car keeps its own dial',
    ux.offName === 'RADIO OFF' && ux.otherCar !== 'RADIO OFF' && ux.backInA === 'RADIO OFF',
    'set ' + ux.offName + ', other car ' + ux.otherCar + ', back in the first ' + ux.backInA);
  check('ux: a save with a bed starts at that bed, one without on the strip',
    ux.noHome === null && ux.home && ux.home.near, JSON.stringify([ux.noHome, ux.home]));
  check('ux: SHAKE: OFF holds the camera still through a knock',
    ux.shakeOn - ux.shakeBase > 0.02 && ux.shakeOff - ux.shakeBase < (ux.shakeOn - ux.shakeBase) / 3,
    'frame-to-frame jitter with no knock=' + ux.shakeBase + ' on=' + ux.shakeOn + ' off=' + ux.shakeOff);
  check('ux: GFX LOW lowers resolution, draw distance and crowd, and HIGH puts them back',
    ux.low.pr < 0.7 && ux.low.fog < 0.8 && ux.low.crowd < 0.7 && ux.highBack, JSON.stringify(ux.low) + ' back=' + ux.highBack);
  check('ux: a machine under 12 fps still thins the crowd', ux.slowScale < 1, 'scale=' + ux.slowScale);
  check('ux: a hit from the right lights the right of the ring',
    ux.hitShown && ux.hitAngle !== null && Math.abs(ux.hitAngle - Math.PI / 2) < 0.15, 'angle=' + ux.hitAngle);
  check('ux: low health pulses the edges, and stops when patched up',
    ux.lowOn === 'block' && ux.lowOff === 'none', ux.lowOn + ' / ' + ux.lowOff);
  check('ux: the low-health pulse runs ten seconds, then fades — and a fresh hit lights it again',
    ux.lowStill && ux.lowFaded && ux.lowRelit, JSON.stringify({ still: ux.lowStill, faded: ux.lowFaded, relit: ux.lowRelit }));
  check('ux: with no fullscreen API the button says Add to Home Screen', ux.iphone);

  // ---------- 5a: the bigger gaps ----------
  // Section 3 of the gameplay audit, and the economy decision from section 2.
  //
  // Completion used to pin your cash at $9,999,999 for good, so nothing cost
  // anything again. It pays a million dollars once instead.
  var econ = await page.evaluate(function () {
    var M = GAME.missions, P = GAME.player, r = {};
    var bests0 = GAME.bests, complete0 = GAME.prefs.gameComplete, cash0 = P.cash;
    var ammo0 = GAME.unlimitedAmmo, weapons0 = JSON.stringify(P.weapons), cur0 = P.currentWeapon;
    var desc = Object.getOwnPropertyDescriptor(GAME.stunts, 'complete');
    var descI = Object.getOwnPropertyDescriptor(GAME.stunts, 'islaComplete');
    var descT = Object.getOwnPropertyDescriptor(GAME.tapes, 'complete');
    var gun0 = GAME.city.unlockGunship;
    try {
      GAME.bests = {};
      M.DEFS.forEach(function (d) { GAME.bests[d.id] = 1; });
      Object.defineProperty(GAME.stunts, 'complete', { get: function () { return true; }, configurable: true });
      // (and the island jumps and the lost tapes — a hundred per cent is all of it)
      Object.defineProperty(GAME.stunts, 'islaComplete', { get: function () { return true; }, configurable: true });
      Object.defineProperty(GAME.tapes, 'complete', { get: function () { return true; }, configurable: true });
      GAME.city.unlockGunship = function () {};
      delete GAME.prefs.gameComplete;
      P.cash = 1000;
      GAME.unlimitedAmmo = false;
      r.first = M.checkCompletion();
      r.paid = P.cash - 1000;
      // ...and unlimited ammo, which used to be the stunt jumps' prize
      r.unlimited = GAME.unlimitedAmmo === true && P.weapons.rifle && P.weapons.rifle.have;
      if (GAME.hud.dialogOpen()) GAME.hud.dialogKey('Enter');
      M.checkCompletion();
      r.paidTwice = P.cash - 1000 - r.paid;
      P.cash = 500;
      GAME.test.fastForward(6);
      r.cashAfter = P.cash;
    } finally {
      GAME.bests = bests0;
      if (complete0 === undefined) delete GAME.prefs.gameComplete; else GAME.prefs.gameComplete = complete0;
      Object.defineProperty(GAME.stunts, 'complete', desc);
      Object.defineProperty(GAME.stunts, 'islaComplete', descI);
      Object.defineProperty(GAME.tapes, 'complete', descT);
      GAME.city.unlockGunship = gun0;
      P.cash = cash0;
      GAME.hud.cashChanged();
      GAME.unlimitedAmmo = ammo0;
      P.weapons = JSON.parse(weapons0, function (k, v) { return k === 'ammo' && v === null ? Infinity : v; });
      P.currentWeapon = cur0;
      GAME.combat.refreshWeaponHud();
    }
    return r;
  });
  check('economy: completing everything pays a million, once',
    econ.first === true && econ.paid === 1000000 && econ.paidTwice === 0, JSON.stringify(econ));
  check('economy: and finishing everything is what gives unlimited ammo', econ.unlimited, JSON.stringify(econ));
  check('economy: and money still means something afterwards', econ.cashAfter === 500, 'cash a few seconds later: ' + econ.cashAfter);

  // A day lasted two and a half minutes, the night only changed the light,
  // and it never rained. Now: a twelve-minute day; a night that hides you
  // better and empties the streets a little; and rain that greys the fog,
  // loosens the road and brings the odd fork of lightning.
  var wx = await page.evaluate(function () {
    var W = GAME.weather, P = GAME.player, C = GAME.city, r = {};
    var mode0 = GAME.timeMode, phase0 = GAME.dayPhase;
    if (P.inCar) GAME.exitCar();
    GAME.police.clearWanted();
    r.day = GAME.DAY_SECONDS;
    GAME.setTimeMode('auto');
    var ph = GAME.dayPhase;
    GAME.test.fastForward(60);
    r.phaseIn60 = +(((GAME.dayPhase - ph) + 1) % 1).toFixed(4);
    // a witness 22 m down an open street: seen by day, not by night
    GAME.test.teleport(-150 + 3.1, -40);
    GAME.test.fastForward(0.3);
    function seenAt(night) {
      GAME.setTimeMode(night ? 'night' : 'day');
      GAME.police.clearWanted();
      GAME.world.peds.slice().forEach(function (p) { if (Math.hypot(p.pos.x - P.pos.x, p.pos.z - P.pos.z) < 60) GAME.peds.removePed(p); });
      var w = GAME.peds.spawnPed(P.pos.x, P.pos.z + 22);
      w.state = 'idle'; w.speed = 0;
      GAME.police.reportCrime('hit_ped', { x: P.pos.x, z: P.pos.z });
      var h = GAME.police.heat;
      GAME.peds.removePed(w);
      GAME.police.clearWanted();
      return h;
    }
    r.heatDay = seenAt(false);
    r.heatNight = seenAt(true);
    r.visDay = (GAME.setTimeMode('day'), +W.visibility().toFixed(2));
    r.visNight = (GAME.setTimeMode('night'), +W.visibility().toFixed(2));
    r.crowdNight = +W.crowd().toFixed(2);
    // rain: the fog closes in, the road loosens, the streaks show
    GAME.setTimeMode('day');
    var far0 = GAME.scene.fog.far;
    function slide(wet) {
      // The street to itself: a passing car or a walker in the line of the
      // slide pushed the car and took the slip with it (wet 5.46 against a
      // steady 5.87 once on CI, under the 10% the check asks for). And the
      // weather holds whatever was set — under CLEAR the rain was easing off
      // through the run.
      GAME.world.cars.slice().forEach(function (c) { if (Math.hypot(c.pos.x + 150 - 3.1, c.pos.z + 200) < 140) GAME.vehicles.removeCar(c); });
      GAME.world.peds.slice().forEach(function (p) { if (Math.hypot(p.pos.x + 150 - 3.1, p.pos.z + 200) < 140) GAME.peds.removePed(p); });
      W.setMode(wet ? 'rain' : 'clear', true);
      W.testSet(wet);
      GAME.test.fastForward(0.1);
      var car = GAME.vehicles.spawnCar('sedan', -150 + 3.1, -200, 0, {});
      GAME.seatInCar(car);
      car.pos.set(-150 + 3.1, C.groundY(-150 + 3.1, -200), -200);
      car.heading = 0; car.speed = 22; car.lat = 0; car.vy = 0;
      var maxLat = 0;
      GAME.test.pressKey('KeyW'); GAME.test.pressKey('KeyD');
      for (var i = 0; i < 30; i++) {
        GAME.test.fastForward(1 / 60);
        maxLat = Math.max(maxLat, Math.abs(car.lat));
      }
      GAME.test.pressKey('KeyW', false); GAME.test.pressKey('KeyD', false);
      car.speed = 0;
      GAME.exitCar();
      GAME.vehicles.removeCar(car);
      return maxLat;
    }
    r.slideDry = +slide(0).toFixed(2);
    r.slideWet = +slide(1).toFixed(2);
    W.setMode('rain', true);
    W.testSet(1);
    GAME.test.fastForward(0.2);
    r.fogWet = +(GAME.scene.fog.far / far0).toFixed(2);
    var lines = null;
    GAME.scene.children.forEach(function (o) { if (o.isLineSegments && o.material && o.material.color && o.material.color.getHex() === 0xa9bedc) lines = o; });
    r.streaks = !!(lines && lines.visible && lines.material.opacity > 0.2);
    r.crowdRain = +W.crowd().toFixed(2);
    var flashed = false;
    for (var t = 0; t < 45 * 10 && !flashed; t++) { GAME.test.fastForward(0.1); if (W.flash > 0) flashed = true; }
    r.lightning = flashed;
    // and back to how the suite runs
    W.setMode('clear', true);
    W.testSet(0);
    GAME.test.fastForward(0.2);
    r.dryAgain = !(lines && lines.visible) && Math.abs(GAME.scene.fog.far - far0) < 1;
    GAME.setTimeMode(mode0);
    GAME.dayPhase = phase0;
    return r;
  });
  check('time: a day lasts twelve minutes, not two and a half',
    wx.day === 720 && Math.abs(wx.phaseIn60 - 60 / 720) < 0.002, 'day=' + wx.day + ' s, a minute moved the clock ' + wx.phaseIn60);
  check('time: night hides you — a witness who sees it by day misses it at night',
    wx.heatDay > 0 && wx.heatNight === 0 && wx.visNight < wx.visDay, JSON.stringify(wx));
  check('time: and the streets are emptier at night', wx.crowdNight < 0.8, 'crowd x' + wx.crowdNight);
  check('weather: rain loosens the road', wx.slideWet > wx.slideDry * 1.1, 'sideways slip dry=' + wx.slideDry + ' wet=' + wx.slideWet);
  check('weather: closes in the fog and shows its streaks', wx.fogWet < 0.75 && wx.streaks, 'fog x' + wx.fogWet + ' streaks=' + wx.streaks);
  check('weather: sends people indoors', wx.crowdRain < 0.7, 'crowd x' + wx.crowdRain);
  check('weather: a downpour brings lightning', wx.lightning);
  check('weather: and clears back to how it was', wx.dryAgain);

  // Flying: the edges of the map stopped an aircraft dead in mid-air with no
  // word on three sides, and there was no ceiling, so a climb went on until
  // the ground faded into the fog and there was nothing left to see.
  var fly = await page.evaluate(function () {
    var P = GAME.player, r = {};
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    function board(type, x, z, y, heading) {
      if (P.inCar) { var old = P.car; GAME.exitCar(); GAME.vehicles.removeCar(old); }
      GAME.test.teleport(x, z);
      var c = GAME.vehicles.spawnCar(type, x, z, heading, {});
      GAME.seatInCar(c);
      c.pos.y = y; c.heading = heading;
      return c;
    }
    window.__msgs = [];
    // a helicopter at the west edge, nose west, stick forward
    var E = GAME.aircraft.edges();
    var h = board('helicopter', E.west + 44, 0, 60, -Math.PI / 2);
    GAME.test.pressKey('KeyW');
    var minX = h.pos.x;
    for (var i = 0; i < 60 * 10; i++) { GAME.test.fastForward(1 / 60); minX = Math.min(minX, h.pos.x); }
    GAME.test.pressKey('KeyW', false);
    r.heli = { minX: +minX.toFixed(1), endX: +h.pos.x.toFixed(1), facing: +Math.sin(h.heading).toFixed(2) };
    r.toldEdge = window.__msgs.some(function (m) { return m.indexOf('Edge of the map') >= 0; });
    // the ceiling, climbing flat out for a minute
    window.__msgs = [];
    h = board('helicopter', 0, 0, 150, 0);
    GAME.test.pressKey('Space');
    var top = 0;
    for (var j = 0; j < 60 * 40; j++) { GAME.test.fastForward(1 / 60); top = Math.max(top, h.pos.y); }
    GAME.test.pressKey('Space', false);
    r.heliTop = +top.toFixed(1);
    r.toldCeiling = window.__msgs.some(function (m) { return m.indexOf('too thin') >= 0; });
    // a plane, flying at the north edge
    var pl = board('airplane', 0, E.closed.minZ + 54, 120, Math.PI);
    pl.speed = 45; pl.pitch = 0; pl.roll = 0;
    var minZ = pl.pos.z;
    for (var k = 0; k < 60 * 12; k++) { pl.speed = Math.max(pl.speed, 40); GAME.test.fastForward(1 / 60); minZ = Math.min(minZ, pl.pos.z); }
    r.plane = { minZ: +minZ.toFixed(1), endZ: +pl.pos.z.toFixed(1), alive: !pl.dead };
    // and climbing hard into its ceiling
    pl = board('airplane', 0, 0, 200, 0);
    pl.speed = 60; pl.pitch = 0.6; pl.roll = 0;
    var ptop = 0;
    for (var q = 0; q < 60 * 10; q++) { pl.speed = Math.max(pl.speed, 50); GAME.test.fastForward(1 / 60); ptop = Math.max(ptop, pl.pos.y); }
    r.planeTop = +ptop.toFixed(1);
    // set everything down
    var last = P.car;
    GAME.exitCar();
    if (last) GAME.vehicles.removeCar(last);
    GAME.test.teleport(-150 + 3.1, -40);
    P.velY = 0; P.airborne = false; P.parachuting = false;
    if (GAME.aircraft.land) GAME.aircraft.land();
    GAME.test.fastForward(1);
    P.health = 100;
    return r;
  });
  check('fly: a helicopter at the map edge is brought round, not frozen there',
    fly.heli.endX > fly.heli.minX + 20 && fly.heli.facing > 0 && fly.toldEdge, JSON.stringify(fly.heli) + ' told=' + fly.toldEdge);
  check('fly: so is a plane', fly.plane.alive && fly.plane.endZ > fly.plane.minZ + 30, JSON.stringify(fly.plane));
  check('fly: a helicopter stops climbing at its ceiling, and says why',
    fly.heliTop <= 201 && fly.heliTop > 190 && fly.toldCeiling, 'topped out at ' + fly.heliTop + ' m, told=' + fly.toldCeiling);
  check('fly: so does a plane', fly.planeTop <= 242, 'topped out at ' + fly.planeTop + ' m');

  // On foot: the lock re-picked on any camera turn of three degrees and never
  // turned the view after its target; and nothing over a jump's 1.2 m could
  // be climbed at all.
  var foot = await page.evaluate(function () {
    var P = GAME.player, C = GAME.city, I = GAME.input, r = {};
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    var x = -150 + 3.1, z = -40;
    GAME.test.teleport(x, z);
    GAME.world.peds.slice().forEach(function (p) { if (Math.hypot(p.pos.x - x, p.pos.z - z) < 70) GAME.peds.removePed(p); });
    GAME.test.fastForward(0.2);
    P.heading = GAME.cam.yaw = 0;
    function stand(px, pz) { var p = GAME.peds.spawnPed(px, pz); p.state = 'idle'; p.speed = 0; p.temper = 0; return p; }
    // A dead ahead, B just right of A, C well off to the left
    var A = stand(x, z + 12), B = stand(x - 12 * Math.sin(0.12), z + 12 * Math.cos(0.12)), Cc = stand(x + 12 * Math.sin(1.25), z + 12 * Math.cos(1.25));
    function hold() { [A, B, Cc].forEach(function (p) { p.speed = 0; if (p.state !== 'idle') p.state = 'idle'; }); }
    I.rmb = true;
    for (var i = 0; i < 10; i++) { hold(); GAME.test.fastForward(1 / 60); }
    r.first = GAME.combat.lockTarget === A;
    // a nudge toward B: it is now nearer the line than A is
    GAME.cam.yaw -= 0.08;
    for (var j = 0; j < 20; j++) { hold(); GAME.test.fastForward(1 / 60); }
    r.heldThroughNudge = GAME.combat.lockTarget === A;
    // A walks off to the left; the view goes with it
    for (var k = 0; k < 60; k++) { hold(); A.pos.x += 6 / 60; GAME.test.fastForward(1 / 60); }
    var bearing = Math.atan2(A.pos.x - P.pos.x, A.pos.z - P.pos.z);
    r.followGap = +Math.abs(U.wrapPI(GAME.cam.yaw - bearing)).toFixed(3);
    r.stillA = GAME.combat.lockTarget === A;
    // a real flick, round to C
    GAME.cam.yaw = Math.atan2(Cc.pos.x - P.pos.x, Cc.pos.z - P.pos.z);
    for (var q = 0; q < 10; q++) { hold(); GAME.test.fastForward(1 / 60); }
    r.flickToC = GAME.combat.lockTarget === Cc;
    I.rmb = false;
    GAME.test.fastForward(0.2);
    [A, B, Cc].forEach(function (p) { GAME.peds.removePed(p); });
    // climbing: something you could stand on, between waist and head height
    var ledge = null, tall = null;
    C.hash.all.forEach(function (b) {
      if (b.h === undefined || b.minY !== undefined || b.knock) return;
      if (b.tag !== 'building' && b.tag !== 'prop' && b.tag !== 'fence') return;
      var w = b.maxX - b.minX, d = b.maxZ - b.minZ;
      if (w < 3 || d < 2) return;
      var fx = (b.minX + b.maxX) / 2, fz = b.minZ - 1.2;   // stood off its north face
      if (C.isInWater(fx, fz) || C.groundY(fx, fz) !== 0) return;
      if (C.hash.query(fx, fz, 0.6).length) return;
      if (!ledge && b.h >= 1.6 && b.h <= 2.5) ledge = { b: b, x: fx, z: fz };
      if (!tall && b.h >= 3.5 && b.h <= 8) tall = { b: b, x: fx, z: fz };
    });
    function climb(t) {
      GAME.test.teleport(t.x, t.z);
      P.heading = GAME.cam.yaw = 0;   // facing +z, into the face
      GAME.test.fastForward(0.3);
      GAME.test.pressKey('KeyW');     // walk up against it
      GAME.test.fastForward(0.6);
      GAME.test.pressKey('Space');
      GAME.test.fastForward(1 / 60);
      GAME.test.pressKey('Space', false);
      GAME.test.pressKey('KeyW', false);
      GAME.test.fastForward(1.2);
      return { h: t.b.h, y: +P.pos.y.toFixed(2) };
    }
    r.ledge = ledge ? climb(ledge) : null;
    r.tall = tall ? climb(tall) : null;
    GAME.test.teleport(x, z);
    GAME.test.fastForward(0.5);
    return r;
  });
  check('lock: aiming locks the one ahead (anchor sanity)', foot.first, JSON.stringify(foot));
  check('lock: a nudge of the mouse does not hand it to the person beside them', foot.heldThroughNudge);
  check('lock: the view follows the target as it moves', foot.stillA && foot.followGap < 0.12, 'off by ' + foot.followGap + ' rad');
  check('lock: a real flick moves it to whoever you flicked to', foot.flickToC);
  check('climb: jump at a ledge above your head and you pull yourself up',
    !!foot.ledge && Math.abs(foot.ledge.y - foot.ledge.h) < 0.1, JSON.stringify(foot.ledge));
  check('climb: but not up a sheer wall', !!foot.tall && foot.tall.y < 1.5, JSON.stringify(foot.tall));

  // Pop-in: traffic and people were made at a random bearing 60-150 m out, so
  // a third of them appeared out of nothing in plain view. Everything new
  // that turns up is caught here on the tick it appears and asked whether
  // the camera could see that spot.
  var pop = await page.evaluate(function () {
    var P = GAME.player, C = GAME.city, S = GAME.settings, r = {};
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    var mode0 = GAME.timeMode;
    GAME.setTimeMode('day');
    var x = -150 + 3.1, z = -260;
    GAME.test.teleport(x, z);
    // up the long street, and let the camera settle there first: a spawn is
    // judged from where the camera was on the tick it happened
    for (var st = 0; st < 90; st++) { P.heading = GAME.cam.yaw = 0; GAME.test.fastForward(1 / 60); }
    var cam = GAME.cameraObj, fr = new THREE.Frustum(), pm = new THREE.Matrix4(), sp = new THREE.Sphere();
    function seen(o) {
      cam.updateMatrixWorld();
      var dx = o.pos.x - cam.position.x, dz = o.pos.z - cam.position.z;
      if (Math.sqrt(dx * dx + dz * dz) > GAME.scene.fog.far * 0.9) return false;
      pm.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
      (fr.setFromProjectionMatrix || fr.setFromMatrix).call(fr, pm);
      sp.center.set(o.pos.x, o.pos.y + 1, o.pos.z); sp.radius = 1;
      return fr.intersectsSphere(sp) && C.hash.segmentClear(cam.position.x, cam.position.z, o.pos.x, o.pos.z, cam.position.y);
    }
    var cars = 0, carsSeen = 0, peds = 0, pedsSeen = 0;
    var knownC = new Set(GAME.world.cars), knownP = new Set(GAME.world.peds);
    for (var round = 0; round < 3; round++) {
      // clear the street out so the bubble has to refill it
      GAME.world.cars.slice().forEach(function (c) { if (c.ai && c.ai.mode === 'traffic') GAME.vehicles.removeCar(c); });
      GAME.world.peds.slice().forEach(function (p) { if (!p.isCop) GAME.peds.removePed(p); });
      for (var t = 0; t < 60 * 8; t++) {
        P.heading = GAME.cam.yaw = 0;
        GAME.test.fastForward(1 / 60);
        GAME.world.cars.forEach(function (c) {
          if (knownC.has(c)) return; knownC.add(c);
          if (!(c.ai && c.ai.mode === 'traffic')) return;
          cars++; if (seen(c)) carsSeen++;
        });
        GAME.world.peds.forEach(function (p) {
          if (knownP.has(p)) return; knownP.add(p);
          if (p.isCop) return;
          peds++; if (seen(p)) { pedsSeen++; (r.pedAt = r.pedAt || []).push([Math.round(p.pos.x), Math.round(p.pos.z), p.state, round, t]); }
        });
      }
    }
    r.cars = cars; r.carsSeen = carsSeen; r.peds = peds; r.pedsSeen = pedsSeen;
    GAME.setTimeMode(mode0);
    return r;
  });
  check('pop-in: the street refills (anchor sanity)', pop.cars >= 10 && pop.peds >= 10, JSON.stringify(pop));
  check('pop-in: no car appears where you are looking', pop.carsSeen === 0, pop.carsSeen + ' of ' + pop.cars + ' new cars appeared in view');
  check('pop-in: nor does anybody on foot', pop.pedsSeen === 0, pop.pedsSeen + ' of ' + pop.peds + ' new people appeared in view');

  // Traffic was passive: it sat behind anything stopped in its lane for as
  // long as it stayed there, never sounded a horn, and drove on as if nothing
  // had happened when you rammed it.
  var trf = await page.evaluate(function () {
    var P = GAME.player, C = GAME.city, S = GAME.settings, V = GAME.vehicles, r = {};
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    var keep = { t: S.maxTraffic, p: S.maxParked };
    S.maxTraffic = 0; S.maxParked = 0;
    var X = -150 + 3.1;   // the +z lane of the x = -150 street
    function clearStreet() {
      GAME.world.cars.slice().forEach(function (c) { if (c !== P.car && Math.hypot(c.pos.x + 150, c.pos.z) < 160) V.removeCar(c); });
    }
    var horns = 0, horn0 = GAME.audio.horn;
    GAME.audio.horn = function () { horns++; return horn0.apply(GAME.audio, arguments); };
    try {
      GAME.test.teleport(-150 - 12, -60);
      clearStreet();
      GAME.test.fastForward(0.2);
      // a van left in the lane, and a driver coming up behind it
      var van = V.spawnCar('van', X, 0, 0, {});
      var car = V.spawnCar('sedan', X, -45, 0, { occupied: 'ai', ai: { mode: 'traffic', desired: 11, laneX: 0, laneZ: 0 } });
      var top = car.pos.z;
      for (var t = 0; t < 60 * 18; t++) { GAME.test.fastForward(1 / 60); top = Math.max(top, car.pos.z); if (top > 20) break; }
      r.passed = { top: +top.toFixed(1), vanAt: +van.pos.z.toFixed(1) };
      V.removeCar(van); V.removeCar(car);
      // held up by you, in your car, stopped in their lane
      clearStreet();
      var mine = V.spawnCar('sedan', X, 0, 0, {});
      GAME.seatInCar(mine);
      mine.pos.set(X, C.groundY(X, 0), 0); mine.speed = 0;
      horns = 0;
      var behind = V.spawnCar('sedan', X, -30, 0, { occupied: 'ai', ai: { mode: 'traffic', desired: 11, laneX: 0, laneZ: 0 } });
      for (var u = 0; u < 60 * 6; u++) { mine.speed = 0; GAME.test.fastForward(1 / 60); }
      r.hornsBehindYou = horns;
      V.removeCar(behind);
      // rammed by you
      clearStreet();
      var victim = V.spawnCar('sedan', X, 30, 0, { occupied: 'ai', ai: { mode: 'traffic', desired: 9, laneX: 0, laneZ: 0 } });
      victim.speed = 4;
      mine.pos.set(X, C.groundY(X, 14), 14); mine.heading = 0; mine.speed = 22; mine.lat = 0;
      horns = 0;
      for (var w = 0; w < 60 * 2; w++) GAME.test.fastForward(1 / 60);
      // a driver who got out has no AI left to read, so out counts as answering
      var out = victim.occupied !== 'ai';
      r.rammed = { horns: horns, reacted: out || !!(victim.ai && victim.ai.reacted), fled: !!(victim.ai && victim.ai.panicT > 0), driverOut: out };
      GAME.exitCar();
      V.removeCar(mine); V.removeCar(victim);
      GAME.world.peds.slice().forEach(function (p) { if (Math.hypot(p.pos.x + 150, p.pos.z - 20) < 40) GAME.peds.removePed(p); });
    } finally {
      GAME.audio.horn = horn0;
      S.maxTraffic = keep.t; S.maxParked = keep.p;
      GAME.police.clearWanted();
    }
    GAME.test.fastForward(0.3);
    return r;
  });
  check('traffic: a car stopped in the lane gets driven round, not queued behind for good',
    trf.passed.top > 15 && Math.abs(trf.passed.vanAt) < 2, JSON.stringify(trf.passed) + ' (the van must not have been shoved along)');
  check('traffic: held up by you, they lean on the horn', trf.hornsBehindYou >= 1, 'horns=' + trf.hornsBehindYou);
  check('traffic: ram one and it answers — the horn, then off or out',
    trf.rammed.horns >= 1 && trf.rammed.reacted && (trf.rammed.fled || trf.rammed.driverOut), JSON.stringify(trf.rammed));

  // A stolen cruiser had a dead lightbar, no siren and no job; and nobody,
  // the player included, had a horn.
  var cop = await page.evaluate(function () {
    var P = GAME.player, C = GAME.city, S = GAME.settings, V = GAME.vehicles, M = GAME.missions, r = {};
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    if (M.active) M.failActive('test');
    var keep = { t: S.maxTraffic, p: S.maxParked };
    S.maxTraffic = 0; S.maxParked = 0;
    var X = -150 + 3.1;
    GAME.world.cars.slice().forEach(function (c) { if (Math.hypot(c.pos.x + 150, c.pos.z) < 160) V.removeCar(c); });
    var horns = 0, sirens = 0, horn0 = GAME.audio.horn, siren0 = GAME.audio.siren, hold0 = GAME.audio.hornHold;
    GAME.audio.horn = function () { horns++; return horn0.apply(GAME.audio, arguments); };
    // (the player's own is held: it counts when it starts sounding)
    GAME.audio.hornHold = function (on) { if (on) horns++; return hold0.apply(GAME.audio, arguments); };
    GAME.audio.siren = function (v) { if (v > 0) sirens++; return siren0.apply(GAME.audio, arguments); };
    try {
      // a horn in an ordinary car
      var sed = V.spawnCar('sedan', X, -60, 0, {});
      GAME.seatInCar(sed);
      GAME.test.pressKey('KeyG'); GAME.test.fastForward(1 / 60); GAME.test.pressKey('KeyG', false);
      r.horn = horns;
      GAME.exitCar(); V.removeCar(sed);
      // the cruiser: lights and siren
      var cr = V.spawnCar('police', X, -60, 0, {});
      GAME.seatInCar(cr);
      GAME.test.setWanted(1);   // you stole it
      sirens = 0;
      GAME.test.pressKey('KeyG'); GAME.test.fastForward(1 / 60); GAME.test.pressKey('KeyG', false);
      var flashes = {};
      for (var i = 0; i < 30; i++) { GAME.test.fastForward(1 / 60); flashes[String(cr.mesh.userData.lightbar[0].visible) + cr.mesh.userData.lightbar[1].visible] = 1; }
      r.siren = { on: cr.sirenOn, heard: sirens, flashing: Object.keys(flashes).length >= 2 };
      // traffic ahead in the lane pulls over for it
      var ahead = V.spawnCar('sedan', X, -35, 0, { occupied: 'ai', ai: { mode: 'traffic', desired: 11, laneX: 0, laneZ: 0 } });
      ahead.speed = 9;
      cr.speed = 12;
      for (var j = 0; j < 60 * 2; j++) GAME.test.fastForward(1 / 60);
      r.yield = { yieldT: +(ahead.ai.yieldT || 0).toFixed(2), speed: +ahead.speed.toFixed(1) };
      V.removeCar(ahead);
      cr.speed = 0;
      // vigilante, with the star still on you
      GAME.test.pressKey('KeyJ'); GAME.test.fastForward(1 / 60); GAME.test.pressKey('KeyJ', false);
      GAME.test.fastForward(0.2);
      var a = M.active;
      r.started = !!(a && a.def.id === 'vigilante' && a.perp);
      if (r.started) {
        var p = a.perp;
        cr.pos.set(p.pos.x - Math.sin(p.heading) * 25, C.groundY(p.pos.x, p.pos.z), p.pos.z - Math.cos(p.heading) * 25);
        cr.heading = p.heading;
        GAME.test.fastForward(0.2);
        r.fleeing = a.fleeing;
        V.damageCar(p, p.spec.hp * 0.7, cr);
        GAME.test.fastForward(0.2);
        r.taken = { earned: a.earned, level: a.level, stars: GAME.police.wanted, next: !!(a.perp && a.perp !== p) };
      }
      if (M.active) M.failActive('test');
      GAME.share.hide && GAME.share.hide();
      cr.sirenOn = false;
      GAME.exitCar(); V.removeCar(cr);
    } finally {
      GAME.audio.horn = horn0; GAME.audio.siren = siren0; GAME.audio.hornHold = hold0;
      S.maxTraffic = keep.t; S.maxParked = keep.p;
      GAME.police.clearWanted();
    }
    GAME.test.fastForward(0.5);
    return r;
  });
  check('cruiser: an ordinary car has a horn', cop.horn >= 1, 'horns=' + cop.horn);
  check('cruiser: G runs the lights and the siren', cop.siren.on && cop.siren.heard > 10 && cop.siren.flashing, JSON.stringify(cop.siren));
  check('cruiser: traffic ahead pulls over for it', cop.yield.yieldT > 0 && cop.yield.speed < 6, JSON.stringify(cop.yield));
  check('cruiser: J starts a vigilante shift, stars and all', cop.started, JSON.stringify(cop));
  check('cruiser: the suspect runs once they see you', cop.fleeing === true);
  check('cruiser: knock them about and they give it up — paid, a star off, next call',
    !!cop.taken && cop.taken.earned > 0 && cop.taken.level === 2 && cop.taken.stars === 0 && cop.taken.next, JSON.stringify(cop.taken));

  // Controls: no rebinding, one mouse speed, no invert, no field of view
  // and a controller did nothing.
  var ctl = await page.evaluate(function () {
    var P = GAME.player, Cs = GAME.controls, I = GAME.input, r = {};
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    GAME.test.teleport(-150 + 3.1, -40);
    GAME.test.fastForward(0.3);
    function key(type, code) { window.dispatchEvent(new KeyboardEvent(type, { code: code, bubbles: true })); }
    try {
      // rebinding: F moves to K, and the old key stops doing it
      Cs.bind('KeyF', 'KeyK');
      I.pressed = {};
      key('keydown', 'KeyK'); key('keyup', 'KeyK');
      r.vIsF = !!I.pressed.KeyF;
      I.pressed = {};
      key('keydown', 'KeyF'); key('keyup', 'KeyF');
      r.fIsNothing = !I.pressed.KeyF;
      // a key already in use swaps over rather than leaving a hole
      Cs.bind('KeyQ', 'KeyK');
      r.swap = { f: Cs.label('KeyF'), q: Cs.label('KeyQ') };
      GAME.test.fastForward(0.3);
      r.barSaysIt = (document.getElementById('controls-bar').innerHTML.indexOf('<b>Q</b> enter car') >= 0);
      Cs.reset();
      r.resetF = Cs.label('KeyF');
      // the mouse: twice the speed turns twice as far, and invert flips up
      function turn(dx, dy) {
        var y0 = GAME.cam.yaw, p0 = GAME.cam.pitch;
        I.mouseDX = dx; I.mouseDY = dy;
        GAME.test.fastForward(1 / 60);
        return { yaw: U.wrapPI(GAME.cam.yaw - y0), pitch: GAME.cam.pitch - p0 };
      }
      Cs.setSens(1); var a = turn(50, 0);
      Cs.setSens(2); var b = turn(50, 0);
      r.sensRatio = +(b.yaw / a.yaw).toFixed(2);
      Cs.setSens(1);
      GAME.cam.pitch = 0.5;
      var up = turn(0, 20);
      Cs.setInvertY(true);
      GAME.cam.pitch = 0.5;
      var inv = turn(0, 20);
      Cs.setInvertY(false);
      r.invert = up.pitch * inv.pitch < 0;
      Cs.setFov(80);
      r.fov = GAME.cameraObj.fov;
      Cs.setFov(62);
      // a controller: left stick walks, right stick looks, Start pauses
      var btn = function () { var a2 = []; for (var i = 0; i < 17; i++) a2.push({ pressed: false, value: 0 }); return a2; };
      var fake = { connected: true, axes: [0, -1, 0.8, 0], buttons: btn() };
      // a clear patch to walk in: on CI a passer-by (or a parked car) stood
      // in the way and the walk came up short at 1.6 m of the usual 3.1
      GAME.world.peds.slice().forEach(function (p) { if (Math.hypot(p.pos.x - P.pos.x, p.pos.z - P.pos.z) < 12) GAME.peds.removePed(p); });
      GAME.world.cars.slice().forEach(function (c) { if (c !== P.car && Math.hypot(c.pos.x - P.pos.x, c.pos.z - P.pos.z) < 14) GAME.vehicles.removeCar(c); });
      var gp0 = navigator.getGamepads;
      navigator.getGamepads = function () { return [fake]; };
      try {
        var x0 = P.pos.x, z0 = P.pos.z, y0 = GAME.cam.yaw;
        for (var t = 0; t < 60; t++) { Cs.poll(1 / 60); GAME.test.fastForward(1 / 60); }
        r.padWalked = +Math.hypot(P.pos.x - x0, P.pos.z - z0).toFixed(1);
        r.padLooked = +Math.abs(U.wrapPI(GAME.cam.yaw - y0)).toFixed(2);
        fake.axes = [0, 0, 0, 0];
        fake.buttons[9].pressed = true; Cs.poll(1 / 60);
        r.padPaused = GAME.paused === true;
        fake.buttons[9].pressed = false; Cs.poll(1 / 60);
        fake.buttons[9].pressed = true; Cs.poll(1 / 60);
        fake.buttons[9].pressed = false; Cs.poll(1 / 60);
        r.padResumed = GAME.paused === false;
        // and in a car, RT drives
        var car = GAME.test.spawnCar('sedan', 3, 0);
        GAME.seatInCar(car);
        fake.buttons[7].value = 1; fake.buttons[7].pressed = true;
        for (var u = 0; u < 60; u++) { Cs.poll(1 / 60); GAME.test.fastForward(1 / 60); }
        r.padDrove = +car.speed.toFixed(1);
        fake.buttons[7].value = 0; fake.buttons[7].pressed = false;
        Cs.poll(1 / 60);
        car.speed = 0;
        GAME.exitCar(); GAME.vehicles.removeCar(car);
      } finally {
        navigator.getGamepads = gp0;
        Cs.poll(1 / 60);
      }
    } finally {
      Cs.reset(); Cs.setSens(1); Cs.setInvertY(false); Cs.setFov(62);
      if (GAME.paused) GAME.togglePause();
    }
    GAME.test.fastForward(0.3);
    return r;
  });
  check('controls: a rebound key does the job, and the old one stops', ctl.vIsF && ctl.fIsNothing, JSON.stringify(ctl));
  check('controls: binding a key in use swaps it over', ctl.swap.f === 'Q' && ctl.swap.q === 'K', JSON.stringify(ctl.swap));
  check('controls: the hint bar says the new key', ctl.barSaysIt);
  check('controls: reset puts it back', ctl.resetF === 'F');
  check('controls: mouse sensitivity scales the turn', ctl.sensRatio > 1.9 && ctl.sensRatio < 2.1, 'x' + ctl.sensRatio);
  check('controls: invert Y flips the look', ctl.invert);
  check('controls: field of view is a setting', ctl.fov === 80, 'fov=' + ctl.fov);
  check('controls: a controller walks and looks', ctl.padWalked > 2 && ctl.padLooked > 0.3, 'walked ' + ctl.padWalked + ' m, turned ' + ctl.padLooked + ' rad');
  check('controls: Start pauses and resumes', ctl.padPaused && ctl.padResumed);
  check('controls: and RT drives', ctl.padDrove > 5, 'speed ' + ctl.padDrove);

  // ---------- 5b: the water ----------
  var wat = await page.evaluate(function () {
    var P = GAME.player, C = GAME.city, r = {};
    // (3v's lane chooser, when this group runs on its own)
    if (!window.__beachZ) window.__beachZ = function () {
      for (var k = 0; k < 20; k++) {
        var z = -60 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 2, sh = C.shoreline(z), ok = true;
        for (var x = sh - 50; x < sh + 6 && ok; x += 1) {
          ok = !C.hash.query(x, z, 2.2).some(function (b) { return b.h > 0.4 && b.minY === undefined; });
        }
        if (ok) return z;
      }
      return -60;
    };
    GAME.police.clearWanted();
    P.health = 100;
    if (P.inCar) GAME.exitCar();
    window.__msgs = [];
    function press(k) { GAME.test.pressKey(k, true); GAME.test.fastForward(1 / 60); GAME.test.pressKey(k, false); }
    // off the beach, on foot
    var z = window.__beachZ(), sh = C.shoreline(z);
    GAME.test.teleport(sh - 6, z);
    GAME.test.fastForward(0.3);
    P.heading = Math.PI / 2; GAME.cam.yaw = Math.PI / 2;
    GAME.test.pressKey('KeyW', true);
    var t = 0;
    for (; t < 6 && !P.swimming; t += 1 / 60) GAME.test.fastForward(1 / 60);
    r.inAt = +t.toFixed(1);
    r.swimming = !!P.swimming; r.drowning = !!P.drowning;
    var x0 = P.pos.x;
    GAME.test.fastForward(4);
    r.swam = +(P.pos.x - x0).toFixed(1);
    r.stillIn = !!P.swimming && P.state === 'alive';
    // treading water: head and shoulders out, the rest under
    GAME.test.pressKey('KeyW', false);
    GAME.test.fastForward(3);
    r.depth = +(C.seaY(P.pos.x, P.pos.z) - P.pos.y).toFixed(2);
    // no gunplay in the water
    GAME.test.giveWeapon('pistol', 30);
    GAME.combat.selectWeapon && GAME.combat.selectWeapon('pistol');
    press('Tab');
    GAME.test.fastForward(0.2);
    r.aimed = !!GAME.combat.aiming;
    if (GAME.combat.aiming) press('Tab');
    // and back up the beach
    P.heading = -Math.PI / 2; GAME.cam.yaw = -Math.PI / 2;
    GAME.test.pressKey('KeyW', true);
    for (t = 0; t < 15 && P.swimming; t += 1 / 60) GAME.test.fastForward(1 / 60);
    GAME.test.fastForward(0.7);
    GAME.test.pressKey('KeyW', false);
    r.out = { swimming: !!P.swimming, dry: !C.isInWater(P.pos.x, P.pos.z, P.pos.y), upright: Math.abs(P.mesh.rotation.x) < 0.01 };
    // up onto a pier from the water beside it
    GAME.test.teleport(490, 232);
    GAME.test.fastForward(0.4);
    r.pierIn = !!P.swimming;
    P.heading = 0; GAME.cam.yaw = 0;
    GAME.test.pressKey('KeyW', true);
    for (t = 0; t < 12 && P.swimming; t += 1 / 60) GAME.test.fastForward(1 / 60);
    GAME.test.fastForward(0.7);
    GAME.test.pressKey('KeyW', false);
    r.pier = { swimming: !!P.swimming, onPier: C.isOnPier(P.pos.x, P.pos.z), y: +P.pos.y.toFixed(2) };
    // the water along the coast is level where you swim in it — the drawn sea
    // used to slope away three metres toward every shore
    r.coastSea = +C.seaY(485, 238.5).toFixed(2);
    r.openSea = +C.seaY(600, 0).toFixed(2);
    // nobody but you steps into the sea
    r.pedsStop = C.canWalkTo(sh - 1, z, sh + 3, z) === false && C.canWalkTo(sh - 4, z, sh - 2, z) === true;
    return r;
  });
  check('water: walking off the beach puts you in the water swimming, not in a fade back to the sand',
    wat.swimming && !wat.drowning && wat.inAt < 3, JSON.stringify({ inAt: wat.inAt, swimming: wat.swimming, drowning: wat.drowning }));
  check('water: you swim, slower than you walk', wat.stillIn && wat.swam > 5 && wat.swam < 16, wat.swam + ' m in 4 s');
  check('water: treading water, the head is out and the rest is under', wat.depth > 1.0 && wat.depth < 1.6, 'feet ' + wat.depth + ' m down');
  check('water: no aiming a gun while swimming', wat.aimed === false);
  check('water: swim back to the sand and you walk up out of it', !wat.out.swimming && wat.out.dry && wat.out.upright, JSON.stringify(wat.out));
  check('water: swim at a pier and you haul yourself up onto it',
    wat.pierIn && !wat.pier.swimming && wat.pier.onPier && wat.pier.y > 0.3, JSON.stringify(wat.pier));
  check('water: the sea by the coast sits level with the open sea, not sloping away',
    wat.coastSea > -1.0 && Math.abs(wat.coastSea - wat.openSea) < 1.0, 'coast ' + wat.coastSea + ' open ' + wat.openSea);
  check('water: walkers stop at the water\'s edge', wat.pedsStop);

  var boat = await page.evaluate(function () {
    var P = GAME.player, C = GAME.city, r = {};
    function press(k) { GAME.test.pressKey(k, true); GAME.test.fastForward(1 / 60); GAME.test.pressKey(k, false); }
    window.__msgs = [];
    // on the pier, by the mooring
    GAME.test.teleport(485, 243.5);
    GAME.test.fastForward(1.5);
    var b = GAME.world.cars.filter(function (c) { return c.spec.boat && Math.abs(c.pos.x - 485) < 6 && Math.abs(c.pos.z - 238.5) < 6; })[0];
    r.moored = !!b;
    if (!b) return r;
    r.afloat = Math.abs(b.pos.y - C.seaY(b.pos.x, b.pos.z)) < 0.05;
    P.heading = Math.PI;
    press('KeyF');
    GAME.test.fastForward(1);
    r.aboard = P.inCar && P.car === b;
    // out to sea, and hold it against the closed channel
    GAME.test.pressKey('KeyW', true);
    GAME.test.fastForward(3);
    r.run = { speed: +b.speed.toFixed(1), sinking: b.sinking, afloat: Math.abs(b.pos.y - C.seaY(b.pos.x, b.pos.z)) < 0.05 };
    GAME.test.fastForward(12);
    r.channel = { x: Math.round(b.pos.x), speed: +b.speed.toFixed(1), stars: GAME.test.getState().wanted,
      told: window.__msgs.some(function (m) { return m.indexOf('channel is closed') >= 0; }) };
    // straight at the beach: it stops dead on the water
    b.pos.set(C.shoreline(window.__beachZ()) + 40, -0.35, window.__beachZ());
    b.heading = -Math.PI / 2; b.vx = b.vz = 0; b.speed = 0;
    GAME.test.fastForward(8);
    GAME.test.pressKey('KeyW', false);
    r.aground = { water: C.isBoatWater(b.pos.x, b.pos.z), speed: +Math.abs(b.speed).toFixed(1), sinking: b.sinking };
    // back to the pier: step off onto the planks
    b.pos.set(485, -0.35, 238.5); b.heading = Math.PI / 2; b.vx = b.vz = 0; b.speed = 0;
    GAME.test.fastForward(0.5);
    press('KeyF');
    GAME.test.fastForward(0.5);
    r.offPier = { inCar: P.inCar, swimming: !!P.swimming, onPier: C.isOnPier(P.pos.x, P.pos.z) };
    // and out in open water, over the side — then back in from the water
    GAME.test.enterNearestCar(b);
    GAME.test.fastForward(1);
    b.pos.set(520, -0.35, 0); b.heading = Math.PI / 2;
    GAME.test.fastForward(0.5);
    press('KeyF');
    GAME.test.fastForward(0.5);
    r.over = { inCar: P.inCar, swimming: !!P.swimming };
    P.heading = Math.atan2(b.pos.x - P.pos.x, b.pos.z - P.pos.z);
    press('KeyF');
    GAME.test.fastForward(1);
    r.backIn = P.inCar && P.car === b && !P.swimming;
    // wanted, out on the water: cruisers stay ashore, and the harbour patrol
    // comes out by water instead — no helicopter below four stars (sealife,
    // police.js). Kept moving, round in a circle, so nobody comes alongside.
    GAME.test.setWanted(2);
    GAME.test.pressKey('KeyW', true); GAME.test.pressKey('KeyA', true);
    var wet = 0, heli = false, launch = false;
    for (var t = 0; t < 15; t += 1 / 30) {
      GAME.test.fastForward(1 / 30);
      GAME.world.cars.forEach(function (c) {
        if (c.isPolice && !c.spec.heli && !c.spec.boat && (c.sinking || C.isInWater(c.pos.x, c.pos.z))) wet++;
        if (c.aiAir) heli = true;
        if (c.isPolice && c.spec.boat && c.ai && c.ai.mode === 'chase') launch = true;
      });
      if (GAME.police.wanted < 2) GAME.test.setWanted(2);
    }
    GAME.test.pressKey('KeyW', false); GAME.test.pressKey('KeyA', false);
    r.cops = { wet: wet, heli: heli, launch: launch, aboard: P.inCar && P.car === b, state: P.state };
    GAME.police.clearWanted();
    GAME.exitCar();
    GAME.test.fastForward(0.2);
    GAME.test.teleport(400, 0);
    GAME.test.fastForward(0.3);
    return r;
  });
  check('boats: one is moored off the pier, riding the water', boat.moored && boat.afloat, JSON.stringify(boat));
  check('boats: step down into it from the pier', boat.aboard);
  check('boats: it goes, and stays on the water', boat.run && boat.run.speed > 8 && !boat.run.sinking && boat.run.afloat, JSON.stringify(boat.run));
  check('boats: the closed channel holds it back without a star — and says why',
    boat.channel && boat.channel.x <= 561 && boat.channel.stars === 0 && boat.channel.told && boat.channel.speed < 3, JSON.stringify(boat.channel));
  check('boats: run at the beach, it stops dead on the water rather than driving up it',
    boat.aground && boat.aground.water && boat.aground.speed < 1 && !boat.aground.sinking, JSON.stringify(boat.aground));
  check('boats: step off beside a pier and you are on the pier', boat.offPier && !boat.offPier.inCar && boat.offPier.onPier && !boat.offPier.swimming, JSON.stringify(boat.offPier));
  check('boats: step off in open water and you are over the side, swimming', boat.over && !boat.over.inCar && boat.over.swimming, JSON.stringify(boat.over));
  check('boats: and you can climb back in from the water', boat.backIn === true);
  check('water: wanted out on the water — no cruiser follows you in; the harbour patrol does, and no helicopter at two stars',
    boat.cops && boat.cops.wet === 0 && boat.cops.launch && !boat.cops.heli && boat.cops.aboard && boat.cops.state === 'alive', JSON.stringify(boat.cops));

  // ---------- 5c: more to do ----------
  var con = await page.evaluate(function () {
    var P = GAME.player, C = GAME.city, M = GAME.missions, r = {};
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    var pages = [], pg0 = GAME.hud.pager;
    GAME.hud.pager = function (f, t) { pages.push(f + ': ' + t); return pg0.apply(GAME.hud, arguments); };
    try {
      // the pager is a card of its own, on screen (once whatever Lola had
      // already queued — her welcome, a mission line — has had its turn)
      GAME.prefs.storyIntro = true;
      for (var w = 0; w < 30 && GAME.hud.pagerText; w++) GAME.test.fastForward(0.5);
      GAME.test.fastForward(0.6);
      GAME.hud.pager('LOLA', 'test page', 2);
      GAME.test.fastForward(0.1);
      var pe = document.getElementById('pager');
      r.pagerOn = pe.classList.contains('on') && getComputedStyle(pe).display !== 'none' && GAME.hud.pagerText === 'test page';
      GAME.test.fastForward(3);
      r.pagerOff = !pe.classList.contains('on');
      pages.length = 0;
      // a takedown, from its ring, in a car
      var d = M.DEFS.filter(function (x) { return x.id === 'hit0'; })[0];
      r.defs = M.DEFS.filter(function (x) { return x.type === 'takedown'; }).length;
      var bests0 = GAME.bests ? GAME.bests.hit0 : undefined;
      if (GAME.bests) delete GAME.bests.hit0;
      GAME.test.teleport(d.start.x - 12, d.start.z);
      GAME.test.fastForward(0.3);
      var car = GAME.vehicles.spawnCar('sports', d.start.x - 8, d.start.z, Math.PI / 2, {});
      GAME.test.enterNearestCar(car); GAME.test.fastForward(1.2);
      car.pos.set(d.start.x, car.pos.y, d.start.z); car.speed = 0;
      GAME.test.fastForward(0.5);
      r.started = M.active && M.active.def.id;
      GAME.test.fastForward(4);
      var a = M.active, t = a && a.perp;
      r.target = !!t && t.hp > t.spec.hp * 2 && t.occupied === 'ai';
      r.far = t ? Math.round(Math.hypot(t.pos.x - car.pos.x, t.pos.z - car.pos.z)) : 0;
      r.marked = !!M.getObjectivePoint();
      if (t) {
        car.pos.set(t.pos.x - Math.sin(t.heading) * 22, car.pos.y, t.pos.z - Math.cos(t.heading) * 22);
        var hp0 = P.health;
        GAME.test.fastForward(1.5);
        r.ran = a.fleeing && t.ai && t.ai.desired >= 18;
        GAME.vehicles.damageCar(t, t.hp * 0.85, 'bullet', true);
        GAME.test.fastForward(0.5);
        // knocked about till he gives it up, he is out with a gun, and the
        // job is not done until he is
        r.foot = a.phase === 'foot' && !!a.foot && !!a.foot.carrying && !(GAME.bests && GAME.bests.hit0 !== undefined);
        if (a.foot) GAME.peds.kill(a.foot, 'gun', true);
        GAME.test.fastForward(0.5);
      }
      // Passed is the job's own record, not "nothing is running": the chase
      // goes wherever the target ran, and a car left stopped in another job's
      // ring when this one ends starts that one (as it should) — on CI the
      // target ran to DOWNTOWN DASH and the race began on the next tick.
      r.passed = !!(GAME.bests && GAME.bests.hit0 !== undefined) && !(M.active && M.active.def.id === 'hit0');
      if (M.active) { M.failActive('test cleanup'); GAME.test.fastForward(0.3); }
      r.pages = pages.slice();
      if (bests0 === undefined && GAME.bests) delete GAME.bests.hit0; else if (GAME.bests) GAME.bests.hit0 = bests0;
      GAME.exitCar();
      GAME.vehicles.removeCar(car);
      // Isla Verde's jumps: their own tally, the mainland's untouched
      var ramps = C.ramps.filter(function (x) { return x.isla; });
      r.islaRamps = ramps.length;
      r.mainTotal = GAME.stunts.total;
      r.islaOnIsland = ramps.every(function (x) { return GAME.isla.contains(x.x, x.z); });
      GAME.isla.setOpen(true);
      var rp = ramps[0], i0 = GAME.stunts.islaFound, m0 = GAME.stunts.found;
      var fx = Math.sin(rp.rot), fz = Math.cos(rp.rot);
      var sx = rp.x - fx * (rp.len / 2 + 26), sz = rp.z - fz * (rp.len / 2 + 26);
      GAME.test.teleport(sx - 3, sz);
      GAME.test.fastForward(0.3);
      var jc = GAME.vehicles.spawnCar('sports', sx, sz, rp.rot, {});
      GAME.test.enterNearestCar(jc); GAME.test.fastForward(1.2);
      jc.pos.set(sx, C.groundY(sx, sz), sz); jc.heading = rp.rot; jc.speed = 0; jc.vx = jc.vz = 0;
      var air = 0;
      GAME.test.pressKey('KeyW', true);
      for (var k = 0; k < 60 * 5; k++) { GAME.test.fastForward(1 / 60); air = Math.max(air, jc.air || 0); }
      GAME.test.pressKey('KeyW', false);
      r.islaJump = { air: +air.toFixed(2), isla: GAME.stunts.islaFound - i0, main: GAME.stunts.found - m0 };
      GAME.exitCar();
      GAME.vehicles.removeCar(jc);
      // lost tapes
      var T = GAME.tapes.list();
      r.tapes = { n: T.length, main: T.filter(function (x) { return !x.isla; }).length, isla: T.filter(function (x) { return x.isla; }).length };
      r.tapesDry = T.every(function (x) { return !C.isInWater(x.x, x.z, x.y); });
      r.tapesClear = T.every(function (x) {
        return C.hash.query(x.x, x.z, 0.3).every(function (b) {
          return (b.h !== undefined && b.h <= x.y + 0.3) || !(x.x > b.minX && x.x < b.maxX && x.z > b.minZ && x.z < b.maxZ);
        });
      });
      r.tapesSpread = T.every(function (x, i) { return T.every(function (y, j) { return i === j || Math.hypot(x.x - y.x, x.z - y.z) > 35; }); });
      var tp = T.filter(function (x) { return !x.taken && !x.isla && x.y < 1; })[0];
      var f0 = GAME.tapes.found, c0 = P.cash;
      GAME.test.teleport(tp.x + 5, tp.z);
      GAME.test.fastForward(0.3);
      r.glint = GAME.tapes.nearby(P.pos.x, P.pos.z).indexOf(tp) >= 0;
      GAME.test.teleport(tp.x, tp.z);
      GAME.test.fastForward(0.3);
      r.tape = { got: GAME.tapes.found - f0, cash: P.cash - c0, saved: !!(GAME.prefs.tapes && GAME.prefs.tapes.got[tp.id]), gone: !tp.mesh };
      // the DJ's station: not on the dial until it is earned
      var R = GAME.audio.radio, names = [];
      for (var s = 0; s < 6; s++) names.push(R.switchStation(1));
      r.lockedOut = names.indexOf('TAPE DECK FM') < 0;
      GAME.prefs.tapeDeck = true;
      names = [];
      for (s = 0; s < 6; s++) names.push(R.switchStation(1));
      r.unlocked = names.indexOf('TAPE DECK FM') >= 0;
      delete GAME.prefs.tapeDeck;
      R.tune(0);
      // a hundred per cent now means the island jumps and the tapes too
      r.completeNeedsAll = GAME.tapes.complete === false;
    } finally {
      GAME.hud.pager = pg0;
    }
    GAME.test.teleport(400, 0);
    GAME.test.fastForward(0.3);
    return r;
  });
  check('story: the pager is a card on screen, and it goes again', con.pagerOn && con.pagerOff);
  // (her word on it is the last of HERS: Rico has his say after it, about his collector)
  var lolaPages = con.pages.filter(function (p) { return /^LOLA: /.test(p); });
  check('story: Lola pages a line when a job starts and another when it is done the first time',
    lolaPages.length >= 2 && /^LOLA: /.test(con.pages[0]) && con.pages.indexOf(lolaPages[lolaPages.length - 1]) > 0, JSON.stringify(con.pages));
  check('story: and Rico pages back, after her, the first time a job costs him',
    /^RICO: /.test(con.pages[con.pages.length - 1]) && con.pages.length >= 3, JSON.stringify(con.pages));
  check('takedown: there are takedown jobs on both islands', con.defs >= 3, con.defs);
  check('takedown: pulling up in the ring starts one, with an armoured target out in the traffic',
    con.started === 'hit0' && con.target && con.far > 100 && con.marked, JSON.stringify({ started: con.started, target: con.target, far: con.far, marked: con.marked }));
  check('takedown: the target runs once it has seen you', con.ran);
  check('takedown: knocked about till he bails, he is out with a gun and the job waits on him', con.foot);
  check('takedown: and putting him down passes the job', con.passed);
  check('isla jumps: ten of them, all on the island, and the mainland still counts its own',
    con.islaRamps === 10 && con.islaOnIsland && con.mainTotal === 25, JSON.stringify({ isla: con.islaRamps, on: con.islaOnIsland, main: con.mainTotal }));
  check('isla jumps: one launches and counts on the island tally, not the mainland one',
    con.islaJump.air > 0.45 && con.islaJump.isla === 1 && con.islaJump.main === 0, JSON.stringify(con.islaJump));
  check('tapes: thirty, twenty on the mainland and ten on Isla Verde', con.tapes.n === 30 && con.tapes.main === 20 && con.tapes.isla === 10, JSON.stringify(con.tapes));
  check('tapes: every one where you can stand to pick it up, and spread out', con.tapesDry && con.tapesClear && con.tapesSpread,
    JSON.stringify({ dry: con.tapesDry, clear: con.tapesClear, spread: con.tapesSpread }));
  check('tapes: close by, one glints on the radar', con.glint);
  check('tapes: walk over one and it is yours — paid, remembered, gone', con.tape.got === 1 && con.tape.cash === 250 && con.tape.saved && con.tape.gone, JSON.stringify(con.tape));
  check('tapes: the DJ\'s station is off the dial until every tape is found, then on it', con.lockedOut && con.unlocked);
  check('completion: a hundred per cent waits for the tapes too', con.completeNeedsAll);

  // ---------- 5d: indoors ----------
  var ind = await page.evaluate(function () {
    var P = GAME.player, C = GAME.city, I = GAME.interiors, r = {};
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    window.__msgs = [];
    var owned0 = (GAME.prefs.safehouses || []).slice();
    function walkTo(x, z, maxT) {
      for (var t = 0; t < (maxT || 8); t += 1 / 60) {
        var dx = x - P.pos.x, dz = z - P.pos.z;
        if (dx * dx + dz * dz < 0.2 || I.busy || GAME.shopOpen) break;
        P.heading = Math.atan2(dx, dz); GAME.cam.yaw = P.heading;
        GAME.test.pressKey('KeyW', true);
        GAME.test.fastForward(1 / 60);
      }
      GAME.test.pressKey('KeyW', false);
      GAME.test.fastForward(0.7);
    }
    try {
      // a home you do not own: the mat still sells it to you
      GAME.prefs.safehouses = [];
      var mats = GAME.shops.blips().filter(function (b) { return b.label === '$' || b.label === '⌂'; });
      var condo = mats.filter(function (b) { return Math.abs(b.x - 337) < 30 && Math.abs(b.z - 208) < 30; })[0];
      GAME.test.teleport(condo.x + 8, condo.z);
      GAME.test.fastForward(0.4);
      walkTo(condo.x, condo.z);
      r.forSale = GAME.shopOpen && /BUY/.test(document.getElementById('shop-items').textContent) && !P.interior;
      if (GAME.shopOpen) GAME.shops.close();
      // own it, and the same mat takes you in — wanted or not
      GAME.prefs.safehouses = ['condo'];
      GAME.test.teleport(condo.x + 8, condo.z);
      GAME.test.fastForward(0.4);
      GAME.test.setWanted(2);
      walkTo(condo.x, condo.z);
      var room = I.current;
      r.inside = !!room && room.id === 'home_condo' && !!P.interior;
      var F = GAME.focus();
      r.focusAtDoor = Math.hypot(F.x - condo.x, F.z - condo.z) < 3;
      r.dry = !P.swimming && !C.isInWater(P.pos.x, P.pos.z, P.pos.y);
      if (room) {
        // nobody sees in, nobody takes you
        GAME.test.fastForward(4);
        r.unseen = GAME.police.spotted === false && P.state === 'alive';
        GAME.police.clearWanted();
        // the walls hold, the camera stays under the ceiling
        P.heading = -Math.PI / 2; GAME.cam.yaw = P.heading; GAME.cam.pitch = 1.1;
        GAME.test.pressKey('KeyW', true); GAME.test.fastForward(4); GAME.test.pressKey('KeyW', false);
        r.walls = P.pos.x > room.ox - room.w / 2 - 0.1 && P.pos.x < room.ox + room.w / 2 + 0.1;
        GAME.test.fastForward(0.5);
        r.ceiling = GAME.cameraObj.position.y <= room.h + 0.01;
        // no rain indoors, and the room's own light at night
        GAME.weather.testSet(1);
        GAME.test.fastForward(0.3);
        var lines = null;
        GAME.scene.traverse(function (o) { if (o.isLineSegments && o.material && o.material.color && o.material.color.getHex() === 0xa9bedc) lines = o; });
        r.noRain = !!lines && lines.visible === false;
        GAME.weather.testSet(0);
        var tod0 = GAME.timeOfDay;
        GAME.applyTimeOfDay(0);
        r.lit = GAME.lights.hemi.intensity >= 0.9;
        GAME.applyTimeOfDay(tod0);
        // the bed is where you sleep it off (in the condo, through the
        // bedroom door: the ring carries the way there)
        var bed = room.rings[1];
        (bed.via || []).forEach(function (p) { walkTo(p.x, p.z, 8); });
        walkTo(bed.x, bed.z, 8);
        r.bed = GAME.shopOpen && /SLEEP IT OFF/.test(document.getElementById('shop-items').textContent);
        if (GAME.shopOpen) GAME.shops.close();
        // and the mat by the door takes you back out, and stays shut
        var ex = room.rings[0];
        (bed.via || []).slice().reverse().forEach(function (p) { walkTo(p.x, p.z, 8); });
        walkTo(ex.x, ex.z, 10);
        GAME.test.fastForward(1.5);
        r.out = !P.interior && !I.current && Math.hypot(P.pos.x - condo.x, P.pos.z - condo.z) < 3 && !GAME.shopOpen;
      }
      // the casino: turned away with stars, let in without
      var cas = { x: 452, z: 255.3 };
      GAME.test.teleport(cas.x, cas.z - 8);
      GAME.test.fastForward(0.4);
      GAME.test.setWanted(1);
      window.__msgs = [];
      walkTo(cas.x, cas.z);
      r.doorman = !P.interior && window.__msgs.some(function (m) { return /doorman/.test(m); });
      GAME.police.clearWanted();
      GAME.test.teleport(cas.x, cas.z - 8);
      GAME.test.fastForward(0.4);
      walkTo(cas.x, cas.z);
      var cr = I.current;
      r.casino = !!cr && cr.id === 'casino0';
      if (cr) {
        // a drink at the bar patches you up
        P.health = 40;
        var bar = cr.rings[2];
        walkTo(bar.x, bar.z, 12);
        r.barOpen = GAME.shopOpen && document.getElementById('shop-title').textContent === 'THE GULL BAR';
        if (GAME.shopOpen) { GAME.addCash(200); GAME.shops.buy('cuba'); GAME.shops.close(); }
        r.healed = P.health >= 75;
        // and the wheel is the wheel
        walkTo(cr.rings[1].x, cr.rings[1].z, 12);
        r.wheel = GAME.shopOpen && /SPIN THE WHEEL/.test(document.getElementById('shop-items').textContent);
        if (GAME.shopOpen) GAME.shops.close();
        I.reset();
      }
    } finally {
      GAME.prefs.safehouses = owned0;
      I.reset();
      if (GAME.shopOpen) GAME.shops.close();
      GAME.police.clearWanted();
    }
    GAME.test.teleport(400, 0);
    GAME.test.fastForward(0.3);
    return r;
  });
  check('indoors: a home you do not own still sells itself at the door', ind.forSale);
  check('indoors: the mat of a home you own takes you inside, onto a dry floor, with the world going on round its door',
    ind.inside && ind.focusAtDoor && ind.dry, JSON.stringify({ inside: ind.inside, focus: ind.focusAtDoor, dry: ind.dry }));
  check('indoors: nobody hunting you can see in', ind.unseen);
  check('indoors: the walls hold and the camera stays under the ceiling', ind.walls && ind.ceiling, JSON.stringify({ walls: ind.walls, ceiling: ind.ceiling }));
  check('indoors: no rain falls in a room, and it has its own light at night', ind.noRain && ind.lit, JSON.stringify({ noRain: ind.noRain, lit: ind.lit }));
  check('indoors: the bed is where you sleep it off', ind.bed);
  check('indoors: the mat by the door takes you back out to it', ind.out);
  check('casino: the doorman keeps out anybody with stars', ind.doorman);
  check('casino: and lets everybody else in', ind.casino);
  check('casino: the bar sells a drink that patches you up', ind.barOpen && ind.healed, JSON.stringify({ bar: ind.barOpen, healed: ind.healed }));
  check('casino: the wheel is up the back', ind.wheel);

  // ---------- 5e: from the playtest ----------
  var pt = await page.evaluate(function () {
    var P = GAME.player, C = GAME.city, r = {};
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    // every vehicle job's ring within reach of a car in the lane
    r.far = GAME.missions.DEFS.filter(function (d) {
      // (a job run on the water starts on the water)
      if (!d.start || d.type === 'rampage' || d.boat) return false;
      var rp = C.nearestRoadPoint(d.start.x, d.start.z);
      return Math.hypot(rp.x - d.start.x, rp.z - d.start.z) > 3.6;
    }).map(function (d) { return d.id; });
    // and driving up to BEACH RUN's in a van starts it
    var d = GAME.missions.DEFS.filter(function (x) { return x.id === 'courier2'; })[0];
    var rp = C.nearestRoadPoint(d.start.x, d.start.z);
    var ax = rp.axis === 'z' ? 0 : 1;   // along the road
    var vx = ax ? d.start.x - 30 : rp.x, vz = ax ? rp.z : d.start.z - 30;
    GAME.test.teleport(vx, vz + 3);
    GAME.test.fastForward(0.3);
    // an empty lane: this is about the ring, not about whoever is parked or
    // crossing in front of it (traffic in the way failed it now and then)
    GAME.police.clearWanted();
    GAME.world.cars.slice().forEach(function (c) { if (!P.inCar || c !== P.car) { if (Math.hypot(c.pos.x - d.start.x, c.pos.z - d.start.z) < 60) GAME.vehicles.removeCar(c); } });
    GAME.world.peds.slice().forEach(function (p) { if (Math.hypot(p.pos.x - d.start.x, p.pos.z - d.start.z) < 45) GAME.peds.removePed(p); });
    var van = GAME.vehicles.spawnCar('van', vx, vz, ax ? Math.PI / 2 : 0, {});
    GAME.test.enterNearestCar(van); GAME.test.fastForward(1.2);
    // drive up the lane and brake to a stop at the ring, as anybody would
    GAME.test.pressKey('KeyW', true);
    var braking = false;
    for (var t = 0; t < 10 && !GAME.missions.active; t += 1 / 60) {
      GAME.test.fastForward(1 / 60);
      var along = ax ? d.start.x - van.pos.x : d.start.z - van.pos.z;
      if (!braking && along < 4 + van.speed * van.speed / 30) { braking = true; GAME.test.pressKey('KeyW', false); GAME.test.pressKey('KeyS', true); }
      if (braking && van.speed < 0.5) GAME.test.pressKey('KeyS', false);
    }
    GAME.test.pressKey('KeyW', false); GAME.test.pressKey('KeyS', false);
    GAME.test.fastForward(2);
    r.courierStarted = !!(GAME.missions.active && GAME.missions.active.def.id === 'courier2');
    if (GAME.missions.active) GAME.missions.failActive('test');
    GAME.test.fastForward(0.3);
    if (P.inCar) GAME.exitCar();
    GAME.vehicles.removeCar(van);
    // a tap of F that comes and goes between two ticks still gets you in,
    // and the prompt says so first
    GAME.test.teleport(100, -96);
    GAME.test.fastForward(0.3);
    var car = GAME.vehicles.spawnCar('sedan', 100, -100, 0, {});
    P.pos.set(100, 0, -100 + 3.1);
    GAME.test.fastForward(0.3);
    var hint = document.getElementById('enter-hint');
    r.prompt = !!hint && hint.style.opacity === '1' && /get in the Cadenza/.test(hint.textContent);
    GAME.test.pressKey('KeyF', true); GAME.test.pressKey('KeyF', false);
    GAME.test.fastForward(1.2);
    r.tapped = P.inCar && P.car === car;
    // a nudge is free; a crash still costs
    var hp0 = car.hp;
    car.pos.set(100, car.pos.y, -100); car.heading = 0;
    var wall = C.hash.all.filter(function (b) { return b.tag === 'building' && b.h > 6 && b.maxX - b.minX > 12 && b.maxZ - b.minZ > 12 && !GAME.isla.contains(b.minX, b.minZ); })[0];
    car.pos.set((wall.minX + wall.maxX) / 2, 0, wall.minZ - 4); car.heading = 0; car.speed = 0; car.vx = car.vz = 0;
    GAME.test.fastForward(0.2);
    car.speed = 4.5; car.vz = 4.5;
    for (var k = 0; k < 90; k++) { car.controls.throttle = 0; GAME.test.fastForward(1 / 60); }
    r.nudge = +(hp0 - car.hp).toFixed(1);
    GAME.exitCar();
    GAME.vehicles.removeCar(car);
    // a mid-height block beside a car, with the free-look camera swung up
    // over it: it rides above the roof, but the line down to the car runs
    // through the block
    var low = C.hash.all.filter(function (b) {
      // (lower than the camera rides — so the old "is it below the camera"
      // test let it through — but higher than the line to the car where
      // that line crosses its face)
      return b.tag === 'building' && b.h > 5.2 && b.h < 7.4 && b.maxX - b.minX > 10 && b.maxZ - b.minZ > 10 && b.minY === undefined &&
        !GAME.isla.contains(b.minX, b.minZ) && C.hash.query((b.minX + b.maxX) / 2, b.minZ - 2.5, 1.5).every(function (q) { return q === b || q.h < 0.5; });
    })[0];
    r.lowFound = !!low;
    if (low) {
      var px = (low.minX + low.maxX) / 2, pz = low.minZ - 1.7;
      GAME.test.teleport(px, pz);
      GAME.test.fastForward(0.3);
      var lc = GAME.vehicles.spawnCar('sedan', px + 3, pz, Math.PI / 2, {});
      GAME.test.enterNearestCar(lc); GAME.test.fastForward(1.2);
      lc.pos.set(px, C.groundY(px, pz), pz); lc.heading = Math.PI / 2; lc.speed = 0;
      GAME.cam.freeT = 5; GAME.cam.yaw = Math.PI; GAME.cam.pitch = 1.05;   // behind the car is over the block
      for (var cf = 0; cf < 30; cf++) { GAME.cam.freeT = 5; GAME.test.fastForward(1 / 60); }
      var cp = GAME.cameraObj.position;
      r.camOutside = cp.z < low.minZ + 0.05;
      r.camY = +cp.y.toFixed(1); r.blockH = low.h;
      GAME.exitCar();
      GAME.vehicles.removeCar(lc);
    }
    // the camera does not sink under the drawn sand off the beach
    var bz = -60, bsh = C.shoreline(bz);
    GAME.test.teleport(bsh + 4, bz);
    GAME.test.fastForward(0.5);
    GAME.cam.yaw = -Math.PI / 2; GAME.cam.pitch = -0.15;
    GAME.test.fastForward(0.6);
    r.camAboveSand = GAME.cameraObj.position.y >= 0.69;
    GAME.test.teleport(400, 0);
    GAME.test.fastForward(0.3);
    return r;
  });
  check('playtest: every job you start in a vehicle is in reach of the road', pt.far.length === 0, JSON.stringify(pt.far));
  check('playtest: drive up to BEACH RUN in a van and it starts', pt.courierStarted);
  check('playtest: walking up to a car says you can get in', pt.prompt);
  check('playtest: a quick tap of F between frames still gets you in', pt.tapped);
  check('playtest: a nudge into a wall does not dent the car', pt.nudge <= 3, pt.nudge + ' hp');
  check('playtest: a low block between you and a camera above its roof pulls the camera in front of it',
    pt.lowFound && pt.camOutside, JSON.stringify({ found: pt.lowFound, outside: pt.camOutside, camY: pt.camY, blockH: pt.blockH }));
  check('playtest: the camera stays above the drawn sand', pt.camAboveSand);

  // ---------- 5f: your answers ----------
  // Cars smoked after a few knocks and burned after a few more, before the
  // first proper chase: they take about 40% more now, and a takedown target
  // is no tougher than it was tuned to be. One star went eight seconds after
  // the offence — gone before the cruiser sent for you turned up — and holds
  // twenty now, forty-five while they keep you in sight. X twice walks away
  // from a mission (once only asks), and so does ABANDON on the pause
  // screen. And the helipad tower has a lift from the lobby to the roof.
  var ans = await page.evaluate(function () {
    var P = GAME.player, V = GAME.vehicles, M = GAME.missions, I = GAME.interiors, r = {};
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    if (M.active) M.failActive('test');
    GAME.test.fastForward(0.3);
    // --- hard knocks a sedan takes before it is on fire
    GAME.test.teleport(100, -96);
    GAME.test.fastForward(0.3);
    var sd = V.spawnCar('sedan', 100, -110, 0, {});
    var knocks = 0;
    while (sd.stage < 2 && knocks < 40) { V.damageCar(sd, 20, 'wall'); knocks++; }
    r.knocks = knocks;
    V.removeCar(sd);
    r.targets = M.DEFS.filter(function (d) { return d.type === 'takedown'; }).map(function (d) {
      return Math.round(V.TYPES[d.car].hp * d.armor);
    });

    // --- one star, out of everybody's sight (indoors) and then in it
    GAME.godMode = true;
    GAME.test.teleport(-60, 40);
    GAME.test.fastForward(0.5);
    GAME.test.setWanted(1);
    var hid = { id: 'test-hideout' }, t, un = {};
    for (t = 0; t < 40; t += 0.25) {
      P.interior = hid;
      GAME.test.fastForward(0.25);
      if (Math.abs(t - 15) < 0.01) un.at15 = GAME.police.wanted;
      if (GAME.police.wanted === 0 && un.gone === undefined) un.gone = t;
    }
    P.interior = null;
    r.unseen = un;
    GAME.police.clearWanted();
    GAME.test.teleport(-60, 40);
    GAME.test.fastForward(0.5);
    GAME.test.setWanted(1);
    // an officer down the street with eyes on you, held where he stands, and
    // nobody else (a unit turning up and cuffing you would end it early)
    var cop = GAME.peds.spawnPed(P.pos.x + 25, P.pos.z, { cop: true }), sn = {}, seenN = 0, n = 0;
    for (t = 0; t < 60; t += 1 / 60) {
      cop.pos.set(P.pos.x + 25, 0, P.pos.z); cop.state = 'idle';
      GAME.world.cars.slice().forEach(function (c) { if (c.isPolice && c !== P.car) V.removeCar(c); });
      GAME.world.peds.slice().forEach(function (p) { if (p.isCop && p !== cop) GAME.peds.removePed(p); });
      GAME.test.fastForward(1 / 60);
      n++; if (GAME.police.spotted) seenN++;
      if (Math.abs(t - 30) < 0.009) sn.at30 = GAME.police.wanted;
      if (GAME.police.wanted === 0 && sn.gone === undefined) sn.gone = +t.toFixed(1);
      if (P.state !== 'alive') { sn.state = P.state; break; }
    }
    sn.seen = +(seenN / Math.max(1, n)).toFixed(2);
    r.seen = sn;
    GAME.peds.removePed(cop);
    GAME.godMode = false;
    GAME.police.clearWanted();
    GAME.test.fastForward(0.5);

    // --- X walks away from a race
    function tapX() { GAME.test.pressKey('KeyX', true); GAME.test.fastForward(1 / 60); GAME.test.pressKey('KeyX', false); GAME.test.fastForward(1 / 60); }
    r.bindable = GAME.controls.ACTIONS.some(function (a) { return a[0] === 'KeyX'; });
    var race = M.DEFS.filter(function (d) { return d.type === 'race' && d.start && !d.isla; })[0];
    GAME.test.teleport(race.start.x - 40, race.start.z);
    GAME.test.fastForward(0.3);
    var car = V.spawnCar('sports', race.start.x - 36, race.start.z, Math.PI / 2, {});
    GAME.test.enterNearestCar(car); GAME.test.fastForward(1.2);
    car.pos.set(race.start.x, car.pos.y, race.start.z); car.speed = 0;
    GAME.test.fastForward(0.5);
    r.raceOn = !!(M.active && M.active.def === race);
    window.__msgs = [];
    tapX();
    r.asked = !!(M.active && M.active.def === race) && window.__msgs.some(function (m) { return /again to abandon/.test(m); });
    GAME.test.fastForward(3.5);
    tapX();
    r.strayKept = !!(M.active && M.active.def === race);     // the ask lapsed: that was a fresh ask
    tapX();
    GAME.test.fastForward(0.2);
    r.walked = !M.active && window.__msgs.some(function (m) { return /MISSION ABANDONED/.test(m); });
    r.retryOffered = GAME.retryAvailable === true;
    GAME.exitCar();
    GAME.test.fastForward(0.3);
    V.removeCar(car);
    GAME.test.fastForward(12.5);   // let the retry offer lapse

    // --- ABANDON on the pause screen clocks off a taxi shift
    GAME.test.teleport(120, -96);
    GAME.test.fastForward(0.3);
    var cab = V.spawnCar('taxi', 120, -100, 0, {});
    GAME.test.enterNearestCar(cab); GAME.test.fastForward(1.2);
    GAME.test.pressKey('KeyJ', true); GAME.test.fastForward(1 / 60); GAME.test.pressKey('KeyJ', false);
    GAME.test.fastForward(0.5);
    r.shiftOn = !!(M.active && M.active.def.job);
    var btn = document.getElementById('pause-abandon');
    r.btnHidden = btn.style.display === 'none';   // (paused below, so it has been painted)
    GAME.togglePause();
    r.btnShown = btn.style.display !== 'none' && /CLOCK OFF/.test(btn.textContent);
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    r.btnAsks = GAME.paused && !!M.active && /SURE/.test(btn.textContent);
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    GAME.test.fastForward(0.2);
    r.btnDone = !GAME.paused && !M.active;
    GAME.togglePause(); r.btnGone = btn.style.display === 'none'; GAME.togglePause();
    GAME.exitCar();
    GAME.test.fastForward(0.3);
    V.removeCar(cab);

    // --- the lift: lobby to helipad and back, on foot only
    function walkTo(x, z, maxT) {
      for (var w = 0; w < (maxT || 8); w += 1 / 60) {
        var dx = x - P.pos.x, dz = z - P.pos.z;
        if (dx * dx + dz * dz < 0.2 || I.busy) break;
        P.heading = Math.atan2(dx, dz); GAME.cam.yaw = P.heading;
        GAME.test.pressKey('KeyW', true);
        GAME.test.fastForward(1 / 60);
      }
      GAME.test.pressKey('KeyW', false);
      GAME.test.fastForward(0.7);
    }
    var L = I.lift && I.lift();
    r.lift = !!L && L.length === 2;
    if (r.lift) {
      var st = L[0].at, rf = L[1].at;
      GAME.test.teleport(st.x, st.z + 9);
      GAME.test.fastForward(0.4);
      walkTo(st.x, st.z + 6, 3);
      r.liftHint = /ELEVATOR/.test(document.getElementById('poi-hint').textContent) && document.getElementById('poi-hint').style.opacity === '1';
      walkTo(st.x, st.z);
      GAME.test.fastForward(11);     // the ride up the glass (5l)
      r.up = { y: +P.pos.y.toFixed(1), d: +Math.hypot(P.pos.x - rf.x, P.pos.z - rf.z).toFixed(1), alive: P.state === 'alive' };
      var pad = GAME.city.roofHelipad;
      r.padNear = Math.hypot(P.pos.x - pad.x, P.pos.z - pad.z) < 16;
      walkTo(rf.x - 4, rf.z, 4);
      walkTo(rf.x, rf.z, 4);
      GAME.test.fastForward(11);
      r.down = { y: +P.pos.y.toFixed(1), d: +Math.hypot(P.pos.x - st.x, P.pos.z - st.z).toFixed(1), alive: P.state === 'alive' };
      // a car parked on the ring goes nowhere
      var lc = V.spawnCar('sedan', st.x + 4, st.z + 6, 0, {});
      GAME.test.enterNearestCar(lc); GAME.test.fastForward(1.2);
      lc.pos.set(st.x, lc.pos.y, st.z); lc.speed = 0;
      GAME.test.fastForward(1.5);
      r.carStays = P.inCar && lc.pos.y < 3 && !I.busy;
      GAME.exitCar();
      GAME.test.fastForward(0.3);
      V.removeCar(lc);
    }
    GAME.test.teleport(400, 0);
    GAME.test.fastForward(0.3);
    return r;
  });
  check('answers: a sedan takes ten hard knocks or more before it is on fire', ans.knocks >= 10, ans.knocks + ' knocks of 20');
  check('answers: takedown targets are as tough as they were tuned',
    ans.targets.length === 3 && [630, 240, 960].every(function (v, i) { return Math.abs(ans.targets[i] - v) / v < 0.03; }), JSON.stringify(ans.targets));
  check('answers: out of sight, one star still holds fifteen seconds on',
    ans.unseen.at15 === 1, JSON.stringify(ans.unseen));
  check('answers: and goes inside half a minute', ans.unseen.gone !== undefined && ans.unseen.gone <= 30, JSON.stringify(ans.unseen));
  check('answers: an officer with eyes on you the whole time (anchor sanity)', ans.seen.seen > 0.9 && !ans.seen.state, JSON.stringify(ans.seen));
  check('answers: in their sight, one star holds past thirty seconds — a chase, not a blip',
    ans.seen.at30 === 1, JSON.stringify(ans.seen));
  check('answers: but not forever: it goes inside a minute even in sight',
    ans.seen.gone !== undefined && ans.seen.gone <= 50, JSON.stringify(ans.seen));
  check('answers: abandon is an action you can rebind', ans.bindable);
  check('answers: the race starts (anchor sanity)', ans.raceOn);
  check('answers: X once only asks', ans.asked);
  check('answers: an ask left three seconds lapses — the next X asks again', ans.strayKept);
  check('answers: X twice walks away, MISSION ABANDONED, with the retry offered', ans.walked && ans.retryOffered,
    JSON.stringify({ walked: ans.walked, retry: ans.retryOffered }));
  check('answers: the shift is on (anchor sanity)', ans.shiftOn);
  check('answers: the pause screen offers CLOCK OFF with a shift on, and asks first',
    ans.btnShown && ans.btnAsks, JSON.stringify({ shown: ans.btnShown, asks: ans.btnAsks }));
  check('answers: and the second press clocks off and resumes; with nothing on there is no button',
    ans.btnDone && ans.btnGone, JSON.stringify({ done: ans.btnDone, gone: ans.btnGone }));
  check('answers: the helipad tower has a lift', ans.lift);
  check('answers: walking up to it says ELEVATOR', ans.liftHint);
  check('answers: the lobby ring takes you up to the roof, by the pad, in one piece',
    ans.up && ans.up.y > 70 && ans.up.d < 4 && ans.up.alive && ans.padNear, JSON.stringify(ans.up));
  check('answers: and the roof ring brings you back down to the street',
    ans.down && ans.down.y < 1 && ans.down.d < 4 && ans.down.alive, JSON.stringify(ans.down));
  check('answers: a car parked on the lift ring goes nowhere', ans.carStays);

  // A session that starts at your door, and a respawn there, used to face
  // you into town whatever way the house stood — at the Dockside Flat that
  // was along the house front, and the camera behind you hung beside the
  // facade at the awning's height: a mint slab filled the screen. Now you
  // face within 60° of the door, and the camera stands out over the pavement.
  function homeCam() {
    var P = GAME.player, C = GAME.city, sh = GAME.shops;
    var c = GAME.cameraObj.position, best = null, bd = 1e9;
    C.hash.query(P.pos.x, P.pos.z, 9).forEach(function (b) {
      if (b.tag !== 'building' || b.h === undefined || b.h < 6) return;
      var dx = Math.max(b.minX - P.pos.x, 0, P.pos.x - b.maxX), dz = Math.max(b.minZ - P.pos.z, 0, P.pos.z - b.maxZ);
      var d = Math.hypot(dx, dz);
      if (d < bd) { bd = d; best = b; }
    });
    if (!best) return { house: false };
    var cx = Math.max(best.minX - c.x, 0, c.x - best.maxX), cz = Math.max(best.minZ - c.z, 0, c.z - best.maxZ);
    return { house: true, gap: +Math.hypot(cx, cz).toFixed(2), camY: +c.y.toFixed(2) };
  }
  var homes = await page.evaluate(function (homeCamSrc) {
    var homeCam = new Function('return ' + homeCamSrc)();
    var P = GAME.player, r = {};
    var owned0 = (GAME.prefs.safehouses || []).slice(), last0 = GAME.prefs.lastHome;
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    ['dock', 'condo'].forEach(function (id) {
      GAME.prefs.safehouses = [id]; GAME.prefs.lastHome = id;
      var h = GAME.shops.startSpawn();
      GAME.test.teleport(h.x, h.z);
      // as startGame does it
      P.heading = h.heading; GAME.cam.yaw = P.heading; GAME.cam.pitch = 0.32;
      GAME.cam.x = GAME.cam.y = GAME.cam.z = null;
      GAME.test.fastForward(1);
      r[id] = homeCam();
    });
    // and wasted near it: you wake at the hospital, not at its gate — and
    // a place of your own still keeps your weapons safe
    GAME.prefs.safehouses = ['dock']; GAME.prefs.lastHome = 'dock';
    var d = GAME.shops.startSpawn();
    GAME.test.teleport(d.x + 30, d.z - 20);
    GAME.test.fastForward(0.3);
    P.heading = Math.PI / 2; GAME.cam.yaw = P.heading;
    P.weapons.pistol = { have: true, ammo: 30 };
    window.__homeOwned = [owned0, last0];
    GAME.playerWasted('test');
    GAME.test.fastForward(0.5);
    return r;
  }, homeCam.toString());
  var homeUp = true;
  try {
    await page.evaluate(function () { GAME.input.keys['KeyR'] = true; GAME.test.fastForward(1.2); GAME.input.keys['KeyR'] = false; });
    await page.waitForFunction(function () { return GAME.player.state === 'alive'; }, null, { timeout: 10000 });
  } catch (e) { homeUp = false; }
  var woke = await page.evaluate(function (homeCamSrc) {
    var homeCam = new Function('return ' + homeCamSrc)();
    var P = GAME.player, d = GAME.shops.startSpawn();
    GAME.test.fastForward(1);
    var r = {};
    r.fromDoor = Math.round(Math.hypot(P.pos.x - d.x, P.pos.z - d.z));
    r.toHospital = Math.round(Math.min.apply(null, GAME.city.pois.hospitals.map(function (h) { return Math.hypot(P.pos.x - h.spawn.x, P.pos.z - h.spawn.z); })));
    r.kept = !!(P.weapons.pistol && P.weapons.pistol.have);
    GAME.prefs.safehouses = window.__homeOwned[0]; GAME.prefs.lastHome = window.__homeOwned[1];
    P.health = 100;
    GAME.test.teleport(400, 0);
    GAME.test.fastForward(0.3);
    return r;
  }, homeCam.toString());
  check('answers: starting at the Dockside Flat, the camera stands clear of the house front',
    homes.dock.house && homes.dock.gap >= 1.5, JSON.stringify(homes.dock));
  check('answers: and at the Strip Condo', homes.condo.house && homes.condo.gap >= 1.5, JSON.stringify(homes.condo));
  // the Marina Villa's front yard is the villa's: a 30 m ramp rolled 19 m
  // from its door stood between the road and the house and hid it
  var yard = await page.evaluate(function () {
    var v = GAME.shops.locations().filter(function (l) { return l.sh && l.sh.id === 'villa'; })[0];
    var isla = GAME.city.ramps.filter(function (r) { return r.isla; });
    var near = 1e9;
    isla.forEach(function (r) { near = Math.min(near, Math.hypot(r.x - v.at.x, r.z - v.at.z)); });
    var nums = isla.map(function (r) { return r.islaN; }).sort(function (a, b) { return a - b; }).join(',');
    return { near: Math.round(near), count: isla.length, nums: nums };
  });
  check('answers: no island jump stands in the Marina Villa\'s front yard',
    yard.near >= 45, 'nearest jump ' + yard.near + ' m from the door');
  check('answers: and the island still has its ten, numbered as before',
    yard.count === 10 && yard.nums === '0,1,2,3,4,5,6,7,8,9', JSON.stringify(yard));
  check('answers: wasted with a home, you wake at the hospital, not its gate — weapons kept',
    homeUp && woke.toHospital < 3 && woke.fromDoor > 20 && woke.kept, JSON.stringify({ up: homeUp, woke: woke }));

  // ---------- 5g: from your play ----------
  // The map named Costa Rosa's districts and left Isla Verde blank. A patient
  // delivered to the hospital wandered off into town instead of going in. A
  // night's sleep left the weather as it was — two in a row, the same
  // shower. And a plane you jumped out of at landing speed stopped dead
  // beside you instead of rolling on the way a car does.
  var play = await page.evaluate(function () {
    var P = GAME.player, C = GAME.city, V = GAME.vehicles, M = GAME.missions, r = {};
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    if (M.active) M.failActive('test');
    GAME.test.fastForward(0.3);
    // --- the island's districts on the map
    var L = GAME.hud.testIslaLabels ? GAME.hud.testIslaLabels() : [];
    r.labels = L.map(function (l) {
      return { n: l[0], land: GAME.isla.contains(l[1], l[2]) && !C.isInWater(l[1], l[2]),
        right: GAME.isla.districtName(l[1], l[2]).toUpperCase() === l[0] };
    });

    // --- a patient delivered goes in through the hospital doors
    var wasOpen = GAME.isla.isOpen();
    GAME.godMode = true;
    var H = C.pois.hospitals[0];
    GAME.test.teleport(H.x + 40, H.spawn.z + 6);
    GAME.test.fastForward(0.3);
    var amb = V.spawnCar('ambulance', H.x + 40, H.spawn.z + 2, Math.PI / 2, {});
    GAME.test.enterNearestCar(amb); GAME.test.fastForward(1.2);
    GAME.test.pressKey('KeyJ', true); GAME.test.fastForward(1 / 60); GAME.test.pressKey('KeyJ', false);
    GAME.test.fastForward(0.3);
    var A = M.active;
    r.shift = !!(A && A.def.id === 'ambulance');
    if (r.shift) {
      var t0 = A.targets[0];
      amb.pos.set(t0.x + 3, C.groundY(t0.x + 3, t0.z), t0.z); amb.speed = 0;
      for (var k = 0; k < 600 && A.aboard === 0; k++) GAME.test.fastForward(1 / 60);
      r.aboard = A.aboard;
      // run them to the first hospital, at its own drop-off
      A.hospital = H; A.dropoff = [H.x + 30, H.spawn.z]; A.phase = 'dropoff';
      amb.pos.set(A.dropoff[0], C.groundY(A.dropoff[0], A.dropoff[1]), A.dropoff[1]); amb.speed = 0;
      GAME.test.fastForward(0.3);
      var w = GAME.world.peds.filter(function (p) { return p.state === 'enter'; })[0];
      r.walking = !!w;
      if (w) {
        var face = C.hash.query(H.x, H.z, 40).filter(function (b) { return b.tag === 'building' && b.minX <= H.x && b.maxX >= H.x; })
          .sort(function (a, b) { return (b.maxX - b.minX) * (b.maxZ - b.minZ) - (a.maxX - a.minX) * (a.maxZ - a.minZ); })[0];
        r.doorAtFront = !!face && Math.abs(w.enterZ - face.maxZ) < 1.5 && Math.abs(w.enterX - H.x) < 3;
        var tt = 0;
        for (; tt < 40 && !w.gone; tt += 0.25) GAME.test.fastForward(0.25);
        r.inside = { gone: w.gone, took: tt, fromDoor: +Math.hypot(w.pos.x - w.enterX, w.pos.z - w.enterZ).toFixed(1) };
      }
      GAME.test.pressKey('KeyJ', true); GAME.test.fastForward(1 / 60); GAME.test.pressKey('KeyJ', false);
      GAME.test.fastForward(0.3);
    }
    if (P.inCar) GAME.exitCar();
    GAME.test.fastForward(0.3);
    V.removeCar(amb);
    GAME.godMode = false;
    GAME.isla.setOpen(wasOpen);

    // --- a night's sleep runs the weather on: from a shower, you wake dry
    var W = GAME.weather, mode0 = W.mode, dry = 0, n = 200;
    W.setMode('auto', true);
    for (var i = 0; i < n; i++) {
      for (var g = 0; g < 400 && !(W.rain > 0); g++) W.pass(15);
      if (W.rain > 0) { W.pass(GAME.DAY_SECONDS / 3); if (W.rain === 0) dry++; }
    }
    r.dryWakes = dry + '/' + n;
    W.setMode(mode0, true);

    // --- a plane you jump out of at speed rolls on
    var x0 = -300, rp = C.nearestRoadPoint(x0, 0); x0 = rp.x;
    GAME.test.teleport(x0 - 4, rp.z);
    GAME.test.fastForward(0.3);
    var pl = V.spawnCar('airplane', x0, rp.z, Math.PI / 2, {});
    GAME.test.enterNearestCar(pl); GAME.test.fastForward(1.2);
    r.flying = P.inCar && P.car === pl;
    pl.pos.set(x0, C.groundY(x0, rp.z) + pl.spec.wheelH, rp.z); pl.heading = Math.PI / 2; pl.pitch = 0; pl.speed = 35;
    GAME.test.fastForward(1 / 60);
    GAME.test.pressKey('KeyF', true); GAME.test.fastForward(1 / 60); GAME.test.pressKey('KeyF', false);
    GAME.test.fastForward(0.1);
    var bx = pl.pos.x;
    GAME.test.fastForward(1);
    r.plane = { out: !P.inCar, firstSecond: +(pl.pos.x - bx).toFixed(1) };
    GAME.test.fastForward(20);
    r.plane.rolled = +(pl.pos.x - bx).toFixed(1); r.plane.stopped = pl.speed === 0; r.plane.dead = pl.dead;
    V.removeCar(pl);
    GAME.test.teleport(400, 0);
    GAME.test.fastForward(0.3);
    return r;
  });
  check('play: Isla Verde has its districts named on the map, as Costa Rosa does',
    play.labels.length === 4, JSON.stringify(play.labels.map(function (l) { return l.n; })));
  check('play: each on the island\'s own ground, inside the district it names',
    play.labels.length > 0 && play.labels.every(function (l) { return l.land && l.right; }), JSON.stringify(play.labels));
  check('play: a paramedic shift delivers a patient (anchor sanity)', play.shift && play.aboard === 1 && play.walking,
    JSON.stringify({ shift: play.shift, aboard: play.aboard, walking: play.walking }));
  check('play: the delivered patient makes for the hospital\'s front doors', play.doorAtFront);
  check('play: and goes in — gone at the door, not wandering the town',
    play.inside && play.inside.gone && play.inside.took < 30 && play.inside.fromDoor < 2.5, JSON.stringify(play.inside));
  check('play: a night\'s sleep in a shower wakes up dry, every time', play.dryWakes === '200/200', play.dryWakes);
  check('play: out of a plane at landing speed (anchor sanity)', play.flying && play.plane.out, JSON.stringify(play.plane));
  check('play: and it rolls on rather than stopping dead beside you',
    play.plane.firstSecond > 15 && play.plane.rolled > 40, JSON.stringify(play.plane));
  check('play: coasting down to a stop, in one piece', play.plane.stopped && !play.plane.dead, JSON.stringify(play.plane));

  // and the bed is what runs the night on
  var bedWx = await page.evaluate(function () {
    var P = GAME.player, W = GAME.weather, calls = [];
    if (P.inCar) GAME.exitCar();
    var home = GAME.shops.locations().filter(function (l) { return l.kind === 'safehouse'; })[0];
    GAME.prefs.safehouses = GAME.prefs.safehouses || [];
    window.__ownedBefore = GAME.prefs.safehouses.slice();
    if (GAME.prefs.safehouses.indexOf(home.sh.id) < 0) GAME.prefs.safehouses.push(home.sh.id);
    window.__pass0 = W.pass;
    W.pass = function (sec) { calls.push(sec); return window.__pass0(sec); };
    window.__wxCalls = calls;
    window.__msgs = [];
    GAME.shops.open(home);
    return { rested: GAME.shops.buy('rest') };
  });
  try {
    await page.waitForFunction(function () {
      return window.__msgs.some(function (m) { return m.indexOf('Eight hours later') >= 0; });
    }, null, { timeout: 8000 });
  } catch (e) { /* reported below */ }
  var bedCalls = await page.evaluate(function () {
    GAME.weather.pass = window.__pass0;
    GAME.prefs.safehouses = window.__ownedBefore;
    if (GAME.shops.isOpen) GAME.shops.close();
    return { calls: window.__wxCalls, day: GAME.DAY_SECONDS };
  });
  check('play: sleeping hands the sky its eight hours',
    bedWx.rested && bedCalls.calls.length === 1 && Math.abs(bedCalls.calls[0] - bedCalls.day / 3) < 0.01, JSON.stringify(bedCalls));

  // ---------- 5h: the water, again ----------
  // A plane you parachuted out of fell straight down where you left it. The
  // edge of the world sat 25-35 m off the coast. A boat sailed through the
  // bridge piers. And there was nothing to do in a boat: now there is a race
  // round the bay against rival boats, and a run to fish contraband out of it.
  var sea = await page.evaluate(function () {
    var P = GAME.player, C = GAME.city, V = GAME.vehicles, M = GAME.missions, r = {};
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    if (M.active) M.failActive('test');
    GAME.test.fastForward(0.3);
    GAME.godMode = true;

    // --- out of a plane in the air: it flies on, nose going down
    // (boarded on dry land, then put up over the bay)
    var lp = C.nearestRoadPoint(250, -200);
    GAME.test.teleport(lp.x - 4, lp.z);
    GAME.test.fastForward(0.3);
    var pl = V.spawnCar('airplane', lp.x, lp.z, Math.PI, {});
    GAME.test.enterNearestCar(pl); GAME.test.fastForward(1.2);
    pl.pos.set(520, 90, -100); pl.heading = Math.PI; pl.pitch = 0; pl.roll = 0; pl.speed = 40;
    GAME.test.fastForward(1 / 60);
    GAME.test.pressKey('KeyF', true); GAME.test.fastForward(1 / 60); GAME.test.pressKey('KeyF', false);
    GAME.test.fastForward(1 / 60);
    var bz = pl.pos.z, by = pl.pos.y;
    r.chute = P.parachuting;
    GAME.test.fastForward(2);
    r.glide = { ahead: +(bz - pl.pos.z).toFixed(1), dropped: +(by - pl.pos.y).toFixed(1), pitch: +pl.pitch.toFixed(2), dead: pl.dead };
    GAME.test.fastForward(8);
    r.glideEnd = { dead: pl.dead, gone: pl.sinking || pl.dead };
    if (GAME.aircraft.land) GAME.aircraft.land();
    P.parachuting = false;
    GAME.test.teleport(400, 0);
    GAME.test.fastForward(0.5);
    if (!pl.gone) V.removeCar(pl);

    // --- the edges stand well out to sea
    var E = GAME.aircraft.edges(), land = { minX: 1e9, minZ: 1e9, maxZ: -1e9 };
    for (var x = -900; x <= 1800; x += 20) for (var z = -900; z <= 900; z += 20) {
      if (C.islandAt(x, z)) { land.minX = Math.min(land.minX, x); land.minZ = Math.min(land.minZ, z); land.maxZ = Math.max(land.maxZ, z); }
    }
    r.edge = { west: land.minX - E.west, north: land.minZ - E.closed.minZ, south: E.closed.maxZ - land.maxZ };
    var q = { x: E.west + 40, z: 0 };
    r.edge.freeNear = !GAME.aircraft.enforceSea(q) && q.x === E.west + 40;
    q = { x: E.west - 40, z: 0 };
    r.edge.heldPast = GAME.aircraft.enforceSea(q) && q.x === E.west;

    // --- a boat into a bridge pier
    var pier = C.bridgePiers.filter(function (p) { return p.wet && p.x < 540; })[0];
    r.pierFound = !!pier;
    if (pier) {
      var sx = pier.x, sz = pier.z + 40, hd = Math.PI;
      GAME.test.teleport(sx + 4, sz);
      var boat = V.spawnCar('boat', sx, sz, hd, {});
      GAME.test.enterNearestCar(boat); GAME.test.fastForward(1.2);
      boat.pos.set(sx, -0.35, sz); boat.heading = hd; boat.speed = 0;
      var hp0 = boat.hp, minD = 1e9;
      GAME.test.pressKey('KeyW', true);
      for (var f = 0; f < 60 * 5; f++) { GAME.test.fastForward(1 / 60); minD = Math.min(minD, Math.hypot(boat.pos.x - pier.x, boat.pos.z - pier.z)); }
      GAME.test.pressKey('KeyW', false);
      r.pier = { inBoat: P.car === boat, closest: +minD.toFixed(1), dented: boat.hp < hp0 };
      GAME.exitCar(); GAME.test.fastForward(0.5);
      V.removeCar(boat);
    }

    // --- the regatta
    function boatTo(d) {
      if (P.inCar) GAME.exitCar();
      GAME.test.fastForward(0.3);
      var b = V.spawnCar('boat', d.start.x, d.start.z + 14, Math.PI, {});
      GAME.test.teleport(d.start.x + 3, d.start.z + 14);
      GAME.test.enterNearestCar(b); GAME.test.fastForward(1.2);
      b.pos.set(d.start.x, -0.35, d.start.z); b.speed = 0;
      GAME.test.fastForward(0.5);
      for (var k = 0; k < 60 * 6 && M.active && M.active.state !== 'run'; k++) GAME.test.fastForward(1 / 60);
      return b;
    }
    var reg = M.DEFS.filter(function (d) { return d.id === 'boat0'; })[0];
    var con = M.DEFS.filter(function (d) { return d.id === 'boat1'; })[0];
    r.defs = !!reg && !!con && reg.boat && con.boat;
    r.legsWet = !!reg && reg.cps.every(function (cp, i) {
      var a = i ? reg.cps[i - 1] : [reg.start.x, reg.start.z];
      for (var t = 0; t <= 1; t += 0.02) if (!C.isBoatWater(a[0] + (cp[0] - a[0]) * t, a[1] + (cp[1] - a[1]) * t)) return false;
      return true;
    });
    // a car in the ring is not a boat
    GAME.test.teleport(reg.start.x, reg.start.z);
    var car = V.spawnCar('sedan', 300, 0, 0, {});
    GAME.test.enterNearestCar(car); GAME.test.fastForward(1.2);
    car.pos.set(reg.start.x, 0, reg.start.z); car.speed = 0;
    GAME.test.fastForward(0.5);
    r.carRefused = !M.active;
    GAME.exitCar(); GAME.test.fastForward(0.3); V.removeCar(car);
    var b1 = boatTo(reg);
    var A = M.active;
    r.raceOn = !!(A && A.def === reg && A.state === 'run');
    r.field = A ? A.racers.map(function (c) { return c.type + (c.riderMesh ? '+helm' : ''); }) : [];
    var dry = 0;
    for (var t2 = 0; t2 < 25 && M.active; t2 += 0.25) {
      GAME.test.fastForward(0.25);
      A.racers.forEach(function (c) { if (!C.isBoatWater(c.pos.x, c.pos.z)) dry++; });
    }
    r.rivals = { cps: A.racers.map(function (c) { return c.cpIndex; }), dry: dry };
    for (var i = 0; i < reg.cps.length && M.active; i++) {
      b1.pos.set(reg.cps[i][0], -0.35, reg.cps[i][1]); b1.speed = 0;
      GAME.test.fastForward(0.1);
    }
    r.raceWon = !M.active && !!(GAME.bests && GAME.bests.boat0 !== undefined);
    GAME.test.fastForward(0.5);
    if (GAME.share && GAME.share.hide) GAME.share.hide();

    // --- contraband
    boatTo(con);
    A = M.active;
    r.runOn = !!(A && A.def === con);
    r.drops = A ? A.stops.map(function (st) {
      var nearPier = C.bridgePiers.some(function (p) { return Math.hypot(p.x - st[0], p.z - st[1]) < 16; });
      return C.isBoatWater(st[0], st[1]) && !nearPier;
    }) : [];
    r.homeLast = !!A && Math.hypot(A.stops[A.stops.length - 1][0] - con.start.x, A.stops[A.stops.length - 1][1] - con.start.z) < 1;
    r.packages = A ? A.stops.length - 1 : 0;
    var b2 = P.car;
    for (var j = 0; A && j < A.stops.length && M.active; j++) {
      b2.pos.set(A.stops[j][0], -0.35, A.stops[j][1]); b2.speed = 0;
      GAME.test.fastForward(0.1);
    }
    r.runWon = !M.active && !!(GAME.bests && GAME.bests.boat1 !== undefined);
    GAME.test.fastForward(0.5);
    if (GAME.share && GAME.share.hide) GAME.share.hide();
    if (P.inCar) { var last = P.car; GAME.exitCar(); GAME.test.fastForward(0.3); V.removeCar(last); }
    GAME.godMode = false;
    GAME.test.teleport(400, 0);
    GAME.test.fastForward(0.3);
    return r;
  });
  check('sea: out of a plane in the air (anchor sanity)', sea.chute, JSON.stringify(sea.glide));
  check('sea: the empty plane flies on and noses down instead of dropping where it was',
    sea.glide.ahead > 50 && sea.glide.dropped > 3 && sea.glide.pitch < -0.3, JSON.stringify(sea.glide));
  check('sea: and comes down in the end', sea.glideEnd.gone, JSON.stringify(sea.glideEnd));
  check('sea: the edge of the world stands at least two hundred metres off the land, every side',
    sea.edge.west >= 200 && sea.edge.north >= 200 && sea.edge.south >= 200, JSON.stringify(sea.edge));
  check('sea: open water short of it, held at it', sea.edge.freeNear && sea.edge.heldPast, JSON.stringify(sea.edge));
  check('sea: a boat driven at a bridge pier stops against it, dented',
    sea.pierFound && sea.pier.inBoat && sea.pier.closest > 3.5 && sea.pier.dented, JSON.stringify(sea.pier));
  check('sea: two jobs on the water', sea.defs);
  check('sea: every leg of the regatta is open water', sea.legsWet);
  check('sea: a car pulled up in its ring does not start it', sea.carRefused);
  check('sea: a boat does, against a field of three boats, each with somebody at the helm',
    sea.raceOn && sea.field.length === 3 && sea.field.every(function (f) { return f === 'boat+helm'; }), JSON.stringify(sea.field));
  check('sea: the rivals race the course, on the water the whole way',
    Math.max.apply(null, sea.rivals.cps) >= 2 && sea.rivals.dry === 0, JSON.stringify(sea.rivals));
  check('sea: and the regatta can be won', sea.raceWon);
  check('sea: contraband: three packages out on the open water, then home to the pier',
    sea.runOn && sea.packages === 3 && sea.drops.every(Boolean) && sea.homeLast, JSON.stringify({ drops: sea.drops, home: sea.homeLast }));
  check('sea: and fishing them all out passes it', sea.runWon);

  // Raced, not teleported: a driver taking the line round the marks — full
  // throttle, sliding the hard turns — wins it, and the field is still
  // racing at the end. The rivals once had a faster engine and a catch-up
  // past your top speed, which on legs that are all straights made the race
  // unwinnable; and a bump at a mark threw a rival's helmsman overboard.
  var regatta = await page.evaluate(function () {
    var P = GAME.player, M = GAME.missions, V = GAME.vehicles, r = {};
    if (P.inCar) GAME.exitCar();
    if (M.active) M.failActive('test');
    GAME.test.fastForward(13);   // any retry offer lapses
    var d = M.DEFS.filter(function (x) { return x.id === 'boat0'; })[0];
    var b = V.spawnCar('boat', d.start.x, d.start.z + 20, Math.PI, {});
    GAME.test.teleport(d.start.x + 3, d.start.z + 20);
    GAME.test.enterNearestCar(b); GAME.test.fastForward(1.2);
    b.pos.set(d.start.x, -0.35, d.start.z); b.speed = 0;
    GAME.test.fastForward(0.5);
    for (var k = 0; k < 60 * 6 && M.active && M.active.state !== 'run'; k++) GAME.test.fastForward(1 / 60);
    var A = M.active, t = 0;
    r.on = !!(A && A.def === d);
    window.__msgs = [];
    function key(c, on) { GAME.test.pressKey(c, on); }
    while (A && M.active && t < 150) {
      var cp = d.cps[Math.min(A.cpIndex, d.cps.length - 1)];
      var dh = U.wrapPI(Math.atan2(cp[0] - b.pos.x, cp[1] - b.pos.z) - b.heading);
      key('KeyW', Math.abs(dh) < 1.4 || b.speed < 8);
      key('KeyA', dh > 0.06); key('KeyD', dh < -0.06);
      key('Space', Math.abs(dh) > 0.7 && b.speed > 15);
      GAME.test.fastForward(1 / 60); t += 1 / 60;
    }
    ['KeyW', 'KeyA', 'KeyD', 'Space'].forEach(function (c) { key(c, false); });
    r.t = +t.toFixed(1);
    r.won = window.__msgs.some(function (m) { return /RACE WON/.test(m); });
    r.field = A ? A.racers.map(function (c) { return { cp: c.cpIndex, aboard: c.occupied === 'ai' }; }) : [];
    if (M.active) M.failActive('test');
    GAME.test.fastForward(0.5);
    if (GAME.share && GAME.share.hide) GAME.share.hide();
    if (P.inCar) { var last = P.car; GAME.exitCar(); GAME.test.fastForward(0.3); V.removeCar(last); }
    GAME.test.teleport(400, 0);
    GAME.test.fastForward(0.3);
    return r;
  });
  check('sea: the regatta is winnable by racing it well', regatta.on && regatta.won, JSON.stringify(regatta));
  check('sea: and it is a race: every rival still aboard and close behind at the flag',
    regatta.field.length === 3 && regatta.field.every(function (f) { return f.aboard && f.cp >= 7; }), JSON.stringify(regatta.field));

  // ---------- 5i: Lola's tips, and the camera ----------
  // The first lost tape was a cassette on the pavement and nothing more;
  // nobody said what it was. Lola now pages each first — once, for the life
  // of the save — and LOLA'S TIPS turns her off. And the player carries an
  // old film camera: C takes the frame as the game drew it, developed like a
  // print, into an album you download from, or straight to your downloads.
  var tips = await page.evaluate(function () {
    var P = GAME.player, L = GAME.lola, r = {};
    if (!L) return { missing: true };
    if (P.inCar) GAME.exitCar();
    var pages = [], pg0 = GAME.hud.pager;
    GAME.hud.pager = function (f, t) { pages.push(f + ': ' + t); return pg0.apply(GAME.hud, arguments); };
    try {
      GAME.prefs.lolaSeen = {};
      L.setTips(true);
      // a lost tape, the first and then a second
      var T = GAME.tapes.list().filter(function (t) { return !t.taken && !t.isla; });
      [T[0], T[1]].forEach(function (t) {
        GAME.test.teleport(t.x + 4, t.z);
        GAME.test.fastForward(0.3);
        P.pos.set(t.x, t.y, t.z);
        GAME.test.fastForward(0.2);
      });
      r.tapes = T[0].taken && T[1].taken;
      r.tapePages = pages.filter(function (p) { return /lost tape/i.test(p); }).length;
      r.tapeSays = pages.filter(function (p) { return /lost tape/i.test(p); })[0] || '';
      // the first star, once
      pages.length = 0;
      GAME.police.reportCrime('steal_police', P.pos);
      GAME.test.fastForward(0.2);
      GAME.police.clearWanted();
      GAME.police.reportCrime('steal_police', P.pos);
      GAME.test.fastForward(0.2);
      r.starPages = pages.filter(function (p) { return /law's eye/.test(p); }).length;
      GAME.police.clearWanted();
      // with tips off nothing is said, but it still counts as met
      pages.length = 0;
      L.setTips(false);
      r.toldOff = L.first('swim');
      r.swimSeen = !!GAME.prefs.lolaSeen.swim;
      L.setTips(true);
      r.notAgain = L.first('swim') === false && pages.length === 0;
      // the pause screen switch says which it is, and flips it
      GAME.togglePause();
      var b = document.getElementById('pause-tips');
      r.btnOn = /ON/.test(b.textContent);
      b.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      r.btnOff = /OFF/.test(b.textContent) && !L.tips;
      b.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      r.btnBack = L.tips;
      GAME.togglePause();
      // every tip has words, and the ones that name a key name the bound one
      r.allSay = L.keys().every(function (k) { return (L.line(k) || '').length > 20; });
    } finally {
      GAME.hud.pager = pg0;
      L.setTips(false);
    }
    GAME.test.teleport(400, 0);
    GAME.test.fastForward(0.3);
    return r;
  });
  check('tips: Lola says what a lost tape is, the first time', !tips.missing && tips.tapes && tips.tapePages === 1 && /thirty/.test(tips.tapeSays),
    JSON.stringify({ tapes: tips.tapes, pages: tips.tapePages, says: tips.tapeSays }));
  check('tips: and the first star, once', tips.starPages === 1, 'pages=' + tips.starPages);
  check('tips: with them switched off she stays quiet, but it still counts as met',
    tips.toldOff === false && tips.swimSeen && tips.notAgain, JSON.stringify(tips));
  check('tips: the pause screen switch shows the state and flips it', tips.btnOn && tips.btnOff && tips.btnBack, JSON.stringify(tips));
  check('tips: every tip has something to say', tips.allSay);

  // the camera: C, and a frame drawn (the shot is taken from the canvas
  // straight after a render, so this waits on real frames)
  var ph0 = await page.evaluate(function () {
    GAME.photo.close();
    GAME.prefs.photoAuto = false;
    GAME.test.teleport(330, 60);
    GAME.player.heading = Math.PI / 2; GAME.cam.yaw = Math.PI / 2;
    GAME.test.fastForward(0.5);
    var n = GAME.photo.count;
    GAME.test.pressKey('KeyC', true); GAME.test.fastForward(1 / 60); GAME.test.pressKey('KeyC', false);
    return { n: n, bindable: GAME.controls.ACTIONS.some(function (a) { return a[0] === 'KeyC'; }) };
  });
  var shot = null;
  try {
    await page.waitForFunction(function (n) { return GAME.photo.count > n && GAME.photo.album()[GAME.photo.count - 1].url; }, ph0.n, { timeout: 10000 });
    shot = await page.evaluate(async function () {
      var a = GAME.photo.album(), s = a[a.length - 1], cv = document.querySelector('canvas');
      // the print itself: its size, and the date stamp's orange in the corner
      var img = new Image();
      await new Promise(function (res) { img.onload = res; img.src = s.url; });
      var c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      var g = c.getContext('2d'); g.drawImage(img, 0, 0);
      var px = Math.round(img.height * 0.034), orange = 0;
      var d = g.getImageData(img.width - px * 9, img.height - px * 2.4, px * 8, px * 1.6).data;
      for (var i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i + 1] > 110 && d[i + 1] < 200 && d[i + 2] < 120) orange++;
      return { type: s.blob.type, kb: Math.round(s.blob.size / 1024), w: img.width, h: img.height, canvasW: cv.width, name: s.name,
        orange: orange, toast: document.getElementById('photo-toast').classList.contains('on') };
    });
  } catch (e) { shot = { error: String(e).slice(0, 120) }; }
  check('camera: taking a photo is an action you can rebind', ph0.bindable);
  check('camera: C takes a photo into the album, a JPEG of the frame',
    shot && shot.type === 'image/jpeg' && shot.kb > 20 && (shot.w === shot.canvasW || shot.w === 1920 || shot.w === 1440), JSON.stringify(shot));
  check('camera: developed like an old print, the date in orange in the corner', shot && shot.orange > 20, JSON.stringify(shot && { orange: shot.orange }));
  check('camera: and a print slides in to say so', shot && shot.toast);
  // The print opens the photo full size, and so does V (the mouse is aiming
  // in play, so the print can't always be clicked); the world holds still
  // while you look, and carries on when you close it.
  var pview = await page.evaluate(function () {
    var r = {}, a = GAME.photo.album(), last = a[a.length - 1];
    var v = document.getElementById('photo-view'), img = document.getElementById('photo-view-img');
    document.getElementById('photo-toast').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    r.fromPrint = GAME.photo.viewing === last && v.style.display === 'flex' && img.getAttribute('src') === last.url;
    r.paused = !!GAME.paused;
    GAME.onKeyDown('Escape');
    r.closedToPlay = !GAME.photo.viewing && v.style.display === 'none' && !GAME.paused;
    GAME.test.pressKey('KeyV', true); GAME.test.fastForward(1 / 60); GAME.test.pressKey('KeyV', false);
    r.byKey = GAME.photo.viewing === last && v.style.display === 'flex';
    GAME.onKeyDown('Escape');
    r.keyClosed = !GAME.photo.viewing && !GAME.paused;
    r.bindable = GAME.controls.ACTIONS.some(function (x) { return x[0] === 'KeyV'; });
    return r;
  });
  check('camera: the print opens the photo full size, and the world holds still', pview.fromPrint && pview.paused, JSON.stringify(pview));
  check('camera: closing it carries on with the game', pview.closedToPlay, JSON.stringify(pview));
  check('camera: V opens the last one full size too, and it is rebindable', pview.byKey && pview.keyClosed && pview.bindable, JSON.stringify(pview));
  // saved from the album, by name
  var dlName = null;
  try {
    var dl = page.waitForEvent('download', { timeout: 6000 });
    await page.evaluate(function () { GAME.togglePause(); GAME.photo.open(); document.querySelector('#photo-grid .ph-save').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    dlName = (await dl).suggestedFilename();
  } catch (e) { dlName = 'none: ' + String(e).slice(0, 80); }
  // a photo in the album opens full size, with a DOWNLOAD of its own; Esc
  // there goes back to the album, not the game
  var aview = await page.evaluate(function () {
    var r = {}, a = GAME.photo.album(), last = a[a.length - 1];
    var card = document.querySelector('#photo-grid .ph-card');     // newest first
    if (card) card.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    r.opened = GAME.photo.viewing === last && document.getElementById('photo-view-img').getAttribute('src') === last.url;
    return r;
  });
  var viewDl = null;
  try {
    var dl3 = page.waitForEvent('download', { timeout: 6000 });
    await page.evaluate(function () { document.getElementById('photo-view-save').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    viewDl = (await dl3).suggestedFilename();
  } catch (e) { viewDl = 'none: ' + String(e).slice(0, 80); }
  var aview2 = await page.evaluate(function () {
    GAME.onKeyDown('Escape');
    return { backToAlbum: !GAME.photo.viewing && GAME.photo.albumOpen && !!GAME.paused };
  });
  check('camera: a photo in the album opens full size', aview.opened, JSON.stringify(aview));
  check('camera: with a DOWNLOAD of its own', /^costa-rosa-1986-\d{8}-\d{6}\.jpg$/.test(viewDl || ''), viewDl);
  check('camera: and Esc there goes back to the album', aview2.backToAlbum, JSON.stringify(aview2));
  var albumKeys = await page.evaluate(function () {
    var r = { open: GAME.photo.albumOpen && document.getElementById('photo-album').style.display === 'flex' };
    GAME.onKeyDown('Escape');
    r.closed = !GAME.photo.albumOpen && GAME.paused;     // Esc put the album away, not the pause screen
    GAME.togglePause();
    r.resumed = !GAME.paused;
    return r;
  });
  check('camera: SAVE in the album downloads it, named for 1986', /^costa-rosa-1986-\d{8}-\d{6}\.jpg$/.test(dlName || ''), dlName);
  check('camera: Esc closes the album and leaves the pause screen up', albumKeys.open && albumKeys.closed && albumKeys.resumed, JSON.stringify(albumKeys));
  // AUTO-DOWNLOAD: every shot saved the moment it is taken
  var autoName = null;
  try {
    var dl2 = page.waitForEvent('download', { timeout: 8000 });
    await page.evaluate(function () {
      GAME.prefs.photoAuto = true;
      GAME.test.pressKey('KeyC', true); GAME.test.fastForward(1 / 60); GAME.test.pressKey('KeyC', false);
    });
    autoName = (await dl2).suggestedFilename();
  } catch (e) { autoName = 'none: ' + String(e).slice(0, 80); }
  await page.evaluate(function () { GAME.prefs.photoAuto = false; });
  check('camera: with AUTO-DOWNLOAD on, a shot goes straight to your downloads', /^costa-rosa-1986-.*\.jpg$/.test(autoName || ''), autoName);
  // and the album is still there on the next visit
  // (dropped from memory and read back from the browser's store, as a fresh
  // visit does — a second page here would be a second browser profile)
  var kept = null;
  try {
    await page.evaluate(function () { GAME.photo.testReload(); });
    await page.waitForFunction(function () { return GAME.photo.count >= 2; }, null, { timeout: 8000 });
    kept = await page.evaluate(function () { return GAME.photo.count; });
  } catch (e) { kept = 'none: ' + String(e).slice(0, 80); }
  check('camera: the album is still there on the next visit', typeof kept === 'number' && kept >= 2, String(kept));

  // ---------- 5j: walk-in businesses, a wardrobe, and Gull Downs ----------
  // The bar raised the bar: every business is a room now — the gun shop,
  // THREADS, the barber and the sergeant's desk — with
  // somebody behind the counter and the menu at the counter. Whatever you
  // own hangs in a wardrobe at home (two outfits from the start, and
  // everything bought since), and the slot machines at the Lucky Gull are
  // race terminals: pick a horse at the posted odds and watch it run.
  var biz = await page.evaluate(function () {
    var P = GAME.player, I = GAME.interiors, S = GAME.shops, out = [];
    if (P.inCar) GAME.exitCar();
    GAME.police.clearWanted();
    function walkTo(x, z, maxT) {
      for (var w = 0; w < (maxT || 8); w += 1 / 60) {
        var dx = x - P.pos.x, dz = z - P.pos.z;
        if (dx * dx + dz * dz < 0.2 || I.busy || GAME.shopOpen) break;
        P.heading = Math.atan2(dx, dz); GAME.cam.yaw = P.heading;
        GAME.test.pressKey('KeyW', true);
        GAME.test.fastForward(1 / 60);
      }
      GAME.test.pressKey('KeyW', false);
      GAME.test.fastForward(0.7);
    }
    // (the showroom is walked into where it stands: 5n)
    ['hardware0', 'dress0', 'barber0', 'bribe0'].forEach(function (id) {
      var r = { id: id };
      if (S.isOpen) S.close();
      var loc = S.locations().filter(function (l) { return l.id === id; })[0];
      if (!loc) { out.push(r); return; }
      // the sergeant's desk is for the wanted; the rest are open to anybody
      if (id === 'bribe0') GAME.test.setWanted(1);
      GAME.test.teleport(loc.at.x + 8, loc.at.z);
      GAME.test.fastForward(0.4);
      walkTo(loc.at.x, loc.at.z);
      var room = I.current;
      r.inside = !!room && room.id === id && room.kind === 'shop' && room.shop === loc.kind && P.interior === room;
      r.menuAtDoor = GAME.shopOpen;
      if (room) {
        var c = room.rings.filter(function (x) { return !/EXIT/.test(x.label); })[0];
        r.counter = c && c.label;
        if (c) walkTo(c.x, c.z);
        r.opens = GAME.shopOpen && S.current === loc;
        if (S.isOpen) S.close();
        GAME.test.fastForward(0.3);
        I.leave(); GAME.test.fastForward(1.2);
        r.out = !I.current && !P.interior;
      }
      GAME.police.clearWanted();
      out.push(r);
    });
    // a shop is no place to wait out the law: the heat holds in there
    var hl = S.locations().filter(function (l) { return l.id === 'dress0'; })[0];
    GAME.test.teleport(hl.at.x + 8, hl.at.z);
    GAME.test.fastForward(0.4);
    GAME.test.setWanted(2);
    walkTo(hl.at.x, hl.at.z);
    var heat = { inside: !!I.current };
    GAME.test.fastForward(45);
    heat.stars = GAME.police.wanted;
    // (stood down before the door: out of it at two stars, with the
    // cruisers that waited for you at the kerb, you could be busted on the
    // step, and the groups after this started on the floor of a cell)
    GAME.police.clearWanted();
    if (S.isOpen) S.close();
    I.leave(); GAME.test.fastForward(1.2);
    return { rooms: out, heat: heat };
  });
  biz.rooms.forEach(function (r) {
    check('business: ' + r.id + ' is a room you walk into, and its counter opens the shop',
      r.inside && !r.menuAtDoor && r.opens && r.out, JSON.stringify(r));
  });
  check('business: a shop does not hide you — the stars are still there when you come out', biz.heat.inside && biz.heat.stars === 2, JSON.stringify(biz.heat));

  var wr = await page.evaluate(function () {
    var P = GAME.player, I = GAME.interiors, S = GAME.shops, r = {};
    var owned0 = (GAME.prefs.safehouses || []).slice(), outfit0 = JSON.parse(JSON.stringify(GAME.prefs.outfit || {})), closet0 = GAME.prefs.closet;
    function walkTo(x, z, maxT) {
      for (var w = 0; w < (maxT || 8); w += 1 / 60) {
        var dx = x - P.pos.x, dz = z - P.pos.z;
        if (dx * dx + dz * dz < 0.2 || I.busy || GAME.shopOpen) break;
        P.heading = Math.atan2(dx, dz); GAME.cam.yaw = P.heading;
        GAME.test.pressKey('KeyW', true);
        GAME.test.fastForward(1 / 60);
      }
      GAME.test.pressKey('KeyW', false);
      GAME.test.fastForward(0.7);
    }
    // (on your feet and in the street, whatever the last group left)
    for (var up = 0; up < 20 && P.state !== 'alive'; up++) GAME.test.fastForward(0.5);
    if (P.inCar) GAME.exitCar();
    if (I.current) { I.leave(); GAME.test.fastForward(1.2); }
    GAME.police.clearWanted();
    try {
      // a fresh save owns two outfits before it has bought a thing
      delete GAME.prefs.closet;
      GAME.prefs.outfit = { shirt: 'white', pants: 'teal', hairStyle: outfit0.hairStyle || 'crew', hairColor: outfit0.hairColor || 'black' };
      var c = S.closet();
      r.start = c.shirts.slice().sort().join(',') + '/' + c.pants.slice().sort().join(',');
      // the wardrobe at home
      GAME.prefs.safehouses = ['condo'];
      var mats = S.blips().filter(function (b) { return b.label === '⌂'; });
      var condo = mats.filter(function (b) { return Math.abs(b.x - 337) < 30 && Math.abs(b.z - 208) < 30; })[0];
      GAME.test.teleport(condo.x + 8, condo.z);
      GAME.test.fastForward(0.4);
      walkTo(condo.x, condo.z);
      var room = I.current;
      r.home = !!room && room.kind === 'home';
      if (!r.home) r.why = { st: P.state, inCar: P.inCar, busy: I.busy, shop: GAME.shopOpen, d: Math.round(Math.hypot(P.pos.x - condo.x, P.pos.z - condo.z)) };
      var ring = room && room.rings.filter(function (x) { return /WARDROBE/.test(x.label); })[0];
      r.ring = !!ring;
      // not on the way in from the door
      r.clear = !!ring && Math.hypot(ring.x - room.entry.x, ring.z - room.entry.z) > 2.5;
      if (ring) { (ring.via || []).forEach(function (p) { walkTo(p.x, p.z); }); walkTo(ring.x, ring.z); }
      r.opens = GAME.shopOpen && S.current && S.current.kind === 'wardrobe';
      var rows = r.opens ? document.getElementById('shop-items').innerText : '';
      r.lists = /Club White/.test(rows) && /Banana Cream/.test(rows) && /Teal Classics/.test(rows) && /Sand Chinos/.test(rows) && !/Hot Pink|Midnight/.test(rows);
      var cash = P.cash;
      S.buy('shirt_banana');
      r.changed = GAME.prefs.outfit.shirt === 'banana' && P.cash === cash;
      if (S.isOpen) S.close();
      I.leave(); GAME.test.fastForward(1.2);
      // THREADS: a new shirt costs, and goes in the wardrobe; one you own is free
      var th = S.locations().filter(function (l) { return l.kind === 'dress'; })[0];
      var fresh = S.wardrobe.SHIRTS.filter(function (s) { return c.shirts.indexOf(s.id) < 0; })[0];
      P.cash = Math.max(P.cash, 1000);
      GAME.test.teleport(th.at.x + 8, th.at.z);
      GAME.test.fastForward(0.4);
      walkTo(th.at.x, th.at.z);
      var counter = I.current && I.current.rings.filter(function (x) { return /MIRROR/.test(x.label); })[0];
      if (counter) walkTo(counter.x, counter.z);
      r.threads = GAME.shopOpen && S.current === th;
      cash = P.cash;
      S.buy('shirt_' + fresh.id);
      r.bought = cash - P.cash === 150 && S.closet().shirts.indexOf(fresh.id) >= 0 && GAME.prefs.outfit.shirt === fresh.id;
      cash = P.cash;
      S.buy('shirt_white');
      r.ownFree = cash === P.cash && GAME.prefs.outfit.shirt === 'white';
      if (S.isOpen) S.close();
      I.leave(); GAME.test.fastForward(1.2);
      // and it is in the wardrobe the next time you're home
      GAME.test.teleport(condo.x + 8, condo.z);
      GAME.test.fastForward(0.4);
      walkTo(condo.x, condo.z);
      ring = I.current && I.current.rings.filter(function (x) { return /WARDROBE/.test(x.label); })[0];
      if (ring) { (ring.via || []).forEach(function (p) { walkTo(p.x, p.z); }); walkTo(ring.x, ring.z); }
      r.hangs = GAME.shopOpen && document.getElementById('shop-items').innerText.indexOf(fresh.name) >= 0;
      r.fresh = fresh.name;
      if (S.isOpen) S.close();
      I.leave(); GAME.test.fastForward(1.2);
    } finally {
      GAME.prefs.safehouses = owned0;
      GAME.prefs.outfit = outfit0;
      if (closet0) GAME.prefs.closet = closet0; else delete GAME.prefs.closet;
      if (S.applyOutfit) S.applyOutfit();
    }
    return r;
  });
  check('wardrobe: you own two outfits before you buy anything', wr.start === 'banana,white/sand,teal', wr.start);
  check('wardrobe: there is one at home, clear of the door, and it lists what you own', wr.home && wr.ring && wr.clear && wr.opens && wr.lists, JSON.stringify(wr));
  check('wardrobe: changing in it is free', wr.changed, JSON.stringify(wr));
  check('wardrobe: THREADS charges for new clothes and hangs them in your wardrobe; what you own is free there',
    wr.threads && wr.bought && wr.ownFree && wr.hangs, JSON.stringify(wr));

  var gd = await page.evaluate(function () {
    var P = GAME.player, I = GAME.interiors, S = GAME.shops, D = GAME.derby, r = {};
    if (!D) return { missing: true };
    function walkTo(x, z, maxT) {
      for (var w = 0; w < (maxT || 8); w += 1 / 60) {
        var dx = x - P.pos.x, dz = z - P.pos.z;
        if (dx * dx + dz * dz < 0.2 || I.busy || GAME.shopOpen) break;
        P.heading = Math.atan2(dx, dz); GAME.cam.yaw = P.heading;
        GAME.test.pressKey('KeyW', true);
        GAME.test.fastForward(1 / 60);
      }
      GAME.test.pressKey('KeyW', false);
      GAME.test.fastForward(0.3);
    }
    for (var up = 0; up < 20 && P.state !== 'alive'; up++) GAME.test.fastForward(0.5);
    if (P.inCar) GAME.exitCar();
    if (I.current) { I.leave(); GAME.test.fastForward(1.2); }
    GAME.police.clearWanted();
    var cas = S.locations().filter(function (l) { return l.kind === 'casino'; })[0];
    GAME.test.teleport(cas.at.x + 8, cas.at.z);
    GAME.test.fastForward(0.4);
    walkTo(cas.at.x, cas.at.z); GAME.test.fastForward(0.5);
    var room = I.current;
    r.inside = !!room && room.kind === 'casino';
    if (!room) { r.why = { st: P.state, inCar: P.inCar, busy: I.busy, shop: GAME.shopOpen, d: Math.round(Math.hypot(P.pos.x - cas.at.x, P.pos.z - cas.at.z)) }; return r; }
    // the screens show the races: one big one and one in every terminal
    var tex = D.texture(), screens = 0;
    GAME.scene.traverse(function (o) { if (o.material && o.material.map === tex) screens++; });
    r.screens = screens;
    // the regulars face their terminals, and cheer when the horses run
    var fans = room.anim.filter(function (a) { return a.fan; });
    r.fansFace = fans.length >= 3 && fans.every(function (a) { return Math.abs(a.fig.rotation.y - Math.PI / 2) < 0.01 && a.fig.position.x < room.ox + room.w / 2 - 0.9; });
    // the races go on by themselves while you're in the room
    var race0 = D.race, st0 = D.state;
    for (var k = 0; k < 40 && D.state === 'board'; k++) GAME.test.fastForward(1);
    r.ambient = st0 === 'board' && D.state === 'running';
    var arms = fans[0].fig.userData.joints.armL.rotation.x;
    GAME.test.fastForward(0.5);
    r.cheer = D.cheering && fans[0].fig.userData.joints.armL.rotation.x < -1.8;
    for (k = 0; k < 40 && D.race === race0; k++) GAME.test.fastForward(1);
    r.next = D.race === race0 + 1 && D.state === 'board';
    // the odds on the board are a book with the house's cut in it
    var f = D.field(), sum = 0;
    f.runners.forEach(function (h) { sum += h.p; });
    r.book = Math.abs(sum - 1) < 1e-6 && f.runners.every(function (h) { return h.p * (h.odds + 1) < 1 && h.p > 0; });
    // the free terminal: a horse menu with the stakes underneath
    var ring = room.rings.filter(function (x) { return /GULL DOWNS/.test(x.label); })[0];
    r.ring = !!ring;
    if (ring) walkTo(ring.x, ring.z);
    r.opens = GAME.shopOpen && S.current && S.current.kind === 'derby';
    var rows = r.opens ? document.getElementById('shop-items').innerText : '';
    r.rows = f.runners.every(function (h) { return rows.indexOf(h.name) >= 0; }) && /^YOUR STAKE · \$100/.test(rows) && /\$2,000/.test(rows);
    r.chip = /BET · \$100/.test(rows);
    // a $500 stake on number 2, rigged to win: the stake goes, then odds+1 times it comes back
    P.cash = 5000;
    S.buy('stake');
    r.stake = D.stake === 500 && P.cash === 5000 && /YOUR STAKE · \$500/.test(document.getElementById('shop-items').innerText);
    var odds = f.runners[1].odds;
    D.rig(2);
    S.buy('horse2');
    r.betDown = P.cash === 4500 && !GAME.shopOpen && D.bet && D.bet.n === 2;
    GAME.test.fastForward(4);
    r.tv = document.getElementById('derby-tv').style.display === 'block' && D.state === 'running';
    for (k = 0; k < 30 && D.state === 'running'; k++) GAME.test.fastForward(1);
    r.won = D.order()[0] === 2 && P.cash === 4500 + 500 * (odds + 1);
    r.paid = P.cash;
    r.want = 4500 + 500 * (odds + 1);
    // one bet a race
    for (k = 0; k < 10 && D.state !== 'board'; k++) GAME.test.fastForward(1);
    walkTo(ring.x - 2.5, ring.z); walkTo(ring.x, ring.z);
    r.reopen = GAME.shopOpen;
    for (k = 0; k < 3 && D.stake !== 100; k++) S.buy('stake');
    D.rig(5);
    S.buy('horse1');
    var c1 = P.cash;
    S.open(D.loc);
    var again = S.buy('horse3');
    r.oneBet = again === false && P.cash === c1 && /One bet a race/.test(document.getElementById('shop-items').innerText);
    if (S.isOpen) S.close();
    for (k = 0; k < 40 && D.bet; k++) GAME.test.fastForward(1);
    r.lost = !D.bet && D.order()[0] === 5 && P.cash === c1;
    // out of the room, with nothing riding on it, the course is quiet
    I.leave(); GAME.test.fastForward(1.2);
    var st1 = D.state, c1b = D.race;
    GAME.test.fastForward(30);
    r.quiet = D.state === st1 && D.race === c1b && document.getElementById('derby-tv').style.display === 'none';
    return r;
  });
  check('Gull Downs: the races are on a big screen and on every terminal', !gd.missing && gd.inside && gd.screens >= 7, JSON.stringify(gd));
  check('Gull Downs: the regulars face their terminals and cheer the horses home', gd.fansFace && gd.cheer, JSON.stringify(gd));
  check('Gull Downs: a race runs every half-minute or so while you are in the room', gd.ambient && gd.next, JSON.stringify(gd));
  check('Gull Downs: the odds are a fair book with the house\'s cut', gd.book, JSON.stringify(gd));
  check('Gull Downs: the free terminal lists the runners, under your stake', gd.ring && gd.opens && gd.rows && gd.chip, JSON.stringify(gd));
  check('Gull Downs: a bet takes the stake and shows your race on a set of your own', gd.stake && gd.betDown && gd.tv, JSON.stringify(gd));
  check('Gull Downs: a winner pays the odds and your stake back', gd.won, JSON.stringify({ paid: gd.paid, want: gd.want }));
  check('Gull Downs: one bet a race, and a loser pays nothing', gd.reopen && gd.oneBet && gd.lost, JSON.stringify(gd));
  check('Gull Downs: away from the casino with nothing on, nothing runs', gd.quiet, JSON.stringify(gd));

  // ---------- 5k: homes like their outsides, and the chimes on the horn ----------
  // A place you bought put SLEEP IT OFF in front of you on the pavement;
  // now the door opens and in you go. Every home was one room with the bed
  // in view of the door: the flat still is, but the condo's bedroom is
  // through a door at the back, and the villa is two storeys — a hall under
  // a double-height ceiling, the kitchen under the gallery, and stairs up to
  // the bedroom. And the ice cream truck's horn is its chimes, as in Vice
  // City: nobody comes to the hatch who has not heard them.
  var homes5k = await page.evaluate(function () {
    var P = GAME.player, I = GAME.interiors, S = GAME.shops, r = {};
    var owned0 = (GAME.prefs.safehouses || []).slice(), last0 = GAME.prefs.lastHome, cash0 = P.cash;
    function walkTo(x, z, maxT) {
      for (var w = 0; w < (maxT || 10); w += 1 / 60) {
        var dx = x - P.pos.x, dz = z - P.pos.z;
        if (dx * dx + dz * dz < 0.2 || I.busy || GAME.shopOpen) break;
        P.heading = Math.atan2(dx, dz); GAME.cam.yaw = P.heading;
        GAME.test.pressKey('KeyW', true);
        GAME.test.fastForward(1 / 60);
      }
      GAME.test.pressKey('KeyW', false);
      GAME.test.fastForward(0.5);
    }
    function homeLoc(id) { return S.locations().filter(function (l) { return l.sh && l.sh.id === id; })[0]; }
    function goIn(id) {
      if (I.current) I.reset();
      var loc = homeLoc(id);
      GAME.test.teleport(loc.at.x + 8, loc.at.z); GAME.test.fastForward(0.3);
      I.enter(loc); GAME.test.fastForward(1.2);
      return I.current;
    }
    try {
      if (P.inCar) GAME.exitCar();
      GAME.police.clearWanted();
      if (GAME.missions.active) GAME.missions.failActive('test');
      // buying the condo: the menu goes, the door opens, the deed card waits inside
      GAME.prefs.safehouses = [];
      P.cash = 50000;
      var condo = homeLoc('condo');
      GAME.test.teleport(condo.at.x + 8, condo.at.z); GAME.test.fastForward(0.3);
      walkTo(condo.at.x, condo.at.z);
      r.forSale = GAME.shopOpen && /BUY STRIP CONDO/.test(document.getElementById('shop-items').textContent);
      S.buy('buy');
      r.menuGone = !GAME.shopOpen;
      GAME.test.fastForward(1.2);
      r.inside = !!I.current && I.current.id === 'home_condo';
      r.card = !!GAME.share.isOpen;
      if (GAME.share.isOpen) GAME.share.hide();
      GAME.prefs.safehouses = ['dock', 'condo', 'villa'];
      // the flat: one room, the bed straight ahead of the door
      var flat = goIn('dock'), fb = flat.rings[1];
      r.flatOneRoom = !fb.via;
      walkTo(fb.x, fb.z);
      r.flatBed = GAME.shopOpen && /SLEEP IT OFF/.test(document.getElementById('shop-items').textContent);
      if (GAME.shopOpen) S.close();
      // the condo: straight at the bed from the door, you meet the bedroom wall
      var cr = goIn('condo'), cb = cr.rings[1];
      walkTo(cb.x, cb.z, 6);
      r.condoWall = !GAME.shopOpen && Math.hypot(P.pos.x - cb.x, P.pos.z - cb.z) > 2;
      if (GAME.shopOpen) S.close();
      I.reset(); cr = goIn('condo');
      cb.via.forEach(function (p) { walkTo(p.x, p.z); });
      walkTo(cb.x, cb.z);
      r.condoBed = GAME.shopOpen && /SLEEP IT OFF/.test(document.getElementById('shop-items').textContent);
      if (GAME.shopOpen) S.close();
      // the villa: up the stairs to the bed
      var v = goIn('villa'), vb = v.rings[1];
      r.villaBedUp = vb.y > 3;
      walkTo(vb.via[0].x, vb.via[0].z);
      var climb = [];
      walkTo(vb.via[1].x, vb.via[1].z);
      r.upstairs = +P.pos.y.toFixed(2);
      GAME.test.fastForward(0.6);
      r.camAbove = GAME.cameraObj.position.y > v.slab.y + 0.3;
      walkTo(vb.x, vb.z);
      r.villaBed = GAME.shopOpen && /SLEEP IT OFF/.test(document.getElementById('shop-items').textContent);
      if (GAME.shopOpen) S.close();
      var vw = v.rings.filter(function (x) { return /WARDROBE/.test(x.label); })[0];
      r.wardrobeUp = vw.y > 3;
      // down again, to the kitchen under the gallery
      walkTo(vb.via[1].x, vb.via[1].z); walkTo(vb.via[0].x, vb.via[0].z);
      r.downAgain = P.pos.y < 0.1;
      walkTo(v.ox + 1, v.oz + 3);
      P.heading = 0; GAME.cam.yaw = 0; GAME.cam.pitch = 0.7; GAME.test.fastForward(0.8);
      r.kitchen = { y: +P.pos.y.toFixed(2), camY: +GAME.cameraObj.position.y.toFixed(2), under: v.slab.under };
      // and the bed's mat, from under it, does nothing
      walkTo(vb.x, vb.z, 6);
      r.notFromBelow = !GAME.shopOpen && P.pos.y < 0.1;
      if (GAME.shopOpen) S.close();
      I.reset();
    } finally {
      if (GAME.share.isOpen) GAME.share.hide();
      if (GAME.shopOpen) S.close();
      I.reset();
      GAME.prefs.safehouses = owned0; GAME.prefs.lastHome = last0; P.cash = cash0;
    }
    GAME.test.teleport(400, 0); GAME.test.fastForward(0.3);
    return r;
  });
  check('homes: buying a place takes you in through the door — not SLEEP IT OFF on the pavement',
    homes5k.forSale && homes5k.menuGone && homes5k.inside, JSON.stringify(homes5k));
  check('homes: and the deed card is waiting once you are inside', homes5k.card, JSON.stringify(homes5k));
  check('homes: the Dockside Flat is one room, the bed straight ahead', homes5k.flatOneRoom && homes5k.flatBed, JSON.stringify(homes5k));
  check('homes: the Strip Condo keeps its bedroom behind a wall, through a door', homes5k.condoWall && homes5k.condoBed, JSON.stringify(homes5k));
  check('homes: the Marina Villa\'s bedroom is upstairs, and the stairs take you there',
    homes5k.villaBedUp && homes5k.wardrobeUp && homes5k.upstairs > 3.4 && homes5k.villaBed, JSON.stringify(homes5k));
  check('homes: upstairs the camera stays above the floor you are on', homes5k.camAbove, JSON.stringify(homes5k));
  check('homes: downstairs, under the gallery, you are on the ground floor and so is the camera',
    homes5k.downAgain && homes5k.kitchen.y < 0.1 && homes5k.kitchen.camY <= homes5k.kitchen.under, JSON.stringify(homes5k.kitchen));
  check('homes: a mat upstairs does nothing for somebody standing under it', homes5k.notFromBelow, JSON.stringify(homes5k));

  var chimes = await page.evaluate(function () {
    var P = GAME.player, r = {};
    GAME.police.clearWanted();
    GAME.test.teleport(-150, 40);
    GAME.test.fastForward(0.8);
    if (P.inCar) GAME.exitCar();
    var truck = GAME.test.spawnCar('icecream', 3, 0);
    if (!truck) return { noTruck: true };
    GAME.test.fastForward(0.4);
    GAME.test.enterNearestCar(truck);
    GAME.test.fastForward(1.5);
    if (!P.inCar) return { noBoard: true };
    var played = 0, horn0 = GAME.audio.horn, chime0 = GAME.audio.chime;
    GAME.audio.chime = function () { played++; return chime0.apply(GAME.audio, arguments); };
    // (a horn from the truck itself, not traffic honking somewhere nearby)
    GAME.audio.horn = function (x, z) {
      if (P.car && Math.hypot(x - P.car.pos.x, z - P.car.pos.z) < 1) r.plainHorn = true;
      return horn0.apply(GAME.audio, arguments);
    };
    try {
      // off the clock, the horn is still the chimes
      GAME.test.pressKey('KeyG'); GAME.test.fastForward(1 / 60); GAME.test.pressKey('KeyG', false);
      r.offClock = played === 1 && !r.plainHorn;
      GAME.test.fastForward(1.5);
      GAME.test.pressKey('KeyJ'); GAME.test.fastForward(0.6); GAME.test.pressKey('KeyJ', false);
      var a = GAME.missions.active;
      r.onRound = !!a && a.def.id === 'icecream';
      if (!r.onRound) return r;
      r.hint = /plays the chimes/.test(GAME.missions.objectiveText());
      for (var sp = 0; sp < 3; sp++) {
        var extra = GAME.test.spawnPed([11, -9, 7][sp], [0, 7, -10][sp]);
        if (extra) { extra.jobPed = false; extra.iceServed = false; }
      }
      // parked by people for eight seconds, silent: nobody comes, and nothing plays by itself
      played = 0;
      for (var t = 0; t < 8 * 60; t++) { P.car.speed = 0; GAME.test.fastForward(1 / 60); }
      r.silent = { walkUps: a.targets.filter(function (x) { return x.walkUp; }).length, played: played };
      // one blast of the chimes and they come. (People on the pavement right
      // now: the ones put down before the silence have had eight seconds to
      // wander off, and on a runner with a thinned crowd that was everybody.)
      r.listeners = 0;
      for (var sp2 = 0; sp2 < 3; sp2++) {
        var near = GAME.test.spawnPed([8, -7, 5][sp2], [3, 6, -8][sp2]);
        if (near) { near.jobPed = false; near.iceServed = false; near.state = 'walk'; r.listeners++; }
      }
      GAME.test.pressKey('KeyG'); GAME.test.fastForward(1 / 60); GAME.test.pressKey('KeyG', false);
      for (t = 0; t < 4 * 60; t++) { P.car.speed = 0; GAME.test.fastForward(1 / 60); }
      r.heard = { walkUps: a.targets.filter(function (x) { return x.walkUp; }).length + a.sales, played: played };
    } finally {
      GAME.audio.chime = chime0; GAME.audio.horn = horn0;
      if (P.car) { P.car.speed = 0; P.car.lat = 0; }
      if (P.inCar) GAME.exitCar();
      GAME.test.fastForward(1.5);
      if (GAME.share.isOpen) GAME.share.hide();
      if (truck && !truck.dead) GAME.vehicles.removeCar(truck);
      GAME.test.fastForward(0.3);
    }
    return r;
  });
  check('ice cream: the truck\'s horn is its chimes', !chimes.noTruck && !chimes.noBoard && chimes.offClock, JSON.stringify(chimes));
  check('ice cream: on a round the chimes no longer play themselves, and nobody comes without them',
    chimes.onRound && chimes.silent && chimes.silent.played === 0 && chimes.silent.walkUps === 0, JSON.stringify(chimes));
  check('ice cream: sound them and people come to the hatch', chimes.listeners > 0 && chimes.heard && chimes.heard.played === 1 && chimes.heard.walkUps > 0, JSON.stringify(chimes));
  check('ice cream: the round says which button plays them', chimes.hint, JSON.stringify(chimes));

  // ---------- 5l: shot-at drivers, the glass lift, the roof, and Lola on call ----------
  // A driver whose car took a round only ever got out once it was burning;
  // now they floor it, bail and run, come at you, get out shooting, or shoot
  // back from the window. The tower's lift is a glass car up the outside of
  // the building, ridden through your own eyes; the helipad's parapet holds
  // you, and a fall from up there kills. And Lola can be called up — L, or
  // ASK LOLA on the pause screen — to say what to do next and mark it.
  var shot = await page.evaluate(function () {
    var P = GAME.player, V = GAME.vehicles, r = { kinds: {} };
    // (the city as it ships: with it switched off nobody is carrying, and an
    // earlier group leaves it that way)
    var city0 = GAME.chaos.level;
    GAME.chaos.set(3);
    if (P.inCar) GAME.exitCar();
    GAME.police.clearWanted();
    GAME.test.teleport(356, 40); GAME.test.fastForward(0.5);
    function traffic(dz) {
      var c = V.spawnCar('sedan', P.pos.x, P.pos.z + dz, 0, { occupied: 'ai', ai: { mode: 'traffic', desired: 0, laneX: 0, laneZ: 0 } });
      if (c) c.speed = 0;
      return c;
    }
    // a real round from a real gun reaches the driver
    GAME.combat.giveWeapon('pistol', 60); P.currentWeapon = 'pistol'; GAME.combat.refreshWeaponHud();
    var c0 = traffic(9), seen = null, sa0 = V.shotAt;
    V.shotAt = function (car) { if (car === c0) seen = true; return sa0.apply(V, arguments); };
    try {
      P.heading = 0; GAME.cam.yaw = 0; GAME.cam.pitch = 0.05;
      GAME.input.lockGraceT = 0;
      for (var shotN = 0; shotN < 6 && !seen; shotN++) {
        GAME.input.lmbPressed = true; GAME.test.fastForward(0.4);
      }
    } finally { V.shotAt = sa0; }
    r.realRound = !!seen && c0.hp < c0.spec.hp;
    if (c0 && !c0.dead) V.removeCar(c0);
    // Those rounds can earn a star, and in the full suite an officer is
    // sometimes on this corner: an arrest in the ten seconds below took the
    // window shooter's target away (it fires only at somebody on their feet)
    // and left the lift group starting in handcuffs. The law stays out of it.
    GAME.police.clearWanted();
    // each way a driver can take it, forced in turn
    var rolls = { flee: 0.1, bail: 0.4, fight: 0.65, shoot: 0.8, fireback: 0.95 }, rnd = Math.random;
    var shots = 0, sh0 = GAME.combat.npcShoot;
    GAME.combat.npcShoot = function () { shots++; return false; };
    try {
      Object.keys(rolls).forEach(function (k) {
        var c = traffic(14);
        if (!c) return;
        var drivers0 = GAME.world.peds.length;
        Math.random = function () { return rolls[k]; };
        var got;
        try { got = V.shotAt(c); } finally { Math.random = rnd; }
        var out = GAME.world.peds.filter(function (p) { return p.leftCar === c.serial; })[0];
        var o = { got: got, inCar: c.occupied === 'ai', out: !!out, state: out && out.state, armed: out && out.carrying };
        if (k === 'flee') { o.panic = c.ai && c.ai.panicT > 0; }
        shots = 0;
        if (k === 'shoot' || k === 'fireback') {
          for (var t = 0; t < 5 * 60; t++) {
            if (t % 30 === 0) GAME.police.clearWanted();
            P.pos.set(c.pos.x, P.pos.y, c.pos.z - 14); GAME.test.fastForward(1 / 60);
          }
          o.shots = shots;
          o.you = P.state;
        }
        r.kinds[k] = o;
        if (out && !out.dead) { out.state = 'walk'; out.foe = null; out.carrying = false; }
        if (!c.dead) V.removeCar(c);
      });
      // and a second volley at somebody who chose to drive it out: they give up on it
      var c2 = traffic(14);
      Math.random = function () { return 0.1; };
      try { V.shotAt(c2); } finally { Math.random = rnd; }
      c2.hp = c2.spec.hp * 0.4;
      r.secondVolley = V.shotAt(c2);
      if (!c2.dead) V.removeCar(c2);
      // police cars and mission cars are none of this
      var cop = V.spawnCar('police', P.pos.x + 6, P.pos.z + 14, 0, { occupied: 'ai', ai: { mode: 'traffic', desired: 0, laneX: 0, laneZ: 0 } });
      r.copIgnored = cop ? V.shotAt(cop) === null : true;
      if (cop) V.removeCar(cop);
    } finally { GAME.combat.npcShoot = sh0; Math.random = rnd; GAME.chaos.set(city0); }
    GAME.world.peds.forEach(function (p) { if (p.state === 'attack') { p.state = 'walk'; p.foe = null; } });
    GAME.police.clearWanted();
    return r;
  });
  check('drivers: a round from your gun reaches whoever is driving', shot.realRound, JSON.stringify(shot));
  check('drivers: some floor it and get away from you', shot.kinds.flee && shot.kinds.flee.got === 'flee' && shot.kinds.flee.inCar && shot.kinds.flee.panic, JSON.stringify(shot.kinds.flee));
  check('drivers: some bail out and run', shot.kinds.bail && shot.kinds.bail.out && shot.kinds.bail.state === 'flee', JSON.stringify(shot.kinds.bail));
  check('drivers: some get out and come at you', shot.kinds.fight && shot.kinds.fight.out && shot.kinds.fight.state === 'attack' && !shot.kinds.fight.armed, JSON.stringify(shot.kinds.fight));
  check('drivers: some get out with a gun and use it', shot.kinds.shoot && shot.kinds.shoot.out && shot.kinds.shoot.armed && shot.kinds.shoot.shots > 0, JSON.stringify(shot.kinds.shoot));
  check('drivers: some shoot back from the window as they go', shot.kinds.fireback && shot.kinds.fireback.inCar && shot.kinds.fireback.shots > 0, JSON.stringify(shot.kinds.fireback));
  check('drivers: keep shooting at one driving it out and they give up on the car', shot.secondVolley === 'bail', JSON.stringify(shot));
  check('drivers: a police car is still the police', shot.copIgnored, JSON.stringify(shot));

  // on your feet before the lift, whatever the groups before left you as
  await comeRound();
  var tower = await page.evaluate(function () {
    var P = GAME.player, I = GAME.interiors, L = GAME.city.towerLift, r = {};
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    GAME.test.teleport(L.street.x, L.street.z + 4); GAME.test.fastForward(0.4);
    P.health = 100; P.armor = 100;
    // nobody standing in the four metres to the ring: shove an officer on
    // the way there and the ride starts in handcuffs (it did, one run in three)
    GAME.world.peds.slice().forEach(function (p) {
      if (Math.hypot(p.pos.x - L.street.x, p.pos.z - (L.street.z + 2)) < 9) GAME.peds.removePed(p);
    });
    GAME.police.clearWanted();
    r.start = { state: P.state, wanted: GAME.police.wanted };
    // onto the ring: the ride begins, letterboxed, through your own eyes
    for (var w = 0; w < 4 * 60 && !I.riding(); w++) {
      var dx = L.street.x - P.pos.x, dz = L.street.z - P.pos.z;
      P.heading = Math.atan2(dx, dz); GAME.cam.yaw = P.heading; GAME.test.pressKey('KeyW', true); GAME.test.fastForward(1 / 60);
    }
    GAME.test.pressKey('KeyW', false);
    r.riding = I.riding() && document.body.classList.contains('cine') && P.mesh.visible === false;
    GAME.test.fastForward(4);
    var cam = GAME.cameraObj.position, cab = L.cab.position;
    r.mid = { cabY: +cab.y.toFixed(1), camInCab: Math.hypot(cam.x - L.shaft.x, cam.z - L.shaft.z) < 1.3 && cam.y > cab.y + 1 && cam.y < cab.y + 2.6, y: +P.pos.y.toFixed(1) };
    // nobody can hurt you in there
    GAME.playerDamage(50, 'test');
    r.immune = P.health === 100;
    GAME.test.fastForward(7);
    r.top = { riding: I.riding(), y: +P.pos.y.toFixed(1), cine: document.body.classList.contains('cine'), visible: P.mesh.visible };
    // and the way down skips with a key
    var rf = L.roof;
    P.pos.set(rf.x, rf.y, rf.z - 2.5); GAME.test.fastForward(0.3);
    for (w = 0; w < 4 * 60 && !I.riding(); w++) {
      P.heading = Math.atan2(rf.x - P.pos.x, rf.z - P.pos.z); GAME.cam.yaw = P.heading; GAME.test.pressKey('KeyW', true); GAME.test.fastForward(1 / 60);
    }
    GAME.test.pressKey('KeyW', false);
    GAME.test.fastForward(0.8);
    GAME.test.pressKey('Space'); GAME.test.fastForward(1 / 60); GAME.test.pressKey('Space', false);
    GAME.test.fastForward(0.3);
    r.skipped = { riding: I.riding(), y: +P.pos.y.toFixed(1) };
    // the parapet holds a walker, at a run
    GAME.police.clearWanted();
    r.stateBefore = P.state;
    var pad = GAME.city.roofHelipad;
    P.pos.set(pad.x + 9, pad.y, pad.z); GAME.test.fastForward(0.3);
    P.heading = Math.PI / 2; GAME.cam.yaw = P.heading;
    GAME.test.pressKey('KeyW', true); GAME.test.pressKey('ShiftLeft', true);
    GAME.test.fastForward(3);
    r.held = { off: +(P.pos.x - pad.x).toFixed(2), y: +P.pos.y.toFixed(1) };
    // a jump clears it, and seventy metres is not a few points, vest or no vest
    P.health = 100; P.armor = 100;
    GAME.test.pressKey('Space', true); GAME.test.fastForward(0.1); GAME.test.pressKey('Space', false);
    GAME.test.fastForward(0.8);
    GAME.test.pressKey('KeyW', false); GAME.test.pressKey('ShiftLeft', false);
    GAME.test.fastForward(5);
    r.fell = { state: P.state, y: +P.pos.y.toFixed(1) };
    return r;
  });
  // Back on your feet: R, again, until it takes. A respawn ignores R for a
  // second and a half of real time after the last one, and the fade back in
  // runs on a real clock too, so this waits in real time between presses.
  async function comeRound() {
    for (var i = 0; i < 25; i++) {
      var up = await page.evaluate(function () {
        if (GAME.player.state === 'alive') return true;
        GAME.input.keys['KeyR'] = true; GAME.test.fastForward(0.7); GAME.input.keys['KeyR'] = false;
        return GAME.player.state === 'alive';
      });
      if (up) return true;
      await page.waitForTimeout(400);
    }
    return false;
  }
  var towerUp = await comeRound();
  var smallFall = await page.evaluate(function () {
    var P = GAME.player;
    GAME.test.teleport(356, 60); GAME.test.fastForward(0.5);
    P.health = 100; P.armor = 0;
    var surf = GAME.city.surfaceY(P.pos.x, P.pos.z, P.pos.y);
    P.pos.y = surf + 5; P.velY = 0; P.airborne = true;          // five metres
    GAME.test.fastForward(2);
    var five = { state: P.state, hp: Math.round(P.health) };
    P.health = 100;
    P.pos.y = surf + 30; P.velY = 0; P.airborne = true;         // thirty
    GAME.test.fastForward(4);
    return { five: five, thirty: P.state };
  });
  towerUp = (await comeRound()) && towerUp;
  await page.evaluate(function () { GAME.player.health = 100; GAME.police.clearWanted(); });
  check('lift: stepping on it starts the ride, letterboxed, through your own eyes', tower.riding, JSON.stringify(tower));
  check('lift: halfway up, the camera rides inside the glass car as it climbs the tower',
    tower.mid && tower.mid.camInCab && tower.mid.cabY > 10 && tower.mid.cabY < 65, JSON.stringify(tower.mid));
  check('lift: nobody can hurt you in the lift', tower.immune, JSON.stringify(tower));
  check('lift: it puts you out on the roof, back in your own shoes', tower.top && !tower.top.riding && tower.top.y > 70 && !tower.top.cine && tower.top.visible, JSON.stringify(tower.top));
  check('lift: a key skips the ride down', tower.skipped && !tower.skipped.riding && tower.skipped.y < 1, JSON.stringify(tower.skipped));
  check('roof: the helipad parapet holds you at a run', tower.held && tower.held.off < 13.5 && tower.held.y > 70, JSON.stringify(tower.held));
  check('roof: jump it and the fall kills — armor or not', tower.fell && tower.fell.state === 'wasted', JSON.stringify(tower.fell));
  check('falls: five metres hurts but does not kill, thirty does', smallFall.five.state === 'alive' && smallFall.five.hp < 100 && smallFall.thirty === 'wasted', JSON.stringify(smallFall));
  check('falls: and you come round afterwards (anchor sanity)', towerUp);

  var lola = await page.evaluate(function () {
    var P = GAME.player, Lo = GAME.lola, r = {};
    GAME.test.teleport(356, 40); GAME.test.fastForward(0.5);
    GAME.police.clearWanted();
    r.bindable = GAME.controls.ACTIONS.some(function (a) { return a[0] === 'KeyL'; });
    GAME.onKeyDown('KeyL');
    r.open = GAME.lolaOpen && document.getElementById('lola-screen').style.display === 'flex';
    r.asks = /What can I do for you/.test(Lo.says);
    r.menu = Lo.options();
    Lo.choose(/DO NEXT/);
    r.next = Lo.says;
    if (GAME.nav && GAME.nav.clear) GAME.nav.clear();
    r.marked = Lo.choose(/MARK IT/) && !GAME.lolaOpen;
    r.navSet = !!(GAME.nav && GAME.nav.hasDest ? GAME.nav.hasDest() : GAME.hud && true);
    GAME.onKeyDown('KeyL');
    Lo.choose(/TAKE ME/); Lo.choose(/GUNS/);
    r.guns = Lo.says;
    GAME.onKeyDown('Escape');
    r.backToTop = Lo.options().some(function (o) { return /DO NEXT/.test(o); }) && GAME.lolaOpen;
    GAME.onKeyDown('Escape');
    r.closed = !GAME.lolaOpen && !GAME.paused;
    // wanted: the law is the first thing she offers
    GAME.test.setWanted(3);
    GAME.onKeyDown('KeyL');
    r.lawFirst = /LAW/.test(Lo.options()[0]);
    Lo.choose(/LAW/); r.law = Lo.says;
    GAME.onKeyDown('Escape'); GAME.onKeyDown('Escape');
    GAME.police.clearWanted();
    // from the pause screen, the way a phone reaches her
    GAME.togglePause();
    document.getElementById('pause-lola').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    r.fromPause = GAME.lolaOpen && !GAME.paused;
    GAME.onKeyDown('Escape');
    return r;
  });
  // and the world holds still while you talk (real frames, not the test clock)
  var held = await page.evaluate(function () {
    GAME.lola.open();
    window.__t0 = GAME.time;
    return true;
  });
  await page.waitForTimeout(600);
  var stillT = await page.evaluate(function () { var d = GAME.time - window.__t0; GAME.lola.close(); return d; });
  check('lola: calling her is an action you can rebind', lola.bindable);
  check('lola: L calls her, and she asks what she can do', lola.open && lola.asks && lola.menu.length >= 6, JSON.stringify(lola.menu));
  check('lola: she says what to do next, and where', /m (north|south|east|west)/.test(lola.next || ''), lola.next);
  check('lola: and marks it on your map', lola.marked, JSON.stringify(lola));
  check('lola: she finds you a shop', /is \d+ m|is [\d.]+ km/.test(lola.guns || ''), lola.guns);
  check('lola: Esc steps back, then closes', lola.backToTop && lola.closed, JSON.stringify(lola));
  check('lola: with the law on you, that is the first thing she offers, and she says how to lose them',
    lola.lawFirst && /stars|star/.test(lola.law || ''), lola.law);
  check('lola: ASK LOLA on the pause screen reaches her too', lola.fromPause, JSON.stringify(lola));
  check('lola: the world holds still while you talk', Math.abs(stillT) < 0.02, 'game time moved ' + stillT.toFixed(3) + ' s');

  // ---------- 3c: each star costs more than the last ----------
  // The ladder used to be one body per star: kill_ped is 70 heat against a
  // first threshold of 50, and the gaps grew by twenty a level while every
  // offence was worth 22% MORE per star already held. Five pedestrians was a
  // five-star manhunt and one you never meant to hit was already a star.
  //
  // Counted, not sampled: reportCrime is driven directly with a witness stood
  // next to it, so this is the ladder itself rather than whatever the traffic
  // happened to be doing.
  var ladder = await page.evaluate(function () {
    var P = GAME.player, r = {};
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    P.health = 100;
    GAME.test.teleport(-60, 40);
    GAME.test.fastForward(0.5);
    GAME.godMode = true;                       // 20 crimes' worth of response
    var witness = GAME.test.spawnPed(3, 0);    // somebody has to see it
    r.witness = !!witness && !witness.dead;
    r.start = GAME.police.wanted;

    // one body, from clean
    GAME.police.reportCrime('kill_ped', P.pos);
    r.afterOne = GAME.police.wanted;
    r.heatAfterOne = Math.round(GAME.police.heat);

    // then count what each rung actually costs
    GAME.police.clearWanted();
    var costs = [], n = 0, at = 0;
    for (var i = 0; i < 200 && costs.length < 5; i++) {
      GAME.police.reportCrime('kill_ped', P.pos);
      n++;
      var s = GAME.police.wanted;
      if (s > at) { costs.push(n); n = 0; at = s; }
    }
    r.costs = costs;
    r.total = costs.reduce(function (a, b) { return a + b; }, 0);
    r.reached = at;

    // and the law: one officer down should be serious at once without being
    // most of the way to a manhunt
    GAME.police.clearWanted();
    GAME.police.reportCrime('kill_cop', P.pos);
    r.oneCop = GAME.police.wanted;

    GAME.police.clearWanted();
    GAME.godMode = false;
    P.health = 100;
    GAME.test.fastForward(0.5);
    r.clean = GAME.police.wanted;
    return r;
  });
  check('wanted: somebody is there to see it, from a standing start (anchor sanity)',
    ladder.witness === true && ladder.start === 0,
    'witness=' + ladder.witness + ' start=' + ladder.start);
  check('wanted: one body you did not mean to hit is heat, not a star',
    ladder.afterOne === 0 && ladder.heatAfterOne > 0,
    'stars=' + ladder.afterOne + ' heat=' + ladder.heatAfterOne);
  check('wanted: and every rung costs more than the one below it',
    ladder.costs.length === 5 &&
    ladder.costs.every(function (c, i) { return i === 0 || c > ladder.costs[i - 1]; }),
    'offences per star=' + JSON.stringify(ladder.costs));
  check('wanted: five stars is a manhunt you have to earn',
    ladder.reached === 5 && ladder.total >= 18,
    'reached=' + ladder.reached + ' after ' + ladder.total + ' offences');
  check('wanted: killing an officer is serious at once, but not a manhunt',
    ladder.oneCop === 2, 'stars=' + ladder.oneCop);
  check('wanted: and the group hands the world back clean (anchor sanity)',
    ladder.clean === 0, 'stars=' + ladder.clean);

  // ---------- 3d: a police round goes where it was drawn ----------
  // npcShoot drew a tracer along a scattered yaw and then decided the hit with
  // a Math.random() < accuracy roll taken beside it. So the round you watched
  // fly wide still hurt you, the one drawn straight through you might not, and
  // because the roll was a flat constant the hit rate was the same at five
  // metres as at forty, standing still or at a sprint. Nothing the player did
  // changed it.
  var aim = await page.evaluate(function () {
    var P = GAME.player, r = {};
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    P.health = 100;
    GAME.test.teleport(-60, 120);
    GAME.test.fastForward(0.5);
    GAME.godMode = true;          // two thousand rounds, and a live player
    // A car in the line of fire takes the round (that is a fix of its own),
    // so the range is cleared of traffic first: on CI one stood on it and
    // every round at twelve metres hit the car, standing or running alike.
    GAME.world.cars.slice().forEach(function (c) {
      if (c !== P.car && c.pos.x > P.pos.x - 6 && c.pos.x < P.pos.x + 42 && Math.abs(c.pos.z - P.pos.z) < 8) GAME.vehicles.removeCar(c);
    });

    // Record where each round was DRAWN and whether it hurt. Audio and the
    // tracer geometry are stubbed for the duration: this measures ballistics,
    // and two thousand real gunshots would be measuring the allocator.
    var ends = [], gun0 = GAME.audio.gunshot, tr0 = GAME.fx.tracer;
    GAME.audio.gunshot = function () { };
    GAME.fx.tracer = function (x1, y1, z1, x2, y2, z2) { ends.push([x2, z2]); };
    // A hit is a round that HURT, watched at the door where the hurting
    // happens — not npcShoot's return value. The version this replaces
    // returned true whatever it did, so measuring the return would have made
    // every check below pass on the very code they exist to catch. godMode
    // stops the damage landing; it does not stop the call.
    var hurt = false, dmg0 = GAME.playerDamage;
    GAME.playerDamage = function () { hurt = true; return dmg0.apply(null, arguments); };

    // one officer, with their personal steadiness pinned, so the comparisons
    // below are about range and speed rather than about who is holding the gun
    function volley(dist, speed, n) {
      var shooter = { aimSkill: 1 };
      var hits = 0, worstHit = 0, bestMiss = 1e9;
      P.moveSpeed = speed;
      GAME.combat.npcShoot(P.pos.x + dist, 1.35, P.pos.z, 0.42, 5, shooter);  // settle them
      ends.length = 0;
      for (var i = 0; i < n; i++) {
        hurt = false;
        GAME.combat.npcShoot(P.pos.x + dist, 1.35, P.pos.z, 0.42, 5, shooter);
        var hit = hurt;
        if (hit) hits++;
        var e = ends[ends.length - 1];
        // The tracer ends at the player's own range, so how far its end lands
        // from the player IS how far the round passed them by.
        //
        // Assert the ORDER rather than a threshold: the worst round that hurt
        // must have passed closer than the best round that did not. That is
        // the whole property — the outcome follows the geometry — and it needs
        // no tolerance, where comparing against a fixed half-width did. (It
        // also does not hard-code the target's width, so a retune of that is
        // not a broken check.)
        var by = Math.sqrt(U.dist2(e[0], e[1], P.pos.x, P.pos.z));
        if (hit) worstHit = Math.max(worstHit, by);
        else bestMiss = Math.min(bestMiss, by);
      }
      return { rate: hits / n, worstHit: worstHit, bestMiss: bestMiss, n: n };
    }
    // 4000 rounds a volley, not 600. Two of the checks below compare hit
    // RATES, and at 600 shots with rates near 0.3 the standard error on the
    // difference between two of them is about 0.026 — against a threshold of
    // 0.05. That is an under-powered check, and it duly failed on a run where
    // the numbers came out 0.32 against 0.27: a real effect that the sample
    // was too small to resolve. Firing four times as many rounds halves the
    // error again, and it is all arithmetic — no simulation, no frames.
    var N = 4000;
    r.near = volley(6, 0, N);
    r.far = volley(34, 0, N);
    r.still = volley(12, 0, N);
    r.running = volley(12, 8, N);
    var volleys = [r.near, r.far, r.still, r.running];
    r.ordered = volleys.every(function (v) { return v.worstHit <= v.bestMiss; });
    r.worst = volleys.map(function (v) {
      return v.worstHit.toFixed(2) + '/' + (v.bestMiss === 1e9 ? '-' : v.bestMiss.toFixed(2));
    });
    r.shots = N * 4;

    // and officers are individuals rather than four copies of one machine
    var skills = {};
    for (var k = 0; k < 60; k++) {
      var fresh = {};
      GAME.combat.npcShoot(P.pos.x + 10, 1.35, P.pos.z, 0.42, 5, fresh);
      skills[Math.round(fresh.aimSkill * 100)] = 1;
    }
    r.distinctSkills = Object.keys(skills).length;

    GAME.audio.gunshot = gun0; GAME.fx.tracer = tr0; GAME.playerDamage = dmg0;
    GAME.godMode = false;
    P.moveSpeed = 0; P.health = 100;
    GAME.police.clearWanted();
    GAME.test.fastForward(0.5);
    r.alive = P.state === 'alive';
    return r;
  });
  check('police: they can still hit you at close range (anchor sanity)',
    aim.near.rate > 0.5, 'close range hit rate=' + aim.near.rate.toFixed(2));
  check('police: both outcomes actually occur in every volley (anchor sanity)',
    aim.near.rate > 0 && aim.near.rate < 1 && aim.far.rate > 0 && aim.far.rate < 1,
    'rates=' + [aim.near, aim.far, aim.still, aim.running].map(function (v) {
      return v.rate.toFixed(2); }).join('/'));
  check('police: every round that hurt you passed closer than every one that did not',
    aim.ordered === true,
    'worst hit / best miss, per volley: ' + JSON.stringify(aim.worst) + ' over ' + aim.shots + ' rounds');
  check('police: range is worth something — a pistol at 34 m is not one at 6 m',
    aim.near.rate > aim.far.rate + 0.25,
    '6m=' + aim.near.rate.toFixed(2) + ' 34m=' + aim.far.rate.toFixed(2));
  check('police: and so is not standing still while they shoot at you',
    aim.still.rate > aim.running.rate + 0.05,
    'still=' + aim.still.rate.toFixed(2) + ' running=' + aim.running.rate.toFixed(2));
  check('police: officers are individuals, not four copies of one machine',
    aim.distinctSkills > 20, 'distinct steadiness over 60 officers=' + aim.distinctSkills);
  check('police: and the group leaves the player alive and clean (anchor sanity)',
    aim.alive === true);

  // ---------- 3e: the hill climb follows the hill road ----------
  // The climb's route was five hand-written points snapped with
  // nearestRoadPoint, and snapping cannot tell you it picked the wrong road.
  // The start landed on a PORT road at sea level three hundred metres from the
  // hill; the second checkpoint missed its mark by forty metres and landed on
  // the COAST RING. The route it described was port, up to a hill connector,
  // back down to the shore, then up — and the gates were far enough apart that
  // the hillside between them was a shorter drive than the switchback.
  //
  // Pure geometry: this reads the route, touches nothing, and leaves nothing
  // behind, so it can sit anywhere in the file.
  var climb = await page.evaluate(function () {
    var I = GAME.city.isla;
    var defs = GAME.missions.DEFS;
    function defOf(id) {
      for (var i = 0; i < defs.length; i++) if (defs[i].id === id) return defs[i];
      return null;
    }
    var d = defOf('race3');
    if (!I || !d || !d.cps || !d.start) return { ready: false, isla: !!I, def: !!d };
    var seq = [[d.start.x, d.start.z]].concat(d.cps);

    function offRoad(x, z) {
      var rp = GAME.city.nearestRoadPoint(x, z);
      return { d: Math.sqrt(U.dist2(x, z, rp.x, rp.z)), kind: rp.kind };
    }
    // how far the straight line between two gates strays from ANY road: the
    // shortcut the report was about, measured rather than eyeballed
    function stray(a, b) {
      var n = Math.max(8, Math.round(Math.sqrt(U.dist2(a[0], a[1], b[0], b[1])) / 6)), worst = 0;
      for (var k = 1; k < n; k++) {
        var t = k / n;
        worst = Math.max(worst, offRoad(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t).d);
      }
      return worst;
    }
    var kinds = {}, worstOff = 0, ys = [], strays = [];
    for (var j = 0; j < seq.length; j++) {
      var o = offRoad(seq[j][0], seq[j][1]);
      kinds[o.kind || '(mainland)'] = 1;
      worstOff = Math.max(worstOff, o.d);
      ys.push(GAME.city.groundY(seq[j][0], seq[j][1]));
      if (j) strays.push(stray(seq[j - 1], seq[j]));
    }
    // and the island's other race: a lap of the coastal ring, which had the
    // same shortcut for the same reason — gates laid out around the compass
    // rather than along the road
    var m = defOf('race4'), lap = null;
    if (m && m.cps && m.start) {
      var mseq = [[m.start.x, m.start.z]].concat(m.cps);
      var mkinds = {}, mstray = [], mworstOff = 0, len = 0;
      for (var q = 0; q < mseq.length; q++) {
        var mo = offRoad(mseq[q][0], mseq[q][1]);
        mkinds[mo.kind || '(mainland)'] = 1;
        mworstOff = Math.max(mworstOff, mo.d);
        if (q) {
          mstray.push(stray(mseq[q - 1], mseq[q]));
          len += Math.sqrt(U.dist2(mseq[q - 1][0], mseq[q - 1][1], mseq[q][0], mseq[q][1]));
        }
      }
      lap = { gates: m.cps.length, kinds: Object.keys(mkinds), worstOff: +mworstOff.toFixed(1),
              worstStray: +Math.max.apply(null, mstray).toFixed(1), len: Math.round(len),
              closes: Math.round(Math.sqrt(U.dist2(m.start.x, m.start.z,
                m.cps[m.cps.length - 1][0], m.cps[m.cps.length - 1][1]))) };
    }
    return { ready: true, gates: d.cps.length, kinds: Object.keys(kinds),
             worstOff: +worstOff.toFixed(1), worstStray: +Math.max.apply(null, strays).toFixed(1),
             rise: +(ys[ys.length - 1] - ys[0]).toFixed(1),
             drops: ys.filter(function (y, k) { return k > 0 && y < ys[k - 1] - 0.5; }).length,
             legs: (I.climb || []).length, lap: lap };
  });
  check('climb: the island registered and the race has a route (anchor sanity)',
    climb.ready === true && climb.gates >= 5 && climb.legs === 5,
    'gates=' + climb.gates + ' switchback legs=' + climb.legs);
  if (climb.ready) {
    check('climb: every gate is on the hill road, not the port or the coast ring',
      climb.kinds.length === 1 && climb.kinds[0] === 'hill',
      'roads used=' + JSON.stringify(climb.kinds));
    check('climb: and on it, rather than near it',
      climb.worstOff < 3, 'furthest gate from a road centreline=' + climb.worstOff + 'm');
    check('climb: it climbs, without doubling back down the hill on the way',
      climb.rise > 15 && climb.drops === 0,
      'rise=' + climb.rise + 'm  descents between gates=' + climb.drops);
    // The road is 11 m wide. Under about that, the straight line between two
    // gates IS the road and there is no shortcut to take; the route this
    // replaces strayed 65 m off it.
    check('climb: the line between gates stays on the tarmac, so there is nothing to cut',
      climb.worstStray < 12, 'furthest a straight line between gates strays=' + climb.worstStray + 'm');

    // The ring race, which had the same hole. Its road is 14 m wide against
    // the hill's 11, so it gets the wider allowance — the test is the same
    // one either way: does the straight line between two gates leave the road.
    var lap = climb.lap;
    check('mirador: the ring lap is a lap, on the ring road (anchor sanity)',
      !!lap && lap.kinds.length === 1 && lap.kinds[0] === 'ring' &&
      lap.len > 1800 && lap.closes < 5,
      lap ? lap.gates + ' gates over ' + lap.len + 'm, roads=' + JSON.stringify(lap.kinds) +
            ', finishes ' + lap.closes + 'm from the start' : 'no route');
    check('mirador: and its gates are close enough that cutting the corner saves nothing',
      !!lap && lap.worstStray < 14,
      lap ? 'furthest a straight line between gates strays=' + lap.worstStray + 'm' : 'no route');
  }

  // Geometry says the route is sane; only driving it says it is drivable. The
  // rivals path along the road between gates, so where they have got to after
  // a dozen seconds is the road's own report on itself.
  var drive = await page.evaluate(function () {
    var P = GAME.player, r = {};
    r.wasOpen = GAME.isla.isOpen();
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    P.health = 100;
    GAME.isla.setOpen(true);
    var d = null, defs = GAME.missions.DEFS;
    for (var i = 0; i < defs.length; i++) if (defs[i].id === 'race3') d = defs[i];
    if (!d || !d.start) return r;
    r.footY = GAME.city.groundY(d.start.x, d.start.z);
    GAME.test.teleport(d.start.x, d.start.z);
    GAME.test.fastForward(0.5);
    var mine = GAME.test.spawnCar('sports', 4, 0);
    GAME.test.fastForward(0.3);
    GAME.test.enterNearestCar(mine);
    GAME.test.fastForward(2);
    var a = GAME.missions.active;
    r.started = !!(a && a.def && a.def.id === 'race3');
    // Wait on PROGRESS rather than on a stopwatch. How far a field gets in a
    // fixed twelve seconds depends on the countdown, on how they get off the
    // line and on what traffic is in the way — measured against a clock this
    // passed most runs and failed some, which says nothing about the road.
    // Give them until they are three gates up, or thirty seconds to prove they
    // cannot be.
    function field() { return GAME.world.cars.filter(function (c) { return c.mission && !c.dead; }); }
    function best(list, f) { return list.reduce(function (m, c) { return Math.max(m, f(c)); }, 0); }
    var secs = 0;
    while (secs < 30 && best(field(), function (c) { return c.cpIndex || 0; }) < 3) {
      GAME.test.fastForward(1);
      secs++;
    }
    var rivals = field();
    r.rivals = rivals.length;
    r.secs = secs;
    r.bestCp = best(rivals, function (c) { return c.cpIndex || 0; });
    r.highest = best(rivals, function (c) { return c.pos.y; });

    // Teardown, and thoroughly: this group runs before the race checks below,
    // and calling the race off is not enough on its own — the trigger is
    // proximity, so sitting on the start line restarts it on the next tick.
    GAME.missions.failActive('test teardown');
    GAME.exitCar();
    if (mine) GAME.vehicles.removeCar(mine);
    GAME.test.teleport(-60, 40);
    GAME.isla.setOpen(r.wasOpen);
    GAME.police.clearWanted();
    P.health = 100;
    GAME.test.fastForward(1);
    r.clean = !GAME.missions.active && !GAME.player.inCar;
    return r;
  });
  check('climb: the race starts at the foot of the switchback (anchor sanity)',
    drive.started === true && drive.rivals === 3 && drive.footY < 8,
    'started=' + drive.started + ' rivals=' + drive.rivals + ' foot at ' + drive.footY + 'm');
  check('climb: and a field can actually drive it up the hill',
    drive.bestCp >= 3 && drive.highest > drive.footY + 3,
    'three gates up in ' + drive.secs + 's, highest rival=' +
    (drive.highest || 0).toFixed(1) + 'm against a foot at ' + (drive.footY || 0).toFixed(1) + 'm');
  check('climb: and the group hands the world back clean (anchor sanity)',
    drive.clean === true);

  // ---------- 3f: a parked airframe is something you stop against ----------
  // Aircraft were skipped outright in the car-to-car pass, so a helicopter
  // setting down would not bulldoze the street it landed on. The cost was that
  // ground traffic drove straight THROUGH one — and the Alta Verde summit road
  // ends at a helipad with a helicopter standing on it, so cars went in one
  // side and out the other all afternoon.
  var pad = await page.evaluate(function () {
    var P = GAME.player, K = GAME.input.keys, H = GAME.city.helipad, r = {};
    r.wasOpen = GAME.isla.isOpen();
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    P.health = 100;
    GAME.isla.setOpen(true);
    GAME.godMode = true;
    GAME.test.teleport(H.x - 45, H.z - 45);
    GAME.test.fastForward(5);                 // let the pad's parked spot fill
    var heli = GAME.world.cars.filter(function (c) {
      return c.spec.heli && c.ai && c.ai.mode === 'parked';
    })[0];
    r.parked = !!heli;
    if (!heli) return r;
    var heliHome = [heli.pos.x, heli.pos.z];

    var van = GAME.test.spawnCar('van', 4, 0);
    GAME.test.fastForward(0.3);
    GAME.test.enterNearestCar(van);
    GAME.test.fastForward(1.2);
    r.driving = !!P.inCar;
    if (!P.inCar) return r;
    var car = P.car;

    // line it up thirty metres out, pointing straight at the airframe
    function run(heliY) {
      heli.pos.y = heliY;
      car.pos.set(heli.pos.x - 30, GAME.city.groundY(heli.pos.x - 30, heli.pos.z), heli.pos.z);
      car.heading = Math.atan2(heli.pos.x - car.pos.x, heli.pos.z - car.pos.z);
      car.speed = 0; car.lat = 0; car.hp = car.spec.hp; car.stage = 0; car.stageWarn = 0;
      var closest = 1e9, inside = 0, passed = false;
      K['KeyW'] = true;
      for (var i = 0; i < 60 * 7; i++) {
        // pinned every frame: an unpowered airframe FALLS — the aircraft
        // branch drops any that nobody is flying — so a helicopter set ten
        // metres up was back on the pad long before the van reached it, and
        // the overhead case was really the on-the-ground case again
        heli.pos.y = heliY; heli.vy = 0;
        GAME.test.fastForward(1 / 60);
        var d = Math.sqrt(U.dist2(car.pos.x, car.pos.z, heli.pos.x, heli.pos.z));
        closest = Math.min(closest, d);
        if (d < heli.radius + car.radius - 0.3) inside++;
        if (car.pos.x > heli.pos.x + 2) passed = true;    // out the far side
      }
      K['KeyW'] = false;
      return { closest: +closest.toFixed(1), inside: inside, passed: passed };
    }

    var groundY = GAME.city.groundY(heliHome[0], heliHome[1]);
    r.radii = +(heli.radius + car.radius).toFixed(1);
    r.intoIt = run(groundY + 0.05);
    r.heliShifted = +Math.sqrt(U.dist2(heli.pos.x, heli.pos.z, heliHome[0], heliHome[1])).toFixed(1);
    // and one hovering overhead is not a roadblock — the height rule that let
    // the blanket skip be removed at all
    r.underIt = run(groundY + 10);
    heli.pos.y = groundY + 0.05;

    GAME.exitCar();
    if (van) GAME.vehicles.removeCar(van);
    GAME.godMode = false;
    GAME.isla.setOpen(r.wasOpen);
    GAME.test.teleport(-60, 40);
    GAME.police.clearWanted();
    P.health = 100;
    GAME.test.fastForward(1);
    r.clean = !GAME.player.inCar;
    return r;
  });
  check('helipad: a helicopter is parked on the pad and a van is driving at it (anchor sanity)',
    pad.parked === true && pad.driving === true && pad.radii > 3,
    'parked=' + pad.parked + ' driving=' + pad.driving + ' radii sum=' + pad.radii + 'm');
  if (pad.parked && pad.driving) {
    check('helipad: driving into it stops you, rather than taking you through it',
      pad.intoIt.inside === 0 && pad.intoIt.passed === false &&
      pad.intoIt.closest >= pad.radii - 0.4,
      'closest=' + pad.intoIt.closest + 'm against ' + pad.radii +
      'm of radii, frames inside=' + pad.intoIt.inside + ', came out the far side=' + pad.intoIt.passed);
    check('helipad: and the airframe is not shoved by it — it never was, and still is not',
      pad.heliShifted < 0.5, 'the helicopter moved ' + pad.heliShifted + 'm');
    check('helipad: while one hovering overhead is not a roadblock',
      pad.underIt.passed === true,
      'drove under it=' + pad.underIt.passed + ' closest=' + pad.underIt.closest + 'm');
    check('helipad: and the group hands the world back clean (anchor sanity)', pad.clean === true);
  }

  // ---------- 3g: traffic keeps its lane from the first metre ----------
  // The lane offset was only worked out on ARRIVAL at a node, when the next
  // one is chosen, and every driver starts with laneX/laneZ at zero — so the
  // whole first segment was driven down the centreline. Not a rare state: it
  // is every car the spawner puts down, every cruiser standing down after a
  // chase, every owner taking their car back, every mission car handed over.
  var lanes = await page.evaluate(function () {
    var P = GAME.player, r = {};
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    P.health = 100;
    GAME.godMode = true;
    GAME.test.teleport(-60, 40);
    GAME.test.fastForward(4);

    // A driver handed to traffic with no lane yet, pointed along the road it
    // is standing on — the state all four of those hand-overs create.
    var rp = GAME.city.nearestRoadPoint(P.pos.x + 14, P.pos.z);
    var head = rp.axis === 'x' ? 0 : Math.PI / 2;
    var fresh = GAME.vehicles.spawnCar('sedan', rp.x, rp.z, head,
      { occupied: 'ai', ai: { mode: 'traffic', desired: 10, laneX: 0, laneZ: 0 } });
    r.spawned = !!fresh;
    if (fresh) {
      GAME.test.fastForward(1 / 60);          // one tick is all it should need
      var lx = fresh.ai.laneX, lz = fresh.ai.laneZ;
      r.freshLane = +Math.sqrt(lx * lx + lz * lz).toFixed(2);
      // perpendicular to the way it is pointing, and on the right of it
      var fx = Math.sin(fresh.heading), fz = Math.cos(fresh.heading);
      r.alongTravel = +Math.abs(lx * fx + lz * fz).toFixed(2);   // want ~0
      r.toTheRight = (lx * fz - lz * fx) > 0;
      GAME.vehicles.removeCar(fresh);
    }

    // and the fleet at large, mid-segment where lane discipline is unambiguous
    // (at a junction a car legitimately crosses the centre, and the road-point
    // lookup measures against whichever line is nearest, which for a car
    // properly in lane can be the CROSSING one)
    var zero = 0, total = 0, offs = [];
    for (var i = 0; i < 60 * 25; i++) {
      GAME.test.fastForward(1 / 60);
      if (i % 20) continue;
      GAME.world.cars.forEach(function (c) {
        if (c === P.car || c.dead || !c.ai || c.ai.mode !== 'traffic') return;
        if (Math.abs(c.speed) < 2 || !c.ai.node) return;
        if (U.dist2(c.pos.x, c.pos.z, c.ai.node.x, c.ai.node.z) < 11 * 11) return;
        if (c.ai.prev && U.dist2(c.pos.x, c.pos.z, c.ai.prev.x, c.ai.prev.z) < 11 * 11) return;
        total++;
        if (!c.ai.laneX && !c.ai.laneZ) zero++;
        var q = GAME.city.nearestRoadPoint(c.pos.x, c.pos.z);
        offs.push(Math.sqrt(U.dist2(c.pos.x, c.pos.z, q.x, q.z)));
      });
    }
    offs.sort(function (a, b) { return a - b; });
    r.cars = total;
    r.pctZeroLane = total ? Math.round(zero / total * 100) : -1;
    r.median = offs.length ? +offs[Math.floor(offs.length / 2)].toFixed(2) : -1;

    GAME.godMode = false;
    P.health = 100;
    GAME.test.fastForward(0.5);
    return r;
  });
  check('lanes: a fresh traffic driver was put on the road (anchor sanity)',
    lanes.spawned === true && lanes.cars > 100,
    'spawned=' + lanes.spawned + ', ' + lanes.cars +
    ' mid-segment samples, median offset ' + lanes.median + 'm');
  check('lanes: it takes a lane on its first tick, not on reaching a node',
    lanes.freshLane > 2.5 && lanes.alongTravel < 0.2 && lanes.toTheRight === true,
    'offset=' + lanes.freshLane + 'm, component along travel=' + lanes.alongTravel +
    ', on the right=' + lanes.toTheRight);
  check('lanes: and no moving driver is left aiming down the middle of the road',
    lanes.pctZeroLane === 0, lanes.pctZeroLane + '% of moving traffic has no lane');
  // The fleet's median offset is REPORTED above and not asserted on. It ran
  // 2.5-3.1 m across runs against 2.06 on the code this fixes, so the gap is
  // smaller than the spread and a threshold anywhere in between fails on its
  // own noise — which is what it did, once, an hour after being written. A
  // number that cannot separate the two states is not a weak check, it is a
  // coin toss with an opinion, and tuning it down would only have moved the
  // toss. What actually pins this fix is deterministic and sits either side of
  // this line: a driver takes a 3.1 m lane on its first tick, and no moving
  // driver anywhere has none (0% here against 23%).

  // ---------- 3h: kerbside parking is beside the road, not across one ----------
  // The grid crosses itself every hundred metres and the spot generator only
  // knew about the road it was parking ON. A spot dropped at a junction hugs
  // nothing: parked along z, the car presents its whole LENGTH across the
  // east-west carriageway, which is a roadblock rather than a parked car.
  var kerb = await page.evaluate(function () {
    var R = GAME.city.R, H = GAME.city.ROAD_HALF;
    var spots = GAME.city.parkedSpots.filter(function (s) {
      return !s.vtype && !s.police && !s.isla && !s.special;
    });
    var worst = 0, inside = 0, where = null;
    spots.forEach(function (s) {
      // parked along z (heading 0) sits on a road at some x, so its position
      // ALONG that road is z — and the roads it can block run at those same
      // coordinates on the other axis
      var along = Math.abs(s.heading) < 0.1 ? s.z : s.x;
      var near = 1e9;
      for (var c = 0; c < R.length; c++) near = Math.min(near, Math.abs(along - R[c]));
      var into = H - near;
      if (into > 0) {
        inside++;
        if (into > worst) { worst = into; where = [Math.round(s.x), Math.round(s.z)]; }
      }
    });
    return { spots: spots.length, inside: inside, worst: +worst.toFixed(1), where: where,
             offset: 5.3, roadHalf: H };
  });
  check('kerb: the streets are parked up (anchor sanity)',
    kerb.spots > 80, kerb.spots + ' street spots');
  check('kerb: and not one of them is standing in a crossing road',
    kerb.inside === 0,
    kerb.inside + ' spots inside a crossing carriageway' +
    (kerb.where ? ', worst ' + kerb.worst + 'm in at ' + JSON.stringify(kerb.where) : ''));

  // ---------- 3k (b): what a fight has to LOOK like ----------
  // Three things a play session found that the first round of measurement did
  // not, because it counted fights rather than watching one.
  var brawl2 = await page.evaluate(function () {
    var C = GAME.chaos;
    C.set(1);            // CALM: a ceiling of one, so a single filler fills it
    GAME.test.teleport(-150, 120);
    GAME.police.clearWanted();
    GAME.test.fastForward(0.6);
    var f = GAME.focus();
    var a = GAME.test.spawnPed(4, 0), b = GAME.test.spawnPed(4, 22);
    if (!a || !b) { C.set(0); return { noPeds: true }; }
    a.temper = 1; b.temper = 1;
    // Saturate the fight ceiling first. That is the condition the bug lived
    // in: the cap counts BODIES, so a two-sided brawl needs two slots, and
    // swinging back was competing with fresh fights for one. With the board
    // clear the victim turns and fights on any version of the code, which is
    // exactly why the first version of this check passed on the broken one.
    GAME.world.peds.forEach(function (p) {
      if (p !== a && p !== b && p.state === 'attack') { p.state = 'walk'; p.foe = null; }
    });
    // and clear the traffic around them. These two stand and trade punches in
    // a live street for twenty seconds; a car finding the victim first kills
    // him, the loop breaks, and it reads as "he never fought back".
    var ff = GAME.focus();
    GAME.world.cars.slice().forEach(function (c) {
      if (c !== GAME.player.car && U.dist2(c.pos.x, c.pos.z, ff.x, ff.z) < 60 * 60) GAME.vehicles.removeCar(c);
    });
    var x = GAME.test.spawnPed(-16, 4), y = GAME.test.spawnPed(-16, 7);
    if (x && y) { x.temper = 1; y.temper = 1; GAME.peds.startFight(x, { kind: 'ped', ped: y }, 30); }
    var cap = C.maxFights, fillers = GAME.peds.fightCount();
    // and put `a` in the fight WITHOUT going through the ceiling, so this is
    // a test of the victim's answer rather than of the aggressor's slot
    a.state = 'attack'; a.foe = { kind: 'ped', ped: b }; a.attackT = 25;
    var armsUpWhileRunning = 0, runFrames = 0, mutual = false, punches = 0;
    var hp0 = b.hp;
    var aj0 = a.mesh.userData.joints;
    var pl = aj0.armL.rotation.x, pr = aj0.armR.rotation.x, maxJump = 0;
    for (var t = 0; t < 60 * 20; t++) {
      // hold him to it: attackT runs down and the state gives up on its own,
      // and this check is about how he looks getting there
      if (a.state !== 'attack') { a.state = 'attack'; a.foe = { kind: 'ped', ped: b }; }
      a.attackT = 25;
      if (t % 30 === 0) GAME.world.cars.slice().forEach(function (c) {
        if (c !== GAME.player.car && U.dist2(c.pos.x, c.pos.z, ff.x, ff.z) < 60 * 60) GAME.vehicles.removeCar(c);
      });
      GAME.test.fastForward(1 / 60);
      if (a.dead || b.dead || a.gone || b.gone) break;
      // How far an arm is allowed to travel in ONE step while he is posed.
      // The guard eases in over about a third of a second; a punch starting
      // before that finished used to abandon the ease and set the arm
      // outright, off whatever the walk cycle had left behind.
      var jn = a.mesh.userData.joints;
      if (a.aimPose) {
        maxJump = Math.max(maxJump,
          Math.abs(jn.armL.rotation.x - pl), Math.abs(jn.armR.rotation.x - pr));
      }
      pl = jn.armL.rotation.x; pr = jn.armR.rotation.x;
      // the charge: arms must swing, not sit frozen overhead
      if (a.state === 'attack' && a.speed > 4) {
        runFrames++;
        // EITHER arm. The jab pose raises whichever one punchArm selects and
        // drops the other to -1.2, and punchArm starts falsy — so watching
        // armR alone watched the arm that was never up, and this check passed
        // on the broken code.
        var jt = a.mesh.userData.joints;
        if (jt.armR.rotation.x < -2 || jt.armL.rotation.x < -2) armsUpWhileRunning++;
      }
      if (b.state === 'attack' && b.foe && b.foe.ped === a) mutual = true;
      if (b.hp < hp0) punches++;
    }
    var out = { armsUp: armsUpWhileRunning, runFrames: runFrames, mutual: mutual,
                landed: b.hp < hp0 || b.dead, cap: cap, fillers: fillers,
                maxJump: +maxJump.toFixed(3) };
    [a, b, x, y].forEach(function (p) { if (p && !p.gone) GAME.peds.removePed(p); });
    C.set(0);
    return out;
  });
  if (!brawl2.noPeds) {
    check('brawl: he does actually run at the other man (anchor sanity)',
      brawl2.runFrames > 30, brawl2.runFrames + ' frames of charging');
    // The jab pose was applied on every frame of the attack state, charge
    // included, and punchT does not tick while closing — so both arms locked
    // at head height for the whole run. It read as a zombie, and it did.
    check('brawl: and his arms swing while he does, rather than locked overhead',
      brawl2.armsUp < brawl2.runFrames * 0.1,
      brawl2.armsUp + ' of ' + brawl2.runFrames + ' charging frames with the arms up');
    check('brawl: the punches land (anchor sanity)', brawl2.landed, 'the other man was hit');
    // A jab travels 1.05 rad in 0.14 s — 7.5 rad/s, or 0.125 in a step. A
    // step of 1.4 is not a fast punch, it is a teleport, and that is what a
    // strike off a half-eased guard was doing.
    check('brawl: and no arm teleports mid-swing',
      brawl2.maxJump > 0 && brawl2.maxJump < 0.45,
      'biggest single-step arm move while posed: ' + brawl2.maxJump + ' rad');
    // The fight ceiling counts BODIES, so a two-sided brawl cost two of them
    // and swinging back was competing with fresh fights for a slot. Most
    // fights came out one-sided: one man chasing, the other never turning.
    check('brawl: the board is full while he is being hit (anchor sanity)',
      brawl2.fillers >= brawl2.cap, brawl2.fillers + ' fights already running against a ceiling of ' + brawl2.cap);
    check('brawl: and the man being hit swings back even so',
      brawl2.mutual, brawl2.mutual ? 'he turned and fought' : 'he never fought back');
  }

  // a shunt between two strangers puts somebody on the pavement about it
  var shunt = await page.evaluate(function () {
    var C = GAME.chaos;
    C.set(4);
    GAME.test.teleport(-250, 0);
    GAME.police.clearWanted();
    if (GAME.player.inCar) GAME.exitCar();
    GAME.test.fastForward(0.8);
    var f = GAME.focus();
    var got = 0, tries = 0;
    for (var k = 0; k < 12 && !got; k++) {
      tries++;
      var one = GAME.test.spawnCar('sedan', 8, 6), two = GAME.test.spawnCar('sedan', 8, -6);
      if (!one || !two) break;
      one.occupied = 'ai'; two.occupied = 'ai';
      one.ai = { mode: 'traffic', desired: 10, laneX: 0, laneZ: 0 };
      two.ai = { mode: 'traffic', desired: 10, laneX: 0, laneZ: 0 };
      // point them at each other and let them meet
      // Nose to nose and closing. Eighteen metres apart gave the drivers most
      // of a second to steer around each other and the crash often never
      // happened at all; four metres does not.
      one.pos.set(f.x + 8, GAME.city.groundY(f.x + 8, f.z + 2), f.z + 2);
      two.pos.set(f.x + 8, GAME.city.groundY(f.x + 8, f.z - 2), f.z - 2);
      one.heading = Math.PI; two.heading = 0;
      one.speed = 14; two.speed = 14;
      one.lat = 0; two.lat = 0;
      for (var t = 0; t < 60 * 2; t++) {
        GAME.test.fastForward(1 / 60);
        var ps = GAME.world.peds;
        for (var i = 0; i < ps.length; i++) if (ps[i].leftCar && !ps[i].dead) { got++; break; }
        if (got) break;
      }
      [one, two].forEach(function (c) { if (c && !c.dead) GAME.vehicles.removeCar(c); });
      GAME.world.peds.slice().forEach(function (p) { if (p.leftCar) GAME.peds.removePed(p); });
    }
    C.set(0);
    return { got: got, tries: tries };
  });
  check('shunt: a hard crash between two strangers puts a driver on the road',
    shunt.got > 0, shunt.got ? 'a driver got out within ' + shunt.tries + ' staged crashes'
                             : 'nobody got out of a car in ' + shunt.tries + ' staged crashes');

  // ---------- 3n: a car kills with its bodywork, not with an aura ----------
  // The run-over test was `dist2 < 5.2` — a 2.28 m circle measured from the
  // CAR'S CENTRE — while a sedan is 0.95 m from its centreline to its flank.
  // So more than a metre of clear air beside a moving car was fatal: people
  // died brushing past cars that never touched them, and the driver you pulled
  // out of a moving one appeared inside that circle and was killed by his own
  // car. Measured on the old code, lethal all the way out to 2.2 m.
  var runover = await page.evaluate(function () {
    GAME.test.teleport(-150, 0);
    GAME.police.clearWanted();
    GAME.test.fastForward(0.8);
    var rows = [], spec = null;
    // 1.7, not 1.4. The margin is w/2 + 0.45 = exactly 1.4 for a sedan, so
    // standing there put the pedestrian ON the threshold and floating point
    // decided each run — the check failed half the time against code that was
    // behaving perfectly. Never sample a boundary you are trying to assert
    // across.
    [0.6, 1.7, 2.2].forEach(function (off) {
      GAME.world.peds.slice().forEach(function (p) { if (!p.isCop) GAME.peds.removePed(p); });
      var f = GAME.focus();
      // Empty the corridor first. The pedestrian stands still for four seconds
      // in the middle of a live street, and ANY car that finds him kills him —
      // three runs in four failed on a passing stranger rather than on the car
      // this is about.
      GAME.world.cars.slice().forEach(function (c) {
        if (c !== GAME.player.car && Math.abs(c.pos.z - f.z) < 30 &&
            c.pos.x > f.x - 20 && c.pos.x < f.x + 60) GAME.vehicles.removeCar(c);
      });
      var car = GAME.test.spawnCar('sedan', 30, 0);
      if (!car) return;
      spec = { l: car.spec.l, w: car.spec.w };
      car.pos.set(f.x + 30, GAME.city.groundY(f.x + 30, f.z), f.z);
      // no traffic AI: it steers onto its own lane route and drives politely
      // around the pedestrian this is supposed to be aimed at
      car.occupied = null; car.ai = null;
      car.controls = { throttle: 0, steer: 0, handbrake: false };
      var ped = GAME.test.spawnPed(10, off);
      if (!ped) { GAME.vehicles.removeCar(car); return; }
      ped.state = 'walk';
      var died = false;
      for (var t = 0; t < 60 * 4; t++) {
        ped.pos.x = f.x + 10; ped.pos.z = f.z + off; ped.speed = 0;
        if (t % 15 === 0) GAME.world.cars.slice().forEach(function (c) {
          if (c !== car && c !== GAME.player.car && Math.abs(c.pos.z - f.z) < 30 &&
              c.pos.x > f.x - 20 && c.pos.x < f.x + 60) GAME.vehicles.removeCar(c);
        });
        // forward is (sin h, cos h), so -x travel is h = -PI/2
        car.heading = -Math.PI / 2; car.speed = 14; car.lat = 0;
        GAME.test.fastForward(1 / 60);
        if (ped.dead) { died = true; break; }
      }
      rows.push({ off: off, died: died });
      if (!ped.gone) GAME.peds.removePed(ped);
      if (car && !car.dead) GAME.vehicles.removeCar(car);
    });
    return { rows: rows, spec: spec };
  });
  if (runover.spec) {
    var flank = runover.spec.w / 2;
    var hit = runover.rows[0], edge = runover.rows[1], clear = runover.rows[2];
    check('runover: standing in front of it still gets you run over (anchor sanity)',
      hit.died, 'at ' + hit.off + ' m from the centreline, inside a ' + flank.toFixed(2) + ' m half-width');
    check('runover: three quarters of a metre clear of the bodywork is clear',
      !edge.died, 'at ' + edge.off + ' m from the centreline: ' + (edge.died ? 'killed' : 'unharmed'));
    check('runover: and so is a metre and a quarter clear of it',
      !clear.died, 'at ' + clear.off + ' m from the centreline: ' + (clear.died ? 'killed' : 'unharmed'));
  }

  // and the man you pull out of a moving car survives his own car
  var jacked = await page.evaluate(function () {
    var survived = 0, tries = 0;
    for (var k = 0; k < 5; k++) {
      GAME.test.teleport(-150 + k * 14, 0);
      GAME.test.fastForward(0.6);
      if (GAME.player.inCar) GAME.exitCar();
      GAME.world.peds.slice().forEach(function (p) { if (!p.isCop) GAME.peds.removePed(p); });
      var tc = GAME.test.spawnCar('van', 3, 0);
      if (!tc) continue;
      tc.occupied = 'ai';
      tc.ai = { mode: 'traffic', desired: 12, laneX: 0, laneZ: 0 };
      tc.speed = 11;
      GAME.test.fastForward(0.2);
      GAME.enterCar(tc);
      tries++;
      GAME.test.fastForward(1.2);
      var alive = GAME.world.peds.some(function (p) { return !p.dead && !p.isCop; });
      if (alive) survived++;
      if (GAME.player.inCar) GAME.exitCar();
      GAME.test.fastForward(0.3);
      if (tc && !tc.dead) GAME.vehicles.removeCar(tc);
      GAME.world.peds.slice().forEach(function (p) { if (!p.isCop) GAME.peds.removePed(p); });
    }
    return { survived: survived, tries: tries };
  });
  check('runover: jacking a moving van does not kill the driver you pulled out',
    jacked.tries > 0 && jacked.survived === jacked.tries,
    jacked.survived + '/' + jacked.tries + ' walked away from their own car');

  // ---------- 3r: the sand parts for the deck, not wider than it ----------
  // The sand carpet has to part around the bridge approaches, because over the
  // beach they run at y=0 while the sand tiers sit at 0.06 and would bury the
  // road. But the cuts were 18 m against 14 m decks, so two metres of bare
  // nothing ran down each side of each bridge — and the beach out there is
  // already below sea level, so what showed through the hole was open water.
  //
  // This holds the cut to the DECK rather than to a number: every metre the
  // sand gives up has to have bridge over it, at every x across the beach.
  var beach = await page.evaluate(function () {
    var C = GAME.city;
    if (!C.bridgeCuts) return { missing: true };
    var XS = [376, 384, 392, 400, 410, 420, 426];    // in across the sand
    var out = [];
    C.bridgeCuts.forEach(function (cut) {
      var bare = 0, covered = 0, worstX = null;
      for (var z = cut[0]; z <= cut[1]; z += 0.1) {
        for (var i = 0; i < XS.length; i++) {
          // ask from above, so the deck answers rather than the ground
          if (C.crossingY(XS[i], z, 99) === null) { bare++; if (worstX === null) worstX = XS[i]; }
          else covered++;
        }
      }
      out.push({ cut: [+cut[0].toFixed(2), +cut[1].toFixed(2)],
                 width: +(cut[1] - cut[0]).toFixed(2), bare: bare, covered: covered, worstX: worstX });
    });
    // and the cut must still be wide enough to be doing its job — a cut of
    // nothing would pass the test above and bury the road
    return { cuts: out };
  });
  check('beach: the sand knows where the bridges are', !beach.missing,
    beach.missing ? 'city.bridgeCuts is not exported' : beach.cuts.length + ' cuts');
  if (!beach.missing) {
    beach.cuts.forEach(function (c, i) {
      var which = i === 0 ? 'north' : 'south';
      check('beach: the ' + which + ' cut is wide enough to clear the approach (anchor sanity)',
        c.width > 10 && c.covered > 100,
        'cut is ' + c.width + ' m across, ' + c.covered + ' sampled points have deck over them');
      // 2 m of bare sand each side was the bug; anything above zero is a hole
      check('beach: and every metre of it has bridge over it, at every x',
        c.bare === 0,
        c.bare ? c.bare + ' samples of open nothing, first at x=' + c.worstX
               : 'no bare ground anywhere in the cut');
    });
  }

  // ---------- 3t: a building keeps its colour ----------
  // Facade colour is drawn from the seeded rng while the city is generated,
  // so the same seed has to paint the same building the same shade on every
  // load. A city that changes clothes between visits is worse than a grey one.
  // Checked on a SECOND page rather than by reloading this one, which would
  // pull the world out from under every group after it.
  var paintOne = await page.evaluate(function () {
    return GAME.city.testFacadeColors ? GAME.city.testFacadeColors() : null;
  });
  var contrast = await page.evaluate(function () {
    return GAME.city.testFacadeContrast ? GAME.city.testFacadeContrast() : [];
  });
  var nbrs = await page.evaluate(function () {
    return GAME.city.testFacadeNeighbours ? GAME.city.testFacadeNeighbours() : [];
  });
  // Where each textured block's windows start: the fractional u of its first
  // wall vertex. addBox writes 36 vertices a box, vertex 0 on face +x. A box
  // with no window texture spans exactly 1 in u, which is how it is left out.
  var phases = await page.evaluate(function () {
    var textured = 0, seen = {};
    (GAME.city.blockMeshes || []).forEach(function (m) {
      var uv = m.geometry.attributes.uv;
      for (var b = 0; b < uv.count / 36; b++) {
        var u0 = uv.getX(b * 36), u1 = uv.getX(b * 36 + 1);
        if (Math.abs(u1 - u0 - 1) < 1e-6) continue;
        textured++;
        seen[Math.round((u0 - Math.floor(u0)) * 10000)] = 1;
      }
    });
    return { textured: textured, distinct: Object.keys(seen).length };
  });
  var paintTwo = null;
  if (paintOne) {
    var p2 = await browser.newPage({ viewport: { width: 400, height: 300 } });
    // a second city building beside a running one (see the touchscreen
    // laptop check): more than the default 30 s on a loaded machine
    await p2.goto(origin + '/index.html', { timeout: 90000 });
    await p2.waitForFunction(function () {
      return window.GAME && GAME.city && GAME.city.testFacadeColors &&
        GAME.city.nodes && GAME.city.nodes.length > 0;
    }, null, { timeout: 90000 });
    paintTwo = await p2.evaluate(function () { return GAME.city.testFacadeColors(); });
    await p2.close();
  }
  if (paintOne && paintTwo) {
    check('paint: the ordinary blocks carry a colour at all (anchor sanity)',
      paintOne.verts > 2000, paintOne.verts + ' facade vertices with a colour on them');
    // Without this the check above it is decoration: a hash agrees with
    // itself just as happily on a city painted one flat shade, which is the
    // city this started as — five careful shades per district, every one of
    // them multiplied into the same near-black by the wall behind it.
    check('paint: in more than one shade, or there is nothing to keep',
      paintOne.distinct >= 6, paintOne.distinct + ' distinct facade colours across the blocks');
    check('paint: and a fresh load paints the same city the same way',
      paintOne.hash === paintTwo.hash,
      'first load ' + paintOne.hash + ', second load ' + paintTwo.hash);
    // A palette is not a varied street. Drawn independently from one, blocks
    // land next to near-identical neighbours often enough that a row of six
    // reads as one building repeated — measured with the rule off, 70 of the
    // mainland's 137 neighbouring pairs were the same shade twice, and in the
    // residential blocks it was 32 of 47. On the island the rule was on and
    // still lost 12 of 174 among the port shops, the densest ground on the
    // map, until they were given enough colours to find a way round.
    var nbPairs = nbrs.reduce(function (n, d) { return n + d.pairs; }, 0);
    var nbSame = nbrs.reduce(function (n, d) { return n + d.same; }, 0);
    var islaNb = nbrs.filter(function (d) { return d.district.indexOf('isla-') === 0; });
    var islaPairs = islaNb.reduce(function (n, d) { return n + d.pairs; }, 0);
    check('paint: blocks do stand close enough to be compared (anchor sanity)',
      nbPairs > 50, nbPairs + ' pairs of blocks within a street of each other');
    // The island paints through the same rule on a seed of its own. Without
    // this, an island that stopped reporting would pass every check below by
    // having no blocks to fail with.
    check('paint: and the island is painted by it too (anchor sanity)',
      islaNb.length === 4 && islaPairs > 100,
      islaNb.length + ' island districts, ' + islaPairs + ' pairs among them');
    check('paint: and no two of them are the same shade twice',
      nbSame === 0, nbSame + ' neighbouring pairs share a shade  —  ' +
        nbrs.map(function (d) { return d.district + ' ' + d.same + '/' + d.pairs; }).join(', '));
    // The windows. Every block used to start its window pattern at a whole-
    // number offset, on a texture that repeats — so u and u + 3 sampled the
    // same place, and all 249 textured blocks on both islands showed one
    // arrangement of lit windows between them. At night that arrangement is
    // most of what a tower is, and the skyline was one tower copied.
    check('paint: the blocks carry window textures (anchor sanity)',
      phases.textured > 200, phases.textured + ' textured blocks');
    check('paint: and each starts its windows somewhere of its own',
      phases.distinct >= phases.textured * 0.9,
      phases.distinct + ' distinct window phases across ' + phases.textured + ' blocks');
    // The one that would have caught the bug. Distinct colours in the data
    // mean nothing if the wall behind them is dark enough to crush the lot:
    // the palettes were always there, and the separation between the palest
    // building on a street and the darkest came to two hundredths. Eight
    // districts, four a side; a villa has no window texture, so its wall is 1.
    check('paint: and the colours survive the wall they are multiplied by',
      contrast.length === 8 && contrast.every(function (c) { return c.seen >= 0.1; }),
      contrast.map(function (c) { return c.district + ' ' + c.buildings + ' blocks, wall ' + c.wall + ' x spread ' + c.spread + ' = ' + c.seen; }).join('; '));
  }
  // Painting the blocks gave every window texture a glow image of its own,
  // black on the wall, and that was only ever right for the pale walls. The
  // hospitals, the stations, the shops and the tower had always glowed from
  // their own map, a faint light off wall, bands and unlit glass at every
  // hour, and the black glow took it away without anyone asking: a hospital
  // a third darker at night and a sixth at noon, measured against the build
  // before. Every paint check passed, because none of them looks at anything
  // but the blocks. So: whatever is not a block glows from its own map.
  //
  // Only meshes with something in them count. The anchor used to be six, and
  // two of the six were the Strip's and the harbour's dark-walled meshes,
  // which nothing had been built into since the blocks moved to the pale set:
  // empty, drawn every frame for nothing, and removed. The four that are left
  // are the whole list — downtown's and the generic stock's designed
  // buildings, the tower, and the showroom.
  var dressed = await page.evaluate(function () {
    var blocks = GAME.city.blockMeshes || [], out = { own: 0, apart: 0 };
    GAME.scene.traverse(function (o) {
      var m = o.material;
      if (!o.isMesh || !m || Array.isArray(m) || !m.map || !m.emissiveMap) return;
      if (blocks.indexOf(o) >= 0) return;
      if (!o.geometry.attributes.position || !o.geometry.attributes.position.count) return;
      if (m.emissiveMap === m.map) out.own++; else out.apart++;
    });
    return out;
  });
  check('paint: the buildings with windows of their own design are found (anchor sanity)',
    dressed.own + dressed.apart >= 4, (dressed.own + dressed.apart) + ' textured materials besides the blocks');
  check('paint: and they still glow from their own walls, as before the blocks were painted',
    dressed.apart === 0, dressed.apart + ' of ' + (dressed.own + dressed.apart) + ' given a glow apart from their map');

  // ---------- 3u: window light after dark ----------
  // After dark every ordinary block used to light the same share of its
  // windows in the same colours, so a skyline was one lit building repeated.
  // Each now has its own share, warmth and choice of windows, decided in the
  // block material's shader from a per-vertex attribute; by day nothing may
  // change at all. The render check at the end is what makes the rest mean
  // something: an attribute that never reached the shader would leave every
  // number above it looking perfect and the city dark.
  var wl = await page.evaluate(function () {
    var C = GAME.city, out = { meshes: 0, full: 0, plain: 0, warmLo: 1, warmHi: 0, districts: [], foreign: 0, checked: 0 };
    // the wall colours actually in the mesh, against what each block was dealt
    var dealt = { 0x3a3448: 1, 0xfff0f8: 1 };          // plinth, deco cap
    Object.keys(C.facadePicks).forEach(function (d) { C.facadePicks[d].forEach(function (c) { dealt[c] = 1; }); });
    C.blockMeshes.forEach(function (m) {
      var a = m.geometry.attributes.winLight, p = m.geometry.attributes.position, col = m.geometry.attributes.color;
      out.meshes++;
      if (a && a.count === p.count) out.full++;
      for (var v = 0; v < col.count; v += 6) {
        var hex = (Math.round(col.getX(v) * 255) << 16) | (Math.round(col.getY(v) * 255) << 8) | Math.round(col.getZ(v) * 255);
        out.checked++;
        if (!dealt[hex]) out.foreign++;
      }
      if (!a) return;
      var lo = 9, hi = -1, set = {}, n = 0;
      for (var b = 0; b < a.count / 36; b++) {
        var f = a.getX(b * 36), w = a.getY(b * 36);
        if (f < 0) { out.plain++; continue; }
        n++; set[f.toFixed(3)] = 1; lo = Math.min(lo, f); hi = Math.max(hi, f);
        out.warmLo = Math.min(out.warmLo, w); out.warmHi = Math.max(out.warmHi, w);
      }
      out.districts.push({ n: n, classes: Object.keys(set).length, ratio: lo > 0 ? hi / lo : 0 });
    });
    var ph = GAME.dayPhase;
    GAME.applyTimeOfDay(0); out.nightOn = C.windowNight.value;
    GAME.applyTimeOfDay(1); out.dayOn = C.windowNight.value;
    // One boulevard, night lighting, rendered twice in the same instant: the
    // daytime pattern of lit windows, then tonight's. Nothing else differs.
    var R = GAME.renderer, W = 192, H = 108;
    var rt = new THREE.WebGLRenderTarget(W, H), buf = new Uint8Array(W * H * 4);
    var cam = new THREE.PerspectiveCamera(62, W / H, 0.5, 3000);
    cam.position.set(70, 5, -100); cam.lookAt(-160, 30, -100);
    GAME.applyTimeOfDay(0);
    function shot(v) {
      C.windowNight.value = v;
      R.setRenderTarget(rt); R.render(GAME.scene, cam);
      R.readRenderTargetPixels(rt, 0, 0, W, H, buf); R.setRenderTarget(null);
      return buf.slice();
    }
    var dayPat = shot(0), nightPat = shot(1);
    out.litDay = 0; out.litNight = 0; out.differ = 0;
    for (var i = 0; i < dayPat.length; i += 4) {
      var mD = Math.max(dayPat[i], dayPat[i + 1], dayPat[i + 2]);
      var mN = Math.max(nightPat[i], nightPat[i + 1], nightPat[i + 2]);
      if (mD > 150) out.litDay++;
      if (mN > 150) out.litNight++;
      if (Math.abs(mD - mN) > 40) out.differ++;
    }
    rt.dispose();
    GAME.applyTimeOfDay(0.5 - 0.5 * Math.cos(ph * Math.PI * 2));
    return out;
  });
  check('night light: every block carries its own window light (anchor sanity)',
    wl.meshes === 7 && wl.full === 7, wl.full + ' of ' + wl.meshes + ' block meshes, on every vertex');
  // The check that would have caught the red channel. Declaring the light's
  // roll as `r` inside addBox reused the name of the box's red channel, and
  // every block's walls came out pink, cyan and green — while every paint
  // check above passed, because they read the colours each block was DEALT,
  // not the colours the mesh ended up wearing. Found by rendering it.
  check('night light: and the walls still wear the colours they were dealt',
    wl.checked > 1000 && wl.foreign === 0,
    wl.foreign + ' of ' + wl.checked + ' wall colours in the mesh match no pick');
  // Rolled independently, the island's nine port towers once all came up in
  // the middle two shares: no dark tower and no blazing one on its skyline.
  // Dealt round a ring, any seven blocks in a row hold all four.
  check('night light: some buildings nearly dark and some blazing, in every district of size',
    wl.districts.filter(function (d) { return d.n >= 7; }).every(function (d) { return d.classes === 4 && d.ratio >= 9; }),
    wl.districts.map(function (d) { return d.n + ' blocks: ' + d.classes + ' shares, ' + d.ratio.toFixed(1) + 'x'; }).join('; '));
  check('night light: from the tubes of an office to the lamps of a home',
    wl.warmLo < 0.3 && wl.warmHi > 0.7, 'warmth ' + wl.warmLo.toFixed(2) + ' to ' + wl.warmHi.toFixed(2));
  check('night light: plinths and deco caps keep the windows they always had',
    wl.plain > 50, wl.plain + ' boxes flagged to keep them');
  check('night light: it comes on with the street lamps and is gone by day',
    wl.nightOn === 1 && wl.dayOn === 0, 'night ' + wl.nightOn + ', noon ' + wl.dayOn);
  check('night light: the boulevard has lit windows to compare (anchor sanity)',
    wl.litDay > 150, wl.litDay + ' lit pixels in the daytime pattern');
  check('night light: tonight is not a blackout',
    wl.litNight >= wl.litDay * 0.4, wl.litNight + ' lit pixels tonight against ' + wl.litDay);
  check('night light: and tonight is not the daytime pattern either',
    wl.differ >= wl.litDay * 0.15, wl.differ + ' pixels changed of ' + wl.litDay + ' lit');

  // ---------- 3s: the helipads, on both surfaces ----------
  // The ring over the Alta Verde pad was BAKED into the base map image, which
  // is painted once and drawn under the live marker pass — so it was the one
  // marker the legend could not reach. Solo any other family and every badge
  // on the map struck out except that one, which sat there through all of it.
  // The mainland pad, meanwhile, was on no map at all. Both surfaces draw
  // from one list now, so what this asserts is what each of them puts up.
  var pads = await page.evaluate(function () {
    var H = GAME.hud;
    if (!H.testHelipads || !H.testBaseInk) return { missing: true };
    var all = H.testHelipads().map(function (h) { return { x: Math.round(h.x), z: Math.round(h.z) }; });
    // ink burned into the base image at each pad, before anything is soloed
    var ink = H.testHelipads().map(function (h) { return H.testBaseInk(h.x, h.z, 7); });
    H.testToggleCat('health');                     // solo a family that is not this one
    var soloed = H.testHelipads().length;
    H.testToggleCat('health');                     // and release it again
    var released = H.testHelipads().length;
    return { all: all, ink: ink, soloed: soloed, released: released,
      roof: GAME.city.roofHelipad ? { x: Math.round(GAME.city.roofHelipad.x), z: Math.round(GAME.city.roofHelipad.z) } : null,
      solo: (GAME.prefs || {}).mapSolo || null };
  });
  if (!pads.missing) {
    check('pads: the world has one on each island (anchor sanity)',
      pads.roof !== null, 'the mainland tower pad is at ' + JSON.stringify(pads.roof));
    check('pads: and both are shown, not just the island one',
      pads.all.length === 2, 'pads drawn: ' + JSON.stringify(pads.all));
    check('pads: soloing another family takes them down with the rest',
      pads.soloed === 0, 'pads still drawn while HEALTH was soloed: ' + pads.soloed);
    check('pads: and releasing the solo brings them back',
      pads.released === 2 && pads.solo === null, 'back to ' + pads.released + ', solo=' + pads.solo);
    // The check that would have caught it: a marker in the base image is a
    // marker no legend can strike, however the live pass is filtered.
    check('pads: with no ring left burned into the base image',
      pads.ink.every(function (n) { return n === 0; }),
      'marker-cyan pixels baked at the pads: ' + JSON.stringify(pads.ink));
  }

  // ---------- 3q: a home is on the radar while it is on the radar ----------
  // A home you own is a ringed dot on its real position while it is in
  // range. Off the radar it used to become an arrow pinned to the rim,
  // pointing home from anywhere on the map — a triangle that never left the
  // radar however far out you were. Now it is simply not on it; the big map
  // still shows every home.
  var radar = await page.evaluate(function () {
    var hm = GAME.hud.testHomeMarker;
    if (!hm) return { missing: true };
    var Z = 0.62;                                  // the in-car zoom
    function px(m) { return Math.hypot(m.x, m.z) * Z; }   // canvas px from centre
    var near = [hm(20, 0, Z), hm(60, 0, Z), hm(120, 0, Z)];
    var far = [hm(400, 0, Z), hm(800, 0, Z), hm(1600, 0, Z), hm(600, 600, Z)];
    return {
      nearModes: near.map(function (m) { return m.mode; }),
      nearPx: near.map(function (m) { return +px(m).toFixed(1); }),
      farModes: far.map(function (m) { return m.mode; })
    };
  });
  check('radar: the home marker answers at all', !radar.missing,
    radar.missing ? 'GAME.hud.testHomeMarker is not exposed' : 'present');
  if (!radar.missing) {
    check('radar: a home in range is a dot, and it moves as you close on it',
      radar.nearModes.every(function (m) { return m === 'dot'; }) &&
      radar.nearPx[0] < radar.nearPx[1] && radar.nearPx[1] < radar.nearPx[2],
      'at 20/60/120 m: ' + radar.nearModes.join(', ') + ' at ' + radar.nearPx.join(', ') + ' px');
    check('radar: one off the radar is not drawn at all — no arrow pinned to the rim',
      radar.farModes.every(function (m) { return m === 'off'; }),
      'at 400/800/1600 m and to the north-east: ' + radar.farModes.join(', '));
  }

  // ---------- 3p: the round has a pace ----------
  // Customers covered the ground at 6.8 m/s — 0.85x the player's full sprint,
  // the speed a fare hurries to a waiting cab — and the sale completed the
  // instant they touched the truck. Measured, 1.58 s from being noticed to the
  // money landing. Nobody walks to an ice cream van like that.
  var ice = await page.evaluate(function () {
    GAME.police.clearWanted();
    GAME.test.teleport(-150, 40);
    GAME.test.fastForward(0.8);
    if (GAME.player.inCar) GAME.exitCar();
    var truck = GAME.test.spawnCar('icecream', 3, 0);
    if (!truck) return { noTruck: true };
    GAME.test.fastForward(0.4);
    GAME.test.enterNearestCar(truck);
    GAME.test.fastForward(1.5);
    if (!GAME.player.inCar) return { noBoard: true };
    GAME.test.pressKey('KeyJ');                 // the round starts with J
    GAME.test.fastForward(0.6);
    if (!GAME.missions.active) return { noJob: true };
    // Nobody is spawned waiting for you: the round drafts whoever is already
    // within 24 m of the truck, and the crowd spawns at 60-150 m and walks in.
    // Whether anyone was in range inside a minute was therefore luck, and it
    // came up empty — the group's own anchor failed, taking every check in it
    // down with it. Put people on the pavement rather than hoping for them.
    for (var sp = 0; sp < 3; sp++) {
      var extra = GAME.test.spawnPed([11, -9, 7][sp], [0, 7, -10][sp]);
      if (extra) { extra.jobPed = false; extra.iceServed = false; }
    }
    var top = 0, atHatch = 0, served = 0, seen = 0;
    var watching = null;
    var prevX, prevZ, ratio = 0, scared = false, fledFrames = 0, hurtAt = -1, hurt = 0, fledHurt = 0, watchedFor = 0;
    for (var t = 0; t < 60 * 60; t++) {
      GAME.player.car.speed = 0;                // parked, so the chimes work
      // and the chimes are the horn now: sound them every few seconds
      if (t % 300 === 0) GAME.test.pressKey('KeyG');
      GAME.test.fastForward(1 / 60);
      if (t % 300 === 0) GAME.test.pressKey('KeyG', false);
      var a = GAME.missions.active;
      if (!a || !a.targets) break;
      if (!watching) {
        for (var i = 0; i < a.targets.length; i++) {
          if (a.targets[i].walkUp && a.targets[i].ped) { watching = a.targets[i]; seen++; break; }
        }
      }
      if (watching) {
        var ped = watching.ped;
        var d = Math.hypot(ped.pos.x - GAME.player.car.pos.x, ped.pos.z - GAME.player.car.pos.z);
        top = Math.max(top, ped.speed || 0);
        // What they are SET to and what they cover are two different numbers,
        // and only the second one is the thing you watch. The pace fix set
        // stepBoarding's speed to 4.1 and moved them at it — but the ped loop
        // integrated the same heading and speed a second time before missions
        // ran, so they crossed the ground at 8.2. `top` read a truthful 4.1
        // throughout, which is why this group passed while the customer on
        // screen was still jogging in at twice the intended pace.
        if (prevX !== undefined && (ped.speed || 0) > 2) {
          var moved = Math.hypot(ped.pos.x - prevX, ped.pos.z - prevZ) * 60;
          ratio = Math.max(ratio, moved / ped.speed);
        }
        prevX = ped.pos.x; prevZ = ped.pos.z;
        // A blast is not allowed to hand them a state their mission cannot
        // honour: the round steers them every frame regardless, so a 'flee'
        // here is a flag nobody acts on.
        if (!scared) { scared = true; GAME.peds.panic(ped.pos.x, ped.pos.z, 55, true); }
        // ...and neither is a stray round. damage() sent anyone it did not
        // kill off running, job or not, so one hit on the way over left a
        // customer carrying six seconds of 'flee' — seen as a one-in-ten
        // failure of the two checks either side of this, whenever a brawl
        // nearby put a bullet in somebody's customer.
        if (++watchedFor === 2 && ped.hp > 2) { hurt = ped.hp; GAME.peds.damage(ped, 1, false); hurt -= ped.hp; hurtAt = t; }
        if (ped.state === 'flee') { if (hurtAt >= 0) fledHurt++; else fledFrames++; }
        if (d < 2.4) atHatch++;
        if (a.targets.indexOf(watching) < 0) { served++; break; }   // sold
      }
    }
    var out = { seen: seen, served: served, top: +top.toFixed(1), hatch: +(atHatch / 60).toFixed(2),
      ratio: +ratio.toFixed(2), scared: scared, fled: fledFrames, hurt: hurt, fledHurt: fledHurt };
    // Clock off properly. A round left running keeps selling in the
    // background, and every sale fires haptics.pickup() — which lands in the
    // buzz log of the haptics group further down and breaks two of its checks
    // about a knock buzzing exactly once.
    if (GAME.player.car) { GAME.player.car.speed = 0; GAME.player.car.lat = 0; }
    if (GAME.player.inCar) GAME.exitCar();
    GAME.test.fastForward(1.5);
    out.clockedOff = !GAME.missions.active;
    // Clocking off puts up the result card, and an overlay HALTS THE TICK
    // (that is group 1's whole subject). Left open it froze the world for
    // every group after this one — cameraShake sat at 0.9 forever and the
    // haptics knock checks failed on a game that was not running.
    if (GAME.share.isOpen) GAME.share.hide();
    out.overlayClosed = !GAME.share.isOpen;
    if (truck && !truck.dead) GAME.vehicles.removeCar(truck);
    GAME.test.fastForward(0.3);
    return out;
  });
  if (!ice.noTruck && !ice.noBoard && !ice.noJob) {
    check('ice cream: the chimes bring somebody over (anchor sanity)',
      ice.seen > 0 && ice.served > 0, 'watched ' + ice.seen + ' customer, sold to ' + ice.served);
    check('ice cream: and they walk to the hatch rather than sprinting at it',
      ice.top > 0 && ice.top < 5,
      'fastest they moved: ' + ice.top + ' m/s (a fare hurrying to a cab does 6.8)');
    check('ice cream: and stand there long enough to be handed one',
      ice.hatch >= 0.8, 'time at the window before the sale: ' + ice.hatch + ' s');
    // The one that matters: ground covered, not the speed they were set to.
    check('ice cream: and cover the ground at the pace they are set, not twice it',
      ice.ratio > 0 && ice.ratio < 1.35,
      'fastest they actually travelled was ' + ice.ratio + 'x the speed they were on');
    check('ice cream: a blast beside the round leaves them to their round',
      ice.scared === true && ice.fled === 0,
      'scared them: ' + ice.scared + ', frames spent fleeing: ' + ice.fled);
    check('ice cream: and so does a stray round on the way over',
      ice.hurt > 0 && ice.fledHurt === 0,
      'hurt for ' + ice.hurt + ', frames spent fleeing after: ' + ice.fledHurt);
    check('ice cream: and the group clocks off after itself (anchor sanity)',
      ice.clockedOff === true && ice.overlayClosed === true,
      'shift ended=' + ice.clockedOff + ', result card closed=' + ice.overlayClosed);
  } else {
    check('ice cream: the round could be started at all',
      false, JSON.stringify(ice));
  }

  // ---------- 3o: a pickup you have to swim for is not a pickup ----------
  // The island's second health sat one metre from the sea — reaching for it
  // walked you into the water and washed you up on the beach. This holds every
  // FIXED pickup to standing somewhere you can walk to and back from.
  var dryness = await page.evaluate(function () {
    var C = GAME.city;
    function waterDist(x, z) {
      for (var r = 1; r <= 14; r++) {
        for (var a = 0; a < 16; a++) {
          var ang = a * Math.PI / 8;
          if (C.isInWater(x + Math.cos(ang) * r, z + Math.sin(ang) * r)) return r;
        }
      }
      return 99;
    }
    var worst = null, wet = 0, n = 0;
    C.pickupSpots.forEach(function (sp) {
      n++;
      if (C.isInWater(sp.x, sp.z)) wet++;
      var d = waterDist(sp.x, sp.z);
      if (!worst || d < worst.d) worst = { d: d, x: Math.round(sp.x), z: Math.round(sp.z), type: sp.type };
    });
    return { n: n, wet: wet, worst: worst };
  });
  check('pickups: the world puts some out to be collected (anchor sanity)',
    dryness.n > 10, dryness.n + ' fixed pickups');
  check('pickups: none of them is standing in the sea',
    dryness.wet === 0, dryness.wet + ' of ' + dryness.n + ' in water');
  // 1 m was the measured distance for the island health that prompted this.
  // Six gives room to walk up, turn round and leave again.
  check('pickups: and none close enough that reaching for it is a swim',
    dryness.worst && dryness.worst.d >= 6,
    'closest to water: a ' + dryness.worst.type + ' at (' + dryness.worst.x + ', ' +
    dryness.worst.z + '), ' + dryness.worst.d + ' m from it');

  // ---------- 3m: everyone runs from a blast ----------
  // explodeCar killed anyone within 8 m and did nothing whatsoever to the
  // rest. The only scattering was indirect — kill() panics a 26 m circle — so
  // a blast that happened to catch somebody got a reaction and a blast that
  // caught nobody got none at all: a car went up in the street and the people
  // beside it kept walking. This is NOT rated by the chaos knob, so it runs
  // here with the knob at the OFF the suite pins it to.
  var blast = await page.evaluate(function () {
    // Everything is staged around a point well clear of the player. The first
    // version put the car at the focus itself — on top of them — and the blast
    // killed the player, which halts police.update entirely and took out three
    // checks in the group after this one.
    var OX = 60, OZ = 0;
    function ring(dists) {
      var out = [];
      for (var i = 0; i < dists.length; i++) {
        var p = GAME.test.spawnPed(OX + Math.cos(i * 0.9) * dists[i], OZ + Math.sin(i * 0.9) * dists[i]);
        if (p) { p.state = 'walk'; p.foe = null; out.push({ ped: p, d: dists[i] }); }
      }
      return out;
    }
    function blow(type, dists) {
      GAME.test.teleport(-150, 60);
      GAME.police.clearWanted();
      GAME.test.fastForward(0.8);
      // clear anyone left over so the ring is the only crowd that matters
      GAME.world.peds.slice().forEach(function (p) { if (!p.isCop) GAME.peds.removePed(p); });
      var r = ring(dists);
      var boom = GAME.test.spawnCar(type, OX, OZ);
      GAME.test.fastForward(0.3);
      if (!boom) return null;
      GAME.vehicles.explodeCar(boom, 'test', false);
      GAME.test.fastForward(0.3);
      var reachedTo = 0, quietFrom = 1e9;
      r.forEach(function (e) {
        var moved = e.ped.dead || e.ped.state === 'flee';
        if (moved && e.d > reachedTo) reachedTo = e.d;
        if (!moved && e.d < quietFrom) quietFrom = e.d;
      });
      var res = { reachedTo: reachedTo, quietFrom: quietFrom === 1e9 ? null : quietFrom,
                  n: r.length };
      r.forEach(function (e) { if (!e.ped.gone) GAME.peds.removePed(e.ped); });
      if (!boom.dead) GAME.vehicles.removeCar(boom);
      return res;
    }

    // a mid-fight pair has to be broken up by it too
    GAME.test.teleport(-150, 60);
    GAME.test.fastForward(0.6);
    GAME.chaos.set(3);
    var a = GAME.test.spawnPed(60, 18), b = GAME.test.spawnPed(60, 20);
    var fought = false, brokeUp = false;
    if (a && b) {
      a.temper = 1; b.temper = 1;
      // straight into the state: the ceiling is not what this is about, and a
      // staged fight that loses the race for a slot reads as "no brawl to
      // interrupt" about a blast that works perfectly
      a.state = 'attack'; a.foe = { kind: 'ped', ped: b }; a.attackT = 30;
      GAME.test.fastForward(0.2);
      fought = a.state === 'attack';
      GAME.chaos.set(0);
      var bomb = GAME.test.spawnCar('sedan', 60, 0);
      GAME.test.fastForward(0.3);
      if (bomb) {
        GAME.vehicles.explodeCar(bomb, 'test', false);
        GAME.test.fastForward(0.3);
        brokeUp = a.dead || a.state !== 'attack';
        if (!bomb.dead) GAME.vehicles.removeCar(bomb);
      }
      [a, b].forEach(function (p) { if (p && !p.gone) GAME.peds.removePed(p); });
    }
    GAME.chaos.set(0);

    var DIST = [14, 26, 38, 50, 62, 76, 92, 110];
    var res = { car: blow('sedan', DIST), heli: blow('helicopter', DIST),
                fought: fought, brokeUp: brokeUp };
    GAME.player.health = 100;
    res.playerAlive = GAME.player.state === 'alive';
    return res;
  });
  if (blast.car) {
    check('blast: a car going up scatters people it did not touch (anchor sanity)',
      blast.car.reachedTo >= 38,
      'furthest to react was standing ' + blast.car.reachedTo + ' m away, of ' + blast.car.n + ' placed');
    // felt far past where it hurts — the damage radius is 8 m
    check('blast: well past the eight metres it actually hurts within',
      blast.car.reachedTo > 8 * 3, 'reached ' + blast.car.reachedTo + ' m');
    check('blast: but not the whole city — it does have an edge',
      blast.car.quietFrom !== null && blast.car.quietFrom > blast.car.reachedTo,
      'nearest untroubled bystander stood at ' + blast.car.quietFrom + ' m');
  }
  if (blast.car && blast.heli) {
    check('blast: an airframe going up reaches further than a car does',
      blast.heli.reachedTo > blast.car.reachedTo,
      'helicopter ' + blast.heli.reachedTo + ' m vs sedan ' + blast.car.reachedTo + ' m');
  }
  check('blast: and the group leaves the player standing (anchor sanity)',
    blast.playerAlive, 'player state after four explosions nearby');
  check('blast: two men mid-fight were mid-fight (anchor sanity)',
    blast.fought, blast.fought ? 'a brawl was running' : 'no brawl to interrupt');
  // panic() exempts anyone in the attack state — right for a shout or a body
  // hitting the pavement, wrong for a fireball, which ends any argument
  check('blast: and it ends their argument rather than being ignored',
    blast.brokeUp, blast.brokeUp ? 'the fight broke up' : 'they kept swinging through it');

  // ---------- 3l: the law has somewhere else to be ----------
  // At zero stars police.js used to delete every officer and cruiser in the
  // world every sixtieth frame, which is the deepest reason the police were
  // never after anyone but the player: when you were clean there were no
  // police. A patrol officer now survives that sweep and attends other
  // people's trouble — but the player's own pursuit outranks all of it, and
  // none of it may touch the wanted level.
  var beat = await page.evaluate(function () {
    var C = GAME.chaos, out = {};
    if (!GAME.police.reportIncident) return { missing: true };
    C.set(3);
    // On the pavement, not in the middle of the street (x = -150 is a road):
    // seventy-five seconds standing in traffic is a long time, and on CI a
    // passing car once took some health off and failed the check below,
    // which is about the city's trouble and the law, not the traffic.
    GAME.test.teleport(-150 + 8.4, 40);
    GAME.police.clearWanted();
    GAME.player.health = 100;
    // Seed a crowd beside the player, for the same reason the top-of-range
    // anchor above needs one: trouble only starts near them and spawnBubble
    // puts everyone 60-150 m out, so a player standing still can go a full
    // minute with nothing to report and this group reads "no incidents" about
    // a mechanism that is working perfectly.
    for (var sk = 0; sk < 8; sk++) {
      var sp = GAME.test.spawnPed(Math.cos(sk * 0.8) * (10 + (sk % 3) * 6),
                                  Math.sin(sk * 0.8) * (10 + (sk % 3) * 6));
      if (sp) sp.temper = 0.6 + Math.random() * 0.4;
    }
    GAME.test.fastForward(0.5);
    var stars0 = GAME.police.wanted, hp0 = GAME.player.health;
    var patrolPeak = 0, incPeak = 0, attended = 0, starsMax = 0;
    // Everything that hurts the player in the window, and what it was. The
    // check is on the city's trouble and the law — a punch or a round — so
    // those are what count; a car or a blast is the street, and is reported
    // without failing it.
    var hurts = [], pd0 = GAME.playerDamage;
    GAME.playerDamage = function (amt, cause) { hurts.push(String(cause) + ' ' + Math.round(amt)); return pd0.apply(this, arguments); };
    for (var f = 0; f < 60 * 75; f++) {
      GAME.test.fastForward(1 / 60);
      patrolPeak = Math.max(patrolPeak, GAME.police.patrolCount);
      incPeak = Math.max(incPeak, GAME.police.incidentCount);
      starsMax = Math.max(starsMax, GAME.police.wanted);
      var ps = GAME.world.peds;
      for (var i = 0; i < ps.length; i++) if (ps[i].onCase) { attended++; break; }
    }
    out.patrolPeak = patrolPeak;
    out.incPeak = incPeak;
    out.attended = attended;
    out.starsMax = starsMax;
    GAME.playerDamage = pd0;
    out.hurts = hurts;
    out.hpKept = !hurts.some(function (h) { return /^(fists|shot) /.test(h); });

    // a star of the player's own pulls every officer off the beat
    GAME.test.setWanted(3);
    GAME.test.fastForward(2);
    out.incAfterStars = GAME.police.incidentCount;
    GAME.police.clearWanted();
    GAME.test.fastForward(3);

    // And OFF empties the street. This has to read the END of the window, not
    // the peak across it: the officer standing there when the knob is pressed
    // cannot evaporate on that same frame — the stand-down runs on the
    // sixty-frame sweep — so a peak would only ever be measuring the man who
    // was already there.
    C.set(0);
    GAME.test.fastForward(6);
    out.offPatrolPeak = GAME.police.patrolCount;
    for (var g = 0; g < 60 * 20; g++) GAME.test.fastForward(1 / 60);
    out.offPatrolEnd = GAME.police.patrolCount;
    C.set(0);
    return out;
  });
  check('beat: the incident API is there at all',
    !beat.missing, beat.missing ? 'police.reportIncident is not defined' : 'present');
  if (!beat.missing) {
    check('beat: there are officers on the street with the player clean (anchor sanity)',
      beat.patrolPeak > 0, 'up to ' + beat.patrolPeak + ' on the beat at zero stars');
    check('beat: and other people’s trouble gets reported and attended',
      beat.incPeak > 0 && beat.attended > 0,
      'up to ' + beat.incPeak + ' open cases, ' + beat.attended + ' frames with an officer on one');
    // The one that matters most: a lively city must never frame the player.
    check('beat: none of it lands on the player’s wanted level',
      beat.starsMax === 0, 'highest the player’s stars reached: ' + beat.starsMax);
    check('beat: nor on the player’s health',
      beat.hpKept, beat.hurts.length ? 'hurt by: ' + beat.hurts.join(', ') : 'the player was left alone');
    check('beat: a star of your own outranks whatever they were dealing with',
      beat.incAfterStars === 0, beat.incAfterStars + ' cases survived the player earning 3 stars');
    check('beat: and OFF sends them home rather than leaving one walking it',
      beat.offPatrolPeak === 0 && beat.offPatrolEnd === 0,
      'six seconds after the switch: ' + beat.offPatrolPeak + ', twenty more: ' + beat.offPatrolEnd);
  }

  // a drawn gun: pointed at the other man, and only ever at him
  var gun = await page.evaluate(function () {
    var C = GAME.chaos;
    C.set(4);
    GAME.test.teleport(-150, 90);
    GAME.police.clearWanted();
    GAME.player.health = 100;
    GAME.test.fastForward(0.6);
    var a = GAME.test.spawnPed(5, 0), b = GAME.test.spawnPed(8, 0);
    if (!a || !b) { C.set(0); return { noPeds: true }; }
    var hp0 = b.hp, php0 = GAME.player.health, stars0 = GAME.police.wanted;
    // fire straight through the module door, twenty rounds at close range:
    // the spread model still rolls, so one shot is not a test
    var hits = 0;
    for (var r = 0; r < 20; r++) {
      if (GAME.combat.npcShoot(a.pos.x, 1.35, a.pos.z, 1, 1, a, b)) hits++;
      if (b.dead) break;
    }
    var out = { hits: hits, victimHurt: b.hp < hp0 || b.dead,
                playerHp: GAME.player.health, php0: php0,
                stars: GAME.police.wanted, stars0: stars0 };

    // and a chase between two of them has to actually close
    if (!b.dead) {
      b.hp = 30; b.dead = false;
      // put a street between them first — started three metres apart there is
      // no gap to close and the check passes on any code at all
      b.pos.x = a.pos.x + 26; b.pos.z = a.pos.z + 2;
      b.pos.y = GAME.city.groundY(b.pos.x, b.pos.z);
      GAME.peds.startFlee(b, a.pos.x, a.pos.z, 30);
      // straight into the state rather than through startFight: the ceiling
      // is not what this check is about, and at the top of the range the
      // ambient brawls can hold every slot
      a.state = 'attack'; a.foe = { kind: 'ped', ped: b }; a.attackT = 30;
      var d0 = Math.hypot(a.pos.x - b.pos.x, a.pos.z - b.pos.z), dmin = d0;
      for (var t = 0; t < 60 * 8; t++) {
        GAME.test.fastForward(1 / 60);
        if (a.dead || b.dead || a.gone || b.gone) break;
        dmin = Math.min(dmin, Math.hypot(a.pos.x - b.pos.x, a.pos.z - b.pos.z));
      }
      out.chaseFrom = +d0.toFixed(1); out.chaseTo = +dmin.toFixed(1);
    }
    if (!a.gone) GAME.peds.removePed(a);
    if (!b.gone) GAME.peds.removePed(b);

    // and now the other way round: a fight the PLAYER is in, against someone
    // who turns out to be carrying
    var P = GAME.player;
    function rate(acc, dmg, n) {
      var hits = 0, sh = { aimSkill: 1.03 };
      P.moveSpeed = 0;
      for (var i = 0; i < n; i++) {
        P.health = 100;
        if (GAME.combat.npcShoot(P.pos.x + 12, 1.35, P.pos.z, acc, dmg, sh)) hits++;
      }
      P.health = 100;
      return hits / n;
    }
    if (P.inCar) GAME.exitCar();
    GAME.test.teleport(-150, 0);
    GAME.police.clearWanted();
    GAME.test.fastForward(0.8);
    P.health = 100;
    // a clear range: a car takes a round, so one parked or passing in the
    // twelve metres between stops every shot (all three read 0% when it did)
    GAME.world.cars.slice().forEach(function (c) {
      if (!(P.inCar && c === P.car) && U.dist2(c.pos.x, c.pos.z, P.pos.x + 6, P.pos.z) < 30 * 30) GAME.vehicles.removeCar(c);
    });
    var armed = { civ: rate(0.15, 6, 3000), cop1: rate(0.36, 6, 3000), cop3: rate(0.48, 8, 3000) };
    C.set(4);
    var fx = GAME.focus(), shot = 0, tries = 0;
    // He only draws with a clear line to his man — so the staging has to give
    // him one. Placing him at a fixed bearing put a wall between them on one
    // run in five and the check reported "he never fired" about a gate that
    // was working exactly as written.
    var ANGLES = [0, 0.9, 1.8, 2.7, 3.6, 4.5, 5.4, 6.0];
    for (var k = 0; k < ANGLES.length && tries < 6; k++) {
      var gx = fx.x + Math.cos(ANGLES[k]) * 11, gz = fx.z + Math.sin(ANGLES[k]) * 11;
      if (!GAME.city.hash.segmentClear(gx, gz, fx.x, fx.z)) continue;
      GAME.world.peds.slice().forEach(function (p) { if (!p.isCop) GAME.peds.removePed(p); });
      // and clear the traffic. A car bearing down makes him DIVE, which takes
      // him out of the attack state and stops him drawing at all — which is
      // why the hit count swung between one attempt in four and four, and
      // occasionally came up empty. He is not missing on those runs, he never
      // fires.
      GAME.world.cars.slice().forEach(function (c) {
        if (c !== GAME.player.car && U.dist2(c.pos.x, c.pos.z, fx.x, fx.z) < 50 * 50) GAME.vehicles.removeCar(c);
      });
      var g = GAME.test.spawnPed(gx - fx.x, gz - fx.z);
      if (!g) continue;
      tries++;
      g.temper = 1; g.carrying = true;
      // a null foe is the player — the same thing a provoked stranger gets
      g.state = 'attack'; g.foe = null; g.attackT = 20;
      P.health = 100;
      P.state = 'alive';
      for (var t = 0; t < 60 * 10; t++) {
        P.pos.x = fx.x; P.pos.z = fx.z;          // hold the range open
        g.pos.x = gx; g.pos.z = gz;
        g.attackT = 20;
        if (g.state !== 'attack') { g.state = 'attack'; g.foe = null; }
        if (t % 30 === 0) GAME.world.cars.slice().forEach(function (c) {
          if (c !== GAME.player.car && U.dist2(c.pos.x, c.pos.z, fx.x, fx.z) < 50 * 50) GAME.vehicles.removeCar(c);
        });
        GAME.test.fastForward(1 / 60);
        if (P.health < 100) { shot++; break; }
      }
      P.health = 100;
      if (!g.gone) GAME.peds.removePed(g);
    }
    armed.shot = shot; armed.tries = tries; armed.hitPlayer = shot > 0;
    armed.stars = GAME.police.wanted;
    out.armed = armed;
    P.health = 100;
    C.set(0);
    return out;
  });
  if (!gun.noPeds) {
    check('gun: an NPC round can be aimed at another NPC and land (anchor sanity)',
      gun.hits > 0 && gun.victimHurt, gun.hits + '/20 rounds found the other man');
    // npcShoot read the player's position for its target and applied damage
    // to the player, full stop. If that were still true these twenty rounds
    // would have been fired into the player standing a few metres away.
    check('gun: and it never goes into the player instead',
      gun.playerHp >= gun.php0, 'player health ' + gun.php0 + ' -> ' + gun.playerHp);
    check('gun: gunfire between strangers is not the player’s crime',
      gun.stars === gun.stars0, 'stars ' + gun.stars0 + ' -> ' + gun.stars);
    if (gun.armed) {
      check('gun: a man you are fighting who is carrying will point it at YOU',
        gun.armed.hitPlayer, gun.armed.hitPlayer
          ? 'he drew and hit the player in ' + gun.armed.shot + '/' + gun.armed.tries + ' fights'
          : 'he never fired at the player in ' + gun.armed.tries + ' fights');
      // npcShoot's accuracy is INVERTED — higher is tighter — and the value
      // used while these guns could only ever be aimed at other NPCs made a
      // man with a pistol in his waistband a better shot than a three-star
      // officer. Fine when the player could not be hit by it; not now.
      check('gun: but he is a worse shot than the law, not a better one',
        gun.armed.civ < gun.armed.cop1 && gun.armed.civ < gun.armed.cop3,
        'civilian ' + (gun.armed.civ * 100).toFixed(0) + '% vs officer ' +
        (gun.armed.cop1 * 100).toFixed(0) + '% at one star and ' +
        (gun.armed.cop3 * 100).toFixed(0) + '% at three, all at 12 m');
      check('gun: and being shot at is not something the player gets blamed for',
        gun.armed.stars === 0, 'player stars after being fired on: ' + gun.armed.stars);
    }
    if (gun.chaseFrom !== undefined) {
      // Both run at 6.8: measured, two of them held station thirty metres
      // apart for five straight seconds, neither gaining an inch.
      check('gun: and a chase between two of them actually closes',
        gun.chaseFrom > 20 && gun.chaseTo < gun.chaseFrom - 6,
        'closed from ' + gun.chaseFrom + ' m to ' + gun.chaseTo + ' m in eight seconds');
    }
  }

  // ---------- 3k: the city fights with itself, by the knob ----------
  // Every social thing strangers do to each OTHER is rated off GAME.chaos.
  // Two properties matter and they pull against each other: the levels have
  // to actually differ (a knob whose settings feel the same is not a knob),
  // and OFF has to be the game exactly as it was, because it is the escape
  // hatch as much as it is a preference.
  var chaosRows = await page.evaluate(function () {
    var C = GAME.chaos;
    if (!C) return { missing: true };
    var rows = [];
    for (var i = 0; i < C.levels.length; i++) {
      C.set(i);
      rows.push({ name: C.name, react: C.reactChance, fight: C.fightChance,
                  spark: C.sparkRate, range: C.sparkRange, armed: C.armedChance,
                  police: C.policeRespond, cap: C.maxFights });
    }
    // and the roll helpers must be dead at OFF whatever they are handed
    C.set(0);
    var offRolls = 0;
    for (var r = 0; r < 4000; r++) {
      if (C.roll(1)) offRolls++;
      if (C.rollRate(1000, 1 / 60)) offRolls++;
    }
    C.set(0);
    return { rows: rows, offRolls: offRolls, count: C.levels.length };
  });
  check('chaos: the knob exists and has a range to it',
    !chaosRows.missing && chaosRows.count >= 3,
    chaosRows.missing ? 'GAME.chaos is not defined' : chaosRows.count + ' levels: ' +
    chaosRows.rows.map(function (r) { return r.name; }).join(' / '));
  if (!chaosRows.missing) {
    var rows = chaosRows.rows, off = rows[0];
    check('chaos: OFF is genuinely nothing, not merely quiet',
      off.react === 0 && off.fight === 0 && off.spark === 0 && off.armed === 0 &&
      off.police === false && off.cap === 0,
      JSON.stringify(off));
    // A roll helper that fires at OFF would let any gated behaviour through by
    // accident, which is the one way the escape hatch could silently leak.
    check('chaos: and no roll can come up true at OFF, however it is asked',
      chaosRows.offRolls === 0, chaosRows.offRolls + '/8000 rolls fired at OFF');
    var mono = true, detail = [];
    for (var i = 1; i < rows.length; i++) {
      detail.push(rows[i].name + ' spark=' + rows[i].spark + '@' + rows[i].range + 'm cap=' + rows[i].cap);
      if (i > 1) {
        var a = rows[i - 1], b = rows[i];
        // range and the ceiling carry the level (see the note in chaos.js), so
        // those are the two that must never go backwards
        if (b.range < a.range || b.cap < a.cap || b.fight < a.fight) mono = false;
      }
    }
    check('chaos: every step up is a step up, never sideways or back',
      mono, detail.join('  |  '));
  }

  // and through the game: OFF is silent, the top of the range is not
  var chaosWorld = await page.evaluate(function () {
    var C = GAME.chaos;
    function runFor(level, secs) {
      C.set(level);
      GAME.test.teleport(-150, 40);
      GAME.police.clearWanted();
      GAME.test.fastForward(1);
      // Seed a crowd beside the player. Sparks only fire near them (see
      // chaos.nearPlayer) and spawnBubble puts everyone 60-150 m out, so a
      // player standing still has nobody close and the street can stay quiet
      // for a full minute at the top of the range — measured, twice. Driving
      // into the crowd is what normally supplies this.
      var f = GAME.focus();
      for (var k = 0; k < 8; k++) {
        var ang = k * 0.8, rr = 10 + (k % 3) * 6;
        var np = GAME.test.spawnPed(Math.cos(ang) * rr, Math.sin(ang) * rr);
        if (np) np.temper = 0.6 + Math.random() * 0.4;
      }
      GAME.test.fastForward(0.5);
      var seen = [], fights = 0, peak = 0;
      for (var f = 0; f < 60 * secs; f++) {
        GAME.test.fastForward(1 / 60);
        var ps = GAME.world.peds, live = 0;
        for (var i = 0; i < ps.length; i++) {
          var p = ps[i];
          if (p.dead || p.isCop) continue;
          if (p.state === 'attack') {
            live++;
            if (seen.indexOf(p) < 0) { seen.push(p); fights++; }
          }
        }
        if (live > peak) peak = live;
      }
      return { fights: fights, peak: peak, crowd: GAME.world.peds.length };
    }
    // MAYHEM first: if the crowd cannot produce a fight at all, the OFF
    // result below means nothing
    var loud = runFor(C.levels.length - 1, 45);
    var quiet = runFor(0, 45);
    C.set(0);
    return { loud: loud, quiet: quiet };
  });
  check('chaos: at the top of the range the street does kick off (anchor sanity)',
    chaosWorld.loud.fights > 0,
    chaosWorld.loud.fights + ' fights in 45 s, up to ' + chaosWorld.loud.peak +
    ' at once, crowd of ' + chaosWorld.loud.crowd);
  check('chaos: and at OFF the same street does not, at all',
    chaosWorld.quiet.fights === 0,
    chaosWorld.quiet.fights + ' fights in 45 s with the knob off');

  // a fight between two strangers has to actually be a fight
  var brawl = await page.evaluate(function () {
    var C = GAME.chaos;
    C.set(3);
    GAME.test.teleport(-150, 60);
    GAME.police.clearWanted();
    GAME.test.fastForward(0.6);
    var f = GAME.focus();
    var a = GAME.test.spawnPed(4, 0), b = GAME.test.spawnPed(6, 0);
    if (!a || !b) { C.set(0); return { noPeds: true }; }
    a.temper = 1; b.temper = 1;
    // Clear the ambient brawls first. The fight ceiling is a real cap and at
    // the top of the range the street reaches it on its own — a staged fight
    // that silently loses the race for a slot reads as "he did not charge"
    // and fails a check about something else entirely.
    GAME.world.peds.forEach(function (p) {
      if (p !== a && p !== b && p.state === 'attack') { p.state = 'walk'; p.foe = null; }
    });
    var hp0 = b.hp;
    var took = GAME.peds.startFight(a, { kind: 'ped', ped: b }, 12);
    var closed = 1e9;
    for (var t = 0; t < 60 * 10; t++) {
      GAME.test.fastForward(1 / 60);
      if (a.dead || b.dead) break;
      closed = Math.min(closed, Math.hypot(a.pos.x - b.pos.x, a.pos.z - b.pos.z));
    }
    var out = { took: took, hp0: hp0, hp1: b.hp, hit: b.hp < hp0 || b.dead,
                closed: +closed.toFixed(1), aState: a.state, bState: b.state };
    if (!a.gone) GAME.peds.removePed(a);
    if (!b.gone) GAME.peds.removePed(b);
    C.set(0);
    return out;
  });
  if (!brawl.noPeds) {
    check('chaos: one stranger can be set on another at all (anchor sanity)',
      brawl.took === true, 'startFight returned ' + brawl.took);
    check('chaos: and he closes the distance rather than shadow-boxing',
      brawl.closed < 2.5, 'got within ' + brawl.closed + ' m');
    check('chaos: and the punches land on the other man, not on the player',
      brawl.hit, 'his hp went ' + brawl.hp0 + ' -> ' + brawl.hp1 +
      ' (he ended up ' + brawl.bState + ')');
  }

  // ---------- 3j: a wall shoves you off, it does not launch you ----------
  // The rebound off a solid was 40% of the closing speed with nothing to take
  // it back off you again: it went straight into car.speed and was left to a
  // drag with a four-second time constant. Measured, a 26 m/s hit came back
  // at 7.6 m/s, reversed 21 metres, and was still rolling backwards at 2.3 m/s
  // six seconds later — a reverse gear nobody selected. The share is unchanged
  // (a nudge still bounces exactly as it did); what is new is a ceiling on it,
  // and a drag that only ever acts on a reverse you did not ask for.
  var wall = await page.evaluate(function () {
    var P = GAME.player, K = GAME.input.keys, C = GAME.city;
    // a tall face with clear ground in front of it to run at
    var w = null;
    for (var z = -400; z <= 400 && !w; z += 7) for (var x = -400; x <= 300 && !w; x += 7) {
      var boxes = C.hash.query(x, z, 3);
      for (var b = 0; b < boxes.length; b++) {
        var q = boxes[b];
        if (q.h === undefined || q.h < 8) continue;
        var ax = q.minX - 30, az = (q.minZ + q.maxZ) / 2;
        if (C.isInWater(ax, az)) continue;
        var clear = true;
        for (var st = 2; st <= 26 && clear; st += 2) {
          var got = C.hash.query(ax + st, az, 2.5);
          for (var g = 0; g < got.length; g++) if (got[g] !== q) { clear = false; break; }
        }
        if (clear) { w = { ax: ax, az: az, faceX: q.minX }; break; }
      }
    }
    if (!w) return { noWall: true };

    function board() {
      GAME.test.teleport(w.ax, w.az); GAME.test.fastForward(0.3);
      if (P.inCar) GAME.exitCar();
      var c = GAME.test.spawnCar('sedan', 2, 0); GAME.test.fastForward(0.3);
      GAME.test.enterNearestCar(c); GAME.test.fastForward(1.2);
      K['KeyW'] = K['KeyS'] = K['KeyA'] = K['KeyD'] = false;
      return P.car;
    }
    // Drive squarely at the face and report what the bounce does afterwards.
    // The start is close in on purpose: from 30 m back the coast drag eats
    // most of the entry speed — a 9 m/s run arrived at 3.7 — and then both
    // cases land under the ceiling and the comparison below means nothing.
    function crash(entry) {
      var car = board();
      var sx = w.faceX - (car.spec.l / 2 + 6);
      car.pos.set(sx, C.groundY(sx, w.az), w.az);
      // Clear the run-up. By the time this group runs the suite has simulated
      // minutes of play, so the street between the car and the wall is parked
      // up — the first attempt at this stopped 5.8 m short on a parked sedan
      // and measured a car-on-car nudge instead of the wall.
      for (var q = GAME.world.cars.length - 1; q >= 0; q--) {
        var o = GAME.world.cars[q];
        if (o === car) continue;
        if (o.pos.x > sx - 12 && o.pos.x < w.faceX + 4 && Math.abs(o.pos.z - w.az) < 14) GAME.vehicles.removeCar(o);
      }
      car.heading = Math.PI / 2;          // straight at it
      car.speed = entry; car.lat = 0; car.hp = car.spec.hp; car.stage = 0;
      var back = 0, revDist = 0, prevX = car.pos.x, hit = false, closest = 1e9;
      for (var t = 0; t < 60 * 6; t++) {
        GAME.test.fastForward(1 / 60);
        if (car.speed < back) back = car.speed;
        if (car.speed < -0.2) hit = true;
        if (car.pos.x < prevX) revDist += prevX - car.pos.x;
        prevX = car.pos.x;
        // CLOSEST approach, not where it ended up: on the old code the car
        // bounces and then reverses most of a block, so an end-of-run gap
        // says "never reached the wall" about a run that hit it hard.
        closest = Math.min(closest, w.faceX - (car.pos.x + car.spec.l / 2));
      }
      var r = { entry: entry, back: +back.toFixed(2), revDist: +revDist.toFixed(1),
                endSp: +car.speed.toFixed(2), bounced: hit,
                // how close the nose got to the face — proof it was the WALL
                // it met, and not something parked in the way
                gap: +closest.toFixed(1) };
      GAME.exitCar();
      return r;
    }
    var out = { slow: crash(8), fast: crash(26) };

    // and asking for reverse still gives you reverse
    var car = board();
    var rx = w.ax - 40;
    car.pos.set(rx, C.groundY(rx, w.az), w.az);
    car.heading = Math.PI / 2; car.speed = 0; car.lat = 0;
    K['KeyS'] = true;
    for (var t2 = 0; t2 < 60 * 4; t2++) GAME.test.fastForward(1 / 60);
    out.reverse = +car.speed.toFixed(2);
    K['KeyS'] = false;
    GAME.exitCar();
    return out;
  });
  if (!wall.noWall) {
    check('wall: driving into it does bounce the car back (anchor sanity)',
      wall.fast.bounced && wall.slow.bounced && wall.fast.gap < 3 && wall.slow.gap < 3,
      'rebound peaks ' + wall.slow.back + ' / ' + wall.fast.back + ' m/s, nose left ' +
      wall.slow.gap + ' / ' + wall.fast.gap + ' m off the face');
    // The point of the ceiling: arriving three times as fast must not hand
    // back three times the shove. Without it the fast run rebounds at 7.6.
    check('wall: a fast hit is absorbed, not returned',
      Math.abs(wall.fast.back) < Math.abs(wall.slow.back) * 1.6,
      'from ' + wall.slow.entry + ' m/s the shove is ' + Math.abs(wall.slow.back) +
      ', from ' + wall.fast.entry + ' m/s it is ' + Math.abs(wall.fast.back));
    check('wall: and the bounce stops instead of becoming a reverse gear',
      wall.fast.revDist < 6 && Math.abs(wall.fast.endSp) < 0.2,
      'reversed ' + wall.fast.revDist + ' m, still doing ' + wall.fast.endSp + ' m/s six seconds later');
    check('wall: reverse you actually ASK for is untouched',
      wall.reverse < -8, 'four seconds on the brake from a standstill: ' + wall.reverse + ' m/s');
  }

  // ---------- 3i: nobody on foot goes up a stunt ramp ----------
  // Ramps are surfaces rather than solids — that is what lets a car ride up
  // one — and feet ride up just as well. The raked flanks beside the deck ARE
  // solid, so a stroller who wandered onto a wedge had nowhere to go but back
  // down the way they came or off the lip: measured, seven of them did it in
  // six minutes of play and stayed up there for as long as 39 seconds.
  var walkRule = await page.evaluate(function () {
    var C = GAME.city;
    if (typeof C.canWalkTo !== 'function') return { missing: true, ramps: C.ramps.length };
    // a ground-level wedge to reason about, and its two ends in world space
    var r = null;
    for (var i = 0; i < C.ramps.length; i++) if (!C.ramps[i].base) { r = C.ramps[i]; break; }
    if (!r) return { noRamp: true };
    function at(lx, lz) { return [r.x + lx * r.cos + lz * r.sin, r.z - lx * r.sin + lz * r.cos]; }
    var foot = at(0, -r.len / 2 - 3);          // 3 m short of the low end
    var low = at(0, -r.len / 2 + r.len * 0.3); // a third of the way up
    var high = at(0, r.len / 2 - 0.5);         // just below the lip
    var off = at(r.w / 2 + 14, 0);             // well clear, beside it
    return {
      ramps: C.ramps.length,
      // the heights those points actually stand at, so the check is not
      // asserting against a ramp it has mis-located
      lowY: +((C.rampAt(low[0], low[1]) || {}).y || 0).toFixed(2),
      highY: +((C.rampAt(high[0], high[1]) || {}).y || 0).toFixed(2),
      footOn: !!C.rampAt(foot[0], foot[1]),
      up: C.canWalkTo(foot[0], foot[1], low[0], low[1]),
      further: C.canWalkTo(low[0], low[1], high[0], high[1]),
      down: C.canWalkTo(high[0], high[1], low[0], low[1]),
      away: C.canWalkTo(low[0], low[1], off[0], off[1]),
      flat: C.canWalkTo(off[0], off[1], off[0] + 2, off[1] + 2),
      // A walker heading straight up the wedge, advancing only where the rule
      // allows. This is the one that matters: asking the rule about ONE step
      // tells you nothing about a thousand of them, and the first version of
      // this fix — which let through any step gaining under 2 cm — passed
      // every single-step check above while letting a stroller climb the
      // whole ramp a centimetre at a time.
      //
      // The stride has to be a walking ped's ACTUAL frame, ~1.6 m/s at 1/60,
      // because that is the granularity the rule gets asked at and the whole
      // point of a per-step tolerance is that a small enough step slips under
      // it. A coarser 0.06 m stride gains 2.6 cm on this slope, clears the
      // 2 cm slack on its own, and let the broken rule pass this check.
      climbed: (function () {
        var STRIDE = 1.6 / 60;
        var lz = -r.len / 2 - 1, peak = 0;
        var n = Math.ceil(r.len / STRIDE) + 300;   // enough to walk clear over the top
        for (var k = 0; k < n; k++) {
          var a = at(0, lz), b = at(0, lz + STRIDE);
          if (!C.canWalkTo(a[0], a[1], b[0], b[1])) continue;   // refused: they stay put
          lz += STRIDE;
          var hit = C.rampAt(b[0], b[1]);
          if (hit && hit.y > peak) peak = hit.y;
        }
        return +peak.toFixed(2);
      })()
    };
  });
  check('ramp: the rule exists at all',
    !walkRule.missing, walkRule.missing ? 'city.canWalkTo is not defined' : 'city.canWalkTo');
  if (!walkRule.missing && !walkRule.noRamp) {
    check('ramp: the wedge under the test rises (anchor sanity)',
      walkRule.highY > walkRule.lowY && walkRule.lowY > 0.45 && !walkRule.footOn,
      'deck ' + walkRule.lowY + 'm -> ' + walkRule.highY + 'm, foot clear=' + !walkRule.footOn);
    check('ramp: a step from the ground up onto the deck is refused',
      walkRule.up === false, 'canWalkTo(ground -> deck) = ' + walkRule.up);
    check('ramp: and so is one that climbs higher up it',
      walkRule.further === false, 'canWalkTo(low -> high) = ' + walkRule.further);
    check('ramp: but coming back DOWN is always allowed',
      walkRule.down === true, 'canWalkTo(high -> low) = ' + walkRule.down);
    check('ramp: and so is stepping off it onto the ground',
      walkRule.away === true, 'canWalkTo(deck -> beside) = ' + walkRule.away);
    check('ramp: level ground is untouched by the rule',
      walkRule.flat === true, 'canWalkTo(flat -> flat) = ' + walkRule.flat);
    check('ramp: and a thousand walking strides up it get no further than ankle deep',
      walkRule.climbed <= 0.46,
      'a walker striding at it reached ' + walkRule.climbed + 'm of a ' + walkRule.highY + 'm deck');
  }

  // and the same thing through the game. Three cases, because the first two
  // fail on different broken rules: a crowd sent at a ramp from the ground
  // catches "no rule at all", and one already standing on the foot of the
  // wedge catches a rule with a per-step tolerance in it. That second one is
  // not hypothetical — the first version of this allowed a step that gained
  // less than 2 cm, and since a walking ped covers under 3 cm in a frame and
  // gains barely more than a centimetre of height doing it, the whole ramp was
  // climbed a centimetre at a time and THIS CHECK PASSED. The third pins the
  // way back down, so the rule cannot be tightened into a trap of its own.
  var walkWorld = await page.evaluate(function () {
    var C = GAME.city, r = null;
    for (var i = 0; i < C.ramps.length; i++) if (!C.ramps[i].base) { r = C.ramps[i]; break; }
    if (!r) return { noRamp: true };
    function at(lx, lz) { return [r.x + lx * r.cos + lz * r.sin, r.z - lx * r.sin + lz * r.cos]; }
    function upAt(y) { return -r.len / 2 + (y / r.h) * r.len; }   // local z at deck height y
    var top = at(0, r.len / 2 - 1);
    GAME.test.teleport(r.x + 26, r.z + 26);
    GAME.police.clearWanted();
    GAME.test.fastForward(0.5);
    var out = { h: +r.h.toFixed(1), ramps: C.ramps.length };

    // walk a crowd, hold them to an order every frame, and report how high
    // they got and how far they moved
    function drive(places, aim, secs) {
      var f = GAME.focus(), crowd = [], peak = 0;
      for (var k = 0; k < places.length; k++) {
        var p = GAME.test.spawnPed(places[k][0] - f.x, places[k][1] - f.z);
        p.state = 'walk'; p.speed = 1.6;
        p.startX = p.pos.x; p.startZ = p.pos.z;
        crowd.push(p);
      }
      var lastY = 0;
      for (var t = 0; t < 60 * secs; t++) {
        for (var c = 0; c < crowd.length; c++) {
          var q = crowd[c];
          if (q.dead) continue;
          q.wpX = aim[0]; q.wpZ = aim[1]; q.wpT = 60;
          var rp = C.rampAt(q.pos.x, q.pos.z);
          lastY = rp ? rp.y : 0;
          if (lastY > peak) peak = lastY;
        }
        GAME.test.fastForward(1 / 60);
      }
      var moved = 0, ended = 0;
      for (var d = 0; d < crowd.length; d++) {
        moved = Math.max(moved, Math.hypot(crowd[d].pos.x - crowd[d].startX, crowd[d].pos.z - crowd[d].startZ));
        var er = C.rampAt(crowd[d].pos.x, crowd[d].pos.z);
        ended = Math.max(ended, er ? er.y : 0);
        GAME.peds.removePed(crowd[d]);
      }
      return { peak: +peak.toFixed(2), moved: +moved.toFixed(1), ended: +ended.toFixed(2) };
    }

    // 1. three abreast, 3 m short of the low end, told to go over the top
    out.fromGround = drive([at(-2, -r.len / 2 - 3), at(0, -r.len / 2 - 3), at(2, -r.len / 2 - 3)], top, 12);
    // 2. one already standing at ankle height on the slope, same order
    out.fromFoot = drive([at(0, upAt(0.40))], top, 12);
    // 3. one dropped two thirds of the way up: they have to get themselves off
    var high = at(0, upAt(r.h * 0.66));
    out.highY = +((C.rampAt(high[0], high[1]) || {}).y || 0).toFixed(2);
    var f2 = GAME.focus();
    var stranded = GAME.test.spawnPed(high[0] - f2.x, high[1] - f2.z);
    stranded.state = 'walk'; stranded.speed = 1.6;
    // Told to leave by the low end, every frame. Left to their own waypoints
    // the time to get off is a lottery — measured at 4.8 s, 4.9 s and 8.3 s
    // on the same code — and a bound inside that spread is not a check. With
    // the order held, this asks the one thing it is for: does the rule let
    // someone who WANTS to come down actually do it?
    var exit = at(0, -r.len / 2 - 4);
    out.downT = null;
    for (var t2 = 0; t2 < 60 * 30; t2++) {
      stranded.wpX = exit[0]; stranded.wpZ = exit[1]; stranded.wpT = 60;
      GAME.test.fastForward(1 / 60);
      var sr = C.rampAt(stranded.pos.x, stranded.pos.z);
      if (!sr || sr.y <= 0.5) { out.downT = +(t2 / 60).toFixed(1); break; }
    }
    GAME.peds.removePed(stranded);
    return out;
  });
  if (!walkWorld.noRamp) {
    check('ramp: the crowd sent at it actually set off (anchor sanity)',
      walkWorld.fromGround.moved > 2, 'furthest of the three moved ' + walkWorld.fromGround.moved + 'm');
    check('ramp: twelve seconds of walking straight at one gets nobody up it',
      walkWorld.fromGround.peak <= 0.5,
      'highest anyone stood: ' + walkWorld.fromGround.peak + 'm on a ' + walkWorld.h + 'm ramp');
    // the same thing through the AI. It moves the needle far less than the
    // stride walk above does — 16 cm against a whole ramp — so treat this as
    // the wiring check it is and leave the ratchet itself to the door.
    check('ramp: nor does one who starts already standing on the foot of it',
      walkWorld.fromFoot.peak <= 0.5,
      'from ankle height they reached ' + walkWorld.fromFoot.peak + 'm, ending at ' + walkWorld.fromFoot.ended + 'm');
    check('ramp: someone left up on the deck is up there (anchor sanity)',
      walkWorld.highY > 1, 'dropped at ' + walkWorld.highY + 'm');
    check('ramp: and they can walk back down off it',
      walkWorld.downT !== null && walkWorld.downT < 20,
      walkWorld.downT === null ? 'still on the deck after 30s' : 'off in ' + walkWorld.downT + 's');
  }

  // ---------- 3i (b): a fare is never set down on a wedge ----------
  // kerbWaitSpot pushed 14 m out from the road centre and the verge ramps
  // start at 11 m, so about one fare or casualty in fifty stood on a slope
  // where the cab cannot pull up and — before the rule above — nobody on
  // foot could be reached anyway.
  var fares = await page.evaluate(function () {
    var M = GAME.missions, C = GAME.city;
    if (!M.testWaitSpot || !M.testRandomRoadPoint) return { missing: true };
    function onRamp(x, z) { var r = C.rampAt(x, z); return !!r && r.y > 0.45; }
    var res = { n: 0, marker: 0, body: 0, naive: 0, drifts: [] };
    // 20k rolls, not a few hundred: the marker itself lands on a wedge about
    // once in nine hundred, and a sample too small to see that is a check
    // that would pass on the broken code. The whole sweep is arithmetic —
    // it costs a second or two, no simulation at all.
    for (var t = 0; t < 20000; t++) {
      var fx = -440 + Math.random() * 780, fz = -440 + Math.random() * 880;
      if (C.isInWater(fx, fz)) continue;
      var m = M.testRandomRoadPoint(fx, fz, 60, 260);
      var w = M.testWaitSpot(m[0], m[1]);
      res.n++;
      if (onRamp(m[0], m[1])) res.marker++;
      if (onRamp(w[0], w[1])) res.body++;
      res.drifts.push(Math.hypot(w[0] - m[0], w[1] - m[1]));
      // what the old single push would have produced from the same marker:
      // straight out 14 m on the marker's own side, no re-roll
      var rp = C.nearestRoadPoint(m[0], m[1]);
      var nx, nz;
      if (rp.axis === 'net') {
        var sgn = Math.hypot(m[0] - (rp.x + Math.cos(rp.heading)), m[1] - (rp.z - Math.sin(rp.heading))) <
          Math.hypot(m[0] - (rp.x - Math.cos(rp.heading)), m[1] - (rp.z + Math.sin(rp.heading))) ? 1 : -1;
        nx = rp.x + Math.cos(rp.heading) * 14 * sgn; nz = rp.z - Math.sin(rp.heading) * 14 * sgn;
      } else if (rp.axis === 'z') { nx = rp.x + (m[0] >= rp.x ? 14 : -14); nz = m[1]; }
      else { nx = m[0]; nz = rp.z + (m[1] >= rp.z ? 14 : -14); }
      if (onRamp(nx, nz)) res.naive++;
    }
    res.drifts.sort(function (a, b) { return a - b; });
    res.p99 = +res.drifts[Math.floor(res.drifts.length * 0.99)].toFixed(1);
    res.drift = +res.drifts[res.drifts.length - 1].toFixed(1);
    res.drifts = null;
    return res;
  });
  check('fare: the pickup roller answers at all',
    !fares.missing, fares.missing ? 'GAME.missions.testWaitSpot is not exposed' : 'hooks present');
  if (!fares.missing) {
    // Without this the two zeroes below could just mean "this world has no
    // ramp anywhere near a kerb", which would make them free.
    check('fare: the 14 m push does land on ramps (anchor sanity)',
      fares.naive > 0,
      fares.naive + '/' + fares.n + ' of the unrolled spots are on a wedge');
    check('fare: no pickup marker sits part-way up a ramp',
      fares.marker === 0, fares.marker + '/' + fares.n + ' markers on a wedge');
    check('fare: and nobody is left standing on one waiting for you',
      fares.body === 0, fares.body + '/' + fares.n + ' waiting bodies on a wedge');
    // The re-roll moves people along the kerb, so this has to stay honest
    // about how far: the everyday case, and the worst the kerb sweep does.
    check('fare: the fare still stands beside their own marker',
      fares.p99 < 12 && fares.drift < 30,
      'p99 ' + fares.p99 + 'm, furthest ' + fares.drift + 'm from the marker');
  }

  // ---------- 4: unlimited ammo reads as unlimited ----------
  var ammo = await page.evaluate(function () {
    GAME.test.fastForward(1);
    // (and put back as it was: left switched on, every group after this ran
    // with unlimited ammo, and a gun counter with nothing to sell)
    var P = GAME.player, ammo0 = GAME.unlimitedAmmo, weapons0 = JSON.stringify(P.weapons), cur0 = P.currentWeapon;
    GAME.unlimitedAmmo = false;
    GAME.combat.giveWeapon('pistol', 40);
    GAME.combat.refreshWeaponHud();
    var finite = document.getElementById('weapon-line').textContent;
    GAME.unlimitedAmmo = true;
    GAME.combat.giveAllWeapons();
    var unlimited = document.getElementById('weapon-line').textContent;
    GAME.unlimitedAmmo = ammo0;
    P.weapons = JSON.parse(weapons0, function (k, v) { return k === 'ammo' && v === null ? Infinity : v; });
    P.currentWeapon = cur0;
    GAME.combat.refreshWeaponHud();
    return { finite: finite, unlimited: unlimited };
  });
  check('ammo: a finite count still shows a number',
    /\d/.test(ammo.finite) && ammo.finite.indexOf('∞') < 0, JSON.stringify(ammo.finite));
  check('ammo: unlimited shows ∞, not 999',
    ammo.unlimited.indexOf('∞') >= 0 && ammo.unlimited.indexOf('999') < 0, JSON.stringify(ammo.unlimited));

  // ---------- 5: the stereo image points the right way ----------
  // The one thing worth pinning: a mirrored field is both easy to write and
  // hard to notice in a headless run. So rather than restate the basis (and
  // risk restating it wrong the same way twice), take the direction the game
  // ITSELF moves the player when they hold D, and require sound to agree.
  var pan = await page.evaluate(function () {
    var P = GAME.player;
    GAME.test.teleport(350, 300);            // open ground, nothing to bump
    GAME.test.fastForward(0.6);
    GAME.cam.yaw = 0.7;
    var x0 = P.pos.x, z0 = P.pos.z;
    GAME.input.keys['KeyD'] = true;          // "right" as the player feels it
    GAME.test.fastForward(0.6);
    GAME.input.keys['KeyD'] = false;
    var dx = P.pos.x - x0, dz = P.pos.z - z0;
    var moved = Math.sqrt(dx * dx + dz * dz);
    GAME.test.fastForward(0.3);
    GAME.audio.setListener(P.pos.x, P.pos.z, GAME.cam.yaw);
    var fx = Math.sin(GAME.cam.yaw), fz = Math.cos(GAME.cam.yaw);
    return {
      moved: moved,
      right: GAME.audio.testPan(P.pos.x + dx * 40, P.pos.z + dz * 40),
      left: GAME.audio.testPan(P.pos.x - dx * 40, P.pos.z - dz * 40),
      ahead: GAME.audio.testPan(P.pos.x + fx * 40, P.pos.z + fz * 40),
      behind: GAME.audio.testPan(P.pos.x - fx * 40, P.pos.z - fz * 40),
      onTop: GAME.audio.testPan(P.pos.x, P.pos.z)
    };
  });
  check('stereo: the player actually moved (anchor sanity)', pan.moved > 0.5, 'moved=' + pan.moved);
  check('stereo: a sound where D takes you pans right', pan.right > 0.5, 'pan=' + pan.right);
  check('stereo: and the opposite side pans left', pan.left < -0.5, 'pan=' + pan.left);
  check('stereo: dead ahead and dead behind sit centre',
    Math.abs(pan.ahead) < 0.05 && Math.abs(pan.behind) < 0.05, 'ahead=' + pan.ahead + ' behind=' + pan.behind);
  check('stereo: a source on the listener does not jitter', pan.onTop === 0, 'pan=' + pan.onTop);
  check('stereo: nothing pins fully to one ear',
    Math.abs(pan.right) <= 0.85 && Math.abs(pan.left) <= 0.85, 'r=' + pan.right + ' l=' + pan.left);

  // and the wiring: a chase has to tell the siren WHERE the cruiser is
  var siren = await page.evaluate(function () {
    var seen = null, s0 = GAME.audio.siren;
    GAME.audio.siren = function (v, p, x, z) { if (v > 0) seen = { x: x, z: z }; return s0.apply(GAME.audio, arguments); };
    GAME.test.setWanted(3);
    // Wait for the cruiser, do not assume six seconds buys one. Spawning a
    // pursuit car, getting it to the player and starting its siren is a
    // stochastic errand, and a fixed window duly came up empty on one run in
    // five — reporting "no siren position" about a chase that simply had not
    // arrived yet.
    var waited = 0;
    while (!seen && waited < 60 * 25) { GAME.test.fastForward(1 / 60); waited++; }
    var wanted = GAME.police.wanted;
    GAME.audio.siren = s0;
    // Call off the manhunt. Left running it followed the player into the
    // groups below, and cops shooting the subject of a measurement is how the
    // roof height drifted and the damage check found a corpse.
    GAME.police.clearWanted();
    GAME.player.health = 100;
    GAME.test.fastForward(1);
    return { seen: seen, wanted: wanted, waited: waited };
  });
  check('stereo: a chasing cruiser gives the siren its position',
    !!siren.seen && isFinite(siren.seen.x) && isFinite(siren.seen.z),
    'wanted=' + siren.wanted + ' got=' + JSON.stringify(siren.seen) +
    ' after ' + (siren.waited / 60).toFixed(1) + 's');

  // ---------- 5b: the radio plays through the radio's own tap ----------
  // The stations' hi-hats and snares were handed to the effects bus instead
  // of the radio's, and the effects bus is behind neither the car door nor
  // MUSIC: OFF — so they ticked on after you got out, and through the
  // setting. Both buses are private, so find the effects bus the way a sound
  // does: it is the one place a centred UI blip drains to. Then stop the sim,
  // so the radio's own clock is the only thing left making sound, and count
  // what it wires up. That clock is a setInterval against the audio clock,
  // which no fastForward can hurry, so these windows are real time.
  var tap = await page.evaluate(async function () {
    var a = GAME.audio, ac = a.ctx;
    if (!ac || ac.state !== 'running') return { running: false, state: ac ? ac.state : 'none' };
    var edges = null, starts = null, voices = 0;
    var connect0 = AudioNode.prototype.connect;
    var osc0 = ac.createOscillator, src0 = ac.createBufferSource;
    AudioNode.prototype.connect = function (dst) {
      if (edges) edges.push([this, dst]);
      return connect0.apply(this, arguments);
    };
    // both kinds of voice: a buffer source declares a start() of its own
    var unspy = [OscillatorNode.prototype, AudioBufferSourceNode.prototype].map(function (p) {
      var own = p.hasOwnProperty('start'), f = p.start;
      p.start = function (when) { if (starts) starts.push(when); return f.apply(this, arguments); };
      return function () { if (own) p.start = f; else delete p.start; };
    });
    ac.createOscillator = function () { voices++; return osc0.apply(ac, arguments); };
    ac.createBufferSource = function () { voices++; return src0.apply(ac, arguments); };
    function wait(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }
    var sfx = null;
    async function listen(ms) {
      edges = []; starts = []; voices = 0;
      await wait(ms);
      var w = { voices: voices, intoSfx: edges.filter(function (e) { return e[1] === sfx; }).length, starts: starts };
      edges = starts = null;
      return w;
    }
    var ts0 = GAME.timeScale, music0 = a.musicOn, mute0 = a.muted;
    var out = { running: true, state: ac.state };
    try {
      // the sink of a blip: the one node its edges end at and never leave
      edges = [];
      a.cashTick();
      var from = edges.map(function (e) { return e[0]; });
      var sinks = edges.map(function (e) { return e[1]; }).filter(function (d) { return from.indexOf(d) < 0; });
      edges = null;
      out.sinks = sinks.length;
      sfx = sinks.length === 1 ? sinks[0] : null;

      a.setMusicOn(true);
      if (a.muted) a.toggleMute();
      var car = GAME.test.spawnCar('sedan', 4, 0);
      GAME.test.fastForward(0.2);
      if (car) GAME.test.enterNearestCar(car);
      GAME.test.fastForward(1.2);           // boarding is a walk to the door first
      out.inCar = GAME.player.inCar === true;
      GAME.timeScale = 0;                   // the loop ticks nothing from here
      var st = a.radio.stations.filter(function (s) { return s.name === a.radio.name; })[0];
      var spb = 60 / st.bpm / 4;
      out.driving = await listen(1200);
      a.setMusicOn(false);
      out.musicOff = await listen(1200);
      a.setMusicOn(true);
      a.toggleMute();
      out.muted = await listen(1200);
      a.toggleMute();
      out.back = await listen(1200);
      // Every note a station plays starts on a step, so a radio that kept
      // counting through the silence starts its first note back on the grid
      // it left — one that restarted the bar would land anywhere on it.
      var t0 = out.driving.starts[0], off = 0;
      out.back.starts.forEach(function (t) {
        var k = (t - t0) / spb;
        off = Math.max(off, Math.abs(k - Math.round(k)));
      });
      out.offBeat = t0 === undefined ? 1 : off;
      // and out of the car: the fade down is played into on purpose, so let
      // it finish before listening for what is left
      GAME.test.exitCar();
      await wait(3000);
      out.foot = await listen(1500);
      out.onFoot = !GAME.player.inCar;
    } finally {
      AudioNode.prototype.connect = connect0;
      unspy.forEach(function (undo) { undo(); });
      delete ac.createOscillator;
      delete ac.createBufferSource;
      GAME.timeScale = ts0;
      a.setMusicOn(music0);
      if (a.muted !== mute0) a.toggleMute();
      if (GAME.player.inCar) GAME.test.exitCar();
      if (car) GAME.vehicles.removeCar(car);
    }
    ['driving', 'musicOff', 'muted', 'back', 'foot'].forEach(function (k) { if (out[k]) delete out[k].starts; });
    return out;
  });
  function windows(key) {
    return ['driving', 'musicOff', 'muted', 'back', 'foot'].map(function (k) {
      return k + '=' + (tap[k] ? tap[k][key] : '?');
    }).join(' ');
  }
  check('radio: the audio clock is running (anchor sanity)', tap.running, 'state=' + tap.state);
  check('radio: a UI blip drains to exactly one bus (anchor sanity)', tap.running && tap.sinks === 1, 'sinks=' + tap.sinks);
  check('radio: behind the wheel it plays (anchor sanity)',
    tap.running && tap.inCar && tap.driving.voices > 0, 'in car=' + tap.inCar + ' ' + windows('voices'));
  check('radio: nothing a station plays reaches the effects bus',
    tap.running && ['driving', 'musicOff', 'muted', 'back', 'foot'].every(function (k) { return tap[k].intoSfx === 0; }),
    windows('intoSfx'));
  check('radio: out of the car it builds no voices at all',
    tap.running && tap.onFoot && tap.foot.voices === 0, 'on foot=' + tap.onFoot + ' voices=' + (tap.foot && tap.foot.voices));
  check('radio: MUSIC: OFF and mute build none either',
    tap.running && tap.musicOff.voices === 0 && tap.muted.voices === 0, windows('voices'));
  // the guard on the fix rather than the bug: silence must not cost the beat
  check('radio: heard again, it plays on the beat it left',
    tap.running && tap.back.voices > 0 && tap.offBeat < 1e-4,
    'voices=' + (tap.back && tap.back.voices) + ' off by ' + tap.offBeat + ' of a step');

  // ---------- 5m: a controller reaches everything ----------
  // Every check drives a fake pad through controls.poll, the way the game's
  // loop does: buttons become the keys they stand for, menus get the D-pad
  // and A/B. Each evaluate puts the real getGamepads back before it returns,
  // so the page's own loop never sees the fake between them.
  var pad = await page.evaluate(function () {
    var P = GAME.player, Cs = GAME.controls, r = {};
    var fake = { connected: true, axes: [0, 0, 0, 0], buttons: [] };
    for (var i = 0; i < 17; i++) fake.buttons.push({ pressed: false, value: 0 });
    var gp0 = navigator.getGamepads;
    navigator.getGamepads = function () { return [fake]; };
    function down(b) { fake.buttons[b].pressed = true; fake.buttons[b].value = 1; Cs.poll(1 / 60); }
    function up(b) { fake.buttons[b].pressed = false; fake.buttons[b].value = 0; Cs.poll(1 / 60); }
    function tap(b) { down(b); up(b); }
    try {
      GAME.godMode = true;
      if (P.inCar) GAME.exitCar();
      GAME.police.clearWanted();
      var node = GAME.city.nearestNode(-150, 150);
      GAME.test.teleport(node.x, node.z);
      GAME.test.fastForward(0.3);
      Cs.poll(1 / 60);

      // a shop: the D-pad walks the list, A asks, A buys, B leaves. The shop
      // listened to the browser's key events, which a pad never makes.
      P.cash = 100000;
      var shop = GAME.shops.locations().filter(function (l) { return l.kind === 'hardware'; })[0];
      GAME.shops.open(shop);
      var first = GAME.shops.selected && GAME.shops.selected.name;
      tap(13);
      r.shopMoved = !!GAME.shops.selected && GAME.shops.selected.name !== first;
      var cash0 = P.cash;
      tap(0);
      tap(0);
      r.shopBought = P.cash < cash0;
      tap(1);
      r.shopClosed = !GAME.shopOpen;
      GAME.test.fastForward(0.2);

      // D-pad down on foot: the next weapon, and not Lola's menu as well
      P.weapons.pistol = { have: true, ammo: 60 };
      P.weapons.smg = { have: true, ammo: 60 };
      var w0 = P.currentWeapon;
      tap(13);
      GAME.test.fastForward(1 / 30);
      r.weaponCycled = P.currentWeapon !== w0;
      r.lolaStayedShut = !GAME.lolaOpen;
      if (GAME.lolaOpen) GAME.lola.close();

      // the prompts name the pad's buttons once it is the pad in your hands
      r.padLabel = Cs.label('KeyF');
      r.padBar = (document.getElementById('pause-controls').innerHTML || '').indexOf('LB / RB') >= 0;
      r.keyScreenStillKeys = Cs.keyLabel('KeyF');

      // the map: BACK opens it, the stick moves a cursor, A routes there,
      // RB zooms, X clears, BACK closes
      GAME.nav.clear();
      tap(8);
      r.mapOpen = !!GAME.mapOpen;
      var c0 = GAME.hud.mapCursor;
      r.cursorOnYou = !!c0 && Math.hypot(c0.x - P.pos.x, c0.z - P.pos.z) < 2;
      fake.axes = [1, 0.6, 0, 0];
      for (var k = 0; k < 40; k++) Cs.poll(1 / 60);
      fake.axes = [0, 0, 0, 0];
      Cs.poll(1 / 60);
      var c1 = GAME.hud.mapCursor;
      r.cursorMoved = !!c1 && c1.x - c0.x > 20 && c1.z - c0.z > 10;
      tap(0);
      var d = GAME.nav.dest;
      r.routed = !!d && Math.hypot(d.x - c1.x, d.z - c1.z) < 60;
      tap(5);
      r.zoomed = GAME.hud.mapZoomLevel > 1;
      tap(2);
      r.cleared = !GAME.nav.dest;
      // the D-pad steps the legend's solo through the families and back
      var solo0 = GAME.hud.mapSolo;
      tap(15);
      r.soloStepped = GAME.hud.mapSolo !== solo0 && !!GAME.hud.mapSolo;
      tap(14);
      r.soloBack = GAME.hud.mapSolo === solo0;
      for (var zi = 0; zi < 8 && GAME.hud.mapZoomLevel > 1; zi++) tap(4);
      r.zoomedOut = GAME.hud.mapZoomLevel === 1;
      tap(8);
      r.mapClosed = !GAME.mapOpen;

      // the CONTROLS screen: reachable from START, the D-pad and A change a
      // setting, and B shuts it without unpausing the game beneath it
      tap(9);
      r.paused = !!GAME.paused;
      Cs.show(true);
      var inv0 = Cs.invertY;
      tap(13);          // look speed -> invert Y
      tap(0);
      r.invertToggled = Cs.invertY !== inv0;
      tap(13); tap(13); tap(13);   // invert -> fov -> reset -> close
      tap(0);
      r.ctlClosedByButton = !Cs.open;
      Cs.show(true);
      tap(1);
      r.ctlClosedByB = !Cs.open && !!GAME.paused;
      Cs.setInvertY(inv0);
      tap(9);
      r.resumed = !GAME.paused;

      // FULL SCREEN on the pause screen. A browser goes full screen only for
      // a gesture; where a pad's press is not one, the switch waits for the
      // next click, key or tap (and says so) instead of being refused, and
      // where it is one, it goes straight there.
      var fsCalls = 0, de = document.documentElement, uaFake = { isActive: false, hasBeenActive: true };
      var fsMsgs = [], fsM0 = GAME.hud.message, fsEl0 = GAME.fullscreenEl;
      // (a test's evaluate carries a gesture, so the game's own start may
      // really have gone full screen by now: this starts from windowed)
      GAME.fullscreenEl = function () { return null; };
      de.requestFullscreen = function () { fsCalls++; return Promise.reject(new TypeError('refused')); };
      Object.defineProperty(navigator, 'userActivation', { configurable: true, get: function () { return uaFake; } });
      GAME.hud.message = function (t) { fsMsgs.push(String(t)); return fsM0.apply(GAME.hud, arguments); };
      try {
        tap(9);
        // it lives in SETTINGS: open that card, as a pad would
        document.getElementById('ptab-settings').dispatchEvent(new MouseEvent('click', { bubbles: true }));
        var fsb = document.getElementById('pause-fs');
        r.fsListed = !!fsb && fsb.offsetParent !== null && /FULL SCREEN/.test(fsb.textContent);
        if (fsb) fsb.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        r.fsWaited = fsCalls === 0 && fsMsgs.some(function (t) { return /next one you make/.test(t); });
        tap(9);     // (resuming tries again too, as it always has)
        var fsBefore = fsCalls;
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyZ' }));
        window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyZ' }));
        r.fsOnNextKey = fsCalls === fsBefore + 1;
        r.fsDbg = { calls: fsCalls, msgs: fsMsgs.slice(-2) };
        GAME.fullscreenOnNextGesture(false);
        uaFake.isActive = true;
        tap(9);
        var fsBefore2 = fsCalls;
        if (fsb) fsb.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        r.fsStraight = fsCalls === fsBefore2 + 1;
        tap(9);
      } finally {
        delete de.requestFullscreen;
        delete navigator.userActivation;
        GAME.hud.message = fsM0;
        GAME.fullscreenEl = fsEl0;
        GAME.fullscreenOnNextGesture(false);
      }

      // a dialog in the world: A answers it
      var okd = false;
      GAME.hud.dialog({ title: 'CHECK', body: 'pad', ok: 'OK', cancel: false, onOk: function () { okd = true; } });
      tap(0);
      r.dialogAnswered = okd && !GAME.hud.dialogOpen();

      // a held button lets go of the key it pressed: A held as the jump
      // through a pause and back used to come up as Enter, Space stuck down
      down(0);
      r.spaceHeld = !!GAME.input.keys.Space;
      tap(9);
      up(0);
      r.spaceLetGo = !GAME.input.keys.Space;
      tap(9);
      r.resumedAgain = !GAME.paused;

      // the TALON's guns: RB the chin gun, LB the rockets (the triggers fly it)
      var gs = GAME.test.spawnCar('gunship', 6, 0);
      GAME.seatInCar(gs);
      gs.mgT = 0; gs.rkT = 0;
      down(5);
      GAME.test.fastForward(1 / 30);
      r.chinGun = gs.mgT > 0;
      up(5);
      down(4);
      GAME.test.fastForward(1 / 30);
      r.rockets = gs.rkT > 0;
      up(4);
      GAME.test.fastForward(0.1);
      r.lmbLetGo = !GAME.input.lmb && !GAME.input.rmb;
      GAME.exitCar();
      GAME.vehicles.removeCar(gs);
      GAME.police.clearWanted();
      GAME.test.fastForward(0.3);

      // a touchscreen's barrel roll (⟲ / ⟳), which Q/E and the bumpers had
      // and it did not: the same flags the touch buttons set
      var Tt = GAME.input.touch, act0 = Tt.active;
      var pl = GAME.test.spawnCar('airplane', 6, 0);
      GAME.seatInCar(pl);
      function rolled(flag) {
        pl.pos.y = 120; pl.speed = 50; pl.vy = 0; pl.pitch = 0; pl.roll = 0;
        Tt.active = true; Tt[flag] = true;
        GAME.test.fastForward(0.25);
        Tt[flag] = false; Tt.active = act0;
        return pl.roll;
      }
      r.rollLeft = rolled('rollL');
      r.rollRight = rolled('rollR');
      // set down before stepping out: at 120 m that is a bail-out
      pl.pos.y = GAME.city.groundY(pl.pos.x, pl.pos.z); pl.speed = 0; pl.vy = 0; pl.roll = 0;
      GAME.exitCar();
      GAME.vehicles.removeCar(pl);
      GAME.test.fastForward(0.2);

      // WASTED: A carries on, as R does, well before the six seconds run out
      GAME.godMode = false;
      GAME.playerWasted('test');
      GAME.test.fastForward(0.8);
      down(0);
      GAME.test.fastForward(1 / 30);
      r.continued = !!P.respawnQueued && P.stateT < 6;
      up(0);
      r.keyRLetGo = !GAME.input.keys.KeyR;
    } finally {
      navigator.getGamepads = gp0;
      Cs.poll(1 / 60);
      if (GAME.shopOpen) GAME.shops.close();
      if (GAME.mapOpen) GAME.hud.toggleMap(false);
      if (Cs.open) Cs.show(false);
      if (GAME.paused) GAME.togglePause();
    }
    return r;
  });
  try {
    await page.waitForFunction(function () { return GAME.player.state === 'alive'; }, null, { timeout: 10000 });
  } catch (e) { /* reported below */ }
  var padAfter = await page.evaluate(function () {
    var Cs = GAME.controls, r = {};
    // and the keyboard back in hand: the prompts say keys again
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyZ' }));
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyZ' }));
    r.keyLabel = Cs.label('KeyF');
    r.alive = GAME.player.state === 'alive';
    GAME.godMode = false;
    return r;
  });
  check('pad: a shop list moves on the D-pad', pad.shopMoved, JSON.stringify(pad));
  check('pad: A asks and A buys', pad.shopBought);
  check('pad: B leaves the shop', pad.shopClosed);
  check('pad: D-pad down changes weapon', pad.weaponCycled);
  check('pad: and does not open Lola as well', pad.lolaStayedShut);
  check('pad: prompts name the pad\'s buttons', pad.padLabel === 'Y' && pad.padBar, 'F is "' + pad.padLabel + '"');
  check('pad: while the rebinding screen still lists keys', pad.keyScreenStillKeys === 'F', pad.keyScreenStillKeys);
  check('pad: BACK opens the map with a cursor on you', pad.mapOpen && pad.cursorOnYou);
  check('pad: the stick moves the cursor', pad.cursorMoved);
  check('pad: A sets the route at the cursor', pad.routed);
  check('pad: RB zooms the map in, LB out, and X clears the route', pad.zoomed && pad.zoomedOut && pad.cleared);
  check('pad: the D-pad shows one kind of marker on the map, and all again', pad.soloStepped && pad.soloBack);
  check('pad: BACK closes the map it opened', pad.mapClosed);
  check('touch: ⟲ and ⟳ barrel-roll the plane, opposite ways', pad.rollLeft > 0.3 && pad.rollRight < -0.3,
    'left ' + (pad.rollLeft && pad.rollLeft.toFixed(2)) + ', right ' + (pad.rollRight && pad.rollRight.toFixed(2)));
  check('pad: the CONTROLS screen changes a setting from the pad', pad.paused && pad.invertToggled);
  check('pad: and closes on its CLOSE button or B, leaving the game paused', pad.ctlClosedByButton && pad.ctlClosedByB);
  check('pad: FULL SCREEN is on the pause screen', pad.fsListed);
  check('pad: where a pad press is no gesture, it waits for the next key, click or tap', pad.fsWaited && pad.fsOnNextKey, JSON.stringify(pad.fsDbg));
  check('pad: where it is one, it goes straight to full screen', pad.fsStraight, JSON.stringify(pad.fsDbg));
  check('pad: A answers a dialog in the world', pad.dialogAnswered);
  check('pad: a button held through a pause lets go of its own key', pad.spaceHeld && pad.spaceLetGo && pad.resumedAgain);
  check('pad: the TALON fires its chin gun on RB and rockets on LB', pad.chinGun && pad.rockets && pad.lmbLetGo);
  check('pad: A carries on from WASTED', pad.continued && pad.keyRLetGo);
  check('pad: back on the keyboard the prompts say keys', padAfter.keyLabel === 'F' && padAfter.alive, JSON.stringify(padAfter));

  // ---------- 5n: Gran Rosa Motors walked into, your race watched, the beach's edge ----------
  // The showroom's front is all glass, and its inside was a room out in
  // the fog: look back at the glass from in there and it was a wall. Now
  // the hall is walked into where it stands. The street is through the
  // glass, every machine on the price list that runs on wheels is on the
  // floor, the two helicopters are on the roof, and stairs go up to them.
  // None of it can be driven.
  var gr = await page.evaluate(function () {
    var P = GAME.player, S = GAME.shops, I = GAME.interiors, r = {};
    if (P.inCar) GAME.exitCar();
    GAME.police.clearWanted();
    if (S.isOpen) S.close();
    function ff(t) { GAME.test.fastForward(t); }
    function walkTo(x, z, maxT) {
      for (var w = 0; w < (maxT || 10); w += 1 / 60) {
        var dx = x - P.pos.x, dz = z - P.pos.z;
        if (dx * dx + dz * dz < 0.2 || GAME.shopOpen) break;
        P.heading = Math.atan2(dx, dz); GAME.cam.yaw = P.heading;
        GAME.test.pressKey('KeyW', true);
        ff(1 / 60);
      }
      GAME.test.pressKey('KeyW', false);
      ff(0.3);
    }
    var H = S.hall(), loc = S.locations().filter(function (l) { return l.id === 'showroom0'; })[0];
    if (!H || !loc) return { missing: true };
    function inside(x, z) { return x > H.minX && x < H.maxX && z > H.minZ && z < H.maxZ; }
    r.noRoom = !I.enterable(loc) && !I.rooms().some(function (rm) { return rm.id === 'showroom0'; });
    r.matInside = inside(loc.at.x, loc.at.z);
    // the sale list, read off the counter
    S.open(loc);
    var ids = [], seen = {};
    for (var k = 0; k < 20 && S.selected && !seen[S.selected.id]; k++) {
      seen[S.selected.id] = true; ids.push(S.selected.id);
      S.key('ArrowDown');
    }
    S.close(); ff(0.2);
    var T = GAME.vehicles.TYPES;
    r.landForSale = ids.filter(function (id) { return T[id] && !T[id].heli; }).sort().join(',');
    r.airForSale = ids.filter(function (id) { return T[id] && T[id].heli; }).sort().join(',');
    var stock = S.hallStock();
    r.floor = stock.filter(function (s) { return !s.roof; }).map(function (s) { return s.type; }).sort().join(',');
    r.roof = stock.filter(function (s) { return s.roof; }).map(function (s) { return s.type; }).sort().join(',');
    r.floorInside = stock.every(function (s) { return inside(s.x, s.z) && s.mesh.position.y < (s.roof ? H.roof + 0.5 : H.under - 2) && (s.roof ? s.mesh.position.y > H.roof - 0.1 : true); });
    // nothing on display is a vehicle in the world
    r.notCars = stock.every(function (s) { return GAME.world.cars.every(function (c) { return c.mesh !== s.mesh; }); });
    // the hall's own frame: `a` along the glass from the door, `b` in from it
    var d = H.door, n = H.inward;
    function at(a, b) { return { x: d.x + n.z * a + n.x * b, z: d.z - n.x * a + n.z * b }; }
    function go(a, b, maxT) { var q = at(a, b); walkTo(q.x, q.z, maxT); }
    var st = H.stairs, sa = (st.x - d.x) * n.z - (st.z - d.z) * n.x;
    // the glass: the street sees in (and the law with it); the side wall does not
    var o1 = at(-4, -12), o2 = at(-4, 3);
    r.seeThrough = GAME.city.hash.segmentClear(o1.x, o1.z, o2.x, o2.z, 1.5);
    var mx = (H.minX + H.maxX) / 2, mz = (H.minZ + H.maxZ) / 2;
    r.wallBlocks = !GAME.city.hash.segmentClear(mx, mz, mx + n.z * 30, mz - n.x * 30, 1.5);
    // in through the doors, which part as you come and close behind you
    var o3 = at(0, -7);
    GAME.test.teleport(o3.x, o3.z); ff(0.5);
    r.shutAtFirst = S.hallDoor() < 0.05;
    go(0, -1.2);
    r.openAtDoor = S.hallDoor() > 0.9;
    go(0, 4);
    r.walkedIn = I.hall() === H && inside(P.pos.x, P.pos.z) && Math.abs(P.pos.y - H.floor) < 0.3 && !I.current && !P.interior;
    r.sheltered = I.sheltered();
    r.ceiling = I.ceiling(P.pos.x, P.pos.z);
    go(0, 9);
    ff(1.5);
    r.shutBehind = S.hallDoor() < 0.05;
    // at the sales desk, the counter is the shop
    walkTo(loc.at.x, loc.at.z);
    r.desk = GAME.shopOpen && S.current === loc;
    if (S.isOpen) S.close();
    ff(0.3);
    // and F beside the stock gets you nowhere
    var mono = stock.filter(function (s) { return s.type === 'monster'; })[0];
    if (mono) {
      walkTo(mono.x - n.x * 4.2, mono.z - n.z * 4.2, 8);
      GAME.test.pressKey('KeyF', true); ff(0.1); GAME.test.pressKey('KeyF', false); ff(1.0);
      r.fNoCar = !P.inCar && !P.entering;
    }
    // up the stairs to the roof, at a walk
    var hp0 = P.health;
    go(sa - 3, 1.5, 14);
    walkTo(st.x, st.z);
    for (var t = 0; t < 14 && P.pos.y < H.roof - 0.05; t += 1 / 60) {
      P.heading = Math.atan2(st.topX - P.pos.x, st.topZ - P.pos.z); GAME.cam.yaw = P.heading;
      GAME.test.pressKey('KeyW', true); ff(1 / 60);
    }
    GAME.test.pressKey('KeyW', false); ff(0.3);
    r.climbed = P.pos.y > H.roof - 0.1;
    // across the roof behind the helicopters, to over the sales desk: no
    // shop up here
    walkTo(st.topX, st.topZ);
    var top = (st.topX - d.x) * n.x + (st.topZ - d.z) * n.z;
    go(sa - 3, top);
    go(0, 13.6);
    walkTo(loc.at.x, loc.at.z);
    r.roofWalk = Math.abs(P.pos.y - H.roof) < 0.1 && inside(P.pos.x, P.pos.z) && Math.hypot(P.pos.x - loc.at.x, P.pos.z - loc.at.z) < 1.5;
    r.noShopOnRoof = !GAME.shopOpen;
    r.roofCam = I.camFloor(P.pos.x, P.pos.z) === H.roof + 0.45 && I.ceiling(P.pos.x, P.pos.z) === null && !I.sheltered();
    // F by the TALON does not fly it away either
    var gun = stock.filter(function (s) { return s.type === 'gunship'; })[0];
    if (gun) {
      var ga = (gun.x - d.x) * n.z - (gun.z - d.z) * n.x, gb = (gun.x - d.x) * n.x + (gun.z - d.z) * n.z;
      go(0, gb - 3.7); go(ga, gb - 3.7);
      r.byTalon = Math.hypot(P.pos.x - gun.x, P.pos.z - gun.z) < 4.2;
      GAME.test.pressKey('KeyF', true); ff(0.1); GAME.test.pressKey('KeyF', false); ff(1.0);
      r.fNoHeli = r.byTalon && !P.inCar && !P.entering && Math.abs(P.pos.y - H.roof) < 0.1;
    }
    // the parapet holds: walk at the street side and stay up
    go(0, 2.5); go(0, -3, 4);
    r.parapet = Math.abs(P.pos.y - H.roof) < 0.1 && inside(P.pos.x, P.pos.z);
    // and back down the way you came
    go(sa - 3, 2); go(sa - 3, top); walkTo(st.topX, st.topZ);
    for (var t2 = 0; t2 < 14 && P.pos.y > H.floor + 0.05; t2 += 1 / 60) {
      P.heading = Math.atan2(st.x - P.pos.x, st.z - P.pos.z); GAME.cam.yaw = P.heading;
      GAME.test.pressKey('KeyW', true); ff(1 / 60);
    }
    GAME.test.pressKey('KeyW', false); ff(0.5);
    r.down = Math.abs(P.pos.y - H.floor) < 0.1 && inside(P.pos.x, P.pos.z);
    r.unhurt = P.health >= hp0 && P.state === 'alive';
    return r;
  });
  check('showroom: Gran Rosa Motors has no room out in the fog, and its desk is in the hall', gr.noRoom && gr.matInside, JSON.stringify(gr));
  check('showroom: every machine on the price list that runs on wheels is on the floor',
    !!gr.landForSale && gr.floor === gr.landForSale, gr.floor + ' / for sale: ' + gr.landForSale);
  check('showroom: and both helicopters are up on the roof', !!gr.airForSale && gr.roof === gr.airForSale && gr.floorInside, gr.roof + ' / for sale: ' + gr.airForSale);
  check('showroom: none of it is a vehicle you can take', gr.notCars && gr.fNoCar && gr.fNoHeli, JSON.stringify({ notCars: gr.notCars, f: gr.fNoCar, heli: gr.fNoHeli }));
  check('showroom: the street is through the glass, and the side wall is a wall', gr.seeThrough && gr.wallBlocks);
  check('showroom: the doors part as you come up and close behind you', gr.shutAtFirst && gr.openAtDoor && gr.shutBehind);
  check('showroom: you walk in where it stands, under its roof', gr.walkedIn && gr.sheltered && gr.ceiling !== null && gr.ceiling < 9);
  check('showroom: the sales desk is the counter', gr.desk);
  check('showroom: the stairs go up to the roof', gr.climbed);
  check('showroom: up there it is a roof — walked across, over the desk without its menu, the camera kept above it', gr.roofWalk && gr.noShopOnRoof && gr.roofCam);
  check('showroom: the parapet holds, and the stairs bring you back down unhurt', gr.parapet && gr.down && gr.unhurt);

  // Gull Downs: with money down you watched your race from wherever you
  // liked — the bar, the door, the street — and a race ran on for nobody.
  // Now you stand at the terminal facing the big screen until the result is
  // in; the jump key skips ahead, and then you are your own again.
  var gh = await page.evaluate(function () {
    var P = GAME.player, I = GAME.interiors, S = GAME.shops, D = GAME.derby, r = {};
    function ff(t) { GAME.test.fastForward(t); }
    function walkTo(x, z, maxT) {
      for (var w = 0; w < (maxT || 8); w += 1 / 60) {
        var dx = x - P.pos.x, dz = z - P.pos.z;
        if (dx * dx + dz * dz < 0.2 || I.busy || GAME.shopOpen) break;
        P.heading = Math.atan2(dx, dz); GAME.cam.yaw = P.heading;
        GAME.test.pressKey('KeyW', true);
        ff(1 / 60);
      }
      GAME.test.pressKey('KeyW', false);
      ff(0.3);
    }
    function moved(keys, t) {
      var x0 = P.pos.x, z0 = P.pos.z;
      keys.forEach(function (k) { GAME.test.pressKey(k, true); });
      ff(t);
      keys.forEach(function (k) { GAME.test.pressKey(k, false); });
      ff(0.2);
      return Math.hypot(P.pos.x - x0, P.pos.z - z0);
    }
    if (P.inCar) GAME.exitCar();
    if (S.isOpen) S.close();
    for (var up = 0; up < 20 && P.state !== 'alive'; up++) GAME.test.fastForward(0.5);
    if (P.inCar) GAME.exitCar();
    if (I.current) { I.leave(); GAME.test.fastForward(1.2); }
    GAME.police.clearWanted();
    var cas = S.locations().filter(function (l) { return l.kind === 'casino'; })[0];
    GAME.test.teleport(cas.at.x + 8, cas.at.z); ff(0.4);
    walkTo(cas.at.x, cas.at.z); ff(0.5);
    var room = I.current;
    r.inside = !!room && room.kind === 'casino';
    if (!r.inside) return r;
    for (var k = 0; k < 60 && D.bet; k++) ff(1);
    var ring = room.rings.filter(function (x) { return /GULL DOWNS/.test(x.label); })[0];
    walkTo(ring.x - 2.5, ring.z); walkTo(ring.x, ring.z);
    r.opens = GAME.shopOpen && S.current && S.current.kind === 'derby';
    P.cash = Math.max(P.cash, 5000);
    S.buy('horse1');
    ff(0.1);
    r.held = !!D.bet && D.holding && !GAME.shopOpen;
    var sc = room.screen, want = Math.atan2(sc.x - P.pos.x, sc.z - P.pos.z);
    r.facing = Math.abs(Math.atan2(Math.sin(P.heading - want), Math.cos(P.heading - want))) < 0.05;
    r.stays = moved(['KeyW', 'KeyA', 'ShiftLeft'], 2) < 0.05 && P.pos.y < 0.3;
    r.hint = (document.getElementById('poi-hint').textContent || '').slice(0, 60);
    // the jump key skips ahead — to the off, then over the line
    for (k = 0; k < 12 && D.bet; k++) { GAME.test.pressKey('Space', true); ff(0.15); GAME.test.pressKey('Space', false); ff(0.15); }
    r.skipped = !D.bet && k < 12;
    r.readResult = D.holding;
    ff(3);
    r.free = !D.holding;
    r.walks = moved(['KeyS'], 1) > 1;
    I.leave(); ff(1.2);
    return r;
  });
  check('Gull Downs: with money down you stand at the terminal, facing the screen', gh.inside && gh.opens && gh.held && gh.facing && gh.stays, JSON.stringify(gh));
  check('Gull Downs: the screen says it is your race, and the jump key skips ahead', /YOUR RACE/.test(gh.hint) && gh.skipped, JSON.stringify(gh));
  check('Gull Downs: the result is read, and then you can walk again', gh.readResult && gh.free && gh.walks, JSON.stringify(gh));

  // The beach ended at the water in a sheer face, half a metre of it out of
  // the sea: from a boat the whole strip was a wall. It shelves in now.
  var bank = await page.evaluate(function () {
    var b = GAME.city.beachBank;
    return b ? { top: b.top, toe: b.toe, run: b.back + b.out, sea: GAME.city.seaLevel } : null;
  });
  check('beach: the sand shelves into the sea instead of standing out of it as a wall',
    !!bank && bank.run / (bank.top - bank.toe) >= 2 && bank.toe < bank.sea - 0.5, JSON.stringify(bank));

  // ---------- 5o: the lift's doors, island boosters, one too many, the gun comes up ----------
  // The glass lift was a box with no doors: step on the ring and you were in
  // it. Now each stop has doors, the car's and the landing's, that part as
  // you come, shut for the ride and open at the other end — and a car that
  // is not at your stop comes to you.
  var ld = await page.evaluate(function () {
    var P = GAME.player, I = GAME.interiors, L = GAME.city.towerLift, r = {};
    function ff(t) { GAME.test.fastForward(t); }
    function walkTo(x, z, maxT) {
      for (var w = 0; w < (maxT || 6) && !I.riding(); w += 1 / 60) {
        var dx = x - P.pos.x, dz = z - P.pos.z;
        if (dx * dx + dz * dz < 0.15) break;
        P.heading = Math.atan2(dx, dz); GAME.cam.yaw = P.heading; GAME.test.pressKey('KeyW', true); ff(1 / 60);
      }
      GAME.test.pressKey('KeyW', false);
    }
    if (P.inCar) GAME.exitCar();
    GAME.police.clearWanted();
    if (!L || !L.doors) return { missing: true };
    // the car waits up top: walking up to the street doors calls it down
    L.cab.position.y = L.shaft.top;
    GAME.test.teleport(L.street.x, L.street.z + 9); ff(0.3);
    GAME.world.peds.slice().forEach(function (p) { if (Math.hypot(p.pos.x - L.street.x, p.pos.z - L.street.z) < 12) GAME.peds.removePed(p); });
    r.shutWhileAway = I.liftDoors().street === 0 && I.liftDoors().roof === 0;
    for (var k = 0; k < 12 && Math.abs(L.cab.position.y - 0.02) > 0.05; k++) ff(1);
    r.cameDown = Math.abs(L.cab.position.y - 0.02) < 0.05;
    walkTo(L.street.x, L.street.z + 2.2); ff(1);
    var D = L.doors.street;
    r.openAtDoor = I.liftDoors().street === 1 && Math.abs(D.cab.m.position.x - D.cab.x1) < 0.01 && Math.abs(D.landing.m.position.x - D.landing.x1) < 0.01;
    // step on: they shut before the car moves
    walkTo(L.street.x, L.street.z);
    r.riding = I.riding();
    ff(0.8);
    r.shutForRide = I.liftDoors().street === 0 && L.cab.position.y < 0.2;
    for (k = 0; k < 15 && I.riding(); k++) ff(1);
    r.openOnRoof = !I.riding() && P.pos.y > 70 && I.liftDoors().roof > 0.5;
    // walk off, and they close behind you
    walkTo(L.roof.out.x, L.roof.out.z - 7);
    ff(1.2);
    r.shutBehind = I.liftDoors().roof === 0;
    return r;
  });
  check('lift: its doors stay shut with nobody about, and the car comes to the stop you walk up to', ld.shutWhileAway && ld.cameDown, JSON.stringify(ld));
  check('lift: the doors open as you come to them', ld.openAtDoor, JSON.stringify(ld));
  check('lift: and shut before the ride sets off', ld.riding && ld.shutForRide, JSON.stringify(ld));
  check('lift: up top they open onto the roof, and shut behind you as you walk off', ld.openOnRoof && ld.shutBehind, JSON.stringify(ld));

  // Every jump on Isla Verde was a plain ramp. A third of them are boosters
  // now — picked from where the jumps already were, for a long, level, dry
  // run-out — and capped, so the landing is somewhere that was looked at.
  var ib = await page.evaluate(function () {
    var P = GAME.player, C = GAME.city, S = GAME.settings, r = {};
    var wasOpen = GAME.isla.isOpen();
    GAME.isla.setOpen(true);
    var keep = { t: S.maxTraffic, p: S.maxParked };
    S.maxTraffic = 0; S.maxParked = 0;
    var isla = C.ramps.filter(function (q) { return q.isla; });
    var boosts = isla.filter(function (q) { return q.boost; });
    r.ramps = isla.length; r.boosters = boosts.length;
    r.capped = boosts.every(function (q) { return q.cap > 30 && q.capUp; });
    function run(ramp, type) {
      if (P.inCar) GAME.exitCar();
      P.health = 100; GAME.police.clearWanted();
      var ux = Math.sin(ramp.rot), uz = Math.cos(ramp.rot);
      var sx = ramp.x - ux * (ramp.len / 2 + 30), sz = ramp.z - uz * (ramp.len / 2 + 30);
      GAME.test.teleport(sx - uz * 4, sz + ux * 4);
      GAME.world.cars.slice().forEach(function (c) { if (U.dist2(c.pos.x, c.pos.z, ramp.x, ramp.z) < 250 * 250) GAME.vehicles.removeCar(c); });
      var car = GAME.vehicles.spawnCar(type, sx, sz, ramp.rot, {});
      car.pos.y = C.groundY(sx, sz);
      GAME.test.enterNearestCar(car);
      GAME.test.fastForward(0.7);
      var o = { type: type };
      if (!P.inCar) { GAME.vehicles.removeCar(car); return o; }
      car.speed = car.spec.maxSpeed * 0.7;
      o.arrive = +car.speed.toFixed(1);
      var lipX = ramp.x + ux * ramp.len / 2, lipZ = ramp.z + uz * ramp.len / 2, wasDeck = false;
      for (var i = 0; i < 60 * 9; i++) {
        var deck = car.onRampIdx === ramp.idx && !(car.air > 0.05);
        GAME.test.pressKey('KeyW', true);
        GAME.test.fastForward(1 / 60);
        if (deck) wasDeck = true;
        if (car.sinking || (!wasDeck && i > 300)) break;
        if (wasDeck && o.lip === undefined && car.air > 0) o.lip = +Math.hypot(car.airVX, car.airVZ).toFixed(1);
        if (o.lip !== undefined && o.dist === undefined && !(car.air > 0)) {
          o.dist = +Math.hypot(car.pos.x - lipX, car.pos.z - lipZ).toFixed(1);
          GAME.test.pressKey('KeyW', false);
          GAME.test.pressKey('KeyS', true);
          GAME.test.fastForward(2.5);
          GAME.test.pressKey('KeyS', false);
          break;
        }
      }
      GAME.test.pressKey('KeyW', false);
      o.stillIn = P.inCar; o.alive = P.state === 'alive'; o.dry = !car.sinking && !C.isInWater(car.pos.x, car.pos.z);
      if (P.inCar) GAME.exitCar();
      GAME.vehicles.removeCar(car);
      return o;
    }
    if (boosts.length) {
      r.sedan = run(boosts[0], 'sedan');
      r.bike = run(boosts[boosts.length - 1], 'superbike');
    }
    S.maxTraffic = keep.t; S.maxParked = keep.p;
    GAME.isla.setOpen(wasOpen);
    return r;
  });
  check('isla: a third of the island\'s jumps are boosters now, capped', ib.boosters >= 2 && ib.boosters <= Math.ceil(ib.ramps / 3) && ib.capped, JSON.stringify(ib));
  check('isla: a booster hauls a car up to its pace off the lip', !!ib.sedan && ib.sedan.lip > ib.sedan.arrive + 8, JSON.stringify(ib.sedan));
  check('isla: and leaves something already quicker alone', !!ib.bike && ib.bike.lip >= ib.bike.arrive - 1, JSON.stringify(ib.bike));
  check('isla: both come down on dry land, aboard and alive',
    !!ib.sedan && !!ib.bike && ib.sedan.dist > 20 && ib.sedan.stillIn && ib.sedan.alive && ib.sedan.dry && ib.bike.alive && ib.bike.dry,
    JSON.stringify({ sedan: ib.sedan, bike: ib.bike }));

  // The Lucky Gull's drinks patched you up and nothing else. They add up now:
  // a few and the night swims, the bartender cuts you off near the top, and
  // it wears off.
  var dk = await page.evaluate(function () {
    var P = GAME.player, S = GAME.shops, D = GAME.drunk, r = {};
    function ff(t) { GAME.test.fastForward(t); }
    if (P.inCar) GAME.exitCar();
    GAME.police.clearWanted();
    if (!D) return { missing: true };
    D.sober();
    P.cash = Math.max(P.cash, 5000);
    // a stretch of pavement with nobody on it, to walk a straight line along
    function wander() {
      GAME.test.teleport(-150 + 7.5, 40); ff(0.4);
      GAME.world.peds.slice().forEach(function (p) { if (Math.hypot(p.pos.x - P.pos.x, p.pos.z - P.pos.z) < 30) GAME.peds.removePed(p); });
      P.heading = 0; GAME.cam.yaw = 0; ff(0.2);
      var x0 = P.pos.x, worst = 0;
      GAME.test.pressKey('KeyW', true);
      // (five seconds, more than one whole sway — the stagger is two slow
      // sines of the clock, and two and a half seconds of it could land on
      // the stretch where they cancel: 0.3 m one run, 3.4 m the next)
      for (var i = 0; i < 300; i++) { ff(1 / 60); worst = Math.max(worst, Math.abs(P.pos.x - x0)); }
      GAME.test.pressKey('KeyW', false); ff(0.3);
      return +worst.toFixed(2);
    }
    r.soberWalk = wander();
    S.open(GAME.interiors.bar);
    S.buy('cuba');
    r.one = D.level === 0;
    S.buy('punch'); S.buy('punch'); S.buy('punch');
    r.level = +D.level.toFixed(2);
    r.note = (document.getElementById('shop-note') || {}).textContent;
    S.buy('special');
    r.cut = D.cutOff && S.buy('cuba') === false && !!(S.selected && S.selected.off);
    S.close(); ff(0.3);
    r.colours = /hue-rotate/.test(GAME.renderer.domElement.style.filter);
    r.drunkWalk = wander();
    // and it wears off
    ff(60 * 7);
    r.sober = D.level === 0 && D.booze === 0 && GAME.renderer.domElement.style.filter === '';
    r.walkAfter = wander();
    return r;
  });
  check('bar: one drink is just a drink', dk.one, JSON.stringify(dk));
  check('bar: a few more and the night swims — the colours run and the walk wanders', dk.level >= 0.5 && dk.colours && dk.drunkWalk > dk.soberWalk + 0.5, JSON.stringify(dk));
  check('bar: the bartender cuts you off near the top', dk.cut, JSON.stringify(dk));
  check('bar: and it wears off', dk.sober && dk.walkAfter < 0.3, JSON.stringify(dk));

  // Fired from the hip, the shot went where the camera looked and the body
  // went on facing where it walked, arms swinging. The gun comes up now.
  var gp = await page.evaluate(function () {
    var P = GAME.player, r = {};
    function ff(t) { GAME.test.fastForward(t); }
    if (P.inCar) GAME.exitCar();
    GAME.police.clearWanted();
    GAME.test.teleport(-150 + 7.5, 40); ff(0.4);
    GAME.world.peds.slice().forEach(function (p) { if (Math.hypot(p.pos.x - P.pos.x, p.pos.z - P.pos.z) < 40) GAME.peds.removePed(p); });
    GAME.combat.giveWeapon('pistol', 30); GAME.combat.giveWeapon('smg', 60);
    var j = P.mesh.userData.joints;
    function shoot(w) {
      P.currentWeapon = w; GAME.combat.refreshWeaponHud();
      P.heading = 0; GAME.cam.yaw = Math.PI / 2; ff(0.8);
      GAME.input.lockGraceT = 0;
      GAME.input.lmb = true; GAME.input.lmbPressed = true; ff(2 / 60); GAME.input.lmb = false;
      ff(0.15);
      return { heading: +P.heading.toFixed(2), armR: +j.armR.rotation.x.toFixed(2), armL: +j.armL.rotation.x.toFixed(2) };
    }
    r.pistol = shoot('pistol');
    ff(1.2);
    r.down = +j.armR.rotation.x.toFixed(2);
    r.smg = shoot('smg');
    ff(1.2);
    P.currentWeapon = 'fist'; GAME.combat.refreshWeaponHud();
    return r;
  });
  check('guns: a shot from the hip turns you to it and brings the gun arm up', Math.abs(gp.pistol.heading - Math.PI / 2) < 0.2 && gp.pistol.armR < -1.2, JSON.stringify(gp));
  check('guns: a gun that takes two hands brings both up', gp.smg.armR < -1.2 && gp.smg.armL < -1.0, JSON.stringify(gp.smg));
  check('guns: and the arm comes down again after', gp.down > -0.5, JSON.stringify(gp));

  // The horn was a blip that died away under the engine inside a quarter of
  // a second. It sounds now for as long as it is held, a tap still gives a
  // proper beep, the engine dips under it, and it lets go when you get out.
  var hn = await page.evaluate(async function () {
    var P = GAME.player, V = GAME.vehicles, A = GAME.audio, r = {};
    function ff(t) { GAME.test.fastForward(t); }
    function wait(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }
    if (P.inCar) GAME.exitCar();
    GAME.police.clearWanted();
    if (!A.ctx || !A.testMix) return { noAudio: true };
    if (A.ctx.state !== 'running') { try { await A.ctx.resume(); } catch (e) { } }
    if (A.ctx.state !== 'running') return { noAudio: true };
    var car = V.spawnCar('sedan', -150 + 3.1, -60, 0, {});
    GAME.seatInCar(car); ff(0.2);
    // under way, the engine as it is
    car.speed = 15; ff(1 / 60); await wait(500); ff(1 / 60);
    r.engine = A.testMix().engine;
    // lean on it: a second of horn, measured as it sounds
    GAME.test.pressKey('KeyG');
    for (var i = 0; i < 6; i++) { car.speed = 15; ff(1 / 60); await wait(150); }
    var m = A.testMix();
    r.held = { on: A.hornOn, horn: +m.horn.toFixed(3), engine: +m.engine.toFixed(4) };
    GAME.test.pressKey('KeyG', false);
    ff(1 / 60); await wait(400); ff(1 / 60);
    r.released = { on: A.hornOn, horn: +A.testMix().horn.toFixed(4) };
    // a tap is still a beep
    GAME.test.pressKey('KeyG'); ff(1 / 60); GAME.test.pressKey('KeyG', false);
    ff(0.15); r.tap = A.hornOn; ff(0.3); r.tapEnds = !A.hornOn;
    // held as you get out: let go
    GAME.test.pressKey('KeyG'); ff(0.1);
    GAME.exitCar(); ff(0.1);
    r.exitLets = !A.hornOn;
    GAME.test.pressKey('KeyG', false);
    V.removeCar(car);
    return r;
  });
  check('horn: it sounds for as long as it is held, well over the engine, which dips under it',
    !!hn.noAudio || (hn.held.on && hn.held.horn > 0.12 && hn.held.horn > hn.held.engine * 8 && hn.held.engine < hn.engine * 0.6), JSON.stringify(hn));
  check('horn: let go, it stops; a tap is still a beep; and getting out lets go of it',
    !!hn.noAudio || (!hn.released.on && hn.released.horn < 0.02 && hn.tap && hn.tapEnds && hn.exitLets), JSON.stringify(hn));

  // All 25 jumps used to hand out unlimited ammo: early, for driving, and the
  // end of every fight after it. Their prize is the arsenal now — kept
  // through a hospital or a cell, refilled free at any hardware counter —
  // and unlimited ammo is for finishing everything (5a). A save that earned
  // it the old way keeps it.
  var ja = await page.evaluate(async function () {
    var P = GAME.player, S = GAME.shops, St = GAME.stunts, r = {};
    function ff(t) { GAME.test.fastForward(t); }
    function wait(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }
    if (P.inCar) GAME.exitCar();
    GAME.police.clearWanted();
    var keep = { stunts: JSON.stringify(GAME.prefs.stunts || null), forever: GAME.prefs.ammoForever, ammo: GAME.unlimitedAmmo,
      arsenal: GAME.jumpArsenal, weapons: JSON.stringify(P.weapons), cur: P.currentWeapon, cash: P.cash, truck: GAME.city.unlockMonsterTruck };
    GAME.city.unlockMonsterTruck = function () {};
    try {
      // a save from before: every jump found, no version on the record
      delete GAME.prefs.ammoForever;
      GAME.unlimitedAmmo = false; GAME.jumpArsenal = false;
      GAME.prefs.stunts = { found: {}, rewarded: true };
      St.load();
      r.oldSaveKeeps = GAME.prefs.ammoForever === true && GAME.unlimitedAmmo === true;
      // one that found them all under the new prize
      delete GAME.prefs.ammoForever;
      GAME.unlimitedAmmo = false; GAME.jumpArsenal = false;
      P.weapons = { fist: { have: true, ammo: Infinity } }; P.currentWeapon = 'fist';
      GAME.prefs.stunts = { found: {}, rewarded: true, v: 2 };
      St.load();
      var FL = GAME.combat.FULL_LOAD;
      r.arsenal = GAME.jumpArsenal === true && GAME.unlimitedAmmo === false && !GAME.prefs.ammoForever &&
        ['pistol', 'smg', 'shotgun', 'rifle'].every(function (w) { return P.weapons[w] && P.weapons[w].have && P.weapons[w].ammo >= FL[w] && isFinite(P.weapons[w].ammo); });
      // rounds get used up...
      P.currentWeapon = 'smg';
      var a0 = P.weapons.smg.ammo;
      GAME.test.teleport(-150 + 7.5, 40); ff(0.4);
      GAME.world.peds.slice().forEach(function (p) { if (Math.hypot(p.pos.x - P.pos.x, p.pos.z - P.pos.z) < 40) GAME.peds.removePed(p); });
      GAME.input.lockGraceT = 0;
      GAME.input.lmb = true; ff(0.5); GAME.input.lmb = false; ff(0.2);
      r.spends = P.weapons.smg.ammo < a0;
      // ...and the counter refills them for nothing
      var hw = S.locations().filter(function (l) { return l.kind === 'hardware'; })[0];
      S.open(hw);
      var c0 = P.cash, b0 = P.weapons.smg.ammo;
      var bought = S.buy('smg');
      r.refill = bought !== false && P.cash === c0 && P.weapons.smg.ammo > b0;
      S.close(); ff(0.2);
      // and a hospital bed (no home here) leaves them with you
      P.health = 100; P.armor = 0;
      GAME.playerDamage(500, 'test');
      for (var i = 0; i < 25 && P.state !== 'alive'; i++) {
        GAME.input.keys['KeyR'] = true; ff(0.7); GAME.input.keys['KeyR'] = false;
        if (P.state !== 'alive') await wait(400);
      }
      r.alive = P.state === 'alive';
      r.keptThroughHospital = !!(P.weapons.rifle && P.weapons.rifle.have && P.weapons.smg && P.weapons.smg.have);
    } finally {
      GAME.city.unlockMonsterTruck = keep.truck;
      GAME.prefs.stunts = JSON.parse(keep.stunts);
      if (keep.forever === undefined) delete GAME.prefs.ammoForever; else GAME.prefs.ammoForever = keep.forever;
      GAME.unlimitedAmmo = keep.ammo; GAME.jumpArsenal = keep.arsenal;
      if (GAME.prefs.stunts) St.load();
      GAME.unlimitedAmmo = keep.ammo; GAME.jumpArsenal = keep.arsenal;
      P.weapons = JSON.parse(keep.weapons, function (k, v) { return k === 'ammo' && v === null ? Infinity : v; });
      P.currentWeapon = keep.cur; P.cash = keep.cash;
      GAME.combat.refreshWeaponHud(); GAME.hud.cashChanged();
    }
    return r;
  });
  check('jumps: a save that earned unlimited ammo from them keeps it', ja.oldSaveKeeps, JSON.stringify(ja));
  check('jumps: now they give the full arsenal, with ammo that runs out', ja.arsenal && ja.spends, JSON.stringify(ja));
  check('jumps: any hardware counter refills it for nothing', ja.refill, JSON.stringify(ja));
  check('jumps: and it comes back with you from the hospital', ja.alive && ja.keptThroughHospital, JSON.stringify(ja));

  // ---------- 5p: the city you hear ----------
  var amb = await page.evaluate(async function () {
    var r = {}, P = GAME.player, C = GAME.city, I = C.isla, A = GAME.audio, AM = GAME.ambience;
    var ff = function (s) { GAME.test.fastForward(s); };
    var wait = function (ms) { return new Promise(function (res) { setTimeout(res, ms); }); };
    if (!A.ctx) A.init();
    if (A.ctx.state !== 'running') { try { await A.ctx.resume(); } catch (e) { } }
    // the loudness is only measurable with sound actually running (as the
    // horn's check); everything else here reads the levels it sets
    r.noAudio = A.ctx.state !== 'running';
    var W = GAME.weather, mode0 = W.mode, time0 = GAME.timeMode, muted0 = A.muted, sfx0 = A.sfxOn;
    if (A.muted) A.toggleMute();
    A.setSfxOn(true);
    W.setMode('clear', true);
    GAME.setTimeMode('day');
    // count the ambience's one-shots by their shape
    var calls = [], n0 = A.amb.noise;
    A.amb.noise = function (dur, freq, g, type) { calls.push({ dur: dur, freq: freq, g: g, type: type }); return n0.apply(A.amb, arguments); };
    function count(fn) { return calls.filter(fn).length; }
    function clearAround(x, z, rad) {
      GAME.world.peds.slice().forEach(function (p) { if (Math.hypot(p.pos.x - x, p.pos.z - z) < rad) GAME.peds.removePed(p); });
      GAME.world.cars.slice().forEach(function (c) { if (c !== P.car && Math.hypot(c.pos.x - x, c.pos.z - z) < rad) GAME.vehicles.removeCar(c); });
    }
    var spawned = [];
    try {
      // --- out on a street: something to hear, nothing loud ---
      var rp = C.nearestRoadPoint(300, -40);
      GAME.test.teleport(rp.x, rp.z); ff(1);
      var an = A.meter(), buf = new Float32Array(an.fftSize);
      await wait(900);
      var sum = 0, peak = 0;
      for (var k = 0; k < 6; k++) {
        an.getFloatTimeDomainData(buf);
        for (var i = 0; i < buf.length; i++) { sum += buf[i] * buf[i]; peak = Math.max(peak, Math.abs(buf[i])); }
        await wait(60);
      }
      r.rms = +Math.sqrt(sum / (6 * buf.length)).toFixed(4); r.peak = +peak.toFixed(3);
      r.streetCity = AM.levels.city;

      // --- steps: none standing, a run of them walking, by surface ---
      // down the road, not into a wall
      clearAround(rp.x, rp.z, 40);
      GAME.cam.yaw = P.heading = rp.axis === 'z' ? 0 : Math.PI / 2;
      calls.length = 0; ff(1);
      r.standSteps = count(function (c) { return c.dur <= 0.11; });
      GAME.test.pressKey('KeyW', true); ff(2); GAME.test.pressKey('KeyW', false); ff(0.3);
      r.walkSteps = count(function (c) { return c.dur <= 0.11; });
      // soft soles: the loudest scuff of the walk (it was a 0.15-0.23 click)
      r.loudestStep = +Math.max.apply(null, calls.filter(function (c) { return c.dur <= 0.11; }).map(function (c) { return c.g; }).concat([0])).toFixed(3);
      // on the sand, a little way up from the water's edge
      var sand = C.shoreline(60) - 14;
      var grass = null, iroad = C.nearestRoadPoint(I.bounds.cx, I.bounds.cz);
      for (var gx = -150; gx <= 150 && !grass; gx += 10) {
        for (var gz = -150; gz <= 150 && !grass; gz += 10) {
          var x = I.bounds.cx + gx, z = I.bounds.cz + gz;
          if (I.contains(x, z) && I.inland(x, z) > 0.3 && !I.onRoad(x, z, 4)) grass = { x: x, z: z };
        }
      }
      r.surfaces = {
        road: AM.surfaceAt(rp.x, rp.z),
        sand: sand ? AM.surfaceAt(sand, 60) : 'none',
        pier: AM.surfaceAt(450, 250),
        islaGrass: grass ? AM.surfaceAt(grass.x, grass.z) : 'none',
        islaRoad: AM.surfaceAt(iroad.x, iroad.z)
      };

      // --- the surf: by the sea, and not downtown ---
      GAME.test.teleport(sand, 60); ff(1.2);
      r.beach = { surf: AM.levels.surf, water: AM.levels.water };
      GAME.test.teleport(0, -150); ff(1.2);
      r.downtown = { surf: AM.levels.surf, water: AM.levels.water };

      // --- a gull, some time in a day by the sea ---
      GAME.test.teleport(sand, 60); ff(0.5);
      var g0 = AM.levels.gull;
      for (var t = 0; t < 45 && AM.levels.gull === g0; t += 1) ff(1);
      r.gull = AM.levels.gull !== g0 && AM.levels.gull !== undefined;

      // --- a car going by on your right is heard on your right ---
      var rp2 = C.nearestRoadPoint(-150, 60);
      GAME.test.teleport(rp2.x, rp2.z); ff(0.5);
      clearAround(rp2.x, rp2.z, 70); ff(0.3);
      r.noCars = AM.levels.cars.length;
      var yaw = GAME.cam.yaw, rx = -Math.cos(yaw), rz = Math.sin(yaw);
      var car = GAME.vehicles.spawnCar('sedan', P.pos.x + rx * 8, P.pos.z + rz * 8, yaw, {});
      spawned.push(car);
      car.speed = 16; ff(0.15); car.speed = 16; ff(0.15);
      // ours is the loudest: eight metres off, at sixteen metres a second
      r.carVoice = AM.levels.cars.slice().sort(function (a, b) { return b.g - a.g; })[0] || null;
      car.speed = 0; ff(0.1);

      // --- people: a murmur only with somebody about ---
      clearAround(P.pos.x, P.pos.z, 40); ff(0.3);
      r.crowdNone = AM.levels.crowd;
      for (var q = 0; q < 6; q++) spawned.push(GAME.test.spawnPed(3 + q, (q % 2 ? 2 : -2)));
      ff(0.3);
      r.crowdSome = AM.levels.crowd;

      // --- a cabin muffles the street ---
      GAME.vehicles.removeCar(car); spawned = spawned.filter(function (x) { return x !== car; });
      var rp3 = C.nearestRoadPoint(300, -40);
      GAME.test.teleport(rp3.x, rp3.z); ff(1);
      var footCity = AM.levels.city;
      var ride = GAME.test.spawnCar('sedan', 3, 0); spawned.push(ride);
      ff(0.2); GAME.test.enterNearestCar(ride); ff(1.5);
      r.cabin = { foot: footCity, car: AM.levels.city, inCar: P.inCar };
      GAME.test.exitCar(); ff(0.6);

      // --- a room: the street is through a wall ---
      var hw = GAME.shops.locations().filter(function (l) { return l.kind === 'hardware'; })[0];
      GAME.test.teleport(hw.at.x + 6, hw.at.z); ff(0.4);
      GAME.interiors.enter(hw); ff(1.2);
      r.room = { inside: !!P.interior, city: AM.levels.city, surf: AM.levels.surf, cars: AM.levels.cars.length };
      GAME.interiors.reset(); ff(0.3);

      // --- a swim: strokes going, lapping treading water ---
      GAME.test.teleport(560, 20); ff(1);
      r.swimming = P.swimming;
      calls.length = 0;
      GAME.test.pressKey('KeyW', true); ff(3); GAME.test.pressKey('KeyW', false);
      r.strokes = count(function (c) { return c.dur === 0.3; });
      // a lap every 1.4 to 2.6 s: seven seconds holds at least two
      ff(1.5); calls.length = 0; ff(7);
      r.laps = count(function (c) { return c.dur === 0.6; });
      r.swimStrokesWhileTreading = count(function (c) { return c.dur === 0.3; });
      GAME.test.teleport(rp.x, rp.z); ff(0.8);

      // --- crickets: the island at night, off the road; none by day ---
      var wasOpen = GAME.isla.isOpen(); GAME.isla.setOpen(true);
      GAME.test.teleport(grass.x, grass.z); ff(0.5);
      clearAround(grass.x, grass.z, 160);
      GAME.setTimeMode('day'); ff(0.4);
      var dayCrick = AM.levels.crickets;
      GAME.setTimeMode('night'); ff(0.4);
      r.crickets = { day: dayCrick, night: AM.levels.crickets };
      GAME.isla.setOpen(wasOpen);
      GAME.setTimeMode('day');
      GAME.test.teleport(rp.x, rp.z); ff(0.8);

      // --- an overlay silences it, and play brings it back ---
      GAME.togglePause();
      r.pausedSilent = AM.levels.silent === true;
      GAME.togglePause(); ff(0.3);
      r.back = AM.levels.city > 0;
    } finally {
      A.amb.noise = n0;
      spawned.forEach(function (x) { try { if (x.spec) GAME.vehicles.removeCar(x); else GAME.peds.removePed(x); } catch (e) { } });
      if (P.inCar) GAME.test.exitCar();
      GAME.setTimeMode(time0);
      W.setMode(mode0, true);
      A.setSfxOn(sfx0);
      if (A.muted !== muted0) A.toggleMute();
    }
    return r;
  });
  check('sound: on foot in the street the speakers are not silent, and not loud',
    amb.noAudio ? amb.streetCity > 0.01 : amb.rms > 0.002 && amb.rms < 0.05 && amb.peak < 0.5,
    JSON.stringify({ rms: amb.rms, peak: amb.peak, city: amb.streetCity, noAudio: amb.noAudio }));
  check('sound: standing still makes no steps, walking makes a run of them',
    amb.standSteps === 0 && amb.walkSteps >= 4, 'stand=' + amb.standSteps + ' walk=' + amb.walkSteps);
  check('sound: footsteps are soft, not tap shoes', amb.loudestStep > 0 && amb.loudestStep < 0.08, 'loudest step ' + amb.loudestStep);
  check('sound: a step sounds of what is underfoot', JSON.stringify(amb.surfaces) ===
    JSON.stringify({ road: 'hard', sand: 'sand', pier: 'wood', islaGrass: 'grass', islaRoad: 'hard' }), JSON.stringify(amb.surfaces));
  check('sound: the surf is there on the beach, and gone downtown',
    amb.beach.surf > 0.05 && amb.downtown.surf === 0, JSON.stringify({ beach: amb.beach, downtown: amb.downtown }));
  check('sound: a day by the sea has a gull in it', amb.gull);
  check('sound: a car going by on your right is a voice on your right',
    amb.carVoice && amb.carVoice.g > 0.02 && amb.carVoice.pan > 0.2, JSON.stringify({ before: amb.noCars, car: amb.carVoice }));
  check('sound: people murmur only when there are people about',
    amb.crowdNone === 0 && amb.crowdSome > 0.015, 'nobody=' + amb.crowdNone + ' six close=' + amb.crowdSome);
  check('sound: a car\'s cabin muffles the street', amb.cabin.inCar && amb.cabin.car < amb.cabin.foot * 0.7, JSON.stringify(amb.cabin));
  // (against the street as it was a moment before, which is louder by day
  // and with traffic moving: at its quietest — night, an empty road — it is
  // still about twice a room's, so the line is six tenths of it, not three, which
  // a quiet night failed on)
  check('sound: a room keeps the street out, and the sea and the traffic',
    amb.room.inside && amb.room.city < amb.cabin.foot * 0.6 && amb.room.surf === 0 && amb.room.cars === 0,
    JSON.stringify({ room: amb.room, street: amb.cabin.foot }));
  check('sound: a swim strokes, and treading water laps',
    amb.swimming && amb.strokes >= 3 && amb.laps >= 2 && amb.swimStrokesWhileTreading === 0,
    JSON.stringify({ swimming: amb.swimming, strokes: amb.strokes, laps: amb.laps, treadingStrokes: amb.swimStrokesWhileTreading }));
  check('sound: crickets on the island at night, none by day', amb.crickets.day === 0 && amb.crickets.night > 0.001, JSON.stringify(amb.crickets));
  check('sound: pause silences the city, and play brings it back', amb.pausedSilent && amb.back);

  // ---------- 5q: Lola's first day ----------
  var gd = await page.evaluate(async function () {
    var r = {}, P = GAME.player, G = GAME.guide, L = GAME.lola, M = GAME.missions, S = GAME.shops, C = GAME.city;
    var ff = function (s) { GAME.test.fastForward(s); };
    var keepPrefs = JSON.stringify(GAME.prefs), keepBests = JSON.stringify(GAME.bests || {}), keepCash = P.cash, keepTouch = GAME.isTouch;
    // a new save's island is shut (groups above may have opened it)
    var keepIsla = GAME.isla.isOpen();
    GAME.isla.setOpen(false);
    var pages = [], msgs = [], pg0 = GAME.hud.pager, ms0 = GAME.hud.message;
    GAME.hud.pager = function (f, t) { pages.push(String(t)); return pg0.apply(GAME.hud, arguments); };
    GAME.hud.message = function (t) { msgs.push(String(t)); return ms0.apply(GAME.hud, arguments); };
    function hud() { return document.getElementById('mission-hud').style.display === 'none' ? '' : document.getElementById('mission-obj').textContent; }
    var courier = M.DEFS.filter(function (d) { return d.id === 'courier2'; })[0];
    var barber = S.locations().filter(function (l) { return l.kind === 'barber'; })[0];
    function freshSave() {
      GAME.bests = {};
      delete GAME.prefs.guide; delete GAME.prefs.tipsSeen;
      GAME.prefs.storyIntro = false;
    }
    function settle() {
      if (L.isOpen) L.close();
      if (M.active) M.abandon();
      if (GAME.shopOpen) S.close();
      if (GAME.interiors.current) GAME.interiors.reset();
      if (P.inCar) GAME.exitCar();
      GAME.police.clearWanted();
      ff(0.5);
    }
    try {
      settle();
      GAME.test.teleport(356, 40); ff(0.5);
      // --- a fresh save is asked, three seconds in, and the old hints keep quiet ---
      freshSave(); pages.length = 0; msgs.length = 0;
      ff(1);
      r.asked = L.isOpen && GAME.prefs.guide === 'offered';
      r.choices = L.options();
      L.key('Escape');   // closing her without an answer is finding your own way
      ff(8);
      r.skipped = !L.isOpen && GAME.prefs.guide === 'skipped';
      r.skipLine = pages.filter(function (t) { return /Isla Verde/.test(t) && /shut/.test(t); })[0] || '';
      r.oldHints = msgs.filter(function (t) { return /coloured rings|bridges east/.test(t); }).length;
      // --- a save with a job done is never asked: the old welcome line ---
      GAME.bests = { race0: 40 }; delete GAME.prefs.guide; GAME.prefs.storyIntro = false; pages.length = 0;
      ff(0.5);
      r.oldSave = { asked: L.isOpen, welcome: pages.some(function (t) { return /Start with a race/.test(t); }) };
      settle();
      // --- the way back in: her menu, until it has been seen through ---
      GAME.bests = {}; GAME.prefs.guide = 'skipped';
      L.open(); r.ropesOnMenu = L.options().some(function (o) { return /SHOW ME THE ROPES/.test(o); });
      pages.length = 0;
      L.choose(/SHOW ME THE ROPES/); ff(0.3);
      r.ride = { step: G.step, car: !!G.car, bike: !!(G.car && G.car.spec.bike), hud: hud(), near: G.car ? Math.round(Math.hypot(G.car.pos.x - P.pos.x, G.car.pos.z - P.pos.z)) : -1,
        islandTease: pages.some(function (t) { return /Isla Verde/.test(t) && /shut/.test(t) && !/four/.test(t); }) };
      GAME.isTouch = true; r.touchWords = G.now(); GAME.isTouch = keepTouch;
      // --- in the car: off to the ring, on the map ---
      GAME.test.enterNearestCar(G.car); ff(1.5);
      var nd = GAME.nav && GAME.nav.dest;
      r.ring = { step: G.step, routed: !!nd && Math.hypot(nd.x - courier.start.x, nd.z - courier.start.z) < 2, hud: hud() };
      // --- the ring starts the same job, made kinder ---
      var car = P.car;
      car.pos.set(courier.start.x, C.groundY(courier.start.x, courier.start.z), courier.start.z); car.speed = 0;
      ff(1.5);
      var a = M.active;
      r.job = a ? { id: a.def.id, drops: a.stops.length, time: a.def.time, sameJob: a.def.orig === courier, step: G.step } : null;
      r.realJobUntouched = courier.drops === 4 && courier.time === 115;
      // --- a failed first run: back to the ring, and a retry is the same kinder run ---
      ff(4);
      // and fail it a kilometre from the ring: that is not walking off
      P.car.pos.set(-350, C.groundY(-350, 300), 300); P.car.speed = 0; ff(0.2);
      a.timeLeft = 0; ff(0.5);
      r.failed = { step: G.step, active: !!M.active, line: pages.some(function (t) { return /Happens to everybody/.test(t); }) };
      GAME.test.pressKey('KeyY', true); ff(1 / 60); GAME.test.pressKey('KeyY', false); ff(1.5);
      a = M.active;
      r.retry = a ? { drops: a.stops.length, step: G.step } : null;
      // --- the drops done: paid, then the card, then off to the barber ---
      ff(4);
      for (var k = 0; k < 4 && M.active; k++) {
        a = M.active;
        var s = a.stops[a.cpIndex];
        P.car.pos.set(s[0], C.groundY(s[0], s[1]), s[1]); P.car.speed = 0;
        ff(1.2);
      }
      r.won = { step: G.step, best: GAME.bests.courier2 !== undefined, card: !!GAME.shareOpen };
      pages.length = 0;
      ff(3);
      r.waitsForCard = G.step === 'paid';
      // a run can end a kilometre from the barber: that is not walking off
      P.car.pos.set(-350, C.groundY(-350, 300), 300); P.car.speed = 0; ff(0.2);
      GAME.share.hide(); ff(2);
      nd = GAME.nav && GAME.nav.dest;
      r.barber = { step: G.step, routed: !!nd && Math.hypot(nd.x - barber.at.x, nd.z - barber.at.z) < 2, hud: hud(),
        line: pages.some(function (t) { return /CORTES CUTS/.test(t); }) };
      // --- in the chair: a cut with the pay, and then the wider picture ---
      settle();
      GAME.test.teleport(barber.at.x + 3, barber.at.z); ff(0.3);
      GAME.interiors.enter(barber); ff(1.5);
      r.inside = G.step;
      var cash0 = P.cash;
      S.open(barber); ff(0.2);
      var cut = S.wardrobe.HAIRSTYLES.filter(function (h) { return h.id !== GAME.prefs.outfit.hairStyle; })[0];
      pages.length = 0;
      S.buy('style_' + cut.id); ff(0.2);
      S.close(); ff(0.5);
      // still in the shop, she waits; out on the pavement, she asks about THREADS
      r.waitsInside = G.step === 'counter';
      GAME.interiors.leave(); ff(1.5);
      var threads = S.locations().filter(function (l) { return l.kind === 'dress'; })[0];
      r.threads = { step: G.step, asked: L.isOpen && L.options().some(function (o) { return /MARK THREADS/.test(o); }) && L.options().some(function (o) { return /EXPLORE/.test(o); }),
        line: pages.some(function (t) { return /THREADS/.test(t); }) };
      if (L.isOpen) L.choose(/MARK THREADS/);
      ff(0.3);
      nd = GAME.nav && GAME.nav.dest;
      r.done = { step: G.step, pref: GAME.prefs.guide, paid: cash0 - P.cash, hud: hud(),
        threadsRouted: !!nd && Math.hypot(nd.x - threads.at.x, nd.z - threads.at.z) < 2,
        pointers: pages.some(function (t) { return /races, rampages and takedowns/.test(t) && /four/.test(t) && /stunt jump/.test(t); }) };
      L.open(); r.ropesAfter = L.options().some(function (o) { return /SHOW ME THE ROPES/.test(o); }); L.close();
      settle();
      // --- walking off part way lets you go, with the way back ---
      GAME.prefs.guide = 'left';
      GAME.test.teleport(356, 40); ff(0.5);
      G.begin(); ff(0.3);
      GAME.test.enterNearestCar(G.car); ff(1.5);
      pages.length = 0;
      GAME.test.teleport(-300, -300); ff(0.6);
      r.wandered = { step: G.step, pref: GAME.prefs.guide, line: pages.some(function (t) { return /SHOW ME THE ROPES/.test(t); }) };
      settle();
      // --- and so does abandoning the run ---
      GAME.test.teleport(356, 40); ff(0.5);
      G.begin(); ff(0.3);
      GAME.test.enterNearestCar(G.car); ff(1.5);
      P.car.pos.set(courier.start.x, C.groundY(courier.start.x, courier.start.z), courier.start.z); P.car.speed = 0;
      ff(1.5);
      var started = !!M.active;
      M.abandon(); ff(0.3);
      r.abandoned = { started: started, step: G.step, pref: GAME.prefs.guide };
      // --- outside her day, BEACH RUN is BEACH RUN ---
      r.untouched = G.jobFor(courier) === courier;
      // --- and once the island is open, she says so instead of teasing it ---
      GAME.isla.setOpen(true);
      GAME.prefs.guide = 'left'; pages.length = 0;
      G.begin(); ff(0.3);
      r.openIsland = { tease: pages.some(function (t) { return /shut/.test(t); }) };
      settle();
      G.skip(); ff(0.2);
      r.openIsland.skipTease = pages.some(function (t) { return /shut/.test(t); });
    } finally {
      GAME.hud.pager = pg0; GAME.hud.message = ms0;
      if (G.step) G.skip();
      settle();
      GAME.isla.setOpen(keepIsla);
      GAME.isTouch = keepTouch;
      GAME.prefs = JSON.parse(keepPrefs); GAME.bests = JSON.parse(keepBests);
      P.cash = keepCash; GAME.hud.cashChanged();
      S.applyOutfit();
      if (GAME.nav) GAME.nav.clear();
      GAME.hud.missionEnd();
      GAME.save();
    }
    return r;
  });
  check('guide: a fresh save is asked — show me around, or find my own way', gd.asked &&
    gd.choices.length === 2 && /SHOW ME AROUND/.test(gd.choices[0]) && /OWN WAY/.test(gd.choices[1]), JSON.stringify(gd.choices));
  check('guide: closing her is finding your own way, told the island is shut, and the old hints keep quiet',
    gd.skipped && !!gd.skipLine && gd.oldHints === 0, JSON.stringify({ skipped: gd.skipped, line: gd.skipLine, oldHints: gd.oldHints }));
  check('guide: a save with a job done is not asked, and keeps the old welcome', !gd.oldSave.asked && gd.oldSave.welcome, JSON.stringify(gd.oldSave));
  check('guide: SHOW ME THE ROPES on her menu starts it: a bike marked close by, the button named',
    gd.ropesOnMenu && gd.ride.step === 'ride' && gd.ride.car && gd.ride.bike && gd.ride.near < 100 && /Get on the bike/.test(gd.ride.hud) && gd.ride.islandTease &&
    /ENTER/.test(gd.touchWords), JSON.stringify({ menu: gd.ropesOnMenu, ride: gd.ride, touch: gd.touchWords }));
  check('guide: in the car, the ring is routed on the map', gd.ring.step === 'ring' && gd.ring.routed && /ring/.test(gd.ring.hud), JSON.stringify(gd.ring));
  check('guide: the ring starts BEACH RUN made kinder — three drops, 150 s — and leaves the real one alone',
    gd.job && gd.job.id === 'courier2' && gd.job.drops === 3 && gd.job.time === 150 && gd.job.sameJob && gd.job.step === 'job' && gd.realJobUntouched,
    JSON.stringify(gd.job));
  check('guide: a failed run goes back to the ring, and a retry is the same kinder run',
    gd.failed.step === 'ring' && !gd.failed.active && gd.failed.line && gd.retry && gd.retry.drops === 3 && gd.retry.step === 'job',
    JSON.stringify({ failed: gd.failed, retry: gd.retry }));
  check('guide: paid, she waits out the card, then routes you to CORTES CUTS',
    gd.won.step === 'paid' && gd.won.best && gd.won.card && gd.waitsForCard && gd.barber.step === 'barber' && gd.barber.routed && gd.barber.line && /CORTES CUTS/.test(gd.barber.hud),
    JSON.stringify({ won: gd.won, wait: gd.waitsForCard, barber: gd.barber }));
  check('guide: a cut with the pay; out of the door she asks about THREADS, and marks it',
    gd.inside === 'counter' && gd.waitsInside && gd.threads.step === 'outro' && gd.threads.asked && gd.threads.line && gd.done.threadsRouted,
    JSON.stringify({ inside: gd.inside, waits: gd.waitsInside, threads: gd.threads, done: gd.done }));
  check('guide: then the other rings, the island rule and how to call her',
    gd.done.step === null && gd.done.pref === 'done' && gd.done.paid === 150 && gd.done.pointers && gd.done.hud === '' && !gd.ropesAfter,
    JSON.stringify({ done: gd.done, ropesAfter: gd.ropesAfter }));
  check('guide: driving off lets you go, with the way back', gd.wandered.step === null && gd.wandered.pref === 'left' && gd.wandered.line, JSON.stringify(gd.wandered));
  check('guide: so does abandoning the run', gd.abandoned.started && gd.abandoned.step === null && gd.abandoned.pref === 'left', JSON.stringify(gd.abandoned));
  check('guide: outside her day BEACH RUN is untouched', gd.untouched);
  check('guide: with the island open she does not call it shut', !gd.openIsland.tease && !gd.openIsland.skipTease, JSON.stringify(gd.openIsland));

  // ---------- 5r: out on the water ----------
  var sea = await page.evaluate(function () {
    var r = {}, P = GAME.player, C = GAME.city, SL = GAME.sealife, V = GAME.vehicles.TYPES;
    var ff = function (s) { GAME.test.fastForward(s); };
    if (P.inCar) GAME.exitCar();
    GAME.police.clearWanted();
    GAME.settings.maxBoats = 0; SL.clear();
    var keepIsla = GAME.isla.isOpen();
    GAME.isla.setOpen(false);
    var msgs = [], ms0 = GAME.hud.message;
    GAME.hud.message = function (t) { msgs.push(String(t)); return ms0.apply(GAME.hud, arguments); };
    var crimes = [], rc0 = GAME.police.reportCrime;
    GAME.police.reportCrime = function (k) { crimes.push(k); return rc0.apply(GAME.police, arguments); };
    try {
      // --- a Wave Rider moored off the northern pier's north side, on your
      // left walking out, as the Squalo is on its right ---
      var mo = C.moorings.filter(function (m) { return m.vtype === 'jetski' && !m.isla; })[0];
      r.moored = mo ? { x: mo.x, z: mo.z, left: mo.z < -188 && mo.z > -196 && mo.x > 370 && mo.x < 470 } : null;
      GAME.test.teleport(mo.x, -186.5); ff(1.5);
      var ski = GAME.world.cars.filter(function (c) { return c.spec.jetski && Math.hypot(c.pos.x - mo.x, c.pos.z - mo.z) < 3; })[0];
      r.there = !!ski;
      P.heading = Math.PI;
      GAME.test.pressKey('KeyF', true); ff(0.05); GAME.test.pressKey('KeyF', false); ff(1.2);
      r.aboard = !!ski && P.inCar && P.car === ski;
      var j = P.mesh.userData.joints;
      r.astride = r.aboard && P.mesh.visible && j.legL.rotation.x < -0.5 && j.torso.rotation.x > 0.1 &&
        Math.abs(P.mesh.position.y - (ski.pos.y + 0.72 - 0.82)) < 0.35;
      GAME.test.pressKey('KeyW', true); ff(1.5); GAME.test.pressKey('KeyW', false);
      r.away = r.aboard ? +ski.speed.toFixed(1) : 0;
      r.quicker = V.jetski.accel > V.boat.accel && V.jetski.maxSpeed > V.boat.maxSpeed && V.jetski.turn > V.boat.turn;
      // --- out in the bay: with the fleet switched off, nobody comes out ---
      ski.pos.set(505, C.seaY(505, -60), -60); ski.vx = ski.vz = 0; ski.speed = 0; ski.heading = 0;
      ff(4);
      r.noneWhenOff = SL.fleet.length;
      // --- switched on, people come out for the day: on the water, somebody
      // aboard every one, going places, and nobody runs you down. (By day,
      // and on a full frame budget: both thin the fleet, and the groups above
      // can leave the clock at night and the budget cut back.) ---
      var mode0 = GAME.timeMode;
      GAME.setTimeMode('day');
      GAME.perf.testReset();
      GAME.settings.maxBoats = 5;
      var fl = { most: 0, types: {}, riders: true, dry: 0, minD: 1e9 }, seen = {};
      for (var t = 0; t < 45 * 60; t++) {
        ff(1 / 60);
        var f = SL.fleet;
        fl.most = Math.max(fl.most, f.length);
        for (var i = 0; i < f.length; i++) {
          var c = f[i];
          fl.minD = Math.min(fl.minD, Math.hypot(c.pos.x - ski.pos.x, c.pos.z - ski.pos.z));
          if (t % 30) continue;
          fl.types[c.type] = 1;
          if (!c.riderMesh) fl.riders = false;
          if (!C.isBoatWater(c.pos.x, c.pos.z)) fl.dry++;
          if (!seen[c.serial]) seen[c.serial] = { x: c.pos.x, z: c.pos.z, t: t, hp: c.hp, c: c };
        }
      }
      var moved = 0, still = 0, worst = 0;
      Object.keys(seen).forEach(function (k) {
        var s = seen[k];
        if (s.c.gone || s.c.dead) return;
        worst = Math.max(worst, (s.hp - s.c.hp) / s.c.spec.hp);
        if (s.t > 25 * 60) return;
        if (Math.hypot(s.c.pos.x - s.x, s.c.pos.z - s.z) > 30) moved++; else still++;
      });
      fl.moved = moved; fl.still = still; fl.worstHull = +worst.toFixed(2);
      GAME.setTimeMode(mode0);
      fl.minD = +fl.minD.toFixed(1);
      r.fleet = fl;
      // --- run one down: it is a crime, and they make off ---
      var lb = GAME.vehicles.spawnCar('jetski', ski.pos.x, ski.pos.z + 22, Math.PI / 2, { occupied: 'ai', ai: { mode: 'cruise' } });
      lb.pos.y = C.seaY(lb.pos.x, lb.pos.z);
      SL.adopt(lb); lb.cruise.idleT = 30;
      ski.heading = 0; ski.speed = 16; ski.vx = 0; ski.vz = 16;
      crimes.length = 0;
      GAME.test.pressKey('KeyW', true); ff(1.6); GAME.test.pressKey('KeyW', false); ff(0.4);
      r.ram = { crime: crimes.indexOf('hit_car') >= 0, fled: lb.cruise.fleeT > 0, crimes: crimes.slice() };
      GAME.police.clearWanted();
      // --- and one can be taken off its rider, from the water ---
      ski.speed = 0; ski.vx = ski.vz = 0;
      var tk = GAME.vehicles.spawnCar('jetski', 470, 60, 0, { occupied: 'ai', ai: { mode: 'cruise' } });
      tk.pos.y = C.seaY(470, 60);
      SL.adopt(tk); tk.cruise.idleT = 30;
      GAME.exitCar(); ff(0.3);
      GAME.test.teleport(472.5, 60); ff(0.3);
      P.heading = -Math.PI / 2;
      r.swimmingUp = !!P.swimming;
      GAME.test.pressKey('KeyF', true); ff(0.05); GAME.test.pressKey('KeyF', false); ff(1.5);
      r.taken = { aboard: P.inCar && P.car === tk, managed: SL.fleet.indexOf(tk) >= 0 };
      // --- a leisure craft is held at the shut channel the way you are, and
      // nobody is told about it ---
      var edge = GAME.aircraft.edges().closed.maxX;
      var ov = GAME.vehicles.spawnCar('jetski', edge - 4, 0, Math.PI / 2, { occupied: 'ai', ai: { mode: 'cruise' } });
      ov.pos.y = C.seaY(ov.pos.x, 0);
      SL.adopt(ov); ov.cruise.wp = { x: edge + 200, z: 0 }; ov.speed = 25; ov.vx = 25; ov.vz = 0;
      msgs.length = 0;
      var far = 0;
      for (var e = 0; e < 120; e++) { ff(1 / 60); far = Math.max(far, ov.pos.x); }
      r.held = { far: +far.toFixed(1), edge: edge, told: msgs.filter(function (m) { return /channel/.test(m); }).length };
      // --- a hull nosed onto the sand backs off it ---
      GAME.exitCar(); ff(0.3);
      var sq = GAME.vehicles.spawnCar('boat', C.shoreline(-60) + 2.5, -60, -Math.PI / 2);
      sq.pos.y = C.seaY(sq.pos.x, -60);
      GAME.test.teleport(sq.pos.x + 3, -62.5); ff(0.3);
      GAME.test.enterNearestCar(sq); ff(1.2);
      sq.heading = -Math.PI / 2; sq.speed = 0; sq.vx = sq.vz = 0;
      sq.pos.x = C.shoreline(-60) + 2.5;
      var x0 = sq.pos.x;
      r.bowDry = !C.isBoatWater(x0 - 2.9, -60);
      GAME.test.pressKey('KeyS', true); ff(2.5); GAME.test.pressKey('KeyS', false);
      r.backedOff = +(sq.pos.x - x0).toFixed(1);
      // --- far inland, the bay empties and nobody new is put out ---
      GAME.exitCar(); ff(0.3);
      GAME.test.teleport(-60, 40); ff(2);
      r.goneInland = SL.fleet.length;
      ff(10);
      r.noneInland = SL.fleet.length;
      // --- Lola's word for the boat ---
      r.tip = GAME.lola.line('boat');
    } finally {
      GAME.hud.message = ms0;
      GAME.police.reportCrime = rc0;
      GAME.test.pressKey('KeyW', false); GAME.test.pressKey('KeyS', false);
      GAME.settings.maxBoats = 0; SL.clear();
      if (P.inCar) GAME.exitCar();
      GAME.isla.setOpen(keepIsla);
      GAME.police.clearWanted();
      GAME.test.teleport(-60, 40); ff(0.5);
    }
    return r;
  });
  check('sea: a Wave Rider is moored off the northern pier, on the left walking out',
    sea.moored && sea.moored.left && sea.there, JSON.stringify(sea.moored));
  check('sea: you board it off the pier and sit astride it, and it is quick away',
    sea.aboard && sea.astride && sea.away > 8 && sea.quicker, JSON.stringify({ aboard: sea.aboard, astride: sea.astride, away: sea.away, quicker: sea.quicker }));
  check('sea: with the fleet off, nobody is out on the water', sea.noneWhenOff === 0, String(sea.noneWhenOff));
  check('sea: switched on, jet skis and boats come out, each with somebody aboard, always on the water',
    sea.fleet.most >= 3 && sea.fleet.types.jetski && sea.fleet.types.boat && sea.fleet.riders && sea.fleet.dry === 0, JSON.stringify(sea.fleet));
  check('sea: they go places, and come through it in one piece',
    sea.fleet.moved >= 2 && sea.fleet.moved >= sea.fleet.still && sea.fleet.worstHull < 0.5, JSON.stringify(sea.fleet));
  check('sea: nobody out for the day runs you down', sea.fleet.minD > 5, 'closest ' + sea.fleet.minD + ' m');
  check('sea: run one down and it is a crime, and they make off', sea.ram.crime && sea.ram.fled, JSON.stringify(sea.ram));
  check('sea: one can be taken off its rider from the water, and is yours', sea.swimmingUp && sea.taken.aboard && !sea.taken.managed, JSON.stringify(sea.taken));
  check('sea: a leisure craft is held at the shut channel, and nobody is told', sea.held.far <= sea.held.edge + 0.01 && sea.held.told === 0, JSON.stringify(sea.held));
  check('sea: a hull nosed onto the sand backs off it', sea.bowDry && sea.backedOff > 1.5, JSON.stringify({ bowDry: sea.bowDry, backedOff: sea.backedOff }));
  check('sea: far inland the bay empties, and nobody new is put out', sea.goneInland === 0 && sea.noneInland === 0, sea.goneInland + ' / ' + sea.noneInland);
  check('sea: Lola says the harbour patrol has boats', /harbour patrol/.test(sea.tip), sea.tip);

  // The harbour patrol. Out on the water a cruiser can only wait on the
  // shore, so wanted at sea brings launches — and they are a real pursuit.
  var pat = await page.evaluate(function () {
    var r = {}, P = GAME.player, C = GAME.city, ff = function (s) { GAME.test.fastForward(s); };
    function lc() { return GAME.world.cars.filter(function (c) { return c.spec.boat && c.isPolice && !c.dead && !c.gone && c.ai && c.ai.mode === 'chase'; }); }
    if (P.inCar) GAME.exitCar();
    GAME.police.clearWanted(); GAME.settings.maxBoats = 0; GAME.sealife.clear();
    // --- on land, wanted: no launch is put out ---
    GAME.test.teleport(-60, 40); ff(0.5);
    GAME.police.setWanted(2);
    var most = 0;
    for (var t = 0; t < 6 * 60; t++) { ff(1 / 60); most = Math.max(most, lc().length); }
    r.onLand = most;
    GAME.police.clearWanted(); ff(1);
    // --- at sea in a boat, two stars: one launch, police through and through ---
    GAME.test.teleport(505, -62); ff(0.5);
    var bt = GAME.vehicles.spawnCar('boat', 505, -60, 0);
    bt.pos.y = C.seaY(505, -60);
    GAME.test.enterNearestCar(bt); ff(1.2);
    r.inBoat = P.inCar && P.car === bt;
    GAME.police.setWanted(2);
    GAME.test.pressKey('KeyW', true); GAME.test.pressKey('KeyA', true);
    var first = null, lights = false, minD = 1e9, cap = 0, dry = 0, l0 = null;
    for (var t2 = 0; t2 < 25 * 60; t2++) {
      ff(1 / 60);
      var L = lc();
      cap = Math.max(cap, L.length);
      if (L.length && first === null) { first = t2 / 60; l0 = L[0]; }
      for (var i = 0; i < L.length; i++) {
        var lb = L[i].mesh.userData.lightbar;
        if (lb && (lb[0].visible || lb[1].visible)) lights = true;
        minD = Math.min(minD, Math.hypot(L[i].pos.x - bt.pos.x, L[i].pos.z - bt.pos.z));
        if (t2 % 30 === 0 && !C.isBoatWater(L[i].pos.x, L[i].pos.z)) dry++;
      }
      if (GAME.police.wanted < 2) GAME.police.setWanted(2);
    }
    GAME.test.pressKey('KeyW', false); GAME.test.pressKey('KeyA', false);
    r.launch = { first: first, cap: cap, lights: lights, dry: dry, minD: +minD.toFixed(1),
      police: !!l0 && l0.isPolice && l0.type === 'policeboat',
      cop: !!l0 && !!l0.riderMesh && l0.riderMesh.userData.look.shirt === 0x2a4a8a };
    // --- stop, and they come alongside and take you ---
    var bustT = null;
    for (var t3 = 0; t3 < 30 * 60 && bustT === null; t3++) {
      ff(1 / 60);
      if (GAME.police.wanted < 2 && P.state === 'alive') GAME.police.setWanted(2);
      if (P.state === 'busted') bustT = t3 / 60;
    }
    r.taken = bustT;
    return r;
  });
  await comeBack();
  var pat2 = await page.evaluate(function () {
    var r = {}, P = GAME.player, C = GAME.city, ff = function (s) { GAME.test.fastForward(s); };
    function lc() { return GAME.world.cars.filter(function (c) { return c.spec.boat && c.isPolice && !c.dead && !c.gone && c.ai && c.ai.mode === 'chase'; }); }
    if (P.inCar) GAME.exitCar();
    GAME.police.clearWanted(); ff(1);
    // --- in the water at three stars: two launches, and nobody outswims one ---
    GAME.test.teleport(505, -60); ff(0.5);
    r.swimming = !!P.swimming;
    GAME.police.setWanted(3);
    var bustT = null, cap = 0;
    for (var t = 0; t < 40 * 60 && bustT === null; t++) {
      ff(1 / 60);
      cap = Math.max(cap, lc().length);
      if (P.state === 'busted') bustT = t / 60;
    }
    r.hauled = bustT; r.cap = cap;
    return r;
  });
  await comeBack();
  var pat3 = await page.evaluate(function () {
    var r = {}, P = GAME.player, C = GAME.city, ff = function (s) { GAME.test.fastForward(s); };
    function lc() { return GAME.world.cars.filter(function (c) { return c.spec.boat && c.isPolice && !c.dead && !c.gone && c.ai && c.ai.mode === 'chase'; }); }
    if (P.inCar) GAME.exitCar();
    GAME.police.clearWanted(); ff(1);
    // (nobody on foot takes you on the beach while this watches the launch:
    // a player in the cells stops the police thinking, and the launch sat
    // frozen wherever it was — 130 m out — and never pottered off)
    var bust0 = GAME.playerBusted;
    GAME.playerBusted = function () { };
    // --- gone ashore: the launch sits off the beach, and no more are sent
    // (wanted in the water just off it, so where they last saw you is
    // where you climbed out, as it would be) ---
    GAME.test.teleport(C.shoreline(-60) + 18, -60); ff(0.5);
    GAME.police.setWanted(1);
    for (var t = 0; t < 10 * 60 && !lc().length; t++) ff(1 / 60);
    ff(3);
    var n0 = lc().length;
    GAME.test.teleport(C.shoreline(-60) - 12, -60); ff(0.5);
    var more = 0;
    for (var t2 = 0; t2 < 15 * 60; t2++) { if (GAME.police.wanted < 1) GAME.police.setWanted(1); ff(1 / 60); more = Math.max(more, lc().length - n0); }
    var L = lc();
    r.ashore = { n0: n0, more: more, swim: !!P.swimming, waits: L.map(function (c) { return { d: Math.round(Math.hypot(c.pos.x - P.pos.x, c.pos.z - P.pos.z)), wet: C.isBoatWater(c.pos.x, c.pos.z), sp: +Math.abs(c.speed).toFixed(1) }; }) };
    // --- and when the heat is off, it stands down and potters off ---
    var l0 = L[0];
    GAME.police.clearWanted(); ff(0.3);
    var p0 = l0 ? { x: l0.pos.x, z: l0.pos.z } : null;
    r.stoodDown = l0 ? { mode: l0.ai && l0.ai.mode, fleet: GAME.sealife.fleet.indexOf(l0) >= 0,
      lights: l0.mesh.userData.lightbar[0].visible || l0.mesh.userData.lightbar[1].visible } : null;
    ff(8);
    r.pottered = l0 && !l0.gone ? Math.round(Math.hypot(l0.pos.x - p0.x, l0.pos.z - p0.z)) : -1;
    GAME.sealife.clear();
    GAME.playerBusted = bust0;
    GAME.test.teleport(-60, 40); ff(0.5);
    r.after = GAME.player.state;
    return r;
  });
  // Fifteen seconds at one star on the beach is long enough for an officer
  // on foot to walk up and take you — and a player left in the cells takes
  // every group after this down with it. Back on your feet, whatever.
  await comeBack();
  check('patrol: wanted on land, no launch is put out', pat.onLand === 0, String(pat.onLand));
  check('patrol: wanted at sea, a launch comes — a police boat, lights going, an officer at the helm',
    pat.inBoat && pat.launch.first !== null && pat.launch.first < 4 && pat.launch.police && pat.launch.cop && pat.launch.lights && pat.launch.dry === 0,
    JSON.stringify(pat.launch));
  check('patrol: one launch at two stars, and it runs you close', pat.launch.cap === 1 && pat.launch.minD < 40, JSON.stringify(pat.launch));
  check('patrol: stop, and they come alongside and take you', pat.taken !== null && pat.taken < 25, String(pat.taken));
  check('patrol: in the water at three stars, two launches, and a swimmer is hauled out',
    pat2.swimming && pat2.hauled !== null && pat2.hauled < 35 && pat2.cap === 2, JSON.stringify(pat2));
  check('patrol: gone ashore, the launch waits off the beach and no more are sent',
    pat3.ashore.n0 >= 1 && pat3.ashore.more === 0 && !pat3.ashore.swim && pat3.ashore.waits.length >= 1 &&
    // (off the stretch of beach they are searching: unseen a while, the
    // hunt works round where they last saw you, out to ninety metres, and
    // the launch waits off that — on the water, holding still)
    pat3.ashore.waits.every(function (w) { return w.wet && w.d < 130 && w.sp < 4; }), JSON.stringify(pat3.ashore));
  check('patrol: heat off, the launch stands down, lights out, and potters off about the bay',
    pat3.stoodDown && pat3.stoodDown.mode === 'cruise' && pat3.stoodDown.fleet && !pat3.stoodDown.lights && pat3.pottered > 20,
    JSON.stringify({ stood: pat3.stoodDown, moved: pat3.pottered }));

  // ---------- 5s: street life ----------
  var st = await page.evaluate(function () {
    var r = {}, P = GAME.player, C = GAME.city, S = GAME.streetlife, H = GAME.herald;
    var ff = function (s) { GAME.test.fastForward(s); };
    var keepPrefs = JSON.stringify(GAME.prefs), keepCash = P.cash, lvl0 = GAME.chaos.level, traffic0 = GAME.settings.maxTraffic;
    var msgs = [], ms0 = GAME.hud.message;
    GAME.hud.message = function (t) { msgs.push(String(t)); return ms0.apply(GAME.hud, arguments); };
    var crimes = [], rc0 = GAME.police.reportCrime;
    GAME.police.reportCrime = function (k) { crimes.push(k); return rc0.apply(GAME.police, arguments); };
    function settle() { if (P.inCar) GAME.exitCar(); GAME.police.clearWanted(); S.reset(); ff(0.3); }
    function kinds() { return H.printed.map(function (p) { return p.kind; }); }
    try {
      settle();
      var node = C.nearestNode(60, 40);
      GAME.test.teleport(node.x, node.z); ff(0.5);
      // --- with the CITY off, the street keeps to itself ---
      GAME.chaos.set(0);
      S.reset();
      ff(60);
      r.offQuiet = S.now;
      GAME.chaos.set(3);
      // --- a getaway car comes your way with a cruiser on its tail ---
      // (the street to themselves: this is about the chase coming your way,
      // not the getaway threading a jam — a narrow street with a car parked
      // on one side and one pulled over for the siren on the other holds it
      // up for good, now and then — and it can start a long way off)
      var keepTraffic0 = GAME.settings.maxTraffic;
      GAME.settings.maxTraffic = 0;
      GAME.world.cars.slice().forEach(function (c) { if (c.occupied === 'ai') GAME.vehicles.removeCar(c); });
      r.chaseOn = S.start('chase');
      var e = S.event, minD = 1e9, lights = false, siren = false;
      // (until it is on its way in: run on past that and it is long gone by
      // the time you would put it into a wall — and stop it any closer and
      // the cruiser on its tail, still at full chat, can run you down where
      // you stand in the road)
      for (var t = 0; t < 35 * 60 && S.event === e && !e.perp.gone && minD > 60; t++) {
        ff(1 / 60);
        minD = Math.min(minD, Math.hypot(e.perp.pos.x - P.pos.x, e.perp.pos.z - P.pos.z));
        var lb = e.cop.mesh.userData.lightbar;
        if (lb && (lb[0].visible || lb[1].visible)) lights = true;
        if (S.siren() === e.cop) siren = true;
      }
      r.chase = { minD: Math.round(minD), outlaw: !!e.perp.outlaw, follows: e.cop.ai && e.cop.ai.follow === e.perp, lights: lights, siren: siren, blip: S.blips().length > 0 };
      // and putting it into a wall yourself is no crime, and pays
      if (S.event === e && !e.perp.gone) {
        crimes.length = 0;
        var c0 = P.cash, n0 = H.total;
        GAME.vehicles.damageCar(e.perp, e.perp.hp * 0.75, 'gun', true);
        ff(0.5);
        r.taken = { paid: P.cash - c0, crimes: crimes.length, paper: H.total > n0 && kinds()[kinds().length - 1] === 'hero', now: S.now, you: P.state };
      } else r.taken = { gone: true };
      GAME.settings.maxTraffic = keepTraffic0;
      settle();
      // --- a hold-up: the thief runs with the bag ---
      // (on the road seventy metres from THREADS: a hold-up is at a shop
      // forty-five to a hundred and twenty metres off)
      var robDoor = GAME.shops.locations().filter(function (l) { return l.id === 'dress0'; })[0].at;
      var robAt = GAME.city.nearestRoadPoint(robDoor.x + 70, robDoor.z);
      H.resetCooldown();
      GAME.test.teleport(robAt.x, robAt.z); ff(0.5);
      r.robOn = S.start('robbery');
      var ev = S.event;
      if (ev) {
        var th = ev.thief, door = { x: ev.shop.at.x, z: ev.shop.at.z };
        ff(3);
        r.rob = { outlaw: !!th.outlaw, bag: !!th.bag, ran: Math.round(Math.hypot(th.pos.x - door.x, th.pos.z - door.z)), dead: th.dead };
        crimes.length = 0;
        if (!th.dead && S.event === ev) {
          var n1 = H.total;
          GAME.peds.kill(th, 'gun', true);
          ff(0.3);
          var bag = GAME.world.pickups.filter(function (q) { return q.amount && q.type === 'cash'; })[0];
          r.robDown = { crimes: crimes.length, amount: bag ? bag.amount : 0, paper: H.total > n1, you: P.state };
          if (bag) { var c1 = P.cash; GAME.test.teleport(bag.pos.x, bag.pos.z); ff(0.4); r.robDown.picked = P.cash - c1; }
        }
      }
      settle();
      // --- the same thief, stopped by somebody else: no hero, no paper ---
      H.resetCooldown();
      GAME.test.teleport(robAt.x, robAt.z); ff(0.5);
      if (S.start('robbery')) {
        var th2 = S.event.thief, n2 = H.total;
        ff(1);
        GAME.peds.kill(th2, 'car', false);
        ff(0.3);
        r.notMine = { paper: H.total > n2, now: S.now };
      }
      settle();
      // --- an armoured van on its rounds ---
      H.resetCooldown();
      GAME.test.teleport(node.x, node.z); ff(0.5);
      r.vanOn = S.start('van');
      if (r.vanOn) {
        var van = S.event.van;
        r.armour = +(van.hp / van.spec.hp).toFixed(1);
        ff(2);
        // (only the bags this van drops: a thief's takings from before can
        // be lying about too, and be $250 of them)
        var lying = GAME.world.pickups.slice();
        GAME.vehicles.damageCar(van, van.hp * 0.8, 'gun', true);
        ff(0.5);
        r.vanHit = { bags: GAME.world.pickups.filter(function (q) { return q.amount === 250 && lying.indexOf(q) < 0; }).length, wanted: GAME.police.wanted, paper: kinds().indexOf('van') >= 0 };
        // (and off the road: left where it was robbed, it can be standing
        // on the next check's race route)
        settle();
        if (!van.gone) GAME.vehicles.removeCar(van);
      }
      settle();
      // --- at the lights: somebody pulls up and revs ---
      var nb = C.neighbors(node)[0], hd = Math.atan2(nb.x - node.x, nb.z - node.z);
      var rc = GAME.vehicles.spawnCar('sedan', node.x, node.z, hd);
      GAME.test.teleport(node.x + 2.5, node.z); ff(0.2);
      GAME.test.enterNearestCar(rc); ff(1.5);
      rc.speed = 0; rc.vx = rc.vz = 0; ff(0.5);
      // The road is left to the two of you, from before they turn up: a
      // crash into passing traffic is a race too (below), but not this one —
      // and on the way up alongside, a car crossing the junction behind you
      // took the racer out before it ever arrived (CI run 204). Your car
      // stays where it stops — on the line, in their way.
      var keepTraffic = GAME.settings.maxTraffic;
      GAME.settings.maxTraffic = 0;
      var clearRoad = function () {
        GAME.world.cars.slice().forEach(function (c) { if (c !== rc && !(S.racer && c === S.racer.car) && c.occupied === 'ai') GAME.vehicles.removeCar(c); });
      };
      clearRoad();
      r.racerOn = S.start('racer');
      var rcar = S.racer && S.racer.car;
      for (var t2 = 0; t2 < 20 * 60 && S.racer && S.racer.state === 'pull'; t2++) ff(1 / 60);
      r.alongside = S.racer ? { state: S.racer.state, d: +Math.hypot(S.racer.car.pos.x - rc.pos.x, S.racer.car.pos.z - rc.pos.z).toFixed(1), flag: !!S.racer.marker }
        : { gone: true, started: r.racerOn, car: rcar ? { gone: !!rcar.gone, dead: !!rcar.dead, occ: rcar.occupied, d: Math.round(Math.hypot(rcar.pos.x - rc.pos.x, rcar.pos.z - rc.pos.z)) } : null, mine: Math.round(rc.speed * 10) / 10, inCar: P.inCar };
      GAME.test.pressKey('KeyW', true); ff(1.5); GAME.test.pressKey('KeyW', false);
      r.raceOn = S.racer && S.racer.state;
      // and your car, stopped dead in their lane a little way up the road
      var rr = S.racer && S.racer.car;
      if (rr) {
        rc.pos.x = rr.pos.x + Math.sin(rr.heading) * 12; rc.pos.z = rr.pos.z + Math.cos(rr.heading) * 12;
        rc.heading = rr.heading; rc.speed = 0; rc.vx = rc.vz = 0;
      }
      msgs.length = 0;
      for (var t3 = 0; t3 < 70 * 60 && S.racer; t3++) { rc.controls.throttle = 0; ff(1 / 60); }
      r.raceEnd = msgs.filter(function (m) { return /take|peters/.test(m); })[0] || '';
      // --- they crash out mid-race: the flag is still up, and yours ---
      settle();
      if (!rc.gone) GAME.vehicles.removeCar(rc);
      rc = GAME.vehicles.spawnCar('sedan', node.x, node.z, hd);
      GAME.test.teleport(node.x + 2.5, node.z); ff(0.2);
      GAME.test.enterNearestCar(rc); ff(1.5);
      rc.speed = 0; rc.vx = rc.vz = 0; ff(0.5);
      clearRoad();
      if (S.start('racer')) {
        for (var t6 = 0; t6 < 20 * 60 && S.racer && S.racer.state === 'pull'; t6++) ff(1 / 60);
        GAME.test.pressKey('KeyW', true); ff(1.5); GAME.test.pressKey('KeyW', false);
        msgs.length = 0;
        var rv = S.racer && S.racer.car;
        if (rv && S.racer.state === 'race') {
          GAME.vehicles.ejectDriver(rv); ff(0.3);
          r.crashOut = { on: !!S.racer, told: msgs.some(function (m) { return /crashed out/.test(m); }) };
          var fin = S.racer && S.racer.fin, c6 = P.cash;
          if (fin) { rc.pos.x = fin[0]; rc.pos.z = fin[1]; rc.speed = 0; ff(0.3); }
          r.crashOut.paid = P.cash - c6;
          r.crashOut.won = msgs.some(function (m) { return /You take the flag/.test(m); });
          r.crashOut.over = !S.racer;
        }
      }
      GAME.settings.maxTraffic = keepTraffic;
      settle();
      // (and nothing left standing in the road: your car on the flag and
      // their empty one can be on a later check's way across town)
      [rc, rv].forEach(function (c) { if (c && !c.gone) GAME.vehicles.removeCar(c); });
      // --- the papers: a manhunt slipped from four stars ---
      H.resetCooldown();
      GAME.chaos.set(0);
      GAME.test.teleport(node.x, node.z); ff(0.3);
      // (nobody catches you while it cools: a bust is no escape, below)
      var godWas = GAME.godMode, bust0 = GAME.playerBusted;
      GAME.godMode = true; GAME.playerBusted = function () { };
      GAME.police.setWanted(4); ff(0.2);
      GAME.police.setWanted(1);
      var m0 = H.total;
      for (var t4 = 0; t4 < 90 * 30 && GAME.police.wanted > 0; t4++) {
        GAME.world.peds.slice().forEach(function (p) { if (p.isCop) GAME.peds.removePed(p); });
        GAME.world.cars.slice().forEach(function (c) { if (c.isPolice && c.ai && c.ai.mode === 'chase') GAME.vehicles.removeCar(c); });
        ff(1 / 30);
      }
      GAME.godMode = godWas; GAME.playerBusted = bust0;
      r.manhunt = { cleared: GAME.police.wanted === 0, paper: H.total > m0 && kinds()[kinds().length - 1] === 'manhunt' };
      // and a bust is not an escape
      H.resetCooldown();
      GAME.police.setWanted(4); ff(0.2);
      var m1 = H.total;
      GAME.police.clearWanted(); ff(0.2);
      r.clearedByHand = H.total === m1;
      // the front page itself: on the screen, readable, and it goes (once
      // whatever was already on the stand has been read)
      for (var t5 = 0; t5 < 60 && H.showing; t5++) ff(0.5);
      H.resetCooldown();
      H.front('van', {}); ff(0.2);
      var hd0 = document.getElementById('herald');
      r.page = { on: hd0.classList.contains('on'), head: hd0.querySelector('.hd-head').textContent, date: /1986/.test(hd0.querySelector('.hd-date').textContent) };
      GAME.togglePause(); ff(0.1);
      r.page.pausedHides = !hd0.classList.contains('on');
      GAME.togglePause(); ff(0.1);
      ff(11);
      r.page.gone = !hd0.classList.contains('on');
      // a big story runs once
      r.once = [H.front('rico'), (H.resetCooldown(), H.front('rico'))];
    } finally {
      GAME.hud.message = ms0;
      GAME.police.reportCrime = rc0;
      GAME.test.pressKey('KeyW', false);
      settle();
      GAME.chaos.set(lvl0);
      GAME.settings.maxTraffic = traffic0;
      GAME.prefs = JSON.parse(keepPrefs); P.cash = keepCash;
      GAME.test.teleport(-60, 40); ff(0.5);
    }
    return r;
  });
  check('street: with the CITY off, nothing happens', st.offQuiet === null, String(st.offQuiet));
  check('street: a getaway car comes your way, a cruiser on its tail, lights and siren going',
    st.chaseOn && st.chase.outlaw && st.chase.follows && st.chase.lights && st.chase.siren && st.chase.blip && st.chase.minD < 90, JSON.stringify(st.chase));
  check('street: stopping it yourself is no crime, pays, and makes the papers',
    st.taken.paid === 250 && st.taken.crimes === 0 && st.taken.paper, JSON.stringify(st.taken));
  check('street: a shop is held up and the thief runs with the bag',
    st.robOn && st.rob && st.rob.outlaw && st.rob.bag && st.rob.ran > 6, JSON.stringify(st.rob));
  check('street: put him down — no crime — and the takings are on the pavement for you',
    st.robDown && st.robDown.crimes === 0 && st.robDown.amount >= 150 && st.robDown.picked >= st.robDown.amount && st.robDown.paper, JSON.stringify(st.robDown));
  check('street: stopped by somebody else, nobody calls you a hero', st.notMine && !st.notMine.paper && st.notMine.now === null, JSON.stringify(st.notMine));
  check('street: the armoured van is armoured, and robbing it is three bags and three stars',
    st.vanOn && st.armour >= 3 && st.vanHit.bags === 3 && st.vanHit.wanted >= 3 && st.vanHit.paper, JSON.stringify({ armour: st.armour, hit: st.vanHit }));
  check('street: stopped in a car, a racer pulls up alongside, revs, and the flag is marked',
    st.racerOn && st.alongside && st.alongside.state === 'rev' && st.alongside.d < 4.5 && st.alongside.flag, JSON.stringify(st.alongside));
  check('street: floor it and it is a race, and they run it to the flag — round your car, stopped on the line', st.raceOn === 'race' && /take it|take them/.test(st.raceEnd), JSON.stringify({ on: st.raceOn, end: st.raceEnd }));
  check('street: and if they crash out mid-race, you are told, and the flag is yours to take',
    st.crashOut && st.crashOut.on && st.crashOut.told && st.crashOut.paid === 300 && st.crashOut.won && st.crashOut.over, JSON.stringify(st.crashOut));
  check('papers: losing a four-star manhunt makes the front page', st.manhunt.cleared && st.manhunt.paper, JSON.stringify(st.manhunt));
  check('papers: a bust or a bribe is not an escape', st.clearedByHand);
  check('papers: the front page shows — the headline, a 1986 date — keeps out of the pause screen, and goes',
    st.page.on && /ARMORED|VAN/.test(st.page.head) && st.page.date && st.page.pausedHides && st.page.gone, JSON.stringify(st.page));
  check('papers: a big story runs once', st.once[0] === true && st.once[1] === false, JSON.stringify(st.once));

  // The road markings. The yellow centre dashes ran straight through every
  // junction, and the two roads' lines crossed in the middle of the box.
  // They stop short now, and each arm has a zebra and a stop line across
  // the lane that comes in — the lane the traffic really drives.
  var rm = await page.evaluate(function () {
    var C = GAME.city, M = C.roadMarks, R = C.R, H = C.ROAD_HALF, r = {}, ff = function (s) { GAME.test.fastForward(s); };
    function inBox(a, b) { for (var k = 0; k < R.length; k++) if (b > R[k] - H && a < R[k] + H) return true; return false; }
    r.dashes = M.dashes.length;
    r.inBox = M.dashes.filter(function (d) { return d[0] === d[2] ? inBox(d[1], d[3]) : inBox(d[0], d[2]); }).length;
    r.arms = M.zebraArms; r.stops = M.stops.length;
    // a car coming up to a crossing on each axis: is it on the stop line's side?
    var keep = { t: GAME.settings.maxTraffic, p: GAME.settings.maxParked };
    GAME.settings.maxTraffic = 0; GAME.settings.maxParked = 0;
    GAME.world.cars.slice().forEach(function (c) { if (!c.parkedSpot) GAME.vehicles.removeCar(c); });
    var picks = [M.stops.filter(function (q) { return q.dir[0] === 0 && Math.abs(q.x) < 300 && Math.abs(q.z) < 300; })[0],
      M.stops.filter(function (q) { return q.dir[1] === 0 && Math.abs(q.x) < 300 && Math.abs(q.z) < 300; })[0]];
    r.sides = picks.map(function (q) {
      var road = q.dir[0] === 0 ? 'x' : 'z';
      // the road's centre line, and where the car starts, 40 m back up it
      var cx = road === 'x' ? Math.round(q.x / 50) * 50 : null, cz = road === 'z' ? Math.round(q.z / 50) * 50 : null;
      if (road === 'x') cx = R.reduce(function (a, b) { return Math.abs(b - q.x) < Math.abs(a - q.x) ? b : a; });
      else cz = R.reduce(function (a, b) { return Math.abs(b - q.z) < Math.abs(a - q.z) ? b : a; });
      var sx = road === 'x' ? cx : q.x - q.dir[0] * 40, sz = road === 'z' ? cz : q.z - q.dir[1] * 40;
      GAME.test.teleport(sx + 15, sz + 15); ff(0.2);
      var car = GAME.vehicles.spawnCar('sedan', sx, sz, Math.atan2(q.dir[0], q.dir[1]), { occupied: 'ai', ai: { mode: 'traffic', desired: 8, laneX: 0, laneZ: 0 } });
      // (until it has settled into a lane: one held up a moment by somebody
      // crossing is still on the crown of the road at three seconds)
      var lat = 0;
      for (var w = 0; w < 32 && Math.abs(lat) < 1.5; w++) { ff(0.25); lat = road === 'x' ? car.pos.x - cx : car.pos.z - cz; }
      var line = road === 'x' ? q.x - cx : q.z - cz;
      GAME.vehicles.removeCar(car);
      return { road: road, carSide: +lat.toFixed(1), lineSide: +line.toFixed(1), same: lat * line > 0 };
    });
    GAME.settings.maxTraffic = keep.t; GAME.settings.maxParked = keep.p;
    GAME.test.teleport(-60, 40); ff(0.3);
    return r;
  });
  check('roads: the centre lines stop short of every junction — none cross in the box',
    rm.dashes > 500 && rm.inBox === 0, rm.inBox + ' dashes in a junction box, of ' + rm.dashes);
  check('roads: every arm that goes on has a zebra and a stop line', rm.arms > 250 && rm.stops === rm.arms, JSON.stringify({ arms: rm.arms, stops: rm.stops }));
  check('roads: the stop line is across the lane the traffic drives up to it', rm.sides.every(function (q) { return q.same; }), JSON.stringify(rm.sides));

  // Six strangers, six favours.
  var sg = await page.evaluate(async function () {
    var r = {}, P = GAME.player, C = GAME.city, K = GAME.strangers, L = GAME.lola, M = GAME.missions;
    var ff = function (s) { GAME.test.fastForward(s); };
    var keepPrefs = JSON.stringify(GAME.prefs), keepCash = P.cash;
    var msgs = [], ms0 = GAME.hud.message;
    GAME.hud.message = function (t) { msgs.push(String(t)); return ms0.apply(GAME.hud, arguments); };
    function last(re) { for (var i = msgs.length - 1; i >= 0; i--) if (re.test(msgs[i])) return msgs[i]; return ''; }
    function car(type, x, z) { var c = GAME.vehicles.spawnCar(type, x, z, 0); GAME.test.teleport(x + 2.5, z); ff(0.2); GAME.test.enterNearestCar(c); ff(1.3); return c; }
    function put(c, x, z) { c.pos.set(x, C.groundY(x, z), z); c.speed = 0; c.vx = c.vz = 0; }
    // (and any ring the car was stood in when a favour ended — VINCE's
    // lock-up is a random spot, and once it was NIGHT MAIL's ring, whose
    // run then went on into every group after this one)
    function off() { if (L.isOpen) L.close(); if (P.inCar) GAME.exitCar(); if (M.active) M.abandon(); GAME.police.clearWanted(); ff(0.3); }
    function near(id) { var q = K.people().filter(function (p) { return p.def.id === id; })[0]; GAME.test.teleport(q.at.x + 20, q.at.z); ff(0.4); return q; }
    try {
      GAME.prefs.strangers = {};
      K.reset(); K.enabled = true;
      off();
      // --- where they stand: on the pavement, off every road, clear of the walls ---
      r.spots = K.people().map(function (q) {
        var rp = C.nearestRoadPoint(q.at.x, q.at.z), pr = GAME.resolveCircle(q.at.x, q.at.z, 0.5);
        return { id: q.def.id, road: +Math.hypot(rp.x - q.at.x, rp.z - q.at.z).toFixed(1), clear: Math.abs(pr.x - q.at.x) + Math.abs(pr.z - q.at.z) < 0.05 };
      });
      // --- come near one: there, marked, on the radar; walk up and he asks ---
      var ray = near('ray');
      r.there = { ped: !!ray.ped, mark: !!ray.mark && ray.mark.visible, blip: K.blips().some(function (b) { return Math.hypot(b.x - ray.at.x, b.z - ray.at.z) < 1; }) };
      GAME.test.teleport(ray.at.x + 2, ray.at.z); ff(0.4);
      r.asks = { open: L.isOpen, from: document.getElementById('lola-from').textContent, opts: L.options() };
      L.choose(/NOT RIGHT NOW/); ff(0.3);
      r.declined = { open: L.isOpen, busy: K.busy };
      ff(2);
      r.notAgainYet = !L.isOpen;
      GAME.test.teleport(ray.at.x + 30, ray.at.z); ff(0.5);
      GAME.test.teleport(ray.at.x + 2, ray.at.z); ff(0.4);
      r.asksAgain = L.isOpen;
      L.choose(/DO IT/); ff(0.3);
      r.rayCar = { busy: K.busy, phase: K.job && K.job.phase };
      // --- with a favour on, a mission ring does not start, and nothing happens in the street ---
      var ring = M.DEFS.filter(function (d) { return d.type === 'courier' && !d.isla; })[0];
      var rr = car('sedan', ring.start.x, ring.start.z); ff(1);
      r.ringBlocked = !M.active;
      GAME.exitCar(); ff(0.3);
      // --- RAY: into a car near him, and to the airport against the clock ---
      var rc = car('sedan', ray.at.x + 4, ray.at.z + 3); ff(0.5);
      r.rayGo = { phase: K.job && K.job.phase, timer: K.job ? Math.round(K.job.timer) : 0, route: (M.getRoutePoints() || []).length, gone: !ray.ped };
      put(rc, -152, 398); ff(0.5);
      r.rayDone = { busy: K.busy, done: K.done, msg: last(/FAVOUR/) };
      off();
      r.rayGoneForGood = (near('ray'), !ray.ped);
      // --- RAY's clock running out, on a second save ---
      // (VINCE stands in: a favour that fails puts them back on the pavement)
      // --- DANI: tail him, not too close ---
      var dani = near('dani');
      K.ask('dani'); ff(0.2);
      var h = K.job.husband;
      // (behind him on his own road: a point thirty metres off in a fixed
      // direction can be inside a block, and the teleport beside the car
      // there stands you on the roof, too far above it to get in)
      var dc = car('sedan', h.pos.x - Math.sin(h.heading) * 30, h.pos.z - Math.cos(h.heading) * 30);
      for (var t = 0; t < 200 && K.busy; t++) {
        ff(1);
        if (!K.job) break;
        h = K.job.husband;
        put(dc, h.pos.x - Math.sin(h.heading) * 35, h.pos.z - Math.cos(h.heading) * 35);
      }
      r.dani = { busy: K.busy, msg: last(/FAVOUR/) };
      off();
      // and right on his bumper, he sees you
      GAME.prefs.strangers.dani = false;
      near('dani'); K.ask('dani'); ff(0.2);
      h = K.job.husband;
      dc = car('sedan', h.pos.x - Math.sin(h.heading) * 30, h.pos.z - Math.cos(h.heading) * 30); ff(0.5);
      for (var t1 = 0; t1 < 8 * 30 && K.busy; t1++) { h = K.job.husband; put(dc, h.pos.x - Math.sin(h.heading) * 6, h.pos.z - Math.cos(h.heading) * 6); ff(1 / 30); }
      r.daniSeen = { busy: K.busy, msg: last(/FAVOUR FAILED/), inCar: P.inCar };
      off();
      GAME.prefs.strangers.dani = true;
      // --- TITO: knock the thief off, ride it back ---
      var tito = near('tito');
      K.ask('tito'); ff(1);
      var bk = K.job.bike;
      GAME.vehicles.throwRider(bk); ff(0.3);
      r.titoBack = K.job && K.job.phase;
      GAME.test.teleport(bk.pos.x + 1.5, bk.pos.z); ff(0.2);
      GAME.test.enterNearestCar(bk); ff(1.3);
      put(bk, tito.at.x + 4, tito.at.z); ff(0.5);
      r.tito = { busy: K.busy, msg: last(/FAVOUR/) };
      off();
      // --- MRS. ALBESCU: find Biscuit, walk him home; he will not get in a car ---
      var rosa = near('rosa');
      K.ask('rosa'); ff(0.2);
      var dog = K.job.dog;
      GAME.test.teleport(dog.position.x + 3, dog.position.z); ff(0.5);
      r.rosaFound = K.job && K.job.phase;
      var dc2 = GAME.vehicles.spawnCar('sedan', P.pos.x + 3, P.pos.z, 0);
      GAME.test.enterNearestCar(dc2); ff(1.3);
      var dp0 = { x: dog.position.x, z: dog.position.z };
      put(dc2, P.pos.x + 30, P.pos.z); ff(2);
      r.rosaCar = { told: /won't get in a car/.test(last(/Biscuit/)), stayed: Math.hypot(dog.position.x - dp0.x, dog.position.z - dp0.z) < 3 };
      GAME.exitCar(); ff(0.3);
      GAME.test.teleport(dog.position.x + 2, dog.position.z); ff(0.3);
      // home along the streets, at a walk — down the middle of them, so
      // with the traffic kept off you: a car that knocks you over stops the
      // favour where it stands (nothing moves on while you are down), and
      // that is not what this is about
      // (and off you in the other sense too: the walk is the test moving you
      // down the centreline, and a car stopped across it held you there
      // until the steps ran out)
      GAME.godMode = true;
      var traffic0 = GAME.settings.maxTraffic;
      GAME.settings.maxTraffic = 0;
      GAME.world.cars.slice().forEach(function (c) { if (c.occupied === 'ai' && !c.mission) GAME.vehicles.removeCar(c); });
      var way = GAME.nav.roadPath(P.pos.x, P.pos.z, rosa.at.x, rosa.at.z).map(function (n) { return [n.x, n.z]; });
      way.push([rosa.at.x, rosa.at.z]);
      for (var w = 0, wi = 0; w < 9000 && K.busy && wi < way.length; w++) {
        var dx = way[wi][0] - P.pos.x, dz = way[wi][1] - P.pos.z, dd = Math.hypot(dx, dz);
        if (dd < 1) { wi++; continue; }
        P.pos.x += dx / dd * 0.08; P.pos.z += dz / dd * 0.08; P.heading = Math.atan2(dx, dz);
        ff(1 / 60);
      }
      for (var w2 = 0; w2 < 300 && K.busy; w2++) ff(1 / 60);
      GAME.godMode = false;
      GAME.settings.maxTraffic = traffic0;
      r.rosa = { busy: K.busy, msg: last(/FAVOUR/), steps: w, legs: wi + '/' + way.length,
        you: Math.round(Math.hypot(P.pos.x - rosa.at.x, P.pos.z - rosa.at.z)), dog: Math.round(Math.hypot(dog.position.x - rosa.at.x, dog.position.z - rosa.at.z)), state: P.state };
      off();
      // --- VINCE: the bank, the wait, the heat, the lock-up — clean ---
      var vince = near('vince');
      K.ask('vince'); ff(0.2);
      var vc = car('sedan', vince.at.x + 4, vince.at.z + 3); ff(0.5);
      put(vc, K.job.bank.x, K.job.bank.z); ff(1);
      r.vinceWait = K.job && K.job.phase;
      ff(9);
      r.vinceRun = { phase: K.job && K.job.phase, wanted: GAME.police.wanted };
      put(vc, K.job.lock.x, K.job.lock.z); ff(0.5);
      r.vinceHot = K.busy;
      GAME.police.clearWanted(); ff(0.5);
      r.vince = { busy: K.busy, msg: last(/FAVOUR/) };
      off();
      // --- MARCO: a sedan will not do; a scrape is the end of the date; done right, she smiles ---
      var marco = near('marco');
      K.ask('marco'); ff(0.2);
      var sed = car('sedan', marco.at.x + 4, marco.at.z + 3); ff(0.5);
      r.marcoSedan = K.job && K.job.phase;
      off();
      var mc = car('sports', marco.at.x + 4, marco.at.z + 3); ff(0.5);
      put(mc, K.job.her.x, K.job.her.z); ff(0.6);
      r.marcoDrive = K.job && K.job.phase;
      GAME.vehicles.damageCar(mc, mc.spec.hp * 0.25, 'wall'); ff(0.3);
      r.marcoScraped = { busy: K.busy, msg: last(/FAVOUR FAILED/) };
      off();
      near('marco'); K.ask('marco'); ff(0.2);
      mc = car('sports', marco.at.x + 4, marco.at.z + 3); ff(0.5);
      put(mc, K.job.her.x, K.job.her.z); ff(0.6);
      put(mc, 346, 250); ff(0.6);
      r.marco = { busy: K.busy, msg: last(/FAVOUR/), done: K.done };
      off();
      // --- all six: Lola's tally — and the papers wait for the island's six ---
      function tally() { L.open(); L.choose(/HOW AM I/); var t = (L.says.match(/Strangers helped: \d+ of \d+/) || [''])[0]; L.close(); return t; }
      var keepIsla = GAME.isla.isOpen();
      GAME.isla.setOpen(false);
      r.paper6 = GAME.herald.printed.some(function (p) { return p.kind === 'samaritan'; });
      r.tally = tally();
      // --- across the bridges, six more ---
      GAME.isla.setOpen(true);
      r.tallyOpen = tally();
      var isle = K.people().filter(function (q) { return q.def.isla; });
      r.isleThere = isle.length === 6 && isle.every(function (q) { return GAME.isla.contains(q.at.x, q.at.z) && !C.isInWater(q.at.x, q.at.z); });
      // SAL: up to the observatory against the clock
      var sal = near('sal'); K.ask('sal'); ff(0.2);
      var sc = car('sedan', sal.at.x + 4, sal.at.z + 3); ff(0.5);
      r.salGo = { phase: K.job && K.job.phase, timer: K.job ? Math.round(K.job.timer) : 0 };
      put(sc, K.job.to.x, K.job.to.z); ff(0.5);
      r.sal = last(/FAVOUR/);
      off();
      // COOKIE: knock the cooler about and it is soup; carry it gently and it is not
      var ck = near('cookie'); K.ask('cookie'); ff(0.2);
      var cc = car('van', ck.at.x + 4, ck.at.z + 3); ff(0.5);
      GAME.vehicles.damageCar(cc, cc.spec.hp * 0.3, 'wall'); ff(0.3);
      r.cookieSoup = last(/FAVOUR FAILED/);
      off();
      near('cookie'); K.ask('cookie'); ff(0.2);
      cc = car('van', ck.at.x + 4, ck.at.z + 3); ff(0.5);
      put(cc, K.job.to.x, K.job.to.z); ff(0.5);
      r.cookie = last(/FAVOUR/);
      off();
      // NINA: a picture facing away is no use; one with the tower in it is
      near('nina'); K.ask('nina'); ff(0.2);
      var tw = K.job.tower, vp = C.nearestRoadPoint(tw.x - 70, tw.z - 40);
      GAME.test.teleport(vp.x, vp.z); ff(0.3);
      P.heading = Math.atan2(tw.x - P.pos.x, tw.z - P.pos.z) + Math.PI; GAME.cam.yaw = P.heading; ff(0.5);
      GAME.photo.snap(); ff(0.3);
      r.ninaMiss = { busy: K.busy, msg: last(/lighthouse/) };
      // (the camera develops a picture on the next frame drawn, and takes no
      // other till it has: let one be drawn)
      await new Promise(function (res) { setTimeout(res, 400); });
      P.heading = Math.atan2(tw.x - P.pos.x, tw.z - P.pos.z); GAME.cam.yaw = P.heading; ff(0.5);
      GAME.photo.snap(); ff(0.3);
      r.nina = last(/FAVOUR/);
      off();
      // GUS: a boat out to the dinghy, and back to the marina
      near('gus'); K.ask('gus'); ff(0.2);
      var dg = K.job.dinghy, bt = GAME.vehicles.spawnCar('boat', dg.pos.x + 20, dg.pos.z, 0);
      bt.pos.y = C.seaY(bt.pos.x, bt.pos.z);
      GAME.test.teleport(bt.pos.x + 3, bt.pos.z); ff(0.3); GAME.test.enterNearestCar(bt); ff(1.3);
      put(bt, dg.pos.x + 8, dg.pos.z); bt.pos.y = C.seaY(bt.pos.x, bt.pos.z); ff(0.5);
      r.gusAboard = K.job && K.job.phase;
      var hm = K.job.home, wet = null;
      for (var rr = 10; rr < 120 && !wet; rr += 5) for (var aa = 0; aa < 6.28 && !wet; aa += 0.2) {
        var wx = hm.x + Math.cos(aa) * rr, wz = hm.z + Math.sin(aa) * rr;
        if (C.isBoatWater(wx, wz)) wet = { x: wx, z: wz };
      }
      put(bt, wet.x, wet.z); bt.pos.y = C.seaY(wet.x, wet.z); ff(0.5);
      r.gus = last(/FAVOUR/);
      off();
      // LUPE: sit still and he has his picture; get clear and he has nothing
      var lp = near('lupe'); K.ask('lupe'); ff(0.2);
      var lc = car('sports', lp.at.x + 4, lp.at.z + 3); ff(0.5);
      for (var ls = 0; ls < 20 && K.busy; ls++) ff(1);
      r.lupeSnapped = last(/FAVOUR FAILED/);
      off();
      near('lupe'); K.ask('lupe'); ff(0.2);
      lc = car('sports', lp.at.x + 4, lp.at.z + 3); ff(0.5);
      var far = C.nearestRoadPoint(lc.pos.x + 260, lc.pos.z);
      put(lc, far.x, far.z); ff(6);
      r.lupe = last(/FAVOUR/);
      off();
      // WALT: he runs; put him down and the money goes back to Walt
      var wt = near('walt'); K.ask('walt'); ff(0.2);
      var man = K.job.man;
      GAME.test.teleport(man.pos.x + 15, man.pos.z); ff(1);
      r.waltRan = man.state;
      GAME.peds.kill(man, 'gun', true); ff(0.3);
      GAME.test.teleport(wt.at.x + 3, wt.at.z); ff(0.5);
      r.walt = last(/FAVOUR/);
      off();
      GAME.herald.resetCooldown();
      r.paper = GAME.herald.printed.some(function (p) { return p.kind === 'samaritan'; });
      r.tallyAll = tally();
      GAME.isla.setOpen(keepIsla);
      // --- X twice walks away from one ---
      GAME.prefs.strangers.ray = false;
      near('ray'); K.ask('ray'); ff(0.2);
      GAME.test.pressKey('KeyX', true); ff(1 / 60); GAME.test.pressKey('KeyX', false); ff(0.3);
      r.oneX = K.busy;
      GAME.test.pressKey('KeyX', true); ff(1 / 60); GAME.test.pressKey('KeyX', false); ff(0.3);
      r.twoX = { busy: K.busy, msg: last(/FAVOUR FAILED/), backOut: !!ray.ped };
    } finally {
      GAME.hud.message = ms0;
      off();
      K.reset(); K.enabled = false;
      GAME.prefs = JSON.parse(keepPrefs); P.cash = keepCash;
      GAME.test.teleport(-60, 40); ff(0.5);
    }
    return r;
  });
  check('strangers: twelve of them, both islands, on the pavement, off every road and clear of the walls',
    sg.spots.length === 12 && sg.spots.every(function (s) { return s.road >= 6.6 && s.clear; }), JSON.stringify(sg.spots));
  check('strangers: come near and one is there, marked, and on the radar', sg.there.ped && sg.there.mark && sg.there.blip, JSON.stringify(sg.there));
  check('strangers: walk up and they ask, in their own name, yes or no',
    sg.asks.open && /RAY/.test(sg.asks.from) && sg.asks.opts.length === 2, JSON.stringify(sg.asks));
  check('strangers: no is no — until you walk off and come back', !sg.declined.open && !sg.declined.busy && sg.notAgainYet && sg.asksAgain,
    JSON.stringify({ d: sg.declined, notYet: sg.notAgainYet, again: sg.asksAgain }));
  check('strangers: a favour under way, no mission ring starts', sg.ringBlocked);
  check('strangers: RAY — in a car, against the clock, routed to the airport, and paid',
    sg.rayCar.phase === 'car' && sg.rayGo.phase === 'drive' && sg.rayGo.timer >= 70 && sg.rayGo.route > 1 && /AIRPORT RUSH/.test(sg.rayDone.msg) && !sg.rayDone.busy && sg.rayGoneForGood,
    JSON.stringify({ car: sg.rayCar, go: sg.rayGo, done: sg.rayDone, gone: sg.rayGoneForGood }));
  check('strangers: DANI — tail him to the motel', !sg.dani.busy && /FOLLOW THAT CAR/.test(sg.dani.msg), JSON.stringify(sg.dani));
  check('strangers: and on his bumper, he sees you', !sg.daniSeen.busy && /saw you/.test(sg.daniSeen.msg), JSON.stringify(sg.daniSeen));
  check('strangers: TITO — knock the thief off, ride the bike back', sg.titoBack === 'back' && !sg.tito.busy && /STOLEN BIKE/.test(sg.tito.msg), JSON.stringify({ back: sg.titoBack, done: sg.tito }));
  check('strangers: BISCUIT — found, walked home; he will not get in a car',
    sg.rosaFound === 'home' && sg.rosaCar.told && sg.rosaCar.stayed && !sg.rosa.busy && /BISCUIT/.test(sg.rosa.msg), JSON.stringify({ found: sg.rosaFound, car: sg.rosaCar, done: sg.rosa }));
  check('strangers: VINCE — wait at the bank, take the heat, and the lock-up only once it is off',
    sg.vinceWait === 'wait' && sg.vinceRun.phase === 'run' && sg.vinceRun.wanted >= 3 && sg.vinceHot && !sg.vince.busy && /NO-SHOW/.test(sg.vince.msg),
    JSON.stringify({ wait: sg.vinceWait, run: sg.vinceRun, hot: sg.vinceHot, done: sg.vince }));
  check('strangers: MARCO — a sedan will not do, and a scrape ends the date',
    sg.marcoSedan === 'car' && sg.marcoDrive === 'drive' && !sg.marcoScraped.busy && /driving/.test(sg.marcoScraped.msg), JSON.stringify({ sedan: sg.marcoSedan, drive: sg.marcoDrive, scraped: sg.marcoScraped }));
  check('strangers: and done right, she smiles', !sg.marco.busy && /A DATE IN STYLE/.test(sg.marco.msg) && sg.marco.done === 6, JSON.stringify(sg.marco));
  check('strangers: Lola keeps the tally — six while the bridges are shut, and no papers yet',
    sg.tally === 'Strangers helped: 6 of 6' && !sg.paper6, JSON.stringify({ tally: sg.tally, paper: sg.paper6 }));
  check('strangers: the bridges open, and six more wait on Isla Verde', sg.tallyOpen === 'Strangers helped: 6 of 12' && sg.isleThere,
    JSON.stringify({ tally: sg.tallyOpen, there: sg.isleThere }));
  check('strangers: SAL — up to the observatory against the clock', sg.salGo.phase === 'drive' && sg.salGo.timer >= 70 && /STARGAZER/.test(sg.sal), JSON.stringify({ go: sg.salGo, msg: sg.sal }));
  check('strangers: COOKIE — knocked about it is soup; carried gently it is not', /soup/.test(sg.cookieSoup) && /MELTDOWN/.test(sg.cookie), JSON.stringify({ soup: sg.cookieSoup, done: sg.cookie }));
  check('strangers: NINA — a picture facing away is no use; the lighthouse in frame is the cover',
    sg.ninaMiss.busy && /No lighthouse/.test(sg.ninaMiss.msg) && /LIGHTHOUSE SHOT/.test(sg.nina), JSON.stringify({ miss: sg.ninaMiss, done: sg.nina }));
  check('strangers: GUS — out to the dinghy in a boat, and his brother back to the marina', sg.gusAboard === 'back' && /MAN OVERBOARD/.test(sg.gus), JSON.stringify({ aboard: sg.gusAboard, done: sg.gus }));
  check('strangers: LUPE — sit still and he gets his picture; get clear and he has nothing', /his picture/.test(sg.lupeSnapped) && /NO PICTURES/.test(sg.lupe),
    JSON.stringify({ snapped: sg.lupeSnapped, done: sg.lupe }));
  check('strangers: WALT — the man runs; put him down and take the money back', sg.waltRan === 'flee' && /WHAT HE OWES/.test(sg.walt), JSON.stringify({ ran: sg.waltRan, done: sg.walt }));
  check('strangers: all twelve, both islands, and the papers have heard', sg.tallyAll === 'Strangers helped: 12 of 12' && sg.paper, JSON.stringify({ tally: sg.tallyAll, paper: sg.paper }));
  check('strangers: X twice walks away from a favour, and they are back on the pavement',
    sg.oneX === true && !sg.twoX.busy && /walked away/.test(sg.twoX.msg) && sg.twoX.backOut, JSON.stringify({ one: sg.oneX, two: sg.twoX }));

  // ---------- 5t: the big score ----------
  // Lola's job on the Savings & Loan, part by part: the camera, Benny, the
  // car through the paint shop, and the bank itself — the floor kept or
  // not, the vault, the bags, the street outside, and the lock-up.
  var hz = await page.evaluate(async function () {
    var r = {}, P = GAME.player, C = GAME.city, H = GAME.heist, ff = function (s) { GAME.test.fastForward(s); };
    var wait = function (ms) { return new Promise(function (res) { setTimeout(res, ms); }); };
    async function developed() { for (var i = 0; i < 80 && GAME.photo.pending; i++) await wait(100); }
    var keepPrefs = JSON.stringify(GAME.prefs), keepCash = P.cash, keepIsla = GAME.isla.isOpen();
    var msgs = [], ms0 = GAME.hud.message, pages = [], pg0 = GAME.hud.pager;
    GAME.hud.message = function (t) { msgs.push(String(t)); return ms0.apply(GAME.hud, arguments); };
    GAME.hud.pager = function (f, t) { pages.push(String(t)); return pg0.apply(GAME.hud, arguments); };
    function last(re) { for (var i = msgs.length - 1; i >= 0; i--) if (re.test(msgs[i])) return msgs[i]; return ''; }
    function out() { if (GAME.interiors.current) { GAME.interiors.leave(); ff(0.8); } if (P.inCar) GAME.exitCar(); GAME.police.clearWanted(); ff(0.3); }
    // (a part that did not come off is left as done, so the parts after it
    // are still looked at — its own check says what went wrong)
    function onTo(n) { if (H.busy) H.abandon(); if (H.step < n) H.step = n; ff(0.2); }
    try {
      out();
      // --- the bank, on the strip, with a vault ---
      var b = H.bank(), rm = H.room();
      r.bank = { there: !!b && Math.abs(b.at.x - 337) < 20 && Math.abs(b.at.z - 4) < 25, name: b && b.name, room: !!(rm && rm.bank), vault: !!(rm && rm.bank && rm.bank.door) };
      // --- not before the bridges open; then Lola has it on her menu ---
      GAME.isla.setOpen(false);
      H.reset();
      r.shut = { offered: H.offered(), began: H.begin() };
      GAME.isla.setOpen(true);
      GAME.lola.open();
      r.menu = GAME.lola.options().some(function (o) { return /BIG SCORE/.test(o); });
      GAME.lola.choose(/BIG SCORE/);
      r.board = GAME.lola.says;
      r.boardNext = GAME.lola.options().filter(function (o) { return /CASE IT/.test(o); })[0] || null;
      GAME.lola.choose(/CASE IT/); ff(0.2);
      r.caseOn = H.busy && H.step === 0;
      // --- 1. CASE IT: the front from across the street; the vault from inside ---
      var rp = C.nearestRoadPoint(b.at.x, b.at.z), dl = Math.hypot(b.at.x - rp.x, b.at.z - rp.z);
      var nx = (rp.x - b.at.x) / dl, nz = (rp.z - b.at.z) / dl;
      GAME.test.teleport(b.at.x + nx * 32, b.at.z + nz * 32); ff(0.3);
      P.heading = Math.atan2(b.at.x - P.pos.x, b.at.z - P.pos.z) + Math.PI; GAME.cam.yaw = P.heading; GAME.cam.pitch = 0.1; ff(0.5);
      GAME.photo.snap(); ff(0.3);
      r.caseAway = { front: !!(H.job && H.job.front), msg: last(/bank|front/i) };
      await developed();
      P.heading = Math.atan2(b.at.x - P.pos.x, b.at.z - P.pos.z); GAME.cam.yaw = P.heading; ff(0.5);
      var snapped = GAME.photo.snap(); ff(0.3);
      r.caseFront = !!(H.job && H.job.front);
      if (!r.caseFront) {
        var cp = GAME.cameraObj.position, gyb = C.groundY(b.at.x, b.at.z);
        r.frontWhy = { snapped: snapped, msg: last(/bank|front|close|far/i), cam: [cp.x, cp.y, cp.z].map(Math.round), P: [P.pos.x, P.pos.z].map(Math.round),
          seen: GAME.inPlainView(b.at.x - nx * 0.8, gyb + 5, b.at.z - nz * 0.8), tod: +(GAME.timeOfDay || 0).toFixed(2), weather: GAME.weather && GAME.weather.mode, fog: GAME.scene.fog && Math.round(GAME.scene.fog.far), inCar: P.inCar, state: P.state };
      }
      await developed();
      GAME.interiors.enter(b); ff(0.8);
      var V = rm.bank.vaultFace;
      P.pos.x = V.x; P.pos.z = V.z - 6; P.heading = 0; GAME.cam.yaw = 0; GAME.cam.pitch = 0.05; ff(0.5);
      GAME.photo.snap(); ff(0.3);
      r.caseDone = { step: H.step, busy: H.busy, msg: last(/CASE IT/), page: /Benny/.test(pages[pages.length - 1] || '') };
      await developed();
      out();
      onTo(1);
      // --- 2. THE EAR: Benny by the marina, into a car, to the lock-up ---
      H.begin(); ff(0.2);
      var spot = H.job.spot, L = H.LOCKUP;
      r.benny = { isla: GAME.isla.contains(spot.x, spot.z), nearMarina: Math.hypot(spot.x - C.islaPois.marina.x, spot.z - C.islaPois.marina.z) < 80 };
      var rp1 = C.nearestRoadPoint(spot.x, spot.z);
      var c1 = GAME.vehicles.spawnCar('sedan', rp1.x, rp1.z, 0);
      GAME.test.teleport(rp1.x + 2, rp1.z); ff(0.3); GAME.test.enterNearestCar(c1); ff(1.3);
      c1.speed = 0;
      for (var t = 0; t < 10 * 60 && H.job && H.job.phase !== 'ride'; t++) ff(1 / 60);
      r.benny.aboard = H.job && H.job.phase === 'ride';
      c1.pos.x = L.x; c1.pos.z = L.z; c1.speed = 0; ff(0.5);
      r.earDone = { step: H.step, busy: H.busy };
      out(); GAME.vehicles.removeCar(c1);
      onTo(2);
      // --- 3. THE WHEELS: a sedan will not do; a Vulture GT, resprayed, will ---
      H.begin(); ff(0.2);
      var door = C.pois.resprays[0].door;
      var sd = GAME.vehicles.spawnCar('sedan', door.x + 20, door.z + 4, 0);
      GAME.test.teleport(door.x + 22, door.z + 4); ff(0.3); GAME.test.enterNearestCar(sd); ff(1.3);
      r.wrongCar = /Not that/.test(H.job.obj || '');
      out(); GAME.vehicles.removeCar(sd);
      var sc = GAME.vehicles.spawnCar('sports', door.x + 20, door.z, 0);
      GAME.test.teleport(door.x + 22, door.z); ff(0.3); GAME.test.enterNearestCar(sc); ff(1.3);
      sc.pos.x = L.x; sc.pos.z = L.z; sc.speed = 0; ff(0.5);
      r.unpainted = { step: H.step, obj: H.job && H.job.obj };
      var col0 = sc.color; P.cash = Math.max(P.cash, 500);
      sc.pos.x = door.x; sc.pos.z = door.z; sc.speed = 0; ff(1);
      r.paint = { changed: sc.color !== col0, body: sc.mesh.userData.bodyMesh.geometry !== null };
      sc.pos.x = L.x; sc.pos.z = L.z; sc.speed = 0; ff(0.5);
      r.wheelsDone = { step: H.step, stored: GAME.prefs.heist.car && GAME.prefs.heist.car.color === sc.color, gone: sc.gone };
      out();
      onTo(3);
      // --- 4. THE JOB: walking out on Benny is the end of this try, not of the job ---
      H.begin(); ff(0.2);
      GAME.test.teleport(L.x + 3, L.z); ff(1);
      var hc = H.job && H.job.car, kept = GAME.prefs.heist.car;
      r.ride = !!hc && !!kept && hc.color === kept.color && hc.type === 'sports';
      if (!hc) throw new Error('no car at the lock-up: ' + JSON.stringify({ busy: H.busy, step: H.step, phase: H.job && H.job.phase }));
      GAME.test.enterNearestCar(hc); ff(1.3);
      hc.pos.x = b.at.x + nx * 6; hc.pos.z = b.at.z + nz * 6; hc.speed = 0; ff(0.5);
      GAME.exitCar(); ff(0.3);
      GAME.interiors.enter(b); ff(0.8);
      r.handsUp = rm.bank.tellers.every(function (f) { return f.userData.pose === 'up'; });
      GAME.interiors.leave(); ff(0.8);
      r.walkedOut = { busy: H.busy, step: H.step, msg: last(/is off/), handsDown: rm.bank.tellers.every(function (f) { return !f.userData.pose; }) };
      out();
      // --- and again: one try for the alarm stopped, one let go; the vault; the bags; out ---
      H.begin(); ff(0.2);
      GAME.test.teleport(L.x + 3, L.z); ff(1);
      hc = H.job && H.job.car;
      if (!hc) throw new Error('no car at the lock-up, second try');
      GAME.test.enterNearestCar(hc); ff(1.3);
      hc.pos.x = b.at.x + nx * 6; hc.pos.z = b.at.z + nz * 6; hc.speed = 0; ff(0.5);
      GAME.exitCar(); ff(0.3);
      GAME.interiors.enter(b); ff(0.8);
      var stopped = 0, missed = 0;
      for (var t2 = 0; t2 < 40 * 60 && H.job && H.job.phase === 'floor'; t2++) {
        var rr = H.job.reach;
        if (rr && !rr.seen) { rr.seen = true; if (!stopped) { P.pos.x = rr.x; P.pos.z = rr.z; stopped++; } else missed++; }
        if (stopped === 1 && rr && rr.seen && !r.stopMsg) { ff(1 / 60); r.stopMsg = last(/thinks better|puts it down/); }
        ff(1 / 60);
      }
      r.floor = { phase: H.job && H.job.phase, alarm: H.job && H.job.alarm, stopped: stopped, missed: missed };
      var vt = rm.bank.vault; P.pos.x = vt.x; P.pos.z = vt.z; ff(2);
      r.bags = { phase: H.job && H.job.phase, door: rm.bank.door.rotation.y < -1 };
      GAME.interiors.leave(); ff(0.8);
      r.street = { phase: H.job && H.job.phase, wanted: GAME.police.wanted };
      GAME.police.clearWanted(); ff(0.3);
      var c0 = P.cash, tot0 = GAME.herald.total;
      GAME.herald.resetCooldown();
      GAME.test.teleport(L.x + 2, L.z); ff(0.5);
      r.payday = { paid: P.cash - c0, step: H.step, busy: H.busy, paper: GAME.herald.total > tot0 && GAME.herald.printed[GAME.herald.printed.length - 1].kind === 'heist',
        card: !!GAME.shareOpen, offered: H.offered(), bank: rm.bank.door.rotation.y === 0 && !rm.bank.trolley.visible };
      if (GAME.share && GAME.share.isOpen) GAME.share.hide();
      // --- X twice walks away from a part, which waits to be done again ---
      H.reset(); H.begin(); ff(0.2);
      GAME.test.pressKey('KeyX', true); ff(1 / 60); GAME.test.pressKey('KeyX', false); ff(0.3);
      GAME.test.pressKey('KeyX', true); ff(1 / 60); GAME.test.pressKey('KeyX', false); ff(0.3);
      r.abandoned = { busy: H.busy, step: H.step, msg: last(/walked away/) };
    } catch (e) {
      r.error = String((e && e.message) || e);
    } finally {
      GAME.hud.message = ms0; GAME.hud.pager = pg0;
      out();
      H.reset(); H.enabled = false;
      GAME.isla.setOpen(keepIsla);
      GAME.prefs = JSON.parse(keepPrefs); P.cash = keepCash;
      if (GAME.share && GAME.share.isOpen) GAME.share.hide();
      GAME.test.teleport(-60, 40); ff(0.5);
    }
    return r;
  });
  check('heist: the whole run goes through (anchor sanity)', !hz.error, hz.error);
  if (hz.error) hz = Object.assign({ shut: {}, caseAway: {}, caseDone: {}, benny: {}, earDone: {}, unpainted: {}, paint: {}, wheelsDone: {}, walkedOut: {}, floor: {}, bags: {}, street: {}, payday: {}, abandoned: {} }, hz);
  check('heist: a Savings & Loan on the strip, with a vault inside', hz.bank.there && hz.bank.room && hz.bank.vault, JSON.stringify(hz.bank));
  check('heist: not before the bridges open', !hz.shut.offered && !hz.shut.began, JSON.stringify(hz.shut));
  check('heist: then Lola has THE BIG SCORE on her menu, and the first part to go and do', hz.menu && /Savings & Loan/.test(hz.board) && !!hz.boardNext && hz.caseOn, JSON.stringify({ menu: hz.menu, next: hz.boardNext, on: hz.caseOn }));
  check('heist: CASE IT — a picture of the wrong way is no use; the front, and the vault inside, are',
    !hz.caseAway.front && hz.caseFront && hz.caseDone.step === 1 && !hz.caseDone.busy && /DONE/.test(hz.caseDone.msg) && hz.caseDone.page, JSON.stringify({ away: hz.caseAway, front: hz.caseFront, why: hz.frontWhy, done: hz.caseDone }));
  check('heist: THE EAR — Benny waits by the marina on Isla Verde, gets in, and is taken to the lock-up',
    hz.benny.isla && hz.benny.nearMarina && hz.benny.aboard && hz.earDone.step === 2 && !hz.earDone.busy, JSON.stringify({ benny: hz.benny, done: hz.earDone }));
  check('heist: THE WHEELS — a sedan will not do, nor a Vulture GT nobody has painted', hz.wrongCar && hz.unpainted.step === 2 && /paint/.test(hz.unpainted.obj || ''), JSON.stringify({ wrong: hz.wrongCar, unpainted: hz.unpainted }));
  check('heist: the paint shop sends a car out another colour', hz.paint.changed, JSON.stringify(hz.paint));
  check('heist: and the fresh-painted GT goes under the tarp at the lock-up', hz.wheelsDone.step === 3 && hz.wheelsDone.stored && hz.wheelsDone.gone, JSON.stringify(hz.wheelsDone));
  check('heist: THE JOB — the same car waits at the lock-up, and in the bank the hands go up', hz.ride && hz.handsUp, JSON.stringify({ ride: hz.ride, up: hz.handsUp }));
  check('heist: walking out on Benny ends the try, not the job', !hz.walkedOut.busy && hz.walkedOut.step === 3 && /is off/.test(hz.walkedOut.msg) && hz.walkedOut.handsDown, JSON.stringify(hz.walkedOut));
  check('heist: keep the floor — reach one in time and they think better of it; miss one and the alarm goes',
    hz.floor.stopped === 1 && hz.floor.missed >= 1 && hz.floor.alarm === true && /thinks better|puts it down/.test(hz.stopMsg || ''), JSON.stringify({ floor: hz.floor, stop: hz.stopMsg }));
  check('heist: the vault swings, the bags are yours, and outside the alarm has the street waiting — four stars',
    hz.bags.door && hz.bags.phase === 'out' && hz.street.phase === 'run' && hz.street.wanted === 4, JSON.stringify({ bags: hz.bags, street: hz.street }));
  check('heist: lose them, back to the lock-up: $25,000, the front page, a card, and it is done',
    hz.payday.paid === 25000 && hz.payday.step === 4 && !hz.payday.busy && hz.payday.paper && hz.payday.card && !hz.payday.offered && hz.payday.bank, JSON.stringify(hz.payday));
  check('heist: X twice walks away from a part, which waits to be done again', !hz.abandoned.busy && hz.abandoned.step === 0 && /walked away/.test(hz.abandoned.msg), JSON.stringify(hz.abandoned));

  // ---------- 5u: businesses that pay ----------
  // Buy the barber outright at its counter, let a day's trade fill the
  // till, empty it; leave it and it stops at three days, and Lola says so
  // once. And a hold-up there takes the till — stop the thief and the bag
  // is your own takings.
  var bz = await page.evaluate(function () {
    var r = {}, P = GAME.player, B = GAME.business, SH = GAME.shops, S = GAME.streetlife, ff = function (s) { GAME.test.fastForward(s); };
    var keepPrefs = JSON.stringify(GAME.prefs), keepCash = P.cash, lvl0 = GAME.chaos.level;
    var msgs = [], ms0 = GAME.hud.message, pages = [], pg0 = GAME.hud.pager;
    GAME.hud.message = function (t) { msgs.push(String(t)); return ms0.apply(GAME.hud, arguments); };
    GAME.hud.pager = function (f, t) { pages.push(String(t)); return pg0.apply(GAME.hud, arguments); };
    function last(re) { for (var i = msgs.length - 1; i >= 0; i--) if (re.test(msgs[i])) return msgs[i]; return ''; }
    function row(id) { return SH.items(SH.current || { id: 'none', kind: 'none' }).filter(function (q) { return q.id === id; })[0] || null; }
    try {
      if (P.inCar) GAME.exitCar();
      GAME.police.clearWanted(); S.reset(); B.reset();
      P.cash = 100000;
      // --- for sale at its own counter ---
      SH.open('barber0');
      var buyRow = row('biz_buy');
      r.forSale = buyRow && { price: buyRow.price, ds: buyRow.ds };
      var c0 = P.cash;
      SH.buy('biz_buy');
      r.bought = { owns: B.owns('barber0'), paid: c0 - P.cash, till: row('biz_till') && row('biz_till').off, msg: last(/is yours/) };
      SH.close();
      // --- a day's trade, and the till emptied ---
      B.accrue(GAME.DAY_SECONDS);
      r.day = B.till('barber0');
      SH.open('barber0');
      var c1 = P.cash;
      r.tillRow = row('biz_till') && row('biz_till').ds;
      SH.buy('biz_till');
      r.took = { got: P.cash - c1, till: B.till('barber0') };
      SH.close();
      // --- left five days, it stops at three, and Lola pages once ---
      var p0 = pages.length;
      B.accrue(GAME.DAY_SECONDS * 5);
      B.accrue(GAME.DAY_SECONDS);
      r.full = { till: B.till('barber0'), cap: B.cap('barber0'), pages: pages.slice(p0).filter(function (t) { return /till at/.test(t); }).length };
      var at = SH.locations().filter(function (l) { return l.id === 'barber0'; })[0].at;
      r.blip = (SH.blips().filter(function (b) { return Math.abs(b.x - at.x) < 0.1 && Math.abs(b.z - at.z) < 0.1; })[0] || {}).color;
      // --- a hold-up there: he runs with the till; put him down and it is on the pavement ---
      GAME.chaos.set(3);
      var robAt = GAME.city.nearestRoadPoint(at.x + 70, at.z);
      GAME.test.teleport(robAt.x, robAt.z); ff(0.5);
      var full = B.till('barber0');
      r.robOn = S.start('robbery');
      var ev = S.event;
      r.rob = ev && { shop: ev.shop.id, stolen: ev.stolen, till: B.till('barber0'), msg: last(/STOP, THIEF/) };
      if (ev) {
        ff(2);
        GAME.peds.kill(ev.thief, 'gun', true); ff(0.3);
        var bag = GAME.world.pickups.filter(function (q) { return q.amount === full; })[0];
        r.bag = bag ? bag.amount : 0;
        if (bag) { var c2 = P.cash; GAME.test.teleport(bag.pos.x, bag.pos.z); ff(0.4); r.backInHand = P.cash - c2; }
      }
      S.reset();
      // --- the bar in the Lucky Gull is for sale too ---
      SH.open(GAME.interiors.bar);
      r.bar = (row('biz_buy') || {}).price;
      SH.close();
      // --- and Lola knows ---
      GAME.lola.open(); GAME.lola.choose(/WHERE'S THE MONEY/); r.money = GAME.lola.says;
      GAME.lola.close(); GAME.lola.open(); GAME.lola.choose(/HOW AM I DOING/); r.how = GAME.lola.says; GAME.lola.close();
    } finally {
      GAME.hud.message = ms0; GAME.hud.pager = pg0;
      if (SH.current) SH.close();
      if (GAME.lolaOpen) GAME.lola.close();
      S.reset(); GAME.police.clearWanted();
      GAME.chaos.set(lvl0);
      GAME.prefs = JSON.parse(keepPrefs); P.cash = keepCash;
      GAME.test.teleport(-60, 40); ff(0.5);
    }
    return r;
  });
  check('business: the barber is for sale at its own counter, and buying it is $12,000',
    bz.forSale && bz.forSale.price === 12000 && bz.bought.owns && bz.bought.paid === 12000 && bz.bought.till === true && /is yours/.test(bz.bought.msg), JSON.stringify({ sale: bz.forSale, bought: bz.bought }));
  check('business: a day\'s trade fills the till, and THE TILL empties it into your pocket',
    bz.day === 600 && /\$600 waiting/.test(bz.tillRow || '') && bz.took.got === 600 && bz.took.till === 0, JSON.stringify({ day: bz.day, row: bz.tillRow, took: bz.took }));
  check('business: left, it holds three days, and Lola says so once', bz.full.till === bz.full.cap && bz.full.cap === 1800 && bz.full.pages === 1, JSON.stringify(bz.full));
  check('business: a place of yours is green on the radar', bz.blip === '#5dff9e', String(bz.blip));
  check('business: a hold-up at yours takes the till; put the thief down and it is all in the bag',
    // (back in hand is the bag and whatever loose change he dropped beside it)
    bz.robOn && bz.rob.shop === 'barber0' && bz.rob.stolen === 1800 && bz.rob.till === 0 && /your place/.test(bz.rob.msg) && bz.bag === 1800 && bz.backInHand >= 1800 && bz.backInHand < 1900,
    JSON.stringify({ rob: bz.rob, bag: bz.bag, back: bz.backInHand }));
  check('business: the bar in the Lucky Gull is for sale too', bz.bar === 45000, String(bz.bar));
  check('business: and Lola counts them, and says where the money is', /business/i.test(bz.money || '') && /Businesses: 1 of 6/.test(bz.how || ''), JSON.stringify({ money: bz.money, how: bz.how }));

  // ---------- 5v: boats on Isla Verde, and the depot on the legend ----------
  // The island had one speedboat, at the marina, and the map left its anchor
  // off while the bridges were shut — so it read as an island with no boats.
  // Now the marina has a jet ski beside it and the east-coast cove has a
  // jetty with a speedboat and a jet ski. Each one floats, and can be boarded
  // and taken out. And the depot is under Shops & property, not a row of its
  // own: solo Shops and its badge stays; solo anything else and it goes.
  var iv = await page.evaluate(function () {
    var r = {}, C = GAME.city, P = GAME.player, H = GAME.hud, ff = function (s) { GAME.test.fastForward(s); };
    var wasOpen = GAME.isla.isOpen(), solo0 = (GAME.prefs || {}).mapSolo || null;
    try {
      if (P.inCar) GAME.exitCar();
      GAME.police.clearWanted();
      GAME.isla.setOpen(true);
      var mo = C.moorings.filter(function (m) { return m.isla; });
      r.moorings = mo.map(function (m) {
        var spots = C.parkedSpots.filter(function (s) { return s.x === m.x && s.z === m.z; });
        return { x: Math.round(m.x), z: Math.round(m.z), type: m.vtype || 'boat', wet: C.isBoatWater(m.x, m.z),
          spot: spots.length === 1 && !!spots[0].isla };
      });
      r.jetty = !!C.islaPois.coveJetty;
      // the cove's speedboat: walk out along the jetty, board it, take it out
      var cb = mo.filter(function (m) { return C.islaPois.coveJetty && Math.abs(m.x - C.islaPois.coveJetty.x) < 40 && !m.vtype; })[0];
      if (cb) {
        GAME.test.teleport(cb.x, cb.z - 3); ff(1.0);
        r.onPlanks = { y: +P.pos.y.toFixed(2), swimming: !!P.swimming };
        var sp = C.parkedSpots.filter(function (s) { return s.x === cb.x && s.z === cb.z; })[0];
        var boat = sp && sp.live;
        r.spawned = boat ? boat.type : null;
        if (boat) {
          GAME.test.enterNearestCar(boat); ff(1.5);
          r.aboard = P.inCar && P.car === boat;
          var p0 = { x: boat.pos.x, z: boat.pos.z };
          GAME.test.pressKey('KeyW', true); ff(4); GAME.test.pressKey('KeyW', false);
          r.away = Math.round(Math.hypot(boat.pos.x - p0.x, boat.pos.z - p0.z));
          r.stillWet = C.isBoatWater(boat.pos.x, boat.pos.z);
          if (P.inCar) GAME.exitCar(); ff(0.3);
        }
      }
      // the legend: one row for shops, property and the depot
      H.toggleMap(true);
      var legend = Array.prototype.map.call(document.querySelectorAll('#map-legend .lgd'), function (e) {
        return { k: e.getAttribute('data-k'), t: e.textContent };
      });
      r.legendKeys = legend.map(function (l) { return l.k; });
      r.shopsRow = (legend.filter(function (l) { return l.k === 'shops'; })[0] || {}).t || '';
      // the depot badge (its cream, nowhere else on the map) under each solo
      function depotInk() {
        var cv = document.getElementById('bigmap'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, n = 0;
        for (var i = 0; i < d.length; i += 4) if (d[i] > 245 && Math.abs(d[i + 1] - 233) < 8 && Math.abs(d[i + 2] - 176) < 10) n++;
        return n;
      }
      if (solo0) H.testToggleCat(solo0);            // start from no solo
      r.inkAll = depotInk();
      H.testToggleCat('shops'); H.toggleMap(false); H.toggleMap(true);
      r.inkShops = depotInk();
      H.testToggleCat('shops'); H.testToggleCat('health'); H.toggleMap(false); H.toggleMap(true);
      r.inkHealth = depotInk();
      H.testToggleCat('health');
      H.toggleMap(false);
    } finally {
      if (GAME.mapOpen) H.toggleMap(false);
      if (P.inCar) GAME.exitCar();
      GAME.prefs = GAME.prefs || {};
      if (((GAME.prefs.mapSolo) || null) !== solo0) H.testToggleCat(solo0 || GAME.prefs.mapSolo);
      GAME.isla.setOpen(wasOpen);
      GAME.test.teleport(-60, 40); ff(0.5);
    }
    return r;
  });
  check('isla boats: the island has four moorings — two at the marina, two at the cove jetty — each on open water with one boat',
    iv.moorings.length === 4 && iv.jetty && iv.moorings.every(function (m) { return m.wet && m.spot; }) &&
    iv.moorings.filter(function (m) { return m.type === 'jetski'; }).length === 2, JSON.stringify(iv.moorings));
  check('isla boats: the cove jetty holds you up beside its speedboat',
    iv.onPlanks && !iv.onPlanks.swimming && iv.onPlanks.y > 0.5, JSON.stringify(iv.onPlanks));
  check('isla boats: and the speedboat is there, takes you aboard, and goes',
    iv.spawned === 'boat' && iv.aboard && iv.away > 20 && iv.stillWet, JSON.stringify({ spawned: iv.spawned, aboard: iv.aboard, away: iv.away, wet: iv.stillWet }));
  check('map legend: the depot rides with Shops & property, not a row of its own',
    iv.legendKeys.indexOf('icecream') < 0 && iv.legendKeys.indexOf('shops') >= 0 && /Depot/.test(iv.shopsRow), JSON.stringify({ keys: iv.legendKeys, shops: iv.shopsRow }));
  check('map legend: solo Shops and the depot stays; solo Health and it goes',
    iv.inkAll > 20 && iv.inkShops > 20 && iv.inkHealth === 0, JSON.stringify({ all: iv.inkAll, shops: iv.inkShops, health: iv.inkHealth }));

  // ---------- 5w: under a bridge, the camera stays under it ----------
  // Taking a boat under a span blacked the screen out: the "never below the
  // ground" floor read the deck overhead as the ground and lifted the camera
  // onto the roadway, looking down through it. Cross under one at speed,
  // once with the camera where it sits and once looked steeply up, and it
  // has to stay under the girder the whole way.
  var bc = await page.evaluate(function () {
    var C = GAME.city, P = GAME.player, ff = function (s) { GAME.test.fastForward(s); };
    var wasOpen = GAME.isla.isOpen(), out = {};
    GAME.isla.setOpen(true);
    var wet = C.bridgePiers.filter(function (p) { return p.wet; });
    var a = wet[2], b = wet.filter(function (q) { return q !== a; }).sort(function (p, q) {
      return Math.hypot(p.x - a.x, p.z - a.z) - Math.hypot(q.x - a.x, q.z - a.z); })[0];
    var mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, sl = Math.hypot(b.x - a.x, b.z - a.z);
    var nx = -(b.z - a.z) / sl, nz = (b.x - a.x) / sl;
    out.deck = C.crossingY(mx, mz);
    try {
      if (P.inCar) GAME.exitCar();
      GAME.police.clearWanted();
      [false, true].forEach(function (lookUp) {
        var x0 = mx - nx * 40, z0 = mz - nz * 40;
        GAME.test.teleport(x0, z0); ff(0.2);
        var boat = GAME.vehicles.spawnCar('boat', x0, z0, Math.atan2(nx, nz), {});
        GAME.test.enterNearestCar(boat); ff(1.2);
        boat.pos.set(x0, boat.pos.y, z0); boat.heading = Math.atan2(nx, nz); boat.speed = 0; boat.vx = boat.vz = 0;
        var r = { under: 0, worst: -99 };
        GAME.test.pressKey('KeyW', true);
        for (var i = 0; i < 70; i++) {
          if (lookUp) { GAME.cam.freeT = 5; GAME.cam.pitch = 1.0; }
          ff(0.1);
          var cam = GAME.cameraObj.position, dk = C.crossingY(cam.x, cam.z);
          // (only while the boat is down in the channel, not up on the deck)
          if (dk !== null && boat.pos.y < 2) { r.under++; r.worst = Math.max(r.worst, +(cam.y - (dk - 1.6)).toFixed(2)); }
        }
        GAME.test.pressKey('KeyW', false);
        r.wet = C.isBoatWater(boat.pos.x, boat.pos.z);
        if (P.inCar) GAME.exitCar(); ff(0.2);
        GAME.vehicles.removeCar(boat);
        out[lookUp ? 'up' : 'level'] = r;
      });
    } finally {
      if (P.inCar) GAME.exitCar();
      GAME.isla.setOpen(wasOpen);
      GAME.test.teleport(-60, 40); ff(0.5);
    }
    return out;
  });
  check('bridge camera: a boat crossing under a span keeps the camera under the girder',
    bc.level.under >= 2 && bc.level.worst < 0, JSON.stringify({ deck: bc.deck, level: bc.level }));
  check('bridge camera: and looked steeply up, it is still held under it',
    bc.up.under >= 2 && bc.up.worst < 0, JSON.stringify({ deck: bc.deck, up: bc.up }));

  // ---------- 5x: LOOSE ENDS — a takedown with some fight in it ----------
  // F at the target's window pulled him out and that was the job: no chase,
  // no pushback, nobody firing. Now his car is locked and he drives like a
  // man on the run; hurt, he shoots back; out of it, he has a gun; and the
  // ledger he had on him brings Rico's men after it, all the way to the
  // lock-up.
  var le = await page.evaluate(function () {
    var r = {}, M = GAME.missions, P = GAME.player, ff0 = function (s) { GAME.test.fastForward(s); };
    // (kept alive through it without god mode, which also stops the shooting)
    var ff = function (s) { for (var u = 0; u < s - 1e-6; u += 0.1) { P.health = 100; P.armor = 100; ff0(Math.min(0.1, s - u)); } P.health = 100; };
    var msgs = [], ms0 = GAME.hud.message;
    GAME.hud.message = function (t) { msgs.push(String(t)); return ms0.apply(GAME.hud, arguments); };
    var shots = [], ns0 = GAME.combat.npcShoot;
    GAME.combat.npcShoot = function (x, y, z, acc, dmg, src) {
      shots.push(src && src.kind === 'car' ? (src.heavy ? 'heavy' : src.perp ? 'perp' : 'car') : src && src.missionFoe ? 'foe' : 'other');
      return ns0.apply(GAME.combat, arguments);
    };
    var lvl0 = GAME.chaos.level, best0 = GAME.bests ? GAME.bests.hit1 : undefined, spawned = [], open0 = GAME.isla.isOpen();
    try {
      if (P.inCar) GAME.exitCar();
      GAME.police.clearWanted();
      if (GAME.bests) delete GAME.bests.hit1;
      var d = M.DEFS.filter(function (x) { return x.id === 'hit1'; })[0];
      GAME.test.teleport(d.start.x - 12, d.start.z); ff(0.3);
      var mine = GAME.vehicles.spawnCar('sports', d.start.x - 8, d.start.z, Math.PI / 2, {});
      spawned.push(mine);
      GAME.test.enterNearestCar(mine); ff(1.2);
      mine.pos.set(d.start.x, mine.pos.y, d.start.z); mine.speed = 0;
      ff(0.5);
      r.started = M.active && M.active.def.id;
      ff(4);
      var a = M.active, t = a && a.perp;
      if (!t) return r;
      r.running = { locked: t.locked, bolt: !!(t.ai && t.ai.bolt), desired: t.ai && t.ai.desired };
      // --- F at his window ---
      GAME.exitCar(); ff(0.3);
      t.speed = 0; t.vx = t.vz = 0;
      var side = t.heading - Math.PI / 2;
      GAME.test.teleport(t.pos.x + Math.sin(side) * 2.2, t.pos.z + Math.cos(side) * 2.2);
      P.heading = Math.atan2(t.pos.x - P.pos.x, t.pos.z - P.pos.z);
      GAME.test.pressKey('KeyF', true); ff(0.05); GAME.test.pressKey('KeyF', false); ff(0.6);
      r.rattled = { inCar: P.inCar, his: t.occupied === 'ai', active: !!M.active, msg: msgs.filter(function (m) { return /Locked/.test(m); })[0] || '' };
      // --- boxed in: a van across the road in front of him, you in it, once
      // he is going forwards again ---
      for (var gw = 0; gw < 40 && t.speed < 6; gw++) ff(0.1);
      var fx = Math.sin(t.heading), fz = Math.cos(t.heading);
      var van = GAME.vehicles.spawnCar('van', t.pos.x + fx * 14, t.pos.z + fz * 14, t.heading + Math.PI / 2, {});
      spawned.push(van);
      GAME.test.teleport(van.pos.x + 3, van.pos.z + 3); ff(0.1);
      GAME.test.enterNearestCar(van); ff(1.2);
      van.pos.set(t.pos.x + fx * 14, van.pos.y, t.pos.z + fz * 14); van.heading = t.heading + Math.PI / 2; van.speed = 0;
      // (round it, back the way he came, or off down a side street before he
      // reaches it: anything but sat against it)
      var touched = false, clear = 0, i, trace = [], v0 = { x: van.pos.x, z: van.pos.z };
      for (i = 0; i < 150 && clear < 30; i++) {
        ff(0.1);
        var dv = Math.hypot(t.pos.x - van.pos.x, t.pos.z - van.pos.z);
        if (dv < 9) touched = true;
        clear = Math.max(clear, dv);
        // (what he was doing, every half second, in case it comes to that)
        if (i % 5 === 0) trace.push([i / 10, Math.round(dv), +t.speed.toFixed(1), +(t.ai.passT || 0).toFixed(1), +(t.reverseT || 0).toFixed(1), t.ai.wedged || 0, t.ai.shoving ? 1 : 0, t.ai.prev ? (t.ai.prev === t.ai.node ? 'same' : 'prev') : 'none'].join(' '));
      }
      r.boxed = { touched: touched, clear: Math.round(clear), secs: i / 10 };
      if (clear < 30) { r.boxed.vanPushed = Math.round(Math.hypot(van.pos.x - v0.x, van.pos.z - v0.z)); r.boxed.trace = trace; }
      // --- hurt, he shoots back out of the window ---
      GAME.vehicles.damageCar(t, t.hp - a.maxHp * 0.6, 'bullet', true);
      var s0 = shots.length;
      for (var k = 0; k < 40; k++) { van.pos.set(t.pos.x - Math.sin(t.heading) * 15, van.pos.y, t.pos.z - Math.cos(t.heading) * 15); van.heading = t.heading; ff(0.1); }
      r.hurt = { said: msgs.some(function (m) { return /shooting back/.test(m); }), shots: shots.slice(s0).filter(function (x) { return x === 'perp'; }).length };
      // --- knocked about till he gives up: on foot, with a gun, and not done ---
      GAME.vehicles.damageCar(t, t.hp - a.maxHp * 0.15, 'bullet', true);
      ff(0.3);
      var ped = a.foot;
      r.foot = { phase: a.phase, armed: !!(ped && ped.carrying && ped.missionArmed), state: ped && ped.state, passed: !!(GAME.bests && GAME.bests.hit1 !== undefined), marked: !!ped && JSON.stringify(M.getObjectivePoint()) === JSON.stringify([ped.pos.x, ped.pos.z]) };
      GAME.exitCar(); ff(0.3);
      if (ped) GAME.test.teleport(ped.pos.x + 14, ped.pos.z);
      var s1 = shots.length;
      ff(5);
      r.foot.fights = ped && ped.state;
      r.foot.shots = shots.slice(s1).filter(function (x) { return x === 'foe'; }).length;
      // --- down: the ledger, and then Rico's men ---
      if (ped) GAME.peds.kill(ped, 'gun', true);
      ff(0.3);
      r.ledger = { phase: a.phase, there: !!(a.ledger && a.ledger.mesh), passed: !!(GAME.bests && GAME.bests.hit1 !== undefined) };
      if (a.ledger) { GAME.test.teleport(a.ledger.x + 0.8, a.ledger.z); ff(0.4); }
      r.taken = { phase: a.phase, held: !!(a.ledger && a.ledger.held), time: Math.round(a.timeLeft), obj: M.objectiveText() };
      ff(5);
      var hv = a.heavies;
      r.heavies = { came: !!hv };
      if (hv) {
        var d0 = Math.hypot(hv.car.pos.x - P.pos.x, hv.car.pos.z - P.pos.z), closest = d0;
        r.heavies.locked = hv.car.locked; r.heavies.d0 = Math.round(d0);
        for (var q = 0; q < 250 && !hv.out && closest > 30; q++) { ff(0.1); closest = Math.min(closest, Math.hypot(hv.car.pos.x - P.pos.x, hv.car.pos.z - P.pos.z)); }
        r.heavies.closest = Math.round(closest);
        // on foot beside them, they get out to do it by hand
        if (!hv.out) {
          var hc = hv.car;
          hc.speed = 0; hc.vx = hc.vz = 0;
          GAME.test.teleport(hc.pos.x + 10, hc.pos.z); ff(0.5);
        }
        r.heavies.out = hv.out; r.heavies.men = hv.men.length;
        r.heavies.armed = hv.men.length > 0 && hv.men.every(function (m) { return m.carrying && m.missionArmed && m.missionFoe; });
      }
      // --- the lock-up ---
      GAME.test.teleport(a.drop.x, a.drop.z); ff(0.5);
      r.done = { passed: !!(GAME.bests && GAME.bests.hit1 !== undefined), active: !!M.active,
        released: hv ? !hv.car.mission && !hv.car.locked : null, ledgerGone: !a.ledger.mesh,
        unarmed: hv ? hv.men.every(function (m) { return m.dead || !m.missionArmed; }) : null };
    } finally {
      GAME.hud.message = ms0; GAME.combat.npcShoot = ns0;
      if (M.active) { M.failActive('test cleanup'); ff0(0.3); }
      if (P.inCar) GAME.exitCar();
      spawned.forEach(function (c) { if (!c.gone) GAME.vehicles.removeCar(c); });
      GAME.police.clearWanted();
      GAME.chaos.set(lvl0);
      if (GAME.bests) { if (best0 === undefined) delete GAME.bests.hit1; else GAME.bests.hit1 = best0; }
      // (a pass puts its card up, and the card pauses the game: every group
      // after this one runs against the clock)
      if (GAME.share && GAME.share.isOpen) GAME.share.hide();
      if (GAME.isla.isOpen() !== open0) GAME.isla.setOpen(open0);
      P.health = 100;
      GAME.test.teleport(-60, 40); ff0(0.5);
    }
    return r;
  });
  check('loose ends: the bookkeeper is running from the off, flat out, and his car is locked',
    le.started === 'hit1' && le.running && le.running.locked && le.running.bolt && le.running.desired >= 20, JSON.stringify({ started: le.started, running: le.running }));
  check('loose ends: F at his window is a locked door — the car stays his and the job goes on',
    le.rattled && !le.rattled.inCar && le.rattled.his && le.rattled.active && /Locked/.test(le.rattled.msg), JSON.stringify(le.rattled));
  check('loose ends: boxed in by a van across the road, he gets himself out of it',
    le.boxed && le.boxed.clear >= 30, JSON.stringify(le.boxed));
  check('loose ends: hurt, he shoots back out of the window',
    le.hurt && le.hurt.said && le.hurt.shots >= 1, JSON.stringify(le.hurt));
  check('loose ends: knocked about till he bails, he is out with a gun, marked, and it is not over',
    le.foot && le.foot.phase === 'foot' && le.foot.armed && le.foot.state === 'attack' && !le.foot.passed && le.foot.marked, JSON.stringify(le.foot));
  check('loose ends: and on foot he has it out with you, shooting',
    le.foot && le.foot.fights === 'attack' && le.foot.shots >= 1, JSON.stringify(le.foot));
  check('loose ends: down, the ledger is on him — still not over',
    le.ledger && le.ledger.phase === 'ledger' && le.ledger.there && !le.ledger.passed, JSON.stringify(le.ledger));
  check('loose ends: taken, it goes to Lola\'s lock-up, with time to do it',
    le.taken && le.taken.phase === 'deliver' && le.taken.held && le.taken.time >= 80 && /lock-up/.test(le.taken.obj), JSON.stringify(le.taken));
  check('loose ends: Rico\'s men come for it in a locked car, and close in',
    le.heavies && le.heavies.came && le.heavies.locked && le.heavies.closest < Math.min(60, le.heavies.d0 - 40), JSON.stringify(le.heavies));
  check('loose ends: on foot beside them, they get out with guns',
    le.heavies && le.heavies.out && le.heavies.men === 2 && le.heavies.armed, JSON.stringify(le.heavies));
  check('loose ends: at the lock-up it passes, and the street goes back to normal',
    le.done && le.done.passed && !le.done.active && le.done.released && le.done.ledgerGone && le.done.unarmed, JSON.stringify(le.done));

  // ---------- 5y: the city, spread out; and a cab firm ----------
  // Five storefronts stood down one block of the strip — the hardware store,
  // the tailor, the barber, the bank and a condo — and nothing else in the
  // city had one. The three trades are out in the districts now. And Isla
  // Verde has a cab firm to buy, which earns more the more fares you drive.
  var cy = await page.evaluate(function () {
    var r = {}, C = GAME.city, SH = GAME.shops, B = GAME.business, M = GAME.missions, P = GAME.player, V = GAME.vehicles;
    var ff = function (s) { GAME.test.fastForward(s); };
    var keepPrefs = JSON.stringify(GAME.prefs), keepCash = P.cash, wasOpen = GAME.isla.isOpen();
    try {
      if (P.inCar) GAME.exitCar();
      GAME.police.clearWanted();
      var by = {}; SH.locations().forEach(function (l) { by[l.id] = l; });
      r.trades = ['hardware0', 'dress0', 'barber0'].map(function (id) {
        var l = by[id], rp = C.nearestRoadPoint(l.at.x, l.at.z);
        // a building behind the mat: a solid within a few metres, further from the road than the mat
        var dx = l.at.x - rp.x, dz = l.at.z - rp.z, dl = Math.hypot(dx, dz) || 1;
        var bx = l.at.x + dx / dl * 7, bz = l.at.z + dz / dl * 7;
        var built = C.hash.query(bx, bz, 2).some(function (b) { return bx > b.minX && bx < b.maxX && bz > b.minZ && bz < b.maxZ && b.h > 5; });
        return { id: id, district: C.districtName(l.at.x, l.at.z), offRoad: Math.round(dl), built: built };
      });
      r.onStrip = SH.locations().filter(function (l) { return !l.isla && C.districtName(l.at.x, l.at.z) === 'Ocean Strip' && l.kind !== 'bribe'; }).map(function (l) { return l.id; });
      // the plots they left are buildings now
      r.oldPlots = [[332, -64], [332, 92], [332, -120]].map(function (p) {
        return C.hash.query(p[0], p[1], 3).some(function (b) { return b.tag === 'building' && p[0] > b.minX && p[0] < b.maxX && p[1] > b.minZ && p[1] < b.maxZ; });
      });
      // --- VERDE CABS: a garage open to the street ---
      GAME.isla.setOpen(true);
      var cab = by.cabs0;
      r.cabs = cab ? { isla: !!cab.isla && GAME.isla.contains(cab.at.x, cab.at.z), district: C.districtName(cab.at.x, cab.at.z), bays: (cab.bays || []).map(function (b) { return b.vtype; }) } : null;
      if (!cab) return r;
      B.reset(); P.cash = 100000;
      var mid = cab.bays[1], rp = C.nearestRoadPoint(mid.x, mid.z), ox = mid.x - rp.x, oz = mid.z - rp.z, ol = Math.hypot(ox, oz);
      ox /= ol; oz /= ol;
      GAME.test.teleport(rp.x - ox * 10, rp.z - oz * 10); ff(1.5);
      r.cabs.parked = cab.bays.map(function (b) { return b.live && !b.live.gone ? b.live.type : null; });
      // walk in off the pavement to the dispatch desk: no door, no room
      GAME.test.teleport(rp.x + ox * 8, rp.z + oz * 8); ff(0.3);
      var walk = 0;
      GAME.test.pressKey('KeyW', true);
      for (walk = 0; walk < 100 && !SH.current; walk++) { P.heading = Math.atan2(cab.at.x - P.pos.x, cab.at.z - P.pos.z); GAME.cam.yaw = P.heading; ff(0.1); }
      GAME.test.pressKey('KeyW', false);
      r.walkIn = { desk: SH.current && SH.current.id, room: !!P.interior, secs: walk / 10 };
      if (!SH.current) SH.open('cabs0');
      var row = function (id) { return SH.items(cab).filter(function (q) { return q.id === id; })[0] || null; };
      var buyRow = row('biz_buy');
      r.forSale = buyRow && { price: buyRow.price, says: /every fare you drive/.test(buyRow.ds) };
      var c0 = P.cash;
      SH.buy('biz_buy');
      r.bought = { owns: B.owns('cabs0'), paid: c0 - P.cash, rate: B.rate('cabs0') };
      SH.close();
      // the Tiger Cab in the middle bay, to take out, and fares in it
      var z = mid.live;
      r.tiger = { there: !!z && z.type === 'tiger' };
      if (z) {
        GAME.test.teleport(z.pos.x + 2.5, z.pos.z); ff(0.3);
        GAME.test.enterNearestCar(z); ff(1.2);
        r.tiger.aboard = P.inCar && P.car === z;
        GAME.test.pressKey('KeyW', true); ff(2.5); GAME.test.pressKey('KeyW', false); ff(1);
        // how far out past the garage front (the bay is 6.5 m in from it)
        r.tiger.out = Math.round((z.pos.x - mid.x) * -ox + (z.pos.z - mid.z) * -oz - 6.5);
        z.speed = 0; ff(0.3);
        GAME.test.pressKey('KeyJ', true); ff(1 / 60); GAME.test.pressKey('KeyJ', false); ff(0.5);
        var a = M.active;
        r.shift = !!(a && a.def.id === 'taxifare');
        if (r.shift) {
          a.phase = 'dropoff'; a.aboard = 1;
          a.dropoff = [z.pos.x, z.pos.z]; z.speed = 0;
          ff(0.5);
          r.fared = { fares: B.fares, rate: B.rate('cabs0') };
          M.failActive('test cleanup'); ff(0.3);
        }
        if (P.inCar) GAME.exitCar();
        V.removeCar(z);
      }
      // a day at the bigger rate (on top of the few seconds that ran while
      // the fare was driven)
      var t0 = B.till('cabs0');
      B.accrue(GAME.DAY_SECONDS);
      r.day = B.till('cabs0') - t0;
      r.blip = (SH.blips().filter(function (b) { return Math.abs(b.x - cab.at.x) < 0.1 && Math.abs(b.z - cab.at.z) < 0.1; })[0] || {}).color;
    } finally {
      if (SH.current) SH.close();
      if (M.active) { M.failActive('test cleanup'); ff(0.3); }
      if (GAME.share && GAME.share.isOpen) GAME.share.hide();
      if (P.inCar) GAME.exitCar();
      GAME.prefs = JSON.parse(keepPrefs); P.cash = keepCash;
      GAME.isla.setOpen(wasOpen);
      GAME.test.teleport(-60, 40); ff(0.5);
    }
    return r;
  });
  check('city: the hardware store, the tailor and the barber are each in a district of their own',
    cy.trades.length === 3 && cy.trades.every(function (t) { return t.district !== 'Ocean Strip'; }) &&
    cy.trades.map(function (t) { return t.district; }).filter(function (d, i, all) { return all.indexOf(d) === i; }).length === 3, JSON.stringify(cy.trades));
  check('city: and each is a building, its door off the road',
    cy.trades.every(function (t) { return t.built && t.offRoad >= 9; }), JSON.stringify(cy.trades));
  check('city: the strip keeps the bank, the condo and the casino, and no more',
    cy.onStrip.length === 3 && ['bank0', 'home_condo', 'casino0'].every(function (id) { return cy.onStrip.indexOf(id) >= 0; }), JSON.stringify(cy.onStrip));
  check('city: the plots they left on the strip are built on', cy.oldPlots.every(Boolean), JSON.stringify(cy.oldPlots));
  check('cabs: VERDE CABS is on Isla Verde, in Puerto Dorado: three bays, a cab either side, the middle kept for the Tiger Cab',
    cy.cabs && cy.cabs.isla && cy.cabs.district === 'Puerto Dorado' && JSON.stringify(cy.cabs.bays) === '["taxi","tiger","taxi"]' &&
    JSON.stringify(cy.cabs.parked) === '["taxi",null,"taxi"]', JSON.stringify(cy.cabs));
  check('cabs: an open garage — you walk in off the street to the dispatch desk, no door, no room',
    cy.walkIn && cy.walkIn.desk === 'cabs0' && !cy.walkIn.room, JSON.stringify(cy.walkIn));
  check('cabs: it is for sale at the desk for $40,000, and says what fares do for it',
    cy.forSale && cy.forSale.price === 40000 && cy.forSale.says && cy.bought.owns && cy.bought.paid === 40000 && cy.bought.rate === 1200,
    JSON.stringify({ sale: cy.forSale, bought: cy.bought }));
  check('cabs: bought, the Tiger Cab is in the middle bay, and drives out',
    cy.tiger && cy.tiger.there && cy.tiger.aboard && cy.tiger.out > 3, JSON.stringify(cy.tiger));
  check('cabs: and it takes fares — one driven to its stop puts another on the board',
    cy.shift && cy.fared && cy.fared.fares === 1 && cy.fared.rate === 1240, JSON.stringify({ shift: cy.shift, fared: cy.fared }));
  check('cabs: and a day fills the till at that rate; it is green on the radar',
    Math.abs(cy.day - 1240) <= 1 && cy.blip === '#5dff9e', JSON.stringify({ day: cy.day, blip: cy.blip }));

  // ---------- 6: a rider follows the deck when it tilts ----------
  // vehicles.js pitches a chassis over a ramp (negative rotation.x lifts the
  // nose), but the roof a rider stood on was a flat plane at car.pos.y — so
  // standing over the nose of a climbing truck left them hanging in the air.
  // Ride it with the pitch ramped on gradually, the way a ramp delivers it.
  var deck = await page.evaluate(function () {
    var P = GAME.player;
    GAME.test.teleport(350, 300);
    GAME.test.fastForward(0.5);
    var car = GAME.test.spawnCar('van', 7, 0);
    if (!car) return { spawned: false };
    GAME.test.fastForward(0.3);
    var NOSE = 2.0;                       // out along the body's +z, past the cab
    // Pin the van square and the rider over the nose every frame. Left free
    // they both drift a little, and the height being measured depends on
    // exactly where along the deck the rider ends up — which made this read
    // anywhere from 1.29 to 1.50 run to run.
    function hold() {
      car.ai = null;
      car.controls = { throttle: 0, steer: 0, handbrake: true };
      car.heading = 0;                    // so +NOSE along z IS +NOSE along the body
      // and no ROLL. The prediction below is pure pitch, but the body also
      // leans on lateral slip — so one shove from passing traffic puts a roll
      // under the rider and the measured height stops matching the trig. Pitch
      // was pinned here and roll was not, which is a failure once in a while
      // and nothing to do with what is being tested.
      car.lat = 0; car.speed = 0;
      car.mesh.rotation.z = 0;
      P.pos.x = car.pos.x; P.pos.z = car.pos.z + NOSE;
    }
    hold();
    P.pos.set(car.pos.x, car.pos.y + 4, car.pos.z + NOSE);
    P.velY = 0;
    for (var i = 0; i < 60; i++) { hold(); car.mesh.rotation.x = 0; GAME.test.fastForward(1 / 60); car.mesh.rotation.z = 0; }
    var level = P.pos.y - car.pos.y, riding = P.roofCar === car;
    // now lift the nose, a frame at a time
    var PITCH = 0.35;
    for (var j = 0; j < 40; j++) { hold(); car.mesh.rotation.x = -PITCH * (j + 1) / 40; GAME.test.fastForward(1 / 60); car.mesh.rotation.z = 0; }
    var noseUp = P.pos.y - car.pos.y, stillRiding = P.roofCar === car;
    // what the geometry says it must be, derived here with plain trig rather
    // than by asking the code under test what it thinks
    var expect = level * Math.cos(PITCH) + NOSE * Math.sin(PITCH);
    return { spawned: true, riding: riding, stillRiding: stillRiding, level: level, noseUp: noseUp,
             lift: noseUp - level, expect: expect };
  });
  check('roof: a van spawned and the player is riding it (anchor sanity)',
    deck.spawned && deck.riding, 'spawned=' + deck.spawned + ' riding=' + deck.riding);
  check('roof: still aboard after the nose comes up', deck.stillRiding === true);
  check('roof: standing over a lifted nose rides up by exactly the geometry',
    deck.lift > 0.35 && Math.abs(deck.noseUp - deck.expect) < 0.05,
    'level=' + (deck.level || 0).toFixed(3) + ' noseUp=' + (deck.noseUp || 0).toFixed(3) +
    ' expected=' + (deck.expect || 0).toFixed(3) + ' lift=' + (deck.lift || 0).toFixed(3));

  // ---------- 6b: whoever is aboard ----------
  // An AI vehicle's driver is a flag on the car, and a bike's rider a figure
  // riding its mesh: neither is a ped, so nothing aimed at people reached
  // them. A round, a fist or a car landed on the bike under a rider in plain
  // view, a burning car kept its driver right up to the blast, and the blast
  // killed the flag and left the rider sitting on the burnt-out frame. Each
  // check here drives the real path — the trigger, the fist, the ram, the
  // fuse, the blast —
  // at vehicles that hold still ('hold' is no mode the traffic AI drives).
  var aboard = await page.evaluate(function () {
    var P = GAME.player, V = GAME.vehicles, w0 = P.currentWeapon;
    GAME.test.teleport(350, 300);
    function clearAround() {
      GAME.world.peds.slice().forEach(function (p) {
        if (U.dist2(p.pos.x, p.pos.z, P.pos.x, P.pos.z) < 45 * 45) GAME.peds.removePed(p);
      });
      GAME.world.cars.slice().forEach(function (c) {
        if (U.dist2(c.pos.x, c.pos.z, P.pos.x, P.pos.z) < 45 * 45) V.removeCar(c);
      });
      P.roofCar = null;
    }
    function ridden(type, dx, dz) {
      return V.spawnCar(type, P.pos.x + dx, P.pos.z + dz, 0, { occupied: 'ai', ai: { mode: 'hold' } });
    }
    // whoever has come out of this vehicle as a person (leftCar is what the
    // way out stamps on them: the car's serial, so it holds no despawned car)
    function outOf(car) {
      return GAME.world.peds.filter(function (p) { return p.leftCar === car.serial && !p.gone; });
    }
    function fire() { GAME.input.lmbPressed = true; GAME.test.fastForward(1 / 60); }
    var out = {};

    // a round at a rider, square through the seat (the bike points away)
    clearAround();
    GAME.test.fastForward(0.3);
    GAME.combat.giveWeapon('pistol', 20);
    GAME.combat.selectWeapon('pistol');
    var shotAt = ridden('motorcycle', 0, 7);
    var hp0 = shotAt.hp;
    GAME.cam.yaw = P.heading = Math.atan2(shotAt.pos.x - P.pos.x, shotAt.pos.z - P.pos.z);
    fire();
    var hit = outOf(shotAt);
    out.shot = { stillOn: !!shotAt.riderMesh, people: hit.length,
      hurt: hit.length === 1 && (hit[0].dead || hit[0].hp < 30), bikeHp: hp0 - shotAt.hp };
    GAME.test.fastForward(0.5);              // the trigger's cooldown

    // a fist, at arm's length of a rider stopped beside you
    clearAround();
    GAME.combat.selectWeapon('fist');
    GAME.cam.yaw = P.heading = 0;
    var punched = ridden('motorcycle', 0, 1.6);
    hp0 = punched.hp;
    out.fist = P.currentWeapon;
    fire();
    var hitF = outOf(punched);
    out.punch = { stillOn: !!punched.riderMesh, people: hitF.length,
      hurt: hitF.length === 1 && (hitF[0].dead || hitF[0].hp < 30), bikeHp: hp0 - punched.hp };
    GAME.test.fastForward(0.5);

    // a fire, in a car, on a bike and in a cruiser: out, and clear of it
    // (at no stars, so the officer runs like everybody else rather than
    // coming for the gunman from the checks above)
    GAME.police.clearWanted();
    clearAround();
    var burning = [ridden('sedan', -7, 10), ridden('motorcycle', 0, 10), ridden('police', 7, 10)];
    burning.forEach(function (c) { V.damageCar(c, c.hp - c.spec.hp * 0.1, 'test'); });
    out.lit = burning.every(function (c) { return c.stage >= 2 && !c.dead; });
    GAME.test.fastForward(2);
    out.fire = burning.map(function (c) {
      return { type: c.type, aboard: c.occupied === 'ai', stillOn: !!c.riderMesh, out: outOf(c).length };
    });
    var fled = [].concat.apply([], burning.map(outOf));
    GAME.test.fastForward(5);                // the fuse runs out
    out.blown = burning.every(function (c) { return c.dead; });
    out.fled = fled.length;
    // caught by the blast, as opposed to anything else that can happen to
    // somebody running down a live street (traffic does not stop for them)
    out.blastCaught = fled.filter(function (p) { return p.dead && p.deathCause === 'explosion'; }).length;

    // a blast with somebody still aboard, car and bike alike
    clearAround();
    var car = ridden('sedan', -5, 8), bike = ridden('motorcycle', 5, 8);
    V.explodeCar(car, 'test');
    V.explodeCar(bike, 'test');
    function bodies(c) { return outOf(c).filter(function (p) { return p.dead; }).length; }
    out.blast = { stillOn: !!bike.riderMesh, carBodies: bodies(car), bikeBodies: bodies(bike) };

    // and a rider going past somebody else's: out in the open like anyone
    clearAround();
    var wreck = V.spawnCar('sedan', P.pos.x - 4, P.pos.z + 12, 0, {});
    var passing = ridden('motorcycle', 0, 12);
    V.explodeCar(wreck, 'test');
    out.passing = { stillOn: !!passing.riderMesh, bodies: bodies(passing) };

    // A car driven into a rider: rolling with nobody at the wheel, square up
    // the bike's back. The knock is stepped a frame at a time so the car can
    // be stopped the moment it lands — what happens to somebody lying in
    // front of a car that keeps coming is the run-over rule's business.
    function ram(speed, strikerIsPlayers) {
      clearAround();
      var striker, bike;
      if (strikerIsPlayers) {
        striker = GAME.test.spawnCar('sedan', 4, 0);
        GAME.test.enterNearestCar(striker);
        GAME.test.fastForward(1.2);
        striker.speed = 0;
      } else striker = V.spawnCar('sedan', P.pos.x, P.pos.z + 6, 0, {});
      var fx = Math.sin(striker.heading), fz = Math.cos(striker.heading);
      bike = V.spawnCar('motorcycle', striker.pos.x + fx * 4, striker.pos.z + fz * 4, striker.heading,
        { occupied: 'ai', ai: { mode: 'hold' } });
      var h0 = GAME.police.heat;
      striker.speed = speed;
      for (var f = 0; f < 90 && bike.riderMesh; f++) GAME.test.fastForward(1 / 60);
      striker.speed = 0;
      var r = { inCar: !strikerIsPlayers || P.car === striker, stillOn: !!bike.riderMesh, people: outOf(bike) };
      r.dead = r.people.filter(function (p) { return p.dead; }).length;
      r.hurt = r.people.filter(function (p) { return !p.dead && p.hp < 30; }).length;
      r.people = r.people.length;
      r.heat = GAME.police.heat - h0;         // before a clean record cools it
      GAME.test.fastForward(0.5);
      if (strikerIsPlayers) GAME.test.exitCar();
      GAME.police.clearWanted();
      return r;
    }
    out.rammed = ram(15);
    out.nudged = ram(6);
    out.playerRam = ram(15, true);

    // an owner who takes their bike back is seen riding it
    clearAround();
    var theirs = V.spawnCar('motorcycle', P.pos.x + 4, P.pos.z + 4, 0, {});
    var owner = GAME.peds.spawnPed(theirs.pos.x + 1.2, theirs.pos.z);
    owner.state = 'attack'; owner.attackT = 12; owner.temper = 0.9; owner.stolenCar = theirs;
    var waited = 0;
    while (theirs.occupied !== 'ai' && waited < 60 * 8) { GAME.test.fastForward(1 / 60); waited++; }
    out.reclaim = { aboard: theirs.occupied === 'ai', rider: !!theirs.riderMesh, after: waited / 60 };

    clearAround();
    GAME.combat.selectWeapon(w0);
    GAME.police.clearWanted();
    GAME.player.health = 100;
    return out;
  });
  check('aboard: a round through a rider knocks them off the bike',
    !aboard.shot.stillOn && aboard.shot.people === 1 && aboard.shot.hurt, JSON.stringify(aboard.shot));
  check('aboard: and the bike under them takes none of it', aboard.shot.bikeHp === 0, 'bike lost ' + aboard.shot.bikeHp + ' hp');
  check('aboard: a fist reaches a rider too',
    aboard.fist === 'fist' && !aboard.punch.stillOn && aboard.punch.hurt && aboard.punch.bikeHp === 0,
    'swung ' + aboard.fist + ' ' + JSON.stringify(aboard.punch));
  check('aboard: a fire was lit under all three (anchor sanity)', aboard.lit);
  check('aboard: nobody sits in a burning car, bike or cruiser',
    aboard.fire.every(function (f) { return !f.aboard && !f.stillOn && f.out === 1; }), JSON.stringify(aboard.fire));
  check('aboard: and all three were clear when it went up',
    aboard.blown && aboard.fled === 3 && aboard.blastCaught === 0,
    'blown=' + aboard.blown + ' out=' + aboard.fled + ' caught in a blast=' + aboard.blastCaught);
  check('aboard: a blast kills whoever is still aboard, car and bike alike',
    !aboard.blast.stillOn && aboard.blast.carBodies === 1 && aboard.blast.bikeBodies === 1, JSON.stringify(aboard.blast));
  check('aboard: a rider passing a blast is caught in it like anyone on foot',
    !aboard.passing.stillOn && aboard.passing.bodies === 1, JSON.stringify(aboard.passing));
  check('aboard: a car driven into a rider throws them off, killed',
    !aboard.rammed.stillOn && aboard.rammed.people === 1 && aboard.rammed.dead === 1, JSON.stringify(aboard.rammed));
  check('aboard: a nudge puts them on the road hurt, not dead',
    !aboard.nudged.stillOn && aboard.nudged.people === 1 && aboard.nudged.hurt === 1, JSON.stringify(aboard.nudged));
  check('aboard: and a stranger\'s ram is not put on the player',
    aboard.rammed.heat === 0 && aboard.nudged.heat === 0, 'heat ' + aboard.rammed.heat + ' / ' + aboard.nudged.heat);
  check('aboard: running a rider down is on the player\'s record',
    aboard.playerRam.inCar && !aboard.playerRam.stillOn && aboard.playerRam.dead === 1 && aboard.playerRam.heat > 0,
    JSON.stringify(aboard.playerRam));
  check('aboard: an owner takes their bike back (anchor sanity)', aboard.reclaim.aboard, JSON.stringify(aboard.reclaim));
  check('aboard: and is seen riding it', aboard.reclaim.rider, JSON.stringify(aboard.reclaim));

  // ---------- nothing broke on the way through ----------
  await page.evaluate(function () { GAME.test.fastForward(5); });
  check('clean: zero page errors', pageErrors.length === 0, pageErrors[0]);
  check('clean: zero console.error', consoleErrors.length === 0, consoleErrors[0]);

  // ---------- 7: haptics ----------
  var hap = await page.evaluate(function () {
    window.__buzz = [];
    window.__realVibrate = navigator.vibrate;
    navigator.vibrate = function (ms) { window.__buzz.push(ms); return true; };
    var r = {};
    r.available = GAME.haptics.available;
    // rationed: a second buzz of the same size inside the window is dropped,
    // a harder one gets through — the rule audio.js uses for a pile-up
    window.__buzz.length = 0;
    r.first = GAME.haptics.testBuzz(20);
    r.repeat = GAME.haptics.testBuzz(20);
    r.harder = GAME.haptics.testBuzz(50);
    r.sent = window.__buzz.slice();
    // never longer than the cap, however hard the knock
    window.__buzz.length = 0;
    GAME.haptics.testBuzz(9999);
    r.capped = window.__buzz.slice();
    GAME.haptics.testReset();
    window.__buzz.length = 0;
    GAME.haptics.knock(99);
    r.knockCapped = window.__buzz.slice();
    // off means off
    GAME.haptics.setOn(false);
    window.__buzz.length = 0;
    GAME.haptics.testBuzz(60);
    r.whileOff = window.__buzz.slice();
    GAME.haptics.setOn(true);
    // and a browser with no motor at all must not throw
    navigator.vibrate = undefined;
    r.unavailable = GAME.haptics.available;
    var threw = false;
    try { GAME.haptics.knock(1); GAME.haptics.hurt(); GAME.haptics.shot(); } catch (e) { threw = true; }
    r.threwWithoutApi = threw;
    navigator.vibrate = function (ms) { window.__buzz.push(ms); return true; };
    return r;
  });
  check('haptics: the recorder is installed and the API reads available (anchor sanity)', hap.available === true);
  check('haptics: a knock buzzes once and a repeat inside the window is dropped',
    hap.first === true && hap.repeat === false, 'first=' + hap.first + ' repeat=' + hap.repeat);
  check('haptics: a harder knock preempts inside the window',
    hap.harder === true && hap.sent.length === 2, 'sent=' + JSON.stringify(hap.sent));
  check('haptics: nothing outruns the pulse cap', hap.capped.length === 1 && hap.capped[0] <= 120,
    'sent=' + JSON.stringify(hap.capped));
  check('haptics: and the shake channel keeps its own, tighter ceiling',
    hap.knockCapped.length === 1 && hap.knockCapped[0] <= 60,
    'sent=' + JSON.stringify(hap.knockCapped));
  check('haptics: switched off sends nothing', hap.whileOff.length === 0, 'sent=' + JSON.stringify(hap.whileOff));
  check('haptics: a browser with no vibrate reports unavailable and does not throw',
    hap.unavailable === false && hap.threwWithoutApi === false);

  // End to end through the game's own channels rather than the module's door.
  // The window is shared across kinds on purpose — a crash that also hurts you
  // is one event, not two — so clear it first. Settling the player can knock
  // them about, and a buzz during that would arm the throttle invisibly and
  // make this a test of the throttle instead of the hook.
  var dmg = await page.evaluate(function () {
    GAME.player.health = 100;
    GAME.test.teleport(350, 300);
    GAME.test.fastForward(0.5);
    GAME.player.health = 100;   // whatever settling cost, this check is not about that
    window.__buzz.length = 0;
    GAME.haptics.testReset();
    var before = { state: GAME.player.state, health: Math.round(GAME.player.health), armor: Math.round(GAME.player.armor) };
    GAME.playerDamage(8, 'test');        // -> hud.damageFlash() -> haptics.hurt()
    return { sent: window.__buzz.slice(), before: before };
  });
  check('haptics: the player is alive to be hurt (anchor sanity)',
    dmg.before.state === 'alive', JSON.stringify(dmg.before));
  check('haptics: taking damage buzzes through the flash it already shows',
    dmg.sent.length === 1, 'sent=' + JSON.stringify(dmg.sent) + ' before=' + JSON.stringify(dmg.before));

  // The shake hook must fire on the RISE, not for every frame the shake is
  // still ringing. Throttling alone would hide the difference, so this runs
  // over real wall time: buzzing per frame would slip one through every window
  // and land several, while reading the rise lands exactly one.
  //
  // It waits on FRAMES rather than on a stopwatch. Headless Chromium schedules
  // rAF off a compositor that is not drawing anything, so the callbacks are
  // sparse and uneven — a fixed 700 ms landed four of them on one run and none
  // on the next, and a window with no frames in it reports zero buzzes and
  // reads exactly like the hook being broken.
  await page.evaluate(function () {
    GAME.player.health = 100;
    // This window runs on the wall clock with the world live around a player
    // standing in the street. Traffic clipping them lands a hurt() buzz on top
    // of the knock being measured, which is a second buzz from a second cause
    // and read here as the shake hook firing twice. Seen once in a dozen runs;
    // godMode closes the door rather than leaving it to the traffic.
    GAME.godMode = true;
    GAME.test.fastForward(1);
    window.__buzz.length = 0;
    GAME.haptics.testReset();
    window.__frames = 0;
    (function count() { window.__frames++; requestAnimationFrame(count); })();
    GAME.cameraShake = 0.9;
  });
  // enough frames for a per-frame hook to slip several past the 90 ms window
  await page.waitForFunction(function () { return window.__frames >= 8; }, null, { timeout: 20000 });
  var shake = await page.evaluate(function () {
    GAME.godMode = false;
    return { sent: window.__buzz.slice(), left: GAME.cameraShake, frames: window.__frames };
  });
  check('haptics: a knock buzzes once, not once per frame it rings for',
    shake.sent.length === 1,
    'sent=' + JSON.stringify(shake.sent) + ' shakeLeft=' + shake.left + ' frames=' + shake.frames);
  // Both halves matter. Below 0.9 proves the camera update actually ran, so a
  // window that drew nothing cannot pass this by holding the value it was
  // handed; above 0.01 proves the shake was still ringing the whole time, so
  // "buzzed once" is not just "the shake ended before it could buzz twice".
  check('haptics: the shake ran down but was still ringing throughout (anchor sanity)',
    shake.left < 0.9 && shake.left > 0.01, 'left=' + shake.left + ' frames=' + shake.frames);
  // ---- the vocabulary itself ----
  // Length alone cannot say anything specific, so the value of the whole
  // channel rests on the patterns being distinguishable from one another.
  // Assert that directly rather than trusting the table to stay tidy.
  //
  // Every one of these reaches for a method by name, so a build without them
  // would throw inside the page and take the runner down with it rather than
  // report anything. A missing method is a finding, not a crash: name it and
  // let the check below fail on it.
  await page.evaluate(function () {
    window.__missing = [];
    window.__hap = function (name, arg) {
      var f = GAME.haptics[name];
      if (typeof f !== 'function') { window.__missing.push(name); return false; }
      return f.call(GAME.haptics, arg);
    };
  });
  var vocab = await page.evaluate(function () {
    var H = GAME.haptics, out = {}, seen = {};
    var kinds = ['uiTap', 'pickup', 'hit', 'shot', 'checkpoint', 'deny', 'hurt', 'chuteLand',
                 'chuteOpen', 'demo', 'win', 'stunt', 'wantedClear', 'smoking', 'onFire',
                 'wasted', 'busted'];
    var dupes = [];
    for (var i = 0; i < kinds.length; i++) {
      H.testReset();
      window.__buzz.length = 0;
      window.__hap(kinds[i]);
      out[kinds[i]] = { sent: window.__buzz.slice() };
      var key = JSON.stringify(window.__buzz);
      if (seen[key]) dupes.push(seen[key] + '=' + kinds[i] + ' ' + key);
      seen[key] = kinds[i];
    }
    // the star count is spoken in taps, so the shapes have to differ by level
    var stars = [];
    for (var n = 1; n <= 5; n++) {
      H.testReset(); window.__buzz.length = 0;
      window.__hap('wantedUp', n);
      stars.push(JSON.stringify(window.__buzz[0]));
    }
    return { out: out, dupes: dupes, stars: stars, missing: window.__missing.slice(),
             distinctStars: stars.filter(function (v, i) { return stars.indexOf(v) === i; }).length };
  });
  check('haptics: every kind exists and actually sends something (anchor sanity)',
    vocab.missing.length === 0 &&
    Object.keys(vocab.out).every(function (k) { return vocab.out[k].sent.length === 1; }),
    'missing=' + JSON.stringify(vocab.missing) + ' silent=' +
    JSON.stringify(Object.keys(vocab.out).filter(function (k) { return vocab.out[k].sent.length !== 1; })));
  check('haptics: no two kinds feel the same', vocab.dupes.length === 0, vocab.dupes.join(' | '));
  check('haptics: a pattern is a pattern, not a duration',
    Array.isArray(vocab.out.onFire.sent[0]) &&
    vocab.out.onFire.sent[0].length >= 3 && typeof vocab.out.pickup.sent[0] === 'number',
    'onFire=' + JSON.stringify(vocab.out.onFire.sent[0]) + ' pickup=' + JSON.stringify(vocab.out.pickup.sent[0]));
  check('haptics: the star count is spoken in taps, and five differs from one',
    vocab.distinctStars === 5, JSON.stringify(vocab.stars));

  // ---- who may interrupt whom ----
  var pri = await page.evaluate(function () {
    var H = GAME.haptics, r = {}, hap = window.__hap;
    window.__missing.length = 0;
    // a thumb on a button must never be able to talk over a crash
    H.testReset(); window.__buzz.length = 0;
    H.knock(0.9); r.tapAfterKnock = hap('uiTap'); r.afterTap = window.__buzz.slice();
    // and the alarm gets through whatever is already playing
    H.testReset(); window.__buzz.length = 0;
    H.knock(0.9); r.alarmAfterKnock = hap('onFire'); r.afterAlarm = window.__buzz.slice();
    // a long pattern is not cut short by a lighter one landing mid-play
    H.testReset(); window.__buzz.length = 0;
    hap('wasted'); r.tapAfterWasted = hap('uiTap'); r.winAfterWasted = hap('win');
    r.afterWasted = window.__buzz.slice();
    // and a connect outranks the trigger it arrived with
    H.testReset(); window.__buzz.length = 0;
    H.shot(); r.hitAfterShot = hap('hit'); r.afterHit = window.__buzz.slice();
    // The pair the world check below cannot test: a body under the wheels and
    // the star that same kill earns. Driven back to back here, with no sim
    // clock between them, so the ration is the only thing deciding.
    H.testReset(); window.__buzz.length = 0;
    hap('wantedUp', 1); r.splatAfterStar = hap('splat', 1);
    r.afterStar = window.__buzz.slice();
    // switched off, none of it goes anywhere
    H.setOn(false);
    H.testReset(); window.__buzz.length = 0;
    hap('splat', 1); hap('wantedUp', 5); hap('onFire'); hap('wasted'); hap('busted'); hap('win');
    hap('uiTap'); hap('blast', 1); hap('chuteLand'); hap('demo');
    r.whileOff = window.__buzz.slice();
    H.setOn(true);
    return r;
  });
  check('haptics: a button tap cannot talk over a crash',
    pri.tapAfterKnock === false && pri.afterTap.length === 1,
    'sent=' + JSON.stringify(pri.afterTap));
  check('haptics: but the alarm gets through one',
    pri.alarmAfterKnock === true && pri.afterAlarm.length === 2,
    'sent=' + JSON.stringify(pri.afterAlarm));
  check('haptics: and nothing below it cuts a death short',
    pri.tapAfterWasted === false && pri.winAfterWasted === false && pri.afterWasted.length === 1,
    'sent=' + JSON.stringify(pri.afterWasted));
  check('haptics: a round connecting preempts the trigger it left with',
    pri.hitAfterShot === true && pri.afterHit.length === 2,
    'sent=' + JSON.stringify(pri.afterHit));
  check('haptics: a star rations away the body under the wheels that earned it',
    pri.splatAfterStar === false && pri.afterStar.length === 1 &&
    typeof pri.afterStar[0] === 'number',
    'sent=' + JSON.stringify(pri.afterStar));
  check('haptics: RUMBLE off silences every one of them',
    pri.whileOff.length === 0, 'sent=' + JSON.stringify(pri.whileOff));

  // ---- and through the game, for the ones with a body behind them ----
  var world = await page.evaluate(function () {
    var P = GAME.player, r = {};
    GAME.police.clearWanted();
    P.health = 100;
    if (P.inCar) GAME.exitCar();
    GAME.test.teleport(356, 40);
    GAME.test.fastForward(0.5);
    var _ride = GAME.test.spawnCar('sedan', 4, 0);
    GAME.test.fastForward(0.3);
    GAME.test.enterNearestCar(_ride);
    GAME.test.fastForward(1);
    var car = P.car;
    r.driving = !!car;
    if (!car) return r;

    // Somebody under the wheels. Put them where the car is about to be and
    // give it real pace: under 4 m/s the run-over check does not even look.
    //
    // Already at five stars for this one, and it is not a dodge. Killing a
    // pedestrian is also a CRIME, and the star it earns outranks the body on
    // the bonnet — deliberately, since the more consequential news wins a
    // channel this narrow. Pinned at the ceiling the level cannot move, so
    // what is measured here is the run-over on its own. The masking is worth
    // knowing about too, so it gets a check of its own below.
    function runOver() {
      car.heading = 0; car.speed = 20; car.lat = 0;
      var ped = GAME.test.spawnPed(0, 0);
      ped.pos.set(car.pos.x, car.pos.y, car.pos.z + 2);
      // Somebody to see it, planted fresh each time and well clear of the
      // bonnet. The car travels four metres a run, so one witness left at the
      // start of a sequence walks out of civilian earshot partway through.
      GAME.test.spawnPed(8, -6);
      GAME.haptics.testReset(); window.__buzz.length = 0;
      GAME.test.fastForward(0.2);
      return { sent: window.__buzz.slice(), dead: !!ped.dead };
    }
    // godMode for the window: at five stars the cops shoot, and a hurt() buzz
    // landing on top would be a second buzz from a second cause
    GAME.godMode = true;
    GAME.police.setWanted(5);
    GAME.test.fastForward(0.3);
    var over = runOver();
    r.splat = over.sent; r.pedDead = over.dead;

    // And the same act from clean, where the star it earns takes the channel.
    // Two conditions before that star exists at all, and missing either would
    // have left this comparing one splat against another: reportCrime holds a
    // 1.2 s cooldown per crime type, and an unwitnessed one draws nothing —
    // so wait the cooldown out and leave somebody standing there to see it.
    GAME.police.clearWanted();
    GAME.test.fastForward(1.5);
    // Run them down until a star LIGHTS, and read the buzz off the one that
    // did it. Two is the ladder's price from nothing (see the wanted group),
    // but this cannot assume it starts from nothing: clearWanted only zeroes
    // the level, and the seconds either side of it are a live world — one
    // stray offence in there and the star arrives on the first body instead
    // of the second, which is how this passed three times locally and failed
    // in CI. Whichever body lights it is the one being measured.
    var was = GAME.test.getState().wanted, first = null, tries = 0;
    while (tries < 6 && !first) {
      var attempt = runOver();
      tries++;
      if (GAME.test.getState().wanted > was) first = attempt;
    }
    r.firstKill = first ? first.sent : [];
    r.firstDead = !!(first && first.dead);
    r.firstTries = tries;
    r.firstStars = GAME.test.getState().wanted;
    GAME.godMode = false;

    // The law changing gear, both ways.
    GAME.police.clearWanted();
    GAME.haptics.testReset(); window.__buzz.length = 0;
    GAME.police.setWanted(3);
    r.wantedUp = window.__buzz.slice();
    GAME.haptics.testReset(); window.__buzz.length = 0;
    GAME.police.clearWanted();
    r.wantedClear = window.__buzz.slice();

    // The ride catching fire — the one warning with a deadline on it.
    car.stage = 0; car.stageWarn = 0; car.hp = car.spec.hp;
    GAME.haptics.testReset(); window.__buzz.length = 0;
    GAME.vehicles.damageCar(car, car.spec.hp * 0.9, 'test');
    r.onFire = window.__buzz.slice();
    r.stage = car.stage;

    car.hp = car.spec.hp; car.stage = 0; car.stageWarn = 0;

    // The witnesses above only count if they land near the CAR, and that is
    // the hook's job: offsets are from where the player IS, and behind a wheel
    // that is the car. It read P.pos instead, which does not follow you into
    // one — so things landed near wherever the player last got OUT, and
    // whether a crime had a witness at all came down to how far they had
    // driven since. Taken here rather than on boarding, because that is the
    // only state where the two answers differ: fresh out of the door they are
    // the same point, and the check would pass on either.
    r.stale = Math.round(Math.sqrt(U.dist2(P.pos.x, P.pos.z, car.pos.x, car.pos.z)));
    var probePed = GAME.test.spawnPed(6, 0);
    var probeCar = GAME.test.spawnCar('sedan', -9, 0);
    r.pedFromCar = Math.round(Math.sqrt(U.dist2(probePed.pos.x, probePed.pos.z, car.pos.x, car.pos.z)));
    r.carFromCar = Math.round(Math.sqrt(U.dist2(probeCar.pos.x, probeCar.pos.z, car.pos.x, car.pos.z)));
    GAME.peds.removePed(probePed);
    GAME.vehicles.removeCar(probeCar);

    // tidy up behind: the groups below drive a car and read the star count
    GAME.exitCar();
    GAME.police.clearWanted();
    P.health = 100;
    GAME.test.fastForward(0.4);
    r.onFoot = !GAME.player.inCar;
    return r;
  });
  check('haptics: the player had driven away from where they got out (anchor sanity)',
    world.stale > 20, 'the car was ' + world.stale + 'm from P.pos');
  check('haptics: the spawn hooks place things by the car you are in, not the kerb you left',
    world.pedFromCar <= 8 && world.carFromCar <= 11,
    'ped ' + world.pedFromCar + 'm and car ' + world.carFromCar + 'm from the car');

  check('haptics: the player is driving and both bodies went under (anchor sanity)',
    world.driving === true && world.pedDead === true && world.firstDead === true,
    'driving=' + world.driving + ' dead=' + world.pedDead + '/' + world.firstDead);
  check('haptics: running someone over is felt, not silent',
    world.splat.length === 1 && Array.isArray(world.splat[0]) && world.splat[0].length === 3,
    'sent=' + JSON.stringify(world.splat));
  check('haptics: running them down does eventually draw a star (anchor sanity)',
    world.firstStars >= 1 && world.firstTries <= 6,
    'stars=' + world.firstStars + ' after ' + world.firstTries + ' bodies');
  // WHICH buzz reaches you first, and only that.
  //
  // This asked for exactly one buzz, which is the preemption property — and it
  // is not testable here. The ration is keyed to the wall clock while
  // fastForward moves only the sim clock, so on a slow machine the dozen ticks
  // of a run-over outlast the 90 ms window and the splat lands after it. That
  // is the harness being slow, not the channel misbehaving, and it failed in
  // CI while passing everywhere else.
  //
  // Nor would counting have tested what it looked like it tested. The tiers
  // only decide the SECOND buzz of a pair, and which of these two is second is
  // not fixed: the star fires inside kill() and the splat right after it, so a
  // window holding one kill sends star-then-splat — but a window can hold two,
  // the earlier one splatting before the heat crosses, and then the order is
  // the other way round. Flipping splat above the star leaves an order-based
  // check passing regardless.
  //
  // So the preemption is pinned at the module door, driven back to back with
  // no clock in the way, and what belongs here is the wiring: run somebody
  // down for the star and the star reaches your hand. It is a single pulse
  // where the splat is a pattern, and godMode rules out the other scalars.
  // One more subtlety, found by it going red: "a single pulse" was the wrong
  // signature for the star. wantedUp counts the star out in TAPS, so it is a
  // single pulse only when the kill lights the FIRST one — light the second
  // and a perfectly correct [20,65,36] arrives and the check fails on a real
  // outcome. So the star is identified by contrast with the splat instead,
  // taking the splat's own signature from the controlled one recorded above
  // rather than hardcoding it: any buzz that is not splat-shaped is the star.
  var splatSig = Array.isArray(world.splat[0]) ? world.splat[0] : null;
  check('haptics: and the star that kill earns reaches the hand too',
    !!splatSig && world.firstKill.some(function (v) {
      if (typeof v === 'number') return true;      // a bare pulse is never a splat
      return !(Array.isArray(v) && v[0] === splatSig[0] && v[1] === splatSig[1]);
    }),
    'buzzes from the kill that lit it=' + JSON.stringify(world.firstKill) +
    ' splat=' + JSON.stringify(world.splat[0]));
  check('haptics: a star going up buzzes, and going clear buzzes differently',
    world.wantedUp.length === 1 && world.wantedClear.length === 1 &&
    JSON.stringify(world.wantedUp) !== JSON.stringify(world.wantedClear),
    'up=' + JSON.stringify(world.wantedUp) + ' clear=' + JSON.stringify(world.wantedClear));
  check('haptics: the ride catching fire sounds the alarm (anchor sanity: it caught)',
    world.stage >= 2 && world.onFire.length === 1 && world.onFire[0].length === 5,
    'stage=' + world.stage + ' sent=' + JSON.stringify(world.onFire));
  check('haptics: and the group leaves the player on foot and clean (anchor sanity)',
    world.onFoot === true);

  // ---- the blast ----
  // explodeCar never touched cameraShake, so the knock channel could not see
  // it: everything a car going up beside you used to send was the generic
  // damage tick, and that only if the blast reached far enough to hurt.
  var blast = await page.evaluate(function () {
    var P = GAME.player, r = {};
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    P.health = 100; P.state = 'alive';
    GAME.test.teleport(356, 120);
    GAME.test.fastForward(0.5);
    GAME.godMode = true;             // the blast damages, and hurt() is a second cause
    var mine = [];

    // Blow up the car we SPAWNED. Searching for the nearest instead made this
    // a hostage of the traffic: an ordinary car happening to stop closer than
    // the one placed here silently swapped which range was being measured.
    function blow(dx) {
      var car = GAME.test.spawnCar('sedan', dx, 0);
      GAME.test.fastForward(0.2);
      if (!car) return { none: true };
      var best = U.dist2(car.pos.x, car.pos.z, P.pos.x, P.pos.z);
      mine.push(car);
      GAME.haptics.testReset(); window.__buzz.length = 0;
      GAME.vehicles.explodeCar(car, 'test');
      return { sent: window.__buzz.slice(), dist: Math.round(Math.sqrt(best)), dead: !!car.dead };
    }
    r.near = blow(5);
    GAME.test.fastForward(1);
    r.far = blow(22);
    // and one over the horizon must not reach the hand at all
    var far = GAME.vehicles.spawnCar('sedan', 356, -400, 0);
    mine.push(far);
    GAME.test.fastForward(0.2);
    GAME.haptics.testReset(); window.__buzz.length = 0;
    GAME.vehicles.explodeCar(far, 'test');
    r.offscreen = window.__buzz.slice();
    GAME.godMode = false;
    P.health = 100;
    // Clear the wrecks away. explodeCar blackens a car and leaves it standing
    // — the bubble collects it eventually, but "eventually" is three groups
    // later, and the showroom below counts cars and the race needs a field.
    for (var m = 0; m < mine.length; m++) GAME.vehicles.removeCar(mine[m]);
    GAME.test.fastForward(0.3);
    // Assert what this group CONTROLS. Counting the world's cars instead
    // failed one run in two: the spawn bubble is filling the street back in
    // over the same window, so the total can rise however tidy we were.
    r.left = mine.filter(function (c) { return GAME.world.cars.indexOf(c) !== -1; }).length;
    r.spawned = mine.length;
    return r;
  });
  check('haptics: two cars blew up at different ranges (anchor sanity)',
    blast.near.dead === true && blast.far.dead === true && blast.near.dist < blast.far.dist,
    'near=' + blast.near.dist + 'm far=' + blast.far.dist + 'm');
  check('haptics: a blast is felt, and it is not the generic damage tick',
    blast.near.sent.length === 1 && Array.isArray(blast.near.sent[0]) &&
    blast.near.sent[0][0] > 22,
    'sent=' + JSON.stringify(blast.near.sent));
  check('haptics: and it fades with range rather than being on or off',
    blast.far.sent.length === 1 && Array.isArray(blast.far.sent[0]) &&
    blast.far.sent[0][0] < blast.near.sent[0][0],
    'near=' + JSON.stringify(blast.near.sent[0]) + ' far=' + JSON.stringify(blast.far.sent[0]));
  check('haptics: a wreck across the map does not reach the hand',
    blast.offscreen.length === 0, 'sent=' + JSON.stringify(blast.offscreen));
  check('haptics: and every wreck it made is cleared behind it (anchor sanity)',
    blast.spawned === 3 && blast.left === 0,
    'spawned=' + blast.spawned + ' still in the world=' + blast.left);

  // ---- the canopy ----
  var chute = await page.evaluate(function () {
    var P = GAME.player, r = {};
    GAME.test.teleport(356, 160);
    GAME.test.fastForward(0.5);
    P.health = 100; P.state = 'alive';
    // Put them under a canopy three metres up and let it fly into the ground.
    // startParachute takes the position to open AT — called bare it runs
    // Vector3.set(undefined...), which Three assigns raw, and the whole glide
    // then happens at an undefined coordinate.
    var cy = GAME.city.surfaceY(P.pos.x, P.pos.z);
    GAME.haptics.testReset(); window.__buzz.length = 0;
    GAME.aircraft.startParachute(P.pos.x, cy + 3, P.pos.z, 0);
    r.openSent = window.__buzz.slice();
    r.opened = !!P.parachuting;
    r.openedAt = Math.round((P.pos.y - cy) * 10) / 10;
    GAME.haptics.testReset(); window.__buzz.length = 0;
    for (var i = 0; i < 90 && P.parachuting; i++) GAME.test.fastForward(1 / 60);
    r.landed = !P.parachuting;
    r.sent = window.__buzz.slice();
    GAME.test.fastForward(0.3);
    return r;
  });
  check('haptics: the canopy opened above the ground and came down (anchor sanity)',
    chute.opened === true && chute.landed === true && chute.openedAt > 1,
    'opened=' + chute.opened + ' at=' + chute.openedAt + 'm landed=' + chute.landed);
  check('haptics: the canopy filling is felt, and felt hard',
    chute.openSent.length === 1 && typeof chute.openSent[0] === 'number' && chute.openSent[0] >= 60,
    'sent=' + JSON.stringify(chute.openSent));
  check('haptics: touching down under a canopy is felt, and felt gently',
    chute.sent.length === 1 && typeof chute.sent[0] === 'number' && chute.sent[0] < 30,
    'sent=' + JSON.stringify(chute.sent));
  check('haptics: open hard, land soft — the pair reads as a pair',
    chute.openSent[0] > chute.sent[0] * 2,
    'open=' + chute.openSent[0] + ' land=' + chute.sent[0]);

  // ---- the runway ----
  // The one sustained channel, and the only thing here that runs on its own
  // timer rather than on a call from the game. Three things have to hold or it
  // is worse than nothing: it has to keep pulsing, it has to stop on its own
  // when the caller goes quiet, and it must never take the channel from a
  // one-shot.
  //
  // Counted in PULSES rather than over a stopwatch. The pump asks for its next
  // slot 200 ms out, and on a real device that is 200 ms — but here the page
  // renders a whole city through swiftshader and one frame can hold the main
  // thread for half a second, so the timer lands whenever the thread next
  // frees up. Measured against a clock this reads as a broken pump; measured
  // in pulses it is exactly the pump working.
  async function waitFor(fn, ms) {
    return page.waitForFunction(fn, null, { timeout: ms || 25000 })
      .then(function () { return true; }, function () { return false; });
  }
  await page.evaluate(function () {
    GAME.haptics.testReset();
    window.__buzz.length = 0;
    // Same guard as the one-shots above, for the same reason: these reach for
    // the channel by name, and a build without it would throw in the page and
    // take the runner down rather than report anything. It cost a control run
    // to learn that once already.
    window.__rumbleState = function () {
      return typeof GAME.haptics.testRumble === 'function'
        ? GAME.haptics.testRumble() : { missing: true, on: null, armed: null };
    };
    // Drive the keepalive from a timer rather than from the plane, so this is
    // a test of the channel and not of whether a Skywhistle can be found and
    // got up to speed inside a headless frame budget. The wiring in
    // updatePlane is covered on its own, below.
    window.__roll = setInterval(function () { window.__hap('rumble', 0.8); }, 30);
  });
  // Count the rumble's own trains, not everything in the recorder. The world
  // is live around a player standing in the street, and a one-shot landing
  // mid-roll — traffic clipping them, anything — is a bare number rather than
  // a pattern. Requiring every entry to be a train made an EXPECTED event fail
  // the check, which is the opposite of what it is for: there is a check just
  // below asserting a one-shot does cut through.
  await page.evaluate(function () {
    window.__trains = function () {
      return window.__buzz.filter(function (v) { return Array.isArray(v); });
    };
  });
  var pulsed = await waitFor(function () { return window.__trains().length >= 3; });
  var roll = await page.evaluate(function () {
    var mid = { sent: window.__trains() };
    // a crash mid-roll has to cut straight through it
    window.__buzz.length = 0;
    GAME.haptics.knock(1);
    mid.knockGotThrough = window.__buzz.slice();
    return mid;
  });
  var resumed = await waitFor(function () { return window.__trains().length >= 2; });
  await page.evaluate(function () {
    // the caller going quiet is the whole of switching it off — there is no
    // off switch to forget, which is the point of the keepalive
    clearInterval(window.__roll);
    window.__buzz.length = 0;
  });
  var woundDown = await waitFor(function () { return !window.__rumbleState().armed; }, 8000);
  // Clear the buffer AFTER it has disarmed, not before, and then watch a beat.
  // The channel runs on its own timer, so a keepalive scheduled a moment
  // before the caller went quiet can still land while it is winding down —
  // which is the channel stopping, not the channel failing to stop, and it
  // failed this check on one run in five. What matters is that nothing keeps
  // arriving afterwards.
  await page.evaluate(function () { window.__buzz.length = 0; });
  await page.waitForTimeout(700);
  var rollOff = await page.evaluate(function () {
    return { sent: window.__buzz.slice(), state: window.__rumbleState() };
  });
  check('haptics: the runway rumble keeps pulsing, and in a pattern',
    pulsed && roll.sent.length >= 3 &&
    roll.sent.every(function (v) { return v.length >= 5; }),
    'pulses=' + roll.sent.length + ' first=' + JSON.stringify(roll.sent[0]));
  check('haptics: a crash mid-roll cuts straight through it',
    roll.knockGotThrough.length === 1 && roll.knockGotThrough[0] === 55,
    'sent=' + JSON.stringify(roll.knockGotThrough));
  check('haptics: and the rumble picks back up behind it', resumed === true);
  check('haptics: the caller going quiet winds it down, and stays down',
    woundDown && !rollOff.state.missing && rollOff.state.on === false &&
    rollOff.sent.filter(function (v) { return Array.isArray(v); }).length === 0,
    'state=' + JSON.stringify(rollOff.state) + ' sent in the 0.7 s after it disarmed=' +
    JSON.stringify(rollOff.sent));

  // and the wiring: a plane on its wheels with the throttle open arms it
  var plane = await page.evaluate(function () {
    var P = GAME.player, K = GAME.input.keys, r = {};
    window.__hap('rumble', 0);
    if (P.inCar) GAME.exitCar();
    P.health = 100;
    GAME.test.teleport(356, 200);
    GAME.test.fastForward(0.5);
    // Board the plane we just made, rather than hunting for the nearest car.
    // enterNearestCar searches 10 m around the player, and an unpowered
    // airframe does not sit still — the aircraft branch has it falling to
    // whatever is under it from the moment it exists — so on some ground it
    // had drifted out of reach by the time this asked. Four checks failed
    // together when it did, because the block gives up here and returns.
    //
    // The wait is a full second either way: enterCar plays the door out before
    // P.inCar turns over and that runs to about 35 frames, so the 0.6 s this
    // replaces was two frames of margin.
    var plane = GAME.test.spawnCar('airplane', 5, 0);
    GAME.test.fastForward(0.3);
    if (plane) GAME.enterCar(plane);
    GAME.test.fastForward(1.2);
    var car = P.car;
    r.inPlane = !!(car && car.spec.plane);
    r.spawned = !!plane;
    if (!r.inPlane) return r;
    car.pos.y = GAME.city.surfaceY(car.pos.x, car.pos.z) + car.spec.wheelH;
    car.speed = 0; car.pitch = 0;
    GAME.haptics.testReset();
    K['KeyW'] = true;                       // throttle open on the wheels
    GAME.test.fastForward(0.5);
    r.rolling = window.__rumbleState();
    r.speed = Math.round(car.speed * 10) / 10;
    r.onGround = car.pos.y <= GAME.city.surfaceY(car.pos.x, car.pos.z) + car.spec.wheelH + 0.35;
    K['KeyW'] = false;
    // lift it off and the same call stops arming
    car.pos.y = GAME.city.surfaceY(car.pos.x, car.pos.z) + 40;
    car.speed = 40; car.pitch = 0.2;
    GAME.test.fastForward(0.3);
    r.flying = window.__rumbleState();
    // set it down before stepping out: a step out of a plane forty metres up,
    // with no chute, is a fall that kills now (5l)
    car.pos.y = GAME.city.surfaceY(car.pos.x, car.pos.z) + car.spec.wheelH;
    car.speed = 0; car.pitch = 0;
    GAME.exitCar();
    window.__hap('rumble', 0);
    // and take the plane with us: it was left forty metres up, and the groups
    // below want a tidy world rather than an airliner hanging over the city
    GAME.vehicles.removeCar(car);
    GAME.test.fastForward(0.4);
    r.onFoot = !GAME.player.inCar;
    r.planeGone = GAME.world.cars.indexOf(car) === -1;
    return r;
  });
  check('haptics: a plane is on the runway with the throttle open (anchor sanity)',
    plane.inPlane === true && plane.onGround === true && plane.speed > 0,
    'spawned=' + plane.spawned + ' inPlane=' + plane.inPlane +
    ' onGround=' + plane.onGround + ' speed=' + plane.speed);
  check('haptics: the takeoff run arms the rumble',
    plane.rolling && plane.rolling.armed === true && plane.rolling.v > 0.2,
    'state=' + JSON.stringify(plane.rolling));
  check('haptics: and leaving the ground disarms it',
    plane.flying && !plane.flying.missing && plane.flying.armed === false,
    'state=' + JSON.stringify(plane.flying));
  check('haptics: and the group leaves the player on foot and the sky empty (anchor sanity)',
    plane.onFoot === true && plane.planeGone === true,
    'onFoot=' + plane.onFoot + ' planeGone=' + plane.planeGone);

  check('haptics: the handedness switch is hidden off a touch device',
    (await page.evaluate(function () {
      return document.getElementById('pause-lefty').style.display;
    })) === 'none');
  check('haptics: the rumble switch is hidden where nothing could buzz',
    (await page.evaluate(function () {
      return document.getElementById('pause-haptic').style.display;
    })) === 'none');
  await page.evaluate(function () { navigator.vibrate = window.__realVibrate; });

  // ---------- 8: the frame budget ----------
  // Unlike the groups above these are specification rather than regression:
  // the controller is new, so there is no earlier behaviour to fail against.
  // What they pin is the half that is easy to get wrong — a governor that
  // only ever ratchets down is worse than none at all.
  var perf = await page.evaluate(function () {
    var P = GAME.perf, r = {};
    P.testReset();
    r.restScale = P.scale;
    r.restBudget = P.budget(12);

    // slow frames, but still inside the warmup: boot costs are not evidence
    for (var i = 0; i < 60; i++) P.sample(40);
    r.ema = Math.round(P.frameMs);
    for (var j = 0; j < 60; j++) P.update(0.04);     // 2.4 s, warmup is 3
    r.duringWarmup = P.scale;
    for (var k = 0; k < 40; k++) P.update(0.04);     // past it
    r.afterWarmup = P.scale;

    // all the way down, and no further
    for (var m = 0; m < 60; m++) P.update(0.5);
    r.floor = P.scale;
    r.floorBudget = P.budget(12);
    r.neverZero = P.budget(1);

    // and back up once the frames come good again
    P.testFrames(1000 / 120);
    for (var n = 0; n < 60; n++) P.update(0.5);
    r.recovered = P.scale;
    r.recoveredBudget = P.budget(12);

    // between the two thresholds it should hold, not hunt
    P.testFrames(20);
    var held = P.scale;
    for (var q = 0; q < 40; q++) P.update(0.5);
    r.deadBandDrift = Math.abs(P.scale - held);

    P.testReset();
    return r;
  });
  check('budget: a healthy frame spends the full authored cap (anchor sanity)',
    perf.restScale === 1 && perf.restBudget === 12, 'scale=' + perf.restScale + ' budget=' + perf.restBudget);
  check('budget: slow frames actually moved the average (anchor sanity)',
    perf.ema > 22, 'ema=' + perf.ema);
  check('budget: nothing is cut while the first seconds are still settling',
    perf.duringWarmup === 1, 'scale=' + perf.duringWarmup);
  check('budget: past the warmup, late frames thin the crowd',
    perf.afterWarmup < 1, 'scale=' + perf.afterWarmup);
  check('budget: it stops at the floor rather than emptying the city',
    perf.floor > 0.3 && perf.floor < 0.4 && perf.floorBudget === 4,
    'scale=' + perf.floor + ' budget=' + perf.floorBudget);
  check('budget: it never asks for none of something', perf.neverZero >= 1, 'budget=' + perf.neverZero);
  check('budget: the crowd comes back when the frames do',
    perf.recovered === 1 && perf.recoveredBudget === 12,
    'scale=' + perf.recovered + ' budget=' + perf.recoveredBudget);
  check('budget: between the thresholds it holds instead of hunting',
    perf.deadBandDrift === 0, 'drift=' + perf.deadBandDrift);

  // and the spawners actually ask it
  var wired = await page.evaluate(function () {
    var asked = [], real = GAME.perf.budget;
    GAME.perf.budget = function (n) { asked.push(n); return real(n); };
    GAME.test.fastForward(3);
    GAME.perf.budget = real;
    var S = GAME.settings;
    return { traffic: asked.indexOf(S.maxTraffic) >= 0, peds: asked.indexOf(S.maxPeds) >= 0,
             parked: asked.indexOf(S.maxParked) >= 0, n: asked.length };
  });
  check('budget: traffic, pedestrians and parked cars all ask it what they may spend',
    wired.traffic && wired.peds && wired.parked,
    'traffic=' + wired.traffic + ' peds=' + wired.peds + ' parked=' + wired.parked + ' calls=' + wired.n);

  // ---------- 9: a purchase is delivered once ----------
  // The forecourt bay a bought vehicle belongs in is created by the same
  // purchase, so the delivered car has to be its occupant. Unlinked, the bay
  // reads empty and the parked spawner fills it with a twin a few frames
  // later — right next to you, since a garage bay is 'special' and has no
  // distance floor.
  var buy = await page.evaluate(function () {
    var P = GAME.player, K = GAME.input.keys;
    GAME.police.clearWanted();
    P.health = 100;
    if (P.inCar) GAME.exitCar();
    GAME.test.teleport(64, 384);            // the showroom forecourt
    GAME.test.fastForward(1);
    var before = GAME.world.cars.filter(function (c) { return c.type === 'buggy'; }).length;
    GAME.test.addCash(200000);
    var opened = GAME.shops.open('showroom0');
    var bought = GAME.shops.buy('buggy');
    GAME.shops.close();
    if (GAME.share.isOpen) GAME.share.hide();
    GAME.test.fastForward(4);
    function nearBay(excl) {
      return GAME.world.cars.filter(function (c) {
        return c.type === 'buggy' && c !== excl && U.dist2(c.pos.x, c.pos.z, 64, 384) < 70 * 70;
      });
    }
    var onDelivery = nearBay(null);
    var bay = GAME.shops.garageSpot('buggy');
    var linked = !!(bay && bay.live && onDelivery.indexOf(bay.live) >= 0);

    // Now TAKE IT OUT, which is when the twin turns up: the bay sits ~7 m from
    // the forecourt, inside the spawner's clearance check, so nothing can
    // restock it while the delivered car is still standing on it. Drive clear
    // and the check passes — and with nothing linking car to bay, the bay
    // reads empty and is refilled on the spot, in view.
    // the delivered one specifically: "nearest" is a lottery on a live street,
    // and this check is about the car that came out of the showroom
    GAME.test.enterNearestCar(onDelivery[0] || null);
    GAME.test.fastForward(2);
    var driving = !!(P.car && P.car.type === 'buggy');
    // Driven out under throttle it only manages a few metres: the dealer lot
    // is a narrow strip between the road and the glass hall, and the delivery
    // heading points at the building. Move it instead — what the bug needs is
    // the car out of the bay's clearance radius while still aboard, not a
    // demonstration that the lot is tight.
    GAME.test.teleport(64, 444);
    GAME.test.fastForward(3);
    var away = P.car ? Math.sqrt(U.dist2(P.car.pos.x, P.car.pos.z, 64, 384)) : 0;
    var twins = nearBay(P.car).length;
    return { opened: !!opened, bought: !!bought, before: before, delivered: onDelivery.length,
             linked: linked, driving: driving, away: away, twins: twins,
             inGarage: GAME.shops.garage().indexOf('buggy') >= 0 };
  });
  check('showroom: the shop opened and the purchase went through (anchor sanity)',
    buy.opened && buy.bought && buy.inGarage && buy.before === 0,
    'opened=' + buy.opened + ' bought=' + buy.bought + ' inGarage=' + buy.inGarage + ' before=' + buy.before);
  check('showroom: exactly one of the bought vehicle is delivered',
    buy.delivered === 1, 'found=' + buy.delivered);
  check('showroom: and it is parked as the occupant of its own forecourt bay',
    buy.linked === true, 'linked=' + buy.linked);
  check('showroom: it is out of the bay with the player aboard (anchor sanity)',
    buy.driving && buy.away > 25, 'driving=' + buy.driving + ' away=' + (buy.away || 0).toFixed(1));
  check('showroom: taking it out does not leave a twin behind',
    buy.twins === 0, 'twins=' + buy.twins);

  // ---------- 10: the race grid and the rubber band ----------
  var race = await page.evaluate(function () {
    var P = GAME.player;
    GAME.police.clearWanted();
    P.health = 100;
    if (P.inCar) GAME.exitCar();
    var def = GAME.missions.DEFS.filter(function (d) { return d.id === 'race0'; })[0];
    GAME.test.teleport(def.start.x, def.start.z - 40);
    GAME.test.fastForward(0.5);
    var _ride = GAME.test.spawnCar('taxi', 4, 0);
    GAME.test.fastForward(0.3);
    GAME.test.enterNearestCar(_ride);
    GAME.test.fastForward(1.5);
    if (!P.inCar || !P.car) return { racing: false };
    GAME.test.teleport(def.start.x, def.start.z);   // onto the start line
    // Step to the GO and measure the GRID, not the race. Run on for a few
    // seconds first and the rivals have simply driven off up the road, which
    // reads as "ahead" whether they lined up in front of the player or behind
    // — the check would pass on either.
    var a = null;
    for (var f = 0; f < 900; f++) {
      GAME.test.fastForward(1 / 60);
      a = GAME.missions.active;
      if (a && a.racers && a.racers.length) break;
    }
    if (!a || a.def.id !== 'race0' || !a.racers.length) return { racing: false, state: a && a.state };

    // every rival must be in front of the player, along the way they face
    var fx = Math.sin(P.car.heading), fz = Math.cos(P.car.heading);
    var aheadOf = a.racers.map(function (r) {
      return Math.round(((r.pos.x - P.car.pos.x) * fx + (r.pos.z - P.car.pos.z) * fz) * 10) / 10;
    });

    // The grid is measured during the countdown, where the cars are still
    // sitting on it. The BAND only runs once the flag drops, so carry on to
    // 'run' before touching it.
    for (var g2 = 0; g2 < 900 && a.state !== 'run'; g2++) GAME.test.fastForward(1 / 60);
    if (a.state !== 'run') return { racing: true, aheadOf: aheadOf, state: a.state };

    // the band: drop one far back and pull one far forward, then read the edge
    var rear = a.racers[0], front = a.racers[1];
    var cp = a.def.cps[a.cpIndex];
    var toCp = Math.sqrt(U.dist2(P.car.pos.x, P.car.pos.z, cp[0], cp[1]));
    var ux = (cp[0] - P.car.pos.x) / toCp, uz = (cp[1] - P.car.pos.z) / toCp;
    rear.pos.x = P.car.pos.x - ux * 60; rear.pos.z = P.car.pos.z - uz * 60;
    front.pos.x = P.car.pos.x + ux * 60; front.pos.z = P.car.pos.z + uz * 60;
    rear.cpIndex = front.cpIndex = a.cpIndex;
    GAME.test.fastForward(1);            // let the race controller drive them once
    var out = { racing: true, aheadOf: aheadOf, state: a.state,
                rearEdge: rear.raceEdge, frontEdge: front.raceEdge,
                myType: P.car.type, rivalType: a.racers[0].type,
                mySpeed: P.car.spec.maxSpeed, rivalSpeed: a.racers[0].spec.maxSpeed };
    // Call the race off. Left running it followed the groups below out of
    // here — the suspension checks drive a car of their own, and a live race
    // scratches the moment they step out of it.
    // Call the race off AND get off the start line. cleanup() clears `active`
    // on the spot, but the trigger is proximity: sat on the marker in a car
    // with no heat, the next tick simply starts the race again — which is
    // what carried a live race into the groups below.
    GAME.missions.failActive('checked');
    GAME.test.teleport(356, 60);
    GAME.test.fastForward(1);
    if (GAME.share.isOpen) GAME.share.hide();
    out.cleared = !GAME.missions.active;
    return out;
  });
  check('race: a race is running with a full field (anchor sanity)', race.racing === true,
    'state=' + race.state);
  if (race.racing) {
    check('race: the whole grid forms in front of the player, within sight',
      race.aheadOf.length === 3 && race.aheadOf.every(function (d) { return d > 2 && d < 30; }),
      'along-heading=' + JSON.stringify(race.aheadOf));
    check('race: a rival left behind is given more car, not more pedal',
      race.rearEdge > 1.05, 'edge=' + race.rearEdge);
    check('race: and one out in front is reined in',
      race.frontEdge < 1, 'edge=' + race.frontEdge);
    check('race: the field turns up in something quicker than the player brought',
      race.rivalType !== race.myType && race.rivalSpeed > race.mySpeed,
      'player=' + race.myType + '(' + race.mySpeed + ') rivals=' + race.rivalType + '(' + race.rivalSpeed + ')');
    check('race: the race is called off before the next group drives (anchor sanity)',
      race.cleared === true);
  }

  // the whole upgrade table at once, without running a race for each
  var up = await page.evaluate(function () {
    var f = GAME.missions.testRivalUpgrade, T = GAME.vehicles.TYPES;
    return ['icecream', 'van', 'ambulance', 'sedan', 'taxi', 'pickup', 'limo', 'buggy',
      'monster', 'sports', 'motorcycle', 'superbike'].map(function (t) {
      var r = f(t), to = T[r.type];
      return { from: t, to: r.type, edge: r.edge,
               faster: to.maxSpeed * r.edge > T[t].maxSpeed,
               sameClass: !!to.bike === !!T[t].bike,
               ground: !to.heli && !to.plane,
               law: r.type === 'police',
               ratio: Math.round(to.maxSpeed / T[t].maxSpeed * 100) / 100 };
    });
  });
  function every(fn) { return up.length === 12 && up.every(fn); }
  check('rivals: whatever you bring, the field is quicker',
    every(function (r) { return r.faster; }),
    JSON.stringify(up.filter(function (r) { return !r.faster; })));
  check('rivals: and always from your own class — a bike race stays a bike race',
    every(function (r) { return r.sameClass && r.ground; }),
    JSON.stringify(up.filter(function (r) { return !r.sameClass || !r.ground; })));
  check('rivals: never the law', every(function (r) { return !r.law; }));
  check('rivals: the upgrade is capped, so the race stays winnable',
    every(function (r) { return r.ratio <= 1.25; }),
    JSON.stringify(up.map(function (r) { return r.from + '->' + r.to + ' x' + r.ratio; })));
  check('rivals: bringing the best of a class buys an engine edge instead',
    up.filter(function (r) { return r.to === r.from; }).length === 2 &&
    up.filter(function (r) { return r.to === r.from; }).every(function (r) { return r.edge > 1; }),
    JSON.stringify(up.filter(function (r) { return r.to === r.from; })));

  // ---------- 11: nothing you do with the pedals steers a jump ----------
  var air = await page.evaluate(function () {
    var P = GAME.player, K = GAME.input.keys;
    GAME.police.clearWanted();
    P.health = 100;
    if (P.inCar) GAME.exitCar();
    GAME.test.teleport(356, 60);            // the strip: long, flat, straight
    GAME.test.fastForward(0.5);
    var _ride = GAME.test.spawnCar('sedan', 4, 0);
    GAME.test.fastForward(0.3);
    GAME.test.enterNearestCar(_ride);
    GAME.test.fastForward(1.5);
    var car = P.car;
    if (!car) return { flew: false };
    // Straight down the strip, PARALLEL to the kerb that runs along x=370.
    // Angle the launch into it instead and the last few frames of the descent
    // clip it — and since a car turned broadside covers more ground in x than
    // one pointing along the strip, the collider pushes the steered flight out
    // and the coast one not at all. That is the wall doing its job, not the
    // wheel steering the jump, but it lands in the same measurement. Fly clear
    // of it; the corridor anchor below is what keeps this honest.
    var H = 0;

    // Launch identically every time and fly it to the ground. The trajectory
    // is set at the lip, so every one of these should land in the same place
    // however the pedals are worked on the way.
    function flight(keys) {
      K['KeyW'] = K['KeyS'] = K['KeyA'] = K['KeyD'] = false;
      car.pos.set(356, GAME.city.groundY(356, 60), 60);
      car.air = 0; car.airVX = car.airVZ = undefined;
      GAME.test.fastForward(1 / 60);        // let the world settle around it
      // Pin the launch state hard, immediately before the lip. Set any earlier
      // and a tick of drag, a nudge from collideStatic, or the damage the last
      // landing did all get a say, and the flights stop being comparable —
      // which is what the launch anchor below caught.
      car.pos.set(356, GAME.city.groundY(356, 60) + 6, 60);
      car.heading = H; car.speed = 26; car.lat = 0; car.vy = 9; car.air = 0;
      car.airVX = car.airVZ = undefined;
      car.jumpRamp = null; car.jumpSpin = 0;
      car.hp = car.spec.hp; car.stage = 0; car.boostT = 0; car.spiked = false;
      // One tick to leave the ground, THEN the inputs. The frame the wheels
      // come off is still a frame on the ramp and the pedals are meant to
      // count for it; what is being measured here is the flight after that.
      GAME.test.fastForward(1 / 60);
      var frozen = Math.round(Math.sqrt((car.airVX || 0) * (car.airVX || 0) +
        (car.airVZ || 0) * (car.airVZ || 0)) * 1000) / 1000;
      for (var k in keys) K[k] = keys[k];
      var x0 = car.pos.x, z0 = car.pos.z, ticks = 0, spin = 0;
      var lx = x0, lz = z0;                 // last sample with the wheels still up
      var path = [[x0, z0, car.pos.y]];
      while (ticks < 400) {
        GAME.test.fastForward(1 / 60);
        ticks++;
        // landStunt zeroes the spin as it scores it, so catch it in flight
        spin = Math.max(spin, Math.abs(car.jumpSpin || 0));
        path.push([car.pos.x, car.pos.z, car.pos.y]);
        if (!car.air) break;                // wheels back down
        lx = car.pos.x; lz = car.pos.z;     // still flying, so this tick counts
      }
      K['KeyW'] = K['KeyS'] = K['KeyA'] = K['KeyD'] = false;
      // Measure to the last AIRBORNE sample, not to where it ends up. The tick
      // that breaks the loop is already a ground tick: the wheels are back on
      // and it drives on the speed/lat that landStunt just decomposed out of
      // the frozen trajectory — which legitimately differ when the body landed
      // rotated. Including it would be measuring how a sideways car scrubs
      // speed, not whether the pedals moved the jump.
      return { dist: Math.round(Math.sqrt(U.dist2(x0, z0, lx, lz)) * 1000) / 1000,
               frozen: frozen, ticks: ticks, spin: spin, path: path,
               turned: Math.abs(U.wrapPI(car.heading - H)) };
    }
    var coast = flight({});
    var braked = flight({ KeyS: true });
    var floored = flight({ KeyW: true });
    var steered = flight({ KeyA: true });
    // Is there anything along the flight the body could have hit? Same cull
    // collideStatic uses — a box only counts as a wall while its top is above
    // the car. If the city ever grows something into this corridor these
    // checks would start measuring the collider instead, so say so out loud
    // rather than let the invariant fail for a reason that is not the code's.
    var blockers = 0;
    for (var pi = 0; pi < coast.path.length; pi++) {
      var pt = coast.path[pi];
      var bx = GAME.city.hash.query(pt[0], pt[1], car.spec.l);
      for (var bj = 0; bj < bx.length; bj++) {
        var bb = bx[bj];
        if (bb.h !== undefined && bb.h <= pt[2] + 0.3) continue;
        if (bb.minY !== undefined && pt[2] < bb.minY - 1) continue;
        blockers++;
      }
    }
    delete coast.path; delete braked.path; delete floored.path; delete steered.path;
    // leave the world tidy: the group below drives a car of its own, and
    // enterNearestCar() hands back the one you are already sitting in
    GAME.exitCar();
    GAME.test.fastForward(0.5);
    return { flew: true, coast: coast, braked: braked, floored: floored, steered: steered,
             blockers: blockers, onFoot: !GAME.player.inCar };
  });
  check('air: the car left the ground and came back (anchor sanity)',
    air.flew && air.coast.ticks > 20 && air.coast.dist > 15,
    'ticks=' + (air.coast || {}).ticks + ' dist=' + (air.coast || {}).dist);
  if (air.flew) {
    check('air: standing on the brakes mid-jump changes nothing',
      Math.abs(air.braked.dist - air.coast.dist) < 0.01,
      'coast=' + air.coast.dist + ' braked=' + air.braked.dist);
    check('air: and neither does holding the throttle — no free metres',
      Math.abs(air.floored.dist - air.coast.dist) < 0.01,
      'coast=' + air.coast.dist + ' floored=' + air.floored.dist);
    check('air: every launch is identical (anchor sanity)',
      // frozen > 0 matters: read this off a build with no held trajectory at
      // all and every flight reports 0, and the anchor would agree they match
      air.coast.frozen > 0 &&
      air.braked.frozen === air.coast.frozen && air.floored.frozen === air.coast.frozen &&
      air.steered.frozen === air.coast.frozen && air.braked.ticks === air.coast.ticks &&
      air.floored.ticks === air.coast.ticks && air.steered.ticks === air.coast.ticks,
      'speed ' + [air.coast, air.braked, air.floored, air.steered].map(function (f) { return f.frozen; }).join('/') +
      '  hang ' + [air.coast, air.braked, air.floored, air.steered].map(function (f) { return f.ticks; }).join('/'));
    check('air: the wheel still turns the body, so spins still score',
      air.steered.turned > 0.3 && air.steered.spin > 0.3,
      'turned=' + air.steered.turned.toFixed(2) + ' spin=' + air.steered.spin.toFixed(2));
    check('air: the corridor is clear, so nothing but the pedals is in play (anchor sanity)',
      air.blockers === 0, 'walls along the flight=' + air.blockers);
    check('air: and the group leaves the player on foot (anchor sanity)', air.onFoot === true);
    check('air: but turning in the air does not steer the jump either',
      Math.abs(air.steered.dist - air.coast.dist) < 0.01,
      'coast=' + air.coast.dist + ' steered=' + air.steered.dist);
  }

  // ---------- 12: suspension carries the load ----------
  var susp = await page.evaluate(function () {
    var P = GAME.player, K = GAME.input.keys;
    function clear() { K['KeyW'] = K['KeyS'] = K['KeyA'] = K['KeyD'] = false; }
    GAME.police.clearWanted();
    P.health = 100;
    GAME.test.teleport(356, 60);              // the strip: long, flat, straight
    GAME.test.fastForward(0.5);
    var _ride = GAME.test.spawnCar('sedan', 3, 0);
    GAME.test.fastForward(0.3);
    GAME.test.enterNearestCar(_ride);
    GAME.test.fastForward(1.5);
    var car = P.car;
    if (!car || !car.susp) return { drove: false };
    // Empty the strip around the car. This group reads a spring, and a car
    // standing on a live street for the settle window gets leaned on by
    // passing traffic — which is what kept the settle check marginal (0.0061
    // against a 0.005 threshold on one run in four) long after the reading
    // itself was averaged. A nudge from a stranger is not the suspension
    // failing to return.
    function clearTraffic() {
      GAME.world.cars.slice().forEach(function (c) {
        if (c !== car && U.dist2(c.pos.x, c.pos.z, car.pos.x, car.pos.z) < 45 * 45) {
          GAME.vehicles.removeCar(c);
        }
      });
    }
    clearTraffic();
    // Wait for the spring to SETTLE rather than assuming a second and a half
    // is enough. It is a damped oscillator being asked to read as zero, and
    // whatever the car is still doing after a spawn and a boarding — rolling
    // off a kerb, taking a nudge from traffic — rides on top of it.
    function settle(limit) {
      var n = 0;
      clear();
      // Wait for the car to be at REST, not merely for the spring to cross
      // zero on the way past. A car still rolling is a car still being
      // decelerated, and a steady deceleration holds a steady spring offset —
      // so the 0.2 s settle-and-read below caught that offset and called it
      // "not settled" when the body was doing exactly what it should. The
      // brake case leaves the car at -0.7 m/s, and once an unasked-for
      // reverse decays on its own constant (SHUNT_DRAG, vehicles.js) rather
      // than coasting, 0.7 m/s is enough to hold 0.37 degrees of pitch.
      while (n < limit && (Math.abs(car.susp.p) > 0.004 || Math.abs(car.speed) > 0.05)) {
        if (n % 30 === 0) clearTraffic();
        GAME.test.fastForward(1 / 60); n++;
      }
      GAME.test.fastForward(0.2);
      return n;
    }
    var restTicks = settle(420);
    var rest = { p: car.susp.p, grade: car.bodyPitch, mesh: car.mesh.rotation.x, ticks: restTicks };

    // Watch the whole window, not the instant it ends.
    //
    // susp.p is a SPRING — about 1.9 Hz at a damping ratio near 0.7, settled
    // inside half a second — so reading it once, half a second in, samples a
    // damped oscillator at whatever phase it happens to be in. Catch it past
    // its peak and on the way back through zero and the deflection reads as
    // nothing. What "braking dives it" means is that the nose went down at
    // some point in the braking, so take the extremes over the window.
    function phase(secs, key) {
      clear();
      K[key] = true;
      var lo = 0, hi = 0, n = Math.round(secs * 60);
      for (var f = 0; f < n; f++) {
        GAME.test.fastForward(1 / 60);
        lo = Math.min(lo, car.susp.p);
        hi = Math.max(hi, car.susp.p);
      }
      return { lo: lo, hi: hi, p: car.susp.p, speed: car.speed };
    }
    var squat = phase(0.5, 'KeyW');           // open the throttle
    var dive = phase(0.5, 'KeyS');            // and stand on the brakes

    // 900, not 420: settling now includes coming to a STOP, and a car left
    // rolling backwards off the throttle takes about ten seconds to coast
    // down on the ordinary drag alone. The ceiling is here to catch a
    // spring that never returns, not to time the roll.
    var settledTicks = settle(900);           // let it settle, however long that takes
    // The MEAN over a second, not one instant. "It settles back to the grade"
    // is a claim about where the spring stays, and reading it at a single
    // moment 0.2 s after the settle loop exits made it a claim about that
    // moment: anything that touches the car in that frame — traffic drifting
    // into it, a kerb, the tail of the spring's own oscillation — reads as a
    // failure to settle. It went red on CI three times while passing four
    // runs locally, which is the measurement talking, not the suspension.
    var settleSum = 0, settleN = 0;
    for (var sn = 0; sn < 60; sn++) {
      if (sn % 20 === 0) clearTraffic();
      GAME.test.fastForward(1 / 60);
      settleSum += Math.abs(car.susp.p); settleN++;
    }
    var settled = settleSum / settleN;

    // in the air nothing loads the springs
    K['KeyW'] = true;
    GAME.test.fastForward(1.5);
    car.pos.y += 8; car.air = 1; car.vy = 4;
    GAME.test.fastForward(0.4);
    var air = car.susp.p;
    clear();
    GAME.test.fastForward(2);
    return { drove: true, rest: rest, squat: squat, dive: dive, settled: settled, air: air,
             settledTicks: settledTicks,
             sum: Math.abs(car.mesh.rotation.x - (car.bodyPitch + car.susp.p)) };
  });
  check('suspension: the player is driving a car with springs (anchor sanity)', susp.drove === true);
  if (susp.drove) {
    check('suspension: at rest the body sits on the grade and nothing else',
      Math.abs(susp.rest.p) < 0.005 && susp.rest.ticks < 420,
      'susp=' + susp.rest.p + ' after ' + susp.rest.ticks + ' ticks of settling');
    check('suspension: opening the throttle lifts the nose',
      susp.squat.lo < -0.01 && susp.squat.speed > 3,
      'furthest the nose came up=' + susp.squat.lo.toFixed(4) + ' speed=' + susp.squat.speed.toFixed(1));
    check('suspension: braking dives it the other way',
      susp.dive.hi > 0.01 && susp.dive.speed < susp.squat.speed,
      'furthest it dived=' + susp.dive.hi.toFixed(4) +
      ' speed ' + susp.squat.speed.toFixed(1) + ' -> ' + susp.dive.speed.toFixed(1));
    check('suspension: and it settles back to the grade',
      susp.settled < 0.005 && susp.settledTicks < 900,
      'mean |susp| over the second after settling = ' + susp.settled.toFixed(4) +
      ', reached after ' + susp.settledTicks + ' ticks');
    check('suspension: nothing loads the springs in mid-air',
      Math.abs(susp.air) < 0.01, 'susp=' + susp.air.toFixed(4));
    check('suspension: the mesh angle is exactly grade plus spring (additive, not replaced)',
      susp.sum < 1e-9, 'difference=' + susp.sum);
  }

  // a bike leans; it has no body to pitch on springs, and the rider owns it
  var bike = await page.evaluate(function () {
    var P = GAME.player, K = GAME.input.keys;
    GAME.exitCar();
    GAME.test.fastForward(0.6);
    // clear of the car just parked: a bike spawned against it is wedged, and
    // then this measures nothing at all
    GAME.test.teleport(356, 160);
    GAME.test.fastForward(0.5);
    var _ride = GAME.test.spawnCar('motorcycle', 5, 0);
    GAME.test.fastForward(0.3);
    GAME.test.enterNearestCar(_ride);
    GAME.test.fastForward(1.5);
    var car = P.car;
    if (!car || car.type !== 'motorcycle') return { onBike: false };
    K['KeyW'] = true;
    GAME.test.fastForward(2);
    var p = car.susp ? car.susp.p : 0, speed = car.speed;
    K['KeyW'] = false;
    GAME.test.fastForward(1);
    return { onBike: true, p: p, speed: speed };
  });
  check('suspension: the bike is under way (anchor sanity)',
    bike.onBike === true && bike.speed > 3, 'speed=' + (bike.speed || 0).toFixed(1));
  check('suspension: a bike gets none of it', Math.abs(bike.p) < 0.005, 'susp=' + (bike.p || 0).toFixed(4));

  // ---------- 13: the touch stick lets go when the viewport changes ----------
  // The stick is placed where the thumb lands and steers by the offset from
  // that point, in client coordinates. Turn the device mid-drag and that
  // origin belongs to a screen that no longer exists — it can sit off the new
  // viewport entirely, which reads as a stick pinned hard over. The layer
  // only exists on a touch device, so this needs a context of its own.
  var tctx = await browser.newContext({ hasTouch: true, viewport: { width: 900, height: 500 } });
  var tpage = await tctx.newPage();
  var touchErrors = [];
  tpage.on('pageerror', function (e) { touchErrors.push(String(e.message).slice(0, 200)); });
  await tpage.goto(origin + '/index.html', { timeout: 90000 });   // beside a running city, as above
  await tpage.waitForFunction(function () {
    return window.GAME && GAME.test && GAME.city && GAME.city.nodes && GAME.city.nodes.length > 0;
  }, null, { timeout: 90000 });
  var stick = await tpage.evaluate(function () {
    GAME.prefs.guide = 'done';   // her welcome answered, as on the main page
    if (GAME.strangers) GAME.strangers.enabled = false;   // and the strangers stood down, as there
    if (GAME.heist) GAME.heist.enabled = false;
    if (GAME.scenes) GAME.scenes.enabled = false;   // and the scenes off
    GAME.missions.acts = false;   // and the jobs one part each
    if (GAME.gangs) GAME.gangs.enabled = false;   // and the gangs off the corners
    GAME.police.tactics = false;   // and the chase polite
    GAME.vehicles.wear = false;   // and the cars whole
    GAME.dj.enabled = false;   // and the DJs quiet
    GAME.test.start();
    GAME.test.fastForward(1);
    var zone = document.getElementById('tstick-zone');
    var base = document.getElementById('tstick-base');
    function touch(el, type, x, y) {
      var t = new Touch({ identifier: 7, target: zone, clientX: x, clientY: y });
      el.dispatchEvent(new TouchEvent(type, {
        touches: [t], changedTouches: [t], targetTouches: [t], bubbles: true, cancelable: true
      }));
    }
    touch(zone, 'touchstart', 120, 380);
    touch(window, 'touchmove', 172, 380);        // 52 px over = full deflection
    var held = { onTouch: GAME.isTouch, zone: !!zone, x: GAME.input.touch.stickX, base: base.style.display };

    // The viewport changing under an active drag. Dispatched rather than
    // physically resized: a CI runner launches Chromium maximized, where
    // setViewportSize is a protocol error, and the listener is the thing under
    // test — who fires it does not matter. It also removes a race the physical
    // resize had, since setViewportSize resolves when the viewport is set and
    // not when the page has run its listeners, while dispatchEvent returns
    // only once they all have.
    window.dispatchEvent(new Event('resize'));
    var after = { x: GAME.input.touch.stickX, y: GAME.input.touch.stickY, base: base.style.display };

    // a release that never re-arms would be no better than the bug
    touch(zone, 'touchstart', 100, 300);
    touch(window, 'touchmove', 152, 300);
    var regrab = GAME.input.touch.stickX;
    return { held: held, after: after, regrab: regrab };
  });
  check('touch: the layer is live and the stick is deflected (anchor sanity)',
    stick.held.onTouch && stick.held.zone && Math.abs(stick.held.x) > 0.5 && stick.held.base === 'block',
    'x=' + stick.held.x + ' base=' + stick.held.base);
  check('touch: a viewport change lets the stick go',
    stick.after.x === 0 && stick.after.y === 0, 'x=' + stick.after.x + ' y=' + stick.after.y);
  check('touch: and puts the stick away with it', stick.after.base === 'none', 'base=' + stick.after.base);
  check('touch: a fresh grab still steers afterwards', Math.abs(stick.regrab) > 0.5, 'x=' + stick.regrab);
  // The thumb buttons themselves. A virtual button has no travel and no click
  // of its own, so this is the one piece of feedback that has to come from the
  // motor or it does not exist — and it is the cheapest to leave unwired,
  // since nothing on screen looks any different without it.
  var tap = await tpage.evaluate(function () {
    var sent = [];
    navigator.vibrate = function (ms) { sent.push(ms); return true; };
    var btn = null, all = document.querySelectorAll('.tbtn');
    for (var i = 0; i < all.length; i++) {
      if (all[i].style.display !== 'none' && all[i].offsetParent !== null) { btn = all[i]; break; }
    }
    if (!btn) return { found: false };
    function press(el) {
      var t = new Touch({ identifier: 11, target: el, clientX: 10, clientY: 10 });
      el.dispatchEvent(new TouchEvent('touchstart', {
        touches: [t], changedTouches: [t], targetTouches: [t], bubbles: true, cancelable: true
      }));
    }
    GAME.haptics.testReset(); sent.length = 0;
    press(btn);
    var onPress = sent.slice();
    // and the switch beside it means what it says, for these too
    GAME.haptics.setOn(false);
    GAME.haptics.testReset(); sent.length = 0;
    press(btn);
    var whileOff = sent.slice();
    GAME.haptics.setOn(true);
    return { found: true, label: btn.textContent, onPress: onPress, whileOff: whileOff };
  });
  check('touch: there is a thumb button on screen to press (anchor sanity)',
    tap.found === true, 'label=' + tap.label);
  check('touch: pressing one ticks, so it feels pressed at all',
    tap.onPress.length === 1 && tap.onPress[0] > 0,
    'label=' + tap.label + ' sent=' + JSON.stringify(tap.onPress));
  check('touch: and with RUMBLE off it does not',
    tap.whileOff.length === 0, 'sent=' + JSON.stringify(tap.whileOff));

  // RUN and AIM are TOGGLES: one press latches the flag until another press
  // clears it. Nothing released them when the on-foot controls stopped
  // applying, so boarding a car or dying kept them set behind the overlay and
  // handed them back — you came round at the hospital already sprinting, with
  // the button still lit, having pressed nothing.
  var latch = await tpage.evaluate(function () {
    var T = GAME.input.touch, P = GAME.player, r = {};
    function press(el) {
      var t = new Touch({ identifier: 21, target: el, clientX: 10, clientY: 10 });
      el.dispatchEvent(new TouchEvent('touchstart', {
        touches: [t], changedTouches: [t], targetTouches: [t], bubbles: true, cancelable: true
      }));
      el.dispatchEvent(new TouchEvent('touchend', {
        touches: [], changedTouches: [t], targetTouches: [], bubbles: true, cancelable: true
      }));
    }
    var run = null, all = document.querySelectorAll('.tbtn');
    for (var i = 0; i < all.length; i++) if (all[i].textContent === 'RUN') run = all[i];
    if (!run) return { found: false };

    P.health = 100;
    if (P.inCar) GAME.exitCar();
    GAME.test.teleport(-60, 60);
    GAME.test.fastForward(0.5);

    // it latches, which is the whole point of a toggle
    press(run);
    r.held = { flag: !!T.run, lit: run.style.background !== '' };

    // ...and getting into a car lets it go
    var _ride = GAME.test.spawnCar('sedan', 4, 0);
    GAME.test.fastForward(0.3);
    GAME.test.enterNearestCar(_ride);
    // a full second: enterCar plays the door out before P.inCar turns over, and
    // it runs to about 35 frames — half a second lands just short of it and
    // reads exactly like a boarding that never happened
    GAME.test.fastForward(1);
    r.boarded = { inCar: !!P.inCar, flag: !!T.run, lit: run.style.background !== '' };

    // Back out, latch it again, and die on it. Pressed until it is actually
    // ON rather than pressed once and assumed: a toggle left set by the last
    // interruption is INVERTED from then on, so one press turns it off — which
    // is what the control does here, and without this the death case would
    // then pass on a flag that was already clear before anybody died.
    GAME.exitCar();
    GAME.test.fastForward(1);
    press(run);
    r.reheld = !!T.run;
    if (!T.run) press(run);
    r.armed = !!T.run;
    GAME.playerWasted('test');
    GAME.test.fastForward(0.5);
    r.dead = { state: P.state, flag: !!T.run, lit: run.style.background !== '' };
    return r;
  });
  var revivedRun = true;
  try {
    await tpage.evaluate(function () {
      GAME.input.keys['KeyR'] = true;
      GAME.test.fastForward(1.2);
      GAME.input.keys['KeyR'] = false;
    });
    await tpage.waitForFunction(function () { return GAME.player.state === 'alive'; }, null, { timeout: 10000 });
  } catch (e) { revivedRun = false; }
  await tpage.evaluate(function () { GAME.player.health = 100; GAME.test.fastForward(0.5); });
  check('touch: RUN latches when you press it, and stays a toggle (anchor sanity)',
    latch.found !== false && latch.held.flag === true && latch.held.lit === true && latch.reheld === true,
    'first press: ' + JSON.stringify(latch.held) + '  press after a boarding: ' + latch.reheld);
  check('touch: and getting into a car lets it go, button and all',
    latch.boarded && latch.boarded.inCar === true &&
    latch.boarded.flag === false && latch.boarded.lit === false,
    'after boarding: ' + JSON.stringify(latch.boarded));
  check('touch: so does dying on it — you do not come round already sprinting',
    latch.armed === true && latch.dead && latch.dead.state !== 'alive' &&
    latch.dead.flag === false && latch.dead.lit === false,
    'RUN on going in=' + latch.armed + ', after dying: ' + JSON.stringify(latch.dead));
  check('touch: and the player is back on their feet afterwards (anchor sanity)', revivedRun);

  // JOB starts a shift and ends it, as J does — it used to vanish the moment
  // the shift began, so a touchscreen could only clock off by stepping out.
  var endBtn = await tpage.evaluate(function () {
    var P = GAME.player, M = GAME.missions, r = {};
    function press(el) {
      var t = new Touch({ identifier: 31, target: el, clientX: 10, clientY: 10 });
      el.dispatchEvent(new TouchEvent('touchstart', { touches: [t], changedTouches: [t], targetTouches: [t], bubbles: true, cancelable: true }));
      el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [t], targetTouches: [], bubbles: true, cancelable: true }));
    }
    function jobBtn() {
      var all = document.querySelectorAll('.tbtn');
      for (var i = 0; i < all.length; i++) if (/^(JOB|END)$/.test(all[i].textContent)) return all[i];
      return null;
    }
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    GAME.test.teleport(120, -96);
    GAME.test.fastForward(0.3);
    var amb = GAME.vehicles.spawnCar('ambulance', 120, -100, 0, {});
    GAME.test.enterNearestCar(amb); GAME.test.fastForward(1.2);
    var b = jobBtn();
    r.offered = !!b && b.style.display !== 'none' && b.textContent === 'JOB';
    if (b) press(b);
    GAME.test.fastForward(0.5);
    r.onShift = !!(M.active && M.active.def.id === 'ambulance');
    b = jobBtn();
    r.endShown = !!b && b.style.display !== 'none' && b.textContent === 'END';
    if (b) press(b);
    GAME.test.fastForward(0.5);
    r.ended = !M.active && P.inCar;
    b = jobBtn();
    r.backToJob = !!b && b.textContent === 'JOB';
    GAME.exitCar(); GAME.test.fastForward(0.3);
    GAME.vehicles.removeCar(amb);
    return r;
  });
  check('touch: an ambulance offers JOB, and pressing it starts the shift (anchor sanity)',
    endBtn.offered && endBtn.onShift, JSON.stringify(endBtn));
  check('touch: during the shift the button stays, as END', endBtn.endShown, JSON.stringify(endBtn));
  check('touch: and END clocks off without leaving the ambulance', endBtn.ended && endBtn.backToJob, JSON.stringify(endBtn));

  // The plane's barrel roll, on a touchscreen as on the other two: ⟲ and ⟳,
  // in the plane and nowhere else.
  var rollBtn = await tpage.evaluate(function () {
    var P = GAME.player, r = {};
    function btn(t) {
      var all = document.querySelectorAll('.tbtn');
      for (var i = 0; i < all.length; i++) if (all[i].textContent === t) return all[i];
      return null;
    }
    function shown(el) { return !!el && el.style.display !== 'none'; }
    function touch(el, type) {
      var t = new Touch({ identifier: 41, target: el, clientX: 10, clientY: 10 });
      var on = type === 'touchstart';
      el.dispatchEvent(new TouchEvent(type, { touches: on ? [t] : [], changedTouches: [t], targetTouches: on ? [t] : [], bubbles: true, cancelable: true }));
    }
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    GAME.test.teleport(120, -96);
    GAME.test.fastForward(0.3);
    var car = GAME.vehicles.spawnCar('sedan', 120, -100, 0, {});
    GAME.test.enterNearestCar(car); GAME.test.fastForward(1.2);
    r.hiddenInCar = P.inCar && !shown(btn('⟲')) && !shown(btn('⟳'));
    GAME.exitCar(); GAME.test.fastForward(0.3);
    GAME.vehicles.removeCar(car);
    var pl = GAME.vehicles.spawnCar('airplane', 120, -100, 0, {});
    GAME.seatInCar(pl); GAME.test.fastForward(0.1);
    r.shownInPlane = shown(btn('⟲')) && shown(btn('⟳'));
    // and the radio, which plays up here too
    r.radioInPlane = shown(btn('♪'));
    pl.pos.y = 120; pl.speed = 50; pl.vy = 0; pl.pitch = 0; pl.roll = 0;
    var L = btn('⟲');
    if (L) { touch(L, 'touchstart'); GAME.test.fastForward(0.25); touch(L, 'touchend'); }
    r.rolled = +(pl.roll || 0).toFixed(2);
    pl.pos.y = GAME.city.groundY(pl.pos.x, pl.pos.z); pl.speed = 0; pl.vy = 0; pl.roll = 0;
    GAME.exitCar(); GAME.test.fastForward(0.3);
    GAME.vehicles.removeCar(pl);
    return r;
  });
  check('touch: no roll buttons in a car (anchor sanity)', rollBtn.hiddenInCar, JSON.stringify(rollBtn));
  check('touch: in a plane ⟲ and ⟳ are there, and ⟲ rolls it', rollBtn.shownInPlane && rollBtn.rolled > 0.3, JSON.stringify(rollBtn));
  check('touch: and the radio button is there in the air', rollBtn.radioInPlane, JSON.stringify(rollBtn));

  // the camera is one tap away on a touchscreen too
  var camBtn = await tpage.evaluate(function () {
    var b = null, all = document.querySelectorAll('.tbtn');
    for (var i = 0; i < all.length; i++) if (all[i].textContent === '📷') b = all[i];
    if (!b) return { found: false };
    var shown = b.style.display !== 'none' && b.offsetParent !== null;
    var t = new Touch({ identifier: 41, target: b, clientX: 10, clientY: 10 });
    b.dispatchEvent(new TouchEvent('touchstart', { touches: [t], changedTouches: [t], targetTouches: [t], bubbles: true, cancelable: true }));
    b.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [t], targetTouches: [], bubbles: true, cancelable: true }));
    GAME.test.fastForward(1 / 60);
    return { found: true, shown: shown, shooting: GAME.photo.pending || GAME.photo.count > 0 };
  });
  check('touch: there is a camera button, and a tap takes a photo', camBtn.found && camBtn.shown && camBtn.shooting, JSON.stringify(camBtn));

  // Press it, rather than just look at it: the markup ships with the label
  // already reading RUMBLE: ON, so a check that only reads the text passes
  // with the wiring torn out.
  var hapBtn = await tpage.evaluate(function () {
    var sent = [];
    navigator.vibrate = function (ms) { sent.push(ms); return true; };
    var b = document.getElementById('pause-haptic');
    var shown = b.style.display !== 'none', before = GAME.haptics.on, text0 = b.textContent;
    b.click();
    var mid = { on: GAME.haptics.on, text: b.textContent, pref: !!(GAME.prefs && GAME.prefs.rumbleOff) };
    var offSent = sent.slice();
    // and back on, which is the press that has to demonstrate itself
    GAME.haptics.testReset();
    sent.length = 0;
    b.click();
    return { shown: shown, before: before, text0: text0, mid: mid, offSent: offSent,
             onSent: sent.slice(), back: GAME.haptics.on, text2: b.textContent };
  });
  check('touch: the rumble switch is offered on a touch device',
    hapBtn.shown && /RUMBLE/.test(hapBtn.text0), 'shown=' + hapBtn.shown + ' text=' + hapBtn.text0);
  check('touch: pressing it turns rumble off, relabels, and remembers',
    hapBtn.before === true && hapBtn.mid.on === false && /OFF/.test(hapBtn.mid.text) && hapBtn.mid.pref === true,
    'on=' + hapBtn.mid.on + ' text=' + hapBtn.mid.text + ' pref=' + hapBtn.mid.pref);
  // Switching it on and feeling nothing tells you nothing — the setting reads
  // as a promise rather than as something that happened.
  check('touch: switching RUMBLE on demonstrates what was just switched on',
    hapBtn.onSent.length === 1 && Array.isArray(hapBtn.onSent[0]) && hapBtn.onSent[0].length >= 3,
    'sent=' + JSON.stringify(hapBtn.onSent));
  // vibrate(0) is not a buzz, it is the cancel setOn(false) sends to stop a
  // motor that might be mid-pattern — so filter it out rather than count it
  check('touch: and switching it OFF stays silent, which is the whole point',
    hapBtn.offSent.filter(function (v) { return Array.isArray(v) ? v.length : v > 0; }).length === 0,
    'sent=' + JSON.stringify(hapBtn.offSent));
  check('touch: and pressing it again turns it back on',
    hapBtn.back === true && /ON/.test(hapBtn.text2), 'on=' + hapBtn.back + ' text=' + hapBtn.text2);
  // Handedness: the buttons, the stick's half and the camera's half all have
  // to move together. Leaving any one behind puts both thumbs on the same side.
  var hand = await tpage.evaluate(function () {
    var zone = document.getElementById('tstick-zone');
    var canvas = document.getElementById('game-canvas');
    var btn = document.getElementById('pause-lefty');
    function drag(x1, x2) {                  // a camera drag on the canvas
      GAME.input.touch.camDX = 0;
      function fire(type, x) {
        var t = new Touch({ identifier: 9, target: canvas, clientX: x, clientY: 300 });
        (type === 'touchstart' ? canvas : window).dispatchEvent(new TouchEvent(type, {
          touches: [t], changedTouches: [t], targetTouches: [t], bubbles: true, cancelable: true
        }));
      }
      fire('touchstart', x1); fire('touchmove', x2);
      var moved = GAME.input.touch.camDX;
      fire('touchend', x2);
      GAME.input.touch.camDX = 0;
      return moved;
    }
    function shot() {
      var fire = document.getElementById('touch-layer').querySelector('.tbtn');
      return { zoneLeft: zone.style.left, zoneRight: zone.style.right,
               btnLeft: fire.style.left, btnRight: fire.style.right, inset: fire.__inset };
    }
    var W = window.innerWidth;
    var right = shot();
    var rightCamLeft = drag(W * 0.2, W * 0.2 + 40);    // left half: the stick's, not the camera's
    var rightCamRight = drag(W * 0.8, W * 0.8 + 40);
    btn.click();
    var lefty = shot(), leftyOn = GAME.touch.lefty, pref = !!(GAME.prefs && GAME.prefs.lefty);
    var leftyLabel = btn.textContent;
    var leftyCamLeft = drag(W * 0.2, W * 0.2 + 40);    // now the camera's half
    var leftyCamRight = drag(W * 0.8, W * 0.8 + 40);
    btn.click();
    var back = shot();
    return { right: right, lefty: lefty, back: back, leftyOn: leftyOn, pref: pref,
             rightCamLeft: rightCamLeft, rightCamRight: rightCamRight,
             leftyCamLeft: leftyCamLeft, leftyCamRight: leftyCamRight,
             backOn: GAME.touch.lefty, leftyLabel: leftyLabel, backLabel: btn.textContent };
  });
  check('touch: by default the stick owns the left and the buttons the right (anchor sanity)',
    hand.right.zoneLeft === '0px' && hand.right.btnRight !== '' && hand.right.btnLeft === 'auto' &&
    hand.right.inset !== undefined,
    JSON.stringify(hand.right));
  check('touch: and the camera drag lives on the half the stick does not own',
    hand.rightCamLeft === 0 && hand.rightCamRight !== 0,
    'left=' + hand.rightCamLeft + ' right=' + hand.rightCamRight);
  check('touch: switching hands moves the stick to the other side',
    hand.leftyOn === true && hand.lefty.zoneRight === '0px' && hand.lefty.zoneLeft === 'auto',
    JSON.stringify(hand.lefty));
  check('touch: the buttons keep their inset, measured from the other edge',
    hand.lefty.btnLeft === hand.right.inset + 'px' && hand.lefty.btnRight === 'auto',
    'left=' + hand.lefty.btnLeft + ' right=' + hand.lefty.btnRight + ' inset=' + hand.right.inset);
  check('touch: and the camera drag moves with them',
    hand.leftyCamLeft !== 0 && hand.leftyCamRight === 0,
    'left=' + hand.leftyCamLeft + ' right=' + hand.leftyCamRight);
  check('touch: the choice is remembered and the label says which hand it is on',
    hand.pref === true && /LEFT/.test(hand.leftyLabel) && /RIGHT/.test(hand.backLabel),
    'pref=' + hand.pref + ' lefty="' + hand.leftyLabel + '" back="' + hand.backLabel + '"');
  check('touch: switching back restores the original layout',
    hand.backOn === false && hand.back.zoneLeft === '0px' && hand.back.btnRight === hand.right.btnRight,
    JSON.stringify(hand.back));
  // The top row on a touchscreen: radar, PAUSE, the camera, and the
  // fullscreen button while you are windowed. The camera went into the slot
  // the fullscreen button already had, so windowed the two were one muddle
  // with ⛶ on top. And when the browser refuses full screen, the button says
  // so instead of doing nothing.
  // (an earlier tap here may have gone full screen for real: start windowed)
  await tpage.evaluate(function () { return document.fullscreenElement ? document.exitFullscreen().catch(function () { }) : null; });
  await tpage.waitForTimeout(200);
  var fsRow = await tpage.evaluate(function () {
    var cam = null, all = document.querySelectorAll('.tbtn');
    for (var i = 0; i < all.length; i++) if (all[i].textContent === '📷') cam = all[i];
    var fsb = document.getElementById('fs-btn');
    if (!cam || !fsb) return { found: false };
    var was = fsb.style.display;
    fsb.style.display = 'flex';    // as it is whenever you are not full screen
    var c = cam.getBoundingClientRect(), f = fsb.getBoundingClientRect();
    var r = { found: true, apart: f.left >= c.right || f.right <= c.left || f.top >= c.bottom || f.bottom <= c.top,
      camHit: document.elementFromPoint(c.left + c.width / 2, c.top + c.height / 2) === cam,
      fsHit: document.elementFromPoint(f.left + f.width / 2, f.top + f.height / 2) === fsb };
    fsb.style.display = was;
    var m = [], m0 = GAME.hud.message;
    GAME.hud.message = function (t) { m.push(String(t)); return m0.apply(GAME.hud, arguments); };
    r.fsEl = !!GAME.fullscreenEl();
    document.documentElement.requestFullscreen = function () { r.asked = true; return Promise.reject(new TypeError('refused')); };
    GAME.toggleFullscreen();
    return new Promise(function (res) {
      setTimeout(function () {
        GAME.hud.message = m0;
        delete document.documentElement.requestFullscreen;   // the real one again
        r.said = m.some(function (t) { return /would not go full screen/.test(t); });
        res(r);
      }, 250);
    });
  });
  check('touch: the camera and fullscreen buttons each have a slot of their own', fsRow.found && fsRow.apart && fsRow.camHit && fsRow.fsHit, JSON.stringify(fsRow));
  check('touch: a refused full screen says so', fsRow.said, JSON.stringify(fsRow));
  // Lola in the top row, beside the camera, while her tips are on — the
  // pause screen was the only way a touchscreen could call her
  var lolaRow = await tpage.evaluate(function () {
    var all = document.querySelectorAll('.tbtn'), lb = null, cam = null;
    for (var i = 0; i < all.length; i++) { if (all[i].textContent === '📟') lb = all[i]; if (all[i].textContent === '📷') cam = all[i]; }
    var fsb = document.getElementById('fs-btn');
    if (!lb || !cam || !fsb) return { found: false };
    var tips0 = GAME.lola.tips, was = fsb.style.display;
    function overlap(a, b) { return !(a.left >= b.right || a.right <= b.left || a.top >= b.bottom || a.bottom <= b.top); }
    var r = { found: true };
    try {
      GAME.lola.setTips(true); GAME.test.fastForward(0.1);
      fsb.style.display = 'flex';
      var l = lb.getBoundingClientRect(), c = cam.getBoundingClientRect(), f = fsb.getBoundingClientRect();
      r.shown = lb.style.display !== 'none';
      r.apart = !overlap(l, c) && !overlap(l, f) && l.left > c.left && f.left > l.left;
      var t = new Touch({ identifier: 43, target: lb, clientX: l.left + 5, clientY: l.top + 5 });
      lb.dispatchEvent(new TouchEvent('touchstart', { touches: [t], changedTouches: [t], targetTouches: [t], bubbles: true, cancelable: true }));
      lb.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [t], targetTouches: [], bubbles: true, cancelable: true }));
      r.calls = !!GAME.lolaOpen;
      if (GAME.lolaOpen) GAME.lola.close();
      GAME.lola.setTips(false); GAME.test.fastForward(0.1);
      r.hiddenWithTipsOff = lb.style.display === 'none';
      r.fsSteppedBack = fsb.getBoundingClientRect().left < f.left;
    } finally {
      fsb.style.display = was;
      GAME.lola.setTips(tips0); GAME.test.fastForward(0.1);
    }
    return r;
  });
  check('touch: Lola has a button beside the camera that calls her, while her tips are on',
    lolaRow.found && lolaRow.shown && lolaRow.apart && lolaRow.calls && lolaRow.hiddenWithTipsOff && lolaRow.fsSteppedBack, JSON.stringify(lolaRow));
  // IMPORT SAVE on a touchscreen picks the file on a page with no city
  // behind it: the phone's picker sends the tab to the background, where a
  // game this size is what Android reclaims first — the import crashed.
  var imp = {};
  try {
    var save = await tpage.evaluate(function () { GAME.player.cash = 2468; return GAME.exportSave(); });
    var nav = tpage.waitForNavigation({ timeout: 30000 });
    await tpage.evaluate(function () {
      GAME.togglePause();
      document.getElementById('pause-import').dispatchEvent(new MouseEvent('click', { bubbles: true }));
      document.getElementById('game-modal-ok').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await nav;
    await tpage.waitForSelector('#import-card', { timeout: 30000 });
    imp.light = await tpage.evaluate(function () {
      return location.hash === '#import' && !GAME.renderer && !(GAME.city.nodes && GAME.city.nodes.length);
    });
    // a file that is no save is turned away, on the card
    var fc = tpage.waitForEvent('filechooser', { timeout: 10000 });
    await tpage.evaluate(function () { document.getElementById('import-pick').click(); });
    await (await fc).setFiles({ name: 'notes.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') });
    await tpage.waitForTimeout(400);
    imp.refused = await tpage.evaluate(function () { return document.getElementById('import-msg').textContent; });
    fc = tpage.waitForEvent('filechooser', { timeout: 10000 });
    await tpage.evaluate(function () { document.getElementById('import-pick').click(); });
    var ch = await fc;
    nav = tpage.waitForNavigation({ timeout: 30000 });
    await ch.setFiles({ name: 'neon-mayhem-save.json', mimeType: 'application/json', buffer: Buffer.from(save.replace('"cash\\":2468', '"cash\\":13579')) });
    await nav;
    await tpage.waitForFunction(function () { return window.GAME && GAME.city && GAME.city.nodes && GAME.city.nodes.length > 0; }, null, { timeout: 90000 });
    imp.back = await tpage.evaluate(function () { return { hash: location.hash, cash: GAME.player.cash }; });
  } catch (e) { imp.error = String(e).slice(0, 160); }
  check('touch: IMPORT SAVE opens a page of its own, with no city loaded behind the file picker', imp.light === true, JSON.stringify(imp));
  check('touch: a file that is not a save is turned away there', /not a Neon Mayhem save/.test(imp.refused || ''), JSON.stringify(imp));
  check('touch: and a save comes in and the game loads with it', imp.back && imp.back.hash === '' && imp.back.cash === 13579, JSON.stringify(imp));
  check('touch: zero page errors on the touch layer', touchErrors.length === 0, touchErrors[0]);
  await tctx.close();

  // ---------- 13b: memory — what the memory work took off stays off ----------
  // One check per fix, each measured when it was made. Every one of these
  // reads something the old code got wrong, not merely that the new code runs.
  var mem = await page.evaluate(function () {
    var out = {}, P = GAME.player, W = GAME.world;
    GAME.godMode = true;
    if (P.inCar) GAME.exitCar();
    // Spike strips: every roadblock at four stars lays one, and nothing took
    // them up, so a long chase left dozens across the city. Now the oldest
    // goes when a new one is laid.
    function strips() {
      var n = 0;
      GAME.scene.traverse(function (o) {
        var g = o.geometry;
        if (o.isMesh && g && g.parameters && g.parameters.width === 11 && g.parameters.height === 0.12) n++;
      });
      return n;
    }
    var node = GAME.city.nearestNode(0, -300);
    GAME.test.teleport(node.x, node.z);
    var carsBefore = W.cars.slice(), pedsBefore = W.peds.slice();
    var car = GAME.test.spawnCar('sedan', 4, 0);
    GAME.test.enterNearestCar(car);
    GAME.test.fastForward(1.5);               // climbing in takes a moment
    var copsBefore = W.cars.filter(function (c) { return c.isPolice; }).length;
    out.laid = 0;
    if (GAME.police._roadblock && P.inCar) {
      for (var r = 0; r < 12 && out.laid < 6; r++) {
        P.car.vx = 0; P.car.vz = 20;       // heading south at speed, as the roadblock wants
        var n0 = W.cars.length;
        GAME.police._roadblock(5);
        if (W.cars.length > n0) out.laid++;
      }
    }
    out.strips = strips();
    out.copsAdded = W.cars.filter(function (c) { return c.isPolice; }).length - copsBefore;
    if (P.inCar) GAME.exitCar();
    W.cars.filter(function (c) { return carsBefore.indexOf(c) < 0; }).forEach(function (c) { GAME.vehicles.removeCar(c); });
    W.peds.filter(function (p) { return pedsBefore.indexOf(p) < 0; }).forEach(function (p) { GAME.peds.removePed(p); });
    GAME.police.clearWanted();

    // The result card and the full map each kept a canvas the size of the
    // screen for the rest of the session after their first showing.
    GAME.share.show({ slug: 'memory-check', eyebrow: 'check', title: 'CHECK', subtitle: 'check', accent: '#ffffff', stats: [] });
    var sc = document.getElementById('share-canvas');
    out.shareShown = sc ? sc.width * sc.height : -1;
    GAME.share.hide();
    out.shareHidden = sc ? sc.width * sc.height : -1;
    GAME.hud.toggleMap(true);
    var bm = document.getElementById('bigmap');
    out.mapShown = bm ? bm.width * bm.height : -1;
    GAME.hud.toggleMap(false);
    out.mapHidden = bm ? bm.width * bm.height : -1;

    // A texture drawn on a canvas once, uploaded and never redrawn: the
    // canvas went on holding the pixels the GPU already had.
    var st = GAME.city.signTex;
    out.signCanvas = st && st.image ? st.image.width * st.image.height : -1;
    out.signUploaded = st && st.userData && st.userData.w ? st.userData.w * st.userData.h : 0;

    // The ocean's swell was worked out on the CPU and the whole plane sent up
    // again every frame; now the shader moves it and the buffer stays put.
    var ocean = null;
    GAME.scene.traverse(function (o) {
      var g = o.geometry;
      if (o.isMesh && g && g.parameters && g.parameters.width === 3600) ocean = o;
    });
    out.ocean = !!ocean;
    if (ocean) {
      var v0 = ocean.geometry.attributes.position.version;
      for (var u = 0; u < 30; u++) GAME.city.update(1 / 60, 50 + u / 60);
      out.oceanUploads = ocean.geometry.attributes.position.version - v0;
    }

    // A batch held its working arrays after handing the geometry over, so
    // the world was built twice over in memory.
    var gb = new GeoBatch();
    gb.addBox(0, 0, 0, 1, 1, 1, 0, 0xffffff, 0);
    var gg = gb.build();
    out.batchBuilt = gg.attributes.position.count;
    out.batchKept = gb.pos.length;

    // The broadphase built a fresh list (and a Set, and a string per cell)
    // for every query; a caller now hands in the list it keeps.
    var keep = [];
    out.queryInto = typeof GAME.city.hash.queryInto === 'function' &&
      GAME.city.hash.queryInto(P.pos.x, P.pos.z, 40, keep) === keep && keep.length > 0;

    // The island's trees and lamps were thousands of boxes baked into one
    // batch; they are copies of one box now.
    out.biggestInstanced = 0;
    GAME.scene.traverse(function (o) { if (o.isInstancedMesh && o.instanceColor) out.biggestInstanced = Math.max(out.biggestInstanced, o.count); });

    // The land was 258,000 separate triangles with every corner stored in
    // full; it is indexed wedges now, each small enough for 16-bit indices.
    var land = [];
    GAME.scene.traverse(function (o) { if (o.userData && o.userData.land) land.push(o); });
    out.landMeshes = land.length;
    out.landShared = land.length > 0 && land.every(function (m) {
      var g = m.geometry;
      return g.index && g.index.count > 4 * g.attributes.position.count && g.attributes.position.count <= 65536;
    });

    // Static meshes carried position, normal, colour and uv as floats whatever
    // their material read, and kept every array after it was on the GPU.
    var blocks = GAME.city.blockMeshes, packed = 0, loose = 0, released = 0, heldStatic = 0, blocksHeld = 0, bounded = true;
    GAME.scene.traverse(function (o) {
      if (!o.isMesh || !o.geometry || !o.material || Array.isArray(o.material)) return;
      var g = o.geometry, m = o.material;
      if (blocks.indexOf(o) >= 0) { if (g.attributes.position.array) blocksHeld++; return; }
      if (!g.userData.released || !m.vertexColors || m.map || !g.attributes.color) return;
      if (g.attributes.color.normalized && !g.attributes.uv) packed++; else loose++;
    });
    GAME.scene.traverse(function (o) {
      if (!o.isMesh || !o.geometry || !o.geometry.userData.released) return;
      var g = o.geometry;
      if (g.attributes.position.array) heldStatic++; else released++;
      if (!g.boundingSphere) bounded = false;
    });
    out.packed = packed; out.loose = loose;
    out.released = released; out.heldStatic = heldStatic; out.blocksHeld = blocksHeld; out.blocks = blocks.length;
    out.bounded = bounded;

    // Peds and cars picked up their fields as their lives went, and the
    // street held some ninety shapes of one and two dozen of the other — too
    // many for the engine to keep their update loops optimised, which boxed
    // every number they touched. Fresh ones, a stretch of ordinary play and a
    // chase later, all share one.
    var oldCars = W.cars.slice(), oldPeds = W.peds.slice();
    GAME.test.teleport(-150, -150);
    GAME.test.setWanted(3);
    for (var t = 0; t < 60 * 20; t++) { P.health = 100; GAME.tick(1 / 60); }
    GAME.police.clearWanted();
    var carShapes = {}, pedShapes = {}, nc = 0, np = 0;
    W.cars.forEach(function (c) { if (oldCars.indexOf(c) < 0) { carShapes[Object.keys(c).join()] = 1; nc++; } });
    W.peds.forEach(function (p) { if (oldPeds.indexOf(p) < 0) { pedShapes[Object.keys(p).join()] = 1; np++; } });
    out.freshCars = nc; out.freshPeds = np;
    out.carShapes = Object.keys(carShapes).length; out.pedShapes = Object.keys(pedShapes).length;
    GAME.godMode = false;
    return out;
  });

  // The preview in the showroom, the tailor and the hardware store is a
  // second WebGL renderer. Closing the shop left it — and the scene it drew
  // from, holding the city's shared meshes — alive for the rest of the
  // session. The context it draws with while the shop is open must be gone
  // once the shop closes, every visit.
  var pvVisits = [];
  for (var pc = 0; pc < 3; pc++) {
    await page.evaluate(function (pc) {
      var ls = GAME.shops.locations().filter(function (x) { return x.kind === 'showroom' || x.kind === 'dress' || x.kind === 'hardware'; });
      GAME.shops.open(ls[pc % ls.length]);
    }, pc);
    await page.evaluate(function () { return new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(r); }); }); });
    pvVisits.push(await page.evaluate(function () {
      var cv = document.getElementById('shop-preview');
      // asking a canvas for the kind of context it already has returns that one
      var gl = cv && (cv.getContext('webgl2') || cv.getContext('webgl'));
      var live = !!gl && !gl.isContextLost();
      GAME.shops.close();
      return { live: live, lost: !!gl && gl.isContextLost() };
    }));
  }

  // What came after the city's own pack-and-release, and the churn out at sea.
  var mem2 = await page.evaluate(function () {
    var out = {}, P = GAME.player, W = GAME.world, C = GAME.city;
    // The four pale walls kept their 512x384 canvases for the life of the
    // page, only so the facade check could read one pixel back off them;
    // it reads the wall as it was painted now, and the canvases go.
    out.walls = Object.keys(C.texBlk).map(function (k) {
      var t = C.texBlk[k], im = t.map.image, u = t.map.userData || {};
      return { k: k, held: im ? im.width * im.height : 0, up: u.w ? u.w * u.h : 0, lum: t.wallLum };
    });
    // The interiors and the shop fronts are built after the city packed and
    // released its static meshes, so they kept every float: 1.4 MB of the
    // 2.5 MB of geometry still held in JS. Nothing outside the blocks (and
    // the small shared shapes) should hold much now.
    var blocks = new Set(C.blockMeshes.map(function (m) { return m.geometry; })), seen = new Set();
    out.heldMax = 0; out.interiors = null;
    GAME.scene.traverse(function (o) {
      if (!o.isMesh || !o.geometry || seen.has(o.geometry)) return;
      var g = o.geometry; seen.add(g);
      if (g.attributes.position && g.attributes.position.count > 20000 && g.boundingSphere && g.boundingSphere.center.x < -2500)
        out.interiors = { verts: g.attributes.position.count, released: !!g.userData.released, held: !!g.attributes.position.array };
      if (blocks.has(g) || g.userData.shared) return;
      var own = 0;
      for (var k in g.attributes) if (g.attributes[k].array) own += g.attributes[k].array.byteLength;
      if (g.index && g.index.array) own += g.index.array.byteLength;
      out.heldMax = Math.max(out.heldMax, own);
    });
    // Out on the water between the landmasses the spawners' nearest road is
    // further off than anything lasts, and every ped and car they made there
    // was built and thrown away the next tick: fifteen and ten a second.
    function churn(x, z) {
      GAME.test.teleport(x, z);
      GAME.test.fastForward(3);
      var born = new Map(), t = 0, r = { peds: 0, cars: 0, pedsWasted: 0, carsWasted: 0 };
      W.peds.forEach(function (p) { born.set(p, -1); });
      W.cars.forEach(function (c) { born.set(c, -1); });
      for (var i = 0; i < 600; i++) {
        P.health = 100;
        GAME.tick(1 / 60); t++;
        W.peds.forEach(function (p) { if (!born.has(p)) { born.set(p, t); r.peds++; } });
        W.cars.forEach(function (c) { if (!born.has(c)) { born.set(c, t); r.cars++; } });
        born.forEach(function (b, e) {
          if (b < 0 || W.peds.indexOf(e) >= 0 || W.cars.indexOf(e) >= 0) return;
          if (t - b < 60) { if (e.kind === 'ped') r.pedsWasted++; else r.carsWasted++; }
          born.set(e, -2);
        });
      }
      r.livePeds = W.peds.length; r.liveCars = W.cars.length;
      return r;
    }
    GAME.godMode = true;
    if (P.inCar) GAME.exitCar();
    out.sea = churn(560, 0);
    out.sea.wet = C.isInWater(P.pos.x, P.pos.z);
    var node = C.nearestNode(120, -40);
    out.land = churn(node.x, node.z);
    GAME.godMode = false;
    return out;
  });

  check('memory: roadblocks were laid (anchor sanity)', mem.laid >= 4 && mem.copsAdded >= 8,
    mem.laid + ' roadblocks, ' + mem.copsAdded + ' cruisers');
  check('memory: and no more than three spike strips lie about', mem.strips <= 3, mem.strips + ' strips');
  check('memory: the result card has a canvas while it shows (anchor sanity)', mem.shareShown > 0, mem.shareShown + ' px');
  check('memory: and lets it go when it closes', mem.shareHidden === 0, mem.shareHidden + ' px');
  check('memory: the full map has a canvas while it is open (anchor sanity)', mem.mapShown > 0, mem.mapShown + ' px');
  check('memory: and lets it go when it shuts', mem.mapHidden === 0, mem.mapHidden + ' px');
  check('memory: the sign atlas went up at full size (anchor sanity)', mem.signUploaded >= 512 * 512, mem.signUploaded + ' px uploaded');
  check('memory: and its canvas no longer holds the pixels', mem.signCanvas <= 1, mem.signCanvas + ' px held');
  check('memory: the ocean is there (anchor sanity)', mem.ocean);
  check('memory: and its swell no longer re-sends the plane every frame', mem.oceanUploads === 0,
    mem.oceanUploads + ' uploads in 30 frames');
  check('memory: a batch builds (anchor sanity)', mem.batchBuilt === 36, mem.batchBuilt + ' vertices');
  check('memory: and keeps nothing once it has', mem.batchKept === 0, mem.batchKept + ' floats kept');
  check('memory: the broadphase answers into the list its caller keeps', mem.queryInto);
  check('memory: the island’s trees and lamps are copies of one box', mem.biggestInstanced >= 1000,
    'largest instanced set ' + mem.biggestInstanced);
  check('memory: the island’s land is indexed wedges sharing their points', mem.landMeshes >= 2 && mem.landShared,
    mem.landMeshes + ' wedges');
  check('memory: vertex-coloured static meshes store colour as bytes and no unused uv', mem.packed > 10 && mem.loose === 0,
    mem.packed + ' packed, ' + mem.loose + ' not');
  check('memory: static geometry is gone from JS once it is on the GPU', mem.released > 50 && mem.heldStatic === 0 && mem.bounded,
    mem.released + ' released, ' + mem.heldStatic + ' still held' + (mem.bounded ? '' : ', some without bounds'));
  check('memory: while the blocks, which the facade checks read, keep theirs (anchor sanity)', mem.blocks > 0 && mem.blocksHeld === mem.blocks,
    mem.blocksHeld + ' of ' + mem.blocks);
  check('memory: fresh traffic and walkers were made (anchor sanity)', mem.freshCars >= 5 && mem.freshPeds >= 5,
    mem.freshCars + ' cars, ' + mem.freshPeds + ' peds');
  check('memory: and every car has the same shape', mem.carShapes === 1, mem.carShapes + ' shapes');
  check('memory: and every ped has the same shape', mem.pedShapes === 1, mem.pedShapes + ' shapes');
  check('memory: the shop preview draws with a live context while open (anchor sanity)',
    pvVisits.every(function (v) { return v.live; }), JSON.stringify(pvVisits));
  check('memory: and it is let go each time the shop closes', pvVisits.every(function (v) { return v.lost; }),
    JSON.stringify(pvVisits));
  check('memory: the pale walls went up at full size (anchor sanity)',
    mem2.walls.length === 4 && mem2.walls.every(function (w) { return w.up >= 512 * 384; }), JSON.stringify(mem2.walls));
  check('memory: and their canvases no longer hold the pixels', mem2.walls.every(function (w) { return w.held <= 1; }),
    JSON.stringify(mem2.walls));
  check('memory: while the facade check still has each wall as painted',
    mem2.walls.every(function (w) { return typeof w.lum === 'number' && w.lum > 0.3 && w.lum < 0.9; }), JSON.stringify(mem2.walls));
  check('memory: the interiors are built (anchor sanity)', !!mem2.interiors && mem2.interiors.verts > 20000,
    JSON.stringify(mem2.interiors));
  check('memory: and their geometry is gone from JS once it is on the GPU',
    !!mem2.interiors && mem2.interiors.released && !mem2.interiors.held, JSON.stringify(mem2.interiors));
  check('memory: no other geometry outside the blocks holds much in JS', mem2.heldMax <= 128 * 1024,
    Math.round(mem2.heldMax / 1024) + ' KB largest');
  check('memory: the mainland still fills and turns over (anchor sanity)', mem2.land.livePeds >= 5 && mem2.land.liveCars >= 5,
    JSON.stringify(mem2.land));
  check('memory: out at sea (anchor sanity)', mem2.sea.wet, JSON.stringify(mem2.sea));
  check('memory: and no ped or car is made there only to be thrown away',
    mem2.sea.pedsWasted === 0 && mem2.sea.carsWasted === 0 && mem2.land.pedsWasted === 0 && mem2.land.carsWasted === 0,
    'sea ' + JSON.stringify(mem2.sea) + ' land ' + JSON.stringify(mem2.land));

  // ---------- 15: talking heads ----------
  // A job you have not done yet opens on a scene (scenes.js): the cut to
  // Lola's lock-up, the two of them face to face, subtitles with a face and a
  // voice. The world holds still while it plays; a key moves it on, Esc cuts
  // it short, and the job starts when it is over. A retry goes straight back
  // in. The faces are SVG made in code, and the voices are
  // Web Audio blips that make nothing at all while muted.
  var faces = await page.evaluate(function () {
    var out = { ids: GAME.cast.ids(), bad: [], noMouth: [] };
    out.ids.forEach(function (id) {
      var svg = GAME.cast.portrait(id);
      var doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
      var root = doc.documentElement;
      if (doc.getElementsByTagName('parsererror').length || root.nodeName !== 'svg' || root.getAttribute('viewBox') !== '0 0 100 100') out.bad.push(id);
      if (!root.querySelector('.mo') || !root.querySelector('.mc')) out.noMouth.push(id);
    });
    // two of the same face never share gradient ids
    var a = GAME.cast.portrait('lola'), b = GAME.cast.portrait('lola');
    out.distinctIds = a.match(/id="([^"]+)"/)[1] !== b.match(/id="([^"]+)"/)[1];
    return out;
  });
  check('scenes: every one of the cast has a face', faces.ids.length >= 5 &&
    ['lola', 'rico', 'you', 'benny'].every(function (id) { return faces.ids.indexOf(id) >= 0; }), JSON.stringify(faces.ids));
  check('scenes: and every face is valid SVG', faces.bad.length === 0, JSON.stringify(faces.bad));
  check('scenes: with a mouth to open and shut', faces.noMouth.length === 0, JSON.stringify(faces.noMouth));
  check('scenes: two copies of a face never share gradient ids', faces.distinctIds);

  var pagerFace = await page.evaluate(function () {
    for (var w = 0; w < 40 && GAME.hud.pagerText; w++) GAME.test.fastForward(0.5);
    GAME.test.fastForward(1);
    GAME.hud.pager('RICO', 'scene test page', 2);
    var r = { rico: /<svg/.test(GAME.hud.pagerFace), from: GAME.hud.pagerFrom };
    for (var w2 = 0; w2 < 20 && GAME.hud.pagerText; w2++) GAME.test.fastForward(0.5);
    GAME.test.fastForward(1);
    GAME.hud.pager('THE BANK', 'nobody we know', 2);
    for (var w4 = 0; w4 < 20 && GAME.hud.pagerText !== 'nobody we know'; w4++) GAME.test.fastForward(0.25);
    r.nobody = GAME.hud.pagerFace === '' && GAME.hud.pagerText === 'nobody we know';
    r.text = GAME.hud.pagerText;
    for (var w3 = 0; w3 < 20 && GAME.hud.pagerText; w3++) GAME.test.fastForward(0.5);
    return r;
  });
  check('scenes: the pager shows the sender\'s face', pagerFace.rico, JSON.stringify(pagerFace));
  check('scenes: and none for somebody with no face', pagerFace.nobody, JSON.stringify(pagerFace));

  var voice = await page.evaluate(function () {
    var A = GAME.audio, r = {};
    A.init();
    if (A.muted) A.toggleMute();
    var v = GAME.cast.voice('lola'), n0 = A.voiceNodes;
    var made = A.babble(v, 'a');
    r.made = made; r.nodes = A.voiceNodes - n0;
    r.distinct = GAME.cast.voice('lola').base !== GAME.cast.voice('rico').base && GAME.cast.voice('rico').wave !== GAME.cast.voice('lola').wave;
    A.toggleMute();
    var n1 = A.voiceNodes;
    // (past the blip spacing, so only the mute can be what stops it)
    var t0 = performance.now();
    while (performance.now() - t0 < 60) { }
    r.mutedMade = A.babble(v, 'e');
    r.mutedNodes = A.voiceNodes - n1;
    A.toggleMute();
    return r;
  });
  check('scenes: a syllable of babble makes its nodes', voice.made === 3 && voice.nodes === 3, JSON.stringify(voice));
  check('scenes: and makes nothing while muted', voice.mutedMade === 0 && voice.mutedNodes === 0, JSON.stringify(voice));
  check('scenes: Lola and Rico do not sound alike', voice.distinct);

  var sc = await page.evaluate(function () {
    var P = GAME.player, S = GAME.scenes, M = GAME.missions, r = {};
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    if (M.active) M.failActive('test');
    if (GAME.share && GAME.share.hide) GAME.share.hide();
    var bests = GAME.bests || (GAME.bests = {});
    var keep0 = bests.rampage0, keep2 = bests.rampage2;
    delete bests.rampage0; delete bests.rampage2;
    for (var w = 0; w < 40 && GAME.hud.pagerText; w++) GAME.test.fastForward(0.5);
    var def = M.DEFS.filter(function (d) { return d.id === 'rampage0'; })[0];
    function walkIn(d) {
      GAME.test.teleport(d.start.x + 20, d.start.z);
      GAME.test.fastForward(0.5);
      GAME.test.teleport(d.start.x, d.start.z);
      for (var i = 0; i < 120 && !S.active && !M.active; i++) GAME.test.fastForward(1 / 60);
    }
    // switched off (as for every group above): the job starts on the pager
    S.enabled = false;
    walkIn(def);
    r.offStarts = !!M.active && !S.active;
    if (M.active) M.failActive('test');
    GAME.test.fastForward(0.2);
    // (and the line it paged gone, so what is on the pager below is new)
    for (var w1 = 0; w1 < 40 && GAME.hud.pagerText; w1++) GAME.test.fastForward(0.5);
    // on
    S.enabled = true;
    var played0 = S.played;
    walkIn(def);
    r.playing = S.active && !M.active && S.played === played0 + 1;
    GAME.test.fastForward(0.6);   // (the bars come in, then the cut)
    r.cast = S.on.slice();
    r.sceneOpen = !!GAME.sceneOpen;
    r.cine = document.body.classList.contains('cine');
    // the world holds still
    var t0 = GAME.time;
    GAME.test.fastForward(1.2);
    r.frozen = GAME.time === t0;
    r.line0 = S.line && S.line.who;
    r.typing = S.line && S.line.shown.length > 0 && S.line.shown.length < S.line.text.length;
    r.subOn = document.getElementById('scene-sub').classList.contains('on') && /<svg/.test(document.getElementById('scene-face').innerHTML);
    // a key finishes the line, the next moves it on
    GAME.onKeyDown('Space');
    r.finished = S.line && S.line.shown === S.line.text;
    GAME.test.fastForward(0.2);
    GAME.onKeyDown('Space');
    r.line1 = S.line && S.line.who;
    // and on its own, to the end: then the job
    for (var k = 0; k < 60 * 30 && S.active; k++) GAME.test.fastForward(1 / 30);
    r.ended = !S.active && !GAME.sceneOpen && !document.body.classList.contains('cine');
    r.started = !!(M.active && M.active.def.id === 'rampage0');
    r.timeMoves = GAME.time > t0;
    // she said it there, so the pager does not say it again
    r.noPagerBrief = !/selling on my strip/.test(GAME.hud.pagerText || '');
    // fail it, and take the retry: straight back in, no scene
    var played1 = S.played;
    if (M.active) M.failActive('test');
    GAME.test.fastForward(0.2);
    GAME.test.pressKey('KeyY', true);
    GAME.test.fastForward(1 / 60);
    GAME.test.pressKey('KeyY', false);
    for (var j = 0; j < 120 && !M.active; j++) GAME.test.fastForward(1 / 60);
    r.retried = !!(M.active && M.active.def.id === 'rampage0');
    r.retryNoScene = S.played === played1 && !S.active;
    if (M.active) M.failActive('test');
    GAME.test.fastForward(0.3);
    // Esc cuts it short, and the job still starts
    var def2 = M.DEFS.filter(function (d) { return d.id === 'rampage2'; })[0];
    GAME.test.teleport(def.start.x + 30, def.start.z);
    GAME.test.fastForward(0.5);
    walkIn(def2);
    r.second = S.active;
    GAME.test.fastForward(0.8);
    GAME.onKeyDown('Escape');
    r.skipped = !S.active;
    GAME.test.fastForward(0.2);
    r.skipStarts = !!(M.active && M.active.def.id === 'rampage2');
    r.notPaused = !GAME.paused;
    if (M.active) M.failActive('test');
    GAME.test.fastForward(0.2);
    // a job you have passed goes straight in
    bests.rampage2 = 1000;
    var played2 = S.played;
    GAME.test.teleport(def.start.x + 30, def.start.z);
    GAME.test.fastForward(0.5);
    walkIn(def2);
    r.passedNoScene = S.played === played2 && !!M.active;
    if (M.active) M.failActive('test');
    GAME.test.fastForward(0.2);
    S.enabled = false;
    if (keep0 === undefined) delete bests.rampage0; else bests.rampage0 = keep0;
    if (keep2 === undefined) delete bests.rampage2; else bests.rampage2 = keep2;
    if (GAME.share && GAME.share.hide) GAME.share.hide();
    GAME.test.teleport(def.start.x + 40, def.start.z);
    GAME.test.fastForward(0.5);
    return r;
  });
  check('scenes: switched off, the job starts as it always did', sc.offStarts, JSON.stringify(sc));
  check('scenes: a job not done yet opens on a scene, not the job', sc.playing, JSON.stringify(sc));
  check('scenes: Lola and you in it, letterboxed', sc.cast.join() === 'lola,you' && sc.cine && sc.sceneOpen, JSON.stringify(sc));
  check('scenes: the world holds still while it plays', sc.frozen, JSON.stringify(sc));
  check('scenes: the line types out under her face', sc.line0 === 'lola' && sc.typing && sc.subOn, JSON.stringify(sc));
  check('scenes: a key finishes a line, and the next moves it on', sc.finished && sc.line1 === 'you', JSON.stringify(sc));
  check('scenes: it plays out by itself and then the job starts', sc.ended && sc.started && sc.timeMoves, JSON.stringify(sc));
  check('scenes: and the pager does not repeat what she just said', sc.noPagerBrief, JSON.stringify(sc));
  check('scenes: a retry goes straight back in, with no scene', sc.retried && sc.retryNoScene, JSON.stringify(sc));
  check('scenes: Esc skips it, and the job still starts', sc.second && sc.skipped && sc.skipStarts && sc.notPaused, JSON.stringify(sc));
  check('scenes: a job you have passed goes straight in', sc.passedNoScene, JSON.stringify(sc));

  // Rico's cut to the marina, and the stand-ins put away after
  var rico = await page.evaluate(function () {
    var S = GAME.scenes, r = {}, wasOpen = GAME.isla.isOpen();
    GAME.isla.setOpen(true);
    S.enabled = true;
    var kids = GAME.scene.children.length;
    r.played = S.play({ id: 'test', shots: [
      { set: 'marina', cast: ['rico', 'manny'], lines: [['rico', 'Tell the boys.']] },
      { set: 'lockup', cast: ['lola', 'you'], lines: [['lola', 'This ends today.']] }] });
    GAME.test.fastForward(0.8);
    r.first = S.on.join();
    r.staged = !!S.stage('marina') && !!S.stage('lockup');
    for (var i = 0; i < 400 && S.line && S.line.shot === 0; i++) GAME.test.fastForward(0.05);
    r.second = S.on.join();
    r.playerHidden = !GAME.player.mesh.visible;
    GAME.onKeyDown('Escape');
    r.tidy = GAME.scene.children.length === kids && GAME.player.mesh.visible;
    r.fov = GAME.cameraObj.fov;
    S.enabled = false;
    GAME.isla.setOpen(wasOpen);
    GAME.test.fastForward(0.3);
    return r;
  });
  check('scenes: Rico is on the marina with his man', rico.played && rico.first === 'rico,manny' && rico.staged, JSON.stringify(rico));
  check('scenes: a cut takes it back to Lola\'s, with you standing in', rico.second === 'lola,you' && rico.playerHidden, JSON.stringify(rico));
  check('scenes: and over, nobody is left standing and you are back', rico.tidy && rico.fov > 40, JSON.stringify(rico));

  // ---------- 16: story jobs in acts ----------
  // A story job's own part won is the first act of several (missions.js
  // ACTS): Rico's men come for you after a rampage, a crew waits round the
  // corner from the warehouses, the collector's bag goes back to the lock-up,
  // and HIGH TIDE's Rico bails out of his pickup for a stand on the marina.
  // A run that fails in a later act retries from the top.
  var acts = await page.evaluate(function () {
    var M = GAME.missions, P = GAME.player, r = {};
    var keep = {}, ids = ['rampage0', 'rampage1', 'hit0', 'hit2'];
    var bests = GAME.bests || (GAME.bests = {});
    ids.forEach(function (id) { keep[id] = bests[id]; delete bests[id]; });
    var open0 = GAME.isla.isOpen();
    M.acts = true;
    GAME.godMode = true;
    if (M.active) M.failActive('test');
    if (GAME.share && GAME.share.hide) GAME.share.hide();
    function def(id) { return M.DEFS.filter(function (d) { return d.id === id; })[0]; }
    function walkIn(d) {
      GAME.police.clearWanted();
      GAME.test.teleport(d.start.x + 25, d.start.z); GAME.test.fastForward(0.5);
      GAME.test.teleport(d.start.x, d.start.z);
      for (var i = 0; i < 600 && !(M.active && M.active.state === 'run'); i++) GAME.test.fastForward(1 / 30);
      return !!(M.active && M.active.def.id === d.id);
    }
    function clear() {
      for (var k = 0; k < 400 && M.act && (M.act.kind === 'heavies' || M.act.kind === 'crew'); k++) {
        GAME.test.fastForward(0.1);
        var cp = M.getObjectivePoint();
        if (M.act && M.act.kind === 'crew' && cp) GAME.test.teleport(cp[0] + 10, cp[1]);
        GAME.world.peds.forEach(function (p) { if (p.missionFoe && !p.dead) GAME.peds.kill(p); });
        GAME.world.cars.forEach(function (c) { if (c.heavy && !c.dead) c.hp = 0; });
      }
    }
    function board() {
      if (P.inCar) return;
      var c = GAME.test.spawnCar('sedan', 3, 0); GAME.test.fastForward(0.2); GAME.test.enterNearestCar(c); GAME.test.fastForward(1);
    }
    function stopTarget() {
      for (var i = 0; i < 300 && M.active && !M.act; i++) {
        var p = M.active.perp;
        if (p && !p.gone && !p.dead) { GAME.test.teleport(p.pos.x + 12, p.pos.z); p.hp = 1; }
        GAME.world.peds.forEach(function (q) { if (q.missionFoe && !q.dead) GAME.peds.kill(q); });
        GAME.test.fastForward(0.1);
      }
    }
    try {
      if (P.inCar) GAME.exitCar();
      GAME.test.fastForward(0.5);
      // a rampage won, and his friends turn up
      r.r0 = walkIn(def('rampage0'));
      M.notifyChaos(99999); GAME.test.fastForward(0.3);
      r.r0act = M.act && M.act.kind;
      r.r0still = !!M.active && bests.rampage0 === undefined;
      // fail it there, and the retry starts the rampage again
      M.failActive('test'); GAME.test.fastForward(0.2);
      GAME.test.pressKey('KeyY', true); GAME.test.fastForward(1 / 60); GAME.test.pressKey('KeyY', false);
      for (var j = 0; j < 120 && !M.active; j++) GAME.test.fastForward(1 / 60);
      r.retryTop = !!(M.active && M.active.def.id === 'rampage0' && !M.act);
      for (var j2 = 0; j2 < 300 && M.active && M.active.state !== 'run'; j2++) GAME.test.fastForward(1 / 30);
      M.notifyChaos(99999); GAME.test.fastForward(0.3);
      clear();
      r.r0done = !M.active && bests.rampage0 !== undefined;
      if (GAME.share && GAME.share.hide) GAME.share.hide();
      // the warehouse foreman's crew, down the street from the ring
      walkIn(def('rampage1'));
      M.notifyChaos(99999); GAME.test.fastForward(0.3);
      r.r1act = M.act && M.act.kind;
      var at = M.getObjectivePoint(), f = GAME.focus();
      r.r1away = at ? Math.round(Math.hypot(at[0] - f.x, at[1] - f.z)) : 0;
      GAME.test.teleport(at[0] + 20, at[1]); GAME.test.fastForward(1);
      r.r1men = M.act && M.act.men;
      r.r1boss = GAME.world.peds.some(function (p) { return p.boss && !p.dead; });
      clear();
      r.r1done = !M.active && bests.rampage1 !== undefined;
      if (GAME.share && GAME.share.hide) GAME.share.hide();
      // the collector: his bag, and the bag to the lock-up
      board();
      walkIn(def('hit0'));
      stopTarget();
      r.h0act = M.act && M.act.kind;
      var it = M.getObjectivePoint();
      if (it) { GAME.test.teleport(it[0], it[1]); GAME.test.fastForward(0.3); }
      r.h0act2 = M.act && M.act.kind;
      r.h0lockup = /lock-up/.test(M.objectiveText());
      var to = M.getObjectivePoint();
      if (to) { GAME.test.teleport(to[0], to[1]); GAME.test.fastForward(0.5); }
      r.h0done = !M.active && bests.hit0 !== undefined;
      if (GAME.share && GAME.share.hide) GAME.share.hide();
      // HIGH TIDE: Rico bails, and it ends on the marina with him in it
      GAME.isla.setOpen(true); GAME.test.fastForward(0.3);
      board();
      r.h2 = walkIn(def('hit2'));
      stopTarget();
      r.h2act = M.act && M.act.kind;
      r.h2streetFree = !GAME.world.peds.some(function (p) { return p.missionFoe && !p.dead && !p.boss; });
      var q = M.getObjectivePoint();
      var Mq = GAME.isla.pois().marina;
      r.h2marina = q ? Math.round(Math.hypot(q[0] - Mq.x, q[1] - Mq.z)) : -1;
      if (q) GAME.test.teleport(q[0] + 20, q[1]);
      GAME.test.fastForward(1);
      r.h2men = M.act && M.act.men;
      r.h2rico = GAME.world.peds.some(function (p) { return p.boss && !p.dead && p.look && p.look.shirt === 0xf4f1e8; });
      clear();
      GAME.test.fastForward(0.3);
      r.h2done = !M.active && bests.hit2 !== undefined;
    } finally {
      if (M.active) M.failActive('test cleanup');
      GAME.test.fastForward(0.3);
      if (GAME.share && GAME.share.hide) GAME.share.hide();
      M.acts = false;
      GAME.godMode = false;
      ids.forEach(function (id) { if (keep[id] === undefined) delete bests[id]; else bests[id] = keep[id]; });
      if (GAME.isla.isOpen() !== open0) GAME.isla.setOpen(open0);
      GAME.police.clearWanted();
      if (P.inCar) GAME.exitCar();
      P.health = 100;
      GAME.test.teleport(-60, 40); GAME.test.fastForward(0.5);
    }
    return r;
  });
  check('acts: a rampage won goes on — his friends come for you', acts.r0 && acts.r0act === 'heavies' && acts.r0still, JSON.stringify(acts));
  check('acts: failed in a later act, the retry starts the job from the top', acts.retryTop, JSON.stringify(acts));
  check('acts: and with them down, it is passed', acts.r0done, JSON.stringify(acts));
  check('acts: the warehouse foreman waits down the street with his crew', acts.r1act === 'crew' && acts.r1away > 40 && acts.r1men >= 4 && acts.r1boss, JSON.stringify(acts));
  check('acts: and with all of them down, it is passed', acts.r1done, JSON.stringify(acts));
  check('acts: the collector drops his bag, and the bag goes to the lock-up', acts.h0act === 'grab' && acts.h0act2 === 'deliver' && acts.h0lockup && acts.h0done, JSON.stringify(acts));
  check('acts: HIGH TIDE — Rico bails out of the pickup and runs, he does not fight in the street',
    acts.h2 && acts.h2act === 'crew' && acts.h2streetFree, JSON.stringify(acts));
  check('acts: and makes his stand on the marina, with Manny and his men', acts.h2marina >= 0 && acts.h2marina < 60 && acts.h2men >= 5 && acts.h2rico, JSON.stringify(acts));
  check('acts: and with them down, HIGH TIDE is passed', acts.h2done, JSON.stringify(acts));

  // ---------- 17: gangs and turf ----------
  // Lola's people stand about the strip in pink; Rico's crew holds the
  // harbour in plum and black until LOOSE ENDS, and Puerto Dorado until HIGH
  // TIDE. After the warehouses his men draw on sight; before, they are only a
  // colour on the corner. The two sides go at each other, and never at their
  // own.
  var gang = await page.evaluate(function () {
    var G = GAME.gangs, P = GAME.player, r = {};
    var bests = GAME.bests || (GAME.bests = {});
    var keep = { rampage1: bests.rampage1, hit1: bests.hit1, hit2: bests.hit2 };
    delete bests.rampage1; delete bests.hit1; delete bests.hit2;
    var lvl0 = GAME.chaos.level, open0 = GAME.isla.isOpen();
    if (P.inCar) GAME.exitCar();
    G.enabled = true;
    try {
      r.strip = G.turfAt(360, 40); r.harbor = G.turfAt(-250, 250); r.downtown = G.turfAt(-100, -100);
      GAME.isla.setOpen(true);
      var Dor = GAME.isla.pois().container;
      r.dorado = G.turfAt(Dor.x, Dor.z);
      GAME.test.teleport(360, 40); GAME.test.fastForward(6);
      r.lolaMen = G.count('lola');
      GAME.test.teleport(-250, 250); GAME.test.fastForward(6);
      r.salMen = G.count('salazar');
      r.colours = GAME.world.peds.filter(function (p) { return p.gang === 'salazar'; }).every(function (p) { return p.look.shirt === G.GANGS.salazar.shirt; });
      var f = GAME.focus();
      var men = G.testSpawn('salazar', f.x + 10, f.z, 2);
      GAME.test.fastForward(1);
      r.calmBefore = !G.hostile() && men.every(function (p) { return p.state !== 'attack'; });
      bests.rampage1 = 30;
      GAME.test.fastForward(1);
      r.onSight = men.filter(function (p) { return p.state === 'attack' && p.foe && p.foe.kind === 'player'; }).length;
      men.forEach(function (p) { GAME.peds.removePed(p); });
      delete bests.rampage1;
      GAME.chaos.set(2);
      var a = G.testSpawn('lola', f.x + 30, f.z + 30, 1)[0], b = G.testSpawn('salazar', f.x + 36, f.z + 30, 1)[0];
      var c = G.testSpawn('salazar', f.x + 37, f.z + 31, 1)[0];
      GAME.test.fastForward(1);
      r.clash = (a.state === 'attack' && a.foe && a.foe.ped === b) || (b.state === 'attack' && b.foe && b.foe.ped === a);
      r.notOwn = !(b.foe && b.foe.ped === c) && !(c.foe && c.foe.ped === b);
      [a, b, c].forEach(function (p) { GAME.peds.removePed(p); });
      bests.hit1 = 50; bests.hit2 = 80;
      r.harborAfter = G.turfAt(-250, 250); r.doradoAfter = G.turfAt(Dor.x, Dor.z);
      r.peaceAfter = !G.hostile();
      r.blips = G.blips().length > 0;
    } finally {
      G.enabled = false;
      GAME.chaos.set(lvl0);
      ['rampage1', 'hit1', 'hit2'].forEach(function (id) { if (keep[id] === undefined) delete bests[id]; else bests[id] = keep[id]; });
      GAME.world.peds.slice().forEach(function (p) { if (p.gang) GAME.peds.removePed(p); });
      if (GAME.isla.isOpen() !== open0) GAME.isla.setOpen(open0);
      P.health = 100;
      GAME.test.teleport(-60, 40); GAME.test.fastForward(0.5);
    }
    return r;
  });
  check('gangs: the strip is Lola\'s, the harbour and Puerto Dorado Rico\'s, downtown nobody\'s',
    gang.strip === 'lola' && gang.harbor === 'salazar' && gang.dorado === 'salazar' && gang.downtown === null, JSON.stringify(gang));
  check('gangs: each side stands about its own streets, in its colours', gang.lolaMen >= 2 && gang.salMen >= 2 && gang.colours, JSON.stringify(gang));
  check('gangs: before the warehouses Rico\'s men leave you be', gang.calmBefore, JSON.stringify(gang));
  check('gangs: after them they draw on sight', gang.onSight >= 1, JSON.stringify(gang));
  check('gangs: the two sides go at each other, never at their own', gang.clash && gang.notOwn, JSON.stringify(gang));
  check('gangs: what Rico loses Lola\'s people move into, and the price on you ends with him',
    gang.harborAfter === 'lola' && gang.doradoAfter === 'lola' && gang.peaceAfter, JSON.stringify(gang));

  // ---------- 18: the arsenal ----------
  // Bat, knife, katana and chainsaw (one at a time),
  // grenades and Molotovs (one kind at a time), a scoped sniper rifle and a
  // rocket launcher; an SVG icon each, drawn in code; and the weapon wheel,
  // held open on Z with the world slowed, a tap of it stepping to the next.
  var arms = await page.evaluate(function () {
    var C = GAME.combat, A = GAME.arsenal, P = GAME.player, r = {};
    var weapons0 = JSON.parse(JSON.stringify(P.weapons, function (k, v) { return v === Infinity ? 'INF' : v; }));
    var cur0 = P.currentWeapon;
    if (P.inCar) GAME.exitCar();
    GAME.godMode = true;
    GAME.input.lockGraceT = 0;
    var spawned = [];
    function clean() { GAME.police.clearWanted(); }
    try {
      GAME.test.teleport(-60, 40); GAME.test.fastForward(0.5);
      // every weapon has an icon, and it is SVG
      var ids = Object.keys(C.WEAPONS);
      r.icons = ids.filter(function (w) {
        var svg = A.icon(w), d = new DOMParser().parseFromString(svg, 'image/svg+xml');
        return !svg || d.getElementsByTagName('parsererror').length || d.documentElement.nodeName !== 'svg';
      });
      r.count = ids.length;
      // one hand-to-hand weapon, and one kind of throwable, at a time
      C.giveWeapon('bat'); C.giveWeapon('katana');
      r.oneBlade = !P.weapons.bat.have && P.weapons.katana.have;
      C.giveWeapon('grenade', 3); C.giveWeapon('molotov', 2);
      r.oneThrow = !P.weapons.grenade.have && P.weapons.molotov.have;
      r.hudIcon = /<svg/.test(document.getElementById('weapon-icon').innerHTML);
      // the katana, at arm's length
      var ped = GAME.test.spawnPed(0.01, 1.6); spawned.push(ped);
      GAME.test.fastForward(0.05);
      P.heading = Math.atan2(ped.pos.x - P.pos.x, ped.pos.z - P.pos.z);
      C.selectWeapon('katana'); C.melee('katana');
      r.katana = ped.dead;
      clean();
      // a grenade at a car: it lands, waits, and goes off
      var car = GAME.test.spawnCar('sedan', 12, 0); spawned.push(car);
      GAME.test.fastForward(0.3);
      var hp0 = car.hp;
      C.giveWeapon('grenade', 2);
      var g = A.throwIt('grenade', 0, car);
      r.thrown = A.shots === 1;
      GAME.test.fastForward(1.0);
      r.notYet = A.shots === 1 && !car.dead && car.hp === hp0;
      GAME.test.fastForward(2.0); clean();
      r.grenade = A.shots === 0 && (car.dead || car.hp < hp0);
      // a Molotov: the ground burns, and somebody stood in it is hurt
      var ped2 = GAME.test.spawnPed(0.01, 14); spawned.push(ped2);
      ped2.jobPed = true; ped2.state = 'wait'; ped2.speed = 0;
      GAME.test.fastForward(0.05);
      var hpP = ped2.hp;
      A.throwIt('molotov', 0, ped2);
      GAME.test.fastForward(0.9);
      r.fire = A.fires === 1;
      GAME.test.fastForward(1.0); clean();
      r.burns = ped2.dead || ped2.hp < hpP;
      GAME.test.fastForward(6); clean();
      r.fireOut = A.fires === 0;
      // a rocket into a car
      var car2 = GAME.test.spawnCar('sedan', -22, 0); spawned.push(car2);
      GAME.test.fastForward(0.3);
      var hp2 = car2.hp;
      A.fireRocket(Math.atan2(car2.pos.x - P.pos.x, car2.pos.z - P.pos.z), car2);
      GAME.test.fastForward(1.2); clean();
      r.rocket = car2.dead || car2.hp < hp2;
      // the sniper rifle: aimed on foot it is a scope, and let go it is not
      C.giveWeapon('sniper', 5);
      var fov0 = GAME.cameraObj.fov;
      GAME.input.rmb = true; GAME.test.fastForward(0.2);
      r.scoped = A.scoped && GAME.cameraObj.fov < 20 && document.getElementById('scope').style.display === 'block';
      GAME.input.rmb = false; GAME.test.fastForward(0.2);
      r.unscoped = !A.scoped && GAME.cameraObj.fov === fov0 && document.getElementById('scope').style.display === 'none';
      // the wheel: a tap steps, a hold opens it with the world slowed, and
      // letting go takes what it points at
      C.giveWeapon('pistol', 20);
      var w0 = P.currentWeapon;
      GAME.test.pressKey('KeyZ', true); GAME.test.fastForward(1 / 60); GAME.test.pressKey('KeyZ', false); GAME.test.fastForward(1 / 60);
      r.tap = P.currentWeapon !== w0 && !A.wheelOpen;
      GAME.test.pressKey('KeyZ', true); GAME.test.fastForward(0.4);
      r.open = A.wheelOpen && GAME.timeScale < 1 && document.getElementById('weapon-wheel').style.display === 'flex';
      A.wheelMove(0, -200);   // straight up: fists
      GAME.test.pressKey('KeyZ', false); GAME.test.fastForward(1 / 60);
      r.picked = !A.wheelOpen && P.currentWeapon === 'fist' && GAME.timeScale === 1;
      // the city has them lying about too
      r.pickups = ['bat', 'knife', 'katana', 'chainsaw', 'grenade', 'molotov', 'sniper', 'rocket'].filter(function (t) {
        return !GAME.world.pickups.some(function (p) { return p.type === t; });
      });
      // the noises they make, muted or not, without a fault
      var A2 = GAME.audio;
      ['bat', 'knife', 'katana', 'chainsaw'].forEach(function (k) { A2.swing(k); A2.thud(k); });
      A2.whoosh(0.2); A2.tick(0, 0); A2.glass(0, 0); A2.crackle(0, 0); A2.gunshot('sniper', 0, 0); A2.gunshot('rocket', 0, 0);
      r.sounds = true;
    } finally {
      spawned.forEach(function (o) { if (o.kind === 'ped') GAME.peds.removePed(o); else if (!o.gone) GAME.vehicles.removeCar(o); });
      A.clear();
      P.weapons = JSON.parse(JSON.stringify(weapons0), function (k, v) { return v === 'INF' ? Infinity : v; });
      P.currentWeapon = cur0; C.refreshWeaponHud();
      GAME.input.rmb = false;
      GAME.godMode = false;
      GAME.timeScale = 1;
      GAME.police.clearWanted();
      P.health = 100;
      GAME.test.fastForward(0.3);
    }
    return r;
  });
  check('arsenal: every weapon has an SVG icon drawn in code', arms.count >= 13 && arms.icons.length === 0, JSON.stringify(arms));
  check('arsenal: one hand-to-hand weapon and one kind of throwable at a time', arms.oneBlade && arms.oneThrow && arms.hudIcon, JSON.stringify(arms));
  check('arsenal: a katana at arm\'s length is the end of it', arms.katana, JSON.stringify(arms));
  check('arsenal: a grenade flies, waits on its fuse, and goes off', arms.thrown && arms.notYet && arms.grenade, JSON.stringify(arms));
  check('arsenal: a Molotov sets the ground burning, it hurts, and it burns out', arms.fire && arms.burns && arms.fireOut, JSON.stringify(arms));
  check('arsenal: a rocket into a car', arms.rocket, JSON.stringify(arms));
  check('arsenal: the sniper rifle aimed is a scope, and let go it is not', arms.scoped && arms.unscoped, JSON.stringify(arms));
  check('arsenal: a tap of the wheel key steps to the next weapon', arms.tap, JSON.stringify(arms));
  check('arsenal: held, the wheel opens with the world slowed, and letting go takes its pick', arms.open && arms.picked, JSON.stringify(arms));
  check('arsenal: every new weapon lies about the city somewhere', arms.pickups.length === 0, JSON.stringify(arms.pickups));
  check('arsenal: and every one of their sounds plays without a fault', arms.sounds);

  // ---------- 19: holding up a shop ----------
  // A gun on whoever is behind the counter: hands up, and the till empties
  // into your pocket while you keep it there. Let it drop and the alarm has
  // gone — two stars. The till takes a day to restock, a shop you own is not
  // robbed, and fists frighten nobody.
  var rob = await page.evaluate(function () {
    var P = GAME.player, R = GAME.robbery, r = {};
    var weapons0 = JSON.parse(JSON.stringify(P.weapons, function (k, v) { return v === Infinity ? 'INF' : v; }));
    var cur0 = P.currentWeapon, robbed0 = JSON.stringify(GAME.prefs.robbed || {});
    if (P.inCar) GAME.exitCar();
    GAME.police.clearWanted();
    GAME.godMode = true;
    var loc = GAME.shops.locations().filter(function (l) { return l.kind === 'hardware'; })[0];
    var biz = GAME.prefs.business, owned0 = biz && biz.owned ? JSON.stringify(biz.owned) : null;
    try {
      if (GAME.prefs.robbed) delete GAME.prefs.robbed[loc.id];
      GAME.interiors.enter(loc);
      GAME.test.fastForward(1.5);
      var room = GAME.interiors.current;
      var fig = room.anim.filter(function (a) { return a.fig; })[0].fig;
      function face() {
        P.pos.set(fig.position.x, P.pos.y, fig.position.z - 5);
        GAME.cam.yaw = Math.atan2(fig.position.x - P.pos.x, fig.position.z - P.pos.z);
      }
      // fists first: nobody is frightened of those
      P.currentWeapon = 'fist';
      face();
      GAME.input.rmb = true; GAME.test.fastForward(0.5); GAME.input.rmb = false; GAME.test.fastForward(0.1);
      r.fists = !R.busy && fig.userData.pose !== 'up';
      GAME.combat.giveWeapon('pistol', 20);
      face();
      var cash0 = P.cash;
      GAME.input.rmb = true; GAME.test.fastForward(2);
      r.robbing = R.busy && fig.userData.pose === 'up';
      r.paying = P.cash - cash0;
      r.calmSoFar = GAME.police.wanted === 0;
      GAME.input.rmb = false; GAME.test.fastForward(0.2);
      r.over = !R.busy && fig.userData.pose !== 'up';
      r.stars = GAME.police.wanted;
      GAME.police.clearWanted();
      // the same till again, the same day: nothing in it
      var cash1 = P.cash;
      face();
      GAME.input.rmb = true; GAME.test.fastForward(1); GAME.input.rmb = false; GAME.test.fastForward(0.1);
      r.restocking = !R.busy && P.cash === cash1 && R.restocking(loc.id);
      // your own shop: not a till you rob
      delete GAME.prefs.robbed[loc.id];
      GAME.prefs.business = GAME.prefs.business || { owned: {}, till: {}, told: {} };
      GAME.prefs.business.owned = GAME.prefs.business.owned || {};
      GAME.prefs.business.owned[loc.id] = true;
      face();
      GAME.input.rmb = true; GAME.test.fastForward(1); GAME.input.rmb = false; GAME.test.fastForward(0.1);
      r.ownNot = !R.busy && GAME.police.wanted === 0;
    } finally {
      GAME.input.rmb = false;
      if (GAME.prefs.business && GAME.prefs.business.owned) {
        if (owned0 === null) delete GAME.prefs.business.owned[loc.id]; else GAME.prefs.business.owned = JSON.parse(owned0);
      }
      GAME.prefs.robbed = JSON.parse(robbed0);
      if (P.interior) GAME.interiors.leave();
      GAME.test.fastForward(1.5);
      P.weapons = JSON.parse(JSON.stringify(weapons0), function (k, v) { return v === 'INF' ? Infinity : v; });
      P.currentWeapon = cur0; GAME.combat.refreshWeaponHud();
      GAME.godMode = false;
      GAME.police.clearWanted();
      GAME.test.teleport(-60, 40); GAME.test.fastForward(0.5);
    }
    return r;
  });
  check('robbery: fists frighten nobody behind a counter', rob.fists, JSON.stringify(rob));
  check('robbery: a gun on the clerk — hands up, and the till comes over the counter', rob.robbing && rob.paying >= 200 && rob.calmSoFar, JSON.stringify(rob));
  check('robbery: let the aim drop and it is over, with two stars at least', rob.over && rob.stars >= 2, JSON.stringify(rob));
  check('robbery: the same till the same day has nothing in it', rob.restocking, JSON.stringify(rob));
  check('robbery: a shop you own is not one you rob', rob.ownNot, JSON.stringify(rob));

  // ---------- 20: the law's top end ----------
  // A sixth star, and with it the army: trucks of soldiers in with the
  // cruisers and a tank that comes for you. Take the tank and its turret
  // follows your aim and LMB is the cannon; it flattens what it drives into.
  // And from three stars the cruisers stop being polite: they ram, they PIT,
  // they box you in.
  var law = await page.evaluate(function () {
    var P = GAME.player, r = {}, spawned = [];
    GAME.godMode = true;
    GAME.police.tactics = true;
    try {
      if (P.inCar) GAME.exitCar();
      GAME.test.teleport(-60, 40); GAME.test.fastForward(0.5);
      GAME.police.setWanted(6);
      r.six = GAME.police.wanted === 6 && document.querySelectorAll('#wanted-stars .lit').length === 6 &&
        document.querySelectorAll('#wanted-stars span').length === 6;
      for (var i = 0; i < 20 && !GAME.army.armyTank; i++) GAME.test.fastForward(0.5);
      var t = GAME.army.armyTank;
      r.tank = !!t;
      r.army = GAME.world.cars.some(function (c) { return c.armyUnit && c.type === 'armytruck'; }) ||
        GAME.world.peds.some(function (q) { return q.army && !q.dead; });
      // its crew out, and it is yours
      GAME.police.clearWanted();
      GAME.test.fastForward(0.2);
      if (t && !t.gone) {
        t.speed = 0;
        GAME.test.teleport(t.pos.x + 3.5, t.pos.z); GAME.test.fastForward(0.3);
        GAME.enterCar(t); GAME.test.fastForward(3);
        r.mine = P.inCar && P.car === t;
        GAME.input.lockGraceT = 0;
        // (down the road it is sat on, in plain sight, the gun level: put
        // anywhere else it could be round a corner from wherever the tank
        // stopped, and the shell went into a wall)
        t.speed = 0;
        var car = GAME.test.spawnCar('sedan', 0, 0); spawned.push(car);
        car.pos.set(t.pos.x + Math.sin(t.heading) * 18, car.pos.y, t.pos.z + Math.cos(t.heading) * 18);
        car.occupied = null; car.speed = 0;
        GAME.test.fastForward(0.3);
        for (var k = 0; k < 90; k++) { GAME.cam.freeT = 2; GAME.cam.pitch = 0.3; GAME.cam.yaw = Math.atan2(car.pos.x - t.pos.x, car.pos.z - t.pos.z); t.speed = 0; GAME.test.fastForward(1 / 60); }
        var hp0 = car.hp;
        GAME.input.lmbPressed = true; GAME.test.fastForward(1.2);
        r.cannon = car.dead || car.hp < hp0;
        GAME.police.clearWanted();
        // and it drives over what is in its way
        // (on the ground where it is put, and kept in the tank's path: shoved
        // off to one side by the first touch, it was no longer in the way of
        // anything, and the check came down to which way it was knocked)
        var car2 = GAME.test.spawnCar('sedan', 0, 0); spawned.push(car2);
        car2.occupied = null;
        function inFront(d) {
          var x = t.pos.x + Math.sin(t.heading) * d, z = t.pos.z + Math.cos(t.heading) * d;
          car2.pos.set(x, GAME.city.groundY(x, z), z); car2.speed = 0; car2.vx = car2.vz = 0;
        }
        inFront(3.5);
        var hp2 = car2.hp;
        for (var c2 = 0; c2 < 120 && !(car2.dead || car2.hp < hp2 - 100); c2++) {
          var ox = car2.pos.x - t.pos.x, oz = car2.pos.z - t.pos.z;
          if (Math.abs(ox * Math.cos(t.heading) - oz * Math.sin(t.heading)) > 1.5) inFront(3.2);
          t.speed = 6; GAME.test.fastForward(1 / 60);
        }
        r.crush = car2.dead || car2.hp < hp2 - 100;
        if (!r.crush) r.crushWhy = { hp: Math.round(car2.hp), hp0: Math.round(hp2), d: Math.round(Math.hypot(car2.pos.x - t.pos.x, car2.pos.z - t.pos.z) * 10) / 10, ts: +t.speed.toFixed(1) };
        GAME.exitCar(); GAME.test.fastForward(1.5);
      }
      GAME.police.clearWanted();
      // the cruisers' tactics, from three stars, in a car
      var ride = GAME.test.spawnCar('sedan', 4, 0); spawned.push(ride);
      GAME.test.fastForward(0.2); GAME.test.enterNearestCar(ride); GAME.test.fastForward(1);
      GAME.police.setWanted(3);
      var kinds = {}, pit = null;
      for (var u = 0; u < 4; u++) {
        var unit = GAME.police.spawnUnit();
        if (unit) { kinds[unit.tactic] = true; spawned.push(unit); if (unit.tactic === 'pit') pit = unit; }
      }
      r.tactics = Object.keys(kinds).sort().join();
      // the PIT: one at your back wheel, moving with you, turns you round
      var pc = P.car;
      if (pit && pc) {
        // (put back at the wheel each frame until it takes: one frame alone
        // could go to anything else on the road nudging either car)
        var h0 = pc.heading;
        for (var pf = 0; pf < 15 && !(pc.pitT > 0); pf++) {
          var fx = Math.sin(pc.heading), fz = Math.cos(pc.heading);
          pit.pos.set(pc.pos.x - fx * 2.4 + fz * 1.6, pc.pos.y, pc.pos.z - fz * 2.4 - fx * 1.6);
          pit.heading = pc.heading; pit.speed = 15; pc.speed = 15;
          h0 = pc.heading;
          GAME.test.fastForward(1 / 60);
        }
        r.pitT = pc.pitT > 0;
        if (!r.pitT) r.pitWhy = { mode: pit.ai && pit.ai.mode, tactic: pit.tactic, dead: pit.dead, cs: +pc.speed.toFixed(1), ps: +pit.speed.toFixed(1) };
        GAME.test.fastForward(0.5);
        r.spun = Math.abs(U.wrapPI(pc.heading - h0)) > 0.5;
      }
      // switched off, they only follow
      GAME.police.tactics = false;
      var plain = GAME.police.spawnUnit(); if (plain) spawned.push(plain);
      r.politeOff = !plain || plain.tactic === 'chase';
    } finally {
      GAME.police.tactics = false;
      GAME.police.clearWanted();
      if (P.inCar) GAME.exitCar();
      GAME.test.fastForward(1);
      spawned.forEach(function (c) { if (!c.gone) GAME.vehicles.removeCar(c); });
      GAME.army.tanks().forEach(function (c) { GAME.vehicles.removeCar(c); });
      GAME.godMode = false;
      P.health = 100;
      GAME.test.teleport(-60, 40); GAME.test.fastForward(0.5);
    }
    return r;
  });
  check('law: there is a sixth star, and the HUD has room for it', law.six, JSON.stringify(law));
  check('law: at six the army comes — soldiers, and a tank', law.tank && law.army, JSON.stringify(law));
  check('law: take the tank and it is yours, cannon and all', law.mine && law.cannon, JSON.stringify(law));
  check('law: a tank flattens what it drives into', law.crush, JSON.stringify(law));
  check('law: from three stars the cruisers ram, PIT and box you in', law.tactics === 'box,pit,ram' || law.tactics === 'box,chase,pit,ram', JSON.stringify(law));
  check('law: a PIT at your back wheel spins you round', law.pitT && law.spun, JSON.stringify(law));
  check('law: with the tactics off they only follow', law.politeOff, JSON.stringify(law));

  // ---------- 21: cheats ----------
  // The codes, typed into CHEATS on the pause screen: health,
  // armour, the three weapon sets, the stars off and on, a tank, cars, the
  // weather. A word that is not one does nothing.
  var cheat = await page.evaluate(function () {
    var P = GAME.player, C = GAME.cheats, r = {};
    var weapons0 = JSON.parse(JSON.stringify(P.weapons, function (k, v) { return v === Infinity ? 'INF' : v; }));
    var cur0 = P.currentWeapon, spawned = [];
    try {
      if (P.inCar) GAME.exitCar();
      GAME.test.teleport(-60, 40); GAME.test.fastForward(0.5);
      // the box, off the pause screen, typed into
      GAME.togglePause();
      document.getElementById('pause-cheats').dispatchEvent(new MouseEvent('click', { bubbles: true }));
      r.open = !!GAME.cheatOpen && document.getElementById('cheat-box').style.display === 'flex';
      var inp = document.getElementById('cheat-input');
      P.health = 30;
      inp.value = 'aspirine';
      inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      r.health = P.health === 100 && /Health/.test(document.getElementById('cheat-said').textContent);
      inp.value = 'NOTACHEAT';
      inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      r.nothing = /Nothing/.test(document.getElementById('cheat-said').textContent);
      C.close();
      if (GAME.paused) GAME.togglePause();
      GAME.test.fastForward(0.2);
      r.closed = !GAME.cheatOpen;
      // the rest straight through the same door
      r.armour = !!C.enter('PRECIOUSPROTECTION') && P.armor === 100;
      r.nutter = !!C.enter('NUTTERTOOLS') && P.weapons.chainsaw.have && P.weapons.rocket.have && P.weapons.sniper.have;
      var cars0 = GAME.world.cars.length;
      r.panzer = !!C.enter('panzer') && GAME.world.cars.some(function (c) { if (c.spec.tank && c.occupied !== 'ai') { spawned.push(c); return true; } return false; });
      r.up = !!C.enter('YOUWONTTAKEMEALIVE') && GAME.police.wanted === 2;
      r.clear = !!C.enter('LEAVEMEALONE') && GAME.police.wanted === 0;
      r.rain = !!C.enter('CATSANDDOGS') && GAME.weather.mode === 'rain';
      C.enter('ALOVELYDAY');
      r.count = C.codes().length;
    } finally {
      C.close();
      if (GAME.paused) GAME.togglePause();
      GAME.weather.setMode('clear', true);
      spawned.forEach(function (c) { if (!c.gone) GAME.vehicles.removeCar(c); });
      P.weapons = JSON.parse(JSON.stringify(weapons0), function (k, v) { return v === 'INF' ? Infinity : v; });
      P.currentWeapon = cur0; GAME.combat.refreshWeaponHud();
      P.armor = 0; P.health = 100;
      GAME.police.clearWanted();
      GAME.test.fastForward(0.3);
    }
    return r;
  });
  check('cheats: CHEATS on the pause screen opens a box to type a code in', cheat.open && cheat.closed, JSON.stringify(cheat));
  check('cheats: ASPIRINE heals; a word that is not a code does nothing', cheat.health && cheat.nothing, JSON.stringify(cheat));
  check('cheats: armour, the nutter\'s weapons, and a tank beside you', cheat.armour && cheat.nutter && cheat.panzer, JSON.stringify(cheat));
  check('cheats: the stars up and off, and the weather', cheat.up && cheat.clear && cheat.rain && cheat.count >= 15, JSON.stringify(cheat));

  // ---------- 22: landmarks ----------
  // One a district, on a lot the blocks left empty: THE NEON TIDE on the strip,
  // the stadium in Las Colinas, ROSA PICTURES in Centro Alto, VILLA SALAZAR
  // up in the hills. Each is solid where it is built, signed, and open where
  // you would go in; nothing that was lying about ended up inside one.
  var lm = await page.evaluate(function () {
    var C = GAME.city, r = { sites: [] };
    GAME.landmarks.sites().forEach(function (s) {
      var walls = C.hash.query(s.x, s.z, s.lot / 2).filter(function (b) {
        return b.tag === 'building' && b.minX > s.x - s.lot / 2 - 2 && b.maxX < s.x + s.lot / 2 + 2 && b.minZ > s.z - s.lot / 2 - 2 && b.maxZ < s.z + s.lot / 2 + 2;
      }).length;
      r.sites.push({ id: s.id, district: C.districtName(s.x, s.z), walls: walls, faces: !!s.frame });
    });
    // the stadium's gate is open to the road: a clear line from the street to the pitch
    var st = GAME.landmarks.sites().filter(function (s) { return s.id === 'stadium'; })[0];
    var gate = st.frame.at(0, 30), pitch = st.frame.at(0, 0);
    r.gateOpen = C.hash.segmentClear(gate.x, gate.z, pitch.x, pitch.z);
    // nothing to pick up is inside a wall of theirs
    r.buried = GAME.world.pickups.concat(GAME.tapes.list().map(function (t) { return { pos: { x: t.x, y: t.y, z: t.z } }; })).filter(function (p) {
      return C.hash.query(p.pos.x, p.pos.z, 0.3).some(function (b) {
        return b.tag === 'building' && p.pos.x > b.minX && p.pos.x < b.maxX && p.pos.z > b.minZ && p.pos.z < b.maxZ && (b.h === undefined || b.h > p.pos.y + 0.3) &&
          !!GAME.landmarks.near(p.pos.x, p.pos.z, 40);
      });
    }).length;
    return r;
  });
  check('landmarks: four of them, in four districts, each built and solid',
    lm.sites.length === 4 && lm.sites.every(function (s) { return s.walls >= 3 && s.faces; }) &&
    lm.sites.map(function (s) { return s.district; }).filter(function (d, i, a) { return a.indexOf(d) === i; }).length >= 3, JSON.stringify(lm));
  check('landmarks: the stadium\'s gate is open from the road to the pitch', lm.gateOpen, JSON.stringify(lm));
  check('landmarks: nothing to find ended up inside one', lm.buried === 0, JSON.stringify(lm));

  // ---------- 23: wear you can see ----------
  // Knocked about, a car loses the bumper at the end that took it (it lies
  // in the road), and past half its strength the bonnet springs; a round by
  // a wheel bursts that tyre and the car sits down on it; a spike strip
  // takes all four; the paint shop mends the lot.
  var wr = await page.evaluate(function () {
    var V = GAME.vehicles, r = {}, spawned = [];
    V.wear = true;
    try {
      GAME.test.teleport(-60, 40); GAME.test.fastForward(0.3);
      var car = GAME.test.spawnCar('sedan', 6, 0); spawned.push(car);
      GAME.test.fastForward(0.3);
      var kids0 = GAME.scene.children.length;
      var geo0 = car.mesh.userData.bodyMesh.geometry;
      car.speed = 10; V.damageCar(car, car.spec.hp * 0.32, 'wall'); car.speed = 0;
      r.front = car.parts === 1 && car.mesh.userData.bodyMesh.geometry !== geo0;
      r.inRoad = GAME.scene.children.length === kids0 + 1;
      r.noHoodYet = !car.hood;
      car.speed = -4; V.damageCar(car, car.spec.hp * 0.32, 'wall'); car.speed = 0;
      r.rear = car.parts === 3 && !!car.hood;
      // the same body comes from the cache for every car that has lost the same
      var car2 = GAME.test.spawnCar('sedan', -6, 0); spawned.push(car2);
      GAME.test.fastForward(0.2);
      V.repaint(car2, car.color);
      car2.speed = 10; V.damageCar(car2, car2.spec.hp * 0.32, 'wall'); car2.speed = -4; V.damageCar(car2, car2.spec.hp * 0.32, 'wall'); car2.speed = 0;
      r.shared = car2.mesh.userData.bodyMesh.geometry === car.mesh.userData.bodyMesh.geometry;
      // a tyre
      var fx = Math.sin(car.heading), fz = Math.cos(car.heading), wz = car.spec.l / 2 * 0.56, wx = car.spec.w / 2;
      r.missFar = !V.shotTyre(car, car.pos.x, car.pos.z);
      r.tyre = V.shotTyre(car, car.pos.x + fx * wz + fz * wx, car.pos.z + fz * wz - fx * wx) && car.burst === 1 && car.spiked;
      GAME.test.fastForward(0.6);
      r.sits = Math.abs(car.mesh.rotation.z) > 0.02;
      // the paint shop: as good as new
      V.mend(car); car.spiked = false;
      r.mended = car.parts === 0 && !car.hood && car.burst === 0 && car.mesh.userData.bodyMesh.geometry !== car2.mesh.userData.bodyMesh.geometry;
      // and switched off, a knock is only hp
      V.wear = false;
      var car3 = GAME.test.spawnCar('sedan', 0, 8); spawned.push(car3);
      GAME.test.fastForward(0.2);
      car3.speed = 10; V.damageCar(car3, car3.spec.hp * 0.6, 'wall'); car3.speed = 0;
      r.off = car3.parts === 0 && !car3.hood;
    } finally {
      V.wear = false;
      spawned.forEach(function (c) { if (!c.gone) V.removeCar(c); });
      GAME.test.fastForward(0.3);
    }
    return r;
  });
  check('wear: the end that took the knock loses its bumper, and it lies in the road', wr.front && wr.inRoad && wr.noHoodYet, JSON.stringify(wr));
  check('wear: both ends gone and past half its strength, the bonnet springs', wr.rear, JSON.stringify(wr));
  check('wear: a car short of its bumpers costs no geometry of its own', wr.shared, JSON.stringify(wr));
  check('wear: a round by a wheel bursts that tyre, and the car sits down on it', wr.missFar && wr.tyre && wr.sits, JSON.stringify(wr));
  check('wear: the paint shop mends the lot; switched off, a knock is only hp', wr.mended && wr.off, JSON.stringify(wr));

  // ---------- 24: the radio's personality ----------
  // Every station has a place on the dial, a sound and a DJ: tuning in
  // shows the frequency and plays its jingle; a minute or so on the songs
  // dip and the DJ (or an ad) talks, in a caption and a voice on the
  // radio's own bus. MUSIC: OFF takes the lot.
  var djr = await page.evaluate(function () {
    var A = GAME.audio, R = A.radio, D = GAME.dj, P = GAME.player, r = {};
    A.init();
    var mute0 = A.muted, music0 = A.musicOn;
    if (A.muted) A.toggleMute();
    A.setMusicOn(true);
    D.enabled = true;
    var car = null;
    try {
      r.ids = R.stations.every(function (s) { var id = D.identity(s.name); return id && id.freq && id.genre && id.dj && id.jingle.length >= 3 && id.lines.length >= 4; });
      car = GAME.test.spawnCar('sedan', 4, 0);
      GAME.test.fastForward(0.2); GAME.test.enterNearestCar(car); GAME.test.fastForward(1.5);
      var j0 = R.jingles;
      var name = R.switchStation(1);
      if (name === 'RADIO OFF') name = R.switchStation(1);
      GAME.hud.radioPopup(name);
      r.dial = /FM|PIRATE/.test(document.getElementById('radio-popup').textContent);
      r.jingle = R.jingles === j0 + 1;
      var seg = D.segment();
      r.talks = !!seg && document.getElementById('radio-talk').classList.contains('on') &&
        document.getElementById('radio-talk').textContent.indexOf(seg.text) >= 0;
      var t0 = R.talkNodes;
      GAME.test.fastForward(1.0);
      r.voice = R.talkNodes > t0;
      GAME.test.fastForward(10);
      r.done = !D.talking && !document.getElementById('radio-talk').classList.contains('on');
      // MUSIC: OFF: no jingle, no talk
      A.setMusicOn(false);
      GAME.test.fastForward(2.5);
      var j1 = R.jingles;
      GAME.hud.radioPopup(R.switchStation(1));
      r.offNoJingle = R.jingles === j1 && !D.segment();
      A.setMusicOn(true);
      // out of the car, the talk stops with the songs
      D.segment();
      GAME.test.exitCar(); GAME.test.fastForward(3.5);
      r.footQuiet = !D.talking;
    } finally {
      D.enabled = false;
      if (P.inCar) GAME.test.exitCar();
      GAME.test.fastForward(1);
      if (car && !car.gone) GAME.vehicles.removeCar(car);
      A.setMusicOn(music0);
      if (A.muted !== mute0) A.toggleMute();
    }
    return r;
  });
  check('radio: every station has a frequency, a sound, a DJ and a jingle', djr.ids, JSON.stringify(djr));
  check('radio: tuning in shows where it is on the dial and plays its jingle', djr.dial && djr.jingle, JSON.stringify(djr));
  check('radio: the DJ talks, in a caption and a voice, and stops', djr.talks && djr.voice && djr.done, JSON.stringify(djr));
  check('radio: MUSIC: OFF takes the jingle and the talk; so does getting out', djr.offNoJingle && djr.footQuiet, JSON.stringify(djr));

  // ---------- 25: import/export ----------
  // A crane on the harbour and a board of wanted cars: drive one off the
  // board into the ring and stop, and it ships — paid by what it is and the
  // state it is in, ticked off, and not wanted again; a wreck is turned away;
  // a full list pays a bonus.
  var ex = await page.evaluate(function () {
    var X = GAME.exporter, P = GAME.player, r = {}, spawned = [];
    var saved = JSON.stringify(GAME.prefs.exported || {});
    GAME.prefs.exported = {};
    try {
      var s = X.site;
      r.site = !!s && GAME.city.districtAt(s.x, s.z) === 'harbor';
      function drive(type) {
        if (P.inCar) { GAME.exitCar(); GAME.test.fastForward(1.5); }
        var c = GAME.test.spawnCar(type, 4, 0); spawned.push(c);
        GAME.test.fastForward(0.2); GAME.test.enterNearestCar(c); GAME.test.fastForward(1.5);
        return c;
      }
      // a wreck is turned away
      var c0 = drive('sedan');
      c0.hp = c0.spec.hp * 0.2;
      GAME.test.teleport(s.x, s.z); GAME.test.fastForward(0.5);
      r.wreck = P.inCar && X.wanted('sedan') && /one piece/.test(X.hint);
      // a good one ships
      GAME.exitCar(); GAME.test.fastForward(1.5);
      GAME.test.teleport(s.x + 30, s.z); GAME.test.fastForward(0.3);
      var c1 = drive('sedan');
      var cash = P.cash;
      GAME.test.teleport(s.x, s.z); GAME.test.fastForward(0.5);
      r.shipped = !P.inCar && P.cash > cash && !X.wanted('sedan') && (!!c1.gone || !!c1.stow);
      // and the same again is not wanted
      GAME.test.teleport(s.x + 30, s.z); GAME.test.fastForward(0.3);
      drive('sedan');
      var cash2 = P.cash;
      GAME.test.teleport(s.x, s.z); GAME.test.fastForward(0.5);
      r.once = P.inCar && P.cash === cash2 && /already/.test(X.hint);
      // the rest of list one, and its bonus
      ['taxi', 'van', 'sports', 'motorcycle', 'police'].forEach(function (t) { GAME.prefs.exported[t] = true; });
      delete GAME.prefs.exported.police;
      GAME.exitCar(); GAME.test.fastForward(1.5);
      GAME.test.teleport(s.x + 30, s.z); GAME.test.fastForward(0.3);
      drive('police');
      GAME.police.clearWanted();
      var cash3 = P.cash;
      GAME.test.teleport(s.x, s.z); GAME.test.fastForward(0.5);
      r.bonus = P.cash - cash3 >= X.LISTS[0].bonus;
    } finally {
      GAME.police.clearWanted();
      if (P.inCar) GAME.exitCar();
      GAME.test.fastForward(1.5);
      spawned.forEach(function (c) { if (!c.gone) GAME.vehicles.removeCar(c); });
      GAME.prefs.exported = JSON.parse(saved);
      GAME.test.teleport(-60, 40); GAME.test.fastForward(0.5);
    }
    return r;
  });
  check('export: a crane on the harbour, and a car off the board ships for cash', ex.site && ex.shipped, JSON.stringify(ex));
  check('export: a wreck is turned away, and nobody wants the same car twice', ex.wreck && ex.once, JSON.stringify(ex));
  check('export: a full list pays the buyer\'s bonus', ex.bonus, JSON.stringify(ex));

  // ---------- 26: MINI MAYHEM RACE ----------
  // A ring at the stadium gate: step in and you are driving a toy buggy on
  // the pitch against three more, after a countdown; put the controller down
  // and it is over, with you back at the gate; get home first and it pays.
  var rcr = await page.evaluate(function () {
    var R = GAME.rc, P = GAME.player, r = {};
    var saved = JSON.stringify(GAME.prefs.rc || {});
    GAME.prefs.rc = {};
    try {
      if (P.inCar) { GAME.exitCar(); GAME.test.fastForward(1.5); }
      GAME.police.clearWanted();
      var s = R.site;
      r.site = !!s && s.cps.length >= 12;
      GAME.test.teleport(s.ring.x + 6, s.ring.z); GAME.test.fastForward(0.3);
      r.hint = /MINI MAYHEM/.test(R.hint);
      // not with the law on you
      GAME.police.setWanted(1);
      GAME.test.teleport(s.ring.x, s.ring.z); GAME.test.fastForward(0.3);
      r.notHot = !R.running;
      GAME.police.clearWanted();
      GAME.test.teleport(s.ring.x + 6, s.ring.z); GAME.test.fastForward(0.3);
      GAME.test.teleport(s.ring.x, s.ring.z); GAME.test.fastForward(0.3);
      r.started = !!R.running && R.running.rivals === 3 && P.inCar && P.car.spec.rc && R.running.state === 'count';
      GAME.test.fastForward(3.5);
      r.go = R.running && R.running.state === 'run';
      // the controller down: over, and back at the gate
      GAME.exitCar(); GAME.test.fastForward(0.2);
      r.quit = !R.running && !P.inCar && Math.hypot(P.pos.x - s.ring.x, P.pos.z - s.ring.z) < 6 &&
        !GAME.world.cars.some(function (c) { return c.spec.rc && !c.gone; });
      // again, and home first: paid
      GAME.test.teleport(s.ring.x + 6, s.ring.z); GAME.test.fastForward(0.3);
      GAME.test.teleport(s.ring.x, s.ring.z); GAME.test.fastForward(0.3);
      GAME.test.fastForward(3.5);
      var cash = P.cash, last = s.cps[s.cps.length - 1];
      GAME.world.cars.forEach(function (c) { if (c.spec.rc && c.occupied === 'ai') c.cpIndex = 0; });
      // (round the course by the cones, a hop at a time)
      for (var k = 0; k < s.cps.length && R.running; k++) {
        var cp = s.cps[R.running.cp];
        P.car.pos.set(cp.x, P.car.pos.y, cp.z); P.car.speed = 0;
        GAME.world.cars.forEach(function (c) { if (c.spec.rc && c.occupied === 'ai') c.cpIndex = 0; });
        GAME.test.fastForward(1 / 30);
      }
      r.won = !R.running && P.cash - cash === 800 && GAME.prefs.rc.won === true && !P.inCar;
    } finally {
      if (R.running) R.end();
      GAME.prefs.rc = JSON.parse(saved);
      GAME.test.teleport(-60, 40); GAME.test.fastForward(0.5);
    }
    return r;
  });
  check('rc: a ring at the stadium gate, and a course on the pitch', rcr.site && rcr.hint, JSON.stringify(rcr));
  check('rc: step in and it is you in a toy against three, after a countdown', rcr.notHot && rcr.started && rcr.go, JSON.stringify(rcr));
  check('rc: put the controller down and it is over, back at the gate', rcr.quit, JSON.stringify(rcr));
  check('rc: home first, and it pays', rcr.won, JSON.stringify(rcr));

  // ---------- 27: the route line stops where it is going ----------
  // The search runs junction to junction, and the junction nearest a place
  // is as often past it as short of it: half the routes ran on by the
  // destination to the next corner and came back, a U-turn at the lights.
  // Four hundred routes across the mainland, drawn as the map draws them
  // (you, the corners, the place): none turns back on itself.
  var rt = await page.evaluate(function () {
    var C = GAME.city, seed = 7, n = 0, bad = 0, none = 0, ex = null;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (var k = 0; k < 400; k++) {
      var a = C.nearestRoadPoint(-400 + rnd() * 750, -420 + rnd() * 820), b = C.nearestRoadPoint(-400 + rnd() * 750, -420 + rnd() * 820);
      var p = GAME.nav.roadPath(a.x, a.z, b.x, b.z);
      if (!p.length) { none++; continue; }
      var pts = [[a.x, a.z]];
      p.concat([{ x: b.x, z: b.z }]).forEach(function (q) {
        var l = pts[pts.length - 1];
        if (Math.hypot(q.x - l[0], q.z - l[1]) > 0.5) pts.push([q.x, q.z]);
      });
      n++;
      for (var i = 1; i < pts.length - 1; i++) {
        var ux = pts[i][0] - pts[i - 1][0], uz = pts[i][1] - pts[i - 1][1], vx = pts[i + 1][0] - pts[i][0], vz = pts[i + 1][1] - pts[i][1];
        if ((ux * vx + uz * vz) / (Math.hypot(ux, uz) * Math.hypot(vx, vz)) < -0.87) {
          bad++; if (!ex) ex = pts.map(function (q) { return [Math.round(q[0]), Math.round(q[1])]; }); break;
        }
      }
    }
    return { routes: n, uturns: bad, none: none, ex: ex };
  });
  check('routes: every route across the mainland is found', rt.routes === 400 && rt.none === 0, JSON.stringify(rt));
  check('routes: none runs past the place and back, or back before it sets off', rt.uturns === 0, JSON.stringify(rt));

  // ---------- 28: first day, face to face; and the street's small things ----------
  var fd = await page.evaluate(function () {
    var r = {}, P = GAME.player, G = GAME.guide, M = GAME.missions, S = GAME.shops, L = GAME.lola, C = GAME.city;
    var ff = function (t) { GAME.test.fastForward(t); };
    var spawned = [], guide0 = GAME.prefs.guide, bests0 = JSON.stringify(GAME.bests || {});
    var biz0 = JSON.stringify(GAME.prefs.business || null), outfit0 = JSON.stringify(GAME.prefs.outfit || {});
    var courier = M.DEFS.filter(function (d) { return d.id === 'courier2'; })[0];
    var barber = S.locations().filter(function (l) { return l.kind === 'barber'; })[0];
    function settle() {
      if (GAME.scenes.active) GAME.scenes.skip();
      if (L.isOpen) L.close();
      if (M.active) M.abandon();
      if (GAME.shopOpen) S.close();
      if (GAME.interiors.current) GAME.interiors.reset();
      if (P.inCar) GAME.exitCar();
      GAME.police.clearWanted();
      ff(0.5);
    }
    try {
      settle();
      GAME.scenes.enabled = true;
      // --- paid: she comes to you, a scene where you stand, then the barber's marked ---
      GAME.bests = {}; GAME.prefs.guide = 'skipped';
      GAME.test.teleport(356, 40); ff(0.3);
      var bike = GAME.vehicles.spawnCar('motorcycle', 352, 44, 0, {}); spawned.push(bike);
      GAME.enterCar(bike); ff(1.5);
      G.begin(); ff(0.2);
      var job = G.jobFor(courier);
      G.finished(job, true); ff(2);
      var st = GAME.scenes.stage('here'), on = GAME.scenes.on;
      r.paid = { scene: GAME.scenes.active, cast: on.join(), near: st ? Math.round(Math.hypot(st.x - P.car.pos.x, st.z - P.car.pos.z)) : -1,
        says: /did good/.test((GAME.scenes.line || {}).text || ''), step: G.step };
      for (var i = 0; i < 40 && GAME.scenes.active; i++) { GAME.scenes.advance(); ff(0.3); GAME.scenes.advance(); ff(0.1); }
      var nd = GAME.nav.dest;
      r.paid.after = { over: !GAME.scenes.active, routed: !!nd && Math.hypot(nd.x - barber.at.x, nd.z - barber.at.z) < 2 };
      // --- out of the barber's: a scene on the pavement, then her question ---
      settle();
      GAME.test.teleport(barber.at.x + 3, barber.at.z); ff(0.3);
      GAME.interiors.enter(barber); ff(1.5);
      S.open(barber); ff(0.2); S.close(); ff(0.3);
      GAME.interiors.leave(); ff(1.5);
      r.out = { scene: GAME.scenes.active, step: G.step, threads: false };
      for (var j = 0; j < 40 && GAME.scenes.active; j++) { if (/THREADS/.test((GAME.scenes.line || {}).text || '')) r.out.threads = true; GAME.scenes.advance(); ff(0.3); GAME.scenes.advance(); ff(0.1); }
      r.out.asked = L.isOpen && L.options().some(function (o) { return /MARK THREADS/.test(o); });
      if (L.isOpen) L.choose(/EXPLORE/);
      ff(0.3);
      r.out.done = G.step === null && GAME.prefs.guide === 'done';
      settle();
      GAME.scenes.enabled = false;
      // --- the radio: the DJ in a job, but never an ad ---
      var car = GAME.test.spawnCar('sedan', 4, 0); spawned.push(car);
      ff(0.2); GAME.test.enterNearestCar(car); ff(1.5);
      var D = GAME.dj, dj0 = D.enabled; D.enabled = true;
      var R = GAME.audio.radio, rnd0 = Math.random;
      Math.random = function () { return 0.01; };   // an ad, if one is allowed
      var seg = D.segment();
      r.ads = { roaming: D.roaming(), roamAd: !!seg && seg.who === 'AD' };
      GAME.test.teleport(courier.start.x + 8, courier.start.z); ff(0.2);
      P.car.pos.set(courier.start.x, C.groundY(courier.start.x, courier.start.z), courier.start.z); P.car.speed = 0; ff(1.5);
      var seg2 = M.active ? D.segment() : null;
      r.ads.inJob = !!M.active; r.ads.jobRoaming = D.roaming(); r.ads.jobAd = !!seg2 && seg2.who === 'AD';
      Math.random = rnd0;
      D.enabled = dj0;
      settle();
      // --- a shop of your own: what it sells is on the house ---
      GAME.prefs.business = GAME.prefs.business || { owned: {}, till: {}, told: {}, fares: 0 };
      GAME.prefs.business.owned.barber0 = true;
      GAME.test.teleport(barber.at.x + 3, barber.at.z); ff(0.3);
      S.open(barber); ff(0.2);
      var cash = P.cash, style = S.wardrobe.HAIRSTYLES.filter(function (h) { return h.id !== (GAME.prefs.outfit || {}).hairStyle; })[0];
      S.buy('style_' + style.id);
      r.owned = { free: P.cash === cash, cut: GAME.prefs.outfit.hairStyle === style.id };
      S.close(); ff(0.2);
      delete GAME.prefs.business.owned.barber0;
      S.open(barber); ff(0.2);
      cash = P.cash;
      S.buy('style_' + S.wardrobe.HAIRSTYLES.filter(function (h) { return h.id !== GAME.prefs.outfit.hairStyle; })[0].id);
      r.owned.paysElsewhere = cash - P.cash === 150;
      settle();
      // --- a door mat by the car you parked takes you in when you get out ---
      var rp = C.nearestRoadPoint(barber.at.x + 40, barber.at.z);
      var c2 = GAME.vehicles.spawnCar('sedan', rp.x, rp.z, 0, {}); spawned.push(c2);
      GAME.test.teleport(rp.x + 2.5, rp.z); ff(0.2);
      GAME.enterCar(c2); ff(1.5);
      for (var k = 0; k < 90; k++) { c2.pos.x += (barber.at.x + 3.5 - c2.pos.x) * 0.08; c2.pos.z += (barber.at.z - c2.pos.z) * 0.08; c2.speed = 0; ff(1 / 60); }
      GAME.exitCar(); ff(0.3);
      for (var w = 0; w < 4 && !GAME.interiors.current; w += 1 / 60) {
        var dx = barber.at.x - P.pos.x, dz = barber.at.z - P.pos.z;
        if (dx * dx + dz * dz < 0.1) break;
        P.heading = Math.atan2(dx, dz); GAME.cam.yaw = P.heading;
        GAME.test.pressKey('KeyW', true); ff(1 / 60);
      }
      GAME.test.pressKey('KeyW', false); ff(1);
      r.door = !!GAME.interiors.current;
    } finally {
      GAME.scenes.enabled = false;
      settle();
      spawned.forEach(function (c) { if (!c.gone) GAME.vehicles.removeCar(c); });
      GAME.prefs.guide = guide0; GAME.bests = JSON.parse(bests0);
      if (biz0 === 'null') delete GAME.prefs.business; else GAME.prefs.business = JSON.parse(biz0);
      GAME.prefs.outfit = JSON.parse(outfit0); if (S.applyOutfit) S.applyOutfit();
      if (GAME.nav) GAME.nav.clear();
      GAME.test.teleport(-60, 40); ff(0.5);
    }
    return r;
  });
  check('first day: paid, Lola comes to you — a scene where you stand, and she says you did good',
    fd.paid && fd.paid.scene && fd.paid.cast === 'lola,you' && fd.paid.near >= 0 && fd.paid.near < 8 && fd.paid.says, JSON.stringify(fd.paid));
  check('first day: and after it, CORTES CUTS is marked', fd.paid && fd.paid.after.over && fd.paid.after.routed && fd.paid.step === 'barber', JSON.stringify(fd.paid));
  check('first day: out of the barber\'s, a scene on the pavement, then THREADS — marked, or on your own',
    fd.out && fd.out.scene && fd.out.threads && fd.out.step === 'outro' && fd.out.asked && fd.out.done, JSON.stringify(fd.out));
  check('radio: an ad while you cruise, never in the middle of a job', fd.ads && fd.ads.roaming && fd.ads.roamAd && fd.ads.inJob && !fd.ads.jobRoaming && !fd.ads.jobAd, JSON.stringify(fd.ads));
  check('business: in a shop of your own it is on the house; anywhere else it costs', fd.owned && fd.owned.free && fd.owned.cut && fd.owned.paysElsewhere, JSON.stringify(fd.owned));
  check('doors: get out of the car by a door mat and step on it, and you are in', fd.door, JSON.stringify(fd.door));

  // ---------- 29: every parked vehicle out of the way ----------
  // A motorbike stood on the crown of the road at a crossing by the
  // hospital, a cruiser inside the tower beside the police station and a
  // bike in a lamp post on the strip. Every spot, mainland and island, with
  // the bridges open: a land vehicle's spot is no nearer a road's middle
  // than its kerbside lane (5.3 m) allows, not in the water, and nothing
  // solid stands where it would at its own level.
  var pk = await page.evaluate(function () {
    var C = GAME.city, open0 = GAME.isla.isOpen(), out = { n: 0, lane: [], wet: [], solid: [], door: [] };
    if (!open0) GAME.isla.setOpen(true);
    try {
      C.parkedSpots.forEach(function (sp) {
        if (/boat|jetski/.test(sp.vtype || '')) return;
        out.n++;
        var tag = (sp.vtype || (sp.police ? 'police' : 'car')) + '@' + Math.round(sp.x) + ',' + Math.round(sp.z);
        var y = sp.y !== undefined ? sp.y : C.groundY(sp.x, sp.z);
        if (sp.y === undefined || sp.y < 3) {
          var rp = C.nearestRoadPoint(sp.x, sp.z);
          if (Math.hypot(rp.x - sp.x, rp.z - sp.z) < 4.2) out.lane.push(tag);
          if (C.isInWater(sp.x, sp.z)) out.wet.push(tag);
        }
        // (and not in front of a door: the condo's mat was blocked by a bike)
        GAME.shops.locations().forEach(function (l) {
          if (!sp.vtype && !sp.police) return;   // (the street's kerbside rows are the street's)
          if (l.kind === 'cabs') return;          // (the cab firm's bays are inside its garage, by design)
          if (Math.hypot(l.at.x - sp.x, l.at.z - sp.z) < 9) out.door.push(tag + ':' + l.id);
        });
        C.hash.query(sp.x, sp.z, 1.6).forEach(function (b) {
          if (sp.x < b.minX - 0.9 || sp.x > b.maxX + 0.9 || sp.z < b.minZ - 0.9 || sp.z > b.maxZ + 0.9) return;
          var lo = b.minY !== undefined ? b.minY : 0, hi = lo + (b.h || 0);
          if (lo < y + 1.6 && hi > y + 0.3) out.solid.push(tag + ':' + (b.tag || ''));
        });
      });
    } finally { if (!open0) GAME.isla.setOpen(false); }
    return out;
  });
  check('parked: every spot is checked (anchor sanity)', pk.n > 100, String(pk.n));
  check('parked: none in a traffic lane', pk.lane.length === 0, JSON.stringify(pk.lane));
  check('parked: none in the water', pk.wet.length === 0, JSON.stringify(pk.wet));
  check('parked: none inside a wall, a building or a prop', pk.solid.length === 0, JSON.stringify(pk.solid));
  check('parked: none stood in front of a door', pk.door.length === 0, JSON.stringify(pk.door));

  // ---------- 30: nobody blinks out of the street ----------
  var nv = await page.evaluate(function () {
    var r = {}, P = GAME.player, SG = GAME.strangers, Sc = GAME.scenes, L = GAME.lola, M = GAME.missions, C = GAME.city;
    var ff = function (t) { GAME.test.fastForward(t); };
    var sg0 = SG.enabled, done0 = JSON.stringify((GAME.prefs || {}).strangers || {}), cash0 = P.cash, spawned = [];
    var exp0 = JSON.stringify(GAME.prefs.exported || {});
    function through() { for (var i = 0; i < 40 && Sc.active; i++) { Sc.advance(); ff(0.3); Sc.advance(); ff(0.1); } }
    function person(id) { return SG.people().filter(function (q) { return q.def.id === id; })[0]; }
    function settle() {
      if (Sc.active) Sc.skip();
      if (L.isOpen) L.close();
      if (SG.busy) SG.abandon();
      if (M.active) M.abandon();
      if (P.inCar) GAME.exitCar();
      GAME.police.clearWanted();
      ff(0.5);
    }
    try {
      settle();
      GAME.prefs.strangers = {};
      SG.enabled = true; Sc.enabled = true;
      // --- walk up to Ray: he asks face to face, then yes or no ---
      var ray = person('ray');
      GAME.test.teleport(ray.at.x + 10, ray.at.z); ff(1);
      for (var t = 0; t < 6 && !Sc.active && !L.isOpen; t += 1 / 60) {
        P.heading = Math.atan2(ray.at.x - P.pos.x, ray.at.z - P.pos.z); GAME.cam.yaw = P.heading;
        GAME.test.pressKey('KeyW', true); ff(1 / 60);
      }
      GAME.test.pressKey('KeyW', false); ff(0.5);
      r.ask = { scene: Sc.active, cast: Sc.on.join(), hidden: !!ray.ped && !ray.ped.mesh.visible };
      through();
      r.ask.menu = L.isOpen && L.options().some(function (o) { return /DO IT/.test(o); });
      if (L.isOpen) L.choose(/NOT RIGHT NOW/);
      ff(0.3);
      r.ask.back = !!ray.ped && ray.ped.mesh.visible;
      // --- Ray in the car to the gate: thanks, then out and in at the gate ---
      SG.ask('ray'); ff(0.2);
      var car = GAME.vehicles.spawnCar('sedan', ray.at.x + 3, ray.at.z, 0, {}); spawned.push(car);
      GAME.test.teleport(ray.at.x + 5, ray.at.z); ff(0.2); GAME.enterCar(car); ff(1.5);
      r.ray = { aboard: SG.job && SG.job.away };
      SG.finish('test'); ff(0.6);
      r.ray.scene = Sc.active; r.ray.cast = Sc.on.join();
      through(); ff(0.3);
      var out = GAME.world.peds.filter(function (q) { return q.state === 'enter' && Math.hypot(q.pos.x - car.pos.x, q.pos.z - car.pos.z) < 6; });
      r.ray.out = out.length; r.ray.over = !SG.busy;
      settle();
      // --- Tito's bike back to him: he rides off on it, you are on foot ---
      var tito = person('tito');
      GAME.test.teleport(tito.at.x + 8, tito.at.z); ff(1);
      SG.ask('tito'); ff(0.5);
      var j = SG.job, b = j && j.bike;
      if (b) {
        b.occupied = null; if (b.riderMesh) { b.mesh.remove(b.riderMesh); b.riderMesh = null; } b.ai = null; b.speed = 0;
        GAME.test.teleport(b.pos.x + 1.5, b.pos.z); ff(0.2); GAME.enterCar(b); ff(1.5);
        b.pos.set(tito.at.x + 4, C.groundY(tito.at.x + 4, tito.at.z), tito.at.z); b.speed = 0; ff(0.6);
        r.tito = { scene: Sc.active, cast: Sc.on.join() };
        through(); ff(2);
        r.tito.onFoot = !P.inCar; r.tito.rides = b.occupied === 'ai' && !!b.riderMesh && !b.mission && !b.gone;
        r.tito.off = Math.round(Math.hypot(b.pos.x - (tito.at.x + 4), b.pos.z - tito.at.z));
      }
      settle();
      // --- Biscuit home: Mrs. Albescu walks off with him at her heel ---
      var rosa = person('rosa');
      GAME.test.teleport(rosa.at.x + 6, rosa.at.z); ff(1);
      SG.ask('rosa'); ff(0.3);
      var dog = SG.job && SG.job.dog;
      if (dog) dog.position.set(rosa.at.x + 2, C.groundY(rosa.at.x + 2, rosa.at.z), rosa.at.z);
      SG.finish('test'); through(); ff(3);
      r.rosa = { leavers: SG.leavers, owner: !!rosa.ped === false, dogUp: !!dog && !!dog.parent };
      var owner = GAME.world.peds.filter(function (q) { return Math.hypot(q.pos.x - rosa.at.x, q.pos.z - rosa.at.z) < 15 && q.state === 'walk'; }).length;
      r.rosa.walking = owner > 0;
      r.rosa.near = dog ? Math.round(Math.min.apply(null, GAME.world.peds.map(function (q) { return Math.hypot(q.pos.x - dog.position.x, q.pos.z - dog.position.z); }))) : -1;
      settle();
      // --- Dani rings: a scene with nobody stood in it ---
      var dani = person('dani');
      GAME.test.teleport(dani.at.x + 6, dani.at.z); ff(1);
      SG.ask('dani'); ff(0.3);
      SG.finish('A motel. Of course it is a motel.'); ff(0.6);
      r.dani = { scene: Sc.active, cast: Sc.on.join(), speaks: Sc.line && Sc.line.who };
      through();
      r.dani.over = !SG.busy;
      settle();
      Sc.enabled = false;
      // --- a race's field drives off with the traffic ---
      var race = M.DEFS.filter(function (d) { return d.id === 'race0'; })[0];
      var ride = GAME.test.spawnCar('taxi', 4, 0); spawned.push(ride);
      ff(0.3); GAME.test.enterNearestCar(ride); ff(1.5);
      GAME.test.teleport(race.start.x, race.start.z);
      var a = null;
      for (var f = 0; f < 900; f++) { ff(1 / 60); a = M.active; if (a && a.racers && a.racers.length) break; }
      var field = a ? a.racers.slice() : [];
      M.failActive('test'); ff(0.5);
      r.race = { n: field.length, stay: field.filter(function (c) { return !c.gone; }).length,
        traffic: field.filter(function (c) { return !c.gone && !c.mission && c.ai && c.ai.mode === 'traffic'; }).length };
      settle();
      // --- an exported car goes up on the hook, then it is gone ---
      var X = GAME.exporter, site = X.site;
      GAME.prefs.exported = {};
      var ex = GAME.test.spawnCar('sedan', 4, 0); spawned.push(ex);
      ff(0.2); GAME.test.enterNearestCar(ex); ff(1.5);
      var y0 = P.car ? P.car.pos.y : 0, xc = P.car;
      GAME.test.teleport(site.x, site.z); ff(0.6);
      ff(1.5);
      r.exp = { up: !!xc && !xc.gone && xc.pos.y > y0 + 2, onFoot: !P.inCar };
      ff(5);
      r.exp.gone = !!xc && !!xc.gone;
    } finally {
      Sc.enabled = false;
      settle();
      spawned.forEach(function (c) { if (!c.gone) GAME.vehicles.removeCar(c); });
      GAME.prefs.strangers = JSON.parse(done0); GAME.prefs.exported = JSON.parse(exp0);
      SG.reset(); SG.enabled = sg0;
      P.cash = cash0;
      GAME.test.teleport(-60, 40); ff(0.5);
    }
    return r;
  });
  check('strangers: walk up and they ask face to face — then yes or no; the real one stands back in after',
    nv.ask && nv.ask.scene && nv.ask.cast === 'ray,you' && nv.ask.hidden && nv.ask.menu && nv.ask.back, JSON.stringify(nv.ask));
  check('strangers: Ray thanks you face to face, then gets out and goes in at the gate', nv.ray && nv.ray.aboard && nv.ray.scene && nv.ray.cast === 'ray,you' && nv.ray.out >= 1 && nv.ray.over, JSON.stringify(nv.ray));
  check('strangers: Tito takes his bike back and rides off on it; you are on foot', nv.tito && nv.tito.scene && nv.tito.onFoot && nv.tito.rides && nv.tito.off > 3, JSON.stringify(nv.tito));
  check('strangers: Mrs. Albescu walks off with Biscuit at her heel', nv.rosa && nv.rosa.leavers === 1 && nv.rosa.dogUp && nv.rosa.walking && nv.rosa.near < 4, JSON.stringify(nv.rosa));
  check('strangers: Dani is nowhere near — she rings, no one stood in the street', nv.dani && nv.dani.scene && nv.dani.cast === '' && nv.dani.speaks === 'dani' && nv.dani.over, JSON.stringify(nv.dani));
  check('races: when it is over the field drives off with the traffic, not out of the world', nv.race && nv.race.n > 0 && nv.race.stay === nv.race.n && nv.race.traffic === nv.race.n, JSON.stringify(nv.race));
  check('export: a car that ships goes up on the hook, then it is gone', nv.exp && nv.exp.up && nv.exp.onFoot && nv.exp.gone, JSON.stringify(nv.exp));

  // ---------- 31: one job at a time ----------
  var oj = await page.evaluate(function () {
    var r = {}, P = GAME.player, SG = GAME.strangers, M = GAME.missions, ff = function (t) { GAME.test.fastForward(t); };
    var sg0 = SG.enabled, done0 = JSON.stringify(GAME.prefs.strangers || {});
    function lit() {
      var rings = 0, marks = 0;
      GAME.scene.traverse(function (o) {
        if (!o.visible || !o.isMesh) return;
        if (o.geometry && o.geometry.type === 'CylinderGeometry' && o.material && o.material.transparent && o.material.blending === THREE.AdditiveBlending && !o.userData.respray) rings++;
        if (o.geometry && o.geometry.type === 'OctahedronGeometry') marks++;
      });
      var blips = M.getBlips().filter(function (b) { return /race|courier|rampage|takedown/.test(b.kind); }).length;
      return { rings: rings, marks: marks, blips: blips, strangerBlips: SG.blips().length, rc: GAME.rc && GAME.rc.site ? null : null };
    }
    try {
      GAME.prefs.strangers = {};
      SG.enabled = true;
      var ray = SG.people().filter(function (q) { return q.def.id === 'ray'; })[0];
      GAME.test.teleport(ray.at.x + 30, ray.at.z); ff(1.5);
      r.idle = lit();
      SG.ask('ray'); ff(0.5);
      r.favour = lit();
      r.favour.ring = { rc: !!(GAME.rc && GAME.rc.site) };
      SG.abandon(); ff(0.5);
      GAME.test.teleport(ray.at.x + 30, ray.at.z); ff(1.5);
      r.after = lit();
      // and on a mission, the strangers' marks are out too
      var dog = SG.people().filter(function (q) { return q.def.id === 'rosa'; })[0];
      GAME.test.teleport(dog.at.x + 25, dog.at.z); ff(1.5);
      r.markNear = lit().marks;
      // (a mission started from its ring a long way off — driven up to, as
      // the playtest group does it — then back here)
      var cj = M.DEFS.filter(function (d) { return d.id === 'courier2'; })[0];
      var crp = GAME.city.nearestRoadPoint(cj.start.x, cj.start.z), cax = crp.axis === 'z' ? 0 : 1;
      var cvx = cax ? cj.start.x - 30 : crp.x, cvz = cax ? crp.z : cj.start.z - 30;
      GAME.test.teleport(cvx, cvz + 3); ff(0.3);
      GAME.world.cars.slice().forEach(function (c) { if (Math.hypot(c.pos.x - cj.start.x, c.pos.z - cj.start.z) < 60) GAME.vehicles.removeCar(c); });
      var ride = GAME.vehicles.spawnCar('sedan', cvx, cvz, cax ? Math.PI / 2 : 0, {});
      GAME.test.enterNearestCar(ride); ff(1.5);
      for (var dr = 0; dr < 90 && P.inCar && !M.active; dr++) {
        P.car.pos.x += (cj.start.x - P.car.pos.x) * 0.06; P.car.pos.z += (cj.start.z - P.car.pos.z) * 0.06; P.car.speed = 0; ff(1 / 30);
      }
      ff(1.5);
      if (P.inCar) { P.car.pos.set(dog.at.x + 25, GAME.city.groundY(dog.at.x + 25, dog.at.z), dog.at.z); P.car.speed = 0; }
      ff(2);
      r.mission = { on: !!M.active, marks: lit().marks, strangerBlips: SG.blips().length };
      if (M.active) M.abandon();
      if (P.inCar) GAME.exitCar();
      ff(0.5);
      GAME.vehicles.removeCar(ride);
    } finally {
      if (SG.busy) SG.abandon();
      if (M.active) M.abandon();
      GAME.prefs.strangers = JSON.parse(done0);
      SG.reset(); SG.enabled = sg0;
      GAME.police.clearWanted();
      GAME.test.teleport(-60, 40); ff(0.5);
    }
    return r;
  });
  check('one job: idle, the rings and marks are out (anchor sanity)', oj.idle.rings > 3 && oj.idle.marks >= 1 && oj.idle.blips > 3, JSON.stringify(oj.idle));
  check('one job: on a favour, no mission ring, no other stranger\'s mark, none on the radar', oj.favour.rings === 0 && oj.favour.marks === 0 && oj.favour.blips === 0 && oj.favour.strangerBlips === 0, JSON.stringify(oj.favour));
  check('one job: and back when it is over', oj.after.rings > 3 && oj.after.marks >= 1 && oj.after.blips > 3, JSON.stringify(oj.after));
  check('one job: on a mission, no stranger\'s mark in the street or on the radar', oj.markNear >= 1 && oj.mission.on && oj.mission.marks === 0 && oj.mission.strangerBlips === 0, JSON.stringify({ near: oj.markNear, mission: oj.mission }));

  // ---------- 32: the title shots never fly into a building ----------
  // The opener slid sideways into a block 3s in and the downtown shot sat
  // inside a tower: the city grew round shots placed by hand. Walk each
  // cut's whole 13s drift: the lens out of every roof footprint, and
  // nothing solid in the first 25m toward what it looks at.
  var fi = await page.evaluate(function () {
    var C = GAME.city, cuts = GAME.attractCuts, bad = [];
    function solid(x, y, z) { return C.surfaceY(x, z) > y - 1.5; }
    for (var k = 0; k < cuts.length; k++) {
      var c = cuts[k];
      for (var t = 0; t <= 13; t += 0.5) {
        var p = [c.pos[0] + c.drift[0] * t, c.pos[1] + c.drift[1] * t, c.pos[2] + c.drift[2] * t];
        var dx = c.look[0] - p[0], dy = c.look[1] - p[1], dz = c.look[2] - p[2], d = Math.hypot(dx, dy, dz);
        for (var s = 0; s <= Math.min(d, 25); s += 0.5) {
          if (solid(p[0] + dx * s / d, p[1] + dy * s / d, p[2] + dz * s / d)) { bad.push({ cut: k, t: t, at: s }); t = 99; break; }
        }
      }
    }
    return { n: cuts.length, bad: bad };
  });
  check('first impression: every title shot keeps out of the buildings, clear ahead', fi.n >= 4 && fi.bad.length === 0, JSON.stringify(fi));

  // ---------- 33: the purchase card is over the shop ----------
  // The card for a car bought in the showroom came up BEHIND the shop's menu
  // (z 34 under 36), and Enter — the key that should shut it — went to the
  // list under it and opened another purchase's confirmation.
  var ct = await page.evaluate(function () {
    var r = {}, P = GAME.player, S = GAME.shops;
    GAME.police.clearWanted();
    if (P.inCar) GAME.exitCar();
    GAME.test.teleport(64, 384); GAME.test.fastForward(0.5);
    GAME.test.addCash(500000);
    S.open('showroom0');
    var ids = Object.keys(GAME.vehicles.TYPES);
    for (var i = 0; i < ids.length && !r.bought; i++) if (S.buy(ids[i])) r.bought = ids[i];
    r.shop = !!GAME.shopOpen; r.card = !!GAME.shareOpen;
    var cs = function (id) { return +getComputedStyle(document.getElementById(id)).zIndex; };
    r.zCard = cs('share-screen'); r.zShop = cs('shop-screen');
    var hit = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
    r.onTop = !!(hit && hit.closest('#share-screen'));
    var cash = P.cash;
    GAME.onKeyDown('KeyS'); GAME.onKeyDown('Enter');
    r.closed = !GAME.shareOpen;
    r.noConfirm = document.getElementById('shop-confirm').style.display !== 'flex';
    r.cashKept = P.cash === cash;
    S.close(); GAME.test.fastForward(0.2);
    return r;
  });
  check('card on top: a car bought in the showroom shows its card over the shop, where it can be seen and clicked', !!ct.bought && ct.shop && ct.card && ct.zCard > ct.zShop && ct.onTop, JSON.stringify(ct));
  check('card on top: Enter shuts the card and the list under it hears nothing', ct.closed && ct.noConfirm && ct.cashKept, JSON.stringify(ct));

  // ---------- 34: the melee slot is never empty ----------
  // The wheel's melee slot sat empty until you found or bought a blade, and
  // a hospital visit emptied it again. The bat is now part of what you
  // always have.
  var fw = await page.evaluate(function () {
    var r = {}, P = GAME.player;
    var kit = GAME.starterKit();
    r.kit = !!(kit.fist && kit.fist.have && kit.bat && kit.bat.have && kit.bat.ammo === 1);
    P.weapons = GAME.starterKit(); P.currentWeapon = 'fist';
    GAME.arsenal.openWheel();
    r.meleeShown = !document.getElementById('wheel-ring').children[1].classList.contains('empty');
    GAME.arsenal.closeWheel(false);
    // a saved knife holds the slot: no bat beside it
    var saved = localStorage.getItem('neonMayhemSave');
    var s = JSON.parse(saved || '{}'); s.loadout = { knife: 1 };
    localStorage.setItem('neonMayhemSave', JSON.stringify(s));
    P.weapons = GAME.starterKit(); loadSave();
    r.knifeLoad = !!P.weapons.knife && !P.weapons.bat;
    if (saved === null) localStorage.removeItem('neonMayhemSave'); else localStorage.setItem('neonMayhemSave', saved);
    // wasted with no home: the guns go, the bat stays
    P.weapons = GAME.starterKit(); P.currentWeapon = 'fist';
    r.homes0 = JSON.stringify(GAME.prefs.safehouses || null);
    GAME.prefs.safehouses = [];
    GAME.combat.giveWeapon('pistol', 30);
    GAME.police.clearWanted();
    GAME.playerWasted('test');
    GAME.test.fastForward(0.5);
    return r;
  });
  try {
    await page.evaluate(function () { GAME.input.keys['KeyR'] = true; GAME.test.fastForward(1.2); GAME.input.keys['KeyR'] = false; });
    await page.waitForFunction(function () { return GAME.player.state === 'alive'; }, null, { timeout: 10000 });
  } catch (e) { }
  fw.afterDeath = await page.evaluate(function (homes0) {
    var P = GAME.player;
    GAME.test.fastForward(0.5);
    var r = { alive: P.state === 'alive', bat: !!(P.weapons.bat && P.weapons.bat.have), pistol: !!(P.weapons.pistol && P.weapons.pistol.have) };
    GAME.prefs.safehouses = JSON.parse(homes0) || undefined;
    return r;
  }, fw.homes0);
  check('full wheel: the kit you always have is fists and a bat, and the wheel shows the bat', fw.kit && fw.meleeShown, JSON.stringify(fw));
  check('full wheel: a hospital visit takes the guns and leaves the bat', fw.afterDeath.alive && fw.afterDeath.bat && !fw.afterDeath.pistol, JSON.stringify(fw.afterDeath));
  check('full wheel: a saved knife holds the melee slot, no bat beside it', fw.knifeLoad, JSON.stringify(fw));

  // ---------- 35: a stranger shot on their spot stays down ----------
  // Killed, the next tick took them off their spot and — with you still in
  // range — put a fresh copy straight back on it, beside the body.
  var dd = await page.evaluate(function () {
    var r = {}, SG = GAME.strangers, ff = function (t) { GAME.test.fastForward(t); };
    var sg0 = SG.enabled, done0 = JSON.stringify(GAME.prefs.strangers || {});
    try {
      GAME.prefs.strangers = {};
      SG.enabled = true;
      var ray = SG.people().filter(function (q) { return q.def.id === 'ray'; })[0];
      GAME.test.teleport(ray.at.x + 30, ray.at.z); ff(1.5);
      var first = ray.ped;
      r.out = !!first;
      if (first) GAME.peds.kill(first, 'shot', true);
      ff(2);
      var near = GAME.world.peds.filter(function (q) { return q.stranger === 'ray' && !q.dead; }).length;
      r.notBack = !ray.ped && near === 0;
      GAME.police.clearWanted();
      // away and back: there again
      GAME.test.teleport(ray.at.x + 400, ray.at.z); ff(1.5);
      GAME.test.teleport(ray.at.x + 30, ray.at.z); ff(1.5);
      r.backLater = !!(ray.ped && !ray.ped.dead && ray.ped !== first);
    } finally {
      GAME.prefs.strangers = JSON.parse(done0);
      SG.reset(); SG.enabled = sg0;
      GAME.police.clearWanted();
      GAME.test.teleport(-60, 40); ff(0.5);
    }
    return r;
  });
  check('dead stay down: a stranger shot on their spot is not stood back up beside the body', dd.out && dd.notBack, JSON.stringify(dd));
  check('dead stay down: and they are back on it once you have been away', dd.backLater, JSON.stringify(dd));

  // ---------- 14: the broadphase survives a non-finite lookup ----------
  // Math.floor(±Infinity) is ±Infinity and i++ never moves off it, so the
  // cell loops spin forever and the frame loop stops dead. Every caller hands
  // these an entity position, so one bad number in the physics reaches them.
  // NaN was never the problem — NaN <= NaN is false, so those loops run zero
  // times. If this group times out, the guard is gone.
  var hash = null;
  try {
    hash = await withTimeout(page.evaluate(function () {
      var P = GAME.player, h = GAME.city.hash;
      return {
        normal: h.query(P.pos.x, P.pos.z, 60).length,
        infX: h.query(Infinity, P.pos.z, 10).length,
        negInfZ: h.query(P.pos.x, -Infinity, 10).length,
        nan: h.query(NaN, P.pos.z, 10).length,
        infR: h.query(P.pos.x, P.pos.z, Infinity).length,
        segFinite: h.segmentClear(P.pos.x, P.pos.z, P.pos.x + 0.1, P.pos.z + 0.1),
        segInf: h.segmentClear(P.pos.x, P.pos.z, Infinity, P.pos.z),
        segNan: h.segmentClear(P.pos.x, P.pos.z, NaN, P.pos.z)
      };
    }), 15000);
  } catch (e) { /* hung */ }
  check('broadphase: it answered at all (a timeout here means no guard)', !!hash);
  if (hash) {
    check('broadphase: an ordinary query still finds the city (anchor sanity)',
      hash.normal > 0, 'boxes=' + hash.normal);
    check('broadphase: an ordinary segment test still answers (anchor sanity)',
      typeof hash.segFinite === 'boolean', 'got=' + hash.segFinite);
    check('broadphase: an infinite coordinate returns nothing',
      hash.infX === 0 && hash.negInfZ === 0, '+x=' + hash.infX + ' -z=' + hash.negInfZ);
    check('broadphase: an infinite radius returns nothing', hash.infR === 0, 'boxes=' + hash.infR);
    check('broadphase: NaN returns nothing, as it always did', hash.nan === 0, 'boxes=' + hash.nan);
    check('broadphase: an infinite segment endpoint answers like a NaN one',
      hash.segInf === hash.segNan, 'inf=' + hash.segInf + ' nan=' + hash.segNan);
  }

  await browser.close();
  srv.close();
  if (failures.length) {
    console.log('\nREGRESSIONS: ' + failures.length + ' failure(s): ' + failures.join(', '));
    process.exit(1);
  }
  console.log('\nREGRESSIONS: all checks passed');
})().catch(function (e) { console.error('REGRESSIONS: runner crashed — ' + e.message); process.exit(1); });
