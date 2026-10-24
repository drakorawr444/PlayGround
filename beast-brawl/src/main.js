import * as THREE from 'three'
import { store } from './store.js'
import { AudioEngine } from './audio.js'
import { MenuScene } from './menuScene.js'
import { PortraitFactory } from './portraits.js'
import { UI } from './ui.js'
import { Battle } from './battle.js'

const canvas = document.getElementById('scene')
const menuUI = document.getElementById('menu-ui')
const loading = document.getElementById('loading-screen')

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance'
})
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.08
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap

loading.classList.remove('hidden')

const audio = new AudioEngine(store)
const menuScene = new MenuScene(renderer, store)
const portraits = new PortraitFactory(store)
let battle = null
let mode = 'menu'
let starting = false

function setLoading(visible) {
  loading.classList.toggle('hidden', !visible)
}

function beginBattle(characterId) {
  if (starting) return
  starting = true
  setLoading(true)
  document.body.classList.remove('menu-page')
  menuUI.classList.add('is-hidden')
  audio.init()
  setTimeout(() => {
    try {
      if (battle) {
        battle.destroy()
        battle = null
      }
      const next = new Battle({ renderer, store, audio, onExit: exitBattle })
      battle = next
      next.start(characterId)
      mode = 'battle'
    } catch (error) {
      console.error('Unable to start battle', error)
      if (battle) battle.destroy()
      battle = null
      mode = 'menu'
      menuUI.classList.remove('is-hidden')
      ui.toast('Could not start the match', 'error')
    } finally {
      starting = false
      setTimeout(() => setLoading(false), 320)
    }
  }, 40)
}

function exitBattle(reason) {
  if (!battle) return
  battle.destroy()
  battle = null
  mode = 'menu'
  menuUI.classList.remove('is-hidden')
  menuScene.setCharacter(store.state.selected)
  ui.refresh()
  if (reason === 'replay') {
    beginBattle(store.state.selected)
  } else {
    audio.tab()
  }
}

const ui = new UI({
  store,
  audio,
  portraits,
  menuScene,
  onPlay: characterId => beginBattle(characterId || store.state.selected)
})

function resize() {
  const width = window.innerWidth
  const height = window.innerHeight
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(width, height)
  menuScene.resize(width, height)
}

window.addEventListener('resize', resize)
resize()
setLoading(false)

const clock = new THREE.Clock()
function loop() {
  requestAnimationFrame(loop)
  const dt = Math.min(clock.getDelta(), 0.05)
  if (mode === 'battle' && battle) {
    battle.update(dt)
  } else {
    menuScene.update(dt)
    menuScene.render()
  }
}
loop()

