import * as THREE from 'three';
import { M, box, cyl, gear, tube, at, rot, group, arrow, spinArrow, textSprite } from '../kit.js';

const TAU = Math.PI * 2;
const smooth = (x) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c); };
function label(text, p, size = 0.4) {
  const s = textSprite(text, { size });
  s.position.set(...p);
  return s;
}
const PLATE = [15, 16, 17, 18, 19, 20];
const circR = (H) => 0.55 + (H - 15) * 0.15;
const GR = 0.016; // gear outer radius per tooth
const GAP = 0.08;

const MODES = {
  simple: { N: 18, m: 2, k: 4, H: 18, r: 0, train: null, cutter: false, move: 3.2, dwell: 0.8, circle: '18-hole circle' },
  'differential-319': { N: 319, m: 0, k: 2, H: 16, r: 1 / 8, train: 'A', cutter: false, move: 1.2, dwell: 0.5, circle: '16-hole circle' },
  'differential-167': { N: 167, m: 0, k: 5, H: 20, r: -7 / 4, train: 'B', cutter: false, move: 1.2, dwell: 0.5, circle: '20-hole circle' },
  'gear-cutting': { N: 12, m: 3, k: 6, H: 18, r: 0, train: null, cutter: true, move: 0, dwell: 0, circle: '18-hole circle' },
};
const NG = 12; // teeth being cut in gear-cutting mode
const CUT_T = 2.4, LOW_T = 0.3, IDX_T = 1.8, RAISE_T = 0.3;
const DIV_T = CUT_T + LOW_T + IDX_T + RAISE_T;
const HOLD_T = 2.5;

function circleIntersect(c1, r1, c2, r2) {
  const dx = c2[0] - c1[0], dy = c2[1] - c1[1];
  const d = Math.hypot(dx, dy);
  if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) return null;
  const a = (d * d + r1 * r1 - r2 * r2) / (2 * d);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
  const mx = c1[0] + (a * dx) / d, my = c1[1] + (a * dy) / d;
  return [[mx + (h * dy) / d, my - (h * dx) / d], [mx - (h * dy) / d, my + (h * dx) / d]];
}

export default {
  id: 'dividing-head',
  title: 'Dividing head & indexing',
  subtitle: 'Simple and differential indexing, and gear cutting on the milling machine',
  camera: { position: [-0.5, 9, 21], target: [-1, 4, 0] },
  build() {
    const root = new THREE.Group();
    const tab = new THREE.Group();
    root.add(tab);

    // ---- table, head body ----
    const base = box(14.4, 0.4, 3.8, M.castIron);
    at(base, -0.9, 0.2, 0);
    tab.add(base);
    for (const z of [-1.1, 0, 1.1]) {
      const slot = box(14, 0.02, 0.14, M.black);
      at(slot, -0.9, 0.41, z);
      tab.add(slot);
    }
    const plinth = box(2.4, 0.6, 2.5, M.paint);
    at(plinth, -5.2, 0.7, 0);
    const glassBox = box(2.2, 4.4, 2.4, M.glass);
    at(glassBox, -5.2, 3.2, 0);
    const bodyG = group(plinth, glassBox);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const post = box(0.12, 4.4, 0.12, M.paint);
      at(post, -5.2 + sx * 1.1, 3.2, sz * 1.2);
      bodyG.add(post);
    }
    const topP = box(2.3, 0.12, 2.5, M.paint);
    at(topP, -5.2, 5.46, 0);
    const botP = box(2.3, 0.12, 2.5, M.paint);
    at(botP, -5.2, 1.0, 0);
    bodyG.add(topP, botP);
    tab.add(bodyG);

    // ---- spindle with worm wheel ----
    const spindle = new THREE.Group();
    spindle.position.set(0, 4, 0);
    const sRod = cyl(0.35, 3.3, M.steel, { axis: 'x' });
    at(sRod, -5.65, 0, 0);
    const nose = cyl(0.75, 0.3, M.darkSteel, { axis: 'x' });
    at(nose, -3.95, 0, 0);
    const key = box(0.32, 0.14, 0.22, M.brass);
    at(key, -3.95, 0.78, 0);
    const wheel = gear(1.3, 40, 0.35, M.brass, { axis: 'x' });
    at(wheel, -5.2, 0, 0);
    const wheelHub = cyl(0.55, 0.5, M.brass, { axis: 'x' });
    at(wheelHub, -5.2, 0, 0);
    const spindleG = group(sRod, nose, key);
    spindle.add(spindleG);
    const wheelG = group(wheel, wheelHub);
    spindle.add(wheelG);
    tab.add(spindle);

    // ---- work between centres ----
    const work = new THREE.Group();
    work.position.set(0, 4, 0);
    const mandrel = cyl(0.2, 7.2, M.chrome, { axis: 'x', seg: 20 });
    at(mandrel, -0.3, 0, 0);
    const blank = cyl(1.5, 0.8, M.work, { axis: 'x', seg: 72 });
    const hub = cyl(0.45, 1.1, M.steel, { axis: 'x', seg: 24 });
    const nutL = cyl(0.32, 0.2, M.darkSteel, { axis: 'x', seg: 6 });
    at(nutL, -0.65, 0, 0);
    const nutR = cyl(0.32, 0.2, M.darkSteel, { axis: 'x', seg: 6 });
    at(nutR, 0.65, 0, 0);
    const datum = box(0.8, 0.07, 0.12, M.darkSteel);
    at(datum, 0, 1.5, 0);
    work.add(mandrel, blank, hub, nutL, nutR, datum);
    const grooves = [];
    for (let i = 0; i < NG; i++) {
      const gg = new THREE.Group();
      gg.rotation.x = -(i / NG) * TAU;
      const gb = box(0.8, 0.55, 0.38, M.black);
      gb.position.y = 1.5 - 0.275 + 0.003;
      gb.visible = false;
      gg.add(gb);
      work.add(gg);
      grooves.push(gb);
    }
    tab.add(work);

    // ---- footstock ----
    const fBase = box(1.8, 0.6, 2.2, M.paint);
    at(fBase, 4.1, 0.7, 0);
    const fPost = box(1.0, 3.5, 1.6, M.paint);
    at(fPost, 4.1, 2.75, 0);
    const fCone = cyl(0.03, 0.8, M.darkSteel, { rTop: 0.22, axis: 'x', seg: 20 });
    at(fCone, 3.4, 4, 0);
    const fWheel = cyl(0.4, 0.15, M.darkSteel, { axis: 'x', seg: 20 });
    at(fWheel, 4.7, 4, 0);
    const footstock = group(fBase, fPost, fCone, fWheel);
    tab.add(footstock);

    // ---- worm shaft, crank, plate ----
    const PX = -5.2, PY = 2.35;
    const wormG = new THREE.Group();
    wormG.position.set(PX, PY, 0);
    const wShaft = cyl(0.12, 2.7, M.steel, { axis: 'z', seg: 12 });
    at(wShaft, 0, 0, 0.45);
    const wBody = cyl(0.25, 1.0, M.paintLight, { axis: 'z', seg: 20 });
    const tp = [];
    for (let i = 0; i <= 56; i++) {
      const a = (i / 56) * TAU * 3.6;
      tp.push([Math.cos(a) * 0.29, Math.sin(a) * 0.29, -0.5 + (i / 56) * 1.0]);
    }
    const thread = tube(tp, 0.065, M.steel, { seg: 120, radial: 6 });
    const wMark = box(0.1, 0.06, 0.4, M.brass);
    at(wMark, 0, 0.12, 1.0);
    wormG.add(wShaft, wBody, thread, wMark);
    tab.add(wormG);

    const plate = new THREE.Group();
    plate.position.set(PX, PY, 1.32);
    const disc = cyl(1.45, 0.12, M.brass, { axis: 'z', seg: 72 });
    plate.add(disc);
    const holeGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.02, 8);
    holeGeo.rotateX(Math.PI / 2);
    const total = PLATE.reduce((s, h) => s + h, 0);
    const holes = new THREE.InstancedMesh(holeGeo, M.black, total);
    const dm = new THREE.Object3D();
    let hi = 0;
    for (const H of PLATE) {
      for (let j = 0; j < H; j++) {
        const a = (j / H) * TAU;
        dm.position.set(Math.cos(a) * circR(H), Math.sin(a) * circR(H), 0.062);
        dm.updateMatrix();
        holes.setMatrixAt(hi++, dm.matrix);
      }
    }
    holes.frustumCulled = false;
    plate.add(holes);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.025, 6, 72), M.amber);
    ring.position.z = 0.07;
    plate.add(ring);
    // sector arms (carried on the plate)
    const sectorHub = cyl(0.38, 0.04, M.chrome, { axis: 'z', seg: 24 });
    sectorHub.position.z = 0.09;
    const mkArm = () => {
      const a = new THREE.Group();
      const b = box(1.15, 0.05, 0.04, M.chrome);
      b.position.set(0.925, 0, 0);
      a.add(b);
      a.position.z = 0.09;
      return a;
    };
    const arm1 = mkArm(), arm2 = mkArm();
    const sector = group(sectorHub, arm1, arm2);
    plate.add(sector);
    const plateHub = cyl(0.2, 0.25, M.steel, { axis: 'z', seg: 16 });
    plateHub.position.z = 0.12;
    plate.add(plateHub);
    const plateAll = plate;
    tab.add(plate);

    const crank = new THREE.Group();
    crank.position.set(PX, PY, 1.62);
    const cArm = box(1.95, 0.2, 0.08, M.steel);
    at(cArm, 0.78, 0, 0);
    const cHub = cyl(0.2, 0.2, M.darkSteel, { axis: 'z', seg: 16 });
    const handle = cyl(0.1, 0.5, M.rubber, { axis: 'z', seg: 12 });
    at(handle, 1.75, 0, 0.28);
    const plunger = new THREE.Group();
    const pHouse = cyl(0.1, 0.22, M.darkSteel, { axis: 'z', seg: 12 });
    at(pHouse, 0, 0, 0.1);
    const pPin = cyl(0.04, 0.3, M.brass, { axis: 'z', seg: 8 });
    at(pPin, 0, 0, -0.16);
    const pKnob = cyl(0.08, 0.12, M.brass, { axis: 'z', seg: 10 });
    at(pKnob, 0, 0, 0.26);
    plunger.add(pHouse, pPin, pKnob);
    crank.add(cArm, cHub, handle, plunger);
    tab.add(crank);

    // ---- bevel drive (inside the housing) and S2 shaft ----
    const S2 = [0.95, 2.35]; // (z, y)
    const sleeveBevel = cyl(0.42, 0.22, M.brass, { rTop: 0.22, axis: 'z', seg: 20 });
    at(sleeveBevel, PX, PY, 0.95);
    const s2Shaft = cyl(0.1, 2.05, M.steel, { axis: 'x', seg: 12 });
    at(s2Shaft, -6.575, S2[1], S2[0]);
    const s2Bevel = cyl(0.42, 0.25, M.brass, { rTop: 0.2, axis: 'x', seg: 20 });
    at(s2Bevel, -5.55, S2[1], S2[0]);
    tab.add(sleeveBevel, s2Shaft, s2Bevel);
    const bevelG = group(sleeveBevel, s2Bevel);
    void bevelG;

    // ---- change-gear quadrant ----
    const spExt = cyl(0.3, 0.8, M.steel, { axis: 'x', seg: 16 });
    at(spExt, -7.1, 4, 0);
    tab.add(spExt);
    const planeA = -6.85, planeB = -7.2, GT = 0.18;
    const mkGear = (t, x, p, mat) => {
      const gm = gear(t * GR, t, GT, mat, { axis: 'x' });
      const g = new THREE.Group();
      g.add(gm);
      g.position.set(x, p[1], p[0]);
      return { g, t, z: p[0], y: p[1], base: 0 };
    };
    const stepOf = (t) => TAU / t;
    const setFirst = (A, B) => { A.base = Math.atan2(B.y - A.y, -(B.z - A.z)) - 0.425 * stepOf(A.t); };
    const phaseTo = (A, B) => {
      const aAB = Math.atan2(B.y - A.y, -(B.z - A.z));
      const fA = (aAB - A.base) / stepOf(A.t) - 0.425;
      B.base = aAB + Math.PI - stepOf(B.t) * (fA + 0.925);
    };
    const stud = (p, x0, x1) => {
      const s = cyl(0.09, Math.abs(x1 - x0), M.darkSteel, { axis: 'x', seg: 10 });
      at(s, (x0 + x1) / 2, p[1], p[0]);
      return s;
    };
    const arm = (p, q, x) => {
      const dz = q[0] - p[0], dy = q[1] - p[1];
      const L = Math.hypot(dz, dy);
      const b = box(0.1, L, 0.28, M.paintDark);
      at(b, x, (p[1] + q[1]) / 2, (p[0] + q[0]) / 2);
      b.rotation.x = Math.atan2(dz, dy);
      return b;
    };
    const G1p = [0, 4.0];
    // Train A: 24/64 x 24/72 compound (319)
    const trainA = new THREE.Group();
    let A_g1, A_g2, A_g3, A_g4;
    {
      const r1 = 24 * GR, r2 = 64 * GR, r3 = 24 * GR, r4 = 72 * GR;
      const pts = circleIntersect(G1p, r1 + r2 - GAP, S2, r3 + r4 - GAP);
      const P = pts[0][0] < pts[1][0] ? pts[0] : pts[1];
      A_g1 = mkGear(24, planeA, G1p, M.steel);
      A_g2 = mkGear(64, planeA, P, M.brass);
      A_g3 = mkGear(24, planeB, P, M.steel);
      A_g4 = mkGear(72, planeB, S2, M.brass);
      setFirst(A_g1, A_g2);
      phaseTo(A_g1, A_g2);
      setFirst(A_g3, A_g4);
      phaseTo(A_g3, A_g4);
      trainA.add(A_g1.g, A_g2.g, A_g3.g, A_g4.g, stud(P, planeA + 0.2, planeB - 0.15), arm(S2, P, -7.5));
      const labs = [[A_g1, '24'], [A_g2, '64'], [A_g3, '24'], [A_g4, '72']];
      for (const [gg, txt] of labs) trainA.add(label(txt, [gg.g.position.x - (gg === A_g3 || gg === A_g4 ? 0.45 : 0.3), gg.y + 0.0, gg.z], 0.34));
      void r1; void r3;
    }
    // Train B: 56/32 simple train with two idlers (167)
    const trainB = new THREE.Group();
    let B_g1, B_i1, B_i2, B_g4;
    {
      const r1 = 56 * GR, ri = 24 * GR, r4 = 32 * GR;
      const d1 = r1 + ri - GAP, d2 = ri + ri - GAP, d3 = ri + r4 - GAP;
      let best = null;
      for (let deg = -180; deg <= 180; deg += 1) {
        const a = (deg * Math.PI) / 180;
        const I1 = [G1p[0] + d1 * Math.cos(a), G1p[1] + d1 * Math.sin(a)];
        const sol = circleIntersect(I1, d2, S2, d3);
        if (!sol) continue;
        const score = Math.abs(deg - 180);
        const sc = Math.min(Math.abs(deg - 180), Math.abs(deg + 180)) + 0 * score;
        const pick = Math.hypot(sol[0][0] - G1p[0], sol[0][1] - G1p[1]) > Math.hypot(sol[1][0] - G1p[0], sol[1][1] - G1p[1]) ? sol[0] : sol[1];
        // prefer idlers hanging on the back (-z) side
        const cost = Math.abs(deg + 120) + (pick[1] < 1.2 ? 1000 : 0) + sc * 0;
        if (!best || cost < best.cost) best = { cost, I1, I2: pick };
      }
      B_g1 = mkGear(56, planeA, G1p, M.steel);
      B_i1 = mkGear(24, planeA, best.I1, M.paintLight);
      B_i2 = mkGear(24, planeA, best.I2, M.paintLight);
      B_g4 = mkGear(32, planeA, S2, M.brass);
      setFirst(B_g1, B_i1);
      phaseTo(B_g1, B_i1);
      phaseTo(B_i1, B_i2);
      phaseTo(B_i2, B_g4);
      trainB.add(B_g1.g, B_i1.g, B_i2.g, B_g4.g, stud(best.I1, planeA + 0.2, planeB - 0.25), stud(best.I2, planeA + 0.2, planeB - 0.25), arm(S2, best.I2, -7.5), arm(best.I2, best.I1, -7.5));
      const labs = [[B_g1, '56'], [B_i1, 'idler'], [B_i2, 'idler'], [B_g4, '32']];
      for (const [gg, txt] of labs) trainB.add(label(txt, [planeA - 0.45, gg.y, gg.z], 0.3));
    }
    trainA.visible = trainB.visible = false;
    const gearsAll = group(trainA, trainB);
    tab.add(gearsAll);

    // ---- cutter rig (fixed to the machine, not the table) ----
    const rig = new THREE.Group();
    const CY = 6.1;
    const column = box(2.6, 8.4, 1.2, M.paint);
    at(column, 0, 4.2, -3.8);
    const overarm = box(1.6, 0.5, 6.2, M.paintDark);
    at(overarm, 0, 8.2, -0.8);
    const arbor = cyl(0.22, 4.6, M.chrome, { axis: 'z', seg: 16 });
    at(arbor, 0, CY, -0.6);
    const hang1 = box(0.5, 1.9, 0.5, M.paintDark);
    at(hang1, 0, 7.0, 1.7);
    const hang2 = box(0.5, 1.9, 0.5, M.paintDark);
    at(hang2, 0, 7.0, -1.5);
    const cutSpin = new THREE.Group();
    cutSpin.position.set(0, CY, 0);
    const cutterBody = gear(1.15, 22, 0.3, M.hss);
    const cutterHub = cyl(0.4, 0.5, M.darkSteel, { axis: 'z', seg: 20 });
    cutSpin.add(cutterBody, cutterHub);
    const cutterG = group(cutSpin);
    rig.add(column, overarm, arbor, hang1, hang2, cutterG);
    const vA = spinArrow(1.5, M.vColor, { axis: 'z', arc: Math.PI * 1.2, tube: 0.045 });
    at(vA, 0, CY, 0.5);
    rig.add(vA);
    rig.add(arrow([-1.4, 0.9, 2.3], [1, 0, 0], 2.4, M.fColor));
    rig.add(arrow([1.7, 6.5, 0.9], [0, -1, 0], 0.7, M.dColor));
    rig.add(label('V', [-1.2, CY + 1.7, 0.6], 0.45), label('f', [0, 1.5, 2.3], 0.45), label('d', [1.7, 6.9, 0.9], 0.45));
    rig.visible = false;
    root.add(rig);

    // mode-specific labels near the plate
    const lbl = {};
    for (const [id, md] of Object.entries(MODES)) {
      const s = label(md.circle, [-3.2, 2.35, 1.9], 0.38);
      s.visible = false;
      tab.add(s);
      lbl[id] = s;
    }

    const parts = [
      { id: 'base', name: 'Milling machine table', object: base, desc: 'The dividing head and footstock are bolted to the T-slotted table of the milling machine. For gear cutting the table feeds the blank past the cutter.', qs: ['2014-15_6a', '2010-11_6c'], anchor: [-0.9, 0.5, 1.8] },
      { id: 'head-body', name: 'Dividing head body', object: bodyG, desc: 'The housing of the dividing (indexing) head, shown transparent. It carries the spindle, the worm and worm wheel and the index plate, and is clamped to the table.', qs: ['2016-17_7a', '2011-12_6c', '2018-19_6a'], anchor: [-5.2, 5.6, 0] },
      { id: 'spindle', name: 'Spindle', object: spindleG, desc: 'Carries the work. It is driven by the 40-tooth worm wheel, so it turns 1/40 of a turn for each turn of the crank.', qs: ['2011-12_6c', '2016-17_7a'], anchor: [-3.9, 4.9, 0] },
      { id: 'worm-wheel', name: '40-tooth worm wheel', object: wheelG, desc: 'Fixed on the spindle and driven by a single-start worm. The 40:1 ratio is why crank turns = 40/N for N divisions.', qs: ['2011-12_6c', '2018-19_6a'], anchor: [-5.2, 5.4, 0] },
      { id: 'worm', name: 'Worm', object: wormG, desc: 'A single-start worm on the crank shaft. One turn of the crank turns the worm wheel by one tooth, i.e. the spindle by 1/40 revolution.', qs: ['2011-12_6c', '2018-19_6a'], anchor: [PX, 2.9, 0.2] },
      { id: 'index-plate', name: 'Index plate', object: plateAll, desc: 'A disc with several concentric circles of equally spaced holes (here 15 to 20). It is held stationary for simple indexing and unlocked and geared to the spindle for differential indexing.', qs: ['2011-12_6c', '2016-17_7a', '2018-19_6a', '2012-13_7b', '2009-10_6b'], anchor: [PX, 0.8, 1.6] },
      { id: 'hole-circles', name: 'Hole circles', object: holes, desc: 'Each circle has a different number of holes. The fractional part of a crank turn is counted off in a suitable circle, e.g. 4 holes in the 18-hole circle for 2 4/18 turns.', qs: ['2011-12_6c', '2012-13_7b', '2009-10_6b'], anchor: [PX + 1.0, 3.2, 1.45] },
      { id: 'crank', name: 'Index crank and plunger pin', object: crank, desc: 'The crank turns the worm. Its spring plunger pin is set to the chosen hole circle and engages a hole to lock the position.', qs: ['2011-12_6c', '2016-17_7a'], anchor: [PX + 1.7, 2.35, 1.95] },
      { id: 'sector-arms', name: 'Adjustable sector arms', object: sector, desc: 'Two radial arms set to enclose the required number of holes (+1). After each division the crank is moved up to the arm and the sector advanced, which avoids counting holes, prevents errors and makes indexing quick and repeatable.', qs: ['2015-16_4c'], anchor: [PX - 0.6, 2.9, 1.5] },
      { id: 'change-gears', name: 'Change-gear quadrant', object: gearsAll, desc: 'For differential indexing the index plate is unlocked and geared to the spindle: spindle gear (driver) to idler(s) to driven gear, then bevel gears to the plate. The ratio is Driver/Driven = 40(A - N)/A.', qs: ['2018-19_6a', '2012-13_7b', '2009-10_6b'], anchor: [-7.2, 4.9, 0] },
      { id: 'work', name: 'Gear blank on mandrel', object: work, desc: 'The blank is held on a mandrel between the dividing head spindle and the footstock centre, so it can be turned through exact angles between cuts.', qs: ['2014-15_6a', '2010-11_6c'], anchor: [0, 5.7, 0] },
      { id: 'footstock', name: 'Footstock', object: footstock, desc: 'Supports the free end of the mandrel on a dead centre so the blank is held rigidly against the cutting force.', qs: ['2014-15_6a', '2010-11_6c'], anchor: [4.1, 4.8, 0] },
      { id: 'cutter', name: 'Form gear cutter', object: cutterG, desc: 'A form-relieved involute gear cutter on a horizontal arbor, selected by module and cutter number 1-8 for the number of teeth. It is set to the whole depth (2.25 m) and cuts one tooth space per pass.', qs: ['2014-15_6a', '2010-11_6c'], anchor: [0, 7.5, 0] },
    ];

    const modes = [
      { id: 'simple', label: 'Simple indexing N = 18', qs: ['2011-12_6c', '2016-17_7a', '2015-16_4c'],
        info: 'The crank turns a single-start worm that drives a 40-tooth worm wheel (40:1), so crank turns = 40/N. For N = 18: 40/18 = 2 4/18, i.e. 2 full turns plus 4 holes in the 18-hole circle, with the plate held stationary. The adjustable sector arms are set to enclose the 4 holes (+1) so the holes need not be counted each time.' },
      { id: 'differential-319', label: 'Differential N = 319', qs: ['2012-13_7b', '2018-19_6a'],
        info: 'N = 319 cannot be done by simple indexing. Take A = 320, so the crank moves 40/320 = 1/8 turn = 2 holes in the 16-hole circle. Derivation: 40/N = 40/A + r/N, so r = Driver/Driven = 40(A - N)/A = 40(1)/320 = 1/8 = (24/64) x (24/72). A > N so r is positive and the plate turns slowly in the same direction as the crank.' },
      { id: 'differential-167', label: 'Differential N = 167', qs: ['2009-10_6b', '2018-19_6a'],
        info: 'N = 167: take A = 160, so the crank moves 40/160 = 1/4 turn = 5 holes in the 20-hole circle. r = 40(A - N)/A = 40(160 - 167)/160 = -7/4 = -56/32: driver 56, driven 32. A < N so r is negative and the plate turns opposite to the crank (add an extra idler to reverse it).' },
      { id: 'gear-cutting', label: 'Gear cutting', qs: ['2014-15_6a', '2010-11_6c'],
        info: 'A spur gear blank on a mandrel between head and footstock is centred under the form cutter. The depth is set to the whole depth (2.25 m) and one tooth space is cut by table feed. The table returns, the blank is indexed 40/Z turns (here Z = 12: 3 6/18 turns) and the cycle repeats until all spaces are cut. The dividing head gives exact equal tooth spacing.' },
    ];

    let mode = 'simple';
    let cfg = MODES[mode];
    let tm = 0;
    let u = 0, adv = 0, tx = 0, ty = 0, plateZ = 0;
    const holesMat = 0;
    void holesMat;
    const setVis = () => {
      cfg = MODES[mode];
      trainA.visible = cfg.train === 'A';
      trainB.visible = cfg.train === 'B';
      rig.visible = cfg.cutter;
      for (const k of Object.keys(lbl)) lbl[k].visible = k === mode;
      const R = circR(cfg.H);
      ring.scale.set(R, R, 1);
      plunger.position.x = R;
      for (const g of grooves) g.visible = false;
    };
    const apply = () => {
      let cutIdx = -1, cutLo = 0, nDone = 0;
      if (mode === 'gear-cutting') {
        const Tt = NG * DIV_T + HOLD_T;
        const t = tm % Tt;
        tx = -1.3; ty = 0;
        if (t >= NG * DIV_T) { u = NG; adv = NG; nDone = NG; }
        else {
          const n = Math.floor(t / DIV_T);
          const p = t - n * DIV_T;
          nDone = n;
          u = n; adv = n;
          if (p < CUT_T) { tx = -1.3 + 2.6 * (p / CUT_T); cutIdx = n; cutLo = -tx - 0.15; }
          else if (p < CUT_T + LOW_T) { tx = 1.3; ty = -0.7 * smooth((p - CUT_T) / LOW_T); nDone = n + 1; }
          else if (p < CUT_T + LOW_T + IDX_T) {
            const q = smooth((p - CUT_T - LOW_T) / IDX_T);
            u = n + q; tx = 1.3 - 2.6 * q; ty = -0.7; nDone = n + 1;
          } else {
            const q = smooth((p - CUT_T - LOW_T - IDX_T) / RAISE_T);
            u = n + 1; adv = n + q; tx = -1.3; ty = -0.7 * (1 - q); nDone = n + 1;
          }
        }
        for (let i = 0; i < NG; i++) {
          const gb = grooves[i];
          if (i < nDone) { gb.visible = true; gb.scale.x = 1; gb.position.x = 0; }
          else if (i === cutIdx) {
            const lo = Math.max(-0.4, cutLo), hi = 0.4;
            if (hi - lo > 0.001) { gb.visible = true; gb.scale.x = (hi - lo) / 0.8; gb.position.x = (hi + lo) / 2; } else gb.visible = false;
          } else gb.visible = false;
        }
        tab.position.set(tx, ty, 0);
        cutSpin.rotation.z = -tm * 6;
      } else {
        const cyc = cfg.move + cfg.dwell;
        const n = Math.floor(tm / cyc);
        const p = tm - n * cyc;
        if (p < cfg.move) { u = n + smooth(p / cfg.move); adv = n; }
        else { u = n + 1; adv = n + smooth((p - cfg.move) / cfg.dwell); }
        tab.position.set(0, 0, 0);
      }
      const psi = (TAU * u) / cfg.N;
      const relZ = -TAU * u * (cfg.m + cfg.k / cfg.H);
      plateZ = -(cfg.r * TAU * u) / cfg.N;
      plate.rotation.z = plateZ;
      crank.rotation.z = plateZ + relZ;
      wormG.rotation.z = crank.rotation.z;
      spindle.rotation.x = psi;
      work.rotation.x = psi;
      const a1 = -TAU * adv * (cfg.k / cfg.H);
      arm1.rotation.z = a1;
      arm2.rotation.z = a1 - (TAU * cfg.k) / cfg.H;
      if (cfg.train === 'A') {
        A_g1.g.rotation.x = A_g1.base + psi;
        const d2 = -psi * (A_g1.t / A_g2.t);
        A_g2.g.rotation.x = A_g2.base + d2;
        A_g3.g.rotation.x = A_g3.base + d2;
        A_g4.g.rotation.x = A_g4.base - d2 * (A_g3.t / A_g4.t);
      } else if (cfg.train === 'B') {
        B_g1.g.rotation.x = B_g1.base + psi;
        const di1 = -psi * (B_g1.t / B_i1.t);
        B_i1.g.rotation.x = B_i1.base + di1;
        B_i2.g.rotation.x = B_i2.base - di1;
        B_g4.g.rotation.x = B_g4.base + di1 * (B_i1.t / B_g4.t);
      }
    };
    setVis();
    apply();

    return {
      root,
      parts,
      modes,
      setMode(id) {
        mode = id;
        tm = 0;
        setVis();
        apply();
      },
      update(dt) {
        tm += dt;
        apply();
      },
      readout() {
        const div = Math.floor(u + 1e-6);
        const deg = ((((u / cfg.N) * 360) % 360) + 360) % 360;
        const base = [['Divisions N', String(cfg.N)]];
        if (mode === 'simple' || mode === 'gear-cutting') {
          return [...base, ['Crank turns 40/N', `${cfg.m} + ${cfg.k}/${cfg.H}`], ['Hole circle', `${cfg.H}-hole (${cfg.k} holes)`], ['Gear ratio', 'none (plate locked)'], ['Plate', 'stationary'], ['Division no.', String(div)], ['Spindle angle', `${deg.toFixed(1)}°`]];
        }
        const dif = mode === 'differential-319'
          ? ['A = 320; r = 1/8', '(24/64) x (24/72)', 'same direction as crank']
          : ['A = 160; r = -7/4', '56/32 (two idlers)', 'opposite to crank'];
        return [...base, ['Crank (relative to plate)', `${cfg.k} holes in ${cfg.H}-hole circle = 40/${cfg.N === 319 ? 320 : 160}`], ['Hole circle', `${cfg.H}-hole`], ['Choose', dif[0]], ['Gear ratio', dif[1]], ['Plate direction', dif[2]], ['Division no.', String(div)], ['Plate angle', `${((((-plateZ * 180) / Math.PI) % 360)).toFixed(2)}°`]];
      },
      legend: [['V', 'cutter rotation'], ['f', 'table feed'], ['d', 'depth of cut']],
    };
  },
};
