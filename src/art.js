import { HEROES, WEAPONS, W, H } from "./data.js";

/* ---------- utils ---------- */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function capsule(ctx, x1, y1, x2, y2, w) {
  ctx.lineCap = "round";
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

/* ============ CENÁRIOS ============ */
const X0 = -400;
const X1 = 2000;

function buildCity(ctx, rnd) {
  // céu mint
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#cdeeda");
  sky.addColorStop(1, "#eefbe6");
  ctx.fillStyle = sky;
  ctx.fillRect(X0, -150, X1 - X0, H + 150);

  // silhueta distante
  ctx.fillStyle = "#b6e0cd";
  ctx.fillRect(X0, 300, X1 - X0, 360);
  let x = X0 - 60;
  while (x < X1 + 60) {
    const w = 60 + rnd() * 130;
    const h = 110 + rnd() * 200;
    ctx.fillStyle = "#b6e0cd";
    ctx.fillRect(x, 660 - h, w, h + 60);
    if (rnd() > 0.6) {
      ctx.fillStyle = "#a4d6bf";
      ctx.fillRect(x + w * 0.3, 660 - h - 22, w * 0.24, 24);
    }
    x += w + 6 + rnd() * 40;
  }

  // prédios coral
  const palette = [
    ["#e59073", "#d97757"],
    ["#ef9b7b", "#e08a6a"],
    ["#d97b5e", "#c26a4e"],
    ["#e79a86", "#d47f66"],
  ];
  x = X0 - 20;
  while (x < X1 + 20) {
    const [c1, c2] = palette[Math.floor(rnd() * palette.length)];
    const w = 100 + rnd() * 150;
    const h = 170 + rnd() * 300;
    const baseY = 700;
    const g = ctx.createLinearGradient(x, baseY - h, x + w, baseY);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.fillRect(x, baseY - h, w, h + 20);
    // parapeito
    ctx.fillStyle = c2;
    ctx.fillRect(x - 6, baseY - h, w + 12, 14);
    // janelas
    const cols = 2 + Math.floor(w / 60);
    const rows = Math.floor(h / 95);
    const winW = 16, winH = 22;
    const gapx = (w - cols * winW) / (cols + 1);
    const gapy = (h - rows * winH) / (rows + 1.6);
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const wx = x + gapx + c * (winW + gapx);
        const wy = baseY - h + 24 + r * (winH + gapy);
        ctx.fillStyle = "#2c6a72";
        rr(ctx, wx, wy, winW, winH, 3);
        ctx.fill();
        if (rnd() > 0.72) {
          ctx.fillStyle = "#ffd576";
          rr(ctx, wx + 2, wy + 2, winW - 4, winH - 4, 2);
          ctx.fill();
          ctx.fillStyle = "#2c6a72";
        } else {
          ctx.fillStyle = "#4d9aa6";
          rr(ctx, wx + 2, wy + 2, winW / 2, winH - 4, 2);
          ctx.fill();
          ctx.fillStyle = "#2c6a72";
        }
      }
    }
    // porta ocasional
    if (rnd() > 0.5) {
      ctx.fillStyle = "#8c3f2e";
      rr(ctx, x + w / 2 - 16, baseY - 46, 32, 46, 6);
      ctx.fill();
    }
    x += w + 4 + rnd() * 30;
  }

  // postes de luz
  [280, 980, 1420].forEach((lx) => {
    const ly = 705;
    ctx.strokeStyle = "#41527d";
    ctx.lineWidth = 8;
    capsule(ctx, lx, ly, lx, ly - 110, 8);
    capsule(ctx, lx, ly - 108, lx + 26, ly - 116, 7);
    ctx.fillStyle = "#2c3a66";
    ctx.beginPath();
    ctx.ellipse(lx + 28, ly - 106, 14, 6, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#f9d65c";
    ctx.beginPath();
    ctx.ellipse(lx + 28, ly - 110, 9, 10, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#fff3c2";
    ctx.beginPath();
    ctx.ellipse(lx + 28, ly - 108, 4.5, 5.5, 0, 0, 7);
    ctx.fill();
  });
}

function buildGraveyard(ctx, rnd) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#1b2160");
  sky.addColorStop(0.65, "#2c3a82");
  sky.addColorStop(1, "#39488f");
  ctx.fillStyle = sky;
  ctx.fillRect(X0, -150, X1 - X0, H + 150);

  // estrelas
  ctx.fillStyle = "#cfe3ff";
  for (let i = 0; i < 150; i++) {
    const sx = X0 + rnd() * (X1 - X0);
    const sy = -140 + rnd() * 560;
    ctx.globalAlpha = 0.4 + rnd() * 0.6;
    ctx.fillRect(sx, sy, rnd() > 0.85 ? 3 : 2, rnd() > 0.85 ? 3 : 2);
  }
  ctx.globalAlpha = 1;
  // lua
  ctx.fillStyle = "#dfe8ff";
  ctx.beginPath();
  ctx.arc(230, 120, 40, 0, 7);
  ctx.fill();
  ctx.fillStyle = "#becbf5";
  ctx.beginPath();
  ctx.arc(244, 110, 9, 0, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(222, 132, 6, 0, 7);
  ctx.fill();

  // montanhas com neve
  constMountains(ctx, rnd);

  // skyline pontilhado
  ctx.fillStyle = "#233062";
  let bx = X0;
  while (bx < X1) {
    const bw = 18 + rnd() * 34;
    const bh = 26 + rnd() * 60;
    ctx.fillRect(bx, 468 - bh, bw, bh);
    for (let wy = 468 - bh + 6; wy < 460; wy += 10) {
      if (rnd() > 0.55) {
        ctx.fillStyle = "#ffd576";
        ctx.fillRect(bx + 4 + Math.floor(rnd() * 2) * 9, wy, 3, 3);
        ctx.fillStyle = "#233062";
      }
    }
    bx += bw + 8;
  }

  // árvores mortas
  [-300, 420, 1180, 1550, 1900].forEach((tx) => deadTree(ctx, tx, 700, 0.8 + rnd() * 0.5, rnd));

  // lápides & capelas
  for (let i = 0, gx = X0 + 60; gx < X1 - 40; i++, gx += 168 + rnd() * 30) {
    const gy = 720;
    if (rnd() > 0.55) tomb(ctx, gx, gy, 0.8 + rnd() * 0.5, rnd);
    else chapel(ctx, gx, gy, 0.9 + rnd() * 0.4);
  }
}

function constMountains(ctx, rnd) {
  const peaks = [
    [-260, 700, 260, 460],
    [100, 700, 350, 420],
    [520, 700, 300, 470],
    [860, 700, 380, 430],
    [1280, 700, 300, 460],
    [1680, 700, 340, 440],
  ];
  peaks.forEach(([cx0, base, hw, hh]) => {
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(cx0 - hw, base);
      ctx.lineTo(cx0, base - hh);
      ctx.lineTo(cx0 + hw, base);
      ctx.closePath();
    };
    ctx.fillStyle = "#7f74d0";
    path();
    ctx.fill();
    // neve recortada dentro da montanha
    ctx.save();
    path();
    ctx.clip();
    ctx.fillStyle = "#dcd6ff";
    ctx.beginPath();
    ctx.moveTo(cx0 - hw * 0.34, base - hh + 44);
    ctx.lineTo(cx0 - 6, base - hh - 10);
    ctx.lineTo(cx0 + hw * 0.3, base - hh + 44);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#7f74d0";
    ctx.beginPath();
    ctx.moveTo(cx0 - hw * 0.18, base - hh + 46);
    ctx.quadraticCurveTo(cx0, base - hh + 12, cx0 + hw * 0.14, base - hh + 46);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
}

function deadTree(ctx, x, y, s, rnd) {
  ctx.strokeStyle = "#6d5496";
  ctx.lineCap = "round";
  const branch = (bx, by, ang, len, w) => {
    const ex = bx + Math.cos(ang) * len;
    const ey = by + Math.sin(ang) * len;
    capsule(ctx, bx, by, ex, ey, w);
    if (len > 18) {
      branch(ex, ey, ang - 0.5 - rnd() * 0.4, len * 0.62, w * 0.65);
      branch(ex, ey, ang + 0.5 + rnd() * 0.4, len * 0.6, w * 0.65);
    }
  };
  ctx.lineWidth = 5;
  capsule(ctx, x, y, x + 30, y - 20, 5);
  branch(x, y, -Math.PI / 2 + 0.25, 105 * s, 17);
  branch(x, y, -Math.PI / 2 - 0.35, 80 * s, 14);
}

function tomb(ctx, x, y, s, rnd) {
  ctx.fillStyle = "#4c5bb5";
  rr(ctx, x - 26 * s, y - 78 * s, 52 * s, 78 * s, 24 * s);
  ctx.fill();
  ctx.fillStyle = "#5d6cc7";
  rr(ctx, x - 19 * s, y - 70 * s, 38 * s, 62 * s, 18 * s);
  ctx.fill();
  ctx.fillStyle = "#dfe8ff";
  ctx.font = `bold ${Math.floor(30 * s)}px serif`;
  ctx.fillText("†", x - 9 * s, y - 32 * s);
  // vela
  candle(ctx, x + 42 * s, y - 4, 1);
}

function chapel(ctx, x, y, s) {
  ctx.fillStyle = "#24408e";
  ctx.fillRect(x - 55 * s, y - 130 * s, 110 * s, 130 * s);
  ctx.beginPath();
  ctx.moveTo(x - 62 * s, y - 130 * s);
  ctx.lineTo(x, y - 168 * s);
  ctx.lineTo(x + 62 * s, y - 130 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#3a5cc0";
  rr(ctx, x - 16 * s, y - 96 * s, 32 * s, 96 * s, 10 * s);
  ctx.fill();
  ctx.fillStyle = "#ffd576";
  ctx.font = `bold ${Math.floor(26 * s)}px sans-serif`;
  ctx.fillText("+", x - 9 * s, y - 140 * s);
}

function candle(ctx, x, y, s) {
  ctx.fillStyle = "#8d97d8";
  rr(ctx, x - 9 * s, y - 24 * s, 18 * s, 24 * s, 4 * s);
  ctx.fill();
  ctx.fillStyle = "#ffd576";
  ctx.beginPath();
  ctx.ellipse(x, y - 32 * s, 5 * s, 9 * s, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = "#fff6c9";
  ctx.beginPath();
  ctx.ellipse(x, y - 30 * s, 2.5 * s, 5 * s, 0, 0, 7);
  ctx.fill();
}

/* ---------- chão ---------- */
export function drawGroundOn(bctx, arena, surf, rnd) {
  // corpo
  bctx.fillStyle = arena === "city" ? "#1f7a70" : "#28b97f";
  bctx.beginPath();
  bctx.moveTo(X0, H);
  for (const p of surf) bctx.lineTo(p.x, p.y);
  bctx.lineTo(X1, H);
  bctx.closePath();
  bctx.fill();

  // faixa de topo borbulhante
  bctx.fillStyle = arena === "city" ? "#63d9ab" : "#46e39a";
  bctx.beginPath();
  bctx.moveTo(X0, H);
  bctx.lineTo(X0, surf[0].y);
  for (let i = 0; i < surf.length - 1; i++) {
    const a = surf[i], b = surf[i + 1];
    const steps = Math.max(2, Math.floor((b.x - a.x) / 34));
    for (let sI = 0; sI < steps; sI++) {
      const t = sI / steps;
      const gx = a.x + (b.x - a.x) * t;
      const gy = a.y + (b.y - a.y) * t;
      const r = 8 + rnd() * 14;
      bctx.arc(gx, gy + 4, r, Math.PI, 0);
      bctx.lineTo(gx + 34, gy + 4);
    }
  }
  bctx.lineTo(X1, surf[surf.length - 1].y);
  bctx.lineTo(X1, H);
  bctx.closePath();
  bctx.fill();

  // tijolos
  bctx.strokeStyle = "rgba(0,0,0,0.14)";
  bctx.lineWidth = 3;
  const bh = 34;
  const yTop = 620;
  for (let row = 0; row * bh < H - yTop; row++) {
    const y = yTop + row * bh;
    if (y > H) break;
    const off = row % 2 ? 36 : 0;
    bctx.beginPath();
    for (let bx = X0 - 52 + off; bx < X1 + 60; bx += 72) {
      bctx.moveTo(bx, Math.max(y, minSurfY(surf, bx)));
      bctx.lineTo(bx, y + bh);
    }
    bctx.stroke();
    if (y > 0) {
      bctx.beginPath();
      bctx.moveTo(X0, y);
      bctx.lineTo(X1, y);
      bctx.stroke();
    }
  }
  // tela sombra superior
  const shade = bctx.createLinearGradient(0, yTop - 40, 0, H);
  shade.addColorStop(0, "rgba(0,0,0,0.06)");
  shade.addColorStop(1, "rgba(0,0,0,0.28)");
  bctx.fillStyle = shade;
  bctx.fillRect(X0, yTop - 40, X1 - X0, H);
}

function minSurfY(surf, x) {
  if (x <= surf[0].x) return surf[0].y - 20;
  for (let i = 0; i < surf.length - 1; i++) {
    if (x >= surf[i].x && x <= surf[i + 1].x) {
      const t = (x - surf[i].x) / (surf[i + 1].x - surf[i].x);
      return surf[i].y + (surf[i + 1].y - surf[i].y) * t - 20;
    }
  }
  return surf[surf.length - 1].y - 20;
}

/* landscape completo pré-renderizado (canvas estendido X0..X1) */
export function renderArena(arenaId, seed, surf) {
  const c = document.createElement("canvas");
  c.width = X1 - X0;
  c.height = H + 300;
  const bctx = c.getContext("2d");
  bctx.translate(-X0, -(-150));
  const rnd = mulberry32(seed);
  if (arenaId === "city") buildCity(bctx, rnd);
  else buildGraveyard(bctx, rnd);
  // props dianteiros do cemitério: cercas
  if (arenaId === "graveyard") {
    bctx.fillStyle = "#7a6ab8";
    for (let fx = X0; fx < X1; fx += 46) bctx.fillRect(fx, 724, 6, 42);
    bctx.fillRect(X0, 736, X1 - X0, 8);
  }
  drawGroundOn(bctx, arenaId, surf, rnd);
  if (arenaId === "graveyard") {
    // velas no chão
    [-320, 170, 520, 900, 1290, 1700].forEach((cx0) => {
      candle(bctx, cx0, surfYAt(surf, cx0) + 6, 0.9);
    });
  }
  return { canvas: c, dx: X0, dy: -150 };
}

export function surfYAt(surf, x) {
  for (let i = 0; i < surf.length - 1; i++) {
    if (x <= surf[i + 1].x) {
      const t = (x - surf[i].x) / (surf[i + 1].x - surf[i].x || 1);
      return surf[i].y + (surf[i + 1].y - surf[i].y) * t;
    }
  }
  return surf[surf.length - 1].y;
}

/* ============ PERSONAGENS ============ */

export function drawFighter(ctx, heroId, o) {
  const hero = HEROES[heroId];
  const {
    x = 0, y = 0, facing = 1, t = 0, armAngle = 0, weapon = null,
    squash = 1, lean = 0, fear = false,
  } = o;
  const f = facing;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(f, 1);
  ctx.rotate(lean * f);
  ctx.scale(1 / squash, squash);

  const breathe = Math.sin(t * 2.6) * 1.6;
  const skin = hero.skin, dark = hero.skinDark;
  const pants = hero.pants, boots = hero.boots, top = hero.top;

  // ---- pernas
  const hipY = -44 + breathe * 0.4;
  ctx.strokeStyle = pants;
  capsule(ctx, -12, hipY, -20, -14, 15);
  capsule(ctx, 12, hipY, 20, -14, 15);
  // botas
  ctx.fillStyle = boots;
  rr(ctx, -32, -13, 30, 14, 6); ctx.fill();
  rr(ctx, 12, -13, 30, 14, 6); ctx.fill();

  // ---- torso
  const chestY = -86 + breathe;
  ctx.strokeStyle = top;
  capsule(ctx, 0, hipY, 0, chestY, 44);
  ctx.strokeStyle = dark;
  ctx.globalAlpha = 0.35;
  capsule(ctx, -12, hipY + 12, 10, chestY + 8, 8);
  ctx.globalAlpha = 1;

  // detalhes específicos
  if (heroId === "brutus") {
    ctx.strokeStyle = "#d1a545";
    capsule(ctx, -16, chestY + 6, 18, hipY - 4, 9);
    ctx.fillStyle = "#d1a545";
    for (let i = 0; i < 4; i++) {
      const tt = i / 4;
      const px = -16 + (18 - -16) * tt + 17 * 0;
      const py = chestY + 6 + (hipY - 4 - chestY - 6) * tt;
      ctx.beginPath();
      ctx.arc(px + 4, py, 3, 0, 7);
      ctx.fill();
    }
  }
  if (heroId === "zking") {
    ctx.fillStyle = "#7a5a2e";
    ctx.fillRect(-24, hipY - 10, 48, 12);
  }

  // ---- braço traseiro (balança)
  const swing = Math.sin(t * 2.6) * 6;
  ctx.strokeStyle = dark;
  capsule(ctx, -14, chestY + 3, -26, chestY + 26 + swing, 12);

  // ---- cabeça
  const headY = chestY - 24;
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(2, headY, 17, 0, 7);
  ctx.fill();
  // orelha
  ctx.beginPath();
  ctx.arc(-10, headY + 2, 4.5, 0, 7);
  ctx.fill();
  // face
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(9, headY - 2, 4.4, 3.2, 0, 0, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(27, headY - 2, 4.4, 3.2, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = "#1d2430";
  ctx.beginPath();
  ctx.arc(10.4, headY - 2, 1.9, 0, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(28.4, headY - 2, 1.9, 0, 7);
  ctx.fill();
  // sobrancelha brava
  ctx.strokeStyle = "#1d2430";
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(5, headY - 10);
  ctx.lineTo(13, headY - 7);
  ctx.moveTo(23, headY - 7);
  ctx.lineTo(31, headY - 9);
  ctx.stroke();
  // boca
  ctx.strokeStyle = "#1d2430";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  if (fear) ctx.arc(18, headY + 8, 3.4, 0, 7);
  else {
    ctx.moveTo(10, headY + 9);
    ctx.lineTo(26, headY + 7);
  }
  ctx.stroke();

  // cabelo/chapéu
  drawHair(ctx, hero, heroId, headY);

  // ---- braço da arma
  drawArmWeapon(ctx, heroId, hero, chestY, armAngle, weapon, t);

  ctx.restore();
}

function drawHair(ctx, hero, heroId, headY) {
  const skin = hero.skin, dark = hero.skinDark;
  switch (hero.hair) {
    case "bandana":
      ctx.fillStyle = "#1d2430";
      ctx.beginPath();
      ctx.arc(2, headY - 5, 17, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = hero.accent;
      ctx.beginPath();
      ctx.ellipse(2, headY - 7, 18, 8, 0, Math.PI, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-13, headY - 8);
      ctx.lineTo(-26, headY - 14);
      ctx.lineTo(-22, headY - 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#1d2430";
      // topete
      ctx.beginPath();
      ctx.arc(-2, headY - 15, 8, Math.PI * 0.15, Math.PI * 1.05);
      ctx.arc(3, headY - 13, 7, Math.PI * 0.1, Math.PI * 1.1);
      ctx.fill();
      break;
    case "ponytail":
      ctx.fillStyle = "#20242e";
      ctx.beginPath();
      ctx.arc(2, headY - 6, 17, Math.PI + 0.4, -0.4);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-18, headY - 2, 14, 6, 0.5, 0, 7);
      ctx.fill();
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(2, headY - 3, 15, Math.PI * 0.4, Math.PI, true);
      ctx.fill();
      ctx.fillStyle = "#20242e";
      ctx.beginPath();
      ctx.ellipse(2, headY - 12, 15, 6, 0, Math.PI, 0);
      ctx.fill();
      break;
    case "hood":
      ctx.fillStyle = hero.top;
      ctx.beginPath();
      ctx.arc(1, headY - 1, 19, Math.PI * 0.62, Math.PI * 1.88);
      ctx.lineTo(1, headY - 30);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#1d2430";
      ctx.beginPath();
      ctx.ellipse(2, headY - 20, 17, 7, 0, Math.PI, 0);
      ctx.fill();
      break;
    case "crown":
      ctx.fillStyle = hero.accent;
      ctx.beginPath();
      ctx.moveTo(-12, headY - 20);
      ctx.lineTo(-12, headY - 34);
      ctx.lineTo(-5, headY - 25);
      ctx.lineTo(2, headY - 36);
      ctx.lineTo(9, headY - 25);
      ctx.lineTo(16, headY - 34);
      ctx.lineTo(16, headY - 18);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#1d2430";
      ctx.beginPath();
      ctx.arc(2, headY - 6, 15.5, Math.PI, 0);
      ctx.fill();
      break;
  }
}

function drawArmWeapon(ctx, heroId, hero, chestY, armAngle, weapon, t) {
  const skin = hero.skin;
  const sx = 12, sy = chestY + 4;
  ctx.strokeStyle = skin;
  const reach = 26;
  const hx = sx + Math.cos(armAngle) * reach;
  const hy = sy + Math.sin(armAngle) * reach;
  capsule(ctx, sx, sy, hx, hy, 12.5);
  // punho
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(hx, hy, 5.5, 0, 7);
  ctx.fill();
  if (weapon) drawWeapon(ctx, hero.weaponId, hx, hy, armAngle, weapon.spin || 0);
}

/* ---------- armas ---------- */
export function drawWeapon(ctx, id, x, y, ang, spinDeg) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  if (spinDeg) ctx.rotate((spinDeg * Math.PI) / 180);
  switch (id) {
    case "tomahawk": {
      ctx.fillStyle = "#7a4a1f";
      rr(ctx, -12, -4.5, 54, 9, 4.5); ctx.fill();
      ctx.fillStyle = "#4c2c12";
      rr(ctx, -12, -4.5, 54, 3.4, 2); ctx.fill();
      // lâmina curva
      ctx.fillStyle = "#e8edf2";
      ctx.beginPath();
      ctx.moveTo(30, 3);
      ctx.quadraticCurveTo(27, -14, 36, -27);
      ctx.lineTo(58, -30);
      ctx.quadraticCurveTo(66, -16, 60, 3);
      ctx.quadraticCurveTo(48, 5, 38, 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#b7c4cd";
      ctx.beginPath();
      ctx.moveTo(50, 0);
      ctx.quadraticCurveTo(54, -16, 55, -27);
      ctx.quadraticCurveTo(62, -18, 58, -2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#e75d34";
      ctx.beginPath();
      ctx.arc(20, 0, 6.5, 0, 7);
      ctx.fill();
      break;
    }
    case "spear": {
      ctx.fillStyle = "#7a4c22";
      rr(ctx, -14, -3, 74, 6, 3); ctx.fill();
      ctx.fillStyle = "#e8edf2";
      ctx.beginPath();
      ctx.moveTo(58, -7);
      ctx.lineTo(84, 0);
      ctx.lineTo(58, 7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ff5470";
      ctx.beginPath();
      ctx.moveTo(48, -4);
      ctx.lineTo(58, 0);
      ctx.lineTo(48, 4);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "kunai": {
      ctx.fillStyle = "#3a4653";
      rr(ctx, 0, -2.5, 15, 5, 2); ctx.fill();
      ctx.fillStyle = "#e8edf2";
      ctx.beginPath();
      ctx.moveTo(14, -6);
      ctx.lineTo(34, 0);
      ctx.lineTo(14, 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#8d97d8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-5, 0, 4.5, 0, 7);
      ctx.stroke();
      break;
    }
    case "bone": {
      ctx.fillStyle = "#f2ead9";
      capsule(ctx, -6, -4, 34, 4, 8);
      ctx.beginPath();
      ctx.arc(34, -6, 6.5, 0, 7); ctx.arc(-6, 6, 6.5, 0, 7);
      ctx.arc(-8, -4, 6.5, 0, 7); ctx.arc(35, 5, 6.5, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#d8cdb6";
      ctx.beginPath();
      ctx.arc(-6, 6, 3, 0, 7); ctx.fill();
      break;
    }
  }
  ctx.restore();
}

/* ============ HUD (barras, avatares) ============ */

export function drawHudBar(ctx, fx) {
  const cx0 = W / 2;
  for (const side of [0, 1]) {
    const f = fx[side];
    const px = side === 0 ? 430 : 1170;
    // avatar circle
    ctx.save();
    ctx.translate(px, 86);
    const gradient = ctx.createLinearGradient(-38, -38, 38, 38);
    gradient.addColorStop(0, f.hero.accent);
    gradient.addColorStop(1, "#2c1a55");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, 7);
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    // mini busto (recortado no círculo)
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, 41.5, 0, 7);
    ctx.clip();
    ctx.scale(0.72, 0.72);
    drawBust(ctx, f.heroId);
    ctx.restore();
    ctx.restore();

    // barra
    const bw = 262;
    const bx = side === 0 ? px + 54 : px - 54 - bw;
    const by = 52, bh = 60;
    // fundo
    const grad = ctx.createLinearGradient(0, by, 0, by + bh);
    grad.addColorStop(0, "#7a2ea0");
    grad.addColorStop(1, "#5c1f7e");
    ctx.fillStyle = grad;
    rr(ctx, bx, by, bw, bh, 30);
    ctx.fill();
    // preenchimento
    const frac = f.hp / 100;
    if (frac > 0.02) {
      ctx.save();
      rr(ctx, bx + 5, by + 5, bw - 10, bh - 10, 25);
      ctx.clip();
      const g2 = ctx.createLinearGradient(0, by, 0, by + bh);
      g2.addColorStop(0, "#ff96d2");
      g2.addColorStop(0.4, "#f0417e");
      g2.addColorStop(1, "#d31d6b");
      ctx.fillStyle = g2;
      // enche a partir do lado do avatar (borda externa), esvazia para o centro
      if (side === 0) ctx.fillRect(bx + 5, by, (bw - 10) * frac, bh);
      else ctx.fillRect(bx + bw - 5 - (bw - 10) * frac, by, (bw - 10) * frac, bh);
      ctx.fillStyle = "rgba(255,255,255,0.32)";
      if (side === 0) ctx.fillRect(bx + 5, by + 5, (bw - 10) * frac, 16);
      else ctx.fillRect(bx + bw - 5 - (bw - 10) * frac, by + 5, (bw - 10) * frac, 16);
      ctx.restore();
    }
    // moldura
    ctx.strokeStyle = "#4b1f66";
    ctx.lineWidth = 4;
    rr(ctx, bx, by, bw, bh, 30);
    ctx.stroke();
  }

  // emblema no centro: setas cruzadas
  const bx0 = cx0 - 42, by0 = 16;
  ctx.save();
  ctx.translate(bx0 + 42, by0 + 42);
  const bg = ctx.createLinearGradient(0, -40, 0, 40);
  bg.addColorStop(0, "#8d6fe0");
  bg.addColorStop(1, "#54409f");
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(0, 0, 42, 0, 7);
  ctx.fill();
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();
  // setas cruzadas
  const arrow = (a) => {
    ctx.save();
    ctx.rotate(a);
    ctx.strokeStyle = "#ffd23f";
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.lineTo(22, 0);
    ctx.stroke();
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(24, -8);
    ctx.moveTo(16, 0);
    ctx.lineTo(24, 8);
    ctx.moveTo(-16, 0);
    ctx.lineTo(-24, -8);
    ctx.moveTo(-16, 0);
    ctx.lineTo(-24, 8);
    ctx.stroke();
    ctx.restore();
  };
  arrow(-Math.PI / 4);
  arrow(Math.PI / 4);
  ctx.restore();
}

function drawBust(ctx, heroId) {
  ctx.save();
  drawFighter(ctx, heroId, {
    x: -3, y: 56, facing: 1, t: 0, armAngle: 1.15, weapon: { spin: -50 },
  });
  ctx.restore();
}

/* ============ retratos (loja) ============ */

export function renderPortrait(heroId, w = 236, h = 296) {
  const hero = HEROES[heroId];
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const bctx = c.getContext("2d");
  const g = bctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#6be3a2");
  g.addColorStop(1, "#3fae7c");
  if (heroId === "shogun") {
    g.addColorStop(0, "#9b7ae0");
    g.addColorStop(1, "#5d3fb2");
  }
  if (heroId === "venom") {
    g.addColorStop(0, "#63c7f7");
    g.addColorStop(1, "#3a8ec9");
  }
  if (heroId === "zking") {
    g.addColorStop(0, "#8ce06b");
    g.addColorStop(1, "#4e9e3a");
  }
  bctx.fillStyle = g;
  bctx.fillRect(0, 0, w, h);
  // chão
  bctx.fillStyle = "rgba(0,0,0,0.18)";
  bctx.fillRect(0, h - 34, w, 34);
  bctx.save();
  bctx.translate(w / 2, h - 26);
  bctx.scale(1.35, 1.35);
  bctx.translate(-12, 0);
  drawFighter(bctx, heroId, { x: 0, y: 0, facing: 1, t: 1.2, armAngle: 1.1, weapon: { spin: -40 } });
  bctx.restore();
  return c;
}
