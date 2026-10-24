import * as THREE from 'three'
import { TIERS, WEAPON_TYPES } from './data.js'

const MAT = (color, options = {}) => new THREE.MeshStandardMaterial({
  color,
  roughness: options.roughness ?? 0.66,
  metalness: options.metalness ?? 0.05,
  flatShading: options.flatShading ?? true,
  emissive: options.emissive || '#000000',
  emissiveIntensity: options.emissiveIntensity || 0,
  transparent: Boolean(options.transparent),
  opacity: options.opacity ?? 1,
  side: options.side || THREE.FrontSide
})

function add(parent, geometry, material, position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0]) {
  const object = new THREE.Mesh(geometry, material)
  object.position.set(...position)
  object.scale.set(...scale)
  object.rotation.set(...rotation)
  object.castShadow = true
  object.receiveShadow = true
  parent.add(object)
  return object
}

function sphere(parent, material, position, scale = [1, 1, 1], segments = 10) {
  return add(parent, new THREE.SphereGeometry(0.5, segments, Math.max(6, segments - 2)), material, position, scale)
}

function cylinder(parent, material, position, radius = 0.1, height = 0.5, rotation = [0, 0, 0], segments = 8, radiusTop = radius) {
  return add(parent, new THREE.CylinderGeometry(radiusTop, radius, height, segments), material, position, [1, 1, 1], rotation)
}

function box(parent, material, position, size, rotation = [0, 0, 0]) {
  return add(parent, new THREE.BoxGeometry(size[0], size[1], size[2]), material, position, [1, 1, 1], rotation)
}

function cone(parent, material, position, radius, height, rotation = [0, 0, 0], segments = 7) {
  return add(parent, new THREE.ConeGeometry(radius, height, segments), material, position, [1, 1, 1], rotation)
}

function createFace(head, colors, species) {
  const detail = MAT(colors.detail, { roughness: 0.5 })
  const eyeWhite = MAT('#fffaf0', { roughness: 0.22, flatShading: false })
  const pupil = MAT('#14191b', { roughness: 0.18, flatShading: false })
  const nose = MAT(colors.detail, { roughness: 0.35 })
  const eyeY = species === 'croc' || species === 'shark' ? 0.16 : 0.1
  const eyeZ = species === 'shark' ? 0.4 : 0.47
  const eyeX = species === 'croc' || species === 'shark' ? 0.3 : 0.27
  const iris = MAT(colors.accent, { roughness: 0.24, flatShading: false })
  for (const side of [-1, 1]) {
    sphere(head, eyeWhite, [side * eyeX, eyeY, eyeZ], [0.18, 0.22, 0.12], 9)
    sphere(head, iris, [side * eyeX, eyeY, eyeZ + 0.065], [0.115, 0.15, 0.045], 8)
    sphere(head, pupil, [side * eyeX, eyeY, eyeZ + 0.09], [0.075, 0.105, 0.045], 8)
    sphere(head, MAT('#ffffff', { roughness: 0.18 }), [side * eyeX - 0.03, eyeY + 0.06, eyeZ + 0.115], [0.035, 0.042, 0.025], 7)
    box(head, detail, [side * eyeX, eyeY + 0.27, eyeZ + 0.015], [0.22, 0.045, 0.045], [0, 0, side * -0.18])
  }
  if (species === 'croc') {
    box(head, MAT(colors.belly), [0, -0.1, 0.5], [0.5, 0.18, 0.5])
    box(head, detail, [0, -0.02, 0.72], [0.42, 0.1, 0.16])
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) cone(head, eyeWhite, [side * (0.15 + i * 0.06), -0.12, 0.65], 0.025, 0.09, [0, 0, 0], 4)
    }
  } else if (species === 'shark') {
    box(head, MAT('#f6fbf7'), [0, -0.22, 0.34], [0.42, 0.08, 0.22])
    for (let i = 0; i < 5; i++) cone(head, eyeWhite, [-0.16 + i * 0.08, -0.2, 0.44], 0.022, 0.075, [0, 0, 0], 4)
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) box(head, detail, [side * 0.34, -0.02, -0.02 + i * 0.08], [0.025, 0.09, 0.03])
    }
  } else if (species === 'chameleon') {
    sphere(head, MAT(colors.accent, { emissive: colors.accent, emissiveIntensity: 0.08 }), [0, 0.2, -0.02], [0.55, 0.42, 0.5], 8)
    sphere(head, eyeWhite, [0, 0.02, 0.42], [0.32, 0.22, 0.16], 8)
    cone(head, MAT(colors.accent), [0, 0.46, 0.05], 0.14, 0.34, [0.18, 0, 0], 5)
  } else {
    const snout = species === 'boar' ? 0.26 : 0.18
    sphere(head, MAT(colors.belly), [0, -0.17, 0.42], [0.4, 0.27, snout], 8)
    sphere(head, nose, [0, -0.11, 0.62], [0.13, 0.09, 0.085], 7)
    for (const side of [-1, 1]) sphere(head, MAT(colors.belly), [side * 0.34, -0.23, 0.42], [0.16, 0.12, 0.09], 7)
    add(head, new THREE.TorusGeometry(0.15, 0.02, 5, 12, Math.PI), nose, [0, -0.3, 0.51], [1, 1, 1], [0, 0, Math.PI])
    if (species === 'boar') {
      for (const side of [-1, 1]) cone(head, eyeWhite, [side * 0.17, -0.16, 0.57], 0.038, 0.26, [side * 0.4, 0, side * 0.55], 5)
    }
  }
  if (species === 'fox' || species === 'wolf') {
    sphere(head, MAT(colors.belly), [0.25, -0.13, 0.33], [0.16, 0.12, 0.12], 7)
    sphere(head, MAT(colors.belly), [-0.25, -0.13, 0.33], [0.16, 0.12, 0.12], 7)
  }
  if (species === 'tiger' || species === 'cheetah') {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 2; i++) box(head, MAT(colors.detail), [side * 0.24, 0.33 - i * 0.1, 0.31], [0.11, 0.025, 0.03], [0, 0, side * 0.3])
    }
  }
}

function addEars(head, colors, species) {
  const body = MAT(colors.body)
  const belly = MAT(colors.belly)
  const detail = MAT(colors.detail)
  if (species === 'rhino') {
    for (const side of [-1, 1]) {
      cone(head, body, [side * 0.3, 0.42, -0.04], 0.1, 0.25, [0, 0, side * 0.32], 6)
      sphere(head, belly, [side * 0.3, 0.42, -0.03], [0.055, 0.08, 0.04], 6)
    }
    cone(head, MAT(colors.belly), [0, 0.16, 0.63], 0.12, 0.42, [1.2, 0, 0], 6)
    box(head, detail, [0, 0.34, 0.18], [0.3, 0.1, 0.18])
  } else if (species === 'cheetah' || species === 'tiger' || species === 'lion') {
    for (const side of [-1, 1]) {
      sphere(head, body, [side * 0.34, 0.35, 0], [0.15, 0.17, 0.08], 7)
      sphere(head, belly, [side * 0.34, 0.35, 0.03], [0.08, 0.1, 0.04], 6)
    }
    if (species === 'lion') {
      const mane = MAT(colors.detail, { roughness: 0.8 })
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2
        sphere(head, mane, [Math.cos(angle) * 0.5, Math.sin(angle) * 0.48, -0.08], [0.27, 0.27, 0.2], 7)
      }
      sphere(head, body, [0, 0, 0.03], [1.05, 1.05, 0.92], 10)
    }
  } else if (species === 'wolf' || species === 'fox') {
    for (const side of [-1, 1]) {
      cone(head, body, [side * 0.28, 0.43, -0.03], 0.18, 0.46, [0, 0, side * 0.2], 5)
      cone(head, detail, [side * 0.28, 0.43, 0.02], 0.09, 0.27, [0, 0, side * 0.2], 5)
    }
  } else if (species === 'monkey') {
    for (const side of [-1, 1]) {
      sphere(head, body, [side * 0.42, 0.14, 0], [0.19, 0.22, 0.1], 7)
      sphere(head, belly, [side * 0.44, 0.14, 0.04], [0.1, 0.13, 0.05], 6)
    }
    sphere(head, belly, [0, -0.03, 0.3], [0.55, 0.48, 0.22], 9)
  } else if (species === 'boar') {
    for (const side of [-1, 1]) cone(head, body, [side * 0.28, 0.4, -0.04], 0.14, 0.32, [0, 0, side * 0.45], 5)
    for (let i = 0; i < 4; i++) cone(head, detail, [0, 0.4 + i * 0.07, -0.18], 0.08 - i * 0.01, 0.2, [-0.5, 0, 0], 5)
  } else if (species === 'bear') {
    for (const side of [-1, 1]) {
      sphere(head, body, [side * 0.36, 0.4, -0.02], [0.18, 0.18, 0.1], 7)
      sphere(head, belly, [side * 0.36, 0.4, 0.03], [0.1, 0.1, 0.05], 6)
    }
  } else if (species === 'croc') {
    for (const side of [-1, 1]) cone(head, body, [side * 0.3, 0.35, -0.06], 0.08, 0.19, [0, 0, side * 0.5], 5)
    for (let i = 0; i < 5; i++) cone(head, detail, [0, 0.42 - i * 0.05, -0.2 - i * 0.02], 0.055, 0.16, [-0.7, 0, 0], 5)
  } else if (species === 'shark') {
    cone(head, MAT(colors.body), [0, 0.55, -0.2], 0.14, 0.5, [-0.35, 0, 0], 5)
  } else if (species === 'chameleon') {
    for (const side of [-1, 1]) sphere(head, MAT(colors.accent), [side * 0.36, 0.26, 0], [0.18, 0.18, 0.18], 7)
  }
}

function addTail(visual, colors, species) {
  const body = MAT(colors.body)
  const belly = MAT(colors.belly)
  const detail = MAT(colors.detail)
  const tail = new THREE.Group()
  tail.position.set(0, 1.1, -0.62)
  visual.add(tail)
  if (species === 'cheetah' || species === 'tiger' || species === 'lion') {
    const segment = cylinder(tail, body, [0, -0.18, -0.34], 0.08, 0.8, [0.9, 0, 0], 6)
    segment.rotation.x = 1.15
    sphere(tail, species === 'lion' ? detail : body, [0, -0.38, -0.7], [0.18, 0.18, 0.18], 7)
  } else if (species === 'fox' || species === 'wolf') {
    const bush = sphere(tail, body, [0, -0.25, -0.5], [0.32, 0.32, 0.7], 8)
    bush.rotation.x = 0.8
    sphere(tail, belly, [0, -0.38, -0.8], [0.19, 0.2, 0.22], 7)
  } else if (species === 'monkey') {
    add(tail, new THREE.TorusGeometry(0.35, 0.07, 6, 12, Math.PI * 1.5), body, [0, -0.18, -0.4], [1, 1, 1], [0, Math.PI / 2, 0])
  } else if (species === 'croc' || species === 'shark') {
    const tail = sphere(visual, body, [0, 1.0, -1.05], [0.35, 0.3, 0.85], 8)
    tail.rotation.x = -0.15
    if (species === 'shark') {
      cone(visual, detail, [0, 1.1, -1.55], 0.18, 0.5, [1.3, 0, 0], 5)
      cone(visual, body, [0, 1.7, -0.1], 0.18, 0.55, [-0.4, 0, 0], 5)
    }
  } else if (species === 'chameleon') {
    add(tail, new THREE.TorusGeometry(0.3, 0.07, 6, 14, Math.PI * 1.75), body, [0, -0.1, -0.55], [1, 1, 1], [0.2, 0, 0])
  } else {
    sphere(tail, body, [0, -0.12, -0.3], [0.15, 0.15, 0.28], 7)
  }
}

function addSpeciesDetails(visual, colors, species) {
  const body = MAT(colors.body)
  const accent = MAT(colors.accent, { emissive: colors.accent, emissiveIntensity: 0.06 })
  const belly = MAT(colors.belly)
  const detail = MAT(colors.detail)
  if (species === 'rhino') {
    box(visual, detail, [0, 1.48, 0.1], [1.28, 0.18, 0.7])
    for (const side of [-1, 1]) cone(visual, accent, [side * 0.73, 1.53, 0.1], 0.17, 0.28, [0, 0, side * 0.9], 5)
  } else if (species === 'cheetah') {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2
      const y = 0.8 + Math.random() * 1.1
      sphere(visual, detail, [Math.cos(angle) * 0.62, y, Math.sin(angle) * 0.48], [0.06, 0.06, 0.03], 5)
    }
  } else if (species === 'wolf') {
    const mane = sphere(visual, belly, [0, 1.78, -0.03], [0.85, 0.6, 0.55], 8)
    mane.rotation.x = 0.15
    for (const side of [-1, 1]) box(visual, accent, [side * 0.58, 1.52, 0.16], [0.2, 0.1, 0.55], [0, 0, side * 0.2])
  } else if (species === 'fox') {
    sphere(visual, belly, [0, 1.23, 0.42], [0.56, 0.72, 0.28], 8)
    add(visual, new THREE.TorusGeometry(0.42, 0.07, 6, 12, Math.PI), accent, [0, 1.82, 0.02], [1, 1, 1], [0.2, 0, 0])
  } else if (species === 'monkey') {
    sphere(visual, belly, [0, 1.28, 0.36], [0.6, 0.75, 0.3], 8)
    add(visual, new THREE.TorusGeometry(0.7, 0.08, 6, 16, Math.PI * 1.8), accent, [0, 1.26, 0], [1, 1, 1], [Math.PI / 2, 0, 0])
  } else if (species === 'boar') {
    for (let i = 0; i < 4; i++) cone(visual, detail, [0, 1.75 - i * 0.13, -0.48], 0.09, 0.22, [-0.5, 0, 0], 5)
    add(visual, new THREE.TorusGeometry(0.62, 0.07, 6, 16, Math.PI * 1.7), accent, [0, 1.32, 0], [1, 1, 1], [Math.PI / 2, 0, 0])
  } else if (species === 'bear') {
    sphere(visual, belly, [0, 1.28, 0.4], [0.65, 0.82, 0.3], 8)
    add(visual, new THREE.TorusGeometry(0.62, 0.1, 6, 16, Math.PI * 1.9), accent, [0, 1.88, 0], [1, 1, 1], [Math.PI / 2, 0.15, 0])
    for (const side of [-1, 1]) box(visual, accent, [side * 0.58, 1.5, 0.22], [0.24, 0.55, 0.08], [0, 0, side * 0.1])
  } else if (species === 'croc') {
    for (let i = 0; i < 7; i++) cone(visual, detail, [0, 1.83 - i * 0.08, -0.45 - i * 0.06], 0.07, 0.2, [-0.9, 0, 0], 5)
    for (const side of [-1, 1]) box(visual, belly, [side * 0.38, 1.2, 0.34], [0.22, 0.46, 0.2])
  } else if (species === 'tiger') {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 4; i++) box(visual, detail, [side * (0.38 + i * 0.05), 1.1 + i * 0.12, 0.4], [0.09, 0.26, 0.05], [0, 0, side * 0.25])
    }
    sphere(visual, belly, [0, 1.23, 0.42], [0.56, 0.74, 0.28], 8)
  } else if (species === 'chameleon') {
    for (let i = 0; i < 6; i++) cone(visual, accent, [0, 1.8 - i * 0.12, -0.44], 0.07, 0.18, [-0.8, 0, 0], 5)
    for (let i = 0; i < 5; i++) sphere(visual, detail, [0, 1.1 + i * 0.1, 0.5], [0.16, 0.06, 0.08], 6)
  } else if (species === 'shark') {
    sphere(visual, belly, [0, 1.24, 0.4], [0.56, 0.76, 0.3], 8)
    for (const side of [-1, 1]) {
      cone(visual, body, [side * 0.82, 1.25, 0.1], 0.22, 0.5, [0, 0, side * 1.15], 5)
      cone(visual, detail, [side * 0.7, 1.02, 0.22], 0.1, 0.25, [0.5, 0, side * 0.8], 5)
    }
  } else if (species === 'lion') {
    sphere(visual, belly, [0, 1.24, 0.4], [0.58, 0.78, 0.3], 8)
    add(visual, new THREE.TorusGeometry(0.63, 0.09, 6, 16, Math.PI * 1.85), accent, [0, 1.3, 0], [1, 1, 1], [Math.PI / 2, 0, 0])
  }
}

export function createCharacter(species, colors, options = {}) {
  const root = new THREE.Group()
  const visual = new THREE.Group()
  const scale = options.scale || 1
  visual.scale.setScalar(scale)
  root.add(visual)
  const body = MAT(colors.body)
  const belly = MAT(colors.belly)
  const accent = MAT(colors.accent, { emissive: colors.accent, emissiveIntensity: 0.06 })
  const detail = MAT(colors.detail)
  const shirt = MAT(colors.accent, { roughness: 0.76 })
  const shorts = MAT(colors.detail, { roughness: 0.82 })
  const trim = MAT(colors.belly, { roughness: 0.58 })
  const badge = MAT('#ffd23f', { metalness: 0.35, roughness: 0.28, emissive: '#ff9f1f', emissiveIntensity: 0.16 })
  const parts = {}

  const torso = sphere(visual, shirt, [0, 1.18, 0], [1.38, 1.34, 1.04], 12)
  parts.body = torso
  sphere(visual, belly, [0, 1.12, 0.38], [0.78, 0.84, 0.36], 10)
  add(visual, new THREE.TorusGeometry(0.64, 0.06, 6, 16, Math.PI * 1.85), accent, [0, 1.24, 0], [1, 1, 1], [Math.PI / 2, 0.1, 0])
  sphere(visual, badge, [0, 1.46, 0.58], [0.13, 0.13, 0.05], 8)
  sphere(visual, shorts, [0, 0.78, 0.02], [1.16, 0.4, 0.9], 10)
  box(visual, accent, [0, 0.8, 0.45], [0.92, 0.08, 0.05])
  for (const side of [-1, 1]) box(visual, trim, [side * 0.5, 0.79, 0.33], [0.1, 0.26, 0.06], [0, 0, side * 0.04])

  for (const side of [-1, 1]) {
    const arm = new THREE.Group()
    arm.position.set(side * 0.78, 1.52, 0.06)
    visual.add(arm)
    cylinder(arm, body, [0, -0.28, 0], 0.17, 0.66, [0, 0, side * -0.12], 7, 0.14)
    add(arm, new THREE.TorusGeometry(0.165, 0.028, 5, 10), trim, [0, -0.5, 0], [1, 1, 1], [Math.PI / 2, 0, 0])
    sphere(arm, belly, [side * 0.04, -0.63, 0.1], [0.29, 0.27, 0.25], 8)
    if (side < 0) parts.leftArm = arm
    else parts.rightArm = arm
  }

  for (const side of [-1, 1]) {
    const leg = new THREE.Group()
    leg.position.set(side * 0.36, 0.68, 0)
    visual.add(leg)
    cylinder(leg, body, [0, -0.25, 0], 0.2, 0.5, [0, 0, 0], 7, 0.17)
    box(leg, shorts, [0, -0.54, 0.12], [0.34, 0.17, 0.56])
    if (side < 0) parts.leftLeg = leg
    else parts.rightLeg = leg
  }

  const head = new THREE.Group()
  head.position.set(0, 2.08, 0.03)
  visual.add(head)
  parts.head = head
  sphere(head, body, [0, 0, 0], [1.3, 1.18, 1.16], 12)
  createFace(head, colors, species)
  addEars(head, colors, species)
  addTail(visual, colors, species)
  addSpeciesDetails(visual, colors, species)

  if (options.boss) {
    const gold = MAT('#ffc84a', { metalness: 0.7, roughness: 0.25, emissive: '#ff9a1f', emissiveIntensity: 0.2 })
    const crown = new THREE.Group()
    crown.position.set(0, 0.62, 0)
    head.add(crown)
    cylinder(crown, gold, [0, 0, 0], 0.32, 0.14, [0, 0, 0], 8)
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2
      cone(crown, gold, [Math.cos(angle) * 0.27, 0.14, Math.sin(angle) * 0.27], 0.07, 0.22, [0, 0, 0], 5)
    }
    for (const side of [-1, 1]) {
      sphere(visual, gold, [side * 0.78, 1.8, 0.02], [0.34, 0.2, 0.4], 7)
      box(visual, gold, [side * 0.58, 1.4, 0.33], [0.28, 0.42, 0.08])
    }
    box(visual, gold, [0, 1.55, 0.5], [0.58, 0.38, 0.08])
  }

  if (options.weaponType) {
    const weapon = createWeaponModel(options.weaponType, options.tier || 'wood', 0.92)
    weapon.position.set(0.98, 1.18, 0.46)
    weapon.rotation.y = -0.1
    visual.add(weapon)
    parts.weapon = weapon
    parts.weaponBase = weapon.position.clone()
  }

  if (options.aura) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.7, 1.35, 32), new THREE.MeshBasicMaterial({ color: options.aura, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }))
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.02
    visual.add(ring)
    parts.aura = ring
  }

  visual.traverse(object => {
    if (object.isMesh) {
      object.castShadow = true
      object.receiveShadow = true
    }
  })
  root.userData.parts = parts
  root.userData.visual = visual
  root.userData.species = species
  root.userData.colors = colors
  return root
}

export function animateCharacter(model, time, speed = 0, attack = 0) {
  const parts = model.userData.parts
  if (!parts) return
  const walk = Math.min(1, speed / 3.6)
  const swing = Math.sin(time * 9.5) * walk
  if (parts.leftLeg) parts.leftLeg.rotation.x = swing * 0.7
  if (parts.rightLeg) parts.rightLeg.rotation.x = -swing * 0.7
  if (parts.leftArm) {
    parts.leftArm.rotation.x = -swing * 0.55
    parts.leftArm.rotation.z = 0.08
  }
  if (parts.rightArm) {
    parts.rightArm.rotation.x = swing * 0.45 - attack * 0.35
    parts.rightArm.rotation.z = -0.08
  }
  if (parts.body) parts.body.position.y = 1.18 + Math.abs(Math.sin(time * 9.5)) * 0.045 * walk
  if (parts.head) {
    parts.head.rotation.y = Math.sin(time * 0.85) * 0.05 * (1 - walk)
    parts.head.rotation.x = Math.sin(time * 1.4) * 0.025
  }
  if (parts.weapon && parts.weaponBase) {
    parts.weapon.position.z = parts.weaponBase.z - attack * 0.18
    parts.weapon.rotation.x = -attack * 0.08
  }
  if (parts.aura) {
    parts.aura.rotation.z = time * 0.4
    parts.aura.material.opacity = 0.22 + Math.sin(time * 2.2) * 0.09
  }
}

export function createWeaponModel(type, tier = 'wood', scale = 1) {
  const group = new THREE.Group()
  const tierData = TIERS[tier] || TIERS.wood
  const metal = MAT(tierData.color, { metalness: 0.55, roughness: 0.34, emissive: tierData.glow ? tierData.edge : '#000000', emissiveIntensity: tierData.glow || 0 })
  const edge = MAT(tierData.edge, { metalness: 0.6, roughness: 0.28, emissive: tierData.glow ? tierData.edge : '#000000', emissiveIntensity: tierData.glow ? tierData.glow * 1.2 : 0 })
  const wood = MAT('#5b3924', { roughness: 0.9 })
  const dark = MAT('#252b2d', { metalness: 0.3, roughness: 0.45 })
  const accent = MAT('#ffdd55', { emissive: '#ff9d2e', emissiveIntensity: 0.22 })

  if (type === 'shotgun') {
    box(group, wood, [0, 0, -0.32], [0.16, 0.18, 0.5])
    box(group, dark, [0, 0.02, 0.18], [0.13, 0.13, 0.56])
    cylinder(group, metal, [0, 0.08, 0.52], 0.055, 0.78, [Math.PI / 2, 0, 0], 8)
    cylinder(group, edge, [0, 0.08, 0.92], 0.065, 0.08, [Math.PI / 2, 0, 0], 8)
    box(group, metal, [0, -0.03, 0.3], [0.19, 0.12, 0.28])
    box(group, wood, [0, -0.1, -0.02], [0.18, 0.12, 0.3])
    box(group, accent, [0, 0.08, 0.65], [0.035, 0.035, 0.22])
  } else if (type === 'bow') {
    add(group, new THREE.TorusGeometry(0.44, 0.045, 6, 18, Math.PI), metal, [0, 0.02, 0.2], [1, 1, 1], [0, Math.PI / 2, Math.PI / 2])
    const stringGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.44, 0.2), new THREE.Vector3(0, 0, 0.05), new THREE.Vector3(0, -0.44, 0.2)])
    group.add(new THREE.Line(stringGeometry, new THREE.LineBasicMaterial({ color: '#f4f1dc' })))
    box(group, wood, [0, 0, 0.08], [0.08, 0.3, 0.08])
    sphere(group, accent, [0, 0.1, 0.12], [0.08, 0.08, 0.08], 6)
  } else if (type === 'lance') {
    cylinder(group, wood, [0, 0, 0.05], 0.06, 1.0, [Math.PI / 2, 0, 0], 7)
    cone(group, edge, [0, 0, 0.68], 0.14, 0.55, [Math.PI / 2, 0, 0], 6)
    cylinder(group, metal, [0, 0, -0.08], 0.11, 0.12, [Math.PI / 2, 0, 0], 8)
    box(group, accent, [0, 0, 0.22], [0.16, 0.04, 0.12])
  } else if (type === 'bomb') {
    sphere(group, metal, [0, 0, 0.2], [0.42, 0.42, 0.42], 10)
    cylinder(group, dark, [0, 0.27, 0.2], 0.07, 0.16, [0, 0, 0], 6)
    sphere(group, accent, [0.08, 0.36, 0.2], [0.1, 0.1, 0.1], 6)
    add(group, new THREE.TorusGeometry(0.34, 0.025, 5, 12), edge, [0, 0, 0.2], [1, 1, 1], [Math.PI / 2, 0, 0])
  } else if (type === 'staff') {
    cylinder(group, wood, [0, 0, 0.1], 0.055, 1.2, [Math.PI / 2, 0, 0], 7)
    sphere(group, metal, [0, 0, 0.76], [0.24, 0.24, 0.24], 8)
    add(group, new THREE.TorusGeometry(0.32, 0.035, 5, 14), edge, [0, 0, 0.76], [1, 1, 1], [0, Math.PI / 2, 0])
    sphere(group, accent, [0, 0, 0.82], [0.13, 0.13, 0.13], 6)
  } else if (type === 'crossbow') {
    box(group, wood, [0, 0, 0.08], [0.16, 0.14, 0.75])
    box(group, metal, [0, 0.02, 0.4], [0.8, 0.06, 0.08], [0, 0, 0])
    box(group, metal, [0, 0.02, 0.4], [0.08, 0.32, 0.08])
    cylinder(group, edge, [0, 0.1, 0.48], 0.035, 0.55, [Math.PI / 2, 0, 0], 6)
    box(group, dark, [0, -0.14, -0.1], [0.12, 0.2, 0.18])
  } else if (type === 'minigun') {
    box(group, dark, [0, 0, -0.15], [0.3, 0.28, 0.55])
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2
      cylinder(group, metal, [Math.cos(angle) * 0.1, Math.sin(angle) * 0.1, 0.55], 0.038, 0.85, [Math.PI / 2, 0, 0], 6)
    }
    add(group, new THREE.TorusGeometry(0.17, 0.04, 6, 12), edge, [0, 0, 0.97], [1, 1, 1], [0, 0, 0])
    box(group, accent, [0, 0.18, -0.1], [0.12, 0.08, 0.25])
  } else {
    box(group, metal, [0, 0, 0.2], [0.15, 0.15, 0.8])
  }
  group.scale.setScalar(scale)
  return group
}

export function createChestModel(rarity = 'common', scale = 1) {
  const group = new THREE.Group()
  const colors = {
    common: { wood: '#8b5a34', metal: '#c99755', glow: '#ffd98b' },
    rare: { wood: '#6b8190', metal: '#d5edf5', glow: '#c7f6ff' },
    epic: { wood: '#644184', metal: '#d9a9ff', glow: '#e6c4ff' },
    legendary: { wood: '#a4652d', metal: '#ffd451', glow: '#fff0a0' },
    mythic: { wood: '#813747', metal: '#ff8fa4', glow: '#ffd0da' }
  }[rarity] || { wood: '#8b5a34', metal: '#c99755', glow: '#ffd98b' }
  const wood = MAT(colors.wood, { roughness: 0.75 })
  const metal = MAT(colors.metal, { metalness: 0.7, roughness: 0.25, emissive: colors.glow, emissiveIntensity: 0.14 })
  box(group, wood, [0, 0.42, 0], [1.15, 0.82, 0.75])
  add(group, new THREE.CylinderGeometry(0.58, 0.58, 0.75, 12, 1, false, 0, Math.PI), wood, [0, 0.83, 0], [1, 1, 1], [0, 0, Math.PI / 2])
  for (const x of [-0.48, 0.48]) box(group, metal, [x, 0.42, 0.39], [0.1, 0.82, 0.05])
  box(group, metal, [0, 0.83, 0.39], [1.2, 0.1, 0.06])
  box(group, metal, [0, 0.47, 0.43], [0.24, 0.3, 0.09])
  box(group, MAT('#3a2a1d'), [0, 0.47, 0.48], [0.1, 0.12, 0.05])
  const glow = new THREE.Mesh(new THREE.CircleGeometry(0.9, 24), new THREE.MeshBasicMaterial({ color: colors.glow, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }))
  glow.rotation.x = -Math.PI / 2
  glow.position.y = 0.01
  group.add(glow)
  group.scale.setScalar(scale)
  return group
}

export function createTree(variant = 0) {
  const group = new THREE.Group()
  const trunkMat = MAT(variant === 1 ? '#6d4b32' : '#5b3c29', { roughness: 0.92 })
  const leafColors = ['#2f8c4c', '#3ca25a', '#256f40', '#55b45f']
  const leaf = MAT(leafColors[variant % leafColors.length], { roughness: 0.8 })
  const leaf2 = MAT(leafColors[(variant + 1) % leafColors.length], { roughness: 0.8 })
  if (variant === 2) {
    const trunk = cylinder(group, trunkMat, [0, 2.2, 0], 0.16, 4.4, [0.08, 0, 0.05], 7, 0.24)
    trunk.castShadow = true
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2
      const leafMesh = add(group, new THREE.ConeGeometry(0.38, 2.5, 5), i % 2 ? leaf : leaf2, [Math.cos(angle) * 0.8, 4.25, Math.sin(angle) * 0.8], [1, 1, 0.3], [Math.cos(angle) * 0.8, -angle, Math.sin(angle) * 0.8])
      leafMesh.castShadow = true
    }
    for (let i = 0; i < 3; i++) sphere(group, leaf2, [Math.cos(i * 2.1) * 0.4, 3.9, Math.sin(i * 2.1) * 0.4], [0.55, 0.25, 0.55], 7)
  } else {
    cylinder(group, trunkMat, [0, 1.2, 0], 0.22, 2.4, [0, 0, 0], 7, 0.32)
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2
      const canopy = sphere(group, i % 2 ? leaf : leaf2, [Math.cos(angle) * 0.55, 2.75 + (i % 2) * 0.45, Math.sin(angle) * 0.55], [1.25, 1.0, 1.25], 8)
      canopy.castShadow = true
    }
    sphere(group, leaf, [0, 3.35, 0], [1.5, 1.2, 1.5], 9)
    if (variant === 3) {
      for (let i = 0; i < 5; i++) sphere(group, MAT('#ffb24d'), [Math.cos(i * 1.3) * 0.9, 2.6 + (i % 2) * 0.3, Math.sin(i * 1.3) * 0.9], [0.1, 0.1, 0.1], 5)
    }
  }
  group.traverse(object => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true } })
  return group
}

export function createRock(scale = 1) {
  const group = new THREE.Group()
  const rock = add(group, new THREE.DodecahedronGeometry(0.8, 0), MAT('#7c887f', { roughness: 0.95 }), [0, 0.55, 0], [1.25, 0.85, 1.1], [0.2, 0.5, 0.1])
  rock.castShadow = true
  add(group, new THREE.DodecahedronGeometry(0.4, 0), MAT('#64736d', { roughness: 0.95 }), [0.65, 0.25, 0.25], [1, 0.7, 1], [0, 0.2, 0])
  group.scale.setScalar(scale)
  return group
}

export function createBush(scale = 1) {
  const group = new THREE.Group()
  const colors = ['#2c7d47', '#3a9956', '#1f6239']
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2
    sphere(group, MAT(colors[i % 3], { roughness: 0.85 }), [Math.cos(angle) * 0.45, 0.35 + (i % 2) * 0.16, Math.sin(angle) * 0.45], [0.8, 0.7, 0.8], 7)
  }
  group.scale.setScalar(scale)
  return group
}

export function createBarrel() {
  const group = new THREE.Group()
  const wood = MAT('#8d5b32', { roughness: 0.8 })
  const dark = MAT('#5a3a20', { roughness: 0.9 })
  const metal = MAT('#aeb7b2', { metalness: 0.55, roughness: 0.4 })
  cylinder(group, wood, [0, 0.6, 0], 0.5, 1.2, [0, 0, 0], 12, 0.42)
  for (const y of [0.22, 1.0]) add(group, new THREE.TorusGeometry(0.48, 0.045, 6, 14), metal, [0, y, 0], [1, 1, 1], [Math.PI / 2, 0, 0])
  for (let i = 0; i < 6; i++) box(group, dark, [0, 0.6, 0.46], [0.06, 1.0, 0.03], [0, (i / 6) * Math.PI * 2, 0])
  box(group, MAT('#ffd451'), [0, 0.7, 0.5], [0.18, 0.24, 0.03])
  group.userData.kind = 'barrel'
  return group
}

export function createBarrier() {
  const group = new THREE.Group()
  const wood = MAT('#9b6638', { roughness: 0.9 })
  const dark = MAT('#5b3a22', { roughness: 0.95 })
  const metal = MAT('#b6b8a9', { metalness: 0.5, roughness: 0.45 })
  for (let i = 0; i < 3; i++) box(group, wood, [(i - 1) * 0.55, 0.72, 0], [0.48, 1.42, 0.15], [0, 0, (i - 1) * 0.03])
  box(group, dark, [0, 1.05, 0.12], [1.65, 0.16, 0.1])
  box(group, dark, [0, 0.4, 0.12], [1.65, 0.16, 0.1])
  for (const x of [-0.7, 0.7]) sphere(group, metal, [x, 1.05, 0.2], [0.06, 0.06, 0.04], 5)
  group.userData.kind = 'barrier'
  return group
}

export function createTrap() {
  const group = new THREE.Group()
  const metal = MAT('#8e9a9c', { metalness: 0.65, roughness: 0.35 })
  const dark = MAT('#3b4446', { metalness: 0.4, roughness: 0.5 })
  add(group, new THREE.TorusGeometry(0.48, 0.06, 6, 18), metal, [0, 0.05, 0], [1, 1, 1], [Math.PI / 2, 0, 0])
  for (const side of [-1, 1]) {
    add(group, new THREE.TorusGeometry(0.38, 0.045, 5, 12, Math.PI), metal, [0, 0.08, side * 0.2], [1, 1, 1], [Math.PI / 2, 0, 0])
    for (let i = 0; i < 5; i++) cone(group, dark, [side * (0.04 + i * 0.08), 0.1, side * 0.22], 0.035, 0.15, [0, 0, 0], 4)
  }
  sphere(group, MAT('#ff5b45', { emissive: '#ff2e1f', emissiveIntensity: 0.4 }), [0, 0.1, 0], [0.08, 0.08, 0.08], 5)
  return group
}

export function createShrine() {
  const group = new THREE.Group()
  const stone = MAT('#7c8c7f', { roughness: 0.85 })
  const moss = MAT('#4d8d4f', { roughness: 0.95 })
  const gold = MAT('#e7b94f', { metalness: 0.7, roughness: 0.3, emissive: '#ffb52e', emissiveIntensity: 0.18 })
  cylinder(group, stone, [0, 0.2, 0], 2.9, 0.4, [0, 0, 0], 8, 3.2)
  cylinder(group, moss, [0, 0.41, 0], 2.5, 0.1, [0, 0, 0], 8, 2.8)
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4
    cylinder(group, stone, [Math.cos(angle) * 2.1, 1.35, Math.sin(angle) * 2.1], 0.34, 2.3, [0, 0, 0], 7, 0.42)
    box(group, gold, [Math.cos(angle) * 2.1, 2.55, Math.sin(angle) * 2.1], [0.9, 0.16, 0.9])
  }
  const crystal = add(group, new THREE.OctahedronGeometry(0.65, 0), MAT('#ffcf5a', { metalness: 0.4, roughness: 0.2, emissive: '#ffae2e', emissiveIntensity: 0.55, transparent: true, opacity: 0.9 }), [0, 2.1, 0], [1, 1.8, 1])
  crystal.userData.spin = true
  group.userData.crystal = crystal
  return group
}

export function createPickupRing(color) {
  const group = new THREE.Group()
  add(group, new THREE.TorusGeometry(0.48, 0.035, 6, 24), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 }), [0, 0.12, 0], [1, 1, 1], [Math.PI / 2, 0, 0])
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.52, 2.1, 12, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }))
  beam.position.y = 1.1
  group.add(beam)
  return group
}

export function createItemModel(kind) {
  const group = new THREE.Group()
  if (kind === 'medkit') {
    box(group, MAT('#f3f4ec', { roughness: 0.5 }), [0, 0.45, 0], [0.62, 0.42, 0.5])
    box(group, MAT('#ff5a5a', { emissive: '#ff2e2e', emissiveIntensity: 0.2 }), [0, 0.45, 0.26], [0.12, 0.28, 0.03])
    box(group, MAT('#ff5a5a', { emissive: '#ff2e2e', emissiveIntensity: 0.2 }), [0, 0.45, 0.26], [0.3, 0.12, 0.03])
  } else if (kind === 'shield') {
    add(group, new THREE.OctahedronGeometry(0.36, 0), MAT('#66d9ff', { metalness: 0.35, roughness: 0.2, emissive: '#2bb8ff', emissiveIntensity: 0.4, transparent: true, opacity: 0.92 }), [0, 0.55, 0], [1, 1.25, 1])
    add(group, new THREE.TorusGeometry(0.45, 0.03, 5, 20), MAT('#d5f8ff', { emissive: '#7ae9ff', emissiveIntensity: 0.4 }), [0, 0.55, 0], [1, 1, 1], [Math.PI / 2, 0, 0])
  } else if (kind === 'speed') {
    sphere(group, MAT('#b6ff4f', { emissive: '#7cff20', emissiveIntensity: 0.35, transparent: true, opacity: 0.9 }), [0, 0.58, 0], [0.46, 0.46, 0.46], 9)
    for (let i = 0; i < 3; i++) box(group, MAT('#f4ffdc', { emissive: '#d2ff7a', emissiveIntensity: 0.2 }), [-0.18 + i * 0.18, 0.58, 0.3], [0.05, 0.32, 0.05])
  } else if (kind === 'trap') {
    group.add(createTrap())
    group.position.y = 0.35
  } else if (kind === 'barricade') {
    const barrier = createBarrier()
    barrier.scale.setScalar(0.5)
    group.add(barrier)
  } else {
    sphere(group, MAT('#ffd451', { emissive: '#ff9f1f', emissiveIntensity: 0.3 }), [0, 0.55, 0], [0.35, 0.35, 0.35], 8)
  }
  group.traverse(object => { if (object.isMesh) object.castShadow = true })
  return group
}

export function createWeaponPickup(type, tier) {
  const group = new THREE.Group()
  const tierData = TIERS[tier]
  const weapon = createWeaponModel(type, tier, 1.1)
  weapon.position.y = 0.95
  group.add(weapon)
  const ring = createPickupRing(tierData.edge)
  group.add(ring)
  group.userData.weapon = weapon
  group.userData.ring = ring
  return group
}

export function createNameSprite(name, color = '#ffffff') {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const context = canvas.getContext('2d')
  context.font = '700 30px "Baloo 2", sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.lineWidth = 6
  context.strokeStyle = 'rgba(7,20,18,.8)'
  context.strokeText(name, 128, 32)
  context.fillStyle = color
  context.fillText(name, 128, 32)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(2.4, 0.6, 1)
  return sprite
}

export function createHealthBar(width = 1.4) {
  const group = new THREE.Group()
  const background = new THREE.Mesh(new THREE.PlaneGeometry(width, 0.14), new THREE.MeshBasicMaterial({ color: '#17201e', transparent: true, opacity: 0.82, depthWrite: false }))
  const fill = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.06, 0.08), new THREE.MeshBasicMaterial({ color: '#7cff61', depthWrite: false }))
  const shield = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.06, 0.055), new THREE.MeshBasicMaterial({ color: '#dff7ff', depthWrite: false }))
  fill.position.z = 0.01
  shield.position.z = 0.02
  shield.visible = false
  group.add(background, fill, shield)
  group.userData.fill = fill
  group.userData.shield = shield
  group.userData.width = width
  return group
}

export function setHealthBar(bar, ratio, shieldRatio = 0) {
  const width = bar.userData.width - 0.06
  const fill = bar.userData.fill
  const shield = bar.userData.shield
  fill.scale.x = Math.max(0.001, ratio)
  fill.position.x = -width * (1 - Math.max(0.001, ratio)) / 2
  fill.material.color.set(ratio > 0.55 ? '#7cff61' : ratio > 0.25 ? '#ffd451' : '#ff5d4a')
  shield.visible = shieldRatio > 0
  shield.scale.x = Math.max(0.001, shieldRatio)
  shield.position.x = -width * (1 - Math.max(0.001, shieldRatio)) / 2
}

export function createAimRing(color = '#c6ff4a') {
  const group = new THREE.Group()
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.5, 24), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }))
  ring.rotation.x = -Math.PI / 2
  group.add(ring)
  const dot = new THREE.Mesh(new THREE.CircleGeometry(0.08, 12), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }))
  dot.rotation.x = -Math.PI / 2
  group.add(dot)
  return group
}
