/* Comprueba la integridad del catálogo y de los iconos sin navegador.
   Uso: node escalas-check.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
const here = __dirname, read = f => fs.readFileSync(path.join(here, f), 'utf8');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(read('escalas-data.js') + '\n' + read('escalas-icons.js') + '\nthis.OBJECTS=OBJECTS;this.CATS=CATS;this.ICON=ICON;', ctx);
const { OBJECTS, CATS, ICON } = ctx;
const sorted = OBJECTS.slice().sort((a, b) => a.s - b.s);
let bad = 0; const ids = new Set();
for (const o of OBJECTS) {
  if (ids.has(o.id)) { console.log('id repetido:', o.id); bad++; } ids.add(o.id);
  if (!/^[a-z0-9-]+$/.test(o.id)) { console.log('id con caracteres no válidos (usa minúsculas, dígitos y guiones):', o.id); bad++; }
  if (!CATS[o.c]) { console.log('categoría desconocida en', o.id); bad++; }
  if (!(o.s > 0) || !isFinite(o.s)) { console.log('tamaño no válido en', o.id); bad++; }
  if (!o.d || o.d.length < 40) { console.log('descripción demasiado corta en', o.id); bad++; }
  if (!ICON.names.includes(o.i[0])) { console.log('icono inexistente', o.i[0], 'en', o.id); bad++; }
  const svg = ICON.make(o.i);
  if (!svg.startsWith('<svg') || !svg.endsWith('</svg>') || /NaN|undefined/.test(svg)) { console.log('SVG defectuoso en', o.id); bad++; }
}
for (let i = 1; i < sorted.length; i++) if (sorted[i].s / sorted[i - 1].s < 1.03) console.log('aviso: tamaños casi iguales,', sorted[i - 1].id, 'y', sorted[i].id);
const cats = {}; for (const o of OBJECTS) cats[o.c] = (cats[o.c] || 0) + 1;
console.log('objetos:', OBJECTS.length, cats, bad ? `PROBLEMAS: ${bad}` : 'sin problemas');
process.exit(bad ? 1 : 0);
