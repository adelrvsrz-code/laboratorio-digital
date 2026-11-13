/* Herramienta de desarrollo: calcula a qué altitud se queda un haz vertical de rayos X
   o gamma que llega del espacio, y la imprime como pares [longitud de onda (m), km]
   listos para pegar en ATMOS.perfil de espectro-data.js. No forma parte de la exposición.

   Criterio: altitud a la que la atmósfera que queda por encima suma una profundidad
   óptica de 1 (el haz se ha reducido a 1/e).

   Datos:
   - Coeficiente de atenuación másico del aire seco, μ/ρ, de 1 keV a 20 MeV: tablas del
     NIST (Hubbell y Seltzer, «X-Ray Mass Attenuation Coefficients», tabla 4, «Air, Dry
     (Near Sea Level)»). Incluye dispersión, así que marca dónde un fotón deja de ir en
     línea recta con su energía, no dónde se deposita toda.
   - Por encima de 20 MeV manda la creación de pares y μ/ρ tiende a 7/(9·X0), con
     X0 = 36,62 g/cm² para el aire. Entre 20 MeV y 1 GeV se interpola entre ambos valores:
     el mínimo real, cerca de 50 MeV, queda algo por debajo (medio kilómetro de altitud).
   - Presión según la U.S. Standard Atmosphere 1976: fórmulas por capas hasta 86 km y
     valores tabulados por encima. Masa de aire por encima = presión / gravedad.

   Uso: node espectro-atm-gen.js            imprime la tabla
        require('./espectro-atm-gen.js')    expone tauAlt(E_MeV), para espectro-check.js */
const NIST_AIR = [ // [MeV, cm²/g]
  [1e-3, 3606], [1.5e-3, 1191], [2e-3, 527.9], [3e-3, 162.5], [3.2029e-3, 134.0], [3.2029e-3, 148.5], [4e-3, 77.88], [5e-3, 40.27],
  [6e-3, 23.41], [8e-3, 9.921], [1e-2, 5.120], [1.5e-2, 1.614], [2e-2, 0.7779], [3e-2, 0.3538], [4e-2, 0.2485], [5e-2, 0.2080],
  [6e-2, 0.1875], [8e-2, 0.1662], [0.1, 0.1541], [0.15, 0.1356], [0.2, 0.1233], [0.3, 0.1067], [0.4, 0.09549], [0.5, 0.08712],
  [0.6, 0.08055], [0.8, 0.07074], [1, 0.06358], [1.25, 0.05687], [1.5, 0.05175], [2, 0.04447], [3, 0.03581], [4, 0.03079],
  [5, 0.02751], [6, 0.02522], [8, 0.02225], [10, 0.02045], [15, 0.01810], [20, 0.01705],
];
const X0_AIR = 36.62, PAIR = 7 / (9 * X0_AIR);       // cm²/g
function muRho(E) {
  const T = NIST_AIR, n = T.length;
  if (E < T[0][0]) throw new Error('fuera de la tabla: ' + E + ' MeV');
  if (E >= 1000) return PAIR;
  if (E >= 20) { const t = Math.log(E / 20) / Math.log(1000 / 20); return Math.exp(Math.log(T[n - 1][1]) * (1 - t) + Math.log(PAIR) * t); }
  let i = 0; while (i < n - 2 && T[i + 1][0] <= E) i++;
  const [e0, m0] = T[i], [e1, m1] = T[i + 1];
  if (e1 === e0) return m1;
  return Math.exp(Math.log(m0) + (Math.log(m1) - Math.log(m0)) * Math.log(E / e0) / Math.log(e1 / e0));
}

/* U.S. Standard Atmosphere 1976 */
const G0 = 9.80665, R0 = 6356.766, GMR = 34.163195;  // m/s², km, K/km (g0·M/R*)
const LAYERS = [ // [altitud geopotencial de la base (km), temperatura (K), gradiente (K/km), presión (Pa)]
  [0, 288.15, -6.5, 101325], [11, 216.65, 0, 22632.1], [20, 216.65, 1, 5474.89], [32, 228.65, 2.8, 868.019],
  [47, 270.65, 0, 110.906], [51, 270.65, -2.8, 66.9389], [71, 214.65, -2, 3.95642],
];
const HIGH = [[86, 0.37338], [90, 0.18359], [91, 0.15381], [100, 0.032011], [110, 0.0071042], [120, 0.0025382]]; // [km geométricos, Pa]
function pressure(z) {            // z en km geométricos
  if (z >= 86) {
    let i = 0; while (i < HIGH.length - 2 && HIGH[i + 1][0] <= z) i++;
    const [z0, p0] = HIGH[i], [z1, p1] = HIGH[i + 1];
    return Math.exp(Math.log(p0) + (Math.log(p1) - Math.log(p0)) * (z - z0) / (z1 - z0));
  }
  const h = R0 * z / (R0 + z); let i = 0; while (i < LAYERS.length - 1 && LAYERS[i + 1][0] <= h) i++;
  const [hb, tb, lb, pb] = LAYERS[i];
  return lb ? pb * Math.pow(tb / (tb + lb * (h - hb)), GMR / lb) : pb * Math.exp(-GMR * (h - hb) / tb);
}
const gravity = z => G0 * (R0 / (R0 + z)) ** 2;
const column = z => pressure(z) / gravity(z) * 0.1;   // g/cm² de aire por encima de z

function tauAlt(E) {              // E en MeV → km
  const need = 1 / muRho(E);
  if (column(0) < need) return 0;
  let a = 0, b = 120;
  for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (column(m) > need) a = m; else b = m; }
  return (a + b) / 2;
}

module.exports = { tauAlt, muRho, pressure, column };

if (require.main === module) {
  const HC = 1.239841984e-12;     // MeV·m
  const E = [1e-3, 2e-3, 3e-3, 5e-3, 8e-3, 1.24e-2, 2e-2, 3e-2, 5e-2, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 100, 1e3, 1e6, 1e9];
  console.log('// E (MeV)  μ/ρ (cm²/g)  columna (g/cm²)  altitud (km)');
  for (const e of E) console.log('//', e.toExponential(2).padStart(9), muRho(e).toExponential(3).padStart(10), (1 / muRho(e)).toExponential(3).padStart(10), tauAlt(e).toFixed(1).padStart(6));
  console.log(E.slice().reverse().map(e => `[${Number((HC / e).toPrecision(3)).toExponential()}, ${Math.round(tauAlt(e))}]`).join(', '));
  /* autocomprobación de la atmósfera contra valores tabulados */
  for (const [z, p] of [[11, 22632 * Math.exp(-GMR * (R0 * 11 / (R0 + 11) - 11) / 216.65)], [47.35, 110.9], [71.802, 3.9564], [86, 0.37338]]) if (Math.abs(pressure(z) / p - 1) > 5e-3) console.log('AVISO: presión a', z, 'km =', pressure(z), 'esperada', p);
}
