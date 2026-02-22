'use strict';

const Chart = { cv: null, ctx: null, fogCv: null, fogCtx: null, zoom: 1, offset: { x: 0, y: 0 }, dpr: 1, vw: 0, vh: 0 };

function alignToDevice(val) {
  const scale = Math.max(1, Chart.dpr || 1);
  return Math.round(val * scale) / scale;
}

function worldToScreen(dist) {
  return dist * Chart.zoom;
}

function initChart() {
  Chart.cv = document.getElementById('chart-cv');
  if (!Chart.cv) return;
  Chart.ctx = Chart.cv.getContext('2d');
  Chart.fogCv = document.createElement('canvas');
  Chart.fogCtx = Chart.fogCv.getContext('2d');
  Chart.resize = () => {
    const p = Chart.cv.parentElement;
    Chart.vw = Math.max(1, p.clientWidth);
    Chart.vh = Math.max(1, p.clientHeight);
    Chart.dpr = Math.max(1, window.devicePixelRatio || 1);

    // Scale canvas resolution for High DPI
    Chart.cv.width = Math.ceil(Chart.vw * Chart.dpr);
    Chart.cv.height = Math.ceil(Chart.vh * Chart.dpr);
    Chart.fogCv.width = Chart.cv.width;
    Chart.fogCv.height = Chart.cv.height;

    // Size canvas in CSS units
    Chart.cv.style.width = Chart.vw + 'px';
    Chart.cv.style.height = Chart.vh + 'px';

    // Reset transforms to use CSS units for drawing logic
    Chart.ctx.setTransform(Chart.dpr, 0, 0, Chart.dpr, 0, 0);
    Chart.fogCtx.setTransform(Chart.dpr, 0, 0, Chart.dpr, 0, 0);

    Chart.ctx.imageSmoothingEnabled = true;
    Chart.fogCtx.imageSmoothingEnabled = true;
    setupChartInteraction();
    renderChart();
  };
  window.addEventListener('resize', Chart.resize);
  Chart.resize();
}

function toScreen(wx, wy, cx, cy) { return { x: cx + wx * Chart.zoom, y: cy + wy * Chart.zoom }; }

function estimatedShipPos() {
  const seed = G.worldSeed || G.seed || 1;
  const drift = Math.max(0, G.navError || 0);
  const tick = Math.floor((((G.day || 1) * 24) + (G.hour || 0)) / 4);
  const ox = (hash01(tick, 11, seed, 401) - 0.5) * drift * 2;
  const oy = (hash01(tick, 17, seed, 402) - 0.5) * drift * 2;
  return { x: (G.x || 0) + ox, y: (G.y || 0) + oy, drift };
}

function markerList() {
  console.log('markerList called, G.chartMarks:', G.chartMarks);
  const out = [], seen = {};
  for (const k in (G.chartMarks || {})) {
    const m = G.chartMarks[k];
    console.log('Processing marker:', k, m);
    if (!m) continue;
    const id = m.id || k;
    seen[id] = 1;
    out.push({
      id,
      name: m.name || 'Uncharted Land',
      pale: !!m.pale,
      scavenged: !!m.scavenged,
      hinted: !m.confirmed,
      x: typeof m.estX === 'number' ? m.estX : m.x,
      y: typeof m.estY === 'number' ? m.estY : m.y,
      error: m.error || 4,
      confirmed: !!m.confirmed,
      isWaypoint: !!m.isWaypoint,
      color: m.color,
      icon: m.icon
    });
  }
  console.log('Final marker list:', out);
  for (const k in (G.discovered || {})) {
    const d = G.discovered[k];
    if (!d) continue;
    const id = d.id || k;
    if (seen[id]) continue;
    out.push({ id, name: d.name || 'Landfall?', pale: !!d.pale, scavenged: !!d.scavenged, hinted: true, x: d.x, y: d.y, error: 8, confirmed: false });
  }
  if (G.tutorialIsland && G.tutorialPhase && G.tutorialPhase !== 'start' && !seen[G.tutorialIsland.id]) {
    out.push({ id: G.tutorialIsland.id, x: G.tutorialIsland.x, y: G.tutorialIsland.y, name: G.tutorialIsland.name, pale: false, scavenged: false, hinted: true });
  }
  return out;
}

function drawIslandIcon(ctx, m, x, y) {
  const tut = m.id === 'tutorial:tern-rock';
  const isWaypoint = !!m.isWaypoint;
  const pale = !!m.pale;
  const r = tut ? 8 : (isWaypoint ? 7 : 6);
  const px = x;
  const py = y;

  const errRadius = (Math.max(0, m.error || 0)) * Chart.zoom;
  if (errRadius > 2 && m.hinted) {
    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(131,116,91,.3)';
    ctx.beginPath(); ctx.arc(px, py, errRadius, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // Custom waypoint styling
  if (isWaypoint) {
    const color = m.color || '#d5c19d';
    const icon = m.icon || '●';
    
    // Glow effect
    const glow = ctx.createRadialGradient(px, py, 0, px, py, r * 2.5);
    glow.addColorStop(0, color + '40');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(px, py, r * 2.5, 0, Math.PI * 2); ctx.fill();

    // Draw custom icon
    ctx.save();
    ctx.translate(px, py);
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, 0, 0);
    ctx.restore();
    return;
  }

  const glow = ctx.createRadialGradient(px, py, 0, px, py, r * 2.5);
  glow.addColorStop(0, tut ? 'rgba(210,190,150,.3)' : pale ? 'rgba(140,155,180,.25)' : 'rgba(170,140,98,.22)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(px, py, r * 2.5, 0, Math.PI * 2); ctx.fill();

  ctx.save();
  ctx.translate(px, py);
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = tut ? '#f0dca8' : pale ? '#c8d5e6' : '#d5c19d';
  ctx.fillStyle = m.hinted ? 'rgba(15,18,22,.7)' : (tut ? '#dcbfa0' : pale ? '#9daabc' : '#a68b6d');

  if (tut) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = Math.PI * 2 * i / 10 - Math.PI / 2;
      const rr = i % 2 ? r * .4 : r;
      const x2 = Math.cos(a) * rr, y2 = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (pale) {
    ctx.rotate(Math.PI / 4);
    ctx.beginPath(); ctx.rect(-r * .8, -r * .8, r * 1.6, r * 1.6); ctx.fill(); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (m.port) {
      ctx.beginPath(); ctx.arc(0, 0, r * .4, 0, Math.PI * 2); ctx.stroke();
    }
  }

  if (m.scavenged) {
    ctx.strokeStyle = '#4a1d17';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-r, r); ctx.lineTo(r, -r); ctx.stroke();
  }
  ctx.restore();
}

function drawMarkerLabel(ctx, m, x, y) {
  const rx = Math.round((m.x || 0) / 10) * 10;
  const ry = Math.round((m.y || 0) / 10) * 10;
  const base = m.hinted ? 'Landfall?' : m.name;
  const err = Math.max(0, Math.round(m.error || 6));
  const suffix = m.hinted ? ' (approx)' : ` (+/-${err} nm)`;
  const text = `${base} (${rx}, ${ry})${suffix}`;
  ctx.font = '11px Georgia';
  const w = ctx.measureText(text).width;
  const tx = alignToDevice(x + 10);
  const ty = alignToDevice(y - 7);
  ctx.fillStyle = 'rgba(2,3,5,.82)';
  ctx.fillRect(tx - 3, ty - 9, w + 6, 15);
  ctx.strokeStyle = m.hinted ? 'rgba(106,93,75,.55)' : 'rgba(176,156,118,.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(tx - 3, ty - 9, w + 6, 15);
  ctx.fillStyle = m.hinted ? 'rgba(136,120,95,.85)' : 'rgba(196,177,138,.95)';
  ctx.fillText(text, tx, ty + 2);
}

function drawMarkersOverlay(ctx, cx, cy, w, h) {
  const marks = markerList();
  marks.sort((a, b) => a.y - b.y);
  for (const m of marks) {
    const p = toScreen(m.x, m.y, cx, cy);
    if (p.x < -40 || p.y < -40 || p.x > w + 40 || p.y > h + 40) continue;
    drawIslandIcon(ctx, m, p.x, p.y);
    drawMarkerLabel(ctx, m, p.x, p.y);
  }
}

function drawFogOfWar(cx, cy) {
  const f = Chart.fogCtx, w = Chart.vw, h = Chart.vh;
  f.clearRect(0, 0, w, h);
  f.fillStyle = 'rgba(0, 0, 0, .92)';
  f.fillRect(0, 0, w, h);

  const fog = G.fogCleared || {};
  const ship = estimatedShipPos();
  const wc = WORLD.fogCellSize;
  const pc = wc * Chart.zoom;
  const hw = w / (2 * Chart.zoom), hh = h / (2 * Chart.zoom);
  const minX = Math.floor((ship.x - hw) / wc) - 1, maxX = Math.floor((ship.x + hw) / wc) + 1;
  const minY = Math.floor((ship.y - hh) / wc) - 1, maxY = Math.floor((ship.y + hh) / wc) + 1;

  f.globalCompositeOperation = 'destination-out';
  for (let gx = minX; gx <= maxX; gx++) {
    for (let gy = minY; gy <= maxY; gy++) {
      if (!fog[chunkKey(gx, gy)]) continue;
      const sx = cx + gx * wc * Chart.zoom, sy = cy + gy * wc * Chart.zoom;
      // Overlap by 0.5px to hide subpixel gaps
      f.fillRect(sx - 0.5, sy - 0.5, pc + 1, pc + 1);
    }
  }

  const sx = cx + ship.x * Chart.zoom, sy = cy + ship.y * Chart.zoom, rad = WORLD.fogRevealRadius * Chart.zoom;
  const soft = f.createRadialGradient(sx, sy, rad * .1, sx, sy, rad);
  soft.addColorStop(0, 'rgba(0,0,0,1)'); soft.addColorStop(1, 'rgba(0,0,0,0)');
  f.fillStyle = soft; f.beginPath(); f.arc(sx, sy, rad, 0, Math.PI * 2); f.fill();
  f.globalCompositeOperation = 'source-over';
}

function renderChart() {
  if (!Chart.ctx || typeof G.x !== 'number') return;
  const ctx = Chart.ctx, w = Chart.vw, h = Chart.vh;
  if (!w || !h) return;
  const ship = estimatedShipPos();

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#0a0b0d';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2 - ship.x * Chart.zoom, cy = h / 2 - ship.y * Chart.zoom;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(Chart.zoom, Chart.zoom);

  if (G.trail && G.trail.length > 1) {
    ctx.strokeStyle = 'rgba(122,107,82,.2)';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(G.trail[0].x, G.trail[0].y);
    for (let i = 1; i < G.trail.length; i++)ctx.lineTo(G.trail[i].x, G.trail[i].y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const snap = 20;
  const left = ship.x - (w / (2 * Chart.zoom));
  const right = ship.x + (w / (2 * Chart.zoom));
  const top = ship.y - (h / (2 * Chart.zoom));
  const bottom = ship.y + (h / (2 * Chart.zoom));
  ctx.strokeStyle = 'rgba(78,69,53,.14)';
  ctx.lineWidth = 1;
  for (let gx = Math.floor(left / snap) * snap; gx <= right; gx += snap) {
    ctx.beginPath(); ctx.moveTo(gx, top); ctx.lineTo(gx, bottom); ctx.stroke();
  }
  for (let gy = Math.floor(top / snap) * snap; gy <= bottom; gy += snap) {
    ctx.beginPath(); ctx.moveTo(left, gy); ctx.lineTo(right, gy); ctx.stroke();
  }

  ctx.fillStyle = '#b09c76';
  ctx.beginPath(); ctx.arc(ship.x, ship.y, 4, 0, Math.PI * 2); ctx.fill();

  const v = DIR_V[G.heading] || [0, -1];
  ctx.strokeStyle = '#b09c76'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(ship.x, ship.y); ctx.lineTo(ship.x + v[0] * 12, ship.y + v[1] * 12); ctx.stroke();

  ctx.restore();

  drawFogOfWar(cx, cy);
  ctx.drawImage(Chart.fogCv, 0, 0, Chart.cv.width, Chart.cv.height, 0, 0, w, h);
  drawMarkersOverlay(ctx, cx, cy, w, h);

  ctx.fillStyle = 'rgba(176,156,118,.8)';
  ctx.font = '12px Georgia';
  ctx.fillText(`Est. Position: ${Math.round(ship.x)}, ${Math.round(ship.y)} (+/- ${Math.round(ship.drift)} nm)`, 16, h - 18);

  if (G.san < 30) {
    ctx.fillStyle = 'rgba(74,29,23,.15)';
    ctx.beginPath(); ctx.arc(w * .2, h * .8, 80, 0, Math.PI * 2); ctx.fill();
  }
}

function screenToWorld(screenX, screenY) {
  const ship = estimatedShipPos();
  const cx = Chart.vw / 2 - ship.x * Chart.zoom;
  const cy = Chart.vh / 2 - ship.y * Chart.zoom;
  return {
    x: (screenX - cx) / Chart.zoom,
    y: (screenY - cy) / Chart.zoom
  };
}

function findWaypointAt(screenX, screenY) {
  const worldPos = screenToWorld(screenX, screenY);
  const marks = markerList();
  const ship = estimatedShipPos();
  const cx = Chart.vw / 2 - ship.x * Chart.zoom;
  const cy = Chart.vh / 2 - ship.y * Chart.zoom;
  for (const mark of marks) {
    const markScreen = toScreen(mark.x, mark.y, cx, cy);
    const distance = Math.sqrt(Math.pow(screenX - markScreen.x, 2) + Math.pow(screenY - markScreen.y, 2));
    if (distance < 15) { // 15px click radius
      return mark;
    }
  }
  return null;
}

function addWaypointAt(worldX, worldY) {
  // Check if waypoint GUI already exists
  const existingGui = document.getElementById('waypoint-gui');
  if (existingGui) {
    existingGui.remove();
  }
  
  // Create waypoint customization GUI
  const gui = document.createElement('div');
  gui.id = 'waypoint-gui';
  gui.innerHTML = `
    <div class="waypoint-gui-content">
      <h3>Customize Waypoint</h3>
      <div class="waypoint-preview">
        <div id="preview-icon" class="preview-icon">●</div>
        <span id="preview-name">Waypoint</span>
      </div>
      
      <div class="customization-section">
        <label for="waypoint-name-input">Name:</label>
        <input type="text" id="waypoint-name-input" value="Waypoint" maxlength="20" autocomplete="off">
      </div>
      
      <div class="customization-section">
        <label>Color:</label>
        <div class="color-options">
          <div class="color-option selected" data-color="#d5c19d" style="background-color: #d5c19d"></div>
          <div class="color-option" data-color="#4a1d17" style="background-color: #4a1d17"></div>
          <div class="color-option" data-color="#263824" style="background-color: #263824"></div>
          <div class="color-option" data-color="#5a4a34" style="background-color: #5a4a34"></div>
          <div class="color-option" data-color="#8a7b62" style="background-color: #8a7b62"></div>
          <div class="color-option" data-color="#b09c76" style="background-color: #b09c76"></div>
        </div>
      </div>
      
      <div class="customization-section">
        <label>Icon:</label>
        <div class="icon-options">
          <div class="icon-option selected" data-icon="●">●</div>
          <div class="icon-option" data-icon="▲">▲</div>
          <div class="icon-option" data-icon="■">■</div>
          <div class="icon-option" data-icon="★">★</div>
          <div class="icon-option" data-icon="✦">✦</div>
          <div class="icon-option" data-icon="♦">♦</div>
          <div class="icon-option" data-icon="◉">◉</div>
          <div class="icon-option" data-icon="⚑">⚑</div>
        </div>
      </div>
      
      <div class="waypoint-gui-buttons">
        <button id="cancel-waypoint">Cancel</button>
        <button id="create-waypoint">Create Waypoint</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(gui);
  
  let selectedColor = '#d5c19d';
  let selectedIcon = '●';
  let waypointName = 'Waypoint';
  
  // Setup event listeners
  const nameInput = gui.querySelector('#waypoint-name-input');
  const colorOptions = gui.querySelectorAll('.color-option');
  const iconOptions = gui.querySelectorAll('.icon-option');
  const previewIcon = gui.querySelector('#preview-icon');
  const previewName = gui.querySelector('#preview-name');
  const cancelBtn = gui.querySelector('#cancel-waypoint');
  const createBtn = gui.querySelector('#create-waypoint');
  
  console.log('GUI elements found:', {
    nameInput: !!nameInput,
    colorOptions: colorOptions.length,
    iconOptions: iconOptions.length,
    previewIcon: !!previewIcon,
    previewName: !!previewName,
    cancelBtn: !!cancelBtn,
    createBtn: !!createBtn
  });
  
  // Update preview when name changes
  nameInput.addEventListener('input', (e) => {
    waypointName = e.target.value.trim() || 'Waypoint';
    previewName.textContent = waypointName;
  });
  
  // Focus on name input
  nameInput.focus();
  nameInput.select();
  
  colorOptions.forEach(option => {
    option.addEventListener('click', () => {
      colorOptions.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      selectedColor = option.dataset.color;
      previewIcon.style.color = selectedColor;
    });
  });
  
  iconOptions.forEach(option => {
    option.addEventListener('click', () => {
      iconOptions.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      selectedIcon = option.dataset.icon;
      previewIcon.textContent = selectedIcon;
    });
  });
  
  cancelBtn.addEventListener('click', () => {
    console.log('Cancel button clicked - GUI element exists:', !!document.getElementById('waypoint-gui'));
    try {
      gui.style.display = 'none';
      console.log('GUI hidden via display none');
    } catch (e) {
      console.error('Error hiding GUI:', e);
    }
  });
  
  createBtn.addEventListener('click', () => {
    console.log('Create button clicked - GUI element exists:', !!document.getElementById('waypoint-gui'));
    try {
      waypointName = nameInput.value.trim() || 'Waypoint';
      if (!G.chartMarks) G.chartMarks = {};
      const id = `waypoint:${G.day}:${G.hour}:${Object.keys(G.chartMarks).length}`;
      G.chartMarks[id] = {
        id,
        name: waypointName,
        pale: false,
        x: worldX,
        y: worldY,
        error: 0, // Exact position for manual waypoints
        confirmed: true,
        isWaypoint: true,
        color: selectedColor,
        icon: selectedIcon
      };
      console.log('Created waypoint:', G.chartMarks[id]);
      gui.style.display = 'none';
      console.log('GUI hidden after waypoint creation');
      renderChart();
    } catch (e) {
      console.error('Error creating waypoint or hiding GUI:', e);
    }
  });
  
  // Close on escape key
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      try {
        gui.style.display = 'none';
        console.log('GUI hidden via Escape key');
      } catch (e) {
        console.error('Error hiding GUI via Escape:', e);
      }
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);
  
  // Handle Enter key to create waypoint
  const enterHandler = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      createBtn.click();
    }
  };
  nameInput.addEventListener('keydown', enterHandler);
}

function deleteWaypoint(waypoint) {
  if (!G.chartMarks || !waypoint.id) return;
  delete G.chartMarks[waypoint.id];
  renderChart();
}

// Chart mouse event handlers
function setupChartInteraction() {
  const canvas = Chart.cv;
  if (!canvas) return;

  console.log('Setting up chart interaction on canvas:', canvas);

  canvas.addEventListener('contextmenu', (e) => {
    console.log('Right-click detected on chart');
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const screenX = (e.clientX - rect.left) * (Chart.vw / rect.width);
    const screenY = (e.clientY - rect.top) * (Chart.vh / rect.height);
    const worldPos = screenToWorld(screenX, screenY);
    console.log('Adding waypoint at world position:', worldPos);
    addWaypointAt(worldPos.x, worldPos.y);
  });

  canvas.addEventListener('click', (e) => {
    console.log('Left-click detected on chart');
    const rect = canvas.getBoundingClientRect();
    const screenX = (e.clientX - rect.left) * (Chart.vw / rect.width);
    const screenY = (e.clientY - rect.top) * (Chart.vh / rect.height);
    const waypoint = findWaypointAt(screenX, screenY);
    if (waypoint && waypoint.isWaypoint) {
      console.log('Found waypoint to delete:', waypoint);
      if (confirm(`Delete waypoint "${waypoint.name}"?`)) {
        deleteWaypoint(waypoint);
      }
    }
  });
}

