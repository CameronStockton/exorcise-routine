
// ================= AUDIO: everything is synthesized =================
const AU = { ctx: null, master: null, sfx: null, mus: null, noise: null, muted: false, last: {}, voices: 0 };

function audioInit() {
  if (AU.ctx) { AU.ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  const ctx = (AU.ctx = new AC());
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.ratio.value = 6;
  comp.connect(ctx.destination);
  AU.master = ctx.createGain(); AU.master.gain.value = 0.8; AU.master.connect(comp);
  AU.sfx = ctx.createGain(); AU.sfx.gain.value = 0.9; AU.sfx.connect(AU.master);
  AU.mus = ctx.createGain(); AU.mus.gain.value = 0.22; AU.mus.connect(AU.master);
  const len = ctx.sampleRate;
  AU.noise = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = AU.noise.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  MUS.next = ctx.currentTime + 0.1;
  setInterval(musicTick, 60);
}
function toggleMute() {
  AU.muted = !AU.muted;
  if (AU.master) AU.master.gain.value = AU.muted ? 0 : 0.8;
  toast(AU.muted ? 'Muted' : 'Sound on', AU.muted ? 'Press M to bring the noise back.' : 'Crunch restored.');
}
function vol(p) {
  if (!p) return 1;
  const d = camera.position.distanceTo(p);
  return clamp(1.25 - d / 26, 0.06, 1);
}
function tone({ type = 'sine', f = 440, f2 = null, t = 0.2, v = 0.3, delay = 0, at = null, dest = null, a = 0.004, vib = 0, q = 0 }) {
  const ctx = AU.ctx;
  const t0 = at ?? ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t0);
  if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + t);
  if (vib) {
    const l = ctx.createOscillator(), lg = ctx.createGain();
    l.frequency.value = vib; lg.gain.value = f * 0.06;
    l.connect(lg); lg.connect(o.frequency); l.start(t0); l.stop(t0 + t + 0.05);
  }
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t0 + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + t);
  let node = o;
  if (q) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = q; o.connect(fl); node = fl; }
  node.connect(g); g.connect(dest || AU.sfx);
  o.start(t0); o.stop(t0 + t + 0.05);
}
function noise({ t = 0.2, v = 0.3, f = 1000, f2 = null, q = 1, type = 'bandpass', delay = 0 }) {
  const ctx = AU.ctx;
  const t0 = ctx.currentTime + delay;
  const s = ctx.createBufferSource();
  s.buffer = AU.noise;
  s.playbackRate.value = rand(0.8, 1.2);
  const fl = ctx.createBiquadFilter();
  fl.type = type; fl.Q.value = q;
  fl.frequency.setValueAtTime(f, t0);
  if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t0 + t);
  const g = ctx.createGain();
  g.gain.setValueAtTime(v, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + t);
  s.connect(fl); fl.connect(g); g.connect(AU.sfx);
  s.start(t0, Math.random() * 0.5); s.stop(t0 + t + 0.05);
}

const SFX = {
  punch(p, power = 1) {
    const v = vol(p) * clamp(power, 0.5, 1.6);
    noise({ t: 0.12, v: 0.55 * v, f: 1400, f2: 200, type: 'lowpass' });
    tone({ f: 190, f2: 42, t: 0.18, v: 0.7 * v });
    tone({ type: 'square', f: 90, f2: 40, t: 0.08, v: 0.12 * v });
  },
  thud(p) { const v = vol(p); tone({ f: 110, f2: 40, t: 0.14, v: 0.45 * v }); noise({ t: 0.08, v: 0.25 * v, f: 500, type: 'lowpass' }); },
  whoosh() { noise({ t: 0.16, v: 0.13, f: 500, f2: 2400, q: 1.5 }); },
  yeet() { noise({ t: 0.32, v: 0.22, f: 300, f2: 3000, q: 2 }); },
  wood(p) {
    const v = vol(p);
    noise({ t: 0.16, v: 0.6 * v, f: 700, q: 2.5 });
    noise({ t: 0.12, v: 0.4 * v, f: 1600, q: 3, delay: 0.035 });
    tone({ type: 'triangle', f: 120, f2: 55, t: 0.16, v: 0.35 * v });
  },
  glass(p) {
    const v = vol(p);
    noise({ t: 0.35, v: 0.35 * v, f: 4000, type: 'highpass' });
    for (let i = 0; i < 7; i++) tone({ type: 'triangle', f: rand(1800, 5200), t: rand(0.08, 0.3), v: 0.08 * v, delay: rand(0, 0.15) });
  },
  ceramic(p) {
    const v = vol(p);
    noise({ t: 0.2, v: 0.45 * v, f: 2400, q: 1.2 });
    for (let i = 0; i < 4; i++) tone({ type: 'triangle', f: rand(900, 2400), t: 0.12, v: 0.08 * v, delay: rand(0, 0.08) });
  },
  metal(p) {
    const v = vol(p), b = rand(380, 560);
    [1, 2.52, 4.1, 6.3].forEach((m, i) => tone({ f: b * m, t: 0.7 - i * 0.12, v: (0.2 - i * 0.04) * v }));
    noise({ t: 0.05, v: 0.3 * v, f: 3000, type: 'highpass' });
  },
  soft(p) { const v = vol(p); noise({ t: 0.22, v: 0.45 * v, f: 500, f2: 150, type: 'lowpass' }); },
  stone(p) { const v = vol(p); noise({ t: 0.3, v: 0.6 * v, f: 400, q: 0.8, type: 'lowpass' }); tone({ f: 70, f2: 35, t: 0.3, v: 0.4 * v }); },
  electric(p) {
    const v = vol(p);
    tone({ type: 'sawtooth', f: 62, t: 0.45, v: 0.18 * v, q: 1200 });
    for (let i = 0; i < 6; i++) noise({ t: 0.03, v: 0.3 * v, f: 6000, type: 'highpass', delay: i * 0.05 + rand(0, 0.03) });
  },
  splat(p) {
    const v = vol(p);
    noise({ t: 0.28, v: 0.6 * v, f: 900, f2: 120, type: 'lowpass' });
    tone({ f: 320, f2: 70, t: 0.22, v: 0.3 * v });
  },
  squelch(p) { const v = vol(p); tone({ type: 'sawtooth', f: 200, f2: 600, t: 0.15, v: 0.15 * v, q: 900 }); noise({ t: 0.15, v: 0.3 * v, f: 600, type: 'lowpass' }); },
  boing() { tone({ type: 'triangle', f: 160, f2: 720, t: 0.38, v: 0.18, vib: 18 }); },
  boo(p) { tone({ f: 540, f2: 260, t: 0.9, v: 0.16 * vol(p), vib: 6 }); tone({ f: 810, f2: 390, t: 0.9, v: 0.05 * vol(p), vib: 6 }); },
  groan(p) { tone({ type: 'sawtooth', f: 96, f2: 66, t: 0.8, v: 0.13 * vol(p), q: 600, vib: 4 }); },
  roar(p) { const v = vol(p); tone({ type: 'sawtooth', f: 140, f2: 55, t: 0.6, v: 0.2 * v, q: 900, vib: 30 }); noise({ t: 0.5, v: 0.25 * v, f: 700, type: 'lowpass' }); },
  wheee(p) { tone({ type: 'triangle', f: 900, f2: 1700, t: 0.4, v: 0.08 * vol(p), vib: 9 }); },
  hurt() { tone({ type: 'square', f: 240, f2: 110, t: 0.2, v: 0.16 }); noise({ t: 0.1, v: 0.25, f: 800, type: 'lowpass' }); },
  pickup() { [660, 880, 1320].forEach((f, i) => tone({ type: 'triangle', f, t: 0.18, v: 0.16, delay: i * 0.06 })); },
  gulp() { [0, 0.16, 0.32].forEach((d) => tone({ f: 260, f2: 130, t: 0.12, v: 0.25, delay: d })); SFX.pickup(); },
  levelUp() { [523, 659, 784, 1046, 1318].forEach((f, i) => tone({ type: 'square', f, t: 0.22, v: 0.09, delay: i * 0.08, q: 3000 })); },
  ko() { tone({ f: 1320, t: 0.6, v: 0.15 }); tone({ f: 1320, t: 0.6, v: 0.15, delay: 0.18 }); tone({ f: 1760, t: 0.9, v: 0.12, delay: 0.36 }); },
  poof(p) { noise({ t: 0.35, v: 0.35 * vol(p), f: 1200, f2: 300, q: 0.7 }); },
  explode(p) {
    const v = vol(p);
    noise({ t: 1.1, v: 0.9 * v, f: 900, f2: 60, type: 'lowpass' });
    tone({ f: 90, f2: 24, t: 1.0, v: 0.8 * v });
    tone({ type: 'square', f: 60, f2: 30, t: 0.4, v: 0.15 * v });
  },
  stomp() {
    tone({ f: 70, f2: 22, t: 1.2, v: 1.0 });
    noise({ t: 0.9, v: 0.7, f: 500, f2: 60, type: 'lowpass' });
    noise({ t: 0.25, v: 0.4, f: 2500, type: 'highpass', delay: 0.02 });
  },
  quack(p) { const v = vol(p); tone({ type: 'sawtooth', f: 620, f2: 380, t: 0.14, v: 0.22 * v, q: 1500 }); tone({ type: 'sawtooth', f: 560, f2: 340, t: 0.12, v: 0.16 * v, q: 1500, delay: 0.1 }); },
  water(p) { noise({ t: 0.9, v: 0.35 * vol(p), f: 600, f2: 2400, q: 0.8 }); },
  note(f, p) { tone({ type: 'triangle', f, t: 0.9, v: 0.14 * vol(p) }); tone({ f: f * 2, t: 0.5, v: 0.04 * vol(p) }); },
  chord(p) { const r = pick([196, 220, 247, 262]); [1, 1.26, 1.5, 2].forEach((m, i) => tone({ type: 'sawtooth', f: r * m, t: 0.9, v: 0.05 * vol(p), q: 2200, delay: i * 0.012 })); },
  fire() { noise({ t: 0.3, v: 0.25, f: 1800, f2: 400, q: 0.6 }); },
  wave() { [220, 277, 330, 440].forEach((f, i) => tone({ type: 'sawtooth', f, t: 0.5, v: 0.07, delay: i * 0.1, q: 1800 })); },
};
function sfx(name, ...args) {
  if (!AU.ctx || AU.muted) return;
  const now = AU.ctx.currentTime;
  if ((AU.last[name] || 0) > now - 0.035) return;
  AU.last[name] = now;
  try { SFX[name](...args); } catch (e) { /* audio is best-effort */ }
}
const MAT_SOUND = { wood: 'wood', glass: 'glass', ceramic: 'ceramic', metal: 'metal', soft: 'soft', electric: 'electric', food: 'splat', paper: 'soft', stone: 'stone' };

// ---------- music: a spooky little polka ----------
const MUS = { step: 0, next: 0 };
const BASS = [45, 0, 52, 0, 45, 0, 52, 0, 50, 0, 57, 0, 52, 0, 47, 0];
const LEAD = [69, 0, 72, 71, 69, 0, 64, 0, 65, 0, 69, 67, 64, 0, 0, 0, 69, 0, 72, 74, 76, 0, 74, 72, 71, 0, 68, 71, 69, 0, 0, 0];
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
function musicTick() {
  const ctx = AU.ctx;
  if (!ctx || AU.muted) { if (ctx) MUS.next = ctx.currentTime + 0.1; return; }
  const spb = 60 / 150 / 2;
  const intense = G.running && !G.paused && G.intermission <= 0 && G.wave > 0;
  while (MUS.next < ctx.currentTime + 0.25) {
    const s = MUS.step, t = MUS.next;
    const b = BASS[s % 16];
    if (b) tone({ type: 'triangle', f: mtof(b), t: spb * 1.7, v: 0.42, at: t, dest: AU.mus });
    if (s % 2 === 1) [57, 60, 64].forEach((m) => tone({ type: 'square', f: mtof(m + (s % 16 > 7 ? 5 : 0)), t: spb * 0.5, v: 0.025, at: t, dest: AU.mus, q: 1600 }));
    if (s % 4 === 0) noiseAt(t, 0.05, 0.12);
    const l = LEAD[s % 32];
    if (l && intense) tone({ type: 'square', f: mtof(l), t: spb * 0.9, v: 0.06, at: t, dest: AU.mus, q: 2600, vib: 5 });
    MUS.next += spb;
    MUS.step++;
  }
}
function noiseAt(t0, t, v) {
  const ctx = AU.ctx, s = ctx.createBufferSource(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
  s.buffer = AU.noise; fl.type = 'highpass'; fl.frequency.value = 6000;
  g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + t);
  s.connect(fl); fl.connect(g); g.connect(AU.mus);
  s.start(t0); s.stop(t0 + t + 0.02);
}
