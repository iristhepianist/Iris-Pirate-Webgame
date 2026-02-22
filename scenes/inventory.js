function calculateUsedSpace(storageType) {
    if (!G.inventory || !G.inventory[storageType]) return 0;

    let usedSpace = 0;
    for (const [itemId, quantity] of Object.entries(G.inventory[storageType])) {
        const itemType = ITEM_TYPES[itemId];
        if (itemType) {
            usedSpace += itemType.volume * quantity;
        }
    }
    return Math.round(usedSpace * 10) / 10; // Round to 1 decimal
}

function calculateTotalInventoryWeight() {
    if (!G.inventory) return 0;

    let totalWeight = 0;
    for (const storageType of Object.keys(G.inventory)) {
        for (const [itemId, quantity] of Object.entries(G.inventory[storageType])) {
            const itemType = ITEM_TYPES[itemId];
            if (itemType) {
                totalWeight += itemType.weight * quantity;
            }
        }
    }
    return Math.round(totalWeight * 10) / 10; // Round to 1 decimal
}

function addItemToInventory(itemId, quantity, storageType = 'hold') {
    if (!G.inventory) G.inventory = { hold: {}, pantry: {}, water_cask: {}, equipment_locker: {}, artifact_case: {} };
    if (!G.inventory[storageType]) G.inventory[storageType] = {};

    const itemType = ITEM_TYPES[itemId];
    if (!itemType) {
        printLog(`Unknown item type: ${itemId}`, 'sys');
        return false;
    }

    // Check if storage type allows this category
    const storageInfo = STORAGE_TYPES[storageType];
    if (!storageInfo.allowedCategories.includes(itemType.category)) {
        printLog(`Cannot store ${itemType.category} items in ${storageInfo.name}`, 'sys');
        return false;
    }

    // Check capacity
    const currentUsed = calculateUsedSpace(storageType);
    const capacity = G.ship.getStats().storageCapacity[storageType];
    const requiredSpace = itemType.volume * quantity;

    if (currentUsed + requiredSpace > capacity) {
        printLog(`Not enough space in ${storageInfo.name} (${currentUsed}/${capacity} used)`, 'sys');
        return false;
    }

    G.inventory[storageType][itemId] = (G.inventory[storageType][itemId] || 0) + quantity;
    printLog(`Added ${quantity}x ${itemType.name} to ${storageInfo.name}`, 'sys');
    return true;
}

function removeItemFromInventory(itemId, quantity, storageType) {
    if (!G.inventory || !G.inventory[storageType] || !G.inventory[storageType][itemId]) {
        printLog(`Item not found in ${STORAGE_TYPES[storageType].name}`, 'sys');
        return false;
    }

    const currentQuantity = G.inventory[storageType][itemId];
    if (currentQuantity < quantity) {
        printLog(`Not enough ${ITEM_TYPES[itemId].name} in ${STORAGE_TYPES[storageType].name}`, 'sys');
        return false;
    }

    if (currentQuantity === quantity) {
        delete G.inventory[storageType][itemId];
    } else {
        G.inventory[storageType][itemId] = currentQuantity - quantity;
    }

    printLog(`Removed ${quantity}x ${ITEM_TYPES[itemId].name} from ${STORAGE_TYPES[storageType].name}`, 'sys');
    return true;
}

function transferItem(sourceStorage, targetStorage, itemId, quantity) {
    if (!removeItemFromInventory(itemId, quantity, sourceStorage)) {
        return false;
    }

    if (!addItemToInventory(itemId, quantity, targetStorage)) {
        // If transfer fails, put it back
        addItemToInventory(itemId, quantity, sourceStorage);
        return false;
    }

    return true;
}

function getInventoryContents(storageType) {
    if (!G.inventory || !G.inventory[storageType]) return [];

    const contents = [];
    for (const [itemId, quantity] of Object.entries(G.inventory[storageType])) {
        const itemType = ITEM_TYPES[itemId];
        if (itemType) {
            contents.push({
                id: itemId,
                name: itemType.name,
                quantity: quantity,
                weight: itemType.weight * quantity,
                volume: itemType.volume * quantity
            });
        }
    }
    return contents;
}

const inventoryScenes = {
    'inventory': {
        text: () => {
            const shipStats = G.ship.getStats();
            let text = sceneContext() + 'You examine the ship\'s inventory storage areas:\n\n';

            // Storage capacities
            const capacities = shipStats.storageCapacity;
            text += 'STORAGE CAPACITIES:\n';
            text += `Main Hold: ${capacities.hold} volume (${calculateUsedSpace('hold')}/${capacities.hold} used)\n`;
            text += `Pantry: ${capacities.pantry} volume (${calculateUsedSpace('pantry')}/${capacities.pantry} used)\n`;
            text += `Water Casks: ${capacities.water_cask} volume (${calculateUsedSpace('water_cask')}/${capacities.water_cask} used)\n`;
            text += `Equipment Locker: ${capacities.equipment_locker} volume (${calculateUsedSpace('equipment_locker')}/${capacities.equipment_locker} used)\n`;
            text += `Artifact Case: ${capacities.artifact_case} volume (${calculateUsedSpace('artifact_case')}/${capacities.artifact_case} used)\n\n`;

            // Total weight
            const totalWeight = calculateTotalInventoryWeight();
            text += `TOTAL CARGO WEIGHT: ${totalWeight.toFixed(1)} tons\n\n`;

            text += 'What would you like to do?';
            return text;
        },
        choices: () => {
            const choices = [];

            // View storage areas
            choices.push({
                text: 'View Main Hold',
                cb: () => setScene('inventory_hold')
            });

            choices.push({
                text: 'View Pantry',
                cb: () => setScene('inventory_pantry')
            });

            choices.push({
                text: 'View Water Storage',
                cb: () => setScene('inventory_water')
            });

            choices.push({
                text: 'View Equipment Locker',
                cb: () => setScene('inventory_equipment')
            });

            choices.push({
                text: 'View Artifact Case',
                cb: () => setScene('inventory_artifacts')
            });

            // Transfer items
            choices.push({
                text: 'Transfer Items',
                cb: () => setScene('inventory_transfer')
            });

            choices.push({ text: 'Back to deck', cb: () => setScene('deck') });

            return choices;
        }
    },

    'inventory_hold': {
        text: () => {
            const contents = getInventoryContents('hold');
            let text = sceneContext() + 'MAIN HOLD CONTENTS:\n\n';

            if (contents.length === 0) {
                text += 'The hold is empty.';
            } else {
                contents.forEach(item => {
                    text += `${item.name}: ${item.quantity} (${item.weight.toFixed(1)}t, ${item.volume.toFixed(1)} vol)\n`;
                });
            }

            const capacity = G.ship.getStats().storageCapacity.hold;
            const used = calculateUsedSpace('hold');
            text += `\nCapacity: ${used}/${capacity} volume used`;

            return text;
        },
        choices: () => {
            const choices = [];
            choices.push({ text: 'Back to Inventory', cb: () => setScene('inventory') });
            return choices;
        }
    },

    'inventory_pantry': {
        text: () => {
            const contents = getInventoryContents('pantry');
            let text = sceneContext() + 'PANTRY CONTENTS:\n\n';

            if (contents.length === 0) {
                text += 'The pantry is empty.';
            } else {
                contents.forEach(item => {
                    text += `${item.name}: ${item.quantity} (${item.weight.toFixed(1)}t, ${item.volume.toFixed(1)} vol)\n`;
                });
            }

            const capacity = G.ship.getStats().storageCapacity.pantry;
            const used = calculateUsedSpace('pantry');
            text += `\nCapacity: ${used}/${capacity} volume used`;

            return text;
        },
        choices: () => {
            const choices = [];
            choices.push({ text: 'Back to Inventory', cb: () => setScene('inventory') });
            return choices;
        }
    },

    'inventory_water': {
        text: () => {
            const contents = getInventoryContents('water_cask');
            let text = sceneContext() + 'WATER STORAGE CONTENTS:\n\n';

            if (contents.length === 0) {
                text += 'The water casks are empty.';
            } else {
                contents.forEach(item => {
                    text += `${item.name}: ${item.quantity} (${item.weight.toFixed(1)}t, ${item.volume.toFixed(1)} vol)\n`;
                });
            }

            const capacity = G.ship.getStats().storageCapacity.water_cask;
            const used = calculateUsedSpace('water_cask');
            text += `\nCapacity: ${used}/${capacity} volume used`;

            return text;
        },
        choices: () => {
            const choices = [];
            choices.push({ text: 'Back to Inventory', cb: () => setScene('inventory') });
            return choices;
        }
    },

    'inventory_equipment': {
        text: () => {
            const contents = getInventoryContents('equipment_locker');
            let text = sceneContext() + 'EQUIPMENT LOCKER CONTENTS:\n\n';

            if (contents.length === 0) {
                text += 'The equipment locker is empty.';
            } else {
                contents.forEach(item => {
                    text += `${item.name}: ${item.quantity} (${item.weight.toFixed(1)}t, ${item.volume.toFixed(1)} vol)\n`;
                    const itemType = ITEM_TYPES[Object.keys(G.inventory.equipment_locker).find(id => ITEM_TYPES[id] && ITEM_TYPES[id].name === item.name)];
                    if (itemType && itemType.description) {
                        text += `  ${itemType.description}\n`;
                    }
                });
            }

            const capacity = G.ship.getStats().storageCapacity.equipment_locker;
            const used = calculateUsedSpace('equipment_locker');
            text += `\nCapacity: ${used}/${capacity} volume used`;

            return text;
        },
        choices: () => {
            const choices = [];
            choices.push({ text: 'Back to Inventory', cb: () => setScene('inventory') });
            return choices;
        }
    },

    'inventory_artifacts': {
        text: () => {
            const contents = getInventoryContents('artifact_case');
            let text = sceneContext() + 'ARTIFACT CASE CONTENTS:\n\n';

            if (contents.length === 0) {
                text += 'The artifact case is empty.';
            } else {
                contents.forEach(item => {
                    text += `${item.name}: ${item.quantity} (${item.weight.toFixed(1)}t, ${item.volume.toFixed(1)} vol)\n`;
                    const itemType = ITEM_TYPES[Object.keys(G.inventory.artifact_case).find(id => ITEM_TYPES[id] && ITEM_TYPES[id].name === item.name)];
                    if (itemType && itemType.description) {
                        text += `  ${itemType.description}\n`;
                    }
                });
            }

            const capacity = G.ship.getStats().storageCapacity.artifact_case;
            const used = calculateUsedSpace('artifact_case');
            text += `\nCapacity: ${used}/${capacity} volume used`;

            return text;
        },
        choices: () => {
            const choices = [];
            choices.push({ text: 'Back to Inventory', cb: () => setScene('inventory') });
            return choices;
        }
    },

    'inventory_transfer': {
        text: () => sceneContext() + 'Transfer items between storage areas.\n\nSelect source storage area:',
        choices: () => {
            const choices = [
                { text: 'Transfer from Main Hold', cb: () => setScene('inventory_transfer_from_hold') },
                { text: 'Transfer from Pantry', cb: () => setScene('inventory_transfer_from_pantry') },
                { text: 'Transfer from Water Casks', cb: () => setScene('inventory_transfer_from_water') },
                { text: 'Transfer from Equipment Locker', cb: () => setScene('inventory_transfer_from_equipment') },
                { text: 'Transfer from Artifact Case', cb: () => setScene('inventory_transfer_from_artifacts') }
            ];
            choices.push({ text: 'Back to Inventory', cb: () => setScene('inventory') });
            return choices;
        }
    },

    'inventory_transfer_from_hold': {
        text: () => {
            const contents = getInventoryContents('hold');
            let text = sceneContext() + 'Select item from Main Hold to transfer:\n\n';

            if (contents.length === 0) {
                text += 'The hold is empty.';
                return text;
            }

            contents.forEach((item, index) => {
                text += `${index + 1}. ${item.name} (${item.quantity})\n`;
            });

            return text;
        },
        choices: () => {
            const contents = getInventoryContents('hold');
            const choices = [];

            if (contents.length > 0) {
                contents.forEach((item, index) => {
                    choices.push({
                        text: `Transfer ${item.name}`,
                        cb: () => {
                            G.transferItem = { from: 'hold', item: item, originalScene: 'inventory_transfer_from_hold' };
                            setScene('inventory_transfer_to');
                        }
                    });
                });
            }

            choices.push({ text: 'Back', cb: () => setScene('inventory_transfer') });
            return choices;
        }
    }
};

window.inventoryScenes = inventoryScenes;
window.calculateUsedSpace = calculateUsedSpace;
window.calculateTotalInventoryWeight = calculateTotalInventoryWeight;
window.addItemToInventory = addItemToInventory;
window.removeItemFromInventory = removeItemFromInventory;
window.transferItem = transferItem;
window.getInventoryContents = getInventoryContents;
