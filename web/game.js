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
const PATH_HALF_WIDTH_TILES = 1;
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
const pathCells = buildWidePathCells(path, PATH_HALF_WIDTH_TILES);
const pathSet = new Set(pathCells.map(([x, y]) => `${x},${y}`));
const heroAnchor = path[Math.floor(path.length / 2)];

let state;
let previousTime = performance.now();
let hoverGrid = null;
let renderScaleX = 1;
let renderScaleY = 1;
let renderOffsetX = 0;
let renderOffsetY = 0;
let grassPattern = null;
let gravelPattern = null;
let unitSprites = null;
let postSprites = null;

const TEXTURE_RES_2K = 4096;
const UNIT_SPRITE_BASE_SIZE = 48;
const UNIT_SPRITE_TEXTURE_SIZE = TEXTURE_RES_2K;
const POST_SPRITE_BASE_SIZE = 64;
const POST_SPRITE_TEXTURE_SIZE = TEXTURE_RES_2K;

function setHighQualitySmoothing(targetCtx) {
  targetCtx.imageSmoothingEnabled = true;
  targetCtx.imageSmoothingQuality = 'high';
}

function resizeCanvasDisplayToViewport() {
  const wrapper = canvas.parentElement;
  if (!wrapper) return;

  const width = Math.max(320, Math.floor(wrapper.clientWidth));
  const height = Math.max(320, Math.floor(wrapper.clientHeight));

  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.style.imageRendering = 'auto';
  setHighQualitySmoothing(ctx);

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

function createGrassPattern() {
  const tex = document.createElement('canvas');
  tex.width = TEXTURE_RES_2K;
  tex.height = TEXTURE_RES_2K;
  const tctx = tex.getContext('2d');
  setHighQualitySmoothing(tctx);
  const s = TEXTURE_RES_2K;

  const baseGrad = tctx.createRadialGradient(s * 0.42, s * 0.35, s * 0.12, s * 0.5, s * 0.5, s * 0.95);
  baseGrad.addColorStop(0, '#3f7f3a');
  baseGrad.addColorStop(0.45, '#2f682c');
  baseGrad.addColorStop(1, '#1b3f1a');
  tctx.fillStyle = baseGrad;
  tctx.fillRect(0, 0, s, s);

  for (let i = 0; i < 11000; i++) {
    const n = Math.sin(i * 12.9898) * 43758.5453;
    const r = n - Math.floor(n);
    const m = Math.sin((i + 17) * 78.233) * 96321.517;
    const r2 = m - Math.floor(m);
    const x = r * s;
    const y = r2 * s;

    tctx.strokeStyle = i % 3 === 0 ? 'rgba(84,146,74,0.28)' : i % 3 === 1 ? 'rgba(38,87,33,0.24)' : 'rgba(56,114,48,0.22)';
    tctx.lineWidth = 0.8 + (r * 1.3);
    tctx.beginPath();
    tctx.moveTo(x, y);
    tctx.quadraticCurveTo(x + 2 + r * 10, y - 7 - r2 * 8, x + 4 + r2 * 8, y - 14 - r * 8);
    tctx.stroke();
  }

  for (let i = 0; i < 260; i++) {
    const n = Math.sin((i + 31) * 19.773) * 18347.113;
    const r = n - Math.floor(n);
    const m = Math.sin((i + 47) * 31.197) * 55427.817;
    const r2 = m - Math.floor(m);
    const x = r * s;
    const y = r2 * s;
    const radius = 24 + r * 52;
    const patch = tctx.createRadialGradient(x, y, radius * 0.2, x, y, radius);
    patch.addColorStop(0, 'rgba(106,153,86,0.12)');
    patch.addColorStop(1, 'rgba(0,0,0,0)');
    tctx.fillStyle = patch;
    tctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  const vignette = tctx.createRadialGradient(s * 0.5, s * 0.5, s * 0.22, s * 0.5, s * 0.5, s * 0.94);
  vignette.addColorStop(0, 'rgba(255,255,255,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.24)');
  tctx.globalAlpha = 1;
  tctx.fillStyle = vignette;
  tctx.fillRect(0, 0, s, s);

  tctx.globalAlpha = 1;

  return ctx.createPattern(tex, 'repeat');
}

function createGravelPattern() {
  const tex = document.createElement('canvas');
  tex.width = TEXTURE_RES_2K;
  tex.height = TEXTURE_RES_2K;
  const tctx = tex.getContext('2d');
  setHighQualitySmoothing(tctx);
  const s = TEXTURE_RES_2K;

  const baseGrad = tctx.createLinearGradient(0, 0, s, s);
  baseGrad.addColorStop(0, '#7a756b');
  baseGrad.addColorStop(0.45, '#666157');
  baseGrad.addColorStop(1, '#4b4740');
  tctx.fillStyle = baseGrad;
  tctx.fillRect(0, 0, s, s);

  for (let i = 0; i < 6800; i++) {
    const n = Math.sin((i + 7) * 17.831) * 51673.229;
    const r = n - Math.floor(n);
    const m = Math.sin((i + 23) * 33.917) * 21787.412;
    const r2 = m - Math.floor(m);
    const x = r * s;
    const y = r2 * s;
    const rw = 2 + r * 6;
    const rh = 1 + r2 * 4;

    tctx.fillStyle = i % 3 === 0 ? 'rgba(166,160,145,0.36)' : i % 3 === 1 ? 'rgba(117,111,99,0.34)' : 'rgba(83,78,69,0.30)';
    tctx.beginPath();
    tctx.ellipse(x, y, rw, rh, r * Math.PI, 0, Math.PI * 2);
    tctx.fill();
  }

  tctx.globalAlpha = 0.3;
  tctx.strokeStyle = '#423e37';
  tctx.lineWidth = 1.1;
  for (let i = 0; i < 2600; i++) {
    const x = ((i * 21 + 17) % s) + 0.5;
    const y = ((i * 37 + 11) % s) + 0.5;
    tctx.beginPath();
    tctx.moveTo(x, y);
    tctx.lineTo(x + 7 + (i % 5), y + ((i % 7) - 3));
    tctx.stroke();
  }

  const dustGrad = tctx.createRadialGradient(s * 0.48, s * 0.38, s * 0.12, s * 0.48, s * 0.38, s * 0.92);
  dustGrad.addColorStop(0, 'rgba(212,204,184,0.20)');
  dustGrad.addColorStop(1, 'rgba(0,0,0,0)');
  tctx.globalAlpha = 1;
  tctx.fillStyle = dustGrad;
  tctx.fillRect(0, 0, s, s);

  tctx.globalAlpha = 1;

  return ctx.createPattern(tex, 'repeat');
}

function ensureTerrainPatterns() {
  if (!grassPattern) grassPattern = createGrassPattern();
  if (!gravelPattern) gravelPattern = createGravelPattern();
}

function createPostSprite(drawFn) {
  const tex = document.createElement('canvas');
  tex.width = POST_SPRITE_TEXTURE_SIZE;
  tex.height = POST_SPRITE_TEXTURE_SIZE;
  const tctx = tex.getContext('2d');
  setHighQualitySmoothing(tctx);
  const scale = POST_SPRITE_TEXTURE_SIZE / POST_SPRITE_BASE_SIZE;
  tctx.scale(scale, scale);
  drawFn(tctx);
  return tex;
}

function createPostSprites() {
  const archer = createPostSprite((g) => {
    g.clearRect(0, 0, 64, 64);

    g.fillStyle = '#3a2a1a';
    g.fillRect(14, 42, 36, 14);

    const timberGrad = g.createLinearGradient(12, 24, 52, 44);
    timberGrad.addColorStop(0, '#6a5138');
    timberGrad.addColorStop(1, '#3f2f21');
    g.fillStyle = timberGrad;
    g.fillRect(12, 24, 40, 20);
    g.strokeStyle = '#1a120b';
    g.lineWidth = 2;
    g.strokeRect(12, 24, 40, 20);

    g.fillStyle = '#7d5a3a';
    for (let i = 0; i < 4; i++) {
      g.fillRect(14 + i * 10, 26, 6, 16);
    }

    g.globalAlpha = 0.26;
    g.fillStyle = '#d2bc90';
    for (let i = 0; i < 22; i++) {
      const x = (i * 9 + 3) % 34;
      const y = (i * 7 + 5) % 16;
      g.fillRect(14 + x, 26 + y, 1, 1);
    }
    g.globalAlpha = 1;

    g.fillStyle = '#4a3625';
    g.fillRect(17, 16, 6, 8);
    g.fillRect(41, 16, 6, 8);

    g.fillStyle = '#302010';
    g.beginPath();
    g.moveTo(10, 24);
    g.lineTo(32, 8);
    g.lineTo(54, 24);
    g.closePath();
    g.fill();

    g.fillStyle = '#8b6b45';
    g.beginPath();
    g.moveTo(13, 24);
    g.lineTo(32, 11);
    g.lineTo(51, 24);
    g.closePath();
    g.fill();

    g.fillStyle = '#d6c48f';
    g.fillRect(30, 13, 4, 5);
    g.fillStyle = '#111827';
    g.fillRect(31, 15, 2, 2);

    g.strokeStyle = '#2b1d10';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(8, 38);
    g.lineTo(56, 38);
    g.stroke();

    g.globalAlpha = 0.22;
    g.fillStyle = '#000000';
    g.fillRect(12, 24, 40, 2);
    g.globalAlpha = 1;
  });

  const soldier = createPostSprite((g) => {
    g.clearRect(0, 0, 64, 64);

    g.fillStyle = '#2f3138';
    g.fillRect(10, 40, 44, 16);

    const stoneGrad = g.createLinearGradient(10, 18, 54, 42);
    stoneGrad.addColorStop(0, '#636a76');
    stoneGrad.addColorStop(1, '#3e434d');
    g.fillStyle = stoneGrad;
    g.fillRect(10, 18, 44, 24);
    g.strokeStyle = '#1a1d24';
    g.lineWidth = 2;
    g.strokeRect(10, 18, 44, 24);

    g.fillStyle = '#656b78';
    for (let i = 0; i < 5; i++) {
      g.fillRect(12 + i * 8, 20, 6, 20);
    }

    g.globalAlpha = 0.22;
    g.fillStyle = '#98a2b1';
    for (let i = 0; i < 26; i++) {
      const x = (i * 11 + 2) % 42;
      const y = (i * 5 + 3) % 20;
      g.fillRect(11 + x, 20 + y, 1, 1);
    }
    g.globalAlpha = 1;

    g.fillStyle = '#2a2d35';
    g.fillRect(25, 28, 14, 14);
    g.fillStyle = '#8892a1';
    g.fillRect(28, 30, 8, 10);

    g.fillStyle = '#7f1d1d';
    g.beginPath();
    g.moveTo(18, 18);
    g.lineTo(24, 10);
    g.lineTo(30, 18);
    g.closePath();
    g.fill();

    g.fillStyle = '#0f172a';
    g.fillRect(21, 9, 2, 12);

    g.fillStyle = '#7f1d1d';
    g.beginPath();
    g.moveTo(36, 18);
    g.lineTo(42, 10);
    g.lineTo(48, 18);
    g.closePath();
    g.fill();

    g.fillStyle = '#0f172a';
    g.fillRect(39, 9, 2, 12);

    g.strokeStyle = '#20242d';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(8, 36);
    g.lineTo(56, 36);
    g.stroke();
  });

  return { archer, soldier };
}

function ensurePostSprites() {
  if (!postSprites) postSprites = createPostSprites();
}

function createUnitSprite(drawFn) {
  const tex = document.createElement('canvas');
  tex.width = UNIT_SPRITE_TEXTURE_SIZE;
  tex.height = UNIT_SPRITE_TEXTURE_SIZE;
  const tctx = tex.getContext('2d');
  setHighQualitySmoothing(tctx);
  const scale = UNIT_SPRITE_TEXTURE_SIZE / UNIT_SPRITE_BASE_SIZE;
  tctx.scale(scale, scale);
  drawFn(tctx);
  return tex;
}

function createUnitSprites() {
  const drawKnight = (g, cfg) => {
    g.clearRect(0, 0, 48, 48);

    g.globalAlpha = 0.35;
    g.fillStyle = '#05070b';
    g.beginPath();
    g.ellipse(24, 39, 12, 5, 0, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 1;

    g.fillStyle = cfg.cape;
    g.beginPath();
    g.moveTo(24, 17);
    g.lineTo(13, 31);
    g.lineTo(18, 37);
    g.lineTo(24, 33);
    g.lineTo(30, 37);
    g.lineTo(35, 31);
    g.closePath();
    g.fill();

    g.fillStyle = cfg.boots;
    g.fillRect(17, 33, 6, 8);
    g.fillRect(25, 33, 6, 8);
    g.fillStyle = '#0f141d';
    g.fillRect(16, 39, 8, 2);
    g.fillRect(24, 39, 8, 2);

    const torsoGrad = g.createLinearGradient(14, 16, 34, 34);
    torsoGrad.addColorStop(0, cfg.steelHi);
    torsoGrad.addColorStop(0.52, cfg.steelMid);
    torsoGrad.addColorStop(1, cfg.steelLow);
    g.fillStyle = torsoGrad;
    g.beginPath();
    g.moveTo(24, 15);
    g.lineTo(14, 22);
    g.lineTo(16, 33);
    g.lineTo(24, 36);
    g.lineTo(32, 33);
    g.lineTo(34, 22);
    g.closePath();
    g.fill();

    g.fillStyle = cfg.steelDark;
    g.beginPath();
    g.arc(16, 23, 4, 0, Math.PI * 2);
    g.arc(32, 23, 4, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = cfg.chain;
    g.fillRect(20, 27, 8, 9);
    g.globalAlpha = 0.35;
    g.fillStyle = '#d7dde5';
    for (let y = 28; y <= 34; y += 2) {
      g.fillRect(20, y, 8, 1);
    }
    g.globalAlpha = 1;

    g.fillStyle = cfg.helm;
    g.beginPath();
    g.moveTo(24, 7);
    g.lineTo(17, 11);
    g.lineTo(17, 19);
    g.lineTo(24, 22);
    g.lineTo(31, 19);
    g.lineTo(31, 11);
    g.closePath();
    g.fill();

    g.fillStyle = '#0a0e14';
    g.fillRect(20, 13, 8, 2);
    g.fillStyle = cfg.visorGlow;
    g.fillRect(21, 13, 2, 1);
    g.fillRect(25, 13, 2, 1);

    if (cfg.plume) {
      g.fillStyle = cfg.plume;
      g.beginPath();
      g.moveTo(24, 5);
      g.quadraticCurveTo(28, 8, 29, 13);
      g.lineTo(24, 11);
      g.lineTo(19, 13);
      g.quadraticCurveTo(20, 8, 24, 5);
      g.closePath();
      g.fill();
    }

    if (cfg.shield) {
      g.fillStyle = cfg.shield;
      g.beginPath();
      g.moveTo(11, 19);
      g.lineTo(7, 23);
      g.lineTo(8, 33);
      g.lineTo(13, 38);
      g.lineTo(17, 33);
      g.lineTo(16, 23);
      g.closePath();
      g.fill();
      g.strokeStyle = cfg.shieldTrim;
      g.lineWidth = 1.6;
      g.stroke();
    }

    if (cfg.weapon === 'sword') {
      g.fillStyle = '#e3e7ed';
      g.fillRect(33, 16, 2, 13);
      g.fillStyle = '#6a4a2b';
      g.fillRect(33, 29, 2, 6);
      g.fillStyle = '#2a3442';
      g.fillRect(31, 28, 6, 2);
    } else {
      g.fillStyle = '#5f4024';
      g.fillRect(33, 18, 2, 16);
      g.fillStyle = '#a2a9b5';
      g.beginPath();
      g.moveTo(32, 16);
      g.lineTo(38, 18);
      g.lineTo(36, 24);
      g.lineTo(31, 22);
      g.closePath();
      g.fill();
    }

    g.strokeStyle = '#0b1018';
    g.lineWidth = 1.2;
    g.strokeRect(17, 33, 6, 8);
    g.strokeRect(25, 33, 6, 8);
    g.beginPath();
    g.moveTo(24, 16);
    g.lineTo(24, 35);
    g.moveTo(14, 23);
    g.lineTo(34, 23);
    g.stroke();

    g.globalAlpha = 0.2;
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.ellipse(21, 18, 7, 3, -0.6, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 1;
  };

  const hero = createUnitSprite((g) =>
    drawKnight(g, {
      steelHi: '#d9dee6',
      steelMid: '#8791a1',
      steelLow: '#303a49',
      steelDark: '#232a37',
      helm: '#b7beca',
      chain: '#566173',
      cape: '#4b0d13',
      boots: '#1f232d',
      visorGlow: '#dfe6ef',
      plume: '#7d1017',
      shield: '#2f3340',
      shieldTrim: '#b6c1cf',
      weapon: 'sword'
    })
  );

  const soldier = createUnitSprite((g) =>
    drawKnight(g, {
      steelHi: '#cad3de',
      steelMid: '#76879c',
      steelLow: '#2c3646',
      steelDark: '#1d2737',
      helm: '#9eaabc',
      chain: '#49586b',
      cape: '#18212d',
      boots: '#1a1f2a',
      visorGlow: '#c8d3df',
      plume: null,
      shield: '#2d3545',
      shieldTrim: '#9fb0c5',
      weapon: 'sword'
    })
  );

  const militia = createUnitSprite((g) =>
    drawKnight(g, {
      steelHi: '#b3afa4',
      steelMid: '#726b5f',
      steelLow: '#312f2a',
      steelDark: '#26231f',
      helm: '#84786a',
      chain: '#4c4339',
      cape: '#33211a',
      boots: '#231c17',
      visorGlow: '#cdbda8',
      plume: null,
      shield: '#4a3527',
      shieldTrim: '#a08b74',
      weapon: 'axe'
    })
  );

  const raider = createUnitSprite((g) =>
    drawKnight(g, {
      steelHi: '#b59582',
      steelMid: '#7f5f4f',
      steelLow: '#3b2a25',
      steelDark: '#2f221d',
      helm: '#8f6d5d',
      chain: '#5e463b',
      cape: '#3d1411',
      boots: '#281a17',
      visorGlow: '#d7b2a1',
      plume: '#5c1713',
      shield: '#4f2319',
      shieldTrim: '#b68a75',
      weapon: 'axe'
    })
  );

  const brute = createUnitSprite((g) =>
    drawKnight(g, {
      steelHi: '#b7b1c7',
      steelMid: '#70688c',
      steelLow: '#30293f',
      steelDark: '#221d2f',
      helm: '#8d82a8',
      chain: '#564f6f',
      cape: '#231c38',
      boots: '#181423',
      visorGlow: '#cbc2e6',
      plume: null,
      shield: '#372f4e',
      shieldTrim: '#aea0d6',
      weapon: 'axe'
    })
  );

  return { hero, soldier, militia, raider, brute };
}

function ensureUnitSprites() {
  if (!unitSprites) unitSprites = createUnitSprites();
}

const UNIT_RENDER_SCALE = 3;
const UNIT_BASE_RENDER_MULT = 2.35;
const UNIT_HITBOX_MATCH = 0.72;

function getUnitRenderSize(radius) {
  return radius * UNIT_BASE_RENDER_MULT * UNIT_RENDER_SCALE;
}

function getUnitVisualRadius(radius) {
  return getUnitRenderSize(radius) / 2;
}

function getEntityHitRadius(entity) {
  return getUnitVisualRadius(entity.radius || 0) * UNIT_HITBOX_MATCH;
}

function drawFacingSprite(sprite, x, y, radius, facingX, facingY) {
  ensureUnitSprites();
  const angle = Math.atan2(facingY, facingX);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + Math.PI / 2);
  const size = getUnitRenderSize(radius);
  ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
  ctx.restore();
}

function drawUnitHealthBar(x, y, radius, health, maxHealth) {
  const renderRadius = getUnitVisualRadius(radius);
  const barW = Math.max(22, renderRadius * 1.05);
  const bx = x - barW / 2;
  const by = y - renderRadius - 10;
  ctx.fillStyle = '#111827';
  ctx.fillRect(bx, by, barW, 4);
  const hpW = Math.max(0, (health / maxHealth) * barW);
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(bx, by, hpW, 4);
}

function resolveOverlapPair(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const minDist = getEntityHitRadius(a) + getEntityHitRadius(b) + 0.5;
  if (dist <= 0 || dist >= minDist) return;

  const push = (minDist - dist) / 2;
  const nx = dx / dist;
  const ny = dy / dist;

  a.x -= nx * push;
  a.y -= ny * push;
  b.x += nx * push;
  b.y += ny * push;
}

function resolveUnitOverlaps() {
  const entities = [];
  if (state.hero.alive) entities.push(state.hero);
  for (const unit of state.soldiers) {
    if (unit.alive) entities.push(unit);
  }
  for (const enemy of state.enemies) {
    if (enemy.alive && !enemy.reachedEnd && enemy.spawnDelay <= 0) entities.push(enemy);
  }

  for (let pass = 0; pass < 4; pass++) {
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        resolveOverlapPair(entities[i], entities[j]);
      }
    }
  }
}

function buildWidePathCells(centerPath, halfWidth) {
  const cells = new Set();

  for (const [x, y] of centerPath) {
    for (let ox = -halfWidth; ox <= halfWidth; ox++) {
      for (let oy = -halfWidth; oy <= halfWidth; oy++) {
        const nx = x + ox;
        const ny = y + oy;
        if (nx < 0 || nx >= GRID_WIDTH || ny < 0 || ny >= GRID_HEIGHT) continue;
        cells.add(`${nx},${ny}`);
      }
    }
  }

  return [...cells].map((value) => value.split(',').map(Number));
}

function createHero() {
  const anchorX = heroAnchor[0] * TILE_SIZE + TILE_SIZE / 2;
  const anchorY = heroAnchor[1] * TILE_SIZE + TILE_SIZE / 2;
  return {
    anchorX,
    anchorY,
    x: anchorX,
    y: anchorY,
    radius: 10,
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

function cancelUiSelection(showMessage = true) {
  const hadSelection = Boolean(state.selectedPostType || state.selectedPlacedPost);
  if (!hadSelection) return false;

  selectPostType(null);
  state.selectedPlacedPost = null;
  if (showMessage) setMessage('Selection cancelled.');
  return true;
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
  const maxLaneOffset = TILE_SIZE * (0.65 * PATH_HALF_WIDTH_TILES);
  const baseLaneOffset = (Math.random() * 2 - 1) * maxLaneOffset;

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
    baseLaneOffset,
    laneOffset: baseLaneOffset,
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

  const chaseRange = target
    ? hero.attackRange + getEntityHitRadius(target) * 0.5 + getEntityHitRadius(hero) * 0.2
    : hero.attackRange;

  if (target && distance > chaseRange * 0.85) {
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
  const strikeRange = target
    ? hero.attackRange + getEntityHitRadius(target) * 0.45 + getEntityHitRadius(hero) * 0.2
    : hero.attackRange;
  if (!target || distance > strikeRange) return;

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
    return Math.hypot(enemy.x - hero.x, enemy.y - hero.y) <= hero.slashRange + getEntityHitRadius(enemy) * 0.35;
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
  const maxLaneOffset = TILE_SIZE * (0.65 * PATH_HALF_WIDTH_TILES);

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

    const enemyHit = getEntityHitRadius(enemy);
    const closestHit = closestFriendly ? getEntityHitRadius(closestFriendly) : 0;
    const engageRadius = enemyHit + closestHit + 8;
    const attackRange = enemyHit * 0.45 + closestHit * 0.55 + 4;

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

    let dirX = 1;
    let dirY = 0;
    if (enemy.pathIndex < path.length - 1) {
      dirX = path[enemy.pathIndex + 1][0] - gridX;
      dirY = path[enemy.pathIndex + 1][1] - gridY;
    } else if (enemy.pathIndex > 0) {
      dirX = gridX - path[enemy.pathIndex - 1][0];
      dirY = gridY - path[enemy.pathIndex - 1][1];
    }

    const dirLen = Math.hypot(dirX, dirY) || 1;
    const nx = -dirY / dirLen;
    const ny = dirX / dirLen;

    const tx = gridX * TILE_SIZE + TILE_SIZE / 2 + nx * enemy.laneOffset;
    const ty = gridY * TILE_SIZE + TILE_SIZE / 2 + ny * enemy.laneOffset;

    const dx = tx - enemy.x;
    const dy = ty - enemy.y;
    const dist = Math.hypot(dx, dy);
    const step = enemy.speed * dt * 60;

    if (dist <= step) {
      enemy.pathIndex += 1;
      const wobble = (Math.random() * 2 - 1) * TILE_SIZE * 0.2;
      const desiredOffset = enemy.baseLaneOffset + wobble;
      enemy.laneOffset = Math.max(-maxLaneOffset, Math.min(maxLaneOffset, desiredOffset));
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
        radius: 8,
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

      const strikeRange = unit.attackRange + getEntityHitRadius(unit) * 0.35 + getEntityHitRadius(target) * 0.45;
      if (distance > strikeRange && distance > 0) {
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
      if (dist < getEntityHitRadius(enemy) * 0.7 + 2) {
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
  resolveUnitOverlaps();
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
  ensureTerrainPatterns();

  ctx.fillStyle = grassPattern || '#3f7f3a';
  ctx.fillRect(0, 0, BOARD_PX, BOARD_PX);

  ctx.fillStyle = gravelPattern || '#8a8a7a';
  for (const [px, py] of pathCells) {
    const tx = px * TILE_SIZE;
    const ty = py * TILE_SIZE;
    ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);

    const noiseA = Math.sin(px * 12.9898 + py * 78.233) * 43758.5453;
    const noiseB = Math.sin(px * 23.173 + py * 31.947) * 96321.517;
    const rA = noiseA - Math.floor(noiseA);
    const rB = noiseB - Math.floor(noiseB);

    ctx.globalAlpha = 0.16;
    ctx.fillStyle = rA > 0.5 ? '#4f4c45' : '#b4ad97';
    ctx.fillRect(tx + 4 + rA * 10, ty + 5 + rB * 10, 5 + rA * 3, 2 + rB * 2);
    ctx.globalAlpha = 1;

    if (rB > 0.66) {
      ctx.strokeStyle = 'rgba(60, 56, 49, 0.28)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tx + 3, ty + TILE_SIZE * 0.55);
      ctx.lineTo(tx + TILE_SIZE - 3, ty + TILE_SIZE * 0.48);
      ctx.stroke();
    }
  }
}

function drawHero() {
  const hero = state.hero;
  if (!hero.alive) return;

  drawFacingSprite(unitSprites.hero, hero.x, hero.y, hero.radius, hero.facingX, hero.facingY);
  drawUnitHealthBar(hero.x, hero.y, hero.radius, hero.health, hero.maxHealth);

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
  ensurePostSprites();
  const rallyActive = state.hero.rallyActiveUntil > now;

  for (const post of state.posts) {
    const x = post.gridX * TILE_SIZE;
    const y = post.gridY * TILE_SIZE;

    const sprite = post.type === 'soldier' ? postSprites.soldier : postSprites.archer;
    ctx.drawImage(sprite, x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);

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

    drawFacingSprite(unitSprites.soldier, unit.x, unit.y, unit.radius, unit.facingX, unit.facingY);
    drawUnitHealthBar(unit.x, unit.y, unit.radius, unit.health, unit.maxHealth);

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

    const sprite = enemy.type === 'militia'
      ? unitSprites.militia
      : enemy.type === 'raider'
        ? unitSprites.raider
        : unitSprites.brute;

    drawFacingSprite(sprite, enemy.x, enemy.y, enemy.radius, enemy.facingX, enemy.facingY);
    drawUnitHealthBar(enemy.x, enemy.y, enemy.radius, enemy.health, enemy.maxHealth);
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
  ensureUnitSprites();
  setHighQualitySmoothing(ctx);

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

  if (cancelUiSelection(true)) {
    return;
  }

  const pos = getBoardCoordinatesFromEvent(event);
  const gridX = pos.gridX;
  const gridY = pos.gridY;
  sellPost(gridX, gridY);
});

window.addEventListener('contextmenu', (event) => {
  if (event.target === canvas) return;
  if (state.phase === 'gameover' || state.phase === 'victory') return;

  if (cancelUiSelection(true)) {
    event.preventDefault();
  }
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
