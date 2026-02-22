// tests/basic.test.js
'use strict';

// Load game modules directly in test
const fs = require('fs');
const path = require('path');

// Load and evaluate data.js first
loadGameFile('data.js');

describe('Basic Game Functions', () => {
    test('should run a basic test', () => {
        expect(1 + 1).toBe(2);
    });

    test('should have access to basic utilities', () => {
        expect(typeof clamp).toBe('function');
        expect(typeof rr).toBe('function');
        expect(typeof rInt).toBe('function');
    });

    test('should have access to constants', () => {
        expect(DIRS).toBeDefined();
        expect(WORLD).toBeDefined();
        expect(BLOCKS).toBeDefined();
        expect(I_NAMES).toBeDefined();
    });

    test('clamp function should work correctly', () => {
        expect(clamp(5, 0, 10)).toBe(5);
        expect(clamp(-5, 0, 10)).toBe(0);
        expect(clamp(15, 0, 10)).toBe(10);
    });

    test('hash functions should be consistent', () => {
        const result1 = hash32(12345);
        const result2 = hash32(12345);
        expect(result1).toBe(result2);
        expect(typeof result1).toBe('number');
    });

    test('block definitions should be valid', () => {
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
