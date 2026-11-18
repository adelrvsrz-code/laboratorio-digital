/* Ensambla la exposición «Órdenes de magnitud» en un único HTML autocontenido, en un idioma.
   Uso: node escalas-build.js [idioma] [ruta-de-salida]
   Sin idioma, español. Sin ruta, ../dist/<nombre>.html. El idioma son dos letras y necesita su escalas-textos.<idioma>.js. */
const path = require('path');
const { build } = require('../base/base-build.js');
const here = __dirname, args = process.argv.slice(2);
const lang = /^[a-z]{2}$/.test(args[0] || '') ? args.shift() : 'es';
const NAMES = { es: 'ordenes-de-magnitud' };      /* nombre del archivo en dist/ para cada idioma */
build({
  dir: here, lang,
  template: 'escalas-template.html',
  texts: 'escalas-textos.' + lang + '.js',
  parts: { CSS: 'escalas-styles.css', BASE: '../base/base-fmt.js', DATA: 'escalas-data.js', ICONS: 'escalas-icons.js', APP: 'escalas-app.js' },
  out: args[0] || path.join(here, '..', 'dist', (NAMES[lang] || NAMES.es + '.' + lang) + '.html'),
});
