// Hole-making sequence: centering, drilling, boring, reaming, counterboring, countersinking, spotfacing, tapping.
// Slides 159-160 (operations), 166-170 (cutting conditions). Half-sectioned workpiece so the hole profile is visible.
import * as THREE from 'three';
import { M, box, cyl, revolve, at, arrow, spinArrow } from '../kit.js';
import { buildTwistDrill } from './twist-drill.js';

const R = 3.0; // workpiece radius
const H = 2.4; // thickness
const WY = 0.5; // work rests on parallels
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (x) => { const c = clamp(x, 0, 1); return c * c * (3 - 2 * c); };
const DEG = Math.PI / 180;

// ---------- hole contours: [r, y, flag] from the top surface into the hole. flag 0 = surface, 1 = rough (drilled), 2 = machined
function contour(mode, p) {
  const top = [[R, H, 0]];
  const wallAt = (rr, dd, flag) => [[rr, H, flag], [rr, H - dd, flag]];
  switch (mode) {
    case 'centering': {
      const q = Math.max(p, 0.001);
      return { pts: [...top, [0.3 * q, H, 2], [0.1 * q, H - 0.35 * q, 2], [0.1 * q, H - 0.55 * q, 2], [0, H - 0.6 * q, 2]], through: false };
    }
    case 'drilling':
    case 'drill-through': {
      const r = 0.5, c = r / Math.tan(59 * DEG);
      const total = mode === 'drilling' ? 1.7 + c : H + c;
      const a = Math.max(p * total, 0.001);
      if (a < c) return { pts: [...top, [a / c * r, H, 1], [0, H - a, 1]], through: false };
      const yw = H - (a - c);
      if (yw <= 0) return { pts: [...top, [r, H, 1], [r, 0, 1]], through: true };
      return { pts: [...top, [r, H, 1], [r, yw, 1], [0, H - a, 1]], through: false };
    }
    case 'boring':
    case 'reaming': {
      const rb = mode === 'boring' ? 0.62 : 0.54;
      const b = mode === 'boring' ? p * H : Math.min(H, p * (H + 0.6));
      if (b < 0.004) return { pts: [...top, [0.5, H, 1], [0.5, 0, 1]], through: true };
      if (b >= H - 0.004) return { pts: [...top, [rb, H, 2], [rb, 0, 2]], through: true };
      return { pts: [...top, [rb, H, 2], [rb, H - b, 2], [0.5, H - b, 1], [0.5, 0, 1]], through: true };
    }
    case 'counterboring': {
      const c = p * 0.6;
      if (c < 0.004) return { pts: [...top, [0.4, H, 1], [0.4, 0, 1]], through: true };
      return { pts: [...top, [0.8, H, 2], [0.8, H - c, 2], [0.4, H - c, 2], [0.4, 0, 1]], through: true };
    }
    case 'countersinking': {
      const e = p * 0.5;
      if (e < 0.004) return { pts: [...top, [0.4, H, 1], [0.4, 0, 1]], through: true };
      return { pts: [...top, [0.4 + e, H, 2], [0.4, H - e, 2], [0.4, 0, 1]], through: true };
    }
    case 'spotfacing': {
      const dome = (r) => H + 0.07 * (1 - (r / 1.4) * (r / 1.4));
      const yf = H + 0.07 - p * 0.1, rs = 1.05;
      const pts = [[R, H - 0.3, 0], [1.5, H - 0.3, 0], [1.4, H, 0]];
      const rStar = 1.4 * Math.sqrt(Math.max(0, 1 - (yf - H) / 0.07));
      const rc = Math.min(rs, rStar);
      const lo = Math.max(rc, 0.4);
      for (let i = 1; i <= 10; i++) { const r = 1.4 + ((lo - 1.4) * i) / 10; pts.push([r, dome(r), 0]); }
      if (rc > 0.4) {
        if (rc >= rs - 1e-6 && yf < dome(rs)) pts.push([rs, yf, 2]);
        pts.push([0.4, yf, 2]);
      } else pts.push([0.4, dome(0.4), 0]);
      pts.push([0.4, 0, 1]);
      return { pts, through: true };
    }
    case 'tapping': {
      const dt = p * 1.8;
      const n = Math.floor(dt / 0.08);
      const pts = [...top, [0.5, H, 2]];
      for (let k = 1; k <= n; k++) pts.push([k % 2 ? 0.42 : 0.5, H - k * 0.08, 2]);
      pts.push([0.42, H - n * 0.08, 2], [0.42, 0, 1]);
      return { pts, through: true };
    }
    default:
      return { pts: [...top, [0.5, H, 1], [0.5, 0, 1]], through: true };
  }
}

const COL = [0.82, 0.55, 1.0];

function buildWorkGeo(c) {
  const pts = c.pts;
  const first = pts[0];
  const L = [];
  if (c.through) L.push([pts[pts.length - 1][0], 0, 0]);
  else L.push([0, 0, 0]);
  L.push([R, 0, 0]);
  // first pt may be at y < H (spotface); (R, y0) then continues
  for (const q of pts) L.push(q);
  void first;
  const v2 = L.map(([r, y]) => new THREE.Vector2(Math.max(r, 0), y));
  const wall = new THREE.LatheGeometry(v2, 40, Math.PI / 2, Math.PI);
  const n = L.length;
  const cnt = wall.attributes.position.count;
  const col = new Float32Array(cnt * 3);
  for (let i = 0; i < cnt; i++) { const f = COL[L[i % n][2]]; col[i * 3] = f; col[i * 3 + 1] = f; col[i * 3 + 2] = f; }
  wall.setAttribute('color', new THREE.BufferAttribute(col, 3));
  wall.computeVertexNormals();
  const poly = L.slice(0, c.through ? L.length - 1 : L.length);
  const mk = (sign) => {
    const s = new THREE.Shape(poly.map(([r, y]) => new THREE.Vector2(sign * r, y)));
    return new THREE.ShapeGeometry(s);
  };
  return { wall, right: mk(1), left: mk(-1) };
}

const readoutDrilling = (() => {
  const D = 12.7, depth = 60, theta = 118, V = 25, f = 0.3;
  const N = (1000 * V) / (Math.PI * D);
  const fr = f * N;
  const A = 0.5 * D * Math.tan((90 - theta / 2) * DEG);
  const Tm = (depth + A) / fr;
  const mrr = ((Math.PI * D * D) / 4) * fr;
  return [
    ['V = πDN → N', `${N.toFixed(0)} rpm  (V=25 m/min, D=12.7)`],
    ['fr = f·N', `${fr.toFixed(0)} mm/min  (f=0.30 mm/rev)`],
    ['A = 0.5·D·tan(90°−θ/2)', `${A.toFixed(2)} mm  (θ=118°)`],
    ['Tm = (depth + A)/fr', `${Tm.toFixed(3)} min = ${(Tm * 60).toFixed(1)} s  (60 mm)`],
    ['MRR = (πD²/4)·fr', `${mrr.toFixed(0)} mm³/min`],
  ];
})();

// ---------- tools (origin at the tool tip, axis +y)
const mkTools = () => {
  const T = {};
  T.centre = revolve([[0, 0], [0.1, 0.1], [0.1, 0.55], [0.3, 0.9], [0.3, 2.0], [0.25, 2.1], [0.25, 3.6], [0, 3.6]], M.hss, { seg: 32 });
  const twist = buildTwistDrill({ R: 0.5, bodyLen: 3, neck: 0.2, shankLen: 1.6, shank: 'straight', slices: 110, overlays: false });
  T.twist = twist.root;
  const ream = buildTwistDrill({ R: 0.54, bodyLen: 2.6, neck: 0.2, shankLen: 1.6, shank: 'straight', helix: 0, n: 6, rcF: 0.72, cl: 0.97, mf: 0.06, af: 0.14, point: 165, slices: 30, overlays: false });
  T.reamer = ream.root;
  const bore = new THREE.Group();
  bore.add(at(cyl(0.3, 4.0, M.steel, { seg: 28 }), 0, 2.0, 0));
  bore.add(at(box(0.5, 0.2, 0.18, M.carbide), 0.37, 0.1, 0));
  bore.add(at(box(0.25, 0.2, 0.3, M.darkSteel), 0.22, 0.1, 0));
  T.boring = bore;
  const stepped = (pilotR, pilotL, cutR, cutL, shankR, total) => {
    const g = new THREE.Group();
    g.add(at(cyl(pilotR, pilotL, M.hss, { seg: 24 }), 0, pilotL / 2, 0));
    g.add(at(cyl(cutR, cutL, M.hss, { seg: 36 }), 0, pilotL + cutL / 2, 0));
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const s = box(0.06, cutL, 0.06, M.black);
      s.position.set(Math.cos(a) * cutR, pilotL + cutL / 2, Math.sin(a) * cutR);
      g.add(s);
    }
    g.add(at(cyl(shankR, total - pilotL - cutL, M.steel, { seg: 24 }), 0, pilotL + cutL + (total - pilotL - cutL) / 2, 0));
    return g;
  };
  T.counterbore = stepped(0.39, 0.9, 0.8, 0.8, 0.4, 3.9);
  T.spotface = stepped(0.39, 0.6, 1.05, 0.5, 0.4, 3.7);
  T.countersink = revolve([[0, 0], [0.9, 0.9], [0.9, 1.6], [0.4, 1.65], [0.4, 3.4], [0, 3.4]], M.hss, { seg: 36 });
  const tp = [[0, 0], [0.34, 0]];
  for (let k = 0; k < 12; k++) { const y = k * 0.16; const rM = Math.min(0.5, 0.36 + 0.05 * k); tp.push([rM, y + 0.04], [0.42, y + 0.12]); }
  tp.push([0.36, 1.95], [0.36, 2.4], [0.4, 2.45], [0.4, 3.4], [0, 3.4]);
  const tap = new THREE.Group();
  tap.add(revolve(tp, M.hss, { seg: 28 }));
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; const s = box(0.1, 1.9, 0.1, M.black); s.position.set(Math.cos(a) * 0.43, 0.97, Math.sin(a) * 0.43); tap.add(s); }
  tap.add(at(box(0.55, 0.5, 0.55, M.darkSteel), 0, 3.65, 0));
  T.tap = tap;
  return T;
};

const MODES = {
  centering: { tool: 'centre', touch: H, travel: 0.6, spin: 14 },
  drilling: { tool: 'twist', touch: H, travel: 2.0, spin: 14 },
  'drill-through': { tool: 'twist', touch: H, travel: H + 0.31, spin: 14 },
  boring: { tool: 'boring', touch: H, travel: H, spin: 10 },
  reaming: { tool: 'reamer', touch: H, travel: H + 0.6, spin: 8 },
  counterboring: { tool: 'counterbore', touch: H - 0.9, travel: 0.6, spin: 8 },
  countersinking: { tool: 'countersink', touch: H - 0.4, travel: 0.5, spin: 8 },
  spotfacing: { tool: 'spotface', touch: H + 0.07 - 0.6, travel: 0.1, spin: 8 },
  tapping: { tool: 'tap', touch: H, travel: 1.8, spin: 5 },
};

export default {
  id: 'hole-ops',
  title: 'Hole-making sequence',
  subtitle: 'Centering, drilling, boring, reaming and the related hole operations in a half-section',
  camera: { position: [9.5, 6.5, 12], target: [0, 4.0, -0.5] },
  build() {
    const root = new THREE.Group();
    // parallels + floor-level support
    for (const x of [-2.2, 2.2]) root.add(at(box(0.6, WY, 3.6, M.castIron), x, WY / 2, -0.3));

    const work = new THREE.Group();
    work.position.y = WY;
    root.add(work);
    const workMat = M.work.clone();
    workMat.vertexColors = true;
    workMat.side = THREE.DoubleSide;
    const faceMat = M.workCut.clone();
    faceMat.side = THREE.DoubleSide;
    const wallMesh = new THREE.Mesh(new THREE.BufferGeometry(), workMat);
    const faceR = new THREE.Mesh(new THREE.BufferGeometry(), faceMat);
    const faceL = new THREE.Mesh(new THREE.BufferGeometry(), faceMat);
    wallMesh.castShadow = wallMesh.receiveShadow = true;
    work.add(wallMesh, faceR, faceL);
    // ghost of the removed front half
    const ghostGeo = new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(R, 0), new THREE.Vector2(R, H), new THREE.Vector2(0, H)], 40, -Math.PI / 2, Math.PI);
    const ghost = new THREE.Mesh(ghostGeo, M.glass);
    ghost.renderOrder = 2;
    work.add(ghost);

    const tools = mkTools();
    const rig = new THREE.Group(); // moves vertically; origin = tool tip
    work.add(rig);
    const spinGroups = {};
    for (const k of Object.keys(tools)) {
      const sg = new THREE.Group();
      sg.add(tools[k]);
      sg.visible = false;
      rig.add(sg);
      spinGroups[k] = sg;
    }
    const vArrow = spinArrow(0.95, M.vColor, { axis: 'y', arc: Math.PI * 1.4 });
    vArrow.position.y = 4.1;
    const fArrow = arrow([-1.5, 4.6, 0], [0, -1, 0], 1.1, M.fColor);
    rig.add(vArrow, fArrow);
    const dDrill = arrow([0, H + 0.45, 0], [1, 0, 0], 0.5, M.dColor);
    const dBore = arrow([0.5, H + 0.45, 0], [1, 0, 0], 0.3, M.dColor);
    dDrill.visible = dBore.visible = false;
    work.add(dDrill, dBore);

    let mode = 'centering';
    let clock = 0;
    let key = '';
    let spinA = 0;
    let p = 0;
    let phase = '';
    let tipY = 0;
    const T = 9;

    const rebuild = (c) => {
      const g = buildWorkGeo(c);
      wallMesh.geometry.dispose(); faceR.geometry.dispose(); faceL.geometry.dispose();
      wallMesh.geometry = g.wall; faceR.geometry = g.right; faceL.geometry = g.left;
    };

    const apply = () => {
      const cfg = MODES[mode];
      const u = clock % T;
      let gap = 0;
      let dir = -1;
      if (u < 1.2) { p = 0; gap = 1.5 * (1 - smooth(u / 1.2)); phase = 'rapid approach'; }
      else if (u < 5.7) { p = (u - 1.2) / 4.5; phase = 'feeding'; }
      else if (u < 6.2) { p = 1; phase = 'dwell'; }
      else if (u < 8) { p = 1; gap = 1.5 * smooth((u - 6.2) / 1.8); phase = 'retracting'; if (mode === 'tapping') dir = 1; }
      else { p = 1; gap = 1.5; phase = 'hole complete'; }
      tipY = cfg.touch - p * cfg.travel + gap;
      rig.position.y = tipY;
      spinA += dir * cfg.spin * 0.016;
      const k = `${mode}:${Math.round(p * 70)}`;
      if (k !== key) { key = k; rebuild(contour(mode, p)); }
    };

    const modes = [
      { id: 'centering', label: '1 Centering', info: 'Centering (centre drilling) drills a short starting hole to establish the hole location accurately for the following drilling. The stubby, rigid centre drill cannot wander, so it gives the twist drill a conical seat to start in.', slide: 159, qs: ['2023-24_6b', '2018-19_5b', '2009-10_7a'] },
      { id: 'drilling', label: '2 Drilling (blind)', info: 'The twist drill makes the hole; a blind hole ends in a cone equal to the point angle (118°). A hole should not be finished by drilling alone: the drill tends to wander, and the hole is poor in roundness, size accuracy and surface finish. So the correct sequence is centre drill, drill, bore, then ream. Readout: V = πDN, fr = f·N, allowance A = 0.5·D·tan(90°−θ/2), Tm = (depth + A)/fr, MRR = (πD²/4)·fr (data of 2022-23 Q5b).', slide: 159, qs: ['2011-12_5d', '2022-23_5b', '2018-19_5c', '2023-24_6b', '2009-10_7a'] },
      { id: 'drill-through', label: '2b Drilling (through)', info: 'For a through hole the drill must travel the plate thickness plus the point allowance A = 0.5·D·tan(90°−θ/2) so that the full diameter breaks out of the far side (hence the work is raised on parallels). Cutting time Tm = (thickness + A)/fr.', slide: 168, qs: ['2018-19_5c', '2023-24_5b'] },
      { id: 'boring', label: '3 Boring', info: 'A single-point boring tool enters the workpiece axially and cuts along the internal surface of the existing hole to enlarge it and obtain more precise dimensions and better concentricity than drilling. The diameter is set with an adjustable boring head. The depth of cut is half the diameter increase.', slide: 159, qs: ['2013-14_5c', '2023-24_6b', '2018-19_5b', '2009-10_7a'] },
      { id: 'reaming', label: '4 Reaming', info: 'Reaming slightly enlarges a hole, giving a better tolerance on its diameter and an improved surface finish. The reamer has several (usually straight) flutes and removes only a small allowance; it follows the existing hole so it does not correct its position, which is why boring comes before reaming for accuracy.', slide: 159, qs: ['2013-14_5c', '2023-24_6b', '2018-19_5b', '2009-10_7a'] },
      { id: 'counterboring', label: 'Counterboring', info: 'Counterboring produces a stepped hole in which a larger diameter follows a smaller diameter partway into the hole. It is used to seat bolt (socket-head) heads so they do not protrude above the surface. The pilot of the tool guides it in the existing hole.', slide: 160, qs: ['2018-19_5b'] },
      { id: 'countersinking', label: 'Countersinking', info: 'Similar to counterboring, but the step in the hole is cone-shaped, to seat flat-head screws and bolts.', slide: 160, qs: ['2013-14_5c', '2018-19_5b'] },
      { id: 'spotfacing', label: 'Spotfacing', info: 'Spotfacing is similar to milling: it provides a flat machined surface on the workpart in a localised area, here on the raised cast boss around the hole, so that a nut or bolt head seats squarely.', slide: 160, qs: ['2018-19_5b'] },
      { id: 'tapping', label: 'Tapping', info: 'Tapping is performed with a tap and provides internal screw threads in an existing hole (drilled to the tap-drill size). The tap is turned in to cut the thread and then reversed out.', slide: 160, qs: ['2018-19_5b'] },
    ];

    const setMode = (id) => {
      if (!MODES[id]) id = 'centering';
      mode = id;
      clock = 0;
      key = '';
      for (const k of Object.keys(spinGroups)) spinGroups[k].visible = k === MODES[id].tool;
      dDrill.visible = id === 'drilling' || id === 'drill-through';
      dBore.visible = id === 'boring' || id === 'reaming';
      fArrow.visible = true;
      apply();
    };
    setMode('centering');

    const mkPart = (id, name, key2, desc, slide, qs) => ({ id, name, object: spinGroups[key2], desc, slide, qs, anchor: [0, 3.2, 0] });
    const parts = [
      { id: 'workpiece', name: 'Workpiece (half-section)', object: work, desc: 'Cut away to show the hole profile: the front half is removed (ghosted). Dark wall = rough drilled surface, bright wall = machined (bored, reamed, counterbored, threaded). A hole made by drilling alone is not accurate in size, roundness or position, so it is finished by boring or reaming.', slide: 159, qs: ['2011-12_5d', '2018-19_5b'], anchor: [2.2, 2.9, 0] },
      mkPart('centre-drill', 'Centre drill', 'centre', 'Short, stiff combined drill and countersink that makes the starting conical hole so the following drill does not wander.', 159, ['2023-24_6b', '2009-10_7a']),
      mkPart('twist-drill', 'Twist drill', 'twist', 'Makes the hole. The point angle of 118° leaves a conical bottom in a blind hole; the extra length A = 0.5·D·tan(90°−θ/2) must be added to the depth when calculating the time.', 159, ['2022-23_5b', '2011-12_5d']),
      mkPart('boring-bar', 'Boring bar', 'boring', 'Single-point cutting tool on a rigid bar entering axially to enlarge an existing hole and correct its size and straightness.', 159, ['2013-14_5c']),
      mkPart('reamer', 'Reamer', 'reamer', 'Multi-flute finishing tool that removes a small allowance to give close diameter tolerance and a smooth surface.', 159, ['2013-14_5c', '2009-10_7a']),
      mkPart('counterbore', 'Counterbore', 'counterbore', 'Piloted cutter that makes a flat-bottomed larger diameter at the mouth of a hole to sink a bolt head.', 160, ['2018-19_5b']),
      mkPart('countersink', 'Countersink', 'countersink', 'Conical cutter that makes a cone-shaped seat for flat-head screws.', 160, ['2013-14_5c']),
      mkPart('spotface-cutter', 'Spotface cutter', 'spotface', 'Piloted face cutter that machines a small flat seat on a rough surface around a hole.', 160, ['2018-19_5b']),
      mkPart('tap', 'Tap', 'tap', 'Fluted hardened screw that cuts an internal thread in a hole drilled to the tap-drill size.', 160, ['2018-19_5b']),
    ];

    return {
      root,
      parts,
      modes,
      setMode,
      legend: [['V', 'tool rotation (cutting motion)'], ['f', 'feed along the axis'], ['d', 'depth of cut']],
      update(dt) {
        clock += dt;
        apply();
        const sg = spinGroups[MODES[mode].tool];
        sg.rotation.y = spinA;
      },
      readout() {
        if (mode === 'drilling') return [['Phase', phase], ...readoutDrilling];
        const cfg = MODES[mode];
        return [['Phase', phase], ['Feed progress', Math.round(p * 100) + ' %'], ['Tool height', (tipY * 10).toFixed(0) + ' mm above base']];
      },
    };
  },
};
