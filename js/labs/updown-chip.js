// Effect lab: up vs down milling, seen through the chip of one tooth.
// Side view of a slab cutter (axis along z). Scale: K scene units per mm of the real cut. Chip thickness and the
// table backlash are drawn exaggerated (P.exag, EXB); every printed number is the true value.
// Chip model: h(phi) = fz * sin(phi) over the engagement arc 0 <= phi <= phic, phic = acos(1 - 2d/D),
// phi measured from the bottom of the cutter (the finished surface) towards the uncut surface.
export default {
  id: 'updown-chip',
  chapter: 'milling',
  title: 'Up vs down milling: the chip',
  eyebrow: 'Milling · slides 56–58',
  sub: 'The same cutter, the same cut: only the direction of rotation against the feed changes. Watch the comma-shaped chip, the force on the work and the table backlash.',
  blurb: 'Why up milling starts the chip at zero thickness and lifts the work, while down milling bites thick, presses the work down and needs a backlash eliminator.',
  qs: ['2023-24_6a', '2022-23_7a', '2021-22_2d', '2020-21_3b', '2014-15_6d', '2010-11_6b'],
  params: { mode: 'up', D: 80, d: 5, fz: 0.15, z: 8, backlash: 0.3, elim: 0, exag: 60 },

  build({ THREE, scene, P, kit }) {
    const K = 0.07; // units per mm
    const EXB = 15; // backlash exaggeration on screen
    const BZ = 3.0; // cutter width (z)
    const H = 2.4; // work thickness
    const XW = 7; // half length of the work block
    const KR = 0.2; // radial / tangential force ratio (typical order of magnitude)
    const RE = 0.02; // edge radius (mm) used for the rubbing estimate
    const ZF = BZ / 2 + 0.03; // z of the overlay plane (front face)
    const cl = (v, a, b) => Math.max(a, Math.min(b, v));
    const TAU = Math.PI * 2;
    const ease = (s) => s * s * (3 - 2 * s);

    // ---------- derived numbers (true mm / radians) ----------
    function geo() {
      const D = Math.max(P.D, 10);
      const d = cl(P.d, 0.05, D / 2);
      const R = D / 2;
      const phic = Math.acos(cl(1 - (2 * d) / D, -1, 1));
      const z = Math.max(2, Math.round(P.z));
      const hmax = P.fz * Math.sin(phic);
      const A = Math.sqrt(d * (D - d));
      const hmean = phic > 1e-6 ? (P.fz * (1 - Math.cos(phic))) / phic : 0;
      const phiBar = (Math.sin(phic) - phic * Math.cos(phic)) / Math.max(1 - Math.cos(phic), 1e-9);
      const phir = Math.asin(Math.min(1, RE / Math.max(P.fz, 1e-6)));
      return { D, d, R, phic, z, hmax, A, hmean, phiBar, phir };
    }
    const isUp = () => P.mode !== 'down';
    const elimOn = () => P.elim >= 0.5;
    const deg = (r) => (r * 180) / Math.PI;

    // ---------- materials ----------
    const mWork = new THREE.MeshStandardMaterial({ color: 0x8c97a1, roughness: 0.55, metalness: 0.35 });
    const mChip = new THREE.MeshStandardMaterial({ color: 0xe9a321, roughness: 0.4, metalness: 0.2, emissive: 0x5a3a00, emissiveIntensity: 0.5 });
    const mTick = new THREE.MeshBasicMaterial({ color: 0x1b1d1f });
    const mFin = new THREE.MeshStandardMaterial({ color: 0xc9a14a, metalness: 0.8, roughness: 0.35 });

    // ---------- table + work ----------
    const tableG = new THREE.Group();
    scene.add(tableG);
    const table = kit.box(2 * XW + 3, 0.5, 3.6, kit.M.castIron);
    table.position.set(0, -H - 0.25, 0);
    const workMesh = new THREE.Mesh(new THREE.BufferGeometry(), mWork);
    workMesh.castShadow = workMesh.receiveShadow = true;
    tableG.add(table, workMesh);
    const ticks = [];
    const tickGeo = new THREE.BoxGeometry(0.1, 0.22, 0.02);
    for (let i = 0; i < 12; i++) {
      const m = new THREE.Mesh(tickGeo, mTick);
      m.position.set(0, -H - 0.25, 1.81);
      tableG.add(m);
      ticks.push(m);
    }
    const base = kit.box(2 * XW + 3, 0.5, 3.6, kit.M.paintDark);
    base.position.set(0, -H - 1.95, 0);
    scene.add(base);

    // ---------- lead screw + nut (backlash detail) ----------
    const YS = -H - 0.95; // screw axis height
    const TF = 0.22; // fin (thread) thickness
    const screw = kit.cyl(0.17, 2 * XW + 3, kit.M.steel, { axis: 'x' });
    screw.position.set(0, YS, 0);
    const fin = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, TF, 28).rotateZ(Math.PI / 2), mFin);
    fin.position.set(0, YS, 0);
    scene.add(screw, fin);
    const plGeo = new THREE.BoxGeometry(1, 0.95, 1.1);
    const plA = new THREE.Mesh(plGeo, kit.M.paintLight); // front plate (screw drives the table through it)
    const plB = new THREE.Mesh(plGeo, kit.M.paintLight); // rear plate
    const bridge = new THREE.Mesh(plGeo, kit.M.paint);
    const wedge = new THREE.Mesh(plGeo, kit.M.green); // backlash eliminator
    tableG.add(plA, plB, bridge, wedge);
    const PW = 0.14;
    function placeNut() {
      const b = P.backlash * K * EXB;
      plA.scale.set(PW, 1, 1);
      plA.position.set(TF / 2 + PW / 2, YS - 0.0, 0);
      plB.scale.set(PW, 1, 1);
      plB.position.set(-TF / 2 - b - PW / 2, YS, 0);
      const w = PW * 2 + TF + b;
      bridge.scale.set(w, 0.2 / 0.95, 1);
      bridge.position.set(-TF / 2 - b - PW + w / 2, YS + 0.375 + 0.1 + 0.02, 0);
      wedge.scale.set(Math.max(b, 1e-4), 0.5 / 0.95, 0.9);
      wedge.position.set(-TF / 2 - b / 2, YS - 0.0, 0);
      wedge.visible = elimOn() && b > 1e-4;
    }

    // ---------- cutter ----------
    const cutter = new THREE.Group();
    const cutMesh = new THREE.Mesh(new THREE.BufferGeometry(), kit.M.hss);
    cutMesh.castShadow = true;
    const arbor = kit.cyl(0.32, BZ + 4.2, kit.M.darkSteel, { axis: 'z' });
    cutter.add(cutMesh);
    scene.add(cutter, arbor);
    const brgL = kit.box(1.2, 1.5, 0.7, kit.M.paint);
    const brgR = kit.box(1.2, 1.5, 0.7, kit.M.paint);
    scene.add(brgL, brgR);
    const mChipBody = new THREE.Mesh(new THREE.BufferGeometry(), mChip);
    scene.add(mChipBody);

    function shapeCutter(g) {
      const R = g.R * K;
      const r0 = Math.max(R - Math.min(0.3, R * 0.15), R * 0.8);
      const s = isUp() ? 1 : -1;
      const step = TAU / g.z;
      const sh = new THREE.Shape();
      const pt = (a, r) => [-r * Math.sin(a), -r * Math.cos(a)];
      let first = true;
      const add = (p) => (first ? (sh.moveTo(p[0], p[1]), (first = false)) : sh.lineTo(p[0], p[1]));
      for (let i = 0; i < g.z; i++) {
        const a = s * i * step;
        add(pt(a, R));
        add(pt(a + s * 0.09 * step, r0));
        add(pt(a + s * 0.5 * step, r0));
      }
      sh.closePath();
      return new THREE.ExtrudeGeometry(sh, { depth: BZ, bevelEnabled: false, steps: 1 }).translate(0, 0, -BZ / 2);
    }

    function shapeWork(g) {
      const R = g.R * K;
      const d = g.d * K;
      const yc = R - d;
      const e = K * P.exag;
      const N = 44;
      const inner = [];
      const outer = [];
      for (let i = 0; i <= N; i++) {
        const phi = (g.phic * i) / N;
        const s = Math.sin(phi);
        const c = Math.cos(phi);
        const h = P.fz * s * e;
        inner.push([-R * s, yc - R * c]);
        outer.push([-(R + h) * s, yc - (R + h) * c]);
      }
      const chip = new THREE.Shape();
      chip.moveTo(inner[0][0], inner[0][1]);
      for (let i = 1; i <= N; i++) chip.lineTo(inner[i][0], inner[i][1]);
      for (let i = N; i >= 0; i--) chip.lineTo(outer[i][0], outer[i][1]);
      chip.closePath();
      const w = new THREE.Shape();
      w.moveTo(-XW, 0);
      w.lineTo(inner[N][0], 0);
      for (let i = N; i >= 0; i--) w.lineTo(outer[i][0], outer[i][1]);
      w.lineTo(XW, -d);
      w.lineTo(XW, -H);
      w.lineTo(-XW, -H);
      w.closePath();
      const ex = (s, depth) => new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, steps: 1 }).translate(0, 0, -depth / 2);
      return { work: ex(w, BZ + 0.5), chip: ex(chip, BZ * 0.96) };
    }

    function rebuild() {
      const g = geo();
      const R = g.R * K;
      const yc = R - g.d * K;
      cutMesh.geometry.dispose();
      cutMesh.geometry = shapeCutter(g);
      const s = shapeWork(g);
      workMesh.geometry.dispose();
      workMesh.geometry = s.work;
      mChipBody.geometry.dispose();
      mChipBody.geometry = s.chip;
      cutter.position.set(0, yc, 0);
      arbor.position.set(0, yc, 0);
      brgL.position.set(0, yc, -BZ / 2 - 1.45);
      brgR.position.set(0, yc, BZ / 2 + 1.45);
    }
    rebuild();
    placeNut();

    // ---------- chips (particles) ----------
    const parts = kit.chips(48, kit.M.workCut);
    scene.add(parts.object);

    // ---------- state ----------
    let th = 0; // cutter rotation (rad)
    let tcyc = 0;
    let delta = 0; // table surge (mm)
    let feedPh = 0;
    const cur = { phi: 0, h: 0, n: 0, idx: -1, theta: 0, any: false };
    let engMask = new Uint8Array(24);
    let prevMask = new Uint8Array(24);
    let nEngMax = 0;

    const tip = (phi, g, r = null, out = [0, 0, ZF]) => {
      const R = (r ?? g.R) * K;
      out[0] = -R * Math.sin(phi);
      out[1] = g.R * K - g.d * K - R * Math.cos(phi);
      out[2] = ZF;
      return out;
    };

    const camFront = (k = 1) => (Pp) => {
      const R = (Math.max(Pp.D, 10) / 2) * K;
      return { position: [0.3, R * 0.45, (14 + R * 1.9) * k], target: [0, R - 1.2, 0] };
    };
    const cam = {
      front: camFront(1),
      close: camFront(0.72),
      screw: { position: [1.5, -1.8, 9.5], target: [0.4, -2.7, 0] },
    };

    const modeSeg = () => `<div class="seg"><button type="button" data-set="mode:up">Up milling</button><button type="button" data-set="mode:down">Down milling</button></div>`;
    const sl = (id, key, label, min, max, step) => `
      <div class="ctl-row"><label for="lab-${id}">${label}</label><output class="val" data-out="${key}"></output></div>
      <input id="lab-${id}" type="range" min="${min}" max="${max}" step="${step}" data-key="${key}">`;

    const verdict = () => {
      if (isUp()) return ['Up: zero-thickness entry, rubs, lifts the work. Rough duty.', 'warn'];
      if (P.backlash > 0.02 && !elimOn()) return ['Down: table will jump into the backlash!', 'bad'];
      return ['Down: best finish and tool life (backlash removed).', 'ok'];
    };

    return {
      legend: [['var(--v)', 'Cutting speed V (tooth tip)'], ['var(--f)', 'Table feed f'], ['var(--d)', 'Depth of cut d']],
      steps: [
        {
          id: 'setup', chip: 'Set-up', group: 'Set-up', eyebrow: 'Milling · slide 56', title: 'One cutter, two ways to meet the work',
          cam: cam.front, plot: false,
          html: () => `
            <p>A slab cutter of diameter D with z teeth cuts a flat surface. The <b>table feeds the work</b> to the right (blue). The cutter can turn either way:</p>
            <div class="duo">
              <div data-band="up"><h3>Up (conventional) milling</h3><p>At the contact the teeth move <mark>against</mark> the table feed.</p></div>
              <div data-band="down"><h3>Down (climb) milling</h3><p>At the contact the teeth move <mark>with</mark> the table feed.</p></div>
            </div>
            ${modeSeg()}
            <ul>
              <li><span class="tag-v">V</span> red: tooth-tip velocity at the contact.</li>
              <li><span class="tag-f">f</span> blue: table feed (the small ticks on the table move with it).</li>
              <li><span class="tag-d">d</span> green: depth of cut.</li>
            </ul>
            <div class="presets"><button class="pbtn" type="button" data-set="D:80,d:5,fz:0.15,z:8">Typical cut</button><button class="pbtn" type="button" data-set="D:80,d:20,fz:0.2,z:8">Deep cut d = 20</button><button class="pbtn" type="button" data-set="D:80,d:1,fz:0.1,z:8">Light cut d = 1</button></div>
            <p class="key"><span class="key-tag">Remember</span>Up milling: cutter rotation opposes feed at contact. Down milling: same direction.</p>`,
        },
        {
          id: 'arc', chip: 'Engagement arc', group: 'The chip', eyebrow: 'Milling · slide 56', title: 'The tooth is in the work only for an arc',
          cam: cam.front,
          html: () => `
            <p>A tooth is inside the work only between the point where it meets the uncut surface and the finished surface. The cutter centre is a distance D/2 − d above the surface, so the engagement angle satisfies</p>
            <p class="formula">cos φc = 1 − 2d / D</p>
            <div class="ctl">
              ${sl('D1', 'D', 'Cutter diameter D', 40, 160, 5)}
              ${sl('d1', 'd', 'Depth of cut d', 0.5, 20, 0.5)}
              <p class="ro">φc = <b data-ro="phic"></b> · contact length (approach) A = <b data-ro="A"></b> · teeth in the cut on average: <b data-ro="nteeth"></b></p>
            </div>
            <ul>
              <li>Deeper cut or smaller cutter: <b>longer arc</b>, more teeth cutting at once.</li>
              <li>With few teeth and a light cut there are moments with <b>no tooth cutting</b> (intermittent cut).</li>
            </ul>`,
        },
        {
          id: 'chip', chip: 'Comma chip', group: 'The chip', eyebrow: 'Milling · slide 57 (point 7)', title: 'Chip thickness: zero to maximum, or maximum to zero',
          cam: cam.close,
          html: () => `
            <p>While a tooth cuts, the work advances by <mark>f<sub>z</sub></mark> between two teeth, so the uncut chip is a <mark>comma</mark>: h = f<sub>z</sub> sin φ. It is thickest next to the uncut surface and zero at the finished surface (thickness drawn ×<b data-out="exag"></b>).</p>
            ${modeSeg()}
            <div class="ctl">
              ${sl('fz1', 'fz', 'Feed per tooth f<sub>z</sub>', 0.05, 0.4, 0.01)}
              ${sl('ex1', 'exag', 'Thickness exaggeration', 20, 150, 5)}
              <p class="ro">h now = <b data-ro="hnow"></b> · h<sub>max</sub> = 2 f<sub>z</sub>√(d/D·(1 − d/D)) = <b data-ro="hmax"></b> · mean h = <b data-ro="hmean"></b></p>
            </div>
            <ul>
              <li><b>Up milling</b>: tooth enters at the finished surface, h grows 0 → h<sub>max</sub> (<mark>chip thickness increases gradually</mark>), then leaves through the uncut surface.</li>
              <li><b>Down milling</b>: tooth enters at the uncut surface with h<sub>max</sub> and thins to 0 (<mark>chip thickness decreases gradually</mark>).</li>
            </ul>
            <p class="key"><span class="key-tag">Remember</span>Same comma in both cases; only the order in which the tooth travels through it is reversed.</p>`,
        },
        {
          id: 'rub', chip: 'Rubbing at entry', group: 'The chip', eyebrow: 'Milling · slide 58 (points 6, 11)', title: 'Up milling rubs before it cuts',
          cam: cam.close,
          html: () => `
            <p>A real cutting edge has a small edge radius r<sub>e</sub> (here ${(RE * 1000).toFixed(0)} µm, honed edge). It cannot cut a chip thinner than about r<sub>e</sub>; below that it <mark>rubs and ploughs</mark> the surface.</p>
            ${modeSeg()}
            <div class="ctl">
              ${sl('fz2', 'fz', 'Feed per tooth f<sub>z</sub>', 0.05, 0.4, 0.01)}
              <div class="presets"><button class="pbtn" type="button" data-set="fz:0.05">Fine 0.05</button><button class="pbtn" type="button" data-set="fz:0.15">0.15</button><button class="pbtn" type="button" data-set="fz:0.35">Coarse 0.35</button></div>
              <p class="ro">Rubbing arc: first <b data-ro="rub"></b> of the engagement = <b data-ro="rubfrac"></b> of the arc</p>
            </div>
            <ul>
              <li><b>Up milling</b>: h starts at zero on the finished surface, so the tooth first <b>rubs</b> (friction heat, work hardening, wear), then cuts: <mark>more heat, higher tool wear, worse finish</mark>.</li>
              <li><b>Down milling</b>: the tooth bites at full thickness and leaves the work as h falls to zero: the tooth is not dragged over the finished surface.</li>
              <li>Smaller f<sub>z</sub> lengthens the rubbing zone.</li>
            </ul>`,
        },
        {
          id: 'force', chip: 'Force direction', group: 'Forces', eyebrow: 'Milling · slide 57 (points 4, 5)', title: 'The cutting force lifts or presses',
          cam: cam.close,
          html: () => `
            <p>The tooth pushes the work along its own velocity (tangential part) and outwards from the cutter axis (radial part, about ${(KR * 100).toFixed(0)} % of it here). Drawn at the centre of the chip, where the load acts:</p>
            ${modeSeg()}
            <div class="ctl">
              ${sl('d2', 'd', 'Depth of cut d', 0.5, 20, 0.5)}
              <p class="ro">Resultant on the work: horizontal <b data-ro="fx"></b>, vertical <b data-ro="fy"></b> (per unit tangential force) → <b data-ro="fdir"></b></p>
            </div>
            <div class="duo">
              <div data-band="up"><h3>Up milling</h3><p>The tangential force opposes the feed and points <mark>upward</mark>: it tends to <b>lift</b> the work off the table, so strong clamping is needed.</p></div>
              <div data-band="down"><h3>Down milling</h3><p>The force points <mark>downward</mark> and along the feed: it <b>presses the work onto the table</b> (good holding) but pulls the table forward.</p></div>
            </div>
            <p class="note">For a very light cut the radial part can outweigh the lift in up milling; textbooks quote the usual deeper-cut picture.</p>`,
        },
        {
          id: 'backlash', chip: 'Backlash jump', group: 'Forces', eyebrow: 'Milling · slide 56', title: 'Down milling pulls the table into the backlash',
          cam: cam.screw,
          html: () => `
            <p>The table is driven by a lead screw and nut. Between the thread flanks there is a clearance, the <mark>backlash b</mark> (drawn ×${EXB}).</p>
            ${modeSeg()}
            <div class="ctl">
              ${sl('b1', 'backlash', 'Backlash b', 0, 1, 0.05)}
              <div class="ctl-row"><span>Backlash eliminator</span></div>
              <div class="seg"><button type="button" data-set="elim:0">Off</button><button type="button" data-set="elim:1">On</button></div>
              <p class="ro">Table surge now: <b data-ro="surge"></b> · worst-case bite: <b data-ro="bite"></b></p>
            </div>
            <ul>
              <li><b>Up milling</b>: the cutting force pushes the table <b>back against the screw</b>, so the nut stays in contact: no jump, <mark>no backlash eliminator needed</mark>.</li>
              <li><b>Down milling</b>: the cutter pulls the table <b>forward</b>; it jumps ahead by b, the tooth suddenly takes f<sub>z</sub> + b: shock, chatter, broken teeth, bad finish. A <mark>backlash eliminator</mark> (green) or a CNC ball screw is needed.</li>
            </ul>`,
        },
        {
          id: 'finish', chip: 'Finish, wear, chips', group: 'Compare', eyebrow: 'Milling · slides 57–58 (points 1, 6, 8, 11, 12)', title: 'Surface finish, tool life and where the chips go',
          cam: cam.front,
          html: () => `
            ${modeSeg()}
            <div class="duo">
              <div data-band="up"><h3>Up milling</h3><ul><li>Rubbing: more heat, <b>more tool wear</b>, shorter tool life.</li><li>Finish is poorer: used for <b>roughing</b>.</li><li>Chips are carried up and thrown <b>upward</b>; they can fall in front of the cut: less suitable for chip management.</li><li>Lower material removal rate.</li></ul></div>
              <div data-band="down"><h3>Down milling</h3><ul><li>No rubbing: less heat, <b>less wear</b>, longer tool life.</li><li>Better surface: used for <b>finishing</b>.</li><li>Chips are removed <b>downward</b>, behind the cut: better chip management.</li><li>Higher material removal rate.</li></ul></div>
            </div>
            <div class="ctl">
              ${sl('fz3', 'fz', 'Feed per tooth f<sub>z</sub>', 0.05, 0.4, 0.01)}
              <p class="ro">Rubbing arc <b data-ro="rub"></b> · mean chip thickness <b data-ro="hmean"></b> · h<sub>max</sub> <b data-ro="hmax"></b></p>
            </div>
            <p class="key"><span class="key-tag">Remember</span>Up: rubs, hot, wears, rough, chips fly up. Down: clean bite, cool, long life, fine finish, chips go down.</p>`,
        },
        {
          id: 'choose', chip: 'Which to use', group: 'Compare', eyebrow: 'Milling · slide 58 (points 10, 13)', title: 'Which materials, which is preferred',
          cam: cam.front, plot: false,
          html: () => `
            <div class="duo">
              <div data-band="up"><h3>Up milling</h3><p>Brass, bronze and ferrous materials (slide 58). The classical method for rough work and for older machines with <b>backlash</b>: no eliminator needed. Large cutting force, more heat.</p></div>
              <div data-band="down"><h3>Down milling</h3><p>Aluminium and aluminium alloys (slide 58). Used nowadays for finishing and on rigid machines or CNC with a <b>backlash eliminator</b>. Needs less feed power and gives a better surface.</p></div>
            </div>
            ${modeSeg()}
            <p><mark>Preferred</mark>: <b>down (climb) milling</b> whenever the machine is rigid and has a backlash eliminator (or a CNC ball screw) and the work is clamped well: better finish, less wear, longer tool life, higher MRR, chips fall away. Fall back to <b>up milling</b> for rough cuts on old machines without an eliminator.</p>
            <p class="note">Textbook addition (not on the slides): castings and forgings with hard scale are usually up milled, because the tooth starts under the scale instead of striking it.</p>`,
        },
        {
          id: 'table', chip: '13-point table', group: 'Compare', eyebrow: 'Milling · slides 57–58', title: 'The 13-point comparison',
          cam: cam.front, plot: false,
          html: () => `
            <div class="table-wrap"><table class="cmp">
              <thead><tr><th>#</th><th>Point</th><th>Up milling</th><th>Down milling</th></tr></thead>
              <tbody>
                <tr><td>1</td><td>Use</td><td>Traditional, rough work</td><td>Modern, finishing</td></tr>
                <tr><td>2</td><td>Also called</td><td>Conventional milling</td><td>Climb milling</td></tr>
                <tr><td>3</td><td>Cutter rotation</td><td>Against the feed</td><td>Same direction as feed</td></tr>
                <tr><td>4</td><td>Cutting force acts</td><td>Upward</td><td>Downward</td></tr>
                <tr><td>5</td><td>Force needed</td><td>Large</td><td>Not much</td></tr>
                <tr><td>6</td><td>Heat</td><td>More</td><td>Less</td></tr>
                <tr><td>7</td><td>Chip thickness</td><td>Increases gradually (0 → max)</td><td>Decreases gradually (max → 0)</td></tr>
                <tr><td>8</td><td>Chips thrown</td><td>Upward</td><td>Downward</td></tr>
                <tr><td>9</td><td>Chip management</td><td>Less suitable</td><td>More suitable</td></tr>
                <tr><td>10</td><td>Materials</td><td>Brass, bronze, ferrous</td><td>Aluminium and its alloys</td></tr>
                <tr><td>11</td><td>Tool wear</td><td>More (cutter turns against feed)</td><td>Less</td></tr>
                <tr><td>12</td><td>Tool life</td><td>Shorter</td><td>Longer</td></tr>
                <tr><td>13</td><td>Backlash eliminator</td><td>Not required</td><td>Required (older machines)</td></tr>
                <tr><td>+</td><td>Material removal rate</td><td>Lower</td><td>Higher</td></tr>
              </tbody></table></div>
            <p class="exam">Asked: TF 2023-24 Q.6(a), 2022-23 Q.7(a), 2014-15 Q.6(d) (slide 57); 2010-11 Q.6(b) (slide 58); 2021-22 Q.2(d), 2020-21 Q.3(b) (slide 56, with sketches).</p>`,
        },
        {
          id: 'answer', chip: 'Exam answer', group: 'Exam', eyebrow: 'Model answer', title: 'Compare up milling and down milling. Which is preferred?',
          cam: cam.front,
          html: () => `
            <ul>
              <li><b>Definition</b>: in up (conventional) milling the cutter rotates against the table feed at the contact; in down (climb) milling it rotates in the same direction as the feed.</li>
              <li><b>Chip</b>: up: thickness grows from 0 to h<sub>max</sub>; down: from h<sub>max</sub> to 0, with h = f<sub>z</sub> sin φ and h<sub>max</sub> ≈ 2f<sub>z</sub>√(d/D·(1 − d/D)).</li>
              <li><b>Force</b>: up: large, directed upward (lifts the work), more heat, rubbing, higher tool wear, shorter life, rougher surface, chips thrown upward; down: less force directed downward (holds the work), less heat, less wear, longer life, better finish, chips removed downward, higher MRR.</li>
              <li><b>Machine</b>: up milling needs no backlash eliminator (force pushes the table against the screw); down milling needs one, otherwise the cutter pulls the table forward into the backlash.</li>
              <li><b>Material</b>: up: brass, bronze, ferrous; down: aluminium and alloys.</li>
              <li><b>Preferred</b>: down milling for finishing on rigid machines with a backlash eliminator; up milling for roughing on older machines.</li>
            </ul>
            <p class="key"><span class="key-tag">Sketch</span>Two side views of the slab cutter on the block: tooth velocity V and table feed f, the comma chip and the resultant force direction for each.</p>`,
        },
      ],

      onParam(key) {
        if (key === 'D' || key === 'd') P.d = Math.min(P.d, P.D / 2);
        if (key === 'D' || key === 'd' || key === 'z' || key === 'mode' || key === 'fz' || key === 'exag') rebuild();
        if (key === 'backlash' || key === 'elim') placeNut();
      },

      update(dt, t, step) {
        const g = geo();
        const dir = isUp() ? 1 : -1;
        const stepAng = TAU / g.z;
        if (engMask.length < g.z) {
          engMask = new Uint8Array(g.z);
          prevMask = new Uint8Array(g.z);
        }
        // current tooth positions and engagement
        let n = 0;
        let best = -1;
        let bestPhi = 0;
        for (let i = 0; i < g.z; i++) {
          let phi = (dir * (i * stepAng + th)) % TAU;
          if (phi < 0) phi += TAU;
          const on = phi <= g.phic ? 1 : 0;
          engMask[i] = on;
          if (on) {
            n++;
            if (best < 0) {
              best = i;
              bestPhi = phi;
            }
          }
        }
        cur.any = n > 0;
        cur.n = n;
        cur.idx = best;
        cur.phi = best >= 0 ? bestPhi : 0;
        cur.h = best >= 0 ? P.fz * Math.sin(bestPhi) : 0;
        cur.theta = isUp() ? cur.phi : g.phic - cur.phi;
        nEngMax = Math.max(nEngMax, n);

        // chip particles: emit when a tooth leaves the cut
        parts.object.visible = step === 'finish';
        if (step === 'finish') {
          for (let i = 0; i < g.z; i++) {
            if (prevMask[i] && !engMask[i]) {
              if (isUp()) parts.emit([-g.A * K, 0.05, 0], [-0.7, 2.3, 0]);
              else parts.emit([0, -g.d * K + 0.05, 0], [1.1, 0.5, 0]);
            }
          }
          parts.update(dt);
        }
        for (let i = 0; i < g.z; i++) prevMask[i] = engMask[i];

        th += dt * 1.0 * (n > 0 ? 0.5 : 2.4);
        cutter.rotation.z = -dir * th;

        // table feed ticks
        feedPh += dt * 0.9;
        for (let i = 0; i < ticks.length; i++) ticks[i].position.x = -8.4 + ((i * 1.5 + feedPh) % 18);

        // table surge into the backlash (down milling, no eliminator)
        tcyc += dt;
        const per = 3.4;
        const u = tcyc % per;
        const b = Math.max(P.backlash, 0);
        let target = 0;
        if (!isUp() && !elimOn()) {
          if (u < 0.9) target = 0;
          else if (u < 1.05) target = b * ease((u - 0.9) / 0.15);
          else if (u < 2.7) target = b;
          else target = b * (1 - ease((u - 2.7) / (per - 2.7)));
        }
        delta = target;
        tableG.position.x = delta * K * EXB;
        this._cur = cur;
      },

      overlay(d, step) {
        const g = geo();
        const R = g.R * K;
        const dk = g.d * K;
        const yc = R - dk;
        const up = isUp();
        const ctr = [0, yc, ZF];
        const a = [0, 0, ZF];
        const bb = [0, 0, ZF];
        const phi = cur.any ? cur.phi : 0;
        // feed arrow (always)
        d.path([[2.6, 0.85, ZF], [4.8, 0.85, ZF]], 'fline', { arrowEnd: true });
        d.label([3.7, 1.35, ZF], 'f  table feed', 'f');
        // tooth velocity at the contact
        if (cur.any) {
          tip(phi, g, null, a);
          const vx = up ? -Math.cos(phi) : Math.cos(phi);
          const vy = up ? Math.sin(phi) : -Math.sin(phi);
          bb[0] = a[0] + vx * 1.3;
          bb[1] = a[1] + vy * 1.3;
          bb[2] = ZF;
          d.path([a, bb], 'vline', { arrowEnd: true });
          d.label([bb[0] + vx * 0.6, bb[1] + vy * 0.6, ZF], 'V', 'v');
          d.dot(a, 'dot');
        }
        const dRef = (x) => {
          // depth-of-cut dimension beside the uncut surface
          const x0 = -g.A * K - 1.7;
          d.line([x0 - 0.5, 0, ZF], [-g.A * K, 0, ZF], 'ref');
          d.line([x0 - 0.5, -dk, ZF], [0, -dk, ZF], 'ref');
          d.line([x0, 0, ZF], [x0, -dk, ZF], 'dline', { arrows: true });
          d.label([x0 - 0.1, -dk * 0.5 - 0.35, ZF], `d = ${g.d.toFixed(1)} mm`, 'd');
        };
        if (step === 'setup') {
          dRef();
          d.line([-R, yc, ZF], [R, yc, ZF], 'cl');
          d.dim([-R, yc, ZF], [R, yc, ZF], `D = ${g.D.toFixed(0)} mm`, [0, R + 0.5, 0]);
          d.label([0, yc, ZF], `z = ${g.z}`, 'minor');
          d.label([R + 1.0, yc + R * 0.5, ZF], up ? 'rotation opposes feed at contact' : 'rotation follows feed at contact', 'hl');
        }
        if (step === 'arc') {
          dRef();
          d.line(ctr, tip(0, g, g.R * 1.2, a), 'cl');
          d.line(ctr, tip(g.phic, g, g.R * 1.2, bb), 'cl');
          d.arc(ctr, [0, -1, 0], [-1, 0, 0], R * 1.12, 0, g.phic, 'arc');
          tip(g.phic * 0.5, g, g.R * 1.3, a);
          d.label([a[0] - 0.2, a[1], ZF], `φc = ${deg(g.phic).toFixed(1)}°`, 'hl', -26, 4);
          d.dim([-g.A * K, 0, ZF], [0, 0, ZF], `A = ${g.A.toFixed(1)} mm`, [0, 0.55, 0]);
          // all teeth tips: engaged ones highlighted
          const dir = up ? 1 : -1;
          for (let i = 0; i < g.z; i++) {
            let p = (dir * (i * (TAU / g.z) + th)) % TAU;
            if (p < 0) p += TAU;
            if (p <= g.phic) d.dot(tip(p, g, null, a), 'dot');
          }
        }
        if (step === 'chip' || step === 'rub' || step === 'finish') {
          dRef();
          if (cur.any) {
            // thickness at the engaged tooth, drawn outward from the tip
            tip(phi, g, null, a);
            tip(phi, g, g.R + (cur.h * P.exag) , bb);
            d.line(a, bb, 'dline');
            d.label([bb[0] - 0.55, bb[1] - 0.3, ZF], `h = ${(cur.h * 1000).toFixed(0)} µm`, 'hl');
          }
          // h_max at the thick end of the chip
          tip(g.phic, g, null, a);
          tip(g.phic, g, g.R + g.hmax * P.exag, bb);
          d.line(a, bb, 'vline');
          d.label([bb[0] - 1.0, bb[1] + 0.35, ZF], `h max = ${(g.hmax * 1000).toFixed(0)} µm`, 'dimtxt');
          d.label([0.15, -dk - 0.35, ZF], 'h = 0', 'minor');
        }
        if (step === 'rub') {
          const pr = Math.min(g.phir, g.phic);
          d.arc(ctr, [0, -1, 0], [-1, 0, 0], R * 1.08, 0, pr, 'vline');
          tip(pr * 0.5, g, g.R * 1.3, a);
          d.label([a[0] + 0.1, a[1] - 0.2, ZF], up ? `rubs: ${deg(pr).toFixed(1)}°` : 'no rubbing zone', up ? 'v' : 'minor', -20, 10);
          if (!up) d.label([-g.A * K - 0.2, 0.55, ZF], 'bites at h max', 'hl');
        }
        if (step === 'force') {
          tip(g.phiBar, g, null, a);
          const ph = g.phiBar;
          const tx = up ? -Math.cos(ph) : Math.cos(ph);
          const ty = up ? Math.sin(ph) : -Math.sin(ph);
          const rx = -Math.sin(ph) * KR;
          const ry = -Math.cos(ph) * KR;
          const Lh = 1.9;
          bb[0] = a[0] + tx * Lh;
          bb[1] = a[1] + ty * Lh;
          d.path([[a[0], a[1], ZF], [bb[0], bb[1], ZF]], 'ref', { arrowEnd: true });
          d.path([[a[0], a[1], ZF], [a[0] + rx * Lh, a[1] + ry * Lh, ZF]], 'ref', { arrowEnd: true });
          const fx = tx + rx;
          const fy = ty + ry;
          const m = Math.hypot(fx, fy) || 1;
          const ex = a[0] + (fx / m) * 2.3;
          const ey = a[1] + (fy / m) * 2.3;
          d.path([[a[0], a[1], ZF], [ex, ey, ZF]], 'arc', { arrowEnd: true });
          d.label([ex + (fx / m) * 0.5, ey + (fy / m) * 0.5, ZF], 'F resultant', 'hl');
          d.line([a[0] - 0.3, a[1], ZF], [a[0] - 0.3, a[1] + fy * 1.6, ZF], 'dm', { arrows: true });
          d.label([a[0] - 0.9, a[1] + fy * 0.8, ZF], fy > 0 ? 'lifts' : 'presses', fy > 0 ? 'v' : 'd');
          d.label([a[0] + tx * Lh * 0.5 + 0.0, a[1] + ty * Lh * 0.5 + 0.35, ZF], 'tangential', 'minor');
          d.label([a[0] + rx * Lh * 0.6 + 0.3, a[1] + ry * Lh * 0.6 - 0.15, ZF], 'radial', 'minor');
        }
        if (step === 'backlash') {
          const ys = YS;
          const t = tableG.position.x;
          const bW = P.backlash * K * EXB;
          const zN = 0.7;
          const frontGap = delta;
          const backGap = Math.max(P.backlash - delta, 0);
          if (!(elimOn() || backGap < 0.02)) d.dim([t - TF / 2 - bW, ys - 0.62, zN], [-TF / 2, ys - 0.62, zN], `${backGap.toFixed(2)} mm`, [0, 0, 0]);
          if (frontGap >= 0.02) d.dim([TF / 2, ys - 0.62, zN], [t + TF / 2, ys - 0.62, zN], `${frontGap.toFixed(2)} mm`, [0, 0, 0]);
          d.label([0, ys + 0.8, zN], 'thread (lead screw)', 'minor');
          d.label([t + 1.3, ys - 0.85, zN], 'nut on table', 'minor');
          d.label([-3.8, ys - 0.4, zN], `backlash b = ${P.backlash.toFixed(2)} mm (×${EXB})`, 'dimtxt');
          // force on the work
          const fy0 = -dk - 0.1;
          d.path([[-2.2, fy0 + 1.5, ZF], [-2.2 + (up ? -1.8 : 1.8), fy0 + 1.5, ZF]], 'arc', { arrowEnd: true });
          d.label([-2.2 + (up ? -0.9 : 0.9), fy0 + 1.95, ZF], up ? 'cutter pushes work back' : 'cutter pulls work forward', 'hl');
          d.path([[3.6, fy0 + 1.5, ZF], [5.4, fy0 + 1.5, ZF]], 'fline', { arrowEnd: true });
          d.label([4.5, fy0 + 1.95, ZF], 'screw drives table', 'f');
        }
      },

      hud() {
        const g = geo();
        return {
          status: isUp() ? 'Up milling: V opposes f' : 'Down milling: V with f',
          statusCls: isUp() ? 'v' : 'f',
          rows: [
            ['Engagement φc', `${deg(g.phic).toFixed(1)}°`],
            ['Chip h now', `${(cur.h * 1000).toFixed(0)} µm`],
            ['Chip h max', `${(g.hmax * 1000).toFixed(0)} µm`],
            ['Teeth cutting', String(cur.n)],
          ],
          verdict: verdict(),
        };
      },

      readouts() {
        const g = geo();
        const ph = g.phiBar;
        const up = isUp();
        const fx = up ? -Math.cos(ph) - KR * Math.sin(ph) : Math.cos(ph) - KR * Math.sin(ph);
        const fy = up ? Math.sin(ph) - KR * Math.cos(ph) : -Math.sin(ph) - KR * Math.cos(ph);
        const surge = !up && !elimOn() ? delta : 0;
        const rubTxt = up ? `${deg(Math.min(g.phir, g.phic)).toFixed(1)}°` : 'none';
        return {
          phic: `${deg(g.phic).toFixed(1)}°`,
          A: `${g.A.toFixed(1)} mm`,
          nteeth: ((g.z * g.phic) / TAU).toFixed(2),
          hnow: `${(cur.h * 1000).toFixed(0)} µm`,
          hmax: `${(g.hmax * 1000).toFixed(0)} µm`,
          hmean: `${(g.hmean * 1000).toFixed(0)} µm`,
          rub: rubTxt,
          rubfrac: up ? `${Math.round((Math.min(g.phir, g.phic) / g.phic) * 100)} %` : '0 %',
          fx: `${fx.toFixed(2)} (${fx < 0 ? 'backward' : 'forward'})`,
          fy: `${fy.toFixed(2)} (${fy > 0 ? 'up' : 'down'})`,
          fdir: fy > 0 ? 'lifts the work' : up ? 'slightly presses (light cut)' : 'presses the work down',
          surge: `${surge.toFixed(2)} mm`,
          bite: !up && !elimOn() && P.backlash > 0 ? `${((P.fz + P.backlash) / P.fz).toFixed(1)}× the planned chip` : '1.0× (no jump)',
          band: up ? 'up' : 'down',
        };
      },
      live: true,

      format(key, v) {
        if (key === 'D') return `${v.toFixed(0)} mm`;
        if (key === 'd') return `${v.toFixed(1)} mm`;
        if (key === 'fz') return `${v.toFixed(2)} mm/tooth`;
        if (key === 'backlash') return `${v.toFixed(2)} mm`;
        if (key === 'exag') return `×${v.toFixed(0)}`;
        return null;
      },

      plot(gx, w, h, c, step) {
        const g = geo();
        const ml = 32, mr = 8, mt = 16, mb = 24;
        const pw = w - ml - mr;
        const ph = h - mt - mb;
        const hm = Math.max(g.hmax, 1e-6);
        const X = (th) => ml + (th / g.phic) * pw;
        const Y = (hh) => mt + ph - (hh / hm) * ph;
        const up = isUp();
        const curve = (fn) => {
          gx.beginPath();
          for (let i = 0; i <= 40; i++) {
            const th = (g.phic * i) / 40;
            const px = X(th);
            const py = Y(fn(th));
            if (i) gx.lineTo(px, py);
            else gx.moveTo(px, py);
          }
          gx.stroke();
        };
        if (step === 'rub' && up) {
          const pr = Math.min(g.phir, g.phic);
          gx.fillStyle = c.v;
          gx.globalAlpha = 0.25;
          gx.fillRect(X(0), mt, X(pr) - X(0), ph);
          gx.globalAlpha = 1;
        }
        gx.strokeStyle = c.muted;
        gx.lineWidth = 1;
        gx.beginPath();
        gx.moveTo(ml, mt);
        gx.lineTo(ml, mt + ph);
        gx.lineTo(ml + pw, mt + ph);
        gx.stroke();
        gx.setLineDash([3, 3]);
        gx.lineWidth = 1.2;
        curve(up ? (th) => P.fz * Math.sin(g.phic - th) : (th) => P.fz * Math.sin(th));
        gx.setLineDash([]);
        gx.strokeStyle = up ? c.v : c.f;
        gx.lineWidth = 2;
        curve(up ? (th) => P.fz * Math.sin(th) : (th) => P.fz * Math.sin(g.phic - th));
        gx.fillStyle = c.muted;
        gx.fillText('0', ml - 8, mt + ph + 11);
        gx.fillText(`${deg(g.phic).toFixed(0)}°`, ml + pw - 14, mt + ph + 11);
        gx.fillText('cutter rotation while cutting', ml + 20, h - 3);
        gx.fillText(`${(g.hmax * 1000).toFixed(0)}µm`, 0, mt + 4);
        gx.fillStyle = up ? c.v : c.f;
        gx.fillText(up ? 'up: 0 → max' : 'down: max → 0', ml + 14, mt - 4);
        return `Chip thickness h vs rotation (${up ? 'up' : 'down'} solid, other dashed)`;
      },

      dispose() {
        for (const m of [workMesh, cutMesh, mChipBody]) m.geometry.dispose();
        tickGeo.dispose();
        plGeo.dispose();
        fin.geometry.dispose();
        for (const m of [mWork, mChip, mTick, mFin]) m.dispose();
      },
    };
  },
};
