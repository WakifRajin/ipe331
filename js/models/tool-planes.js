import * as THREE from 'three';
import { M, box, cyl, tube, arrow, group, textSprite } from '../kit.js';

const D2R = Math.PI / 180, R2D = 180 / Math.PI;
const V3 = THREE.Vector3;
const A = { gx: 6, gy: 10, ax: 8, ay: 6, phiS: 20, phiE: 10 }; // ASA angles (deg)
const tg = (d) => Math.tan(d * D2R);
const tgx = tg(A.gx), tgy = tg(A.gy), tax = tg(A.ax), tay = tg(A.ay), tps = tg(A.phiS), tpe = tg(A.phiE);
const sps = Math.sin(A.phiS * D2R), cps = Math.cos(A.phiS * D2R), spe = Math.sin(A.phiE * D2R), cpe = Math.cos(A.phiE * D2R);
const mS = tgy - tps * tgx, mE = tpe * tgy + tgx;
const yT = (x, z) => z * tgy - x * tgx;
const P3 = (x, z) => new V3(x, yT(x, z), z);
const Lp = 1.8, Le = 1.2, ZB = 4.6, YB = -1.3;
const tgo = sps * tgy + cps * tgx;
const kO = 1 / (cps * tax) - mS * sps;
const BAR_Y = 3, R_UN = 2.0, R_M = 1.8, S = 1.9;

const X = new V3(1, 0, 0), Y = new V3(0, 1, 0), Z = new V3(0, 0, 1);
const epH = new V3(sps, 0, cps), eeH = new V3(-cpe, 0, spe), nc = new V3(cps, 0, -sps);
const NP = P3(0, 0), AP = P3(Lp * sps, Lp * cps), BP = P3(-Le * cpe, Le * spe);
const Eu = AP.clone().sub(NP).normalize();

function solid(top, bot) {
  const all = [...top, ...bot];
  const C = all.reduce((s, p) => s.add(p), new V3()).multiplyScalar(1 / all.length);
  const arr = [];
  const tri = (p, q, r) => {
    const n = q.clone().sub(p).cross(r.clone().sub(p));
    const fc = p.clone().add(q).add(r).multiplyScalar(1 / 3).sub(C);
    if (n.dot(fc) < 0) [q, r] = [r, q];
    arr.push(p.x, p.y, p.z, q.x, q.y, q.z, r.x, r.y, r.z);
  };
  const n = top.length;
  for (let i = 1; i < n - 1; i++) { tri(top[0], top[i], top[i + 1]); tri(bot[0], bot[i], bot[i + 1]); }
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; tri(top[i], top[j], bot[j]); tri(top[i], bot[j], bot[i]); }
  return { arr, C };
}
function mesh(arr, mat, offset = false) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
  g.computeVertexNormals();
  let m = mat;
  if (offset) { m = mat.clone(); m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; }
  const o = new THREE.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; return o;
}
function seg(a, b, mat, r = 0.015) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, a.distanceTo(b), 6), mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(Y, b.clone().sub(a).normalize());
  m.renderOrder = 8; return m;
}
const overlay = (c) => new THREE.MeshBasicMaterial({ color: c, depthTest: false, transparent: true });
const refMat = overlay(0x8a929a), angMat = overlay(0xe9a321);
function lbl(text, p, size = 0.3) { const s = textSprite(text, { size }); s.position.copy(p); return s; }

function mark(u, w, r, text) {
  u = u.clone().normalize(); w = w.clone().normalize();
  const th = Math.acos(Math.min(1, u.dot(w)));
  const v = w.clone().addScaledVector(u, -u.dot(w)).normalize();
  const g = new THREE.Group(), O = new V3();
  g.add(seg(O, u.clone().multiplyScalar(r + 0.35), refMat, 0.012), seg(O, w.clone().multiplyScalar(r + 0.35), angMat, 0.02));
  const pts = [];
  for (let i = 0; i <= 20; i++) { const a = (th * i) / 20; pts.push(u.clone().multiplyScalar(Math.cos(a) * r).addScaledVector(v, Math.sin(a) * r).toArray()); }
  const arc = tube(pts, 0.02, angMat, { seg: 24, radial: 6 }); arc.renderOrder = 8; g.add(arc);
  const mid = u.clone().multiplyScalar(Math.cos(th / 2)).addScaledVector(v, Math.sin(th / 2)).multiplyScalar(r + 0.55);
  g.add(lbl(text, mid, 0.26));
  g.userData.deg = th * R2D;
  return g;
}
const deg = (d) => d.toFixed(1) + '°';

function buildTool() {
  const xA = AP.x, xB = BP.x;
  const a1 = tps - tax * mS, b1 = tax * YB;
  const a2 = -(tpe + tay * mE), b2 = -tay * YB;
  const nx = (a1 * b2 + b1) / (1 - a1 * a2), nz = a2 * nx + b2;
  const Nb = new V3(nx, YB, nz);
  const Ab = new V3(xA, YB, (xA - tax * YB) / a1);
  const Bb = new V3(xB, YB, a2 * xB + b2);
  const A2 = P3(xA, ZB), C2 = P3(xB, ZB);
  const A2b = new V3(xA, YB, ZB), C2b = new V3(xB, YB, ZB);
  const top = [NP, AP, A2, C2, BP], bot = [Nb, Ab, A2b, C2b, Bb];
  const { arr, C } = solid(top, bot);
  const g = new THREE.Group();
  g.add(mesh(arr, M.hss));
  const face = (pts, mat) => {
    const a = [];
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[0], q = pts[i], r = pts[i + 1];
      const n = q.clone().sub(p).cross(r.clone().sub(p)), fc = p.clone().add(q).add(r).multiplyScalar(1 / 3).sub(C);
      a.push(...(n.dot(fc) < 0 ? [p, r, q] : [p, q, r]).flatMap((v) => v.toArray()));
    }
    return mesh(a, mat, true);
  };
  g.add(face(top, M.chrome), face([NP, AP, Ab, Nb], M.steel), face([NP, BP, Bb, Nb], M.darkSteel));
  g.add(tube([NP.toArray(), AP.toArray()], 0.035, M.amber, { seg: 2, radial: 6 }), tube([NP.toArray(), BP.toArray()], 0.035, M.amber, { seg: 2, radial: 6 }));
  return g;
}

function planeObj(id, sym, u, v, col, lab) {
  const g = new THREE.Group();
  const c = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => u.clone().multiplyScalar(a * S).addScaledVector(v, b * S));
  const geo = new THREE.BufferGeometry().setFromPoints([c[0], c[1], c[2], c[0], c[2], c[3]]);
  const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false });
  const q = new THREE.Mesh(geo, mat);
  const ol = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(c), new THREE.LineBasicMaterial({ color: col }));
  g.add(q, ol, lbl(sym, u.clone().multiplyScalar(lab[0] * S).addScaledVector(v, lab[1] * S), 0.34));
  g.userData.mat = mat;
  return g;
}

export default {
  id: 'tool-planes',
  title: 'Tool reference planes (ASA & ORS)',
  subtitle: 'The six planes through the tool tip and the angles measured in them',
  camera: { position: [5.6, 6.4, 11], target: [0, 3.1, 2.8] },
  build() {
    const root = new THREE.Group();
    const plate = box(11, 0.3, 8.5, M.castIron); plate.position.set(0.8, 0.15, 3.2);
    const post = box(2.6, 1.4, 3.0, M.paint); post.position.set(-0.28, 1.0, 4.9);
    const spin = new THREE.Group(); spin.position.set(0, BAR_Y, 0);
    const un = cyl(R_UN, 4, M.work, { axis: 'x', seg: 48 }); un.position.x = 2;
    const mc = cyl(R_M, 4.5, M.workCut, { axis: 'x', seg: 48 }); mc.position.x = -2.25;
    for (const a of [0, 2.1, 4.2]) { const st = box(1, 0.05, 0.12, M.darkSteel); st.position.set(2, Math.cos(a) * (R_UN + 0.005), Math.sin(a) * (R_UN + 0.005)); st.rotation.x = -a; spin.add(st); }
    const chuck = cyl(2.6, 0.9, M.castIron, { axis: 'x' }); chuck.position.x = 4.45;
    spin.add(un, mc, chuck);
    const workG = group(spin);
    root.add(plate, post, workG);

    const tip = new THREE.Group(); tip.position.set(0, BAR_Y, R_M);
    root.add(tip);
    const tool = buildTool();
    const vc = group(arrow([0, 1.6, 0], [0, -1, 0], 1.45, M.vColor), lbl('Vc', new V3(0, 1.95, 0), 0.4));
    const feed = group(arrow([-0.8, 1.0, 1.4], [1, 0, 0], 1.6, M.fColor), lbl('f (feed)', new V3(0.2, 1.4, 1.4), 0.32));
    tip.add(tool, vc, feed);

    const hn = Eu.clone().cross(Y).normalize();
    const vn = Eu.clone().cross(hn).normalize();
    const PL = {
      'pi-r': planeObj('pi-r', 'πR', X, Z, 0xe9a321, [-0.9, 0.9]),
      'pi-x': planeObj('pi-x', 'πx', X, Y, 0x1fa3a3, [0.9, 0.9]),
      'pi-y': planeObj('pi-y', 'πy', Z, Y, 0x8e5bd6, [0.9, -0.9]),
      'pi-c': planeObj('pi-c', 'πc', epH, Y, 0xe0508a, [0.9, 0.9]),
      'pi-o': planeObj('pi-o', 'πo', nc, Y, 0x7bb33a, [0.9, -0.9]),
      'pi-n': planeObj('pi-n', 'πn', hn, vn, 0xc8683a, [-0.9, 0.9]),
    };
    for (const k in PL) tip.add(PL[k]);

    // angle marks
    const mo = nc.clone().negate();
    const nF = new V3(tgx, 1, -tgy).normalize();
    let wn = nF.clone().cross(Eu).normalize(); if (wn.dot(mo) < 0) wn.negate(); if (wn.y < 0) wn.negate();
    let un2 = Eu.clone().cross(Y).normalize(); if (un2.dot(mo) < 0) un2.negate();
    const marks = {
      asa: [
        mark(new V3(-1, 0, 0), new V3(-1, tgx, 0), 1.2, `γx = ${A.gx}°`),
        mark(Z, new V3(0, tgy, 1), 1.5, `γy = ${A.gy}°`),
        mark(new V3(0, -1, 0), new V3(-tax, -1, 0), 1.0, `αx = ${A.ax}°`),
        mark(new V3(0, -1, 0), new V3(0, -1, tay), 0.8, `αy = ${A.ay}°`),
        mark(Z, epH, 2.0, `SCEA φs = ${A.phiS}°`),
        mark(new V3(-1, 0, 0), eeH, 1.6, `ECEA φe = ${A.phiE}°`),
      ],
      ors: [
        mark(mo, mo.clone().addScaledVector(Y, tgo), 1.5, ''),
        mark(Y.clone().negate(), mo.clone().addScaledVector(Y, -kO), 1.1, ''),
        mark(X, epH, 2.3, `φ = ${90 - A.phiS}°`),
        mark(epH, Eu, 2.7, ''),
      ],
      nrs: [mark(un2, wn, 1.5, ''), mark(epH, Eu, 2.7, '')],
    };
    const gO = marks.ors[0].userData.deg, aO = marks.ors[1].userData.deg, lam = marks.ors[3].userData.deg;
    const gN = marks.nrs[0].userData.deg;
    // replace blank labels with computed ones
    const relabel = (g, text, r) => {
      const sp = g.children[g.children.length - 1];
      g.remove(sp);
      const w = g.children[1];
      void w;
      const t = lbl(text, sp.position, 0.26); g.add(t);
    };
    relabel(marks.ors[0], `γo = ${deg(gO)}`);
    relabel(marks.ors[1], `αo = ${deg(aO)}`);
    relabel(marks.ors[3], `λ = −${deg(lam)}`);
    relabel(marks.nrs[0], `γn = ${deg(gN)}`);
    relabel(marks.nrs[1], `λ = −${deg(lam)}`);
    const markG = {};
    for (const k in marks) { markG[k] = group(...marks[k]); markG[k].visible = false; tip.add(markG[k]); }

    const MODE_PL = { asa: ['pi-r', 'pi-x', 'pi-y'], ors: ['pi-r', 'pi-c', 'pi-o'], nrs: ['pi-r', 'pi-c', 'pi-n'], 'all-planes': Object.keys(PL) };
    const ASAIN = 'Slide 24 defines the planes; angles are then named after the plane in which they are measured.';
    void ASAIN;
    const modes = [
      { id: 'asa', label: 'ASA system', slide: 24, qs: ['2023-24_1a', '2010-11_3a', '2010-11_3b', '2021-22_6b', '2014-15_4b', '2012-13_2a', '2018-19_2a'],
        info: 'ASA (machine reference) system: πR is perpendicular to Vc, πx is perpendicular to πR along the longitudinal feed and πy is perpendicular to both (cross-feed direction). Side rake γx and side relief αx are measured in πx; back rake γy and end relief αy in πy; SCEA φs and ECEA φe in the plan view (πR).' },
      { id: 'ors', label: 'ORS system', slide: 24, qs: ['2023-24_1a', '2010-11_3a', '2022-23_6c', '2021-22_6c', '2020-21_8a', '2015-16_5c', '2009-10_3b'],
        info: 'Orthogonal rake system: πc is perpendicular to πR and contains the principal cutting edge; πo is perpendicular to both πR and πc. Orthogonal rake γo and orthogonal clearance αo are measured in πo; principal cutting edge angle φ (= 90° − SCEA) in πR; inclination λ in πc. tanγx = tanγo sinφ + tanλ cosφ, tanγy = tanγo cosφ − tanλ sinφ.' },
      { id: 'nrs', label: 'NRS (normal plane)', slide: 24, qs: ['2023-24_1a', '2010-11_3a'],
        info: 'The normal plane πn is perpendicular to the principal cutting edge itself (not to its projection). The normal rake γn is measured in πn and is related to the orthogonal rake by tanγn = tanγo cosλ.' },
      { id: 'all-planes', label: 'All six planes', slide: 24, qs: ['2023-24_1a', '2021-22_6b'],
        info: 'πR (perpendicular to Vc), πx (longitudinal), πy (transverse), πc (contains the principal edge, ↔ πR), πo (↔ πR and πc) and πn (perpendicular to the principal edge). Click a plane for its definition.' },
    ];
    const reads = {
      asa: [['Back rake γy', `${A.gy}°`], ['Side rake γx', `${A.gx}°`], ['End relief αy', `${A.ay}°`], ['Side relief αx', `${A.ax}°`], ['ECEA φe', `${A.phiE}°`], ['SCEA φs', `${A.phiS}°`]],
      ors: [['Orthogonal rake γo', deg(gO)], ['Orthogonal clearance αo', deg(aO)], ['Cutting edge angle φ', `${90 - A.phiS}°`], ['Inclination λ', '−' + deg(lam)]],
      nrs: [['Normal rake γn', deg(gN)], ['Inclination λ', '−' + deg(lam)]],
      'all-planes': [['πR', '⊥ Vc'], ['πx', '⊥ πR, along feed'], ['πy', '⊥ πR, πx'], ['πc', '⊥ πR, has edge'], ['πo', '⊥ πR, πc'], ['πn', '⊥ edge']],
    };
    let mode = 'asa', tm = 0;
    const setMode = (id) => {
      mode = id; tm = 0;
      for (const k in PL) PL[k].visible = MODE_PL[id].includes(k);
      for (const k in markG) markG[k].visible = k === id;
    };
    setMode('asa');
    const pd = (id, name, desc, qs = ['2023-24_1a', '2021-22_6b']) => ({ id, name, object: PL[id], desc, slide: 24, qs, anchor: [0, 1.5, 0] });
    const parts = [
      { id: 'tool', name: 'Single-point turning tool', object: tool, desc: 'Tool with back rake 10°, side rake 6°, end relief 6°, side relief 8°, SCEA 20° and ECEA 10° (nose radius omitted). See the single-point tool model for nomenclature.', slide: 11, qs: ['2021-22_6b', '2012-13_2a'], anchor: [0, 3.4, 4] },
      { id: 'work', name: 'Turned bar', object: workG, desc: 'The rotating bar; its surface speed at the tool tip is the cutting velocity Vc, directed tangentially.', slide: 8, qs: [], anchor: [-2, 5, 0] },
      pd('pi-r', 'Reference plane πR', 'The plane perpendicular to the cutting velocity Vc; parallel to the tool base in a lathe.'),
      pd('pi-x', 'Machine longitudinal plane πx', 'The plane perpendicular to πR and taken in the direction of feed (longitudinal feed).'),
      pd('pi-y', 'Machine transverse plane πy', 'The plane perpendicular to both πR and πx, i.e. taken in the direction of cross feed.'),
      pd('pi-c', 'Principal cutting plane πc', 'The plane perpendicular to πR that contains the principal cutting edge.'),
      pd('pi-o', 'Orthogonal plane πo', 'The plane perpendicular to both πR and πc; orthogonal rake and clearance are measured here.'),
      pd('pi-n', 'Normal plane πn', 'The plane perpendicular to the principal cutting edge.'),
      { id: 'vc', name: 'Cutting velocity Vc', object: vc, desc: 'Velocity of the work surface relative to the tool tip (red); πR is perpendicular to it.', slide: 24, qs: [], anchor: [0, 5.2, 1.8] },
      { id: 'feed', name: 'Feed f', object: feed, desc: 'Longitudinal feed direction of the tool along the bar (blue); defines the trace of πx.', slide: 24, qs: [], anchor: [0, 4.6, 3.2] },
    ];
    return {
      root, parts, modes, setMode,
      update(dt) {
        tm += dt;
        spin.rotation.x += dt * 1.6;
        const o = 0.2 + 0.04 * Math.sin(tm * 2);
        for (const k in PL) PL[k].userData.mat.opacity = o;
      },
      readout: () => reads[mode],
      legend: [['V', 'cutting velocity Vc'], ['f', 'feed']],
    };
  },
};
