/* Genera luna-ref.json: valores de referencia para luna-check.js.
   Solo hace falta para regenerar la tabla. Requiere `npm install astronomy-engine` (Don Cross, licencia MIT),
   que se usa aquí como oráculo y no forma parte de la exposición.
   Uso: node luna-ref-gen.js [número de muestras, por defecto 120] */
const fs = require('fs'), path = require('path'), A = require('astronomy-engine');
const N = +(process.argv[2] || 120), DEG = 180 / Math.PI, RAD = Math.PI / 180;
let seed = 20261113; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k], unit = a => mul(a, 1 / Math.hypot(...a)), v3 = v => [v.x, v.y, v.z];
const n360 = x => ((x % 360) + 360) % 360, r = (x, d = 4) => +x.toFixed(d);
const AU = 149597870.7;

function sample(ms, lat, lon) {
  const t = A.MakeTime(new Date(ms)), obs = new A.Observer(lat, lon, 0);
  /* puntos sublunar y subsolar: ascensión recta y declinación de la fecha menos el tiempo sidéreo */
  const subpoint = g => { const e = A.EquatorFromVector(A.RotateVector(A.Rotation_EQJ_EQD(t), g)); return [e.dec, ((e.ra - A.SiderealTime(t)) * 15 + 540) % 360 - 180]; };
  const gm = A.GeoMoon(t), gs = A.GeoVector(A.Body.Sun, t, true);
  const rot = A.Rotation_EQJ_HOR(t, obs);                       /* horizonte: x norte, y oeste, z cénit; sin refracción */
  const topo = body => v3(A.RotateVector(rot, A.Equator(body, t, obs, false, true).vec));
  const mt = topo(A.Body.Moon), m = unit(mt), s = unit(topo(A.Body.Sun)), z = [0, 0, 1];
  const altaz = v => [Math.asin(v[2]) * DEG, n360(Math.atan2(-v[1], v[0]) * DEG)];
  const up = unit(sub(z, mul(m, dot(z, m)))), right = cross(m, up);
  const clock = v => { const p = sub(v, mul(m, dot(v, m))); return n360(Math.atan2(dot(p, right), dot(p, up)) * DEG); };
  const pole = v3(A.RotateVector(rot, A.RotationAxis(A.Body.Moon, t).north));
  const sunFromMoon = unit(sub(mul(s, gs.Length() * AU), mul(m, Math.hypot(...mt) * AU)));
  const lib = A.Libration(t), ill = A.Illumination(A.Body.Moon, t);
  const [alt, az] = altaz(m), [salt, saz] = altaz(s);
  const ev = (fn) => { try { const x = fn(); return x ? Math.round(x.date.getTime() / 1000) : null; } catch (e) { return null; } };
  return {
    ms, lat, lon,
    subMoon: subpoint(gm).map(x => r(x)), subSun: subpoint(gs).map(x => r(x)), dist: r(gm.Length() * AU, 1),
    frac: r(ill.phase_fraction, 5), elong: r(A.MoonPhase(t)), lib: [r(lib.elat, 3), r(lib.elon, 3)],
    alt: r(alt), az: r(az), sunAlt: r(salt), sunAz: r(saz),
    limb: r(clock(sunFromMoon), 3), north: r(clock(pole), 3), cnorth: r(clock([Math.cos(lat * RAD), 0, Math.sin(lat * RAD)]), 3),
    rise: ev(() => A.SearchRiseSet(A.Body.Moon, obs, +1, t, 1.2)), set: ev(() => A.SearchRiseSet(A.Body.Moon, obs, -1, t, 1.2)),
    transit: ev(() => A.SearchHourAngle(A.Body.Moon, obs, 0, t).time),
    full: ev(() => A.SearchMoonPhase(180, t, 40)), newMoon: ev(() => A.SearchMoonPhase(0, t, 40))
  };
}
const samples = [], t0 = Date.UTC(1950, 0, 1), t1 = Date.UTC(2075, 0, 1);
/* casos fijos: el ejemplo de las notas (13 nov 2026) y los extremos de latitud */
const fixed = [[Date.UTC(2026, 10, 13, 18), 42.88, -8.54], [Date.UTC(2026, 10, 13, 9, 30), -33.87, 151.21], [Date.UTC(2026, 10, 14, 0), -0.18, -78.47], [Date.UTC(2026, 10, 25, 0, 20), 40.42, -3.70], [Date.UTC(2000, 0, 1, 12), 0, 0], [Date.UTC(2026, 7, 12, 17, 46), 43.36, -5.85]];
for (const f of fixed) samples.push(sample(...f));
while (samples.length < N) samples.push(sample(Math.round(t0 + rnd() * (t1 - t0)), r(Math.asin(2 * rnd() - 1) * DEG * 0.94, 2), r(rnd() * 360 - 180, 2)));
let ver = ''; try { let d = path.dirname(require.resolve('astronomy-engine')); while (!fs.existsSync(path.join(d, 'package.json'))) d = path.dirname(d); ver = JSON.parse(fs.readFileSync(path.join(d, 'package.json'), 'utf8')).version; } catch (e) {}
const out = { fuente: 'astronomy-engine ' + ver + ' (sin refracción; salidas y puestas con su refracción estándar)', generado: new Date().toISOString().slice(0, 10), muestras: samples };
fs.writeFileSync(path.join(__dirname, 'luna-ref.json'), JSON.stringify(out).replace(/\},\{"ms"/g, '},\n{"ms"') + '\n');
console.log('muestras:', samples.length, (fs.statSync(path.join(__dirname, 'luna-ref.json')).size / 1024).toFixed(1) + ' KB');
