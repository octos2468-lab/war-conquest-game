const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const goldEl = document.getElementById('gold');
const livesEl = document.getElementById('lives');
const armyXpEl = document.getElementById('armyXp');
const waveEl = document.getElementById('wave');
const slashCdEl = document.getElementById('slashCd');
const rallyCdEl = document.getElementById('rallyCd');
const escapeCdEl = document.getElementById('escapeCd');
const messageEl = document.getElementById('message');
const startWaveBtn = document.getElementById('startWaveBtn');
const restartBtn = document.getElementById('restartBtn');
const towerButtons = [...document.querySelectorAll('.tower-btn')];

const TILE_SIZE = 30;
const GRID_WIDTH = 20;
const GRID_HEIGHT = 20;
const BOARD_PX = GRID_WIDTH * TILE_SIZE;
const STARTING_GOLD = 220;
const STARTING_LIVES = 20;
const MAX_WAVES = 10;
const SELL_RATIO = 0.7;

const postStats = {
  archer: {
    name: 'Archer Post',
    cost: 110,
    damage: 14,
    fireRate: 1.8,
    rangeTiles: 4,
    color: '#8b4513',
    projectileColor: '#f59e0b',
    projectileSpeed: 6,
  },
  soldier: {
    name: 'Soldier Barracks',
    cost: 140,
    damage: 22,
    fireRate: 0.65,
    rangeTiles: 4,
    color: '#2563eb',
    projectileColor: '#06b6d4',
    projectileSpeed: 4,
  },
};

const enemyStats = {
  militia: { name: 'Militia', healthMult: 0.9, speedMult: 1.25, reward: 12, color: '#dc2626', radius: 10 },
  raider: { name: 'Raider', healthMult: 1.0, speedMult: 1.0, reward: 15, color: '#f97316', radius: 12 },
  brute: { name: 'Brute', healthMult: 1.8, speedMult: 0.72, reward: 25, color: '#7e22ce', radius: 14 },
};

const path = createPath();
const pathSet = new Set(path.map(([x, y]) => `${x},${y}`));
const heroAnchor = path[Math.floor(path.length / 2)];

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

function createHero() {
  return {
    anchorX: heroAnchor[0] * TILE_SIZE + TILE_SIZE / 2,
    anchorY: heroAnchor[1] * TILE_SIZE + TILE_SIZE / 2,
    x: heroAnchor[0] * TILE_SIZE + TILE_SIZE / 2,
    y: heroAnchor[1] * TILE_SIZE + TILE_SIZE / 2,
    moveSpeed: 3,
    attackDamage: 22,
    attackRange: 22,
    attackCooldown: 0.7,
    attackTimer: 0,
    slashDamage: 30,
    slashRange: TILE_SIZE * 2,
    slashCooldown: 3,
    slashTimer: 0,
    rallyCooldown: 10,
    rallyDuration: 4.5,
    rallyMultiplier: 1.35,
    rallyTimer: 0,
    rallyActiveUntil: 0,
    escapeCooldown: 14,
    escapeTimer: 0,
    escapeCharges: 0,
    attackAnimTime: 0,
    attackDx: 1,
    attackDy: 0,
  };
}

function resetGame() {
  state = {
    phase: 'between',
    gold: STARTING_GOLD,
    lives: STARTING_LIVES,
    armyXp: 0,
    wave: 0,
    selectedPost: null,
    posts: [],
    soldiers: [],
    enemies: [],
    projectiles: [],
    debugInfiniteGold: false,
    hero: createHero(),
  };

  updateUI();
  setMessage('Deploy Army Posts. Right-click to sell. Press D for debug gold.');
  selectPost(null);
}

function setMessage(text) {
  messageEl.textContent = text;
}

function formatCooldown(value) {
  return value <= 0 ? 'Ready' : `${value.toFixed(1)}s`;
}

function updateUI() {
  goldEl.textContent = state.debugInfiniteGold ? 'INF' : String(state.gold);
  livesEl.textContent = String(state.lives);
  armyXpEl.textContent = String(state.armyXp);
  waveEl.textContent = `${state.wave}/${MAX_WAVES}`;

  slashCdEl.textContent = formatCooldown(state.hero.slashTimer);
  const rallyText = formatCooldown(state.hero.rallyTimer);
  rallyCdEl.textContent = state.hero.rallyActiveUntil > 0 ? `${rallyText} (Active)` : rallyText;

  const escapeText = formatCooldown(state.hero.escapeTimer);
  escapeCdEl.textContent = state.hero.escapeCharges > 0 ? `${escapeText} (Ready)` : escapeText;
}

function selectPost(type) {
  state.selectedPost = type;
  towerButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
}

function canPlacePost(gridX, gridY) {
  if (gridX < 0 || gridX >= GRID_WIDTH || gridY < 0 || gridY >= GRID_HEIGHT) return false;
  if (pathSet.has(`${gridX},${gridY}`)) return false;
  if (gridX === heroAnchor[0] && gridY === heroAnchor[1]) return false;
  return !state.posts.some((post) => post.gridX === gridX && post.gridY === gridY);
}

function getPostAt(gridX, gridY) {
  return state.posts.find((post) => post.gridX === gridX && post.gridY === gridY) || null;
}

function pickEnemyType(wave, index) {
  if (wave <= 2) return index % 4 !== 0 ? 'militia' : 'raider';
  if (wave <= 6) return index % 6 === 0 ? 'brute' : (index % 2 === 0 ? 'raider' : 'militia');
  return index % 4 === 0 ? 'brute' : 'raider';
}

function spawnWave() {
  if (state.phase !== 'between') return;
  if (state.wave >= MAX_WAVES) return;

  state.wave += 1;
  const count = 5 + state.wave;

  for (let i = 0; i < count; i++) {
    const type = pickEnemyType(state.wave, i);
    state.enemies.push(createEnemy(state.wave, type, i * 0.45));
  }

  state.phase = 'playing';
  setMessage(`Wave ${state.wave} started.`);
  updateUI();
}

function createEnemy(wave, type, spawnDelaySeconds) {
  const archetype = enemyStats[type];
  const baseHealth = 45 + wave * 11;
  const baseSpeed = 1.4 + wave * 0.1;

  return {
    type,
    x: path[0][0] * TILE_SIZE + TILE_SIZE / 2,
    y: path[0][1] * TILE_SIZE + TILE_SIZE / 2,
    pathIndex: 0,
    speed: baseSpeed * archetype.speedMult,
    maxHealth: Math.round(baseHealth * archetype.healthMult),
    health: Math.round(baseHealth * archetype.healthMult),
    reward: archetype.reward,
    radius: archetype.radius,
    alive: true,
    reachedEnd: false,
    spawnDelay: spawnDelaySeconds,
  };
}

function spendGold(amount) {
  if (state.debugInfiniteGold) return true;
  if (state.gold < amount) return false;
  state.gold -= amount;
  return true;
}

function placePost(gridX, gridY) {
  if (state.phase !== 'between' && state.phase !== 'playing') return;
  if (!state.selectedPost) {
    setMessage('Select an Army Post first.');
    return;
  }

  const stats = postStats[state.selectedPost];
  if (!state.debugInfiniteGold && state.gold < stats.cost) {
    setMessage('Not enough gold for that Army Post.');
    return;
  }

  if (!canPlacePost(gridX, gridY)) {
    setMessage('You cannot deploy there.');
    return;
  }

  if (!spendGold(stats.cost)) {
    setMessage('Not enough gold.');
    return;
  }

  state.posts.push({
    gridX,
    gridY,
    type: state.selectedPost,
    cooldown: 0,
    spawnCooldown: 0,
  });

  updateUI();
  setMessage(`${stats.name} deployed.`);
}

function sellPost(gridX, gridY) {
  const post = getPostAt(gridX, gridY);
  if (!post) return;

  const idx = state.posts.indexOf(post);
  if (idx >= 0) state.posts.splice(idx, 1);

  state.soldiers = state.soldiers.filter((unit) => unit.ownerPost !== post);

  const refund = Math.floor(postStats[post.type].cost * SELL_RATIO);
  if (!state.debugInfiniteGold) state.gold += refund;
  updateUI();
  setMessage(`Sold ${postStats[post.type].name} for ${refund} gold.`);
}

function getPostCenter(post) {
  return {
    x: post.gridX * TILE_SIZE + TILE_SIZE / 2,
    y: post.gridY * TILE_SIZE + TILE_SIZE / 2,
  };
}

function findTargetForPost(post) {
  const stats = postStats[post.type];
  const center = getPostCenter(post);
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

function addKillRewards(enemy) {
  state.gold += enemy.reward;
  state.armyXp += 1;
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

      if (state.hero.escapeCharges > 0) {
        state.hero.escapeCharges -= 1;
        enemy.reachedEnd = false;
        enemy.pathIndex = Math.max(0, enemy.pathIndex - 8);
        const [rx, ry] = path[Math.min(enemy.pathIndex, path.length - 1)];
        enemy.x = rx * TILE_SIZE + TILE_SIZE / 2;
        enemy.y = ry * TILE_SIZE + TILE_SIZE / 2;
      } else {
        state.lives -= 1;
        if (state.lives <= 0) {
          state.phase = 'gameover';
          setMessage('Game Over. Press Restart to try again.');
        }
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

function heroChooseTarget() {
  let target = null;
  let bestDistance = Infinity;

  for (const enemy of state.enemies) {
    if (!enemy.alive || enemy.reachedEnd || enemy.spawnDelay > 0) continue;
    const dist = Math.hypot(enemy.x - state.hero.x, enemy.y - state.hero.y);
    if (dist < bestDistance) {
      bestDistance = dist;
      target = enemy;
    }
  }

  return { target, distance: bestDistance };
}

function heroMove(dt) {
  const hero = state.hero;
  const { target, distance } = heroChooseTarget();
  const step = hero.moveSpeed * dt * 60;

  if (target && distance > hero.attackRange * 0.85) {
    const dx = target.x - hero.x;
    const dy = target.y - hero.y;
    if (distance > 0) {
      hero.x += (dx / distance) * step;
      hero.y += (dy / distance) * step;
    }
  } else if (!target) {
    const dx = hero.anchorX - hero.x;
    const dy = hero.anchorY - hero.y;
    const homeDist = Math.hypot(dx, dy);
    if (homeDist > 2) {
      hero.x += (dx / homeDist) * step;
      hero.y += (dy / homeDist) * step;
    }
  }
}

function heroBasicAttack() {
  const hero = state.hero;
  if (hero.attackTimer > 0) return;

  const { target, distance } = heroChooseTarget();
  if (!target || distance > hero.attackRange) return;

  target.health -= hero.attackDamage;
  hero.attackTimer = hero.attackCooldown;
  hero.attackAnimTime = 0.14;

  if (distance > 0) {
    hero.attackDx = (target.x - hero.x) / distance;
    hero.attackDy = (target.y - hero.y) / distance;
  }

  if (target.health <= 0 && target.alive) {
    target.alive = false;
    addKillRewards(target);
  }
}

function heroSlash() {
  const hero = state.hero;
  if (hero.slashTimer > 0) return;

  const targets = state.enemies.filter((enemy) => {
    if (!enemy.alive || enemy.reachedEnd || enemy.spawnDelay > 0) return false;
    return Math.hypot(enemy.x - hero.x, enemy.y - hero.y) <= hero.slashRange;
  });

  if (targets.length < 2) return;

  for (const enemy of targets) {
    enemy.health -= hero.slashDamage;
    if (enemy.health <= 0 && enemy.alive) {
      enemy.alive = false;
      addKillRewards(enemy);
    }
  }

  hero.slashTimer = hero.slashCooldown;
  hero.attackAnimTime = 0.2;
}

function heroRally(now) {
  const hero = state.hero;
  if (hero.rallyTimer > 0) return;

  const anyActiveEnemies = state.enemies.some((enemy) => enemy.alive && !enemy.reachedEnd && enemy.spawnDelay <= 0);
  if (!anyActiveEnemies) return;

  hero.rallyTimer = hero.rallyCooldown;
  hero.rallyActiveUntil = now + hero.rallyDuration;
}

function heroEscape() {
  const hero = state.hero;
  if (hero.escapeTimer > 0) return;

  const imminentLeak = state.enemies.some(
    (enemy) => enemy.alive && !enemy.reachedEnd && enemy.spawnDelay <= 0 && enemy.pathIndex >= path.length - 4,
  );

  if (!imminentLeak) return;

  hero.escapeTimer = hero.escapeCooldown;
  hero.escapeCharges = 1;
}

function updateHero(dt, now) {
  const hero = state.hero;
  hero.attackTimer = Math.max(0, hero.attackTimer - dt);
  hero.slashTimer = Math.max(0, hero.slashTimer - dt);
  hero.rallyTimer = Math.max(0, hero.rallyTimer - dt);
  hero.escapeTimer = Math.max(0, hero.escapeTimer - dt);
  hero.attackAnimTime = Math.max(0, hero.attackAnimTime - dt);

  if (hero.rallyActiveUntil > 0 && now > hero.rallyActiveUntil) {
    hero.rallyActiveUntil = 0;
  }

  heroMove(dt);
  heroSlash();
  heroRally(now);
  heroEscape();
  heroBasicAttack();
}

function updateArcherPosts(dt, now) {
  const rallyActive = state.hero.rallyActiveUntil > now;
  const multiplier = rallyActive ? state.hero.rallyMultiplier : 1;

  for (const post of state.posts) {
    if (post.type !== 'archer') continue;

    const stats = postStats[post.type];
    post.cooldown -= dt;
    if (post.cooldown > 0) continue;

    const target = findTargetForPost(post);
    if (!target) continue;

    const center = getPostCenter(post);
    const dx = target.x - center.x;
    const dy = target.y - center.y;
    const dist = Math.hypot(dx, dy) || 1;

    state.projectiles.push({
      x: center.x,
      y: center.y,
      vx: (dx / dist) * stats.projectileSpeed,
      vy: (dy / dist) * stats.projectileSpeed,
      damage: Math.round(stats.damage * multiplier),
      color: stats.projectileColor,
      active: true,
    });

    post.cooldown = 1 / stats.fireRate;
  }
}

function soldierFindTarget(unit) {
  let target = null;
  let bestDistance = Infinity;

  for (const enemy of state.enemies) {
    if (!enemy.alive || enemy.reachedEnd || enemy.spawnDelay > 0) continue;
    const homeDist = Math.hypot(enemy.x - unit.homeX, enemy.y - unit.homeY);
    if (homeDist > unit.leashRange) continue;

    const dist = Math.hypot(enemy.x - unit.x, enemy.y - unit.y);
    if (dist < bestDistance) {
      bestDistance = dist;
      target = enemy;
    }
  }

  return { target, distance: bestDistance };
}

function updateSoldierBarracks(dt, now) {
  const rallyActive = state.hero.rallyActiveUntil > now;
  const multiplier = rallyActive ? state.hero.rallyMultiplier : 1;

  const barracks = state.posts.filter((post) => post.type === 'soldier');
  state.soldiers = state.soldiers.filter((unit) => barracks.includes(unit.ownerPost));

  for (const post of barracks) {
    const hasUnit = state.soldiers.some((unit) => unit.ownerPost === post);
    post.spawnCooldown -= dt;
    if (!hasUnit && post.spawnCooldown <= 0) {
      const center = getPostCenter(post);
      state.soldiers.push({
        x: center.x,
        y: center.y,
        homeX: center.x,
        homeY: center.y,
        ownerPost: post,
        speed: 2.6,
        attackRange: 20,
        leashRange: postStats.soldier.rangeTiles * TILE_SIZE,
        damage: postStats.soldier.damage,
        attackCooldown: 0.9,
        attackTimer: 0,
        attackAnimTime: 0,
        attackDx: 1,
        attackDy: 0,
      });
      post.spawnCooldown = 1 / postStats.soldier.fireRate;
    }
  }

  for (const unit of state.soldiers) {
    unit.attackTimer = Math.max(0, unit.attackTimer - dt);
    unit.attackAnimTime = Math.max(0, unit.attackAnimTime - dt);

    const { target, distance } = soldierFindTarget(unit);
    const step = unit.speed * dt * 60;

    if (target) {
      const dx = target.x - unit.x;
      const dy = target.y - unit.y;

      if (distance > unit.attackRange && distance > 0) {
        unit.x += (dx / distance) * step;
        unit.y += (dy / distance) * step;
      } else if (unit.attackTimer <= 0) {
        target.health -= Math.round(unit.damage * multiplier);
        unit.attackTimer = unit.attackCooldown;
        unit.attackAnimTime = 0.15;
        if (distance > 0) {
          unit.attackDx = dx / distance;
          unit.attackDy = dy / distance;
        }
        if (target.health <= 0 && target.alive) {
          target.alive = false;
          addKillRewards(target);
        }
      }
    } else {
      const dx = unit.homeX - unit.x;
      const dy = unit.homeY - unit.y;
      const homeDist = Math.hypot(dx, dy);
      if (homeDist > 2) {
        unit.x += (dx / homeDist) * step;
        unit.y += (dy / homeDist) * step;
      }
    }
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
      if (dist < enemy.radius + 2) {
        enemy.health -= projectile.damage;
        projectile.active = false;
        if (enemy.health <= 0 && enemy.alive) {
          enemy.alive = false;
          addKillRewards(enemy);
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
  state.hero.escapeCharges = 0;
  state.hero.rallyActiveUntil = 0;

  if (state.wave >= MAX_WAVES) {
    state.phase = 'victory';
    setMessage('Victory! Your army held all waves. Press Restart to play again.');
  } else {
    state.phase = 'between';
    setMessage(`Wave ${state.wave} complete. Deploy posts, then start the next wave.`);
  }
}

function update(dt, now) {
  if (state.phase !== 'playing') {
    updateUI();
    return;
  }

  updateHero(dt, now);
  updateEnemies(dt);
  updateArcherPosts(dt, now);
  updateSoldierBarracks(dt, now);
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

function drawHero() {
  const hero = state.hero;
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(hero.x, hero.y, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#111827';
  ctx.stroke();

  if (hero.attackAnimTime > 0) {
    const tipX = hero.x + hero.attackDx * 18;
    const tipY = hero.y + hero.attackDy * 18;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(hero.x, hero.y);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
    ctx.lineWidth = 1;
  }
}

function drawPosts(now) {
  const rallyActive = state.hero.rallyActiveUntil > now;

  for (const post of state.posts) {
    const stats = postStats[post.type];
    const x = post.gridX * TILE_SIZE;
    const y = post.gridY * TILE_SIZE;

    ctx.fillStyle = stats.color;
    ctx.fillRect(x + 5, y + 5, TILE_SIZE - 10, TILE_SIZE - 10);
    ctx.strokeStyle = '#111827';
    ctx.strokeRect(x + 5, y + 5, TILE_SIZE - 10, TILE_SIZE - 10);

    if (rallyActive) {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawSoldiers() {
  for (const unit of state.soldiers) {
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(unit.x, unit.y, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#111827';
    ctx.stroke();

    if (unit.attackAnimTime > 0) {
      const tipX = unit.x + unit.attackDx * 14;
      const tipY = unit.y + unit.attackDy * 14;
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(unit.x, unit.y);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      ctx.lineWidth = 1;
    }
  }
}

function drawEnemies() {
  for (const enemy of state.enemies) {
    if (!enemy.alive || enemy.reachedEnd || enemy.spawnDelay > 0) continue;

    const archetype = enemyStats[enemy.type];

    ctx.fillStyle = archetype.color;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#111827';
    ctx.stroke();

    const barW = Math.max(24, enemy.radius * 2);
    const bx = enemy.x - barW / 2;
    const by = enemy.y - enemy.radius - 10;

    ctx.fillStyle = '#111827';
    ctx.fillRect(bx, by, barW, 4);

    const hpW = Math.max(0, (enemy.health / enemy.maxHealth) * barW);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(bx, by, hpW, 4);
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
  if (!hoverGrid || !state.selectedPost) return;

  const { x, y } = hoverGrid;
  if (x < 0 || y < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT) return;

  const stats = postStats[state.selectedPost];
  const valid = canPlacePost(x, y) && (state.debugInfiniteGold || state.gold >= stats.cost);

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

function draw(now) {
  drawGrid();
  drawHoverPreview();
  drawHero();
  drawPosts(now);
  drawSoldiers();
  drawEnemies();
  drawProjectiles();
  drawOverlayText();
}

function loop(now) {
  const dt = Math.min(0.05, (now - previousTime) / 1000);
  previousTime = now;

  update(dt, now / 1000);
  draw(now / 1000);
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
  placePost(gridX, gridY);
});

canvas.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  if (state.phase === 'gameover' || state.phase === 'victory') return;

  const rect = canvas.getBoundingClientRect();
  const gridX = Math.floor((event.clientX - rect.left) / TILE_SIZE);
  const gridY = Math.floor((event.clientY - rect.top) / TILE_SIZE);
  sellPost(gridX, gridY);
});

towerButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const selected = btn.dataset.type;
    const stats = postStats[selected];
    selectPost(selected);
    setMessage(`Selected ${stats.name} (${stats.cost} gold).`);
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
  if (event.key.toLowerCase() === 'd') {
    state.debugInfiniteGold = !state.debugInfiniteGold;
    setMessage(`Debug infinite gold ${state.debugInfiniteGold ? 'enabled' : 'disabled'}.`);
    updateUI();
  }
});

resetGame();
requestAnimationFrame(loop);
