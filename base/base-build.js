/* Base compartida del laboratorio: ensamblado de una exposición en HTML autocontenidos, uno por idioma.
   Lo llama el build de cada exposición. No transpila ni minifica: solo sustituye marcadores de la plantilla.
     {{CLAVE}}      contenido de un archivo fuente, o de varios seguidos
     {{TEXTOS}}     el archivo de textos del idioma
     {{LANG}}       código del idioma («es»)
     {{t:clave}}    texto fijo de la plantilla: T.ui[clave] del archivo de textos, escapado para HTML
     {{HREFLANG}}   en la cabecera: dirección canónica y versiones en otros idiomas (solo al ensamblar el sitio)
     {{IDIOMA}}     enlace a la misma exposición en los otros idiomas (vacío si se ensambla un HTML suelto)
   Uso desde <prefijo>-build.js: require('../base/base-build.js').buildAll({ dir, template, parts, texts, names, routes }, process.argv.slice(2))
     node <prefijo>-build.js                   todos los idiomas en ../dist/, enlazados entre sí como archivos vecinos
     node <prefijo>-build.js --sitio <dir>     todos los idiomas en <dir>/<ruta pública>/index.html, con hreflang
     node <prefijo>-build.js --suelto [dir]    todos los idiomas sin enlace entre ellos (para probar como artefacto); por defecto ../dist/sueltos/ */
const fs = require('fs'), path = require('path'), vm = require('vm');

const SITE = 'https://adelrvsrz-code.github.io/laboratorio-digital/';
/* Idiomas del laboratorio. name: cómo se llama a sí mismo; also y close: el aviso que invita a cambiar a ese idioma,
   escrito en ese idioma porque se dirige a quien lo lee. XDEFAULT: la versión para quien no habla ninguno. */
const LANGS = {
  es: { name: 'Español', also: 'También en español', close: 'Cerrar el aviso' },
  en: { name: 'English', also: 'Also available in English', close: 'Dismiss' },
};
const XDEFAULT = 'en';

const escHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* lee un archivo de textos (define «const T = {…}») y devuelve T */
function loadTexts(file) {
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(file, 'utf8') + '\n;this.T = T;', ctx, { filename: file });
  return ctx.T;
}

/* Ensambla un idioma. alt: las otras versiones, [{ lang, href, url }]: href es el enlace desde esta página y url la
   dirección pública; self: la dirección pública de esta página. Sin alt no hay enlace de idioma; sin self, ni hreflang. */
function build({ dir, template, parts, texts, lang, out, alt = [], self = '' }) {
  const read = f => fs.readFileSync(path.resolve(dir, f), 'utf8');
  const textsFile = path.resolve(dir, texts);
  if (!fs.existsSync(textsFile)) throw new Error('no hay textos para el idioma «' + lang + '»: falta ' + texts);
  const T = loadTexts(textsFile);
  if (T.lang !== lang) throw new Error(texts + ' declara el idioma «' + T.lang + '» y se pidió «' + lang + '»');
  for (const a of alt) if (!LANGS[a.lang]) throw new Error('base-build.js no conoce el idioma «' + a.lang + '»');

  /* 1. textos e idioma, sobre la plantilla todavía sin código */
  const hreflang = !self ? '' : [`<link rel="canonical" href="${escHtml(self)}">`]
    .concat([{ lang, url: self }].concat(alt).sort((a, b) => a.lang.localeCompare(b.lang)).map(a => `<link rel="alternate" hreflang="${a.lang}" href="${escHtml(a.url)}">`))
    .concat(`<link rel="alternate" hreflang="x-default" href="${escHtml(lang === XDEFAULT ? self : (alt.find(a => a.lang === XDEFAULT) || { url: self }).url)}">`).join('\n');
  const idioma = !alt.length ? '' : '<p class="idioma">' + alt.map(a => `<a href="${escHtml(a.href)}" hreflang="${a.lang}" lang="${a.lang}" data-largo="${escHtml(LANGS[a.lang].also)}" data-cerrar="${escHtml(LANGS[a.lang].close)}">${escHtml(LANGS[a.lang].name)}</a>`).join(' · ') + '</p>';
  const fixed = { LANG: lang, HREFLANG: hreflang, IDIOMA: idioma };
  let html = read(template);
  for (const k of Object.keys(fixed)) if (!html.includes('{{' + k + '}}')) throw new Error('la plantilla no tiene el marcador {{' + k + '}}');
  html = html.replace(/\{\{t:([^{}]*)\}\}/g, (m, k) => {
    if (typeof T.ui[k] !== 'string') throw new Error('la plantilla pide el texto «' + k + '» y ' + texts + ' no lo tiene');
    return escHtml(T.ui[k]);
  }).replace(/\{\{(LANG|HREFLANG|IDIOMA)\}\}/g, (m, k) => fixed[k]);

  /* 2. archivos: cada marcador que queda debe tener su archivo, y cada archivo su marcador */
  const content = {};
  for (const [k, files] of Object.entries(Object.assign({}, parts, { TEXTOS: texts }))) {
    content[k] = [].concat(files).map(read).join('\n');
    if (/<\/script/i.test(content[k])) throw new Error('hay una etiqueta </script> dentro de ' + k);
  }
  const found = (html.match(/\{\{\w+\}\}/g) || []).map(m => m.slice(2, -2));
  for (const k of Object.keys(content)) if (found.filter(f => f === k).length !== 1) throw new Error('la plantilla debe tener una vez el marcador {{' + k + '}}');
  for (const k of found) if (!(k in content)) throw new Error('queda un marcador sin archivo: {{' + k + '}}');
  html = html.replace(/\{\{(\w+)\}\}/g, (m, k) => content[k]);   /* una sola pasada: lo ya insertado no se vuelve a mirar */

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log('escrito', out, (html.length / 1024).toFixed(1) + ' KB');
}

/* Ensambla todos los idiomas de una exposición. names: nombre del archivo en dist/ por idioma; routes: ruta pública por
   idioma, relativa a la raíz del sitio y acabada en «/». Solo cuentan los idiomas que tienen archivo de textos. */
function buildAll({ dir, template, parts, texts, names, routes }, argv = []) {
  const langs = Object.keys(names).filter(l => fs.existsSync(path.resolve(dir, texts(l))));
  if (!langs.includes('es')) throw new Error('falta el archivo de textos en español: ' + texts('es'));
  const mode = argv[0] === '--sitio' ? 'sitio' : argv[0] === '--suelto' ? 'suelto' : argv.length ? null : 'dist';
  if (!mode || (mode === 'sitio' && !argv[1])) throw new Error('uso: node ' + path.basename(process.argv[1] || 'build.js') + ' [--sitio <dir> | --suelto [dir]]');
  const root = mode === 'dist' ? path.join(dir, '..', 'dist') : path.resolve(argv[1] || path.join(dir, '..', 'dist', 'sueltos'));
  const rel = (from, to) => path.posix.relative(from.replace(/\/$/, ''), to.replace(/\/$/, '')) + '/';
  for (const lang of langs) {
    const others = langs.filter(l => l !== lang), common = { dir, template, parts, texts: texts(lang), lang };
    if (mode === 'sitio') build(Object.assign(common, { out: path.join(root, routes[lang], 'index.html'), self: SITE + routes[lang], alt: others.map(l => ({ lang: l, href: rel(routes[lang], routes[l]), url: SITE + routes[l] })) }));
    else build(Object.assign(common, { out: path.join(root, names[lang] + '.html'), alt: mode === 'suelto' ? [] : others.map(l => ({ lang: l, href: names[l] + '.html' })) }));
  }
}

module.exports = { build, buildAll, loadTexts, escHtml, LANGS, SITE, XDEFAULT };
