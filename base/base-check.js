/* Comprueba la base compartida sin navegador: los formateadores de base-fmt.js en cada idioma y el extractor de
   cifras de base-cifras.js.
   Uso: node base-check.js
   Cada caso lleva el resultado esperado en cada idioma, en el orden de LANGS. En esos textos, «_» representa
   el espacio fino de los miles (U+202F). Un idioma nuevo en base-fmt.js necesita su columna aquí. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'base-fmt.js'), 'utf8') + '\nthis.BASEFMT = BASEFMT;', ctx);
const { BASEFMT } = ctx, REG = BASEFMT.REG;
let bad = 0; const fail = (...a) => { console.log('ERROR:', ...a); bad++; };

const LANGS = ['es', 'en'];
const CASES = [
  /* escritura de números y redondeos */
  ['num', ['1234567.891'], '1_234_567,891', '1_234_567.891'],
  ['auto', [3474], '3_474', '3_474'],
  ['auto', [12.345], '12,3', '12.3'],
  ['auto', [1.2345], '1,23', '1.23'],
  ['auto', [0.012345], '0,0123', '0.0123'],
  ['auto', [1e-7], '10⁻⁷', '10⁻⁷'],
  ['fixed', [-1234.5, 1], '−1_234,5', '−1_234.5'],
  ['fixed', [-0.04, 1], '0,0', '0.0'],
  ['sig', [0.000123456, 3], '0,000123', '0.000123'],
  ['sig', [123456, 3], '123_000', '123_000'],
  ['sci', [3.5e8], '3,5 × 10⁸', '3.5 × 10⁸'],
  ['sci', [1e-7], '10⁻⁷', '10⁻⁷'],
  ['sci', [1.616e-35, 3], '1,62 × 10⁻³⁵', '1.62 × 10⁻³⁵'],
  /* longitudes, de la de Planck al universo observable */
  ['fmtLen', [1.616e-35], '1,6 × 10⁻³⁵ m', '1.6 × 10⁻³⁵ m'],
  ['fmtLen', [5e-4], '500 µm', '500 µm'],
  ['fmtLen', [1.7], '1,7 m', '1.7 m'],
  ['fmtLen', [3.474e6], '3_474 km', '3_474 km'],
  ['fmtLen', [1e9], '1 millón de km', '1 million km'],
  ['fmtLen', [1.3927e9], '1,39 millones de km', '1.39 million km'],
  ['fmtLen', [1.495978707e11], '1 UA', '1 AU'],
  ['fmtLen', [9.4607e15], '1 año luz', '1 light-year'],
  ['fmtLen', [3.99e16], '4,22 años luz', '4.22 light-years'],
  ['fmtLen', [2.4e22], '2,54 millones de años luz', '2.54 million light-years'],
  ['fmtLen', [9.4607e24], '1_000 millones de años luz', '1 billion light-years'],
  ['fmtLen', [8.8e26], '93_000 millones de años luz', '93 billion light-years'],
  /* duraciones */
  ['fmtTime', [5.39e-44], '5,4 × 10⁻⁴⁴ s', '5.4 × 10⁻⁴⁴ s'],
  ['fmtTime', [3.3e-9], '3,3 nanosegundos', '3.3 nanoseconds'],
  ['fmtTime', [1], '1 segundo', '1 second'],
  ['fmtTime', [499], '8,32 minutos', '8.32 minutes'],
  ['fmtTime', [7200], '2 horas', '2 hours'],
  ['fmtTime', [259200], '3 días', '3 days'],
  ['fmtTime', [31557600], '1 año', '1 year'],
  ['fmtTime', [31557600 * 2.5e6], '2,5 millones de años', '2.5 million years'],
  ['fmtTime', [31557600 * 1.38e10], '13_800 millones de años', '13.8 billion years'],
  /* escala larga en español, corta en inglés: la misma cantidad cambia de palabra. En español, con cifras,
     «2 500 millones» y no «2,5 mil millones»; ante palabra de escala, tres cifras significativas como mucho */
  ['fmtCount', [999999], '999_999', '999_999'],
  ['fmtCount', [1e6], '1 millón', '1 million'],
  ['fmtCount', [7.5e6], '7,5 millones', '7.5 million'],
  ['fmtCount', [999999.6], '1 millón', '1 million'],
  ['fmtCount', [1e9], '1_000 millones', '1 billion'],
  ['fmtCount', [2.5e9], '2_500 millones', '2.5 billion'],
  ['fmtCount', [1.3787e10], '13_800 millones', '13.8 billion'],
  ['fmtCount', [9.996e11], '1 billón', '1 trillion'],
  ['fmtCount', [5.4e12], '5,4 billones', '5.4 trillion'],
  ['fmtCount', [2e16], '20_000 billones', '20 quadrillion'],
  ['fmtCount', [1.20208e17], '120_000 billones', '120 quadrillion'],
  ['fmtCount', [7.5e18], '7,5 trillones', '7.5 quintillion'],
  ['fmtCount', [3e22], '30_000 trillones', '30 sextillion'],
  ['fmtCount', [6e25], '60 cuatrillones', '60 septillion'],
  ['fmtCount', [4e28], '40_000 cuatrillones', '40 octillion'],
  ['fmtCount', [5.4e61], '5,4·10⁶¹', '5.4·10⁶¹'],
  ['fmtTimes', [1], '1 vez', '1 time'],
  ['fmtTimes', [3.7], '3,7 veces', '3.7 times'],
  ['fmtTimes', [1e6], '1 millón de veces', '1 million times'],
  ['fmtTimes', [4.2e7], '42 millones de veces', '42 million times'],
  ['fmtTimes', [1.2e10], '12_000 millones de veces', '12 billion times'],
  ['fmtTimes', [5.4e61], '5,4·10⁶¹ veces', '5.4·10⁶¹ times'],
  /* cifras escritas a mano dentro de un texto: el espacio de los miles pasa a ser fino y sin salto; los años no se tocan */
  ['prose', ['En 2019. Con 6 500 millones, 1 350 y 100 000; año 1054 y 24 horas: 25 900.'], 'En 2019. Con 6_500 millones, 1_350 y 100_000; año 1054 y 24 horas: 25_900.', 'En 2019. Con 6_500 millones, 1_350 y 100_000; año 1054 y 24 horas: 25_900.'],
];

/* 1. la configuración regional de cada idioma está completa y tiene su columna de casos */
for (const lang of Object.keys(REG)) if (!LANGS.includes(lang)) fail('base-fmt.js tiene el idioma', lang, 'y base-check.js no tiene sus casos');
const ref = REG[LANGS[0]];
for (const lang of LANGS) {
  const L = REG[lang];
  if (!L) { fail('falta la configuración regional de', lang); continue; }
  for (const k of ['dec', 'mil', 'of']) if (typeof L[k] !== 'string' || !L[k]) fail(lang + ': falta', k);
  if (!Array.isArray(L.times) || L.times.length !== 2) fail(lang + ': times debe ser [singular, plural]');
  for (let i = 0; i < L.scale.length; i++) {
    const r = L.scale[i];
    if (r.length !== 3 || !(r[0] >= 1e6) || !r[1] || !r[2]) fail(lang + ': escalón de escala mal formado', JSON.stringify(r));
    if (i && !(r[0] < L.scale[i - 1][0])) fail(lang + ': la escala debe ir de mayor a menor');
  }
  if (L.scale[L.scale.length - 1][0] !== 1e6) fail(lang + ': la escala debe acabar en el millón');
  for (const u of Object.keys(ref.u)) if (!Array.isArray(L.u[u]) || L.u[u].length !== 2) fail(lang + ': falta la unidad', u);
  for (const u of Object.keys(L.u)) if (!ref.u[u]) fail(lang + ': unidad', u, 'que no existe en', LANGS[0]);
}

/* 2. casos */
for (const [fn, args, ...want] of CASES) LANGS.forEach((lang, i) => {
  if (typeof want[i] !== 'string') return fail('caso sin resultado esperado para', lang + ':', fn, args.join(', '));
  if (!REG[lang]) return;
  const got = BASEFMT(lang)[fn](...args), exp = want[i].replace(/_/g, '\u202F');
  if (got !== exp) fail(`${lang} ${fn}(${args.join(', ')}): sale «${got}» y se esperaba «${exp}»`);
});

/* 3. un idioma sin configuración debe fallar, no salir en otro idioma */
try { BASEFMT('xx'); fail('BASEFMT acepta un idioma sin configuración'); } catch (e) {}

/* 4. extractor de cifras (base-cifras.js): la misma cantidad, escrita en cada idioma, debe dar las mismas cifras */
const { figures, sameFigures } = require('./base-cifras.js');
const SAME = [
  ['13 800 millones de años', '13.8 billion years', [1.38e10]],
  ['unos 20 000 billones de hormigas', 'about 20 quadrillion ants', [2e16]],
  ['unos 7,5 trillones de granos', 'about 7.5 quintillion grains', [7.5e18]],
  ['9,46 billones de kilómetros', '9.46 trillion kilometres', [9.46e12]],
  ['entre 100 000 y 400 000 millones de estrellas', 'between 100 and 400 billion stars', [1e11, 4e11]],
  ['hace dos millones y medio de años', 'two and a half million years ago', [2.5e6]],
  ['diez mil millones de veces y siete millones de veces', 'ten billion times and seven million times', [7e6, 1e10]],
  ['mil veces menor, en los próximos cien mil años', 'a thousand times smaller, in the next hundred thousand years', [1000, 1e5]],
  ['decenas de miles de millones de transistores de unas decenas de nanómetros', 'tens of billions of transistors tens of nanometres across', ['~1e1', '~1e10']],
  ['en 2019. Con 6 500 millones y el 99,8 %', 'in 2019. With 6.5 billion and 99.8%', [99.8, 2019, 6.5e9]],
  ['un protón y uno más: Voyager 1, M87* y A380', 'one proton and one more: Voyager 1, M87* and A380', [1, 87, 380]],
  ['1,6 × 10⁻³⁵ m; once años luz', '1.6 × 10⁻³⁵ m; eleven light-years, going once around', [1.6e-35, 11]],
];
for (const [es, en, want] of SAME) {
  const a = figures(es, 'es'), b = figures(en, 'en');
  if (JSON.stringify(a) !== JSON.stringify(want)) fail('cifras de «' + es + '»: salen', JSON.stringify(a), 'y se esperaban', JSON.stringify(want));
  if (sameFigures(es, 'es', en, 'en')) fail('cifras distintas entre «' + es + '» y «' + en + '»:', JSON.stringify(a), JSON.stringify(b));
}
/* y un error de escala debe verse: «billones» no es «billion» */
if (!sameFigures('9,46 billones de kilómetros', 'es', '9.46 billion kilometres', 'en')) fail('el extractor no distingue billones de billion');
if (!sameFigures('3 474 kilómetros', 'es', '3,474 kilometres', 'en')) fail('el extractor acepta la coma de miles en inglés');

console.log('base: formato,', CASES.length, 'casos en', LANGS.join(' y ') + '; cifras,', SAME.length, 'pares', bad ? `PROBLEMAS: ${bad}` : 'sin problemas');
process.exit(bad ? 1 : 0);
