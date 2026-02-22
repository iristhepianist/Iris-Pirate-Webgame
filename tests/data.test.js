// tests/data.test.js
'use strict';

describe('Data Utilities', () => {
    describe('hash functions', () => {
        test('hash32 should return consistent values for same input', () => {
            const input = 12345;
            const result1 = hash32(input);
            const result2 = hash32(input);
            expect(result1).toBe(result2);
            expect(typeof result1).toBe('number');
            expect(result1).toBeGreaterThanOrEqual(0);
            expect(result1).toBeLessThan(4294967296); // 2^32
        });

        test('hash32 should return different values for different inputs', () => {
            const result1 = hash32(12345);
            const result2 = hash32(54321);
            expect(result1).not.toBe(result2);
        });

        test('hash3i should combine three values consistently', () => {
            const result1 = hash3i(10, 20, 12345);
            const result2 = hash3i(10, 20, 12345);
            expect(result1).toBe(result2);
            expect(typeof result1).toBe('number');
        });

        test('hash01 should return values between 0 and 1', () => {
            const result = hash01(10, 20, 12345);
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThan(1);
        });

        test('hash01 should use salt parameter correctly', () => {
            const result1 = hash01(10, 20, 12345, 0);
            const result2 = hash01(10, 20, 12345, 1);
            expect(result1).not.toBe(result2);
        });
    });

    describe('utility functions', () => {
        test('clamp should limit values within range', () => {
            expect(clamp(5, 0, 10)).toBe(5);
            expect(clamp(-5, 0, 10)).toBe(0);
            expect(clamp(15, 0, 10)).toBe(10);
        });

        test('rr should return random numbers', () => {
            const result1 = rr();
            const result2 = rr();
            expect(result1).toBeGreaterThanOrEqual(0);
            expect(result1).toBeLessThan(1);
            expect(result2).toBeGreaterThanOrEqual(0);
            expect(result2).toBeLessThan(1);
        });

        test('rInt should return integers within range', () => {
            const result = rInt(100);
            expect(Number.isInteger(result)).toBe(true);
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThan(100);
        });
    });

    describe('coordinate utilities', () => {
        test('chunkKey should format coordinates correctly', () => {
            expect(chunkKey(5, 10)).toBe('5,10');
            expect(chunkKey(-3, 7)).toBe('-3,7');
        });

        test('getChunkCoord should calculate chunk coordinates', () => {
            const result = getChunkCoord(150, 250);
            expect(result.cx).toBe(Math.floor(150 / WORLD.chunkSize));
            expect(result.cy).toBe(Math.floor(250 / WORLD.chunkSize));
        });

        test('islandId should format island identifiers', () => {
            expect(islandId(5, 10, 2)).toBe('5,10:2');
            expect(islandId(-3, 7, 0)).toBe('-3,7:0');
        });
    });

    describe('constants', () => {
        test('WORLD constants should be defined', () => {
            expect(WORLD.chunkSize).toBe(80);
            expect(WORLD.islandChance).toBe(0.22);
            expect(WORLD.maxIslandsPerChunk).toBe(2);
            expect(WORLD.encounterRadius).toBe(10);
            expect(WORLD.sightingRadius).toBe(40);
            expect(WORLD.fogRevealRadius).toBe(40);
            expect(WORLD.fogCellSize).toBe(8);
        });

        test('DIRS should contain 8 directions', () => {
            expect(DIRS).toHaveLength(8);
            expect(DIRS).toContain('N');
            expect(DIRS).toContain('NE');
            expect(DIRS).toContain('E');
            expect(DIRS).toContain('SE');
            expect(DIRS).toContain('S');
            expect(DIRS).toContain('SW');
            expect(DIRS).toContain('W');
            expect(DIRS).toContain('NW');
        });

        test('DIR_V should have corresponding vectors', () => {
            expect(DIR_V).toHaveLength(8);
            expect(DIR_V[0]).toEqual([0, -1]); // N
            expect(DIR_V[2]).toEqual([1, 0]);  // E
            expect(DIR_V[4]).toEqual([0, 1]);  // S
            expect(DIR_V[6]).toEqual([-1, 0]); // W
        });

        test('BLOCKS should contain required ship components', () => {
            expect(BLOCKS.keel).toBeDefined();
            expect(BLOCKS.plank).toBeDefined();
            expect(BLOCKS.mast).toBeDefined();
            expect(BLOCKS.stay).toBeDefined();
            expect(BLOCKS.ballast).toBeDefined();
            expect(BLOCKS.cask).toBeDefined();
            expect(BLOCKS.pantry).toBeDefined();
            expect(BLOCKS.pump).toBeDefined();
        });

        test('block properties should be valid', () => {
            Object.values(BLOCKS).forEach(block => {
                expect(block.id).toBeDefined();
                expect(block.name).toBeDefined();
                expect(block.hp).toBeGreaterThan(0);
                expect(block.wgt).toBeGreaterThanOrEqual(0);
                expect(block.func).toBeDefined();
                expect(block.desc).toBeDefined();
            });
        });
    });

    describe('island names', () => {
        test('I_NAMES should contain valid island names', () => {
            expect(I_NAMES).toHaveLength(7);
            I_NAMES.forEach(name => {
                expect(typeof name).toBe('string');
                expect(name.length).toBeGreaterThan(0);
            });
        });
    });
});
