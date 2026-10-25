import * as THREE from 'three';
import { M, box, cyl, gear, revolve, extrude, helixTeeth, at, arrow, spinArrow, chips } from '../kit.js';

const ARBOR_Y = 3.6;   // world height of the horizontal arbor
const TIP_Y = 2.8;     // world height of the cutter bottom / tip on the vertical spindle
const TB = 0.4;        // table top height in work coordinates
const WL = 5.5;        // length of stepped workpieces
const FMAX = 3.4;      // feed stroke for stepped operations
const WH = 0.9;        // workpiece height
const T_F = 10, T_D = 0.5, T_R = 1.2, T_U = 0.5;
const CYCLE = T_F + T_D + T_R + T_U;
const DROP = 1.2;
const ease = (k) => k * k * (3 - 2 * k);

// ---------- cutter builders ----------
function discCutter(R, w, teeth, mat = M.hss) {
  const g = new THREE.Group();
  g.add(gear(R, teeth, w, mat));
  g.add(cyl(0.3, w + 0.3, M.steel, { axis: 'z' }));
  return g;
}
function faceMill(R, n = 10) {
  const g = new THREE.Group();
  g.add(at(cyl(R, 0.35, M.darkSteel), 0, 0.175, 0));
  g.add(at(cyl(0.6, 0.5, M.steel), 0, 0.6, 0));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const ins = box(0.32, 0.22, 0.12, M.carbide);
    ins.position.set(Math.cos(a) * (R - 0.05), 0.11, Math.sin(a) * (R - 0.05));
    ins.rotation.y = -a;
    g.add(ins);
  }
  g.add(at(cyl(0.45, 3.2, M.steel), 0, 2.45, 0)); // shaft up into the head
  return g;
}
function endMill(r, len, ball = false) {
  const g = new THREE.Group();
  const y0 = ball ? r : 0;
  g.add(at(cyl(r, len - y0, M.hss), 0, y0 + (len - y0) / 2, 0));
  const fl = helixTeeth(r * 0.98, len - y0, 4, M.carbide, { helix: 1.2, width: r * 0.3, height: r * 0.3 });
  fl.position.y = y0 + (len - y0) / 2;
  g.add(fl);
  if (ball) g.add(at(new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), M.hss), 0, r, 0));
  g.add(at(cyl(0.5, 0.7, M.darkSteel, { rTop: 0.38 }), 0, len + 0.35, 0));
  g.add(at(cyl(0.45, 3.2, M.steel), 0, len + 0.7 + 1.6, 0));
  return g;
}
function formCutter() {
  const prof = [[0.2, -0.35], [0.65, -0.35]];
  for (let i = 0; i <= 10; i++) {
    const a = -Math.PI / 2 + (i / 10) * Math.PI;
    prof.push([0.65 + 0.35 * Math.cos(a), 0.35 * Math.sin(a)]);
  }
  prof.push([0.65, 0.35], [0.2, 0.35]);
  const g = new THREE.Group();
  g.add(revolve(prof, M.hss, { axis: 'z', seg: 40 }));
  g.add(cyl(0.3, 1.0, M.steel, { axis: 'z' }));
  return g;
}

// ---------- paths ----------
function makePath(pts) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const len = cum[cum.length - 1];
  return {
    len,
    at(s, out) {
      s = Math.min(Math.max(s, 0), len);
      let i = 1;
      while (i < cum.length - 1 && cum[i] < s) i++;
      const seg = cum[i] - cum[i - 1] || 1;
      const k = (s - cum[i - 1]) / seg;
      out[0] = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k;
      out[1] = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k;
      return out;
    },
  };
}
function roundedRect(hx, hz, r, n = 8) {
  const pts = [];
  const corners = [[hx - r, hz - r, 0], [-hx + r, hz - r, Math.PI / 2], [-hx + r, -hz + r, Math.PI], [hx - r, -hz + r, Math.PI * 1.5]];
  for (const [cx, cz, a0] of corners) for (let i = 0; i <= n; i++) {
    const a = a0 + (i / n) * (Math.PI / 2);
    pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
  }
  pts.push(pts[0]);
  return pts;
}

export default {
  id: 'milling-ops',
  title: 'Milling operations',
  subtitle: 'Peripheral milling (horizontal arbor) and face milling (vertical spindle)',
  camera: { position: [8.5, 6.5, 11], target: [0, 3, 0] },
  build() {
    const root = new THREE.Group();

    // ----- machine frames -----
    const frameH = new THREE.Group();
    frameH.add(at(box(3.2, 7, 1.2, M.paint), 0, 3.5, -3.4));
    frameH.add(at(cyl(0.55, 0.8, M.darkSteel, { axis: 'z' }), 0, ARBOR_Y, -2.4));
    frameH.add(at(cyl(0.16, 5.6, M.chrome, { axis: 'z' }), 0, ARBOR_Y, 0.4));
    frameH.add(at(cyl(0.22, 6.0, M.steel, { axis: 'z' }), 0, 6.3, -0.4));
    frameH.add(at(box(1.8, 0.4, 0.4, M.paint), 0, 6.1, 2.85));
    frameH.add(at(box(0.5, 2.0, 0.35, M.paint), 0, 5.1, 2.85));
    frameH.add(at(cyl(0.38, 0.4, M.brass, { axis: 'z' }), 0, ARBOR_Y, 2.85));
    root.add(frameH);
    const frameV = new THREE.Group();
    frameV.add(at(box(3.2, 8, 1.2, M.paint), 0, 4, -3.4));
    frameV.add(at(box(2.0, 1.6, 4.4, M.paint), 0, 6.6, -1.4));
    frameV.add(at(cyl(0.6, 1.2, M.blue), 0, 7.9, -0.6));
    frameV.add(at(cyl(0.7, 0.3, M.paintDark), 0, 5.65, 0));
    root.add(frameV);

    // ----- pedestal and bed -----
    const pedestal = new THREE.Group();
    const knee = box(3.4, 1, 3.6, M.paint);
    pedestal.add(knee);
    pedestal.add(at(box(5.5, 0.3, 5.5, M.castIron), 0, 0.15, 0));
    root.add(pedestal);

    const bed = new THREE.Group();
    const table = new THREE.Group();
    table.add(at(box(9, 0.4, 5.2, M.castIron), -1.5, 0.2, 0));
    table.add(at(box(9.05, 0.03, 5.25, M.darkSteel), -1.5, 0.4, 0));
    for (const z of [-1.7, 0, 1.7]) table.add(at(box(9, 0.04, 0.14, M.black), -1.5, 0.415, z));
    bed.add(table);
    root.add(bed);

    const cutterRoot = new THREE.Group();
    const decoRoot = new THREE.Group();
    const workAll = new THREE.Group();
    bed.add(workAll);
    root.add(cutterRoot, decoRoot);

    const cs = chips(50, M.workCut);
    root.add(cs.object);

    // ---------- mode builders ----------
    const modes = [];

    function baseMode(o) {
      const cutterG = new THREE.Group();   // rotating cutter assembly
      cutterG.add(o.cutter);
      cutterG.position.set(0, o.vertical ? TIP_Y : ARBOR_Y, 0);
      cutterG.visible = false;
      cutterRoot.add(cutterG);
      const deco = new THREE.Group();
      deco.position.y = o.toolY - o.ref;
      deco.visible = false;
      decoRoot.add(deco);
      const work = new THREE.Group();
      work.visible = false;
      workAll.add(work);
      const m = { ...o, cutterG, deco, work, shift: o.toolY - o.ref };
      modes.push(m);
      return m;
    }

    // V arrow
    function vArrow(m, axis, pos, radius) {
      const a = spinArrow(1, M.vColor, { axis, arc: Math.PI * 1.3 });
      a.scale.setScalar(radius);
      a.position.set(...pos);
      m.deco.add(a);
    }

    function stepMode(o) {
      const m = baseMode({ ...o, kind: 'step', toolY: o.vertical ? TIP_Y : ARBOR_Y });
      const uncut = box(1, WH, 2.4, M.work);
      m.work.add(uncut);
      const mach = o.profiles.map((p) => {
        const e = extrude(p, 1, M.workCut, { axis: 'x' });
        m.work.add(e);
        return e;
      });
      m.setF = (f) => {
        uncut.scale.x = Math.max(WL - f, 0.001);
        uncut.position.set(-(WL + f) / 2, TB + WH / 2, 0);
        for (const e of mach) { e.scale.x = Math.max(f, 0.001); e.position.set(-f / 2, 0, 0); }
      };
      // V, f, d arrows
      if (o.vertical) vArrow(m, 'y', [0, o.ref + (o.arrowUp ?? 1.0), 0], o.arrowR);
      else vArrow(m, 'z', [0, o.ref, 2.0], o.arrowR);
      m.deco.add(arrow([-3.4, TB + WH + 0.6, 2.2], [1, 0, 0], 2.2, M.fColor));
      if (o.d) m.deco.add(arrow([-o.xs - 0.5, TB + WH, 1.45], [0, -1, 0], o.d + 0.1, M.dColor, { head: 0.1, shaft: 0.025 }));
      return m;
    }

    // --- peripheral ---
    stepMode({
      id: 'slab', label: 'Slab milling', vertical: false, cutter: at(discCutter(1.0, 2.8, 18), 0, 0, 0), ref: 2.0,
      profiles: [[[-1.2, TB], [1.2, TB], [1.2, 1.0], [-1.2, 1.0]]], R: 1.0, d: 0.3, xs: Math.sqrt(0.3 * 1.7), arrowR: 1.3,
      info: 'A milling operation that uses a cylindrical (slab) mill on an axis parallel to the worktable to create a flat surface. It is peripheral milling: the cutter axis is parallel to the machined surface. Approach A = sqrt(d(D - d)); for d = D/4 this gives A = (sqrt3/4)·D.',
      slide: 60, qs: ['2013-14_5b', '2017-18_6a'],
    });
    stepMode({
      id: 'slotting', label: 'Slotting', vertical: false, cutter: discCutter(0.9, 0.4, 20), ref: 1.7,
      profiles: [[[-1.2, TB], [1.2, TB], [1.2, 1.3], [0.2, 1.3], [0.2, 0.8], [-0.2, 0.8], [-0.2, 1.3], [-1.2, 1.3]]],
      R: 0.9, d: 0.5, xs: Math.sqrt(0.5 * 1.3), arrowR: 1.2,
      info: 'A milling operation that cuts a narrow groove (slot) into the surface of the work-piece using a narrow disc cutter on a horizontal arbor. The slot width equals the cutter width; the slot depth is the depth of cut.',
      slide: 60, qs: ['2013-14_5b'],
    });
    stepMode({
      id: 'slitting', label: 'Slitting', vertical: false, cutter: discCutter(1.4, 0.07, 60), ref: 1.82,
      profiles: [[[-1.2, TB], [-0.06, TB], [-0.06, 1.3], [-1.2, 1.3]], [[0.06, TB], [1.2, TB], [1.2, 1.3], [0.06, 1.3]]],
      R: 1.4, d: 0.9, xs: Math.sqrt(0.9 * 1.9), arrowR: 1.7,
      info: 'A slitting saw is a thin rotary tool-steel cutter with peripheral teeth, used in a milling machine to cut deep slots or to part off (cut right through) the workpiece by relative motion between work and cutter. The work is separated into two pieces.',
      slide: 60, qs: ['2013-14_5b'],
    });
    stepMode({
      id: 'side', label: 'Side milling', vertical: false, cutter: at(discCutter(1.0, 0.7, 20), 0, 0, 0.85), ref: 1.8,
      profiles: [[[-1.2, TB], [1.2, TB], [1.2, 1.3], [-0.5, 1.3], [-0.5, 0.8], [-1.2, 0.8]]],
      R: 1.0, d: 0.5, xs: Math.sqrt(0.5 * 1.5), arrowR: 1.3,
      info: 'Milling with a side-milling cutter to machine one vertical surface (a shoulder). The cutter has teeth on its periphery and on the sides, so the side teeth finish the vertical wall while the periphery cuts the step floor.',
      slide: 61, qs: ['2013-14_5b', '2010-11_6a'],
    });
    {
      const g = new THREE.Group();
      g.add(at(discCutter(1.0, 0.7, 20), 0, 0, 0.85), at(discCutter(1.0, 0.7, 20), 0, 0, -0.85));
      g.add(cyl(0.45, 1.0, M.brass, { axis: 'z' }));
      stepMode({
        id: 'straddle', label: 'Straddle milling', vertical: false, cutter: g, ref: 1.8,
        profiles: [[[-1.2, TB], [1.2, TB], [1.2, 0.8], [0.5, 0.8], [0.5, 1.3], [-0.5, 1.3], [-0.5, 0.8], [-1.2, 0.8]]],
        R: 1.0, d: 0.5, xs: Math.sqrt(0.5 * 1.5), arrowR: 1.3,
        info: 'Face milling of two parallel vertical surfaces of a workpiece simultaneously, using two side-milling cutters on the same arbor separated by spacers. The width left between the surfaces is set by the spacers.',
        slide: 61, qs: ['2013-14_5b'],
      });
    }
    {
      const pts = [[-1.2, TB], [1.2, TB], [1.2, 1.3], [0.35, 1.3]];
      for (let i = 0; i <= 10; i++) { const a = Math.PI + (i / 10) * Math.PI; pts.push([-Math.cos(a) * 0.35, 1.3 + Math.sin(a) * 0.35]); }
      pts.push([-0.35, 1.3], [-1.2, 1.3]);
      stepMode({
        id: 'form', label: 'Form milling', vertical: false, cutter: formCutter(), ref: 1.95,
        profiles: [pts], R: 1.0, d: 0.35, xs: Math.sqrt(0.35 * 1.65), arrowR: 1.3,
        info: 'A milling operation that uses a cutter with a unique shape to create that shape in the workpiece. The cross-section of the machined surface corresponds to the contour of the cutter (here a semicircular groove).',
        slide: 61, qs: ['2013-14_5b'],
      });
    }

    // --- face group (vertical spindle) ---
    stepMode({
      id: 'face-conventional', label: 'Conventional face milling', vertical: true, cutter: faceMill(1.5), ref: 1.0, arrowUp: 0.9,
      profiles: [[[-1.2, TB], [1.2, TB], [1.2, 1.0], [-1.2, 1.0]]], d: 0.3, xs: 1.2, arrowR: 1.7,
      info: 'The diameter of the cutter is greater than the work width, so the cutter overhangs the work on both sides. The milled surface is flat, at right angles to the cutter axis, and has no relation to the cutter contour; both the side and the face of the cutter cut.',
      slide: 62, qs: ['2016-17_7d', '2015-16_3b', '2017-18_6a'],
    });
    {
      const c = faceMill(1.5);
      c.position.z = 0.5;
      stepMode({
        id: 'face-partial', label: 'Partial face milling', vertical: true, cutter: c, ref: 1.0, arrowUp: 0.9,
        profiles: [[[-1.2, TB], [1.2, TB], [1.2, 1.3], [1.0, 1.3], [1.0, 1.0], [-1.2, 1.0]]], d: 0.3, xs: 1.3, arrowR: 1.7,
        info: 'The cutter overhangs the work on only one side, so an uncut strip of the work remains on the other side. Face milling in general cuts with the combined action of the side and the face of the cutter.',
        slide: 62, qs: ['2016-17_7d'],
      });
    }
    stepMode({
      id: 'end-milling', label: 'End milling', vertical: true, cutter: endMill(0.4, 1.0), ref: 0.8, arrowUp: 1.1,
      profiles: [[[-1.2, TB], [1.2, TB], [1.2, 1.3], [0.4, 1.3], [0.4, 0.8], [-0.4, 0.8], [-0.4, 1.3], [-1.2, 1.3]]], d: 0.5, xs: 0.4, arrowR: 0.75,
      info: 'The cutter diameter is less than the work width, so a slot is cut into the part. The end mill cuts with its end face and its periphery.',
      slide: 62, qs: ['2016-17_7d'],
    });

    // --- path modes ---
    function pathMode(o) {
      const m = baseMode({ ...o, kind: 'path', toolY: TIP_Y, vertical: true });
      m.path = makePath(o.pts);
      m.trail = [];
      const N = Math.max(10, Math.ceil(m.path.len / 0.1));
      const geo = new THREE.CylinderGeometry(o.tr, o.tr, 0.02, 14);
      const tmp = [0, 0];
      for (let i = 0; i < N; i++) {
        m.path.at((i / (N - 1)) * m.path.len, tmp);
        const d = new THREE.Mesh(geo, M.black);
        d.position.set(tmp[0], o.top + 0.01, tmp[1]);
        d.visible = false;
        m.work.add(d);
        m.trail.push(d);
      }
      m.fArrow = new THREE.Group();
      m.fArrow.add(arrow([0.55, 0, 0], [1, 0, 0], 1.3, M.fColor));
      m.fArrow.position.y = o.top + 0.9;
      m.deco.add(m.fArrow);
      vArrow(m, 'y', [0, o.ref + 1.2, 0], 0.8);
      return m;
    }
    {
      const stock = box(3.8, 0.5, 2.8, M.work);
      const partShape = roundedRect(1.2, 0.7, 0.3).map(([x, z]) => [x, -z]);
      const part = extrude(partShape, 0.5, M.workCut, { axis: 'y' });
      const m = pathMode({
        id: 'profile', label: 'Profile milling', cutter: endMill(0.3, 1.0), ref: TB + 0.5 - 0.02, tr: 0.3, top: TB + 0.5,
        pts: roundedRect(1.5, 1.0, 0.6),
        info: 'A form of end milling in which the outside periphery of a flat part is cut. The end mill follows the contour of the part, and the dark track is the stock removed around it.',
        slide: 63, qs: ['2016-17_7d'],
      });
      stock.position.set(0, TB + 0.25, 0);
      part.position.set(0, TB + 0.25, 0);
      part.scale.set(1, 1, 1);
      m.work.add(stock, part);
    }
    {
      const stock = box(3.6, 0.6, 2.6, M.work);
      const m = pathMode({
        id: 'pocket', label: 'Pocket milling', cutter: endMill(0.3, 1.0), ref: TB + 0.6 - 0.02, tr: 0.3, top: TB + 0.6,
        pts: [[-0.7, -0.3], [0.7, -0.3], [0.7, 0], [-0.7, 0], [-0.7, 0.3], [0.7, 0.3]],
        info: 'Another form of end milling, used to mill shallow pockets into flat parts. The end mill traces the pocket area with overlapping passes, leaving a recess with a flat floor.',
        slide: 63, qs: ['2016-17_7d'],
      });
      stock.position.set(0, TB + 0.3, 0);
      m.work.add(stock);
    }

    // --- surface contouring (ball nose, height-field) ---
    {
      const NX = 32, NZ = 14, XS = 4.0, ZS = 2.6, STOCK = 0.9;
      const surf = (x, z) => 0.55 + 0.22 * Math.sin(2.0 * x) * Math.cos(1.5 * z);
      const nv = (NX + 1) * (NZ + 1);
      const per = [];
      for (let i = 0; i <= NX; i++) per.push([i, 0]);
      for (let j = 1; j <= NZ; j++) per.push([NX, j]);
      for (let i = NX - 1; i >= 0; i--) per.push([i, NZ]);
      for (let j = NZ - 1; j >= 1; j--) per.push([0, j]);
      const pos = new Float32Array((nv + per.length) * 3);
      const idx = [];
      for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) {
        const v = j * (NX + 1) + i;
        pos[v * 3] = -XS / 2 + (XS * i) / NX;
        pos[v * 3 + 2] = -ZS / 2 + (ZS * j) / NZ;
        if (i < NX && j < NZ) { idx.push(v, v + NX + 1, v + 1, v + 1, v + NX + 1, v + NX + 2); }
      }
      per.forEach(([i, j], k) => {
        const v = j * (NX + 1) + i;
        const b = nv + k;
        pos[b * 3] = pos[v * 3]; pos[b * 3 + 1] = TB; pos[b * 3 + 2] = pos[v * 3 + 2];
        const k2 = (k + 1) % per.length;
        const v2 = per[k2][1] * (NX + 1) + per[k2][0];
        idx.push(v, nv + k, nv + k2, v, nv + k2, v2);
      });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setIndex(idx);
      const mat = M.work.clone();
      mat.side = THREE.DoubleSide;
      const hf = new THREE.Mesh(geo, mat);
      hf.frustumCulled = false;
      const pass = 0.25;
      const pts = [];
      const nPass = Math.floor(XS / pass);
      for (let k = 0; k <= nPass; k++) {
        const x = -XS / 2 + 0.1 + k * ((XS - 0.2) / nPass);
        const a = k % 2 === 0 ? -1.15 : 1.15;
        pts.push([x, a], [x, -a]);
      }
      const m = baseMode({
        id: 'surface-contouring', label: 'Surface contouring', kind: 'contour', vertical: true, toolY: TIP_Y,
        cutter: endMill(0.25, 1.0, true), ref: TB + 0.55,
        info: 'A ball-nose cutter (rather than a square-end cutter) is fed back and forth across the work along a curvilinear path at close intervals to create a three-dimensional surface form. The bright surface behind the cutter is the machined contour.',
        slide: 63, qs: ['2016-17_7d'],
      });
      m.path = makePath(pts);
      m.surf = surf;
      m.hf = hf;
      m.work.add(hf, at(box(XS, 0.01, ZS, M.castIron), 0, TB - 0.005, 0));
      m.updateHF = (cx) => {
        for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) {
          const v = j * (NX + 1) + i;
          const x = pos[v * 3];
          pos[v * 3 + 1] = TB + (x <= cx ? surf(x, pos[v * 3 + 2]) : STOCK);
        }
        per.forEach(([i, j], k) => { void k; });
        geo.attributes.position.needsUpdate = true;
        geo.computeVertexNormals();
      };
      m.updateHF(-99);
      m.fArrow = new THREE.Group();
      m.fArrow.add(arrow([0.45, 0, 0], [1, 0, 0], 1.3, M.fColor));
      m.fArrow.position.y = TB + 1.9;
      m.deco.add(m.fArrow);
      vArrow(m, 'y', [0, TB + 0.55 + 1.2, 0], 0.7);
    }

    // ---------- parts ----------
    const parts = [
      { id: 'table', name: 'Table', object: bed, desc: 'Carries the workpiece under the cutter. For stepped cuts the table feeds along X; for profile, pocket and contouring work the table and saddle trace the path.', slide: 59, qs: [], explode: [0, 0.5, 1.5] },
      { id: 'workpiece', name: 'Workpiece', object: workAll, desc: 'The dull surface is uncut stock; the bright surface or dark track is where metal has been removed. Peripheral milling cuts generally in a plane parallel to the cutter axis and the milled cross-section matches the cutter contour; face milling cuts at right angles to the cutter axis and gives a flat surface unrelated to the cutter contour.', slide: 59, qs: ['2017-18_6a'], explode: [0, 1.5, 1.5] },
      { id: 'cutters', name: 'Milling cutter', object: cutterRoot, desc: 'The cutter for the selected operation: discs on a horizontal arbor for peripheral milling; face mill, end mill or ball-nose cutter in a vertical spindle for face milling.', slide: 59, qs: ['2013-14_5b', '2016-17_7d'], explode: [0, 1.5, 0] },
      { id: 'horizontal-rig', name: 'Horizontal spindle, arbor and support', object: frameH, desc: 'Column with horizontal spindle, arbor, overarm and arbor support used for peripheral operations (slab, slotting, slitting, side, straddle, form).', slide: 60, qs: [], explode: [0, 0, -2] },
      { id: 'vertical-rig', name: 'Vertical spindle head', object: frameV, desc: 'Column and milling head with vertical spindle used for face-group operations (face, end, profile, pocket, surface contouring).', slide: 62, qs: [], explode: [0, 1.5, -2] },
      { id: 'knee', name: 'Knee / support', object: pedestal, desc: 'Knee that supports the table and raises or lowers it (Z motion) to set the depth of cut.', slide: 59, qs: [], explode: [0, -1, 0] },
    ];

    // ---------- state ----------
    let cur = modes[0];
    let t = 0, prog = 0, drop = 0, cutting = true, emitT = 0;
    const tmp = [0, 0], tmp2 = [0, 0];
    let spinSign = 1;

    function apply(m) {
      const peripheral = !m.vertical;
      bed.position.y = m.toolY - m.ref - drop;
      knee.scale.y = Math.max(bed.position.y, 0.05);
      knee.position.y = knee.scale.y / 2;
      if (m.kind === 'step') {
        const f = prog * FMAX;
        m.setF(f);
        bed.position.x = -m.xs + f;
        bed.position.z = 0;
      } else {
        const s = prog * m.path.len;
        m.path.at(s, tmp);
        bed.position.x = -tmp[0];
        bed.position.z = -tmp[1];
        m.path.at(Math.min(s + 0.05, m.path.len), tmp2);
        let dx = tmp2[0] - tmp[0], dz = tmp2[1] - tmp[1];
        if (Math.abs(dx) + Math.abs(dz) < 1e-6) { dx = 1; dz = 0; }
        m.fArrow.rotation.y = Math.atan2(-dz, dx);
        if (m.kind === 'path') {
          const n = m.trail.length;
          const shown = Math.floor(prog * (n - 1));
          for (let i = 0; i < n; i++) m.trail[i].visible = i <= shown;
        } else {
          m.updateHF(tmp[0] + 0.0);
          const y = TIP_Y + (m.surf(tmp[0], tmp[1]) - 0.55);
          m.cutterG.position.y = y;
        }
      }
      void peripheral;
    }

    function setVisible(m) {
      for (const k of modes) {
        const on = k === m;
        k.cutterG.visible = on;
        k.deco.visible = on;
        k.work.visible = on;
      }
      frameH.visible = !m.vertical;
      frameV.visible = m.vertical;
    }

    function reset() {
      t = 0; prog = 0; drop = 0; emitT = 0;
      cs.reset();
      setVisible(cur);
      if (cur.kind === 'contour') cur.updateHF(-99);
      apply(cur);
    }
    reset();

    return {
      root, parts, modes: modes.map(({ id, label, info, slide, qs }) => ({ id, label, info, slide, qs })),
      setMode(id) {
        cur = modes.find((m) => m.id === id) || modes[0];
        reset();
      },
      update(dt) {
        t += dt;
        const u = t % CYCLE;
        cutting = false;
        if (u < T_F) { prog = u / T_F; cutting = true; drop = 0; }
        else if (u < T_F + T_D) { prog = 1; drop = DROP * ease((u - T_F) / T_D); }
        else if (u < T_F + T_D + T_R) { prog = 1 - ease((u - T_F - T_D) / T_R); drop = DROP; }
        else { prog = 0; drop = DROP * (1 - ease((u - T_F - T_D - T_R) / T_U)); }
        if (!cutting && cur.kind === 'contour' && prog === 0) cur.updateHF(-99);
        apply(cur);
        const spin = (cur.vertical ? -1 : 1) * spinSign * t * 8;
        if (cur.vertical) cur.cutterG.rotation.y = spin;
        else cur.cutterG.rotation.z = spin;
        cs.update(dt);
        emitT += dt;
        if (cutting && emitT > 0.12) {
          emitT = 0;
          const a = Math.random() * 6.283;
          const y = (cur.kind === 'step' ? TB + WH : TB + 0.6) + cur.shift + bed.position.y * 0 + 0.1;
          const x = cur.kind === 'step' ? -cur.xs * 0.6 : 0.3;
          cs.emit([x, y, (Math.random() - 0.5) * 1.5], [Math.cos(a) * 1.2 - 0.6, 1.3, Math.sin(a) * 1.0]);
        }
      },
      readout() {
        const out = [['Operation', cur.label], ['Group', cur.vertical ? 'face (vertical spindle)' : 'peripheral (horizontal arbor)']];
        if (!cur.vertical) {
          const D = 2 * cur.R;
          out.push(['Cutter D / depth d', D.toFixed(2) + ' / ' + cur.d.toFixed(2)], ['Approach A = sqrt(d(D-d))', cur.xs.toFixed(3)]);
        }
        out.push(['Status', cutting ? 'cutting' : 'repositioning']);
        return out;
      },
      legend: [['V', 'cutter rotation'], ['f', 'work feed'], ['d', 'depth of cut']],
    };
  },
};
