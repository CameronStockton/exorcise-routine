
// ================= PLAYER =================
const player = {
  body: null, hp: 150, maxHp: 150, str: 1, spd: 1, arm: 1, def: 0, lvl: 1, xp: 0, xpNext: 40,
  yaw: 0, pitch: 0, held: null, heldKind: null, punchT: 9, punchCD: 0, side: 1, hitPending: null, upper: false,
  swingT: 9, stomp: 0, grounded: false, lastHurtT: -99, jumpCD: 0, bob: 0, kick: 0, chugT: 0,
  buffs: { haste: 0, fire: 0, giant: 0, quack: 0 },
};
const PICKUPS = {
  shake: { label: 'Protein Shake', apply() { player.str += 0.2; return '+2 STR. Your muscles have muscles.'; } },
  espresso: { label: 'Triple Espresso', apply() { player.spd += 0.1; player.buffs.haste = 10; return '+1 SPD and 10 seconds of zoomies.'; } },
  pizza: { label: 'Cold Pizza', apply() { heal(60); return '+60 HP. Breakfast of champions.'; } },
  hotsauce: { label: 'Ghost Pepper Sauce', apply() { player.buffs.fire = 15; return 'FIRE FISTS for 15s. Why would you drink that?'; } },
  spinach: { label: 'Canned Spinach', apply() { player.str += 0.3; player.buffs.giant = 12; return '+3 STR and GIANT FISTS for 12s.'; } },
  garlic: { label: 'Garlic Bread', apply() { player.def = Math.min(0.6, player.def + 0.08); return '+8% DEF. Demons hate this one weird trick.'; } },
  preworkout: { label: 'Pre-Workout', apply() { player.arm += 0.25; return '+2.5 ARM. Your heart is doing a drum solo.'; } },
  milk: { label: 'Whole Milk', apply() { player.maxHp += 25; heal(25); return '+25 MAX HP. Strong bones.'; } },
  duck: { label: 'Rubber Duck', apply() { player.buffs.quack = 25; return 'QUACK MODE for 25s. Also better loot. Do not ask.'; } },
};
const LEVEL_LINES = ['You can now bench-press a minivan.', 'Your biceps have their own zip code.', 'Your shadow started lifting too.', 'Protein levels: critical.', 'You flex. Somewhere, a ghost faints.'];
const HURT_QUIPS = ['Rude!', "That's coming out of your security deposit.", 'Did you just bite me?!', 'Personal space, please.', 'Okay, now I am mad.', 'Ow! Wipe your feet first!'];
const keys = {};
let mouseL = false, locked = false, lookFallback = false;

function heal(n) { player.hp = Math.min(player.maxHp, player.hp + n); }

// ---------- input ----------
addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'Space' || e.code === 'Tab') e.preventDefault();
  if (!G.running || G.over) return;
  if (e.code === 'Escape' || e.code === 'KeyP') { if (!locked) pauseGame(!G.paused); return; }
  if (G.paused) return;
  if (e.code === 'KeyE' && !e.repeat) tryGrab();
  if (e.code === 'KeyQ' && !e.repeat) superStomp();
  if (e.code === 'KeyM' && !e.repeat) toggleMute();
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; mouseL = false; if (G.running && !G.over) pauseGame(true); });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('mousedown', (e) => {
  if (!G.running || G.paused || G.over) return;
  if (!locked && !lookFallback) requestLock();
  if (e.button === 0) { mouseL = true; primary(); }
  if (e.button === 2) secondary();
});
addEventListener('mouseup', (e) => { if (e.button === 0) mouseL = false; });
addEventListener('mousemove', (e) => {
  if (!G.running || G.paused || G.over) return;
  if (locked || lookFallback) {
    player.yaw -= e.movementX * 0.0022;
    player.pitch = clamp(player.pitch - e.movementY * 0.0022, -1.45, 1.45);
  }
});
let lockWorked = false;
document.addEventListener('pointerlockchange', () => {
  const was = locked;
  locked = document.pointerLockElement === canvas;
  if (locked) lockWorked = true;
  if (was && !locked && G.running && !G.over) pauseGame(true);
});
// if pointer lock never works here (some embedded views), fall back to free mouse look
const lockFailed = () => { if (!lockWorked) lookFallback = true; };
document.addEventListener('pointerlockerror', lockFailed);
function requestLock() {
  try {
    const r = canvas.requestPointerLock();
    if (r && r.catch) r.catch(lockFailed);
  } catch (err) { lockFailed(); }
}

// ---------- body + view model ----------
function initPlayer() {
  const b = new CANNON.Body({ mass: 80, material: PM.player, fixedRotation: true, linearDamping: 0, allowSleep: false, collisionFilterGroup: GROUP.PLAYER, collisionFilterMask: MASK.PLAYER });
  b.addShape(new CANNON.Sphere(0.38), new CANNON.Vec3(0, -0.5, 0));
  b.addShape(new CANNON.Sphere(0.38), new CANNON.Vec3(0, 0.25, 0));
  placeBody(b, -4.5, 0.9, 5.2);
  b.kind = 'player';
  b.ent = player;
  b.addEventListener('collide', onPlayerCollide);
  world.addBody(b);
  player.body = b;
  player.yaw = 0.6;
}
const rig = new THREE.Group();
camera.add(rig);
const holder = new THREE.Group();
camera.add(holder);
const gloveMats = [];
function makeFist(side) {
  const g = new THREE.Group();
  const glove = toon(0x9e1414, null, true), cuff = toon(0x9c9488, null, true), skin = toon(0x8a5a32, null, true);
  gloveMats.push(glove);
  for (const m of [glove, cuff, skin]) m.depthTest = false;
  const fore = mkMesh(geo('c', 0.075, 0.5, 0.095), skin, false); fore.rotation.x = PI2; fore.position.z = 0.33; fore.renderOrder = 997;
  const cf = mkMesh(geo('c', 0.1, 0.1, 0.1), cuff, false); cf.rotation.x = PI2; cf.position.z = 0.11; cf.renderOrder = 998;
  const gl = mkMesh(geo('s', 0.125), glove, false); gl.scale.set(1, 0.9, 1.15); gl.renderOrder = 999;
  const th = mkMesh(geo('s', 0.05), glove, false); th.position.set(-side * 0.1, 0.03, -0.02); th.renderOrder = 999;
  g.add(fore, cf, gl, th);
  rig.add(g);
  return g;
}
const fistR = makeFist(1), fistL = makeFist(-1);
const REST_R = V3(0.3, -0.3, -0.55), REST_L = V3(-0.3, -0.3, -0.55);
const _fT = V3();

function animFists(dt) {
  const b = player.body;
  const mv = player.grounded ? Math.min(1, Math.hypot(b.velocity.x, b.velocity.z) / 6) : 0;
  const bob = Math.sin(player.bob * 2) * 0.02 * mv, sway = Math.cos(player.bob) * 0.02 * mv;
  const giant = player.buffs.giant > 0;
  rig.scale.setScalar(damp(rig.scale.x, giant ? 1.6 : 0.82, 8, dt));
  for (const [f, rest, side] of [[fistR, REST_R, 1], [fistL, REST_L, -1]]) {
    _fT.copy(rest); _fT.y += bob; _fT.x += sway;
    if (player.held) { _fT.set(side * 0.3, -0.18 + (player.heldKind === 'enemy' || holder.userData.big ? 0.35 : 0), -0.65); }
    f.rotation.set(0, 0, 0);
    if (!player.held && player.side === side && player.punchT < 0.26) {
      const k = player.punchT;
      const out = k < 0.07 ? k / 0.07 : Math.max(0, 1 - (k - 0.07) / 0.19);
      const e = 1 - Math.pow(1 - out, 3);
      if (player.upper) { _fT.lerp(V3(side * 0.06, 0.12, -0.85), e); f.rotation.x = e * 0.9; }
      else _fT.lerp(V3(side * 0.07, -0.1, -1.05), e);
      f.position.copy(_fT);
    } else f.position.lerp(_fT, 1 - Math.exp(-18 * dt));
    if (player.chugT > 0 && side === 1) { f.position.set(0.1, -0.05, -0.4); f.rotation.x = 0.8; }
  }
  for (const m of gloveMats) m.emissive.setRGB(player.buffs.fire > 0 ? 0.9 : 0, player.buffs.fire > 0 ? 0.3 : 0, 0);
  if (player.buffs.fire > 0 && Math.random() < 0.8) {
    for (const f of [fistR, fistL]) burst(f.getWorldPosition(_t3), [0xff7a00, 0xffd23f, 0xff3b1f], 1, 1.5, 0.05, { grav: -0.3, life: 0.35 });
  }
  // held item swing
  if (player.held) {
    const k = player.swingT;
    if (k < 0.32) {
      const s = Math.sin((k / 0.32) * Math.PI);
      if (holder.userData.big) holder.rotation.set(-s * 0.9, 0, 0);
      else holder.rotation.set(-s * 0.5, s * 1.4, -s * 0.4);
    } else holder.rotation.set(0, 0, 0);
    if (player.heldKind === 'enemy') {
      const e = player.held;
      e.mesh.rotation.set(0, 0, PI2 + Math.sin(G.time * 18) * 0.12);
    }
  }
}

// ---------- actions ----------
function primary() {
  if (player.punchCD > 0) return;
  if (player.held) { useHeld(); return; }
  player.punchCD = 0.2 / (0.85 + player.spd * 0.15);
  player.punchT = 0; player.side *= -1; player.upper = false; player.hitPending = 'punch';
  sfx('whoosh');
}
function secondary() {
  if (player.held) { throwHeld(); return; }
  if (player.punchCD > 0) return;
  player.punchCD = 0.7;
  player.punchT = 0; player.upper = true; player.hitPending = 'upper';
  sfx('whoosh');
}
function useHeld() {
  const h = player.held;
  if (player.heldKind === 'prop' && h.def.pickup) { consume(h); return; }
  player.punchCD = player.heldKind === 'enemy' ? 0.5 : clamp(0.3 + h.def.mass * 0.006, 0.3, 0.85);
  player.swingT = 0; player.hitPending = 'swing';
  sfx('whoosh');
}
function consume(p) {
  const P = PICKUPS[p.def.pickup];
  const msg = P.apply();
  toast(P.label, msg, '#ffe9a8');
  sfx('gulp');
  burst(holder.getWorldPosition(_t3), [0xffd23f, 0xffffff, 0x8fe36b], 16, 3, 0.06, { grav: 0.2 });
  p.alive = false;
  holder.remove(p.mesh);
  props.delete(p); synced.delete(p);
  player.held = null; player.heldKind = null;
  player.chugT = 0.35; player.punchCD = 0.35;
}

const _mo = V3(), _mf = V3(), _mt = V3();
function resolveMelee(kind) {
  const o = camera.getWorldPosition(_mo), f = camera.getWorldDirection(_mf);
  let reach = 2.5, cone = 0.55, dmg = 22 * player.str, knock = 15 * (0.7 + player.str * 0.3), up = 5, word = null, sound = 'punch';
  const h = player.held;
  if (kind === 'upper') { dmg *= 1.7; knock *= 0.55; up = 17; word = 'UPPERCUT!'; }
  if (kind === 'swing' && h) {
    cone = 0.42;
    if (player.heldKind === 'enemy') { reach = 3 + h.s * 0.5; dmg = (26 + h.def.mass * 0.15) * player.str; knock = 17; word = pick(['ZOMBIE BAT!', 'BODY SLAM!', 'FRIENDLY FIRE!', 'HUMAN… ER, GHOST CLUB!']); }
    else if (h.def.weapon) { const w = h.def.weapon; reach = w.reach; dmg = w.dmg * player.str; knock = 15 * w.knock; word = w.word; sound = w.sound; }
    else { const m = h.def.mass; reach = 2.3 + h.radius * 0.9; dmg = (12 + Math.min(m, 120) * 0.9) * player.str; knock = 13 + Math.min(m, 100) * 0.08; sound = MAT_SOUND[h.def.mat] || 'wood'; }
  }
  if (player.buffs.giant > 0) { reach += 1.4; cone -= 0.18; dmg *= 1.4; knock *= 1.3; }
  const fire = player.buffs.fire > 0;
  if (fire) dmg *= 1.4;
  let hits = 0, kills = 0, best = null;
  for (const e of enemies) {
    if (e.state === 'held' || e.state === 'spawn' || e === h) continue;
    const c = e.body.position;
    _mt.set(c.x - o.x, c.y - o.y, c.z - o.z);
    const d = _mt.length();
    if (d > reach + e.radius) continue;
    _mt.normalize();
    if (_mt.dot(f) < cone && d > e.radius + 0.6) continue;
    if (wallBetween(o, c)) continue;
    const vel = V3(f.x * knock, Math.max(f.y * knock, 0) + up, f.z * knock);
    if (hitEnemy(e, dmg * rand(0.9, 1.15), vel, { fire })) kills++;
    hits++;
    const hp = V3(c.x, c.y + 0.3, c.z).addScaledVector(_mt, -e.radius);
    impactStar(hp, fire ? 0xff7a00 : 0xffd23f, 0.5 + (kind === 'upper' ? 0.25 : 0));
    burst(hp, e.def.ecto, 10, 6, 0.08);
    if (!best) best = hp;
  }
  for (const p of props) {
    if (!p.alive || !p.body.world || p === h) continue;
    _mt.copy(p.body.position).sub(o);
    const d = _mt.length() - p.radius * 0.8;
    if (d > reach) continue;
    _mt.normalize();
    if (_mt.dot(f) < cone - 0.1 && d > 0.5) continue;
    if (wallBetween(o, p.body.position)) continue;
    const b = p.body;
    if (!p.def.static) {
      const dv = (knock * 1.25) / (1 + p.def.mass / 25);
      b.wakeUp();
      b.velocity.x += f.x * dv; b.velocity.y += Math.max(0, f.y * dv) + up * 0.35 + 2; b.velocity.z += f.z * dv;
      b.angularVelocity.set(rand(-8, 8), rand(-8, 8), rand(-8, 8));
      p.thrownT = 0.8;
    }
    damageProp(p, dmg * MAT_FRAG[p.def.mat] * 0.8, f);
    hits++;
    if (!best) best = V3().copy(b.position);
  }
  if (hits) {
    hitStop(0.045 + Math.min(hits, 5) * 0.012 + (kind === 'upper' ? 0.04 : 0));
    shake(0.18 + Math.min(hits, 4) * 0.06 + (kind === 'upper' ? 0.15 : 0));
    player.kick = kind === 'upper' ? 6 : 3;
    if (player.buffs.quack > 0) sfx('quack', best);
    else if (sound === 'punch') sfx('punch', best, 1 + hits * 0.1);
    else sfx(sound, best);
    if (fire) sfx('fire');
    const txt = player.buffs.quack > 0 ? 'QUACK!' : word || (fire ? pick(['SIZZLE!', 'TOASTY!', 'FLAMBÉ!']) : pick(POW_WORDS));
    pop(best, txt, { size: clamp(40 + hits * 6 + (kills ? 12 : 0), 40, 84), color: fire ? '#ff7a00' : undefined });
    registerHit(hits);
    if (kind === 'swing' && h) {
      if (player.heldKind === 'enemy') {
        h.hp -= 12; h.flashT = 0.15; h.squash = 0.25;
        if (h.hp <= 0 && h.state !== 'dead') { killEnemy(h); player.held = null; player.heldKind = null; holder.remove(h.mesh); scene.add(h.mesh); h.mesh.position.copy(holder.getWorldPosition(_t3)); despawn(h); }
      } else if (h.def.hp < 9999) {
        damageProp(h, dmg * 0.22 * MAT_FRAG[h.def.mat]);
        if (!h.alive) pop(holder.getWorldPosition(_t3), 'IT BROKE!', { color: '#ffffff', size: 36 });
      }
    }
  } else {
    const w = wallBetween(o, _mt.copy(o).addScaledVector(f, reach * 0.8));
    if (w) {
      const hp = V3(w.hitPointWorld.x, w.hitPointWorld.y, w.hitPointWorld.z);
      burst(hp, [0xb6a2c8, 0xe8dcc8], 8, 3, 0.06);
      impactStar(hp, 0xffffff, 0.6);
      sfx('thud', hp);
      shake(0.08);
    }
  }
}

// ---------- grab / throw ----------
const _lo = V3(), _lf = V3(), _lt = V3();
function lookTarget() {
  const o = camera.getWorldPosition(_lo), f = camera.getWorldDirection(_lf);
  let best = null, bs = -1e9;
  for (const p of props) {
    if (!p.alive || p.def.static || !p.body.world) continue;
    _lt.copy(p.body.position).sub(o);
    const d = _lt.length();
    if (d - p.radius > 2.8) continue;
    const dot = _lt.normalize().dot(f);
    if (dot < (d < 1.3 ? 0.5 : 0.88 - Math.min(0.25, p.radius * 0.18))) continue;
    const s = dot * 3 - d * 0.5 + (p.def.pickup ? 0.5 : 0) + (p.def.weapon ? 0.3 : 0);
    if (s > bs) { bs = s; best = { kind: 'prop', p, pos: p.body.position }; }
  }
  for (const e of enemies) {
    if (e.state === 'held' || e.state === 'spawn') continue;
    _lt.copy(e.body.position).sub(o);
    const d = _lt.length();
    if (d - e.radius > 2.6) continue;
    const dot = _lt.normalize().dot(f);
    if (dot < 0.8) continue;
    const s = dot * 3 - d * 0.5 + 0.3;
    if (s > bs) { bs = s; best = { kind: 'enemy', e, pos: e.body.position }; }
  }
  if (best && wallBetween(o, best.pos)) return null;
  return best;
}
function setHoldPose(size, isEnemy) {
  const big = isEnemy || Math.max(...size) > 1.25;
  holder.userData.big = big;
  if (isEnemy) holder.position.set(0, 0.75, -1.35);
  else if (big) holder.position.set(0, 0.45 + size[1] * 0.3, -1.05 - Math.max(size[0], size[2]) * 0.45);
  else holder.position.set(0.32, -0.26, -0.62 - Math.max(...size) * 0.22);
  holder.rotation.set(0, 0, 0);
}
function tryGrab() {
  if (player.held) { dropHeld(); return; }
  const t = lookTarget();
  if (!t) return;
  if (t.kind === 'prop') {
    const p = t.p;
    if (p.body.world) world.removeBody(p.body);
    synced.delete(p);
    if (p.mesh.parent) p.mesh.parent.remove(p.mesh);
    holder.add(p.mesh);
    p.mesh.position.set(0, 0, 0);
    p.mesh.quaternion.identity();
    player.held = p; player.heldKind = 'prop';
    setHoldPose(p.def.size, false);
    sfx('thud');
    if (p.def.mass >= 80) { pop(holder.getWorldPosition(_t3), pick(['HNNNGH!', 'LIGHTWEIGHT!', 'EASY.']), { color: '#ffffff', size: 44 }); if (Math.random() < 0.5) quip(pick(['Lift with your legs.', "It's a warm-up set.", 'Feels like a cardio day.'])); }
  } else {
    const e = t.e;
    grabEnemyBody(e);
    holder.add(e.mesh);
    player.held = e; player.heldKind = 'enemy';
    setHoldPose(null, true);
    pop(holder.getWorldPosition(_t3), pick(['GOTCHA!', 'UP YOU GO!', 'BEAR HUG!']), { size: 44 });
    sfx('boing');
  }
}
function heldMass() { return player.heldKind === 'enemy' ? player.held.body.mass : player.held.def.mass; }
function releasePoint() {
  const o = camera.getWorldPosition(_lo), f = camera.getWorldDirection(_lf);
  const pos = holder.getWorldPosition(V3());
  const r = player.heldKind === 'enemy' ? player.held.radius + 0.2 : player.held.radius;
  const w = wallBetween(o, V3().copy(pos).addScaledVector(f, r));
  if (w) pos.set(w.hitPointWorld.x, w.hitPointWorld.y, w.hitPointWorld.z).addScaledVector(f, -(r + 0.15));
  pos.y = Math.max(pos.y, 0.3);
  return pos;
}
function releaseHeld(vel) {
  const h = player.held, pos = releasePoint();
  if (player.heldKind === 'enemy') {
    holder.remove(h.mesh);
    releaseEnemyBody(h, pos, vel);
  } else {
    holder.remove(h.mesh);
    scene.add(h.mesh);
    placeBody(h.body, pos.x, pos.y, pos.z);
    setBodyYaw(h.body, player.yaw);
    h.body.velocity.set(vel.x, vel.y, vel.z);
    h.body.angularVelocity.set(rand(-9, 9), rand(-9, 9), rand(-9, 9));
    world.addBody(h.body);
    h.body.wakeUp();
    synced.add(h);
    h.mesh.position.copy(pos);
    h.thrownT = 2;
  }
  player.held = null; player.heldKind = null;
}
function dropHeld() {
  const f = camera.getWorldDirection(_lf), b = player.body.velocity;
  releaseHeld(V3(f.x * 2 + b.x, 1, f.z * 2 + b.z));
}
function throwHeld() {
  const f = camera.getWorldDirection(_lf), b = player.body.velocity, m = heldMass();
  const sp = Math.min(34, (17 + 15 / (1 + m / 25)) * (0.75 + player.arm * 0.25));
  const big = m > 60 || player.heldKind === 'enemy';
  const at = holder.getWorldPosition(V3());
  releaseHeld(V3(f.x * sp + b.x * 0.5, f.y * sp + 2.5, f.z * sp + b.z * 0.5));
  sfx('yeet');
  if (big || Math.random() < 0.3) pop(at.addScaledVector(f, 1.2), pick(['YEET!', 'YEET!', 'FORE!', 'CATCH!', 'BYE!']), { size: big ? 60 : 42, color: '#8fe36b' });
  player.punchCD = 0.3;
  player.kick = 4;
  shake(big ? 0.2 : 0.06);
}

function superStomp() {
  if (player.stomp < 100) { if (player.stomp < 100) toast('Stomp not ready', 'Land more hits to fill the meter.'); return; }
  player.stomp = 0;
  const p = player.body.position;
  blast(V3(p.x, p.y - 0.8, p.z), 9.5, 1.5, 70, 'stomp');
  player.body.velocity.y = 6;
  slowMo(0.25, 0.8);
  pop(V3(p.x, p.y + 0.5, p.z).addScaledVector(camera.getWorldDirection(_lf), 2.5), 'EARTH-SHATTERING STOMP!', { size: 58, color: '#ffd23f', life: 1.4, rise: 0.4 });
  quip(pick(['Leg day pays off.', 'Never skip leg day.', 'That one was for my landlord.', 'Ground: pounded.']));
}

// ---------- damage + progression ----------
function hurtPlayer(dmg, from, src) {
  if (G.over || !G.running) return;
  dmg *= 1 - player.def;
  player.hp -= dmg;
  player.lastHurtT = G.time;
  hurtFlash(Math.min(0.9, dmg / 16));
  shake(0.25);
  sfx('hurt');
  if (from) {
    _t1.set(player.body.position.x - from.x, 0, player.body.position.z - from.z).normalize();
    player.body.velocity.x += _t1.x * 6; player.body.velocity.z += _t1.z * 6; player.body.velocity.y += 2;
  }
  if (Math.random() < 0.22) quip(pick(HURT_QUIPS));
  if (player.hp <= 0) { player.hp = 0; gameOver(); }
}
function onPlayerCollide(ev) {
  const ob = ev.body, o = ob.ent;
  if (ob.kind === 'prop' && o && o.hostileT > 0) {
    const v = Math.abs(ev.contact.getImpactVelocityAlongNormal());
    if (v > 5) {
      o.hostileT = 0;
      afterStep(() => { hurtPlayer(clamp(4 + o.def.mass * 0.4, 4, 14), ob.position); pop(V3().copy(ob.position), 'OUCH!', { color: '#ff4a3d', size: 34 }); });
    }
  }
}
function gainXP(n) {
  player.xp += n;
  while (player.xp >= player.xpNext) {
    player.xp -= player.xpNext;
    player.lvl++;
    player.xpNext = Math.round(player.xpNext * 1.35 + 10);
    player.str += 0.1; player.spd += 0.03; player.maxHp += 10;
    heal(30);
    sfx('levelUp');
    toast('Level ' + player.lvl, pick(LEVEL_LINES) + ' +1 STR, +10 MAX HP.', '#ffd23f');
    burst(V3().copy(player.body.position), [0xffd23f, 0xffffff], 30, 6, 0.08, { grav: -0.2, drag: 2 });
  }
}
function registerHit(n = 1) {
  G.combo += n;
  G.comboT = 2.6;
  if (G.combo > G.bestCombo) G.bestCombo = G.combo;
  player.stomp = Math.min(100, player.stomp + 5 * n);
}

// ---------- per-frame ----------
const _gf = new CANNON.Vec3(), _gt = new CANNON.Vec3(), _gr = new CANNON.RaycastResult();
function updatePlayer(dt) {
  const b = player.body;
  _gf.set(b.position.x, b.position.y - 0.5, b.position.z);
  _gt.set(b.position.x, b.position.y - 1.02, b.position.z);
  _gr.reset();
  world.raycastClosest(_gf, _gt, { collisionFilterMask: GROUP.STATIC | GROUP.FLOOR | GROUP.PROP | GROUP.ENEMY, skipBackfaces: true }, _gr);
  player.grounded = _gr.hasHit && b.velocity.y < 3;
  const fw = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
  const st = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  const s = Math.sin(player.yaw), c = Math.cos(player.yaw);
  let wx = -s * fw + c * st, wz = -c * fw - s * st;
  const wl = Math.hypot(wx, wz);
  if (wl > 0) { wx /= wl; wz /= wl; }
  const sprint = keys.ShiftLeft || keys.ShiftRight;
  const carry = player.held ? 1 / (1 + heldMass() / 500) : 1;
  const speed = 6.2 * player.spd * (sprint ? 1.5 : 1) * (player.buffs.haste > 0 ? 1.45 : 1) * carry;
  const k = player.grounded ? 12 : 2.5;
  b.velocity.x = damp(b.velocity.x, wx * speed, k, dt);
  b.velocity.z = damp(b.velocity.z, wz * speed, k, dt);
  if (player.jumpCD > 0) player.jumpCD -= dt;
  if (keys.Space && player.grounded && player.jumpCD <= 0) { b.velocity.y = 8.6; player.jumpCD = 0.3; }
  if (player.punchCD > 0) player.punchCD -= dt;
  player.punchT += dt;
  player.swingT += dt;
  if (player.chugT > 0) player.chugT -= dt;
  if (player.hitPending && ((player.hitPending === 'swing' && player.swingT >= 0.12) || (player.hitPending !== 'swing' && player.punchT >= 0.055))) {
    const kind = player.hitPending;
    player.hitPending = null;
    resolveMelee(kind);
  }
  if (mouseL && !player.held) primary();
  for (const key in player.buffs) if (player.buffs[key] > 0) player.buffs[key] -= dt;
  if (G.time - player.lastHurtT > 5 && player.hp < player.maxHp) heal(3 * dt);
  if (b.position.y < -6) { placeBody(b, -4.5, 1.5, 5.2); b.velocity.set(0, 0, 0); }
  animFists(dt);
}
function updateCamera(dt) {
  const b = player.body, ip = b.interpolatedPosition;
  const mv = player.grounded ? Math.min(1, Math.hypot(b.velocity.x, b.velocity.z) / 6) : 0;
  if (mv > 0.1) player.bob += dt * (5 + mv * 6);
  const tr = G.trauma * G.trauma;
  camera.position.set(ip.x + rand(-1, 1) * tr * 0.12, ip.y + 0.62 + Math.abs(Math.sin(player.bob)) * 0.05 * mv + rand(-1, 1) * tr * 0.12, ip.z + rand(-1, 1) * tr * 0.12);
  camera.rotation.set(player.pitch + rand(-1, 1) * tr * 0.04, player.yaw + rand(-1, 1) * tr * 0.04, rand(-1, 1) * tr * 0.07);
  G.trauma = Math.max(0, G.trauma - dt * 1.7);
  player.kick = damp(player.kick, 0, 9, dt);
  const sprint = (keys.ShiftLeft || keys.ShiftRight) && mv > 0.5;
  const target = 75 + (sprint ? 6 : 0) + (player.buffs.haste > 0 ? 4 : 0) + player.kick;
  if (Math.abs(camera.fov - target) > 0.05) { camera.fov = damp(camera.fov, target, 10, dt); camera.updateProjectionMatrix(); }
}
