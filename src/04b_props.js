
// ================= PROP SYSTEM: spawn, damage, break, debris =================
const props = new Set();
const debris = [];
const DEBRIS_MAX = 150;
const geysers = [];
const brokenSpawns = [];
const MAT_FRAG = { wood: 1, glass: 4, ceramic: 3, metal: 0.45, soft: 0.5, electric: 1.4, food: 2.5, paper: 1.5, stone: 0.8 };
const LOOT = ['pizza', 'pizza', 'shake', 'shake', 'espresso', 'espresso', 'garlic', 'milk', 'preworkout', 'hotsauce', 'spinach', 'duck'];
const ringGeo = new THREE.TorusGeometry(0.26, 0.018, 6, 28);
const ringMat = new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.85, toneMapped: false });

function buildParts(parts, tint) {
  const inner = new THREE.Group();
  const colors = [];
  for (const [k, d, p, col0, o = {}] of parts) {
    const col = col0 === 'T' ? tint : col0;
    const params = {};
    if (o.e !== undefined) { params.emissive = o.e; params.emissiveIntensity = o.ei ?? 1; }
    if (o.o !== undefined) { params.transparent = true; params.opacity = o.o; params.depthWrite = false; }
    const pr = Object.keys(params).length ? params : null;
    let m;
    if (k === 'b') m = boxMesh(d[0], d[1], d[2], col, pr);
    else if (k === 'c') m = cylMesh(d[0], d[1], d[2], col, pr, false, d[3]);
    else m = sphMesh(d[0], col, pr);
    m.position.set(p[0], p[1], p[2]);
    if (o.rx || o.ry || o.rz) m.rotation.set(o.rx || 0, o.ry || 0, o.rz || 0);
    if (o.sx || o.sy || o.sz) m.scale.set(o.sx || 1, o.sy || 1, o.sz || 1);
    if (o.o !== undefined) m.castShadow = false;
    inner.add(m);
    if (o.o === undefined) colors.push(col);
  }
  return { inner, colors: colors.length ? colors : [0xa8dcff] };
}

// lamp lights are pooled so the light count never changes (avoids shader recompiles)
const lightPool = [];
function takeLight(L0) {
  const L = lightPool.pop() || new THREE.PointLight(0xffffff, 0, 1, 2);
  L.color.set(L0.c); L.intensity = L0.i; L.distance = L0.d;
  return L;
}
function freeLight(L) {
  if (L.parent) L.parent.remove(L);
  L.intensity = 0;
  scene.add(L);
  lightPool.push(L);
}

function spawnProp(type, x, z, r = 0, y = null, opt = {}) {
  const d = PROP_DEFS[type];
  const [w, h, dd] = d.size;
  const tint = opt.tint ?? (type === 'book' ? pick(BOOK_TINTS) : type === 'ball' ? pick(BALL_TINTS) : 0xffffff);
  const { inner, colors } = buildParts(d.parts, tint);
  const mesh = new THREE.Group();
  mesh.add(inner);
  scene.add(mesh);
  const isStatic = !!d.static;
  const body = new CANNON.Body({
    mass: isStatic ? 0 : d.mass,
    type: isStatic ? CANNON.Body.STATIC : CANNON.Body.DYNAMIC,
    material: d.bouncy ? PM.bouncy : PM.def,
    collisionFilterGroup: isStatic ? GROUP.STATIC : GROUP.PROP,
    collisionFilterMask: isStatic ? MASK.STATIC : MASK.PROP,
    linearDamping: 0.04, angularDamping: 0.12,
  });
  if (d.shape === 'sphere') body.addShape(new CANNON.Sphere(w / 2));
  else body.addShape(new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, dd / 2)));
  body.sleepSpeedLimit = 0.25;
  body.sleepTimeLimit = 0.6;
  const yaw = r * PI2;
  placeBody(body, x, y ?? h / 2 + 0.003, z);
  setBodyYaw(body, yaw);
  body.kind = 'prop';
  const p = {
    type, def: d, body, mesh, inner, colors, hp: d.hp, alive: true, wobble: 0, thrownT: 0, hostileT: 0, lastHitT: -1,
    radius: Math.max(w, h, dd) / 2, light: null, spawn: { type, x, z, r, y, opt }, seed: Math.random() * 10, flopT: d.flop ? 25 : 0,
  };
  body.ent = p;
  body.addEventListener('collide', onPropCollide);
  world.addBody(body);
  if (!isStatic && opt.awake !== true) body.sleep();
  mesh.position.copy(body.position);
  mesh.quaternion.copy(body.quaternion);
  if (!isStatic) synced.add(p);
  props.add(p);
  if (d.light) {
    p.light = takeLight(d.light);
    p.light.position.set(0, d.light.y, 0);
    mesh.add(p.light);
  }
  if (d.pickup) {
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.scale.setScalar(Math.max(w, dd) * 2.4 + 0.3);
    mesh.add(ring);
    p.ring = ring;
  }
  return p;
}

function spawnPickup(kind, pos, pop = true) {
  const p = spawnProp('pk_' + kind, pos.x, pos.z, 0, Math.max(0.3, pos.y), { awake: true });
  if (pop) {
    p.body.wakeUp();
    p.body.velocity.set(rand(-2, 2), rand(5, 8), rand(-2, 2));
    p.body.angularVelocity.set(rand(-5, 5), rand(-5, 5), rand(-5, 5));
  }
  return p;
}

function onPropCollide(ev) {
  const self = ev.target.ent;
  if (!self || !self.alive) return;
  const ob = ev.body, o = ob.ent;
  const v = Math.abs(ev.contact.getImpactVelocityAlongNormal());
  if (self.def.static) {
    if (ob.kind === 'enemy' && o && o.state !== 'held') { afterStep(() => breakProp(self, null)); return; }
    if (ob.kind === 'prop' && v > 6) { const dmg = (v - 5) * Math.sqrt(ob.mass); afterStep(() => damageProp(self, dmg)); }
    return;
  }
  if (v < 4.5) return;
  if (G.time - self.lastHitT < 0.07) return;
  self.lastHitT = G.time;
  const om = ob.mass > 0 ? ob.mass : 150;
  let dmg = (v - 4) * clamp(om / self.def.mass, 0.3, 3) * MAT_FRAG[self.def.mat];
  if (self.thrownT > 0) dmg *= 1.5;
  if (ob.kind === 'enemy') dmg *= 1.6;
  if (ob.kind === 'player') dmg *= 0.5;
  if (v > 8 && self.def.mass > 4) sfx('thud', self.body.position);
  if (self.def.bouncy && v > 5) sfx('ceramic', self.body.position);
  afterStep(() => damageProp(self, dmg));
}

function damageProp(p, dmg, dir = null) {
  if (!p.alive) return;
  p.wobble = 0.28;
  if (p.def.piano) { const n = [262, 294, 330, 349, 392, 440, 494, 523]; sfx('note', pick(n) * pick([0.5, 1, 2]), p.body.position); }
  if (p.def.hp >= 9999) return;
  p.hp -= dmg;
  if (p.hp <= 0) breakProp(p, dir);
}

function propWorldPos(p, out = V3()) {
  if (p.mesh.parent && p.mesh.parent !== scene) return p.mesh.getWorldPosition(out);
  return out.copy(p.body.position);
}

function breakProp(p, dir = null) {
  if (!p.alive) return;
  p.alive = false;
  const d = p.def;
  const pos = propWorldPos(p);
  const vel = V3().copy(p.body.velocity);
  if (player.held === p) { player.held = null; player.heldKind = null; }
  if (p.body.world) world.removeBody(p.body);
  if (p.mesh.parent) p.mesh.parent.remove(p.mesh);
  if (p.light) { freeLight(p.light); p.light = null; }
  synced.delete(p);
  props.delete(p);

  const [w, h, dd] = d.size;
  const volm = w * h * dd;
  const n = clamp(Math.round(4 + volm * 10), 4, 14);
  const cs = clamp(Math.cbrt(volm) / 2.6, 0.05, 0.45);
  spawnDebris(pos, p.colors, n, cs, vel, dir, d.mat, d.size);
  const fx = d.gore || p.colors;
  burst(pos, fx, d.mat === 'food' ? 30 : 14, d.mat === 'food' ? 8 : 6, d.mat === 'food' ? 0.12 : 0.08, { spread: cs });
  if (d.mat === 'soft' || d.mat === 'paper') burst(pos, [0xffffff, 0xf2efe6], 26, 5, 0.07, { grav: 0.15, drag: 2, life: 1.6 });
  if (d.mat === 'electric') { burst(pos, [0xffee66, 0xffffff, 0x66ddff], 24, 9, 0.05, { life: 0.5 }); impactStar(pos, 0x9fe8ff, 1.4); }
  if (d.mat === 'glass') burst(pos, [0xcff0ff, 0xffffff], 20, 7, 0.05, { life: 0.7 });
  sfx(MAT_SOUND[d.mat] || 'wood', pos);
  if (d.value > 0) {
    G.damage += d.value;
    if (d.value >= 250 || Math.random() < 0.35) pop(pos, money(d.value), { color: '#8fe36b', size: d.value >= 2000 ? 40 : 28, rise: 1.6, life: 1.1 });
  }
  if (d.onBreakText) pop(V3(pos.x, pos.y + 0.6, pos.z), d.onBreakText, { size: 36, color: '#ffffff', life: 1.3 });
  if (d.fridge) { ['pizza', 'milk', pick(LOOT)].forEach((k) => spawnPickup(k, pos)); pop(pos, 'SNACKS!', { color: '#ffd23f' }); }
  if (d.fishtank) {
    burst(pos, [0x3aa0d8, 0x7cd0ff, 0xffffff], 50, 7, 0.09, { life: 1.2 });
    sfx('water', pos);
    for (let i = 0; i < 3; i++) { const f = spawnProp('fish', pos.x + rand(-0.4, 0.4), pos.z + rand(-0.3, 0.3), 0, pos.y + 0.2, { awake: true }); f.body.velocity.set(rand(-2, 2), 4, rand(-2, 2)); }
  }
  if (d.toilet) { geysers.push({ pos: V3(pos.x, 0.3, pos.z), t: 4.5 }); pop(pos, 'FLUSH!', { color: '#6ee7ff', size: 52 }); sfx('water', pos); }
  if (d.piano) [523, 494, 440, 392, 349, 330, 294, 262].forEach((f, i) => setTimeout(() => sfx('note', f, pos), i * 45));
  if (type_is(d, 'arcade')) burst(pos, [0xffd23f, 0xffb000], 30, 7, 0.06, { life: 1.4 });
  if (d.loot && Math.random() < d.loot) spawnPickup(pick(LOOT), pos);
  if (d.explosive) {
    afterStep(() => setTimeout(() => blast(pos, d.mass > 100 ? 9 : 6.5, d.mass > 100 ? 1.6 : 1.1, 55, 'boom'), 60));
  }
  if (!d.noRespawn && !d.static) brokenSpawns.push(p.spawn);
  if (d.static) brokenSpawns.push(p.spawn);
}
function type_is(d, t) { return d === PROP_DEFS[t]; }

const _dq = new CANNON.Quaternion();
function spawnDebris(pos, colors, n, s, vel, dir, mat, size) {
  for (let i = 0; i < n; i++) {
    let sx = s * rand(0.5, 1.2), sy = s * rand(0.5, 1.2), sz = s * rand(0.5, 1.2);
    if (mat === 'glass' || mat === 'paper') sy *= 0.15;
    const mesh = mkMesh(geo('b', 1, 1, 1), toon(pick(colors)), false);
    mesh.scale.set(sx, sy, sz);
    scene.add(mesh);
    const body = new CANNON.Body({ mass: 0.3, material: PM.def, collisionFilterGroup: GROUP.DEBRIS, collisionFilterMask: MASK.DEBRIS, linearDamping: 0.08, angularDamping: 0.1 });
    body.addShape(new CANNON.Box(new CANNON.Vec3(sx / 2, sy / 2, sz / 2)));
    body.sleepSpeedLimit = 0.4;
    placeBody(body, pos.x + rand(-0.5, 0.5) * size[0], Math.max(sy, pos.y + rand(-0.5, 0.5) * size[1]), pos.z + rand(-0.5, 0.5) * size[2]);
    _dq.setFromEuler(rand(0, 6), rand(0, 6), rand(0, 6));
    body.quaternion.copy(_dq);
    body.velocity.set(vel.x * 0.5 + rand(-4, 4), vel.y * 0.4 + rand(2, 6), vel.z * 0.5 + rand(-4, 4));
    if (dir) { body.velocity.x += dir.x * 5; body.velocity.z += dir.z * 5; }
    body.angularVelocity.set(rand(-15, 15), rand(-15, 15), rand(-15, 15));
    body.kind = 'debris';
    world.addBody(body);
    const o = { body, mesh, life: rand(6, 10), s0: mesh.scale.clone() };
    debris.push(o);
    synced.add(o);
  }
  while (debris.length > DEBRIS_MAX) removeDebris(debris.shift());
}
function removeDebris(o) {
  if (o.body.world) world.removeBody(o.body);
  scene.remove(o.mesh);
  synced.delete(o);
}

function updateProps(dt) {
  for (const p of props) {
    if (p.wobble > 0) {
      p.wobble -= dt;
      const k = Math.max(0, p.wobble);
      const s = 1 + Math.sin(k * 55) * k * 0.7;
      p.inner.scale.set(s, 2 - s, s);
    } else if (p.inner.scale.x !== 1) p.inner.scale.set(1, 1, 1);
    if (p.thrownT > 0) p.thrownT -= dt;
    if (p.hostileT > 0) {
      p.hostileT -= dt;
      if (Math.random() < 0.6) burst(p.body.position, [0xb994ff, 0x7b45e0], 1, 1, 0.08, { grav: -0.1, life: 0.5 });
    }
    if (p.def.pickup) {
      p.inner.rotation.y += dt * 2.4;
      p.inner.position.y = Math.sin(G.time * 3 + p.seed) * 0.05 + 0.05;
      if (p.ring) { p.ring.rotation.y += dt * 3; p.ring.rotation.x = Math.sin(G.time * 2 + p.seed) * 0.4; }
    }
    if (p.flopT > 0 && p.body.world) {
      p.flopT -= dt;
      if (p.body.velocity.lengthSquared() < 0.2 && Math.random() < dt * 1.6) {
        p.body.wakeUp();
        p.body.velocity.set(rand(-1.5, 1.5), rand(3, 5), rand(-1.5, 1.5));
        p.body.angularVelocity.set(rand(-12, 12), rand(-12, 12), rand(-12, 12));
        sfx('squelch', p.body.position);
      }
    }
    if (p.body.world && (p.body.position.y < -15 || Math.abs(p.body.position.x) > 80 || Math.abs(p.body.position.z) > 80)) {
      p.alive = false; world.removeBody(p.body); scene.remove(p.mesh); synced.delete(p); props.delete(p);
      if (p.light) freeLight(p.light);
    }
  }
  for (let i = debris.length - 1; i >= 0; i--) {
    const o = debris[i];
    o.life -= dt;
    if (o.life < 1) o.mesh.scale.copy(o.s0).multiplyScalar(Math.max(0.01, o.life));
    if (o.life <= 0) { removeDebris(o); debris.splice(i, 1); }
  }
  for (let i = geysers.length - 1; i >= 0; i--) {
    const g = geysers[i];
    g.t -= dt;
    burst(g.pos, [0x6ec8ff, 0xbfe9ff, 0xffffff], 3, 2, 0.1, { up: 11, life: 1.1, spread: 0.15 });
    if (g.t <= 0) geysers.splice(i, 1);
  }
}

function respawnFurniture() {
  let n = 0;
  for (const s of brokenSpawns.splice(0)) {
    if (player.body && Math.hypot(player.body.position.x - s.x, player.body.position.z - s.z) < 1.8) { brokenSpawns.push(s); continue; }
    const p = spawnProp(s.type, s.x, s.z, s.r, s.y, s.opt);
    if (s.portal) s.portal.glass = p;
    p.spawn.portal = s.portal;
    burst(p.body.position, [0xffffff, 0xffd23f], 6, 3, 0.06, { grav: 0.2 });
    n++;
  }
  return n;
}
