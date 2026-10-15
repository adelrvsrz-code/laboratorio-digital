/* Ensambla la exposición "Órdenes de magnitud" en un único HTML autocontenido.
   Uso: node escalas-build.js [ruta-de-salida]   (por defecto ../dist/ordenes-de-magnitud.html) */
const fs = require('fs'), path = require('path');
const here = __dirname, read = f => fs.readFileSync(path.join(here, f), 'utf8');
let html = read('escalas-template.html');
const parts = { CSS: read('escalas-styles.css'), DATA: read('escalas-data.js'), ICONS: read('escalas-icons.js'), APP: read('escalas-app.js') };
for (const [k, v] of Object.entries(parts)) {
  if (/<\/script/i.test(v)) throw new Error('hay una etiqueta </script> dentro de ' + k);
  html = html.replace('{{' + k + '}}', () => v);
}
if (/\{\{\w+\}\}/.test(html)) throw new Error('queda algún marcador {{...}} sin sustituir');
const out = process.argv[2] || path.join(here, '..', 'dist', 'ordenes-de-magnitud.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log('escrito', out, (html.length / 1024).toFixed(1) + ' KB');
