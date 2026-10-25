import * as THREE from 'three';
import { M, box, cyl, extrude, gear, at, group, arrow } from '../kit.js';

// Double-housing planer. Table reciprocates along x (cutting stroke = -x), heads fed along z.
const clamp01 = (a) => (a < 0 ? 0 : a > 1 ? 1 : a);
const sstep = (a) => {
  a = clamp01(a);
  return a * a * (3 - 2 * a);
};

const PERIOD = 8; // s per double stroke
const FW = 0.6; // fraction of the cycle spent on the cutting stroke
const FEED = 0.1;
const N_STROKES = 7;
const CX = 1.17; // table centre x when tool is over the work centre
const STROKE_HALF = 2.5;
const WORK_HL = 1.7;
const WORK_HW = 0.7;
const Y_RAW = 1.87;

let _off = 0;
let _dsdu = 1;
function profile(phi) {
  let u;
  let s;
  if (phi < FW) {
    u = phi / FW;
    s = 0.5 * u + 0.5 * sstep(u);
    _off = STROKE_HALF - 2 * STROKE_HALF * s;
  } else {
    u = (phi - FW) / (1 - FW);
    s = 0.5 * u + 0.5 * sstep(u);
    _off = -STROKE_HALF + 2 * STROKE_HALF * s;
  }
  _dsdu = 0.5 + 3 * u * (1 - u);
  return _off;
}

function buildHead(hingeHolder) {
  const g = new THREE.Group();
  const sad = new THREE.Group();
  sad.add(at(box(0.6, 0.9, 0.7, M.paint), -0.3, 3.5, 0));
  sad.add(at(box(0.3, 0.9, 0.5, M.paintDark), 0.15, 3.1, 0));
  sad.add(at(cyl(0.38, 0.1, M.steel, { axis: 'x', seg: 32 }), 0.35, 3.1, 0));
  sad.add(at(cyl(0.05, 0.3, M.chrome), 0.15, 3.7, 0));
  sad.add(at(cyl(0.2, 0.05, M.steel), 0.15, 3.87, 0));
  sad.add(at(cyl(0.03, 0.25, M.black), 0.3, 3.95, 0));
  g.add(sad);
  const clap = new THREE.Group();
  clap.add(at(box(0.5, 0.4, 0.52, M.paint), 0.45, 2.55, 0));
  clap.add(at(cyl(0.06, 0.6, M.brass, { axis: 'z' }), 0.55, 2.46, 0));
  const blockHinge = new THREE.Group();
  blockHinge.position.set(0.55, 2.46, 0);
  blockHinge.add(at(box(0.5, 0.5, 0.45, M.darkSteel), 0.15, -0.3, 0));
  clap.add(blockHinge);
  g.add(clap);
  const toolHinge = new THREE.Group();
  toolHinge.position.set(0.55, 2.46, 0);
  toolHinge.add(at(box(0.4, 0.26, 0.4, M.steel), 0.42, -0.2, 0));
  const tool = extrude([[-0.1, 0.3], [0.1, 0.3], [0.1, -0.1], [0.2, -0.27], [-0.1, -0.27]], 0.25, M.hss);
  at(tool, 0.42, -0.35, 0);
  toolHinge.add(tool);
  g.add(toolHinge);
  g.add(arrow([0.9, 3.2, 0.35], [0, 0, 1], 0.8, M.fColor));
  hingeHolder.push(blockHinge, toolHinge);
  return g;
}

export default {
  id: 'planer',
  title: 'Planer (planing machine)',
  subtitle: 'Work reciprocates under stationary tool heads',
  camera: { position: [9, 8.5, 13.5], target: [0.8, 2.2, 0.8] },
  build() {
    const root = new THREE.Group();

    // --------------------------------------------------------------- bed
    const bed = new THREE.Group();
    bed.add(at(box(12.4, 0.3, 5.6, M.castIron), CX, 0.15, 0));
    for (const z of [-1.05, 1.05]) {
      bed.add(at(box(12.4, 0.4, 0.7, M.paintDark), CX, 0.5, z));
      bed.add(at(box(12.4, 0.04, 0.2, M.steel), CX, 0.72, z));
    }
    root.add(bed);

    // ------------------------------------------------------------- housings
    const housings = new THREE.Group();
    for (const s of [-1, 1]) {
      housings.add(at(box(1.0, 4.7, 0.8, M.paint), -0.9, 2.65, s * 2.3));
      housings.add(at(box(0.3, 4.2, 0.1, M.steel), -0.55, 2.55, s * 1.88));
      housings.add(at(cyl(0.25, 0.08, M.steel), -0.9, 5.04, s * 2.3));
      housings.add(at(cyl(0.03, 0.3, M.black, { axis: 'x' }), -0.7, 5.12, s * 2.3));
    }
    housings.add(at(box(1.0, 0.5, 5.4, M.paint), -0.9, 5.25, 0));
    root.add(housings);

    // ------------------------------------------------------------ cross-rail
    const rail = new THREE.Group();
    rail.add(at(box(0.6, 0.7, 4.2, M.paintLight), -0.9, 3.5, 0));
    rail.add(at(cyl(0.05, 3.9, M.chrome, { axis: 'z' }), -0.9, 3.93, 0));
    rail.add(at(cyl(0.22, 0.06, M.steel, { axis: 'z' }), -0.9, 3.93, 2.05));
    rail.add(at(cyl(0.03, 0.3, M.black, { axis: 'y' }), -0.9, 4.1, 2.05));
    root.add(rail);

    // ------------------------------------------------------------ tool heads
    const hinges = [];
    const headL = buildHead(hinges);
    const headR = buildHead(hinges);
    const toolHeads = group(headL, headR);
    root.add(toolHeads);

    // ----------------------------------------------------------- side heads
    const sideHeads = new THREE.Group();
    for (const s of [-1, 1]) {
      sideHeads.add(at(box(0.5, 1.1, 0.3, M.paint), -0.9, 2.25, s * 1.75));
      sideHeads.add(at(box(0.34, 0.34, 0.36, M.steel), -0.9, 1.8, s * 1.5));
      sideHeads.add(at(box(0.12, 0.14, 0.85, M.hss), -0.9, 1.7, s * 1.1));
      sideHeads.add(at(cyl(0.05, 0.3, M.chrome), -0.9, 2.95, s * 1.75));
    }
    root.add(sideHeads);

    // ----------------------------------------------------------------- table
    const tableG = new THREE.Group();
    tableG.position.set(CX, 0, 0);
    root.add(tableG);
    const table = new THREE.Group();
    table.add(at(box(6, 0.6, 3.0, M.castIron), 0, 1.0, 0));
    for (const z of [-1, 0, 1]) table.add(at(box(6, 0.02, 0.16, M.black), 0, 1.301, z));
    for (const x of [-2.6, -1.3, 1.3, 2.6]) for (const z of [-1.2, 1.2]) table.add(at(cyl(0.07, 0.06, M.steel, { seg: 6 }), x, 1.33, z));
    for (const x of [-WORK_HL - 0.15, WORK_HL + 0.15]) table.add(at(box(0.15, 0.4, 1.2, M.darkSteel), x, 1.5, 0));
    tableG.add(table);
    tableG.add(arrow([1.6, 2.5, 0], [-1, 0, 0], 1.4, M.vColor));
    tableG.add(arrow([-0.3, 2.9, 0], [0, -1, 0], 0.7, M.dColor));

    const work = new THREE.Group();
    work.add(at(box(2 * WORK_HL, 0.54, 2 * WORK_HW, M.workCut), 0, 1.57, 0));
    const mkSlab = () => {
      const m = box(1, 0.06, 1, M.work);
      m.position.y = Y_RAW;
      work.add(m);
      return m;
    };
    const slabs = { mainL: mkSlab(), mainR: mkSlab(), stripL: mkSlab(), stripR: mkSlab() };
    tableG.add(work);

    // ------------------------------------------------------------------ drive
    const drive = new THREE.Group();
    const rackG = new THREE.Group();
    rackG.add(at(box(5.6, 0.1, 0.3, M.darkSteel), 0, 0.65, 0));
    const pts = [];
    const pitch = 0.25;
    const nt = 22;
    pts.push([-nt * pitch * 0.5, 0.0]);
    for (let i = 0; i < nt; i++) {
      const x0 = -nt * pitch * 0.5 + i * pitch;
      pts.push([x0 + pitch * 0.15, -0.1], [x0 + pitch * 0.6, -0.1], [x0 + pitch * 0.85, 0.0]);
    }
    pts.push([nt * pitch * 0.5, 0.1], [-nt * pitch * 0.5, 0.1]);
    rackG.add(at(extrude(pts, 0.3, M.steel), 0, 0.57, 0));
    tableG.add(rackG);
    const pinion = at(gear(0.3, 14, 0.3, M.brass, { rInner: 0.06 }), CX, 0.35, 0);
    drive.add(pinion);
    drive.add(at(cyl(0.07, 3.2, M.chrome, { axis: 'z' }), CX, 0.35, -1.6));
    drive.add(at(box(1.4, 0.9, 0.9, M.paint), CX, 0.75, -3.4));
    drive.add(at(cyl(0.45, 1.3, M.paintDark, { axis: 'z' }), CX, 0.8, -4.5));
    root.add(drive);

    // ----------------------------------------- compare mode: mini shaper
    const mini = new THREE.Group();
    mini.position.set(CX - 0.6, 0, 6.0);
    mini.add(at(box(5, 0.4, 2.0, M.castIron), 0, 0.2, 0));
    mini.add(at(box(1.2, 1.6, 1.4, M.paint), -1.8, 1.2, 0));
    mini.add(at(box(1.4, 0.3, 0.9, M.work), 0.9, 0.55, 0));
    const miniRam = new THREE.Group();
    miniRam.position.y = 1.55;
    miniRam.add(at(box(3, 0.35, 0.5, M.paintLight), -1.5, 0, 0));
    miniRam.add(at(box(0.3, 0.5, 0.4, M.paint), 0.15, -0.4, 0));
    miniRam.add(at(box(0.1, 0.3, 0.15, M.hss), 0.27, -0.7, 0));
    miniRam.add(arrow([-1.7, 0.45, 0], [1, 0, 0], 1.2, M.vColor));
    mini.add(miniRam);
    mini.add(arrow([0.9, 1.0, 0.7], [0, 0, -1], 0.7, M.fColor));
    mini.visible = false;
    root.add(mini);

    // ------------------------------------------------------------------ parts
    const qsCmp = ['2021-22_2b', '2018-19_6c', '2017-18_6b'];
    const parts = [
      { id: 'bed', name: 'Bed', object: bed, slide: 79,
        desc: 'Long, heavy cast-iron bed with ways (guideways) on which the table reciprocates; it is at least twice as long as the table stroke.', anchor: [CX + 4.5, 0.7, 1.05] },
      { id: 'table', name: 'Reciprocating table', object: table, slide: 79, qs: qsCmp,
        desc: 'Long table with T-slots that carries the heavy workpiece. In planing the work reciprocates (cutting on the slower forward stroke), unlike shaping where the tool reciprocates.', anchor: [CX + 2.6, 1.35, 1.3], explode: [0, -0.6, 0] },
      { id: 'workpiece', name: 'Workpiece', object: work, slide: 79,
        desc: 'Large, heavy work clamped on the table. The cutting velocity is practically constant along the cut; feed is in mm per stroke at right angles to the stroke.', anchor: [CX, 2.0, 0], explode: [0, 1.0, 0] },
      { id: 'housings', name: 'Double housing (columns)', object: housings, slide: 79,
        desc: 'Two rigid columns, one on each side of the bed, joined by a cross-member at the top. They carry the cross-rail and side heads and give the stiffness needed for heavy cuts.', anchor: [-0.9, 5.6, 2.3] },
      { id: 'cross-rail', name: 'Cross-rail', object: rail, slide: 79,
        desc: 'Horizontal beam spanning the housings; it is raised or lowered on the columns to set the height for the work. The tool heads slide along it.', anchor: [-0.9, 4.2, -1.5], explode: [0, 0.8, 0] },
      { id: 'tool-heads', name: 'Tool heads (with clapper boxes)', object: toolHeads, slide: 79, qs: qsCmp,
        desc: 'Two heads on the cross-rail can cut at the same time. The tool is stationary during the stroke and is fed across by a small step at the end of each stroke; the clapper box lifts the tool on the return stroke.', anchor: [0.6, 4.2, 0], explode: [0.8, 0.4, 0] },
      { id: 'side-heads', name: 'Side heads', object: sideHeads, slide: 79,
        desc: 'Heads mounted on the housings that move on vertical slides to machine the side faces (vertical surfaces) of the work.', anchor: [-0.9, 3.1, 1.75], explode: [0, 0.3, 0.6] },
      { id: 'drive', name: 'Drive (rack & pinion)', object: drive, slide: 79,
        desc: 'The motor drives a reversing gear train and a pinion which meshes with a rack on the underside of the table; reversing gives the slow cutting stroke and the quick return.', anchor: [CX, 0.2, -3.3], explode: [0, -0.3, 0] },
    ];

    const modes = [
      { id: 'planer', label: 'Planing', slide: 80, qs: qsCmp,
        info: 'In planing the work piece is clamped on a long table that reciprocates (horizontally) while the single-point tool stays fixed and is fed in. The table cuts on the slow forward stroke and returns idle and faster. Cutting speed is linear and almost constant along the cut. At the end of each stroke the heads are fed across by the feed per stroke, and the tool lifts on the return.' },
      { id: 'compare', label: 'Shaping vs planing', slide: 81, qs: qsCmp,
        info: 'Shaping (front): the tool reciprocates and the work is fed in; planing (back): the work reciprocates and the tool is fed in. Cutting is intermittent in both, with cutting on the forward stroke and an idle return. Similarities: both are subtractive, use general-purpose machines and a single-point tool, use only reciprocating motion (no rotation), produce flat surfaces, grooves, slots, T-slots and V-blocks but not curved slots, and employ a quick-return mechanism. Shaping suits small work; planing suits large, heavy work.' },
    ];

    // ------------------------------------------------------------------ state
    let cyc = 0;
    let phi = 0;
    let kk = 0;
    let curMode = 'planer';
    let lift = 0;
    let off = STROKE_HALF;

    const setSlab = (m, z0, z1, x0, x1) => {
      const lz = z1 - z0;
      const lx = x1 - x0;
      if (lz > 1e-3 && lx > 1e-3) {
        m.visible = true;
        m.scale.set(lx, 1, lz);
        m.position.set((x0 + x1) / 2, Y_RAW, (z0 + z1) / 2);
      } else m.visible = false;
    };

    function apply() {
      const n = Math.floor(cyc);
      phi = cyc - n;
      kk = n % N_STROKES;
      off = profile(phi);
      tableG.position.x = CX + off;
      rackG.visible = true;
      pinion.rotation.z = -off / 0.3;

      lift = phi < FW + 0.02 ? 0 : sstep((phi - FW - 0.02) / 0.05) * (1 - sstep((phi - 0.9) / 0.08));
      for (const h of hinges) h.rotation.z = lift * 0.55;

      const s = sstep((phi - 0.86) / 0.14);
      const zl = -WORK_HW + FEED * kk;
      const zr = FEED * kk;
      headL.position.z = -WORK_HW + FEED * (kk + s);
      headR.position.z = FEED * (kk + s);

      const fwd = phi < FW;
      const xl = -off;
      const xs = fwd ? Math.max(-WORK_HL, Math.min(WORK_HL, xl)) : WORK_HL;
      setSlab(slabs.mainL, zl + FEED, 0, -WORK_HL, WORK_HL);
      setSlab(slabs.mainR, zr + FEED, WORK_HW, -WORK_HL, WORK_HL);
      setSlab(slabs.stripL, zl, zl + FEED, xs, WORK_HL);
      setSlab(slabs.stripR, zr, zr + FEED, xs, WORK_HL);

      if (curMode === 'compare') miniRam.position.x = 0.3 - off * 0.44;
    }
    apply();

    return {
      root,
      parts,
      modes,
      setMode(id) {
        curMode = id === 'compare' ? 'compare' : 'planer';
        mini.visible = curMode === 'compare';
        cyc = 0;
        apply();
      },
      update(dt) {
        cyc += dt / PERIOD;
        apply();
      },
      readout() {
        const fwd = phi < FW;
        const dur = (fwd ? FW : 1 - FW) * PERIOD;
        const v = (_dsdu * 2 * STROKE_HALF) / dur;
        return [
          ['Stroke', fwd ? 'Cutting (forward, slower)' : 'Return (idle, faster)'],
          ['Table position', (off >= 0 ? '+' : '') + off.toFixed(2) + ' dm'],
          ['Table speed', v.toFixed(2) + ' dm/s'],
          ['Feed done', (kk + 1) + ' / ' + N_STROKES + ' strokes'],
          ['Mode', curMode === 'compare' ? 'planing vs shaping' : 'planing'],
        ];
      },
      legend: [['V', 'cutting motion (table)'], ['f', 'feed (tool heads)'], ['d', 'depth of cut']],
    };
  },
};
