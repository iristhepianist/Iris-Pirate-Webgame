// tests/grid.test.js
'use strict';

// Load game modules
loadGameFile('data.js');
loadGameFile('grid.js');

describe('ShipGrid Class', () => {
    let shipGrid;

    beforeEach(() => {
        shipGrid = new ShipGrid(9, 15);
    });

    describe('constructor', () => {
        test('should initialize with correct dimensions', () => {
            expect(shipGrid.w).toBe(9);
            expect(shipGrid.h).toBe(15);
            expect(shipGrid.cells).toHaveLength(135); // 9 * 15
        });

        test('should place keel at center', () => {
            const keel = shipGrid.get(shipGrid.cx, shipGrid.cy);
            expect(keel).not.toBeNull();
            expect(keel.type).toBe('keel');
            expect(keel.hp).toBe(BLOCKS.keel.hp);
        });

        test('should calculate center coordinates correctly', () => {
            expect(shipGrid.cx).toBe(4); // Math.floor(9/2)
            expect(shipGrid.cy).toBe(7); // Math.floor(15/2)
        });
    });

    describe('coordinate methods', () => {
        test('idx should calculate correct array index', () => {
            expect(shipGrid.idx(0, 0)).toBe(0);
            expect(shipGrid.idx(1, 0)).toBe(1);
            expect(shipGrid.idx(0, 1)).toBe(9); // width * y
            expect(shipGrid.idx(4, 7)).toBe(4 + 7 * 9); // center position
        });

        test('get should return null for out of bounds', () => {
            expect(shipGrid.get(-1, 0)).toBeNull();
            expect(shipGrid.get(9, 0)).toBeNull();
            expect(shipGrid.get(0, -1)).toBeNull();
            expect(shipGrid.get(0, 15)).toBeNull();
        });

        test('get should return correct cell data', () => {
            const keel = shipGrid.get(shipGrid.cx, shipGrid.cy);
            expect(keel.type).toBe('keel');
        });

        test('set should place blocks correctly', () => {
            shipGrid.set(4, 6, { type: 'plank', hp: 20 });
            const plank = shipGrid.get(4, 6);
            expect(plank.type).toBe('plank');
            expect(plank.hp).toBe(20);
        });

        test('set should ignore out of bounds', () => {
            const originalCells = [...shipGrid.cells];
            shipGrid.set(-1, 0, { type: 'plank', hp: 20 });
            shipGrid.set(9, 0, { type: 'plank', hp: 20 });
            expect(shipGrid.cells).toEqual(originalCells);
        });
    });

    describe('remove method', () => {
        test('should remove blocks and check integrity', () => {
            shipGrid.set(4, 6, { type: 'plank', hp: 20 });
            const result = shipGrid.remove(4, 6);
            expect(shipGrid.get(4, 6)).toBeNull();
            expect(typeof result).toBe('boolean');
        });

        test('should return false when removing connected blocks', () => {
            shipGrid.set(4, 6, { type: 'plank', hp: 20 });
            const result = shipGrid.remove(4, 6);
            expect(result).toBe(false); // No blocks should drop when removing adjacent to keel
        });
    });

    describe('checkIntegrity method', () => {
        test('should keep connected blocks', () => {
            shipGrid.set(4, 6, { type: 'plank', hp: 20 });
            shipGrid.set(4, 8, { type: 'plank', hp: 20 });

            shipGrid.checkIntegrity();

            expect(shipGrid.get(4, 6)).not.toBeNull();
            expect(shipGrid.get(4, 8)).not.toBeNull();
            expect(shipGrid.get(shipGrid.cx, shipGrid.cy)).not.toBeNull();
        });

        test('should remove disconnected blocks', () => {
            // Place a block far from keel
            shipGrid.set(0, 0, { type: 'plank', hp: 20 });

            const hadBlock = shipGrid.get(0, 0) !== null;
            shipGrid.checkIntegrity();
            const hasBlock = shipGrid.get(0, 0) !== null;

            expect(hadBlock).toBe(true);
            expect(hasBlock).toBe(false);
        });

        test('should return true when blocks are dropped', () => {
            shipGrid.set(0, 0, { type: 'plank', hp: 20 });
            const result = shipGrid.checkIntegrity();
            expect(result).toBe(true);
        });

        test('should return false when no blocks are dropped', () => {
            shipGrid.set(4, 6, { type: 'plank', hp: 20 });
            const result = shipGrid.checkIntegrity();
            expect(result).toBe(false);
        });
    });

    describe('getStats method', () => {
        test('should return default stats for empty ship', () => {
            const stats = shipGrid.getStats();

            expect(stats.maxHull).toBe(BLOCKS.keel.hp);
            expect(stats.curHull).toBe(BLOCKS.keel.hp);
            expect(stats.wgt).toBe(BLOCKS.keel.wgt);
            expect(stats.sailPwr).toBe(0);
            expect(stats.maxWater).toBe(10);
            expect(stats.maxFood).toBe(10);
            expect(stats.pumpRate).toBe(0);
            expect(stats.stayCount).toBe(0);
            expect(stats.mastCount).toBe(0);
        });

        test('should calculate stats correctly with multiple blocks', () => {
            shipGrid.set(4, 6, { type: 'plank', hp: 20 });
            shipGrid.set(4, 8, { type: 'mast', hp: 40 });
            shipGrid.set(3, 7, { type: 'stay', hp: 15 });
            shipGrid.set(5, 7, { type: 'cask', hp: 15 });

            const stats = shipGrid.getStats();

            expect(stats.maxHull).toBeGreaterThan(BLOCKS.keel.hp);
            expect(stats.curHull).toBeGreaterThan(BLOCKS.keel.hp);
            expect(stats.wgt).toBeGreaterThan(BLOCKS.keel.wgt);
            expect(stats.sailPwr).toBe(BLOCKS.mast.pwr);
            expect(stats.maxWater).toBe(10 + BLOCKS.cask.cap);
            expect(stats.stayCount).toBe(1);
            expect(stats.mastCount).toBe(1);
        });

        test('should track damaged blocks correctly', () => {
            shipGrid.set(4, 6, { type: 'plank', hp: 5 }); // Damaged plank (20 * 0.25)
            const stats = shipGrid.getStats();

            expect(stats.curHull).toBe(BLOCKS.keel.hp + 5);
            expect(stats.maxHull).toBe(BLOCKS.keel.hp + BLOCKS.plank.hp);
        });

        test('should detect unsealed hull blocks', () => {
            shipGrid.set(4, 6, { type: 'plank', hp: 20 });
            const stats = shipGrid.getStats();
            expect(stats.unsealed).toBe(1);

            shipGrid.get(4, 6).sealed = true;
            const stats2 = shipGrid.getStats();
            expect(stats2.unsealed).toBe(0);
        });
    });

    describe('edge cases', () => {
        test('should handle maximum grid size', () => {
            const largeGrid = new ShipGrid(50, 50);
            expect(largeGrid.cells).toHaveLength(2500);
            expect(largeGrid.get(25, 25)).not.toBeNull(); // Keel should be placed
        });

        test('should handle minimum grid size', () => {
            const smallGrid = new ShipGrid(1, 1);
            expect(smallGrid.cells).toHaveLength(1);
            expect(smallGrid.get(0, 0)).not.toBeNull(); // Keel should be placed
        });

        test('should handle rapid block placement and removal', () => {
            for (let i = 0; i < 100; i++) {
                const x = Math.floor(Math.random() * 9);
                const y = Math.floor(Math.random() * 15);
                shipGrid.set(x, y, { type: 'plank', hp: 20 });
                shipGrid.checkIntegrity();
            }

            // Should not crash and keel should still exist
            expect(shipGrid.get(shipGrid.cx, shipGrid.cy)).not.toBeNull();
        });
    });
});
