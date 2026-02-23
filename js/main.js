// js/main.js
'use strict';

function startGame(load) {
    document.getElementById('title-screen').style.display = 'none';
    initFX();
    initChart();
    initAudio(); // Initialized on user interaction

    if (load && loadGame()) {
        checkAudio();
        printLog('You return to the nightmare.', 'normal');
        setScene('deck');
    } else {
        const worldSeed = ((Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0);

        G = {
            day: 1, hour: 0,
            bilge: 50, // the ship is sinking!
            food: 10, water: 10,
            mat: { timber: 6, canvas: 0, rope: 0, metal: 0 },
            windDir: 0, windSpd: 12, baro: 1012, baroT: 1012, wx: 'Clear',
            heading: 4, spd: 0,
            x: 0, y: 0,
            state: 'Hove-to', locName: 'The Drowned Vessel',
            curIsland: null,
            atShipyard: false,
            tutorialPhase: 'start',
            san: 100, hp: 100,
            trail: [],
            discovered: {},
            chunkCache: {},
            islandState: {},
            fogCleared: {},
            chartMarks: {},
            navError: 2,
            lootedIslands: {},
            explored: [],
            foodQ: 100,
            waterQ: 100,
            ropeWear: 0,
            morale: 70,
            calmHours: 0,
            rumors: [],
            worldSeed,
            seed: worldSeed,
            tutorialIsland: {
                id: 'tutorial:tern-rock',
                x: 0,
                y: -10,
                name: 'Tern Rock (Tutorial)',
                pale: false,
                found: false,
                scavenged: false
            }
        };

        // Build initial broken ship
        let sg = new ShipGrid(9, 15);
        sg.set(sg.cx, sg.cy + 1, { type: 'plank', hp: BLOCKS.plank.hp }); // tiny broken ship
        sg.set(sg.cx, sg.cy - 1, { type: 'mast', hp: BLOCKS.mast.hp });
        G.ship = sg;

        initWorld(worldSeed);

        document.getElementById('story').innerHTML = '';
        setScene('awakening');
    }

    // Ambient Audio Loop
    setInterval(() => {
        if (!actx || actx.state !== 'running') return;

        let roll = Math.random();
        if (roll < 0.05) playGroan();
        if (G.wx !== 'Calm' && roll < 0.1) playGust();
        if (G.wx !== 'Storm' && roll < 0.02) playGull();
    }, 10000);
}

window.onload = () => {
    if (localStorage.getItem('dc_txt_v2')) {
        document.getElementById('btn-cont').style.display = 'inline-block';
    }
    document.getElementById('btn-new').onclick = () => startGame(false);
    document.getElementById('btn-cont').onclick = () => startGame(true);
};
