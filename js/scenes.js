// js/scenes.js
'use strict';

function sceneContext() {
    const h = G.hour || 0;
    const time = h < 4 ? 'Moonless night' : h < 6 ? 'Dawn' : h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : h < 20 ? 'Dusk' : 'Night';
    const wx = G.wx || 'Clear';
    return '<span class="para sys">' + time + '. ' + wx + '. ' + (G.seaState || '') + '</span><br>';
}

function canSunSight() { return (G.hour >= 11 && G.hour <= 13 && G.wx !== 'Storm'); }
function canStarFix() { return ((G.hour >= 20 || G.hour <= 3) && G.wx !== 'Storm' && G.wx !== 'Gale'); }

const Scenes = {
    // --- Tutorial Sequence ---
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
    },

    'deck': {
        enter: () => { G.locName = 'Open Ocean'; },
        text: () => {
            const base = sceneContext();
            if (G.state === 'Underway') return `${base}You are sailing ${DIRS[G.heading]}. The ship groans against the deep ocean swell. The horizon offers no comfort.`;
            if (G.state === 'Hove-to') return `${base}The ship is hove-to, drifting aimlessly. The sails luff in the wind.`;
            return `${base}You are adrift.`;
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

            if (canSunSight()) c.push({ text: 'Take Sun Sight (1 Hour)', cb: () => { G.navError = Math.max(1, (G.navError || 2) - 6); printLog('You take the noon sight. The numbers settle.', 'sys'); advanceTime(1); } });
            if (canStarFix()) c.push({ text: 'Take Star Fix (1 Hour)', cb: () => { G.navError = Math.max(1, (G.navError || 2) - 4); printLog('You chart the stars and feel the world regain its edges.', 'sys'); advanceTime(1); } });

            c.push({
                text: 'Consult the Drowned Chart (1 Hour)', cb: async () => {
                    await advanceTime(1, true);
                    openChart();
                }
            });

            c.push({
                text: 'Enter the Workshop (1 Hour)', cb: async () => {
                    await advanceTime(1, true);
                    openWorkshop();
                }
            });

            c.push({
                text: 'Pump the Bilge (1 Hour)', cb: async () => {
                    await printLog('You spend an hour manning the pumps. It is exhausting, repetitive work.', 'normal');
                    let st = G.ship.getStats();
                    G.bilge = Math.max(0, G.bilge - 40 - st.pumpRate * 10);
                    await advanceTime(1);
                }
            });

            c.push({
                text: 'Try Fishing (1 Hour)', cb: async () => {
                    if (G.state !== 'Hove-to' && G.state !== 'Anchored') {
                        await printLog('You must be hove-to or anchored to fish.', 'sys');
                        return;
                    }
                    await printLog('You cast your line into the restless sea.', 'normal');
                    let success = rr() < 0.5; // 50% success
                    if (success) {
                        let foodGain = 2 + rInt(2); // 2-3 days
                        G.foodStocks.fresh += foodGain;
                        G.morale = clamp(G.morale + 5, 0, 100);
                        await printLog(`You haul in a fine catch! Fresh fish for ${foodGain} days. Your spirits lift.`, 'normal');
                    } else {
                        await printLog('The line comes back empty. The sea mocks your efforts.', 'normal');
                    }
                    await advanceTime(1);
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
                cb: () => {
                    if (G.state === 'Underway') { G.pendingHeading = i; setScene('maneuver'); }
                    else { G.heading = i; setScene('deck'); }
                }
            })).concat([{ text: 'Cancel', cb: () => setScene('deck') }]);
        }
    },

    // --- Random Events ---
    'storm_event': {
        enter: () => { G.state = 'Hove-to'; G.spd = 0; },
        text: () => sceneContext() + 'A rogue wave slams the broadside. The sky is black. You must ride out the squall.',
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
        text: () => sceneContext() + 'A derelict sloop drifts nearby, its mast snapped like a toothpick. Silence hangs over its salt-crusted deck.',
        choices: [
            {
                text: 'Board and Salvage (2 Hours)', cb: async () => {
                    let f = 5 + rInt(10), w = 5 + rInt(10), m = 2 + rInt(5);
                    G.foodStocks.salt += f; G.waterStocks.fresh += w; G.mat.metal += m;
                    await printLog(`Found some preserved rations and heavy iron scrap in the hold.`, 'normal');
                    advanceTime(2);
                }
            },
            {
                text: 'Search Deeper (4 Hours)', cb: async () => {
                    await printLog('You push below decks. The air is sweet and wrong.', 'alert');
                    if (rr() < 0.25) {
                        G.hp = clamp(G.hp - 6, 0, 100);
                        G.san = clamp(G.san - 3, 0, 100);
                        await printLog('Rot and fever reach for you. You flee before it settles.', 'alert');
                    }
                    let f = 8 + rInt(12), w = 6 + rInt(12), m = 4 + rInt(6);
                    G.foodStocks.salt += f; G.waterStocks.fresh += w; G.mat.metal += m;
                    await printLog('You haul out what you can and leave the rest to the dark.', 'normal');
                    advanceTime(4);
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
        text: () => sceneContext() + 'The calm sea is a mirror. You stare into it and hear whispers calling your name.',
        choices: [
            {
                text: 'Step back from the rail', cb: async () => {
                    await printLog('You grip the mast until your knuckles are white.', 'normal');
                    // G.food -= 0.5; // legacy: appetite loss concept handled by morale/san later
                    setScene('deck');
                }
            }
        ]
    },

    'island_approach': {
        enter: () => {
            G.state = 'Anchored'; G.spd = 0; G.locName = G.curIsland.name;
        },
        text: () => {
            if (G.curIsland && G.curIsland.id === 'tutorial:tern-rock') {
                return sceneContext() + 'Ahead lies Tern Rock. A jagged pillar of stone rising from the surf. You see the remains of a small camp on the higher ledge.';
            }
            return sceneContext() + `Land rises from the fog. The chart names it ${G.curIsland.name}. ` +
                (G.curIsland.pale ? 'The stone has a sickly, pale hue. Quiet. Too quiet.' : 'Stunted trees cling to the rocky shore.');
        },
        choices: () => {
            let c = [];
            const isl = G.curIsland;
            if (!isl) return c;

            const id = isl.id || (typeof isl.x === 'number' ? `${Math.round(isl.x)},${Math.round(isl.y)}` : null);
            const alreadyScavenged = !!(id && G.lootedIslands && G.lootedIslands[id]);

            if (!alreadyScavenged) {
                c.push({
                    text: 'Go Ashore and Explore (4 Hours)', cb: async () => {
                        if (G._islandLootLock) return;
                        G._islandLootLock = true;
                        try {
                            isl.scavenged = true;
                            if (id) {
                                if (!G.lootedIslands) G.lootedIslands = {};
                                G.lootedIslands[id] = true;
                            }
                            if (typeof commitIslandState === 'function') commitIslandState(isl);

                            await printLog(`You row ashore and walk the desolate coast of ${isl.name}.`, 'normal');

                            if (isl.id === 'tutorial:tern-rock') {
                                await printLog('You find an abandoned camp. A tattered shelter and a dry-box of supplies.', 'normal');
                                await printLog('Tucked into the shelter is a salt-stained manual: "The Castaway\'s Guide to the Pale Sea".', 'sys');
                                setScene('survival_manual');
                                return;
                            }

                            let f = 2 + rInt(4), w = 2 + rInt(4);
                            let m = isl.pale ? 'Strange basalt statues' : 'Abandoned shacks';
                            await printLog(`Amongst the ${m}, you find caches left by previous expeditions.`, 'normal');

                            let t = rInt(5), r = rInt(4), cn = rInt(4), mt = rInt(3);
                            const oldTimber = G.mat.timber, oldRope = G.mat.rope, oldCanvas = G.mat.canvas, oldMetal = G.mat.metal;

                            G.foodStocks.fresh += f; G.waterStocks.fresh += w;
                            G.mat.timber += t; G.mat.rope += r; G.mat.canvas += cn; G.mat.metal += mt;

                            // Log resource changes
                            if (typeof logResourceChange !== 'undefined') {
                                logResourceChange('timber', oldTimber, G.mat.timber, 'island scavenging');
                                logResourceChange('rope', oldRope, G.mat.rope, 'island scavenging');
                                logResourceChange('canvas', oldCanvas, G.mat.canvas, 'island scavenging');
                                logResourceChange('metal', oldMetal, G.mat.metal, 'island scavenging');
                            }

                            await printLog(`Gathered: ${f}d Food, ${w}d Water, ${t} Timber, ${r} Rope, ${cn} Canvas, ${mt} Metal.`, 'sys');

                            saveGame(); // Crucial: save before time skip
                            await advanceTime(4);
                        } finally {
                            G._islandLootLock = false;
                        }
                    }
                });
            } else {
                c.push({ text: 'The island is stripped bare. Nothing remains.', disabled: () => true });
            }
            if (isl.port) c.push({ text: 'Go to Port (2 Hours)', cb: () => setScene('port_market') });
            c.push({
                text: 'Weigh Anchor and Leave', log: 'Leaving the island behind.', cb: () => {
                    if (isl.id === 'tutorial:tern-rock') G.tutorialPhase = 'complete';
                    G.state = 'Underway';
                    G.curIsland = null;
                    setScene('deck');
                }
            });
            return c;
        }
    },

    'maneuver': {
        text: () => sceneContext() + 'The wind stands ahead of you. Tacking gains ground but strains the hull. Wearing is safer but loses distance.',
        choices: () => [
            { text: 'Tack Through (1 Hour)', cb: () => { G.heading = G.pendingHeading; G.maneuver = 'tack'; advanceTime(1); setScene('deck'); } },
            { text: 'Wear Ship (1 Hour)', cb: () => { G.heading = G.pendingHeading; G.maneuver = 'wear'; advanceTime(1); setScene('deck'); } },
            { text: 'Hold Course', cb: () => setScene('deck') }
        ]
    },

    'doldrums': {
        text: () => sceneContext() + 'The sea lies flat for days. No wind. No mercy. The men stare at the horizon and count cups of water.',
        choices: () => [
            { text: 'Ration Hard (4 Hours)', cb: () => { G.foodStocks.salt -= 0.2; G.waterStocks.fresh -= 0.4; G.morale = clamp((G.morale || 70) - 2, 0, 100); advanceTime(4); } },
            { text: 'Keep to the Routine (4 Hours)', cb: () => { G.morale = clamp((G.morale || 70) - 1, 0, 100); advanceTime(4); } }
        ]
    },

    'night_reef': {
        text: () => sceneContext() + 'You hear breakers before you see them. Rocks. Too late to spot them in the dark.',
        choices: () => [
            { text: 'Throw the Helm Hard (1 Hour)', cb: async () => { G.ship.takeDamage(8, true); await printLog('The keel grinds, then slips free.', 'alert'); advanceTime(1); } },
            { text: 'Heave To (2 Hours)', cb: () => { G.state = 'Hove-to'; advanceTime(2); } }
        ]
    },
    'survival_manual': {
        text: 'The manual is written in a precise, frantic hand. "To whoever follows: Trust not the calm. Hunger is a slow rot, but scurvy is the true killer. Eat the citrus before it spoils. Catch the fish when you drift—the deep sea is rich if you are patient. Rain is a gift, but the still is a curse."\n\nYou find a small cache of supplies nearby.',
        choices: [
            {
                text: 'Salvage the supply cache', cb: async () => {
                    G.foodStocks.citrus += 5;
                    G.foodStocks.fresh += 2;
                    G.waterStocks.fresh += 5;
                    G.mat.timber += 4;
                    await printLog('Gathered: 5 Citrus, 2 Fresh Food, 5 Water, 4 Timber.', 'sys');
                    G.tutorialPhase = 'complete';
                    await advanceTime(4, true);
                    setScene('island_approach');
                }
            }
        ]
    }
};

async function setScene(id) {
    currentScene = id;
    const s = Scenes[id];
    if (!s) {
        console.error('Scene not found:', id);
        return;
    }
    if (s.enter) s.enter();
    if (s.text) await printLog(typeof s.text === 'function' ? s.text() : s.text, 'normal');
    if (s.choices) {
        renderChoices(typeof s.choices === 'function' ? s.choices() : s.choices);
    } else {
        renderChoices([]);
    }
    updateUI();
}
