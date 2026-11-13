/* Astronomía de «La misma Luna»: posiciones del Sol y la Luna, orientación del disco lunar
   y geometría del observador. Funciones puras, sin DOM: se cargan igual en el navegador y en
   Node (luna-check.js las compara con una tabla de referencia).
   Series y constantes: J. Meeus, «Astronomical Algorithms» (2.ª ed.): tiempo sidéreo, nutación,
   Sol, Luna y libraciones ópticas. ΔT: polinomios de Espenak y Meeus (2006). Refracción: Sæmundsson.
   La implementación es propia y trabaja con vectores en un sistema fijo a la Tierra
   (x hacia el meridiano de Greenwich, z hacia el polo norte). */
const ASTRO = (() => {
'use strict';
const RAD = Math.PI / 180, DEG = 180 / Math.PI;
const AU = 149597870.7, R_MOON = 1737.4, A_EARTH = 6378.137, E2_EARTH = 0.00669437999;
const INCL = 1.54242 * RAD;                 /* inclinación del ecuador lunar sobre la eclíptica (Cassini) */
const sin = Math.sin, cos = Math.cos;
const n360 = x => ((x % 360) + 360) % 360;
const n180 = x => n360(x + 180) - 180;
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const len = a => Math.hypot(a[0], a[1], a[2]);
const unit = a => mul(a, 1 / len(a));
const perp = (v, m) => unit(sub(v, mul(m, dot(v, m))));            /* componente de v perpendicular a m, normalizada */

/* Términos periódicos de la Luna: [D, M, M', F, Σl (10⁻⁶ grados), Σr (metros)] */
const LR = [
  [0,0,1,0,6288774,-20905355],[2,0,-1,0,1274027,-3699111],[2,0,0,0,658314,-2955968],[0,0,2,0,213618,-569925],
  [0,1,0,0,-185116,48888],[0,0,0,2,-114332,-3149],[2,0,-2,0,58793,246158],[2,-1,-1,0,57066,-152138],
  [2,0,1,0,53322,-170733],[2,-1,0,0,45758,-204586],[0,1,-1,0,-40923,-129620],[1,0,0,0,-34720,108743],
  [0,1,1,0,-30383,104755],[2,0,0,-2,15327,10321],[0,0,1,2,-12528,0],[0,0,1,-2,10980,79661],
  [4,0,-1,0,10675,-34782],[0,0,3,0,10034,-23210],[4,0,-2,0,8548,-21636],[2,1,-1,0,-7888,24208],
  [2,1,0,0,-6766,30824],[1,0,-1,0,-5163,-8379],[1,1,0,0,4987,-16675],[2,-1,1,0,4036,-12831],
  [2,0,2,0,3994,-10445],[4,0,0,0,3861,-11650],[2,0,-3,0,3665,14403],[0,1,-2,0,-2689,-7003],
  [2,0,-1,2,-2602,0],[2,-1,-2,0,2390,10056],[1,0,1,0,-2348,6322],[2,-2,0,0,2236,-9884],
  [0,1,2,0,-2120,5751],[0,2,0,0,-2069,0],[2,-2,-1,0,2048,-4950],[2,0,1,-2,-1773,4130],
  [2,0,0,2,-1595,0],[4,-1,-1,0,1215,-3958],[0,0,2,2,-1110,0],[3,0,-1,0,-892,3258],
  [2,1,1,0,-810,2616],[4,-1,-2,0,759,-1897],[0,2,-1,0,-713,-2117],[2,2,-1,0,-700,2354],
  [2,1,-2,0,691,0],[2,-1,0,-2,596,0],[4,0,1,0,549,-1423],[0,0,4,0,537,-1117],
  [4,-1,0,0,520,-1571],[1,0,-2,0,-487,-1739],[2,1,0,-2,-399,0],[0,0,2,-2,-381,-4421],
  [1,1,1,0,351,0],[3,0,-2,0,-340,0],[4,0,-3,0,330,0],[2,-1,2,0,327,0],
  [0,2,1,0,-323,1165],[1,1,-1,0,299,0],[2,0,3,0,294,0],[2,0,-1,-2,0,8752]];
/* [D, M, M', F, Σb (10⁻⁶ grados)] */
const LB = [
  [0,0,0,1,5128122],[0,0,1,1,280602],[0,0,1,-1,277693],[2,0,0,-1,173237],[2,0,-1,1,55413],[2,0,-1,-1,46271],
  [2,0,0,1,32573],[0,0,2,1,17198],[2,0,1,-1,9266],[0,0,2,-1,8822],[2,-1,0,-1,8216],[2,0,-2,-1,4324],
  [2,0,1,1,4200],[2,1,0,-1,-3359],[2,-1,-1,1,2463],[2,-1,0,1,2211],[2,-1,-1,-1,2065],[0,1,-1,-1,-1870],
  [4,0,-1,-1,1828],[0,1,0,1,-1794],[0,0,0,3,-1749],[0,1,-1,1,-1565],[1,0,0,1,-1491],[0,1,1,1,-1475],
  [0,1,1,-1,-1410],[0,1,0,-1,-1344],[1,0,0,-1,-1335],[0,0,3,1,1107],[4,0,0,-1,1021],[4,0,-1,1,833],
  [0,0,1,-3,777],[4,0,-2,1,671],[2,0,0,-3,607],[2,0,2,-1,596],[2,-1,1,-1,491],[2,0,-2,1,-451],
  [0,0,3,-1,439],[2,0,2,1,422],[2,0,-3,-1,421],[2,1,-1,1,-366],[2,1,0,1,-351],[4,0,0,1,331],
  [2,-1,1,1,315],[2,-2,0,-1,302],[0,0,1,3,-283],[2,1,1,-1,-229],[1,1,0,-1,223],[1,1,0,1,223],
  [0,1,-2,-1,-220],[2,1,-1,-1,-220],[1,0,1,1,-185],[2,-1,-2,-1,181],[0,1,2,1,-177],[4,0,-2,-1,176],
  [4,-1,-1,-1,166],[1,0,1,-1,-164],[4,0,1,-1,132],[1,0,-1,-1,-119],[4,-1,0,-1,115],[2,-2,0,1,107]];

/* ΔT = TT − UT en segundos (año decimal). Un error de 10 s desplaza la Luna unos 5″. */
function deltaT(y) {
  let t;
  if (y >= 2050 && y < 2150) return -20 + 32 * ((y - 1820) / 100) ** 2 - 0.5628 * (2150 - y);
  if (y >= 2005 && y < 2050) { t = y - 2000; return 62.92 + 0.32217 * t + 0.005589 * t * t; }
  if (y >= 1986 && y < 2005) { t = y - 2000; return 63.86 + 0.3345 * t - 0.060374 * t ** 2 + 0.0017275 * t ** 3 + 0.000651814 * t ** 4 + 0.00002373599 * t ** 5; }
  if (y >= 1961 && y < 1986) { t = y - 1975; return 45.45 + 1.067 * t - t * t / 260 - t ** 3 / 718; }
  if (y >= 1941 && y < 1961) { t = y - 1950; return 29.07 + 0.407 * t - t * t / 233 + t ** 3 / 2547; }
  if (y >= 1920 && y < 1941) { t = y - 1920; return 21.20 + 0.84493 * t - 0.076100 * t * t + 0.0020936 * t ** 3; }
  if (y >= 1900 && y < 1920) { t = y - 1900; return -2.79 + 1.494119 * t - 0.0598939 * t * t + 0.0061966 * t ** 3 - 0.000197 * t ** 4; }
  return -20 + 32 * ((y - 1820) / 100) ** 2;
}

/* Vector unitario de un punto de la Tierra: dirección de su vertical (latitud geográfica, longitud este positiva) */
function vecOf(lat, lon) { const a = lat * RAD, b = lon * RAD; return [cos(a) * cos(b), cos(a) * sin(b), sin(a)]; }
function latLonOf(v) { return [Math.asin(Math.max(-1, Math.min(1, v[2] / len(v)))) * DEG, Math.atan2(v[1], v[0]) * DEG]; }

/* Estado geocéntrico del sistema Sol-Tierra-Luna en un instante (milisegundos de época Unix, UTC) */
function frame(ms) {
  const jd = ms / 86400000 + 2440587.5, year = 2000 + (jd - 2451545) / 365.25;
  const Tu = (jd - 2451545) / 36525, T = Tu + deltaT(year) / 86400 / 36525;
  const T2 = T * T, T3 = T2 * T, T4 = T3 * T;

  /* argumentos fundamentales (grados) */
  const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841 - T4 / 65194000;
  const D = (297.8501921 + 445267.1114034 * T - 0.0018819 * T2 + T3 / 545868 - T4 / 113065000) * RAD;
  const M = (357.5291092 + 35999.0502909 * T - 0.0001536 * T2 + T3 / 24490000) * RAD;
  const Mp = (134.9633964 + 477198.8675055 * T + 0.0087414 * T2 + T3 / 69699 - T4 / 14712000) * RAD;
  const Fd = 93.2720950 + 483202.0175233 * T - 0.0036539 * T2 - T3 / 3526000 + T4 / 863310000, F = Fd * RAD;
  const Om = 125.0445479 - 1934.1362891 * T + 0.0020754 * T2 + T3 / 467441 - T4 / 60616000;
  const A1 = (119.75 + 131.849 * T) * RAD, A2 = (53.09 + 479264.290 * T) * RAD, A3 = (313.45 + 481266.484 * T) * RAD;
  const E = 1 - 0.002516 * T - 0.0000074 * T2, E2 = E * E;

  /* Luna: longitud y latitud eclípticas, distancia */
  let sl = 0, sr = 0, sb = 0;
  for (const r of LR) { const a = r[0] * D + r[1] * M + r[2] * Mp + r[3] * F, e = r[1] === 0 ? 1 : (r[1] === 1 || r[1] === -1) ? E : E2; sl += r[4] * e * sin(a); sr += r[5] * e * cos(a); }
  for (const r of LB) { const a = r[0] * D + r[1] * M + r[2] * Mp + r[3] * F, e = r[1] === 0 ? 1 : (r[1] === 1 || r[1] === -1) ? E : E2; sb += r[4] * e * sin(a); }
  sl += 3958 * sin(A1) + 1962 * sin(Lp * RAD - F) + 318 * sin(A2);
  sb += -2235 * sin(Lp * RAD) + 382 * sin(A3) + 175 * sin(A1 - F) + 175 * sin(A1 + F) + 127 * sin(Lp * RAD - Mp) - 115 * sin(Lp * RAD + Mp);
  const mDist = 385000.56 + sr / 1000;

  /* nutación y oblicuidad */
  const Ls = 280.4665 + 36000.7698 * T, om = Om * RAD;
  const dpsi = (-17.20 * sin(om) - 1.32 * sin(2 * Ls * RAD) - 0.23 * sin(2 * Lp * RAD) + 0.21 * sin(2 * om)) / 3600;
  const deps = (9.20 * cos(om) + 0.57 * cos(2 * Ls * RAD) + 0.10 * cos(2 * Lp * RAD) - 0.09 * cos(2 * om)) / 3600;
  const eps = (23 + 26 / 60 + 21.448 / 3600 - (46.8150 * T + 0.00059 * T2 - 0.001813 * T3) / 3600 + deps) * RAD;
  const mLon = Lp + sl / 1e6 + dpsi, mLat = sb / 1e6;

  /* Sol: longitud aparente y distancia */
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T2, Ms = (357.52911 + 35999.05029 * T - 0.0001537 * T2) * RAD;
  const ecc = 0.016708634 - 0.000042037 * T - 0.0000001267 * T2;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T2) * sin(Ms) + (0.019993 - 0.000101 * T) * sin(2 * Ms) + 0.000289 * sin(3 * Ms);
  const sLon = L0 + C - 0.00569 + dpsi, sDist = 1.000001018 * (1 - ecc * ecc) / (1 + ecc * cos(Ms + C * RAD)) * AU;

  /* de la eclíptica al sistema fijo a la Tierra: giro por la oblicuidad y por el tiempo sidéreo de Greenwich */
  const gast = (280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * Tu * Tu - Tu ** 3 / 38710000 + dpsi * cos(eps)) * RAD;
  const ce = cos(eps), se = sin(eps), cg = cos(gast), sg = sin(gast);
  const toEarth = v => { const y = v[1] * ce - v[2] * se, z = v[1] * se + v[2] * ce; return [v[0] * cg + y * sg, -v[0] * sg + y * cg, z]; };
  const ecl = (lon, lat) => { const a = lon * RAD, b = lat * RAD; return [cos(b) * cos(a), cos(b) * sin(a), sin(b)]; };
  const mv = toEarth(ecl(mLon, mLat)), sv = toEarth(ecl(sLon, 0));
  const mPos = mul(mv, mDist), sPos = mul(sv, sDist);

  /* ejes de la Luna (leyes de Cassini): polo inclinado 1,54° respecto al polo de la eclíptica, hacia la longitud Ω + 90°;
     el meridiano cero está a un ángulo F del nodo ascendente del ecuador lunar (longitud Ω + 180°) */
  const on = (Om + dpsi) * RAD;
  const pole = [-sin(INCL) * sin(on), sin(INCL) * cos(on), cos(INCL)];
  const xn = [-cos(on), -sin(on), 0], yn = cross(pole, xn);
  const x0 = [xn[0] * cos(F) + yn[0] * sin(F), xn[1] * cos(F) + yn[1] * sin(F), xn[2] * cos(F) + yn[2] * sin(F)];
  const zb = toEarth(pole), xb = toEarth(x0), yb = cross(zb, xb);

  /* fase: ángulo en la Luna entre el Sol y la Tierra */
  const toSun = unit(sub(sPos, mPos)), toEarthDir = mul(mv, -1);
  const phaseAngle = Math.acos(Math.max(-1, Math.min(1, dot(toSun, toEarthDir)))) * DEG;
  const lib = [Math.asin(dot(toEarthDir, zb)) * DEG, Math.atan2(dot(toEarthDir, yb), dot(toEarthDir, xb)) * DEG];

  /* base de la vista «la Tierra desde la Luna»: norte celeste arriba, este a la derecha */
  const up = Math.abs(mv[2]) > 0.999999 ? [1, 0, 0] : perp([0, 0, 1], mv), right = cross(up, mv);
  const subMoon = latLonOf(mv), subSun = latLonOf(sv);
  return {
    ms, jd, T, eps, gast,
    moon: { lon: n360(mLon), lat: mLat, dist: mDist, vec: mv, pos: mPos, dec: subMoon[0], ra: n360(subMoon[1] + gast * DEG), pole: zb, xb, yb, lib, semi: Math.asin(R_MOON / mDist) * DEG },
    sun: { lon: n360(sLon), dist: sDist, vec: sv, pos: sPos, dec: subSun[0], ra: n360(subSun[1] + gast * DEG) },
    sub: { moon: subMoon, sun: subSun },
    elong: n360(mLon - sLon), phaseAngle, frac: (1 + cos(phaseAngle * RAD)) / 2, toSun,
    view: { m: mv, up, right }
  };
}

/* Refracción atmosférica estándar (Sæmundsson), en grados, para una altura geométrica h en grados */
function refraction(h) {
  if (h < -2) return 0;
  const hh = Math.max(h, -1), r = 1.02 / Math.tan((hh + 10.3 / (hh + 5.11)) * RAD) / 60;
  return h < -1 ? r * (h + 2) : r;
}

/* Lo que ve un observador: altura y rumbo de la Luna y del Sol, y giro del disco lunar respecto a su vertical.
   Los ángulos «de reloj» se miden desde el cénit (las 12) en sentido horario, tal como se mira el disco. */
function observe(Fr, lat, lon) {
  const zen = vecOf(lat, lon), a = lat * RAD;
  const N = A_EARTH / Math.sqrt(1 - E2_EARTH * sin(a) ** 2);
  const pos = [N * zen[0], N * zen[1], N * (1 - E2_EARTH) * zen[2]];
  const east = [-sin(lon * RAD), cos(lon * RAD), 0], north = cross(zen, east);
  const mt = sub(Fr.moon.pos, pos), dist = len(mt), m = mul(mt, 1 / dist), s = Fr.sun.vec;
  const altOf = v => Math.asin(Math.max(-1, Math.min(1, dot(v, zen)))) * DEG, azOf = v => n360(Math.atan2(dot(v, east), dot(v, north)) * DEG);
  const alt = altOf(m), sunAlt = altOf(s);
  const zenithal = Math.abs(dot(zen, m)) > 0.9999995;                     /* Luna en el cénit: no hay «arriba» en el disco */
  const up = zenithal ? north : perp(zen, m), right = cross(m, up);
  const clock = v => n360(Math.atan2(dot(v, right), dot(v, up)) * DEG);
  const toSun = unit(sub(Fr.sun.pos, Fr.moon.pos)), toObs = mul(m, -1);
  const pa = Math.acos(Math.max(-1, Math.min(1, dot(toSun, toObs))));
  const semi = Math.asin(R_MOON / dist) * DEG;
  return {
    lat, lon, alt, az: azOf(m), altApp: alt + refraction(alt), dist, semi,
    sunAlt, sunAz: azOf(s), sunAltApp: sunAlt + refraction(sunAlt),
    limb: clock(toSun), north: clock(Fr.moon.pole), cnorth: clock([0, 0, 1]),
    frac: (1 + cos(pa)) / 2, zenithal
  };
}

/* Posición de un lugar en la vista «la Tierra desde la Luna»: x a la derecha, y arriba, z hacia la Luna (radio 1) */
function toView(Fr, lat, lon) { const p = vecOf(lat, lon), v = Fr.view; return [dot(p, v.right), dot(p, v.up), dot(p, v.m)]; }
/* Inversa: de un punto del disco (x, y con x² + y² ≤ 1) al lugar de la cara visible */
function fromView(Fr, x, y) {
  const r2 = x * x + y * y, k = r2 > 1 ? 1 / Math.sqrt(r2) : 1; x *= k; y *= k;
  const z = Math.sqrt(Math.max(0, 1 - x * x - y * y)), v = Fr.view;
  return latLonOf([x * v.right[0] + y * v.up[0] + z * v.m[0], x * v.right[1] + y * v.up[1] + z * v.m[1], x * v.right[2] + y * v.up[2] + z * v.m[2]]);
}

/* Búsqueda de sucesos para un lugar a partir de un instante: salida, puesta y paso por el meridiano.
   Salida y puesta: el borde superior del disco toca el horizonte, con refracción estándar. Devuelve ms o null. */
function limbAlt(ms, lat, lon) { const o = observe(frame(ms), lat, lon); return o.altApp + o.semi; }
function hourAngle(ms, lat, lon) { const Fr = frame(ms); return n180(lon - Fr.sub.moon[1]); }
function search(f, ms, rising, hours, wrap) {
  const step = 600000, n = Math.ceil(hours * 6); let t0 = ms, a0 = f(t0);
  for (let i = 0; i < n; i++) {
    const t1 = t0 + step, a1 = f(t1);
    if ((rising ? a0 < 0 && a1 >= 0 : a0 >= 0 && a1 < 0) && !(wrap && Math.abs(a1 - a0) > 90)) {
      let lo = t0, hi = t1;
      for (let k = 0; k < 16; k++) { const mid = (lo + hi) / 2; if ((f(mid) >= 0) === rising) hi = mid; else lo = mid; }
      return (lo + hi) / 2;
    }
    t0 = t1; a0 = a1;
  }
  return null;
}
const nextRise = (lat, lon, ms, hours = 30) => search(t => limbAlt(t, lat, lon), ms, true, hours);
const nextSet = (lat, lon, ms, hours = 30) => search(t => limbAlt(t, lat, lon), ms, false, hours);
const nextTransit = (lat, lon, ms, hours = 30) => search(t => hourAngle(t, lat, lon), ms, true, hours, true);

/* Instante siguiente (dir = 1) o anterior (dir = −1) en que la elongación Luna−Sol vale `target` grados
   (0 nueva, 90 cuarto creciente, 180 llena, 270 cuarto menguante). */
function phaseTime(ms, target, dir = 1) {
  const g = t => n180(frame(t).elong - target), step = 6 * 3600000;
  let t0 = ms, a0 = g(t0);
  for (let i = 0; i < 130; i++) {
    const t1 = t0 + dir * step, a1 = g(t1), lo = dir > 0 ? a0 : a1, hi = dir > 0 ? a1 : a0;
    if (lo < 0 && hi >= 0 && hi - lo < 90) {
      let A = Math.min(t0, t1), B = Math.max(t0, t1);
      for (let k = 0; k < 24; k++) { const mid = (A + B) / 2; if (g(mid) >= 0) B = mid; else A = mid; }
      return (A + B) / 2;
    }
    t0 = t1; a0 = a1;
  }
  return null;
}

/* Rumbo inicial (0 = norte, 90 = este) del círculo máximo que va del punto 1 al punto 2 */
function bearing(lat1, lon1, lat2, lon2) {
  const a = lat1 * RAD, b = lat2 * RAD, d = (lon2 - lon1) * RAD;
  return n360(Math.atan2(sin(d) * cos(b), cos(a) * sin(b) - sin(a) * cos(b) * cos(d)) * DEG);
}
/* Punto intermedio del círculo máximo entre dos lugares (t de 0 a 1) */
function slerp(lat1, lon1, lat2, lon2, t) {
  const a = vecOf(lat1, lon1), b = vecOf(lat2, lon2), w = Math.acos(Math.max(-1, Math.min(1, dot(a, b))));
  if (w < 1e-9) return [lat1, lon1];
  if (Math.PI - w < 1e-6) return [lat1 + (lat2 - lat1) * t, lon1 + n180(lon2 - lon1) * t];
  const ka = sin((1 - t) * w) / sin(w), kb = sin(t * w) / sin(w);
  return latLonOf([a[0] * ka + b[0] * kb, a[1] * ka + b[1] * kb, a[2] * ka + b[2] * kb]);
}

return { frame, observe, toView, fromView, vecOf, latLonOf, refraction, deltaT, nextRise, nextSet, nextTransit, phaseTime, bearing, slerp, n360, n180, RAD, DEG, R_MOON, dot, cross, unit };
})();
