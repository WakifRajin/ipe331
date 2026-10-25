import * as THREE from 'three';
import { M, box, cyl, extrude, gear, helixTeeth, revolve, at, rot, group, textSprite } from '../kit.js';

function label(text, p, size = 0.5) {
  const s = textSprite(text, { size });
  s.position.set(...p);
  return s;
}

// Every item is built lying along x (wheel along z), its lowest point at y = 0 relative to the item group.
// Returns { obj, spin } where `spin` is the sub-group to rotate and `axis` the spin axis.
function turningTool() {
  const g = new THREE.Group();
  const shank = box(2.4, 0.4, 0.4, M.hss);
  at(shank, 0, 0.2, 0);
  const head = extrude([[0, -0.2], [0.9, -0.2], [1.3, 0.35], [0.8, 0.55], [0, 0.2]], 0.4, M.hss, { axis: 'y' });
  at(head, 1.2, 0.2, 0);
  const tip = box(0.3, 0.42, 0.22, M.carbide);
  at(tip, 2.3, 0.2, 0.3);
  rot(tip, 0, 0.6, 0);
  g.add(shank, head, tip);
  return { obj: g };
}
function shaperTool() {
  const g = new THREE.Group();
  const shank = box(0.4, 1.9, 0.5, M.hss);
  at(shank, -0.4, 0.95, 0);
  const crank = box(1.0, 0.4, 0.5, M.hss);
  at(crank, 0.1, 0.2, 0);
  const tip = box(0.35, 0.22, 0.4, M.carbide);
  at(tip, 0.7, 0.14, 0);
  const clap = box(1.0, 0.6, 0.9, M.castIron);
  at(clap, -0.4, 1.7, 0);
  g.add(shank, crank, tip, clap);
  return { obj: g };
}
function boringBar() {
  const g = new THREE.Group();
  const holder = box(0.7, 0.7, 0.7, M.castIron);
  at(holder, -1.3, 0.55, 0);
  const bar = cyl(0.18, 2.6, M.steel, { axis: 'x' });
  at(bar, 0.2, 0.55, 0);
  const tip = box(0.22, 0.2, 0.2, M.carbide);
  at(tip, 1.5, 0.7, 0);
  g.add(holder, bar, tip);
  return { obj: g };
}
function millingCutter() {
  const g = new THREE.Group();
  const spin = new THREE.Group();
  spin.position.y = 0.62;
  const core = cyl(0.5, 1.3, M.steel, { axis: 'x' });
  const teeth = helixTeeth(0.58, 1.3, 10, M.carbide, { helix: 1.1, width: 0.16 });
  teeth.rotation.z = -Math.PI / 2;
  const bore = cyl(0.17, 1.34, M.black, { axis: 'x', seg: 16 });
  spin.add(core, teeth, bore);
  g.add(spin);
  return { obj: g, spin, axis: 'x' };
}
function twistDrill() {
  const g = new THREE.Group();
  const spin = new THREE.Group();
  spin.position.y = 0.22;
  const shank = cyl(0.18, 1.0, M.steel, { axis: 'x' });
  at(shank, -1.1, 0, 0);
  const body = cyl(0.2, 1.7, M.hss, { axis: 'x' });
  at(body, 0.25, 0, 0);
  const flutes = helixTeeth(0.2, 1.7, 2, M.darkSteel, { helix: 0.9, width: 0.12 });
  flutes.rotation.z = -Math.PI / 2;
  flutes.position.x = 0.25;
  const tip = cyl(0.2, 0.28, M.hss, { rTop: 0.02, axis: 'x' });
  at(tip, 1.24, 0, 0);
  spin.add(shank, body, flutes, tip);
  g.add(spin);
  return { obj: g, spin, axis: 'x' };
}
function reamer() {
  const g = new THREE.Group();
  const spin = new THREE.Group();
  spin.position.y = 0.3;
  const body = cyl(0.24, 1.6, M.steel, { axis: 'x' });
  at(body, 0.2, 0, 0);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const r = box(1.6, 0.07, 0.08, M.hss);
    at(r, 0.2, Math.cos(a) * 0.26, Math.sin(a) * 0.26);
    r.rotation.x = -a;
    spin.add(r);
  }
  const lead = cyl(0.24, 0.3, M.hss, { rTop: 0.16, axis: 'x' });
  at(lead, 1.15, 0, 0);
  const shank = cyl(0.15, 0.9, M.steel, { axis: 'x' });
  at(shank, -1.2, 0, 0);
  const tang = box(0.25, 0.2, 0.08, M.darkSteel);
  at(tang, -1.75, 0, 0);
  spin.add(body, lead, shank, tang);
  g.add(spin);
  return { obj: g, spin, axis: 'x' };
}
function broachTool() {
  const g = new THREE.Group();
  const spin = new THREE.Group();
  spin.position.y = 0.26;
  const prof = [[0, 0], [0.12, 0], [0.12, 0.6], [0.08, 0.6], [0.08, 0.8], [0.12, 0.8], [0.12, 1.0]];
  let x = 1.0;
  for (let i = 0; i < 16; i++) {
    const r = 0.14 + Math.min(i, 12) * 0.01;
    prof.push([r - 0.05, x], [r, x + 0.012], [r, x + 0.05], [r - 0.05, x + 0.11]);
    x += 0.15;
  }
  prof.push([0.15, x], [0.12, x + 0.3], [0, x + 0.3]);
  const b = revolve(prof, M.steel, { axis: 'x', seg: 24 });
  b.position.x = -1.7;
  spin.add(b);
  g.add(spin);
  return { obj: g, spin, axis: 'x' };
}
function hob() {
  const g = new THREE.Group();
  const spin = new THREE.Group();
  spin.position.y = 0.58;
  const core = cyl(0.42, 1.35, M.darkSteel, { axis: 'x' });
  spin.add(core);
  for (let i = 0; i < 14; i++) {
    const d = gear(0.58, 12, 0.08, M.hss, { axis: 'x' });
    d.position.x = -0.6 + i * 0.092;
    d.rotation.x = i * 0.16;
    spin.add(d);
  }
  const bore = cyl(0.16, 1.5, M.black, { axis: 'x', seg: 16 });
  spin.add(bore);
  g.add(spin);
  return { obj: g, spin, axis: 'x' };
}
function grindingWheel() {
  const g = new THREE.Group();
  const spin = new THREE.Group();
  spin.position.y = 1.15;
  const wheel = cyl(1.1, 0.4, M.abrasive, { axis: 'z', seg: 56 });
  const f1 = cyl(0.5, 0.1, M.steel, { axis: 'z', seg: 24 });
  f1.position.z = 0.25;
  const f2 = cyl(0.5, 0.1, M.steel, { axis: 'z', seg: 24 });
  f2.position.z = -0.25;
  const nut = cyl(0.18, 0.7, M.darkSteel, { axis: 'z', seg: 16 });
  const mark = box(0.5, 0.06, 0.42, M.paintLight);
  at(mark, 0.8, 0, 0);
  spin.add(wheel, f1, f2, nut, mark);
  g.add(spin);
  return { obj: g, spin, axis: 'z' };
}
function honingHead() {
  const g = new THREE.Group();
  const spin = new THREE.Group();
  spin.position.y = 0.55;
  const mandrel = cyl(0.3, 2.0, M.darkSteel, { axis: 'x' });
  spin.add(mandrel);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const s = box(1.2, 0.1, 0.24, M.abrasive);
    at(s, 0, Math.cos(a) * 0.4, Math.sin(a) * 0.4);
    s.rotation.x = -a;
    spin.add(s);
  }
  for (const xx of [-0.7, 0.7]) {
    const c = cyl(0.36, 0.1, M.steel, { axis: 'x' });
    at(c, xx, 0, 0);
    spin.add(c);
  }
  const rod = cyl(0.08, 1.0, M.steel, { axis: 'x' });
  at(rod, -1.5, 0, 0);
  spin.add(rod);
  g.add(spin);
  return { obj: g, spin, axis: 'x' };
}

const ITEMS = [
  // single point (front row)
  { id: 'turning-tool', name: 'Single-point turning tool', row: 's', x: -3.6, make: turningTool, tag: '1 edge', slide: 9, qs: ['2022-23_5a', '2020-21_1a'],
    desc: 'The standard single-point tool: one main cutting edge removes material in one pass. Used for turning on a lathe; carbide tips or inserts may be brazed or clamped on.' },
  { id: 'shaper-tool', name: 'Shaper / planer tool', row: 's', x: 0.2, make: shaperTool, tag: '1 edge', slide: 9, qs: ['2022-23_5a'],
    desc: 'A forged, cranked single-point tool used on shapers, planers and slotters. The bend lets it spring away from the work on the return stroke instead of digging in.' },
  { id: 'boring-bar', name: 'Boring bar', row: 's', x: 4.0, make: boringBar, tag: '1 edge', slide: 9, qs: ['2022-23_5a'],
    desc: 'A single-point tool on a bar that enlarges or finishes an existing hole. It is another example of a single-point cutting tool.' },
  // multi point (back row)
  { id: 'milling-cutter', name: 'Milling cutter', row: 'm', x: -8.6, make: millingCutter, tag: '4-12 teeth', slide: 10, qs: ['2020-21_1a'],
    desc: 'The common multi-point tool. It has several teeth (about 4 to 12 or more), each cutting for part of a revolution and then leaving the cut to cool.' },
  { id: 'twist-drill', name: 'Twist drill', row: 'm', x: -5.7, make: twistDrill, tag: '2 lips', slide: 10, qs: ['2020-21_1a'],
    desc: 'Two cutting lips and helical flutes make a round hole in solid metal. The flutes carry chips out and let coolant in.' },
  { id: 'reamer', name: 'Reamer', row: 'm', x: -3.0, make: reamer, tag: '6-8 flutes', slide: 10, qs: ['2020-21_1a'],
    desc: 'A multi-point tool with straight or helical flutes. It removes a very small allowance from a drilled hole to give an accurate size and a good finish.' },
  { id: 'broach', name: 'Broach', row: 'm', x: 0.3, make: broachTool, tag: 'many teeth', slide: 10, qs: ['2015-16_4a', '2011-12_7b', '2020-21_1a'],
    desc: 'A long bar of successive teeth, each slightly higher than the last. One pass gives the whole internal or external shape (keyway, spline, square hole).' },
  { id: 'hob', name: 'Hob', row: 'm', x: 3.3, make: hob, tag: 'many teeth', slide: 10, qs: ['2020-21_1a'],
    desc: 'A worm-like multi-point cutter used for hobbing gears. Rows of teeth form a helical thread cut with gashes, and it generates the tooth form as it rotates.' },
  { id: 'grinding-wheel', name: 'Grinding wheel', row: 'm', x: 6.4, make: grindingWheel, tag: 'millions of grains', slide: 10, qs: ['2020-21_1a'],
    desc: 'An abrasive cutter. Countless hard grains act as tiny cutting edges that continuously engage and wear away, giving fine finish and high accuracy.' },
  { id: 'honing-head', name: 'Honing stone / head', row: 'm', x: 9.3, make: honingHead, tag: 'abrasive sticks', slide: 10, qs: ['2020-21_1a'],
    desc: 'A head carrying several abrasive stones that expand against a bore while it rotates and reciprocates. It corrects bore geometry and gives a cross-hatch finish.' },
];

export default {
  id: 'multi-point-tools',
  title: 'Single vs multi-point tools',
  subtitle: 'Cutting tools grouped by the number of cutting edges',
  camera: { position: [1, 11, 19], target: [0.5, 1, 0] },
  build() {
    const root = new THREE.Group();
    const zRow = { s: 2.6, m: -2.6 };
    const slabS = box(13, 0.15, 3.6, M.paintDark);
    at(slabS, -0.1, 0.075, zRow.s);
    const slabM = box(22, 0.15, 3.6, M.paint);
    at(slabM, 0.2, 0.075, zRow.m);
    root.add(slabS, slabM);
    root.add(label('Single point', [-5.4, 0.9, zRow.s + 2.4], 0.7));
    root.add(label('Multi point', [-9.6, 0.9, zRow.m + 2.4], 0.7));

    const parts = [];
    const spinners = [];
    const tags = new THREE.Group();
    for (const it of ITEMS) {
      const r = it.make();
      const holder = new THREE.Group();
      holder.position.set(it.x, 0.15, zRow[it.row]);
      holder.add(r.obj);
      root.add(holder);
      if (r.spin) spinners.push({ s: r.spin, axis: r.axis, w: it.id === 'grinding-wheel' ? 1.4 : 2.0 });
      const tg = label(it.tag, [it.x, 3.3, zRow[it.row]], 0.4);
      tags.add(tg);
      parts.push({ id: it.id, name: it.name, object: holder, desc: it.desc, slide: it.slide, qs: it.qs, anchor: [it.x, 1.6, zRow[it.row]] });
    }
    tags.visible = false;
    root.add(tags);

    // load-sharing demo for compare mode
    const demo = new THREE.Group();
    demo.visible = false;
    const oneBar = box(0.5, 1, 0.5, M.amber);
    at(oneBar, -5.4, 0.5, 6.0);
    demo.add(oneBar);
    demo.add(label('All the load on one edge', [-5.4, 3.1, 6.0], 0.38));
    const bars = [];
    for (let i = 0; i < 8; i++) {
      const b = box(0.5, 1, 0.5, M.amber);
      at(b, 2.0 + i * 0.75, 0.15, 6.0);
      demo.add(b);
      bars.push(b);
    }
    demo.add(label('Load shared by many teeth', [4.8, 3.1, 6.0], 0.38));
    root.add(demo);

    const modes = [
      { id: 'gallery', label: 'Gallery', slide: 10, qs: ['2020-21_1a', '2022-23_5a'],
        info: 'Single-point tools have one main cutting edge: turning, shaping, planing, slotting and boring tools. Multi-point tools have two or more cutting edges: milling cutters, drills, reamers, broaches, hobs, grinding wheels and honing stones. In insert-type tools several corners exist but only one engages at a time.' },
      { id: 'compare', label: 'Compare', slide: 13, qs: ['2020-21_1a'],
        info: 'Single-point: simple and cheap to make, easy to regrind or replace, flexible for many shapes. But only one edge cuts, so material removal rate is low and the whole load falls on one edge. Multi-point: much higher removal rate, load shared by many teeth so each wears slowly, longer tool life and better finish. But they cost more, are complex to regrind and are usually made for one job.' },
    ];
    let mode = 'gallery';
    let tm = 0;
    return {
      root,
      parts,
      modes,
      setMode(id) {
        mode = id;
        tm = 0;
        tags.visible = demo.visible = id === 'compare';
      },
      update(dt) {
        tm += dt;
        for (const sp of spinners) sp.s.rotation[sp.axis] += dt * sp.w;
        if (mode === 'compare') {
          const p = (Math.sin(tm * 3) + 1) / 2;
          const h1 = 1.6 + 0.8 * p;
          oneBar.scale.y = h1;
          oneBar.position.y = h1 / 2;
          for (let i = 0; i < bars.length; i++) {
            const h = 0.3 + 0.2 * ((Math.sin(tm * 3 + i * 0.8) + 1) / 2);
            bars[i].scale.y = h;
            bars[i].position.y = h / 2;
          }
        }
      },
      readout() {
        return mode === 'compare'
          ? [['Single point', '1 edge, low MRR'], ['Multi point', 'load shared, high MRR']]
          : [['Single point', '3 tools'], ['Multi point', '7 tools']];
      },
    };
  },
};
