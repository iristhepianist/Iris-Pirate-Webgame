// Food Types
const FOOD_TYPES = {
    'salt': {
        name: 'Salt Meat/Hardtack',
        spoilRate: 0.001, // Very slow spoilage (months)
        scurvyRate: 1, // Increases scurvy
        moraleEffect: 0,
        baseCost: 1,
        description: 'Baseline rations that last months but cause scurvy'
    },
    'fresh': {
        name: 'Fresh Fish',
        spoilRate: 0.5, // Spoils in ~2 days
        scurvyRate: -0.5, // Slightly counters scurvy
        moraleEffect: 2,
        baseCost: 2,
        description: 'Fresh catch that boosts morale but spoils quickly'
    },
    'citrus': {
        name: 'Citrus/Fresh Provisions',
        spoilRate: 1, // Spoils in ~1 day
        scurvyRate: -2, // Strongly counters scurvy
        moraleEffect: 1,
        baseCost: 5,
        description: 'Expensive fresh food that prevents scurvy'
    }
};

// Water Types
const WATER_TYPES = {
    'fresh': {
        name: 'Fresh Water',
        spoilRate: 0, // Doesn't spoil
        moraleEffect: 5,
        baseCost: 3,
        description: 'Clean fresh water with morale boost'
    },
    'rain': {
        name: 'Rainwater',
        spoilRate: 0.01, // Very slow spoilage
        moraleEffect: 1,
        baseCost: 0, // Free from rain
        description: 'Clean but unreliable rainwater'
    },
    'distilled': {
        name: 'Distilled Seawater',
        spoilRate: 0, // Doesn't spoil further
        moraleEffect: -2,
        baseCost: 2, // Fuel/time cost
        description: 'Barely drinkable distilled water'
    },
    'exotic': {
        name: 'Exotic Freshwater',
        spoilRate: 0, // Doesn't spoil
        moraleEffect: 10,
        baseCost: 10,
        description: 'Rare pure water with major morale boost'
    }
};

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function rInt(max) { return Math.floor(Math.random() * Math.floor(max)); }
function rr() { return Math.random(); }
function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

const WORLD = {
    chunkSize: 80,
    islandChance: 0.22,
    maxIslandsPerChunk: 2,
    encounterRadius: 10,
    sightingRadius: 40,
    fogRevealRadius: 40,
    fogCellSize: 8
};

const CHUNK_SIZE = WORLD.chunkSize;
const chunkKey = (cx, cy) => `${cx},${cy}`;
const getChunkCoord = (x, y) => ({
    cx: Math.floor(x / WORLD.chunkSize),
    cy: Math.floor(y / WORLD.chunkSize)
});
const islandId = (cx, cy, i) => `${cx},${cy}:${i}`;

function hash32(v) {
    let h = (v | 0) ^ 0x9e3779b9;
    h = Math.imul(h ^ (h >>> 16), 0x21f0aaad);
    h = Math.imul(h ^ (h >>> 15), 0x735a2d97);
    return (h ^ (h >>> 15)) >>> 0;
}

function hash3i(x, y, seed) {
    let h = hash32(seed | 0);
    h = hash32(h ^ Math.imul(x | 0, 0x27d4eb2d));
    h = hash32(h ^ Math.imul(y | 0, 0x165667b1));
    return h >>> 0;
}

function hash01(x, y, seed, salt = 0) {
    return hash3i((x | 0) + salt * 374761393, (y | 0) ^ (salt * 668265263), seed | 0) / 4294967296;
}

// Block Definitions for the Grid Builder
const BLOCKS = {
    'keel': { id: 'keel', name: 'Keel', ch: 'K', cl: 'b-keel', hp: 9999, wgt: 0, cost: {}, func: 'keel', desc: 'The heart of the vessel.' },
    'plank': { id: 'plank', name: 'Deck Plank', ch: '', cl: 'b-plank', hp: 20, wgt: 1, cost: { timber: 1 }, func: 'hull', desc: 'Provides walkable deck space.' },
    'iron': { id: 'iron', name: 'Iron Plating', ch: '', cl: 'b-iron', hp: 80, wgt: 4, cost: { metal: 2 }, func: 'armor', desc: 'Heavy armor plating.' },
    'mast': { id: 'mast', name: 'Standard Mast', ch: '^', cl: 'b-mast', hp: 40, wgt: 2, cost: { timber: 3, canvas: 2, rope: 1 }, func: 'sail', pwr: 15, desc: 'Catches the wind.' },
    'stay': { id: 'stay', name: 'Rope Stay', ch: '/', cl: 'b-stay', hp: 15, wgt: 0.4, cost: { rope: 2 }, func: 'stay', desc: 'Braces a mast against storms.' },
    'ballast': { id: 'ballast', name: 'Ballast', ch: 'B', cl: 'b-ballast', hp: 30, wgt: 6, cost: { metal: 3 }, func: 'ballast', desc: 'Stabilizes the hull against listing.' },
    'cask': { id: 'cask', name: 'Water Cask', ch: 'W', cl: 'b-cask', hp: 15, wgt: 2, cost: { timber: 2 }, func: 'water', cap: 15, desc: '+15 Max Water' },
    'pantry': { id: 'pantry', name: 'Pantry Box', ch: 'F', cl: 'b-pantry', hp: 15, wgt: 2, cost: { timber: 3 }, func: 'food', cap: 20, desc: '+20 Max Food' },
    'pump': { id: 'pump', name: 'Bilge Pump', ch: 'P', cl: 'b-pump', hp: 30, wgt: 3, cost: { timber: 2, metal: 2 }, func: 'pump', clear: 5, desc: 'Auto-clears 5 bilge/watch' }
};

const I_NAMES = ["Morrow's End", "The Grey Shelf", "Sable Isle", "Tern Rock", "Deadman's Ledge", "Cape Hollow", "Tallow Island"];

const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const DIR_V = [[0, -1], [0.7, -0.7], [1, 0], [0.7, 0.7], [0, 1], [-0.7, 0.7], [-1, 0], [-0.7, -0.7]];

// Global State
let G = {
    san: 100,
    hp: 100,
    foodStocks: { salt: 20, fresh: 0, citrus: 0 }, // Food in days worth
    waterStocks: { fresh: 10, rain: 0, distilled: 0, exotic: 0 }, // Water in days worth
    scurvy: 0, // 0-100, scurvy progression
    trail: [], // Array of {x, y} breadcrumbs
    discovered: {} // Map of discovered island data
};
let currentScene = null;
