import * as THREE from 'three';
import { M, box, cyl, tube, extrude, gear, at, group, arrow, spinArrow } from '../kit.js';

// Crank and slotted-lever (Whitworth-type) quick-return mechanism, drawn in the x-y plane.
const DEG = Math.PI / 180;
const OY = 0.8; // lever pivot height
const CC = 3; // pivot -> crank centre distance
const CY = OY + CC; // crank centre height
const LT = 5.4; // lever length (pivot -> top pin)
const LL = 3.2; // link length
const YR = 6.0; // ram height
const PERIOD = 6; // s per crank revolution

const MODES = {
  standard: { R: CC * Math.sin(20 * DEG) },
  'long-stroke': { R: 1.3 },
  'short-stroke': { R: 0.7 },
};

// lever angle beta (from vertical, clockwise) for crank phase ph (deg, 0 = start of cutting stroke)
function leverAngle(ph, R) {
  const psi = Math.asin(R / CC);
  const th = Math.PI + psi - ph * DEG;
  return Math.atan2(R * Math.cos(th), CC + R * Math.sin(th));
}
// ram pin x from lever top and link
function ramX(ph, R) {
  const b = leverAngle(ph, R);
  const tx = LT * Math.sin(b);
  const ty = OY + LT * Math.cos(b);
  const dy = ty - YR;
  return tx + Math.sqrt(LL * LL - dy * dy);
}

export default {
  id: 'quick-return',
  title: 'Crank & slotted-lever quick return',
  subtitle: 'Why the return stroke is faster than the cutting stroke',
  camera: { position: [4.5, 4.5, 15], target: [3.2, 3.3, 0] },
  build() {
    const root = new THREE.Group();
    let R = MODES.standard.R;
    let target = R;
    let cyc = 0;
    let ph = 0;
    let curMode = 'standard';

    // frame / backplate
    const frame = new THREE.Group();
    frame.add(at(box(14, 7.2, 0.3, M.paintDark), 3.5, 3.6, -1.0));
    frame.add(at(box(14.4, 0.3, 3.0, M.castIron), 3.5, 0.15, 0.2));
    frame.add(at(box(0.9, OY - 0.3, 0.9, M.castIron), 0, (OY + 0.3) / 2 - 0.0, -0.1));
    frame.add(at(box(8.6, 0.3, 1.0, M.paintLight), 5.3, 5.55, -0.25));
    root.add(frame);

    // --- bull gear with pinion & motor
    const bullG = new THREE.Group();
    bullG.position.set(0, CY, 0);
    bullG.add(at(gear(1.5, 30, 0.3, M.steel, { rInner: 0.25 }), 0, 0, 0.45));
    bullG.add(at(cyl(0.3, 0.2, M.chrome, { axis: 'z' }), 0, 0, 0.65));
    const slotBar = at(box(1.7, 0.16, 0.06, M.black), 0.8, 0, 0.62);
    bullG.add(slotBar);
    root.add(bullG);

    const pinion = new THREE.Group();
    pinion.position.set(-2.05, CY, 0);
    pinion.add(at(gear(0.5, 10, 0.3, M.brass, { rInner: 0.1 }), 0, 0, 0.45));
    root.add(pinion);
    const motor = new THREE.Group();
    motor.add(at(cyl(0.1, 1.2, M.chrome, { axis: 'z' }), -2.05, CY, 0.9));
    motor.add(at(cyl(0.5, 1.0, M.paintDark, { axis: 'z' }), -2.05, CY, 1.3));
    motor.add(at(cyl(0.54, 0.08, M.castIron, { axis: 'z' }), -2.05, CY, 1.82));
    motor.add(at(box(1.0, 0.1, 0.9, M.castIron), -2.05, CY - 0.55, 1.3));
    root.add(motor);
    const bull = group(bullG, pinion, motor);
    root.remove(bullG, pinion, motor);
    root.add(bull);

    // --- crank pin + sliding block (stroke adjust = pin radius along the gear slot)
    const pinG = new THREE.Group();
    pinG.add(at(cyl(0.2, 0.12, M.brass, { axis: 'z' }), 0, 0, 0.7));
    pinG.add(at(cyl(0.09, 0.8, M.steel, { axis: 'z' }), 0, 0, 0.3));
    pinG.add(at(box(0.4, 0.4, 0.1, M.castIron), 0, 0, 0.68));
    bullG.add(pinG);

    const blockG = new THREE.Group();
    blockG.add(at(box(0.3, 0.45, 0.2, M.brass), 0, 0, 0));
    root.add(blockG);

    // --- slotted lever (rocker)
    const leverG = new THREE.Group();
    leverG.position.set(0, OY, 0);
    const outline = [[-0.3, -0.4], [0.3, -0.4], [0.3, LT + 0.2], [-0.3, LT + 0.2]];
    const slot = [[-0.17, 1.9], [-0.17, 4.8], [0.17, 4.8], [0.17, 1.9]].reverse();
    leverG.add(extrude(outline, 0.3, M.paint, { holes: [slot] }));
    leverG.add(at(cyl(0.22, 0.45, M.chrome, { axis: 'z' }), 0, 0, 0));
    leverG.add(at(cyl(0.14, 0.45, M.brass, { axis: 'z' }), 0, LT, 0));
    root.add(leverG);

    // --- link + ram
    const link = box(1, 0.14, 0.12, M.darkSteel);
    link.position.z = -0.28;
    root.add(link);
    const ramG = new THREE.Group();
    ramG.position.set(0, YR, -0.25);
    ramG.add(at(box(5, 0.6, 0.9, M.castIron), 2.4, 0, 0));
    ramG.add(at(cyl(0.14, 0.4, M.brass, { axis: 'z' }), 0, 0, 0));
    ramG.add(at(box(0.5, 0.9, 0.6, M.paintLight), 5.15, -0.4, 0));
    ramG.add(at(box(0.16, 0.5, 0.2, M.hss), 5.55, -0.95, 0));
    ramG.add(arrow([2.0, 0.55, 0], [1, 0, 0], 1.3, M.vColor));
    root.add(ramG);

    // --- arcs on the crank circle (rebuilt when radius changes)
    const arcs = new THREE.Group();
    arcs.position.set(0, CY, 0.8);
    root.add(arcs);
    function clearArcs() {
      while (arcs.children.length) {
        const c = arcs.children.pop();
        c.geometry?.dispose();
      }
    }
    function arcPts(a0, a1, rad) {
      const pts = [];
      const nseg = Math.max(8, Math.round(Math.abs(a1 - a0) / 6));
      for (let i = 0; i <= nseg; i++) {
        const th = (a0 + ((a1 - a0) * i) / nseg) * DEG;
        pts.push([rad * Math.cos(th), rad * Math.sin(th), 0]);
      }
      return pts;
    }
    function rebuildArcs() {
      clearArcs();
      const psi = Math.asin(R / CC) / DEG;
      const start = 180 + psi;
      const cutSpan = 180 + 2 * psi;
      const rad = R;
      arcs.add(tube(arcPts(start, start - cutSpan, rad), 0.06, M.red, { seg: 80, radial: 8 }));
      arcs.add(tube(arcPts(start - cutSpan, start - 360, rad), 0.06, M.blue, { seg: 40, radial: 8 }));
      // extreme lever positions (tangent lines from the pivot)
      for (const s of [-1, 1]) {
        const b = s * (psi * DEG);
        const len = Math.sqrt(CC * CC - R * R);
        const m = cyl(0.025, len * 1.0, M.darkSteel);
        m.geometry.translate(0, len / 2, 0);
        m.position.set(0, -CC, 0);
        m.rotation.z = -b;
        arcs.add(m);
      }
    }
    rebuildArcs();
    root.add(at(spinArrow(1.9, M.vColor, { axis: 'z', arc: Math.PI * 1.2 }), 0, CY, 0.9));
    root.children[root.children.length - 1].rotation.z = 0.6;

    // --- parts
    const parts = [
      { id: 'bull-gear', name: 'Bull gear (with pinion)', object: bull, slide: 97,
        desc: 'The motor drives the pinion, which turns the large bull gear at a constant speed. The bull gear carries the crank pin and its speed is controlled by the motor.',
        qs: ['2022-23_7c'], anchor: [0, CY + 1.6, 0.6] },
      { id: 'crank-pin', name: 'Crank pin & sliding block', object: blockG, slide: 97,
        desc: 'The pin on the bull gear fits in the slot of the rocker through a sliding block and moves in a circle; the block is free to slide along the slot as the lever swings.',
        qs: ['2022-23_7c'] },
      { id: 'slotted-lever', name: 'Slotted lever (rocker arm)', object: leverG, slide: 97,
        desc: 'Oscillates about its fixed pivot at the bottom. When the pin is on the far side of the circle (larger angle) the lever swings slowly forward; on the near side it swings back quickly, so cutting takes more crank angle than the return.',
        qs: ['2022-23_7c'], anchor: [0, OY + 2.5, 0.3] },
      { id: 'link', name: 'Link', object: link, slide: 97,
        desc: 'Connects the top end of the rocker arm to the ram and converts its swing into the straight-line reciprocating motion of the ram.' },
      { id: 'ram', name: 'Ram', object: ramG, slide: 98,
        desc: 'Carries the tool; the forward stroke does the cutting at lower speed and the return stroke is the idle, faster stroke. The reciprocating ram pushes the tool across the work.',
        qs: ['2022-23_7c'] },
      { id: 'stroke-adjust', name: 'Stroke adjustment (crank radius)', object: slotBar, slide: 97,
        desc: 'The length of stroke is changed by changing the radius of the circle in which the pin on the bull gear rotates (pin position in the radial slot). The travel should be a little longer than the length of the workpiece.',
        qs: ['2022-23_7c'], anchor: [1.0, CY, 0.8] },
      { id: 'frame', name: 'Frame / column', object: frame, slide: 98,
        desc: 'Carries the pivot of the rocker arm, the bull gear and the ram guideway.' },
    ];

    const modes = [
      { id: 'standard', label: 'Standard (220 / 140)', slide: 97, qs: ['2022-23_7c'],
        info: 'Crank radius R = 0.34 x pivot-to-crank distance. The pin travels 220 degrees of crank angle during the (slower) cutting stroke and only 140 degrees during the return stroke. As the crank turns at constant speed the time ratio cutting : return = 220 : 140 = 1.57 : 1. The red arc is the cutting arc, the blue arc the return arc.' },
      { id: 'long-stroke', label: 'Long stroke', slide: 97, qs: ['2022-23_7c'],
        info: 'Larger crank radius gives a longer ram stroke and a larger cutting arc (about 231 degrees, ratio about 1.65 : 1). The stroke is changed by moving the crank pin outward in the bull gear slot.' },
      { id: 'short-stroke', label: 'Short stroke', slide: 97, qs: ['2022-23_7c'],
        info: 'Smaller crank radius shortens the stroke and the cutting arc is smaller (about 207 degrees, ratio about 1.43 : 1). The quick-return ratio therefore depends on the stroke setting.' },
    ];

    function place() {
      const b = leverAngle(ph, R);
      leverG.rotation.z = -b;
      const psi = Math.asin(R / CC);
      const th = Math.PI + psi - ph * DEG;
      bullG.rotation.z = th;
      const sprite = bullG; // gear rotation = pin angle
      pinG.position.set(R, 0, 0);
      pinG.rotation.z = 0;
      pinG.parent.rotation.z = th;
      // slot bar is aligned with the pin direction (rotates with gear), counter-rotate pin cap for look
      const px = R * Math.cos(th);
      const py = CY + R * Math.sin(th);
      blockG.position.set(px, py, 0);
      blockG.rotation.z = -b;
      pinion.rotation.z = -3 * th + 0.17;
      const tx = LT * Math.sin(b);
      const ty = OY + LT * Math.cos(b);
      const rx = ramX(ph, R);
      const dx = rx - tx;
      const dy = YR - ty;
      link.scale.x = LL;
      link.position.x = tx + dx / 2;
      link.position.y = ty + dy / 2;
      link.rotation.z = Math.atan2(dy, dx);
      ramG.position.x = rx;
      return sprite;
    }
    place();

    return {
      root,
      parts,
      modes,
      setMode(id) {
        const m = MODES[id] || MODES.standard;
        curMode = MODES[id] ? id : 'standard';
        R = m.R;
        target = R;
        cyc = 0;
        ph = 0;
        rebuildArcs();
        place();
      },
      update(dt) {
        cyc += dt / PERIOD;
        ph = (cyc - Math.floor(cyc)) * 360;
        place();
      },
      readout() {
        const psi = Math.asin(R / CC) / DEG;
        const cut = 180 + 2 * psi;
        const ret = 180 - 2 * psi;
        const cutting = ph < cut;
        // numerical ram velocity (dm/s): 1 degree of crank takes PERIOD/360 s
        const v = (ramX(ph + 0.5, R) - ramX(ph - 0.5, R)) / (PERIOD / 360);
        return [
          ['Crank angle', ph.toFixed(0) + '°'],
          ['Phase', cutting ? 'Cutting stroke (red arc)' : 'Return stroke (blue arc)'],
          ['Ram velocity', v.toFixed(2) + ' dm/s'],
          ['Cutting arc / return arc', cut.toFixed(0) + '° / ' + ret.toFixed(0) + '°'],
          ['Time ratio cut : return', (cut / ret).toFixed(2) + ' : 1'],
          ['Mode', curMode],
        ];
      },
      legend: [['red arc', 'cutting stroke (larger crank angle)'], ['blue arc', 'return stroke (smaller crank angle)'], ['V', 'ram cutting direction']],
    };
  },
};
