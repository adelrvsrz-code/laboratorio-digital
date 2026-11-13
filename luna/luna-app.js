(function () {
'use strict';
const TAU = Math.PI * 2, RAD = Math.PI / 180, HOUR = 3600000, DAY = 86400000;
const NB = '\u202F', SP = '\u00A0';
const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = t => t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const A = ASTRO;
const T_MIN = Date.UTC(1900, 0, 1), T_MAX = Date.UTC(2100, 0, 1);
const SEMI_MAX = .28;                      /* semidiámetro lunar máximo (perigeo, visto desde la superficie), en grados */
const COL = ['#ffd166', '#5ee0ff'];        /* observador A y observador B */

/* ---------- formato ---------- */
function fmt(x, d = 0) {
  const s = Math.abs(x).toFixed(d); let [i, f] = s.split('.');
  i = i.replace(/\B(?=(\d{3})+(?!\d))/g, NB);
  return (x < 0 && Number(s) !== 0 ? '−' : '') + (f ? i + ',' + f : i);
}
const fmtDeg = (x, d = 0) => fmt(x, d) + '°';
const fmtPct = f => fmt(f * 100, f > .9995 || f < .0005 ? 0 : 1) + SP + '%';
const fmtLat = v => fmt(Math.abs(v), 1) + '°' + SP + (v >= 0 ? 'N' : 'S');
const fmtLon = v => fmt(Math.abs(v), 1) + '°' + SP + (v >= 0 ? 'E' : 'O');
const fmtKm = km => fmt(Math.round(km / 100) * 100) + SP + 'km';
const wind = az => WINDS[Math.round(az / 45) % 8];
const clockOf = a => { const h = Math.round(a / 30) % 12 || 12; return (h === 1 ? 'la ' : 'las ') + h; };
const phaseName = el => { for (const p of PHASES) if (el < p[0]) return p[1]; return PHASES[0][1]; };
const DF = new Map();
function dfmt(tz, opts) {
  const k = (tz || '') + JSON.stringify(opts); let f = DF.get(k);
  if (!f) { try { f = new Intl.DateTimeFormat('es-ES', Object.assign({}, opts, tz ? { timeZone: tz } : {})); } catch (e) { f = new Intl.DateTimeFormat('es-ES', opts); } DF.set(k, f); }
  return f;
}
const fmtHM = (ms, tz) => dfmt(tz, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(ms);
const fmtDay = (ms, tz) => dfmt(tz, { weekday: 'short', day: 'numeric', month: 'short' }).format(ms).replace(/[.,]/g, '');
const fmtWd = (ms, tz) => dfmt(tz, { weekday: 'short' }).format(ms).replace(/\./g, '');
const fmtYear = (ms, tz) => dfmt(tz, { year: 'numeric' }).format(ms);
const fmtKey = (ms, tz) => dfmt(tz, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(ms);
function fmtSpan(ms) {                     /* «dentro de 3 h», «hace 2 días» */
  const a = Math.abs(ms), w = a < 90 * 60000 ? Math.max(1, Math.round(a / 60000)) + ' min' : a < 36 * HOUR ? Math.round(a / HOUR) + ' h' : fmt(Math.round(a / DAY)) + ' días';
  return ms >= 0 ? 'dentro de ' + w : 'hace ' + w;
}
function skyState(o) {
  const h = o.sunAltApp;
  return h > -.83 ? 'de día' : h > -6 ? (o.sunAz < 180 ? 'amaneciendo' : 'anocheciendo') : h > -12 ? 'crepúsculo' : 'de noche';
}

/* ---------- datos ---------- */
const byId = Object.fromEntries(CITIES.map(c => [c.id, c]));
const MASK = RENDER.landMask(LAND, 2048);
let mapJob = RENDER.moonMapJob(MOON, innerWidth <= 760 ? 768 : 1024), mapVer = 0;
const MAP = mapJob.map;
/* rejilla de «lunas sobre la Tierra»: anillos de puntos a una altura fija de la Luna, en coordenadas del disco.
   Con el globo grande, tres anillos (70°, 45° y 19°); con el pequeño, dos (64° y 30°). */
const FIELD = [];
function buildField(small) {
  FIELD.length = 0;
  for (const [alt, n, off] of small ? [[64, 5, 0], [30, 10, 18]] : [[70, 6, 0], [45, 12, 15], [19, 18, 0]]) for (let k = 0; k < n; k++) { const th = (off + k * 360 / n) * RAD, rho = Math.cos(alt * RAD); FIELD.push({ x: rho * Math.sin(th), y: rho * Math.cos(th) }); }
}

/* ---------- estado ---------- */
const S = {
  W: 1, H: 1, dpr: 1, L: null,
  t: Date.now(), live: true,
  obs: [{ lat: CITIES[0].lat, lon: CITIES[0].lon, city: CITIES[0].id }], act: 0, cmp: false,
  field: true, spines: false, panel: null, step: 0,
  play: false, rate: 1, tAnim: null, anim: null, script: null,
  F: null, O: [], dirty: true, hud: true, moved: 0, tMoved: 0, hudAt: 0, settled: false, drag: null, focus: false, tint: '#b794f6'
};
const stage = $('#stage'), panel = $('#panel');
const touch = () => { S.dirty = S.hud = true; S.moved = performance.now(); S.settled = false; };

function setTime(ms, keepLive) { S.t = clamp(ms, T_MIN, T_MAX); if (!keepLive) S.live = false; touch(); S.tMoved = S.moved; }
function animateTime(to) {
  to = clamp(to, T_MIN, T_MAX); S.live = false; S.script = null;
  if (reduced) { S.tAnim = null; setTime(to); return; }
  S.tAnim = { from: S.t, to, t0: performance.now(), dur: clamp(Math.abs(to - S.t) / HOUR * 130, 320, 900) };
}
function goLive() { stopPlay(); S.script = null; S.tAnim = null; S.t = Date.now(); S.live = true; touch(); }
function setObs(i, lat, lon, city, animate) {
  lat = clamp(lat, -89.5, 89.5); lon = A.n180(lon);
  if (animate && !reduced && S.obs[i]) { const o = S.obs[i]; S.anim = { i, from: [o.lat, o.lon], to: [lat, lon], city: city || null, t0: performance.now(), dur: 650 }; o.city = null; }
  else { S.obs[i] = { lat, lon, city: city || null }; if (S.anim && S.anim.i === i) S.anim = null; }
  touch();
}
const placeName = o => o.city ? byId[o.city].n : fmtLat(o.lat) + ', ' + fmtLon(o.lon);
function localTime(o, ms) {                /* hora oficial si es una ciudad; hora solar media si es un punto cualquiera */
  if (o.city) { const tz = byId[o.city].tz; return (fmtKey(ms, tz) === fmtKey(ms) ? '' : fmtWd(ms, tz) + ' ') + fmtHM(ms, tz); }
  return 'hora solar ' + fmtHM(ms + o.lon / 15 * HOUR, 'UTC');
}
function placeTime(o, ms) {                /* un suceso en la hora del lugar, con el día si no es el del instante mostrado */
  if (ms == null) return '—';
  const tz = o.city ? byId[o.city].tz : 'UTC', sh = o.city ? 0 : o.lon / 15 * HOUR;
  return (fmtKey(ms + sh, tz) === fmtKey(S.t + sh, tz) ? '' : fmtWd(ms + sh, tz) + ' ') + fmtHM(ms + sh, tz);
}
function atTime(o, ms) {                   /* «a las 09:02», «el sáb a las 12:39» */
  const p = placeTime(o, ms).split(' '), hm = p.pop();
  return (p.length ? 'el ' + p[0] + ' ' : '') + (parseInt(hm, 10) === 1 ? 'a la ' : 'a las ') + hm;
}

/* ---------- disposición ---------- */
let barsKey = '';
const barsNow = () => $('.top').offsetHeight + ':' + $('.bottom').offsetHeight + ':' + (S.panel ? panel.offsetHeight : 0);
function measure() {
  S.W = innerWidth; S.H = innerHeight; barsKey = barsNow();
  S.dpr = Math.min(devicePixelRatio || 1, 2, Math.sqrt(4.2e6 / (S.W * S.H)));
  const mobile = S.W <= 760, top = $('.top').offsetHeight + 8;
  let bot = $('.bottom').offsetHeight + 4; if (mobile && S.panel) bot = Math.max(bot, panel.offsetHeight + 18);   /* en pantallas estrechas el panel tapa el pie, nunca los discos */
  const aw = S.W - (!mobile && S.panel ? 372 : 0), ah = S.H - top - bot, wide = aw >= 700 && aw / ah > 1.2;
  const tight = S.H < 480; document.body.classList.toggle('tight', tight);        /* pantallas muy bajas: pies de una línea menos */
  const capS = tight ? 46 : mobile ? 64 : 70, capE = tight ? 24 : mobile ? 26 : 46, L = { mobile, wide, sky: [] };
  if (wide) {
    const R = Math.max(48, Math.min((ah - capS - 14) / 2, aw * .2)), cy = top + (ah - capS) / 2 + 2;
    L.globe = { x: aw * .27, y: cy, r: R };
    if (S.cmp) { const r = R * .56; L.sky.push({ x: aw * .73 - r - 12, y: cy + 14, r }, { x: aw * .73 + r + 12, y: cy + 14, r }); L.cmp = { x: aw * .73, y: cy + 14 - r - 40 }; }
    else L.sky.push({ x: aw * .73, y: cy, r: R });
  } else {
    const R = Math.max(50, Math.min((ah - capS - capE - 14) / 4, aw * .4)), y1 = top + 4 + R;
    if (S.cmp) { const r = Math.min(R - 16, (aw - 36) / 4); L.sky.push({ x: aw / 2 - r - 8, y: y1 + (R - r), r }, { x: aw / 2 + r + 8, y: y1 + (R - r), r }); L.cmp = { x: aw / 2, y: y1 + (R - r) - r - 30 }; }
    else L.sky.push({ x: aw / 2, y: y1, r: R });
    L.globe = { x: aw / 2, y: y1 + R + capS + R, r: R };
  }
  L.small = L.globe.r < 150; L.glyph = L.small ? clamp(L.globe.r * .075, 7, 10) : clamp(L.globe.r * .052, 9, 14);
  buildField(L.small);
  S.L = L;
  cv.width = Math.round(S.W * S.dpr); cv.height = Math.round(S.H * S.dpr);
  const rr = $('#ruler'), tw = rr.clientWidth || 300, th = rr.clientHeight || 56;
  tape.width = Math.round(tw * S.dpr); tape.height = Math.round(th * S.dpr);
  L.tape = { w: tw, h: th, pph: mobile ? 13 : 26 };
  /* pies de los discos (DOM) */
  const put = (el, x, y, w) => { el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.width = w + 'px'; };
  put($('#cap-earth'), L.globe.x, L.globe.y + L.globe.r + 8, Math.min(aw - 16, 2 * L.globe.r + 60));
  L.sky.forEach((p, i) => put($(i ? '#cap-b' : '#cap-a'), p.x, p.y + p.r + 7, S.cmp ? 2 * p.r + 16 : Math.min(aw - 16, 2 * p.r + 80)));
  L.sky.forEach((p, i) => { const b = $(i ? '#go-b' : '#go-a'); b.style.left = p.x + 'px'; b.style.top = (p.y + p.r * .6) + 'px'; });
  $('#cap-b').hidden = !S.cmp; $('#cap-cmp').hidden = !S.cmp; if (!S.cmp) $('#go-b').hidden = true;
  if (S.cmp) put($('#cap-cmp'), L.cmp.x, L.cmp.y, Math.min(aw - 16, 340));
  bg = null; earth.key = ''; moon.key = ''; touch();
}

/* ---------- mapas de bits ---------- */
const cv = $('#scene'), ctx = cv.getContext('2d');
const tape = document.createElement('canvas'), tctx = tape.getContext('2d');
tape.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;border-radius:inherit';
$('#ruler').appendChild(tape);
let bg = null;
const earth = { cv: document.createElement('canvas'), img: null, size: 0, key: '', q: 0 };
const moon = { cv: document.createElement('canvas'), mini: document.createElement('canvas'), img: null, size: 0, key: '', q: 0 };

function starfield() {                     /* fondo: estrellas fijas, pintadas una sola vez por tamaño de ventana */
  bg = document.createElement('canvas'); bg.width = cv.width; bg.height = cv.height;
  const c = bg.getContext('2d'); c.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  let s = 12345; const R = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  const n = Math.round(S.W * S.H / 6500);
  for (let i = 0; i < n; i++) { const r = .5 + R() * 1.1; c.globalAlpha = .25 + R() * .55; c.fillStyle = R() > .85 ? '#bfdbfe' : R() > .7 ? '#fde68a' : '#fff'; c.fillRect(R() * S.W, R() * S.H, r * 1.5, r * 1.5); }
}
function renderEarth(q) {
  const G = S.L.globe; let size = Math.round(clamp(2 * G.r * S.dpr * q, 96, 1040)); if (q < 1) size = Math.min(size, 400);
  const key = size + ':' + Math.round(S.t / 15000);
  if (key === earth.key) return;
  if (size !== earth.size) { earth.cv.width = earth.cv.height = size; earth.img = earth.cv.getContext('2d').createImageData(size, size); earth.size = size; }
  const v = S.F.view;
  RENDER.earthDisc(size, { right: v.right, up: v.up, front: v.m, sun: S.F.sun.vec }, MASK, earth.img.data);
  earth.cv.getContext('2d').putImageData(earth.img, 0, 0); earth.key = key; earth.q = q;
}
function renderMoon(q) {
  const rmax = Math.max.apply(null, S.L.sky.map(p => p.r)) * .6;
  let size = Math.round(clamp(2 * rmax * S.dpr * q, 64, 820)); if (q < 1) size = Math.min(size, 340);
  const F = S.F, key = size + ':' + Math.round(F.ms / 1500000) + ':' + mapVer + ':' + S.L.glyph;
  if (key === moon.key) return;
  if (size !== moon.size) { moon.cv.width = moon.cv.height = size; moon.img = moon.cv.getContext('2d').createImageData(size, size); moon.size = size; }
  /* imagen geocéntrica con el norte celeste arriba: cada observador la verá girada su ángulo */
  const m = F.view.m, up = F.view.up;
  RENDER.moonDisc(size, { right: A.cross(m, up), up, front: [-m[0], -m[1], -m[2]], xb: F.moon.xb, yb: F.moon.yb, zb: F.moon.pole, sun: F.toSun, shine: .075 * (1 - F.frac) }, MAP, moon.img.data);
  moon.cv.getContext('2d').putImageData(moon.img, 0, 0); moon.key = key; moon.q = q;
  /* versión pequeña: dibujo plano de la fase, nítido a pocos píxeles, con una marca en el norte de la Luna.
     Se usa en la rejilla del globo y en la lista de lugares. */
  const g = S.L.glyph * S.dpr, pad = 4 * S.dpr, ms = Math.round(2 * (g + pad)), h = ms / 2, c = moon.mini.getContext('2d'), right = A.cross(m, up);
  moon.mini.width = moon.mini.height = ms;
  const sunAng = Math.atan2(A.dot(F.toSun, right), A.dot(F.toSun, up)), poleAng = Math.atan2(A.dot(F.moon.pole, right), A.dot(F.moon.pole, up)), ci = Math.cos(F.phaseAngle * RAD);
  c.translate(h, h);
  c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = Math.max(1, 1.4 * S.dpr); c.beginPath(); c.moveTo(Math.sin(poleAng) * g, -Math.cos(poleAng) * g); c.lineTo(Math.sin(poleAng) * (g + pad * .85), -Math.cos(poleAng) * (g + pad * .85)); c.stroke();
  c.fillStyle = '#1b2247'; c.beginPath(); c.arc(0, 0, g, 0, TAU); c.fill();
  c.save(); c.rotate(sunAng - Math.PI / 2);
  c.fillStyle = '#e9e4d3'; c.beginPath(); c.arc(0, 0, g, -Math.PI / 2, Math.PI / 2);
  c.ellipse(0, 0, Math.max(.01, g * Math.abs(ci)), g, 0, Math.PI / 2, ci > 0 ? 1.5 * Math.PI : -Math.PI / 2, ci < 0); c.closePath(); c.fill(); c.restore();
  c.strokeStyle = 'rgba(210,220,255,.34)'; c.lineWidth = Math.max(1, .7 * S.dpr); c.beginPath(); c.arc(0, 0, g - c.lineWidth / 2, 0, TAU); c.stroke();
}

/* ---------- dibujo ---------- */
const FONT = (px, w) => `${w || 500} ${px}px "Instrument Sans", system-ui, sans-serif`;
function label(c, text, x, y, align, color, px, weight) {
  c.font = FONT(px || 11.5, weight); c.textAlign = align || 'left'; c.textBaseline = 'middle';
  c.lineJoin = 'round'; c.lineWidth = 3; c.strokeStyle = 'rgba(4,7,20,.82)'; c.strokeText(text, x, y);
  c.fillStyle = color || 'rgba(238,240,255,.9)'; c.fillText(text, x, y);
}
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function skyColor(h) {                     /* color plano del cielo según la altura del Sol */
  const n = [10, 16, 46], tw = [26, 42, 98], hz = [48, 80, 146], d = [62, 116, 184];
  const c = h <= -14 ? n : h <= -6 ? mix(n, tw, (h + 14) / 8) : h <= 0 ? mix(tw, hz, (h + 6) / 6) : h <= 8 ? mix(hz, d, h / 8) : d;
  return `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
}
function pt(lat, lon) { const v = A.toView(S.F, lat, lon), G = S.L.globe; return { x: G.x + v[0] * G.r, y: G.y - v[1] * G.r, z: v[2], vx: v[0], vy: v[1] }; }

function drawGlobe() {
  const G = S.L.globe, F = S.F, g = S.L.glyph, placed = [];
  const free = (x, y, w, h) => { for (const p of placed) if (x < p[0] + p[2] && x + w > p[0] && y < p[1] + p[3] && y + h > p[1]) return false; return true; };
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(earth.cv, G.x - G.r, G.y - G.r, 2 * G.r, 2 * G.r);
  ctx.strokeStyle = 'rgba(150,185,255,.34)'; ctx.lineWidth = 1.25; ctx.beginPath(); ctx.arc(G.x, G.y, G.r, 0, TAU); ctx.stroke();
  if (S.focus) { ctx.strokeStyle = S.tint; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(G.x, G.y, G.r + 6, 0, TAU); ctx.stroke(); }
  /* anillos de altura de la Luna (30° y 60°) y punto sublunar */
  ctx.setLineDash([2, 5]); ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 1;
  for (const a of [30, 60]) { ctx.beginPath(); ctx.arc(G.x, G.y, G.r * Math.cos(a * RAD), 0, TAU); ctx.stroke(); }
  ctx.setLineDash([]);
  if (!S.L.small) for (const a of [30, 60]) { const r = G.r * Math.cos(a * RAD), th = 197 * RAD; label(ctx, a + '°', G.x + r * Math.sin(th), G.y - r * Math.cos(th) - 8, 'center', 'rgba(238,240,255,.55)', 10.5); }
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.25; ctx.beginPath(); ctx.arc(G.x, G.y, 4, 0, TAU); ctx.moveTo(G.x - 8, G.y); ctx.lineTo(G.x + 8, G.y); ctx.moveTo(G.x, G.y - 8); ctx.lineTo(G.x, G.y + 8); ctx.stroke();
  placed.push([G.x - 10, G.y - 10, 20, 20]);

  /* observadores: se reservan primero para que nada los tape */
  const pins = S.obs.map((o, i) => Object.assign(pt(o.lat, o.lon), { o, i }));
  for (const p of pins) if (p.z >= 0) placed.push([p.x - 12, p.y - 12, 24, 24]);

  /* verticales (recorrido) o lunas sobre la Tierra */
  if (S.spines) {
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.fillStyle = '#fff'; ctx.lineWidth = 1.5;
    for (const f of FIELD) { const x = G.x + f.x * G.r, y = G.y - f.y * G.r; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(G.x + f.x * 1.15 * G.r, G.y - f.y * 1.15 * G.r); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, 2, 0, TAU); ctx.fill(); }
  } else if (S.field) {
    const ms = moon.mini.width / S.dpr;
    for (const f of FIELD) {
      const x = G.x + f.x * G.r, y = G.y - f.y * G.r; let hit = false;
      for (const p of pins) if (p.z >= 0 && Math.hypot(p.x - x, p.y - y) < g + 12) hit = true;
      if (hit) continue;
      const ll = A.fromView(F, f.x, f.y), o = A.observe(F, ll[0], ll[1]);
      ctx.save(); ctx.translate(x, y); ctx.rotate(o.cnorth * RAD); ctx.drawImage(moon.mini, -ms / 2, -ms / 2, ms, ms); ctx.restore();
      placed.push([x - g - 2, y - g - 2, 2 * g + 4, 2 * g + 4]);
    }
  }
  /* ciudades */
  const fpx = S.L.mobile ? 11 : 11.5; ctx.font = FONT(fpx);
  for (const c of CITIES) {
    if (S.obs.some(o => o.city === c.id)) continue;
    const p = pt(c.lat, c.lon); if (p.z < .03) continue;
    ctx.fillStyle = 'rgba(255,255,255,' + (.35 + .5 * Math.min(1, p.z * 3)) + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, 1.9, 0, TAU); ctx.fill();
    if (p.z < .18) continue;
    const w = ctx.measureText(c.n).width, left = p.vx > .45, lx = left ? p.x - 6 - w : p.x + 6;
    if (!free(lx - 2, p.y - 8, w + 4, 16)) continue;
    placed.push([lx - 2, p.y - 8, w + 4, 16]);
    label(ctx, c.n, left ? p.x - 6 : p.x + 6, p.y, left ? 'right' : 'left', 'rgba(238,240,255,.82)', fpx);
  }
  /* observadores: base en el suelo, vertical hacia fuera y cabeza */
  for (const p of pins) {
    const col = COL[p.i], name = (S.cmp ? 'AB'[p.i] + (p.o.city ? ' · ' : '') : '') + (p.o.city ? byId[p.o.city].n : '');
    if (p.z >= 0) {
      const hx = G.x + p.vx * 1.17 * G.r, hy = G.y - p.vy * 1.17 * G.r;
      ctx.strokeStyle = 'rgba(4,7,20,.7)'; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx, hy, 3.2, 0, TAU); ctx.fill();
      if (S.cmp && p.i === S.act) { ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, 10.5, 0, TAU); ctx.stroke(); }
      if (name) { const left = p.vx > .35; label(ctx, name, p.x + (left ? -12 : 12), p.y + (p.vy > 0 ? 13 : -13), left ? 'right' : 'left', '#fff', 12.5, 600); }
    } else {
      /* el lugar está en la cara que no ve la Luna: marca en el borde, en su dirección */
      const k = Math.hypot(p.vx, p.vy) || 1, ux = p.vx / k, uy = p.vy / k, x = G.x + ux * (G.r + 10), y = G.y - uy * (G.r + 10);
      ctx.setLineDash([3, 3]); ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 5.5, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      const txt = (name ? name + ', ' : '') + 'detrás';
      label(ctx, txt, x + (ux > .2 ? -10 : ux < -.2 ? 10 : 0), y + (Math.abs(ux) > .2 ? 0 : uy > 0 ? 14 : -14), ux > .2 ? 'right' : ux < -.2 ? 'left' : 'center', col, 12, 600);
    }
  }
}

function drawSky(P, o, i) {
  const F = S.F, rm = P.r * .6 * (o.semi / SEMI_MAX), ms = moon.cv;
  const sprite = alpha => { ctx.save(); ctx.translate(P.x, P.y); ctx.rotate(o.cnorth * RAD); ctx.globalAlpha = alpha; ctx.globalCompositeOperation = 'screen'; ctx.drawImage(ms, -rm, -rm, 2 * rm, 2 * rm); ctx.restore(); };
  ctx.save(); ctx.beginPath(); ctx.arc(P.x, P.y, P.r, 0, TAU); ctx.clip();
  ctx.fillStyle = skyColor(o.sunAltApp); ctx.fillRect(P.x - P.r, P.y - P.r, 2 * P.r, 2 * P.r);
  sprite(1);
  /* horizonte a escala del disco lunar: solo aparece cuando la Luna está saliendo o poniéndose */
  const yh = P.y + o.altApp / o.semi * rm;
  if (yh < P.y + P.r) {
    const y0 = Math.max(yh, P.y - P.r);
    ctx.fillStyle = '#0a0d1c'; ctx.fillRect(P.x - P.r, y0, 2 * P.r, P.y + P.r - y0);
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(P.x - P.r, y0, 2 * P.r, 1);
    if (yh < P.y + rm) { sprite(.13); ctx.setLineDash([3, 4]); ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(P.x, P.y, rm, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
  }
  ctx.restore();
  ctx.strokeStyle = S.cmp ? COL[i] : 'rgba(255,255,255,.3)'; ctx.lineWidth = S.cmp ? 2 : 1.25; ctx.beginPath(); ctx.arc(P.x, P.y, P.r, 0, TAU); ctx.stroke();
  /* marca del cénit en lo alto de la ventana */
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.25; ctx.beginPath(); ctx.moveTo(P.x, P.y - P.r + 3); ctx.lineTo(P.x, P.y - P.r + 11); ctx.stroke();
  if (P.r > 105 && !S.cmp) label(ctx, 'cénit', P.x, P.y - P.r + 20, 'center', 'rgba(238,240,255,.6)', 10.5);
  /* norte de la Luna */
  const a = o.north * RAD, sx = Math.sin(a), sy = -Math.cos(a);
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(P.x + sx * (rm + 4), P.y + sy * (rm + 4)); ctx.lineTo(P.x + sx * (rm + 11), P.y + sy * (rm + 11)); ctx.stroke();
  label(ctx, 'N', P.x + sx * (rm + 18), P.y + sy * (rm + 18), 'center', 'rgba(238,240,255,.75)', 11, 600);
  /* rótulos de la superficie: una llamada desde el accidente hasta fuera del disco, solo si está iluminado y a la vista */
  if (rm > 58 && !S.cmp && o.altApp + o.semi > 0) {
    const m = F.view.m, up = F.view.up, right = A.cross(m, up), ca = Math.cos(o.cnorth * RAD), sa = Math.sin(o.cnorth * RAD);
    for (const L of MOON.labels) {
      const b = A.vecOf(L.lat, L.lon), w = [0, 1, 2].map(k => b[0] * F.moon.xb[k] + b[1] * F.moon.yb[k] + b[2] * F.moon.pole[k]);
      if (-A.dot(w, m) < .12 || A.dot(w, F.toSun) < .05) continue;
      const X = A.dot(w, right), Y = -A.dot(w, up), x = X * ca - Y * sa, y = X * sa + Y * ca, k = Math.hypot(x, y) || 1, ux = x / k, uy = y / k;
      const x0 = P.x + x * rm, y0 = P.y + y * rm, x1 = P.x + ux * (rm + 12), y1 = P.y + uy * (rm + 12);
      ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(8,12,30,.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.lineCap = 'butt';
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x0, y0, 1.8, 0, TAU); ctx.fill();
      label(ctx, L.n, P.x + ux * (rm + 17), P.y + uy * (rm + 17) + (Math.abs(ux) < .35 ? (uy > 0 ? 6 : -6) : 0), ux > .35 ? 'left' : ux < -.35 ? 'right' : 'center', 'rgba(238,240,255,.85)', 11);
    }
  }
}

/* regla de tiempo: cinta que se desliza bajo una marca fija. Barras: Sol y Luna sobre el horizonte del observador */
const FR = new Map();
function frameAt(b) { let f = FR.get(b); if (!f) { if (FR.size > 1500) FR.clear(); f = A.frame(b * 600000); FR.set(b, f); } return f; }
function drawTape() {
  const T = S.L.tape, c = tctx, cx = T.w / 2, pph = T.pph, hrs = cx / pph + .5;
  c.setTransform(S.dpr, 0, 0, S.dpr, 0, 0); c.clearRect(0, 0, T.w, T.h);
  c.fillStyle = 'rgba(255,255,255,.035)'; c.fillRect(0, 0, T.w, T.h);
  const xOf = ms => cx + (ms - S.t) / HOUR * pph;
  /* barras por tramos de 10 minutos, con el cruce interpolado */
  const b0 = Math.floor((S.t - hrs * HOUR) / 600000), b1 = Math.ceil((S.t + hrs * HOUR) / 600000);
  const pitch = S.cmp ? 8 : 9, rows = [{ y: 5, col: 'rgba(255,209,102,.8)', f: o => o.sunAltApp + .27, i: S.act }];
  S.obs.forEach((o, i) => rows.push({ y: 5 + pitch * (i + 1), col: S.cmp ? COL[i] : 'rgba(238,236,224,.9)', f: q => q.altApp + q.semi, i }));
  for (const r of rows) {
    const ob = S.obs[r.i]; let prev = null, start = null; c.fillStyle = r.col;
    for (let b = b0; b <= b1; b++) {
      const v = r.f(A.observe(frameAt(b), ob.lat, ob.lon)), x = xOf(b * 600000);
      if (prev) { if (prev.v < 0 && v >= 0) start = prev.x + (x - prev.x) * (-prev.v) / (v - prev.v); else if (prev.v >= 0 && v < 0) { const e = prev.x + (x - prev.x) * prev.v / (prev.v - v); c.fillRect(start == null ? 0 : start, r.y, e - (start == null ? 0 : start), 4); start = null; } }
      else if (v >= 0) start = x;
      prev = { v, x };
    }
    if (start != null || (prev && prev.v >= 0 && start == null && rows)) { if (prev.v >= 0) c.fillRect(start == null ? 0 : start, r.y, T.w - (start == null ? 0 : start), 4); }
  }
  /* horas y días, en la hora del dispositivo */
  const base = S.cmp ? 35 : 32; c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, base + .5); c.lineTo(T.w, base + .5); c.stroke();
  const d = new Date(S.t - hrs * HOUR); d.setMinutes(0, 0, 0); const every = pph < 20 ? 6 : 3;
  for (let ms = d.getTime(); ms < S.t + hrs * HOUR; ms += HOUR) {
    const x = Math.round(xOf(ms)) + .5, h = new Date(ms).getHours();
    c.strokeStyle = h === 0 ? 'rgba(255,255,255,.6)' : h % every === 0 ? 'rgba(255,255,255,.42)' : 'rgba(255,255,255,.16)';
    c.beginPath(); c.moveTo(x, base - (h === 0 ? 7 : h % every === 0 ? 5 : 2)); c.lineTo(x, base + (h === 0 ? 7 : h % every === 0 ? 5 : 2)); c.stroke();
    if (h % every === 0 && x > (h === 0 ? 86 : 64) && x < T.w - (h === 0 ? 34 : 8)) { c.font = FONT(10.5, h === 0 ? 600 : 500); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = h === 0 ? 'rgba(238,240,255,.92)' : 'rgba(238,240,255,.58)'; c.fillText(h === 0 ? fmtDay(ms) : String(h), x, base + (T.h - base) / 2 + 3); }
  }
  /* leyenda y marca central */
  c.font = FONT(S.cmp ? 9 : 10, 600); c.textAlign = 'left'; c.textBaseline = 'middle';
  const lg = c.createLinearGradient(0, 0, 60, 0); lg.addColorStop(0, 'rgba(6,9,24,.96)'); lg.addColorStop(.72, 'rgba(6,9,24,.9)'); lg.addColorStop(1, 'rgba(6,9,24,0)');
  c.fillStyle = lg; c.fillRect(0, 1, 60, 6 + pitch * (S.cmp ? 3 : 2));
  c.fillStyle = 'rgba(255,209,102,.95)'; c.fillText('Sol', 6, 7.5);
  if (S.cmp) { c.fillStyle = COL[0]; c.fillText('Luna A', 6, 7.5 + pitch); c.fillStyle = COL[1]; c.fillText('Luna B', 6, 7.5 + 2 * pitch); }
  else { c.fillStyle = 'rgba(238,236,224,.95)'; c.fillText('Luna', 6, 7.5 + pitch); }
  if (!S.live) { const xn = xOf(Date.now()); if (xn > 66 && xn < T.w - 8 && Math.abs(xn - cx) > 9) { c.fillStyle = S.tint; c.beginPath(); c.moveTo(xn - 4.5, base - 9); c.lineTo(xn + 4.5, base - 9); c.lineTo(xn, base - 2); c.closePath(); c.fill(); } }
  c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, 2); c.lineTo(cx, T.h - 14); c.stroke();
  c.beginPath(); c.arc(cx, base, 5.5, 0, TAU); c.fillStyle = '#0a0f2a'; c.fill(); c.stroke();
}

function draw() {
  ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0); ctx.clearRect(0, 0, S.W, S.H);
  if (!bg) starfield();
  ctx.drawImage(bg, 0, 0, S.W, S.H);
  drawGlobe();
  S.L.sky.forEach((P, i) => { if (S.O[i]) drawSky(P, S.O[i], i); });
  drawTape();
}

/* ---------- HUD ---------- */
const riseCache = new Map();
function events(o) {                       /* próximos sucesos de la Luna en un lugar; se calculan con la escena en reposo */
  const k = o.lat.toFixed(2) + ',' + o.lon.toFixed(2) + ',' + Math.round(S.t / 60000); let e = riseCache.get(k);
  if (!e) { if (riseCache.size > 40) riseCache.clear(); e = { rise: A.nextRise(o.lat, o.lon, S.t), set: A.nextSet(o.lat, o.lon, S.t), transit: A.nextTransit(o.lat, o.lon, S.t) }; riseCache.set(k, e); }
  return e;
}
function updateCaption(el, ob, o, i) {
  el.style.setProperty('--c', COL[i]);
  $('b', el).textContent = (S.cmp ? 'AB'[i] + ' · ' : '') + placeName(ob);
  $('.when', el).textContent = localTime(ob, S.t) + ' · ' + skyState(o);
  const up = o.altApp + o.semi > 0, btn = $(i ? '#go-b' : '#go-a');
  let where;
  if (up) where = o.alt > 89 ? 'Luna en el cénit' : 'Luna a ' + fmtDeg(Math.max(0, o.altApp)) + ' de altura, al ' + wind(o.az);
  else if (S.settled) { const e = events(ob); where = 'Bajo el horizonte' + (e.rise ? ' · sale ' + atTime(ob, e.rise) : ''); btn.dataset.t = e.rise ? e.rise + 100 * 60000 : ''; }
  else where = 'Bajo el horizonte';
  $('.where', el).textContent = where;
  const show = !up && S.settled && !!btn.dataset.t && !S.play && !S.script;
  btn.hidden = !show;
}
function updateHud() {
  if (S.O.length !== S.obs.length || S.F.ms !== S.t) compute();
  const F = S.F, now = Date.now(), act = S.O[S.act];
  $('#ph-name').textContent = phaseName(F.elong);
  $('#ph-sub').textContent = fmtPct(F.frac) + ' iluminada' + (S.L.mobile ? '' : ', en todo el planeta');
  $('#ck-big').textContent = fmtDay(S.t) + (fmtYear(S.t) === fmtYear(now) ? '' : ' ' + fmtYear(S.t)) + ' · ' + fmtHM(S.t);
  $('#ck-sub').textContent = S.live ? 'ahora, en tu hora local' : 'tu hora local · ' + fmtSpan(S.t - now);
  $('#t-now').setAttribute('aria-pressed', S.live ? 'true' : 'false');
  S.obs.forEach((ob, i) => updateCaption($(i ? '#cap-b' : '#cap-a'), ob, S.O[i], i));
  if (S.cmp && S.O[1]) {
    const a = S.O[0], b = S.O[1], both = a.altApp + a.semi > 0 && b.altApp + b.semi > 0;
    $('#cap-cmp').innerHTML = both ? 'Giro entre los dos cielos: <b>' + fmtDeg(Math.abs(A.n180(b.north - a.north))) + '</b>' : 'En este instante no la ven a la vez';
  }
  const h = act.sunAltApp;
  S.tint = h > -.83 ? '#ffd166' : h > -12 ? '#ff9a6a' : '#b794f6'; document.documentElement.style.setProperty('--tint', S.tint);
  const rr = $('#ruler'); rr.setAttribute('aria-valuenow', Math.round(S.t / 60000)); rr.setAttribute('aria-valuetext', fmtDay(S.t) + ', ' + fmtHM(S.t));
  if (S.panel === 'data') renderData();
  S.hud = false; S.hudAt = performance.now();
}
function settle() {                        /* la escena lleva un momento quieta: cálculos caros, enlace y resumen accesible */
  S.settled = true; updateHud();
  const ob = S.obs[S.act], o = S.O[S.act], up = o.altApp + o.semi > 0;
  $('#live').textContent = placeName(ob) + ', ' + localTime(ob, S.t) + '. ' + phaseName(S.F.elong) + ', ' + fmtPct(S.F.frac) + ' iluminada. ' +
    (up ? 'Luna a ' + fmtDeg(Math.max(0, o.altApp)) + ' de altura, al ' + wind(o.az) + ', con el lado iluminado hacia ' + clockOf(o.limb) + '.' : 'La Luna está bajo el horizonte.');
  syncHash();
  try { const a = S.obs[0]; localStorage.setItem('lml:v1', JSON.stringify({ a: { lat: +a.lat.toFixed(4), lon: +a.lon.toFixed(4), city: a.city }, f: S.field })); } catch (e) {}
}

/* ---------- panel de datos ---------- */
const row = (k, v) => `<div><dt>${k}</dt><dd>${v}</dd></div>`;
function renderData() {
  const F = S.F, ob = S.obs[S.act], o = S.O[S.act], up = o.altApp + o.semi > 0;
  $('#d-frac').textContent = fmtPct(F.frac) + ' iluminada';
  $('#d-phase').textContent = phaseName(F.elong) + ' · a ' + fmtKm(F.moon.dist) + ' del centro de la Tierra';
  $('#d-place').textContent = (S.cmp ? 'AB'[S.act] + ' · ' : '') + placeName(ob) + (ob.city ? ' (' + fmtLat(ob.lat) + ', ' + fmtLon(ob.lon) + ')' : '');
  const tilt = o.north <= 180 ? o.north : 360 - o.north, e = S.settled ? events(ob) : null;
  $('#d-obs').innerHTML =
    row('Altura de la Luna', '<b>' + fmtDeg(o.altApp, 1) + '</b>' + (up ? '' : ' (bajo el horizonte)')) +
    row('Rumbo', fmtDeg(o.az) + ' (' + wind(o.az) + ')') +
    row('Lado iluminado', 'hacia ' + clockOf(o.limb) + ' (' + fmtDeg(o.limb) + ')') +
    row('Norte de la Luna', tilt < .5 ? 'arriba' : fmtDeg(tilt) + (o.north <= 180 ? ' a la derecha' : ' a la izquierda') + ' de la vertical') +
    row('Diámetro aparente', fmt(o.semi * 120, 1) + '′') +
    row('Sol', fmtDeg(o.sunAltApp, 1) + ' (' + skyState(o) + ')') +
    (e ? row('Sale', placeTime(ob, e.rise)) + row('Pasa por el meridiano', placeTime(ob, e.transit)) + row('Se pone', placeTime(ob, e.set)) + row('Horas en', ob.city ? 'hora oficial del lugar' : 'hora solar del lugar') : '');
  const sm = F.sub.moon, bear = A.bearing(sm[0], sm[1], ob.lat, ob.lon);
  $('#d-rule').innerHTML = 'La Luna está en el cénit de ' + fmtLat(sm[0]) + ', ' + fmtLon(sm[1]) + '. Desde allí se llega a este lugar con rumbo <b>' + fmtDeg(bear, 1) + '</b>, y el norte celeste aparece girado <b>' + fmtDeg(o.cnorth, 1) + '</b> respecto a su vertical. Coinciden salvo por el paralaje.';
  $('#d-geo').innerHTML =
    row('Distancia al punto sublunar', fmtDeg(Math.acos(clamp(A.dot(A.vecOf(ob.lat, ob.lon), F.view.m), -1, 1)) / RAD, 1)) +
    row('Sol en el cénit de', fmtLat(F.sub.sun[0]) + ', ' + fmtLon(F.sub.sun[1])) +
    row('Elongación Luna−Sol', fmtDeg(F.elong, 1)) +
    row('Hora universal', dfmt('UTC', { day: 'numeric', month: 'short', year: 'numeric' }).format(S.t).replace(/\./g, '') + ', ' + fmtHM(S.t, 'UTC'));
}

/* ---------- enlace profundo ----------
   Solo letras, dígitos y guiones: lugar[-vs-lugar][-tAAAAMMDDhhmm][-pasoN]. El lugar es el id de una ciudad
   o unas coordenadas (n4042w00370 = 40,42° N, 3,70° O). Sin la t, el instante es «ahora». */
const pad = (n, w) => String(n).padStart(w, '0');
const tokOf = o => o.city || (o.lat >= 0 ? 'n' : 's') + pad(Math.round(Math.abs(o.lat) * 100), 4) + (o.lon >= 0 ? 'e' : 'w') + pad(Math.round(Math.abs(o.lon) * 100), 5);
function placeOf(tok) {
  if (byId[tok]) return { lat: byId[tok].lat, lon: byId[tok].lon, city: tok };
  const m = /^([ns])(\d{1,4})([ew])(\d{1,5})$/.exec(tok); if (!m) return null;
  const lat = (m[1] === 'n' ? 1 : -1) * m[2] / 100, lon = (m[3] === 'e' ? 1 : -1) * m[4] / 100;
  return Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { lat: clamp(lat, -89.5, 89.5), lon, city: null } : null;
}
function hashOf() {
  let h = tokOf(S.obs[0]); if (S.cmp && S.obs[1]) h += '-vs-' + tokOf(S.obs[1]);
  if (!S.live) { const d = new Date(S.t); h += '-t' + d.getUTCFullYear() + pad(d.getUTCMonth() + 1, 2) + pad(d.getUTCDate(), 2) + pad(d.getUTCHours(), 2) + pad(d.getUTCMinutes(), 2); }
  if (S.panel === 'tour') h += '-paso' + (S.step + 1);
  return h;
}
let lastHash = '';
function syncHash() { lastHash = hashOf(); try { history.replaceState(null, '', '#' + lastHash); } catch (e) {} }
function applyHash(h) {
  if (!h) return false;
  let a = null, b = null, t = null, step = null, vs = false;
  for (const tok of h.toLowerCase().split('-')) {
    let m;
    if (tok === 'vs') vs = true;
    else if ((m = /^t(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)$/.exec(tok))) t = Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5]);
    else if ((m = /^paso([1-9])$/.exec(tok))) step = Math.min(TOUR.length, +m[1]) - 1;
    else { const p = placeOf(tok); if (p) { if (vs && a) b = p; else a = p; } }
  }
  if (!a && t == null && step == null) return false;
  if (a) S.obs[0] = a;
  if (b) { S.obs[1] = b; S.cmp = true; S.act = 1; } else { S.obs.length = 1; S.cmp = false; S.act = 0; }
  if (t != null && isFinite(t)) { S.t = clamp(t, T_MIN, T_MAX); S.live = false; } else if (step == null) { S.t = Date.now(); S.live = true; }
  $('#b-compare').setAttribute('aria-pressed', S.cmp ? 'true' : 'false');
  if (step != null) { S.step = step; openPanel('tour', true); }
  return true;
}

/* ---------- acciones ---------- */
function stopPlay() { if (!S.play) return; S.play = false; $('#t-play').setAttribute('aria-pressed', 'false'); $('#i-play').style.display = ''; $('#i-pause').style.display = 'none'; touch(); }
function startPlay(rate) { S.play = true; S.rate = rate || 1; S.live = false; S.tAnim = null; S.stepAt = 0; $('#t-play').setAttribute('aria-pressed', 'true'); $('#i-play').style.display = 'none'; $('#i-pause').style.display = ''; }
function togglePlay() { S.script = null; if (S.play) stopPlay(); else startPlay(1); }
function setField(on) { S.field = on; $('#b-field').setAttribute('aria-pressed', on ? 'true' : 'false'); touch(); }
function setCompare(on, a, b) {
  if (on) {
    if (a) S.obs[0] = a;
    if (b) S.obs[1] = b;
    else if (!S.obs[1]) {             /* por defecto, el punto simétrico respecto al sublunar: misma altura, media vuelta de giro */
      const v = A.toView(S.F || A.frame(S.t), S.obs[0].lat, S.obs[0].lon), k = v[2] > .1 ? 1 : 0, ll = A.fromView(S.F || A.frame(S.t), k ? -v[0] : .35, k ? -v[1] : -.45);
      S.obs[1] = { lat: ll[0], lon: ll[1], city: null };
    }
    S.cmp = true; S.act = 1;
  } else { S.obs.length = 1; S.cmp = false; S.act = 0; S.anim = null; }
  $('#b-compare').setAttribute('aria-pressed', on ? 'true' : 'false'); measure();
}
function moveObs(dLat, dLon) { const o = S.obs[S.act]; S.script = null; setObs(S.act, o.lat + dLat, o.lon + dLon, null); }
function visiblePlace() {                  /* asegura que el observador activo tiene la Luna bien visible */
  compute(); if (S.O[S.act].alt > 12) return;
  let best = null, alt = 15;
  for (const c of CITIES) { const o = A.observe(S.F, c.lat, c.lon); if (o.alt > alt) { alt = o.alt; best = c; } }
  if (best) setObs(S.act, best.lat, best.lon, best.id, true); else { const ll = A.fromView(S.F, .3, .4); setObs(S.act, ll[0], ll[1], null, true); }
}

/* ---------- recorrido ---------- */
const GO = {
  intro() { setCompare(false); S.spines = false; setField(true); goLive(); visiblePlace(); },
  vertical() { setCompare(false); S.spines = true; visiblePlace(); },
  orbit() { setCompare(false); S.spines = false; setField(true); compute(); const v = A.toView(S.F, S.obs[0].lat, S.obs[0].lon); S.anim = null; S.script = { kind: 'orbit', t0: performance.now(), dur: 10000, th0: v[2] > 0 ? Math.atan2(v[0], v[1]) : 0, n: 0 }; },
  night() {
    setCompare(false); S.spines = false; setField(true);
    const o = S.obs[0].city ? S.obs[0] : { lat: CITIES[0].lat, lon: CITIES[0].lon, city: CITIES[0].id }; S.obs[0] = o; S.anim = null;
    const rise = A.nextRise(o.lat, o.lon, S.t - 13 * HOUR), set = rise && A.nextSet(o.lat, o.lon, rise + 20 * 60000);
    const from = rise ? rise - 30 * 60000 : S.t, to = set ? set + 30 * 60000 : from + 14 * HOUR;
    S.live = false; S.tAnim = null; stopPlay(); S.t = from; S.script = { kind: 'night', t0: performance.now(), from, to, dur: (to - from) / HOUR * 620, n: 0 }; touch();
  },
  border() {
    S.spines = false; setField(true);
    const M = byId.madrid, C = byId.elcabo;
    setCompare(true, { lat: M.lat, lon: M.lon, city: M.id }, { lat: C.lat, lon: C.lon, city: C.id });
    /* instante en que el punto sublunar cae sobre el círculo máximo que une las dos ciudades:
       quedan a lados opuestos de él y el giro entre sus cielos es de media vuelta */
    let t = A.nextTransit(0, 7.5, Math.max(S.t - 3 * HOUR, T_MIN));
    for (let k = 0; k < 3 && t; k++) {
      const dec = A.frame(t).sub.moon[0]; let lo = 0, hi = 1;
      for (let j = 0; j < 30; j++) { const mid = (lo + hi) / 2; if (A.slerp(M.lat, M.lon, C.lat, C.lon, mid)[0] > dec) lo = mid; else hi = mid; }
      t = A.nextTransit(0, A.slerp(M.lat, M.lon, C.lat, C.lon, (lo + hi) / 2)[1], t - 2 * HOUR) || t;
    }
    if (t) animateTime(t);
  }
};
function showStep(k) {
  S.step = clamp(k, 0, TOUR.length - 1); const st = TOUR[S.step];
  $('#s-n').textContent = 'Paso ' + (S.step + 1) + ' de ' + TOUR.length;
  $('#s-t').textContent = st.t; $('#s-d').textContent = st.d;
  $('#s-prev').disabled = S.step === 0; $('#s-next').textContent = S.step === TOUR.length - 1 ? 'Terminar' : 'Siguiente';
  const d = $('#s-demo'); d.hidden = !st.demo; if (st.demo) d.textContent = st.demo;
  S.script = null; stopPlay(); GO[st.go](); touch();
}
function runScript(now) {
  const sc = S.script, u = clamp((now - sc.t0) / sc.dur, 0, 1);
  if (sc.kind === 'orbit') {
    /* una vuelta alrededor del punto sublunar, a 52° de altura de la Luna; con movimiento reducido, en ocho saltos */
    const steps = 8, k = reduced ? Math.floor(u * steps) / steps : ease(u), th = sc.th0 + k * TAU, rho = .62;
    if (reduced && Math.floor(u * steps) === sc.n && u < 1 && sc.n > 0) return; sc.n = Math.floor(u * steps);
    const ll = A.fromView(S.F, rho * Math.sin(th), rho * Math.cos(th)); S.obs[0] = { lat: ll[0], lon: ll[1], city: null }; touch();
  } else if (sc.kind === 'night') {
    const hrs = Math.round((sc.to - sc.from) / HOUR), k = reduced ? Math.floor(u * hrs) / hrs : u;
    S.t = sc.from + (sc.to - sc.from) * k; touch(); S.tMoved = S.moved;
  }
  if (u >= 1) S.script = null;
}

/* ---------- paneles y diálogos ---------- */
function openPanel(kind, quiet) {
  S.panel = kind; $('#p-data').hidden = kind !== 'data'; $('#p-tour').hidden = kind !== 'tour';
  panel.classList.add('open'); panel.scrollTop = 0;
  $('#b-data').setAttribute('aria-pressed', kind === 'data' ? 'true' : 'false'); $('#b-tour').setAttribute('aria-pressed', kind === 'tour' ? 'true' : 'false');
  if (S.L) measure();
  if (kind === 'tour' && !quiet) showStep(S.step);
  if (kind === 'data' && S.F) renderData();
  hideHint();
}
function closePanel() {
  if (!S.panel) return; const was = S.panel; S.panel = null; panel.classList.remove('open');
  $('#b-data').setAttribute('aria-pressed', 'false'); $('#b-tour').setAttribute('aria-pressed', 'false');
  if (was === 'tour') { S.script = null; S.spines = false; }
  measure();
}
const dPlaces = $('#d-places');
function openPlaces() {
  compute(); renderMoon(1);
  const list = CITIES.map(c => ({ c, o: A.observe(S.F, c.lat, c.lon) })).map(r => Object.assign(r, { up: r.o.altApp + r.o.semi > 0 })).sort((a, b) => b.o.alt - a.o.alt);
  const n = list.filter(r => r.up).length;
  $('h2', dPlaces).textContent = S.live ? 'La misma Luna, ahora, desde…' : 'La misma Luna desde…';
  $('#pl-sub').textContent = fmtDay(S.t) + ', ' + fmtHM(S.t) + ' en tu hora local. ' + n + ' de ' + list.length + ' lugares la tienen sobre el horizonte, todos con el ' + fmtPct(S.F.frac) + ' iluminado.';
  const box = $('#pl-list'); box.innerHTML = '';
  for (const r of list) {
    const b = document.createElement('button'); b.className = 'res' + (r.up ? '' : ' down'); b.dataset.id = r.c.id;
    const k = document.createElement('canvas'), px = Math.round(30 * S.dpr); k.width = k.height = px;
    const c = k.getContext('2d'); c.translate(px / 2, px / 2); c.rotate(r.o.cnorth * RAD); c.globalAlpha = r.up ? 1 : .32; c.imageSmoothingQuality = 'high'; c.drawImage(moon.mini, -px / 2 + 1, -px / 2 + 1, px - 2, px - 2);
    b.appendChild(k);
    b.insertAdjacentHTML('beforeend', `<span class="rn">${esc(r.c.n)}</span><span class="rs">${fmtHM(S.t, r.c.tz)} · ${r.up ? fmtDeg(Math.max(0, r.o.altApp)) + ', ' + wind(r.o.az) : 'bajo el horizonte'}</span>`);
    box.appendChild(b);
  }
  dPlaces.showModal(); hideHint();
}
$('#pl-list').addEventListener('click', e => { const b = e.target.closest('.res'); if (!b) return; const c = byId[b.dataset.id]; dPlaces.close(); S.script = null; setObs(S.act, c.lat, c.lon, c.id, true); });

/* ---------- entrada: puntero, rueda, regla y teclado ---------- */
function globeHit(e, slack) { const G = S.L.globe; return Math.hypot(e.clientX - G.x, e.clientY - G.y) <= G.r + (slack || 0); }
function obsFromPointer(e) {
  const G = S.L.globe; let x = (e.clientX - G.x) / G.r, y = -(e.clientY - G.y) / G.r; const r = Math.hypot(x, y);
  if (r > .985) { x *= .985 / r; y *= .985 / r; }
  return A.fromView(S.F, x, y);
}
stage.addEventListener('pointerdown', e => {
  if (e.button > 0 || !S.F) return; hideHint();
  if (!globeHit(e, 14)) {
    if (S.cmp) S.L.sky.forEach((P, i) => { if (Math.hypot(e.clientX - P.x, e.clientY - P.y) <= P.r) { S.act = i; touch(); } });
    return;
  }
  stage.setPointerCapture(e.pointerId); S.script = null; S.anim = null;
  let i = S.act;
  if (S.cmp) { let best = 30; S.obs.forEach((o, k) => { const p = pt(o.lat, o.lon), d = Math.hypot(p.x - e.clientX, p.y - e.clientY); if (p.z >= 0 && d < best) { best = d; i = k; } }); S.act = i; }
  S.drag = { id: e.pointerId, i, x: e.clientX, y: e.clientY, moved: false };
  const ll = obsFromPointer(e); setObs(i, ll[0], ll[1], null); stage.classList.add('drag');
});
stage.addEventListener('pointermove', e => {
  const d = S.drag;
  if (!d || d.id !== e.pointerId) { if (e.pointerType !== 'touch' && S.L) stage.classList.toggle('grab', globeHit(e, 0)); return; }
  if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5) d.moved = true;
  const ll = obsFromPointer(e); setObs(d.i, ll[0], ll[1], null);
});
function pointerEnd(e) {
  const d = S.drag; if (!d || d.id !== e.pointerId) return; S.drag = null; stage.classList.remove('drag');
  if (e.type === 'pointerup' && !d.moved) {          /* toque sin arrastre: si cae junto a una ciudad, el observador se queda en ella */
    let best = null, bd = 16;
    for (const c of CITIES) { const p = pt(c.lat, c.lon), q = Math.hypot(p.x - e.clientX, p.y - e.clientY); if (p.z > 0 && q < bd) { bd = q; best = c; } }
    if (best) setObs(d.i, best.lat, best.lon, best.id);
  }
  touch();
}
stage.addEventListener('pointerup', pointerEnd); stage.addEventListener('pointercancel', pointerEnd);
stage.addEventListener('focus', () => { try { S.focus = stage.matches(':focus-visible'); } catch (e) { S.focus = true; } S.dirty = true; });
stage.addEventListener('blur', () => { S.focus = false; S.dirty = true; });

addEventListener('wheel', e => {
  if (e.target.closest('#panel, dialog')) return;
  e.preventDefault(); hideHint(); stopPlay(); S.script = null; S.tAnim = null;
  let dy = e.deltaY; if (e.deltaMode === 1) dy *= 16; else if (e.deltaMode === 2) dy *= S.H;
  setTime(S.t + clamp(dy, -240, 240) * 18000);
}, { passive: false });

const ruler = $('#ruler'); let rdrag = null;
ruler.addEventListener('pointerdown', e => { rdrag = { id: e.pointerId, x: e.clientX, t: S.t }; ruler.setPointerCapture(e.pointerId); stopPlay(); S.script = null; S.tAnim = null; hideHint(); });
ruler.addEventListener('pointermove', e => { if (rdrag && rdrag.id === e.pointerId) setTime(rdrag.t - (e.clientX - rdrag.x) / S.L.tape.pph * HOUR); });
ruler.addEventListener('pointerup', () => { rdrag = null; }); ruler.addEventListener('pointercancel', () => { rdrag = null; });
ruler.addEventListener('keydown', e => {
  const k = e.key, s = e.shiftKey ? HOUR : 600000;
  if (k === 'ArrowLeft' || k === 'ArrowDown') setTime(S.t - s); else if (k === 'ArrowRight' || k === 'ArrowUp') setTime(S.t + s); else return;
  stopPlay(); S.script = null; e.preventDefault(); e.stopPropagation();
});

addEventListener('keydown', e => {
  const tag = (e.target.tagName || '').toLowerCase(), k = e.key;
  if (k === 'Escape') { for (const d of $$('dialog[open]')) d.close(); closePanel(); return; }
  if (tag === 'input' || tag === 'select' || tag === 'textarea' || $('dialog[open]') || e.ctrlKey || e.metaKey || e.altKey) return;
  if (k === ' ' && tag === 'button') return;
  const st = e.shiftKey ? 10 : 2;
  if (k === 'ArrowUp') moveObs(st, 0); else if (k === 'ArrowDown') moveObs(-st, 0);
  else if (k === 'ArrowLeft') moveObs(0, -st); else if (k === 'ArrowRight') moveObs(0, st);
  else if (k === '+' || k === '=') { stopPlay(); animateTime(S.t + HOUR); } else if (k === '-') { stopPlay(); animateTime(S.t - HOUR); }
  else if (k === 'PageDown' || k === '*') { stopPlay(); animateTime(S.t + DAY); } else if (k === 'PageUp' || k === '_') { stopPlay(); animateTime(S.t - DAY); }
  else if (k === 'Home') goLive();
  else if (k === ' ') togglePlay();
  else if (k === '/' || k === 'b') openPlaces();
  else if (k === 'l') { S.spines = false; setField(!S.field); }
  else if (k === 'c') setCompare(!S.cmp);
  else if (k === 'd') { if (S.panel === 'data') closePanel(); else openPanel('data'); }
  else if (k === 'r') { if (S.panel === 'tour') closePanel(); else openPanel('tour'); }
  else if (k === '?' || k === 'h') $('#d-help').showModal();
  else return;
  e.preventDefault(); hideHint();
});

/* botones */
$('#t-dm').addEventListener('click', () => { stopPlay(); animateTime(S.t - DAY); });
$('#t-hm').addEventListener('click', () => { stopPlay(); animateTime(S.t - HOUR); });
$('#t-hp').addEventListener('click', () => { stopPlay(); animateTime(S.t + HOUR); });
$('#t-dp').addEventListener('click', () => { stopPlay(); animateTime(S.t + DAY); });
$('#t-play').addEventListener('click', togglePlay);
$('#t-now').addEventListener('click', goLive);
$('#b-places').addEventListener('click', openPlaces);
$('#b-field').addEventListener('click', () => { S.spines = false; setField(!S.field); });
$('#b-compare').addEventListener('click', () => setCompare(!S.cmp));
$('#b-tour').addEventListener('click', () => { if (S.panel === 'tour') closePanel(); else openPanel('tour'); });
$('#b-data').addEventListener('click', () => { if (S.panel === 'data') closePanel(); else openPanel('data'); });
$('#b-help').addEventListener('click', () => $('#d-help').showModal());
$('#p-close').addEventListener('click', closePanel);
$('#s-prev').addEventListener('click', () => showStep(S.step - 1));
$('#s-next').addEventListener('click', () => { if (S.step >= TOUR.length - 1) closePanel(); else showStep(S.step + 1); });
$('#s-demo').addEventListener('click', () => { stopPlay(); GO[TOUR[S.step].go](); });
$('#d-jump').addEventListener('click', e => { const b = e.target.closest('[data-ph]'); if (!b) return; const t = A.phaseTime(S.t + 60000, +b.dataset.ph, 1); if (t) { stopPlay(); S.script = null; S.tAnim = null; setTime(t); } });
for (const el of $$('.go')) el.addEventListener('click', () => { if (el.dataset.t) { stopPlay(); S.script = null; animateTime(+el.dataset.t); el.hidden = true; } });
for (const b of $$('dialog .x')) b.addEventListener('click', () => b.closest('dialog').close());
for (const d of $$('dialog')) d.addEventListener('click', e => { if (e.target === d) d.close(); });

/* pista inicial */
const hint = $('#hint'); let hintOff = false;
function hideHint() { if (hintOff) return; hintOff = true; hint.classList.add('off'); setTimeout(() => hint.remove(), 800); }
setTimeout(hideHint, 12000);

/* ---------- bucle ---------- */
function compute() {
  if (!S.F || S.F.ms !== S.t) S.F = A.frame(S.t);
  S.O = S.obs.map(o => A.observe(S.F, o.lat, o.lon));
}
let last = 0;
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000 || 0); last = now;
  if (S.live && !S.drag && Math.abs(Date.now() - S.t) > 15000) { S.t = Date.now(); S.dirty = S.hud = true; }
  if (S.play) {
    if (reduced) { if (now - (S.stepAt || 0) > 800) { S.stepAt = now; setTime(S.t + S.rate * HOUR / 2); } }
    else setTime(S.t + dt * S.rate * HOUR);
    if (S.t >= T_MAX) stopPlay();
  }
  if (S.tAnim) { const a = S.tAnim, u = clamp((now - a.t0) / a.dur, 0, 1); S.t = a.from + (a.to - a.from) * ease(u); if (u >= 1) S.tAnim = null; touch(); S.tMoved = now; }
  if (S.anim) { const a = S.anim, u = clamp((now - a.t0) / a.dur, 0, 1), ll = A.slerp(a.from[0], a.from[1], a.to[0], a.to[1], ease(u)); S.obs[a.i] = { lat: ll[0], lon: ll[1], city: u >= 1 ? a.city : null }; if (u >= 1) { S.obs[a.i].lat = a.to[0]; S.obs[a.i].lon = a.to[1]; S.anim = null; } touch(); }
  if (S.script && S.F) runScript(now);
  if (mapJob) { if (mapJob.step(S.dirty ? 5 : 11) >= 1) { mapJob = null; mapVer++; S.dirty = true; } }
  const moving = now - S.tMoved < 170;                                        /* mientras el tiempo corre, la Tierra y la Luna se pintan a media resolución */
  if (!S.dirty && (earth.q < 1 || moon.q < 1) && now - S.tMoved > 200) S.dirty = true;   /* al parar, a resolución completa */
  if (S.dirty && S.L) {
    compute();
    const q = moving && earth.key ? .5 : 1;
    renderEarth(q); renderMoon(q < 1 && moon.key ? .5 : 1);
    draw(); S.dirty = false;
  }
  if (S.hud && S.F && now - S.hudAt > 90) updateHud();
  if (!S.settled && !S.drag && !S.play && !S.script && !S.tAnim && !S.anim && now - S.moved > 450 && S.F) settle();
  requestAnimationFrame(frame);
}

/* ---------- arranque ---------- */
addEventListener('resize', measure);
/* si la cabecera o el pie cambian de alto (textos que llegan, fuentes que cargan), se recoloca la escena */
if (window.ResizeObserver) { const ro = new ResizeObserver(() => { if (barsNow() !== barsKey) measure(); }); ro.observe($('.top')); ro.observe($('.bottom')); ro.observe(panel); }
addEventListener('hashchange', () => { const h = location.hash.slice(1); if (h === lastHash) return; if (applyHash(h)) { measure(); touch(); } else syncHash(); });
(function start() {
  const hadHash = applyHash(location.hash.slice(1));
  if (!hadHash) {
    try { const v = JSON.parse(localStorage.getItem('lml:v1') || 'null'); if (v && v.a && isFinite(v.a.lat) && isFinite(v.a.lon)) { S.obs[0] = { lat: clamp(+v.a.lat, -89.5, 89.5), lon: A.n180(+v.a.lon), city: byId[v.a.city] ? v.a.city : null }; if (v.f === false) setField(false); } } catch (e) {}
  } else hideHint();
  measure();
  if (!hadHash) { compute(); const o = S.O[0]; if (o.altApp + o.semi <= 0) hint.textContent = 'Ahora la Luna no se ve desde ' + placeName(S.obs[0]) + '. Toca la Tierra para mover al observador.'; }
  if (S.panel === 'tour') showStep(S.step);
  ruler.setAttribute('aria-valuemin', Math.round(T_MIN / 60000)); ruler.setAttribute('aria-valuemax', Math.round(T_MAX / 60000));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); });
  requestAnimationFrame(frame);
})();
})();
