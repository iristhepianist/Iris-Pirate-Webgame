# Testing Guide for The Drowned Chart

This document explains how to run and write tests for The Drowned Chart game.

## Overview

The game now includes a comprehensive automated testing framework that can verify:
- **Resource obtainability** - Which food/water types are actually obtainable in gameplay
- **Feature functionality** - Core game systems work as expected
- **Integration scenarios** - Complete gameplay flows and survival mechanics

## Quick Start

### Automated Analysis Commands

```bash
# Check which resources are obtainable in gameplay
npm run test:resources

# Verify core features are functional
npm run test:features

# Test complete gameplay scenarios
npm run test:integration

# Run comprehensive analysis (resources + features)
npm run test:functionality

# Full detailed analysis with verbose output
npm run test:comprehensive

# Generate coverage report
npm run test:report
```

### Command Line Testing

```bash
# Resource obtainability analysis
node tests/test-runner.js --obtainability

# Feature completeness analysis
node tests/test-runner.js --features

# Comprehensive game analysis
node tests/test-runner.js --comprehensive
```

## Test Structure

### Test Files Location
- All test files are located in the `tests/` directory
- Test files should end with `.test.js`

### Current Test Files

1. **`tests/basic.test.js`** - Basic functionality tests
2. **`tests/data.test.js`** - Core data utilities and constants
3. **`tests/grid.test.js`** - Ship grid system tests
4. **`tests/save-load.test.js`** - Save/load functionality tests

### Test Setup

The `tests/setup.js` file provides:
- Mock DOM elements (document, window)
- Mock localStorage
- Mock audio context
- Mock canvas context

## Writing New Tests

### Basic Test Structure

```javascript
// tests/new-feature.test.js
'use strict';

// Load game modules if needed
const fs = require('fs');
const path = require('path');

describe('Feature Name', () => {
    beforeEach(() => {
        // Setup before each test
    });

    test('should do something specific', () => {
        // Test implementation
        expect(result).toBe(expected);
    });
});
```

### Loading Game Modules

Since the game uses vanilla JavaScript without modules, you need to load files manually:

```javascript
const fs = require('fs');
const path = require('path');

// Load data.js for utilities and constants
const dataContent = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
eval(dataContent);

// Load other modules as needed
const gridContent = fs.readFileSync(path.join(__dirname, '../js/grid.js'), 'utf8');
eval(gridContent);
```

### Testing Game State

The game uses a global `G` object for state. In tests, you can set up test state:

```javascript
beforeEach(() => {
    // Reset game state
    G = {
        day: 1,
        hour: 0,
        food: 10,
        water: 10,
        // ... other required properties
    };
});
```

### Testing DOM Interactions

The setup provides mocked DOM elements:

```javascript
test('should update UI correctly', () => {
    // Mock DOM element
    const mockElement = {
        textContent: '',
        style: { display: 'none' }
    };
    document.getElementById.mockReturnValue(mockElement);
    
    // Call your function
    updateUI();
    
    // Assert
    expect(mockElement.textContent).toBe('Expected text');
});
```

### Testing Async Operations

For async functions like `printLog`:

```javascript
test('should handle async operations', async () => {
    await printLog('Test message', 'normal');
    
    // Assert after async operation
    expect(document.getElementById).toHaveBeenCalled();
});
```

## Best Practices

### 1. Test Isolation
- Use `beforeEach` to reset state between tests
- Don't rely on state from previous tests
- Mock external dependencies

### 2. Descriptive Tests
- Use clear test descriptions that explain what is being tested
- Group related tests in `describe` blocks
- Test both success and failure cases

### 3. Coverage
- Aim for high test coverage on critical game logic
- Test edge cases and error conditions
- Focus on game mechanics over UI details

### 4. Mocking
- Mock DOM interactions to avoid dependencies
- Mock time-based functions for predictable tests
- Use localStorage mocks for save/load tests

## Example Test Cases

### Testing Utility Functions

```javascript
test('clamp function should limit values', () => {
    expect(clamp(5, 0, 10)).toBe(5);    // Within range
    expect(clamp(-5, 0, 10)).toBe(0);   // Below minimum
    expect(clamp(15, 0, 10)).toBe(10);  // Above maximum
});
```

### Testing Game Mechanics

```javascript
test('ship should take damage correctly', () => {
    const ship = new ShipGrid(9, 15);
    const initialHP = ship.getStats().curHull;
    
    // Apply damage
    ship.get(4, 6).hp = 10;
    
    const currentHP = ship.getStats().curHull;
    expect(currentHP).toBeLessThan(initialHP);
});
```

### Testing Save/Load

```javascript
test('should save and load game state', () => {
    // Setup game state
    G.day = 5;
    G.food = 20;
    
    // Save game
    saveGame();
    
    // Clear state
    G = {};
    
    // Load game
    mockLocalStorage.getItem.mockReturnValue(savedData);
    loadGame();
    
    // Verify state restored
    expect(G.day).toBe(5);
    expect(G.food).toBe(20);
});
```

## Troubleshooting

### Common Issues

1. **"ReferenceError: X is not defined"**
   - Make sure to load the required JavaScript files
   - Check that functions are exported to global scope

2. **"Cannot read property of undefined"**
   - Ensure proper setup in `beforeEach`
   - Check that DOM mocks are configured correctly

3. **Tests not finding modules**
   - Verify file paths are correct
   - Check that `eval()` is called before tests run

### Debugging Tests

Use `console.log` or Jest's debug mode:

```bash
# Run tests with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Coverage Reports

After running `npm run test:coverage`, you'll find:
- Text coverage summary in terminal
- HTML report in `coverage/lcov-report/index.html`
- LCOV data in `coverage/lcov.info`

Focus on covering:
- Core game mechanics
- Save/load functionality
- Ship building system
- Critical utility functions

## Continuous Integration

The `npm run test:ci` command is configured for CI environments:
- Runs tests once (no watch mode)
- Generates coverage reports
- Exits with proper status codes

This can be used in GitHub Actions, GitLab CI, or other CI systems.
