/* Ensambla la exposición "El espectro" en un único HTML autocontenido.
   Uso: node espectro-build.js [ruta-de-salida]   (por defecto ../dist/el-espectro.html) */
const fs = require('fs'), path = require('path');
const here = __dirname, read = f => fs.readFileSync(path.join(here, f), 'utf8');
let html = read('espectro-template.html');
const parts = { CSS: read('espectro-styles.css'), FIS: read('espectro-fis.js'), DATA: read('espectro-data.js'), APP: read('espectro-app.js') };
for (const [k, v] of Object.entries(parts)) {
  if (/<\/script/i.test(v)) throw new Error('hay una etiqueta </script> dentro de ' + k);
  html = html.replace('{{' + k + '}}', () => v);
}
if (/\{\{\w+\}\}/.test(html)) throw new Error('queda algún marcador {{...}} sin sustituir');
const out = process.argv[2] || path.join(here, '..', 'dist', 'el-espectro.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log('escrito', out, (html.length / 1024).toFixed(1) + ' KB');
