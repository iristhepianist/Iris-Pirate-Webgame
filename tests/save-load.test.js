// tests/save-load.test.js
'use strict';

// Mock localStorage
const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn()
};

// Replace global localStorage with mock
global.localStorage = mockLocalStorage;

// Load game modules
loadGameFile('data.js');
loadGameFile('grid.js');
loadGameFile('engine.js');

describe('Save/Load System', () => {
    beforeEach(() => {
        // Reset mock localStorage
        mockLocalStorage.getItem.mockClear();
        mockLocalStorage.setItem.mockClear();
        mockLocalStorage.removeItem.mockClear();

        // Reset global state
        G = {
            day: 1,
            hour: 0,
            bilge: 99,
            foodStocks: { salt: 10, fresh: 0, citrus: 0 },
            waterStocks: { fresh: 10, rain: 0, distilled: 0, exotic: 0 },
            mat: { timber: 6, canvas: 0, rope: 0, metal: 0 },
            windDir: 0,
            windSpd: 12,
            heading: 4,
            spd: 0,
            x: 0,
            y: 0,
            state: 'Hove-to',
            locName: 'The Drowned Vessel',
            san: 100,
            hp: 100,
            trail: [],
            discovered: {},
            worldSeed: 12345
        };

        // Create a simple ship for testing
        const ship = new ShipGrid(9, 15);
        ship.set(4, 6, { type: 'plank', hp: 20 });
        ship.set(4, 8, { type: 'mast', hp: 40 });
        G.ship = ship;
    });

    describe('saveGame function', () => {
        test('should save game state to localStorage', () => {
            saveGame();

            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'dc_txt_v2',
                expect.any(String)
            );
        });

        test('should serialize ship data correctly', () => {
            saveGame();

            const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
            expect(savedData.ship).toBeDefined();
            expect(savedData.ship.w).toBe(9);
            expect(savedData.ship.h).toBe(15);
            expect(savedData.ship.cells).toBeDefined();
        });

        test('should remove chunkCache from saved data', () => {
            G.chunkCache = { '0,0': { islands: [] } };

            saveGame();

            const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
            expect(savedData.chunkCache).toBeUndefined();
        });

        test('should preserve essential game data', () => {
            saveGame();

            const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
            expect(savedData.day).toBe(1);
            expect(savedData.foodStocks.salt).toBe(10);
            expect(savedData.waterStocks.fresh).toBe(10);
            expect(savedData.worldSeed).toBe(12345);
            expect(savedData.state).toBe('Hove-to');
        });
    });

    describe('loadGame function', () => {
        test('should return false when no save data exists', () => {
            mockLocalStorage.getItem.mockReturnValue(null);

            const result = loadGame();

            expect(result).toBe(false);
        });

        test('should load game state from localStorage', () => {
            const saveData = {
                day: 5,
                hour: 12,
                food: 15,
                water: 8,
                mat: { timber: 10, canvas: 5, rope: 3, metal: 2 },
                windDir: 3,
                windSpd: 20,
                heading: 2,
                spd: 5,
                x: 100,
                y: -50,
                state: 'Sailing',
                locName: 'Open Ocean',
                san: 75,
                hp: 80,
                worldSeed: 54321,
                foodStocks: { salt: 15, fresh: 0, citrus: 0 },
                waterStocks: { fresh: 8, rain: 0, distilled: 0, exotic: 0 },
                ship: {
                    w: 9,
                    h: 15,
                    cells: new Array(135).fill(null)
                }
            };

            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(saveData));

            const result = loadGame();

            expect(result).toBe(true);
            expect(G.day).toBe(5);
            expect(G.foodStocks.salt).toBe(15);
            expect(G.waterStocks.fresh).toBe(8);
            expect(G.worldSeed).toBe(54321);
            expect(G.state).toBe('Sailing');
        });

        test('should reconstruct ShipGrid from saved data', () => {
            const saveData = {
                day: 1,
                ship: {
                    w: 5,
                    h: 7,
                    cells: new Array(35).fill(null)
                }
            };

            // Set some cells in the saved data
            saveData.ship.cells[17] = { type: 'keel', hp: 9999 }; // center
            saveData.ship.cells[12] = { type: 'plank', hp: 20 };

            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(saveData));

            loadGame();

            expect(G.ship).toBeInstanceOf(ShipGrid);
            expect(G.ship.w).toBe(5);
            expect(G.ship.h).toBe(7);
            expect(G.ship.get(2, 3)).not.toBeNull(); // keel
            expect(G.ship.get(2, 2)).not.toBeNull(); // plank
        });

        test('should call ensureWorldState after loading', () => {
            const saveData = { day: 1 };
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(saveData));

            // Mock ensureWorldState to track if it's called
            const originalEnsureWorldState = ensureWorldState;
            let called = false;
            global.ensureWorldState = () => {
                called = true;
                return originalEnsureWorldState();
            };

            loadGame();

            expect(called).toBe(true);

            // Restore original function
            global.ensureWorldState = originalEnsureWorldState;
        });
    });

    describe('save/load roundtrip', () => {
        test('should preserve data integrity through save/load cycle', () => {
            // Set up complex game state
            G.day = 10;
            G.hour = 15;
            G.food = 25;
            G.water = 18;
            G.mat = { timber: 15, canvas: 8, rope: 6, metal: 4 };
            G.x = 250;
            G.y = -120;
            G.state = 'Exploring';
            G.locName = 'Mysterious Island';
            G.san = 60;
            G.hp = 85;
            G.foodStocks = { salt: 25, fresh: 5, citrus: 0 };
            G.waterStocks = { fresh: 18, rain: 2, distilled: 0, exotic: 0 };
            G.rumors = ['Strange lights in the north', 'Ghost ship sightings'];
            G.explored = ['island1', 'island2'];

            // Add more ship components
            G.ship.set(3, 6, { type: 'plank', hp: 15 });
            G.ship.set(5, 6, { type: 'plank', hp: 18 });
            G.ship.set(4, 5, { type: 'stay', hp: 10 });

            // Save the game
            saveGame();

            // Get the saved data
            const savedData = mockLocalStorage.setItem.mock.calls[0][1];

            // Clear current state
            G = {};

            // Load the game
            mockLocalStorage.getItem.mockReturnValue(savedData);
            loadGame();

            // Verify data integrity
            expect(G.day).toBe(10);
            expect(G.hour).toBe(15);
            expect(G.foodStocks.salt).toBe(25);
            expect(G.waterStocks.fresh).toBe(18);
            expect(G.mat).toEqual({ timber: 15, canvas: 8, rope: 6, metal: 4 });
            expect(G.x).toBe(250);
            expect(G.y).toBe(-120);
            expect(G.state).toBe('Exploring');
            expect(G.locName).toBe('Mysterious Island');
            expect(G.san).toBe(60);
            expect(G.hp).toBe(85);
            expect(G.rumors).toEqual(['Strange lights in the north', 'Ghost ship sightings']);
            expect(G.explored).toEqual(['island1', 'island2']);

            // Verify ship integrity
            expect(G.ship.get(4, 7)).not.toBeNull(); // keel
            expect(G.ship.get(4, 6)).not.toBeNull(); // original plank
            expect(G.ship.get(4, 8)).not.toBeNull(); // original mast
            expect(G.ship.get(3, 6)).not.toBeNull(); // new plank
            expect(G.ship.get(5, 6)).not.toBeNull(); // new plank
            expect(G.ship.get(4, 5)).not.toBeNull(); // stay
        });
    });

    describe('error handling', () => {
        test('should handle corrupted save data gracefully', () => {
            mockLocalStorage.getItem.mockReturnValue('invalid json');

            expect(() => {
                loadGame();
            }).toThrow();
        });

        test('should handle missing ship data in save', () => {
            const saveData = { day: 1 }; // Missing ship data
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(saveData));

            expect(() => {
                loadGame();
            }).not.toThrow();
        });
    });
});
