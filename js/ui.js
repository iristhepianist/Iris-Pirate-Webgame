// js/ui.js
'use strict';

const el = id => document.getElementById(id);
const wait = ms => new Promise(res => setTimeout(res, ms));

let isTyping = false;
let actionQueue = [];

function disableUI() {
    isTyping = true;
    document.querySelectorAll('.act-btn').forEach(b => b.disabled = true);
    document.querySelectorAll('.nav-btn').forEach(b => b.disabled = true);
}

function enableUI() {
    isTyping = false;
    el('typing').classList.add('hidden');
    document.querySelectorAll('.act-btn').forEach(b => {
        if (!b.dataset.permDisabled) b.disabled = false;
    });
    document.querySelectorAll('.nav-btn').forEach(b => b.disabled = false);
}

async function printLog(text, type = 'normal') {
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

function updateUI() {
    if (!G.ship) return;
    el('v-day').textContent = G.day;
    const w = ['Midnight', 'Midwatch', 'Morning', 'Forenoon', 'Afternoon', 'Dog Watch'][Math.floor(G.hour / 4)] || 'Watch';
    el('v-watch').textContent = `${w} (${G.hour}:00)`;

    el('v-loc').textContent = G.locName || 'Open Ocean';
    el('v-wind').textContent = `${DIRS[G.windDir]} (${Math.round(G.windSpd)}kt)`;


    let st = G.ship.getStats();

    const setBar = (id, v, mx) => {
        const b = el(id);
        b.style.width = Math.min(100, Math.max(0, (v / mx) * 100)) + '%';
        if (id !== 'v-bilge') b.className = 's-bar-fg ' + (v / mx < 0.3 ? 'crit' : v / mx < 0.6 ? 'low' : '');
    };

    setBar('v-hull', st.curHull, st.maxHull);
    setBar('v-bilge', G.bilge, 100);
    setBar('v-hp', G.hp, 100);
    setBar('v-san', G.san, 100);

    const blg = el('v-bilge');
    blg.style.background = G.bilge > 70 ? 'var(--red)' : G.bilge > 40 ? '#6a4c28' : '#364e32';

    el('v-state').textContent = G.state;
    el('v-spd').textContent = Math.round(G.spd) + 'kt';
    el('v-wgt').textContent = st.wgt + 't';

    el('v-food').textContent = G.food.toFixed(1) + '/' + st.maxFood;
    el('v-water').textContent = G.water.toFixed(1) + '/' + st.maxWater;

    ['timber', 'canvas', 'rope', 'metal'].forEach(m => {
        el(`v-${m}`).textContent = G.mat[m] || 0;
    });
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
            checkAudio(); // Force audio start/resume
            initFX();
            if (c.log) await printLog(`> ${c.log}`, 'sys');
            c.cb();
        };
        p.appendChild(btn);
    });
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
    if (G.tutorialPhase === 'patch') {
        let st = G.ship.getStats();
        if (st.curHull > 25) { // Built the plank
            G.tutorialPhase = 'sail';
            setScene('tutorial_sail');
        } else {
            setScene('tutorial_workshop');
        }
    }
}

function openChart() {
    el('chart-panel').style.display = 'flex';
    renderChart();
}

function closeChart() {
    el('chart-panel').style.display = 'none';
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
            renderBuildMenu([{
                text: `Dismantle ${b.name}`,
                cb: () => {
                    sg.remove(x, y);
                    renderWorkshop();
                    updateUI();
                }
            }]);
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
                    return false;
                },
                cb: () => {
                    for (let k in b.cost) G.mat[k] -= b.cost[k];
                    sg.set(x, y, { type: key, hp: b.hp });
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
        `Storage (Food:${st.maxFood} Water:${st.maxWater}) | ` +
        `Leak Rate: ${st.leakRate}/hr | Pump: ${st.pumpRate}/hr`;
}
