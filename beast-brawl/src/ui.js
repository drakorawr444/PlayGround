import {
  CHARACTERS, CHARACTER_MAP, CHESTS, ITEM_RARITY_BOOST, ITEM_TYPES,
  KEY_GATE, LEAGUES, MISSIONS, PASS_REWARDS, RARITIES, ROAD_REWARDS, SHOP_FEATURED, TIERS,
  WEAPON_TYPES, leagueFor, weaponOf
} from './data.js'

const ICONS = {
  home: '<path d="M4 11.2 12 4l8 7.2"/><path d="M6 10.5V20h12v-9.5"/><path d="M10 20v-5h4v5"/>',
  paw: '<circle cx="7" cy="8" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="17" cy="8" r="2"/><path d="M7 14c0-3 2.2-5 5-5s5 2 5 5c0 2.7-2.3 4.5-5 4.5S7 16.7 7 14Z"/>',
  road: '<path d="M6 3h12l-1.2 18H7.2L6 3Z"/><path d="M12 6v3M12 12v3M12 18v1"/>',
  upgrade: '<path d="M12 20V5"/><path d="m6 11 6-6 6 6"/><path d="M5 20h14"/>',
  stats: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  chest: '<path d="M3 10h18v9H3z"/><path d="M4 10V7l2-2h12l2 2v3"/><path d="M3 13h18"/><path d="M10 10v4h4v-4"/>',
  shop: '<path d="M4 9h16l-1 11H5L4 9Z"/><path d="M8 9V7a4 4 0 0 1 8 0v2"/><path d="M9 14h6"/>',
  pass: '<path d="M6 3h12v18l-6-3-6 3V3Z"/><path d="M9 8h6M9 12h4"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M9.5 9.5h4a2 2 0 0 1 0 4h-3a2 2 0 0 0 0 4h4"/>',
  gem: '<path d="m12 3 6 6-6 12L6 9l6-6Z"/><path d="M6 9h12M9 9l3 12 3-12"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 8-8M15 8l2 2M17 6l2 2"/>',
  joker: '<rect x="4" y="6" width="12" height="15" rx="2" transform="rotate(-9 10 13)"/><path d="m14 3 5 2-2 5"/><circle cx="10" cy="12" r="1.5"/><path d="M8 16h4"/>',
  star: '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.4l6.1-.9L12 3Z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.1A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3V9.6h.1A1.7 1.7 0 0 0 4.6 8.5a1.7 1.7 0 0 0-.34-1.88l-.06-.06L7.06 3.7l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.5 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 9c.12.4.35.75.66 1 .3.26.7.4 1.1.4h.14v4h-.1A1.7 1.7 0 0 0 19.4 15Z"/>',
  play: '<path d="m8 5 11 7-11 7V5Z"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  fire: '<path d="M12 21c-4 0-7-2.7-7-6.5 0-3.5 2.4-5.8 4-8.5 0 2.6 1.4 4 2.6 4.4C12.8 7.6 13.5 4.5 15 3c.1 3 4 5.6 4 11.5C19 18.3 16 21 12 21Z"/>',
  shield: '<path d="M12 3 20 6v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6l8-3Z"/><path d="m8.5 12 2.3 2.3 4.7-5"/>',
  heal: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 7v10M7 12h10"/>',
  trap: '<path d="M4 16c2-6 6-9 8-9s6 3 8 9"/><path d="m6 16 1.5-3M10 16l.8-3.5M14 16l-.8-3.5M18 16l-1.5-3"/><path d="M4 20h16"/>',
  speed: '<path d="m13 2-8 12h6l-1 8 8-12h-6l1-8Z"/>',
  wall: '<path d="M3 5h18v14H3z"/><path d="M3 10h18M3 15h18M8 5v5M16 5v5M12 10v5M8 15v4M16 15v4"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>',
  skull: '<path d="M12 3a7 7 0 0 0-7 7c0 2.5 1.2 4 2.5 5v3h9v-3c1.3-1 2.5-2.5 2.5-5a7 7 0 0 0-7-7Z"/><circle cx="9" cy="11" r="1.5"/><circle cx="15" cy="11" r="1.5"/><path d="M10 18v3M14 18v3"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 5H4v2a4 4 0 0 0 4 4M16 5h4v2a4 4 0 0 1-4 4"/><path d="M12 13v4M8 21h8M9 21c0-2 1-4 3-4s3 2 3 4"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  box: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
  gift: '<path d="M4 10h16v11H4z"/><path d="M3 7h18v3H3zM12 7v14"/><path d="M12 7c-2 0-4-1-4-2.5S10 2 12 7ZM12 7c2 0 4-1 4-2.5S14 2 12 7Z"/>',
  crown: '<path d="m3 7 4 4 5-6 5 6 4-4-2 11H5L3 7Z"/><path d="M6 21h12"/>',
  leaf: '<path d="M20 4C12 3 4 7 4 14c0 3 2 5 5 5 7 0 11-8 11-15Z"/><path d="M5 19c3-6 7-9 12-12"/>',
  snow: '<path d="M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9"/><path d="m9 5 3 2 3-2M9 19l3-2 3 2"/>',
  moon: '<path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/>',
  spark: '<path d="m12 2 2 7 7 2-7 2-2 7-2-7-7-2 7-2 2-7Z"/>',
  bomb: '<circle cx="10" cy="14" r="6"/><path d="M14 9c0-2 1-3 3-3 1 0 2 .5 2.5 1.5M18 3v2M21 6h-2"/>',
  eye: '<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
  crosshair: '<circle cx="12" cy="12" r="7"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/>',
  swirl: '<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/>',
  drop: '<path d="M12 3S6 10 6 14a6 6 0 0 0 12 0c0-4-6-11-6-11Z"/>',
  shotgun: '<path d="M3 9h9l3 3h5v3h-5l-2 2H8l-2-2H3V9Z"/><path d="M12 9v3M6 14v3"/>',
  bow: '<path d="M5 4c6 3 8 8 6 16"/><path d="m5 4 4 16M5 12h11"/><path d="m13 10 4 2-4 2"/>',
  lance: '<path d="m4 20 14-14"/><path d="m15 4 5 5-5 2-2-5 2-2Z"/><path d="m6 16 2 2"/>',
  staff: '<path d="M6 21 16 5"/><circle cx="17" cy="4" r="3"/><path d="M5 18h5"/>',
  crossbow: '<path d="M4 12h16M12 4v16M7 6l5 6 5-6M7 18l5-6 5 6"/>',
  minigun: '<path d="M3 10h9v5H3z"/><path d="M12 8v9M15 8v9M18 8v9M21 8v9"/><path d="M3 12H1v3h2"/>',
  fang: '<path d="M5 4c4 2 6 7 5 13-2-2-4-4-5-7-1-2-1-4 0-6Z"/><path d="M19 4c-4 2-6 7-5 13 2-2 4-4 5-7 1-2 1-4 0-6Z"/>',
  vest: '<path d="M8 3 5 6v15h14V6l-3-3-3 4-3-4Z"/><path d="M9 13h6M12 10v6"/>',
  boots: '<path d="M7 3v11l-3 3v4h10v-4l-3-3V3H7Z"/><path d="M11 18h4a3 3 0 0 1 3 3H8"/>',
  charm: '<circle cx="12" cy="12" r="6"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="2"/>',
  bolt: '<path d="m13 2-8 12h6l-1 8 8-12h-6l1-8Z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
  sound: '<path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16 8a6 6 0 0 1 0 8M19 5a10 10 0 0 1 0 14"/>',
  refresh: '<path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M6.1 9a7 7 0 0 1 11.6-2L20 9M4 15l2.3 2A7 7 0 0 0 18 15"/>'
}

export function icon(name, className = '') {
  const path = ICONS[name] || ICONS.info
  return `<svg class="svg-icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`
}

const NAV = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'characters', label: 'Brawlers', icon: 'paw' },
  { id: 'road', label: 'Trophy Road', icon: 'road' },
  { id: 'upgrades', label: 'Upgrades', icon: 'upgrade' },
  { id: 'stats', label: 'Stats', icon: 'stats' },
  { id: 'chests', label: 'Chests', icon: 'chest' },
  { id: 'shop', label: 'Shop', icon: 'shop' },
  { id: 'pass', label: 'Battle Pass', icon: 'pass' }
]

const number = value => Math.round(value).toLocaleString('en-US')
const percent = value => `${Math.round(value * 100)}%`
const rarityOf = id => RARITIES[CHARACTER_MAP[id]?.rarity || 'common']

function chestSvg(type) {
  const colors = {
    wood: ['#a86d3d', '#6e4126', '#f0c07b', '#8b512c'],
    silver: ['#b7cbd6', '#768c99', '#f0ffff', '#91a9b4'],
    gold: ['#f2bd43', '#9b5d18', '#fff1a1', '#d39122'],
    legendary: ['#f56c4e', '#8d2d23', '#ffe36b', '#c04a36']
  }[type] || ['#a86d3d', '#6e4126', '#f0c07b', '#8b512c']
  const [body, dark, light, mid] = colors
  return `<svg viewBox="0 0 150 118" aria-hidden="true">
    <ellipse cx="75" cy="106" rx="49" ry="8" fill="rgba(0,0,0,.3)"/>
    <path d="M23 48h104v53H23z" fill="${body}" stroke="${dark}" stroke-width="3"/>
    <path d="M20 48c0-18 13-29 55-29s55 11 55 29H20Z" fill="${mid}" stroke="${dark}" stroke-width="3"/>
    <path d="M30 29c8-13 21-18 45-18s37 5 45 18" fill="${light}" opacity=".3"/>
    <rect x="33" y="49" width="10" height="52" fill="${light}" opacity=".6"/>
    <rect x="107" y="49" width="10" height="52" fill="${light}" opacity=".6"/>
    <rect x="20" y="68" width="110" height="9" fill="${light}" opacity=".75"/>
    <rect x="65" y="58" width="20" height="28" rx="4" fill="${light}"/>
    <rect x="70" y="65" width="10" height="12" rx="2" fill="${dark}"/>
    <path d="M75 17v-8M62 23l-4-7M88 23l4-7" stroke="${light}" stroke-width="3" stroke-linecap="round" opacity=".7"/>
  </svg>`
}

function weaponIcon(type) {
  return icon(WEAPON_TYPES[type]?.icon || 'shotgun')
}

function currencyIcon(currency) {
  return icon({ coins: 'coin', gems: 'gem', keys: 'key', points: 'star' }[currency] || 'coin')
}

function leagueName(character) {
  return LEAGUES[Math.min(LEAGUES.length - 1, character.league - 1)].name
}

function itemRarityColor(item) {
  return RARITIES[item.rarity].color
}

function itemStatText(item) {
  const boost = ITEM_RARITY_BOOST[item.rarity] + (item.level - 1) * 1.6
  return `+${boost.toFixed(1)}% ${ITEM_TYPES[item.type].label}`
}

function timeAgo(timestamp) {
  const minutes = Math.floor((Date.now() - timestamp) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export class UI {
  constructor({ store, audio, portraits, menuScene, onPlay }) {
    this.store = store
    this.audio = audio
    this.portraits = portraits
    this.menuScene = menuScene
    this.onPlay = onPlay
    this.page = 'home'
    this.characterFilter = 'all'
    this.upgradeCharacter = store.state.selected
    this.passTab = 'missions'
    this.draft = [...store.state.starterSquad]
    this.modalType = null
    this.modalData = null
    this.modalRoot = document.getElementById('modal-root')
    this.toastRoot = document.getElementById('toast-root')
    this.pageRoot = document.getElementById('page')
    this.bind()
    this.renderShell()
    this.renderTopbar()
    this.renderPage()
  }

  bind() {
    document.addEventListener('click', event => {
      const target = event.target.closest('[data-action]')
      if (!target) return
      if (!target.disabled) this.audio.init()
      this.handleAction(target.dataset.action, target.dataset, event)
    })
    window.addEventListener('bb-toast', event => this.toast(event.detail.message, event.detail.tone))
  }

  handleAction(action, data, event) {
    const actions = {
      play: () => this.play(),
      nav: () => this.go(data.page),
      'open-character': () => this.openCharacter(data.character),
      'select-character': () => this.selectCharacter(data.character),
      'unlock-character': () => this.unlockCharacter(data.character),
      'level-up': () => this.levelUp(data.character),
      'upgrade-character': () => this.upgradeCharacter(data.character, data.track),
      'select-upgrade-character': () => this.selectUpgradeCharacter(data.character),
      'unlock-skin': () => this.unlockSkin(data.character, data.skin),
      'equip-skin': () => this.equipSkin(data.character, data.skin),
      'open-item': () => this.openItem(data.item),
      'upgrade-item': () => this.upgradeItem(data.item, false),
      'upgrade-item-gems': () => this.upgradeItem(data.item, true),
      'equip-item': () => this.equipItem(data.item),
      'open-chest': () => this.openChest(data.chest),
      'buy-chest': () => this.buyChest(data.chest),
      'open-item-box': () => this.openItemBox(),
      'buy-featured': () => this.buyFeatured(data.offer),
      'buy-points': () => this.buyPoints(data.amount, data.currency, data.price),
      'buy-keys': () => this.buyKeys(data.amount, data.currency, data.price),
      'buy-joker': () => this.buyJoker(data.rarity, data.currency, data.price),
      'claim-road': () => this.claimRoad(data.index),
      'claim-pass': () => this.claimPass(data.tier),
      'claim-mission': () => this.claimMission(data.mission),
      'pass-tab': () => this.setPassTab(data.tab),
      'char-filter': () => this.setCharacterFilter(data.filter),
      'starter-draft': () => this.openStarterDraft(),
      'toggle-draft': () => this.toggleDraft(data.character),
      'save-starters': () => this.saveStarters(),
      'claim-key-gate': () => this.claimKeyGate(data.index),
      'open-settings': () => this.openSettings(),
      settings: () => this.openSettings(),
      profile: () => this.go('stats'),
      'go-shop': () => this.go('shop'),
      'close-modal': () => this.closeModal(),
      'toggle-sound': () => this.toggleSound(),
      'reset-save': () => this.resetSave(),
      'open-mode': () => this.play()
    }
    if (actions[action]) actions[action]()
  }

  play() {
    this.closeModal()
    this.audio.click()
    this.onPlay(this.store.state.selected)
  }

  go(page) {
    if (!NAV.some(item => item.id === page)) return
    if (this.modalRoot.classList.contains('open')) this.closeModal()
    this.audio.tab()
    this.page = page
    this.renderPage()
    this.renderNav()
    this.pageRoot.scrollTop = 0
  }

  renderShell() {
    document.getElementById('side-nav').innerHTML = NAV.map(item => `
      <button class="nav-item" data-action="nav" data-page="${item.id}" data-nav="${item.id}" aria-label="${item.label}">
        ${icon(item.icon)}<span>${item.label.split(' ')[0]}</span>
      </button>
    `).join('')
    document.getElementById('mobile-nav').innerHTML = NAV.map(item => `
      <button class="nav-item" data-action="nav" data-page="${item.id}" data-nav="${item.id}" aria-label="${item.label}">
        ${icon(item.icon)}<span>${item.label.split(' ')[0]}</span>
      </button>
    `).join('')
    document.getElementById('settings-btn').innerHTML = icon('settings')
    this.renderNav()
  }

  renderNav() {
    document.querySelectorAll('[data-nav]').forEach(node => {
      node.classList.toggle('active', node.dataset.nav === this.page)
    })
  }

  renderTopbar() {
    const state = this.store.state
    const profileLevel = 1 + Math.floor(state.pass.xp / 260)
    const profileXp = (state.pass.xp % 260) / 260
    document.getElementById('profile-name').textContent = state.profile.name
    document.getElementById('profile-level').textContent = `LV ${profileLevel}`
    document.getElementById('profile-trophies').textContent = number(state.profile.trophies)
    document.getElementById('profile-avatar').textContent = (CHARACTER_MAP[state.selected]?.name || 'R')[0]
    document.getElementById('profile-xp-fill').style.width = `${profileXp * 100}%`
    const currencies = [
      ['coins', state.currencies.coins, 'coin', 'Coins'],
      ['gems', state.currencies.gems, 'gem', 'Gems'],
      ['keys', state.currencies.keys, 'key', 'Keys'],
      ['points', state.currencies.points, 'star', 'Character Points']
    ]
    document.getElementById('currency-row').innerHTML = currencies.map(([key, value, iconName, label]) => `
      <button class="currency-pill ${key}" data-action="go-shop" title="${label}">
        ${icon(iconName)}<span>${number(value)}</span><span class="plus">+</span>
      </button>
    `).join('')
  }

  renderPage() {
    const pages = {
      home: () => this.homePage(),
      characters: () => this.charactersPage(),
      road: () => this.roadPage(),
      upgrades: () => this.upgradesPage(),
      stats: () => this.statsPage(),
      chests: () => this.chestsPage(),
      shop: () => this.shopPage(),
      pass: () => this.passPage()
    }
    this.pageRoot.innerHTML = `<div class="page-inner">${(pages[this.page] || pages.home)()}</div>`
    document.body.classList.toggle('menu-page', this.page !== 'home')
    this.renderNav()
  }

  refresh() {
    this.renderTopbar()
    if (!this.modalRoot.classList.contains('open')) this.renderPage()
  }

  homePage() {
    const state = this.store.state
    const selected = CHARACTER_MAP[state.selected]
    const selectedState = this.store.char(state.selected)
    const rarity = RARITIES[selected.rarity]
    const league = this.store.league()
    const passTier = this.store.passTier()
    const passProgress = this.store.passProgress()
    const missions = MISSIONS.slice(0, 3).map(mission => {
      const progress = state.pass.missions[mission.id] || { progress: 0, claimed: false }
      return { mission, progress }
    })
    const starter = state.starterSquad.map(id => CHARACTER_MAP[id]).filter(Boolean)
    return `
      <section class="home-grid">
        <div class="home-copy">
          <div class="eyebrow"><span class="pulse"></span> SEASON 1 · JUNGLE AWAKENS</div>
          <h1 class="hero-title">BEAST<span class="accent">BRAWL</span></h1>
          <p class="hero-sub">Drop into the wild. Grab better guns, smash barrels, outsmart <strong>8 rivals</strong> and hunt the <strong>Legendary Guard</strong> for the only legendary weapon in the match.</p>
          <div class="hero-actions">
            <button class="btn btn-primary btn-lg btn-play" data-action="play"><span class="play-triangle"></span> Play</button>
            <button class="mode-chip" data-action="open-mode">
              <span class="mode-icon">${icon('paw')}</span>
              <span><strong>Solo Showdown</strong><small>8 RIVALS · 1 BOSS</small></span>
            </button>
          </div>
          <div class="home-meta">
            <span>${icon('shield')} ${league.name} League</span>
            <span>${icon('trophy')} ${number(state.profile.trophies)} Trophies</span>
            <span>${icon('paw')} ${state.unlocked.length}/12 Brawlers</span>
          </div>
        </div>
        <div class="home-spacer"></div>
        <div class="home-side">
          <div class="panel mission-card">
            <div class="panel-head">${icon('pass')}<h3>Battle Pass Missions</h3><span class="spacer"></span><button class="tiny-link" data-action="nav" data-page="pass">VIEW ALL</button></div>
            <div class="mission-list">
              ${missions.map(({ mission, progress }) => {
                const ratio = Math.min(1, progress.progress / mission.target)
                const ready = progress.progress >= mission.target && !progress.claimed
                return `<div class="mini-mission">
                  <span class="mini-mission-icon">${icon(mission.icon)}</span>
                  <span class="mini-mission-copy"><strong>${mission.title}</strong><small>${progress.claimed ? 'Claimed' : `${number(progress.progress)} / ${number(mission.target)}`}</small><span class="mini-progress"><span style="width:${ratio * 100}%"></span></span></span>
                  <button class="mission-claim ${ready ? 'ready' : ''}" data-action="claim-mission" data-mission="${mission.id}" ${ready ? '' : 'disabled'}>${progress.claimed ? icon('check') : ready ? icon('gift') : icon('arrow')}</button>
                </div>`
              }).join('')}
            </div>
          </div>
          <div class="panel starter-card">
            <div class="panel-head">${icon('paw')}<h3>Starter Squad</h3><span class="spacer"></span><span class="badge">FREE</span></div>
            <div class="starter-row">
              ${starter.map(character => `<button class="starter-slot" data-action="select-character" data-character="${character.id}" title="Select ${character.name}">
                <img src="${this.portraits.get(character.id)}" alt="${character.name}">
                <span>${character.name}</span>
              </button>`).join('')}
            </div>
            <div class="starter-actions">
              <button class="btn btn-sm btn-ghost" data-action="starter-draft">${icon('refresh')} Swap Starters</button>
              <button class="btn btn-sm btn-primary" data-action="open-character" data-character="${state.selected}">${icon('arrow')} Inspect</button>
            </div>
          </div>
          <div class="panel pass-promo">
            <span class="badge purple">${icon('pass')} TIER ${passTier}</span>
            <strong>JUNGLE<br>AWAKENS</strong>
            <p>Earn XP from missions and matches. Unlock chests, keys, jokers and character points.</p>
            <div class="pass-progress-wrap"><div class="pass-progress"><span style="width:${passProgress * 100}%"></span></div><span class="pass-tier-badge">${passTier}/30</span></div>
            <button class="btn btn-sm btn-ghost" style="margin-top:10px" data-action="nav" data-page="pass">${icon('arrow')} Open Battle Pass</button>
          </div>
        </div>
      </section>
    `
  }

  charactersPage() {
    const state = this.store.state
    const filters = [['all', 'All Brawlers'], ['unlocked', 'Owned'], ['locked', 'Locked']]
    const characters = CHARACTERS.filter(character => {
      if (this.characterFilter === 'unlocked') return this.store.isUnlocked(character.id)
      if (this.characterFilter === 'locked') return !this.store.isUnlocked(character.id)
      return true
    })
    return `
      <div class="page-head">
        <div><h1 class="page-title">BRAW<span class="accent">LERS</span></h1><p class="page-sub">Every beast carries three weapons and a survival instinct.</p></div>
        <div class="spacer"></div>
        <div class="page-actions"><div class="tab-row">${filters.map(([id, label]) => `<button class="tab ${this.characterFilter === id ? 'active' : ''}" data-action="char-filter" data-filter="${id}">${label}</button>`).join('')}</div></div>
      </div>
      <div class="character-grid">
        ${characters.map(character => this.characterCard(character)).join('')}
      </div>
    `
  }

  characterCard(character) {
    const state = this.store.char(character.id)
    const rarity = RARITIES[character.rarity]
    const league = LEAGUES[Math.min(LEAGUES.length - 1, character.league - 1)]
    const unlocked = this.store.isUnlocked(character.id)
    const leagueOk = this.store.leagueIndex() + 1 >= character.league
    const selected = this.store.state.selected === character.id
    const canUnlock = !unlocked && leagueOk
    const lockText = unlocked ? '' : leagueOk ? `${number(character.unlock.coins)} coins` : `Reach ${league.name} League`
    return `
      <button class="character-card ${selected ? 'selected' : ''} ${unlocked ? '' : 'locked'} ${canUnlock ? 'unlockable' : ''}" data-action="open-character" data-character="${character.id}" style="--rarity:${rarity.color};--rarity-soft:${rarity.soft};--league:${league.color}">
        <div class="character-art">
          <img src="${this.portraits.get(character.id)}" alt="${character.name}" loading="lazy">
          <span class="rarity-ribbon">${rarity.name}</span>
          <span class="level-chip">LV ${state.level}</span>
        </div>
        <div class="character-meta">
          <h3>${character.name}</h3>
          <span class="title">${character.title}</span>
          <div class="character-foot">
            <span class="weapon-dots">${character.weapons.map(type => weaponIcon(type)).join('')}</span>
            <span class="league-tag">${icon(league.icon)} ${league.name}</span>
          </div>
        </div>
        ${unlocked ? '' : `<div class="lock-overlay"><div><div class="lock-icon">${icon('lock')}</div><small>${lockText}</small></div></div>`}
      </button>
    `
  }

  roadPage() {
    const trophies = this.store.state.profile.trophies
    const currentLeague = this.store.league()
    const currentIndex = this.store.leagueIndex()
    const nextLeague = LEAGUES[Math.min(LEAGUES.length - 1, currentIndex + 1)]
    const nextAt = nextLeague.min
    const prevAt = currentLeague.min
    const progress = currentIndex >= LEAGUES.length - 1 ? 1 : (trophies - prevAt) / Math.max(1, nextAt - prevAt)
    return `
      <div class="page-head">
        <div><h1 class="page-title">TROPHY <span class="accent">ROAD</span></h1><p class="page-sub">Climb the leagues to unlock rarer brawlers and bigger rewards.</p></div>
        <div class="spacer"></div>
        <div class="page-actions"><span class="badge gold">${icon('trophy')} ${number(trophies)} TROPHIES</span></div>
      </div>
      <div class="panel panel-pad" style="margin-bottom:14px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <strong style="font-size:12px">${currentLeague.name} League</strong>
          <span style="font-size:9px;color:var(--muted)">${currentIndex >= LEAGUES.length - 1 ? 'Max league reached' : `${number(nextAt - trophies)} trophies to ${nextLeague.name}`}</span>
        </div>
        <div class="pass-progress" style="height:12px"><span style="width:${progress * 100}%;background:linear-gradient(90deg,${currentLeague.color},${nextLeague.color})"></span></div>
      </div>
      <div class="road-league-row">
        ${LEAGUES.map((league, index) => `
          <div class="league-node ${index === currentIndex ? 'current' : ''}" style="--league:${league.color}">
            <span class="league-emblem">${icon(league.icon)}</span>
            <span><strong>${league.name}</strong><small>${number(league.min)}+ trophies</small></span>
          </div>
        `).join('')}
      </div>
      <div class="road-track">
        ${ROAD_REWARDS.map((reward, index) => {
          const claimed = this.store.state.roadClaimed.includes(index)
          const claimable = this.store.canClaimRoad(index)
          const locked = trophies < reward.at
          return `<div class="road-reward ${claimable ? 'claimable' : ''} ${claimed ? 'claimed' : ''}">
            ${claimed ? `<span class="claimed-mark">${icon('check')}</span>` : ''}
            <span class="trophy-req">${icon('trophy')} ${number(reward.at)}</span>
            <span class="reward-art">${icon(reward.icon)}</span>
            <strong>${reward.label}</strong>
            <small>${locked ? 'Locked' : claimed ? 'Claimed' : 'Ready to claim'}</small>
            <button class="btn btn-sm ${claimable ? 'btn-primary' : 'btn-ghost'}" data-action="claim-road" data-index="${index}" ${claimable ? '' : 'disabled'}>${claimed ? 'Claimed' : locked ? icon('lock') : 'Claim'}</button>
          </div>`
        }).join('')}
      </div>
    `
  }

  upgradesPage() {
    if (!this.store.isUnlocked(this.upgradeCharacter)) this.upgradeCharacter = this.store.state.selected
    const character = CHARACTER_MAP[this.upgradeCharacter]
    const state = this.store.char(character.id)
    const loadout = this.store.battleLoadout(character.id)
    const tracks = [
      ['damage', 'Weapon Damage', 'Power up every weapon in your loadout.', 'fire', Math.round((loadout.damage - CHARACTER_MAP[character.id].stats.power) * 100)],
      ['health', 'Max Health', 'Survive longer in the jungle.', 'heal', Math.round(loadout.hp - CHARACTER_MAP[character.id].stats.hp)],
      ['speed', 'Move Speed', 'Outrun rivals and dodge shots.', 'speed', Math.round((loadout.speed - CHARACTER_MAP[character.id].stats.speed) * 100)],
      ['instinct', 'Survival Instinct', 'Strengthens your character passive.', 'spark', Math.round((loadout.instinct - 1) * 100)]
    ]
    return `
      <div class="page-head">
        <div><h1 class="page-title">UP<span class="accent">GRADES</span></h1><p class="page-sub">Spend coins on permanent power. Instinct upgrades boost your passive.</p></div>
        <div class="spacer"></div>
        <div class="page-actions"><span class="badge gold">${icon('coin')} ${number(this.store.state.currencies.coins)}</span></div>
      </div>
      <div class="upgrade-layout">
        <div class="roster-strip">
          ${CHARACTERS.filter(entry => this.store.isUnlocked(entry.id)).map(entry => `
            <button class="roster-mini ${entry.id === this.upgradeCharacter ? 'active' : ''}" data-action="select-upgrade-character" data-character="${entry.id}">
              <img src="${this.portraits.get(entry.id)}" alt="${entry.name}">
              <span><strong>${entry.name}</strong><small>LV ${this.store.char(entry.id).level} · ${RARITIES[entry.rarity].name}</small></span>
            </button>
          `).join('')}
        </div>
        <div>
          <div class="panel upgrade-hero">
            <img src="${this.portraits.get(character.id)}" alt="${character.name}">
            <div style="flex:1">
              <span class="badge" style="color:${RARITIES[character.rarity].color};background:color-mix(in srgb,${RARITIES[character.rarity].color} 12%,transparent)">${RARITIES[character.rarity].name} · ${leagueName(character)} League</span>
              <h2>${character.name}</h2>
              <p>${character.title} · Level ${state.level}</p>
              <div class="modal-actions" style="margin-top:0">
                <button class="btn btn-sm btn-primary" data-action="level-up" data-character="${character.id}">${icon('star')} Level Up · ${number(this.store.levelCost(character.id))} pts</button>
                <button class="btn btn-sm btn-ghost" data-action="open-character" data-character="${character.id}">${icon('info')} Details</button>
              </div>
            </div>
          </div>
          <div class="upgrade-tracks">
            ${tracks.map(([track, title, desc, iconName, delta]) => {
              const level = state.upgrades[track]
              const maxed = level >= 10
              const cost = this.store.upgradeCost(track, level)
              return `<div class="upgrade-card ${track === 'instinct' ? 'highlight' : ''}">
                <div class="upgrade-top"><span class="upgrade-icon">${icon(iconName)}</span><span><strong>${title}</strong><small>${desc}</small></span></div>
                <div class="pips">${Array.from({ length: 10 }, (_, index) => `<span class="${index < level ? 'filled' : ''}"></span>`).join('')}</div>
                <div class="upgrade-bottom">
                  <small>${maxed ? 'MAX LEVEL' : `LV ${level}/10 · ${delta >= 0 ? '+' : ''}${delta}%`}</small>
                  ${maxed ? '<span class="badge gold">MAXED</span>' : `<button class="btn btn-sm btn-gold" data-action="upgrade-character" data-character="${character.id}" data-track="${track}"><span class="cost">${icon('coin')} ${number(cost)}</span></button>`}
                </div>
              </div>`
            }).join('')}
          </div>
          <div class="panel" style="margin-top:12px;padding:15px">
            <div class="panel-head" style="padding:0 0 9px">${icon('paw')}<h3>SKINS</h3></div>
            <div class="skins-row">
              ${character.skins.map(skin => {
                const owned = state.skins.includes(skin.id)
                const active = state.skin === skin.id
                return `<button class="skin-card ${active ? 'active' : ''}" data-action="${owned ? 'equip-skin' : 'unlock-skin'}" data-character="${character.id}" data-skin="${skin.id}">
                  <img src="${this.portraits.get(character.id)}" alt="${skin.name}" style="${owned ? '' : 'filter:hue-rotate(35deg) saturate(.7)'}">
                  <strong>${skin.name}</strong>
                  <small>${owned ? (active ? 'Equipped' : 'Tap to equip') : `${skin.cost} ${skin.currency}`}</small>
                  ${owned ? '' : `<span class="btn btn-sm btn-ghost">${icon('lock')} Unlock</span>`}
                </button>`
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `
  }

  statsPage() {
    const stats = this.store.state.stats
    const winRate = stats.matches ? stats.wins / stats.matches : 0
    const kd = stats.matches ? stats.kills / stats.matches : 0
    const avgPlacement = stats.recent.length ? stats.recent.reduce((sum, match) => sum + match.placement, 0) / stats.recent.length : 0
    const power = Math.round((stats.kills * 12 + stats.wins * 90 + stats.bestTrophies * 1.2) / Math.max(1, stats.matches))
    const bestCharacter = this.store.state.selected
    return `
      <div class="page-head">
        <div><h1 class="page-title">CAREER <span class="accent">STATS</span></h1><p class="page-sub">Your jungle legacy, match by match.</p></div>
        <div class="spacer"></div>
        <div class="page-actions"><span class="badge gold">${icon('trophy')} BEST ${number(stats.bestTrophies)}</span></div>
      </div>
      <div class="stats-grid">
        <div class="stat-card"><span class="stat-icon">${icon('paw')}</span><strong>${number(stats.matches)}</strong><span>Matches</span></div>
        <div class="stat-card"><span class="stat-icon">${icon('trophy')}</span><strong>${number(stats.wins)}</strong><span>Victories</span></div>
        <div class="stat-card"><span class="stat-icon">${icon('skull')}</span><strong>${number(stats.kills)}</strong><span>Eliminations</span></div>
        <div class="stat-card"><span class="stat-icon">${icon('fire')}</span><strong>${number(stats.damage)}</strong><span>Damage Dealt</span></div>
      </div>
      <div class="stats-columns">
        <div class="panel panel-pad">
          <div class="panel-head" style="padding:0 0 6px">${icon('stats')}<h3>Performance</h3></div>
          <div class="performance-row"><label>Win rate</label><div class="performance-bar"><span style="width:${Math.min(100, winRate * 100)}%"></span></div><b>${percent(winRate)}</b></div>
          <div class="performance-row"><label>Kills / match</label><div class="performance-bar"><span style="width:${Math.min(100, kd * 18)}%"></span></div><b>${kd.toFixed(1)}</b></div>
          <div class="performance-row"><label>Avg. placement</label><div class="performance-bar"><span style="width:${Math.max(4, (1 - avgPlacement / 10) * 100)}%"></span></div><b>${avgPlacement ? avgPlacement.toFixed(1) : '—'}</b></div>
          <div class="performance-row"><label>Barrels broken</label><div class="performance-bar"><span style="width:${Math.min(100, stats.barrels * 2)}%"></span></div><b>${number(stats.barrels)}</b></div>
          <div class="performance-row"><label>Medkits used</label><div class="performance-bar"><span style="width:${Math.min(100, stats.medkits * 3)}%"></span></div><b>${number(stats.medkits)}</b></div>
          <div class="performance-row"><label>Weapons looted</label><div class="performance-bar"><span style="width:${Math.min(100, stats.pickups * 2)}%"></span></div><b>${number(stats.pickups)}</b></div>
        </div>
        <div class="panel panel-pad">
          <div class="panel-head" style="padding:0 0 6px">${icon('paw')}<h3>Favourite Brawler</h3></div>
          <div style="display:flex;align-items:center;gap:12px;padding:8px 0">
            <img src="${this.portraits.get(bestCharacter)}" alt="${CHARACTER_MAP[bestCharacter].name}" style="width:74px;height:88px;object-fit:cover;border-radius:13px;background:rgba(198,255,74,.08)">
            <div><strong style="font-size:15px">${CHARACTER_MAP[bestCharacter].name}</strong><div style="font-size:9px;color:var(--muted)">${CHARACTER_MAP[bestCharacter].title}</div><span class="badge" style="margin-top:5px;color:${RARITIES[CHARACTER_MAP[bestCharacter].rarity].color}">${RARITIES[CHARACTER_MAP[bestCharacter].rarity].name}</span></div>
          </div>
          <div class="performance-row"><label>Brawler power</label><div class="performance-bar"><span style="width:${Math.min(100, power)}%"></span></div><b>${number(power)}</b></div>
          <div class="performance-row"><label>Play time</label><div class="performance-bar"><span style="width:${Math.min(100, stats.playtime / 120)}%"></span></div><b>${Math.floor(stats.playtime / 60)}m</b></div>
        </div>
      </div>
      <div class="panel panel-pad" style="margin-top:13px">
        <div class="panel-head" style="padding:0 0 5px">${icon('timer')}<h3>Recent Matches</h3></div>
        ${stats.recent.length ? stats.recent.map(match => `
          <div class="match-row">
            <span class="match-place ${match.win ? 'win' : ''}">${match.placement}</span>
            <span class="match-copy"><strong>${CHARACTER_MAP[match.character]?.name || 'Brawler'} · ${match.win ? 'Victory' : 'Eliminated'}</strong><small>${match.kills} kills · ${number(match.damage)} damage · ${timeAgo(match.at)}</small></span>
            <span class="match-result">+${match.coins} <span class="svg-icon">${icon('coin')}</span><small>${match.trophies >= 0 ? '+' : ''}${match.trophies} trophies</small></span>
          </div>
        `).join('') : `<div class="empty-state">${icon('paw')}<h3>No matches yet</h3><p>Drop into the jungle and write your legend.</p><button class="btn btn-primary" data-action="play">Play</button></div>`}
      </div>
    `
  }

  chestsPage() {
    const state = this.store.state
    const chests = Object.keys(CHESTS)
    return `
      <div class="page-head">
        <div><h1 class="page-title">CHESTS</h1><p class="page-sub">Every chest opens instantly. No timers, no keys required.</p></div>
        <div class="spacer"></div>
        <div class="page-actions"><span class="badge purple">${icon('box')} ${state.itemBoxes} ITEM BOXES</span></div>
      </div>
      <div class="chest-grid">
        ${chests.map(type => {
          const chest = CHESTS[type]
          const count = state.chests[type] || 0
          const rarity = RARITIES[chest.rarity]
          return `<div class="chest-card" style="--chest-glow:${rarity.soft}">
            <span class="chest-count">${count} OWNED</span>
            <div class="chest-art">${chestSvg(type)}</div>
            <h3>${chest.name}</h3>
            <p>${chest.desc}</p>
            <button class="btn ${count ? 'btn-primary' : 'btn-ghost'}" data-action="${count ? 'open-chest' : 'buy-chest'}" data-chest="${type}">${count ? `${icon('gift')} Open Now` : `${icon('coin')} Buy · ${chest.cost} ${chest.currency}`}</button>
          </div>`
        }).join('')}
        <div class="chest-card item-box-card" style="--chest-glow:rgba(192,132,255,.2)">
          <span class="chest-count">${state.itemBoxes} OWNED</span>
          <div class="chest-art"><div class="item-box-icon">${icon('box')}</div></div>
          <h3>Item Box</h3>
          <p>A random gear item for a random brawler. Auto-equips if it is stronger.</p>
          <button class="btn ${state.itemBoxes ? 'btn-primary' : 'btn-ghost'}" data-action="${state.itemBoxes ? 'open-item-box' : 'go-shop'}">${state.itemBoxes ? `${icon('box')} Open Item Box` : `${icon('shop')} Find in Shop`}</button>
        </div>
      </div>
      <div class="panel panel-pad">
        <div class="panel-head" style="padding:0 0 8px">${icon('info')}<h3>Drop Rates & Rules</h3></div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;font-size:9px;color:var(--muted)">
          ${Object.entries(CHESTS).map(([type, chest]) => `<div style="padding:8px;border-radius:10px;background:rgba(255,255,255,.03)"><strong style="display:block;color:${RARITIES[chest.rarity].color};font-size:10px">${chest.name}</strong>Coins, points${type === 'gold' || type === 'legendary' ? ', item boxes' : ''}${type === 'legendary' ? ', brawler chance' : ''}</div>`).join('')}
        </div>
      </div>
    `
  }

  shopPage() {
    const state = this.store.state
    const pointsOffers = [
      { amount: 100, currency: 'coins', price: 500, label: '100 Character Points', icon: 'star' },
      { amount: 500, currency: 'gems', price: 60, label: '500 Character Points', icon: 'star' }
    ]
    const keyOffers = [
      { amount: 1, currency: 'gems', price: 40, label: '1 Key', icon: 'key' },
      { amount: 5, currency: 'gems', price: 180, label: '5 Keys', icon: 'key' }
    ]
    const jokerOffers = [
      { rarity: 'common', currency: 'coins', price: 150 },
      { rarity: 'rare', currency: 'coins', price: 400 },
      { rarity: 'epic', currency: 'gems', price: 30 },
      { rarity: 'legendary', currency: 'gems', price: 80 }
    ]
    return `
      <div class="page-head">
        <div><h1 class="page-title">JUNGLE <span class="accent">SHOP</span></h1><p class="page-sub">Chests, points, keys and jokers. Everything for the climb.</p></div>
        <div class="spacer"></div>
        <div class="page-actions"><span class="badge gold">${icon('gem')} ${number(state.currencies.gems)} GEMS</span></div>
      </div>
      <div class="shop-feature-grid">
        ${SHOP_FEATURED.map(offer => `<div class="feature-offer">
          <span class="offer-badge badge gold">${offer.badge || 'FEATURED'}</span>
          <span class="offer-icon">${icon(offer.icon)}</span>
          <h3>${offer.name}</h3>
          <p>${offer.desc}</p>
          <button class="price-btn" data-action="buy-featured" data-offer="${offer.id}">${currencyIcon(offer.currency)} ${offer.price} ${offer.currency}</button>
        </div>`).join('')}
      </div>
      <div class="shop-section">
        <div class="panel-head" style="padding-left:0">${icon('chest')}<h3>Chests</h3></div>
        <div class="shop-row">
          ${Object.entries(CHESTS).map(([type, chest]) => `<div class="shop-item">
            <span class="shop-item-icon">${icon('chest')}</span>
            <span class="shop-item-copy"><strong>${chest.name}</strong><small>Instant open</small></span>
            <button class="buy-pill" data-action="buy-chest" data-chest="${type}">${currencyIcon(chest.currency)} ${chest.cost}</button>
          </div>`).join('')}
        </div>
      </div>
      <div class="shop-section">
        <div class="panel-head" style="padding-left:0">${icon('star')}<h3>Character Points</h3></div>
        <div class="shop-row">
          ${pointsOffers.map(offer => `<div class="shop-item">
            <span class="shop-item-icon">${icon('star')}</span>
            <span class="shop-item-copy"><strong>${offer.label}</strong><small>Level up any brawler</small></span>
            <button class="buy-pill" data-action="buy-points" data-amount="${offer.amount}" data-currency="${offer.currency}" data-price="${offer.price}">${currencyIcon(offer.currency)} ${offer.price}</button>
          </div>`).join('')}
        </div>
      </div>
      <div class="shop-section">
        <div class="panel-head" style="padding-left:0">${icon('key')}<h3>Keys & Item Jokers</h3></div>
        <div class="shop-row">
          ${keyOffers.map(offer => `<div class="shop-item">
            <span class="shop-item-icon">${icon('key')}</span>
            <span class="shop-item-copy"><strong>${offer.label}</strong><small>Unlock the Key Gate</small></span>
            <button class="buy-pill" data-action="buy-keys" data-amount="${offer.amount}" data-currency="${offer.currency}" data-price="${offer.price}">${currencyIcon(offer.currency)} ${offer.price}</button>
          </div>`).join('')}
          ${jokerOffers.map(offer => `<div class="shop-item">
            <span class="shop-item-icon" style="color:${RARITIES[offer.rarity].color}">${icon('joker')}</span>
            <span class="shop-item-copy"><strong>${RARITIES[offer.rarity].name} Joker</strong><small>Upgrade ${RARITIES[offer.rarity].name} items</small></span>
            <button class="buy-pill" data-action="buy-joker" data-rarity="${offer.rarity}" data-currency="${offer.currency}" data-price="${offer.price}">${currencyIcon(offer.currency)} ${offer.price}</button>
          </div>`).join('')}
        </div>
      </div>
      <div class="panel panel-pad">
        <div class="panel-head" style="padding:0 0 10px">${icon('lock')}<h3>Key Gate — Free Brawlers</h3><span class="spacer"></span><span class="badge">${icon('key')} ${state.currencies.keys} KEYS</span></div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:9px">
          ${KEY_GATE.map((entry, index) => {
            const character = CHARACTER_MAP[entry.character]
            const owned = this.store.isUnlocked(entry.character)
            const available = this.store.keyGateAvailable(index)
            const lockedOrder = state.keyGate.claimed.length !== index && !owned
            return `<div style="display:flex;align-items:center;gap:9px;padding:8px;border-radius:13px;background:rgba(255,255,255,.03);border:1px solid var(--line)">
              <img src="${this.portraits.get(entry.character)}" alt="${character.name}" style="width:48px;height:58px;object-fit:cover;border-radius:9px;background:rgba(198,255,74,.08)">
              <div style="flex:1"><strong style="font-size:11px">${character.name}</strong><small style="display:block;font-size:8px;color:var(--muted)">${RARITIES[character.rarity].name} · ${entry.cost} keys</small>
              <button class="btn btn-sm ${owned ? 'btn-ghost' : available ? 'btn-gold' : 'btn-ghost'}" style="width:100%;margin-top:5px;min-height:25px;font-size:8px" data-action="claim-key-gate" data-index="${index}" ${owned || !available || lockedOrder ? 'disabled' : ''}>${owned ? 'Owned' : lockedOrder ? 'Locked order' : `${icon('key')} Unlock`}</button></div>
            </div>`
          }).join('')}
        </div>
      </div>
    `
  }

  passPage() {
    const state = this.store.state
    const tier = this.store.passTier()
    const progress = this.store.passProgress()
    const missions = MISSIONS.map(mission => ({ mission, state: state.pass.missions[mission.id] }))
    const completed = missions.filter(entry => entry.state.progress >= entry.mission.target && !entry.state.claimed).length
    return `
      <div class="page-head">
        <div><h1 class="page-title">BATTLE <span class="accent">PASS</span></h1><p class="page-sub">Season 1 · Jungle Awakens. Every reward is free to claim.</p></div>
        <div class="spacer"></div>
        <div class="page-actions"><span class="badge purple">${icon('pass')} TIER ${tier}/30</span></div>
      </div>
      <div class="pass-banner">
        <span class="badge purple">SEASON 01</span>
        <h2>JUNGLE AWAKENS</h2>
        <p>Complete missions, earn pass XP and collect 30 tiers of loot.</p>
        <div class="pass-progress-wrap"><div class="pass-progress"><span style="width:${progress * 100}%"></span></div><span class="pass-tier-badge">${Math.floor(state.pass.xp % 120)}/120 XP</span></div>
      </div>
      <div class="tab-row pass-tabs">
        <button class="tab ${this.passTab === 'missions' ? 'active' : ''}" data-action="pass-tab" data-tab="missions">Missions ${completed ? `· ${completed} ready` : ''}</button>
        <button class="tab ${this.passTab === 'rewards' ? 'active' : ''}" data-action="pass-tab" data-tab="rewards">Rewards</button>
      </div>
      ${this.passTab === 'missions' ? `
        <div class="mission-grid">
          ${missions.map(({ mission, state: missionState }) => {
            const ratio = Math.min(1, missionState.progress / mission.target)
            const ready = missionState.progress >= mission.target && !missionState.claimed
            return `<div class="mission-tile">
              <span class="mini-mission-icon">${icon(mission.icon)}</span>
              <div class="mission-tile-copy">
                <strong>${mission.title}</strong><small>${mission.desc}</small>
                <div class="mission-progress"><span style="width:${ratio * 100}%"></span></div>
                <div class="mission-meta"><span>${number(missionState.progress)} / ${number(mission.target)}</span><span>+${mission.xp} XP · +${mission.coins} coins</span></div>
              </div>
              <button class="mission-claim ${ready ? 'ready' : ''}" data-action="claim-mission" data-mission="${mission.id}" ${ready ? '' : 'disabled'}>${missionState.claimed ? icon('check') : ready ? icon('gift') : icon('arrow')}</button>
            </div>`
          }).join('')}
        </div>
      ` : `
        <div class="pass-track">
          ${PASS_REWARDS.map(reward => {
            const claimed = state.pass.claimedTiers.includes(reward.tier)
            const claimable = tier >= reward.tier && !claimed
            return `<div class="pass-tier ${claimable ? 'claimable' : ''} ${claimed ? 'claimed' : ''}">
              <div class="tier-num">${reward.tier}</div>
              <div class="tier-reward">${icon(reward.icon)}</div>
              <strong>${reward.label}</strong>
              <button class="btn btn-sm ${claimable ? 'btn-primary' : 'btn-ghost'}" data-action="claim-pass" data-tier="${reward.tier}" ${claimable ? '' : 'disabled'}>${claimed ? icon('check') : claimable ? 'Claim' : icon('lock')}</button>
            </div>`
          }).join('')}
        </div>
      `}
    `
  }

  selectCharacter(id) {
    if (!this.store.selectCharacter(id)) return
    this.menuScene.setCharacter(id)
    this.audio.pickup()
    this.refresh()
    this.toast(`${CHARACTER_MAP[id].name} is ready for battle`, 'success')
  }

  unlockCharacter(id) {
    const character = CHARACTER_MAP[id]
    const result = this.store.unlockCharacter(id)
    if (!result.ok) {
      if (result.reason === 'league') this.toast(`Reach ${LEAGUES[character.league - 1].name} League first`, 'error')
      else if (result.reason === 'coins') this.toast('Not enough coins', 'error')
      else this.toast('Already owned', 'info')
      return
    }
    this.audio.chest()
    this.openCharacter(id)
    this.refresh()
  }

  levelUp(id) {
    if (!this.store.levelUp(id)) {
      this.toast('Not enough character points', 'error')
      return
    }
    this.audio.chest()
    this.openCharacter(id)
    this.refresh()
  }

  upgradeCharacter(id, track) {
    if (!this.store.upgradeCharacter(id, track)) {
      this.toast('Not enough coins', 'error')
      return
    }
    this.audio.pickup()
    this.refresh()
  }

  selectUpgradeCharacter(id) {
    this.upgradeCharacter = id
    this.audio.tab()
    this.renderPage()
  }

  unlockSkin(characterId, skinId) {
    if (!this.store.unlockSkin(characterId, skinId)) {
      const skin = CHARACTER_MAP[characterId].skins.find(entry => entry.id === skinId)
      this.toast(`Need ${skin.cost} ${skin.currency}`, 'error')
      return
    }
    this.audio.chest()
    this.portraits.clear(characterId)
    this.menuScene.setCharacter(characterId)
    this.openCharacter(characterId)
    this.refresh()
  }

  equipSkin(characterId, skinId) {
    if (!this.store.equipSkin(characterId, skinId)) return
    this.audio.pickup()
    this.portraits.clear(characterId)
    this.menuScene.setCharacter(characterId)
    this.openCharacter(characterId)
    this.refresh()
  }

  openCharacter(id) {
    const character = CHARACTER_MAP[id]
    if (!character) return
    const state = this.store.char(id)
    const rarity = RARITIES[character.rarity]
    const league = LEAGUES[Math.min(LEAGUES.length - 1, character.league - 1)]
    const unlocked = this.store.isUnlocked(id)
    const leagueOk = this.store.leagueIndex() + 1 >= character.league
    const selected = this.store.state.selected === id
    const loadout = this.store.battleLoadout(id)
    const itemSlots = Object.entries(ITEM_TYPES).map(([type, itemType]) => {
      const item = this.store.equippedItem(id, itemType.slot)
      if (item) {
        return `<button class="item-slot filled" style="--item-rarity:${itemRarityColor(item)}" data-action="open-item" data-item="${item.uid}">
          <span class="slot-level">LV ${item.level}</span>
          <span class="slot-icon">${icon(itemType.icon)}</span>
          <strong>${itemType.name}</strong><small>${itemStatText(item)}</small>
        </button>`
      }
      return `<div class="item-slot"><span class="slot-icon">${icon(itemType.icon)}</span><strong>${itemType.name}</strong><small>Empty slot</small></div>`
    }).join('')
    const statBars = [
      ['Health', Math.min(1, loadout.hp / 1600), number(loadout.hp)],
      ['Speed', Math.min(1, loadout.speed / 7.2), loadout.speed.toFixed(1)],
      ['Power', Math.min(1, loadout.damage / 1.7), `${Math.round(loadout.damage * 100)}%`],
      ['Instinct', Math.min(1, loadout.instinct / 2), `${Math.round(loadout.instinct * 100)}%`]
    ]
    const html = `
      <div class="modal-hero">
        <div class="modal-portrait"><img src="${this.portraits.get(id)}" alt="${character.name}"></div>
        <div class="modal-info" style="--rarity:${rarity.color}">
          <span class="badge" style="color:${rarity.color};background:color-mix(in srgb,${rarity.color} 12%,transparent)">${rarity.name} · ${league.name} League</span>
          <h2>${character.name}</h2>
          <div class="char-title">${character.title} · LV ${state.level}</div>
          <p class="char-desc">${character.name} is a ${character.species} brawler with ${character.weapons.length} weapon slots and a unique survival instinct.</p>
          <div class="passive-box"><span class="upgrade-icon">${icon(character.passive.icon)}</span><span><strong>${character.passive.name}</strong><small>${character.passive.desc}</small></span></div>
          <div class="stat-bars">
            ${statBars.map(([label, ratio, value]) => `<div class="stat-bar-row"><label>${label}</label><div class="stat-bar"><span style="width:${ratio * 100}%"></span></div><b style="font-size:8px;color:var(--white)">${value}</b></div>`).join('')}
          </div>
          <div class="modal-actions">
            ${unlocked
              ? `<button class="btn ${selected ? 'btn-ghost' : 'btn-primary'}" data-action="select-character" data-character="${id}" ${selected ? 'disabled' : ''}>${selected ? icon('check') : icon('paw')} ${selected ? 'Selected' : 'Select Brawler'}</button>
                 <button class="btn btn-gold" data-action="level-up" data-character="${id}">${icon('star')} Level Up · ${number(this.store.levelCost(id))}</button>`
              : `<button class="btn ${leagueOk ? 'btn-primary' : 'btn-ghost'}" data-action="unlock-character" data-character="${id}" ${leagueOk ? '' : 'disabled'}>${icon(leagueOk ? 'coin' : 'lock')} ${leagueOk ? `Unlock · ${number(character.unlock.coins)}` : `Reach ${league.name} League`}</button>`
            }
            <button class="btn btn-ghost" data-action="nav" data-page="upgrades">${icon('upgrade')} Upgrades</button>
          </div>
        </div>
      </div>
      <div class="modal-section">
        <h3>Weapon Loadout</h3>
        <div class="weapon-loadout">
          ${character.weapons.map((type, index) => {
            const weapon = WEAPON_TYPES[type]
            return `<div class="loadout-card"><span class="loadout-icon">${weaponIcon(type)}</span><strong>${weapon.name}</strong><small>${index === 0 ? 'Primary' : index === 1 ? 'Secondary' : 'Tertiary'} · ${weapon.kind}</small></div>`
          }).join('')}
        </div>
        <h3 style="margin-top:18px">Gear Items</h3>
        <div class="item-slots">${itemSlots}</div>
        <h3 style="margin-top:18px">Skins</h3>
        <div class="skins-row">
          ${character.skins.map(skin => {
            const owned = state.skins.includes(skin.id)
            const active = state.skin === skin.id
            return `<button class="skin-card ${active ? 'active' : ''}" data-action="${owned ? 'equip-skin' : 'unlock-skin'}" data-character="${id}" data-skin="${skin.id}">
              <img src="${this.portraits.get(id)}" alt="${skin.name}" style="${owned ? '' : 'filter:hue-rotate(35deg) saturate(.7)'}">
              <strong>${skin.name}</strong><small>${owned ? (active ? 'Equipped' : 'Tap to equip') : `${skin.cost} ${skin.currency}`}</small>
              ${owned ? '' : `<span class="btn btn-sm btn-ghost">${icon('lock')} Unlock</span>`}
            </button>`
          }).join('')}
        </div>
      </div>
    `
    this.openModal(html, { type: 'character', data: id })
  }

  openItem(uid) {
    const item = this.store.state.items.find(entry => entry.uid === uid)
    if (!item) return
    const character = CHARACTER_MAP[item.characterId]
    const type = ITEM_TYPES[item.type]
    const rarity = RARITIES[item.rarity]
    const cost = this.store.itemUpgradeCost(item)
    const equipped = this.store.char(item.characterId).equipped[type.slot] === item.uid
    const html = `
      <div class="modal-info" style="padding:26px 26px 6px">
        <span class="badge" style="color:${rarity.color};background:color-mix(in srgb,${rarity.color} 12%,transparent)">${rarity.name} ${type.label} Gear</span>
        <h2 style="font-size:38px">${type.name}</h2>
        <div class="char-title">${character.name} · Item Level ${item.level}/10</div>
        <p class="char-desc">${itemStatText(item)}. Upgrade with ${rarity.name} Jokers or gems to increase the boost.</p>
        <div class="passive-box"><span class="upgrade-icon">${icon(type.icon)}</span><span><strong>${type.label} Boost</strong><small>${itemStatText(item)} · ${equipped ? 'Equipped' : 'In inventory'}</small></span></div>
        <div class="modal-actions">
          <button class="btn btn-gold" data-action="upgrade-item" data-item="${item.uid}" ${this.store.state.jokers[item.rarity] >= cost.jokers && item.level < 10 ? '' : 'disabled'}>${icon('joker')} Upgrade · ${cost.jokers} ${rarity.name} Joker</button>
          <button class="btn btn-cyan" data-action="upgrade-item-gems" data-item="${item.uid}" ${this.store.state.currencies.gems >= cost.gems && item.level < 10 ? '' : 'disabled'}>${icon('gem')} Upgrade · ${cost.gems} Gems</button>
          <button class="btn btn-ghost" data-action="equip-item" data-item="${item.uid}" ${equipped ? 'disabled' : ''}>${icon('check')} ${equipped ? 'Equipped' : 'Equip'}</button>
        </div>
      </div>
      <div class="modal-section" style="padding-top:14px"><div style="display:flex;gap:8px;flex-wrap:wrap;font-size:9px;color:var(--muted)">
        <span class="badge">${icon('joker')} ${this.store.state.jokers[item.rarity] || 0} ${rarity.name} Jokers</span>
        <span class="badge">${icon('gem')} ${this.store.state.currencies.gems} Gems</span>
      </div></div>
    `
    this.openModal(html, { type: 'item', data: uid, small: true })
  }

  upgradeItem(uid, withGems) {
    if (!this.store.upgradeItem(uid, withGems)) {
      this.toast(withGems ? 'Not enough gems' : 'Not enough jokers', 'error')
      return
    }
    this.audio.pickup()
    this.openItem(uid)
    this.refresh()
  }

  equipItem(uid) {
    if (!this.store.equipItem(uid)) return
    this.audio.pickup()
    this.openItem(uid)
    this.refresh()
  }

  openChest(type) {
    const rewards = this.store.openChest(type)
    if (!rewards) {
      this.toast('No chests left — buy one in the shop', 'error')
      return
    }
    this.audio.chest()
    const html = `
      <div class="chest-open-modal">
        <span class="badge gold">${CHESTS[type].name}</span>
        <div class="chest-art">${chestSvg(type)}</div>
        <h2 style="font-family:var(--display);font-size:34px;margin:0">LOOT UNLOCKED</h2>
        <p style="color:var(--muted);font-size:10px;margin:2px 0 0">All rewards added instantly.</p>
        <div class="reward-list">
          ${rewards.map((reward, index) => `<div class="reward-tile" style="animation-delay:${index * 0.06}s;--reward-color:${RARITIES[reward.rarity || 'common'].color}">
            <span class="reward-tile-icon">${icon(reward.icon)}</span>
            <strong>${reward.label}</strong><small>${RARITIES[reward.rarity || 'common'].name}</small>
          </div>`).join('')}
        </div>
        <button class="btn btn-primary" data-action="close-modal" style="width:100%">${icon('check')} Collect</button>
      </div>
    `
    this.openModal(html, { type: 'chest' })
    this.refresh()
  }

  buyChest(type) {
    const chest = CHESTS[type]
    if (!this.store.buyChest(type)) {
      this.toast(`Not enough ${chest.currency}`, 'error')
      return
    }
    this.audio.chest()
    this.toast(`${chest.name} added — open it instantly`, 'success')
    this.refresh()
  }

  openItemBox() {
    const result = this.store.openItemBox()
    if (!result) {
      this.toast('No item boxes available', 'error')
      return
    }
    this.audio.chest()
    const { item, character } = result
    const rarity = RARITIES[item.rarity]
    const type = ITEM_TYPES[item.type]
    const html = `
      <div class="chest-open-modal">
        <span class="badge" style="color:${rarity.color};background:color-mix(in srgb,${rarity.color} 12%,transparent)">RANDOM ITEM BOX</span>
        <div class="chest-art" style="height:160px"><div class="item-box-icon" style="width:120px;height:120px">${icon(type.icon)}</div></div>
        <h2 style="font-family:var(--display);font-size:32px;margin:0">${type.name}</h2>
        <p style="color:var(--muted);font-size:10px;margin:2px 0 0">${rarity.name} ${type.label} gear for <strong style="color:var(--white)">${character.name}</strong></p>
        <div class="reward-list" style="grid-template-columns:1fr">
          <div class="reward-tile" style="--reward-color:${rarity.color}"><span class="reward-tile-icon">${icon(type.icon)}</span><strong>${itemStatText(item)}</strong><small>Auto-equipped if stronger</small></div>
        </div>
        <button class="btn btn-primary" data-action="close-modal" style="width:100%">${icon('check')} Collect</button>
      </div>
    `
    this.openModal(html, { type: 'itemBox' })
    this.refresh()
  }

  buyFeatured(id) {
    const offer = SHOP_FEATURED.find(entry => entry.id === id)
    if (!this.store.buyShop(id)) {
      this.toast(`Not enough ${offer.currency}`, 'error')
      return
    }
    this.audio.chest()
    this.toast(`${offer.name} purchased`, 'success')
    this.refresh()
  }

  buyPoints(amount, currency, price) {
    if (!this.store.buyPoints(amount, currency, price)) {
      this.toast(`Not enough ${currency}`, 'error')
      return
    }
    this.audio.pickup()
    this.toast(`+${amount} Character Points`, 'success')
    this.refresh()
  }

  buyKeys(amount, currency, price) {
    if (!this.store.buyKeys(amount, currency, price)) {
      this.toast(`Not enough ${currency}`, 'error')
      return
    }
    this.audio.pickup()
    this.toast(`+${amount} Keys`, 'success')
    this.refresh()
  }

  buyJoker(rarity, currency, price) {
    if (!this.store.buyJoker(rarity, currency, price)) {
      this.toast(`Not enough ${currency}`, 'error')
      return
    }
    this.audio.pickup()
    this.toast(`+1 ${RARITIES[rarity].name} Joker`, 'success')
    this.refresh()
  }

  claimRoad(index) {
    const reward = this.store.claimRoad(index)
    if (!reward) return
    this.audio.chest()
    this.toast(`${reward.label} claimed`, 'success')
    this.renderPage()
    this.refresh()
  }

  claimPass(tier) {
    const reward = this.store.claimPassTier(tier)
    if (!reward) return
    this.audio.chest()
    this.toast(`${reward.label} claimed`, 'success')
    this.renderPage()
    this.refresh()
  }

  claimMission(id) {
    const mission = this.store.claimMission(id)
    if (!mission) return
    this.audio.chest()
    this.toast(`${mission.title} complete · +${mission.xp} XP`, 'success')
    this.renderPage()
    this.refresh()
  }

  claimKeyGate(index) {
    if (!this.store.claimKeyGate(index)) {
      this.toast('Need more keys or previous gate', 'error')
      return
    }
    const entry = KEY_GATE[index]
    this.audio.chest()
    this.toast(`${CHARACTER_MAP[entry.character].name} unlocked!`, 'success')
    this.renderPage()
    this.refresh()
  }

  setPassTab(tab) {
    this.passTab = tab
    this.audio.tab()
    this.renderPage()
  }

  setCharacterFilter(filter) {
    this.characterFilter = filter
    this.audio.tab()
    this.renderPage()
  }

  openStarterDraft() {
    this.draft = [...this.store.state.starterSquad]
    this.renderDraft()
  }

  renderDraft() {
    const starters = CHARACTERS.filter(character => character.league === 1)
    const html = `
      <div class="modal-info" style="padding:24px 24px 8px">
        <span class="badge">STARTER DRAFT</span>
        <h2 style="font-size:38px">CHOOSE 3</h2>
        <p class="char-desc" style="margin-bottom:12px">Pick any three Bronze League brawlers. Your starter squad is free and can be swapped here at any time.</p>
        <div class="character-grid" style="grid-template-columns:repeat(3,1fr);gap:8px;padding-bottom:0">
          ${starters.map(character => {
            const picked = this.draft.includes(character.id)
            const locked = !this.store.isUnlocked(character.id)
            return `<button class="character-card draft-card ${picked ? 'selected' : ''} ${locked ? 'locked' : ''}" data-action="toggle-draft" data-character="${character.id}">
              <div class="character-art"><img src="${this.portraits.get(character.id)}" alt="${character.name}"><span class="rarity-ribbon" style="--rarity:${RARITIES[character.rarity].color}">${RARITIES[character.rarity].name}</span></div>
              <div class="character-meta"><h3>${character.name}</h3><span class="title">${locked ? 'Not owned' : picked ? 'In squad' : 'Tap to add'}</span></div>
              ${picked ? `<span class="draft-check">${icon('check')}</span>` : ''}
            </button>`
          }).join('')}
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" data-action="save-starters" ${this.draft.length === 3 ? '' : 'disabled'}>${icon('check')} Save Squad (${this.draft.length}/3)</button>
          <button class="btn btn-ghost" data-action="close-modal">Cancel</button>
        </div>
      </div>
    `
    this.openModal(html, { type: 'draft' })
  }

  toggleDraft(id) {
    if (!this.store.isUnlocked(id)) {
      this.toast('Unlock this brawler first', 'error')
      return
    }
    if (this.draft.includes(id)) this.draft = this.draft.filter(entry => entry !== id)
    else if (this.draft.length < 3) this.draft.push(id)
    else {
      this.toast('Squad is full — remove one first', 'error')
      return
    }
    this.audio.click()
    this.renderDraft()
  }

  saveStarters() {
    if (!this.store.setStarterSquad(this.draft)) {
      this.toast('Pick exactly 3 brawlers', 'error')
      return
    }
    this.audio.chest()
    this.closeModal()
    this.refresh()
    this.toast('Starter squad updated', 'success')
  }

  openSettings() {
    const sound = this.store.state.settings.sound
    const html = `
      <div class="modal-info" style="padding:26px">
        <span class="badge">OPTIONS</span>
        <h2 style="font-size:40px">SETTINGS</h2>
        <div style="display:flex;flex-direction:column;gap:8px;margin:14px 0 18px">
          <button class="btn btn-ghost" data-action="toggle-sound" style="justify-content:space-between">${icon('sound')} Sound effects <span class="badge ${sound ? '' : 'red'}">${sound ? 'ON' : 'OFF'}</span></button>
          <button class="btn btn-ghost" data-action="reset-save" style="justify-content:space-between;color:#ffbcc7">${icon('refresh')} Reset all progress <span class="badge red">RESET</span></button>
        </div>
        <p style="color:var(--muted);font-size:9px;line-height:1.5">Beast Brawl is a 3D jungle battle royale. Move with WASD or the joystick, aim with the mouse, fire with left click or the attack button. On touch, attacks auto-aim at the nearest rival.</p>
        <div class="modal-actions"><button class="btn btn-primary" data-action="close-modal">${icon('check')} Done</button></div>
      </div>
    `
    this.openModal(html, { type: 'settings', small: true })
  }

  toggleSound() {
    this.audio.setEnabled(!this.store.state.settings.sound)
    this.openSettings()
  }

  resetSave() {
    this.store.reset()
    this.closeModal()
    this.portraits.clear()
    this.menuScene.setCharacter(this.store.state.selected)
    this.refresh()
    this.toast('Progress reset', 'info')
  }

  openModal(html, { type = '', data = null, small = false } = {}) {
    this.modalType = type
    this.modalData = data
    this.modalRoot.innerHTML = `
      <div class="modal-backdrop" data-action="close-modal"></div>
      <div class="modal-shell">
        <div class="modal ${type ? `modal-${type}` : ''}" style="${small ? 'width:min(520px,100%)' : ''}">
          <button class="modal-close" data-action="close-modal" aria-label="Close">${icon('close')}</button>
          ${html}
        </div>
      </div>
    `
    this.modalRoot.classList.add('open')
    this.audio.click()
  }

  closeModal() {
    this.modalRoot.classList.remove('open')
    this.modalType = null
    this.modalData = null
    setTimeout(() => {
      if (!this.modalRoot.classList.contains('open')) this.modalRoot.innerHTML = ''
    }, 250)
  }

  toast(message, tone = 'info') {
    if (!message) return
    const node = document.createElement('div')
    node.className = `toast ${tone}`
    node.innerHTML = `${icon(tone === 'error' ? 'info' : tone === 'success' ? 'check' : 'spark')}<span>${message}</span>`
    this.toastRoot.appendChild(node)
    setTimeout(() => {
      node.classList.add('leaving')
      setTimeout(() => node.remove(), 260)
    }, 2400)
  }
}
