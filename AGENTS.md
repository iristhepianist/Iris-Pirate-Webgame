# AGENTS.md

## What Each File Does

- **index.html**: Main HTML file that sets up the game interface, including the title screen, story display, and UI elements.
- **js/main.js**: Initializes the game, handles new game and load game logic, sets up the initial G object, and starts the game loop.
- **js/engine.js**: Contains the core game engine logic, including world generation, time advancement, island discovery, resource management, and game state updates.
- **js/scenes.js**: Defines all game scenes, including tutorial scenes, dungeon types, and scene management functions like inventory handling.
- **js/ui.js**: Handles user interface updates, rendering choices, logging messages, and updating the game display.
- **js/data.js**: Contains game data definitions, such as item types, block types, world constants, and game configuration.
- **js/audio.js**: Manages audio playback, sound effects, and ambient audio loops.
- **js/chart.js**: Handles chart rendering, navigation display, and fog of war visualization.
- **js/grid.js**: Defines the ShipGrid class for managing ship construction and stats.
- **css/style.css**: Contains styles for the game interface and UI elements.
- **package.json**: NPM package configuration for dependencies and scripts.

## Scene Object Structure

Every scene object in the `Scenes` object follows this structure:

```javascript
{
    enter: function() { /* Optional: Called when entering the scene */ },
    text: function() { /* Returns the scene description text */ },
    choices: function() { /* Returns an array of choice objects */ }
}
```

Each choice object has:
```javascript
{
    text: "Choice description",
    cb: async function() { /* Callback function executed when choice is selected */ },
    log: "Optional log message" // Optional
}
```

For dungeon types in `DUNGEON_TYPES`, the structure is:

```javascript
{
    description: "Dungeon description",
    choices: [
        {
            text: "Choice description (Risk: Description)",
            risk: function() { /* Risk function that modifies G and prints logs */ }
        }
    ]
}
```

Minimal example for a main scene:

```javascript
'example_scene': {
    enter: () => {
        G.locName = 'Example Location';
    },
    text: () => sceneContext() + 'You are in an example scene.',
    choices: () => [
        {
            text: 'Do something',
            cb: async () => {
                await printLog('You did something.', 'normal');
                setScene('next_scene');
            }
        }
    ]
}
```

## G Object Properties

| Property | Type | Description | File Sets It |
|----------|------|-------------|--------------|
| worldSeed | number | World seed for procedural generation | engine.js |
| seed | number | Backward compatibility for worldSeed | engine.js |
| chunkCache | object | Cache for island chunks | engine.js |
| islandState | object | State of islands (found, scavenged) | engine.js |
| scavengedIslands | object | Islands that have been scavenged | engine.js |
| lootedIslands | object | Islands that have been looted | engine.js |
| chartMarks | object | Chart marks for navigation | engine.js |
| discovered | object | Discovered islands | engine.js |
| fogCleared | object | Cleared fog cells | engine.js |
| trail | array | Trail of positions | engine.js |
| explored | array | Explored fog points | engine.js |
| rumors | array | Rumors about islands | engine.js |
| navError | number | Navigation error in position | engine.js |
| tutorialPhase | string | Current tutorial phase | engine.js |
| foodQ | number | Food quality | engine.js |
| waterQ | number | Water quality | engine.js |
| ropeWear | number | Rope wear level | engine.js |
| morale | number | Crew morale | engine.js |
| foodStocks | object | Food stocks by type | engine.js |
| waterStocks | object | Water stocks by type | engine.js |
| scurvy | number | Scurvy level | engine.js |
| tutorialIsland | object | Tutorial island data | engine.js |
| hour | number | Current hour | engine.js |
| wx | string | Weather condition | engine.js |
| seaState | string | Sea state | engine.js |
| hp | number | Health points | engine.js |
| san | number | Sanity points | engine.js |
| artifacts | array | Cursed artifacts | scenes.js |
| mat | object | Materials (timber, canvas, rope, metal) | main.js |
| day | number | Current day | engine.js |
| bilge | number | Bilge water level | engine.js |
| food | number | Legacy food (migrated) | main.js |
| water | number | Legacy water (migrated) | main.js |
| windDir | number | Wind direction | engine.js |
| windSpd | number | Wind speed | engine.js |
| baro | number | Barometric pressure | engine.js |
| baroT | number | Barometric temperature | engine.js |
| heading | number | Ship heading | engine.js |
| spd | number | Current speed | engine.js |
| x | number | Current x position | engine.js |
| y | number | Current y position | engine.js |
| state | string | Game state | engine.js |
| locName | string | Location name | main.js |
| atShipyard | boolean | Whether player is at a port with shipwright's yard | main.js/engine.js |
| calmHours | number | Hours of calm weather | engine.js |
| ship | object | Ship grid | main.js |
| maneuver | string | Current maneuver | engine.js |
| beaufort | number | Beaufort wind scale | engine.js |
| noEncounters | boolean | Block random encounters | engine.js |
| inventory | object | Inventory | engine.js |
| chartedConstellations | object | Charted constellations | engine.js |
| treasureHint | boolean | Hint for treasure | engine.js |

## How to Add a New Scene Without Breaking Anything

To add a new scene:

1. Add a new key to the `Scenes` object in `js/scenes.js` with the required structure (enter, text, choices).

2. Ensure the `text` function returns a string that includes `sceneContext()` for consistency.

3. In the `choices` function, return an array of choice objects with `text` and `cb` properties.

4. Use `setScene('new_scene_id')` to transition to the new scene.

5. Test that the scene integrates properly with the game flow, ensuring G properties are modified correctly and the scene can be exited.

For dungeon types, add to `DUNGEON_TYPES` with description and choices, each choice having text and risk function that modifies G and calls printLog.

## Known Landmines

These are documented gotchas that will cause bugs if ignored:

- **Do not use `G.food` or `G.water` directly.** These are legacy properties. Always use `G.foodStocks` and `G.waterStocks` instead.
- **`G.seed` is an alias for `G.worldSeed`.** Never set both independently. If you touch world generation, use `G.worldSeed` only.
- **`G.ship` is initialized in main.js**, not engine.js. If you're looking for where the ship grid is created, look there.
- **`G.artifacts` is initialized in scenes.js**, not engine.js. It will not exist if scenes.js hasn't run.
- **Do not call `updateUI()` directly.** Use the event system in `src/events/index.js` to emit changes.
- **G is global and has no type safety.** Never assume a property exists without checking. Use `G.x ?? default` pattern.
- **Scenes are in one monolithic file (js/scenes.js).** Until migration is complete, all scene additions go there. Do not create orphaned scene files that nothing imports.
- **state.js defaults are overwritten by main.js on new game.** The defaults in state.js are for documentation only; main.js clobbers G with fresh values on game start. Do not rely on state.js defaults in game logic.

## Shipbuilding System

The shipbuilding system operates on a two-tier structure:

### Deck Maintenance (Available at Sea)
Basic ship adjustments that can be performed at sea using materials from inventory. These are choice-based actions in the deck scene:

- **Patch Hull Planking** (1 Hour): Uses timber to reduce leak rate
- **Adjust Rigging** (1 Hour): Uses rope to improve sail efficiency  
- **Pump Ballast** (1 Hour): Uses metal to improve ship stability

Maintenance actions validate material availability, consume resources, and provide atmospheric feedback.

### Port Shipwright's Yard (Advanced Modifications)
Grid-based ship editor available only at designated port islands where `G.atShipyard` is true. Includes advanced structural blocks that cannot be placed at sea:

- **Reinforced Hull**: Increases hull integrity
- **Cannons**: Adds weapon capability and weight
- **Cargo Holds**: Increases storage capacity
- **Extra Masts**: Improves sail power
- **Ballast Stones**: Improves stability
- **Extra Bilge Pumps**: Reduces leak rate

The shipyard entry point checks `G.atShipyard` flag - if false, shows atmospheric message and returns to deck.

### Grid UI Enhancements
The grid system includes read-only helper methods:
- `calculatePlacementDiff(x, y, blockType)`: Computes stat changes for proposed placement
- `showBlockInfo(blockType)`: Returns block details (weight, cost, effects)

Block placement uses confirmation scenes that display:
- Block information (name, description, cost, weight)
- Proposed stat changes (hull, weight, leak rate, sail power, storage)
- Confirm/cancel choices

All modifications require material validation and provide atmospheric success/failure messages.
