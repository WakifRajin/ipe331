// Effect lab: twist drill anatomy. Port of the user's own "Twist Drill Anatomy" page into the lab runtime.
// The drill is a parametric solid (helix, point angle, lip relief, web taper, body clearance) with a section cut,
// drafting overlays, chip / coolant particles and per-step part highlighting.
// Units: drill diameter D = 1. Drill axis = local +z, shank joint at z = 0, point apex at z = APEX.
export default {
  id: 'drill-anatomy',
  chapter: 'drilling',
  title: 'Twist drill anatomy',
  eyebrow: 'Drilling · slides 148–151',
  sub: 'A working 3D model of the drill on your slides. Step through each part; the model highlights it and draws the slide labels and angles.',
  blurb: 'Shank, flutes, margin, body clearance, web, helix, point angle and lip clearance on a drill you can cut open.',
  qs: ['2014-15_6b', '2012-13_6d', '2020-21_2c', '2015-16_3d', '2011-12_6d', '2010-11_6d', '2015-16_3e'],
  params: { helix: 30, point: 118, relief: 12, shank: 'taper', exaggerate: 0, cut: 4.4 },

  build(ctx) {
    const { THREE: T, scene, camera, renderer, P } = ctx;
    const TAU = Math.PI * 2;
    const DEG = Math.PI / 180;
    const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
    const sstep = (a, b, x) => {
      const t = clamp((x - a) / (b - a), 0, 1);
      return t * t * (3 - 2 * t);
    };
    renderer.localClippingEnabled = true;

    /* ---------------- drill geometry ----------------
       Cross-section is described in "psi" (angle measured backwards from the cutting lip):
       land at psi in [0, LAND], margin at its leading edge [0, MARGIN], flute in [LAND - pi, 0). Period pi (two flutes). */
    const R = 0.5, APEX = 7.6, RUNOUT = 0.7;
    const LAND = 1.3, MARGIN = 0.13, RAMP = 0.05, FJ = 1.22;
    const PSI_H = LAND - Math.PI;
    const SHANK_END = -3.92;
    const WEB0 = 0.19, WEB1 = 0.31;
    let K, COT, TANREL, PT0, PSI_J, RHO_J, ZA, RB;

    function derive() {
      K = Math.tan(P.helix * DEG) / R;
      COT = 1 / Math.tan((P.point * DEG) / 2);
      TANREL = Math.tan(P.relief * DEG);
      RB = P.exaggerate >= 0.5 ? 0.82 : 0.93;
      PT0 = -Math.acos(WEB0);
      PSI_J = PT0 + Math.acos(1 / FJ);
      RHO_J = FJ * WEB0;
      ZA = APEX - R * COT;
    }
    function wrapPsi(p) {
      let x = (p - PSI_H) % Math.PI;
      if (x < 0) x += Math.PI;
      return x + PSI_H;
    }
    function smax(a, b, k) {
      return 0.5 * (a + b + Math.sqrt((a - b) * (a - b) + k * k));
    }
    function secR(psi, w, rb) {
      const p = wrapPsi(psi);
      if (p >= 0) {
        if (p <= MARGIN) return 1;
        return 1 + (rb - 1) * sstep(MARGIN, MARGIN + RAMP, p);
      }
      const pt = -Math.acos(w);
      const line = w / Math.cos(p - pt);
      const pf0 = pt + 0.12;
      const heel = p < pf0 ? rb * Math.pow((pf0 - p) / (pf0 - PSI_H), 0.8) : 0;
      return Math.min(smax(line, heel, 0.05), p < pt ? rb : 1);
    }
    const webAt = (z) => WEB0 + (WEB1 - WEB0) * clamp((APEX - 1.6 - z) / (APEX - 1.6 - RUNOUT), 0, 1);
    function rEff(psi, z) {
      const r = secR(psi, webAt(z), RB);
      const u = 1 - sstep(0, RUNOUT, z);
      return r + (1 - r) * u;
    }
    const crest = (rho) => (rho <= RHO_J ? PSI_J : PT0 + Math.acos(Math.min(1, WEB0 / rho)));
    const flankZ = (rho, psi) => APEX - rho * R * COT - TANREL * rho * R * Math.abs(Math.sin(psi - crest(rho)));
    function mpos(rho, psi, z) {
      const a = -psi + K * z;
      return [R * rho * Math.cos(a), R * rho * Math.sin(a), z];
    }

    function sampleRange(a, b, n, extra) {
      const N = 900, ps = new Float64Array(N + 1), L = new Float64Array(N + 1);
      let px = 0, py = 0;
      for (let i = 0; i <= N; i++) {
        const p = a + ((b - a) * i) / N;
        ps[i] = p;
        const r = secR(p, WEB0, RB), x = r * Math.cos(p), y = r * Math.sin(p);
        if (i) L[i] = L[i - 1] + Math.hypot(x - px, y - py);
        px = x;
        py = y;
      }
      let out = [];
      let k = 0;
      for (let j = 0; j <= n; j++) {
        const t = (L[N] * j) / n;
        while (k < N - 1 && L[k + 1] < t) k++;
        const f = clamp((t - L[k]) / Math.max(1e-12, L[k + 1] - L[k]), 0, 1);
        out.push(ps[k] + (ps[k + 1] - ps[k]) * f);
      }
      out[0] = a;
      out[n] = b;
      if (extra && extra.length) {
        const tol = (0.35 * (b - a)) / n;
        out = out.filter((p, i) => i === 0 || i === n || !extra.some((e) => Math.abs(e - p) < tol));
        for (const e of extra) if (e > a && e < b) out.push(e);
        out.sort((x, y) => x - y);
      }
      return out;
    }

    function boundary() {
      const flute = sampleRange(PSI_H, 0, 72, [PSI_J]);
      const margin = sampleRange(0, MARGIN, 5);
      const clear = sampleRange(MARGIN, LAND, 28, [MARGIN + RAMP * 0.35, MARGIN + RAMP * 0.7, MARGIN + RAMP]);
      const patches = [];
      for (const h of [0, 1]) {
        const s = h * Math.PI;
        patches.push({ psis: flute.map((p) => p + s), part: 4 }, { psis: margin.map((p) => p + s), part: 2 }, { psis: clear.map((p) => p + s), part: 3 });
      }
      const all = [];
      for (const pa of patches) for (const p of pa.psis) all.push(p);
      all.sort((x, y) => x - y);
      const circle = [all[0]];
      for (let i = 1; i < all.length; i++) if (all[i] - circle[circle.length - 1] > 1e-7) circle.push(all[i]);
      if (circle[circle.length - 1] - circle[0] > TAU - 1e-6) circle.pop();
      return { patches, circle };
    }

    function makeGeo(pos, part, idx) {
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.BufferAttribute(pos, 3));
      g.setAttribute('color', new T.BufferAttribute(new Float32Array(pos.length), 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      g.userData.part = part;
      return g;
    }

    /* parts: 0 shank, 1 tang, 2 margin, 3 body clearance, 4 flute, 5 point flank, 6 flute floor (web), 7 chisel zone */
    function sideGeometry(patches) {
      const NV = 200;
      let count = 0;
      for (const pa of patches) count += pa.psis.length * (NV + 1);
      const pos = new Float32Array(count * 3), part = new Uint8Array(count), idx = [];
      let o = 0, base = 0;
      for (const pa of patches) {
        const ns = pa.psis.length;
        for (let i = 0; i < ns; i++) {
          const psi = pa.psis[i];
          const zEnd = flankZ(secR(psi, WEB0, RB), psi);
          for (let j = 0; j <= NV; j++) {
            const z = (zEnd * j) / NV, r = rEff(psi, z), a = -psi + K * z;
            pos[o * 3] = R * r * Math.cos(a);
            pos[o * 3 + 1] = R * r * Math.sin(a);
            pos[o * 3 + 2] = z;
            let pt = pa.part;
            if (pt === 4 && r < webAt(z) * 1.6 && z > RUNOUT) pt = 6;
            part[o++] = pt;
          }
        }
        for (let i = 0; i < ns - 1; i++)
          for (let j = 0; j < NV; j++) {
            const a = base + i * (NV + 1) + j, b = a + NV + 1, c = a + 1, d = b + 1;
            idx.push(a, c, b, b, c, d);
          }
        base += ns * (NV + 1);
      }
      return makeGeo(pos, part, idx);
    }

    function flankGeometry(circle) {
      const NF = 26, halves = [];
      for (const h of [0, 1]) {
        const lo = PSI_J + h * Math.PI, hi = lo + Math.PI, list = [];
        for (const p0 of circle)
          for (const s of [0, TAU, -TAU]) {
            const p = p0 + s;
            if (p >= lo - 1e-9 && p <= hi + 1e-9) list.push(p);
          }
        list.sort((x, y) => x - y);
        const u = [list[0]];
        for (let i = 1; i < list.length; i++) if (list[i] - u[u.length - 1] > 1e-7) u.push(list[i]);
        halves.push(u);
      }
      let count = 0;
      for (const l of halves) count += l.length * (NF + 1);
      const pos = new Float32Array(count * 3), part = new Uint8Array(count), idx = [];
      let o = 0, base = 0;
      for (const list of halves) {
        for (const psi of list) {
          const rB = secR(psi, WEB0, RB);
          for (let i = 0; i <= NF; i++) {
            const rho = (rB * i) / NF, z = flankZ(rho, psi), a = -psi + K * z;
            pos[o * 3] = R * rho * Math.cos(a);
            pos[o * 3 + 1] = R * rho * Math.sin(a);
            pos[o * 3 + 2] = z;
            part[o++] = rho < RHO_J * 1.12 ? 7 : 5;
          }
        }
        for (let j = 0; j < list.length - 1; j++)
          for (let i = 0; i < NF; i++) {
            const a = base + j * (NF + 1) + i, b = a + NF + 1, c = a + 1, d = b + 1;
            idx.push(a, b, c, b, d, c);
          }
        base += list.length * (NF + 1);
      }
      return makeGeo(pos, part, idx);
    }

    function latheSeg(p1, p2, partId) {
      const g = new T.LatheGeometry([new T.Vector2(p1[0], p1[1]), new T.Vector2(p2[0], p2[1])], 72);
      g.rotateX(Math.PI / 2);
      const n = g.attributes.position.count;
      g.setAttribute('color', new T.BufferAttribute(new Float32Array(n * 3), 3));
      g.userData.part = new Uint8Array(n).fill(partId);
      return g;
    }
    function shankGeometries() {
      const out = [];
      if (P.shank === 'straight') {
        const L = 3.6;
        out.push(latheSeg([0, -L], [R - 0.05, -L], 0), latheSeg([R - 0.05, -L], [R, -L + 0.05], 0), latheSeg([R, -L + 0.05], [R, 0], 0));
      } else {
        const L = 3.3;
        out.push(
          latheSeg([0, -L], [0.4, -L], 0),
          latheSeg([0.4, -L], [R * 1.06, -0.36], 0),
          latheSeg([R * 1.06, -0.36], [R * 0.84, -0.36], 0),
          latheSeg([R * 0.84, -0.36], [R * 0.84, -0.1], 0),
          latheSeg([R * 0.84, -0.1], [R, 0], 0),
        );
        const sh = new T.Shape(), hw = 0.33, zr = -3.62, rr = 0.3;
        sh.moveTo(-hw, -L);
        sh.lineTo(hw, -L);
        sh.lineTo(rr, zr);
        sh.absarc(0, zr, rr, 0, -Math.PI, true);
        sh.lineTo(-hw, -L);
        const g = new T.ExtrudeGeometry(sh, { depth: 0.2, bevelEnabled: false, curveSegments: 20 });
        g.rotateX(Math.PI / 2);
        g.translate(0, 0.1, 0);
        const n = g.attributes.position.count;
        g.setAttribute('color', new T.BufferAttribute(new Float32Array(n * 3), 3));
        g.userData.part = new Uint8Array(n).fill(1);
        out.push(g);
      }
      return out;
    }

    function edgePaths() {
      const e = { lip: [], chisel: [], heel: [], helix: [] };
      const zHeel = flankZ(secR(LAND, WEB0, RB), LAND);
      for (const h of [0, 1]) {
        const s = h * Math.PI;
        const lp = [];
        for (let i = 0; i <= 32; i++) {
          const psi = PSI_J * (1 - i / 32);
          const rho = secR(psi, WEB0, RB);
          lp.push(mpos(rho, psi + s, flankZ(rho, psi + s)));
        }
        e.lip.push(lp);
        const hp = [];
        for (let i = 0; i <= 80; i++) {
          const z = 0.35 + ((zHeel - 0.35) * i) / 80;
          hp.push(mpos(rEff(LAND + s, z) * 1.004, LAND + s, z));
        }
        e.heel.push(hp);
        const xp = [];
        for (let i = 0; i <= 110; i++) {
          const z = 0.35 + ((ZA - 0.35) * i) / 110;
          xp.push(mpos(rEff(s, z) * 1.005, s, z));
        }
        e.helix.push(xp);
      }
      const cp = [];
      for (let i = 0; i <= 20; i++) {
        const t = i / 20, rho = RHO_J * Math.abs(1 - 2 * t), psi = t < 0.5 ? PSI_J : PSI_J + Math.PI;
        cp.push(mpos(rho, psi, flankZ(rho, psi)));
      }
      e.chisel.push(cp);
      return e;
    }
    function tubeGeo(pts, r) {
      const curve = new T.CatmullRomCurve3(pts.map((p) => new T.Vector3(p[0], p[1], p[2])));
      return new T.TubeGeometry(curve, Math.max(12, pts.length * 2), r, 6, false);
    }

    /* ---------------- scene objects ---------------- */
    const outer = new T.Group();
    outer.rotation.y = Math.PI / 2;
    outer.position.x = -(SHANK_END + APEX) / 2;
    scene.add(outer);
    const inner = new T.Group();
    outer.add(inner);

    const clipPlane = new T.Plane(new T.Vector3(-1, 0, 0), 0);
    const metal = new T.MeshStandardMaterial({ vertexColors: true, metalness: 0.82, roughness: 0.3, side: T.DoubleSide });
    const capMat = new T.MeshStandardMaterial({ vertexColors: true, metalness: 0.35, roughness: 0.48, side: T.DoubleSide });
    const edgeMat = new T.MeshStandardMaterial({ color: 0xffb21a, emissive: 0xb86b00, emissiveIntensity: 0.9, metalness: 0.2, roughness: 0.35 });
    const markMat = new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffc240, emissiveIntensity: 0.7, metalness: 0.1, roughness: 0.3 });
    const chipMat = new T.MeshStandardMaterial({ color: 0xc8691d, metalness: 0.55, roughness: 0.35 });
    const coolMat = new T.MeshStandardMaterial({ color: 0x3a97e0, metalness: 0.0, roughness: 0.15, transparent: true, opacity: 0.85 });
    // Colour zones: shank slate-blue, body steel, point amber (vertex colours, so they survive the section clip).
    const COL = { steel: [0.6, 0.62, 0.65], dim: [0.34, 0.355, 0.37], amber: [1.0, 0.58, 0.07], slate: [0.3, 0.44, 0.68], cut: [0.8, 0.81, 0.83] };

    const MS = { shank: [], body: null, flank: null, edges: {}, markers: [], cap: null };
    let BND = null;

    function disposeMesh(m) {
      if (!m) return;
      m.parent && m.parent.remove(m);
      m.geometry.dispose();
    }
    function buildShank() {
      MS.shank.forEach(disposeMesh);
      MS.shank = [];
      for (const g of shankGeometries()) {
        const m = new T.Mesh(g, metal);
        inner.add(m);
        MS.shank.push(m);
      }
    }
    function buildBody() {
      derive();
      BND = boundary();
      disposeMesh(MS.body);
      disposeMesh(MS.flank);
      MS.body = new T.Mesh(sideGeometry(BND.patches), metal);
      inner.add(MS.body);
      MS.flank = new T.Mesh(flankGeometry(BND.circle), metal);
      inner.add(MS.flank);
      for (const k in MS.edges) MS.edges[k].forEach(disposeMesh);
      MS.markers.forEach(disposeMesh);
      const ep = edgePaths();
      const radius = { lip: 0.012, chisel: 0.012, heel: 0.008, helix: 0.009 };
      MS.edges = {};
      for (const k in ep)
        MS.edges[k] = ep[k].map((p) => {
          const m = new T.Mesh(tubeGeo(p, radius[k]), edgeMat);
          inner.add(m);
          return m;
        });
      MS.markers = [];
      for (const h of [0, 1]) {
        const s = h * Math.PI;
        for (const p of [mpos(1, s, ZA), mpos(RHO_J, PSI_J + s, flankZ(RHO_J, PSI_J + s))]) {
          const m = new T.Mesh(new T.SphereGeometry(0.03, 16, 12), markMat);
          m.position.set(p[0], p[1], p[2]);
          inner.add(m);
          MS.markers.push(m);
        }
      }
    }
    function buildCap() {
      disposeMesh(MS.cap);
      MS.cap = null;
      if (!TOP().section) return;
      const zc = P.cut, NF = 30, list = BND.circle.slice();
      list.push(list[0] + TAU);
      const n = list.length;
      const pos = new Float32Array(n * (NF + 1) * 3), rho = new Float32Array(n * (NF + 1)), ps = new Float32Array(n * (NF + 1)), rbs = new Float32Array(n * (NF + 1)), idx = [];
      let o = 0;
      for (let j = 0; j < n; j++) {
        const psi = list[j], rB = rEff(psi, zc);
        for (let i = 0; i <= NF; i++) {
          const r = (rB * i) / NF, p = mpos(r, psi, zc + 0.0008);
          pos[o * 3] = p[0];
          pos[o * 3 + 1] = p[1];
          pos[o * 3 + 2] = p[2];
          rho[o] = r;
          ps[o] = psi;
          rbs[o] = rB;
          o++;
        }
      }
      for (let j = 0; j < n - 1; j++)
        for (let i = 0; i < NF; i++) {
          const a = j * (NF + 1) + i, b = a + NF + 1, c = a + 1, d = b + 1;
          idx.push(a, b, c, b, d, c);
        }
      const g = makeGeo(pos, null, idx);
      g.userData.rho = rho;
      g.userData.psi = ps;
      g.userData.rb = rbs;
      MS.cap = new T.Mesh(g, capMat);
      inner.add(MS.cap);
      recolorCap();
    }

    /* particles: chips travel out along the flute face, coolant runs in along the heel side */
    const NCHIP = 30, NCOOL = 26;
    const chips = new T.InstancedMesh(new T.TorusGeometry(0.05, 0.016, 5, 12, Math.PI * 1.45), chipMat, NCHIP);
    const cools = new T.InstancedMesh(new T.SphereGeometry(0.035, 10, 8), coolMat, NCOOL);
    chips.frustumCulled = cools.frustumCulled = false;
    inner.add(chips, cools);
    const seedR = (i) => {
      const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    const dummy = new T.Object3D();
    let flowT = 0;
    function updateParticles(dt) {
      flowT += dt * (0.35 + 0.9 * Math.tan(P.helix * DEG));
      const L = ZA - 0.6 - (RUNOUT + 0.2);
      for (let i = 0; i < NCHIP; i++) {
        const h = i % 2, s = (flowT * 0.9 + seedR(i) * L) % L, z = ZA - 0.45 - s;
        const psi = -0.5 - seedR(i + 9) * 0.25 + h * Math.PI, rho = 0.55 + seedR(i + 3) * 0.25;
        const p = mpos(rho, psi, z);
        dummy.position.set(p[0], p[1], p[2]);
        dummy.rotation.set(seedR(i + 1) * 6 + flowT * 2, seedR(i + 2) * 6 + flowT * 1.3, seedR(i + 4) * 6);
        const sc = 0.8 + seedR(i + 5) * 0.6;
        dummy.scale.set(sc, sc, sc);
        dummy.updateMatrix();
        chips.setMatrixAt(i, dummy.matrix);
      }
      for (let i = 0; i < NCOOL; i++) {
        const h = i % 2, s = (flowT * 0.75 + seedR(i + 40) * L) % L, z = RUNOUT + 0.3 + s;
        const psi = -1.5 - seedR(i + 41) * 0.12 + h * Math.PI, rho = 0.7 + seedR(i + 42) * 0.18;
        const p = mpos(rho, psi, z);
        dummy.position.set(p[0], p[1], p[2]);
        dummy.rotation.set(0, 0, 0);
        const sc = 0.7 + seedR(i + 43) * 0.6;
        dummy.scale.set(sc, sc * 1.25, sc);
        dummy.updateMatrix();
        cools.setMatrixAt(i, dummy.matrix);
      }
      chips.instanceMatrix.needsUpdate = true;
      cools.instanceMatrix.needsUpdate = true;
    }

    /* ---------------- tour content ---------------- */
    const cutControl = () => `<div class="ctl-row"><label for="lab-cut">Cut position</label><output class="val" data-out="cut"></output></div>
        <input id="lab-cut" type="range" min="1" max="${(ZA - 0.3).toFixed(2)}" step="0.02" data-key="cut">`;

    const TOPICS = [
      {
        id: 'overview', chip: 'Overview', eyebrow: 'Overview · slide 148', title: 'Three main components',
        cam: { z: (SHANK_END + APEX) / 2, dir: [0, 0.3, 1], fit: 12.6 }, spin: true, parts: 'zones',
        html: () => `
      <p>Every twist drill has three main components. Their colours on the model match the list. Drag to turn the drill.</p>
      <div class="duo">
        <div><h3>Shank (blue)</h3><p>Clamped by the machine to drive the drill. <button class="pbtn" type="button" data-go="shank">Show</button></p></div>
        <div><h3>Body (steel)</h3><p>Flutes, margins, body clearance, lands and web. <button class="pbtn" type="button" data-go="flutes">Show</button></p></div>
        <div><h3>Point (amber)</h3><p>The cone-shaped cutting end: lips and chisel edge. <button class="pbtn" type="button" data-go="point-angle">Show</button></p></div>
      </div>
      <p class="note">The dimension lines follow the drawing on slide 148: overall length, shank, body and flute length.</p>
      <p class="key"><span class="key-tag">Remember</span>Shank → body → point, from the end held in the chuck to the end that cuts.</p>`,
      },
      {
        id: 'shank', chip: 'Shank', eyebrow: 'Shank · slide 148', title: 'Shank',
        cam: { z: -1.75, dir: [-0.35, 0.42, 1], fit: 5.6 }, spin: true, parts: [0, 1],
        html: () => `
      <p>The portion that is <mark>“clamped” to provide the drive</mark>. The chuck or spindle grips it and turns the drill.</p>
      <div class="ctl">
        <div class="ctl-row"><span>Shank type</span></div>
        <div class="seg">
          <button type="button" data-set="shank:straight">Straight · up to ½″</button>
          <button type="button" data-set="shank:taper">Taper · above ½″</button>
        </div>
      </div>
      <ul>
        <li><b>Straight shank</b> for drills up to ½″. The shank is equal to the body diameter, as the two Ø D marks on the model show.</li>
        <li><b>Above ½″</b> the shank can be tapered or reduced. The drawing on the slide shows a taper shank; the flat tang at its end fits the slot in the spindle.</li>
      </ul>
      <p class="key"><span class="key-tag">Remember</span>Up to ½″: straight shank, same Ø as the body. Above ½″: tapered or reduced shank.</p>`,
      },
      {
        id: 'flutes', chip: 'Flutes', group: 'Body', eyebrow: 'Body · slide 148', title: 'Flutes',
        cam: { z: 4.0, dir: [0.15, 0.45, 1], fit: 7.8 }, spin: true, parts: [4, 6], particles: true,
        html: () => `
      <p><mark>Helical grooves</mark> cut around the body, which <mark>form the cutting edges</mark>. Where each flute meets the point it creates a cutting lip.</p>
      <ul>
        <li>They allow <b>coolant to flow</b> to the cutting edge (blue drops running toward the point).</li>
        <li>They allow <b>chips to be withdrawn</b> from the hole (amber curls carried back toward the shank).</li>
        <li>Two flutes, so the drill has two cutting lips. The flute length runs from the outer corners of the lips to the end of the flutes.</li>
      </ul>
      <p class="key"><span class="key-tag">Remember</span>Flute = helical groove → forms the cutting edges, brings coolant in, takes chips out.</p>`,
      },
      {
        id: 'margin', chip: 'Margin', group: 'Body', eyebrow: 'Body · slide 148', title: 'Margin',
        cam: { z: 5.0, dir: [0.25, 0.32, 1], fit: 3.1 }, spin: true, parts: [2],
        html: () => `
      <p>A <mark>narrow raised section of the body</mark>, running along the leading edge of each land at the full drill diameter. It is the bright strip on the model.</p>
      <ul>
        <li>It provides <b>full body-to-hole support</b>: the margins are what touch the wall of the hole.</li>
        <li>That support <b>keeps the drill aligned</b> as it drills.</li>
        <li>The darker surface behind it is the body clearance, ground slightly smaller (next step).</li>
      </ul>
      <p class="key"><span class="key-tag">Remember</span>Margin = full-diameter guide strip → keeps the drill aligned.</p>`,
      },
      {
        id: 'clearance', chip: 'Body clearance', group: 'Body', eyebrow: 'Body · slides 148–149', title: 'Body clearance',
        cam: { z: 'cut', dir: [1.0, 0.45, 0.6], fit: 2.1 }, spin: false, spinTo: 'section', parts: [3], section: true,
        html: () => `
      <p>A <mark>reduced section of the drill between the flutes and the margin</mark>. The model is cut open here so you can see the cross-section, like the end view on the slide.</p>
      <ul>
        <li>The dashed circle is the full drill diameter. Only the margin reaches it; the body clearance sits just inside.</li>
        <li>Because it does not touch the hole wall, it <b>reduces friction between drill and workpiece</b>.</li>
        <li>The gap between the circle and the clearance surface is the <b>body diameter clearance</b> labelled on slide 148.</li>
      </ul>
      <div class="ctl">
        <div class="ctl-row"><span>Exaggerate the clearance</span></div>
        <div class="seg">
          <button type="button" data-set="exaggerate:0">True scale</button>
          <button type="button" data-set="exaggerate:1">×2.5</button>
        </div>
        ${cutControl()}
      </div>
      <p class="exam">Asked: TF 2020-21 Q.2(c), 2015-16 Q.3(d).</p>
      <p class="key"><span class="key-tag">Remember</span>Margin rubs the hole; body clearance doesn't → less friction.</p>`,
      },
      {
        id: 'land', chip: 'Land & heel', group: 'Body', eyebrow: 'Body · slide 148 drawings', title: 'Land and heel',
        cam: { z: 'cut', dir: [1.0, 0.45, 0.6], fit: 2.1 }, spin: false, spinTo: 'section', parts: [2, 3], section: true, edges: ['heel'],
        html: () => `
      <p>These two terms are labelled on the slide's drawings rather than explained in its text.</p>
      <ul>
        <li><b>Land</b>: the outer part of the body between two flutes (highlighted). It carries the margin at its leading edge and the body clearance behind it.</li>
        <li><b>Heel</b>: the trailing edge of the land, where it drops into the next flute. On the model it is the thin amber line that spirals along the body.</li>
        <li>On the end-view drawing, the dimension marked “Land” spans only the narrow full-diameter strip. Some books use “land” for that strip, which is the margin.</li>
      </ul>
      <div class="ctl">${cutControl()}</div>
      <p class="key"><span class="key-tag">Remember</span>Each land: margin at the front, body clearance in the middle, heel at the back.</p>`,
      },
      {
        id: 'web', chip: 'Web', group: 'Body', eyebrow: 'Body · slide 149', title: 'Web',
        cam: { z: 'cut', dir: [1, 0.3, 0.32], fit: 1.9 }, spin: false, spinTo: 'section', parts: [6, 7], section: true,
        html: () => `
      <p>The <mark>thin section in the centre of the drill which forms a “core”</mark>: the metal left between the bottoms of the two flutes.</p>
      <ul>
        <li>The web <b>increases in thickness as it extends to the shank</b>. Move the cut and watch the measurement grow.</li>
        <li>At the point, the web <b>forms the chisel edge</b> of the drill.</li>
      </ul>
      <div class="ctl">
        ${cutControl()}
        <div class="presets"><button class="pbtn" type="button" data-set="cut:${(ZA - 0.6).toFixed(2)}">Cut near the point</button><button class="pbtn" type="button" data-set="cut:1.2">Cut near the shank</button></div>
        <p class="ro">Web (core) thickness at this cut: <b data-ro="web"></b></p>
      </div>
      <p class="key"><span class="key-tag">Remember</span>Web = core. Thin at the point, thicker toward the shank, and it forms the chisel edge.</p>`,
      },
      {
        id: 'helix', chip: 'Helix angle', group: 'Body', eyebrow: 'Body · slide 149', title: 'Helix angle (spiral)',
        cam: { z: 3.7, dir: [0, 0.2, 1], fit: 6.6 }, spin: false, parts: [2], edges: ['helix'], particles: true,
        html: () => `
      <p>The <mark>spiral, or rate of twist</mark>, controls the rate of chip removal. It is measured by the helix angle between the drill axis and the leading edge of the land.</p>
      <div class="ctl">
        <div class="ctl-row"><label for="lab-helix">Helix angle</label><output class="val" data-out="helix"></output></div>
        <input id="lab-helix" type="range" min="10" max="45" step="1" data-key="helix">
        <div class="presets"><button class="pbtn" type="button" data-set="helix:15">Low spiral · 15°</button><button class="pbtn" type="button" data-set="helix:30">30°</button><button class="pbtn" type="button" data-set="helix:40">High spiral · 40°</button></div>
        <p class="ro">Lead of helix: <b data-ro="lead"></b> · <b data-ro="helixtag"></b></p>
      </div>
      <div class="duo">
        <div data-band="high"><h3>High spiral · 27°–45°</h3><p>Larger helix angle, for softer material. A better path for chip removal, especially in deep holes.</p></div>
        <div data-band="low"><h3>Low spiral · 10°–19°</h3><p>Smaller helix angle, for harder, more brittle material that produces smaller, less problematic chips.</p></div>
      </div>
      <p class="note">Lead of helix is the axial distance in which one flute makes a full turn.</p>
      <p class="formula">tan(helix) = πD ÷ lead</p>
      <p class="key"><span class="key-tag">Remember</span>Soft material → high spiral (larger angle). Hard, brittle material → low spiral (smaller angle).</p>`,
      },
      {
        id: 'point-angle', chip: 'Point angle', group: 'Point', eyebrow: 'Point · slide 150', title: 'Point angle',
        cam: { z: APEX - 0.55, dir: [0, 0.0, 1], fit: 2.6 }, spin: false, spinTo: 'sil', parts: [5, 7],
        html: () => `
      <p>The point angle is determined by the material being drilled. <mark>Harder materials require a larger point angle; softer materials require a sharper angle.</mark></p>
      <div class="ctl">
        <div class="ctl-row"><label for="lab-point">Included point angle</label><output class="val" data-out="point"></output></div>
        <input id="lab-point" type="range" min="80" max="140" step="1" data-key="point">
        <div class="presets"><button class="pbtn" type="button" data-set="point:90">90° sharper</button><button class="pbtn" type="button" data-set="point:118">118° general</button><button class="pbtn" type="button" data-set="point:140">140° larger</button></div>
        <p class="ro"><b data-ro="half"></b> each side of the axis · <b data-ro="pointtag"></b></p>
      </div>
      <ul>
        <li>The correct angle for the material's hardness controls <b>wandering, chatter, hole shape and wear rate</b>.</li>
        <li><b>General purpose: 59° (118° included)</b>. It balances aggressive cutting against the drill wandering on the surface.</li>
        <li>The photo on slide 150 shows a flatter point of about 140°, the kind used for harder material.</li>
      </ul>
      <p class="key"><span class="key-tag">Remember</span>118° included = 2 × 59°. Harder → larger angle, softer → sharper.</p>`,
      },
      {
        id: 'lip-clearance', chip: 'Lip clearance', group: 'Point', eyebrow: 'Point · slide 150', title: 'Lip clearance angle',
        cam: { z: 'za', dir: [0.3, 0.22, 1], fit: 1.95, lift: 0.34 }, spin: false, spinTo: 'face', parts: [5], edges: ['lip'],
        html: () => `
      <p>The surface behind each cutting lip is ground so it falls away from the lip. The angle of that fall is the lip clearance angle (the <b>nominal relief angle</b> on slide 148). It <mark>determines the amount of support provided to the cutting edge</mark>.</p>
      <div class="ctl">
        <div class="ctl-row"><label for="lab-relief">Lip clearance</label><output class="val" data-out="relief"></output></div>
        <input id="lab-relief" type="range" min="4" max="20" step="1" data-key="relief">
        <div class="presets"><button class="pbtn" type="button" data-set="relief:6">6° smaller</button><button class="pbtn" type="button" data-set="relief:12">12° as on slide</button><button class="pbtn" type="button" data-set="relief:18">18° greater</button></div>
        <p class="ro"><b data-ro="relieftag"></b></p>
      </div>
      <ul>
        <li><b>A greater lip angle</b> makes the drill cut more aggressively under the same point pressure, but leaves less metal supporting the edge.</li>
        <li><b>A smaller lip angle</b> supports the edge better, but the surface behind it can rub.</li>
        <li>Both conditions can cause <b>binding, wear and eventual catastrophic failure</b> of the tool.</li>
        <li>The proper amount of lip clearance is determined by the point angle.</li>
      </ul>
      <p class="key"><span class="key-tag">Remember</span>More lip clearance → more aggressive cut, less edge support. Get it wrong either way → binding, wear, failure.</p>`,
      },
      {
        id: 'lips', chip: 'Lips & chisel', group: 'Point', eyebrow: 'Point · slides 148–150', title: 'Lips and chisel edge',
        cam: { z: 'apexv', dir: [1, 0.1, 0.16], fit: 1.5 }, spin: false, spinTo: 'end', parts: [], edges: ['lip', 'chisel'], markers: true,
        html: () => `
      <p>Looking straight at the point, like the “cutting lips” photo on slide 150.</p>
      <ul>
        <li><b>Lips</b>: the two cutting edges, formed where each flute meets the cone of the point.</li>
        <li><b>Outer corner</b>: where a lip meets the margin, at the full diameter.</li>
        <li><b>Chisel edge</b>: the short edge across the centre. It is formed by the web, so a thicker web gives a longer chisel edge.</li>
        <li><b>Chisel edge corner</b>: where a lip meets the chisel edge.</li>
        <li><b>Lip length</b>: from the outer corner to the chisel edge corner.</li>
      </ul>
      <p class="ro">Lip length on this model: <b data-ro="lip"></b></p>
      <p class="exam">Asked: TF 2011-12 Q.6(d), 2010-11 Q.6(d).</p>
      <p class="key"><span class="key-tag">Remember</span>Flute + point cone → lips. Web → chisel edge.</p>`,
      },
      {
        id: 'answer', chip: 'Exam answer', group: 'Exam', eyebrow: 'Model answer', title: 'Constructional features of a twist drill',
        cam: { z: (SHANK_END + APEX) / 2, dir: [0, 0.3, 1], fit: 12.6 }, spin: true, parts: 'zones',
        html: () => `
      <p><b>Sketch</b> a side view (shank, body, point) and an end view, then label:</p>
      <ul>
        <li><b>Shank</b>: the clamped part that gives the drive. Straight (same Ø as the body) up to ½″, tapered or reduced above ½″ with a tang to drive it.</li>
        <li><b>Body</b>: <b>flutes</b> (helical grooves, form the cutting edges, admit coolant and withdraw chips); <b>margin</b> (narrow full-diameter strip, supports and aligns the drill); <b>body clearance</b> (reduced section between flute and margin); <b>land</b> and <b>heel</b>; <b>web</b> (central core, thickens towards the shank, forms the chisel edge); <b>helix angle</b>.</li>
        <li><b>Point</b>: two <b>cutting lips</b> where the flutes meet the cone (point angle 118° general purpose), the <b>chisel edge</b> across the web, and the <b>lip clearance</b> (relief) angle behind each lip.</li>
      </ul>
      <p><b>Cutting edges of a double-flute drill:</b> the two main cutting lips (they cut and make the chips) and the chisel edge (formed by the web, it scrapes and extrudes metal at the centre, producing no true chip). The margins only guide.</p>
      <p><b>Why body-diameter clearance?</b> Only the narrow margin touches the hole wall, so friction between drill and workpiece is reduced (less heat and wear) while the margin still guides the drill.</p>
      <p><b>Angles:</b> helix 27°–45° for soft material, 10°–19° for hard, brittle material; point angle 118° general, larger for harder work; lip clearance about 8°–12° (too much weakens the edge, too little makes it rub and bind).</p>
      <p class="note">Re-sharpening (Note M): grind only the point surfaces, axis at 59° to the wheel for 118°, equal lip lengths and angles, 8°–12° clearance, do not overheat.</p>
      <p class="key"><span class="key-tag">Sketch</span>Draw the drill with the overall, shank, body and flute-length dimensions, and the end view with margin, land, flute, web and body clearance.</p>`,
      },
    ];
    const IDX = Object.fromEntries(TOPICS.map((t, i) => [t.id, i]));
    let cur = 0;
    const TOP = () => TOPICS[cur];

    /* ---------------- colouring, visibility ---------------- */
    function colorFor(part, t) {
      if (t.parts === 'zones') return part <= 1 ? COL.slate : part === 5 || part === 7 ? COL.amber : COL.steel;
      if (!t.parts || !t.parts.length) return COL.steel;
      return t.parts.includes(part) ? COL.amber : COL.dim;
    }
    function recolorGeo(g, t) {
      const c = g.attributes.color, part = g.userData.part;
      for (let i = 0; i < c.count; i++) {
        const v = colorFor(part[i], t);
        c.setXYZ(i, v[0], v[1], v[2]);
      }
      c.needsUpdate = true;
    }
    function capZone(t, rho, psi, rB, zc) {
      const p = wrapPsi(psi);
      if (t.id === 'web') {
        const w = webAt(zc);
        return Math.abs(rho * Math.cos(psi + Math.acos(w))) < w && rho < 2.4 * w;
      }
      if (t.id === 'land') return p >= 0 && p <= LAND && rho > 0.74 * rB;
      if (t.id === 'clearance') return p > MARGIN + RAMP * 0.6 && p <= LAND && rho > rB - 0.1;
      return false;
    }
    function recolorCap() {
      if (!MS.cap) return;
      const g = MS.cap.geometry, c = g.attributes.color, u = g.userData, t = TOP();
      for (let i = 0; i < c.count; i++) {
        const v = capZone(t, u.rho[i], u.psi[i], u.rb[i], P.cut) ? COL.amber : COL.cut;
        c.setXYZ(i, v[0], v[1], v[2]);
      }
      c.needsUpdate = true;
    }
    function recolor() {
      const t = TOP();
      for (const m of [MS.body, MS.flank, ...MS.shank]) if (m) recolorGeo(m.geometry, t);
      recolorCap();
    }
    function applyVisibility() {
      const t = TOP(), edges = t.edges || [];
      for (const k in MS.edges) MS.edges[k].forEach((m) => (m.visible = edges.includes(k)));
      MS.markers.forEach((m) => (m.visible = !!t.markers));
      chips.visible = cools.visible = !!t.particles;
      const planes = t.section ? [clipPlane] : [];
      for (const mat of [metal, edgeMat, markMat, chipMat, coolMat]) {
        mat.clippingPlanes = planes;
        mat.needsUpdate = true;
      }
      clipPlane.constant = outer.position.x + P.cut;
    }

    /* ---------------- camera + spin ---------------- */
    let spin = 0, spinOn = true, spinTarget = null;
    const SPIN_SPEED = 0.65;
    function camZ(t) {
      const z = t.cam.z;
      if (z === 'cut') return P.cut;
      if (z === 'za') return ZA;
      if (z === 'apexv') return APEX - 0.25;
      return z;
    }
    function camFor(t) {
      scene.updateMatrixWorld();
      const target = outer.localToWorld(new T.Vector3(0, 0, camZ(t)));
      if (t.cam.lift) target.y += t.cam.lift;
      const d = t.cam.fit / 2 / Math.tan((camera.fov * DEG) / 2);
      const dir = new T.Vector3(...t.cam.dir).normalize().multiplyScalar(d).add(target);
      return { position: dir.toArray(), target: target.toArray() };
    }
    function wantedSpin(t) {
      const d = t.cam.dir, th = Math.atan2(d[1], -d[2]);
      if (t.spinTo === 'sil') return th + Math.PI / 2 - K * ZA;
      if (t.spinTo === 'face') return th - 0.35 - K * ZA;
      if (t.spinTo === 'end') return 0.38 - K * ZA;
      if (t.spinTo === 'section') return Math.PI / 2 + 0.65 - K * P.cut;
      return null;
    }
    function nearestMod(target, from) {
      let d = (target - from) % Math.PI;
      if (d > Math.PI / 2) d -= Math.PI;
      if (d < -Math.PI / 2) d += Math.PI;
      return from + d;
    }
    function aimSpin() {
      const w = wantedSpin(TOP());
      spinTarget = w === null ? null : nearestMod(w, spin);
    }

    function enter(id) {
      cur = IDX[id];
      const t = TOP();
      if (t.section) P.cut = clamp(P.cut, 1.0, ZA - 0.3);
      buildCap();
      recolor();
      applyVisibility();
      spinOn = !!t.spin;
      aimSpin();
    }

    /* ---------------- overlay helpers (draft API, zero-allocation point ring) ---------------- */
    const RING = Array.from({ length: 512 }, () => [0, 0, 0]);
    let ri = 0;
    function tf(m, x, y, z) {
      const o = RING[(ri = (ri + 1) & 511)], e = m.elements;
      o[0] = e[0] * x + e[4] * y + e[8] * z + e[12];
      o[1] = e[1] * x + e[5] * y + e[9] * z + e[13];
      o[2] = e[2] * x + e[6] * y + e[10] * z + e[14];
      return o;
    }
    const WI = (x, y, z) => tf(inner.matrixWorld, x, y, z);
    const WO = (x, y, z) => tf(outer.matrixWorld, x, y, z);
    const wi = (p) => WI(p[0], p[1], p[2]);
    const tmpV = new T.Vector3();
    const fr = { thOut: 0, thIn: 0, ux: 0, uy: 1 };
    let sx = 0, sy = 0, sok = false; // projection scratch (ndc x, ndc y, in front of camera)
    function proj(p) {
      const e = camera.matrixWorldInverse.elements, q = camera.projectionMatrix.elements;
      const x = p[0], y = p[1], z = p[2];
      const X = e[0] * x + e[4] * y + e[8] * z + e[12];
      const Y = e[1] * x + e[5] * y + e[9] * z + e[13];
      const Z = e[2] * x + e[6] * y + e[10] * z + e[14];
      sok = -Z > 1e-4;
      sx = sok ? (q[0] * X) / -Z : 0;
      sy = sok ? (q[5] * Y) / -Z : 0;
    }
    // Label with an optional leader. opt: {auto, c (centre world pt), len, n (face normal: hide if facing away), off:[dx,dy]}
    function callout(d, A, text, cls = '', dx = 0, dy = 0, opt = null) {
      const ew = camera.matrixWorld.elements, ie = inner.matrixWorld.elements;
      if (opt && opt.n) {
        if ((ew[12] - A[0]) * ie[8] + (ew[13] - A[1]) * ie[9] + (ew[14] - A[2]) * ie[10] <= 0) return;
      }
      if (opt && opt.auto && opt.c) {
        proj(A);
        const ax = sx, ay = sy;
        proj(opt.c);
        let vx = (ax - sx) * camera.aspect, vy = -(ay - sy);
        const l = Math.hypot(vx, vy);
        if (l > 0.003) {
          vx /= l;
          vy /= l;
        } else {
          vx = 0.7;
          vy = -0.7;
        }
        dx = vx * opt.len;
        dy = vy * opt.len;
      }
      if (opt && opt.off) {
        dx = opt.off[0];
        dy = opt.off[1];
      }
      if (dx || dy) {
        const H = ctx.stage.clientHeight || 520;
        const dist = Math.hypot(ew[12] - A[0], ew[13] - A[1], ew[14] - A[2]) || 1;
        const k = (2 * dist * Math.tan((camera.fov * DEG) / 2)) / H;
        const L = RING[(ri = (ri + 1) & 511)];
        L[0] = A[0] + ew[0] * dx * k - ew[4] * dy * k;
        L[1] = A[1] + ew[1] * dx * k - ew[5] * dy * k;
        L[2] = A[2] + ew[2] * dx * k - ew[6] * dy * k;
        d.line(A, L, 'ext');
        d.dot(A, 'dot');
        d.label(L, text, cls);
      } else d.label(A, text, cls);
    }
    const shankEnd = () => (P.shank === 'straight' ? -3.6 : SHANK_END);
    // axial dimension beside the drill (off = signed distance from the axis, in the screen "up" direction)
    function dimAxial(d, z1, z2, off, text, r1, r2) {
      const sg = Math.sign(off), ext = off + sg * 0.12, ux = fr.ux, uy = fr.uy;
      const a1 = (r1 ?? R) * 1.04 * sg, a2 = (r2 ?? R) * 1.04 * sg;
      d.line(WO(ux * a1, uy * a1, z1), WO(ux * ext, uy * ext, z1), 'ext');
      d.line(WO(ux * a2, uy * a2, z2), WO(ux * ext, uy * ext, z2), 'ext');
      d.line(WO(ux * off, uy * off, z1), WO(ux * off, uy * off, z2), 'dm', { arrows: true });
      d.label(WO(ux * off, uy * off, (z1 + z2) / 2), text, 'dimtxt');
    }
    function dimDia(d, z) {
      d.line(WO(-R * fr.ux, -R * fr.uy, z), WO(R * fr.ux, R * fr.uy, z), 'dm', { arrows: true });
      d.label(WO(fr.ux * (R + 0.3), fr.uy * (R + 0.3), z), 'Ø D', 'dimtxt');
    }
    const hA = [0, 0, 0];
    function helixAnchor(psi, rho, z0) {
      const base = fr.thIn + psi;
      const n = Math.round((K * z0 - base) / Math.PI);
      const z = (base + n * Math.PI) / K;
      const r = rho == null ? rEff(psi, z) : rho;
      hA[0] = R * r * Math.cos(fr.thIn);
      hA[1] = R * r * Math.sin(fr.thIn);
      hA[2] = z;
      return hA;
    }
    const capPt = (rho, psi) => mpos(rho, psi, P.cut + 0.002);
    const lipPoint = (f, s) => {
      const psi = PSI_J * f + s, rho = secR(PSI_J * f, WEB0, RB);
      return mpos(rho, psi, flankZ(rho, psi));
    };
    const lipLength = () => {
      const J0 = mpos(RHO_J, PSI_J, flankZ(RHO_J, PSI_J)), A = mpos(1, 0, ZA);
      return Math.hypot(A[0] - J0[0], A[1] - J0[1], A[2] - J0[2]);
    };

    function sectionCommon(d, id) {
      const zc = P.cut, pts = [];
      for (let i = 0; i <= 96; i++) {
        const a = (TAU * i) / 96;
        pts.push(WI(R * 1.004 * Math.cos(a), R * 1.004 * Math.sin(a), zc));
      }
      d.path(pts, 'ref');
      const c = [...wi([0, 0, zc])]; // small, once per frame
      const opt = (len) => ({ auto: true, c, len, n: true });
      if (id === 'clearance') {
        callout(d, wi(capPt(RB, 0.8)), 'Body clearance', 'hl', 0, 0, opt(54));
        callout(d, wi(capPt(1, MARGIN * 0.5)), 'Margin', '', 0, 0, opt(46));
        callout(d, wi(capPt(1.004, -0.95)), 'Full diameter', 'minor', 0, 0, opt(40));
      } else if (id === 'land') {
        callout(d, wi(capPt(RB * 0.98, 0.62)), 'Land', 'hl', 0, 0, opt(48));
        callout(d, wi(capPt(RB, LAND)), 'Heel', '', 0, 0, opt(46));
        callout(d, wi(capPt(1, MARGIN * 0.5)), 'Margin', '', 0, 0, opt(46));
        callout(d, wi(capPt(0.62, -1.05)), 'Flute', 'minor', 0, 0, opt(40));
      } else if (id === 'web') {
        callout(d, wi(capPt(0.62, -1.05)), 'Flute', 'minor', 0, 0, opt(44));
        callout(d, wi(capPt(0.62, -1.05 + Math.PI)), 'Flute', 'minor', 0, 0, opt(44));
      }
    }

    const OVERLAYS = {
      overview(d) {
        const shR = P.shank === 'straight' ? R - 0.05 : 0.33;
        dimAxial(d, shankEnd(), 0, R + 1.3, 'Shank', shR, R);
        dimAxial(d, 0, APEX, R + 1.3, 'Body', R, 0.02);
        dimAxial(d, 0, ZA, R + 0.65, 'Flute length', R, R);
        dimAxial(d, shankEnd(), APEX, -(R + 0.8), 'Overall length', shR, 0.02);
        callout(d, WO(0, 0, APEX), 'Point', 'hl', 34, 26);
      },
      shank(d) {
        const rx = Math.cos(fr.thOut), ry = Math.sin(fr.thOut);
        if (P.shank === 'straight') {
          dimDia(d, -1.8);
          dimDia(d, 2.4);
          callout(d, WO(rx * R, ry * R, -2.6), 'Straight shank', 'hl', -20, 46);
        } else {
          callout(d, WO(rx * 0.5, ry * 0.5, -1.8), 'Taper shank', 'hl', -10, 50);
          callout(d, WO(0, 0, -3.62), 'Tang', '', -46, -40);
          dimDia(d, 2.4);
        }
      },
      flutes(d) {
        dimAxial(d, 0, ZA, R + 0.7, 'Flute length', R, R);
        callout(d, wi(helixAnchor(PT0 + 0.08, null, 3.6)), 'Flute', 'hl', -34, 58);
      },
      margin(d) {
        callout(d, wi(helixAnchor(MARGIN * 0.5, 1.0, 5.3)), 'Margin', 'hl', -26, -56);
        callout(d, wi(helixAnchor(0.85, RB, 4.2)), 'Body clearance', 'minor', -20, 56);
      },
      clearance(d) { sectionCommon(d, 'clearance'); },
      land(d) { sectionCommon(d, 'land'); },
      web(d) {
        sectionCommon(d, 'web');
        const w = webAt(P.cut), pt = -Math.acos(w);
        d.line(wi(capPt(w, pt)), wi(capPt(w, pt + Math.PI)), 'dm', { arrows: true });
        callout(d, wi(capPt(0, 0)), `Web thickness ${w.toFixed(2)} D`, 'hl', 0, 0, { n: true, off: [78, 62] });
      },
      helix(d) {
        d.line(WO(0, 0, shankEnd() - 0.35), WO(0, 0, APEX + 0.45), 'cl');
        callout(d, WO(0, 0, 1.1), 'Drill axis', 'dimtxt', 0, 52);
        const Q = helixAnchor(0, 1.0, 3.4);
        const qx = Q[0], qy = Q[1], qz = Q[2];
        const a = fr.thIn;
        let tx = -R * K * Math.sin(a), ty = R * K * Math.cos(a), tz = 1;
        const tl = Math.hypot(tx, ty, tz);
        tx /= tl;
        ty /= tl;
        tz /= tl;
        const L = 1.35;
        d.line(WI(qx, qy, qz - L), WI(qx, qy, qz + L), 'ref');
        d.line(WI(qx - tx * L, qy - ty * L, qz - tz * L), WI(qx + tx * L, qy + ty * L, qz + tz * L), 'hx');
        const el = Math.hypot(tx, ty) || 1, ex = tx / el, ey = ty / el;
        const ang = P.helix * DEG, pts = [];
        for (let i = 0; i <= 24; i++) {
          const s = (ang * i) / 24;
          pts.push(WI(qx + ex * 0.9 * Math.sin(s), qy + ey * 0.9 * Math.sin(s), qz + 0.9 * Math.cos(s)));
        }
        d.path(pts, 'arc');
        callout(d, WI(qx + ex * 0.9 * Math.sin(ang / 2), qy + ey * 0.9 * Math.sin(ang / 2), qz + 0.9 * Math.cos(ang / 2)), `Helix angle ${P.helix}°`, 'dimtxt hl', 36, 58);
        // lead of helix along the top silhouette
        const thUp = Math.atan2(fr.uy, fr.ux) - spin;
        const z0 = RUNOUT + 0.25;
        const n = Math.ceil((K * z0 - thUp) / Math.PI);
        const z1 = (thUp + n * Math.PI) / K, lead = TAU / K, z2 = z1 + lead;
        if (z2 < ZA - 0.05) {
          const off = R + 0.55, cu = Math.cos(thUp), su = Math.sin(thUp);
          d.line(WI(cu * R, su * R, z1), WI(cu * (off + 0.12), su * (off + 0.12), z1), 'ext');
          d.line(WI(cu * R, su * R, z2), WI(cu * (off + 0.12), su * (off + 0.12), z2), 'ext');
          d.line(WI(cu * off, su * off, z1), WI(cu * off, su * off, z2), 'dm', { arrows: true });
          d.label(WI(cu * off, su * off, (z1 + z2) / 2), 'Lead of helix', 'dimtxt');
        } else {
          callout(d, WO(0, 0, ZA), `Lead ${(Math.PI / Math.tan(P.helix * DEG)).toFixed(1)} D, longer than the flutes`, 'dimtxt', -60, -70);
        }
      },
      'point-angle'(d) {
        const h = (P.point * DEG) / 2, ux = fr.ux, uy = fr.uy;
        const po = (du, dz) => WO(ux * du, uy * du, APEX + dz);
        d.line(po(0, 0.45), po(0, -1.9), 'cl');
        d.line(po(0, 0), po(Math.sin(h) * 1.25, -Math.cos(h) * 1.25), 'dm');
        d.line(po(0, 0), po(-Math.sin(h) * 1.25, -Math.cos(h) * 1.25), 'dm');
        const arc = (r, s0, s1, cls) => {
          const pts = [];
          for (let i = 0; i <= 40; i++) {
            const s = s0 + ((s1 - s0) * i) / 40;
            pts.push(po(r * Math.sin(s), -r * Math.cos(s)));
          }
          d.path(pts, cls);
        };
        arc(0.95, -h, h, 'arc');
        arc(0.58, 0, h, 'dm');
        d.label(po(0, -1.12), `${P.point}° included`, 'dimtxt hl');
        d.label(po(0.62 * Math.sin(h / 2) + 0.18, -0.4 * Math.cos(h / 2)), `${(P.point / 2).toFixed(P.point % 2 ? 1 : 0)}°`, 'dimtxt');
        d.label(po(0, -1.75), 'Axis', 'dimtxt');
      },
      'lip-clearance'(d) {
        let best = 0, bd = -2;
        for (const hh of [0, 1]) {
          const a = -hh * Math.PI + K * ZA, dd = Math.cos(a - fr.thIn);
          if (dd > bd) {
            bd = dd;
            best = hh;
          }
        }
        const s = best * Math.PI, a = -s + K * ZA;
        const A = mpos(1, s, ZA), rel = P.relief * DEG;
        const tx = Math.sin(a), ty = -Math.cos(a);
        const ax = A[0], ay = A[1], az = A[2];
        d.line(WI(ax, ay, az), WI(ax + tx * 0.7, ay + ty * 0.7, az), 'ref');
        d.line(WI(ax, ay, az), WI(ax + tx * 0.7 * Math.cos(rel), ay + ty * 0.7 * Math.cos(rel), az - 0.7 * Math.sin(rel)), 'hx');
        const pts = [];
        for (let i = 0; i <= 24; i++) {
          const t = (rel * i) / 24;
          pts.push(WI(ax + tx * 0.52 * Math.cos(t), ay + ty * 0.52 * Math.cos(t), az - 0.52 * Math.sin(t)));
        }
        d.path(pts, 'arc');
        callout(d, WI(ax + tx * 0.5 * Math.cos(rel / 2), ay + ty * 0.5 * Math.cos(rel / 2), az - 0.5 * Math.sin(rel / 2)), `${P.relief}° lip clearance`, 'dimtxt hl', -92, -6);
        callout(d, wi(lipPoint(0.45, s)), 'Cutting lip', 'hl', -40, -44);
        const fp = mpos(0.62, 0.7 + s, flankZ(0.62, 0.7 + s));
        callout(d, wi(fp), 'Relieved surface', 'minor', 44, 40);
      },
      lips(d) {
        const c = [...WI(0, 0, APEX)];
        callout(d, wi(lipPoint(0.5, 0)), 'Lip', 'hl', 0, 0, { auto: true, c, len: 58 });
        callout(d, wi(mpos(1, Math.PI, ZA)), 'Outer corner', '', 0, 0, { auto: true, c, len: 48 });
        callout(d, wi(mpos(RHO_J, PSI_J, flankZ(RHO_J, PSI_J))), 'Chisel edge corner', '', 0, 0, { auto: true, c, len: 92 });
        callout(d, WI(0, 0, APEX), 'Chisel edge', 'hl', -66, -70);
      },
    };
    OVERLAYS.answer = OVERLAYS.overview;

    /* ---------------- build + rebuild management ---------------- */
    derive();
    buildShank();
    buildBody();
    buildCap();
    recolor();
    applyVisibility();
    let dirtyShank = false, dirtyBody = false, dirtyCap = false;

    const steps = TOPICS.map((t) => ({
      id: t.id, chip: t.chip, group: t.group, eyebrow: t.eyebrow, title: t.title,
      cam: () => camFor(t),
      html: t.html,
      onEnter: () => enter(t.id),
    }));

    const bandOf = () => (P.helix <= 19 ? 'low' : P.helix >= 27 ? 'high' : '');
    const halfTxt = () => `${(P.point / 2).toFixed(P.point % 2 ? 1 : 0)}°`;
    const pointVerdict = () => (P.point < 114 ? ['Sharper point: softer material', 'warn'] : P.point > 122 ? ['Larger point angle: harder material', 'warn'] : ['General purpose point', 'ok']);
    const reliefVerdict = () => (P.relief < 9 ? ['Small clearance: edge may rub and bind', 'warn'] : P.relief > 14 ? ['Large clearance: aggressive, weak edge', 'warn'] : ['Clearance near the slide value', 'ok']);

    return {
      steps,

      onParam(key) {
        if (key === 'shank') dirtyShank = true;
        else if (key === 'cut') {
          dirtyCap = true;
          clipPlane.constant = outer.position.x + P.cut;
        } else {
          derive();
          dirtyBody = true;
          dirtyCap = true;
        }
      },

      update(dt) {
        if (dirtyShank || dirtyBody || dirtyCap) {
          if (dirtyShank) buildShank();
          if (dirtyBody) buildBody();
          buildCap();
          recolor();
          applyVisibility();
          if (TOP().spinTo) {
            spin = nearestMod(wantedSpin(TOP()), spin);
            spinTarget = null;
          }
          dirtyShank = dirtyBody = dirtyCap = false;
        }
        if (spinTarget !== null) {
          const dd = spinTarget - spin;
          if (dt === 0) spin = spinTarget;
          else spin += dd * Math.min(1, dt * 4);
          if (Math.abs(spinTarget - spin) < 1e-3) {
            spin = spinTarget;
            spinTarget = null;
          }
        } else if (spinOn) spin += dt * SPIN_SPEED;
        inner.rotation.z = spin;
        if (chips.visible && dt > 0) updateParticles(dt);
      },

      overlay(d, step) {
        outer.updateMatrixWorld(true);
        tmpV.copy(camera.position);
        outer.worldToLocal(tmpV);
        fr.thOut = Math.atan2(tmpV.y, tmpV.x);
        tmpV.copy(camera.position);
        inner.worldToLocal(tmpV);
        fr.thIn = Math.atan2(tmpV.y, tmpV.x);
        let ux = -Math.sin(fr.thOut), uy = Math.cos(fr.thOut);
        if (uy < 0) {
          ux = -ux;
          uy = -uy;
        }
        fr.ux = ux;
        fr.uy = uy;
        OVERLAYS[step]?.(d);
      },

      hud() {
        const id = TOP().id;
        const rows = [['Helix angle', `${P.helix}°`], ['Point angle', `${P.point}° (${halfTxt()} each side)`], ['Lip clearance', `${P.relief}°`]];
        if (TOP().section) rows.push(['Web at cut', `${webAt(P.cut).toFixed(2)} D`]);
        let verdict;
        if (id === 'helix') verdict = bandOf() === 'low' ? ['Low spiral: hard, brittle material', 'warn'] : bandOf() === 'high' ? ['High spiral: soft material', 'ok'] : ['Between the slide ranges', 'warn'];
        else if (id === 'point-angle') verdict = pointVerdict();
        else if (id === 'lip-clearance') verdict = reliefVerdict();
        return { status: TOP().title, rows, verdict };
      },

      readouts() {
        const lead = Math.PI / Math.tan(P.helix * DEG);
        const band = bandOf();
        return {
          web: `${webAt(P.cut).toFixed(2)} D (${(webAt(P.cut) * 100).toFixed(0)}% of the diameter)`,
          lead: `${lead.toFixed(1)} D`,
          helixtag: band === 'low' ? 'Low spiral → harder, brittle material' : band === 'high' ? 'High spiral → softer material' : 'Between the two ranges on the slide',
          half: halfTxt(),
          pointtag: pointVerdict()[0],
          relieftag: P.relief < 9 ? 'Small: well-supported edge, but the surface behind it may rub and bind' : P.relief > 14 ? 'Large: aggressive cut, little support behind the edge' : 'Close to the 12° shown on slide 150',
          lip: `${lipLength().toFixed(2)} D`,
          band,
        };
      },

      format(key, v) {
        if (key === 'helix' || key === 'point' || key === 'relief') return `${v}°`;
        if (key === 'cut') return `${(APEX - v).toFixed(1)} D from the point`;
        return null;
      },
    };
  },
};
