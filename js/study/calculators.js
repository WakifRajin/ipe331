// Exam-numerical calculators for IPE 331 (turning, milling, shaping, drilling, grinding, indexing).
// Compute functions are pure / DOM-free (importable from node). The DOM is touched only inside renderCalculators().

const PI = Math.PI;
const isNum = (x) => typeof x === 'number' && isFinite(x);
const pos = (x) => isNum(x) && x > 0;
const rad = (deg) => (deg * PI) / 180;

// ------------------------------------------------------------------ formatting
export function fmt(x, sig = 4) {
  if (!isNum(x)) return '—';
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a >= 1000) return Math.round(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  if (a < 1e-3) return x.toExponential(2);
  return String(Number(x.toPrecision(sig)));
}

// ------------------------------------------------------------------ TURNING
export function parseSpeeds(txt) {
  if (Array.isArray(txt)) return txt.filter(pos).sort((a, b) => a - b);
  return String(txt || '')
    .split(/[\s,;]+/)
    .map(Number)
    .filter(pos)
    .sort((a, b) => a - b);
}

/** Snap a computed rpm to a list of available speeds. mode 'down' (next lower) or 'nearest'. */
export function snapSpeed(N, list, mode = 'down') {
  const L = parseSpeeds(list);
  if (!L.length || !pos(N)) return N;
  if (mode === 'nearest') return L.reduce((b, s) => (Math.abs(s - N) < Math.abs(b - N) ? s : b), L[0]);
  let best = L[0];
  for (const s of L) if (s <= N + 1e-9) best = s;
  return best;
}

export function turning(i) {
  const unit = i.unit === 'in' ? 'in' : 'mm';
  const k = unit === 'in' ? 12 : 1000; // V [m/min or ft/min] -> length units per min
  const D = i.D1;
  if (!pos(D)) throw new Error('Enter the job diameter D (initial diameter).');
  let d = i.d;
  if (pos(i.D2)) {
    if (i.D2 >= D) throw new Error('Final diameter D2 must be smaller than D1.');
    d = (D - i.D2) / 2;
  }
  if (!pos(d)) throw new Error('Enter a depth of cut d, or a final diameter D2.');
  let f = i.f;
  let fFromMRR = false;
  if (!pos(f) && pos(i.MRR) && pos(i.V)) {
    f = i.MRR / (i.V * k * d);
    fFromMRR = true;
  }
  if (!pos(f)) throw new Error('Enter a feed f (or a given MRR to solve for f).');
  if (!pos(i.L)) throw new Error('Enter the length of cut L.');
  const extra = isNum(i.extra) && i.extra > 0 ? i.extra : 0;
  const Ltot = i.L + extra;
  const out = { unit, k, D, d, f, fFromMRR, L: i.L, extra, Ltot };
  if (pos(i.tTarget)) {
    out.mode = 'target';
    out.N = Ltot / (f * i.tTarget);
    out.V = (PI * D * out.N) / k;
    out.time = i.tTarget;
  } else {
    if (!pos(i.V)) throw new Error('Enter a cutting speed V (or a target time).');
    out.mode = 'speed';
    out.V0 = i.V;
    out.N0 = (i.V * k) / (PI * D);
    const list = parseSpeeds(i.speeds);
    out.snapped = list.length > 0;
    out.N = list.length ? snapSpeed(out.N0, list, i.snap) : out.N0;
    out.V = list.length ? (PI * D * out.N) / k : i.V;
    out.time = Ltot / (f * out.N);
  }
  out.MRR = out.V * k * f * d;
  if (unit === 'mm' && pos(i.K)) {
    out.Fc = i.K * f * d;
    // W: K[N/mm2]*MRR[mm3/min] = N·mm/min; /1000 -> N·m/min; /60 -> W
    out.P =(i.K * out.MRR) / 1000 / 60;
    const eff = pos(i.eff) ? Math.min(i.eff, 100) / 100 : 1;
    out.eff = eff;
    out.Pmotor = out.P / eff;
    out.T = out.P / ((2 * PI * out.N) / 60);
  }
  return out;
}

/** Roughing (max depth) + finishing pass planner. */
export function turningPasses(i) {
  const unit = i.unit === 'in' ? 'in' : 'mm';
  const k = unit === 'in' ? 12 : 1000;
  if (!pos(i.D1) || !pos(i.D2) || i.D2 >= i.D1) throw new Error('Enter D1 (blank) larger than D2 (finished diameter).');
  if (!pos(i.dmax)) throw new Error('Enter the maximum depth of cut for roughing.');
  if (!pos(i.L)) throw new Error('Enter the length of cut L.');
  if (!pos(i.Vr) || !pos(i.fr)) throw new Error('Enter roughing speed and feed.');
  const fa = isNum(i.fa) && i.fa > 0 ? i.fa : 0;
  const total = (i.D1 - i.D2) / 2;
  const extra = isNum(i.extra) && i.extra > 0 ? i.extra : 0;
  const Ltot = i.L + extra;
  const finishDepth = Math.min(fa, total);
  const roughTotal = total - finishDepth;
  const nRough = roughTotal > 1e-9 ? Math.ceil(roughTotal / i.dmax - 1e-9) : 0;
  const nFinish = finishDepth > 0 ? 1 : 0;
  const list = parseSpeeds(i.speeds);
  const Dr = i.D1;
  const Df = i.D2 + 2 * finishDepth;
  const N0r = (i.Vr * k) / (PI * Dr);
  const Nr = list.length ? snapSpeed(N0r, list, i.snap) : N0r;
  const tRough = nRough ? (nRough * Ltot) / (i.fr * Nr) : 0;
  let N0f = NaN, Nf = NaN, tFin = 0;
  if (nFinish) {
    if (!pos(i.Vf) || !pos(i.ff)) throw new Error('Enter finishing speed and feed.');
    N0f = (i.Vf * k) / (PI * Df);
    Nf = list.length ? snapSpeed(N0f, list, i.snap) : N0f;
    tFin = Ltot / (i.ff * Nf);
  }
  const depths = [];
  if (nRough) {
    const each = roughTotal / nRough;
    for (let n = 0; n < nRough; n++) depths.push(each);
  }
  if (nFinish) depths.push(finishDepth);
  return { unit, total, finishDepth, roughTotal, nRough, nFinish, N0r, Nr, N0f, Nf, tRough, tFin, time: tRough + tFin, Ltot, depths, Dr, Df, snapped: list.length > 0 };
}

// ------------------------------------------------------------------ MILLING
export function milling(i) {
  const mode = i.mode === 'face-c' || i.mode === 'face-o' ? i.mode : 'slab';
  if (!pos(i.D)) throw new Error('Enter the cutter diameter D.');
  if (!pos(i.d)) throw new Error('Enter the depth of cut d.');
  if (!pos(i.V)) throw new Error('Enter the cutting speed V.');
  if (!pos(i.nt)) throw new Error('Enter the number of teeth nt.');
  if (!pos(i.f)) throw new Error('Enter the feed per tooth f.');
  if (!pos(i.L)) throw new Error('Enter the length of cut L.');
  const N = (1000 * i.V) / (PI * i.D);
  const fr = N * i.nt * i.f;
  let A, O, formula;
  if (mode === 'slab') {
    if (i.d > i.D) throw new Error('Depth of cut cannot exceed the cutter diameter.');
    A = Math.sqrt(i.d * (i.D - i.d));
    O = isNum(i.O) && i.O > 0 ? i.O : 0;
    formula = 'A = √(d(D − d))';
  } else if (mode === 'face-c') {
    A = O = i.D / 2;
    formula = 'A = O = D/2';
  } else {
    if (!pos(i.w)) throw new Error('Enter the width of cut w for the offset case.');
    if (i.w > i.D) throw new Error('For the offset case, width w must not exceed D.');
    A = O = Math.sqrt(i.w * (i.D - i.w));
    formula = 'A = O = √(w(D − w))';
  }
  const Tm = (i.L + A + O) / fr;
  const w = pos(i.w) ? i.w : mode === 'face-c' ? i.D : NaN;
  const MRR = isNum(w) ? w * i.d * fr : NaN;
  return { mode, N, fr, A, O, Tm, MRR, w, formula };
}

// Inline SVG showing the approach geometry. Colours via currentColor / CSS vars only.
export function millingDiagram(i, r) {
  const W = 320, H = 150;
  const mode = r ? r.mode : (i && i.mode) || 'slab';
  const D = pos(i && i.D) ? i.D : 100;
  const d = pos(i && i.d) ? i.d : 5;
  const w = pos(i && i.w) ? i.w : D * 0.8;
  const ink = 'stroke="currentColor"';
  const dim = 'stroke="var(--muted, currentColor)"';
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Approach geometry diagram" style="width:100%;max-width:420px;height:auto;display:block;color:var(--fg, currentColor)">`;
  if (mode === 'slab') {
    const sc = Math.min(1.1, 85 / D);
    const R = (D * sc) / 2;
    const cx = 80, cy = 20 + R;
    const dd = Math.min(d * sc, R * 1.6);
    const yTop = cy + R - dd;
    const A = Math.sqrt(Math.max(0, d * (D - d))) * sc;
    const xe = cx + A;
    s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="currentColor" fill-opacity="0.08" ${ink} stroke-width="1.5"/>`;
    s += `<rect x="${xe}" y="${yTop}" width="${W - xe - 10}" height="${H - yTop - 10}" fill="currentColor" fill-opacity="0.15" ${ink}/>`;
    s += `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${yTop + 10}" ${dim} stroke-dasharray="3 3"/>`;
    s += `<line x1="${xe}" y1="${yTop - 8}" x2="${xe}" y2="${cy + R}" ${dim} stroke-dasharray="3 3"/>`;
    s += `<line x1="${cx}" y1="${yTop - 8}" x2="${xe}" y2="${yTop - 8}" class="tag-f" stroke="currentColor" stroke-width="2"/>`;
    s += `<text x="${(cx + xe) / 2}" y="${yTop - 12}" text-anchor="middle" font-size="11" fill="currentColor" class="tag-f">A</text>`;
    s += `<text x="${xe + 8}" y="${yTop + 16}" font-size="11" fill="currentColor" class="tag-d">d</text>`;
    s += `<text x="${cx + R + 6}" y="${cy - R * 0.4}" font-size="11" fill="currentColor">D</text>`;
    s += `<text x="${W - 12}" y="${H - 16}" text-anchor="end" font-size="10" fill="currentColor">slab milling (side view)</text>`;
  } else {
    const sc = Math.min(1.1, 85 / D);
    const R = (D * sc) / 2;
    const cx = 80, cy = 20 + R;
    const ws = Math.min(w, D) * sc;
    let y0, xe;
    if (mode === 'face-c') {
      y0 = cy - ws / 2;
      xe = cx + R;
    } else {
      y0 = cy + R - ws;
      xe = cx + Math.sqrt(Math.max(0, Math.min(w, D) * (D - Math.min(w, D)))) * sc;
    }
    s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="currentColor" fill-opacity="0.08" ${ink} stroke-width="1.5"/>`;
    s += `<rect x="${xe}" y="${y0}" width="${W - xe - 10}" height="${ws}" fill="currentColor" fill-opacity="0.15" ${ink}/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="1.8" fill="currentColor"/>`;
    s += `<line x1="${cx}" y1="${cy}" x2="${xe}" y2="${cy}" ${dim} stroke-dasharray="3 3"/>`;
    s += `<line x1="${cx}" y1="${y0 + ws + 10}" x2="${xe}" y2="${y0 + ws + 10}" class="tag-f" stroke="currentColor" stroke-width="2"/>`;
    s += `<line x1="${xe}" y1="${y0 + ws}" x2="${xe}" y2="${y0 + ws + 12}" ${dim}/>`;
    s += `<text x="${(cx + xe) / 2}" y="${y0 + ws + 23}" text-anchor="middle" font-size="11" fill="currentColor" class="tag-f">A</text>`;
    s += `<text x="${W - 14}" y="${y0 + ws / 2 + 4}" text-anchor="end" font-size="11" fill="currentColor">w</text>`;
    s += `<text x="${W - 12}" y="${H - 6}" text-anchor="end" font-size="10" fill="currentColor">face milling (top view, ${mode === 'face-c' ? 'centred' : 'offset'})</text>`;
  }
  return s + '</svg>';
}

// ------------------------------------------------------------------ SHAPER
export function shaper(i) {
  if (!pos(i.job)) throw new Error('Enter the job length along the stroke.');
  if (!pos(i.V)) throw new Error('Enter the cutting speed (m/min).');
  if (!pos(i.width)) throw new Error('Enter the job width (feed direction).');
  if (!pos(i.f)) throw new Error('Enter the feed per stroke.');
  const clr = isNum(i.clear) && i.clear > 0 ? i.clear : 0;
  const L = i.job + clr;
  const Vmm = i.V * 1000;
  const tF = L / Vmm; // min
  let alpha = pos(i.angle) && i.angle < 360 ? i.angle : NaN;
  let total, tR, ratio;
  if (isNum(alpha)) {
    total = (tF * 360) / alpha;
    tR = total - tF;
    ratio = alpha / (360 - alpha); // return speed / cutting speed
  } else {
    total = tF;
    tR = 0;
    ratio = NaN;
  }
  const spm = 1 / total;
  const raw = i.width / i.f;
  const nStrokes = i.plusOne ? raw + 1 : raw;
  let passes = 1;
  if (pos(i.depth) && pos(i.d)) passes = Math.ceil(i.depth / i.d - 1e-9);
  const strokesInt = Math.ceil(nStrokes - 1e-9);
  const time = passes * nStrokes * total;
  const vol = i.job * i.width * (pos(i.depth) ? i.depth : pos(i.d) ? i.d : 0);
  const MRR = vol > 0 ? vol / time : NaN;
  return { L, tF, tR, total, ratio, alpha, spm, raw, nStrokes, strokesInt, passes, time, MRR };
}

// ------------------------------------------------------------------ DRILLING
export function drilling(i) {
  if (!pos(i.D)) throw new Error('Enter the drill diameter D.');
  if (!pos(i.V)) throw new Error('Enter the cutting speed V.');
  if (!pos(i.f)) throw new Error('Enter the feed f (mm/rev).');
  if (!pos(i.depth)) throw new Error('Enter the hole depth / plate thickness.');
  const N = (1000 * i.V) / (PI * i.D);
  const fr = i.f * N;
  const theta = pos(i.theta) && i.theta < 180 ? i.theta : 118;
  const A = 0.5 * i.D * Math.tan(rad(90 - theta / 2));
  const through = i.type === 'through';
  const O = through && isNum(i.O) && i.O > 0 ? i.O : 0;
  const Tm = (i.depth + A + O) / fr;
  const MRR = (PI * i.D * i.D * fr) / 4;
  const n = pos(i.n) ? Math.round(i.n) : 1;
  return { N, fr, theta, A, O, through, Tm, MRR, n, total: n * Tm };
}

// ------------------------------------------------------------------ GRINDING
export function grinding(i) {
  if (!pos(i.D)) throw new Error('Enter the wheel diameter D.');
  if (!pos(i.N)) throw new Error('Enter the wheel speed N (rpm).');
  if (!pos(i.d)) throw new Error('Enter the depth of cut d.');
  const v = PI * i.D * i.N; // mm/min
  const lc = Math.sqrt(i.D * i.d);
  const out = { v, vms: v / 60000, lc };
  if (pos(i.w) && pos(i.vw)) {
    out.MRR = i.vw * 1000 * i.w * i.d; // mm3/min
    if (pos(i.C)) {
      const C = i.C / 100; // per cm2 -> per mm2
      out.nc = v * i.w * C; // chips/min
      out.ncs = out.nc / 60;
      out.vchip = out.MRR / out.nc;
    }
    if (pos(i.Fc)) {
      out.Pw = (i.Fc * v) / 60000; // N * m/s = W
      out.U = out.Pw / (out.MRR / 60); // J/mm3
    }
  }
  return out;
}

export function surfaceGrinding(i) {
  if (!pos(i.D)) throw new Error('Enter the wheel diameter D.');
  if (!pos(i.L)) throw new Error('Enter the work length L.');
  if (!pos(i.W)) throw new Error('Enter the work width.');
  if (!pos(i.vw)) throw new Error('Enter the table speed (m/min).');
  const vertical = i.axis === 'vertical';
  const cross = vertical ? i.D : pos(i.cross) ? i.cross : NaN;
  if (!pos(cross)) throw new Error('Enter the crossfeed (usually the wheel thickness).');
  const A = i.D / 2;
  const tPass = (i.L + 2 * A) / (i.vw * 1000);
  const pw = Math.ceil(i.W / cross - 1e-9);
  const pd = pos(i.depth) && pos(i.dpass) ? Math.ceil(i.depth / i.dpass - 1e-9) : 1;
  return { vertical, cross, A, tPass, pw, pd, passes: pw * pd, time: tPass * pw * pd };
}

// ------------------------------------------------------------------ INDEXING
export const PLATES = {
  bs: { name: 'Brown & Sharpe', plates: [[15, 16, 17, 18, 19, 20], [21, 23, 27, 29, 31, 33], [37, 39, 41, 43, 47, 49]] },
  cin: { name: 'Cincinnati', plates: [[24, 25, 28, 30, 34, 37, 38, 39, 41, 42, 43], [46, 47, 49, 51, 53, 54, 57, 58, 59, 62, 66]] },
};
export const GEARS = [24, 24, 28, 32, 40, 44, 48, 56, 64, 72, 86, 100];

function circlesFor(set) {
  const out = [];
  const add = (key) => PLATES[key].plates.forEach((p, n) => p.forEach((c) => out.push({ c, plate: PLATES[key].name + ' plate ' + (n + 1) })));
  if (set === 'cin') add('cin');
  else if (set === 'both') { add('bs'); add('cin'); } else add('bs');
  return out;
}
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

/** Simple indexing: crank turns = 40/N. */
export function indexSimple(N, set = 'bs') {
  if (!pos(N) || !Number.isInteger(N)) throw new Error('Enter a whole number of divisions N.');
  const whole = Math.floor(40 / N);
  const rem = 40 - whole * N;
  const g = gcd(rem, N) || 1;
  const p = rem / g, q = N / g;
  const circles = rem === 0 ? [] : circlesFor(set).filter((x) => x.c % q === 0).map((x) => ({ ...x, holes: (p * x.c) / q }));
  circles.sort((a, b) => a.c - b.c);
  return { N, whole, rem, p, q, frac: rem === 0 ? null : [p, q], circles, feasible: rem === 0 || circles.length > 0 };
}

function findTrains(target, gears = GEARS) {
  // returns {simple:[[a,b]...], compound:[[a,b,c,d]...]} where ratio = a/b (or (a/b)(c/d)) = target (driver/driven)
  const eps = 1e-9;
  const uniq = [...new Set(gears)];
  const have = (list) => { const cnt = {}; list.forEach((g) => (cnt[g] = (cnt[g] || 0) + 1)); return Object.keys(cnt).every((g) => cnt[g] <= gears.filter((x) => x === +g).length); };
  const simple = [], compound = [];
  for (const a of uniq) for (const b of uniq) if (a !== b && Math.abs(a / b - target) < eps) simple.push([a, b]);
  for (const a of uniq) for (const b of uniq) for (const c of uniq) for (const d of uniq) {
    if (Math.abs((a / b) * (c / d) - target) < eps && have([a, b, c, d]) && a <= c) compound.push([a, b, c, d]);
  }
  compound.sort((x, y) => x.reduce((s, g) => s + g, 0) - y.reduce((s, g) => s + g, 0));
  return { simple, compound };
}

/** Differential indexing. If opts.A is given use it, else search A near N. */
export function indexDifferential(N, opts = {}) {
  if (!pos(N) || !Number.isInteger(N)) throw new Error('Enter a whole number of divisions N.');
  const set = opts.set || 'bs';
  const tryA = (A) => {
    if (!pos(A) || !Number.isInteger(A) || A === N) return null;
    const sim = indexSimple(A, set);
    if (!sim.feasible) return null;
    const rNum = 40 * (A - N), rDen = A;
    const g = gcd(rNum, rDen);
    const r = rNum / rDen;
    const trains = findTrains(Math.abs(r), opts.gears || GEARS);
    return { A, sim, r, ratio: [rNum / g, rDen / g], trains, ok: trains.simple.length + trains.compound.length > 0 };
  };
  if (pos(opts.A)) {
    const t = tryA(opts.A);
    if (!t) throw new Error('A = ' + opts.A + ' cannot be indexed simply with the selected plates (or A = N).');
    return { N, ...t, pick: pickTrain(t) };
  }
  const cands = [];
  for (let k = 1; k <= 25; k++) {
    for (const A of [N + k, N - k]) { const t = tryA(A); if (t && t.ok) cands.push(t); }
  }
  if (!cands.length) throw new Error('No suitable A found with this gear set; try a larger set or enter A manually.');
  const t = cands[0];
  return { N, ...t, pick: pickTrain(t), alternatives: cands.slice(1, 4).map((x) => x.A) };
}
function pickTrain(t) {
  if (t.trains.simple.length) return { type: 'simple', gears: t.trains.simple[0] };
  if (t.trains.compound.length) return { type: 'compound', gears: t.trains.compound[0] };
  return null;
}

// ================================================================== UI
const h = (tag, attrs, ...kids) => {
  const e = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, '');
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
};

const eq = (label, formula, subst, ans) =>
  `<div class="stack" style="gap:2px"><div class="small muted">${label}</div>` +
  `<div class="formula mono" style="font-variant-numeric:tabular-nums;text-align:left;overflow-wrap:anywhere">${formula}` +
  (subst ? ` = ${subst}` : '') + (ans ? ` = <strong>${ans}</strong>` : '') + `</div></div>`;
const note = (t) => `<div class="small muted">${t}</div>`;
const wrap = (...parts) => `<div class="stack" style="font-variant-numeric:tabular-nums">${parts.join('')}</div>`;

/**
 * Generic card.
 * fields: {k, label, v, unit, type:'number'|'select'|'check'|'text', opts:[[value,label]], hint}
 */
function makeCard(id, title, intro, fields, examples, calc, extra) {
  const inputs = {};
  const result = h('div', { class: 'result', 'aria-live': 'polite' });
  const diagram = extra ? h('div') : null;
  const read = () => {
    const v = {};
    for (const f of fields) {
      const el = inputs[f.k];
      if (f.type === 'select') v[f.k] = el.value;
      else if (f.type === 'check') v[f.k] = el.checked;
      else if (f.type === 'text') v[f.k] = el.value;
      else { const s = el.value.trim(); v[f.k] = s === '' ? NaN : Number(s); }
    }
    return v;
  };
  const update = () => {
    const v = read();
    try {
      result.innerHTML = calc(v);
      if (diagram) diagram.innerHTML = extra(v);
    } catch (e) {
      result.innerHTML = `<div class="callout warn">${e.message || 'Check the inputs.'}</div>`;
      if (diagram) diagram.innerHTML = extra(v);
    }
  };
  const setDefaults = () => {
    for (const f of fields) {
      const el = inputs[f.k];
      if (f.type === 'check') el.checked = !!f.v;
      else el.value = f.v == null ? '' : String(f.v);
    }
  };
  const fieldEls = fields.map((f) => {
    const iid = `calc-${id}-${f.k}`;
    let el;
    if (f.type === 'select') {
      el = h('select', { id: iid }, f.opts.map(([val, lab]) => h('option', { value: val }, lab)));
      el.addEventListener('change', update);
    } else if (f.type === 'check') {
      el = h('input', { id: iid, type: 'checkbox' });
      el.addEventListener('change', update);
    } else if (f.type === 'text') {
      el = h('input', { id: iid, type: 'text', inputmode: 'numeric', autocomplete: 'off' });
      el.addEventListener('input', update);
    } else {
      el = h('input', { id: iid, type: 'number', step: 'any', inputmode: 'decimal', autocomplete: 'off' });
      el.addEventListener('input', update);
    }
    inputs[f.k] = el;
    const label = h('label', { for: iid }, f.label + (f.unit ? ` (${f.unit})` : ''));
    return h('div', { class: 'field' }, label, el, f.hint ? h('span', { class: 'small muted' }, f.hint) : null);
  });
  setDefaults();
  const exSel = examples && examples.length
    ? h('select', { id: `calc-${id}-example`, 'aria-label': 'Load exam example' },
        h('option', { value: '' }, 'Load exam example…'),
        examples.map((ex, n) => h('option', { value: String(n) }, ex.label)))
    : null;
  if (exSel) exSel.addEventListener('change', () => {
    const ex = examples[Number(exSel.value)];
    if (!ex) return;
    setDefaults();
    for (const [k, val] of Object.entries(ex.set)) {
      const el = inputs[k];
      if (!el) continue;
      if (el.type === 'checkbox') el.checked = !!val;
      else el.value = String(val);
    }
    update();
    if (ex.note) result.insertAdjacentHTML('beforeend', `<div class="small muted" style="margin-top:6px">${ex.note}</div>`);
  });
  const reset = h('button', { class: 'btn ghost', type: 'button', onclick: () => { setDefaults(); if (exSel) exSel.value = ''; update(); } }, 'Reset');
  const card = h('section', { class: 'card stack', id: `calc-card-${id}` },
    h('h3', null, title),
    intro ? h('p', { class: 'muted small', html: intro }) : null,
    h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap;align-items:center' }, exSel, reset),
    h('div', { class: 'grid-2' }, fieldEls),
    diagram,
    result);
  update();
  return card;
}

const sel = (opts) => opts;

// ---- example data (from the term-final question map) ----
const turnEx = [
  { label: '2017-18 Q5(d): grey CI, power & torque (Note C)', set: { unit: 'mm', D1: 52, d: 4.2, V: 75, f: 0.4, L: 152.5, extra: 2.5, K: 915 } },
  { label: '2018-19 Q8(b): finish in 5.0 min (over-travel 33.33% L)', set: { unit: 'mm', D1: 150, d: 4, f: 0.3, L: 400, extra: 133.33, tTarget: 5 }, note: 'Required speed is solved from the target time; over-travel = 33.33% of 400 mm = 133.33 mm.' },
  { label: '2020-21 Q1(b): Ø4.5 in bar to Ø4.25 in (inch units)', set: { unit: 'in', D1: 4.5, D2: 4.25, V: 450, MRR: 6.75, L: 46 }, note: 'Inch mode: V in ft/min, lengths in inches, MRR in in³/min. Feed is solved from the given MRR.' },
];
const passEx = [
  { label: 'Slide Q1 (slide 25): C40, Ø50 → Ø42, 120 mm', set: { D1: 50, D2: 42, L: 120, dmax: 2, fa: 0.75, Vr: 30, fr: 0.24, Vf: 60, ff: 0.1, speeds: '70, 110, 176, 280, 440, 700, 1100, 1760, 2800', snap: 'down' }, note: 'Spindle speeds snapped to the machine list (next lower). Roughing speed uses the blank diameter, finishing uses D2 + 2×allowance.' },
];
const millEx = [
  { label: '2023-24 Q6(d): 8-tooth Ø32 end mill, 150 × 15 deep', set: { mode: 'slab', D: 32, d: 15, V: 30, nt: 8, f: 0.15, L: 150, w: 32 }, note: 'Treated as a slab-type cut: A = √(d(D − d)). Width taken equal to the cutter diameter for the MRR.' },
  { label: 'Slide Q1 (slide 74): C50 steel, Ø100 slab mill', set: { mode: 'slab', D: 100, d: 2, V: 20, nt: 8, f: 0.13, L: 150, w: 150 } },
  { label: 'Slide Q2 (slide 75): Ø150 face mill, 16 teeth', set: { mode: 'face-c', D: 150, d: 6, V: 60, nt: 16, f: 0.18, L: 250, w: 115 }, note: 'Cutter assumed centred over the work (A = O = D/2).' },
];
const shapEx = [
  { label: '2016-17 Q6(d): 22 m/min, 240 × 100, f = 0.6, 220°', set: { job: 240, clear: 25, V: 22, angle: 220, width: 100, f: 0.6, depth: 3, d: 3 } },
  { label: 'Slide Q1 (slide 104): 24 m/min, 250 × 120, 220°', set: { job: 250, clear: 25, V: 24, angle: 220, width: 120, f: 0.6, depth: 6, d: 3 }, note: 'Clearance of 25 mm assumed (not legible in the slide text); height to be removed 6 mm in cuts of 3 mm.' },
];
const drillEx = [
  { label: '2023-24 Q5(b): Ø25 × 60 blind, 15 holes, 120°', set: { D: 25, V: 44, f: 0.25, theta: 120, depth: 60, type: 'blind', n: 15 } },
  { label: '2022-23 Q5(b): Ø12.7 × 60 blind, 118°', set: { D: 12.7, V: 25, f: 0.3, theta: 118, depth: 60, type: 'blind' } },
  { label: '2021-22 Q3(c): Ø25.4 × 50 blind, 100°', set: { D: 25.4, V: 25, f: 0.25, theta: 100, depth: 50, type: 'blind' } },
  { label: 'Assignment 4 Q2: Ø40 through, 100 mm plate, f = 0.35', set: { D: 40, V: 25, f: 0.35, theta: 118, depth: 100, type: 'through' }, note: 'Cutting speed not given in the slide text; 25 m/min assumed. Edit V as required.' },
];
const grindEx = [
  { label: '2017-18 Q7(c): Ø200 wheel, 2400 rpm (Note K)', set: { D: 200, N: 2400, w: 3.5, d: 0.05, vw: 6, C: 64, Fc: 25 } },
];
const surfEx = [
  { label: 'Assignment 1: Ø250 wheel, 100 × 250 work, 10 m/min', set: { D: 250, L: 250, W: 100, cross: 20, vw: 10, axis: 'horizontal' }, note: 'Crossfeed taken as the 20 mm wheel thickness.' },
];
const idxEx = [
  { label: 'N = 18 (Note H simple example)', set: { N: 18, set: 'bs' } },
  { label: '2012-13 Q7(b): 319 divisions', set: { N: 319, A: '', set: 'bs' } },
  { label: '2009-10 Q6(b): 167 divisions (A = 160)', set: { N: 167, A: 160, set: 'bs' } },
];

const num = (x) => fmt(x);

// ---- result renderers ----
function turnHtml(v) {
  const r = turning(v);
  const u = r.unit === 'in' ? { len: 'in', Vu: 'ft/min', mrr: 'in³/min', f: 'in/rev' } : { len: 'mm', Vu: 'm/min', mrr: 'mm³/min', f: 'mm/rev' };
  const parts = [];
  if (!isNum(v.D2) || !(v.D2 > 0)) { /* d given directly */ } else parts.push(eq('Depth of cut', 'd = (D<sub>1</sub> − D<sub>2</sub>)/2', `(${num(v.D1)} − ${num(v.D2)})/2`, `${num(r.d)} ${u.len}`));
  if (r.fFromMRR) parts.push(eq('Feed from the given MRR', 'f = MRR/(V·d)', `${num(v.MRR)}/(${num(v.V * r.k)}×${num(r.d)})`, `${num(r.f)} ${u.f}`));
  if (r.mode === 'target') {
    parts.push(eq('Required spindle speed', 'N = (L + over-travel)/(f·t)', `${num(r.Ltot)}/(${num(r.f)}×${num(r.time)})`, `${num(r.N)} rpm`));
    parts.push(eq('Required cutting speed', 'V = πDN/' + (r.unit === 'in' ? '12' : '1000'), `π×${num(r.D)}×${num(r.N)}/${r.k}`, `${num(r.V)} ${u.Vu}`));
  } else {
    parts.push(eq('Spindle speed', 'N = ' + r.k + 'V/(πD)', `${r.k}×${num(r.V0)}/(π×${num(r.D)})`, `${num(r.N0)} rpm`));
    if (r.snapped) parts.push(eq('Snapped to available speed', 'N<sub>used</sub>', '', `${num(r.N)} rpm (V = ${num(r.V)} ${u.Vu})`));
    parts.push(eq('Machining time', 't = (L + approach/over-travel)/(f·N)', `(${num(r.L)} + ${num(r.extra)})/(${num(r.f)}×${num(r.N)})`, `${num(r.time)} min (${num(r.time * 60)} s)`));
  }
  parts.push(eq('Material removal rate', 'MRR = V·f·d', `${num(r.V * r.k)}×${num(r.f)}×${num(r.d)}`, `${num(r.MRR)} ${u.mrr}`));
  if (r.P != null) {
    parts.push(eq('Cutting force', 'F<sub>c</sub> = K·f·d', `${num(v.K)}×${num(r.f)}×${num(r.d)}`, `${num(r.Fc)} N`));
    parts.push(eq('Cutting power', 'P = K·MRR', `${num(v.K)}×${num(r.MRR)}/(1000×60)`, `${num(r.P)} W = ${num(r.P / 1000)} kW`));
    if (r.eff < 1) parts.push(eq('Motor power', 'P<sub>motor</sub> = P/η', `${num(r.P)}/${num(r.eff)}`, `${num(r.Pmotor / 1000)} kW`));
    parts.push(eq('Spindle torque', 'T = P/ω = P/(2πN/60)', `${num(r.P)}/(2π×${num(r.N)}/60)`, `${num(r.T)} N·m`));
  } else if (r.unit === 'in') parts.push(note('Power and torque need K in N/mm² – use mm units for those.'));
  return wrap(...parts);
}

function passHtml(v) {
  const r = turningPasses(v);
  const u = r.unit === 'in' ? 'in' : 'mm';
  const parts = [];
  parts.push(eq('Total radial depth', '(D<sub>1</sub> − D<sub>2</sub>)/2', `(${num(v.D1)} − ${num(v.D2)})/2`, `${num(r.total)} ${u}`));
  parts.push(eq('Roughing passes', 'n = ⌈(total − finish allowance)/d<sub>max</sub>⌉', `⌈${num(r.roughTotal)}/${num(v.dmax)}⌉`, `${r.nRough} pass${r.nRough === 1 ? '' : 'es'}${r.nRough ? ' of ' + num(r.roughTotal / r.nRough) + ' ' + u : ''}`));
  parts.push(eq('Finishing', 'finish allowance', '', r.nFinish ? `1 pass of ${num(r.finishDepth)} ${u}` : 'none'));
  if (r.nRough) {
    parts.push(eq('Roughing speed', 'N<sub>r</sub> = ' + (u === 'in' ? 12 : 1000) + 'V/(πD<sub>1</sub>)', '', `${num(r.N0r)} rpm${r.snapped ? ' → ' + num(r.Nr) + ' rpm' : ''}`));
    parts.push(eq('Roughing time', 't<sub>r</sub> = n(L + extra)/(f·N)', `${r.nRough}×${num(r.Ltot)}/(${num(v.fr)}×${num(r.Nr)})`, `${num(r.tRough)} min`));
  }
  if (r.nFinish) {
    parts.push(eq('Finishing speed', 'N<sub>f</sub> = ' + (u === 'in' ? 12 : 1000) + 'V/(πD)', `D = ${num(r.Df)}`, `${num(r.N0f)} rpm${r.snapped ? ' → ' + num(r.Nf) + ' rpm' : ''}`));
    parts.push(eq('Finishing time', 't<sub>f</sub> = (L + extra)/(f·N)', `${num(r.Ltot)}/(${num(v.ff)}×${num(r.Nf)})`, `${num(r.tFin)} min`));
  }
  parts.push(eq('Total machining time', 't = t<sub>r</sub> + t<sub>f</sub>', `${num(r.tRough)} + ${num(r.tFin)}`, `${num(r.time)} min`));
  return wrap(...parts);
}

function millHtml(v) {
  const r = milling(v);
  const parts = [
    eq('Spindle speed', 'N = 1000V/(πD)', `1000×${num(v.V)}/(π×${num(v.D)})`, `${num(r.N)} rpm`),
    eq('Table feed', 'f<sub>r</sub> = N·n<sub>t</sub>·f', `${num(r.N)}×${num(v.nt)}×${num(v.f)}`, `${num(r.fr)} mm/min`),
    eq('Approach' + (r.mode === 'slab' ? ' (slab milling)' : r.mode === 'face-c' ? ' (face, centred)' : ' (face, offset)'), r.formula,
      r.mode === 'slab' ? `√(${num(v.d)}(${num(v.D)} − ${num(v.d)}))` : r.mode === 'face-c' ? `${num(v.D)}/2` : `√(${num(v.w)}(${num(v.D)} − ${num(v.w)}))`, `${num(r.A)} mm`),
    eq('Machining time', 'T<sub>m</sub> = (L + A + O)/f<sub>r</sub>', `(${num(v.L)} + ${num(r.A)} + ${num(r.O)})/${num(r.fr)}`, `${num(r.Tm)} min (${num(r.Tm * 60)} s)`),
  ];
  if (isNum(r.MRR)) parts.push(eq('Material removal rate', 'MRR = w·d·f<sub>r</sub>', `${num(r.w)}×${num(v.d)}×${num(r.fr)}`, `${num(r.MRR)} mm³/min`));
  else parts.push(note('Enter the width of cut w to get the MRR.'));
  return wrap(...parts);
}

function shapHtml(v) {
  const r = shaper(v);
  const parts = [eq('Stroke length', 'L = job + clearance', `${num(v.job)} + ${num(v.clear || 0)}`, `${num(r.L)} mm`),
    eq('Forward (cutting) stroke time', 't<sub>f</sub> = L/V', `${num(r.L)}/${num(v.V * 1000)}`, `${num(r.tF)} min (${num(r.tF * 60)} s)`)];
  if (isNum(r.alpha)) {
    parts.push(eq('Time per double stroke', 'T = t<sub>f</sub>×360/α', `${num(r.tF)}×360/${num(r.alpha)}`, `${num(r.total)} min`));
    parts.push(eq('Return stroke time', 't<sub>r</sub> = T − t<sub>f</sub>', `${num(r.total)} − ${num(r.tF)}`, `${num(r.tR)} min (${num(r.tR * 60)} s)`));
    parts.push(eq('Quick-return ratio', 'V<sub>return</sub>/V<sub>cut</sub> = α/(360 − α)', `${num(r.alpha)}/${num(360 - r.alpha)}`, num(r.ratio)));
  } else parts.push(note('Enter the forward-stroke crank angle to get the return stroke and return ratio.'));
  parts.push(eq('Strokes per minute', 'n = 1/T', `1/${num(r.total)}`, num(r.spm)));
  parts.push(eq('Number of strokes' + (v.plusOne ? ' (+1)' : ''), 'width/f' + (v.plusOne ? ' + 1' : ''), `${num(v.width)}/${num(v.f)}${v.plusOne ? ' + 1' : ''}`, num(r.nStrokes)));
  if (r.passes >= 1 && pos(v.depth) && pos(v.d)) parts.push(eq('Number of cuts', 'depth/d', `⌈${num(v.depth)}/${num(v.d)}⌉`, String(r.passes)));
  parts.push(eq('Total machining time', 't = passes × strokes × T', `${r.passes}×${num(r.nStrokes)}×${num(r.total)}`, `${num(r.time)} min`));
  if (isNum(r.MRR)) parts.push(eq('Material removal rate', 'MRR = volume/t', `${num(v.job)}×${num(v.width)}×${num(pos(v.depth) ? v.depth : v.d)}/${num(r.time)}`, `${num(r.MRR)} mm³/min`));
  return wrap(...parts);
}

function drillHtml(v) {
  const r = drilling(v);
  const parts = [
    eq('Spindle speed', 'N = 1000V/(πD)', `1000×${num(v.V)}/(π×${num(v.D)})`, `${num(r.N)} rpm`),
    eq('Feed rate', 'f<sub>r</sub> = f·N', `${num(v.f)}×${num(r.N)}`, `${num(r.fr)} mm/min`),
    eq('Point approach', 'A = 0.5D·tan(90° − θ/2)', `0.5×${num(v.D)}×tan(90 − ${num(r.theta)}/2)`, `${num(r.A)} mm`),
    eq('Machining time' + (r.through ? ' (through)' : ' (blind)'), r.through ? 'T<sub>m</sub> = (t + A + O)/f<sub>r</sub>' : 'T<sub>m</sub> = (L + A)/f<sub>r</sub>', `(${num(v.depth)} + ${num(r.A)}${r.through ? ' + ' + num(r.O) : ''})/${num(r.fr)}`, `${num(r.Tm)} min (${num(r.Tm * 60)} s)`),
    eq('Material removal rate', 'MRR = πD²f<sub>r</sub>/4', `π×${num(v.D)}²×${num(r.fr)}/4`, `${num(r.MRR)} mm³/min`),
  ];
  if (r.n > 1) parts.push(eq(`Time for ${r.n} holes`, 'n·T<sub>m</sub>', `${r.n}×${num(r.Tm)}`, `${num(r.total)} min`));
  return wrap(...parts);
}

function grindHtml(v) {
  const r = grinding(v);
  const parts = [
    eq('Wheel surface speed', 'v = πDN', `π×${num(v.D)}×${num(v.N)}`, `${num(r.v)} mm/min = ${num(r.vms)} m/s`),
    eq('Length of contact', 'l<sub>c</sub> = √(D·d)', `√(${num(v.D)}×${num(v.d)})`, `${num(r.lc)} mm`),
  ];
  if (r.MRR != null) parts.push(eq('Material removal rate', 'MRR = v<sub>w</sub>·w·d', `${num(v.vw * 1000)}×${num(v.w)}×${num(v.d)}`, `${num(r.MRR)} mm³/min (${num(r.MRR / 60)} mm³/s)`));
  else parts.push(note('Enter work speed v<sub>w</sub> and crossfeed w for MRR and chips.'));
  if (r.nc != null) {
    parts.push(eq('Chips per minute', 'n<sub>c</sub> = v·w·C', `${num(r.v)}×${num(v.w)}×${num(v.C / 100)}`, `${num(r.nc)} /min (${num(r.ncs)} /s)`));
    parts.push(eq('Average volume per chip', 'MRR/n<sub>c</sub>', `${num(r.MRR)}/${num(r.nc)}`, `${num(r.vchip)} mm³`));
  }
  if (r.U != null) {
    parts.push(eq('Grinding power', 'P = F<sub>c</sub>·v', `${num(v.Fc)}×${num(r.vms)}`, `${num(r.Pw)} W`));
    parts.push(eq('Specific energy', 'U = P/MRR', `${num(r.Pw)}/${num(r.MRR / 60)}`, `${num(r.U)} J/mm³`));
  }
  return wrap(...parts);
}

function surfHtml(v) {
  const r = surfaceGrinding(v);
  const parts = [
    eq('Approach', r.vertical ? 'A = O = D/2 (centred wheel)' : 'A = D/2', `${num(v.D)}/2`, `${num(r.A)} mm`),
    eq('Time per pass', 't<sub>p</sub> = (L + 2A)/V<sub>w</sub>', `(${num(v.L)} + ${num(2 * r.A)})/${num(v.vw * 1000)}`, `${num(r.tPass)} min`),
    eq('Passes across the width', 'n = ⌈W/crossfeed⌉', `⌈${num(v.W)}/${num(r.cross)}⌉`, String(r.pw)),
  ];
  if (r.pd > 1) parts.push(eq('Passes in depth', 'depth/d', '', String(r.pd)));
  parts.push(eq('Grinding time', 't = passes × t<sub>p</sub>', `${r.passes}×${num(r.tPass)}`, `${num(r.time)} min (${num(r.time * 60)} s)`));
  if (r.vertical) parts.push(note('Vertical-axis wheel: crossfeed = wheel diameter (wheel covers the width); treated like face milling.'));
  return wrap(...parts);
}

function trainStr(p) {
  if (!p) return 'no train found in this gear set';
  const g = p.gears;
  return p.type === 'simple' ? `driver ${g[0]} / driven ${g[1]}` : `(${g[0]}/${g[1]}) × (${g[2]}/${g[3]}) → drivers ${g[0]}, ${g[2]}; driven ${g[1]}, ${g[3]}`;
}

function idxHtml(v) {
  const s = indexSimple(v.N, v.set);
  const parts = [eq('Crank turns', 'n = 40/N', `40/${num(v.N)}`, `${num(40 / v.N)} turns`)];
  if (s.rem === 0) parts.push(note(`${s.whole} full turns, no hole counting needed.`));
  else if (s.feasible) {
    const best = s.circles[0];
    parts.push(eq('Whole turns + fraction', `${s.whole} + ${s.rem}/${v.N}`, s.frac && (s.frac[0] !== s.rem) ? `${s.whole} + ${s.frac[0]}/${s.frac[1]}` : '', `${s.whole} turns + ${best.holes} holes in the ${best.c}-hole circle`));
    parts.push(note('Also possible: ' + s.circles.slice(0, 6).map((c) => `${c.holes} holes in ${c.c}-circle (${c.plate})`).join('; ') + '.'));
  }
  if (!s.feasible) {
    parts.push(`<div class="callout warn">${v.N} cannot be indexed simply with the chosen plates (fraction ${s.frac[0]}/${s.frac[1]} has no matching hole circle). Use differential indexing.</div>`);
  }
  try {
    const dflt = indexDifferential(v.N, { set: v.set, A: pos(v.A) ? v.A : undefined });
    if (!s.feasible || pos(v.A)) {
      const dd = dflt;
      const sim = dd.sim;
      const bc = sim.circles[0];
      parts.push(`<div class="small muted" style="margin-top:6px"><strong>Differential indexing</strong></div>`);
      parts.push(eq('Chosen A', 'A close to N, 40/A by simple indexing', `A = ${dd.A}`, sim.rem === 0 ? `${sim.whole} turns` : `${sim.whole ? sim.whole + ' turns + ' : ''}${bc.holes} holes in the ${bc.c}-hole circle`));
      parts.push(eq('Gear ratio', 'r = driver/driven = 40(A − N)/A', `40(${dd.A} − ${v.N})/${dd.A}`, `${dd.ratio[0]}/${dd.ratio[1]} (${num(dd.r)})`));
      parts.push(eq('Change gears', trainStr(dd.pick), '', ''));
      parts.push(note(dd.A > v.N ? 'A > N: r positive, index plate turns in the SAME direction as the crank (one idler in a simple train).' : 'A < N: r negative, index plate turns OPPOSITE to the crank (add an extra idler).'));
      if (dd.alternatives && dd.alternatives.length) parts.push(note('Other workable A values: ' + dd.alternatives.join(', ') + '.'));
    } else {
      parts.push(note('N is simple-indexable; clear the diagram by entering A to see the differential alternative.'));
    }
  } catch (e) {
    if (!s.feasible || pos(v.A)) parts.push(`<div class="callout warn">${e.message}</div>`);
  }
  return wrap(...parts);
}

export function renderCalculators(el) {
  el.innerHTML = '';
  const cards = [];
  const group = (id, title, ...c) => { cards.push({ id, title }); return h('div', { class: 'stack', id: `calc-group-${id}` }, h('h2', null, title), c); };
  const unitSel = [['mm', 'mm / m·min⁻¹ (metric)'], ['in', 'inch / ft·min⁻¹']];

  const turningCard = makeCard('turn', 'Turning: speed, time, MRR, power & torque',
    'V = πDN/1000, MRR = V·f·d, t = (L + approach/over-travel)/(fN), P = K·MRR. Give D<sub>2</sub> <em>or</em> d. Optionally a target time to solve the required speed.',
    [
      { k: 'unit', label: 'Units', type: 'select', opts: unitSel, v: 'mm' },
      { k: 'D1', label: 'Job diameter D (D₁)', unit: 'mm | in', v: 52 },
      { k: 'D2', label: 'Final diameter D₂', unit: 'optional', v: '', hint: 'If given, d = (D₁−D₂)/2' },
      { k: 'd', label: 'Depth of cut d', unit: 'mm | in', v: 4.2 },
      { k: 'V', label: 'Cutting speed V', unit: 'm/min | ft/min', v: 75 },
      { k: 'f', label: 'Feed f', unit: 'per rev', v: 0.4 },
      { k: 'L', label: 'Length of cut L', unit: 'mm | in', v: 152.5 },
      { k: 'extra', label: 'Approach + over-travel', unit: 'mm | in', v: 2.5 },
      { k: 'MRR', label: 'Given MRR (solves f if f blank)', unit: 'optional', v: '' },
      { k: 'tTarget', label: 'Target time (solves N, V)', unit: 'min, optional', v: '' },
      { k: 'K', label: 'Specific energy K', unit: 'N/mm², mm only', v: 915 },
      { k: 'eff', label: 'Drive efficiency', unit: '%, optional', v: '' },
      { k: 'speeds', label: 'Available spindle speeds', type: 'text', v: '', unit: 'rpm list, optional' },
      { k: 'snap', label: 'Snap rule', type: 'select', opts: [['down', 'Next lower speed'], ['nearest', 'Nearest speed']], v: 'down' },
    ], turnEx, turnHtml);

  const passCard = makeCard('pass', 'Turning: roughing + finishing passes',
    'Passes = ⌈(total depth − finish allowance)/d<sub>max</sub>⌉ roughing + 1 finishing pass; speeds optionally snapped to the lathe\'s speed list.',
    [
      { k: 'unit', label: 'Units', type: 'select', opts: unitSel, v: 'mm' },
      { k: 'D1', label: 'Blank diameter D₁', unit: 'mm | in', v: 50 },
      { k: 'D2', label: 'Finished diameter D₂', unit: 'mm | in', v: 42 },
      { k: 'L', label: 'Length of cut L', unit: 'mm | in', v: 120 },
      { k: 'extra', label: 'Approach + over-travel', unit: 'mm | in', v: 0 },
      { k: 'dmax', label: 'Max roughing depth', unit: 'mm | in', v: 2 },
      { k: 'fa', label: 'Finish allowance (radial)', unit: 'mm | in', v: 0.75 },
      { k: 'Vr', label: 'Roughing speed', unit: 'm/min', v: 30 },
      { k: 'fr', label: 'Roughing feed', unit: 'per rev', v: 0.24 },
      { k: 'Vf', label: 'Finishing speed', unit: 'm/min', v: 60 },
      { k: 'ff', label: 'Finishing feed', unit: 'per rev', v: 0.1 },
      { k: 'speeds', label: 'Available spindle speeds', type: 'text', v: '70, 110, 176, 280, 440, 700, 1100, 1760, 2800', unit: 'rpm' },
      { k: 'snap', label: 'Snap rule', type: 'select', opts: [['down', 'Next lower speed'], ['nearest', 'Nearest speed']], v: 'down' },
    ], passEx, passHtml);

  const millCard = makeCard('mill', 'Milling: speed, feed, approach, time, MRR',
    'N = 1000V/(πD), f<sub>r</sub> = N·n<sub>t</sub>·f, T<sub>m</sub> = (L + A + O)/f<sub>r</sub>. Diagram updates with the inputs.',
    [
      { k: 'mode', label: 'Case', type: 'select', opts: [['slab', 'Slab / peripheral: A = √(d(D−d))'], ['face-c', 'Face, cutter centred: A = O = D/2'], ['face-o', 'Face, offset: A = O = √(w(D−w))']], v: 'slab' },
      { k: 'D', label: 'Cutter diameter D', unit: 'mm', v: 100 },
      { k: 'd', label: 'Depth of cut d', unit: 'mm', v: 2 },
      { k: 'w', label: 'Width of cut w', unit: 'mm', v: 150, hint: 'Needed for MRR and the offset case' },
      { k: 'V', label: 'Cutting speed V', unit: 'm/min', v: 20 },
      { k: 'nt', label: 'Number of teeth nₜ', v: 8 },
      { k: 'f', label: 'Feed per tooth f', unit: 'mm/tooth', v: 0.13 },
      { k: 'L', label: 'Length of cut L', unit: 'mm', v: 150 },
      { k: 'O', label: 'Over-travel O (slab only)', unit: 'mm', v: 0 },
    ], millEx, millHtml, (v) => millingDiagram(v, (() => { try { return milling(v); } catch (e) { return null; } })()));

  const shaperCard = makeCard('shaper', 'Shaper: stroke time, strokes, total time',
    'L = job + clearance; t<sub>f</sub> = L/V; T = t<sub>f</sub>×360/α; strokes = width/f; time = cuts × strokes × T.',
    [
      { k: 'job', label: 'Job length (stroke direction)', unit: 'mm', v: 250 },
      { k: 'clear', label: 'Clearance (both ends)', unit: 'mm', v: 25 },
      { k: 'V', label: 'Cutting speed', unit: 'm/min', v: 24 },
      { k: 'angle', label: 'Forward-stroke crank angle α', unit: '°', v: 220 },
      { k: 'width', label: 'Job width (feed direction)', unit: 'mm', v: 120 },
      { k: 'f', label: 'Feed per stroke', unit: 'mm', v: 0.6 },
      { k: 'depth', label: 'Total depth to remove', unit: 'mm', v: 6 },
      { k: 'd', label: 'Depth of cut per pass d', unit: 'mm', v: 3 },
      { k: 'plusOne', label: 'Add 1 to number of strokes', type: 'check', v: false },
    ], shapEx, shapHtml);

  const drillCard = makeCard('drill', 'Drilling: time, MRR, many holes',
    'N = 1000V/(πD), A = 0.5D·tan(90° − θ/2), T<sub>m</sub> = (L + A [+ O])/(fN), MRR = πD²f<sub>r</sub>/4.',
    [
      { k: 'D', label: 'Drill diameter D', unit: 'mm', v: 12.7 },
      { k: 'V', label: 'Cutting speed V', unit: 'm/min', v: 25 },
      { k: 'f', label: 'Feed f', unit: 'mm/rev', v: 0.3 },
      { k: 'theta', label: 'Point angle θ', unit: '°', v: 118 },
      { k: 'depth', label: 'Hole depth / plate thickness', unit: 'mm', v: 60 },
      { k: 'type', label: 'Hole type', type: 'select', opts: [['blind', 'Blind: T = (L + A)/fᵣ'], ['through', 'Through: T = (t + A + O)/fᵣ']], v: 'blind' },
      { k: 'O', label: 'Over-travel O (through)', unit: 'mm', v: 0 },
      { k: 'n', label: 'Number of holes', v: 1 },
    ], drillEx, drillHtml);

  const grindCard = makeCard('grind', 'Grinding: contact length, MRR, chips, specific energy',
    'v = πDN, l<sub>c</sub> = √(D·d), MRR = v<sub>w</sub>·w·d, n<sub>c</sub> = v·w·C, U = F<sub>c</sub>·v/MRR.',
    [
      { k: 'D', label: 'Wheel diameter D', unit: 'mm', v: 200 },
      { k: 'N', label: 'Wheel speed N', unit: 'rpm', v: 2400 },
      { k: 'd', label: 'Depth of cut d', unit: 'mm', v: 0.05 },
      { k: 'w', label: 'Crossfeed / width w', unit: 'mm', v: 3.5 },
      { k: 'vw', label: 'Work speed vᵥ', unit: 'm/min', v: 6 },
      { k: 'C', label: 'Active grits C', unit: 'per cm²', v: 64 },
      { k: 'Fc', label: 'Tangential force Fᶜ', unit: 'N', v: 25 },
    ], grindEx, grindHtml);

  const surfCard = makeCard('surf', 'Surface-grinding time',
    'Time per pass = (L + 2A)/V<sub>w</sub> with A = D/2; passes = width/crossfeed (× passes in depth if given).',
    [
      { k: 'axis', label: 'Wheel axis', type: 'select', opts: [['horizontal', 'Horizontal axis (periphery)'], ['vertical', 'Vertical axis (face of wheel)']], v: 'horizontal' },
      { k: 'D', label: 'Wheel diameter D', unit: 'mm', v: 250 },
      { k: 'L', label: 'Work length L', unit: 'mm', v: 250 },
      { k: 'W', label: 'Work width', unit: 'mm', v: 100 },
      { k: 'cross', label: 'Crossfeed (horizontal axis)', unit: 'mm', v: 20, hint: 'Usually the wheel thickness' },
      { k: 'vw', label: 'Table speed', unit: 'm/min', v: 10 },
      { k: 'depth', label: 'Total stock to remove', unit: 'mm, optional', v: '' },
      { k: 'dpass', label: 'Depth per pass', unit: 'mm, optional', v: '' },
    ], surfEx, surfHtml);

  const idxCard = makeCard('index', 'Indexing: simple & differential',
    'Simple: crank turns = 40/N. Differential: r = driver/driven = 40(A − N)/A, gears from 24, 24, 28, 32, 40, 44, 48, 56, 64, 72, 86, 100.',
    [
      { k: 'N', label: 'Divisions N', v: 319 },
      { k: 'A', label: 'Chosen A (differential)', unit: 'blank = auto', v: '' },
      { k: 'set', label: 'Index plates', type: 'select', opts: [['bs', 'Brown & Sharpe (15–49)'], ['cin', 'Cincinnati (24–66)'], ['both', 'Both']], v: 'bs' },
    ], idxEx, idxHtml);

  const nav = h('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap' });
  const root = h('div', { class: 'stack' },
    h('div', { class: 'callout' }, 'Each calculator shows the formula, the substitution and the answer. Use "Load exam example" to reproduce a real term-final question. All results are for study; check units (mm, m/min, rpm) before trusting them.'),
    nav,
    group('turning', 'Turning', turningCard, passCard),
    group('milling', 'Milling', millCard),
    group('shaping', 'Shaping', shaperCard),
    group('drilling', 'Drilling', drillCard),
    group('grinding', 'Grinding', grindCard, surfCard),
    group('indexing', 'Indexing', idxCard));
  for (const c of cards) nav.append(h('button', { class: 'chip', type: 'button', onclick: () => { const t = root.querySelector('#calc-group-' + c.id); if (t && t.scrollIntoView) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, c.title));
  el.append(root);
}
