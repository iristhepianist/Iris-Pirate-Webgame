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

// Constellation Data for Astrology System
const CONSTELLATIONS = {
    'ursa_major': {
        name: 'Ursa Major',
        description: 'The Great Bear guides the lost sailor',
        islands: ['bear_claw', 'bear_den', 'bear_star'],
        effect: 'navigation_bonus',
        rarity: 'common'
    },
    'draco': {
        name: 'Draco',
        description: 'The Dragon guards ancient secrets',
        islands: ['dragon_hoard', 'dragon_scale'],
        effect: 'treasure_hint',
        rarity: 'rare'
    },
    'cassiopeia': {
        name: 'Cassiopeia',
        description: 'The Queen reveals forgotten shores',
        islands: ['queens_crown', 'queens_throne'],
        effect: 'island_reveal',
        rarity: 'uncommon'
    },
    'orion': {
        name: 'Orion',
        description: 'The Hunter stalks hidden prey',
        islands: ['hunters_lair', 'hunters_quarry'],
        effect: 'supernatural_event',
        rarity: 'epic'
    },
    'pleiades': {
        name: 'Pleiades',
        description: 'The Seven Sisters whisper of distant lands',
        islands: ['sisters_circle', 'sisters_veil'],
        effect: 'multiple_reveal',
        rarity: 'rare'
    },
    'andromeda': {
        name: 'Andromeda',
        description: 'The Chained Maiden calls from beyond',
        islands: ['chained_island', 'maiden_rock'],
        effect: 'supernatural_event',
        rarity: 'legendary'
    }
};

// Item Definitions for Inventory System
const ITEM_TYPES = {
    // Food Items
    'salt_beef': { name: 'Salt Beef', category: 'food', weight: 1, volume: 1, spoilRate: 0.001, foodValue: 5, moraleEffect: 2 },
    'salt_pork': { name: 'Salt Pork', category: 'food', weight: 1.2, volume: 1, spoilRate: 0.001, foodValue: 6, moraleEffect: 3 },
    'hard_biscuit': { name: 'Hard Biscuit', category: 'food', weight: 0.8, volume: 0.5, spoilRate: 0.0005, foodValue: 3, moraleEffect: 1 },
    'fresh_fish': { name: 'Fresh Fish', category: 'food', weight: 0.9, volume: 1, spoilRate: 0.05, foodValue: 4, moraleEffect: 5 },
    'citrus_fruit': { name: 'Citrus Fruit', category: 'food', weight: 0.7, volume: 0.8, spoilRate: 0.02, foodValue: 2, moraleEffect: 8, scurvyRate: -0.1 },
    'exotic_fruit': { name: 'Exotic Fruit', category: 'food', weight: 0.6, volume: 0.7, spoilRate: 0.03, foodValue: 3, moraleEffect: 6 },

    // Water Items
    'fresh_water': { name: 'Fresh Water', category: 'water', weight: 8, volume: 8, spoilRate: 0.001, waterValue: 8 },
    'rain_water': { name: 'Rain Water', category: 'water', weight: 8, volume: 8, spoilRate: 0.002, waterValue: 7 },
    'distilled_water': { name: 'Distilled Water', category: 'water', weight: 8, volume: 8, spoilRate: 0.0005, waterValue: 9 },
    'exotic_water': { name: 'Exotic Water', category: 'water', weight: 8, volume: 8, spoilRate: 0.003, waterValue: 6 },

    // Materials
    'timber': { name: 'Timber', category: 'material', weight: 15, volume: 10, description: 'Building material for ship repairs' },
    'metal': { name: 'Metal Scrap', category: 'material', weight: 12, volume: 8, description: 'Iron and metal for repairs and tools' },
    'canvas': { name: 'Canvas', category: 'material', weight: 3, volume: 5, description: 'Sail cloth and repair material' },
    'rope': { name: 'Rope', category: 'material', weight: 2, volume: 4, description: 'Cordage for rigging and repairs' },
    'glass': { name: 'Glass', category: 'material', weight: 1, volume: 1, description: 'For instruments and containers' },

    // Equipment
    'sextant': { name: 'Sextant', category: 'equipment', weight: 1, volume: 1, description: 'Navigation tool', navBonus: 20 },
    'spyglass': { name: 'Spyglass', category: 'equipment', weight: 2, volume: 2, description: 'For spotting distant objects' },
    'compass': { name: 'Magnetic Compass', category: 'equipment', weight: 0.5, volume: 1, description: 'Basic navigation aid' },

    // Artifacts (from dungeons)
    'golden_idol': { name: 'Golden Idol', category: 'artifact', weight: 5, volume: 2, description: 'Ancient golden statue' },
    'pirate_map': { name: 'Pirate Map', category: 'artifact', weight: 0.1, volume: 0.1, description: 'Chart of hidden treasures' },
    'crystal_shard': { name: 'Crystal Shard', category: 'artifact', weight: 2, volume: 1, description: 'Glowing crystal fragment' },
    'ancient_scroll': { name: 'Ancient Scroll', category: 'artifact', weight: 0.2, volume: 0.5, description: 'Ancient parchment' }
};

// Make ITEM_TYPES globally accessible
if (typeof window !== 'undefined') {
    window.ITEM_TYPES = ITEM_TYPES;
}

const STORAGE_TYPES = {
    'hold': { name: 'Main Hold', capacity: 100, allowedCategories: ['food', 'water', 'material', 'artifact'] },
    'pantry': { name: 'Pantry', capacity: 20, allowedCategories: ['food'] },
    'water_cask': { name: 'Water Casks', capacity: 15, allowedCategories: ['water'] },
    'equipment_locker': { name: 'Equipment Locker', capacity: 10, allowedCategories: ['equipment'] },
    'artifact_case': { name: 'Artifact Case', capacity: 5, allowedCategories: ['artifact'] }
};

// Make STORAGE_TYPES globally accessible
if (typeof window !== 'undefined') {
    window.STORAGE_TYPES = STORAGE_TYPES;
}

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
    'pump': { id: 'pump', name: 'Bilge Pump', ch: 'P', cl: 'b-pump', hp: 30, wgt: 3, cost: { timber: 2, metal: 2 }, func: 'pump', clear: 5, desc: 'Auto-clears 5 bilge/watch' },
    'rain_collector': { id: 'rain_collector', name: 'Rain Collector', ch: 'R', cl: 'b-rain-collector', hp: 20, wgt: 1, cost: { timber: 2, canvas: 1 }, func: 'rain', cap: 3, desc: 'Collects rainwater in storms (+3 Max Rainwater)' },
    'telescope': { id: 'telescope', name: 'Ship\'s Telescope', ch: 'T', cl: 'b-telescope', hp: 15, wgt: 2, cost: { timber: 3, metal: 1, glass: 1 }, func: 'celestial', accuracy: 0.8, desc: 'Improves celestial navigation accuracy' },
    'astrolabe': { id: 'astrolabe', name: 'Brass Astrolabe', ch: 'A', cl: 'b-astrolabe', hp: 10, wgt: 1, cost: { metal: 3, rope: 1 }, func: 'celestial', accuracy: 0.6, desc: 'Basic celestial measurement tool' },
    'star_chart': { id: 'star_chart', name: 'Star Chart Table', ch: 'S', cl: 'b-star-chart', hp: 12, wgt: 1, cost: { timber: 2, canvas: 2 }, func: 'celestial', charts: 5, desc: 'Allows charting constellations for exploration' }
};

const I_NAMES = ["Morrow's End", "The Grey Shelf", "Sable Isle", "Tern Rock", "Deadman's Ledge", "Cape Hollow", "Tallow Island"];

const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const DIR_V = [[0, -1], [0.7, -0.7], [1, 0], [0.7, 0.7], [0, 1], [-0.7, 0.7], [-1, 0], [-0.7, -0.7]];

// Global State
let G = {
    san: 100,
    hp: 100,
    morale: 50,
    day: 1,
    hour: 6,
    spd: 0,
    x: 0,
    y: 0,
    heading: 0,
    state: 'Anchored',
    wx: 'Calm',
    navError: 2,
    bilge: 0,
    scurvy: 0,
    calmHours: 0,
    trail: [],
    seed: 0,
    worldSeed: 0,
    discovered: {},
    lootedIslands: {},
    tutorialPhase: null,
    tutorialIsland: null,
    noEncounters: false,
    curIsland: null,
    locName: 'Open Ocean',
    chartMarks: {},
    chartedConstellations: {},
    artifacts: [],

    // Inventory System
    inventory: {
        hold: {},           // Main storage
        pantry: {},         // Food storage
        water_cask: {},     // Water storage
        equipment_locker: {}, // Equipment storage
        artifact_case: {}   // Artifact storage
    },

    // Legacy stock systems (will be migrated)
    foodStocks: { salt: 30, fresh: 0, citrus: 0 },
    waterStocks: { fresh: 20, rain: 0, distilled: 0, exotic: 0 },
    mat: { timber: 10, metal: 5, canvas: 3, rope: 5, glass: 0 },
};
let currentScene = null;
