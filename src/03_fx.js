
// ================= FX: particles, impact stars, comic text =================
const PMAX = 900;
const pMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), PMAX);
pMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
pMesh.frustumCulled = false;
scene.add(pMesh);
const parts = [];
const _dummy = new THREE.Object3D();
const _col = new THREE.Color();
for (let i = 0; i < PMAX; i++) {
  parts.push({ on: false, p: V3(), v: V3(), r: V3(), w: V3(), life: 0, max: 1, size: 0.1, grav: 1, drag: 0 });
  _dummy.scale.setScalar(0); _dummy.updateMatrix();
  pMesh.setMatrixAt(i, _dummy.matrix);
  pMesh.setColorAt(i, _col.set(0xffffff));
}
let pCursor = 0;

function burst(pos, color, n = 12, speed = 6, size = 0.12, o = {}) {
  const cols = Array.isArray(color) ? color : [color];
  for (let i = 0; i < n; i++) {
    const q = parts[pCursor];
    pCursor = (pCursor + 1) % PMAX;
    q.on = true;
    q.p.set(pos.x + rand(-1, 1) * (o.spread || 0.1), pos.y + rand(-1, 1) * (o.spread || 0.1), pos.z + rand(-1, 1) * (o.spread || 0.1));
    _t1.set(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize().multiplyScalar(speed * rand(0.35, 1));
    q.v.copy(_t1);
    q.v.y += o.up ?? speed * 0.4;
    if (o.dir) q.v.addScaledVector(o.dir, speed * 0.6);
    q.r.set(rand(0, 6), rand(0, 6), rand(0, 6));
    q.w.set(rand(-12, 12), rand(-12, 12), rand(-12, 12));
    q.max = q.life = (o.life || 0.9) * rand(0.6, 1.2);
    q.size = size * rand(0.6, 1.4);
    q.grav = o.grav ?? 1;
    q.drag = o.drag ?? 0.5;
    pMesh.setColorAt(pCursor === 0 ? PMAX - 1 : pCursor - 1, _col.set(pick(cols)));
  }
  pMesh.instanceColor.needsUpdate = true;
}
function updateParticles(dt) {
  for (let i = 0; i < PMAX; i++) {
    const q = parts[i];
    if (!q.on) continue;
    q.life -= dt;
    if (q.life <= 0) {
      q.on = false;
      _dummy.scale.setScalar(0); _dummy.updateMatrix();
      pMesh.setMatrixAt(i, _dummy.matrix);
      continue;
    }
    q.v.y -= GRAV * q.grav * dt;
    q.v.multiplyScalar(Math.max(0, 1 - q.drag * dt));
    q.p.addScaledVector(q.v, dt);
    if (q.p.y < 0.02 && q.grav > 0) { q.p.y = 0.02; q.v.y *= -0.35; q.v.x *= 0.6; q.v.z *= 0.6; }
    q.r.addScaledVector(q.w, dt);
    _dummy.position.copy(q.p);
    _dummy.rotation.set(q.r.x, q.r.y, q.r.z);
    _dummy.scale.setScalar(q.size * Math.min(1, (q.life / q.max) * 2.5));
    _dummy.updateMatrix();
    pMesh.setMatrixAt(i, _dummy.matrix);
  }
  pMesh.instanceMatrix.needsUpdate = true;
}

// ---------- comic impact stars ----------
const starShape = new THREE.Shape();
for (let i = 0; i < 20; i++) {
  const a = (i / 20) * Math.PI * 2, r = i % 2 ? 0.42 : 1;
  i ? starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r) : starShape.moveTo(r, 0);
}
const starGeo = new THREE.ShapeGeometry(starShape);
const stars = [];
for (let i = 0; i < 14; i++) {
  const m = new THREE.Mesh(starGeo, new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, depthTest: false, side: THREE.DoubleSide, toneMapped: false }));
  m.renderOrder = 50; m.visible = false; scene.add(m);
  stars.push({ m, t: 1, life: 0.2, size: 1 });
}
let starCursor = 0;
function impactStar(pos, color = 0xffd23f, size = 1) {
  const s = stars[starCursor]; starCursor = (starCursor + 1) % stars.length;
  s.m.position.copy(pos); s.m.material.color.set(color); s.m.rotation.z = rand(0, 6);
  s.t = 0; s.life = 0.18 + size * 0.04; s.size = size; s.m.visible = true;
}
function updateStars(dt) {
  for (const s of stars) {
    if (!s.m.visible) continue;
    s.t += dt;
    const k = s.t / s.life;
    if (k >= 1) { s.m.visible = false; continue; }
    s.m.quaternion.copy(camera.quaternion);
    s.m.rotateZ(k * 0.6);
    s.m.scale.setScalar(s.size * (0.3 + k * 0.9));
    s.m.material.opacity = 0.85 * (1 - k * k);
  }
}

// ---------- DOM comic text ----------
const popLayer = $('pops');
const pops = [];
const POW_WORDS = ['POW!', 'BAM!', 'WHAM!', 'BONK!', 'THWACK!', 'KAPOW!', 'SMACK!', 'WHUMP!', 'OOF!', 'CRUNCH!', 'BOFF!', 'KRAK!', 'THOOM!', 'ZONK!'];
const POP_COLORS = ['#ffd23f', '#ffffff', '#ff6b5e', '#8fe36b', '#b994ff', '#6ee7ff'];
const _proj = new THREE.Vector3();
function project(pos) {
  _proj.copy(pos).project(camera);
  if (_proj.z > 1) return null;
  return { x: (_proj.x * 0.5 + 0.5) * innerWidth, y: (-_proj.y * 0.5 + 0.5) * innerHeight };
}
function pop(pos, text, o = {}) {
  const el = document.createElement('div');
  el.className = 'pop';
  el.textContent = text;
  el.style.setProperty('--c', o.color || pick(POP_COLORS));
  el.style.setProperty('--s', (o.size || 46) + 'px');
  el.style.setProperty('--life', (o.life || 0.9) + 's');
  popLayer.appendChild(el);
  pops.push({ el, pos: pos.clone(), t: 0, life: o.life || 0.9, rot: o.rot ?? rand(-16, 16), rise: o.rise ?? 1.1, follow: null });
  while (pops.length > 26) pops.shift().el.remove();
}
function bubble(ent, text) {
  if (!ent) return;
  if (ent.bubbleEl) {
    ent.bubbleEl.el.remove();
    const i = pops.indexOf(ent.bubbleEl);
    if (i >= 0) pops.splice(i, 1);
  }
  const el = document.createElement('div');
  el.className = 'bubble';
  el.textContent = text;
  popLayer.appendChild(el);
  const b = { el, pos: V3(), t: 0, life: 1.9, rot: 0, rise: 0, follow: ent, bubble: true };
  ent.bubbleEl = b;
  pops.push(b);
}
function updatePops(dt) {
  for (let i = pops.length - 1; i >= 0; i--) {
    const q = pops[i];
    q.t += dt;
    if (q.follow) {
      const bp = q.follow.body.position;
      q.pos.set(bp.x, bp.y + (q.follow.height || 1.7) * 0.5 + 0.55, bp.z);
    }
    if (q.t > q.life) {
      q.el.remove(); pops.splice(i, 1);
      if (q.follow && q.follow.bubbleEl === q) q.follow.bubbleEl = null;
      continue;
    }
    _t3.copy(q.pos); _t3.y += q.rise * q.t;
    const s = project(_t3);
    if (!s) { q.el.style.visibility = 'hidden'; continue; }
    q.el.style.visibility = 'visible';
    q.el.style.transform = q.bubble
      ? `translate(${s.x}px,${s.y}px) translate(-50%,-100%)`
      : `translate(${s.x}px,${s.y}px) translate(-50%,-50%) rotate(${q.rot}deg)`;
  }
}

// ---------- HUD messages ----------
function toast(title, sub = '', color = null) {
  const el = document.createElement('div');
  el.className = 'toast';
  if (color) el.style.background = color;
  el.innerHTML = '<b></b><span></span>';
  el.querySelector('b').textContent = title;
  el.querySelector('span').textContent = sub;
  $('toasts').appendChild(el);
  setTimeout(() => el.remove(), 3700);
  const all = $('toasts').children;
  if (all.length > 4) all[0].remove();
}
let quipTimer = 0;
function quip(text) {
  const q = $('quip');
  q.textContent = text;
  q.classList.add('on');
  quipTimer = 2.8;
}
function banner(title, sub) {
  const b = $('banner');
  $('bannerTitle').textContent = title;
  $('bannerSub').textContent = sub;
  b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
}
let hurtLevel = 0;
function hurtFlash(a) { hurtLevel = Math.min(1, hurtLevel + a); }

function updateFX(dt, realDt) {
  updateParticles(dt);
  updateStars(realDt);
  updatePops(realDt);
  if (quipTimer > 0) { quipTimer -= realDt; if (quipTimer <= 0) $('quip').classList.remove('on'); }
  hurtLevel = Math.max(0, hurtLevel - realDt * 1.4);
  const low = player.hp / player.maxHp < 0.3 ? 0.25 + Math.sin(G.time * 6) * 0.1 : 0;
  $('vignette').style.opacity = Math.max(hurtLevel, low).toFixed(3);
}
