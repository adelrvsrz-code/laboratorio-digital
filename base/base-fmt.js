/* Base compartida del laboratorio: formato de números y unidades con configuración regional.
   Funciones puras, sin DOM: se cargan igual en el navegador y en Node (base-check.js).
   Uso: const F = BASEFMT('es');  F.fmtLen(3.474e6) → «3 474 km»;  BASEFMT('en').fmtLen(3.474e6) → «3 474 km».
   Añadir un idioma = añadir una entrada a REG y sus casos a base-check.js. */
const BASEFMT = (() => {
const NB = '\u202F';                      /* espacio fino sin salto: separador de miles en todos los idiomas, como pide el SI */
const LY = 9.4607e15, AU = 1.495978707e11;
const SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
const sup = n => String(n).split('').map(c => SUP[c] || c).join('');

/* dec, mil   signo decimal y separador de miles
   scale      nombres de las potencias, de mayor a menor: [valor, texto completo cuando la cifra es 1, palabra tras la cifra]
   of         lo que va entre la palabra de escala y lo que se cuenta: «5 millones de km», «5 million km»
   times      «vez» y «veces»
   u          unidades que se escriben con palabra o cambian con el idioma: [singular, plural]
   El español usa la escala larga (billón = 10¹²) y el inglés la corta (billion = 10⁹). */
const REG = {
  es: {
    dec: ',', mil: NB, of: ' de ', times: ['vez', 'veces'],
    scale: [[1e24, '1 cuatrillón', 'cuatrillones'], [1e18, '1 trillón', 'trillones'], [1e12, '1 billón', 'billones'], [1e9, 'mil millones', 'mil millones'], [1e6, '1 millón', 'millones']],
    u: {
      ly: ['año luz', 'años luz'], au: ['UA', 'UA'], km: ['km', 'km'],
      as: ['attosegundo', 'attosegundos'], fs: ['femtosegundo', 'femtosegundos'], ps: ['picosegundo', 'picosegundos'], ns: ['nanosegundo', 'nanosegundos'],
      us: ['microsegundo', 'microsegundos'], ms: ['milisegundo', 'milisegundos'], s: ['segundo', 'segundos'], min: ['minuto', 'minutos'], h: ['hora', 'horas'],
      d: ['día', 'días'], y: ['año', 'años'],
    },
  },
  en: {
    dec: '.', mil: NB, of: ' ', times: ['time', 'times'],
    scale: [[1e27, '1 octillion', 'octillion'], [1e24, '1 septillion', 'septillion'], [1e21, '1 sextillion', 'sextillion'], [1e18, '1 quintillion', 'quintillion'],
      [1e15, '1 quadrillion', 'quadrillion'], [1e12, '1 trillion', 'trillion'], [1e9, '1 billion', 'billion'], [1e6, '1 million', 'million']],
    u: {
      ly: ['light-year', 'light-years'], au: ['AU', 'AU'], km: ['km', 'km'],
      as: ['attosecond', 'attoseconds'], fs: ['femtosecond', 'femtoseconds'], ps: ['picosecond', 'picoseconds'], ns: ['nanosecond', 'nanoseconds'],
      us: ['microsecond', 'microseconds'], ms: ['millisecond', 'milliseconds'], s: ['second', 'seconds'], min: ['minute', 'minutes'], h: ['hour', 'hours'],
      d: ['day', 'days'], y: ['year', 'years'],
    },
  },
};
/* longitudes por debajo del kilómetro: [desde, factor, símbolo]. Los símbolos del SI no se traducen. */
const SI_LEN = [[1, 1, 'm'], [1e-2, 100, 'cm'], [1e-3, 1e3, 'mm'], [1e-6, 1e6, 'µm'], [1e-9, 1e9, 'nm'], [1e-12, 1e12, 'pm'], [1e-15, 1e15, 'fm'], [1e-18, 1e18, 'am']];
/* tiempos por debajo del día: [hasta, factor, divisor, unidad] */
const TIMES = [[1e-15, 1e18, 1, 'as'], [1e-12, 1e15, 1, 'fs'], [1e-9, 1e12, 1, 'ps'], [1e-6, 1e9, 1, 'ns'], [1e-3, 1e6, 1, 'us'], [1, 1e3, 1, 'ms'], [60, 1, 1, 's'], [3600, 1, 60, 'min'], [86400, 1, 3600, 'h']];
const SCI_FROM = 1e30;                    /* a partir de aquí no hay palabra de uso corriente: notación científica */

function make(lang) {
  const L = REG[lang];
  if (!L) throw new Error('BASEFMT: no hay configuración regional para el idioma «' + lang + '»');

  /* pasa a la escritura regional un número ya redondeado, escrito como lo escribe JavaScript («1234.5») */
  function num(s) {
    let [i, f] = String(s).split('.');
    i = i.replace(/\B(?=(\d{3})+(?!\d))/g, L.mil);
    return f ? i + L.dec + f : i;
  }
  /* notación científica: «3,5 × 10⁸», «10⁻⁷» */
  function sci(x, sig = 2) {
    if (!x) return '0';
    let e = Math.floor(Math.log10(Math.abs(x))), m = Number((x / 10 ** e).toPrecision(sig));
    if (Math.abs(m) >= 10) { m /= 10; e += 1; }
    const ms = m.toString().replace('.', L.dec);
    return (ms === '1' ? '' : ms + ' × ') + '10' + sup(e);
  }
  /* tres formas de redondear. auto: más decimales cuanto menor es la cifra (Órdenes de magnitud) */
  function auto(x) {
    const a = Math.abs(x); let s;
    if (a >= 100) s = Math.round(x).toString();
    else if (a >= 10) s = (Math.round(x * 10) / 10).toString();
    else if (a >= 1) s = (Math.round(x * 100) / 100).toString();
    else s = Number(x.toPrecision(3)).toString();
    return s.includes('e') ? sci(x) : num(s);
  }
  /* fixed: decimales fijos y signo menos tipográfico (La misma Luna) */
  function fixed(x, d = 0) {
    const s = Math.abs(x).toFixed(d);
    return (x < 0 && Number(s) !== 0 ? '−' : '') + num(s);
  }
  /* sig: cifras significativas (El espectro) */
  function sig(x, n = 3) {
    const s = Number(x.toPrecision(n)).toString();
    return s.includes('e') ? sci(x, n) : num(s);
  }

  const rung = x => L.scale.find(r => x >= r[0]);
  const unitOf = u => L.u[u] || [u, u];
  /* cifra con su palabra de escala: «5 millones», «1 millón», «mil millones»; por debajo del millón, solo la cifra */
  function fmtCount(r) {
    if (r < 1e6) return auto(r);
    if (r >= SCI_FROM) return sci(r).replace(' × ', '·');
    const [k, one, word] = rung(r), n = auto(r / k);
    return n === '1' ? one : n + ' ' + word;
  }
  /* cifra y unidad: «4,2 años luz», «150 millones de km», «1 UA» */
  function withWord(x, unit) {
    const [sg, pl] = unitOf(unit);
    if (x >= 1e6) return fmtCount(x) + L.of + pl;
    const n = auto(x);
    return n + ' ' + (n === '1' ? sg : pl);
  }
  /* «3 veces», «5 millones de veces» */
  function fmtTimes(r) {
    const c = fmtCount(r);
    return c + (r >= 1e6 && r < SCI_FROM ? L.of : ' ') + (c === '1' ? L.times[0] : L.times[1]);
  }
  /* longitud en metros con la unidad más legible, del attómetro a los años luz */
  function fmtLen(m) {
    if (m >= LY * .9) return withWord(m / LY, 'ly');
    if (m >= AU * .999) return withWord(m / AU, 'au');
    if (m >= 1e4) return withWord(m / 1e3, 'km');
    for (const [from, k, u] of SI_LEN) if (m >= from) return auto(m * k) + ' ' + u;
    return sci(m) + ' m';
  }
  /* duración en segundos con la unidad más legible, del attosegundo a los miles de millones de años */
  function fmtTime(s) {
    if (s < 1e-18) return sci(s) + ' s';
    for (const [to, k, div, u] of TIMES) if (s < to) return withWord(s * k / div, u);
    const y = s / 31557600;
    return y < .999 ? withWord(s / 86400, 'd') : withWord(y, 'y');
  }

  return { lang, num, sci, sup, auto, fixed, sig, fmtCount, fmtMult: fmtCount, fmtTimes, withWord, fmtLen, fmtTime };
}
make.REG = REG;                          /* a la vista para las comprobaciones */
return make;
})();
