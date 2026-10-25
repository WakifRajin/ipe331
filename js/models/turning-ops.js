import * as THREE from 'three';
import { M, box, cyl, extrude, tube, at, group, arrow, spinArrow, chips } from '../kit.js';

// Close-up of a lathe set-up. The workpiece is a LatheGeometry rebuilt (<= ~15 Hz) from a radius profile that the
// tool cuts away progressively. 1 world unit = 100 mm in the read-outs (cut depths are drawn exaggerated).
const AX = 1.6;          // axis height
const R0 = 0.5;          // blank radius
const XA = -2.3;         // blank start (inside jaws)
const X0 = 2.4;          // free end of blank
const N = 160;           // profile samples along x
const DX = (X0 - XA) / N;
const SEG = 36;

const RPM = 300;         // sample spindle speed for read-outs
const D_MM = 100;        // sample diameter (2 * R0 * 100 mm/unit)
const vOf = (d, n = RPM) => (Math.PI * d * n) / 1000;
const sm = (u) => u * u * (3 - 2 * u);
const lerp = (a, b, t) => a + (b - a) * t;

const sphere = (r, mat) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat);
  m.castShadow = true;
  return m;
};

// Tool blade from an outline in (x, zRel): tip at the origin, +zRel points away from the work axis. Thickness in y.
function blade(poly, mat = M.hss, thick = 0.14) {
  const m = extrude(poly, thick, mat);
  const g = new THREE.Group();
  g.add(m);
  g.rotation.x = Math.PI / 2; // (x, y, z) -> (x, -z, y): outline y becomes +z
  return g;
}

function helixPoints(x0, x1, pitch, r, perTurn = 10) {
  const turns = Math.abs(x1 - x0) / pitch;
  const n = Math.max(8, Math.round(turns * perTurn));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const x = lerp(x0, x1, i / n);
    const a = (Math.abs(x - x0) / pitch) * Math.PI * 2;
    pts.push([x, Math.sin(a) * r, Math.cos(a) * r]);
  }
  return { pts, n };
}

const MODE_INFO = {
  'straight-turning': 'Straight (cylindrical) turning: the tool is fed along a straight line parallel to the axis of rotation, reducing the diameter. Directions: V is the work rotation, f is the tool travel parallel to the axis (towards the headstock), d is the radial depth (diameter reduced by 2d).',
  facing: 'Facing: the tool is fed radially into the rotating work at one end to create a flat surface on the end. Directions: V is the work rotation, f is the radial cross feed towards the centre, d is the axial depth removed from the end. Cutting speed falls to zero at the centre.',
  'taper-turning': 'Taper turning: instead of feeding the tool parallel to the axis, the tool is fed at an angle to it, creating a conical (tapered) surface. tan(alpha) = (D - d)/(2l). Here the compound rest / attachment moves the tool along the inclined line.',
  'contour-turning': 'Contour turning: instead of feeding the tool along a straight line, the tool follows a contour that is other than straight, creating a contoured form on the turned part. Longitudinal and cross feeds are combined (hand, tracer or CNC).',
  'form-turning': 'Form turning (forming): the tool has a shape that is imparted to the work by plunging the tool radially into it. The profile of the tool is copied onto the work; there is no feed along the axis. Directions: V rotation, f radial plunge.',
  chamfering: 'Chamfering: the cutting edge of the tool is used to cut an angle on the corner of the cylinder, forming a chamfer. The tool is moved at 45 degrees to the axis; the 45-degree edge copies the chamfer.',
  parting: 'Cut-off (parting): the tool is fed radially into the rotating work at some location along its length to cut off the end of the part. A thin blade plunges to the centre and the end drops off.',
  drilling: 'Drilling: performed on a lathe by feeding the drill into the rotating work along its axis, usually from the tailstock (drill chuck or Morse taper). Centring should be done before drilling; reaming is performed in a similar way. The drill does not rotate: the work does.',
  boring: 'Boring: a single-point tool is fed linearly, parallel to the axis of rotation, on the inside diameter of an existing hole in the part. It enlarges the hole; turning does the same on the outside. Directions: f axial, d radially outward.',
  threading: 'Threading: a pointed tool is fed linearly across the outside surface of the rotating workpart in a direction parallel to the axis of rotation at a large effective feed rate (the pitch per revolution), creating threads in the cylinder. Threading can be external or internal.',
  knurling: 'Knurling is not a machining operation because it does not involve cutting of material. It is a metal forming operation: hardened rolls pressed into the surface produce a regular cross-hatched pattern on the work.',
};

export default {
  id: 'turning-ops',
  title: 'Turning operations',
  subtitle: 'Straight, facing, taper, contour, form, chamfer, parting, drilling, boring, threading, knurling',
  camera: { position: [3.2, 4.6, 10.5], target: [1.3, 1.4, 0] },
  build() {
    const root = new THREE.Group();
    const parts = [];

    // ---------- materials ----------
    const workMat = M.work.clone();
    workMat.side = THREE.DoubleSide;
    const workGlass = M.work.clone();
    workGlass.side = THREE.DoubleSide;
    workGlass.transparent = true;
    workGlass.opacity = 0.45;
    workGlass.depthWrite = false;

    // ---------- static machine background (not clickable) ----------
    const bg = new THREE.Group();
    root.add(bg);
    bg.add(at(box(10.4, 0.5, 2.0, M.paint), 1.3, 0.25, 0));
    for (const z of [-0.55, 0.55]) bg.add(at(box(10.4, 0.04, 0.3, M.darkSteel), 1.3, 0.52, z));
    bg.add(at(box(1.5, 2.3, 1.7, M.paint), -3.7, 1.65, 0));
    bg.add(at(box(0.3, 0.9, 1.0, M.paintDark), -4.55, 1.6, 0));
    bg.add(at(cyl(0.45, 0.5, M.chrome, { axis: 'x' }), -2.75, AX, 0));
    const saddle = box(1.7, 0.35, 2.0, M.paint);
    const cross = box(1.1, 0.18, 2.4, M.paintDark);
    root.add(saddle, cross);
    const tailBody = new THREE.Group();

    // ---------- chuck (part) ----------
    const chuckSpin = new THREE.Group();
    chuckSpin.position.set(0, AX, 0);
    chuckSpin.add(at(cyl(1.1, 0.6, M.darkSteel, { axis: 'x', seg: 48 }), -2.7, 0, 0));
    chuckSpin.add(at(cyl(0.95, 0.05, M.steel, { axis: 'x', seg: 48 }), -2.38, 0, 0));
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
      const jaw = group(box(0.5, 0.36, 0.24, M.steel), at(box(0.2, 0.1, 0.24, M.hss), 0.0, -0.2, 0));
      jaw.position.set(-2.15, Math.sin(a) * 0.68, Math.cos(a) * 0.68);
      jaw.rotation.x = Math.PI / 2 - a;
      const slot = box(0.04, 1.1, 0.14, M.black);
      slot.position.set(-2.38, Math.sin(a) * 0.55, Math.cos(a) * 0.55);
      slot.rotation.x = Math.PI / 2 - a;
      chuckSpin.add(jaw, slot);
    }
    chuckSpin.add(at(box(0.12, 0.03, 0.03, M.white), -2.7, 1.1, 0));
    root.add(chuckSpin);
    parts.push({
      id: 'chuck', name: 'Three-jaw chuck', object: chuckSpin,
      desc: 'A self-centring three-jaw chuck mounted on the spindle nose grips the workpiece and drives it, supplying the cutting motion V (rotation).',
      slide: 29, qs: ['2014-15_5a', '2012-13_5c'], explode: [-1.5, 0.3, 0],
    });

    // ---------- workpiece (part) ----------
    const workSpin = new THREE.Group();
    workSpin.position.set(0, AX, 0);
    const workMesh = new THREE.Mesh(new THREE.BufferGeometry(), workMat);
    workMesh.castShadow = true;
    workSpin.add(workMesh);
    // helical thread groove (drawRange grows with the tool)
    const TH_P = 0.2, TH_X1 = -0.6;
    const hx = helixPoints(X0, TH_X1, TH_P, R0 - 0.005, 10);
    const helix = tube(hx.pts, 0.03, M.black, { seg: hx.n, radial: 4 });
    helix.castShadow = false;
    const helixIdx = helix.geometry.index.count;
    workSpin.add(helix);
    // knurl band: left- and right-hand helices
    const knurl = new THREE.Group();
    {
      const kmat = M.darkSteel;
      const kr = R0 + 0.004;
      for (let s = -1; s <= 1; s += 2) {
        for (let k = 0; k < 14; k++) {
          const pts = [];
          for (let i = 0; i <= 18; i++) {
            const t = i / 18;
            const a = (k / 14) * Math.PI * 2 + s * t * 1.6;
            pts.push([-t, Math.sin(a) * kr, Math.cos(a) * kr]);
          }
          const m = tube(pts, 0.011, kmat, { seg: 18, radial: 3 });
          m.castShadow = false;
          knurl.add(m);
        }
      }
    }
    knurl.position.x = 2.2;
    workSpin.add(knurl);
    root.add(workSpin);
    parts.push({
      id: 'workpiece', name: 'Workpiece', object: workSpin,
      desc: 'The rotating blank. Cutting speed V = pi D N / 1000 m/min, where D is the diameter being cut (mm) and N the spindle speed (rpm). Watch the shape change as the tool removes material.',
      slide: 29, qs: ['2014-15_5a', '2012-13_5c'], explode: [0, 1.6, 0],
    });
    // parted-off piece
    const piece = cyl(R0, 1, M.work, { axis: 'x' });
    piece.visible = false;
    root.add(piece);

    // ---------- tool (part): holder with per-operation variants ----------
    const toolG = new THREE.Group();
    root.add(toolG);
    const variants = {};
    const addVar = (key, obj) => { obj.visible = false; variants[key] = obj; toolG.add(obj); return obj; };

    // shared tool post (block under, clamp over)
    const post = new THREE.Group();
    post.add(at(box(0.9, 0.5, 0.8, M.darkSteel), 0, -0.07 - 0.25, 1.15), at(box(0.9, 0.1, 0.8, M.darkSteel), 0, 0.12, 1.15));
    for (const x of [-0.28, 0.28]) {
      post.add(at(cyl(0.05, 0.14, M.steel, { seg: 8 }), x, 0.24, 1.15), at(sphere(0.06, M.black), x, 0.33, 1.15));
    }
    toolG.add(post);

    const rnose = [];
    for (let i = 0; i <= 8; i++) {
      const th = -Math.PI / 2 + (i / 8) * Math.PI;
      rnose.push([0.12 * Math.sin(th), 0.12 - 0.12 * Math.cos(th)]);
    }
    addVar('point', blade([[0, 0], [0.32, 0.12], [0.32, 1.5], [-0.3, 1.5], [-0.3, 0.28]]));
    addVar('round', blade([[-0.3, 1.5], [-0.3, 0.12], ...rnose.slice(0, 4), [0, 0], ...rnose.slice(5), [0.3, 0.12], [0.3, 1.5]].filter((p, i, a) => i === 0 || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1])));
    addVar('face', blade([[0, 0], [0.9, 0], [0.9, 1.5], [0.15, 1.5], [0, 0.4]]));
    addVar('chamfer', blade([[0, 0], [-0.4, 0.4], [-0.4, 1.5], [0.7, 1.5], [0.7, 0]]));
    addVar('part', blade([[-0.07, 0], [0.07, 0], [0.07, 1.5], [-0.07, 1.5]], M.hss, 0.3));
    addVar('thread', blade([[0, 0], [0.09, 0.16], [0.4, 0.16], [0.4, 1.5], [-0.4, 1.5], [-0.4, 0.16], [-0.09, 0.16]]));
    // form tool
    const FX = 0.9, FD = 0.2, FW = 0.55;
    {
      const poly = [[-FW - 0.3, 1.5], [-FW - 0.3, FD]];
      for (let i = 0; i <= 16; i++) {
        const v = -1 + (i / 16) * 2;
        poly.push([v * FW, FD * (1 - 0.5 * (1 + Math.cos(Math.PI * v)))]);
      }
      poly.push([FW + 0.3, FD], [FW + 0.3, 1.5]);
      addVar('form', blade(poly, M.hss, 0.2));
    }
    // boring bar with its own holder
    {
      const g = new THREE.Group();
      g.add(at(cyl(0.065, 2.1, M.hss, { axis: 'x' }), 1.0, 0, -0.1));
      g.add(at(box(0.1, 0.07, 0.1, M.carbide), 0.03, 0, -0.04));
      g.add(at(box(0.9, 0.5, 0.9, M.darkSteel), 2.0, -0.35, 0.5), at(box(0.9, 0.12, 0.9, M.darkSteel), 2.0, 0.1, 0.5));
      g.add(at(sphere(0.06, M.black), 1.8, 0.2, 0.5), at(sphere(0.06, M.black), 2.2, 0.2, 0.5));
      addVar('bore', g);
    }
    // knurling holder: two knurl wheels
    const kw = [];
    {
      const g = new THREE.Group();
      for (const s of [-1, 1]) {
        const w = cyl(0.14, 0.24, M.darkSteel, { axis: 'x', seg: 28 });
        w.position.set(0, s * 0.13, 0.14);
        for (let i = 0; i < 12; i++) {
          const t = box(0.24, 0.03, 0.03, M.black);
          const a = (i / 12) * Math.PI * 2;
          t.position.set(0, Math.cos(a) * 0.14, Math.sin(a) * 0.14);
          t.rotation.x = -a;
          w.add(t);
        }
        g.add(w);
        kw.push(w);
        g.add(at(box(0.04, 0.05, 0.4, M.steel), 0.15, s * 0.13, 0.3), at(box(0.04, 0.05, 0.4, M.steel), -0.15, s * 0.13, 0.3));
      }
      g.add(at(box(0.42, 0.5, 0.25, M.steel), 0, 0, 0.55), at(box(0.7, 0.14, 1.0), 0, 0, 1.0));
      addVar('knurl', g);
    }
    // drill
    {
      const g = new THREE.Group();
      g.add(at(cyl(0.01, 0.12, M.hss, { axis: 'x', rTop: 0.14 }), 0.06, 0, 0));
      g.add(at(cyl(0.14, 1.4, M.hss, { axis: 'x' }), 0.82, 0, 0));
      for (const ph of [0, Math.PI]) {
        const pts = [];
        for (let i = 0; i <= 28; i++) {
          const x = 0.1 + (i / 28) * 1.3;
          const a = ph + x * 7;
          pts.push([x, Math.sin(a) * 0.13, Math.cos(a) * 0.13]);
        }
        g.add(tube(pts, 0.03, M.darkSteel, { seg: 28, radial: 4 }));
      }
      g.add(at(cyl(0.14, 0.34, M.steel, { axis: 'x', rTop: 0.2 }), 1.67, 0, 0)); // Morse taper shank
      addVar('drill', g);
    }
    parts.push({
      id: 'tool', name: 'Cutting tool and holder', object: toolG,
      desc: 'The tool (single-point, form, parting, threading, knurling, boring bar or drill) is held on the tool post / in the tailstock. Its path relative to the work defines the operation: f (blue) is the feed and d (green) the depth of cut.',
      slide: 29, qs: ['2014-15_5a', '2012-13_5c'], explode: [0, 1.8, 1.4],
    });

    // ---------- tailstock with quill (part) ----------
    const tail = new THREE.Group();
    tail.add(at(box(1.3, 1.7, 1.1, M.paint), 5.65, 1.35, 0), at(box(1.5, 0.3, 1.3, M.paintDark), 5.65, 0.65, 0));
    tail.add(at(cyl(0.5, 1.3, M.paint, { axis: 'x' }), 5.65, AX, 0));
    const quill = cyl(0.2, 1, M.chrome, { axis: 'x' });
    tail.add(quill);
    const thw = new THREE.Group();
    {
      const spokes = 5, r = 0.4, rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.03, 8, 28), M.chrome);
      const spin = new THREE.Group();
      spin.add(rim);
      for (let i = 0; i < spokes; i++) {
        const s = box(r, 0.03, 0.03, M.chrome);
        const a = (i / spokes) * Math.PI * 2;
        s.position.set(Math.cos(a) * r / 2, Math.sin(a) * r / 2, 0);
        s.rotation.z = a;
        spin.add(s);
      }
      spin.add(at(cyl(0.025, 0.2, M.black, { axis: 'z', seg: 8 }), r, 0, 0.1), at(sphere(0.055, M.black), r, 0, 0.22));
      thw.add(spin);
      thw.rotation.y = Math.PI / 2;
      thw.position.set(6.55, AX, 0);
      thw.userData.spin = spin;
    }
    tail.add(thw, at(cyl(0.04, 0.3, M.chrome, { axis: 'x' }), 6.4, AX, 0));
    root.add(tail);
    parts.push({
      id: 'tailstock-quill', name: 'Tailstock quill', object: tail,
      desc: 'For drilling, the drill is held in the tailstock quill and fed axially into the rotating work by the handwheel. The quill carries a Morse taper (or drill chuck); centring is done before drilling.',
      slide: 33, qs: ['2011-12_6a', '2022-23_5c'], explode: [1.8, 0.4, -0.8],
    });

    // ---------- arrows ----------
    const V_ARROW = spinArrow(0.85, M.vColor, { axis: 'x', arc: Math.PI * 1.5, tube: 0.035 });
    V_ARROW.position.set(-1.65, AX, 0);
    root.add(V_ARROW);
    const rig = new THREE.Group();
    root.add(rig);
    const ARROW_Y = 0.42;
    const setArrows = (cfg) => {
      while (rig.children.length) rig.remove(rig.children[0]);
      for (const [key, color] of [['f', M.fColor], ['d', M.dColor]]) {
        const c = cfg[key];
        if (!c) continue;
        rig.add(arrow([c[0], ARROW_Y, c[1]], [c[2], 0, c[3]], c[4], color, { head: 0.2 }));
      }
    };

    // ---------- work profile state ----------
    const xs = new Float32Array(N + 1);
    for (let i = 0; i <= N; i++) xs[i] = XA + i * DX;
    const R = new Float32Array(N + 1);
    const IR = new Float32Array(N + 1);
    let xEO = X0, xF = X0, rho = 1e9;
    let dirty = true;
    let sinceBuild = 1;

    function rebuild() {
      const pts = [new THREE.Vector2(0, XA)];
      let lastR = R[0];
      for (let i = 0; i <= N; i++) {
        if (xs[i] > xEO + 1e-5) break;
        pts.push(new THREE.Vector2(R[i], xs[i]));
        lastR = R[i];
      }
      if (pts[pts.length - 1].y < xEO - 1e-4) pts.push(new THREE.Vector2(lastR, xEO));
      const rr = Math.min(rho, lastR);
      pts.push(new THREE.Vector2(rr, xEO), new THREE.Vector2(rr, xF));
      // hole
      let iLow = -1;
      for (let i = N; i >= 0; i--) if (xs[i] <= xF + 1e-5 && IR[i] > 0) iLow = i;
      if (iLow >= 0) {
        let top = N;
        while (top > iLow && xs[top] > xF + 1e-5) top--;
        pts.push(new THREE.Vector2(IR[top], xF));
        for (let i = top; i >= iLow; i--) pts.push(new THREE.Vector2(IR[i], xs[i]));
        pts.push(new THREE.Vector2(0, xs[iLow]));
      } else {
        pts.push(new THREE.Vector2(0, xF));
      }
      const geo = new THREE.LatheGeometry(pts, SEG);
      geo.rotateZ(-Math.PI / 2);
      workMesh.geometry.dispose();
      workMesh.geometry = geo;
      dirty = false;
      sinceBuild = 0;
    }

    // ---------- cutting helpers ----------
    const idxLo = (x) => Math.max(0, Math.ceil((x - XA) / DX - 1e-6));
    const idxHi = (x) => Math.min(N, Math.floor((x - XA) / DX + 1e-6));
    function sweepOuter(xa, xb, g) {
      if (xa > xb) { const t = xa; xa = xb; xb = t; }
      for (let i = idxLo(xa); i <= idxHi(xb); i++) {
        const r = g(xs[i]);
        if (r < R[i]) { R[i] = r; dirty = true; }
      }
    }
    function sweepHole(xa, xb, r) {
      if (xa > xb) { const t = xa; xa = xb; xb = t; }
      for (let i = idxLo(xa); i <= idxHi(xb); i++) {
        if (r > IR[i]) { IR[i] = r; dirty = true; }
      }
    }

    // ---------- mode definitions ----------
    // start/end: tool tip (x, z) for the cut stroke; clr: clearance offset used for approach/retract.
    const FACE_D = 0.12;
    const CH = 0.28;
    const TP_SLOPE = 0.1;
    const gStraight = () => 0.4;
    const gTaper = (x) => 0.28 + TP_SLOPE * (X0 - x);
    const gContour = (x) => 0.34 + 0.1 * Math.sin(2.4 * x);
    const PX = 0.7;       // parting position
    const BORE_R0 = 0.18, BORE_R1 = 0.28, BORE_XH = 0.0;
    const DR = 0.14;      // drill radius
    const KN_X0 = 2.2;

    let partedOff = false;
    let pieceVy = 0, pieceT = 0;
    let spinOff = 0;

    const MODES = {
      'straight-turning': {
        tool: 'point', postX: 0, carrOff: 0, chipsOn: true, T: 11,
        start: [2.7, 0.4], end: [-1.2, 0.4], clr: [0, 0.8],
        arrows: { f: [1.1, 0, -1, 0, 1.0], d: [0, 0.9, 0, -1, 0.7] },
        cut(x, z, px) { sweepOuter(x, px, gStraight); },
        read(x, z) { return [['d (radial)', '2 mm (drawn larger)'], ['f', '0.25 mm/rev'], ['Cutting D', '100 mm -> 96 mm']]; },
        V: () => vOf(D_MM), f: '0.25 mm/rev',
      },
      facing: {
        tool: 'face', postX: 0.4, carrOff: 0, chipsOn: true, T: 6,
        start: [X0 - FACE_D, R0 + 0.08], end: [X0 - FACE_D, 0], clr: [0.6, 0],
        arrows: { f: [0.3, 0.9, 0, -1, 0.8], d: [1.2, -0.25, -1, 0, 0.8] },
        cut(x, z) {
          if (z < R0 + 0.001) { xEO = X0 - FACE_D; rho = Math.max(z, 0); dirty = true; }
        },
        V: (x, z) => vOf(2 * Math.max(z, 0) * 100),
        f: '0.2 mm/rev (radial)',
        read(x, z) { const D = 200 * Math.min(Math.max(z, 0), R0); return [['Cutting D (now)', `${D.toFixed(0)} mm`], ['d (axial)', '1.2 mm (drawn larger)']]; },
      },
      'taper-turning': {
        tool: 'point', postX: 0, carrOff: 0, chipsOn: true, T: 10,
        start: [X0 + 0.05, gTaper(X0 + 0.05)], end: [0.15, gTaper(0.15)], clr: [0, 0.8],
        arrows: { f: [1.1, 0, -1, TP_SLOPE, 1.0], d: [0, 0.9, 0, -1, 0.7] },
        cut(x, z, px) { sweepOuter(x, px, gTaper); },
        V: (x, z) => vOf(2 * Math.max(z, 0.05) * 100), f: '0.2 mm/rev along the inclined path',
        read(x, z) { return [['Half angle alpha', `${(Math.atan(TP_SLOPE) * 180 / Math.PI).toFixed(1)} deg`], ['tan alpha', '(D - d) / 2l = 0.10'], ['Tool path', 'inclined at alpha']]; },
      },
      'contour-turning': {
        tool: 'round', postX: 0, carrOff: 0, chipsOn: true, T: 12,
        start: [2.5, gContour(2.5)], end: [-0.8, gContour(-0.8)], clr: [0, 0.8], curved: gContour,
        arrows: { f: [1.1, 0, -1, 0, 1.0], d: [0, 0.9, 0, -1, 0.7] },
        cut(x, z, px) { sweepOuter(x, px, gContour); },
        V: (x, z) => vOf(2 * Math.max(z, 0.05) * 100), f: '0.15 mm/rev, longitudinal + cross combined',
        read(x, z) { return [['Tool path', 'curved (feeds combined)'], ['Cutting D (now)', `${(2 * z * 100).toFixed(0)} mm`]]; },
      },
      'form-turning': {
        tool: 'form', postX: 0, carrOff: 0, chipsOn: false, T: 6,
        start: [FX, R0 + 0.01], end: [FX, R0 - FD], clr: [0, 0.8],
        arrows: { f: [-0.9, 1.0, 0, -1, 0.8], d: [0.9, 1.0, 0, -1, 0.8] },
        cut(x, z) {
          for (let i = idxLo(FX - FW), i1 = idxHi(FX + FW); i <= i1; i++) {
            const v = (xs[i] - FX) / FW;
            const r = z + FD * (1 - 0.5 * (1 + Math.cos(Math.PI * v)));
            if (r < R[i]) { R[i] = r; dirty = true; }
          }
        },
        V: () => vOf(D_MM), f: 'radial plunge, 0.05 mm/rev',
        read() { return [['Axial feed', 'none (tool shape is copied)'], ['Plunge depth d', '20 mm (drawn)']]; },
      },
      chamfering: {
        tool: 'chamfer', postX: 0.15, carrOff: 0, chipsOn: true, T: 4.5,
        start: [X0 + 0.5, R0 - CH + 0.5], end: [X0, R0 - CH], clr: [0.35, 0.35],
        arrows: { f: [0.9, 0.9, -1, -1, 0.9], d: [0.0, 1.1, 0, -1, 0.6] },
        cut(x, z) {
          for (let i = idxLo(x - 0.4), i1 = idxHi(Math.min(x, X0)); i <= i1; i++) {
            const r = z - (xs[i] - x);
            if (r < R[i]) { R[i] = r; dirty = true; }
          }
        },
        V: () => vOf(D_MM), f: 'at 45 deg to the axis',
        read() { return [['Chamfer', '45 deg x 2.8 mm (drawn larger)'], ['Tool motion', 'normal to the chamfer face']]; },
      },
      parting: {
        tool: 'part', postX: 0, carrOff: 0, chipsOn: true, T: 6,
        start: [PX, R0 + 0.01], end: [PX, 0], clr: [0, 0.8],
        arrows: { f: [0.0, 1.0, 0, -1, 0.8] },
        cut(x, z) {
          const zz = Math.max(z, 0.001);
          for (let i = idxLo(PX - 0.07), i1 = idxHi(PX + 0.07); i <= i1; i++) {
            if (zz < R[i]) { R[i] = zz; dirty = true; }
          }
          if (!partedOff && z < 0.05) {
            partedOff = true;
            xEO = PX - 0.07; xF = xEO; dirty = true;
            const len = X0 - (PX + 0.07);
            piece.scale.x = len;
            piece.position.set(PX + 0.07 + len / 2, AX, 0);
            piece.rotation.set(0, 0, 0);
            piece.visible = true;
            pieceVy = 0; pieceT = 0;
          }
        },
        V: (x, z) => vOf(2 * Math.max(z, 0) * 100), f: '0.05 mm/rev (radial)',
        read(x, z) { return [['Cutting D (now)', `${(200 * Math.min(Math.max(z, 0), R0)).toFixed(0)} mm`], ['Blade width', '3 mm (drawn larger)']]; },
      },
      drilling: {
        tool: 'drill', postX: 0, carrOff: 0, chipsOn: true, T: 8, drill: true, glass: true,
        start: [X0 + 0.1, 0], end: [0.9, 0], clr: [1.0, 0],
        arrows: { f: [1.3, 0, -1, 0, 1.2] },
        cut(x, z, px) { sweepHole(x, px, DR); },
        V: () => vOf(28), f: '0.2 mm/rev (axial, from the tailstock)',
        read() { return [['Drill diameter', '28 mm (V at the drill rim)'], ['Hole depth now', '-']]; },
      },
      boring: {
        tool: 'bore', postX: 0, carrOff: 2.0, chipsOn: true, T: 9, glass: true, preHole: true,
        start: [2.55, BORE_R1], end: [0.3, BORE_R1], clr: [0, -(BORE_R1 - BORE_R0)],
        arrows: { f: [1.1, -0.1, -1, 0, 1.0], d: [0.55, 0.0, 0, 1, 0.5] },
        cut(x, z, px) { sweepHole(x, px, BORE_R1); },
        V: () => vOf(2 * BORE_R1 * 100), f: '0.15 mm/rev (axial, inside the hole)',
        read() { return [['Hole D', `${(2 * BORE_R0 * 100).toFixed(0)} -> ${(2 * BORE_R1 * 100).toFixed(0)} mm`], ['Tool', 'single point on a boring bar']]; },
      },
      threading: {
        tool: 'thread', postX: 0, carrOff: 0, chipsOn: true, T: 12, thread: true,
        start: [X0 + 0.15, R0 - 0.07], end: [TH_X1, R0 - 0.07], clr: [0, 0.8],
        arrows: { f: [1.1, 0, -1, 0, 1.0], d: [0, 0.9, 0, -1, 0.7] },
        cut() {},
        V: () => vOf(D_MM), f: 'f = pitch (carriage moves 1 pitch per revolution)',
        read() { return [['Pitch p', `feed = ${(TH_P * 7.5).toFixed(1)} mm per rev`], ['Tool', '60 deg pointed tool']]; },
      },
      knurling: {
        tool: 'knurl', postX: 0, carrOff: 0, chipsOn: false, T: 8, knurl: true,
        start: [KN_X0, R0], end: [-0.3, R0], clr: [0, 0.8],
        arrows: { f: [1.1, 0.55, -1, 0, 1.0], d: [0.0, 1.3, 0, -1, 0.6] },
        cut() {},
        V: () => vOf(D_MM), f: '0.3 mm/rev; forming, no chips',
        read() { return [['Process', 'forming (no material removed)'], ['Pattern', 'diamond cross-hatch']]; },
      },
    };
    const MODE_ORDER = [
      ['straight-turning', 'Straight turning', 29, ['2014-15_5a', '2012-13_5c']],
      ['facing', 'Facing', 29, ['2014-15_5a', '2012-13_5c']],
      ['taper-turning', 'Taper turning', 32, ['2022-23_5c', '2015-16_3b', '2014-15_5a', '2012-13_5c']],
      ['contour-turning', 'Contour turning', 30, ['2010-11_5b', '2014-15_5a', '2012-13_5c']],
      ['form-turning', 'Form turning', 31, ['2014-15_5a', '2012-13_5c']],
      ['chamfering', 'Chamfering', 37, ['2014-15_5a', '2012-13_5c']],
      ['parting', 'Parting (cut-off)', 38, ['2014-15_5a', '2012-13_5c']],
      ['drilling', 'Drilling', 33, ['2011-12_6a', '2022-23_5c', '2014-15_5a', '2012-13_5c']],
      ['boring', 'Boring', 34, ['2017-18_5c', '2016-17_5d', '2022-23_5c', '2015-16_3b']],
      ['threading', 'Threading', 35, ['2010-11_5a', '2015-16_3b', '2016-17_5d', '2022-23_5c']],
      ['knurling', 'Knurling (forming)', 36, ['2016-17_5d', '2015-16_3b', '2022-23_5c']],
    ];
    const modes = MODE_ORDER.map(([id, label, slide, qs]) => ({ id, label, info: MODE_INFO[id], slide, qs }));

    const ch = chips(90, M.workCut);
    root.add(ch.object);

    // ---------- runtime state ----------
    let mode = MODES['straight-turning'];
    let modeId = 'straight-turning';
    let phase = 0, total = 1, stage = 0, u = 0;
    let tx = 0, tz = 0, ptx = 0;
    let theta = 0, emitT = 0;
    const T_A = 0.9, T_R = 0.7, T_B = 1.4, T_H = 0.5;
    const S = { x: 0, z: 0 };

    function resetWork() {
      R.fill(R0);
      IR.fill(0);
      if (mode.preHole) for (let i = 0; i <= N; i++) if (xs[i] >= BORE_XH) IR[i] = BORE_R0;
      xEO = X0; xF = X0; rho = 1e9;
      partedOff = false;
      piece.visible = false;
      helix.geometry.setDrawRange(0, 0);
      knurl.scale.x = 0.0001;
      dirty = true;
    }

    function pos(stg, e, out) {
      const [sx, sz] = mode.start, [ex, ez] = mode.end, [cx, cz] = mode.clr;
      if (stg === 0) { out.x = lerp(sx + cx, sx, e); out.z = lerp(sz + cz, sz, e); }
      else if (stg === 1) {
        out.x = lerp(sx, ex, e);
        out.z = mode.curved ? mode.curved(out.x) : lerp(sz, ez, e);
      }
      else if (stg === 2) { out.x = lerp(ex, ex + cx, e); out.z = lerp(ez, ez + cz, e); }
      else if (stg === 3) { out.x = lerp(ex + cx, sx + cx, e); out.z = lerp(ez + cz, sz + cz, e); }
      else { out.x = sx + cx; out.z = sz + cz; }
    }

    function placeTool() {
      const drilling = !!mode.drill;
      toolG.position.set(tx, AX, tz);
      rig.position.set(tx, AX, tz);
      post.visible = !(drilling || mode.tool === 'bore' || mode.tool === 'knurl');
      post.position.x = mode.postX;
      const cx = drilling ? 0.6 : tx + mode.carrOff;
      saddle.visible = cross.visible = !drilling;
      saddle.position.set(cx, 0.675, 0);
      cross.position.set(cx, 0.94, Math.max(tz, 0) + 1.0);
      // drill: quill extends from the tailstock to the drill shank
      const front = tx + 1.84;
      const qLen = Math.max(5.0 - front, 0.02);
      quill.scale.x = qLen;
      quill.position.x = 5.0 - qLen / 2;
      thw.userData.spin.rotation.z = -(5.0 - front) * 4;
    }

    function setModeInternal(id) {
      modeId = id;
      mode = MODES[id];
      for (const k in variants) variants[k].visible = k === mode.tool;
      workMesh.material = mode.glass ? workGlass : workMat;
      helix.visible = !!mode.thread;
      knurl.visible = !!mode.knurl;
      for (const w of kw) w.visible = true;
      setArrows(mode.arrows);
      total = T_A + mode.T + T_R + T_B + T_H;
      phase = 0;
      resetWork();
      rebuild();
      pos(0, 0, S);
      tx = ptx = S.x; tz = S.z;
      stage = 0; u = 0;
      placeTool();
      ch.reset();
      emitT = 0;
      spinOff = 0;
    }

    setModeInternal('straight-turning');

    return {
      root,
      parts,
      modes,
      setMode(id) { if (MODES[id]) setModeInternal(id); },
      update(dt) {
        phase += dt;
        if (phase >= total) { phase -= total; resetWork(); }
        let e = 0;
        if (phase < T_A) { stage = 0; e = sm(phase / T_A); }
        else if (phase < T_A + mode.T) { stage = 1; e = (phase - T_A) / mode.T; }
        else if (phase < T_A + mode.T + T_R) { stage = 2; e = sm((phase - T_A - mode.T) / T_R); }
        else if (phase < T_A + mode.T + T_R + T_B) { stage = 3; e = sm((phase - T_A - mode.T - T_R) / T_B); }
        else { stage = 4; }
        u = e;
        ptx = tx;
        pos(stage, e, S);
        tx = S.x; tz = S.z;
        if (stage === 1) {
          if (ptx > mode.start[0] + 0.5 || ptx < mode.end[0] - 0.5) ptx = tx;
          mode.cut(tx, tz, ptx, e);
        }
        // spin
        const omega = 8;
        if (mode.thread && stage === 1) {
          if (!mode.threadOn) { mode.threadOn = true; mode.off = theta - (2 * Math.PI * (X0 - tx)) / TH_P; helix.rotation.x = -mode.off; }
          theta = (2 * Math.PI * (X0 - tx)) / TH_P + mode.off;
          const prog = Math.min(1, Math.max(0, (X0 - tx) / (X0 - TH_X1)));
          const seg = Math.floor(prog * (helixIdx / (4 * 6))) * 4 * 6;
          helix.geometry.setDrawRange(0, seg);
        } else {
          if (mode.thread) {
            mode.threadOn = false;
            if (stage >= 2) helix.geometry.setDrawRange(0, helixIdx);
          }
          theta += omega * dt;
        }
        workSpin.rotation.x = theta;
        chuckSpin.rotation.x = theta;
        if (mode.knurl) {
          const len = stage === 0 ? 0 : Math.max(0.0001, KN_X0 - Math.max(tx, -0.3));
          knurl.scale.x = stage >= 2 ? Math.max(0.0001, KN_X0 + 0.3) : len;
          for (const w of kw) w.rotation.x = -theta * 0.8;
        }
        // geometry rebuild throttle
        sinceBuild += dt;
        if (dirty && sinceBuild >= 1 / 15) rebuild();
        // parted piece falls
        if (piece.visible) {
          pieceT += dt;
          pieceVy -= 6 * dt;
          piece.position.y += pieceVy * dt;
          piece.position.x += 0.35 * dt;
          piece.rotation.z -= 1.2 * dt;
          if (piece.position.y < -1.5) piece.visible = false;
        }
        placeTool();
        // chips
        if (mode.chipsOn && stage === 1) {
          emitT += dt;
          while (emitT > 0.07) {
            emitT -= 0.07;
            if (mode.drill) ch.emit([X0, AX + 0.15, 0.25], [0.8, 0.8, 0.6]);
            else if (mode.tool === 'bore') ch.emit([X0, AX + 0.2, 0.3], [0.8, 0.9, 0.5]);
            else ch.emit([tx, AX + 0.04, Math.max(tz, 0) + 0.02], [0.3, 0.9, 0.9]);
          }
        }
        ch.update(dt);
      },
      readout() {
        const rows = [['Operation', modes.find((m) => m.id === modeId).label]];
        rows.push(['N', `${RPM} rpm`]);
        rows.push(['V = pi D N / 1000', `${mode.V(tx, tz).toFixed(1)} m/min`]);
        rows.push(['f', mode.f]);
        for (const r of mode.read(tx, tz)) rows.push(r);
        return rows;
      },
      legend: [['V', 'cutting motion (work rotation)'], ['f', 'feed'], ['d', 'depth of cut']],
    };
  },
};
