// Vendored from https://github.com/levy-street/pokemon-claude-red (no licence; see the README attribution).
const G = globalThis.G;
// Pokémon sprite rasterizer: turns a primitive description into shaded, outlined pixel art.
//
// Definition format (coordinates in a 64x64 space, y down, ground near y=60):
//   G.defMon('PIKACHU', { pal: { body:'#f8d030', ... }, parts: [ ...primitives ] })
// Primitives (all accept c: color or palette key, g: group name, z: order, face: true to hide on back view):
//   {t:'e', x, y, rx, ry, rot}          ellipsoid (sphere shaded)
//   {t:'c', x1,y1, x2,y2, r1, r2}        tapered capsule (cylinder shaded) - limbs, tails, necks
//   {t:'p', pts:[x,y,...]}               polygon (flat with bevelled edges) - ears, spikes, fins, leaves
//   {t:'l', pts:[x,y,...], w, w2}        stroke polyline with width tapering w -> w2 (whiskers, antennae, tails)
//   {t:'eye', x, y, s, style, iris, look:[dx,dy]}  styles: round, angry, sleepy, closed, dot, happy, sad
//   {t:'mouth', x, y, w, style}          styles: smile, open, fang, line, frown, beak, tongue
//   {t:'spot', x, y, rx, ry, on:'group'} pattern clipped to a group (inherits its lighting)
//   {t:'stripe', pts:[...], w, on:'group'} stroke pattern clipped to a group
//   {t:'shine', x, y}                    tiny specular sparkle
// Back view is generated automatically: mirrored, enlarged 1.18x, parts with face:true / frontOnly:true removed,
// bz:<number> overrides z for the back view, backOnly:true parts appear only on the back (e.g. shell pattern).
// Options: flat:true (no sphere lighting), gloss:true (extra highlight), soft:true (softer 3-tone), line:false (no inner line)
(function (G) {
  'use strict';
  const { Surface, hex, shade, mix, rgb } = G.gfx;
  const DEFS = {};
  const L = (() => { const v = [-0.5, -0.72, 0.62]; const n = Math.hypot(v[0], v[1], v[2]); return v.map(x => x / n); })();

  function col(c, pal) { if (typeof c === 'number') return c; if (pal && pal[c]) return hex(pal[c]); return hex(c || '#ff00ff'); }
  const rampCache = new Map();
  function ramp(c) {
    let r = rampCache.get(c);
    if (!r) {
      r = [shade(c, -0.62), shade(c, -0.38), shade(c, -0.17), c, shade(c, 0.2), shade(c, 0.42)];
      rampCache.set(c, r);
    }
    return r;
  }

  // Rasterize a definition. scale: output size / 64. view: 'front'|'back'
  function render(def, size, view) {
    size = size || 64; view = view || 'front';
    const S = size / 64;
    const W = size, H = size;
    const n = W * H;
    const gid = new Int16Array(n).fill(-1);     // group index per pixel
    const zbuf = new Float32Array(n).fill(-1e9);
    const inten = new Float32Array(n);          // lighting intensity
    const colr = new Uint32Array(n);            // base color
    const flags = new Uint8Array(n);            // 1 gloss, 2 flat, 4 noline
    const groups = [];
    const gIndex = name => { let i = groups.indexOf(name); if (i < 0) { groups.push(name); i = groups.length - 1; } return i; };
    let parts = def.parts.filter(p => !p.backOnly);
    if (view === 'back') parts = def.back || autoBack(def.parts);
    const pal = def.pal || {};
    const deferred = [];
    parts.forEach((p, order) => {
      if (['eye', 'mouth', 'shine'].includes(p.t)) { deferred.push(p); return; }
      const z = (p.z || 0) * 1000 + order;
      const g = gIndex(p.g || ('_' + order));
      const c = col(p.c, pal);
      const fl = (p.gloss ? 1 : 0) | (p.flat ? 2 : 0) | (p.line === false ? 4 : 0);
      const on = p.on !== undefined ? groups.indexOf(p.on) : -1;
      const put = (x, y, I) => {
        const i = y * W + x;
        if (p.on !== undefined) {
          if (on < 0 || gid[i] !== on) return;
          colr[i] = c; if (p.flatten) inten[i] = I; return;
        }
        if (z < zbuf[i]) return;
        zbuf[i] = z; gid[i] = g; colr[i] = c; inten[i] = I; flags[i] = fl;
      };
      rasterPart(p, S, W, H, put);
    });
    // compose shaded pixels
    const s = new Surface(W, H);
    for (let i = 0; i < n; i++) {
      if (gid[i] < 0) continue;
      const R = ramp(colr[i]);
      let I = inten[i];
      let k;
      if (flags[i] & 2) k = I > 0.55 ? 4 : I > 0.1 ? 3 : 2;
      else k = I > 0.86 ? 5 : I > 0.62 ? 4 : I > 0.32 ? 3 : I > 0.08 ? 2 : 1;
      if (k === 5 && !(flags[i] & 1) && I < 0.94) k = 4;
      // dither the transition bands lightly
      const x = i % W, y = (i / W) | 0;
      const f = I * 10 % 1;
      if ((f < 0.12) && G.gfx.bayer(x, y) < 0.5 && k > 1 && !(flags[i] & 2)) k--;
      s.data[i] = R[k];
    }
    // inner lines: boundary between different groups -> darken the front pixel
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; if (gid[i] < 0 || (flags[i] & 4)) continue;
      let edge = false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const j = yy * W + xx;
        if (gid[j] >= 0 && gid[j] !== gid[i] && zbuf[i] > zbuf[j] && !(flags[j] & 4)) { edge = true; break; }
      }
      if (edge) s.data[i] = ramp(colr[i])[0];
    }
    // facial features & sparkles on top
    for (const p of deferred) {
      if (view === 'back' && p.face !== false) continue;
      drawFeature(s, p, S, pal);
    }
    // outer outline: tinted dark of neighbour
    const src = s.data.slice();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; if ((src[i] >>> 24) !== 0) continue;
      let nb = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const j = yy * W + xx; if ((src[j] >>> 24) !== 0 && gid[j] >= 0) { nb = colr[j]; break; }
      }
      if (nb) s.data[i] = mix(shade(nb, -0.8), hex('#141220'), 0.55);
    }
    return s;
  }

  function rasterPart(p, S, W, H, put) {
    if (p.t === 'e') {
      const cx = p.x * S, cy = p.y * S, rx = p.rx * S, ry = (p.ry || p.rx) * S, rot = (p.rot || 0) * Math.PI / 180;
      const cs = Math.cos(rot), sn = Math.sin(rot);
      const R = Math.max(rx, ry) + 1;
      for (let y = Math.max(0, Math.floor(cy - R)); y <= Math.min(H - 1, Math.ceil(cy + R)); y++)
        for (let x = Math.max(0, Math.floor(cx - R)); x <= Math.min(W - 1, Math.ceil(cx + R)); x++) {
          const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
          const u = (dx * cs + dy * sn) / rx, v = (-dx * sn + dy * cs) / ry;
          const d2 = u * u + v * v; if (d2 > 1) continue;
          const nz = Math.sqrt(1 - d2);
          // normal back to screen space
          const nx = u * cs - v * sn, ny = u * sn + v * cs;
          const I = p.flat ? 0.5 - (ny * 0.3) : nx * L[0] + ny * L[1] + nz * L[2];
          put(x, y, I);
        }
    } else if (p.t === 'c') {
      const x1 = p.x1 * S, y1 = p.y1 * S, x2 = p.x2 * S, y2 = p.y2 * S, r1 = p.r1 * S, r2 = (p.r2 === undefined ? p.r1 : p.r2) * S;
      const minx = Math.floor(Math.min(x1 - r1, x2 - r2)) - 1, maxx = Math.ceil(Math.max(x1 + r1, x2 + r2)) + 1;
      const miny = Math.floor(Math.min(y1 - r1, y2 - r2)) - 1, maxy = Math.ceil(Math.max(y1 + r1, y2 + r2)) + 1;
      const ax = x2 - x1, ay = y2 - y1, len2 = ax * ax + ay * ay || 1;
      for (let y = Math.max(0, miny); y <= Math.min(H - 1, maxy); y++) for (let x = Math.max(0, minx); x <= Math.min(W - 1, maxx); x++) {
        const px = x + 0.5 - x1, py = y + 0.5 - y1;
        let t = (px * ax + py * ay) / len2; t = Math.max(0, Math.min(1, t));
        const r = r1 + (r2 - r1) * t;
        const qx = px - ax * t, qy = py - ay * t;
        const d = Math.hypot(qx, qy); if (d > r) continue;
        const u = qx / r, v = qy / r;
        const nz = Math.sqrt(Math.max(0, 1 - u * u - v * v));
        const I = p.flat ? 0.5 : u * L[0] + v * L[1] + nz * L[2];
        put(x, y, I);
      }
    } else if (p.t === 'p' || p.t === 'stripe' && false) {
      const pts = p.pts.map(v => v * S);
      const np = pts.length / 2;
      let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
      for (let k = 0; k < np; k++) { minx = Math.min(minx, pts[k * 2]); maxx = Math.max(maxx, pts[k * 2]); miny = Math.min(miny, pts[k * 2 + 1]); maxy = Math.max(maxy, pts[k * 2 + 1]); }
      // polygon orientation (for outward normals)
      let area = 0; for (let k = 0; k < np; k++) { const a = k * 2, b = ((k + 1) % np) * 2; area += pts[a] * pts[b + 1] - pts[b] * pts[a + 1]; }
      const sgn = area > 0 ? 1 : -1;
      for (let y = Math.max(0, Math.floor(miny)); y <= Math.min(H - 1, Math.ceil(maxy)); y++) for (let x = Math.max(0, Math.floor(minx)); x <= Math.min(W - 1, Math.ceil(maxx)); x++) {
        const sx = x + 0.5, sy = y + 0.5;
        let inside = false;
        for (let k = 0, j = np - 1; k < np; j = k++) {
          const xi = pts[k * 2], yi = pts[k * 2 + 1], xj = pts[j * 2], yj = pts[j * 2 + 1];
          if (((yi > sy) !== (yj > sy)) && (sx < (xj - xi) * (sy - yi) / (yj - yi) + xi)) inside = !inside;
        }
        if (!inside) continue;
        // nearest edge normal for bevel lighting
        let best = 1e9, bnx = 0, bny = 0;
        for (let k = 0; k < np; k++) {
          const ax = pts[k * 2], ay = pts[k * 2 + 1], bx = pts[((k + 1) % np) * 2], by = pts[((k + 1) % np) * 2 + 1];
          const ex = bx - ax, ey = by - ay, l2 = ex * ex + ey * ey || 1;
          let t = ((sx - ax) * ex + (sy - ay) * ey) / l2; t = Math.max(0, Math.min(1, t));
          const dx = sx - (ax + ex * t), dy = sy - (ay + ey * t), d = Math.hypot(dx, dy);
          if (d < best) { best = d; const ln = Math.sqrt(l2); bnx = sgn * ey / ln; bny = -sgn * ex / ln; }
        }
        const bev = Math.max(0, 1 - best / (2.2 * S + 0.8));
        const nz = 1 - bev * 0.7;
        const I = p.flat ? 0.5 : (bnx * L[0] + bny * L[1]) * bev + nz * L[2] * 1.05 + 0.05;
        put(x, y, I);
      }
    } else if (p.t === 'l' || p.t === 'stripe') {
      const pts = p.pts; const segs = pts.length / 2 - 1;
      const w1 = (p.w || 2) * S / 2, w2 = (p.w2 === undefined ? p.w || 2 : p.w2) * S / 2;
      let total = 0; const lens = [];
      for (let k = 0; k < segs; k++) { const l = Math.hypot(pts[k * 2 + 2] - pts[k * 2], pts[k * 2 + 3] - pts[k * 2 + 1]); lens.push(l); total += l; }
      let acc = 0;
      for (let k = 0; k < segs; k++) {
        const t0 = acc / total, t1 = (acc + lens[k]) / total; acc += lens[k];
        rasterPart({ t: 'c', x1: pts[k * 2], y1: pts[k * 2 + 1], x2: pts[k * 2 + 2], y2: pts[k * 2 + 3], r1: (w1 + (w2 - w1) * t0) / S, r2: (w1 + (w2 - w1) * t1) / S, flat: p.flat }, S, W, H, put);
      }
    } else if (p.t === 'spot') {
      rasterPart({ t: 'e', x: p.x, y: p.y, rx: p.rx, ry: p.ry || p.rx, rot: p.rot }, S, W, H, (x, y, I) => put(x, y, I));
    }
  }

  function drawFeature(s, p, S, pal) {
    const x = Math.round(p.x * S), y = Math.round(p.y * S);
    const dark = hex('#1b1a2e'), white = hex('#ffffff');
    if (p.t === 'shine') { s.pset(x, y, white); return; }
    if (p.t === 'eye') {
      const sz = Math.max(1, (p.s || 3) * S);
      const iris = p.iris ? col(p.iris, pal) : null;
      const lk = p.look || [0, 0];
      const style = p.style || 'round';
      if (style === 'closed' || style === 'happy') {
        const w = Math.max(2, Math.round(sz * 1.2));
        for (let i = -w; i <= w; i++) { const yy = style === 'happy' ? -Math.round((1 - (i * i) / (w * w)) * sz * 0.5) : Math.round((i * i) / (w * w) * sz * 0.4); s.pset(x + i, y + yy, dark); }
        return;
      }
      if (style === 'dot') { s.pset(x, y, dark); if (sz > 1.5) { s.pset(x, y + 1, dark); s.pset(x + 1, y, dark); s.pset(x + 1, y + 1, dark); } return; }
      const rx = Math.max(1, sz * (p.wide || 0.75)), ry = Math.max(1.2, sz);
      // sclera
      const scl = p.sclera === false ? null : white;
      for (let j = Math.floor(-ry - 1); j <= Math.ceil(ry + 1); j++) for (let i = Math.floor(-rx - 1); i <= Math.ceil(rx + 1); i++) {
        const u = (i + 0.5) / (rx + 0.5), v = (j + 0.5) / (ry + 0.5); const d = u * u + v * v;
        if (d > 1.15) continue;
        let c = d > 0.72 ? dark : (scl || dark);
        if (style === 'angry' && v < -0.2 + (p.flip ? -u : u) * 0.6) c = d > 0.72 ? dark : null;
        if (style === 'sleepy' && v < -0.1) c = d > 0.72 ? null : null;
        if (style === 'sad' && v < -0.25 + (p.flip ? u : -u) * 0.5) c = null;
        if (c !== null) s.pset(x + i, y + j, c);
      }
      if (style === 'sleepy') { for (let i = Math.floor(-rx); i <= Math.ceil(rx); i++) s.pset(x + i, y, dark); }
      // pupil / iris
      const pr = Math.max(0.8, Math.min(rx, ry) * 0.62);
      const px = x + lk[0] * rx * 0.35, py = y + lk[1] * ry * 0.3 + (style === 'sleepy' ? ry * 0.4 : 0);
      for (let j = Math.floor(-pr - 1); j <= Math.ceil(pr + 1); j++) for (let i = Math.floor(-pr - 1); i <= Math.ceil(pr + 1); i++) {
        const d = ((i + 0.5) * (i + 0.5) + (j + 0.5) * (j + 0.5)) / ((pr + 0.4) * (pr + 0.4)); if (d > 1) continue;
        const xx = Math.round(px + i), yy = Math.round(py + j);
        const cur = s.pget(xx, yy); if ((cur >>> 24) === 0 || cur !== white && cur !== dark) continue;
        s.pset(xx, yy, iris && d > 0.35 ? iris : dark);
      }
      // highlight
      s.pset(Math.round(px - pr * 0.5), Math.round(py - pr * 0.6), white);
      if (sz >= 3.5) s.pset(Math.round(px - pr * 0.5) + 1, Math.round(py - pr * 0.6), white);
      return;
    }
    if (p.t === 'mouth') {
      const w = Math.max(1, Math.round((p.w || 4) * S));
      const st = p.style || 'smile';
      const mc = p.c ? col(p.c, pal) : dark;
      if (st === 'line') { for (let i = -w; i <= w; i++) s.pset(x + i, y, mc); return; }
      if (st === 'smile' || st === 'frown') {
        for (let i = -w; i <= w; i++) { const k = Math.round((i * i) / (w * w) * (w * 0.5)); s.pset(x + i, st === 'smile' ? y - k : y + k - Math.round(w * 0.5), mc); }
        return;
      }
      if (st === 'open' || st === 'fang' || st === 'tongue') {
        const h = Math.max(2, Math.round(w * 0.9));
        for (let j = 0; j <= h; j++) for (let i = -w; i <= w; i++) {
          const u = i / (w + 0.5), v = j / (h + 0.5);
          if (u * u + (v - 0.1) * (v - 0.1) * 1.2 > 1 || v < 0) continue;
          const edge = u * u + (v - 0.1) * (v - 0.1) * 1.2 > 0.6 || j === 0;
          let c = edge ? dark : hex('#8a2838');
          if (!edge && (st === 'tongue' || j > h * 0.55)) c = hex('#e8687a');
          s.pset(x + i, y + j, c);
        }
        if (st === 'fang') { s.pset(x - w + 1, y + 1, white); s.pset(x + w - 1, y + 1, white); s.pset(x - w + 1, y + 2, white); s.pset(x + w - 1, y + 2, white); }
        return;
      }
    }
  }

  // Back view: hide face features, mirror, slightly zoom (camera behind)
  function topOf(p) {
    if (p.t === 'e' || p.t === 'spot') return p.y - (p.ry || p.rx);
    if (p.t === 'c') return Math.min(p.y1 - p.r1, p.y2 - (p.r2 === undefined ? p.r1 : p.r2));
    if (p.pts) { let m = 1e9; for (let i = 1; i < p.pts.length; i += 2) m = Math.min(m, p.pts[i]); return m - (p.w || 0) / 2; }
    return 64;
  }
  function autoBack(parts) {
    let top = 64;
    for (const p of parts) if (!p.face && !p.frontOnly && !['eye', 'mouth', 'shine'].includes(p.t) && p.on === undefined) top = Math.min(top, topOf(p));
    const k = Math.max(1, Math.min(1.18, 64 / (66 - top)));
    return parts.filter(p => !p.face && !p.frontOnly && !['eye', 'mouth'].includes(p.t)).map(p => {
      const q = Object.assign({}, p);
      if (q.bz !== undefined) q.z = q.bz;
      const mx = v => 64 - v;
      if (q.x !== undefined) q.x = mx(q.x);
      if (q.x1 !== undefined) { q.x1 = mx(q.x1); q.x2 = mx(q.x2); }
      if (q.pts) q.pts = q.pts.map((v, i) => i % 2 === 0 ? mx(v) : v);
      if (q.rot) q.rot = -q.rot;
      if (q.belly) return null;
      return q;
    }).filter(Boolean).map(p => scaleBack(p, k));
  }
  function scaleBack(p, k) {
    // enlarge around bottom-centre so the back view is larger and cropped at the bottom
    const ox = 32, oy = 66;
    const q = Object.assign({}, p);
    const tx = v => ox + (v - ox) * k, ty = v => oy + (v - oy) * k;
    if (q.x !== undefined) { q.x = tx(q.x); q.y = ty(q.y); }
    if (q.rx) q.rx *= k; if (q.ry) q.ry *= k; if (q.r1) q.r1 *= k; if (q.r2) q.r2 *= k; if (q.w) q.w *= k; if (q.w2) q.w2 *= k;
    if (q.x1 !== undefined) { q.x1 = tx(q.x1); q.y1 = ty(q.y1); q.x2 = tx(q.x2); q.y2 = ty(q.y2); }
    if (q.pts) q.pts = q.pts.map((v, i) => i % 2 === 0 ? tx(v) : ty(v));
    return q;
  }

  const cache = {};
  function pokeSprite(sp, view, size) {
    size = size || 64;
    const key = sp + ':' + view + ':' + size;
    if (cache[key]) return cache[key];
    const def = DEFS[sp];
    let s = G.glitchSprite ? G.glitchSprite(sp, view, size) : null; // MISSINGNO. and friends (src/game/glitches.js)
    if (s) {}
    else if (def) s = render(def, size, view);
    else s = placeholder(sp, size, view);
    cache[key] = s;
    return s;
  }
  function placeholder(sp, size, view) {
    const d = G.DATA && G.DATA.species[sp];
    const t = d ? d.types[0] : 'NORMAL';
    const c = (G.TYPE_COL && G.TYPE_COL[t]) || '#a8a878';
    const h = G.gfx.hash2((d && d.dex) || 1, 3, 9);
    const def = { parts: [
      { t: 'e', x: 32, y: 44, rx: 16 + h * 6, ry: 14, c, g: 'b' },
      { t: 'e', x: 32, y: 26, rx: 11, ry: 10, c, g: 'b' },
      { t: 'p', pts: [22, 22, 20, 8, 28, 18], c },
      { t: 'p', pts: [42, 22, 44, 8, 36, 18], c },
      { t: 'eye', x: 27, y: 25, s: 2.5 }, { t: 'eye', x: 37, y: 25, s: 2.5 },
      { t: 'mouth', x: 32, y: 31, w: 2, style: 'smile' },
    ] };
    return render(def, size, view);
  }

  G.defMon = (sp, def) => { DEFS[sp] = def; for (const k in cache) if (k.startsWith(sp + ':')) delete cache[k]; };
  G.MONDEFS = DEFS;
  G.pokeSprite = pokeSprite;
  G.renderMonDef = render;
  G.substituteSprite = view => pokeSprite('_SUBSTITUTE', view);
})(globalThis.G);
