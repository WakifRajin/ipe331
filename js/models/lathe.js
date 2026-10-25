import * as THREE from 'three';
import { M, box, cyl, tube, extrude, gear, at, rot, group, chips } from '../kit.js';

// ---------- local helpers ----------
const sphere = (r, mat) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat);
  m.castShadow = true;
  return m;
};

// Spoked handwheel with a turning handle. Faces +z (axis 'z') or +x (axis 'x').
// wrap.userData.spin is the inner group to rotate.
function handwheel(r, spokes = 4, axis = 'z', mat = M.chrome) {
  const spin = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.03, 8, 32), mat);
  spin.add(rim, rot(cyl(0.07, 0.14, M.darkSteel, { axis: 'z', seg: 16 }), 0, 0, 0));
  for (let i = 0; i < spokes; i++) {
    const s = box(r, 0.03, 0.03, mat);
    const a = (i / spokes) * Math.PI * 2;
    s.position.set(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, 0);
    s.rotation.z = a;
    spin.add(s);
  }
  spin.add(at(cyl(0.025, 0.2, M.black, { axis: 'z', seg: 8 }), r, 0, 0.1), at(sphere(0.055, M.black), r, 0, 0.22));
  const wrap = new THREE.Group();
  wrap.add(spin);
  if (axis === 'x') wrap.rotation.y = Math.PI / 2;
  wrap.userData.spin = spin;
  return wrap;
}

// Lever with ball knob. Points along +y in its own frame.
function lever(len, mat = M.black) {
  const g = new THREE.Group();
  g.add(at(cyl(0.03, len, M.chrome, { seg: 8 }), 0, len / 2, 0), at(sphere(0.07, mat), 0, len + 0.03, 0));
  return g;
}
// lever sticking out of a front (+z) face and tilted by `tilt` radians in the xy plane
function frontLever(len, tilt, mat) {
  const p = new THREE.Group();
  p.rotation.x = Math.PI / 2;
  const l = lever(len, mat);
  l.rotation.z = tilt;
  p.add(l);
  return p;
}
const hexBolt = (r = 0.04, h = 0.04, axis = 'y') => cyl(r, h, M.darkSteel, { seg: 6, axis });
const knob = (r, mat = M.black) => cyl(r, 0.1, mat, { axis: 'z', seg: 16 });

export default {
  id: 'lathe',
  title: 'Centre lathe',
  subtitle: 'Main parts of an engine lathe',
  camera: { position: [6.5, 7, 15.5], target: [0, 2.4, 0] },
  build() {
    const root = new THREE.Group();
    const AX = 3.25; // spindle axis height
    const parts = [];
    const addPart = (id, name, object, desc, slide, qs, explode, anchor) => {
      root.add(object);
      parts.push({ id, name, object, desc, slide, qs, explode, anchor });
    };

    // ---------------- BED (cabinets, chip tray, motor, rack) ----------------
    const bed = new THREE.Group();
    bed.add(at(box(10.4, 0.3, 1.5, M.paint), 0, 1.75, 0));
    // bed cross-ribs seen from the front
    for (let i = -4; i <= 4; i++) bed.add(at(box(0.08, 0.2, 0.02, M.paintDark), i * 1.1, 1.75, 0.76));
    // cabinets / legs
    bed.add(at(box(1.7, 1.6, 1.4, M.paintDark), -4.3, 0.8, 0), at(box(1.4, 1.6, 1.4, M.paintDark), 4.4, 0.8, 0));
    bed.add(at(box(1.5, 1.4, 0.02, M.paint), -4.3, 0.8, 0.71), at(box(1.2, 1.4, 0.02, M.paint), 4.4, 0.8, 0.71));
    bed.add(at(cyl(0.04, 0.05, M.chrome, { axis: 'z' }), -3.7, 0.9, 0.73), at(cyl(0.04, 0.05, M.chrome, { axis: 'z' }), 4.0, 0.9, 0.73));
    for (const x of [-4.95, -3.65, 3.85, 4.95]) bed.add(at(box(0.3, 0.06, 1.6, M.black), x, 0.03, 0));
    // chip tray
    bed.add(at(box(7.15, 0.06, 1.8, M.darkSteel), 0.125, 0.95, 0), at(box(7.15, 0.3, 0.06, M.darkSteel), 0.125, 1.1, 0.87), at(box(7.15, 0.3, 0.06, M.darkSteel), 0.125, 1.1, -0.87));
    // motor behind the left cabinet
    const motor = group(cyl(0.38, 0.9, M.paintLight, { axis: 'x' }), at(cyl(0.3, 0.25, M.darkSteel, { axis: 'x' }), 0.55, 0, 0), at(box(0.7, 0.1, 0.6, M.castIron), 0, -0.4, 0));
    for (let i = -3; i <= 3; i++) motor.add(at(cyl(0.385, 0.03, M.paint, { axis: 'x' }), i * 0.12, 0, 0));
    bed.add(at(motor, -4.3, 0.75, -1.1));
    // rack under the front way
    {
      const p = 0.12, n = 62, x0 = -2.6;
      const pts = [];
      for (let i = 0; i < n; i++) {
        const x = x0 + i * p;
        pts.push([x, 0], [x + 0.25 * p, -0.07], [x + 0.55 * p, -0.07], [x + 0.8 * p, 0]);
      }
      pts.push([x0 + n * p, 0.06], [x0, 0.06]);
      const rack = extrude(pts, 0.06, M.darkSteel);
      bed.add(at(rack, 0, 1.64, 0.79));
    }
    // brackets that carry feed rod and lead screw
    bed.add(at(box(0.2, 0.9, 0.5, M.paintDark), 5.0, 1.6, 1.0), at(box(0.2, 0.2, 0.3, M.paintDark), 5.0, 1.95, 0.85));
    addPart('bed', 'Bed', bed,
      'Foundation of the lathe. It is a heavy cast-iron beam on legs or cabinets and supports all the major components. A lathe is specified by its swing and distance between centres, e.g. a 300-1500 lathe swings 300 mm over the bed and takes 1500 mm between centres.',
      40, ['2023-24_6c'], [0, -1.2, 0], [0, 1.8, 0.75]);

    // ---------------- WAYS ----------------
    const ways = new THREE.Group();
    for (const z of [-0.38, 0.38]) {
      ways.add(at(box(10.4, 0.12, 0.3, M.darkSteel), 0, 1.96, z));
      const v = box(10.4, 0.09, 0.09, M.steel);
      v.rotation.x = Math.PI / 4;
      ways.add(at(v, 0, 2.04, z));
    }
    addPart('ways', 'Ways', ways,
      'Precision-ground V and flat guideways along the top of the bed. They give accurate guidance to the carriage and the tailstock as they slide along the bed.',
      42, ['2023-24_6c'], [0, 0.7, 0], [0, 2.1, -0.38]);

    // ---------------- HEADSTOCK ----------------
    const head = new THREE.Group();
    head.add(at(box(2.4, 2.1, 1.5, M.paint), -4.0, 3.05, 0), at(box(2.5, 0.1, 1.6, M.paintDark), -4.0, 4.15, 0));
    head.add(at(box(0.5, 1.9, 0.9, M.paintLight), -5.4, 3.0, 0)); // belt / change-gear cover
    head.add(at(cyl(0.22, 0.02, M.black, { axis: 'x' }), -5.66, AX, 0)); // bore for bar stock
    // front plates, speed levers, dials
    head.add(at(box(2.0, 0.9, 0.04, M.paintLight), -3.9, 3.35, 0.77), at(box(2.0, 0.35, 0.04, M.paintDark), -3.9, 2.4, 0.77));
    const L1 = at(frontLever(0.5, 0.5, M.red), -4.5, 3.5, 0.8);
    const L2 = at(frontLever(0.5, -0.6, M.red), -3.7, 3.5, 0.8);
    const L3 = at(frontLever(0.4, 2.2, M.black), -3.3, 3.15, 0.8);
    head.add(L1, L2, L3);
    head.add(at(knob(0.13, M.black), -4.1, 3.1, 0.82), at(knob(0.1, M.chrome), -4.5, 3.1, 0.82), at(knob(0.1, M.chrome), -3.1, 3.6, 0.82));
    for (let i = 0; i < 4; i++) head.add(at(hexBolt(0.05, 0.06, 'z'), -4.9 + i * 1.8 / 1.5 * 0.9, 2.2, 0.8));
    head.add(at(cyl(0.18, 0.06, M.glass, { axis: 'z' }), -3.2, 2.4, 0.8)); // oil sight glass
    // rear bearing housing cap
    head.add(at(cyl(0.45, 0.2, M.paintDark, { axis: 'x' }), -2.7, AX, 0));
    addPart('headstock', 'Headstock', head,
      'Mounted at the left end of the ways. It contains the hollow spindle, bearings and the transmission gears. It supplies power to the work holder and gives the various spindle speeds; the spindle hole accepts long bar stock.',
      40, ['2023-24_6c'], [-1.4, 0.5, -0.8], [-4.0, 4.2, 0]);

    // ---------------- SPINDLE + CHUCK + WORK ----------------
    const spindle = new THREE.Group();
    const spin = new THREE.Group();
    spin.position.set(0, AX, 0);
    spindle.add(spin);
    spin.add(at(cyl(0.34, 0.6, M.chrome, { axis: 'x' }), -2.6, 0, 0));
    spin.add(at(cyl(0.9, 0.45, M.darkSteel, { axis: 'x', seg: 48 }), -2.22, 0, 0));
    spin.add(at(cyl(0.78, 0.06, M.steel, { axis: 'x', seg: 48 }), -1.97, 0, 0));
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
      const jaw = group(box(0.38, 0.34, 0.2, M.steel), at(box(0.16, 0.1, 0.2, M.hss), -0.1, -0.1, 0));
      jaw.position.set(-1.8, Math.sin(a) * 0.5, Math.cos(a) * 0.5);
      jaw.rotation.x = Math.PI / 2 - a; // keep jaws radial
      // base-jaw slot on chuck face and key socket on rim
      const slot = box(0.04, 0.9, 0.12, M.black);
      slot.position.set(-1.935, Math.sin(a) * 0.5, Math.cos(a) * 0.5);
      slot.rotation.x = Math.PI / 2 - a;
      const sock = cyl(0.05, 0.05, M.black, { seg: 8 });
      sock.position.set(-2.22, Math.sin(a) * 0.9, Math.cos(a) * 0.9);
      sock.rotation.x = Math.PI / 2 - a;
      spin.add(jaw, slot, sock);
    }
    spin.add(at(box(0.1, 0.03, 0.03, M.white), -2.22, 0.9, 0.0)); // reference mark on rim
    // work: raw part (chuck side) and turned part (tailstock side), scaled each frame
    const rawW = cyl(0.35, 1, M.work, { axis: 'x' });
    const cutW = cyl(0.31, 1, M.workCut, { axis: 'x' });
    spin.add(rawW, cutW);
    spin.add(at(box(0.18, 0.03, 0.18, M.black), -1.7, 0.35, 0)); // dull patch so rotation is visible
    addPart('spindle-chuck', 'Spindle and chuck', spindle,
      'The hollow spindle carries the work holder. Here a three-jaw self-centring chuck grips the workpiece, which rotates with the spindle; the central hole lets long bar stock pass through the headstock.',
      40, ['2023-24_6c'], [-2.6, 0.7, 0], [-2.2, AX + 0.95, 0]);

    // ---------------- TAILSTOCK ----------------
    const tail = new THREE.Group();
    const TX = 3.2;
    tail.add(at(box(1.6, 0.28, 1.2, M.paintDark), TX, 2.16, 0));
    tail.add(at(box(1.3, 0.95, 0.95, M.paint), TX, 2.775, 0), at(cyl(0.48, 1.3, M.paint, { axis: 'x', seg: 40 }), TX, AX, 0));
    const quill = cyl(0.22, 0.85, M.chrome, { axis: 'x' });
    quill.position.set(TX - 0.65 - 0.2, AX, 0);
    tail.add(quill);
    tail.add(at(cyl(0.02, 0.28, M.hss, { axis: 'x', rTop: 0.11 }), 1.7, AX, 0)); // dead centre
    tail.add(at(cyl(0.04, 0.3, M.chrome, { axis: 'x' }), TX + 0.8, AX, 0));
    const hw = at(handwheel(0.42, 5, 'x', M.chrome), TX + 0.95, AX, 0);
    tail.add(hw);
    // quill clamp lever on top, tailstock clamp lever at the base
    tail.add(at(cyl(0.05, 0.12, M.darkSteel), TX, 3.78, 0.15));
    const cl = lever(0.6, M.black);
    cl.rotation.z = -Math.PI / 2 + 0.3;
    tail.add(at(cl, TX, 3.84, 0.15));
    const cl2 = frontLever(0.55, 0.9, M.black);
    tail.add(at(cl2, TX + 0.2, 2.3, 0.6));
    // body locating T-bolt nuts
    tail.add(at(hexBolt(0.07, 0.08, 'z'), TX + 0.5, 2.16, 0.62), at(hexBolt(0.07, 0.08, 'z'), TX - 0.5, 2.16, 0.62));
    // set-over screws
    tail.add(at(hexBolt(0.05, 0.1, 'z'), TX, 2.3, 0.5), at(hexBolt(0.05, 0.1, 'z'), TX, 2.3, -0.5));
    addPart('tailstock', 'Tailstock', tail,
      'Supports the other end of the workpiece with a dead centre in its quill. The lower casting fits the inner ways, so it can slide along the bed and be locked at the desired position. The quill is advanced with the handwheel and locked with a clamp lever.',
      41, ['2023-24_6c', '2014-15_5b'], [1.8, 0.7, -0.7], [TX, 3.95, 0]);

    // ---------------- CARRIAGE ASSEMBLY (moves in x; built with the tool at x = 0) ----------------
    const carr = new THREE.Group();
    root.add(carr);
    const addCarr = (id, name, object, desc, slide, qs, explode, anchor) => {
      carr.add(object);
      parts.push({ id, name, object, desc, slide, qs, explode, anchor });
    };

    const saddle = new THREE.Group();
    saddle.add(at(box(1.6, 0.35, 1.9, M.paint), 0, 2.225, 0));
    saddle.add(at(box(1.6, 0.12, 0.12, M.paintDark), 0, 2.0, -0.55)); // underside keeps
    saddle.add(at(box(1.6, 0.12, 0.12, M.paintDark), 0, 2.0, 0.55));
    for (const [x, z] of [[-0.55, 0.7], [0.55, 0.7], [-0.55, -0.7], [0.55, -0.7]]) saddle.add(at(hexBolt(0.06, 0.05), x, 2.425, z));
    saddle.add(at(cyl(0.05, 0.06, M.brass), 0.7, 2.42, 0.3)); // oil cup
    addCarr('carriage', 'Carriage (saddle)', saddle,
      'The carriage slides along the ways and consists of the saddle, apron, cross slide, compound rest and tool post. Together with the apron it provides the base for mounting and moving the cutting tools and gives both longitudinal and transverse tool movement.',
      41, ['2023-24_6c'], [0, 1.2, 0], [0, 2.45, 0]);

    const apron = new THREE.Group();
    apron.add(at(box(1.5, 1.15, 0.18, M.paint), 0, 1.82, 1.04));
    apron.add(at(box(1.5, 0.12, 0.3, M.paintDark), 0, 1.3, 1.1));
    const hwA = at(handwheel(0.38, 6, 'z', M.chrome), -0.3, 1.62, 1.14);
    apron.add(hwA);
    const halfNut = at(frontLever(0.55, 0.4, M.red), 0.42, 2.1, 1.13);
    apron.add(halfNut);
    apron.add(at(frontLever(0.4, -0.5, M.black), 0.42, 1.55, 1.13), at(knob(0.1, M.black), 0.1, 2.15, 1.15), at(knob(0.08, M.chrome), 0.1, 1.2, 1.15));
    for (const [x, y] of [[-0.68, 2.3], [0.68, 2.3], [-0.68, 1.3], [0.68, 1.3]]) apron.add(at(hexBolt(0.05, 0.06, 'z'), x, y, 1.15));
    addCarr('apron', 'Apron', apron,
      'Hangs from the saddle on the front of the carriage. It houses the gears and clutches that connect the feed rod to the carriage (rack and pinion) and the cross slide, and the half-nut that engages the lead screw for threading. The handwheel moves the carriage by hand.',
      41, ['2023-24_6c', '2010-11_5c'], [0, -0.9, 1.6], [0.4, 2.7, 1.14]);

    // cross slide + compound + tool post sit in zGroup (moved radially during the cut)
    const zg = new THREE.Group();
    carr.add(zg);
    const addZ = (id, name, object, desc, slide, qs, explode, anchor) => {
      zg.add(object);
      parts.push({ id, name, object, desc, slide, qs, explode, anchor });
    };
    const PZ = 0.95; // compound pivot z
    const cross = new THREE.Group();
    cross.add(at(box(1.2, 0.2, 2.2, M.paintDark), 0, 2.5, 0.4));
    cross.add(at(box(0.9, 0.03, 2.0, M.castIron), 0, 2.61, 0.4));
    for (const x of [-0.3, 0.3]) cross.add(at(box(0.06, 0.02, 1.9, M.black), x, 2.63, 0.4)); // T-slots
    const hwC = at(handwheel(0.3, 4, 'z', M.chrome), 0, 2.5, 1.5);
    cross.add(hwC);
    cross.add(at(cyl(0.05, 0.4, M.steel, { axis: 'z' }), 0, 2.5, 1.38));
    addZ('cross-slide', 'Cross slide', cross,
      'Mounted on the carriage and moves at right angles to the spindle axis, giving the movement for facing and cut-off operations and for setting the depth of cut. For the taper-turning attachment it is freed from the cross-feed screw by removing the binder screw.',
      42, ['2023-24_6c', '2017-18_5b', '2011-12_5c', '2012-13_5b'], [0, 1.9, 0], [0, 2.65, 1.2]);

    const comp = new THREE.Group();
    comp.position.set(0, 0, PZ);
    comp.add(at(cyl(0.5, 0.1, M.paint, { seg: 40 }), 0, 2.65, 0), at(cyl(0.53, 0.025, M.brass, { seg: 40 }), 0, 2.715, 0));
    const slide = new THREE.Group();
    slide.rotation.y = Math.PI / 6;
    slide.add(at(box(0.55, 0.15, 1.3, M.paintLight), 0, 2.79, 0));
    slide.add(at(box(0.65, 0.05, 1.3, M.paint), 0, 2.72, 0));
    const hwP = at(handwheel(0.2, 3, 'z', M.chrome), 0, 2.79, 0.8);
    slide.add(hwP);
    comp.add(slide);
    for (let i = 0; i < 8; i++) { // swivel scale marks
      const a = (i / 8) * Math.PI * 2;
      comp.add(at(box(0.04, 0.02, 0.02, M.black), Math.sin(a) * 0.52, 2.73, Math.cos(a) * 0.52));
    }
    addZ('compound-rest', 'Compound rest', comp,
      'Mounted on the cross slide on a graduated swivel base, so it can be rotated to any angle. The tool post is carried on its top slide, so hand-feeding the compound moves the tool at that angle - used for short, steep tapers and angle cuts.',
      42, ['2023-24_6c', '2011-12_5b', '2013-14_6a', '2012-13_5b'], [0, 3.0, 0], [0.3, 2.9, 1.5]);

    const post = new THREE.Group();
    post.position.set(0, 0, PZ);
    post.add(at(box(0.5, 0.48, 0.5, M.darkSteel), 0, 3.1, 0));
    post.add(at(cyl(0.07, 0.2, M.steel), 0, 3.43, 0));
    const pl = lever(0.55, M.black);
    pl.rotation.z = -Math.PI / 2 + 0.2;
    post.add(at(pl, 0.0, 3.5, 0));
    for (const [x, z, rz, rx] of [[0.31, 0, Math.PI / 2, 0], [-0.31, 0, -Math.PI / 2, 0], [0, 0.31, 0, Math.PI / 2], [0, -0.31, 0, -Math.PI / 2]]) {
      post.add(rot(at(cyl(0.04, 0.12, M.steel, { seg: 8 }), x, 3.19 + 0.0, z), rx, 0, rz));
      post.add(at(sphere(0.045, M.black), x * 1.35, 3.19, z * 1.35));
    }
    const tool = group(at(box(0.12, 0.12, 1.1, M.hss), 0, 3.19, -0.1));
    const tip = box(0.14, 0.08, 0.14, M.carbide);
    tip.position.set(-0.01, 3.2, -0.62);
    tip.rotation.y = Math.PI / 4;
    tool.add(tip);
    post.add(tool); // tool tip ends at z = PZ - 0.6 = 0.35
    addZ('tool-post', 'Tool post (4-way)', post,
      'Holds the cutting tool on the top of the compound rest. The four-way turret lets up to four tools be mounted and indexed in turn; the centre stud clamps the post and screws hold the tool at centre height.',
      42, ['2023-24_6c'], [0, 3.9, 0], [0, 3.7, PZ]);

    // ---------------- FEED ROD & LEAD SCREW ----------------
    const feed = new THREE.Group();
    const frod = cyl(0.07, 8.15, M.chrome, { axis: 'x' });
    frod.position.set(0.925, 0, 0);
    const key = box(8.15, 0.025, 0.025, M.darkSteel);
    key.position.set(0.925, 0.07, 0);
    const frs = group(frod, key);
    frs.position.set(0, 1.8, 1.0);
    feed.add(frs);
    feed.add(at(box(0.15, 0.3, 0.25, M.paintDark), 4.9, 1.8, 1.0));
    addPart('feed-rod', 'Feed rod', feed,
      'A plain keyed shaft powered from the headstock through a gear train. It drives the carriage and cross slide (power feed for turning and facing) through the worm and clutches in the apron. The feed is in mm per spindle revolution.',
      42, ['2015-16_3a', '2010-11_5c', '2010-11_5d'], [0, -0.9, 1.5], [1.5, 1.8, 1.0]);

    const lead = new THREE.Group();
    const lsGroup = new THREE.Group();
    lsGroup.position.set(0, 1.4, 1.0);
    lsGroup.add(at(cyl(0.085, 8.15, M.darkSteel, { axis: 'x', seg: 16 }), 0.925, 0, 0));
    {
      const pts = [];
      const x0 = -3.1, x1 = 4.95, pitch = 0.2;
      const n = Math.round((x1 - x0) / pitch) * 8;
      for (let i = 0; i <= n; i++) {
        const x = x0 + (i / n) * (x1 - x0);
        const a = ((x - x0) / pitch) * Math.PI * 2;
        pts.push([x, Math.cos(a) * 0.1, Math.sin(a) * 0.1]);
      }
      lsGroup.add(tube(pts, 0.025, M.steel, { seg: n, radial: 4 }));
    }
    lead.add(lsGroup, at(box(0.15, 0.3, 0.25, M.paintDark), 4.9, 1.4, 1.0));
    addPart('lead-screw', 'Lead screw', lead,
      'A long accurate screw, powered from the headstock gears, used only for thread cutting. The half-nut in the apron closes on it, so the carriage then moves exactly one lead per screw revolution. Feed rod and lead screw are interlocked so they cannot be engaged together.',
      42, ['2015-16_3a', '2010-11_5c', '2010-11_5d'], [0, -1.8, 1.3], [1.5, 1.4, 1.0]);

    // ---------------- QUICK-CHANGE GEARBOX ----------------
    const gb = new THREE.Group();
    gb.add(at(box(1.5, 1.1, 0.5, M.paint), -3.9, 1.55, 1.0));
    gb.add(at(box(1.3, 0.8, 0.04, M.paintLight), -3.9, 1.55, 1.27));
    gb.add(at(gear(0.36, 18, 0.05, M.brass), -4.3, 1.55, 1.31));
    gb.add(at(knob(0.12, M.black), -3.6, 1.8, 1.3), at(knob(0.12, M.black), -3.6, 1.3, 1.3));
    const gl = at(frontLever(0.4, -0.7, M.red), -3.95, 1.9, 1.29);
    gb.add(gl, at(frontLever(0.35, 0.8, M.black), -4.4, 1.2, 1.29));
    for (let i = 0; i < 3; i++) gb.add(at(box(0.5, 0.02, 0.01, M.black), -3.9, 1.35 + i * 0.12, 1.295));
    addPart('gearbox', 'Quick-change gearbox', gb,
      'Driven from the headstock through the tumbler (reversing) gears. It sets the ratio between spindle speed and feed rod / lead screw speed, giving different feeds and thread pitches without changing gears by hand. Change gears are needed for different feeds, thread pitches and left-hand threads.',
      42, ['2015-16_3a', '2010-11_5c', '2010-11_5d'], [-1.6, -0.5, 1.6], [-3.9, 2.15, 1.0]);

    // ---------------- ANIMATION ----------------
    const rackGear = null; // (pinion hidden inside apron)
    const X0 = 1.45, X1 = -1.6, ZC = -0.04, ZR = 0.5;
    const rawX0 = -2.3, endX = 1.6;
    const T_IN = 0.8, T_CUT = 11, T_OUT = 0.8, T_RET = 2.2, T_ALL = T_IN + T_CUT + T_OUT + T_RET + 0.4;
    const ch = chips(80, M.workCut);
    root.add(ch.object);
    let phase = 0, cutX = X0, xT = X0, zc = ZR, emitT = 0, label = 'Infeed';
    const sm = (u) => u * u * (3 - 2 * u);

    function pose() {
      let x = X0, z = ZR;
      if (phase < T_IN) { z = ZR + (ZC - ZR) * sm(phase / T_IN); label = 'Infeed'; cutX = X0; }
      else if (phase < T_IN + T_CUT) { const u = (phase - T_IN) / T_CUT; x = X0 + (X1 - X0) * u; z = ZC; label = 'Turning (feed toward headstock)'; cutX = x; }
      else if (phase < T_IN + T_CUT + T_OUT) { x = X1; z = ZC + (ZR - ZC) * sm((phase - T_IN - T_CUT) / T_OUT); label = 'Retract'; }
      else if (phase < T_ALL - 0.4) { const u = sm((phase - T_IN - T_CUT - T_OUT) / T_RET); x = X1 + (X0 - X1) * u; z = ZR; label = 'Carriage return'; }
      xT = x; zc = z;
    }
    pose();

    function apply() {
      carr.position.x = xT;
      zg.position.z = zc;
      const rawLen = Math.max(cutX - rawX0, 0.001);
      rawW.scale.x = rawLen; rawW.position.x = rawX0 + rawLen / 2;
      const cutLen = Math.max(endX - cutX, 0.001);
      cutW.scale.x = cutLen; cutW.position.x = cutX + cutLen / 2;
      hwA.userData.spin.rotation.z = -xT / 0.15;
      hwC.userData.spin.rotation.z = zc * 12;
      hwP.userData.spin.rotation.z = 0;
    }
    apply();

    return {
      root,
      parts,
      update(dt) {
        phase = (phase + dt) % T_ALL;
        pose();
        apply();
        spin.rotation.x -= dt * 9;
        lsGroup.rotation.x -= dt * 6.5;
        frs.rotation.x -= dt * 3.2;
        if (phase > T_IN && phase < T_IN + T_CUT) {
          emitT += dt;
          while (emitT > 0.06) {
            emitT -= 0.06;
            ch.emit([xT, AX + 0.02, 0.33 + zc * 0], [0.15, 0.9, 0.9]);
          }
        }
        ch.update(dt);
      },
      readout() {
        return [
          ['Operation', 'Straight turning'],
          ['Stage', label],
          ['Carriage', `${((X0 - xT) * 10).toFixed(0)} mm travelled`],
          ['Chuck', 'rotating (V)'],
        ];
      },
      legend: [['Chuck + work', 'rotate'], ['Carriage', 'feeds along ways'], ['Feed rod / lead screw', 'rotate']],
    };
  },
};
