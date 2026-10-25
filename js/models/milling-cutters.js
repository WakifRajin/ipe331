import * as THREE from 'three';
import { M, box, cyl, gear, helixTeeth, at, group, textSprite } from '../kit.js';

// All builders return a Group with the cutter axis along local y, centred on its bounding box.

function plainCutter() {
  const g = new THREE.Group();
  g.add(gear(1.0, 16, 2.0, M.hss, { axis: 'y' }));
  g.add(cyl(0.3, 2.2, M.steel));
  return g;
}
function helicalCutter(hand, R = 1.0, len = 2.0, teeth = 14, twist = 0.8) {
  const g = new THREE.Group();
  g.add(cyl(R * 0.88, len, M.hss));
  g.add(helixTeeth(R, len, teeth, M.hss, { helix: hand * twist, width: 0.14, height: 0.14, segs: 20 }));
  g.add(cyl(0.3, len + 0.2, M.steel));
  return g;
}
function sideFaceCutter() {
  const g = new THREE.Group();
  g.add(gear(1.2, 22, 0.5, M.hss, { axis: 'y' }));
  g.add(cyl(0.9, 0.52, M.darkSteel));
  for (const s of [-1, 1]) g.add(at(cyl(1.15, 0.03, M.carbide, { rTop: 0.95 }), 0, s * 0.26, 0));
  g.add(cyl(0.3, 0.7, M.steel));
  return g;
}
function slittingSaw() {
  const g = new THREE.Group();
  g.add(gear(1.5, 64, 0.08, M.hss, { axis: 'y' }));
  g.add(cyl(0.5, 0.2, M.steel));
  return g;
}
function endMillTool(r, len, flutes, { ball = false, slot = false } = {}) {
  const g = new THREE.Group();
  const shank = 1.2;
  const total = len + shank;
  g.add(at(cyl(r * 0.9, len, M.hss), 0, -total / 2 + len / 2, 0));
  const t = helixTeeth(r, len, flutes, M.hss, { helix: 1.4, width: r * 0.32, height: r * 0.32, segs: 20 });
  t.position.y = -total / 2 + len / 2;
  g.add(t);
  if (ball) g.add(at(new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), M.hss), 0, -total / 2 + r * 0.2, 0));
  if (slot) g.add(at(box(r * 2, 0.04, r * 0.4, M.carbide), 0, -total / 2, 0));
  g.add(at(cyl(r * 0.85, shank, M.steel), 0, total / 2 - shank / 2, 0));
  return g;
}
function faceMillTool() {
  const g = new THREE.Group();
  g.add(at(cyl(1.3, 0.4, M.darkSteel), 0, -0.3, 0));
  g.add(at(cyl(0.6, 0.6, M.steel), 0, 0.2, 0));
  const n = 8;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const ins = box(0.4, 0.28, 0.14, M.carbide);
    ins.position.set(Math.cos(a) * 1.22, -0.36, Math.sin(a) * 1.22);
    ins.rotation.y = -a;
    g.add(ins);
    const screw = cyl(0.04, 0.05, M.black);
    screw.position.set(Math.cos(a) * 1.22, -0.2, Math.sin(a) * 1.22);
    g.add(screw);
  }
  return g;
}

export default {
  id: 'milling-cutters',
  title: 'Milling cutters',
  subtitle: 'Cutters for horizontal and vertical milling machines',
  camera: { position: [0, 8.5, 13], target: [0, 1.3, 0] },
  build() {
    const root = new THREE.Group();
    const platter = group(
      at(cyl(7.6, 0.3, M.castIron, { seg: 64 }), 0, 0.15, 0),
      at(cyl(7.2, 0.06, M.paintDark, { seg: 64 }), 0, 0.31, 0),
    );
    root.add(platter);

    const defs = [
      { id: 'plain', name: 'Plain milling cutter', mk: plainCutter, disc: true, size: 1.0, slide: 65, qs: ['2009-10_6a', '2013-14_6c'],
        desc: 'Straight teeth run parallel to the rotation axis. Each tooth strikes the work along its whole length at once, causing intermittent impact, more vibration and higher power in heavy cuts. Best for wide, rough or light flat passes; finish can be slightly rougher.' },
      { id: 'helical-right', name: 'Helical cutter (right-hand)', mk: () => helicalCutter(1), disc: true, size: 1.0, slide: 65, qs: ['2009-10_6a', '2013-14_6c'],
        desc: 'Teeth wrap around the body in a spiral at a helix angle, so each tooth engages the work progressively (gradual entry). Cutting is smooth, quiet and continuous with less shock and less power, giving a better finish; suited to uneven or interrupted surfaces and tough materials. Right-hand spiral shown.' },
      { id: 'helical-left', name: 'Helical cutter (left-hand)', mk: () => helicalCutter(-1), disc: true, size: 1.0, slide: 64, qs: ['2013-14_6c'],
        desc: 'A left-hand spiral cutter has its flutes twisting the opposite way to a right-hand one. Cutters are also classed as left-hand or right-hand by their direction of rotation when viewed from the spindle end.' },
      { id: 'side-and-face', name: 'Side-and-face cutter', mk: sideFaceCutter, disc: true, size: 1.2, slide: 66, qs: ['2013-14_6c'],
        desc: 'Has cutting edges on the periphery and on the sides of the teeth, for cutting shoulders and slots.' },
      { id: 'slitting-saw', name: 'Slitting saw', mk: slittingSaw, disc: true, size: 1.5, slide: 66, qs: ['2013-14_6c'],
        desc: 'A very thin saw-like disc for cutting deep slots or for parting off.' },
      { id: 'slab-mill', name: 'Slab mill', mk: () => helicalCutter(1, 1.1, 2.6, 8, 1.0), disc: true, size: 1.1, slide: 66, qs: ['2013-14_6c'],
        desc: 'A wide cylindrical cutter with coarse helical teeth for heavy cutting of large, flat surfaces on a horizontal mill.' },
      { id: 'end-mill', name: 'End mill (4-flute)', mk: () => endMillTool(0.4, 1.4, 4), disc: false, size: 1.3, slide: 67, qs: ['2013-14_6c'],
        desc: 'Helical flutes on the end and periphery with a straight shank held in the vertical spindle. Commonly used for facing, slotting and profile milling.' },
      { id: 'face-mill', name: 'Face milling cutter (inserts)', mk: faceMillTool, disc: false, size: 0.8, slide: 67, qs: ['2013-14_6c'],
        desc: 'Large-diameter body carrying indexable carbide inserts around the rim, used for heavy cutting of flat surfaces.' },
      { id: 'slot-drill', name: 'Slot drill (2-flute)', mk: () => endMillTool(0.4, 1.2, 2, { slot: true }), disc: false, size: 1.2, slide: 67, qs: ['2013-14_6c'],
        desc: 'Two-flute end mill that cuts to the centre, so it can plunge like a drill and produce pockets without drilling a hole beforehand.' },
      { id: 'ball-nose', name: 'Ball-nose end mill', mk: () => endMillTool(0.4, 1.3, 2, { ball: true }), disc: false, size: 1.3, slide: 63, qs: ['2016-17_7d'],
        desc: 'End mill with a hemispherical tip used for surface contouring to create three-dimensional curved surface forms.' },
    ];

    const items = [];
    const N = defs.length;
    defs.forEach((d, i) => {
      const a = (i / N) * Math.PI * 2 + Math.PI / 2 * 0; // placed around ring
      const x = Math.sin(a) * 5.0, z = Math.cos(a) * 3.2;
      const g = new THREE.Group();
      const spin = d.mk();
      const outer = new THREE.Group();
      outer.add(spin);
      const h = d.disc ? d.size + 0.9 : d.size + 0.5;
      if (d.disc) {
        outer.rotation.x = Math.PI / 2;
        g.add(at(cyl(0.18, h - 0.2, M.darkSteel), 0, (h - 0.2) / 2 + 0.3, -0.0));
        g.add(at(box(0.8, 0.1, 0.8, M.darkSteel), 0, 0.35, 0));
      } else {
        g.add(at(cyl(0.8, 0.12, M.darkSteel), 0, 0.37, 0));
      }
      outer.position.y = h + 0.3;
      g.add(outer);
      g.position.set(x, 0, z);
      root.add(g);
      const lab = textSprite(d.name, { size: 0.28 });
      lab.position.set(0, h + 0.3 + d.size + 0.7, 0);
      g.add(lab);
      items.push({ ...d, g, spin, home: [x, 0, z], h });
    });

    // compare-mode props: contact indicators on small work blocks
    const cmp = new THREE.Group();
    cmp.visible = false;
    const wk = [];
    for (const s of [-1, 1]) {
      const blk = at(box(2.6, 0.5, 1.2, M.work), s * 2.6, 0.55, 3.2);
      cmp.add(blk);
      wk.push(blk);
    }
    const lineMat = M.red;
    const impact = at(box(0.1, 0.06, 2.0, lineMat), -2.6, 0.84, 3.2);
    const gradual = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), lineMat);
    gradual.position.set(2.6, 0.84, 3.2);
    cmp.add(impact, gradual);
    const tPlain = textSprite('Plain: whole tooth hits at once (impact)', { size: 0.3 });
    tPlain.position.set(-2.6, 4.9, 3.2);
    const tHel = textSprite('Helical: gradual entry, smooth cut', { size: 0.3 });
    tHel.position.set(2.6, 4.9, 3.2);
    cmp.add(tPlain, tHel);
    root.add(cmp);

    const parts = items.map((it) => ({
      id: it.id, name: it.name, object: it.g, desc: it.desc, slide: it.slide, qs: it.qs, explode: [0, 0.8, 0.8],
    }));

    const modes = [
      { id: 'all', label: 'All cutters', info: 'Horizontal-mill cutters (plain, helical, side-and-face, slitting saw, slab mill) are arbor-mounted discs; vertical-mill cutters (end mill, face mill, slot drill, ball-nose) have a shank or bore on the spindle. Helical cutters are left- or right-hand.', slide: 64, qs: ['2013-14_6c'] },
      { id: 'plain-vs-helical', label: 'Plain vs helical', info: 'Plain cutter: straight teeth strike the work along the entire tooth at once, giving intermittent impact, vibration and higher power; suited to wide, rough or light flat passes. Helical cutter: teeth engage progressively (gradual entry), so cutting is smooth, quiet and continuous with less shock and power and a better finish; ideal for uneven or interrupted surfaces and tough materials.', slide: 65, qs: ['2009-10_6a', '2013-14_6c'] },
    ];

    let mode = 'all', ph = 0;
    function layout() {
      const cmpMode = mode === 'plain-vs-helical';
      cmp.visible = cmpMode;
      platter.visible = true;
      for (const it of items) {
        if (!cmpMode) {
          it.g.visible = true;
          it.g.position.set(...it.home);
        } else if (it.id === 'plain') {
          it.g.visible = true;
          it.g.position.set(-2.6, 0, 1.0);
        } else if (it.id === 'helical-right') {
          it.g.visible = true;
          it.g.position.set(2.6, 0, 1.0);
        } else it.g.visible = false;
      }
    }
    layout();

    return {
      root, parts, modes,
      setMode(id) { mode = id; ph = 0; layout(); },
      update(dt) {
        ph += dt;
        for (const it of items) it.spin.rotation.y = ph * 1.1 * (it.disc ? 1 : -1);
        if (mode === 'plain-vs-helical') {
          // plain: contact pulse once per tooth pass; helical: contact point sweeps along width
          const pulse = (ph * 1.1 * 16 / (Math.PI * 2)) % 1;
          impact.scale.set(1, 1, pulse < 0.25 ? 1 : 0.05);
          gradual.position.z = 3.2 + Math.sin(ph * 3) * 0.95;
        }
      },
      readout() {
        return [['View', mode === 'all' ? 'cutter gallery' : 'plain vs helical'], ['Cutters shown', String(mode === 'all' ? items.length : 2)]];
      },
      legend: [['V', 'cutters spin about their own axes']],
    };
  },
};
