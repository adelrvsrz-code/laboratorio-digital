/* Base compartida del laboratorio: ensamblado de una exposición en un único HTML autocontenido.
   Lo llama el build de cada exposición. No transpila ni minifica: solo sustituye marcadores de la plantilla.
     {{CLAVE}}     contenido de un archivo fuente, o de varios seguidos
     {{TEXTOS}}    el archivo de textos del idioma
     {{LANG}}      código del idioma («es»)
     {{t:clave}}   texto fijo de la plantilla: T.ui[clave] del archivo de textos, escapado para HTML
   Uso: require('../base/base-build.js').build({ dir, template, parts, texts, lang, out }) */
const fs = require('fs'), path = require('path'), vm = require('vm');

const escHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* lee un archivo de textos (define «const T = {…}») y devuelve T */
function loadTexts(file) {
  const ctx = {}; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(file, 'utf8') + '\n;this.T = T;', ctx, { filename: file });
  return ctx.T;
}

function build({ dir, template, parts, texts, lang, out }) {
  const read = f => fs.readFileSync(path.resolve(dir, f), 'utf8');
  const textsFile = path.resolve(dir, texts);
  if (!fs.existsSync(textsFile)) throw new Error('no hay textos para el idioma «' + lang + '»: falta ' + texts);
  const T = loadTexts(textsFile);
  if (T.lang !== lang) throw new Error(texts + ' declara el idioma «' + T.lang + '» y se pidió «' + lang + '»');

  /* 1. textos e idioma, sobre la plantilla todavía sin código */
  let html = read(template).replace(/\{\{t:([^{}]*)\}\}/g, (m, k) => {
    if (typeof T.ui[k] !== 'string') throw new Error('la plantilla pide el texto «' + k + '» y ' + texts + ' no lo tiene');
    return escHtml(T.ui[k]);
  }).split('{{LANG}}').join(lang);

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

module.exports = { build, loadTexts, escHtml };
