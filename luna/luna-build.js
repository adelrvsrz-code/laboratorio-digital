/* Ensambla la exposición «La misma Luna» en un único HTML autocontenido.
   Uso: node luna-build.js [ruta-de-salida]   (por defecto ../dist/la-misma-luna.html) */
const fs = require('fs'), path = require('path');
const here = __dirname, read = f => fs.readFileSync(path.join(here, f), 'utf8');
let html = read('luna-template.html');
const parts = { CSS: read('luna-styles.css'), DATA: read('luna-data.js'), MAPA: read('luna-mapa.js'), ASTRO: read('luna-astro.js'), RENDER: read('luna-render.js'), APP: read('luna-app.js') };
for (const [k, v] of Object.entries(parts)) {
  if (/<\/script/i.test(v)) throw new Error('hay una etiqueta </script> dentro de ' + k);
  if (!html.includes('{{' + k + '}}')) throw new Error('la plantilla no tiene el marcador {{' + k + '}}');
  html = html.replace('{{' + k + '}}', () => v);
}
if (/\{\{\w+\}\}/.test(html)) throw new Error('queda algún marcador {{...}} sin sustituir');
const out = process.argv[2] || path.join(here, '..', 'dist', 'la-misma-luna.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log('escrito', out, (html.length / 1024).toFixed(1) + ' KB');
