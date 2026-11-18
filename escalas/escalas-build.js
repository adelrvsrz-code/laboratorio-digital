/* Ensambla la exposición «Órdenes de magnitud»: un HTML autocontenido por idioma.
   Uso: node escalas-build.js                  todos los idiomas en ../dist/ (se enlazan entre sí)
        node escalas-build.js --sitio <dir>    todos los idiomas en su ruta pública dentro de <dir> (lo usa el despliegue)
        node escalas-build.js --suelto [dir]   todos los idiomas sin enlace entre ellos, para probarlos como artefacto
   Hay un idioma por cada escalas-textos.<idioma>.js. */
require('../base/base-build.js').buildAll({
  dir: __dirname,
  template: 'escalas-template.html',
  texts: lang => 'escalas-textos.' + lang + '.js',
  parts: {
    CSS: ['escalas-styles.css', '../base/base-idioma.css'],
    BASE: ['../base/base-fmt.js', '../base/base-idioma.js'],
    DATA: 'escalas-data.js', ICONS: 'escalas-icons.js', APP: 'escalas-app.js',
  },
  names: { es: 'ordenes-de-magnitud', en: 'orders-of-magnitude' },                  /* archivo en dist/ */
  routes: { es: 'ordenes-de-magnitud/', en: 'en/orders-of-magnitude/' },            /* ruta pública */
}, process.argv.slice(2));
