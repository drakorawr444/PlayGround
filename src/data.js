export const W = 1600;
export const H = 900;

export const GP = {
  g: 1400,
  vmax: 1450,
  dragMax: 250,
};

export const HEROES = {
  brutus: {
    name: "BRUTUS",
    tag: "guerreiro de verdade",
    weapon: "Tomahawk",
    weaponId: "tomahawk",
    price: 0,
    skin: "#8d5a3b",
    skinDark: "#6e3f27",
    top: "#c0392b",
    pants: "#2f3b52",
    boots: "#5d4030",
    hair: "bandana",
    accent: "#e63946",
    dmg: 32,
    angleSpread: 0,
  },
  venom: {
    name: "VENOM",
    tag: "striker da cobra",
    weapon: "Lança",
    weaponId: "spear",
    price: 2500,
    skin: "#d19862",
    skinDark: "#a8724a",
    top: "#3aa66b",
    pants: "#274156",
    boots: "#2c3550",
    hair: "ponytail",
    accent: "#43d68c",
    dmg: 27,
    speedMult: 1.22,
    angleSpread: 0,
  },
  shogun: {
    name: "SHOGUN",
    tag: "mestre das kunais",
    weapon: "3 Kunais",
    weaponId: "kunai",
    price: 3000,
    skin: "#f0c08c",
    skinDark: "#c69266",
    top: "#4b2c7f",
    pants: "#31205c",
    boots: "#231a44",
    hair: "hood",
    accent: "#9b5de5",
    dmg: 14,
    volley: 3,
    angleSpread: 0.055,
  },
  zking: {
    name: "Z-KING",
    tag: "rei dos mortos",
    weapon: "Fêmur",
    weaponId: "bone",
    price: -1,
    skin: "#5c8f5f",
    skinDark: "#3f6b44",
    top: "#3f8f6d",
    pants: "#7a5a2e",
    boots: "#4a3328",
    hair: "crown",
    accent: "#ffd23f",
    dmg: 30,
    gravityMult: 1.18,
  },
};

export const WEAPONS = {
  tomahawk: { spin: 16, stickAngle: 0.4 },
  spear: { spin: 0, stickAngle: 0.15 },
  kunai: { spin: 22, stickAngle: 0.4 },
  bone: { spin: 9, stickAngle: 0.5 },
};

export const ARENAS = ["city", "graveyard"];

export const PHRASES_HIT = ["NA MOSCA!", "ACERTOU!", "BOOM!", "TOMA ESSA!"];
export const PHRASES_CRIT = ["CRÍTICO!!", "PLOFT!!", "NA CABEÇA!!", "KABUM!!"];
