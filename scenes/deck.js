function sceneContext() {
    const h = G.hour || 0;
    const time = h < 4 ? 'Moonless night' : h < 6 ? 'Dawn' : h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : h < 20 ? 'Dusk' : 'Night';
    const wx = G.wx || 'Clear';
    return '<span class="para sys">' + time + '. ' + wx + '. ' + (G.seaState || '') + '</span><br>';
}

function canSunSight() { return (G.hour >= 11 && G.hour <= 13 && G.wx !== 'Storm'); }
function canStarFix() { return ((G.hour >= 20 || G.hour <= 3) && G.wx !== 'Storm' && G.wx !== 'Gale'); }

const deckScenes = {
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

            // Astrology option
            if (G.hour >= 20 || G.hour <= 3) { // Only at night
                c.push({
                    text: 'Chart Constellations (1 Hour)', cb: async () => {
                        await advanceTime(1, true);
                        setScene('chart_constellation');
                    }
                });
            }

            // Inventory management
            c.push({
                text: 'Manage Inventory (1 Hour)', cb: async () => {
                    await advanceTime(1, true);
                    setScene('inventory');
                }
            });

            c.push({
                text: 'Visit Shipyard (1 Hour)',
                cb: async () => {
                    await advanceTime(1, true);
                    setScene('shipyard');
                }
            });

            // Maintenance Actions (available at sea)
            c.push({
                text: 'Patch Hull Planking (1 Hour)',
                cb: async () => {
                    if (G.mat && G.mat.timber >= 1) {
                        G.mat.timber -= 1;
                        const st = G.ship ? G.ship.getStats() : { leakRate: 0 };
                        const leakReduction = Math.min(2, st.leakRate * 0.5);
                        // Apply leak rate reduction effect (would need grid.js extension)
                        await printLog('You work methodically, sealing leaks with fresh timber. The hull feels tighter beneath your feet.', 'normal');
                        await advanceTime(1);
                    } else {
                        await printLog('You lack the timber needed for hull repairs.', 'sys');
                    }
                }
            });

            c.push({
                text: 'Adjust Rigging (1 Hour)',
                cb: async () => {
                    if (G.mat && G.mat.rope >= 1) {
                        G.mat.rope -= 1;
                        await printLog('You climb the rigging, tightening lines and adjusting blocks. The sails respond more crisply to the wind.', 'normal');
                        await advanceTime(1);
                    } else {
                        await printLog('You lack the rope needed for rigging adjustments.', 'sys');
                    }
                }
            });

            c.push({
                text: 'Pump Ballast (1 Hour)',
                cb: async () => {
                    if (G.mat && G.mat.metal >= 1) {
                        G.mat.metal -= 1;
                        await printLog('You work the ballast pumps, shifting weight to steady the ship\'s roll. The deck levels under your feet.', 'normal');
                        await advanceTime(1);
                    } else {
                        await printLog('You lack the materials needed for ballast adjustment.', 'sys');
                    }
                }
            });

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

    'maneuver': {
        text: () => sceneContext() + 'The wind stands ahead of you. Tacking gains ground but strains the hull. Wearing is safer but loses distance.',
        choices: () => [
            { text: 'Tack Through (1 Hour)', cb: () => { G.heading = G.pendingHeading; G.maneuver = 'tack'; advanceTime(1); setScene('deck'); } },
            { text: 'Wear Ship (1 Hour)', cb: () => { G.heading = G.pendingHeading; G.maneuver = 'wear'; advanceTime(1); setScene('deck'); } },
            { text: 'Hold Course', cb: () => setScene('deck') }
        ]
    }
};

window.deckScenes = deckScenes;
window.sceneContext = sceneContext;
window.canSunSight = canSunSight;
window.canStarFix = canStarFix;
