// src/state.js
// Global game state object with all properties initialized to default values

window.G = {
    worldSeed: 42,        // World seed for procedural generation
    seed: 42,             // Backward compatibility for worldSeed
    chunkCache: {},       // Cache for island chunks
    islandState: {},      // State of islands (found, scavenged)
    scavengedIslands: {}, // Islands that have been scavenged
    lootedIslands: {},    // Islands that have been looted
    chartMarks: {},       // Chart marks for navigation
    discovered: {},       // Discovered islands
    fogCleared: {},       // Cleared fog cells
    trail: [],            // Trail of positions
    explored: [],         // Explored fog points
    rumors: [],           // Rumors about islands
    navError: 2,          // Navigation error in position
    tutorialPhase: 'start', // Current tutorial phase
    foodQ: 100,           // Food quality
    waterQ: 100,          // Water quality
    ropeWear: 0,          // Rope wear level
    morale: 70,           // Crew morale
    foodStocks: { salt: 20, fresh: 0, citrus: 0 }, // Food stocks by type
    waterStocks: { fresh: 10, rain: 0, distilled: 0, exotic: 0 }, // Water stocks by type
    scurvy: 0,            // Scurvy level
    tutorialIsland: {     // Tutorial island data
        id: 'tutorial:tern-rock',
        x: 0,
        y: -10,
        name: 'Tern Rock (Tutorial)',
        pale: false,
        found: false,
        scavenged: false
    },
    hour: 0,              // Current hour
    wx: 'Clear',          // Weather condition
    seaState: 'Calm',     // Sea state
    hp: 100,              // Health points
    san: 100,             // Sanity points
    artifacts: [],        // Cursed artifacts
    mat: { timber: 6, canvas: 0, rope: 0, metal: 0 }, // Materials (timber, canvas, rope, metal)
    day: 1,               // Current day
    bilge: 50,            // Bilge water level
    food: 10,             // Legacy food (migrated)
    water: 10,            // Legacy water (migrated)
    windDir: 0,           // Wind direction
    windSpd: 12,          // Wind speed
    baro: 1012,           // Barometric pressure
    baroT: 1012,          // Barometric temperature
    heading: 4,           // Ship heading
    spd: 0,               // Current speed
    x: 0,                 // Current x position
    y: 0,                 // Current y position
    state: 'Hove-to',     // Game state
    locName: 'The Drowned Vessel', // Location name
    curIsland: null,      // Current island
    calmHours: 0,         // Hours of calm weather
    ship: null,           // Ship grid
    maneuver: null,       // Current maneuver
    beaufort: 0,          // Beaufort wind scale
    noEncounters: false,  // Block random encounters
    inventory: null,      // Inventory
    chartedConstellations: {}, // Charted constellations
    treasureHint: false   // Hint for treasure
};
