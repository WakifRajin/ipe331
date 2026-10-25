// Effect lab: choosing a grinding wheel. A magnified block of wheel face (grains, bond, pores) touches the work;
// the five marking fields (abrasive, grit, grade, structure, bond) and the work hardness drive what happens.
// The scene is a model, not a simulation: every verdict comes from the simple monotonic rules in calc(), explained in the steps.

const SERIES = [6, 8, 10, 12, 14, 16, 20, 24, 30, 36, 46, 54, 60, 70, 80, 90, 100, 120, 150, 180, 220, 240, 280, 320, 400, 500, 600];
const GI = (n) => SERIES.indexOf(n);

const ABR = {
  A: { name: 'Aluminium oxide', short: 'Al₂O₃', col: 0xc98a6b, note: 'tough, friable: the general-purpose abrasive for steels and cast iron' },
  C: { name: 'Silicon carbide', short: 'SiC', col: 0x2f3b36, note: 'harder but more brittle: for carbides, aluminium, brass and other brittle material' },
  CBN: { name: 'Cubic boron nitride', short: 'CBN', col: 0xc9953a, note: 'second hardest: for tool steels and aerospace alloys' },
  D: { name: 'Diamond', short: 'Diamond', col: 0xcfd6dc, note: 'hardest: for ceramics and cemented carbides' },
};
const BOND = {
  V: { name: 'Vitrified', hold: 1.0, col: 0xd9b88a, op: 0.3 },
  B: { name: 'Resinoid', hold: 1.1, col: 0x9c4f2c, op: 0.34 },
  R: { name: 'Rubber', hold: 0.8, col: 0x4b5057, op: 0.4 },
  M: { name: 'Metal', hold: 1.45, col: 0xb0824a, op: 0.42 },
};
const MATS = {
  steel: ['Steel', 'medium'],
  hsteel: ['Hardened steel', 'hard'],
  cast: ['Cast iron', 'medium'],
  alu: ['Aluminium / brass', 'soft'],
  carbide: ['Cemented carbide', 'hard'],
  tool: ['Tool steel / aerospace alloy', 'hard'],
  ceramic: ['Ceramic', 'hard'],
};
// slide 116 table: ok = listed, warn = works but poor or uneconomic, bad = mismatch (extra reasons added from basic chemistry/hardness)
const COMPAT = {
  A: { steel: 'ok', hsteel: 'ok', cast: 'ok', alu: 'warn', carbide: 'bad', tool: 'warn', ceramic: 'bad' },
  C: { steel: 'bad', hsteel: 'bad', cast: 'ok', alu: 'ok', carbide: 'ok', tool: 'warn', ceramic: 'warn' },
  CBN: { steel: 'warn', hsteel: 'ok', cast: 'warn', alu: 'warn', carbide: 'warn', tool: 'ok', ceramic: 'warn' },
  D: { steel: 'bad', hsteel: 'bad', cast: 'bad', alu: 'warn', carbide: 'ok', tool: 'bad', ceramic: 'ok' },
};
const WHARD = { soft: 0.2, medium: 0.5, hard: 0.9 };
const KW = 0.18; // grain dulling rate on a dulling-rate-1 work, per second of model time

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const iclamp = (v, a, b) => clamp(Math.round(Number.isFinite(v) ? v : a), a, b);
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const gradeLetter = (g) => String.fromCharCode(65 + iclamp(g, 0, 25));
const gradeWord = (g) => (g <= 7 ? 'soft' : g <= 15 ? 'medium' : 'hard');
const structWord = (n) => (n <= 4 ? 'dense' : n <= 8 ? 'medium' : 'open');

function compatOf(P) {
  const lvl = COMPAT[P.abrasive]?.[P.wmat] || 'warn';
  const mat = MATS[P.wmat]?.[0] || 'this work';
  const ab = ABR[P.abrasive];
  let why;
  if (lvl === 'ok') why = `${ab.short} is listed for ${mat.toLowerCase()} in the slide 116 table.`;
  else if (lvl === 'warn') why = `${ab.short} can cut ${mat.toLowerCase()} but it is not the listed choice: poorer wheel life, or too costly for the job.`;
  else if (P.abrasive === 'A') why = `Al₂O₃ is softer than ${mat.toLowerCase()}, so the grains blunt faster than they cut.`;
  else if (P.abrasive === 'C') why = 'SiC dissolves in hot iron-based work and wears away quickly on steels.';
  else why = 'Diamond reacts with iron at grinding temperature (carbon diffuses into the steel) and wears away.';
  return { lvl, why, mat };
}

function calc(P) {
  const gv = SERIES[iclamp(P.grit, 0, 26)];
  const gi = iclamp(P.grade, 0, 25);
  const st = iclamp(P.structure, 1, 17);
  const o = (st - 1) / 16; // 0 dense .. 1 open
  const wh = WHARD[P.work] ?? 0.5;
  const bondF = (BOND[P.bond] || BOND.V).hold;
  // bond hold: grade letter x bond type x how closely packed the wheel is
  const hold = (0.14 + 0.86 * (gi / 25)) * bondF * (1.12 - 0.3 * o);
  const comp = compatOf(P);
  const mis = comp.lvl === 'bad' ? 2.5 : comp.lvl === 'warn' ? 1.3 : 1;
  const rate = KW * (0.15 + 0.85 * wh) * mis; // dullness per second: hard work dulls grains fast
  const tauDull = 1 / rate;
  const tauRel = 1.5 * Math.exp(3 * hold); // how long the bond holds a grain
  const rho = tauRel / tauDull; // ~1: grain released just as it goes blunt
  const premature = clamp((0.6 - rho) / 0.45, 0, 1);
  const glaze = clamp((rho - 1.4) / 1.6, 0, 1);
  const gn = Math.log(gv / 6) / Math.log(100);
  const load = clamp(1.1 * (1 - wh) * (1 - 0.7 * o) * (0.65 + 0.7 * gn) - 0.12, 0, 1);
  const wear = 100 * Math.min(1, 6 / (tauRel + 2));
  const ra = 0.8 * Math.pow(60 / gv, 0.6) * (1 + 0.012 * (st - 5)) * (1 + 0.4 * load);
  const mrr = 100 * Math.pow(60 / gv, 0.7) * (1 + 0.02 * (st - 5)) * (1 - 0.6 * glaze) * (1 - 0.5 * load);
  const size = 0.95 * Math.pow(6 / gv, 0.44);
  return { gv, gi, st, o, wh, hold, comp, rate, tauDull, tauRel, rho, premature, glaze, load, wear, ra, mrr, size };
}

function verdictOf(m) {
  if (m.comp.lvl === 'bad') return ['Wrong abrasive for this work', 'bad'];
  if (m.glaze > 0.6) return ['Glazing: wheel too hard for this work', 'bad'];
  if (m.load > 0.6) return ['Loading: pores clog with chips', 'bad'];
  if (m.premature > 0.6) return ['Wheel too soft: grains lost while sharp', 'bad'];
  if (m.comp.lvl === 'warn' || m.glaze > 0.3 || m.load > 0.3 || m.premature > 0.3) return ['Usable, not ideal', 'warn'];
  return ['Good match: self-sharpening', 'ok'];
}

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default {
  id: 'wheel-selection',
  chapter: 'grinding',
  title: 'Grinding wheel: grit, grade, structure',
  eyebrow: 'Grinding · slides 115–122',
  sub: 'Five letters and numbers on a wheel decide what it does to the work. Change each one and watch grains, bond and pores of a magnified patch of the wheel face.',
  blurb: 'Abrasive, grit, grade, structure and bond: what each marking field means and why a soft wheel suits hard work.',
  qs: ['2020-21_2a', '2014-15_5c', '2012-13_6a', '2015-16_3c', '2009-10_5d', '2021-22_1a', '2011-12_7a', '2016-17_6b'],
  params: { abrasive: 'A', grit: GI(60), grade: 10, structure: 5, bond: 'V', work: 'medium', wmat: 'steel' },
  start: 'marking',

  build({ THREE, scene, P, kit }) {
    const { M } = kit;
    const BW = 10, BD = 5, WD = 8;
    const CAPB = 1500, CAPP = 3000, CAPR = 3000;

    const gridH = new THREE.GridHelper(120, 60, 0x7d8791, 0x9aa4ad);
    gridH.position.y = -4.4;
    gridH.material.transparent = true;
    gridH.material.opacity = 0.28;
    scene.add(gridH);

    // ---------- shared irregular grain geometry ----------
    const rr = mulberry32(11);
    const grainGeo = new THREE.IcosahedronGeometry(0.5, 0);
    {
      const pos = grainGeo.attributes.position;
      const seen = new Map();
      for (let i = 0; i < pos.count; i++) {
        const key = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
        if (!seen.has(key)) seen.set(key, 0.78 + rr() * 0.45);
        const k = seen.get(key);
        pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k, pos.getZ(i) * k);
      }
      grainGeo.computeVertexNormals();
    }

    const grainMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.38, metalness: 0.1, flatShading: true });
    const poreMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0.1, flatShading: true });
    const bondMat = new THREE.MeshStandardMaterial({ color: 0xd9b88a, roughness: 0.6, metalness: 0.0, transparent: true, opacity: 0.3, depthWrite: false });
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0xd9b88a, roughness: 0.6, metalness: 0.0 });
    const workMat = new THREE.MeshStandardMaterial({ color: 0xa9b2ba, roughness: 0.4, metalness: 0.6, flatShading: true });

    const blk = new THREE.Group();
    scene.add(blk);
    const bottom = new THREE.InstancedMesh(grainGeo, grainMat, CAPB);
    const inner = new THREE.InstancedMesh(grainGeo, grainMat, CAPB);
    const pores = new THREE.InstancedMesh(new THREE.SphereGeometry(0.5, 6, 4), poreMat, CAPP);
    const bridges = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), bridgeMat, CAPR);
    for (const im of [bottom, inner, pores, bridges]) {
      im.frustumCulled = false;
      im.castShadow = true;
      im.count = 0;
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    }
    bottom.setColorAt(0, new THREE.Color());
    inner.setColorAt(0, new THREE.Color());
    pores.setColorAt(0, new THREE.Color());
    bottom.instanceColor.setUsage(THREE.DynamicDrawUsage);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(BW, 1, BD), bondMat);
    slab.renderOrder = 2;
    blk.add(bridges, bottom, inner, pores, slab);

    const workMesh = new THREE.Mesh(new THREE.BufferGeometry(), workMat);
    workMesh.receiveShadow = true;
    scene.add(workMesh);
    const bench = new THREE.Mesh(new THREE.BoxGeometry(BW + 4, 1.2, WD + 2), M.castIron);
    bench.position.set(0, -3.0, 0);
    scene.add(bench);

    // ---------- whole wheel (small view) ----------
    const WR = 2.6, WX = -10.2;
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0xc98a6b, roughness: 0.8, metalness: 0.05 });
    const wheelSpin = new THREE.Group();
    const wheelBody = new THREE.Mesh(new THREE.CylinderGeometry(WR, WR, 1.3, 64, 1, false).rotateX(Math.PI / 2), wheelMat);
    const wheelHole = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.34, 24).rotateX(Math.PI / 2), M.darkSteel);
    wheelSpin.add(wheelBody, wheelHole);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const dot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 1.36), M.paperDark || M.darkSteel);
      dot.position.set(Math.cos(a) * 1.6, Math.sin(a) * 1.6, 0);
      dot.rotation.z = a;
      wheelSpin.add(dot);
    }
    const wheelG = new THREE.Group();
    wheelG.add(wheelSpin);
    const flange = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 1.6, 24).rotateX(Math.PI / 2), M.steel);
    wheelG.add(flange);
    wheelG.position.set(WX, WR + 0.02, 0);
    scene.add(wheelG);
    const miniWork = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.5, 2.2), M.work);
    miniWork.position.set(WX, -0.25, 0);
    scene.add(miniWork);
    const patch = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.34, 1.5), new THREE.MeshStandardMaterial({ color: 0xe9a321, roughness: 0.5, transparent: true, opacity: 0.85 }));
    patch.position.set(WX, 0.1, 0);
    scene.add(patch);

    // ---------- layout state ----------
    const _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _c = new THREE.Color();
    const baseCol = new THREE.Color(0xc98a6b), polished = new THREE.Color(0xf4f2ea), darkPore = new THREE.Color(0x1d1b19), chipCol = new THREE.Color(0xa3acb4);
    const B = {
      n: 0, bx: new Float32Array(CAPB), bz: new Float32Array(CAPB), tip: new Float32Array(CAPB),
      q: new Float32Array(CAPB * 4), sc: new Float32Array(CAPB * 3), age: new Float32Array(CAPB), rf: new Float32Array(CAPB), lf: new Float32Array(CAPB),
      st: new Uint8Array(CAPB), tm: new Float32Array(CAPB), w: new Float32Array(CAPB),
    };
    let nPores = 0, size = 0.5, cell = 0.75, yb = 0.2, TL = 1, pick = 0, deepest = -1, pickPore = 0, yTop = 1.5;
    let fill = 0, fillShown = -1, oor = 0, trued = 0;
    let wmax = 0, wmaxIdx = 0, releases = 0, relWin = 0, relRate = 0, relT = 0;
    let curStep = 'marking';
    let M0 = calc(P);
    let workGeoKey = '';
    let depthsMax = 0;

    function colorsForAbrasive() {
      baseCol.setHex(ABR[P.abrasive].col);
      wheelMat.color.setHex(P.abrasive === 'D' ? 0xb8c0c8 : P.abrasive === 'CBN' ? 0xb98a34 : ABR[P.abrasive].col);
      const b = BOND[P.bond] || BOND.V;
      bondMat.color.setHex(b.col);
      bondMat.opacity = b.op;
      bridgeMat.color.setHex(b.col);
      workMat.color.setHex(P.work === 'soft' ? 0xd3dadf : P.work === 'hard' ? 0x7f8b97 : 0xa9b2ba);
    }

    function buildWork(depths, xs, nd) {
      workMesh.geometry.dispose();
      const X = BW / 2 + 0.8, N = 640, step = (2 * X) / N;
      const ys = new Float32Array(N + 1);
      for (let i = 0; i < nd; i++) {
        const d = depths[i];
        if (d <= 0) continue;
        const hw = d * 1.15 + 1e-4;
        const i0 = Math.max(0, Math.floor((xs[i] - hw + X) / step)), i1 = Math.min(N, Math.ceil((xs[i] + hw + X) / step));
        for (let k = i0; k <= i1; k++) {
          const x = -X + k * step;
          const y = -d * (1 - Math.abs(x - xs[i]) / hw);
          if (y < ys[k]) ys[k] = y;
        }
      }
      const sh = new THREE.Shape();
      sh.moveTo(-X, -2.4);
      sh.lineTo(X, -2.4);
      for (let k = N; k >= 0; k--) sh.lineTo(-X + k * step, ys[k]);
      sh.lineTo(-X, -2.4);
      const g = new THREE.ExtrudeGeometry(sh, { depth: WD, bevelEnabled: false, steps: 1 });
      g.translate(0, 0, -WD / 2);
      workMesh.geometry = g;
    }

    function layout() {
      M0 = calc(P);
      colorsForAbrasive();
      const s = (size = M0.size), c = (cell = 1.5 * s);
      const dcut = 0.6 * s;
      yb = 0.3 * dcut + 0.25 * s;
      const occ = 0.95 - 0.45 * M0.o;
      const nx = Math.max(1, Math.floor(BW / c)), nz = Math.max(1, Math.floor(BD / c));
      const rnd = mulberry32(7);
      const grid = new Int16Array(nx * nz).fill(-1);
      let nb = 0, ni = 0, np = 0, nr = 0;
      const depths = new Float32Array(CAPB), xs = new Float32Array(CAPB);
      deepest = -1; depthsMax = 0; pick = 0; pickPore = 0;
      let bestPick = 1e9;
      yTop = yb + 2 * c;
      for (let iz = 0; iz < nz; iz++) {
        for (let ix = 0; ix < nx; ix++) {
          const x = -BW / 2 + (ix + 0.5) * (BW / nx) + (rnd() - 0.5) * 0.35 * c;
          const z = -BD / 2 + (iz + 0.5) * (BD / nz) + (rnd() - 0.5) * 0.35 * c;
          if (rnd() < occ && nb < CAPB) {
            const k = nb++;
            grid[iz * nx + ix] = k;
            B.bx[k] = x; B.bz[k] = z;
            const r = rnd();
            B.tip[k] = dcut * (0.3 - r);
            _q.setFromEuler(new THREE.Euler(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28));
            B.q[k * 4] = _q.x; B.q[k * 4 + 1] = _q.y; B.q[k * 4 + 2] = _q.z; B.q[k * 4 + 3] = _q.w;
            B.sc[k * 3] = 0.85 + rnd() * 0.35; B.sc[k * 3 + 1] = 0.9 + rnd() * 0.3; B.sc[k * 3 + 2] = 0.85 + rnd() * 0.35;
            B.rf[k] = 0.75 + rnd() * 0.5; B.lf[k] = 0.5 + rnd();
            B.st[k] = 0; B.tm[k] = 0; B.w[k] = 0;
            const d = -B.tip[k];
            if (d > 0) {
              depths[k] = d; xs[k] = x;
              if (d > depthsMax) { depthsMax = d; deepest = k; }
            } else depths[k] = 0;
            if (iz >= nz - 1 - 0 && Math.abs(x) < bestPick) { bestPick = Math.abs(x); pick = k; }
          } else if (np < CAPP) {
            _p.set(x, yb + 0.05 * c, z);
            _s.setScalar(0.72 * c);
            _m.compose(_p, _q.identity(), _s);
            pores.setMatrixAt(np, _m);
            if (iz === nz - 1 && Math.abs(x) < 1.5) pickPore = np;
            np++;
          }
          // interior layer
          if (rnd() < occ && ni < CAPB) {
            _p.set(x + (rnd() - 0.5) * 0.2 * c, yb + 1.05 * c, z + (rnd() - 0.5) * 0.2 * c);
            _q.setFromEuler(new THREE.Euler(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28));
            _s.set(s * (0.85 + rnd() * 0.35), s * (0.9 + rnd() * 0.3), s * (0.85 + rnd() * 0.35));
            _m.compose(_p, _q, _s);
            inner.setMatrixAt(ni, _m);
            inner.setColorAt(ni, _c.copy(baseCol).multiplyScalar(0.9 + rnd() * 0.2));
            ni++;
          } else if (np < CAPP) {
            _p.set(x, yb + 1.05 * c, z);
            _s.setScalar(0.7 * c);
            _m.compose(_p, _q.identity(), _s);
            pores.setMatrixAt(np, _m);
            np++;
          }
        }
      }
      // bond bridges between neighbouring bottom grains
      for (let iz = 0; iz < nz; iz++) {
        for (let ix = 0; ix < nx; ix++) {
          const a = grid[iz * nx + ix];
          if (a < 0 || nr >= CAPR - 2) continue;
          for (let dir = 0; dir < 2; dir++) {
            const jx = ix + (dir === 0 ? 1 : 0), jz = iz + (dir === 1 ? 1 : 0);
            if (jx >= nx || jz >= nz) continue;
            const b = grid[jz * nx + jx];
            if (b < 0 || rnd() > 0.7) continue;
            const dx = B.bx[b] - B.bx[a], dz = B.bz[b] - B.bz[a];
            _p.set((B.bx[a] + B.bx[b]) / 2, yb + 0.1 * c, (B.bz[a] + B.bz[b]) / 2);
            const len = Math.hypot(dx, dz);
            _q.setFromAxisAngle(_p.set(0, 1, 0), -Math.atan2(dz, dx));
            _p.set((B.bx[a] + B.bx[b]) / 2, yb + 0.1 * c, (B.bz[a] + B.bz[b]) / 2);
            _s.set(len * 0.9, 0.2 * c, 0.2 * c);
            _m.compose(_p, _q, _s);
            bridges.setMatrixAt(nr++, _m);
          }
        }
      }
      B.n = nb; nPores = np;
      bottom.count = nb; inner.count = ni; pores.count = np; bridges.count = nr;
      for (const im of [inner, pores, bridges]) { im.instanceMatrix.needsUpdate = true; }
      inner.instanceColor.needsUpdate = true;
      slab.scale.y = 2 * c;
      slab.position.y = yb + c;
      TL = Math.max(1, nb / 150);
      fillShown = -1;
      seedAges();
      buildWork(depths, xs, nb);
    }

    // ages are staggered so releases happen continuously rather than all at once
    function seedAges() {
      const tr = M0.tauRel;
      for (let k = 0; k < B.n; k++) {
        B.age[k] = Math.random() * Math.min(tr * B.lf[k], 1 / (M0.rate * B.rf[k]) * 1.2);
        B.st[k] = 0; B.tm[k] = 0;
      }
    }

    function recolorPores() {
      const f = clamp(fill, 0, 1);
      _c.copy(darkPore).lerp(chipCol, f);
      for (let i = 0; i < nPores; i++) pores.setColorAt(i, _c);
      pores.instanceColor.needsUpdate = true;
      fillShown = fill;
    }

    function writeBottom(k, scl, ox, oy, oz) {
      const w = B.w[k];
      const sy = B.sc[k * 3 + 1] * (1 - 0.55 * w);
      _s.set(B.sc[k * 3] * size * scl, sy * size * scl, B.sc[k * 3 + 2] * size * scl);
      const tipY = B.tip[k] + 0.35 * size * w;
      _p.set(B.bx[k] + ox, tipY + 0.45 * size * sy + oy, B.bz[k] + oz);
      _q.set(B.q[k * 4], B.q[k * 4 + 1], B.q[k * 4 + 2], B.q[k * 4 + 3]);
      _m.compose(_p, _q, _s);
      bottom.setMatrixAt(k, _m);
      _c.copy(baseCol).lerp(polished, w * 0.85);
      bottom.setColorAt(k, _c);
    }

    function action(name) {
      if (name === 'dress') {
        for (let k = 0; k < B.n; k++) { B.age[k] = Math.random() * 0.1; B.st[k] = 0; B.w[k] = 0; }
        fill = 0;
      } else if (name === 'true') trued = 1;
      else if (name === 'untrue') trued = 0;
    }
    layout();

    const cam = {
      iso: { position: [3, 5.5, 17], target: [-2.5, 0.8, 0] },
      close: { position: [1.5, 2.2, 10], target: [0, 0.5, 1] },
      far: { position: [-1, 5, 20], target: [-3, 1, 0] },
      top: { position: [0.5, 12, 7], target: [0, 0, 0.5] },
    };

    const presets = (arr) => `<div class="presets">${arr.map(([l, s]) => `<button class="pbtn" type="button" data-set="${s}">${l}</button>`).join('')}</div>`;
    const matSeg = `<div class="seg">${Object.entries(MATS).map(([k, [n, h]]) => `<button type="button" data-set="wmat:${k},work:${h}">${n}</button>`).join('')}</div>`;
    const ctl = (id, key, label, min, max, step) => `
      <div class="ctl-row"><label for="${id}">${label}</label><output class="val" data-out="${key}"></output></div>
      <input id="${id}" type="range" min="${min}" max="${max}" step="${step}" data-key="${key}">`;
    const workSeg = `<div class="seg"><button type="button" data-set="work:soft">Soft work</button><button type="button" data-set="work:medium">Medium</button><button type="button" data-set="work:hard">Hard work</button></div>`;

    return {
      legend: [['var(--v)', 'Wheel surface motion V'], ['var(--accent)', 'Contact patch of the whole wheel']],
      steps: [
        {
          id: 'marking', chip: 'Marking system', group: 'Set-up', eyebrow: 'Grinding · slides 115 and 122', title: 'Five fields describe every wheel',
          cam: cam.iso,
          html: () => `
            <p>A grinding wheel is a huge number of tiny abrasive grains (the cutting edges) glued together by a bond, with pores in between. The wheel is marked with letters and numbers, in this order:</p>
            <p class="formula">A &nbsp; 60 &nbsp; K &nbsp; 5 &nbsp; V</p>
            <ul>
              <li><mark>A</mark> abrasive type (Al₂O₃ here; C = SiC)</li>
              <li><mark>60</mark> grit (grain) size: bigger number = finer grain</li>
              <li><mark>K</mark> grade (hardness): A soft … Z hard; how firmly the bond holds the grains</li>
              <li><mark>5</mark> structure: 1 densest … 17 most open; grain spacing</li>
              <li><mark>V</mark> bond: V vitrified, B resinoid, R rubber, M metal</li>
            </ul>
            ${presets([['A 60 K 5 V general', `abrasive:A,grit:${GI(60)},grade:10,structure:5,bond:V`], ['C 120 H 8 V finishing', `abrasive:C,grit:${GI(120)},grade:7,structure:8,bond:V`], ['A 24 P 3 B roughing', `abrasive:A,grit:${GI(24)},grade:15,structure:3,bond:B`]])}
            <p class="ro">Live marking: <b data-ro="marking"></b></p>
            <p class="note">Diamond and CBN wheels use a similar system (slide 122) with a concentration number in place of the structure number, and bond letters such as M for metal.</p>
            <p class="exam">Asked: TF 2020-21 Q.2(a), 2014-15 Q.5(c), 2012-13 Q.6(a), 2009-10 Q.5(d).</p>`,
        },
        {
          id: 'abrasive', chip: 'Abrasive', group: 'Wheel parameters', eyebrow: 'Grinding · slide 116', title: 'Abrasive type against work material',
          cam: cam.iso,
          html: () => `
            <p>The abrasive must be <mark>hard</mark>, <mark>tough</mark> and <mark>friable</mark>: able to break into smaller sharp pieces when the force rises, which gives self-sharpening. Choose the abrasive for the work:</p>
            <div class="seg"><button type="button" data-set="abrasive:A">A Al₂O₃</button><button type="button" data-set="abrasive:C">C SiC</button><button type="button" data-set="abrasive:CBN">CBN</button><button type="button" data-set="abrasive:D">Diamond</button></div>
            <p class="small muted">Work material</p>
            ${matSeg}
            <p class="ro"><b data-ro="compat"></b></p>
            <div class="table-wrap"><table class="cmp">
              <tr><th>Abrasive</th><th>Work material</th></tr>
              <tr><td>Aluminium oxide</td><td>hardened steels, HSS, steels, cast iron</td></tr>
              <tr><td>Silicon carbide</td><td>HSS, cemented carbides, aluminium, brass, brittle materials</td></tr>
              <tr><td>CBN</td><td>tool steels, aerospace alloys</td></tr>
              <tr><td>Diamond</td><td>ceramics, cemented carbides</td></tr>
            </table></div>
            <p class="note">The hardness (grade) of a wheel has nothing to do with the hardness of the abrasive: a soft-grade wheel can be made of the hardest abrasive.</p>`,
        },
        {
          id: 'grit', chip: 'Grit size', group: 'Wheel parameters', eyebrow: 'Grinding · slides 117 and 118', title: '"20 grit" means 20 openings per inch',
          cam: cam.close,
          html: () => `
            <p>Grains are sorted by passing them through a <mark>screen mesh</mark>. A grit number of 20 means the grain just passes a screen with <mark>20 openings per inch</mark>. So a smaller number is a larger grain: 6 is very coarse, 600 very fine (up to 1000 for superfinishing).</p>
            <div class="ctl">
              ${ctl('lab-grit', 'grit', 'Grit size', 0, 26, 1)}
              ${presets([['Coarse 12', `grit:${GI(12)}`], ['Medium 60', `grit:${GI(60)}`], ['Fine 220', `grit:${GI(220)}`], ['Very fine 600', `grit:${GI(600)}`]])}
              <p class="ro">Screen pitch about 25.4/N = <b data-ro="pitch"></b> · surface roughness Ra <b data-ro="ra"></b> · relative MRR <b data-ro="mrr"></b></p>
            </div>
            <div class="duo">
              <div data-band="coarse"><h3>Coarse grit</h3><p>Big grains take a deeper cut: high material removal rate, rough surface. For roughing.</p></div>
              <div data-band="fine"><h3>Fine grit</h3><p>Small grains take a very small cut: better finish, low removal rate. For finishing.</p></div>
            </div>
            <p class="exam">Asked: TF 2015-16 Q.3(c) "What do you mean by 20 grit size?".</p>`,
        },
        {
          id: 'bond', chip: 'Bond', group: 'Wheel parameters', eyebrow: 'Grinding · slides 117 and 118', title: 'The bond holds the grains',
          cam: cam.iso,
          html: () => `
            <p>The bond gives the wheel its shape and strength. It should be strong, tough, hard and resistant to heat.</p>
            <div class="seg"><button type="button" data-set="bond:V">V Vitrified</button><button type="button" data-set="bond:B">B Resinoid</button><button type="button" data-set="bond:R">R Rubber</button><button type="button" data-set="bond:M">M Metal</button></div>
            <p class="ro">Bond now: <b data-ro="bond"></b></p>
            <div class="duo">
              <div data-band="V"><h3>Vitrified</h3><p>Ceramic. Strong, rigid, heat resistant, unaffected by coolant; poor shock resistance. Most common.</p></div>
              <div data-band="B"><h3>Resinoid</h3><p>Thermosetting resin. Very strong; for rough grinding and cut-off.</p></div>
              <div data-band="R"><h3>Rubber</h3><p>Most flexible. Cut-off wheels, centreless regulating wheels, very fine finishes on bearings.</p></div>
              <div data-band="M"><h3>Metal</h3><p>Usually bronze, for diamond and CBN. Abrasive only in a rim layer; also used in electrolytic grinding.</p></div>
            </div>
            <p class="note">In the model, a stronger bond type makes the grade hold the grains for longer (next step).</p>`,
        },
        {
          id: 'grade', chip: 'Grade', group: 'Wheel parameters', eyebrow: 'Grinding · slide 119', title: 'Grade: how tightly the bond holds the grains',
          cam: cam.close,
          html: () => `
            <p>Grade (hardness) is the ability of the bond to hold grains in place. A <mark>soft</mark> wheel lets grains go easily: blunt grains are shed and new sharp ones appear, which is <mark>self-sharpening</mark>. A <mark>hard</mark> wheel hangs on to grains until the grinding force is large.</p>
            <div class="ctl">
              ${ctl('lab-grade', 'grade', 'Grade', 0, 25, 1)}
              ${workSeg}
              <p class="ro">Grain held for about <b data-ro="tauRel"></b> · goes blunt in about <b data-ro="tauDull"></b> · wear <b data-ro="wear"></b></p>
            </div>
            <div class="duo">
              <div data-band="soft"><h3>A to H: soft</h3><p>Grains released quickly, many fall out while still useful: wheel wears fast.</p></div>
              <div data-band="med"><h3>I to P: medium</h3><p>General purpose; balance of grain loss and sharpness.</p></div>
              <div data-band="hard"><h3>Q to Z: hard</h3><p>Grains held until very dull: risk of glazing on hard work.</p></div>
            </div>
            <p class="small">Watch the face: grains pop out, a gap shows, then a fresh sharp grain appears. Flat pale grains are worn.</p>`,
        },
        {
          id: 'why', chip: 'Soft vs hard work', group: 'Wheel parameters', eyebrow: 'Grinding · slide 120', title: 'Soft wheel for hard work, hard wheel for soft work',
          cam: cam.close,
          html: () => `
            <p>Compare the four combinations (the bar shows the verdict in the HUD):</p>
            <div class="presets">
              <button class="pbtn" type="button" data-set="work:hard,grade:5">Hard work, soft wheel</button>
              <button class="pbtn" type="button" data-set="work:hard,grade:22">Hard work, hard wheel</button>
              <button class="pbtn" type="button" data-set="work:soft,grade:22">Soft work, hard wheel</button>
              <button class="pbtn" type="button" data-set="work:soft,grade:5">Soft work, soft wheel</button>
            </div>
            <p class="ro">Glazing <b data-ro="glaze"></b> · loading <b data-ro="load"></b> · wheel wear <b data-ro="wear"></b></p>
            <div class="duo">
              <div data-band="hs"><h3>Hard work + soft wheel</h3><p>Grains dull fast. The soft bond releases them, fresh sharp grains appear. Good.</p></div>
              <div data-band="hh"><h3>Hard work + hard wheel</h3><p>Dull grains stay put, the wheel glazes, force and heat rise.</p></div>
              <div data-band="sh"><h3>Soft work + hard wheel</h3><p>Grains stay sharp for long and the hard bond keeps them: long wheel life. Good.</p></div>
              <div data-band="ss"><h3>Soft work + soft wheel</h3><p>Sharp grains are pulled out although still good: the wheel wears away fast.</p></div>
            </div>
            <p class="key"><span class="key-tag">Remember</span>Match the bond release to the rate at which grains blunt. Hard work blunts grains fast, so release them (soft grade). Soft work leaves them sharp, so keep them (hard grade). A hard wheel on soft work also needs enough open structure, or it loads.</p>
            <p class="exam">Asked: TF 2021-22 Q.1(a).</p>`,
        },
        {
          id: 'structure', chip: 'Structure', group: 'Wheel parameters', eyebrow: 'Grinding · slides 120 and 121', title: 'Structure: spacing of the grains',
          cam: cam.top,
          html: () => `
            <p>Structure is the spacing of the grains: 1 is the <mark>densest</mark> (many grains, few pores), 17 the most <mark>open</mark> (fewer grains, many pores). The pores are <mark>chip space</mark> that stops the wheel loading.</p>
            <div class="ctl">
              ${ctl('lab-st', 'structure', 'Structure number', 1, 17, 1)}
              ${presets([['Dense 2', 'structure:2'], ['Medium 6', 'structure:6'], ['Open 14', 'structure:14']])}
              ${workSeg}
              <p class="ro">Grain density <b data-ro="density"></b> · loading <b data-ro="load"></b> · Ra <b data-ro="ra"></b></p>
            </div>
            <div class="duo">
              <div data-band="dense"><h3>Dense</h3><p>More cutting points: better finish and accuracy; little chip room.</p></div>
              <div data-band="open"><h3>Open</h3><p>Big chip clearance: deep or wide cuts, high stock removal, soft and gummy work, less coolant; rougher surface.</p></div>
            </div>
            <p class="exam">Asked: TF 2011-12 Q.7(a), "appropriate density of abrasives": dense for hard, brittle work and fine finish; open for soft, ductile work and heavy cuts.</p>`,
        },
        {
          id: 'defects', chip: 'Glazing and loading', group: 'Defects', eyebrow: 'Grinding · slide 136', title: 'Glazing and loading',
          cam: cam.close,
          html: () => `
            <p><mark>Glazing</mark>: the grains wear flat and shiny, down to the bond. The face becomes smooth and stops cutting. Cause: wheel too hard for the work, or hard work.</p>
            <p><mark>Loading</mark>: the pores fill with metal chips stuck to the face, which stops cutting. It happens on <b>soft work</b> with a <b>dense</b> structure.</p>
            <div class="presets">
              <button class="pbtn" type="button" data-set="work:hard,grade:23,structure:6,abrasive:A,wmat:hsteel">Glazing: hard steel, hard wheel</button>
              <button class="pbtn" type="button" data-set="work:soft,grade:14,structure:2,abrasive:C,wmat:alu">Loading: aluminium, dense wheel</button>
              <button class="pbtn" type="button" data-set="work:medium,grade:10,structure:7,abrasive:A,wmat:steel">Healthy wheel</button>
            </div>
            <p class="ro">Glazing risk <b data-ro="glaze"></b> · loading risk <b data-ro="load"></b> · relative MRR <b data-ro="mrr"></b></p>
            <div class="duo">
              <div data-band="glaze"><h3>Glazed</h3><p>Pale flat grains. Rubbing, heat, burn marks, chatter, MRR collapses.</p></div>
              <div data-band="load"><h3>Loaded</h3><p>Pores grey with chips. Poor finish, scratching, heat.</p></div>
            </div>
            <p class="exam">Asked: TF 2016-17 Q.6(b) "major wheel defects".</p>`,
        },
        {
          id: 'dress', chip: 'Dressing and truing', group: 'Defects', eyebrow: 'Grinding · slides 137 and 138', title: 'The cures: dressing and truing',
          cam: cam.far,
          onEnter: () => { trued = 0; },
          html: () => `
            <p><mark>Dressing</mark> removes the loading and breaks away the glazed surface so sharp abrasive points appear again. It produces the wheel's <b>micro-geometry</b> (cutting ability).</p>
            <p><mark>Truing</mark> regenerates the wheel's shape when it has worn unevenly or runs out of round. It sets the <b>macro-geometry</b>: true and concentric with the bore.</p>
            <p>First set a bad wheel, then dress it:</p>
            <div class="presets"><button class="pbtn" type="button" data-set="work:hard,grade:23,structure:6">Glazed wheel</button><button class="pbtn" type="button" data-set="work:soft,grade:14,structure:2,abrasive:C,wmat:alu">Loaded wheel</button></div>
            <p><button class="btn primary" type="button" data-act="dress">Dress the wheel</button> <button class="btn" type="button" data-act="true">True the wheel</button> <button class="btn ghost" type="button" data-act="untrue">Make it run out</button></p>
            <p class="ro">Glazing risk <b data-ro="glaze"></b> · loading risk <b data-ro="load"></b></p>
            <p class="note">The small wheel shows an out-of-round wheel until it is trued. For conventional wheels the two are usually one operation; for superabrasive wheels they are separate.</p>`,
        },
        {
          id: 'answer', chip: 'Exam answer', group: 'Exam', eyebrow: 'Model answer', title: 'Parameters affecting wheel performance',
          cam: cam.iso,
          html: () => `
            <ul>
              <li><b>Abrasive</b>: Al₂O₃ for steels and cast iron, SiC for carbides, aluminium, brass and brittle materials, CBN for tool steels, diamond for ceramics and carbides. Must be hard, tough and friable.</li>
              <li><b>Grit size</b>: number of screen openings per inch (20 grit = 20 per inch). Coarse gives high MRR and rough finish, fine gives a good finish and low MRR.</li>
              <li><b>Bond</b>: vitrified, resinoid, rubber or metal; holds the grains and gives strength and heat resistance.</li>
              <li><b>Grade</b>: A (soft) to Z (hard), the strength with which the bond holds grains. Soft grade for hard work (grains blunt fast and must be shed), hard grade for soft work.</li>
              <li><b>Structure</b>: 1 (dense) to 17 (open). Open: chip room, high stock removal, soft work, avoids loading. Dense: finish and accuracy.</li>
              <li><b>Defects</b>: glazing (flat shiny grains) and loading (pores full of chips), cured by dressing; truing restores the shape.</li>
            </ul>
            <p class="key"><span class="key-tag">Sketch</span>Draw a wheel face: grains, bond bridges and pores, with the marking A 60 K 5 V labelled field by field.</p>`,
        },
      ],

      onParam(key) {
        if (key === 'grit' || key === 'structure') {
          P.grit = iclamp(P.grit, 0, 26);
          P.structure = iclamp(P.structure, 1, 17);
          layout();
        } else {
          if (key === 'grade') P.grade = iclamp(P.grade, 0, 25);
          M0 = calc(P);
          colorsForAbrasive();
        }
        M0 = calc(P);
      },

      update(dt, t, stepId) {
        curStep = stepId || curStep;
        M0 = calc(P);
        const simDt = dt / TL;
        const n = B.n;
        let wm = 0, wi = 0;
        relT += dt;
        if (relT > 1) { relRate = relWin / relT; relWin = 0; relT = 0; }
        for (let k = 0; k < n; k++) {
          const st = B.st[k];
          if (st === 0) {
            B.age[k] += simDt;
            const w = Math.min(1, B.age[k] * M0.rate * B.rf[k]);
            B.w[k] = w;
            if (w > wm) { wm = w; wi = k; }
            if (B.age[k] >= M0.tauRel * B.lf[k] && dt > 0) { B.st[k] = 1; B.tm[k] = 0; relWin++; }
            writeBottom(k, 1, 0, 0, 0);
          } else if (st === 1) {
            const tm = (B.tm[k] += dt);
            const u = tm / 0.7;
            if (u >= 1) { B.st[k] = 2; B.tm[k] = 0; writeBottom(k, 0.0001, 0, 0, 0); } else writeBottom(k, 1 - u, 0, 1.2 * size * (u * 2 - 3 * u * u), u * 1.6);
          } else if (st === 2) {
            B.tm[k] += dt;
            if (B.tm[k] > 0.5) { B.st[k] = 3; B.tm[k] = 0; B.age[k] = 0; B.w[k] = 0; }
            writeBottom(k, 0.0001, 0, 0, 0);
          } else {
            const u = Math.min(1, (B.tm[k] += dt) / 0.6);
            B.w[k] = 0;
            writeBottom(k, 0.2 + 0.8 * u, 0, 0, 0);
            if (u >= 1) B.st[k] = 0;
          }
        }
        wmax = wm; wmaxIdx = wi;
        bottom.instanceMatrix.needsUpdate = true;
        if (bottom.instanceColor) bottom.instanceColor.needsUpdate = true;
        // loading: pores slowly fill with chips towards the load risk
        const target = M0.load;
        if (dt > 0) fill += clamp(target - fill, -0.2 * dt, 0.1 * dt);
        if (Math.abs(fill - fillShown) > 0.025) recolorPores();
        // wheel block slides along the work
        blk.position.z = 0.9 * Math.sin(t * 0.9);
        const oo = 1 - trued;
        wheelSpin.rotation.z = -t * 1.2;
        wheelSpin.scale.set(1 + 0.09 * oo, 1, 1);
        wheelG.position.x = WX;
      },

      overlay(d, step) {
        const z0 = blk.position.z;
        const topY = yTop + 0.6;
        d.path([[BW / 2 + 0.3, topY, -1.5 + z0], [BW / 2 + 0.3, topY, 1.5 + z0]], 'vline', { arrowEnd: true });
        d.label([BW / 2 + 0.3, topY + 0.7, z0], 'V (wheel motion)', 'v');
        d.label([-BW / 2 + 1.5, topY + 0.7, BD / 2], 'Wheel face, magnified', 'hl');
        d.label([BW / 2 - 1, -1.2, WD / 2], 'Work', 'minor');
        d.label([WX, WR * 2 + 0.6, 0], 'Whole wheel', 'minor');
        d.line([WX + 0.55, 0.15, 0.75], [-BW / 2, 0, BD / 2], 'ref');
        d.line([WX + 0.55, 0.15, -0.75], [-BW / 2, 0, -BD / 2], 'ref');
        const k = pick;
        if (step === 'grit' || step === 'marking') {
          const gx = B.bx[k], gz = B.bz[k] + z0;
          const gy = B.tip[k] + 0.45 * size;
          d.dim([gx - size / 2, gy, gz + size * 0.6], [gx + size / 2, gy, gz + size * 0.6], `grain ≈ ${(25.4 / M0.gv).toFixed(2)} mm`, [0, size * 1.2 + 0.4, 0]);
        }
        if (step === 'grit' || step === 'structure') {
          if (deepest >= 0) {
            const xg = B.bx[deepest];
            d.dim([xg, 0, WD / 2], [xg, -depthsMax, WD / 2], `scratch ≈ ${(3.5 * M0.ra).toFixed(1)} µm`, [-1.6 - depthsMax, 0, 0]);
            d.line([xg - 2, 0, WD / 2], [xg + 2, 0, WD / 2], 'ref');
          }
        }
        if (step === 'grade' || step === 'why' || step === 'defects') {
          if (B.n) d.label([B.bx[wmaxIdx], B.tip[wmaxIdx] - 0.5 * size, B.bz[wmaxIdx] + z0 + 0.4], wmax > 0.7 ? 'worn flat grain' : 'sharpest worn grain', 'hl', 0, 18);
        }
        if (step === 'structure' || step === 'defects') {
          d.label([BW / 2 - 1.5, yb - cell * 0.6, BD / 2 + 0.2], 'pores = chip space', 'minor', 0, 20);
        }
        if (step === 'bond' || step === 'marking') d.label([-BW / 2 + 1.2, yb + cell * 1.6, BD / 2], 'bond (matrix)', 'minor');
        if (step === 'abrasive' || step === 'marking') d.label([B.bx[k], B.tip[k] - 0.4 * size, B.bz[k] + z0 + 0.5], `${ABR[P.abrasive].short} grain`, 'minor', 0, 20);
      },

      hud() {
        const m = M0;
        const fields = curStep === 'marking' || curStep === 'abrasive' || curStep === 'grit' || curStep === 'bond' || curStep === 'grade' || curStep === 'structure';
        const marking = `${P.abrasive} ${m.gv} ${gradeLetter(m.gi)} ${m.st} ${P.bond}`;
        const rows = fields
          ? [
              ['Abrasive', `${P.abrasive}  ${ABR[P.abrasive].short}`],
              ['Grit', `${m.gv}  (${m.gv}/inch)`],
              ['Grade', `${gradeLetter(m.gi)}  ${gradeWord(m.gi)}`],
              ['Structure', `${m.st}  ${structWord(m.st)}`],
              ['Bond', `${P.bond}  ${BOND[P.bond].name.toLowerCase()}`],
              ['Ra / MRR', `${m.ra.toFixed(2)} µm / ${m.mrr.toFixed(0)}`],
            ]
          : [
              ['Finish Ra', `${m.ra.toFixed(2)} µm`],
              ['Relative MRR', m.mrr.toFixed(0)],
              ['Wheel wear', `${m.wear.toFixed(0)} %`],
              ['Glazing risk', `${(m.glaze * 100).toFixed(0)} %`],
              ['Loading risk', `${(m.load * 100).toFixed(0)} %`],
              ['Work', `${P.work}`],
            ];
        return { status: `${marking}`, statusCls: 'v', rows, verdict: verdictOf(m) };
      },

      readouts() {
        const m = M0;
        const wheelSoft = m.gi <= 9, wheelHard = m.gi >= 14;
        let band = '';
        if (curStep === 'grit') band = m.gv <= 36 ? 'coarse' : m.gv >= 100 ? 'fine' : '';
        else if (curStep === 'bond') band = P.bond;
        else if (curStep === 'grade') band = gradeWord(m.gi) === 'medium' ? 'med' : gradeWord(m.gi);
        else if (curStep === 'why') band = (P.work === 'hard' ? 'h' : P.work === 'soft' ? 's' : '') + (wheelSoft ? 's' : wheelHard ? 'h' : '');
        else if (curStep === 'structure') band = m.st <= 5 ? 'dense' : m.st >= 9 ? 'open' : '';
        else if (curStep === 'defects') band = m.glaze > 0.45 ? 'glaze' : m.load > 0.45 ? 'load' : '';
        if (band.length === 1) band = '';
        const sec = (v) => (v > 1e4 ? 'never' : `${v.toFixed(1)} s`);
        return {
          marking: `${P.abrasive} ${m.gv} ${gradeLetter(m.gi)} ${m.st} ${P.bond}`,
          compat: `<span>${m.comp.lvl === 'ok' ? 'Match.' : m.comp.lvl === 'warn' ? 'Marginal.' : 'Mismatch.'}</span> ${m.comp.why}`,
          pitch: `${(25.4 / m.gv).toFixed(2)} mm`,
          ra: `${m.ra.toFixed(2)} µm`,
          mrr: `${m.mrr.toFixed(0)} (grit 60 = 100)`,
          bond: `${BOND[P.bond].name}, holding factor ${BOND[P.bond].hold.toFixed(2)}`,
          tauRel: sec(m.tauRel),
          tauDull: sec(m.tauDull),
          wear: `${m.wear.toFixed(0)} %`,
          glaze: `${(m.glaze * 100).toFixed(0)} %`,
          load: `${(m.load * 100).toFixed(0)} %`,
          density: `${(95 - 45 * m.o).toFixed(0)} % of sites filled`,
          band,
        };
      },
      live: true,

      format(key, v) {
        if (key === 'grit') return `${SERIES[iclamp(v, 0, 26)]} grit`;
        if (key === 'grade') return `${gradeLetter(v)} (${gradeWord(iclamp(v, 0, 25))})`;
        if (key === 'structure') return `${iclamp(v, 1, 17)} (${structWord(iclamp(v, 1, 17))})`;
        return null;
      },

      action,

      dispose() {
        for (const im of [bottom, inner, pores, bridges]) im.dispose();
        workMesh.geometry.dispose();
      },
    };
  },
};
