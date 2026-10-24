import * as THREE from 'three'
import { BOT_NAMES, CHARACTERS, CHARACTER_MAP, ITEM_TYPES, RARITIES, TIERS, WEAPON_TYPES, tierOf, weaponOf } from './data.js'
import {
  createAimRing, createBarrel, createBarrier, createBush, createCharacter, createHealthBar,
  createItemModel, createNameSprite, createPickupRing, createRock, createShrine, createTrap,
  createTree, createWeaponModel, createWeaponPickup, animateCharacter, setHealthBar
} from './models.js'

const ARENA_RADIUS = 42
const TIER_ORDER = ['wood', 'rock', 'copper', 'iron', 'gold', 'legendary']
const ITEM_CAPS = { medkit: 3, shield: 2, trap: 2, speed: 1, barricade: 2 }
const ITEM_NAMES = { medkit: 'Medkit', shield: 'Shield', trap: 'Bear Trap', speed: 'Speed Shield', barricade: 'Wooden Wall' }

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.z - b.z) ** 2
const angleTo = (a, b) => Math.atan2(b.x - a.x, b.z - a.z)
const angleDelta = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b))
const random = (min, max) => min + Math.random() * (max - min)
const pick = list => list[Math.floor(Math.random() * list.length)]

function weightedTier(allowGold = true) {
  const roll = Math.random()
  if (roll < 0.23) return 'wood'
  if (roll < 0.49) return 'rock'
  if (roll < 0.7) return 'copper'
  if (roll < 0.88) return 'iron'
  return allowGold ? 'gold' : 'iron'
}

function makeGroundTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const context = canvas.getContext('2d')
  const gradient = context.createRadialGradient(512, 512, 80, 512, 512, 512)
  gradient.addColorStop(0, '#4f9a5a')
  gradient.addColorStop(0.58, '#3d8a4e')
  gradient.addColorStop(0.88, '#337a44')
  gradient.addColorStop(1, '#2a663a')
  context.fillStyle = gradient
  context.fillRect(0, 0, 1024, 1024)
  for (let i = 0; i < 3200; i++) {
    const x = Math.random() * 1024
    const y = Math.random() * 1024
    const radius = Math.random() * 9 + 1
    const colors = ['rgba(139,197,103,.18)', 'rgba(29,91,48,.22)', 'rgba(192,205,118,.1)', 'rgba(21,73,39,.18)']
    context.fillStyle = colors[Math.floor(Math.random() * colors.length)]
    context.beginPath()
    context.arc(x, y, radius, 0, Math.PI * 2)
    context.fill()
  }
  context.strokeStyle = 'rgba(191,164,107,.28)'
  context.lineCap = 'round'
  for (let i = 0; i < 6; i++) {
    context.lineWidth = 30 + Math.random() * 45
    context.beginPath()
    context.moveTo(512, 512)
    const angle = (i / 6) * Math.PI * 2 + 0.3
    context.quadraticCurveTo(512 + Math.cos(angle + 0.3) * 240, 512 + Math.sin(angle + 0.3) * 240, 512 + Math.cos(angle) * 500, 512 + Math.sin(angle) * 500)
    context.stroke()
  }
  context.fillStyle = 'rgba(202,176,115,.34)'
  context.beginPath()
  context.arc(512, 512, 92, 0, Math.PI * 2)
  context.fill()
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

const waterVert = `
uniform float uTime;
varying vec2 vUv;
varying float vWave;
void main(){
  vUv=uv;
  vec3 p=position;
  float w=sin(p.x*.22+uTime*.8)*.13+cos(p.y*.19+uTime*.62)*.11;
  p.z+=w;
  vWave=w;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
}
`
const waterFrag = `
uniform float uTime;
varying vec2 vUv;
varying float vWave;
void main(){
  vec3 deep=vec3(.012,.13,.15);
  vec3 shallow=vec3(.03,.42,.39);
  float line=smoothstep(.9,1.,sin((vUv.x+vUv.y)*220.+uTime*1.6)*.5+.5);
  vec3 col=mix(deep,shallow,.5+vWave*1.8);
  col+=vec3(.08,.48,.4)*line*.3;
  gl_FragColor=vec4(col,.96);
}
`

export class Battle {
  constructor({ renderer, store, audio, onExit }) {
    this.renderer = renderer
    this.store = store
    this.audio = audio
    this.onExit = onExit
    this.root = document.getElementById('battle-ui')
    this.scene = null
    this.camera = null
    this.player = null
    this.bots = []
    this.boss = null
    this.entities = []
    this.projectiles = []
    this.pickups = []
    this.barrels = []
    this.barriers = []
    this.obstacles = []
    this.traps = []
    this.effects = []
    this.elapsed = 0
    this.running = false
    this.paused = false
    this.ended = false
    this.resultShown = false
    this.endTimer = 0
    this.kills = 0
    this.damageDealt = 0
    this.barrelsBroken = 0
    this.medkitsUsed = 0
    this.weaponPickups = 0
    this.bossKilled = false
    this.bossAnnounced = false
    this.cameraShake = 0
    this.aimPoint = new THREE.Vector3(0, 0, 0)
    this.manualAim = false
    this.isTouch = false
    this.pointer = new THREE.Vector2(0, 0)
    this.input = { x: 0, z: 0, fire: false }
    this.fireQueued = false
    this.keys = new Set()
    this.joystickPointer = null
    this.announceTimer = 0
    this.clock = new THREE.Clock()
    this.tmp = new THREE.Vector3()
    this.raycaster = new THREE.Raycaster()
    this.aimPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.4)
    this.cleanup = []
    this.bindGlobal = this.bindGlobal.bind(this)
    this.onResize = this.onResize.bind(this)
  }

  start(characterId) {
    this.characterId = characterId
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('#0a2a22')
    this.scene.fog = new THREE.FogExp2('#0a2a22', 0.009)
    this.camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 220)
    this.camera.position.set(0, 16, 17)
    this.buildLights()
    this.buildArena()
    this.spawnPlayer(characterId)
    this.spawnBots()
    this.spawnBoss()
    this.spawnLoot()
    this.buildHud()
    this.bindControls()
    this.elapsed = 0
    this.running = true
    this.paused = false
    this.ended = false
    this.root.classList.remove('hidden')
    this.announce('DROP IN', 'LEGENDARY GUARD AWAKENS', 'One guard. One legendary weapon. Last beast standing.', 4.2)
    this.audio.boss()
    this.clock.getDelta()
    this.onResize()
  }

  buildLights() {
    const hemi = new THREE.HemisphereLight('#b9ffe8', '#173424', 2.15)
    this.scene.add(hemi)
    const sun = new THREE.DirectionalLight('#fff1cb', 3.3)
    sun.position.set(-20, 34, 16)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.left = -52
    sun.shadow.camera.right = 52
    sun.shadow.camera.top = 52
    sun.shadow.camera.bottom = -52
    sun.shadow.camera.near = 1
    sun.shadow.camera.far = 120
    sun.shadow.bias = -0.0006
    sun.shadow.normalBias = 0.03
    this.scene.add(sun)
    this.sun = sun
    const rim = new THREE.DirectionalLight('#55ffc0', 1.8)
    rim.position.set(25, 12, -24)
    this.scene.add(rim)
    const warm = new THREE.PointLight('#ffb14d', 55, 38, 2)
    warm.position.set(0, 8, 0)
    this.scene.add(warm)

    const sky = new THREE.Mesh(new THREE.SphereGeometry(140, 32, 18), new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {},
      vertexShader: 'varying vec3 vP; void main(){vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'varying vec3 vP; void main(){float h=normalize(vP).y; vec3 top=vec3(.02,.09,.09); vec3 mid=vec3(.04,.25,.2); vec3 low=vec3(.34,.5,.25); vec3 c=mix(low,mid,smoothstep(-.05,.35,h)); c=mix(c,top,smoothstep(.28,.85,h)); gl_FragColor=vec4(c,1.);}'
    }))
    this.scene.add(sky)

    const water = new THREE.Mesh(new THREE.PlaneGeometry(240, 240, 100, 100), new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: waterVert,
      fragmentShader: waterFrag,
      transparent: true
    }))
    water.rotation.x = -Math.PI / 2
    water.position.y = -0.62
    this.scene.add(water)
    this.water = water

    const glow = new THREE.Mesh(new THREE.CircleGeometry(8, 40), new THREE.MeshBasicMaterial({ color: '#ffc84a', transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false }))
    glow.rotation.x = -Math.PI / 2
    glow.position.y = 0.5
    this.scene.add(glow)
  }

  buildArena() {
    const sand = new THREE.Mesh(new THREE.CylinderGeometry(43.2, 45.2, 1.1, 72), new THREE.MeshStandardMaterial({ color: '#c6a66d', roughness: 0.96, flatShading: true }))
    sand.position.y = -0.18
    sand.receiveShadow = true
    this.scene.add(sand)
    const grass = new THREE.Mesh(new THREE.CircleGeometry(42.8, 96), new THREE.MeshStandardMaterial({ map: makeGroundTexture(), color: '#b9e3a1', roughness: 0.94 }))
    grass.rotation.x = -Math.PI / 2
    grass.position.y = 0.38
    grass.receiveShadow = true
    this.scene.add(grass)
    this.ground = grass

    for (let i = 0; i < 34; i++) {
      const angle = (i / 34) * Math.PI * 2
      const radius = 43.6 + Math.random() * 3
      const rock = createRock(random(0.35, 0.85))
      rock.position.set(Math.cos(angle) * radius, -0.1, Math.sin(angle) * radius)
      rock.rotation.y = Math.random() * Math.PI
      this.scene.add(rock)
    }

    const shrine = createShrine()
    shrine.position.set(0, 0.38, 0)
    this.scene.add(shrine)
    this.shrine = shrine
    this.addObstacle({ x: 0, z: 0, r: 3.15, mesh: shrine, type: 'shrine', indestructible: true })

    const spawnRing = new THREE.Mesh(new THREE.RingGeometry(39.2, 39.8, 64), new THREE.MeshBasicMaterial({ color: '#c6ff4a', transparent: true, opacity: 0.09, side: THREE.DoubleSide, depthWrite: false }))
    spawnRing.rotation.x = -Math.PI / 2
    spawnRing.position.y = 0.41
    this.scene.add(spawnRing)

    const treeCount = 38
    for (let i = 0; i < treeCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = random(9, 40)
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      if (Math.hypot(x, z) < 6) continue
      const tree = createTree(i % 4)
      const scale = random(0.7, 1.15)
      tree.scale.setScalar(scale)
      tree.position.set(x, 0.38, z)
      tree.rotation.y = Math.random() * Math.PI * 2
      this.scene.add(tree)
      this.addObstacle({ x, z, r: 0.6 * scale, mesh: tree, type: 'tree', indestructible: true })
    }
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = random(10, 40)
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      const rock = createRock(random(0.55, 1.1))
      rock.position.set(x, 0.38, z)
      rock.rotation.y = Math.random() * Math.PI * 2
      this.scene.add(rock)
      this.addObstacle({ x, z, r: 0.9, mesh: rock, type: 'rock', indestructible: true })
    }
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = random(8, 41)
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      const bush = createBush(random(0.55, 1.0))
      bush.position.set(x, 0.38, z)
      bush.rotation.y = Math.random() * Math.PI * 2
      this.scene.add(bush)
    }
    for (let i = 0; i < 14; i++) this.spawnBarrel()
    for (let i = 0; i < 8; i++) this.spawnBarrier()

    const pollenCount = 130
    const positions = new Float32Array(pollenCount * 3)
    for (let i = 0; i < pollenCount; i++) {
      positions[i * 3] = random(-41, 41)
      positions[i * 3 + 1] = random(0.5, 9)
      positions[i * 3 + 2] = random(-41, 41)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const pollen = new THREE.Points(geometry, new THREE.PointsMaterial({ color: '#d8ff9f', size: 0.07, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }))
    this.scene.add(pollen)
    this.pollen = pollen
  }

  addObstacle(obstacle) {
    this.obstacles.push(obstacle)
    return obstacle
  }

  freePosition(minRadius = 6, maxRadius = 39, clearance = 1.3) {
    for (let attempt = 0; attempt < 40; attempt++) {
      const angle = Math.random() * Math.PI * 2
      const radius = random(minRadius, maxRadius)
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      let okay = true
      for (const obstacle of this.obstacles) {
        if ((x - obstacle.x) ** 2 + (z - obstacle.z) ** 2 < (obstacle.r + clearance) ** 2) { okay = false; break }
      }
      if (okay) return { x, z }
    }
    const angle = Math.random() * Math.PI * 2
    return { x: Math.cos(angle) * 27, z: Math.sin(angle) * 27 }
  }

  spawnBarrel(x = null, z = null) {
    if (x === null) {
      const spot = this.freePosition(7, 39, 1.1)
      x = spot.x
      z = spot.z
    }
    const mesh = createBarrel()
    mesh.position.set(x, 0.38, z)
    mesh.rotation.y = Math.random() * Math.PI * 2
    this.scene.add(mesh)
    const barrel = { x, z, mesh, hp: 3, alive: true, radius: 0.58 }
    this.barrels.push(barrel)
    this.addObstacle({ x, z, r: 0.56, mesh, type: 'barrel', barrel })
    return barrel
  }

  spawnBarrier(x = null, z = null, rotation = null, owner = null) {
    if (x === null) {
      const spot = this.freePosition(8, 39, 1.6)
      x = spot.x
      z = spot.z
    }
    const mesh = createBarrier()
    mesh.position.set(x, 0.38, z)
    mesh.rotation.y = rotation ?? Math.random() * Math.PI * 2
    this.scene.add(mesh)
    const barrier = { x, z, mesh, hp: 4, maxHp: 4, alive: true, radius: 0.85, owner }
    this.barriers.push(barrier)
    const obstacle = this.addObstacle({ x, z, r: 0.9, mesh, type: 'barrier', barrier })
    barrier.obstacle = obstacle
    return barrier
  }

  spawnPlayer(characterId) {
    const loadout = this.store.battleLoadout(characterId)
    const character = CHARACTER_MAP[characterId]
    const model = createCharacter(character.species, loadout.colors, {
      scale: 0.96,
      weaponType: loadout.weapons[0].type,
      tier: loadout.weapons[0].tier
    })
    model.position.set(0, 0.38, 32)
    model.rotation.y = Math.PI
    this.scene.add(model)
    const bar = createHealthBar(1.35)
    bar.position.y = 3.15
    model.add(bar)
    const name = createNameSprite('YOU', '#d8ff8f')
    name.position.y = 3.55
    model.add(name)
    const weaponGroup = model.userData.parts.weapon
    const player = {
      id: 'player', isPlayer: true, isBoss: false, name: 'YOU', characterId, model, bar, nameSprite: name,
      x: 0, z: 32, rotation: Math.PI, hp: loadout.hp, maxHp: loadout.hp, shield: loadout.shieldStart, maxShield: 300,
      speed: loadout.speed, damageMult: loadout.damage, instinct: loadout.instinct,
      weapons: loadout.weapons.map(weapon => ({ ...weapon })), weaponIndex: 0, attackCooldown: 0, alive: true,
      hurtTimer: 0, rootTimer: 0, slowTimer: 0, radius: 0.58, invulnerable: 0, speedBoost: 0,
      items: { medkit: 1, shield: 1, trap: 1, speed: 1, barricade: 1 },
      passive: character.passive, passiveIcon: character.passive.icon, weaponGroup, itemAnim: 0,
      lastDamageTime: 0, deathTimer: 0, kills: 0, bubble: null, invisTimer: 0, aimAngle: Math.PI,
      shieldCooldown: 0, trapCooldown: 0, walkPhase: 0
    }
    this.player = player
    this.entities.push(player)
    this.updateWeaponModel(player)
    this.updateBar(player)
  }

  spawnBots() {
    const spawnPoints = []
    for (let i = 0; i < 8; i++) {
      let point
      let attempts = 0
      do {
        const angle = (i / 8) * Math.PI * 2 + random(-0.25, 0.25)
        const radius = random(20, 38)
        point = { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius }
        attempts++
      } while (attempts < 8 && spawnPoints.some(other => Math.hypot(point.x - other.x, point.z - other.z) < 3))
      spawnPoints.push(point)
      const character = pick(CHARACTERS)
      const model = createCharacter(character.species, character.colors, {
        scale: 0.88,
        weaponType: character.weapons[0],
        tier: weightedTier()
      })
      model.position.set(point.x, 0.38, point.z)
      this.scene.add(model)
      const bar = createHealthBar(1.1)
      bar.position.y = 2.85
      model.add(bar)
      const name = createNameSprite(BOT_NAMES[i % BOT_NAMES.length], '#ffffff')
      name.position.y = 3.2
      name.scale.set(2, 0.5, 1)
      model.add(name)
      const hp = random(680, 940)
      const weaponType = pick(character.weapons)
      const bot = {
        id: `bot_${i}`, isPlayer: false, isBoss: false, name: BOT_NAMES[i % BOT_NAMES.length], characterId: character.id,
        model, bar, nameSprite: name, x: point.x, z: point.z, rotation: random(0, Math.PI * 2),
        hp, maxHp: hp, shield: 0, maxShield: 300, speed: random(4.5, 5.4), damageMult: random(0.68, 0.84),
        instinct: 1, weapons: [weaponOf(weaponType, weightedTier())], weaponIndex: 0, attackCooldown: random(0.5, 1.8),
        alive: true, hurtTimer: 0, rootTimer: 0, slowTimer: 0, radius: 0.55, invulnerable: 0, speedBoost: 0,
        items: { medkit: Math.random() < 0.45 ? 1 : 0 }, passive: character.passive, passiveIcon: character.passive.icon,
        weaponGroup: model.userData.parts.weapon, target: null, thinkTimer: random(0.2, 0.8), wander: null, walkPhase: random(0, 6),
        burst: 0, burstTimer: 0, aiState: 'roam', deathTimer: 0, lastDamageTime: 0, aimAngle: 0, itemAnim: 0
      }
      this.bots.push(bot)
      this.entities.push(bot)
      this.updateWeaponModel(bot)
      this.updateBar(bot)
    }
    this.totalBots = this.bots.length
    this.aliveBots = this.bots.length
  }

  spawnBoss() {
    const colors = { body: '#b6853e', belly: '#ffe3a0', accent: '#ffd44d', detail: '#5c3718' }
    const model = createCharacter('bear', colors, {
      scale: 1.85,
      boss: true,
      weaponType: 'minigun',
      tier: 'gold',
      aura: '#ffc23d'
    })
    model.position.set(0, 0.42, 6)
    model.rotation.y = Math.PI
    this.scene.add(model)
    const bar = createHealthBar(2.2)
    bar.position.y = 5.2
    model.add(bar)
    const name = createNameSprite('LEGENDARY GUARD', '#ffd451')
    name.position.y = 5.65
    name.scale.set(4.4, 0.9, 1)
    model.add(name)
    const boss = {
      id: 'boss', isPlayer: false, isBoss: true, name: 'LEGENDARY GUARD', characterId: 'boss',
      model, bar, nameSprite: name, x: 0, z: 6, rotation: Math.PI,
      hp: 1850, maxHp: 1850, shield: 250, maxShield: 250, speed: 3.7, damageMult: 0.78,
      instinct: 1.3, weapons: [{ ...weaponOf('minigun', 'gold'), rate: 0.17, damage: 54 }], weaponIndex: 0,
      attackCooldown: 1.2, alive: true, hurtTimer: 0, rootTimer: 0, slowTimer: 0, radius: 1.15, invulnerable: 0,
      speedBoost: 0, items: {}, passive: { name: 'Guardian', desc: 'A living fortress.' }, passiveIcon: 'shield',
      weaponGroup: model.userData.parts.weapon, target: null, thinkTimer: 0.3, burst: 0, burstTimer: 0,
      aiState: 'guard', deathTimer: 0, lastDamageTime: 0, aimAngle: Math.PI, itemAnim: 0
    }
    this.boss = boss
    this.entities.push(boss)
    this.updateWeaponModel(boss)
    this.updateBar(boss)
  }

  spawnLoot() {
    const types = Object.keys(WEAPON_TYPES)
    for (let i = 0; i < 16; i++) {
      const spot = this.freePosition(8, 38, 1)
      const type = pick(types)
      const tier = weightedTier()
      this.addWeaponPickup(type, tier, spot.x, spot.z)
    }
    this.addWeaponPickup('shotgun', 'gold', -8, -8)
    const items = ['medkit', 'medkit', 'medkit', 'medkit', 'shield', 'shield', 'trap', 'trap', 'speed', 'barricade']
    for (const kind of items) {
      const spot = this.freePosition(7, 39, 0.9)
      this.addItemPickup(kind, spot.x, spot.z)
    }
  }

  addWeaponPickup(type, tier, x, z) {
    const mesh = createWeaponPickup(type, tier)
    mesh.position.set(x, 0.38, z)
    this.scene.add(mesh)
    const pickup = { kind: 'weapon', type, tier, x, z, mesh, alive: true, phase: Math.random() * 6 }
    this.pickups.push(pickup)
    return pickup
  }

  addItemPickup(kind, x, z) {
    const mesh = createItemModel(kind)
    mesh.position.set(x, 0.38, z)
    const ring = createPickupRing(kind === 'medkit' ? '#ff7a7a' : kind === 'shield' ? '#73e9ff' : kind === 'speed' ? '#c6ff4a' : kind === 'trap' ? '#ffb56e' : '#d0a877')
    ring.position.y = 0.0
    mesh.add(ring)
    this.scene.add(mesh)
    const pickup = { kind: 'item', item: kind, x, z, mesh, alive: true, phase: Math.random() * 6 }
    this.pickups.push(pickup)
    return pickup
  }

  buildHud() {
    this.root.innerHTML = `
      <div class="battle-top">
        <div class="battle-pill">${iconSvg('paw')}<span class="label">ALIVE</span><strong id="alive-count">${this.aliveBots + 1}</strong></div>
        <div class="battle-pill alert">${iconSvg('skull')}<span class="label">KILLS</span><strong id="kill-count">0</strong></div>
        <div class="battle-center-top">
          <div class="battle-timer" id="battle-timer">00:00</div>
          <div class="battle-boss-bar" id="boss-bar"><div class="boss-name"><span>LEGENDARY GUARD</span><span id="boss-hp">100%</span></div><div class="boss-track"><span id="boss-fill"></span></div></div>
        </div>
        <div class="battle-minimap-wrap"><canvas id="minimap" width="300" height="300"></canvas></div>
        <button class="icon-btn battle-pause" id="pause-btn" aria-label="Pause">${iconSvg('settings')}</button>
      </div>
      <div class="kill-feed" id="kill-feed"></div>
      <div class="announce" id="announce"><div class="announce-kicker" id="announce-kicker"></div><div class="announce-title" id="announce-title"></div><div class="announce-sub" id="announce-sub"></div></div>
      <div class="damage-vignette" id="damage-vignette"></div>
      <div class="battle-left">
        <div class="battle-vitals">
          <div class="vitals-top"><span id="char-label">${this.player.name}</span><strong id="hp-text">${Math.round(this.player.hp)}</strong></div>
          <div class="health-track"><div class="health-fill" id="health-fill"></div><div class="shield-fill" id="shield-fill"></div><div class="health-text" id="health-text"></div></div>
        </div>
        <div class="joystick-wrap" id="joystick"><div class="joystick-knob" id="joystick-knob"></div></div>
        <div class="ability-row">
          <button class="ability-btn heal" data-item="medkit" id="item-medkit">${iconSvg('heal')}<span class="count" id="count-medkit">1</span></button>
          <button class="ability-btn shield" data-item="shield" id="item-shield">${iconSvg('shield')}<span class="count" id="count-shield">1</span></button>
          <button class="ability-btn trap" data-item="trap" id="item-trap">${iconSvg('trap')}<span class="count" id="count-trap">1</span></button>
          <button class="ability-btn speed" data-item="speed" id="item-speed">${iconSvg('speed')}<span class="count" id="count-speed">1</span></button>
          <button class="ability-btn wall" data-item="barricade" id="item-barricade">${iconSvg('wall')}<span class="count" id="count-barricade">1</span></button>
          <button class="ability-btn passive" id="passive-btn" title="${this.player.passive.name}: ${this.player.passive.desc}">${iconSvg(this.player.passiveIcon)}</button>
        </div>
      </div>
      <div class="weapon-bar" id="weapon-bar"></div>
    `
    this.refreshWeaponBar()
    this.aliveCountEl = document.getElementById('alive-count')
    this.killCountEl = document.getElementById('kill-count')
    this.timerEl = document.getElementById('battle-timer')
    this.healthFill = document.getElementById('health-fill')
    this.shieldFill = document.getElementById('shield-fill')
    this.healthText = document.getElementById('health-text')
    this.hpText = document.getElementById('hp-text')
    this.bossBar = document.getElementById('boss-bar')
    this.bossFill = document.getElementById('boss-fill')
    this.bossHp = document.getElementById('boss-hp')
    this.killFeed = document.getElementById('kill-feed')
    this.announceEl = document.getElementById('announce')
    this.damageVignette = document.getElementById('damage-vignette')
    this.minimap = document.getElementById('minimap')
    this.mapContext = this.minimap.getContext('2d')
    document.getElementById('pause-btn').addEventListener('click', () => this.togglePause())
    document.querySelectorAll('.ability-btn[data-item]').forEach(button => {
      button.addEventListener('click', () => this.useItem(button.dataset.item))
    })
  }

  refreshWeaponBar() {
    const bar = document.getElementById('weapon-bar')
    if (!bar) return
    bar.innerHTML = this.player.weapons.map((weapon, index) => {
      const tier = TIERS[weapon.tier]
      return `<button class="weapon-slot ${index === this.player.weaponIndex ? 'active' : ''}" data-slot="${index}" style="--weapon-color:${tier.edge}">
        <span class="weapon-icon">${iconSvg(WEAPON_TYPES[weapon.type].icon)}</span>
        <span><strong>${tier.name} ${WEAPON_TYPES[weapon.type].name}</strong><small>${Math.round(weapon.damage * this.player.damageMult)} DMG</small></span>
        <span class="key-hint">${index + 1}</span>
      </button>`
    }).join('')
    bar.querySelectorAll('[data-slot]').forEach(button => {
      button.addEventListener('click', () => this.shootSlot(Number(button.dataset.slot)))
    })
  }

  shootSlot(index) {
    if (!this.player || !this.player.alive) return
    this.audio.init()
    if (index !== this.player.weaponIndex) this.selectWeapon(index)
    const target = this.nearestTarget(this.player, 16)
    if (this.player.attackCooldown <= 0) this.fireWeapon(this.player, target)
    else this.fireQueued = true
    const button = document.querySelector(`.weapon-slot[data-slot="${index}"]`)
    if (button) {
      button.classList.remove('firing')
      void button.offsetWidth
      button.classList.add('firing')
    }
  }

  selectWeapon(index) {
    if (!this.player || index < 0 || index >= this.player.weapons.length) return
    this.player.weaponIndex = index
    this.player.attackCooldown = 0
    this.audio.click()
    this.updateWeaponModel(this.player)
    this.refreshWeaponBar()
  }

  updateWeaponModel(entity) {
    if (!entity.weaponGroup) return
    const weapon = entity.weapons[entity.weaponIndex]
    if (!weapon) return
    const parent = entity.weaponGroup.parent
    parent.remove(entity.weaponGroup)
    entity.weaponGroup.traverse(object => {
      if (object.geometry) object.geometry.dispose()
      if (object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        for (const material of materials) material.dispose()
      }
    })
    const next = createWeaponModel(weapon.type, weapon.tier, entity.isBoss ? 1.45 : 0.92)
    next.position.copy(entity.weaponGroup.position)
    next.rotation.copy(entity.weaponGroup.rotation)
    parent.add(next)
    entity.weaponGroup = next
    if (entity.model.userData.parts) entity.model.userData.parts.weapon = next
    if (entity.model.userData.parts) entity.model.userData.parts.weaponBase = next.position.clone()
  }

  bindControls() {
    window.addEventListener('keydown', this.bindGlobal)
    window.addEventListener('keyup', this.bindGlobal)
    window.addEventListener('resize', this.onResize)
    this.renderer.domElement.addEventListener('pointermove', this.bindGlobal)
    this.renderer.domElement.addEventListener('pointerdown', this.bindGlobal)
    window.addEventListener('pointerup', this.bindGlobal)
    this.bindJoystick()
  }

  bindJoystick() {
    const wrap = document.getElementById('joystick')
    const knob = document.getElementById('joystick-knob')
    if (!wrap) return
    const update = event => {
      const rect = wrap.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      let dx = event.clientX - cx
      let dy = event.clientY - cy
      const max = rect.width * 0.34
      const length = Math.hypot(dx, dy)
      if (length > max) { dx = dx / length * max; dy = dy / length * max }
      knob.style.transform = `translate(${dx}px,${dy}px)`
      this.input.x = dx / max
      this.input.z = dy / max
      if (Math.hypot(this.input.x, this.input.z) < 0.15) { this.input.x = 0; this.input.z = 0 }
    }
    const end = () => {
      this.joystickPointer = null
      knob.style.transform = ''
      this.input.x = 0
      this.input.z = 0
    }
    wrap.addEventListener('pointerdown', event => {
      event.preventDefault()
      this.audio.init()
      this.isTouch = true
      this.joystickPointer = event.pointerId
      wrap.setPointerCapture(event.pointerId)
      update(event)
    })
    wrap.addEventListener('pointermove', event => {
      if (this.joystickPointer === event.pointerId) update(event)
    })
    wrap.addEventListener('pointerup', event => {
      if (this.joystickPointer === event.pointerId) end()
    })
    wrap.addEventListener('pointercancel', end)
  }

  bindGlobal(event) {
    if (event.type === 'keydown') {
      this.keys.add(event.code)
      if (event.code === 'Space') { this.input.fire = true; event.preventDefault() }
      if (event.code === 'Digit1') this.selectWeapon(0)
      if (event.code === 'Digit2') this.selectWeapon(1)
      if (event.code === 'Digit3') this.selectWeapon(2)
      if (event.code === 'KeyQ') this.useItem('medkit')
      if (event.code === 'KeyE') this.useItem('shield')
      if (event.code === 'KeyR') this.useItem('speed')
      if (event.code === 'KeyF') this.useItem('trap')
      if (event.code === 'KeyG') this.useItem('barricade')
      if (event.code === 'Escape') this.togglePause()
    } else if (event.type === 'keyup') {
      this.keys.delete(event.code)
      if (event.code === 'Space') this.input.fire = false
    } else if (event.type === 'pointermove') {
      if (event.pointerType === 'mouse') {
        this.isTouch = false
        this.manualAim = true
        this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1
        this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
        this.updateAimFromPointer()
      }
    } else if (event.type === 'pointerdown') {
      if (event.pointerType === 'mouse' && event.button === 0) {
        this.audio.init()
        this.input.fire = true
      }
    } else if (event.type === 'pointerup') {
      if (event.pointerType === 'mouse') this.input.fire = false
    }
  }

  updateAimFromPointer() {
    if (!this.camera) return
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const point = new THREE.Vector3()
    if (this.raycaster.ray.intersectPlane(this.aimPlane, point)) {
      this.aimPoint.copy(point)
      if (this.player) this.player.aimAngle = Math.atan2(point.x - this.player.x, point.z - this.player.z)
    }
  }

  onResize() {
    if (!this.camera) return
    const width = window.innerWidth
    const height = window.innerHeight
    this.camera.aspect = width / height
    this.camera.fov = height > width ? 58 : 52
    this.camera.updateProjectionMatrix()
    this.cameraOffset = height > width ? new THREE.Vector3(0, 24.5, 21.5) : new THREE.Vector3(0, 20.5, 23.5)
    this.camera.lookAt(this.player ? this.player.x : 0, 1.2, this.player ? this.player.z : 0)
  }

  update(dt) {
    if (!this.running || this.paused) {
      if (this.scene) this.render()
      return
    }
    this.elapsed += dt
    this.cameraShake = Math.max(0, this.cameraShake - dt * 4)
    if (this.announceTimer > 0) {
      this.announceTimer -= dt
      if (this.announceTimer <= 0) this.announceEl.classList.remove('show')
    }
    if (this.ended) {
      this.endTimer -= dt
      this.updateEffects(dt)
      this.updateCamera(dt)
      this.updateEntityAnimations(dt)
      if (!this.resultShown && this.endTimer <= 0) this.showResult()
      this.render()
      return
    }
    this.updatePlayer(dt)
    this.updateBots(dt)
    this.updateBoss(dt)
    this.updateProjectiles(dt)
    this.updatePickups(dt)
    this.updateTraps(dt)
    this.updateEffects(dt)
    this.updateEntityAnimations(dt)
    this.updateCamera(dt)
    this.updateHud()
    this.render()
  }

  updatePlayer(dt) {
    const player = this.player
    if (!player.alive) return
    player.attackCooldown = Math.max(0, player.attackCooldown - dt)
    player.invulnerable = Math.max(0, player.invulnerable - dt)
    player.speedBoost = Math.max(0, player.speedBoost - dt)
    player.rootTimer = Math.max(0, player.rootTimer - dt)
    player.hurtTimer = Math.max(0, player.hurtTimer - dt)
    player.invisTimer = Math.max(0, player.invisTimer - dt)
    player.itemAnim = Math.max(0, player.itemAnim - dt)
    if (player.bubble) {
      const ratio = clamp(player.invulnerable / 5, 0, 1)
      player.bubble.material.opacity = 0.16 + Math.sin(this.elapsed * 5) * 0.05
      player.bubble.scale.setScalar(1.1 + Math.sin(this.elapsed * 3.2) * 0.04)
      if (player.invulnerable <= 0) this.removeBubble(player)
    }
    if (player.invisTimer <= 0) player.model.visible = true
    let moveX = this.input.x
    let moveZ = this.input.z
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) moveZ -= 1
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) moveZ += 1
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) moveX -= 1
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) moveX += 1
    const length = Math.hypot(moveX, moveZ)
    if (length > 0.01) {
      moveX /= length
      moveZ /= length
      const boost = player.speedBoost > 0 ? 1.55 : 1
      const root = player.rootTimer > 0 ? 0 : 1
      this.moveEntity(player, moveX * player.speed * boost * root * dt, moveZ * player.speed * boost * root * dt)
      player.walkPhase += dt * 9
      player.rotation = Math.atan2(moveX, moveZ)
      if (player.weaponGroup) player.weaponGroup.rotation.x = 0
    }
    const target = this.nearestTarget(player, 16)
    if (this.manualAim && !this.isTouch) {
      player.rotation = player.aimAngle
    } else if (target) {
      player.rotation = angleTo(player, target)
      player.aimAngle = player.rotation
    } else if (length > 0.01) {
      player.aimAngle = player.rotation
    }
    const aim = createAimRing('#c6ff4a')
    if (this.aimRing) {
      this.scene.remove(this.aimRing)
      this.aimRing.traverse(object => { if (object.geometry) object.geometry.dispose(); if (object.material) object.material.dispose() })
    }
    aim.position.set(player.x + Math.sin(player.rotation) * 2.4, 0.42, player.z + Math.cos(player.rotation) * 2.4)
    this.scene.add(aim)
    this.aimRing = aim
    if ((this.input.fire || this.fireQueued) && player.attackCooldown <= 0) {
      this.fireWeapon(player, target)
      this.fireQueued = false
    }
    this.updateBar(player)
  }

  updateBots(dt) {
    for (const bot of this.bots) {
      if (!bot.alive) { bot.deathTimer += dt; continue }
      bot.attackCooldown = Math.max(0, bot.attackCooldown - dt)
      bot.hurtTimer = Math.max(0, bot.hurtTimer - dt)
      bot.rootTimer = Math.max(0, bot.rootTimer - dt)
      bot.slowTimer = Math.max(0, bot.slowTimer - dt)
      bot.thinkTimer -= dt
      if (bot.thinkTimer <= 0) {
        bot.thinkTimer = random(0.25, 0.5)
        const target = this.nearestTarget(bot, 15)
        bot.target = target
        if (bot.hp < bot.maxHp * 0.35 && bot.items.medkit > 0) {
          bot.items.medkit -= 1
          bot.hp = Math.min(bot.maxHp, bot.hp + bot.maxHp * 0.4)
          this.spawnHealEffect(bot)
          bot.aiState = 'heal'
        } else if (target) {
          bot.aiState = 'attack'
        } else {
          bot.aiState = 'roam'
          if (!bot.wander || Math.hypot(bot.x - bot.wander.x, bot.z - bot.wander.z) < 1.5) {
            const pickup = this.nearestPickup(bot, 20)
            if (pickup) bot.wander = { x: pickup.x, z: pickup.z }
            else {
              const spot = this.freePosition(7, 38, 0.8)
              bot.wander = spot
            }
          }
        }
      }
      const weapon = bot.weapons[bot.weaponIndex]
      if (bot.aiState === 'attack' && bot.target && bot.target.alive) {
        const distance = Math.hypot(bot.target.x - bot.x, bot.target.z - bot.z)
        const desired = weapon.range * 0.62
        const direction = angleTo(bot, bot.target)
        bot.rotation = direction
        if (distance > desired) {
          const speed = bot.speed * (bot.rootTimer > 0 ? 0 : 1)
          this.moveEntity(bot, Math.sin(direction) * speed * dt, Math.cos(direction) * speed * dt)
        } else if (distance < desired * 0.55) {
          this.moveEntity(bot, -Math.sin(direction) * bot.speed * 0.6 * dt, -Math.cos(direction) * bot.speed * 0.6 * dt)
        } else {
          const strafe = direction + Math.PI / 2
          this.moveEntity(bot, Math.sin(strafe) * bot.speed * 0.4 * dt, Math.cos(strafe) * bot.speed * 0.4 * dt)
        }
        if (distance < weapon.range * 1.05 && bot.attackCooldown <= 0) {
          this.fireWeapon(bot, bot.target, random(-0.09, 0.09))
          bot.attackCooldown = weapon.rate * random(1.2, 1.8)
        }
      } else if (bot.wander) {
        const direction = angleTo(bot, bot.wander)
        bot.rotation = direction
        if (Math.hypot(bot.wander.x - bot.x, bot.wander.z - bot.z) > 0.8) {
          const speed = bot.speed * (bot.rootTimer > 0 ? 0 : 1)
          this.moveEntity(bot, Math.sin(direction) * speed * 0.72 * dt, Math.cos(direction) * speed * 0.72 * dt)
        } else {
          bot.wander = null
        }
      }
      if (bot.hurtTimer > 0) bot.model.position.y = 0.38 + Math.sin(this.elapsed * 60) * 0.025
      this.updateBar(bot)
    }
  }

  updateBoss(dt) {
    const boss = this.boss
    if (!boss || !boss.alive) return
    boss.attackCooldown = Math.max(0, boss.attackCooldown - dt)
    boss.hurtTimer = Math.max(0, boss.hurtTimer - dt)
    boss.rootTimer = Math.max(0, boss.rootTimer - dt)
    boss.thinkTimer -= dt
    if (boss.thinkTimer <= 0) {
      boss.thinkTimer = 0.35
      const target = this.nearestTarget(boss, 26)
      boss.target = target
      if (target) {
        boss.aiState = 'attack'
        boss.rotation = angleTo(boss, target)
      } else boss.aiState = 'guard'
    }
    if (boss.aiState === 'attack' && boss.target && boss.target.alive) {
      const distance = Math.hypot(boss.target.x - boss.x, boss.target.z - boss.z)
      const direction = angleTo(boss, boss.target)
      boss.rotation = direction
      if (distance > 11) {
        this.moveEntity(boss, Math.sin(direction) * boss.speed * dt, Math.cos(direction) * boss.speed * dt)
      } else if (distance < 6) {
        this.moveEntity(boss, -Math.sin(direction) * boss.speed * 0.4 * dt, -Math.cos(direction) * boss.speed * 0.4 * dt)
      }
      if (boss.burst > 0) {
        boss.burstTimer -= dt
        if (boss.burstTimer <= 0) {
          boss.burst -= 1
          boss.burstTimer = 0.15
          this.fireWeapon(boss, boss.target, random(-0.055, 0.055))
        }
      } else if (boss.attackCooldown <= 0) {
        boss.burst = 5
        boss.burstTimer = 0
        boss.attackCooldown = random(2.1, 2.7)
        this.audio.shoot('minigun', 'gold')
      }
    }
    if (boss.hurtTimer > 0) boss.model.position.y = 0.42 + Math.sin(this.elapsed * 50) * 0.03
    this.updateBar(boss)
  }

  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i]
      projectile.life -= dt
      projectile.traveled += projectile.speed * dt
      projectile.mesh.position.x += Math.sin(projectile.angle) * projectile.speed * dt
      projectile.mesh.position.z += Math.cos(projectile.angle) * projectile.speed * dt
      if (projectile.kind === 'bomb') {
        projectile.mesh.position.y = projectile.baseY + Math.sin(clamp(projectile.traveled / 4, 0, 1) * Math.PI) * 1.6
      }
      projectile.mesh.rotation.x += dt * 12
      projectile.mesh.rotation.z += dt * 8
      let hit = false
      for (const entity of this.entities) {
        if (!entity.alive || entity === projectile.owner) continue
        if (projectile.hitEntities?.has(entity)) continue
        if (dist2(projectile.mesh.position, entity) < (entity.radius + 0.26) ** 2) {
          this.projectileHit(projectile, entity)
          hit = true
          break
        }
      }
      if (!hit) {
        for (const obstacle of this.obstacles) {
          if (obstacle.mesh && obstacle.mesh.visible === false) continue
          if ((projectile.mesh.position.x - obstacle.x) ** 2 + (projectile.mesh.position.z - obstacle.z) ** 2 < (obstacle.r + 0.1) ** 2) {
            if (obstacle.type === 'barrier') this.damageBarrier(obstacle.barrier, 1, projectile.owner)
            else if (obstacle.type === 'barrel') this.damageBarrel(obstacle.barrel, 1, projectile.owner)
            if (projectile.kind === 'bomb') this.explode(projectile)
            hit = true
            break
          }
        }
      }
      if (hit || projectile.life <= 0 || projectile.traveled > projectile.maxDistance) {
        if (!hit && projectile.kind === 'bomb') this.explode(projectile)
        this.removeProjectile(i)
      }
    }
  }

  projectileHit(projectile, entity) {
    if (projectile.kind === 'bomb') {
      this.explode(projectile)
      return
    }
    const damage = projectile.damage
    this.damageEntity(entity, damage, projectile.owner)
    this.spawnHitEffect(projectile.mesh.position.x, projectile.mesh.position.y, projectile.mesh.position.z, projectile.color)
    this.audio.hit()
    if (projectile.kind !== 'pierce') {
      const index = this.projectiles.indexOf(projectile)
      if (index >= 0) this.removeProjectile(index)
    } else {
      projectile.hitEntities = projectile.hitEntities || new Set()
      projectile.hitEntities.add(entity)
      projectile.damage *= 0.8
    }
  }

  explode(projectile) {
    const radius = 2.6
    this.spawnExplosion(projectile.mesh.position.x, projectile.mesh.position.z, projectile.color)
    this.audio.explosion()
    for (const entity of this.entities) {
      if (!entity.alive || entity === projectile.owner) continue
      const distance = Math.hypot(entity.x - projectile.mesh.position.x, entity.z - projectile.mesh.position.z)
      if (distance < radius + entity.radius) {
        this.damageEntity(entity, projectile.damage * (1 - distance / (radius + 1.4)), projectile.owner)
      }
    }
    for (const barrier of this.barriers) {
      if (!barrier.alive) continue
      if (Math.hypot(barrier.x - projectile.mesh.position.x, barrier.z - projectile.mesh.position.z) < radius + 1) this.damageBarrier(barrier, 2, projectile.owner)
    }
    for (const barrel of this.barrels) {
      if (!barrel.alive) continue
      if (Math.hypot(barrel.x - projectile.mesh.position.x, barrel.z - projectile.mesh.position.z) < radius + 1) this.damageBarrel(barrel, 3, projectile.owner)
    }
    this.cameraShake = Math.max(this.cameraShake, 0.5)
  }

  removeProjectile(index) {
    const projectile = this.projectiles[index]
    if (!projectile) return
    this.scene.remove(projectile.mesh)
    projectile.mesh.traverse(object => {
      if (object.geometry) object.geometry.dispose()
      if (object.material) object.material.dispose()
    })
    this.projectiles.splice(index, 1)
  }

  fireWeapon(entity, target = null, extraSpread = 0) {
    const weapon = entity.weapons[entity.weaponIndex]
    if (!weapon || !entity.alive) return
    entity.attackCooldown = weapon.rate
    entity.itemAnim = 1
    if (entity.isPlayer && entity.invulnerable > 0 && entity.bubble) this.breakSpeedShield()
    let baseAngle = entity.rotation
    if (target) baseAngle = angleTo(entity, target)
    else if (entity.isPlayer && this.manualAim) baseAngle = entity.aimAngle
    const color = TIERS[weapon.tier].edge
    const count = weapon.pellets
    for (let i = 0; i < count; i++) {
      const spread = (weapon.spread || 0) * (Math.random() - 0.5) * 2 + extraSpread
      const angle = baseAngle + spread
      this.spawnProjectile(entity, weapon, angle, color)
    }
    this.audio.shoot(weapon.type, weapon.tier)
    if (entity.isPlayer) {
      const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 5), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 }))
      muzzle.position.set(entity.x + Math.sin(baseAngle) * 1.05, 1.25, entity.z + Math.cos(baseAngle) * 1.05)
      this.scene.add(muzzle)
      this.effects.push({ type: 'muzzle', mesh: muzzle, life: 0.06, maxLife: 0.06 })
    }
  }

  spawnProjectile(entity, weapon, angle, color) {
    const geometry = weapon.kind === 'bomb'
      ? new THREE.SphereGeometry(0.18, 8, 6)
      : new THREE.CylinderGeometry(0.055, 0.085, 0.65, 6)
    const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 })
    const mesh = new THREE.Mesh(geometry, material)
    if (weapon.kind !== 'bomb') mesh.rotation.x = Math.PI / 2
    const baseY = weapon.kind === 'bomb' ? 1.1 : 1.22
    mesh.position.set(entity.x + Math.sin(angle) * 0.9, baseY, entity.z + Math.cos(angle) * 0.9)
    mesh.rotation.y = angle
    this.scene.add(mesh)
    let damage = weapon.damage * entity.damageMult
    if (entity.isPlayer) {
      const marked = this.nearestTarget(entity, 20)
      if (entity.characterId === 'luna' && marked && marked.hp < marked.maxHp * 0.5) damage *= 1 + 0.14 * entity.instinct
      if (entity.characterId === 'tusk' && entity.hp < entity.maxHp * 0.4) damage *= 1 + 0.18 * entity.instinct
      if (entity.characterId === 'croc' && weapon.type === 'lance') damage *= 1 + 0.2 * entity.instinct
      if (entity.characterId === 'blaze') damage *= 1 + 0.06 * entity.instinct
      if (entity.speedBoost > 0) damage *= 1.05
    }
    this.projectiles.push({
      mesh, angle, speed: weapon.speed, life: weapon.range / weapon.speed + 0.4,
      maxDistance: weapon.range, traveled: 0, damage, owner: entity, color,
      kind: weapon.kind, baseY, splash: weapon.splash || 0, hitEntities: new Set()
    })
  }

  damageEntity(entity, amount, source = null) {
    if (!entity.alive || amount <= 0) return
    if (entity.invulnerable > 0) {
      this.spawnDamageText(entity.x, entity.z, 'IMMUNE', '#a9f7ff')
      return
    }
    let damage = amount
    if (entity.characterId === 'rocco') damage *= 1 - 0.1 * (entity.instinct || 1)
    if (entity.shield > 0) {
      const absorbed = Math.min(entity.shield, damage)
      entity.shield -= absorbed
      damage -= absorbed
    }
    if (damage > 0) entity.hp -= damage
    entity.hurtTimer = 0.18
    if (entity.isPlayer) {
      this.cameraShake = Math.max(this.cameraShake, 0.24)
      this.flashDamage()
      this.audio.hurt()
    }
    if (source?.isPlayer) {
      this.damageDealt += Math.min(damage, Math.max(0, entity.hp + damage))
      this.spawnDamageText(entity.x, entity.z, Math.round(damage), source.characterId === 'king' ? '#ffd451' : '#ffffff')
      if (entity.isBoss) this.spawnHitEffect(entity.x, 1.4, entity.z, '#ffd451')
    }
    this.updateBar(entity)
    if (entity.hp <= 0) this.killEntity(entity, source)
  }

  killEntity(entity, source) {
    if (!entity.alive) return
    entity.alive = false
    entity.deathTimer = 0
    entity.hp = 0
    entity.bar.visible = false
    entity.nameSprite.visible = false
    this.spawnDeathEffect(entity.x, entity.z)
    if (entity.isPlayer) {
      this.audio.lose()
      this.finishMatch(false)
      return
    }
    if (source?.isPlayer) {
      source.kills = (source.kills || 0) + 1
      this.kills += 1
      this.killCountEl.textContent = this.kills
      if (source.characterId === 'mako') source.hp = Math.min(source.maxHp, source.hp + 40 * source.instinct)
      if (source.characterId === 'king') {
        for (const other of this.entities) if (other.alive && other !== source && Math.hypot(other.x - entity.x, other.z - entity.z) < 5) other.slowTimer = 2
      }
      this.audio.chest()
    }
    this.addKillFeed(source?.name || 'Jungle', entity.name, Boolean(source?.isPlayer))
    if (entity.isBoss) {
      this.bossKilled = true
      this.bossBar.classList.remove('show')
      this.announce('GUARDIAN DOWN', 'LEGENDARY DROP', 'The legendary weapon is yours to claim.', 3.2)
      this.audio.boss()
      this.addWeaponPickup(pick(['shotgun', 'bow', 'lance', 'minigun', 'staff']), 'legendary', entity.x, entity.z)
      this.addItemPickup('medkit', entity.x + 1, entity.z)
      this.spawnExplosion(entity.x, entity.z, '#ffd451')
    } else {
      this.aliveBots = Math.max(0, this.aliveBots - 1)
      this.aliveCountEl.textContent = this.aliveBots + 1
      if (Math.random() < 0.55) {
        const weapon = entity.weapons[0]
        this.addWeaponPickup(weapon.type, weapon.tier, entity.x, entity.z)
      }
      if (Math.random() < 0.35) this.addItemPickup(pick(['medkit', 'shield', 'trap', 'speed']), entity.x + 0.8, entity.z)
    }
    if (this.aliveBots <= 0 && this.player.alive) {
      this.audio.win()
      this.finishMatch(true)
    }
  }

  finishMatch(win) {
    if (this.ended) return
    this.ended = true
    this.endTimer = 1.4
    this.input.fire = false
    this.finalWin = win
    this.finalPlacement = win ? 1 : this.aliveBots + 1
    if (win) {
      this.announce('VICTORY', 'LAST BEAST STANDING', 'The jungle bows to you.', 4)
      this.player.model.rotation.y = 0
    } else {
      this.announce('ELIMINATED', 'THE JUNGLE WINS', 'Your legend will grow stronger.', 3)
    }
    this.result = this.store.awardMatch({
      placement: this.finalPlacement,
      win,
      kills: this.kills,
      damage: this.damageDealt,
      barrels: this.barrelsBroken,
      pickups: this.weaponPickups,
      medkits: this.medkitsUsed,
      duration: this.elapsed,
      character: this.characterId,
      bossKilled: this.bossKilled
    })
  }

  showResult() {
    if (this.resultShown) return
    this.resultShown = true
    const result = this.result
    const html = `
      <div class="pause-menu">
        <div class="result-card">
          <div class="result-banner ${result.win ? '' : 'defeat'}">
            <div class="result-kicker">${result.win ? 'VICTORY ROYALE' : 'MATCH COMPLETE'}</div>
            <h2>${result.win ? 'LAST BEAST!' : `#${result.placement}`}</h2>
            <p>${result.win ? 'You outlasted every rival in the jungle.' : `You placed #${result.placement} of ${this.totalBots + 1}. The jungle remembers.`}</p>
          </div>
          <div class="result-stats">
            <div class="result-stat"><strong>${result.kills}</strong><small>Eliminations</small></div>
            <div class="result-stat"><strong>${number(result.damage)}</strong><small>Damage</small></div>
            <div class="result-stat"><strong>${result.bossKilled ? 'YES' : 'NO'}</strong><small>Boss Slain</small></div>
          </div>
          <div class="result-rewards">
            <span class="reward-chip coins">${iconSvg('coin')} +${result.coins}</span>
            <span class="reward-chip trophies">${iconSvg('trophy')} ${result.trophies >= 0 ? '+' : ''}${result.trophies}</span>
            <span class="reward-chip xp">${iconSvg('pass')} +${result.xp} XP</span>
          </div>
          <div class="result-actions">
            <button class="btn btn-primary" id="result-replay">${iconSvg('refresh')} Play Again</button>
            <button class="btn btn-ghost" id="result-home">${iconSvg('home')} Home</button>
          </div>
        </div>
      </div>
    `
    const wrap = document.createElement('div')
    wrap.innerHTML = html
    this.root.appendChild(wrap.firstElementChild)
    document.getElementById('result-replay').addEventListener('click', () => this.onExit('replay'))
    document.getElementById('result-home').addEventListener('click', () => this.onExit('home'))
  }

  updateBar(entity) {
    if (!entity.bar) return
    const hpRatio = clamp(entity.hp / entity.maxHp, 0, 1)
    const shieldRatio = clamp(entity.shield / entity.maxHp, 0, 1)
    setHealthBar(entity.bar, hpRatio, shieldRatio)
  }

  updatePickups(dt) {
    for (const pickup of this.pickups) {
      if (!pickup.alive) continue
      pickup.phase += dt
      pickup.mesh.position.y = 0.38 + Math.sin(pickup.phase * 2.2) * 0.12
      pickup.mesh.rotation.y += dt * 1.3
      if (pickup.mesh.userData.ring) pickup.mesh.userData.ring.rotation.y += dt * 0.6
      if (this.player.alive && Math.hypot(this.player.x - pickup.x, this.player.z - pickup.z) < 1.65) {
        this.collectPickup(pickup, this.player)
        continue
      }
      for (const bot of this.bots) {
        if (!bot.alive) continue
        if (Math.hypot(bot.x - pickup.x, bot.z - pickup.z) < 1.5) {
          if (pickup.kind === 'weapon') {
            const current = bot.weapons[0]
            if (TIER_ORDER.indexOf(pickup.tier) > TIER_ORDER.indexOf(current.tier)) {
              bot.weapons[0] = weaponOf(pickup.type, pickup.tier)
              this.updateWeaponModel(bot)
              pickup.alive = false
              this.scene.remove(pickup.mesh)
            }
          }
        }
      }
    }
    for (const trap of this.traps) {
      if (!trap.alive) continue
      trap.mesh.rotation.y += dt * 0.4
    }
  }

  collectPickup(pickup, player) {
    if (pickup.kind === 'weapon') {
      const incomingTier = TIER_ORDER.indexOf(pickup.tier)
      const matching = player.weapons.findIndex(weapon => weapon.type === pickup.type)
      let targetIndex = matching
      if (targetIndex < 0) {
        targetIndex = player.weapons.findIndex(weapon => weapon.tier === 'wood')
        if (targetIndex < 0) {
          let weakest = 0
          for (let i = 1; i < player.weapons.length; i++) if (TIER_ORDER.indexOf(player.weapons[i].tier) < TIER_ORDER.indexOf(player.weapons[weakest].tier)) weakest = i
          targetIndex = weakest
        }
      }
      if (TIER_ORDER.indexOf(player.weapons[targetIndex].tier) >= incomingTier && matching < 0) return
      player.weapons[targetIndex] = weaponOf(pickup.type, pickup.tier)
      player.weaponIndex = targetIndex
      this.weaponPickups += 1
      this.audio.pickup()
      this.toastInGame(`${TIERS[pickup.tier].name} ${WEAPON_TYPES[pickup.type].name} equipped`, TIERS[pickup.tier].edge)
      this.updateWeaponModel(player)
      this.refreshWeaponBar()
    } else {
      const cap = ITEM_CAPS[pickup.item] || 1
      if ((player.items[pickup.item] || 0) >= cap) {
        this.toastInGame(`${ITEM_NAMES[pickup.item]} full`, '#ffd451')
        return
      }
      player.items[pickup.item] = (player.items[pickup.item] || 0) + 1
      this.audio.pickup()
      this.toastInGame(`${ITEM_NAMES[pickup.item]} collected`, pickup.item === 'medkit' ? '#ff8f8f' : '#b9f7ff')
    }
    pickup.alive = false
    this.scene.remove(pickup.mesh)
    pickup.mesh.traverse(object => {
      if (object.geometry) object.geometry.dispose()
      if (object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        for (const material of materials) material.dispose()
      }
    })
    this.spawnPickupBurst(pickup.x, pickup.z, pickup.kind === 'weapon' ? TIERS[pickup.tier].edge : '#c6ff4a')
  }

  nearestPickup(entity, range) {
    let best = null
    let bestDistance = range * range
    for (const pickup of this.pickups) {
      if (!pickup.alive) continue
      const distance = dist2(entity, pickup)
      if (distance < bestDistance) { bestDistance = distance; best = pickup }
    }
    return best
  }

  nearestTarget(entity, range) {
    let best = null
    let bestDistance = range * range
    for (const other of this.entities) {
      if (!other.alive || other === entity) continue
      if (entity.isBoss && other.isBoss) continue
      if (!entity.isBoss && other.isBoss && !entity.isPlayer) continue
      const distance = dist2(entity, other)
      if (distance < bestDistance) { bestDistance = distance; best = other }
    }
    return best
  }

  moveEntity(entity, dx, dz) {
    let x = entity.x + dx
    let z = entity.z + dz
    const distanceFromCenter = Math.hypot(x, z)
    if (distanceFromCenter > ARENA_RADIUS - entity.radius) {
      x = x / distanceFromCenter * (ARENA_RADIUS - entity.radius)
      z = z / distanceFromCenter * (ARENA_RADIUS - entity.radius)
    }
    for (const obstacle of this.obstacles) {
      if (obstacle.mesh && obstacle.mesh.visible === false) continue
      const dx2 = x - obstacle.x
      const dz2 = z - obstacle.z
      const distance = Math.hypot(dx2, dz2)
      const minDistance = obstacle.r + entity.radius
      if (distance < minDistance && distance > 0.0001) {
        x = obstacle.x + dx2 / distance * minDistance
        z = obstacle.z + dz2 / distance * minDistance
      }
    }
    for (const other of this.entities) {
      if (other === entity || !other.alive) continue
      const dx2 = x - other.x
      const dz2 = z - other.z
      const distance = Math.hypot(dx2, dz2)
      const minDistance = entity.radius + other.radius
      if (distance < minDistance && distance > 0.0001) {
        x = other.x + dx2 / distance * minDistance
        z = other.z + dz2 / distance * minDistance
      }
    }
    entity.x = x
    entity.z = z
    entity.model.position.x = x
    entity.model.position.z = z
  }

  useItem(kind) {
    if (!this.player?.alive || this.paused || this.ended) return
    const player = this.player
    if ((player.items[kind] || 0) <= 0) {
      this.toastInGame(`No ${ITEM_NAMES[kind]} left`, '#ffb0b0')
      return
    }
    if (kind === 'medkit') {
      if (player.hp >= player.maxHp - 1) { this.toastInGame('Health is already full', '#ffd451'); return }
      player.items.medkit -= 1
      player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.4)
      this.medkitsUsed += 1
      this.audio.heal()
      this.spawnHealEffect(player)
      this.toastInGame('+40% health', '#9dff8a')
    } else if (kind === 'shield') {
      if (player.shield > 0) { this.toastInGame('Shield is still active', '#9fe8ff'); return }
      player.items.shield -= 1
      player.shield = 300 * (player.characterId === 'kiko' ? 1.2 : 1)
      player.maxShield = Math.max(player.maxShield, player.shield)
      this.audio.shield()
      this.spawnShieldEffect(player)
      this.toastInGame('White shield activated', '#c9f8ff')
    } else if (kind === 'speed') {
      if (player.invulnerable > 0) { this.toastInGame('Speed shield is already active', '#c6ff4a'); return }
      player.items.speed -= 1
      player.invulnerable = 5
      this.audio.shield()
      this.addBubble(player)
      this.toastInGame('Invincible — attack to burst forward', '#c6ff4a')
    } else if (kind === 'trap') {
      player.items.trap -= 1
      const trap = createTrap()
      trap.position.set(player.x, 0.39, player.z)
      this.scene.add(trap)
      this.traps.push({ mesh: trap, x: player.x, z: player.z, alive: true, owner: player })
      this.audio.trap()
      this.toastInGame('Bear trap placed', '#ffbe7a')
    } else if (kind === 'barricade') {
      player.items.barricade -= 1
      const forward = player.rotation
      const x = player.x + Math.sin(forward) * 1.7
      const z = player.z + Math.cos(forward) * 1.7
      this.spawnBarrier(x, z, forward + Math.PI / 2, player)
      this.audio.trap()
      this.toastInGame('Wooden wall deployed — 4 hits', '#d8b183')
    }
    if (player.characterId === 'glitch') {
      player.invisTimer = 1.6
      player.model.visible = false
    }
    this.updateItemHud()
  }

  breakSpeedShield() {
    const player = this.player
    if (!player.bubble) return
    this.removeBubble(player)
    player.invulnerable = 0
    player.speedBoost = 5
    this.spawnShieldEffect(player)
    this.audio.shield()
    this.toastInGame('Shield burst — speed boost!', '#c6ff4a')
  }

  addBubble(entity) {
    if (entity.bubble) return
    const bubble = new THREE.Mesh(new THREE.SphereGeometry(1.35, 20, 14), new THREE.MeshBasicMaterial({ color: '#a9f7ff', transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }))
    bubble.position.y = 1.45
    entity.model.add(bubble)
    entity.bubble = bubble
  }

  removeBubble(entity) {
    if (!entity.bubble) return
    entity.model.remove(entity.bubble)
    entity.bubble.geometry.dispose()
    entity.bubble.material.dispose()
    entity.bubble = null
  }

  updateTraps(dt) {
    for (let i = this.traps.length - 1; i >= 0; i--) {
      const trap = this.traps[i]
      if (!trap.alive) continue
      for (const entity of this.entities) {
        if (!entity.alive || entity === trap.owner) continue
        if (Math.hypot(entity.x - trap.x, entity.z - trap.z) < 0.95 + entity.radius) {
          this.damageEntity(entity, entity.maxHp * 0.2, trap.owner)
          entity.rootTimer = 3
          this.spawnHitEffect(trap.x, 0.5, trap.z, '#ff9a5b')
          this.audio.trap()
          this.toastInGame(`${entity.isPlayer ? 'You are' : `${entity.name} is`} trapped!`, '#ff9a5b')
          trap.alive = false
          this.scene.remove(trap.mesh)
          this.traps.splice(i, 1)
          break
        }
      }
    }
  }

  damageBarrel(barrel, amount, owner) {
    if (!barrel.alive) return
    barrel.hp -= amount
    if (barrel.hp > 0) {
      barrel.mesh.position.y = 0.38 + Math.sin(this.elapsed * 45) * 0.04
      return
    }
    barrel.alive = false
    barrel.mesh.visible = false
    const obstacle = this.obstacles.find(entry => entry.barrel === barrel)
    if (obstacle) obstacle.mesh = null
    this.spawnDebris(barrel.x, barrel.z, '#b07a42')
    if (owner?.isPlayer) {
      this.barrelsBroken += 1
      this.audio.chest()
    }
    if (Math.random() < 0.62) {
      this.addItemPickup(pick(['medkit', 'medkit', 'shield', 'trap', 'speed', 'barricade']), barrel.x, barrel.z)
    } else {
      this.addWeaponPickup(pick(Object.keys(WEAPON_TYPES)), weightedTier(), barrel.x, barrel.z)
    }
    if (owner?.characterId === 'mango') this.addItemPickup('medkit', barrel.x + 0.6, barrel.z)
  }

  damageBarrier(barrier, amount, owner) {
    if (!barrier || !barrier.alive) return
    barrier.hp -= amount
    barrier.mesh.position.y = 0.38 + Math.sin(this.elapsed * 40) * 0.03
    if (barrier.hp > 0) return
    barrier.alive = false
    barrier.mesh.visible = false
    if (barrier.obstacle) barrier.obstacle.mesh = null
    this.spawnDebris(barrier.x, barrier.z, '#b47a44')
    this.audio.trap()
  }

  updateEffects(dt) {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i]
      effect.life -= dt
      if (effect.type === 'particles') {
        const positions = effect.mesh.geometry.attributes.position.array
        for (let j = 0; j < effect.velocities.length; j++) {
          const velocity = effect.velocities[j]
          positions[j * 3] += velocity.x * dt
          positions[j * 3 + 1] += velocity.y * dt
          positions[j * 3 + 2] += velocity.z * dt
          velocity.y -= 9 * dt
        }
        effect.mesh.geometry.attributes.position.needsUpdate = true
        effect.mesh.material.opacity = clamp(effect.life / effect.maxLife, 0, 1)
      } else if (effect.type === 'ring') {
        const progress = 1 - effect.life / effect.maxLife
        effect.mesh.scale.setScalar(1 + progress * 5)
        effect.mesh.material.opacity = (1 - progress) * 0.7
      } else if (effect.type === 'text') {
        effect.mesh.position.y += dt * 1.4
        effect.mesh.material.opacity = clamp(effect.life / effect.maxLife, 0, 1)
      } else if (effect.type === 'muzzle') {
        effect.mesh.material.opacity = clamp(effect.life / effect.maxLife, 0, 1)
      } else if (effect.type === 'heal') {
        effect.mesh.position.y += dt * 1.2
        effect.mesh.material.opacity = clamp(effect.life / effect.maxLife, 0, 1)
      }
      if (effect.life <= 0) {
        this.scene.remove(effect.mesh)
        effect.mesh.traverse(object => {
          if (object.geometry) object.geometry.dispose()
          if (object.material) {
            const materials = Array.isArray(object.material) ? object.material : [object.material]
            for (const material of materials) { if (material.map) material.map.dispose(); material.dispose() }
          }
        })
        this.effects.splice(i, 1)
      }
    }
  }

  spawnHitEffect(x, y, z, color) {
    this.spawnParticles(x, y, z, color, 7, 3)
  }

  spawnParticles(x, y, z, color, count, speed) {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const velocities = []
    for (let i = 0; i < count; i++) {
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z
      const angle = Math.random() * Math.PI * 2
      const up = Math.random() * 2 + 1
      velocities.push(new THREE.Vector3(Math.cos(angle) * Math.random() * speed, up, Math.sin(angle) * Math.random() * speed))
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const material = new THREE.PointsMaterial({ color, size: 0.14, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending })
    const points = new THREE.Points(geometry, material)
    this.scene.add(points)
    this.effects.push({ type: 'particles', mesh: points, velocities, life: 0.5, maxLife: 0.5 })
  }

  spawnDebris(x, z, color) {
    this.spawnParticles(x, 0.6, z, color, 14, 4)
  }

  spawnPickupBurst(x, z, color) {
    this.spawnParticles(x, 0.7, z, color, 9, 2.5)
  }

  spawnHealEffect(entity) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.7, 24), new THREE.MeshBasicMaterial({ color: '#8dff83', transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }))
    ring.rotation.x = -Math.PI / 2
    ring.position.set(entity.x, 0.5, entity.z)
    this.scene.add(ring)
    this.effects.push({ type: 'ring', mesh: ring, life: 0.6, maxLife: 0.6 })
    this.spawnParticles(entity.x, 1, entity.z, '#8dff83', 12, 1.4)
  }

  spawnShieldEffect(entity) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 28), new THREE.MeshBasicMaterial({ color: '#a9f7ff', transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }))
    ring.rotation.x = -Math.PI / 2
    ring.position.set(entity.x, 0.6, entity.z)
    this.scene.add(ring)
    this.effects.push({ type: 'ring', mesh: ring, life: 0.55, maxLife: 0.55 })
  }

  spawnExplosion(x, z, color) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 1.1, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }))
    ring.rotation.x = -Math.PI / 2
    ring.position.set(x, 0.6, z)
    this.scene.add(ring)
    this.effects.push({ type: 'ring', mesh: ring, life: 0.5, maxLife: 0.5 })
    this.spawnParticles(x, 1, z, color, 24, 7)
  }

  spawnDeathEffect(x, z) {
    this.spawnParticles(x, 1, z, '#b6ff8a', 18, 4)
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.6, 24), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }))
    ring.rotation.x = -Math.PI / 2
    ring.position.set(x, 0.45, z)
    this.scene.add(ring)
    this.effects.push({ type: 'ring', mesh: ring, life: 0.4, maxLife: 0.4 })
  }

  spawnDamageText(x, z, text, color) {
    const canvas = document.createElement('canvas')
    canvas.width = 160
    canvas.height = 80
    const context = canvas.getContext('2d')
    context.font = '800 46px "Baloo 2", sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.lineWidth = 8
    context.strokeStyle = 'rgba(4,17,13,.85)'
    context.strokeText(String(text), 80, 40)
    context.fillStyle = color
    context.fillText(String(text), 80, 40)
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false })
    const sprite = new THREE.Sprite(material)
    sprite.position.set(x + random(-0.3, 0.3), 2.1, z)
    sprite.scale.set(1.8, 0.9, 1)
    this.scene.add(sprite)
    this.effects.push({ type: 'text', mesh: sprite, life: 0.75, maxLife: 0.75 })
  }

  updateEntityAnimations(dt) {
    for (const entity of this.entities) {
      if (!entity.alive) {
        if (entity.deathTimer !== undefined) {
          entity.deathTimer += dt
          entity.model.rotation.z = Math.min(Math.PI / 2, entity.deathTimer * 3)
          entity.model.position.y = Math.max(0.1, 0.38 - entity.deathTimer * 0.2)
          entity.model.traverse(object => {
            if (object.material && object.material.transparent !== undefined) {
              object.material.transparent = true
              object.material.opacity = Math.max(0, 1 - entity.deathTimer * 0.7)
            }
          })
        }
        continue
      }
      const moving = entity.isPlayer ? Math.hypot(this.input.x, this.input.z) > 0.1 || this.keys.has('KeyW') || this.keys.has('KeyA') || this.keys.has('KeyS') || this.keys.has('KeyD') : entity.aiState !== 'guard'
      animateCharacter(entity.model, this.elapsed + (entity.walkPhase || 0), moving ? 3.4 : 0.4, entity.itemAnim || 0)
      const head = entity.model.userData.parts?.head
      if (head && entity.isPlayer) {
        head.rotation.y = clamp(angleDelta(entity.aimAngle ?? entity.rotation, entity.rotation), -0.85, 0.85)
        head.rotation.x = -0.04
      }
      if (entity.characterId === 'glitch' && entity.isPlayer && entity.invisTimer > 0) entity.model.visible = false
    }
  }

  updateCamera(dt) {
    if (!this.player) return
    const offset = this.cameraOffset || new THREE.Vector3(0, 20.5, 23.5)
    const targetX = this.player.x
    const targetZ = this.player.z
    const shakeX = (Math.random() - 0.5) * this.cameraShake
    const shakeZ = (Math.random() - 0.5) * this.cameraShake
    this.camera.position.x += (targetX + offset.x + shakeX - this.camera.position.x) * Math.min(1, dt * 5)
    this.camera.position.y += (offset.y + shakeZ - this.camera.position.y) * Math.min(1, dt * 5)
    this.camera.position.z += (targetZ + offset.z - this.camera.position.z) * Math.min(1, dt * 5)
    this.camera.lookAt(targetX + shakeX * 0.4, 1.3, targetZ + shakeZ * 0.4)
  }

  updateHud() {
    const player = this.player
    if (!player) return
    const hpRatio = clamp(player.hp / player.maxHp, 0, 1)
    this.healthFill.style.width = `${hpRatio * 100}%`
    this.shieldFill.style.width = `${clamp(player.shield / player.maxHp, 0, 1) * 100}%`
    this.hpText.textContent = `${Math.ceil(player.hp)}${player.shield > 0 ? ` +${Math.ceil(player.shield)}` : ''}`
    this.healthText.textContent = `${Math.ceil(player.hp)} / ${Math.ceil(player.maxHp)}`
    this.timerEl.textContent = `${String(Math.floor(this.elapsed / 60)).padStart(2, '0')}:${String(Math.floor(this.elapsed % 60)).padStart(2, '0')}`
    if (this.boss?.alive && Math.hypot(this.boss.x - player.x, this.boss.z - player.z) < 24) {
      this.bossBar.classList.add('show')
      this.bossFill.style.width = `${clamp(this.boss.hp / this.boss.maxHp, 0, 1) * 100}%`
      this.bossHp.textContent = `${Math.round(clamp(this.boss.hp / this.boss.maxHp, 0, 1) * 100)}%`
    } else {
      this.bossBar.classList.remove('show')
    }
    this.updateItemHud()
    this.drawMinimap()
  }

  updateItemHud() {
    for (const kind of Object.keys(ITEM_CAPS)) {
      const button = document.getElementById(`item-${kind}`)
      const count = document.getElementById(`count-${kind}`)
      if (!button || !count) continue
      const value = this.player.items[kind] || 0
      count.textContent = value
      button.classList.toggle('empty', value <= 0)
      button.classList.toggle('ready', value > 0)
    }
  }

  drawMinimap() {
    if (!this.mapContext) return
    const ctx = this.mapContext
    const size = 300
    ctx.clearRect(0, 0, size, size)
    ctx.fillStyle = '#0b2e24'
    ctx.fillRect(0, 0, size, size)
    const scale = size / (ARENA_RADIUS * 2.3)
    const cx = size / 2
    const cy = size / 2
    ctx.fillStyle = '#1a5b3d'
    ctx.beginPath()
    ctx.arc(cx, cy, ARENA_RADIUS * scale, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(198,255,74,.4)'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.fillStyle = 'rgba(255,200,77,.2)'
    ctx.beginPath()
    ctx.arc(cx, cy, 3.2 * scale, 0, Math.PI * 2)
    ctx.fill()
    for (const barrel of this.barrels) {
      if (!barrel.alive) continue
      ctx.fillStyle = 'rgba(190,132,70,.8)'
      ctx.beginPath()
      ctx.arc(cx + barrel.x * scale, cy + barrel.z * scale, 2.3, 0, Math.PI * 2)
      ctx.fill()
    }
    for (const pickup of this.pickups) {
      if (!pickup.alive || pickup.kind !== 'weapon') continue
      ctx.fillStyle = TIERS[pickup.tier].edge
      ctx.beginPath()
      ctx.arc(cx + pickup.x * scale, cy + pickup.z * scale, 2.2, 0, Math.PI * 2)
      ctx.fill()
    }
    for (const bot of this.bots) {
      if (!bot.alive) continue
      ctx.fillStyle = '#ff6b6b'
      ctx.beginPath()
      ctx.arc(cx + bot.x * scale, cy + bot.z * scale, 4, 0, Math.PI * 2)
      ctx.fill()
    }
    if (this.boss?.alive) {
      ctx.fillStyle = '#ffd451'
      ctx.beginPath()
      const bx = cx + this.boss.x * scale
      const by = cy + this.boss.z * scale
      for (let i = 0; i < 10; i++) {
        const angle = -Math.PI / 2 + i * Math.PI / 5
        const radius = i % 2 ? 3 : 7
        ctx.lineTo(bx + Math.cos(angle) * radius, by + Math.sin(angle) * radius)
      }
      ctx.closePath()
      ctx.fill()
    }
    const px = cx + this.player.x * scale
    const py = cy + this.player.z * scale
    ctx.save()
    ctx.translate(px, py)
    ctx.rotate(-this.player.rotation)
    ctx.fillStyle = '#c6ff4a'
    ctx.beginPath()
    ctx.moveTo(0, -9)
    ctx.lineTo(6, 7)
    ctx.lineTo(0, 4)
    ctx.lineTo(-6, 7)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
    ctx.strokeStyle = 'rgba(255,255,255,.13)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx, cy, ARENA_RADIUS * scale, 0, Math.PI * 2)
    ctx.stroke()
  }

  addKillFeed(attacker, victim, you = false) {
    const line = document.createElement('div')
    line.className = `kill-line ${you ? 'you' : ''}`
    line.innerHTML = `<b>${attacker}</b> eliminated ${victim}`
    this.killFeed.prepend(line)
    while (this.killFeed.children.length > 5) this.killFeed.lastChild.remove()
    setTimeout(() => line.remove(), 4200)
  }

  toastInGame(message, color = '#c6ff4a') {
    const node = document.createElement('div')
    node.className = 'kill-line'
    node.style.borderColor = color
    node.style.color = color
    node.textContent = message
    this.killFeed.prepend(node)
    while (this.killFeed.children.length > 5) this.killFeed.lastChild.remove()
    setTimeout(() => node.remove(), 2200)
  }

  announce(kicker, title, sub, duration = 3) {
    if (!this.announceEl) return
    document.getElementById('announce-kicker').textContent = kicker
    document.getElementById('announce-title').textContent = title
    document.getElementById('announce-sub').textContent = sub
    this.announceEl.classList.add('show')
    this.announceTimer = duration
  }

  flashDamage() {
    if (!this.damageVignette) return
    this.damageVignette.classList.add('on')
    clearTimeout(this.damageTimeout)
    this.damageTimeout = setTimeout(() => this.damageVignette.classList.remove('on'), 180)
  }

  togglePause() {
    if (this.ended) return
    this.paused = !this.paused
    if (this.paused) {
      this.input.fire = false
      const wrap = document.createElement('div')
      wrap.className = 'pause-menu'
      wrap.id = 'pause-menu'
      wrap.innerHTML = `<div class="pause-card">
        <h2>PAUSED</h2><p>Take a breath. The jungle waits.</p>
        <button class="btn btn-primary" id="resume-btn">${iconSvg('play')} Resume</button>
        <button class="btn btn-ghost" id="quit-btn">${iconSvg('home')} Leave Match</button>
      </div>`
      this.root.appendChild(wrap)
      document.getElementById('resume-btn').addEventListener('click', () => this.togglePause())
      document.getElementById('quit-btn').addEventListener('click', () => this.onExit('home'))
    } else {
      document.getElementById('pause-menu')?.remove()
    }
  }

  render() {
    if (this.scene && this.camera) this.renderer.render(this.scene, this.camera)
  }

  destroy() {
    this.running = false
    window.removeEventListener('keydown', this.bindGlobal)
    window.removeEventListener('keyup', this.bindGlobal)
    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('pointerup', this.bindGlobal)
    if (this.renderer?.domElement) {
      this.renderer.domElement.removeEventListener('pointermove', this.bindGlobal)
      this.renderer.domElement.removeEventListener('pointerdown', this.bindGlobal)
    }
    clearTimeout(this.damageTimeout)
    if (this.scene) {
      this.scene.traverse(object => {
        if (object.geometry) object.geometry.dispose()
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          for (const material of materials) {
            if (material.map) material.map.dispose()
            material.dispose()
          }
        }
      })
      this.scene.clear()
    }
    this.root.classList.add('hidden')
    this.root.innerHTML = ''
    this.projectiles = []
    this.pickups = []
    this.effects = []
    this.entities = []
    this.bots = []
    this.player = null
    this.boss = null
    this.scene = null
    this.camera = null
  }
}

function iconSvg(name) {
  const icons = {
    paw: '<circle cx="7" cy="8" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="17" cy="8" r="2"/><path d="M7 14c0-3 2.2-5 5-5s5 2 5 5c0 2.7-2.3 4.5-5 4.5S7 16.7 7 14Z"/>',
    skull: '<path d="M12 3a7 7 0 0 0-7 7c0 2.5 1.2 4 2.5 5v3h9v-3c1.3-1 2.5-2.5 2.5-5a7 7 0 0 0-7-7Z"/><circle cx="9" cy="11" r="1.5"/><circle cx="15" cy="11" r="1.5"/><path d="M10 18v3M14 18v3"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.1A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3V9.6h.1A1.7 1.7 0 0 0 4.6 8.5a1.7 1.7 0 0 0-.34-1.88l-.06-.06L7.06 3.7l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.5 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 9c.12.4.35.75.66 1 .3.26.7.4 1.1.4h.14v4h-.1A1.7 1.7 0 0 0 19.4 15Z"/>',
    crosshair: '<circle cx="12" cy="12" r="7"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/>',
    heal: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 7v10M7 12h10"/>',
    shield: '<path d="M12 3 20 6v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6l8-3Z"/><path d="m8.5 12 2.3 2.3 4.7-5"/>',
    trap: '<path d="M4 16c2-6 6-9 8-9s6 3 8 9"/><path d="m6 16 1.5-3M10 16l.8-3.5M14 16l-.8-3.5M18 16l-1.5-3"/><path d="M4 20h16"/>',
    speed: '<path d="m13 2-8 12h6l-1 8 8-12h-6l1-8Z"/>',
    wall: '<path d="M3 5h18v14H3z"/><path d="M3 10h18M3 15h18M8 5v5M16 5v5M12 10v5M8 15v4M16 15v4"/>',
    spark: '<path d="m12 2 2 7 7 2-7 2-2 7-2-7-7-2 7-2 2-7Z"/>',
    fire: '<path d="M12 21c-4 0-7-2.7-7-6.5 0-3.5 2.4-5.8 4-8.5 0 2.6 1.4 4 2.6 4.4C12.8 7.6 13.5 4.5 15 3c.1 3 4 5.6 4 11.5C19 18.3 16 21 12 21Z"/>',
    moon: '<path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/>',
    snow: '<path d="M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9"/>',
    eye: '<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
    crown: '<path d="m3 7 4 4 5-6 5 6 4-4-2 11H5L3 7Z"/><path d="M6 21h12"/>',
    swirl: '<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/>',
    drop: '<path d="M12 3S6 10 6 14a6 6 0 0 0 12 0c0-4-6-11-6-11Z"/>',
    bomb: '<circle cx="10" cy="14" r="6"/><path d="M14 9c0-2 1-3 3-3 1 0 2 .5 2.5 1.5M18 3v2M21 6h-2"/>',
    shotgun: '<path d="M3 9h9l3 3h5v3h-5l-2 2H8l-2-2H3V9Z"/><path d="M12 9v3M6 14v3"/>',
    bow: '<path d="M5 4c6 3 8 8 6 16"/><path d="m5 4 4 16M5 12h11"/><path d="m13 10 4 2-4 2"/>',
    lance: '<path d="m4 20 14-14"/><path d="m15 4 5 5-5 2-2-5 2-2Z"/><path d="m6 16 2 2"/>',
    staff: '<path d="M6 21 16 5"/><circle cx="17" cy="4" r="3"/><path d="M5 18h5"/>',
    crossbow: '<path d="M4 12h16M12 4v16M7 6l5 6 5-6M7 18l5-6 5 6"/>',
    minigun: '<path d="M3 10h9v5H3z"/><path d="M12 8v9M15 8v9M18 8v9M21 8v9"/><path d="M3 12H1v3h2"/>',
    coin: '<circle cx="12" cy="12" r="8"/><path d="M9.5 9.5h4a2 2 0 0 1 0 4h-3a2 2 0 0 0 0 4h4"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 5H4v2a4 4 0 0 0 4 4M16 5h4v2a4 4 0 0 1-4 4"/><path d="M12 13v4M8 21h8M9 21c0-2 1-4 3-4s3 2 3 4"/>',
    pass: '<path d="M6 3h12v18l-6-3-6 3V3Z"/><path d="M9 8h6M9 12h4"/>',
    refresh: '<path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M6.1 9a7 7 0 0 1 11.6-2L20 9M4 15l2.3 2A7 7 0 0 0 18 15"/>',
    home: '<path d="M4 11.2 12 4l8 7.2"/><path d="M6 10.5V20h12v-9.5"/><path d="M10 20v-5h4v5"/>',
    play: '<path d="m8 5 11 7-11 7V5Z"/>'
  }
  const path = icons[name] || icons.spark
  return `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`
}

function number(value) {
  return Math.round(value).toLocaleString('en-US')
}
