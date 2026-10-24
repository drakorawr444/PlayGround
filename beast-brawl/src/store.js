import {
  CHARACTERS, CHARACTER_MAP, CHESTS, ITEM_TYPES, ITEM_RARITY_BOOST, KEY_GATE,
  LEAGUES, MISSIONS, PASS_REWARDS, RARITIES, ROAD_REWARDS, SHOP_FEATURED, TIERS,
  leagueFor, leagueIndexFor, weaponOf
} from './data.js'

const SAVE_KEY = 'beast-brawl-save-v1'
const MAX_PASS_TIER = 30

const freshCharacters = () => Object.fromEntries(CHARACTERS.map(character => [character.id, {
  level: 1,
  upgrades: { damage: 0, health: 0, speed: 0, instinct: 0 },
  skins: ['default'],
  skin: 'default',
  equipped: { weapon: null, gear: null, boots: null, charm: null }
}]))

export function defaultState() {
  return {
    version: 1,
    profile: { name: 'Rookie', level: 1, xp: 0, trophies: 0 },
    currencies: { coins: 2400, gems: 150, keys: 3, points: 250 },
    unlocked: ['rocco', 'bolt', 'luna'],
    starterSquad: ['rocco', 'bolt', 'luna'],
    selected: 'rocco',
    characters: freshCharacters(),
    chests: { wood: 2, silver: 1, gold: 0, legendary: 0 },
    itemBoxes: 1,
    jokers: { common: 2, rare: 1, epic: 0, legendary: 0, mythic: 0 },
    items: [],
    keyGate: { claimed: [] },
    roadClaimed: [],
    pass: { season: 1, xp: 0, claimedTiers: [], missions: {} },
    stats: { matches: 0, wins: 0, kills: 0, damage: 0, barrels: 0, medkits: 0, pickups: 0, bestTrophies: 0, playtime: 0, recent: [] },
    settings: { sound: true, quality: 'high' },
    flags: { starterDraft: false },
    createdAt: Date.now()
  }
}

function merge(base, saved) {
  if (!saved || typeof saved !== 'object') return base
  const result = Array.isArray(base) ? [...base] : { ...base }
  for (const [key, value] of Object.entries(saved)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])) {
      result[key] = merge(base[key], value)
    } else if (value !== undefined) {
      result[key] = value
    }
  }
  return result
}

export class Store {
  constructor() {
    this.state = this.load()
    this.listeners = new Set()
    this.ensureCharacters()
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (!raw) return defaultState()
      return merge(defaultState(), JSON.parse(raw))
    } catch {
      return defaultState()
    }
  }

  save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.state)) } catch {}
    for (const listener of this.listeners) listener(this.state)
  }

  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  ensureCharacters() {
    const base = freshCharacters()
    for (const [id, value] of Object.entries(base)) {
      if (!this.state.characters[id]) this.state.characters[id] = value
      else this.state.characters[id] = merge(value, this.state.characters[id])
    }
    for (const mission of MISSIONS) {
      if (!this.state.pass.missions[mission.id]) this.state.pass.missions[mission.id] = { progress: 0, claimed: false }
    }
    this.state.stats.bestTrophies = Math.max(this.state.stats.bestTrophies, this.state.profile.trophies)
  }

  reset() {
    this.state = defaultState()
    this.save()
  }

  char(id) {
    return this.state.characters[id]
  }

  characterData(id) {
    return CHARACTER_MAP[id]
  }

  isUnlocked(id) {
    return this.state.unlocked.includes(id)
  }

  league() {
    return leagueFor(this.state.profile.trophies)
  }

  leagueIndex() {
    return leagueIndexFor(this.state.profile.trophies)
  }

  canAfford(currency, amount) {
    return (this.state.currencies[currency] || 0) >= amount
  }

  spend(currency, amount) {
    if (!this.canAfford(currency, amount)) return false
    this.state.currencies[currency] -= amount
    this.save()
    return true
  }

  add(currency, amount) {
    this.state.currencies[currency] = (this.state.currencies[currency] || 0) + amount
  }

  notify(message, tone = 'info') {
    window.dispatchEvent(new CustomEvent('bb-toast', { detail: { message, tone } }))
  }

  selectCharacter(id) {
    if (!this.isUnlocked(id)) return false
    this.state.selected = id
    this.save()
    return true
  }

  setStarterSquad(ids) {
    const valid = ids.filter(id => this.isUnlocked(id) && CHARACTER_MAP[id].league === 1).slice(0, 3)
    if (valid.length !== 3) return false
    this.state.starterSquad = valid
    this.state.flags.starterDraft = true
    this.save()
    return true
  }

  unlockCharacter(id, { silent = false } = {}) {
    const character = CHARACTER_MAP[id]
    if (!character || this.isUnlocked(id)) return { ok: false, reason: 'owned' }
    if (this.leagueIndex() + 1 < character.league) return { ok: false, reason: 'league' }
    const cost = character.unlock.coins || 0
    if (!this.spend('coins', cost)) return { ok: false, reason: 'coins' }
    this.state.unlocked.push(id)
    this.save()
    if (!silent) this.notify(`${character.name} joined the brawl!`, 'success')
    return { ok: true, character }
  }

  levelCost(id) {
    const level = this.char(id).level
    return 80 + level * 45
  }

  levelUp(id) {
    const character = CHARACTER_MAP[id]
    if (!character) return false
    const cost = this.levelCost(id)
    if (!this.canAfford('points', cost)) return false
    if (this.char(id).level >= 20) return false
    this.spend('points', cost)
    this.char(id).level += 1
    this.save()
    this.notify(`${character.name} reached level ${this.char(id).level}!`, 'success')
    return true
  }

  upgradeCost(track, level) {
    return 240 + level * 180 + (track === 'instinct' ? 120 : 0)
  }

  upgradeCharacter(id, track) {
    const state = this.char(id)
    if (!state || state.upgrades[track] >= 10) return false
    const cost = this.upgradeCost(track, state.upgrades[track])
    if (!this.spend('coins', cost)) return false
    state.upgrades[track] += 1
    this.save()
    return true
  }

  unlockSkin(characterId, skinId) {
    const character = CHARACTER_MAP[characterId]
    const state = this.char(characterId)
    const skin = character?.skins.find(entry => entry.id === skinId)
    if (!skin || state.skins.includes(skinId)) return false
    if (!this.spend(skin.currency, skin.cost)) return false
    state.skins.push(skinId)
    state.skin = skinId
    this.save()
    return true
  }

  equipSkin(characterId, skinId) {
    const state = this.char(characterId)
    if (!state.skins.includes(skinId)) return false
    state.skin = skinId
    this.save()
    return true
  }

  skinColors(characterId) {
    const character = CHARACTER_MAP[characterId]
    const state = this.char(characterId)
    return character.skins.find(entry => entry.id === state.skin)?.colors || character.colors
  }

  battleLoadout(characterId) {
    const character = CHARACTER_MAP[characterId]
    const state = this.char(characterId)
    const rarityOrder = RARITIES[character.rarity].order
    const baseTier = ['wood', 'rock', 'copper', 'iron', 'gold'][Math.min(4, rarityOrder - 1)] || 'wood'
    const equipped = Object.values(state.equipped).filter(Boolean).map(uid => this.state.items.find(item => item.uid === uid)).filter(Boolean)
    const boost = (stat) => equipped.filter(item => ITEM_TYPES[item.type].stat === stat).reduce((sum, item) => sum + (ITEM_RARITY_BOOST[item.rarity] + (item.level - 1) * 1.6), 0)
    const damageBoost = boost('damage')
    const healthBoost = boost('health')
    const speedBoost = boost('speed')
    const instinctBoost = boost('instinct')
    const levelScale = 1 + (state.level - 1) * 0.018
    const hp = character.stats.hp * levelScale * (1 + state.upgrades.health * 0.03 + healthBoost / 100)
    const speed = character.stats.speed * (1 + state.upgrades.speed * 0.018 + speedBoost / 100)
    const damage = character.stats.power * (1 + state.upgrades.damage * 0.028 + damageBoost / 100)
    const instinct = 1 + state.upgrades.instinct * 0.06 + instinctBoost / 100
    const weapons = character.weapons.map((type, index) => weaponOf(type, index === 0 ? baseTier : 'wood'))
    return {
      id: characterId,
      name: character.name,
      species: character.species,
      colors: this.skinColors(characterId),
      rarity: character.rarity,
      hp,
      speed,
      damage,
      instinct,
      weapons,
      passive: character.passive,
      shieldStart: characterId === 'frost' ? 180 * instinct : 0
    }
  }

  chestPrice(type) {
    return CHESTS[type]
  }

  buyChest(type) {
    const chest = CHESTS[type]
    if (!chest) return false
    if (!this.spend(chest.currency, chest.cost)) return false
    this.state.chests[type] += 1
    this.save()
    return true
  }

  grantChest(type) {
    if (this.state.chests[type] !== undefined) this.state.chests[type] += 1
  }

  openChest(type) {
    if ((this.state.chests[type] || 0) <= 0) return null
    this.state.chests[type] -= 1
    const rewards = this.rollChest(type)
    for (const reward of rewards) this.applyReward(reward)
    this.save()
    return rewards
  }

  rollChest(type) {
    const rarity = CHESTS[type].rarity
    const scale = { common: 1, rare: 2.1, legendary: 3.5, mythic: 5 }[rarity] || 1
    const rewards = []
    const coins = Math.round((90 + Math.random() * 160) * scale)
    rewards.push({ type: 'coins', amount: coins, label: `${coins} Coins`, icon: 'coin', rarity: 'common' })
    const points = Math.round((25 + Math.random() * 55) * scale)
    rewards.push({ type: 'points', amount: points, label: `${points} Character Points`, icon: 'star', rarity: 'rare' })
    if (type === 'wood') {
      if (Math.random() < 0.6) rewards.push(this.jokerReward('common'))
    } else if (type === 'silver') {
      rewards.push(this.jokerReward('common'))
      if (Math.random() < 0.55) rewards.push(this.jokerReward('rare'))
      if (Math.random() < 0.55) rewards.push({ type: 'keys', amount: 1, label: '1 Key', icon: 'key', rarity: 'rare' })
    } else if (type === 'gold') {
      rewards.push({ type: 'itemBox', amount: 1, label: '1 Item Box', icon: 'box', rarity: 'epic' })
      rewards.push(this.jokerReward('rare'))
      if (Math.random() < 0.6) rewards.push(this.jokerReward('epic'))
      rewards.push({ type: 'keys', amount: 1 + Math.floor(Math.random() * 2), label: 'Keys', icon: 'key', rarity: 'epic' })
    } else {
      rewards.push({ type: 'itemBox', amount: 1 + Math.floor(Math.random() * 2), label: 'Item Boxes', icon: 'box', rarity: 'legendary' })
      rewards.push(this.jokerReward('epic'))
      rewards.push(this.jokerReward('legendary'))
      if (Math.random() < 0.35) rewards.push(this.jokerReward('mythic'))
      rewards.push({ type: 'keys', amount: 2 + Math.floor(Math.random() * 2), label: 'Keys', icon: 'key', rarity: 'legendary' })
      const locked = CHARACTERS.filter(character => !this.isUnlocked(character.id) && character.league <= this.leagueIndex() + 1 && character.rarity !== 'mythic')
      if (locked.length && Math.random() < 0.4) {
        const character = locked[Math.floor(Math.random() * locked.length)]
        this.state.unlocked.push(character.id)
        rewards.push({ type: 'character', character: character.id, label: character.name, icon: 'paw', rarity: 'legendary' })
      }
    }
    return rewards
  }

  jokerReward(rarity) {
    return { type: 'joker', rarity, amount: 1, label: `${RARITIES[rarity].name} Joker`, icon: 'joker', rarity }
  }

  applyReward(reward) {
    if (reward.type === 'coins') this.add('coins', reward.amount)
    else if (reward.type === 'points') this.add('points', reward.amount)
    else if (reward.type === 'gems') this.add('gems', reward.amount)
    else if (reward.type === 'keys') this.add('keys', reward.amount)
    else if (reward.type === 'joker') this.state.jokers[reward.rarity] = (this.state.jokers[reward.rarity] || 0) + reward.amount
    else if (reward.type === 'chest') this.grantChest(reward.chest)
    else if (reward.type === 'itemBox') this.state.itemBoxes += reward.amount
    else if (reward.type === 'character' && !this.isUnlocked(reward.character)) this.state.unlocked.push(reward.character)
    else if (reward.type === 'skin') {
      const state = this.char(reward.character)
      if (!state.skins.includes(reward.skin)) state.skins.push(reward.skin)
      state.skin = reward.skin
    }
  }

  openItemBox() {
    if (this.state.itemBoxes <= 0) return null
    this.state.itemBoxes -= 1
    const character = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]
    const types = Object.keys(ITEM_TYPES)
    const type = types[Math.floor(Math.random() * types.length)]
    const rarityRoll = Math.random()
    const rarity = rarityRoll < 0.48 ? 'common' : rarityRoll < 0.78 ? 'rare' : rarityRoll < 0.93 ? 'epic' : rarityRoll < 0.99 ? 'legendary' : 'mythic'
    const item = { uid: `item_${Date.now()}_${Math.floor(Math.random() * 9999)}`, type, rarity, level: 1, characterId: character.id }
    this.state.items.push(item)
    this.autoEquip(item)
    this.save()
    return { item, character }
  }

  autoEquip(item) {
    const slot = ITEM_TYPES[item.type].slot
    const state = this.char(item.characterId)
    const currentId = state.equipped[slot]
    const current = currentId ? this.state.items.find(entry => entry.uid === currentId) : null
    if (!current || RARITIES[item.rarity].order > RARITIES[current.rarity].order) {
      state.equipped[slot] = item.uid
    }
  }

  equipItem(uid) {
    const item = this.state.items.find(entry => entry.uid === uid)
    if (!item) return false
    this.char(item.characterId).equipped[ITEM_TYPES[item.type].slot] = uid
    this.save()
    return true
  }

  itemUpgradeCost(item) {
    return { jokers: item.level, gems: 20 + item.level * 15 }
  }

  upgradeItem(uid, withGems = false) {
    const item = this.state.items.find(entry => entry.uid === uid)
    if (!item || item.level >= 10) return false
    const cost = this.itemUpgradeCost(item)
    if (withGems) {
      if (!this.spend('gems', cost.gems)) return false
    } else {
      if ((this.state.jokers[item.rarity] || 0) < cost.jokers) return false
      this.state.jokers[item.rarity] -= cost.jokers
    }
    item.level += 1
    this.save()
    return true
  }

  itemsFor(characterId) {
    return this.state.items.filter(item => item.characterId === characterId)
  }

  equippedItem(characterId, slot) {
    const uid = this.char(characterId).equipped[slot]
    return this.state.items.find(item => item.uid === uid) || null
  }

  roadProgress() {
    return Math.min(1, this.state.profile.trophies / LEAGUES[LEAGUES.length - 1].min)
  }

  canClaimRoad(index) {
    const reward = ROAD_REWARDS[index]
    return reward && this.state.profile.trophies >= reward.at && !this.state.roadClaimed.includes(index)
  }

  claimRoad(index) {
    if (!this.canClaimRoad(index)) return null
    const reward = ROAD_REWARDS[index]
    this.state.roadClaimed.push(index)
    this.applyReward(reward)
    this.save()
    return reward
  }

  passTier() {
    return Math.min(MAX_PASS_TIER, Math.floor(this.state.pass.xp / 120) + 1)
  }

  passProgress() {
    const tier = this.passTier()
    if (tier >= MAX_PASS_TIER) return 1
    return (this.state.pass.xp % 120) / 120
  }

  claimPassTier(tier) {
    if (tier > this.passTier() || this.state.pass.claimedTiers.includes(tier)) return null
    const reward = PASS_REWARDS.find(entry => entry.tier === tier)
    if (!reward) return null
    this.state.pass.claimedTiers.push(tier)
    this.applyReward(reward)
    this.save()
    return reward
  }

  claimMission(id) {
    const mission = MISSIONS.find(entry => entry.id === id)
    const state = this.state.pass.missions[id]
    if (!mission || !state || state.claimed || state.progress < mission.target) return null
    state.claimed = true
    this.state.pass.xp += mission.xp
    this.add('coins', mission.coins)
    this.save()
    return mission
  }

  bumpMission(metric, amount) {
    if (!amount) return
    for (const mission of MISSIONS) {
      if (mission.metric !== metric) continue
      const state = this.state.pass.missions[mission.id]
      state.progress = Math.min(mission.target, state.progress + amount)
    }
  }

  buyShop(id) {
    const offer = SHOP_FEATURED.find(entry => entry.id === id)
    if (!offer) return false
    if (!this.spend(offer.currency, offer.price)) return false
    if (offer.rewards.chest) this.grantChest(offer.rewards.chest)
    if (offer.rewards.itemBoxes) this.state.itemBoxes += offer.rewards.itemBoxes
    if (offer.rewards.coins) this.add('coins', offer.rewards.coins)
    if (offer.rewards.keys) this.add('keys', offer.rewards.keys)
    if (offer.rewards.points) this.add('points', offer.rewards.points)
    if (offer.rewards.jokers) {
      for (const [rarity, amount] of Object.entries(offer.rewards.jokers)) this.state.jokers[rarity] = (this.state.jokers[rarity] || 0) + amount
    }
    this.save()
    return true
  }

  buyPoints(amount, currency, price) {
    if (!this.spend(currency, price)) return false
    this.add('points', amount)
    this.save()
    return true
  }

  buyKeys(amount, currency, price) {
    if (!this.spend(currency, price)) return false
    this.add('keys', amount)
    this.save()
    return true
  }

  buyJoker(rarity, currency, price) {
    if (!this.spend(currency, price)) return false
    this.state.jokers[rarity] = (this.state.jokers[rarity] || 0) + 1
    this.save()
    return true
  }

  keyGateAvailable(index) {
    return !this.state.keyGate.claimed.includes(index) && !this.isUnlocked(KEY_GATE[index].character)
  }

  claimKeyGate(index) {
    const entry = KEY_GATE[index]
    if (!entry || !this.keyGateAvailable(index)) return false
    if (this.state.keyGate.claimed.length !== index) return false
    if (!this.spend('keys', entry.cost)) return false
    this.state.keyGate.claimed.push(index)
    if (!this.isUnlocked(entry.character)) this.state.unlocked.push(entry.character)
    this.save()
    return true
  }

  addTrophies(amount) {
    this.state.profile.trophies = Math.max(0, this.state.profile.trophies + amount)
    this.state.stats.bestTrophies = Math.max(this.state.stats.bestTrophies, this.state.profile.trophies)
  }

  awardMatch(result) {
    const placement = result.placement || 8
    const win = Boolean(result.win)
    const trophyChange = win ? 28 : placement === 2 ? 18 : placement === 3 ? 12 : placement <= 5 ? 4 : placement <= 8 ? -6 : -12
    this.addTrophies(trophyChange)
    const placementCoins = win ? 260 : placement <= 3 ? 140 : placement <= 6 ? 80 : 40
    const coins = placementCoins + (result.kills || 0) * 28 + Math.min(180, Math.floor((result.damage || 0) / 12))
    const xp = 40 + (result.kills || 0) * 12 + (win ? 70 : 0) + Math.max(0, 9 - placement) * 5
    this.add('coins', coins)
    this.state.pass.xp += xp
    this.state.stats.matches += 1
    this.state.stats.wins += win ? 1 : 0
    this.state.stats.kills += result.kills || 0
    this.state.stats.damage += Math.floor(result.damage || 0)
    this.state.stats.barrels += result.barrels || 0
    this.state.stats.medkits += result.medkits || 0
    this.state.stats.pickups += result.pickups || 0
    this.state.stats.playtime += result.duration || 0
    this.bumpMission('kills', result.kills || 0)
    this.bumpMission('barrels', result.barrels || 0)
    this.bumpMission('pickups', result.pickups || 0)
    this.bumpMission('damage', Math.floor(result.damage || 0))
    this.bumpMission('wins', win ? 1 : 0)
    this.bumpMission('medkits', result.medkits || 0)
    const summary = {
      placement,
      win,
      kills: result.kills || 0,
      damage: Math.floor(result.damage || 0),
      coins,
      xp,
      trophies: trophyChange,
      duration: result.duration || 0,
      bossKilled: Boolean(result.bossKilled)
    }
    this.state.stats.recent.unshift({ ...summary, character: result.character || this.state.selected, at: Date.now() })
    this.state.stats.recent = this.state.stats.recent.slice(0, 8)
    this.save()
    return summary
  }
}

export const store = new Store()
