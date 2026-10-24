import { Sound } from './audio.js';
import { Game } from './game.js';
import {
  HEROES,
  VILLAINS,
  drawAvatar,
  drawCharacter,
  drawHeroCard,
  drawShadow,
  drawWeaponIcon,
} from './art.js';
import { WEAPONS, abilityHint, abilityName, weaponLabel } from './weapons.js';
import { drawBackdrop, drawDecor, drawGround, drawSky, getScene, groundY } from './scenes.js';
import { clamp, rad, roundRect } from './utils.js';
import { applyStaticText, translate } from './strings.js';

const SAVE_KEY = 'bowbrawl.save.v1';

function loadSave() {
  const fallback = { level: 1, best: 0, hero: 0, muted: false, mode: 'solo', lang: 'en' };
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!raw) return fallback;
    return {
      level: clamp(Number(raw.level) || 1, 1, 99),
      best: clamp(Number(raw.best) || 0, 0, 999),
      hero: clamp(Number(raw.hero) || 0, 0, HEROES.length - 1),
      muted: Boolean(raw.muted),
      mode: raw.mode === 'split' ? 'split' : 'solo',
      lang: raw.lang === 'pt' ? 'pt' : 'en',
    };
  } catch {
    return fallback;
  }
}

function computeCamera(mode, w, h) {
  const aspect = w / h;
  let scale;
  let groundTarget;
  if (mode === 'menu') {
    if (aspect >= 1.15) {
      scale = Math.max(w / 1800, h / 1000);
      groundTarget = h * 0.84;
    } else {
      scale = w / 900;
      groundTarget = h * 0.9;
    }
  } else if (aspect >= 1.15) {
    scale = Math.max(w / 1800, h / 1000);
    groundTarget = h * 0.84;
  } else {
    scale = w / 1200;
    groundTarget = h * 0.84;
  }
  const centerX = 800;
  const groundWorld = 700;
  return {
    scale,
    x: w / 2 - centerX * scale,
    y: groundTarget - groundWorld * scale,
    viewW: w,
    viewH: h,
  };
}

class App {
  constructor() {
    this.canvas = document.getElementById('stage');
    this.ctx = this.canvas.getContext('2d');
    this.sound = new Sound();
    this.save = loadSave();
    this.level = this.save.level;
    this.best = this.save.best;
    this.heroIndex = this.save.hero;
    this.muted = this.save.muted;
    this.lang = this.save.lang;
    this.mode = this.save.mode;
    this.sound.setMuted(this.muted);
    this.state = 'menu';
    this.paused = false;
    this.resultVisible = false;
    this.resultNextLevel = this.level;
    this.helpReturn = null;
    this.portraitDismissed = false;
    this.t = 0;
    this.last = performance.now();
    this.dpr = 1;
    this.W = 1;
    this.H = 1;
    this.cardClock = 0;
    this.toastTimer = 0;
    this.menuVillain = VILLAINS[(this.level - 1) % VILLAINS.length];
    this.hudCache = {};

    this.dom = {
      menu: document.getElementById('menu'),
      hud: document.getElementById('hud'),
      heroCards: document.getElementById('hero-cards'),
      heroName: document.getElementById('hero-name'),
      heroTitle: document.getElementById('hero-title'),
      heroWeapon: document.getElementById('hero-weapon'),
      menuWeapon: document.getElementById('menu-weapon'),
      bestStreak: document.getElementById('best-streak'),
      levelNum: document.getElementById('level-num'),
      playBtn: document.getElementById('play-btn'),
      menuSound: document.getElementById('menu-sound'),
      soundBtn: document.getElementById('sound-btn'),
      langBtn: document.getElementById('lang-btn'),
      modeSolo: document.getElementById('mode-solo'),
      modeSplit: document.getElementById('mode-split'),
      modeNote: document.getElementById('mode-note'),
      playStageLabel: document.getElementById('play-stage-label'),
      splitLine: document.getElementById('split-line'),
      playerName: document.getElementById('player-name'),
      enemyName: document.getElementById('enemy-name'),
      playerHpFill: document.getElementById('player-hp-fill'),
      enemyHpFill: document.getElementById('enemy-hp-fill'),
      playerHpText: document.getElementById('player-hp-text'),
      enemyHpText: document.getElementById('enemy-hp-text'),
      playerBar: document.querySelector('.fighter.left .bar'),
      enemyBar: document.querySelector('.fighter.right .bar'),
      fighterLeft: document.querySelector('.fighter.left'),
      fighterRight: document.querySelector('.fighter.right'),
      playerAvatar: document.getElementById('player-avatar'),
      enemyAvatar: document.getElementById('enemy-avatar'),
      windValue: document.getElementById('wind-value'),
      windArrow: document.getElementById('wind-arrow'),
      timerChip: document.getElementById('timer-chip'),
      timerValue: document.getElementById('timer-value'),
      weaponSlot: document.getElementById('weapon-slot'),
      abilityHint: document.getElementById('ability-hint'),
      abilityName: document.getElementById('ability-name'),
      abilityKicker: document.querySelector('#ability-hint span'),
      turnToast: document.getElementById('turn-toast'),
      flash: document.getElementById('flash'),
      rotate: document.getElementById('rotate'),
      rotateContinue: document.getElementById('rotate-continue'),
      help: document.getElementById('help'),
      helpClose: document.getElementById('help-close'),
      pause: document.getElementById('pause'),
      pauseResume: document.getElementById('pause-resume'),
      pauseRestart: document.getElementById('pause-restart'),
      pauseHelp: document.getElementById('pause-help'),
      pauseMenu: document.getElementById('pause-menu'),
      result: document.getElementById('result'),
      resultKicker: document.getElementById('result-kicker'),
      resultTitle: document.getElementById('result-title'),
      resultSub: document.getElementById('result-sub'),
      resultBest: document.getElementById('result-best'),
      resultDamage: document.getElementById('result-damage'),
      resultShots: document.getElementById('result-shots'),
      resultNext: document.getElementById('result-next'),
      resultMenu: document.getElementById('result-menu'),
      howBtn: document.getElementById('how-btn'),
      menuHelpBtn: document.getElementById('menu-help-btn'),
    };

    this.cardCanvases = [];
    this.game = new Game(this.sound, {
      onStart: (state) => this.onGameStart(state),
      onTurn: (turn) => this.onTurn(turn),
      onPlayerHit: () => this.pulseFlash(),
      onImpact: () => {},
      onEnd: (result) => this.onGameEnd(result),
    });

    applyStaticText(this.lang);
    this.createHeroCards();
    this.createWeaponSlot();
    this.bindEvents();
    this.applyMute();
    this.refreshMenu();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 120));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'play' && !this.paused && !this.resultVisible) this.openPause();
    });
    requestAnimationFrame((now) => this.loop(now));
  }

  persist() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        level: this.level,
        best: this.best,
        hero: this.heroIndex,
        muted: this.muted,
        mode: this.mode,
        lang: this.lang,
      }));
    } catch {}
  }

  createHeroCards() {
    this.dom.heroCards.innerHTML = '';
    this.cardCanvases = [];
    HEROES.forEach((hero, index) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'hero-card';
      card.dataset.index = String(index);
      card.setAttribute('aria-label', translate(this.lang, 'menu.choose', { name: hero.name }));
      card.style.setProperty('--card-a', hero.cardA);
      card.style.setProperty('--card-b', hero.cardB);

      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 360;
      canvas.setAttribute('aria-hidden', 'true');

      const weapon = document.createElement('span');
      weapon.className = 'card-weapon';
      weapon.textContent = weaponLabel(WEAPONS[hero.weapon], this.lang);

      const check = document.createElement('span');
      check.className = 'card-check';
      check.textContent = '✓';
      check.setAttribute('aria-hidden', 'true');

      const name = document.createElement('span');
      name.className = 'card-name';
      name.textContent = hero.name;

      card.append(canvas, weapon, check, name);
      card.addEventListener('click', () => this.selectHero(index));
      this.dom.heroCards.appendChild(card);
      this.cardCanvases.push({ canvas, hero });
      drawHeroCard(canvas, hero, 0.4 + index);
    });
  }

  renderWeaponSlot(owner = 'player') {
    if (!this.dom.weaponSlot) return;
    const hero = HEROES[this.heroIndex];
    const villain = VILLAINS[(this.level - 1) % VILLAINS.length];
    const weaponId = owner === 'enemy'
      ? this.game?.enemyWeapon || villain.weapon
      : this.game?.playerWeapon || hero.weapon;
    const accent = owner === 'enemy' ? villain.accent2 : hero.accent2;
    const weapon = WEAPONS[weaponId];
    this.dom.weaponSlot.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    canvas.setAttribute('aria-hidden', 'true');
    drawWeaponIcon(canvas, weapon.id, accent);
    const copy = document.createElement('span');
    copy.className = 'slot-copy';
    const kicker = document.createElement('span');
    kicker.className = 'slot-kicker';
    kicker.textContent = translate(this.lang, 'weapon.unique');
    const name = document.createElement('b');
    name.textContent = weapon.name;
    const ability = document.createElement('em');
    ability.textContent = abilityName(weapon, this.lang);
    copy.append(kicker, name, ability);
    this.dom.weaponSlot.append(canvas, copy);
    this.dom.weaponSlot.dataset.owner = owner;
    if (this.dom.abilityName) this.dom.abilityName.textContent = abilityName(weapon, this.lang);
    this.slotOwner = owner;
    this.slotLang = this.lang;
  }

  createWeaponSlot() {
    this.renderWeaponSlot('player');
  }

  setMode(mode) {
    this.mode = mode === 'split' ? 'split' : 'solo';
    this.save.mode = this.mode;
    this.persist();
    this.refreshMenu();
    this.sound.select();
  }

  setLanguage(lang) {
    this.lang = lang === 'pt' ? 'pt' : 'en';
    this.save.lang = this.lang;
    this.persist();
    applyStaticText(this.lang);
    this.refreshMenu();
    this.renderWeaponSlot(this.state === 'play' && this.game.twoPlayer ? this.game.turn : 'player');
    if (this.state === 'play') this.syncHud(true);
    this.sound.select();
  }

  toggleLanguage() {
    this.setLanguage(this.lang === 'en' ? 'pt' : 'en');
  }

  selectHero(index) {
    if (index === this.heroIndex) {
      this.sound.select();
      return;
    }
    this.heroIndex = index;
    this.save.hero = index;
    this.persist();
    this.refreshMenu();
    this.createWeaponSlot();
    this.sound.unlock();
    this.sound.select();
    for (const item of this.cardCanvases) drawHeroCard(item.canvas, item.hero, this.t);
  }

  refreshMenu() {
    const hero = HEROES[this.heroIndex];
    this.dom.heroName.textContent = hero.name;
    this.dom.heroTitle.textContent = this.lang === 'pt' ? hero.titlePt : hero.title;
    this.dom.heroWeapon.textContent = WEAPONS[hero.weapon].name;
    this.dom.bestStreak.textContent = String(this.best);
    this.dom.levelNum.textContent = String(this.level);
    this.dom.playStageLabel.textContent = translate(this.lang, 'menu.stageWord');
    this.dom.modeSolo.classList.toggle('active', this.mode === 'solo');
    this.dom.modeSplit.classList.toggle('active', this.mode === 'split');
    this.dom.modeSolo.setAttribute('aria-pressed', String(this.mode === 'solo'));
    this.dom.modeSplit.setAttribute('aria-pressed', String(this.mode === 'split'));
    this.dom.modeNote.textContent = translate(this.lang, this.mode === 'split' ? 'menu.modeNoteSplit' : 'menu.modeNoteSolo');
    this.dom.langBtn.textContent = this.lang.toUpperCase();
    this.dom.langBtn.setAttribute('aria-label', this.lang === 'en' ? 'Mudar para português' : 'Switch to English');
    drawWeaponIcon(this.dom.menuWeapon, hero.weapon, hero.accent2);
    for (const card of this.dom.heroCards.querySelectorAll('.hero-card')) {
      const index = Number(card.dataset.index);
      const item = HEROES[index];
      card.classList.toggle('selected', index === this.heroIndex);
      card.setAttribute('aria-label', translate(this.lang, 'menu.choose', { name: item.name }));
      const label = card.querySelector('.card-weapon');
      if (label) label.textContent = weaponLabel(WEAPONS[item.weapon], this.lang);
    }
    this.menuVillain = VILLAINS[(this.level - 1) % VILLAINS.length];
  }

  applyMute() {
    this.sound.setMuted(this.muted);
    for (const btn of [this.dom.menuSound, this.dom.soundBtn]) {
      btn.classList.toggle('muted', this.muted);
      btn.setAttribute('aria-pressed', String(this.muted));
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    this.save.muted = this.muted;
    this.persist();
    this.applyMute();
    this.sound.unlock();
    if (!this.muted) this.sound.click();
  }

  bindEvents() {
    this.dom.playBtn.addEventListener('click', () => {
      this.sound.unlock();
      this.sound.select();
      this.startGame(this.level);
    });
    this.dom.menuSound.addEventListener('click', () => this.toggleMute());
    this.dom.langBtn.addEventListener('click', () => this.toggleLanguage());
    this.dom.modeSolo.addEventListener('click', () => this.setMode('solo'));
    this.dom.modeSplit.addEventListener('click', () => this.setMode('split'));
    this.dom.soundBtn.addEventListener('click', () => this.toggleMute());
    this.dom.howBtn.addEventListener('click', () => this.openHelp('menu'));
    this.dom.menuHelpBtn.addEventListener('click', () => this.openHelp('menu'));
    this.dom.helpClose.addEventListener('click', () => this.closeHelp());
    document.getElementById('pause-btn').addEventListener('click', () => this.openPause());
    this.dom.pauseResume.addEventListener('click', () => this.closePause());
    this.dom.pauseRestart.addEventListener('click', () => {
      this.closePause();
      this.startGame(this.game.level);
    });
    this.dom.pauseHelp.addEventListener('click', () => this.openHelp('pause'));
    this.dom.pauseMenu.addEventListener('click', () => {
      this.closePause();
      this.goMenu();
    });
    this.dom.resultNext.addEventListener('click', () => {
      this.dom.result.hidden = true;
      this.resultVisible = false;
      this.startGame(this.resultNextLevel);
    });
    this.dom.resultMenu.addEventListener('click', () => {
      this.dom.result.hidden = true;
      this.resultVisible = false;
      this.goMenu();
    });
    this.dom.rotateContinue.addEventListener('click', () => {
      this.portraitDismissed = true;
      this.dom.rotate.hidden = true;
      this.sound.click();
    });

    this.dom.menu.addEventListener('transitionend', () => {});
    document.addEventListener('pointerdown', () => this.sound.unlock(), { passive: true });
    document.addEventListener('keydown', (event) => this.onKeyDown(event));

    this.canvas.addEventListener('pointerdown', (event) => this.onPointerDown(event));
    this.canvas.addEventListener('pointermove', (event) => this.onPointerMove(event));
    this.canvas.addEventListener('pointerup', (event) => this.onPointerUp(event));
    this.canvas.addEventListener('pointercancel', (event) => this.onPointerUp(event));
    this.canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  onKeyDown(event) {
    const key = event.key;
    if (key === 'Escape') {
      if (this.dom.help.hidden === false) { this.closeHelp(); event.preventDefault(); return; }
      if (this.state === 'play' && !this.resultVisible) {
        if (this.paused) this.closePause();
        else this.openPause();
        event.preventDefault();
      }
      return;
    }
    if (this.state !== 'play' || this.paused || this.resultVisible) return;
    if (key === ' ' || key === 'Enter') {
      if (this.game.phase === 'aim') {
        if (this.game.turn === 'player') this.game.firePlayer();
        else if (this.game.twoPlayer) this.game.fireEnemy();
        event.preventDefault();
      } else if (this.game.phase === 'flying' && (this.game.turn === 'player' || this.game.twoPlayer)) {
        this.game.triggerAbility(this.game.turn);
        event.preventDefault();
      }
      return;
    }
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      this.game.nudgeAim(0.025, 0);
      event.preventDefault();
    } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      this.game.nudgeAim(-0.025, 0);
      event.preventDefault();
    } else if (key === 'ArrowUp' || key === 'w' || key === 'W') {
      this.game.nudgeAim(0, 0.02);
      event.preventDefault();
    } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
      this.game.nudgeAim(0, -0.02);
      event.preventDefault();
    } else if (key === 'm' || key === 'M') {
      this.toggleMute();
    }
  }

  pointerWorld(event) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = event.clientX - rect.left;
    const sy = event.clientY - rect.top;
    return {
      x: (sx - this.cam.x) / this.cam.scale,
      y: (sy - this.cam.y) / this.cam.scale,
    };
  }

  onPointerDown(event) {
    if (this.state !== 'play' || this.paused || this.resultVisible) return;
    if (this.dom.rotate.hidden === false) return;
    this.sound.unlock();
    if (this.game.phase === 'flying' && (this.game.turn === 'player' || this.game.twoPlayer)) {
      if (this.game.triggerAbility(this.game.turn)) {
        event.preventDefault();
      }
      return;
    }
    if (this.game.phase !== 'aim') return;
    const point = this.pointerWorld(event);
    if (this.game.startAim(point)) {
      this.canvas.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    }
  }

  onPointerMove(event) {
    if (!this.game.aim?.dragging) return;
    this.game.updateAim(this.pointerWorld(event));
    event.preventDefault();
  }

  onPointerUp(event) {
    if (!this.game.aim?.dragging) return;
    this.game.releaseAim();
    this.canvas.releasePointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  startGame(level) {
    this.level = clamp(level, 1, 99);
    this.save.level = this.level;
    this.persist();
    this.state = 'play';
    this.paused = false;
    this.resultVisible = false;
    this.dom.menu.classList.add('is-hidden');
    this.dom.hud.hidden = false;
    this.dom.help.hidden = true;
    this.dom.pause.hidden = true;
    this.dom.result.hidden = true;
    this.dom.rotate.hidden = true;
    this.canvas.style.cursor = 'crosshair';
    this.game.start({
      level: this.level,
      hero: HEROES[this.heroIndex],
      twoPlayer: this.mode === 'split',
      lang: this.lang,
    });
    drawAvatar(this.dom.playerAvatar, this.game.hero, this.t);
    drawAvatar(this.dom.enemyAvatar, this.game.villain, this.t);
    const p1 = translate(this.lang, 'player.one');
    const p2 = translate(this.lang, 'player.two');
    this.dom.playerName.textContent = this.game.twoPlayer ? `${p1} · ${this.game.hero.name}` : this.game.hero.name;
    this.dom.enemyName.textContent = this.game.twoPlayer ? `${p2} · ${this.game.villain.name}` : this.game.villain.name;
    this.dom.hud.classList.toggle('two-player', this.game.twoPlayer);
    this.dom.splitLine.hidden = !this.game.twoPlayer;
    this.renderWeaponSlot('player');
    this.hudCache = {};
    this.syncHud(true);
    this.refreshMenu();
    this.updateRotate();
  }

  goMenu() {
    this.state = 'menu';
    this.paused = false;
    this.resultVisible = false;
    this.dom.hud.hidden = true;
    this.dom.menu.classList.remove('is-hidden');
    this.dom.help.hidden = true;
    this.dom.pause.hidden = true;
    this.dom.result.hidden = true;
    this.dom.rotate.hidden = true;
    this.dom.splitLine.hidden = true;
    this.canvas.style.cursor = 'default';
    this.menuVillain = VILLAINS[(this.level - 1) % VILLAINS.length];
    this.refreshMenu();
    this.updateRotate();
  }

  openPause() {
    if (this.state !== 'play' || this.resultVisible) return;
    if (this.game.phase === 'end') return;
    this.paused = true;
    this.dom.pause.hidden = false;
    this.dom.rotate.hidden = true;
    this.sound.click();
  }

  closePause() {
    this.paused = false;
    this.dom.pause.hidden = true;
    this.updateRotate();
    this.sound.back();
  }

  openHelp(source) {
    this.helpReturn = source;
    if (source === 'pause') this.dom.pause.hidden = true;
    this.dom.help.hidden = false;
    this.dom.rotate.hidden = true;
    this.sound.click();
  }

  closeHelp() {
    this.dom.help.hidden = true;
    if (this.helpReturn === 'pause' && this.state === 'play' && !this.resultVisible) {
      this.dom.pause.hidden = false;
    }
    this.helpReturn = null;
    this.updateRotate();
    this.sound.back();
  }

  onTurn(turn) {
    if (this.state !== 'play') return;
    let key = turn === 'player' ? 'toast.yourTurn' : 'toast.rivalTurn';
    if (this.game.twoPlayer) key = turn === 'player' ? 'toast.p1Turn' : 'toast.p2Turn';
    const el = this.dom.turnToast;
    el.textContent = translate(this.lang, key);
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
  }

  pulseFlash() {
    const el = this.dom.flash;
    el.classList.remove('pulse');
    void el.offsetWidth;
    el.classList.add('pulse');
  }

  onGameStart() {
    this.syncHud(true);
  }

  onGameEnd(result) {
    if (this.resultVisible) return;
    this.resultVisible = true;
    const victory = result.winner === 'player';
    const draw = result.winner === 'draw';
    if (this.game.twoPlayer) {
      this.resultNextLevel = result.level;
    } else if (victory) {
      this.best = Math.max(this.best, result.level);
      this.level = clamp(result.level + 1, 1, 99);
      this.resultNextLevel = this.level;
    } else {
      this.resultNextLevel = result.level;
    }
    this.persist();
    this.dom.bestStreak.textContent = String(this.best);
    this.dom.levelNum.textContent = String(this.level);
    this.dom.result.classList.toggle('lose', result.winner === 'enemy');
    this.dom.result.classList.toggle('draw', draw);
    if (this.game.twoPlayer) {
      this.dom.resultKicker.textContent = translate(this.lang, 'result.splitKicker', { level: result.level });
      if (draw) {
        this.dom.resultTitle.textContent = translate(this.lang, 'result.drawTitle');
        this.dom.resultSub.textContent = translate(this.lang, 'result.drawSub');
      } else {
        this.dom.resultTitle.textContent = translate(this.lang, victory ? 'result.p1Win' : 'result.p2Win');
        this.dom.resultSub.textContent = translate(this.lang, victory ? 'result.p1Sub' : 'result.p2Sub');
      }
      this.dom.resultNext.textContent = translate(this.lang, 'result.rematch');
    } else if (victory) {
      this.dom.resultKicker.textContent = translate(this.lang, 'result.levelDone', { level: result.level });
      this.dom.resultTitle.textContent = translate(this.lang, 'result.winTitle');
      this.dom.resultSub.textContent = translate(this.lang, 'result.winSub');
      this.dom.resultNext.textContent = translate(this.lang, 'result.next');
    } else if (draw) {
      this.dom.resultKicker.textContent = translate(this.lang, 'menu.stage', { level: result.level });
      this.dom.resultTitle.textContent = translate(this.lang, 'result.drawTitle');
      this.dom.resultSub.textContent = translate(this.lang, 'result.drawSub');
      this.dom.resultNext.textContent = translate(this.lang, 'result.revenge');
    } else {
      this.dom.resultKicker.textContent = translate(this.lang, 'menu.stage', { level: result.level });
      this.dom.resultTitle.textContent = translate(this.lang, 'result.loseTitle');
      this.dom.resultSub.textContent = translate(this.lang, 'result.loseSub');
      this.dom.resultNext.textContent = translate(this.lang, 'result.retry');
    }
    this.dom.resultBest.textContent = String(this.best);
    this.dom.resultDamage.textContent = String(Math.round(result.stats.damage));
    this.dom.resultShots.textContent = String(result.stats.shots);
    this.dom.result.hidden = false;
    this.updateRotate();
    this.refreshMenu();
  }

  updateRotate() {
    const portrait = this.H > this.W * 1.08;
    const show = this.state === 'play' && portrait && !this.portraitDismissed && !this.paused && !this.resultVisible;
    this.dom.rotate.hidden = !show;
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.canvas.width = Math.floor(this.W * this.dpr);
    this.canvas.height = Math.floor(this.H * this.dpr);
    this.canvas.style.width = `${this.W}px`;
    this.canvas.style.height = `${this.H}px`;
    if (!(this.H > this.W * 1.08)) this.portraitDismissed = false;
    this.updateRotate();
  }

  syncHud(force = false) {
    if (this.state !== 'play') return;
    const g = this.game;
    if (!g.player) return;
    const hp = Math.max(0, Math.ceil(g.player.hp));
    const ehp = Math.max(0, Math.ceil(g.enemy.hp));
    const hpPct = clamp((g.player.hp / g.player.maxHp) * 100, 0, 100);
    const ehpPct = clamp((g.enemy.hp / g.enemy.maxHp) * 100, 0, 100);
    if (force || this.hudCache.hp !== hpPct) {
      this.hudCache.hp = hpPct;
      this.dom.playerHpFill.style.width = `${hpPct}%`;
      this.dom.playerHpText.textContent = String(hp);
      this.dom.playerBar.classList.toggle('low', hpPct <= 30);
    }
    if (force || this.hudCache.ehp !== ehpPct) {
      this.hudCache.ehp = ehpPct;
      this.dom.enemyHpFill.style.width = `${ehpPct}%`;
      this.dom.enemyHpText.textContent = String(ehp);
      this.dom.enemyBar.classList.toggle('low', ehpPct <= 30);
    }
    const playerActive = g.turn === 'player' && g.phase !== 'end';
    const enemyActive = g.turn === 'enemy' && g.phase !== 'end';
    if (force || this.hudCache.pa !== playerActive || this.hudCache.ea !== enemyActive) {
      this.hudCache.pa = playerActive;
      this.hudCache.ea = enemyActive;
      this.dom.fighterLeft.classList.toggle('active', playerActive);
      this.dom.fighterRight.classList.toggle('active', enemyActive);
    }
    const wind = g.wind || 0;
    const windText = String(Math.abs(Math.round(wind)));
    const windSign = wind > 3 ? '→' : wind < -3 ? '←' : '•';
    if (force || this.hudCache.wind !== windText || this.hudCache.windSign !== windSign) {
      this.hudCache.wind = windText;
      this.hudCache.windSign = windSign;
      this.dom.windValue.textContent = windText;
      this.dom.windArrow.textContent = windSign;
    }
    const timerActive = g.phase === 'aim';
    const timerText = timerActive ? String(Math.max(0, Math.ceil(g.aimTimer))) : '—';
    if (force || this.hudCache.timer !== timerText) {
      this.hudCache.timer = timerText;
      this.dom.timerValue.textContent = timerText;
      this.dom.timerChip.classList.toggle('low', timerActive && g.aimTimer <= 5);
    }
    const slotOwner = g.twoPlayer ? g.turn : 'player';
    if (force || this.slotOwner !== slotOwner || this.slotLang !== this.lang) {
      this.renderWeaponSlot(slotOwner);
    }
    const canAbility = g.phase === 'flying' && !g.abilityUsed && (g.turn === 'player' || g.twoPlayer);
    const abilityWeapon = WEAPONS[g.turn === 'player' ? g.playerWeapon : g.enemyWeapon];
    const abilityLabel = canAbility ? abilityName(abilityWeapon, this.lang) : '';
    if (force || this.hudCache.ability !== canAbility || this.hudCache.abilityLabel !== abilityLabel) {
      this.hudCache.ability = canAbility;
      this.hudCache.abilityLabel = abilityLabel;
      if (this.dom.abilityHint) {
        this.dom.abilityHint.hidden = !canAbility;
        this.dom.abilityHint.classList.toggle('p2', g.twoPlayer && g.turn === 'enemy');
        if (canAbility && this.dom.abilityName) this.dom.abilityName.textContent = abilityLabel;
      }
    }
    this.dom.hud.classList.toggle('two-player', g.twoPlayer);
    this.dom.hud.classList.toggle('ai', !g.twoPlayer && g.turn === 'enemy');
  }

  drawMenu() {
    const ctx = this.ctx;
    const scene = getScene(this.level);
    const cam = computeCamera('menu', this.W, this.H);
    drawSky(ctx, scene, this.W, this.H, this.t);
    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.scale(cam.scale, cam.scale);
    drawBackdrop(ctx, scene, this.t);
    drawGround(ctx, scene, this.t);
    drawDecor(ctx, scene, this.t);

    const hero = HEROES[this.heroIndex];
    const villain = this.menuVillain;
    const hx = 1160;
    const vx = 770;
    const hy = groundY(scene, hx);
    const vy = groundY(scene, vx);
    const spot = ctx.createRadialGradient(hx, hy - 140, 20, hx, hy - 140, 330);
    spot.addColorStop(0, 'rgba(255, 255, 230, 0.22)');
    spot.addColorStop(0.6, 'rgba(255, 255, 230, 0.06)');
    spot.addColorStop(1, 'rgba(255, 255, 230, 0)');
    ctx.fillStyle = spot;
    ctx.beginPath();
    ctx.arc(hx, hy - 140, 330, 0, Math.PI * 2);
    ctx.fill();
    drawShadow(ctx, vx, vy, 1, 0.2);
    drawShadow(ctx, hx, hy, 1.18, 0.24);
    drawCharacter(ctx, villain, {
      x: vx,
      y: vy,
      facing: 1,
      t: this.t,
      pose: 'idle',
      seed: 4.3,
      weapon: villain.weapon,
      scale: 1,
    });
    drawCharacter(ctx, hero, {
      x: hx,
      y: hy,
      facing: -1,
      t: this.t,
      pose: 'idle',
      seed: 2.1,
      weapon: hero.weapon,
      scale: 1.17,
    });
    ctx.restore();

    const moteRng = [0.12, 0.31, 0.47, 0.66, 0.81, 0.93, 0.22, 0.58];
    ctx.save();
    for (let i = 0; i < moteRng.length; i += 1) {
      const x = ((moteRng[i] * this.W + this.t * (7 + i)) % (this.W + 40)) - 20;
      const y = (0.18 + ((i * 0.11) % 0.5)) * this.H + Math.sin(this.t * 0.7 + i * 1.2) * 16;
      const a = 0.14 + 0.12 * Math.sin(this.t * 1.2 + i);
      ctx.fillStyle = `rgba(255,255,240,${a})`;
      ctx.beginPath();
      ctx.arc(x, y, 2.2 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawPlay() {
    const ctx = this.ctx;
    const cam = computeCamera('play', this.W, this.H);
    this.cam = cam;
    const scene = this.game.scene;
    drawSky(ctx, scene, this.W, this.H, this.t);
    const shake = this.game.shake;
    const sx = shake > 0.2 ? (Math.random() * 2 - 1) * shake : 0;
    const sy = shake > 0.2 ? (Math.random() * 2 - 1) * shake : 0;
    ctx.save();
    ctx.translate(cam.x + sx, cam.y + sy);
    ctx.scale(cam.scale, cam.scale);
    this.game.drawWorld(ctx);
    ctx.restore();
    this.game.drawScreen(ctx, cam);
  }

  loop(now) {
    const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    this.t += dt;
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);

    if (this.state === 'menu') {
      this.cardClock += dt;
      if (this.cardClock > 0.14) {
        this.cardClock = 0;
        for (const item of this.cardCanvases) drawHeroCard(item.canvas, item.hero, this.t);
      }
      this.drawMenu();
    } else {
      if (!this.paused && !this.resultVisible) this.game.update(dt);
      if (this.paused || this.resultVisible) this.game.shake = Math.max(0, this.game.shake - dt * 46);
      this.drawPlay();
      this.syncHud();
    }
    requestAnimationFrame((next) => this.loop(next));
  }
}

const app = new App();
window.__bow = {
  app,
  get state() {
    return app.game.publicState();
  },
  start(level = 1, hero = 0, options = {}) {
    app.heroIndex = clamp(hero, 0, HEROES.length - 1);
    if (options.mode) app.mode = options.mode === 'split' ? 'split' : 'solo';
    if (options.lang) app.lang = options.lang === 'pt' ? 'pt' : 'en';
    app.startGame(level);
  },
  aim(angleDeg, power, owner = 'player') {
    const ch = owner === 'enemy' ? app.game.enemy : app.game.player;
    app.game.aim.owner = owner;
    app.game.aim.angle = rad(angleDeg);
    app.game.aim.power = clamp(power, 0, 1);
    ch.aimAngle = rad(angleDeg);
    ch.aimPower = power;
  },
  fire(angleDeg, power, owner = 'player') {
    if (app.game.phase !== 'aim') return false;
    const ch = owner === 'enemy' ? app.game.enemy : app.game.player;
    if (angleDeg != null) {
      app.game.aim.angle = rad(angleDeg);
      ch.aimAngle = rad(angleDeg);
    }
    if (power != null) {
      app.game.aim.power = clamp(power, 0.05, 1);
      ch.aimPower = power;
    }
    if (owner === 'enemy') app.game.fireEnemy();
    else app.game.firePlayer();
    return true;
  },
  ability(owner = 'player') {
    return app.game.triggerAbility(owner);
  },
  mode(mode) {
    app.setMode(mode);
  },
  lang(lang) {
    app.setLanguage(lang);
  },
  damage(target, amount) {
    const ch = target === 'enemy' ? app.game.enemy : app.game.player;
    app.game.damage(ch, amount, { sourceX: ch.x + 10, sourceY: ch.y - 100 });
  },
  menu() {
    app.goMenu();
  },
};
