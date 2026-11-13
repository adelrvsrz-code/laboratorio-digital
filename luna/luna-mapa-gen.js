/* Genera luna-mapa.js (costas simplificadas) a partir de Natural Earth 1:110m, dominio público.
   Solo hace falta para regenerar el mapa; la exposición no lo usa al ejecutarse.
   Uso: node luna-mapa-gen.js ruta/ne_110m_land.geojson [tolerancia en grados, por defecto 0.12]
   Origen del archivo: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson */
const fs = require('fs'), path = require('path');
const src = process.argv[2], tol = +(process.argv[3] || 0.12);
if (!src) { console.error('falta la ruta del geojson'); process.exit(1); }
const geo = JSON.parse(fs.readFileSync(src, 'utf8'));

/* Douglas-Peucker sobre un anillo abierto (sin repetir el primer punto al final) */
function simplify(pts, eps) {
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop(); let far = -1, dmax = 0;
    const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
    for (let i = a + 1; i < b; i++) {
      const [px, py] = pts[i];
      const d = L ? Math.abs(dy * px - dx * py + bx * ay - by * ax) / L : Math.hypot(px - ax, py - ay);
      if (d > dmax) { dmax = d; far = i; }
    }
    if (dmax > eps) { keep[far] = 1; stack.push([a, far], [far, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
const area = r => { let s = 0; for (let i = 0; i < r.length; i++) { const [x1, y1] = r[i], [x2, y2] = r[(i + 1) % r.length]; s += x1 * y2 - x2 * y1; } return Math.abs(s) / 2; };

const rings = []; let before = 0;
for (const f of geo.features) {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const poly of polys) {
    const out = [];
    poly.forEach((ring, k) => {
      let r = ring.slice(0, -1); before += r.length;
      /* empezar en el punto más alejado del centroide para que el corte del anillo no deforme la simplificación */
      const cx = r.reduce((s, p) => s + p[0], 0) / r.length, cy = r.reduce((s, p) => s + p[1], 0) / r.length;
      let far = 0, dm = -1; r.forEach((p, i) => { const d = Math.hypot(p[0] - cx, p[1] - cy); if (d > dm) { dm = d; far = i; } });
      r = r.slice(far).concat(r.slice(0, far));
      let s = simplify(r.concat([r[0]]), tol).slice(0, -1);
      s = s.map(([x, y]) => [Math.round(x * 10), Math.round(y * 10)]).filter((p, i, a) => { const q = a[(i + a.length - 1) % a.length]; return p[0] !== q[0] || p[1] !== q[1]; });
      if (s.length >= 3 && (k > 0 || area(s) >= 20)) out.push(s);   /* 20 = 0,2 grados cuadrados en décimas */
      else if (k === 0) out.length = 0;
    });
    if (out.length) rings.push(out);
  }
}
/* Codificación: por polígono, anillos separados por "|"; cada anillo "x,y dx,dy dx,dy…" en décimas de grado */
const enc = r => r.map((p, i) => i ? (p[0] - r[i - 1][0]) + ',' + (p[1] - r[i - 1][1]) : p[0] + ',' + p[1]).join(' ');
rings.sort((a, b) => area(b[0]) - area(a[0]));
const lines = rings.map(p => "'" + p.map(enc).join('|') + "'");
const total = rings.reduce((s, p) => s + p.reduce((t, r) => t + r.length, 0), 0);
const js = `/* Costas de la Tierra: Natural Earth 1:110m (dominio público), simplificadas con tolerancia ${String(tol).replace('.', ',')}° y redondeadas a 0,1°.
   Archivo generado por luna-mapa-gen.js: no se edita a mano.
   Cada cadena es un polígono; sus anillos van separados por "|" (el primero es el contorno, los demás son huecos).
   Un anillo es "lon,lat dlon,dlat dlon,dlat…" en décimas de grado: el primer par es absoluto y los siguientes, incrementos. */
const LAND = [
${lines.join(',\n')}
];
`;
fs.writeFileSync(path.join(__dirname, 'luna-mapa.js'), js);
console.log(`polígonos: ${rings.length}, puntos: ${before} → ${total}, ${(js.length / 1024).toFixed(1)} KB`);
