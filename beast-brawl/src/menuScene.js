import * as THREE from 'three'
import { CHARACTER_MAP } from './data.js'
import { createCharacter, createTree, createRock, createBush, animateCharacter, createChestModel } from './models.js'

const waterVertex = `
uniform float uTime;
varying vec2 vUv;
varying float vWave;
void main() {
  vUv = uv;
  vec3 p = position;
  float wave = sin(p.x * 0.34 + uTime * 0.9) * 0.12 + cos(p.y * 0.28 + uTime * 0.7) * 0.1;
  p.z += wave;
  vWave = wave;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`

const waterFragment = `
uniform float uTime;
varying vec2 vUv;
varying float vWave;
void main() {
  vec3 deep = vec3(0.035, 0.43, 0.58);
  vec3 shallow = vec3(0.22, 0.82, 0.78);
  float lines = smoothstep(0.86, 1.0, sin((vUv.x + vUv.y) * 180.0 + uTime * 1.8) * 0.5 + 0.5);
  float glow = smoothstep(0.7, 1.0, vWave * 4.0 + 0.4);
  vec3 color = mix(deep, shallow, 0.5 + vWave * 1.6);
  color += vec3(0.55, 0.98, 0.92) * lines * 0.34 + vec3(0.75, 1.0, 0.92) * glow * 0.12;
  gl_FragColor = vec4(color, 0.94);
}
`

export class MenuScene {
  constructor(renderer, store) {
    this.renderer = renderer
    this.store = store
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2('#9fe6ee', 0.018)
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120)
    this.camera.position.set(0, 5.3, 12.4)
    this.camera.lookAt(0, 1.75, 0)
    this.stage = new THREE.Group()
    this.scene.add(this.stage)
    this.clock = new THREE.Clock()
    this.character = null
    this.companion = null
    this.selected = null
    this.mouse = new THREE.Vector2()
    this.cameraBase = new THREE.Vector3(0, 5.3, 12.4)
    this.lookBase = new THREE.Vector3(0, 1.75, 0)
    this.particles = []
    this.build()
    this.setCharacter(store.state.selected)
    window.addEventListener('pointermove', event => {
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      this.mouse.y = (event.clientY / window.innerHeight) * 2 - 1
    }, { passive: true })
  }

  build() {
    const sky = new THREE.Mesh(new THREE.SphereGeometry(60, 32, 20), new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTop: { value: new THREE.Color('#1fa7e8') },
        uHorizon: { value: new THREE.Color('#c7f6ff') }
      },
      vertexShader: `
        varying vec3 vWorld;
        void main() {
          vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uTop;
        uniform vec3 uHorizon;
        varying vec3 vWorld;
        void main() {
          float h = smoothstep(-0.12, 0.62, normalize(vWorld).y);
          gl_FragColor = vec4(mix(uHorizon, uTop, h), 1.0);
        }
      `
    }))
    sky.frustumCulled = false
    this.scene.add(sky)

    const hemi = new THREE.HemisphereLight('#e4ffff', '#2d7d4a', 2.5)
    this.scene.add(hemi)
    const sun = new THREE.DirectionalLight('#fff4d2', 3.8)
    sun.position.set(-6, 12, 7)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.left = -12
    sun.shadow.camera.right = 12
    sun.shadow.camera.top = 12
    sun.shadow.camera.bottom = -12
    sun.shadow.camera.near = 1
    sun.shadow.camera.far = 35
    sun.shadow.bias = -0.0005
    this.scene.add(sun)
    const rim = new THREE.DirectionalLight('#7fffd8', 1.6)
    rim.position.set(6, 5, -8)
    this.scene.add(rim)
    const warm = new THREE.PointLight('#ffb45c', 18, 14, 2)
    warm.position.set(-3, 3, 4)
    this.scene.add(warm)

    const water = new THREE.Mesh(new THREE.PlaneGeometry(80, 80, 80, 80), new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: waterVertex,
      fragmentShader: waterFragment,
      transparent: true
    }))
    water.rotation.x = -Math.PI / 2
    water.position.y = -0.7
    this.scene.add(water)
    this.water = water

    const sand = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 7.4, 1.3, 40), new THREE.MeshStandardMaterial({ color: '#e6cc8d', roughness: 0.95, flatShading: true }))
    sand.position.y = -0.35
    sand.receiveShadow = true
    this.scene.add(sand)
    const grass = new THREE.Mesh(new THREE.CylinderGeometry(6.25, 6.25, 0.22, 40), new THREE.MeshStandardMaterial({ color: '#55b95f', roughness: 0.92, flatShading: true }))
    grass.position.y = 0.31
    grass.receiveShadow = true
    this.scene.add(grass)
    const mossRing = new THREE.Mesh(new THREE.RingGeometry(6.05, 6.24, 40), new THREE.MeshStandardMaterial({ color: '#8bd36d', roughness: 0.9, side: THREE.DoubleSide }))
    mossRing.rotation.x = -Math.PI / 2
    mossRing.position.y = 0.44
    this.scene.add(mossRing)

    const path = new THREE.Mesh(new THREE.CircleGeometry(3.2, 32), new THREE.MeshStandardMaterial({ color: '#c8a76d', roughness: 0.95 }))
    path.rotation.x = -Math.PI / 2
    path.position.y = 0.44
    this.scene.add(path)

    const pedestal = new THREE.Group()
    const stone = new THREE.MeshStandardMaterial({ color: '#8b9b8e', roughness: 0.82, flatShading: true })
    const gold = new THREE.MeshStandardMaterial({ color: '#f5c94f', metalness: 0.7, roughness: 0.28, emissive: '#ffae28', emissiveIntensity: 0.18 })
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.75, 0.45, 24), stone)
    base.position.y = 0.55
    base.castShadow = true
    base.receiveShadow = true
    pedestal.add(base)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.43, 0.07, 8, 40), gold)
    ring.rotation.x = Math.PI / 2
    ring.position.y = 0.79
    pedestal.add(ring)
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(1.28, 1.28, 0.04, 24), new THREE.MeshStandardMaterial({ color: '#405d4f', roughness: 0.8 }))
    inner.position.y = 0.79
    pedestal.add(inner)
    this.stage.add(pedestal)
    this.pedestal = pedestal

    const treePositions = [[-5.2, 0.35, -1.6, 1], [5.2, 0.35, -1.8, 2], [-4.2, 0.35, 2.8, 0], [4.5, 0.35, 3.0, 1], [-2.6, 0.35, -3.8, 3], [2.6, 0.35, -4.1, 2], [0, 0.35, -5.3, 0], [-6.0, 0.35, 1.3, 2], [6.1, 0.35, 0.9, 0]]
    for (const [x, y, z, variant] of treePositions) {
      const tree = createTree(variant)
      tree.position.set(x, y, z)
      tree.scale.setScalar(0.72 + Math.random() * 0.2)
      this.scene.add(tree)
    }
    const cloudMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, flatShading: true, transparent: true, opacity: 0.92 })
    for (const [x, y, z, size] of [[-14, 12, -24, 3.2], [10, 15, -30, 4.1], [22, 10, -18, 2.6], [-24, 9, -12, 2.4]]) {
      const cloud = new THREE.Group()
      for (const [offsetX, offsetY, scale] of [[-1.1, -0.2, 1], [0, 0.25, 1.35], [1.15, -0.1, 0.9]]) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), cloudMaterial)
        puff.position.set(offsetX, offsetY, 0)
        puff.scale.set(scale, scale * 0.62, scale * 0.7)
        cloud.add(puff)
      }
      cloud.position.set(x, y, z)
      cloud.scale.setScalar(size)
      this.scene.add(cloud)
    }
    for (const [x, z, s] of [[-3.6, 1.2, 0.6], [3.8, 0.6, 0.5], [-1.6, 4.0, 0.45], [1.9, 3.6, 0.38], [5.3, 2.3, 0.52]]) {
      const rock = createRock(s)
      rock.position.set(x, 0.35, z)
      this.scene.add(rock)
    }
    for (const [x, z, s] of [[-4.7, -0.2, 0.8], [4.8, 1.5, 0.75], [-2.9, 3.5, 0.65], [3.2, -3.0, 0.6]]) {
      const bush = createBush(s)
      bush.position.set(x, 0.35, z)
      this.scene.add(bush)
    }
    const chest = createChestModel('legendary', 0.65)
    chest.position.set(-2.2, 0.4, 2.7)
    chest.rotation.y = 0.4
    this.scene.add(chest)
    this.chest = chest

    const fireflyCount = 90
    const positions = new Float32Array(fireflyCount * 3)
    const speeds = []
    for (let i = 0; i < fireflyCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 17
      positions[i * 3 + 1] = 1.2 + Math.random() * 5.5
      positions[i * 3 + 2] = (Math.random() - 0.5) * 11
      speeds.push(0.2 + Math.random() * 0.55)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const points = new THREE.Points(geometry, new THREE.PointsMaterial({ color: '#fff7c2', size: 0.06, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }))
    this.scene.add(points)
    this.fireflies = points
    this.fireflySpeeds = speeds

    const leafCount = 34
    const leafPositions = new Float32Array(leafCount * 3)
    for (let i = 0; i < leafCount; i++) {
      leafPositions[i * 3] = (Math.random() - 0.5) * 16
      leafPositions[i * 3 + 1] = 1 + Math.random() * 7
      leafPositions[i * 3 + 2] = (Math.random() - 0.5) * 10
    }
    const leafGeometry = new THREE.BufferGeometry()
    leafGeometry.setAttribute('position', new THREE.BufferAttribute(leafPositions, 3))
    const leaves = new THREE.Points(leafGeometry, new THREE.PointsMaterial({ color: '#b9ff8c', size: 0.08, transparent: true, opacity: 0.55, depthWrite: false }))
    this.scene.add(leaves)
    this.leaves = leaves

    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 2.4, 7, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#e4fff8', transparent: true, opacity: 0.03, side: THREE.DoubleSide, depthWrite: false }))
    beam.position.set(0, 4.2, -1.5)
    this.scene.add(beam)
  }

  setCharacter(id) {
    if (!CHARACTER_MAP[id]) return
    this.selected = id
    if (this.character) {
      this.stage.remove(this.character)
      this.disposeModel(this.character)
    }
    if (this.companion) {
      this.stage.remove(this.companion)
      this.disposeModel(this.companion)
    }
    const character = CHARACTER_MAP[id]
    const colors = this.store.skinColors(id)
    const model = createCharacter(character.species, colors, {
      scale: 1.35,
      weaponType: character.weapons[0],
      tier: character.rarity === 'mythic' ? 'gold' : character.rarity === 'legendary' ? 'iron' : 'wood',
      aura: colors.accent
    })
    model.position.set(0, 0.78, 0)
    model.rotation.y = 0.12
    this.stage.add(model)
    this.character = model
    const companionId = this.store.state.starterSquad.find(entry => entry !== id) || (id === 'rocco' ? 'bolt' : 'rocco')
    const companionData = CHARACTER_MAP[companionId]
    if (companionData) {
      const companion = createCharacter(companionData.species, this.store.skinColors(companionId), {
        scale: 0.85,
        weaponType: companionData.weapons[0],
        tier: 'wood'
      })
      companion.position.set(-2.35, 0.38, -0.65)
      companion.rotation.y = 0.42
      this.stage.add(companion)
      this.companion = companion
    }
  }

  disposeModel(model) {
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
  }

  resize(width, height) {
    this.camera.aspect = width / height
    this.camera.fov = width < 700 ? 46 : 38
    this.camera.updateProjectionMatrix()
    const portrait = height > width
    this.cameraBase.set(portrait ? 0 : 0.3, portrait ? 5.9 : 5.3, portrait ? 15.2 : 12.4)
    this.lookBase.set(0, portrait ? 2.1 : 1.75, 0)
    this.stage.position.set(portrait ? 1.35 : 0, 0, 0)
  }

  update(dt) {
    const time = this.clock.getElapsedTime()
    this.water.material.uniforms.uTime.value = time
    if (this.character) {
      animateCharacter(this.character, time, 0.4, 0)
      this.character.rotation.y = 0.12 + Math.sin(time * 0.45) * 0.08
      this.character.position.y = 0.78 + Math.sin(time * 1.4) * 0.02
    }
    if (this.companion) {
      animateCharacter(this.companion, time + 1.4, 0.2, 0)
      this.companion.rotation.y = 0.42 + Math.sin(time * 0.4 + 2) * 0.1
    }
    if (this.chest) this.chest.rotation.y = 0.4 + Math.sin(time * 0.3) * 0.08
    if (this.pedestal) this.pedestal.children[1].rotation.z = time * 0.18
    const positions = this.fireflies.geometry.attributes.position.array
    for (let i = 0; i < positions.length / 3; i++) {
      positions[i * 3] += Math.sin(time * this.fireflySpeeds[i] + i) * 0.0018
      positions[i * 3 + 1] += Math.cos(time * 0.5 + i * 1.7) * 0.002
      positions[i * 3 + 2] += Math.cos(time * this.fireflySpeeds[i] * 0.8 + i) * 0.0014
    }
    this.fireflies.geometry.attributes.position.needsUpdate = true
    const leafPositions = this.leaves.geometry.attributes.position.array
    for (let i = 0; i < leafPositions.length / 3; i++) {
      leafPositions[i * 3 + 1] -= dt * (0.15 + (i % 5) * 0.04)
      leafPositions[i * 3] += Math.sin(time * 0.6 + i) * dt * 0.06
      if (leafPositions[i * 3 + 1] < 0.2) leafPositions[i * 3 + 1] = 7
    }
    this.leaves.geometry.attributes.position.needsUpdate = true
    const targetX = this.mouse.x * 0.35
    const targetY = this.mouse.y * 0.18
    this.camera.position.x += (this.cameraBase.x + targetX - this.camera.position.x) * Math.min(1, dt * 2.4)
    this.camera.position.y += (this.cameraBase.y - targetY - this.camera.position.y) * Math.min(1, dt * 2.4)
    this.camera.position.z = this.cameraBase.z
    this.camera.lookAt(this.lookBase)
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }
}
