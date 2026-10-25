import * as THREE from 'three';
import { M, box, extrude, tube, arrow, group, textSprite } from '../kit.js';

const D2R = Math.PI / 180;
const V3 = THREE.Vector3;
const FC = 0xe9a321, FT = 0x8e44ad, FR = 0x1f9aa8; // force arrows (V/f/d colours stay reserved)
const W = 2.4, XEND = 3.4, BASE_TOP = 1.0, T_CUT = 0.3;
const GAMMA = 8 * D2R, ALPHA = 6 * D2R, LAM = 30 * D2R;
const CHIP_T = 0.5, L0 = 1.6, RC = 0.75, PHI_MAX = 1.05 * Math.PI, NR = 80;
const XS = -2.4, XE = 1.6, PERIOD = 9.6, LIFT = 1.4;
const sm = (x) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c); };

function seg(a, b, mat, r = 0.02) {
  const A = new V3(...a), B = new V3(...b);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, A.distanceTo(B), 6), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new V3(0, 1, 0), B.clone().sub(A).normalize());
  return m;
}
function arc(c, u, v, r, a0, a1, mat = M.amber) {
  const pts = [];
  for (let i = 0; i <= 14; i++) {
    const a = a0 + ((a1 - a0) * i) / 14;
    pts.push([0, 1, 2].map((k) => c[k] + r * (Math.cos(a) * u[k] + Math.sin(a) * v[k])));
  }
  return tube(pts, 0.022, mat, { seg: 24, radial: 6 });
}
function label(text, p, size = 0.3) {
  const s = textSprite(text, { size });
  s.position.set(...p);
  return s;
}

function buildChip(lam) {
  const wl = W / Math.cos(lam);
  const f = new V3(-Math.sin(GAMMA), Math.cos(GAMMA), 0);
  const nf = new V3(Math.cos(GAMMA), Math.sin(GAMMA), 0);
  const e = new V3(0, 0, 1);
  const c = f.clone().multiplyScalar(Math.cos(lam)).addScaledVector(e, Math.sin(lam));
  const Ltot = L0 + RC * PHI_MAX;
  const pos = new Float32Array((NR + 1) * 24);
  const col = new Float32Array((NR + 1) * 24);
  const sArr = new Float32Array(NR + 1);
  const P = new V3(), N = new V3(), q = new V3();
  const put = (k, slot, p) => pos.set([p.x, p.y, p.z], k * 24 + slot * 3);
  for (let k = 0; k <= NR; k++) {
    const s = (Ltot * k) / NR;
    sArr[k] = s;
    if (s <= L0) { P.copy(c).multiplyScalar(s); N.copy(nf); } else {
      const ph = (s - L0) / RC;
      P.copy(c).multiplyScalar(L0 + RC * Math.sin(ph)).addScaledVector(nf, RC * (1 - Math.cos(ph)));
      N.copy(c).multiplyScalar(-Math.sin(ph)).addScaledVector(nf, Math.cos(ph));
    }
    P.addScaledVector(nf, CHIP_T / 2);
    const mk = (sn, se) => q.copy(P).addScaledVector(N, sn * CHIP_T / 2).addScaledVector(e, se * wl / 2).clone();
    const i0 = mk(1, -1), i1 = mk(1, 1), o1 = mk(-1, 1), o0 = mk(-1, -1);
    [i0, i1, i1, o1, o1, o0, o0, i0].forEach((p, s2) => put(k, s2, p));
  }
  const idx = [];
  for (let k = 0; k < NR; k++) for (let fc = 0; fc < 4; fc++) {
    const a = 8 * k + 2 * fc, b = a + 1;
    idx.push(a, b, a + 8, b, b + 8, a + 8);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mat = M.workCut.clone();
  mat.vertexColors = true;
  mat.color.set(0xffffff);
  mat.side = THREE.DoubleSide;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.castShadow = true;
  const paint = (off) => {
    for (let k = 0; k <= NR; k++) {
      const sh = (Math.floor(sArr[k] * 4 - off) & 1) ? 0.95 : 0.6;
      for (let v = 0; v < 8; v++) { const o = k * 24 + v * 3; col[o] = sh; col[o + 1] = sh; col[o + 2] = sh; }
    }
    geo.attributes.color.needsUpdate = true;
  };
  paint(0);
  return { mesh, geo, paint, f, nf, e, c, wl };
}

function buildTool(lam) {
  const wl = W / Math.cos(lam);
  const g = new THREE.Group();
  const F1 = [-Math.sin(GAMMA) * 1.9, Math.cos(GAMMA) * 1.9];
  const xb = -4.6;
  const body = extrude([[0, 0], F1, [xb, F1[1]], [xb, -xb * Math.tan(ALPHA)]], wl, M.hss);
  const edge = tube([[0, 0, -wl / 2], [0, 0, wl / 2]], 0.04, M.amber, { seg: 2, radial: 6 });
  g.add(body, edge);
  return g;
}

export default {
  id: 'orth-oblique',
  title: 'Orthogonal vs oblique cutting',
  subtitle: 'Edge inclination, chip flow direction and force components',
  camera: { position: [4.5, 4.6, 8.0], target: [0, 1.7, 0.4] },
  build() {
    const root = new THREE.Group();
    const table = box(8, 0.3, 3.6, M.castIron); table.position.set(0, 0.15, 0);
    const base = box(7, 0.7, W, M.workCut); base.position.set(0, 0.65, 0);
    const lgeo = new THREE.BoxGeometry(1, 1, 1);
    const lp = lgeo.attributes.position;
    const lFront = new Uint8Array(lp.count), lTop = new Uint8Array(lp.count), lZ = new Float32Array(lp.count);
    for (let i = 0; i < lp.count; i++) { lFront[i] = lp.getX(i) < 0 ? 1 : 0; lTop[i] = lp.getY(i) > 0 ? 1 : 0; lZ[i] = Math.sign(lp.getZ(i)) * W / 2; }
    const layer = new THREE.Mesh(lgeo, M.work);
    layer.frustumCulled = false; layer.castShadow = true;
    const workG = group(table, base, layer);
    let tanL = 0;
    const setLayer = (xf, tl) => {
      for (let i = 0; i < lp.count; i++) lp.setXYZ(i, lFront[i] ? xf + lZ[i] * tanL : XEND, BASE_TOP + (lTop[i] ? T_CUT * tl : 0), lZ[i]);
      lp.needsUpdate = true;
      layer.visible = tl > 0.02;
    };

    const carriage = new THREE.Group();
    const toolPart = new THREE.Group(), chipPart = new THREE.Group(), forcePart = new THREE.Group();
    carriage.add(toolPart, chipPart, forcePart);
    const variants = {};
    for (const [id, lam] of [['orthogonal', 0], ['oblique', LAM]]) {
      const vg = new THREE.Group();
      const toolRot = new THREE.Group(), chipRot = new THREE.Group();
      toolRot.rotation.y = lam; chipRot.rotation.y = lam;
      const tool = buildTool(lam);
      const chip = buildChip(lam);
      toolRot.add(tool); chipRot.add(chip.mesh);
      // chip-flow marks on top of the chip
      const o = chip.nf.clone().multiplyScalar(CHIP_T + 0.08);
      const oo = o.toArray();
      const pt = (v, s) => o.clone().addScaledVector(v, s).toArray();
      const marks = group(seg(oo, pt(chip.f, 1.5), M.white, 0.012), seg(oo, pt(chip.c, 1.6), M.amber, 0.03));
      if (lam > 0) {
        marks.add(arc(oo, chip.f.toArray(), chip.e.toArray(), 1.0, 0, lam));
        marks.add(label('chip flow angle ηc ≈ λ', pt(chip.c, 2.0).map((v, i) => v + [0, 0.15, 0.2][i]), 0.28));
      } else marks.add(label('chip flows ⊥ edge', pt(chip.f, 1.9), 0.28));
      chipRot.add(marks);
      toolPart.add(toolRot); chipPart.add(chipRot);
      // plan view of edge inclination, above the shank
      const C = [-1.8, 2.25, 0], ew = [Math.sin(lam), 0, Math.cos(lam)];
      vg.add(seg([C[0], C[1], C[2] - 1.3], [C[0], C[1], C[2] + 1.3], M.darkSteel, 0.014));
      vg.add(seg([C[0] - ew[0] * 1.3, C[1], C[2] - ew[2] * 1.3], [C[0] + ew[0] * 1.3, C[1], C[2] + ew[2] * 1.3], M.amber, 0.03));
      if (lam > 0) {
        vg.add(arc(C, [0, 0, 1], [1, 0, 0], 0.9, 0, lam));
        vg.add(label('λ = 30°', [C[0] + 0.6, C[1] + 0.2, C[2] + 1.45], 0.3));
      } else vg.add(label('λ = 0°', [C[0], C[1] + 0.2, C[2] + 1.45], 0.3));
      vg.add(label('plan view of edge', [C[0], C[1] + 0.45, C[2] - 1.5], 0.24));
      // forces on tool (world axes)
      const fz = W / 2 + 0.6;
      const forces = group(
        arrow([0, 0, fz], [-1, 0, 0], 1.7, FC), label('Fc', [-1.95, 0.0, fz], 0.3),
        arrow([0, 0, fz], [0, 1, 0], 1.1, FT), label('Ft', [0, 1.35, fz], 0.3));
      if (lam > 0) forces.add(arrow([0, 0, fz], [0, 0, 1], 1.1, FR), label('Fr', [0, 0.25, fz + 1.4], 0.3));
      forcePart.add(forces);
      variants[id] = { vg, chip, tool, forces, lam, toolRot, chipRot };
      carriage.add(vg);
    }
    carriage.add(arrow([-4.6, 2.7, 0], [1, 0, 0], 1.6, M.vColor), label('V', [-3.8, 3.05, 0], 0.4));
    carriage.add(arrow([2.3, 1.25, 0], [0, -1, 0], 0.9, M.dColor), label('t', [2.3, 1.5, 0], 0.35));
    root.add(workG, carriage);

    let mode = 'orthogonal', tm = 0, band = 0;
    const apply = (dt) => {
      const p = tm % PERIOD;
      let xt = XS, lift = 0, tl = 1, g = 0, r = 0;
      if (p < 0.9) { lift = LIFT; tl = sm(p / 0.9); }
      else if (p < 1.6) { lift = LIFT * (1 - sm((p - 0.9) / 0.7)); }
      else if (p < 7.6) { xt = XS + ((p - 1.6) / 6) * (XE - XS); g = sm(Math.min(1, (p - 1.6) / 2.2)); band += dt * 1.2; }
      else {
        xt = p < 8.4 ? XE : XE + (XS - XE) * sm((p - 8.4) / 1.2);
        lift = p < 8.4 ? LIFT * sm((p - 7.6) / 0.8) : LIFT;
        r = sm((p - 7.6) / 0.8); g = 1;
        tl = p < 8.0 ? 1 : p < 8.8 ? 1 - sm((p - 8.0) / 0.8) : 0;
      }
      carriage.position.set(xt, BASE_TOP + lift, 0);
      setLayer(xt, tl);
      const ch = variants[mode].chip;
      const k0 = Math.floor(r * NR), k1 = Math.floor(g * NR);
      ch.geo.setDrawRange(k0 * 24, Math.max(0, k1 - k0) * 24);
      if (k1 > k0) ch.paint(band);
    };
    const setVis = () => { for (const id in variants) { const v = variants[id], on = id === mode; v.vg.visible = on; v.toolRot.visible = on; v.chipRot.visible = on; v.forces.visible = on; } };

    const parts = [
      { id: 'tool', name: 'Cutting tool', object: toolPart, desc: 'Wedge with rake angle and clearance. In orthogonal cutting its edge is square to the cutting velocity; in oblique cutting the edge is turned through the inclination angle.', slide: 7, qs: ['2021-22_6a', '2016-17_2a'], anchor: [-1.8, 2.0, 0] },
      { id: 'work', name: 'Workpiece', object: workG, desc: 'Block being cut; the uncut layer of thickness t is removed and the machined surface is left behind.', slide: 7, qs: ['2021-22_6a'], anchor: [2.2, 1.0, 1.2] },
      { id: 'chip', name: 'Chip', object: chipPart, desc: 'Ribbon that slides up the rake face. Orthogonal: it leaves normal to the edge. Oblique: it is turned sideways by the chip flow angle, approximately equal to the inclination (Stabler).', slide: 8, qs: ['2016-17_2a', '2013-14_4d'], anchor: [0.8, 2.6, 0] },
      { id: 'forces', name: 'Force components', object: forcePart, desc: 'Orthogonal cutting has two perpendicular components, cutting force Fc and thrust force Ft. Oblique cutting adds a third, the radial (feed) force Fr along the edge direction.', slide: 8, qs: ['2021-22_6a', '2017-18_2a'], anchor: [0, 1.0, 1.8] },
    ];
    const modes = [
      { id: 'orthogonal', label: 'Orthogonal', slide: 7, qs: ['2021-22_6a', '2017-18_2a', '2016-17_2a', '2013-14_4d'],
        info: 'The cutting edge stays at 90° to the cutting velocity (inclination λ = 0), so the chip flows normal to the edge in the plane of the tool face with no chip flow angle. The shear force acts on a smaller area, so shear stress is higher and tool life is shorter than in oblique cutting. Only two perpendicular force components act on the tool, Fc and Ft, making it a 2-D problem.' },
      { id: 'oblique', label: 'Oblique', slide: 8, qs: ['2021-22_6a', '2017-18_2a', '2016-17_2a', '2013-14_4d'],
        info: 'The edge is inclined at an acute angle λ (inclination angle) to the normal to the cutting velocity, so the chip flows at a chip flow angle (written β on the slide, ηc here, ≈ λ) to the normal to the edge, i.e. sideways. Shear acts on a larger area, so shear force per area is smaller and tool life is longer. Three perpendicular components act: Fc, Ft and the radial force Fr. The flow deviates from the orthogonal plane because of edge inclination and chip friction on the face.' },
    ];
    const reads = {
      orthogonal: [['Inclination λ', '0°'], ['Chip flow angle', '0°'], ['Force components', '2 (Fc, Ft)'], ['Shear area', 'smaller'], ['Tool life', 'shorter']],
      oblique: [['Inclination λ', '30°'], ['Chip flow angle', '≈ λ = 30°'], ['Force components', '3 (Fc, Ft, Fr)'], ['Shear area', 'larger'], ['Tool life', 'longer']],
    };
    const setMode = (id) => {
      mode = id; tm = 0; band = 0;
      tanL = Math.tan(variants[id].lam);
      setLayer(0, 1); lgeo.computeVertexNormals();
      setVis(); apply(0);
    };
    setMode('orthogonal');
    return {
      root, parts, modes, setMode,
      update(dt) { tm += dt; apply(dt); },
      readout: () => reads[mode],
      legend: [['V', 'cutting velocity'], ['d', 'uncut thickness t'], ['Fc', 'cutting force'], ['Ft', 'thrust force'], ['Fr', 'radial force (oblique)']],
    };
  },
};
