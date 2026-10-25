import * as THREE from 'three';
import { M, box, cyl, helixTeeth, at, arrow, spinArrow, textSprite, chips } from '../kit.js';

function handwheel(r, axis = 'z', { crank = false } = {}) {
  const inner = new THREE.Group();
  if (crank) {
    inner.add(at(cyl(0.06, r, M.chrome, { axis: 'x' }), r / 2, 0, 0));
    inner.add(at(cyl(0.05, 0.4, M.black, { axis: 'z' }), r, 0, 0.2));
  } else {
    inner.add(new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.07, 8, 32), M.black));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const s = box(r, r * 0.09, r * 0.09, M.steel);
      s.position.set(Math.cos(a) * r / 2, Math.sin(a) * r / 2, 0);
      s.rotation.z = a;
      inner.add(s);
    }
    inner.add(at(cyl(0.05, 0.4, M.black, { axis: 'z' }), r * 0.95, 0, 0.2));
  }
  inner.add(cyl(r * 0.18 + 0.03, 0.18, M.chrome, { axis: 'z' }));
  const outer = new THREE.Group();
  outer.add(inner);
  if (axis === 'x') outer.rotation.y = Math.PI / 2;
  if (axis === 'y') outer.rotation.x = -Math.PI / 2;
  outer.userData.inner = inner;
  return outer;
}

const TABLE_Z = 1.55;       // table / tool centre line (z)
const WORK_TOP = 4.13;      // top face of workpiece
const TOOL_Y = 4.0;         // end-mill tip height (cuts 0.13 deep)

// Spiral-in pocket path in work coordinates [x, z]
const PATH = (() => {
  const loops = [[0.5, 0.26], [0.34, 0.14], [0.18, 0.02]];
  const pts = [];
  for (const [a, b] of loops) pts.push([-a, -b], [a, -b], [a, b], [-a, b], [-a, -b + 0.12]);
  return pts;
})();
const SEG_LEN = [];
let PATH_LEN = 0;
for (let i = 1; i < PATH.length; i++) {
  const l = Math.hypot(PATH[i][0] - PATH[i - 1][0], PATH[i][1] - PATH[i - 1][1]);
  SEG_LEN.push(l);
  PATH_LEN += l;
}
function pathAt(s, out) {
  s = Math.min(Math.max(s, 0), PATH_LEN);
  for (let i = 0; i < SEG_LEN.length; i++) {
    if (s <= SEG_LEN[i] || i === SEG_LEN.length - 1) {
      const k = SEG_LEN[i] > 0 ? Math.min(s / SEG_LEN[i], 1) : 0;
      out[0] = PATH[i][0] + (PATH[i + 1][0] - PATH[i][0]) * k;
      out[1] = PATH[i][1] + (PATH[i + 1][1] - PATH[i][1]) * k;
      return out;
    }
    s -= SEG_LEN[i];
  }
  return out;
}

export default {
  id: 'milling-vertical',
  title: 'Vertical milling machine',
  subtitle: 'Column, knee, saddle, table, ram and swivelling milling head',
  camera: { position: [10, 7, 12], target: [0, 4, 0.5] },
  build() {
    const root = new THREE.Group();

    // Base
    const base = new THREE.Group();
    base.add(at(box(4.2, 0.6, 4.4, M.castIron), 0, 0.3, 0.1));
    base.add(at(box(3.8, 0.12, 4.0, M.paintDark), 0, 0.66, 0.1));
    base.add(at(cyl(0.45, 0.5, M.paintDark), 0, 0.85, 1.25));
    root.add(base);

    // Column
    const column = new THREE.Group();
    column.add(at(box(3.2, 5.8, 1.8, M.paint), 0, 3.5, -1.0));
    column.add(at(box(3.4, 0.3, 2.0, M.paintLight), 0, 6.55, -1.0));
    for (const sx of [-1.1, 1.1]) column.add(at(box(0.28, 4.6, 0.12, M.darkSteel), sx, 3.1, -0.06));
    column.add(at(box(0.5, 1.9, 1.3, M.paintDark), 1.85, 4.9, -1.0));
    for (let i = 0; i < 3; i++) column.add(at(cyl(0.1, 0.12, M.black, { axis: 'x' }), 2.15, 4.4 + i * 0.5, -1.0));
    root.add(column);

    // Ram (slides fore/aft on top of column)
    const ram = new THREE.Group();
    ram.add(at(box(1.9, 1.0, 4.2, M.paint), 0, 7.2, 0.2));
    ram.add(at(box(2.1, 0.15, 3.6, M.paintLight), 0, 7.75, 0.0));
    ram.add(at(box(0.8, 0.12, 1.2, M.paintDark), 0, 7.8, -1.0));
    root.add(ram);

    // Milling head: swivel base, gear head, motor
    const head = new THREE.Group();
    head.add(at(cyl(0.95, 0.25, M.paintDark), 0, 6.58, TABLE_Z));
    head.add(at(cyl(1.05, 0.08, M.steel), 0, 6.43, TABLE_Z));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      head.add(at(cyl(0.07, 0.12, M.chrome), Math.cos(a) * 0.85, 6.7, TABLE_Z + Math.sin(a) * 0.85));
    }
    head.add(at(box(1.7, 1.9, 1.6, M.paint), 0, 5.45, TABLE_Z));
    head.add(at(box(1.3, 0.6, 0.12, M.paintDark), 0, 5.7, TABLE_Z + 0.85));
    head.add(at(cyl(0.6, 1.5, M.blue), 0, 8.3 + 0.0, TABLE_Z)); // motor
    for (let i = 0; i < 6; i++) head.add(at(cyl(0.66, 0.06, M.paintDark), 0, 7.7 + i * 0.22, TABLE_Z));
    head.add(at(cyl(0.45, 0.4, M.paintDark), 0, 7.95, TABLE_Z));
    // quill feed handwheel (side) + feed control unit
    const quillWheel = handwheel(0.55, 'x', { crank: true });
    quillWheel.position.set(1.0, 5.2, TABLE_Z);
    head.add(quillWheel);
    head.add(at(box(0.4, 0.6, 0.5, M.black), -1.0, 5.3, TABLE_Z));
    root.add(head);

    // Spindle + quill
    const quill = new THREE.Group();
    quill.add(at(cyl(0.42, 0.7, M.chrome), 0, 4.65, TABLE_Z));
    quill.add(at(cyl(0.32, 0.4, M.darkSteel), 0, 4.2, TABLE_Z));
    quill.add(at(cyl(0.4, 0.28, M.darkSteel, { rTop: 0.25 }), 0, 3.95, TABLE_Z));
    root.add(quill);

    // End mill
    const mill = new THREE.Group();
    mill.add(at(cyl(0.18, 0.55, M.hss), 0, 0.55, 0));
    mill.add(at(cyl(0.16, 0.5, M.carbide), 0, 0.25, 0));
    mill.add(helixTeeth(0.16, 0.5, 4, M.carbide, { helix: 1.2, width: 0.07, height: 0.07 }).translateY(0.25));
    mill.add(spinArrow(0.5, M.vColor, { axis: 'y', arc: 4.2 }));
    mill.position.set(0, TOOL_Y, TABLE_Z);
    quill.position.y = 0.55;
    mill.children[3].position.y = 0.9;
    root.add(mill);

    // Knee
    const knee = new THREE.Group();
    knee.add(at(box(3.1, 1.1, 2.4, M.paint), 0, 2.15, 1.0));
    knee.add(at(box(3.3, 0.18, 2.5, M.paintLight), 0, 1.5, 1.0));
    knee.add(at(box(0.9, 0.5, 0.1, M.paintDark), 0, 2.15, 2.25));
    const kneeCrank = handwheel(0.35, 'z', { crank: true });
    kneeCrank.position.set(1.2, 2.0, 2.2);
    knee.add(kneeCrank);
    knee.add(at(cyl(0.2, 1.0, M.chrome), 0, 1.0, 1.25));
    root.add(knee);

    // Saddle (moves in Y)
    const saddle = new THREE.Group();
    saddle.add(at(box(2.7, 0.4, 2.1, M.paintLight), 0, 2.9, 1.25));
    saddle.add(at(box(2.9, 0.12, 0.4, M.darkSteel), 0, 2.78, 2.35));
    const saddleWheel = handwheel(0.5, 'z');
    saddleWheel.position.set(0, 2.75, 2.6);
    saddle.add(saddleWheel);
    root.add(saddle);

    // Table (X) with T-slots, handwheel, vise, workpiece and pocket trail
    const table = new THREE.Group();
    table.add(at(box(4.8, 0.4, 1.5, M.castIron), 0, 3.3, TABLE_Z));
    table.add(at(box(4.9, 0.05, 1.55, M.darkSteel), 0, 3.5, TABLE_Z));
    for (const dz of [-0.45, 0, 0.45]) table.add(at(box(4.8, 0.06, 0.12, M.black), 0, 3.54, TABLE_Z + dz));
    const tw = handwheel(0.38, 'x');
    tw.position.set(2.65, 3.3, TABLE_Z);
    table.add(tw);
    const vise = new THREE.Group();
    vise.add(at(box(2.4, 0.2, 1.2, M.paintDark), 0, 3.63, TABLE_Z));
    vise.add(at(box(0.25, 0.4, 1.2, M.darkSteel), -0.95, 3.93, TABLE_Z));
    vise.add(at(box(0.25, 0.4, 1.2, M.darkSteel), 0.95, 3.93, TABLE_Z));
    vise.add(at(cyl(0.06, 0.7, M.steel, { axis: 'x' }), 1.4, 3.93, TABLE_Z));
    vise.add(at(cyl(0.04, 0.5, M.black, { axis: 'z' }), 1.75, 3.93, TABLE_Z));
    vise.add(at(box(1.65, 0.4, 1.0, M.work), 0, 3.93, TABLE_Z));
    const N = 90;
    const trail = [];
    const tmp = [0, 0];
    const trailGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.02, 14);
    for (let i = 0; i < N; i++) {
      pathAt((i / (N - 1)) * PATH_LEN, tmp);
      const d = new THREE.Mesh(trailGeo, M.black);
      d.position.set(tmp[0], WORK_TOP + 0.005, TABLE_Z + tmp[1]);
      d.visible = false;
      vise.add(d);
      trail.push(d);
    }
    table.add(vise);
    root.add(table);

    // Compare-mode ghost: horizontal spindle + slab cutter
    const ghost = new THREE.Group();
    const gm = M.amber.clone();
    gm.transparent = true;
    gm.opacity = 0.45;
    gm.depthWrite = false;
    ghost.add(at(cyl(0.2, 3.4, gm, { axis: 'z' }), 0, 5.3, 0.9));
    ghost.add(at(cyl(0.9, 1.2, gm, { axis: 'z' }), 0, 5.3, 1.0));
    const s1 = textSprite('Horizontal spindle (HMC): arbor-mounted cutter', { size: 0.3 });
    s1.position.set(-3.2, 5.3, 2.8);
    const s2 = textSprite('Vertical spindle (VMC): cutter in spindle', { size: 0.3 });
    s2.position.set(-3.2, 3.8, 2.8);
    ghost.add(s1);
    ghost.add(s2);
    ghost.visible = false;
    root.add(ghost);

    // Axis arrows
    const arrows = new THREE.Group();
    arrows.add(arrow([-1.2, 2.2, 3.6], [1, 0, 0], 2.4, M.fColor));
    arrows.add(arrow([-3.4, 3.4, 0.8], [0, 0, 1], 2.2, M.fColor));
    arrows.add(arrow([-3.4, 3.4, 0.8], [0, 1, 0], 2.2, M.fColor));
    for (const [txt, p] of [['X', [1.5, 2.2, 3.6]], ['Y', [-3.4, 3.2, 3.3]], ['Z', [-3.4, 5.9, 0.8]]]) {
      const sp = textSprite(txt, { size: 0.4 });
      sp.position.set(...p);
      arrows.add(sp);
    }
    root.add(arrows);

    const cs = chips(40, M.workCut);
    root.add(cs.object);

    const parts = [
      { id: 'base', name: 'Base', object: base, desc: 'Cast-iron foundation carrying the column and the knee elevating screw.', slide: 52, qs: ['2012-13_7a'], explode: [0, -1.2, 0] },
      { id: 'column', name: 'Column', object: column, desc: 'Houses the bearings, gearbox, clutches, shafts, pumps and shifting mechanisms that transmit power from the motor at a selected speed. Carries the knee ways at the front and the ram slideways on top.', slide: 52, qs: ['2012-13_7a'], explode: [0, 0, -2] },
      { id: 'knee', name: 'Knee', object: knee, desc: 'Mounted in front of the column; supports the table and gives the up and down motion along the Z axis.', slide: 52, qs: ['2012-13_7a'], explode: [0, -0.6, 1.2] },
      { id: 'saddle', name: 'Saddle', object: saddle, desc: 'Two slideways at 90 degrees to each other, one on top and one at the bottom, give motion in the X or Y axes by means of lead screws.', slide: 52, qs: ['2012-13_7a'], explode: [0, 0.5, 1.4] },
      { id: 'table', name: 'Table', object: table, desc: 'Mounted on top of the saddle and moved along the X axis. T-slots on its top clamp the workpiece or fixtures. Here a vise holds the workpiece being pocketed.', slide: 53, qs: ['2012-13_7a'], explode: [0, 1.5, 1.5] },
      { id: 'ram', name: 'Ram', object: ram, desc: 'The ram carries the milling head and can be positioned forward and backward along the slideways on top of the column.', slide: 53, qs: ['2012-13_7a'], explode: [0, 1.5, 0] },
      { id: 'milling-head', name: 'Milling head (swivel + motor)', object: head, desc: 'Consists of the spindle, the motor and the feed control unit, mounted on a swivel base so that it can be set at any angle to the table.', slide: 53, qs: ['2012-13_7a'], explode: [0, 2.5, 0] },
      { id: 'spindle-quill', name: 'Spindle quill', object: quill, desc: 'Vertical spindle running in a sliding quill that is fed down into the work by the quill handwheel or power feed. The cutter is mounted directly in the spindle.', slide: 53, qs: [], explode: [0, 1.0, 0.5] },
      { id: 'end-mill', name: 'End mill', object: mill, desc: 'Helical-fluted end mill held directly in the spindle taper; here it mills a pocket in the workpiece by table X and saddle Y motions.', slide: 63, qs: ['2016-17_7d'], explode: [0, 0.5, 1.5] },
      { id: 'vise', name: 'Vise and workpiece', object: vise, desc: 'Workpiece clamped in a vise; the dark track shows the metal removed by the pocket path.', slide: 53, qs: [], explode: [0, 2.5, 1.5] },
    ];

    const modes = [
      { id: 'vertical', label: 'Vertical mill', info: 'Spindle is mounted vertical, perpendicular to the work table, so the cutter is held directly in the spindle. Generally 3 axes (X, Y, Z). The head can be swivelled and the cutter moved up and down; here the table and saddle trace a pocket under a rotating end mill.', slide: 53, qs: ['2012-13_7a'] },
      { id: 'compare', label: 'Vertical vs horizontal', info: 'Horizontal (HMC): spindle parallel to the table; arbor-mounted cutter; up to 4 axes (X, Y, Z, A) and cuts in multiple planes with a rotary table; best surface finish; longer tool life; large, expensive, heavy and powerful; chips fall away easily; high working capacity. Vertical (VMC): spindle perpendicular to the table; cutter mounted directly in the spindle; 3 axes; cuts in a single plane; poorer finish; reduced tool life; smaller, cheaper, lighter; poor chip evacuation; lower capacity; cutter can be moved up/down and tilted.', slide: 55, qs: [] },
    ];

    let ph = 0, mode = 'vertical', emitT = 0;
    const pos = [0, 0];
    let cutting = true;
    const CYCLE = 16;

    function apply(u) {
      cutting = u < 0.9;
      let s;
      if (cutting) {
        s = (u / 0.9) * PATH_LEN;
        pathAt(s, pos);
      } else {
        const k = (u - 0.9) / 0.1;
        const e = k * k * (3 - 2 * k);
        pathAt(PATH_LEN, pos);
        const ex = pos[0], ez = pos[1];
        pathAt(0, pos);
        pos[0] = ex + (pos[0] - ex) * e;
        pos[1] = ez + (pos[1] - ez) * e;
        s = 0;
      }
      table.position.x = -pos[0];
      table.position.z = -pos[1];
      saddle.position.z = -pos[1];
      const shown = cutting ? Math.floor((s / PATH_LEN) * (N - 1)) : -1;
      for (let i = 0; i < N; i++) trail[i].visible = i <= shown;
      tw.userData.inner.rotation.z = pos[0] * 6;
      saddleWheel.userData.inner.rotation.z = pos[1] * 6;
    }

    return {
      root, parts, modes,
      setMode(id) {
        mode = id;
        ph = 0;
        ghost.visible = id === 'compare';
        cs.reset();
        apply(0);
      },
      update(dt) {
        ph += dt;
        apply((ph % CYCLE) / CYCLE);
        mill.rotation.y = -ph * 10;
        mill.children[3].rotation.y = ph * 10;
        cs.update(dt);
        emitT += dt;
        if (cutting && emitT > 0.12) {
          emitT = 0;
          const a = Math.random() * 6.283;
          cs.emit([-pos[0] * 0 + 0, WORK_TOP + 0.1, TABLE_Z], [Math.cos(a) * 1.0, 1.2, Math.sin(a) * 1.0]);
        }
      },
      readout() {
        return [['Mode', mode], ['Table X', (-pos[0]).toFixed(2)], ['Saddle Y', (-pos[1]).toFixed(2)], ['Operation', cutting ? 'pocket milling' : 'repositioning'], ['Spindle axis', 'vertical (Z)']];
      },
      legend: [['V', 'end-mill rotation'], ['f', 'table X / saddle Y feed, knee Z']],
    };
  },
};
