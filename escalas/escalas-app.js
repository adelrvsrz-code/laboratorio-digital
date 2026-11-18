(function () {
'use strict';
const C = 299792458, TAU = Math.PI * 2;
const $ = (s, r) => (r || document).querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const log10 = Math.log10;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- formato ---------- */
/* Los formateadores son los de la base compartida (base-fmt.js), en el idioma del archivo de textos. */
const { sci, sup, fmtLen, fmtTime, fmtCount, fmtTimes, fmtMult } = BASEFMT(T.lang);

/* ---------- datos ---------- */
/* Cada objeto recibe los textos de su idioma: nombre, qué mide el tamaño, descripción y, si lo hay, rótulo del icono. */
for (const o of OBJECTS) {
  const t = T.obj[o.id]; o.n = t.n; o.sub = t.sub; o.d = t.d;
  if (t.lab) o.i = [o.i[0], Object.assign({}, o.i[1], { label: t.lab })];
}
const ALL = OBJECTS.slice().sort((a, b) => a.s - b.s);
ALL.forEach((o, i) => { o.idx = i; o.lg = log10(o.s); o.col = CATS[o.c].col; });
const byId = Object.fromEntries(ALL.map(o => [o.id, o]));
const LG0 = ALL[0].lg - .5, LG1 = ALL[ALL.length - 1].lg + .5;

const realmOf = lg => { for (let i = 0; i < REALMS.length; i++) if (lg < REALMS[i][0]) return i; return REALMS.length - 1; };

/* ---------- estado ---------- */
const S = { W: 1, H: 1, fpx: 300, cy: 0, logS: 0, target: 0, min: -40, max: 40, objs: ALL, hidden: new Set(), sel: null, tour: false, hold: 0, lastT: 0, dirty: true, realm: -1, moved: false, saveAt: 0, vis: [], frame: 0, hover: null };
const stage = $('#stage'), lblEls = new Map();
const logFor = o => o.lg - log10(S.fpx);
const focalM = () => 10 ** S.logS * S.fpx;

function rankOf(ls) {
  const list = S.objs, n = list.length, lf = ls + log10(S.fpx);
  if (n < 2) return 0;
  if (lf <= list[0].lg) return 0;
  if (lf >= list[n - 1].lg) return n - 1;
  let i = 0; while (i < n - 1 && list[i + 1].lg <= lf) i++;
  const span = list[i + 1].lg - list[i].lg;
  return i + (span > 1e-9 ? (lf - list[i].lg) / span : .5);
}

function measure() {
  S.W = innerWidth; S.H = innerHeight;
  S.fpx = Math.min(S.H * .42, S.W * .56);
  S.cy = S.H * (S.W > 760 ? .46 : .42);
  S.min = ALL[0].lg - log10(S.fpx) - .15; S.max = ALL[ALL.length - 1].lg - log10(S.fpx) + .15;
  S.target = clamp(S.target, S.min, S.max); S.logS = clamp(S.logS, S.min, S.max);
  drawRuler(); initStars(); S.dirty = true;
}

/* ---------- etiquetas (DOM) ---------- */
for (const o of ALL) {
  const l = document.createElement('div');
  l.className = 'lbl'; l.dataset.id = o.id; l.style.setProperty('--c', o.col);
  l.innerHTML = `<b>${esc(o.n)}</b><span>${fmtLen(o.s)}</span>`;
  stage.appendChild(l); lblEls.set(o.id, l);
}

/* ---------- iconos rasterizados (mipmaps en canvas) ----------
   Cada icono SVG se convierte una sola vez en imagen y se rasteriza en
   mapas de bits de tamaño potencia de dos, que luego se dibujan con
   drawImage. Así el navegador no tiene que recomponer capas ni volver a
   rasterizar SVG en cada fotograma del zoom. */
const RASTER = { cache: new Map(), bytes: 0, limit: 96 << 20, queue: [], queued: new Set() };
const MAXL = 2048;
function iconSrc(o) {
  if (!o.src) o.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ICON.make(o.i).replace('viewBox="0 0 100 100"', 'viewBox="-60 -60 220 220" width="220" height="220"'));
  return o.src;
}
function loadImage(o) {
  if (o.img || o.failed) return;
  const img = new Image(); o.img = img; o.ready = false;
  img.onload = () => { o.ready = true; };
  img.onerror = () => { o.failed = true; };
  img.src = iconSrc(o);
}
function requestMip(o, L) {
  const key = o.id + ':' + L;
  if (RASTER.cache.has(key) || RASTER.queued.has(key) || o.failed) return;
  if (!o.img) loadImage(o);
  RASTER.queued.add(key); RASTER.queue.push({ o, L, key });
}
function processQueue() {
  let budget = 1100 * 1100;
  for (let i = 0; i < RASTER.queue.length && budget > 0;) {
    const job = RASTER.queue[i];
    if (job.o.failed) { RASTER.queue.splice(i, 1); RASTER.queued.delete(job.key); continue; }
    if (!job.o.ready) { i++; continue; }
    RASTER.queue.splice(i, 1); RASTER.queued.delete(job.key);
    try {
      const c = document.createElement('canvas'); c.width = c.height = job.L;
      c.getContext('2d').drawImage(job.o.img, 0, 0, job.L, job.L);
      RASTER.cache.set(job.key, { bmp: c, L: job.L, bytes: job.L * job.L * 4, use: S.frame });
      RASTER.bytes += job.L * job.L * 4; budget -= job.L * job.L;
    } catch (e) { job.o.failed = true; }
  }
  if (RASTER.bytes > RASTER.limit) {
    const entries = [...RASTER.cache.entries()].sort((a, b) => a[1].use - b[1].use);
    for (const [k, v] of entries) { if (RASTER.bytes <= RASTER.limit * .7) break; if (v.use >= S.frame - 2) continue; RASTER.cache.delete(k); RASTER.bytes -= v.bytes; }
  }
}
function getMip(o, L) {
  const want = RASTER.cache.get(o.id + ':' + L); let best = want || null;
  if (!best) { for (let l = L >> 1; l >= 32; l >>= 1) { const m = RASTER.cache.get(o.id + ':' + l); if (m) { best = m; break; } } }
  if (!best) { for (let l = L << 1; l <= MAXL; l <<= 1) { const m = RASTER.cache.get(o.id + ':' + l); if (m) { best = m; break; } } }
  if (!want) requestMip(o, L);
  if (best) best.use = S.frame;
  return best;
}
const mipLevel = px => { let L = 32; while (L < px && L < MAXL) L <<= 1; return L; };

/* ---------- distribución ---------- */
function layout() {
  const { W, H, fpx, cy } = S, mpp = 10 ** S.logS, list = S.objs, n = list.length, vis = [];
  S.vis = vis; if (!n) return;
  const ds = new Float64Array(n), sw = new Float64Array(n), xs = new Float64Array(n), maxSlot = H * 1.15;
  for (let i = 0; i < n; i++) { ds[i] = list[i].s / mpp; sw[i] = clamp(ds[i], 22, maxSlot); }
  for (let i = 1; i < n; i++) xs[i] = xs[i - 1] + sw[i - 1] / 2 + 26 + .1 * Math.max(sw[i - 1], sw[i]) + sw[i] / 2;
  const r = rankOf(S.logS), i0 = Math.floor(r), i1 = Math.min(n - 1, i0 + 1), fr = r - i0;
  const camX = lerp(xs[i0], xs[i1], fr), cx0 = W * .5, fi = Math.round(r);
  const labelMaxY = H - (W > 760 ? 168 : 150);
  for (let i = 0; i < n; i++) {
    const o = list[i], d = ds[i], sx = cx0 + xs[i] - camX, lb = lblEls.get(o.id), half = d / 2;
    const on = d >= 2 && d <= 7 * H && sx + Math.max(half, 12) > -240 && sx - Math.max(half, 12) < W + 240;
    if (!on) { lb.classList.remove('on'); continue; }
    let op = 1;
    if (d < 14) op = .15 + (d - 2) / 12 * .85;
    else if (d > 1.2 * H) op = Math.max(.05, .28 * (1.2 * H / d));
    if (d < 11) {
      lb.className = 'lbl on tiny'; lb.style.opacity = op;
      lb.style.transform = `translate(${sx.toFixed(1)}px, ${cy.toFixed(1)}px) translate(-50%,-50%)`;
      continue;
    }
    vis.push({ o, sx, d, op, focal: i === fi && d <= 1.2 * H, ghost: d > 1.3 * H });
    if (d >= 26 && d <= 1.25 * H) {
      const above = d < 150 && (i % 2 === 1);
      const ly = above ? cy - half - 10 : Math.min(cy + half + 10, labelMaxY);
      lb.className = 'lbl on' + (i === fi ? ' focal' : '');
      lb.style.opacity = Math.min(1, op);
      lb.style.transform = `translate(${sx.toFixed(1)}px, ${ly.toFixed(1)}px) translate(-50%, ${above ? '-100%' : '0'})`;
    } else lb.classList.remove('on');
  }
  updateHud(r);
}
function hitAt(x, y) {
  for (const v of S.vis) { if (v.ghost) continue; if (Math.hypot(x - v.sx, y - S.cy) <= Math.max(v.d / 2, 12)) return v.o; }
  return null;
}

/* ---------- HUD ---------- */
let rulerW = 1; const rulerPad = 14;
const uOf = lg => rulerPad + (lg - LG0) / (LG1 - LG0) * (rulerW - 2 * rulerPad);
function drawRuler() {
  const box = $('#ruler'), svgEl = $('svg', box); rulerW = box.clientWidth || 300;
  const step = rulerW < 600 ? 10 : 5; let s = `<line x1="${rulerPad}" y1="30" x2="${rulerW - rulerPad}" y2="30" stroke="rgba(255,255,255,.22)" stroke-width="1"/>`;
  for (let e = Math.ceil(LG0); e <= LG1; e++) {
    const x = uOf(e).toFixed(1);
    if (e % step === 0) s += `<line x1="${x}" y1="25" x2="${x}" y2="35" stroke="rgba(255,255,255,.45)" stroke-width="1"/><text x="${x}" y="51" text-anchor="middle" font-size="10.5" fill="rgba(238,240,255,.62)">10${sup(e)}</text>`;
    else s += `<line x1="${x}" y1="28" x2="${x}" y2="32" stroke="rgba(255,255,255,.18)" stroke-width="1"/>`;
  }
  for (const o of ALL) s += `<circle class="rd" data-id="${o.id}" cx="${uOf(o.lg).toFixed(1)}" cy="30" r="2.6" fill="${o.col}" opacity="${S.hidden.has(o.c) ? .12 : .9}"><title>${esc(o.n)}</title></circle>`;
  s += `<g id="rmark"><line x1="0" y1="12" x2="0" y2="48" stroke="#fff" stroke-width="2"/><circle cx="0" cy="30" r="6.5" fill="none" stroke="#fff" stroke-width="2"/></g>`;
  svgEl.setAttribute('viewBox', `0 0 ${rulerW} 58`); svgEl.innerHTML = s;
}
function updateHud(r) {
  const fm = focalM(), lg = log10(fm);
  $('#sc-big').textContent = fmtLen(fm);
  $('#sc-sci').textContent = sci(fm) + ' m';
  $('#sc-light').textContent = T.f.luzRecorre(fmtTime(fm / C));
  const ri = realmOf(lg);
  if (ri !== S.realm) {
    S.realm = ri; const [, id, tint] = REALMS[ri], [name, sub] = T.realms[id];
    $('#realm-name').textContent = name; $('#realm-sub').textContent = sub;
    const wm = $('#wm'); wm.textContent = name; wm.classList.remove('in'); void wm.offsetWidth; wm.classList.add('in');
    document.documentElement.style.setProperty('--tint', tint);
  }
  const mk = $('#rmark'); if (mk) mk.setAttribute('transform', `translate(${uOf(lg).toFixed(1)} 0)`);
  $('#prev').disabled = r <= .002; $('#next').disabled = r >= S.objs.length - 1.002;
}

/* ---------- escena (canvas): estrellas y objetos ---------- */
const cv = $('#scene'), ctx = cv.getContext('2d'); let stars = [], dpr = 1;
function initStars() {
  dpr = Math.min(devicePixelRatio || 1, 2, Math.sqrt(4.2e6 / (S.W * S.H)));
  cv.width = Math.round(S.W * dpr); cv.height = Math.round(S.H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const R = (() => { let t = 12345; return () => { t = (t * 1664525 + 1013904223) >>> 0; return t / 4294967296; }; })();
  const n = Math.round(S.W * S.H / 5200); stars = [];
  for (let i = 0; i < n; i++) stars.push({ x: R() * S.W, y: R() * S.H, z: .25 + R() * 1.1, r: .5 + R() * 1.3, ph: R() * TAU, tw: .4 + R() * 1.8, c: R() > .85 ? '#bfdbfe' : R() > .7 ? '#fde68a' : '#fff' });
}
function drawScene(t, vel) {
  const { W, H, cy } = S; ctx.clearRect(0, 0, W, H);
  const off = (S.logS - S.min) * 150, len = reduced ? 0 : clamp(Math.abs(vel) * 520, 0, 70);
  for (const s of stars) {
    let x = (s.x - off * s.z) % W; if (x < 0) x += W;
    const a = reduced ? .75 : .45 + .55 * Math.abs(Math.sin(t / 1000 * s.tw + s.ph));
    ctx.globalAlpha = a * (.5 + s.z * .4); ctx.fillStyle = s.c;
    const L = len * s.z;
    if (L > 1.5) ctx.fillRect(x - (vel > 0 ? L : 0), s.y, L + s.r, s.r); else ctx.fillRect(x, s.y, s.r * 1.6, s.r * 1.6);
  }
  const need = Math.min(dpr, 1.6);
  for (let i = S.vis.length - 1; i >= 0; i--) {
    const v = S.vis[i], { o, sx, d } = v, size = d * 2.2;
    if (v.focal) {
      const g = ctx.createRadialGradient(sx, cy, d * .5, sx, cy, d * .5 + 34);
      g.addColorStop(0, o.col + '70'); g.addColorStop(1, o.col + '00');
      ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, cy, d * .5 + 34, 0, TAU); ctx.fill();
    }
    const m = getMip(o, mipLevel(size * need));
    ctx.globalAlpha = v.op;
    if (m) ctx.drawImage(m.bmp, sx - size / 2, cy - size / 2, size, size);
    else { ctx.fillStyle = o.col; ctx.globalAlpha = v.op * .25; ctx.beginPath(); ctx.arc(sx, cy, d / 2, 0, TAU); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
}

/* ---------- bucle ---------- */
function frame(t) {
  const dt = Math.min(.05, (t - S.lastT) / 1000 || 0); S.lastT = t; S.frame++;
  if (S.tour && t >= S.hold) {
    const before = rankOf(S.target); let nt = Math.min(S.max, S.target + .45 * dt); const after = rankOf(nt);
    if (Math.floor(after + 1e-6) > Math.floor(before + 1e-6)) { const k = Math.min(S.objs.length - 1, Math.floor(after + 1e-6)); nt = logFor(S.objs[k]); S.hold = t + 2200; if (S.W > 760) select(S.objs[k], false); }
    S.target = nt; if (S.target >= S.max) stopTour();
  }
  const diff = S.target - S.logS;
  if (Math.abs(diff) > 1e-4) { S.logS += diff * (1 - Math.exp(-dt * 7)); S.dirty = true; }
  else if (S.logS !== S.target) { S.logS = S.target; S.dirty = true; }
  if (S.dirty) { layout(); S.dirty = false; if (t > S.saveAt) { S.saveAt = t + 800; try { localStorage.setItem('om:logS', String(S.target)); } catch (e) {} } }
  processQueue();
  drawScene(t, diff);
  requestAnimationFrame(frame);
}

/* ---------- navegación ---------- */
function goTo(o) { stopTour(); S.target = clamp(logFor(o), S.min, S.max); }
function step(dir) {
  stopTour(); const r = rankOf(S.target), n = S.objs.length;
  const k = clamp(dir > 0 ? Math.floor(r + 1e-6) + 1 : Math.ceil(r - 1e-6) - 1, 0, n - 1);
  S.target = clamp(logFor(S.objs[k]), S.min, S.max);
}
function zoomBy(dz) { stopTour(); S.target = clamp(S.target + dz, S.min, S.max); }
function startTour() { S.tour = true; S.hold = 0; $('#b-tour').setAttribute('aria-pressed', 'true'); $('#i-play').style.display = 'none'; $('#i-pause').style.display = ''; }
function stopTour() { if (!S.tour) return; S.tour = false; $('#b-tour').setAttribute('aria-pressed', 'false'); $('#i-play').style.display = ''; $('#i-pause').style.display = 'none'; }
function toggleTour() { if (S.tour) stopTour(); else { if (S.target >= S.max - .01) S.target = S.min; startTour(); } }

/* ---------- panel ---------- */
const panel = $('#panel');
function select(o, go) {
  S.sel = o; renderPanel(o); panel.classList.add('open'); panel.scrollTop = 0;
  if (go) goTo(o);
  try { history.replaceState(null, '', '#' + o.id); } catch (e) {}
}
function closePanel() { panel.classList.remove('open'); S.sel = null; try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} }
function renderPanel(o) {
  $('#p-ico').innerHTML = ICON.make(o.i);
  $('#p-name').textContent = o.n;
  const chip = $('#p-cat'); chip.textContent = T.cats[o.c]; chip.style.setProperty('--c', o.col);
  $('#p-size').textContent = fmtLen(o.s);
  $('#p-sub').textContent = o.sub;
  $('#p-sci').textContent = sci(o.s, 3) + ' m';
  $('#p-desc').textContent = o.d;
  $('#p-light').textContent = T.f.luzTarda(fmtTime(o.s / C), o.k);
  const refs = o.id === 'humano' ? [byId.hidrogeno, byId.tierra] : [byId.humano];
  const i = S.objs.indexOf(o); if (i > 0) refs.push(S.objs[i - 1]); if (i >= 0 && i < S.objs.length - 1) refs.push(S.objs[i + 1]);
  const seen = new Set([o.id]), rows = [];
  for (const r of refs) { if (!r || seen.has(r.id)) continue; seen.add(r.id); const q = o.s / r.s; rows.push(`<div class="cmp-row"><span>${esc(r.n)}</span><b>${q >= 1 ? '×' + fmtMult(q) : '÷' + fmtMult(1 / q)}</b></div>`); }
  $('#p-cmp').innerHTML = rows.join('');
}

/* ---------- entrada: rueda, puntero, teclado ---------- */
addEventListener('wheel', e => {
  if (e.target.closest('#panel, dialog')) return;
  e.preventDefault(); stopTour(); hideHint();
  let dy = e.deltaY; if (e.deltaMode === 1) dy *= 16; else if (e.deltaMode === 2) dy *= S.H;
  S.target = clamp(S.target + clamp(dy, -160, 160) * .0024, S.min, S.max);
}, { passive: false });

const P = new Map(); let pinchD = 0, startX = 0, startY = 0, downT = 0;
const pdist = () => { const v = [...P.values()]; return Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y); };
stage.addEventListener('pointerdown', e => {
  if (e.button > 0) return; stage.setPointerCapture(e.pointerId);
  P.set(e.pointerId, { x: e.clientX, y: e.clientY }); S.moved = false; startX = e.clientX; startY = e.clientY; downT = performance.now();
  if (P.size === 2) pinchD = pdist(); stage.classList.add('drag'); stopTour(); hideHint();
});
stage.addEventListener('pointermove', e => {
  const p = P.get(e.pointerId);
  if (!p) { if (e.pointerType !== 'touch') { const h = hitAt(e.clientX, e.clientY); if (h !== S.hover) { S.hover = h; stage.style.cursor = h ? 'pointer' : ''; } } return; }
  const dx = e.clientX - p.x; p.x = e.clientX; p.y = e.clientY;
  if (P.size === 2) { const nd = pdist(); if (pinchD > 0 && nd > 0) S.target = clamp(S.target - log10(nd / pinchD), S.min, S.max); pinchD = nd; }
  else S.target = clamp(S.target - dx / 460, S.min, S.max);
  if (Math.hypot(e.clientX - startX, e.clientY - startY) > 6) S.moved = true;
});
function pointerEnd(e) {
  if (!P.has(e.pointerId)) return; P.delete(e.pointerId); if (P.size < 2) pinchD = 0;
  if (!P.size) stage.classList.remove('drag');
  if (e.type === 'pointerup' && !S.moved && performance.now() - downT < 600) {
    const t = document.elementFromPoint(e.clientX, e.clientY), lab = t && t.closest('.lbl');
    const o = lab ? byId[lab.dataset.id] : hitAt(e.clientX, e.clientY);
    if (o) select(o, true); else if (!t || !t.closest('.top, .bottom, .arrow')) closePanel();
  }
}
stage.addEventListener('pointerup', pointerEnd); stage.addEventListener('pointercancel', pointerEnd);

/* puntos pequeños: tooltip */
const tip = $('#tip');
function showTip(o, x, y) { tip.innerHTML = `<b>${esc(o.n)}</b><span>${fmtLen(o.s)}</span>`; tip.style.left = x + 'px'; tip.style.top = y + 'px'; tip.style.opacity = 1; }
function hideTip() { tip.style.opacity = 0; }
stage.addEventListener('pointerover', e => { const t = e.target.closest('.lbl.tiny'); if (t) showTip(byId[t.dataset.id], e.clientX, e.clientY - 10); });
stage.addEventListener('pointerout', e => { if (e.target.closest('.lbl.tiny')) hideTip(); });

/* regla */
const ruler = $('#ruler'); let rulerDrag = false;
function rulerSet(e) { const rect = ruler.getBoundingClientRect(); const x = clamp(e.clientX - rect.left, rulerPad, rect.width - rulerPad); const lg = LG0 + (x - rulerPad) / (rect.width - 2 * rulerPad) * (LG1 - LG0); S.target = clamp(lg - log10(S.fpx), S.min, S.max); }
ruler.addEventListener('pointerdown', e => { rulerDrag = true; ruler.setPointerCapture(e.pointerId); stopTour(); hideHint(); if (!e.target.classList.contains('rd')) rulerSet(e); });
ruler.addEventListener('pointermove', e => { if (rulerDrag) rulerSet(e); else { const d = e.target.closest('.rd'); if (d) showTip(byId[d.dataset.id], e.clientX, e.clientY - 12); else hideTip(); } });
ruler.addEventListener('pointerup', e => { rulerDrag = false; const d = e.target.closest('.rd'); if (d) { const o = byId[d.dataset.id]; if (S.hidden.has(o.c)) setHidden(o.c, false); select(o, true); } });
ruler.addEventListener('pointercancel', () => { rulerDrag = false; });
ruler.addEventListener('pointerleave', hideTip);

/* teclado */
addEventListener('keydown', e => {
  const tag = (e.target.tagName || '').toLowerCase();
  if (e.key === 'Escape') { for (const d of document.querySelectorAll('dialog[open]')) d.close(); closePanel(); return; }
  if (tag === 'input' || tag === 'select' || tag === 'textarea' || document.querySelector('dialog[open]')) return;
  const k = e.key;
  if (k === 'ArrowRight' || k === 'PageDown') { step(1); }
  else if (k === 'ArrowLeft' || k === 'PageUp') { step(-1); }
  else if (k === 'ArrowDown' || k === '-' || k === '_') { zoomBy(.35); }
  else if (k === 'ArrowUp' || k === '+' || k === '=') { zoomBy(-.35); }
  else if (k === 'Home') { stopTour(); S.target = S.min; }
  else if (k === 'End') { stopTour(); S.target = S.max; }
  else if (k === ' ') { toggleTour(); }
  else if (k === '/' || k === 'f' || k === 'b') { openSearch(); }
  else if (k === 'r') { randomJump(); }
  else if (k === 'c') { openCompare(); }
  else if (k === '?' || k === 'h') { $('#d-help').showModal(); }
  else return;
  e.preventDefault(); hideHint();
});

/* botones */
$('#prev').addEventListener('click', () => step(-1));
$('#next').addEventListener('click', () => step(1));
$('#zin').addEventListener('click', () => zoomBy(-.5));
$('#zout').addEventListener('click', () => zoomBy(.5));
$('#b-tour').addEventListener('click', toggleTour);
$('#b-random').addEventListener('click', randomJump);
$('#b-search').addEventListener('click', openSearch);
$('#b-filter').addEventListener('click', () => $('#d-filter').showModal());
$('#b-compare').addEventListener('click', openCompare);
$('#b-help').addEventListener('click', () => $('#d-help').showModal());
$('#p-close').addEventListener('click', closePanel);
$('#p-center').addEventListener('click', () => { if (S.sel) goTo(S.sel); });
$('#p-compare').addEventListener('click', openCompare);
for (const b of document.querySelectorAll('dialog .x')) b.addEventListener('click', () => b.closest('dialog').close());
for (const d of document.querySelectorAll('dialog')) d.addEventListener('click', e => { if (e.target === d) d.close(); });
function randomJump() { const list = S.objs.length ? S.objs : ALL; select(list[Math.floor(Math.random() * list.length)], true); }

/* ---------- buscador ---------- */
const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const dSearch = $('#d-search'), qIn = $('#q'), resList = $('#res');
function openSearch() { dSearch.showModal(); qIn.value = ''; renderSearch(''); setTimeout(() => qIn.focus(), 30); }
function renderSearch(q) {
  const n = norm(q.trim());
  const hits = n ? ALL.filter(o => norm(o.n).includes(n) || norm(T.cats[o.c]).includes(n) || norm(o.d).includes(n)) : ALL;
  resList.innerHTML = hits.length ? hits.map(o => { if (!o.mini) o.mini = ICON.make(o.i); return `<button class="res" data-id="${o.id}"><span class="mi">${o.mini}</span><span class="rn">${esc(o.n)}</span><span class="rs">${fmtLen(o.s)}</span></button>`; }).join('') : '<p>' + esc(T.ui['buscar.nada']) + '</p>';
}
qIn.addEventListener('input', () => renderSearch(qIn.value));
qIn.addEventListener('keydown', e => { if (e.key === 'Enter') { const first = $('.res', resList); if (first) first.click(); e.preventDefault(); } });
resList.addEventListener('click', e => { const b = e.target.closest('.res'); if (!b) return; const o = byId[b.dataset.id]; dSearch.close(); if (S.hidden.has(o.c)) setHidden(o.c, false); select(o, true); });

/* ---------- filtros ---------- */
const chips = $('#chips');
chips.innerHTML = Object.entries(CATS).map(([k, c]) => `<button class="chip-f" data-cat="${k}" aria-pressed="true" style="--c:${c.col}">${esc(T.cats[k])}</button>`).join('');
chips.addEventListener('click', e => { const b = e.target.closest('.chip-f'); if (b) setHidden(b.dataset.cat, b.getAttribute('aria-pressed') === 'true'); });
$('#f-all').addEventListener('click', () => { for (const k of Object.keys(CATS)) setHidden(k, false); });
function setHidden(cat, hide) {
  if (hide) S.hidden.add(cat); else S.hidden.delete(cat);
  const b = $(`.chip-f[data-cat="${cat}"]`); if (b) b.setAttribute('aria-pressed', hide ? 'false' : 'true');
  S.objs = ALL.filter(o => !S.hidden.has(o.c));
  if (!S.objs.length) { S.objs = ALL; S.hidden.clear(); for (const c of document.querySelectorAll('.chip-f')) c.setAttribute('aria-pressed', 'true'); }
  for (const o of ALL) if (S.hidden.has(o.c)) lblEls.get(o.id).classList.remove('on');
  if (S.sel && S.hidden.has(S.sel.c)) closePanel();
  if (S.objs.length) { const lf = S.target + log10(S.fpx); let best = S.objs[0]; for (const o of S.objs) if (Math.abs(o.lg - lf) < Math.abs(best.lg - lf)) best = o; if (Math.abs(best.lg - lf) > .9) S.target = clamp(logFor(best), S.min, S.max); }
  drawRuler(); S.dirty = true;
}

/* ---------- comparador ---------- */
const dCmp = $('#d-compare'), selA = $('#cmp-a'), selB = $('#cmp-b');
const opts = ALL.map(o => `<option value="${o.id}">${esc(o.n)} (${fmtLen(o.s)})</option>`).join('');
selA.innerHTML = opts; selB.innerHTML = opts;
function openCompare() { const a = S.sel || byId.humano; selA.value = a.id; selB.value = a.id === 'tierra' ? 'humano' : a.id === 'humano' ? 'tierra' : 'humano'; renderCompare(); dCmp.showModal(); }
function renderCompare() {
  const a = byId[selA.value], b = byId[selB.value], q = a.s / b.s, r = Math.max(q, 1 / q), big = q >= 1 ? a : b, small = q >= 1 ? b : a;
  $('#cmp-text').innerHTML = r < 1.05 ? T.f.igual(esc(a.n), esc(b.n)) : `<b>${esc(big.n)}</b> ÷ <b>${esc(small.n)}</b> = <b>${fmtCount(r)}</b>`;
  $('#cmp-vol').textContent = r < 1.05 ? '' : (a.k || b.k) ? T.f.mayor(fmtTimes(r)) : T.f.mayorVol(fmtTimes(r), fmtTimes(r ** 3));
  const bigPx = S.W > 760 ? 200 : 150, smallPx = bigPx / r;
  const cell = (o, px) => px >= 3 ? `<div class="cv"><div style="width:${px}px;height:${px}px">${ICON.make(o.i)}</div><small>${esc(o.n)}</small></div>` : `<div class="cv"><div class="dot"></div><small>${T.f.subpixel(esc(o.n))}</small></div>`;
  $('#cmp-vis').innerHTML = cell(big, bigPx) + cell(small, smallPx);
  for (const sv of document.querySelectorAll('#cmp-vis svg')) { sv.style.width = '100%'; sv.style.height = '100%'; }
}
selA.addEventListener('change', renderCompare); selB.addEventListener('change', renderCompare);
$('#cmp-swap').addEventListener('click', () => { const t = selA.value; selA.value = selB.value; selB.value = t; renderCompare(); });

/* ---------- pista inicial ---------- */
const hint = $('#hint'); let hintOff = false;
function hideHint() { if (hintOff) return; hintOff = true; hint.classList.add('off'); setTimeout(() => hint.remove(), 800); }
setTimeout(hideHint, 9000);
if (location.hash.length > 1) hideHint();

/* ---------- arranque ---------- */
addEventListener('resize', () => { measure(); if (dCmp.open) renderCompare(); });
addEventListener('hashchange', () => { const o = byId[location.hash.slice(1)]; if (o) select(o, true); });
measure();
(function start() {
  const h = location.hash.slice(1), o = byId[h];
  if (o) { S.logS = S.target = clamp(logFor(o), S.min, S.max); select(o, false); return; }
  let v = null; try { v = localStorage.getItem('om:logS'); } catch (e) {}
  if (v != null && isFinite(+v)) S.logS = S.target = clamp(+v, S.min, S.max);
  else S.logS = S.target = clamp(logFor(byId.humano), S.min, S.max);
})();
requestAnimationFrame(frame);
})();
