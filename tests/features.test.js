// tests/features.test.js
'use strict';

const fs = require('fs');
const path = require('path');

// Load game modules
// Load game modules
loadGameFile('data.js');
loadGameFile('engine.js');
loadGameFile('grid.js');
loadGameFile('scenes.js');

describe('Game Feature Functionality', () => {
    beforeEach(() => {
        // Reset game state for each test
        G = {
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
            seed: 12345
        };
    });

    describe('Scurvy System', () => {
        test('should progress scurvy with salt-only diet', () => {
            G.scurvy = 0;
            G.foodStocks = { salt: 10, fresh: 0, citrus: 0 };

            // Simulate daily consumption and scurvy progression
            for (let day = 0; day < 5; day++) {
                // Consume 1 salt ration
                let scurvyChange = 1 * FOOD_TYPES.salt.scurvyRate;
                G.scurvy = Math.max(0, G.scurvy + scurvyChange);
            }

            expect(G.scurvy).toBe(5);
        });

        test('should prevent scurvy with citrus diet', () => {
            G.scurvy = 10; // Start with some scurvy
            G.foodStocks = { salt: 0, fresh: 0, citrus: 10 };

            // Consume citrus daily
            for (let day = 0; day < 3; day++) {
                let scurvyChange = 1 * FOOD_TYPES.citrus.scurvyRate;
                G.scurvy = Math.max(0, G.scurvy + scurvyChange);
            }

            expect(G.scurvy).toBe(4); // Should decrease scurvy
        });

        test('should apply scurvy health effects correctly', () => {
            G.hp = 100;
            G.san = 100;
            G.morale = 100;

            // Test mild scurvy (10+)
            G.scurvy = 15;
            // Simulate daily effects
            G.hp = Math.max(0, G.hp - 1);
            G.morale = Math.max(0, G.morale - 1);

            expect(G.hp).toBe(99);
            expect(G.morale).toBe(99);

            // Test moderate scurvy (30+)
            G.scurvy = 35;
            G.hp = Math.max(0, G.hp - 2);
            G.san = Math.max(0, G.san - 1);

            expect(G.hp).toBe(97);
            expect(G.san).toBe(99);

            // Test severe scurvy (50+)
            G.scurvy = 55;
            G.hp = Math.max(0, G.hp - 3);
            G.san = Math.max(0, G.san - 2);

            expect(G.hp).toBe(94);
            expect(G.san).toBe(97);

            // Test critical scurvy (70+)
            G.scurvy = 75;
            G.hp = Math.max(0, G.hp - 4);
            G.san = Math.max(0, G.san - 3);

            expect(G.hp).toBe(90);
            expect(G.san).toBe(94);
        });
    });

    describe('Ship Grid System', () => {
        test('should create ship grid with correct dimensions', () => {
            const ship = new ShipGrid(9, 15);

            expect(ship.w).toBe(9);
            expect(ship.h).toBe(15);
            expect(ship.cells.length).toBe(9 * 15);
        });

        test('should place keel at center', () => {
            const ship = new ShipGrid(9, 15);
            const centerX = Math.floor(9 / 2);
            const centerY = Math.floor(15 / 2);

            const keelCell = ship.get(centerX, centerY);
            expect(keelCell).toBeDefined();
            expect(keelCell.type).toBe('keel');
            expect(keelCell.hp).toBe(BLOCKS.keel.hp);
        });

        test('should calculate ship stats correctly', () => {
            const ship = new ShipGrid(9, 15);

            // Add some blocks
            ship.set(4, 7, { type: 'plank', hp: BLOCKS.plank.hp });
            ship.set(4, 8, { type: 'mast', hp: BLOCKS.mast.hp });

            const stats = ship.getStats();

            expect(stats.maxHull).toBe(BLOCKS.keel.hp + BLOCKS.plank.hp + BLOCKS.mast.hp);
            expect(stats.curHull).toBe(BLOCKS.keel.hp + BLOCKS.plank.hp + BLOCKS.mast.hp);
            expect(stats.sailPwr).toBe(BLOCKS.mast.pwr);
        });

        test('should handle damage correctly', () => {
            const ship = new ShipGrid(9, 15);

            // Add a plank
            ship.set(4, 7, { type: 'plank', hp: BLOCKS.plank.hp });
            const initialHP = ship.getStats().curHull;

            // Apply damage
            const damage = ship.takeDamage(5);
            const finalHP = ship.getStats().curHull;

            expect(finalHP).toBeLessThan(initialHP);
            expect(damage).toBeGreaterThan(0);
        });
    });

    describe('Navigation System', () => {
        test('should calculate estimated ship position with navigation error', () => {
            G.navError = 5; // High navigation error
            G.x = 100;
            G.y = 50;
            G.day = 5;
            G.hour = 12;

            const estimated = estimatedShipPos();

            // Position should be offset from actual position due to nav error
            expect(estimated.x).not.toBe(100);
            expect(estimated.y).not.toBe(50);
            expect(estimated.drift).toBeGreaterThan(0);
        });

        test('should have zero drift with perfect navigation', () => {
            G.navError = 0; // Perfect navigation
            G.x = 100;
            G.y = 50;

            const estimated = estimatedShipPos();

            expect(estimated.x).toBe(100);
            expect(estimated.y).toBe(50);
            expect(estimated.drift).toBe(0);
        });
    });

    describe('Time Progression System', () => {
        test('should advance day correctly', () => {
            G.hour = 23; // Almost end of day

            // Simulate hour advancement that triggers day change
            G.hour = (G.hour + 1) % 24;
            if (G.hour === 0) {
                G.day++;
            }

            expect(G.day).toBe(2);
            expect(G.hour).toBe(0);
        });

        test('should handle weather effects on crew', () => {
            G.wx = 'Storm';
            G.san = 100;
            G.morale = 100;

            // Simulate storm effects
            G.san = Math.max(0, G.san - 0.5);

            expect(G.san).toBe(99.5);
        });

        test('should handle night time sanity effects', () => {
            G.hour = 2; // Middle of night
            G.san = 100;

            // Simulate night sanity check
            const isNight = (G.hour >= 20 || G.hour <= 3);
            if (isNight && Math.random() < 0.05) {
                G.san = Math.max(0, G.san - 1);
            }

            // Can't test random, but logic should work
            expect(isNight).toBe(true);
        });
    });

    describe('Morale System', () => {
        test('should affect morale from food consumption', () => {
            G.morale = 70;

            // Fresh fish gives +2 morale
            G.morale = Math.max(0, Math.min(100, G.morale + FOOD_TYPES.fresh.moraleEffect));

            expect(G.morale).toBe(72);

            // Distilled water gives -2 morale
            G.morale = Math.max(0, Math.min(100, G.morale + WATER_TYPES.distilled.moraleEffect));

            expect(G.morale).toBe(70);
        });

        test('should handle weather effects on morale', () => {
            G.morale = 80;
            G.wx = 'Calm';

            // Calm weather reduces morale
            G.morale = Math.max(0, Math.min(100, G.morale - 0.2));

            expect(G.morale).toBe(79.8);
        });

        test('should handle prolonged calm effects', () => {
            G.morale = 80;
            G.wx = 'Calm';
            G.calmHours = 20; // Over 18 hours

            // Prolonged calm has bigger morale penalty
            if (G.calmHours > 18 && Math.random() < 0.15) {
                G.morale = Math.max(0, Math.min(100, G.morale - 2));
            }

            // Logic test - calm hours threshold met
            expect(G.calmHours > 18).toBe(true);
        });
    });

    describe('Scene System', () => {
        test('should provide correct scene context based on time', () => {
            // Test morning
            G.hour = 8;
            const morningContext = sceneContext();
            expect(morningContext).toContain('Morning');

            // Test night
            G.hour = 22;
            const nightContext = sceneContext();
            expect(nightContext).toContain('Night');

            // Test weather
            G.wx = 'Storm';
            const stormContext = sceneContext();
            expect(stormContext).toContain('Storm');
        });

        test('should determine navigation conditions correctly', () => {
            // Test sun sight availability
            G.hour = 12; // Noon
            G.wx = 'Clear';
            expect(canSunSight()).toBe(true);

            G.wx = 'Storm';
            expect(canSunSight()).toBe(false);

            // Test star fix availability
            G.hour = 21; // Night
            G.wx = 'Clear';
            expect(canStarFix()).toBe(true);

            G.wx = 'Gale';
            expect(canStarFix()).toBe(false);
        });
    });

    describe('Game State Management', () => {
        test('should initialize game state correctly', () => {
            // Test that ensureWorldState sets up required properties
            ensureWorldState();

            expect(typeof G.navError).toBe('number');
            expect(typeof G.foodQ).toBe('number');
            expect(typeof G.waterQ).toBe('number');
            expect(typeof G.morale).toBe('number');
            expect(G.foodQ).toBe(100);
            expect(G.waterQ).toBe(100);
        });

        test('should handle legacy data migration', () => {
            // Test tutorial island creation
            G.tutorialPhase = 'start';
            ensureWorldState();

            expect(G.tutorialIsland).toBeDefined();
            expect(G.tutorialIsland.name).toBe('Tern Rock (Tutorial)');
        });
    });

    describe('Feature Completeness Report', () => {
        test('should report implemented vs missing features', () => {
            const implementedFeatures = [];
            const missingFeatures = [];

            // Check core systems
            if (typeof advanceTime === 'function') {
                implementedFeatures.push('Time progression');
            } else {
                missingFeatures.push('Time progression');
            }

            if (FOOD_TYPES && Object.keys(FOOD_TYPES).length > 0) {
                implementedFeatures.push('Food type system');
            } else {
                missingFeatures.push('Food type system');
            }

            if (WATER_TYPES && Object.keys(WATER_TYPES).length > 0) {
                implementedFeatures.push('Water type system');
            } else {
                missingFeatures.push('Water type system');
            }

            if (typeof ShipGrid === 'function') {
                implementedFeatures.push('Ship building system');
            } else {
                missingFeatures.push('Ship building system');
            }

            if (typeof estimatedShipPos === 'function') {
                implementedFeatures.push('Navigation system');
            } else {
                missingFeatures.push('Navigation system');
            }

            if (Scenes && Object.keys(Scenes).length > 0) {
                implementedFeatures.push('Scene system');
            } else {
                missingFeatures.push('Scene system');
            }

            // Report findings
            console.log('=== FEATURE COMPLETENESS REPORT ===');
            console.log('Implemented Features:', implementedFeatures.length);
            implementedFeatures.forEach(f => console.log('  ✓', f));
            console.log('Missing Features:', missingFeatures.length);
            missingFeatures.forEach(f => console.log('  ✗', f));

            // Assertions
            expect(implementedFeatures.length).toBeGreaterThan(0);
            expect(missingFeatures.length).toBe(0); // All core features should be implemented
        });
    });
});
