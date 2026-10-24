export class AudioEngine {
  constructor(store) {
    this.store = store
    this.context = null
    this.master = null
    this.enabled = store.state.settings.sound
  }

  init() {
    if (this.context) {
      if (this.context.state === 'suspended') this.context.resume()
      return
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    this.context = new AudioContext()
    this.master = this.context.createGain()
    this.master.gain.value = this.enabled ? 0.32 : 0
    this.master.connect(this.context.destination)
  }

  setEnabled(value) {
    this.enabled = value
    this.store.state.settings.sound = value
    this.store.save()
    if (this.master) this.master.gain.setTargetAtTime(value ? 0.32 : 0, this.context.currentTime, 0.02)
  }

  tone(frequency, duration, type = 'sine', volume = 0.2, slide = 0, delay = 0) {
    if (!this.context || !this.enabled) return
    const now = this.context.currentTime + delay
    const oscillator = this.context.createOscillator()
    const gain = this.context.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, now)
    if (slide) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, frequency + slide), now + duration)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    oscillator.connect(gain)
    gain.connect(this.master)
    oscillator.start(now)
    oscillator.stop(now + duration + 0.02)
  }

  noise(duration = 0.12, volume = 0.16, filter = 900, delay = 0) {
    if (!this.context || !this.enabled) return
    const now = this.context.currentTime + delay
    const size = Math.max(1, Math.floor(this.context.sampleRate * duration))
    const buffer = this.context.createBuffer(1, size, this.context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1
    const source = this.context.createBufferSource()
    source.buffer = buffer
    const band = this.context.createBiquadFilter()
    band.type = 'lowpass'
    band.frequency.setValueAtTime(filter, now)
    band.frequency.exponentialRampToValueAtTime(Math.max(120, filter * 0.4), now + duration)
    const gain = this.context.createGain()
    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    source.connect(band)
    band.connect(gain)
    gain.connect(this.master)
    source.start(now)
  }

  click() {
    this.tone(520, 0.05, 'triangle', 0.08, 180)
  }

  tab() {
    this.tone(340, 0.08, 'sine', 0.08, 120)
    this.tone(620, 0.06, 'sine', 0.04, 80, 0.03)
  }

  shoot(type, tier = 'wood') {
    const pitch = { shotgun: 90, bow: 340, lance: 240, bomb: 120, staff: 520, crossbow: 280, minigun: 140 }[type] || 200
    if (type === 'bow' || type === 'crossbow') {
      this.tone(pitch, 0.08, 'triangle', 0.13, 300)
      this.noise(0.08, 0.06, 2200)
    } else if (type === 'bomb') {
      this.tone(90, 0.16, 'sawtooth', 0.1, -30)
      this.noise(0.16, 0.08, 500)
    } else if (type === 'lance') {
      this.tone(pitch, 0.1, 'square', 0.07, 180)
    } else if (type === 'staff') {
      this.tone(pitch, 0.18, 'sine', 0.09, 220)
    } else {
      this.noise(0.09, 0.15, 1600)
      this.tone(pitch, 0.08, 'sawtooth', 0.09, -40)
    }
    if (tier === 'legendary') this.tone(880, 0.18, 'sine', 0.04, 220)
  }

  hit() {
    this.tone(160, 0.08, 'square', 0.09, -60)
    this.noise(0.06, 0.08, 900)
  }

  hurt() {
    this.tone(110, 0.2, 'sawtooth', 0.13, -50)
    this.noise(0.12, 0.1, 600)
  }

  pickup() {
    this.tone(520, 0.08, 'sine', 0.12, 180)
    this.tone(780, 0.12, 'sine', 0.1, 260, 0.06)
  }

  heal() {
    this.tone(420, 0.18, 'sine', 0.11, 180)
    this.tone(660, 0.25, 'sine', 0.1, 320, 0.09)
  }

  shield() {
    this.tone(280, 0.3, 'sine', 0.12, 540)
    this.tone(840, 0.25, 'triangle', 0.06, 180, 0.08)
  }

  trap() {
    this.noise(0.12, 0.15, 1800)
    this.tone(120, 0.12, 'square', 0.12, -60)
  }

  chest() {
    [523, 659, 784, 1046].forEach((note, index) => this.tone(note, 0.35, 'triangle', 0.09, 0, index * 0.08))
  }

  win() {
    [392, 523, 659, 784, 1046].forEach((note, index) => this.tone(note, 0.5, 'triangle', 0.12, 0, index * 0.1))
  }

  lose() {
    [392, 330, 262, 196].forEach((note, index) => this.tone(note, 0.5, 'sine', 0.1, 0, index * 0.12))
  }

  boss() {
    this.tone(70, 0.8, 'sawtooth', 0.16, 20)
    this.tone(140, 0.7, 'square', 0.08, 30, 0.1)
    this.noise(0.7, 0.1, 300)
  }

  explosion() {
    this.noise(0.55, 0.3, 800)
    this.tone(70, 0.45, 'sawtooth', 0.18, -30)
  }

  countdown(value) {
    this.tone(value ? 620 : 880, 0.18, 'triangle', 0.13, 0)
  }
}
