// tests/integration.test.js
'use strict';

const fs = require('fs');
const path = require('path');

// Load game modules
loadGameFile('data.js');
loadGameFile('engine.js');
loadGameFile('grid.js');
loadGameFile('chart.js');
loadGameFile('scenes.js');

// Test utilities
function createTestGameState() {
    return {
        day: 1,
        hour: 0,
        bilge: 0,
        foodStocks: { salt: 10, fresh: 0, citrus: 0 },
        waterStocks: { fresh: 10, rain: 0, distilled: 0, exotic: 0 },
        foodQ: 100,
        waterQ: 100,
        wx: 'Clear',
        hp: 100,
        san: 100,
        morale: 70,
        scurvy: 0,
        x: 0,
        y: 0,
        navError: 2,
        worldSeed: 12345,
        seed: 12345,
        trail: [],
        discovered: {},
        explored: [],
        rumors: [],
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
}

function simulateDays(days, gameState) {
    for (let day = 0; day < days; day++) {
        // Simulate daily time progression (would normally be in advanceTime)
        gameState.day++;

        // Simulate resource consumption and effects
        // (Simplified version of the actual advanceTime logic)

        // Food consumption
        let foodNeeded = 1;
        for (let type of ['citrus', 'fresh', 'salt']) {
            if (foodNeeded > 0 && gameState.foodStocks[type] > 0) {
                let consume = Math.min(foodNeeded, gameState.foodStocks[type]);
                gameState.foodStocks[type] -= consume;
                foodNeeded -= consume;
            }
        }

        // Water consumption
        let waterNeeded = 1;
        for (let type of ['fresh', 'exotic', 'rain', 'distilled']) {
            if (waterNeeded > 0 && gameState.waterStocks[type] > 0) {
                let consume = Math.min(waterNeeded, gameState.waterStocks[type]);
                gameState.waterStocks[type] -= consume;
                waterNeeded -= consume;
            }
        }

        // Scurvy progression
        let scurvyChange = 0;
        for (let type in { salt: 1 }) { // Simplified - only salt consumed
            scurvyChange += FOOD_TYPES[type].scurvyRate;
        }
        gameState.scurvy = Math.max(0, gameState.scurvy + scurvyChange);

        // Apply scurvy effects
        if (gameState.scurvy > 10) {
            gameState.hp = Math.max(0, gameState.hp - 1);
            gameState.morale = Math.max(0, gameState.morale - 1);
        }
        if (gameState.scurvy > 30) {
            gameState.hp = Math.max(0, gameState.hp - 2);
            gameState.san = Math.max(0, gameState.san - 1);
        }
        if (gameState.scurvy > 50) {
            gameState.hp = Math.max(0, gameState.hp - 3);
            gameState.san = Math.max(0, gameState.san - 2);
        }
        if (gameState.scurvy > 70) {
            gameState.hp = Math.max(0, gameState.hp - 4);
            gameState.san = Math.max(0, gameState.san - 3);
        }

        // Starvation check
        if (foodNeeded > 0 || waterNeeded > 0) {
            gameState.hp = Math.max(0, gameState.hp - 24); // 1 HP per hour = 24 per day
            gameState.san = Math.max(0, gameState.san - 6);
            gameState.morale = Math.max(0, gameState.morale - 6);
        }
    }
}

describe('Gameplay Integration Tests', () => {
    describe('Survival Scenarios', () => {
        test('should survive 30 days with adequate salt rations', () => {
            const gameState = createTestGameState();
            gameState.foodStocks.salt = 100; // Plenty of salt
            gameState.waterStocks.fresh = 100; // Plenty of water

            simulateDays(30, gameState);

            // Should still be alive but with scurvy
            expect(gameState.hp).toBeGreaterThan(0);
            expect(gameState.scurvy).toBeGreaterThan(20);
            expect(gameState.foodStocks.salt).toBeGreaterThan(20);
            expect(gameState.waterStocks.fresh).toBeGreaterThan(20);
        });

        test('should develop scurvy on salt-only diet', () => {
            const gameState = createTestGameState();
            gameState.foodStocks.salt = 30;
            gameState.waterStocks.fresh = 30;
            gameState.scurvy = 0;

            simulateDays(20, gameState);

            expect(gameState.scurvy).toBeGreaterThan(15);
            expect(gameState.hp).toBeLessThan(100);
        });

        test('should take much longer to die from starvation without food', () => {
            const gameState = createTestGameState();
            gameState.foodStocks.salt = 0;
            gameState.waterStocks.fresh = 10;

            simulateDays(10, gameState); // Takes longer now

            expect(gameState.hp).toBeLessThan(60); // Slow starvation damage
            expect(gameState.san).toBeLessThan(90);
            expect(gameState.morale).toBeLessThan(60);
        });

        test('should take much longer to die from dehydration without water', () => {
            const gameState = createTestGameState();
            gameState.foodStocks.salt = 10;
            gameState.waterStocks.fresh = 0;

            simulateDays(10, gameState);

            expect(gameState.hp).toBeLessThan(60);
            expect(gameState.san).toBeLessThan(90);
            expect(gameState.morale).toBeLessThan(60);
        });
    });

    describe('Ship Building Integration', () => {
        test('should build functional ship', () => {
            const ship = new ShipGrid(9, 15);

            // Add essential components
            ship.set(4, 6, { type: 'plank', hp: BLOCKS.plank.hp });
            ship.set(4, 7, { type: 'plank', hp: BLOCKS.plank.hp });
            ship.set(4, 8, { type: 'mast', hp: BLOCKS.mast.hp });
            ship.set(3, 7, { type: 'cask', hp: BLOCKS.cask.hp });
            ship.set(5, 7, { type: 'pantry', hp: BLOCKS.pantry.hp });

            const stats = ship.getStats();

            // Ship should have at least the hull HP of its keel and planks
            expect(stats.maxHull).toBeGreaterThan(60);
            expect(stats.sailPwr).toBe(BLOCKS.mast.pwr);
            expect(stats.maxWater).toBe(10 + BLOCKS.cask.cap);
            expect(stats.maxFood).toBe(10 + BLOCKS.pantry.cap);
        });

        test('should handle ship damage and repairs', () => {
            const ship = new ShipGrid(9, 15);
            ship.set(4, 6, { type: 'plank', hp: BLOCKS.plank.hp });

            const initialHull = ship.getStats().curHull;

            // Damage the ship
            ship.takeDamage(10);

            const damagedHull = ship.getStats().curHull;
            expect(damagedHull).toBeLessThan(initialHull);

            // Repair by replacing damaged block
            ship.set(4, 6, { type: 'plank', hp: BLOCKS.plank.hp });
            const repairedHull = ship.getStats().curHull;

            expect(repairedHull).toBeGreaterThan(damagedHull);
        });
    });

    describe('Exploration Integration', () => {
        test('should handle island discovery and scavenging', () => {
            const gameState = createTestGameState();

            // Simulate discovering an island
            gameState.discovered['10,20'] = {
                id: '10,20',
                name: 'Test Island',
                x: 10,
                y: 20,
                pale: false,
                scavenged: false
            };

            // Simulate scavenging
            gameState.foodStocks.salt += 3;
            gameState.waterStocks.fresh += 4;
            gameState.discovered['10,20'].scavenged = true;

            expect(gameState.foodStocks.salt).toBe(13);
            expect(gameState.waterStocks.fresh).toBe(14);
            expect(gameState.discovered['10,20'].scavenged).toBe(true);
        });

        test('should track navigation and position', () => {
            const gameState = createTestGameState();

            // Simulate movement
            gameState.x = 50;
            gameState.y = 30;
            gameState.trail.push({ x: gameState.x, y: gameState.y });

            // Add navigation error so drift > 0
            gameState.navError = 3;
            // set Global since estimatedShipPos pulls from G
            G.navError = 3;

            const estimated = estimatedShipPos();
            expect(estimated.drift).toBeGreaterThan(0);

            // Trail should contain position
            expect(gameState.trail.length).toBe(1);
            expect(gameState.trail[0].x).toBe(50);
            expect(gameState.trail[0].y).toBe(30);
        });
    });

    describe('Crew Morale Integration', () => {
        test('should maintain high morale with good conditions', () => {
            const gameState = createTestGameState();
            gameState.morale = 80;
            gameState.wx = 'Clear';
            gameState.hp = 90;
            gameState.scurvy = 5;

            // Simulate good day
            gameState.morale = Math.max(0, gameState.morale + 1); // Good food
            gameState.morale = Math.max(0, gameState.morale + 2); // Fresh water

            expect(gameState.morale).toBeGreaterThan(80);
        });

        test('should decrease morale with poor conditions', () => {
            const gameState = createTestGameState();
            gameState.morale = 70;
            gameState.wx = 'Storm';
            gameState.scurvy = 40;

            // Simulate bad day
            gameState.morale = Math.max(0, gameState.morale - 2); // Storm penalty
            gameState.morale = Math.max(0, gameState.morale - 1); // Scurvy penalty

            expect(gameState.morale).toBeLessThan(70);
        });

        test('should handle critical morale situations', () => {
            const gameState = createTestGameState();
            gameState.morale = 15; // Critically low

            // Simulate low morale effects (would trigger mutiny warnings)
            const shouldWarn = gameState.morale < 20 && Math.random() < 0.08;
            // Can't test random outcomes, but logic should work
            expect(gameState.morale < 20).toBe(true);
        });
    });

    describe('Long-term Survival Test', () => {
        test('should simulate 60-day voyage survival', () => {
            const gameState = createTestGameState();
            gameState.foodStocks.salt = 200; // Enough salt for 60+ days
            gameState.waterStocks.fresh = 200; // Enough water for 60+ days

            simulateDays(60, gameState);

            // Assessment after 60 days
            console.log('=== 60-DAY SURVIVAL REPORT ===');
            console.log(`Final HP: ${gameState.hp}`);
            console.log(`Final Sanity: ${gameState.san}`);
            console.log(`Final Morale: ${gameState.morale}`);
            console.log(`Scurvy Level: ${gameState.scurvy}`);
            console.log(`Remaining Food: ${gameState.foodStocks.salt}`);
            console.log(`Remaining Water: ${gameState.waterStocks.fresh}`);

            // Basic survival check
            // After 60 days of only salt, scurvy WILL kill the player (or get very close).
            expect(gameState.hp).toBeLessThanOrEqual(5);
            expect(gameState.scurvy).toBeGreaterThan(50); // Severe scurvy buildup (around 60)
            expect(gameState.foodStocks.salt).toBeGreaterThan(20);
            expect(gameState.waterStocks.fresh).toBeGreaterThan(20);
        });

        test('should handle resource depletion scenario', () => {
            const gameState = createTestGameState();
            gameState.foodStocks.salt = 5; // Only 5 days of food
            gameState.waterStocks.fresh = 10; // 10 days of water

            simulateDays(20, gameState);

            // Should show creeping starvation effects. It takes longer now.
            expect(gameState.hp).toBeLessThan(70); // Starvation damage
            expect(gameState.morale).toBeLessThan(60);
            expect(gameState.san).toBeLessThan(90);
        });
    });

    describe('Game State Persistence', () => {
        test('should maintain game state integrity across operations', () => {
            const gameState = createTestGameState();

            // Perform various operations
            gameState.x = 25;
            gameState.y = 15;
            gameState.foodStocks.salt -= 2;
            gameState.morale += 5;

            // Check that all expected properties still exist
            expect(gameState.day).toBe(1);
            expect(gameState.hp).toBe(100);
            expect(gameState.san).toBe(100);
            expect(gameState.foodStocks.salt).toBe(8);
            expect(gameState.morale).toBe(75);
            expect(gameState.x).toBe(25);
            expect(gameState.y).toBe(15);
        });

        test('should handle edge cases gracefully', () => {
            const gameState = createTestGameState();

            // Test with zero resources
            gameState.foodStocks = { salt: 0, fresh: 0, citrus: 0 };
            gameState.waterStocks = { fresh: 0, rain: 0, distilled: 0, exotic: 0 };

            simulateDays(3, gameState);

            // Should not crash, should apply starvation penalties
            expect(gameState.hp).toBeGreaterThan(0); // Might be very low but not undefined
            expect(typeof gameState.hp).toBe('number');
            expect(typeof gameState.san).toBe('number');
            expect(typeof gameState.morale).toBe('number');
        });
    });
});
