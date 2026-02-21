// js/scenes.js
'use strict';

const Scenes = {
    // --- Tutorial Sequence ---
    'awakening': {
        enter: () => { G.locName = 'The Drowned Vessel'; },
        text: 'The cold is the first thing you feel. Then the sound—a rhythmic, hollow sloshing from below. You are alone on the deck. The crew is gone. <br><br>The ship is heavy. It lists to the port side, groaning under the weight of the Atlantic.',
        choices: () => {
            let c = [];
            c.push({
                text: 'Grip the rusted pump handle (1 Hour)', cb: async () => {
                    await printLog('The iron screams in your hands. You pump until your shoulders ache, but the water begins to spill over the gunwales.', 'normal');
                    playSplash();
                    G.bilge = Math.max(0, G.bilge - 50);
                    if (G.bilge === 0) {
                        await printLog('The deck feels stable for a moment. But a draft pulls from the hold—a jagged gap in the hull is drinking the sea.', 'sys');
                        setScene('tutorial_workshop');
                    } else {
                        advanceTime(1);
                        setScene('awakening');
                    }
                }
            });
            return c;
        }
    },

    'tutorial_workshop': {
        text: 'You need to go below. To the Shipsmith\'s bench. There is timber in the racks—enough for a desperate patch.',
        choices: () => {
            let c = [];
            c.push({
                text: 'Climb into the hold (1 Hour)', log: 'The darkness below is absolute.', cb: () => {
                    advanceTime(1);
                    openWorkshop();
                    G.tutorialPhase = 'patch';
                }
            });
            return c;
        }
    },

    'tutorial_sail': {
        text: 'The patch holds. The ship survives. Looking North, you see a sliver of rock on the horizon—Tern Rock. It is the only thing left in this world.',
        choices: () => {
            let c = [];
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

    'tutorial_sail_wait': {
        text: 'The gulls circle Tern Rock. They are watching you.',
        choices: () => {
            let c = [];
            c.push({
                text: 'Make Sail', log: 'Heaving the rough canvas.', cb: async () => {
                    G.state = 'Underway';
                    await printLog('The sails snap tight. The ship lurches forward into the grey void.', 'normal');
                    advanceTime(4);
                }
            });
            return c;
        }
    },

    // --- Core Scenes ---
    'deck': {
        enter: () => { G.locName = 'Open Ocean'; },
        text: () => {
            if (G.state === 'Underway') return `You are sailing ${DIRS[G.heading]}. The ship groans against the deep ocean swell. The horizon offers no comfort.`;
            if (G.state === 'Hove-to') return `The ship is hove-to, drifting aimlessly. The sails luff in the wind.`;
            return `You are adrift.`;
        },
        choices: () => {
            let c = [];
            if (G.state !== 'Underway') c.push({ text: 'Make Sail', log: 'Making sail.', cb: () => { G.state = 'Underway'; setScene('deck'); } });
            if (G.state === 'Underway') c.push({ text: 'Heave to (Stop)', log: 'Heaving to.', cb: () => { G.state = 'Hove-to'; G.spd = 0; setScene('deck'); } });

            if (G.state === 'Underway') {
                c.push({ text: 'Hold Course (Sail 4 Hours)', cb: () => advanceTime(4) });
                c.push({ text: 'Change Heading', cb: () => setScene('change_heading') });
            } else {
                c.push({ text: 'Wait (4 Hours)', cb: () => advanceTime(4) });
            }

            c.push({
                text: 'Consult the Drowned Chart (1 Hour)', cb: () => {
                    advanceTime(1);
                    openChart();
                }
            });

            c.push({
                text: 'Enter the Workshop (1 Hour)', cb: () => {
                    advanceTime(1);
                    openWorkshop();
                }
            });

            c.push({
                text: 'Pump the Bilge (1 Hour)', cb: async () => {
                    await printLog('You spend an hour manning the pumps. It is exhausting, repetitive work.', 'normal');
                    let st = G.ship.getStats();
                    G.bilge = Math.max(0, G.bilge - 40 - st.pumpRate * 10);
                    G.food -= 0.1; G.water -= 0.2;
                    advanceTime(1);
                }
            });

            c.push({ text: 'Save Game', cb: () => saveGame() });
            return c;
        }
    },

    'change_heading': {
        text: 'The compass needle wavers slightly in the dim light. Which way do you turn the wheel?',
        choices: () => {
            return DIRS.map((d, i) => ({
                text: `Steer ${d}`, log: `Setting course to ${d}.`,
                cb: () => { G.heading = i; setScene('deck'); }
            })).concat([{ text: 'Cancel', cb: () => setScene('deck') }]);
        }
    },

    // --- Random Events ---
    'storm_event': {
        enter: () => { G.state = 'Hove-to'; G.spd = 0; },
        text: 'A rogue wave slams the broadside. The sky is black. You must ride out the squall.',
        choices: [
            {
                text: 'Lash yourself to the helm and wait (4 Hours)', cb: async () => {
                    await printLog('The sea punishes you, but you endure.', 'normal');
                    let dropped = G.ship.takeDamage(10 + rInt(20), true);
                    if (dropped) await printLog('You hear the terrifying crack of timber splitting. Parts of the ship have sheared off into the sea!', 'alert');
                    playCreak();
                    advanceTime(4);
                }
            }
        ]
    },

    'debris': {
        text: 'A cluster of wreckage bobs in the swell. Splintered wood and tangled rigging.',
        choices: [
            {
                text: 'Haul it aboard (1 Hour)', cb: async () => {
                    let t = 1 + rInt(3), r = rInt(3), m = rInt(2);
                    G.mat.timber += t; G.mat.rope += r; G.mat.metal += m;
                    await printLog(`Scavenged ${t} Timber, ${r} Rope, and ${m} Metal from the debris.`, 'normal');
                    advanceTime(1);
                }
            },
            { text: 'Ignore it', cb: () => setScene('deck') }
        ]
    },

    'derelict': {
        text: 'A derelict sloop drifts nearby, its mast snapped like a toothpick. Silence hangs over its salt-crusted deck.',
        choices: [
            {
                text: 'Board and Salvage (2 Hours)', cb: async () => {
                    let f = 5 + rInt(10), w = 5 + rInt(10), m = 2 + rInt(5);
                    G.food += f; G.water += w; G.mat.metal += m;
                    await printLog(`Found some preserved rations and heavy iron scrap in the hold.`, 'normal');
                    advanceTime(2);
                }
            },
            { text: 'Pass by in silence', cb: () => setScene('deck') }
        ]
    },

    'omen': {
        text: 'The water churns unnaturally. For a moment, you see a pale, monstrous shape gliding beneath the keel.',
        choices: [
            {
                text: 'Look away', cb: async () => {
                    await printLog('You try to forget what you saw.', 'alert');
                    setScene('deck');
                }
            }
        ]
    },

    'madness': {
        text: 'The calm sea is a mirror. You stare into it and hear whispers calling your name.',
        choices: [
            {
                text: 'Step back from the rail', cb: async () => {
                    await printLog('You grip the mast until your knuckles are white.', 'normal');
                    G.food -= 0.5; // lose appetite
                    setScene('deck');
                }
            }
        ]
    },

    'island_approach': {
        enter: () => { G.state = 'Anchored'; G.spd = 0; G.locName = G.curIsland.name; },
        text: () => `Land rises from the fog. The chart names it ${G.curIsland.name}. ` +
            (G.curIsland.pale ? 'The stone has a sickly, pale hue. Quiet. Too quiet.' : 'Stunted trees cling to the rocky shore.'),
        choices: () => {
            let c = [];
            if (!G.curIsland.scavenged) {
                c.push({
                    text: 'Go Ashore and Explore (4 Hours)', cb: async () => {
                        G.curIsland.scavenged = true;
                        await printLog(`You row ashore and walk the desolate coast of ${G.curIsland.name}.`, 'normal');

                        let f = 2 + rInt(4), w = 2 + rInt(4);
                        let m = G.curIsland.pale ? 'Strange basalt statues' : 'Abandoned shacks';

                        await printLog(`Amongst the ${m}, you find caches left by previous expeditions.`, 'normal');

                        let t = rInt(5), r = rInt(4), cn = rInt(4), mt = rInt(3);
                        G.food += f; G.water += w;
                        G.mat.timber += t; G.mat.rope += r; G.mat.canvas += cn; G.mat.metal += mt;

                        let st = G.ship.getStats();
                        G.food = Math.min(st.maxFood, G.food);
                        G.water = Math.min(st.maxWater, G.water);

                        await printLog(`Gathered: ${f}d Food, ${w}d Water, ${t} Timber, ${r} Rope, ${cn} Canvas, ${mt} Metal.`, 'sys');
                        advanceTime(4);
                    }
                });
            } else {
                c.push({ text: 'The island is stripped bare. Nothing remains.', disabled: () => true });
            }
            c.push({ text: 'Weigh Anchor and Leave', log: 'Leaving the island behind.', cb: () => { G.state = 'Underway'; G.curIsland = null; setScene('deck'); } });
            return c;
        }
    }
};

async function setScene(id) {
    currentScene = id;
    const s = Scenes[id];
    if (s.enter) s.enter();
    if (s.text) await printLog(typeof s.text === 'function' ? s.text() : s.text);
    renderChoices(s.choices);
    updateUI();
}
