import * as THREE from 'three';
import { M, box, cyl, extrude, revolve, tube, at, rot, group, arrow, textSprite } from '../kit.js';

const V3 = THREE.Vector3;
const D2R = Math.PI / 180;

function label(text, p, size = 0.3) {
  const s = textSprite(text, { size });
  s.position.set(...p);
  return s;
}
function seg(a, b, mat, r = 0.02) {
  const A = new V3(...a);
  const B = new V3(...b);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, A.distanceTo(B), 6), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new V3(0, 1, 0), B.clone().sub(A).normalize());
  return m;
}
function arcMesh(c, r, a0, a1, mat = M.amber) {
  const pts = [];
  for (let i = 0; i <= 14; i++) {
    const a = a0 + ((a1 - a0) * i) / 14;
    pts.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a), c[2]]);
  }
  return tube(pts, 0.025, mat, { seg: 24, radial: 6 });
}
const smooth = (x) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c); };

// ---- broach geometry (broach axis = x, pull end at x = 0) ----
const R_PILOT = 0.3;
const PITCH = 0.4, DEPTH = 0.1, LAND = 0.07;
const SEC = {
  shankEnd: 1.2, neckEnd: 2.0, pilotEnd: 2.8,
  rough: { x: 2.8, n: 8, rise: 0.04 },
  semi: { x: 6.0, n: 4, rise: 0.015 },
  fin: { x: 7.6, n: 3, rise: 0 },
  rearEnd: 9.6, followEnd: 10.6,
};
const R_ROUGH_END = R_PILOT + SEC.rough.n * SEC.rough.rise;
const R_SEMI_END = R_ROUGH_END + SEC.semi.n * SEC.semi.rise;

function teethSection(sec, rStart, mat, tx, tr) {
  const pts = [[0, sec.x]];
  for (let k = 0; k < sec.n; k++) {
    const rt = rStart + (k + 1) * sec.rise;
    const rr = rt - DEPTH;
    const x0 = sec.x + k * PITCH;
    pts.push([rr, x0], [rt, x0 + 0.015], [rt, x0 + 0.015 + LAND], [rt - 0.012, x0 + 0.03 + LAND], [rr, x0 + 0.1 + LAND], [rr, x0 + PITCH - 0.01]);
    tx.push(x0 + 0.015);
    tr.push(rt);
  }
  const end = sec.x + sec.n * PITCH;
  pts.push([pts[pts.length - 1][0], end], [0, end]);
  return revolve(pts, mat, { axis: 'x', seg: 40 });
}

export default {
  id: 'broach',
  title: 'Pull broach',
  subtitle: 'Elements of a hole broach and how it cuts in one pass',
  camera: { position: [1, 6.5, 16], target: [-0.2, 3.3, 0] },
  build() {
    const root = new THREE.Group();
    const x0 = -5.0, yb = 2.2;
    const tx = [], tr = [];

    // floor slab
    const slab = box(17, 0.2, 4.6, M.castIron);
    at(slab, 0.6, 0.1, 0);
    root.add(slab);

    const bro = new THREE.Group();
    bro.position.set(x0, yb, 0);
    root.add(bro);

    // pull end / shank
    const shank = revolve([[0, 0], [0.38, 0], [0.38, 0.3], [0.28, 0.3], [0.28, 0.55], [0.38, 0.55], [0.38, SEC.shankEnd], [0, SEC.shankEnd]], M.steel, { axis: 'x', seg: 36 });
    const neck = revolve([[0, SEC.shankEnd], [0.2, SEC.shankEnd], [0.2, SEC.neckEnd], [0, SEC.neckEnd]], M.darkSteel, { axis: 'x', seg: 28 });
    const pilot = revolve([[0, SEC.neckEnd], [R_PILOT, SEC.neckEnd], [R_PILOT, SEC.pilotEnd], [0, SEC.pilotEnd]], M.chrome, { axis: 'x', seg: 36 });
    const rough = teethSection(SEC.rough, R_PILOT, M.hss, tx, tr);
    const semi = teethSection(SEC.semi, R_ROUGH_END, M.steel, tx, tr);
    const fin = teethSection(SEC.fin, R_SEMI_END, M.chrome, tx, tr);
    const rear = revolve([[0, SEC.fin.x + SEC.fin.n * PITCH], [R_SEMI_END - 0.02, SEC.fin.x + SEC.fin.n * PITCH], [R_SEMI_END - 0.02, SEC.rearEnd], [0, SEC.rearEnd]], M.chrome, { axis: 'x', seg: 36 });
    const follower = revolve([[0, SEC.rearEnd], [0.4, SEC.rearEnd], [0.4, SEC.followEnd - 0.2], [0.5, SEC.followEnd - 0.2], [0.5, SEC.followEnd], [0, SEC.followEnd]], M.darkSteel, { axis: 'x', seg: 28 });
    bro.add(shank, neck, pilot, rough, semi, fin, rear, follower);

    // chip breakers: staggered notches across the lands of roughing and semi-finishing teeth
    const notches = new THREE.Group();
    const nm = M.black;
    for (let i = 0; i < SEC.rough.n + SEC.semi.n; i++) {
      const sec = i < SEC.rough.n ? SEC.rough : SEC.semi;
      const k = i < SEC.rough.n ? i : i - SEC.rough.n;
      const rt = tr[i];
      const xl = sec.x + k * PITCH + 0.015 + LAND / 2;
      for (let j = 0; j < 8; j++) {
        const a = ((j + (i % 2) * 0.5) / 8) * Math.PI * 2;
        const nb = box(LAND * 1.4, 0.035, 0.07, nm);
        at(nb, xl, Math.cos(a) * rt, Math.sin(a) * rt);
        nb.rotation.x = -a;
        notches.add(nb);
      }
    }
    bro.add(notches);
    // pull direction arrow (red = cutting motion)
    const pullArrow = arrow([-0.1, 1.0, 0], [-1, 0, 0], 1.7, M.vColor);
    pullArrow.position.set(0, 0.9, 0);
    bro.add(pullArrow);
    // puller jaws
    const puller = box(0.5, 0.9, 0.9, M.paintDark);
    at(puller, 0.18, 0, 0);
    bro.add(puller);

    // ---- workpiece (half section) ----
    const Wx = x0 + 2.4;
    const workG = new THREE.Group();
    workG.position.set(Wx, yb, 0);
    root.add(workG);
    const Lw = 1.0, Ro = 1.5;
    const dbl = (m) => { const c = m.clone(); c.side = THREE.DoubleSide; return c; };
    const shellGeo = new THREE.CylinderGeometry(Ro, Ro, Lw, 40, 1, true, 0, Math.PI);
    shellGeo.rotateZ(-Math.PI / 2);
    const shell = new THREE.Mesh(shellGeo, dbl(M.work));
    shell.castShadow = shell.receiveShadow = true;
    // bore surface with live radius
    const NR = 33, NT = 17;
    const borePos = new Float32Array(NR * NT * 3);
    const boreNor = new Float32Array(NR * NT * 3);
    const boreIdx = [];
    for (let i = 0; i < NR; i++) {
      for (let j = 0; j < NT; j++) {
        const ph = (j / (NT - 1)) * Math.PI;
        const o = (i * NT + j) * 3;
        boreNor[o] = 0; boreNor[o + 1] = Math.sin(ph); boreNor[o + 2] = -Math.cos(ph);
        if (i < NR - 1 && j < NT - 1) {
          const a = i * NT + j, b = a + 1, c = a + NT, d = c + 1;
          boreIdx.push(a, b, c, b, d, c);
        }
      }
    }
    const boreGeo = new THREE.BufferGeometry();
    boreGeo.setAttribute('position', new THREE.BufferAttribute(borePos, 3));
    boreGeo.setAttribute('normal', new THREE.BufferAttribute(boreNor, 3));
    boreGeo.setIndex(boreIdx);
    boreGeo.boundingSphere = new THREE.Sphere(new V3(), 3);
    const boreMesh = new THREE.Mesh(boreGeo, dbl(M.workCut));
    boreMesh.frustumCulled = false;
    // end faces (half rings) with live inner radius
    const mkFace = (xEnd, nx) => {
      const pos = new Float32Array(2 * NT * 3);
      const nor = new Float32Array(2 * NT * 3);
      const idx = [];
      for (let j = 0; j < NT; j++) {
        const ph = (j / (NT - 1)) * Math.PI;
        pos[(NT + j) * 3] = xEnd; pos[(NT + j) * 3 + 1] = -Ro * Math.sin(ph); pos[(NT + j) * 3 + 2] = Ro * Math.cos(ph);
        for (const row of [0, NT]) nor[(row + j) * 3] = nx;
        if (j < NT - 1) idx.push(j, j + 1, NT + j, j + 1, NT + j + 1, NT + j);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      geo.setIndex(idx);
      geo.boundingSphere = new THREE.Sphere(new V3(), 3);
      const m = new THREE.Mesh(geo, dbl(M.work));
      m.frustumCulled = false;
      return { mesh: m, pos, xEnd };
    };
    const faceR = mkFace(Lw / 2, 1);
    const faceL = mkFace(-Lw / 2, -1);
    const keyway = box(Lw, 1, 0.16, M.black);
    keyway.visible = true;
    workG.add(shell, boreMesh, faceR.mesh, faceL.mesh, keyway);
    // faceplate (supports the work against the pull force)
    const sq = 2.0, hr = 0.85;
    const hole = [];
    for (let i = 0; i < 24; i++) hole.push([Math.cos(-(i / 24) * Math.PI * 2) * hr, Math.sin(-(i / 24) * Math.PI * 2) * hr]);
    const plate = extrude([[-sq, -sq], [sq, -sq], [sq, sq], [-sq, sq]], 0.25, M.paintDark, { holes: [hole], axis: 'x' });
    at(plate, Wx - Lw / 2 - 0.15, yb, 0);
    root.add(plate);

    // chips in gullets (instanced rings)
    const nCh = SEC.rough.n + SEC.semi.n;
    const chipGeo = new THREE.TorusGeometry(1, 0.06, 5, 14, Math.PI * 1.7);
    chipGeo.rotateY(Math.PI / 2);
    const chipMesh = new THREE.InstancedMesh(chipGeo, M.workCut, nCh);
    chipMesh.frustumCulled = false;
    const chipRot = Array.from({ length: nCh }, (_, i) => (i * 2.399) % 6.28);
    root.add(chipMesh);

    // ---- tooth profile inset ----
    const inset = new THREE.Group();
    inset.scale.setScalar(0.75);
    inset.position.set(-3.2, 4.9, 0);
    const P = 3.2, Dd = 1.0, lw = 0.8, hook = 12 * D2R, clr = 10 * D2R, rise = 0.18, y0 = 0.4;
    const Fx = (i) => i * P;
    const Dh = (i) => Dd + rise * i;
    const Ex = (i) => Fx(i) - (Dh(i) - y0) * Math.tan(hook);
    const contour = [[-1.2, -0.8], [-1.2, y0]];
    for (let i = 0; i < 3; i++) {
      const E = [Ex(i), Dh(i)];
      const L = [E[0] + lw, Dh(i)];
      const Lp = [L[0], Dh(i) - lw * Math.tan(clr)];
      const bx = Lp[0] + 0.3;
      const Fn = Fx(i + 1);
      contour.push([Fx(i), y0], E, L, Lp, [bx, y0]);
      contour.push([bx + 0.05, 0.15], [bx + 0.2, -0.08], [bx + 0.5, -0.25], [Fn - 0.5, -0.25], [Fn - 0.2, -0.08], [Fn - 0.05, 0.15]);
      if (i === 2) contour.push([Fn, y0]);
    }
    contour.push([Fx(3) + 0.8, y0], [Fx(3) + 0.8, -0.8]);
    // remove duplicate Fx(i) points that coincide with previous end
    const prof = extrude(contour.filter((p, i) => i === 0 || Math.hypot(p[0] - contour[i - 1][0], p[1] - contour[i - 1][1]) > 1e-4), 0.5, M.steel, { axis: 'z' });
    inset.add(prof);
    const panel = box(12.5, 5.0, 0.08, M.white);
    at(panel, 4.2, 0.9, -0.4);
    inset.add(panel);
    const ref = (a, b, mat = M.darkSteel) => seg(a, b, mat, 0.022);
    const dim = (a, b) => seg(a, b, M.amber, 0.03);
    const E1 = [Ex(1), Dh(1), 0.3];
    // pitch
    const ypi = Dh(2) + 0.9;
    inset.add(ref([Ex(1), Dh(1), 0.3], [Ex(1), ypi + 0.15, 0.3]), ref([Ex(2), Dh(2), 0.3], [Ex(2), ypi + 0.15, 0.3]), dim([Ex(1), ypi, 0.3], [Ex(2), ypi, 0.3]));
    inset.add(label('Pitch p', [(Ex(1) + Ex(2)) / 2, ypi + 0.35, 0.3], 0.42));
    // land
    inset.add(dim([Ex(1), Dh(1) + 0.12, 0.3], [Ex(1) + lw, Dh(1) + 0.12, 0.3]));
    inset.add(label('Land', [Ex(1) + lw / 2, Dh(1) + 0.45, 0.3], 0.38));
    // hook / rake angle (arc between vertical and the face)
    inset.add(ref(E1, [E1[0], E1[1] - 1.0, 0.3], M.white));
    inset.add(arcMesh(E1, 0.85, -Math.PI / 2, -Math.PI / 2 + hook));
    inset.add(label('Rake (hook) angle', [E1[0] - 1.1, 0.75, 0.3], 0.34));
    // back-off / clearance angle (between horizontal and the sloping land)
    inset.add(ref(E1, [E1[0] + 1.3, E1[1], 0.3], M.white));
    inset.add(seg(E1, [E1[0] + 1.3, E1[1] - 1.3 * Math.tan(clr), 0.3], M.darkSteel, 0.022));
    inset.add(arcMesh(E1, 1.1, -clr, 0));
    inset.add(label('Back-off (clearance) angle', [E1[0] + 2.2, Dh(1) - 0.35, 0.3], 0.34));
    // gullet
    inset.add(label('Gullet (chip space)', [(Ex(1) + lw + 0.3 + Fx(2)) / 2 + 0.15, 0.55, 0.3], 0.34));
    inset.add(label('Root radius', [Fx(2) - 1.2, -1.2, 0.3], 0.34));
    inset.add(ref([Fx(2) - 1.0, -1.05, 0.3], [Fx(2) - 0.3, -0.18, 0.3], M.amber));
    // rise per tooth
    const xr = Ex(2) + lw + 0.45;
    inset.add(ref([Ex(0), Dh(0), 0.3], [xr + 0.2, Dh(0), 0.3], M.white), dim([xr, Dh(0), 0.3], [xr, Dh(2), 0.3]));
    inset.add(label('Rise per tooth', [xr + 1.2, Dh(1), 0.3], 0.34));
    // chip breaker notch on land of tooth 1
    const cb = box(0.28, 0.12, 0.18, M.black);
    at(cb, Ex(1) + lw / 2, Dh(1) - 0.02, 0.0);
    inset.add(cb);
    inset.add(label('Chip breaker (notch)', [Ex(1) - 0.6, Dh(1) + 1.55, 0.3], 0.34));
    inset.add(ref([Ex(1) + lw / 2, Dh(1) + 0.05, 0.3], [Ex(1) - 0.2, Dh(1) + 1.35, 0.3], M.amber));
    inset.add(arrow([P * 2 + 1.5, -0.9, 0.3], [-1, 0, 0], 1.4, M.vColor));
    inset.add(label('cutting direction', [P * 2 + 1.5, -1.3, 0.3], 0.3));
    root.add(inset);

    const parts = [
      { id: 'pull-end', name: 'Pull end / shank', object: shank, desc: 'Gripped by the puller of the broaching machine, which draws the broach through the work.', slide: 10, qs: ['2015-16_4a', '2011-12_7b'], anchor: [x0 + 0.6, yb + 0.5, 0] },
      { id: 'neck', name: 'Neck', object: neck, desc: 'A reduced section that lets the shank pass through the hole. It is the weakest section and breaks first on overload.', slide: 10, qs: ['2015-16_4a', '2011-12_7b'], anchor: [x0 + 1.6, yb + 0.3, 0] },
      { id: 'front-pilot', name: 'Front pilot', object: pilot, desc: 'Centres and aligns the broach in the starter hole before cutting begins.', slide: 10, qs: ['2015-16_4a', '2011-12_7b'], anchor: [x0 + 2.4, yb + 0.4, 0] },
      { id: 'roughing-teeth', name: 'Roughing teeth', object: rough, desc: 'Teeth with the largest rise per tooth (about 0.03-0.15 mm); they remove most of the material.', slide: 10, qs: ['2015-16_4a', '2011-12_7b'], anchor: [x0 + 4.4, yb + 0.7, 0] },
      { id: 'semi-finishing-teeth', name: 'Semi-finishing teeth', object: semi, desc: 'Teeth with a smaller rise per tooth that bring the hole close to final size.', slide: 10, qs: ['2015-16_4a', '2011-12_7b'], anchor: [x0 + 6.8, yb + 0.75, 0] },
      { id: 'finishing-teeth', name: 'Finishing / sizing teeth', object: fin, desc: 'Zero rise: all at final size. They burnish and size the hole and act as spares when the earlier teeth are re-sharpened.', slide: 10, qs: ['2015-16_4a', '2011-12_7b'], anchor: [x0 + 8.2, yb + 0.8, 0] },
      { id: 'rear-pilot', name: 'Rear pilot', object: rear, desc: 'Supports the broach as the last teeth leave the work and keeps it aligned in the finished hole.', slide: 10, qs: ['2015-16_4a', '2011-12_7b'], anchor: [x0 + 9.2, yb + 0.75, 0] },
      { id: 'follower-end', name: 'Follower end', object: follower, desc: 'The rear end, held in a follower rest or handling ring so the broach stays aligned and can be lifted.', slide: 10, qs: ['2015-16_4a', '2011-12_7b'], anchor: [x0 + 10.1, yb + 0.6, 0] },
      { id: 'chip-breakers', name: 'Chip breakers', object: notches, desc: 'Staggered notches across the lands that split a wide chip into narrow pieces so they fit in the gullet and clear easily.', slide: 10, qs: ['2015-16_4a', '2011-12_7b'], anchor: [x0 + 4.4, yb + 0.85, 0] },
      { id: 'tooth-profile', name: 'Enlarged tooth profile', object: inset, desc: 'A magnified view of the teeth: pitch, land, rake (hook) angle 5-20 degrees, back-off (clearance) angle 1-3 degrees, gullet, root radius and chip breakers. Each tooth is a little higher than the last (rise per tooth).', slide: 10, qs: ['2015-16_4a', '2011-12_7b'], anchor: [0.5, 6.4, 0] },
      { id: 'workpiece', name: 'Workpiece', object: workG, desc: 'A bush with a starter hole, shown in half section. As the teeth pass, the hole grows tooth by tooth to the finished shape.', slide: 10, qs: ['2015-16_4a'], anchor: [Wx, yb + 1.5, 0] },
    ];

    const modes = [
      { id: 'parts', label: 'Broach elements', slide: 10, qs: ['2015-16_4a', '2011-12_7b'],
        info: 'A broach is a multi-point tool with successive teeth, each slightly higher than the previous one (rise per tooth). Front to rear: pull end, neck, front pilot, roughing, semi-finishing and finishing teeth, rear pilot and follower end. One pass gives the complete internal shape (keyway, spline, square or round hole) to close tolerance.' },
      { id: 'tooth', label: 'Tooth profile', slide: 10, qs: ['2015-16_4a', '2011-12_7b'],
        info: 'Pitch is the distance between teeth, and at least two teeth must always be in contact. The land is the flat behind the edge. Face (hook or rake) angle is about 5-20 degrees and back-off (clearance) angle about 1-3 degrees. The gullet must hold the whole chip of one stroke; chip breakers split wide chips; the root radius avoids cracks.' },
      { id: 'broaching', label: 'Broaching (animation)', slide: 10, qs: ['2015-16_4a', '2011-12_7b'],
        info: 'The broach is pulled through the starter hole (red arrow = cutting motion). Each tooth takes a thin cut, so the hole grows step by step and the chips collect in the gullets. Feed is built in as the rise per tooth, so no feed motion is needed and one stroke finishes the hole and keyway.' },
    ];

    let mode = 'parts';
    let tm = 0;
    let sCur = 0, sEnv = 0, inCut = 0;
    const S = 9.0, T = 16;
    const bore = (q) => {
      let r = R_PILOT;
      for (let i = 0; i < tx.length; i++) if (tx[i] <= q) r = tr[i]; else break;
      return r;
    };
    const dummy = new THREE.Object3D();
    const setVis = () => {
      inset.visible = mode === 'tooth';
      workG.visible = plate.visible = chipMesh.visible = mode === 'broaching';
    };
    const apply = () => {
      const ph = mode === 'broaching' ? (tm % T) / T : 0;
      if (ph < 0.88) { sCur = (S * ph) / 0.88; sEnv = sCur; }
      else if (ph < 0.9) { sCur = S; sEnv = S; }
      else { sCur = S * (1 - smooth((ph - 0.9) / 0.1)); sEnv = S; }
      if (mode !== 'broaching') { sCur = 0; sEnv = 0; }
      bro.position.x = x0 - sCur;
      if (mode !== 'broaching') return;
      const q0 = Wx - x0 - Lw / 2; // broach coordinate at work entry... left face
      for (let i = 0; i < NR; i++) {
        const xw = -Lw / 2 + (i / (NR - 1)) * Lw;
        const r = bore(q0 + Lw / 2 + xw + sEnv);
        for (let j = 0; j < NT; j++) {
          const ph2 = (j / (NT - 1)) * Math.PI;
          const o = (i * NT + j) * 3;
          borePos[o] = xw;
          borePos[o + 1] = -r * Math.sin(ph2);
          borePos[o + 2] = r * Math.cos(ph2);
        }
      }
      boreGeo.attributes.position.needsUpdate = true;
      for (const f of [faceR, faceL]) {
        const r = bore(Wx - x0 + f.xEnd + sEnv);
        for (let j = 0; j < NT; j++) {
          const ph2 = (j / (NT - 1)) * Math.PI;
          f.pos[j * 3] = f.xEnd;
          f.pos[j * 3 + 1] = -r * Math.sin(ph2);
          f.pos[j * 3 + 2] = r * Math.cos(ph2);
        }
        f.mesh.geometry.attributes.position.needsUpdate = true;
      }
      const rc = bore(Wx - x0 + sEnv);
      const kd = 0.14 * ((rc - R_PILOT) / (R_SEMI_END - R_PILOT));
      keyway.scale.y = Math.max(0.001, kd);
      keyway.position.y = -(rc + kd / 2 - 0.01);
      // chips
      inCut = 0;
      for (let i = 0; i < nCh; i++) {
        const xb = tx[i] - 0.12;
        const wx = x0 + xb - sCur;
        const gx = x0 + xb - sEnv;
        const g = smooth((Wx + Lw / 2 - gx) / Lw);
        const rr = tr[i] - 0.09;
        dummy.position.set(wx, yb, 0);
        dummy.rotation.set(chipRot[i], 0, 0);
        dummy.scale.setScalar(Math.max(0.0001, rr * g));
        dummy.updateMatrix();
        chipMesh.setMatrixAt(i, dummy.matrix);
      }
      chipMesh.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < tx.length; i++) {
        const wx = x0 + tx[i] - sCur;
        if (wx > Wx - Lw / 2 && wx < Wx + Lw / 2) inCut++;
      }
    };
    setVis();

    return {
      root,
      parts,
      modes,
      setMode(id) {
        mode = id;
        tm = 0;
        setVis();
        apply();
      },
      update(dt) {
        tm += dt;
        if (mode === 'broaching') apply();
      },
      readout() {
        if (mode === 'broaching') return [['Stroke', `${Math.round((sCur / S) * 100)} %`], ['Teeth in cut', String(inCut)], ['Hole', `${R_PILOT.toFixed(2)} to ${R_SEMI_END.toFixed(2)} (dm radius)`]];
        return [['Roughing rise', '0.03-0.15 mm / tooth'], ['Semi-finishing', 'smaller rise'], ['Finishing', 'zero rise'], ['Hook angle', '5-20°'], ['Back-off angle', '1-3°']];
      },
      legend: [['V', 'cutting motion (broach pull)']],
    };
  },
};
