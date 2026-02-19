const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const goldEl = document.getElementById('gold');
const livesEl = document.getElementById('lives');
const waveEl = document.getElementById('wave');
const messageEl = document.getElementById('message');
const startWaveBtn = document.getElementById('startWaveBtn');
const restartBtn = document.getElementById('restartBtn');
const towerButtons = [...document.querySelectorAll('.tower-btn')];

const TILE_SIZE = 30;
const GRID_WIDTH = 20;
const GRID_HEIGHT = 20;
const BOARD_PX = GRID_WIDTH * TILE_SIZE;
const STARTING_GOLD = 200;
const STARTING_LIVES = 20;
const GOLD_PER_KILL = 15;
const MAX_WAVES = 10;

const towerStats = {
  basic: { name: 'Basic', cost: 100, damage: 15, fireRate: 1.0, rangeTiles: 3, color: '#8b4513', projectileColor: '#f59e0b' },
  rapid: { name: 'Rapid', cost: 150, damage: 8, fireRate: 3.0, rangeTiles: 2, color: '#2563eb', projectileColor: '#facc15' },
  heavy: { name: 'Heavy', cost: 250, damage: 50, fireRate: 0.5, rangeTiles: 4, color: '#7e22ce', projectileColor: '#ef4444' },
};

const path = createPath();
const pathSet = new Set(path.map(([x, y]) => `${x},${y}`));

let state;
let previousTime = performance.now();
let hoverGrid = null;

function createPath() {
  const result = [];
  for (let y = 0; y < 5; y++) result.push([1, y]);
  for (let x = 1; x < 10; x++) result.push([x, 5]);
  for (let y = 5; y < 12; y++) result.push([10, y]);
  for (let x = 10; x > 3; x--) result.push([x, 12]);
  for (let y = 12; y < 18; y++) result.push([3, y]);
  for (let x = 3; x < 20; x++) result.push([x, 18]);
  return result;
}

function resetGame() {
  state = {
    phase: 'between',
    gold: STARTING_GOLD,
    lives: STARTING_LIVES,
    wave: 0,
    selectedTower: null,
    towers: [],
    enemies: [],
    projectiles: [],
  };

  updateUI();
  setMessage('Select a tower, place it on the grid, then start the wave.');
  selectTower(null);
}

function setMessage(text) {
  messageEl.textContent = text;
}

function updateUI() {
  goldEl.textContent = String(state.gold);
  livesEl.textContent = String(state.lives);
  waveEl.textContent = `${state.wave}/${MAX_WAVES}`;
}

function selectTower(type) {
  state.selectedTower = type;
  towerButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
}

function canPlaceTower(gridX, gridY) {
  if (gridX < 0 || gridX >= GRID_WIDTH || gridY < 0 || gridY >= GRID_HEIGHT) return false;
  if (pathSet.has(`${gridX},${gridY}`)) return false;
  return !state.towers.some((tower) => tower.gridX === gridX && tower.gridY === gridY);
}

function spawnWave() {
  if (state.phase !== 'between') return;
  if (state.wave >= MAX_WAVES) return;

  state.wave += 1;
  const count = 5 + state.wave;
  for (let i = 0; i < count; i++) {
    state.enemies.push(createEnemy(state.wave, i * 0.8));
  }

  state.phase = 'playing';
  setMessage(`Wave ${state.wave} started.`);
  updateUI();
}

function createEnemy(wave, spawnDelaySeconds) {
  return {
    x: path[0][0] * TILE_SIZE + TILE_SIZE / 2,
    y: path[0][1] * TILE_SIZE + TILE_SIZE / 2,
    pathIndex: 0,
    speed: 1.5 + wave * 0.1,
    maxHealth: 50 + wave * 10,
    health: 50 + wave * 10,
    alive: true,
    reachedEnd: false,
    spawnDelay: spawnDelaySeconds,
  };
}

function placeTower(gridX, gridY) {
  if (state.phase !== 'between' && state.phase !== 'playing') return;
  if (!state.selectedTower) {
    setMessage('Select a tower first.');
    return;
  }

  const stats = towerStats[state.selectedTower];
  if (state.gold < stats.cost) {
    setMessage('Not enough gold for that tower.');
    return;
  }

  if (!canPlaceTower(gridX, gridY)) {
    setMessage('You cannot place a tower there.');
    return;
  }

  state.gold -= stats.cost;
  state.towers.push({
    gridX,
    gridY,
    type: state.selectedTower,
    cooldown: 0,
  });

  updateUI();
  setMessage(`${stats.name} tower placed.`);
}

function getTowerCenter(tower) {
  return {
    x: tower.gridX * TILE_SIZE + TILE_SIZE / 2,
    y: tower.gridY * TILE_SIZE + TILE_SIZE / 2,
  };
}

function findTargetForTower(tower) {
  const stats = towerStats[tower.type];
  const center = getTowerCenter(tower);
  const maxDist = stats.rangeTiles * TILE_SIZE;

  let closest = null;
  let bestDistance = Infinity;
  for (const enemy of state.enemies) {
    if (!enemy.alive || enemy.reachedEnd || enemy.spawnDelay > 0) continue;
    const dx = enemy.x - center.x;
    const dy = enemy.y - center.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= maxDist && dist < bestDistance) {
      bestDistance = dist;
      closest = enemy;
    }
  }
  return closest;
}

function updateEnemies(dt) {
  for (const enemy of state.enemies) {
    if (!enemy.alive || enemy.reachedEnd) continue;

    if (enemy.spawnDelay > 0) {
      enemy.spawnDelay -= dt;
      continue;
    }

    if (enemy.pathIndex >= path.length) {
      enemy.reachedEnd = true;
      state.lives -= 1;
      if (state.lives <= 0) {
        state.phase = 'gameover';
        setMessage('Game Over. Press Restart to try again.');
      }
      continue;
    }

    const [gridX, gridY] = path[enemy.pathIndex];
    const tx = gridX * TILE_SIZE + TILE_SIZE / 2;
    const ty = gridY * TILE_SIZE + TILE_SIZE / 2;

    const dx = tx - enemy.x;
    const dy = ty - enemy.y;
    const dist = Math.hypot(dx, dy);
    const step = enemy.speed * dt * 60;

    if (dist <= step) {
      enemy.pathIndex += 1;
    } else if (dist > 0) {
      enemy.x += (dx / dist) * step;
      enemy.y += (dy / dist) * step;
    }
  }
}

function updateTowers(dt) {
  for (const tower of state.towers) {
    const stats = towerStats[tower.type];
    tower.cooldown -= dt;

    if (tower.cooldown > 0) continue;

    const target = findTargetForTower(tower);
    if (!target) continue;

    const center = getTowerCenter(tower);
    const dx = target.x - center.x;
    const dy = target.y - center.y;
    const dist = Math.hypot(dx, dy) || 1;
    const speedPerFrame = 5;

    state.projectiles.push({
      x: center.x,
      y: center.y,
      vx: (dx / dist) * speedPerFrame,
      vy: (dy / dist) * speedPerFrame,
      damage: stats.damage,
      color: stats.projectileColor,
      active: true,
    });

    tower.cooldown = 1 / stats.fireRate;
  }
}

function updateProjectiles(dt) {
  for (const projectile of state.projectiles) {
    if (!projectile.active) continue;

    projectile.x += projectile.vx * dt * 60;
    projectile.y += projectile.vy * dt * 60;

    if (projectile.x < 0 || projectile.x > BOARD_PX || projectile.y < 0 || projectile.y > BOARD_PX) {
      projectile.active = false;
      continue;
    }

    for (const enemy of state.enemies) {
      if (!enemy.alive || enemy.reachedEnd || enemy.spawnDelay > 0) continue;
      const dist = Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y);
      if (dist < 15) {
        enemy.health -= projectile.damage;
        projectile.active = false;
        if (enemy.health <= 0) {
          enemy.alive = false;
          state.gold += GOLD_PER_KILL;
        }
        break;
      }
    }
  }

  state.projectiles = state.projectiles.filter((p) => p.active);
}

function checkWaveCompletion() {
  if (state.phase !== 'playing') return;

  const allDone = state.enemies.length > 0 && state.enemies.every((enemy) => !enemy.alive || enemy.reachedEnd);
  if (!allDone) return;

  state.enemies = [];
  state.projectiles = [];

  if (state.wave >= MAX_WAVES) {
    state.phase = 'victory';
    setMessage('Victory! You defended all waves. Press Restart to play again.');
  } else {
    state.phase = 'between';
    setMessage(`Wave ${state.wave} complete. Place towers, then start the next wave.`);
  }
}

function update(dt) {
  if (state.phase !== 'playing') {
    updateUI();
    return;
  }

  updateEnemies(dt);
  updateTowers(dt);
  updateProjectiles(dt);
  checkWaveCompletion();
  updateUI();
}

function drawGrid() {
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, BOARD_PX, BOARD_PX);

  for (let x = 0; x < GRID_WIDTH; x++) {
    for (let y = 0; y < GRID_HEIGHT; y++) {
      ctx.strokeStyle = '#d1d5db';
      ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }

  ctx.fillStyle = '#4b5563';
  for (const [x, y] of path) {
    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
}

function drawTowers() {
  for (const tower of state.towers) {
    const stats = towerStats[tower.type];
    const x = tower.gridX * TILE_SIZE;
    const y = tower.gridY * TILE_SIZE;

    ctx.fillStyle = stats.color;
    ctx.fillRect(x + 5, y + 5, TILE_SIZE - 10, TILE_SIZE - 10);
    ctx.strokeStyle = '#111827';
    ctx.strokeRect(x + 5, y + 5, TILE_SIZE - 10, TILE_SIZE - 10);
  }
}

function drawEnemies() {
  for (const enemy of state.enemies) {
    if (!enemy.alive || enemy.reachedEnd || enemy.spawnDelay > 0) continue;

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#111827';
    ctx.stroke();

    const barW = 24;
    const barH = 4;
    const bx = enemy.x - barW / 2;
    const by = enemy.y - 18;

    ctx.fillStyle = '#111827';
    ctx.fillRect(bx, by, barW, barH);

    const hpW = Math.max(0, (enemy.health / enemy.maxHealth) * barW);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(bx, by, hpW, barH);
  }
}

function drawProjectiles() {
  for (const projectile of state.projectiles) {
    ctx.fillStyle = projectile.color;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHoverPreview() {
  if (!hoverGrid || !state.selectedTower) return;

  const { x, y } = hoverGrid;
  if (x < 0 || y < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT) return;

  const stats = towerStats[state.selectedTower];
  const valid = canPlaceTower(x, y) && state.gold >= stats.cost;

  ctx.fillStyle = valid ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)';
  ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
}

function drawOverlayText() {
  if (state.phase !== 'gameover' && state.phase !== 'victory') return;

  ctx.fillStyle = 'rgba(17, 24, 39, 0.7)';
  ctx.fillRect(0, 0, BOARD_PX, BOARD_PX);

  ctx.fillStyle = '#f9fafb';
  ctx.font = 'bold 42px Arial';
  ctx.textAlign = 'center';

  const text = state.phase === 'victory' ? 'VICTORY!' : 'GAME OVER';
  ctx.fillText(text, BOARD_PX / 2, BOARD_PX / 2);

  ctx.font = '20px Arial';
  ctx.fillText('Press Restart to play again', BOARD_PX / 2, BOARD_PX / 2 + 36);
}

function draw() {
  drawGrid();
  drawHoverPreview();
  drawTowers();
  drawEnemies();
  drawProjectiles();
  drawOverlayText();
}

function loop(now) {
  const dt = Math.min(0.05, (now - previousTime) / 1000);
  previousTime = now;

  update(dt);
  draw();
  requestAnimationFrame(loop);
}

canvas.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((event.clientX - rect.left) / TILE_SIZE);
  const y = Math.floor((event.clientY - rect.top) / TILE_SIZE);
  hoverGrid = { x, y };
});

canvas.addEventListener('mouseleave', () => {
  hoverGrid = null;
});

canvas.addEventListener('click', (event) => {
  if (state.phase === 'gameover' || state.phase === 'victory') return;

  const rect = canvas.getBoundingClientRect();
  const gridX = Math.floor((event.clientX - rect.left) / TILE_SIZE);
  const gridY = Math.floor((event.clientY - rect.top) / TILE_SIZE);
  placeTower(gridX, gridY);
});

towerButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const selected = btn.dataset.type;
    const stats = towerStats[selected];
    selectTower(selected);
    setMessage(`Selected ${stats.name} tower (${stats.cost} gold).`);
  });
});

startWaveBtn.addEventListener('click', spawnWave);

restartBtn.addEventListener('click', () => {
  resetGame();
});

window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'r') {
    resetGame();
  }
});

resetGame();
requestAnimationFrame(loop);
