import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// ================= CORE: utils, renderer, physics =================
const $ = (id) => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const money = (n) => '$' + Math.round(n).toLocaleString('en-US');

const G = {
  running: false, paused: false, over: false, time: 0,
  hitStop: 0, slowT: 0, slowScale: 1, trauma: 0,
  wave: 0, kills: 0, damage: 0, combo: 0, comboT: 0, bestCombo: 0,
  intermission: 0, toSpawn: [], spawnT: 0,
};

const GROUP = { STATIC: 1, FLOOR: 2, PLAYER: 4, PROP: 8, ENEMY: 16, GHOST: 32, DEBRIS: 64 };
const MASK = {
  STATIC: 0xffff, FLOOR: 0xffff,
  PLAYER: 1 | 2 | 8 | 16 | 32,
  PROP: 1 | 2 | 4 | 8 | 16,
  ENEMY: 1 | 2 | 4 | 8 | 16,
  GHOST: 4,
  DEBRIS: 1 | 2,
};

// ---------- renderer / scene ----------
const canvas = $('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1b1333);
scene.fog = new THREE.Fog(0x1b1333, 28, 85);
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.05, 220);
camera.rotation.order = 'YXZ';
scene.add(camera);
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// toon ramp
const gradTex = (() => {
  const t = new THREE.DataTexture(new Uint8Array([70, 150, 215, 255]), 4, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();

const matCache = new Map();
function toon(color, params = null, unique = false) {
  const key = color + (params ? JSON.stringify(params) : '');
  if (!unique && matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshToonMaterial({ color, gradientMap: gradTex, ...(params || {}) });
  if (!unique) matCache.set(key, m);
  return m;
}
const geoCache = new Map();
function geo(kind, a, b = 0, c = 0, seg = 0) {
  const key = kind + a + ',' + b + ',' + c + ',' + seg;
  let g = geoCache.get(key);
  if (!g) {
    if (kind === 'b') g = new THREE.BoxGeometry(a, b, c);
    else if (kind === 'c') g = new THREE.CylinderGeometry(a, c, b, seg || 14);
    else g = new THREE.SphereGeometry(a, seg || 14, Math.max(8, Math.round((seg || 14) * 0.7)));
    geoCache.set(key, g);
  }
  return g;
}
function mkMesh(g, m, shadow = true) {
  const x = new THREE.Mesh(g, m);
  x.castShadow = shadow;
  x.receiveShadow = true;
  return x;
}
const boxMesh = (w, h, d, color, params, unique) => mkMesh(geo('b', w, h, d), toon(color, params, unique));
const cylMesh = (rt, h, rb, color, params, unique, seg) => mkMesh(geo('c', rt, h, rb, seg), toon(color, params, unique));
const sphMesh = (r, color, params, unique, seg) => mkMesh(geo('s', r, 0, 0, seg), toon(color, params, unique));

function canvasTex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// ---------- physics ----------
const GRAV = 24;
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -GRAV, 0) });
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;
world.solver.iterations = 9;
world.defaultContactMaterial.friction = 0.4;
world.defaultContactMaterial.restitution = 0.15;
const PM = {
  def: new CANNON.Material('def'),
  player: new CANNON.Material('player'),
  enemy: new CANNON.Material('enemy'),
  bouncy: new CANNON.Material('bouncy'),
};
world.addContactMaterial(new CANNON.ContactMaterial(PM.player, PM.def, { friction: 0, restitution: 0 }));
world.addContactMaterial(new CANNON.ContactMaterial(PM.player, PM.enemy, { friction: 0, restitution: 0 }));
world.addContactMaterial(new CANNON.ContactMaterial(PM.player, PM.bouncy, { friction: 0, restitution: 0.3 }));
// low friction: walking is velocity-driven, and a box gets friction once per contact point
world.addContactMaterial(new CANNON.ContactMaterial(PM.enemy, PM.def, { friction: 0.03, restitution: 0.3 }));
world.addContactMaterial(new CANNON.ContactMaterial(PM.enemy, PM.enemy, { friction: 0.1, restitution: 0.45 }));
world.addContactMaterial(new CANNON.ContactMaterial(PM.bouncy, PM.def, { friction: 0.08, restitution: 0.75 }));
world.addContactMaterial(new CANNON.ContactMaterial(PM.bouncy, PM.bouncy, { friction: 0.05, restitution: 0.9 }));

// bodies that float (ghosts, wisps): cancel gravity every internal step
const floaty = new Set();
world.addEventListener('preStep', () => {
  for (const b of floaty) b.force.y += b.mass * GRAV;
});

// work that must wait until the physics step finishes (removing bodies, changing filters)
const later = [];
const afterStep = (fn) => later.push(fn);
function flushLater() {
  let guard = 0;
  while (later.length && guard++ < 500) later.shift()();
}

// objects with { body, mesh } whose mesh follows the body
const synced = new Set();
function syncAll() {
  for (const o of synced) {
    o.mesh.position.copy(o.body.interpolatedPosition);
    o.mesh.quaternion.copy(o.body.interpolatedQuaternion);
  }
}
function placeBody(b, x, y, z) {
  b.position.set(x, y, z);
  b.previousPosition.set(x, y, z);
  b.interpolatedPosition.set(x, y, z);
}
function setBodyYaw(b, yaw) {
  b.quaternion.setFromEuler(0, yaw, 0);
  b.previousQuaternion.copy(b.quaternion);
  b.interpolatedQuaternion.copy(b.quaternion);
}
function staticBody(w, h, d, x, y, z, group = GROUP.STATIC) {
  const b = new CANNON.Body({ mass: 0, type: CANNON.Body.STATIC, material: PM.def, collisionFilterGroup: group, collisionFilterMask: 0xffff });
  b.addShape(new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2)));
  b.position.set(x, y, z);
  b.kind = group === GROUP.FLOOR ? 'floor' : 'static';
  world.addBody(b);
  return b;
}

// is a wall between two points? (props and enemies don't count)
const _rayRes = new CANNON.RaycastResult();
const _rf = new CANNON.Vec3(), _rt = new CANNON.Vec3();
function wallBetween(a, b) {
  _rf.set(a.x, a.y, a.z); _rt.set(b.x, b.y, b.z);
  _rayRes.reset();
  world.raycastClosest(_rf, _rt, { collisionFilterMask: GROUP.STATIC, skipBackfaces: true }, _rayRes);
  return _rayRes.hasHit && _rayRes.body && _rayRes.body.kind === 'static' && !_rayRes.body.ent ? _rayRes : null;
}

// time control
function hitStop(s) { G.hitStop = Math.max(G.hitStop, s); }
function slowMo(scale, s) { G.slowScale = Math.min(G.slowT > 0 ? G.slowScale : 1, scale); G.slowT = Math.max(G.slowT, s); }
function shake(a) { G.trauma = Math.min(1, G.trauma + a * (REDUCED ? 0.35 : 1)); }

const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const _t1 = new THREE.Vector3(), _t2 = new THREE.Vector3(), _t3 = new THREE.Vector3();

// palette for furniture
const C = {
  wood: 0x9b6a43, dark: 0x5a3a26, light: 0xc89a68, cream: 0xeadfc8, white: 0xf2efe6, red: 0xc83c3c,
  blue: 0x3f6fb5, teal: 0x3a9a92, green: 0x5c9a4a, yellow: 0xf2c53d, black: 0x26232e, grey: 0x8a8a94,
  steel: 0xb8bcc6, orange: 0xe8862e, pink: 0xe58fb1, purple: 0x7a4fa8, brown: 0x6b4a2f, stone: 0x8d8a96,
  felt: 0x2f7a4c, gold: 0xe0b23a,
};
