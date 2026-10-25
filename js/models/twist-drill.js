// Twist drill nomenclature (slides 146-151, Answer Note M).
// Also exports buildTwistDrill(): a reusable, geometrically generated fluted drill / reamer
// (two or more helical flutes swept along the axis, conical point cut by clamping to a cone).
import * as THREE from 'three';
import { M, box, cyl, tube, revolve, extrude, at, rot, group, arrow, spinArrow, textSprite, named, chips } from '../kit.js';

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

// Particle chips (like kit.chips) but dead chips collapse at the origin so the model bbox stays sane.
export function chipSystem(count = 60, mat = M.workCut, size = 1, life0 = 1.2) {
  const geo = new THREE.TorusGeometry(0.035 * size, 0.009 * size, 4, 8, Math.PI * 1.4);
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.frustumCulled = false;
  const pos = Array.from({ length: count }, () => new THREE.Vector3());
  const vel = Array.from({ length: count }, () => new THREE.Vector3());
  const life = new Float32Array(count);
  const rotv = Array.from({ length: count }, () => new THREE.Euler());
  const dummy = new THREE.Object3D();
  let next = 0;
  const kill = (i) => { dummy.position.set(0, 0, 0); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(0); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); };
  const hide = () => { for (let i = 0; i < count; i++) { life[i] = 0; kill(i); } mesh.instanceMatrix.needsUpdate = true; };
  hide();
  return {
    object: mesh,
    emit(p, v, jitter = 0.4) {
      const i = next; next = (next + 1) % count;
      pos[i].set(p[0], p[1], p[2]);
      vel[i].set(v[0] + (Math.random() - 0.5) * jitter, v[1] + Math.random() * 0.3, v[2] + (Math.random() - 0.5) * jitter);
      life[i] = life0;
      rotv[i].set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    },
    update(dt) {
      let any = false;
      for (let i = 0; i < count; i++) {
        if (life[i] <= 0) continue;
        any = true;
        life[i] -= dt;
        if (life[i] <= 0) { kill(i); continue; }
        vel[i].y -= 4 * dt;
        pos[i].addScaledVector(vel[i], dt);
        rotv[i].x += dt * 8; rotv[i].y += dt * 6;
        dummy.position.copy(pos[i]); dummy.rotation.copy(rotv[i]); dummy.scale.setScalar(1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      if (any) mesh.instanceMatrix.needsUpdate = true;
    },
    reset: hide,
  };
}

export function clearGroup(g) {
  for (let i = g.children.length - 1; i >= 0; i--) {
    const c = g.children[i];
    g.remove(c);
    c.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.isSprite && o.material) {
        if (o.material.map) o.material.map.dispose();
        o.material.dispose();
      }
    });
  }
}

// One angular sector of the cross-section: margin, body clearance, then the flute (floor, rake face up to the lip).
function sectorProfile(o) {
  const { n, R, rc, cl, mf, af } = o;
  const S = TAU / n;
  const m = S * mf;
  const a = S * af;
  const pts = []; // [u, r, relief-angle]
  pts.push([0, R, 0]);
  pts.push([m, R, m]);
  pts.push([m + 1e-4, cl * R, m]);
  for (let i = 1; i <= 5; i++) {
    const u = m + ((a - m) * i) / 5;
    pts.push([u, cl * R, Math.min(u, a)]);
  }
  const K = 26;
  const lip = [];
  for (let i = 1; i <= K; i++) {
    const t = i / K;
    const u = a + (S - a) * t;
    let r;
    if (t < 0.5) r = cl * R + (rc - cl * R) * Math.sin((t / 0.5) * Math.PI / 2);
    else if (t < 0.82) r = rc;
    else {
      const s = (t - 0.82) / 0.18;
      r = rc + (R - rc) * (s * s * 0.4 + s * 0.6);
    }
    const dl = a * (1 - t);
    if (i < K) pts.push([u, r, dl]);
    if (t >= 0.82) lip.push([u, r, dl]);
  }
  return { pts, lip, S, m, a };
}

export function sectionPolygon(o) {
  const p = sectorProfile(o);
  const out = [];
  for (let s = 0; s < o.n; s++) for (const [u, r] of p.pts) out.push([r * Math.cos(s * p.S + u), r * Math.sin(s * p.S + u)]);
  return out;
}

export function buildTwistDrill(opt = {}, into = null) {
  const o = {
    R: 0.45, bodyLen: 4, neck: 0.4, shankLen: 2.8, shank: 'taper', helix: 30, n: 2, rcF: 0.21, cl: 0.93,
    mf: 0.26 / Math.PI, af: 0.85 / Math.PI, point: 118, slices: 200, overlays: true, relief: 0.3, neckF: 0.8,
    ...opt,
  };
  const R = o.R;
  o.rc = o.rcF * R;
  const kTip = 1 / Math.tan((o.point * DEG) / 2);
  const tanH = Math.tan(o.helix * DEG);
  const prof = sectorProfile(o);
  const n = o.n;
  const N = prof.pts.length * n;
  const th = new Float32Array(N);
  const rr = new Float32Array(N);
  const dl = new Float32Array(N);
  let q = 0;
  for (let s = 0; s < n; s++) for (const [u, r, d] of prof.pts) { th[q] = s * prof.S + u; rr[q] = r; dl[q] = d; q++; }

  // ---- body geometry
  const slices = o.slices;
  const length = o.bodyLen;
  const verts = (slices + 1) * N + 2;
  const pos = new Float32Array(verts * 3);
  let k = 0;
  for (let i = 0; i <= slices; i++) {
    const s = (length * i) / slices;
    for (let j = 0; j < N; j++) {
      const r = rr[j];
      const yc = kTip * r + o.relief * r * dl[j];
      const y = Math.max(s, yc);
      const ang = th[j] + (y * tanH) / R;
      pos[k++] = r * Math.cos(ang);
      pos[k++] = y;
      pos[k++] = -r * Math.sin(ang);
    }
  }
  const cb = (slices + 1) * N;
  const ct = cb + 1;
  pos[ct * 3 + 1] = length;
  const idx = [];
  for (let i = 0; i < slices; i++) {
    for (let j = 0; j < N; j++) {
      const j2 = (j + 1) % N;
      const a = i * N + j, b = i * N + j2, c = (i + 1) * N + j, d = (i + 1) * N + j2;
      idx.push(a, b, c, b, d, c);
    }
  }
  for (let j = 0; j < N; j++) {
    const j2 = (j + 1) % N;
    idx.push(cb, j2, j); // bottom (cone) faces down
    idx.push(ct, slices * N + j, slices * N + j2); // top faces up
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const bodyMat = M.hss.clone();
  bodyMat.side = THREE.DoubleSide;
  const body = new THREE.Mesh(geo, bodyMat);
  body.castShadow = true;

  const P = (r, t, d) => {
    const y = kTip * r + o.relief * r * d;
    const ang = t + (y * tanH) / R;
    return [r * Math.cos(ang), y, -r * Math.sin(ang)];
  };
  const along = (r, t, y0, y1, cnt = 44) => {
    const out = [];
    for (let i = 0; i <= cnt; i++) {
      const y = y0 + ((y1 - y0) * i) / cnt;
      const ang = t + (y * tanH) / R;
      out.push([r * Math.cos(ang), y, -r * Math.sin(ang)]);
    }
    return out;
  };

  // ---- containers
  const keys = ['shank', 'tang', 'neck', 'body', 'flutes', 'margin', 'clearance', 'web', 'chisel', 'lips', 'point'];
  const c = into ?? Object.fromEntries(keys.map((kk) => [kk, new THREE.Group()]));
  for (const kk of keys) c[kk].name = kk;
  c.body.add(body);

  const yN0 = length, yN1 = length + o.neck;
  if (o.neck > 0) c.neck.add(revolve([[0, yN0], [o.neckF * R, yN0], [o.neckF * R, yN1], [0, yN1]], M.darkSteel, { seg: 40 }));
  let yTop = yN1;
  if (o.shank === 'taper') {
    const r0 = 1.08 * R, r1 = 0.82 * R;
    yTop = yN1 + o.shankLen;
    c.shank.add(revolve([[0, yN1], [o.neckF * R, yN1], [r0 * 0.96, yN1 + 0.06], [r0, yN1 + 0.1], [r1, yTop], [0, yTop]], M.steel, { seg: 40 }));
    if (opt.tang !== false) {
      const th2 = R * 1.1;
      c.tang.add(at(box(r1 * 1.55, th2, r1 * 0.42, M.darkSteel), 0, yTop + th2 / 2, 0));
    }
  } else if (o.shank === 'straight') {
    yTop = yN1 + o.shankLen;
    c.shank.add(revolve([[0, yN1], [R, yN1], [R, yTop - 0.05], [R * 0.9, yTop], [0, yTop]], M.steel, { seg: 40 }));
  }

  if (o.overlays) {
    const rw = R * 0.03;
    const yL0 = kTip * R + 0.03;
    for (let s = 0; s < n; s++) {
      const t0 = s * prof.S;
      c.margin.add(tube(along(R * 1.004, t0 + prof.m * 0.5, yL0, length - 0.02), rw * 1.4, M.brass, { seg: 60, radial: 6 }));
      c.clearance.add(tube(along(o.cl * R, t0 + (prof.m + prof.a) * 0.5, yL0 + 0.1, length - 0.02), rw * 0.8, M.darkSteel, { seg: 60, radial: 6 }));
      c.flutes.add(tube(along(o.rc + 0.012, t0 + prof.a + (prof.S - prof.a) * 0.66, yL0 - 0.1, length - 0.02), rw, M.chrome, { seg: 60, radial: 6 }));
      const lp = prof.lip.map(([u, r, d]) => { const p = P(r, t0 + u, d); const L = Math.hypot(p[0], p[2]); const f = (L + 0.006) / L; return [p[0] * f, p[1] + 0.004, p[2] * f]; });
      c.lips.add(tube(lp, rw * 1.3, M.amber, { seg: 16, radial: 6 }));
    }
    const ia = P(prof.lip[0][1], 0 * prof.S + prof.lip[0][0], prof.lip[0][2]);
    const ib = P(prof.lip[0][1], 1 * prof.S + prof.lip[0][0], prof.lip[0][2]);
    if (n === 2) c.chisel.add(tube([ia, [0, 0.0, 0], ib], rw * 1.5, M.white, { seg: 12, radial: 6 }));
    const ph = kTip * R * 1.06 + 0.04;
    const cone = cyl(0.0001, ph, M.glass, { rTop: R * 1.06, seg: 36 });
    cone.position.y = ph / 2 - 0.02;
    cone.castShadow = false;
    c.point.add(cone);
  }

  const root = into ? null : new THREE.Group();
  if (root) for (const kk of keys) root.add(c[kk]);
  return { c, root, o, length: yTop + (o.shank === 'taper' && opt.tang !== false ? R * 1.1 : 0), prof, kTip, P };
}

const arcPts = (cx, cy, r, a0, a1, cnt = 24) => {
  const out = [];
  for (let i = 0; i <= cnt; i++) {
    const a = a0 + ((a1 - a0) * i) / cnt;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a), 0.02]);
  }
  return out;
};
const line = (a, b, rad = 0.018, mat = M.amber) => tube([a, b], rad, mat, { seg: 2, radial: 6 });
const label = (txt, x, y, z = 0.05, size = 0.3) => at(textSprite(txt, { size }), x, y, z);

export default {
  id: 'twist-drill',
  title: 'Twist drill nomenclature',
  subtitle: 'Shank, body, flutes, margin, web and the point of a two-flute twist drill',
  camera: { position: [9, 6.5, 11], target: [0.9, 3.9, 0] },
  build() {
    const root = new THREE.Group();
    const stand = new THREE.Group();
    stand.add(at(cyl(1.1, 0.12, M.castIron, { seg: 48 }), 0, 0.06, 0));
    stand.add(at(cyl(0.16, 0.05, M.darkSteel, { seg: 24 }), 0, 0.14, 0));
    root.add(stand);

    const wrap = new THREE.Group(); // positions/orients the drill
    root.add(wrap);
    const annot = new THREE.Group();
    root.add(annot);
    const grinder = new THREE.Group();
    grinder.visible = false;
    root.add(grinder);

    // grinder: wheel with flat side face at x = 0 (contact point at CP)
    const CP = [0, 1.35, 0];
    const wheel = new THREE.Group();
    wheel.add(cyl(2.5, 0.7, M.abrasive, { axis: 'x', seg: 56 }));
    wheel.add(cyl(0.5, 0.9, M.darkSteel, { axis: 'x', seg: 24 }));
    wheel.position.set(-0.35, 3.45, 0);
    grinder.add(wheel);
    grinder.add(at(cyl(0.6, 1.4, M.paint, { axis: 'x', seg: 28 }), -1.6, 3.45, 0));
    grinder.add(at(box(1.2, 3.1, 1.0, M.paint), -2.0, 1.55, 0));
    grinder.add(at(box(1.8, 0.2, 1.8, M.castIron), -2.0, 0.1, 0));
    const wheelSpin = spinArrow(0.9, M.vColor, { axis: 'x', arc: Math.PI * 1.4 });
    wheelSpin.position.set(0.25, 3.45, 0);
    grinder.add(wheelSpin);
    const sparks = chipSystem(30, M.amber, 0.7);
    grinder.add(sparks.object);
    const sharpLabels = new THREE.Group();
    grinder.add(sharpLabels);

    // containers: cont = generated drill geometry (spins), extra = fixed inset pieces
    const keys = ['shank', 'tang', 'neck', 'body', 'flutes', 'margin', 'clearance', 'web', 'chisel', 'lips', 'point'];
    const cont = Object.fromEntries(keys.map((k) => [k, new THREE.Group()]));
    const extra = Object.fromEntries(keys.map((k) => [k, new THREE.Group()]));
    const partObj = Object.fromEntries(keys.map((k) => [k, group(cont[k], extra[k])]));
    for (const k of keys) wrap.add(partObj[k]);
    let spinAngle = 0;
    const setSpin = (a) => { spinAngle = a; for (const k of keys) cont[k].rotation.y = a; };

    // textbook cross-section inset (section through the flutes): web, margins, body clearance
    const insetPos = [3.3, 7.0, 0];
    const wrapIn = (obj) => { const w = new THREE.Group(); w.position.set(insetPos[0], insetPos[1] - 0.2, 0); w.scale.setScalar(2.2); w.add(obj); return w; };
    const secO = { n: 2, R: 0.45, rc: 0.21 * 0.45, cl: 0.93, mf: 0.26 / Math.PI, af: 0.85 / Math.PI };
    extra.body.add(wrapIn(extrude(sectionPolygon(secO), 0.04, M.hss, { axis: 'z' })));
    extra.web.add(wrapIn(cyl(secO.rc, 0.07, M.amber, { axis: 'z', seg: 24 })));
    const sp = sectorProfile(secO);
    const mArcs = new THREE.Group();
    const cArcs = new THREE.Group();
    const fArcs = new THREE.Group();
    for (let s = 0; s < 2; s++) {
      const t0 = s * sp.S;
      const ap = (r, a0, a1) => arcPts(0, 0, r, t0 + a0, t0 + a1, 10).map((p) => [p[0], p[1], 0.03]);
      mArcs.add(tube(ap(0.452, 0.01, sp.m), 0.014, M.brass, { seg: 12, radial: 5 }));
      cArcs.add(tube(ap(0.93 * 0.45 + 0.003, sp.m + 0.05, sp.a - 0.05), 0.011, M.darkSteel, { seg: 12, radial: 5 }));
      fArcs.add(tube(ap(0.21 * 0.45 + 0.012, sp.a + (sp.S - sp.a) * 0.52, sp.a + (sp.S - sp.a) * 0.78), 0.011, M.chrome, { seg: 12, radial: 5 }));
    }
    extra.margin.add(wrapIn(mArcs));
    extra.clearance.add(wrapIn(cArcs));
    extra.flutes.add(wrapIn(fArcs));
    const insetLabel = label('Section through the flutes', insetPos[0], insetPos[1] + 1.3, 0.1, 0.26);
    root.add(insetLabel);


    let helix = 30;
    let mode = 'nomenclature';
    let drill = null;
    const base = 0.2;
    const rebuild = () => {
      for (const k of keys) clearGroup(cont[k]);
      drill = buildTwistDrill({ helix, R: 0.45, bodyLen: 4, neck: 0.4, shankLen: 2.8, shank: 'taper' }, cont);
    };
    rebuild();

    // ---- annotation builders
    const addHelix = (deg, txt1, txt2) => {
      const x0 = 2.7, y0 = 1.4, H = 2.4;
      const W = H * Math.tan(deg * DEG);
      annot.add(line([x0, y0, 0], [x0, y0 + H, 0], 0.02, M.steel));
      annot.add(line([x0, y0, 0], [x0 + W, y0 + H, 0], 0.03, M.amber));
      annot.add(line([x0, y0 + H, 0], [x0 + W, y0 + H, 0], 0.018, M.steel));
      annot.add(tube(arcPts(x0, y0, 1.0, Math.PI / 2 - deg * DEG, Math.PI / 2, 16), 0.02, M.amber, { seg: 16, radial: 5 }));
      annot.add(label('axis', x0 - 0.45, y0 + H * 0.5, 0.05, 0.24));
      annot.add(label('π D', x0 + W * 0.5, y0 + H + 0.25, 0.05, 0.24));
      annot.add(label(txt1, x0 + 0.55 + Math.max(W * 0.2, 0.2), y0 + 1.3, 0.05, 0.3));
      annot.add(label(txt2, x0 + 0.3, y0 - 0.35, 0.05, 0.24));
    };
    const addPoint = () => {
      const L = 2.3, h = 59 * DEG;
      const ox = 0, oy = base;
      annot.add(line([ox, oy, 0.02], [-L * Math.sin(h), oy + L * Math.cos(h), 0.02], 0.02));
      annot.add(line([ox, oy, 0.02], [L * Math.sin(h), oy + L * Math.cos(h), 0.02], 0.02));
      annot.add(line([ox, oy, 0.02], [ox, oy + 3.2, 0.02], 0.01, M.steel));
      annot.add(tube(arcPts(ox, oy, 1.7, Math.PI / 2 - h, Math.PI / 2 + h, 30), 0.02, M.amber, { seg: 30, radial: 5 }));
      annot.add(tube(arcPts(ox, oy, 1.1, Math.PI / 2, Math.PI / 2 + h, 14), 0.016, M.amber, { seg: 14, radial: 5 }));
      annot.add(label('118° point angle (2 × 59°)', 0, oy + 2.15, 0.05, 0.3));
      annot.add(label('59°', -0.62, oy + 1.4, 0.05, 0.24));
      // lip clearance schematic (left of the drill)
      const cx = -3.3, cy = 1.0;
      annot.add(line([cx, cy, 0], [cx + 1.9, cy, 0], 0.02, M.steel));
      const ca = 12 * DEG;
      annot.add(line([cx + 1.9, cy, 0], [cx + 1.9 - 1.9 * Math.cos(ca), cy - 1.9 * Math.sin(ca), 0], 0.03, M.amber));
      annot.add(tube(arcPts(cx + 1.9, cy, 1.1, Math.PI, Math.PI + ca, 8), 0.016, M.amber, { seg: 8, radial: 5 }));
      annot.add(label('lip clearance 8–12°', cx + 0.9, cy + 0.42, 0.05, 0.27));
      annot.add(label('flank (heel drops away behind the lip)', cx + 0.5, cy - 0.85, 0.05, 0.2));
    };
    const addSharp = () => {
      // 59° between drill axis and wheel face
      const h = 59 * DEG;
      sharpLabels.add(line([CP[0], CP[1], 0.35], [CP[0], CP[1] + 2.2, 0.35], 0.012, M.steel));
      sharpLabels.add(tube(arcPts(CP[0], CP[1], 1.2, Math.PI / 2 - h, Math.PI / 2, 16).map((p) => [p[0], p[1], 0.35]), 0.02, M.amber, { seg: 16, radial: 5 }));
      sharpLabels.add(label('59° to wheel face', 1.0, CP[1] + 1.55, 0.4, 0.28));
      sharpLabels.add(label('= 118° included point angle', 1.0, CP[1] + 1.15, 0.4, 0.22));
      sharpLabels.add(label('push forward, rotate cw, lower shank', 2.4, CP[1] - 0.75, 0.4, 0.2));
      sharpLabels.add(label('flat wheel face', -0.2, 5.3, 0.4, 0.26));
    };

    const modes = [
      { id: 'nomenclature', label: 'Nomenclature', info: 'Three main components: the shank (clamped to give the drive), the body and the point. The body carries two helical flutes that form the cutting edges, admit coolant and lift the chips out. Narrow margins keep the drill aligned in the hole; the web is the thin core that ends in the chisel edge. At the tip four actions occur: the web makes a small hole (not a normal cut), the rotating lips cut the chips, the helical flutes screw the chips out, and the margins guide the drill.', slide: 146, qs: ['2014-15_6b', '2012-13_6d', '2011-12_6d', '2010-11_6d'] },
      { id: 'angles', label: 'Point & lip angles', info: 'Point angle 118° (2 × 59°) is the general-purpose value: a balance between aggressive cutting and wandering. Harder materials need a larger point angle, softer ones a sharper angle. The lip clearance angle (about 8–12°) supports the cutting edge; too little makes the drill rub and bind, too much weakens the edge and makes it dig in. The right clearance depends on the point angle. The helix angle is shown as the inclination of the flute to the axis.', slide: 151, qs: ['2020-21_2c'] },
      { id: 'helix-high', label: 'High helix (soft)', info: 'The helix (spiral) rate controls how fast chips are removed. A high helix angle, typically 27°–45°, gives a better chip path especially in deep holes and is used for softer, ductile materials.', slide: 150, qs: ['2020-21_2c'] },
      { id: 'helix-low', label: 'Low helix (hard)', info: 'A low helix angle, typically 10°–19°, is best for harder, more brittle materials that produce small, less troublesome chips. The flute is straighter, so the web and cutting edge are stronger.', slide: 150, qs: ['2020-21_2c'] },
      { id: 'sharpening', label: 'Sharpening', info: 'Re-sharpen by grinding only the point (flank) surfaces on a flat, dressed wheel face, never the flutes. Hold the lip horizontal with the drill axis at 59° to the wheel face (118° included angle). Touch the lip, push forward while rotating the drill clockwise and lowering the shank slightly to grind the conical flank with 8–12° lip clearance. Turn the drill exactly 180° and grind the second lip identically. Check lips for equal length and angle, otherwise it cuts oversize and wanders. Thin the web on large drills; cool often.', slide: 151, qs: ['2015-16_3e'] },
    ];

    let t = 0;
    const apply = (id) => {
      mode = id;
      clearGroup(annot);
      clearGroup(sharpLabels);
      grinder.visible = id === 'sharpening';
      stand.visible = id !== 'sharpening';
      helix = id === 'helix-high' ? 36 : id === 'helix-low' ? 15 : 30;
      rebuild();
      setSpin(0);
      for (const k of keys) extra[k].visible = id !== 'sharpening';
      insetLabel.visible = id !== 'sharpening';
      wrap.position.set(0, base, 0);
      wrap.rotation.set(0, 0, 0);
      if (id === 'angles') { addPoint(); addHelix(30, 'helix angle', 'β: flute vs axis'); }
      if (id === 'helix-high') { addHelix(36, 'high helix 27–45°', 'soft materials'); }
      if (id === 'helix-low') { addHelix(15, 'low helix 10–19°', 'hard / brittle'); }
      if (id === 'sharpening') { addSharp(); wrap.position.set(CP[0], CP[1], CP[2]); wrap.rotation.set(0, 0, -59 * DEG); }
      t = 0;
    };
    apply('nomenclature');

    const parts = [
      { id: 'shank', name: 'Shank', object: partObj.shank, desc: 'The portion that is clamped to give the drive. Straight shanks are used up to about 1/2 inch (equal to the body diameter, held in a chuck); above that the shank is tapered (Morse taper) or reduced.', slide: 148, qs: ['2014-15_6b', '2012-13_6d', '2020-21_2c'], explode: [0, 1.2, 0] },
      { id: 'tang', name: 'Tang', object: partObj.tang, desc: 'Flat tongue at the end of a taper shank that fits a slot in the spindle socket; it transmits the drive positively and lets the drill be drifted out.', slide: 152, qs: ['2009-10_7b'], explode: [0, 2.0, 0] },
      { id: 'neck', name: 'Neck', object: partObj.neck, desc: 'Reduced-diameter section between body and shank; gives clearance for the grinding wheel when the flutes are cut and is where the drill size is marked.', slide: 154, qs: ['2016-17_7c'], explode: [0, 0.6, 0] },
      { id: 'body', name: 'Body', object: partObj.body, desc: 'The fluted portion between neck and point. It carries the flutes, margins and the web, and its length sets the depth of hole that can be drilled.', slide: 148, qs: ['2014-15_6b', '2012-13_6d'], anchor: [0.6, 2.4, 0] },
      { id: 'flutes', name: 'Flutes', object: partObj.flutes, desc: 'Helical grooves cut around the body that form the cutting edges, let coolant flow to the cutting edge and let chips be withdrawn by screw action.', slide: 148, qs: ['2014-15_6b', '2012-13_6d', '2011-12_6d'], anchor: [0.2, 3.2, 0.5] },
      { id: 'margin', name: 'Margin (land)', object: partObj.margin, desc: 'Narrow raised section of the body that gives full body-to-hole support and keeps the drill aligned and guided as it drills.', slide: 149, qs: ['2014-15_6b', '2020-21_2c'], anchor: [0.5, 1.4, 0.2] },
      { id: 'body-clearance', name: 'Body clearance', object: partObj.clearance, desc: 'Slightly reduced diameter between the flutes and the margin. It reduces friction between drill and workpiece (only the narrow margin rubs on the hole wall), which means less heat and torque.', slide: 149, qs: ['2020-21_2c', '2015-16_3d'], anchor: [0.4, 2.0, 0.3] },
      { id: 'web', name: 'Web', object: partObj.web, desc: 'Thin central core of the drill between the flutes; it thickens towards the shank for strength, and forms the chisel edge at the point. A small hole is formed by the web: chips are not cut here in the normal sense.', slide: 149, qs: ['2020-21_2c', '2014-15_6b'], anchor: [3.3, 7.2, 0.1] },
      { id: 'chisel-edge', name: 'Chisel edge', object: partObj.chisel, desc: 'Edge across the web at the very tip where the two flank surfaces meet. It does not cut but scrapes and extrudes the metal, so it needs high thrust; large drills are web-thinned.', slide: 150, qs: ['2011-12_6d', '2010-11_6d'], anchor: [0, 0.2, 0.2] },
      { id: 'lips', name: 'Lips (cutting edges)', object: partObj.lips, desc: 'The two main cutting edges where each flute face meets the conical flank; they cut the chips as the drill rotates. Cutting speed is zero at the centre and maximum at the lip corner. Lips must be equal in length and angle.', slide: 150, qs: ['2011-12_6d', '2010-11_6d'], anchor: [0.4, 0.5, 0.3] },
      { id: 'point', name: 'Point', object: partObj.point, desc: 'The conical cutting end. General-purpose point angle is 118° included (59° each side); harder materials use a larger angle, softer a sharper one. The lip clearance angle (8–12°) gives support to the edge.', slide: 151, qs: ['2020-21_2c', '2015-16_3e'], anchor: [0.7, 0.5, 0.3] },
    ];

    return {
      root,
      parts,
      modes,
      setMode: apply,
      legend: [['V', 'rotation / cutting motion'], ['f', 'feed along axis']],
      update(dt) {
        t += dt;
        if (mode === 'nomenclature' || mode === 'helix-high' || mode === 'helix-low') {
          setSpin(spinAngle - dt * 0.5);
        } else if (mode === 'sharpening') {
          const s = Math.sin(t * 1.6);
          const push = 0.12 * (0.5 + 0.5 * s);
          wrap.position.set(CP[0] + 0.857 * push, CP[1] + 0.515 * push, CP[2]);
          wrap.rotation.z = -59 * DEG + 0.09 * s; // lowering / raising the shank
          setSpin(-0.6 * (0.5 + 0.5 * s));
          if (((t * 24) | 0) % 2 === 0) sparks.emit([0.05, CP[1], 0.05], [1.2, 1.0, (Math.random() - 0.5) * 1.4]);
          sparks.update(dt);
        }
      },
      readout() {
        return [
          ['Point angle', '118° (2 × 59°)'],
          ['Helix angle', helix + '°'],
          ['Lip clearance', '8–12°'],
        ];
      },
    };
  },
};
