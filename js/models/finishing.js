import * as THREE from 'three';
import { M, box, cyl, at, group, arrow, spinArrow } from '../kit.js';

const ss = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const TAU = Math.PI * 2;

export default {
  id: 'finishing',
  title: 'Precision & non-precision finishing',
  subtitle: 'Lapping, honing, superfinishing, polishing, buffing, power brushing and tumbling',
  camera: { position: [7, 6.5, 9], target: [0, 1.6, 0] },
  build() {
    const root = new THREE.Group();
    root.add(at(box(11, 0.3, 9, M.castIron), 0, 0.15, 0));
    const scenes = {};
    const parts = [];
    const dm = new THREE.Object3D();
    const addPart = (scene, id, name, object, desc, slide, qs = []) => parts.push({ id: `${scene}-${id}`, name, object, desc, slide, qs, scene });
    const mk = (id) => { const g = new THREE.Group(); g.visible = false; scenes[id] = g; root.add(g); return g; };
    const anim = {};

    // ---------------- lapping ----------------
    {
      const g = mk('lapping');
      const plate = new THREE.Group();
      plate.add(at(cyl(3.2, 0.3, M.castIron, { seg: 64 }), 0, 0, 0));
      for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; const gr = box(2.9, 0.02, 0.05, M.black); gr.position.set(0, 0.16, 0); gr.rotation.y = a / 2; plate.add(gr); }
      plate.position.y = 0.45;
      const slurry = at(cyl(3.1, 0.04, M.oil, { seg: 64 }), 0, 0.62, 0);
      const rings = [], works = [];
      const ringG = new THREE.Group(), workG = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * TAU, x = Math.cos(a) * 1.7, z = Math.sin(a) * 1.7;
        const ring = at(cyl(0.95, 0.25, M.steel, { seg: 40, open: true }), x, 0.78, z);
        const w = at(cyl(0.45, 0.2, M.work, { seg: 24 }), x, 0.76, z);
        const w2 = at(cyl(0.3, 0.2, M.work, { seg: 24 }), x + 0.05, 0.76, z + 0.05);
        w2.position.set(x + 0.55, 0.76, z + 0.1);
        ringG.add(ring); workG.add(w, w2); rings.push(ring); works.push(w, w2);
      }
      const rollers = group(at(cyl(0.08, 0.5, M.chrome, { seg: 10 }), 0, 1.0, 3.3), at(cyl(0.08, 0.5, M.chrome, { seg: 10 }), 3.3, 1.0, 0));
      g.add(plate, slurry, ringG, workG, rollers, at(spinArrow(3.45, M.vColor, { axis: 'y', arc: 1.6 }), 0, 1.3, 0));
      addPart('lapping', 'plate', 'Lap plate', plate, 'Flat lap of cast iron or copper, softer than the work, rotated under the work pieces. Abrasive is charged into its surface.', 87, ['2020-21_2b']);
      addPart('lapping', 'slurry', 'Abrasive slurry', slurry, 'Abrasive (120 grit to finest powder) carried between lap and work in a vehicle such as grease, oil or water.', 87);
      addPart('lapping', 'rings', 'Conditioning rings', ringG, 'Rings hold the pieces and keep the lap flat as they rotate over it.', 87);
      addPart('lapping', 'work', 'Work pieces', workG, 'Less than 0.025 mm is removed. Used for gauge blocks and liquid-tight seals.', 88);
      anim.lapping = (t) => { plate.rotation.y = t * 0.5; ringG.children.forEach((r, i) => { r.rotation.y = -t * 0.9; }); workG.rotation.y = 0; };
    }

    // ---------------- honing ----------------
    const NH = 360, HR = 1.25, HY = 3.0;
    let hatchMesh, honeHead, honeState = { n: 0 }, stonesG;
    {
      const g = mk('honing');
      const sh = new THREE.CylinderGeometry(HR + 0.02, HR + 0.02, 3.4, 48, 1, true, Math.PI / 2, Math.PI);
      const wallMat = M.work.clone(); wallMat.side = THREE.DoubleSide;
      const wall = new THREE.Mesh(sh, wallMat); wall.position.y = 0.3 + 1.7;
      const og = new THREE.CylinderGeometry(HR + 1.0, HR + 1.0, 3.4, 48, 1, true, Math.PI / 2, Math.PI);
      const outer = new THREE.Mesh(og, M.paintLight.clone()); outer.material.side = THREE.DoubleSide; outer.position.y = wall.position.y;
      const cutL = new THREE.Mesh(new THREE.BoxGeometry(1.0, 3.4, 0.02), M.steel); cutL.position.set(HR + 0.5, wall.position.y, 0);
      const cutR = cutL.clone(); cutR.position.x = -(HR + 0.5);
      const block = group(wall, outer, cutL, cutR);
      hatchMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.35, 0.012, 0.012), M.black, NH);
      hatchMesh.frustumCulled = false;
      const bas = new THREE.Matrix4(), X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), P = new THREE.Vector3();
      for (let i = 0; i < NH; i++) {
        const th = Math.PI / 2 + ((i * 0.6180339) % 1) * Math.PI, y = HY - 1.4 + ((i * 0.381966 + 0.13) % 1) * 2.8;
        const n = P.set(Math.sin(th), 0, Math.cos(th));
        const t = X.set(Math.cos(th), 0, -Math.sin(th));
        const b = (i % 2 ? 1 : -1) * 0.6;
        const d = new THREE.Vector3().copy(t).multiplyScalar(Math.cos(b)).add(new THREE.Vector3(0, Math.sin(b), 0));
        Y.copy(n); Z.crossVectors(d, Y);
        bas.makeBasis(d, Y, Z);
        bas.setPosition(Math.sin(th) * (HR + 0.005), y, Math.cos(th) * (HR + 0.005));
        hatchMesh.setMatrixAt(i, bas);
      }
      hatchMesh.count = 0;
      honeHead = new THREE.Group();
      const spindle = at(cyl(0.12, 3.0, M.steel, { seg: 12 }), 0, 1.6, 0);
      const body = at(cyl(0.5, 1.2, M.darkSteel, { seg: 24 }), 0, 0, 0);
      stonesG = new THREE.Group();
      const NS = 5;
      for (let i = 0; i < NS; i++) {
        const holder = box(0.12, 1.1, 0.1, M.darkSteel), stone = at(box(0.16, 1.0, 0.18, M.abrasive), 0, 0, 0);
        const s = group(holder, at(stone, 0.12, 0, 0)); s.userData.a = (i / NS) * TAU; stonesG.add(s);
      }
      honeHead.add(spindle, body, stonesG);
      g.add(block, hatchMesh, honeHead, at(spinArrow(0.8, M.vColor, { axis: 'y', arc: 1.6 }), 0, 5.2, 0), arrow([1.6, 3.0, 1.8], [0, 1, 0], 0.9, M.fColor));
      addPart('honing', 'bore', 'Cylinder bore (cut-away)', block, 'Round hole being finished, e.g. engine cylinder, gear bore, gun barrel or ring gauge.', 89, ['2013-14_5d', '2018-19_7a']);
      addPart('honing', 'stones', 'Honing stones', stonesG, 'Common abrasive and bond (80-600 grit), equally spaced round the tool; sulphur, resin or wax in the bond modifies the cutting action. Expanded by a cone or wedge.', 89, ['2011-12_7c', '2013-14_5d', '2015-16_4b', '2018-19_7a', '2020-21_2b']);
      addPart('honing', 'head', 'Honing head / holder', honeHead, 'Holder with a cone or wedge that expands the stones, actuated from the machine control. It is rotated and reciprocated together.', 89, ['2015-16_4b']);
      addPart('honing', 'hatch', 'Cross-hatch pattern', hatchMesh, 'Rotation plus reciprocation leaves the characteristic cross-hatch on the bore wall.', 89, ['2013-14_5d']);
      anim.honing = (t) => {
        const ph = t % 20, prog = Math.min(1, ph / 16);
        hatchMesh.count = Math.floor(NH * prog * (1 - ss((ph - 18.3) / 1.5)));
        honeHead.position.y = HY + 0.9 * Math.sin(t * 1.6);
        honeHead.rotation.y = t * 3;
        const ex = 0.62 + 0.5 * ss(Math.min(1, ph / 2));
        stonesG.children.forEach((s) => { const a = s.userData.a; s.position.set(Math.cos(a) * ex, 0, Math.sin(a) * ex); s.rotation.y = -a; });
        honeState.n = prog;
      };
    }

    // ---------------- superfinishing ----------------
    let sfStone, sfShaft;
    {
      const g = mk('superfinishing');
      sfShaft = new THREE.Group();
      sfShaft.add(at(cyl(0.8, 6, M.steel, { axis: 'x', seg: 40 }), 0, 0, 0));
      for (let i = 0; i < 5; i++) sfShaft.add(at(box(5.8, 0.03, 0.1, M.darkSteel), 0, 0.8, 0).rotateX((i / 5) * TAU) && sfShaft.children[sfShaft.children.length - 1]);
      sfShaft.position.y = 1.5;
      const film = at(cyl(0.83, 0.9, M.fluid, { axis: 'x', seg: 32 }), 0, 1.5, 0);
      sfStone = group(at(box(0.7, 0.45, 0.5, M.abrasive), 0, 0, 0), at(box(0.9, 0.35, 0.7, M.darkSteel), 0, 0.4, 0), at(cyl(0.06, 1.0, M.steel, { seg: 8 }), 0, 1.1, 0));
      sfStone.position.y = 2.55;
      const nozzle = group(at(cyl(0.05, 1.0, M.chrome, { seg: 8 }), 0.9, 3.4, 0.8), at(cyl(0.12, 0.3, M.fluid, { rTop: 0.02, seg: 12 }), 0.9, 2.85, 0.8));
      nozzle.rotation.z = 0;
      g.add(sfShaft, film, sfStone, nozzle, arrow([-2.8, 3.0, 0], [1, 0, 0], 0.8, M.fColor), arrow([1.5, 4.0, 0], [0, -1, 0], 0.9, M.dColor), at(spinArrow(1.1, M.vColor, { axis: 'x', arc: 1.6 }), 3.3, 1.5, 0));
      addPart('superfinishing', 'stone', 'Superfinishing stone', sfStone, 'Fine stone pressed lightly (0.07-0.28 MPa) and oscillated with rapid short strokes (over 400 per minute, under 6.35 mm).', 90, ['2011-12_7d', '2020-21_2b', '2018-19_7a', '2015-16_4b']);
      addPart('superfinishing', 'shaft', 'Rotating shaft (work)', sfShaft, 'Work rotates while the stone oscillates, so a single grit never travels the same path twice. Less than 0.05 mm is removed.', 90, ['2011-12_7d']);
      addPart('superfinishing', 'lube', 'Lubricant film', film, 'Copious low-viscosity lubricant floods the surface: it separates stone and work once peaks are cut, keeps temperature uniform and washes chips away.', 90, ['2011-12_7d']);
      addPart('superfinishing', 'nozzle', 'Coolant nozzle', nozzle, 'Supplies the flood of lubricant-coolant.', 90);
      anim.superfinishing = (t) => { sfShaft.rotation.x = t * 2.5; sfStone.position.x = 0.22 * Math.sin(t * 9); };
    }

    // ---------------- polishing / buffing / brushing (wheel scenes) ----------------
    let polWheel, bufWheel, brush, burr, polPart, bufPart, brPart;
    {
      const g = mk('polishing');
      polWheel = new THREE.Group();
      polWheel.add(at(cyl(1.5, 0.7, M.paintLight, { axis: 'z', seg: 48 }), 0, 0, 0), at(cyl(1.55, 0.72, M.abrasive, { axis: 'z', seg: 48, open: true }), 0, 0, 0), at(cyl(0.3, 0.9, M.darkSteel, { axis: 'z', seg: 16 }), 0, 0, 0));
      polWheel.position.set(0, 3.0, 0);
      polPart = at(box(2.6, 0.4, 1.0, M.work), 0, 1.0, 0);
      const fix = at(box(3.2, 0.5, 1.5, M.darkSteel), 0, 0.55, 0);
      g.add(polWheel, polPart, fix, at(spinArrow(1.9, M.vColor, { axis: 'z', arc: 1.6 }), 0, 3.0, 0.5), arrow([-2.6, 1.55, 1.0], [1, 0, 0], 0.9, M.fColor));
      addPart('polishing', 'wheel', 'Polishing wheel', polWheel, 'Wheel of cloth, felt, rubber or leather with abrasive glued on its periphery.', 92);
      addPart('polishing', 'work', 'Work piece', polPart, 'Removes scratches, tool marks and pits; accuracy is not important. Gives a smooth, bright or mirror-like surface.', 92);
      anim.polishing = (t) => { polWheel.rotation.z = -t * 3; polPart.position.x = 0.5 * Math.sin(t * 0.8); };
    }
    {
      const g = mk('buffing');
      bufWheel = new THREE.Group();
      for (let i = -2; i <= 2; i++) bufWheel.add(at(cyl(1.5, 0.14, M.white, { axis: 'z', seg: 48 }), 0, 0, i * 0.15));
      for (const r of [0.6, 0.9, 1.2]) { const st = new THREE.Mesh(new THREE.TorusGeometry(r, 0.015, 6, 48), M.black); st.position.z = 0.43; bufWheel.add(st); }
      bufWheel.add(at(cyl(0.25, 1.1, M.darkSteel, { axis: 'z', seg: 16 }), 0, 0, 0));
      bufWheel.position.set(0, 3.0, 0);
      const compound = at(box(0.3, 0.3, 0.8, M.amber), 1.8, 3.0, 0.6);
      bufPart = at(cyl(0.7, 0.3, M.chrome, { seg: 32 }), 0, 1.15, 0);
      g.add(bufWheel, compound, bufPart, at(box(2.4, 0.5, 1.5, M.darkSteel), 0, 0.55, 0), at(spinArrow(1.9, M.vColor, { axis: 'z', arc: 1.6 }), 0, 3.0, 0.7));
      addPart('buffing', 'wheel', 'Buffing wheel', bufWheel, 'Revolving wheel of layers of linen, cotton, broadcloth or canvas, stitched together.', 93);
      addPart('buffing', 'compound', 'Abrasive compound', compound, 'Very fine abrasive in a vehicle charges the wheel and removes a minute amount of metal.', 93);
      addPart('buffing', 'work', 'Work piece', bufPart, 'Very fine scratches, oxide or similar coatings are removed. Done by hand or machine.', 93);
      anim.buffing = (t) => { bufWheel.rotation.z = -t * 3; bufPart.rotation.y = t * 0.8; };
    }
    const NB = 180;
    {
      const g = mk('power-brushing');
      brush = new THREE.Group();
      brush.add(at(cyl(0.7, 0.6, M.darkSteel, { axis: 'z', seg: 24 }), 0, 0, 0));
      const bris = new THREE.InstancedMesh(new THREE.BoxGeometry(0.02, 0.8, 0.02), M.steel, NB);
      for (let i = 0; i < NB; i++) {
        const a = (i / 30) * TAU, z = ((i % 6) - 2.5) * 0.09;
        dm.position.set(Math.cos(a) * 1.1, Math.sin(a) * 1.1, z); dm.rotation.set(0, 0, a - Math.PI / 2); dm.scale.setScalar(1); dm.updateMatrix();
        bris.setMatrixAt(i, dm.matrix);
      }
      bris.frustumCulled = false;
      brush.add(bris); brush.position.set(0, 3.0, 0);
      brPart = new THREE.Group();
      brPart.add(at(box(3.2, 0.9, 1.0, M.work), 0, 0, 0));
      burr = at(box(3.0, 0.12, 0.14, M.workCut), 0, 0.5, 0.4);
      brPart.add(burr);
      brPart.position.set(0, 1.45, 0);
      g.add(brush, brPart, at(box(3.6, 0.5, 1.5, M.darkSteel), 0, 0.55, 0), at(spinArrow(1.5, M.vColor, { axis: 'z', arc: 1.6 }), 0, 3.0, 0.7));
      addPart('power-brushing', 'brush', 'Wire brush', brush, 'High-speed revolving brush used to improve appearance.', 94);
      addPart('power-brushing', 'work', 'Work piece edge', brPart, 'Removes sharp edges, burrs, fins and particles; may be refined to about 5 micro-inch.', 94);
      anim['power-brushing'] = (t) => { brush.rotation.z = -t * 6; const p = (t % 8) / 8; const k = 1 - 0.95 * ss(p / 0.8) + 0.05; burr.scale.set(1, Math.max(k, 0.05), Math.max(k, 0.05)); burr.visible = p < 0.95; };
    }

    // ---------------- tumbling ----------------
    const NM = 70, NP = 10, TR = 2.0;
    let barrel, media, pieces;
    const loc = [];
    {
      const g = mk('tumbling');
      barrel = new THREE.Group();
      const shell = cyl(TR, 3.0, M.glass, { axis: 'z', seg: 8, open: true }); shell.material = M.glass.clone(); shell.material.side = THREE.DoubleSide;
      barrel.add(shell, at(cyl(TR + 0.02, 0.08, M.steel, { axis: 'z', seg: 8 }), 0, 0, 1.5), at(cyl(TR + 0.02, 0.08, M.steel, { axis: 'z', seg: 8 }), 0, 0, -1.5));
      barrel.position.set(0, 2.9, 0);
      media = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.17, 0), M.abrasive, NM);
      pieces = new THREE.InstancedMesh(new THREE.BoxGeometry(0.4, 0.28, 0.28), M.work, NP);
      for (let i = 0; i < NM + NP; i++) {
        const r = Math.sqrt((i * 0.754877 % 1)) * (TR - 0.3), a = Math.PI + ((i * 0.618) % 1) * Math.PI;
        loc.push({ x: Math.cos(a) * r * 0.9, y: Math.sin(a) * r * 0.5 - 0.5, z: (((i * 0.37) % 1) - 0.5) * 2.4, ph: i * 1.7 });
      }
      const cradle = group(at(box(0.5, 1.8, 1.0, M.paintDark), -2.5, 0.9, 1.4), at(box(0.5, 1.8, 1.0, M.paintDark), 2.5, 0.9, 1.4), at(box(0.5, 1.8, 1.0, M.paintDark), -2.5, 0.9, -1.4), at(box(0.5, 1.8, 1.0, M.paintDark), 2.5, 0.9, -1.4));
      g.add(barrel, media, pieces, cradle, at(spinArrow(2.6, M.vColor, { axis: 'z', arc: 1.4 }), 0, 2.9, 1.7));
      addPart('tumbling', 'barrel', 'Rotating barrel', barrel, 'Barrel rotated slowly for 1 to 10 hours; water with detergent, rust preventive or lubricant is added.', 95);
      addPart('tumbling', 'media', 'Abrasive media', media, 'Sawdust, wood chips, natural stones, cinders, sand or metal slugs give the brushing action.', 95);
      addPart('tumbling', 'work', 'Work pieces', pieces, 'Removes burrs, fins, scale and sharp edges, cleans castings and forgings. Economical for medium and large quantities, but slow.', 95);
      anim.tumbling = (t) => {
        barrel.rotation.z = t * 0.35;
        const rock = 0.55 * Math.sin(t * 0.7), c = Math.cos(rock), s = Math.sin(rock);
        for (let i = 0; i < NM + NP; i++) {
          const o = loc[i];
          const lx = o.x + 0.12 * Math.sin(t * 1.3 + o.ph), ly = o.y + 0.1 * Math.sin(t * 1.1 + o.ph * 1.3);
          dm.position.set(lx * c - ly * s, 2.9 + lx * s + ly * c, o.z);
          dm.rotation.set(t * 0.6 + o.ph, t * 0.4, t * 0.8 + o.ph); dm.scale.setScalar(1); dm.updateMatrix();
          if (i < NM) media.setMatrixAt(i, dm.matrix); else pieces.setMatrixAt(i - NM, dm.matrix);
        }
        media.instanceMatrix.needsUpdate = true; pieces.instanceMatrix.needsUpdate = true;
      };
    }

    // ---------------- modes ----------------
    const modes = [
      { id: 'lapping', label: 'Lapping', slide: 87, qs: ['2020-21_2b'], info: 'Mostly for outside surfaces. A lap of cast iron, cloth or copper, softer than the work, is rotated over it with abrasive (120 grit to finest powder) carried in grease, oil or water; less than 0.025 mm is removed. Advantages: removes grinding scratches, any hardness can be lapped, by hand or machine. Slow, and abrasive embeds in soft work. Used for gauge blocks and liquid-tight seals.' },
      { id: 'honing', label: 'Honing', slide: 89, qs: ['2013-14_5d', '2018-19_7a', '2015-16_4b', '2011-12_7c', '2020-21_2b'], info: 'Abrading operation mostly for round holes. Stones (80-600 grit; sulphur, resin or wax in the bond modifies cutting) are equally spaced round the tool and expanded by a cone or wedge. The tool rotates and reciprocates at once, giving a cross-hatch pattern. For engine cylinders, gear bores, gun barrels and ring gauges.' },
      { id: 'superfinishing', label: 'Superfinishing', slide: 90, qs: ['2011-12_7d', '2020-21_2b', '2018-19_7a', '2015-16_4b'], info: 'Variation of honing: very light pressure 0.07-0.28 MPa, rapid short strokes (over 400 per min, under 6.35 mm), stroke path such that one grit never repeats its path, and a flood of low-viscosity lubricant. A lubricant film forms, peaks are cut, less than 0.05 mm is removed and each piece reaches the same smoothness.' },
      { id: 'polishing', label: 'Polishing', slide: 92, qs: [], info: 'Non-precision. Wheel of cloth, felt, rubber or leather with abrasive glued on. Appreciable metal is removed to take out scratches, tool marks and pits; accuracy is unimportant. Improves smoothness and appearance, up to a mirror-like surface.' },
      { id: 'buffing', label: 'Buffing', slide: 93, qs: [], info: 'A polishing operation on a revolving stitched cloth wheel (linen, cotton, broadcloth, canvas) charged with very fine abrasive in a vehicle. Removes very fine scratches, oxide and coatings; by hand or machine.' },
      { id: 'power-brushing', label: 'Power brushing', slide: 94, qs: [], info: 'High-speed revolving wire brushes improve surface appearance and remove sharp edges, burrs, fins and particles. May be refined to about 5 micro-inch.' },
      { id: 'tumbling', label: 'Tumbling', slide: 95, qs: [], info: 'Work pieces are loaded in a barrel with abrasive media, water and detergent or rust preventive, then rotated slowly for 1-10 hours, giving a brushing action. Cleans castings and forgings, removes burrs, scale and sharp edges, relieves surface strain. Economical for medium and large quantities; slow, and loading needs attention.' },
    ];
    const rows = {
      lapping: [['Stock removed', '< 0.025 mm'], ['Abrasive', '120 grit to finest powder'], ['Lap', 'cast iron / copper / cloth (softer than work)']],
      honing: [['Stone grit', '80-600'], ['Motion', 'rotation + reciprocation'], ['Stones', '5 expanded by cone']],
      superfinishing: [['Pressure', '0.07-0.28 MPa'], ['Strokes', '> 400 /min, < 6.35 mm'], ['Stock removed', '< 0.05 mm']],
      polishing: [['Wheel', 'cloth / felt / rubber / leather + glued abrasive'], ['Accuracy', 'not important']],
      buffing: [['Wheel', 'stitched cloth + fine abrasive'], ['Removes', 'fine scratches, oxide']],
      'power-brushing': [['Speed', 'high'], ['Finish', 'down to ~5 micro-inch']],
      tumbling: [['Barrel time', '1-10 h'], ['Media', 'sawdust, stones, sand, slugs']],
    };
    let mode = 'lapping', clock = 0;
    const show = () => { for (const k in scenes) scenes[k].visible = k === mode; };
    show();
    return {
      root,
      parts: parts.map(({ scene, ...p }) => p),
      modes,
      setMode(id) { mode = id; clock = 0; show(); anim[mode](0); },
      update(dt) { clock += dt; anim[mode](clock); },
      readout() {
        const r = rows[mode].slice();
        if (mode === 'honing') r.push(['Cross-hatch', `${Math.round(honeState.n * 100)} %`]);
        return r;
      },
      legend: [['V', 'rotation / cutting motion'], ['f', 'feed / stroke'], ['d', 'pressure']],
    };
  },
};
