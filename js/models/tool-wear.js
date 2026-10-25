import * as THREE from 'three';
import { M, box, cyl, extrude, at, rot, group, arrow, textSprite } from '../kit.js';

const ss = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);

// Classic wear curve (tau = fraction of tool life, 0..1): break-in, steady state, acceleration.
const wearVB = (t) => 0.06 * (1 - Math.exp(-t / 0.04)) + 0.30 * t + 0.45 * ((Math.max(0, t - 0.78) / 0.22) ** 2); // mm
const wearKT = (t) => 0.05 * (1 - Math.exp(-t / 0.05)) + 0.55 * t + 0.40 * ((Math.max(0, t - 0.78) / 0.22) ** 2); // 0..1
const statusOf = (t) => (t < 0.07 ? 'Break-in (rapid initial wear)' : t < 0.78 ? 'Steady-state wear' : t < 0.95 ? 'Accelerating wear' : 'FAILURE (VB too large)');

// ---- insert / tool head geometry (tool frame: x across the edge, y up from the edge, z away from the work) ----
const W = 1.4;           // insert width (x)
const L = 2.2;           // insert length (z)
const H = 1.2;           // insert height
const GAM = Math.tan((8 * Math.PI) / 180);   // rake angle 8 deg
const ALP = Math.tan((10 * Math.PI) / 180);  // clearance angle 10 deg
const NX = 17, NZ = 28;
const KTMAX = 0.3;       // crater depth at the end of life (illustrative, mm)
const HW = W / 2;

const maskOf = (x, zd, s) => {
  const cw = 0.4 + 1.0 * s;
  const u = (zd - 0.32) / cw;
  if (u <= 0 || u >= 1) return 0;
  const v = x / 0.5;
  if (v <= -1 || v >= 1) return 0;
  return Math.pow(Math.sin(Math.PI * u), 1.5) * Math.pow(1 - v * v, 1.2);
};

export default {
  id: 'tool-wear',
  title: 'Tool wear: crater & flank',
  subtitle: 'Crater wear on the rake face, flank wear land VB, failure modes, wear mechanisms and indexable inserts',
  camera: { position: [6.5, 8, 16], target: [1.2, 2.8, 3] },
  build() {
    const root = new THREE.Group();
    const R = 2.4, D = 0.16, AXY = 3.4, ZT = R - D;

    // ---------------- static machine ----------------
    const slab = at(box(16, 0.3, 11, M.castIron), 1, 0.15, 2.2);
    const headstock = group(
      at(box(1.6, 4.8, 3.6, M.paint), -4.9, 2.4 + 0.3, 0),
      at(cyl(1.7, 0.5, M.darkSteel, { axis: 'x', seg: 40 }), -3.85, AXY, 0),
    );
    headstock.position.y = 0;
    const tailstock = group(
      at(box(1.2, 3.4, 1.8, M.paint), 4.9, 1.7 + 0.3, 0),
      at(cyl(0.12, 0.8, M.steel, { rTop: 0.02, axis: 'x', seg: 12 }), 4.0, AXY, 0),
    );

    // ---------------- work bar ----------------
    const spin = new THREE.Group();
    const barL = at(cyl(R, 2.8, M.work, { axis: 'x', seg: 56 }), -2.1, 0, 0);
    const barG = at(cyl(R - D, W, M.workCut, { axis: 'x', seg: 56 }), 0, 0, 0);
    const barR = at(cyl(R, 2.8, M.work, { axis: 'x', seg: 56 }), 2.1, 0, 0);
    spin.add(barL, barG, barR);
    // marks so the rotation is visible
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      for (const [x0, r0, len] of [[-2.1, R, 2.6], [2.1, R, 2.6]]) {
        const m = box(len, 0.035, 0.12, M.darkSteel);
        m.position.set(x0, Math.sin(a) * (r0 + 0.005), Math.cos(a) * (r0 + 0.005));
        m.rotation.x = -a;
        spin.add(m);
      }
    }
    // uncut layer (spiral shell, thickness d at the tool, 0 further round): static because the bar is axisymmetric
    const shellPts = [];
    const PH = (115 * Math.PI) / 180;
    const SEG = 24;
    for (let i = 0; i <= SEG; i++) {
      const a = (i / SEG) * PH;
      const ro = R - D + D * (1 - i / SEG);
      shellPts.push([-Math.cos(a) * ro, Math.sin(a) * ro]);
    }
    for (let i = SEG; i >= 0; i--) {
      const a = (i / SEG) * PH;
      shellPts.push([-Math.cos(a) * (R - D), Math.sin(a) * (R - D)]);
    }
    const shell = extrude(shellPts, W, M.work, { axis: 'x' });
    const workpiece = group(spin, shell);
    workpiece.position.set(0, AXY, 0);

    // ---------------- tool: insert (head) with wear ----------------
    const headG = new THREE.Group();
    headG.position.set(0, AXY, ZT);

    // rake surface (displaced grid, vertex colours)
    const rakePos = new Float32Array(NX * NZ * 3);
    const rakeCol = new Float32Array(NX * NZ * 3);
    const rakeIdx = [];
    for (let j = 0; j < NZ - 1; j++) {
      for (let i = 0; i < NX - 1; i++) {
        const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1;
        rakeIdx.push(a, c, b, b, c, d);
      }
    }
    const rakeGeo = new THREE.BufferGeometry();
    rakeGeo.setAttribute('position', new THREE.BufferAttribute(rakePos, 3));
    rakeGeo.setAttribute('color', new THREE.BufferAttribute(rakeCol, 3));
    rakeGeo.setIndex(rakeIdx);
    const rakeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, metalness: 0.8, roughness: 0.32, side: THREE.DoubleSide, emissive: new THREE.Color(0xff5a14), emissiveIntensity: 0 });
    const rakeMesh = new THREE.Mesh(rakeGeo, rakeMat);
    rakeMesh.castShadow = true;
    rakeMesh.receiveShadow = true;

    // rest of the insert (flat shaded, non-indexed)
    const NTRI = 2 * (NZ + 3) + 8;
    const bodyPos = new Float32Array(NTRI * 9);
    const bodyGeo = new THREE.BufferGeometry();
    bodyGeo.setAttribute('position', new THREE.BufferAttribute(bodyPos, 3));
    const bodyMat = M.carbide.clone();
    bodyMat.side = THREE.DoubleSide;
    bodyMat.emissive = new THREE.Color(0xff5a14);
    bodyMat.emissiveIntensity = 0;
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;

    // flank wear land overlay + dimension line VB
    const landMat = new THREE.MeshStandardMaterial({ color: 0x2f241a, metalness: 0.2, roughness: 0.8 });
    const landMesh = new THREE.Mesh(new THREE.BoxGeometry(W, 1, 0.02), landMat);
    const dimMat = M.amber;
    const vbLine = new THREE.Mesh(new THREE.BoxGeometry(0.035, 1, 0.035), dimMat);
    const vbTop = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.035, 0.035), dimMat);
    const vbBot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.035, 0.035), dimMat);
    const vbDim = group(vbLine, vbTop, vbBot);
    const flankPart = group(landMesh, vbDim);
    // crater depth dimension KT
    const ktLine = new THREE.Mesh(new THREE.BoxGeometry(0.035, 1, 0.035), dimMat);
    const ktTop = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.035, 0.035), dimMat);
    const ktBot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.035, 0.035), dimMat);
    const ktDim = group(ktLine, ktTop, ktBot);
    const rakePart = group(rakeMesh, ktDim);
    const insertPart = group(bodyMesh);

    // hot glow at the edge + fracture flake + crack
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xff6a18, transparent: true, opacity: 0, depthWrite: false });
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), glowMat);
    glow.visible = false;
    const flake = extrude([[0, 0], [-0.3, -0.045], [-0.1, -0.55]], W * 0.9, M.carbide, { axis: 'x' });
    flake.visible = false;
    const crack = box(1, 0.02, 0.02, M.black);
    crack.visible = false;
    headG.add(insertPart, rakePart, flankPart, glow, flake, crack);

    // shank, clamp, tool post
    const shankTop = -L * GAM;
    const shank = group(
      at(box(W, H + shankTop, 3.7, M.darkSteel), 0, (shankTop - H) / 2, L + 1.85),
      at(box(0.9, 0.32, 0.9, M.steel), 0, shankTop + 0.16, L + 0.75),
      at(cyl(0.16, 0.2, M.chrome, { seg: 6 }), 0, shankTop + 0.42, L + 0.85),
    );
    const post = at(box(1.9, AXY - 0.3 - H, 3.1, M.paintDark), 0, -H - (AXY - 0.3 - H) / 2, L + 1.6);
    const toolG = group(shank, post);
    toolG.position.set(0, AXY, ZT);

    // ---------------- chip (instanced slices following the rake face) ----------------
    const NCH = 46;
    const chipMat = M.workCut.clone();
    chipMat.transparent = true;
    chipMat.opacity = 0.9;
    chipMat.emissive = new THREE.Color(0xff6a10);
    chipMat.emissiveIntensity = 0;
    const chipMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), chipMat, NCH);
    chipMesh.frustumCulled = false;
    chipMesh.position.set(0, AXY, ZT);
    chipMesh.castShadow = true;

    const MP = 120;
    const pY = new Float32Array(MP), pZ = new Float32Array(MP), pA = new Float32Array(MP);
    let chipLen = 3;
    const TC = 0.3, CHIPW = 0.9, ZC = 1.35, RC = 0.55;
    const tmpP = new Float32Array(200 * 2);

    // ---------------- arrows ----------------
    const vArrow = arrow([-1.3, AXY + 1.1, R + 0.35], [0, -1, 0], 1.0, M.vColor);
    const fArrow = arrow([1.25, AXY + 0.45, ZT + 1.7], [0, 0, -1], 1.35, M.fColor);

    // ---------------- wear state ----------------
    const st = { VB: 0.03, s: 0.05, droop: 0, glow: 0, nib: 0, tau: 0 };
    const last = { VB: -1, s: -1, droop: -1, glow: -1, nib: -1 };

    function rakeY(x, z, e) {
      const zd = z - e.zTop;
      return e.eY0 - z * GAM - st.droop * 0.38 * Math.exp(-zd / 0.55) - KTMAX * st.s * maskOf(x, zd, st.s);
    }

    const cDark = new THREE.Color(0x2a2118), cGold = new THREE.Color(0xd2a83a), cHot = new THREE.Color(1.0, 0.42, 0.08);
    const cTmp = new THREE.Color();
    const E = { vb: 0, eY0: 0, zTop: 0, z4: 0 };

    function rebuildHead() {
      const vb = Math.max(st.VB, 0.004);
      E.vb = vb;
      E.eY0 = -ALP * vb * GAM;
      E.z4 = -st.droop * 0.12;
      E.zTop = E.z4 + st.nib;
      const zSpan = L - E.zTop;
      // rake grid
      for (let j = 0; j < NZ; j++) {
        const zd = (zSpan * j) / (NZ - 1);
        const z = E.zTop + zd;
        for (let i = 0; i < NX; i++) {
          const x = -HW + (W * i) / (NX - 1);
          const k = (j * NX + i) * 3;
          rakePos[k] = x;
          rakePos[k + 1] = rakeY(x, z, E);
          rakePos[k + 2] = z;
          const mk = maskOf(x, zd, st.s);
          cTmp.copy(cGold).lerp(cDark, clamp(mk * 3) * clamp(st.s * 4) * 0.92);
          if (st.glow > 0) cTmp.lerp(cHot, st.glow * Math.exp(-zd / 0.9) * 0.9);
          rakeCol[k] = cTmp.r; rakeCol[k + 1] = cTmp.g; rakeCol[k + 2] = cTmp.b;
        }
      }
      rakeGeo.attributes.position.needsUpdate = true;
      rakeGeo.attributes.color.needsUpdate = true;
      rakeGeo.computeVertexNormals();
      rakeGeo.computeBoundingBox();
      rakeGeo.computeBoundingSphere();

      // outline (z,y) loop: top curve, p2, p3, p4
      const p0y = rakeY(0, E.zTop, E);
      const p2z = L, p2y = -H;
      const p3z = ALP * (H - vb), p3y = -H;
      const p4z = E.z4, p4y = -vb;
      let n = 0;
      const v = (x, y, z) => { bodyPos[n++] = x; bodyPos[n++] = y; bodyPos[n++] = z; };
      const loopZ = tmpP, loopY = tmpP; // (aliases avoided below)
      void loopZ; void loopY;
      const cz = L * 0.55, cy = -0.7 * H;
      const cnt = NZ + 3;
      const lz = (k) => (k < NZ ? E.zTop + (zSpan * k) / (NZ - 1) : k === NZ ? p2z : k === NZ + 1 ? p3z : p4z);
      const ly = (k) => (k < NZ ? rakeY(HW + 10, E.zTop + (zSpan * k) / (NZ - 1), E) : k === NZ ? p2y : k === NZ + 1 ? p3y : p4y);
      for (let k = 0; k < cnt; k++) {
        const k2 = (k + 1) % cnt;
        const za = lz(k), ya = ly(k), zb = lz(k2), yb = ly(k2);
        v(HW, cy, cz); v(HW, ya, za); v(HW, yb, zb);
        v(-HW, cy, cz); v(-HW, yb, zb); v(-HW, ya, za);
      }
      const quad = (za, ya, zb, yb) => {
        v(-HW, ya, za); v(HW, ya, za); v(HW, yb, zb);
        v(-HW, ya, za); v(HW, yb, zb); v(-HW, yb, zb);
      };
      quad(p4z, p4y, E.zTop, p0y);   // land
      quad(p3z, p3y, p4z, p4y);      // flank
      quad(p2z, p2y, p3z, p3y);      // bottom
      quad(L, ly(NZ - 1), p2z, p2y); // back
      bodyGeo.attributes.position.needsUpdate = true;
      bodyGeo.computeVertexNormals();
      bodyGeo.computeBoundingBox();
      bodyGeo.computeBoundingSphere();

      // flank land overlay + VB dimension
      const hLand = Math.max(p0y - p4y, 0.001);
      landMesh.scale.y = hLand;
      landMesh.position.set(0, (p0y + p4y) / 2, Math.min(E.zTop, p4z) - 0.012);
      landMesh.visible = st.nib < 0.01;
      vbLine.scale.y = hLand;
      vbLine.position.set(-HW - 0.2, (p0y + p4y) / 2, p4z - 0.03);
      vbTop.position.set(-HW - 0.2, p0y, p4z - 0.03);
      vbBot.position.set(-HW - 0.2, p4y, p4z - 0.03);

      // crater dimension KT
      const kt = KTMAX * st.s;
      const zc = E.zTop + 0.32 + (0.4 + 1.0 * st.s) / 2;
      const yTopC = E.eY0 - zc * GAM - st.droop * 0.38 * Math.exp(-(zc - E.zTop) / 0.55);
      ktLine.scale.y = Math.max(kt, 0.001);
      ktLine.position.set(HW + 0.2, yTopC - kt / 2, zc);
      ktTop.position.set(HW + 0.2, yTopC, zc);
      ktBot.position.set(HW + 0.2, yTopC - kt, zc);

      // glow blob
      glow.position.set(0, p0y - 0.12, E.zTop - 0.05);

      // chip path along the rake surface at x = 0, then curl
      let m = 0;
      const S1 = 40;
      for (let k = 0; k <= S1; k++) {
        const z = E.zTop + 0.05 + ((ZC - E.zTop - 0.05) * k) / S1;
        tmpP[m++] = z;
        tmpP[m++] = rakeY(0, z, E) + TC / 2 + 0.012;
      }
      const zE = tmpP[m - 2], yE = tmpP[m - 1];
      const S2 = 60;
      for (let k = 1; k <= S2; k++) {
        const phi = -Math.PI / 2 + ((Math.PI * 1.35) * k) / S2;
        tmpP[m++] = zE + RC * Math.cos(phi);
        tmpP[m++] = yE + RC + RC * Math.sin(phi);
      }
      const np = m / 2;
      // cumulative length
      let acc = 0;
      const cum = pA; // reuse as temp (overwritten below)
      void cum;
      const tot = [0];
      for (let k = 1; k < np; k++) {
        acc += Math.hypot(tmpP[k * 2] - tmpP[k * 2 - 2], tmpP[k * 2 + 1] - tmpP[k * 2 - 1]);
        tot.push(acc);
      }
      chipLen = acc;
      let q = 0;
      for (let k = 0; k < MP; k++) {
        const sk = (acc * k) / (MP - 1);
        while (q < np - 2 && tot[q + 1] < sk) q++;
        const f = (sk - tot[q]) / Math.max(tot[q + 1] - tot[q], 1e-6);
        pZ[k] = lerp(tmpP[q * 2], tmpP[q * 2 + 2], f);
        pY[k] = lerp(tmpP[q * 2 + 1], tmpP[q * 2 + 3], f);
      }
      for (let k = 0; k < MP; k++) {
        const a = Math.max(0, k - 1), b = Math.min(MP - 1, k + 1);
        pA[k] = -Math.atan2(pY[b] - pY[a], pZ[b] - pZ[a]);
      }
      last.VB = st.VB; last.s = st.s; last.droop = st.droop; last.glow = st.glow; last.nib = st.nib;
    }

    // ---------------- insert gallery ('inserts' mode) ----------------
    const gallery = new THREE.Group();
    gallery.position.set(0, 0.3, 6.2);
    const kinds = [
      { id: 'round', label: 'Round', x: -6.1, n: 6, strength: 1.0, pts: null },
      { id: 'square', label: 'Square 90', x: -3.5, n: 4, strength: 0.8, pts: [[-0.8, -0.8], [0.8, -0.8], [0.8, 0.8], [-0.8, 0.8]] },
      { id: 'rhombus', label: 'Rhombus 80', x: 3.6, n: 2, strength: 0.65, pts: null },
      { id: 'triangle', label: 'Triangle 60', x: 6.2, n: 3, strength: 0.5, pts: null },
    ];
    const insertObjs = [];
    const tri = (r) => Array.from({ length: 3 }, (_, k) => { const a = (k * 2 * Math.PI) / 3; return [r * Math.sin(a), -r * -Math.cos(a)]; });
    for (const kd of kinds) {
      const g = new THREE.Group();
      g.position.x = kd.x;
      let rC, cornerA;
      let shapePts;
      if (kd.id === 'round') {
        shapePts = Array.from({ length: 48 }, (_, k) => [Math.cos((k / 48) * Math.PI * 2) * 0.95, Math.sin((k / 48) * Math.PI * 2) * 0.95]);
        rC = 0.95; cornerA = Array.from({ length: kd.n }, (_, k) => (k * 2 * Math.PI) / kd.n);
      } else if (kd.id === 'square') {
        // corners at angles 0, 90, ... pointing to -z for corner 0
        rC = 1.15;
        shapePts = Array.from({ length: 4 }, (_, k) => { const a = (k * Math.PI) / 2; return [rC * Math.sin(a), rC * Math.cos(a)]; });
        cornerA = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
      } else if (kd.id === 'triangle') {
        rC = 1.25;
        shapePts = Array.from({ length: 3 }, (_, k) => { const a = (k * 2 * Math.PI) / 3; return [rC * Math.sin(a), rC * Math.cos(a)]; });
        cornerA = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
      } else {
        // rhombus with 80 deg acute corners on the long diagonal
        const hl = 1.3, hs = hl * Math.tan((40 * Math.PI) / 180);
        rC = hl;
        shapePts = [[0, hl], [hs, 0], [0, -hl], [-hs, 0]];
        cornerA = [0, Math.PI];
      }
      // plan (px = sx, pz = -sy after extrude axis 'y'): cutting corner 0 points to -z, so pass y = +r for corner 0
      const slabMesh = extrude(shapePts, 0.28, M.carbide, { axis: 'y', bevel: 0.015, holes: [Array.from({ length: 20 }, (_, k) => [Math.cos(-(k / 20) * Math.PI * 2) * 0.2, Math.sin(-(k / 20) * Math.PI * 2) * 0.2])] });
      slabMesh.position.y = 0.16 + 0.14 + 0.03;
      const rotG = new THREE.Group();
      rotG.add(slabMesh);
      const marks = cornerA.map((a) => {
        const m = cyl(0.16, 0.035, M.black, { seg: 12 });
        m.position.set(rC * 0.86 * Math.sin(a), 0.33 + 0.02, -rC * 0.86 * Math.cos(a));
        rotG.add(m);
        m.visible = false;
        return m;
      });
      rotG.add(at(cyl(0.12, 0.08, M.chrome, { seg: 6 }), 0, 0.36, 0));
      const holder = group(at(box(2.8, 0.18, 2.8, M.darkSteel), 0, 0.09 + 0.0, 0));
      const pocketMark = at(rot(cyl(0.001, 0.4, M.amber, { rTop: 0.12, seg: 12, axis: 'z' }), 0, 0, 0), 0, 0.5, -1.65);
      pocketMark.rotation.x = -Math.PI / 2;
      pocketMark.position.set(0, 0.34, -1.75);
      const bar = at(box(0.4, 1.8 * kd.strength, 0.4, M.amber), 0, 0.18 + 0.9 * kd.strength, 1.9);
      g.add(holder, rotG, pocketMark, bar);
      gallery.add(g);
      insertObjs.push({ kd, g, rotG, marks, step: (Math.PI * 2) / kd.n, cornerA });
    }
    gallery.visible = false;
    insertPart.add(gallery);

    // ---------------- mechanisms inset ----------------
    const inset = new THREE.Group();
    inset.position.set(7.9, 3.7, 3.0);
    inset.visible = false;
    const back = at(box(3.9, 3.1, 0.08, M.paintDark), 0, 0, -0.1);
    const toolBlk = at(box(3.3, 1.0, 0.3, M.carbide), 0, -0.9, 0);
    const chipBlkMat = M.work.clone();
    chipBlkMat.transparent = true;
    chipBlkMat.opacity = 0.35;
    chipBlkMat.depthWrite = false;
    const chipBlk = at(box(3.3, 1.0, 0.3, chipBlkMat), 0, 0.1, 0);
    const stripes = Array.from({ length: 6 }, (_, k) => {
      const s = at(box(0.05, 0.9, 0.31, M.darkSteel), 0, 0.1, 0);
      s.userData.k = k;
      return s;
    });
    const arrV = arrow([-1.2, 0.85, 0.1], [1, 0, 0], 0.9, M.vColor);
    inset.add(back, toolBlk, chipBlk, ...stripes, arrV);
    const titles = ['ABRASION', 'ADHESION', 'DIFFUSION', 'OXIDATION'].map((t) => {
      const sp = textSprite(t, { size: 0.28 });
      sp.position.set(0, 1.3, 0.2);
      sp.visible = false;
      inset.add(sp);
      return sp;
    });
    const nameOfTool = 'tool (carbide)';
    void nameOfTool;
    // A: abrasion glyphs
    const NH = 5;
    const hardGeo = new THREE.IcosahedronGeometry(0.1, 0);
    const hards = Array.from({ length: NH }, () => { const m = new THREE.Mesh(hardGeo, M.black); return m; });
    const scratches = Array.from({ length: NH }, () => new THREE.Mesh(new THREE.BoxGeometry(1, 0.025, 0.1), M.black));
    const flakes = Array.from({ length: NH }, () => new THREE.Mesh(new THREE.IcosahedronGeometry(0.06, 0), M.carbide));
    const gAbr = group(...hards, ...scratches, ...flakes);
    // B: adhesion glyphs
    const NB = 4;
    const welds = Array.from({ length: NB }, () => new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 10), M.red));
    const torn = Array.from({ length: NB }, () => new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), M.carbide));
    const gAdh = group(...welds, ...torn);
    // C: diffusion glyphs
    const NA = 14;
    const atomGeo = new THREE.SphereGeometry(0.08, 10, 8);
    const diffTool = new THREE.InstancedMesh(atomGeo, M.amber, NA);
    const diffChip = new THREE.InstancedMesh(atomGeo, M.blue, NA);
    const latTool = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), M.amber, 32);
    const latChip = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), M.blue, 32);
    for (const m of [diffTool, diffChip, latTool, latChip]) m.frustumCulled = false;
    const gDif = group(diffTool, diffChip, latTool, latChip);
    // D: oxidation glyphs
    const NO = 8;
    const oxLayer = at(box(3.3, 1, 0.31, M.red), 0, -0.4, 0.0);
    const oxAtoms = Array.from({ length: NO }, () => new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), M.blue));
    const gOxi = group(oxLayer, ...oxAtoms);
    const mechGroups = [gAbr, gAdh, gDif, gOxi];
    for (const g of mechGroups) { g.visible = false; g.position.z = 0.1; inset.add(g); }
    // static lattices
    const dum = new THREE.Object3D();
    for (let k = 0; k < 32; k++) {
      const x = -1.5 + (k % 16) * 0.2, row = Math.floor(k / 16);
      dum.position.set(x, -0.5 - row * 0.2, 0.12); dum.updateMatrix(); latTool.setMatrixAt(k, dum.matrix);
      dum.position.set(x + 0.1, -0.3 + 0.2 + row * 0.2 + 0.12, 0.12); dum.updateMatrix(); latChip.setMatrixAt(k, dum.matrix);
    }
    latTool.instanceMatrix.needsUpdate = true;
    latChip.instanceMatrix.needsUpdate = true;

    root.add(slab, headstock, tailstock, workpiece, toolG, headG, chipMesh, vArrow, fArrow, inset);

    // ---------------- parts ----------------
    const parts = [
      { id: 'tool', name: 'Tool shank & holder', object: toolG, slide: 69, qs: ['2015-16_8c'],
        desc: 'Medium-carbon steel shank carrying the carbide insert. The insert is usually clamped rather than brazed, so a worn edge can be indexed instead of reground.',
        explode: [0, 0, 1.5] },
      { id: 'insert', name: 'Carbide insert', object: insertPart, slide: 68, qs: ['2022-23_6b', '2017-18_4c'],
        desc: 'Powder-metallurgy carbide wedge with a rake face on top and a flank (relief) face below the edge. It wears gradually at two places: the rake face and the flank. Inserts come as square, round, triangular and rhombus shapes.',
        anchor: [0, AXY - 0.5, ZT + 0.8] },
      { id: 'rake-face', name: 'Rake face (crater wear)', object: rakePart, slide: 60, qs: ['2015-16_8c', '2010-11_4b', '2011-12_4d'],
        desc: 'Crater wear is a cavity that forms and grows on the rake face where the chip slides over it. Diffusion is believed to be the principal mechanism; it is measured by crater depth KT.',
        anchor: [0, AXY - 0.1, ZT + 1.0] },
      { id: 'flank', name: 'Flank face (wear land VB)', object: flankPart, slide: 60, qs: ['2015-16_8c', '2010-11_4b', '2022-23_6b'],
        desc: 'Flank wear occurs on the relief face next to the cutting edge, from rubbing against the newly generated work surface. The width of the wear land VB is the usual tool-life criterion; abrasion is a significant cause.',
        anchor: [-HW - 0.2, AXY - 0.4, ZT - 0.1] },
      { id: 'chip', name: 'Chip', object: chipMesh, slide: 60, qs: ['2015-16_8c'],
        desc: 'The chip slides across the rake face at high pressure and temperature; this sliding contact creates the crater by diffusion, adhesion and abrasion.',
        anchor: [0, AXY + 1.4, ZT + 1.6] },
      { id: 'workpiece', name: 'Workpiece', object: workpiece, slide: 60, qs: [],
        desc: 'Rotating bar. The new surface generated by the edge rubs the flank face; hard particles in the work material also abrade the tool.',
        anchor: [-1.2, AXY + R, 0] },
      { id: 'interface', name: 'Tool-chip interface (magnified)', object: inset, slide: 64, qs: ['2018-19_4b', '2017-18_4c', '2011-12_4d', '2010-11_4b'],
        desc: 'Magnified contact zone showing the wear mechanisms: abrasion, adhesion, diffusion and chemical reaction (oxidation). Shown in the Mechanisms mode.' },
    ];

    // ---------------- modes ----------------
    const modes = [
      { id: 'crater', label: 'Crater wear', slide: 60, qs: ['2015-16_8c', '2010-11_4b', '2011-12_4d'],
        info: 'Crater wear is a cavity on the rake face that forms and grows from the chip sliding against the surface. It starts a short distance behind the edge, deepens (KT) and widens with cutting time, and is mainly due to diffusion at the high rake-face temperature. A deep crater weakens the edge until it breaks. The chip is drawn semi-transparent so the depression is visible.' },
      { id: 'flank', label: 'Flank wear (VB)', slide: 60, qs: ['2015-16_8c', '2010-11_4b', '2022-23_6b'],
        info: 'Flank wear is a flat wear land on the relief face, caused by rubbing between the newly generated work surface and the flank next to the cutting edge. Its width VB follows the classic curve: fast break-in, steady rise, then rapid acceleration. Increased cutting force, poorer accuracy and surface finish, and vibration follow.' },
      { id: 'failure-modes', label: 'Failure modes', slide: 58, qs: ['2014-15_2d', '2022-23_6b'],
        info: 'Three ways a tool fails: (1) Fracture, when the cutting force becomes excessive and the point breaks suddenly (brittle). (2) Temperature failure, when the cutting temperature is too high, so the point softens, deforms plastically and loses its sharp edge. (3) Gradual wear of the flank and rake which finally ends like a temperature failure. The three states repeat in turn.' },
      { id: 'mechanisms', label: 'Wear mechanisms', slide: 64, qs: ['2018-19_4b', '2017-18_4c', '2011-12_4d', '2010-11_4b'],
        info: 'Abrasion: hard particles in the work gouge small pieces from the tool (significant in flank wear). Adhesion: pressure welding between chip and tool, torn away as tool particles (attrition). Diffusion: atoms exchange across the contact boundary, the principal cause of crater wear. Chemical reaction: oxidation of the rake face; the softer oxide layer is sheared away. Most are accelerated by higher speed and temperature. The four glyphs cycle.' },
      { id: 'inserts', label: 'Inserts & indexing', slide: 68, qs: [],
        info: 'Indexable inserts are clamped on a steel shank and come as square, triangular, round and rhombus shapes. The smaller the included corner angle, the weaker the edge: round is strongest, then square (90), rhombus (80), triangle (60). When one edge wears it is indexed to a fresh edge, which removes regrinding, cuts down time and tool-resetting time.' },
    ];
    let mode = 'crater';

    // ---------------- state & animation ----------------
    let clock = 0, rebuildT = 0, force = 1, statusTxt = '', timeMin = 0, flakeQ = -1, crackP = 0, subName = '';
    const dm = new THREE.Object3D();
    const vA = new THREE.Vector3(), vB = new THREE.Vector3(), upv = new THREE.Vector3(0, 1, 0);
    const setEmi = (mesh, v) => {
      const m = mesh.material;
      m.emissiveIntensity = v;
      if (m.userData && m.userData.baseIntensity !== undefined) m.userData.baseIntensity = v;
    };

    const LOOP = 22, HOLD = 2.5, REW = 1.5;
    function wearState(t) {
      // returns tau 0..1 along the classic curve with hold at failure and a smooth rewind
      if (t < LOOP) return t / LOOP;
      if (t < LOOP + HOLD) return 1;
      return 1 - ss((t - LOOP - HOLD) / REW);
    }

    function computeState() {
      const cyc = LOOP + HOLD + REW;
      st.nib = 0; st.droop = 0; st.glow = 0; flakeQ = -1; crackP = 0; subName = '';
      force = 1;
      if (mode === 'crater' || mode === 'flank') {
        const t = clock % cyc;
        const tau = wearState(t);
        st.tau = tau;
        const vb = wearVB(tau), ks = wearKT(tau);
        if (mode === 'crater') { st.s = ks; st.VB = 0.02 + vb * 0.12; } else { st.VB = Math.max(vb, 0.01); st.s = ks * 0.12; }
        st.glow = ss((tau - 0.78) / 0.2) * 0.55;
        timeMin = tau * 60;
        statusTxt = t >= LOOP + HOLD ? 'Tool changed' : statusOf(tau);
        force = 1 + 0.5 * tau + 0.6 * ((Math.max(0, tau - 0.78) / 0.22) ** 2);
      } else if (mode === 'failure-modes') {
        const SUB = 8;
        const k = Math.floor((clock % (3 * SUB)) / SUB);
        const u = clock % SUB;
        const back = 1 - ss((u - (SUB - 0.8)) / 0.8); // quick reset at the end of each state
        timeMin = (u / SUB) * 60;
        if (k === 0) {
          subName = 'Fracture failure';
          st.VB = 0.03; st.s = 0.05;
          const snap = 3.4;
          force = 1 + 1.4 * ss((u - 0.6) / (snap - 0.6));
          crackP = ss((u - 2.2) / 1.1);
          if (u >= snap) { st.nib = 0.32 * back; st.VB = lerp(0.03, 0.5, back); force = lerp(1, 0.4, ss((u - snap) / 0.4)); flakeQ = clamp((u - snap) / 2.6); if (back < 1) flakeQ = clamp((u - snap) / 2.6) * back; crackP = 0; }
          statusTxt = u < 2.2 ? 'Normal cutting' : u < snap ? 'Overload: force too high, crack forms' : 'FRACTURE FAILURE (sudden, brittle)';
        } else if (k === 1) {
          subName = 'Temperature failure';
          st.VB = 0.05; st.s = 0.1;
          const h = ss(u / 5);
          st.glow = h * back;
          st.droop = ss((u - 2) / 4) * back;
          force = 1 + 0.3 * h;
          statusTxt = u < 2 ? 'Heating up (cutting temperature too high)' : u < 5 ? 'Edge softening, plastic deformation' : 'TEMPERATURE FAILURE (edge lost)';
        } else {
          subName = 'Gradual wear';
          const tau = clamp(u / 7) * back + 0.0;
          st.tau = tau;
          st.VB = wearVB(tau) * 0.9 + 0.02; st.s = wearKT(tau) * 0.8 + 0.03;
          st.glow = ss((tau - 0.78) / 0.2) * 0.45;
          force = 1 + 0.5 * tau + 0.6 * ((Math.max(0, tau - 0.78) / 0.22) ** 2);
          timeMin = tau * 60;
          statusTxt = statusOf(tau);
        }
      } else {
        st.tau = 0.45; st.VB = wearVB(0.45); st.s = wearKT(0.45);
        timeMin = 27; statusTxt = mode === 'mechanisms' ? 'Steady-state wear' : 'Indexing edges';
      }
    }

    function applyVis() {
      const mech = mode === 'mechanisms', ins = mode === 'inserts';
      inset.visible = mech;
      gallery.visible = ins;
      vbDim.visible = mode === 'flank' || mode === 'failure-modes';
      ktDim.visible = mode === 'crater';
      chipMat.opacity = mode === 'crater' ? 0.45 : 0.92;
      if (chipMesh.material !== chipMat) chipMesh.material.opacity = chipMat.opacity;
      for (let i = 0; i < 4; i++) { mechGroups[i].visible = false; titles[i].visible = false; }
      for (const o of insertObjs) { o.g.scale.setScalar(1); o.rotG.rotation.y = 0; o.marks.forEach((m) => { m.visible = false; }); }
      landMat.color.setHex(0x2f241a);
      flake.visible = false; crack.visible = false;
    }

    function reset() {
      clock = 0; rebuildT = 0;
      applyVis();
      computeState();
      rebuildHead();
      spin.rotation.x = 0;
      setEmi(headMesh0, 0);
    }
    const headMesh0 = rakeMesh;

    // tiny vector rod helper (no allocation)
    function placeRod(mesh, ax, ay, bx, by, r) {
      vA.set(ax, ay, 0); vB.set(bx, by, 0);
      const len = Math.max(vA.distanceTo(vB), 1e-4);
      mesh.position.set((ax + bx) / 2, (ay + by) / 2, 0.12);
      mesh.scale.set(r, len, r);
      vB.sub(vA).multiplyScalar(1 / len);
      mesh.quaternion.setFromUnitVectors(upv, vB);
    }

    function animateInset(t) {
      const k = Math.floor((t % 24) / 6);
      const ph = (t % 6) / 6;
      for (let i = 0; i < 4; i++) { mechGroups[i].visible = i === k; titles[i].visible = i === k; }
      // moving chip stripes
      for (const s of stripes) { s.position.x = -1.5 + ((s.userData.k / 6 + t * 0.12) % 1) * 3.0; }
      if (k === 0) {
        for (let j = 0; j < NH; j++) {
          const p = (t * 0.2 + j / NH) % 1;
          const x = -1.5 + 3 * p;
          hards[j].position.set(x, -0.3 + (j % 2) * 0.1, 0.05);
          hards[j].rotation.y = t * 2 + j;
          scratches[j].position.set((-1.5 + x) / 2, -0.4, 0.05);
          scratches[j].scale.set(Math.max(x + 1.5, 0.001), 1, 1);
          const q = clamp((p - 0.3) / 0.4);
          const xf = -1.5 + 3 * 0.3 + 0.8 * q;
          flakes[j].position.set(xf, -0.4 + 0.5 * q * (1 - q) * 1.4 + 0.02, 0.05);
          flakes[j].scale.setScalar(p > 0.3 && p < 0.7 ? Math.sin(Math.PI * q) : 0.0001);
        }
      } else if (k === 1) {
        for (let j = 0; j < NB; j++) {
          const p = (ph * 1.0 + j / NB) % 1;
          const xs = -1.2 + j * 0.8;
          const shift = Math.min(p, 0.8) * 1.0;
          const alive = p < 0.8;
          const thick = alive ? 0.09 * (1 - 0.6 * p / 0.8) : 0.0001;
          placeRod(welds[j], xs, -0.4, xs + shift, -0.38 + 0.0, thick);
          // bridge is drawn slanted from tool surface to chip underside
          if (alive) placeRod(welds[j], xs, -0.4, xs + shift, -0.4 + 0.1 + 0.2 * (shift), thick);
          const q = clamp((p - 0.8) / 0.2);
          torn[j].position.set(xs + 0.8 + q * 0.5, -0.32, 0.12);
          torn[j].scale.setScalar(p >= 0.8 ? 1 - 0.7 * q * q : 0.0001);
        }
      } else if (k === 2) {
        for (let j = 0; j < NA; j++) {
          const p = (ph * 1.4 + j * 0.37) % 1;
          const e = ss(clamp((p - 0.1) / 0.8));
          const x = -1.35 + j * 0.2;
          dm.rotation.set(0, 0, 0);
          dm.scale.setScalar(1);
          dm.position.set(x + 0.06 * Math.sin(Math.PI * e), lerp(-0.62, 0.22, e), 0.12);
          dm.updateMatrix(); diffTool.setMatrixAt(j, dm.matrix);
          dm.position.set(x + 0.1 - 0.06 * Math.sin(Math.PI * e), lerp(0.3, -0.52, e), 0.12);
          dm.updateMatrix(); diffChip.setMatrixAt(j, dm.matrix);
        }
        diffTool.instanceMatrix.needsUpdate = true;
        diffChip.instanceMatrix.needsUpdate = true;
      } else {
        const g = ph < 0.55 ? ss(ph / 0.55) : 1;
        const th = 0.14 * g;
        const slide = ph < 0.65 ? 0 : ss((ph - 0.65) / 0.3) * 2.2;
        const fade = ph < 0.65 ? 1 : 1 - ss((ph - 0.7) / 0.3);
        oxLayer.scale.set(Math.max(fade, 0.001), Math.max(th, 0.001), 1);
        oxLayer.position.set(slide * 0.0 + (ph < 0.65 ? 0 : slide * 0.4), -0.4 + th / 2, 0);
        for (let j = 0; j < NO; j++) {
          const p = (ph * 1.3 + j / NO) % 1;
          const x0 = -1.4 + j * 0.4;
          oxAtoms[j].position.set(x0 + 0.3 * p, lerp(0.35, -0.38, ss(p)), 0.05);
          oxAtoms[j].scale.setScalar(p > 0.92 ? Math.max(0.0001, 1 - (p - 0.92) / 0.08) : 1);
        }
      }
    }

    function animateInserts(t) {
      const T = 2.4;
      for (const o of insertObjs) {
        const n = o.kd.n;
        const c = t / T;
        const k = Math.floor(c) % (n + 1);
        const fr = c - Math.floor(c);
        for (let i = 0; i < n; i++) {
          const m = o.marks[i];
          if (i < k) { m.visible = true; m.scale.setScalar(1); } else if (i === k && k < n) { m.visible = true; m.scale.setScalar(Math.max(0.0001, fr)); } else m.visible = false;
        }
        // index: rotate to bring corner k to the cutting position
        const target = k <= n ? k * o.step : n * o.step;
        const prev = Math.max(0, k - 1) * o.step;
        o.rotG.rotation.y = k === 0 ? 0 : lerp(prev, target, ss(fr * 3));
        o.g.scale.setScalar(k === 0 ? 0.6 + 0.4 * ss(fr * 3) : 1);
      }
    }

    reset();

    return {
      root,
      parts,
      modes,
      setMode(id) { mode = id; reset(); },
      update(dt, t) {
        clock += dt;
        spin.rotation.x += dt * 0.8;
        computeState();
        rebuildT += dt;
        if (rebuildT > 0.05 && (Math.abs(st.VB - last.VB) > 0.003 || Math.abs(st.s - last.s) > 0.004 || Math.abs(st.droop - last.droop) > 0.01 || Math.abs(st.glow - last.glow) > 0.01 || Math.abs(st.nib - last.nib) > 0.005)) {
          rebuildT = 0;
          rebuildHead();
        }
        // glow / heat
        const gl = clamp(st.glow);
        setEmi(rakeMesh, gl * 0.9);
        setEmi(bodyMesh, gl * 0.9);
        glow.visible = gl > 0.03;
        if (glow.visible) { glow.scale.setScalar(0.6 + 0.6 * gl); glowMat.opacity = 0.42 * gl; }
        setEmi(chipMesh, clamp(0.12 + gl * 1.2, 0, 1.0) * (mode === 'failure-modes' || mode === 'flank' || mode === 'crater' ? 0.6 : 0.2));
        // crack & flake
        crack.visible = crackP > 0.01;
        if (crack.visible) {
          crack.scale.set(0.15 + 0.85 * crackP, 1, 1);
          crack.position.set(0, E.eY0 + 0.01 - 0.2 * GAM, E.zTop + 0.3);
          crack.rotation.y = 0.5;
        }
        flake.visible = flakeQ >= 0.001 && flakeQ <= 0.999 && mode === 'failure-modes';
        if (flake.visible) {
          const q = flakeQ;
          flake.position.set(0, -0.04 - 1.8 * q * q - 0.1 * q, -1.2 * q * 0.3 - 0.4 * q);
          flake.rotation.set(q * 5, q * 2, q * 3);
          flake.position.z -= 0;
        }
        // chip slices
        const speed = 0.75;
        const act = mode === 'fracture-none' ? 0 : 1;
        for (let i = 0; i < NCH; i++) {
          let s = (((i / NCH) * chipLen + t * speed * act) % chipLen + chipLen) % chipLen;
          const f = s / chipLen;
          const fi = f * (MP - 1);
          const i0 = Math.min(MP - 2, Math.floor(fi));
          const ff = fi - i0;
          const y = lerp(pY[i0], pY[i0 + 1], ff);
          const z = lerp(pZ[i0], pZ[i0 + 1], ff);
          const a = lerp(pA[i0], pA[i0 + 1], ff);
          const fade = ss(f / 0.03) * (1 - ss((f - 0.9) / 0.1));
          dm.position.set(0, y, z);
          dm.rotation.set(a, 0, 0);
          dm.scale.set(CHIPW, Math.max(TC * (1 - 0.35 * f) * fade, 0.0001), (chipLen / NCH) * 1.4);
          dm.updateMatrix();
          chipMesh.setMatrixAt(i, dm.matrix);
        }
        chipMesh.instanceMatrix.needsUpdate = true;
        // fracture: chip stops pushing when tool is broken is not modelled; chip keeps flowing
        if (mode === 'mechanisms') animateInset(clock);
        else if (mode === 'inserts') animateInserts(clock);
      },
      readout() {
        const rows = [
          ['Cutting time', `${timeMin.toFixed(0)} min`],
          ['Flank wear VB', `${st.VB.toFixed(2)} mm`],
          ['Crater depth KT', `${(KTMAX * st.s).toFixed(2)} mm`],
          ['Status', statusTxt],
        ];
        if (mode === 'failure-modes') rows.push(['Failure mode', subName], ['Cutting force', `${force.toFixed(1)} x normal`]);
        else if (mode === 'crater' || mode === 'flank') rows.push(['Cutting force', `${force.toFixed(1)} x normal`]);
        if (mode === 'inserts') rows.push(['Edge strength', 'round > square 90 > rhombus 80 > triangle 60']);
        if (mode === 'mechanisms') rows.push(['Shown', ['Abrasion', 'Adhesion', 'Diffusion', 'Oxidation'][Math.floor((clock % 24) / 6)]]);
        return rows;
      },
      legend: [['V', 'cutting speed (work surface)'], ['f', 'infeed'], ['amber', 'wear dimension VB / KT']],
    };
  },
};
