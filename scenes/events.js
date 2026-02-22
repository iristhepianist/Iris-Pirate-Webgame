const eventScenes = {
    'chart_constellation': {
        text: () => {
            const hasStarChart = G.ship && G.ship.cells && G.ship.cells.some(cell => cell && BLOCKS[cell.type] && BLOCKS[cell.type].func === 'celestial' && BLOCKS[cell.type].charts);
            if (!hasStarChart) {
                return sceneContext() + 'You peer at the stars, but without proper charts and tables, their patterns remain mysterious.';
            }

            const visibleConstellations = getVisibleConstellations();
            if (visibleConstellations.length === 0) {
                return sceneContext() + 'The stars are obscured by clouds tonight. You cannot chart any constellations.';
            }

            let text = sceneContext() + 'Under the clear night sky, you consult your star charts. Several constellations are visible:\n\n';
            visibleConstellations.forEach((constellation, index) => {
                const charted = G.chartedConstellations && G.chartedConstellations[constellation.id];
                const status = charted ? ' (already charted)' : '';
                text += `${index + 1}. ${constellation.name}: ${constellation.description}${status}\n`;
            });
            text += '\nWhich constellation would you like to chart?';
            return text;
        },
        choices: () => {
            const visibleConstellations = getVisibleConstellations();
            const choices = [];

            if (visibleConstellations.length > 0) {
                visibleConstellations.forEach((constellation, index) => {
                    const charted = G.chartedConstellations && G.chartedConstellations[constellation.id];
                    if (!charted) {
                        choices.push({
                            text: `Chart ${constellation.name}`,
                            cb: async () => {
                                await chartConstellation(constellation.id);
                            }
                        });
                    }
                });
            }

            choices.push({ text: 'Back to deck', cb: () => setScene('deck') });
            return choices;
        }
    },

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
            G.state = 'Anchored'; G.spd = 0; G.locName = G.curIsland ? G.curIsland.name : 'Unknown Island';
            if (G.curIsland && G.curIsland.id === 'tutorial:tern-rock') G.tutorialPhase = 'complete';
            if (G.curIsland && !G.curIsland.type) G.curIsland.type = ['tropical', 'barren', 'volcanic', 'mystical'][Math.floor(rr() * 4)];
        },
        text: () => {
            if (G.curIsland && G.curIsland.id === 'tutorial:tern-rock') {
                return sceneContext() + 'Ahead lies Tern Rock. A jagged pillar of stone rising from the surf. You see the remains of a small camp on the higher ledge.';
            }
            const typeText = {
                tropical: 'Overgrown with twisted vines and decaying fruit. The air is thick with rot and distant, mournful cries. Pale stone ruins peek through the foliage.',
                barren: 'A wasteland of cracked, pale rock. Bones litter the ground, and the wind whispers forgotten names. Nothing grows here but despair.',
                volcanic: 'Sulfur vents hiss steam, and the ground is scarred with blackened craters. The air burns your lungs, and pale ash falls like snow.',
                mystical: 'Thick mists coil around crumbling obelisks. Faint whispers echo from the fog, and the stone is unnaturally cold to the touch.'
            };
            const islandName = G.curIsland ? G.curIsland.name : 'this forsaken isle';
            const islandType = G.curIsland ? G.curIsland.type : 'mystical';
            return sceneContext() + `A pale silhouette emerges from the fog. The chart names it ${islandName}. ${typeText[islandType] || 'An accursed place where the dead walk.'}` +
                ' The stone has a sickly, pale hue. Deathly quiet. Too quiet.';
        },
        choices: () => {
            let c = [];
            const isl = G.curIsland;
            
            // Testing mode: provide basic options when no island is set
            if (!isl) {
                c.push({
                    text: 'Return to Deck (Testing Mode)',
                    cb: () => setScene('deck')
                });
                c.push({
                    text: 'Test Another Dungeon',
                    cb: () => setScene('chart_constellation') // Could add a dungeon selection scene
                });
                return c;
            }

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
                            let t = rInt(5), r = rInt(4), cn = rInt(4), mt = rInt(3);
                            let specialLoot = '';

                            if (isl.type === 'tropical') {
                                f += 3; w += 2;
                                G.foodStocks.citrus += 2 + rInt(3);
                                specialLoot = 'The tropical abundance yields extra citrus and fresh provisions.';
                            } else if (isl.type === 'barren') {
                                mt += 3; t += 2;
                                specialLoot = 'The barren rocks provide valuable minerals and timber.';
                            } else if (isl.type === 'volcanic') {
                                cn += 2; r += 2;
                                if (rr() < 0.3) {
                                    G.ship.takeDamage(5, true);
                                    await printLog('A sudden tremor damages the ship as you explore.', 'alert');
                                }
                                specialLoot = 'The volcanic heat preserves rare materials, but watch for tremors.';
                            } else if (isl.type === 'mystical') {
                                G.san = clamp(G.san + 10, 0, 100);
                                if (!G.artifacts) G.artifacts = [];
                                G.artifacts.push('ancient_rune');
                                specialLoot = 'The mystical ruins grant insight and reveal an ancient artifact.';
                            }

                            let m = isl.pale ? 'Strange basalt statues' : 'Abandoned structures';
                            await printLog(`Amongst the ${m}, you find caches left by previous expeditions. ${specialLoot}`, 'normal');

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
                c.push({
                    text: 'Explore Inland (2 Hours, Risky)', cb: async () => {
                        await advanceTime(2);
                        setScene('island_dungeon');
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

    'doldrums': {
        text: () => sceneContext() + 'The sea lies flat for days. No wind. No mercy. The men stare at the horizon and count cups of water.',
        choices: () => [
            { text: 'Ration Hard (4 Hours)', cb: () => { G.foodStocks.salt -= 0.2; G.waterStocks.fresh -= 0.4; G.morale = clamp((G.morale || 70) - 2, 0, 100); advanceTime(4); } },
            { text: 'Keep to the Routine (4 Hours)', cb: () => { G.morale = clamp((G.morale || 70) - 1, 0, 100); advanceTime(4); } }
        ]
    },

    'survival_manual': {
        text: () => sceneContext() + 'You open the weathered manual, its pages yellowed and stained with salt spray. The handwriting is cramped but legible, penned by some long-ago castaway who survived the Pale Sea:\n\n' +
            '"The stars will guide you, but only if you learn their secrets. Take sun sights at noon to mark your position, star fixes at night to correct your drift. A telescope or astrolabe will sharpen these measurements, revealing the true lay of the land.\n\n' +
            'Your ship is your only home upon these merciless waters. Watch the bilge water rise - pump it out before it corrupts your stores. Repair damaged timbers before they give way to the deep. Balance your cargo carefully; too much weight will slow you, too little will leave you wanting.\n\n' +
            'Food spoils in the heat and damp, water evaporates under the relentless sun. Fish when hove-to to catch fresh provisions that lift the crew\'s spirits. Islands offer salvation - timber for repairs, rope for rigging, canvas for sails, metal for tools.\n\n' +
            'Some islands hide secrets beyond mere resources. Chart the constellations when the sky is clear, and they may reveal paths to places unseen. Ancient artifacts sometimes reward the bold explorer.\n\n' +
            'Trust the stars. Fear the deep. The sea takes all who forget these lessons."',
        choices: () => [
            {
                text: 'Continue Reading (About Storms)',
                cb: () => setScene('survival_manual_storms')
            },
            {
                text: 'Close the Manual',
                cb: () => setScene('island_approach')
            }
        ]
    },

    'survival_manual_storms': {
        text: () => sceneContext() + 'The manual continues, the pages growing more frantic as if written during a gale:\n\n' +
            '"When the sky darkens and the barometer falls, a storm approaches. Heave-to to weather it - strike your sails and let the sea pass beneath you. Reef early in gale winds to spare your masts. Monitor your hull; storms reveal weaknesses you never knew.\n\n' +
            'Watch for the signs of doom: leaking timbers that won\'t seal, bilge water that rises despite your pumps, crew whose spirits break under endless strain. Sanity slips away in the endless dark, bringing visions that blur the line between sea and madness.\n\n' +
            'The final page bears a star chart, constellations marked with strange symbols that seem to shift when you look away too long."',
        choices: () => [
            {
                text: 'Close the Manual',
                cb: () => setScene('island_approach')
            }
        ]
    },
};

window.eventScenes = eventScenes;
