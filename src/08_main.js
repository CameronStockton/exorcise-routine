
// ================= GAME: explosions, waves, HUD, loop =================
function blast(pos, radius, power, dmg, kind) {
  const stomp = kind === 'stomp';
  impactStar(pos, stomp ? 0xffffff : 0xff7a00, 2.4);
  burst(pos, stomp ? [0xe8dcc8, 0xb6a2c8, 0x8d8579] : [0xff7a00, 0xffd23f, 0xff3b1f, 0x333333], 60, 12, 0.16, { up: 6, life: 1 });
  if (!stomp) burst(pos, [0x2a2733, 0x4a4552], 20, 4, 0.3, { grav: -0.15, drag: 2.5, life: 1.8 });
  sfx(stomp ? 'stomp' : 'explode', pos);
  shake(stomp ? 0.85 : 0.25 + 0.5 * vol(pos));
  hitStop(0.06);
  if (!stomp) pop(V3(pos.x, pos.y + 0.8, pos.z), pick(['KA-BOOM!', 'KABLAM!', 'BOOOOM!']), { size: 84, color: '#ff7a00', life: 1.2 });
  let hits = 0;
  for (const e of [...enemies]) {
    if (e.state === 'held' || e.state === 'spawn') continue;
    _t1.copy(e.body.position).sub(pos);
    const d = _t1.length();
    if (d > radius) continue;
    const f = 1 - d / radius;
    _t1.y = 0; _t1.normalize();
    hitEnemy(e, dmg * f + 10, V3(_t1.x * 24 * power * f + rand(-2, 2), 10 + 12 * power * f, _t1.z * 24 * power * f), { spin: 1.5 });
    hits++;
  }
  for (const p of [...props]) {
    if (!p.alive || !p.body.world) continue;
    _t1.copy(p.body.position).sub(pos);
    const d = _t1.length();
    if (d > radius) continue;
    const f = 1 - d / radius;
    _t1.normalize();
    if (!p.def.static) {
      const dv = (22 * power * f) / (1 + p.def.mass / 40);
      p.body.wakeUp();
      p.body.velocity.x += _t1.x * dv; p.body.velocity.y += Math.abs(_t1.y) * dv + dv * 0.6; p.body.velocity.z += _t1.z * dv;
      p.body.angularVelocity.set(rand(-10, 10), rand(-10, 10), rand(-10, 10));
      p.thrownT = 1;
    }
    damageProp(p, dmg * f * 0.8 * MAT_FRAG[p.def.mat]);
  }
  if (!stomp) {
    const d = player.body.position.distanceTo(pos);
    if (d < radius) { const f = 1 - d / radius; hurtPlayer(dmg * 0.3 * f, pos); player.body.velocity.y += 8 * f; }
  }
  if (hits) registerHit(hits);
}

// ---------- waves ----------
const WAVES = [
  null,
  { title: 'The Neighbors Are Dead', sub: 'Zombies at the door. Show them out.', roster: { zombie: 5 } },
  { title: 'Boo-tcamp', sub: 'Ghosts float through walls. You punch through ghosts.', roster: { zombie: 5, ghost: 4 } },
  { title: "Hell's Kitchen", sub: 'Demons pounce. Punch them out of the air.', roster: { zombie: 4, ghost: 3, demon: 3 } },
  { title: 'Poltergeist Party', sub: 'Little purple guys throw your furniture at you.', roster: { zombie: 4, ghost: 3, demon: 2, wisp: 3 } },
  { title: 'Big Gary', sub: 'He is very big. His name is Gary.', roster: { gary: 1, zombie: 6 } },
  { title: 'Night of the Living Deadlift', sub: 'More of everyone.', roster: { zombie: 7, ghost: 4, demon: 3, wisp: 2 } },
  { title: 'Leg Day From Hell', sub: 'Demons. So many demons.', roster: { demon: 8, zombie: 4 } },
  { title: 'Spirit Week', sub: 'The whole spirit squad showed up.', roster: { ghost: 8, wisp: 5 } },
  { title: 'Rest In Pieces', sub: 'Everyone, all at once.', roster: { zombie: 8, ghost: 5, demon: 5, wisp: 3 } },
  { title: 'Lord Brimstone', sub: 'The landlord from Hell wants his rent.', roster: { brimstone: 1, demon: 4, wisp: 2 } },
];
const WAVE_QUIPS = ['Round two. I just mopped.', 'Who keeps giving out my address?', 'Okay. Cardio time.', 'I am not paying for that window.', 'Do NOT touch the protein.', 'Every haunting is a free workout.'];
function rosterFor(n) {
  if (WAVES[n]) return WAVES[n];
  const k = n - 10;
  const r = { zombie: 6 + k, ghost: 4 + k, demon: 3 + k, wisp: 2 + (k >> 1) };
  if (n % 5 === 0) r[n % 10 === 0 ? 'brimstone' : 'gary'] = 1;
  return { title: 'Overtime ' + k, sub: 'They keep coming. You keep lifting.', roster: r };
}
function startWave(n) {
  G.wave = n;
  const w = rosterFor(n);
  const list = [];
  for (const [t, c] of Object.entries(w.roster)) for (let i = 0; i < c; i++) list.push(t);
  for (let i = list.length - 1; i > 0; i--) { const j = randInt(0, i); [list[i], list[j]] = [list[j], list[i]]; }
  list.sort((a, b) => (ENEMY_DEFS[b].boss ? 1 : 0) - (ENEMY_DEFS[a].boss ? 1 : 0));
  G.toSpawn = list;
  G.spawnT = 1.6;
  G.intermission = 0;
  banner('Wave ' + n, w.title + ' · ' + w.sub);
  sfx('wave');
  quip(n === 1 ? 'Somebody is knocking. Super rudely.' : pick(WAVE_QUIPS));
}
function livingCount() { let n = 0; for (const e of enemies) if (e.state !== 'dead') n++; return n; }
function spawnFromQueue(dt) {
  if (!G.toSpawn.length) return;
  G.spawnT -= dt;
  if (G.spawnT > 0 || livingCount() >= 13) return;
  G.spawnT = rand(0.7, 1.3) * (G.wave > 5 ? 0.8 : 1);
  const type = G.toSpawn.shift();
  let x, z;
  if ((type === 'zombie' || type === 'gary') && Math.random() < 0.4) {
    const g = pick(GRAVE_SPOTS); x = g.x + rand(-0.4, 0.4); z = g.z + rand(0.3, 0.9);
  } else if (ENEMY_DEFS[type].phase && Math.random() < 0.4) {
    const a = rand(0, Math.PI * 2); x = Math.cos(a) * 17; z = Math.sin(a) * 15;
  } else {
    const s = pick(SPAWNS), l = rand(-3, 3); x = s.x + s.lx * l; z = s.z + s.lz * l;
  }
  spawnEnemy(type, clamp(x, -22, 22), clamp(z, -22, 21));
}
function updateWaves(dt) {
  spawnFromQueue(dt);
  if (G.intermission > 0) {
    G.intermission -= dt;
    if (G.intermission <= 0) startWave(G.wave + 1);
    return;
  }
  if (G.wave > 0 && !G.toSpawn.length && enemies.size === 0) {
    G.intermission = 7;
    const n = respawnFurniture();
    banner('Wave ' + G.wave + ' cleared', n ? `Insurance delivered ${n} replacement items. Bold of them.` : 'Catch your breath. Eat something weird.');
    heal(25);
    gainXP(10 + G.wave * 5);
    sfx('levelUp');
  }
}

// ---------- HUD ----------
const hudCache = {};
function setText(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } }
function setScale(id, f) { const v = clamp(f, 0, 1).toFixed(3); if (hudCache[id] !== v) { hudCache[id] = v; $(id).style.transform = `scaleX(${v})`; } }
function setHTML(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).innerHTML = v; } }
const RANKS = [[60, 'EXORCIST'], [40, 'Gym Legend'], [25, 'Absolute Unit'], [16, 'Beast Mode'], [10, 'Swole'], [6, 'Reps!'], [3, 'Warm-up']];
const BUFF_NAMES = { haste: 'Zoomies', fire: 'Fire Fists', giant: 'Giant Fists', quack: 'Quack Mode' };
function updateHUD() {
  setScale('hpFill', player.hp / player.maxHp);
  setText('hpText', `${Math.ceil(player.hp)} / ${player.maxHp}`);
  setScale('xpFill', player.xp / player.xpNext);
  setText('stLvl', String(player.lvl));
  setText('stStr', String(Math.round(player.str * 10)));
  setText('stSpd', String(Math.round(player.spd * 10)));
  setText('stArm', String(Math.round(player.arm * 10)));
  setText('stDef', Math.round(player.def * 100) + '%');
  let bh = '';
  for (const k in player.buffs) if (player.buffs[k] > 0) bh += `<span class="buff">${BUFF_NAMES[k]} ${Math.ceil(player.buffs[k])}s</span>`;
  setHTML('buffs', bh);
  const left = livingCount() + G.toSpawn.length;
  setText('waveLabel', G.intermission > 0 ? 'Intermission' : 'Wave ' + G.wave);
  setText('enemyCount', G.intermission > 0 ? `Next wave in ${Math.ceil(G.intermission)}s` : `${left} intruder${left === 1 ? '' : 's'} left`);
  let boss = null;
  for (const e of enemies) if (e.def.boss && e.state !== 'dead') boss = e;
  $('bossBar').hidden = !boss;
  if (boss) { setText('bossName', boss.def.name); setScale('bossFill', boss.hp / boss.maxHp); }
  setText('dmgAmt', money(G.damage));
  setText('kos', String(G.kills));
  setText('bestCombo', String(G.bestCombo));
  setScale('stompFill', player.stomp / 100);
  const ready = player.stomp >= 100;
  if (hudCache.ready !== ready) { hudCache.ready = ready; $('stompBar').classList.toggle('ready', ready); }
  let ch = '';
  if (G.combo >= 3) { const r = RANKS.find(([n]) => G.combo >= n); ch = `<div class="n">×${G.combo}</div><div class="r">${r ? r[1] : ''}</div>`; }
  setHTML('combo', ch);
}
function updatePrompt() {
  let html = '';
  let hot = false;
  if (player.held) {
    const h = player.held;
    if (player.heldKind === 'enemy') html = `<kbd>LMB</kbd> Use ${h.def.name} as a club · <kbd>RMB</kbd> Throw · <kbd>E</kbd> Drop`;
    else if (h.def.pickup) html = `<kbd>LMB</kbd> Consume ${PICKUPS[h.def.pickup].label} · <kbd>RMB</kbd> Throw`;
    else html = `<kbd>LMB</kbd> Swing ${h.def.label} · <kbd>RMB</kbd> Throw · <kbd>E</kbd> Drop`;
  } else {
    const t = lookTarget();
    if (t) {
      hot = true;
      if (t.kind === 'enemy') html = `<kbd>E</kbd> Grab ${t.e.def.name}${t.e.state === 'dead' ? ' (limp)' : ''}`;
      else if (t.p.def.pickup) html = `<kbd>E</kbd> Pick up ${PICKUPS[t.p.def.pickup].label}`;
      else html = `<kbd>E</kbd> Grab ${t.p.def.label}${t.p.def.weapon ? ' (weapon)' : t.p.def.mass >= 80 ? ' (heavy)' : ''}`;
    }
  }
  setHTML('prompt', html);
  if (hudCache.hot !== hot) { hudCache.hot = hot; $('crosshair').classList.toggle('hot', hot); }
}

// ---------- screens ----------
function startGame() {
  audioInit();
  $('startScreen').hidden = true;
  $('hud').hidden = false;
  $('crosshair').hidden = false;
  G.running = true;
  requestLock();
  startWave(1);
}
function pauseGame(p) {
  if (!G.running || G.over) return;
  G.paused = p;
  $('pauseScreen').hidden = !p;
  if (p) { mouseL = false; if (document.pointerLockElement) document.exitPointerLock(); }
}
function gameOver() {
  if (G.over) return;
  G.over = true;
  slowMo(0.2, 3);
  quip('Tell the ghosts… I finished my set…');
  $('ovWave').textContent = String(Math.max(0, G.wave - 1));
  $('ovKos').textContent = String(G.kills);
  $('ovDmg').textContent = money(G.damage);
  $('ovCombo').textContent = String(G.bestCombo);
  $('overLine').textContent = G.damage > 50000 ? 'The house is gone, but your gains are forever.' : pick(['Even legends skip leg day sometimes.', 'The afterlife has a gym, right?', 'Your security deposit died with you.']);
  setTimeout(() => {
    if (document.pointerLockElement) document.exitPointerLock();
    $('overScreen').hidden = false;
    $('hud').hidden = true;
    $('crosshair').hidden = true;
    $('prompt').innerHTML = '';
  }, 1600);
}
$('resumeBtn').addEventListener('click', () => { audioInit(); pauseGame(false); requestLock(); });
$('retryBtn').addEventListener('click', () => location.reload());

// ---------- loop ----------
let lastT = performance.now(), promptT = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const realDt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  simulate(realDt, now);
  renderer.render(scene, camera);
}
function simulate(realDt, now = performance.now()) {
  if (G.running && !G.paused) {
    let scale = 1;
    if (G.hitStop > 0) { G.hitStop -= realDt; scale = 0.03; }
    else if (G.slowT > 0) { G.slowT -= realDt; scale = G.slowScale; if (G.slowT <= 0) G.slowScale = 1; }
    const dt = realDt * scale;
    G.time += dt;
    if (!G.over) updatePlayer(dt);
    world.step(1 / 60, dt, 4);
    flushLater();
    syncAll();
    updateEnemies(dt);
    updateProps(dt);
    if (!G.over) updateWaves(dt);
    if (G.comboT > 0) { G.comboT -= dt; if (G.comboT <= 0) G.combo = 0; }
    updateFX(dt, realDt);
    updateCamera(realDt);
    promptT -= realDt;
    if (promptT <= 0) { promptT = 0.1; if (!G.over) updatePrompt(); }
    updateHUD();
  } else if (!G.running) {
    const t = (now / 1000) * 0.07;
    camera.position.set(Math.cos(t) * 28, 11, Math.sin(t) * 24 + 2);
    camera.lookAt(0, 1.2, 0);
  }
}

// ---------- boot ----------
buildHouse();
initPlayer();
renderer.compile(scene, camera);
const sb = $('startBtn');
sb.disabled = false;
sb.textContent = 'Start the workout';
sb.addEventListener('click', startGame);
// debug handle (handy from the console)
window.__game = {
  G, player, enemies, props, debris, world, keys, spawnEnemy, spawnProp, primary, secondary, tryGrab, throwHeld, superStomp, blast,
  PORTALS, nextWaypoint, roomAt,
  step(n = 1, dt = 1 / 60) { for (let i = 0; i < n; i++) simulate(dt); renderer.render(scene, camera); },
  renderMs() { const t = performance.now(); renderer.render(scene, camera); return performance.now() - t; },
};
requestAnimationFrame(frame);
