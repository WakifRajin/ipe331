// Effect lab: generating vs forming (slides 3-7). The same contour is cut by a pointed tool following a trajectory
// (generating) and by a form tool whose edge is the reverse of the part (forming); thread cutting and slot milling
// show the two combined. Model units: the work is 10 units long, 1 unit is about 4 mm; error amplitudes are exaggerated.
const PI = Math.PI;

export default {
  id: 'generating-forming',
  chapter: 'intro',
  title: 'Generating vs forming',
  eyebrow: 'Introduction · slides 3–7',
  sub: 'Cut the same contour two ways: let a pointed tool trace it (generating) or press a tool that already has its shape (forming). Then combine both in a thread and a slot.',
  blurb: 'Shape from the tool path (generating) or from the tool edge (forming), the combined cases (thread cutting, slot milling), and the accuracy and force each one depends on.',
  qs: ['2023-24_5d', '2017-18_5a', '2016-17_5a', '2012-13_5a'],
  params: { shape: 'contour', pitch: 2, err: 0, len: 20, slotw: 8, slotL: 30, cls: 'rot' },

  build({ THREE, scene, P, kit, flyTo }) {
    const { M } = kit;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const ease = (s) => s * s * (3 - 2 * s);
    const Lw = 10, R0 = 1.5, U0 = 0.08;
    const GZ = -7, FZ = 7;
    const NR = 96, SEG = 40;
    const cosT = new Float32Array(SEG + 1), sinT = new Float32Array(SEG + 1);
    for (let j = 0; j <= SEG; j++) { cosT[j] = Math.cos((2 * PI * j) / SEG); sinT[j] = Math.sin((2 * PI * j) / SEG); }

    // ---------- shape functions (units) ----------
    const bump = (u, c, w) => Math.exp(-(((u - c) / w) ** 2));
    const shapeR = (u) => {
      if (u < U0) return R0;
      const s = P.shape;
      if (s === 'straight') return 1.0;
      if (s === 'taper') return 1.15 - 0.6 * ((u - U0) / (1 - U0));
      return 1.0 - 0.38 * bump(u, 0.38, 0.09) + 0.3 * bump(u, 0.74, 0.1);
    };
    const errAmp = () => P.err * 3; // mm -> exaggerated units
    const genR = (u) => (u < U0 ? R0 : clamp(shapeR(u) + errAmp() * Math.sin(2 * PI * u * 3.3 + 0.7), 0.3, R0 - 0.02));
    const formR = (u) => (u < U0 ? R0 : clamp(shapeR(u) - errAmp() * 2 * bump(u, 0.55, 0.05), 0.3, R0 - 0.02));
    const SHAPE_NAME = { straight: 'Straight turning', taper: 'Taper turning', contour: 'Contour turning' };
    const SHAPE_FORMED = { straight: 'Plain cylinder', taper: 'Cone', contour: 'Profile' };

    // ---------- lathe-style work rig ----------
    function makeRig(z) {
      const g = new THREE.Group();
      g.position.z = z;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(NR * (SEG + 1) * 3);
      for (let i = 0; i < NR; i++) for (let j = 0; j <= SEG; j++) pos[(i * (SEG + 1) + j) * 3] = (Lw * i) / (NR - 1);
      const idx = [];
      for (let i = 0; i < NR - 1; i++) {
        for (let j = 0; j < SEG; j++) {
          const a = i * (SEG + 1) + j, b = a + 1, c = a + SEG + 1, d = c + 1;
          idx.push(a, b, c, b, d, c);
        }
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(pos.length), 3));
      geo.setIndex(idx);
      const mat = new THREE.MeshStandardMaterial({ color: 0xdfe5ea, roughness: 0.25, metalness: 0.8 });
      const work = new THREE.Mesh(geo, mat);
      work.frustumCulled = false;
      work.castShadow = work.receiveShadow = true;
      const cap = new THREE.Mesh(new THREE.CircleGeometry(1, 40).rotateY(PI / 2), M.workCut);
      cap.position.x = Lw;
      const chuck = kit.cyl(1, 2.4, M.darkSteel, { axis: 'x', seg: 40 });
      chuck.scale.set(1, 2.5, 2.5);
      chuck.position.x = -1.2;
      const jaws = [0, 1, 2].map((k) => {
        const jw = kit.box(1.2, 0.8, 0.7, M.steel);
        const a = (k * 2 * PI) / 3;
        jw.position.set(-0.6, 1.9 * Math.cos(a), 1.9 * Math.sin(a));
        jw.rotation.x = a;
        return jw;
      });
      const chuckG = new THREE.Group();
      chuckG.add(chuck, ...jaws);
      const head = kit.box(3, 5.4, 4.2, M.paint);
      head.position.set(-3.9, -0.2, 0);
      const spin = kit.spinArrow(1, M.vColor, { axis: 'x', arc: PI * 1.4, tube: 0.05 });
      spin.position.x = Lw + 1.2;
      spin.scale.set(1, R0 + 0.5, R0 + 0.5);
      g.add(work, cap, chuckG, head, spin);
      scene.add(g);
      return { g, geo, pos, work, cap, chuckG, rad: new Float32Array(NR), ring: new Float32Array(NR) };
    }
    const setRadii = (rig, rad) => {
      const pos = rig.pos;
      for (let i = 0; i < NR; i++) {
        const r = rad[i];
        const o = i * (SEG + 1) * 3;
        for (let j = 0; j <= SEG; j++) {
          pos[o + j * 3 + 1] = r * cosT[j];
          pos[o + j * 3 + 2] = r * sinT[j];
        }
      }
      rig.geo.attributes.position.needsUpdate = true;
      rig.geo.computeVertexNormals();
      rig.cap.scale.set(1, Math.max(rad[NR - 1], 0.01), Math.max(rad[NR - 1], 0.01));
    };
    const gen = makeRig(GZ);
    const frm = makeRig(FZ);
    const gArr = new Float32Array(NR), fArr = new Float32Array(NR);

    // generating tool (pointed)
    const gTool = new THREE.Group();
    const gCone = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.9, 16).rotateX(PI), M.carbide);
    gCone.position.y = 0.45;
    const gShank = kit.box(0.5, 1.8, 0.6, M.darkSteel);
    gShank.position.y = 1.8;
    gTool.add(gCone, gShank);
    gTool.position.z = GZ;
    scene.add(gTool);
    // forming tool (edge = reverse of part)
    const fTool = new THREE.Mesh(new THREE.BufferGeometry(), M.carbide);
    fTool.castShadow = true;
    scene.add(fTool);
    const NE = 40;
    const edgeBase = new Float32Array(NE);
    const edgePts = Array.from({ length: NE }, (_, i) => [U0 * Lw + ((1 - U0) * Lw * i) / (NE - 1), 0, FZ]);
    const finPts = Array.from({ length: NE }, (_, i) => [U0 * Lw + ((1 - U0) * Lw * i) / (NE - 1), 0, FZ]);
    const trajPts = Array.from({ length: NE }, (_, i) => [U0 * Lw + ((1 - U0) * Lw * i) / (NE - 1), 0, GZ]);
    let minRe = 1;

    function rebuildShapes() {
      for (let i = 0; i < NR; i++) {
        const u = i / (NR - 1);
        gArr[i] = genR(u);
        fArr[i] = formR(u);
      }
      minRe = R0;
      for (let k = 0; k < NE; k++) {
        const u = U0 + ((1 - U0) * k) / (NE - 1);
        edgeBase[k] = formR(u);
        minRe = Math.min(minRe, edgeBase[k]);
        trajPts[k][1] = genR(u);
        finPts[k][1] = edgeBase[k];
      }
      const shp = new THREE.Shape();
      shp.moveTo(U0 * Lw, edgeBase[0]);
      for (let k = 1; k < NE; k++) shp.lineTo(edgePts[k][0], edgeBase[k]);
      shp.lineTo(Lw + 0.15, edgeBase[NE - 1]);
      shp.lineTo(Lw + 0.15, R0 + 3.4);
      shp.lineTo(U0 * Lw - 0.15, R0 + 3.4);
      shp.lineTo(U0 * Lw - 0.15, edgeBase[0]);
      shp.closePath();
      const geoT = new THREE.ExtrudeGeometry(shp, { depth: 1.0, bevelEnabled: false }).translate(0, 0, -0.5);
      fTool.geometry.dispose();
      fTool.geometry = geoT;
      fTool.position.z = FZ;
    }

    // ---------- thread rig ----------
    const TZ = 0;
    const XL = 9.0, XE = 0.9, RT = 1.2, NS = 6;
    const thr = new THREE.Group();
    thr.position.z = TZ;
    const tStock = kit.cyl(1, 1, M.work, { axis: 'x', seg: 48 });
    tStock.scale.set(1, RT, RT);
    const tStripe = [0, 2.1, 4.2].map((a) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(1, 0.07, 0.12), M.darkSteel);
      m.position.set(0, (RT + 0.02) * Math.cos(a), (RT + 0.02) * Math.sin(a));
      m.rotation.x = -a;
      return m;
    });
    const tStockG = new THREE.Group();
    tStockG.add(tStock, ...tStripe);
    const tMat = new THREE.MeshStandardMaterial({ color: 0xe8edf0, roughness: 0.28, metalness: 0.85 });
    const tMesh = new THREE.Mesh(new THREE.BufferGeometry(), tMat);
    tMesh.castShadow = true;
    const tCap = new THREE.Mesh(new THREE.CircleGeometry(1, 40).rotateY(PI / 2), M.workCut);
    tCap.position.x = XL;
    const tChuck = kit.cyl(1, 2.4, M.darkSteel, { axis: 'x', seg: 40 });
    tChuck.scale.set(1, 2.3, 2.3);
    tChuck.position.x = -1.2;
    const tChuckG = new THREE.Group();
    tChuckG.add(tChuck);
    [0, 1, 2].forEach((k) => {
      const jw = kit.box(1.2, 0.8, 0.7, M.steel);
      const a = (k * 2 * PI) / 3;
      jw.position.set(-0.6, 1.7 * Math.cos(a), 1.7 * Math.sin(a));
      jw.rotation.x = a;
      tChuckG.add(jw);
    });
    const tHead = kit.box(3, 5, 4, M.paint);
    tHead.position.set(-3.9, -0.2, 0);
    const vTool = new THREE.Group();
    const vShape = new THREE.Shape();
    vShape.moveTo(0, 0);
    vShape.lineTo(Math.tan(PI / 6), 1);
    vShape.lineTo(-Math.tan(PI / 6), 1);
    vShape.closePath();
    const vWedge = new THREE.Mesh(new THREE.ExtrudeGeometry(vShape, { depth: 1, bevelEnabled: false }).translate(0, 0, -0.5), M.carbide);
    const vShank = kit.box(1, 1, 1, M.darkSteel);
    vTool.add(vWedge, vShank);
    const tSpin = kit.spinArrow(1, M.vColor, { axis: 'x', arc: PI * 1.4, tube: 0.05 });
    tSpin.position.x = XL + 1.2;
    tSpin.scale.set(1, RT + 0.5, RT + 0.5);
    thr.add(tStockG, tMesh, tCap, tChuckG, tHead, tSpin);
    scene.add(thr, vTool);

    let tLastBuild = 0, tDirty = true, tRows = 2, tDx = 0.1;
    const pvOf = () => P.pitch * 0.25;
    const profile = (s) => (s < 0.08 ? 0 : s < 0.434 ? (s - 0.08) / 0.354 : s < 0.646 ? 1 : (1 - s) / 0.354);
    function rebuildThread() {
      tDirty = false;
      tLastBuild = performance.now();
      const pv = pvOf(), dxx = pv / NS, depth = 0.6134 * pv;
      tDx = dxx;
      tRows = Math.floor((XL - XE) / dxx) + 1;
      const pos = new Float32Array(tRows * (SEG + 1) * 3);
      let k = 0;
      for (let i = 0; i < tRows; i++) {
        const x = XL - i * dxx;
        for (let j = 0; j <= SEG; j++) {
          const s = (i / NS + j / SEG) % 1;
          const r = RT - depth * profile(s);
          pos[k++] = x;
          pos[k++] = r * cosT[j];
          pos[k++] = r * sinT[j];
        }
      }
      const index = new Uint32Array((tRows - 1) * SEG * 6);
      let m = 0;
      for (let i = 0; i < tRows - 1; i++) {
        for (let j = 0; j < SEG; j++) {
          const a = i * (SEG + 1) + j, b = a + 1, c = a + SEG + 1, d = c + 1;
          index[m++] = a; index[m++] = c; index[m++] = b;
          index[m++] = b; index[m++] = c; index[m++] = d;
        }
      }
      const g2 = new THREE.BufferGeometry();
      g2.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g2.setIndex(new THREE.BufferAttribute(index, 1));
      g2.computeVertexNormals();
      tMesh.geometry.dispose();
      tMesh.geometry = g2;
      tCap.scale.set(1, RT - depth, RT - depth);
      const h = depth;
      vWedge.scale.set(h * 1.25, h * 1.25, 0.9);
      vShank.scale.set(1.0, 1.8, 0.9);
      vShank.position.y = h * 1.25 + 0.9;
    }

    // ---------- slot rig ----------
    const SZ = 0, BX = 5;
    const slotG = new THREE.Group();
    const blockG = new THREE.Group();
    const block = kit.box(13, 1.3, 4.6, M.work);
    block.position.y = -0.65;
    const table = kit.box(15.5, 0.8, 6.4, M.castIron);
    table.position.y = -1.7;
    const slotMat = M.black;
    const slotBody = new THREE.Mesh(new THREE.BoxGeometry(1, 0.03, 1), slotMat);
    const slotCapA = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.03, 32), slotMat);
    const slotCapB = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.03, 32), slotMat);
    for (const m of [slotBody, slotCapA, slotCapB]) m.position.y = 0.012;
    blockG.add(block, table, slotBody, slotCapA, slotCapB);
    const cutter = new THREE.Group();
    const cBody = kit.cyl(1, 1, M.carbide, { seg: 32 });
    const cShaft = kit.cyl(0.5, 3.5, M.darkSteel, { seg: 20 });
    cShaft.position.y = 2.5;
    const flutes = [0, 1, 2, 3].map((k) => {
      const f = new THREE.Mesh(new THREE.BoxGeometry(1, 0.02, 0.12), M.darkSteel);
      f.rotation.y = (k * PI) / 4;
      return f;
    });
    cutter.add(cBody, cShaft, ...flutes);
    const column = kit.box(2.4, 8, 2.4, M.paintDark);
    column.position.set(BX, 5.6, -3.6);
    const arm = kit.box(1.4, 1.2, 3.6, M.paint);
    arm.position.set(BX, 5.0, -2.0);
    slotG.add(blockG, cutter);
    slotG.position.z = SZ;
    scene.add(slotG, column, arm);
    const DEPTH = 0.45;

    // ---------- state ----------
    let curStep = 'classes', spinA = 0, shakeT = 0;
    const gs = { p: 0, hold: 0, run: true };
    const fs = { p: 0, hold: 0, run: true };
    const ts = { rev: 0, hold: 0, run: true };
    const ss = { p: 0, hold: 0, run: true };
    let sDirty = true;
    const forceGen = () => 2000 * 0.2 * 1.0; // N: K f d, K = 2000 N/mm2, f = 0.2 mm/rev, d = 1 mm
    const forceForm = () => 2000 * 0.05 * P.len; // N: K f_r len, f_r = 0.05 mm/rev
    const stepVis = (s) => ({
      gen: ['classes', 'gen', 'compare', 'effects', 'answer'].includes(s),
      form: ['form', 'compare', 'effects', 'answer'].includes(s),
      thr: s === 'thread',
      slot: s === 'slot' || s === 'classes',
    });

    function layoutSlot() {
      sDirty = false;
      const w = P.slotw / 5, tr = (P.slotL / 5);
      const rw = w / 2;
      cBody.scale.set(rw, 1.2, rw);
      cBody.position.y = -DEPTH + 0.6;
      cShaft.scale.set(1, 1, 1);
      flutes.forEach((f) => { f.scale.x = rw * 1.96; f.position.y = -DEPTH + 1.21; });
      cutter.position.set(BX, 0, 0);
      slotCapA.scale.set(rw, 1, rw);
      slotCapB.scale.set(rw, 1, rw);
      void tr;
    }

    const cam = {
      classes: { position: [5, 11, 13], target: [5, 0, -3.5] },
      rot: { position: [5.5, 5, 3], target: [5.5, 0.2, GZ] },
      prism: { position: [5, 6, 7.5], target: [5, 0, 0] },
      gen: { position: [5.5, 5, GZ + 10], target: [5.5, 0.2, GZ] },
      form: { position: [5.5, 5, FZ + 10], target: [5.5, 0.2, FZ] },
      compare: { position: [5.5, 14, 19], target: [5.5, 0, 0] },
      thread: { position: [5, 5, 10], target: [5, 0, 0] },
      slot: { position: [5, 8, 9], target: [5, -0.3, 0] },
    };
    const shapeSeg = `<div class="seg"><button type="button" data-set="shape:straight">Straight</button><button type="button" data-set="shape:taper">Taper</button><button type="button" data-set="shape:contour">Contour</button></div>`;

    // ---------- plots ----------
    const frame = (g, w, h, c) => {
      g.strokeStyle = c.line; g.lineWidth = 1;
      g.beginPath(); g.moveTo(26, 10); g.lineTo(26, h - 22); g.lineTo(w - 10, h - 22); g.stroke();
    };
    const tx = (g, s, x, y, col) => { g.fillStyle = col; g.fillText(s, x, y); };
    const profileLine = (g, w, h, fn, col, yOff = 0, mirror = false) => {
      g.strokeStyle = col; g.lineWidth = 1.8; g.beginPath();
      for (let i = 0; i <= 60; i++) {
        const u = U0 + ((1 - U0) * i) / 60;
        const x = 26 + ((u - U0) / (1 - U0)) * (w - 40);
        const y = (mirror ? 1 : -1) * fn(u) * 38 + yOff;
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
    };

    return {
      legend: [['var(--v)', 'Work rotation'], ['var(--f)', 'Tool path / table feed'], ['var(--d)', 'Plunge (radial)']],
      live: true,
      steps: [
        {
          id: 'classes', chip: 'Part classes', group: 'Basics', eyebrow: 'Introduction · slide 3', title: 'Two families of machined parts',
          cam: cam.classes, plot: false,
          html: () => `
            <p>Machined parts fall into two families, and each is made with a different arrangement of motions:</p>
            <div class="seg"><button type="button" data-set="cls:rot">Rotational</button><button type="button" data-set="cls:prism">Prismatic</button></div>
            <div class="duo">
              <div data-band="rot"><h3>Rotational</h3><p>Cylindrical or disc-like parts. The <b>work rotates</b> (V) and a single-point tool moves along or across it: turning, boring, facing. Drilling is similar, but the tool usually rotates.</p></div>
              <div data-band="prism"><h3>Prismatic</h3><p>Block or plate-like parts. The <b>cutter rotates</b> (milling) or the tool reciprocates (shaping, planing) while the work is fed in straight lines.</p></div>
            </div>
            <p>In both families the finished geometry comes from two things: the <mark>relative motion</mark> of tool and work, and the <mark>shape of the cutting tool</mark>. Using the first gives <b>generating</b>; using the second gives <b>forming</b>.</p>
            <p class="key"><span class="key-tag">Remember</span>Rotational: work spins, tool translates. Prismatic: cutter spins or reciprocates, work feeds in lines.</p>`,
        },
        {
          id: 'gen', chip: 'Generating', group: 'The two ways', eyebrow: 'Introduction · slide 5', title: 'Generating: the tool path makes the shape',
          cam: cam.gen,
          html: () => `
            <p>In <mark>generating</mark> the work-part geometry is determined by the <mark>feed trajectory of the cutting tool</mark>. The tool itself is only a point; wherever it travels, the surface follows.</p>
            <div class="ctl">${shapeSeg}
              <p class="ro">Trajectory: <b data-ro="traj"></b></p>
              <p class="ro">Machine axes working together: <b data-ro="axes"></b></p>
            </div>
            <ul>
              <li><b>Straight turning</b>: feed parallel to the axis, one motion.</li>
              <li><b>Taper turning</b>: longitudinal and cross feed together, in a fixed ratio.</li>
              <li><b>Contour turning</b>: the cross feed keeps changing so the tool tip draws the profile. Peripheral and profile milling work the same way.</li>
            </ul>
            <p>Watch the blue and green arrows at the tip: they are the two feed motions, and their ratio is the slope of the path.</p>
            <p class="exam">Asked: TF 2023-24 Q.5(d), 2017-18 Q.5(a), 2016-17 Q.5(a), 2012-13 Q.5(a).</p>
            <p class="key"><span class="key-tag">Remember</span>Generating: simple (point) tool, shape = feed trajectory, any shape with the same tool. Examples: straight, taper and contour turning; peripheral and profile milling.</p>`,
        },
        {
          id: 'form', chip: 'Forming', group: 'The two ways', eyebrow: 'Introduction · slide 6', title: 'Forming: the tool edge is the shape',
          cam: cam.form,
          html: () => `
            <p>In <mark>forming</mark> the shape of the part is created by the <mark>geometry of the cutting tool</mark>: the cutting edge is the <b>reverse (mirror image) of the shape to be produced</b>. The tool is simply plunged in; no path is traced.</p>
            <div class="ctl">${shapeSeg}
              <p class="ro">Tool edge: <b data-ro="edge"></b></p>
              <p class="ro">Tool motion: <b data-ro="fmot"></b></p>
            </div>
            <ul>
              <li><b>Form turning</b>: edge ground to the profile, fed radially.</li>
              <li><b>Drilling</b>: the drill point and diameter give the hole, fed along its axis.</li>
              <li><b>Broaching</b>: the broach teeth carry the shape; one straight pull.</li>
            </ul>
            <p>The amber outline on the model is the tool edge; the dashed line is the part profile it produces.</p>
            <p class="key"><span class="key-tag">Remember</span>Forming: the tool has the reverse of the part shape and just plunges. Examples: form turning, drilling, broaching.</p>`,
        },
        {
          id: 'compare', chip: 'Same shape, two ways', group: 'The two ways', eyebrow: 'Introduction · slides 4–6', title: 'The same contour both ways',
          cam: cam.compare,
          html: () => `
            <p>Pick any contour: the back rig <b>generates</b> it, the front rig <b>forms</b> it.</p>
            <div class="ctl">${shapeSeg}</div>
            <div class="table-wrap"><table class="cmp">
              <tr><th></th><th>Generating</th><th>Forming</th></tr>
              <tr><td>Shape comes from</td><td>Feed trajectory</td><td>Tool edge geometry</td></tr>
              <tr><td>Tool</td><td>Simple, point-like</td><td>Special, reverse of the part</td></tr>
              <tr><td>Motions</td><td data-ro="axes"></td><td data-ro="fmot"></td></tr>
              <tr><td>Flexibility</td><td>Any shape, same tool</td><td>One tool per shape</td></tr>
            </table></div>
            <p class="key"><span class="key-tag">Remember</span>Generating: shape from motion. Forming: shape from the tool.</p>`,
        },
        {
          id: 'effects', chip: 'Accuracy and force', group: 'Effects', eyebrow: 'Introduction · slide 4', title: 'What decides accuracy, force and length',
          cam: cam.compare,
          html: () => `
            <p>Raise the errors and see where each one shows up.</p>
            <div class="ctl">
              <div class="ctl-row"><label for="lab-err">Machine-motion / tool error</label><output class="val" data-out="err"></output></div>
              <input id="lab-err" type="range" min="0" max="0.1" step="0.005" data-key="err">
              <div class="ctl-row"><label for="lab-len">Formed length (edge in cut)</label><output class="val" data-out="len"></output></div>
              <input id="lab-len" type="range" min="5" max="80" step="1" data-key="len">
              <div class="presets"><button class="pbtn" type="button" data-set="err:0,len:20">Ideal</button><button class="pbtn" type="button" data-set="err:0.06,len:20">Worn machine</button><button class="pbtn" type="button" data-set="err:0.03,len:70">Long form cut</button></div>
              <p class="ro">Generating force <b data-ro="fg"></b> · forming force <b data-ro="ff"></b></p>
            </div>
            <ul>
              <li><b>Generating accuracy</b> depends on the machine motions: slideway straightness, lead-screw error, backlash (see the waviness on the back rig).</li>
              <li><b>Forming accuracy</b> depends on the tool: any error or wear in the edge is copied onto every part (see the dent on the front rig).</li>
              <li><b>Forming needs higher force and rigidity</b> because the whole edge cuts at once, so it is limited to short lengths of cut (chatter, power).</li>
            </ul>
            <p class="note">Force = K·f·(width in cut) with K = 2000 N/mm². Generating: f 0.2 mm/rev, d 1 mm. Forming: radial feed 0.05 mm/rev over the formed length. Errors are drawn exaggerated.</p>
            <p class="key"><span class="key-tag">Remember</span>Generating: accuracy from the machine motions. Forming: accuracy from the tool; high force, short length.</p>`,
        },
        {
          id: 'thread', chip: 'Thread cutting', group: 'Combined', eyebrow: 'Introduction · slide 7', title: 'Combined: thread cutting on a lathe',
          cam: cam.thread,
          html: () => `
            <p>Thread cutting uses <b>both</b> ideas. The <mark>thread form</mark> (the 60° V groove) is <b>formed</b> by the tool. The <mark>helix</mark> is <b>generated</b> by the motion: the tool feeds along the axis by exactly one <mark>pitch P per revolution</mark>.</p>
            <div class="ctl">
              <div class="ctl-row"><label for="lab-pitch">Pitch P</label><output class="val" data-out="pitch"></output></div>
              <input id="lab-pitch" type="range" min="0.5" max="4" step="0.25" data-key="pitch">
              <p class="ro">Feed = P = <b data-ro="feed"></b>/rev · groove depth ≈ 0.613P = <b data-ro="depth"></b> · revolutions so far <b data-ro="revs"></b>, tool travel <b data-ro="travel"></b></p>
            </div>
            <ul>
              <li>Tool profile decides the thread <b>shape and angle</b> (forming).</li>
              <li>Lead-screw and spindle ratio decide the <b>pitch and helix</b> (generating).</li>
            </ul>
            <p class="exam">Asked: TF 2023-24 Q.5(d), 2017-18 Q.5(a), 2012-13 Q.5(a) (examples of the two combined).</p>
            <p class="key"><span class="key-tag">Remember</span>Thread cutting = form from the tool + helix from the feed (feed per rev = pitch).</p>`,
        },
        {
          id: 'slot', chip: 'Slot milling', group: 'Combined', eyebrow: 'Introduction · slide 7', title: 'Combined: slot milling',
          cam: cam.slot,
          html: () => `
            <p>An end mill cuts a slot. The <mark>width</mark> of the slot is the cutter diameter: <b>formed</b> by the tool. The <mark>length</mark> (and path) is the table travel: <b>generated</b> by the feed motion.</p>
            <div class="ctl">
              <div class="ctl-row"><label for="lab-sw">Slot width = cutter diameter</label><output class="val" data-out="slotw"></output></div>
              <input id="lab-sw" type="range" min="4" max="16" step="1" data-key="slotw">
              <div class="ctl-row"><label for="lab-sl">Slot length = table travel</label><output class="val" data-out="slotL"></output></div>
              <input id="lab-sl" type="range" min="10" max="40" step="1" data-key="slotL">
              <p class="ro">Width <b data-ro="sw"></b> (tool) · length <b data-ro="sl"></b> (motion, plus one cutter diameter for the round end)</p>
            </div>
            <p class="key"><span class="key-tag">Remember</span>Slot milling: width from the cutter (forming), length from the table feed (generating).</p>`,
        },
        {
          id: 'answer', chip: 'Exam answer', group: 'Exam', eyebrow: 'Model answer', title: 'Generating and forming',
          cam: cam.compare, plot: false,
          html: () => `
            <p><b>Generating.</b> The geometry of the work part is determined by the feed trajectory of the cutting tool (relative motions of tool and work). Examples: straight turning, taper turning, contour turning, peripheral milling, profile milling.</p>
            <p><b>Forming.</b> The shape of the part is created by the geometry of the cutting tool; the cutting edge is the reverse of the shape to be produced. Examples: form turning, drilling, broaching.</p>
            <p><b>Combined.</b> Thread cutting on a lathe (thread form from the tool, helix from the feed = pitch per revolution) and slot milling (width from the cutter, length from the table feed).</p>
            <ul>
              <li>Generating accuracy depends on the machine motions; it can make many shapes with a simple tool.</li>
              <li>Forming accuracy depends on the tool; it needs higher force and rigidity and is limited to short lengths of cut, but is fast and repeatable.</li>
            </ul>
            <p class="key"><span class="key-tag">Sketch</span>Generating: pointed tool with a dashed trajectory. Forming: tool whose edge mirrors the part profile, with a plunge arrow.</p>`,
        },
      ],

      onParam(key) {
        if (key === 'shape' || key === 'err') {
          rebuildShapes();
          gs.p = 0; fs.p = 0; gs.run = fs.run = true;
        }
        if (key === 'pitch') {
          ts.rev = 0; ts.run = true;
          if (performance.now() - tLastBuild > 66) rebuildThread(); else tDirty = true;
        }
        if (key === 'slotw' || key === 'slotL') sDirty = true;
        if (key === 'cls') flyTo(P.cls === 'rot' ? cam.rot : cam.prism);
      },

      update(dt, t, step) {
        curStep = step || curStep;
        if (!(minRe < R0 + 0.01) || edgeBase[0] === 0) rebuildShapes();
        if (tDirty && performance.now() - tLastBuild > 66) rebuildThread();
        if (sDirty) layoutSlot();
        if (tRows < 3) rebuildThread();
        const vis = stepVis(curStep);
        gen.g.visible = gTool.visible = vis.gen;
        frm.g.visible = fTool.visible = vis.form;
        thr.visible = vTool.visible = vis.thr;
        slotG.visible = column.visible = arm.visible = vis.slot;
        spinA += dt * 1.2;
        gen.chuckG.rotation.x = frm.chuckG.rotation.x = spinA;

        // generating rig
        if (gs.run) { gs.p = Math.min(gs.p + dt / 9, 1); if (gs.p >= 1) { gs.run = false; gs.hold = 0; } }
        else { gs.hold += dt; if (gs.hold > 1.8) { gs.p = 0; gs.run = true; } }
        const ut = 1 - gs.p * (1 - U0);
        for (let i = 0; i < NR; i++) gen.rad[i] = i / (NR - 1) >= ut ? gArr[i] : R0;
        if (vis.gen) setRadii(gen, gen.rad);
        gTool.position.set(ut * Lw, genR(ut), GZ);

        // forming rig
        if (fs.run) { fs.p = Math.min(fs.p + dt / 5, 1); if (fs.p >= 1) { fs.run = false; fs.hold = 0; } }
        else { fs.hold += dt; if (fs.hold > 1.8) { fs.p = 0; fs.run = true; } }
        const delta = (1 - ease(fs.p)) * (R0 - minRe + 1.0);
        for (let i = 0; i < NR; i++) frm.rad[i] = i / (NR - 1) < U0 ? R0 : Math.min(R0, fArr[i] + delta);
        if (vis.form) setRadii(frm, frm.rad);
        shakeT += dt;
        const shake = clamp((forceForm() - 1500) / 6000, 0, 0.6) * 0.1 * Math.sin(shakeT * 75) * (fs.run && fs.p > 0.5 ? 1 : 0);
        fTool.position.set(0, delta + shake, FZ);

        // thread rig
        if (vis.thr) {
          const pv = pvOf();
          const total = (XL - 0.54 * pv - XE) / pv;
          if (ts.run) {
            const rate = clamp(total / 9, 0.5, 3);
            ts.rev = Math.min(ts.rev + dt * rate, total);
            if (ts.rev >= total) { ts.run = false; ts.hold = 0; }
          } else { ts.hold += dt; if (ts.hold > 1.8) { ts.rev = 0; ts.run = true; } }
          const xt = XL - 0.54 * pv - pv * ts.rev;
          const depth = 0.6134 * pv;
          const rows = clamp(Math.floor((XL - xt) / tDx), 0, tRows - 1);
          tMesh.geometry.setDrawRange(0, rows * SEG * 6);
          tCap.visible = ts.rev > 0.01;
          const len = Math.max(Math.min(xt, XL), 0.01);
          tStock.scale.x = len; tStock.position.x = len / 2;
          tStripe.forEach((m) => { m.scale.x = len; m.position.x = len / 2; });
          tStockG.rotation.x = ts.rev * 2 * PI;
          tChuckG.rotation.x = ts.rev * 2 * PI;
          vTool.position.set(xt, RT - depth, TZ);
        }

        // slot rig
        if (vis.slot) {
          const tr = P.slotL / 5, w = P.slotw / 5;
          if (ss.run) { ss.p = Math.min(ss.p + dt / 7, 1); if (ss.p >= 1) { ss.run = false; ss.hold = 0; } }
          else { ss.hold += dt; if (ss.hold > 1.8) { ss.p = 0; ss.run = true; } }
          const trv = ss.p * tr;
          const x0 = -3.2;
          blockG.position.x = BX - x0 - trv;
          const lx = x0;
          slotBody.scale.set(Math.max(trv, 0.001), 1, w);
          slotBody.position.x = lx + trv / 2;
          slotCapA.position.x = lx;
          slotCapB.position.x = lx + trv;
          const show = ss.p > 0.001;
          slotBody.visible = slotCapA.visible = slotCapB.visible = show;
          cutter.rotation.y += dt * 12;
          cutter.position.x = BX;
        }
      },

      overlay(d, step) {
        curStep = step;
        const vis = stepVis(step);
        if (vis.gen) {
          const ut = 1 - gs.p * (1 - U0);
          const tip = [ut * Lw, genR(ut), GZ];
          if (step !== 'effects') d.path(trajPts, 'ref');
          d.dot(tip, 'dot');
          d.label([5.5, R0 + 3.6, GZ], step === 'classes' ? 'ROTATIONAL: work spins, tool travels' : 'GENERATING: tool path = shape', 'hl');
          if (step === 'gen' || step === 'compare') {
            const e = 0.05 * Lw * 0.02;
            const yA = genR(Math.min(ut + e, 1)), yB = genR(Math.max(ut - e, U0));
            const slope = clamp((yB - yA) / (2 * e * Lw), -2, 2);
            d.path([[tip[0], tip[1] + 0.9, GZ], [tip[0] - 1.6, tip[1] + 0.9, GZ]], 'fline', { arrowEnd: true });
            d.label([tip[0] - 0.8, tip[1] + 1.5, GZ], 'x feed', 'f');
            if (Math.abs(slope) > 0.02) {
              d.path([[tip[0] + 0.45, tip[1], GZ], [tip[0] + 0.45, tip[1] + slope * 1.6, GZ]], 'dline', { arrowEnd: true });
              d.label([tip[0] + 1.6, tip[1] + slope * 0.8, GZ], 'cross feed', 'd');
            }
            d.label([tip[0] + 0.1, tip[1] - 0.7, GZ + 1.6], 'trajectory', 'minor');
          }
        }
        if (vis.form) {
          const delta = (1 - ease(fs.p)) * (R0 - minRe + 1.0);
          for (let k = 0; k < NE; k++) edgePts[k][1] = edgeBase[k] + delta;
          d.path(edgePts, 'hx');
          if (step !== 'effects') d.path(finPts, 'ref');
          d.label([5.5, R0 + 3.6, FZ], 'FORMING: tool edge = reverse of the shape', 'hl');
          if (step === 'form' || step === 'compare') {
            d.path([[5.5, R0 + 2.6 + delta, FZ + 0.9], [5.5, R0 + 1.2 + delta, FZ + 0.9]], 'dline', { arrowEnd: true });
            d.label([6.6, R0 + 1.9 + delta, FZ + 0.9], 'one radial plunge', 'd');
            d.label([8.2, edgeBase[NE - 1] + delta - 0.6, FZ + 0.9], 'edge outline', 'minor');
          }
        }
        if (vis.thr) {
          const pv = pvOf(), depth = 0.6134 * pv;
          const xt = XL - 0.54 * pv - pv * ts.rev;
          const k0 = Math.max(1, Math.floor(2.5 / pv));
          const xa = XL - k0 * pv, xb = XL - (k0 + 1) * pv;
          d.dim([xa, RT, TZ], [xb, RT, TZ], `P = ${P.pitch.toFixed(2)} mm`, [0, 0.7, 0], 'fline');
          d.line([xt + Math.tan(PI / 6) * depth * 1.25, RT - depth + depth * 1.25, TZ], [xt, RT - depth, TZ], 'hx');
          d.line([xt - Math.tan(PI / 6) * depth * 1.25, RT - depth + depth * 1.25, TZ], [xt, RT - depth, TZ], 'hx');
          d.label([xt, RT + 1.6, TZ], '60° form from the tool', 'hl');
          d.path([[xt + 0.2, RT + 2.4, TZ], [xt - Math.max(pv, 0.6), RT + 2.4, TZ]], 'fline', { arrowEnd: true });
          d.label([xt + 1.2, RT + 2.4, TZ], 'feed P per rev (helix)', 'f');
          d.label([XL + 1.4, RT + 0.9, TZ], 'V', 'v');
        }
        if (vis.slot) {
          const tr = P.slotL / 5, w = P.slotw / 5;
          const x0 = -3.2;
          const trv = ss.p * tr;
          const bx = blockG.position.x;
          // slot in world coordinates
          const xs = bx + x0, xc = bx + x0 + trv;
          d.dim([xc + w / 2 + 0.05, 0.05, -w / 2], [xc + w / 2 + 0.05, 0.05, w / 2], `width = ${P.slotw} mm (cutter)`, [w / 2 + 1.2, 0, 0], 'dm');
          if (trv > 0.1) d.dim([xs, 0.05, -2.9], [xc, 0.05, -2.9], `length ≈ ${(P.slotL * ss.p).toFixed(0)} mm (travel)`, [0, 0, -0.1], 'fline');
          d.path([[BX + 2.4, 0.4, 2.8], [BX - 1.4, 0.4, 2.8]], 'fline', { arrowEnd: true });
          d.label([BX + 0.5, 0.4, 3.5], 'table feed', 'f');
          if (step === 'classes') d.label([BX, 4.8, 1], 'PRISMATIC: cutter spins, table feeds', 'hl');
          else d.label([BX, 4.2, 0], 'FORM: width from cutter · GENERATING: length from feed', 'hl');
        }
      },

      hud() {
        const rows = [];
        let verdict = null;
        let status = '';
        let cls = '';
        if (curStep === 'classes') {
          status = P.cls === 'rot' ? 'Rotational part: turning' : 'Prismatic part: milling';
          rows.push(['Work', P.cls === 'rot' ? 'rotates (V)' : 'fed in a line'], ['Tool', P.cls === 'rot' ? 'single-point, translates' : 'rotating cutter']);
        } else if (curStep === 'gen') {
          status = `Generating: ${SHAPE_NAME[P.shape]}`;
          cls = 'f';
          rows.push(['Shape from', 'feed trajectory'], ['Tool', 'point, any shape'], ['Axes moving', P.shape === 'straight' ? '1' : '2 together']);
        } else if (curStep === 'form') {
          status = `Forming: ${SHAPE_FORMED[P.shape]}`;
          cls = 'd';
          rows.push(['Shape from', 'tool edge'], ['Tool motion', '1 radial plunge'], ['Tools needed', '1 per shape']);
        } else if (curStep === 'compare') {
          status = `Same contour: ${P.shape}`;
          rows.push(['Back rig', 'generating'], ['Front rig', 'forming']);
        } else if (curStep === 'effects') {
          status = 'Accuracy and force';
          const ff = forceForm();
          rows.push(['Error', `${P.err.toFixed(3)} mm`], ['Gen. accuracy', 'machine motions'], ['Form accuracy', 'tool edge'], ['Gen. force', `${forceGen().toFixed(0)} N`], ['Form force', `${ff.toFixed(0)} N`]);
          verdict = ff > 4000 ? ['Forming force very high: chatter, too long to form', 'bad'] : ff > 2500 ? ['Forming force high: needs a rigid machine', 'warn'] : P.err > 0.04 ? ['Visible error: check machine motions and tool', 'warn'] : ['Both methods comfortable', 'ok'];
        } else if (curStep === 'thread') {
          status = 'Form from tool + helix from feed';
          cls = 'f';
          rows.push(['Pitch P', `${P.pitch.toFixed(2)} mm`], ['Revolutions', ts.rev.toFixed(1)], ['Tool travel', `${(ts.rev * P.pitch).toFixed(1)} mm`], ['Depth ≈ 0.613P', `${(0.6134 * P.pitch).toFixed(2)} mm`]);
        } else if (curStep === 'slot') {
          status = 'Form (width) + generate (length)';
          rows.push(['Width = cutter Ø', `${P.slotw} mm`], ['Length = travel', `${(P.slotL * ss.p).toFixed(0)} / ${P.slotL} mm`]);
        } else {
          status = 'Generating and forming';
          rows.push(['Generating', 'trajectory'], ['Forming', 'tool edge']);
        }
        return { status, statusCls: cls, rows, verdict };
      },

      readouts() {
        const ff = forceForm();
        return {
          traj: P.shape === 'straight' ? 'a straight line parallel to the axis' : P.shape === 'taper' ? 'an inclined straight line' : 'a curve (the part profile)',
          axes: P.shape === 'straight' ? '1 (longitudinal)' : '2 (longitudinal + cross), coordinated',
          edge: `${P.shape === 'straight' ? 'straight' : P.shape === 'taper' ? 'inclined' : 'curved, mirror of the profile'}`,
          fmot: '1 (radial plunge)',
          fg: `${forceGen().toFixed(0)} N`,
          ff: `${ff.toFixed(0)} N`,
          feed: `${P.pitch.toFixed(2)} mm`,
          depth: `${(0.6134 * P.pitch).toFixed(2)} mm`,
          revs: ts.rev.toFixed(1),
          travel: `${(ts.rev * P.pitch).toFixed(1)} mm`,
          sw: `${P.slotw} mm`,
          sl: `${P.slotL} mm`,
          band: P.cls,
        };
      },

      format(key, v) {
        if (key === 'err') return `${v.toFixed(3)} mm`;
        if (key === 'len' || key === 'slotw' || key === 'slotL') return `${v.toFixed(0)} mm`;
        if (key === 'pitch') return `${v.toFixed(2)} mm`;
        return null;
      },

      plot(g, w, h, c, step) {
        frame(g, w, h, c);
        if (step === 'gen') {
          profileLine(g, w, h, shapeR, c.muted, h - 24);
          profileLine(g, w, h, genR, c.f, h - 24);
          tx(g, 'trajectory (profile)', 32, 20, c.f);
          const ut = 1 - gs.p * (1 - U0);
          const x = 26 + ((ut - U0) / (1 - U0)) * (w - 40);
          g.fillStyle = c.accent; g.beginPath(); g.arc(x, h - 24 - genR(ut) * 38, 4, 0, 2 * PI); g.fill();
          return 'Tool path along the part';
        }
        if (step === 'form' || step === 'compare') {
          profileLine(g, w, h, formR, c.muted, h - 24);
          profileLine(g, w, h, formR, c.d, 28, true);
          tx(g, 'part profile', 32, h - 8 - 14, c.muted);
          tx(g, 'tool edge (reverse)', 32, 14, c.d);
          return 'Edge is the mirror image of the part';
        }
        if (step === 'effects') {
          const X = (u) => 26 + u * (w - 40), Y = (u) => h - 22 - u * (h - 36);
          const lmax = 80, fmax = 8000;
          g.strokeStyle = c.f; g.lineWidth = 1.8; g.beginPath();
          g.moveTo(X(0), Y(forceGen() / fmax)); g.lineTo(X(1), Y(forceGen() / fmax)); g.stroke();
          g.strokeStyle = c.d; g.beginPath();
          g.moveTo(X(0), Y(0)); g.lineTo(X(1), Y((2000 * 0.05 * lmax) / fmax)); g.stroke();
          const u = P.len / lmax;
          g.fillStyle = c.accent; g.beginPath(); g.arc(X(u), Y(forceForm() / fmax), 4, 0, 2 * PI); g.fill();
          tx(g, 'generating', X(0.55), Y(forceGen() / fmax) - 5, c.f);
          tx(g, 'forming', X(0.1), Y(0.55), c.d);
          tx(g, 'force', 6, 14, c.muted);
          tx(g, 'length →', w - 50, h - 8, c.muted);
          return 'Force vs length of cut';
        }
        if (step === 'thread') {
          const pv = P.pitch, hh = 0.6134 * pv, sx = (w - 40) / (3 * pv), base = h - 28, sy = Math.min(sx, 60 / hh);
          g.strokeStyle = c.ink; g.lineWidth = 1.6; g.beginPath();
          g.moveTo(26, base - 40);
          for (let k = 0; k < 3; k++) {
            const x0 = 26 + k * pv * sx;
            const pts = [[0, 0], [0.08, 0], [0.434, 1], [0.646, 1], [1, 0]];
            for (const [s, dd] of pts) g.lineTo(x0 + s * pv * sx, base - 40 + dd * hh * sy * 0.5);
          }
          g.stroke();
          g.strokeStyle = c.f; g.beginPath(); g.moveTo(26, base - 52); g.lineTo(26 + pv * sx, base - 52); g.stroke();
          tx(g, `P ${pv.toFixed(2)}`, 30, base - 56, c.f);
          tx(g, `h ${hh.toFixed(2)}`, w - 70, base - 8, c.muted);
          return 'Thread profile: form from tool, spacing = feed';
        }
        return '';
      },
    };
  },
};
