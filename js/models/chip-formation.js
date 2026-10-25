import * as THREE from 'three';
import { M, box, extrude, tube, arrow, group, textSprite } from '../kit.js';

const D2R = Math.PI / 180;
const V3 = THREE.Vector3;
const A1 = 0.35, DELTA = 0.11, CARD_W = DELTA * 0.92, BZ = 1.4, YT = 1.2, V = 1.5;
const SPAWN = 3.6, CX = SPAWN / V, DTC = DELTA / V, POOL = 150;
const DE = 0.2, HB = 0.9, BUE_P = 5.0, G = 5;
const XL = -5.2, XR = 5.2, NC = 260, DX = (XR - XL) / NC;
const ZF = 0.98;
const sm = (x) => { const c = x < 0 ? 0 : x > 1 ? 1 : x; return c * c * (3 - 2 * c); };

const MODES = {
  'shear-plane': { gamma: 12, xi: 1.9, kind: 'cont', L0: 3.0, R: 0, th: 0 },
  'shear-zones': { gamma: 12, xi: 1.9, kind: 'cont', L0: 1.6, R: 1.9, th: 100 },
  continuous: { gamma: 15, xi: 1.8, kind: 'cont', L0: 1.3, R: 1.9, th: 110 },
  discontinuous: { gamma: 0, xi: 1.25, kind: 'disc', M: 20 },
  bue: { gamma: 12, xi: 1.6, kind: 'bue', L0: 1.3, R: 2.2, th: 95 },
  serrated: { gamma: 5, xi: 1.5, kind: 'serr', M: 14, L0: 1.4, R: 3.2, th: 70 },
};
const ALPHA = 7;

function seg(a, b, mat, r = 0.015) {
  const A = new V3(...a), B = new V3(...b);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, A.distanceTo(B), 6), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new V3(0, 1, 0), B.clone().sub(A).normalize());
  return m;
}
function arcXY(c, r, a0, a1, mat) {
  const pts = [];
  for (let i = 0; i <= 16; i++) { const a = a0 + ((a1 - a0) * i) / 16; pts.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a), ZF]); }
  return tube(pts, 0.02, mat, { seg: 24, radial: 6 });
}
function lbl(text, x, y, size = 0.28) { const s = textSprite(text, { size }); s.position.set(x, y, ZF + 0.05); return s; }
function disposeGroup(g) {
  g.traverse((o) => { o.geometry?.dispose?.(); if (o.isSprite) { o.material.map?.dispose(); o.material.dispose(); } });
  while (g.children.length) g.remove(g.children[0]);
}
function toolGeo(gDeg) {
  const g = gDeg * D2R, a = ALPHA * D2R;
  const F1 = [Math.sin(g) * 2.7, Math.cos(g) * 2.7];
  return extrude([[0, 0], [3.6, 3.6 * Math.tan(a)], [3.6, F1[1]], F1], BZ + 0.4, M.hss).geometry;
}

export default {
  id: 'chip-formation',
  title: 'Chip formation & chip types',
  subtitle: 'Parallel-plate model, shear zones and the five chip forms',
  camera: { position: [0.5, 3.2, 10.5], target: [-0.6, 2.8, 0] },
  build() {
    const root = new THREE.Group();
    const sub = box(10.4, YT - 0.04, BZ, M.castIron); sub.position.set(0, (YT - 0.04) / 2, 0);
    // machined-surface skin (updated in place)
    const sp = new Float32Array((NC + 1) * 12);
    for (let i = 0; i <= NC; i++) {
      const x = XL + i * DX, o = i * 12;
      sp.set([x, YT, BZ / 2, x, YT, -BZ / 2, x, YT - 0.05, BZ / 2, x, YT - 0.05, -BZ / 2], o);
    }
    const sIdx = [];
    for (let i = 0; i < NC; i++) {
      const a = i * 4, b = a + 4;
      sIdx.push(a, a + 1, b, a + 1, b + 1, b, a, b, a + 2, b, b + 2, a + 2, a + 1, a + 3, b + 1, b + 1, a + 3, b + 3);
    }
    const sgeo = new THREE.BufferGeometry();
    sgeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    sgeo.setIndex(sIdx);
    const smat = M.workCut.clone(); smat.flatShading = true; smat.side = THREE.DoubleSide;
    const skin = new THREE.Mesh(sgeo, smat); skin.frustumCulled = false;
    const workG = group(sub, skin);

    const toolMesh = new THREE.Mesh(toolGeo(12), M.hss); toolMesh.position.set(0, YT, 0); toolMesh.castShadow = true;
    const edge = tube([[0, YT, -BZ / 2 - 0.2], [0, YT, BZ / 2 + 0.2]], 0.035, M.amber, { seg: 2, radial: 6 });
    const toolG = group(toolMesh, edge);

    // cards
    const cgeo = new THREE.BoxGeometry(1, 1, BZ).translate(0.5, 0.5, 0);
    const matA = M.work, matB = M.steel, matHi = M.amber, matRed = M.red;
    const cardsG = new THREE.Group();
    const cards = [];
    for (let i = 0; i < POOL; i++) {
      const m = new THREE.Mesh(cgeo, matA);
      m.matrixAutoUpdate = false; m.frustumCulled = false; m.castShadow = true; m.visible = false;
      cardsG.add(m); cards.push(m);
    }

    // BUE
    const bgeo = extrude([[0, 0], [-DE, 0], [HB * Math.sin(12 * D2R), HB * Math.cos(12 * D2R)]], BZ + 0.1, M.brass).geometry;
    const bueG = new THREE.Group(); bueG.position.set(0, YT, 0);
    const bueMesh = new THREE.Mesh(bgeo, M.brass); bueG.add(bueMesh);
    const frags = [new THREE.Mesh(bgeo, M.brass), new THREE.Mesh(bgeo, M.brass)];
    frags.forEach((f) => { f.visible = false; root.add(f); });

    // shear plane + zone bands + crack
    const planeLine = box(1, 0.03, BZ + 0.1, M.amber);
    const bandP = box(1, 0.14, BZ + 0.08, M.amber.clone()); bandP.material.transparent = true; bandP.material.opacity = 0.45; bandP.material.depthWrite = false;
    const bandS = box(1, 0.1, BZ + 0.08, M.red.clone()); bandS.material.transparent = true; bandS.material.opacity = 0.5; bandS.material.depthWrite = false;
    const crack = box(1, 0.05, BZ + 0.1, M.red.clone()); crack.material.transparent = true; crack.material.opacity = 0;
    const shearG = group(planeLine, bandP, bandS, crack);
    const ann = new THREE.Group();
    root.add(workG, toolG, cardsG, bueG, shearG, ann);
    const vArrow = group(arrow([-4.8, YT + 0.9, 0], [1, 0, 0], 1.4, M.vColor), lbl('V', -4.1, YT + 1.25));
    root.add(vArrow);

    // state
    let mode = 'shear-plane', md = MODES[mode];
    let T = 0, N = 0, Pn = 1, gk = 0, beta = 0, xi = 1, vchip = 1, fx = 0, fy = 1, nx = -1, ny = 0, cosB = 0, sinB = 1, Stot = 0, Mseg = 1, th = 0, lastQ = 0, lastS = 0, flash = 0, b = 0;
    const bumps = { t: new Float32Array(16), a: new Float32Array(16), w: new Float32Array(16), n: 0 };
    const addBump = (t, a, w) => { const i = bumps.n++ % 16; bumps.t[i] = t; bumps.a[i] = a; bumps.w[i] = w; };
    const fragState = [{ t: -9 }, { t: -9 }];

    const setCard = (m, px, py, th2, sc, len) => {
      const c = Math.cos(th2), s = Math.sin(th2);
      const ex = -CARD_W * sc, L = (A1 / sinB) * len * sc;
      const ux = -cosB * L, uy = sinB * L;
      const e = m.matrix.elements;
      e[0] = ex * c; e[1] = ex * s; e[2] = 0; e[3] = 0;
      e[4] = ux * c - uy * s; e[5] = ux * s + uy * c; e[6] = 0; e[7] = 0;
      e[8] = 0; e[9] = 0; e[10] = 1; e[11] = 0; e[12] = px; e[13] = py; e[14] = 0; e[15] = 1;
      m.matrixWorldNeedsUpdate = true;
    };
    const bueSize = () => {
      const p = (T / BUE_P) % 1, b0 = 0.15;
      if (p < 0.82) return b0 + (1 - b0) * sm(p / 0.82);
      if (p < 0.9) return 1 + 0.03 * Math.sin((p - 0.82) * 150);
      return b0 + (1 - b0) * (1 - sm((p - 0.9) / 0.04));
    };

    const annotate = () => {
      disposeGroup(ann);
      const bt = beta, g = gk;
      const white = M.darkSteel;
      const tx = 0, ty = YT;
      const nL = [-Math.cos(g), Math.sin(g)], f = [Math.sin(g), Math.cos(g)];
      const L = (t, x, y) => ann.add(lbl(t, x, y));
      if (md.kind === 'cont' && mode === 'shear-plane') {
        const gt = md.gamma * D2R;
        ann.add(seg([0, ty, ZF], [-1.3, ty, ZF], white), seg([0, ty, ZF], [2.6, ty, ZF], white), seg([0, ty, ZF], [0, ty + 1.6, ZF], white));
        ann.add(arcXY([tx, ty], 0.75, Math.PI - bt, Math.PI, M.amber)); L('β', -1.0 * Math.cos(bt / 2) - 0.1, ty + 1.0 * Math.sin(bt / 2) + 0.12);
        ann.add(arcXY([tx, ty], 1.2, Math.PI / 2 - gt, Math.PI / 2, M.amber)); L('γ', 0.1, ty + 1.55);
        ann.add(arcXY([tx, ty], 1.7, 0, ALPHA * D2R, M.amber)); L('α', 2.0, ty - 0.15);
        ann.add(arcXY([tx, ty], 2.2, 0, Math.PI / 2 - gt, M.amber)); L('φ = 90° − γ', 2.55, ty + 1.2);
        ann.add(seg([-1.2, ty, ZF], [-1.2, ty + A1, ZF], M.amber, 0.02)); L('a1', -1.55, ty + A1 / 2);
        const P = [f[0] * 1.7, ty + f[1] * 1.7], Q = [P[0] + nL[0] * A1 * xi, P[1] + nL[1] * A1 * xi];
        ann.add(seg([P[0], P[1], ZF], [Q[0], Q[1], ZF], M.amber, 0.02)); L('a2', Q[0] + nL[0] * 0.3, Q[1] + 0.12);
        L('ξ = a2/a1', -2.6, ty + 1.7);
      } else if (mode === 'shear-zones') {
        L('Primary shear zone', -2.3, ty + 1.0); L('Secondary shear zone (friction)', 2.6, ty + 1.2);
      } else if (mode === 'continuous') L('Continuous (ribbon) chip', -3, ty + 3.6);
      else if (mode === 'discontinuous') L('Segmented chip: repeated fracture', -2.6, ty + 3.2);
      else if (mode === 'bue') L('Built-up edge', 1.9, ty + 0.9), L('Rough surface', 2.7, ty - 0.25);
      else if (mode === 'serrated') L('Saw-tooth free surface', -3, ty + 3.2);
    };

    const setMode = (id) => {
      mode = id; md = MODES[id]; T = 0; lastS = 0; flash = 0; bumps.n = 0; bumps.a.fill(0);
      const gt = md.gamma * D2R;
      toolMesh.geometry.dispose(); toolMesh.geometry = toolGeo(md.gamma);
      gk = md.kind === 'bue' ? Math.atan2(HB * Math.sin(gt) + DE, HB * Math.cos(gt)) : gt;
      xi = md.xi;
      beta = Math.atan2(Math.cos(gk), xi - Math.sin(gk));
      cosB = Math.cos(beta); sinB = Math.sin(beta);
      fx = Math.sin(gk); fy = Math.cos(gk); nx = -Math.cos(gk); ny = Math.sin(gk);
      vchip = V / xi; th = (md.th || 0) * D2R;
      Stot = md.R ? md.L0 + md.R * th : md.L0 || 0;
      Mseg = md.M || 2;
      let life = md.kind === 'disc' ? (Mseg - 1) * DTC + 0.9 : Stot / vchip + 0.35;
      N = Math.ceil((CX + life + 0.2) / DTC);
      N = Math.ceil(N / Mseg / 2) * Mseg * 2 / (Mseg % 2 ? 1 : 1);
      if (N % 2) N++;
      if (md.kind === 'disc' || md.kind === 'serr') while (N % Mseg || N % 2) N++;
      N = Math.min(N, POOL - (POOL % 2));
      if (md.kind === 'disc' || md.kind === 'serr') N -= N % Mseg;
      Pn = N * DTC;
      lastQ = Math.floor((-CX / DTC - (Mseg - 1)) / Mseg);
      cards.forEach((c, i) => { c.visible = i < N; });
      // shear plane & zones
      const Ls = A1 / sinB;
      for (const m of [planeLine, bandP]) { m.position.set(-0.5 * A1 / Math.tan(beta), YT + A1 / 2, 0); m.rotation.z = -beta; m.scale.x = Ls + 0.25; }
      bandP.scale.x = Ls + 0.05;
      bandS.position.set(fx * 0.5 + nx * 0.06, YT + fy * 0.5 + ny * 0.06, 0); bandS.rotation.z = Math.PI / 2 - gk; bandS.scale.x = 1.0;
      crack.position.copy(planeLine.position); crack.rotation.z = -beta; crack.scale.x = Ls + 0.25; crack.material.opacity = 0;
      shearG.visible = mode === 'shear-plane' || mode === 'shear-zones' || mode === 'continuous' || mode === 'discontinuous';
      planeLine.visible = mode !== 'discontinuous'; bandP.visible = bandS.visible = mode === 'shear-zones'; crack.visible = mode === 'discontinuous';
      bueG.visible = mode === 'bue'; frags.forEach((f) => { f.visible = false; });
      annotate();
      update(0);
    };

    function update(dt) {
      T += dt;
      b = md.kind === 'bue' ? bueSize() : 0;
      const Ex = -DE * b;
      if (md.kind === 'bue') {
        bueG.scale.setScalar(Math.max(b, 0.001));
        const q = Math.floor(T / BUE_P - 0.9);
        if (q > lastS) {
          lastS = q;
          addBump(T, 0.08, 0.16); addBump(T + 0.1, 0.04, 0.1);
          fragState[0].t = T; fragState[1].t = T; frags.forEach((fm) => { fm.visible = true; });
        }
        for (let i = 0; i < 2; i++) {
          const t2 = T - fragState[i].t, fm = frags[i];
          if (t2 < 0 || t2 > 1.8) { fm.visible = false; continue; }
          fm.scale.setScalar(0.7 * (1 - sm(t2 / 1.8)) + 0.001);
          if (i === 0) fm.position.set(-0.1 + fx * vchip * t2, YT + 0.2 + fy * vchip * t2, 0);
          else fm.position.set(0.3 + V * t2, YT, 0);
        }
      }
      if (md.kind === 'disc' || md.kind === 'serr') {
        const qN = Math.floor(((T - CX) / DTC - (Mseg - 1)) / Mseg);
        if (qN > lastQ) {
          lastQ = qN;
          const r = Math.abs(Math.sin(qN * 12.9898));
          if (md.kind === 'disc') { addBump(T, 0.04 + 0.04 * r, 0.1); flash = 1; } else addBump(T, 0.022, 0.18);
        }
      }
      flash = Math.max(0, flash - dt * 3);
      if (crack.visible) crack.material.opacity = flash;
      // cards
      const zones = mode === 'shear-zones';
      for (let j = 0; j < N; j++) {
        const m = cards[j];
        let tau = (T - j * DTC) % Pn; if (tau < 0) tau += Pn;
        let px, py, t2 = 0, sc = 1, len = 1, vis = true, mat = (j & 1) ? matB : matA;
        if (tau < CX) {
          px = Ex + V * (tau - CX); py = YT; sc = sm(tau / 0.45);
          if (zones && CX - tau < 0.13) mat = matHi;
        } else {
          const tp = tau - CX;
          if (zones && tp < 0.12) mat = matHi;
          if (md.kind === 'disc') {
            const mm = j % Mseg, tb = (Mseg - 1 - mm) * DTC;
            if (tp <= tb) { const s = vchip * tp; px = fx * s; py = YT + fy * s; } else {
              const t3 = tp - tb;
              if (t3 > 0.9) vis = false;
              const s0 = vchip * tb + vchip * t3;
              px = fx * s0 - 0.5 * t3; py = YT + fy * s0 + 0.6 * t3 - 0.5 * G * t3 * t3;
              sc = 1 - sm((t3 - 0.55) / 0.35);
            }
          } else {
            const s = vchip * tp;
            if (tp > Stot / vchip) vis = false;
            if (!md.R || s <= md.L0) { px = Ex + fx * s; py = YT + fy * s; } else {
              const ph = (s - md.L0) / md.R;
              const bx = Ex + fx * md.L0, by = YT + fy * md.L0;
              px = bx + md.R * (Math.sin(ph) * fx + (1 - Math.cos(ph)) * nx);
              py = by + md.R * (Math.sin(ph) * fy + (1 - Math.cos(ph)) * ny);
              t2 = ph;
            }
            const rem = Stot - s; if (rem < 0.5) sc = sm(rem / 0.5);
            if (md.kind === 'serr') {
              const mm = j % Mseg;
              len = 1 - 0.4 * (mm / (Mseg - 1)) * sm(tp / 0.18);
              if (mm === 0) mat = matRed;
            }
          }
        }
        if (!vis || sc < 0.01) { m.visible = false; continue; }
        m.visible = true; m.material = mat;
        setCard(m, px, py, t2, sc, len);
      }
      // surface
      const i0 = Math.floor((-0.1 - XL) / DX);
      for (let i = i0; i <= NC; i++) {
        const x = XL + i * DX; let h = 0;
        for (let k = 0; k < 16; k++) {
          if (bumps.a[k] === 0) continue;
          const d = (x - (V * (T - bumps.t[k]) + 0.55)) / bumps.w[k];
          if (d < 4 && d > -4) h += bumps.a[k] * Math.exp(-d * d);
        }
        sp[i * 12 + 1] = YT + h; sp[i * 12 + 4] = YT + h;
      }
      sgeo.attributes.position.needsUpdate = true;
    }

    const parts = [
      { id: 'tool', name: 'Cutting tool', object: toolG, desc: 'Wedge with rake angle γ and clearance (relief) angle α. Its edge is at the tip and the chip slides up the rake face.', slide: 34, qs: ['2018-19_2a', '2017-18_4b'], anchor: [2.2, YT + 2.2, 0] },
      { id: 'work', name: 'Workpiece and machined surface', object: workG, desc: 'The work moves at speed V towards the tool. The surface left behind is smooth for a continuous chip and rough with BUE or discontinuous chips.', slide: 34, qs: ['2012-13_4d'], anchor: [3.5, YT, 0.8] },
      { id: 'cards', name: 'Uncut layer and chip (parallel plates)', object: cardsG, desc: 'The layer is modelled as thin plates that slide over each other along the shear plane as they reach the tool, then stack up the rake face to form the thicker chip (thickness a2 > a1).', slide: 35, qs: ['2017-18_2b', '2014-15_2a', '2016-17_4b'], anchor: [-1.2, YT + 0.5, 0] },
      { id: 'shear-plane', name: 'Shear plane and shear zones', object: shearG, desc: 'The chip is formed by shear along the shear plane at shear angle β. In reality shear occurs in a primary zone, and secondary shear takes place in the chip next to the rake face because of friction.', slide: 36, qs: ['2014-15_2a', '2017-18_2b', '2014-15_4b'], anchor: [-0.6, YT + 0.4, 0] },
      { id: 'bue', name: 'Built-up edge', object: bueG, desc: 'Layers of work material weld onto the tip, grow, then break away periodically, giving a poor finish but temporarily protecting the edge.', slide: 39, qs: ['2012-13_4d', '2009-10_3a'], anchor: [-0.3, YT + 0.5, 0] },
    ];
    const info = {
      'shear-plane': 'Parallel-plate model: the chip forms by shear as the tool is forced into the metal. Uncut thickness a1 becomes chip thickness a2 (a2 > a1, the chip is also shorter). Chip reduction coefficient ξ = a2/a1 and tanβ = cosγ / (ξ − sinγ). The cutting angle φ is the angle between the rake face and the machined surface (90° − γ).',
      'shear-zones': 'Shear does not occur on a single plane but within a primary shear zone (amber). A second, secondary shear zone (red) forms in the chip along the rake face because of friction as the chip slides over the tool. This heat generation is why chip and tool tip get very hot.',
      continuous: 'Continuous or ribbon chip: the work material fails by slip along the shear plane without fracture and the chip flows smoothly up the tool face in long coils; the outer face is smooth, the inner shows slip steps. Typical of ductile metals (mild steel, aluminium, copper) with positive rake, high cutting speed, small feed and good lubrication.',
      discontinuous: 'Discontinuous chip: small segments that adhere loosely, formed when deformation is limited by repeated fracture. Typical of hard, brittle materials (bronze, brass, cast iron) and also of low speeds, large feeds and small or negative rake. The surface is less smooth but tool forces are steadier.',
      bue: 'Continuous chip with built-up edge: similar to a continuous chip but less smooth. Work material welds to the tip, grows, then sloughs off, partly with the chip and partly onto the machined surface. It gives a poor surface finish yet protects the edge from wear. It occurs with ductile metals at low-to-medium speeds and high friction.',
      serrated: 'Serrated (semi-continuous) chip with a saw-tooth appearance, produced by cyclic alternation of high and low shear strain. It is typical of titanium alloys, nickel-base superalloys and austenitic stainless steels, and also of steels cut at very high speeds.',
    };
    const modes = [
      { id: 'shear-plane', label: 'Shear plane', slide: 34, qs: ['2017-18_2b', '2016-17_4b', '2014-15_2a', '2018-19_2a', '2013-14_2a', '2015-16_5a', '2011-12_3a', '2010-11_3c'] },
      { id: 'shear-zones', label: 'Shear zones', slide: 36, qs: ['2014-15_4b', '2014-15_2a'] },
      { id: 'continuous', label: 'Continuous chip', slide: 38, qs: ['2021-22_7b', '2017-18_2a', '2016-17_4b', '2009-10_3a'] },
      { id: 'discontinuous', label: 'Discontinuous chip', slide: 38, qs: ['2021-22_7b', '2017-18_2a', '2016-17_4b', '2009-10_3a'] },
      { id: 'bue', label: 'Built-up edge', slide: 39, qs: ['2012-13_4d', '2009-10_3a', '2021-22_7b'] },
      { id: 'serrated', label: 'Serrated chip', slide: 39, qs: ['2021-22_7b', '2017-18_2a', '2016-17_4b'] },
    ].map((m) => ({ ...m, info: info[m.id] }));
    setMode('shear-plane');
    return {
      root, parts, modes, setMode, update,
      readout() {
        const r = [['Uncut thickness a1', `${A1.toFixed(2)} mm`], ['Chip thickness a2', `${(A1 * xi).toFixed(2)} mm`], ['ξ = a2/a1', xi.toFixed(2)], ['Shear angle β', `${(beta * 180 / Math.PI).toFixed(1)}°`], ['Rake γ', `${(gk * 180 / Math.PI).toFixed(0)}°`], ['Clearance α', `${ALPHA}°`]];
        if (mode === 'bue') r.push(['BUE size', `${Math.round(b * 100)}%`]);
        return r;
      },
      legend: [['V', 'work (cutting) speed'], ['a1', 'uncut thickness'], ['a2', 'chip thickness']],
    };
  },
};
