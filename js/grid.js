// js/grid.js
'use strict';

// Ship system logging
const SHIP_DEBUG_LEVEL = {
    NONE: 0,
    ERROR: 1,
    WARN: 2,
    INFO: 3,
    DEBUG: 4,
    TRACE: 5
};

const SHIP_CURRENT_LOG_LEVEL = SHIP_DEBUG_LEVEL.DEBUG;

function shipLog(level, message, data = null) {
    if (level > SHIP_CURRENT_LOG_LEVEL) return;

    const timestamp = new Date().toISOString().substr(11, 8);
    const levelStr = Object.keys(SHIP_DEBUG_LEVEL)[level].padEnd(5);
    const prefix = `[${timestamp}] [${levelStr}] SHIP: `;

    if (data) {
        console.log(`${prefix} ${message}`, data);
    } else {
        console.log(`${prefix} ${message}`);
    }
}

class ShipGrid {
    constructor(w, h) {
        shipLog(SHIP_DEBUG_LEVEL.INFO, `Creating new ShipGrid: ${w}x${h}`);

        this.w = w;
        this.h = h;
        this.cells = new Array(w * h).fill(null);
        this.cx = Math.floor(w / 2);
        this.cy = Math.floor(h / 2);

        // Place Keel
        this.set(this.cx, this.cy, { type: 'keel', hp: BLOCKS.keel.hp });
        shipLog(SHIP_DEBUG_LEVEL.DEBUG, `Placed keel at center (${this.cx}, ${this.cy})`);
    }

    idx(x, y) { return y * this.w + x; }

    get(x, y) {
        if (x < 0 || x >= this.w || y < 0 || y >= this.h) {
            shipLog(SHIP_DEBUG_LEVEL.TRACE, `Grid access out of bounds: (${x}, ${y}) in ${this.w}x${this.h} grid`);
            return null;
        }
        return this.cells[this.idx(x, y)];
    }

    set(x, y, data) {
        if (x < 0 || x >= this.w || y < 0 || y >= this.h) {
            shipLog(SHIP_DEBUG_LEVEL.WARN, `Attempted to set cell out of bounds: (${x}, ${y}) in ${this.w}x${this.h} grid`);
            return;
        }

        const oldData = this.cells[this.idx(x, y)];
        this.cells[this.idx(x, y)] = data;

        if (oldData && data) {
            shipLog(SHIP_DEBUG_LEVEL.DEBUG, `Modified cell (${x}, ${y}): ${oldData.type} -> ${data.type}`);
        } else if (oldData && !data) {
            shipLog(SHIP_DEBUG_LEVEL.INFO, `Removed ${oldData.type} from (${x}, ${y})`);
        } else if (!oldData && data) {
            shipLog(SHIP_DEBUG_LEVEL.INFO, `Placed ${data.type} at (${x}, ${y})`);
        }
    }

    remove(x, y) {
        const cell = this.get(x, y);
        if (cell) {
            shipLog(SHIP_DEBUG_LEVEL.INFO, `Removing ${cell.type} from (${x}, ${y})`);
        }

        this.set(x, y, null);
        const droppedBlocks = this.checkIntegrity();

        if (droppedBlocks) {
            shipLog(SHIP_DEBUG_LEVEL.WARN, `Block removal caused ${droppedBlocks} blocks to fall off ship`);
        }

        return droppedBlocks;
    }

    // Flood fill from Keel to find detached blocks
    checkIntegrity() {
        shipLog(SHIP_DEBUG_LEVEL.DEBUG, 'Checking ship structural integrity');

        let visited = new Set();
        let queue = [[this.cx, this.cy]];
        visited.add(this.idx(this.cx, this.cy));

        while (queue.length > 0) {
            let [px, py] = queue.pop();
            const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
            for (let d of dirs) {
                let nx = px + d[0], ny = py + d[1];
                let ni = this.idx(nx, ny);
                if (this.get(nx, ny) && !visited.has(ni)) {
                    visited.add(ni);
                    queue.push([nx, ny]);
                }
            }
        }

        let dropped = 0;
        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                if (this.get(x, y) && !visited.has(this.idx(x, y))) {
                    const cell = this.get(x, y);
                    shipLog(SHIP_DEBUG_LEVEL.WARN, `Detached block ${cell.type} at (${x}, ${y}) will be removed`);
                    this.cells[this.idx(x, y)] = null;
                    dropped++;
                }
            }
        }

        shipLog(SHIP_DEBUG_LEVEL.DEBUG, `Integrity check complete: ${dropped} blocks removed`);
        return dropped > 0;
    }

    getStats() {
        shipLog(SHIP_DEBUG_LEVEL.DEBUG, 'Calculating ship statistics');

        let st = {
            maxHull: 0, curHull: 0, wgt: 0, sailPwr: 0, maxWater: 0, maxFood: 0, pumpRate: 0,
            stayCount: 0, mastCount: 0, unsealed: 0, leakRate: 0,
            leakBow: 0, leakMid: 0, leakStern: 0, edgeMissing: 0,
            maxRain: 0,
            // Inventory storage capacities
            storageCapacity: {
                hold: 100,           // Base hold capacity
                pantry: 0,           // Food storage from pantry blocks
                water_cask: 0,       // Water storage from cask blocks
                equipment_locker: 10, // Base equipment storage
                artifact_case: 5     // Base artifact storage
            },
            // Inventory weight tracking
            inventoryWeight: 0,
            inventoryVolume: 0
        };
        let expectedEdges = 0;
        let actualEdges = 0;
        let sumX = 0, sumW = 0;

        let blockCounts = {};
        let damagedBlocks = 0;

        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                let cell = this.get(x, y);
                if (cell) {
                    let b = BLOCKS[cell.type];
                    blockCounts[cell.type] = (blockCounts[cell.type] || 0) + 1;

                    st.maxHull += b.hp;
                    st.curHull += cell.hp;
                    st.wgt += b.wgt;
                    sumX += x * b.wgt;
                    sumW += b.wgt;
                    if (b.func === 'sail') st.sailPwr += b.pwr;
                    if (b.func === 'water') {
                        st.maxWater += b.cap;
                        st.storageCapacity.water_cask += b.cap; // Add to water storage capacity
                    }
                    if (b.func === 'food') {
                        st.maxFood += b.cap;
                        st.storageCapacity.pantry += b.cap; // Add to food storage capacity
                    }
                    if (b.func === 'rain') st.maxRain += b.cap;
                    if (b.func === 'pump') st.pumpRate += b.clear;
                    if (b.func === 'stay') st.stayCount++;
                    if (b.func === 'sail') st.mastCount++;
                    if (b.func === 'hull' && !cell.sealed) st.unsealed++;

                    // Check for damaged blocks
                    if (cell.hp < b.hp) {
                        damagedBlocks++;
                        shipLog(SHIP_DEBUG_LEVEL.TRACE, `Damaged ${cell.type} at (${x}, ${y}): ${cell.hp}/${b.hp} HP`);
                    }

                    // Rough edge detection for leaks
                    if (y === 0 || y === this.h - 1 || x === 0 || x === this.w - 1 ||
                        !this.get(x - 1, y) || !this.get(x + 1, y) || !this.get(x, y - 1) || !this.get(x, y + 1)) {
                        expectedEdges++;
                        if (cell.hp < b.hp * 0.5) actualEdges += 0.5; // Damaged edge leaks
                    }
                } else {
                    // Check if adjacent to a block (meaning it's an exposed internal missing block)
                    if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) {
                        st.edgeMissing++;
                        if (y < this.h * 0.33) st.leakBow += 1;
                        else if (y > this.h * 0.66) st.leakStern += 1;
                        else st.leakMid += 1;
                    }
                }
            }
        }

        st.leakRate = (st.edgeMissing * 0.4) + (actualEdges * 3) + (st.unsealed * 0.6);
        if (sumW > 0) st.list = (sumX / sumW) - this.cx;
        if (st.wgt === 0) st.wgt = 1; // prevent /0

        shipLog(SHIP_DEBUG_LEVEL.DEBUG, `Ship stats calculated: hull=${st.curHull}/${st.maxHull}, weight=${st.wgt}t, sailPower=${st.sailPwr}, leakRate=${st.leakRate.toFixed(2)}`);

        if (damagedBlocks > 0) {
            shipLog(SHIP_DEBUG_LEVEL.WARN, `${damagedBlocks} damaged blocks detected`);
        }

        if (st.leakRate > 5) {
            shipLog(SHIP_DEBUG_LEVEL.WARN, `High leak rate: ${st.leakRate.toFixed(2)}`);
        }

        return st;
    }

    takeDamage(amount, isStorm = false) {
        shipLog(SHIP_DEBUG_LEVEL.INFO, `Ship taking ${amount} damage (${isStorm ? 'storm' : 'collision'})`);

        let damageableCells = [];
        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                let cell = this.get(x, y);
                if (cell && cell.hp > 0) {
                    // Weight damage distribution by exposure
                    let exposure = 0;
                    if (y === 0 || y === this.h - 1) exposure += 2; // top/bottom edges
                    if (x === 0 || x === this.w - 1) exposure += 2; // left/right edges
                    if (!this.get(x - 1, y) || !this.get(x + 1, y) || !this.get(x, y - 1) || !this.get(x, y + 1)) {
                        exposure += 1; // exposed sides
                    }
                    damageableCells.push({ x, y, cell, exposure });
                }
            }
        }

        let totalDamage = 0;
        let destroyedBlocks = 0;

        for (let i = 0; i < amount && damageableCells.length > 0; i++) {
            // Weight random selection by exposure
            let totalWeight = damageableCells.reduce((sum, dc) => sum + dc.exposure + 1, 0);
            let roll = Math.random() * totalWeight;

            for (let dc of damageableCells) {
                roll -= (dc.exposure + 1);
                if (roll <= 0) {
                    const oldHP = dc.cell.hp;
                    dc.cell.hp -= 1;
                    totalDamage++;

                    shipLog(SHIP_DEBUG_LEVEL.TRACE, `${dc.cell.type} at (${dc.x}, ${dc.y}) damaged: ${oldHP} -> ${dc.cell.hp}`);

                    if (dc.cell.hp <= 0) {
                        shipLog(SHIP_DEBUG_LEVEL.WARN, `${dc.cell.type} at (${dc.x}, ${dc.y}) destroyed`);
                        this.cells[this.idx(dc.x, dc.y)] = null;
                        destroyedBlocks++;

                        // Check if this breaks ship integrity
                        if (this.checkIntegrity()) {
                            shipLog(SHIP_DEBUG_LEVEL.ERROR, 'Ship integrity compromised - blocks detached');
                        }
                    }

                    // Remove from damageable list if destroyed or if it's the keel (indestructible)
                    if (dc.cell.hp <= 0 || dc.cell.type === 'keel') {
                        damageableCells.splice(damageableCells.indexOf(dc), 1);
                    }
                    break;
                }
            }
        }

        shipLog(SHIP_DEBUG_LEVEL.INFO, `Damage applied: ${totalDamage} HP damage, ${destroyedBlocks} blocks destroyed`);

        if (destroyedBlocks > 0) {
            shipLog(SHIP_DEBUG_LEVEL.WARN, `${destroyedBlocks} ship blocks were destroyed`);
        }

        return totalDamage;
    }

    serialize() {
        shipLog(SHIP_DEBUG_LEVEL.DEBUG, 'Serializing ship grid for save');

        return {
            w: this.w,
            h: this.h,
            cells: this.cells.map(cell => cell ? { ...cell } : null)
        };
    }
}
