const tutorialScenes = {
    'awakening': {
        enter: () => {
            G.locName = 'The Drowned Vessel';
        },
        text: () => sceneContext() + 'The cold is the first thing you feel. Then the sound - a rhythmic, hollow sloshing from below. You are alone on the deck. There is no one else.',
        choices: () => {
            let c = [];
            c.push({
                text: 'Grip the rusted pump handle (1 Hour)', cb: async () => {
                    await printLog('The iron screams in your hands. You pump until your shoulders ache, but the water begins to spill over the gunwales.', 'normal');
                    const oldBilge = G.bilge;
                    G.bilge = Math.max(0, G.bilge - 50);
                    playSplash();
                    if (G.bilge === 0) {
                        await printLog('The deck feels stable for a moment. But a draft pulls from the hold—a jagged gap in the hull is drinking the sea.', 'sys');
                        setScene('tutorial_workshop');
                    } else {
                        await advanceTime(1, true);
                        setScene('awakening');
                    }
                }
            });
            return c;
        }
    },

    'tutorial_workshop': {
        text: () => sceneContext() + 'You need to go below. To the Shipsmith\'s bench. There is timber in the racks - enough for a desperate patch.',
        choices: () => {
            let c = [];
            c.push({
                text: 'Climb into the hold (1 Hour)', log: 'The darkness below is absolute.', cb: async () => {
                    await advanceTime(1, true);
                    openWorkshop();
                    G.tutorialPhase = 'patch';
                }
            });
            return c;
        }
    },

    'tutorial_sail': {
        text: () => sceneContext() + 'The patch holds. The ship survives. You are alone in the grey mist, with nothing but the groaning of the hull for company.',
        choices: () => {
            let c = [];
            c.push({
                text: 'Consult the Navigator\'s Journal', cb: () => setScene('tutorial_log')
            });
            c.push({
                text: 'Turn the wheel North', log: 'The rudder kicks back like a living thing.', cb: async () => {
                    G.heading = 0; // North
                    await printLog('The ship aligns. The wind is waiting.', 'normal');
                    setScene('tutorial_sail_wait');
                }
            });
            return c;
        }
    },

    'tutorial_log': {
        text: 'The leather is salt-crusted and stiff. A single entry remains legible: "Day 42. Tern Rock lies due North. If the fog clears, we might see the gulls. If not, the current will take us."\n\nThere is a rough sketch of a jagged rock pillar.',
        choices: [
            { text: 'Back to the deck', cb: () => setScene('tutorial_sail') }
        ]
    },

    'tutorial_sail_wait': {
        text: 'The gulls are circling something in the distance. The mist is thick, but the gulls know the way.',
        choices: () => {
            let c = [];
            c.push({
                text: 'Make Sail', log: 'Heaving the rough canvas.', cb: async () => {
                    G.state = 'Underway';
                    await printLog('The sails snap tight. The ship lurches forward into the grey void.', 'normal');
                    G.noEncounters = true;
                    let enc = await advanceTime(4, true);
                    G.noEncounters = false;
                    setScene(enc || 'deck');
                }
            });
            return c;
        }
    }
};

window.tutorialScenes = tutorialScenes;
