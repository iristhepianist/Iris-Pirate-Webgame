// js/data.js
'use strict';

const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const DIR_V = [[0, -1], [0.7, -0.7], [1, 0], [0.7, 0.7], [0, 1], [-0.7, 0.7], [-1, 0], [-0.7, -0.7]];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rr = () => Math.random();
const rInt = (m) => Math.floor(Math.random() * m);

// Block Definitions for the Grid Builder
const BLOCKS = {
    'keel': { id: 'keel', name: 'Keel', ch: 'K', cl: 'b-keel', hp: 9999, wgt: 0, cost: {}, func: 'keel', desc: 'The heart of the vessel.' },
    'plank': { id: 'plank', name: 'Deck Plank', ch: '', cl: 'b-plank', hp: 20, wgt: 1, cost: { timber: 1 }, func: 'hull', desc: 'Provides walkable deck space.' },
    'iron': { id: 'iron', name: 'Iron Plating', ch: '', cl: 'b-iron', hp: 80, wgt: 4, cost: { metal: 2 }, func: 'armor', desc: 'Heavy armor plating.' },
    'mast': { id: 'mast', name: 'Standard Mast', ch: '▲', cl: 'b-mast', hp: 40, wgt: 2, cost: { timber: 3, canvas: 2, rope: 1 }, func: 'sail', pwr: 15, desc: 'Catches the wind.' },
    'cask': { id: 'cask', name: 'Water Cask', ch: 'W', cl: 'b-cask', hp: 15, wgt: 2, cost: { timber: 2 }, func: 'water', cap: 15, desc: '+15 Max Water' },
    'pantry': { id: 'pantry', name: 'Pantry Box', ch: 'F', cl: 'b-pantry', hp: 15, wgt: 2, cost: { timber: 3 }, func: 'food', cap: 20, desc: '+20 Max Food' },
    'pump': { id: 'pump', name: 'Bilge Pump', ch: 'P', cl: 'b-pump', hp: 30, wgt: 3, cost: { timber: 2, metal: 2 }, func: 'pump', clear: 5, desc: 'Auto-clears 5 bilge/watch' }
};

const I_NAMES = ["Morrow's End", "The Grey Shelf", "Sable Isle", "Tern Rock", "Deadman's Ledge", "Cape Hollow", "Tallow Island"];

// Global State
let G = {
    san: 100,
    hp: 100,
    trail: [], // Array of {x, y} breadcrumbs
    discovered: {} // Map of "x,y" to island data
};
let currentScene = null;
