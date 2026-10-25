// Radial drilling machine, gang drilling machine and multiple-spindle drilling machine: slides 163-164.
import * as THREE from 'three';
import { M, box, cyl, tube, revolve, at, group, arrow, spinArrow } from '../kit.js';
import { buildTwistDrill, chipSystem } from './twist-drill.js';

const smooth = (x) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c); };
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const TOOL_LEN = 2.0;

function twist(R) { return buildTwistDrill({ R, bodyLen: 1.2, neck: 0.1, shankLen: 0.7, shank: 'straight', helix: 30, slices: 70, overlays: false }).root; }
function reamer(R) { return buildTwistDrill({ R, bodyLen: 1.2, neck: 0.1, shankLen: 0.7, shank: 'straight', helix: 0, n: 6, rcF: 0.72, cl: 0.97, mf: 0.06, af: 0.14, point: 160, slices: 20, overlays: false }).root; }
function centreDrill() { return revolve([[0, 0], [0.04, 0.08], [0.05, 0.3], [0.14, 0.4], [0.14, 1.0], [0.12, 1.1], [0.12, TOOL_LEN], [0, TOOL_LEN]], M.hss, { seg: 20 }); }
function csink() { return revolve([[0, 0], [0.04, 0], [0.3, 0.26], [0.3, 0.5], [0.13, 0.55], [0.13, TOOL_LEN], [0, TOOL_LEN]], M.hss, { seg: 24 }); }

// quill + chuck + tool, origin at the quill bottom at rest, axis y
function quillUnit(tool, withSleeve = true) {
  const g = new THREE.Group();
  if (withSleeve) g.add(at(cyl(0.25, 1.0, M.chrome, { seg: 24 }), 0, 0.5, 0));
  const spin = new THREE.Group();
  spin.add(at(cyl(0.2, 0.3, M.darkSteel, { rTop: 0.16, seg: 20 }), 0, -0.15, 0));
  spin.add(at(cyl(0.22, 0.3, M.steel, { seg: 20 }), 0, -0.45, 0));
  tool.position.y = -0.55 - (TOOL_LEN - 0.35);
  spin.add(tool);
  g.add(spin);
  return { g, spin, tool };
}
function hole(r) { const h = cyl(r, 0.012, M.black, { seg: 20 }); h.visible = false; return h; }
function motor(x, y, z, r = 0.4) {
  const g = new THREE.Group();
  g.add(at(cyl(r, 0.9, M.paintDark, { seg: 24 }), x, y, z));
  for (let i = 0; i < 4; i++) g.add(at(cyl(r + 0.04, 0.04, M.paintDark, { seg: 24 }), x, y - 0.3 + i * 0.2, z));
  return g;
}

export default {
  id: 'radial-drill',
  title: 'Radial & specialised drills',
  subtitle: 'Radial arm, gang and multiple-spindle drilling machines',
  camera: { position: [11, 8, 14], target: [0, 3.6, 0] },
  build() {
    const root = new THREE.Group();
    const spinning = []; // tool spin groups
    const allChips = chipSystem(120, M.workCut, 1.2, 1.3);
    root.add(allChips.object);

    // ================= RADIAL =================
    const radialG = new THREE.Group();
    root.add(radialG);
    const CX = -3.2, CZ = -1.4;
    const holePos = [[0.0, 0.2], [0.0, 1.0], [1.6, 1.0], [1.6, 0.2]];
    const polar = holePos.map(([x, z]) => { const dx = x - CX, dz = z - CZ; return [Math.hypot(dx, dz), Math.atan2(-dz, dx)]; });
    const WTOP = 1.9;
    const rBase = group(at(box(8.6, 0.6, 4.4, M.castIron), 0, 0.3, 0.1));
    for (const x of [-1.5, -0.3, 0.9, 2.1]) rBase.add(at(box(0.09, 0.02, 3.8, M.black), x, 0.61, 0.5));
    radialG.add(rBase);
    const rColumn = group(at(cyl(0.5, 8.4, M.chrome, { seg: 28 }), CX, 4.8, CZ), at(cyl(0.9, 0.3, M.castIron, { seg: 28 }), CX, 0.75, CZ), at(cyl(0.12, 6.0, M.steel, { seg: 10 }), CX - 0.7, 5.0, CZ - 0.3));
    radialG.add(rColumn);
    const rWork = new THREE.Group();
    rWork.add(at(box(3.2, 1.3, 1.9, M.work), 0.8, 1.25, 0.6));
    const rHoles = holePos.map(([x, z]) => { const h = hole(0.14); h.position.set(x, WTOP + 0.008, z); rWork.add(h); return h; });
    radialG.add(rWork);
    const armG = new THREE.Group(); // swings about the column and slides up/down
    armG.position.set(CX, 6.0, CZ);
    radialG.add(armG);
    const armBody = group(at(cyl(0.72, 1.1, M.paint, { seg: 28 }), 0, 0, 0), at(box(7.0, 0.7, 0.8, M.paint), 3.9, 0, 0), at(box(7.0, 0.1, 0.5, M.paintDark), 3.9, -0.4, 0));
    armG.add(armBody);
    const headSlide = new THREE.Group(); // slides along the arm
    armG.add(headSlide);
    const rHeadBody = group(at(box(1.5, 1.3, 1.5, M.paintLight), 0, -0.2, 0), at(box(1.6, 0.12, 1.6, M.paintDark), 0, 0.5, 0), motor(0, 0.95, 0, 0.45));
    // speed/feed handle
    const rCap = new THREE.Group();
    rCap.position.set(0.8, -0.3, 0.55);
    for (let i = 0; i < 3; i++) {
      const sp = new THREE.Group(); sp.rotation.z = (i / 3) * Math.PI * 2;
      const rod = cyl(0.04, 0.9, M.steel, { seg: 8 }); rod.position.y = 0.45;
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), M.black); ball.position.y = 0.95;
      sp.add(rod, ball); rCap.add(sp);
    }
    rHeadBody.add(rCap);
    headSlide.add(rHeadBody);
    const rQuill = quillUnit(twist(0.14));
    rQuill.g.position.y = -0.85;
    headSlide.add(rQuill.g);
    spinning.push(rQuill.spin);
    const rArrows = group(spinArrow(0.5, M.vColor, { axis: 'y', arc: Math.PI * 1.4 }), arrow([-0.9, -0.7, 0], [0, -1, 0], 0.9, M.fColor));
    rArrows.children[0].position.y = -2.4;
    rQuill.g.add(rArrows);
    const rBW = new THREE.Group(); radialG.add(rBW); rBW.add(rBase, rWork);
    const rParts = { column: rColumn, arm: armBody, head: rHeadBody, base: rBW };

    // ================= GANG =================
    const gangG = new THREE.Group();
    gangG.visible = false;
    root.add(gangG);
    const stX = [-3.3, -1.1, 1.1, 3.3];
    const gTable = group(at(box(12.4, 0.5, 2.6, M.castIron), 0, 0.25, 0));
    for (const z of [-0.6, 0.6]) gTable.add(at(box(12.2, 0.04, 0.12, M.darkSteel), 0, 0.52, z));
    gangG.add(gTable);
    const gHeads = new THREE.Group();
    const gToolsG = new THREE.Group();
    const gUnits = [];
    const gToolFns = [centreDrill, () => twist(0.15), () => reamer(0.16), csink];
    stX.forEach((x, i) => {
      gHeads.add(at(cyl(0.24, 7.6, M.chrome, { seg: 20 }), x, 4.3, -0.95));
      gHeads.add(at(box(1.3, 1.4, 1.5, M.paint), x, 4.5, -0.45));
      gHeads.add(at(box(1.4, 0.1, 1.6, M.paintDark), x, 5.25, -0.45));
      gHeads.add(motor(x, 5.75, -0.45, 0.4));
      gHeads.add(at(box(1.5, 0.3, 0.7, M.paintDark), x, 3.3, -0.95)); // not used: foot
      const q = quillUnit(gToolFns[i]());
      q.g.position.set(x, 3.8, 0);
      gToolsG.add(q.g);
      gUnits.push(q);
      spinning.push(q.spin);
    });
    gangG.add(gHeads, gToolsG);
    const gPlate = new THREE.Group();
    gPlate.add(at(box(1.7, 0.5, 1.7, M.work), 0, 0.75, 0));
    const feat = [
      at(cyl(0.05, 0.012, M.black, { seg: 12 }), 0, 1.008, 0),
      at(cyl(0.15, 0.012, M.black, { seg: 20 }), 0, 1.008, 0),
      group(at(cyl(0.19, 0.012, M.chrome, { seg: 20 }), 0, 1.006, 0), at(cyl(0.15, 0.012, M.black, { seg: 20 }), 0, 1.012, 0)),
      group(at(cyl(0.32, 0.012, M.chrome, { seg: 24 }), 0, 1.006, 0), at(cyl(0.15, 0.012, M.black, { seg: 20 }), 0, 1.012, 0)),
    ];
    feat.forEach((f) => { f.visible = false; gPlate.add(f); });
    gangG.add(gPlate);
    gangG.add(group(arrow([stX[1] - 0.95, 3.4, 0], [0, -1, 0], 0.9, M.fColor), at(spinArrow(0.5, M.vColor, { axis: 'y', arc: Math.PI * 1.4 }), stX[1], 1.9, 0), arrow([-0.9, 1.2, 1.4], [1, 0, 0], 1.3, M.fColor)));
    const gTW = new THREE.Group(); gangG.add(gTW); gTW.add(gTable, gPlate);
    const gParts = { heads: gHeads, tools: gToolsG, table: gTW };

    // ================= MULTI-SPINDLE =================
    const multiG = new THREE.Group();
    multiG.visible = false;
    root.add(multiG);
    const mBase = group(at(box(7.0, 0.6, 5.2, M.castIron), 0, 0.3, 0), at(cyl(0.34, 8.0, M.chrome, { seg: 24 }), 0, 4.6, -2.3), at(cyl(0.8, 0.3, M.castIron, { seg: 24 }), 0, 0.75, -2.3));
    multiG.add(mBase);
    const mWork = new THREE.Group();
    mWork.add(at(box(3.6, 0.7, 3.2, M.work), 0, 0.95, 0));
    const pattern = [[0, 0, 0.15], [1.1, 0.9, 0.11], [-1.1, 0.9, 0.13], [1.1, -0.9, 0.12], [-1.1, -0.9, 0.1]];
    const mHoles = pattern.map(([x, z, r]) => { const h = hole(r); h.position.set(x, 1.308, z); mWork.add(h); return h; });
    mBase.add(mWork);
    const mHeadMove = new THREE.Group();
    multiG.add(mHeadMove);
    const mGear = group(at(box(3.6, 1.0, 3.2, M.paint), 0, 5.0, 0), at(box(3.7, 0.1, 3.3, M.paintDark), 0, 5.55, 0), at(box(1.2, 1.0, 1.3, M.paint), 0, 5.0, -2.3), motor(0, 6.15, 0, 0.55));
    const mPlate = at(box(3.4, 0.3, 3.0, M.paintDark), 0, 4.05, 0);
    mGear.add(mPlate);
    const mSpind = new THREE.Group();
    pattern.forEach(([x, z, r], i) => {
      const q = quillUnit(twist(r));
      q.g.position.set(x, 3.9, z);
      mSpind.add(q.g);
      spinning.push(q.spin);
      if (i > 0) {
        // telescopic drive shaft with universal joints from the gear box to the spindle
        mSpind.add(tube([[x * 0.35, 4.5, z * 0.35], [x * 0.7, 4.35, z * 0.7], [x, 4.2, z]], 0.07, M.steel, { seg: 8, radial: 8 }));
        const j1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), M.brass); j1.position.set(x * 0.35, 4.5, z * 0.35);
        const j2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), M.brass); j2.position.set(x, 4.2, z);
        mSpind.add(j1, j2);
      }
    });
    mHeadMove.add(mGear, mSpind);
    mHeadMove.add(group(arrow([-2.2, 4.0, 1.7], [0, -1, 0], 1.0, M.fColor), at(spinArrow(0.5, M.vColor, { axis: 'y', arc: Math.PI * 1.4 }), 0, 2.6, 0)));
    const mParts = { head: mGear, spindles: mSpind, work: mWork };

    // ================= animation =================
    const MODE = { radial: 0, gang: 1, multi: 2 };
    let mode = 'radial';
    let spinA = 0;
    let acc = 0;
    let ang = 0;
    let info = '';
    const state = { travel: 0, a: 0, rho: 0, k: 0 };

    const chipAt = (x, y, z) => { ang += 1.1; allChips.emit([x + Math.cos(ang) * 0.1, y, z + Math.sin(ang) * 0.1], [Math.cos(ang + 1.4) * 0.9, 1.6, Math.sin(ang + 1.4) * 0.9], 0.3); };

    const radialAt = (t) => {
      const SEG = 3.2;
      const T = SEG * 4;
      const tt = ((t % T) + T) % T;
      const k = Math.floor(tt / SEG);
      const l = tt - k * SEG;
      const prev = (k + 3) % 4;
      const m = smooth(l / 1.0);
      let s = 0;
      if (l >= 1.0 && l < 1.9) s = smooth((l - 1.0) / 0.9);
      else if (l >= 1.9 && l < 2.1) s = 1;
      else if (l >= 2.1 && l < 2.8) s = 1 - smooth((l - 2.1) / 0.7);
      const rho = polar[prev][0] + (polar[k][0] - polar[prev][0]) * m;
      const a = polar[prev][1] + (polar[k][1] - polar[prev][1]) * m;
      armG.rotation.y = a;
      armG.position.y = 6.0 + 0.3 * Math.sin(Math.PI * m) * (l < 1.0 ? 1 : 0);
      headSlide.position.x = rho;
      state.travel = s * 0.9;
      rQuill.g.position.y = -0.85 - state.travel;
      if (k === 0 && l < 0.3 && prev === 3) for (const h of rHoles) h.visible = false;
      if (s > 0.55) rHoles[k].visible = true;
      state.k = k; state.rho = rho; state.a = a;
      return s > 0.55 && l < 2.1 ? k : -1;
    };

    const gangAt = (t) => {
      const SEG = 3;
      const T = SEG * 4 + 1.2;
      const tt = ((t % T) + T) % T;
      const L = 5.6;
      let x, qs = 0, st = -1, k = Math.min(3, Math.floor(tt / SEG));
      if (tt >= SEG * 4) { const e = smooth((tt - SEG * 4) / 1.2); x = stX[3] + (L - stX[3]) * e; }
      else {
        const l = tt - k * SEG;
        const from = k === 0 ? -L : stX[k - 1];
        x = from + (stX[k] - from) * smooth(l / 1.0);
        if (l >= 1.0 && l < 2.0) qs = smooth((l - 1.0) / 1.0);
        else if (l >= 2.0 && l < 2.2) qs = 1;
        else if (l >= 2.2 && l < 3) qs = 1 - smooth((l - 2.2) / 0.8);
        st = qs > 0.55 ? k : -1;
      }
      gPlate.position.x = x;
      gPlate.scale.setScalar(Math.max(0.01, clamp01((L + 0.3 - Math.abs(x)) / 0.6)));
      for (let i = 0; i < 4; i++) gUnits[i].g.position.y = 3.8 - (i === k && tt < SEG * 4 ? qs * 0.9 : 0);
      if (tt < 0.1) feat.forEach((f) => (f.visible = false));
      if (st >= 0) { feat.forEach((f, i) => (f.visible = i === st)); }
      state.k = k; state.travel = qs * 0.9;
      return st;
    };

    const multiAt = (t) => {
      const T = 8;
      const u = ((t % T) + T) % T;
      let p = 0;
      if (u >= 1 && u < 3.5) p = smooth((u - 1) / 2.5);
      else if (u >= 3.5 && u < 4) p = 1;
      else if (u >= 4 && u < 6.3) p = 1 - smooth((u - 4) / 2.3);
      mHeadMove.position.y = -p * 0.9;
      state.travel = p * 0.9;
      if (u < 0.2) for (const h of mHoles) h.visible = false;
      if (p > 0.55) for (const h of mHoles) h.visible = true;
      return p > 0.55 && u < 4.1 ? 1 : -1;
    };

    const setMode = (id) => {
      mode = id;
      radialG.visible = id === 'radial';
      gangG.visible = id === 'gang';
      multiG.visible = id === 'multi';
      allChips.reset();
      for (const h of rHoles) h.visible = false;
      for (const h of mHoles) h.visible = false;
      feat.forEach((f) => (f.visible = false));
      state.travel = 0;
      if (id === 'radial') radialAt(0);
      if (id === 'gang') gangAt(0);
      if (id === 'multi') multiAt(0);
    };

    const modes = [
      { id: 'radial', label: 'Radial drill', info: 'Radial drilling machines are used on large workpieces. The spindle is mounted on a radial arm, so drilling can be done anywhere along the arm length. The arm swings about the column and can be raised or lowered on it, while the drill head slides along the arm; together these position the drill over each hole without moving the heavy work.', slide: 164, qs: [] },
      { id: 'gang', label: 'Gang drilling', info: 'Gang-drilling machines have several independent columns (spindles) side by side on one long table, each set up for a different operation such as centre drilling, drilling, reaming and countersinking. The workpiece is simply slid from one column to the next, so no tool changes are needed.', slide: 163, qs: [] },
      { id: 'multi', label: 'Multi-spindle', info: 'A multiple-spindle drilling machine has a single power head that drives several spindles at once through adjustable (universal-joint) drive shafts, so a whole pattern of holes is drilled in one stroke. Each hole can be a different size. NC drilling machines with indexing turrets are the CNC alternative.', slide: 164, qs: [] },
    ];

    setMode('radial');

    return {
      root,
      parts: [
        { id: 'rd-column', name: 'Column (radial)', object: rParts.column, desc: 'Large fixed vertical column rising from the base. The sleeve carrying the radial arm swings round it and slides up and down.', slide: 164, qs: [], anchor: [CX, 8.2, CZ] },
        { id: 'radial-arm', name: 'Radial arm', object: rParts.arm, desc: 'Horizontal arm clamped to the column sleeve. It swings about the column and is raised or lowered on it; the drill head travels along its length.', slide: 164, qs: [], anchor: [CX + 4, 6.5, CZ] },
        { id: 'drill-head', name: 'Drill head', object: rParts.head, desc: 'Spindle head with motor, gearbox and quill that slides along the arm. Drilling is possible anywhere along the arm length.', slide: 164, qs: [], anchor: [0, 7.3, 0] },
        { id: 'rd-work', name: 'Base & large workpiece', object: rParts.base, desc: 'The big, heavy work is bolted to the base plate and stays fixed; the drill is moved to each hole position instead.', slide: 164, qs: [], anchor: [0.8, 2.0, 0.6] },
        { id: 'gang-heads', name: 'Gang columns & heads', object: gParts.heads, desc: 'Independent columns, each with its own motor and spindle, mounted in a row on a common table. Each carries a different drilling operation.', slide: 163, qs: [], anchor: [0, 6.6, -0.5] },
        { id: 'gang-tools', name: 'Gang tools', object: gParts.tools, desc: 'Left to right: centre drill, twist drill, reamer and countersink: the usual order of operations on one hole.', slide: 163, qs: [], anchor: [0, 3.0, 0.6] },
        { id: 'gang-table', name: 'Gang table & work', object: gParts.table, desc: 'Long common table along which the workpiece is slid from one column to the next; the hole is progressively finished.', slide: 163, qs: [], anchor: [0, 0.6, 1.4] },
        { id: 'ms-head', name: 'Multi-spindle head', object: mParts.head, desc: 'A single power head (motor and gear box) operating multiple spindles, so multiple holes are drilled at one time.', slide: 164, qs: [], anchor: [0, 6.6, 0] },
        { id: 'ms-spindles', name: 'Spindles & drive shafts', object: mParts.spindles, desc: 'Spindles driven through telescopic universal-joint shafts so their positions can be set to the hole pattern; each hole can be unique in size.', slide: 164, qs: [], anchor: [1.4, 3.6, 1.2] },
        { id: 'ms-work', name: 'Pattern workpiece', object: mParts.work, desc: 'The part is held on the table under the head; all holes of the pattern are produced in one feed stroke.', slide: 164, qs: [], anchor: [0, 1.4, 1.7] },
      ],
      modes,
      setMode,
      legend: [['V', 'spindle rotation'], ['f', 'feed / table motion']],
      update(dt, t) {
        spinA -= dt * 14;
        for (const s of spinning) s.rotation.y = spinA;
        let cut = -1;
        if (mode === 'radial') {
          cut = radialAt(t);
          if (cut >= 0) { acc += dt * 45; while (acc >= 1) { acc -= 1; chipAt(holePos[cut][0], WTOP + 0.03, holePos[cut][1]); } }
        } else if (mode === 'gang') {
          cut = gangAt(t);
          if (cut >= 0) { acc += dt * 45; while (acc >= 1) { acc -= 1; chipAt(gPlate.position.x, 1.03, 0); } }
        } else {
          cut = multiAt(t);
          if (cut >= 0) { acc += dt * 60; while (acc >= 1) { acc -= 1; const p = pattern[(ang * 3 | 0) % 5 < 0 ? 0 : ((Math.abs(ang * 3) | 0) % 5)]; chipAt(p[0], 1.33, p[1]); } }
        }
        allChips.update(dt);
      },
      readout() {
        if (mode === 'radial') return [['Arm swing', (state.a * 180 / Math.PI).toFixed(0) + '°'], ['Head position', (state.rho * 10).toFixed(0) + ' mm from column'], ['Quill travel', (state.travel * 10).toFixed(0) + ' mm']];
        if (mode === 'gang') return [['Station', String(state.k + 1) + ' of 4'], ['Quill travel', (state.travel * 10).toFixed(0) + ' mm']];
        return [['Spindles', '5 driven by 1 head'], ['Head travel', (state.travel * 10).toFixed(0) + ' mm']];
      },
    };
  },
};
