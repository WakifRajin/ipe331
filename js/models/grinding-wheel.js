import * as THREE from 'three';
import { M, box, cyl, extrude, at, group } from '../kit.js';

const ss = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const lerp = (a, b, t) => a + (b - a) * t;

function rod(a, b, r, mat) {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, va.distanceTo(vb), 8), mat);
  m.position.copy(va).add(vb).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.sub(va).normalize());
  return m;
}

// Irregular polyhedron (jittered icosahedron) used for abrasive grains.
function grainGeometry() {
  const g = new THREE.IcosahedronGeometry(1, 0);
  const pos = g.attributes.position;
  const map = new Map();
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    const key = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
    if (!map.has(key)) map.set(key, 0.7 + Math.random() * 0.5);
    v.fromBufferAttribute(pos, i).multiplyScalar(map.get(key));
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

export default {
  id: 'grinding-wheel',
  title: 'Grinding wheel anatomy',
  subtitle: 'Cut-away wheel with a magnified view of grains, bond bridges and pores',
  camera: { position: [2.2, 4.6, 13.5], target: [1.0, 2.5, 0] },
  build() {
    const root = new THREE.Group();

    // ---------------- macro wheel ----------------
    const R = 2.2, RI = 0.62, TH = 0.8;
    const WC = [-2.6, 2.5, 0];
    const a0 = (5 * Math.PI) / 180, a1 = (295 * Math.PI) / 180;
    const pts = [];
    for (let i = 0; i <= 72; i++) { const a = lerp(a0, a1, i / 72); pts.push([Math.cos(a) * R, Math.sin(a) * R]); }
    for (let i = 0; i <= 28; i++) { const a = lerp(a1, a0, i / 28); pts.push([Math.cos(a) * RI, Math.sin(a) * RI]); }
    const body = extrude(pts, TH, M.abrasive);

    const overlayMat = M.chrome.clone();
    overlayMat.roughness = 0.15;
    overlayMat.side = THREE.DoubleSide;
    const loadMat = M.work.clone();
    loadMat.color = new THREE.Color(0x8d949a);
    loadMat.roughness = 0.65;
    loadMat.side = THREE.DoubleSide;
    const og = new THREE.CylinderGeometry(R + 0.012, R + 0.012, TH, 72, 1, true, a0 + Math.PI / 2, a1 - a0);
    og.rotateX(Math.PI / 2);
    const overlay = new THREE.Mesh(og, overlayMat);
    overlay.visible = false;

    const gGeo = grainGeometry();
    const macroMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0.1 });
    const NMAC = 640;
    const macro = new THREE.InstancedMesh(gGeo, macroMat, NMAC);
    const dm = new THREE.Object3D();
    const col = new THREE.Color();
    for (let i = 0; i < NMAC; i++) {
      let x, y, z;
      const kind = i % 4;
      if (kind === 0 || kind === 1) {
        const a = kind === 0 ? a0 : a1;
        const r = RI + 0.05 + Math.random() * (R - RI - 0.1);
        z = (Math.random() - 0.5) * (TH - 0.06);
        const nx = kind === 0 ? Math.sin(a) : -Math.sin(a);
        const ny = kind === 0 ? -Math.cos(a) : Math.cos(a);
        x = Math.cos(a) * r + nx * 0.015;
        y = Math.sin(a) * r + ny * 0.015;
      } else {
        const a = lerp(a0 + 0.03, a1 - 0.03, Math.random());
        x = Math.cos(a) * (R + 0.005);
        y = Math.sin(a) * (R + 0.005);
        z = (Math.random() - 0.5) * (TH - 0.06);
      }
      dm.position.set(x, y, z);
      dm.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      const s = 0.035 + Math.random() * 0.03;
      dm.scale.set(s, s * (0.7 + Math.random() * 0.5), s);
      dm.updateMatrix();
      macro.setMatrixAt(i, dm.matrix);
      const sh = 0.7 + Math.random() * 0.5;
      macro.setColorAt(i, col.setRGB(0.62 * sh, 0.31 * sh, 0.23 * sh));
    }

    const wheelSpin = new THREE.Group();
    wheelSpin.add(body, overlay, macro);
    const wheelBody = group(wheelSpin);

    const flange = group(
      at(cyl(1.15, 0.07, M.steel, { axis: 'z', seg: 48 }), 0, 0, TH / 2 + 0.035),
      at(cyl(1.15, 0.07, M.steel, { axis: 'z', seg: 48 }), 0, 0, -TH / 2 - 0.035),
      at(cyl(0.55, 1.1, M.darkSteel, { axis: 'z', seg: 32 }), 0, 0, 0),
      at(cyl(0.2, 0.15, M.chrome, { axis: 'z', seg: 6 }), 0, 0, TH / 2 + 0.15),
    );

    // dresser: single-point diamond, traverses across the wheel face
    const dresserTip = group(
      at(cyl(0.02, 0.3, M.carbide, { rTop: 0.1, seg: 8 }), 0, 0.15, 0),
      at(box(0.28, 0.5, 0.28, M.darkSteel), 0, 0.55, 0),
      at(box(1.2, 0.18, 0.2, M.darkSteel), 0.6, 0.9, 0),
    );
    const dresser = group(dresserTip);
    dresser.position.set(0, R + 0.01, -0.55);
    dresser.visible = false;

    const wheelG = group(wheelBody, flange, dresser);
    wheelG.position.set(...WC);
    const stand = group(
      at(box(3.4, 0.3, 2.2, M.castIron), WC[0], 0.15, 0),
      at(box(0.5, 2.3, 0.3, M.paintDark), WC[0], 1.4, 0.95),
      at(box(0.5, 2.3, 0.3, M.paintDark), WC[0], 1.4, -0.95),
      at(cyl(0.16, 2.4, M.steel, { axis: 'z', seg: 16 }), WC[0], WC[1], 0),
    );

    // ---------------- magnified inset ----------------
    const IW = 3.6, IH = 2.6, ID = 1.4;
    const NXM = 15, NYM = 11, NZM = 6, MAXG = NXM * NYM * NZM;
    const insetPos = [4.3, 2.5, 0];
    const grainMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45, metalness: 0.15 });
    const grains = new THREE.InstancedMesh(gGeo, grainMat, MAXG);
    grains.frustumCulled = false;
    const bondMat = new THREE.MeshStandardMaterial({ color: 0xdcd2bf, roughness: 0.7, metalness: 0.0 });
    const bridgeGeo = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
    const bridges = new THREE.InstancedMesh(bridgeGeo, bondMat, MAXG * 3);
    bridges.frustumCulled = false;
    const poreMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0.2 });
    const poreMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), poreMat, MAXG);
    poreMesh.frustumCulled = false;

    const rnd = (n) => Float32Array.from({ length: n }, () => Math.random() * 2 - 1);
    const jx = rnd(MAXG), jy = rnd(MAXG), jz = rnd(MAXG);
    const shade = Float32Array.from({ length: MAXG }, () => 0.75 + Math.random() * 0.4);
    const asp = Float32Array.from({ length: MAXG * 3 }, () => 0.8 + Math.random() * 0.4);
    const quats = Array.from({ length: MAXG }, () => new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6)));
    const prand = Float32Array.from({ length: MAXG }, () => Math.random());
    const gp = new Float32Array(MAXG * 3);
    const gOn = new Uint8Array(MAXG);
    const bm = new Float32Array(MAXG); // bridge multiplier per grain (1 attached, 0 released)
    const relT = new Float32Array(MAXG).fill(-1);

    const frameLines = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(IW, IH, ID)),
      new THREE.LineBasicMaterial({ color: 0xcfd6dc }),
    );
    const plate = at(box(IW + 0.2, IH + 0.2, 0.06, M.paintDark), 0, 0, -ID / 2 - 0.06);
    const slab = at(box(IW + 0.8, 0.22, ID + 0.2, M.work), 0, IH / 2 + 0.12, 0);
    const patchPos = new THREE.Vector3(WC[0] + R * Math.cos(1.05), WC[1] + R * Math.sin(1.05), 0);
    const patch = box(0.4, 0.4, TH + 0.06, M.glass);
    patch.position.copy(patchPos);
    patch.rotation.z = 1.05;
    const lens = group(
      patch,
      rod([patchPos.x + 0.15, patchPos.y + 0.1, TH / 2], [insetPos[0] - IW / 2, insetPos[1] + IH / 2, ID / 2], 0.012, M.chrome),
      rod([patchPos.x + 0.15, patchPos.y - 0.2, TH / 2], [insetPos[0] - IW / 2, insetPos[1] - IH / 2, ID / 2], 0.012, M.chrome),
    );
    const magFrame = group(frameLines, plate, slab);
    const inset = new THREE.Group();
    inset.add(magFrame, grains, bridges, poreMesh);
    inset.position.set(...insetPos);

    root.add(stand, wheelG, inset, lens);

    // ---------------- state & layout ----------------
    const S = { g: 0.15, k: 2.58, br: 0.05, glaze: 0, load: 0 };
    const Tg = { g: 0.15, k: 2.58, br: 0.05, glaze: 0, load: 0 };
    let relActive = false;
    let relTimer = 0;
    let dirty = true;
    let clock = 0;
    const cA = new THREE.Color(), cB = new THREE.Color(), cLight = new THREE.Color(0.93, 0.9, 0.84);
    const cDark = new THREE.Color(0.06, 0.07, 0.08), cSilver = new THREE.Color(0.78, 0.8, 0.82);
    const va = new THREE.Vector3(), vb = new THREE.Vector3(), vd = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const qq = new THREE.Quaternion();
    const gidx = (i, j, k) => (i * NYM + j) * NZM + k;

    function layout() {
      const g = S.g, s = S.g * S.k;
      const nx = Math.max(1, Math.min(NXM, Math.floor((IW - 2 * g) / s) + 1));
      const ny = Math.max(1, Math.min(NYM, Math.floor((IH - 2.3 * g) / s) + 1));
      const nz = Math.max(1, Math.min(NZM, Math.floor((ID - 2 * g) / s) + 1));
      const x0 = -((nx - 1) * s) / 2, z0 = -((nz - 1) * s) / 2, yTop = IH / 2 - g * 1.15;
      gOn.fill(0);
      let c = 0;
      for (let i = 0; i < nx; i++) {
        for (let j = 0; j < ny; j++) {
          for (let k = 0; k < nz; k++) {
            const id = gidx(i, j, k);
            let x = x0 + i * s + jx[id] * s * 0.1;
            let y = yTop - j * s + jy[id] * s * 0.07;
            let z = z0 + k * s + jz[id] * s * 0.1;
            let sc = 1;
            let b = 1;
            const top = j === 0;
            if (top && relT[id] >= 0) {
              const t = relT[id];
              if (t >= 0.35 && t < 2.0) {
                const e = t - 0.35;
                x += 1.3 * e; y += 1.0 * e - 1.4 * e * e; z += 0.3 * e * jz[id];
                sc = t < 0.8 ? 1 : Math.max(0, 1 - (t - 0.8) / 0.5);
              } else if (t >= 2.0) sc = ss((t - 2.0) / 0.5);
              b = t < 0.35 ? 1 : t < 2.2 ? 0 : ss((t - 2.2) / 0.4);
            }
            bm[id] = b;
            gp[id * 3] = x; gp[id * 3 + 1] = y; gp[id * 3 + 2] = z;
            gOn[id] = 1;
            const flat = top ? 1 - 0.7 * S.glaze : 1;
            dm.position.set(x, y, z);
            dm.quaternion.copy(quats[id]);
            dm.scale.set(g * asp[id * 3] * sc, g * asp[id * 3 + 1] * flat * sc, g * asp[id * 3 + 2] * sc);
            dm.updateMatrix();
            grains.setMatrixAt(c, dm.matrix);
            cA.setRGB(0.62 * shade[id], 0.31 * shade[id], 0.23 * shade[id]);
            if (top) cA.lerp(cLight, S.glaze * 0.85);
            grains.setColorAt(c, cA);
            c++;
          }
        }
      }
      grains.count = c;
      grains.instanceMatrix.needsUpdate = true;
      if (grains.instanceColor) grains.instanceColor.needsUpdate = true;

      // bond bridges between neighbouring grains
      let nb = 0;
      const br = S.br;
      const addBridge = (i1, j1, k1, i2, j2, k2) => {
        const A = gidx(i1, j1, k1), B = gidx(i2, j2, k2);
        const m = Math.min(bm[A], bm[B]);
        if (m <= 0.001) return;
        va.set(gp[A * 3], gp[A * 3 + 1], gp[A * 3 + 2]);
        vb.set(gp[B * 3], gp[B * 3 + 1], gp[B * 3 + 2]);
        vd.copy(vb).sub(va);
        const len = vd.length();
        qq.setFromUnitVectors(up, vd.multiplyScalar(1 / len));
        dm.position.copy(va).add(vb).multiplyScalar(0.5);
        dm.quaternion.copy(qq);
        dm.scale.set(br * m, len, br * m);
        dm.updateMatrix();
        bridges.setMatrixAt(nb++, dm.matrix);
      };
      for (let i = 0; i < nx; i++) {
        for (let j = 0; j < ny; j++) {
          for (let k = 0; k < nz; k++) {
            if (i + 1 < nx) addBridge(i, j, k, i + 1, j, k);
            if (j + 1 < ny) addBridge(i, j, k, i, j + 1, k);
            if (k + 1 < nz) addBridge(i, j, k, i, j, k + 1);
          }
        }
      }
      bridges.count = nb;
      bridges.instanceMatrix.needsUpdate = true;

      // pores (voids between grains; filled with metal when the wheel is loaded)
      let np = 0;
      for (let i = 0; i < nx - 1; i++) {
        for (let j = 0; j < ny - 1; j++) {
          for (let k = 0; k < nz - 1; k++) {
            const id = gidx(i, j, k);
            const filled = j < 3 && prand[id] < S.load;
            const r = s * (filled ? 0.36 : 0.2);
            dm.position.set(x0 + (i + 0.5) * s, yTop - (j + 0.5) * s, z0 + (k + 0.5) * s);
            dm.quaternion.identity();
            dm.scale.set(r, r, r);
            dm.updateMatrix();
            poreMesh.setMatrixAt(np, dm.matrix);
            poreMesh.setColorAt(np, filled ? cSilver : cDark);
            np++;
          }
        }
      }
      poreMesh.count = np;
      poreMesh.instanceMatrix.needsUpdate = true;
      if (poreMesh.instanceColor) poreMesh.instanceColor.needsUpdate = true;
      dirty = false;
    }

    const parts = [
      { id: 'wheel', name: 'Grinding wheel', object: wheelBody, slide: 113, qs: ['2020-21_2a', '2014-15_5c', '2012-13_6a'],
        desc: 'A rotary cutting tool made of a very large number of abrasive grains (cutting edges) held together by a bond. Its performance depends on abrasive, grain size, bond, grade and structure.',
        anchor: [WC[0] + 1.2, WC[1] - 1.8, 0.4] },
      { id: 'flange', name: 'Flanges & arbor', object: flange, slide: 139, qs: [],
        desc: 'Steel flanges clamp the wheel on the spindle. Wheel balance is checked at mounting by moving weights around a recessed flange; dressing and truing cannot balance it.',
        explode: [0, 0, 1.2] },
      { id: 'abrasive-grains', name: 'Abrasive grains', object: grains, slide: 115, qs: ['2020-21_2a', '2014-15_5c', '2012-13_6a', '2015-16_3c', '2009-10_5d'],
        desc: 'Hard, friable crystals that act as cutting edges. Al2O3: hardened steel, HSS, steels, cast iron. SiC: HSS, carbides, aluminium, brass, brittle materials. CBN: tool steels, aerospace alloys. Diamond: ceramics, cemented carbides.' },
      { id: 'bond', name: 'Bond bridges', object: bridges, slide: 117, qs: ['2020-21_2a', '2021-22_1a', '2009-10_5d'],
        desc: 'Bond holds the grains and gives the wheel its shape and strength: vitrified (most common), resinoid, rubber (also used for regulating wheels), metallic (diamond/CBN). The bridge thickness sets the grade (hardness).' },
      { id: 'pores', name: 'Pores (structure)', object: poreMesh, slide: 120, qs: ['2011-12_7a', '2009-10_5d'],
        desc: 'Spaces between the grains that carry chips and coolant, preventing loading. Structure number runs from 1 (dense) to 17 (open); open structure suits high stock removal and soft or ductile work.' },
      { id: 'dresser', name: 'Diamond dresser', object: dresser, slide: 137, qs: ['2016-17_6b'],
        desc: 'A single-point diamond traversed across the face breaks away glazed grains and loaded material, restoring sharp cutting grains (micro-geometry); truing restores the shape (macro-geometry).' },
      { id: 'magnified-view', name: 'Magnified view', object: magFrame, slide: 114, qs: [],
        desc: 'Enlarged block of wheel face sliding under the work (grey slab): the grains cut, the bond holds them and the pores relieve the chips.' },
    ];

    // marking e.g. "A 60 K 5 V"
    const modeCfg = {
      'structure-dense': { n: 2, grit: 60, grade: 'K', mk: 'A 60 K 2 V', g: 0.15, br: 0.05, text: 'dense structure, small pores' },
      'structure-open': { n: 12, grit: 60, grade: 'K', mk: 'A 60 K 12 V', g: 0.15, br: 0.05, text: 'open structure, large pores' },
      'grit-coarse': { n: 5, grit: 24, grade: 'K', mk: 'A 24 K 5 V', g: 0.22, br: 0.05, text: 'coarse grit' },
      'grit-fine': { n: 5, grit: 120, grade: 'K', mk: 'A 120 K 5 V', g: 0.095, br: 0.05, text: 'fine grit' },
      'grade-soft': { n: 5, grit: 60, grade: 'F', mk: 'A 60 F 5 V', g: 0.15, br: 0.028, text: 'soft: grains break away', rel: true },
      'grade-hard': { n: 5, grit: 60, grade: 'R', mk: 'A 60 R 5 V', g: 0.15, br: 0.075, text: 'hard: grains retained' },
      glazing: { n: 5, grit: 60, grade: 'R', mk: 'A 60 R 5 V', g: 0.15, br: 0.075, text: 'glazed: grains worn flat', glaze: 1 },
      loading: { n: 5, grit: 60, grade: 'K', mk: 'A 60 K 5 V', g: 0.15, br: 0.05, text: 'loaded: pores filled with metal', load: 0.9 },
      dressing: { n: 5, grit: 60, grade: 'K', mk: 'A 60 K 5 V', g: 0.15, br: 0.05, text: 'diamond dresser restores sharp grains' },
    };
    const kOf = (n) => 2.45 + 0.13 * (n - 1);

    const modes = [
      { id: 'structure-dense', label: 'Structure: dense', slide: 120, qs: ['2011-12_7a', '2009-10_5d', '2020-21_2a'],
        info: 'Structure is the spacing of grains, from 1 (densest) to 17 (most open). A dense wheel has many grains and little pore space: more cutting points, fine finish, good form holding, but little room for chips. Suited to hard, brittle work and light finishing cuts.' },
      { id: 'structure-open', label: 'Structure: open', slide: 121, qs: ['2011-12_7a', '2009-10_5d', '2012-13_6a'],
        info: 'Open structure means more pores and fewer grains per unit volume. The spaces collect the chips and carry coolant, which avoids loading; used for high stock removal, soft or ductile work and large contact areas, at the price of a rougher surface.' },
      { id: 'grit-coarse', label: 'Grit 24 (coarse)', slide: 116, qs: ['2015-16_3c', '2009-10_5d', '2020-21_2a'],
        info: 'Grain size is the screen mesh number: grit 24 means grains that pass a screen with about 24 openings per inch. Big grains take a large depth of cut and give high removal rates but a rougher finish. The range is 6 (very coarse) to 600 (very fine).' },
      { id: 'grit-fine', label: 'Grit 120 (fine)', slide: 116, qs: ['2015-16_3c', '2009-10_5d', '2014-15_5c'],
        info: 'Smaller grains have larger numbers. Grit 120 takes only a very small depth of cut, so it gives a better surface finish but a lower material removal rate; many more cutting points share the load.' },
      { id: 'grade-soft', label: 'Grade: soft', slide: 119, qs: ['2021-22_1a', '2009-10_5d'],
        info: 'Grade (hardness) is the bond strength holding the grains, from A (soft) to Z (hard). A soft wheel lets dulled grains break away so fresh sharp ones are exposed: use it for hard materials, which blunt grains quickly. A hard wheel for soft material because grains stay sharp longer and must be held.' },
      { id: 'grade-hard', label: 'Grade: hard', slide: 119, qs: ['2021-22_1a', '2009-10_5d'],
        info: 'Thick bond bridges retain the grains until the grinding force rises greatly. Use a hard wheel on soft materials, where grains wear slowly; on hard work it would keep blunt grains and glaze. Grade is unrelated to the abrasive hardness.' },
      { id: 'glazing', label: 'Glazing', slide: 136, qs: ['2016-17_6b'],
        info: 'After continuous use the grain tips are worn flat down to the bond and the face takes a glass-like appearance. It cuts no more: it rubs, heats the work and stops grinding. Cause: wheel too hard for the work. Remedy: dressing.' },
      { id: 'loading', label: 'Loading', slide: 136, qs: ['2016-17_6b'],
        info: 'The pores and face of the wheel fill with particles of the work material, which prevents cutting. It happens mainly when grinding soft, ductile metals. Remedies: open-structure or softer wheel, coolant, and dressing.' },
      { id: 'dressing', label: 'Dressing', slide: 137, qs: ['2016-17_6b'],
        info: 'Dressing removes loaded metal and breaks away the glazed surface so sharp grains are formed again (it makes the micro-geometry). Truing regenerates the wheel shape and concentricity (macro-geometry).' },
    ];

    let mode = 'structure-dense';
    let dressP = 0;
    let cfg = modeCfg[mode];

    function setTargets() {
      cfg = modeCfg[mode];
      Tg.g = cfg.g; Tg.k = kOf(cfg.n); Tg.br = cfg.br; Tg.glaze = cfg.glaze || 0; Tg.load = cfg.load || 0;
      relActive = !!cfg.rel;
    }
    function applyVis() {
      const dr = mode === 'dressing';
      dresser.visible = dr;
      overlay.visible = false;
      wheelSpin.rotation.z = 0;
    }
    function reset() {
      clock = 0; relTimer = 0; relT.fill(-1);
      setTargets();
      if (mode === 'dressing') { S.glaze = 1; S.load = 1; Tg.glaze = 1; Tg.load = 1; }
      S.g = Tg.g; S.k = Tg.k; S.br = Tg.br; S.glaze = Tg.glaze; S.load = Tg.load;
      applyVis();
      dirty = true;
      layout();
      updateOverlay();
    }
    function updateOverlay() {
      const glz = S.glaze > 0.5, ld = S.load > 0.5;
      overlay.visible = (mode === 'glazing' && glz) || (mode === 'loading' && ld) || (mode === 'dressing' && S.glaze > 0.5);
      overlay.material = mode === 'loading' ? loadMat : overlayMat;
    }
    reset();

    function ease(key, k) {
      const d = Tg[key] - S[key];
      if (Math.abs(d) > 1e-4) { S[key] += d * k; dirty = true; } else if (S[key] !== Tg[key]) { S[key] = Tg[key]; dirty = true; }
    }

    return {
      root,
      parts,
      modes,
      setMode(id) { mode = id; reset(); },
      update(dt) {
        clock += dt;
        const k = 1 - Math.exp(-dt * 3.5);
        slab.position.x = 0.35 * Math.sin(clock * 0.9);
        if (mode === 'dressing') {
          const p = (clock % 8) / 8;
          let z = -0.55, yo = 0, gl;
          if (p < 0.12) gl = 1;
          else if (p < 0.62) { const q = (p - 0.12) / 0.5; z = -0.55 + 1.1 * q; gl = 1 - ss(q); }
          else if (p < 0.78) { z = 0.55; yo = 0.4 * ss((p - 0.62) / 0.04); gl = 0; }
          else if (p < 0.95) { z = lerp(0.55, -0.55, ss((p - 0.78) / 0.17)); yo = 0.4; gl = ss((p - 0.78) / 0.22); }
          else { z = -0.55; yo = 0.4 * (1 - ss((p - 0.95) / 0.05)); gl = ss((p - 0.78) / 0.22); }
          dresser.position.z = z;
          dresser.position.y = R + 0.01 + yo;
          S.glaze = gl; S.load = gl; dressP = p;
          wheelSpin.rotation.z -= dt * 1.5;
          dirty = true;
          updateOverlay();
        } else {
          if (mode === 'grade-hard') Tg.glaze = 0.3 * (0.5 - 0.5 * Math.cos(clock * 0.7));
          ease('g', k); ease('k', k); ease('br', k); ease('glaze', k); ease('load', k);
          if (dirty) updateOverlay();
        }
        if (relActive) {
          relTimer += dt;
          if (relTimer > 0.5) {
            relTimer = 0;
            const nxA = Math.max(1, Math.min(NXM, Math.floor((IW - 2 * S.g) / (S.g * S.k)) + 1));
            const nzA = Math.max(1, Math.min(NZM, Math.floor((ID - 2 * S.g) / (S.g * S.k)) + 1));
            const id = gidx(Math.floor(Math.random() * nxA), 0, Math.floor(Math.random() * nzA));
            if (relT[id] < 0) relT[id] = 0;
          }
          for (let i = 0; i < MAXG; i += 1) {
            if (relT[i] >= 0) { relT[i] += dt; if (relT[i] > 2.6) relT[i] = -1; }
          }
          dirty = true;
        }
        if (dirty) layout();
      },
      readout() {
        return [
          ['Marking', cfg.mk],
          ['A: abrasive', 'Al2O3 (C = SiC); optional prefix = maker\'s code'],
          ['Grit', `${cfg.grit} (6 coarse to 600 fine)`],
          ['Grade', `${cfg.grade} (A soft to Z hard)`],
          ['Structure', `${cfg.n} (1 dense to 17 open)`],
          ['V: bond', 'vitrified (B resinoid, R rubber, M metal)'],
          ['State', mode === 'dressing' ? `${cfg.text} (${Math.round(dressP * 100)}%)` : cfg.text],
        ];
      },
      legend: [['grain', 'abrasive cutting edge'], ['ivory', 'bond bridges'], ['dark/silver', 'pores / loaded pores']],
    };
  },
};
