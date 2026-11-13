/* Comprueba el catálogo, las tablas y la física sin navegador.
   Uso: node espectro-check.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
const here = __dirname, read = f => fs.readFileSync(path.join(here, f), 'utf8');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(read('espectro-fis.js') + '\n' + read('espectro-data.js') + '\nthis.X={FIS,BANDS,ATMOS,CATS,CERT,ITEMS,SIZES,TOUR};', ctx);
const { FIS, BANDS, ATMOS, CATS, CERT, ITEMS, SIZES, TOUR } = ctx.X;
let bad = 0; const fail = (...a) => { console.log(...a); bad++; };
const near = (a, b, tol) => Math.abs(a / b - 1) <= tol;

/* física: valores de referencia conocidos */
if (!near(FIS.lamOf(1420.405751768e6), 0.211061, 1e-5)) fail('lamOf: la línea del hidrógeno no da 21,106 cm');
if (!near(FIS.evOf(FIS.nm(1239.841984)), 1, 1e-6)) fail('evOf: 1239,84 nm no da 1 eV');
if (!near(FIS.keV(511), 1.2356e20, 1e-3)) fail('keV: 511 keV no da 1,2356e20 Hz');
if (!near(FIS.wien(5772), 502e-9, 5e-3)) fail('wien: el Sol no da ~502 nm');

/* bandas: fronteras crecientes */
for (let i = 1; i < BANDS.length; i++) if (!(BANDS[i].hasta > BANDS[i - 1].hasta)) fail('bandas desordenadas en', BANDS[i].id);

/* atmósfera: perfil ordenado, dentro de límites, y ventanas donde deben estar */
const P = ATMOS.perfil;
for (let i = 0; i < P.length; i++) {
  if (i && !(P[i][0] > P[i - 1][0])) fail('perfil de atmósfera desordenado en', P[i][0]);
  if (!(P[i][1] >= 0 && P[i][1] <= ATMOS.techo)) fail('altitud fuera de rango en', P[i][0]);
}
for (let i = 1; i < ATMOS.causas.length; i++) if (!(ATMOS.causas[i].hasta > ATMOS.causas[i - 1].hasta)) fail('causas desordenadas');
const alt = lam => FIS.atmAlt(Math.log10(lam));
for (const [lam, name] of [[550e-9, 'visible'], [10e-6, 'ventana de 10 µm'], [0.21, '21 cm'], [3, 'FM']]) if (alt(lam) > .5) fail('debería llegar al suelo:', name);
for (const [lam, name] of [[1e-10, 'rayos X'], [250e-9, 'UV-C'], [15e-6, 'CO2'], [100e-6, 'infrarrojo lejano'], [300, 'onda media']]) if (alt(lam) < 4) fail('debería quedarse arriba:', name);
/* las causas marcadas como ventana deben llegar al suelo en todo su tramo, y la de rebote, quedarse arriba */
{
  let prev = P[0][0];
  for (const c of ATMOS.causas) {
    const top = Math.min(c.hasta, P[P.length - 1][0]); let max = 0, min = Infinity;
    for (let l = Math.log10(prev) + 1e-6; l < Math.log10(top) - 1e-6; l += .002) { const a = FIS.atmAlt(l); if (a > max) max = a; if (a < min) min = a; }
    if (c.fin === 'suelo' && max > .5) fail('la causa', c.n, 'se anuncia como ventana pero el perfil sube a', max.toFixed(1), 'km');
    if (c.fin === 'abs' && max < 1) fail('la causa', c.n, 'se anuncia como absorción pero el perfil no se levanta del suelo');
    prev = top;
  }
}
if (Math.abs(alt(121.567e-9) - 76) > 3) fail('Lyman-alfa debería quedarse hacia los 76 km y da', alt(121.567e-9));

/* tramo calculado del perfil (rayos X y gamma) contra el generador: NIST + atmósfera estándar */
{
  const { tauAlt } = require('./espectro-atm-gen.js'); let worst = 0, at = 0;
  for (let lgE = Math.log10(1.24e-3); lgE <= 9; lgE += .05) { const E = 10 ** lgE, d = Math.abs(alt(1.239841984e-12 / E) - tauAlt(E)); if (d > worst) { worst = d; at = E; } }
  console.log('perfil calculado: desviación máxima', worst.toFixed(2), 'km en', at.toExponential(2), 'MeV (tolerancia 2 km)');
  if (worst > 2) fail('el tramo calculado del perfil se aparta del generador');
}

/* color definido en todo el dial */
for (let l = 0; l <= 30; l += .05) { const c = FIS.colorOf(l); if (c.length !== 3 || c.some(v => !(v >= 0 && v <= 255))) { fail('color no válido en', l); break; } }

/* catálogo */
const ids = new Set(), cats = {};
for (const o of ITEMS) {
  if (ids.has(o.id)) fail('id repetido:', o.id); ids.add(o.id);
  if (!/^[a-z0-9-]+$/.test(o.id)) fail('id con caracteres no válidos:', o.id);
  if (!CATS[o.c]) fail('categoría desconocida en', o.id);
  if (!CERT[o.z]) fail('certeza desconocida en', o.id);
  if (![1, 2, 3].includes(o.p)) fail('prioridad no válida en', o.id);
  const fs_ = Array.isArray(o.f) ? o.f : [o.f];
  if (Array.isArray(o.f) && (o.f.length !== 2 || o.f[0] === o.f[1])) fail('intervalo no válido en', o.id);
  for (const f of fs_) if (!(f >= 1 && f <= 1e30)) fail('frecuencia fuera del dial en', o.id, f);
  if (!o.d || o.d.length < 40) fail('descripción demasiado corta en', o.id);
  if ((o.c === 'obs') !== (o.alt != null)) fail('los observatorios, y solo ellos, llevan alt:', o.id);
  if (o.alt != null && !(o.alt === 'esp' || (o.alt >= 0 && o.alt <= ATMOS.techo))) fail('altitud no válida en', o.id);
  if (o.alt != null && !['dish', 'dome', 'plane', 'balloon', 'sat', 'array'].includes(o.g)) fail('dibujo desconocido en', o.id);
  cats[o.c] = (cats[o.c] || 0) + 1;
}
for (const id of TOUR) if (!ids.has(id)) fail('el recorrido cita una ficha inexistente:', id);
for (let i = 1; i < SIZES.length; i++) if (!(SIZES[i][0] < SIZES[i - 1][0])) fail('SIZES debe ir de mayor a menor:', SIZES[i][1]);

/* coherencia entre fichas de observatorios en tierra y el perfil: avisos, no errores */
for (const o of ITEMS) if (typeof o.alt === 'number' && Array.isArray(o.f)) {
  const lo = Math.log10(Math.min(...o.f)), hi = Math.log10(Math.max(...o.f)); let ok = false;
  for (let l = lo; l <= hi; l += .01) if (FIS.atmAlt(FIS.LGC - l) <= o.alt + .5) { ok = true; break; }
  if (!ok && o.id !== 'magic') console.log('aviso: según el perfil,', o.id, 'no vería nada a', o.alt, 'km');
}
console.log('fichas:', ITEMS.length, JSON.stringify(cats), bad ? `PROBLEMAS: ${bad}` : 'sin problemas');
process.exit(bad ? 1 : 0);
