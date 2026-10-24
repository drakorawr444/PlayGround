import { clamp, lerp, rgba, roundRect, shade } from './utils.js';

export const HEROES = [
  {
    id: 'arnold',
    name: 'ARNOLD',
    title: 'Ranger',
    titlePt: 'Patrulheiro',
    weapon: 'tomahawk',
    style: 'ranger',
    skin: '#8b5738',
    skinDark: '#6d4228',
    hair: '#211914',
    line: '#231913',
    shirt: '#77713f',
    shirtDark: '#57532c',
    pants: '#6b4d2c',
    pantsDark: '#503821',
    shoe: '#3a281c',
    accent: '#e03744',
    accent2: '#ffd23f',
    blood: '#b83440',
    cardA: '#529373',
    cardB: '#1d4b3b',
  },
  {
    id: 'kira',
    name: 'KIRA',
    title: 'Archer',
    titlePt: 'Arqueira',
    weapon: 'bow',
    style: 'archer',
    skin: '#efc09b',
    skinDark: '#d29b72',
    hair: '#2c1b16',
    line: '#2a1a16',
    shirt: '#2f8f80',
    shirtDark: '#1f6b61',
    pants: '#4c3c33',
    pantsDark: '#382b24',
    shoe: '#2c211b',
    accent: '#ffd23f',
    accent2: '#f07b3d',
    blood: '#c93a4b',
    cardA: '#4e9d8c',
    cardB: '#184b45',
  },
  {
    id: 'boom',
    name: 'BOOM',
    title: 'Demolitionist',
    titlePt: 'Demolidor',
    weapon: 'grenade',
    style: 'bomber',
    skin: '#b9744d',
    skinDark: '#955734',
    hair: '#ff7a2f',
    line: '#2b1a12',
    shirt: '#2c313e',
    shirtDark: '#1f2430',
    pants: '#4a4d58',
    pantsDark: '#353842',
    shoe: '#27241f',
    accent: '#ffd23f',
    accent2: '#ff7a2f',
    blood: '#c23a3a',
    cardA: '#a97a4e',
    cardB: '#4c2f1f',
  },
];

export const VILLAINS = [
  {
    id: 'zumbi',
    name: 'ZUMBI',
    title: 'Undead',
    titlePt: 'Morto-vivo',
    weapon: 'shuriken',
    style: 'zombie',
    skin: '#87bd5f',
    skinDark: '#649a45',
    hair: '#2e3a22',
    line: '#26331c',
    shirt: '#6e4c85',
    shirtDark: '#533a66',
    pants: '#4a4036',
    pantsDark: '#362f27',
    shoe: '#2d2a22',
    accent: '#b7ff6b',
    accent2: '#ff6d8a',
    blood: '#77c24a',
    cardA: '#6e8f52',
    cardB: '#2e452c',
  },
  {
    id: 'barba',
    name: 'BARBA',
    title: 'Pirate',
    titlePt: 'Pirata',
    weapon: 'cannonball',
    style: 'pirate',
    skin: '#d9a27e',
    skinDark: '#b77a58',
    hair: '#7d3225',
    line: '#301b17',
    shirt: '#f2e7d2',
    shirtDark: '#d6c7ab',
    pants: '#3a3d52',
    pantsDark: '#2a2d3e',
    shoe: '#2a231e',
    accent: '#b5323e',
    accent2: '#ffd23f',
    blood: '#b83440',
    cardA: '#a5544f',
    cardB: '#4b2325',
  },
  {
    id: 'unidade7',
    name: 'UNIDADE 7',
    title: 'Machine',
    titlePt: 'Máquina',
    weapon: 'rocket',
    style: 'robot',
    skin: '#a9b6c1',
    skinDark: '#7d8b97',
    hair: '#5b6975',
    line: '#26313a',
    shirt: '#5f7381',
    shirtDark: '#465964',
    pants: '#3f4f59',
    pantsDark: '#2f3d46',
    shoe: '#2b363e',
    accent: '#4fe4ff',
    accent2: '#ffd23f',
    blood: '#4fe4ff',
    cardA: '#5c7e91',
    cardB: '#263c4b',
  },
];

export const ALL_CHARACTERS = [...HEROES, ...VILLAINS];

function solveIK(ax, ay, bx, by, l1, l2, bend) {
  let dx = bx - ax;
  let dy = by - ay;
  let d = Math.hypot(dx, dy);
  d = clamp(d, Math.abs(l1 - l2) + 0.01, l1 + l2 - 0.01);
  const base = Math.atan2(dy, dx);
  const cosA = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
  const a = Math.acos(cosA);
  const angle = base + bend * a;
  return {
    x: ax + Math.cos(angle) * l1,
    y: ay + Math.sin(angle) * l1,
    ex: bx,
    ey: by,
  };
}

function outline(ctx, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

function drawLimb(ctx, a, b, c, width, color, line) {
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.strokeStyle = line;
  ctx.lineWidth = width + 4;
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function drawShoe(ctx, x, y, color, line, flip = 1, big = 1) {
  ctx.save();
  ctx.translate(x, y - 1);
  roundRect(ctx, -9, -7, 25 * big, 11, 5);
  ctx.fillStyle = color;
  ctx.fill();
  outline(ctx, line, 2.5);
  ctx.restore();
}

function torsoPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(-16, 4);
  ctx.quadraticCurveTo(-22, -18, -20, -46);
  ctx.quadraticCurveTo(-18, -60, 0, -62);
  ctx.quadraticCurveTo(18, -60, 20, -46);
  ctx.quadraticCurveTo(22, -18, 16, 4);
  ctx.closePath();
}

function drawTorso(ctx, hero, hip, angle) {
  ctx.save();
  ctx.translate(hip.x, hip.y);
  ctx.rotate(angle);
  ctx.lineJoin = 'round';

  if (hero.style === 'robot') {
    torsoPath(ctx);
    ctx.fillStyle = hero.shirt;
    ctx.fill();
    outline(ctx, hero.line, 3);
    roundRect(ctx, -12, -46, 24, 32, 7);
    ctx.fillStyle = hero.shirtDark;
    ctx.fill();
    outline(ctx, hero.line, 2);
    ctx.beginPath();
    ctx.arc(0, -30, 6, 0, Math.PI * 2);
    ctx.fillStyle = hero.accent;
    ctx.fill();
    outline(ctx, hero.line, 2);
    ctx.beginPath();
    ctx.moveTo(-16, -14);
    ctx.lineTo(16, -14);
    ctx.strokeStyle = hero.line;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (hero.style === 'zombie') {
    torsoPath(ctx);
    ctx.fillStyle = hero.skin;
    ctx.fill();
    outline(ctx, hero.line, 3);
    ctx.beginPath();
    ctx.moveTo(-17, -42);
    ctx.quadraticCurveTo(-6, -50, 4, -43);
    ctx.lineTo(0, -26);
    ctx.lineTo(12, -20);
    ctx.lineTo(5, -5);
    ctx.lineTo(-10, -8);
    ctx.closePath();
    ctx.fillStyle = hero.shirt;
    ctx.fill();
    outline(ctx, hero.line, 2);
    ctx.beginPath();
    ctx.moveTo(-15, -30);
    ctx.lineTo(-7, -30);
    ctx.moveTo(-13, -24);
    ctx.lineTo(-4, -24);
    ctx.strokeStyle = hero.skinDark;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (hero.style === 'archer') {
    torsoPath(ctx);
    ctx.fillStyle = hero.shirt;
    ctx.fill();
    outline(ctx, hero.line, 3);
    ctx.beginPath();
    ctx.moveTo(-14, 2);
    ctx.lineTo(-15, -48);
    ctx.quadraticCurveTo(0, -56, 15, -48);
    ctx.lineTo(14, 2);
    ctx.closePath();
    ctx.fillStyle = hero.shirtDark;
    ctx.fill();
    outline(ctx, hero.line, 2);
    ctx.beginPath();
    ctx.moveTo(-16, -42);
    ctx.lineTo(14, -10);
    ctx.strokeStyle = '#c79a5b';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.strokeStyle = hero.line;
    ctx.lineWidth = 7.5;
    ctx.globalAlpha = 0.25;
    ctx.stroke();
    ctx.globalAlpha = 1;
    roundRect(ctx, -16, -8, 32, 10, 4);
    ctx.fillStyle = '#5a3f2a';
    ctx.fill();
    outline(ctx, hero.line, 2);
    ctx.restore();
    return;
  }

  if (hero.style === 'pirate') {
    torsoPath(ctx);
    ctx.fillStyle = hero.shirt;
    ctx.fill();
    outline(ctx, hero.line, 3);
    ctx.beginPath();
    ctx.moveTo(-18, -54);
    ctx.quadraticCurveTo(-28, -30, -22, -2);
    ctx.lineTo(-8, 2);
    ctx.lineTo(-10, -48);
    ctx.closePath();
    ctx.fillStyle = hero.accent;
    ctx.fill();
    outline(ctx, hero.line, 2.5);
    ctx.beginPath();
    ctx.moveTo(18, -54);
    ctx.quadraticCurveTo(28, -30, 22, -2);
    ctx.lineTo(8, 2);
    ctx.lineTo(10, -48);
    ctx.closePath();
    ctx.fillStyle = hero.accent;
    ctx.fill();
    outline(ctx, hero.line, 2.5);
    ctx.beginPath();
    ctx.moveTo(-17, -34);
    ctx.lineTo(17, -16);
    ctx.strokeStyle = hero.accent2;
    ctx.lineWidth = 6;
    ctx.stroke();
    roundRect(ctx, -17, -8, 34, 11, 4);
    ctx.fillStyle = '#432f20';
    ctx.fill();
    outline(ctx, hero.line, 2);
    ctx.beginPath();
    ctx.arc(0, -2, 4, 0, Math.PI * 2);
    ctx.fillStyle = hero.accent2;
    ctx.fill();
    outline(ctx, hero.line, 2);
    ctx.restore();
    return;
  }

  if (hero.style === 'bomber') {
    torsoPath(ctx);
    ctx.fillStyle = hero.shirt;
    ctx.fill();
    outline(ctx, hero.line, 3);
    ctx.beginPath();
    ctx.moveTo(-13, -56);
    ctx.lineTo(-8, 2);
    ctx.moveTo(13, -56);
    ctx.lineTo(8, 2);
    ctx.strokeStyle = hero.shirtDark;
    ctx.lineWidth = 3;
    ctx.stroke();
    roundRect(ctx, -17, -8, 34, 11, 4);
    ctx.fillStyle = '#3a2b23';
    ctx.fill();
    outline(ctx, hero.line, 2);
    ctx.beginPath();
    ctx.moveTo(-6, -44);
    ctx.lineTo(6, -44);
    ctx.strokeStyle = hero.accent;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
    return;
  }

  torsoPath(ctx);
  ctx.fillStyle = hero.skin;
  ctx.fill();
  outline(ctx, hero.line, 3);

  ctx.beginPath();
  ctx.moveTo(-18, -50);
  ctx.quadraticCurveTo(-24, -24, -16, 2);
  ctx.lineTo(-7, 4);
  ctx.lineTo(-6, -52);
  ctx.closePath();
  ctx.fillStyle = hero.shirt;
  ctx.fill();
  outline(ctx, hero.line, 2);

  ctx.beginPath();
  ctx.moveTo(18, -50);
  ctx.quadraticCurveTo(24, -24, 16, 2);
  ctx.lineTo(7, 4);
  ctx.lineTo(6, -52);
  ctx.closePath();
  ctx.fillStyle = hero.shirt;
  ctx.fill();
  outline(ctx, hero.line, 2);

  ctx.beginPath();
  ctx.moveTo(-16, -46);
  ctx.lineTo(14, -6);
  ctx.strokeStyle = hero.shirtDark;
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.strokeStyle = hero.accent2;
  ctx.setLineDash([3, 7]);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]);

  roundRect(ctx, -17, -9, 34, 12, 4);
  ctx.fillStyle = hero.pantsDark;
  ctx.fill();
  outline(ctx, hero.line, 2);
  roundRect(ctx, -5, -9, 10, 9, 2);
  ctx.fillStyle = hero.accent2;
  ctx.fill();
  outline(ctx, hero.line, 1.5);
  ctx.restore();
}

function drawHeadBack(ctx, hero, head) {
  ctx.save();
  ctx.translate(head.x, head.y);
  if (hero.style === 'ranger') {
    ctx.fillStyle = hero.hair;
    const blobs = [
      [-15, -14, 17],
      [-6, -24, 17],
      [8, -24, 16],
      [18, -12, 14],
      [-18, 0, 13],
      [13, 3, 12],
      [-2, -30, 13],
    ];
    for (const [x, y, r] of blobs) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (hero.style === 'archer') {
    ctx.beginPath();
    ctx.arc(-3, 0, 31, 0, Math.PI * 2);
    ctx.fillStyle = hero.shirtDark;
    ctx.fill();
    outline(ctx, hero.line, 3);
    ctx.save();
    ctx.translate(-22, 18);
    ctx.rotate(0.45);
    roundRect(ctx, -6, 0, 12, 54, 6);
    ctx.fillStyle = hero.accent2;
    ctx.fill();
    outline(ctx, hero.line, 2);
    ctx.restore();
  } else if (hero.style === 'zombie') {
    ctx.fillStyle = hero.hair;
    const blobs = [
      [-14, -16, 10],
      [-20, -4, 8],
      [2, -26, 10],
      [14, -14, 8],
      [-8, -22, 9],
    ];
    for (const [x, y, r] of blobs) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (hero.style === 'pirate') {
    ctx.fillStyle = hero.hair;
    ctx.beginPath();
    ctx.arc(-6, 4, 22, 0, Math.PI * 2);
    ctx.fill();
  } else if (hero.style === 'bomber') {
    ctx.fillStyle = hero.hair;
    ctx.beginPath();
    ctx.moveTo(-20, -12);
    ctx.lineTo(-12, -34);
    ctx.lineTo(-2, -20);
    ctx.lineTo(4, -42);
    ctx.lineTo(12, -22);
    ctx.lineTo(22, -34);
    ctx.lineTo(20, -8);
    ctx.closePath();
    ctx.fill();
    outline(ctx, hero.line, 2.5);
  }
  ctx.restore();
}

function drawHeadFront(ctx, hero, head, opts) {
  const { t = 0, dead = false, hurt = false, blink = false, aiming = false } = opts;
  ctx.save();
  ctx.translate(head.x, head.y);

  if (hero.style === 'robot') {
    roundRect(ctx, -20, -22, 42, 42, 9);
    ctx.fillStyle = hero.skin;
    ctx.fill();
    outline(ctx, hero.line, 3);
    roundRect(ctx, 1, -15, 22, 12, 5);
    ctx.fillStyle = hero.line;
    ctx.fill();
    roundRect(ctx, 3, -13, 18, 8, 3);
    ctx.fillStyle = hero.accent;
    ctx.fill();
    ctx.shadowColor = hero.accent;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(-10, -22);
    ctx.lineTo(-10, -34);
    ctx.strokeStyle = hero.line;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-10, -38, 5, 0, Math.PI * 2);
    ctx.fillStyle = hero.accent2;
    ctx.fill();
    outline(ctx, hero.line, 2);
    ctx.beginPath();
    ctx.moveTo(-10, 14);
    ctx.lineTo(10, 14);
    ctx.strokeStyle = hero.line;
    ctx.lineWidth = 3;
    ctx.stroke();
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.arc(i * 8, 14, 1.6, 0, Math.PI * 2);
      ctx.fillStyle = hero.skinDark;
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  ctx.beginPath();
  ctx.arc(0, 0, 24, 0, Math.PI * 2);
  ctx.fillStyle = hero.skin;
  ctx.fill();
  outline(ctx, hero.line, 3);

  ctx.beginPath();
  ctx.arc(-20, 3, 6, 0, Math.PI * 2);
  ctx.fillStyle = hero.skinDark;
  ctx.fill();
  outline(ctx, hero.line, 2);

  const eyeY = -5;
  const eyeXs = [7, 17];
  for (let i = 0; i < 2; i += 1) {
    const ex = eyeXs[i];
    if (dead) {
      ctx.strokeStyle = hero.line;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(ex - 3, eyeY - 3);
      ctx.lineTo(ex + 3, eyeY + 3);
      ctx.moveTo(ex + 3, eyeY - 3);
      ctx.lineTo(ex - 3, eyeY + 3);
      ctx.stroke();
      continue;
    }
    if (blink || hurt) {
      ctx.strokeStyle = hero.line;
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (hurt) {
        ctx.moveTo(ex - 3, eyeY + 1);
        ctx.lineTo(ex + 3, eyeY - 1);
      } else {
        ctx.moveTo(ex - 3.5, eyeY);
        ctx.lineTo(ex + 3.5, eyeY);
      }
      ctx.stroke();
      continue;
    }
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, 4.6, 5.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#fffdf2';
    ctx.fill();
    outline(ctx, hero.line, 1.2);
    ctx.beginPath();
    ctx.arc(ex + (aiming ? 1.3 : 1), eyeY + 0.3, 2.1, 0, Math.PI * 2);
    ctx.fillStyle = hero.style === 'zombie' ? '#d6ff5e' : '#201713';
    ctx.fill();
  }

  if (hero.style === 'zombie') {
    ctx.beginPath();
    ctx.arc(17, eyeY, 6, 0, Math.PI * 2);
    ctx.strokeStyle = hero.skinDark;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-6, 5);
    ctx.lineTo(21, 8);
    ctx.strokeStyle = hero.line;
    ctx.lineWidth = 3;
    ctx.stroke();
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-2 + i * 6, 4);
      ctx.lineTo(-1 + i * 6, 11);
      ctx.strokeStyle = hero.line;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(4, 13);
    ctx.quadraticCurveTo(9, 16, 14, 13);
    ctx.strokeStyle = hero.line;
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (hero.style === 'pirate') {
    ctx.beginPath();
    ctx.arc(17, -5, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = hero.line;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(17, -5, 6.5, 0, Math.PI * 2);
    ctx.strokeStyle = hero.line;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(10, 12);
    ctx.quadraticCurveTo(18, 16, 23, 9);
    ctx.strokeStyle = hero.line;
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (hero.style === 'bomber') {
    roundRect(ctx, -19, -15, 38, 10, 4);
    ctx.fillStyle = '#3c3227';
    ctx.fill();
    outline(ctx, hero.line, 2);
    ctx.beginPath();
    ctx.arc(8, -10, 5, 0, Math.PI * 2);
    ctx.arc(18, -10, 5, 0, Math.PI * 2);
    ctx.fillStyle = hero.accent2;
    ctx.fill();
    outline(ctx, hero.line, 1.5);
    ctx.beginPath();
    ctx.moveTo(5, 9);
    ctx.quadraticCurveTo(12, 15, 19, 9);
    ctx.strokeStyle = hero.line;
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (hero.style === 'archer') {
    ctx.beginPath();
    ctx.moveTo(4, -20);
    ctx.quadraticCurveTo(14, -27, 23, -12);
    ctx.lineTo(13, -18);
    ctx.closePath();
    ctx.fillStyle = hero.hair;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4, 14);
    ctx.quadraticCurveTo(12, 17, 20, 11);
    ctx.strokeStyle = hero.line;
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (hero.style === 'ranger') {
    ctx.beginPath();
    ctx.moveTo(-21, -8);
    ctx.quadraticCurveTo(-4, -16, 23, -8);
    ctx.lineTo(23, 0);
    ctx.quadraticCurveTo(-4, -7, -21, 1);
    ctx.closePath();
    ctx.fillStyle = hero.accent;
    ctx.fill();
    outline(ctx, hero.line, 2.5);
    ctx.beginPath();
    ctx.moveTo(-18, -2);
    ctx.quadraticCurveTo(-30, 2, -34, 16);
    ctx.quadraticCurveTo(-24, 12, -16, 8);
    ctx.closePath();
    ctx.fillStyle = hero.accent;
    ctx.fill();
    outline(ctx, hero.line, 2);
    ctx.beginPath();
    ctx.moveTo(-19, 0);
    ctx.quadraticCurveTo(-30, 8, -32, 24);
    ctx.quadraticCurveTo(-20, 16, -15, 9);
    ctx.closePath();
    ctx.fillStyle = shade(hero.accent, -0.15);
    ctx.fill();
    outline(ctx, hero.line, 2);
    ctx.beginPath();
    ctx.moveTo(1, 13);
    ctx.quadraticCurveTo(11, 18, 20, 12);
    ctx.strokeStyle = hero.line;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-1, 19, 15, 0.15, Math.PI - 0.15);
    ctx.strokeStyle = rgba(hero.hair, 0.55);
    ctx.lineWidth = 8;
    ctx.stroke();
  }

  if (hero.style === 'pirate') {
    ctx.beginPath();
    ctx.moveTo(-30, -12);
    ctx.quadraticCurveTo(-14, -14, -2, -26);
    ctx.quadraticCurveTo(12, -14, 30, -12);
    ctx.quadraticCurveTo(16, 2, 0, -2);
    ctx.quadraticCurveTo(-16, 2, -30, -12);
    ctx.closePath();
    ctx.fillStyle = '#263346';
    ctx.fill();
    outline(ctx, hero.line, 3);
    ctx.beginPath();
    ctx.moveTo(-28, -11);
    ctx.quadraticCurveTo(0, -8, 28, -11);
    ctx.strokeStyle = hero.accent2;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-19, 10);
    ctx.quadraticCurveTo(-8, 26, 6, 19);
    ctx.quadraticCurveTo(17, 25, 22, 11);
    ctx.quadraticCurveTo(15, 2, 2, 9);
    ctx.quadraticCurveTo(-8, 1, -19, 10);
    ctx.closePath();
    ctx.fillStyle = hero.hair;
    ctx.fill();
    outline(ctx, hero.line, 2.5);
    ctx.beginPath();
    ctx.arc(-23, 8, 3, 0, Math.PI * 2);
    ctx.fillStyle = hero.accent2;
    ctx.fill();
    outline(ctx, hero.line, 1.5);
  }

  if (hero.style === 'ranger') {
    ctx.beginPath();
    ctx.moveTo(4, 11);
    ctx.quadraticCurveTo(11, 15, 18, 10);
    ctx.strokeStyle = hero.line;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.restore();

  if (hero.style === 'bomber') {
    // mohawk sits over the skull cap
  }
}

function drawArm(ctx, shoulder, hand, color, line, bend = 1, width = 12) {
  const elbow = solveIK(shoulder.x, shoulder.y, hand.x, hand.y, 33, 30, bend);
  drawLimb(ctx, shoulder, elbow, hand, width, color, line);
  ctx.beginPath();
  ctx.arc(hand.x, hand.y, width * 0.62, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  outline(ctx, line, 2.5);
  return elbow;
}

export function drawHeldWeapon(ctx, type, hx, hy, angle, t = 0, mode = 'idle', accent = '#ffd23f') {
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(angle);
  const line = '#241a14';

  if (type === 'tomahawk') {
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-26, 0);
    ctx.lineTo(18, 0);
    ctx.strokeStyle = line;
    ctx.lineWidth = 9;
    ctx.stroke();
    ctx.strokeStyle = '#9a6b3b';
    ctx.lineWidth = 5.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(-13, 0);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(12, -4);
    ctx.lineTo(28, -17);
    ctx.quadraticCurveTo(39, -9, 34, 7);
    ctx.lineTo(26, 14);
    ctx.lineTo(13, 6);
    ctx.closePath();
    ctx.fillStyle = '#c9d6dc';
    ctx.fill();
    outline(ctx, line, 3);
    ctx.beginPath();
    ctx.moveTo(22, -10);
    ctx.lineTo(31, -6);
    ctx.strokeStyle = '#f1f7fa';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  } else if (type === 'bow') {
    ctx.beginPath();
    ctx.moveTo(0, -36);
    ctx.quadraticCurveTo(20, 0, 0, 36);
    ctx.strokeStyle = line;
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.strokeStyle = '#a5723b';
    ctx.lineWidth = 4.5;
    ctx.stroke();
    ctx.beginPath();
    if (mode === 'idle') {
      ctx.moveTo(0, -36);
      ctx.lineTo(0, 36);
    } else {
      ctx.moveTo(0, -36);
      ctx.lineTo(-13, 0);
      ctx.lineTo(0, 36);
    }
    ctx.strokeStyle = '#f5f2df';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    if (mode !== 'idle') {
      ctx.beginPath();
      ctx.moveTo(-26, 0);
      ctx.lineTo(38, 0);
      ctx.strokeStyle = line;
      ctx.lineWidth = 4.5;
      ctx.stroke();
      ctx.strokeStyle = '#e8d9b5';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(38, 0);
      ctx.lineTo(28, -7);
      ctx.lineTo(30, 0);
      ctx.lineTo(28, 7);
      ctx.closePath();
      ctx.fillStyle = '#dfe8ec';
      ctx.fill();
      outline(ctx, line, 1.5);
      ctx.beginPath();
      ctx.moveTo(-26, 0);
      ctx.lineTo(-35, -6);
      ctx.lineTo(-35, 6);
      ctx.closePath();
      ctx.fillStyle = accent;
      ctx.fill();
      outline(ctx, line, 1.5);
    }
  } else if (type === 'grenade') {
    ctx.translate(8, 0);
    ctx.beginPath();
    ctx.arc(0, 0, 11.5, 0, Math.PI * 2);
    ctx.fillStyle = '#4d6b44';
    ctx.fill();
    outline(ctx, line, 3);
    ctx.beginPath();
    ctx.moveTo(-8, -2);
    ctx.lineTo(8, -2);
    ctx.moveTo(-8, 3);
    ctx.lineTo(8, 3);
    ctx.strokeStyle = '#334a2e';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-4, -4, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fill();
    roundRect(ctx, -5, -17, 10, 7, 3);
    ctx.fillStyle = '#8d9a85';
    ctx.fill();
    outline(ctx, line, 2);
    ctx.beginPath();
    ctx.arc(6, -15, 4.5, 0, Math.PI * 2);
    ctx.strokeStyle = '#c9c28a';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (type === 'shuriken') {
    ctx.translate(7, 0);
    ctx.rotate(t * 1.5);
    ctx.beginPath();
    for (let i = 0; i < 4; i += 1) {
      const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
      const a2 = a + Math.PI / 4;
      ctx.lineTo(Math.cos(a) * 16, Math.sin(a) * 16);
      ctx.lineTo(Math.cos(a2) * 4, Math.sin(a2) * 4);
    }
    ctx.closePath();
    ctx.fillStyle = '#cfd9dd';
    ctx.fill();
    outline(ctx, line, 2.5);
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = line;
    ctx.fill();
  } else if (type === 'cannonball') {
    ctx.translate(9, 0);
    ctx.beginPath();
    ctx.arc(0, 0, 13.5, 0, Math.PI * 2);
    const g = ctx.createRadialGradient(-5, -6, 2, 0, 0, 14);
    g.addColorStop(0, '#65727a');
    g.addColorStop(0.55, '#2f3a41');
    g.addColorStop(1, '#141b1f');
    ctx.fillStyle = g;
    ctx.fill();
    outline(ctx, '#080d10', 3);
    ctx.beginPath();
    ctx.arc(-4.5, -5, 3.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.32)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(7, -11, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.strokeStyle = '#3b2a12';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(7, -14);
    ctx.quadraticCurveTo(3, -19, 0, -16);
    ctx.stroke();
  } else if (type === 'rocket') {
    ctx.translate(7, 0);
    ctx.beginPath();
    ctx.moveTo(-20, -7);
    ctx.lineTo(8, -8);
    ctx.quadraticCurveTo(27, 0, 8, 8);
    ctx.lineTo(-20, 7);
    ctx.closePath();
    ctx.fillStyle = '#c8d4da';
    ctx.fill();
    outline(ctx, line, 2.5);
    ctx.beginPath();
    ctx.moveTo(8, -8);
    ctx.quadraticCurveTo(27, 0, 8, 8);
    ctx.lineTo(5, 0);
    ctx.closePath();
    ctx.fillStyle = accent;
    ctx.fill();
    outline(ctx, line, 1.8);
    ctx.beginPath();
    ctx.moveTo(-16, -7);
    ctx.lineTo(-25, -15);
    ctx.lineTo(-24, -2);
    ctx.closePath();
    ctx.moveTo(-16, 7);
    ctx.lineTo(-25, 15);
    ctx.lineTo(-24, 2);
    ctx.closePath();
    ctx.fillStyle = '#7c8b93';
    ctx.fill();
    outline(ctx, line, 1.6);
    ctx.beginPath();
    ctx.arc(1, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#4f6270';
    ctx.fill();
    outline(ctx, line, 1.4);
  }
  ctx.restore();
}

export function drawCharacter(ctx, hero, opts = {}) {
  const {
    x = 0,
    y = 0,
    facing = 1,
    t = 0,
    pose = 'idle',
    aimAngle = -Math.PI / 4,
    power = 0.7,
    weapon = hero.weapon,
    showWeapon = true,
    throwT = 0,
    scale = 1,
    rot = 0,
    blink = null,
    seed = 0,
    alpha = 1,
  } = opts;

  const dead = pose === 'dead';
  const hurt = pose === 'hurt';
  const win = pose === 'win';
  const aiming = pose === 'aim' || pose === 'throw';
  const bob = dead ? 0 : Math.sin(t * 2.1 + seed * 4.2) * (aiming ? 1.1 : 2.1);
  const lean = dead ? 0 : hurt ? -7 : win ? 3 : pose === 'throw' ? 7 * Math.sin(clamp(throwT, 0, 1) * Math.PI) : aiming ? -1.5 : 0;

  const hip = { x: 2 + lean * 0.15, y: -86 + bob };
  const shoulder = { x: 2 + lean, y: -138 + bob };
  const head = { x: shoulder.x + 4, y: -164 + bob };
  const torsoAngle = dead ? 0 : hurt ? -0.16 : win ? 0.08 : aiming ? -0.04 : Math.sin(t * 2.1 + seed) * 0.015;

  const localAngle = facing === 1 ? aimAngle : Math.PI - aimAngle;
  const aimDir = { x: Math.cos(localAngle), y: Math.sin(localAngle) };
  const stance = aiming ? 23 : win ? 19 : 16;
  const footL = { x: -stance + (aiming ? 0 : Math.sin(t * 2.1 + seed) * 1.4), y: dead ? -3 : 0 };
  const footR = { x: stance + (aiming ? 6 : Math.sin(t * 2.1 + seed + 1.2) * 1.4), y: dead ? 2 : 0 };

  const kneeL = solveIK(hip.x, hip.y, footL.x, footL.y, 44, 42, -1);
  const kneeR = solveIK(hip.x, hip.y, footR.x, footR.y, 44, 42, -1);

  const shoulderFront = { x: shoulder.x + 13, y: shoulder.y + 11 };
  const shoulderBack = { x: shoulder.x - 11, y: shoulder.y + 13 };
  let handFront;
  if (aiming) {
    const reach = 48 + (pose === 'throw' ? 22 * Math.sin(clamp(throwT, 0, 1) * Math.PI) : 0);
    handFront = { x: shoulderFront.x + aimDir.x * reach, y: shoulderFront.y + aimDir.y * reach };
  } else if (win) {
    handFront = { x: shoulderFront.x + 12, y: shoulderFront.y - 46 };
  } else if (dead) {
    handFront = { x: shoulderFront.x + 34, y: shoulderFront.y - 12 };
  } else {
    handFront = { x: hip.x + 20, y: hip.y + 5 };
  }
  const handBack = dead
    ? { x: shoulderBack.x - 30, y: shoulderBack.y - 18 }
    : win
      ? { x: shoulderBack.x - 18, y: shoulderBack.y - 42 }
      : aiming
        ? { x: shoulderBack.x - 8, y: shoulderBack.y + 16 }
        : { x: hip.x - 13, y: hip.y + 10 };

  const isBlinking = blink == null ? (t * 0.8 + seed * 1.7) % 3.4 < 0.1 : blink;

  ctx.save();
  if (alpha !== 1) ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.scale(facing * scale, scale);
  if (rot) {
    ctx.translate(0, -96);
    ctx.rotate(rot);
    ctx.translate(0, 96);
  }

  drawLimb(ctx, hip, kneeL, footL, 15, hero.pantsDark, hero.line);
  drawShoe(ctx, footL.x, footL.y, hero.shoe, hero.line);

  drawArm(ctx, shoulderBack, handBack, hero.skinDark, hero.line, 1, 11.5);

  drawTorso(ctx, hero, hip, torsoAngle);

  drawLimb(ctx, hip, kneeR, footR, 15, hero.pants, hero.line);
  drawShoe(ctx, footR.x, footR.y, hero.shoe, hero.line, 1, 1.05);

  ctx.save();
  ctx.translate(head.x, head.y - 17);
  roundRect(ctx, -5.5, 0, 11, 16, 4);
  ctx.fillStyle = hero.skin;
  ctx.fill();
  outline(ctx, hero.line, 2.5);
  ctx.restore();

  drawHeadBack(ctx, hero, head);

  const headAngle = dead ? 0 : hurt ? -0.12 : aiming ? 0.03 : Math.sin(t * 1.4 + seed) * 0.02;
  ctx.save();
  ctx.translate(head.x, head.y);
  ctx.rotate(headAngle);
  ctx.translate(-head.x, -head.y);
  drawHeadFront(ctx, hero, head, { t, dead, hurt, blink: isBlinking, aiming });
  ctx.restore();

  const heldAngle = aiming ? localAngle : dead ? 1.4 : win ? -1.2 : 1.05;
  if (showWeapon && !dead) {
    drawHeldWeapon(ctx, weapon, handFront.x, handFront.y, heldAngle, t, aiming ? 'aim' : 'idle', hero.accent2);
  }
  drawArm(ctx, shoulderFront, handFront, hero.skin, hero.line, -1, 12.5);

  if (pose === 'throw') {
    ctx.save();
    ctx.globalAlpha *= 1 - clamp(throwT, 0, 1);
    ctx.beginPath();
    ctx.arc(handFront.x, handFront.y, 18 + throwT * 22, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  if (hurt) {
    ctx.save();
    ctx.globalAlpha *= 0.85;
    ctx.beginPath();
    ctx.arc(head.x - 16, head.y - 12, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#bfefff';
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

export function drawShadow(ctx, x, y, scale = 1, alpha = 0.22) {
  ctx.save();
  ctx.translate(x, y + 3);
  ctx.scale(scale, 1);
  ctx.beginPath();
  ctx.ellipse(0, 0, 40, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(2,20,18,${alpha})`;
  ctx.fill();
  ctx.restore();
}

export function drawAvatar(canvas, hero, t = 0) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, hero.cardA);
  grad.addColorStop(1, hero.cardB);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  ctx.beginPath();
  ctx.arc(size * 0.35, size * 0.25, size * 0.42, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fill();

  const s = size / 188;
  ctx.translate(size * 0.5, size * 1.3);
  drawCharacter(ctx, hero, { x: 0, y: 0, facing: 1, scale: s, t, pose: 'idle', seed: 2.4, weapon: hero.weapon, showWeapon: false });
  ctx.restore();
}

export function drawHeroCard(canvas, hero, t = 0) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, hero.cardA);
  grad.addColorStop(1, hero.cardB);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.34, w * 0.38, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.9, w * 0.36, h * 0.055, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(4,26,23,0.3)';
  ctx.fill();
  const s = (h * 0.78) / 182;
  ctx.save();
  ctx.translate(w * 0.5, h * 0.9);
  drawCharacter(ctx, hero, {
    x: 0,
    y: 0,
    facing: 1,
    scale: s,
    t,
    pose: 'idle',
    seed: 1.7,
    weapon: hero.weapon,
    showWeapon: true,
  });
  ctx.restore();
}

export function drawWeaponIcon(canvas, type, accent = '#ffd23f') {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.scale(size / 84, size / 84);
  ctx.rotate(-0.55);
  if (type === 'tomahawk') {
    drawHeldWeapon(ctx, type, -24, 6, 0, 0, 'idle', accent);
  } else if (type === 'bow') {
    drawHeldWeapon(ctx, type, -6, 0, 0, 0, 'aim', accent);
  } else if (type === 'grenade') {
    drawHeldWeapon(ctx, type, -6, 0, 0, 0, 'idle', accent);
  } else if (type === 'shuriken') {
    drawHeldWeapon(ctx, type, -4, 0, 0, 0.6, 'idle', accent);
  } else if (type === 'cannonball') {
    drawHeldWeapon(ctx, type, -10, 0, 0, 0, 'idle', accent);
  } else if (type === 'rocket') {
    drawHeldWeapon(ctx, type, -7, 0, 0, 0, 'idle', accent);
  }
  ctx.restore();
}

export function drawProjectile(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  if (p.type === 'arrow') {
    ctx.rotate(p.rot);
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.lineTo(22, 0);
    ctx.strokeStyle = '#3a2718';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.strokeStyle = '#d9c39a';
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(30, 0);
    ctx.lineTo(19, -7);
    ctx.lineTo(21, 0);
    ctx.lineTo(19, 7);
    ctx.closePath();
    ctx.fillStyle = '#dfe9ed';
    ctx.fill();
    ctx.strokeStyle = '#33404a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.lineTo(-22, -8);
    ctx.lineTo(-17, -1);
    ctx.lineTo(-23, 6);
    ctx.closePath();
    ctx.fillStyle = p.accent || '#ff5d8f';
    ctx.fill();
  } else if (p.type === 'grenade') {
    ctx.rotate(p.rot);
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#4d6b44';
    ctx.fill();
    ctx.strokeStyle = '#1f2a1b';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-8, -2);
    ctx.lineTo(8, -2);
    ctx.moveTo(-8, 3);
    ctx.lineTo(8, 3);
    ctx.strokeStyle = '#354c2f';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-4, -4, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fill();
    roundRect(ctx, -4, -17, 8, 7, 3);
    ctx.fillStyle = '#98a48f';
    ctx.fill();
    ctx.strokeStyle = '#20281d';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (p.fuse > 0.7) {
      ctx.beginPath();
      ctx.arc(4, -18, 2.6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd23f';
      ctx.fill();
    }
  } else if (p.type === 'shuriken') {
    ctx.rotate(p.rot);
    ctx.beginPath();
    for (let i = 0; i < 4; i += 1) {
      const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
      const a2 = a + Math.PI / 4;
      ctx.lineTo(Math.cos(a) * 16, Math.sin(a) * 16);
      ctx.lineTo(Math.cos(a2) * 4, Math.sin(a2) * 4);
    }
    ctx.closePath();
    ctx.fillStyle = '#d3dde1';
    ctx.fill();
    ctx.strokeStyle = '#2b363c';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#2b363c';
    ctx.fill();
  } else if (p.type === 'cannonball') {
    ctx.rotate(p.rot);
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    const g = ctx.createRadialGradient(-6, -7, 2, 0, 0, 17);
    g.addColorStop(0, '#77858d');
    g.addColorStop(0.5, '#303b42');
    g.addColorStop(1, '#11181c');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#090f12';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-5, -6, 3.6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.34)';
    ctx.fill();
  } else if (p.type === 'rocket') {
    ctx.rotate(p.rot);
    ctx.beginPath();
    ctx.moveTo(-24, -8);
    ctx.lineTo(10, -9);
    ctx.quadraticCurveTo(32, 0, 10, 9);
    ctx.lineTo(-24, 8);
    ctx.closePath();
    ctx.fillStyle = '#d7e2e7';
    ctx.fill();
    ctx.strokeStyle = '#26343d';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(10, -9);
    ctx.quadraticCurveTo(32, 0, 10, 9);
    ctx.lineTo(5, 0);
    ctx.closePath();
    ctx.fillStyle = p.accent || '#ff7a3d';
    ctx.fill();
    ctx.strokeStyle = '#26343d';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-19, -8);
    ctx.lineTo(-31, -18);
    ctx.lineTo(-29, -3);
    ctx.closePath();
    ctx.moveTo(-19, 8);
    ctx.lineTo(-31, 18);
    ctx.lineTo(-29, 3);
    ctx.closePath();
    ctx.fillStyle = '#8b9aa2';
    ctx.fill();
    ctx.strokeStyle = '#26343d';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    const flame = 16 + Math.sin((p.life || 0) * 48) * 6;
    ctx.beginPath();
    ctx.moveTo(-26, -6);
    ctx.quadraticCurveTo(-26 - flame, 0, -26, 6);
    ctx.quadraticCurveTo(-30, 0, -26, -6);
    ctx.closePath();
    const fg = ctx.createLinearGradient(-26, 0, -26 - flame, 0);
    fg.addColorStop(0, '#fff3b0');
    fg.addColorStop(0.5, '#ff9d3d');
    fg.addColorStop(1, 'rgba(255,70,40,0)');
    ctx.fillStyle = fg;
    ctx.fill();
  } else {
    ctx.rotate(p.rot);
    drawHeldWeapon(ctx, 'tomahawk', 0, 0, 0, 0, 'idle', '#ffd23f');
  }
  ctx.restore();
}
