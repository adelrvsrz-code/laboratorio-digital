/* Física del espectro: conversiones, atmósfera y color. Funciones puras, sin DOM.
   Las tablas (ATMOS, BANDS) viven en espectro-data.js y se leen al llamar, no al cargar. */
const FIS = (() => {
  const C = 299792458;                 // m/s, exacto
  const H_EV = 4.135667696e-15;        // constante de Planck en eV·s (SI 2019)
  const LGC = Math.log10(C);
  const lg = Math.log10;
  // de la unidad habitual de cada zona del espectro a hercios
  const m = x => C / x, cm = x => C / (x * 1e-2), mm = x => C / (x * 1e-3), um = x => C / (x * 1e-6), nm = x => C / (x * 1e-9);
  const eV = x => x / H_EV, keV = x => eV(x * 1e3), MeV = x => eV(x * 1e6), GeV = x => eV(x * 1e9), TeV = x => eV(x * 1e12), PeV = x => eV(x * 1e15);
  const lamOf = f => C / f, evOf = f => f * H_EV;
  const wien = T => 2.897771955e-3 / T;  // máximo por longitud de onda de un cuerpo negro, en metros

  /* Altitud (km) a la que se queda la radiación que llega del espacio, según el
     logaritmo de su longitud de onda. Interpola el perfil esquemático ATMOS.perfil. */
  let prof = null;
  function atmAlt(lgLam) {
    if (!prof) prof = ATMOS.perfil.map(p => [lg(p[0]), p[1]]);
    const n = prof.length;
    if (lgLam <= prof[0][0]) return prof[0][1];
    if (lgLam >= prof[n - 1][0]) return prof[n - 1][1];
    let a = 0, b = n - 1;
    while (b - a > 1) { const k = (a + b) >> 1; if (prof[k][0] <= lgLam) a = k; else b = k; }
    const t = (lgLam - prof[a][0]) / (prof[b][0] - prof[a][0] || 1);
    return prof[a][1] + (prof[b][1] - prof[a][1]) * t;
  }
  function atmCause(lam) { for (const c of ATMOS.causas) if (lam <= c.hasta) return c; return ATMOS.causas[ATMOS.causas.length - 1]; }

  function bandOf(f) { for (let i = 0; i < BANDS.length; i++) if (f < BANDS[i].hasta) return i; return BANDS.length - 1; }

  /* Color con el que se pinta cada frecuencia. Dentro del visible es una
     aproximación propia al color real; fuera, un color convenido por banda. */
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const KEYS = [
    [7.5, hex('#5fb3ff')], [10, hex('#5ee0ff')], [12.9, hex('#ff9a6a')], [14.3, [214, 60, 44]],
    [lg(nm(750)), [150, 0, 0]], [lg(nm(700)), [225, 0, 0]], [lg(nm(645)), [255, 35, 0]], [lg(nm(610)), [255, 140, 0]],
    [lg(nm(580)), [255, 232, 0]], [lg(nm(555)), [150, 255, 0]], [lg(nm(510)), [0, 245, 90]], [lg(nm(490)), [0, 205, 255]],
    [lg(nm(440)), [45, 45, 255]], [lg(nm(380)), [125, 0, 175]],
    [15.25, [140, 90, 230]], [15.9, hex('#b794f6')], [18, hex('#f58ef5')], [21, hex('#7ee8a2')],
  ];
  function colorOf(lgf) {
    const n = KEYS.length;
    if (lgf <= KEYS[0][0]) return KEYS[0][1];
    if (lgf >= KEYS[n - 1][0]) return KEYS[n - 1][1];
    let i = 0; while (KEYS[i + 1][0] < lgf) i++;
    const a = KEYS[i], b = KEYS[i + 1], t = (lgf - a[0]) / (b[0] - a[0]);
    return [Math.round(a[1][0] + (b[1][0] - a[1][0]) * t), Math.round(a[1][1] + (b[1][1] - a[1][1]) * t), Math.round(a[1][2] + (b[1][2] - a[1][2]) * t)];
  }
  return { C, H_EV, LGC, m, cm, mm, um, nm, eV, keV, MeV, GeV, TeV, PeV, lamOf, evOf, wien, atmAlt, atmCause, bandOf, colorOf };
})();
