/* Catálogo de objetos: tamaño en metros, categoría e icono. Aquí no hay texto: los nombres y las descripciones
   están en escalas-textos.<idioma>.js, con el mismo id. */
const CATS = {
  fis: { col: '#b794f6' },
  qui: { col: '#5ee0ff' },
  bio: { col: '#7ee8a2' },
  hum: { col: '#ffd166' },
  geo: { col: '#5fb3ff' },
  ast: { col: '#ff9a6a' },
  cos: { col: '#f58ef5' },
};

/* Reinos: tramos de log10(tamaño focal, en metros) con su tinte. [límite superior, id, tinte]. */
const REALMS = [
  [-15, 'cuantico', '#b794f6'],
  [-10, 'nucleos', '#c084fc'],
  [-7, 'atomos', '#5ee0ff'],
  [-4, 'micro', '#7ee8a2'],
  [2.3, 'humana', '#ffd166'],
  [6.37, 'geo', '#5fb3ff'],
  [9.1, 'planetas', '#ff9a6a'],
  [13.6, 'estrellas', '#fbbf24'],
  [18.6, 'vecindario', '#f472b6'],
  [22.4, 'galaxias', '#f58ef5'],
  [99, 'cosmos', '#c4b5fd'],
];

const GLUCOSE = (() => {
  const atoms = [], bonds = [];
  for (let k = 0; k < 6; k++) {
    const a = -Math.PI / 2 + k * Math.PI / 3, ox = k === 0;
    atoms.push([+(50 + 22 * Math.cos(a)).toFixed(1), +(50 + 22 * Math.sin(a)).toFixed(1), 9, ox ? '#fca5a5' : '#cbd5e1', ox ? '#991b1b' : '#334155']);
    bonds.push([k, (k + 1) % 6]);
  }
  for (let k = 1; k < 6; k++) {
    const a = -Math.PI / 2 + k * Math.PI / 3, c = k === 5;
    atoms.push([+(50 + 42 * Math.cos(a)).toFixed(1), +(50 + 42 * Math.sin(a)).toFixed(1), 6.5, c ? '#cbd5e1' : '#fca5a5', c ? '#334155' : '#991b1b']);
    bonds.push([k, atoms.length - 1]);
  }
  return { atoms, bonds };
})();

const sunDot = (x, r) => `<circle cx="${x}" cy="50" r="${r}" fill="#fde047"/><circle cx="${x}" cy="50" r="${r * 1.8}" fill="#fde047" opacity=".3"/>`;
const earthDot = (x, r) => `<circle cx="${x}" cy="50" r="${r}" fill="#3b82f6"/><circle cx="${x - r * .3}" cy="${50 - r * .3}" r="${r * .45}" fill="#4ade80"/>`;
const miniGal = (x, rot) => `<g transform="translate(${x} 50) rotate(${rot})"><ellipse rx="9" ry="3.2" fill="#c7d2fe" opacity=".9"/><ellipse rx="3" ry="2" fill="#fff"/></g>`;

/* s = tamaño en metros. k: 'd' = distancia, 'w' = longitud de onda; sin k = objeto. i = icono: [nombre, opciones]. */
const OBJECTS = [
  { id: 'planck', s: 1.616e-35, c: 'fis', i: ['planck'] },
  { id: 'cuerda', s: 1e-34, c: 'fis', i: ['string', {}] },
  { id: 'quark', s: 1e-18, c: 'fis', i: ['particle', { col: '#fdba74', label: 'u' }] },
  { id: 'electron', s: 1.05e-18, c: 'fis', i: ['particle', { col: '#c4b5fd', label: 'e⁻' }] },
  { id: 'proton', s: 1.7e-15, c: 'fis', i: ['proton'] },
  { id: 'carbono-n', s: 5.5e-15, c: 'fis', i: ['nucleus', { n: 12, seed: 2 }] },
  { id: 'uranio-n', s: 1.5e-14, c: 'fis', i: ['nucleus', { n: 238, seed: 9 }] },
  { id: 'gamma', s: 1e-12, c: 'fis', k: 'w', i: ['wave', { col: '#c084fc' }] },
  { id: 'rayosx', s: 1e-10, c: 'fis', k: 'w', i: ['wave', { col: '#a5b4fc' }] },
  { id: 'hidrogeno', s: 1.06e-10, c: 'qui', i: ['atom', { col: '#5ee0ff', shells: [1] }] },
  { id: 'agua', s: 2.75e-10, c: 'qui', i: ['molecule', { atoms: [[50, 58, 24, '#ff8a8a', '#b91c1c'], [20, 30, 14, '#ffffff', '#94a3b8'], [80, 30, 14, '#ffffff', '#94a3b8']], bonds: [[0, 1], [0, 2]] }] },
  { id: 'cesio', s: 5.3e-10, c: 'qui', i: ['atom', { col: '#fbbf24', shells: [2, 8, 18, 18, 8, 1], nucR: 4 }] },
  { id: 'fulereno', s: 7.1e-10, c: 'qui', i: ['cage', { c1: '#9ca3af', c2: '#1f2937', col: '#e5e7eb', n: 60 }] },
  { id: 'glucosa', s: 9e-10, c: 'qui', i: ['molecule', GLUCOSE] },
  { id: 'adn', s: 2e-9, c: 'bio', i: ['dna'] },
  { id: 'hemoglobina', s: 6e-9, c: 'bio', i: ['hemo'] },
  { id: 'anticuerpo', s: 1.2e-8, c: 'bio', i: ['antibody'] },
  { id: 'transistor', s: 2e-8, c: 'hum', i: ['transistor'] },
  { id: 'ribosoma', s: 2.5e-8, c: 'bio', i: ['ribosome'] },
  { id: 'rinovirus', s: 3e-8, c: 'bio', i: ['cage', { c1: '#86efac', c2: '#14532d', col: '#dcfce7', n: 42 }] },
  { id: 'coronavirus', s: 1e-7, c: 'bio', i: ['corona'] },
  { id: 'fago', s: 2e-7, c: 'bio', i: ['phage'] },
  { id: 'uv', s: 3e-7, c: 'fis', k: 'w', i: ['wave', { col: '#8b5cf6' }] },
  { id: 'visible', s: 5.5e-7, c: 'fis', k: 'w', i: ['wave', { col: '#4ade80' }] },
  { id: 'mitocondria', s: 1e-6, c: 'bio', i: ['mito'] },
  { id: 'ecoli', s: 2e-6, c: 'bio', i: ['bacterium'] },
  { id: 'globulo', s: 7.5e-6, c: 'bio', i: ['redcell'] },
  { id: 'polen', s: 3e-5, c: 'bio', i: ['pollen'] },
  { id: 'pixel', s: 6e-5, c: 'hum', i: ['pixel'] },
  { id: 'cabello', s: 7e-5, c: 'hum', i: ['hair'] },
  { id: 'ovulo', s: 1.2e-4, c: 'bio', i: ['ovum'] },
  { id: 'acaro', s: 3e-4, c: 'bio', i: ['mite'] },
  { id: 'tardigrado', s: 4e-4, c: 'bio', i: ['tardigrade'] },
  { id: 'arena', s: 5e-4, c: 'geo', i: ['sand'] },
  { id: 'hormiga', s: 3e-3, c: 'bio', i: ['ant'] },
  { id: 'arroz', s: 7e-3, c: 'hum', i: ['rice'] },
  { id: 'moneda', s: 2.325e-2, c: 'hum', i: ['coin'] },
  { id: 'tenis', s: 6.7e-2, c: 'hum', i: ['tennis'] },
  { id: 'microondas', s: 0.122, c: 'fis', k: 'w', i: ['wave', { col: '#fb7185' }] },
  { id: 'movil', s: 0.15, c: 'hum', i: ['phone'] },
  { id: 'balon', s: 0.22, c: 'hum', i: ['football'] },
  { id: 'gato', s: 0.46, c: 'bio', i: ['cat'] },
  { id: 'humano', s: 1.7, c: 'hum', i: ['human'] },
  { id: 'fm', s: 3, c: 'fis', k: 'w', i: ['wave', { col: '#f59e0b' }] },
  { id: 'coche', s: 4.5, c: 'hum', i: ['car'] },
  { id: 'elefante', s: 6.5, c: 'bio', i: ['elephant'] },
  { id: 'trex', s: 12, c: 'bio', i: ['trex'] },
  { id: 'ballena', s: 27, c: 'bio', i: ['whale'] },
  { id: 'a380', s: 73, c: 'hum', i: ['plane'] },
  { id: 'secuoya', s: 84, c: 'bio', i: ['sequoia'] },
  { id: 'libertad', s: 93, c: 'hum', i: ['liberty'] },
  { id: 'campo', s: 105, c: 'hum', i: ['field'] },
  { id: 'iss', s: 109, c: 'hum', i: ['iss'] },
  { id: 'piramide', s: 230, c: 'hum', i: ['pyramid'] },
  { id: 'am', s: 300, c: 'fis', k: 'w', i: ['wave', { col: '#f97316' }] },
  { id: 'eiffel', s: 330, c: 'hum', i: ['eiffel'] },
  { id: 'bennu', s: 490, c: 'ast', i: ['asteroid', { seed: 17 }] },
  { id: 'burj', s: 828, c: 'hum', i: ['burj'] },
  { id: 'everest', s: 8849, c: 'geo', i: ['everest'] },
  { id: 'marianas', s: 1.09e4, c: 'geo', i: ['mariana'] },
  { id: 'manhattan', s: 2.16e4, c: 'geo', i: ['manhattan'] },
  { id: 'fobos', s: 2.22e4, c: 'ast', i: ['asteroid', { seed: 27, craters: 7, c1: '#9a8f86', c2: '#2f2824' }] },
  { id: 'olympus', s: 6e5, c: 'ast', i: ['olympus'] },
  { id: 'ceres', s: 9.4e5, c: 'ast', i: ['planet', { c1: '#b5b5b5', c2: '#3a3a3a', craters: 7, seed: 12, extra: '<circle cx="58" cy="38" r="3" fill="#fff" opacity=".9"/>' }] },
  { id: 'iberia', s: 1.1e6, c: 'geo', i: ['iberia'] },
  { id: 'barrera', s: 2.3e6, c: 'geo', i: ['reef'] },
  { id: 'pluton', s: 2.377e6, c: 'ast', i: ['planet', { c1: '#f3e3cf', c2: '#7a4a2e', seed: 14, extra: '<path d="M54 50 C54 43 63 41 66 47 C69 41 78 43 78 50 C78 60 66 67 66 67 C66 67 54 60 54 50 Z" fill="#fff5ea" opacity=".9"/><ellipse cx="34" cy="60" rx="12" ry="8" fill="#5b3421" opacity=".55"/><ellipse cx="44" cy="32" rx="9" ry="5" fill="#5b3421" opacity=".4"/>' }] },
  { id: 'luna', s: 3.474e6, c: 'ast', i: ['planet', { c1: '#e5e7eb', c2: '#4b5563', craters: 9, seed: 3 }] },
  { id: 'mercurio', s: 4.879e6, c: 'ast', i: ['planet', { c1: '#d6d3d1', c2: '#44403c', craters: 11, seed: 4 }] },
  { id: 'ganimedes', s: 5.268e6, c: 'ast', i: ['planet', { c1: '#d9c7ad', c2: '#4a3728', craters: 6, seed: 8, spots: [[36, 40, 16, 12, '#6b4f3a', .45, -20], [66, 62, 12, 9, '#6b4f3a', .4, 25]] }] },
  { id: 'marte', s: 6.779e6, c: 'ast', i: ['planet', { c1: '#fb923c', c2: '#7c2d12', cap: true, spots: [[40, 46, 14, 8, '#7f1d1d', .5, -20], [64, 60, 10, 6, '#7f1d1d', .45, 15]] }] },
  { id: 'tierra', s: 1.2742e7, c: 'ast', i: ['planet', { c1: '#60a5fa', c2: '#1e3a8a', glow: '#93c5fd', extra: '<path d="M22 30 Q34 22 42 30 Q46 42 38 50 Q30 52 26 44 Z" fill="#4ade80"/><path d="M50 22 Q68 18 76 30 Q74 42 62 44 Q52 40 50 30 Z" fill="#4ade80"/><path d="M40 60 Q52 54 60 62 Q62 76 52 82 Q42 80 40 70 Z" fill="#4ade80"/><ellipse cx="30" cy="62" rx="14" ry="4" fill="#fff" opacity=".55"/><ellipse cx="66" cy="54" rx="12" ry="3.5" fill="#fff" opacity=".5"/><ellipse cx="50" cy="8" rx="18" ry="5" fill="#fff" opacity=".8"/>' }] },
  { id: 'neptuno', s: 4.924e7, c: 'ast', i: ['planet', { c1: '#60a5fa', c2: '#1e3a8a', bands: [[30, 6, '#93c5fd', .25], [58, 8, '#1d4ed8', .35]], spots: [[60, 42, 10, 6, '#1e3a8a', .6, 0]] }] },
  { id: 'saturno', s: 1.2054e8, c: 'ast', i: ['planet', { c1: '#f5deb3', c2: '#8a6a34', bands: [[20, 6, '#d4b483', .5], [34, 4, '#fff', .25], [48, 10, '#c99a5b', .4], [66, 6, '#d4b483', .45], [80, 6, '#b08650', .4]], ring: { col: '#e7d3a8', rx: 78, ry: 20, w: 11, tilt: -20 } }] },
  { id: 'jupiter', s: 1.3982e8, c: 'ast', i: ['planet', { c1: '#f6e2c0', c2: '#8a5a2b', bands: [[18, 7, '#c88a4a', .5], [32, 5, '#fff', .3], [42, 9, '#b5703a', .55], [58, 5, '#fff', .25], [66, 8, '#c88a4a', .5], [80, 6, '#a85f2f', .4]], spots: [[62, 58, 10, 6, '#c2410c', .9, 0]] }] },
  { id: 'tierra-luna', s: 3.844e8, c: 'ast', k: 'd', i: ['distance', { a: earthDot(12, 7), b: '<circle cx="88" cy="50" r="2.2" fill="#d4d4d8"/>' }] },
  { id: 'sol', s: 1.3914e9, c: 'ast', i: ['star', { c1: '#fff7cc', c2: '#fbbf24', c3: '#f97316' }] },
  { id: 'sirio', s: 2.38e9, c: 'ast', i: ['star', { c1: '#ffffff', c2: '#bfdbfe', c3: '#60a5fa', seed: 5 }] },
  { id: 'sgra', s: 2.4e10, c: 'ast', i: ['blackhole', { col: '#fb923c' }] },
  { id: 'arturo', s: 3.53e10, c: 'ast', i: ['star', { c1: '#fff3d6', c2: '#fb923c', c3: '#c2410c', seed: 7 }] },
  { id: 'aldebaran', s: 6.12e10, c: 'ast', i: ['star', { c1: '#ffe9d6', c2: '#f97316', c3: '#9a3412', seed: 11 }] },
  { id: 'rigel', s: 1.1e11, c: 'ast', i: ['star', { c1: '#ffffff', c2: '#93c5fd', c3: '#2563eb', seed: 13 }] },
  { id: 'ua', s: 1.495978707e11, c: 'ast', k: 'd', i: ['distance', { a: sunDot(12, 7), b: earthDot(88, 2.4) }] },
  { id: 'betelgeuse', s: 1.1e12, c: 'ast', i: ['star', { c1: '#ffd6c2', c2: '#ef4444', c3: '#7f1d1d', seed: 17 }] },
  { id: 'stephenson', s: 3e12, c: 'ast', i: ['star', { c1: '#fcbfa8', c2: '#dc2626', c3: '#450a0a', seed: 19 }] },
  { id: 'sistema-solar', s: 9e12, c: 'ast', i: ['solarsystem'] },
  { id: 'dia-luz', s: 2.59e13, c: 'ast', k: 'd', i: ['beam', { label: '24 h' }] },
  { id: 'heliosfera', s: 3.6e13, c: 'ast', i: ['helio'] },
  { id: 'm87', s: 3.8e13, c: 'cos', i: ['blackhole', { col: '#f59e0b' }] },
  { id: 'anio-luz', s: 9.4607e15, c: 'ast', k: 'd', i: ['beam', {}] },
  { id: 'oort', s: 3e16, c: 'ast', i: ['oort'] },
  { id: 'proxima', s: 4.02e16, c: 'ast', k: 'd', i: ['distance', { a: sunDot(12, 5), b: '<circle cx="88" cy="50" r="2.4" fill="#f87171"/>' }] },
  { id: 'cangrejo', s: 1.04e17, c: 'cos', i: ['nebula', { blobs: [[50, 50, 36, 30, '#fb923c', .5, 20], [50, 50, 24, 20, '#c084fc', .5, -30], [48, 52, 12, 10, '#fff', .35, 0]], fil: [['M20 30 Q40 50 30 70', '#fdba74', 1.6, .7], ['M70 24 Q56 50 74 74', '#fdba74', 1.6, .7], ['M30 22 Q50 40 72 30', '#fca5a5', 1.2, .6], ['M28 76 Q50 60 70 78', '#fca5a5', 1.2, .6]], stars: 18, seed: 51 }] },
  { id: 'orion', s: 2.27e17, c: 'cos', i: ['nebula', { blobs: [[50, 52, 40, 32, '#f472b6', .55, 15], [40, 40, 24, 20, '#a78bfa', .5, 0], [62, 60, 22, 18, '#38bdf8', .45, -20], [50, 46, 10, 8, '#fff', .55, 0]], stars: 30, seed: 53, extra: '<circle cx="48" cy="44" r="1.6" fill="#fff"/><circle cx="53" cy="47" r="1.4" fill="#fff"/><circle cx="51" cy="42" r="1.2" fill="#fff"/><circle cx="47" cy="49" r="1.2" fill="#fff"/>' }] },
  { id: 'burbuja', s: 2.84e18, c: 'cos', i: ['bubble'] },
  { id: 'brazo', s: 3.3e19, c: 'cos', i: ['arm'] },
  { id: 'nube-magallanes', s: 3e20, c: 'cos', i: ['irregular'] },
  { id: 'via-lactea', s: 1e21, c: 'cos', i: ['galaxy', { bar: 16, rot: -20, tilt: .55, seed: 5 }] },
  { id: 'andromeda', s: 2.1e21, c: 'cos', i: ['galaxy', { tilt: .38, rot: -32, seed: 6, c2: '#93c5fd', c3: '#fde68a' }] },
  { id: 'dist-andromeda', s: 2.37e22, c: 'cos', k: 'd', i: ['distance', { a: miniGal(12, -25), b: miniGal(88, 20) }] },
  { id: 'virgo', s: 6.8e22, c: 'cos', i: ['cluster'] },
  { id: 'grupo-local', s: 9.5e22, c: 'cos', i: ['group'] },
  { id: 'bootes', s: 3.1e24, c: 'cos', i: ['voidf'] },
  { id: 'laniakea', s: 4.9e24, c: 'cos', i: ['laniakea'] },
  { id: 'muralla', s: 9.5e25, c: 'cos', i: ['wall'] },
  { id: 'universo', s: 8.8e26, c: 'cos', i: ['universe'] },
];
