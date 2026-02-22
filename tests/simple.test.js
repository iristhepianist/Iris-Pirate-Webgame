// tests/simple.test.js
'use strict';

describe('Simple Test', () => {
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
});
