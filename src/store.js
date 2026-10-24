const KEY = "axe-masters-v1";

const DEFAULTS = {
  coins: 3500,
  selected: "brutus",
  unlocked: ["brutus"],
  wins: 0,
  sound: true,
};

let state = null;

export function load() {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    state = { ...DEFAULTS };
  }
  if (!state.unlocked.includes("brutus")) state.unlocked.push("brutus");
  return state;
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function get() {
  return load();
}

export function addCoins(n) {
  const s = load();
  s.coins = Math.max(0, s.coins + n);
  save();
  return s.coins;
}

export function purchase(heroId, price) {
  const s = load();
  if (s.unlocked.includes(heroId)) return true;
  if (s.coins < price) return false;
  s.coins -= price;
  s.unlocked.push(heroId);
  s.selected = heroId;
  save();
  return true;
}

export function select(heroId) {
  const s = load();
  if (!s.unlocked.includes(heroId)) return false;
  s.selected = heroId;
  save();
  return true;
}

export function registerWin(coins) {
  const s = load();
  s.wins += 1;
  s.coins += coins;
  save();
}
