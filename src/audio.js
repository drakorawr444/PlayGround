let ctx = null;
let enabled = true;

export function init(soundOn) {
  enabled = soundOn;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    ctx = null;
  }
  if (ctx && ctx.state === "suspended") {
    const resume = () => {
      ctx.resume();
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
    window.addEventListener("pointerdown", resume);
    window.addEventListener("keydown", resume);
  }
}

export function setEnabled(v) {
  enabled = v;
}

function tone({ freq = 440, type = "sine", dur = 0.15, vol = 0.15, slideTo = null, delay = 0 }) {
  if (!ctx || !enabled) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise({ dur = 0.15, vol = 0.2, low = 400, high = 2400, delay = 0 }) {
  if (!ctx || !enabled) return;
  const t0 = ctx.currentTime + delay;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(high, t0);
  filter.frequency.exponentialRampToValueAtTime(low, t0 + dur);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(t0);
}

export const sfx = {
  click() {
    tone({ freq: 480, type: "square", dur: 0.06, vol: 0.08, slideTo: 700 });
  },
  whoosh() {
    noise({ dur: 0.35, vol: 0.12, low: 300, high: 2800 });
  },
  stickGround() {
    noise({ dur: 0.12, vol: 0.18, low: 150, high: 900 });
    tone({ freq: 130, type: "triangle", dur: 0.1, vol: 0.15, slideTo: 60 });
  },
  hitBody() {
    noise({ dur: 0.12, vol: 0.3, low: 120, high: 700 });
    tone({ freq: 180, type: "sawtooth", dur: 0.12, vol: 0.2, slideTo: 70 });
  },
  hitHead() {
    noise({ dur: 0.12, vol: 0.3, low: 150, high: 900 });
    tone({ freq: 660, type: "square", dur: 0.09, vol: 0.12, slideTo: 1200, delay: 0.02 });
    tone({ freq: 990, type: "square", dur: 0.12, vol: 0.12, slideTo: 1500, delay: 0.09 });
  },
  death() {
    tone({ freq: 300, type: "sawtooth", dur: 0.5, vol: 0.18, slideTo: 40 });
    noise({ dur: 0.5, vol: 0.2, low: 100, high: 800 });
  },
  coin() {
    tone({ freq: 880, type: "square", dur: 0.07, vol: 0.1 });
    tone({ freq: 1320, type: "square", dur: 0.1, vol: 0.1, delay: 0.07 });
  },
  win() {
    [523, 659, 784, 1046].forEach((f, i) =>
      tone({ freq: f, type: "triangle", dur: 0.18, vol: 0.14, delay: i * 0.12 })
    );
  },
  lose() {
    [392, 330, 262, 196].forEach((f, i) =>
      tone({ freq: f, type: "triangle", dur: 0.22, vol: 0.14, delay: i * 0.14 })
    );
  },
};
