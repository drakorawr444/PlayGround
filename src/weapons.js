export const WEAPONS = {
  tomahawk: {
    id: 'tomahawk',
    name: 'Tomahawk',
    label: 'Axe',
    labelPt: 'Machado',
    speed: 1250,
    gravity: 1000,
    damage: 27,
    headMult: 1.6,
    radius: 13,
    spin: 14,
    count: 1,
    trail: true,
    ability: { name: 'RETURN', namePt: 'RETORNO', hint: 'Tap to call it back', hintPt: 'TOQUE PARA O MACHADO VOLTAR' },
  },
  bow: {
    id: 'bow',
    name: 'Longbow',
    label: 'Bow',
    labelPt: 'Arco',
    speed: 1760,
    gravity: 520,
    damage: 22,
    headMult: 1.85,
    radius: 9,
    spin: 0,
    count: 1,
    trail: true,
    ability: { name: 'ARROW RAIN', namePt: 'CHUVA DE FLECHAS', hint: 'Tap to split the arrow', hintPt: 'TOQUE PARA DIVIDIR A FLECHA' },
  },
  grenade: {
    id: 'grenade',
    name: 'Grenade',
    label: 'Bomb',
    labelPt: 'Bomba',
    speed: 1180,
    gravity: 1260,
    damage: 42,
    headMult: 1,
    radius: 12,
    spin: 3,
    count: 1,
    blast: 150,
    fuse: 1.5,
    trail: false,
    ability: { name: 'DETONATE', namePt: 'DETONAR', hint: 'Tap to blow it early', hintPt: 'TOQUE PARA EXPLODIR AGORA' },
  },
  shuriken: {
    id: 'shuriken',
    name: 'Shuriken',
    label: 'Star',
    labelPt: 'Estrela',
    speed: 1500,
    gravity: 420,
    damage: 10,
    headMult: 1.5,
    radius: 10,
    spin: 26,
    count: 3,
    spread: 0.055,
    trail: true,
    ability: { name: 'FAN', namePt: 'LEQUE', hint: 'Tap to open the fan', hintPt: 'TOQUE PARA ABRIR O LEQUE' },
  },
  cannonball: {
    id: 'cannonball',
    name: 'Cannonball',
    label: 'Cannon',
    labelPt: 'Canhão',
    speed: 1120,
    gravity: 1180,
    damage: 36,
    headMult: 1.1,
    radius: 16,
    spin: 3,
    count: 1,
    blast: 132,
    trail: false,
    ability: { name: 'BLAST', namePt: 'CANHONAÇO', hint: 'Tap to fire in mid-air', hintPt: 'TOQUE PARA EXPLODIR NO AR' },
  },
  rocket: {
    id: 'rocket',
    name: 'Rocket',
    label: 'Rocket',
    labelPt: 'Foguete',
    speed: 1640,
    gravity: 280,
    damage: 30,
    headMult: 1.2,
    radius: 10,
    spin: 0,
    count: 1,
    blast: 100,
    trail: true,
    ability: { name: 'BOOST', namePt: 'TURBO', hint: 'Tap to boost and track', hintPt: 'TOQUE PARA ACELERAR E PERSEGUIR' },
  },
};

export function launchVelocity(weapon, angle, power) {
  const factor = 0.42 + 0.58 * Math.max(0.02, Math.min(1, power));
  const speed = weapon.speed * factor;
  return { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
}

export function weaponLabel(weapon, lang = 'en') {
  return lang === 'pt' ? weapon.labelPt || weapon.label : weapon.label;
}

export function abilityName(weapon, lang = 'en') {
  return lang === 'pt' ? weapon.ability.namePt || weapon.ability.name : weapon.ability.name;
}

export function abilityHint(weapon, lang = 'en') {
  return lang === 'pt' ? weapon.ability.hintPt || weapon.ability.hint : weapon.ability.hint;
}
