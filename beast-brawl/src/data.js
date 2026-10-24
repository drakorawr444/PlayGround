export const RARITIES = {
  common: { name: 'Common', color: '#a8e46a', soft: '#3d6a35', order: 1 },
  rare: { name: 'Rare', color: '#5cc8ff', soft: '#1d4f6e', order: 2 },
  epic: { name: 'Epic', color: '#c084ff', soft: '#4a2b78', order: 3 },
  legendary: { name: 'Legendary', color: '#ffbd4a', soft: '#704719', order: 4 },
  mythic: { name: 'Mythic', color: '#ff5f7e', soft: '#74263a', order: 5 }
}

export const TIERS = {
  wood: { name: 'Wood', color: '#a96b3c', edge: '#d39a61', damage: 88, rate: 0.7, range: 12, speed: 19, glow: 0 },
  rock: { name: 'Rock', color: '#87949c', edge: '#c5d0d5', damage: 118, rate: 0.72, range: 12.5, speed: 20, glow: 0 },
  copper: { name: 'Copper', color: '#d37a3b', edge: '#ffbd7b', damage: 156, rate: 0.74, range: 13, speed: 21, glow: 0 },
  iron: { name: 'Iron', color: '#8fb4c9', edge: '#d8f2ff', damage: 205, rate: 0.76, range: 13.5, speed: 22, glow: 0.08 },
  gold: { name: 'Gold', color: '#f7c94b', edge: '#fff0a3', damage: 270, rate: 0.78, range: 14, speed: 23, glow: 0.24 },
  legendary: { name: 'Legendary', color: '#ff6b4a', edge: '#ffe36e', damage: 370, rate: 0.8, range: 15, speed: 25, glow: 0.55 }
}

export const WEAPON_TYPES = {
  shotgun: { name: 'Shotgun', icon: 'shotgun', damage: 0.66, rate: 1.18, pellets: 5, spread: 0.28, range: 0.72, speed: 1.1, kind: 'shot' },
  bow: { name: 'Bow', icon: 'bow', damage: 1.2, rate: 0.78, pellets: 1, spread: 0, range: 1.28, speed: 1.65, kind: 'bolt' },
  lance: { name: 'Lance', icon: 'lance', damage: 1.42, rate: 0.9, pellets: 1, spread: 0, range: 0.82, speed: 2, kind: 'pierce' },
  bomb: { name: 'Bomb', icon: 'bomb', damage: 1.5, rate: 1.5, pellets: 1, spread: 0, range: 1.1, speed: 0.82, kind: 'bomb', splash: 2.4 },
  staff: { name: 'Storm Staff', icon: 'staff', damage: 0.92, rate: 0.78, pellets: 1, spread: 0, range: 1.25, speed: 1.45, kind: 'homing' },
  crossbow: { name: 'Crossbow', icon: 'crossbow', damage: 1.48, rate: 1.06, pellets: 1, spread: 0, range: 1.35, speed: 2.15, kind: 'pierce' },
  minigun: { name: 'Minigun', icon: 'minigun', damage: 0.38, rate: 0.18, pellets: 1, spread: 0.08, range: 0.92, speed: 1.4, kind: 'shot' }
}

export const ITEM_TYPES = {
  fang: { name: 'Sharp Fang', slot: 'weapon', stat: 'damage', label: 'Damage', icon: 'fang' },
  vest: { name: 'Bark Vest', slot: 'gear', stat: 'health', label: 'Health', icon: 'vest' },
  boots: { name: 'Swift Boots', slot: 'boots', stat: 'speed', label: 'Speed', icon: 'boots' },
  charm: { name: 'Lucky Charm', slot: 'charm', stat: 'instinct', label: 'Instinct', icon: 'charm' }
}

export const ITEM_RARITY_BOOST = { common: 2, rare: 3.5, epic: 5, legendary: 7, mythic: 9.5 }

const skin = (id, name, cost, currency, body, belly, accent, detail) => ({ id, name, cost, currency, colors: { body, belly, accent, detail } })

export const CHARACTERS = [
  {
    id: 'rocco', name: 'Rocco', title: 'Rolling Boulder', species: 'rhino', rarity: 'common', league: 1,
    colors: { body: '#8ea1ad', belly: '#d4dde1', accent: '#f2a33a', detail: '#394b57' },
    stats: { hp: 1180, speed: 5.15, power: 1.02 },
    weapons: ['shotgun', 'lance', 'bomb'],
    passive: { name: 'Thick Hide', desc: 'Takes 10% less damage and shrugs off knockback.', icon: 'shield' },
    unlock: { coins: 0 },
    skins: [skin('default', 'Trailblazer', 0, 'coins', '#8ea1ad', '#d4dde1', '#f2a33a', '#394b57'), skin('magma', 'Magma Guard', 1200, 'coins', '#8c574b', '#e9a66d', '#ff6a33', '#3b2721'), skin('glacier', 'Glacier King', 45, 'gems', '#a8d7e6', '#e9fbff', '#62b8ff', '#35576b')]
  },
  {
    id: 'bolt', name: 'Bolt', title: 'Thunder Paws', species: 'cheetah', rarity: 'common', league: 1,
    colors: { body: '#e7b84b', belly: '#ffe6a4', accent: '#f46935', detail: '#5a3b21' },
    stats: { hp: 1010, speed: 6.15, power: 1.0 },
    weapons: ['bow', 'shotgun', 'lance'],
    passive: { name: 'Overdrive', desc: 'Moves 9% faster and gains a burst of speed after a takedown.', icon: 'speed' },
    unlock: { coins: 0 },
    skins: [skin('default', 'Savanna Sprint', 0, 'coins', '#e7b84b', '#ffe6a4', '#f46935', '#5a3b21'), skin('neon', 'Neon Dash', 1300, 'coins', '#e7e34b', '#eaffb0', '#42f5c8', '#224b48'), skin('ember', 'Ember Runner', 50, 'gems', '#e56f45', '#ffd6a6', '#ffdc4a', '#5c231b')]
  },
  {
    id: 'luna', name: 'Luna', title: 'Moonlit Fang', species: 'wolf', rarity: 'common', league: 1,
    colors: { body: '#7787a8', belly: '#d9e3f1', accent: '#b68bff', detail: '#313b57' },
    stats: { hp: 1060, speed: 5.8, power: 1.06 },
    weapons: ['bow', 'lance', 'bomb'],
    passive: { name: 'Night Hunter', desc: 'Deals 14% more damage to enemies below half health.', icon: 'moon' },
    unlock: { coins: 0 },
    skins: [skin('default', 'Moon Scout', 0, 'coins', '#7787a8', '#d9e3f1', '#b68bff', '#313b57'), skin('aurora', 'Aurora', 1400, 'coins', '#6f8fba', '#d6f7ff', '#69f0c1', '#253c50'), skin('shadow', 'Shadowfang', 55, 'gems', '#4b4d63', '#a7a5c9', '#d94bff', '#221f36')]
  },
  {
    id: 'kiko', name: 'Kiko', title: 'Trickster', species: 'fox', rarity: 'common', league: 1,
    colors: { body: '#ed8749', belly: '#ffe1bd', accent: '#62d2a2', detail: '#63351f' },
    stats: { hp: 990, speed: 5.95, power: 1.04 },
    weapons: ['shotgun', 'bow', 'bomb'],
    passive: { name: 'Cunning', desc: 'Shields last 20% longer and pickups recharge faster.', icon: 'spark' },
    unlock: { coins: 900 },
    skins: [skin('default', 'Jungle Trick', 0, 'coins', '#ed8749', '#ffe1bd', '#62d2a2', '#63351f'), skin('candy', 'Candy Bandit', 1100, 'coins', '#ff8fb8', '#ffe1ee', '#78e5ff', '#6b2747')]
  },
  {
    id: 'mango', name: 'Mango', title: 'Tree Jester', species: 'monkey', rarity: 'common', league: 1,
    colors: { body: '#9b643f', belly: '#efc98e', accent: '#ffd84d', detail: '#4d2d1b' },
    stats: { hp: 1030, speed: 5.75, power: 1.05 },
    weapons: ['bomb', 'staff', 'bow'],
    passive: { name: 'Monkey Business', desc: 'Barrels drop an extra item and bombs have a wider blast.', icon: 'bomb' },
    unlock: { coins: 900 },
    skins: [skin('default', 'Jungle Jester', 0, 'coins', '#9b643f', '#efc98e', '#ffd84d', '#4d2d1b'), skin('frost', 'Frost Ape', 1200, 'coins', '#8fa9b7', '#e8f7ff', '#6cd7ff', '#304a58')]
  },
  {
    id: 'tusk', name: 'Tusk', title: 'Wild Charge', species: 'boar', rarity: 'common', league: 1,
    colors: { body: '#84523f', belly: '#d3a27f', accent: '#f0e0bd', detail: '#3e251d' },
    stats: { hp: 1140, speed: 5.35, power: 1.08 },
    weapons: ['lance', 'shotgun', 'bomb'],
    passive: { name: 'Rage', desc: 'Deals 18% more damage while below 40% health.', icon: 'fire' },
    unlock: { coins: 900 },
    skins: [skin('default', 'Mud Charger', 0, 'coins', '#84523f', '#d3a27f', '#f0e0bd', '#3e251d'), skin('war', 'War Paint', 1200, 'coins', '#6d4238', '#d7a66e', '#ff5d3a', '#2c1916')]
  },
  {
    id: 'frost', name: 'Frost', title: 'Tundra Titan', species: 'bear', rarity: 'rare', league: 2,
    colors: { body: '#dceaf0', belly: '#ffffff', accent: '#5ec9ff', detail: '#4b7181' },
    stats: { hp: 1240, speed: 5.05, power: 1.08 },
    weapons: ['shotgun', 'lance', 'crossbow'],
    passive: { name: 'Frost Armor', desc: 'Starts each match with a 180 point ice shield.', icon: 'snow' },
    unlock: { coins: 1800 },
    skins: [skin('default', 'Tundra Titan', 0, 'coins', '#dceaf0', '#ffffff', '#5ec9ff', '#4b7181'), skin('blackice', 'Black Ice', 65, 'gems', '#4b5b70', '#9eb4c8', '#5ef0ff', '#1d2735')]
  },
  {
    id: 'croc', name: 'Croc', title: 'River King', species: 'croc', rarity: 'rare', league: 2,
    colors: { body: '#4f9b67', belly: '#b8d98b', accent: '#f6c44f', detail: '#264d36' },
    stats: { hp: 1160, speed: 5.45, power: 1.1 },
    weapons: ['lance', 'bomb', 'shotgun'],
    passive: { name: 'Death Roll', desc: 'Melee lances deal 20% more damage and slow targets.', icon: 'swirl' },
    unlock: { coins: 1800 },
    skins: [skin('default', 'River King', 0, 'coins', '#4f9b67', '#b8d98b', '#f6c44f', '#264d36'), skin('swamp', 'Swamp Terror', 1400, 'coins', '#415e40', '#91aa63', '#c8ff5e', '#1d2b1c')]
  },
  {
    id: 'blaze', name: 'Blaze', title: 'Ember Claw', species: 'tiger', rarity: 'epic', league: 3,
    colors: { body: '#e7813c', belly: '#ffe1b1', accent: '#ff4d39', detail: '#46251a' },
    stats: { hp: 1090, speed: 5.9, power: 1.16 },
    weapons: ['bow', 'shotgun', 'bomb'],
    passive: { name: 'Predator', desc: 'Attacks from outside enemy range deal 22% bonus damage.', icon: 'crosshair' },
    unlock: { coins: 3200 },
    skins: [skin('default', 'Ember Claw', 0, 'coins', '#e7813c', '#ffe1b1', '#ff4d39', '#46251a'), skin('royal', 'Royal Flame', 90, 'gems', '#f3a84f', '#fff2cf', '#ff2e63', '#4f2137')]
  },
  {
    id: 'glitch', name: 'Glitch', title: 'Pixel Phantom', species: 'chameleon', rarity: 'epic', league: 3,
    colors: { body: '#45c99a', belly: '#c6ffe1', accent: '#c05eff', detail: '#1c5b4b' },
    stats: { hp: 1050, speed: 6.0, power: 1.12 },
    weapons: ['staff', 'bomb', 'crossbow'],
    passive: { name: 'Camouflage', desc: 'Becomes briefly invisible after using an item.', icon: 'eye' },
    unlock: { coins: 3200 },
    skins: [skin('default', 'Pixel Phantom', 0, 'coins', '#45c99a', '#c6ffe1', '#c05eff', '#1c5b4b'), skin('cyber', 'Cyber Chameleon', 95, 'gems', '#3c8fe0', '#b9e8ff', '#ff58c8', '#1a3158')]
  },
  {
    id: 'mako', name: 'Mako', title: 'Deep Terror', species: 'shark', rarity: 'legendary', league: 4,
    colors: { body: '#5d83a8', belly: '#d7ebf5', accent: '#56e4ff', detail: '#263b52' },
    stats: { hp: 1200, speed: 5.7, power: 1.2 },
    weapons: ['lance', 'crossbow', 'minigun'],
    passive: { name: 'Blood in Water', desc: 'Heals 40 health after every elimination.', icon: 'drop' },
    unlock: { coins: 5000 },
    skins: [skin('default', 'Deep Terror', 0, 'coins', '#5d83a8', '#d7ebf5', '#56e4ff', '#263b52'), skin('abyss', 'Abyss Hunter', 120, 'gems', '#3b4568', '#aab7dd', '#8c4dff', '#181c33')]
  },
  {
    id: 'king', name: 'King', title: 'Crown of Thorns', species: 'lion', rarity: 'mythic', league: 5,
    colors: { body: '#e4a84f', belly: '#ffe6ad', accent: '#ff4d6d', detail: '#603919' },
    stats: { hp: 1320, speed: 5.5, power: 1.28 },
    weapons: ['shotgun', 'lance', 'minigun'],
    passive: { name: "King's Roar", desc: 'Eliminations fear nearby enemies, slowing them for 2 seconds.', icon: 'crown' },
    unlock: { coins: 7500 },
    skins: [skin('default', 'Crown of Thorns', 0, 'coins', '#e4a84f', '#ffe6ad', '#ff4d6d', '#603919'), skin('obsidian', 'Obsidian King', 150, 'gems', '#4b4353', '#b9a6cf', '#ffcf4d', '#211b2a')]
  }
]

export const CHARACTER_MAP = Object.fromEntries(CHARACTERS.map(character => [character.id, character]))

export const LEAGUES = [
  { id: 'bronze', name: 'Bronze', min: 0, color: '#d58c5a', glow: '#ffc18e', icon: 'leaf' },
  { id: 'silver', name: 'Silver', min: 150, color: '#c8d7df', glow: '#f4ffff', icon: 'shield' },
  { id: 'gold', name: 'Gold', min: 400, color: '#ffc84d', glow: '#fff3ad', icon: 'star' },
  { id: 'diamond', name: 'Diamond', min: 800, color: '#64d8ff', glow: '#d6f8ff', icon: 'gem' },
  { id: 'legend', name: 'Legend', min: 1400, color: '#ff6b86', glow: '#ffd3dc', icon: 'crown' }
]

export const ROAD_REWARDS = [
  { at: 40, type: 'coins', amount: 120, label: '120 Coins', icon: 'coin' },
  { at: 80, type: 'chest', chest: 'wood', label: 'Wooden Chest', icon: 'chest' },
  { at: 120, type: 'keys', amount: 1, label: '1 Key', icon: 'key' },
  { at: 180, type: 'character', character: 'kiko', label: 'Kiko', icon: 'paw' },
  { at: 260, type: 'chest', chest: 'silver', label: 'Silver Chest', icon: 'chest' },
  { at: 340, type: 'joker', rarity: 'rare', amount: 1, label: 'Rare Joker', icon: 'joker' },
  { at: 450, type: 'character', character: 'frost', label: 'Frost', icon: 'paw' },
  { at: 600, type: 'chest', chest: 'gold', label: 'Gold Chest', icon: 'chest' },
  { at: 760, type: 'keys', amount: 3, label: '3 Keys', icon: 'key' },
  { at: 900, type: 'character', character: 'blaze', label: 'Blaze', icon: 'paw' },
  { at: 1100, type: 'chest', chest: 'legendary', label: 'Legendary Chest', icon: 'chest' },
  { at: 1300, type: 'character', character: 'mako', label: 'Mako', icon: 'paw' },
  { at: 1500, type: 'skin', character: 'king', skin: 'obsidian', label: 'Obsidian King', icon: 'crown' }
]

export const CHESTS = {
  wood: { name: 'Wooden Chest', rarity: 'common', color: '#b07848', glow: '#e9b879', cost: 400, currency: 'coins', desc: 'A sturdy jungle crate with coins, points and common loot.', minTier: 1 },
  silver: { name: 'Silver Chest', rarity: 'rare', color: '#b7cbd6', glow: '#efffff', cost: 900, currency: 'coins', desc: 'Reliable supplies with a shot at rare jokers.', minTier: 2 },
  gold: { name: 'Gold Chest', rarity: 'legendary', color: '#f2bd43', glow: '#fff2a8', cost: 1800, currency: 'coins', desc: 'Premium loot, item boxes and epic jokers.', minTier: 3 },
  legendary: { name: 'Legendary Chest', rarity: 'mythic', color: '#f56c4e', glow: '#ffdf6b', cost: 90, currency: 'gems', desc: 'The finest loot in the jungle with a chance at a new brawler.', minTier: 4 }
}

export const MISSIONS = [
  { id: 'kills', title: 'Jungle Cleanup', desc: 'Eliminate 5 rivals', target: 5, metric: 'kills', xp: 60, coins: 150, icon: 'skull' },
  { id: 'barrels', title: 'Crate Crasher', desc: 'Break 8 wooden barrels', target: 8, metric: 'barrels', xp: 40, coins: 100, icon: 'bomb' },
  { id: 'pickups', title: 'Armed & Ready', desc: 'Collect 6 weapons', target: 6, metric: 'pickups', xp: 40, coins: 100, icon: 'shotgun' },
  { id: 'damage', title: 'Big Brawler', desc: 'Deal 2,500 damage', target: 2500, metric: 'damage', xp: 80, coins: 200, icon: 'fire' },
  { id: 'wins', title: 'Last Beast Standing', desc: 'Win 1 match', target: 1, metric: 'wins', xp: 120, coins: 300, icon: 'trophy' },
  { id: 'medkits', title: 'Field Medic', desc: 'Use 3 medkits', target: 3, metric: 'medkits', xp: 50, coins: 120, icon: 'heal' }
]

export const PASS_REWARDS = [
  { tier: 1, type: 'coins', amount: 120, label: '120 Coins', icon: 'coin' },
  { tier: 2, type: 'points', amount: 50, label: '50 Character Points', icon: 'star' },
  { tier: 3, type: 'chest', chest: 'wood', label: 'Wooden Chest', icon: 'chest' },
  { tier: 4, type: 'joker', rarity: 'common', amount: 1, label: 'Common Joker', icon: 'joker' },
  { tier: 5, type: 'itemBox', amount: 1, label: 'Item Box', icon: 'box' },
  { tier: 6, type: 'coins', amount: 220, label: '220 Coins', icon: 'coin' },
  { tier: 7, type: 'keys', amount: 1, label: '1 Key', icon: 'key' },
  { tier: 8, type: 'points', amount: 100, label: '100 Character Points', icon: 'star' },
  { tier: 9, type: 'chest', chest: 'silver', label: 'Silver Chest', icon: 'chest' },
  { tier: 10, type: 'joker', rarity: 'rare', amount: 1, label: 'Rare Joker', icon: 'joker' },
  { tier: 11, type: 'itemBox', amount: 1, label: 'Item Box', icon: 'box' },
  { tier: 12, type: 'coins', amount: 350, label: '350 Coins', icon: 'coin' },
  { tier: 13, type: 'keys', amount: 2, label: '2 Keys', icon: 'key' },
  { tier: 14, type: 'points', amount: 150, label: '150 Character Points', icon: 'star' },
  { tier: 15, type: 'chest', chest: 'gold', label: 'Gold Chest', icon: 'chest' },
  { tier: 16, type: 'joker', rarity: 'epic', amount: 1, label: 'Epic Joker', icon: 'joker' },
  { tier: 17, type: 'itemBox', amount: 2, label: '2 Item Boxes', icon: 'box' },
  { tier: 18, type: 'coins', amount: 500, label: '500 Coins', icon: 'coin' },
  { tier: 19, type: 'keys', amount: 3, label: '3 Keys', icon: 'key' },
  { tier: 20, type: 'points', amount: 250, label: '250 Character Points', icon: 'star' },
  { tier: 21, type: 'chest', chest: 'legendary', label: 'Legendary Chest', icon: 'chest' },
  { tier: 22, type: 'joker', rarity: 'legendary', amount: 1, label: 'Legendary Joker', icon: 'joker' },
  { tier: 23, type: 'itemBox', amount: 2, label: '2 Item Boxes', icon: 'box' },
  { tier: 24, type: 'coins', amount: 750, label: '750 Coins', icon: 'coin' },
  { tier: 25, type: 'keys', amount: 4, label: '4 Keys', icon: 'key' },
  { tier: 26, type: 'points', amount: 350, label: '350 Character Points', icon: 'star' },
  { tier: 27, type: 'chest', chest: 'gold', label: 'Gold Chest', icon: 'chest' },
  { tier: 28, type: 'joker', rarity: 'mythic', amount: 1, label: 'Mythic Joker', icon: 'joker' },
  { tier: 29, type: 'itemBox', amount: 3, label: '3 Item Boxes', icon: 'box' },
  { tier: 30, type: 'chest', chest: 'legendary', label: 'Legendary Chest', icon: 'chest' }
]

export const KEY_GATE = [
  { character: 'kiko', cost: 100 },
  { character: 'frost', cost: 200 },
  { character: 'king', cost: 250 }
]

export const BOT_NAMES = ['Riff', 'Nova', 'Pebble', 'Ziggy', 'Moss', 'Tango', 'Vex', 'Bramble', 'Echo', 'Saffron']

export const SHOP_FEATURED = [
  { id: 'starter', name: 'Jungle Starter Pack', desc: '1 Gold Chest, 2 Item Boxes and 300 Coins', price: 60, currency: 'gems', icon: 'gift', rewards: { chest: 'gold', itemBoxes: 2, coins: 300 }, badge: 'BEST VALUE' },
  { id: 'hunter', name: 'Hunter Bundle', desc: '5 Keys, 1 Rare Joker and 150 Character Points', price: 140, currency: 'gems', icon: 'key', rewards: { keys: 5, jokers: { rare: 1 }, points: 150 } },
  { id: 'legend', name: 'Legend Vault', desc: 'Legendary Chest and 2 Legendary Jokers', price: 180, currency: 'gems', icon: 'chest', rewards: { chest: 'legendary', jokers: { legendary: 2 } } }
]

export const ROAD_SKINS = {
  king: 'obsidian'
}

export function tierOf(value) {
  return TIERS[value] || TIERS.wood
}

export function weaponOf(type, tier) {
  const weapon = WEAPON_TYPES[type] || WEAPON_TYPES.shotgun
  const tierData = TIERS[tier] || TIERS.wood
  return {
    type,
    tier,
    name: `${tierData.name} ${weapon.name}`,
    damage: tierData.damage * weapon.damage,
    rate: tierData.rate * weapon.rate,
    range: tierData.range * weapon.range,
    speed: tierData.speed * weapon.speed,
    pellets: weapon.pellets,
    spread: weapon.spread,
    kind: weapon.kind,
    splash: weapon.splash || 0,
    color: tierData.color,
    edge: tierData.edge,
    glow: tierData.glow
  }
}

export function leagueFor(trophies) {
  let result = LEAGUES[0]
  for (const league of LEAGUES) if (trophies >= league.min) result = league
  return result
}

export function leagueIndexFor(trophies) {
  return LEAGUES.findIndex(league => league.id === leagueFor(trophies).id)
}
