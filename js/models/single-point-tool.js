import * as THREE from 'three';
import { M, box, cyl, tube, extrude, at, rot, group, named, arrow, spinArrow, textSprite } from '../kit.js';

const D2R = Math.PI / 180;
const V3 = THREE.Vector3;
// Tool angles (degrees) - exaggerated slightly so they read well.
const AM = { back: 8, side: 10, endRel: 10, sideRel: 10, scea: 20, ecea: 15 };

const sub2 = (p, q) => [p[0] - q[0], p[1] - q[1]];
const len2 = (p) => Math.hypot(p[0], p[1]);
const nrm2 = (p) => { const l = len2(p) || 1; return [p[0] / l, p[1] / l]; };

function seg(a, b, mat, r = 0.025) {
  const A = new V3(...a);
  const B = new V3(...b);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, A.distanceTo(B), 6), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new V3(0, 1, 0), B.clone().sub(A).normalize());
  return m;
}
function arcMesh(c, u, v, r, a0, a1, mat = M.amber) {
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
function polyMesh(tris, mat) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(tris, 3));
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// Build the large brazed/HSS turning tool. Local frame: shank along -x, nose toward +x,
// side cutting edge on the +z side, rake face up (+y). Group rests on y = 0.
function buildTool() {
  const g = new THREE.Group();
  const w = 1.0, hs = 1.0, rn = 0.22, xa = 0.4, xN = 2.6;
  const tb = Math.tan(AM.back * D2R), ts = Math.tan(AM.side * D2R);
  const zN = w / 2 + (xN - xa) * Math.tan(AM.scea * D2R);
  const tt = (zN + w / 2) / Math.cos(AM.ecea * D2R);
  const Np = [xN, zN], A = [xa, w / 2], S1 = [xa, -w / 2];
  const B = [xN - tt * Math.sin(AM.ecea * D2R), -w / 2];
  const u1 = nrm2(sub2(B, Np)), u2 = nrm2(sub2(A, Np));
  const th = Math.acos(u1[0] * u2[0] + u1[1] * u2[1]);
  const dT = rn / Math.tan(th / 2);
  const T1 = [Np[0] + u1[0] * dT, Np[1] + u1[1] * dT];
  const T2 = [Np[0] + u2[0] * dT, Np[1] + u2[1] * dT];
  const bis = nrm2([u1[0] + u2[0], u1[1] + u2[1]]);
  const dc = rn / Math.sin(th / 2);
  const C = [Np[0] + bis[0] * dc, Np[1] + bis[1] * dc];
  const a1 = Math.atan2(T1[1] - C[1], T1[0] - C[0]);
  let da = Math.atan2(T2[1] - C[1], T2[0] - C[0]) - a1;
  while (da > Math.PI) da -= 2 * Math.PI;
  while (da < -Math.PI) da += 2 * Math.PI;
  const NA = 6;
  const arc = [];
  for (let i = 0; i <= NA; i++) arc.push([C[0] + rn * Math.cos(a1 + (da * i) / NA), C[1] + rn * Math.sin(a1 + (da * i) / NA)]);
  const ring = [S1, B, ...arc, A]; // plan (x,z)
  const n = ring.length;
  const iA = n - 1, iB = 1, iT1 = 2, iT2 = 2 + NA;
  const yTop = (x, z) => Math.max(0.15, hs + (x - xN) * tb + (z - zN) * ts);
  const cen = [ring.reduce((s, p) => s + p[0], 0) / n, ring.reduce((s, p) => s + p[1], 0) / n];
  const inward = (p, q) => {
    const d = nrm2(sub2(q, p));
    let nn = [-d[1], d[0]];
    if (nn[0] * (cen[0] - p[0]) + nn[1] * (cen[1] - p[1]) < 0) nn = [-nn[0], -nn[1]];
    return nn;
  };
  const nE = inward(B, T1), nS = inward(T2, A);
  const bot = ring.map((p, i) => {
    const y = yTop(p[0], p[1]);
    const sE = [nE[0] * y * Math.tan(AM.endRel * D2R), nE[1] * y * Math.tan(AM.endRel * D2R)];
    const sS = [nS[0] * y * Math.tan(AM.sideRel * D2R), nS[1] * y * Math.tan(AM.sideRel * D2R)];
    if (i === 0) return [p[0], p[1]];
    if (i === iB) return [p[0] + sE[0], p[1] + sE[1]];
    if (i >= iT1 && i <= iT2) {
      const t = (i - iT1) / NA;
      return [p[0] + sE[0] * (1 - t) + sS[0] * t, p[1] + sE[1] * (1 - t) + sS[1] * t];
    }
    return [p[0] + sS[0], p[1] + sS[1]];
  });
  const topP = ring.map((p) => new V3(p[0], yTop(p[0], p[1]), p[1]));
  const botP = bot.map((p) => new V3(p[0], 0, p[1]));
  const cen3 = new V3(cen[0], 0, cen[1]);
  const pushTri = (arr, p, q, r, dir) => {
    const nn = q.clone().sub(p).cross(r.clone().sub(p));
    if (nn.dot(dir) < 0) [q, r] = [r, q];
    arr.push(p.x, p.y, p.z, q.x, q.y, q.z, r.x, r.y, r.z);
  };
  const UP = new V3(0, 1, 0), DN = new V3(0, -1, 0);
  const sideTris = (idxs, off = 0) => {
    const arr = [];
    for (let k = 0; k < idxs.length - 1; k++) {
      const i = idxs[k], j = idxs[k + 1];
      const mid = topP[i].clone().add(topP[j]).multiplyScalar(0.5).sub(cen3).setY(0).normalize();
      const o = mid.clone().multiplyScalar(off);
      const ti = topP[i].clone().add(o), tj = topP[j].clone().add(o), bi = botP[i].clone().add(o), bj = botP[j].clone().add(o);
      pushTri(arr, ti, bi, bj, mid);
      pushTri(arr, ti, bj, tj, mid);
    }
    return arr;
  };
  const allIdx = [...Array(n).keys(), 0];
  const body = [];
  for (let i = 1; i < n - 1; i++) {
    pushTri(body, topP[0], topP[i], topP[i + 1], UP);
    pushTri(body, botP[0], botP[i], botP[i + 1], DN);
  }
  body.push(...sideTris(allIdx));
  const head = new THREE.Group();
  head.position.y = 0.08;
  g.add(head);
  const headMesh = polyMesh(body, M.hss);
  headMesh.material = M.hss.clone();
  headMesh.material.side = THREE.DoubleSide;
  head.add(headMesh);

  const ov = (mat) => { const m = mat.clone(); m.side = THREE.DoubleSide; m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; return m; };
  const faceArr = [];
  for (let i = 1; i < n - 1; i++) pushTri(faceArr, topP[0].clone().setY(topP[0].y + 0.006), topP[i].clone().setY(topP[i].y + 0.006), topP[i + 1].clone().setY(topP[i + 1].y + 0.006), UP);
  const face = named(polyMesh(faceArr, ov(M.chrome)), 'face');
  const flankP = polyMesh(sideTris([iT2, iA], 0.006), ov(M.steel));
  const flankA = polyMesh(sideTris([iB, iT1], 0.006), ov(M.darkSteel));
  const noseFlank = polyMesh(sideTris(Array.from({ length: NA + 1 }, (_, k) => iT1 + k), 0.006), ov(M.brass));
  const edgeS = tube([topP[iT2].toArray(), topP[iA].toArray()], 0.035, M.amber, { seg: 2, radial: 6 });
  const edgeE = tube([topP[iB].toArray(), topP[iT1].toArray()], 0.035, M.amber, { seg: 2, radial: 6 });
  const noseArc = tube(topP.slice(iT1, iT2 + 1).map((p) => [p.x, p.y + 0.01, p.z]), 0.045, M.amber, { seg: 16, radial: 6 });
  const noseG = group(noseFlank, noseArc);
  // Heel: lowest strip of the flank, where flank meets base
  const heel = seg(botP[iB].toArray(), botP[iT1].toArray(), M.paintDark, 0.07);
  const heel2 = seg(botP[iT2].toArray(), botP[iA].toArray(), M.paintDark, 0.07);
  const heelG = group(heel, heel2);
  head.add(face, flankP, flankA, edgeS, edgeE, noseG, heelG);

  const shank = box(5.8, 1.0, 1.0, M.hss);
  at(shank, -2.5, 0.08 + 0.5, 0);
  const base = box(5.8, 0.08, 1.0, M.darkSteel);
  at(base, -2.5, 0.04, 0);
  g.add(shank, base);

  // Annotation overlay for 'angles' mode (in head-local coordinates)
  const ann = new THREE.Group();
  const nTop = topP[iA === 0 ? 0 : 0]; // placeholder
  void nTop;
  const Nt = [xN, hs, zN];
  const ref = (a, b) => seg(a, b, M.white, 0.016);
  // back rake (xy plane)
  {
    const c = [Nt[0], Nt[1] + 0.02, Nt[2] + 0.03];
    ann.add(ref(c, [c[0] - 2.2, c[1], c[2]]));
    ann.add(ref(c, [c[0] - 2.2 * Math.cos(AM.back * D2R), c[1] - 2.2 * Math.sin(AM.back * D2R), c[2]]));
    ann.add(arcMesh(c, [1, 0, 0], [0, 1, 0], 1.9, Math.PI, Math.PI + AM.back * D2R * 1));
    ann.add(label('Back rake', [c[0] - 2.5, c[1] + 0.45, c[2] + 0.2]));
  }
  // side rake (yz plane)
  {
    const c = [Nt[0] + 0.04, Nt[1] + 0.02, Nt[2]];
    ann.add(ref(c, [c[0], c[1], c[2] - 1.9]));
    ann.add(ref(c, [c[0], c[1] - 1.9 * Math.sin(AM.side * D2R), c[2] - 1.9 * Math.cos(AM.side * D2R)]));
    ann.add(arcMesh(c, [0, 0, 1], [0, 1, 0], 1.6, Math.PI, Math.PI + AM.side * D2R));
    ann.add(label('Side rake', [c[0] + 0.9, c[1] + 0.4, c[2] - 1.3]));
  }
  // end relief / side relief
  const relief = (pa, pb, nIn, text, ang) => {
    const mid = new V3().addVectors(pa, pb).multiplyScalar(0.5);
    const out = new V3(-nIn[0], 0, -nIn[1]);
    const c = mid.clone().addScaledVector(out, 0.03).toArray();
    const L = 0.9;
    ann.add(ref(c, [c[0], c[1] - L, c[2]]));
    ann.add(ref(c, [c[0] - out.x * L * Math.sin(ang * D2R) * 1, c[1] - L * Math.cos(ang * D2R), c[2] - out.z * L * Math.sin(ang * D2R)]));
    ann.add(arcMesh(c, out.toArray(), [0, 1, 0], 0.7, -Math.PI / 2 - ang * D2R, -Math.PI / 2));
    ann.add(label(text, [c[0] + out.x * 0.9, Math.max(0.4, c[1] - 0.95), c[2] + out.z * 0.9]));
  };
  relief(topP[iB], topP[iT1], nE, 'End relief', AM.endRel);
  relief(topP[iT2], topP[iA], nS, 'Side relief', AM.sideRel);
  // plan-view angles, hovering above the face
  {
    const yh = hs + 0.55;
    const Ap = [xa, yh, w / 2];
    const Np3 = [xN, yh, zN];
    ann.add(seg([xa, yTop(xa, w / 2), w / 2], Ap, M.white, 0.01));
    ann.add(seg([xN, hs, zN], Np3, M.white, 0.01));
    ann.add(seg(Ap, Np3, M.amber, 0.03));
    ann.add(ref(Ap, [xa + 2.6, yh, w / 2]));
    ann.add(arcMesh(Ap, [1, 0, 0], [0, 0, 1], 1.5, 0, AM.scea * D2R));
    ann.add(label('Side cutting edge angle', [xa + 1.9, yh + 0.35, w / 2 - 0.35]));
    const Bp = [B[0], yh, B[1]];
    ann.add(seg([B[0], yTop(B[0], B[1]), B[1]], Bp, M.white, 0.01));
    ann.add(seg(Np3, Bp, M.amber, 0.03));
    ann.add(ref(Np3, [xN, yh, zN - 1.6]));
    ann.add(arcMesh(Np3, [0, 0, -1], [-1, 0, 0], 1.2, 0, AM.ecea * D2R));
    ann.add(label('End cutting edge angle', [xN + 1.0, yh + 0.35, zN - 1.1]));
    // nose radius
    const Cc = [C[0], hs + 0.05, C[1]];
    const mid = topP[iT1 + NA / 2];
    ann.add(seg(Cc, [mid.x, mid.y + 0.05, mid.z], M.white, 0.016));
    ann.add(label('Nose radius', [xN + 0.9, hs + 0.5, zN + 0.55]));
  }
  head.add(ann);

  return { group: g, head, ann, parts: { shank, face, flankP, flankA, edgeS, edgeE, noseG, heelG, base }, xN, zN, hs, topP, iA, iB, iT1, iT2, ring };
}

function buildInsertTool() {
  const g = new THREE.Group();
  const holder = box(5.2, 1.0, 1.0, M.darkSteel);
  at(holder, -2.6 + 0.4, 0.5, 0);
  const headBlock = extrude([[-0.2, -0.5], [1.9, -0.5], [1.9, 0.5], [-0.2, 0.5]].map(([x, y]) => [x, y]), 1.0, M.darkSteel, { axis: 'y' });
  at(headBlock, 1.0, 0.5, 0);
  g.add(holder, headBlock);
  const topY = 1.0;
  const shim = box(1.0, 0.06, 1.0, M.castIron);
  at(shim, 1.2, topY + 0.03, 0);
  rot(shim, 0, Math.PI / 4, 0);
  const wall1 = box(0.12, 0.3, 1.2, M.paintDark);
  at(wall1, 0.62, topY + 0.15, 0.42);
  rot(wall1, 0, Math.PI / 4, 0);
  const wall2 = box(0.12, 0.3, 1.2, M.paintDark);
  at(wall2, 0.62, topY + 0.15, -0.42);
  rot(wall2, 0, -Math.PI / 4, 0);
  const pocket = group(shim, wall1, wall2);
  g.add(pocket);
  // Insert: square, rotated 45 deg so a corner points to +x. Indexes by rotating about y.
  const insertSpin = new THREE.Group();
  insertSpin.position.set(1.2, topY + 0.06, 0);
  const insert = box(1.1, 0.22, 1.1, M.carbide);
  at(insert, 0, 0.11, 0);
  rot(insert, 0, Math.PI / 4, 0);
  const hole = cyl(0.17, 0.24, M.darkSteel, { seg: 16 });
  at(hole, 0, 0.11, 0);
  insertSpin.add(insert, hole);
  const wear = [];
  const r = 0.55 * Math.SQRT2;
  for (let k = 0; k < 4; k++) {
    const d = cyl(0.09, 0.03, M.black, { seg: 10 });
    at(d, Math.cos((k * Math.PI) / 2) * (r - 0.12), 0.235, Math.sin((k * Math.PI) / 2) * (r - 0.12));
    d.visible = false;
    wear.push(d);
    insertSpin.add(d);
  }
  const screw = cyl(0.14, 0.3, M.chrome, { seg: 16 });
  at(screw, 1.2, topY + 0.3, 0);
  // Highlight active cutting edges (static, at the +x corner)
  const rr = 0.55 * Math.SQRT2;
  const yE = topY + 0.06 + 0.23;
  const e1 = tube([[1.2 + rr, yE, 0], [1.2, yE, rr]], 0.035, M.amber, { seg: 2, radial: 6 });
  const e2 = tube([[1.2 + rr, yE, 0], [1.2, yE, -rr]], 0.035, M.amber, { seg: 2, radial: 6 });
  const activeEdges = group(e1, e2);
  g.add(insertSpin, screw, activeEdges);
  const holderG = group(holder, headBlock);
  g.add(holderG);
  return { group: g, insertSpin, wear, parts: { holder: holderG, pocket, insert: insertSpin, screw, activeEdges } };
}

export default {
  id: 'single-point-tool',
  title: 'Single-point cutting tool',
  subtitle: 'Nomenclature, angles, indexable inserts and a tool in use',
  camera: { position: [-1.5, 6.5, 8.5], target: [-1.2, 0.6, 0] },
  build() {
    const root = new THREE.Group();
    const nomGroup = new THREE.Group();
    root.add(nomGroup);
    const T = buildTool();
    nomGroup.add(T.group);
    T.ann.visible = false;
    const P = T.parts;

    const ins = buildInsertTool();
    const insGroup = new THREE.Group();
    insGroup.add(ins.group);
    const insNote = label('Only ONE corner cuts; index to a fresh edge', [-0.5, 2.4, 0], 0.32);
    insGroup.add(insNote);
    insGroup.visible = false;
    root.add(insGroup);

    // ---- in-use scene ----
    const useGroup = new THREE.Group();
    useGroup.visible = false;
    root.add(useGroup);
    const barY = 3.2, R = 2.1, dcut = 0.25, Rm = R - dcut;
    const spin = new THREE.Group();
    spin.position.set(0, barY, 0);
    const uncut = cyl(R, 1, M.work, { axis: 'x', seg: 48 });
    const machined = cyl(Rm, 1, M.workCut, { axis: 'x', seg: 48 });
    for (const m of [uncut, machined]) {
      const rad = m === uncut ? R : Rm;
      for (const a of [0, 2.1, 4.2]) {
        const st = box(1, 0.05, 0.12, M.darkSteel);
        st.position.set(0, Math.cos(a) * (rad + 0.005), Math.sin(a) * (rad + 0.005));
        st.rotation.x = -a;
        m.add(st);
      }
    }
    const chuck = cyl(2.55, 0.9, M.castIron, { axis: 'x', seg: 40 });
    at(chuck, 4.85, 0, 0);
    for (let k = 0; k < 3; k++) {
      const jaw = box(0.9, 0.6, 0.6, M.darkSteel);
      const a = (k * 2 * Math.PI) / 3 + 0.5;
      at(jaw, 4.85, Math.cos(a) * 2.0, Math.sin(a) * 2.0);
      jaw.rotation.x = -a;
      spin.add(jaw);
    }
    spin.add(uncut, machined, chuck);
    const headstock = box(2.4, 5.4, 4.6, M.paint);
    at(headstock, 7.3, 2.7, 0);
    const bedPlate = box(16, 0.3, 6, M.castIron);
    at(bedPlate, 1, 0.15, 3);
    useGroup.add(spin, headstock, bedPlate);

    const carriage = new THREE.Group(); // translates along x
    useGroup.add(carriage);
    const T2 = buildTool();
    T2.ann.visible = false;
    const toolRot = new THREE.Group();
    toolRot.rotation.y = Math.PI / 2;
    toolRot.position.set(-T2.zN, barY - (T2.hs + 0.08), Rm + T2.xN);
    toolRot.add(T2.group);
    carriage.add(toolRot);
    const post = box(2.8, 2.12, 3.0, M.paint);
    at(post, 0, 1.06 + 0.15, 7.2);
    const clamp = box(2.8, 0.45, 3.0, M.paintDark);
    at(clamp, 0, barY + 0.23, 7.2);
    carriage.add(post, clamp);
    // chip coil (screw illusion): helix rotating about its axis
    const coilPts = [];
    for (let i = 0; i <= 90; i++) {
      const a = (i / 90) * Math.PI * 2 * 3.2;
      coilPts.push([Math.cos(a) * 0.3, (i / 90) * 1.7, Math.sin(a) * 0.3]);
    }
    const coil = tube(coilPts, 0.055, M.workCut, { seg: 120, radial: 6 });
    const coilSpin = group(coil);
    const coilOrient = new THREE.Group();
    coilOrient.add(coilSpin);
    const flow = new V3(-0.35, 0.55, -0.75).normalize();
    coilOrient.quaternion.setFromUnitVectors(new V3(0, 1, 0), flow);
    const edgeMid = T2.topP[T2.iT2].clone().lerp(T2.topP[T2.iA], 0.15);
    coilOrient.position.set(edgeMid.x - 0.1, edgeMid.y + 0.08 + 0.22, edgeMid.z - 0.15);
    const ribbon = seg([edgeMid.x, edgeMid.y + 0.08 + 0.02, edgeMid.z], [coilOrient.position.x, coilOrient.position.y, coilOrient.position.z], M.workCut, 0.06);
    T2.group.add(coilOrient, ribbon);
    // arrows
    const vArrow = spinArrow(2.9, M.vColor, { axis: 'x', arc: Math.PI * 1.4, tube: 0.05 });
    at(vArrow, -4.4, barY, 0);
    useGroup.add(vArrow);
    carriage.add(arrow([-0.4, barY + 0.9, 3.4], [1, 0, 0], 1.7, M.fColor));
    carriage.add(arrow([0.3, barY + 0.3, Rm + 1.4], [0, 0, -1], 1.4 - 0.05, M.dColor));
    const lblV = label('V', [-4.4, barY + 3.3, 0], 0.5);
    const lblF = label('f', [0.5, barY + 1.4, 3.4], 0.5);
    const lblD = label('d', [0.3, barY + 0.9, Rm + 1.5], 0.5);
    useGroup.add(lblV);
    carriage.add(lblF, lblD);

    const parts = [
      { id: 'shank', name: 'Shank', object: P.shank, desc: 'The body of the tool that is held in the tool post. It is rectangular or square in section and carries the cutting head at one end.', slide: 9, qs: ['2022-23_5a', '2020-21_1a'], anchor: [-3, 1.5, 0] },
      { id: 'face', name: 'Face (rake face)', object: P.face, desc: 'The top surface over which the chip slides as it leaves the work. Its slope gives the back rake and side rake angles.', slide: 11, qs: ['2020-21_1a'], anchor: [1.3, 1.45, 0.4] },
      { id: 'principal-flank', name: 'Principal (side) flank', object: P.flankP, desc: 'The surface below and adjacent to the side cutting edge. It is relieved (side relief angle) so it does not rub the machined surface.', slide: 11, qs: ['2020-21_1a'], anchor: [1.4, 0.7, 1.15] },
      { id: 'auxiliary-flank', name: 'Auxiliary (end) flank', object: P.flankA, desc: 'The surface below and adjacent to the end cutting edge. The end relief angle keeps it clear of the finished surface.', slide: 11, qs: ['2020-21_1a'], anchor: [2.5, 0.7, 0.3] },
      { id: 'side-cutting-edge', name: 'Side cutting edge', object: P.edgeS, desc: 'The edge formed where the face meets the principal flank. It does most of the cutting; its angle to the shank is the side cutting edge angle.', slide: 11, qs: ['2020-21_1a'], anchor: [1.5, 1.35, 0.9] },
      { id: 'end-cutting-edge', name: 'End cutting edge', object: P.edgeE, desc: 'The edge formed where the face meets the auxiliary flank. It finishes the surface; the end cutting edge angle stops it dragging on the work.', slide: 11, qs: ['2020-21_1a'], anchor: [2.4, 1.35, 0.4] },
      { id: 'nose', name: 'Nose (nose radius)', object: P.noseG, desc: 'The rounded corner where the side and end cutting edges meet. A larger radius strengthens the tip and gives a better surface finish.', slide: 11, qs: ['2020-21_1a'], anchor: [2.7, 1.2, 1.3] },
      { id: 'heel', name: 'Heel', object: P.heelG, desc: 'The lowest portion of the tool at the corner where the flank meets the base.', slide: 11, qs: [], anchor: [2.0, 0.1, -0.1] },
      { id: 'base', name: 'Base', object: P.base, desc: 'The underside of the shank that seats on the tool post and supports the tool against the cutting force.', slide: 11, qs: [], anchor: [-2.5, 0.0, 0.5] },
      { id: 'insert-holder', name: 'Insert tool holder', object: ins.parts.holder, desc: 'Steel shank with a pocket at one end that locates the indexable insert; it stays in the tool post while worn inserts are changed.', slide: 9, qs: ['2022-23_5a'], anchor: [-1, 1.2, 0] },
      { id: 'insert', name: 'Carbide insert', object: ins.parts.insert, desc: 'A replaceable carbide tip with several cutting corners. Only one cutting edge engages the work at a time, so it is still a single-point tool; it is indexed to a fresh corner when worn.', slide: 9, qs: ['2022-23_5a', '2020-21_1a'], anchor: [1.2, 1.5, 0] },
      { id: 'insert-pocket', name: 'Seat and shim', object: ins.parts.pocket, desc: 'The hardened shim and locating walls under and behind the insert, which support it rigidly under the cutting force.', slide: 9, qs: [], anchor: [0.6, 1.4, 0] },
      { id: 'clamp-screw', name: 'Clamp screw', object: ins.parts.screw, desc: 'Holds the insert down in its pocket. Loosen it to index or replace the insert.', slide: 9, qs: [], anchor: [1.2, 1.6, 0] },
    ];

    const modes = [
      { id: 'nomenclature', label: 'Nomenclature', slide: 9, qs: ['2022-23_5a', '2020-21_1a'],
        info: 'A single-point cutting tool has one main cutting edge that removes material in a single pass, e.g. the turning tool. Examples: turning, shaping, planing, slotting and boring tools. Parts: shank, face (rake face), principal and auxiliary flanks, side and end cutting edges, nose radius, heel and base.' },
      { id: 'angles', label: 'Tool angles', slide: 11, qs: ['2020-21_1a'],
        info: 'Back rake and side rake slope the face and control chip flow and cutting force. End relief and side relief keep the flanks from rubbing. The side cutting edge angle sets the lead and chip thickness; the end cutting edge angle clears the finished surface. Nose radius strengthens the tip.' },
      { id: 'insert', label: 'Indexable insert', slide: 9, qs: ['2022-23_5a', '2020-21_1a'],
        info: 'A clamped carbide insert has several cutting corners, but only one cutting edge can engage the work at a time. When it wears, the screw is loosened and the insert is indexed (rotated) to a fresh corner, so no regrinding is needed. It remains a single-point tool.' },
      { id: 'in-use', label: 'Tool in use', slide: 8, qs: ['2020-21_1a'],
        info: 'Turning: the work rotates with cutting velocity V (red), the tool feeds along the bar with feed f (blue) and the tool is set to depth of cut d (green). The chip curls off the rake face. Other single-point tools are used in shaping, planing, slotting and boring.' },
    ];

    let mode = 'nomenclature';
    let tm = 0;
    let idxCount = 0;
    let idxPhase = 0;
    const setVis = () => {
      nomGroup.visible = mode === 'nomenclature' || mode === 'angles';
      T.ann.visible = mode === 'angles';
      insGroup.visible = mode === 'insert';
      useGroup.visible = mode === 'in-use';
    };
    const smooth = (x) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c); };
    const applyUse = () => {
      const T_ = 11;
      const ph = (tm % T_) / T_;
      let xt, zOff = 0;
      if (ph < 0.8) xt = -3.2 + (ph / 0.8) * 6.2;
      else if (ph < 0.9) { xt = 3.0; zOff = 0; }
      else { xt = 3.0; zOff = 0; }
      if (ph >= 0.9) zOff = smooth((ph - 0.9) / 0.08) * 2.2;
      if (ph < 0.08) { xt = -3.2; zOff = (1 - smooth(ph / 0.08)) * 2.2; }
      if (ph >= 0.98) { xt = -3.2; zOff = 2.2; }
      carriage.position.set(xt, 0, zOff);
      const cutting = ph >= 0.08 && ph < 0.9;
      const xs = ph >= 0.08 && ph < 0.9 ? xt : (ph < 0.08 ? -4 : 4.4);
      const startX = -4;
      const endX = 4.4;
      const mEnd = ph >= 0.9 ? endX : (ph < 0.08 ? startX : xs);
      machined.scale.x = Math.max(0.001, mEnd - startX);
      machined.position.x = (mEnd + startX) / 2;
      uncut.scale.x = Math.max(0.001, endX - mEnd);
      uncut.position.x = (endX + mEnd) / 2;
      coilOrient.visible = cutting;
    };
    const applyInsert = () => {
      const T_ = 7;
      const ph = tm % T_;
      const cyc = Math.floor(tm / T_);
      let lift = 0, rotA = 0;
      if (ph < 1.2) lift = smooth(ph / 1.2);
      else if (ph < 2.5) { lift = 1; rotA = smooth((ph - 1.2) / 1.3); }
      else if (ph < 3.4) { lift = 1 - smooth((ph - 2.5) / 0.9); rotA = 1; }
      else { lift = 0; rotA = 1; }
      // rotation accumulates: completed indexes (cyc) + current
      idxCount = cyc;
      // before the current index begins, wear counts cyc; the corner leaving becomes worn
      ins.insertSpin.rotation.y = -(Math.PI / 2) * (cyc + rotA);
      ins.insertSpin.position.y = 1.06 + lift * 0.7;
      const done = (cyc + (rotA >= 1 ? 1 : 0)) % 4;
      for (let k = 0; k < 4; k++) ins.wear[k].visible = k < done;
    };

    return {
      root,
      parts,
      modes,
      setMode(id) {
        mode = id;
        tm = 0;
        idxCount = 0;
        idxPhase = 0;
        setVis();
        if (mode === 'in-use') applyUse();
        if (mode === 'insert') applyInsert();
      },
      update(dt) {
        tm += dt;
        if (mode === 'in-use') {
          spin.rotation.x += dt * 3.2;
          coilSpin.rotation.y += dt * 4;
          applyUse();
        } else if (mode === 'insert') {
          applyInsert();
        }
        void idxPhase;
      },
      readout() {
        if (mode === 'in-use') return [['Cutting motion V', 'work rotates'], ['Feed f', 'tool along bar'], ['Depth of cut d', 'radial']];
        if (mode === 'insert') return [['Edges cutting', '1 at a time'], ['Indexes done', String(idxCount % 4)]];
        return [['Back rake', `${AM.back}°`], ['Side rake', `${AM.side}°`], ['End relief', `${AM.endRel}°`], ['Side relief', `${AM.sideRel}°`], ['Side cutting edge angle', `${AM.scea}°`], ['End cutting edge angle', `${AM.ecea}°`]];
      },
      legend: [['V', 'cutting motion'], ['f', 'feed'], ['d', 'depth of cut']],
    };
  },
};
