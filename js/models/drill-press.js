// Pillar (upright) drill press: slides 161-162, 165 (work holding).
import * as THREE from 'three';
import { M, box, cyl, tube, at, rot, group, arrow, spinArrow, named } from '../kit.js';
import { buildTwistDrill, chipSystem } from './twist-drill.js';

const smooth = (x) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c); };

export default {
  id: 'drill-press',
  title: 'Pillar drill press',
  subtitle: 'Upright drill press: base, column, table, power head, spindle quill and work holding',
  camera: { position: [12, 8.5, 15], target: [0.3, 6.1, 0] },
  build() {
    const root = new THREE.Group();
    const CZ = -1.3; // column z
    const SZ = 0.6; // spindle z
    const TABLE_TOP = 3.5;
    const WORK_TOP = 4.8;
    const STROKE = 1.25;
    const REST_TIP = 5.3;

    // ---- base
    const baseG = new THREE.Group();
    baseG.add(at(box(3.6, 0.45, 4.2, M.castIron), 0, 0.225, 0.1));
    baseG.add(at(cyl(0.58, 0.25, M.castIron, { seg: 32 }), 0, 0.575, CZ));
    for (const x of [-0.5, 0.5, 1.2, -1.2]) baseG.add(at(box(0.08, 0.02, 2.4, M.black), x, 0.455, 0.55));
    for (const [x, z] of [[-1.4, -1.8], [1.4, -1.8], [-1.4, 1.95], [1.4, 1.95]]) baseG.add(at(cyl(0.12, 0.03, M.black, { seg: 12 }), x, 0.46, z));
    root.add(baseG);

    // ---- column
    const columnG = new THREE.Group();
    columnG.add(at(cyl(0.26, 9.75, M.chrome, { seg: 28 }), 0, 5.325, CZ));
    root.add(columnG);

    // ---- table (arm, round table, collar) + lift crank + lock
    const tableG = new THREE.Group();
    tableG.add(at(cyl(0.42, 0.9, M.paint, { seg: 28 }), 0, 3.3, CZ));
    tableG.add(at(box(0.8, 0.3, 2.2, M.paint), 0, 3.25, -0.2));
    tableG.add(at(cyl(1.35, 0.18, M.castIron, { seg: 48 }), 0, 3.41, SZ));
    for (const a of [0, Math.PI / 3, -Math.PI / 3]) {
      const slot = box(0.09, 0.02, 2.5, M.black);
      slot.position.set(0, 3.505, SZ);
      slot.rotation.y = a;
      tableG.add(slot);
    }
    root.add(tableG);

    const crankG = new THREE.Group();
    crankG.add(at(box(0.5, 0.5, 0.5, M.paintDark), 0.62, 2.95, CZ));
    crankG.add(at(cyl(0.1, 0.5, M.steel, { axis: 'x', seg: 16 }), 1.0, 2.95, CZ));
    const crankArm = new THREE.Group();
    crankArm.position.set(1.28, 2.95, CZ);
    crankArm.add(at(box(0.08, 0.8, 0.12, M.steel), 0, -0.3, 0));
    crankArm.add(at(cyl(0.07, 0.4, M.black, { axis: 'x', seg: 12 }), 0.15, -0.7, 0));
    crankG.add(crankArm);
    root.add(crankG);

    const lockG = new THREE.Group();
    const lockArm = tube([[-0.42, 3.55, CZ], [-0.8, 3.8, CZ - 0.1], [-1.1, 3.9, CZ - 0.3]], 0.04, M.steel, { seg: 10, radial: 8 });
    lockG.add(lockArm);
    lockG.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), M.red), -1.1, 3.9, CZ - 0.3));
    root.add(lockG);

    // ---- power head (casting, cap, speed dial) + motor + belt guard with step pulleys
    const headG = new THREE.Group();
    headG.add(at(box(1.9, 1.6, 2.55, M.paint), 0, 9.1, -0.425));
    headG.add(at(box(2.0, 0.1, 2.65, M.paintDark), 0, 9.95, -0.425));
    headG.add(at(box(2.0, 0.1, 2.65, M.paintDark), 0, 8.25, -0.425));
    const dial = cyl(0.25, 0.1, M.black, { axis: 'z', seg: 24 });
    dial.position.set(0.5, 9.4, 0.9);
    headG.add(dial);
    headG.add(at(cyl(0.2, 0.04, M.chrome, { axis: 'z', seg: 24 }), 0.5, 9.4, 0.96));
    headG.add(at(box(0.02, 0.14, 0.03, M.red), 0.5, 9.5, 0.99));
    headG.add(at(box(0.9, 0.35, 0.04, M.paintLight), -0.35, 8.8, 0.89));
    root.add(headG);

    const motorG = new THREE.Group();
    motorG.add(at(cyl(0.58, 1.3, M.paintDark, { seg: 36 }), 0, 11.3, -1.0));
    for (let i = 0; i < 6; i++) motorG.add(at(cyl(0.62, 0.05, M.paintDark, { seg: 36 }), 0, 10.85 + i * 0.2, -1.0));
    motorG.add(at(cyl(0.45, 0.2, M.castIron, { seg: 28 }), 0, 12.05, -1.0));
    motorG.add(at(box(0.5, 0.35, 0.4, M.black), 0.72, 11.2, -1.0));
    root.add(motorG);

    const guardG = new THREE.Group();
    const glassBox = box(1.8, 0.7, 2.55, M.glass);
    glassBox.position.set(0, 10.3, -0.425);
    glassBox.castShadow = false;
    guardG.add(glassBox);
    for (const x of [-0.89, 0.89]) for (const z of [-1.68, 0.83]) guardG.add(at(box(0.05, 0.7, 0.05, M.paintDark), x, 10.3, z));
    guardG.add(at(box(1.9, 0.05, 2.65, M.paintDark), 0, 10.66, -0.425));
    guardG.add(at(cyl(0.05, 0.12, M.chrome, { seg: 10 }), 0.0, 10.74, 1.0 - 0.3)); // latch knob
    // step pulleys (opposed), flat belt on the middle step
    const pulley = (x, z, flip) => {
      const g = new THREE.Group();
      const radii = flip ? [0.26, 0.38, 0.5] : [0.5, 0.38, 0.26];
      radii.forEach((r, i) => g.add(at(cyl(r, 0.2, M.steel, { seg: 28 }), 0, 10.55 - 0.22 - i * 0.2 + 0.0 + 0.0, 0)));
      g.position.set(x, 0.0, z);
      return g;
    };
    const sp = pulley(0, SZ - 0.0, false);
    const mp = pulley(0, -1.0, true);
    guardG.add(sp, mp);
    const beltMat = M.rubber;
    guardG.add(at(box(0.04, 0.14, 1.6, beltMat), 0.38, 10.35, (SZ - 1.0) / 2));
    guardG.add(at(box(0.04, 0.14, 1.6, beltMat), -0.38, 10.35, (SZ - 1.0) / 2));
    for (const z of [SZ, -1.0]) {
      const wrapM = cyl(0.4, 0.14, beltMat, { seg: 24 });
      wrapM.position.set(0, 10.35, z);
      guardG.add(wrapM);
    }
    root.add(guardG);

    // ---- moving assembly (quill feed)
    const quillG = new THREE.Group(); // translates down with the feed
    root.add(quillG);
    const sqG = new THREE.Group(); // spindle + quill (non spinning sleeve)
    sqG.add(at(cyl(0.28, 1.7, M.chrome, { seg: 32 }), 0, 8.85, SZ));
    sqG.add(at(cyl(0.3, 0.06, M.darkSteel, { seg: 32 }), 0, 8.02, SZ));
    quillG.add(sqG);

    const spinG = new THREE.Group(); // rotating spindle, chuck, drill
    spinG.position.set(0, 0, SZ);
    quillG.add(spinG);
    const spindleNose = cyl(0.17, 0.28, M.darkSteel, { seg: 24 });
    spindleNose.position.set(0, 7.9, 0);
    spinG.add(spindleNose);
    // flat on spindle to show rotation
    spinG.add(at(box(0.04, 0.2, 0.06, M.brass), 0.17, 7.92, 0));

    const chuckG = new THREE.Group();
    chuckG.add(at(cyl(0.38, 0.45, M.darkSteel, { rTop: 0.28, seg: 32 }), 0, 7.52, 0));
    chuckG.add(at(cyl(0.4, 0.3, M.steel, { rTop: 0.42, seg: 32 }), 0, 7.15, 0));
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const r = box(0.03, 0.3, 0.05, M.black);
      r.position.set(Math.cos(a) * 0.41, 7.15, Math.sin(a) * 0.41);
      r.rotation.y = -a;
      chuckG.add(r);
    }
    chuckG.add(at(cyl(0.2, 0.08, M.steel, { rTop: 0.14, seg: 20 }), 0, 6.97, 0));
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.4;
      const hole = cyl(0.025, 0.04, M.black, { axis: 'y', seg: 8 });
      hole.position.set(Math.cos(a) * 0.3, 7.37, Math.sin(a) * 0.3);
      chuckG.add(hole);
    }
    spinG.add(chuckG);

    const drill = buildTwistDrill({ R: 0.12, bodyLen: 1.5, neck: 0.1, shankLen: 0.6, shank: 'straight', helix: 30, slices: 90, overlays: false });
    const drillG = drill.root;
    drillG.position.set(0, REST_TIP, 0);
    spinG.add(drillG);

    // arrows
    const arrows = new THREE.Group();
    const vArrow = spinArrow(0.62, M.vColor, { axis: 'y', arc: Math.PI * 1.45 });
    vArrow.position.set(0, 6.45, SZ);
    const fArrow = arrow([-0.95, 7.9, SZ], [0, -1, 0], 1.0, M.fColor);
    arrows.add(vArrow, fArrow);
    quillG.add(arrows);

    // ---- feed handle: 3-spoke capstan on a pinion shaft
    const handleG = new THREE.Group();
    handleG.add(at(cyl(0.12, 0.6, M.darkSteel, { axis: 'x', seg: 16 }), 1.2, 8.9, SZ));
    handleG.add(at(cyl(0.3, 0.28, M.paintDark, { axis: 'x', seg: 24 }), 1.45, 8.9, SZ));
    const capstan = new THREE.Group();
    capstan.position.set(1.7, 8.9, SZ);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const spoke = new THREE.Group();
      spoke.rotation.x = a;
      const rod = cyl(0.055, 1.6, M.steel, { seg: 10 });
      rod.position.y = 0.8;
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), M.black);
      ball.position.y = 1.65;
      ball.castShadow = true;
      spoke.add(rod, ball);
      capstan.add(spoke);
    }
    capstan.add(at(cyl(0.2, 0.2, M.chrome, { axis: 'x', seg: 20 }), 0, 0, 0));
    handleG.add(capstan);
    root.add(handleG);

    // ---- depth stop: fixed ear on the head, rod + collar on the quill, adjustable nuts
    const stopG = new THREE.Group();
    stopG.add(at(box(0.5, 0.14, 0.4, M.paintDark), 1.1, 8.18, SZ)); // fixed ear
    stopG.add(at(box(0.3, 0.1, 0.3, M.paintDark), 0.95, 8.28, SZ));
    const stopMove = new THREE.Group(); // moves with the quill
    stopMove.add(at(box(0.95, 0.12, 0.3, M.paintDark), 0.78, 7.95, SZ));
    stopMove.add(at(cyl(0.045, 1.9, M.chrome, { seg: 12 }), 1.15, 8.85, SZ));
    const nut = at(cyl(0.11, 0.14, M.brass, { seg: 6 }), 1.15, 8.27 + STROKE + 0.07, SZ);
    const nut2 = at(cyl(0.11, 0.14, M.brass, { seg: 6 }), 1.15, 8.27 + STROKE + 0.21, SZ);
    stopMove.add(nut, nut2);
    // scale on head
    for (let i = 0; i < 9; i++) stopG.add(at(box(0.12, 0.012, 0.012, M.black), 1.0, 8.3 + i * 0.14, SZ + 0.2));
    stopG.add(stopMove);
    quillG.add(stopG);
    root.add(stopG);

    // ---- vise + workpiece
    const viseG = new THREE.Group();
    viseG.add(at(box(3.0, 0.3, 1.4, M.paintDark), 0.2, TABLE_TOP + 0.15, SZ));
    viseG.add(at(box(0.3, 0.7, 1.4, M.paint), -0.78, TABLE_TOP + 0.65, SZ)); // fixed jaw
    viseG.add(at(box(0.3, 0.7, 1.4, M.paint), 0.78, TABLE_TOP + 0.65, SZ)); // movable jaw
    viseG.add(at(box(0.5, 0.55, 0.8, M.paintDark), 1.5, TABLE_TOP + 0.575, SZ));
    const screwBar = cyl(0.08, 1.6, M.steel, { axis: 'x', seg: 12 });
    screwBar.position.set(1.4, TABLE_TOP + 0.55, SZ);
    viseG.add(screwBar);
    viseG.add(at(cyl(0.05, 1.0, M.chrome, { axis: 'z', seg: 10 }), 2.2, TABLE_TOP + 0.55, SZ));
    viseG.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), M.black), 2.2, TABLE_TOP + 0.55, SZ + 0.5));
    viseG.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), M.black), 2.2, TABLE_TOP + 0.55, SZ - 0.5));
    const work = at(box(1.26, WORK_TOP - TABLE_TOP - 0.3, 1.2, M.work), 0, (TABLE_TOP + 0.3 + WORK_TOP) / 2, SZ);
    viseG.add(work);
    const hole = cyl(0.13, 0.01, M.black, { seg: 20 });
    hole.position.set(0, WORK_TOP + 0.006, SZ);
    hole.visible = false;
    viseG.add(hole);
    root.add(viseG);

    const chipsys = chipSystem(80, M.workCut, 1.2, 1.4);
    root.add(chipsys.object);

    // ---- animation
    const PERIOD = 9;
    let travel = 0;
    let acc = 0;
    let spinA = 0;
    let phase = 'idle';
    let cutAng = 0;
    const apply = (tt) => {
      const u = ((tt % PERIOD) + PERIOD) % PERIOD;
      let p;
      if (u < 1) { p = 0; phase = 'idle (spindle running)'; }
      else if (u < 4) { p = smooth((u - 1) / 3); phase = 'feeding (drilling)'; }
      else if (u < 4.7) { p = 1; phase = 'dwell at depth'; }
      else if (u < 7) { p = 1 - smooth((u - 4.7) / 2.3); phase = 'retracting'; }
      else { p = 0; phase = 'idle (spindle running)'; }
      travel = p * STROKE;
      quillG.position.y = -travel;
      capstan.rotation.x = travel / 0.5;
      return u;
    };
    apply(0);

    return {
      root,
      parts: [
        { id: 'base', name: 'Base', object: baseG, desc: 'Heavy cast-iron base that supports the column and the whole machine. Its top is T-slotted so tall work can be clamped directly on it when the table is swung out of the way.', slide: 161, qs: [], anchor: [0, 0.5, 1.9] },
        { id: 'column', name: 'Column', object: columnG, desc: 'Ground vertical pillar that rises from the base. It carries the table, which slides and swivels on it, and supports the power head at the top.', slide: 161, qs: [], anchor: [0, 6.3, CZ] },
        { id: 'table', name: 'Table', object: tableG, desc: 'Work table carried on a collar and arm on the column. Its height is adjusted with the table lift crank and locked with the table lock; it can be swivelled aside for tall work. Work is clamped to it with a vise or hold-down clamps.', slide: 161, qs: [], anchor: [0.9, 3.55, 1.4] },
        { id: 'table-crank', name: 'Table lift crank', object: crankG, desc: 'Hand crank with a rack-and-pinion drive on the column that raises and lowers the table to suit the height of the work.', slide: 161, qs: [], anchor: [1.45, 2.5, CZ] },
        { id: 'table-lock', name: 'Table lock', object: lockG, desc: 'Clamping lever that locks the table collar to the column once the height has been set.', slide: 161, qs: [], anchor: [-1.1, 3.95, CZ - 0.3] },
        { id: 'power-head', name: 'Power head', object: headG, desc: 'Casting at the top of the column containing the spindle drive and quill mechanism. It carries the motor, the belt guard and the variable speed control dial.', slide: 161, qs: [], anchor: [0, 9.1, 1.0], explode: [0, 0.8, 0] },
        { id: 'motor', name: 'Motor', object: motorG, desc: 'Electric motor mounted on the power head. It turns the spindle through the belt and step pulleys at a speed set by the speed control.', slide: 161, qs: [], anchor: [0, 12.0, -1.0], explode: [0, 1.8, 0] },
        { id: 'belt-guard', name: 'Belt guard & step pulleys', object: guardG, desc: 'Guard over the V-belt and the opposed step (cone) pulleys. Moving the belt to a different pair of steps changes the spindle speed N, which together with the drill diameter sets the cutting speed V = πDN.', slide: 161, qs: [], anchor: [-0.9, 10.35, 0.3], explode: [0, 1.2, 0] },
        { id: 'spindle-quill', name: 'Spindle and quill', object: sqG, desc: 'The spindle rotates inside a non-rotating sleeve called the quill. Pulling the feed handle slides the quill down (rack and pinion), advancing the rotating drill into the work; a return spring lifts it again.', slide: 161, qs: [], anchor: [-0.3, 8.3, SZ] },
        { id: 'feed-handle', name: 'Feed handle (capstan)', object: handleG, desc: 'Three-spoke capstan handle on a pinion shaft that meshes with a rack on the quill; the operator turns it to feed the drill down and to retract it.', slide: 162, qs: [], anchor: [1.7, 8.9, SZ + 1.4] },
        { id: 'drill-chuck', name: 'Drill chuck', object: chuckG, desc: 'Three-jaw chuck fitted on the spindle taper that holds straight-shank cutting tools: drill bits, centre drills, reamers. It is tightened with a chuck key.', slide: 161, qs: ['2016-17_7c'], anchor: [0.5, 7.2, SZ] },
        { id: 'twist-drill', name: 'Twist drill', object: drillG, desc: 'The cutting tool. Its two lips cut the chips, the helical flutes screw them out of the hole, and the margins guide it. The cutting speed is zero at the centre and a maximum V = πDN at the drill corner.', slide: 162, qs: ['2014-15_6b'], anchor: [0.3, 5.7, SZ] },
        { id: 'vise', name: 'Vise with workpiece', object: viseG, desc: 'Work is held on a drill press in a vise, fixture or jig. A vise is a general-purpose holder with two jaws that grasp the work. A fixture is custom-made for one workpart for accuracy and speed but does not guide the tool; a jig is also specially made but additionally guides the tool (a drill jig uses drill bushings) during drilling.', slide: 165, qs: [], anchor: [1.0, 4.9, SZ + 0.9] },
        { id: 'depth-stop', name: 'Depth stop', object: stopG, desc: 'Threaded rod carried by the quill with adjustable nuts. When the lower nut meets the fixed ear on the head the quill cannot go any further, so holes can be drilled repeatedly to the same depth.', slide: 162, qs: [], anchor: [1.15, 9.4, SZ] },
      ],
      legend: [['V', 'drill rotation (cutting motion)'], ['f', 'quill feed, along the axis']],
      update(dt, t) {
        const u = apply(t);
        spinA -= dt * 14;
        spinG.rotation.y = spinA;
        if (u < 0.2) hole.visible = false;
        if (travel > STROKE * 0.4) hole.visible = true;
        const cutting = u >= 1 && u < 4.7 && travel > STROKE * 0.42;
        if (cutting) {
          acc += dt * 45;
          while (acc >= 1) {
            acc -= 1;
            cutAng += 1.1;
            chipsys.emit([Math.cos(cutAng) * 0.1, WORK_TOP + 0.03, SZ + Math.sin(cutAng) * 0.1], [Math.cos(cutAng + 1.4) * 0.9, 1.6, Math.sin(cutAng + 1.4) * 0.9], 0.3);
          }
        }
        chipsys.update(dt);
      },
      readout() {
        const tip = REST_TIP - travel;
        const depth = Math.max(0, WORK_TOP - tip);
        return [
          ['State', phase],
          ['Quill travel', (travel * 10).toFixed(0) + ' mm'],
          ['Hole depth', (depth * 10).toFixed(0) + ' mm'],
        ];
      },
    };
  },
};
