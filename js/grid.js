// js/grid.js
'use strict';

class ShipGrid {
    constructor(w, h) {
        this.w = w;
        this.h = h;
        this.cells = new Array(w * h).fill(null);
        this.cx = Math.floor(w / 2);
        this.cy = Math.floor(h / 2);
        // Place Keel
        this.set(this.cx, this.cy, { type: 'keel', hp: BLOCKS.keel.hp });
    }

    idx(x, y) { return y * this.w + x; }
    get(x, y) {
        if (x < 0 || x >= this.w || y < 0 || y >= this.h) return null;
        return this.cells[this.idx(x, y)];
    }

    set(x, y, data) {
        if (x < 0 || x >= this.w || y < 0 || y >= this.h) return;
        this.cells[this.idx(x, y)] = data;
    }

    remove(x, y) {
        this.set(x, y, null);
        return this.checkIntegrity(); // Returns true if blocks were dropped
    }

    // Flood fill from Keel to find detached blocks
    checkIntegrity() {
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
                    this.cells[this.idx(x, y)] = null;
                    dropped++;
                }
            }
        }
        return dropped > 0;
    }

    getStats() {
        let st = { maxHull: 0, curHull: 0, wgt: 0, sailPwr: 0, maxWater: 10, maxFood: 10, pumpRate: 0, edgeMissing: 0 };
        let expectedEdges = 0;
        let actualEdges = 0;

        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                let cell = this.get(x, y);
                if (cell) {
                    let b = BLOCKS[cell.type];
                    st.maxHull += b.hp;
                    st.curHull += cell.hp;
                    st.wgt += b.wgt;
                    if (b.func === 'sail') st.sailPwr += b.pwr;
                    if (b.func === 'water') st.maxWater += b.cap;
                    if (b.func === 'food') st.maxFood += b.cap;
                    if (b.func === 'pump') st.pumpRate += b.clear;

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
                    }
                }
            }
        }
        st.leakRate = (st.edgeMissing * 0.4) + (actualEdges * 3);
        if (st.wgt === 0) st.wgt = 1; // prevent /0
        return st;
    }

    // Apply random damage to specific grid coordinates
    takeDamage(amount, isStorm) {
        let hits = [];
        let r = Math.floor(amount / 10) + 1;

        // Find valid blocks
        let valid = [];
        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                if (this.get(x, y) && (x !== this.cx || y !== this.cy)) valid.push([x, y]);
            }
        }

        for (let i = 0; i < r; i++) {
            if (valid.length === 0) break;
            let vi = Math.floor(Math.random() * valid.length);
            let [x, y] = valid[vi];
            let cell = this.get(x, y);
            let dmg = Math.floor(Math.random() * 20) + 5;
            cell.hp -= dmg;
            if (cell.hp <= 0) {
                this.remove(x, y);
                valid.splice(vi, 1); // remove from target list
            }
        }

        let dropped = this.checkIntegrity();
        return dropped;
    }

    serialize() { return { w: this.w, h: this.h, cells: this.cells }; }

    deserialize(data) {
        this.w = data.w; this.h = data.h; this.cells = data.cells;
    }
}
