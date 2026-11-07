
// ================= HOUSE: walls, rooms, navigation, yard, furniture =================
const WALL_H = 3.2, WALL_T = 0.4;
const ROOMS = [
  { name: 'Living Room', x0: -12, x1: 2, z0: 0, z1: 9 },
  { name: 'Bedroom', x0: 2, x1: 12, z0: 0, z1: 9 },
  { name: 'Kitchen', x0: -12, x1: -2, z0: -9, z1: 0 },
  { name: 'Den', x0: -2, x1: 7, z0: -9, z1: 0 },
  { name: 'Bathroom', x0: 7, x1: 12, z0: -9, z1: 0 },
];
function roomAt(x, z) {
  for (let i = 0; i < ROOMS.length; i++) {
    const r = ROOMS[i];
    if (x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1) return i;
  }
  return -1;
}
const PORTALS = [];
function addPortal(x, z, nx, nz, kind) {
  const pa = { x: x + nx * 1.05, z: z + nz * 1.05 }, pb = { x: x - nx * 1.05, z: z - nz * 1.05 };
  const p = { x, z, nx, nz, kind, a: roomAt(pa.x, pa.z), b: roomAt(pb.x, pb.z), pa, pb, glass: null };
  PORTALS.push(p);
  return p;
}
const _bfsPrev = new Map();
function nextWaypoint(fx, fz, tx, tz) {
  const rf = roomAt(fx, fz), rt = roomAt(tx, tz);
  if (rf === rt) return null;
  _bfsPrev.clear(); _bfsPrev.set(rf, null);
  const q = [rf];
  while (q.length) {
    const r = q.shift();
    if (r === rt) break;
    for (const p of PORTALS) {
      const n = p.a === r ? p.b : p.b === r ? p.a : null;
      if (n === null || _bfsPrev.has(n)) continue;
      _bfsPrev.set(n, r); q.push(n);
    }
  }
  if (!_bfsPrev.has(rt)) return null;
  let n = rt;
  while (_bfsPrev.get(n) !== rf) n = _bfsPrev.get(n);
  let best = null, bd = 1e9;
  for (const p of PORTALS) {
    if ((p.a === rf && p.b === n) || (p.b === rf && p.a === n)) {
      const d = (p.x - fx) ** 2 + (p.z - fz) ** 2 + (p.kind === 'window' ? 9 : 0);
      if (d < bd) { bd = d; best = p; }
    }
  }
  if (!best) return null;
  const near = best.a === rf ? best.pa : best.pb, far = best.a === n ? best.pa : best.pb;
  const dx = fx - best.x, dz = fz - best.z;
  const s = Math.abs(dx * best.nx + dz * best.nz), lat = Math.abs(-dx * best.nz + dz * best.nx);
  const through = s < 1.15 && lat < 0.55;
  return { x: through ? far.x : near.x, z: through ? far.z : near.z, portal: best, through };
}

const WALL_COL = 0xb6a2c8, WAINSCOT = 0x5e4a72, TRIM = 0xe8dcc8;
function wallPiece(axis, c, s0, s1, y0, y1) {
  const len = s1 - s0, hgt = y1 - y0;
  if (len < 0.01 || hgt < 0.01) return;
  const mid = (s0 + s1) / 2;
  const w = axis === 'x' ? len : WALL_T, d = axis === 'x' ? WALL_T : len;
  const x = axis === 'x' ? mid : c, z = axis === 'x' ? c : mid;
  staticBody(w, hgt, d, x, (y0 + y1) / 2, z);
  // visual: dark wainscot below 1m, wallpaper above, trim strip
  const split = 1.0;
  if (y0 < split && y1 > split) {
    const a = boxMesh(w, split - y0, d, WAINSCOT); a.position.set(x, (y0 + split) / 2, z); scene.add(a);
    const b = boxMesh(w, y1 - split, d, WALL_COL); b.position.set(x, (split + y1) / 2, z); scene.add(b);
    const t = boxMesh(w + 0.04, 0.06, d + 0.04, TRIM, null, false); t.position.set(x, split, z); t.castShadow = false; scene.add(t);
  } else {
    const a = boxMesh(w, hgt, d, y1 <= split ? WAINSCOT : WALL_COL); a.position.set(x, (y0 + y1) / 2, z); scene.add(a);
  }
}
// holes: {c, w, y0, y1}
function wall(axis, c, a0, a1, holes = []) {
  holes.sort((p, q) => p.c - q.c);
  let cur = a0;
  for (const h of holes) {
    const s0 = h.c - h.w / 2, s1 = h.c + h.w / 2;
    wallPiece(axis, c, cur, s0, 0, WALL_H);
    wallPiece(axis, c, s0, s1, 0, h.y0);
    wallPiece(axis, c, s0, s1, h.y1, WALL_H);
    cur = s1;
  }
  wallPiece(axis, c, cur, a1, 0, WALL_H);
}
const DOOR = (c, w = 2.2) => ({ c, w, y0: 0, y1: 2.6 });
const WIN = (c, w = 1.8) => ({ c, w, y0: 0.5, y1: 2.7 });

function floorTex(kind, rx, ry) {
  return canvasTex(256, 256, (g, w, h) => {
    if (kind === 'wood') {
      for (let i = 0; i < 8; i++) {
        g.fillStyle = ['#8a5a36', '#7b4f2f', '#946340', '#83552f'][i % 4];
        g.fillRect(0, i * 32, w, 32);
        g.fillStyle = '#00000033'; g.fillRect(0, i * 32, w, 2);
        g.fillRect(((i * 97) % 200) + 20, i * 32, 2, 32);
      }
    } else if (kind === 'check') {
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? '#2b2b3a' : '#e9e2d0'; g.fillRect(i * 64, j * 64, 64, 64); }
    } else if (kind === 'tile') {
      g.fillStyle = '#d7efe9'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#8fc9bd';
      for (let i = 0; i <= 8; i++) { g.fillRect(i * 32 - 1, 0, 2, h); g.fillRect(0, i * 32 - 1, w, 2); }
    } else if (kind === 'carpet' || kind === 'rug' || kind === 'grass') {
      const base = { carpet: [92, 60, 120], rug: [120, 40, 48], grass: [44, 74, 40] }[kind];
      for (let i = 0; i < 2600; i++) {
        const k = rand(-18, 18);
        g.fillStyle = `rgb(${base[0] + k},${base[1] + k},${base[2] + k})`;
        g.fillRect(rand(0, w), rand(0, h), 4, 4);
      }
      if (kind === 'grass') { g.globalCompositeOperation = 'destination-over'; g.fillStyle = 'rgb(44,74,40)'; g.fillRect(0, 0, w, h); }
      else { g.globalCompositeOperation = 'destination-over'; g.fillStyle = `rgb(${base})`; g.fillRect(0, 0, w, h); }
    }
  }, rx, ry);
}
function floorPlane(x0, x1, z0, z1, tex, y = 0.004) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshToonMaterial({ map: tex, gradientMap: gradTex }));
  m.rotation.x = -Math.PI / 2;
  m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
  m.receiveShadow = true;
  scene.add(m);
}

const SPAWNS = [];
const GRAVE_SPOTS = [];
function buildHouse() {
  // ---- lights ----
  scene.add(new THREE.HemisphereLight(0x9d8cff, 0x3a2a1a, 1.25));
  const moon = new THREE.DirectionalLight(0xc6cfff, 1.7);
  moon.position.set(-22, 30, 16);
  moon.castShadow = true;
  const sc = moon.shadow.camera;
  sc.left = -24; sc.right = 24; sc.top = 24; sc.bottom = -24; sc.near = 1; sc.far = 90;
  moon.shadow.mapSize.set(2048, 2048);
  moon.shadow.bias = -0.0006; moon.shadow.normalBias = 0.03;
  scene.add(moon, moon.target);
  for (const r of ROOMS) {
    const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
    const L = new THREE.PointLight(0xffc98a, 16, 16, 1.5);
    L.position.set(cx, 2.75, cz);
    scene.add(L);
    const cord = cylMesh(0.01, 0.35, 0.01, C.black, null, false, 6); cord.position.set(cx, WALL_H - 0.17, cz); cord.castShadow = false; scene.add(cord);
    const bulb = sphMesh(0.12, 0xfff1c4, { emissive: 0xffd58a, emissiveIntensity: 2 }); bulb.position.set(cx, 2.86, cz); bulb.castShadow = false; scene.add(bulb);
  }
  for (let i = 0; i < 3; i++) freeLight(new THREE.PointLight(0xffc27a, 0, 8, 2)); // pre-warm lamp light pool

  // ---- ground + floors ----
  staticBody(160, 1, 160, 0, -0.5, 0, GROUP.FLOOR);
  floorPlane(-80, 80, -80, 80, floorTex('grass', 40, 40), 0);
  floorPlane(-12, 2, 0, 9, floorTex('wood', 4, 3));
  floorPlane(2, 12, 0, 9, floorTex('carpet', 4, 4));
  floorPlane(-12, -2, -9, 0, floorTex('check', 5, 4.5));
  floorPlane(-2, 7, -9, 0, floorTex('wood', 3, 3));
  floorPlane(7, 12, -9, 0, floorTex('tile', 3, 5));
  floorPlane(-10.5, -6, 1.2, 5.2, floorTex('rug', 2, 2), 0.008);
  // path + porch + road
  const path = boxMesh(2.4, 0.04, 9, 0x8d8579); path.position.set(-5, 0.02, 14); path.castShadow = false; scene.add(path);
  const road = boxMesh(160, 0.03, 8, 0x2a2733); road.position.set(0, 0.015, 26); road.castShadow = false; scene.add(road);
  const drive = boxMesh(3.4, 0.035, 12, 0x5f5a66); drive.position.set(8, 0.02, 16); drive.castShadow = false; scene.add(drive);

  // ---- ceiling + roof (no shadows so the moon still lights the rooms) ----
  staticBody(24.8, 0.3, 18.8, 0, WALL_H + 0.15, 0);
  const ceil = boxMesh(24.8, 0.3, 18.8, 0x3b2f4d); ceil.position.set(0, WALL_H + 0.15, 0); ceil.castShadow = false; scene.add(ceil);
  const roof = mkMesh(new THREE.ConeGeometry(17.9, 4.2, 4, 1), toon(0x3a2436), false);
  roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 10.2 / 13.1);
  roof.position.set(0, WALL_H + 0.3 + 2.1, 0);
  scene.add(roof);
  const chim = boxMesh(1, 2.5, 1, 0x7a3b30); chim.position.set(6, WALL_H + 3.2, -3); scene.add(chim);

  // ---- exterior walls ----
  wall('x', 9, -12.2, 12.2, [DOOR(-5, 1.8), WIN(-9.5), WIN(-1), WIN(7)]);
  wall('x', -9, -12.2, 12.2, [DOOR(-3.6, 1.8), WIN(-6.2), WIN(2.5), WIN(9, 1.4)]);
  wall('z', -12, -9, 9, [WIN(5), WIN(-5)]);
  wall('z', 12, -9, 9, [WIN(5), WIN(-4)]);
  // ---- interior walls ----
  wall('x', 0, -11.8, 11.8, [DOOR(-7), DOOR(0), DOOR(4.5)]);
  wall('z', 2, 0.2, 8.8, [DOOR(4.5)]);
  wall('z', -2, -8.8, -0.2, [DOOR(-5)]);
  wall('z', 7, -8.8, -0.2, [DOOR(-2, 1.8)]);

  // ---- portals (navigation) ----
  [[-7, 0, 0, 1], [0, 0, 0, 1], [4.5, 0, 0, 1], [2, 4.5, 1, 0], [-2, -5, 1, 0], [7, -2, 1, 0]].forEach((a) => addPortal(...a, 'door'));
  const front = addPortal(-5, 9, 0, 1, 'door'), back = addPortal(-3.6, -9, 0, -1, 'door');
  const wins = [[-9.5, 9, 0, 1], [-1, 9, 0, 1], [7, 9, 0, 1], [-6.2, -9, 0, -1], [2.5, -9, 0, -1], [9, -9, 0, -1], [-12, 5, -1, 0], [-12, -5, -1, 0], [12, 5, 1, 0], [12, -4, 1, 0]]
    .map((a) => addPortal(...a, 'window'));
  // doors + glass are breakable static props
  for (const [p, type] of [[front, 'door'], [back, 'door'], ...wins.map((w) => [w, 'glass'])]) {
    const r = p.nz !== 0 ? 0 : 1;
    const h = PROP_DEFS[type].size[1];
    const y = type === 'door' ? h / 2 : 0.5 + h / 2;
    const g = spawnProp(type, p.x, p.z, r, y);
    if (type === 'glass' && p.x === 9 && p.z === -9) g.mesh.scale.x = 1;
    g.spawn.portal = p;
    p.glass = g;
    // sill
    if (type === 'glass') {
      const sill = boxMesh(p.nz ? 2 : 0.6, 0.06, p.nz ? 0.6 : 2, TRIM); sill.position.set(p.x, 0.5, p.z); scene.add(sill);
    }
    // spawn points outside each exterior opening
    SPAWNS.push({ x: p.x + p.nx * 6, z: p.z + p.nz * 6, lx: -p.nz, lz: p.nx });
  }

  // ---- yard ----
  for (const [x, z] of [[-26, 0], [26, 0], [0, -26], [0, 26.5]]) {
    const b = staticBody(x ? 1 : 54, 12, x ? 54 : 1, x, 6, z);
    b.kind = 'static';
  }
  const fenceM = toon(0x2a2236);
  for (let i = -24; i <= 24; i += 2) {
    for (const [x, z] of [[i, -24], [i, 23], [-24, i], [24, i]]) {
      const post = mkMesh(geo('b', 0.15, 1.3, 0.15), fenceM); post.position.set(x, 0.65, z); scene.add(post);
      const tip = mkMesh(geo('c', 0, 0.25, 0.1, 4), fenceM); tip.position.set(x, 1.42, z); scene.add(tip);
    }
  }
  for (const [x, z, len, rot] of [[0, -24, 48, 0], [0, 23, 48, 0], [-24, 0, 48, 1], [24, 0, 48, 1]]) {
    const rail = mkMesh(geo('b', len, 0.08, 0.08), fenceM); rail.position.set(x, 1.0, z); rail.rotation.y = rot * PI2; scene.add(rail);
  }
  const trunkM = toon(0x2b1c18), leafM = toon(0x1d2a2a);
  for (let i = 0; i < 26; i++) {
    const a = rand(0, Math.PI * 2), d = rand(30, 60);
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    const tr = mkMesh(geo('c', 0.3, 3, 0.45, 6), trunkM); tr.position.set(x, 1.5, z); scene.add(tr);
    const lf = mkMesh(geo('c', 0, rand(5, 8), 2.6, 7), leafM); lf.position.set(x, 5.5, z); scene.add(lf);
  }
  const moonM = new THREE.Mesh(new THREE.SphereGeometry(6, 24, 16), new THREE.MeshBasicMaterial({ color: 0xfff4d6, fog: false }));
  moonM.position.set(-70, 60, -110); scene.add(moonM);
  const sv = [];
  for (let i = 0; i < 700; i++) {
    const a = rand(0, Math.PI * 2), e = rand(0.15, 1.4), r = 160;
    sv.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r);
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sv, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, fog: false })));
  // porch light
  const porch = new THREE.PointLight(0xff9a5a, 14, 12, 1.6); porch.position.set(-5, 2.8, 10.2); scene.add(porch);

  furnish();
}

// [type, x, z, quarterTurns, y]
const FURNITURE = [
  // living room
  ['tvstand', -11.5, 3.2, 1], ['tv', -11.5, 3.2, 1, 0.6 + 0.35], ['vase', -11.5, 2.4, 0, 0.6 + 0.275], ['vase', -11.5, 4.0, 0, 0.6 + 0.275],
  ['sofa', -7.6, 3.2, 3], ['coffee', -9.6, 3.2, 1], ['book', -9.6, 2.8, 0, 0.45 + 0.03], ['book', -9.6, 2.8, 1, 0.45 + 0.09],
  ['pk_shake', -9.55, 3.6, 0, 0.45 + 0.17], ['dumbbell', -9.0, 5.6, 0], ['armchair', -10.2, 6.9, 1], ['bookshelf', -3.0, 8.55, 2],
  ['lamp', -11.4, 8.4, 0], ['lamp', 1.4, 8.4, 0], ['piano', 1.35, 1.7, 3], ['plant', -11.4, 0.6, 0], ['plant', 1.4, 6.6, 0],
  ['clock', -4.0, 0.45, 0], ['vase', -5.4, 0.45, 0], ['chair', -4.5, 6.5, 2], ['book', -2.5, 8.55, 0, 2.03], ['book', -3.4, 8.55, 1, 2.03],
  // kitchen
  ['fridge', -11.35, -8.3, 1], ['counter', -9.9, -8.45, 0], ['stove', -8.9, -8.45, 0], ['counter', -7.7, -8.45, 0],
  ['microwave', -9.95, -8.5, 0, 0.95 + 0.16], ['pan', -8.9, -8.4, 1, 0.95 + 0.035], ['toaster', -7.45, -8.5, 0, 0.95 + 0.11],
  ['bottle', -7.95, -8.3, 0, 0.95 + 0.17], ['bottle', -7.8, -8.6, 0, 0.95 + 0.17], ['pk_espresso', -10.3, -8.25, 0, 0.95 + 0.07],
  ['table', -7, -4.5, 0], ['chair', -7.4, -3.55, 2], ['chair', -6.6, -3.55, 2], ['chair', -7.4, -5.45, 0], ['chair', -6.6, -5.45, 0],
  ['watermelon', -7.45, -4.55, 0, 0.78 + 0.18], ['plate', -6.7, -4.75, 0, 0.78 + 0.02], ['plate', -6.7, -4.75, 0, 0.78 + 0.06], ['plate', -6.7, -4.75, 0, 0.78 + 0.1],
  ['pk_pizza', -6.45, -4.2, 0, 0.78 + 0.03], ['pk_garlic', -7.15, -4.2, 0, 0.78 + 0.06], ['propane', -11.4, -1.0, 0], ['crate', -3.0, -1.0, 0],
  // den
  ['pooltable', 2.5, -5.0, 0], ['cue', 0.6, -5.0, 0], ['arcade', 6.2, -8.2, 0], ['beanbag', -1.0, -8.0, 0],
  ['crate', 6.2, -6.4, 0], ['crate', 6.2, -6.4, 0, 0.7 + 0.35], ['crate', 5.4, -6.4, 0], ['bat', 0.5, -2.5, 1],
  ['tankstand', -1.45, -2.3, 1], ['fishtank', -1.45, -2.3, 1, 0.7 + 0.3], ['propane', 6.4, -4.0, 0], ['pk_spinach', 3.45, -4.55, 0, 0.88 + 0.1],
  // bedroom
  ['bed', 10.8, 7.5, 0], ['teddy', 10.8, 7.9, 0, 0.7 + 0.25], ['nightstand', 9.2, 8.5, 0], ['pk_preworkout', 9.2, 8.5, 0, 0.55 + 0.12],
  ['lamp', 8.4, 8.4, 0], ['wardrobe', 3.2, 8.45, 2], ['mirror', 11.7, 1.6, 3], ['guitar', 7.8, 0.6, 0], ['dumbbell', 6.5, 5.5, 1], ['chair', 5.2, 7.4, 0],
  // bathroom
  ['toilet', 11.35, -8.2, 3], ['tub', 11.35, -1.5, 1], ['pk_duck', 11.35, -1.5, 0, 0.6 + 0.1], ['sink', 7.6, -8.4, 0],
  ['plunger', 10.4, -8.4, 0], ['tp', 10.6, -7.6, 0], ['tp', 10.6, -7.6, 0, 0.12 + 0.06],
  // yard
  ['pumpkin', -6.6, 10.2, 0], ['pumpkin', -3.4, 10.3, 0], ['pumpkin', -9.2, 11.0, 0], ['gnome', 3, 12, 0], ['gnome', -12, 12.5, 0], ['gnome', 10.5, 11, 0],
  ['car', 8, 15.5, 0], ['trashcan', 13.4, 8, 0], ['trashcan', 13.4, 9, 0], ['mailbox', -7.2, 18, 0],
];
function furnish() {
  for (const [t, x, z, r, y] of FURNITURE) spawnProp(t, x, z, r, y ?? null);
  // pool balls in a rack
  let i = 0;
  for (let row = 0; row < 4; row++) for (let k = 0; k <= row; k++) {
    spawnProp('ball', 3.0 + row * 0.18, -5.0 + (k - row / 2) * 0.21, 0, 0.88 + 0.11);
    i++;
  }
  spawnProp('ball', 1.7, -5.0, 0, 0.99, { tint: 0xffffff });
  // graveyard in the back yard
  for (let gx = -10; gx <= 10; gx += 4) for (const gz of [-15, -19]) {
    const x = gx + rand(-0.6, 0.6), z = gz + rand(-0.5, 0.5);
    spawnProp('grave', x, z, 0);
    GRAVE_SPOTS.push({ x, z: z + 1.2 });
  }
}
