// js/ui.js
'use strict';

const el = id => document.getElementById(id);

let isTyping = false;
let actionQueue = [];
let keyboardNavAdded = false;

// UI logging system
const UI_DEBUG_LEVEL = {
    NONE: 0,
    ERROR: 1,
    WARN: 2,
    INFO: 3,
    DEBUG: 4,
    TRACE: 5
};

const UI_CURRENT_LOG_LEVEL = UI_DEBUG_LEVEL.DEBUG;

function uiLog(level, message, data = null) {
    if (level > UI_CURRENT_LOG_LEVEL) return;

    const timestamp = new Date().toISOString().substr(11, 8);
    const levelStr = Object.keys(UI_DEBUG_LEVEL)[level].padEnd(5);
    const prefix = `[${timestamp}] [${levelStr}] UI:   `;

    if (data) {
        console.log(`${prefix} ${message}`, data);
    } else {
        console.log(`${prefix} ${message}`);
    }
}

function disableUI() {
    isTyping = true;
    document.querySelectorAll('#actions .act-btn').forEach(b => b.disabled = true);
    document.querySelectorAll('.nav-btn').forEach(b => b.disabled = true);
}

function enableUI() {
    isTyping = false;
    el('typing').classList.add('hidden');
    document.querySelectorAll('#actions .act-btn').forEach(b => {
        if (!b.dataset.permDisabled) b.disabled = false;
    });
    document.querySelectorAll('.nav-btn').forEach(b => b.disabled = false);
}

async function printLog(text, type = 'normal') {
    console.log(`[TUTORIAL] ${text.replace(/<[^>]*>/g, '')}`); // Log plain text to console for visibility
    const s = el('story');
    const ps = s.querySelectorAll('.para');
    if (ps.length > 25) ps[0].remove(); // prune
    ps.forEach(p => p.classList.add('old'));

    const p = document.createElement('div');
    p.className = 'para ' + (type === 'alert' ? 'alert' : type === 'sys' ? 'sys' : '');
    p.innerHTML = text;
    s.appendChild(p);

    // Scroll
    let panel = el('story-panel');
    panel.scrollTo({ top: panel.scrollHeight, behavior: 'smooth' });

    if (type === 'alert') playCreak();

    await wait(200); // Reduced pacing delay for responsiveness
}

const SIDEBAR_DEFS = [
    {
        id: 'condition',
        title: 'Condition',
        items: [
            { id: 'v-hp', label: 'Health', type: 'bar' },
            { id: 'v-san', label: 'Sanity', type: 'bar', visible: () => G.san < 100 },
            { id: 'v-scurvy', label: 'Scurvy', type: 'bar' }
        ]
    },
    {
        id: 'logbook',
        title: 'Logbook',
        items: [
            { id: 'v-day', label: 'Day', type: 'val' },
            { id: 'v-watch', label: 'Watch', type: 'val' },
            { id: 'v-loc', label: 'Loc', type: 'val' },
            { id: 'v-wind', label: 'Wind', type: 'val' }
        ]
    },
    {
        id: 'vessel',
        title: 'Vessel',
        visible: () => G.state !== 'Exploring', // concept for future
        items: [
            { id: 'v-hull', label: 'Hull', type: 'bar' },
            { id: 'v-bilge', label: 'Bilge', type: 'bar' },
            { id: 'v-state', label: 'State', type: 'val' },
            { id: 'v-spd', label: 'Speed', type: 'val' },
            { id: 'v-wgt', label: 'Weight', type: 'val' }
        ]
    },
    {
        id: 'stores',
        title: 'Stores',
        items: [
            { id: 'v-food', label: 'Food', type: 'val' },
            { id: 'v-water', label: 'Water', type: 'val' },
            { id: 'v-timber', label: 'Timber', type: 'val', visible: () => G.mat.timber > 0 },
            { id: 'v-metal', label: 'Metal', type: 'val', visible: () => G.mat.metal > 0 },
            { id: 'v-rope', label: 'Rope', type: 'val', visible: () => G.mat.rope > 0 },
            { id: 'v-canvas', label: 'Canvas', type: 'val', visible: () => G.mat.canvas > 0 }
        ]
    }
];

const ITEM_ICONS = {
    'Health': '✙',
    'Sanity': 'ψ',
    'Day': '◈',
    'Watch': '⧖',
    'Loc': '⌖',
    'Wind': '彡',
    'Hull': '■',
    'Bilge': '░',
    'State': '⊚',
    'Speed': '»',
    'Weight': '⊥',
    'Food': '⑇',
    'Water': '⌇',
    'Timber': '≡',
    'Metal': '▣',
    'Rope': '§',
    'Canvas': '◬',
    'Scurvy': '⑈'
};

let uiState = {
    collapsed: JSON.parse(localStorage.getItem('dc_ui_collapsed') || '{}')
};

function toggleSection(id) {
    uiState.collapsed[id] = !uiState.collapsed[id];
    localStorage.setItem('dc_ui_collapsed', JSON.stringify(uiState.collapsed));
    updateUI();
}

function renderSidebar() {
    const panel = el('status-panel');
    if (!panel) return;
    panel.innerHTML = '';

    SIDEBAR_DEFS.forEach(sec => {
        if (sec.visible && !sec.visible()) return;

        const sDiv = document.createElement('div');
        sDiv.className = 's-sec' + (uiState.collapsed[sec.id] ? ' collapsed' : '');

        const head = document.createElement('div');
        head.className = 's-head';
        head.textContent = sec.title;
        head.onclick = () => toggleSection(sec.id);
        sDiv.appendChild(head);

        const body = document.createElement('div');
        body.className = 's-sec-body';

        sec.items.forEach(item => {
            if (item.visible && !item.visible()) return;

            const row = document.createElement('div');
            row.className = 's-row';

            const lbl = document.createElement('span');
            lbl.className = 's-lbl';
            const icon = ITEM_ICONS[item.label] || '';
            lbl.innerHTML = icon ? icon + ' ' + item.label : item.label;
            row.appendChild(lbl);

            if (item.type === 'bar') {
                const bg = document.createElement('div');
                bg.className = 's-bar-bg';
                const fg = document.createElement('div');
                fg.className = 's-bar-fg';
                fg.id = item.id;
                bg.appendChild(fg);
                row.appendChild(bg);
            } else {
                const val = document.createElement('span');
                val.className = 's-val';
                val.id = item.id;
                row.appendChild(val);
            }
            body.appendChild(row);
        });

        sDiv.appendChild(body);
        panel.appendChild(sDiv);
    });
}

function updateUI() {
    uiLog(UI_DEBUG_LEVEL.DEBUG, 'Updating UI');

    if (!G.ship) {
        uiLog(UI_DEBUG_LEVEL.WARN, 'No ship object available for UI update');
        return;
    }

    renderSidebar(); // Re-render to handle dynamic visibility and order

    el('v-day').textContent = G.day;
    const w = ['Midnight', 'Midwatch', 'Morning', 'Forenoon', 'Afternoon', 'Dog Watch'][Math.floor(G.hour / 4)] || 'Watch';
    el('v-watch').textContent = `${w} (${G.hour}:00)`;

    if (el('v-loc')) el('v-loc').textContent = G.locName || 'Open Ocean';
    if (el('v-wind')) el('v-wind').textContent = `${DIRS[G.windDir]} (${Math.round(G.windSpd)}kt)`;

    let st = G.ship.getStats();

    const setBar = (id, v, mx) => {
        const b = el(id);
        if (!b) return;
        const percentage = Math.min(100, Math.max(0, (v / mx) * 100));
        b.style.width = percentage + '%';
        if (id !== 'v-bilge') {
            const wasCrit = b.className.includes('crit');
            const wasLow = b.className.includes('low');
            const isCrit = (id === 'v-scurvy') ? percentage > 70 : percentage < 30;
            const isLow = (id === 'v-scurvy') ? percentage > 40 : percentage < 60;

            if (isCrit && !wasCrit) uiLog(UI_DEBUG_LEVEL.WARN, `${id} entered critical state (${percentage.toFixed(1)}%)`);
            else if (!isCrit && isLow && !wasLow) uiLog(UI_DEBUG_LEVEL.INFO, `${id} entered low state (${percentage.toFixed(1)}%)`);

            b.className = 's-bar-fg ' + (isCrit ? 'crit' : isLow ? 'low' : '');
        }
    };

    setBar('v-hull', st.curHull, st.maxHull);
    setBar('v-bilge', G.bilge, 100);
    setBar('v-hp', G.hp, 100);
    setBar('v-san', G.san, 100);
    setBar('v-scurvy', G.scurvy, 100);

    const blg = el('v-bilge');
    if (blg) {
        const bilgePercentage = (G.bilge / 100) * 100;
        blg.style.background = G.bilge > 70 ? 'var(--red)' : G.bilge > 40 ? '#6a4c28' : '#364e32';
        if (bilgePercentage > 90) uiLog(UI_DEBUG_LEVEL.WARN, `Bilge at critical level: ${G.bilge}%`);
    }

    if (el('v-state')) el('v-state').textContent = G.state;
    if (el('v-spd')) el('v-spd').textContent = Math.round(G.spd) + 'kt';
    if (el('v-wgt')) el('v-wgt').textContent = Math.round(st.wgt) + 't';

    if (el('v-food')) el('v-food').textContent = `S:${G.foodStocks.salt.toFixed(1)} F:${G.foodStocks.fresh.toFixed(1)} C:${G.foodStocks.citrus.toFixed(1)}`;
    if (el('v-water')) el('v-water').textContent = `F:${G.waterStocks.fresh.toFixed(1)} R:${G.waterStocks.rain.toFixed(1)} D:${G.waterStocks.distilled.toFixed(1)} E:${G.waterStocks.exotic.toFixed(1)}`;

    ['timber', 'canvas', 'rope', 'metal'].forEach(m => {
        const met = el(`v-${m}`);
        if (met) met.textContent = G.mat[m] || 0;
    });

    uiLog(UI_DEBUG_LEVEL.TRACE, 'UI update completed');
}

async function renderChoices(choices) {
    if (isTyping) await wait(600); // Wait for last text to print
    const p = el('actions');
    p.innerHTML = '';

    if (typeof choices === 'function') choices = choices();

    choices.forEach(c => {
        if (c.req && !c.req(G)) return;
        const btn = document.createElement('button');
        btn.className = 'act-btn';
        btn.innerHTML = c.text + (c.desc ? `<div class="act-desc">${c.desc}</div>` : '');
        if (c.disabled && c.disabled(G)) {
            btn.disabled = true;
            btn.dataset.permDisabled = "true";
        }
        btn.onclick = async () => {
            if (btn.dataset.clicked === '1') return;
            btn.dataset.clicked = '1';
            p.querySelectorAll('.act-btn').forEach(b => b.disabled = true);
            checkAudio(); // Force audio start/resume
            initFX();
            if (c.log) await printLog(`> ${c.log}`, 'sys');
            await c.cb();
            if (!isTyping) {
                p.querySelectorAll('.act-btn').forEach(b => {
                    if (!b.dataset.permDisabled) b.disabled = false;
                });
            }
        };
        p.appendChild(btn);
    });

    if (!keyboardNavAdded) {
        const actionsPanel = el('actions-panel');
        actionsPanel.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                const buttons = Array.from(actionsPanel.querySelectorAll('.act-btn:not([disabled])'));
                if (buttons.length === 0) return;
                const focused = document.activeElement;
                let index = buttons.indexOf(focused);
                if (index === -1) index = 0;
                if (e.key === 'ArrowDown') {
                    index = (index + 1) % buttons.length;
                } else {
                    index = index <= 0 ? buttons.length - 1 : index - 1;
                }
                buttons[index].focus();
            }
        });
        keyboardNavAdded = true;
    }
}

// Mobile Tab navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(p => p.classList.remove('active-tab'));
        el(btn.dataset.tab).classList.add('active-tab');
    });
});

function openWorkshop() {
    el('workshop-panel').style.display = 'flex';
    renderWorkshop();
}

function closeWorkshop() {
    el('workshop-panel').style.display = 'none';

    // always bounce back to the deck/primary scene when the player explicitly closes the
    // workshop.  This prevents the tutorial helper logic from immediately reopening the
    // overlay and gives the user real control over the UI.
    if (currentScene === 'tutorial_workshop') {
        // if the player has patched enough planks we advance the tutorial, otherwise drop
        // them straight onto the deck where they can decide whether to return below.
        if (G.tutorialPhase === 'patch') {
            const plankCount = G.ship.cells.reduce((n, c) => n + ((c && c.type === 'plank') ? 1 : 0), 0);
            if (plankCount >= 2) {
                G.tutorialPhase = 'sail';
                setScene('tutorial_sail');
                return;
            }
        }
        setScene('deck');
    }
}

function openChart() {
    el('chart-panel').style.display = 'flex';
    if (typeof Chart.resize === 'function') Chart.resize();
    else renderChart();
}

function closeChart() {
    el('chart-panel').style.display = 'none';
}

const chartNoteButton = document.getElementById('chart-note-btn');
if (chartNoteButton) {
    chartNoteButton.addEventListener('click', async () => {
        console.log('Chart note button clicked');
        await printLog('Right-click on the chart to add waypoints. Left-click waypoints to delete them.', 'sys');
    });
}

let wsSelectedBlock = null;

function renderWorkshop() {
    const sc = el('ship-grid');
    const sg = G.ship;
    sc.style.gridTemplateColumns = `repeat(${sg.w}, 32px)`;
    sc.style.gridTemplateRows = `repeat(${sg.h}, 32px)`;
    sc.innerHTML = '';

    for (let y = 0; y < sg.h; y++) {
        for (let x = 0; x < sg.w; x++) {
            let cx = document.createElement('div');
            cx.className = 'g-cell';

            let data = sg.get(x, y);
            if (data) {
                let def = BLOCKS[data.type];
                cx.classList.add(def.cl);
                cx.textContent = def.ch;
                // Damage indicator opacity
                let hpPct = data.hp / def.hp;
                if (hpPct < 1) cx.style.opacity = Math.max(0.3, hpPct);
                if (def.func === 'hull' && !data.sealed) cx.style.outline = '1px dashed #5a4a34';
            }

            cx.onclick = () => wsCellClick(x, y);
            sc.appendChild(cx);
        }
    }

    renderBuildMenu();
}

function wsCellClick(x, y) {
    let sg = G.ship;
    let st = G.ship.getStats();
    let cell = sg.get(x, y);

    if (cell) {
        let b = BLOCKS[cell.type];
        el('ws-mode-text').textContent = `[${b.name}] HP:${cell.hp}/${b.hp}`;
        // Removing block
        if (cell.type !== 'keel') {
            const opts = [{
                text: `Dismantle ${b.name}`,
                cb: () => {
                    sg.remove(x, y);
                    renderWorkshop();
                    updateUI();
                }
            }];
            if (b.func === 'hull' && !cell.sealed) {
                opts.push({
                    text: 'Caulk Plank (1 Canvas)',
                    desc: 'Seals seams to reduce leaks.',
                    disabled: () => (G.mat.canvas || 0) < 1,
                    cb: () => {
                        G.mat.canvas -= 1;
                        cell.sealed = true;
                        renderWorkshop();
                        updateUI();
                    }
                });
            }
            renderBuildMenu(opts);
        } else {
            renderBuildMenu([]);
        }
    } else {
        el('ws-mode-text').textContent = `[Empty Slot ${x},${y}]`;
        // Building
        let opts = [];
        for (let key in BLOCKS) {
            if (key === 'keel') continue;
            let b = BLOCKS[key];

            opts.push({
                text: `Build ${b.name}`,
                desc: `${b.desc} (Cost: ${Object.keys(b.cost).map(k => b.cost[k] + ' ' + k).join(', ')})`,
                disabled: () => {
                    for (let k in b.cost) if ((G.mat[k] || 0) < b.cost[k]) return true;
                    // Connectivity rule
                    let hasNeighbor = sg.get(x - 1, y) || sg.get(x + 1, y) || sg.get(x, y - 1) || sg.get(x, y + 1);
                    if (!hasNeighbor) return true;
                    if (b.func === 'sail') {
                        const hasStay =
                            (sg.get(x - 1, y) && sg.get(x - 1, y).type === 'stay') ||
                            (sg.get(x + 1, y) && sg.get(x + 1, y).type === 'stay') ||
                            (sg.get(x, y - 1) && sg.get(x, y - 1).type === 'stay') ||
                            (sg.get(x, y + 1) && sg.get(x, y + 1).type === 'stay');
                        if (!hasStay) return true;
                    }
                    return false;
                },
                cb: () => {
                    // Log resource costs before spending
                    const costDetails = Object.keys(b.cost).map(k => `${b.cost[k]} ${k}`).join(', ');
                    uiLog(UI_DEBUG_LEVEL.INFO, `Building ${b.name} at (${x}, ${y}) - cost: ${costDetails}`);

                    // Track resource changes
                    const oldResources = {};
                    for (let k in b.cost) {
                        oldResources[k] = G.mat[k] || 0;
                    }

                    for (let k in b.cost) G.mat[k] -= b.cost[k];

                    // Log resource changes
                    if (typeof logResourceChange !== 'undefined') {
                        for (let k in b.cost) {
                            logResourceChange(k, oldResources[k], G.mat[k], `building ${b.name.toLowerCase()}`);
                        }
                    }

                    sg.set(x, y, { type: key, hp: b.hp, sealed: b.func !== 'hull' });
                    updateUI();
                    renderWorkshop();
                }
            });
        }
        renderBuildMenu(opts);
    }
}

function renderBuildMenu(customOpts) {
    el('build-menu').innerHTML = '';
    if (customOpts) {
        customOpts.forEach(o => {
            let b = document.createElement('button');
            b.className = 'act-btn';
            b.innerHTML = o.text + (o.desc ? `<div class="act-desc">${o.desc}</div>` : '');
            if (o.disabled && o.disabled()) b.disabled = true;
            b.onclick = o.cb;
            el('build-menu').appendChild(b);
        });
    } else {
        el('ws-mode-text').textContent = "Select a grid space.";
    }

    let st = G.ship.getStats();
    el('ws-stats').innerHTML =
        `Hull: ${st.curHull}/${st.maxHull} | Weight: ${st.wgt}t | SailPower: ${st.sailPwr} | ` +
        `Water: ${st.maxWater} | Food: ${st.maxFood} | Bilge: ${G.bilge}`;
}

// Developer Console System
let devConsole = null;
let consoleHistory = [];
let historyIndex = -1;

function createDevConsole() {
    if (devConsole) return devConsole;

    devConsole = document.createElement('div');
    devConsole.id = 'dev-console';
    devConsole.innerHTML = `
        <div id="console-header">
            <span>Developer Console</span>
            <button id="console-close">×</button>
        </div>
        <div id="console-output"></div>
        <div id="console-input-container">
            <span id="console-prompt">></span>
            <input type="text" id="console-input" autocomplete="off">
        </div>
    `;

    document.body.appendChild(devConsole);

    // Event listeners
    const input = el('console-input');
    const closeBtn = el('console-close');

    closeBtn.onclick = () => toggleDevConsole(false);
    input.onkeydown = handleConsoleInput;

    return devConsole;
}

function toggleDevConsole(show) {
    if (show === undefined) {
        show = !devConsole || devConsole.style.display !== 'flex';
    }

    if (show && !devConsole) {
        createDevConsole();
    }

    if (devConsole) {
        devConsole.style.display = show ? 'flex' : 'none';
        if (show) {
            el('console-input').focus();
        }
    }
}

function handleConsoleInput(e) {
    const input = el('console-input');

    if (e.key === 'Enter') {
        const command = input.value.trim();
        if (command) {
            executeCommand(command);
            consoleHistory.unshift(command);
            historyIndex = -1;
        }
        input.value = '';
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex < consoleHistory.length - 1) {
            historyIndex++;
            input.value = consoleHistory[historyIndex];
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex > 0) {
            historyIndex--;
            input.value = consoleHistory[historyIndex];
        } else if (historyIndex === 0) {
            historyIndex = -1;
            input.value = '';
        }
    } else if (e.key === 'Escape') {
        toggleDevConsole(false);
    }
}

function executeCommand(command) {
    const output = el('console-output');
    const parts = command.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Add command to output
    const cmdLine = document.createElement('div');
    cmdLine.className = 'console-line command';
    cmdLine.textContent = `> ${command}`;
    output.appendChild(cmdLine);

    let result = '';

    try {
        switch (cmd) {
            case 'help':
                result = `Available commands:
setscene [scene_id] - Jump to any scenario
teleport [x] [y] - Teleport to coordinates
god - Max health, food, water, morale
resources [type] [amount] - Set resource amount
weather [type] - Set weather (Clear, Gale, Storm)
time [hours] - Advance time by hours
save - Force save game
load - Force load game
clear - Clear console
list scenes - List all available scenes
help - Show this help`;
                break;

            case 'setscene':
                if (args[0]) {
                    if (typeof setScene === 'function') {
                        setScene(args[0]);
                        result = `Jumped to scene: ${args[0]}`;
                    } else {
                        result = 'Error: setScene function not available';
                    }
                } else {
                    result = 'Usage: setscene [scene_id]';
                }
                break;

            case 'teleport':
                if (args.length >= 2) {
                    const x = parseFloat(args[0]);
                    const y = parseFloat(args[1]);
                    if (!isNaN(x) && !isNaN(y)) {
                        G.x = x;
                        G.y = y;
                        revealFogAt(x, y);
                        updateUI();
                        result = `Teleported to: (${x}, ${y})`;
                    } else {
                        result = 'Invalid coordinates';
                    }
                } else {
                    result = 'Usage: teleport [x] [y]';
                }
                break;

            case 'god':
                G.hp = 100;
                G.san = 100;
                G.food = 100;
                G.water = 100;
                G.morale = 100;
                G.bilge = 0;
                updateUI();
                result = 'God mode activated - all stats maxed';
                break;

            case 'resources':
                if (args.length >= 2) {
                    const type = args[0].toLowerCase();
                    const amount = parseInt(args[1]);
                    if (!isNaN(amount)) {
                        switch (type) {
                            case 'food':
                                G.food = amount;
                                break;
                            case 'water':
                                G.water = amount;
                                break;
                            case 'timber':
                                G.mat.timber = amount;
                                break;
                            case 'canvas':
                                G.mat.canvas = amount;
                                break;
                            case 'rope':
                                G.mat.rope = amount;
                                break;
                            case 'metal':
                                G.mat.metal = amount;
                                break;
                            default:
                                result = 'Unknown resource type. Use: food, water, timber, canvas, rope, metal';
                                break;
                        }
                        if (result === '') {
                            updateUI();
                            result = `Set ${type} to ${amount}`;
                        }
                    } else {
                        result = 'Invalid amount';
                    }
                } else {
                    result = 'Usage: resources [type] [amount]';
                }
                break;

            case 'weather':
                if (args[0]) {
                    const weather = args[0].charAt(0).toUpperCase() + args[0].slice(1).toLowerCase();
                    if (['Clear', 'Gale', 'Storm'].includes(weather)) {
                        G.wx = weather;
                        updateUI();
                        result = `Weather set to: ${weather}`;
                    } else {
                        result = 'Valid weather: Clear, Gale, Storm';
                    }
                } else {
                    result = 'Usage: weather [type]';
                }
                break;

            case 'time':
                if (args[0]) {
                    const hours = parseInt(args[0]);
                    if (!isNaN(hours) && hours > 0) {
                        for (let i = 0; i < hours; i++) {
                            if (typeof advanceTime === 'function') {
                                advanceTime(1);
                            }
                        }
                        result = `Advanced time by ${hours} hours`;
                    } else {
                        result = 'Invalid hours amount';
                    }
                } else {
                    result = 'Usage: time [hours]';
                }
                break;

            case 'save':
                if (typeof saveGame === 'function') {
                    saveGame();
                    result = 'Game saved';
                } else {
                    result = 'Save function not available';
                }
                break;

            case 'load':
                if (typeof loadGame === 'function') {
                    const success = loadGame();
                    result = success ? 'Game loaded' : 'No save data found';
                } else {
                    result = 'Load function not available';
                }
                break;

            case 'list':
                if (args[0] === 'scenes') {
                    if (typeof Scenes !== 'undefined') {
                        const sceneList = Object.keys(Scenes).join(', ');
                        result = `Available scenes: ${sceneList}`;
                    } else {
                        result = 'Scenes object not available';
                    }
                } else {
                    result = 'Usage: list scenes';
                }
                break;

            case 'clear':
                output.innerHTML = '';
                return; // Don't add result line

            default:
                result = `Unknown command: ${cmd}. Type 'help' for available commands.`;
        }
    } catch (error) {
        result = `Error executing command: ${error.message}`;
    }

    // Add result to output
    if (result) {
        const resultLine = document.createElement('div');
        resultLine.className = 'console-line result';
        resultLine.textContent = result;
        output.appendChild(resultLine);
    }

    // Auto-scroll to bottom
    output.scrollTop = output.scrollHeight;
}

// Add global key listener for console toggle
document.addEventListener('keydown', function (e) {
    if (e.key === '`' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        toggleDevConsole();
    }
});
