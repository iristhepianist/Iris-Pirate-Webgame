// tests/setup.js
my
const fs = require('fs');
const path = require('path');

// Helper to load game files into global scope
global.loadGameFile = function (fileName) {
    const filePath = path.join(__dirname, '../js', fileName);
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove strict mode to allow global variable leaking if needed
    content = content.replace(/'use strict';/g, '');

    // Convert const/let to global properties at the top level
    content = content.replace(/^(const|let)\s+([a-zA-Z0-9_$]+)\s*=/gm, 'global.$2 =');
    content = content.replace(/^function\s+([a-zA-Z0-9_$]+)/gm, 'global.$1 = function');
    content = content.replace(/^class\s+([a-zA-Z0-9_$]+)/gm, 'global.$1 = class');

    try {
        eval(content);
    } catch (e) {
        console.error(`Error loading ${fileName}:`, e);
        throw e;
    }
};

// Mock DOM elements that the game expects
global.document = {
    getElementById: jest.fn(() => ({
        style: { display: 'none' },
        classList: { add: jest.fn(), remove: jest.fn() },
        textContent: '',
        innerHTML: '',
        appendChild: jest.fn(),
        querySelectorAll: jest.fn(() => []),
        scrollTo: jest.fn()
    })),
    createElement: jest.fn(() => ({
        className: '',
        textContent: '',
        innerHTML: '',
        style: {},
        appendChild: jest.fn(),
        classList: { add: jest.fn(), remove: jest.fn() }
    })),
    querySelectorAll: jest.fn(() => []),
    addEventListener: jest.fn()
};

global.window = {
    location: { href: '' },
    prompt: jest.fn(),
    localStorage: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn()
    }
};

// Mock console methods to avoid noise in tests
global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

// Mock audio context
global.AudioContext = jest.fn(() => ({
    state: 'running',
    createOscillator: jest.fn(() => ({
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        frequency: { setValueAtTime: jest.fn() }
    })),
    createGain: jest.fn(() => ({
        connect: jest.fn(),
        gain: { setValueAtTime: jest.fn() }
    })),
    currentTime: 0
}));

// Mock canvas context
global.HTMLCanvasElement = jest.fn(() => ({
    getContext: jest.fn(() => ({
        fillRect: jest.fn(),
        clearRect: jest.fn(),
        getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
        putImageData: jest.fn(),
        createImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
        setTransform: jest.fn(),
        drawImage: jest.fn(),
        save: jest.fn(),
        fillText: jest.fn(),
        restore: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        closePath: jest.fn(),
        stroke: jest.fn(),
        translate: jest.fn(),
        scale: jest.fn(),
        rotate: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
        measureText: jest.fn(() => ({ width: 0 })),
        transform: jest.fn(),
        rect: jest.fn(),
        clip: jest.fn()
    })),
    width: 0,
    height: 0
}));
