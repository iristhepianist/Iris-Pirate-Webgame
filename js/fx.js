// js/fx.js
'use strict';

const FX = {
    cv: null,
    ctx: null,
    w: 0, h: 0,
    parts: [],
    run: false,
    fogBuf: null // Offscreen canvas for fog
};

function initFX() {
    FX.cv = document.getElementById('fx');
    FX.ctx = FX.cv.getContext('2d');

    const resize = () => {
        FX.w = FX.cv.width = window.innerWidth;
        FX.h = FX.cv.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Pre-render a Fog Puff for high performance
    FX.fogBuf = document.createElement('canvas');
    FX.fogBuf.width = 128; FX.fogBuf.height = 128;
    let bctx = FX.fogBuf.getContext('2d');
    let grad = bctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(100,110,120,0.1)'); // Slightly denser
    grad.addColorStop(1, 'rgba(100,110,120,0)');
    bctx.fillStyle = grad;
    bctx.beginPath(); bctx.arc(64, 64, 64, 0, Math.PI * 2); bctx.fill();

    FX.run = true;
    requestAnimationFrame(loopFX);
}

function loopFX() {
    if (!FX.run) return;
    const ctx = FX.ctx;
    ctx.clearRect(0, 0, FX.w, FX.h);

    let targetParts = 0;
    let type = 'none';
    let windShift = G.windSpd ? (G.windSpd / 20) : 0;

    if (G.wx === 'Storm') { targetParts = 350; type = 'rain'; }
    else if (G.wx === 'Gale') { targetParts = 120; type = 'rain'; }
    else if (G.wx === 'Calm') { targetParts = 15; type = 'fog'; }

    // Add missing parts
    if (FX.parts.length < targetParts) {
        if (type === 'rain') {
            FX.parts.push({
                x: Math.random() * FX.w, y: -Math.random() * 200,
                s: 15 + Math.random() * 20, type: 'rain'
            });
        }
        else if (type === 'fog') {
            FX.parts.push({
                x: Math.random() * FX.w, y: Math.random() * FX.h,
                s: 0.1 + Math.random() * 0.2, a: Math.random() * Math.PI * 2,
                rad: 150 + Math.random() * 200, type: 'fog'
            });
        }
    }

    let inWs = currentScene === 'workshop';
    if (inWs) {
        targetParts = 40; type = 'ember';
        if (FX.parts.length < targetParts) {
            FX.parts.push({
                x: Math.random() * FX.w, y: FX.h + 10,
                s: 0.5 + Math.random(), life: Math.random(), type: 'ember'
            });
        }
    }

    // --- RENDER BATCHED RAIN ---
    if (type === 'rain') {
        ctx.strokeStyle = `rgba(180, 200, 220, 0.15)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let p of FX.parts) {
            if (p.type === 'rain') {
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + windShift * 2, p.y - p.s * 0.8);
            }
        }
        ctx.stroke();
    }

    // --- RENDER OTHER PARTICLES & UPDATE ---
    for (let i = FX.parts.length - 1; i >= 0; i--) {
        let p = FX.parts[i];

        // Clean up wrong types
        if (p.type !== type && (!inWs || p.type !== 'ember')) {
            p.y += 10;
            if (p.y > FX.h + 200) FX.parts.splice(i, 1);
            continue;
        }

        if (p.type === 'rain') {
            p.x -= windShift * 5; p.y += p.s;
            if (p.y > FX.h) { p.y = -20; p.x = Math.random() * FX.w + windShift * FX.h; }
        }
        else if (p.type === 'fog') {
            p.a += 0.005; p.x += Math.cos(p.a) * p.s; p.y += Math.sin(p.a) * p.s * 0.5;
            ctx.drawImage(FX.fogBuf, p.x - p.rad, p.y - p.rad, p.rad * 2, p.rad * 2);
            if (p.x < -p.rad || p.x > FX.w + p.rad) p.x = Math.random() * FX.w;
            if (p.y < -p.rad || p.y > FX.h + p.rad) p.y = Math.random() * FX.h;
        }
        else if (p.type === 'ember') {
            p.y -= p.s; p.x += Math.sin(p.y * 0.02); p.life += 0.02;
            let op = Math.max(0, Math.sin(p.life) * 0.5);
            ctx.fillStyle = `rgba(220,120,40,${op})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
            if (p.y < 0) { p.y = FX.h + 10; p.x = Math.random() * FX.w; }
        }
    }

    requestAnimationFrame(loopFX);
}
