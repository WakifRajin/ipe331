import * as THREE from 'three';
import { M, box, cyl, extrude, at, arrow, spinArrow, textSprite, chips } from '../kit.js';

// Geometry of the cut (side view, feed to the right, uncut material on the left of the cutter)
const R = 2.0;              // cutter radius
const D = 0.5;              // depth of cut
const CY = 3.6;             // cutter axis height
const TABLE_TOP = 1.2;
const BOTTOM = CY - R;      // machined surface
const TOP = BOTTOM + D;     // original (uncut) surface
const PHI = Math.acos((R - D) / R);  // contact angle
const X0 = R * Math.sin(PHI);
const TEETH = 10;
const STEP = (Math.PI * 2) / TEETH;
const FZ = 0.5;             // feed per tooth (exaggerated)
const OMEGA = 1.6;          // cutter angular speed, rad/s
const FEED = 0.36;          // table speed, dm/s
const STROKE = 3.6;
const WORK_LEN = 6;
const WORK_W = 2.6;
const T_FEED = STROKE / FEED, T_DROP = 0.5, T_RET = 1.5, T_UP = 0.5;
const CYCLE = T_FEED + T_DROP + T_RET + T_UP;
const DROP = 0.9;
const AMBER = 0xe9a321;
const K = 16;               // chip ribbon samples

// Slab cutter: sawtooth profile, d = +1 for counter-clockwise rotation (leading face at larger angle), -1 for clockwise
function slabCutter(d) {
  const g = new THREE.Group();
  const rRoot = R - 0.28;
  const pts = [];
  for (let i = 0; i < TEETH; i++) {
    const a = (u) => d * (i + u) * STEP;
    const prof = [[rRoot, 0], [rRoot + 0.08, 0.3], [R - 0.08, 0.6], [R, 0.74], [rRoot, 0.78], [rRoot, 0.97]];
    for (const [r, u] of prof) pts.push([Math.cos(a(u)) * r, Math.sin(a(u)) * r]);
  }
  g.add(extrude(pts, 2.0, M.hss));
  g.add(cyl(R - 0.5, 1.9, M.darkSteel, { axis: 'z' }));
  g.add(cyl(0.45, 2.1, M.steel, { axis: 'z' }));
  return g;
}

export default {
  id: 'up-down-milling',
  title: 'Up milling vs down milling',
  subtitle: 'Cutter rotation versus feed direction: chip shape, cutting force and backlash',
  camera: { position: [2.5, 4.6, 12.5], target: [0, 3.0, 0] },
  build() {
    const root = new THREE.Group();

    // ----- Machine context (decorative) -----
    const frame = new THREE.Group();
    frame.add(at(box(6, 6.4, 1.2, M.paint), 0, 3.2, -2.2));
    frame.add(at(cyl(0.25, 5.4, M.steel, { axis: 'z' }), 0, 5.6, 0.4));
    frame.add(at(cyl(0.6, 0.4, M.darkSteel, { axis: 'z' }), 0, CY, -1.5));
    frame.add(at(box(0.6, 1.6, 0.4, M.paint), 0, 4.8, 2.6));
    frame.add(at(cyl(0.55, 0.4, M.brass, { axis: 'z' }), 0, CY, 2.6));
    frame.add(at(box(3.6, 0.35, 3.2, M.paintDark), 0, 0.175, 0.2));
    root.add(frame);

    // ----- Cutters (one per rotation sense) + arbor -----
    const cutter = new THREE.Group();
    const cutterUp = slabCutter(-1);   // clockwise
    const cutterDown = slabCutter(1);  // counter-clockwise
    cutter.add(cutterUp, cutterDown);
    cutter.add(cyl(0.2, 4.5, M.chrome, { axis: 'z' }).translateZ(0.65));
    for (const z of [-1.25, 1.25]) cutter.add(at(cyl(0.5, 0.5, M.brass, { axis: 'z' }), 0, 0, z));
    cutter.position.set(0, CY, 0);
    root.add(cutter);
    // Static (non-spinning) markers
    const spinUp = spinArrow(R + 0.4, M.vColor, { axis: 'z', arc: Math.PI * 1.2 });
    spinUp.rotation.y = Math.PI; // clockwise seen from the front
    const spinDown = spinArrow(R + 0.4, M.vColor, { axis: 'z', arc: Math.PI * 1.2 });
    const rotMarks = new THREE.Group();
    rotMarks.add(spinUp, spinDown);
    rotMarks.position.set(0, CY, 1.3);
    root.add(rotMarks);

    // ----- Table, lead screw, workpiece -----
    const lower = new THREE.Group();   // everything that drops for the return stroke
    root.add(lower);

    const table = new THREE.Group();
    table.add(at(box(10, 0.5, 3.0, M.castIron), 0, TABLE_TOP - 0.25, 0));
    table.add(at(box(10.05, 0.04, 3.05, M.darkSteel), 0, TABLE_TOP - 0.02, 0));
    for (let i = -3; i <= 3; i++) table.add(at(box(0.12, 0.3, 0.06, M.black), i * 1.4, TABLE_TOP - 0.28, 1.5));
    for (const dz of [-0.7, 0.7]) table.add(at(box(10, 0.04, 0.14, M.black), 0, TABLE_TOP + 0.0, dz));
    // Lead screw nut rides under the table
    table.add(at(box(0.9, 0.3, 0.5, M.brass), -1.0, 0.55, 0));
    lower.add(table);
    const screwG = new THREE.Group();
    screwG.add(at(cyl(0.1, 13, M.chrome, { axis: 'x' }), 0, 0.55, 0));
    for (let i = -12; i <= 12; i++) screwG.add(at(cyl(0.13, 0.04, M.darkSteel, { axis: 'x' }), i * 0.5, 0.55, 0));
    lower.add(screwG);

    const work = new THREE.Group();
    const uncut = box(1, 1, WORK_W, M.work);
    const mach = box(1, 1, WORK_W, M.workCut);
    const arcPts = [];
    for (let i = 0; i <= 14; i++) {
      const th = PHI * (1 - i / 14);
      arcPts.push([-R * Math.sin(th), CY - R * Math.cos(th)]);
    }
    arcPts.push([0, TABLE_TOP], [-X0, TABLE_TOP]);
    const filler = extrude(arcPts, WORK_W, M.workCut);
    work.add(uncut, mach, filler);
    lower.add(work);

    // ----- Chip wedge (dynamic ribbon) -----
    const chipGeo = new THREE.BufferGeometry();
    const cpos = new Float32Array(4 * (K + 1) * 3);
    chipGeo.setAttribute('position', new THREE.BufferAttribute(cpos, 3));
    const idx = [];
    for (let j = 0; j < K; j++) {
      const a = j, b = j + 1;
      const row = (r, i) => r * (K + 1) + i;
      // rows: 0 front-inner, 1 front-outer, 2 back-inner, 3 back-outer
      for (const [r0, r1] of [[0, 1], [2, 3], [0, 2], [1, 3]]) {
        idx.push(row(r0, a), row(r1, a), row(r1, b), row(r0, a), row(r1, b), row(r0, b));
      }
    }
    chipGeo.setIndex(idx);
    const chipMat = M.amber.clone();
    chipMat.side = THREE.DoubleSide;
    chipMat.flatShading = true;
    const chipMesh = new THREE.Mesh(chipGeo, chipMat);
    chipMesh.frustumCulled = false;
    const chipG = new THREE.Group();
    chipG.add(chipMesh);
    chipG.position.set(0, CY, 0);
    root.add(chipG);

    // ----- Arrows and labels -----
    const feedArrow = arrow([-4.2, 0.9, 1.7], [1, 0, 0], 2.6, M.fColor);
    root.add(feedArrow);
    const feedTag = textSprite('f  feed', { size: 0.35 });
    feedTag.position.set(-2.9, 0.45, 1.7);
    root.add(feedTag);

    const forceUp = arrow([-1.0, TOP + 0.02, 1.35], [0, 1, 0], 1.6, AMBER);
    const forceDown = arrow([-1.0, TOP + 1.62, 1.35], [0, -1, 0], 1.6, AMBER);
    const forceUpTag = textSprite('F  lifts the work', { size: 0.33 });
    forceUpTag.position.set(-1.0, TOP + 2.0, 1.35);
    const forceDownTag = textSprite('F  presses work down', { size: 0.33 });
    forceDownTag.position.set(-1.0, TOP + 2.0, 1.35);
    const lblL = textSprite('exit: t = max', { size: 0.3 });
    const lblR = textSprite('entry: t = 0', { size: 0.3 });
    lblL.position.set(-2.9, 2.5, 1.4);
    lblR.position.set(1.7, 1.75, 1.4);
    for (const o of [forceUp, forceDown, forceUpTag, forceDownTag]) root.add(o);
    const forceUpG = new THREE.Group();
    forceUpG.add(forceUp, forceUpTag);
    const forceDownG = new THREE.Group();
    forceDownG.add(forceDown, forceDownTag);
    root.add(forceUpG, forceDownG, lblL, lblR);

    const cs = chips(50, M.workCut);
    root.add(cs.object);

    // ----- Parts -----
    const parts = [
      { id: 'cutter', name: 'Slab cutter and arbor', object: cutter, desc: 'Plain slab milling cutter with about ten straight teeth, keyed on an arbor and held between spacers. The sense of rotation relative to the table feed decides whether the cut is up (conventional) or down (climb) milling.', slide: 56, qs: ['2023-24_6a', '2022-23_7a', '2021-22_2d', '2020-21_3b', '2014-15_6d', '2010-11_6b'], explode: [0, 1.5, 0] },
      { id: 'workpiece', name: 'Workpiece', object: work, desc: 'Work block clamped on the table and fed past the cutter. Its top surface is machined to depth d; the dark-to-bright step shows the cut surface being generated.', slide: 56, qs: ['2021-22_2d', '2020-21_3b'], explode: [0, 1.5, 0] },
      { id: 'table', name: 'Table', object: table, desc: 'Moves the work by the lead screw and nut. In up milling the cutting force opposes the feed so the nut stays loaded against one flank; in down milling the force pulls the table forward into the cutter.', slide: 57, qs: ['2023-24_6a'], explode: [0, 0, 1.5] },
      { id: 'leadscrew', name: 'Lead screw and nut', object: screwG, desc: 'The lead screw and nut have play (backlash). Down milling needs a backlash eliminator, especially on older machines, because the cutter tends to pull the table forward; up milling does not need one.', slide: 58, qs: ['2010-11_6b', '2023-24_6a'], explode: [0, -1, 1.5] },
      { id: 'chip', name: 'Chip being formed', object: chipG, desc: 'The comma-shaped chip removed by one tooth. Up milling: thickness starts at zero and increases gradually to maximum at exit. Down milling: the tooth bites at maximum thickness and the chip thins to zero.', slide: 57, qs: ['2023-24_6a', '2022-23_7a', '2014-15_6d'], explode: [0, 2, 1.5] },
      { id: 'force', name: 'Cutting force on the work', object: forceUpG, desc: 'Resultant cutting force on the work: upward in up milling (tends to lift the work and needs good clamping), downward in down milling (presses the work onto the table).', slide: 57, qs: ['2023-24_6a', '2022-23_7a'], explode: [0, 2, 1.5] },
      { id: 'feed', name: 'Feed direction', object: feedArrow, desc: 'Table feed f (blue). Up milling: cutter rotates against it. Down milling: cutter rotates in the same direction as the feed at the point of contact.', slide: 56, qs: ['2021-22_2d'], explode: [0, 0, 2] },
      { id: 'rotation', name: 'Cutter rotation', object: rotMarks, desc: 'Cutting motion V (red). Clockwise in this view gives up milling; counter-clockwise gives down milling for a work feed to the right.', slide: 56, qs: ['2021-22_2d'], explode: [0, 2, 2] },
    ];

    const Q = ['2023-24_6a', '2022-23_7a', '2021-22_2d', '2020-21_3b', '2014-15_6d', '2010-11_6b'];
    const modes = [
      { id: 'up', label: 'Up (conventional) milling', info: 'Cutter rotates against the table feed. Chip thickness starts at zero and increases gradually to a maximum at exit, so the tooth rubs before it bites (more heat, higher wear, shorter tool life). The cutting force acts upward and tends to lift the work. Chips are thrown upward and ahead, which is poorer for chip management. It needs more force, gives a lower material removal rate and rougher finish, is used for roughing and for brass, bronze and ferrous materials, and needs no backlash eliminator.', slide: 57, qs: Q },
      { id: 'down', label: 'Down (climb) milling', info: 'Cutter rotates in the same direction as the feed. The tooth bites at maximum chip thickness and the chip thins to zero at exit, so there is less rubbing, less heat and less tool wear (longer tool life). The cutting force acts downward and holds the work on the table. Chips are removed downward, which is better for chip management. It needs less feed power, gives a better finish and higher removal rate, suits finishing and aluminium alloys, but requires a backlash eliminator (or a CNC machine), especially on older machines. It is the preferred method where the machine allows.', slide: 58, qs: Q },
    ];

    // ----- State -----
    let mode = 'up';
    let d = -1;               // rotation sign (-1 clockwise = up, +1 counter-clockwise = down)
    let t = 0;
    let feedPos = 0;
    let tooth = -1;           // tooth currently shaping the chip
    let thetaCur = 0;
    let emitAcc = 0;
    let cutting = true;
    const tips = [];
    for (let i = 0; i < TEETH; i++) tips.push(0);

    function setChip(i0, i1) {
      // i0..i1 : angle from bottom, thickness profile FZ*sin(theta)
      for (let j = 0; j <= K; j++) {
        const th = i0 + ((i1 - i0) * j) / K;
        const s = Math.sin(th), c = Math.cos(th);
        const ro = R + FZ * Math.sin(Math.abs(th));
        for (let r = 0; r < 4; r++) {
          const rad = r === 0 || r === 2 ? R : ro;
          const z = r < 2 ? WORK_W * 0.5 - 0.6 : -(WORK_W * 0.5 - 0.6);
          const o = (r * (K + 1) + j) * 3;
          cpos[o] = -rad * s;
          cpos[o + 1] = -rad * c;
          cpos[o + 2] = z;
        }
      }
      chipGeo.attributes.position.needsUpdate = true;
    }

    function layout() {
      const xr = feedPos;                 // right end of work
      const xl = xr - WORK_LEN;
      const uLen = Math.max(-X0 - xl, 0.001);
      const mLen = Math.max(xr, 0.001);
      const H = TOP - TABLE_TOP;
      uncut.scale.set(uLen, H, 1);
      uncut.position.set(xl + uLen / 2, TABLE_TOP + H / 2, 0);
      const hm = BOTTOM - TABLE_TOP;
      mach.scale.set(mLen, hm, 1);
      mach.position.set(mLen / 2, TABLE_TOP + hm / 2, 0);
      table.position.x = feedPos - 3;
    }

    function setDir() {
      cutterUp.visible = d < 0;
      cutterDown.visible = d > 0;
      spinUp.visible = d < 0;
      spinDown.visible = d > 0;
      forceUpG.visible = d < 0;
      forceDownG.visible = d > 0;
    }

    // second label pair for down milling
    const lblL2 = textSprite('entry: t = max', { size: 0.3 });
    const lblR2 = textSprite('exit: t = 0', { size: 0.3 });
    lblL2.position.copy(lblL.position);
    lblR2.position.copy(lblR.position);
    root.add(lblL2, lblR2);

    function reset() {
      t = 0;
      feedPos = 0;
      emitAcc = 0;
      d = mode === 'up' ? -1 : 1;
      setDir();
      lblL.visible = lblR.visible = d < 0;
      lblL2.visible = lblR2.visible = d > 0;
      lower.position.y = 0;
      cutter.rotation.z = 0;
      cs.reset();
      layout();
    }

    reset();

    return {
      root, parts, modes,
      setMode(id) {
        mode = id === 'down' ? 'down' : 'up';
        reset();
      },
      update(dt) {
        t += dt;
        const u = t % CYCLE;
        let drop = 0;
        cutting = false;
        if (u < T_FEED) {
          feedPos = u * FEED;
          cutting = true;
        } else if (u < T_FEED + T_DROP) {
          const k = (u - T_FEED) / T_DROP;
          drop = DROP * k * k * (3 - 2 * k);
          feedPos = STROKE;
        } else if (u < T_FEED + T_DROP + T_RET) {
          const k = (u - T_FEED - T_DROP) / T_RET;
          drop = DROP;
          feedPos = STROKE * (1 - k * k * (3 - 2 * k));
        } else {
          const k = (u - T_FEED - T_DROP - T_RET) / T_UP;
          drop = DROP * (1 - k * k * (3 - 2 * k));
          feedPos = 0;
        }
        lower.position.y = -drop;
        layout();

        const psi = d * OMEGA * t;
        cutter.rotation.z = psi;

        // find tooth in the contact arc (oldest one)
        tooth = -1;
        let best = d < 0 ? -1 : 9;
        for (let i = 0; i < TEETH; i++) {
          let th = -Math.PI / 2 - (d * (i + 0.74) * STEP + psi);
          th = ((th % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI; // [-pi, pi)
          if (th >= 0 && th <= PHI) {
            if (d < 0 ? th > best : th < best) { best = th; tooth = i; }
          }
        }
        if (cutting && tooth >= 0) {
          thetaCur = best;
          chipG.visible = true;
          if (d < 0) setChip(0, thetaCur); else setChip(PHI, thetaCur);
        } else {
          chipG.visible = false;
        }

        // chips thrown
        cs.update(dt);
        if (cutting) {
          emitAcc += dt;
          if (emitAcc > STEP / OMEGA) {
            emitAcc = 0;
            const z = (Math.random() - 0.5) * 1.5;
            if (d < 0) cs.emit([-X0, TOP, z], [-1.4, 2.0, 0]);
            else cs.emit([0.1, BOTTOM + 0.1, z], [1.8, 0.4, 0]);
          }
        }
      },
      readout() {
        const up = d < 0;
        const tmax = FZ * Math.sin(PHI);
        return [
          ['Mode', up ? 'up (conventional) milling' : 'down (climb) milling'],
          ['Cutter vs feed at contact', up ? 'opposite' : 'same direction'],
          ['Chip thickness at entry', up ? '0' : tmax.toFixed(2) + ' (max)'],
          ['Chip thickness at exit', up ? tmax.toFixed(2) + ' (max)' : '0'],
          ['Cutting force on work', up ? 'upward (lifts work)' : 'downward (presses work)'],
          ['Backlash eliminator needed', up ? 'no' : 'yes'],
        ];
      },
      legend: [['V', 'cutter rotation'], ['f', 'table feed'], ['F', 'resultant cutting force (amber)']],
    };
  },
};
