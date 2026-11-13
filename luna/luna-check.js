/* Comprueba la integridad de «La misma Luna» sin navegador: archivos y plantilla, datos, mapa,
   y la astronomía propia contra la tabla de referencia luna-ref.json.
   Uso: node luna-check.js */
const fs = require('fs'), path = require('path');
const here = __dirname, read = f => fs.readFileSync(path.join(here, f), 'utf8');
let bad = 0; const fail = (...a) => { console.log('ERROR:', ...a); bad++; };

/* 1. archivos y marcadores */
const FILES = ['luna-template.html', 'luna-styles.css', 'luna-data.js', 'luna-mapa.js', 'luna-astro.js', 'luna-render.js', 'luna-app.js', 'luna-build.js', 'luna-ref.json', 'luna-NOTAS.md'];
for (const f of FILES) if (!fs.existsSync(path.join(here, f))) fail('falta el archivo', f);
if (bad) process.exit(1);
const tpl = read('luna-template.html');
for (const m of ['CSS', 'DATA', 'MAPA', 'ASTRO', 'RENDER', 'APP']) if (tpl.split('{{' + m + '}}').length !== 2) fail('la plantilla debe tener una vez el marcador', m);
const app = read('luna-app.js');
for (const id of new Set((app.match(/\$\('#[a-z][\w-]*'/g) || []).map(s => s.slice(4, -1)))) if (!tpl.includes('id="' + id + '"')) fail('luna-app.js usa #' + id + ' y la plantilla no lo tiene');

/* 2. datos */
const { CITIES, MOON, PHASES, WINDS, TOUR, LAND, ASTRO, RENDER } = new Function(read('luna-data.js') + read('luna-mapa.js') + read('luna-astro.js') + read('luna-render.js') + '\nreturn { CITIES, MOON, PHASES, WINDS, TOUR, LAND, ASTRO, RENDER };')();
const ids = new Set(), RESERVED = /^(vs|t\d+|paso\d+|settings|sidebar|customize|upgrade|downloads|comment.*|[ns]\d+[ew]\d+)$/;
for (const c of CITIES) {
  if (ids.has(c.id)) fail('id de lugar repetido:', c.id); ids.add(c.id);
  if (!/^[a-z0-9]+$/.test(c.id) || RESERVED.test(c.id)) fail('id de lugar no válido (solo minúsculas y dígitos, sin palabras reservadas):', c.id);
  if (!c.n || !(Math.abs(c.lat) <= 89.5) || !(Math.abs(c.lon) <= 180)) fail('nombre o coordenadas no válidos en', c.id);
  try { new Intl.DateTimeFormat('es-ES', { timeZone: c.tz }).format(0); } catch (e) { fail('zona horaria desconocida en', c.id + ':', c.tz); }
}
for (const need of ['madrid', 'elcabo']) if (!ids.has(need)) fail('el recorrido necesita el lugar', need);
const arity = { seas: 4, floors: 4, spots: 4, rays: 7 };
for (const [k, n] of Object.entries(arity)) for (const f of MOON[k]) if (f.length !== n || f.some(v => !isFinite(v)) || Math.abs(f[0]) > 90 || Math.abs(f[1]) > 180 || !(f[2] > 0)) fail('entrada no válida en MOON.' + k + ':', JSON.stringify(f));
for (const l of MOON.labels) if (!l.n || Math.abs(l.lat) > 90 || Math.abs(l.lon) > 100) fail('rótulo lunar no válido:', JSON.stringify(l));
if (PHASES[PHASES.length - 1][0] !== 360 || PHASES.some((p, i) => i && p[0] <= PHASES[i - 1][0])) fail('PHASES debe ser creciente y acabar en 360');
if (WINDS.length !== 8) fail('WINDS debe tener ocho rumbos');
const actions = new Set((/const GO = \{([\s\S]*?)\n\};/.exec(app) || ['', ''])[1].match(/^\s{2}(\w+)\(\)/gm).map(s => s.trim().replace('()', '')));
for (const s of TOUR) { if (!s.t || !s.d || s.d.length < 80) fail('paso del recorrido sin título o con texto corto:', s.t); if (!actions.has(s.go)) fail('acción de recorrido inexistente:', s.go); }

/* 3. mapa */
const polys = RENDER.decodeLand(LAND); let pts = 0;
for (const p of polys) for (const r of p) { if (r.length < 6) fail('anillo con menos de tres puntos'); for (let i = 0; i < r.length; i += 2) { pts++; if (Math.abs(r[i]) > 180.001 || Math.abs(r[i + 1]) > 90.001) { fail('punto fuera de rango en el mapa'); break; } } }
const mask = RENDER.landMask(LAND, 720); let land = 0, tot = 0;
for (let j = 0; j < mask.h; j++) { const w = Math.cos((90 - (j + .5) / mask.h * 180) * Math.PI / 180); for (let i = 0; i < mask.w; i++) { tot += w; if (mask.data[j * mask.w + i]) land += w; } }
const landPct = land / tot * 100;
if (landPct < 27 || landPct > 31) fail('la fracción de tierra firme del mapa debería rondar el 29 %: sale', landPct.toFixed(1));

/* 4. astronomía frente a la referencia */
const ref = JSON.parse(read('luna-ref.json')), A = ASTRO, R2D = 180 / Math.PI;
const sep = (a, b, c, d) => Math.acos(Math.min(1, A.dot(A.vecOf(a, b), A.vecOf(c, d)))) * R2D, dang = (a, b) => Math.abs(A.n180(a - b));
const M = { moon: 0, sun: 0, altaz: 0, frac: 0, lib: 0, giro: 0, salida: 0, paso: 0, fase: 0 };
ref.muestras.forEach((s, i) => {
  const F = A.frame(s.ms), o = A.observe(F, s.lat, s.lon);
  M.moon = Math.max(M.moon, sep(F.sub.moon[0], F.sub.moon[1], s.subMoon[0], s.subMoon[1]) * 3600);
  M.sun = Math.max(M.sun, sep(F.sub.sun[0], F.sub.sun[1], s.subSun[0], s.subSun[1]) * 3600);
  M.altaz = Math.max(M.altaz, sep(o.alt, o.az, s.alt, s.az) * 3600);
  M.frac = Math.max(M.frac, Math.abs(F.frac - s.frac));
  M.lib = Math.max(M.lib, Math.abs(F.moon.lib[0] - s.lib[0]), dang(F.moon.lib[1], s.lib[1]));
  if (s.alt < 87) M.giro = Math.max(M.giro, dang(o.limb, s.limb), dang(o.north, s.north), dang(o.cnorth, s.cnorth));
  if (Math.abs(s.lat) < 62) {
    const ri = A.nextRise(s.lat, s.lon, s.ms), se = A.nextSet(s.lat, s.lon, s.ms), tr = A.nextTransit(s.lat, s.lon, s.ms);
    if (!!ri !== !!s.rise || !!se !== !!s.set) fail('salida o puesta que no coincide con la referencia en la muestra', i);
    if (ri && s.rise) M.salida = Math.max(M.salida, Math.abs(ri / 1000 - s.rise)); if (se && s.set) M.salida = Math.max(M.salida, Math.abs(se / 1000 - s.set));
    if (tr && s.transit) M.paso = Math.max(M.paso, Math.abs(tr / 1000 - s.transit));
  }
  if (i % 3 === 0) M.fase = Math.max(M.fase, Math.abs(A.phaseTime(s.ms, 180) / 1000 - s.full), Math.abs(A.phaseTime(s.ms, 0) / 1000 - s.newMoon));
});
/* tolerancias: son las cifras que se citan en la ayuda y en las notas */
const LIM = { moon: 15, sun: 60, altaz: 15, frac: .0005, lib: .1, giro: .1, salida: 90, paso: 20, fase: 120 };
for (const k of Object.keys(LIM)) if (!(M[k] <= LIM[k])) fail('error de ' + k + ' fuera de tolerancia:', M[k], '>', LIM[k]);

/* 5. el dibujo de la fase debe iluminar la misma fracción que da el cálculo */
const flat = { w: 2, h: 1, data: new Uint8Array([200, 200]) }; let dLit = 0;
for (const day of [2, 6, 10, 14, 19, 24]) {
  const F = A.frame(Date.UTC(2026, 10, 9 + day)), m = F.view.m, up = F.view.up;
  const d = RENDER.moonDisc(240, { right: A.cross(m, up), up, front: [-m[0], -m[1], -m[2]], xb: F.moon.xb, yb: F.moon.yb, zb: F.moon.pole, sun: F.toSun, shine: 0 }, flat);
  dLit = Math.max(dLit, Math.abs(d.lit - F.frac));
}
if (dLit > .004) fail('la fracción iluminada del dibujo se aparta de la calculada:', dLit);

const f1 = (x, d = 1) => x.toFixed(d).replace('.', ',');
console.log(`lugares: ${CITIES.length} · pasos del recorrido: ${TOUR.length} · casquetes lunares: ${MOON.seas.length} · costas: ${polys.length} polígonos, ${pts} puntos (${f1(landPct)} % de tierra)`);
console.log(`astronomía frente a ${ref.muestras.length} muestras de ${ref.fuente.split(' (')[0]}:`);
console.log(`  Luna ${f1(M.moon)}″ · Sol ${f1(M.sun)}″ · altura y rumbo ${f1(M.altaz)}″ · fracción iluminada ${f1(M.frac * 100, 3)} puntos · libración ${f1(M.lib, 3)}° · giro del disco ${f1(M.giro, 3)}°`);
console.log(`  salida y puesta ${f1(M.salida, 0)} s · paso por el meridiano ${f1(M.paso)} s · fases ${f1(M.fase, 0)} s · dibujo de la fase ${f1(dLit * 100, 2)} puntos`);
console.log(bad ? `PROBLEMAS: ${bad}` : 'sin problemas');
process.exit(bad ? 1 : 0);
