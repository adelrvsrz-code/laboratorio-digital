/* Rasterizadores de «La misma Luna»: convierten geometría en píxeles sin tocar el DOM.
   - landMask: máscara tierra/mar a partir de las costas de luna-mapa.js.
   - moonMap: mapa de brillo de la Luna, dibujado a partir del catálogo MOON de luna-data.js.
   - moonDisc: la Luna como esfera iluminada (fase, libración y luz cenicienta).
   - earthDisc: la Tierra vista desde la Luna, con su día y su noche.
   Devuelven arrays de píxeles (RGBA) que luna-app.js convierte en mapas de bits y dibuja con drawImage. */
const RENDER = (() => {
'use strict';
const RAD = Math.PI / 180, PI = Math.PI;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/* ---------- ruido de valor en 3D, determinista ---------- */
function hash3(i, j, k) {
  let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(k, 1440662683)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise3(x, y, z) {
  const i = Math.floor(x), j = Math.floor(y), k = Math.floor(z);
  let u = x - i, v = y - j, w = z - k; u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v); w = w * w * (3 - 2 * w);
  const a = hash3(i, j, k), b = hash3(i + 1, j, k), c = hash3(i, j + 1, k), d = hash3(i + 1, j + 1, k);
  const e = hash3(i, j, k + 1), f = hash3(i + 1, j, k + 1), g = hash3(i, j + 1, k + 1), h = hash3(i + 1, j + 1, k + 1);
  const ab = a + (b - a) * u, cd = c + (d - c) * u, ef = e + (f - e) * u, gh = g + (h - g) * u;
  const s = ab + (cd - ab) * v, t = ef + (gh - ef) * v;
  return s + (t - s) * w;
}
function fbm(x, y, z, oct) { let s = 0, a = .5, n = 0; for (let o = 0; o < oct; o++) { s += a * noise3(x, y, z); n += a; x *= 2.03; y *= 2.03; z *= 2.03; a *= .5; } return s / n; }

/* ---------- máscara de tierra (proyección equirrectangular) ---------- */
function decodeLand(LAND) {
  return LAND.map(poly => poly.split('|').map(ring => {
    const out = []; let x = 0, y = 0;
    ring.split(' ').forEach((pair, i) => { const c = pair.split(','); if (i) { x += +c[0]; y += +c[1]; } else { x = +c[0]; y = +c[1]; } out.push(x / 10, y / 10); });
    return out;
  }));
}
function landMask(LAND, w) {
  const h = w >> 1, mask = new Uint8Array(w * h), polys = decodeLand(LAND), xs = [];
  for (const poly of polys) {
    let y0 = 90, y1 = -90;
    for (const r of poly) for (let i = 1; i < r.length; i += 2) { if (r[i] < y0) y0 = r[i]; if (r[i] > y1) y1 = r[i]; }
    const j0 = Math.max(0, Math.floor((90 - y1) / 180 * h)), j1 = Math.min(h - 1, Math.ceil((90 - y0) / 180 * h));
    for (let j = j0; j <= j1; j++) {
      const lat = 90 - (j + .5) / h * 180; xs.length = 0;
      for (const r of poly) for (let i = 0, n = r.length; i < n; i += 2) {
        const ax = r[i], ay = r[i + 1], bx = r[(i + 2) % n], by = r[(i + 3) % n];
        if ((ay <= lat) !== (by <= lat)) xs.push(ax + (lat - ay) / (by - ay) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const a = clamp(Math.round((xs[k] + 180) / 360 * w), 0, w), b = clamp(Math.round((xs[k + 1] + 180) / 360 * w), 0, w);
        mask.fill(255, j * w + a, j * w + b);
      }
    }
  }
  return { w, h, data: mask };
}

/* ---------- mapa de brillo de la Luna ----------
   Dibujo esquemático: los mares son la unión suave de casquetes circulares (catálogo MOON), con la orilla
   deformada por ruido; encima van los cráteres de fondo oscuro, las manchas brillantes y los sistemas de rayos.
   moonMapJob permite generarlo por tandas para no bloquear la página: step(ms) trabaja ese tiempo y devuelve
   la fracción completada. */
function moonMapJob(MOON, w) {
  const h = w >> 1, data = new Uint8Array(w * h).fill(204);
  const C = f => { const a = f[0] * RAD, b = f[1] * RAD; return [Math.cos(a) * Math.cos(b), Math.cos(a) * Math.sin(b), Math.sin(a)]; };
  const seas = MOON.seas.map(f => ({ c: C(f), r: f[2] * RAD, lim: Math.cos(Math.min(PI, f[2] * RAD * 2.3)), v: f[3] }));
  const floors = MOON.floors.map(f => ({ c: C(f), r: f[2] * RAD, lim: Math.cos(f[2] * RAD * 1.5), v: f[3] }));
  const spots = MOON.spots.map(f => ({ c: C(f), r: f[2] * RAD, lim: Math.cos(f[2] * RAD * 3), v: f[3] }));
  const rays = MOON.rays.map(f => {
    const a = f[0] * RAD, b = f[1] * RAD, c = C(f);
    const east = [-Math.sin(b), Math.cos(b), 0], north = [-Math.sin(a) * Math.cos(b), -Math.sin(a) * Math.sin(b), Math.cos(a)];
    let s = f[5]; const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
    const arms = []; for (let k = 0; k < f[4]; k++) arms.push({ az: (k + .1 + .8 * rnd()) / f[4] * 2 * PI, len: f[3] * RAD * (.3 + .7 * rnd()), wid: (.28 + .5 * rnd()) * RAD, pow: .35 + .65 * rnd() });
    return { c, east, north, halo: f[2] * RAD, lim: Math.cos(f[3] * RAD * 1.05), gain: f[6], arms };
  });
  let row = 0;
  function doRow(j) {
    const lat = (90 - (j + .5) / h * 180) * RAD, cl = Math.cos(lat), z0 = Math.sin(lat);
    for (let i = 0; i < w; i++) {
      const lon = ((i + .5) / w * 360 - 180) * RAD, x0 = cl * Math.cos(lon), y0 = cl * Math.sin(lon);
      if (x0 < -.42) continue;                                   /* cara oculta: nunca se ve desde la Tierra */
      /* tierras altas: claras, con manchas suaves y un granulado de cráteres más marcado hacia el sur */
      const rough = .6 + .5 * sstep(.1, -.6, z0);
      let alb = .80 + .10 * (fbm(x0 * 3.1 + 7, y0 * 3.1, z0 * 3.1, 3) - .5) + .09 * rough * (fbm(x0 * 17, y0 * 17 + 3, z0 * 17, 2) - .5);
      const pit = noise3(x0 * 52, y0 * 52, z0 * 52); alb += rough * (pit > .78 ? .30 * (pit - .78) : pit < .2 ? -.25 * (.2 - pit) : 0);
      /* deformación del dominio: las orillas dejan de ser arcos de círculo */
      const wx = fbm(x0 * 6.1 + 11, y0 * 6.1, z0 * 6.1 + 5, 3) - .5, wy = fbm(x0 * 6.1, y0 * 6.1 + 23, z0 * 6.1 + 2, 3) - .5, wz = fbm(x0 * 6.1 + 4, y0 * 6.1 + 9, z0 * 6.1 + 31, 3) - .5;
      let x = x0 + .11 * wx, y = y0 + .11 * wy, z = z0 + .11 * wz; const n = 1 / Math.sqrt(x * x + y * y + z * z); x *= n; y *= n; z *= n;
      let field = 0, val = 0;
      for (const s of seas) { const d = x * s.c[0] + y * s.c[1] + z * s.c[2]; if (d < s.lim) continue; const q = Math.acos(Math.min(1, d)) / s.r, f = Math.exp(-2.2 * q * q); field += f; val += f * s.v; }
      if (field > .03) {
        const cov = sstep(.075, .16, field), tone = val / field;
        const inner = sstep(.11, .5, field);                     /* más oscuro mar adentro */
        alb += ((tone + .07 * (1 - inner)) * (1 + .13 * (fbm(x0 * 9 + 2, y0 * 9, z0 * 9, 2) - .5)) - alb) * cov;
      }
      for (const s of floors) { const d = x0 * s.c[0] + y0 * s.c[1] + z0 * s.c[2]; if (d < s.lim) continue; alb += (s.v - alb) * sstep(s.r * 1.1, s.r * .8, Math.acos(Math.min(1, d))); }
      for (const s of spots) { const d = x0 * s.c[0] + y0 * s.c[1] + z0 * s.c[2]; if (d < s.lim) continue; const q = Math.acos(Math.min(1, d)) / s.r; alb += s.v * Math.exp(-q * q); }
      for (const r of rays) {
        const d = x0 * r.c[0] + y0 * r.c[1] + z0 * r.c[2]; if (d < r.lim) continue;
        const ang = Math.acos(Math.min(1, d)), q = ang / r.halo; let add = Math.exp(-q * q) - .5 * Math.exp(-(q - 1.9) * (q - 1.9) * 3);
        if (ang > r.halo * .8) {
          const az = Math.atan2(x0 * r.east[0] + y0 * r.east[1] + z0 * r.east[2], x0 * r.north[0] + y0 * r.north[1] + z0 * r.north[2]);
          let sum = 0;
          for (const a of r.arms) { let dz = az - a.az; dz -= 2 * PI * Math.round(dz / (2 * PI)); if (Math.abs(dz) > 1.1) continue; const off = ang * Math.sin(dz) / a.wid; sum += a.pow * Math.exp(-off * off) * sstep(a.len, a.len * .2, ang * Math.cos(dz)); }
          add += .5 * Math.min(1, sum) * (.45 + 1.1 * noise3(x0 * 34, y0 * 34, z0 * 34)) / (1 + ang / (10 * RAD));
        }
        alb += r.gain * add;
      }
      data[j * w + i] = clamp(Math.round(alb * 255), 14, 255);
    }
  }
  return {
    map: { w, h, data },
    step(ms) { const t0 = Date.now(); while (row < h) { doRow(row++); if (ms != null && (row & 3) === 0 && Date.now() - t0 >= ms) break; } return row / h; }
  };
}
function moonMap(MOON, w) { const job = moonMapJob(MOON, w); job.step(); return job.map; }

/* muestreo bilineal de un mapa equirrectangular con vector unitario (bx, by, bz) */
function sample(map, bx, by, bz) {
  const w = map.w, h = map.h, d = map.data;
  let u = (Math.atan2(by, bx) / PI + 1) * .5 * w - .5, v = (.5 - Math.asin(clamp(bz, -1, 1)) / PI) * h - .5;
  if (v < 0) v = 0; else if (v > h - 1.001) v = h - 1.001;
  if (u < 0) u += w;
  const i0 = Math.floor(u), j0 = Math.floor(v), fu = u - i0, fv = v - j0, i1 = (i0 + 1) % w, r0 = j0 * w, r1 = r0 + w;
  const a = d[r0 + i0], b = d[r0 + i1], c = d[r1 + i0], e = d[r1 + i1];
  return (a + (b - a) * fu) * (1 - fv) + (c + (e - c) * fu) * fv;
}

/* ---------- la Luna como esfera iluminada ----------
   size: lado en píxeles. o.right, o.up, o.front: ejes de la imagen (derecha, arriba, hacia quien mira).
   o.xb, o.yb, o.zb: ejes de la Luna (meridiano cero, 90° E, polo norte). o.sun: dirección hacia el Sol.
   o.shine: intensidad de la luz cenicienta (0 a 1). Todos los vectores en el mismo sistema. */
function moonDisc(size, o, map, out) {
  const px = out || new Uint8ClampedArray(size * size * 4), c = size / 2, rad = size / 2 - 1, D = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const m = [D(o.xb, o.right), D(o.xb, o.up), D(o.xb, o.front), D(o.yb, o.right), D(o.yb, o.up), D(o.yb, o.front), D(o.zb, o.right), D(o.zb, o.up), D(o.zb, o.front)];
  const sx = D(o.sun, o.right), sy = D(o.sun, o.up), sz = D(o.sun, o.front), shine = o.shine || 0;
  let lit = 0, tot = 0;
  for (let j = 0; j < size; j++) {
    const Y = (c - j - .5) / rad;
    for (let i = 0; i < size; i++) {
      const X = (i + .5 - c) / rad, r2 = X * X + Y * Y, k = (j * size + i) * 4;
      if (r2 >= 1.02) { px[k + 3] = 0; continue; }
      const r = Math.sqrt(r2), cov = clamp((1 - r) * rad + .5, 0, 1);
      if (cov <= 0) { px[k + 3] = 0; continue; }
      const q = r > 1 ? 1 / r : 1, x = X * q, y = Y * q, z = Math.sqrt(Math.max(0, 1 - x * x - y * y));
      const alb = sample(map, m[0] * x + m[1] * y + m[2] * z, m[3] * x + m[4] * y + m[5] * z, m[6] * x + m[7] * y + m[8] * z) / 255;
      const mu0 = sx * x + sy * y + sz * z;
      /* Lommel-Seeliger: la luna llena se ve plana, sin oscurecerse hacia el borde, y el terminador es gradual */
      const I = mu0 > 0 ? Math.min(1, 2.1 * mu0 / (mu0 + z + 1e-4)) * sstep(0, .05, mu0) : 0;
      const v = alb * (I + shine * (.55 + .45 * z)) * 255;
      px[k] = v; px[k + 1] = v * .975; px[k + 2] = v * .93 + shine * 10; px[k + 3] = cov * 255;
      tot += cov; if (mu0 > 0) lit += cov;
    }
  }
  return { size, data: px, lit: tot ? lit / tot : 0 };
}

/* ---------- la Tierra vista desde la Luna ----------
   o.right, o.up, o.front: ejes de la imagen en el sistema fijo a la Tierra (front apunta a la Luna). o.sun: dirección al Sol. */
function earthDisc(size, o, mask, out) {
  const px = out || new Uint8ClampedArray(size * size * 4), c = size / 2, rad = size / 2 - 1;
  const R = o.right, U = o.up, F = o.front, S = o.sun;
  for (let j = 0; j < size; j++) {
    const Y = (c - j - .5) / rad;
    for (let i = 0; i < size; i++) {
      const X = (i + .5 - c) / rad, r2 = X * X + Y * Y, k = (j * size + i) * 4;
      if (r2 >= 1.02) { px[k + 3] = 0; continue; }
      const r = Math.sqrt(r2), cov = clamp((1 - r) * rad + .5, 0, 1);
      if (cov <= 0) { px[k + 3] = 0; continue; }
      const q = r > 1 ? 1 / r : 1, x = X * q, y = Y * q, z = Math.sqrt(Math.max(0, 1 - x * x - y * y));
      const px3 = R[0] * x + U[0] * y + F[0] * z, py3 = R[1] * x + U[1] * y + F[1] * z, pz3 = R[2] * x + U[2] * y + F[2] * z;
      const land = sample(mask, px3, py3, pz3) / 255, ice = land * sstep(.87, .94, Math.abs(pz3));
      const day = sstep(-.12, .14, px3 * S[0] + py3 * S[1] + pz3 * S[2]), sh = .62 + .38 * z;
      /* día: océano azul, tierra verde apagado, hielo claro. noche: casi negro, con la tierra un punto más clara */
      let r0 = 24 + land * 78 + ice * 120, g0 = 62 + land * 76 + ice * 78, b0 = 128 - land * 36 + ice * 108;
      const rn = 7 + land * 17 + ice * 12, gn = 12 + land * 20 + ice * 14, bn = 34 + land * 14 + ice * 18;
      const rim = (1 - z) * (1 - z) * (1 - z) * day;
      r0 = (r0 * sh + (150 - r0) * rim * .5); g0 = (g0 * sh + (190 - g0) * rim * .5); b0 = (b0 * sh + (255 - b0) * rim * .5);
      px[k] = rn + (r0 - rn) * day; px[k + 1] = gn + (g0 - gn) * day; px[k + 2] = bn + (b0 - bn) * day; px[k + 3] = cov * 255;
    }
  }
  return { size, data: px };
}

return { landMask, decodeLand, moonMap, moonMapJob, moonDisc, earthDisc, sample, noise3, fbm, sstep };
})();
