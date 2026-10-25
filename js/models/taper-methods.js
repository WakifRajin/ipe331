import * as THREE from 'three';
import { M, box, cyl, extrude, at, group, arrow, spinArrow, chips, textSprite } from '../kit.js';

// Plan-view style demonstration of four ways of turning a taper.  Work axis along x, operator at +z.
const AX = 1.6, R0 = 0.5, WL = 4.4, K = 44, DT = WL / K, OX = -2.2;
const sm = (u) => u * u * (3 - 2 * u);
const lerp = (a, b, t) => a + (b - a) * t;

const T_S = 0.3;                     // tailstock set-over s (world units)
const BETA = Math.atan(T_S / WL);    // inclination of the work axis
const A_COMP = (15 * Math.PI) / 180; // compound swivel
const SLOPE_ATT = 0.06;              // taper attachment tan(alpha)
const A_FORM = (30 * Math.PI) / 180;

const sphere = (r, mat) => new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), mat);
function blade(poly, mat = M.hss, thick = 0.14) {
  const g = new THREE.Group();
  g.add(extrude(poly, thick, mat));
  g.rotation.x = Math.PI / 2;
  return g;
}

const INFO = {
  'form-tool': 'Form tool: the cutting edge is ground to the required angle and plunged straight in (radially), copying the angle onto the work. Only for short tapers or chamfers, up to about 25 mm long. tan(alpha) = (D - d) / 2l.',
  'compound-rest': 'Compound rest swivel: the compound rest is swivelled through the angle alpha on its graduated base and locked. The tool is hand-fed with the compound handle, so it moves at angle alpha to the axis. Good for short, steep tapers (any angle up to 90 degrees); hand feed only, so poorer finish, and the length is limited by the slide travel.',
  'tailstock-offset': 'Tailstock offset: the job is held between centres and the tailstock body is moved sideways by s, so the job axis is inclined to the carriage travel. Normal longitudinal power feed then cuts a taper. s = L (D - d) / 2l. Only for long, slender, gentle tapers (alpha up to about 8 degrees); no internal ttapers, centre holes wear unevenly.',
  'taper-attachment': 'Taper-turning attachment: a guide bar at the back of the bed is swivelled to alpha. A sliding block on it is linked to the cross slide, which has been freed from the cross-feed screw by removing the binder screw. As the carriage feeds along, the block slides on the inclined bar and pulls the cross slide, so the tool follows the taper. Good finish, internal tapers possible, up to about 10-12 degrees.',
};

export default {
  id: 'taper-methods',
  title: 'Taper turning methods',
  subtitle: 'Form tool, compound rest, tailstock offset and taper-turning attachment',
  camera: { position: [0.8, 8.5, 9.5], target: [0.6, 0.8, -0.2] },
  build() {
    const root = new THREE.Group();
    const parts = [];
    const QS = ['2017-18_5b', '2016-17_5c', '2014-15_5b', '2013-14_6a', '2012-13_5b', '2011-12_5c', '2011-12_5b'];

    // ---------- static machine ----------
    root.add(at(box(11, 0.3, 2.2, M.paint), 0.8, 0.15, 0));
    for (const z of [-0.6, 0.6]) root.add(at(box(11, 0.05, 0.3, M.darkSteel), 0.8, 0.325, z));
    root.add(at(box(1.6, 2.4, 1.8, M.paint), -3.2, 1.5, 0));
    root.add(at(cyl(0.4, 0.4, M.chrome, { axis: 'x' }), -2.2, AX, 0)); // spindle nose

    // chuck (form tool, compound modes)
    const chuckG = new THREE.Group();
    chuckG.position.set(0, AX, 0);
    chuckG.add(at(cyl(0.95, 0.5, M.darkSteel, { axis: 'x', seg: 40 }), -2.4, 0, 0));
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
      const j = box(0.5, 0.3, 0.22, M.steel);
      j.position.set(-2.0, Math.sin(a) * 0.62, Math.cos(a) * 0.62);
      j.rotation.x = Math.PI / 2 - a;
      chuckG.add(j);
    }
    chuckG.add(at(box(0.1, 0.03, 0.03, M.white), -2.4, 0.95, 0));
    root.add(chuckG);
    // driving plate + dog (centre modes)
    const plateG = new THREE.Group();
    plateG.position.set(0, AX, 0);
    plateG.add(at(cyl(0.9, 0.12, M.darkSteel, { axis: 'x', seg: 40 }), -2.2, 0, 0), at(cyl(0.05, 0.3, M.chrome, { axis: 'x' }), -2.0, 0.72, 0));
    plateG.add(at(cyl(0.02, 0.4, M.hss, { axis: 'x', rTop: 0.14 }), -2.1, 0, 0));
    const dog = group(at(box(0.25, 0.15, 0.22, M.red), 0, 0.5, 0), at(box(0.18, 0.5, 0.18, M.red), 0, 0.72, 0), at(box(0.12, 0.08, 0.08, M.black), 0, 0.58, 0));
    dog.position.set(-1.95, 0, 0);
    plateG.add(dog);
    root.add(plateG);

    // ---------- workpiece ----------
    const workG = new THREE.Group();
    workG.position.set(OX, AX, 0);
    const slices = [];
    const state = new Uint8Array(K);
    const Rcur = new Float32Array(K).fill(R0);
    for (let i = 0; i < K; i++) {
      const m = cyl(1, DT * 1.03, M.work, { axis: 'x', seg: 28 });
      m.position.set((i + 0.5) * DT, 0, 0);
      m.scale.set(1, R0, R0);
      workG.add(m);
      slices.push(m);
    }
    const setSlice = (i, r) => {
      const rr = Math.max(Math.min(r, R0), 0.03);
      slices[i].scale.set(1, rr, rr);
      const cut = rr < R0 - 1e-4;
      if (cut !== !!state[i]) { slices[i].material = cut ? M.workCut : M.work; state[i] = cut ? 1 : 0; }
      Rcur[i] = rr;
    };
    root.add(workG);
    parts.push({
      id: 'workpiece', name: 'Workpiece', object: workG,
      desc: 'The job being tapered. tan(alpha) = (D - d) / 2l, where D and d are the large and small diameters and l is the taper length.',
      slide: 32, qs: QS, explode: [0, 1.6, 0],
    });

    // ---------- tailstock ----------
    const tail = new THREE.Group();
    tail.add(at(box(1.7, 0.3, 1.5, M.paintDark), 3.6, 0.45, 0));
    const tUp = new THREE.Group();
    tUp.add(at(box(1.3, 1.7, 1.1, M.paint), 3.6, 1.35, 0), at(cyl(0.5, 1.3, M.paint, { axis: 'x' }), 3.6, AX, 0));
    const quillG = group(at(cyl(0.2, 0.9, M.chrome, { axis: 'x' }), 2.55, AX, 0), at(cyl(0.02, 0.35, M.hss, { axis: 'x', rTop: 0.12 }), 2.0 + 0.17 + 0.0, AX, 0));
    tUp.add(quillG);
    tUp.add(at(cyl(0.04, 0.3, M.chrome, { axis: 'x' }), 4.4, AX, 0), at(box(0.1, 0.1, 0.1, M.black), 4.6, AX + 0.4, 0));
    tail.add(tUp);
    root.add(tail);
    parts.push({
      id: 'tailstock', name: 'Tailstock', object: tail,
      desc: 'Carries the dead centre. For taper turning by offset, its upper body is shifted sideways on the base by the set-over s, so the job axis is inclined to the carriage travel.',
      slide: 32, qs: ['2014-15_5b'], explode: [1.8, 0.5, -0.8],
    });

    // ---------- movers: tool/post, cross slide + saddle, compound ----------
    const toolM = new THREE.Group();
    const crossM = new THREE.Group();
    const compM = new THREE.Group();
    root.add(toolM, crossM, compM);

    const toolG = new THREE.Group();
    toolM.add(toolG);
    const tv = {};
    const addT = (k, o) => { o.visible = false; tv[k] = o; toolG.add(o); };
    addT('point', blade([[0, 0], [0.32, 0.12], [0.32, 1.5], [-0.3, 1.5], [-0.3, 0.28]]));
    addT('wedge', blade([[0, 0], [-0.6, 0.6 * Math.tan(A_FORM)], [-0.6, 1.5], [0.6, 1.5], [0.6, 0]], M.hss, 0.3));
    const postG = group(
      at(box(0.9, 0.5, 0.8, M.darkSteel), 0, -0.32, 1.15), at(box(0.9, 0.1, 0.8, M.darkSteel), 0, 0.12, 1.15),
      at(cyl(0.05, 0.14, M.steel, { seg: 8 }), 0.28, 0.24, 1.15), at(sphere(0.06, M.black), 0.28, 0.33, 1.15),
      at(cyl(0.05, 0.14, M.steel, { seg: 8 }), -0.28, 0.24, 1.15), at(sphere(0.06, M.black), -0.28, 0.33, 1.15));
    toolG.add(postG);
    // the tool group is positioned at the tip (tx, AX, tz)
    parts.push({
      id: 'tool', name: 'Tool and tool post', object: toolM,
      desc: 'Single-point or form tool in the tool post. Its path relative to the job decides the taper: along the inclined line (compound rest, attachment) or relative to the inclined job axis (tailstock offset).',
      slide: 32, qs: QS, explode: [0, 1.8, 1.2],
    });

    // cross slide + saddle (local origin = tool tip x, z)
    const crossG = new THREE.Group();
    crossG.add(at(box(1.1, 0.18, 2.4, M.paintDark), 0, 0.7, 1.0), at(box(0.8, 0.03, 2.1, M.castIron), 0, 0.805, 1.0));
    crossG.add(at(box(1.7, 0.3, 2.0, M.paint), 0, 0.45, 0));
    const hwSpin = new THREE.Group();
    {
      const r = 0.28;
      hwSpin.add(new THREE.Mesh(new THREE.TorusGeometry(r, 0.03, 8, 24), M.chrome));
      for (let i = 0; i < 4; i++) {
        const s = box(r, 0.03, 0.03, M.chrome);
        const a = (i / 4) * Math.PI * 2;
        s.position.set(Math.cos(a) * r / 2, Math.sin(a) * r / 2, 0);
        s.rotation.z = a;
        hwSpin.add(s);
      }
      hwSpin.add(at(cyl(0.025, 0.2, M.black, { axis: 'z', seg: 8 }), r, 0, 0.1), at(sphere(0.05, M.black), r, 0, 0.22));
    }
    hwSpin.position.set(0, 0.7, 2.35);
    crossG.add(hwSpin);
    // binder screw (shown lifted out in attachment mode)
    const binder = group(at(cyl(0.07, 0.3, M.red, { seg: 8 }), 0, 0, 0), at(cyl(0.12, 0.08, M.red, { seg: 6 }), 0, 0.19, 0));
    binder.position.set(0.0, 1.35, 1.7);
    crossG.add(binder);
    const binderLbl = textSprite('binder screw removed', { size: 0.22 });
    binderLbl.position.set(0.0, 1.8, 1.7);
    crossG.add(binderLbl);
    crossM.add(crossG);
    parts.push({
      id: 'cross-slide', name: 'Cross slide', object: crossM,
      desc: 'Carries the compound rest and tool post across the work. In the taper-turning attachment it is freed from the cross-feed screw (binder screw removed) so the sliding block can pull it in or out while the carriage moves.',
      slide: 32, qs: ['2017-18_5b', '2016-17_5c', '2012-13_5b', '2011-12_5c'], explode: [0, 1.0, 1.4],
    });

    // compound rest: base disc + top slide
    const compG = new THREE.Group();
    const disc = cyl(0.62, 0.12, M.paint, { seg: 36 });
    const topSlide = box(1, 0.12, 0.9, M.paintLight);
    const scale = cyl(0.65, 0.025, M.brass, { seg: 36 });
    const compHw = new THREE.Group();
    {
      const r = 0.2;
      compHw.add(new THREE.Mesh(new THREE.TorusGeometry(r, 0.025, 8, 20), M.chrome), at(cyl(0.02, 0.18, M.black, { axis: 'z', seg: 8 }), r, 0, 0.09), at(sphere(0.045, M.black), r, 0, 0.2));
    }
    compG.add(disc, scale, topSlide, compHw);
    compM.add(compG);
    parts.push({
      id: 'compound-rest', name: 'Compound rest', object: compM,
      desc: 'Swivels on a graduated base through alpha and is locked. Hand-feeding its handle moves the tool at angle alpha to the axis; good for short, steep tapers.',
      slide: 42, qs: ['2013-14_6a', '2011-12_5b', '2012-13_5b'], explode: [0, 2.2, 0.5],
    });

    // ---------- taper attachment ----------
    const att = new THREE.Group();
    const barLen = 4.4;
    const bar = group(at(box(barLen, 0.16, 0.25, M.steel), 0, 0, 0));
    const barBase = group(at(box(0.5, 0.4, 0.5, M.paintDark), 0, -0.25, 0));
    const ZB0 = -1.7, XB0 = 1.8;
    const zb = (x) => ZB0 + (x - XB0) * SLOPE_ATT;
    const barG = new THREE.Group();
    barG.add(bar);
    barG.position.set(0, 0.55, 0);
    att.add(at(box(0.6, 0.5, 0.6, M.paintDark), -1.9, 0.55, -1.6), at(box(0.6, 0.5, 0.6, M.paintDark), 2.1, 0.55, -1.8));
    att.add(barG);
    const block = group(box(0.55, 0.45, 0.4, M.paint), at(box(0.3, 0.05, 0.3, M.black), 0, 0.25, 0));
    att.add(block);
    const link = box(0.1, 0.1, 1, M.darkSteel);
    att.add(link);
    // swivel scale at the bar pivot
    const pivot = cyl(0.3, 0.1, M.brass, { seg: 24 });
    pivot.position.set(0.0, 0.43, 0);
    att.add(pivot);
    root.add(att);
    parts.push({
      id: 'guide-bar', name: 'Guide bar and sliding block', object: att,
      desc: 'The guide bar is bolted to the back of the bed and swivelled to the taper angle alpha. A sliding block on the bar is connected to the cross slide by a link, so the cross slide follows the bar as the carriage moves.',
      slide: 32, qs: ['2017-18_5b', '2016-17_5c', '2012-13_5b', '2011-12_5c'], explode: [0, 0.6, -1.5],
    });
    barG.rotation.y = 0;

    // ---------- dimensions (tailstock offset) ----------
    const dims = new THREE.Group();
    dims.add(at(box(6.2, 0.02, 0.025, M.amber), 0.9, AX, 0));
    {
      const t = box(0.03, 0.03, T_S, M.amber);
      t.position.set(OX + WL + 0.0, AX + 0.9, -T_S / 2);
      dims.add(t);
      const v = box(0.025, 0.9, 0.025, M.amber);
      v.position.set(OX + WL, AX + 0.45, 0);
      dims.add(v);
      const v2 = box(0.025, 0.9, 0.025, M.amber);
      v2.position.set(OX + WL, AX + 0.45, -T_S);
      dims.add(v2);
      const lbl = textSprite('s', { size: 0.35 });
      lbl.position.set(OX + WL, AX + 1.2, -T_S / 2);
      dims.add(lbl);
      const L = textSprite('L', { size: 0.3 });
      L.position.set(0, AX + 0.9, 0.0);
      dims.add(L);
      dims.add(at(box(WL, 0.03, 0.03, M.amber), 0, AX + 0.9, 0.0));
    }
    root.add(dims);

    // ---------- arrows ----------
    const vA = spinArrow(0.85, M.vColor, { axis: 'x', arc: Math.PI * 1.5, tube: 0.035 });
    vA.position.set(-1.3, AX, 0);
    root.add(vA);
    const rig = new THREE.Group();
    root.add(rig);
    const setArrows = (fdir, withD) => {
      while (rig.children.length) rig.remove(rig.children[0]);
      rig.add(arrow([-fdir[0] * 1.0, 0.42, -fdir[1] * 1.0], [fdir[0], 0, fdir[1]], 1.0, M.fColor, { head: 0.2 }));
      if (withD) rig.add(arrow([0, 0.42, 0.9], [0, 0, -1], 0.7, M.dColor, { head: 0.2 }));
    };

    const ch = chips(60, M.workCut);
    root.add(ch.object);

    // ---------- modes ----------
    const qsAll = QS;
    const modes = [
      { id: 'form-tool', label: 'Form tool', info: INFO['form-tool'], slide: 32, qs: ['2012-13_5b', '2016-17_5c'] },
      { id: 'compound-rest', label: 'Compound rest', info: INFO['compound-rest'], slide: 42, qs: ['2013-14_6a', '2011-12_5b', '2016-17_5c', '2012-13_5b'] },
      { id: 'tailstock-offset', label: 'Tailstock offset', info: INFO['tailstock-offset'], slide: 32, qs: ['2014-15_5b', '2016-17_5c', '2012-13_5b'] },
      { id: 'taper-attachment', label: 'Taper-turning attachment', info: INFO['taper-attachment'], slide: 32, qs: ['2017-18_5b', '2016-17_5c', '2012-13_5b', '2011-12_5c'] },
    ];
    void qsAll;

    const gAtt = (x) => 0.5 + (x - XB0) * SLOPE_ATT;
    const gComp = (x) => 0.5 - (1.8 - x) * Math.tan(A_COMP);
    const COS = Math.cos(BETA), SIN = Math.sin(BETA);
    const ZC = 0.2;
    const rOff = (t) => ZC / COS + t * Math.tan(BETA);
    const tOfX = (x) => (x - OX) * COS + ZC * SIN;
    const MODES = {
      'form-tool': { tool: 'wedge', start: [2.2, 0.55], end: [2.2, 0.15], clr: [0, 0.9], T: 5, chuck: true, f: [0, -1], d: false },
      'compound-rest': { tool: 'point', start: [1.8, 0.5], end: [0.6, 0.5 - 1.2 * Math.tan(A_COMP)], clr: [0, 0.9], T: 6, chuck: true, f: [-Math.cos(A_COMP), -Math.sin(A_COMP)], d: true },
      'tailstock-offset': { tool: 'point', start: [2.15, ZC], end: [-1.8, ZC], clr: [0, 0.9], T: 9, chuck: false, f: [-1, 0], d: true },
      'taper-attachment': { tool: 'point', start: [1.8, 0.5], end: [-1.8, gAtt(-1.8)], clr: [0, 0.9], T: 9, chuck: false, f: [-1, SLOPE_ATT], d: true },
    };
    let modeId = 'form-tool';
    let mode = MODES[modeId];
    let phase = 0, theta = 0, tx = 0, tz = 0, ptx = 0, emitT = 0, stage = 0, hand = 0;
    const T_A = 0.8, T_R = 0.8, T_B = 1.4, T_H = 0.4;
    const total = () => T_A + mode.T + T_R + T_B + T_H;
    const out = { x: 0, z: 0 };

    function resetWork() {
      for (let i = 0; i < K; i++) setSlice(i, R0);
      ch.reset();
    }
    function pos(stg, e) {
      const [sx, sz] = mode.start, [ex, ez] = mode.end, [cx, cz] = mode.clr;
      if (stg === 0) { out.x = lerp(sx + cx, sx, e); out.z = lerp(sz + cz, sz, e); }
      else if (stg === 1) { out.x = lerp(sx, ex, e); out.z = lerp(sz, ez, e); }
      else if (stg === 2) { out.x = lerp(ex, ex + cx, e); out.z = lerp(ez, ez + cz, e); }
      else if (stg === 3) { out.x = lerp(ex + cx, sx + cx, e); out.z = lerp(ez + cz, sz + cz, e); }
      else { out.x = sx + cx; out.z = sz + cz; }
    }

    // fixed compound position (mid of stroke)
    const cmx = (1.8 + 0.6) / 2, cmz = (0.5 + (0.5 - 1.2 * Math.tan(A_COMP))) / 2;

    function layout() {
      toolM.position.set(tx, 0, tz);
      toolG.position.set(0, AX, 0);
      rig.position.set(tx, AX, tz);
      if (modeId === 'compound-rest') {
        crossM.position.set(cmx, 0, cmz);
        compM.position.set(cmx, 0, cmz);
        // tool post rides on the swivelled top slide
        postG.position.set(0, 0, 0);
      } else {
        crossM.position.set(tx, 0, tz);
        compM.position.set(tx, 0, tz);
      }
      // compound parts: disc under post, top slide
      const py = 0.79 + 0.06;
      if (modeId === 'compound-rest') {
        disc.position.set(0, py, 1.15);
        scale.position.set(0, py + 0.07, 1.15);
        topSlide.scale.set(2.3, 1, 1);
        topSlide.position.set(0, py + 0.12, 1.15);
        topSlide.rotation.y = -A_COMP;
        const dxs = Math.cos(A_COMP) * 1.2, dzs = Math.sin(A_COMP) * 1.2;
        compHw.position.set(-dxs, py + 0.12, 1.15 - dzs);
        compHw.rotation.y = Math.PI / 2 + A_COMP * 0 - A_COMP;
        compHw.rotation.set(0, -Math.PI / 2 - A_COMP, 0);
        compHw.userData.s = true;
      } else {
        disc.position.set(0, py, 1.15);
        scale.position.set(0, py + 0.07, 1.15);
        topSlide.scale.set(1, 1, 1);
        topSlide.position.set(0, py + 0.12, 1.15);
        topSlide.rotation.y = 0;
        compHw.position.set(0, py + 0.12, 1.15 + 0.6);
        compHw.rotation.set(0, 0, 0);
      }
      hwSpin.rotation.z = modeId === 'taper-attachment' ? 0 : -tz * 4;
      compHw.rotation.z = modeId === 'compound-rest' ? hand * 3 : 0;
      // attachment linkage
      if (modeId === 'taper-attachment') {
        const bz = zb(tx);
        block.position.set(tx, 0.55, bz);
        const rear = tz - 0.2;
        const len = Math.max(rear - bz, 0.05);
        link.scale.z = len;
        link.position.set(tx, 0.7, bz + len / 2);
        binder.position.y = 1.35 + 0.1 * Math.sin(phase * 3);
      }
    }

    function setModeInternal(id) {
      modeId = id;
      mode = MODES[id];
      for (const k in tv) tv[k].visible = k === mode.tool;
      chuckG.visible = mode.chuck;
      plateG.visible = !mode.chuck;
      quillG.visible = !mode.chuck;
      att.visible = id === 'taper-attachment';
      dims.visible = id === 'tailstock-offset';
      binder.visible = binderLbl.visible = id === 'taper-attachment';
      // tailstock set-over
      tUp.position.z = id === 'tailstock-offset' ? -T_S : 0;
      workG.rotation.y = id === 'tailstock-offset' ? BETA : 0;
      if (id === 'taper-attachment') {
        const xc = 0.0;
        barG.position.set(xc, 0.55, zb(xc));
        barG.rotation.y = -Math.atan(SLOPE_ATT);
        pivot.position.set(xc, 0.43, zb(xc));
        att.children[0].position.z = zb(-1.9) - 0.0;
        att.children[1].position.z = zb(2.1);
      }
      setArrows(mode.f, mode.d);
      phase = 0;
      resetWork();
      pos(0, 0);
      tx = ptx = out.x; tz = out.z;
      stage = 0;
      layout();
    }
    setModeInternal('form-tool');

    return {
      root,
      parts,
      modes,
      setMode(id) { if (MODES[id]) setModeInternal(id); },
      update(dt) {
        phase += dt;
        if (phase >= total()) { phase -= total(); resetWork(); }
        let e = 0;
        if (phase < T_A) { stage = 0; e = sm(phase / T_A); }
        else if (phase < T_A + mode.T) { stage = 1; e = (phase - T_A) / mode.T; }
        else if (phase < T_A + mode.T + T_R) { stage = 2; e = sm((phase - T_A - mode.T) / T_R); }
        else if (phase < T_A + mode.T + T_R + T_B) { stage = 3; e = sm((phase - T_A - mode.T - T_R) / T_B); }
        else stage = 4;
        ptx = tx;
        pos(stage, e);
        tx = out.x; tz = out.z;
        if (stage === 1) {
          if (Math.abs(ptx - tx) > 0.5) ptx = tx;
          const xa = Math.min(tx, ptx), xb = Math.max(tx, ptx);
          if (modeId === 'form-tool') {
            for (let i = 0; i < K; i++) {
              const x = OX + (i + 0.5) * DT;
              const r = tz + (2.2 - x) * Math.tan(A_FORM);
              if (r < Rcur[i]) setSlice(i, r);
            }
          } else if (modeId === 'compound-rest') {
            for (let i = 0; i < K; i++) {
              const x = OX + (i + 0.5) * DT;
              if (x >= xa - 1e-4 && x <= xb + 1e-4 || x > xb) { const g = gComp(x); if (g < Rcur[i] && x >= tx) setSlice(i, g); }
            }
            hand += dt * 2;
          } else if (modeId === 'tailstock-offset') {
            const ta = tOfX(tx);
            for (let i = 0; i < K; i++) {
              const t = (i + 0.5) * DT;
              if (t >= ta) { const r = rOff(t); if (r < Rcur[i]) setSlice(i, r); }
            }
          } else {
            for (let i = 0; i < K; i++) {
              const x = OX + (i + 0.5) * DT;
              if (x >= tx) { const g = gAtt(x); if (g < Rcur[i]) setSlice(i, g); }
            }
          }
          emitT += dt;
          while (emitT > 0.08) { emitT -= 0.08; ch.emit([tx, AX + 0.04, tz + 0.02], [0.3, 0.9, 0.9]); }
        }
        theta += 8 * dt;
        chuckG.rotation.x = theta;
        plateG.rotation.x = theta;
        layout();
        ch.update(dt);
      },
      readout() {
        const rows = [['Method', modes.find((m) => m.id === modeId).label]];
        rows.push(['Formula', 'tan a = (D - d) / 2l']);
        rows.push(['Sample', 'D 60, d 40, l 100 mm']);
        rows.push(['Half angle a', '5.7 deg (tan a = 0.1)']);
        if (modeId === 'tailstock-offset') rows.push(['s = L(D-d)/2l', 'L 300 mm -> s = 30 mm']);
        else if (modeId === 'compound-rest') rows.push(['Compound swivel', `${Math.round((A_COMP * 180) / Math.PI)} deg (hand feed)`]);
        else if (modeId === 'form-tool') rows.push(['Tool angle', `${Math.round((A_FORM * 180) / Math.PI)} deg (plunge)`]);
        else rows.push(['Guide bar', 'swivelled to a; power feed']);
        return rows;
      },
      legend: [['V', 'work rotation'], ['f', 'tool feed direction'], ['d', 'depth of cut']],
    };
  },
};
