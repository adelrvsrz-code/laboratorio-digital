/* Base compartida del laboratorio, solo para las comprobaciones (no entra en ningún HTML): saca las cifras que dice
   un texto, para poder exigir que el original y su traducción digan las mismas aunque las escriban distinto.
     figures('13 800 millones de años', 'es')  →  [13800000000]
     figures('13.8 billion years', 'en')       →  [13800000000]
   Entiende, en cada idioma: el signo decimal y el espacio de los miles; la escala (larga en español: billón = 10¹²;
   corta en inglés: billion = 10⁹); los números con letra más corrientes («dos mil millones», «ten billion»,
   «cien mil», «a thousand»); «… y medio» / «… and a half» ante una palabra de escala; los intervalos que comparten
   escala («entre 100 000 y 400 000 millones», «between 100 and 400 billion»); y las cantidades vagas («decenas de
   miles de millones», «tens of billions»), que salen como «~1e10».
   No entiende, y deja pasar en los dos idiomas por igual: «un» y «one» sueltos, las fracciones con letra («un cuarto»,
   «la mitad») ni los ordinales.
   Uso: const { figures, sameFigures } = require('../base/base-cifras.js') */
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const LANG = {
  es: {
    dec: ',',
    num: { cero: 0, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15,
      'dieciséis': 16, diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20, treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
      cien: 100, ciento: 100, mil: 1e3 },
    one: ['un', 'una'],                                   /* solo cuentan ante un multiplicador: «un millón» */
    mult: { mil: 1e3, 'millón': 1e6, millones: 1e6, 'billón': 1e12, billones: 1e12, 'trillón': 1e18, trillones: 1e18, 'cuatrillón': 1e24, cuatrillones: 1e24 },
    vague: { decenas: 1e1, cientos: 1e2, centenares: 1e2, miles: 1e3, millares: 1e3, millones: 1e6, billones: 1e12, trillones: 1e18 },
    of: 'de', and: ['y', 'a', 'o', 'e'],
    half: { after: ['y', 'medio'], before: null },        /* «dos millones y medio» */
  },
  en: {
    dec: '.',
    num: { zero: 0, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
      sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
      hundred: 100, thousand: 1e3 },
    one: ['a', 'an', 'one'],                              /* solo cuentan ante un multiplicador: «a thousand» */
    mult: { hundred: 100, thousand: 1e3, million: 1e6, billion: 1e9, trillion: 1e12, quadrillion: 1e15, quintillion: 1e18, sextillion: 1e21, septillion: 1e24, octillion: 1e27 },
    vague: { tens: 1e1, hundreds: 1e2, thousands: 1e3, millions: 1e6, billions: 1e9, trillions: 1e12, quadrillions: 1e15, quintillions: 1e18 },
    of: 'of', and: ['and', 'to', 'or'],
    half: { after: null, before: ['and', 'a', 'half'] },  /* «two and a half million» */
  },
};

/* trocea en números, palabras y signos; los signos importan porque cortan las cadenas («en 2019. Con 6 500») */
function tokens(text, L) {
  const dec = L.dec === ',' ? ',' : '\\.';
  const re = new RegExp('(\\d+(?:' + dec + '\\d+)?)\\s*×\\s*10([⁻' + SUP + ']+)|10([⁻' + SUP + ']+)|(\\d{1,3}(?:[ \\u202f\\u00a0]\\d{3})+(?:' + dec + '\\d+)?|\\d+(?:' + dec + '\\d+)?)|([A-Za-zÀ-ÿ]+)|([^\\s])', 'g');
  const exp = s => Number([...s].map(c => c === '⁻' ? '-' : SUP.indexOf(c)).join(''));
  const val = s => Number(s.replace(/[ \u202f\u00a0]/g, '').replace(L.dec, '.'));
  const out = []; let m;
  while ((m = re.exec(text))) {
    if (m[1] !== undefined) out.push({ n: val(m[1]) * 10 ** exp(m[2]) });
    else if (m[3] !== undefined) out.push({ n: 10 ** exp(m[3]) });
    else if (m[4] !== undefined) out.push({ n: val(m[4]) });
    else if (m[5] !== undefined) out.push({ w: m[5].toLowerCase() });
    else out.push({ p: m[6] });
  }
  return out;
}

function figures(text, lang) {
  const L = LANG[lang]; if (!L) throw new Error('base-cifras.js no conoce el idioma «' + lang + '»');
  const t = tokens(String(text), L), out = [];              /* out: { v, scaled, at } o { vague } */
  const word = (i, list) => t[i] && t[i].w !== undefined && (Array.isArray(list) ? list.includes(t[i].w) : t[i].w === list);
  const seq = (i, ws) => ws && ws.every((w, k) => word(i + k, w));
  for (let i = 0; i < t.length; i++) {
    const tk = t[i]; let v = null, start = i;
    if (tk.n !== undefined) v = tk.n;
    else if (tk.w !== undefined && tk.w in L.num && !(tk.w === 'ciento' && word(i - 1, 'por'))) v = L.num[tk.w];   /* «por ciento» no es cien */
    else if (tk.w !== undefined && L.one.includes(tk.w) && t[i + 1] && t[i + 1].w in L.mult) v = 1;
    else if (tk.w !== undefined && tk.w in L.vague) {       /* cantidad vaga: «decenas de miles de millones» */
      let mag = L.vague[tk.w];
      while (word(i + 1, L.of) && t[i + 2] && t[i + 2].w !== undefined && (t[i + 2].w in L.vague || t[i + 2].w in L.mult)) { mag *= L.vague[t[i + 2].w] || L.mult[t[i + 2].w]; i += 2; }
      out.push({ vague: '~' + mag.toExponential(0).replace('+', '') }); continue;
    }
    if (v === null) continue;
    let scaled = false, half = false;
    if (seq(i + 1, L.half.before) && t[i + 1 + L.half.before.length] && t[i + 1 + L.half.before.length].w in L.mult) { half = true; i += L.half.before.length; }
    while (t[i + 1] && t[i + 1].w !== undefined && t[i + 1].w in L.mult) { v *= L.mult[t[i + 1].w]; scaled = true; i++; if (half) { v += .5 * L.mult[t[i].w]; half = false; } }
    if (scaled && seq(i + 1, L.half.after)) { v += .5 * L.mult[t[i].w]; i += L.half.after.length; }
    /* intervalo que comparte escala: «entre 100 000 y 400 000 millones» */
    const prev = out[out.length - 1];
    if (scaled && prev && prev.v !== undefined && !prev.scaled && prev.end === start - 2 && (word(start - 1, L.and) || (t[start - 1].p && /[–-]/.test(t[start - 1].p)))) { prev.v *= v / (t[start].n !== undefined ? t[start].n : L.num[t[start].w] || 1); prev.scaled = true; }
    out.push({ v, scaled, end: i });
  }
  const nums = out.filter(o => o.v !== undefined).map(o => o.v).sort((a, b) => a - b).map(x => Number(x.toPrecision(9)));
  return nums.concat(out.filter(o => o.vague).map(o => o.vague).sort());
}

/* compara las cifras de dos textos; devuelve null si coinciden o las dos listas si no */
function sameFigures(a, langA, b, langB) {
  const fa = figures(a, langA), fb = figures(b, langB);
  const eq = fa.length === fb.length && fa.every((x, i) => typeof x === 'string' ? x === fb[i] : typeof fb[i] === 'number' && Math.abs(x - fb[i]) <= 1e-9 * Math.max(Math.abs(x), Math.abs(fb[i])));
  return eq ? null : [fa, fb];
}

module.exports = { figures, sameFigures };
