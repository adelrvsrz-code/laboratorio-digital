/* Comprueba la integridad de «Órdenes de magnitud» sin navegador: catálogo, iconos, textos de cada idioma y plantilla.
   Uso: node escalas-check.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
const { loadTexts } = require('../base/base-build.js');
const here = __dirname, read = f => fs.readFileSync(path.join(here, f), 'utf8');
let bad = 0; const fail = (...a) => { console.log('ERROR:', ...a); bad++; };
const same = (a, b) => a.length === b.length && a.every(x => b.includes(x));

/* 1. catálogo, reinos e iconos */
const ctx = {}; vm.createContext(ctx);
vm.runInContext(read('escalas-data.js') + '\n' + read('escalas-icons.js') + '\nthis.OBJECTS=OBJECTS;this.CATS=CATS;this.REALMS=REALMS;this.ICON=ICON;', ctx);
const { OBJECTS, CATS, REALMS, ICON } = ctx;
const sorted = OBJECTS.slice().sort((a, b) => a.s - b.s);
const ids = new Set();
for (const o of OBJECTS) {
  if (ids.has(o.id)) fail('id repetido:', o.id); ids.add(o.id);
  if (!/^[a-z0-9-]+$/.test(o.id)) fail('id con caracteres no válidos (usa minúsculas, dígitos y guiones):', o.id);
  if (!CATS[o.c]) fail('categoría desconocida en', o.id);
  if (!(o.s > 0) || !isFinite(o.s)) fail('tamaño no válido en', o.id);
  if (!ICON.names.includes(o.i[0])) fail('icono inexistente', o.i[0], 'en', o.id);
  for (const k of ['n', 'sub', 'd']) if (k in o) fail('texto dentro del catálogo:', o.id + '.' + k, '(va en escalas-textos.<idioma>.js)');
}
for (let i = 1; i < sorted.length; i++) if (sorted[i].s / sorted[i - 1].s < 1.03) console.log('aviso: tamaños casi iguales,', sorted[i - 1].id, 'y', sorted[i].id);
const realmIds = REALMS.map(r => r[1]);
REALMS.forEach((r, i) => {
  if (i && !(r[0] > REALMS[i - 1][0])) fail('los reinos deben ir de menor a mayor:', r[1]);
  if (realmIds.indexOf(r[1]) !== i) fail('reino repetido:', r[1]);
  if (!/^#[0-9a-f]{6}$/.test(r[2])) fail('tinte no válido en el reino', r[1]);
});

/* 2. plantilla y lógica: qué textos piden */
const tpl = read('escalas-template.html'), app = read('escalas-app.js');
for (const m of ['CSS', 'BASE', 'TEXTOS', 'DATA', 'ICONS', 'APP']) if (tpl.split('{{' + m + '}}').length !== 2) fail('la plantilla debe tener una vez el marcador', m);
if (!tpl.includes('<html lang="{{LANG}}">')) fail('la plantilla debe declarar el idioma con el marcador LANG');
const uiTpl = [...new Set([...tpl.matchAll(/\{\{t:([^{}]*)\}\}/g)].map(m => m[1]))];
const uiApp = [...new Set([...app.matchAll(/T\.ui\[['"]([^'"]+)['"]\]/g)].map(m => m[1]))];
const fApp = [...new Set([...app.matchAll(/T\.f\.(\w+)/g)].map(m => m[1]))];

/* 3. textos: un archivo por idioma; el español es la referencia y los demás deben tener las mismas claves */
const base = {}; vm.createContext(base);
vm.runInContext(fs.readFileSync(path.join(here, '..', 'base', 'base-fmt.js'), 'utf8') + '\nthis.BASEFMT = BASEFMT;', base);
const langs = fs.readdirSync(here).map(f => (f.match(/^escalas-textos\.([a-z]{2})\.js$/) || [])[1]).filter(Boolean).sort((a, b) => (b === 'es') - (a === 'es') || a.localeCompare(b));
if (langs[0] !== 'es') fail('falta escalas-textos.es.js');
const texts = {}, summary = [];
for (const lang of langs) {
  const file = 'escalas-textos.' + lang + '.js', T = texts[lang] = loadTexts(path.join(here, file)), ref = texts.es;
  const err = (...a) => fail(file + ':', ...a);
  if (T.lang !== lang) err('declara el idioma', T.lang);
  if (!base.BASEFMT.REG[lang]) err('base-fmt.js no tiene configuración regional para', lang);
  const str = (v, what, min = 1) => { if (typeof v !== 'string' || v.trim().length < min) err(what, min > 1 ? 'falta o es demasiado corto' : 'falta'); else if (v !== v.trim() || / {2}/.test(v)) err(what, 'tiene espacios de más'); };
  for (const [k, v] of Object.entries(T.ui)) str(v, 'ui «' + k + '»');
  for (const [k, v] of Object.entries(T.f)) if (typeof v !== 'function') err('f.' + k, 'debe ser una función');
  for (const k of uiTpl) if (!(k in T.ui)) err('la plantilla pide el texto «' + k + '»');
  for (const k of uiApp) if (!(k in T.ui)) err('escalas-app.js pide el texto «' + k + '»');
  for (const k of fApp) if (!(k in T.f)) err('escalas-app.js pide la frase', k);
  for (const k of Object.keys(T.ui)) if (!uiTpl.includes(k) && !uiApp.includes(k)) console.log('aviso:', file, 'tiene un texto que nadie usa:', k);
  for (const k of Object.keys(T.f)) if (!fApp.includes(k)) console.log('aviso:', file, 'tiene una frase que nadie usa:', k);
  if (!same(Object.keys(T.cats), Object.keys(CATS))) err('cats no coincide con las categorías del catálogo');
  for (const [k, v] of Object.entries(T.cats)) str(v, 'cats.' + k);
  if (!same(Object.keys(T.realms), realmIds)) err('realms no coincide con los reinos del catálogo');
  for (const [k, v] of Object.entries(T.realms)) { if (!Array.isArray(v) || v.length !== 2) err('realms.' + k, 'debe ser [nombre, subtítulo]'); else { str(v[0], 'realms.' + k); str(v[1], 'realms.' + k); } }
  for (const o of OBJECTS) {
    const t = T.obj[o.id];
    if (!t) { err('falta el objeto', o.id); continue; }
    str(t.n, o.id + '.n'); str(t.sub, o.id + '.sub'); str(t.d, o.id + '.d (descripción)', 40);
    for (const k of Object.keys(t)) if (!['n', 'sub', 'd', 'lab'].includes(k)) err(o.id, 'tiene un campo desconocido:', k);
    if ('lab' in t) { str(t.lab, o.id + '.lab'); if (!ICON.make([o.i[0], Object.assign({}, o.i[1], { label: '§§' })]).includes('§§')) err(o.id, 'lleva lab y su icono no admite rótulo'); }
    const svg = ICON.make('lab' in t ? [o.i[0], Object.assign({}, o.i[1], { label: t.lab })] : o.i);
    if (!svg.startsWith('<svg') || !svg.endsWith('</svg>') || /NaN|undefined/.test(svg)) err('SVG defectuoso en', o.id);
  }
  for (const id of Object.keys(T.obj)) if (!ids.has(id)) err('objeto que no está en el catálogo:', id);
  if (ref && T !== ref) {
    if (!same(Object.keys(T.ui), Object.keys(ref.ui))) err('ui no tiene las mismas claves que el español:', Object.keys(ref.ui).filter(k => !(k in T.ui)).concat(Object.keys(T.ui).filter(k => !(k in ref.ui))).join(', '));
    if (!same(Object.keys(T.f), Object.keys(ref.f))) err('f no tiene las mismas frases que el español');
    for (const k of Object.keys(ref.f)) if (T.f[k] && T.f[k].length !== ref.f[k].length) err('f.' + k, 'no recibe los mismos datos que en español');
    for (const o of OBJECTS) if (T.obj[o.id] && ref.obj[o.id] && ('lab' in T.obj[o.id]) !== ('lab' in ref.obj[o.id])) err(o.id, 'lleva lab en un idioma y no en el otro');
  }
  summary.push(`${lang} (${Object.keys(T.ui).length} de interfaz, ${Object.keys(T.f).length} frases, ${Object.keys(T.obj).length} fichas)`);
}

const cats = {}; for (const o of OBJECTS) cats[o.c] = (cats[o.c] || 0) + 1;
console.log('objetos:', OBJECTS.length, cats);
console.log('textos:', summary.join(', '), bad ? `PROBLEMAS: ${bad}` : 'sin problemas');
process.exit(bad ? 1 : 0);
