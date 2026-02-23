const shipyardScenes = {
    'shipyard': {
        enter: () => {
            G.locName = 'Shipyard';
            if (!G.atShipyard) {
                // No shipwright's yard at this location
                printLog('The shoreline offers no sign of shipwrights or dry docks. This remote anchorage has no facilities for major ship modifications.', 'normal');
                setScene('deck');
                return;
            }
        },
        text: () => sceneContext() + 'The shipwright\'s yard hums with the rhythm of hammers and the scent of fresh-cut timber. Master craftsmen await your commission, their tools gleaming in the harbor light.',
        choices: () => [
            {
                text: 'Inspect the bow section',
                cb: () => setScene('shipyard_bow')
            },
            {
                text: 'Inspect midship construction',
                cb: () => setScene('shipyard_mid')
            },
            {
                text: 'Inspect the stern quarter',
                cb: () => setScene('shipyard_stern')
            },
            {
                text: 'Review ship specifications',
                cb: () => setScene('shipyard_inspect')
            },
            {
                text: 'Return to the deck',
                cb: () => setScene('deck')
            }
        ]
    },

    'shipyard_bow': {
        text: () => {
            try {
                const ship = G.ship;
                if (!ship) return (sceneContext ? sceneContext() : '') + 'The bow remains shrouded in mist.';
                
                let bowBlocks = 0;
                for (let x = 0; x < ship.w; x++) {
                    for (let y = 0; y < Math.floor(ship.h * 0.33); y++) {
                        if (ship.get(x, y)) bowBlocks++;
                    }
                }

                return (sceneContext ? sceneContext() : '') + `The bow rises proudly before you. ${bowBlocks} blocks form the forward structure. The stem curves gracefully, cutting through the imagined waves.`;
            } catch (e) {
                return (sceneContext ? sceneContext() : '') + 'The bow is difficult to make out in the haze.';
            }
        },
        choices: () => {
            const choices = [];
            try {
                choices.push({
                    text: 'Reinforce the bow planking',
                    cb: () => setScene('shipyard_confirm_reinforce_bow')
                });

                choices.push({
                    text: 'Mount a bow cannon',
                    cb: () => setScene('shipyard_confirm_cannon_bow')
                });

                choices.push({
                    text: 'Remove bow modifications',
                    cb: () => setScene('shipyard_remove_bow')
                });

                choices.push({
                    text: 'Return to shipyard overview',
                    cb: () => setScene('shipyard')
                });
            } catch (e) {
                choices.push({
                    text: 'Return to shipyard overview',
                    cb: () => setScene('shipyard')
                });
            }

            return choices;
        }
    },

    'shipyard_mid': {
        text: () => {
            try {
                const ship = G.ship;
                if (!ship) return (sceneContext ? sceneContext() : '') + 'The midship area is shrouded in fog.';
                
                let midBlocks = 0;
                for (let x = 0; x < ship.w; x++) {
                    for (let y = Math.floor(ship.h * 0.33); y < Math.floor(ship.h * 0.66); y++) {
                        if (ship.get(x, y)) midBlocks++;
                    }
                }

                return (sceneContext ? sceneContext() : '') + `The midship holds the heart of the vessel. ${midBlocks} blocks form the central structure. Here the hull broadens, providing space for cargo and crew.`;
            } catch (e) {
                return (sceneContext ? sceneContext() : '') + 'The midship area is difficult to assess.';
            }
        },
        choices: () => {
            const choices = [];
            try {
                choices.push({
                    text: 'Install a cargo hold',
                    cb: () => setScene('shipyard_confirm_cargo_mid')
                });

                choices.push({
                    text: 'Add ballast for stability',
                    cb: () => setScene('shipyard_confirm_ballast_mid')
                });

                choices.push({
                    text: 'Install an extra bilge pump',
                    cb: () => setScene('shipyard_confirm_pump_mid')
                });

                choices.push({
                    text: 'Remove midship modifications',
                    cb: () => setScene('shipyard_remove_mid')
                });

                choices.push({
                    text: 'Return to shipyard overview',
                    cb: () => setScene('shipyard')
                });
            } catch (e) {
                choices.push({
                    text: 'Return to shipyard overview',
                    cb: () => setScene('shipyard')
                });
            }

            return choices;
        }
    },

    'shipyard_stern': {
        text: () => {
            try {
                const ship = G.ship;
                if (!ship) return (sceneContext ? sceneContext() : '') + 'The stern area is shrouded in fog.';
                
                let sternBlocks = 0;
                for (let x = 0; x < ship.w; x++) {
                    for (let y = Math.floor(ship.h * 0.66); y < ship.h; y++) {
                        if (ship.get(x, y)) sternBlocks++;
                    }
                }

                return (sceneContext ? sceneContext() : '') + `The stern rises gracefully, crowned by the quarterdeck. ${sternBlocks} blocks form the aft structure. Here the rudder bites into the water, steering your course.`;
            } catch (e) {
                return (sceneContext ? sceneContext() : '') + 'The stern area is difficult to assess.';
            }
        },
        choices: () => {
            const choices = [];
            try {
                choices.push({
                    text: 'Mount a stern cannon',
                    cb: () => setScene('shipyard_confirm_cannon_stern')
                });

                choices.push({
                    text: 'Add an extra mast',
                    cb: () => setScene('shipyard_confirm_mast_stern')
                });

                choices.push({
                    text: 'Remove stern modifications',
                    cb: () => setScene('shipyard_remove_stern')
                });

                choices.push({
                    text: 'Return to shipyard overview',
                    cb: () => setScene('shipyard')
                });
            } catch (e) {
                choices.push({
                    text: 'Return to shipyard overview',
                    cb: () => setScene('shipyard')
                });
            }

            return choices;
        }
    },

    'shipyard_inspect': {
        text: () => {
            try {
                const st = G.ship ? G.ship.getStats() : { curHull: 0, maxHull: 0, wgt: 0, sailPwr: 0, list: 0, leakRate: 0, mastCount: 0, stayCount: 0, storageCapacity: { hold: 0, pantry: 0, water_cask: 0 } };
                const listDirection = st.list > 1 ? 'heavily starboard' : st.list < -1 ? 'heavily port' : st.list > 0.5 ? 'slightly starboard' : st.list < -0.5 ? 'slightly port' : 'balanced';
                const sailBalance = (st.mastCount || 0) > (st.stayCount || 0) + 1 ? 'over-canvassed' : (st.mastCount || 0) < (st.stayCount || 0) ? 'under-rigged' : 'well-balanced';

                const prefix = sceneContext ? sceneContext() : '';
                return prefix + 'The shipwright presents your vessel\'s specifications:\n\n' +
                    'Hull Integrity: ' + st.curHull + '/' + st.maxHull + ' HP\n' +
                    'Displacement: ' + st.wgt + ' tons\n' +
                    'Sail Power: ' + st.sailPwr + ' units (' + sailBalance + ')\n' +
                    'Trim: ' + listDirection + '\n' +
                    'Leak Rate: ' + (st.leakRate ? st.leakRate.toFixed(1) : '0.0') + ' units/hour\n\n' +
                    'Storage: ' + (st.storageCapacity ? st.storageCapacity.hold : 0) + ' main hold, ' +
                    (st.storageCapacity ? st.storageCapacity.pantry : 0) + ' pantry, ' +
                    (st.storageCapacity ? st.storageCapacity.water_cask : 0) + ' water casks\n\n' +
                    'The ship responds to these modifications with subtle shifts in balance and capability.';
            } catch (e) {
                const prefix = sceneContext ? sceneContext() : '';
                return prefix + 'The shipwright examines your vessel but cannot provide specifications at this time.';
            }
        },
        choices: () => {
            return [
                {
                    text: 'Return to shipyard overview',
                    cb: () => setScene('shipyard')
                }
            ];
        }
    },

    'shipyard_remove_bow': {
        text: () => (sceneContext ? sceneContext() : '') + 'Which bow modification would you like to remove?',
        choices: () => {
            const choices = [];
            try {
                const ship = G.ship;
                if (ship) {
                    for (let x = 0; x < ship.w; x++) {
                        for (let y = 0; y < Math.floor(ship.h * 0.33); y++) {
                            const cell = ship.get(x, y);
                            if (cell && (cell.type === 'reinforced_hull' || cell.type === 'cannon')) {
                                if (BLOCKS[cell.type]) {
                                    choices.push({
                                        text: `Remove ${BLOCKS[cell.type].name} at position ${x},${y}`,
                                        cb: async () => {
                                            try {
                                                const removed = ship.remove(x, y);
                                                if (removed) {
                                                    await printLog('The modification is carefully dismantled from the bow.', 'sys');
                                                }
                                                setScene('shipyard_bow');
                                            } catch (e) {
                                                await printLog('The removal encounters difficulties.', 'sys');
                                            }
                                        }
                                    });
                                }
                            }
                        }
                    }
                }

                choices.push({
                    text: 'Cancel removal',
                    cb: () => setScene('shipyard_bow')
                });
            } catch (e) {
                choices.push({
                    text: 'Cancel removal',
                    cb: () => setScene('shipyard_bow')
                });
            }

            return choices;
        }
    },

    'shipyard_remove_mid': {
        text: () => (sceneContext ? sceneContext() : '') + 'Which midship modification would you like to remove?',
        choices: () => {
            const choices = [];
            try {
                const ship = G.ship;
                if (ship) {
                    for (let x = 0; x < ship.w; x++) {
                        for (let y = Math.floor(ship.h * 0.33); y < Math.floor(ship.h * 0.66); y++) {
                            const cell = ship.get(x, y);
                            if (cell && (cell.type === 'cargo_hold' || cell.type === 'ballast_stones' || cell.type === 'extra_pump')) {
                                if (BLOCKS[cell.type]) {
                                    choices.push({
                                        text: `Remove ${BLOCKS[cell.type].name} at position ${x},${y}`,
                                        cb: async () => {
                                            try {
                                                const removed = ship.remove(x, y);
                                                if (removed) {
                                                    await printLog('The modification is carefully dismantled from midship.', 'sys');
                                                }
                                                setScene('shipyard_mid');
                                            } catch (e) {
                                                await printLog('The removal encounters difficulties.', 'sys');
                                            }
                                        }
                                    });
                                }
                            }
                        }
                    }
                }

                choices.push({
                    text: 'Cancel removal',
                    cb: () => setScene('shipyard_mid')
                });
            } catch (e) {
                choices.push({
                    text: 'Cancel removal',
                    cb: () => setScene('shipyard_mid')
                });
            }

            return choices;
        }
    },

    'shipyard_remove_stern': {
        text: () => (sceneContext ? sceneContext() : '') + 'Which stern modification would you like to remove?',
        choices: () => {
            const choices = [];
            try {
                const ship = G.ship;
                if (ship) {
                    for (let x = 0; x < ship.w; x++) {
                        for (let y = Math.floor(ship.h * 0.66); y < ship.h; y++) {
                            const cell = ship.get(x, y);
                            if (cell && (cell.type === 'cannon' || cell.type === 'extra_mast')) {
                                if (BLOCKS[cell.type]) {
                                    choices.push({
                                        text: `Remove ${BLOCKS[cell.type].name} at position ${x},${y}`,
                                        cb: async () => {
                                            try {
                                                const removed = ship.remove(x, y);
                                                if (removed) {
                                                    await printLog('The modification is carefully dismantled from the stern.', 'sys');
                                                }
                                                setScene('shipyard_stern');
                                            } catch (e) {
                                                await printLog('The removal encounters difficulties.', 'sys');
                                            }
                                        }
                                    });
                                }
                            }
                        }
                    }
                }

                choices.push({
                    text: 'Cancel removal',
                    cb: () => setScene('shipyard_stern')
                });
            } catch (e) {
                choices.push({
                    text: 'Cancel removal',
                    cb: () => setScene('shipyard_stern')
                });
            }

            return choices;
        }
    },

    'shipyard_confirm_reinforce_bow': {
        text: () => {
            try {
                const ship = G.ship;
                if (!ship) return (sceneContext ? sceneContext() : '') + 'The ship cannot be found for modification.';
                
                // Find a suitable position for reinforced hull
                let targetX = -1, targetY = -1;
                for (let x = 1; x < ship.w - 1; x++) {
                    for (let y = 0; y < Math.floor(ship.h * 0.33); y++) {
                        if (!ship.get(x, y) && ship.get(x, y + 1)) {
                            targetX = x;
                            targetY = y;
                            break;
                        }
                    }
                    if (targetX >= 0) break;
                }
                
                if (targetX < 0) return (sceneContext ? sceneContext() : '') + 'No suitable position found for bow reinforcement.';
                
                const blockInfo = ship.showBlockInfo('reinforced_hull');
                const diff = ship.calculatePlacementDiff(targetX, targetY, 'reinforced_hull');
                
                let text = (sceneContext ? sceneContext() : '') + 'The shipwrights prepare to reinforce the bow planking.\n\n';
                text += `Block: ${blockInfo.name}\n`;
                text += `${blockInfo.description}\n\n`;
                text += `Cost: ${blockInfo.cost.timber || 0} timber, ${blockInfo.cost.metal || 0} metal\n`;
                text += `Weight: ${blockInfo.weight} tons\n\n`;
                
                if (diff) {
                    text += 'Proposed changes:\n';
                    if (diff.hullChange !== 0) text += `Hull integrity: ${diff.hullChange > 0 ? '+' : ''}${diff.hullChange} HP\n`;
                    if (diff.weightChange !== 0) text += `Displacement: ${diff.weightChange > 0 ? '+' : ''}${diff.weightChange} tons\n`;
                    if (diff.leakRateChange !== 0) text += `Leak rate: ${diff.leakRateChange > 0 ? '+' : ''}${diff.leakRateChange.toFixed(1)} units/hour\n`;
                }
                
                return text;
            } catch (e) {
                return (sceneContext ? sceneContext() : '') + 'Unable to assess the reinforcement proposal.';
            }
        },
        choices: () => [
            {
                text: 'Confirm reinforcement',
                cb: async () => {
                    try {
                        if (G.mat && G.mat.timber >= 3 && G.mat.metal >= 1) {
                            G.mat.timber -= 3;
                            G.mat.metal -= 1;
                            const ship = G.ship;
                            if (ship) {
                                let placed = false;
                                for (let x = 1; x < ship.w - 1; x++) {
                                    for (let y = 0; y < Math.floor(ship.h * 0.33); y++) {
                                        if (!ship.get(x, y) && ship.get(x, y + 1)) {
                                            if (BLOCKS.reinforced_hull) {
                                                ship.set(x, y, { type: 'reinforced_hull', hp: BLOCKS.reinforced_hull.hp });
                                                placed = true;
                                                break;
                                            }
                                        }
                                    }
                                    if (placed) break;
                                }
                            }
                            await printLog('The bow grows stronger under the shipwrights\' hammers.', 'sys');
                            setScene('shipyard_bow');
                        } else {
                            await printLog('Insufficient materials for reinforcement.', 'sys');
                            setScene('shipyard_bow');
                        }
                    } catch (e) {
                        await printLog('The reinforcement work encounters difficulties.', 'sys');
                        setScene('shipyard_bow');
                    }
                }
            },
            {
                text: 'Cancel',
                cb: () => setScene('shipyard_mid')
            }
        ]
    },

    'shipyard_confirm_cannon_bow': {
        text: () => {
            try {
                const ship = G.ship;
                if (!ship) return (sceneContext ? sceneContext() : '') + 'The ship cannot be found for modification.';
                
                // Find a suitable position for cannon
                let targetX = -1, targetY = -1;
                for (let x = 0; x < ship.w; x++) {
                    for (let y = 0; y < Math.floor(ship.h * 0.33); y++) {
                        if (!ship.get(x, y) && ship.get(x, y + 1)) {
                            targetX = x;
                            targetY = y;
                            break;
                        }
                    }
                    if (targetX >= 0) break;
                }
                
                if (targetX < 0) return (sceneContext ? sceneContext() : '') + 'No suitable position found for cannon mounting.';
                
                const blockInfo = ship.showBlockInfo('cannon');
                const diff = ship.calculatePlacementDiff(targetX, targetY, 'cannon');
                
                let text = (sceneContext ? sceneContext() : '') + 'The shipwrights prepare to mount a heavy cannon in the bow.\n\n';
                text += `Block: ${blockInfo.name}\n`;
                text += `${blockInfo.description}\n\n`;
                text += `Cost: ${blockInfo.cost.timber || 0} timber, ${blockInfo.cost.metal || 0} metal\n`;
                text += `Weight: ${blockInfo.weight} tons\n\n`;
                
                if (diff) {
                    text += 'Proposed changes:\n';
                    if (diff.hullChange !== 0) text += `Hull integrity: ${diff.hullChange > 0 ? '+' : ''}${diff.hullChange} HP\n`;
                    if (diff.weightChange !== 0) text += `Displacement: ${diff.weightChange > 0 ? '+' : ''}${diff.weightChange} tons\n`;
                    if (diff.leakRateChange !== 0) text += `Leak rate: ${diff.leakRateChange > 0 ? '+' : ''}${diff.leakRateChange.toFixed(1)} units/hour\n`;
                    if (diff.sailPowerChange !== 0) text += `Sail power: ${diff.sailPowerChange > 0 ? '+' : ''}${diff.sailPowerChange} units\n`;
                }
                
                return text;
            } catch (e) {
                return (sceneContext ? sceneContext() : '') + 'Unable to assess the cannon mounting proposal.';
            }
        },
        choices: () => [
            {
                text: 'Confirm cannon mounting',
                cb: async () => {
                    try {
                        if (G.mat && G.mat.timber >= 2 && G.mat.metal >= 4) {
                            G.mat.timber -= 2;
                            G.mat.metal -= 4;
                            const ship = G.ship;
                            if (ship) {
                                let placed = false;
                                for (let x = 0; x < ship.w; x++) {
                                    for (let y = 0; y < Math.floor(ship.h * 0.33); y++) {
                                        if (!ship.get(x, y) && ship.get(x, y + 1)) {
                                            if (BLOCKS.cannon) {
                                                ship.set(x, y, { type: 'cannon', hp: BLOCKS.cannon.hp });
                                                placed = true;
                                                break;
                                            }
                                        }
                                    }
                                    if (placed) break;
                                }
                            }
                            await printLog('A heavy cannon settles into the bow, its black muzzle gleaming.', 'sys');
                            setScene('shipyard_bow');
                        } else {
                            await printLog('Insufficient materials for cannon mounting.', 'sys');
                            setScene('shipyard_bow');
                        }
                    } catch (e) {
                        await printLog('The cannon mounting encounters difficulties.', 'sys');
                        setScene('shipyard_bow');
                    }
                }
            },
            {
                text: 'Cancel',
                cb: () => setScene('shipyard_bow')
            }
        ]
    }
}

window.shipyardScenes = shipyardScenes;
