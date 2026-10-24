import { W, H, HEROES } from "./data.js";
import { drawFighter, renderArena, renderPortrait, mulberry32, surfYAt } from "./art.js";
import { Battle } from "./battle.js";
import { init as initAudio, setEnabled, sfx } from "./audio.js";
import * as store from "./store.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const hud = document.getElementById("hud");
const menuUi = document.getElementById("menu-ui");
const modalRoot = document.getElementById("modal-root");

/* ---------- estado de tela ---------- */
const state = {
  screen: "menu", // menu | battle
  battle: null,
  menuScene: null,
  menuHero: null,
  scale: 1,
  ox: 0,
  oy: 0,
  bgTint: { top: "#cdeeda", bottom: "#1f7a70" },
};

const st = store.get();

/* ---------- resize ---------- */
function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  const scale = Math.min(canvas.width / W, canvas.height / H);
  state.scale = scale;
  state.ox = (canvas.width - W * scale) / 2;
  // retrato: ancora o chão embaixo
  if (canvas.height / canvas.width > H / W) {
    state.oy = canvas.height - H * scale;
  } else {
    state.oy = (canvas.height - H * scale) / 2;
  }
}
window.addEventListener("resize", resize);
resize();

function screenToWorld(clientX, clientY) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  return {
    x: (clientX * dpr - state.ox) / state.scale,
    y: (clientY * dpr - state.oy) / state.scale,
  };
}

/* ---------- entrada ---------- */
const pointerHandlers = (down) => (e) => {
  initAudioOnce();
  if (state.screen !== "battle" || !state.battle) return;
  const w = screenToWorld(e.clientX, e.clientY);
  if (down) state.battle.onDown(w.x, w.y);
  else state.battle.onMove(w.x, w.y);
};
canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointerHandlers(true)(e);
});
canvas.addEventListener("pointermove", (e) => {
  if (e.buttons || e.pointerType === "touch") pointerHandlers(false)(e);
  else pointerHandlers(false)(e);
});
canvas.addEventListener("pointerup", () => state.battle && state.battle.onUp());
canvas.addEventListener("pointercancel", () => state.battle && state.battle.onUp());
window.addEventListener("contextmenu", (e) => e.preventDefault());

let audioReady = false;
function initAudioOnce() {
  if (audioReady) return;
  audioReady = true;
  initAudio(st.sound);
}

/* ---------- loop ---------- */
let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.04, (now - last) / 1000);
  last = now;
  ctx.fillStyle = state.screen === "battle" ? "#26334d" : "#1a2b4a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // letterbox harmonizado com o cenário
  const worldTop = Math.max(0, state.oy);
  const worldBottom = state.oy + H * state.scale;
  ctx.fillStyle = state.bgTint.top;
  ctx.fillRect(0, 0, canvas.width, worldTop);
  ctx.fillStyle = state.bgTint.bottom;
  ctx.fillRect(0, Math.min(worldBottom, canvas.height), canvas.width, Math.max(0, canvas.height - worldBottom));

  ctx.save();
  ctx.translate(state.ox, state.oy);
  ctx.scale(state.scale, state.scale);

  if (state.screen === "menu") drawMenu(dt);
  else if (state.battle) {
    state.battle.update(dt);
    state.battle.draw(ctx);
  }

  ctx.restore();
}
requestAnimationFrame(loop);

/* ---------- cena do menu ---------- */
function ensureMenuScene() {
  const s = store.get();
  if (state.menuScene && state.menuHero === s.selected) return;
  state.menuHero = s.selected;
  state.bgTint = { top: "#cdeeda", bottom: "#1f7a70" };
  const surf = [
    { x: -400, y: 700 }, { x: -100, y: 700 }, { x: 400, y: 700 },
    { x: 800, y: 700 }, { x: 1200, y: 700 }, { x: 1600, y: 700 }, { x: 2000, y: 700 },
  ];
  const bg = renderArena("city", 77, surf);
  state.menuScene = { bg, surf };
}

function drawMenu(dt) {
  ensureMenuScene();
  ctx.drawImage(state.menuScene.bg.canvas, state.menuScene.bg.dx, state.menuScene.bg.dy);
  const hero = store.get().selected;
  menuT += dt;
  drawFighter(ctx, hero, {
    x: 800,
    y: surfYAt(state.menuScene.surf, 800) + 4,
    facing: 1,
    t: menuT,
    armAngle: 0.2 + Math.sin(menuT * 1.5) * 0.1,
    weapon: { spin: Math.sin(menuT * 1.5) * 15 },
  });
}
let menuT = 0;

/* ---------- UI helpers ---------- */
function openModal(html) {
  modalRoot.innerHTML = html;
  modalRoot.classList.add("show");
}
function closeModal() {
  modalRoot.innerHTML = "";
  modalRoot.classList.remove("show");
}
function updateMenuCoins() {
  document.getElementById("menu-coins").textContent = store.get().coins;
  document.getElementById("play-level").textContent = `NÍVEL ${store.get().wins + 1}`;
}

/* ---------- menu ---------- */
document.getElementById("btn-play").addEventListener("click", () => {
  initAudioOnce();
  sfx.click();
  startBattle();
});

document.getElementById("btn-shop").addEventListener("click", () => {
  initAudioOnce();
  sfx.click();
  openShop();
});

document.getElementById("btn-settings").addEventListener("click", () => {
  initAudioOnce();
  sfx.click();
  openSettings();
});

document.getElementById("btn-pause").addEventListener("click", () => {
  sfx.click();
  openPause();
});

function startBattle() {
  const s = store.get();
  closeModal();
  menuUi.classList.add("hidden");
  hud.classList.remove("hidden");
  state.screen = "battle";
  state.bgTint = null;
  state.battle = new Battle({
    playerHeroId: s.selected,
    wins: s.wins,
    onEnd: (win) => showResult(win),
    onCoins: (c) => {
      store.addCoins(c);
      sfx.coin();
    },
  });
  const night = state.battle.arena !== "city";
  state.bgTint = night
    ? { top: "#1b2160", bottom: "#28b97f" }
    : { top: "#cdeeda", bottom: "#1f7a70" };
}

function endToMenu() {
  state.screen = "menu";
  state.battle = null;
  state.bgTint = { top: "#cdeeda", bottom: "#1f7a70" };
  hud.classList.add("hidden");
  menuUi.classList.remove("hidden");
  state.menuScene = null;
  updateMenuCoins();
}

/* ---------- modais ---------- */
function showResult(win) {
  const coins = win ? 150 : 30;
  if (win) store.registerWin(0); // só incrementa vitórias; moedas já via onCoins
  const avatarPlayer = renderPortrait(store.get().selected, 128, 128);
  const aiId = state.battle.fighters[1].heroId;
  const avatarAi = renderPortrait(aiId, 128, 128);
  openModal(`
    <div class="modal" style="background:${win ? "linear-gradient(180deg,#39b26e,#1f7d4d)" : "linear-gradient(180deg,#b9515e,#8d2f3b)"}">
      <div class="result-banner ${win ? "win" : "lose"}">${win ? "VITÓRIA!" : "DERROTA..."}</div>
      <div class="vs-score">
        <span class="av1"></span><span>VS</span><span class="av2"></span>
      </div>
      <div class="reward-row"><span class="mini-coin"></span>+${coins} moedas</div>
      <div class="modal-actions">
        <button class="btn purple" id="m-menu">MENU</button>
        <button class="btn green" id="m-again">JOGAR DE NOVO</button>
      </div>
    </div>
  `);
  const av1 = modalRoot.querySelector(".av1"), av2 = modalRoot.querySelector(".av2");
  if (av1) av1.appendChild(avatarPlayer);
  if (av2) av2.appendChild(avatarAi);
  modalRoot.querySelector("#m-menu").onclick = () => {
    sfx.click();
    closeModal();
    endToMenu();
  };
  modalRoot.querySelector("#m-again").onclick = () => {
    sfx.click();
    state.battle = null;
    startBattle();
  };
}

function openShop() {
  const s = store.get();
  const cards = Object.entries(HEROES)
    .filter(([id, h]) => h.price >= 0)
    .map(([id, h]) => {
      const unlocked = s.unlocked.includes(id);
      const selected = s.selected === id;
      const pc = renderPortrait(id);
      return `
        <button class="hero-card ${unlocked ? "" : "locked"} ${selected ? "selected" : ""}" data-hero="${id}">
          <span class="card-canvas"></span>
          <span class="card-tag">${
            unlocked ? (selected ? "EQUIPADO" : h.weapon) : `${h.price} <span class="mini-coin" style="width:13px;height:13px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffe682 0 30%,#ffb625 70%,#d97706 100%)"></span>`
          }</span>
        </button>`;
    })
    .join("");
  openModal(`
    <div class="modal">
      <div class="modal-title">HERÓIS</div>
      <div class="hero-list">${cards}</div>
      <div class="modal-actions">
        <button class="btn yellow sel-buy" style="min-width:220px"><span class="mini-coin"></span><span class="buy-label">SELECIONAR</span></button>
        <button class="btn ghost m-close">VOLTAR</button>
      </div>
    </div>
  `);
  let current = null;
  const buyBtn = modalRoot.querySelector(".sel-buy");
  const buyLabel = buyBtn.querySelector(".buy-label");
  modalRoot.querySelectorAll(".hero-card").forEach((card) => {
    const id = card.dataset.hero;
    card.querySelector(".card-canvas").appendChild(renderPortrait(id));
    card.onclick = () => {
      sfx.click();
      current = id;
      modalRoot.querySelectorAll(".hero-card").forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      const owned = s.unlocked.includes(id);
      const h = HEROES[id];
      if (owned) {
        buyLabel.textContent = store.get().selected === id ? "EQUIPADO" : "SELECIONAR";
        buyBtn.disabled = false;
        buyBtn.style.opacity = store.get().selected === id ? 0.6 : 1;
      } else {
        buyLabel.textContent = `COMPRAR ${h.price}`;
        buyBtn.style.opacity = store.get().coins >= h.price ? 1 : 0.55;
      }
    };
  });
  buyBtn.onclick = () => {
    if (!current) return;
    const owned = s.unlocked.includes(current);
    if (owned) {
      store.select(current);
      sfx.click();
      state.menuScene = null;
      updateMenuCoins();
      openShop();
      return;
    }
    const h = HEROES[current];
    if (store.purchase(current, h.price)) {
      sfx.coin();
      state.menuScene = null;
      updateMenuCoins();
      openShop();
    } else {
      sfx.click();
      buyBtn.animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(-8px)" },
          { transform: "translateX(8px)" },
          { transform: "translateX(0)" },
        ],
        { duration: 220 }
      );
    }
  };
  modalRoot.querySelector(".m-close").onclick = () => {
    sfx.click();
    closeModal();
  };
}

function openSettings() {
  const s = store.get();
  openModal(`
    <div class="modal" style="width:min(420px, calc(100vw - 32px))">
      <div class="modal-title">CONFIGURAÇÕES</div>
      <div class="modal-actions" style="flex-direction:column;align-items:stretch">
        <button class="btn yellow" id="s-sound">${s.sound ? "🔊 SOM: LIGADO" : "🔇 SOM: DESLIGADO"}</button>
        <button class="btn red" id="s-reset">RESETAR PROGRESSO</button>
        <button class="btn ghost" id="s-close">VOLTAR</button>
      </div>
    </div>
  `);
  modalRoot.querySelector("#s-sound").onclick = (e) => {
    st.sound = !st.sound;
    store.save();
    setEnabled(st.sound);
    sfx.click();
    e.target.textContent = st.sound ? "🔊 SOM: LIGADO" : "🔇 SOM: DESLIGADO";
  };
  modalRoot.querySelector("#s-reset").onclick = () => {
    localStorage.removeItem("axe-masters-v1");
    location.reload();
  };
  modalRoot.querySelector("#s-close").onclick = () => {
    sfx.click();
    closeModal();
  };
}

function openPause() {
  if (!state.battle) return;
  state.battle.paused = true;
  const s = store.get();
  openModal(`
    <div class="modal" style="width:min(420px, calc(100vw - 32px))">
      <div class="modal-title">PAUSADO</div>
      <div class="modal-actions" style="flex-direction:column;align-items:stretch">
        <button class="btn green" id="p-resume">CONTINUAR</button>
        <button class="btn yellow" id="p-restart">REINICIAR</button>
        <button class="btn ghost" id="p-menu">SAIR PARA O MENU</button>
      </div>
    </div>
  `);
  modalRoot.querySelector("#p-resume").onclick = () => {
    sfx.click();
    state.battle.paused = false;
    closeModal();
  };
  modalRoot.querySelector("#p-restart").onclick = () => {
    sfx.click();
    state.battle = null;
    startBattle();
  };
  modalRoot.querySelector("#p-menu").onclick = () => {
    sfx.click();
    closeModal();
    endToMenu();
  };
}

/* ---------- fim de entrada de teclado (acessibilidade mínima) ---------- */
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && state.screen === "battle" && state.battle && !modalRoot.classList.contains("show"))
    openPause();
});

updateMenuCoins();
window.__game = state;
