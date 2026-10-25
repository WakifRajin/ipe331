import * as THREE from 'three';
import { M, box, cyl, extrude, tube, at, group, arrow, spinArrow, chips } from '../kit.js';

const AX = 1.2, R0 = 0.5;
const K = 40, SX0 = -1.6, SDX = 0.09; // work slices along x
const sm = (u) => u * u * (3 - 2 * u);
const lerp = (a, b, t) => a + (b - a) * t;
const QS = ['2023-24_5d', '2017-18_5a', '2016-17_5a', '2012-13_5a'];

function blade(poly, mat = M.hss, thick = 0.16) {
  const g = new THREE.Group();
  g.add(extrude(poly, thick, mat));
  g.rotation.x = Math.PI / 2; // outline (x, y) -> (x, z) with tip at origin and +y away from the work axis
  return g;
}

const INFO = {
  generating: 'Generating: the geometry of the work is determined by the feed trajectory of the cutting tool. The tool tip path (shown as the faint line) creates the shape, not the tool shape. Here the same tool makes a cylinder or a taper depending only on the feed path. Examples: straight turning, taper turning, contour turning, peripheral milling, profile milling.',
  forming: 'Forming: the shape of the part is created by the geometry of the cutting tool. The form tool is plunged radially (no feed along the axis) and its profile is copied onto the work. Examples: form turning, drilling, broaching.',
  'combined-thread': 'Combined generating and forming: in thread cutting on a lathe the V-shaped tool profile forms the thread flanks (forming) while the carriage feed of one pitch per revolution generates the helix along the length (generating).',
  'combined-slot': 'Combined generating and forming: in slot milling the width of the side-and-face cutter forms the slot width (forming) while the table feed generates the slot length (generating). Plain milling with a form cutter and thread cutting are other examples.',
};

export default {
  id: 'gen-form',
  title: 'Generating vs forming',
  subtitle: 'Shape from tool path, shape from tool geometry, and both combined',
  camera: { position: [2.5, 3.8, 8.5], target: [0.3, 1.1, 0] },
  build() {
    const root = new THREE.Group();
    const parts = [];
    const ghost = new THREE.MeshStandardMaterial({ color: 0xe9a321, transparent: true, opacity: 0.55, emissive: 0xe9a321, emissiveIntensity: 0.3 });

    // base plate
    root.add(at(box(9, 0.3, 3.2, M.paint), 0.3, -0.15, 0));

    // ---------- chuck ----------
    const chuckSpin = new THREE.Group();
    chuckSpin.position.set(0, AX, 0);
    chuckSpin.add(at(cyl(0.95, 0.5, M.darkSteel, { axis: 'x', seg: 40 }), -2.0, 0, 0));
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
      const j = box(0.45, 0.3, 0.22, M.steel);
      j.position.set(-1.7, Math.sin(a) * 0.62, Math.cos(a) * 0.62);
      j.rotation.x = Math.PI / 2 - a;
      chuckSpin.add(j);
    }
    chuckSpin.add(at(box(0.1, 0.03, 0.03, M.white), -2.0, 0.95, 0));
    root.add(at(box(1.3, 2.0, 1.5, M.paint), -2.9, 1.0, 0));
    root.add(chuckSpin);
    parts.push({ id: 'chuck', name: 'Chuck', object: chuckSpin, desc: 'Grips and rotates the work (cutting motion V) in the turning scenes.', slide: 4, qs: QS, explode: [-1.5, 0.4, 0] });

    // ---------- workpiece ----------
    const work = new THREE.Group();
    const slices = [];
    const cutR = new Float32Array(K).fill(R0);
    const state = new Uint8Array(K);
    for (let i = 0; i < K; i++) {
      const m = cyl(1, SDX * 1.02, M.work, { axis: 'x', seg: 28 });
      m.position.set(SX0 + (i + 0.5) * SDX, AX, 0);
      m.scale.set(1, R0, R0);
      work.add(m);
      slices.push(m);
    }
    const setSlice = (i, r) => {
      const cut = r < R0 - 1e-4;
      slices[i].scale.set(1, r, r);
      if (cut !== !!state[i]) { slices[i].material = cut ? M.workCut : M.work; state[i] = cut ? 1 : 0; }
    };
    const spinW = new THREE.Group();
    spinW.position.set(0, AX, 0);
    const TH_P = 0.2, TH_X0 = SX0 + K * SDX, TH_X1 = -1.0;
    const hpts = [];
    const hn = Math.round(((TH_X0 - TH_X1) / TH_P) * 10);
    for (let i = 0; i <= hn; i++) {
      const x = lerp(TH_X0, TH_X1, i / hn);
      const a = ((TH_X0 - x) / TH_P) * Math.PI * 2;
      hpts.push([x, Math.sin(a) * 0.44, Math.cos(a) * 0.44]);
    }
    const helix = tube(hpts, 0.035, M.black, { seg: hn, radial: 4 });
    const helixIdx = helix.geometry.index.count;
    spinW.add(helix);
    work.add(spinW);
    // slot block
    const blk = new THREE.Group();
    blk.add(at(box(3, 0.3, 1.2, M.work), 0, 0.45, 0));
    for (const s of [-1, 1]) blk.add(at(box(3, 0.3, 0.45, M.work), 0, 0.75, s * 0.375));
    const filler = box(1, 0.3, 0.3, M.work);
    blk.add(filler);
    const table = box(5.5, 0.3, 1.8, M.castIron);
    table.position.set(0.3, -0.0, 0);
    const slotG = new THREE.Group();
    slotG.add(table);
    for (const x of [-1.5, 0, 1.5, 3]) slotG.add(at(box(0.08, 0.02, 1.8, M.black), x - 0.5, 0.16, 0));
    slotG.add(blk);
    work.add(slotG);
    root.add(work);
    parts.push({ id: 'workpiece', name: 'Workpiece', object: work, desc: 'The blank. Its final geometry comes from the tool path (generating), from the tool profile (forming), or from both.', slide: 4, qs: QS, explode: [0, 1.5, 0] });

    // ---------- tools ----------
    const toolG = new THREE.Group();
    root.add(toolG);
    const tv = {};
    const addT = (k, o) => { o.visible = false; tv[k] = o; toolG.add(o); };
    const shank = (x = 0) => group(at(box(0.9, 0.5, 0.8, M.darkSteel), x, -0.33, 1.15));
    {
      const g = blade([[0, 0], [0.32, 0.12], [0.32, 1.5], [-0.3, 1.5], [-0.3, 0.28]]);
      addT('point', group(g, shank()));
    }
    const FX = 0.5, FD = 0.22, FW = 0.5;
    {
      const poly = [[-FW - 0.3, 1.5], [-FW - 0.3, FD]];
      for (let i = 0; i <= 16; i++) { const v = -1 + (i / 16) * 2; poly.push([v * FW, FD * (1 - 0.5 * (1 + Math.cos(Math.PI * v)))]); }
      poly.push([FW + 0.3, FD], [FW + 0.3, 1.5]);
      addT('form', group(blade(poly, M.hss, 0.22), shank()));
    }
    addT('thread', group(blade([[0, 0], [0.1, 0.17], [0.4, 0.17], [0.4, 1.5], [-0.4, 1.5], [-0.4, 0.17], [-0.1, 0.17]]), shank()));
    const cutterSpin = new THREE.Group();
    {
      const c = new THREE.Group();
      c.add(cyl(0.7, 0.3, M.carbide, { axis: 'z', seg: 40 }));
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        const t = box(0.14, 0.1, 0.34, M.steel);
        t.position.set(Math.cos(a) * 0.72, Math.sin(a) * 0.72, 0);
        t.rotation.z = a;
        c.add(t);
      }
      c.add(cyl(0.2, 0.34, M.darkSteel, { axis: 'z' }));
      cutterSpin.add(c);
      const g = new THREE.Group();
      g.add(cutterSpin, cyl(0.1, 2.6, M.chrome, { axis: 'z' }), at(box(0.6, 1.8, 0.4, M.paint), 0, 0.5, -1.4), at(box(0.5, 0.5, 0.5, M.paintDark), 0, 0, -1.1));
      g.visible = false;
      tv.cutter = g;
      toolG.add(g);
    }
    parts.push({ id: 'tool', name: 'Cutting tool', object: toolG, desc: 'Single-point tool (generating), form tool (forming), 60 degree thread tool or side-and-face milling cutter (combined). For forming, the tool profile is copied on the work.', slide: 6, qs: QS, explode: [0, 1.5, 1.5] });

    // ---------- trajectory ----------
    const traj = new THREE.Group();
    root.add(traj);
    let trajMesh = null;
    const setTraj = (pts) => {
      if (trajMesh) { traj.remove(trajMesh); trajMesh.geometry.dispose(); }
      trajMesh = tube(pts, 0.022, ghost, { seg: 24, radial: 6 });
      trajMesh.castShadow = false;
      traj.add(trajMesh);
    };
    parts.push({ id: 'trajectory', name: 'Feed trajectory', object: traj, desc: 'The path of the tool tip relative to the work. In generating this path (straight, inclined or curved) defines the surface produced.', slide: 5, qs: QS, explode: [0, 2.2, 0.8] });

    // ---------- arrows ----------
    const vA = spinArrow(0.85, M.vColor, { axis: 'x', arc: Math.PI * 1.5, tube: 0.035 });
    vA.position.set(-1.25, AX, 0);
    root.add(vA);
    const vC = spinArrow(0.95, M.vColor, { axis: 'z', arc: Math.PI * 1.5, tube: 0.035 });
    vC.position.set(0, 1.3, 0.35);
    root.add(vC);
    const rig = new THREE.Group();
    root.add(rig);
    const setArrows = (list) => {
      while (rig.children.length) rig.remove(rig.children[0]);
      for (const [x, y, z, dx, dy, dz, len, col] of list) rig.add(arrow([x, y, z], [dx, dy, dz], len, col, { head: 0.2 }));
    };

    const ch = chips(60, M.workCut);
    root.add(ch.object);

    // ---------- modes ----------
    const modes = [
      { id: 'generating', label: 'Generating', info: INFO.generating, slide: 5, qs: QS },
      { id: 'forming', label: 'Forming', info: INFO.forming, slide: 6, qs: QS },
      { id: 'combined-thread', label: 'Combined: thread cutting', info: INFO['combined-thread'], slide: 7, qs: QS },
      { id: 'combined-slot', label: 'Combined: slot milling', info: INFO['combined-slot'], slide: 7, qs: QS },
    ];

    let mode = 'generating';
    let phase = 0, cycle = 0, theta = 0, tx = 0, tz = 0, off = 0, emitT = 0, sTable = 0;
    const T = { a: 0.8, c: 6, r: 0.8, b: 1.0 };
    const tot = () => T.a + T.c + T.r + T.b;
    let taper = false;
    const tR = (x) => 0.28 + 0.1 * (2.0 - x);
    const pathStraight = (u) => [lerp(2.15, -1.2, u), 0.38];
    const pathTaper = (u) => { const x = lerp(2.15, 0.2, u); return [x, Math.min(tR(x), R0)]; };

    function resetScene() {
      emitT = 0;
      ch.reset();
      for (let i = 0; i < K; i++) setSlice(i, mode === 'combined-thread' ? 0.45 : R0);
      helix.geometry.setDrawRange(0, 0);
      sTable = 0;
      if (mode === 'generating') {
        taper = cycle % 2 === 1;
        const pts = [];
        for (let i = 0; i <= 12; i++) { const p = taper ? pathTaper(i / 12) : pathStraight(i / 12); pts.push([p[0], AX + 0.0, p[1] + 0.0]); }
        setTraj(pts);
        setArrows([[1.1, 0.42, 0, -1, 0, taper ? 0.1 : 0, 1.0, M.fColor], [0, 0.42, 0.9, 0, 0, -1, 0.7, M.dColor]]);
      }
    }

    function setModeInternal(id) {
      mode = id;
      for (const k in tv) tv[k].visible = false;
      const turning = id !== 'combined-slot';
      chuckSpin.visible = turning;
      for (const s of slices) s.visible = turning;
      spinW.visible = turning;
      slotG.visible = !turning;
      vA.visible = turning;
      vC.visible = !turning;
      traj.visible = true;
      helix.visible = id === 'combined-thread';
      if (id === 'generating') tv.point.visible = true;
      if (id === 'forming') tv.form.visible = true;
      if (id === 'combined-thread') tv.thread.visible = true;
      if (id === 'combined-slot') tv.cutter.visible = true;
      phase = 0; cycle = 0;
      if (id === 'forming') {
        setTraj([[FX, AX, 1.2], [FX, AX, 0.7], [FX, AX, 0.3]]);
        setArrows([[-0.9, 0.42, 1.0, 0, 0, -1, 0.8, M.fColor], [0.9, 0.42, 1.0, 0, 0, -1, 0.8, M.dColor]]);
      } else if (id === 'combined-thread') {
        setTraj([[TH_X0, AX, 0.39], [0.5, AX, 0.39], [TH_X1, AX, 0.39]]);
        setArrows([[1.1, 0.42, 0, -1, 0, 0, 1.0, M.fColor], [0, 0.42, 0.9, 0, 0, -1, 0.7, M.dColor]]);
      } else if (id === 'combined-slot') {
        setTraj([[3, 0.95, 0.0], [0, 0.95, 0.0], [-3, 0.95, 0.0]].map(([x, y, z]) => [-x * 0.8, y, z]));
        setArrows([[1.6, 1.9, 0.8, -1, 0, 0, 1.0, M.fColor], [-2.0, 1.2, 0.8, 0, -1, 0, 0.6, M.dColor]]);
      }
      resetScene();
      tx = 3; tz = 1.2;
      update(0, 0);
    }

    function update(dt) {
      phase += dt;
      if (phase >= tot()) { phase -= tot(); cycle++; resetScene(); }
      let stg = 0, e = 0;
      if (phase < T.a) { stg = 0; e = sm(phase / T.a); }
      else if (phase < T.a + T.c) { stg = 1; e = (phase - T.a) / T.c; }
      else if (phase < T.a + T.c + T.r) { stg = 2; e = sm((phase - T.a - T.c) / T.r); }
      else { stg = 3; e = 1; }
      const omega = 8;
      if (mode === 'combined-slot') {
        sTable = stg === 0 ? 0 : stg === 1 ? 4.5 * e : 4.5;
        blk.position.x = 3 - sTable;
        const xc = Math.min(Math.max(sTable - 3, -1.5), 1.5);
        const len = Math.max(1.5 - xc, 0.001);
        filler.scale.set(len, 1, 1);
        filler.position.set(xc + len / 2, 0.75, 0);
        filler.visible = len > 0.01;
        if (stg === 2 || stg === 3) { blk.position.x = 3 - 4.5; }
        // block returns for next cycle quickly
        cutterSpin.rotation.z -= dt * 10;
        toolG.position.set(0, 1.3, 0);
        tv.cutter.visible = true;
        rig.position.set(0, 0, 0);
        return;
      }
      theta += omega * dt;
      if (mode === 'generating') {
        const p = taper ? pathTaper : pathStraight;
        let x, z;
        if (stg === 0) { const q = p(0); x = q[0]; z = lerp(q[1] + 0.8, q[1], e); }
        else if (stg === 1) { const q = p(e); x = q[0]; z = q[1]; }
        else { const q = p(1); x = q[0]; z = lerp(q[1], q[1] + 0.8, stg === 2 ? e : 1); }
        tx = x; tz = z;
        if (stg === 1) {
          for (let i = 0; i < K; i++) {
            const xi = SX0 + (i + 0.5) * SDX;
            if (xi >= tx) { const r = taper ? Math.min(tR(xi), R0) : 0.38; setSlice(i, r); }
          }
          emitT += dt;
          while (emitT > 0.08) { emitT -= 0.08; ch.emit([tx, AX + 0.04, tz + 0.02], [0.3, 0.9, 0.9]); }
        }
      } else if (mode === 'forming') {
        tx = FX;
        const z0 = R0 + 0.01, z1 = R0 - FD;
        if (stg === 0) tz = lerp(z0 + 0.8, z0, e);
        else if (stg === 1) tz = lerp(z0, z1, sm(e));
        else tz = lerp(z1, z1 + 1.0, stg === 2 ? e : 1);
        if (stg === 1) {
          for (let i = 0; i < K; i++) {
            const xi = SX0 + (i + 0.5) * SDX;
            const v = (xi - FX) / FW;
            if (Math.abs(v) < 1) {
              const r = tz + FD * (1 - 0.5 * (1 + Math.cos(Math.PI * v)));
              if (r < cutR[i]) { cutR[i] = r; setSlice(i, Math.min(r, R0)); }
            }
          }
        }
      } else {
        const zt = 0.39;
        let x;
        if (stg === 0) { x = TH_X0 + 0.15; tz = lerp(zt + 0.8, zt, e); }
        else if (stg === 1) { x = lerp(TH_X0 + 0.15, TH_X1, e); tz = zt; }
        else { x = TH_X1; tz = lerp(zt, zt + 0.8, stg === 2 ? e : 1); }
        tx = x;
        if (stg === 1) {
          if (!off && off !== 0) off = 0;
          theta = (2 * Math.PI * (TH_X0 - tx)) / TH_P;
          helix.rotation.x = 0;
          const prog = Math.min(1, Math.max(0, (TH_X0 - tx) / (TH_X0 - TH_X1)));
          helix.geometry.setDrawRange(0, Math.floor(prog * (helixIdx / 24)) * 24);
        } else if (stg >= 2) helix.geometry.setDrawRange(0, helixIdx);
      }
      spinW.rotation.x = theta;
      chuckSpin.rotation.x = theta;
      toolG.position.set(tx, AX, tz);
      rig.position.set(tx, AX, tz);
      ch.update(dt);
    }
    // keep cutR in sync at cycle reset
    const baseReset = resetScene;
    resetScene = function () { baseReset(); cutR.fill(R0); };

    setModeInternal('generating');

    return {
      root,
      parts,
      modes,
      setMode(id) { setModeInternal(id); },
      update,
      readout() {
        if (mode === 'generating') return [['Method', 'Generating'], ['Shape from', 'tool path (feed trajectory)'], ['Now cutting', taper ? 'taper turning' : 'straight turning']];
        if (mode === 'forming') return [['Method', 'Forming'], ['Shape from', 'tool profile (copied)'], ['Axial feed', 'none']];
        if (mode === 'combined-thread') return [['Forming', 'V-shaped tool = thread flanks'], ['Generating', 'feed = pitch per rev -> helix']];
        return [['Forming', 'cutter width = slot width'], ['Generating', 'table feed = slot length'], ['Table travel', `${(sTable * 10).toFixed(0)} mm`]];
      },
      legend: [['V', 'cutting motion'], ['f', 'feed'], ['d', 'depth of cut'], ['faint line', 'feed trajectory']],
    };
  },
};
