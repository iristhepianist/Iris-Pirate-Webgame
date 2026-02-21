// js/chart.js
'use strict';

const Chart = {
    cv: null,
    ctx: null,
    zoom: 1,
    offset: { x: 0, y: 0 }
};

function initChart() {
    Chart.cv = document.getElementById('chart-cv');
    if (!Chart.cv) return;
    Chart.ctx = Chart.cv.getContext('2d');

    const resize = () => {
        const parent = Chart.cv.parentElement;
        Chart.cv.width = parent.clientWidth;
        Chart.cv.height = parent.clientHeight;
        renderChart();
    };
    window.addEventListener('resize', resize);
    resize();
}

function renderChart() {
    if (!Chart.ctx) return;
    const ctx = Chart.ctx;
    const w = Chart.cv.width;
    const h = Chart.cv.height;

    ctx.clearRect(0, 0, w, h);

    // Draw Parchment Background
    ctx.fillStyle = '#0a0b0d'; // Abyss
    ctx.fillRect(0, 0, w, h);

    // Center of map is (0,0) offset by G.x, G.y
    const centerX = w / 2 - G.x * Chart.zoom;
    const centerY = h / 2 - G.y * Chart.zoom;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(Chart.zoom, Chart.zoom);

    // Draw Breadcrumb Trail
    if (G.trail.length > 1) {
        ctx.strokeStyle = 'rgba(122, 107, 82, 0.3)';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(G.trail[0].x, G.trail[0].y);
        for (let i = 1; i < G.trail.length; i++) {
            ctx.lineTo(G.trail[i].x, G.trail[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Draw Discovered Islands
    for (let key in G.discovered) {
        let isl = G.discovered[key];
        ctx.fillStyle = isl.pale ? '#4a4d52' : '#6a5a42';
        ctx.beginPath();
        ctx.arc(isl.x, isl.y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '10px Georgia';
        ctx.fillText(isl.name, isl.x + 8, isl.y + 4);
    }

    // Draw Player Vessel
    ctx.fillStyle = '#b09c76';
    ctx.beginPath();
    ctx.arc(G.x, G.y, 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw Pointer for heading
    const rad = (G.heading - 90) * (Math.PI / 180);
    ctx.strokeStyle = '#b09c76';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(G.x, G.y);
    ctx.lineTo(G.x + Math.cos(rad) * 10, G.y + Math.sin(rad) * 10);
    ctx.stroke();

    ctx.restore();

    // Sanity effects: Blood stains?
    if (G.san < 30) {
        ctx.fillStyle = 'rgba(74, 29, 23, 0.1)';
        ctx.beginPath();
        ctx.arc(w * 0.2, h * 0.8, 60, 0, Math.PI * 2);
        ctx.fill();
    }
}
