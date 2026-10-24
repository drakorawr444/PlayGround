export class Sound {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.noiseBuffer = null;
    this.muted = false;
    this.volume = 0.5;
  }

  init() {
    if (this.ctx) return;
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    try {
      this.ctx = new AudioCtor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : this.volume;
      this.master.connect(this.ctx.destination);
      const length = Math.floor(this.ctx.sampleRate * 1.5);
      this.noiseBuffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    } catch {
      this.ctx = null;
    }
  }

  unlock() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : this.volume, this.ctx.currentTime, 0.02);
    }
  }

  tone({ freq = 440, freqEnd, dur = 0.2, type = 'sine', vol = 0.16, delay = 0, attack = 0.006, sweep = 'exp' }) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), t0);
    if (freqEnd) {
      const end = Math.max(20, freqEnd);
      if (sweep === 'lin') osc.frequency.linearRampToValueAtTime(end, t0 + dur);
      else osc.frequency.exponentialRampToValueAtTime(end, t0 + dur);
    }
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  noise({ dur = 0.25, vol = 0.16, from = 1200, to = 300, q = 1, delay = 0, type = 'bandpass' }) {
    if (!this.ctx || this.muted || !this.noiseBuffer) return;
    const t0 = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(Math.max(40, from), t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, to), t0 + dur);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.03);
  }

  click() {
    this.tone({ freq: 540, freqEnd: 720, dur: 0.06, type: 'square', vol: 0.06 });
  }

  back() {
    this.tone({ freq: 420, freqEnd: 260, dur: 0.09, type: 'triangle', vol: 0.08 });
  }

  select() {
    this.tone({ freq: 620, freqEnd: 640, dur: 0.09, type: 'triangle', vol: 0.1 });
    this.tone({ freq: 940, dur: 0.12, type: 'sine', vol: 0.08, delay: 0.07 });
  }

  turn() {
    this.tone({ freq: 620, dur: 0.09, type: 'triangle', vol: 0.09 });
    this.tone({ freq: 880, dur: 0.14, type: 'triangle', vol: 0.09, delay: 0.08 });
  }

  throwSfx() {
    this.noise({ dur: 0.26, vol: 0.14, from: 500, to: 2200, q: 1.4 });
    this.tone({ freq: 240, freqEnd: 90, dur: 0.18, type: 'sawtooth', vol: 0.05 });
  }

  bow() {
    this.tone({ freq: 340, freqEnd: 120, dur: 0.2, type: 'sawtooth', vol: 0.08 });
    this.noise({ dur: 0.16, vol: 0.12, from: 2600, to: 600, q: 0.8 });
  }

  grenade() {
    this.noise({ dur: 0.2, vol: 0.08, from: 300, to: 900, q: 2 });
    this.tone({ freq: 180, dur: 0.12, type: 'triangle', vol: 0.06 });
  }

  shuriken() {
    this.noise({ dur: 0.18, vol: 0.1, from: 3000, to: 1400, q: 3 });
    this.tone({ freq: 1400, freqEnd: 900, dur: 0.16, type: 'sine', vol: 0.05 });
  }

  stick() {
    this.tone({ freq: 160, freqEnd: 70, dur: 0.14, type: 'square', vol: 0.09 });
    this.noise({ dur: 0.1, vol: 0.1, from: 500, to: 150, q: 2 });
  }

  thud() {
    this.tone({ freq: 120, freqEnd: 46, dur: 0.3, type: 'sine', vol: 0.22 });
    this.noise({ dur: 0.2, vol: 0.12, from: 420, to: 90, q: 0.9, type: 'lowpass' });
  }

  hit(headshot = false) {
    this.noise({ dur: 0.16, vol: 0.2, from: 1400, to: 240, q: 1.2 });
    this.tone({ freq: 200, freqEnd: 70, dur: 0.18, type: 'square', vol: 0.1 });
    if (headshot) {
      this.tone({ freq: 1500, freqEnd: 800, dur: 0.22, type: 'triangle', vol: 0.12 });
      this.tone({ freq: 2200, dur: 0.08, type: 'sine', vol: 0.06, delay: 0.03 });
    }
  }

  boom() {
    this.noise({ dur: 0.9, vol: 0.4, from: 1600, to: 50, q: 0.7, type: 'lowpass' });
    this.tone({ freq: 100, freqEnd: 28, dur: 0.8, type: 'sine', vol: 0.34 });
    this.noise({ dur: 0.32, vol: 0.18, from: 3000, to: 300, q: 0.5, delay: 0.02 });
  }

  death() {
    this.tone({ freq: 320, freqEnd: 50, dur: 0.85, type: 'sawtooth', vol: 0.12 });
    this.tone({ freq: 180, freqEnd: 40, dur: 0.7, type: 'square', vol: 0.05, delay: 0.05 });
    this.noise({ dur: 0.5, vol: 0.08, from: 900, to: 120, q: 1, delay: 0.06 });
  }

  win() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      this.tone({ freq, dur: 0.32, type: 'triangle', vol: 0.14, delay: i * 0.11 });
      this.tone({ freq: freq / 2, dur: 0.2, type: 'sine', vol: 0.06, delay: i * 0.11 });
    });
    this.tone({ freq: 1568, dur: 0.5, type: 'sine', vol: 0.08, delay: 0.48 });
  }

  lose() {
    const notes = [392, 330, 262, 196];
    notes.forEach((freq, i) => {
      this.tone({ freq, dur: 0.3, type: 'triangle', vol: 0.11, delay: i * 0.13 });
    });
  }

  tick() {
    this.tone({ freq: 880, dur: 0.035, type: 'square', vol: 0.04 });
  }

  ability() {
    this.tone({ freq: 520, freqEnd: 1180, dur: 0.22, type: 'triangle', vol: 0.12 });
    this.tone({ freq: 780, dur: 0.12, type: 'sine', vol: 0.07, delay: 0.08 });
    this.noise({ dur: 0.22, vol: 0.09, from: 2200, to: 700, q: 1.6 });
  }

  unlockWeapon() {
    this.tone({ freq: 700, freqEnd: 1200, dur: 0.12, type: 'triangle', vol: 0.09 });
  }
}
