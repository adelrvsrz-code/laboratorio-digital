(function () {
'use strict';
const { C, LGC, evOf, atmAlt, atmCause, bandOf, colorOf } = FIS;
const TAU = Math.PI * 2;
const $ = (s, r) => (r || document).querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const log10 = Math.log10;
const NB = '\u202F';
const SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
const sup = n => String(n).split('').map(c => SUP[c] || c).join('');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- formato ---------- */
function sci(x, sig = 2) {
  if (!x) return '0';
  let e = Math.floor(log10(Math.abs(x))), m = Number((x / 10 ** e).toPrecision(sig));
  if (Math.abs(m) >= 10) { m /= 10; e += 1; }
  const ms = m.toString().replace('.', ',');
  return (ms === '1' ? '' : ms + ' × ') + '10' + sup(e);
}
function fmt(x, sig = 3) {
  const s = Number(x.toPrecision(sig)).toString();
  if (s.includes('e')) return sci(x, sig);
  let [i, f] = s.split('.');
  i = i.replace(/\B(?=(\d{3})+(?!\d))/g, NB);
  return f ? i + ',' + f : i;
}
function unit(x, table, sig) {
  for (const [k, u] of table) if (x >= k * .9995) return fmt(x / k, sig) + ' ' + u;
  return null;
}
const U_F = [[1e12, 'THz'], [1e9, 'GHz'], [1e6, 'MHz'], [1e3, 'kHz'], [1, 'Hz']];
const U_L = [[1e3, 'km'], [1, 'm'], [1e-2, 'cm'], [1e-3, 'mm'], [1e-6, 'µm'], [1e-9, 'nm'], [1e-12, 'pm'], [1e-15, 'fm'], [1e-18, 'am']];
const U_E = [[1e15, 'PeV'], [1e12, 'TeV'], [1e9, 'GeV'], [1e6, 'MeV'], [1e3, 'keV'], [1, 'eV'], [1e-3, 'meV'], [1e-6, 'µeV'], [1e-9, 'neV'], [1e-12, 'peV'], [1e-15, 'feV']];
const fmtFreq = (f, sig) => f >= .9995e15 ? sci(f, sig || 3) + ' Hz' : unit(f, U_F, sig) || sci(f) + ' Hz';
const fmtLen = (m, sig) => unit(m, U_L, sig) || sci(m) + ' m';
const fmtEnergy = (e, sig) => e >= .1 && e < 1 ? fmt(e, sig) + ' eV' : unit(e, U_E, sig) || sci(e) + ' eV';   // 0,8 eV mejor que 800 meV
/* intervalo «de A a B unidad», sin repetir la unidad si coincide */
function fmtRange(a, b, fn, sig) {
  const sa = fn(a, sig), sb = fn(b, sig), ua = sa.slice(sa.lastIndexOf(' ') + 1), ub = sb.slice(sb.lastIndexOf(' ') + 1);
  return ua === ub && !sa.includes('×') ? `${sa.slice(0, sa.lastIndexOf(' '))} – ${sb}` : `${sa} – ${sb}`;
}
function sizeLike(lam) {
  let best = SIZES[0], bd = Infinity;
  for (const s of SIZES) { const d = Math.abs(log10(lam / s[0])); if (d < bd) { bd = d; best = s; } }
  const r = lam / best[0];
  if (r > .87 && r < 1.15) return '≈ ' + best[1];
  return r >= 1 ? `${best[1]} × ${fmtMult(r)}` : `${best[1]} ÷ ${fmtMult(1 / r)}`;
}
const fmtMult = q => q < 1e4 ? fmt(q, 2) : sci(q, 1);
const fmtKm = km => km < 10 ? fmt(Math.round(km), 1) : km < 100 ? fmt(Math.round(km / 5) * 5) : fmt(Math.round(km / 10) * 10);

/* ---------- datos ---------- */
const F0 = 0, F1 = 30;   // límites del dial: de 1 Hz a 10³⁰ Hz, en log10
const ALL = ITEMS.map(o => {
  const r = Array.isArray(o.f), lo = r ? Math.min(o.f[0], o.f[1]) : o.f, hi = r ? Math.max(o.f[0], o.f[1]) : o.f;
  return Object.assign({}, o, { lo, hi, rng: r, l0: log10(lo), l1: log10(hi), lg: (log10(lo) + log10(hi)) / 2, col: CATS[o.c].col, obs: o.alt != null });
}).sort((a, b) => a.lg - b.lg);
const byId = Object.fromEntries(ALL.map(o => [o.id, o]));
const SKY = ALL.filter(o => o.obs);
const ORDER = ALL.slice().sort((a, b) => a.p - b.p || a.lg - b.lg);   // orden estable para repartir rótulos
BANDS.forEach((b, i) => { b.l0 = i ? log10(BANDS[i - 1].hasta) : F0; b.l1 = isFinite(b.hasta) ? log10(b.hasta) : F1; });

/* Perfil promediado. Una columna de la pantalla abarca un tramo de frecuencias: se pinta
   la media del perfil en ese tramo (tabla fina en lg λ con sumas acumuladas) para que los
   detalles estrechos no aparezcan y desaparezcan al desplazar. Al acercar, se afilan. */
const PG = .002, PN = Math.round((F1 - F0) / PG), PSUM = new Float64Array(PN + 1);
for (let i = 0; i < PN; i++) PSUM[i + 1] = PSUM[i] + atmAlt(LGC - F1 + (i + .5) * PG);
function altBand(l, hw) {            // l: lg de la frecuencia central; hw: semianchura en décadas
  if (hw <= PG) return atmAlt(LGC - l);
  const a = Math.floor(clamp((F1 - l - hw) / PG, 0, PN - 1)), b = Math.max(a + 1, Math.ceil(clamp((F1 - l + hw) / PG, 1, PN)));
  return (PSUM[b] - PSUM[a]) / (b - a);
}

/* ---------- estado ---------- */
const S = { W: 1, H: 1, mob: false, low: false, slim: false, rows: 2, c: 14.75, tc: 14.75, ppd: 120, tppd: 120, pmin: 30, pmax: 1600,
  yTop: 80, y500: 120, yGround: 400, yDial: 450, strip: 18, sel: null, hover: null, focal: null, band: -1,
  hits: [], bars: [], tour: false, ti: 0, hold: 0, lastT: 0, dirty: true, saveAt: 0, moved: false };
const stage = $('#stage');
const X = l => S.W / 2 + (l - S.c) * S.ppd;
const Linv = x => S.c + (x - S.W / 2) / S.ppd;
const G = km => Math.asinh(km / 6) / Math.asinh(ATMOS.techo / 6);     // eje vertical comprimido
const yOf = km => S.yGround - (S.yGround - S.y500) * G(Math.min(km, ATMOS.techo));

const cv = $('#scene'), ctx = cv.getContext('2d'); let dpr = 1, stars = [];
const FT = '"Instrument Sans",ui-sans-serif,system-ui,sans-serif';
const wCache = new Map();
function tw(text, font) { const k = font + '|' + text; let w = wCache.get(k); if (w == null) { ctx.font = font; w = ctx.measureText(text).width; wCache.set(k, w); } return w; }

function measure() {
  S.W = innerWidth; S.H = innerHeight; S.mob = S.W <= 760; S.low = S.H < 560; S.rows = S.low ? 1 : 2;
  document.documentElement.classList.toggle('low', S.low);          // antes de medir el pie: cambia su altura
  S.slim = S.mob || S.low;                                           // dial de una sola escala
  const bottom = $('.bottom').offsetHeight || 80, lanes = 14 + 20 * S.rows, dial = S.slim ? 40 : 54;
  S.yDial = S.H - bottom - dial; S.yGround = S.yDial - lanes;
  S.yTop = (S.slim ? 58 : 80) + (parseFloat(getComputedStyle(document.documentElement).paddingTop) || 0);
  S.y500 = S.yTop + (S.low ? 36 : 46);
  S.pmin = S.W / (F1 - F0 + 1); S.pmax = 1600;
  S.tppd = clamp(S.tppd, S.pmin, S.pmax); S.ppd = clamp(S.ppd, S.pmin, S.pmax);
  dpr = Math.min(devicePixelRatio || 1, 2, Math.sqrt(4.2e6 / (S.W * S.H)));
  cv.width = Math.round(S.W * dpr); cv.height = Math.round(S.H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const R = (() => { let t = 2024; return () => { t = (t * 1664525 + 1013904223) >>> 0; return t / 4294967296; }; })();
  stars = []; for (let i = 0, n = Math.round(S.W * S.H / 9000); i < n; i++) stars.push([R() * S.W, R(), .4 + R() * 1.1, .25 + R() * .6]);
  S.dirty = true;
}

/* ---------- dibujo ---------- */
const hash = k => { let t = (k * 2654435761) >>> 0; t ^= t >>> 15; t = (t * 2246822519) >>> 0; t ^= t >>> 13; return (t >>> 0) / 4294967296; };
const rgb = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

function glyph(kind, x, y, col, on) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = on ? 2 : 1.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  if (kind === 'dish') {
    ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.moveTo(0, 0); ctx.lineTo(0, -7);
    ctx.save(); ctx.translate(0, -8); ctx.rotate(-.5); ctx.moveTo(9, -8); ctx.arc(0, -8, 9, 0, Math.PI); ctx.moveTo(0, 1); ctx.lineTo(0, -9); ctx.restore();
  } else if (kind === 'dome') {
    ctx.rect(-8, -6, 16, 6); ctx.moveTo(8, -6); ctx.arc(0, -6, 8, 0, Math.PI, true); ctx.moveTo(2, -13.7); ctx.lineTo(2, -6);
  } else if (kind === 'plane') {
    ctx.moveTo(-13, -8); ctx.lineTo(13, -8); ctx.moveTo(-13, -8); ctx.lineTo(-16, -15); ctx.moveTo(2, -8); ctx.lineTo(-5, -1); ctx.moveTo(-4, -8); ctx.lineTo(-4, -12);
  } else if (kind === 'balloon') {
    ctx.arc(0, -17, 8, 0, TAU); ctx.moveTo(-5, -11); ctx.lineTo(-2, -4); ctx.moveTo(5, -11); ctx.lineTo(2, -4); ctx.rect(-2.5, -4, 5, 4);
  } else if (kind === 'sat') {
    ctx.rect(-4, -13, 8, 8); ctx.rect(-16, -11.5, 9, 5); ctx.rect(7, -11.5, 9, 5); ctx.moveTo(-7, -9); ctx.lineTo(-4, -9); ctx.moveTo(4, -9); ctx.lineTo(7, -9);
  } else {
    for (const dx of [-11, -3, 5]) ctx.rect(dx, -6, 6, 6);
  }
  ctx.stroke(); ctx.restore();
}

/* reparto de rótulos del suelo en dos filas, sin solapes */
function placeGround() {
  const rows = [[], []], font = `600 12.5px ${FT}`, out = [];
  const list = ORDER.filter(o => !o.obs);
  const first = [S.sel, S.focal, S.hover].filter(o => o && !o.obs);
  for (const o of [...new Set([...first, ...list])]) {
    const x = X(o.lg); if (x < -120 || x > S.W + 120) continue;
    const w = tw(o.n, font) + 14, x0 = x - w / 2, x1 = x + w / 2; let row = -1;
    for (const r of S.rows === 1 ? [0] : [1, 0]) {
      const other = rows[1 - r];
      if (rows[r].some(q => x0 < q.x1 && x1 > q.x0)) continue;
      if (r === 1 ? other.some(q => q.x > x0 && q.x < x1) : other.some(q => x > q.x0 && x < q.x1)) continue;
      row = r; break;
    }
    if (row < 0) { out.push({ o, x, row: -1 }); continue; }
    rows[row].push({ x0, x1, x }); out.push({ o, x, row, w });
  }
  return out;
}

function draw(t) {
  const { W, yTop, y500, yGround, yDial, strip } = S;
  ctx.clearRect(0, 0, W, S.H); S.hits = []; S.bars = [];
  const time = reduced ? 0 : t / 1000;

  /* cielo: estrellas arriba, velo de aire abajo */
  for (const s of stars) { const y = yTop - 30 + s[1] * (yGround - yTop); ctx.globalAlpha = s[3] * clamp((yOf(40) - y) / (yOf(40) - y500), 0, 1); ctx.fillStyle = '#fff'; ctx.fillRect(s[0], y, s[2], s[2]); }
  ctx.globalAlpha = 1;
  const haze = ctx.createLinearGradient(0, yOf(60), 0, yGround); haze.addColorStop(0, 'rgba(95,179,255,0)'); haze.addColorStop(1, 'rgba(95,179,255,.11)');
  ctx.fillStyle = haze; ctx.fillRect(0, yOf(60), W, yGround - yOf(60));

  /* luz que entra: una franja por columna hasta la altitud a la que se queda */
  const step = 3, n = Math.ceil(W / step) + 1, ys = new Float32Array(n), cols = new Array(n), hw = step / 2 / S.ppd, top = yTop - 8;
  for (let i = 0; i < n; i++) {
    const x = i * step, l = Linv(x);
    if (l < F0 || l > F1) { ys[i] = -1; continue; }
    const c = colorOf(l), y = yOf(altBand(l, hw)); ys[i] = y; cols[i] = c;
    ctx.fillStyle = rgb(c, .12); ctx.fillRect(x - step / 2, top, step, y - top);
    ctx.fillStyle = rgb(c, 1); ctx.fillRect(x - step / 2, yDial, step + .5, strip);
  }
  /* lluvia */
  const gap = S.mob ? 15 : 18, period = yGround - top + 50, speed = 85;
  for (let k = 0, x = gap / 2; x < W; k++, x += gap) {
    const i = Math.round(x / step); if (ys[i] < 0) continue;
    const ys0 = ys[i], c = cols[i];
    for (let j = 0; j < 3; j++) {
      const y = top + ((time * speed * (.8 + .4 * hash(k * 3 + 1)) + hash(k * 7 + j * 13) * period) % period), len = Math.min(16, ys0 - y);
      if (len <= 1) continue;
      ctx.fillStyle = rgb(c, .2 + .65 * clamp((ys0 - y) / 60, 0, 1)); ctx.fillRect(x - .8, y, 1.6, len);
    }
    ctx.fillStyle = rgb(c, .75); ctx.beginPath(); ctx.arc(x, ys0, 1.7, 0, TAU); ctx.fill();
  }
  /* el borde superior de la luz se funde para no cortar en seco bajo la cabecera */
  ctx.globalCompositeOperation = 'destination-out';
  const fade = ctx.createLinearGradient(0, top, 0, top + 20); fade.addColorStop(0, 'rgba(0,0,0,1)'); fade.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = fade; ctx.fillRect(0, top - 2, W, 22); ctx.globalCompositeOperation = 'source-over';
  /* perfil */
  ctx.beginPath(); let pen = false;
  for (let i = 0; i < n; i++) { if (ys[i] < 0) { pen = false; continue; } if (pen) ctx.lineTo(i * step, ys[i]); else { ctx.moveTo(i * step, ys[i]); pen = true; } }
  ctx.strokeStyle = 'rgba(238,240,255,.5)'; ctx.lineWidth = 1.2; ctx.stroke();

  /* eje de altitud */
  ctx.font = `500 11.5px ${FT}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  const arrowH = S.mob ? 37 : 42, arrowX = S.mob ? 46 : 64;      // la flecha izquierda (DOM) tapa una franja a media altura
  ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(0, y500, W, 1);
  ctx.fillStyle = 'rgba(153,162,204,.85)'; ctx.fillText('espacio', 10, y500 - 9);
  let lastY = y500 - 9;                                           // de arriba abajo; el rótulo que no cabe bajo el anterior se omite
  for (let i = ATMOS.marcas.length - 1; i >= 0; i--) {
    const [km, name] = ATMOS.marcas[i], y = yOf(km), ly = y - 8;
    ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(0, y, W, 1);
    if (ly - lastY < 13) continue; lastY = ly;
    ctx.fillStyle = 'rgba(153,162,204,.85)'; ctx.fillText(fmt(km) + ' km' + (name && !S.slim ? ' · ' + name : ''), Math.abs(ly - S.H / 2) < arrowH ? arrowX : 10, ly);
  }

  /* suelo */
  ctx.fillStyle = '#080c22'; ctx.fillRect(0, yGround, W, yDial - yGround);
  ctx.fillStyle = 'rgba(238,240,255,.35)'; ctx.fillRect(0, yGround, W, 1);

  /* observatorios, en tres pasadas (barras, dibujos, rótulos) para que ningún dibujo tape un nombre */
  const fo = `600 12.5px ${FT}`, sky = [];
  for (const o of SKY) {
    const x0 = X(o.l0), x1 = X(o.l1); if (x1 < -60 || x0 > W + 60) continue;
    const space = o.alt === 'esp', base = space ? yTop + (S.low ? 16 : 22) : yOf(o.alt);
    const lo = Math.max(x0 + 10, 26), hi = Math.min(x1 - 10, W - 26), gx = lo <= hi ? clamp(X(o.lg), lo, hi) : X(o.lg);
    sky.push({ o, x0, x1, base, gx, space, by: space || o.alt >= 3 ? base + 6 : base - 30, on: o === S.sel || o === S.hover });
  }
  const ends = [-1e9, -1e9];       // los satélites comparten altura: dos carriles para que sus barras no se pisen
  for (const v of sky.filter(v => v.space && v.o.rng).sort((a, b) => a.x0 - b.x0)) { const k = v.x0 > ends[0] + 6 ? 0 : v.x0 > ends[1] + 6 ? 1 : 0; ends[k] = Math.max(ends[k], v.x1); v.by += 7 * k; }
  for (const { o, x0, x1, by, on } of sky) {
    if (!o.rng) continue;
    ctx.globalAlpha = on ? 1 : .55; ctx.fillStyle = o.col; ctx.fillRect(x0, by, x1 - x0, on ? 3 : 2); ctx.fillRect(x0, by - 3, 1.5, 8); ctx.fillRect(x1 - 1.5, by - 3, 1.5, 8); ctx.globalAlpha = 1;
    S.bars.push({ o, x0, y0: by - 6, x1, y1: by + 8 });
  }
  for (const { o, gx, base, on } of sky) { glyph(o.g, gx, base, on ? '#fff' : o.col, on); S.hits.push({ o, x0: gx - 18, y0: base - 28, x1: gx + 18, y1: base + 8 }); }
  const placedSky = []; ctx.font = fo; ctx.textAlign = 'left';
  for (const v of sky.slice().sort((a, b) => b.on - a.on || a.o.p - b.o.p || a.o.lg - b.o.lg)) {   // los más importantes eligen sitio primero
    const w = tw(v.o.n, fo), ly = v.base - 12;
    for (const lx of [v.gx + 20, v.gx - 20 - w]) {              // a la derecha del dibujo y, si no cabe, a la izquierda
      const box = { x0: lx - 4, x1: lx + w + 4, y0: ly - 9, y1: ly + 9 };
      if (box.x0 < 4 || box.x1 > W - 4) continue;
      if (placedSky.some(q => box.x0 < q.x1 && box.x1 > q.x0 && box.y0 < q.y1 && box.y1 > q.y0)) continue;
      if (sky.some(u => u !== v && box.x0 < u.gx + 18 && box.x1 > u.gx - 18 && box.y0 < u.base + 3 && box.y1 > u.base - 16)) continue;
      placedSky.push(box); ctx.font = fo;
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(5,8,26,.8)'; ctx.strokeText(v.o.n, lx, ly);
      ctx.fillStyle = v.on ? '#fff' : 'rgba(238,240,255,.86)'; ctx.fillText(v.o.n, lx, ly);
      S.hits.push({ o: v.o, x0: box.x0, y0: box.y0, x1: box.x1, y1: box.y1 }); break;
    }
  }

  /* objetos del suelo */
  const fg = `600 12.5px ${FT}`; ctx.font = fg; ctx.textAlign = 'center';
  for (const p of placeGround().reverse()) {     // de menor a mayor prioridad: lo importante queda encima y gana el clic
    const { o, x } = p, on = o === S.sel || o === S.hover || o === S.focal;
    if (o.rng) { const a = X(o.l0), b = X(o.l1); ctx.globalAlpha = on ? 1 : .5; ctx.fillStyle = o.col; ctx.fillRect(a, yDial - (on ? 5 : 4), Math.max(b - a, 2), on ? 4 : 3); ctx.globalAlpha = 1; S.bars.push({ o, x0: a, y0: yDial - 10, x1: b, y1: yDial + 2 }); }
    ctx.fillStyle = o.col; ctx.beginPath(); ctx.arc(x, yDial - 2, on ? 4.5 : 3, 0, TAU); ctx.fill();
    if (on) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); }
    S.hits.push({ o, x0: x - 9, y0: yDial - 11, x1: x + 9, y1: yDial + strip });
    if (p.row < 0) continue;
    const ly = yGround + 14 + p.row * 20;
    ctx.fillStyle = rgb([238, 240, 255], on ? .5 : .16); ctx.fillRect(x - .5, ly + 8, 1, yDial - 5 - ly - 8);
    ctx.font = fg; ctx.fillStyle = on ? '#fff' : 'rgba(238,240,255,.82)'; ctx.fillText(o.n, x, ly);
    S.hits.push({ o, x0: x - p.w / 2, y0: ly - 10, x1: x + p.w / 2, y1: ly + 10 });
  }

  /* dial: nombres de banda, marcas y doble escala */
  ctx.font = `700 11.5px ${FT}`; ctx.textAlign = 'center';
  for (const b of BANDS) {
    const a = Math.max(X(b.l0), 0), z = Math.min(X(b.l1), W), w = tw(b.n, ctx.font);
    if (z - a > w + 14) { ctx.fillStyle = 'rgba(4,8,24,.9)'; ctx.fillText(b.n, (a + z) / 2, yDial + strip / 2 + .5); }
  }
  const every = S.ppd < 42 ? 3 : S.ppd < 88 ? 2 : 1, yT = yDial + strip;
  const tick = (l, major, label) => {
    const x = X(l); if (x < -40 || x > W + 40) return;
    ctx.fillStyle = major ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.22)'; ctx.fillRect(x, yT, 1, major ? 6 : 3);
    if (!label) return; const f = 10 ** l;
    ctx.font = `500 11.5px ${FT}`; ctx.fillStyle = 'rgba(238,240,255,.78)'; ctx.fillText(fmtFreq(f, 2), x, yT + 14);
    if (!S.slim) { ctx.font = `400 10.5px ${FT}`; ctx.fillStyle = 'rgba(153,162,204,.8)'; ctx.fillText(fmtLen(C / f, 2), x, yT + 27); }
  };
  for (let e = Math.floor(Linv(-40)); e <= Math.ceil(Linv(W + 40)); e++) {
    if (e < F0 || e > F1) continue;
    tick(e, true, e % every === 0);
    if (S.ppd >= 240 && e < F1) for (let k = 2; k <= 9; k++) tick(e + log10(k), false, S.ppd >= 520 ? (k === 2 || k === 5 || (S.ppd >= 1100 && k < 8)) : false);
  }

  /* aguja y lo que pasa justo ahí */
  const cx = W / 2, f = 10 ** S.c, lam = C / f, km = atmAlt(LGC - S.c), cause = atmCause(lam), yS = yOf(km);
  ctx.fillStyle = 'rgba(255,255,255,.34)'; ctx.fillRect(cx - .5, yTop - 6, 1, yDial + strip - yTop + 6);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(cx - 6, yDial + strip + 9); ctx.lineTo(cx + 6, yDial + strip + 9); ctx.lineTo(cx, yDial + strip + 1); ctx.fill();
  ctx.beginPath(); ctx.arc(cx, yS, 4.5, 0, TAU); ctx.fillStyle = rgb(colorOf(S.c), 1); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
  const txt = km < .5 ? 'llega al suelo' + (cause.fin === 'suelo' ? ' · ' + cause.n : '') : cause.fin === 'rebote' ? (km < 280 ? 'según la hora, rebota en ' : 'rebota en ') + cause.n : (km >= ATMOS.techo ? 'no pasa de' : 'se queda a unos') + ` ${fmtKm(km)} km · ${cause.n}`;
  ctx.font = `600 12.5px ${FT}`; const wt = tw(txt, ctx.font) + 20;
  let bx = S.mob ? cx - wt / 2 : cx + 12, byy = clamp(yS - (S.mob ? 34 : 13), yTop + 2, yGround - 30);
  bx = clamp(bx, 6, W - wt - 6);
  ctx.fillStyle = 'rgba(8,12,34,.92)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, byy, wt, 26, 13) : ctx.rect(bx, byy, wt, 26); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#eef0ff'; ctx.textAlign = 'left'; ctx.fillText(txt, bx + 10, byy + 13.5);
}

/* ---------- HUD ---------- */
function updateHud() {
  const f = 10 ** S.c, lam = C / f, bi = bandOf(f);
  $('#sc-big').textContent = fmtFreq(f);
  $('#sc-lam').textContent = 'Onda de ' + fmtLen(lam); $('#sc-like').textContent = ' · ' + sizeLike(lam);
  $('#sc-ev').textContent = fmtEnergy(evOf(f)) + ' por fotón';
  if (bi !== S.band) {
    S.band = bi; const B = BANDS[bi];
    $('#realm-name').textContent = B.n; $('#realm-sub').textContent = B.sub;
    const wm = $('#wm'); wm.textContent = B.n; wm.classList.remove('in'); void wm.offsetWidth; wm.classList.add('in');
    document.documentElement.style.setProperty('--tint', B.col);
  }
  let near = null, nd = 7; for (const o of ALL) { const d = Math.abs(X(o.lg) - S.W / 2); if (d < nd) { nd = d; near = o; } }
  S.focal = near;
  $('#prev').disabled = S.tc <= ALL[0].lg + 1e-6; $('#next').disabled = S.tc >= ALL[ALL.length - 1].lg - 1e-6;
}

/* ---------- bucle ---------- */
function frame(t) {
  const dt = Math.min(.05, (t - S.lastT) / 1000 || 0); S.lastT = t;
  if (S.tour && t >= S.hold) { if (S.ti >= TOUR.length) stopTour(); else { const o = byId[TOUR[S.ti++]]; select(o, true, true); S.hold = t + clamp(3000 + 55 * o.d.length, 7000, 15000); } }   // pausa según lo que haya que leer
  const k = reduced ? 1 : 1 - Math.exp(-dt * 9), dc = S.tc - S.c, dp = Math.log(S.tppd / S.ppd);
  if (Math.abs(dc) > 1e-5 || Math.abs(dp) > 1e-4) { S.c += dc * k; S.ppd *= Math.exp(dp * k); S.dirty = true; }
  else if (S.c !== S.tc || S.ppd !== S.tppd) { S.c = S.tc; S.ppd = S.tppd; S.dirty = true; }
  if (S.dirty) {
    updateHud();
    if (t > S.saveAt) { S.saveAt = t + 800; try { localStorage.setItem('es:vista', S.tc.toFixed(4) + ',' + S.tppd.toFixed(1)); } catch (e) {} }
  }
  if (S.dirty || !reduced) draw(t);
  S.dirty = false;
  requestAnimationFrame(frame);
}

/* ---------- navegación ---------- */
const setC = (l, now) => { S.tc = clamp(l, F0, F1); if (now) S.c = S.tc; S.dirty = true; };
const setP = p => { S.tppd = clamp(p, S.pmin, S.pmax); S.dirty = true; };
function goTo(o) {
  setC(o.lg);
  if (o.rng && (o.l1 - o.l0) * S.tppd > S.W * .8) setP(S.W * .6 / (o.l1 - o.l0));
}
function step(dir) {
  stopTour(); let k = -1;
  if (dir > 0) k = ALL.findIndex(o => o.lg > S.tc + 1e-6); else for (let i = ALL.length - 1; i >= 0; i--) if (ALL[i].lg < S.tc - 1e-6) { k = i; break; }
  if (k < 0) return;
  if (S.mob) { closePanel(); setC(ALL[k].lg); say(ALL[k]); } else select(ALL[k], true, true);
}
function startTour() { S.tour = true; S.ti = 0; S.hold = 0; $('#b-tour').setAttribute('aria-pressed', 'true'); $('#i-play').style.display = 'none'; $('#i-pause').style.display = ''; }
function stopTour() { if (!S.tour) return; S.tour = false; $('#b-tour').setAttribute('aria-pressed', 'false'); $('#i-play').style.display = ''; $('#i-pause').style.display = 'none'; }
const toggleTour = () => S.tour ? stopTour() : startTour();

const freqOf = o => o.rng ? fmtRange(o.lo, o.hi, fmtFreq, o.sig) : fmtFreq(o.lo, o.sig);
function say(o) { $('#live').textContent = `${o.n}, ${freqOf(o)}. ${atmText(o)}`; }

/* ---------- ficha ---------- */
const panel = $('#panel');
function select(o, go, keepTour) {
  if (!keepTour) stopTour();
  S.sel = o; renderPanel(o); panel.classList.add('open'); panel.scrollTop = 0; S.dirty = true;
  if (go) goTo(o);
  try { history.replaceState(null, '', '#' + o.id); } catch (e) {}
}
function closePanel() { panel.classList.remove('open'); S.sel = null; S.dirty = true; try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} }
function atmText(o) {
  if (o.obs) return o.alt === 'esp' ? 'Está en el espacio, por encima de toda la atmósfera.' : o.alt >= 10 ? `Trabaja a unos ${fmt(o.alt)} kilómetros de altitud.` : `Está a ${fmt(o.alt * 1000, 4)} metros de altitud.`;
  const f = 10 ** o.lg, km = atmAlt(LGC - o.lg), c = atmCause(C / f);
  const head = km < .5 ? 'Atraviesa la atmósfera' : c.fin === 'rebote' ? 'No atraviesa la atmósfera' : `Desde el espacio se queda a unos ${fmtKm(km)} km de altura`;
  return `${head}. ${c.d}`;
}
function renderPanel(o) {
  const c = colorOf(o.lg);
  /* tantas ondas como el número de orden de la banda: de una en la radio a siete en los rayos gamma */
  const cyc = bandOf(10 ** o.lg) + 1, pts = [];
  for (let i = 0; i <= 96; i++) pts.push(`${(8 + i * 56 / 96).toFixed(1)} ${(36 - 13 * Math.sin(i / 96 * cyc * TAU)).toFixed(1)}`);
  $('#p-ico').innerHTML = `<svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="34" fill="${rgb(c, .16)}" stroke="${rgb(c, .7)}" stroke-width="1.5"/><path d="M${pts.join('L')}" fill="none" stroke="${rgb(c, 1)}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  $('#p-name').textContent = o.n;
  const chip = $('#p-cat'); chip.textContent = CATS[o.c].n; chip.style.setProperty('--c', o.col);
  $('#p-size').textContent = freqOf(o);
  const sg = o.sig && Math.min(o.sig, 5);      // las magnitudes derivadas, con cinco cifras como mucho
  $('#p-lam').textContent = 'Longitud de onda: ' + (o.rng ? fmtRange(C / o.hi, C / o.lo, fmtLen, sg) : fmtLen(C / o.lo, sg));
  $('#p-ev').textContent = 'Energía de cada fotón: ' + (o.rng ? fmtRange(evOf(o.lo), evOf(o.hi), fmtEnergy, sg) : fmtEnergy(evOf(o.lo), sg));
  const z = CERT[o.z]; $('#p-cert').innerHTML = `<b>${esc(z.n)}</b> ${esc(z.d)}`;
  $('#p-desc').textContent = o.d;
  $('#p-atm').textContent = atmText(o);
  const like = $('#p-like'); like.hidden = o.obs; like.textContent = (o.rng ? 'Tamaño de la onda hacia la mitad del intervalo: ' : 'Tamaño de la onda: ') + sizeLike(C / 10 ** o.lg) + '.';
}

/* ---------- entrada ---------- */
function hitAt(x, y) {
  for (let i = S.hits.length - 1; i >= 0; i--) { const h = S.hits[i]; if (x >= h.x0 && x <= h.x1 && y >= h.y0 && y <= h.y1) return h.o; }
  let best = null;                 // si no hay punto ni rótulo, la barra de intervalo más estrecha que pase por ahí
  for (const h of S.bars) if (x >= h.x0 && x <= h.x1 && y >= h.y0 && y <= h.y1 && (!best || h.x1 - h.x0 < best.x1 - best.x0)) best = h;
  return best && best.o;
}
addEventListener('wheel', e => {
  if (e.target.closest('#panel, dialog')) return;
  e.preventDefault(); stopTour(); hideHint();
  let d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY; if (e.deltaMode === 1) d *= 16; else if (e.deltaMode === 2) d *= S.H;
  if (e.ctrlKey || e.metaKey) setP(S.tppd * Math.exp(-clamp(d, -80, 80) * .012));
  else setC(S.tc + clamp(d, -160, 160) * 1.1 / S.ppd);
}, { passive: false });

const P = new Map(); let pinchD = 0, startX = 0, startY = 0, downT = 0;
const pdist = () => { const v = [...P.values()]; return Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y); };
const tip = $('#tip');
function showTip(o, x, y) { tip.innerHTML = `<b>${esc(o.n)}</b><span>${freqOf(o)}</span>`; tip.style.left = x + 'px'; tip.style.top = y + 'px'; tip.style.opacity = 1; }
function hideTip() { tip.style.opacity = 0; }
stage.addEventListener('pointerdown', e => {
  if (e.button > 0) return; stage.setPointerCapture(e.pointerId);
  P.set(e.pointerId, { x: e.clientX, y: e.clientY }); S.moved = false; startX = e.clientX; startY = e.clientY; downT = performance.now();
  if (P.size === 2) pinchD = pdist(); stage.classList.add('drag'); stopTour(); hideHint(); hideTip();
});
stage.addEventListener('pointermove', e => {
  const p = P.get(e.pointerId);
  if (!p) {
    if (e.pointerType !== 'touch') { const h = hitAt(e.clientX, e.clientY); if (h !== S.hover) { S.hover = h; stage.style.cursor = h ? 'pointer' : ''; S.dirty = true; } if (h) showTip(h, e.clientX, e.clientY - 12); else hideTip(); }
    return;
  }
  const dx = e.clientX - p.x; p.x = e.clientX; p.y = e.clientY;
  if (P.size === 2) { const nd = pdist(); if (pinchD > 0 && nd > 0) { setP(S.tppd * nd / pinchD); S.ppd = S.tppd; } pinchD = nd; }
  else setC(S.tc - dx / S.ppd, true);
  if (Math.hypot(e.clientX - startX, e.clientY - startY) > 6) S.moved = true;
});
function pointerEnd(e) {
  if (!P.has(e.pointerId)) return; P.delete(e.pointerId); if (P.size < 2) pinchD = 0;
  if (!P.size) stage.classList.remove('drag');
  if (e.type === 'pointerup' && !S.moved && performance.now() - downT < 600) {
    const o = hitAt(e.clientX, e.clientY);
    if (o) select(o, true);
    else if (e.clientY >= S.yDial - 4 && e.clientY <= S.yDial + S.strip + 30) setC(Linv(e.clientX));
    else closePanel();
  }
}
stage.addEventListener('pointerup', pointerEnd); stage.addEventListener('pointercancel', pointerEnd);
stage.addEventListener('pointerleave', () => { hideTip(); if (S.hover) { S.hover = null; S.dirty = true; } });

addEventListener('keydown', e => {
  const tag = (e.target.tagName || '').toLowerCase();
  if (e.key === 'Escape') { for (const d of document.querySelectorAll('dialog[open]')) d.close(); closePanel(); stopTour(); return; }
  if (tag === 'input' || tag === 'select' || tag === 'textarea' || document.querySelector('dialog[open]')) return;
  if ((e.key === ' ' || e.key === 'Enter') && tag === 'button') return;
  const k = e.key;
  if (k === 'ArrowRight' && e.shiftKey) { stopTour(); setC(S.tc + 60 / S.ppd); }
  else if (k === 'ArrowLeft' && e.shiftKey) { stopTour(); setC(S.tc - 60 / S.ppd); }
  else if (k === 'ArrowRight' || k === 'PageDown') step(1);
  else if (k === 'ArrowLeft' || k === 'PageUp') step(-1);
  else if (k === 'ArrowUp' || k === '+' || k === '=') setP(S.tppd * 1.4);
  else if (k === 'ArrowDown' || k === '-' || k === '_') setP(S.tppd / 1.4);
  else if (k === 'Home') { stopTour(); setC(F0); }
  else if (k === 'End') { stopTour(); setC(F1); }
  else if (k === '0') { setP(S.pmin); setC((F0 + F1) / 2); }
  else if (k === 'Enter') { if (!S.focal) return; select(S.focal, true); }
  else if (k === ' ') toggleTour();
  else if (k === '/' || k === 'b') openSearch();
  else if (k === 'r') randomJump();
  else if (k === '?' || k === 'h') $('#d-help').showModal();
  else return;
  e.preventDefault(); hideHint();
});

$('#prev').addEventListener('click', () => step(-1));
$('#next').addEventListener('click', () => step(1));
$('#zin').addEventListener('click', () => setP(S.tppd * 1.5));
$('#zout').addEventListener('click', () => setP(S.tppd / 1.5));
$('#b-tour').addEventListener('click', toggleTour);
$('#b-random').addEventListener('click', randomJump);
$('#b-search').addEventListener('click', openSearch);
$('#b-help').addEventListener('click', () => $('#d-help').showModal());
$('#p-close').addEventListener('click', closePanel);
$('#p-center').addEventListener('click', () => { if (S.sel) goTo(S.sel); });
for (const b of document.querySelectorAll('dialog .x')) b.addEventListener('click', () => b.closest('dialog').close());
for (const d of document.querySelectorAll('dialog')) d.addEventListener('click', e => { if (e.target === d) d.close(); });
function randomJump() { select(ALL[Math.floor(Math.random() * ALL.length)], true); }

/* ---------- buscador ---------- */
const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const dSearch = $('#d-search'), qIn = $('#q'), resList = $('#res');
function openSearch() { stopTour(); dSearch.showModal(); qIn.value = ''; renderSearch(''); setTimeout(() => qIn.focus(), 30); }
function renderSearch(q) {
  const n = norm(q.trim());
  const hits = n ? ALL.filter(o => norm(o.n).includes(n) || norm(CATS[o.c].n).includes(n) || norm(BANDS[bandOf(10 ** o.lg)].n).includes(n) || norm(o.d).includes(n)) : ALL;
  resList.innerHTML = hits.length ? hits.map(o => `<button class="res" data-id="${o.id}"><span class="mi" style="background:${rgb(colorOf(o.lg), 1)}"></span><span class="rn">${esc(o.n)}</span><span class="rs">${freqOf(o)}</span></button>`).join('') : '<p>No hay ninguna ficha con ese texto. Borra la búsqueda para ver la lista completa.</p>';
}
qIn.addEventListener('input', () => renderSearch(qIn.value));
qIn.addEventListener('keydown', e => { if (e.key === 'Enter') { const first = $('.res', resList); if (first) first.click(); e.preventDefault(); } });
resList.addEventListener('click', e => { const b = e.target.closest('.res'); if (!b) return; dSearch.close(); select(byId[b.dataset.id], true); });

/* ---------- pista inicial ---------- */
const hint = $('#hint'); let hintOff = false;
function hideHint() { if (hintOff) return; hintOff = true; hint.classList.add('off'); setTimeout(() => hint.remove(), 800); }
setTimeout(hideHint, 9000);
if (location.hash.length > 1) hideHint();

/* ---------- arranque ---------- */
addEventListener('resize', measure);
addEventListener('hashchange', () => { const o = byId[location.hash.slice(1)]; if (o) select(o, true); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { wCache.clear(); S.dirty = true; });
measure();
(function start() {
  S.ppd = S.tppd = clamp(S.mob ? 62 : 118, S.pmin, S.pmax);
  const o = byId[location.hash.slice(1)];
  if (o) { S.c = S.tc = o.lg; select(o, true); S.ppd = S.tppd; return; }
  let v = null; try { v = localStorage.getItem('es:vista'); } catch (e) {}
  const m = v && v.split(',').map(Number);
  if (m && m.length === 2 && isFinite(m[0]) && isFinite(m[1])) { S.c = S.tc = clamp(m[0], F0, F1); S.ppd = S.tppd = clamp(m[1], S.pmin, S.pmax); }
})();
requestAnimationFrame(frame);
})();
