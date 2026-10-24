import { clamp, deg, dist, dist2, lerp, pick, rad, rand, roundRect, smoothstep } from './utils.js';
import { drawCharacter, drawProjectile, drawShadow, VILLAINS } from './art.js';
import { drawBackdrop, drawDecor, drawGround, groundY, getScene } from './scenes.js';
import { translate } from './strings.js';
import { WEAPONS, abilityName, launchVelocity } from './weapons.js';

export const PLAYER_X = 270;
export const ENEMY_X = 1330;

function makeFighter(hero, x, facing, seed) {
  return {
    id: hero.id,
    hero,
    x,
    y: 0,
    facing,
    hp: 100,
    maxHp: 100,
    alive: true,
    pose: 'idle',
    aimAngle: facing === 1 ? -0.52 : -Math.PI + 0.52,
    aimPower: 0.8,
    hurtT: 0,
    throwT: 0,
    flashT: 0,
    death: null,
    seed,
  };
}

function handOrigin(ch) {
  return { x: ch.x + ch.facing * 24, y: ch.y - 126 };
}

function segmentPointDistSq(ax, ay, bx, by, px, py) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return dist2(ax, ay, px, py);
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = clamp(t, 0, 1);
  return dist2(ax + dx * t, ay + dy * t, px, py);
}

export class Game {
  constructor(audio, events = {}) {
    this.audio = audio;
    this.events = events;
    this.phase = 'idle';
    this.time = 0;
    this.shake = 0;
    this.hitstop = 0;
    this.timeScale = 1;
    this.slowT = 0;
    this.level = 1;
    this.scene = getScene(1);
    this.player = null;
    this.enemy = null;
    this.projectiles = [];
    this.particles = [];
    this.floaters = [];
    this.sticks = [];
    this.scorches = [];
    this.result = null;
    this.resultSent = false;
    this.playerWeapon = null;
    this.enemyWeapon = null;
    this.abilityUsed = false;
    this.abilityOwner = null;
    this.aiAbilityT = 0;
    this.events = events;
    this.twoPlayer = false;
    this.lang = 'en';
  }

  start({ level = 1, hero, twoPlayer = false, lang = 'en' }) {
    this.level = Math.max(1, level);
    this.scene = getScene(this.level);
    this.hero = hero;
    this.twoPlayer = Boolean(twoPlayer);
    this.lang = lang === 'pt' ? 'pt' : 'en';
    this.villain = VILLAINS[(this.level - 1) % VILLAINS.length];
    this.player = makeFighter(hero, PLAYER_X, 1, 1.3 + this.level * 0.17);
    this.enemy = makeFighter(this.villain, ENEMY_X, -1, 4.1 + this.level * 0.11);
    this.player.y = groundY(this.scene, this.player.x);
    this.enemy.y = groundY(this.scene, this.enemy.x);
    this.playerWeapon = hero.weapon;
    this.enemyWeapon = this.villain.weapon;
    this.wind = Math.round(rand(-1, 1) * (this.level <= 1 ? 52 : 96));
    this.aim = { dragging: false, angle: -0.52, power: 0.82, pointer: null, owner: 'player' };
    this.player.aimAngle = this.aim.angle;
    this.player.aimPower = this.aim.power;
    this.enemy.aimAngle = -Math.PI + 0.52;
    this.projectiles = [];
    this.particles = [];
    this.floaters = [];
    this.sticks = [];
    this.scorches = [];
    this.explosions = [];
    this.phase = 'intro';
    this.phaseT = 0;
    this.turn = 'player';
    this.aimTimer = 18;
    this.lastTick = 19;
    this.resolveT = 0;
    this.time = 0;
    this.shake = 0;
    this.hitstop = 0;
    this.slowT = 0;
    this.timeScale = 1;
    this.result = null;
    this.resultSent = false;
    this.stats = { damage: 0, shots: 0, taken: 0 };
    this.aiPlan = null;
    this.aiT = 0;
    this.aiAbilityT = 0;
    this.abilityUsed = false;
    this.abilityOwner = null;
    this.hintPulse = 0;
    this.confettiDone = false;
    this.audio.unlock?.();
    this.events.onStart?.(this.publicState());
  }

  publicState() {
    return {
      phase: this.phase,
      turn: this.turn,
      level: this.level,
      scene: this.scene.id,
      twoPlayer: this.twoPlayer,
      lang: this.lang,
      wind: this.wind,
      player: { hp: this.player?.hp ?? 0, maxHp: this.player?.maxHp ?? 100, name: this.hero?.name },
      enemy: { hp: this.enemy?.hp ?? 0, maxHp: this.enemy?.maxHp ?? 100, name: this.villain?.name },
      weapon: this.playerWeapon,
      ability: {
        name: WEAPONS[this.playerWeapon] ? abilityName(WEAPONS[this.playerWeapon], this.lang) : '',
        hint: WEAPONS[this.playerWeapon]?.ability?.hint ?? '',
        available: this.phase === 'flying' && this.turn === 'player' && !this.abilityUsed,
      },
      aim: { angle: this.aim?.angle, power: this.aim?.power, dragging: this.aim?.dragging },
      timer: this.aimTimer,
      result: this.result,
      stats: this.stats,
    };
  }

  beginPlayerTurn() {
    this.turn = 'player';
    this.phase = 'aim';
    this.phaseT = 0;
    this.aimTimer = 18;
    this.lastTick = 19;
    this.aim.dragging = false;
    this.aim.owner = 'player';
    this.aim.angle = -0.52;
    this.aim.power = 0.82;
    this.player.aimAngle = this.aim.angle;
    this.player.aimPower = this.aim.power;
    this.events.onTurn?.('player', this.level);
    this.audio.turn?.();
  }

  beginEnemyTurn() {
    this.turn = 'enemy';
    this.phaseT = 0;
    if (this.twoPlayer) {
      this.phase = 'aim';
      this.aimTimer = 18;
      this.lastTick = 19;
      this.aim.dragging = false;
      this.aim.owner = 'enemy';
      this.aim.angle = -Math.PI + 0.52;
      this.aim.power = 0.82;
      this.enemy.aimAngle = this.aim.angle;
      this.enemy.aimPower = this.aim.power;
    } else {
      this.phase = 'ai';
      this.aiT = 0.85;
      this.aiPlan = this.planAI();
      this.enemy.aimAngle = this.aiPlan.angle;
      this.enemy.aimPower = this.aiPlan.power;
    }
    this.events.onTurn?.('enemy', this.level);
    this.audio.turn?.();
  }

  startAim(point) {
    if (this.phase !== 'aim' || (this.turn !== 'player' && !this.twoPlayer)) return false;
    this.aim.owner = this.turn;
    this.aim.dragging = true;
    this.updateAim(point);
    return true;
  }

  updateAim(point) {
    if (!this.aim.dragging || this.phase !== 'aim') return;
    const shooter = this.turn === 'player' ? this.player : this.enemy;
    const origin = handOrigin(shooter);
    let angle = Math.atan2(point.y - origin.y, point.x - origin.x);
    if (point.y > origin.y - 8) angle = point.x >= origin.x ? -0.14 : -Math.PI + 0.14;
    angle = clamp(angle, -Math.PI + 0.12, -0.12);
    const d = dist(point.x, point.y, origin.x, origin.y);
    this.aim.angle = angle;
    this.aim.power = clamp((d - 18) / 320, 0, 1);
    this.aim.pointer = { x: point.x, y: point.y };
    shooter.aimAngle = angle;
    shooter.aimPower = this.aim.power;
  }

  nudgeAim(deltaAngle, deltaPower) {
    if (this.phase !== 'aim') return;
    this.aim.angle = clamp(this.aim.angle + deltaAngle, -Math.PI + 0.12, -0.12);
    this.aim.power = clamp(this.aim.power + deltaPower, 0.05, 1);
    const shooter = this.turn === 'player' ? this.player : this.enemy;
    shooter.aimAngle = this.aim.angle;
    shooter.aimPower = this.aim.power;
  }

  releaseAim() {
    if (!this.aim.dragging) return;
    this.aim.dragging = false;
    if (this.phase !== 'aim') return;
    if (this.turn !== 'player' && !this.twoPlayer) return;
    if (this.aim.power < 0.06) return;
    if (this.turn === 'player') this.firePlayer();
    else this.fireEnemy();
  }

  armShot(owner) {
    this.abilityUsed = false;
    this.abilityOwner = owner;
    this.aiAbilityT = owner === 'enemy' ? 0.5 + rand(0, 0.45) : 0;
  }

  triggerAbility(owner = 'player') {
    if (this.phase !== 'flying' || this.abilityUsed) return false;
    if (owner === 'player' && this.turn !== 'player') return false;
    if (owner === 'enemy' && this.turn !== 'enemy') return false;
    if (owner === 'enemy' && this.twoPlayer && this.phase !== 'flying') return false;
    const shots = this.projectiles.filter((p) => p.owner === owner && !p.done);
    if (!shots.length) return false;
    const weapon = WEAPONS[owner === 'player' ? this.playerWeapon : this.enemyWeapon];
    const ability = weapon.ability;
    if (!ability) return false;
    const localizedName = abilityName(weapon, this.lang);

    this.abilityUsed = true;
    this.abilityOwner = owner;
    const anchor = shots[0];
    const accent = owner === 'player' ? this.hero.accent2 : this.villain.accent2;
    this.audio.ability?.();

    if (weapon.id === 'tomahawk') {
      for (const p of shots) {
        p.vx *= -1.5;
        p.vy = -Math.abs(p.vy) * 0.28 - 240;
        p.rot += Math.PI;
        p.boomerang = true;
        p.damage *= 1.15;
      }
    } else if (weapon.id === 'bow') {
      for (const p of shots) {
        for (const side of [-1, 1]) {
          const sp = Math.hypot(p.vx, p.vy);
          const a = Math.atan2(p.vy, p.vx) + side * 0.11;
          this.projectiles.push({
            ...p,
            vx: Math.cos(a) * sp * 1.04,
            vy: Math.sin(a) * sp * 1.04,
            damage: p.damage * 0.72,
            trail: [],
            life: 0,
            done: false,
          });
        }
      }
    } else if (weapon.id === 'shuriken') {
      const base = shots[0];
      const sp = Math.hypot(base.vx, base.vy);
      const angle = Math.atan2(base.vy, base.vx);
      for (let i = -2; i <= 2; i += 1) {
        if (i === 0) continue;
        const a = angle + i * 0.12;
        this.projectiles.push({
          ...base,
          vx: Math.cos(a) * sp * 1.06,
          vy: Math.sin(a) * sp * 1.06,
          trail: [],
          life: 0,
          done: false,
        });
      }
    } else if (weapon.id === 'grenade' || weapon.id === 'cannonball') {
      for (const p of shots) {
        this.explode(p.x, p.y, owner, weapon);
        p.done = true;
      }
    } else if (weapon.id === 'rocket') {
      for (const p of shots) {
        const sp = Math.hypot(p.vx, p.vy) * 1.85;
        const a = Math.atan2(p.vy, p.vx);
        p.vx = Math.cos(a) * sp;
        p.vy = Math.sin(a) * sp;
        p.homing = 0.9;
      }
    }

    this.particles.push({ type: 'ring', x: anchor.x, y: anchor.y, life: 0.48, max: 0.48, size: weapon.id === 'cannonball' ? 190 : 120, color: accent });
    this.particles.push({ type: 'flash', x: anchor.x, y: anchor.y, life: 0.22, max: 0.22, size: 86, color: '#fff3c4' });
    this.floaters.push({ x: anchor.x, y: anchor.y - 46, vy: -46, life: 1.1, max: 1.1, text: localizedName, color: accent, size: 22 });
    this.shake = Math.max(this.shake, 5);
    this.events.onAbility?.(localizedName, owner);
    return true;
  }

  firePlayer() {
    if (this.phase !== 'aim') return;
    const weapon = WEAPONS[this.playerWeapon];
    this.player.throwT = 0.001;
    this.player.pose = 'throw';
    this.armShot('player');
    this.spawnVolley('player', this.aim.angle, this.aim.power, weapon);
    this.stats.shots += 1;
    this.audio[weapon.id === 'bow' ? 'bow' : weapon.id === 'grenade' || weapon.id === 'cannonball' ? 'grenade' : weapon.id === 'shuriken' ? 'shuriken' : 'throwSfx']?.();
    this.shake = Math.max(this.shake, weapon.id === 'grenade' || weapon.id === 'cannonball' ? 4 : 3);
    this.phase = 'flying';
    this.phaseT = 0;
    this.resolveT = 0;
    this.hintPulse = 0;
  }

  fireEnemy() {
    const weapon = WEAPONS[this.enemyWeapon];
    this.enemy.throwT = 0.001;
    this.enemy.pose = 'throw';
    const plan = this.twoPlayer && this.phase === 'aim'
      ? { angle: this.aim.angle, power: this.aim.power }
      : this.aiPlan || this.planAI();
    this.armShot('enemy');
    this.spawnVolley('enemy', plan.angle, plan.power, weapon);
    this.audio[weapon.id === 'bow' ? 'bow' : weapon.id === 'grenade' || weapon.id === 'cannonball' ? 'grenade' : weapon.id === 'shuriken' ? 'shuriken' : 'throwSfx']?.();
    this.shake = Math.max(this.shake, weapon.id === 'grenade' || weapon.id === 'cannonball' ? 4 : 3);
    this.phase = 'flying';
    this.phaseT = 0;
    this.resolveT = 0;
  }

  spawnVolley(owner, angle, power, weapon) {
    const ch = owner === 'player' ? this.player : this.enemy;
    const origin = handOrigin(ch);
    for (let i = 0; i < weapon.count; i += 1) {
      const spread = weapon.count > 1 ? (i - (weapon.count - 1) / 2) * weapon.spread : 0;
      const a = angle + spread;
      const v = launchVelocity(weapon, a, power);
      const dirX = Math.cos(a);
      const dirY = Math.sin(a);
      this.projectiles.push({
        type: weapon.id,
        weaponId: weapon.id,
        owner,
        x: origin.x + dirX * 40,
        y: origin.y + dirY * 40,
        vx: v.x,
        vy: v.y,
        rot: weapon.id === 'arrow' || weapon.id === 'rocket' ? a : rand(0, Math.PI * 2),
        spin: weapon.spin || 0,
        gravity: weapon.gravity,
        damage: weapon.damage,
        headMult: weapon.headMult,
        radius: weapon.radius,
        fuse: weapon.fuse || 0,
        bounces: 0,
        homing: 0,
        life: 0,
        done: false,
        trail: [],
        accent: owner === 'player' ? this.hero.accent2 : this.villain.accent2,
      });
    }
  }

  planAI() {
    const weapon = WEAPONS[this.enemyWeapon];
    const origin = handOrigin(this.enemy);
    const target = {
      x: this.player.x + rand(-16, 16),
      y: this.player.y - 100 + rand(-18, 18),
    };
    const skill = clamp(0.52 + this.level * 0.045, 0.52, 0.94);
    let best = null;
    let bestScore = Infinity;
    const dt = 1 / 60;
    const maxSteps = weapon.id === 'grenade' ? Math.floor((weapon.fuse - 0.08) / dt) : 230;
    for (let degs = 16; degs <= 74; degs += 2.5) {
      const angle = -Math.PI + rad(degs);
      for (let power = 0.46; power <= 1.001; power += 0.055) {
        const v = launchVelocity(weapon, angle, power);
        let x = origin.x;
        let y = origin.y;
        let vx = v.x;
        let vy = v.y;
        let min = Infinity;
        for (let i = 0; i < maxSteps; i += 1) {
          vx += this.wind * dt;
          vy += weapon.gravity * dt;
          x += vx * dt;
          y += vy * dt;
          const d = dist2(x, y, target.x, target.y);
          if (d < min) min = d;
          if (d < 900) break;
          if (y > groundY(this.scene, x) && vy > 0) break;
          if (x < -240 || x > 1880) break;
        }
        let score = min;
        if (x > this.enemy.x - 60) score += 40000;
        if (!best || score < bestScore) {
          bestScore = score;
          best = { angle, power };
        }
      }
    }
    if (!best) best = { angle: -Math.PI + rad(45), power: 0.8 };
    const errA = (1 - skill) * rad(15) * (Math.random() * 2 - 1);
    const errP = (1 - skill) * 0.1 * (Math.random() * 2 - 1);
    return {
      angle: best.angle + errA,
      power: clamp(best.power + errP, 0.35, 1),
    };
  }

  update(dt) {
    this.shake = Math.max(0, this.shake - dt * 46);
    if (this.hitstop > 0) {
      this.hitstop -= dt;
      return;
    }
    if (this.slowT > 0) {
      this.slowT -= dt;
      if (this.slowT <= 0) this.timeScale = 1;
    }
    const sdt = dt * this.timeScale;
    this.time += sdt;
    this.phaseT += dt;
    this.hintPulse += dt;

    this.updateCharacter(this.player, sdt, dt);
    this.updateCharacter(this.enemy, sdt, dt);
    this.updateParticles(sdt);
    this.updateFloaters(sdt);
    this.updateSticks(dt);
    this.updateScorches(dt);

    if (this.phase === 'intro') {
      if (this.phaseT > 0.72) this.beginPlayerTurn();
      return;
    }

    if (this.phase === 'aim') {
      this.aimTimer -= dt;
      const second = Math.ceil(this.aimTimer);
      if (second <= 5 && second > 0 && second !== this.lastTick) {
        this.lastTick = second;
        this.audio.tick?.();
      }
      if (this.aimTimer <= 0) {
        this.aim.power = Math.max(this.aim.power, 0.66);
        if (this.turn === 'player') this.firePlayer();
        else this.fireEnemy();
      }
      return;
    }

    if (this.phase === 'ai') {
      this.aiT -= dt;
      if (this.aiT <= 0) this.fireEnemy();
      return;
    }

    if (this.phase === 'flying') {
      if (!this.twoPlayer && this.turn === 'enemy' && !this.abilityUsed) {
        this.aiAbilityT -= dt;
        const shot = this.projectiles.find((p) => p.owner === 'enemy' && !p.done);
        const explosive = this.enemyWeapon === 'grenade' || this.enemyWeapon === 'cannonball';
        const near = shot && dist(shot.x, shot.y, this.player.x, this.player.y - 100) < 145;
        if ((explosive && near) || (!explosive && this.aiAbilityT <= 0)) this.triggerAbility('enemy');
      }
      for (const p of this.projectiles) this.updateProjectile(p, sdt);
      this.projectiles = this.projectiles.filter((p) => !p.done);
      if (this.projectiles.length === 0) {
        this.resolveT += dt;
        if (this.resolveT > 0.6) this.afterShot();
      }
      return;
    }

    if (this.phase === 'end') {
      for (const p of this.projectiles) this.updateProjectile(p, sdt);
      this.projectiles = this.projectiles.filter((p) => !p.done);
      if (this.result && this.result.winner === 'player' && !this.confettiDone && this.phaseT > 0.55) {
        this.confettiDone = true;
        this.spawnConfetti();
      }
      if (!this.resultSent && this.phaseT > 2.1) {
        this.resultSent = true;
        this.events.onEnd?.({ ...this.result, level: this.level, stats: { ...this.stats } });
      }
    }
  }

  updateCharacter(ch, sdt, dt) {
    if (!ch) return;
    if (!ch.alive) {
      this.updateDeath(ch, sdt);
      return;
    }
    ch.flashT = Math.max(0, ch.flashT - dt);
    if (ch.hurtT > 0) ch.hurtT = Math.max(0, ch.hurtT - sdt);
    if (ch.throwT > 0) {
      ch.throwT = Math.min(1, ch.throwT + sdt / 0.3);
      if (ch.throwT >= 1) ch.throwT = 0;
    }
    if (ch.hurtT > 0) ch.pose = 'hurt';
    else if (ch.throwT > 0) ch.pose = 'throw';
    else if (ch === this.player && this.phase === 'aim' && this.turn === 'player') ch.pose = 'aim';
    else if (ch === this.enemy && (this.phase === 'ai' || (this.phase === 'aim' && this.turn === 'enemy'))) ch.pose = 'aim';
    else if (this.phase === 'end' && this.result?.winner === 'player' && ch === this.player && this.phaseT > 0.6) ch.pose = 'win';
    else ch.pose = 'idle';

    if (ch === this.player && this.phase === 'aim' && this.turn === 'player') {
      ch.aimAngle = this.aim.angle;
      ch.aimPower = this.aim.power;
    }
    if (ch === this.enemy && this.phase === 'aim' && this.turn === 'enemy') {
      ch.aimAngle = this.aim.angle;
      ch.aimPower = this.aim.power;
    }
    if (ch === this.enemy && this.phase === 'ai' && this.aiPlan) {
      ch.aimAngle = this.aiPlan.angle;
      ch.aimPower = this.aiPlan.power;
    }
  }

  updateDeath(ch, sdt) {
    const d = ch.death;
    if (!d) return;
    d.vy += 1500 * sdt;
    d.x += d.vx * sdt;
    d.y += d.vy * sdt;
    d.rot += d.spin * sdt;
    d.x = clamp(d.x, 130, 1470);
    const gy = groundY(this.scene, d.x);
    if (d.y >= gy) {
      d.y = gy;
      if (d.vy > 280) {
        d.vy *= -0.38;
        d.vx *= 0.58;
        d.spin *= 0.55;
        this.spawnDust(d.x, gy, 7, 0.7);
        this.audio.thud?.();
      } else {
        d.vy = 0;
        d.vx *= 0.82;
        d.spin *= 0.8;
        if (Math.abs(d.vx) < 6) d.vx = 0;
        d.resting = true;
        const target = (d.side || 1) * (Math.PI / 2);
        d.rot = lerp(d.rot, target, 1 - Math.exp(-3.6 * sdt));
      }
    }
    ch.x = d.x;
    ch.y = d.y;
  }

  updateProjectile(p, sdt) {
    if (p.done) return;
    p.life += sdt;
    if (p.type === 'grenade') {
      p.fuse -= sdt;
      if (p.fuse <= 0) {
        this.explode(p.x, p.y, p.owner);
        p.done = true;
        return;
      }
    }
    p.trail.push({ x: p.x, y: p.y });
    if (p.trail.length > 15) p.trail.shift();

    const speed = Math.hypot(p.vx, p.vy);
    const steps = clamp(Math.ceil((speed * sdt) / 7), 1, 12);
    const st = sdt / steps;
    const target = p.owner === 'player' ? this.enemy : this.player;

    for (let i = 0; i < steps; i += 1) {
      if (p.homing > 0) {
        p.homing -= st;
        const desired = Math.atan2(target.y - 108 - p.y, target.x - p.x);
        const current = Math.atan2(p.vy, p.vx);
        let diff = desired - current;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const turn = clamp(diff, -3.4 * st, 3.4 * st);
        const sp = Math.hypot(p.vx, p.vy) * (1 + 1.2 * st);
        p.vx = Math.cos(current + turn) * sp;
        p.vy = Math.sin(current + turn) * sp;
      }
      p.vy += p.gravity * st;
      p.vx += this.wind * st;
      p.x += p.vx * st;
      p.y += p.vy * st;
      if (p.type === 'arrow' || p.type === 'rocket') p.rot = Math.atan2(p.vy, p.vx);
      else p.rot += p.spin * st;

      if (target.alive) {
        const hit = this.projectileHitsCharacter(p, target);
        if (hit) {
          if (p.type === 'grenade' || p.type === 'cannonball' || p.type === 'rocket') {
            this.explode(p.x, p.y, p.owner, WEAPONS[p.type]);
          } else {
            const head = hit === 'head';
            const amount = p.damage * (head ? p.headMult : 1) * rand(0.92, 1.08);
            this.spawnBlood(p.x, p.y, target.hero.blood, head ? 1.5 : 1);
            this.sparkImpact(p.x, p.y, target.hero.blood);
            this.damage(target, amount, { headshot: head, sourceX: p.x, sourceY: p.y, dir: Math.sign(p.vx) || 1 });
          }
          p.done = true;
          return;
        }
      }

      const gy = groundY(this.scene, p.x);
      if (p.y >= gy - 2 && p.vy > 0) {
        this.groundHit(p, gy);
        if (p.done) return;
      }
      if (p.x < -260 || p.x > 1870 || p.y > 1320 || p.life > 8) {
        p.done = true;
        return;
      }
    }
  }

  projectileHitsCharacter(p, ch) {
    const head = { x: ch.x + 4, y: ch.y - 164 };
    const headR = 26 + p.radius * 0.7;
    if (dist2(p.x, p.y, head.x, head.y) < headR * headR) return 'head';
    const bodyR = 27 + p.radius * 0.65;
    const d = segmentPointDistSq(ch.x, ch.y - 145, ch.x, ch.y - 62, p.x, p.y);
    if (d < bodyR * bodyR) return 'body';
    return null;
  }

  groundHit(p, gy) {
    if (p.type === 'grenade') {
      if (p.bounces < 2 && p.vy > 240) {
        p.y = gy - 3;
        p.vy *= -0.4;
        p.vx *= 0.66;
        p.bounces += 1;
        p.fuse = Math.min(p.fuse, 0.55);
        this.spawnDust(p.x, gy, 8, 0.8);
        this.audio.thud?.();
        this.shake = Math.max(this.shake, 4);
      } else {
        this.explode(p.x, gy - 4, p.owner);
        p.done = true;
      }
      return;
    }
    if (p.type === 'cannonball' || p.type === 'rocket') {
      this.explode(p.x, gy - 4, p.owner, WEAPONS[p.type]);
      p.done = true;
      return;
    }
    p.y = gy - 3;
    p.done = true;
    const angle = p.type === 'arrow' ? Math.atan2(p.vy, p.vx) : p.type === 'tomahawk' ? Math.PI / 2 + rand(-0.5, 0.5) : p.rot;
    this.sticks.push({ type: p.type, x: p.x, y: gy, angle, life: 2.6, max: 2.6, accent: p.accent });
    this.spawnDust(p.x, gy, 6, 0.6);
    this.audio.stick?.();
    this.shake = Math.max(this.shake, 2.5);
  }

  damage(target, amount, opts = {}) {
    if (!target.alive) return 0;
    const dmg = Math.max(1, Math.round(amount));
    target.hp = Math.max(0, target.hp - dmg);
    target.flashT = 0.15;
    target.hurtT = 0.42;
    const dir = opts.dir || Math.sign(target.x - (opts.sourceX ?? target.x + 1)) || 1;
    target.x = clamp(target.x + dir * rand(5, 13), 130, 1470);
    target.y = groundY(this.scene, target.x);
    if (target === this.enemy) this.stats.damage += dmg;
    if (target === this.player) {
      this.stats.taken += dmg;
      this.events.onPlayerHit?.(dmg);
    }
    const head = Boolean(opts.headshot);
    this.floaters.push({
      x: target.x + rand(-12, 12),
      y: target.y - 150 + rand(-8, 8),
      vy: -58,
      life: 1.05,
      max: 1.05,
      text: head ? `${dmg} ${this.lang === 'pt' ? 'NA CABEÇA' : 'HEADSHOT'}` : `${dmg}`,
      color: head ? '#ffd23f' : '#fff6d8',
      size: head ? 26 : 38,
    });
    this.sparkImpact(target.x, target.y - 108, '#ffe9a8');
    this.audio.hit?.(head);
    this.shake = Math.max(this.shake, head ? 13 : 8 + dmg * 0.14);
    this.hitstop = Math.max(this.hitstop, head ? 0.065 : 0.04);
    this.events.onImpact?.({ headshot: head, target: target.hero.id, amount: dmg });
    if (target.hp <= 0) this.kill(target, dir);
    return dmg;
  }

  kill(ch, dir) {
    if (!ch.alive) return;
    ch.alive = false;
    ch.hp = 0;
    ch.hurtT = 0;
    ch.throwT = 0;
    ch.pose = 'dead';
    ch.death = {
      x: ch.x,
      y: ch.y,
      vx: dir * rand(90, 200),
      vy: -rand(430, 570),
      rot: rand(-0.25, 0.25),
      spin: dir * rand(4.6, 7.8),
      side: dir,
      resting: false,
    };
    this.spawnBlood(ch.x, ch.y - 120, ch.hero.blood, 2);
    this.audio.death?.();
    this.shake = Math.max(this.shake, 18);
    this.slowT = 0.82;
    this.timeScale = 0.32;
  }

  explode(x, y, owner, weapon = WEAPONS.grenade) {
    const blast = weapon.blast;
    this.audio.boom?.();
    this.shake = Math.max(this.shake, 20);
    this.hitstop = Math.max(this.hitstop, 0.06);
    this.events.flash?.('boom');
    this.explosions = this.explosions || [];
    this.explosions.push({ x, y, r: 0, life: 0.5, max: 0.5 });
    this.scorches.push({ x, y: groundY(this.scene, x), r: blast * 0.55, life: 6, max: 6 });
    if (this.scorches.length > 8) this.scorches.shift();

    this.particles.push({ type: 'flash', x, y, life: 0.24, max: 0.24, size: blast * 1.3, color: '#fff6cf' });
    this.particles.push({ type: 'ring', x, y, life: 0.5, max: 0.5, size: blast, color: '#ffe08c' });
    for (let i = 0; i < 26; i += 1) {
      const a = rand(0, Math.PI * 2);
      const sp = rand(120, 520);
      this.particles.push({
        type: 'spark',
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 80,
        gravity: 700,
        drag: 0.98,
        life: rand(0.3, 0.75),
        max: 0.75,
        size: rand(2, 5),
        color: pick(['#ffd23f', '#ff9e3d', '#ff643d', '#fff3c4']),
      });
    }
    for (let i = 0; i < 16; i += 1) {
      const a = rand(0, Math.PI * 2);
      const sp = rand(20, 140);
      this.particles.push({
        type: 'smoke',
        x: x + rand(-20, 20),
        y: y + rand(-20, 20),
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 40,
        gravity: -50,
        drag: 0.97,
        life: rand(0.6, 1.3),
        max: 1.3,
        size: rand(16, 40),
        color: pick(['#6c6257', '#8b7e6e', '#4d4a45']),
      });
    }
    this.spawnDust(x, groundY(this.scene, x), 14, 1.3);

    for (const ch of [this.player, this.enemy]) {
      if (!ch.alive) continue;
      const d = dist(x, y, ch.x, ch.y - 96);
      if (d < blast + 24) {
        const falloff = clamp(1 - d / (blast * 1.1), 0, 1);
        const mult = ch.id === owner ? 0.42 : 1;
        const damage = weapon.damage * (0.5 + 0.5 * falloff) * mult;
        this.damage(ch, damage, { sourceX: x, sourceY: y, dir: Math.sign(ch.x - x) || 1 });
      }
    }
  }

  afterShot() {
    this.projectiles = [];
    this.resolveT = 0;
    if (this.checkRoundEnd()) return;
    if (this.turn === 'player') this.beginEnemyTurn();
    else this.beginPlayerTurn();
  }

  checkRoundEnd() {
    if (this.phase === 'end') return true;
    const playerAlive = this.player.alive;
    const enemyAlive = this.enemy.alive;
    if (playerAlive && enemyAlive) return false;
    let winner = 'draw';
    if (playerAlive && !enemyAlive) winner = 'player';
    else if (!playerAlive && enemyAlive) winner = 'enemy';
    this.result = { winner };
    this.phase = 'end';
    this.phaseT = 0;
    this.confettiDone = false;
    this.slowT = Math.max(this.slowT, 0.9);
    this.timeScale = 0.32;
    if (winner === 'player') {
      this.audio.win?.();
      this.player.aimPower = this.aim.power;
    } else if (winner === 'enemy') {
      this.audio.lose?.();
    } else {
      this.audio.lose?.();
    }
    this.events.onRoundEnd?.({ winner, level: this.level, stats: this.stats });
    return true;
  }

  updateParticles(dt) {
    for (const p of this.particles) {
      p.life -= dt;
      if (p.vx != null) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.gravity) p.vy += p.gravity * dt;
        if (p.drag) {
          p.vx *= p.drag;
          p.vy *= p.drag;
        }
      }
      if (p.type === 'confetti') {
        p.rot += p.spin * dt;
        p.x += Math.sin(this.time * 2.4 + p.phase) * 26 * dt;
      }
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    if (this.explosions) {
      for (const e of this.explosions) {
        e.life -= dt;
        e.r = lerp(0, 190, 1 - e.life / e.max);
      }
      this.explosions = this.explosions.filter((e) => e.life > 0);
    }
  }

  updateFloaters(dt) {
    for (const f of this.floaters) {
      f.life -= dt;
      f.y += f.vy * dt;
      f.vy *= 0.97;
    }
    this.floaters = this.floaters.filter((f) => f.life > 0);
  }

  updateSticks(dt) {
    for (const s of this.sticks) s.life -= dt;
    this.sticks = this.sticks.filter((s) => s.life > 0);
  }

  updateScorches(dt) {
    for (const s of this.scorches) s.life -= dt;
    this.scorches = this.scorches.filter((s) => s.life > 0);
  }

  spawnBlood(x, y, color, power = 1) {
    for (let i = 0; i < Math.round(10 * power); i += 1) {
      const a = rand(0, Math.PI * 2);
      const sp = rand(50, 300) * power;
      this.particles.push({
        type: 'blood',
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 90,
        gravity: 1000,
        drag: 0.985,
        life: rand(0.35, 0.85),
        max: 0.85,
        size: rand(2, 5.5) * power,
        color,
      });
    }
  }

  sparkImpact(x, y, color) {
    for (let i = 0; i < 12; i += 1) {
      const a = rand(0, Math.PI * 2);
      const sp = rand(80, 380);
      this.particles.push({
        type: 'spark',
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        gravity: 500,
        drag: 0.97,
        life: rand(0.18, 0.4),
        max: 0.4,
        size: rand(1.5, 3.5),
        color: i % 3 === 0 ? color : '#fff3c4',
      });
    }
  }

  spawnDust(x, y, count = 8, power = 1) {
    for (let i = 0; i < count; i += 1) {
      this.particles.push({
        type: 'dust',
        x: x + rand(-10, 10),
        y: y - rand(0, 8),
        vx: rand(-70, 70) * power,
        vy: rand(-80, -15) * power,
        gravity: 180,
        drag: 0.96,
        life: rand(0.4, 0.9),
        max: 0.9,
        size: rand(4, 12) * power,
        color: this.scene.id === 'desert' ? '#e6bd7d' : '#cfe1cf',
      });
    }
  }

  spawnConfetti() {
    const colors = ['#ffd23f', '#ff5d8f', '#5be08a', '#6cc9ff', '#f3f0d8', '#b68cff'];
    for (let i = 0; i < 110; i += 1) {
      this.particles.push({
        type: 'confetti',
        x: rand(-80, 1680),
        y: rand(-500, -20),
        vx: rand(-40, 40),
        vy: rand(120, 300),
        gravity: 240,
        drag: 0.998,
        life: rand(4.5, 7.5),
        max: 7.5,
        size: rand(4, 9),
        color: pick(colors),
        rot: rand(0, Math.PI * 2),
        spin: rand(-6, 6),
        phase: rand(0, Math.PI * 2),
      });
    }
  }

  drawWorld(ctx) {
    drawBackdrop(ctx, this.scene, this.time);
    drawGround(ctx, this.scene, this.time);
    drawDecor(ctx, this.scene, this.time);

    for (const s of this.scorches) {
      const a = clamp(s.life / s.max, 0, 1) * 0.36;
      ctx.fillStyle = `rgba(24, 18, 12, ${a})`;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y + 3, s.r * 1.3, s.r * 0.24, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const s of this.sticks) {
      ctx.save();
      ctx.globalAlpha = clamp(s.life / s.max, 0, 1);
      drawProjectile(ctx, {
        type: s.type,
        x: s.x,
        y: s.y - 2,
        rot: s.angle,
        spin: 0,
        fuse: 1,
        accent: s.accent,
      });
      ctx.restore();
    }

    for (const p of this.projectiles) {
      if (!p.trail.length) continue;
      ctx.save();
      for (let i = 1; i < p.trail.length; i += 1) {
        const a = (i / p.trail.length) * 0.32;
        ctx.strokeStyle = p.type === 'grenade' ? `rgba(220,220,210,${a})` : `rgba(255,248,210,${a})`;
        ctx.lineWidth = p.type === 'arrow' ? 3 : 5;
        ctx.beginPath();
        ctx.moveTo(p.trail[i - 1].x, p.trail[i - 1].y);
        ctx.lineTo(p.trail[i].x, p.trail[i].y);
        ctx.stroke();
      }
      ctx.restore();
    }

    for (const ch of [this.player, this.enemy]) {
      if (!ch) continue;
      if (ch.alive) {
        drawShadow(ctx, ch.x, groundY(this.scene, ch.x), 1, 0.24);
      } else if (ch.death) {
        drawShadow(ctx, ch.death.x, groundY(this.scene, ch.death.x), 1.2, 0.2);
      }
    }

    for (const ch of [this.player, this.enemy]) {
      if (!ch) continue;
      if (ch.alive) {
        const showWeapon = ch.pose !== 'throw' || ch.throwT < 0.14;
        ctx.save();
        if (ch.flashT > 0) ctx.filter = 'brightness(2.1) saturate(0.4)';
        drawCharacter(ctx, ch.hero, {
          x: ch.x,
          y: ch.y,
          facing: ch.facing,
          t: this.time,
          pose: ch.pose,
          aimAngle: ch.aimAngle,
          power: ch.aimPower,
          weapon: ch === this.player ? this.playerWeapon : this.enemyWeapon,
          showWeapon,
          throwT: ch.throwT,
          seed: ch.seed,
        });
        ctx.restore();
        if (ch.pose === 'aim') {
          ctx.save();
          ctx.globalAlpha = 0.55 + Math.sin(this.time * 5) * 0.15;
          const h = handOrigin(ch);
          ctx.beginPath();
          ctx.arc(h.x, h.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#fff3c4';
          ctx.fill();
          ctx.restore();
        }
      } else if (ch.death) {
        ctx.save();
        drawCharacter(ctx, ch.hero, {
          x: ch.death.x,
          y: ch.death.y,
          facing: ch.facing,
          t: this.time,
          pose: 'dead',
          aimAngle: ch.aimAngle,
          weapon: ch === this.player ? this.playerWeapon : this.enemyWeapon,
          showWeapon: false,
          rot: ch.death.rot,
          seed: ch.seed,
        });
        ctx.restore();
      }
    }

    for (const p of this.projectiles) drawProjectile(ctx, p);
    this.drawParticles(ctx);
    this.drawFloaters(ctx);
  }

  drawParticles(ctx) {
    if (this.explosions) {
      for (const e of this.explosions) {
        const t = 1 - e.life / e.max;
        ctx.save();
        ctx.globalAlpha = (1 - t) * 0.55;
        ctx.strokeStyle = '#fff3c4';
        ctx.lineWidth = 16 * (1 - t) + 2;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
    for (const p of this.particles) {
      const a = clamp(p.life / p.max, 0, 1);
      if (p.type === 'blood') {
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (p.type === 'spark') {
        ctx.globalAlpha = a;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.018, p.y - p.vy * 0.018);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (p.type === 'smoke') {
        ctx.globalAlpha = a * 0.45;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1.7 - a * 0.7), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (p.type === 'dust') {
        ctx.globalAlpha = a * 0.6;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1.3 - a * 0.3), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (p.type === 'confetti') {
        ctx.save();
        ctx.globalAlpha = Math.min(1, a * 2);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      } else if (p.type === 'flash') {
        const t = 1 - a;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * (0.4 + t * 0.8));
        g.addColorStop(0, `rgba(255,250,220,${a})`);
        g.addColorStop(0.5, `rgba(255,200,90,${a * 0.6})`);
        g.addColorStop(1, 'rgba(255,140,40,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.4 + t * 0.8), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'ring') {
        const t = 1 - a;
        ctx.globalAlpha = a;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 12 + t * p.size, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }

  drawFloaters(ctx) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const f of this.floaters) {
      const a = clamp(f.life / f.max, 0, 1);
      const pop = 1 + (1 - a) * 0.15;
      ctx.save();
      ctx.globalAlpha = Math.min(1, a * 2);
      ctx.translate(f.x, f.y);
      ctx.scale(pop, pop);
      ctx.font = `900 ${f.size}px "Trebuchet MS", "Segoe UI", sans-serif`;
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(40, 24, 10, 0.85)';
      ctx.strokeText(f.text, 0, 0);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, 0, 0);
      ctx.restore();
    }
  }

  computeTrajectory(origin, angle, power, weapon) {
    const v = launchVelocity(weapon, angle, power);
    let x = origin.x;
    let y = origin.y;
    let vx = v.x;
    let vy = v.y;
    const pts = [];
    const dt = 1 / 60;
    const maxSteps = weapon.id === 'grenade' ? Math.floor((weapon.fuse - 0.05) / dt) : 240;
    let landing = null;
    for (let i = 0; i < maxSteps; i += 1) {
      vx += this.wind * dt;
      vy += weapon.gravity * dt;
      x += vx * dt;
      y += vy * dt;
      if (i % 4 === 0) pts.push({ x, y });
      const gy = groundY(this.scene, x);
      if (y >= gy) {
        landing = { x, y: gy };
        break;
      }
      if (x < -320 || x > 1920 || y > 1320) {
        landing = { x, y };
        break;
      }
    }
    if (!landing && pts.length) landing = { x: pts[pts.length - 1].x, y: pts[pts.length - 1].y };
    return { pts, landing };
  }

  drawScreen(ctx, cam) {
    if (this.phase === 'intro') {
      const t = this.phaseT;
      const fade = t < 0.15 ? t / 0.15 : t > 0.5 ? clamp((0.75 - t) / 0.25, 0, 1) : 1;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const y = cam.viewH * 0.4;
      ctx.translate(cam.viewW / 2, y);
      const s = 0.9 + Math.min(0.15, t * 0.25);
      ctx.scale(s, s);
      const roundLabel = translate(this.lang, 'intro.round', { level: this.level });
      ctx.font = '900 64px "Trebuchet MS", "Segoe UI", sans-serif';
      ctx.lineWidth = 13;
      ctx.strokeStyle = 'rgba(9, 48, 43, 0.9)';
      ctx.strokeText(roundLabel, 0, 0);
      ctx.fillStyle = '#ffd23f';
      ctx.fillText(roundLabel, 0, 0);
      ctx.font = '900 15px "Trebuchet MS", "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.fillText(this.lang === 'pt' ? this.scene.namePt : this.scene.name, 0, 52);
      ctx.restore();
      return;
    }

    const playerScreen = {
      x: cam.x + this.player.x * cam.scale,
      y: cam.y + this.player.y * cam.scale,
    };
    const enemyScreen = {
      x: cam.x + this.enemy.x * cam.scale,
      y: cam.y + this.enemy.y * cam.scale,
    };
    void enemyScreen;

    if (this.phase === 'aim' && (this.turn === 'player' || this.twoPlayer)) {
      const shooter = this.turn === 'player' ? this.player : this.enemy;
      const weapon = WEAPONS[this.turn === 'player' ? this.playerWeapon : this.enemyWeapon];
      const origin = handOrigin(shooter);
      const traj = this.computeTrajectory(origin, this.aim.angle, this.aim.power, weapon);
      const toScreen = (p) => ({ x: cam.x + p.x * cam.scale, y: cam.y + p.y * cam.scale });
      const originScreen = toScreen(origin);
      const pointerScreen = this.aim.pointer ? toScreen(this.aim.pointer) : null;

      ctx.save();
      if (pointerScreen) {
        ctx.globalAlpha = 0.28;
        ctx.strokeStyle = '#fff7ce';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 8]);
        ctx.beginPath();
        ctx.moveTo(originScreen.x, originScreen.y);
        ctx.lineTo(pointerScreen.x, pointerScreen.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(pointerScreen.x, pointerScreen.y, 12 + Math.sin(this.time * 5) * 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 246, 200, 0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(pointerScreen.x, pointerScreen.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#fff7ce';
        ctx.fill();
      }

      for (let i = 0; i < traj.pts.length; i += 1) {
        const p = toScreen(traj.pts[i]);
        const t = i / Math.max(1, traj.pts.length - 1);
        const r = 4.4 - t * 1.8;
        ctx.globalAlpha = 0.92 - t * 0.55;
        ctx.fillStyle = '#3a2a0e';
        ctx.beginPath();
        ctx.arc(p.x + 1.5, p.y + 1.5, r + 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = i < 3 ? '#fffdf1' : '#ffe9a3';
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (traj.landing) {
        const p = toScreen(traj.landing);
        const spin = this.time * 0.8;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(spin);
        ctx.strokeStyle = 'rgba(255, 236, 160, 0.9)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 4; i += 1) {
          const a = (i / 4) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(0, 0, 22, a + 0.16, a + 0.62);
          ctx.stroke();
        }
        ctx.restore();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 246, 200, 0.9)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 13 + Math.sin(this.time * 4) * 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 246, 200, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();

      this.drawAimCard(ctx, cam, this.turn === 'player' ? playerScreen : enemyScreen);
      if (this.aim.dragging) {
        const label = this.lang === 'pt' ? 'SOLTE PARA ARREMESSAR' : 'RELEASE TO THROW';
        ctx.save();
        ctx.font = '900 11px "Trebuchet MS", "Segoe UI", sans-serif';
        const w = ctx.measureText(label).width + 34;
        const x = clamp(cam.viewW / 2 - w / 2, 10, cam.viewW - w - 10);
        const y = cam.viewH - 88;
        ctx.globalAlpha = 0.92;
        roundRect(ctx, x, y, w, 30, 15);
        ctx.fillStyle = 'rgba(8, 39, 36, 0.72)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 210, 63, 0.55)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#ffe9a3';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x + w / 2, y + 16);
        ctx.restore();
      }
    }
  }

  drawAimCard(ctx, cam, playerScreen) {
    const w = 208;
    const h = 80;
    const x = clamp(playerScreen.x - 24, 14, cam.viewW - w - 14);
    const y = clamp(playerScreen.y - 246, 92, cam.viewH - h - 96);
    ctx.save();
    ctx.globalAlpha = 0.98;
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(-0.02);
    ctx.translate(-(x + w / 2), -(y + h / 2));
    ctx.shadowColor = 'rgba(0,0,0,0.28)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 6;
    roundRect(ctx, x, y, w, h, 16);
    ctx.fillStyle = 'rgba(255, 253, 244, 0.96)';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(30, 74, 66, 0.18)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#8b9a91';
    ctx.font = '900 10px "Trebuchet MS", "Segoe UI", sans-serif';
    ctx.fillText(this.lang === 'pt' ? 'FORÇA' : 'POWER', x + 16, y + 23);
    ctx.fillText(this.lang === 'pt' ? 'ÂNGULO' : 'ANGLE', x + 118, y + 23);
    ctx.fillStyle = '#173d38';
    ctx.font = '900 30px "Trebuchet MS", "Segoe UI", sans-serif';
    ctx.fillText(`${Math.round(this.aim.power * 100)}%`, x + 16, y + 54);
    const angle = Math.round(-deg(this.aim.angle));
    ctx.fillText(`${angle}°`, x + 118, y + 54);
    roundRect(ctx, x + 16, y + 62, 78, 7, 4);
    ctx.fillStyle = 'rgba(23, 61, 56, 0.12)';
    ctx.fill();
    roundRect(ctx, x + 16, y + 62, Math.max(6, 78 * this.aim.power), 7, 4);
    const grad = ctx.createLinearGradient(x + 16, 0, x + 94, 0);
    grad.addColorStop(0, '#ffd23f');
    grad.addColorStop(1, '#ff8a3d');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(23, 61, 56, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 112, y + 18);
    ctx.lineTo(x + 112, y + 60);
    ctx.stroke();
    ctx.restore();
  }
}
