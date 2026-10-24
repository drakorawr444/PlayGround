import * as THREE from 'three'
import { CHARACTER_MAP } from './data.js'
import { createCharacter } from './models.js'

export class PortraitFactory {
  constructor(store) {
    this.store = store
    this.cache = new Map()
    this.canvas = document.createElement('canvas')
    this.canvas.width = 280
    this.canvas.height = 340
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true, preserveDrawingBuffer: true })
    this.renderer.setSize(280, 340, false)
    this.renderer.setPixelRatio(1)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.25
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(30, 280 / 340, 0.1, 40)
    this.camera.position.set(0, 1.9, 5.5)
    this.camera.lookAt(0, 1.4, 0)
    const hemi = new THREE.HemisphereLight('#d7fff4', '#132821', 2.6)
    this.scene.add(hemi)
    const key = new THREE.DirectionalLight('#fff0c7', 4)
    key.position.set(-2.5, 5, 4)
    this.scene.add(key)
    const rim = new THREE.DirectionalLight('#66ffd1', 3)
    rim.position.set(3, 3, -3)
    this.scene.add(rim)
    const warm = new THREE.PointLight('#ffb85a', 16, 10, 2)
    warm.position.set(-2, 2.5, 3)
    this.scene.add(warm)
  }

  clear(characterId = null) {
    if (characterId) this.cache.delete(characterId)
    else this.cache.clear()
  }

  get(characterId) {
    if (this.cache.has(characterId)) return this.cache.get(characterId)
    const character = CHARACTER_MAP[characterId]
    if (!character) return ''
    const model = createCharacter(character.species, this.store.skinColors(characterId), {
      scale: 1.02,
      weaponType: character.weapons[0],
      tier: character.rarity === 'mythic' ? 'gold' : character.rarity === 'legendary' ? 'iron' : 'wood',
      aura: character.colors.accent
    })
    model.position.y = 0.1
    model.rotation.y = 0.38
    this.scene.add(model)
    this.renderer.render(this.scene, this.camera)
    const url = this.canvas.toDataURL('image/png')
    this.scene.remove(model)
    model.traverse(object => {
      if (object.geometry) object.geometry.dispose()
      if (object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        for (const material of materials) {
          if (material.map) material.map.dispose()
          material.dispose()
        }
      }
    })
    this.cache.set(characterId, url)
    return url
  }
}
