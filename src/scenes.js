import { clamp, lerp, mulberry32, pick, rgba, roundRect, seededRange, shade, smoothstep } from './utils.js';

export const SCENES = [
  {
    id: 'city',
    name: 'City',
    namePt: 'Cidade',
    base: 700,
    seed: 3.1,
    skyTop: '#e9fcf1',
    skyBottom: '#9fe4cd',
    grass: '#37c98b',
    grassLight: '#74e8ad',
    grassDark: '#25a873',
    dirt: '#0d4f49',
    dirtDark: '#083d38',
    detail: '#1a6a5f',
    accent: '#f08080',
  },
  {
    id: 'grave',
    name: 'Graveyard',
    namePt: 'Cemitério',
    base: 705,
    seed: 8.7,
    skyTop: '#141a46',
    skyBottom: '#49336e',
    grass: '#49d59a',
    grassLight: '#8bf0bd',
    grassDark: '#2da875',
    dirt: '#0a3534',
    dirtDark: '#062625',
    detail: '#1a5550',
    accent: '#7b4fd1',
  },
  {
    id: 'desert',
    name: 'Desert',
    namePt: 'Deserto',
    base: 695,
    seed: 14.2,
    skyTop: '#ffe0a8',
    skyBottom: '#f08a76',
    grass: '#f4cf8a',
    grassLight: '#ffe8ae',
    grassDark: '#d9a457',
    dirt: '#b6783d',
    dirtDark: '#955c2b',
    detail: '#cf9350',
    accent: '#ffb347',
  },
];

const SPAWNS = [270, 1330];

function rawGround(scene, x) {
  return (
    scene.base +
    Math.sin((x + scene.seed * 120) / 205) * 24 +
    Math.sin(x / 74 + scene.seed) * 10 +
    Math.sin(x / 33 + scene.seed * 2.3) * 5
  );
}

const spawnHeights = SCENES.map((scene) => SPAWNS.map((x) => rawGround(scene, x)));

export function groundY(scene, x) {
  let y = rawGround(scene, x);
  const index = SCENES.indexOf(scene);
  if (index < 0) return y;
  for (let i = 0; i < SPAWNS.length; i += 1) {
    const sx = SPAWNS[i];
    const d = Math.abs(x - sx);
    if (d < 120) {
      const t = smoothstep(clamp(d / 120, 0, 1));
      y = lerp(spawnHeights[index][i], y, t);
    }
  }
  return y;
}

export function getScene(level = 1) {
  return SCENES[(Math.max(1, level) - 1) % SCENES.length];
}

function makeCity() {
  const rng = mulberry32(918233);
  const far = [];
  const mid = [];
  const near = [];
  let x = -520;
  while (x < 2200) {
    const w = seededRange(rng, 55, 150);
    far.push({ x, w, h: seededRange(rng, 90, 260) });
    x += w + seededRange(rng, 8, 30);
  }
  x = -460;
  while (x < 2150) {
    const w = seededRange(rng, 90, 180);
    mid.push({
      x,
      w,
      h: seededRange(rng, 130, 290),
      color: pick(['#a9dfd0', '#9bd8c8', '#b6e6d6', '#8ed0c3']),
      window: 'rgba(255,255,255,0.34)',
    });
    x += w + seededRange(rng, 18, 60);
  }
  const colors = ['#e39087', '#d97f7a', '#efa496', '#d9838b', '#e8978b', '#db7d83'];
  x = -420;
  while (x < 2100) {
    const w = seededRange(rng, 120, 220);
    const h = seededRange(rng, 230, 400);
    const cols = Math.max(2, Math.floor(w / 54));
    const rows = Math.max(3, Math.floor((h - 70) / 58));
    const lit = [];
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) lit.push(rng() > 0.78);
    }
    near.push({
      x,
      w,
      h,
      color: pick(colors),
      cols,
      rows,
      lit,
      roof: rng() > 0.55 ? 'cornice' : 'flat',
      awning: rng() > 0.55,
      pipe: rng() > 0.7,
      door: rng() > 0.4,
    });
    x += w + seededRange(rng, 20, 80);
  }
  return { far, mid, near };
}

function makeTrees() {
  const rng = mulberry32(77213);
  const segments = [];
  function branch(x, y, angle, len, depth, width) {
    const x2 = x + Math.cos(angle) * len;
    const y2 = y + Math.sin(angle) * len;
    segments.push({ x1: x, y1: y, x2, y2, w: width });
    if (depth <= 0) return;
    const spread = seededRange(rng, 0.32, 0.72);
    branch(x2, y2, angle - spread, len * seededRange(rng, 0.58, 0.76), depth - 1, Math.max(1, width * 0.62));
    branch(x2, y2, angle + seededRange(rng, 0.3, 0.66), len * seededRange(rng, 0.55, 0.72), depth - 1, Math.max(1, width * 0.58));
    if (rng() > 0.62 && depth > 1) {
      branch(x2, y2, angle + seededRange(rng, -0.15, 0.25), len * 0.5, depth - 2, Math.max(1, width * 0.45));
    }
  }
  const trees = [
    { x: 90, len: 130, angle: -1.62 },
    { x: 470, len: 120, angle: -1.5 },
    { x: 785, len: 155, angle: -1.7 },
    { x: 1260, len: 135, angle: -1.55 },
    { x: 1565, len: 150, angle: -1.62 },
  ];
  for (const tree of trees) {
    const base = groundY(SCENES[1], tree.x) - 4;
    branch(tree.x, base, tree.angle, tree.len, 4, 11);
  }
  return segments;
}

function makeGraves() {
  const rng = mulberry32(44211);
  const graves = [];
  let x = -260;
  while (x < 2000) {
    const kind = rng();
    graves.push({
      x,
      w: seededRange(rng, 26, 46),
      h: seededRange(rng, 42, 86),
      kind: kind > 0.72 ? 'cross' : kind > 0.35 ? 'round' : 'obelisk',
      lean: seededRange(rng, -0.12, 0.12),
      candle: rng() > 0.55,
    });
    x += seededRange(rng, 95, 190);
  }
  return graves;
}

function makeStars() {
  const rng = mulberry32(9917);
  const stars = [];
  for (let i = 0; i < 90; i += 1) {
    stars.push({
      x: rng(),
      y: rng() * 0.72,
      r: seededRange(rng, 0.7, 2.1),
      phase: rng() * 6.28,
      speed: seededRange(rng, 0.6, 1.6),
    });
  }
  return stars;
}

function makeClouds() {
  const rng = mulberry32(5150);
  return Array.from({ length: 6 }, () => ({
    x: rng(),
    y: seededRange(rng, 0.06, 0.32),
    scale: seededRange(rng, 0.55, 1.3),
    speed: seededRange(rng, 0.0025, 0.008),
    alpha: seededRange(rng, 0.35, 0.7),
  }));
}

function makeBats() {
  const rng = mulberry32(3377);
  return Array.from({ length: 5 }, () => ({
    x: seededRange(rng, 300, 1700),
    y: seededRange(rng, 180, 430),
    r: seededRange(rng, 25, 70),
    speed: seededRange(rng, 0.3, 0.8),
    phase: rng() * 6.28,
  }));
}

function makeFireflies() {
  const rng = mulberry32(7821);
  return Array.from({ length: 18 }, () => ({
    x: seededRange(rng, -100, 1700),
    y: seededRange(rng, 420, 660),
    phase: rng() * 6.28,
    speed: seededRange(rng, 0.4, 1.2),
    size: seededRange(rng, 1.6, 3.4),
  }));
}

const CITY = makeCity();
const TREES = makeTrees();
const GRAVES = makeGraves();
const STARS = makeStars();
const CLOUDS = makeClouds();
const BATS = makeBats();
const FIREFLIES = makeFireflies();

const CITY_PROPS = [
  { type: 'hydrant', x: 605 },
  { type: 'lamp', x: 940, dir: -1 },
  { type: 'bench', x: 1115 },
  { type: 'lamp', x: 1560, dir: 1 },
  { type: 'crates', x: 1760 },
  { type: 'cone', x: 880 },
];

const GRAVE_PROPS = [
  { type: 'pumpkin', x: 555 },
  { type: 'fence', x: 860 },
  { type: 'pumpkin', x: 1490 },
  { type: 'candle', x: 1110 },
  { type: 'rock', x: 1740 },
];

const DESERT_PROPS = [
  { type: 'cactus', x: 545 },
  { type: 'skull', x: 830 },
  { type: 'barrel', x: 1090 },
  { type: 'cactus', x: 1485 },
  { type: 'rocks', x: 1735 },
];

function drawCitySky(ctx, w, h, t) {
  const sun = ctx.createRadialGradient(w * 0.79, h * 0.16, 10, w * 0.79, h * 0.16, w * 0.32);
  sun.addColorStop(0, 'rgba(255,255,225,0.95)');
  sun.addColorStop(0.18, 'rgba(255,255,215,0.55)');
  sun.addColorStop(1, 'rgba(255,255,220,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);

  for (const cloud of CLOUDS) {
    const x = ((cloud.x + t * cloud.speed) % 1.2) * (w + 300) - 150;
    const y = cloud.y * h;
    const s = (w / 1440) * cloud.scale;
    ctx.globalAlpha = cloud.alpha;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(x, y, 74 * s, 24 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x - 46 * s, y + 6 * s, 40 * s, 18 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 52 * s, y + 7 * s, 48 * s, 19 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 10 * s, y - 14 * s, 38 * s, 20 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.strokeStyle = 'rgba(70,150,140,0.4)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i += 1) {
    const bx = ((t * 12 + i * 420) % (w + 400)) - 200;
    const by = h * 0.2 + i * 34;
    ctx.beginPath();
    ctx.moveTo(bx - 10, by);
    ctx.quadraticCurveTo(bx - 5, by - 6, bx, by);
    ctx.quadraticCurveTo(bx + 5, by - 6, bx + 10, by);
    ctx.stroke();
  }
}

function drawGraveSky(ctx, w, h, t) {
  for (const star of STARS) {
    const twinkle = 0.55 + 0.45 * Math.sin(t * star.speed + star.phase);
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = '#fff6d8';
    ctx.beginPath();
    ctx.arc(star.x * w, star.y * h, star.r * (w / 1440 + 0.4), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const mx = w * 0.73;
  const my = h * 0.17;
  const mr = Math.min(w, h) * 0.09;
  const glow = ctx.createRadialGradient(mx, my, mr * 0.6, mx, my, mr * 3.2);
  glow.addColorStop(0, 'rgba(210,225,255,0.35)');
  glow.addColorStop(1, 'rgba(210,225,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.beginPath();
  ctx.arc(mx, my, mr, 0, Math.PI * 2);
  ctx.fillStyle = '#f1f0ff';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(mx - mr * 0.32, my - mr * 0.2, mr * 0.18, 0, Math.PI * 2);
  ctx.arc(mx + mr * 0.3, my + mr * 0.18, mr * 0.12, 0, Math.PI * 2);
  ctx.arc(mx + mr * 0.05, my + mr * 0.42, mr * 0.09, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(180,185,220,0.35)';
  ctx.fill();

  ctx.fillStyle = 'rgba(35,40,90,0.5)';
  for (let i = 0; i < 3; i += 1) {
    const y = h * (0.38 + i * 0.09);
    const x = ((t * (4 + i * 3) + i * 500) % (w + 600)) - 300;
    ctx.beginPath();
    ctx.ellipse(x, y, 220, 26, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDesertSky(ctx, w, h, t) {
  const sx = w * 0.5;
  const sy = h * 0.4;
  const sr = Math.min(w, h) * 0.15;
  const glow = ctx.createRadialGradient(sx, sy, sr * 0.5, sx, sy, sr * 3);
  glow.addColorStop(0, 'rgba(255,240,180,0.75)');
  glow.addColorStop(0.35, 'rgba(255,200,120,0.25)');
  glow.addColorStop(1, 'rgba(255,180,100,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  const g = ctx.createLinearGradient(sx, sy - sr, sx, sy + sr);
  g.addColorStop(0, '#fff6c9');
  g.addColorStop(1, '#ffb968');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(sx, sy, sr * 1.04, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,220,0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();

  for (let i = 0; i < 4; i += 1) {
    const bx = ((t * 17 + i * 380) % (w + 500)) - 250;
    const by = h * (0.16 + (i % 3) * 0.07);
    ctx.strokeStyle = 'rgba(90,55,45,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx - 9, by - 2);
    ctx.quadraticCurveTo(bx - 4, by - 8, bx, by - 1);
    ctx.quadraticCurveTo(bx + 4, by - 8, bx + 9, by - 2);
    ctx.stroke();
  }
}

export function drawSky(ctx, scene, w, h, t) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, scene.skyTop);
  grad.addColorStop(1, scene.skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  if (scene.id === 'city') drawCitySky(ctx, w, h, t);
  else if (scene.id === 'grave') drawGraveSky(ctx, w, h, t);
  else drawDesertSky(ctx, w, h, t);
}

function drawCityBuilding(ctx, b, base) {
  const top = base - b.h;
  ctx.fillStyle = b.color;
  roundRect(ctx, b.x, top, b.w, b.h, 3);
  ctx.fill();
  ctx.fillStyle = shade(b.color, -0.18);
  ctx.fillRect(b.x - 5, top - 9, b.w + 10, 13);
  ctx.fillStyle = shade(b.color, -0.07);
  ctx.fillRect(b.x, top + 4, b.w, 5);

  const winW = Math.max(10, (b.w - 26) / b.cols - 12);
  const winH = 20;
  const gapX = (b.w - 20 - winW * b.cols) / Math.max(1, b.cols - 1);
  const gapY = 34;
  for (let r = 0; r < b.rows; r += 1) {
    for (let c = 0; c < b.cols; c += 1) {
      const wx = b.x + 10 + c * (winW + gapX);
      const wy = top + 26 + r * gapY;
      if (wy + winH > base - 50) continue;
      const lit = b.lit[r * b.cols + c];
      ctx.fillStyle = lit ? '#ffe08c' : 'rgba(205,248,229,0.75)';
      roundRect(ctx, wx, wy, winW, winH, 4);
      ctx.fill();
      if (lit) {
        ctx.fillStyle = 'rgba(255,215,120,0.2)';
        roundRect(ctx, wx - 3, wy - 3, winW + 6, winH + 6, 6);
        ctx.fill();
      }
      ctx.fillStyle = b.color;
      ctx.fillRect(wx, wy + winH * 0.46, winW, 2);
      ctx.fillRect(wx + winW * 0.48, wy, 2, winH);
    }
  }

  if (b.awning) {
    const aw = Math.min(b.w - 30, 100);
    const ax = b.x + b.w / 2 - aw / 2;
    const ay = base - 72;
    ctx.fillStyle = b.color === '#e39087' ? '#f5cdad' : '#f6e3c4';
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + aw, ay);
    ctx.lineTo(ax + aw - 5, ay + 18);
    ctx.lineTo(ax + 5, ay + 18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(90,45,45,0.22)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  if (b.pipe) {
    ctx.strokeStyle = shade(b.color, -0.22);
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(b.x + b.w - 12, top);
    ctx.lineTo(b.x + b.w - 12, top - 26);
    ctx.lineTo(b.x + b.w - 28, top - 26);
    ctx.stroke();
  }
  if (b.door) {
    ctx.fillStyle = shade(b.color, -0.32);
    roundRect(ctx, b.x + b.w / 2 - 14, base - 62, 28, 46, 5);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(b.x + b.w / 2 - 10, base - 57, 20, 16);
  }
}

function drawCityBackdrop(ctx, t) {
  ctx.fillStyle = 'rgba(198, 240, 226, 0.55)';
  for (const b of CITY.far) ctx.fillRect(b.x, 780 - b.h, b.w, b.h);

  for (const b of CITY.mid) {
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, 800 - b.h, b.w, b.h);
    ctx.fillStyle = 'rgba(255,255,255,0.32)';
    for (let y = 800 - b.h + 20; y < 790; y += 30) {
      for (let x = b.x + 12; x < b.x + b.w - 12; x += 22) {
        ctx.fillRect(x, y, 8, 12);
      }
    }
    ctx.globalAlpha = 1;
  }

  for (const b of CITY.near) drawCityBuilding(ctx, b, 830);

  ctx.fillStyle = 'rgba(233, 252, 241, 0.16)';
  ctx.fillRect(-500, 560, 2600, 260);

  for (const [x, h] of [[180, 60], [1240, 48], [1680, 70]]) {
    const y = 770 - h;
    ctx.fillStyle = '#8fc7b8';
    ctx.fillRect(x, y, 34, h);
    ctx.fillStyle = '#7bb8a8';
    ctx.beginPath();
    ctx.ellipse(x + 17, y, 24, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 17, y + 10, 17, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(86, 160, 146, 0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i += 1) {
    const bx = ((t * 9 + i * 560) % 2200) - 300;
    const by = 300 + i * 40;
    ctx.beginPath();
    ctx.moveTo(bx - 9, by);
    ctx.quadraticCurveTo(bx - 4, by - 6, bx, by);
    ctx.quadraticCurveTo(bx + 4, by - 6, bx + 9, by);
    ctx.stroke();
  }
}

function drawGraveBackdrop(ctx, t) {
  ctx.fillStyle = '#2c2f64';
  ctx.beginPath();
  ctx.moveTo(-500, 790);
  for (let x = -500; x <= 2200; x += 120) {
    const y = 480 + Math.sin(x / 260 + 1.4) * 70 + Math.sin(x / 97) * 22;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(2200, 790);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#3a3c75';
  ctx.beginPath();
  ctx.moveTo(-500, 800);
  for (let x = -500; x <= 2200; x += 90) {
    const y = 570 + Math.cos(x / 300) * 55 + Math.sin(x / 120 + 2) * 18;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(2200, 800);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(44, 42, 96, 0.85)';
  for (let x = -400; x < 2060; x += 120) {
    const h = 30 + ((x * 37) % 90);
    ctx.fillRect(x, 760 - h, 50, h);
    if (x % 240 === 0) {
      ctx.beginPath();
      ctx.arc(x + 25, 760 - h, 25, Math.PI, 0);
      ctx.fill();
    }
  }

  ctx.strokeStyle = '#5e4066';
  ctx.lineCap = 'round';
  for (const seg of TREES) {
    ctx.lineWidth = seg.w + 1.5;
    ctx.strokeStyle = '#3e2b46';
    ctx.beginPath();
    ctx.moveTo(seg.x1, seg.y1);
    ctx.lineTo(seg.x2, seg.y2);
    ctx.stroke();
    ctx.lineWidth = seg.w;
    ctx.strokeStyle = '#5e4066';
    ctx.stroke();
  }

  const chapelX = 960;
  const chapelBase = groundY(SCENES[1], chapelX);
  ctx.fillStyle = '#3d3b70';
  ctx.fillRect(chapelX - 70, chapelBase - 170, 140, 170);
  ctx.beginPath();
  ctx.moveTo(chapelX - 88, chapelBase - 170);
  ctx.lineTo(chapelX, chapelBase - 250);
  ctx.lineTo(chapelX + 88, chapelBase - 170);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2d2c59';
  roundRect(ctx, chapelX - 28, chapelBase - 80, 56, 80, 24);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 205, 110, 0.9)';
  for (const [dx, dy] of [[-45, -110], [40, -110]]) {
    roundRect(ctx, chapelX + dx - 8, chapelBase + dy, 16, 26, 8);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,205,110,0.14)';
    ctx.beginPath();
    ctx.arc(chapelX + dx, chapelBase + dy + 13, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 205, 110, 0.9)';
  }

  for (const grave of GRAVES) {
    const gy = groundY(SCENES[1], grave.x);
    if (grave.x > 820 && grave.x < 1100) continue;
    ctx.save();
    ctx.translate(grave.x, gy);
    ctx.rotate(grave.lean);
    if (grave.kind === 'cross') {
      ctx.fillStyle = '#5c5a8c';
      ctx.fillRect(-4, -grave.h, 8, grave.h);
      ctx.fillRect(-16, -grave.h + 16, 32, 8);
    } else if (grave.kind === 'obelisk') {
      ctx.fillStyle = '#565484';
      ctx.beginPath();
      ctx.moveTo(-grave.w / 2, 0);
      ctx.lineTo(-grave.w / 2 + 4, -grave.h + 16);
      ctx.lineTo(0, -grave.h);
      ctx.lineTo(grave.w / 2 - 4, -grave.h + 16);
      ctx.lineTo(grave.w / 2, 0);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = '#575586';
      roundRect(ctx, -grave.w / 2, -grave.h, grave.w, grave.h, grave.w / 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(-grave.w / 2 + 5, -grave.h + 10, 4, grave.h - 20);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(-grave.w / 2, 0, grave.w, 5);
    if (grave.candle) {
      const flicker = 0.75 + Math.sin(t * 5 + grave.x) * 0.25;
      ctx.fillStyle = `rgba(255, 190, 80, ${0.9 * flicker})`;
      roundRect(ctx, -5, -10, 10, 14, 4);
      ctx.fill();
      ctx.fillStyle = `rgba(255, 190, 80, ${0.12 * flicker})`;
      ctx.beginPath();
      ctx.arc(0, -8, 26, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  for (const bat of BATS) {
    const x = bat.x + Math.sin(t * bat.speed + bat.phase) * bat.r * 1.4;
    const y = bat.y + Math.cos(t * bat.speed * 1.3 + bat.phase) * bat.r * 0.4;
    const flap = Math.sin(t * 9 + bat.phase) * 5;
    ctx.strokeStyle = 'rgba(18, 14, 38, 0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 12, y + flap * 0.2);
    ctx.quadraticCurveTo(x - 6, y - 5 - flap, x, y);
    ctx.quadraticCurveTo(x + 6, y - 5 - flap, x + 12, y + flap * 0.2);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(160, 170, 220, 0.05)';
  for (let i = 0; i < 4; i += 1) {
    const fy = 560 + i * 38;
    const fx = ((t * (8 + i * 4) + i * 400) % 2400) - 500;
    ctx.beginPath();
    ctx.ellipse(fx, fy, 300, 24, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDesertBackdrop(ctx, t) {
  const sunX = 800;
  ctx.fillStyle = 'rgba(255, 190, 110, 0.22)';
  ctx.fillRect(-500, 380, 2600, 420);

  ctx.fillStyle = '#c46b58';
  ctx.beginPath();
  ctx.moveTo(170, 760);
  ctx.lineTo(520, 440);
  ctx.lineTo(720, 760);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 210, 160, 0.22)';
  ctx.beginPath();
  ctx.moveTo(520, 440);
  ctx.lineTo(720, 760);
  ctx.lineTo(590, 760);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#b95f50';
  ctx.beginPath();
  ctx.moveTo(710, 760);
  ctx.lineTo(900, 540);
  ctx.lineTo(1080, 760);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#b98156';
  ctx.beginPath();
  ctx.moveTo(1180, 780);
  ctx.lineTo(1230, 560);
  ctx.lineTo(1330, 540);
  ctx.lineTo(1440, 560);
  ctx.lineTo(1500, 780);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(90, 45, 35, 0.18)';
  ctx.beginPath();
  ctx.moveTo(1330, 540);
  ctx.lineTo(1440, 560);
  ctx.lineTo(1500, 780);
  ctx.lineTo(1360, 780);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#a86a3f';
  ctx.beginPath();
  ctx.moveTo(-500, 800);
  ctx.quadraticCurveTo(100, 610, 420, 730);
  ctx.quadraticCurveTo(650, 800, 820, 720);
  ctx.quadraticCurveTo(1080, 620, 1320, 740);
  ctx.quadraticCurveTo(1600, 850, 2200, 700);
  ctx.lineTo(2200, 900);
  ctx.lineTo(-500, 900);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 220, 160, 0.2)';
  ctx.beginPath();
  ctx.moveTo(-500, 820);
  ctx.quadraticCurveTo(300, 700, 700, 790);
  ctx.quadraticCurveTo(1100, 890, 1500, 770);
  ctx.quadraticCurveTo(1800, 690, 2200, 780);
  ctx.lineTo(2200, 900);
  ctx.lineTo(-500, 900);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(90, 50, 35, 0.55)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i += 1) {
    const vx = 380 + i * 520 + Math.sin(t * 0.32 + i) * 130;
    const vy = 190 + i * 45 + Math.cos(t * 0.4 + i) * 20;
    ctx.beginPath();
    ctx.moveTo(vx - 11, vy);
    ctx.quadraticCurveTo(vx - 5, vy - 9 - Math.sin(t * 4 + i) * 2, vx, vy);
    ctx.quadraticCurveTo(vx + 5, vy - 9 - Math.sin(t * 4 + i) * 2, vx + 11, vy);
    ctx.stroke();
  }
}

export function drawBackdrop(ctx, scene, t) {
  if (scene.id === 'city') drawCityBackdrop(ctx, t);
  else if (scene.id === 'grave') drawGraveBackdrop(ctx, t);
  else drawDesertBackdrop(ctx, t);
}

function traceGround(ctx, scene) {
  ctx.beginPath();
  ctx.moveTo(-700, 1100);
  for (let x = -700; x <= 2400; x += 14) ctx.lineTo(x, groundY(scene, x));
  ctx.lineTo(2400, 1100);
  ctx.closePath();
}

export function drawGround(ctx, scene, t) {
  traceGround(ctx, scene);
  ctx.fillStyle = scene.dirt;
  ctx.fill();

  ctx.save();
  traceGround(ctx, scene);
  ctx.clip();
  if (scene.id === 'city') {
    ctx.strokeStyle = rgba(scene.detail, 0.55);
    ctx.lineWidth = 2;
    for (let y = 736; y < 1050; y += 40) {
      ctx.beginPath();
      ctx.moveTo(-700, y);
      ctx.lineTo(2400, y);
      ctx.stroke();
      for (let x = -700 + ((y / 40) % 2) * 44; x < 2400; x += 88) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 40);
        ctx.stroke();
      }
    }
  } else if (scene.id === 'grave') {
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    const rng = mulberry32(6102);
    for (let i = 0; i < 260; i += 1) {
      const x = seededRange(rng, -600, 2300);
      const y = groundY(scene, x) + seededRange(rng, 18, 280);
      ctx.beginPath();
      ctx.arc(x, y, seededRange(rng, 1, 4), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(70, 120, 110, 0.14)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 14; i += 1) {
      const x = -400 + i * 190;
      ctx.beginPath();
      ctx.moveTo(x, groundY(scene, x) + 40);
      ctx.quadraticCurveTo(x + 20, groundY(scene, x) + 80, x - 20, groundY(scene, x) + 130);
      ctx.stroke();
    }
  } else {
    ctx.strokeStyle = 'rgba(120, 70, 35, 0.28)';
    ctx.lineWidth = 5;
    for (let i = 0; i < 8; i += 1) {
      const y = 740 + i * 38;
      ctx.beginPath();
      for (let x = -700; x <= 2400; x += 40) {
        const yy = y + Math.sin(x / 130 + i) * 9;
        if (x === -700) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
  }
  const glow = ctx.createLinearGradient(0, 690, 0, 980);
  glow.addColorStop(0, 'rgba(0,0,0,0)');
  glow.addColorStop(1, 'rgba(0,0,0,0.24)');
  ctx.fillStyle = glow;
  ctx.fillRect(-700, 690, 3100, 420);
  ctx.restore();

  ctx.beginPath();
  for (let x = -700; x <= 2400; x += 14) {
    const y = groundY(scene, x);
    if (x === -700) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = scene.grassDark;
  ctx.lineWidth = 30;
  ctx.stroke();
  ctx.strokeStyle = scene.grass;
  ctx.lineWidth = 22;
  ctx.stroke();
  ctx.strokeStyle = scene.grassLight;
  ctx.lineWidth = 7;
  ctx.stroke();

  const rng = mulberry32(3517);
  ctx.fillStyle = scene.grassDark;
  ctx.beginPath();
  for (let x = -700; x <= 2400; x += 15) {
    const y = groundY(scene, x) + 9;
    const len = 7 + ((x / 15) % 2 === 0 ? 6 : 2) + rng() * 8;
    ctx.moveTo(x - 6.5, y);
    ctx.lineTo(x + 6.5, y);
    ctx.lineTo(x + (rng() - 0.5) * 3, y + len);
    ctx.closePath();
  }
  ctx.fill();

  const rng2 = mulberry32(8123);
  for (let i = 0; i < 90; i += 1) {
    const x = seededRange(rng2, -600, 2300);
    const y = groundY(scene, x) - 2;
    const kind = rng2();
    if (scene.id === 'city') {
      ctx.strokeStyle = '#2f9e6e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (rng2() - 0.5) * 8, y - 10 - rng2() * 8);
      ctx.stroke();
      if (kind > 0.7) {
        ctx.fillStyle = pick(['#ffd23f', '#ff8ba0', '#fff4b8']);
        ctx.beginPath();
        ctx.arc(x + 2, y - 12, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (scene.id === 'grave') {
      ctx.strokeStyle = '#2f9e6e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (rng2() - 0.5) * 7, y - 8 - rng2() * 7);
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(140, 90, 50, 0.45)';
      ctx.beginPath();
      ctx.ellipse(x, y + 3, 5 + rng2() * 5, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawLamp(ctx, x, dir) {
  const y = groundY(SCENES[0], x);
  ctx.strokeStyle = '#2f5a53';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 120);
  ctx.quadraticCurveTo(x, y - 138, x + dir * 26, y - 138);
  ctx.stroke();
  ctx.fillStyle = '#2f5a53';
  ctx.beginPath();
  ctx.arc(x, y - 3, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe08c';
  roundRect(ctx, x + dir * 26 - 9, y - 144, 18, 16, 6);
  ctx.fill();
  const glow = ctx.createRadialGradient(x + dir * 26, y - 136, 2, x + dir * 26, y - 136, 58);
  glow.addColorStop(0, 'rgba(255,224,140,0.35)');
  glow.addColorStop(1, 'rgba(255,224,140,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x + dir * 26, y - 136, 58, 0, Math.PI * 2);
  ctx.fill();
}

function drawCityProps(ctx, t) {
  for (const prop of CITY_PROPS) {
    const x = prop.x;
    const y = groundY(SCENES[0], x);
    if (prop.type === 'lamp') {
      drawLamp(ctx, x, prop.dir);
    } else if (prop.type === 'hydrant') {
      ctx.fillStyle = '#e3484e';
      roundRect(ctx, x - 8, y - 28, 16, 28, 5);
      ctx.fill();
      ctx.fillStyle = '#b92f36';
      ctx.fillRect(x - 14, y - 20, 28, 6);
      ctx.beginPath();
      ctx.arc(x, y - 30, 7, Math.PI, 0);
      ctx.fill();
    } else if (prop.type === 'bench') {
      ctx.fillStyle = '#8b5a33';
      roundRect(ctx, x - 42, y - 30, 84, 8, 3);
      ctx.fill();
      roundRect(ctx, x - 42, y - 46, 84, 8, 3);
      ctx.fill();
      ctx.fillStyle = '#4c3728';
      ctx.fillRect(x - 36, y - 24, 6, 24);
      ctx.fillRect(x + 30, y - 24, 6, 24);
    } else if (prop.type === 'crates') {
      ctx.fillStyle = '#b98348';
      roundRect(ctx, x - 24, y - 40, 48, 40, 4);
      ctx.fill();
      ctx.strokeStyle = '#845a2c';
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 24, y - 40, 48, 40);
      ctx.beginPath();
      ctx.moveTo(x - 24, y - 40);
      ctx.lineTo(x + 24, y);
      ctx.moveTo(x + 24, y - 40);
      ctx.lineTo(x - 24, y);
      ctx.stroke();
    } else if (prop.type === 'cone') {
      ctx.fillStyle = '#ff7a3d';
      ctx.beginPath();
      ctx.moveTo(x, y - 32);
      ctx.lineTo(x + 12, y);
      ctx.lineTo(x - 12, y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff3d8';
      ctx.fillRect(x - 8, y - 15, 16, 5);
    }
  }
}

function drawGraveProps(ctx, t) {
  for (const prop of GRAVE_PROPS) {
    const x = prop.x;
    const y = groundY(SCENES[1], x);
    if (prop.type === 'pumpkin') {
      ctx.fillStyle = '#e8842b';
      ctx.beginPath();
      ctx.ellipse(x, y - 12, 17, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b65c16';
      ctx.beginPath();
      ctx.ellipse(x - 8, y - 12, 6, 13, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 8, y - 12, 6, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3f7d3b';
      ctx.fillRect(x - 2, y - 28, 4, 8);
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath();
      ctx.moveTo(x - 10, y - 14);
      ctx.lineTo(x - 4, y - 19);
      ctx.lineTo(x - 4, y - 9);
      ctx.closePath();
      ctx.moveTo(x + 10, y - 14);
      ctx.lineTo(x + 4, y - 19);
      ctx.lineTo(x + 4, y - 9);
      ctx.closePath();
      ctx.fill();
    } else if (prop.type === 'fence') {
      ctx.strokeStyle = '#4c4a73';
      ctx.lineWidth = 4;
      for (let i = 0; i < 6; i += 1) {
        const fx = x - 80 + i * 32;
        const fy = groundY(SCENES[1], fx);
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx, fy - 36);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(x - 88, y - 26);
      ctx.lineTo(x + 88, y - 26);
      ctx.moveTo(x - 88, y - 12);
      ctx.lineTo(x + 88, y - 12);
      ctx.stroke();
    } else if (prop.type === 'candle') {
      ctx.fillStyle = '#d8d2b6';
      roundRect(ctx, x - 4, y - 18, 8, 18, 3);
      ctx.fill();
      const flicker = 0.8 + Math.sin(t * 6 + x) * 0.2;
      ctx.fillStyle = `rgba(255,200,90,${flicker})`;
      ctx.beginPath();
      ctx.ellipse(x, y - 22, 3, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (prop.type === 'rock') {
      ctx.fillStyle = '#454370';
      ctx.beginPath();
      ctx.ellipse(x, y - 6, 26, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5b5889';
      ctx.beginPath();
      ctx.ellipse(x - 8, y - 10, 14, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawDesertProps(ctx) {
  for (const prop of DESERT_PROPS) {
    const x = prop.x;
    const y = groundY(SCENES[2], x);
    if (prop.type === 'cactus') {
      ctx.strokeStyle = '#4f8a4c';
      ctx.lineCap = 'round';
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - 74);
      ctx.stroke();
      ctx.lineWidth = 11;
      ctx.beginPath();
      ctx.moveTo(x, y - 44);
      ctx.lineTo(x - 24, y - 44);
      ctx.lineTo(x - 24, y - 66);
      ctx.moveTo(x, y - 32);
      ctx.lineTo(x + 22, y - 32);
      ctx.lineTo(x + 22, y - 52);
      ctx.stroke();
      ctx.strokeStyle = '#6ba562';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x - 4, y - 8);
      ctx.lineTo(x - 4, y - 66);
      ctx.stroke();
    } else if (prop.type === 'skull') {
      ctx.fillStyle = '#efe3c6';
      ctx.beginPath();
      ctx.ellipse(x, y - 12, 16, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - 9, y - 8, 18, 10);
      ctx.fillStyle = '#6b4f36';
      ctx.beginPath();
      ctx.arc(x - 6, y - 15, 4, 0, Math.PI * 2);
      ctx.arc(x + 6, y - 15, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - 2, y - 10, 4, 4);
    } else if (prop.type === 'barrel') {
      ctx.fillStyle = '#8a5a32';
      roundRect(ctx, x - 16, y - 44, 32, 44, 8);
      ctx.fill();
      ctx.strokeStyle = '#5f3d22';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 16, y - 30);
      ctx.lineTo(x + 16, y - 30);
      ctx.moveTo(x - 16, y - 14);
      ctx.lineTo(x + 16, y - 14);
      ctx.stroke();
      ctx.fillStyle = '#a87445';
      ctx.beginPath();
      ctx.ellipse(x, y - 44, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (prop.type === 'rocks') {
      ctx.fillStyle = '#a0633a';
      ctx.beginPath();
      ctx.ellipse(x, y - 5, 32, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#bc7c4d';
      ctx.beginPath();
      ctx.ellipse(x - 12, y - 11, 16, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function drawDecor(ctx, scene, t) {
  if (scene.id === 'city') drawCityProps(ctx, t);
  else if (scene.id === 'grave') drawGraveProps(ctx, t);
  else drawDesertProps(ctx);

  if (scene.id === 'grave') {
    for (const fly of FIREFLIES) {
      const x = fly.x + Math.sin(t * fly.speed + fly.phase) * 26;
      const y = fly.y + Math.cos(t * fly.speed * 0.8 + fly.phase) * 14;
      const a = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2 + fly.phase));
      ctx.fillStyle = `rgba(255, 220, 120, ${a * 0.25})`;
      ctx.beginPath();
      ctx.arc(x, y, fly.size * 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255, 240, 170, ${a})`;
      ctx.beginPath();
      ctx.arc(x, y, fly.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (scene.id === 'desert') {
    ctx.strokeStyle = 'rgba(255, 235, 190, 0.24)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 12; i += 1) {
      const x = ((t * 60 + i * 173) % 2600) - 500;
      const y = 380 + ((i * 61) % 300);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 36, y - 3);
      ctx.stroke();
    }
  }
}


