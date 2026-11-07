
// ================= PROP DEFINITIONS =================
// parts: [kind, dims, pos, color, opts]  kind b=box [w,h,d], c=cylinder [rTop,h,rBottom,seg], s=sphere [r]
// opts: rx ry rz (rotation), sx sy sz (scale), e (emissive), ei (emissive intensity), o (opacity). color 'T' = per-instance tint
const PI2 = Math.PI / 2;
const legs4 = (w, h, d, x, y, z, c) => [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b]) => ['b', [w, h, d], [x * a, y, z * b], c]);
const PROP_DEFS = {
  chair: { label: 'Chair', size: [0.5, 1, 0.5], mass: 7, hp: 22, mat: 'wood', value: 120, parts: [
    ['b', [0.5, 0.07, 0.5], [0, -0.02, 0], C.wood], ...legs4(0.06, 0.46, 0.06, 0.2, -0.27, 0.2, C.dark),
    ['b', [0.5, 0.5, 0.06], [0, 0.25, -0.22], C.wood], ['b', [0.36, 0.08, 0.07], [0, 0.36, -0.22], C.light]] },
  table: { label: 'Kitchen Table', size: [1.6, 0.78, 1], mass: 25, hp: 45, mat: 'wood', value: 450, parts: [
    ['b', [1.6, 0.08, 1], [0, 0.35, 0], C.wood], ...legs4(0.08, 0.7, 0.08, 0.7, -0.04, 0.4, C.dark)] },
  coffee: { label: 'Coffee Table', size: [1.2, 0.45, 0.7], mass: 15, hp: 30, mat: 'wood', value: 300, parts: [
    ['b', [1.2, 0.07, 0.7], [0, 0.19, 0], C.dark], ...legs4(0.07, 0.38, 0.07, 0.52, -0.035, 0.28, C.dark), ['b', [1.1, 0.04, 0.6], [0, -0.12, 0], C.wood]] },
  sofa: { label: 'Sofa', size: [2.2, 0.9, 0.9], mass: 45, hp: 80, mat: 'soft', value: 1400, parts: [
    ['b', [2.2, 0.42, 0.9], [0, -0.24, 0], C.teal], ['b', [2.2, 0.55, 0.24], [0, 0.17, -0.33], C.teal],
    ['b', [0.22, 0.62, 0.9], [0.99, -0.14, 0], 0x2f827b], ['b', [0.22, 0.62, 0.9], [-0.99, -0.14, 0], 0x2f827b],
    ['b', [0.86, 0.14, 0.62], [0.45, 0.04, 0.08], 0x56b8ae], ['b', [0.86, 0.14, 0.62], [-0.45, 0.04, 0.08], 0x56b8ae]] },
  armchair: { label: 'Armchair', size: [1, 0.9, 0.9], mass: 22, hp: 50, mat: 'soft', value: 700, parts: [
    ['b', [1, 0.42, 0.9], [0, -0.24, 0], 0xa8443f], ['b', [1, 0.55, 0.22], [0, 0.17, -0.34], 0xa8443f],
    ['b', [0.18, 0.6, 0.9], [0.41, -0.15, 0], 0x8c3531], ['b', [0.18, 0.6, 0.9], [-0.41, -0.15, 0], 0x8c3531], ['b', [0.64, 0.14, 0.62], [0, 0.04, 0.08], 0xc45a52]] },
  tv: { label: 'CRT Television', size: [0.9, 0.7, 0.6], mass: 25, hp: 14, mat: 'electric', value: 1500, parts: [
    ['b', [0.9, 0.7, 0.6], [0, 0, 0], 0x6b4a32], ['b', [0.66, 0.5, 0.02], [-0.06, 0.02, 0.305], 0x4a7fe0, { e: 0x3a6fd8, ei: 1.3 }],
    ['c', [0.03, 0.03, 0.03], [0.36, 0.12, 0.31], C.black, { rx: PI2 }], ['c', [0.03, 0.03, 0.03], [0.36, -0.02, 0.31], C.black, { rx: PI2 }],
    ['c', [0.01, 0.6, 0.01], [-0.15, 0.6, 0], C.steel, { rz: 0.5 }], ['c', [0.01, 0.6, 0.01], [0.15, 0.6, 0], C.steel, { rz: -0.5 }]] },
  tvstand: { label: 'TV Stand', size: [2, 0.6, 0.5], mass: 22, hp: 40, mat: 'wood', value: 250, parts: [
    ['b', [2, 0.06, 0.5], [0, 0.27, 0], C.dark], ['b', [0.06, 0.54, 0.5], [0.97, -0.03, 0], C.dark], ['b', [0.06, 0.54, 0.5], [-0.97, -0.03, 0], C.dark],
    ['b', [1.9, 0.04, 0.46], [0, -0.05, 0], C.wood], ['b', [2, 0.05, 0.5], [0, -0.275, 0], C.dark]] },
  lamp: { label: 'Floor Lamp', size: [0.4, 1.6, 0.4], mass: 5, hp: 8, mat: 'electric', value: 180, light: { c: 0xffc27a, i: 7, d: 8, y: 0.45 }, parts: [
    ['c', [0.18, 0.06, 0.2], [0, -0.77, 0], C.gold], ['c', [0.025, 1.2, 0.025], [0, -0.15, 0], C.gold],
    ['c', [0.14, 0.38, 0.24], [0, 0.55, 0], 0xf6e3b4, { e: 0xffc77a, ei: 0.9 }]] },
  vase: { label: 'Ming Vase', size: [0.32, 0.55, 0.32], mass: 2, hp: 3, mat: 'ceramic', value: 4000, parts: [
    ['c', [0.16, 0.3, 0.1], [0, -0.125, 0], 0xe9eef7], ['c', [0.09, 0.25, 0.16], [0, 0.15, 0], 0xe9eef7],
    ['c', [0.163, 0.04, 0.163], [0, 0.02, 0], C.blue], ['c', [0.1, 0.04, 0.1], [0, 0.24, 0], C.blue]] },
  plant: { label: 'Ficus', size: [0.5, 1.1, 0.5], mass: 6, hp: 6, mat: 'ceramic', value: 60, parts: [
    ['c', [0.22, 0.4, 0.17], [0, -0.35, 0], 0xc0643b], ['c', [0.2, 0.02, 0.2], [0, -0.15, 0], C.brown], ['c', [0.03, 0.3, 0.04], [0, -0.05, 0], C.brown],
    ['s', [0.24], [0, 0.12, 0], C.green], ['s', [0.2], [0.12, 0.32, 0.05], 0x6fb35a], ['s', [0.17], [-0.1, 0.36, -0.06], 0x4f8a3e]] },
  bookshelf: { label: 'Bookshelf', size: [1.6, 2, 0.4], mass: 40, hp: 60, mat: 'wood', value: 600, parts: [
    ['b', [0.06, 2, 0.4], [0.77, 0, 0], C.dark], ['b', [0.06, 2, 0.4], [-0.77, 0, 0], C.dark], ['b', [1.6, 0.06, 0.4], [0, 0.97, 0], C.dark], ['b', [1.6, 2, 0.03], [0, 0, -0.185], C.wood],
    ...[-0.95, -0.45, 0.05, 0.5].map((y) => ['b', [1.5, 0.04, 0.38], [0, y, 0], C.dark]),
    ['b', [0.6, 0.34, 0.28], [-0.4, -0.75, 0.02], C.red], ['b', [0.5, 0.3, 0.28], [0.3, -0.77, 0.02], C.blue], ['b', [0.7, 0.36, 0.28], [-0.3, -0.25, 0.02], C.green],
    ['b', [0.4, 0.3, 0.28], [0.45, -0.28, 0.02], C.yellow], ['b', [0.9, 0.34, 0.28], [0, 0.24, 0.02], C.purple], ['b', [0.5, 0.32, 0.28], [-0.45, 0.7, 0.02], C.orange], ['b', [0.4, 0.28, 0.28], [0.4, 0.68, 0.02], C.teal]] },
  book: { label: 'Book', size: [0.24, 0.06, 0.32], mass: 0.6, hp: 3, mat: 'paper', value: 25, parts: [['b', [0.24, 0.06, 0.32], [0, 0, 0], 'T'], ['b', [0.025, 0.062, 0.322], [-0.11, 0, 0], C.cream]] },
  piano: { label: 'Piano', size: [1.6, 1.3, 0.9], mass: 140, hp: 120, mat: 'wood', value: 9000, piano: true, parts: [
    ['b', [1.6, 1.3, 0.55], [0, 0, -0.175], 0x1d1a22], ['b', [1.5, 0.08, 0.32], [0, -0.08, 0.26], C.white], ['b', [1.4, 0.03, 0.14], [0, -0.025, 0.18], C.black],
    ['b', [0.08, 0.6, 0.08], [0.68, -0.35, 0.38], 0x1d1a22], ['b', [0.08, 0.6, 0.08], [-0.68, -0.35, 0.38], 0x1d1a22], ['b', [1.62, 0.04, 0.57], [0, 0.66, -0.175], 0x2a2630]] },
  clock: { label: 'Grandfather Clock', size: [0.6, 2.1, 0.4], mass: 30, hp: 35, mat: 'wood', value: 2600, parts: [
    ['b', [0.5, 1.86, 0.36], [0, 0, 0], C.dark], ['b', [0.6, 0.12, 0.4], [0, 0.99, 0], C.wood], ['b', [0.6, 0.12, 0.4], [0, -0.99, 0], C.wood],
    ['c', [0.17, 0.03, 0.17], [0, 0.62, 0.185], C.cream, { rx: PI2 }], ['b', [0.02, 0.6, 0.02], [0, 0.1, 0.19], C.gold], ['c', [0.07, 0.02, 0.07], [0, -0.22, 0.19], C.gold, { rx: PI2 }]] },
  fridge: { label: 'Fridge', size: [0.9, 1.9, 0.8], mass: 90, hp: 90, mat: 'metal', value: 2200, fridge: true, parts: [
    ['b', [0.9, 1.9, 0.8], [0, 0, 0], 0xeef1f4], ['b', [0.88, 0.02, 0.02], [0, 0.35, 0.405], C.grey], ['b', [0.04, 0.4, 0.05], [0.36, 0.7, 0.42], C.steel],
    ['b', [0.04, 0.6, 0.05], [0.36, -0.1, 0.42], C.steel], ['b', [0.12, 0.12, 0.01], [-0.2, 0.6, 0.405], C.red], ['b', [0.18, 0.24, 0.01], [-0.1, -0.2, 0.405], C.yellow]] },
  counter: { label: 'Counter', size: [1.2, 0.95, 0.65], mass: 70, hp: 70, mat: 'wood', value: 900, parts: [
    ['b', [1.16, 0.86, 0.6], [0, -0.045, -0.01], 0x6f8fa8], ['b', [1.2, 0.06, 0.65], [0, 0.445, 0], 0xd8d2c4], ['b', [0.02, 0.7, 0.01], [0, -0.05, 0.295], C.dark],
    ['s', [0.025], [0.08, 0.05, 0.31], C.steel], ['s', [0.025], [-0.08, 0.05, 0.31], C.steel]] },
  stove: { label: 'Stove', size: [0.8, 0.95, 0.65], mass: 60, hp: 60, mat: 'metal', value: 1100, parts: [
    ['b', [0.8, 0.9, 0.62], [0, -0.025, 0], 0xf0ece2], ['b', [0.8, 0.04, 0.65], [0, 0.455, 0], C.black],
    ...[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b]) => ['c', [0.1, 0.02, 0.1], [0.18 * a, 0.48, 0.15 * b], 0x3a3a3a]),
    ['b', [0.6, 0.3, 0.01], [0, -0.1, 0.315], 0x222222, { e: 0xff7a2a, ei: 0.5 }]] },
  plate: { label: 'Plate', size: [0.28, 0.04, 0.28], mass: 0.4, hp: 1, mat: 'ceramic', value: 15, parts: [['c', [0.14, 0.03, 0.11], [0, 0, 0], C.white]] },
  bottle: { label: 'Bottle', size: [0.1, 0.34, 0.1], mass: 0.5, hp: 1, mat: 'glass', value: 20, parts: [
    ['c', [0.05, 0.22, 0.05], [0, -0.06, 0], 0x3f8f4a, { o: 0.85 }], ['c', [0.02, 0.12, 0.04], [0, 0.11, 0], 0x3f8f4a, { o: 0.85 }]] },
  watermelon: { label: 'Watermelon', size: [0.42, 0.36, 0.36], mass: 5, hp: 2, mat: 'food', value: 8, gore: [0xe8384a, 0x3e8c3a, 0xffffff], parts: [['s', [0.21], [0, 0, 0], 0x3e8c3a, { sy: 0.85, sz: 0.85 }]] },
  pan: { label: 'Frying Pan', size: [0.3, 0.06, 0.62], mass: 2, hp: 9999, mat: 'metal', value: 40, weapon: { dmg: 34, knock: 1.5, reach: 2.8, sound: 'metal', word: 'BONK!' }, parts: [
    ['c', [0.15, 0.05, 0.13], [0, 0, -0.15], 0x2b2b30], ['b', [0.05, 0.04, 0.3], [0, 0.01, 0.16], 0x1a1a1e]] },
  microwave: { label: 'Microwave', size: [0.55, 0.32, 0.4], mass: 12, hp: 12, mat: 'electric', value: 250, parts: [
    ['b', [0.55, 0.32, 0.4], [0, 0, 0], 0xdcdcdc], ['b', [0.32, 0.22, 0.01], [-0.06, 0, 0.2], 0x222222, { e: 0xffcf6b, ei: 0.3 }], ['b', [0.1, 0.24, 0.01], [0.19, 0, 0.2], 0x555555]] },
  toaster: { label: 'Toaster', size: [0.3, 0.22, 0.18], mass: 3, hp: 8, mat: 'electric', value: 60, parts: [
    ['b', [0.3, 0.2, 0.18], [0, -0.01, 0], C.steel], ['b', [0.22, 0.01, 0.04], [0, 0.095, 0.04], C.black], ['b', [0.22, 0.01, 0.04], [0, 0.095, -0.04], C.black]] },
  propane: { label: 'Propane Tank', size: [0.36, 0.8, 0.36], mass: 15, hp: 16, mat: 'metal', value: 60, explosive: true, parts: [
    ['c', [0.18, 0.56, 0.18], [0, -0.06, 0], 0xf2f2f2], ['s', [0.18], [0, 0.22, 0], 0xf2f2f2, { sy: 0.5 }], ['c', [0.05, 0.1, 0.05], [0, 0.34, 0], C.steel],
    ['c', [0.182, 0.14, 0.182], [0, -0.05, 0], C.red], ['c', [0.16, 0.08, 0.16], [0, -0.36, 0], C.grey]] },
  bed: { label: 'Bed', size: [1.8, 0.7, 2.3], mass: 60, hp: 90, mat: 'soft', value: 1300, parts: [
    ['b', [1.8, 0.3, 2.3], [0, -0.2, 0], C.dark], ['b', [1.7, 0.2, 2.2], [0, 0.05, 0], C.white], ['b', [1.74, 0.08, 1.5], [0, 0.17, 0.35], C.purple],
    ['b', [0.6, 0.12, 0.35], [0.42, 0.2, -0.85], C.cream], ['b', [0.6, 0.12, 0.35], [-0.42, 0.2, -0.85], C.cream], ['b', [1.8, 0.9, 0.1], [0, 0.1, -1.1], C.wood]] },
  wardrobe: { label: 'Wardrobe', size: [1.4, 2.1, 0.6], mass: 70, hp: 80, mat: 'wood', value: 1100, loot: 0.6, parts: [
    ['b', [1.4, 2.1, 0.6], [0, 0, 0], C.wood], ['b', [0.02, 1.9, 0.01], [0, 0, 0.305], C.dark], ['s', [0.03], [0.08, 0, 0.31], C.gold], ['s', [0.03], [-0.08, 0, 0.31], C.gold], ['b', [1.5, 0.08, 0.65], [0, 1.04, 0], C.dark]] },
  nightstand: { label: 'Nightstand', size: [0.5, 0.55, 0.45], mass: 10, hp: 18, mat: 'wood', value: 150, parts: [
    ['b', [0.5, 0.55, 0.45], [0, 0, 0], C.light], ['b', [0.42, 0.16, 0.01], [0, 0.1, 0.23], C.wood], ['s', [0.025], [0, 0.1, 0.24], C.gold]] },
  teddy: { label: 'Mr. Snuggles', size: [0.4, 0.5, 0.3], mass: 1, hp: 6, mat: 'soft', value: 30, onBreakText: 'MR. SNUGGLES NOOO', parts: [
    ['s', [0.15], [0, -0.1, 0], 0xa0703f], ['s', [0.11], [0, 0.12, 0], 0xa0703f], ['s', [0.045], [0.08, 0.21, 0], 0xa0703f], ['s', [0.045], [-0.08, 0.21, 0], 0xa0703f],
    ['s', [0.045], [0, 0.1, 0.1], 0xd8b28a], ['s', [0.06], [0.15, -0.05, 0.03], 0xa0703f], ['s', [0.06], [-0.15, -0.05, 0.03], 0xa0703f],
    ['s', [0.065], [0.08, -0.22, 0.06], 0xa0703f], ['s', [0.065], [-0.08, -0.22, 0.06], 0xa0703f], ['s', [0.018], [0.04, 0.15, 0.095], C.black], ['s', [0.018], [-0.04, 0.15, 0.095], C.black]] },
  guitar: { label: 'Electric Guitar', size: [0.4, 1.05, 0.12], mass: 3, hp: 40, mat: 'wood', value: 900, onBreakText: 'ROCK AND ROLL!', weapon: { dmg: 30, knock: 1.3, reach: 3, sound: 'chord', word: 'SHRED!' }, parts: [
    ['c', [0.2, 0.1, 0.2], [0, -0.3, 0], 0xc0442c, { rx: PI2 }], ['c', [0.15, 0.1, 0.15], [0, -0.05, 0], 0xc0442c, { rx: PI2 }], ['b', [0.06, 0.5, 0.03], [0, 0.3, 0], C.dark],
    ['b', [0.09, 0.12, 0.03], [0, 0.58, 0], C.black], ['b', [0.16, 0.03, 0.02], [0, -0.28, 0.055], C.white]] },
  dumbbell: { label: 'Dumbbell', size: [0.5, 0.2, 0.2], mass: 20, hp: 9999, mat: 'metal', value: 80, weapon: { dmg: 48, knock: 1.8, reach: 2.4, sound: 'metal', word: 'GAINS!' }, parts: [
    ['c', [0.03, 0.5, 0.03], [0, 0, 0], C.steel, { rz: PI2 }], ['c', [0.1, 0.08, 0.1], [0.18, 0, 0], C.black, { rz: PI2 }], ['c', [0.1, 0.08, 0.1], [-0.18, 0, 0], C.black, { rz: PI2 }]] },
  mirror: { label: 'Mirror', size: [1, 1.8, 0.08], mass: 15, hp: 2, mat: 'glass', value: 300, onBreakText: '7 YEARS BAD LUCK', parts: [
    ['b', [1, 1.8, 0.06], [0, 0, -0.01], C.gold], ['b', [0.88, 1.68, 0.02], [0, 0, 0.03], 0xbfe6ff, { e: 0x6aa0c8, ei: 0.3 }]] },
  pooltable: { label: 'Pool Table', size: [2.4, 0.9, 1.3], mass: 160, hp: 150, mat: 'wood', value: 4500, parts: [
    ['b', [2.2, 0.04, 1.1], [0, 0.41, 0], C.felt], ['b', [2.4, 0.1, 0.1], [0, 0.45, 0.6], C.dark], ['b', [2.4, 0.1, 0.1], [0, 0.45, -0.6], C.dark],
    ['b', [0.1, 0.1, 1.3], [1.15, 0.45, 0], C.dark], ['b', [0.1, 0.1, 1.3], [-1.15, 0.45, 0], C.dark], ['b', [2.3, 0.3, 1.2], [0, 0.24, 0], C.dark],
    ...legs4(0.14, 0.6, 0.14, 1, -0.15, 0.5, C.dark)] },
  ball: { label: 'Pool Ball', size: [0.2, 0.2, 0.2], shape: 'sphere', bouncy: true, mass: 0.35, hp: 9999, mat: 'stone', value: 0, parts: [['s', [0.1], [0, 0, 0], 'T']] },
  cue: { label: 'Pool Cue', size: [0.06, 0.06, 1.5], mass: 0.8, hp: 18, mat: 'wood', value: 60, weapon: { dmg: 24, knock: 1.1, reach: 3.4, sound: 'wood', word: 'THWACK!' }, parts: [
    ['c', [0.012, 1.5, 0.03], [0, 0, 0], C.light, { rx: PI2 }], ['c', [0.014, 0.06, 0.014], [0, 0, 0.76], C.blue, { rx: PI2 }]] },
  bat: { label: 'Baseball Bat', size: [0.1, 0.1, 0.95], mass: 1.2, hp: 70, mat: 'wood', value: 120, weapon: { dmg: 36, knock: 1.7, reach: 2.9, sound: 'wood', word: 'HOME RUN!' }, parts: [
    ['c', [0.05, 0.95, 0.022], [0, 0, 0], 0xd9b27c, { rx: PI2 }], ['c', [0.026, 0.2, 0.026], [0, 0, -0.38], C.black, { rx: PI2 }]] },
  arcade: { label: 'Arcade Cabinet', size: [0.8, 1.8, 0.8], mass: 80, hp: 55, mat: 'electric', value: 3200, onBreakText: 'GAME OVER', parts: [
    ['b', [0.8, 1.8, 0.8], [0, 0, 0], C.purple], ['b', [0.6, 0.45, 0.02], [0, 0.45, 0.41], 0x111111, { e: 0x37ff8b, ei: 1 }], ['b', [0.7, 0.16, 0.02], [0, 0.8, 0.41], 0xffd23f, { e: 0xffb000, ei: 0.8 }],
    ['b', [0.7, 0.08, 0.3], [0, 0.05, 0.5], 0x5a3a8a], ['c', [0.02, 0.1, 0.02], [-0.15, 0.13, 0.5], C.red], ['s', [0.03], [0.1, 0.1, 0.5], C.red], ['s', [0.03], [0.2, 0.1, 0.5], C.blue]] },
  beanbag: { label: 'Bean Bag', size: [0.9, 0.6, 0.9], mass: 6, hp: 18, mat: 'soft', value: 90, gore: [0xffffff, 0xe2793b], parts: [['s', [0.48], [0, -0.05, 0], 0xe2793b, { sy: 0.62 }]] },
  crate: { label: 'Crate', size: [0.7, 0.7, 0.7], mass: 12, hp: 16, mat: 'wood', value: 40, loot: 0.45, parts: [
    ['b', [0.7, 0.7, 0.7], [0, 0, 0], 0xb07d48], ['b', [0.72, 0.1, 0.72], [0, 0.22, 0], 0x8a5d33], ['b', [0.72, 0.1, 0.72], [0, -0.22, 0], 0x8a5d33]] },
  tankstand: { label: 'Cabinet', size: [1.2, 0.7, 0.5], mass: 20, hp: 40, mat: 'wood', value: 200, parts: [['b', [1.2, 0.7, 0.5], [0, 0, 0], C.dark], ['b', [1.22, 0.04, 0.52], [0, 0.35, 0], C.wood]] },
  fishtank: { label: 'Fish Tank', size: [1.2, 0.6, 0.5], mass: 30, hp: 4, mat: 'glass', value: 800, fishtank: true, parts: [
    ['b', [1.2, 0.6, 0.5], [0, 0, 0], 0x9fd8ff, { o: 0.3 }], ['b', [1.14, 0.48, 0.44], [0, -0.04, 0], 0x3aa0d8, { o: 0.5 }], ['b', [1.14, 0.06, 0.44], [0, -0.26, 0], 0xd9c48c],
    ['b', [0.12, 0.07, 0.03], [0.2, 0, 0], C.orange, { e: 0xff7a00, ei: 0.4 }], ['b', [0.1, 0.06, 0.03], [-0.25, 0.08, 0.1], C.yellow], ['b', [1.22, 0.03, 0.52], [0, 0.31, 0], C.black]] },
  fish: { label: 'Bubbles the Fish', size: [0.22, 0.1, 0.05], mass: 0.3, hp: 6, mat: 'food', value: 0, flop: true, onBreakText: 'RIP BUBBLES', noRespawn: true, gore: [C.orange, 0xffffff], parts: [
    ['s', [0.07], [0, 0, 0], C.orange, { sx: 1.6, sz: 0.5 }], ['b', [0.07, 0.08, 0.02], [-0.13, 0, 0], C.orange], ['s', [0.012], [0.07, 0.02, 0.025], C.black]] },
  toilet: { label: 'Toilet', size: [0.45, 0.8, 0.7], mass: 40, hp: 35, mat: 'ceramic', value: 480, toilet: true, parts: [
    ['c', [0.2, 0.36, 0.15], [0, -0.2, 0.08], C.white], ['c', [0.21, 0.04, 0.21], [0, 0, 0.08], 0xe8e8e8], ['b', [0.42, 0.4, 0.18], [0, 0.18, -0.25], C.white],
    ['b', [0.24, 0.1, 0.3], [0, -0.35, 0.05], C.white], ['b', [0.44, 0.04, 0.2], [0, 0.39, -0.25], 0xe8e8e8], ['b', [0.06, 0.02, 0.02], [-0.15, 0.32, -0.15], C.steel]] },
  tub: { label: 'Bathtub', size: [1.7, 0.6, 0.8], mass: 80, hp: 85, mat: 'ceramic', value: 1600, parts: [
    ['b', [1.7, 0.6, 0.8], [0, 0, 0], C.white], ['b', [1.5, 0.04, 0.6], [0, 0.29, 0], 0x7cc7ee, { o: 0.85 }], ['c', [0.03, 0.15, 0.03], [-0.75, 0.37, 0], C.steel]] },
  sink: { label: 'Sink', size: [0.6, 0.9, 0.45], mass: 25, hp: 22, mat: 'ceramic', value: 300, parts: [
    ['c', [0.08, 0.7, 0.12], [0, -0.1, 0], C.white], ['b', [0.6, 0.18, 0.45], [0, 0.36, 0], C.white], ['b', [0.04, 0.12, 0.04], [0, 0.5, -0.15], C.steel]] },
  plunger: { label: 'Plunger', size: [0.16, 0.62, 0.16], mass: 0.7, hp: 50, mat: 'soft', value: 15, weapon: { dmg: 20, knock: 0.9, reach: 2.7, sound: 'squelch', word: 'SHLOOP!' }, parts: [
    ['s', [0.08], [0, -0.24, 0], 0xc0302a, { sy: 0.7 }], ['c', [0.018, 0.5, 0.018], [0, 0.06, 0], C.light]] },
  tp: { label: 'Toilet Paper', size: [0.13, 0.12, 0.13], mass: 0.15, hp: 2, mat: 'paper', value: 2, parts: [['c', [0.065, 0.12, 0.065], [0, 0, 0], C.white], ['c', [0.022, 0.122, 0.022], [0, 0, 0], C.light]] },
  grave: { label: 'Gravestone', size: [0.8, 1.1, 0.25], mass: 160, hp: 45, mat: 'stone', value: 0, onBreakText: 'REST IN PIECES', noRespawn: true, parts: [
    ['b', [0.7, 0.75, 0.2], [0, -0.12, 0], C.stone], ['c', [0.35, 0.2, 0.35], [0, 0.25, 0], C.stone, { rx: PI2 }], ['b', [0.8, 0.15, 0.25], [0, -0.48, 0], 0x6f6c78], ['b', [0.3, 0.05, 0.01], [0, 0.1, 0.105], 0x5a5763]] },
  gnome: { label: 'Garden Gnome', size: [0.3, 0.55, 0.3], mass: 4, hp: 5, mat: 'ceramic', value: 120, onBreakText: 'NOT THE GNOME', parts: [
    ['c', [0.1, 0.25, 0.14], [0, -0.13, 0], C.blue], ['s', [0.08], [0, 0.04, 0], 0xf0c8a0], ['c', [0.09, 0.14, 0.01], [0, -0.02, 0.05], C.white], ['c', [0, 0.22, 0.09], [0, 0.18, 0], C.red]] },
  pumpkin: { label: "Jack-o'-lantern", size: [0.5, 0.42, 0.5], mass: 6, hp: 4, mat: 'food', value: 15, gore: [C.orange, 0xffd040], parts: [
    ['s', [0.25], [0, 0, 0], C.orange, { sy: 0.8, e: 0x7a2a00, ei: 0.3 }], ['c', [0.03, 0.1, 0.04], [0, 0.22, 0], C.green],
    ['b', [0.06, 0.06, 0.02], [0.08, 0.04, 0.235], 0xffd040, { e: 0xffb000, ei: 1.2 }], ['b', [0.06, 0.06, 0.02], [-0.08, 0.04, 0.235], 0xffd040, { e: 0xffb000, ei: 1.2 }], ['b', [0.16, 0.04, 0.02], [0, -0.06, 0.235], 0xffd040, { e: 0xffb000, ei: 1.2 }]] },
  trashcan: { label: 'Trash Can', size: [0.55, 0.9, 0.55], mass: 8, hp: 45, mat: 'metal', value: 40, parts: [
    ['c', [0.27, 0.86, 0.24], [0, -0.02, 0], 0x7d8590], ['c', [0.29, 0.06, 0.29], [0, 0.44, 0], 0x8e96a0], ['b', [0.12, 0.04, 0.04], [0, 0.49, 0], 0x6c737c]] },
  car: { label: 'Station Wagon', size: [1.9, 1.4, 4.2], mass: 900, hp: 380, mat: 'metal', value: 32000, explosive: true, parts: [
    ['b', [1.9, 0.6, 4.2], [0, -0.25, 0], 0x3d7fb8], ['b', [1.7, 0.55, 2.4], [0, 0.32, -0.3], 0x3d7fb8], ['b', [1.72, 0.38, 2.2], [0, 0.34, -0.3], 0x9fd8ff, { o: 0.75 }],
    ...[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b]) => ['c', [0.36, 0.3, 0.36], [0.85 * a, -0.52, 1.35 * b], C.black, { rz: PI2 }]),
    ['b', [0.3, 0.15, 0.05], [0.6, -0.15, 2.1], 0xfff2b0, { e: 0xffe08a, ei: 1 }], ['b', [0.3, 0.15, 0.05], [-0.6, -0.15, 2.1], 0xfff2b0, { e: 0xffe08a, ei: 1 }],
    ['b', [1.92, 0.25, 3.2], [0, -0.3, -0.2], C.wood]] },
  mailbox: { label: 'Mailbox', size: [0.3, 1.25, 0.5], mass: 10, hp: 14, mat: 'metal', value: 60, parts: [
    ['b', [0.08, 1, 0.08], [0, -0.12, 0], C.wood], ['b', [0.26, 0.24, 0.5], [0, 0.5, 0], 0x2b4c8c], ['b', [0.02, 0.14, 0.06], [0.14, 0.56, 0.12], C.red]] },
  door: { label: 'Door', size: [1.8, 2.5, 0.12], static: true, mass: 0, hp: 25, mat: 'wood', value: 700, parts: [
    ['b', [1.8, 2.5, 0.12], [0, 0, 0], 0x7a2f2a], ['b', [0.6, 0.8, 0.02], [0.4, -0.5, 0.065], 0x6a2622], ['b', [0.6, 0.8, 0.02], [-0.4, -0.5, 0.065], 0x6a2622],
    ['s', [0.05], [0.7, -0.05, 0.09], C.gold], ['b', [1.2, 0.4, 0.02], [0, 0.65, 0.065], 0xffd88a, { e: 0xffb85c, ei: 0.6 }]] },
  glass: { label: 'Window', size: [1.8, 2.2, 0.06], static: true, mass: 0, hp: 2, mat: 'glass', value: 350, parts: [
    ['b', [1.8, 2.2, 0.05], [0, 0, 0], 0xa8dcff, { o: 0.3 }], ['b', [0.05, 2.2, 0.07], [0, 0, 0], C.white], ['b', [1.8, 0.05, 0.07], [0, 0.2, 0], C.white]] },
  // ---------- pickups (upgrades) ----------
  pk_shake: { pickup: 'shake', size: [0.18, 0.34, 0.18], parts: [['c', [0.085, 0.26, 0.065], [0, -0.04, 0], 0xff8fc8, { e: 0xff4fa8, ei: 0.5 }], ['c', [0.09, 0.03, 0.09], [0, 0.1, 0], C.white], ['c', [0.01, 0.16, 0.01], [0.03, 0.18, 0], C.red]] },
  pk_espresso: { pickup: 'espresso', size: [0.18, 0.14, 0.18], parts: [['c', [0.07, 0.1, 0.055], [0, -0.01, 0], C.white, { e: 0x664433, ei: 0.3 }], ['c', [0.065, 0.01, 0.065], [0, 0.04, 0], 0x3a1f0f], ['c', [0.09, 0.015, 0.09], [0, -0.06, 0], C.white]] },
  pk_pizza: { pickup: 'pizza', size: [0.36, 0.05, 0.34], parts: [['c', [0.2, 0.035, 0.2, 3], [0, 0, 0], 0xf2c14e, { e: 0x8a5a00, ei: 0.3 }], ['c', [0.035, 0.01, 0.035], [0.03, 0.02, 0.02], C.red], ['c', [0.03, 0.01, 0.03], [-0.06, 0.02, -0.03], C.red]] },
  pk_hotsauce: { pickup: 'hotsauce', size: [0.12, 0.32, 0.12], parts: [['c', [0.05, 0.2, 0.055], [0, -0.05, 0], 0xd42a1a, { e: 0xff3000, ei: 0.5 }], ['c', [0.02, 0.1, 0.04], [0, 0.1, 0], 0xd42a1a], ['c', [0.022, 0.04, 0.022], [0, 0.165, 0], C.green]] },
  pk_spinach: { pickup: 'spinach', size: [0.16, 0.2, 0.16], parts: [['c', [0.08, 0.2, 0.08], [0, 0, 0], 0x3c9a3c, { e: 0x1f6f1f, ei: 0.5 }], ['c', [0.082, 0.08, 0.082], [0, 0, 0], C.white]] },
  pk_garlic: { pickup: 'garlic', size: [0.38, 0.12, 0.16], parts: [['b', [0.38, 0.1, 0.16], [0, 0, 0], 0xe0a948, { e: 0x7a4a00, ei: 0.35 }], ['b', [0.34, 0.02, 0.12], [0, 0.055, 0], 0x8bc34a]] },
  pk_preworkout: { pickup: 'preworkout', size: [0.2, 0.24, 0.2], parts: [['c', [0.1, 0.22, 0.1], [0, 0, 0], C.black], ['c', [0.102, 0.1, 0.102], [0, 0, 0], 0x39ff88, { e: 0x00ff66, ei: 0.8 }], ['c', [0.104, 0.04, 0.104], [0, 0.11, 0], 0x39ff88]] },
  pk_milk: { pickup: 'milk', size: [0.16, 0.32, 0.16], parts: [['b', [0.16, 0.24, 0.16], [0, -0.04, 0], C.white, { e: 0x445566, ei: 0.3 }], ['b', [0.16, 0.08, 0.1], [0, 0.12, 0], 0x4a8fe0], ['b', [0.162, 0.08, 0.162], [0, -0.02, 0], 0x4a8fe0]] },
  pk_duck: { pickup: 'duck', size: [0.24, 0.2, 0.18], parts: [['s', [0.09], [0, -0.03, 0], 0xffd400, { sx: 1.2, e: 0x806a00, ei: 0.4 }], ['s', [0.06], [0.06, 0.07, 0], 0xffd400], ['b', [0.06, 0.025, 0.05], [0.13, 0.06, 0], C.orange], ['s', [0.012], [0.09, 0.09, 0.035], C.black], ['s', [0.012], [0.09, 0.09, -0.035], C.black]] },
};
for (const k in PROP_DEFS) {
  const d = PROP_DEFS[k];
  if (d.pickup) Object.assign(d, { mass: 1, hp: 9999, mat: 'soft', value: 0, noRespawn: true });
}
const BOOK_TINTS = [C.red, C.blue, C.green, C.purple, C.orange, C.teal];
const BALL_TINTS = [0xf2c53d, 0x2d5fd0, 0xd8322f, 0x6a2ca0, 0xf07a1a, 0x1f8a4a, 0x8a2020, 0x111111, 0xffffff];
