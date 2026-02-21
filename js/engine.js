// js/engine.js
'use strict';

function saveGame() {
    let s = Object.assign({}, G);
    s.ship = G.ship.serialize(); // convert grid to raw data
    localStorage.setItem('dc_txt_v2', JSON.stringify(s));
    printLog('Game saved.', 'sys');
}

function loadGame() {
    let d = localStorage.getItem('dc_txt_v2');
    if (!d) return false;
    G = JSON.parse(d);

    // Rehydrate ShipGrid
    let sg = new ShipGrid(G.ship.w, G.ship.h);
    sg.deserialize(G.ship);
    G.ship = sg;

    return true;
}

function die(reason) {
    printLog(reason, 'alert');
    printLog('Your journey has ended.', 'alert');
    G.state = 'Lost';
    updateUI();
    renderChoices([{ text: 'Return to Menu', cb: () => { location.reload(); } }]);
    localStorage.removeItem('dc_txt_v2');
}

function rollWind() {
    if (rr() < 0.2) G.windDir = (G.windDir + (rr() < 0.5 ? 1 : -1) + 8) % 8;
    G.windSpd = clamp(G.windSpd + (rr() - 0.5) * 10, 0, 45);
    G.baroT = clamp(G.baroT + (rr() - 0.5) * 10, 960, 1030);
    G.baro += (G.baroT - G.baro) * 0.2;

    let oldW = G.wx;
    if (G.windSpd > 35 || G.baro < 980) G.wx = 'Storm';
    else if (G.windSpd > 25) G.wx = 'Gale';
    else if (G.windSpd < 4) G.wx = 'Calm';
    else G.wx = 'Clear';

    if (oldW !== G.wx) {
        printLog(`The weather shifts. It is now a ${G.wx}.`, 'sys');
        updateAudioEnv();
    }
}

function tryEncounter() {
    for (let i = 0; i < G.islands.length; i++) {
        let isl = G.islands[i];
        let d = Math.hypot(isl.x - G.x, isl.y - G.y);
        if (d < 5 && !isl.found) {
            isl.found = true;
            G.curIsland = isl;
            if (!G.discovered) G.discovered = {};
            const key = `${Math.round(isl.x)},${Math.round(isl.y)}`;
            G.discovered[key] = { x: isl.x, y: isl.y, name: isl.name, pale: isl.pale };
            return 'island_approach';
        }
    }
    if (rr() < 0.15) {
        const pool = ['debris', 'derelict', 'omen'];
        if (G.wx === 'Calm') pool.push('madness');
        if (G.wx === 'Storm') return 'storm_event';
        return pool[rInt(pool.length)];
    }
    return null;
}

// The core loop. Async to allow UI typing effects.
async function advanceTime(hours) {
    disableUI();

    printLog(`*Time passes... (${hours} hours)*`, 'sys');
    if (!FX.run) initFX();
    if (!actx) initAudio();

    await wait(1000); // Latency

    let encounter = null;

    for (let h = 0; h < hours; h++) {
        G.hour++;
        if (G.hour >= 24) { G.hour = 0; G.day++; printLog(`*** Day ${G.day} ***`, 'sys'); }

        let st = G.ship.getStats();

        // Fatigue multiplier for actions
        let fatigue = 1.0;
        if (G.hp < 40) fatigue += 0.5;
        if (G.bilge > 70) fatigue += 0.3;

        // Resources
        let fcon = 0.1, wcon = 0.15;
        G.food -= fcon; G.water -= wcon;

        // Sanity management
        if (G.food <= 0 || G.water <= 0) {
            G.san -= 1;
            G.hp -= 2;
            if (h % 6 === 0) printLog('The hunger is becoming a physical weight.', 'alert');
        }
        if (G.wx === 'Storm') G.san -= 0.5;
        if (G.curIsland && G.curIsland.pale) G.san -= 1.0;

        G.san = clamp(G.san, 0, 100);
        G.hp = clamp(G.hp, 0, 100);

        if (h % 24 === 0) G.day++;
        G.hour = h % 24;
        playBell();

        // Trace trail on the map
        if (!G.trail) G.trail = [];
        G.trail.push({ x: G.x, y: G.y });
        if (G.trail.length > 200) G.trail.shift(); // Keep trail manageable

        // Fatigue multiplier for actions
        if (h % 2 === 0) rollWind();

        // Leaks & Pumps
        let leakRate = st.leakRate;
        if (G.wx === 'Storm') leakRate *= 2;

        let netBilge = leakRate - st.pumpRate;
        G.bilge = clamp(G.bilge + netBilge, 0, 100);

        if (G.bilge > 90) G.ship.takeDamage(2, false); // Water weight breaks things
        if (G.bilge >= 100) return die("The hull succumbs to the rising water. The sea reclaims her.");
        if (st.curHull <= 0) return die("The ship fractures completely. There is nothing left to float on.");

        // Movement
        if (G.state === 'Underway') {
            let wd = G.windDir;
            let hd = G.heading;
            let diff = Math.min((wd - hd + 8) % 8, (hd - wd + 8) % 8);

            let wMul = 1.0;
            if (diff === 0) wMul = 0.8;
            if (diff === 1) wMul = 1.0;
            if (diff === 2) wMul = 1.2;
            if (diff === 3) wMul = 0.5;
            if (diff === 4) wMul = 0.0;
            if (G.wx === 'Calm') wMul = 0;

            G.spd = (G.windSpd * wMul) * (st.sailPwr / st.wgt);
            if (G.bilge > 50) G.spd *= 0.7; // heavy with water

            let dist = G.spd * 1;
            let vec = DIR_V[hd];
            G.x += vec[0] * dist * 0.1;
            G.y += vec[1] * dist * 0.1;

            if (rr() < 0.1) playGull();

            // Sail damage in storms
            if (G.wx === 'Storm' && rr() < 0.3 && st.sailPwr > 0) {
                // Find a mast and damage it
                for (let c of G.ship.cells) {
                    if (c && BLOCKS[c.type].func === 'sail') {
                        c.hp -= 15;
                        if (c.hp <= 0) {
                            printLog('A mast snaps under the violent winds!', 'alert');
                            playCreak();
                        }
                        break;
                    }
                }
                if (h % 2 === 0) printLog('The winds tear at the canvas.', 'alert');
            }
        }

        if (G.state === 'Underway' && h === hours - 1) {
            encounter = tryEncounter();
        }
    }

    updateUI();
    enableUI();
    setScene(encounter || 'deck');
}

function initWorld(seed) {
    let rng = rr; // could seed later
    G.islands = [];
    for (let i = 0; i < 8; i++) {
        G.islands.push({
            name: I_NAMES[i % I_NAMES.length] + (i > 6 ? ' II' : ''),
            x: (rng() - 0.5) * 400,
            y: (rng() - 0.5) * 400,
            found: false,
            scavenged: false,
            pale: rng() < 0.2
        });
    }
}
