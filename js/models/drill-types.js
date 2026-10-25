// Drill and reamer types and their classification: slides 152-158.
import * as THREE from 'three';
import { M, box, cyl, tube, revolve, extrude, at, group } from '../kit.js';
import { buildTwistDrill } from './twist-drill.js';

const DEG = Math.PI / 180;
const dbl = (m) => { const c = m.clone(); c.side = THREE.DoubleSide; return c; };

// every builder returns { g, L }: tool along +y with its tip at y = 0, shank end at y = L
const twistTool = (o) => { const d = buildTwistDrill({ slices: 70, overlays: false, ...o }); return { g: d.root, L: d.length }; };

const builders = {
  twist: () => twistTool({ R: 0.28, bodyLen: 1.8, neck: 0.2, shankLen: 1.3, shank: 'straight' }),
  'twist-taper': () => twistTool({ R: 0.28, bodyLen: 1.6, neck: 0.2, shankLen: 1.3, shank: 'taper' }),
  'twist-lh': () => { const t = twistTool({ R: 0.28, bodyLen: 1.8, neck: 0.2, shankLen: 1.3, shank: 'straight' }); t.g.scale.x = -1; return t; },
  core: () => twistTool({ R: 0.32, bodyLen: 1.7, neck: 0.2, shankLen: 1.3, shank: 'straight', n: 3, rcF: 0.52, helix: 22, point: 150, cl: 0.95, mf: 0.1, af: 0.22 }),
  spade: () => {
    const g = new THREE.Group();
    const blade = extrude([[-0.5, 0.52], [0, 0], [0.5, 0.52], [0.5, 1.5], [-0.5, 1.5]], 0.08, M.hss);
    blade.position.y = 0;
    g.add(blade);
    g.add(at(cyl(0.2, 0.5, M.darkSteel, { rTop: 0.14, seg: 20 }), 0, 1.75, 0));
    g.add(at(cyl(0.14, 1.6, M.steel, { seg: 20 }), 0, 2.8, 0));
    g.add(at(box(0.36, 0.5, 0.12, M.darkSteel), 0, 1.55, 0)); // clamp holder
    return { g, L: 3.6 };
  },
  gun: () => {
    const g = new THREE.Group();
    const pts = [[0.05, 0]];
    for (let i = 0; i <= 24; i++) { const a = (60 + (i / 24) * 240) * DEG; pts.push([0.24 * Math.cos(a), 0.24 * Math.sin(a)]); }
    const hole = []; for (let i = 0; i < 16; i++) { const a = -(i / 16) * Math.PI * 2; hole.push([-0.1 + 0.05 * Math.cos(a), 0.05 * Math.sin(a)]); }
    g.add(extrude(pts, 2.6, M.hss, { holes: [hole], axis: 'y' }).translateY(1.3));
    g.add(at(box(0.12, 0.2, 0.16, M.carbide), 0.13, 0.1, 0)); // brazed carbide tip
    g.add(at(cyl(0.34, 1.1, M.steel, { seg: 24 }), 0, 3.15, 0));
    g.add(at(cyl(0.12, 0.35, M.fluid, { seg: 12 }), 0, 3.9, 0)); // coolant inlet
    return { g, L: 4.1 };
  },
  step: () => {
    const prof = [[0, 0], [0.12, 0.12], [0.12, 0.6], [0.2, 0.68], [0.2, 1.1], [0.28, 1.18], [0.28, 1.6], [0.36, 1.68], [0.36, 2.1], [0.3, 2.14], [0.3, 3.3], [0, 3.3]];
    const g = new THREE.Group();
    g.add(revolve(prof, M.hss, { seg: 32 }));
    for (const s of [-1, 1]) g.add(at(box(0.03, 2.0, 0.03, M.black), s * 0.2, 1.05, 0.2 * 0 + 0.0).translateZ(0));
    return { g, L: 3.3 };
  },
  centre: () => {
    const prof = [[0, 0], [0.07, 0.08], [0.07, 0.5], [0.26, 0.83], [0.26, 1.7], [0.2, 1.8], [0.2, 3.0], [0, 3.0]];
    return { g: revolve(prof, M.hss, { seg: 28 }), L: 3.0 };
  },
  auger: () => {
    const g = new THREE.Group();
    g.add(at(cyl(0.07, 2.4, M.steel, { seg: 12 }), 0, 1.7, 0));
    for (const ph of [0, Math.PI]) {
      const pts = [];
      for (let i = 0; i <= 70; i++) { const y = 0.5 + (i / 70) * 2.2; const a = ph + (y - 0.5) * 6.0; pts.push([0.24 * Math.cos(a), y, -0.24 * Math.sin(a)]); }
      g.add(tube(pts, 0.05, M.steel, { seg: 120, radial: 6 }));
      const pts2 = pts.map(([x, y, z]) => [x * 0.55, y, z * 0.55]);
      g.add(tube(pts2, 0.04, M.steel, { seg: 120, radial: 6 }));
    }
    g.add(at(cyl(0.0001, 0.5, M.steel, { rTop: 0.13, seg: 14 }), 0, 0.25, 0)); // screw lead
    for (let i = 0; i < 4; i++) g.add(at(cyl(0.135, 0.03, M.darkSteel, { seg: 14 }), 0, 0.15 + i * 0.1, 0));
    for (const s of [-1, 1]) g.add(at(box(0.05, 0.22, 0.12, M.hss), s * 0.25, 0.62, 0));
    g.add(at(cyl(0.2, 1.0, M.steel, { seg: 6 }), 0, 3.2, 0));
    return { g, L: 3.7 };
  },
  forstner: () => {
    const g = new THREE.Group();
    g.add(at(cyl(0.0001, 0.35, M.hss, { rTop: 0.07, seg: 10 }), 0, 0.175, 0));
    g.add(at(cyl(0.52, 0.1, M.hss, { seg: 40 }), 0, 0.4, 0));
    g.add(at(cyl(0.56, 0.5, dbl(M.hss), { seg: 40, open: true }), 0, 0.65, 0));
    g.add(at(box(0.5, 0.06, 0.1, M.chrome), 0.25, 0.46, 0)); // radial cutter
    g.add(at(box(0.5, 0.06, 0.1, M.chrome), -0.25, 0.46, 0));
    g.add(at(cyl(0.14, 2.9, M.steel, { seg: 20 }), 0, 2.35, 0));
    return { g, L: 3.8 };
  },
  holesaw: () => {
    const g = new THREE.Group();
    const y0 = 0.35;
    g.add(at(cyl(0.75, 0.9, dbl(M.steel), { seg: 48, open: true }), 0, y0 + 0.45, 0));
    g.add(at(cyl(0.75, 0.06, M.darkSteel, { seg: 48 }), 0, y0 + 0.9, 0));
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2;
      const tooth = cyl(0.0001, 0.12, M.steel, { rTop: 0.05, seg: 3 });
      tooth.position.set(0.75 * Math.cos(a), y0 - 0.04, 0.75 * Math.sin(a));
      g.add(tooth);
    }
    const pilot = buildTwistDrill({ R: 0.08, bodyLen: 0.9, neck: 0.05, shankLen: 0.3, shank: 'straight', slices: 40, overlays: false }).root;
    g.add(pilot);
    g.add(at(cyl(0.2, 1.2, M.steel, { seg: 6 }), 0, y0 + 0.93 + 0.6, 0));
    return { g, L: 2.5 };
  },
  'reamer-straight': () => twistTool({ R: 0.3, bodyLen: 2.0, neck: 0.15, shankLen: 1.2, shank: 'taper', helix: 0, n: 6, rcF: 0.72, cl: 0.97, mf: 0.06, af: 0.14, point: 165, slices: 30 }),
  'reamer-helical': () => twistTool({ R: 0.3, bodyLen: 2.0, neck: 0.15, shankLen: 1.2, shank: 'taper', helix: 15, n: 6, rcF: 0.72, cl: 0.97, mf: 0.06, af: 0.14, point: 165, slices: 70 }),
};

// id, name, row (0 back / 1 front), desc, slide, qs, construction, shank, flutes, hand
const ITEMS = [
  ['twist', 'Twist drill', 0, 'The most common drill: two cutting edges and two helical flutes running the length of the body, with a neck and a shank that can be straight or tapered. Straight shanks are held in a drill chuck; a tapered shank wedges into the spindle socket and its tang drives it.', 154, ['2016-17_7c', '2009-10_7b'], 0, 0, 2, 0],
  ['twist-taper', 'Taper-shank twist drill', 0, 'Taper-shank drills have a conical shank that fits directly into the tapered hole of the machine spindle, driving sleeve or socket. The shank generally ends in a driving tang that enters the slot in the socket, giving a positive drive.', 152, ['2009-10_7b'], 0, 1, 2, 0],
  ['twist-lh', 'Left-hand twist drill', 0, 'A left-hand-cut drill turns clockwise when viewed from the cutting point (i.e. anticlockwise from the shank), with a left-hand helix. The great majority of drills are right-hand cut.', 153, ['2009-10_7b'], 0, 0, 2, 1],
  ['core', 'Core drill', 0, 'Chamfered end, body, neck and shank with three or four flutes and an equal number of margins, which gives superior guidance and high accuracy. It enlarges and finishes cast, drilled or punched holes; it has no chisel edge so it cannot start a hole.', 154, ['2016-17_7c', '2009-10_7b'], 0, 1, 3, 0],
  ['spade', 'Spade drill', 0, 'Flat paddle blade with a sharp centre point that keeps it on target; used for large holes (90 mm and above). Large saving in tool cost and weight, easy to grind, and the blade is replaceable in its holder.', 154, ['2014-15_5d', '2009-10_7b'], 2, 0, 0, 0],
  ['gun', 'Gun drill', 0, 'Used for deep holes. All gun drills are straight-fluted with a single cutting edge; a hole through the body carries coolant under high pressure to the tip, which also flushes the chips out along the flute.', 155, ['2014-15_5d', '2009-10_7b'], 1, 0, 1, 0],
  ['step', 'Step drill', 0, 'A multiple-diameter drill with one set of lands ground to different diameters, so it produces a stepped hole in one pass.', 155, ['2009-10_7b'], 0, 0, 2, 0],
  ['centre', 'Centre drill', 1, 'Combined drill and countersink that gives a starting hole for a larger drill or a conical hole for a lathe centre. For merely locating a hole, a spotting drill does the job better.', 155, ['2009-10_7b', '2018-19_5b'], 0, 0, 2, 0],
  ['auger', 'Auger bit', 1, 'For boring medium and deep holes in wood, based on the Archimedes screw principle: the screw lead pulls it in and the spiral flutes carry the chips away. Driven at low speed and high torque.', 157, ['2009-10_7b'], 0, 0, 2, 0],
  ['forstner', 'Forstner bit', 1, 'Flat-bottomed bit with a centre point; the rim and the two radial cutters cut together, giving flat-bottomed, precise holes (e.g. hinge cups). Needs more pressure and costs more than other wood bits.', 157, ['2009-10_7b'], 0, 0, 0, 0],
  ['holesaw', 'Hole saw', 1, 'A short open cylinder with saw teeth on the open edge, used for relatively large holes in thin material. It cuts only at the edge and removes an intact disc rather than all the material inside the hole. The cup is replaceable on its arbor.', 157, ['2009-10_7b'], 2, 0, 0, 0],
  ['reamer-straight', 'Straight-flute reamer', 1, 'Four to eight straight flutes, i.e. cutting edges, with a very short tip that has no cutting edges. It slightly enlarges a hole to a better tolerance and surface finish. Shown with a taper shank.', 158, ['2011-12_5d', '2013-14_5c'], 0, 1, 4, 0],
  ['reamer-helical', 'Helical-flute reamer', 1, 'Same geometry as the straight reamer but with helical flutes, which cut more smoothly (especially in holes with keyways or interruptions). Four to eight flutes, short non-cutting tip, taper shank.', 158, ['2011-12_5d', '2013-14_5c'], 0, 1, 4, 0],
];

export default {
  id: 'drill-types',
  title: 'Drill & reamer types',
  subtitle: 'Gallery of drills and reamers, classified by construction, shank, flutes and hand of cut',
  camera: { position: [2, 6.2, 17], target: [0, 2.6, 0] },
  build() {
    const root = new THREE.Group();
    // rack
    const rack = new THREE.Group();
    rack.add(at(box(14.6, 0.3, 4.2, M.castIron), 0, 0.15, 0));
    rack.add(at(box(14.2, 0.9, 1.9, M.paintDark), 0, 0.75, -0.9)); // top 1.2
    rack.add(at(box(14.2, 0.45, 1.9, M.paint), 0, 0.525, 1.0)); // top 0.75
    root.add(rack);
    const topY = [1.2, 0.75];
    const zRow = [-0.9, 1.0];
    const counts = [0, 0];
    const rows = [[], []];
    ITEMS.forEach((it) => rows[it[2]].push(it));
    const entries = [];
    const parts = [];
    rows.forEach((row, ri) => {
      row.forEach((it, i) => {
        const [id, name, , desc, slide, qs, cons, shk, flt, hand] = it;
        const x = -5.7 + i * 1.9 + (ri === 1 ? 0.95 : 0);
        counts[ri]++;
        const { g: tool, L } = builders[id]();
        const spin = new THREE.Group();
        spin.add(tool);
        const flip = new THREE.Group();
        flip.rotation.x = Math.PI;
        flip.position.y = L;
        flip.add(spin);
        const item = new THREE.Group();
        item.position.set(x, topY[ri], zRow[ri]);
        item.add(flip);
        root.add(item);
        item.add(at(cyl(0.34, 0.03, M.black, { seg: 20 }), 0, 0.0, 0));
        entries.push({ id, item, spin, base: topY[ri], lift: 0, target: 0, cons, shk, flt, hand, dir: hand ? 1 : -1 });
        parts.push({ id, name, object: item, desc, slide, qs, anchor: [x, topY[ri] + L + 0.1, zRow[ri]], explode: [0, 0.8, 0] });
      });
    });

    const names = {};
    ITEMS.forEach((it) => (names[it[0]] = it[1]));
    const list = (arr) => arr.map((id) => names[id]).join(', ');
    const MODES = {
      all: () => 0,
      construction: (e) => e.cons,
      shank: (e) => e.shk,
      flutes: (e) => ({ 0: 0, 1: 1, 2: 2, 3: 3, 4: 4 }[e.flt]),
      hand: (e) => e.hand,
    };
    const modes = [
      { id: 'all', label: 'All types', info: 'Gallery of drills and reamers for drilling and reaming operations. Click a tool for its properties and use; pick a classification to raise the tools of each class.', slide: 154, qs: ['2009-10_7b'] },
      { id: 'construction', label: 'By construction', info: `Classified by construction. Low row: solid drills made of one piece, e.g. HSS (${list(['twist', 'core', 'step', 'centre', 'auger', 'forstner', 'reamer-straight'])}). Middle: tipped solid drills have a body of one material with lips of another brazed in place (${list(['gun'])} with brazed carbide tip). Highest: composite drills have cutting portions mechanically held in place (${list(['spade', 'holesaw'])}).`, slide: 152, qs: ['2009-10_7b'] },
      { id: 'shank', label: 'By shank', info: `Classified by method of holding or driving. Straight-shank drills have cylindrical shanks (with or without flats, tang, grooves or threads); they are held in a chuck. Taper-shank drills (raised: ${list(['twist-taper', 'reamer-straight', 'reamer-helical'])}) have conical shanks that fit directly into tapered holes in the spindle, sleeves or sockets, usually with a driving tang.`, slide: 152, qs: ['2009-10_7b'] },
      { id: 'flutes', label: 'By flutes', info: 'Classified by number of flutes. Single-flute drills (gun drill) originate holes; two-flute drills are the conventional twist drills used to originate holes; three- and four-flute drills are core drills used to enlarge and finish drilled, cast or punched holes (they will not produce original holes). Reamers carry four to eight flutes. Heights: 0 none, 1 single, 2 two, 3 three, 4 four to eight.', slide: 153, qs: ['2009-10_7b', '2016-17_7c'] },
      { id: 'hand', label: 'By hand of cut', info: 'Classified by hand of cut. A right-hand drill turns counterclockwise when viewed from the cutting point; the great majority of drills are right hand. A left-hand drill turns clockwise viewed from the cutting point (raised tool).', slide: 153, qs: ['2009-10_7b'] },
    ];
    let mode = 'all';
    const setMode = (id) => {
      mode = id;
      const f = MODES[id] ?? MODES.all;
      for (const e of entries) { e.target = f(e) * 0.7; }
    };
    setMode('all');

    return {
      root,
      parts,
      modes,
      setMode,
      legend: [['V', 'rotation (right-hand: counterclockwise seen from the cutting point)']],
      update(dt) {
        const k = Math.min(1, dt * 4);
        for (const e of entries) {
          e.spin.rotation.y += e.dir * dt * 0.7;
          e.lift += (e.target - e.lift) * k;
          e.item.position.y = e.base + e.lift;
        }
      },
      readout() {
        return [['Classification', modes.find((m) => m.id === mode)?.label ?? '']];
      },
    };
  },
};
