const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const goldEl = document.getElementById('gold');
const livesEl = document.getElementById('lives');
const armyXpEl = document.getElementById('armyXp');
const waveEl = document.getElementById('wave');
const slashCdEl = document.getElementById('slashCd');
const rallyCdEl = document.getElementById('rallyCd');
const escapeCdEl = document.getElementById('escapeCd');
const heroHpEl = document.getElementById('heroHp');
const heroRespawnEl = document.getElementById('heroRespawn');
const messageEl = document.getElementById('message');
const startWaveBtn = document.getElementById('startWaveBtn');
const restartBtn = document.getElementById('restartBtn');
const debugBtn = document.getElementById('debugBtn');
const towerButtons = [...document.querySelectorAll('.tower-btn')];

const TILE_SIZE = 30;
const GRID_WIDTH = 28;
const GRID_HEIGHT = 28;
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
    damage: 18,
    fireRate: 0.45,
    rangeTiles: 4,
    color: '#2563eb',
    projectileColor: '#06b6d4',
    projectileSpeed: 4,
  },
};

const enemyStats = {
  militia: { name: 'Militia', healthMult: 0.9, speedMult: 1.25, reward: 12, color: '#dc2626', radius: 10, attack: 8, attackSpeed: 0.85 },
  raider: { name: 'Raider', healthMult: 1.0, speedMult: 1.0, reward: 15, color: '#f97316', radius: 12, attack: 12, attackSpeed: 0.95 },
  brute: { name: 'Brute', healthMult: 1.8, speedMult: 0.72, reward: 25, color: '#7e22ce', radius: 14, attack: 20, attackSpeed: 1.15 },
};

const path = createPath();
const pathSet = new Set(path.map(([x, y]) => `${x},${y}`));
const heroAnchor = path[Math.floor(path.length / 2)];

let state;
let previousTime = performance.now();
let hoverGrid = null;
let renderScaleX = 1;
let renderScaleY = 1;
let renderOffsetX = 0;
let renderOffsetY = 0;

function resizeCanvasDisplayToViewport() {
  const wrapper = canvas.parentElement;
  if (!wrapper) return;

  const width = Math.max(320, Math.floor(wrapper.clientWidth));
  const height = Math.max(320, Math.floor(wrapper.clientHeight));

  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const uniformScale = Math.min(width / BOARD_PX, height / BOARD_PX);
  renderScaleX = uniformScale;
  renderScaleY = uniformScale;
  renderOffsetX = (width - BOARD_PX * uniformScale) / 2;
  renderOffsetY = (height - BOARD_PX * uniformScale) / 2;
}

function createPath() {
  const result = [];
  for (let y = 0; y < 7; y++) result.push([2, y]);
  for (let x = 2; x < 15; x++) result.push([x, 7]);
  for (let y = 7; y < 17; y++) result.push([15, y]);
  for (let x = 15; x > 5; x--) result.push([x, 17]);
  for (let y = 17; y < 24; y++) result.push([5, y]);
  for (let x = 5; x < GRID_WIDTH; x++) result.push([x, 24]);
  return result;
}

function createHero() {
  const anchorX = heroAnchor[0] * TILE_SIZE + TILE_SIZE / 2;
  const anchorY = heroAnchor[1] * TILE_SIZE + TILE_SIZE / 2;
  return {
    anchorX,
    anchorY,
    x: anchorX,
    y: anchorY,
    maxHealth: 250,
    health: 250,
    alive: true,
    respawnDuration: 8,
    respawnTimer: 0,
    moveSpeed: 2.8,
    attackDamage: 24,
    attackRange: 22,
    attackCooldown: 0.7,
    attackTimer: 0,
    slashDamage: 36,
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
    facingX: 1,
    facingY: 0,
  };
}

function resetGame() {
  state = {
    phase: 'between',
    gold: STARTING_GOLD,
    lives: STARTING_LIVES,
    armyXp: 0,
    wave: 0,
    selectedPostType: null,
    selectedPlacedPost: null,
    posts: [],
    soldiers: [],
    enemies: [],
    projectiles: [],
    debugInfiniteGold: false,
    hero: createHero(),
  };

  updateUI();
  setMessage('Deploy posts. Click placed post to view range. Right-click to sell.');
  selectPostType(null);
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

  heroHpEl.textContent = state.hero.alive ? `${Math.max(0, Math.floor(state.hero.health))}/${state.hero.maxHealth}` : 'DEAD';
  heroRespawnEl.textContent = `${state.hero.respawnTimer.toFixed(1)}s`;

  debugBtn.textContent = `Debug Gold: ${state.debugInfiniteGold ? 'ON' : 'OFF'}`;
}

function toggleDebugInfiniteGold() {
  state.debugInfiniteGold = !state.debugInfiniteGold;
  setMessage(`Debug infinite gold ${state.debugInfiniteGold ? 'enabled' : 'disabled'}.`);
  updateUI();
}

function selectPostType(type) {
  state.selectedPostType = type;
  if (type) state.selectedPlacedPost = null;
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
  if (state.phase !== 'between' || state.wave >= MAX_WAVES) return;

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
    attackDamage: archetype.attack,
    attackCooldown: archetype.attackSpeed,
    attackTimer: 0,
    facingX: 1,
    facingY: 0,
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
  if (!state.selectedPostType) {
    setMessage('Select an Army Post first.');
    return;
  }

  const stats = postStats[state.selectedPostType];
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

  const post = {
    gridX,
    gridY,
    type: state.selectedPostType,
    cooldown: 0,
    respawnTimer: 0,
  };

  state.posts.push(post);
  state.selectedPlacedPost = post;

  updateUI();
  setMessage(`${stats.name} deployed.`);
}

function sellPost(gridX, gridY) {
  const post = getPostAt(gridX, gridY);
  if (!post) return;

  const idx = state.posts.indexOf(post);
  if (idx >= 0) state.posts.splice(idx, 1);

  state.soldiers = state.soldiers.filter((unit) => unit.ownerPost !== post && unit.alive);

  const refund = Math.floor(postStats[post.type].cost * SELL_RATIO);
  if (!state.debugInfiniteGold) state.gold += refund;
  if (state.selectedPlacedPost === post) state.selectedPlacedPost = null;

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
    const dist = Math.hypot(enemy.x - center.x, enemy.y - center.y);
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

function heroTakeDamage(damage) {
  const hero = state.hero;
  if (!hero.alive) return;
  hero.health -= damage;
  if (hero.health <= 0) {
    hero.alive = false;
    hero.respawnTimer = hero.respawnDuration;
  }
}

function soldierTakeDamage(unit, damage) {
  if (!unit.alive) return;
  unit.health -= damage;
  if (unit.health <= 0) {
    unit.alive = false;
    unit.ownerPost.respawnTimer = Math.max(unit.ownerPost.respawnTimer, 5);
  }
}

function gatherFriendlyTargets() {
  const targets = [];
  if (state.hero.alive) targets.push(state.hero);
  for (const unit of state.soldiers) {
    if (unit.alive) targets.push(unit);
  }
  return targets;
}

function chooseClosestEnemyTo(x, y) {
  let target = null;
  let bestDistance = Infinity;

  for (const enemy of state.enemies) {
    if (!enemy.alive || enemy.reachedEnd || enemy.spawnDelay > 0) continue;
    const dist = Math.hypot(enemy.x - x, enemy.y - y);
    if (dist < bestDistance) {
      bestDistance = dist;
      target = enemy;
    }
  }

  return { target, distance: bestDistance };
}

function updateHeroState(dt) {
  const hero = state.hero;
  hero.attackTimer = Math.max(0, hero.attackTimer - dt);
  hero.slashTimer = Math.max(0, hero.slashTimer - dt);
  hero.rallyTimer = Math.max(0, hero.rallyTimer - dt);
  hero.escapeTimer = Math.max(0, hero.escapeTimer - dt);
  hero.attackAnimTime = Math.max(0, hero.attackAnimTime - dt);

  if (!hero.alive) {
    hero.respawnTimer = Math.max(0, hero.respawnTimer - dt);
    if (hero.respawnTimer === 0) {
      hero.alive = true;
      hero.health = hero.maxHealth;
      hero.x = hero.anchorX;
      hero.y = hero.anchorY;
    }
    return;
  }

  if (hero.rallyActiveUntil > 0 && performance.now() / 1000 > hero.rallyActiveUntil) {
    hero.rallyActiveUntil = 0;
  }
}

function heroMove(dt) {
  const hero = state.hero;
  if (!hero.alive) return;

  const { target, distance } = chooseClosestEnemyTo(hero.x, hero.y);
  const step = hero.moveSpeed * dt * 60;

  if (target && distance > hero.attackRange * 0.85) {
    const dx = target.x - hero.x;
    const dy = target.y - hero.y;
    if (distance > 0) {
      hero.facingX = dx / distance;
      hero.facingY = dy / distance;
      hero.x += hero.facingX * step;
      hero.y += hero.facingY * step;
    }
  } else if (!target) {
    const dx = hero.anchorX - hero.x;
    const dy = hero.anchorY - hero.y;
    const homeDist = Math.hypot(dx, dy);
    if (homeDist > 2) {
      hero.facingX = dx / homeDist;
      hero.facingY = dy / homeDist;
      hero.x += hero.facingX * step;
      hero.y += hero.facingY * step;
    }
  }
}

function heroBasicAttack() {
  const hero = state.hero;
  if (!hero.alive || hero.attackTimer > 0) return;

  const { target, distance } = chooseClosestEnemyTo(hero.x, hero.y);
  if (!target || distance > hero.attackRange) return;

  if (distance > 0) {
    hero.facingX = (target.x - hero.x) / distance;
    hero.facingY = (target.y - hero.y) / distance;
  }

  target.health -= hero.attackDamage;
  hero.attackTimer = hero.attackCooldown;
  hero.attackAnimTime = 0.14;

  if (target.health <= 0 && target.alive) {
    target.alive = false;
    addKillRewards(target);
  }
}

function heroSlash() {
  const hero = state.hero;
  if (!hero.alive || hero.slashTimer > 0) return;

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
  if (!hero.alive || hero.rallyTimer > 0) return;

  const anyActiveEnemies = state.enemies.some((enemy) => enemy.alive && !enemy.reachedEnd && enemy.spawnDelay <= 0);
  if (!anyActiveEnemies) return;

  hero.rallyTimer = hero.rallyCooldown;
  hero.rallyActiveUntil = now + hero.rallyDuration;
}

function heroEscape() {
  const hero = state.hero;
  if (!hero.alive || hero.escapeTimer > 0) return;

  const imminentLeak = state.enemies.some(
    (enemy) => enemy.alive && !enemy.reachedEnd && enemy.spawnDelay <= 0 && enemy.pathIndex >= path.length - 4,
  );
  if (!imminentLeak) return;

  hero.escapeTimer = hero.escapeCooldown;
  hero.escapeCharges = 1;
}

function updateHero(dt, now) {
  updateHeroState(dt);
  heroMove(dt);
  heroSlash();
  heroRally(now);
  heroEscape();
  heroBasicAttack();
}

function updateEnemies(dt) {
  const friendlies = gatherFriendlyTargets();

  for (const enemy of state.enemies) {
    if (!enemy.alive || enemy.reachedEnd) continue;

    if (enemy.spawnDelay > 0) {
      enemy.spawnDelay -= dt;
      continue;
    }

    enemy.attackTimer = Math.max(0, enemy.attackTimer - dt);

    let closestFriendly = null;
    let closestFriendlyDist = Infinity;
    for (const friendly of friendlies) {
      const dist = Math.hypot(friendly.x - enemy.x, friendly.y - enemy.y);
      if (dist < closestFriendlyDist) {
        closestFriendlyDist = dist;
        closestFriendly = friendly;
      }
    }

    const engageRadius = 26;
    const attackRange = enemy.radius + 10;

    if (closestFriendly && closestFriendlyDist <= engageRadius) {
      const dx = closestFriendly.x - enemy.x;
      const dy = closestFriendly.y - enemy.y;
      if (closestFriendlyDist > 0) {
        enemy.facingX = dx / closestFriendlyDist;
        enemy.facingY = dy / closestFriendlyDist;
      }

      if (closestFriendlyDist > attackRange) {
        const step = enemy.speed * dt * 60;
        enemy.x += enemy.facingX * step;
        enemy.y += enemy.facingY * step;
      } else if (enemy.attackTimer <= 0) {
        if (closestFriendly === state.hero) {
          heroTakeDamage(enemy.attackDamage);
        } else {
          soldierTakeDamage(closestFriendly, enemy.attackDamage);
        }
        enemy.attackTimer = enemy.attackCooldown;
      }
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
      enemy.facingX = dx / dist;
      enemy.facingY = dy / dist;
      enemy.x += enemy.facingX * step;
      enemy.y += enemy.facingY * step;
    }
  }
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
  state.soldiers = state.soldiers.filter((unit) => unit.ownerPost && barracks.includes(unit.ownerPost) && unit.alive);

  for (const post of barracks) {
    post.respawnTimer = Math.max(0, post.respawnTimer - dt);

    const hasUnit = state.soldiers.some((unit) => unit.ownerPost === post && unit.alive);
    if (!hasUnit && post.respawnTimer === 0) {
      const center = getPostCenter(post);
      state.soldiers.push({
        x: center.x,
        y: center.y,
        homeX: center.x,
        homeY: center.y,
        ownerPost: post,
        maxHealth: 80,
        health: 80,
        alive: true,
        speed: 2.4,
        attackRange: 20,
        leashRange: postStats.soldier.rangeTiles * TILE_SIZE,
        damage: 20,
        attackCooldown: 0.9,
        attackTimer: 0,
        attackAnimTime: 0,
        facingX: 1,
        facingY: 0,
      });
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
      if (distance > 0) {
        unit.facingX = dx / distance;
        unit.facingY = dy / distance;
      }

      if (distance > unit.attackRange && distance > 0) {
        unit.x += unit.facingX * step;
        unit.y += unit.facingY * step;
      } else if (unit.attackTimer <= 0) {
        target.health -= Math.round(unit.damage * multiplier);
        unit.attackTimer = unit.attackCooldown;
        unit.attackAnimTime = 0.15;
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
        unit.facingX = dx / homeDist;
        unit.facingY = dy / homeDist;
        unit.x += unit.facingX * step;
        unit.y += unit.facingY * step;
      }
    }

    if (!unit.alive) {
      unit.ownerPost.respawnTimer = Math.max(unit.ownerPost.respawnTimer, 5);
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

function drawRangeOverlay(centerX, centerY, rangeTiles, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(centerX, centerY, rangeTiles * TILE_SIZE, 0, Math.PI * 2);
  ctx.fill();
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
  if (!hero.alive) return;

  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(hero.x, hero.y, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#111827';
  ctx.stroke();

  const faceTipX = hero.x + hero.facingX * 10;
  const faceTipY = hero.y + hero.facingY * 10;
  ctx.beginPath();
  ctx.moveTo(hero.x, hero.y);
  ctx.lineTo(faceTipX, faceTipY);
  ctx.stroke();

  const barW = 22;
  const bx = hero.x - barW / 2;
  const by = hero.y - 18;
  ctx.fillStyle = '#111827';
  ctx.fillRect(bx, by, barW, 4);
  const hpW = Math.max(0, (hero.health / hero.maxHealth) * barW);
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(bx, by, hpW, 4);

  if (hero.attackAnimTime > 0) {
    const tipX = hero.x + hero.facingX * 18;
    const tipY = hero.y + hero.facingY * 18;
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

    if (post.type === 'soldier' && post.respawnTimer > 0) {
      ctx.fillStyle = '#facc15';
      ctx.font = '12px Arial';
      ctx.fillText(post.respawnTimer.toFixed(1), x + 2, y - 4);
    }
  }
}

function drawSoldiers() {
  for (const unit of state.soldiers) {
    if (!unit.alive) continue;

    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(unit.x, unit.y, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#111827';
    ctx.stroke();

    const faceTipX = unit.x + unit.facingX * 8;
    const faceTipY = unit.y + unit.facingY * 8;
    ctx.beginPath();
    ctx.moveTo(unit.x, unit.y);
    ctx.lineTo(faceTipX, faceTipY);
    ctx.stroke();

    const barW = 16;
    const bx = unit.x - barW / 2;
    const by = unit.y - 16;
    ctx.fillStyle = '#111827';
    ctx.fillRect(bx, by, barW, 3);
    const hpW = Math.max(0, (unit.health / unit.maxHealth) * barW);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(bx, by, hpW, 3);

    if (unit.attackAnimTime > 0) {
      const tipX = unit.x + unit.facingX * 14;
      const tipY = unit.y + unit.facingY * 14;
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

    const faceTipX = enemy.x + enemy.facingX * (enemy.radius - 2);
    const faceTipY = enemy.y + enemy.facingY * (enemy.radius - 2);
    ctx.beginPath();
    ctx.moveTo(enemy.x, enemy.y);
    ctx.lineTo(faceTipX, faceTipY);
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

function drawRangeSelection() {
  ctx.save();
  if (state.selectedPostType && hoverGrid) {
    const stats = postStats[state.selectedPostType];
    const cx = hoverGrid.x * TILE_SIZE + TILE_SIZE / 2;
    const cy = hoverGrid.y * TILE_SIZE + TILE_SIZE / 2;
    drawRangeOverlay(cx, cy, stats.rangeTiles, 'rgba(59,130,246,0.18)');
  }

  if (state.selectedPlacedPost) {
    const stats = postStats[state.selectedPlacedPost.type];
    const c = getPostCenter(state.selectedPlacedPost);
    drawRangeOverlay(c.x, c.y, stats.rangeTiles, 'rgba(245,158,11,0.22)');
  }
  ctx.restore();
}

function drawHoverPreview() {
  if (!hoverGrid || !state.selectedPostType) return;

  const { x, y } = hoverGrid;
  if (x < 0 || y < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT) return;

  const stats = postStats[state.selectedPostType];
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
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(renderScaleX, 0, 0, renderScaleY, renderOffsetX, renderOffsetY);

  drawGrid();
  drawRangeSelection();
  drawHoverPreview();
  drawHero();
  drawPosts(now);
  drawSoldiers();
  drawEnemies();
  drawProjectiles();
  drawOverlayText();
}

function getBoardCoordinatesFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  const pixelX = event.clientX - rect.left - renderOffsetX;
  const pixelY = event.clientY - rect.top - renderOffsetY;

  const boardX = pixelX / renderScaleX;
  const boardY = pixelY / renderScaleY;

  return {
    boardX,
    boardY,
    gridX: Math.floor(boardX / TILE_SIZE),
    gridY: Math.floor(boardY / TILE_SIZE),
  };
}

function loop(now) {
  const dt = Math.min(0.05, (now - previousTime) / 1000);
  previousTime = now;

  update(dt, now / 1000);
  draw(now / 1000);
  requestAnimationFrame(loop);
}

window.addEventListener('resize', () => {
  resizeCanvasDisplayToViewport();
});

canvas.addEventListener('mousemove', (event) => {
  const pos = getBoardCoordinatesFromEvent(event);
  hoverGrid = { x: pos.gridX, y: pos.gridY };
});

canvas.addEventListener('mouseleave', () => {
  hoverGrid = null;
});

canvas.addEventListener('click', (event) => {
  if (state.phase === 'gameover' || state.phase === 'victory') return;

  const pos = getBoardCoordinatesFromEvent(event);
  const gridX = pos.gridX;
  const gridY = pos.gridY;

  const existing = getPostAt(gridX, gridY);
  if (existing) {
    state.selectedPlacedPost = existing;
    state.selectedPostType = null;
    selectPostType(null);
    return;
  }

  placePost(gridX, gridY);
});

canvas.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  if (state.phase === 'gameover' || state.phase === 'victory') return;

  const pos = getBoardCoordinatesFromEvent(event);
  const gridX = pos.gridX;
  const gridY = pos.gridY;
  sellPost(gridX, gridY);
});

towerButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const selected = btn.dataset.type;
    const stats = postStats[selected];
    selectPostType(selected);
    setMessage(`Selected ${stats.name} (${stats.cost} gold).`);
  });
});

startWaveBtn.addEventListener('click', spawnWave);
restartBtn.addEventListener('click', () => resetGame());
debugBtn.addEventListener('click', () => toggleDebugInfiniteGold());

window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'r') {
    resetGame();
  }
  if (event.key.toLowerCase() === 'd') {
    toggleDebugInfiniteGold();
  }
});

resetGame();
resizeCanvasDisplayToViewport();
requestAnimationFrame(loop);
