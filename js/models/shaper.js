import * as THREE from 'three';
import { M, box, cyl, extrude, gear, at, rot, group, arrow, chips } from '../kit.js';

// Horizontal (crank-and-slotted-lever) shaper. Stroke axis = x (forward/cutting = +x),
// table feed along z, vertical = y.  Units are decimetres.
const DEG = Math.PI / 180;
const clamp01 = (a) => (a < 0 ? 0 : a > 1 ? 1 : a);
const sstep = (a) => {
  a = clamp01(a);
  return a * a * (3 - 2 * a);
};

// Slotted-lever kinematics: pivot at origin, crank centre at (0, C), crank radius R = C sin 20 deg
// => cutting arc 220 deg, return arc 140 deg.  Returns normalised ram position 0..1.
const C_ = 3;
const SIN_ = Math.sin(20 * DEG);
const R_ = C_ * SIN_;
function ramNorm(phDeg) {
  const th = (200 - phDeg) * DEG;
  const b = Math.atan2(R_ * Math.cos(th), C_ + R_ * Math.sin(th));
  return (Math.sin(b) + SIN_) / (2 * SIN_);
}

export default {
  id: 'shaper',
  title: 'Horizontal shaper',
  subtitle: 'Reciprocating ram, clapper box and indexing table',
  camera: { position: [9.5, 7, 11], target: [0.6, 2.6, 0] },
  build() {
    const root = new THREE.Group();

    const S = 2.0; // stroke length
    const FEED = 0.12;
    const WORK_W = 1.2;
    const N_STROKES = Math.round(WORK_W / FEED);
    const RAM_X0 = 0.28;
    const TIP_OFF = 1.52;
    const WORK_CX = 2.8;
    const WORK_HL = 0.8; // half length of work (x)
    const TOP_CUT = 3.06;
    const PERIOD = 6; // s per crank revolution

    // ---------------------------------------------------------------- base
    const base = new THREE.Group();
    base.add(at(box(9.2, 0.7, 4.0, M.castIron), 0.2, 0.35, 0));
    for (const x of [-3.6, 3.8]) for (const z of [-1.6, 1.6]) base.add(at(cyl(0.18, 0.1, M.black), x, 0.05, z));
    base.add(at(box(9.4, 0.06, 4.2, M.paintDark), 0.2, 0.03, 0));
    root.add(base);

    // -------------------------------------------------------------- column
    const column = new THREE.Group();
    column.add(at(box(3.9, 3.5, 3.2, M.paint), -2.25, 2.45, 0));
    for (const z of [-0.72, 0.72]) column.add(at(box(3.9, 0.45, 0.25, M.paintDark), -2.25, 4.425, z));
    column.add(at(box(1.9, 2.3, 0.06, M.paintLight), -2.25, 2.6, 1.63));
    // bull gear on the side cover (drives the slotted lever inside the column)
    const bullG = new THREE.Group();
    bullG.add(gear(0.8, 24, 0.1, M.steel, { rInner: 0.12 }));
    bullG.add(at(box(0.62, 0.1, 0.06, M.darkSteel), 0.4, 0, 0.06));
    bullG.add(at(cyl(0.09, 0.22, M.brass, { axis: 'z' }), 0.55, 0, 0.1));
    bullG.add(at(cyl(0.12, 0.1, M.chrome, { axis: 'z' }), 0, 0, 0.06));
    bullG.position.set(-2.25, 2.6, 1.72);
    column.add(bullG);
    // drive motor with pulley
    column.add(at(box(1.0, 0.1, 0.8, M.castIron), -1.2, 0.75, -1.9));
    column.add(at(cyl(0.38, 1.1, M.paintDark, { axis: 'x' }), -1.2, 1.18, -1.9));
    column.add(at(cyl(0.34, 0.12, M.castIron, { axis: 'x' }), -0.58, 1.18, -1.9));
    column.add(at(cyl(0.44, 0.06, M.darkSteel, { axis: 'x' }), -1.8, 1.18, -1.9));
    root.add(column);

    // ----------------------------------------------------------------- ram
    const ramG = new THREE.Group();
    ramG.position.set(RAM_X0, 4.5, 0);
    root.add(ramG);

    const ram = new THREE.Group();
    ram.add(at(box(5, 0.6, 1.1, M.paintLight), -2.5, 0, 0));
    for (const z of [-0.6, 0.6]) ram.add(at(box(5, 0.14, 0.12, M.darkSteel), -2.5, -0.2, z));
    // stroke-position adjuster (knob on top rear)
    ram.add(at(box(0.55, 0.14, 0.55, M.castIron), -4.2, 0.37, 0));
    ram.add(at(cyl(0.17, 0.3, M.steel, { seg: 6 }), -4.2, 0.59, 0));
    ram.add(at(cyl(0.035, 0.7, M.black, { axis: 'z' }), -4.2, 0.72, 0));
    ramG.add(ram);

    // tool head
    const toolHead = new THREE.Group();
    toolHead.add(at(cyl(0.62, 0.15, M.steel, { axis: 'x', seg: 40 }), 0.075, 0, 0));
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      toolHead.add(at(cyl(0.05, 0.1, M.chrome, { axis: 'x', seg: 6 }), 0.18, Math.sin(a) * 0.52, Math.cos(a) * 0.52));
    }
    toolHead.add(at(box(0.3, 1.4, 0.7, M.paint), 0.3, -0.3, 0));
    toolHead.add(at(box(0.08, 1.3, 0.5, M.darkSteel), 0.49, -0.3, 0));
    toolHead.add(at(cyl(0.06, 0.3, M.chrome), 0.3, 0.55, 0));
    toolHead.add(at(cyl(0.22, 0.05, M.steel), 0.3, 0.72, 0));
    toolHead.add(at(cyl(0.03, 0.3, M.black), 0.46, 0.85, 0));
    toolHead.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), M.red), 0.46, 1.02, 0));
    ramG.add(toolHead);

    // clapper box (fixed) + clapper block (hinged)
    const clapper = new THREE.Group();
    clapper.add(at(box(0.6, 0.5, 0.7, M.paint), 0.75, -0.65, 0));
    clapper.add(at(cyl(0.065, 0.85, M.brass, { axis: 'z' }), 0.9, -0.82, 0));
    const blockHinge = new THREE.Group();
    blockHinge.position.set(0.9, -0.82, 0);
    blockHinge.add(at(box(0.5, 0.5, 0.55, M.darkSteel), 0.15, -0.3, 0));
    clapper.add(blockHinge);
    ramG.add(clapper);

    // tool post + tool (rotates with the block)
    const toolPost = new THREE.Group();
    const toolHinge = new THREE.Group();
    toolHinge.position.set(0.9, -0.82, 0);
    toolPost.add(toolHinge);
    toolHinge.add(at(box(0.4, 0.26, 0.46, M.steel), 0.42, -0.2, 0));
    toolHinge.add(at(cyl(0.06, 0.2, M.chrome), 0.42, -0.02, 0));
    const tool = extrude(
      [[-0.1, 0.3], [0.1, 0.3], [0.1, -0.1], [0.2, -0.27], [-0.1, -0.27]],
      0.28,
      M.hss,
    );
    at(tool, 0.42, -0.35, 0);
    toolHinge.add(tool);
    ramG.add(toolPost);

    // arrows moving with ram
    ramG.add(arrow([-1.6, 0.9, 0], [1, 0, 0], 1.3, M.vColor));

    // -------------------------------------------------------------- saddle
    const saddle = new THREE.Group();
    saddle.add(at(box(1.3, 1.9, 3.0, M.paint), 0.35, 1.65, 0));
    saddle.add(at(box(3.5, 0.6, 3.6, M.paintDark), 2.75, 1.0, 0));
    for (const z of [-1.75, 1.75]) saddle.add(at(box(3.5, 0.08, 0.1, M.steel), 2.75, 1.34, z));
    saddle.add(at(cyl(0.08, 3.3, M.chrome), 0.1, 2.45, 1.3));
    saddle.add(at(cyl(0.28, 0.06, M.steel), 0.1, 4.12, 1.3));
    saddle.add(at(cyl(0.03, 0.35, M.black), 0.3, 4.25, 1.3));
    root.add(saddle);

    // --------------------------------------------------------------- table
    const tableG = new THREE.Group();
    tableG.position.set(WORK_CX, 0, 0);
    root.add(tableG);

    const table = new THREE.Group();
    table.add(at(box(3.4, 0.7, 2.6, M.castIron), 0, 1.65, 0));
    for (const z of [-0.8, 0, 0.8]) table.add(at(box(3.4, 0.02, 0.16, M.black), 0, 2.001, z));
    table.add(at(box(0.4, 0.55, 0.5, M.paintDark), 1.8, 1.075, 0));
    tableG.add(table);

    const vise = new THREE.Group();
    vise.add(at(box(2.0, 0.25, 2.3, M.paintDark), 0, 2.125, 0));
    vise.add(at(box(2.0, 0.7, 0.3, M.darkSteel), 0, 2.6, -0.75));
    vise.add(at(box(2.0, 0.7, 0.3, M.darkSteel), 0, 2.6, 0.75));
    vise.add(at(cyl(0.08, 0.9, M.chrome, { axis: 'z' }), 0, 2.45, 1.3));
    vise.add(at(cyl(0.04, 0.6, M.black, { axis: 'x' }), 0, 2.45, 1.75));
    for (const x of [-0.5, 0.5]) vise.add(at(cyl(0.06, 0.05, M.steel, { seg: 6 }), x, 2.275, -1.05));
    tableG.add(vise);

    const work = new THREE.Group();
    work.add(at(box(2 * WORK_HL, 0.77, WORK_W, M.workCut), 0, 2.675, 0));
    const slabMain = box(1, 0.06, 1, M.work);
    const slabStrip = box(1, 0.06, 1, M.work);
    slabMain.position.y = 3.09;
    slabStrip.position.y = 3.09;
    work.add(slabMain, slabStrip);
    tableG.add(work);
    tableG.add(arrow([-1.2, 3.55, 0.9], [0, 0, -1], 0.9, M.fColor));
    tableG.add(arrow([1.3, 3.8, 0.45], [0, -1, 0], 0.65, M.dColor));

    // -------------------------------------------------- table feed mechanism
    const feed = new THREE.Group();
    const screwG = new THREE.Group();
    screwG.position.set(4.6, 1.05, 0);
    screwG.add(at(cyl(0.1, 4.3, M.chrome, { axis: 'z' }), 0, 0, 0.25));
    screwG.add(at(box(0.08, 0.08, 0.5, M.black), 0.1, 0, -0.9));
    screwG.add(at(box(0.08, 0.08, 0.5, M.black), 0.1, 0, 0.9));
    screwG.add(at(gear(0.4, 14, 0.14, M.steel, { rInner: 0.1 }), 0, 0, 2.3));
    screwG.add(at(cyl(0.3, 0.08, M.steel, { axis: 'z' }), 0, 0, 2.75));
    screwG.add(at(cyl(0.03, 0.4, M.black, { axis: 'x' }), 0.2, 0, 2.8));
    feed.add(screwG);
    for (const z of [-1.85, 2.0]) feed.add(at(box(0.3, 0.5, 0.3, M.paintDark), 4.6, 0.95, z));
    const pawl = new THREE.Group();
    pawl.position.set(5.0, 1.7, 2.3);
    pawl.add(at(box(0.65, 0.08, 0.1, M.brass), -0.325, 0, 0));
    pawl.add(at(cyl(0.07, 0.16, M.steel, { axis: 'z' }), 0, 0, 0));
    feed.add(pawl);
    feed.add(at(box(0.2, 0.9, 0.3, M.paintDark), 5.1, 1.2, 2.3));
    root.add(feed);

    // chips
    const ch = chips(40, M.workCut);
    root.add(ch.object);
    const chipPos = [0, 3.1, 0];
    const chipVel = [-0.5, 0.9, 0.1];

    // ---------------------------------------------------------------- parts
    const parts = [
      { id: 'base', name: 'Base', object: base, slide: 87,
        desc: 'Heavy cast-iron foundation that carries the column and supports the table; it takes the cutting load and damps vibration.',
        anchor: [0.2, 0.7, 1.9] },
      { id: 'column', name: 'Column (with drive)', object: column, slide: 90,
        desc: 'The column supports the ram and carries the rails for the saddle. The motor-driven bull gear and the quick-return mechanism that move the ram are housed inside it.',
        anchor: [-2.25, 3.5, 1.6] },
      { id: 'ram', name: 'Ram', object: ram, slide: 88, qs: ['2013-14_6d'],
        desc: 'Slides back and forth on dovetail or square ways and carries the tool head. The stroke length and the starting point of the stroke are adjustable. Shaper size = maximum stroke length (typically 16-24 in).',
        explode: [-1.5, 0.8, 0], anchor: [-2.3, 4.9, 0] },
      { id: 'tool-head', name: 'Tool head', object: toolHead, slide: 88,
        desc: 'Fastened to the ram on a circular swivel plate so it can be rotated for angular cuts. The down-feed handle moves the slide up and down for precise depth of cut.',
        explode: [0.8, 0.6, 0], anchor: [0.3, 5.0, 0] },
      { id: 'clapper-box', name: 'Clapper box', object: clapper, slide: 89, qs: ['2015-16_4d', '2010-11_7a', '2009-10_6c'],
        desc: 'The tool post is carried by a clapper block hinged in the clapper box. On the cutting stroke the cutting force seats the block firmly; on the return stroke the block swings up so the tool lifts and does not drag, dig in or blunt, and it also protects the tool from strain-back.',
        explode: [1.2, 0.2, 0], anchor: [0.9, 3.5, 0] },
      { id: 'tool-post', name: 'Tool post & tool', object: toolPost, slide: 90, qs: ['2011-12_6b'],
        desc: 'Same idea as on a lathe but in a vertical plane, with a single-point tool whose rake and clearance are smaller (clearance < 4 deg) because the cut is intermittent and the tool strains back and could dig in.',
        explode: [1.5, -0.3, 0], anchor: [1.5, 3.1, 0] },
      { id: 'table', name: 'Table (T-slots)', object: table, slide: 89, qs: ['2013-14_6d'],
        desc: 'Box-shaped table with T-slots for clamping the work or a vise; moved sideways, by hand to position the work and automatically for feed at the end of each stroke. Shaper width = maximum width cuttable = table travel.',
        explode: [0, -0.4, 0], anchor: [1.9, 2.0, 1.3] },
      { id: 'saddle', name: 'Saddle / cross-rail', object: saddle, slide: 90,
        desc: 'Moves up and down the column ways (Y axis), usually by hand, to set the rough position for the depth of cut; the final depth is set by the down-feed handle on the tool head. The table slides sideways on the cross-rail.',
        explode: [0, -0.8, 0], anchor: [0.4, 2.6, 0] },
      { id: 'table-feed', name: 'Table feed (ratchet & pawl)', object: feed, slide: 89,
        desc: 'A pawl pushes a ratchet wheel on the cross-feed screw by a few teeth at the end of each return stroke, so the table indexes sideways by the feed per stroke. Feed is in mm per stroke, at right angles to the cutting direction.',
        explode: [1.0, 0, 0.6], anchor: [4.7, 1.9, 2.3] },
      { id: 'vise', name: 'Vise', object: vise, slide: 91,
        desc: 'Work holding is frequently done in a vise made for shapers, with long jaws that open to 14 in or more; it may have a swivel base for angled cuts. Large work is clamped straight on the table T-slots.',
        explode: [0, 0.6, 0], anchor: [0, 3.0, 0.9] },
      { id: 'workpiece', name: 'Workpiece', object: work, slide: 85,
        desc: 'The job is rigidly held on the table. Each cutting stroke planes a strip as wide as the feed; the table then indexes by the feed and the next strip is cut.',
        explode: [0, 1.0, 0], anchor: [0, 3.2, 0] },
    ];

    // ---------------------------------------------------------------- state
    let cyc = 0;
    let ph = 0;
    let n = 0;
    let lift = 0;
    let engaged = false;
    let chipT = 0;
    let tipX = RAM_X0 + TIP_OFF;
    let kk = 0;

    function apply(dt) {
      const nn = Math.floor(cyc);
      ph = (cyc - nn) * 360;
      n = nn;
      kk = n % N_STROKES;
      const r = ramNorm(ph) * S;
      ramG.position.x = RAM_X0 + r;
      tipX = ramG.position.x + TIP_OFF;
      bullG.rotation.z = -ph * DEG;

      // clapper lifts at the start of return, falls back at the end
      lift = ph < 218 ? 0 : sstep((ph - 218) / 12) * (1 - sstep((ph - 346) / 12));
      blockHinge.rotation.z = lift * 0.55;
      toolHinge.rotation.z = lift * 0.55;

      // table indexes at the end of the return stroke
      const s = sstep((ph - 335) / 25);
      const zt = 0.6 - FEED * (kk + s);
      tableG.position.z = zt;
      screwG.rotation.z = ((0.6 - zt) / 0.5) * Math.PI * 2;
      pawl.rotation.z = 0.45 + 0.28 * Math.sin(Math.PI * s);

      // progressively planed surface
      const lz = -0.6 + FEED * kk;
      const mainLen = 0.6 - lz - FEED;
      if (mainLen > 1e-3) {
        slabMain.visible = true;
        slabMain.scale.set(2 * WORK_HL, 1, mainLen);
        slabMain.position.z = lz + FEED + mainLen / 2;
      } else slabMain.visible = false;
      const xl = tipX - WORK_CX;
      let xs = -WORK_HL;
      if (ph < 220) xs = Math.max(-WORK_HL, Math.min(WORK_HL, xl));
      else xs = WORK_HL;
      const stripLen = WORK_HL - xs;
      if (ph >= 220) {
        slabStrip.visible = false;
      } else if (stripLen > 1e-3) {
        slabStrip.visible = true;
        slabStrip.scale.set(stripLen, 1, FEED);
        slabStrip.position.set(xs + stripLen / 2, 3.09, lz + FEED / 2);
      } else slabStrip.visible = false;

      engaged = ph < 220 && xl > -WORK_HL && xl < WORK_HL;
      if (dt !== undefined) {
        if (engaged) {
          chipT += dt;
          if (chipT > 0.05) {
            chipT = 0;
            chipPos[0] = tipX;
            chipPos[1] = TOP_CUT + 0.04;
            chipPos[2] = 0;
            ch.emit(chipPos, chipVel);
          }
        }
        ch.update(dt);
      }
    }

    apply();

    return {
      root,
      parts,
      update(dt) {
        cyc += dt / PERIOD;
        apply(dt);
      },
      readout() {
        const fwd = ph < 220;
        const pct = Math.round(ramNorm(ph) * 100);
        return [
          ['Crank angle', ph.toFixed(0) + '°'],
          ['Stroke', fwd ? 'Forward (cutting), 220°' : 'Return (idle), 140°'],
          ['Ram position', pct + '% of stroke'],
          ['Clapper block', lift > 0.5 ? 'lifted' : lift > 0.05 ? 'lifting' : 'seated'],
          ['Strokes done', (kk + 1) + ' / ' + N_STROKES],
        ];
      },
      legend: [['V', 'cutting motion (ram)'], ['f', 'feed per stroke (table)'], ['d', 'depth of cut']],
    };
  },
};
