import * as THREE from 'three';
import { M, box, cyl, extrude, revolve, tube, at, group, spinArrow } from '../kit.js';

// Lathe work-holding devices (Answer Note F). Spindle axis along x at height AX; spindle nose at x = 0.
const AX = 1.6;
const sm = (u) => u * u * (3 - 2 * u);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const lerp = (a, b, t) => a + (b - a) * t;
const QS = ['2021-22_1b', '2013-14_5a', '2009-10_5a'];

const sphere = (r, mat) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), mat);
  m.castShadow = true;
  return m;
};
const cylX = (r, len, mat, x, y = 0, z = 0, o = {}) => at(cyl(r, len, mat, { axis: 'x', ...o }), x, y, z);
const radialAt = (obj, a, pr, x) => {
  obj.position.set(x, Math.sin(a) * pr, Math.cos(a) * pr);
  obj.rotation.x = Math.PI / 2 - a; // local +y points radially outward
};

// Three-jaw chuck (scroll driven). Returns spin group + setPr(pr).
function chuck3(bodyR, len, jawAngle0 = Math.PI / 2, n = 3) {
  const spin = new THREE.Group();
  spin.add(cylX(bodyR, len, M.darkSteel, len / 2, 0, 0, { seg: 48 }));
  spin.add(cylX(bodyR * 0.8, 0.05, M.steel, len + 0.02, 0, 0, { seg: 40 }));
  const jaws = [];
  for (let k = 0; k < n; k++) {
    const a = jawAngle0 + (k / n) * Math.PI * 2;
    const jg = group(box(0.6, 0.5, 0.34, M.steel), at(box(0.25, 0.18, 0.34, M.hss), -0.1, -0.17, 0));
    jg.userData.a = a;
    spin.add(jg);
    jaws.push(jg);
    const slot = box(0.05, bodyR * 1.0, 0.16, M.black);
    radialAt(slot, a, bodyR * 0.55, len + 0.05);
    spin.add(slot);
    const sock = cyl(0.06, 0.06, M.black, { seg: 8 });
    radialAt(sock, a, bodyR, len * 0.5);
    spin.add(sock);
  }
  // scroll disc (spiral groove)
  const pts = [];
  for (let i = 0; i <= 90; i++) {
    const t = i / 90;
    const ang = t * Math.PI * 2 * 3;
    const r = lerp(0.12, bodyR * 0.8, t);
    pts.push([len + 0.07, Math.sin(ang) * r, Math.cos(ang) * r]);
  }
  const scroll = tube(pts, 0.018, M.brass, { seg: 90, radial: 3 });
  scroll.castShadow = false;
  const scrollG = group(scroll);
  spin.add(scrollG);
  const key = group(at(cyl(0.04, 0.5, M.chrome, { seg: 8 }), 0, 0.25, 0), at(cyl(0.03, 0.5, M.black, { axis: 'z', seg: 8 }), 0, 0.5, 0));
  const keyHolder = new THREE.Group();
  keyHolder.add(key);
  radialAt(keyHolder, jawAngle0 + Math.PI / 3, bodyR + 0.0, len * 0.5);
  spin.add(keyHolder);
  const jawX = len + 0.35;
  return {
    spin, jaws, key, keyHolder, jawX,
    setPr(pr, wind) {
      for (const j of jaws) radialAt(j, j.userData.a, pr, jawX);
      scrollG.rotation.x = (pr - 0.6) * 9;
      if (wind !== undefined) key.rotation.y = wind;
    },
  };
}

function bedAndHead(root) {
  root.add(at(box(10, 0.3, 2.2, M.paint), 2.6, 0.15, 0));
  for (const z of [-0.6, 0.6]) root.add(at(box(10, 0.05, 0.3, M.darkSteel), 2.6, 0.325, z));
  root.add(at(box(1.6, 2.4, 1.8, M.paint), -1.5, 1.5, 0));
  root.add(cylX(0.5, 0.7, M.chrome, -0.35, AX, 0));
}

function tailstockAt(x, quillFront, withCentre = true) {
  const g = new THREE.Group();
  g.add(at(box(1.7, 0.3, 1.5, M.paintDark), x, 0.45, 0), at(box(1.3, 1.7, 1.1, M.paint), x, 1.35, 0), cylX(0.5, 1.3, M.paint, x, AX, 0));
  const ql = x - 0.65 - quillFront;
  g.add(cylX(0.2, ql, M.chrome, quillFront + ql / 2, AX, 0));
  if (withCentre) g.add(cylX(0.02, 0.35, M.hss, quillFront - 0.17, AX, 0, { rTop: 0.12 }));
  g.add(cylX(0.04, 0.3, M.chrome, x + 0.8, AX, 0), at(sphere(0.07, M.black), x + 1.0, AX + 0.35, 0));
  return g;
}

// ---------------- scenes ----------------
function sceneThreeJaw() {
  const root = new THREE.Group();
  const dev = new THREE.Group();
  dev.position.set(0, AX, 0);
  const c = chuck3(1.25, 0.6);
  dev.add(c.spin);
  dev.add(cylX(0.4, 2.8, M.work, 0.7 + 1.4, 0, 0));
  root.add(dev);
  return {
    root, dev,
    update(cl, theta) {
      c.setPr(lerp(1.0, 0.65, cl), cl * 10);
      c.keyHolder.visible = cl < 0.97;
      dev.rotation.x = theta;
    },
  };
}

function sceneFourJaw() {
  const root = new THREE.Group();
  const dev = new THREE.Group();
  dev.position.set(0, AX, 0);
  const spin = new THREE.Group();
  dev.add(spin);
  spin.add(cylX(1.4, 0.7, M.darkSteel, 0.35, 0, 0, { seg: 48 }), cylX(1.15, 0.05, M.steel, 0.72, 0, 0, { seg: 40 }));
  const OY = 0.14, OZ = -0.1, H = 0.4;
  const jaws = [], screws = [];
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
    const jg = group(box(0.7, 0.55, 0.4, M.steel), at(box(0.3, 0.2, 0.4, M.hss), -0.1, -0.2, 0));
    jg.userData.a = a;
    jg.userData.d = H + OY * Math.sin(a) + OZ * Math.cos(a);
    spin.add(jg);
    jaws.push(jg);
    const slot = box(0.05, 1.3, 0.2, M.black);
    radialAt(slot, a, 0.7, 0.75);
    spin.add(slot);
    const sc = cyl(0.05, 1.0, M.chrome, { seg: 8 });
    radialAt(sc, a, 0.75, 0.62);
    spin.add(sc);
    const sq = box(0.14, 0.14, 0.14, M.black);
    radialAt(sq, a, 1.42, 0.35);
    spin.add(sq);
    screws.push(sc);
  }
  const work = box(2.4, 0.8, 0.8, M.work);
  work.position.set(0.8 + 1.2, OY, OZ);
  spin.add(work);
  // dial indicator on the bed (static)
  const dial = new THREE.Group();
  dial.add(at(box(0.5, 0.4, 0.5, M.black), 0, 0.5, 0), at(cyl(0.06, 1.7, M.chrome, { seg: 8 }), 0, 1.3, 0));
  const head = group(cyl(0.3, 0.12, M.white, { axis: 'z' }), at(cyl(0.34, 0.06, M.darkSteel, { axis: 'z' }), 0, 0, -0.06));
  head.position.set(0, 2.0, 1.2);
  const needle = box(0.24, 0.02, 0.02, M.red);
  needle.position.set(0.0, 0, 0.08);
  head.add(needle);
  const arm = box(0.04, 0.04, 0.9, M.steel);
  arm.position.set(0, 2.0, 0.75);
  dial.add(head, arm);
  dial.position.set(2.2, 0, 1.3);
  const stylus = at(cyl(0.02, 0.5, M.steel, { seg: 6 }), 2.2, 1.75, 0.55);
  root.add(dev, dial, stylus);
  dial.position.set(2.2, 0, 1.0);
  dial.children[0].position.set(0, 0.5, 0);
  return {
    root, dev,
    update(cl, theta) {
      const cc = cl;
      for (let k = 0; k < 4; k++) {
        const ck = sm(clamp01((cc * 1.4 - k * 0.2) / 0.5));
        const j = jaws[k];
        radialAt(j, j.userData.a, lerp(1.1, j.userData.d + 0.275, ck), 1.05);
      }
      spin.rotation.x = theta;
      needle.rotation.z = Math.sin(theta * 1.0) * 0.9 * (cl > 0.95 ? 1 : 0.2);
    },
  };
}

function sceneCollet() {
  const root = new THREE.Group();
  const dev = new THREE.Group();
  dev.position.set(0, AX, 0);
  const spin = new THREE.Group();
  dev.add(spin);
  spin.add(cylX(0.8, 1.0, M.darkSteel, 0.5, 0, 0, { seg: 40 }), cylX(0.95, 0.5, M.paintDark, 1.0, 0, 0, { seg: 40 }));
  spin.add(cylX(0.6, 0.12, M.steel, 1.3, 0, 0, { seg: 40 }));
  const draw = group(cylX(0.12, 1.8, M.chrome, -0.5, 0, 0), cylX(0.2, 0.15, M.steel, 0.5, 0, 0));
  dev.add(draw);
  const fingers = [];
  const n = 6;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const f = box(0.95, 0.18, 0.3, M.brass);
    f.userData.a = a;
    spin.add(f);
    fingers.push(f);
  }
  spin.add(cylX(0.25, 3.0, M.work, 0.3 + 1.5 + 0.2, 0, 0));
  root.add(dev);
  return {
    root, dev,
    update(cl, theta) {
      const pr = lerp(0.46, 0.34, cl);
      for (const f of fingers) {
        radialAt(f, f.userData.a, pr, 1.0);
        f.rotation.z = (1 - cl) * 0.12 * 0 + 0;
      }
      draw.position.x = -0.15 * cl;
      spin.rotation.x = theta;
      draw.rotation.x = theta;
    },
  };
}

function centresRig(variant) {
  const root = new THREE.Group();
  const dev = new THREE.Group();
  root.add(dev);
  const spinG = new THREE.Group();
  spinG.position.set(0, AX, 0);
  dev.add(spinG);
  // driving plate and live centre
  spinG.add(cylX(0.9, 0.15, M.darkSteel, 0.075, 0, 0, { seg: 40 }));
  spinG.add(cylX(0.02, 0.4, M.hss, 0.3, 0, 0, { rTop: 0.12 }));
  const pin = cylX(0.07, 0.6, M.steel, 0.4, 0.78, 0);
  spinG.add(pin);
  // work
  const L = 3.0;
  if (variant === 'mandrel') {
    spinG.add(cylX(0.3, L + 0.3, M.steel, 0.6 + L / 2, 0, 0, { rTop: 0.28 }));
    const ring = revolve([[0.3, -0.45], [0.85, -0.45], [0.85, 0.45], [0.3, 0.45]], M.work, { axis: 'x', seg: 48 });
    ring.position.set(1.9, 0, 0);
    const ringBore = revolve([[0.3, -0.45], [0.3, 0.45]], M.darkSteel, { axis: 'x', seg: 40 });
    ringBore.position.set(1.9, 0, 0);
    spinG.add(ring);
  } else {
    spinG.add(cylX(0.32, L, M.work, 0.5 + L / 2, 0, 0));
  }
  // lathe dog
  const dogRing = revolve([[0.3, -0.18], [0.45, -0.18], [0.45, 0.18], [0.3, 0.18]], M.red, { axis: 'x', seg: 24 });
  dogRing.position.set(0.65, 0, 0);
  const tail = box(0.14, 0.45, 0.16, M.red);
  tail.position.set(0.65, 0.65, 0);
  spinG.add(dogRing, tail, at(box(0.14, 0.1, 0.14, M.black), 0.65, 0.4, 0.3), at(sphere(0.07, M.black), 0.65, 0.2, 0.46));
  // tailstock with dead centre (static)
  dev.add(tailstockAt(5.0, 3.6 + (variant === 'mandrel' ? 0.0 : 0)));
  return {
    root, dev,
    update(cl, theta) { spinG.rotation.x = theta; },
  };
}

function sceneFacePlate() {
  const root = new THREE.Group();
  const dev = new THREE.Group();
  dev.position.set(0, AX, 0);
  const spin = new THREE.Group();
  dev.add(spin);
  spin.add(cylX(1.5, 0.18, M.castIron, 0.09, 0, 0, { seg: 56 }));
  spin.add(cylX(0.35, 0.3, M.darkSteel, 0.15, 0, 0, { seg: 24 }));
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    const s = box(0.04, 1.0, 0.1, M.black);
    radialAt(s, a, 0.9, 0.19);
    spin.add(s);
  }
  // irregular casting (bracket) bolted off-centre
  const shape = [[-0.7, -0.5], [0.5, -0.5], [0.8, -0.1], [0.5, 0.2], [0.55, 0.7], [-0.2, 0.7], [-0.2, 0.3], [-0.7, 0.3]];
  const hole = [];
  for (let i = 0; i < 20; i++) { const a = -(i / 20) * Math.PI * 2; hole.push([0.15 + Math.cos(a) * 0.2, -0.1 + Math.sin(a) * 0.2]); }
  const cast = extrude(shape, 0.6, M.castIron, { holes: [hole], axis: 'x' });
  cast.position.set(0.18 + 0.3, -0.05, 0.45);
  cast.scale.set(1, 1, 1);
  spin.add(cast);
  const castHl = cast.clone();
  castHl.material = M.paintLight;
  castHl.scale.set(1, 0.97, 0.97);
  castHl.visible = false;
  spin.add(castHl);
  // clamps and bolts
  for (const [y, z] of [[0.55, 0.0], [-0.45, 1.0], [0.4, 1.15]]) {
    const strap = box(0.7, 0.06, 0.16, M.steel);
    strap.position.set(0.18 + 0.65, y, z);
    strap.rotation.x = 0;
    spin.add(strap);
    spin.add(cylX(0.05, 0.5, M.chrome, 0.18 + 0.45, y, z), at(sphere(0.09, M.black), 0.18 + 0.78, y, z));
  }
  // counterweight on the opposite side
  spin.add(at(box(0.5, 0.45, 0.35, M.black), 0.18 + 0.25, 0.1, -1.0), cylX(0.05, 0.4, M.chrome, 0.18 + 0.1, 0.1, -1.0));
  spin.add(at(box(0.5, 0.45, 0.35, M.black), 0.18 + 0.25, -0.45, -1.15));
  root.add(dev);
  return { root, dev, update(cl, theta) { spin.rotation.x = theta; } };
}

function sceneSteady() {
  const root = new THREE.Group();
  const dev = new THREE.Group();
  root.add(dev);
  // chuck with slender work
  const c = chuck3(1.0, 0.5);
  const cg = new THREE.Group();
  cg.position.set(0, AX, 0);
  cg.add(c.spin);
  c.setPr(0.47);
  c.keyHolder.visible = false;
  dev.add(cg);
  const spin = new THREE.Group();
  spin.position.set(0, AX, 0);
  const rawW = cyl(0.22, 1, M.work, { axis: 'x' });
  const cutW = cyl(0.18, 1, M.workCut, { axis: 'x' });
  spin.add(rawW, cutW);
  dev.add(spin);
  dev.add(tailstockAt(6.6, 5.1));
  // steady rest on the bed at x = 1.6
  const SX = 1.7;
  const steady = new THREE.Group();
  steady.add(at(box(1.2, 0.3, 1.5, M.paintDark), SX, 0.45, 0));
  const arch = (a0, a1, mat) => {
    const pts = [];
    const n = 20;
    for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); pts.push([Math.cos(a) * 1.0, Math.sin(a) * 1.0]); }
    for (let i = n; i >= 0; i--) { const a = lerp(a0, a1, i / n); pts.push([Math.cos(a) * 0.72, Math.sin(a) * 0.72]); }
    const m = extrude(pts, 0.4, mat, { axis: 'x' });
    return m;
  };
  const lower = arch(Math.PI, Math.PI * 2, M.paint);
  lower.position.set(SX, AX, 0);
  const upper = arch(0, Math.PI, M.paintLight);
  upper.position.set(SX, AX + 0.04, 0);
  steady.add(lower, upper);
  steady.add(at(sphere(0.07, M.black), SX, AX + 1.02, 0.5));
  for (const ang of [Math.PI / 2, Math.PI / 2 + (Math.PI * 2) / 3, Math.PI / 2 + (Math.PI * 4) / 3]) {
    // finger: rod from ring to work + roller tip
    const len = 0.72 - 0.22 - 0.05;
    const rod = cyl(0.05, len + 0.3, M.chrome, { seg: 8 });
    rod.position.set(SX, AX + Math.sin(ang) * ((0.22 + 0.05 + 0.72 + 0.3) / 2 + 0.0 - 0.15 + 0.15), Math.cos(ang) * ((0.22 + 0.05 + 0.72 + 0.3) / 2 - 0.0));
    rod.rotation.x = Math.PI / 2 - ang;
    const rr = (0.22 + 0.05 + 0.72 + 0.3) / 2;
    rod.position.set(SX, AX + Math.sin(ang) * (0.27 + (len + 0.3) / 2 - 0.0), Math.cos(ang) * (0.27 + (len + 0.3) / 2));
    void rr;
    const tip = cylX(0.07, 0.12, M.brass, SX, AX + Math.sin(ang) * 0.29, Math.cos(ang) * 0.29);
    const knob = sphere(0.08, M.black);
    knob.position.set(SX, AX + Math.sin(ang) * (0.27 + len + 0.35), Math.cos(ang) * (0.27 + len + 0.35));
    steady.add(rod, tip, knob);
  }
  dev.add(steady);
  // carriage with tool and follower rest
  const carr = new THREE.Group();
  carr.add(at(box(1.4, 0.3, 1.8, M.paint), 0, 0.45, 0), at(box(1.0, 0.18, 1.6, M.paintDark), 0, 0.69, 0.4));
  carr.add(at(box(0.6, 0.5, 0.6, M.darkSteel), 0, 1.0, 1.0));
  const toolBar = box(0.12, 0.12, 1.0, M.hss);
  toolBar.position.set(0, AX - 0.06, 0.7);
  const toolG = group(toolBar);
  carr.add(toolG);
  // follower rest: bracket with two fingers (top and back), trailing behind the tool
  const fol = new THREE.Group();
  fol.add(at(box(0.5, 0.35, 0.5, M.paintDark), 0.55, 0.9, 0.55));
  fol.add(at(box(0.3, 0.9, 0.3, M.paint), 0.55, 1.2, 0.55));
  fol.add(at(box(0.3, 0.3, 0.8, M.paint), 0.55, 2.0, 0.2));
  fol.add(at(cyl(0.05, 0.7, M.chrome, { seg: 8 }), 0.55, AX + 0.4, 0.0)); // top finger
  fol.add(cylX(0.07, 0.12, M.brass, 0.55, AX + 0.2, 0.0));
  fol.add(at(sphere(0.07, M.black), 0.55, AX + 0.78, 0.0));
  fol.add(at(cyl(0.05, 0.7, M.chrome, { seg: 8, axis: 'z' }), 0.55, AX, -0.4)); // back finger
  fol.add(cylX(0.07, 0.12, M.brass, 0.55, AX, -0.2));
  fol.add(at(sphere(0.07, M.black), 0.55, AX, -0.78));
  fol.add(at(box(0.3, 0.3, 0.3, M.paint), 0.55, AX, -0.9));
  carr.add(fol);
  dev.add(carr);
  const X_A = 5.0, X_B = 2.8, T_C = 7, T_R = 1.6;
  let ph = 0;
  const state = { xT: X_A, z: 0 };
  function pose() {
    let x = X_A, off = 0.5;
    if (ph < 0.6) { off = lerp(0.5, 0, sm(ph / 0.6)); }
    else if (ph < 0.6 + T_C) { x = lerp(X_A, X_B, (ph - 0.6) / T_C); off = 0; }
    else if (ph < 0.6 + T_C + 0.5) { x = X_B; off = lerp(0, 0.5, sm((ph - 0.6 - T_C) / 0.5)); }
    else { const u = sm((ph - 0.6 - T_C - 0.5) / T_R); x = lerp(X_B, X_A, clamp01(u)); off = 0.5; }
    state.xT = x; state.z = off;
  }
  const total = 0.6 + T_C + 0.5 + T_R + 0.4;
  const X0w = 0.5, X1w = 6.3;
  return {
    root, dev,
    update(cl, theta, dt) {
      ph += dt;
      if (ph >= total) ph -= total;
      pose();
      carr.position.set(state.xT, 0, 0);
      toolG.position.z = state.z - 0.0;
      carr.children[1].position.z = 0.4 + state.z;
      carr.children[2].position.z = 1.0 + state.z;
      const cutX = ph < 0.6 ? X_A : (ph < 0.6 + T_C + 0.5 ? state.xT : X_B);
      const resetCut = ph < 0.6;
      const xc = resetCut ? X1w : Math.min(Math.max(cutX, X0w), X1w);
      const rawLen = Math.max(xc - X0w, 0.001), cutLen = Math.max(X1w - xc, 0.001);
      rawW.scale.x = rawLen; rawW.position.x = X0w + rawLen / 2;
      cutW.scale.x = cutLen; cutW.position.x = xc + cutLen / 2;
      spin.rotation.x = theta;
      cg.rotation.x = theta;
    },
  };
}

// ---------------- module ----------------
const DEFS = [
  { id: 'three-jaw', label: 'Three-jaw chuck', build: sceneThreeJaw, slide: 40, name: 'Three-jaw (self-centring) chuck',
    desc: 'The jaws move together through a scroll, so round and hexagonal bars are centred quickly (accuracy about 0.05 mm). Turning the key rotates the scroll and all three jaws close at the same time.' },
  { id: 'four-jaw', label: 'Four-jaw chuck', build: sceneFourJaw, slide: 40, name: 'Four-jaw (independent) chuck',
    desc: 'Each jaw has its own screw and moves independently. It holds square, rectangular and irregular jobs with a strong grip, and off-centre work for eccentric turning; set-up is slower (use a dial gauge).' },
  { id: 'collet', label: 'Collet chuck', build: sceneCollet, slide: 40, name: 'Collet chuck',
    desc: 'A split spring sleeve (collet) is closed on the bar by a draw bar. Used for small, accurate bar stock in high-speed production, with high concentricity.' },
  { id: 'centres-dog', label: 'Centres + driving plate and dog', build: () => centresRig('shaft'), slide: 40, name: 'Centres, driving plate and lathe dog',
    desc: 'The job is held between the live (headstock) and dead (tailstock) centres in centre-drilled holes - for long shafts, and the job can be removed and replaced accurately. The driving (catch) plate pushes the lathe dog (carrier) to transmit rotation.' },
  { id: 'face-plate', label: 'Face plate', build: sceneFacePlate, slide: 40, name: 'Face plate',
    desc: 'A large slotted plate on the spindle. Irregular castings are bolted to it with clamps, bolts in the T-slots, angle plates and a counterweight to balance the rotating mass.' },
  { id: 'mandrel', label: 'Mandrel', build: () => centresRig('mandrel'), slide: 40, name: 'Mandrel',
    desc: 'A hardened, slightly tapered shaft pressed into a bored job so that the outside can be turned concentric with the bore. The mandrel is then mounted between centres and driven by a dog.' },
  { id: 'steady-rest', label: 'Steady rest + follower rest', build: sceneSteady, slide: 40, name: 'Steady rest and follower rest',
    desc: 'The steady rest is fixed on the bed and supports a long, slender job at a point along its length; the follower rest is fixed to the carriage and moves with the tool. Both prevent deflection and chatter.' },
];

export default {
  id: 'work-holding',
  title: 'Lathe work-holding',
  subtitle: 'Chucks, centres, face plate, mandrel and work supports',
  camera: { position: [3.2, 4.8, 12.5], target: [2.6, 1.3, 0] },
  build() {
    const root = new THREE.Group();
    bedAndHead(root);
    const parts = [];
    const scenes = {};
    for (const d of DEFS) {
      const s = d.build();
      s.root.visible = false;
      root.add(s.root);
      scenes[d.id] = s;
      parts.push({ id: d.id, name: d.name, object: s.dev, desc: d.desc, slide: d.slide, qs: QS, explode: [d.id === 'centres-dog' || d.id === 'mandrel' || d.id === 'steady-rest' ? 0 : 0, 1.2, 1.2] });
    }
    const vA = spinArrow(1.0, M.vColor, { axis: 'x', arc: Math.PI * 1.5, tube: 0.035 });
    vA.position.set(-0.8, AX, 0);
    root.add(vA);

    const modes = DEFS.map((d) => ({ id: d.id, label: d.label, info: d.desc, slide: d.slide, qs: QS }));
    let cur = 'three-jaw';
    let t = 0, theta = 0, closed = 0;
    const CYC = 8;
    const closedAt = (tt) => {
      if (tt < 2.2) return sm(tt / 2.2);
      if (tt < 6) return 1;
      if (tt < 7.5) return 1 - sm((tt - 6) / 1.5);
      return 0;
    };
    function setModeInternal(id) {
      cur = id;
      for (const k in scenes) scenes[k].root.visible = k === id;
      t = 0; theta = 0; closed = 0;
      scenes[id].update(0, 0, 0, 0);
    }
    setModeInternal('three-jaw');

    return {
      root, parts, modes,
      setMode(id) { if (scenes[id]) setModeInternal(id); },
      update(dt) {
        t = (t + dt) % CYC;
        closed = closedAt(t);
        const fixed = cur === 'centres-dog' || cur === 'mandrel' || cur === 'face-plate' || cur === 'steady-rest';
        if (fixed) closed = 1;
        theta += (fixed ? 6 : 6 * closed) * dt;
        scenes[cur].update(closed, theta, dt, t);
      },
      readout() {
        const d = DEFS.find((x) => x.id === cur);
        const rows = [['Device', d.name]];
        if (cur === 'three-jaw') rows.push(['Jaws', 'move together (scroll)'], ['Clamp', `${(closed * 100).toFixed(0)} %`], ['Accuracy', '~0.05 mm']);
        else if (cur === 'four-jaw') rows.push(['Jaws', 'independent'], ['Clamp', `${(closed * 100).toFixed(0)} %`], ['Work', 'square / eccentric']);
        else if (cur === 'collet') rows.push(['Clamp', `${(closed * 100).toFixed(0)} %`], ['Work', 'small bar stock']);
        else if (cur === 'centres-dog') rows.push(['Support', 'live + dead centre'], ['Drive', 'plate + dog']);
        else if (cur === 'face-plate') rows.push(['Work', 'irregular casting'], ['Balance', 'counterweight']);
        else if (cur === 'mandrel') rows.push(['Work', 'bored ring on mandrel'], ['Drive', 'plate + dog']);
        else rows.push(['Steady rest', 'fixed on bed'], ['Follower rest', 'moves with carriage']);
        return rows;
      },
      legend: [['V', 'work rotation']],
    };
  },
};
