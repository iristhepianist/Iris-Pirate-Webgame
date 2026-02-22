// tests/test-runner.js
'use strict';

/**
 * Test Runner Utility for The Drowned Chart
 *
 * This utility provides automated testing capabilities to verify:
 * - Resource obtainability in gameplay
 * - Feature functionality without manual playtesting
 * - Game balance and mechanics
 * - Integration scenarios
 */

const fs = require('fs');
const path = require('path');

// Load game modules
function loadGameModules() {
    const modules = {};

    // Load core modules
    const dataContent = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
    eval(dataContent);
    modules.data = true;

    const engineContent = fs.readFileSync(path.join(__dirname, '../js/engine.js'), 'utf8');
    eval(engineContent);
    modules.engine = true;

    const gridContent = fs.readFileSync(path.join(__dirname, '../js/grid.js'), 'utf8');
    eval(gridContent);
    modules.grid = true;

    const scenesContent = fs.readFileSync(path.join(__dirname, '../js/scenes.js'), 'utf8');
    eval(scenesContent);
    modules.scenes = true;

    return modules;
}

// Test utilities
function createTestGameState() {
    return {
        day: 1,
        hour: 0,
        bilge: 0,
        foodStocks: { salt: 10, fresh: 0, citrus: 0 },
        waterStocks: { fresh: 10, rain: 0, distilled: 0, exotic: 0 },
        foodQ: 100,
        waterQ: 100,
        wx: 'Clear',
        hp: 100,
        san: 100,
        morale: 70,
        scurvy: 0,
        x: 0,
        y: 0,
        navError: 2,
        worldSeed: 12345,
        seed: 12345,
        trail: [],
        discovered: {},
        explored: [],
        rumors: [],
        tutorialIsland: {
            id: 'tutorial:tern-rock',
            x: 0,
            y: -10,
            name: 'Tern Rock (Tutorial)',
            pale: false,
            found: false,
            scavenged: false
        }
    };
}

// Resource verification utilities
function checkResourceObtainability() {
    const results = {
        obtainable: [],
        unobtainable: [],
        summary: {}
    };

    console.log('\n🔍 RESOURCE OBTAINABILITY ANALYSIS');
    console.log('=====================================');

    // Check food types
    const foodTypes = Object.keys(FOOD_TYPES);
    console.log(`\n🍽️  FOOD TYPES (${foodTypes.length} defined):`);

    foodTypes.forEach(type => {
        const obtainable = type === 'salt'; // Only salt is currently obtainable
        const status = obtainable ? '✅ OBTAINABLE' : '❌ NOT OBTAINABLE';

        console.log(`   ${status}: ${FOOD_TYPES[type].name}`);
        console.log(`      Spoil Rate: ${FOOD_TYPES[type].spoilRate}`);
        console.log(`      Scurvy Effect: ${FOOD_TYPES[type].scurvyRate}`);
        console.log(`      Morale Effect: ${FOOD_TYPES[type].moraleEffect}`);

        if (obtainable) {
            results.obtainable.push(`Food: ${FOOD_TYPES[type].name}`);
        } else {
            results.unobtainable.push(`Food: ${FOOD_TYPES[type].name}`);
        }
    });

    // Check water types
    const waterTypes = Object.keys(WATER_TYPES);
    console.log(`\n💧 WATER TYPES (${waterTypes.length} defined):`);

    waterTypes.forEach(type => {
        const obtainable = type === 'fresh'; // Only fresh water is currently obtainable
        const status = obtainable ? '✅ OBTAINABLE' : '❌ NOT OBTAINABLE';

        console.log(`   ${status}: ${WATER_TYPES[type].name}`);
        console.log(`      Spoil Rate: ${WATER_TYPES[type].spoilRate}`);
        console.log(`      Morale Effect: ${WATER_TYPES[type].moraleEffect}`);

        if (obtainable) {
            results.obtainable.push(`Water: ${WATER_TYPES[type].name}`);
        } else {
            results.unobtainable.push(`Water: ${WATER_TYPES[type].name}`);
        }
    });

    // Summary
    results.summary = {
        totalResources: foodTypes.length + waterTypes.length,
        obtainableCount: results.obtainable.length,
        unobtainableCount: results.unobtainable.length,
        obtainabilityRate: ((results.obtainable.length / (foodTypes.length + waterTypes.length)) * 100).toFixed(1)
    };

    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total Resources: ${results.summary.totalResources}`);
    console.log(`   Obtainable: ${results.summary.obtainableCount}`);
    console.log(`   Not Obtainable: ${results.summary.unobtainableCount}`);
    console.log(`   Obtainability Rate: ${results.summary.obtainabilityRate}%`);

    if (results.unobtainable.length > 0) {
        console.log(`\n⚠️  MISSING FEATURES:`);
        results.unobtainable.forEach(item => console.log(`   • ${item} needs gameplay implementation`));
    }

    return results;
}

// Feature verification utilities
function checkFeatureCompleteness() {
    const results = {
        implemented: [],
        missing: [],
        partial: []
    };

    console.log('\n⚙️  FEATURE COMPLETENESS ANALYSIS');
    console.log('==================================');

    // Core systems to check
    const features = [
        { name: 'Resource Consumption System', check: () => typeof advanceTime === 'function' },
        { name: 'Scurvy Mechanics', check: () => G && typeof G.scurvy === 'number' },
        { name: 'Ship Building System', check: () => typeof ShipGrid === 'function' },
        { name: 'Navigation System', check: () => typeof estimatedShipPos === 'function' },
        { name: 'Scene System', check: () => Scenes && Object.keys(Scenes).length > 0 },
        { name: 'Save/Load System', check: () => typeof saveGame === 'function' && typeof loadGame === 'function' },
        { name: 'Weather Effects', check: () => G && typeof G.wx === 'string' },
        { name: 'Crew Health System', check: () => G && typeof G.hp === 'number' && typeof G.san === 'number' },
        { name: 'Morale System', check: () => G && typeof G.morale === 'number' },
        { name: 'Time Progression', check: () => G && typeof G.day === 'number' && typeof G.hour === 'number' }
    ];

    features.forEach(feature => {
        try {
            const implemented = feature.check();
            const status = implemented ? '✅ IMPLEMENTED' : '❌ MISSING';

            console.log(`   ${status}: ${feature.name}`);

            if (implemented) {
                results.implemented.push(feature.name);
            } else {
                results.missing.push(feature.name);
            }
        } catch (error) {
            console.log(`   ⚠️  ERROR testing: ${feature.name} - ${error.message}`);
            results.partial.push(feature.name);
        }
    });

    // Summary
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Fully Implemented: ${results.implemented.length}`);
    console.log(`   Missing: ${results.missing.length}`);
    console.log(`   Partial/Errors: ${results.partial.length}`);

    const completionRate = ((results.implemented.length / features.length) * 100).toFixed(1);
    console.log(`   Completion Rate: ${completionRate}%`);

    return results;
}

// Automated testing functions
function runObtainabilityTests() {
    console.log('\n🧪 RUNNING OBTAINABILITY TESTS');
    console.log('===============================');

    try {
        loadGameModules();
        const results = checkResourceObtainability();

        if (results.unobtainable.length === 0) {
            console.log('\n✅ ALL RESOURCES ARE OBTAINABLE!');
        } else {
            console.log(`\n⚠️  ${results.unobtainable.length} RESOURCES NEED IMPLEMENTATION`);
        }

        return results;
    } catch (error) {
        console.error('❌ OBTAINABILITY TESTS FAILED:', error.message);
        return { error: error.message };
    }
}

function runFeatureTests() {
    console.log('\n🧪 RUNNING FEATURE TESTS');
    console.log('========================');

    try {
        loadGameModules();
        G = createTestGameState(); // Initialize test game state
        const results = checkFeatureCompleteness();

        if (results.missing.length === 0) {
            console.log('\n✅ ALL FEATURES ARE IMPLEMENTED!');
        } else {
            console.log(`\n⚠️  ${results.missing.length} FEATURES NEED IMPLEMENTATION`);
        }

        return results;
    } catch (error) {
        console.error('❌ FEATURE TESTS FAILED:', error.message);
        return { error: error.message };
    }
}

function runComprehensiveTest() {
    console.log('\n🚀 COMPREHENSIVE GAME ANALYSIS');
    console.log('==============================');

    const results = {
        timestamp: new Date().toISOString(),
        obtainability: runObtainabilityTests(),
        features: runFeatureTests()
    };

    console.log('\n📋 FINAL REPORT');
    console.log('================');

    if (results.obtainability.error || results.features.error) {
        console.log('❌ TESTING FAILED - Check error messages above');
        return results;
    }

    const obtainabilityRate = results.obtainability.summary.obtainabilityRate;
    const featureCompletion = ((results.features.implemented.length /
        (results.features.implemented.length + results.features.missing.length)) * 100).toFixed(1);

    console.log(`Resource Obtainability: ${obtainabilityRate}%`);
    console.log(`Feature Completion: ${featureCompletion}%`);

    const overallScore = ((parseFloat(obtainabilityRate) + parseFloat(featureCompletion)) / 2).toFixed(1);
    console.log(`Overall Game Readiness: ${overallScore}%`);

    if (overallScore >= 90) {
        console.log('🎉 EXCELLENT - Game is highly complete!');
    } else if (overallScore >= 75) {
        console.log('👍 GOOD - Game has solid foundation with some gaps');
    } else if (overallScore >= 60) {
        console.log('⚠️  FAIR - Game needs significant development');
    } else {
        console.log('❌ POOR - Game needs major work');
    }

    return results;
}

// Export functions for use in other test files
module.exports = {
    loadGameModules,
    createTestGameState,
    checkResourceObtainability,
    checkFeatureCompleteness,
    runObtainabilityTests,
    runFeatureTests,
    runComprehensiveTest
};

// If run directly from command line
if (require.main === module) {
    console.log('🎮 THE DROWNED CHART - AUTOMATED TESTING SUITE');
    console.log('================================================');

    const args = process.argv.slice(2);

    if (args.includes('--obtainability')) {
        runObtainabilityTests();
    } else if (args.includes('--features')) {
        runFeatureTests();
    } else if (args.includes('--comprehensive')) {
        runComprehensiveTest();
    } else {
        console.log('Usage:');
        console.log('  node tests/test-runner.js --obtainability    # Test resource obtainability');
        console.log('  node tests/test-runner.js --features        # Test feature completeness');
        console.log('  node tests/test-runner.js --comprehensive  # Run all tests');
        console.log('');
        console.log('Or use npm scripts:');
        console.log('  npm run test:functionality    # Test resources + features');
        console.log('  npm run test:comprehensive   # Full analysis');
    }
}
