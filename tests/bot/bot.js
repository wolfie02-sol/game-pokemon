/*
 * Wildkin playthrough bot.
 *
 * Plays a save only through the same buttons a player has (d-pad, A, B, START),
 * pressed through the on-screen button hook. It reads the game state to decide
 * what to do (like a player reading the screen) but never writes to it.
 * The game is advanced one fixed frame at a time with game.step(), so it runs
 * faster than real time with identical logic.
 */
(() => {
  if (window.__bot) return;
  const D = window.__wildkinDebug;
  const g = window.__wildkin;
  const X = D.data;
  const TILES = X.TILES;
  const MAPS = D.maps();
  const MAP_IDS = Object.keys(MAPS);
  const MI = Object.fromEntries(MAP_IDS.map((m, i) => [m, i]));
  const DIRS = ['up', 'down', 'left', 'right'];
  const DX = { up: 0, down: 0, left: -1, right: 1 };
  const DY = { up: -1, down: 1, left: 0, right: 0 };
  const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };

  const MEMKEY = 'wildkin-bot-mem';
  const loadMem = () => {
    try {
      return JSON.parse(localStorage.getItem(MEMKEY) || 'null');
    } catch {
      return null;
    }
  };
  const mem0 = loadMem();

  const B = (window.__bot = {
    frames: 0,
    issues: [],
    events: [],
    dialogCount: 0,
    texts: new Set(),
    prompts: {},
    battles: { wild: 0, trainer: 0, won: 0, lost: 0, caught: 0, ran: 0, whiteouts: 0 },
    mem: mem0 || { talked: {}, trig: {}, avoid: {}, fails: {}, saves: 0, lastSaveBadges: -1, starter: null },
    opts: { starter: 'EMBERKIT' },
    status: '',
    goal: null,
    done: false,
    menuTask: null,
    shopPlan: null,
    battleItem: null,
    itemTarget: null,
    fieldItem: null,
    lastLearn: null,
    unknownFrames: 0,
    lastScene: '',
    curBattle: null,
    noGoalCount: 0,
    grindSteps: 0,
    errorsSeen: 0,
    lastSig: -1,
    lastProgressFrame: 0,
  });
  const saveMem = () => {
    try {
      localStorage.setItem(MEMKEY, JSON.stringify(B.mem));
    } catch {}
  };
  const ev = (t) => {
    B.events.push(`[f${B.frames}] ${t}`);
  };
  const issue = (t) => {
    if (!B.issues.includes(t)) B.issues.push(t);
  };
  window.addEventListener('error', (e) => issue('PAGE ERROR: ' + (e.message || e)));
  window.addEventListener('unhandledrejection', (e) => issue('UNHANDLED REJECTION: ' + (e.reason && (e.reason.stack || e.reason.message || e.reason))));

  // ------------------------------------------------------------ frames and input
  cancelAnimationFrame(g.raf);
  g.start = () => {};
  const mc = new MessageChannel();
  let mcRes = null;
  mc.port1.onmessage = () => {
    const r = mcRes;
    mcRes = null;
    if (r) r();
  };
  const flush = () =>
    new Promise((r) => {
      mcRes = r;
      mc.port2.postMessage(0);
    });
  async function frame(n = 1) {
    for (let i = 0; i < n; i++) {
      g.step();
      if ((B.frames & 3) === 0) g.render();
      B.frames++;
      await flush();
    }
  }
  const held = new Set();
  function press(b) {
    if (!held.has(b)) {
      g.input.setVirtual(b, true);
      held.add(b);
    }
  }
  function release(b) {
    if (held.has(b)) {
      g.input.setVirtual(b, false);
      held.delete(b);
    }
  }
  function releaseAll() {
    for (const b of [...held]) release(b);
  }
  async function tap(b, h = 1, after = 2) {
    releaseAll();
    press(b);
    await frame(h);
    release(b);
    await frame(after);
  }
  const top = () => g.scenes[g.scenes.length - 1];
  const nm = (sc) => (sc ? sc.constructor.name : '');
  const S = () => g.state;
  const owScene = () => g.scenes.find((x) => nm(x) === 'Overworld');

  async function menuTo(getIdx, target, n, maxTaps = 120) {
    for (let k = 0; k < maxTaps && getIdx() !== target; k++) {
      const cur = getIdx();
      const downSteps = (target - cur + n) % n;
      await tap(downSteps <= n / 2 ? 'down' : 'up');
    }
    return getIdx() === target;
  }

  // ------------------------------------------------------------ game knowledge
  const sp = (id) => X.SPECIES[id];
  const mv = (id) => X.MOVES[id];
  const hpFrac = (m) => m.hp / X.maxHp(m);
  const alive = (m) => m.hp > 0;
  const lead = () => S().party.find(alive) || S().party[0];
  const bestLevel = () => Math.max(0, ...S().party.map((m) => m.lvl));
  const moveByName = (n) => Object.values(X.MOVES).find((m) => m.name.toUpperCase() === n.toUpperCase());

  function estDamage(att, def, moveId) {
    const m = mv(moveId);
    if (!m || m.cat === 'status' || !m.pow) {
      if (m && m.fixed) return m.fixed === 'level' ? att.lvl : m.fixed === 'half' ? def.hp / 2 : m.fixed;
      return 0;
    }
    const as = X.stats(att);
    const ds = X.stats(def);
    const A = m.cat === 'phys' ? as.atk : as.spc;
    const Dd = m.cat === 'phys' ? ds.def : ds.spc;
    const stab = sp(att.sp).types.includes(m.type) ? 1.5 : 1;
    const eff = X.effectiveness(m.type, sp(def.sp).types);
    const hits = m.multi ? (m.multi[0] + m.multi[1]) / 2 : 1;
    const base = (((2 * att.lvl) / 5 + 2) * m.pow * (A / Math.max(1, Dd))) / 50 + 2;
    return base * stab * eff * 0.92 * hits * ((m.acc || 100) / 100);
  }
  function moveValue(mon, id) {
    const m = mv(id);
    if (!m) return 0;
    if (m.cat === 'status' || !m.pow) return m.heal ? 25 : 8;
    const stab = sp(mon.sp).types.includes(m.type) ? 1.5 : 1;
    const hits = m.multi ? (m.multi[0] + m.multi[1]) / 2 : 1;
    const as = X.stats(mon);
    const stat = m.cat === 'phys' ? as.atk : as.spc;
    return m.pow * stab * hits * ((m.acc || 100) / 100) * (stat / 50) * (m.recoil ? 0.85 : 1);
  }
  function bestMove(att, def) {
    let best = -1;
    let bs = -1;
    att.moves.forEach((s, i) => {
      if (s.pp <= 0) return;
      const d = estDamage(att, def, s.id);
      if (d > bs) {
        bs = d;
        best = i;
      }
    });
    return { slot: best, dmg: bs };
  }
  function damagingPP(m) {
    return m.moves.reduce((a, s) => a + (mv(s.id) && mv(s.id).pow > 0 ? s.pp : 0), 0);
  }

  // story progress signature: changes when something story-relevant happens
  function storySig() {
    const s = S();
    let n = 0;
    for (const k in s.flags) {
      if (!s.flags[k]) continue;
      if (/^(item:|cut:|visit:|gone:|seen:)/.test(k)) continue;
      if (k.startsWith('tr:')) {
        const t = D.trainers[k.slice(3)];
        if (!t || !t.smart) continue;
      }
      n++;
    }
    return n + s.badges.length * 1000 + (s.bag.driftboard ? 7 : 0) + (s.bag.shears ? 11 : 0) + (s.bag.pick ? 13 : 0) + (s.bag.lens ? 17 : 0);
  }

  function trainerReady(id) {
    const t = D.trainers[id];
    if (!t) return true;
    let team;
    try {
      team = X.trainerTeam(t, S());
    } catch {
      team = t.team;
    }
    const maxL = Math.max(...team.map((x) => x[1]));
    const fails = B.mem.fails[id] || 0;
    const need = maxL + (t.smart ? 2 : -3) + fails * 3;
    return bestLevel() >= need;
  }

  // ------------------------------------------------------------ world graph
  const keyOf = (mi, x, y) => mi * 65536 + y * 256 + x;
  const unkey = (k) => ({ mi: Math.floor(k / 65536), y: Math.floor((k % 65536) / 256), x: k % 256 });

  function npcsOn(mapId) {
    const o = owScene();
    const s = S();
    if (o && o.map.id === mapId) return o.npcs.filter((n) => !n.hidden).map((n) => ({ def: n.def, x: n.x, y: n.y, dir: n.dir, live: n }));
    return MAPS[mapId].npcs
      .filter((d) => !(d.cond && !d.cond(s)) && !s.flags['gone:' + mapId + ':' + d.id])
      .map((d) => ({ def: d, x: d.x, y: d.y, dir: d.dir }));
  }
  function itemsOn(mapId) {
    const s = S();
    return MAPS[mapId].items.filter((it) => !s.flags['item:' + it.id] && (!it.cond || it.cond(s)));
  }

  function buildDyn() {
    const s = S();
    const dyn = {};
    const sig = storySig();
    for (const id of MAP_IDS) {
      const m = MAPS[id];
      const block = new Uint8Array(m.w * m.h);
      const extra = new Uint16Array(m.w * m.h);
      for (const it of itemsOn(id)) block[it.y * m.w + it.x] = 1;
      const ns = npcsOn(id);
      for (const n of ns) {
        if (n.x >= 0 && n.y >= 0 && n.x < m.w && n.y < m.h) block[n.y * m.w + n.x] = 1;
        if (n.live && n.live.moving) {
          const nx = n.x + DX[n.live.moving];
          const ny = n.y + DY[n.live.moving];
          if (nx >= 0 && ny >= 0 && nx < m.w && ny < m.h) block[ny * m.w + nx] = 1;
        }
        // stay out of sight of trainers we are not ready for
        const tid = n.def.trainer;
        if (tid && !s.flags['tr:' + tid] && !trainerReady(tid)) {
          const range = n.def.sight ?? 4;
          for (let k = 1; k <= range; k++) {
            const cx = n.x + DX[n.dir] * k;
            const cy = n.y + DY[n.dir] * k;
            if (cx < 0 || cy < 0 || cx >= m.w || cy >= m.h) break;
            const t = TILES[tileAt(id, cx, cy)];
            if (t.solid && !t.water) break;
            extra[cy * m.w + cx] += 40;
          }
        }
      }
      for (const a of Object.keys(B.mem.avoid)) {
        const [am, ax, ay, asig] = a.split(',');
        if (am === id && Number(asig) === sig) block[Number(ay) * m.w + Number(ax)] = 1;
      }
      dyn[id] = { block, extra };
    }
    return dyn;
  }

  function tileAt(mapId, x, y) {
    const m = MAPS[mapId];
    if (S().flags['cut:' + mapId + ':' + x + ',' + y]) return clearedTileGuess(mapId, x, y);
    return m.tiles[y * m.w + x];
  }
  const CAVEFLOOR = TILES.findIndex((t) => t.name === 'cavefloor');
  const GRASS = TILES.findIndex((t) => t.name === 'grass');
  function clearedTileGuess(mapId, x, y) {
    const m = MAPS[mapId];
    // mirrors Overworld.clearedTile: a broken crack becomes cave floor, anything else copies walkable ground
    if (TILES[m.tiles[y * m.w + x]].name === 'cavecrack') return CAVEFLOOR;
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue;
      const n = TILES[m.tiles[ny * m.w + nx]];
      if (!n.solid && !n.ledge && !n.grass && !n.water && !n.name.startsWith('cave') && n.name !== 'door' && n.name !== 'glassdoor') return n.idx;
    }
    return GRASS;
  }

  /** Dijkstra from the player's position over every map. */
  function plan() {
    const s = S();
    const dyn = buildDyn();
    const has = (k) => (s.bag[k] ?? 0) > 0;
    const start = keyOf(MI[s.map], s.x, s.y);
    const dist = new Map();
    const prev = new Map();
    const heap = [];
    const push = (k, d) => {
      heap.push([d, k]);
      let i = heap.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (heap[p][0] <= heap[i][0]) break;
        [heap[p], heap[i]] = [heap[i], heap[p]];
        i = p;
      }
    };
    const pop = () => {
      const r = heap[0];
      const last = heap.pop();
      if (heap.length) {
        heap[0] = last;
        let i = 0;
        for (;;) {
          const l = 2 * i + 1;
          const rr = l + 1;
          let m = i;
          if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
          if (rr < heap.length && heap[rr][0] < heap[m][0]) m = rr;
          if (m === i) break;
          [heap[m], heap[i]] = [heap[i], heap[m]];
          i = m;
        }
      }
      return r;
    };
    dist.set(start, 0);
    push(start, 0);
    const relax = (from, to, cost, edge) => {
      const nd = dist.get(from) + cost;
      if (nd < (dist.get(to) ?? Infinity)) {
        dist.set(to, nd);
        prev.set(to, [from, edge]);
        push(to, nd);
      }
    };
    while (heap.length) {
      const [d, k] = pop();
      if (d > dist.get(k)) continue;
      const { mi, x, y } = unkey(k);
      const id = MAP_IDS[mi];
      const m = MAPS[id];
      const here = TILES[tileAt(id, x, y)];
      const onWater = !!here.water;
      for (const dir of DIRS) {
        // edge warps (door mats)
        const ew = m.warps.find((w) => w.x === x && w.y === y && w.edge === dir);
        if (ew) {
          if (!ew.cond || ew.cond(s)) if (MI[ew.to] !== undefined) relax(k, keyOf(MI[ew.to], ew.tx, ew.ty), 3, { d: dir, kind: 'edge' });
          continue;
        }
        let nx = x + DX[dir];
        let ny = y + DY[dir];
        let nid = id;
        if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) {
          const c = m.connections && m.connections[dir];
          if (!c) continue;
          const n = MAPS[c.map];
          if (dir === 'up') [nx, ny] = [nx + c.offset, n.h - 1];
          else if (dir === 'down') [nx, ny] = [nx + c.offset, 0];
          else if (dir === 'left') [nx, ny] = [n.w - 1, ny + c.offset];
          else [nx, ny] = [0, ny + c.offset];
          if (nx < 0 || ny < 0 || nx >= n.w || ny >= n.h) continue;
          nid = c.map;
          const t = TILES[tileAt(nid, nx, ny)];
          if (t.solid && !(t.water && onWater)) continue;
          if (t.water && !onWater) continue;
          if (dyn[nid].block[ny * n.w + nx]) continue;
          relax(k, keyOf(MI[nid], nx, ny), 2, { d: dir, kind: 'walk' });
          continue;
        }
        const t = TILES[tileAt(id, nx, ny)];
        const i2 = ny * m.w + nx;
        if (t.ledge) {
          if (dir === 'down' && ny + 1 < m.h) {
            const t2 = TILES[tileAt(id, nx, ny + 1)];
            if (!t2.solid && !t2.ledge && !t2.water && !dyn[id].block[(ny + 1) * m.w + nx]) relax(k, keyOf(mi, nx, ny + 1), 3, { d: dir, kind: 'walk' });
          }
          continue;
        }
        if (dyn[id].block[i2]) continue;
        let cost = 2 + dyn[id].extra[i2];
        let kind = 'walk';
        if (t.water) {
          if (!onWater) {
            if (!has('driftboard')) continue;
            kind = 'mount';
            cost += 10;
          }
        } else if (t.solid) {
          if (t.cut && has('shears')) {
            kind = 'cut';
            cost += 10;
          } else if (t.smash && has('pick')) {
            kind = 'smash';
            cost += 10;
          } else continue;
        }
        if (t.grass || (t.cave && m.encounters)) cost += 1;
        // step warps
        const w = m.warps.find((w) => w.x === nx && w.y === ny && !w.edge);
        if (w && kind === 'walk') {
          if (w.cond && !w.cond(s)) continue;
          if (MI[w.to] === undefined) continue;
          relax(k, keyOf(MI[w.to], w.tx, w.ty), cost + 2, { d: dir, kind: 'warp', via: keyOf(mi, nx, ny) });
          continue;
        }
        relax(k, keyOf(mi, nx, ny), cost, { d: dir, kind });
      }
    }
    return { dist, prev, start };
  }

  function pathTo(P, target) {
    const out = [];
    let k = target;
    while (k !== P.start) {
      const p = P.prev.get(k);
      if (!p) return null;
      out.push({ from: p[0], to: k, ...p[1] });
      k = p[0];
    }
    return out.reverse();
  }

  // ------------------------------------------------------------ goals
  /** Tiles from which the player can interact with (x, y), with facing direction. */
  function approaches(mapId, x, y) {
    const m = MAPS[mapId];
    const out = [];
    for (const d of DIRS) {
      const ax = x - DX[d];
      const ay = y - DY[d];
      if (ax >= 0 && ay >= 0 && ax < m.w && ay < m.h) out.push({ x: ax, y: ay, face: d });
      // talking across a counter
      const cx = x - DX[d];
      const cy = y - DY[d];
      if (cx >= 0 && cy >= 0 && cx < m.w && cy < m.h && TILES[tileAt(mapId, cx, cy)].counter) {
        const bx = x - 2 * DX[d];
        const by = y - 2 * DY[d];
        if (bx >= 0 && by >= 0 && bx < m.w && by < m.h) out.push({ x: bx, y: by, face: d });
      }
    }
    return out;
  }

  function candidateGoals(P) {
    const s = S();
    const sig = storySig();
    const goals = [];
    const visited = new Set(Object.keys(s.flags).filter((k) => k.startsWith('visit:')).map((k) => k.slice(6)));
    for (const id of B.mem.visitedMaps || []) visited.add(id);
    const add = (gl, mapId, x, y) => {
      let best = null;
      for (const a of approaches(mapId, x, y)) {
        const k = keyOf(MI[mapId], a.x, a.y);
        const d = P.dist.get(k);
        if (d === undefined) continue;
        if (!best || d < best.cost) best = { ...gl, node: k, face: a.face, cost: d };
      }
      if (best) goals.push(best);
    };
    for (const id of MAP_IDS) {
      const m = MAPS[id];
      // reachable at all?
      for (const n of npcsOn(id)) {
        const key = id + ':' + n.def.id;
        const tid = n.def.trainer;
        if (tid && !s.flags['tr:' + tid]) {
          // after one league rematch, leave the Elite Four alone so the rest of the postgame gets explored
          if (s.flags.champion && /^(e4_|champ_room)/.test(id) && (B.mem.leagueClears || 0) >= 2) continue;
          if (!trainerReady(tid)) {
            add({ type: 'trainer-unready', key, tid }, id, n.x, n.y);
            continue;
          }
          add({ type: 'talk', key, tid, bias: 0 }, id, n.x, n.y);
          continue;
        }
        if (!n.def.talk) continue;
        const prevSig = B.mem.talked[key];
        const fn = typeof n.def.talk === 'function';
        if (prevSig === undefined || (fn && prevSig !== sig)) add({ type: 'talk', key, bias: fn ? 0 : 6 }, id, n.x, n.y);
      }
      for (const it of itemsOn(id)) add({ type: 'talk', key: id + ':item:' + it.id, bias: 0 }, id, it.x, it.y);
      for (const sg of m.signs) {
        const key = id + ':sign:' + sg.x + ',' + sg.y;
        const prevSig = B.mem.talked[key];
        const fn = typeof sg.text === 'function';
        const terminal = fn && /storage/.test(String(sg.text));
        if (terminal && prevSig !== undefined) continue;
        if (prevSig === undefined || (fn && prevSig !== sig)) add({ type: 'talk', key, bias: fn ? 2 : 10 }, id, sg.x, sg.y);
      }
      for (let ti = 0; ti < m.triggers.length; ti++) {
        const t = m.triggers[ti];
        if (t.cond && !t.cond(s)) continue;
        const key = id + ':trig:' + ti;
        if (B.mem.trig[key] === sig) continue;
        let best = null;
        for (let yy = t.y; yy < t.y + (t.h ?? 1); yy++)
          for (let xx = t.x; xx < t.x + (t.w ?? 1); xx++) {
            const k = keyOf(MI[id], xx, yy);
            const d = P.dist.get(k);
            if (d !== undefined && (!best || d < best.cost)) best = { type: 'goto', key, node: k, cost: d, trig: true };
          }
        if (best) goals.push(best);
      }
    }
    // unvisited maps: any reached node in a map we have never been to
    const bestNew = {};
    for (const [k, d] of P.dist) {
      const id = MAP_IDS[unkey(k).mi];
      if (visited.has(id)) continue;
      if (!bestNew[id] || d < bestNew[id].cost) bestNew[id] = { type: 'visit', key: 'visit:' + id, map: id, node: k, cost: d };
    }
    goals.push(...Object.values(bestNew).map((gl) => ({ ...gl, bias: -4 })));
    return goals;
  }

  function nearestHeal(P) {
    const s = S();
    let best = null;
    for (const id of MAP_IDS) {
      const m = MAPS[id];
      for (const n of m.npcs) {
        const isKeeper = ((n.id === 'keeper' && !!m.havenSpot) || (n.id === 'mom' && id === 'home' && s.flags.gotStarter)) && !(B.badHeal || {})[id + ':' + n.id];
        if (!isKeeper) continue;
        for (const a of approaches(id, n.x, n.y)) {
          const k = keyOf(MI[id], a.x, a.y);
          const d = P.dist.get(k);
          if (d !== undefined && (!best || d < best.cost)) best = { type: 'heal', key: id + ':' + n.id, node: k, face: a.face, cost: d };
        }
      }
    }
    return best;
  }
  function nearestMart(P) {
    let best = null;
    for (const id of MAP_IDS) {
      const m = MAPS[id];
      for (const n of m.npcs) {
        if (n.id !== 'clerk') continue;
        for (const a of approaches(id, n.x, n.y)) {
          const k = keyOf(MI[id], a.x, a.y);
          const d = P.dist.get(k);
          if (d !== undefined && (!best || d < best.cost)) best = { type: 'shop', key: id + ':clerk', map: id, node: k, face: a.face, cost: d };
        }
      }
    }
    return best;
  }
  function grindGoal(P) {
    const lv = bestLevel();
    let best = null;
    for (const id of MAP_IDS) {
      const m = MAPS[id];
      if (!m.encounters) continue;
      const maxL = Math.max(...m.encounters.table.map((e) => e.max));
      // closest map whose wild levels are a fair fight for the lead
      const score = maxL > lv + 2 ? 1e9 : (lv - maxL) * 40;
      for (let y = 0; y < m.h; y++)
        for (let x = 0; x < m.w; x++) {
          const t = TILES[tileAt(id, x, y)];
          if (!(t.grass || t.cave)) continue;
          const k = keyOf(MI[id], x, y);
          const d = P.dist.get(k);
          if (d === undefined) continue;
          const c = d + score;
          if (!best || c < best.cost) best = { type: 'grind', key: 'grind:' + id, map: id, node: k, cost: c };
        }
    }
    return best;
  }

  function needHeal() {
    const s = S();
    const L = s.party.reduce((a, m) => (m.lvl > a.lvl ? m : a), s.party[0]);
    if (!L) return false;
    if (!alive(L)) return true;
    if (hpFrac(L) < 0.45) return true;
    if (damagingPP(L) < 4) return true;
    if (L.status) return true;
    return false;
  }

  function supplies() {
    const b = S().bag;
    return {
      heals: (b.potion ?? 0) + (b.superpotion ?? 0) + (b.hyperpotion ?? 0) + (b.maxpotion ?? 0),
      pods: (b.pod ?? 0) + (b.greatpod ?? 0) + (b.ultrapod ?? 0),
    };
  }

  // ------------------------------------------------------------ scene handlers
  function logText(t) {
    B.dialogCount++;
    if (B.texts.size < 6000) B.texts.add(t);
    if (/undefined|NaN|\{[A-Z]+\}|\[object/.test(t)) issue('TEXT PLACEHOLDER: ' + t.slice(0, 120));
  }

  async function onText(sc) {
    const t = sc.pages.map((p) => p.join(' ')).join(' / ');
    if (sc._botSeen !== sc.page) {
      sc._botSeen = sc.page;
      if (sc.page === 0) logText(t);
      const lm = /^(.*?) wants to learn (.*?)\. But/.exec(t);
      if (lm) B.lastLearn = { mon: lm[1], move: lm[2] };
      if (/received the (\w+) BADGE|BADGE/.test(t) && /received|earned/.test(t)) ev('TEXT: ' + t.slice(0, 80));
    }
    await tap('a', 1, 3);
  }

  function learnDecision() {
    const L = B.lastLearn;
    if (!L) return true;
    const mon = S().party.find((m) => (m.nick || sp(m.sp).name).toUpperCase() === L.mon.toUpperCase()) || lead();
    const nm2 = moveByName(L.move);
    if (!mon || !nm2) return true;
    const vals = mon.moves.map((s) => moveValue(mon, s.id));
    return moveValue(mon, nm2.id) > Math.min(...vals) * 1.05;
  }

  function decideChoice(text, opts) {
    const yes = opts.indexOf('YES');
    const no = opts.indexOf('NO');
    let pick = 0;
    if (/nickname/i.test(text)) pick = no;
    else if (/Forget a move/i.test(text)) pick = learnDecision() ? yes : no;
    else if (/Stop learning/i.test(text)) pick = yes;
    else if (/release/i.test(text)) pick = no >= 0 ? no : opts.length - 1;
    else if (/Where do you want to fly/i.test(text)) pick = opts.length - 1;
    else if (/^So, you want (\w+)\?/.test(text)) {
      const want = B.opts.starter;
      pick = !want || text.includes(want) ? yes : no;
    } else if (yes >= 0) pick = yes;
    if (pick < 0) pick = 0;
    const key = text.slice(0, 70) + ' => ' + opts[pick];
    B.prompts[key] = (B.prompts[key] || 0) + 1;
    return pick;
  }

  async function onChoice(sc) {
    const text = sc.lines.join(' ');
    const opts = sc.options;
    const pick = decideChoice(text, opts);
    await menuTo(() => sc.idx, pick, opts.length);
    await tap('a', 1, 3);
  }

  function chooseSwitchTarget(foe, exclude) {
    const s = S();
    let best = -1;
    let bs = -1;
    s.party.forEach((m, i) => {
      if (i === exclude || !alive(m)) return;
      const sc = bestMove(m, foe).dmg / Math.max(1, foe.hp) + m.lvl / 100 + hpFrac(m) * 0.3;
      if (sc > bs) {
        bs = sc;
        best = i;
      }
    });
    return best;
  }

  function shouldCatch(foe, b) {
    const s = S();
    if (b.o.kind !== 'wild') return false;
    if (s.caught.includes(foe.sp)) return false;
    const sup = supplies();
    if (sup.pods + (s.bag.masterpod ?? 0) <= 0) return false;
    return true;
  }
  function bestPod(foe) {
    const b = S().bag;
    if (sp(foe.sp).legendary && b.masterpod) return 'masterpod';
    for (const p of ['ultrapod', 'greatpod', 'pod']) if ((b[p] ?? 0) > 0) return p;
    return null;
  }
  function bestHeal() {
    const b = S().bag;
    for (const p of ['hyperpotion', 'superpotion', 'maxpotion', 'potion', 'fullrestore']) if ((b[p] ?? 0) > 0) return p;
    return null;
  }

  async function onBattle(b) {
    const ui = b.ui;
    if (B.curBattle !== b) {
      B.curBattle = b;
      b._bot = { heals: 0, pods: 0, switched: 0, trainer: b.o.trainer ? b.o.trainer.id : null };
      if (b.o.kind === 'wild') B.battles.wild++;
      else B.battles.trainer++;
    }
    if (ui.kind === 'text' || ui.kind === 'stats') return tap('a', 1, 3);
    if (ui.kind === 'none') return frame(1);
    if (ui.kind === 'yesno') {
      const text = ui.prompt.join(' ');
      let yes = true;
      if (/nickname/i.test(text)) yes = false;
      else if (/Forget a move/i.test(text)) yes = learnDecision();
      else if (/Stop learning/i.test(text)) yes = true;
      const key = '[battle] ' + text.slice(0, 60) + ' => ' + (yes ? 'YES' : 'NO');
      B.prompts[key] = (B.prompts[key] || 0) + 1;
      const want = yes ? 0 : 1;
      if (ui.idx !== want) await tap('down');
      return tap('a', 1, 3);
    }
    const me = b.me.mon;
    const foe = b.foe.mon;
    const st = b._bot;
    const cmdTo = async (c) => {
      for (let k = 0; k < 4 && b.cmdIdx !== c; k++) {
        if (b.cmdIdx % 2 !== c % 2) await tap('right');
        else await tap('down');
      }
      await tap('a', 1, 3);
    };
    if (ui.kind === 'cmd') {
      // heal when in danger
      const heal = bestHeal();
      const foeThreat = foe.lvl >= me.lvl - 3 || b.o.kind === 'trainer';
      if (heal && hpFrac(me) < 0.3 && st.heals < 4 && foeThreat && foe.hp > 0) {
        st.heals++;
        B.battleItem = heal;
        B.itemTarget = b.meIdx;
        return cmdTo(1);
      }
      if (shouldCatch(foe, b) && st.pods < 10) {
        const pod = bestPod(foe);
        const weakest = me.moves
          .map((s2, i) => ({ i, d: estDamage(me, foe, s2.id), pp: s2.pp }))
          .filter((x) => x.pp > 0 && x.d > 0)
          .sort((a, c) => a.d - c.d)[0];
        const frac = foe.hp / X.maxHp(foe);
        if (pod && (frac < 0.55 || !weakest || weakest.d >= foe.hp * 0.9 || foe.status)) {
          st.pods++;
          B.battleItem = pod;
          return cmdTo(1);
        }
        if (weakest) {
          B.pendingMove = weakest.i;
          return cmdTo(0);
        }
      }
      // switch out of hopeless matchups in trainer battles
      const bm = bestMove(me, foe);
      if (b.o.kind === 'trainer' && st.switched < 2 && bm.dmg < foe.hp * 0.12) {
        const t = chooseSwitchTarget(foe, b.meIdx);
        if (t >= 0 && bestMove(S().party[t], foe).dmg > foe.hp * 0.3) {
          st.switched++;
          B.switchTo = t;
          return cmdTo(2);
        }
      }
      // run from wild fights we can't win while weak
      if (b.o.kind === 'wild' && hpFrac(me) < 0.25 && !b.o.noRun) return cmdTo(3);
      B.pendingMove = bm.slot >= 0 ? bm.slot : 0;
      return cmdTo(0);
    }
    if (ui.kind === 'move') {
      const want = B.pendingMove ?? 0;
      const n = me.moves.length;
      await menuTo(() => b.moveIdx, Math.min(want, n - 1), n);
      return tap('a', 1, 3);
    }
    return frame(1);
  }

  async function onParty(sc) {
    const s = S();
    const mode = sc.mode;
    if (sc.sub) {
      const want = mode === 'battle' ? 'SHIFT' : B.menuTask && B.menuTask.kind === 'reorder' ? 'SWITCH' : 'CANCEL';
      const idx = Math.max(0, sc.sub.items.indexOf(want));
      await menuTo(() => sc.sub.idx, idx, sc.sub.items.length);
      return tap('a', 1, 3);
    }
    if (mode === 'forced') {
      const b = g.scenes.find((x) => nm(x) === 'BattleScene');
      const t = b ? chooseSwitchTarget(b.foe.mon, sc.current) : s.party.findIndex(alive);
      await menuTo(() => sc.idx, Math.max(0, t), s.party.length);
      return tap('a', 1, 3);
    }
    if (mode === 'battle') {
      if (B.switchTo === null || B.switchTo === undefined) return tap('b');
      const t = B.switchTo;
      B.switchTo = null;
      await menuTo(() => sc.idx, t, s.party.length);
      return tap('a', 1, 3);
    }
    if (mode === 'item') {
      const t = B.itemTarget ?? 0;
      await menuTo(() => sc.idx, t, s.party.length);
      return tap('a', 1, 3);
    }
    if (mode === 'field' && B.menuTask && B.menuTask.kind === 'reorder') {
      const task = B.menuTask;
      if (task.phase === 'done') return tap('b');
      if (sc.swapFrom === null) {
        await menuTo(() => sc.idx, task.from, s.party.length);
        return tap('a', 1, 3);
      }
      await menuTo(() => sc.idx, task.to, s.party.length);
      await tap('a', 1, 3);
      task.phase = 'done';
      return;
    }
    if (mode === 'pick') {
      issue('PartyScene pick mode seen (script asks to pick a Wildkin) at ' + s.map);
      return tap('a', 1, 3);
    }
    return tap('b');
  }

  async function onBag(sc) {
    const list = sc.entries();
    if (sc.mode === 'battle') {
      const want = B.battleItem;
      B.battleItem = null;
      const idx = want ? list.findIndex((e) => e[0] === want) : -1;
      if (idx < 0) return tap('b');
      await menuTo(() => sc.idx, idx, list.length + 1);
      return tap('a', 1, 3);
    }
    if (sc.sub) {
      await menuTo(() => sc.sub.idx, 0, 2);
      return tap('a', 1, 3);
    }
    const task = B.menuTask;
    if (task && task.kind === 'useItem' && task.phase !== 'done') {
      const idx = list.findIndex((e) => e[0] === task.item);
      if (idx < 0) {
        task.phase = 'done';
        return tap('b');
      }
      B.itemTarget = task.target;
      task.phase = 'done';
      await menuTo(() => sc.idx, idx, list.length + 1);
      return tap('a', 1, 3);
    }
    return tap('b');
  }

  async function onShop(sc) {
    const s = S();
    if (!B.shopPlan) {
      const plan = [];
      const stock = sc.stock;
      const money = () => S().money;
      const pick = (ids) => ids.find((id) => stock.includes(id));
      const healId = pick(['hyperpotion', 'superpotion', 'potion']);
      const podId = pick(['ultrapod', 'greatpod', 'pod']);
      const reviveId = pick(['revive']);
      const sup = supplies();
      const budget = Math.max(0, money() - 500);
      let spend = 0;
      const addBuy = (id, want) => {
        if (!id || want <= 0) return;
        const price = X.ITEMS[id].price;
        const n = Math.min(want, Math.floor((budget * 0.5 - spend) / price));
        if (n > 0) {
          plan.push([id, n]);
          spend += n * price;
        }
      };
      addBuy(healId, 12 - sup.heals);
      addBuy(podId, 15 - sup.pods);
      addBuy(reviveId, 3 - (s.bag.revive ?? 0));
      B.shopPlan = plan;
      B.mem.lastShop = { frames: B.frames, sig: storySig() };
      ev('SHOP at ' + s.map + ': ' + JSON.stringify(plan) + ' money ' + money());
    }
    const plan = B.shopPlan;
    if (sc.stage === 'menu') {
      if (!plan.length) {
        await menuTo(() => sc.menuIdx, 2, 3);
        return tap('a', 1, 3);
      }
      await menuTo(() => sc.menuIdx, 0, 3);
      return tap('a', 1, 3);
    }
    if (sc.stage === 'buy') {
      if (!plan.length) return tap('b');
      const idx = sc.stock.indexOf(plan[0][0]);
      await menuTo(() => sc.idx, idx, sc.stock.length + 1);
      return tap('a', 1, 3);
    }
    if (sc.stage === 'qty') {
      const want = plan[0][1];
      for (let k = 0; k < 120 && sc.qty !== want; k++) {
        if (want - sc.qty >= 10) await tap('right');
        else await tap(sc.qty < want ? 'up' : 'down');
        if (sc.qty === 1 && want > 1 && k > 100) break;
      }
      plan.shift();
      return tap('a', 1, 3);
    }
    if (sc.stage === 'sell') return tap('b');
    return frame(1);
  }

  async function onForget(sc) {
    const m = sc.m;
    const vals = m.moves.map((s2) => moveValue(m, s2.id));
    const newV = moveValue(m, sc.newId);
    let worst = 0;
    vals.forEach((v, i) => {
      if (v < vals[worst]) worst = i;
    });
    const pick = newV > vals[worst] ? worst : 4;
    await menuTo(() => sc.idx, pick, 5);
    return tap('a', 1, 3);
  }

  async function onStartMenu(sc) {
    const task = B.menuTask;
    const items = sc.items();
    if (!task || task.phase === 'done') {
      B.menuTask = null;
      return tap('b');
    }
    const label = { reorder: 'PARTY', useItem: 'BAG', save: 'SAVE', journal: 'JOURNAL' }[task.kind];
    if (task.opened) {
      // came back from the sub screen
      task.phase = 'done';
      return tap('b');
    }
    task.opened = true;
    await menuTo(() => sc.idx, items.indexOf(label), items.length);
    return tap('a', 1, 3);
  }

  // ------------------------------------------------------------ overworld
  function idle(o) {
    return o.busy === 0 && !o.moving && o.fade === 0 && !o.playerPath.length;
  }
  async function face(o, d) {
    if (o.dir !== d) await tap(d, 1, 8);
  }

  async function follow(path, goal) {
    let idx = 0;
    let lastPos = '';
    let still = 0;
    for (let guard = 0; guard < 20000; guard++) {
      const sc = top();
      if (nm(sc) !== 'Overworld' || sc.busy > 0) {
        releaseAll();
        const s0 = S();
        if (!B.interruptAt) B.interruptAt = { map: s0.map, x: s0.x, y: s0.y, sig: storySig() };
        if (nm(sc) !== 'Overworld') return 'scene';
      }
      const o = sc;
      const s = S();
      if (goal.type === 'visit' && s.map === goal.map) {
        releaseAll();
        return 'arrived';
      }
      if (o.busy > 0) {
        releaseAll();
        await frame(1);
        continue;
      }
      if (o.moving || o.fade !== 0) {
        // let go before the tile ends unless the next step keeps the same direction,
        // otherwise holding the key walks straight on into the next tile
        if (o.moving) {
          const e = path[idx];
          const nx = path[idx + 1];
          const keep = e && nx && nx.d === e.d && nx.kind !== 'mount' && nx.kind !== 'cut' && nx.kind !== 'smash' && o.moving === e.d;
          const dist = o.jump ? 32 : 16;
          if (!keep && o.off >= dist - 3) releaseAll();
          if (keep && o.off >= dist - 3) {
            const curK = keyOf(MI[s.map], s.x, s.y);
            if (curK === e.from) idx = idx + 1;
          }
        }
        await frame(1);
        continue;
      }
      const cur = keyOf(MI[s.map], s.x, s.y);
      const pos = s.map + s.x + ',' + s.y;
      if (pos !== lastPos) {
        lastPos = pos;
        still = 0;
      }
      if (cur === goal.node) {
        releaseAll();
        return 'arrived';
      }
      let j = -1;
      for (let q = idx; q < path.length; q++)
        if (path[q].from === cur) {
          j = q;
          break;
        }
      if (j < 0) {
        releaseAll();
        return 'deviated';
      }
      idx = j;
      const e = path[j];
      if (e.kind === 'mount' || e.kind === 'cut' || e.kind === 'smash') {
        releaseAll();
        await face(o, e.d);
        const t = unkey(e.to);
        const ak = [MAP_IDS[t.mi], t.x, t.y].join(',');
        B.actionTries = B.actionTries || {};
        B.actionTries[ak] = (B.actionTries[ak] || 0) + 1;
        if (B.actionTries[ak] > 4) {
          issue('BOT: field action at ' + ak + ' (' + e.kind + ') had no effect 4 times');
          B.mem.avoid[[MAP_IDS[t.mi], t.x, t.y, storySig()].join(',')] = 1;
          return 'blocked';
        }
        await tap('a', 1, 4);
        return 'action';
      }
      for (const d of DIRS) if (d !== e.d) release(d);
      press(e.d);
      await frame(1);
      still++;
      if (still > 90) {
        releaseAll();
        const t = unkey(e.kind === 'warp' ? e.via : e.to);
        const tid = MAP_IDS[t.mi];
        if (tid === s.map) {
          B.mem.avoid[[tid, t.x, t.y, storySig()].join(',')] = 1;
          saveMem();
        }
        return 'blocked';
      }
    }
    releaseAll();
    return 'timeout';
  }

  function maybeMenuTask() {
    const s = S();
    // keep the strongest healthy Wildkin in front
    const strongest = s.party.reduce((bi, m, i) => (alive(m) && (bi < 0 || m.lvl > s.party[bi].lvl) ? i : bi), -1);
    if (strongest > 0 && alive(s.party[strongest]) && s.party[strongest].lvl > s.party[0].lvl) return { kind: 'reorder', from: strongest, to: 0 };
    const L = s.party[0];
    if (!L) return null;
    // field heal with potions when only HP is low
    if (alive(L) && hpFrac(L) < 0.45 && !L.status) {
      const h = bestHeal();
      if (h) return { kind: 'useItem', item: h, target: 0 };
    }
    if (!alive(L) && (s.bag.revive ?? 0) > 0) return { kind: 'useItem', item: 'revive', target: 0 };
    if ((s.bag.candy ?? 0) > 0) return { kind: 'useItem', item: 'candy', target: 0 };
    for (const id of Object.keys(s.bag)) {
      if (!(s.bag[id] > 0)) continue;
      const def = X.ITEMS[id];
      if (!def) continue;
      if (def.kind === 'evo') {
        const t = s.party.findIndex((m) => X.evolutionByItem(m, id) !== null);
        if (t >= 0 && !(B.mem.usedEvo || {})[id + t]) {
          B.mem.usedEvo = B.mem.usedEvo || {};
          B.mem.usedEvo[id + t] = 1;
          return { kind: 'useItem', item: id, target: t };
        }
      }
      if (def.kind === 'tm' && !(B.mem.usedTm || {})[id]) {
        const m = s.party[0];
        if (X.canLearnTM(sp(m.sp), def.move) && !m.moves.some((x) => x.id === def.move)) {
          const vals = m.moves.map((x) => moveValue(m, x.id));
          if (m.moves.length < 4 || moveValue(m, def.move) > Math.min(...vals) * 1.1) {
            B.mem.usedTm = B.mem.usedTm || {};
            B.mem.usedTm[id] = 1;
            return { kind: 'useItem', item: id, target: 0 };
          }
        }
      }
    }
    // save after each new badge (exercises the manual save path)
    if (s.badges.length !== B.mem.lastSaveBadges) {
      B.mem.lastSaveBadges = s.badges.length;
      return { kind: 'save' };
    }
    return null;
  }

  async function onOverworld(o) {
    const s = S();
    if (!idle(o)) {
      releaseAll();
      return frame(1);
    }
    if (s.surfing) B.actionTries = {};
    B.mem.visitedMaps = B.mem.visitedMaps || [];
    if (!B.mem.visitedMaps.includes(s.map)) {
      B.mem.visitedMaps.push(s.map);
      ev('VISIT ' + s.map);
    }
    const sig = storySig();
    // a script that moved us off the tile it fired on is a pushback: avoid that tile
    if (B.interruptAt) {
      const ia = B.interruptAt;
      B.interruptAt = null;
      if (ia.map === s.map && (ia.x !== s.x || ia.y !== s.y) && Math.abs(ia.x - s.x) + Math.abs(ia.y - s.y) === 1 && ia.sig === sig) {
        B.mem.avoid[[ia.map, ia.x, ia.y, sig].join(',')] = 1;
        ev('PUSHBACK avoid ' + ia.map + ' ' + ia.x + ',' + ia.y);
        saveMem();
      }
    }
    if (sig !== B.lastSig) {
      B.lastSig = sig;
      B.lastProgressFrame = B.frames;
      saveMem();
    }
    if (!s.party.length) {
      // before the starter: talk to people and find the lab
    } else {
      const task = maybeMenuTask();
      if (task) {
        B.menuTask = task;
        task.phase = 'start';
        await tap('start', 1, 4);
        return;
      }
    }
    if (!needHeal()) B.healTries = {};
    const P = plan();
    let goal = null;
    if (s.party.length && needHeal()) goal = nearestHeal(P);
    if (!goal && s.party.length) {
      const sup = supplies();
      const last = B.mem.lastShop;
      const stale = !last || last.sig !== sig || B.frames - last.frames > 200000;
      if ((sup.heals < 4 || sup.pods < 4) && s.money >= 600 && stale) {
        const m = nearestMart(P);
        if (m && m.cost < 120) goal = m;
      }
    }
    let unready = [];
    if (!goal) {
      const gs = candidateGoals(P);
      unready = gs.filter((x) => x.type === 'trainer-unready');
      const ready = gs.filter((x) => x.type !== 'trainer-unready');
      ready.sort((a, c) => a.cost + (a.bias || 0) - (c.cost + (c.bias || 0)));
      goal = ready[0] || null;
      if (goal && unready.length && goal.cost > 400) goal = null;
    }
    if (!goal && unready.length) goal = grindGoal(P);
    if (!goal) {
      B.noGoalCount++;
      if (B.noGoalCount % 50 === 1) ev('NO GOAL at ' + s.map + ' unready=' + unready.map((u) => u.tid).join(','));
      if (B.noGoalCount === 100) {
        // forget pushback tiles and earlier conversations, then look again
        ev('NO GOAL reset: clearing avoid list and talk memory');
        B.mem.avoid = {};
        B.mem.talked = {};
        B.mem.trig = {};
        saveMem();
      }
      if (B.noGoalCount > 400) {
        B.done = true;
        B.status = 'no goals left';
      }
      // wander a step so moving NPCs can clear
      await tap(DIRS[B.frames % 4], 1, 2);
      return frame(20);
    }
    B.noGoalCount = 0;
    B.goal = { type: goal.type, key: goal.key, cost: goal.cost };
    const path = pathTo(P, goal.node);
    if (!path) return frame(1);
    if (goal.type === 'goto') {
      // triggers are tried once per story state; pushbacks would otherwise loop forever
      B.mem.trig[goal.key] = sig;
      saveMem();
    }
    const r = await follow(path, goal);
    B.trace = B.trace || [];
    B.trace.push(`${goal.type}:${goal.key} c${goal.cost} len${path.length} -> ${r} @${S().map}${S().x},${S().y}`);
    if (B.trace.length > 60) B.trace.shift();
    if (r !== 'arrived') return;
    const o2 = top();
    if (nm(o2) !== 'Overworld') return;
    if (goal.type === 'visit') return;
    if (goal.type === 'goto') {
      B.mem.trig[goal.key] = sig;
      saveMem();
      return frame(4);
    }
    if (goal.type === 'grind') {
      // pace inside the grass until something happens
      for (let k = 0; k < 40; k++) {
        if (nm(top()) !== 'Overworld' || needHeal()) return;
        const o3 = top();
        const dirs = DIRS.filter((d) => {
          const x = S().x + DX[d];
          const y = S().y + DY[d];
          const m = MAPS[S().map];
          if (x < 0 || y < 0 || x >= m.w || y >= m.h) return false;
          const t = TILES[tileAt(S().map, x, y)];
          return (t.grass || t.cave) && !o3.blocked(x, y);
        });
        if (!dirs.length) return;
        await tap(dirs[(B.frames >> 3) % dirs.length], 1, 0);
        for (let w = 0; w < 30 && nm(top()) === 'Overworld' && (top().moving || top().busy); w++) await frame(1);
        B.grindSteps++;
      }
      return;
    }
    // interact
    await face(o2, goal.face);
    if (goal.type === 'heal') {
      B.healTries = B.healTries || {};
      B.healTries[goal.key] = (B.healTries[goal.key] || 0) + 1;
      if (B.healTries[goal.key] > 6) {
        B.badHeal = B.badHeal || {};
        B.badHeal[goal.key] = 1;
        issue('BOT: healing at ' + goal.key + ' did not help 6 times');
      }
    }
    if (goal.type === 'talk' || goal.type === 'heal' || goal.type === 'shop') {
      B.mem.talked[goal.key] = sig;
      if (goal.type === 'shop') B.shopPlan = null;
      saveMem();
    }
    await tap('a', 1, 4);
  }

  // ------------------------------------------------------------ main loop
  async function tick() {
    const sc = top();
    const n = nm(sc);
    if (n !== B.lastScene) {
      B.lastScene = n;
      B.unknownFrames = 0;
    }
    switch (n) {
      case 'TitleScene': {
        if (sc.stage === 'press' || !sc.menuItems) return tap('a', 1, 4);
        if (sc.busy) return frame(1);
        const items = sc.menuItems();
        const want = B.opts.continue && items.includes('CONTINUE') ? 'CONTINUE' : 'NEW GAME';
        await menuTo(() => sc.idx, items.indexOf(want), items.length);
        return tap('a', 1, 4);
      }
      case 'NamingScene':
        if (sc.stage === 'preset') {
          await menuTo(() => sc.presetIdx, 1, sc.presets.length + 1);
          return tap('a', 1, 4);
        }
        return tap('start', 1, 4);
      case 'TextScene':
        return onText(sc);
      case 'ChoiceScene':
        return onChoice(sc);
      case 'BattleScene':
        return onBattle(sc);
      case 'PartyScene':
        return onParty(sc);
      case 'BagScene':
        return onBag(sc);
      case 'ShopScene':
        return onShop(sc);
      case 'ForgetMoveScene':
        return onForget(sc);
      case 'StartMenu':
        return onStartMenu(sc);
      case 'Overworld':
        return onOverworld(sc);
      case 'EvolutionScene':
        return frame(4);
      case 'IntroScene':
        return tap('a', 1, 6);
      case 'EndingScene':
        if (!sc._botCounted) {
          sc._botCounted = true;
          B.mem.leagueClears = (B.mem.leagueClears || 0) + 1;
        }
        if (!B.mem.sawEnding) {
          B.mem.sawEnding = true;
          ev('ENDING SCENE reached');
          saveMem();
        }
        await frame(30);
        return tap('a', 1, 4);
      case 'StorageScene':
      case 'SummaryScene':
      case 'DexScene':
      case 'JournalScene':
      case 'OptionsScene':
        return tap('b', 1, 4);
      default:
        B.unknownFrames++;
        if (B.unknownFrames > 900 && B.unknownFrames % 60 === 0) {
          issue('Long wait on scene ' + n);
          return tap(B.unknownFrames % 120 === 0 ? 'a' : 'b');
        }
        return frame(1);
    }
  }

  B._plan = plan;
  B._goals = candidateGoals;
  B._keyOf = keyOf;
  B._MI = MI;
  B.summary = () => {
    const s = S();
    return {
      frames: B.frames,
      scene: nm(top()),
      map: s && s.map,
      pos: s && [s.x, s.y],
      badges: s ? s.badges.slice() : [],
      party: s ? s.party.map((m) => `${sp(m.sp).name}:${m.lvl}:${m.hp}`) : [],
      money: s && s.money,
      caught: s ? s.caught.length : 0,
      seen: s ? s.seen.length : 0,
      champion: !!(s && s.flags.champion),
      goal: B.goal,
      battles: B.battles,
      issues: B.issues.length,
      status: B.status,
      done: B.done,
      sinceProgress: B.frames - B.lastProgressFrame,
      playTime: s ? Math.round(s.playTime) : 0,
    };
  };

  B.run = async (budget) => {
    const end = B.frames + budget;
    while (B.frames < end && !B.done) {
      try {
        const f0 = B.frames;
        await tick();
        // every tick must advance the game, or the page would spin without yielding
        if (B.frames === f0) {
          B.zeroTicks = (B.zeroTicks || 0) + 1;
          if (B.zeroTicks % 500 === 1) issue('BOT: tick without frame progress (goal ' + JSON.stringify(B.goal) + ')');
          await frame(1);
        }
      } catch (e) {
        B.errorsSeen++;
        issue('BOT ERROR: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e));
        releaseAll();
        await frame(5);
        if (B.errorsSeen > 200) {
          B.done = true;
          B.status = 'too many bot errors';
        }
      }
    }
    return B.summary();
  };
})();
