import { W, H, GP, HEROES, WEAPONS, ARENAS, PHRASES_CRIT, PHRASES_HIT } from "./data.js";
import { drawFighter, drawWeapon, renderArena, surfYAt, mulberry32, drawHudBar } from "./art.js";
import { sfx } from "./audio.js";

const HERO_IDS = Object.keys(HEROES);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* ---------- helper de mascote de turno ---------- */
function makeFighter(heroId, x, facing) {
  return {
    heroId,
    hero: HEROES[heroId],
    x,
    y: 660,
    facing,
    hp: 100,
    squash: 1,
    lean: 0,
    leanTarget: 0,
    fear: false,
    throwAnim: 0,
    armThrowAng: 1.6,
    armAngle: 0,
    hop: 0,
    dead: false,
  };
}

export class Battle {
  constructor({ playerHeroId, wins, onEnd, onCoins }) {
    this.playerHeroId = playerHeroId;
    this.wins = wins || 0;
    this.onEnd = onEnd;
    this.onCoins = onCoins;
    this.paused = false;
    this.rng = mulberry32(Math.floor(Math.random() * 1e9));

    this.arena = pick(ARENAS);
    this.seed = Math.floor(Math.random() * 1e9);
    this.surf = buildSurf(this.rng);
    this.bg = renderArena(this.arena, this.seed, this.surf);

    const aiHeroId = Math.random() < 0.4 ? "zking" : pick(HERO_IDS);
    this.fighters = [makeFighter(playerHeroId, 250, 1), makeFighter(aiHeroId, 1350, -1)];
    this.fighters.forEach((f) => (f.y = surfYAt(this.surf, f.x)));

    this.turn = 0;
    this.state = "intro";
    this.timer = 1.2;
    this.banner = { text: "SUA VEZ!", life: 1.4, color: "#ffe94a" };
    this.aim = null;
    this.showTraj = null;
    this.aiPlan = null;
    this.aiVisual = null;
    this.projectiles = [];
    this.particles = [];
    this.popups = [];
    this.decals = [];
    this.stuck = [];
    this.ragdolls = [];
    this.shake = 0;
    this.freeze = 0;
    this.timeScale = 1;
    this.cam = { x: W / 2, y: H / 2, z: 1 };
    this.t = 0;
    this.firstPlayerTurn = true;
    this.over = false;
  }

  /* ============ entrada ============ */
  onDown(wx, wy) {
    if (this.state !== "aim" || this.turn !== 0) return;
    this.aim = { ox: wx, oy: wy, dx: 0, dy: 0 };
    this.updateTraj();
  }

  onMove(wx, wy) {
    if (!this.aim) return;
    let dx = wx - this.aim.ox;
    let dy = wy - this.aim.oy;
    const len = Math.hypot(dx, dy);
    if (len > GP.dragMax) {
      dx = (dx / len) * GP.dragMax;
      dy = (dy / len) * GP.dragMax;
    }
    this.aim.dx = dx;
    this.aim.dy = dy;
    this.updateTraj();
  }

  onUp() {
    if (!this.aim) return;
    const len = Math.hypot(this.aim.dx, this.aim.dy);
    if (len > GP.dragMax * 0.08) this.throw(this.aim);
    this.aim = null;
    this.showTraj = null;
  }

  aimParams(a) {
    const len = Math.hypot(a.dx, a.dy);
    const pct = clamp(len / GP.dragMax, 0, 1);
    const ang = Math.atan2(a.dy, a.dx);
    return { pct, ang };
  }

  velocityFor(pct, ang, side) {
    const f = this.fighters[side];
    const hero = f.hero;
    const speed = GP.vmax * pct * (hero.speedMult || 1);
    return {
      vx: Math.cos(ang) * speed * f.facing,
      vy: Math.sin(ang) * speed,
      gmult: hero.gravityMult || 1,
    };
  }

  updateTraj() {
    if (!this.aim) return;
    const { pct, ang } = this.aimParams(this.aim);
    if (pct < 0.08) {
      this.showTraj = null;
      return;
    }
    const { vx, vy, gmult } = this.velocityFor(pct, ang, this.turn);
    const dt = 0.03;
    const dots = [];
    let x = this.spawnXFor(this.turn);
    let y = this.spawnYFor(this.turn);
    let ux = vx, uy = vy;
    for (let i = 0; i < 44; i++) {
      uy += GP.g * gmult * dt;
      x += ux * dt;
      y += uy * dt;
      if (i % 2 === 0) dots.push([x, y]);
      if (y > surfYAt(this.surf, x) || x < -40 || x > W + 40) break;
    }
    this.showTraj = dots;
  }

  spawnXFor(side) {
    return this.fighters[side].x + this.fighters[side].facing * 34;
  }
  spawnYFor(side) {
    return this.fighters[side].y - 96;
  }

  /* ============ arremesso ============ */
  throw(aim) {
    const { pct, ang } = this.aimParams(aim);
    const f = this.fighters[this.turn];
    const hero = f.hero;
    f.throwAnim = 0.4;
    f.armThrowAng = ang * f.facing;

    const volley = hero.volley || 1;
    for (let i = 0; i < volley; i++) {
      const spread = volley > 1 ? (i - (volley - 1) / 2) * (hero.angleSpread || 0) : 0;
      const a2 = ang + spread * f.facing;
      const { vx, vy, gmult } = this.velocityFor(pct, a2, this.turn);
      this.projectiles.push({
        x: this.spawnXFor(this.turn),
        y: this.spawnYFor(this.turn) + spread * 40,
        vx,
        vy,
        rot: 0,
        rotV: (WEAPONS[hero.weaponId].spin || 0) * f.facing,
        weaponId: hero.weaponId,
        dmg: hero.dmg,
        gmult,
        owner: this.turn,
        age: 0,
        alive: true,
        fading: 0,
        prevx: 0,
        prevy: 0,
        trail: [],
      });
    }
    for (let i = 0; i < 7; i++)
      this.particles.push(
        makeDust(this.spawnXFor(this.turn), this.spawnYFor(this.turn), rand(-50, 50), rand(-140, -30), "#ffffff")
      );
    sfx.whoosh();
    this.state = "fly";
  }

  /* ============ IA ============ */
  aiThink() {
    let best = null;
    for (let deg = 20; deg <= 64; deg += 4) {
      for (const s of [480, 640, 800, 960, 1120, 1280, 1420]) {
        const err = simShot(this, 1, deg, s, this.fighters[0]);
        if (!best || err < best.err) best = { deg, s, err };
      }
    }
    const errDeg = Math.max(0.8, 3.2 - this.wins * 0.2) * (Math.random() < 0.5 ? -1 : 1);
    this.aiPlan = {
      deg: clamp(best.deg + errDeg, 8, 75),
      pct: clamp((best.s * rand(0.99, 1.01)) / GP.vmax, 0.12, 1),
    };
  }

  aiAimVisual(dt) {
    if (!this.aiVisual) this.aiVisual = { t: 0 };
    this.aiVisual.t += dt * 2.4;
    const k = clamp(this.aiVisual.t, 0, 1);
    this.aiVisualK = k;
    const deg = this.aiPlan.deg * k;
    const ang = (-deg * Math.PI) / 180;
    const f = this.fighters[1];
    const dt2 = 0.03;
    let x = this.spawnXFor(1);
    let y = this.spawnYFor(1);
    const { vx, vy: vy0, gmult } = this.velocityFor(this.aiPlan.pct * k, ang, 1);
    let ux = vx, uy = vy0;
    const dots = [];
    for (let i = 0; i < 44; i++) {
      uy += GP.g * gmult * dt2;
      x += ux * dt2;
      y += uy * dt2;
      if (i % 2 === 0) dots.push([x, y]);
      if (y > surfYAt(this.surf, x) || x < -40 || x > W + 40) break;
    }
    this.showTraj = dots;
    f.armAngle = -deg * (Math.PI / 180) - 0.7;
    return k >= 1;
  }

  aiRelease() {
    const deg = (this.aiPlan.deg * Math.PI) / 180;
    this.throw({
      dx: Math.cos(deg) * GP.dragMax * (this.aiPlan.pct || 0.3),
      dy: -Math.sin(deg) * GP.dragMax * (this.aiPlan.pct || 0.3),
    });
    this.aiVisual = null;
  }

  /* ============ partida ============ */
  goNextTurn() {
    this.turn = 1 - this.turn;
    this.state = "intro";
    this.timer = 0.7;
    const nf = this.fighters[this.turn];
    this.banner = {
      text: this.turn === 0 ? "SUA VEZ!" : "VEZ DO INIMIGO",
      life: 1.1,
      color: this.turn === 0 ? "#ffe94a" : "#ff8fa3",
    };
    nf.armAngle = 0;
    nf.fear = false;
    if (this.turn === 0) this.showTraj = null;
  }

  finish() {
    const win = this.fighters[1].dead;
    const coins = win ? 150 : 30;
    if (win) sfx.win();
    else sfx.lose();
    this.onCoins && this.onCoins(coins);
    this.onEnd && this.onEnd(win);
  }

  /* ============ update ============ */
  update(rawdt) {
    if (this.paused || this.over) return;
    rawdt = Math.min(0.033, rawdt);
    if (this.freeze > 0) {
      this.freeze -= rawdt;
      rawdt = 0;
    }
    const dt = rawdt * this.timeScale;
    this.t += dt;
    this.shake = Math.max(0, this.shake - rawdt * 40);
    if (this.timeScale < 1) this.timeScale = Math.min(1, this.timeScale + rawdt * 0.55);

    // estados
    if (this.state === "intro") {
      this.timer -= dt;
      if (this.timer <= 0) {
        if (this.turn === 0) {
          this.state = "aim";
          if (this.firstPlayerTurn) {
            this.firstPlayerTurn = false;
            this.popups.push({
              text: "Arraste para mirar e solte!",
              x: W / 2, y: 330, life: 2.4, size: 32, color: "#ffffff", vy: -10,
            });
          }
        } else {
          this.state = "aiAim";
          this.timer = 0.7;
          this.aiPlan = null;
          this.aiVisual = null;
          this.showTraj = null;
        }
      }
    } else if (this.state === "aiAim") {
      this.timer -= dt;
      if (this.timer <= 0) {
        if (!this.aiPlan) {
          this.aiThink();
          this.fighters[1].armAngle = -1.2;
        }
        if (this.aiAimVisual(dt)) this.aiRelease();
      } else {
        this.fighters[1].armAngle = -1.2 + Math.sin(this.t * 5) * 0.09;
      }
    } else if (this.state === "after") {
      this.timer -= dt;
      if (this.timer <= 0) this.goNextTurn();
    } else if (this.state === "ko") {
      this.timer -= dt;
      if (this.timer <= 0 && !this.over) {
        this.over = true;
        this.finish();
      }
    }

    // poses
    for (const f of this.fighters) {
      f.squash += (1 - f.squash) * Math.min(1, rawdt * 9);
      f.leanTarget *= Math.max(0, 1 - rawdt * 2.4);
      f.lean += (f.leanTarget - f.lean) * Math.min(1, rawdt * 10);
      if (f.throwAnim > 0) f.throwAnim -= dt;
      if (this.state !== "ko") f.hop = Math.max(0, f.hop - rawdt * 3);
    }
    if (this.state === "ko" && this.timer > 0.2) {
      const winner = this.fighters[0].dead ? this.fighters[1] : this.fighters[0];
      winner.hop = Math.abs(Math.sin(this.t * 7)) * 0.7;
      winner.armAngle = -2.7 + Math.sin(this.t * 11) * 0.5;
    }

    // projéteis
    if (this.state === "fly") {
      for (const p of this.projectiles) this.stepProjectile(p, dt);
      this.projectiles.forEach((p) => {
        if (!p.alive) p.fading -= rawdt;
      });
      this.projectiles = this.projectiles.filter((p) => p.alive || p.fading > 0);
      if (this.projectiles.length === 0 && this.freeze <= 0) {
        this.state = "after";
        this.timer = 1.0;
      }
    }

    // partículas / popups / cravos
    for (const pt of this.particles) stepParticle(pt, dt, this);
    this.particles = this.particles.filter((p) => p.life > 0).slice(-280);
    for (const pp of this.popups) {
      pp.life -= dt;
      pp.y += pp.vy * dt;
      pp.vy *= Math.max(0, 1 - dt * 1.4);
    }
    this.popups = this.popups.filter((p) => p.life > 0);
    for (const s of this.stuck) {
      s.life -= dt;
      s.wob = s.wob || 0;
    }
    this.stuck = this.stuck.filter((s) => s.life > 0);
    for (const r of this.ragdolls) stepRag(r, dt, this);
    if (this.banner) this.banner.life -= rawdt * this.timeScale;
    if (this.banner && this.banner.life <= 0) this.banner = null;

    // câmera
    const ct = this.camTarget();
    const k = Math.min(1, dt * 6 + rawdt * 2);
    this.cam.x += (ct.x - this.cam.x) * k;
    this.cam.y += (ct.y - this.cam.y) * k;
    this.cam.z += (ct.z - this.cam.z) * k;
  }

  camTarget() {
    if (this.state === "fly" && this.projectiles.length) {
      const p = this.projectiles[0];
      return { x: clamp(p.x, 380, W - 380), y: clamp(p.y, H / 2, 520), z: 1.25 };
    }
    return { x: W / 2, y: H / 2, z: 1 };
  }

  stepProjectile(p, dt) {
    if (!p.alive) return;
    const steps = 4;
    const sdt = dt / steps;
    for (let i = 0; i < steps && p.alive; i++) {
      p.prevx = p.x;
      p.prevy = p.y;
      p.vy += GP.g * p.gmult * sdt;
      p.x += p.vx * sdt;
      p.y += p.vy * sdt;
      p.rot += p.rotV * sdt * 6;
      p.age += sdt;
      p.trail.push([p.x, p.y]);
      if (p.trail.length > 14) p.trail.shift();
      this.checkHit(p);
      if (!p.alive) break;
      if (p.y >= surfYAt(this.surf, p.x)) this.groundStick(p);
      if (p.x < -80 || p.x > W + 80 || p.y > H + 120) p.alive = false;
    }
  }

  checkHit(p) {
    const enemy = this.fighters[1 - p.owner];
    if (enemy.dead) return;
    const hx = enemy.x + enemy.facing * 6;
    const hy = enemy.y - 110;
    const dHead = Math.hypot(p.x - hx, p.y - hy);
    const dBody = distPointSeg(p.x, p.y, enemy.x - 4, enemy.y - 88, enemy.x - 4, enemy.y - 40);
    if (dHead < 26 || dBody < 34) {
      this.hitFighter(p, enemy, dHead < 26);
      p.alive = false;
    }
  }

  hitFighter(p, f, isHead) {
    const mult = isHead ? 1.9 : 1;
    const dmg = Math.round(p.dmg * mult * rand(0.92, 1.08));
    f.hp = Math.max(0, f.hp - dmg);
    f.squash = 0.72;
    f.leanTarget = (p.vx > 0 ? 1 : -1) * 0.28;
    f.fear = true;
    this.freeze = isHead ? 0.12 : 0.07;
    this.shake = isHead ? 16 : 9;

    const at = { x: p.x, y: p.y };
    const n = isHead ? 28 : 15;
    for (let i = 0; i < n; i++)
      this.particles.push(makeBlood(at.x, at.y, p.vx * 0.22 + rand(-170, 170), rand(-340, 40), isHead));

    const gy = surfYAt(this.surf, f.x);
    this.decals.push({ x: f.x + rand(-26, 26), y: gy + rand(2, 18), r: rand(9, 20) * (isHead ? 1.35 : 1) });
    if (this.decals.length > 34) this.decals.shift();

    const ang = Math.atan2(p.vy, p.vx);
    this.stuck.push({
      weaponId: p.weaponId,
      x: f.x + (p.x - f.x) * 0.3,
      y: clamp(at.y, f.y - 132, f.y - 18),
      angle: ang + (isHead ? 0.55 : 0.95),
      life: 2.4,
      wob: 1,
    });

    this.popups.push({
      text: `-${dmg}`,
      x: clamp(at.x, 60, W - 60),
      y: at.y - 26,
      life: 1.1,
      size: isHead ? 54 : 40,
      color: isHead ? "#ffe94a" : "#ffffff",
      vy: -95,
    });
    if (isHead)
      this.popups.push({
        text: pick(PHRASES_CRIT),
        x: clamp(at.x, 100, W - 100), y: at.y - 74,
        life: 1.3, size: 30, color: "#ff5470", vy: -60,
      });
    else if (Math.random() < 0.4)
      this.popups.push({
        text: pick(PHRASES_HIT),
        x: clamp(at.x, 100, W - 100), y: at.y - 64,
        life: 1, size: 26, color: "#a5f3d0", vy: -50,
      });

    if (isHead) sfx.hitHead();
    else sfx.hitBody();

    if (f.hp <= 0) this.killFighter(f, at);
  }

  killFighter(f, at) {
    f.dead = true;
    this.state = "ko";
    this.timer = 2.5;
    this.timeScale = 0.32;
    this.projectiles.forEach((p) => (p.fading = -1));
    this.projectiles = [];
    sfx.death();
    this.banner = { text: "K.O.!", life: 1.6, color: "#ff5470" };
    this.spawnRagdoll(f, at);
  }

  spawnRagdoll(f, at) {
    const hero = f.hero;
    const parts = [
      { x: f.x, y: f.y - 112, r: 19, c: hero.skin },
      { x: f.x, y: f.y - 72, r: 17, c: hero.top },
      { x: f.x, y: f.y - 48, r: 13, c: hero.top },
      { x: f.x - 12, y: f.y - 90, r: 8, c: hero.skin },
      { x: f.x + 12, y: f.y - 90, r: 8, c: hero.skin },
      { x: f.x - 10, y: f.y - 34, r: 10, c: hero.pants },
      { x: f.x + 10, y: f.y - 34, r: 10, c: hero.pants },
    ];
    parts.forEach((pt) => {
      this.ragdolls.push({
        x: pt.x,
        y: pt.y,
        vx: (at.x - f.x) * rand(1.4, 2.6) + rand(-220, 220),
        vy: rand(-680, -200),
        r: pt.r,
        c: pt.c,
        rot: rand(-1, 1),
        rotV: rand(-9, 9),
      });
    });
    for (let i = 0; i < 32; i++)
      this.particles.push(makeBlood(at.x, at.y, rand(-320, 320), rand(-560, -80), true));
  }

  groundStick(p) {
    p.alive = false;
    sfx.stickGround();
    const ang = (-p.rotV > 0 ? 1 : 1) * (Math.PI / 2) + Math.atan2(p.vy, p.vx) * 0.2;
    this.stuck.push({
      weaponId: p.weaponId,
      x: p.x,
      y: surfYAt(this.surf, p.x) + 2,
      angle: ang,
      life: 3.2,
      wob: 0,
    });
    for (let i = 0; i < 9; i++)
      this.particles.push(makeDust(p.x, p.y, rand(-130, 130), rand(-210, -30), "#dfe8ff"));
  }

  /* ============ desenho ============ */
  draw(ctx) {
    ctx.save();
    if (this.shake > 0)
      ctx.translate(rand(-this.shake, this.shake) * 0.5, rand(-this.shake, this.shake) * 0.4);
    ctx.translate(W / 2, H / 2);
    ctx.scale(this.cam.z, this.cam.z);
    ctx.translate(-this.cam.x, -this.cam.y);

    ctx.drawImage(this.bg.canvas, this.bg.dx, this.bg.dy);

    for (const d of this.decals) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = "#8f1d1d";
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, d.r * 1.45, d.r * 0.45, 0, 0, 7);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    for (const s of this.stuck) {
      ctx.save();
      ctx.globalAlpha = clamp(s.life, 0, 1);
      const wob = s.wob ? Math.sin(this.t * 26) * 0.1 * clamp(s.life, 0, 1) : 0;
      drawWeapon(ctx, s.weaponId, s.x, s.y, s.angle + wob, 0);
      ctx.restore();
    }

    this.fighters.forEach((f, i) => {
      if (f.dead) return;
      let armAngle = 0.35;
      if (this.state === "aim" && this.turn === i) {
        armAngle = this.armAngleFor(i);
      } else if (f.throwAnim > 0.16) {
        armAngle = f.armThrowAng;
      } else if (this.state === "aiAim" && i === 1) {
        armAngle = f.armAngle;
      } else if (this.state === "ko") {
        armAngle = f.armAngle;
      }
      const isWinner = this.state === "ko" && !this.fighters[0].dead === (i === 0);
      const hop = isWinner && this.state === "ko" ? f.hop * 16 : 0;
      drawFighter(ctx, f.heroId, {
        x: f.x,
        y: f.y - hop,
        facing: f.facing,
        t: this.t + i * 2.1,
        armAngle,
        weapon: this.weaponInHand(i),
        squash: clamp(f.squash, 0.7, 1.06),
        lean: clamp(f.lean, -0.38, 0.38),
        fear: f.fear,
      });
    });

    for (const r of this.ragdolls) {
      ctx.save();
      ctx.translate(r.x, r.y);
      ctx.rotate(r.rot);
      ctx.fillStyle = r.c;
      ctx.beginPath();
      ctx.arc(0, 0, r.r, 0, 7);
      ctx.fill();
      ctx.restore();
    }

    for (const p of this.projectiles) {
      if (p.trail && p.alive) {
        for (let i = 0; i < p.trail.length; i++) {
          const k = (i + 1) / p.trail.length;
          ctx.globalAlpha = k * 0.35;
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(p.trail[i][0], p.trail[i][1], 2 + k * 2.5, 0, 7);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      drawWeapon(ctx, p.weaponId, p.x, p.y, p.rot, 0);
    }

    for (const pt of this.particles) {
      ctx.globalAlpha = clamp(pt.life / pt.max, 0, 1);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r, 0, 7);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (this.showTraj)
      for (let i = 0; i < this.showTraj.length; i++) {
        const [x, y] = this.showTraj[i];
        ctx.fillStyle = i < 3 ? "#ffffff" : "rgba(255,255,255,0.82)";
        ctx.beginPath();
        ctx.arc(x, y, i < 3 ? 5 : 4.2, 0, 7);
        ctx.fill();
      }

    if (this.aim) this.drawAimPads(ctx);
    else if (this.state === "aiAim" && this.aiVisual && this.aiPlan) this.drawAiPad(ctx);

    for (const pp of this.popups) {
      const k = clamp(pp.life * 4, 0, 1);
      ctx.save();
      ctx.globalAlpha = clamp(pp.life * 1.6, 0, 1);
      ctx.translate(pp.x, pp.y);
      const sc = 0.7 + 0.3 * k;
      ctx.scale(sc, sc);
      ctx.font = `900 ${pp.size}px "Trebuchet MS", sans-serif`;
      ctx.textAlign = "center";
      ctx.lineWidth = pp.size / 7;
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(20,10,40,0.85)";
      ctx.strokeText(pp.text, 0, 0);
      ctx.fillStyle = pp.color;
      ctx.fillText(pp.text, 0, 0);
      ctx.restore();
    }

    ctx.restore();

    drawHudBar(ctx, this.fighters);
    this.drawBanner(ctx);
    this.drawAimPanel(ctx);
  }

  armAngleFor(i) {
    const f = this.fighters[i];
    if (!this.aim || Math.hypot(this.aim.dx, this.aim.dy) < 14) return -0.95;
    const { ang } = this.aimParams(this.aim);
    return ang * f.facing;
  }

  weaponInHand(i) {
    if (this.state === "fly" && this.turn === i) return null;
    if (this.fighters[i].throwAnim > 0.18) return null;
    const aiming = this.state === "aim" && this.turn === i;
    return { spin: aiming ? -12 - Math.sin(this.t * 3) * 8 : -30 };
  }

  drawAimPads(ctx) {
    const a = this.aim;
    const { pct, ang } = this.aimParams(a);
    ctx.save();
    ctx.translate(a.ox, a.oy);
    ctx.fillStyle = "rgba(190,205,255,0.15)";
    ctx.beginPath();
    ctx.arc(0, 0, 96, 0, 7);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(190,205,255,0.48)";
    ctx.stroke();
    ctx.lineCap = "round";
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      ctx.strokeStyle = "rgba(190,205,255,0.5)";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(dx * 26, dy * 26);
      ctx.lineTo(dx * 54, dy * 54);
      ctx.stroke();
      const px = dx * 66, py = dy * 66;
      ctx.beginPath();
      ctx.moveTo(px - dy * 9 - dx * 9, py - dy * 9 - dx * 9);
      ctx.lineTo(px, py);
      ctx.lineTo(px + dy * 9 - dx * 9, py + dy * 9 - dx * 9);
      ctx.stroke();
    }
    ctx.restore();
    if (Math.hypot(a.dx, a.dy) > 5) {
      ctx.fillStyle = "rgba(190,205,255,0.24)";
      ctx.beginPath();
      ctx.arc(a.ox + a.dx, a.oy + a.dy, 42, 0, 7);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.stroke();
    }
  }

  drawAiPad(ctx) {
    const f = this.fighters[1];
    const deg = ((this.aiPlan.deg * Math.PI) / 180) * this.aiVisualK;
    const ox = f.x - 40;
    const oy = f.y - 66;
    ctx.save();
    ctx.translate(ox, oy);
    ctx.fillStyle = "rgba(255,160,180,0.13)";
    ctx.beginPath();
    ctx.arc(0, 0, 96, 0, 7);
    ctx.fill();
    const dx = Math.cos(deg) * 78 * this.aiPlan.pct * this.aiVisualK;
    const dy = -Math.sin(deg) * 78 * this.aiPlan.pct * this.aiVisualK;
    ctx.fillStyle = "rgba(255,170,190,0.28)";
    ctx.beginPath();
    ctx.arc(dx, dy, 38, 0, 7);
    ctx.fill();
    ctx.restore();
  }

  drawBanner(ctx) {
    if (!this.banner) return;
    const b = this.banner;
    const k = clamp(b.life * 5, 0, 1);
    ctx.save();
    ctx.translate(W / 2, 178);
    const sc = 0.8 + 0.2 * k;
    ctx.scale(sc, sc);
    ctx.font = '900 62px "Trebuchet MS", sans-serif';
    ctx.textAlign = "center";
    ctx.lineWidth = 11;
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(20,10,40,0.9)";
    ctx.strokeText(b.text, 0, 0);
    ctx.fillStyle = b.color;
    ctx.fillText(b.text, 0, 0);
    ctx.restore();
  }

  drawAimPanel(ctx) {
    if (!this.aim) return;
    const { pct, ang } = this.aimParams(this.aim);
    if (pct < 0.08) return;
    drawPowerPanel(ctx, W / 2 - 150, 152, Math.round(pct * 100), Math.round(Math.abs((ang * 180) / Math.PI)));
  }
}

/* ---------- painel de mira estilo bowmasters ---------- */
function drawPowerPanel(ctx, x, y, powerPct, angleDeg) {
  const w = 300, h = 78;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(240,244,250,0.94)";
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = "rgba(120,130,150,0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w / 2, 10);
  ctx.lineTo(w / 2, h - 10);
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = "#3d4257";
  ctx.font = '900 30px "Trebuchet MS", sans-serif';
  ctx.fillText(`${powerPct}%`, w * 0.25, 40);
  ctx.fillText(`${angleDeg}°`, w * 0.75, 40);
  ctx.font = '800 15px "Trebuchet MS", sans-serif';
  ctx.fillStyle = "#9aa1b5";
  ctx.fillText("POWER", w * 0.25, 64);
  ctx.fillText("ANGLE", w * 0.75, 64);
  ctx.restore();
}

/* ---------- helpers ---------- */
function distPointSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const l2 = dx * dx + dy * dy || 1;
  const t = clamp(((px - x1) * dx + (py - y1) * dy) / l2, 0, 1);
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function buildSurf(rnd) {
  const xs = [-400, -160, 0, 200, 420, 640, 800, 1000, 1200, 1350, 1600, 1850, 2000];
  let y = 655 + rnd() * 25;
  const pts = xs.map((x, i) => {
    if (i > 0 && i % 4 === 0) y += rnd() * 70 - 35;
    return { x, y: y + rnd() * 12 };
  });
  // plataformas onde os lutadores ficam
  const leftY = 655 + rnd() * 25;
  const rightY = 655 + rnd() * 25;
  pts.forEach((p) => {
    if (p.x <= 420) p.y = leftY;
    if (p.x >= 1200) p.y = rightY;
  });
  return pts;
}

function simShot(battle, side, deg, speed, target) {
  const f = battle.fighters[side];
  const a = (-deg * Math.PI) / 180;
  const g = GP.g * (f.hero.gravityMult || 1);
  const hx = target.x + target.facing * 6;
  const hy = target.y - 110;
  const b1x = target.x - 4, b1y = target.y - 88;
  const b2x = target.x - 4, b2y = target.y - 40;
  let x = battle.spawnXFor(side);
  let y = battle.spawnYFor(side);
  let vx = Math.cos(a) * speed * f.facing;
  let vy = Math.sin(a) * speed;
  const dt = 0.03;
  let minD = 1e9;
  let px = x, py = y;
  for (let i = 0; i < 90; i++) {
    vy += g * dt;
    x += vx * dt;
    y += vy * dt;
    if (y > surfYAt(battle.surf, x)) break;
    if (Math.hypot(x - hx, y - hy) < 24) return 0;
    if (distPointSeg(x, y, b1x, b1y, b2x, b2y) < 30) return 0;
    const d = distPointSeg(hx, hy, px, py, x, y);
    if (d < minD) minD = d;
    px = x;
    py = y;
  }
  return Math.min(minD, 140);
}

function makeBlood(x, y, vx, vy, big) {
  return {
    x, y, vx: vx * rand(0.6, 1.3), vy: vy * rand(0.6, 1.3),
    r: rand(3, 7) * (big ? 1.25 : 1),
    color: pick(["#c01f1f", "#8f1d1d", "#e03535", "#a31212"]),
    life: rand(0.5, 1.1),
    max: 1,
    type: "blood",
  };
}

function makeDust(x, y, vx, vy, color) {
  return { x, y, vx, vy, r: rand(3, 6), color, life: rand(0.3, 0.55), max: 0.55 };
}

function stepParticle(pt, dt, battle) {
  pt.life -= dt;
  if (pt.type === "blood") {
    pt.vy += 1250 * dt;
    pt.vx *= 1 - dt * 1.2;
    if (pt.y > surfYAt(battle.surf, pt.x)) {
      pt.life = 0;
      return;
    }
  } else {
    pt.vy += 500 * dt;
  }
  pt.x += pt.vx * dt;
  pt.y += pt.vy * dt;
}

function stepRag(r, dt, battle) {
  r.vy += GP.g * 0.95 * dt;
  r.x += r.vx * dt;
  r.y += r.vy * dt;
  r.rot += r.rotV * dt;
  const gy = surfYAt(battle.surf, r.x) - 4;
  if (r.y > gy) {
    r.y = gy;
    if (Math.abs(r.vy) > 140) {
      r.vy *= -0.42;
      r.vx *= 0.75;
      r.rotV *= 0.7;
    } else {
      r.vy = 0;
      r.vx *= 0.86;
      r.rotV *= 0.9;
    }
  }
}
