import * as THREE from 'three';
import { M, box, cyl, tube, at, rot, group, named, arrow, spinArrow, chips } from '../kit.js';

const ss = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const lerp = (a, b, t) => a + (b - a) * t;

// Partial open cylinder (guard), axis z. start/len are cylinder theta angles (theta 0 = bottom, x = sin).
function shell(r, h, start, len, mat) {
  const g = new THREE.CylinderGeometry(r, r, h, 48, 1, true, start, len);
  g.rotateX(Math.PI / 2);
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true;
  return m;
}

function rod(a, b, r, mat, seg = 10) {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, va.distanceTo(vb), seg), mat);
  m.position.copy(va).add(vb).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.sub(va).normalize());
  return m;
}

// Hand wheel with axis z; animate userData.spin.rotation.z.
function handwheel(r) {
  const spin = new THREE.Group();
  spin.add(cyl(r * 0.2, r * 0.35, M.steel, { axis: 'z', seg: 16 }));
  for (let i = 0; i < 3; i++) {
    const s = box(r * 2, r * 0.09, r * 0.09, M.chrome);
    s.rotation.z = (i * Math.PI) / 3;
    spin.add(s);
  }
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.08, 8, 28), M.black);
  spin.add(rim);
  const knob = cyl(r * 0.09, r * 0.4, M.black, { axis: 'z', seg: 8 });
  knob.position.set(r * 0.82, 0, r * 0.22);
  spin.add(knob);
  const g = group(spin);
  g.userData.spin = spin;
  return g;
}

const dbl = (from, dir, len, color) =>
  group(arrow(from, dir, len, color), arrow(from, [-dir[0], -dir[1], -dir[2]], len, color));

export default {
  id: 'surface-grinder',
  title: 'Horizontal-spindle surface grinder',
  subtitle: 'Reciprocating-table surface grinding: V, Vw, cross-feed w and infeed d',
  camera: { position: [7.5, 5.5, 8.5], target: [0, 2.2, 0] },
  build() {
    const root = new THREE.Group();

    // ---- dimensions (decimetres) ----
    const R = 1.0, WW = 0.5, ZW = 0.4;
    const TOP0 = 2.05, DV = 0.04, LV = 3, NS = 6, WSTEP = 0.15;
    const WL = 2.0, WD = 0.9, A = 1.3, T = 1.6, BODY0 = 0.3;
    const szArr = [];
    for (let i = 0; i < NS; i++) szArr.push(ZW - (-0.7 + (i + 1) * WSTEP));
    const ycArr = [];
    for (let k = 0; k < LV; k++) ycArr.push(TOP0 + R - (k + 1) * DV);

    // ---- base & column ----
    const base = group(
      at(box(7, 1.0, 3.8, M.paint), 0, 0.5, 0),
      at(box(7.3, 0.08, 4.1, M.paintDark), 0, 0.04, 0),
      at(box(0.15, 0.06, 3.5, M.steel), -1.6, 1.03, 0),
      at(box(0.15, 0.06, 3.5, M.steel), 1.6, 1.03, 0),
      at(box(6.4, 0.5, 0.08, M.paintDark), 0, 0.45, 1.92),
    );
    const column = group(
      at(box(1.6, 3.9, 1.0, M.paint), 0, 2.95, -1.4),
      at(box(2.2, 0.2, 1.5), 0, 1.1, -1.35),
      at(box(0.08, 3.6, 0.06, M.steel), -0.5, 2.95, -0.87),
      at(box(0.08, 3.6, 0.06, M.steel), 0.5, 2.95, -0.87),
      at(box(1.3, 0.12, 0.8, M.paintLight), 0, 4.95, -1.4),
    );

    // ---- wheel head (origin = wheel centre) ----
    const guardMat = M.paintLight.clone();
    guardMat.side = THREE.DoubleSide;
    const wheelSpin = new THREE.Group();
    wheelSpin.add(cyl(R, WW, M.abrasive, { axis: 'z', seg: 64 }));
    const mark = box(0.7, 0.05, 0.02, M.white);
    mark.position.set(0.5, 0, WW / 2 + 0.005);
    wheelSpin.add(mark);
    const mark2 = box(0.05, 0.4, 0.02, M.white);
    mark2.position.set(-0.3, 0.2, WW / 2 + 0.005);
    wheelSpin.add(mark2);
    wheelSpin.add(at(cyl(0.42, 0.06, M.steel, { axis: 'z' }), 0, 0, WW / 2 + 0.03));
    wheelSpin.add(at(cyl(0.42, 0.06, M.steel, { axis: 'z' }), 0, 0, -WW / 2 - 0.03));
    wheelSpin.add(at(cyl(0.16, 0.12, M.chrome, { axis: 'z', seg: 6 }), 0, 0, WW / 2 + 0.1));
    const wheel = at(group(wheelSpin), 0, 0, ZW);

    const guard = group(
      at(shell(R + 0.12, WW + 0.14, 0.7, Math.PI * 2 - 1.4, guardMat), 0, 0, ZW),
      at(cyl(R + 0.12, 0.04, M.paintLight, { axis: 'z', seg: 48 }), 0, 0, ZW - WW / 2 - 0.06),
    );

    const headBody = group(
      at(box(1.3, 1.1, 0.9, M.paint), 0, 0.15, -0.35),
      at(box(1.2, 1.7, 0.1, M.paintDark), 0, 0.15, -0.85),
      at(cyl(0.16, 1.6, M.steel, { axis: 'z' }), 0, 0, 0),
    );
    const motor = group(
      at(cyl(0.42, 1.1, M.paintDark, { axis: 'z' }), 0, 0.95, -0.35),
      at(cyl(0.3, 0.2, M.darkSteel, { axis: 'z' }), 0, 0.95, -1.0),
      at(box(0.7, 0.14, 0.7, M.paint), 0, 0.72, -0.35),
    );

    const nozzle = group(
      tube([[1.0, 0.9, -0.1], [1.3, 0.4, 0.5], [1.0, -0.7, 0.95], [0.4, -0.92, 0.85]], 0.04, M.steel, { seg: 32, radial: 8 }),
      at(cyl(0.07, 0.12, M.chrome, { seg: 10 }), 0.38, -0.95, 0.85),
      rod([0.38, -0.96, 0.85], [0.12, -1.0, 0.45], 0.028, M.fluid, 8),
    );

    const head = new THREE.Group();
    head.add(headBody, motor, guard, wheel, nozzle);
    head.add(at(spinArrow(1.32, M.vColor, { axis: 'z', arc: Math.PI * 0.8 }), 0, 0, ZW + WW / 2 + 0.2));
    head.add(arrow([-1.55, 0.9, 0.6], [0, -1, 0], 0.7, M.dColor));
    head.position.set(0, ycArr[0], 0);

    // ---- saddle / table / chuck / work ----
    const handwheelsGroup = new THREE.Group();
    const hwCross = at(handwheel(0.34), 0, 0.5, 1.99);
    const hwTable = at(group(handwheel(0.3)), 3.55, 0.65, 0.2);
    hwTable.rotation.y = Math.PI / 2;
    const hwInfeed = at(group(handwheel(0.32)), 0.88, 2.2, -1.4);
    hwInfeed.rotation.y = Math.PI / 2;
    handwheelsGroup.add(hwCross, hwTable, hwInfeed);

    const wpBody = box(1, 1, 1, M.work);
    const stripes = new THREE.Group();
    const stripeMeshes = [];
    for (let i = 0; i < NS; i++) {
      const s = box(WL, 0.008, WSTEP * 0.98, M.workCut);
      s.position.set(0, 0.004, -WD / 2 + (i + 0.5) * WSTEP);
      stripes.add(s);
      stripeMeshes.push(s);
    }
    const workpiece = group(wpBody, stripes);
    workpiece.position.y = 1.75;

    const chuck = group(
      at(box(3.4, 0.25, 1.3, M.darkSteel), 0, 1.625, 0),
      ...[-1.4, -0.84, -0.28, 0.28, 0.84, 1.4].map((x) => at(box(0.07, 0.01, 1.3, M.black), x, 1.755, 0)),
    );
    const table = group(
      at(box(3.8, 0.25, 1.5, M.paintLight), 0, 1.375, 0),
      chuck,
      workpiece,
      dbl([0, 1.55, 0.95], [1, 0, 0], 1.0, M.fColor),
    );
    const saddle = group(
      at(box(4.4, 0.25, 1.6, M.paintDark), 0, 1.125, 0),
      table,
      arrow([-2.5, 1.15, 0.7], [0, 0, -1], 0.9, M.fColor),
    );

    // ---- sparks ----
    const sparkMat = M.amber.clone();
    sparkMat.emissive = new THREE.Color(0xff9a10);
    sparkMat.emissiveIntensity = 1.6;
    const sparks = chips(44, sparkMat);

    root.add(base, column, head, saddle, handwheelsGroup, sparks.object);

    const parts = [
      { id: 'base', name: 'Base', object: base, slide: 110, qs: [],
        desc: 'Heavy cast-iron bed carrying the column and the cross-slide ways; its mass damps vibration, which is essential for fine finishes.',
        anchor: [-2.5, 1.0, 1.0] },
      { id: 'column', name: 'Column', object: column, slide: 110, qs: [],
        desc: 'Vertical casting that guides the wheel head. The head slides up and down on it to give the infeed d.',
        anchor: [0, 4.9, -1.4] },
      { id: 'wheel-head', name: 'Wheel head (spindle housing)', object: headBody, slide: 110, qs: [],
        desc: 'Carries the horizontal spindle and wheel. It is lowered a small amount d (infeed) after each full pass of the table.',
        explode: [0, 0.8, 0], anchor: [0, 0.8, -0.4] },
      { id: 'motor', name: 'Wheel motor', object: motor, slide: 110, qs: [],
        desc: 'Drives the spindle at high speed so that the wheel periphery reaches a cutting velocity V = πDN, typically 25-35 m/s.',
        explode: [0, 1.5, -0.6] },
      { id: 'wheel-guard', name: 'Wheel guard', object: guard, slide: 110, qs: [],
        desc: 'Safety hood covering the wheel except at the cutting zone, so fragments are retained if the wheel bursts.',
        explode: [0, 1.0, 0.4], anchor: [0, 1.25, ZW] },
      { id: 'grinding-wheel', name: 'Grinding wheel', object: wheel, slide: 111, qs: ['2017-18_7c'],
        desc: 'Abrasive wheel of diameter D rotating at N rpm; thousands of tiny grains act as cutting edges. Cutting velocity V = πDN.',
        explode: [0, 0, 1.4] },
      { id: 'saddle', name: 'Saddle (cross-slide)', object: saddle, slide: 111, qs: ['2017-18_7c'],
        desc: 'Moves the table across the wheel face by the cross-feed w at each table reversal; w is also the width of cut, so CSA = w·d.',
        explode: [0, -0.3, 0], anchor: [-2.2, 1.25, 0.6] },
      { id: 'table', name: 'Reciprocating table', object: table, slide: 111, qs: ['2017-18_7c', '2023-24_8b'],
        desc: 'Carries the work past the wheel at the work speed Vw (feed) and reverses at each end of the stroke. The wheel overruns by the approach A = √(d(D−d)) ≈ D/2.',
        explode: [0, 0.5, 0], anchor: [1.7, 1.5, 0.8] },
      { id: 'magnetic-chuck', name: 'Magnetic chuck', object: chuck, slide: 110, qs: [],
        desc: 'Holds ferrous work by magnetic pull. Grinding needs very little pressure, so a magnetic chuck can hold even light work.',
        explode: [0, 1.0, 0] },
      { id: 'workpiece', name: 'Workpiece', object: workpiece, slide: 111, qs: ['2017-18_7c'],
        desc: 'Flat steel plate. Each pass leaves a ground stripe of width w; material removal rate MRR = Vw·w·d.',
        explode: [0, 2.0, 0] },
      { id: 'handwheels', name: 'Handwheels', object: handwheelsGroup, slide: 110, qs: [],
        desc: 'Manual controls for table traverse, cross-feed and wheel-head infeed (these turn with the motion in the animation).',
        anchor: [0, 0.9, 2.0] },
      { id: 'coolant-nozzle', name: 'Coolant nozzle', object: nozzle, slide: 110, qs: [],
        desc: 'Directs grinding fluid at the wheel-work contact to carry away heat and swarf and to keep the wheel from loading.',
        explode: [0.6, 0.4, 0.4] },
    ];

    // ---- animation state ----
    let n = 0;
    let su = 0.2;
    let spin = 0;
    let spawn = 0;
    const P = [0, 0, 0];
    const V = [0, 0, 0];
    let cur = { i: 0, lev: 0, u: 0 };
    let tableX = 0;

    function apply() {
      const i = n % NS;
      const lev = Math.floor(n / NS);
      const dir = n % 2 === 0 ? 1 : -1;
      const u = su;
      const b = ss(u / 0.15);
      tableX = -A * dir * Math.cos(Math.PI * u);
      table.position.x = tableX;
      const prevI = (i + NS - 1) % NS;
      saddle.position.z = lerp(szArr[prevI], szArr[i], b);
      let y = ycArr[lev];
      let h = BODY0 - (lev + 1) * DV;
      if (i === 0) {
        const pl = lev === 0 ? LV - 1 : lev - 1;
        y = lerp(ycArr[pl], ycArr[lev], b);
        if (lev > 0) h = lerp(BODY0 - (pl + 1) * DV, h, b);
      }
      head.position.y = y;
      wpBody.scale.set(WL, h, WD);
      wpBody.position.y = h / 2;
      stripes.position.y = h;
      for (let s = 0; s < NS; s++) stripeMeshes[s].visible = s < i || (s === i && u > 0.5);
      cur.i = i;
      cur.lev = lev;
      cur.u = u;
      // handwheels turn with the motions
      hwCross.userData.spin.rotation.z = saddle.position.z * 9;
      hwTable.children[0].userData.spin.rotation.z = tableX * 3;
      hwInfeed.children[0].userData.spin.rotation.z = y * 12;
    }

    function reset() {
      n = 0;
      su = 0.2;
      spin = 0;
      spawn = 0;
      sparks.reset();
      apply();
    }
    reset();

    return {
      root,
      parts,
      update(dt) {
        spin += dt * 16;
        wheelSpin.rotation.z = spin;
        su += dt / T;
        if (su >= 1) {
          su -= 1;
          n++;
          if (n >= NS * LV) n = 0;
        }
        apply();
        // sparks at the contact zone while the wheel is over the work
        if (Math.abs(tableX) < WL / 2 + 0.05 && su > 0.15) {
          spawn += dt * 55;
          while (spawn >= 1) {
            spawn -= 1;
            P[0] = (Math.random() - 0.5) * 0.12;
            P[1] = head.position.y - R + 0.02;
            P[2] = ZW + (Math.random() - 0.5) * WW;
            V[0] = 2.0 + Math.random() * 1.6;
            V[1] = 0.5 + Math.random() * 0.8;
            V[2] = 0;
            sparks.emit(P, V);
          }
        }
        sparks.update(dt);
      },
      readout() {
        const vw = 6 * Math.abs(Math.sin(Math.PI * cur.u));
        return [
          ['V = πDN (Ø200, 2400 rpm)', '25.1 m/s'],
          ['Vw (table, mid-stroke 6)', `${vw.toFixed(1)} m/min`],
          ['w (cross-feed / reversal)', '3.5 mm'],
          ['d (infeed / pass)', '0.05 mm'],
          ['MRR = Vw·w·d', '1050 mm³/min'],
          ['A = √(d(D−d))', '3.16 mm'],
          ['Stroke / level', `${cur.i + 1}/${NS} · pass ${cur.lev + 1}/${LV}`],
        ];
      },
      legend: [['V', 'wheel cutting speed'], ['Vw / w', 'table speed, cross-feed'], ['d', 'infeed (exaggerated)']],
    };
  },
};
