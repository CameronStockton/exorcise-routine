
// ================= ENEMIES =================
const enemies = new Set();
const LINES = {
  zombie: {
    spawn: ['Braaains…', 'Is this the open house?', 'I smell protein…', 'Knock knock. I am dead.', 'Nice drapes. BRAINS.'],
    hit: ['MY SPLEEN!', 'I just got reassembled!', 'Not the face!', 'Ow, my everything', "That's my good arm!", 'BRAINS? No. PAIN.', 'I bruise like a peach!'],
    die: ['Back to the dirt nap', 'Tell my worms I love them', 'x_x', 'Finally… rest', 'Worth it.'],
  },
  ghost: {
    spawn: ['Boooo!', 'OooOOooo, nice house', 'I used to live here!', 'Spooky time!'],
    hit: ["I'm already dead, why does this HURT?!", 'BOO-HOO!', "You can't punch a ghost! …Ow.", 'My ectoplasm!', 'This sheet was clean!'],
    die: ['Back to the afterlife… again', "I'm telling the other ghosts", 'Nooo, not the light!', 'Boo… hoo…'],
  },
  demon: {
    spawn: ['Your soul is MINE!', 'RAWR!', 'I bring hellfire!', 'Smells like gym socks in here'],
    hit: ["I'm telling Satan!", 'Unholy RUDE!', 'My horns!!', 'This is not in my contract!', 'OW, MY TAIL'],
    die: ['Back to Hell… express', 'Hell is warmer anyway', 'I quit demon-ing', 'Tell Satan I tried'],
  },
  wisp: {
    spawn: ['Hee hee hee!', 'Wanna see a magic trick?', 'Poltergeist on duty!'],
    hit: ['Rude!', 'Hey! I was haunting!', 'Not fair!', 'Put me down!'],
    throw: ['Catch!', 'Think fast!', 'Have a chair!', 'Yoink!', 'Special delivery!'],
    die: ['Poof…', 'I was just a little guy!', 'Haunt you later…'],
  },
  gary: { spawn: ['GARY. SMASH.', 'GARY HUNGRY.', 'WHO TOUCH GARY SNACK'], hit: ['Gary felt that.', 'GARY ANGRY.', 'Gary need band-aid'], die: ['Gary… need… nap'] },
  brimstone: { spawn: ['KNEEL BEFORE LORD BRIMSTONE!', 'I AM THE LANDLORD NOW'], hit: ['Impudent mortal!', 'My lava lamp!', 'You dare?!'], die: ['I will return… next wave… maybe'] },
};
const ATTACK_LINES = ['Nom!', 'Gimme!', 'Hug me!', 'Boop!', 'Hold still!'];
const ENEMY_DEFS = {
  zombie: { name: 'Zombie', hp: 34, speed: 2.5, mass: 60, dmg: 7, reach: 1.25, atkCD: 1.1, size: [0.6, 1.7, 0.4], xp: 10, build: buildZombie, sound: 'groan', lines: LINES.zombie, ecto: [0x8fe36b, 0x5c9a4a] },
  ghost: { name: 'Ghost', hp: 22, speed: 3.3, mass: 22, dmg: 5, reach: 1.25, atkCD: 1.0, size: [0.7, 1.3, 0.7], xp: 8, float: 1.35, phase: true, build: buildGhost, sound: 'boo', lines: LINES.ghost, ecto: [0xffffff, 0xcfe9ff] },
  demon: { name: 'Demon', hp: 52, speed: 4.4, mass: 75, dmg: 10, reach: 1.35, atkCD: 0.9, size: [0.6, 1.8, 0.45], xp: 15, leap: true, build: buildDemon, sound: 'roar', lines: LINES.demon, ecto: [0xff4a3d, 0xffb000] },
  wisp: { name: 'Poltergeist', hp: 18, speed: 2.6, mass: 14, dmg: 4, reach: 1.1, atkCD: 1.2, size: [0.6, 0.6, 0.6], xp: 12, float: 2.1, phase: true, ranged: true, build: buildWisp, sound: 'wheee', lines: LINES.wisp, ecto: [0xb994ff, 0x7b45e0] },
  gary: { name: 'Big Gary', boss: true, scale: 2.2, hp: 480, speed: 1.9, mass: 380, dmg: 18, reach: 2.3, atkCD: 1.4, size: [0.6, 1.7, 0.4], xp: 120, heavy: 2.4, build: buildZombie, sound: 'groan', lines: LINES.gary, ecto: [0x8fe36b, 0x5c9a4a] },
  brimstone: { name: 'Lord Brimstone', boss: true, scale: 2.1, hp: 700, speed: 3.0, mass: 420, dmg: 22, reach: 2.4, atkCD: 1.2, size: [0.6, 1.8, 0.45], xp: 200, heavy: 2.4, leap: true, build: buildDemon, sound: 'roar', lines: LINES.brimstone, ecto: [0xff4a3d, 0xffb000] },
};

// ---------- models ----------
function limb(parent, x, y, z, w, h, d, mat) {
  const g = new THREE.Group(); g.position.set(x, y, z);
  const m = mkMesh(geo('b', w, h, d), mat); m.position.y = -h / 2; g.add(m);
  parent.add(g); return g;
}
function part(parent, g, mat, x, y, z, sx = 1, sy = 1, sz = 1) {
  const m = mkMesh(g, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); parent.add(m); return m;
}
function buildZombie(e) {
  const g = new THREE.Group(), M = [];
  const m = (c, p) => { const x = toon(c, p, true); M.push(x); return x; };
  const skin = m(e.def.boss ? 0x76a845 : pick([0x8fbf5a, 0x9ac46a, 0x7fb07a])), shirt = m(pick([0x3d5a80, 0x7a3b5e, 0x4f6b3a, 0x8a6a2a])), pants = m(0x4a3b2e);
  const eye = m(0xfff27a, { emissive: 0xffe14d, emissiveIntensity: 1.3 }), dark = m(0x221820);
  const P = {};
  P.legL = limb(g, -0.14, -0.1, 0, 0.2, 0.75, 0.22, pants);
  P.legR = limb(g, 0.14, -0.1, 0, 0.2, 0.75, 0.22, pants);
  part(g, geo('b', 0.56, 0.6, 0.32), shirt, 0, 0.2, 0);
  part(g, geo('b', 0.16, 0.14, 0.02), skin, 0.12, 0.27, 0.165);
  P.head = new THREE.Group(); P.head.position.y = 0.5; g.add(P.head);
  part(P.head, geo('b', 0.38, 0.36, 0.36), skin, 0, 0.17, 0);
  P.eyes = [part(P.head, geo('s', 0.065), eye, -0.09, 0.21, 0.18), part(P.head, geo('s', 0.045), eye, 0.1, 0.22, 0.18)];
  part(P.head, geo('b', 0.2, 0.05, 0.02), dark, 0, 0.08, 0.185);
  part(P.head, geo('b', 0.1, 0.08, 0.1), pants, 0.1, 0.38, 0);
  P.armL = limb(g, -0.36, 0.44, 0, 0.15, 0.62, 0.15, skin);
  P.armR = limb(g, 0.36, 0.44, 0, 0.15, 0.62, 0.15, shirt);
  P.zombieArms = true;
  return { g, P, M };
}
function buildGhost(e) {
  const g = new THREE.Group(), M = [];
  const sheet = toon(0xf4f6ff, { transparent: true, opacity: 0.86, emissive: 0x8090c0, emissiveIntensity: 0.35 }, true); M.push(sheet);
  const dark = toon(0x16121f, null, true), blush = toon(0xff9ec4, null, true); M.push(dark, blush);
  const P = {};
  part(g, geo('c', 0.33, 0.95, 0.52), sheet, 0, -0.12, 0).castShadow = false;
  part(g, geo('s', 0.34), sheet, 0, 0.36, 0).castShadow = false;
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; part(g, geo('s', 0.13), sheet, Math.cos(a) * 0.42, -0.6, Math.sin(a) * 0.42).castShadow = false; }
  P.eyes = [part(g, geo('s', 0.07), dark, -0.12, 0.42, 0.3, 1, 1.5, 0.6), part(g, geo('s', 0.07), dark, 0.12, 0.42, 0.3, 1, 1.5, 0.6)];
  P.mouth = part(g, geo('s', 0.08), dark, 0, 0.24, 0.31, 1, 1.3, 0.5);
  part(g, geo('s', 0.05), blush, -0.22, 0.3, 0.26, 1, 0.6, 0.5); part(g, geo('s', 0.05), blush, 0.22, 0.3, 0.26, 1, 0.6, 0.5);
  P.armL = new THREE.Group(); P.armL.position.set(-0.42, 0.05, 0); part(P.armL, geo('s', 0.11), sheet, -0.08, -0.08, 0, 1.6, 0.8, 0.8); g.add(P.armL);
  P.armR = new THREE.Group(); P.armR.position.set(0.42, 0.05, 0); part(P.armR, geo('s', 0.11), sheet, 0.08, -0.08, 0, 1.6, 0.8, 0.8); g.add(P.armR);
  P.legL = new THREE.Group(); P.legR = new THREE.Group(); P.ghost = true;
  return { g, P, M };
}
function buildDemon(e) {
  const g = new THREE.Group(), M = [];
  const m = (c, p) => { const x = toon(c, p, true); M.push(x); return x; };
  const skin = m(e.def.boss ? 0xb3201c : 0xd1342f), deep = m(0x7a1414), horn = m(0xf0e6c8), eye = m(0xffe34d, { emissive: 0xffcc00, emissiveIntensity: 1.6 }), tooth = m(0xffffff), hoof = m(0x1d1418);
  const P = {};
  P.legL = limb(g, -0.15, -0.1, 0, 0.2, 0.75, 0.24, deep);
  P.legR = limb(g, 0.15, -0.1, 0, 0.2, 0.75, 0.24, deep);
  part(P.legL, geo('b', 0.22, 0.08, 0.28), hoof, 0, -0.75, 0.02); part(P.legR, geo('b', 0.22, 0.08, 0.28), hoof, 0, -0.75, 0.02);
  part(g, geo('b', 0.6, 0.65, 0.34), skin, 0, 0.22, 0);
  part(g, geo('b', 0.4, 0.2, 0.02), deep, 0, 0.3, 0.175);
  P.head = new THREE.Group(); P.head.position.y = 0.55; g.add(P.head);
  part(P.head, geo('b', 0.4, 0.36, 0.36), skin, 0, 0.17, 0);
  const h1 = part(P.head, geo('c', 0, 0.28, 0.07, 6), horn, -0.14, 0.45, 0); h1.rotation.z = 0.45;
  const h2 = part(P.head, geo('c', 0, 0.28, 0.07, 6), horn, 0.14, 0.45, 0); h2.rotation.z = -0.45;
  P.eyes = [part(P.head, geo('s', 0.055), eye, -0.1, 0.22, 0.18), part(P.head, geo('s', 0.055), eye, 0.1, 0.22, 0.18)];
  part(P.head, geo('b', 0.26, 0.05, 0.02), tooth, 0, 0.07, 0.185);
  P.armL = limb(g, -0.38, 0.48, 0, 0.16, 0.62, 0.16, skin);
  P.armR = limb(g, 0.38, 0.48, 0, 0.16, 0.62, 0.16, skin);
  P.tail = new THREE.Group(); P.tail.position.set(0, -0.05, -0.18); g.add(P.tail);
  const tl = part(P.tail, geo('c', 0.025, 0.7, 0.04, 6), deep, 0, 0, -0.32); tl.rotation.x = PI2 + 0.4;
  part(P.tail, geo('c', 0, 0.14, 0.08, 4), deep, 0, -0.14, -0.66).rotation.x = -PI2;
  return { g, P, M };
}
function buildWisp(e) {
  const g = new THREE.Group(), M = [];
  const core = toon(0xb994ff, { emissive: 0x7b45e0, emissiveIntensity: 1.2, transparent: true, opacity: 0.92 }, true);
  const white = toon(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.6 }, true), dark = toon(0x1a0f2e, null, true);
  M.push(core, white, dark);
  const P = {};
  part(g, geo('s', 0.3, 0, 0, 18), core, 0, 0, 0).castShadow = false;
  part(g, geo('c', 0, 0.35, 0.18, 8), core, 0, 0.3, -0.05).rotation.x = -0.5;
  P.eyes = [part(g, geo('s', 0.07), white, -0.1, 0.06, 0.25), part(g, geo('s', 0.07), white, 0.1, 0.06, 0.25)];
  part(g, geo('s', 0.03), dark, -0.1, 0.06, 0.31); part(g, geo('s', 0.03), dark, 0.1, 0.06, 0.31);
  part(g, geo('b', 0.14, 0.04, 0.02), dark, 0, -0.1, 0.28);
  P.orbit = new THREE.Group(); g.add(P.orbit);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; part(P.orbit, geo('s', 0.06), white, Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5); }
  P.armL = new THREE.Group(); P.armR = new THREE.Group(); P.legL = new THREE.Group(); P.legR = new THREE.Group();
  return { g, P, M };
}
const dizzyGeo = new THREE.OctahedronGeometry(0.07);
const dizzyMat = new THREE.MeshBasicMaterial({ color: 0xffd23f, toneMapped: false });

// ---------- lifecycle ----------
function spawnEnemy(type, x, z) {
  const d = ENEMY_DEFS[type];
  const s = d.scale || 1;
  const [w, h, dd] = d.size.map((v) => v * s);
  const e = {
    type, def: d, hp: d.hp, maxHp: d.hp, state: 'spawn', stateT: 0, spawnT: 0.9, attackT: rand(0.3, 1), swing: 0, swingHit: false,
    stuckT: 0, flashT: 0, squash: 0, yaw: 0, seed: rand(0, 100), height: h, radius: Math.max(w, dd) / 2, s,
    burnT: 0, dizzyT: 0, leapCD: 2, leaping: 0, throwCD: rand(2, 4), restT: 0, lastBumpT: -1, deadT: 0, thrown: 0,
  };
  const { g, P, M } = d.build(e);
  g.scale.setScalar(s);
  const mesh = new THREE.Group();
  mesh.add(g);
  scene.add(mesh);
  const dz = new THREE.Group(); dz.position.y = h / 2 + 0.25; dz.visible = false;
  for (let i = 0; i < 3; i++) { const st = new THREE.Mesh(dizzyGeo, dizzyMat); const a = (i / 3) * Math.PI * 2; st.position.set(Math.cos(a) * 0.3 * s, 0, Math.sin(a) * 0.3 * s); dz.add(st); }
  mesh.add(dz);
  const body = new CANNON.Body({
    mass: d.mass, material: PM.enemy, fixedRotation: true, linearDamping: 0.05, angularDamping: 0.3, allowSleep: false,
    collisionFilterGroup: d.phase ? GROUP.GHOST : GROUP.ENEMY, collisionFilterMask: d.phase ? MASK.GHOST : MASK.ENEMY,
  });
  body.addShape(new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, dd / 2)));
  e.standY = d.float ? d.float : h / 2 + 0.02;
  placeBody(body, x, e.standY, z);
  body.kind = 'enemy';
  body.ent = e;
  body.addEventListener('collide', onEnemyCollide);
  world.addBody(body);
  if (d.float) floaty.add(body);
  Object.assign(e, { body, mesh, inner: g, P, M, dizzy: dz, flashMats: M.filter((x) => x.emissive && x.emissive.getHex() === 0) });
  enemies.add(e);
  const pos = V3(x, 0.3, z);
  if (type === 'zombie' || type === 'gary') burst(pos, [0x4a3b2e, 0x2c3a22, 0x6b5a44], 22, 5, 0.12, { spread: 0.4 });
  else if (d.ecto) { burst(V3(x, e.standY, z), d.ecto, 20, 4, 0.1, { grav: 0.1, drag: 2 }); impactStar(V3(x, e.standY, z), d.ecto[0], 1.4); }
  if (Math.random() < 0.55 || d.boss) bubble(e, pick(d.lines.spawn));
  sfx(d.sound, pos);
  return e;
}

function hitEnemy(e, dmg, vel, o = {}) {
  if (e.state === 'held' || !e.body) return;
  const wasAlive = e.state !== 'dead';
  if (wasAlive) e.hp -= dmg;
  e.flashT = 0.15;
  e.squash = 0.25;
  if (o.fire) e.burnT = 3;
  launchEnemy(e, vel, o.spin ?? 1);
  if (wasAlive && e.hp <= 0) killEnemy(e);
  else if (wasAlive && Math.random() < 0.4) bubble(e, pick(e.def.lines.hit));
  return wasAlive && e.hp <= 0;
}
function launchEnemy(e, vel, spin = 1) {
  const b = e.body;
  if (e.state === 'held') return;
  const hv = 1 / (e.def.heavy || 1);
  if (b.fixedRotation) { b.fixedRotation = false; b.updateMassProperties(); }
  if (e.def.phase) { b.collisionFilterGroup = GROUP.ENEMY; b.collisionFilterMask = MASK.ENEMY; floaty.delete(b); }
  b.velocity.set(b.velocity.x * 0.25 + vel.x * hv, Math.max(b.velocity.y * 0.25, 0) + vel.y * hv, b.velocity.z * 0.25 + vel.z * hv);
  const sp = b.velocity.length();
  if (sp > 30) b.velocity.scale(30 / sp, b.velocity);
  const sv = 13 * spin * hv;
  b.angularVelocity.set(rand(-1, 1) * sv, rand(-1, 1) * sv, rand(-1, 1) * sv);
  if (e.state !== 'dead') { e.state = 'launched'; e.stateT = 0; e.restT = 0; }
  e.swing = 0;
  if (sp > 14 && Math.random() < 0.3) sfx('boing');
}
function killEnemy(e) {
  e.state = 'dead'; e.deadT = 0; e.hp = 0; e.burnT = 0;
  G.kills++;
  gainXP(e.def.xp);
  const p = e.body.position;
  pop(V3(p.x, p.y + 0.9, p.z), e.def.boss ? 'BOSS K.O.!' : pick(['K.O.!', 'K.O.!', 'K.O.!', 'DOWN!', 'BYE!', 'OBLITERATED!']), { color: '#ff4a3d', size: e.def.boss ? 84 : 56, life: 1.1 });
  if (Math.random() < 0.55 || e.def.boss) bubble(e, pick(e.def.lines.die));
  sfx('ko');
  if (e.P.eyes) e.P.eyes.forEach((x) => x.scale.y = 0.25);
  if (e.def.boss) { slowMo(0.2, 1.6); shake(0.9); banner(e.def.name + ' is down', 'Your landlord is going to be furious'); }
  else if (Math.random() < 0.3) slowMo(0.35, 0.45);
}
function despawn(e, quiet = false) {
  enemies.delete(e);
  floaty.delete(e.body);
  const pos = V3().copy(e.body.position);
  if (e.body.world) world.removeBody(e.body);
  if (e.mesh.parent) e.mesh.parent.remove(e.mesh);
  if (quiet) return;
  burst(pos, e.def.ecto, 30, 6, 0.12, { grav: 0.3, drag: 1.5 });
  burst(pos, [0xffffff], 12, 3, 0.16, { grav: -0.2, drag: 3, life: 1.2 });
  impactStar(pos, e.def.ecto[0], 1.8);
  sfx('poof', pos);
  const drops = e.def.boss ? 4 : Math.random() < 0.28 + (player.buffs.quack > 0 ? 0.12 : 0) ? 1 : 0;
  for (let i = 0; i < drops; i++) spawnPickup(pick(LOOT), V3(pos.x, Math.max(0.4, pos.y), pos.z));
}
function startRecover(e) {
  const b = e.body;
  e.state = 'recover'; e.stateT = 0;
  e.recQ = b.quaternion.clone();
  e.recY = b.position.y;
  b.fixedRotation = true; b.updateMassProperties();
  b.angularVelocity.set(0, 0, 0);
  _t1.set(0, 0, 1).applyQuaternion(e.mesh.quaternion);
  e.yaw = Math.atan2(_t1.x, _t1.z);
  e.tgtQ = new CANNON.Quaternion().setFromEuler(0, e.yaw, 0);
}

function onEnemyCollide(ev) {
  const e = ev.target.ent;
  if (!e || e.state === 'held') return;
  const ob = ev.body, o = ob.ent;
  const v = Math.abs(ev.contact.getImpactVelocityAlongNormal());
  if (v < 5) return;
  if (G.time - e.lastBumpT < 0.1) return;
  if (ob.kind === 'prop' && o && o.hostileT <= 0) {
    const pv = ob.velocity.length();
    if (pv > 6 && (o.thrownT > 0 || pv > 9)) {
      e.lastBumpT = G.time;
      const dmg = (v - 4) * Math.sqrt(ob.mass) * (o.thrownT > 0 ? 1.7 : 1) * (0.8 + player.arm * 0.2);
      const k = clamp((ob.mass / e.body.mass) * 2, 0.3, 1.2);
      const vel = V3(ob.velocity.x * k, ob.velocity.y * k + 3, ob.velocity.z * k);
      afterStep(() => {
        if (!e.body.world) return;
        hitEnemy(e, dmg, vel);
        if (dmg > 12) {
          pop(V3().copy(e.body.position).setY(e.body.position.y + 0.5), (o.def.weapon && o.def.weapon.word) || pick(POW_WORDS), { size: clamp(30 + dmg * 0.4, 32, 70) });
          impactStar(V3().copy(e.body.position), 0xffd23f, 1);
          registerHit(1);
        }
        sfx(MAT_SOUND[o.def.mat] || 'thud', e.body.position);
      });
    }
  } else if (ob.kind === 'enemy' && o && (o.state === 'launched' || o.state === 'dead' || o.thrown > 0)) {
    const ov = ob.velocity.length();
    if (ov > 7 && e.state !== 'dead') {
      e.lastBumpT = G.time;
      const mult = o.thrown > 0 ? 1.8 : 1;
      const vel = V3(ob.velocity.x * 0.75, ob.velocity.y * 0.5 + 5, ob.velocity.z * 0.75);
      afterStep(() => {
        if (!e.body.world) return;
        hitEnemy(e, (ov - 5) * 2.4 * mult, vel);
        G.bowl = (G.bowl || 0) + 1;
        pop(V3().copy(e.body.position).setY(e.body.position.y + 0.7), G.bowl % 3 === 0 ? 'STRIKE!' : pick(['BOWLED!', 'CLONK!', 'TEAMWORK!', 'DOMINO!']), { color: '#6ee7ff', size: 44 });
        sfx('punch', e.body.position, 0.8);
        registerHit(1);
      });
    }
  } else if ((ob.kind === 'static' || ob.kind === 'floor') && (e.state === 'launched' || e.state === 'dead') && v > 12) {
    e.lastBumpT = G.time;
    afterStep(() => {
      if (!e.body.world) return;
      const alive = e.state !== 'dead';
      if (alive) e.hp -= (v - 10) * 1.6;
      e.squash = 0.35;
      if (v > 15) {
        pop(V3().copy(e.body.position), pick(['SPLAT!', 'SMOOSH!', 'KRUNCH!', 'WALLED!']), { color: '#ffffff', size: 40 });
        burst(V3().copy(e.body.position), e.def.ecto, 10, 4, 0.1);
        shake(0.12);
      }
      sfx('splat', e.body.position);
      if (alive && e.hp <= 0) killEnemy(e);
    });
  }
}

// ---------- AI ----------
function nearestThrowable(pos, r) {
  let best = null, bd = r * r;
  for (const p of props) {
    if (!p.alive || p.def.static || p.def.pickup || !p.body.world || p.def.mass > 30) continue;
    const d = p.body.position.distanceSquared(pos) * rand(0.7, 1.3);
    if (d < bd) { bd = d; best = p; }
  }
  return best;
}
function poltergeistThrow(e, p) {
  const pb = p.body, tp = player.body.position;
  pb.wakeUp();
  const dx = tp.x - pb.position.x, dy = tp.y + 0.2 - pb.position.y, dz = tp.z - pb.position.z;
  const t = Math.max(0.3, Math.hypot(dx, dz) / 15);
  pb.velocity.set(dx / t, dy / t + 0.5 * GRAV * t, dz / t);
  pb.angularVelocity.set(rand(-8, 8), rand(-8, 8), rand(-8, 8));
  p.hostileT = t + 0.6; p.thrownT = 0;
  bubble(e, pick(e.def.lines.throw));
  sfx('wheee', e.body.position);
  burst(pb.position, e.def.ecto, 12, 3, 0.08, { grav: 0 });
}
function aiWalk(e, dt) {
  const b = e.body, d = e.def, pp = player.body.position;
  let tx = pp.x, tz = pp.z, wp = null;
  if (!d.phase) { wp = nextWaypoint(b.position.x, b.position.z, pp.x, pp.z); if (wp) { tx = wp.x; tz = wp.z; } }
  const dx = tx - b.position.x, dz = tz - b.position.z, dist = Math.hypot(dx, dz) || 1;
  const pdx = pp.x - b.position.x, pdz = pp.z - b.position.z, pd = Math.hypot(pdx, pdz);
  let sp = d.speed * (e.dizzyT > 0 ? 0.3 : 1) * (e.burnT > 0 ? 1.6 : 1) * (G.wave > 6 ? 1.15 : 1);
  if (d.ranged && pd < 5.5 && !wp) sp *= -0.6;
  let sx = 0, sz = 0;
  for (const o of enemies) {
    if (o === e || o.state !== 'walk') continue;
    const ox = b.position.x - o.body.position.x, oz = b.position.z - o.body.position.z, od = ox * ox + oz * oz;
    if (od < 1.2 && od > 0.0001) { sx += ox / od * 0.6; sz += oz / od * 0.6; }
  }
  const stop = !d.ranged && pd < d.reach * e.s * 0.8 && !wp;
  const vx = stop ? 0 : (dx / dist) * sp + sx, vz = stop ? 0 : (dz / dist) * sp + sz;
  if (e.leaping > 0) e.leaping -= dt;
  else { b.velocity.x = damp(b.velocity.x, vx, 16, dt); b.velocity.z = damp(b.velocity.z, vz, 16, dt); }
  if (d.float) {
    const ty = (d.ranged ? d.float : clamp(pp.y + 0.45, 1.0, 2.4)) + Math.sin(G.time * 2 + e.seed) * 0.2;
    b.velocity.y = (ty - b.position.y) * 3;
  }
  e.yaw = Math.atan2(pd < 4 || d.phase ? pdx : dx, pd < 4 || d.phase ? pdz : dz);
  b.quaternion.setFromEuler(0, e.yaw, 0);
  const grounded = Math.abs(b.velocity.y) < 0.4 && b.position.y < e.standY + 0.25;
  if (!d.float) {
    const hs = Math.hypot(b.velocity.x, b.velocity.z);
    if (hs < Math.abs(sp) * 0.3 && !stop) e.stuckT += dt; else e.stuckT = Math.max(0, e.stuckT - dt);
    if (e.stuckT > 0.45 && grounded) { b.velocity.y = 7.5; e.stuckT = 0; b.velocity.x += rand(-1.5, 1.5); }
    if (wp && wp.portal.kind === 'window' && wp.through && grounded) b.velocity.y = 7.2;
    if (d.leap && e.leapCD <= 0 && pd > 2.5 && pd < 8 && grounded && !wp) {
      e.leapCD = rand(2.5, 4); e.leaping = 0.7;
      b.velocity.set((pdx / pd) * 10, 7.5, (pdz / pd) * 10);
      sfx('roar', b.position);
      if (Math.random() < 0.3) bubble(e, 'POUNCE!');
    }
  }
  if (d.ranged) {
    e.throwCD -= dt;
    if (e.throwCD <= 0 && pd < 16) { e.throwCD = rand(3, 4.5); const p = nearestThrowable(b.position, 9); if (p) poltergeistThrow(e, p); }
  }
  // melee
  const dy = Math.abs(pp.y - b.position.y);
  if (e.swing > 0) {
    e.swing -= dt;
    if (!e.swingHit && e.swing < 0.17) {
      e.swingHit = true;
      if (pd < d.reach * e.s + 0.5 && dy < 1.8 * e.s) hurtPlayer(d.dmg, b.position, e);
    }
  } else if (pd < d.reach * e.s + 0.2 && e.attackT <= 0 && dy < 1.6 * e.s) {
    e.swing = 0.35; e.swingHit = false; e.attackT = d.atkCD;
    if (Math.random() < 0.15) bubble(e, pick(ATTACK_LINES));
  }
}

function animEnemy(e, dt) {
  const P = e.P, t = G.time + e.seed, st = e.state, b = e.body;
  const hs = Math.hypot(b.velocity.x, b.velocity.z);
  if (st === 'launched' || st === 'dead' || st === 'held') {
    const f = Math.sin(t * 28);
    P.armL.rotation.set(f * 1.6, 0, -0.7); P.armR.rotation.set(-f * 1.6, 0, 0.7);
    P.legL.rotation.set(f * 0.9, 0, -0.3); P.legR.rotation.set(-f * 0.9, 0, 0.3);
  } else {
    const ph = t * (3 + hs * 2.2), sw = Math.min(1, hs / 2);
    P.legL.rotation.set(Math.sin(ph) * 0.7 * sw, 0, 0); P.legR.rotation.set(-Math.sin(ph) * 0.7 * sw, 0, 0);
    if (P.zombieArms) { P.armL.rotation.set(-1.35 + Math.sin(ph * 0.5) * 0.15, 0, 0); P.armR.rotation.set(-1.45 - Math.sin(ph * 0.5) * 0.15, 0, 0); }
    else if (P.ghost) { P.armL.rotation.set(0, 0, Math.sin(t * 5) * 0.5); P.armR.rotation.set(0, 0, -Math.sin(t * 5) * 0.5); }
    else { P.armL.rotation.set(-Math.sin(ph) * 0.6 * sw, 0, 0); P.armR.rotation.set(Math.sin(ph) * 0.6 * sw, 0, 0); }
    if (e.swing > 0) { const k = Math.sin((e.swing / 0.35) * Math.PI) * 2.6; P.armL.rotation.x = -k; P.armR.rotation.x = -k; }
    if (e.def.float) e.inner.position.y = Math.sin(t * 2.2) * 0.08;
  }
  if (P.tail) P.tail.rotation.y = Math.sin(t * 4) * 0.5;
  if (P.orbit) P.orbit.rotation.y += dt * 4;
  const base = e.s;
  if (e.squash > 0) {
    e.squash -= dt;
    const k = Math.max(0, e.squash), s = 1 + Math.sin(k * 40) * k * 0.9;
    e.inner.scale.set(base * s, base * (2 - s), base * s);
  } else e.inner.scale.setScalar(base);
  const dz = st === 'recover' || e.dizzyT > 0 || (st === 'launched' && e.stateT > 0.5) || st === 'dead';
  e.dizzy.visible = dz;
  if (dz) e.dizzy.rotation.y = t * 7;
  const fl = e.flashT > 0 ? (e.flashT / 0.15) * 0.9 : e.burnT > 0 ? 0.25 + Math.sin(t * 20) * 0.15 : 0;
  if (fl !== e._fl) { for (const m of e.flashMats) e.burnT > 0 && e.flashT <= 0 ? m.emissive.setRGB(fl * 2, fl * 0.7, 0) : m.emissive.setScalar(fl); e._fl = fl; }
}
const _q = new THREE.Quaternion();

function updateEnemies(dt) {
  for (const e of enemies) {
    const b = e.body;
    if (e.state === 'held') { animEnemy(e, dt); continue; }
    e.mesh.position.copy(b.interpolatedPosition);
    e.mesh.quaternion.copy(b.interpolatedQuaternion);
    if (e.flashT > 0) e.flashT -= dt;
    if (e.dizzyT > 0) e.dizzyT -= dt;
    if (e.attackT > 0) e.attackT -= dt;
    if (e.leapCD > 0) e.leapCD -= dt;
    if (e.thrown > 0) e.thrown -= dt;
    if (e.burnT > 0) {
      e.burnT -= dt;
      if (Math.random() < 0.7) burst(b.position, [0xff7a00, 0xffd23f, 0xff3b1f], 1, 2, 0.12, { grav: -0.4, life: 0.5, spread: 0.3 });
      if (e.state !== 'dead') { e.hp -= 7 * dt; if (e.hp <= 0) killEnemy(e); }
    }
    if (e.state === 'spawn') {
      e.spawnT -= dt;
      const k = Math.max(0, e.spawnT / 0.9);
      if (e.type === 'zombie' || e.type === 'gary') { e.inner.position.y = -e.height * k; if (Math.random() < 0.3) burst(V3(b.position.x, 0.1, b.position.z), [0x4a3b2e, 0x2c3a22], 1, 3, 0.1); }
      else e.inner.scale.setScalar(e.s * (1 - k));
      b.velocity.set(0, e.def.float ? 0 : b.velocity.y, 0);
      if (e.spawnT <= 0) { e.state = 'walk'; e.inner.position.y = 0; }
      continue;
    }
    const speed = b.velocity.length();
    if ((e.state === 'launched' || e.state === 'dead') && b.position.y < e.height * 0.5 + 0.35) {
      // skid to a stop on the floor (floor friction is kept low for walking)
      const k = Math.max(0, 1 - 2.6 * dt);
      b.velocity.x *= k; b.velocity.z *= k;
      b.angularVelocity.scale(Math.max(0, 1 - 1.5 * dt), b.angularVelocity);
    }
    if (e.state === 'walk') aiWalk(e, dt);
    else if (e.state === 'launched') {
      e.stateT += dt;
      if (e.stateT > 0.7 && speed < 1.6) e.restT += dt; else e.restT = 0;
      if (e.restT > 0.3 || e.stateT > 4.5) startRecover(e);
    } else if (e.state === 'recover') {
      e.stateT += dt;
      const k = Math.min(1, e.stateT / 0.45);
      e.recQ.slerp(e.tgtQ, k, b.quaternion);
      b.velocity.x *= 0.85; b.velocity.z *= 0.85;
      const ty = lerp(e.recY, e.standY, k);
      if (b.position.y < ty) { b.position.y = ty; b.velocity.y = Math.max(0, b.velocity.y); }
      if (k >= 1) {
        e.state = 'walk'; e.dizzyT = 0.9;
        if (e.def.phase) { b.collisionFilterGroup = GROUP.GHOST; b.collisionFilterMask = MASK.GHOST; floaty.add(b); }
        if (Math.random() < 0.25) bubble(e, pick(['I meant to do that', 'Round two!', 'Ow… okay', 'Again?!']));
      }
    } else if (e.state === 'dead') {
      e.deadT += dt;
      if ((e.deadT > 1.0 && speed < 1.5) || e.deadT > 4.5) { despawn(e); continue; }
    }
    if (b.position.y < -8 || Math.abs(b.position.x) > 70 || Math.abs(b.position.z) > 70) {
      if (e.state !== 'dead') killEnemy(e);
      despawn(e, true);
      continue;
    }
    animEnemy(e, dt);
  }
}

// ---------- grabbing ----------
function grabEnemyBody(e) {
  e.state = 'held';
  e.swing = 0;
  floaty.delete(e.body);
  if (e.body.world) world.removeBody(e.body);
  if (e.mesh.parent) e.mesh.parent.remove(e.mesh);
  e.mesh.position.set(0, 0, 0);
  e.mesh.quaternion.identity();
  e.dizzy.visible = false;
  if (Math.random() < 0.7) bubble(e, pick(['PUT ME DOWN', 'Unhand me!', "This isn't a hug!", 'Personal space!!', 'Wheee?']));
}
function releaseEnemyBody(e, pos, vel) {
  scene.add(e.mesh);
  const b = e.body;
  placeBody(b, pos.x, pos.y, pos.z);
  b.quaternion.setFromEuler(rand(-1, 1), player.yaw, rand(-1, 1));
  b.velocity.set(0, 0, 0);
  world.addBody(b);
  e.state = e.hp <= 0 ? 'dead' : 'launched';
  e.stateT = 0;
  e.thrown = 1.5;
  launchEnemy(e, vel, 1.3);
}
