/* Generadores de iconos SVG originales (viewBox 0 0 100 100). */
const ICON = (() => {
  let _u = 0;
  const uid = () => 'k' + (_u++).toString(36);
  const TAU = Math.PI * 2;
  const f1 = n => Math.round(n * 10) / 10;
  const rnd = seed => { let t = (seed * 2654435761 + 1) >>> 0; return () => { t += 0x6D2B79F5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; };
  const svg = (body, defs = '') => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs ? '<defs>' + defs + '</defs>' : ''}${body}</svg>`;
  const stops = s => s.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('');
  const rg = (id, s, extra = '') => `<radialGradient id="${id}" ${extra}>${stops(s)}</radialGradient>`;
  const lg = (id, s, x1 = 0, y1 = 0, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops(s)}</linearGradient>`;

  const sphere = (c1, c2, r = 46, cx = 50, cy = 50, fx = 36, fy = 32) => {
    const g = uid(), s = uid();
    return {
      defs: rg(g, [[0, c1], [1, c2]], `cx="50%" cy="50%" r="55%" fx="${fx}%" fy="${fy}%"`) + rg(s, [[.55, '#000', 0], [1, '#000', .62]], `cx="50%" cy="50%" r="50%" fx="${fx}%" fy="${fy}%"`),
      fill: `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${g})"/>`,
      shade: `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${s})"/>`,
    };
  };
  const dots = (R, n, shape, col, col2, rmin = .4, rmax = 1.4, o = {}) => {
    let s = '';
    const inner = o.inner || 0, rad = o.rad || 48;
    for (let i = 0; i < n; i++) {
      let x, y;
      if (shape === 'disc') { const a = R() * TAU, d = Math.sqrt(R()) * rad; x = 50 + d * Math.cos(a); y = 50 + d * Math.sin(a); }
      else if (shape === 'ring') { const a = R() * TAU, d = inner + (rad - inner) * R(); x = 50 + d * Math.cos(a); y = 50 + d * Math.sin(a); }
      else { x = R() * 100; y = R() * 100; }
      s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(rmin + R() * (rmax - rmin))}" fill="${col2 && R() > .65 ? col2 : col}" opacity="${f1(.3 + R() * .7)}"/>`;
    }
    return s;
  };
  const smooth = pts => {
    const n = pts.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let m = mid(pts[0], pts[1]), d = `M${f1(m[0])} ${f1(m[1])}`;
    for (let i = 1; i <= n; i++) { const p = pts[i % n], q = pts[(i + 1) % n], mm = mid(p, q); d += `Q${f1(p[0])} ${f1(p[1])} ${f1(mm[0])} ${f1(mm[1])}`; }
    return d + 'Z';
  };
  const blobPath = (cx, cy, r, R, k = .12, n = 16) => { const pts = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, rr = r * (1 + (R() - .5) * 2 * k); pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); } return smooth(pts); };
  const webLines = (seed, nodes, col, rad = 46, links = 2) => {
    const R = rnd(seed), P = [];
    for (let i = 0; i < nodes; i++) { const a = R() * TAU, d = Math.sqrt(R()) * rad; P.push([50 + d * Math.cos(a), 50 + d * Math.sin(a)]); }
    let s = '';
    for (let i = 0; i < nodes; i++) {
      const ds = P.map((p, j) => [Math.hypot(p[0] - P[i][0], p[1] - P[i][1]), j]).sort((a, b) => a[0] - b[0]);
      for (let k = 1; k <= links; k++) { const j = ds[k][1]; if (j > i) s += `<line x1="${f1(P[i][0])}" y1="${f1(P[i][1])}" x2="${f1(P[j][0])}" y2="${f1(P[j][1])}" stroke="${col}" stroke-width=".7" opacity=".4"/>`; }
    }
    for (const p of P) s += `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="1.5" fill="#fff" opacity=".8"/>`;
    return s;
  };
  const ring = (r, cp) => `<g transform="rotate(${r.tilt ?? -18} 50 50)"><ellipse cx="50" cy="50" rx="${r.rx}" ry="${r.ry}" fill="none" stroke="${r.col}" stroke-width="${r.w}" opacity=".9"${cp ? ` clip-path="url(#${cp})"` : ''}/></g>`;

  const I = {};

  /* ---- cuántico y partículas ---- */
  I.planck = () => {
    const g = uid(), R = rnd(7); let foam = '';
    for (let i = 0; i < 7; i++) {
      let d = ''; const y0 = 8 + i * 14;
      for (let x = 0; x <= 100; x += 5) d += (x ? 'L' : 'M') + x + ' ' + f1(y0 + Math.sin(x / 9 + i) * 3 + (R() - .5) * 2);
      foam += `<path d="${d}" fill="none" stroke="#c4b5fd" stroke-width=".6" opacity=".35"/>`;
      let e = ''; const x0 = 8 + i * 14;
      for (let y = 0; y <= 100; y += 5) e += (y ? 'L' : 'M') + f1(x0 + Math.sin(y / 9 + i) * 3 + (R() - .5) * 2) + ' ' + y;
      foam += `<path d="${e}" fill="none" stroke="#c4b5fd" stroke-width=".6" opacity=".35"/>`;
    }
    return svg(`${foam}<circle cx="50" cy="50" r="48" fill="url(#${g})"/><circle cx="50" cy="50" r="6" fill="#fff"/>`, rg(g, [[0, '#ede9fe', .95], [.3, '#a78bfa', .5], [1, '#a78bfa', 0]]));
  };
  I.string = ({ col = '#c084fc' } = {}) => {
    let d = '';
    for (let i = 0; i <= 96; i++) { const a = i / 96 * TAU, r = 34 + 7 * Math.sin(a * 5) + 3 * Math.cos(a * 3 + 1); d += (i ? 'L' : 'M') + f1(50 + r * Math.cos(a)) + ' ' + f1(50 + r * Math.sin(a)); }
    d += 'Z';
    return svg(`<path d="${d}" fill="none" stroke="${col}" stroke-width="7" opacity=".3" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/>`);
  };
  I.particle = ({ col = '#c4b5fd', label = 'e⁻' } = {}) => {
    const g = uid();
    return svg(`<circle cx="50" cy="50" r="50" fill="url(#${g})"/><circle cx="50" cy="50" r="17" fill="${col}"/><text x="50" y="55.5" text-anchor="middle" font-size="15" font-weight="700" font-family="system-ui,sans-serif" fill="#0b0f22">${label}</text>`, rg(g, [[0, col, .65], [.5, col, .18], [1, col, 0]]));
  };
  I.proton = () => {
    const g = uid();
    const q = (x, y, c, l) => `<circle cx="${x}" cy="${y}" r="10" fill="${c}"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-size="11" font-weight="700" font-family="system-ui,sans-serif" fill="#1a0a05">${l}</text>`;
    return svg(`<circle cx="50" cy="50" r="46" fill="url(#${g})"/><path d="M38 40 Q50 48 62 40 M38 40 Q40 56 50 64 M62 40 Q60 56 50 64" fill="none" stroke="#fff" stroke-width="1.5" opacity=".5" stroke-dasharray="3 2"/>${q(38, 40, '#fdba74', 'u')}${q(62, 40, '#fdba74', 'u')}${q(50, 64, '#93c5fd', 'd')}`, rg(g, [[0, '#fb923c', .9], [.8, '#9a3412', .85], [1, '#9a3412', .4]]));
  };
  I.nucleus = ({ n = 12, seed = 2 } = {}) => {
    const r = 46 / Math.sqrt(1.12 * n), cand = [], dx = r * 1.95, dy = dx * .866;
    for (let j = -40; j <= 40; j++) for (let i = -40; i <= 40; i++) { const x = i * dx + (j & 1 ? dx / 2 : 0), y = j * dy; if (Math.hypot(x, y) <= 46 - r) cand.push([x, y]); }
    cand.sort((a, b) => Math.hypot(a[0], a[1]) - Math.hypot(b[0], b[1]));
    const R = rnd(seed); let s = '';
    cand.slice(0, n).forEach(([x, y]) => { const c = R() > .5 ? '#fb7185' : '#60a5fa'; s += `<circle cx="${f1(50 + x)}" cy="${f1(50 + y)}" r="${f1(r)}" fill="${c}"/><circle cx="${f1(50 + x - r * .3)}" cy="${f1(50 + y - r * .3)}" r="${f1(r * .4)}" fill="#fff" opacity=".3"/>`; });
    return svg(s);
  };
  I.wave = ({ col = '#fff', amp = 20 } = {}) => {
    const mk = (x0, x1) => { let d = ''; for (let x = x0; x <= x1; x += 2.5) d += (d ? 'L' : 'M') + x + ' ' + f1(50 - amp * Math.sin(x / 100 * TAU)); return d; };
    const main = mk(0, 100);
    return svg(`<path d="${mk(-100, 0)}" fill="none" stroke="${col}" stroke-width="2.5" opacity=".2" stroke-linecap="round"/><path d="${mk(100, 200)}" fill="none" stroke="${col}" stroke-width="2.5" opacity=".2" stroke-linecap="round"/><path d="${main}" fill="none" stroke="${col}" stroke-width="9" opacity=".25" stroke-linecap="round"/><path d="${main}" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round"/><path d="M0 84 L100 84 M0 80 L0 88 M100 80 L100 88" stroke="${col}" stroke-width="1.2" opacity=".6"/><text x="50" y="97" text-anchor="middle" font-size="12" font-style="italic" font-family="serif" fill="${col}" opacity=".85">λ</text>`);
  };

  /* ---- átomos y moléculas ---- */
  I.atom = ({ col = '#5ee0ff', shells = [1], nucR = 3 } = {}) => {
    const g = uid(), n = shells.length; let b = '';
    shells.forEach((cnt, s) => {
      const r = n === 1 ? 44 : 10 + s * (35 / (n - 1));
      b += `<circle cx="50" cy="50" r="${f1(r)}" fill="none" stroke="${col}" stroke-width=".9" opacity=".5"/>`;
      for (let i = 0; i < cnt; i++) { const a = i / cnt * TAU + s * .7; b += `<circle cx="${f1(50 + r * Math.cos(a))}" cy="${f1(50 + r * Math.sin(a))}" r="${n === 1 ? 3.2 : 1.5}" fill="${col}"/>`; }
    });
    return svg(`<circle cx="50" cy="50" r="48" fill="url(#${g})"/>${b}<circle cx="50" cy="50" r="${nucR + 3}" fill="${col}" opacity=".35"/><circle cx="50" cy="50" r="${nucR}" fill="#fff"/>`, rg(g, [[0, col, .45], [.6, col, .1], [1, col, 0]]));
  };
  I.molecule = ({ atoms = [], bonds = [] } = {}) => {
    let defs = '', body = '', b = '';
    for (const [i, j] of bonds) b += `<line x1="${atoms[i][0]}" y1="${atoms[i][1]}" x2="${atoms[j][0]}" y2="${atoms[j][1]}" stroke="#dfe6ff" stroke-width="5" stroke-linecap="round" opacity=".85"/>`;
    for (const [x, y, r, c1, c2] of atoms) { const s = sphere(c1, c2, r, x, y); defs += s.defs; body += s.fill + s.shade; }
    return svg(b + body, defs);
  };
  I.cage = ({ c1 = '#94a3b8', c2 = '#334155', n = 60, col = '#e2e8f0' } = {}) => {
    const sp = sphere(c1, c2, 46), P = [], ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) { const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), th = ga * i, x = Math.cos(th) * r, z = Math.sin(th) * r; if (z > -.05) P.push([50 + x * 44, 50 + y * 44, z]); }
    let s = '';
    for (let i = 0; i < P.length; i++) {
      const d = P.map((p, j) => [Math.hypot(p[0] - P[i][0], p[1] - P[i][1], (p[2] - P[i][2]) * 44), j]).sort((a, b) => a[0] - b[0]);
      for (let k = 1; k <= 3 && k < d.length; k++) { const j = d[k][1]; if (j > i) s += `<line x1="${f1(P[i][0])}" y1="${f1(P[i][1])}" x2="${f1(P[j][0])}" y2="${f1(P[j][1])}" stroke="${col}" stroke-width="1.2" opacity="${f1(.3 + .6 * (P[i][2] + 1) / 2)}"/>`; }
    }
    for (const p of P) s += `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="2" fill="${col}" opacity="${f1(.4 + .6 * (p[2] + 1) / 2)}"/>`;
    return svg(sp.fill + s + sp.shade, sp.defs);
  };

  /* ---- biología ---- */
  I.dna = ({ c1 = '#60a5fa', c2 = '#f472b6' } = {}) => {
    let a = '', b = '', r = ''; const X = y => 46 * Math.sin(y / 100 * TAU * 1.4);
    for (let y = 0; y <= 100; y += 2) { a += (a ? 'L' : 'M') + f1(50 + X(y)) + ' ' + y; b += (b ? 'L' : 'M') + f1(50 - X(y)) + ' ' + y; }
    for (let y = 3; y <= 100; y += 7) r += `<line x1="${f1(50 + X(y))}" y1="${y}" x2="${f1(50 - X(y))}" y2="${y}" stroke="#e2e8f0" stroke-width="2" opacity=".65"/>`;
    return svg(`${r}<path d="${a}" fill="none" stroke="${c1}" stroke-width="5.5" stroke-linecap="round"/><path d="${b}" fill="none" stroke="${c2}" stroke-width="5.5" stroke-linecap="round"/>`);
  };
  I.hemo = () => {
    const R = rnd(21); let defs = '', body = '';
    for (const [x, y, c1, c2] of [[33, 33, '#f87171', '#7f1d1d'], [67, 33, '#fb923c', '#7c2d12'], [33, 67, '#fb923c', '#7c2d12'], [67, 67, '#f87171', '#7f1d1d']]) {
      const g = uid(); defs += rg(g, [[0, c1], [1, c2]], `cx="40%" cy="35%" r="70%"`);
      body += `<path d="${blobPath(x, y, 24, R, .14)}" fill="url(#${g})"/><rect x="${x - 5}" y="${y - 5}" width="10" height="10" rx="2" fill="#450a0a" transform="rotate(45 ${x} ${y})"/><circle cx="${x}" cy="${y}" r="2.2" fill="#fde68a"/>`;
    }
    return svg(body, defs);
  };
  I.antibody = ({ c1 = '#7ee8a2', c2 = '#2dd4bf' } = {}) => svg(`<path d="M50 94 L50 54 L16 10 M50 54 L84 10" fill="none" stroke="${c1}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 26 L44 50 M74 26 L56 50" fill="none" stroke="${c2}" stroke-width="7" stroke-linecap="round"/><path d="M42 60 L42 94 M58 60 L58 94" stroke="${c1}" stroke-width="5" stroke-linecap="round" opacity=".55"/>`);
  I.transistor = () => svg(`<path d="M8 78 L48 96 L92 76 L52 58 Z" fill="#1e293b" stroke="#475569" stroke-width="1.2"/><path d="M30 52 L30 70 L52 80 L52 62 Z" fill="#64748b"/><path d="M52 62 L52 80 L70 72 L70 54 Z" fill="#94a3b8"/><path d="M30 52 L52 62 L70 54 L48 44 Z" fill="#cbd5e1"/><path d="M40 34 L40 58 L58 66 L58 42 Z" fill="#f59e0b"/><path d="M58 42 L58 66 L66 62 L66 38 Z" fill="#b45309"/><path d="M40 34 L58 42 L66 38 L48 30 Z" fill="#fcd34d"/><path d="M20 20 L48 32 M20 20 L20 12 M70 14 L52 22" stroke="#e2e8f0" stroke-width="1.5" fill="none" opacity=".6"/>`);
  I.ribosome = () => {
    const R = rnd(31), g1 = uid(), g2 = uid();
    return svg(`<path d="M-10 62 Q30 70 50 58 T110 50" fill="none" stroke="#a5b4fc" stroke-width="2.5" opacity=".6"/><path d="${blobPath(50, 64, 34, R, .1, 14)}" fill="url(#${g1})"/><path d="${blobPath(48, 30, 26, R, .12, 12)}" fill="url(#${g2})"/>${dots(R, 40, 'disc', '#fff', null, .6, 1.4)}`, rg(g1, [[0, '#c084fc'], [1, '#581c87']], `cx="40%" cy="35%" r="70%"`) + rg(g2, [[0, '#f0abfc'], [1, '#86198f']], `cx="40%" cy="35%" r="70%"`));
  };
  I.corona = () => {
    const sp = sphere('#fca5a5', '#7f1d1d', 36); let s = '';
    for (let i = 0; i < 20; i++) { const a = i / 20 * TAU, x1 = 50 + 36 * Math.cos(a), y1 = 50 + 36 * Math.sin(a), x2 = 50 + 44 * Math.cos(a), y2 = 50 + 44 * Math.sin(a); s += `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="#fecaca" stroke-width="2.4"/><circle cx="${f1(x2)}" cy="${f1(y2)}" r="4" fill="#fb7185"/>`; }
    return svg(s + sp.fill + `<path d="M34 40 Q50 30 66 44 Q58 60 40 58 Z" fill="#fff" opacity=".12"/>` + sp.shade, sp.defs);
  };
  I.phage = () => svg(`<path d="M50 6 L70 18 L70 42 L50 54 L30 42 L30 18 Z" fill="#a5b4fc" stroke="#e0e7ff" stroke-width="1.2"/><path d="M50 6 L50 54 M30 18 L70 42 M70 18 L30 42" stroke="#e0e7ff" stroke-width=".8" opacity=".6"/><rect x="45" y="54" width="10" height="26" fill="#818cf8"/><path d="M45 58 H55 M45 64 H55 M45 70 H55 M45 76 H55" stroke="#c7d2fe" stroke-width="1"/><path d="M50 80 L30 94 M50 80 L70 94 M50 80 L40 96 M50 80 L60 96 M50 80 L22 86 M50 80 L78 86" stroke="#c7d2fe" stroke-width="2" stroke-linecap="round"/><rect x="40" y="78" width="20" height="5" rx="2" fill="#6366f1"/>`);
  I.bacterium = ({ c1 = '#86efac', c2 = '#166534' } = {}) => {
    const g = uid();
    return svg(`<g transform="rotate(-18 50 50)"><path d="M14 50 Q0 30 -12 40 M14 52 Q2 62 -14 56 M86 48 Q100 30 112 36" fill="none" stroke="#bbf7d0" stroke-width="1.6" opacity=".8"/><rect x="12" y="34" width="76" height="32" rx="16" fill="url(#${g})"/><path d="M34 46 Q50 38 66 48 Q58 58 40 56 Z" fill="#064e3b" opacity=".45"/><rect x="12" y="34" width="76" height="32" rx="16" fill="none" stroke="#fff" stroke-width=".8" opacity=".3"/><path d="M20 38 Q40 36 50 38" stroke="#fff" stroke-width="3" opacity=".25" fill="none" stroke-linecap="round"/></g>`, lg(g, [[0, c1], [1, c2]], 0, 0, .3, 1));
  };
  I.mito = () => {
    const g = uid(); let cr = '';
    for (let i = 0; i < 7; i++) { const x = 20 + i * 10; cr += `<path d="M${x} ${i % 2 ? 36 : 64} Q${x + 5} 50 ${x} ${i % 2 ? 64 : 36}" fill="none" stroke="#fde68a" stroke-width="2.2" opacity=".85"/>`; }
    return svg(`<rect x="6" y="26" width="88" height="48" rx="24" fill="url(#${g})"/><rect x="12" y="32" width="76" height="36" rx="18" fill="none" stroke="#fde68a" stroke-width="1.5" opacity=".5"/>${cr}`, lg(g, [[0, '#fb923c'], [1, '#9a3412']], 0, 0, .4, 1));
  };
  I.redcell = () => {
    const g = uid(), d = uid();
    return svg(`<circle cx="50" cy="50" r="46" fill="url(#${g})"/><circle cx="50" cy="50" r="24" fill="url(#${d})"/><ellipse cx="34" cy="30" rx="12" ry="6" fill="#fff" opacity=".18" transform="rotate(-30 34 30)"/>`, rg(g, [[0, '#ef4444'], [.6, '#dc2626'], [1, '#7f1d1d']], `cx="50%" cy="50%" r="55%" fx="40%" fy="35%"`) + rg(d, [[0, '#991b1b', .9], [1, '#991b1b', 0]]));
  };
  I.pollen = () => {
    const sp = sphere('#fde047', '#a16207', 32); let s = '';
    for (let i = 0; i < 18; i++) { const a = i / 18 * TAU, x2 = 50 + 46 * Math.cos(a), y2 = 50 + 46 * Math.sin(a), px = 50 + 30 * Math.cos(a + .14), py = 50 + 30 * Math.sin(a + .14), qx = 50 + 30 * Math.cos(a - .14), qy = 50 + 30 * Math.sin(a - .14); s += `<path d="M${f1(px)} ${f1(py)} L${f1(x2)} ${f1(y2)} L${f1(qx)} ${f1(qy)} Z" fill="#facc15"/>`; }
    return svg(s + sp.fill + dots(rnd(44), 30, 'disc', '#713f12', null, 1, 2.2, { rad: 28 }) + sp.shade, sp.defs);
  };
  I.pixel = () => svg(`<rect x="2" y="2" width="96" height="96" rx="6" fill="#0b0f1f"/><rect x="8" y="8" width="26" height="84" rx="3" fill="#ef4444"/><rect x="37" y="8" width="26" height="84" rx="3" fill="#22c55e"/><rect x="66" y="8" width="26" height="84" rx="3" fill="#3b82f6"/><rect x="8" y="8" width="84" height="40" fill="#fff" opacity=".12"/>`);
  I.hair = () => {
    const g = uid(); let sc = '';
    for (let i = 0; i < 12; i++) sc += `<path d="M50 50 L${f1(50 + 46 * Math.cos(i / 12 * TAU))} ${f1(50 + 46 * Math.sin(i / 12 * TAU))}" stroke="#78350f" stroke-width=".8" opacity=".35"/>`;
    return svg(`<circle cx="50" cy="50" r="46" fill="url(#${g})"/>${sc}<circle cx="50" cy="50" r="30" fill="none" stroke="#fcd34d" stroke-width="1" opacity=".5"/><circle cx="50" cy="50" r="12" fill="#451a03" opacity=".8"/><circle cx="50" cy="50" r="46" fill="none" stroke="#fde68a" stroke-width="2" opacity=".6"/>`, rg(g, [[0, '#b45309'], [.7, '#78350f'], [1, '#451a03']]));
  };
  I.ovum = () => {
    const sp = sphere('#fde68a', '#b45309', 34); let cor = '';
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; cor += `<circle cx="${f1(50 + 42 * Math.cos(a))}" cy="${f1(50 + 42 * Math.sin(a))}" r="5.5" fill="#fbcfe8" opacity=".85"/>`; }
    return svg(`${cor}<circle cx="50" cy="50" r="38" fill="#fff7ed" opacity=".35"/>${sp.fill}<circle cx="46" cy="47" r="10" fill="#9a3412" opacity=".7"/><circle cx="44" cy="45" r="3.5" fill="#fde68a"/>${sp.shade}`, sp.defs);
  };
  I.mite = () => {
    let legs = '';
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const y = 40 + i * 9, x0 = 50 + s * 20, x1 = 50 + s * (34 + i * 2), x2 = 50 + s * (44 + i); legs += `<path d="M${x0} ${y} L${x1} ${y - 6} L${x2} ${y + 6}" fill="none" stroke="#d6d3d1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`; }
    const sp = sphere('#f5f5f4', '#a8a29e', 26, 50, 58);
    return svg(`${legs}<g transform="translate(50 58) scale(.9 1.12) translate(-50 -58)">${sp.fill}<path d="M30 50 Q50 58 70 50 M30 62 Q50 70 70 62 M34 74 Q50 80 66 74" fill="none" stroke="#a8a29e" stroke-width="1" opacity=".6"/>${sp.shade}</g><circle cx="50" cy="28" r="9" fill="#e7e5e4"/><path d="M44 22 L38 14 M56 22 L62 14" stroke="#d6d3d1" stroke-width="2" stroke-linecap="round"/>`, sp.defs);
  };
  I.tardigrade = () => {
    const g = uid(); let legs = '';
    for (let i = 0; i < 4; i++) { const x = 26 + i * 14; legs += `<path d="M${x} 66 Q${x - 3} 80 ${x + 2} 86" fill="none" stroke="#c4b5fd" stroke-width="5" stroke-linecap="round"/><path d="M${x - 1} 86 L${x - 4} 90 M${x + 2} 86 L${x + 3} 91 M${x + 2} 86 L${x + 6} 89" stroke="#ede9fe" stroke-width="1.4" stroke-linecap="round"/>`; }
    return svg(`${legs}<path d="M10 54 Q10 30 34 30 L72 30 Q94 30 94 50 Q94 70 72 70 L34 70 Q10 70 10 54 Z" fill="url(#${g})"/><path d="M30 30 V70 M44 30 V70 M58 30 V70 M72 30 V70" stroke="#4c1d95" stroke-width="1.2" opacity=".5"/><ellipse cx="88" cy="50" rx="6" ry="4" fill="#7c3aed"/><circle cx="84" cy="44" r="1.8" fill="#1e1b4b"/>`, lg(g, [[0, '#c4b5fd'], [1, '#6d28d9']], 0, 0, 0, 1));
  };
  I.sand = () => { const R = rnd(5), g = uid(); return svg(`<path d="${blobPath(50, 50, 42, R, .16, 9)}" fill="url(#${g})"/>${dots(R, 25, 'disc', '#78350f', '#fff', .8, 2, { rad: 34 })}`, rg(g, [[0, '#fcd9a0'], [1, '#b7791f']], `cx="40%" cy="35%" r="70%"`)); };
  I.ant = () => svg(`<g fill="none" stroke="#3b2a1a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M44 46 L30 36 L20 44 M46 50 L32 60 L24 72 M52 50 L48 68 L40 78 M52 48 L64 58 L62 74 M54 46 L68 40 L80 44 M50 46 L58 62 L70 68"/><path d="M26 42 L14 30 M30 40 L22 26"/></g><ellipse cx="72" cy="52" rx="20" ry="13" fill="#5b3a21"/><ellipse cx="49" cy="48" rx="9" ry="7" fill="#4a2e1a"/><circle cx="28" cy="43" r="9" fill="#4a2e1a"/><circle cx="24" cy="41" r="2" fill="#000"/><ellipse cx="66" cy="46" rx="8" ry="3" fill="#fff" opacity=".15"/>`);
  I.rice = () => { const g = uid(); return svg(`<ellipse cx="50" cy="50" rx="46" ry="17" fill="url(#${g})" transform="rotate(-28 50 50)"/><ellipse cx="40" cy="44" rx="18" ry="4" fill="#fff" opacity=".5" transform="rotate(-28 40 44)"/>`, lg(g, [[0, '#fffbeb'], [1, '#d6c7a1']], 0, 0, 0, 1)); };
  I.coin = () => { const g = uid(), s = uid(); return svg(`<circle cx="50" cy="50" r="48" fill="url(#${g})"/><circle cx="50" cy="50" r="34" fill="url(#${s})"/><text x="46" y="62" text-anchor="middle" font-size="34" font-weight="800" font-family="system-ui,sans-serif" fill="#8a6a1a">1</text><text x="66" y="62" text-anchor="middle" font-size="18" font-weight="700" font-family="system-ui,sans-serif" fill="#8a6a1a">€</text><circle cx="50" cy="50" r="48" fill="none" stroke="#fff" stroke-width="1.5" opacity=".35"/><circle cx="50" cy="50" r="34" fill="none" stroke="#7a5a10" stroke-width=".8" opacity=".5"/>`, rg(g, [[0, '#fde68a'], [1, '#b7791f']], `cx="40%" cy="35%" r="70%"`) + rg(s, [[0, '#f8fafc'], [1, '#94a3b8']], `cx="40%" cy="35%" r="70%"`)); };
  I.tennis = () => { const sp = sphere('#f0f9a0', '#9aa31a', 46); return svg(sp.fill + `<path d="M12 30 Q50 54 88 30 M12 70 Q50 46 88 70" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" opacity=".9"/>` + sp.shade, sp.defs); };
  I.phone = () => { const g = uid(); return svg(`<rect x="24" y="2" width="52" height="96" rx="9" fill="#0f172a" stroke="#475569" stroke-width="1.5"/><rect x="28" y="7" width="44" height="86" rx="6" fill="url(#${g})"/><rect x="42" y="9" width="16" height="4" rx="2" fill="#0f172a"/><circle cx="34" cy="16" r="4" fill="#1e293b" opacity=".9"/><path d="M28 7 L72 7 L72 30 Q50 44 28 36 Z" fill="#fff" opacity=".1"/>`, lg(g, [[0, '#38bdf8'], [1, '#6d28d9']], 0, 0, 1, 1)); };
  I.football = () => {
    const sp = sphere('#ffffff', '#9ca3af', 46), cp = uid();
    const pent = (cx, cy, r, rot) => { let d = ''; for (let i = 0; i < 5; i++) { const a = rot + i / 5 * TAU; d += (i ? 'L' : 'M') + f1(cx + r * Math.cos(a)) + ' ' + f1(cy + r * Math.sin(a)); } return `<path d="${d}Z" fill="#1f2937"/>`; };
    let p = pent(50, 50, 12, -Math.PI / 2);
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i / 5 * TAU; p += pent(50 + 34 * Math.cos(a), 50 + 34 * Math.sin(a), 11, a + Math.PI); }
    return svg(`${sp.fill}<g clip-path="url(#${cp})">${p}</g>${sp.shade}`, sp.defs + `<clipPath id="${cp}"><circle cx="50" cy="50" r="46"/></clipPath>`);
  };
  I.car = () => { const g = uid(); return svg(`<path d="M6 62 L10 46 L28 40 L40 26 L70 26 L84 42 L94 46 L96 62 Q96 68 90 68 L10 68 Q4 68 6 62 Z" fill="url(#${g})"/><path d="M32 42 L41 30 L54 30 L54 42 Z M58 42 L58 30 L68 30 L78 42 Z" fill="#bae6fd" opacity=".85"/><circle cx="26" cy="68" r="9" fill="#111827"/><circle cx="26" cy="68" r="4" fill="#9ca3af"/><circle cx="76" cy="68" r="9" fill="#111827"/><circle cx="76" cy="68" r="4" fill="#9ca3af"/><rect x="6" y="52" width="6" height="5" rx="1" fill="#fde68a"/>`, lg(g, [[0, '#f87171'], [1, '#991b1b']], 0, 0, 0, 1)); };
  I.cat = () => svg(`<path d="M84 78 Q98 76 96 56 Q95 48 90 52" fill="none" stroke="#3f3f46" stroke-width="6" stroke-linecap="round"/><path d="M18 88 L18 58 Q18 42 32 40 L34 22 L46 32 L58 32 L70 22 L72 40 Q86 44 86 60 L86 88 Z" fill="#3f3f46"/><ellipse cx="41" cy="50" rx="3" ry="3.6" fill="#fde68a"/><ellipse cx="63" cy="50" rx="3" ry="3.6" fill="#fde68a"/><ellipse cx="41" cy="50" rx="1" ry="3" fill="#1c1917"/><ellipse cx="63" cy="50" rx="1" ry="3" fill="#1c1917"/><path d="M48 60 L52 56 L56 60" fill="none" stroke="#fda4af" stroke-width="2"/>`);
  I.human = ({ col = '#fcd34d' } = {}) => svg(`<circle cx="50" cy="11" r="8" fill="${col}"/><path d="M50 22 L50 56" stroke="${col}" stroke-width="15" stroke-linecap="round"/><path d="M43 28 L31 58 M57 28 L69 58" stroke="${col}" stroke-width="6.5" stroke-linecap="round"/><path d="M45 56 L41 95 M55 56 L59 95" stroke="${col}" stroke-width="8" stroke-linecap="round"/>`);
  I.elephant = () => svg(`<path d="M14 50 Q6 62 12 80 Q14 86 20 84 Q18 72 20 60 Z" fill="#9ca3af"/><ellipse cx="56" cy="50" rx="32" ry="22" fill="#a1a1aa"/><circle cx="26" cy="42" r="15" fill="#a1a1aa"/><ellipse cx="33" cy="42" rx="9" ry="13" fill="#71717a"/><rect x="34" y="64" width="10" height="26" rx="3" fill="#a1a1aa"/><rect x="50" y="66" width="10" height="24" rx="3" fill="#a1a1aa"/><rect x="64" y="66" width="10" height="24" rx="3" fill="#8b8b92"/><rect x="78" y="64" width="9" height="24" rx="3" fill="#8b8b92"/><path d="M18 54 Q10 56 6 62" fill="none" stroke="#f1f5f9" stroke-width="3" stroke-linecap="round"/><circle cx="20" cy="38" r="1.8" fill="#111"/><path d="M86 48 Q96 56 90 70" fill="none" stroke="#9ca3af" stroke-width="3" stroke-linecap="round"/>`);
  I.trex = () => svg(`<path d="M30 46 L2 74 L34 62 Z" fill="#4d7c0f"/><ellipse cx="50" cy="50" rx="26" ry="15" fill="#65a30d" transform="rotate(-12 50 50)"/><path d="M68 42 Q72 30 80 26 L92 24 Q96 30 92 38 L80 44 Q74 48 70 46 Z" fill="#65a30d"/><path d="M82 36 L90 36 L86 40 Z M80 30 L90 30 L86 34 Z" fill="#fff"/><circle cx="84" cy="30" r="2" fill="#111"/><path d="M60 40 L66 36 L66 42" fill="none" stroke="#4d7c0f" stroke-width="3" stroke-linecap="round"/><path d="M40 62 L36 82 L46 82 M58 62 L60 82 L70 82" fill="none" stroke="#4d7c0f" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`);
  I.whale = () => { const g = uid(); return svg(`<path d="M14 50 L2 36 L8 50 L2 64 Z" fill="#334155"/><path d="M12 50 Q28 30 66 34 Q94 38 96 50 Q94 62 66 66 Q28 70 12 50 Z" fill="url(#${g})"/><path d="M66 34 L70 24 L78 36 Z" fill="#334155"/><path d="M40 62 L34 76 L50 66 Z" fill="#334155"/><path d="M30 56 Q60 66 90 54 Q70 64 30 60 Z" fill="#cbd5e1" opacity=".5"/><circle cx="84" cy="46" r="1.8" fill="#0f172a"/>`, lg(g, [[0, '#64748b'], [1, '#1e293b']], 0, 0, 0, 1)); };
  I.plane = () => svg(`<path d="M40 52 L22 92 L34 92 L58 56 Z M40 48 L22 8 L34 8 L58 44 Z" fill="#cbd5e1"/><path d="M76 54 L84 74 L92 74 L86 54 Z M76 46 L84 26 L92 26 L86 46 Z" fill="#94a3b8"/><rect x="6" y="45" width="90" height="10" rx="5" fill="#f1f5f9"/><ellipse cx="34" cy="30" rx="4" ry="7" fill="#64748b"/><ellipse cx="34" cy="70" rx="4" ry="7" fill="#64748b"/><circle cx="12" cy="50" r="3" fill="#0ea5e9" opacity=".7"/>`);
  I.sequoia = () => { const g = uid(); return svg(`<rect x="45" y="60" width="10" height="40" rx="2" fill="#7c3f12"/><path d="M50 0 L68 32 L32 32 Z" fill="url(#${g})"/><path d="M50 14 L74 50 L26 50 Z" fill="url(#${g})"/><path d="M50 30 L80 70 L20 70 Z" fill="url(#${g})"/>`, lg(g, [[0, '#4ade80'], [1, '#14532d']], 0, 0, 0, 1)); };
  I.liberty = () => svg(`<rect x="34" y="72" width="32" height="28" fill="#94a3b8"/><rect x="30" y="68" width="40" height="6" fill="#cbd5e1"/><path d="M40 68 L60 68 L62 36 L38 36 Z" fill="#5eead4"/><circle cx="50" cy="29" r="6" fill="#5eead4"/><path d="M44 24 L42 14 M48 22 L48 12 M52 22 L52 12 M56 24 L58 14" stroke="#5eead4" stroke-width="2" stroke-linecap="round"/><path d="M60 42 L74 14" stroke="#5eead4" stroke-width="4" stroke-linecap="round"/><circle cx="75" cy="11" r="4" fill="#fbbf24"/><rect x="38" y="46" width="12" height="10" rx="2" fill="#2dd4bf" opacity=".9"/>`);
  I.iss = () => svg(`<g fill="#fbbf24" opacity=".9"><rect x="2" y="30" width="20" height="40"/><rect x="24" y="30" width="20" height="40"/><rect x="56" y="30" width="20" height="40"/><rect x="78" y="30" width="20" height="40"/></g><path d="M2 40 H44 M2 50 H44 M2 60 H44 M56 40 H98 M56 50 H98 M56 60 H98" stroke="#92400e" stroke-width=".7" opacity=".6"/><rect x="2" y="48" width="96" height="4" fill="#e5e7eb"/><rect x="44" y="24" width="12" height="52" rx="2" fill="#cbd5e1"/><rect x="40" y="38" width="20" height="8" rx="3" fill="#f8fafc"/><rect x="40" y="54" width="20" height="8" rx="3" fill="#f8fafc"/>`);
  I.field = () => svg(`<rect x="2" y="20" width="96" height="60" fill="#166534"/><g fill="#22c55e" opacity=".35"><rect x="2" y="20" width="16" height="60"/><rect x="34" y="20" width="16" height="60"/><rect x="66" y="20" width="16" height="60"/></g><g fill="none" stroke="#f8fafc" stroke-width="1.4"><rect x="4" y="22" width="92" height="56"/><path d="M50 22 V78"/><circle cx="50" cy="50" r="9"/><rect x="4" y="36" width="14" height="28"/><rect x="82" y="36" width="14" height="28"/></g>`);
  I.pyramid = () => svg(`<path d="M50 14 L6 82 L54 82 Z" fill="#e8c27a"/><path d="M50 14 L54 82 L94 82 Z" fill="#a8762b"/><path d="M6 82 L94 82 L92 88 L8 88 Z" fill="#7c5a1e" opacity=".6"/>`);
  I.eiffel = () => svg(`<path d="M50 2 L52 18 L55 18 L59 52 L64 52 L74 98 L62 98 L58 82 L42 82 L38 98 L26 98 L36 52 L41 52 L45 18 L48 18 Z" fill="#4b3a2f"/><rect x="36" y="50" width="28" height="4" fill="#6b5344"/><rect x="40" y="80" width="20" height="4" fill="#6b5344"/><path d="M44 30 L56 44 M56 30 L44 44 M40 58 L60 78 M60 58 L40 78" stroke="#8a6d5a" stroke-width="1" opacity=".7"/><path d="M42 82 Q50 72 58 82" fill="none" stroke="#2b2119" stroke-width="2"/>`);
  I.burj = () => { const g = uid(); return svg(`<path d="M50 0 L52 22 L55 46 L59 72 L62 100 L38 100 L41 72 L45 46 L48 22 Z" fill="url(#${g})"/><path d="M38 100 L32 78 L41 68 Z M62 100 L68 78 L59 68 Z" fill="#475569"/><path d="M50 10 V100" stroke="#e2e8f0" stroke-width=".6" opacity=".4"/><path d="M46 40 H54 M44 56 H56 M43 72 H57 M41 88 H59" stroke="#cbd5e1" stroke-width=".8" opacity=".5"/>`, lg(g, [[0, '#e2e8f0'], [1, '#64748b']], 0, 0, 0, 1)); };
  I.asteroid = ({ seed = 17, c1 = '#a8a29e', c2 = '#44403c', craters = 5 } = {}) => {
    const R = rnd(seed), g = uid(); let cr = '';
    for (let i = 0; i < craters; i++) { const a = R() * TAU, d = R() * 24, x = 50 + d * Math.cos(a), y = 50 + d * Math.sin(a), r = 3 + R() * 6; cr += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="#000" opacity=".3"/><circle cx="${f1(x - r * .25)}" cy="${f1(y - r * .25)}" r="${f1(r * .6)}" fill="#fff" opacity=".07"/>`; }
    return svg(`<path d="${blobPath(50, 50, 40, R, .14, 11)}" fill="url(#${g})"/>${cr}`, rg(g, [[0, c1], [1, c2]], `cx="40%" cy="35%" r="70%"`));
  };
  I.everest = () => svg(`<path d="M0 96 L22 56 L36 74 L56 24 L76 58 L100 96 Z" fill="#475569"/><path d="M56 24 L46 44 L52 42 L58 48 L64 44 L70 48 Z" fill="#f8fafc"/><path d="M22 56 L16 66 L22 64 L28 68 L30 66 Z" fill="#e2e8f0"/><path d="M56 24 L76 58 L100 96 L60 96 Z" fill="#334155" opacity=".6"/><path d="M0 96 L100 96" stroke="#1e293b" stroke-width="3"/>`);
  I.mariana = () => { const g = uid(); return svg(`<rect x="0" y="12" width="100" height="88" fill="url(#${g})"/><path d="M0 46 L36 48 L46 94 L54 94 L64 48 L100 46 L100 100 L0 100 Z" fill="#3b2a1e"/><path d="M36 48 L46 94 L54 94 L64 48 Z" fill="#1a110b"/><path d="M0 14 Q25 10 50 14 T100 14" fill="none" stroke="#bae6fd" stroke-width="2" opacity=".8"/>`, lg(g, [[0, '#38bdf8'], [1, '#082f49']], 0, 0, 0, 1)); };
  I.manhattan = () => svg(`<rect x="0" y="0" width="100" height="100" fill="#0c4a6e" opacity=".55"/><g transform="rotate(-62 50 50)"><rect x="8" y="40" width="84" height="20" rx="9" fill="#a3a3a3"/><path d="M16 40 V60 M24 40 V60 M32 40 V60 M40 40 V60 M48 40 V60 M56 40 V60 M64 40 V60 M72 40 V60 M80 40 V60 M8 47 H92 M8 53 H92" stroke="#525252" stroke-width=".8"/><rect x="40" y="43" width="18" height="14" rx="1" fill="#4ade80" opacity=".9"/></g>`);
  I.olympus = () => { const g = uid(); return svg(`<circle cx="50" cy="50" r="48" fill="url(#${g})"/><circle cx="50" cy="50" r="48" fill="none" stroke="#fca5a5" stroke-width="1" opacity=".5"/><circle cx="50" cy="50" r="34" fill="none" stroke="#fecaca" stroke-width=".8" opacity=".3"/><circle cx="50" cy="50" r="20" fill="none" stroke="#fecaca" stroke-width=".8" opacity=".3"/><ellipse cx="50" cy="48" rx="9" ry="7" fill="#7f1d1d"/><ellipse cx="54" cy="52" rx="5" ry="4" fill="#450a0a"/>`, rg(g, [[0, '#f97316'], [.6, '#c2410c'], [1, '#7c2d12']])); };
  I.iberia = () => { const p = 'M8 18 L22 12 L40 10 L58 11 L72 12 L80 24 L76 40 L72 52 L74 60 L66 70 L58 76 L46 78 L36 80 L28 74 L18 70 L6 66 L4 50 L6 34 Z'; return svg(`<rect x="0" y="0" width="100" height="100" fill="#0c4a6e" opacity=".5"/><path d="${p}" fill="#84cc16"/><path d="${p}" fill="none" stroke="#ecfccb" stroke-width=".8" opacity=".7"/><path d="M30 30 L46 28 L62 32" fill="none" stroke="#a16207" stroke-width="1.5" opacity=".6"/><path d="M20 64 L36 60 L50 62" fill="none" stroke="#a16207" stroke-width="1.5" opacity=".5"/>`); };
  I.reef = () => {
    const R = rnd(23); let s = '';
    for (let i = 0; i < 70; i++) { const y = R() * 100, x = 44 + Math.sin(y / 18) * 6 + (R() + R() - 1) * 10; s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(1 + R() * 2.4)}" fill="${R() > .5 ? '#5eead4' : '#99f6e4'}" opacity="${f1(.5 + R() * .5)}"/>`; }
    return svg(`<rect x="0" y="0" width="100" height="100" fill="#0369a1"/><path d="M0 0 L34 0 Q40 30 30 60 Q22 84 36 100 L0 100 Z" fill="#a3e635" opacity=".9"/><path d="M34 0 Q40 30 30 60 Q22 84 36 100" fill="none" stroke="#fef3c7" stroke-width="2"/>${s}`);
  };

  /* ---- planetas, estrellas y distancias ---- */
  I.planet = ({ c1 = '#9ca3af', c2 = '#374151', bands = [], ring: rg_ = null, spots = [], craters = 0, cap = false, seed = 1, glow = null, extra = '' } = {}) => {
    const sp = sphere(c1, c2), cp = uid(); let inner = '';
    for (const [y, h, col, op] of bands) inner += `<rect x="0" y="${y}" width="100" height="${h}" fill="${col}" opacity="${op}"/>`;
    for (const [x, y, rx, ry, col, op, rot = 0] of spots) inner += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${col}" opacity="${op}" transform="rotate(${rot} ${x} ${y})"/>`;
    if (craters) { const R = rnd(seed); for (let i = 0; i < craters; i++) { const a = R() * TAU, d = R() * 36, x = 50 + d * Math.cos(a), y = 50 + d * Math.sin(a), r = 2 + R() * 6; inner += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="#000" opacity=".22"/><circle cx="${f1(x - r * .25)}" cy="${f1(y - r * .25)}" r="${f1(r * .7)}" fill="#fff" opacity=".07"/>`; } }
    if (cap) inner += `<ellipse cx="50" cy="8" rx="16" ry="6" fill="#fff" opacity=".85"/>`;
    inner += extra;
    let back = '', front = '', defs = sp.defs + `<clipPath id="${cp}"><circle cx="50" cy="50" r="46"/></clipPath>`;
    if (rg_) { const rc = uid(); defs += `<clipPath id="${rc}"><rect x="-60" y="50" width="220" height="120"/></clipPath>`; back = ring(rg_); front = ring(rg_, rc); }
    const glowEl = glow ? `<circle cx="50" cy="50" r="48.5" fill="none" stroke="${glow}" stroke-width="3" opacity=".5"/>` : '';
    return svg(`${back}${glowEl}${sp.fill}<g clip-path="url(#${cp})">${inner}</g>${sp.shade}${front}`, defs);
  };
  I.star = ({ c1 = '#fff', c2 = '#fbbf24', c3 = '#f97316', rays = 8, seed = 3 } = {}) => {
    const g = uid(), h = uid(); let r = '';
    for (let i = 0; i < rays; i++) { const a = i * 360 / rays + (seed * 7) % 20; r += `<line x1="50" y1="50" x2="50" y2="-22" stroke="${c2}" stroke-width="${i % 2 ? 1 : 2}" opacity="${i % 2 ? .22 : .4}" transform="rotate(${a} 50 50)" stroke-linecap="round"/>`; }
    return svg(`<circle cx="50" cy="50" r="72" fill="url(#${h})"/>${r}<circle cx="50" cy="50" r="46" fill="url(#${g})"/>`, rg(g, [[0, c1], [.55, c2], [1, c3]], `fx="42%" fy="40%"`) + rg(h, [[.6, c2, .55], [.75, c3, .25], [1, c3, 0]]));
  };
  I.blackhole = ({ col = '#fb923c' } = {}) => {
    const g = uid(), rc = uid(), rr = { rx: 84, ry: 17, w: 12, tilt: -14, col: `url(#${g})` };
    return svg(`${ring(rr)}<circle cx="50" cy="50" r="48" fill="${col}" opacity=".45"/><circle cx="50" cy="50" r="45" fill="#000"/><circle cx="50" cy="50" r="46" fill="none" stroke="${col}" stroke-width="2.5"/><circle cx="50" cy="50" r="46" fill="none" stroke="#fff" stroke-width="1" opacity=".7"/>${ring(rr, rc)}`, lg(g, [[0, col, .1], [.45, '#fff'], [.6, col], [1, col, .1]], 0, 0, 1, 0) + `<clipPath id="${rc}"><rect x="-60" y="50" width="220" height="120"/></clipPath>`);
  };
  I.distance = ({ a = '', b = '', col = '#e2e8f0' } = {}) => svg(`<line x1="12" y1="50" x2="88" y2="50" stroke="${col}" stroke-width="1.5" stroke-dasharray="4 4" opacity=".7"/><path d="M12 42 V58 M88 42 V58" stroke="${col}" stroke-width="1.5" opacity=".8"/>${a}${b}`);
  I.solarsystem = () => {
    const rs = [6, 9, 12, 15, 24, 31, 39, 46], cols = ['#9ca3af', '#fcd34d', '#60a5fa', '#f87171', '#fbbf24', '#fde68a', '#67e8f9', '#60a5fa']; let orb = '';
    rs.forEach((r, i) => { const a = i * 1.3; orb += `<circle cx="50" cy="50" r="${r}" fill="none" stroke="#94a3b8" stroke-width=".6" opacity=".55"/><circle cx="${f1(50 + r * Math.cos(a))}" cy="${f1(50 + r * Math.sin(a))}" r="${i === 4 ? 2.6 : i === 5 ? 2.2 : 1.4}" fill="${cols[i]}"/>`; });
    const g = uid();
    return svg(`${orb}<circle cx="50" cy="50" r="4" fill="url(#${g})"/>`, rg(g, [[0, '#fff'], [.5, '#fde047'], [1, '#f97316']]));
  };
  I.beam = ({ col = '#e0f2fe', label = '' } = {}) => {
    const g = uid(), h = uid();
    return svg(`<line x1="4" y1="50" x2="96" y2="50" stroke="url(#${g})" stroke-width="10" opacity=".25"/><line x1="4" y1="50" x2="96" y2="50" stroke="url(#${g})" stroke-width="3"/><circle cx="6" cy="50" r="6" fill="url(#${h})"/><path d="M89 43 L97 50 L89 57" fill="none" stroke="${col}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><text x="50" y="72" text-anchor="middle" font-size="11" font-family="system-ui,sans-serif" font-weight="600" fill="${col}" opacity=".9">${label}</text>`, lg(g, [[0, '#fff'], [1, col, .35]], 0, 0, 1, 0) + rg(h, [[0, '#fff'], [.6, '#fde047'], [1, '#f97316', 0]]));
  };
  I.helio = () => { const g = uid(); return svg(`<path d="M10 50 Q10 10 50 10 Q84 10 100 50 Q84 90 50 90 Q10 90 10 50 Z" fill="url(#${g})"/><path d="M12 50 Q14 22 46 20 Q74 20 92 50 Q74 80 46 80 Q14 78 12 50 Z" fill="none" stroke="#fde68a" stroke-width="1" opacity=".5"/><path d="M98 36 L112 30 M100 50 L116 50 M98 64 L112 70" stroke="#fde68a" stroke-width="1.5" opacity=".6"/><circle cx="46" cy="50" r="3" fill="#fff"/><circle cx="46" cy="50" r="7" fill="#fde047" opacity=".5"/><path d="M0 30 L8 34 M0 50 L8 50 M0 70 L8 66" stroke="#60a5fa" stroke-width="2" opacity=".7" stroke-linecap="round"/>`, rg(g, [[0, '#fde68a', .35], [.7, '#f59e0b', .12], [1, '#f59e0b', .03]])); };
  I.oort = () => svg(`<circle cx="50" cy="50" r="2" fill="#fde047"/>${dots(rnd(61), 320, 'ring', '#e2e8f0', '#93c5fd', .35, 1, { inner: 24 })}`);
  I.nebula = ({ blobs = [], stars = 20, seed = 9, blur = 5, fil = [], extra = '' } = {}) => {
    const f = uid(), R = rnd(seed); let b = '', fl = '';
    for (const [x, y, rx, ry, col, op, rot = 0] of blobs) b += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${col}" opacity="${op}" transform="rotate(${rot} ${x} ${y})"/>`;
    for (const [d, col, w, op] of fil) fl += `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" opacity="${op}" stroke-linecap="round"/>`;
    return svg(`<g filter="url(#${f})">${b}</g>${fl}${dots(R, stars, 'sq', '#fff', null, .4, 1.3)}${extra}`, `<filter id="${f}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${blur}"/></filter>`);
  };
  I.bubble = () => { const g = uid(); return svg(`<ellipse cx="50" cy="50" rx="46" ry="40" fill="url(#${g})"/><ellipse cx="50" cy="50" rx="46" ry="40" fill="none" stroke="#a5b4fc" stroke-width="1.2" opacity=".5" stroke-dasharray="2 3"/>${dots(rnd(71), 40, 'disc', '#fff', '#fde68a', .4, 1.4)}<circle cx="54" cy="52" r="2.4" fill="#fde047"/><circle cx="54" cy="52" r="5" fill="#fde047" opacity=".3"/>`, rg(g, [[0, '#6366f1', .05], [.8, '#6366f1', .14], [1, '#6366f1', .02]])); };
  I.arm = () => {
    const R = rnd(81); let s = '';
    for (let i = 0; i < 280; i++) { const x = R() * 100, yc = 50 - .012 * (x - 50) ** 2, y = yc + (R() + R() + R() - 1.5) * 14; if (y < 0 || y > 100) continue; s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(.4 + R() * 1.3)}" fill="${R() > .8 ? '#fde68a' : '#fff'}" opacity="${f1(.3 + R() * .7)}"/>`; }
    return svg(`<path d="M-10 6 Q50 68 110 6" fill="none" stroke="#818cf8" stroke-width="42" opacity=".16"/>${s}<circle cx="50" cy="48" r="2.5" fill="#fde047"/><circle cx="50" cy="48" r="6" fill="none" stroke="#fde047" stroke-width="1" opacity=".7"/>`);
  };
  I.irregular = ({ c1 = '#dbeafe', c2 = '#60a5fa', seed = 91 } = {}) => { const R = rnd(seed), g = uid(); return svg(`<path d="${blobPath(50, 50, 40, R, .2, 10)}" fill="url(#${g})"/><ellipse cx="50" cy="50" rx="28" ry="7" fill="#fff" opacity=".35" transform="rotate(-20 50 50)"/>${dots(R, 160, 'disc', '#fff', c1, .4, 1.3, { rad: 40 })}`, rg(g, [[0, c2, .6], [1, c2, 0]])); };
  I.galaxy = ({ c2 = '#9ab4ff', c3 = '#ffd9a0', arms = 2, tilt = .55, rot = -25, bar = 0, seed = 5, dots: nd = 110 } = {}) => {
    const R = rnd(seed), core = uid(), halo = uid(); let paths = '', pts = '';
    for (let a = 0; a < arms; a++) {
      let d = '';
      for (let t = 1; t <= 5.6; t += .1) { const r = 3.2 * Math.exp(.5 * t); if (r > 48) break; const ang = t + a * TAU / arms; d += (d ? 'L' : 'M') + f1(50 + r * Math.cos(ang)) + ' ' + f1(50 + r * Math.sin(ang)); }
      paths += `<path d="${d}" fill="none" stroke="${c2}" stroke-width="9" stroke-linecap="round" opacity=".35"/><path d="${d}" fill="none" stroke="${c2}" stroke-width="4" stroke-linecap="round" opacity=".55"/>`;
      for (let i = 0; i < nd / arms; i++) { const t = 1 + R() * 4.6, r = 3.2 * Math.exp(.5 * t) + (R() - .5) * 9; if (r > 49) continue; const ang = t + a * TAU / arms; pts += `<circle cx="${f1(50 + r * Math.cos(ang))}" cy="${f1(50 + r * Math.sin(ang))}" r="${f1(.5 + R() * 1.2)}" fill="${R() > .7 ? c3 : '#fff'}" opacity="${f1(.4 + R() * .6)}"/>`; }
    }
    const barEl = bar ? `<ellipse cx="50" cy="50" rx="${bar}" ry="${bar * .32}" fill="${c3}" opacity=".7" transform="rotate(57 50 50)"/>` : '';
    return svg(`<g transform="translate(50 50) rotate(${rot}) scale(1 ${tilt}) translate(-50 -50)"><circle cx="50" cy="50" r="49" fill="url(#${halo})"/>${paths}${barEl}${pts}<circle cx="50" cy="50" r="14" fill="url(#${core})"/></g>`, rg(core, [[0, '#fff'], [.4, c3], [1, c3, 0]]) + rg(halo, [[0, c2, .35], [1, c2, 0]]));
  };
  I.group = () => { const R = rnd(101); const mini = (x, y, s, rot) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><ellipse rx="12" ry="4" fill="#c7d2fe" opacity=".85"/><ellipse rx="4" ry="2.5" fill="#fff"/></g>`; return svg(`${dots(R, 50, 'disc', '#fff', '#a5b4fc', .5, 1.6)}${mini(34, 44, 1.2, -25)}${mini(68, 58, 1, 20)}${mini(50, 76, .5, 0)}${mini(28, 70, .4, 40)}${mini(74, 30, .45, -10)}`); };
  I.cluster = () => {
    const R = rnd(111), h = uid(); let g = '';
    for (let i = 0; i < 18; i++) { const a = R() * TAU, d = Math.sqrt(R()) * 42, x = f1(50 + d * Math.cos(a)), y = f1(50 + d * Math.sin(a)); g += `<ellipse cx="${x}" cy="${y}" rx="${f1(2 + R() * 4)}" ry="${f1(1 + R() * 2)}" fill="#e0e7ff" opacity="${f1(.5 + R() * .5)}" transform="rotate(${f1(R() * 180)} ${x} ${y})"/>`; }
    return svg(`<circle cx="50" cy="50" r="48" fill="url(#${h})"/>${dots(R, 180, 'disc', '#fff', '#c7d2fe', .4, 1.3)}${g}<ellipse cx="46" cy="48" rx="7" ry="5" fill="#fff" opacity=".9"/>`, rg(h, [[0, '#818cf8', .35], [1, '#818cf8', 0]]));
  };
  I.voidf = () => svg(`${dots(rnd(121), 260, 'ring', '#e0e7ff', '#a5b4fc', .4, 1.4, { inner: 36 })}<circle cx="50" cy="50" r="34" fill="#02040c" opacity=".6"/>${dots(rnd(3), 8, 'disc', '#c7d2fe', null, .6, 1.2, { rad: 30 })}`);
  I.laniakea = () => {
    const R = rnd(161); let f = '';
    for (let i = 0; i < 14; i++) { const a = R() * TAU, r = 30 + R() * 20, x = 50 + r * Math.cos(a), y = 50 + r * Math.sin(a), cx = 50 + (R() - .5) * 30, cy = 50 + (R() - .5) * 30; f += `<path d="M${f1(x)} ${f1(y)} Q${f1(cx)} ${f1(cy)} 46 52" fill="none" stroke="#818cf8" stroke-width="${f1(1 + R() * 2)}" opacity=".45" stroke-linecap="round"/>`; }
    return svg(`${f}${dots(R, 200, 'disc', '#fff', '#c7d2fe', .35, 1.2)}<circle cx="46" cy="52" r="4" fill="#fff" opacity=".9"/><circle cx="46" cy="52" r="9" fill="#818cf8" opacity=".3"/>`);
  };
  I.wall = () => {
    const R = rnd(141); let s = '';
    for (let i = 0; i < 360; i++) { const x = R() * 100, yc = 50 - 8 * Math.sin(x / 100 * Math.PI), y = yc + (R() + R() + R() - 1.5) * 12; s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(.35 + R() * 1.1)}" fill="${R() > .75 ? '#c7d2fe' : '#fff'}" opacity="${f1(.3 + R() * .7)}"/>`; }
    return svg(`<path d="M-10 50 Q50 30 110 50" fill="none" stroke="#818cf8" stroke-width="34" opacity=".15"/>${s}`);
  };
  I.universe = () => { const g = uid(); return svg(`<circle cx="50" cy="50" r="48" fill="url(#${g})"/>${webLines(151, 44, '#a5b4fc', 44)}<circle cx="50" cy="50" r="48" fill="none" stroke="#c7d2fe" stroke-width="1.2" opacity=".7"/><circle cx="50" cy="50" r="2.2" fill="#fde047"/>`, rg(g, [[0, '#1e1b4b', .9], [.85, '#312e81', .6], [1, '#6366f1', .1]])); };

  /* imagen propia (PNG/WebP/JPG/SVG) incrustada como data URI; el objeto ocupa todo el cuadro */
  I.image = ({ src = '', fit = 'meet', round = false } = {}) => {
    const cp = uid();
    return svg(`<image href="${src}" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid ${fit}"${round ? ` clip-path="url(#${cp})"` : ''}/>`, round ? `<clipPath id="${cp}"><circle cx="50" cy="50" r="50"/></clipPath>` : '');
  };

  return { make: spec => { const [name, opts] = spec; return (I[name] || I.particle)(opts || {}); }, names: Object.keys(I) };
})();
