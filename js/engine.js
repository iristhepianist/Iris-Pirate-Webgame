// js/engine.js
'use strict';

// Debug logging system
const DEBUG_LEVEL = {
    NONE: 0,
    ERROR: 1,
    WARN: 2,
    INFO: 3,
    DEBUG: 4,
    TRACE: 5
};

const CURRENT_LOG_LEVEL = DEBUG_LEVEL.DEBUG; // Set to desired level

function log(level, message, data = null) {
    if (level > CURRENT_LOG_LEVEL) return;

    const timestamp = new Date().toISOString().substr(11, 8);
    const levelStr = Object.keys(DEBUG_LEVEL)[level].padEnd(5);
    const prefix = `[${timestamp}] [${levelStr}] ENGINE:`;

    if (data) {
        console.log(`${prefix} ${message}`, data);
    } else {
        console.log(`${prefix} ${message}`);
    }
}

// Resource change logging utility
function logResourceChange(resourceType, oldValue, newValue, reason = '') {
    const change = newValue - oldValue;
    const changeStr = change > 0 ? `+${change}` : change.toString();
    const level = Math.abs(change) >= 10 ? DEBUG_LEVEL.INFO :
        Math.abs(change) >= 5 ? DEBUG_LEVEL.DEBUG : DEBUG_LEVEL.TRACE;

    const reasonStr = reason ? ` (${reason})` : '';
    log(level, `${resourceType}: ${oldValue} -> ${newValue} (${changeStr})${reasonStr}`);

    // Warn on critical resource levels
    if (resourceType === 'food' && newValue <= 5) {
        log(DEBUG_LEVEL.WARN, `Critical food level: ${newValue}`);
    }
    if (resourceType === 'water' && newValue <= 5) {
        log(DEBUG_LEVEL.WARN, `Critical water level: ${newValue}`);
    }
    if (resourceType === 'hp' && newValue <= 20) {
        log(DEBUG_LEVEL.WARN, `Critical health level: ${newValue}`);
    }
    if (resourceType === 'san' && newValue <= 30) {
        log(DEBUG_LEVEL.WARN, `Critical sanity level: ${newValue}`);
    }
    if (resourceType === 'morale' && newValue <= 20) {
        log(DEBUG_LEVEL.WARN, `Critical morale level: ${newValue}`);
    }
    if (resourceType === 'bilge' && newValue >= 80) {
        log(DEBUG_LEVEL.WARN, `Critical bilge level: ${newValue}%`);
    }
}

function ensureWorldState() {
    //log(DEBUG_LEVEL.DEBUG, 'ensureWorldState() called');

    const beforeState = {
        hasWorldSeed: typeof G.worldSeed === 'number',
        hasSeed: typeof G.seed === 'number',
        worldSeed: G.worldSeed,
        seed: G.seed
    };

    if (typeof G.worldSeed !== 'number') {
        const oldSeed = G.seed;
        G.worldSeed = typeof G.seed === 'number' ? G.seed : 42;
        //log(DEBUG_LEVEL.INFO, `Initialized worldSeed from seed (${oldSeed}) -> ${G.worldSeed}`);
    }
    G.seed = G.worldSeed; // backward compatibility with older saves

    //log(DEBUG_LEVEL.TRACE, 'Checking and initializing game state objects');
    if (!G.chunkCache) {
        G.chunkCache = {};
        //log(DEBUG_LEVEL.DEBUG, 'Initialized chunkCache');
    }
    if (!G.islandState) {
        G.islandState = {};
        //log(DEBUG_LEVEL.DEBUG, 'Initialized islandState');
    }
    if (!G.scavengedIslands) {
        G.scavengedIslands = {};
        //log(DEBUG_LEVEL.DEBUG, 'Initialized scavengedIslands');
    }
    if (!G.lootedIslands) {
        G.lootedIslands = {};
        //log(DEBUG_LEVEL.DEBUG, 'Initialized lootedIslands');
    }
    if (!G.chartMarks) {
        G.chartMarks = {};
        //log(DEBUG_LEVEL.DEBUG, 'Initialized chartMarks');
    }
    if (!G.discovered) {
        G.discovered = {};
        //log(DEBUG_LEVEL.DEBUG, 'Initialized discovered');
    }
    if (!G.fogCleared) {
        G.fogCleared = {};
        //log(DEBUG_LEVEL.DEBUG, 'Initialized fogCleared');
    }
    if (!G.trail) {
        G.trail = [];
        //log(DEBUG_LEVEL.DEBUG, 'Initialized trail');
    }
    if (!Array.isArray(G.explored)) {
        G.explored = [];
        //log(DEBUG_LEVEL.DEBUG, 'Initialized explored array');
    }
    if (!Array.isArray(G.rumors)) {
        G.rumors = [];
        //log(DEBUG_LEVEL.DEBUG, 'Initialized rumors array');
        log(DEBUG_LEVEL.DEBUG, 'Initialized rumors array');
    }

    //log(DEBUG_LEVEL.TRACE, 'Checking and initializing numeric values');
    if (typeof G.navError !== 'number') {
        const oldNavError = G.navError;
        G.navError = 2;
        //log(DEBUG_LEVEL.DEBUG, `Initialized navError: ${oldNavError} -> ${G.navError}`);
    }
    if (!G.tutorialPhase) {
        G.tutorialPhase = 'start';
        //log(DEBUG_LEVEL.DEBUG, 'Initialized tutorialPhase to start');
    }
    if (typeof G.foodQ !== 'number') {
        const oldFoodQ = G.foodQ;
        G.foodQ = 100;
        //log(DEBUG_LEVEL.DEBUG, `Initialized foodQ: ${oldFoodQ} -> ${G.foodQ}`);
    }
    if (typeof G.waterQ !== 'number') {
        const oldWaterQ = G.waterQ;
        G.waterQ = 100;
        //log(DEBUG_LEVEL.DEBUG, `Initialized waterQ: ${oldWaterQ} -> ${G.waterQ}`);
    }
    if (typeof G.ropeWear !== 'number') {
        const oldRopeWear = G.ropeWear;
        G.ropeWear = 0;
        //log(DEBUG_LEVEL.DEBUG, `Initialized ropeWear: ${oldRopeWear} -> ${G.ropeWear}`);
    }
    if (typeof G.morale !== 'number') {
        const oldMorale = G.morale;
        G.morale = 70;
        //log(DEBUG_LEVEL.DEBUG, `Initialized morale: ${oldMorale} -> ${G.morale}`);
    }
    // Migrate legacy food/water to new system
    if (typeof G.food === 'number') {
        G.foodStocks = G.foodStocks || { salt: 0, fresh: 0, citrus: 0 };
        G.foodStocks.salt += G.food;
        delete G.food;
        //log(DEBUG_LEVEL.INFO, `Migrated legacy food (${G.foodStocks.salt} days salt rations)`);
    }
    if (typeof G.water === 'number') {
        G.waterStocks = G.waterStocks || { fresh: 0, rain: 0, distilled: 0, exotic: 0 };
        G.waterStocks.fresh += G.water;
        delete G.water;
        //log(DEBUG_LEVEL.INFO, `Migrated legacy water (${G.waterStocks.fresh} days fresh water)`);
    }

    // Initialize new state objects
    if (!G.foodStocks) {
        G.foodStocks = { salt: 20, fresh: 0, citrus: 0 };
        //log(DEBUG_LEVEL.DEBUG, 'Initialized foodStocks');
    }
    if (!G.waterStocks) {
        G.waterStocks = { fresh: 10, rain: 0, distilled: 0, exotic: 0 };
        //log(DEBUG_LEVEL.DEBUG, 'Initialized waterStocks');
    }
    if (typeof G.scurvy !== 'number') {
        G.scurvy = 0;
        //log(DEBUG_LEVEL.DEBUG, 'Initialized scurvy level');
    }

    // Save migration for legacy tutorial data.
    //log(DEBUG_LEVEL.TRACE, 'Handling legacy tutorial data migration');
    if (!G.tutorialIsland) {
        G.tutorialIsland = {
            id: 'tutorial:tern-rock',
            x: 0,
            y: -10,
            name: 'Tern Rock (Tutorial)',
            pale: false,
            found: false,
            scavenged: false
        };
        //log(DEBUG_LEVEL.INFO, 'Created default tutorial island');
    }
    if (!G.tutorialIsland.id) {
        G.tutorialIsland.id = 'tutorial:tern-rock';
        //log(DEBUG_LEVEL.DEBUG, 'Set tutorial island ID');
    }
    if (G.discovered['0,-10'] && !G.discovered['tutorial:tern-rock']) {
        const legacy = G.discovered['0,-10'];
        G.discovered['tutorial:tern-rock'] = Object.assign({ id: 'tutorial:tern-rock' }, legacy);
        //log(DEBUG_LEVEL.INFO, 'Migrated legacy tutorial discovery data');
    }

    //log(DEBUG_LEVEL.TRACE, 'Synchronizing discovered islands with state');
    for (const k in G.discovered) {
        const d = G.discovered[k];
        if (d && d.id && !G.islandState[d.id]) {
            G.islandState[d.id] = { found: !!d.found, scavenged: !!d.scavenged };
            //log(DEBUG_LEVEL.DEBUG, `Added island state for ${d.id}: found=${!!d.found}, scavenged=${!!d.scavenged}`);
        }
        if (d && d.id && !G.chartMarks[d.id]) {
            G.chartMarks[d.id] = {
                id: d.id,
                name: d.name,
                pale: !!d.pale,
                estX: d.x,
                estY: d.y,
                error: clamp((G.navError || 2) + 6, 4, 26),
                scavenged: !!d.scavenged,
                confirmed: true
            };
            //log(DEBUG_LEVEL.DEBUG, `Created chart mark for ${d.id} at (${d.x.toFixed(1)}, ${d.y.toFixed(1)}), error: ${clamp((G.navError || 2) + 6, 4, 26)}`);
        }
    }

    if (G.tutorialIsland && G.tutorialIsland.id && !G.islandState[G.tutorialIsland.id]) {
        G.islandState[G.tutorialIsland.id] = {
            found: !!G.tutorialIsland.found,
            scavenged: !!G.tutorialIsland.scavenged
        };
        //log(DEBUG_LEVEL.DEBUG, `Added tutorial island state: found=${!!G.tutorialIsland.found}, scavenged=${!!G.tutorialIsland.scavenged}`);
    } else if (G.tutorialIsland && G.tutorialIsland.id) {
        const st = G.islandState[G.tutorialIsland.id];
        if (st) {
            const oldFound = G.tutorialIsland.found;
            const oldScavenged = G.tutorialIsland.scavenged;
            G.tutorialIsland.found = G.tutorialIsland.found || !!st.found;
            G.tutorialIsland.scavenged = G.tutorialIsland.scavenged || !!st.scavenged;
            if (G.tutorialIsland.found !== oldFound || G.tutorialIsland.scavenged !== oldScavenged) {
                //log(DEBUG_LEVEL.DEBUG, `Updated tutorial island: found=${oldFound}->${G.tutorialIsland.found}, scavenged=${oldScavenged}->${G.tutorialIsland.scavenged}`);
            }
        }
    }

    if (G.tutorialIsland && G.tutorialIsland.found && G.tutorialPhase !== 'complete') {
        const oldPhase = G.tutorialPhase;
        G.tutorialPhase = 'complete';
        log(DEBUG_LEVEL.INFO, `Tutorial phase completed: ${oldPhase} -> complete`);
    }

    //log(DEBUG_LEVEL.DEBUG, 'ensureWorldState() completed successfully');
    log(DEBUG_LEVEL.DEBUG, 'ensureWorldState() completed successfully');
}

function updateChartMark(island, st) {
    if (!island || !island.id) {
        log(DEBUG_LEVEL.WARN, 'updateChartMark called with invalid island', island);
        return;
    }
    if (!G.chartMarks) G.chartMarks = {};

    log(DEBUG_LEVEL.DEBUG, `Updating chart mark for island: ${island.id} (${island.name})`);

    const seed = G.worldSeed || G.seed || 1;
    const baseErr = clamp((G.navError || 2) + 6, 4, 26);
    const hX = (hash01(Math.round(island.x), Math.round(island.y), seed, 301) - 0.5) * baseErr * 2;
    const hY = (hash01(Math.round(island.y), Math.round(island.x), seed, 302) - 0.5) * baseErr * 2;

    log(DEBUG_LEVEL.TRACE, `Calculated navigation error: baseErr=${baseErr}, drift=(${hX.toFixed(2)}, ${hY.toFixed(2)})`);

    let mark = G.chartMarks[island.id];
    if (!mark) {
        mark = {
            id: island.id,
            name: island.name,
            pale: !!island.pale,
            estX: island.x + hX,
            estY: island.y + hY,
            error: baseErr,
            scavenged: !!(st && st.scavenged),
            confirmed: false
        };
        log(DEBUG_LEVEL.INFO, `Created new chart mark for ${island.id} at estimated position (${mark.estX.toFixed(1)}, ${mark.estY.toFixed(1)}), error: ${baseErr}`);
    } else {
        const oldEstX = mark.estX;
        const oldEstY = mark.estY;
        const oldError = mark.error || 4;

        mark.name = island.name;
        mark.pale = !!island.pale;
        mark.scavenged = !!(st && st.scavenged);
        mark.estX += (island.x - mark.estX) * 0.35;
        mark.estY += (island.y - mark.estY) * 0.35;
        mark.error = Math.max(2, (mark.error || 4) * 0.7);

        log(DEBUG_LEVEL.DEBUG, `Updated chart mark for ${island.id}: position (${oldEstX.toFixed(1)}, ${oldEstY.toFixed(1)}) -> (${mark.estX.toFixed(1)}, ${mark.estY.toFixed(1)}), error ${oldError} -> ${mark.error.toFixed(1)}`);
    }

    if (st && (st.scavenged || st.found)) {
        const wasConfirmed = mark.confirmed;
        mark.confirmed = true;
        if (!wasConfirmed) {
            log(DEBUG_LEVEL.INFO, `Chart mark for ${island.id} confirmed (island ${st.scavenged ? 'scavenged' : 'found'})`);
        }
    }

    G.chartMarks[island.id] = mark;
}

function estimatedPos() {
    const seed = G.worldSeed || G.seed || 1;
    const drift = Math.max(0, G.navError || 0);
    const tick = Math.floor((((G.day || 1) * 24) + (G.hour || 0)) / 4);
    const ox = (hash01(tick, 11, seed, 401) - 0.5) * drift * 2;
    const oy = (hash01(tick, 17, seed, 402) - 0.5) * drift * 2;
    const result = { x: (G.x || 0) + ox, y: (G.y || 0) + oy, drift };

    log(DEBUG_LEVEL.TRACE, `Calculated estimated position: tick=${tick}, drift=${drift}, offset=(${ox.toFixed(2)}, ${oy.toFixed(2)}), final=(${result.x.toFixed(1)}, ${result.y.toFixed(1)})`);

    return result;
}

function addChartNote(label) {
    if (!G.chartMarks) G.chartMarks = {};
    const pos = estimatedPos();
    const id = `note:${G.day}:${G.hour}:${Object.keys(G.chartMarks).length}`;

    G.chartMarks[id] = {
        id,
        name: label || 'Note',
        pale: false,
        estX: pos.x,
        estY: pos.y,
        error: clamp((G.navError || 2) + 6, 4, 30),
        confirmed: false
    };

    log(DEBUG_LEVEL.INFO, `Added chart note "${label || 'Note'}" at estimated position (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}), error: ${G.chartMarks[id].error}`);
}

function revealFogAt(x, y, radius = WORLD.fogRevealRadius) {
    ensureWorldState();

    log(DEBUG_LEVEL.DEBUG, `Revealing fog at (${x.toFixed(1)}, ${y.toFixed(1)}) with radius ${radius}`);

    const cs = WORLD.fogCellSize;
    const minX = Math.floor((x - radius) / cs);
    const maxX = Math.floor((x + radius) / cs);
    const minY = Math.floor((y - radius) / cs);
    const maxY = Math.floor((y + radius) / cs);
    const r2 = radius * radius;

    log(DEBUG_LEVEL.TRACE, `Fog reveal bounds: x=[${minX}, ${maxX}], y=[${minY}, ${maxY}], cells: ${(maxX - minX + 1) * (maxY - minY + 1)}`);

    let revealedCells = 0;
    for (let gx = minX; gx <= maxX; gx++) {
        for (let gy = minY; gy <= maxY; gy++) {
            const cx = (gx + 0.5) * cs;
            const cy = (gy + 0.5) * cs;
            const dx = cx - x;
            const dy = cy - y;
            if ((dx * dx + dy * dy) <= r2) {
                const key = chunkKey(gx, gy);
                if (!G.fogCleared[key]) {
                    G.fogCleared[key] = 1;
                    revealedCells++;
                }
            }
        }
    }

    log(DEBUG_LEVEL.DEBUG, `Revealed ${revealedCells} fog cells`);

    const last = G.explored[G.explored.length - 1];
    if (!last || Math.hypot(x - last.x, y - last.y) >= WORLD.fogRevealRadius * 0.5) {
        G.explored.push({ x, y });
        log(DEBUG_LEVEL.DEBUG, `Added exploration point (${x.toFixed(1)}, ${y.toFixed(1)}), total explored points: ${G.explored.length}`);

        if (G.explored.length > 600) {
            const removed = G.explored.shift();
            log(DEBUG_LEVEL.DEBUG, `Pruned old exploration point (${removed.x.toFixed(1)}, ${removed.y.toFixed(1)}), keeping ${G.explored.length} points`);
        }
    }
}

function islandDisplayName(cx, cy, i) {
    const idx = Math.floor(hash01(cx, cy, G.worldSeed, 20 + i) * I_NAMES.length) % I_NAMES.length;
    const base = I_NAMES[idx];
    const result = hash01(cx, cy, G.worldSeed, 50 + i) > 0.93 ? `${base} II` : base;

    log(DEBUG_LEVEL.TRACE, `Generated island name for chunk (${cx}, ${cy}), island ${i}: ${result} (base: ${base}, idx: ${idx})`);

    return result;
}

function buildIsland(cx, cy, i) {
    log(DEBUG_LEVEL.TRACE, `Building island ${i} in chunk (${cx}, ${cy})`);

    const margin = WORLD.chunkSize * 0.12;
    const span = WORLD.chunkSize - margin * 2;

    const x = cx * WORLD.chunkSize + margin + hash01(cx, cy, G.worldSeed, 70 + i * 2) * span;
    const y = cy * WORLD.chunkSize + margin + hash01(cx, cy, G.worldSeed, 71 + i * 2) * span;

    const id = islandId(cx, cy, i);
    const st = G.islandState[id] || { found: false, scavenged: false };
    G.islandState[id] = st;

    const pale = hash01(cx, cy, G.worldSeed, 90 + i) < 0.2;
    const port = hash01(cx, cy, G.worldSeed, 120 + i) < 0.18;

    const island = {
        id,
        name: islandDisplayName(cx, cy, i),
        x,
        y,
        pale,
        port,
        found: !!st.found,
        scavenged: !!st.scavenged
    };

    log(DEBUG_LEVEL.DEBUG, `Built island ${id} "${island.name}" at (${x.toFixed(1)}, ${y.toFixed(1)}), pale: ${pale}, port: ${port}, found: ${island.found}, scavenged: ${island.scavenged}`);

    return island;
}

function islandsForChunk(cx, cy) {
    ensureWorldState();

    const key = chunkKey(cx, cy);
    if (G.chunkCache[key]) {
        log(DEBUG_LEVEL.TRACE, `Returning cached islands for chunk ${key}: ${G.chunkCache[key].length} islands`);
        return G.chunkCache[key];
    }

    log(DEBUG_LEVEL.DEBUG, `Generating islands for chunk ${key}`);

    const islands = [];
    if (hash01(cx, cy, G.worldSeed, 1) < WORLD.islandChance) {
        const count = 1 + Math.floor(hash01(cx, cy, G.worldSeed, 2) * WORLD.maxIslandsPerChunk);
        log(DEBUG_LEVEL.DEBUG, `Chunk ${key} will have ${count} islands (chance passed)`);

        for (let i = 0; i < count; i++) {
            islands.push(buildIsland(cx, cy, i));
        }
    } else {
        log(DEBUG_LEVEL.TRACE, `Chunk ${key} has no islands (chance failed)`);
    }

    G.chunkCache[key] = islands;
    log(DEBUG_LEVEL.DEBUG, `Cached ${islands.length} islands for chunk ${key}`);

    return islands;
}

function islandsNear(x, y, worldRadius = WORLD.chunkSize * 1.5) {
    ensureWorldState();

    log(DEBUG_LEVEL.DEBUG, `Finding islands near (${x.toFixed(1)}, ${y.toFixed(1)}) with radius ${worldRadius}`);

    const center = getChunkCoord(x, y);
    const chunkRadius = Math.ceil(worldRadius / WORLD.chunkSize);
    const out = [];

    log(DEBUG_LEVEL.TRACE, `Searching chunks in radius ${chunkRadius} around (${center.cx}, ${center.cy})`);

    for (let dx = -chunkRadius; dx <= chunkRadius; dx++) {
        for (let dy = -chunkRadius; dy <= chunkRadius; dy++) {
            const list = islandsForChunk(center.cx + dx, center.cy + dy);
            for (const isl of list) out.push(isl);
        }
    }

    if (G.tutorialIsland && G.tutorialPhase !== 'complete') {
        out.push(G.tutorialIsland);
        log(DEBUG_LEVEL.TRACE, 'Added tutorial island to nearby islands list');
    }

    log(DEBUG_LEVEL.DEBUG, `Found ${out.length} islands near position`);

    return out;
}

function commitIslandState(island) {
    if (!island || !island.id) {
        log(DEBUG_LEVEL.WARN, 'commitIslandState called with invalid island', island);
        return;
    }

    ensureWorldState();

    const oldState = G.islandState[island.id] || { found: false, scavenged: false };
    const newState = { found: !!island.found, scavenged: !!island.scavenged };

    log(DEBUG_LEVEL.DEBUG, `Committing state for island ${island.id}: found ${oldState.found} -> ${newState.found}, scavenged ${oldState.scavenged} -> ${newState.scavenged}`);

    G.islandState[island.id] = newState;

    if (island.id === 'tutorial:tern-rock' && G.tutorialIsland) {
        G.tutorialIsland.found = newState.found;
        G.tutorialIsland.scavenged = newState.scavenged;
        log(DEBUG_LEVEL.DEBUG, 'Updated tutorial island state');
    }

    if (newState.found) {
        const discoveryData = {
            id: island.id,
            x: island.x,
            y: island.y,
            name: island.name,
            pale: island.pale,
            port: !!island.port,
            scavenged: newState.scavenged,
            found: true
        };

        if (!G.discovered[island.id]) {
            log(DEBUG_LEVEL.INFO, `Island ${island.id} "${island.name}" discovered at (${island.x.toFixed(1)}, ${island.y.toFixed(1)})`);
        }
        G.discovered[island.id] = discoveryData;
    }

    updateChartMark(island, newState);

    if (newState.scavenged && typeof island.x === 'number' && typeof island.y === 'number') {
        const coordKey = `${Math.round(island.x)},${Math.round(island.y)}`;
        G.scavengedIslands[coordKey] = true;
        log(DEBUG_LEVEL.DEBUG, `Marked coordinate (${Math.round(island.x)}, ${Math.round(island.y)}) as scavenged`);
    }

    if (island.id) {
        if (!G.lootedIslands) G.lootedIslands = {};
        G.lootedIslands[island.id] = !!newState.scavenged;
    }
}

function addRumor(mark) {
    if (!mark || !mark.id) {
        log(DEBUG_LEVEL.WARN, 'addRumor called with invalid mark', mark);
        return;
    }

    if (!G.rumors) G.rumors = [];

    if (G.rumors.length > 8) {
        const removed = G.rumors.shift();
        log(DEBUG_LEVEL.DEBUG, `Pruned old rumor about ${removed.name}, keeping 8 rumors`);
    }

    const rumor = {
        id: mark.id,
        name: mark.name,
        estX: mark.estX,
        estY: mark.estY,
        error: mark.error,
        when: `${G.day}:${G.hour}`
    };

    G.rumors.push(rumor);
    log(DEBUG_LEVEL.INFO, `Added rumor about "${mark.name}" at estimated (${mark.estX.toFixed(1)}, ${mark.estY.toFixed(1)}), error: ${mark.error}`);
}

function generateRumor() {
    ensureWorldState();

    log(DEBUG_LEVEL.DEBUG, 'Generating new rumor');

    const base = getChunkCoord(G.x, G.y);
    const dx = 2 + rInt(4);
    const dy = 2 + rInt(4);
    const cx = base.cx + (rr() < 0.5 ? -dx : dx);
    const cy = base.cy + (rr() < 0.5 ? -dy : dy);

    log(DEBUG_LEVEL.TRACE, `Rumor generation: base chunk (${base.cx}, ${base.cy}), target chunk (${cx}, ${cy}), distance: ${Math.hypot(cx - base.cx, cy - base.cy)} chunks`);

    const islands = islandsForChunk(cx, cy);
    if (!islands.length) {
        log(DEBUG_LEVEL.DEBUG, 'No islands found in target chunk, no rumor generated');
        return null;
    }

    const pick = islands[rInt(islands.length)];
    log(DEBUG_LEVEL.INFO, `Generated rumor about island "${pick.name}" in chunk (${cx}, ${cy})`);

    return pick;
}

function saveGame() {
    log(DEBUG_LEVEL.INFO, 'Saving game...');

    let s = Object.assign({}, G);
    s.ship = G.ship.serialize(); // convert grid to raw data
    delete s.chunkCache; // deterministic; regenerate on load to keep saves compact

    const saveData = JSON.stringify(s);
    localStorage.setItem('dc_txt_v2', saveData);

    log(DEBUG_LEVEL.INFO, `Game saved successfully (${saveData.length} characters)`);

    printLog('Game saved.', 'sys');
}

function loadGame() {
    log(DEBUG_LEVEL.INFO, 'Loading game...');

    let d = localStorage.getItem('dc_txt_v2');
    if (!d) {
        log(DEBUG_LEVEL.WARN, 'No save data found in localStorage');
        return false;
    }

    try {
        G = JSON.parse(d);
        log(DEBUG_LEVEL.DEBUG, 'Game data parsed from localStorage');

        // Reconstruct ship from saved data
        if (G.ship) {
            const ship = new ShipGrid(G.ship.w, G.ship.h);
            ship.cells = G.ship.cells;
            G.ship = ship;
            log(DEBUG_LEVEL.DEBUG, `Reconstructed ship grid (${G.ship.w}x${G.ship.h})`);
        }

        ensureWorldState();
        log(DEBUG_LEVEL.INFO, 'Game loaded successfully');

        checkAudio();
        printLog('You return to the nightmare.', 'normal');
        setScene('deck');

        return true;
    } catch (error) {
        log(DEBUG_LEVEL.ERROR, 'Failed to load game data', error);
        // Reset to new game on load failure
        G.state = 'Lost';
        updateUI();
        renderChoices([{ text: 'Return to Menu', cb: () => { location.reload(); } }]);
        localStorage.removeItem('dc_txt_v2');
        printLog('Save data corrupted. Starting new game.', 'alert');
        return false;
    }
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
    G.beaufort = Math.min(12, Math.floor((G.windSpd + 1) / 5));
    G.seaState = G.beaufort >= 8 ? 'Very Rough' : G.beaufort >= 6 ? 'Rough' : G.beaufort >= 4 ? 'Moderate' : G.beaufort >= 2 ? 'Slight' : 'Calm';
    if (G.windSpd > 35 || G.baro < 980) G.wx = 'Storm';
    else if (G.windSpd > 25) G.wx = 'Gale';
    else if (G.windSpd < 4) G.wx = 'Calm';
    else G.wx = 'Clear';

    if (oldW !== G.wx) {
        printLog(`The weather shifts. It is now a ${G.wx}.`, 'sys');
        updateAudioEnv();
    }
}

function getDirection(x1, y1, x2, y2) {
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    const d = (Math.round((angle + 90) / 45) + 8) % 8;
    return DIRS[d];
}

function tryEncounter(isHourly) {
    ensureWorldState();

    let nearHit = null;
    let nearDist = Infinity;
    const isNight = (G.hour >= 20 || G.hour <= 3);

    const islands = islandsNear(G.x, G.y);
    for (const isl of islands) {
        if (isl.id && G.islandState[isl.id]) {
            isl.found = !!G.islandState[isl.id].found;
            isl.scavenged = !!G.islandState[isl.id].scavenged;
        }
        const d = Math.hypot(isl.x - G.x, isl.y - G.y);

        // Discovery Check
        if (!isl.found && d < WORLD.encounterRadius && d < nearDist) {
            nearHit = isl;
            nearDist = d;
        } else if (isl.found && d < WORLD.encounterRadius && G.state === 'Underway') {
            // Re-approach an island we already found
            G.curIsland = isl;
            return 'island_approach';
        } else if (!isl.found && d < WORLD.sightingRadius && rr() < 0.05) {
            printLog(`A dark shape breaks the horizon to the ${getDirection(G.x, G.y, isl.x, isl.y)}.`, 'sys');
        }
    }

    if (nearHit) {
        nearHit.found = true;
        commitIslandState(nearHit);
        G.navError = clamp((G.navError || 2) - 3, 1, 40);
        G.curIsland = nearHit;
        return 'island_approach';
    }

    if (G.noEncounters) return null; // Block random events only AFTER island checks

    if (isNight && rr() < 0.05) return 'night_reef';
    if (G.calmHours > 24 && rr() < 0.2) return 'doldrums';
    if (!isHourly && rr() < 0.1) {
        const pool = ['debris', 'derelict', 'omen'];
        if (G.wx === 'Calm') pool.push('madness');
        if (G.wx === 'Storm') return 'storm_event';
        return pool[rInt(pool.length)];
    }

    return null;
}

// The core loop. Async to allow UI typing effects.
async function advanceTime(hours, skipSceneChange = false) {
    disableUI();

    printLog(`*Time passes... (${hours} hours)*`, 'sys');
    if (!FX.run) initFX();
    if (!actx) initAudio();

    await wait(1000); // Latency

    let encounter = null;

    for (let h = 0; h < hours; h++) {
        G.hour = (G.hour + 1) % 24;
        if (G.hour === 0) {
            G.day++;
            printLog(`*** Day ${G.day} ***`, 'sys');
        }

        let st = G.ship.getStats();

        // Food and water consumption, spoilage, and effects
        // Consume 1 day of food and water per day
        let consumedFood = { salt: 0, fresh: 0, citrus: 0 };
        let consumedWater = { fresh: 0, rain: 0, distilled: 0, exotic: 0 };

        // Food consumption: prioritize citrus, then fresh, then salt
        let foodNeeded = 1 / 24; // 1 day worth lasts 24 hours
        for (let type of ['citrus', 'fresh', 'salt']) {
            if (foodNeeded > 0 && G.foodStocks[type] > 0) {
                let consume = Math.min(foodNeeded, G.foodStocks[type]);
                consumedFood[type] = consume;
                G.foodStocks[type] -= consume;
                foodNeeded -= consume;
            }
        }

        // Water consumption: prioritize fresh, then exotic, then rain, then distilled
        let waterNeeded = 1 / 24; // 1 day worth lasts 24 hours
        for (let type of ['fresh', 'exotic', 'rain', 'distilled']) {
            if (waterNeeded > 0 && G.waterStocks[type] > 0) {
                let consume = Math.min(waterNeeded, G.waterStocks[type]);
                consumedWater[type] = consume;
                G.waterStocks[type] -= consume;
                waterNeeded -= consume;
            }
        }

        // Scurvy progression
        let scurvyChange = 0;
        for (let type in consumedFood) {
            scurvyChange += consumedFood[type] * FOOD_TYPES[type].scurvyRate;
        }
        G.scurvy = clamp(G.scurvy + scurvyChange, 0, 100);

        // Morale effects from food and water
        for (let type in consumedFood) {
            if (consumedFood[type] > 0) {
                G.morale = clamp(G.morale + FOOD_TYPES[type].moraleEffect * consumedFood[type], 0, 100);
            }
        }
        for (let type in consumedWater) {
            if (consumedWater[type] > 0) {
                G.morale = clamp(G.morale + WATER_TYPES[type].moraleEffect * consumedWater[type], 0, 100);
            }
        }

        // Food spoilage
        for (let type in G.foodStocks) {
            let spoilAmount = FOOD_TYPES[type].spoilRate;
            // Increase spoilage in heat or bilge
            const heat = G.wx === 'Calm' ? 1.2 : G.wx === 'Storm' ? 0.6 : 0.9;
            const bilgeSpoil = clamp(G.bilge / 100, 0, 1);
            spoilAmount *= (1 + 0.1 * heat + 0.2 * bilgeSpoil);
            G.foodStocks[type] = Math.max(0, G.foodStocks[type] - spoilAmount);
        }

        // Water spoilage (minimal)
        for (let type in G.waterStocks) {
            G.waterStocks[type] = Math.max(0, G.waterStocks[type] - WATER_TYPES[type].spoilRate);
        }

        // Starvation mechanics - severe penalties when completely out of food/water
        if (foodNeeded > 0 || waterNeeded > 0) {
            // Starvation effects are much worse than scurvy
            G.hp = clamp(G.hp - 5, 0, 100); // Severe health loss
            G.san = clamp(G.san - 3, 0, 100); // Mental breakdown
            G.morale = clamp(G.morale - 3, 0, 100); // Despair
            if (h % 6 === 0) {
                if (foodNeeded > 0 && waterNeeded > 0) {
                    printLog('Starvation and dehydration wrack your body. You cannot work.', 'alert');
                } else if (foodNeeded > 0) {
                    printLog('Hunger consumes you. Your strength fails.', 'alert');
                } else {
                    printLog('Thirst burns through you. Your mind wanders.', 'alert');
                }
            }
        }

        // Scurvy effects
        if (G.scurvy > 10) {
            G.hp = clamp(G.hp - 1, 0, 100); // Fatigue
            G.morale = clamp(G.morale - 1, 0, 100);
        }
        if (G.scurvy > 30) {
            G.hp = clamp(G.hp - 2, 0, 100); // Wounds don't heal
            G.san = clamp(G.san - 1, 0, 100);
        }
        if (G.scurvy > 50) {
            G.hp = clamp(G.hp - 3, 0, 100); // Gums
            G.san = clamp(G.san - 2, 0, 100);
        }
        if (G.scurvy > 70) {
            // Can't stand watch
            G.hp = clamp(G.hp - 4, 0, 100);
            G.san = clamp(G.san - 3, 0, 100);
            if (h % 6 === 0) printLog('The scurvy has you bedridden. You cannot work the ship.', 'alert');
        }

        if (G.wx === 'Storm') G.san -= 0.5;
        if (G.curIsland && G.curIsland.pale) G.san -= 1.0;
        if (G.wx === 'Calm') G.morale = clamp(G.morale - 0.2, 0, 100);
        if (G.wx !== 'Calm') G.calmHours = 0; else G.calmHours += 1;
        if (G.calmHours > 18 && rr() < 0.15) {
            printLog('The calm is a lid on the world. The silence is heavy. Water feels heavier.', 'alert');
            G.morale = clamp(G.morale - 2, 0, 100);
        }
        const isNight = (G.hour >= 20 || G.hour <= 3);
        if (isNight && rr() < 0.05) {
            printLog('Strange lights flicker at the edge of sight. You blink and they are gone.', 'alert');
            G.san -= 1;
        }
        if (G.morale < 20 && rr() < 0.08) {
            printLog('Shadows dance in your peripheral vision. You could swear you heard someone whisper your name.', 'alert');
        }

        G.san = clamp(G.san, 0, 100);
        G.hp = clamp(G.hp, 0, 100);

        playBell();

        // Trace trail on the map
        G.trail.push({ x: G.x, y: G.y });
        if (G.trail.length > 200) G.trail.shift();

        // Reveal chart fog around the vessel as time passes
        revealFogAt(G.x, G.y, WORLD.fogRevealRadius);

        if (h % 2 === 0) rollWind();

        // Leaks & Pumps
        let leakRate = st.leakRate;
        if (G.wx === 'Storm') leakRate *= 2;
        if (G.state === 'Hove-to') leakRate *= 0.8;
        if (st.leakBow > st.leakMid) G.spd *= 0.95;
        if (st.leakStern > st.leakMid) G.spd *= 0.92;

        let netBilge = leakRate - st.pumpRate;
        G.bilge = clamp(G.bilge + netBilge, 0, 100);

        if (G.bilge > 90) G.ship.takeDamage(2, false);
        st = G.ship.getStats();

        if (G.bilge >= 100) return die('The hull succumbs to the rising water. The sea reclaims her.');
        if (st.curHull <= 0) return die('The ship fractures completely. There is nothing left to float on.');

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
            if (G.bilge > 50) G.spd *= 0.7;
            if (Math.abs(st.list) > 1) G.spd *= clamp(1 - (Math.abs(st.list) / 6), 0.5, 1);
            if (typeof G.ropeWear === 'number') G.spd *= clamp(1 - (G.ropeWear / 140), 0.55, 1);
            if (G.maneuver === 'tack') {
                G.spd *= 0.9;
                if (G.beaufort >= 6 && rr() < 0.2) {
                    printLog('The tack bites hard. The hull shudders.', 'alert');
                    G.ship.takeDamage(6, true);
                }
                G.maneuver = null;
            } else if (G.maneuver === 'wear') {
                G.spd *= 0.75;
                G.maneuver = null;
            }

            let dist = G.spd;
            let vec = DIR_V[hd];
            const leeway = G.beaufort >= 6 ? 0.12 : 0.06;
            const drift = [vec[0] * dist * 0.1, vec[1] * dist * 0.1];
            const side = DIR_V[(hd + 2) % 8];
            G.x += drift[0] + side[0] * leeway;
            G.y += drift[1] + side[1] * leeway;
            const navPenalty = G.wx === 'Storm' ? 0.28 : G.wx === 'Gale' ? 0.16 : 0.1;
            G.navError = clamp((G.navError || 2) + navPenalty, 1, 40);
            G.ropeWear = clamp((G.ropeWear || 0) + (G.beaufort >= 6 ? 0.2 : 0.08), 0, 100);

            revealFogAt(G.x, G.y, WORLD.fogRevealRadius);

            if (rr() < 0.1) playGull();

            // Sail damage in storms
            if (G.wx === 'Storm' && rr() < 0.3 && st.sailPwr > 0) {
                for (let i = 0; i < G.ship.cells.length; i++) {
                    let c = G.ship.cells[i];
                    if (c && BLOCKS[c.type].func === 'sail') {
                        c.hp -= 15;
                        if (c.hp <= 0) {
                            printLog('A mast snaps under the violent winds!', 'alert');
                            playCreak();
                        }
                        break;
                    }
                }
            }

            if (G.wx === 'Storm' && st.mastCount > st.stayCount && rr() < 0.25) {
                printLog('The rigging howls. A stay gives way and a mast shudders.', 'alert');
                for (let i = 0; i < G.ship.cells.length; i++) {
                    let c = G.ship.cells[i];
                    if (c && BLOCKS[c.type].func === 'sail') {
                        c.hp -= 10;
                        break;
                    }
                }
                G.ropeWear = clamp((G.ropeWear || 0) + 2, 0, 100);
            }
            if (G.beaufort >= 8 && G.state === 'Underway' && rr() < 0.1) {
                printLog('A hard broach throws the deck sideways. You fight the wheel.', 'alert');
                G.spd = Math.max(0, G.spd - 4);
                G.hp = clamp(G.hp - 2, 0, 100);
            }
        }

        if (G.state === 'Underway') {
            encounter = tryEncounter(true);
            if (encounter) h = hours; // Exit loop early when island encountered

            // At the end of the full multi-hour block, evaluate random encounters
            if (h === hours - 1) {
                encounter = tryEncounter(false);
            }
        } else if (G.state === 'Anchored') {
            G.navError = clamp((G.navError || 2) - 0.35, 1, 40);
            G.morale = clamp(G.morale + 0.2, 0, 100);
        }
    }

    updateUI();
    if (typeof renderChart === 'function') renderChart();
    saveGame(); // Auto-save after time passes
    enableUI();

    // If we're anchored and no new encounter was triggered, stay in island_approach
    if (!encounter && G.state === 'Anchored' && G.curIsland) {
        encounter = 'island_approach';
    }

    if (!skipSceneChange) {
        setScene(encounter || 'deck');
    }

    return encounter;
}

function initWorld(seed) {
    G.worldSeed = seed | 0;
    G.seed = G.worldSeed;
    G.chunkCache = {};
    G.islandState = {};
    G.scavengedIslands = {};
    if (!G.lootedIslands) G.lootedIslands = {};
    G.chartMarks = {};
    G.navError = 2;
    G.discovered = {};
    G.fogCleared = {};
    G.trail = [];
    G.explored = [];

    if (G.tutorialIsland) {
        commitIslandState(G.tutorialIsland);
    }

    revealFogAt(G.x || 0, G.y || 0, WORLD.fogRevealRadius);
}

const BENCHMARK = {
    navErrorMin: 1,
    navErrorMax: 40,
    hasRumors: true,
    hasChartMarks: true,
    hasSpoilage: true,
    hasMorale: true
};

function benchmarkStatus() {
    return {
        navError: typeof G.navError === 'number' && G.navError >= BENCHMARK.navErrorMin && G.navError <= BENCHMARK.navErrorMax,
        rumors: !BENCHMARK.hasRumors || Array.isArray(G.rumors),
        chartMarks: !BENCHMARK.hasChartMarks || !!G.chartMarks,
        spoilage: !BENCHMARK.hasSpoilage || (typeof G.foodQ === 'number' && typeof G.waterQ === 'number'),
        morale: !BENCHMARK.hasMorale || typeof G.morale === 'number'
    };
}
if (typeof window !== 'undefined') window.benchmarkStatus = benchmarkStatus;
