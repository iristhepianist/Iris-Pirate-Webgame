// js/main.js
'use strict';



function startGame(load) {
    document.getElementById('title-screen').style.display = 'none';
    initFX();
    initChart();
    // initAudio() happens on first button click due to browser auth rules

    if (load && loadGame()) {
        checkAudio();
        printLog('You return to the nightmare.', 'normal');
        setScene('deck');
    } else {
        G = {
            day: 1, hour: 0,
            bilge: 99, // the ship is sinking!
            food: 10, water: 10,
            mat: { timber: 6, canvas: 0, rope: 0, metal: 0 },
            windDir: 0, windSpd: 12, baro: 1012, baroT: 1012, wx: 'Clear',
            heading: 4, spd: 0,
            x: 0, y: 0,
            state: 'Hove-to', locName: 'The Drowned Vessel',
            islands: [], curIsland: null,
            tutorialPhase: 'start',
            san: 100, hp: 100,
            trail: [], discovered: {}
        };
        // Build initial broken ship
        let sg = new ShipGrid(9, 15);
        sg.set(sg.cx, sg.cy + 1, { type: 'plank', hp: BLOCKS.plank.hp }); // tiny broken ship
        sg.set(sg.cx, sg.cy - 1, { type: 'mast', hp: BLOCKS.mast.hp });
        G.ship = sg;

        initWorld(42);

        // Ensure first island is directly North for the tutorial
        G.islands[0].x = 0; G.islands[0].y = -10;
        G.islands[0].name = "Tern Rock (Tutorial)";

        document.getElementById('story').innerHTML = '';
        setScene('awakening');
    }

    // Ambient Audio Loop
    setInterval(() => {
        if (!actx || actx.state !== 'running') return;

        let roll = Math.random();
        // Ship groans
        if (roll < 0.05) playGroan();

        // Wind gusts
        if (G.wx !== 'Calm' && roll < 0.1) playGust();

        // Rare gulls
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
