import * as THREE from 'three';
import { M, box, cyl, gear, at, arrow, spinArrow, textSprite } from '../kit.js';

// Handwheel (or crank) whose normal is `axis`; inner group (userData.inner) spins about its own normal.
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

export default {
  id: 'milling-horizontal',
  title: 'Horizontal (column-and-knee) milling machine',
  subtitle: 'Principal parts and movements: table X, saddle Y, knee Z',
  camera: { position: [9.5, 6.5, 11.5], target: [0, 3.4, 0.4] },
  build() {
    const root = new THREE.Group();

    // Base
    const base = new THREE.Group();
    base.add(at(box(4.2, 0.6, 4.4, M.castIron), 0, 0.3, 0.1));
    base.add(at(cyl(0.45, 0.5, M.paintDark), 0, 0.85, 1.25));
    base.add(at(box(3.8, 0.12, 4.0, M.paintDark), 0, 0.66, 0.1));
    root.add(base);

    // Column with motor + gearbox
    const column = new THREE.Group();
    column.add(at(box(3.2, 6.5, 1.8, M.paint), 0, 3.85, -1.0));
    column.add(at(box(3.4, 0.35, 2.0, M.paintLight), 0, 7.2, -1.0));
    for (const sx of [-1.1, 1.1]) column.add(at(box(0.28, 5.0, 0.12, M.darkSteel), sx, 3.4, -0.06));
    column.add(at(box(0.5, 1.9, 1.3, M.paintDark), 1.85, 5.2, -1.0)); // gearbox cover
    for (let i = 0; i < 3; i++) {
      column.add(at(cyl(0.05, 0.5, M.chrome, { axis: 'x' }), 2.3, 4.6 + i * 0.5, -1.0));
      column.add(at(cyl(0.1, 0.12, M.black, { axis: 'x' }), 2.6, 4.6 + i * 0.5, -1.0));
    }
    const motor = new THREE.Group();
    motor.add(at(cyl(0.6, 1.5, M.blue, { axis: 'x' }), 0, 2.4, -2.6));
    for (let i = 0; i < 7; i++) motor.add(at(cyl(0.66, 0.06, M.paintDark, { axis: 'x' }), -0.6 + i * 0.2, 2.4, -2.6));
    motor.add(at(box(0.6, 0.4, 0.5, M.black), 0, 3.1, -2.6));
    column.add(motor);
    column.add(at(box(2.4, 0.2, 1.0, M.paintDark), 0, 2.4, -2.25)); // motor bracket
    root.add(column);

    // Overarm + arbor support
    const overarm = new THREE.Group();
    for (const sx of [-0.65, 0.65]) overarm.add(at(cyl(0.22, 3.4, M.steel, { axis: 'z' }), sx, 6.4, 1.5));
    overarm.add(at(box(1.9, 0.12, 0.5, M.paintDark), 0, 6.75, 0.2));
    root.add(overarm);
    const support = new THREE.Group();
    support.add(at(box(1.9, 0.45, 0.45, M.paint), 0, 6.4, 2.95));
    support.add(at(box(0.5, 1.2, 0.35, M.paint), 0, 5.8, 2.95));
    support.add(at(cyl(0.38, 0.4, M.brass, { axis: 'z' }), 0, 5.0, 2.95));
    support.add(at(cyl(0.05, 0.4, M.chrome), 0.5, 6.7, 2.95));
    root.add(support);

    // Spindle
    const spindle = new THREE.Group();
    spindle.add(at(cyl(0.55, 0.7, M.darkSteel, { axis: 'z' }), 0, 5.0, 0.25));
    spindle.add(at(cyl(0.28, 0.2, M.chrome, { axis: 'z', rTop: 0.4 }), 0, 5.0, 0.7));
    root.add(spindle);

    // Arbor
    const arbor = new THREE.Group();
    arbor.add(cyl(0.16, 2.9, M.chrome, { axis: 'z' }));
    arbor.add(at(cyl(0.3, 0.35, M.steel, { axis: 'z' }), 0, 0, -1.2));
    for (const dz of [-0.75, 0.75]) arbor.add(at(cyl(0.27, 0.45, M.brass, { axis: 'z' }), 0, 0, dz));
    arbor.add(at(cyl(0.3, 0.2, M.darkSteel, { axis: 'z', seg: 6 }), 0, 0, 1.25)); // nut (left-hand thread)
    arbor.add(gear(0.95, 20, 1.2, M.hss));
    arbor.add(spinArrow(1.25, M.vColor, { axis: 'z', arc: 4.2 }));
    arbor.position.set(0, 5.0, 1.55);
    root.add(arbor);

    // Knee
    const knee = new THREE.Group();
    knee.add(at(box(3.1, 1.1, 2.4, M.paint), 0, 2.15, 1.0));
    knee.add(at(box(3.3, 0.18, 2.5, M.paintLight), 0, 1.5, 1.0));
    knee.add(at(box(0.9, 0.5, 0.1, M.paintDark), 0, 2.15, 2.25));
    const kneeCrank = handwheel(0.35, 'z', { crank: true });
    kneeCrank.position.set(1.2, 2.0, 2.2);
    knee.add(kneeCrank);
    root.add(knee);
    const screw = new THREE.Group();
    screw.add(at(cyl(0.2, 1.0, M.chrome), 0, 1.15, 1.25));
    screw.add(at(cyl(0.34, 0.25, M.paintDark), 0, 0.95, 1.25));
    root.add(screw);

    // Saddle
    const saddle = new THREE.Group();
    saddle.add(at(box(2.7, 0.4, 2.1, M.paintLight), 0, 2.9, 1.25));
    saddle.add(at(box(2.9, 0.12, 0.4, M.darkSteel), 0, 2.78, 2.35));
    const saddleWheel = handwheel(0.5, 'z');
    saddleWheel.position.set(0, 2.75, 2.6);
    saddle.add(saddleWheel);
    root.add(saddle);

    // Table (moves in X)
    const table = new THREE.Group();
    table.add(at(box(4.8, 0.4, 1.5, M.castIron), 0, 3.3, 1.55));
    table.add(at(box(4.9, 0.05, 1.55, M.darkSteel), 0, 3.5, 1.55));
    for (const dz of [-0.45, 0, 0.45]) table.add(at(box(4.8, 0.06, 0.12, M.black), 0, 3.54, 1.55 + dz));
    const tw = handwheel(0.38, 'x');
    tw.position.set(2.65, 3.3, 1.55);
    table.add(tw);
    table.add(at(cyl(0.07, 0.35, M.chrome, { axis: 'x' }), 2.5, 3.3, 1.55));
    root.add(table);

    // Vise + workpiece (rides on the table)
    const vise = new THREE.Group();
    vise.add(at(box(2.3, 0.2, 1.1, M.paintDark), 0, 3.63, 1.55));
    vise.add(at(box(0.25, 0.55, 1.1, M.darkSteel), -0.9, 3.95, 1.55));
    vise.add(at(box(0.25, 0.55, 1.1, M.darkSteel), 0.9, 3.95, 1.55));
    vise.add(at(cyl(0.06, 0.7, M.steel, { axis: 'x' }), 1.35, 3.95, 1.55));
    vise.add(at(cyl(0.04, 0.5, M.black, { axis: 'z' }), 1.7, 3.95, 1.55));
    vise.add(at(box(1.5, 0.6, 0.9, M.work), 0, 4.0, 1.55));
    vise.add(at(box(1.5, 0.02, 0.9, M.workCut), 0, 4.31, 1.55));
    table.add(vise);

    // Axis arrows
    const arrows = new THREE.Group();
    arrows.add(arrow([-1.2, 4.9, 3.6], [1, 0, 0], 2.4, M.fColor));
    arrows.add(arrow([-3.4, 3.4, 0.8], [0, 0, 1], 2.2, M.fColor));
    arrows.add(arrow([-3.4, 3.4, 0.8], [0, 1, 0], 2.2, M.fColor));
    for (const [txt, p] of [['X', [1.5, 5.3, 3.6]], ['Y', [-3.4, 3.2, 3.3]], ['Z', [-3.4, 5.9, 0.8]]]) {
      const s = textSprite(txt, { size: 0.4 });
      s.position.set(...p);
      arrows.add(s);
    }
    root.add(arrows);

    const parts = [
      { id: 'base', name: 'Base', object: base, desc: 'Heavy cast-iron foundation that carries the column and the knee elevating screw; it often also serves as the coolant reservoir.', slide: 50, qs: ['2012-13_7a'], explode: [0, -1.2, 0] },
      { id: 'column', name: 'Column (with motor and gearbox)', object: column, desc: 'Rigid casting that houses the spindle, bearings, gearbox, clutches, shafts, pumps and shifting mechanism that carry power from the electric motor to the spindle at a selected speed. Its front has vertical ways for the knee.', slide: 51, qs: ['2012-13_7a'], explode: [0, 0, -2] },
      { id: 'knee', name: 'Knee', object: knee, desc: 'Cast bracket on the front of the column that supports the saddle and table. Raised or lowered by the elevating screw and crank to give the vertical Z motion and set the depth of cut.', slide: 50, qs: ['2012-13_7a'], explode: [0, -0.6, 1.2] },
      { id: 'screw', name: 'Elevating screw', object: screw, desc: 'Vertical screw under the knee, turned by the knee crank, that raises or lowers the knee along the column ways (Z axis).', slide: 50, qs: ['2012-13_7a'], explode: [0, -1.8, 1] },
      { id: 'saddle', name: 'Saddle (cross slide)', object: saddle, desc: 'Has two slideways at 90 degrees to each other, one on top and one underneath. It slides on the knee in the Y direction (in and out) and carries the table; both motions are by lead screws and handwheels.', slide: 50, qs: ['2012-13_7a'], explode: [0, 0.5, 1.4] },
      { id: 'table', name: 'Table', object: table, desc: 'Mounted on top of the saddle and moves along the X axis (longitudinal feed). Its top has T-slots for clamping the workpiece, vise or fixtures; it is moved by a lead screw and handwheel.', slide: 50, qs: ['2012-13_7a'], explode: [0, 1.5, 1.5] },
      { id: 'vise', name: 'Vise and workpiece', object: vise, desc: 'The vise clamps the workpiece on the T-slotted table; the work is fed past the rotating cutter by the table.', slide: 50, qs: [], explode: [0, 2.5, 1.5] },
      { id: 'spindle', name: 'Spindle', object: spindle, desc: 'Horizontal power-driven shaft in the column with a tapered nose that drives the arbor and cutter. Its axis is parallel to the work table.', slide: 50, qs: ['2012-13_7a'], explode: [0, 0, 1.2] },
      { id: 'arbor', name: 'Arbor, spacers and slab cutter', object: arbor, desc: 'The arbor is an extension of the spindle for mounting cutters; spacers locate the cutter along it. Usually the threaded end of an arbor is a left-hand thread so the nut tightens as the cutter rotates.', slide: 50, qs: ['2012-13_7a'], explode: [0, 1, 2] },
      { id: 'overarm', name: 'Overarm', object: overarm, desc: 'Horizontal bars on top of the column that extend forward and carry the arbor support; they slide in or out to suit the arbor length.', slide: 50, qs: ['2012-13_7a'], explode: [0, 1.5, 0] },
      { id: 'support', name: 'Arbor support', object: support, desc: 'Bracket clamped to the overarm with a bearing that supports the free end of the arbor, preventing deflection and chatter under cutting loads.', slide: 50, qs: ['2012-13_7a'], explode: [0, 1.5, 1.5] },
    ];

    let ph = 0, xpos = 0;
    return {
      root, parts,
      update(dt) {
        ph += dt;
        xpos = 0.9 * Math.sin(ph * 0.7);
        table.position.x = xpos;
        tw.userData.inner.rotation.z = -xpos * 4;
        arbor.rotation.z = -ph * 6;
        saddleWheel.userData.inner.rotation.z = ph * 0.2;
        kneeCrank.userData.inner.rotation.z = ph * 0.2;
      },
      readout() {
        return [['Table X', xpos.toFixed(2) + ' dm'], ['Feed direction', Math.cos(ph * 0.7) >= 0 ? '+X' : '-X'], ['Spindle axis', 'horizontal (Y direction)']];
      },
      legend: [['V', 'cutter rotation'], ['f', 'table feed X / saddle Y / knee Z']],
    };
  },
};
