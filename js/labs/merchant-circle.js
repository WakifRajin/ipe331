// Effect lab: Merchant's circle diagram. Orthogonal cut in 3D (units: 1 mm of chip thickness = K scene units) with the
// force circle drafted in the plane of the cut at the tool tip, plus a clean 2D copy in the plot panel.
const DEG = Math.PI / 180, TAU = Math.PI * 2, K = 12, NC = 12, SC = 0.008;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const MK = ['gamma', 'a1', 'a2', 'b', 'Pz', 'Pxy', 'Vc', 'phi'];

// Merchant analysis. p: gamma(deg), a1, a2, b (mm), Pz, Pxy (N), Vc (m/min). Writes into o.
function solve(p, o = {}) {
  const g = p.gamma * DEG, cg = Math.cos(g), sg = Math.sin(g);
  o.xi = p.a2 / p.a1;
  o.beta = clamp(Math.atan2(cg, o.xi - sg), 0.06, 1.3);
  const cb = Math.cos(o.beta), sb = Math.sin(o.beta);
  o.F = p.Pz * sg + p.Pxy * cg;
  o.N = p.Pz * cg - p.Pxy * sg;
  o.eta = Math.atan2(o.F, Math.max(o.N, 1e-6));
  o.mu = Math.min(Math.tan(o.eta), 99);
  o.R = Math.hypot(p.Pz, p.Pxy);
  o.Ps = p.Pz * cb - p.Pxy * sb;
  o.Pn = p.Pz * sb + p.Pxy * cb;
  o.As = (p.b * p.a1) / sb;
  o.tau = o.Ps / o.As;
  o.sig = o.Pn / o.As;
  o.Vf = p.Vc / o.xi;
  o.Vs = (p.Vc * cg) / Math.cos(o.beta - g);
  o.pow = (p.Pz * p.Vc) / 60;
  o.betaD = o.beta / DEG;
  o.etaD = o.eta / DEG;
  o.betaM = 45 + p.gamma / 2 - o.etaD / 2;
  return o;
}

// Exam numericals. Turning data -> orthogonal model: a1 = So sin(phi), b = d / sin(phi), Pxy = Py / cos(phi) = Px / sin(phi).
function fromRaw(r) {
  const s = Math.sin(r.phi * DEG), c = Math.cos(r.phi * DEG);
  const a1 = r.so * s;
  return {
    gamma: r.gamma, phi: r.phi, a1, b: r.dep / s,
    a2: r.a2 != null ? r.a2 : r.xi * a1,
    Pz: r.Pz, Pxy: r.Pxy != null ? r.Pxy : r.Px != null ? r.Px / s : r.Py / c,
    Vc: r.Dia ? (Math.PI * r.Dia * r.rpm) / 1000 : 100,
  };
}
const li = (k, v, u = '') => `<li>${k} = <b>${v}</b> ${u}</li>`;
const PRE = [
  { id: 'sae', q: '2012-13 Q.2(c)', t: 'SAE 133, MCD', raw: { gamma: 20, phi: 60, so: 0.25, dep: 6, Pz: 1000, Px: 347, xi: 1.732, Dia: 200, rpm: 650 },
    ans: (d, s) => li('R', d.R.toFixed(0), `N at ${(Math.atan2(s.Pxy, s.Pz) / DEG).toFixed(1)}° below Pz`) + li('β', d.betaD.toFixed(1), '°') + li('F', d.F.toFixed(0), 'N') + li('η', d.etaD.toFixed(1), '°') + li('Power', (d.pow / 1000).toFixed(2), 'kW') },
  { id: 'steel12', q: '2010-11 Q.4(c) · 2017-18 Q.2(d)', t: 'Steel, γ = −12°', raw: { gamma: -12, phi: 60, so: 0.32, dep: 4, Pz: 1000, Py: 200, a2: 0.8, Dia: 150, rpm: 560 },
    ans: (d) => li('F', d.F.toFixed(1), 'N') + li('N', d.N.toFixed(1), 'N') + li('μ', d.mu.toFixed(3)) + li('Ps', d.Ps.toFixed(1), 'N') + li('τs', d.tau.toFixed(1), 'N/mm²') },
  { id: 'safe', q: '2018-19 Q.2(c)', t: 'SAFE 133', raw: { gamma: 6, phi: 60, so: 0.24, dep: 2, Pz: 1050, Px: 450, xi: 1.8, Dia: 150, rpm: 450 },
    ans: (d) => li('μ', d.mu.toFixed(3)) + li('Ps', d.Ps.toFixed(1), 'N') + li('Pn', d.Pn.toFixed(1), 'N') },
  { id: 'ors', q: '2023-24 Q.1(c)', t: '200 mm rod', raw: { gamma: 10, phi: 60, so: 0.24, dep: 2, Pz: 1000, Py: 200, a2: 0.8, Dia: 200, rpm: 540 },
    ans: (d) => li('γx, γy', `${(Math.atan(Math.tan(10 * DEG) * Math.sin(60 * DEG)) / DEG).toFixed(2)}°, ${(Math.atan(Math.tan(10 * DEG) * Math.cos(60 * DEG)) / DEG).toFixed(2)}°`) + li('μ', d.mu.toFixed(3)) + li('N', d.N.toFixed(1), 'N') + li('Power', (d.pow / 1000).toFixed(2), 'kW') },
  { id: 'mild', q: '2014-15 Q.2(c)', t: 'Mild steel, ξ = 3.5', raw: { gamma: 20, phi: 60, so: 0.24, dep: 2.5, Pz: 800, Px: 400, xi: 3.5, Dia: 150, rpm: 340 },
    ans: (d) => li('μ', d.mu.toFixed(3)) + li('β', d.betaD.toFixed(2), '°') + li('Chip velocity', d.Vf.toFixed(1), 'm/min') + li('τs', d.tau.toFixed(1), 'N/mm²') },
  { id: 'duct', q: '2016-17 Q.2(c)', t: 'Ductile metal', raw: { gamma: 10, phi: 70, so: 0.24, dep: 3, Pz: 750, Py: 200, a2: 0.7, Dia: 120, rpm: 320 },
    ans: (d) => li('F', d.F.toFixed(1), 'N') + li('N', d.N.toFixed(1), 'N') + li('Ps', d.Ps.toFixed(1), 'N') + li('τs', d.tau.toFixed(1), 'N/mm²') },
  { id: 'ps', q: '2021-22 Q.7(c)', t: 'Shear force', raw: { gamma: 0, phi: 90, so: 0.2, dep: 4, Pz: 900, Pxy: 600, xi: 1 / Math.tan(30 * DEG) },
    ans: (d) => li('β', d.betaD.toFixed(1), '°') + li('Ps = Pz cosβ − Pxy sinβ', d.Ps.toFixed(1), 'N') + '<li>(γ not given: Ps does not depend on it)</li>' },
  { id: 'eq', q: '2013-14 Q.2(c)', t: 'Pz = Pxy = F = N', raw: { gamma: 0, phi: 90, so: 0.2, dep: 4, Pz: 1000, Pxy: 1000, xi: 3 },
    ans: (d) => li('γ', '0', '°') + li('φ', '90', '°  (Px = Pxy)') + li('β', d.betaD.toFixed(2), '°  (tanβ = 1/3)') + li('Pn / Ps', (d.Pn / d.Ps).toFixed(2)) },
  { id: 'px', q: '2011-12 Q.3(c)', t: 'Find Px, Py', raw: (() => { const g = 12 * DEG, b = Math.atan(Math.cos(g) / (3 - Math.sin(g))); return { gamma: 12, phi: 60, so: 0.25, dep: 4, Pz: 800, xi: 3, Pxy: 800 * Math.tan(Math.PI / 4 + g - b - g) }; })(),
    ans: (d, s) => li('β', d.betaD.toFixed(2), '°') + li('η = 45° + γ − β', d.etaD.toFixed(2), '°') + li('Pxy = Pz tan(η−γ)', s.Pxy.toFixed(1), 'N') + li('Px = Pxy sinφ', (s.Pxy * Math.sin(60 * DEG)).toFixed(1), 'N') + li('Py = Pxy cosφ', (s.Pxy * Math.cos(60 * DEG)).toFixed(1), 'N') },
  { id: 'feed', q: '2015-16 Q.5(b)', t: '160 mm rod (feed force = Px)', raw: { gamma: -10, phi: 75, so: 0.32, dep: 4, Pz: 1600, Px: 800, a2: 1, Dia: 160, rpm: 560 },
    ans: (d) => li('μ', d.mu.toFixed(3)) + li('Chip velocity', (d.Vf / 60).toFixed(2), 'm/s') + li('τs', d.tau.toFixed(1), 'N/mm²') + li('Power', (d.pow / 1000).toFixed(2), 'kW') },
].map((p, i) => {
  const set = fromRaw(p.raw);
  return { ...p, i: i + 1, set, html: p.ans(solve(set), set) };
});
export const answers = () => PRE.map((p) => ({ id: p.id, q: p.q, html: p.html.replace(/<[^>]+>/g, ' ') }));
const setStr = (p) => `mode:meas,pre:${p.i},` + MK.map((k) => `${k}:${(+p.set[k].toFixed(4))}`).join(',');

export default {
  id: 'merchant-circle',
  chapter: 'cutting',
  title: 'Merchant’s circle diagram',
  eyebrow: 'Cutting mechanics · Lec 2–3 · slides 33–55',
  sub: 'An orthogonal cut in 3D with the force circle drawn at the tool tip. Build it step by step, then change rake, friction and forces and watch every quantity move.',
  blurb: 'Resultant force, F and N, Ps and Pn, shear angle, chip ratio and velocities on a live Merchant circle, with solved exam numericals.',
  qs: ['2023-24_1b', '2023-24_1c', '2021-22_7c', '2018-19_2b', '2018-19_2c', '2017-18_2c', '2017-18_2d', '2016-17_2b', '2016-17_2c', '2015-16_5b', '2014-15_2b', '2014-15_2c', '2014-15_4c', '2013-14_2b', '2013-14_2c', '2012-13_2b', '2012-13_2c', '2011-12_3b', '2011-12_3c', '2010-11_4a', '2010-11_4c', '2009-10_4a', '2009-10_4b'],
  params: { gamma: 20, a1: 0.2165, a2: 0.375, b: 6.928, Pz: 1000, Pxy: 400.7, Vc: 408, phi: 60, mu: 0.6, tau: 400, mode: 'meas', pre: 1, stage: 6 },

  build({ THREE: T, scene, P, kit }) {
    const D = {};
    const snap = {};
    for (const k of MK) snap[k] = P[k];
    const std = (c, m, r) => new T.MeshStandardMaterial({ color: c, metalness: m, roughness: r, flatShading: true });
    const matA = std(0xd9dde0, 0.6, 0.35), matB = std(0xaab2b9, 0.6, 0.4), matT = new T.MeshBasicMaterial({ color: 0x3c4650 });
    const unit = new T.BoxGeometry(1, 1, 1).translate(0.5, 0.5, 0.5);
    const tick = new T.BoxGeometry(0.12, 1, 0.04);
    const work = new T.Mesh(new T.BufferGeometry(), kit.M.work), tool = new T.Mesh(new T.BufferGeometry(), kit.M.carbide);
    const shearLine = new T.Mesh(new T.BoxGeometry(1, 0.14, 1), kit.M.amber);
    scene.add(work, tool, shearLine);
    const cards = [], ticks = [];
    for (let i = 0; i < NC; i++) {
      const m = new T.Mesh(unit, i % 2 ? matA : matB);
      m.matrixAutoUpdate = false; m.frustumCulled = false;
      cards.push(m); scene.add(m);
    }
    for (let i = 0; i < 30; i++) {
      const m = new T.Mesh(tick, matT);
      m.matrixAutoUpdate = false; m.frustumCulled = false;
      ticks.push(m); scene.add(m);
    }

    let geoKey = '';
    function derive() {
      solve(P, D);
      const g = P.gamma * DEG;
      D.g = g; D.cb = Math.cos(D.beta); D.sb = Math.sin(D.beta);
      D.tx = -Math.sin(g); D.ty = Math.cos(g); D.nx = Math.cos(g); D.ny = Math.sin(g);
      D.fx = Math.sin(g); D.fy = -Math.cos(g); D.mx = D.sb; D.my = -D.cb;
      D.a1S = P.a1 * K; D.a2S = P.a2 * K; D.BZ = 3 + P.b * 0.5;
      D.ls = D.a1S / D.sb; D.Ax = D.ls * D.cb;
      D.pitch = clamp(D.ls * 0.22, 0.45, 1.5); D.Lc = D.pitch * NC;
      D.Px = P.Pxy * Math.sin(P.phi * DEG); D.Py = P.Pxy * Math.cos(P.phi * DEG);
      const key = `${P.gamma}|${P.a1}|${P.a2}|${P.b}`;
      if (key !== geoKey) { geoKey = key; rebuild(); }
    }
    function rebuild() {
      work.geometry.dispose(); tool.geometry.dispose();
      const WL = 16, WR = D.Ax + 16, WH = 7;
      const ws = new T.Shape();
      ws.moveTo(-WL, -WH); ws.lineTo(WR, -WH); ws.lineTo(WR, D.a1S); ws.lineTo(D.Ax, D.a1S); ws.lineTo(0, 0); ws.lineTo(-WL, 0);
      work.geometry = new T.ExtrudeGeometry(ws, { depth: D.BZ, bevelEnabled: false }).translate(0, 0, -D.BZ / 2);
      const Ht = 13, Lt = 20, ty = Ht * D.ty;
      const ts = new T.Shape();
      ts.moveTo(0, 0); ts.lineTo(Ht * D.tx, ty); ts.lineTo(-Lt, ty); ts.lineTo(-Lt, Lt * Math.tan(7 * DEG));
      tool.geometry = new T.ExtrudeGeometry(ts, { depth: D.BZ + 1.2, bevelEnabled: false }).translate(0, 0, -D.BZ / 2 - 0.6);
      shearLine.position.set((D.Ax / 2), D.a1S / 2, 0.02);
      shearLine.rotation.z = D.beta;
      shearLine.scale.set(D.ls, 1, D.BZ + 0.08);
    }
    // Ideal (Merchant) material: forces follow from gamma, mu and the shear strength tau.
    function theory() {
      const g = P.gamma * DEG, eta = Math.atan(P.mu), beta = Math.PI / 4 + g / 2 - eta / 2;
      P.a2 = (P.a1 * Math.cos(beta - g)) / Math.sin(beta);
      P.Pz = (P.tau * P.b * P.a1 * Math.cos(eta - g)) / (Math.sin(beta) * Math.cos(beta + eta - g));
      P.Pxy = P.Pz * Math.tan(eta - g);
    }
    const takeSnap = () => { for (const k of MK) snap[k] = P[k]; };
    derive();

    const O = [0, 0, 0], A = [0, 0, 0], B = [0, 0, 0], C = [0, 0, 0], seg = [A, B], U = [1, 0, 0], V = [0, 1, 0], ARW = { arrowEnd: true };
    let zf = 0, dd = null;
    const arrow = (x0, y0, x1, y1, cls) => { A[0] = x0; A[1] = y0; A[2] = zf; B[0] = x1; B[1] = y1; B[2] = zf; dd.path(seg, cls, ARW); };
    const dash = (x0, y0, x1, y1) => { A[0] = x0; A[1] = y0; A[2] = zf; B[0] = x1; B[1] = y1; B[2] = zf; dd.line(A, B, 'ref'); };
    const lab = (x, y, t, c) => { C[0] = x; C[1] = y; C[2] = zf; dd.label(C, t, c); };
    const flags = (st) => {
      const f = { R: 0, circ: 0, pz: 0, fn: 0, ps: 0, aB: 0, aG: 0, aE: 0, vel: 0, dim: 0, fbd: 0 };
      const all = () => { f.R = f.circ = f.pz = f.fn = f.ps = f.aB = f.aG = f.aE = 1; };
      if (st === 'forces') f.pz = 1;
      else if (st === 'model') { f.dim = f.aB = f.aG = 1; }
      else if (st === 'chip') f.fbd = 1;
      else if (st === 'build') { const s = P.stage; f.R = s >= 1; f.circ = s >= 2; f.pz = s >= 3; f.fn = s >= 4; f.ps = s >= 5; f.aB = f.aG = f.aE = s >= 6; }
      else if (st === 'friction') { f.R = f.circ = f.fn = f.aE = f.aG = 1; }
      else if (st === 'shear') { f.R = f.circ = f.ps = f.aB = 1; f.dim = 1; }
      else if (st === 'velocity') f.vel = 1;
      else if (st === 'rake') { all(); f.dim = 1; }
      else all();
      return f;
    };
    const dirs = (i) => [[D.fx, D.fy], [D.nx, D.ny], [D.cb, D.sb], [D.mx, D.my]][i];

    const cam = {
      model: { position: [9, 7, 30], target: [3, 2, 0] },
      front: { position: [4, 3, 36], target: [4, -1, 0] },
      vel: { position: [6, 5, 36], target: [5, 3, 0] },
    };
    const sl = (id, key, lbl, min, max, step) => `<div class="ctl-row"><label for="lab-${id}">${lbl}</label><output class="val" data-out="${key}"></output></div><input id="lab-${id}" type="range" min="${min}" max="${max}" step="${step}" data-key="${key}">`;
    const modeSeg = '<div class="seg"><button type="button" data-set="mode:meas">Measured example</button><button type="button" data-set="mode:theory">Ideal Merchant material</button></div>';

    let phase = 0, cphase = 0;
    const clone = (v) => v;

    return {
      legend: [['var(--v)', 'Pz, Vc'], ['var(--f)', 'Thrust Pxy'], ['var(--d)', 'F, N (rake face)'], ['var(--accent)', 'Shear plane, Ps, Pn, R']],
      steps: [
        { id: 'forces', chip: 'Force components', group: 'Forces', eyebrow: 'Mechanics of machining · slides 48–50', title: 'Px, Py, Pz and the thrust Pxy', cam: cam.front, plot: true,
          html: () => `<p>Machining forces matter for <mark>power, machine and fixture strength</mark> and for judging machinability. Three components act on the tool: <b>Pz</b> main (cutting) force along Vc, <b>Px</b> feed force along tool travel, <b>Py</b> thrust perpendicular to the produced surface.</p>
            <p>Px and Py combine into <mark>Pxy</mark>, the force in the plane at right angles to Pz:</p><p class="formula">Px = Pxy sin φ   ·   Py = Pxy cos φ</p>
            <div class="ctl">${sl('phi', 'phi', 'Principal cutting edge angle φ', 20, 90, 1)}${sl('pxy', 'Pxy', 'Thrust Pxy', 0, 1500, 1)}${sl('pz', 'Pz', 'Cutting force Pz', 100, 2500, 1)}
            <p class="ro">Px = <b data-ro="Px"></b> · Py = <b data-ro="Py"></b> · R = √(Pz² + Pxy²) = <b data-ro="R"></b></p></div>
            <p class="key"><span class="key-tag">Remember</span>Pz × Vc gives the cutting power. Pxy is what the dynamometer reports as Px and Py.</p>
            <p class="exam">Asked: TF 2014-15 Q.4(c).</p>` },
        { id: 'model', chip: 'Orthogonal model', group: 'Model', eyebrow: 'Chip formation · slides 34–35', title: 'The orthogonal cut', cam: cam.model, plot: false,
          html: () => `<p>Edge square to the motion, so the cut is two-dimensional. The tool, rake γ, removes an uncut layer <mark>a₁</mark> that leaves as a chip of thickness <mark>a₂</mark>, shearing along a <mark>shear plane at angle β</mark> to the cutting direction. The chip is the Piispanen “pack of cards” sliding on that plane.</p>
            <p class="formula">ξ = a₂ / a₁   ·   tan β = cos γ / (ξ − sin γ)</p>
            <div class="ctl">${sl('g', 'gamma', 'Rake angle γ', -10, 30, 1)}${sl('a1', 'a1', 'Uncut thickness a₁', 0.05, 0.5, 0.001)}${sl('a2', 'a2', 'Chip thickness a₂', 0.05, 1.5, 0.001)}${sl('b', 'b', 'Width of cut b', 0.5, 10, 0.01)}
            <p class="ro">ξ = <b data-ro="xi"></b> · β = <b data-ro="beta"></b> · chip velocity Vf = Vc/ξ = <b data-ro="Vf"></b></p></div>
            <p class="note">Thickness is drawn ×12; width b is not to scale. ξ > 1 always: the chip is thicker and shorter than the uncut layer.</p>
            <p class="exam">Asked: TF 2017-18 Q.4(b), 2016-17 Q.4(b).</p>`,
          onEnter: () => { if (P.mode === 'theory') P.mode = 'meas', derive(); } },
        { id: 'chip', chip: 'Free body', group: 'Model', eyebrow: 'Mechanics · slide 51', title: 'R and R′: equal, opposite, collinear', cam: cam.front, plot: true,
          html: () => `<p>Take the chip as a free body. The tool pushes on it with <mark>R′</mark> across the rake face; the work pushes back across the shear plane with <mark>R</mark>. The chip is in equilibrium, so <b>R = −R′</b>: equal, opposite and along one line. That is why a single resultant, with one circle, describes the whole cut.</p>
            <p class="ro">|R| = <b data-ro="R"></b>, at <b data-ro="psi"></b> below the cutting direction.</p>` },
        { id: 'build', chip: 'Build the circle', group: 'Circle', eyebrow: 'Merchant circle diagram · slides 52–54', title: 'Draw the circle in six moves', cam: cam.front, plot: true,
          html: () => `<p>Each press adds forces to the drawing at the tool tip.</p>
            <div class="seg"><button type="button" data-set="stage:1">1 R</button><button type="button" data-set="stage:2">2 Circle</button><button type="button" data-set="stage:3">3 Pz, Pxy</button><button type="button" data-set="stage:4">4 F, N</button><button type="button" data-set="stage:5">5 Ps, Pn</button><button type="button" data-set="stage:6">6 Angles</button></div>
            <ol class="steps"><li>Resultant R from the tip.</li><li>Circle on R as diameter: every right-angled component lies on it.</li><li>Pz along Vc and Pxy at right angles.</li><li>F along the rake face, N perpendicular to it.</li><li>Ps along the shear plane, Pn perpendicular to it.</li><li>Mark β, γ and η.</li></ol>
            <div class="ctl">${sl('pz2', 'Pz', 'Cutting force Pz', 100, 2500, 1)}${sl('pxy2', 'Pxy', 'Thrust Pxy', 0, 1500, 1)}</div>
            <p class="formula">F = Pz sin γ + Pxy cos γ<br>N = Pz cos γ − Pxy sin γ<br>Ps = Pz cos β − Pxy sin β<br>Pn = Pz sin β + Pxy cos β</p>
            <p class="exam">Asked: TF 2017-18 Q.2(c), 2013-14 Q.2(b), 2011-12 Q.3(b).</p>`,
          onEnter: () => { if (P.stage < 1) P.stage = 6; } },
        { id: 'friction', chip: 'Friction', group: 'Circle', eyebrow: 'Rake face friction', title: 'F, N, μ and the friction angle η', cam: cam.front, plot: true,
          html: () => `<p>On the rake face, the friction force F opposes chip flow and N presses the chip on the tool. <mark>μ = F/N = tan η</mark>, η being the angle between R and N.</p>
            <div class="ctl">${sl('g2', 'gamma', 'Rake angle γ', -10, 30, 1)}${sl('pz3', 'Pz', 'Pz', 100, 2500, 1)}${sl('pxy3', 'Pxy', 'Pxy', 0, 1500, 1)}
            <p class="ro">F = <b data-ro="F"></b> · N = <b data-ro="N"></b> · μ = <b data-ro="mu"></b> · η = <b data-ro="eta"></b></p></div>
            <p class="note">Also: μ = (Pz tan γ + Pxy) / (Pz − Pxy tan γ).</p><p class="exam">Asked: TF 2011-12 Q.3(b).</p>` },
        { id: 'shear', chip: 'Shear forces', group: 'Circle', eyebrow: 'Shear plane', title: 'Ps, Pn and the shear stress', cam: cam.front, plot: true,
          html: () => `<p>Along the shear plane Ps shears the metal, Pn squeezes it. The plane area is As = b·a₁ / sin β, so
            <mark>τs = Ps / As</mark> (dynamic yield shear strength) and σn = Pn / As.</p>
            <div class="ctl">${sl('a1b', 'a1', 'a₁', 0.05, 0.5, 0.001)}${sl('bb', 'b', 'Width b', 0.5, 10, 0.01)}${sl('pzb', 'Pz', 'Pz', 100, 2500, 1)}${sl('pxyb', 'Pxy', 'Pxy', 0, 1500, 1)}
            <p class="ro">β = <b data-ro="beta"></b> · Ps = <b data-ro="Ps"></b> · Pn = <b data-ro="Pn"></b> · As = <b data-ro="As"></b> · τs = <b data-ro="tau"></b> · σn = <b data-ro="sig"></b></p></div>` },
        { id: 'velocity', chip: 'Velocities', group: 'Circle', eyebrow: 'Velocity relations · slides 43–44', title: 'Velocity triangle: Vc, Vf, Vs', cam: cam.vel, plot: true,
          html: () => `<p>Vc is the work speed relative to the tool, Vf the chip speed up the rake face, Vs the slip speed on the shear plane: <b>Vf = Vc + Vs</b> as vectors.</p>
            <p class="formula">Vf = Vc / ξ   ·   Vs = Vc cos γ / cos(β − γ)</p>
            <div class="ctl">${sl('vc', 'Vc', 'Cutting speed Vc', 10, 500, 1)}${sl('a2v', 'a2', 'Chip thickness a₂', 0.05, 1.5, 0.001)}${sl('g3', 'gamma', 'Rake γ', -10, 30, 1)}
            <p class="ro">Vf = <b data-ro="Vf"></b> · Vs = <b data-ro="Vs"></b> · power = Pz·Vc = <b data-ro="pow"></b></p></div>
            <p class="note">The chip is slower than the work (ξ > 1): the cards slide and the chip is thicker and shorter.</p>` },
        { id: 'merchant', chip: 'Merchant’s relation', group: 'Effect', eyebrow: 'Shear angle theory', title: '2β + η − γ = 90°', cam: cam.front, plot: true,
          html: () => `<p>Merchant assumed the metal shears where the cutting force is least. Writing Pz = τs As cos(η−γ) / cos(β+η−γ) and setting dPz/dβ = 0 gives <mark>2β + η − γ = 90°</mark>, i.e. β = 45° + γ/2 − η/2, and then Pz = 2 τs b a₁ cot β.</p>
            ${modeSeg}<div class="ctl">${sl('g4', 'gamma', 'Rake angle γ', -10, 30, 1)}${sl('mu', 'mu', 'Friction μ', 0.05, 1.5, 0.01)}${sl('tau', 'tau', 'Shear strength τs', 100, 800, 5)}
            <p class="ro">β (from chip) = <b data-ro="beta"></b> · β Merchant = <b data-ro="betaM"></b> · 2β + η − γ = <b data-ro="sum"></b></p></div>
            <p class="note">Measured values usually fall short of 90°, so real β is lower than Merchant’s prediction (try the presets in the last-but-one step).</p>
            <p class="exam">Asked: TF 2016-17 Q.2(b), 2014-15 Q.2(b), 2010-11 Q.4(a).</p>`,
          onEnter: () => { if (P.mode !== 'theory') { P.mode = 'theory'; theory(); derive(); } } },
        { id: 'rake', chip: 'Rake angle', group: 'Effect', eyebrow: 'Effect of rake angle', title: 'Bigger rake: bigger β, thinner chip, lower force', cam: cam.front, plot: true,
          html: () => `<p>Raise γ and β rises, the shear plane gets shorter, the chip gets <mark>thinner</mark> (ξ falls) and Pz, F and power drop. Negative rake does the opposite and loads the tool.</p>
            <div class="ctl">${sl('g5', 'gamma', 'Rake angle γ', -10, 30, 1)}${sl('mu2', 'mu', 'Friction μ', 0.05, 1.5, 0.01)}
            <div class="presets"><button class="pbtn" type="button" data-set="gamma:-10">−10°</button><button class="pbtn" type="button" data-set="gamma:0">0°</button><button class="pbtn" type="button" data-set="gamma:20">+20°</button></div>
            <p class="ro">β = <b data-ro="beta"></b> · ξ = <b data-ro="xi"></b> · a₂ = <b data-ro="a2"></b> · Pz = <b data-ro="Pz"></b> · power = <b data-ro="pow"></b></p></div>
            <p class="exam">Asked: TF 2014-15 Q.4(b).</p>`,
          onEnter: () => { if (P.mode !== 'theory') { P.mode = 'theory'; theory(); derive(); } } },
        { id: 'numericals', chip: 'Exam numericals', group: 'Exam', eyebrow: 'Worked examples', title: 'Load a past question', cam: cam.front, plot: true,
          html: () => `<p>Pick a question. The lab sets γ, a₁, a₂, b, Pz, Pxy and Vc from its data (a₁ = So sin φ, b = d / sin φ, Pxy = Px / sin φ or Py / cos φ) and the answers below are computed.</p>
            <div class="presets">${PRE.map((p) => `<button class="pbtn" type="button" data-set="${setStr(p)}">${p.q.split(' ')[0]} ${p.q.split(' ')[1]}</button>`).join('')}</div>
            <p class="ro"><b data-ro="preq"></b></p><ul data-ro="preans" class="ro"></ul>
            <p class="ro">Live: μ = <b data-ro="mu"></b> · β = <b data-ro="beta"></b> · τs = <b data-ro="tau"></b></p>`,
          onEnter: () => {} },
        { id: 'answer', chip: 'Exam answer', group: 'Exam', eyebrow: 'Model answer', title: 'Draw the MCD and state the assumptions', cam: cam.front, plot: true,
          html: () => `<p><b>To draw it:</b></p><ol class="steps"><li>Sketch the orthogonal cut: tool with γ, shear plane at β, velocity Vc.</li><li>From the tip draw R, then a circle on R as diameter.</li><li>Draw Pz along Vc and Pxy at right angles; F along the rake face, N normal; Ps along the shear plane, Pn normal.</li><li>Mark η (R to N), η − γ (R to Pz), β, and β + η − γ (R to Ps).</li></ol>
            <p><b>Derived:</b> F = Pz sinγ + Pxy cosγ; N = Pz cosγ − Pxy sinγ; Ps = Pz cosβ − Pxy sinβ; Pn = Pz sinβ + Pxy cosβ; μ = F/N = tan η; τs = Ps sinβ/(b a₁); 2β + η − γ = 90°; Pz = 2τs b a₁ cot β.</p>
            <p><b>Assumptions of Merchant’s theory:</b></p><ul><li>Orthogonal cut, sharp tool, no flank rubbing or ploughing.</li><li>Continuous chip, no built-up edge; deformation on a single thin shear plane.</li><li>Constant shear stress τs on that plane, independent of normal stress and β; constant μ on the rake face.</li><li>Constant cutting speed, plane strain (width unchanged); R and R′ equal, opposite, collinear.</li><li>The shear angle takes the value that makes Pz (work) a minimum.</li></ul>` },
      ],

      onParam(key) {
        if (key === 'mode') { if (P.mode === 'meas') { for (const k of MK) P[k] = snap[k]; } else theory(); }
        else if (P.mode === 'theory' && (key === 'Pz' || key === 'Pxy' || key === 'a2')) { P.mode = 'meas'; takeSnap(); }
        else if (P.mode === 'theory' && ['gamma', 'a1', 'b', 'mu', 'tau'].includes(key)) { theory(); if (key === 'a1' || key === 'b') { snap[key] = P[key]; } }
        else if (MK.includes(key)) snap[key] = P[key];
        if (P.mode === 'theory' && (key === 'Vc' || key === 'phi')) snap[key] = P[key];
        derive();
      },

      update(dt) {
        const vd = P.Vc * 0.03;
        phase += dt * vd; cphase += (dt * vd) / D.xi / D.pitch;
        const WL = 16, WR = D.Ax + 16, span = WL + WR, sp = span / ticks.length;
        for (let j = 0; j < ticks.length; j++) {
          const x = WR - ((j * sp + phase) % span);
          const top = x < 0 ? 0 : x < D.Ax ? x * (D.a1S / D.Ax) : D.a1S, h = top + 6.8;
          ticks[j].matrix.set(1, 0, 0, x, 0, h, 0, -6.8 + h / 2, 0, 0, 1, D.BZ / 2 + 0.02, 0, 0, 0, 1);
          ticks[j].matrixWorldNeedsUpdate = true;
        }
        const ph = cphase % NC;
        for (let k = 0; k < NC; k++) {
          const q = (k + ph) % NC, u = q * D.pitch;
          const kx = q < 1 ? q * q * (3 - 2 * q) : 1, ky = clamp(NC - q, 0, 1);
          const Lx = D.ls * kx, Ly = D.pitch * ky;
          cards[k].matrix.set(D.cb * Lx, D.tx * Ly, 0, D.tx * u, D.sb * Lx, D.ty * Ly, 0, D.ty * u, 0, 0, D.BZ, -D.BZ / 2, 0, 0, 0, 1);
          cards[k].matrixWorldNeedsUpdate = true;
        }
      },

      overlay(d, step) {
        dd = d; zf = D.BZ / 2 + 0.05;
        const f = flags(step), Rx = P.Pz * SC, Ry = -P.Pxy * SC;
        if (f.dim) {
          dash(0, 0, D.Ax + 5, 0);
          d.dim([D.Ax + 1, 0, zf], [D.Ax + 1, D.a1S, zf], `a₁ ${P.a1.toFixed(3)}`, [3, 0, 0]);
          const u1 = D.Lc * 0.62;
          d.dim([D.tx * u1, D.ty * u1, zf], [D.tx * u1 + D.nx * D.a2S, D.ty * u1 + D.ny * D.a2S, zf], `a₂ ${P.a2.toFixed(3)}`, [D.tx * D.Lc * 0.5, D.ty * D.Lc * 0.5, 0]);
          d.dim([D.Ax + 8, D.a1S, -D.BZ / 2], [D.Ax + 8, D.a1S, D.BZ / 2], `b ${P.b.toFixed(2)}`, [0, 1.6, 0]);
          arrow(D.Ax + 3, D.a1S + 4.8, D.Ax + 9.5, D.a1S + 4.8, 'vline'); lab(D.Ax + 6, D.a1S + 6, 'Vc (tool vs work)', 'v');
        }
        if (f.fbd) {
          const px = -Ry / D.R * 0.35 || 0, py = Rx / D.R * 0.35 || 0;
          arrow(px, py, Rx + px, Ry + py, 'hx'); lab(Rx + px, Ry + py - 0.8, 'R′ tool → chip', 'hl');
          arrow(Rx - px, Ry - py, -px, -py, 'dline'); lab(Rx * 0.4 - px * 4, Ry * 0.4 - py * 4, 'R work → chip', 'd');
        }
        if (f.R) { arrow(0, 0, Rx, Ry, 'hx'); lab(Rx * 1.08, Ry * 1.08 - 0.6, 'R', 'hl'); }
        if (f.circ) { A[0] = Rx / 2; A[1] = Ry / 2; A[2] = zf; d.arc(A, U, V, (D.R * SC) / 2, 0, TAU, 'dm', 40); d.dot(A, 'dot', 3); }
        if (f.pz) {
          arrow(0, 0, Rx, 0, 'vline'); arrow(0, 0, 0, Ry, 'fline'); dash(Rx, 0, Rx, Ry); dash(0, Ry, Rx, Ry);
          lab(Rx / 2, 0.7, `Pz ${P.Pz.toFixed(0)}`, 'v'); lab(-1.8, Ry / 2, `Pxy ${P.Pxy.toFixed(0)}`, 'f');
        }
        const vecs = (i0, a, b, cls, la, lb, ca, cb2) => {
          const da = dirs(i0), db = dirs(i0 + 1), xa = da[0] * a * SC, ya = da[1] * a * SC, xb = db[0] * b * SC, yb = db[1] * b * SC;
          arrow(0, 0, xa, ya, cls); arrow(0, 0, xb, yb, cls); dash(xa, ya, Rx, Ry); dash(xb, yb, Rx, Ry);
          lab(xa + da[0] * 1.1, ya + da[1] * 1.1, la, ca); lab(xb + db[0] * 1.1, yb + db[1] * 1.1, lb, cb2);
        };
        if (f.fn) vecs(0, D.F, D.N, 'dline', `F ${D.F.toFixed(0)}`, `N ${D.N.toFixed(0)}`, 'd', 'd');
        if (f.ps) vecs(2, D.Ps, D.Pn, 'arc', `Ps ${D.Ps.toFixed(0)}`, `Pn ${D.Pn.toFixed(0)}`, 'hl', 'hl');
        if (f.ps || f.aB) { A[0] = 0; A[1] = 0; A[2] = zf; B[0] = D.Ax; B[1] = D.a1S; B[2] = zf; d.line(A, B, 'hx'); }
        O[2] = zf;
        if (f.aB) { d.arc(O, U, V, 3.2, 0, D.beta, 'arc', 12); lab(4.2 * Math.cos(D.beta / 2), 4.2 * Math.sin(D.beta / 2) + 0.2, `β ${D.betaD.toFixed(1)}°`, 'hl'); }
        if (f.aG) { d.arc(O, U, V, 3.8, Math.PI / 2, Math.PI / 2 + D.g, 'arc', 12); lab(-4.6 * Math.sin(D.g / 2), 4.6 * Math.cos(D.g / 2), `γ ${P.gamma.toFixed(0)}°`, 'hl'); }
        if (f.aE) { d.arc(O, U, V, 5.4, D.g - D.eta, D.g, 'arc', 14); lab(6.6 * Math.cos(D.g - D.eta / 2), 6.6 * Math.sin(D.g - D.eta / 2), `η ${D.etaD.toFixed(1)}°`, 'hl'); }
        if (f.vel) {
          const sv = 0.02, x0 = D.Ax + 12, y0 = D.a1S + 6, vc = P.Vc * sv, x1 = x0 - vc, vs = D.Vs * sv, vf = D.Vf * sv;
          arrow(x0, y0, x1, y0, 'vline'); lab((x0 + x1) / 2, y0 + 0.9, `Vc ${P.Vc.toFixed(0)}`, 'v');
          arrow(x1, y0, x1 + vs * D.cb, y0 + vs * D.sb, 'hx'); lab(x1 + vs * D.cb * 0.5 + 1, y0 + vs * D.sb * 0.5, `Vs ${D.Vs.toFixed(0)}`, 'hl');
          arrow(x0, y0, x0 + vf * D.tx, y0 + vf * D.ty, 'fline'); lab(x0 + vf * D.tx * 0.5 + 1.2, y0 + vf * D.ty * 0.5, `Vf ${D.Vf.toFixed(0)}`, 'f');
        }
      },

      hud() {
        const diff = Math.abs(D.betaD - D.betaM);
        return {
          status: `Orthogonal cut · Vc ${P.Vc.toFixed(0)} m/min`, statusCls: 'v',
          rows: [['ξ = a₂/a₁', D.xi.toFixed(2)], ['β (chip)', `${D.betaD.toFixed(1)}°`], ['β (Merchant)', `${D.betaM.toFixed(1)}°`], ['μ / η', `${D.mu.toFixed(2)} / ${D.etaD.toFixed(1)}°`], ['τs', `${D.tau.toFixed(0)} MPa`]],
          verdict: diff < 2 ? [`Merchant fits (Δβ ${diff.toFixed(1)}°)`, 'ok'] : diff < 8 ? [`Δβ ${diff.toFixed(1)}° from Merchant`, 'warn'] : [`Merchant over-predicts β by ${diff.toFixed(0)}°`, 'bad'],
        };
      },

      readouts() {
        const pre = PRE[clamp(Math.round(P.pre), 1, PRE.length) - 1];
        return {
          Px: `${D.Px.toFixed(0)} N`, Py: `${D.Py.toFixed(0)} N`, R: `${D.R.toFixed(0)} N`, psi: `${(Math.atan2(P.Pxy, P.Pz) / DEG).toFixed(1)}°`,
          xi: D.xi.toFixed(2), beta: `${D.betaD.toFixed(1)}°`, betaM: `${D.betaM.toFixed(1)}°`, sum: `${(2 * D.betaD + D.etaD - P.gamma).toFixed(1)}°`,
          Vf: `${D.Vf.toFixed(1)} m/min`, Vs: `${D.Vs.toFixed(1)} m/min`, pow: `${(D.pow / 1000).toFixed(2)} kW`,
          F: `${D.F.toFixed(0)} N`, N: `${D.N.toFixed(0)} N`, mu: D.mu.toFixed(3), eta: `${D.etaD.toFixed(1)}°`,
          Ps: `${D.Ps.toFixed(0)} N`, Pn: `${D.Pn.toFixed(0)} N`, As: `${D.As.toFixed(2)} mm²`, tau: `${D.tau.toFixed(0)} N/mm²`, sig: `${D.sig.toFixed(0)} N/mm²`,
          a2: `${P.a2.toFixed(3)} mm`, Pz: `${P.Pz.toFixed(0)} N`,
          preq: `TF ${pre.q}: ${pre.t}`, preans: pre.html,
        };
      },
      live: true,

      format(key, v) {
        if (key === 'gamma' || key === 'phi') return `${v.toFixed(0)}°`;
        if (key === 'a1' || key === 'a2') return `${v.toFixed(3)} mm`;
        if (key === 'b') return `${v.toFixed(2)} mm`;
        if (key === 'Pz' || key === 'Pxy') return `${v.toFixed(0)} N`;
        if (key === 'Vc') return `${v.toFixed(0)} m/min`;
        if (key === 'mu') return v.toFixed(2);
        if (key === 'tau') return `${v.toFixed(0)} MPa`;
        return null;
      },

      plot(g, w, h, c, step) {
        const arr = (x0, y0, x1, y1, col) => {
          g.strokeStyle = g.fillStyle = col; g.lineWidth = 1.6;
          g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
          const a = Math.atan2(y1 - y0, x1 - x0);
          g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - 7 * Math.cos(a - 0.4), y1 - 7 * Math.sin(a - 0.4)); g.lineTo(x1 - 7 * Math.cos(a + 0.4), y1 - 7 * Math.sin(a + 0.4)); g.closePath(); g.fill();
        };
        if (step === 'forces') {
          const k = 90 / Math.max(P.Pxy, 1), ox = 60, oy = 112, ex = ox + D.Px * k, ey = oy - D.Py * k;
          arr(ox, oy, ex, oy, c.f); arr(ox, oy, ox, ey, c.d); arr(ox, oy, ex, ey, c.accent);
          g.fillStyle = c.muted; g.fillText(`Px ${D.Px.toFixed(0)}`, ex - 40, oy + 12); g.fillText(`Py ${D.Py.toFixed(0)}`, 4, (oy + ey) / 2);
          g.fillStyle = c.accent; g.fillText(`Pxy ${P.Pxy.toFixed(0)}`, (ox + ex) / 2 + 4, (oy + ey) / 2 - 4);
          g.fillStyle = c.muted; g.fillText(`φ = ${P.phi.toFixed(0)}° (Pxy to Py)`, 130, 14);
          return 'Plan view: Pxy resolved into Px and Py';
        }
        if (step === 'rake' || step === 'merchant') {
          const eta = Math.atan(P.mu), m = 14, x = (gm) => m + ((gm + 10) / 40) * (w - 2 * m);
          const bet = (gm) => 45 + gm / 2 - eta / DEG / 2, pzf = (gm) => 1 / Math.tan(bet(gm) * DEG);
          g.lineWidth = 1.6;
          for (const [fn, col, sc2] of [[bet, c.accent, (v) => h - 14 - (v / 60) * (h - 28)], [pzf, c.v, (v) => h - 14 - (v / pzf(-10)) * (h - 28)]]) {
            g.strokeStyle = col; g.beginPath();
            for (let gm = -10; gm <= 30; gm += 2) { const px = x(gm), py = sc2(fn(gm)); gm === -10 ? g.moveTo(px, py) : g.lineTo(px, py); }
            g.stroke();
          }
          g.fillStyle = c.accent; g.fillText('β (0–60°)', 6, 12); g.fillStyle = c.v; g.fillText('Pz ∝ cot β', 100, 12);
          g.fillStyle = c.muted; g.fillText('γ −10°', 4, h - 2); g.fillText('+30°', w - 36, h - 2);
          g.strokeStyle = c.muted; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(x(P.gamma), 16); g.lineTo(x(P.gamma), h - 14); g.stroke(); g.setLineDash([]);
          return 'Merchant: β and Pz against rake angle';
        }
        if (step === 'velocity') {
          const k = 80 / Math.max(P.Vc, 1), x0 = 150, y0 = 36, x1 = x0 - P.Vc * k;
          arr(x0, y0, x1, y0, c.v);
          arr(x1, y0, x1 + D.Vs * k * D.cb, y0 - D.Vs * k * D.sb, c.accent);
          arr(x0, y0, x0 + D.Vf * k * D.tx, y0 - D.Vf * k * D.ty, c.f);
          g.fillStyle = c.v; g.fillText(`Vc ${P.Vc.toFixed(0)}`, (x0 + x1) / 2 - 20, y0 + 14);
          g.fillStyle = c.accent; g.fillText(`Vs ${D.Vs.toFixed(0)}`, 4, 100); g.fillStyle = c.f; g.fillText(`Vf ${D.Vf.toFixed(0)}`, 4, 116);
          return 'Velocity triangle (m/min)';
        }
        // clean 2D Merchant circle, tool tip at O
        const fl = flags(step), k = 104 / Math.max(D.R, 1), cx = w / 2 + 16, cy = h / 2;
        const ox = cx - (P.Pz * k) / 2, oy = cy - (P.Pxy * k) / 2, X = (v) => ox + v * k, Y = (v) => oy + v * k;
        const px = (vx, vy) => [X(vx), oy - vy * k];
        const rt = px(P.Pz, -P.Pxy);
        if (fl.circ || step === 'chip') { g.strokeStyle = c.muted; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, (D.R * k) / 2, 0, TAU); g.stroke(); }
        if (fl.R || fl.fbd) arr(ox, oy, rt[0], rt[1], c.accent);
        if (fl.pz) { arr(ox, oy, X(P.Pz), oy, c.v); arr(ox, oy, ox, Y(P.Pxy), c.f); }
        if (fl.fn) { arr(ox, oy, ...px(D.fx * D.F, D.fy * D.F), c.d); arr(ox, oy, ...px(D.nx * D.N, D.ny * D.N), c.d); }
        if (fl.ps) { arr(ox, oy, ...px(D.cb * D.Ps, D.sb * D.Ps), c.accent); arr(ox, oy, ...px(D.mx * D.Pn, D.my * D.Pn), c.accent); }
        g.fillStyle = c.muted;
        const rows = [`R ${D.R.toFixed(0)}`];
        if (fl.pz) rows.push(`Pz ${P.Pz.toFixed(0)}`, `Pxy ${P.Pxy.toFixed(0)}`);
        if (fl.fn) rows.push(`F ${D.F.toFixed(0)}`, `N ${D.N.toFixed(0)}`);
        if (fl.ps) rows.push(`Ps ${D.Ps.toFixed(0)}`, `Pn ${D.Pn.toFixed(0)}`);
        rows.forEach((t, i) => g.fillText(t, 4, 14 + i * 13));
        if (fl.aE) g.fillText(`η ${D.etaD.toFixed(0)}° β ${D.betaD.toFixed(0)}° γ ${P.gamma.toFixed(0)}°`, 4, h - 4);
        return 'Merchant circle (2D)';
      },
    };
  },
};
