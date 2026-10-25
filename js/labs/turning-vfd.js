// Effect lab: cutting speed V, feed f and depth of cut d in turning (slides 15-24, Answer Notes B and C).
// Model scale: 1 world unit = 10 mm for the bar (radius = D/20). The bar length drawn is fixed (Lb) whatever L is.
// Feed marks are drawn at pitch 0.5*f units (about 17x coarser than life) with height exaggerated by P.exag.
const PI = Math.PI;
const IN = 25.4;

export default {
  id: 'turning-vfd',
  chapter: 'turning',
  title: 'Cutting speed, feed and depth of cut',
  eyebrow: 'Turning · slides 15–24',
  sub: 'A single-point tool turns a bar. Change V, f and d and watch the surface, the chips, the force, the power and the machining time respond.',
  blurb: 'V = πDN/1000, f, d, MRR = V·f·d, machining time, power and torque, and what higher V, f and d do to finish, heat and tool life.',
  qs: ['2012-13_4b', '2017-18_5d', '2020-21_1b', '2018-19_8b', '2021-22_1c'],
  params: { D: 52, V: 75, N: 459.1, f: 0.4, d: 4.2, r: 0.8, K: 915, L: 152.5, allow: 2.5, exag: 20, Pm: 5 },

  build({ THREE, scene, P, kit }) {
    const { M } = kit;
    const Lb = 14; // drawn bar length (free end at x = Lb, chuck face at x = 0)
    const XE = 1.2; // the tool stops here, leaving a collar by the chuck
    const SEG = 40;
    const NS = 5; // samples per ridge pitch
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const ease = (s) => s * s * (3 - 2 * s);

    // ---------- machine furniture ----------
    const bed = kit.box(34, 0.9, 7, M.castIron);
    bed.position.set(6, -9.6, 0);
    const head = kit.box(5, 15, 7, M.paint);
    head.position.set(-6, -2.2, 0);
    const chuck = kit.cyl(1, 1, M.darkSteel, { axis: 'x', seg: 40 });
    const jaws = [0, 1, 2].map(() => kit.box(1.4, 1, 0.9, M.steel));
    const chuckG = new THREE.Group();
    chuckG.add(chuck, ...jaws);
    scene.add(bed, head, chuckG);

    // ---------- work ----------
    const stockG = new THREE.Group();
    const stock = kit.cyl(1, 1, M.work, { axis: 'x', seg: 48 });
    const stripes = [0, 2.1, 4.2].map(() => new THREE.Mesh(new THREE.BoxGeometry(1, 0.06, 0.1), M.darkSteel));
    stockG.add(stock, ...stripes);
    const turnedMat = new THREE.MeshStandardMaterial({ color: 0xe6ecf0, roughness: 0.25, metalness: 0.8 });
    const turned = new THREE.Mesh(new THREE.BufferGeometry(), turnedMat);
    turned.castShadow = turned.receiveShadow = true;
    const cap = new THREE.Mesh(new THREE.CircleGeometry(1, 40).rotateY(PI / 2), M.workCut);
    cap.position.x = Lb;
    scene.add(stockG, turned, cap);

    // V (primary motion) arrow around the bar
    const spin = kit.spinArrow(1, M.vColor, { axis: 'x', arc: PI * 1.4, tube: 0.05 });
    spin.position.x = Lb + 1.4;
    scene.add(spin);

    // ---------- tool ----------
    const rig = new THREE.Group();
    const noseMat = M.carbide.clone();
    noseMat.emissive = new THREE.Color(0xff3a00);
    noseMat.emissiveIntensity = 0;
    const nose = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), noseMat);
    const insert = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 0.9), noseMat);
    const shank = kit.box(1.0, 3.2, 1.3, M.darkSteel);
    const post = kit.box(2.4, 1.6, 2.6, M.paintDark);
    rig.add(nose, insert, shank, post);
    scene.add(rig);

    const chipMat = M.workCut.clone();
    chipMat.emissive = new THREE.Color(0xff6a00);
    chipMat.emissiveIntensity = 0;
    const chip = kit.chips(48, chipMat);
    const CS = 2.5;
    chip.object.scale.setScalar(CS);
    scene.add(chip.object);

    // ---------- derived numbers ----------
    const calc = () => {
      const N = (1000 * P.V) / (PI * P.D);
      const mrr = P.V * 1000 * P.f * P.d; // mm3/min
      const W = (P.K * mrr) / 60000; // watts
      const omega = (2 * PI * N) / 60;
      const T = W / omega;
      const Fc = P.K * P.f * P.d;
      const t = (P.L + P.allow) / (P.f * N);
      const D2 = P.D - 2 * P.d;
      const h = hh(0); // exact peak-to-valley, mm
      const hApprox = (P.f * P.f) / (8 * P.r);
      const temp = Math.pow(P.V / 75, 0.4) * Math.pow(P.f / 0.4, 0.2) * Math.pow(P.d / 4.2, 0.1);
      const life = 60 * Math.pow(100 / P.V, 4); // Taylor, n = 0.25, T = 60 min at 100 m/min (illustrative)
      return { N, mrr, W, omega, T, Fc, t, D2, h, hApprox, temp, life };
    };
    // ridge height (mm) above the valley at position u (0..f) along one feed pitch
    function hh(u) {
      const dx = Math.min(Math.abs(u - P.f / 2), P.r * 0.999);
      return P.r - Math.sqrt(P.r * P.r - dx * dx);
    }
    const finishScore = (c) => c.hApprox * 1000 * (1 + 0.6 * clamp((60 - P.V) / 60, 0, 1)); // um; low V adds built-up-edge roughness
    const finishWord = (c) => {
      const s = finishScore(c);
      return s < 10 ? ['Smooth', 'ok'] : s < 40 ? ['Medium', 'warn'] : ['Rough', 'bad'];
    };
    const tempWord = (c) => (c.temp < 0.95 ? ['Cool', 'ok'] : c.temp < 1.2 ? ['Warm', 'warn'] : ['Hot', 'bad']);
    const forceWord = (c) => (c.Fc < 1000 ? ['Low', 'ok'] : c.Fc < 2500 ? ['Moderate', 'warn'] : ['High', 'bad']);
    const lifeWord = (c) => (c.life > 60 ? ['Long', 'ok'] : c.life > 15 ? ['Moderate', 'warn'] : ['Short', 'bad']);
    const verdict = (c) => {
      if (c.life < 15) return [`Tool life only ${c.life.toFixed(0)} min: slow down`, 'bad'];
      if (c.W / 1000 > P.Pm) return [`Needs ${(c.W / 1000).toFixed(1)} kW but the machine has ${P.Pm.toFixed(1)} kW`, 'bad'];
      if (c.Fc > 3000) return ['High force: risk of chatter and deflection', 'bad'];
      if (finishWord(c)[1] === 'bad') return ['Rough surface: reduce f or raise r', 'warn'];
      if (c.temp > 1.2 || c.life < 45) return ['Hot cut: tool wear is rising', 'warn'];
      return ['Balanced cut', 'ok'];
    };

    // ---------- geometry that depends on D, d, f, r, exag ----------
    let dirty = false, lastBuild = 0, nx = 2, dxg = 0.1;
    const R = () => P.D / 20;
    const R2 = () => (P.D / 2 - P.d) / 10;
    function rebuildTurned() {
      dirty = false;
      lastBuild = performance.now();
      const r2 = R2(), r1 = R();
      const pv = P.f * 0.5;
      dxg = pv / NS;
      nx = Math.floor((Lb - XE) / dxg) + 1;
      const pos = new Float32Array(nx * (SEG + 1) * 3);
      let k = 0;
      for (let i = 0; i < nx; i++) {
        const x = Lb - i * dxg;
        for (let j = 0; j <= SEG; j++) {
          const th = (2 * PI * j) / SEG;
          const s = (i / NS + th / (2 * PI)) % 1;
          const rad = Math.min(r2 + hh(s * P.f) * 0.1 * P.exag, r1 - 0.004);
          pos[k++] = x;
          pos[k++] = rad * Math.cos(th);
          pos[k++] = rad * Math.sin(th);
        }
      }
      const idx = new Uint32Array((nx - 1) * SEG * 6);
      let m = 0;
      for (let i = 0; i < nx - 1; i++) {
        for (let j = 0; j < SEG; j++) {
          const a = i * (SEG + 1) + j, b = a + 1, c = a + SEG + 1, d = c + 1;
          idx[m++] = a; idx[m++] = c; idx[m++] = b;
          idx[m++] = b; idx[m++] = c; idx[m++] = d;
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setIndex(new THREE.BufferAttribute(idx, 1));
      g.computeVertexNormals();
      turned.geometry.dispose();
      turned.geometry = g;
      cap.scale.set(1, r2, r2);
      layout();
    }
    const rvOf = () => 0.06 + P.r * 0.1;
    function layout() {
      const r1 = R();
      const rc = Math.max(r1 + 1.4, 3);
      chuck.scale.set(2.6, rc, rc);
      chuck.position.set(-1.3, 0, 0);
      jaws.forEach((j, i) => {
        const a = (i * 2 * PI) / 3;
        j.position.set(-0.7, (r1 + 0.5) * Math.cos(a), (r1 + 0.5) * Math.sin(a));
        j.rotation.x = a;
        j.scale.set(1, r1 * 0.7 + 0.5, 1);
      });
      stock.scale.set(1, r1, r1);
      stripes.forEach((s, i) => {
        const a = [0, 2.1, 4.2][i];
        s.position.y = (r1 + 0.02) * Math.cos(a);
        s.position.z = (r1 + 0.02) * Math.sin(a);
        s.rotation.x = -a;
      });
      const sc = (r1 + 0.7);
      spin.scale.set(1, sc, sc);
      const rv = rvOf();
      nose.scale.setScalar(rv);
      nose.position.y = rv;
      insert.position.set(0.45, rv * 1.6 + 0.1, 0);
      shank.position.set(0.45, rv * 2 + 1.8, 0);
      post.position.set(0.45, rv * 2 + 4.2, 0);
      bed.position.y = -Math.max(r1, 3) - 1.8 - 6 + 3.6; // keep the bed under the chuck
      head.position.y = bed.position.y + 0.45 + 7.5;
    }

    // ---------- animation state ----------
    const X0 = Lb + 1.6;
    const Tcut = 6;
    let state = 'cut', st = 0, cutX = X0, lift = 0, spinA = 0, chipAcc = 0, curStep = 'setup';
    const setDraw = () => {
      const k = clamp(Math.floor((Lb - cutX) / dxg), 0, nx - 1);
      turned.geometry.setDrawRange(0, k * SEG * 6);
      cap.visible = cutX < Lb;
    };
    const layoutStock = () => {
      const len = Math.max(Math.min(cutX, Lb) - 0.0, 0.01);
      stock.scale.x = len;
      stock.position.x = len / 2;
      stripes.forEach((s) => {
        s.scale.x = len;
        s.position.x = len / 2;
      });
    };
    function restart() {
      state = 'cut'; st = 0; cutX = X0; lift = 0;
    }
    const camFor = (kind) => () => {
      const r = R();
      const c = {
        iso: { position: [8, r * 0.5 + 6, 17 + r * 1.2], target: [5.5, 0.2, 0] },
        end: { position: [Lb + 11 + r, r * 0.4 + 1.5, 6 + r], target: [Lb - 3, 0, 0] },
        top: { position: [Lb - 4, R2() + 2.4, 7.5], target: [Lb - 4, R2() + 0.3, 0] },
        tool: { position: [Lb - 2, r + 3, 9 + r * 0.4], target: [Lb - 4, R2() + 0.5, 0] },
        far: { position: [8, r + 5, 21 + r * 1.2], target: [5.5, 0, 0] },
      };
      return c[kind];
    };

    // ---------- plots ----------
    const frame = (g, w, h, c) => {
      g.strokeStyle = c.line;
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(26, 10); g.lineTo(26, h - 22); g.lineTo(w - 10, h - 22);
      g.stroke();
    };
    const dot = (g, x, y, col) => {
      g.fillStyle = col;
      g.beginPath();
      g.arc(x, y, 4, 0, 2 * PI);
      g.fill();
    };
    const lab = (g, text, x, y, col) => {
      g.fillStyle = col;
      g.fillText(text, x, y);
    };

    return {
      legend: [['var(--v)', 'Cutting speed V (work rotation)'], ['var(--f)', 'Feed f (tool along the axis)'], ['var(--d)', 'Depth of cut d (radial)']],
      live: true,
      steps: [
        {
          id: 'setup', chip: 'Set-up', group: 'Basics', eyebrow: 'Turning · slides 15–16', title: 'Three motions and three settings',
          cam: camFor('iso'), plot: false,
          html: () => `
            <p>The bar is held in the chuck. The tool is a <mark>single-point tool</mark> whose tip is rounded with a <mark>nose radius r</mark>. Three things decide the cut:</p>
            <ul>
              <li><span class="tag-v">V</span> red: the <b>primary (cutting) motion</b>, the rotation of the work. V is the speed of the work surface past the tool, in m/min.</li>
              <li><span class="tag-f">f</span> blue: the <b>feed</b>, the tool moving parallel to the axis. Feed per revolution, mm/rev.</li>
              <li><span class="tag-d">d</span> green: the <b>depth of cut</b>, how far the tool is set into the surface, measured radially, mm.</li>
            </ul>
            <p>Material is removed at the tool tip as a chip; the new surface left behind has a smaller diameter D<sub>2</sub> = D − 2d.</p>
            <div class="ctl">
              <div class="ctl-row"><label for="lab-d0">Depth of cut d</label><output class="val" data-out="d"></output></div>
              <input id="lab-d0" type="range" min="0.5" max="8" step="0.1" data-key="d">
              <p class="ro">D<sub>1</sub> = <b data-ro="D1"></b> → D<sub>2</sub> = <b data-ro="D2"></b></p>
            </div>
            <p class="key"><span class="key-tag">Remember</span>V = work rotation, f = tool travel along the axis per revolution, d = radial penetration. Colour code: V red, f blue, d green.</p>`,
        },
        {
          id: 'speed', chip: 'V = πDN/1000', group: 'Basics', eyebrow: 'Turning · slides 17–18', title: 'Cutting speed',
          cam: camFor('end'),
          html: () => `
            <p>Cutting speed is the <mark>surface speed of the work</mark>, not the spindle speed. A point on the surface travels one circumference πD every revolution:</p>
            <p class="formula">V = π D N / 1000  (m/min, D in mm, N in rpm)</p>
            <div class="ctl">
              <div class="ctl-row"><label for="lab-D1">Work diameter D</label><output class="val" data-out="D"></output></div>
              <input id="lab-D1" type="range" min="20" max="160" step="1" data-key="D">
              <div class="ctl-row"><label for="lab-V1">Cutting speed V</label><output class="val" data-out="V"></output></div>
              <input id="lab-V1" type="range" min="10" max="400" step="1" data-key="V">
              <div class="ctl-row"><label for="lab-N1">Spindle speed N</label><output class="val" data-out="N"></output></div>
              <input id="lab-N1" type="range" min="20" max="2000" step="1" data-key="N">
              <p class="ro">N = 1000V/πD = <b data-ro="N"></b> · V at half the radius = <b data-ro="Vhalf"></b></p>
            </div>
            <ul>
              <li>At the same N, a <b>larger diameter</b> gives a higher V.</li>
              <li>V is <b>different at every radius</b>: zero at the axis, largest at the surface. The tool works at the surface, so D is the diameter being cut.</li>
              <li>As the tool reduces D, V falls unless N is raised (this is why facing needs a rising N).</li>
            </ul>
            <p class="key"><span class="key-tag">Remember</span>N = 1000V/(πD). Pick V from the tool-work pair, then compute N for the diameter in hand.</p>`,
        },
        {
          id: 'feed', chip: 'Feed f', group: 'Basics', eyebrow: 'Turning · slide 19', title: 'Feed and the feed marks',
          cam: camFor('top'),
          html: () => `
            <p>The tool moves along the axis by <mark>f mm every revolution</mark>. A round nose cuts a helical groove; the next turn is f further on, leaving a ridge between grooves (the <mark>feed marks</mark>).</p>
            <div class="ctl">
              <div class="ctl-row"><label for="lab-f1">Feed f</label><output class="val" data-out="f"></output></div>
              <input id="lab-f1" type="range" min="0.1" max="1.2" step="0.01" data-key="f">
              <div class="ctl-row"><label for="lab-r1">Nose radius r</label><output class="val" data-out="r"></output></div>
              <input id="lab-r1" type="range" min="0.2" max="2.4" step="0.1" data-key="r">
              <div class="ctl-row"><label for="lab-ex">Ridge exaggeration</label><output class="val" data-out="exag"></output></div>
              <input id="lab-ex" type="range" min="1" max="60" step="1" data-key="exag">
              <div class="presets"><button class="pbtn" type="button" data-set="f:0.12">Fine 0.12</button><button class="pbtn" type="button" data-set="f:0.4">Medium 0.4</button><button class="pbtn" type="button" data-set="f:1">Coarse 1.0</button></div>
              <p class="ro">Peak-to-valley h ≈ f²/8r = <b data-ro="h"></b> · feed speed f·N = <b data-ro="fN"></b></p>
            </div>
            <p class="formula">h ≈ f² / (8 r)</p>
            <p class="note">Drawn about 17 times coarser than life, with ridge height as set by the exaggeration slider. Halve f and the ridges become four times shallower.</p>
            <p class="key"><span class="key-tag">Remember</span>Feed mm/rev is set along the axis; the finish goes as f²/8r, so finishing uses a small feed and a bigger nose radius.</p>`,
        },
        {
          id: 'depth', chip: 'Depth d', group: 'Basics', eyebrow: 'Turning · slides 21–22', title: 'Depth of cut',
          cam: camFor('iso'),
          html: () => `
            <p>Depth of cut is the <mark>radial thickness of the layer removed</mark>. The diameter drops by twice that:</p>
            <p class="formula">d = (D<sub>1</sub> − D<sub>2</sub>) / 2</p>
            <div class="ctl">
              <div class="ctl-row"><label for="lab-d2">Depth of cut d</label><output class="val" data-out="d"></output></div>
              <input id="lab-d2" type="range" min="0.5" max="8" step="0.1" data-key="d">
              <div class="ctl-row"><label for="lab-D2">Work diameter D<sub>1</sub></label><output class="val" data-out="D"></output></div>
              <input id="lab-D2" type="range" min="20" max="160" step="1" data-key="D">
              <div class="presets"><button class="pbtn" type="button" data-set="d:1">Finish 1 mm</button><button class="pbtn" type="button" data-set="d:4.2">Note C 4.2 mm</button><button class="pbtn" type="button" data-set="d:7">Rough 7 mm</button></div>
              <p class="ro">D<sub>1</sub> = <b data-ro="D1"></b>, D<sub>2</sub> = <b data-ro="D2"></b>, so d = <b data-ro="dcalc"></b></p>
            </div>
            <p>Example (2020-21 Q.1b): Ø4.5 in turned to Ø4.25 in in one pass gives d = (4.5 − 4.25)/2 = <b>0.125 in</b>.</p>
            <p class="key"><span class="key-tag">Remember</span>d is half the diameter reduction. One pass removes d; rough cuts take a big d, finish cuts a small one.</p>`,
        },
        {
          id: 'mrr', chip: 'MRR and time', group: 'Numbers', eyebrow: 'Turning · slides 21–24', title: 'Material removal rate and machining time',
          cam: camFor('tool'),
          html: () => `
            <p>In one minute the surface sweeps V (mm) past the tool, and each sweep removes a strip f wide and d deep:</p>
            <p class="formula">MRR = V · f · d  (mm³/min, V in mm/min)</p>
            <p class="formula">t = (L + allowance) / (f · N)  (min)</p>
            <div class="ctl">
              <div class="ctl-row"><label for="lab-V2">Cutting speed V</label><output class="val" data-out="V"></output></div>
              <input id="lab-V2" type="range" min="10" max="400" step="1" data-key="V">
              <div class="ctl-row"><label for="lab-f2">Feed f</label><output class="val" data-out="f"></output></div>
              <input id="lab-f2" type="range" min="0.1" max="1.2" step="0.01" data-key="f">
              <div class="ctl-row"><label for="lab-d3">Depth d</label><output class="val" data-out="d"></output></div>
              <input id="lab-d3" type="range" min="0.5" max="8" step="0.1" data-key="d">
              <div class="ctl-row"><label for="lab-L">Length of cut L</label><output class="val" data-out="L"></output></div>
              <input id="lab-L" type="range" min="20" max="1200" step="0.5" data-key="L">
              <div class="ctl-row"><label for="lab-al">Allowance (approach + over-travel)</label><output class="val" data-out="allow"></output></div>
              <input id="lab-al" type="range" min="0" max="140" step="0.5" data-key="allow">
              <p class="ro">Chip section f·d = <b data-ro="A"></b> · MRR = <b data-ro="mrr"></b> (<b data-ro="mrrs"></b>)</p>
              <p class="ro">N = <b data-ro="N"></b> → time <b data-ro="t"></b> = <b data-ro="ts"></b></p>
            </div>
            <p>The little green-and-blue rectangle at the tool tip is the <mark>uncut chip section f × d</mark>; MRR is that area times the surface speed.</p>
            <p class="exam">Asked: TF 2020-21 Q.1(b), 2018-19 Q.8(b), 2017-18 Q.5(d), 2021-22 Q.1(c).</p>
            <p class="key"><span class="key-tag">Remember</span>MRR = V·f·d with V in mm/min. Time = (L + allowance)/(f·N), and N comes from V and D.</p>`,
        },
        {
          id: 'power', chip: 'Power and torque', group: 'Numbers', eyebrow: 'Turning · Answer Note C', title: 'Power, force and torque',
          cam: camFor('tool'),
          html: () => `
            <p>The <mark>specific cutting energy K</mark> (N/mm², energy per unit volume removed) turns MRR into power:</p>
            <p class="formula">P = K · MRR   ·   F<sub>c</sub> = K · f · d   ·   T = P/ω = F<sub>c</sub> · D/2</p>
            <div class="ctl">
              <div class="ctl-row"><label for="lab-K">Specific energy K</label><output class="val" data-out="K"></output></div>
              <input id="lab-K" type="range" min="200" max="4000" step="5" data-key="K">
              <div class="ctl-row"><label for="lab-V3">Cutting speed V</label><output class="val" data-out="V"></output></div>
              <input id="lab-V3" type="range" min="10" max="400" step="0.5" data-key="V">
              <div class="ctl-row"><label for="lab-f3">Feed f</label><output class="val" data-out="f"></output></div>
              <input id="lab-f3" type="range" min="0.1" max="1.2" step="0.01" data-key="f">
              <div class="ctl-row"><label for="lab-d4">Depth d</label><output class="val" data-out="d"></output></div>
              <input id="lab-d4" type="range" min="0.5" max="8" step="0.1" data-key="d">
              <div class="presets">
                <button class="pbtn" type="button" data-set="D:52,V:75,f:0.4,d:4.2,K:915,L:152.5,allow:2.5">2017-18 Q.5d (Note C)</button>
                <button class="pbtn" type="button" data-set="D:150,V:167.6,f:0.3,d:4,L:400,allow:133.33">2018-19 Q.8b</button>
                <button class="pbtn" type="button" data-set="D:114.3,V:137.16,f:0.254,d:3.175,L:1168.4,allow:0">2020-21 Q.1b (inch)</button>
              </div>
              <p class="ro">MRR <b data-ro="mrr"></b> · P = <b data-ro="P"></b> · N = <b data-ro="N"></b></p>
              <p class="ro">F<sub>c</sub> = <b data-ro="Fc"></b> · T = <b data-ro="T"></b> · time <b data-ro="t"></b></p>
            </div>
            <p>Note C check: 126 000 mm³/min, P = 915 × 126 000 / 60 000 = 1.92 kW, N = 459 rpm, T = 1921.5 / 48.08 ≈ 40 N·m, t = 155 / (0.4 × 459.1) = 0.844 min.</p>
            <p class="note">2018-19 Q.8b: over-travel 33.33 % of 400 mm; N = 533.3/(0.3 × 5) = 355.6 rpm, V = 167.6 m/min, MRR ≈ 201 000 mm³/min. 2020-21 Q.1b converted from inch: d = 0.125 in, f = 0.01 in/rev, N = 382 rpm, t ≈ 12.0 min.</p>
            <p class="key"><span class="key-tag">Remember</span>Power = K × MRR (divide by efficiency for motor power). Torque = P/ω = Fc·D/2.</p>`,
        },
        {
          id: 'effects', chip: 'Raising V, f, d', group: 'Effects', eyebrow: 'Turning · slide 20', title: 'What happens when V, f or d go up',
          cam: camFor('tool'),
          html: () => `
            <p>Try each slider alone and watch the tool-tip glow (temperature), the red force arrow and the verdicts in the HUD.</p>
            <div class="ctl">
              <div class="ctl-row"><label for="lab-V4">Cutting speed V</label><output class="val" data-out="V"></output></div>
              <input id="lab-V4" type="range" min="10" max="400" step="1" data-key="V">
              <div class="ctl-row"><label for="lab-f4">Feed f</label><output class="val" data-out="f"></output></div>
              <input id="lab-f4" type="range" min="0.1" max="1.2" step="0.01" data-key="f">
              <div class="ctl-row"><label for="lab-d5">Depth d</label><output class="val" data-out="d"></output></div>
              <input id="lab-d5" type="range" min="0.5" max="8" step="0.1" data-key="d">
              <div class="presets">
                <button class="pbtn" type="button" data-set="V:150,f:0.1,d:0.5,r:0.8">Finishing</button>
                <button class="pbtn" type="button" data-set="V:60,f:0.5,d:5,r:0.8">Roughing</button>
                <button class="pbtn" type="button" data-set="V:250,f:0.4,d:2,r:0.8">Too fast</button>
                <button class="pbtn" type="button" data-set="V:75,f:0.4,d:4.2,r:0.8">Note C</button>
              </div>
              <p class="ro">Finish <b data-ro="fin"></b> · temperature <b data-ro="temp"></b> · force <b data-ro="Fc"></b> · tool life <b data-ro="life"></b> · MRR <b data-ro="mrr"></b></p>
            </div>
            <ul>
              <li><b>Higher V, f, d</b>: higher MRR, but also higher cutting temperature and faster tool wear.</li>
              <li><b>Higher V</b>: lower cutting force and a better finish (the built-up edge disappears), but only up to a limit; beyond it the tool overheats.</li>
              <li><b>Lower f and d</b>: lower force, better finish, less tool wear and less chatter, at the price of lower MRR.</li>
            </ul>
            <div class="duo">
              <div data-band="rough"><h3>Roughing</h3><p>Large d and f, moderate V. Remove stock fast; finish does not matter.</p></div>
              <div data-band="finish"><h3>Finishing</h3><p>Small d and f, higher V, bigger nose radius. Light, cool cut for finish and size.</p></div>
            </div>
            <p class="note">Temperature index is relative to the Note C cut (∝ V<sup>0.4</sup> f<sup>0.2</sup> d<sup>0.1</sup>); tool life uses Taylor VT<sup>n</sup> = C with n = 0.25 (carbide), 60 min at 100 m/min. Trends, not handbook values.</p>
            <p class="exam">Asked: TF 2012-13 Q.4(b).</p>
            <p class="key"><span class="key-tag">Remember</span>V has by far the strongest effect on tool life (T ∝ V<sup>−4</sup> for n = 0.25): +20 % in V roughly halves the life.</p>`,
        },
        {
          id: 'limits', chip: 'What limits them', group: 'Effects', eyebrow: 'Turning · Answer Note B', title: 'What stops us raising V, f and d',
          cam: camFor('far'),
          html: () => `
            <div class="table-wrap"><table class="cmp">
              <tr><th></th><th>Raising it is limited by</th></tr>
              <tr><td><span class="tag-v">V</span></td><td>Cutting temperature rises sharply: crater and flank wear, tool softening, short life (VT<sup>n</sup> = C). Also spindle speed, machine power, vibration of unbalanced jobs, safety on large diameters.</td></tr>
              <tr><td><span class="tag-f">f</span></td><td>Force, power and deflection grow roughly in proportion; finish worsens (h ≈ f²/8r); chatter and edge strength.</td></tr>
              <tr><td><span class="tag-d">d</span></td><td>Force and power; rigidity of machine, tool and work; chatter; insert strength; stock available.</td></tr>
            </table></div>
            <p>All three together are capped by <mark>machine power</mark> (P = F<sub>c</sub>·V), the surface finish and accuracy wanted, and economics. Rule of thumb: <b>maximum d first, then maximum f, then V for an economic tool life</b>.</p>
            <div class="ctl">
              <div class="ctl-row"><label for="lab-Pm">Machine power available</label><output class="val" data-out="Pm"></output></div>
              <input id="lab-Pm" type="range" min="1" max="15" step="0.5" data-key="Pm">
              <div class="ctl-row"><label for="lab-d6">Depth d</label><output class="val" data-out="d"></output></div>
              <input id="lab-d6" type="range" min="0.5" max="8" step="0.1" data-key="d">
              <div class="ctl-row"><label for="lab-f6">Feed f</label><output class="val" data-out="f"></output></div>
              <input id="lab-f6" type="range" min="0.1" max="1.2" step="0.01" data-key="f">
              <p class="ro">Cut needs <b data-ro="P"></b> of <b data-ro="Pm"></b> · largest d at this V and f: <b data-ro="dmax"></b> · largest f at this V and d: <b data-ro="fmax"></b></p>
            </div>
            <p><b>Causes of high temperature:</b> shear in the primary zone (60–70 % of the heat), friction at the chip–tool face (20–30 %), flank rubbing (5–10 %). <b>Effects:</b> tool wear and loss of hot hardness; job expansion, surface damage, residual stress; machine distortion.</p>
            <p class="exam">Asked: TF 2012-13 Q.4(b).</p>
            <p class="key"><span class="key-tag">Remember</span>Order of choice: d max, then f max, then V for economic life. Power, finish and rigidity set the ceilings.</p>`,
        },
        {
          id: 'answer', chip: 'Exam answer', group: 'Exam', eyebrow: 'Model answer', title: 'Worked answers',
          cam: camFor('iso'), plot: false,
          html: () => `
            <p><b>Definitions.</b> V = πDN/1000 m/min (surface speed of the work); f = tool travel per revolution, mm/rev; d = (D<sub>1</sub> − D<sub>2</sub>)/2.</p>
            <p><b>Relations.</b> MRR = V·f·d; t = (L + allowance)/(fN); P = K·MRR; F<sub>c</sub> = K·f·d; T = P/ω = F<sub>c</sub>·D/2.</p>
            <ul>
              <li>2017-18 Q.5d: MRR 126 000 mm³/min, P 1.92 kW, N 459 rpm, T ≈ 40 N·m, t = 0.844 min.</li>
              <li>2018-19 Q.8b: total length 400 + 133.33 = 533.3 mm; N = 533.3/(0.3·5) = 355.6 rpm; V = 167.6 m/min; MRR ≈ 201 000 mm³/min.</li>
              <li>2020-21 Q.1b: d = 0.125 in; f = MRR/(V·d) = 6.75/(5400 × 0.125) = 0.01 in/rev; N = 382 rpm; t = 46/(0.01 × 382) ≈ 12.0 min.</li>
            </ul>
            <p><b>Effects (2012-13 Q.4b).</b> Higher V, f, d raise MRR but also temperature and tool wear. Higher V lowers force and improves finish up to a limit. Lower f and d reduce force, wear and chatter and improve finish. Limits: temperature and tool life (VT<sup>n</sup> = C), machine power, rigidity and chatter, finish, economics.</p>
            <p class="key"><span class="key-tag">Sketch</span>Side view of the bar with V (rotation arrow), f along the axis, d radial between D<sub>1</sub> and D<sub>2</sub>.</p>`,
        },
      ],

      onEnter() {},

      onParam(key) {
        const c = P;
        if (key === 'V' || key === 'D') c.N = (1000 * c.V) / (PI * c.D);
        if (key === 'N') c.V = (c.N * PI * c.D) / 1000;
        c.d = Math.min(c.d, Math.max(c.D / 2 - 2, 0.5));
        if (['D', 'd', 'f', 'r', 'exag'].includes(key)) {
          if (performance.now() - lastBuild > 66) rebuildTurned();
          else dirty = true;
        }
        if (key === 'D' || key === 'r') layout();
      },

      update(dt, t, step) {
        curStep = step || curStep;
        if (dirty && performance.now() - lastBuild > 66) rebuildTurned();
        const c = calc();
        spinA += dt * clamp((c.N / 60) * 2 * PI * 0.12, 0.2, 6);
        stockG.rotation.x = spinA;
        chuckG.rotation.x = spinA;
        const sp = (X0 - XE) / Tcut;
        st += dt;
        if (state === 'cut') {
          cutX = Math.max(X0 - sp * st, XE);
          if (cutX <= XE) { state = 'retract'; st = 0; }
        } else if (state === 'retract') {
          lift = 2.8 * ease(clamp(st / 0.5, 0, 1));
          if (st > 1.8) { state = 'drop'; st = 0; cutX = X0; }
        } else {
          lift = 2.8 * (1 - ease(clamp(st / 0.5, 0, 1)));
          if (st >= 0.5) restart();
        }
        if (state === 'drop') cutX = X0;
        const r2 = R2();
        rig.position.set(cutX + rvOf(), r2 + lift, 0);
        layoutStock();
        setDraw();
        noseMat.emissiveIntensity = clamp((c.temp - 0.6) * 1.1, 0, 1.4);
        chipMat.emissiveIntensity = clamp((c.temp - 0.6) * 0.9, 0, 1.2);
        if (state === 'cut' && cutX < Lb + 0.2 && dt > 0) {
          chipAcc += dt * clamp(c.mrr / 6000, 4, 40);
          while (chipAcc >= 1) {
            chipAcc -= 1;
            chip.emit([(cutX + 0.3) / CS, (r2 + 0.1) / CS, 0.2 / CS], [0.6 / CS, 1.6 / CS, 1.4 / CS]);
          }
        }
        chip.update(dt);
      },

      overlay(d, step) {
        curStep = step;
        const r1 = R(), r2 = R2(), c = calc();
        const tipx = cutX + rvOf();
        // always: V arrow label at the free end, f arrow and d marker near the tool
        d.label([Lb + 1.4, r1 + 1.5, 0], 'V', 'v');
        if (step === 'setup' || step === 'feed' || step === 'depth' || step === 'mrr') {
          const y = r2 + rvOf() * 2 + 5.6;
          d.path([[tipx + 3.4, y, 0], [tipx + 0.2, y, 0]].map((p) => [p[0], p[1], p[2]]), 'fline', { arrowEnd: true });
          d.label([tipx + 1.8, y + 0.6, 0], 'f', 'f');
        }
        if (step === 'setup' || step === 'depth') {
          d.dim([cutX - 0.05, r2, 0], [cutX - 0.05, r1, 0], `d = ${P.d.toFixed(2)} mm`, [-1.2, 0, 0], 'dline');
        }
        if (step === 'speed') {
          const xe = Lb;
          d.dim([xe, -r1, 0], [xe, r1, 0], `D = ${P.D.toFixed(1)} mm`, [2.4, 0, 0]);
          const a = clamp(r1 * 0.55, 1.2, 4);
          d.path([[xe, r1, 0], [xe, r1, -a]], 'vline', { arrowEnd: true });
          d.label([xe, r1 + 0.7, -a / 2], `V = ${P.V.toFixed(0)} m/min`, 'v');
          d.path([[xe, r1 / 2, 0], [xe, r1 / 2, -a / 2]], 'vline', { arrowEnd: true });
          d.label([xe, r1 / 2 - 0.6, -a / 4], `${(P.V / 2).toFixed(0)}`, 'v');
          d.line([xe, 0, 0], [xe, r1, 0], 'ref');
          d.label([xe + 0.3, 0.3, 0], `N = ${c.N.toFixed(0)} rpm`, 'dimtxt', 30, 0);
        }
        if (step === 'feed') {
          const pv = P.f * 0.5;
          const k0 = Math.floor(3 / pv);
          const xa = Lb - (k0 + 1) * pv;
          const xb = Lb - k0 * pv;
          const hv = hh(0) * 0.1 * P.exag;
          d.dim([xa, r2 + hv, 0], [xb, r2 + hv, 0], `f = ${P.f.toFixed(2)} mm`, [0, 0.55, 0], 'fline');
          d.line([xa - 0.6, r2, 0], [xb + 0.9, r2, 0], 'ref');
          d.label([xb + 1.5, r2 + hv * 0.5, 0], `h = ${(c.hApprox * 1000).toFixed(0)} µm`, 'dimtxt');
        }
        if (step === 'depth') {
          const xe = Lb;
          d.dim([xe, -r1, 0], [xe, r1, 0], `D1 = ${P.D.toFixed(1)}`, [3.6, 0, 0]);
          d.dim([xe, -r2, 0], [xe, r2, 0], `D2 = ${c.D2.toFixed(1)}`, [1.8, 0, 0]);
        }
        if (step === 'mrr') {
          const w = Math.max(P.f * 0.5, 0.03), h = P.d * 0.1;
          d.path([[cutX - w, r2, 0.0], [cutX, r2, 0], [cutX, r2 + h, 0], [cutX - w, r2 + h, 0]], 'zone', { closed: true });
          d.label([cutX - 1.4, r2 + h + 0.8, 0], `f·d = ${(P.f * P.d).toFixed(2)} mm²`, 'hl');
          d.label([tipx + 2, r2 - 0.9, 0.6], `MRR = ${(c.mrr / 1000).toFixed(1)} cm³/min`, 'dimtxt');
        }
        if (step === 'power' || step === 'effects' || step === 'limits') {
          const len = clamp(c.Fc / 1000, 0.3, 4.5) * 1.1;
          d.path([[tipx, r2 + 0.05, 0], [tipx, r2 + 0.05, len]], 'vline', { arrowEnd: true });
          d.label([tipx, r2 + 0.7, len + 0.4], `Fc = ${c.Fc.toFixed(0)} N`, 'v');
        }
        if (step === 'power') {
          d.line([cutX - 2.2, 0, 0], [cutX - 2.2, r2, 0], 'dline', { arrows: true });
          d.label([cutX - 2.2, r2 / 2, 0], `D/2 → T = ${c.T.toFixed(1)} N·m`, 'dimtxt', -40, 0);
          d.line([cutX - 2.2, r2, 0], [tipx, r2, 0], 'ref');
        }
      },

      hud() {
        const c = calc();
        const base = [['Cutting speed V', `${P.V.toFixed(0)} m/min`], ['Spindle N', `${c.N.toFixed(0)} rpm`], ['Feed f', `${P.f.toFixed(2)} mm/rev`], ['Depth d', `${P.d.toFixed(1)} mm`]];
        let rows = base;
        if (curStep === 'mrr') rows = [...base, ['MRR', `${(c.mrr / 1000).toFixed(1)} cm³/min`], ['Time', `${c.t.toFixed(2)} min`]];
        else if (curStep === 'power') rows = [...base, ['Power', `${(c.W / 1000).toFixed(2)} kW`], ['Torque', `${c.T.toFixed(1)} N·m`]];
        else if (curStep === 'effects' || curStep === 'limits')
          rows = [['V / f / d', `${P.V.toFixed(0)} / ${P.f.toFixed(2)} / ${P.d.toFixed(1)}`], ['Finish', `${finishWord(c)[0]} (${finishScore(c).toFixed(0)} µm)`], ['Temperature', `${tempWord(c)[0]} ×${c.temp.toFixed(2)}`], ['Force Fc', `${forceWord(c)[0]} ${c.Fc.toFixed(0)} N`], ['Tool life', `${lifeWord(c)[0]} ${c.life.toFixed(0)} min`], ['Power', `${(c.W / 1000).toFixed(2)} kW`]];
        else if (curStep === 'feed') rows = [...base.slice(2, 3), ['Nose radius r', `${P.r.toFixed(1)} mm`], ['Ridge h', `${(c.hApprox * 1000).toFixed(0)} µm`]];
        else if (curStep === 'depth') rows = [['D1', `${P.D.toFixed(1)} mm`], ['D2', `${c.D2.toFixed(1)} mm`], ['d', `${P.d.toFixed(2)} mm`]];
        return {
          status: state === 'cut' ? 'Cutting: chips forming' : state === 'retract' ? 'Pass finished' : 'Tool returning',
          statusCls: state === 'cut' ? 'v' : 'f',
          rows,
          verdict: curStep === 'effects' || curStep === 'limits' || curStep === 'power' ? verdict(c) : null,
        };
      },

      readouts() {
        const c = calc();
        const mm3 = (v) => `${v.toFixed(0)} mm³/min`;
        return {
          D1: `${P.D.toFixed(1)} mm`,
          D2: `${c.D2.toFixed(1)} mm`,
          dcalc: `${((P.D - c.D2) / 2).toFixed(2)} mm`,
          N: `${c.N.toFixed(1)} rpm`,
          Vhalf: `${(P.V / 2).toFixed(1)} m/min`,
          h: `${(c.hApprox * 1000).toFixed(1)} µm`,
          fN: `${(P.f * c.N).toFixed(0)} mm/min`,
          A: `${(P.f * P.d).toFixed(2)} mm²`,
          mrr: `${mm3(c.mrr)} = ${(c.mrr / IN ** 3).toFixed(2)} in³/min`,
          mrrs: `${(c.mrr / 60).toFixed(0)} mm³/s`,
          t: `${c.t.toFixed(3)} min`,
          ts: `${(c.t * 60).toFixed(1)} s`,
          P: `${(c.W / 1000).toFixed(2)} kW`,
          Pm: `${P.Pm.toFixed(1)} kW`,
          Fc: `${c.Fc.toFixed(0)} N`,
          T: `${c.T.toFixed(1)} N·m`,
          fin: `${finishWord(c)[0]} ${finishScore(c).toFixed(0)} µm`,
          temp: `${tempWord(c)[0]} ×${c.temp.toFixed(2)}`,
          life: `${c.life.toFixed(0)} min`,
          dmax: `${Math.min((P.Pm * 60000) / (P.K * P.V * 1000 * P.f), 99).toFixed(1)} mm`,
          fmax: `${Math.min((P.Pm * 60000) / (P.K * P.V * 1000 * P.d), 99).toFixed(2)} mm/rev`,
          band: P.f >= 0.35 && P.d >= 3 ? 'rough' : P.f <= 0.15 && P.d <= 1 ? 'finish' : '',
        };
      },

      format(key, v) {
        if (key === 'D' || key === 'd' || key === 'L' || key === 'allow') return `${v.toFixed(key === 'D' ? 1 : key === 'd' ? 2 : 1)} mm`;
        if (key === 'V') return `${v.toFixed(1)} m/min`;
        if (key === 'N') return `${v.toFixed(0)} rpm`;
        if (key === 'f') return `${v.toFixed(3)} mm/rev`;
        if (key === 'r') return `${v.toFixed(1)} mm`;
        if (key === 'K') return `${v.toFixed(0)} N/mm²`;
        if (key === 'exag') return `×${v}`;
        if (key === 'Pm') return `${v.toFixed(1)} kW`;
        return null;
      },

      plot(g, w, h, col, step) {
        const c = calc();
        frame(g, w, h, col);
        const X = (u) => 26 + u * (w - 38);
        const Y = (u) => h - 22 - u * (h - 36);
        const curve = (fn, color) => {
          g.strokeStyle = color;
          g.lineWidth = 1.8;
          g.beginPath();
          for (let i = 0; i <= 60; i++) {
            const u = i / 60;
            const y = clamp(fn(u), 0, 1.05);
            i ? g.lineTo(X(u), Y(y)) : g.moveTo(X(u), Y(y));
          }
          g.stroke();
        };
        if (step === 'speed') {
          curve((u) => u, col.v);
          const u1 = 1, u2 = c.D2 / P.D;
          dot(g, X(u1), Y(u1), col.v);
          dot(g, X(u2), Y(u2), col.accent);
          lab(g, 'V', 8, 18, col.muted);
          lab(g, 'D', w - 14, h - 8, col.muted);
          lab(g, `${P.V.toFixed(0)}`, X(u1) - 28, Y(u1) + 3, col.ink);
          lab(g, `${(P.V * u2).toFixed(0)} (D2)`, X(u2) - 40, Y(u2) - 8, col.ink);
          return 'V is proportional to D at fixed N';
        }
        if (step === 'feed') {
          const sx = (w - 40) / (3 * P.f), base = h - 22, yv = sx * P.exag * 0.6;
          g.beginPath();
          g.moveTo(26, h - 22);
          for (let x = 0; x <= 3 * P.f + 1e-9; x += P.f / 24) {
            let u = x % P.f;
            if (x > 0 && u < 1e-9) u = P.f;
            g.lineTo(26 + x * sx, base - 8 - yv * hh(u));
          }
          g.lineTo(26 + 3 * P.f * sx, h - 22);
          g.fillStyle = col.line;
          g.fill();
          g.strokeStyle = col.ink;
          g.lineWidth = 1.6;
          g.beginPath();
          for (let x = 0; x <= 3 * P.f + 1e-9; x += P.f / 24) {
            let u = x % P.f;
            if (x > 0 && u < 1e-9) u = P.f;
            const px = 26 + x * sx, py = base - 8 - yv * hh(u);
            x ? g.lineTo(px, py) : g.moveTo(px, py);
          }
          g.stroke();
          g.strokeStyle = col.f;
          g.lineWidth = 1.4;
          g.beginPath();
          g.moveTo(26, 22); g.lineTo(26 + P.f * sx, 22);
          g.stroke();
          lab(g, 'f', 26 + (P.f * sx) / 2 - 3, 16, col.f);
          lab(g, `h = ${(c.h * 1000).toFixed(0)} µm`, w - 90, 20, col.muted);
          return 'Surface profile along the axis';
        }
        if (step === 'depth') {
          const cx = 62, cy = h / 2 - 2, R1 = 48, Rr = R1 * (c.D2 / P.D);
          g.strokeStyle = col.ink; g.lineWidth = 1.6;
          g.beginPath(); g.arc(cx, cy, R1, 0, 2 * PI); g.stroke();
          g.fillStyle = col.line;
          g.beginPath(); g.arc(cx, cy, R1, 0, 2 * PI); g.arc(cx, cy, Math.max(Rr, 0), 0, 2 * PI, true); g.fill();
          g.strokeStyle = col.d; g.lineWidth = 2;
          g.beginPath(); g.arc(cx, cy, Math.max(Rr, 0), 0, 2 * PI); g.stroke();
          g.beginPath(); g.moveTo(cx + Rr, cy); g.lineTo(cx + R1, cy); g.stroke();
          lab(g, 'd', cx + (R1 + Rr) / 2 - 2, cy - 5, col.d);
          lab(g, `D1 ${P.D.toFixed(0)}`, 130, 40, col.ink);
          lab(g, `D2 ${c.D2.toFixed(0)}`, 130, 62, col.ink);
          lab(g, `d ${P.d.toFixed(1)}`, 130, 84, col.d);
          return 'Cross-section: layer removed';
        }
        if (step === 'mrr') {
          const fm = 1.2;
          curve((u) => 0.1 / Math.max(u * fm, 0.1) / 1.05, col.f);
          const uf = clamp(P.f / fm, 0, 1);
          dot(g, X(uf), Y(clamp(0.1 / Math.max(P.f, 0.1) / 1.05, 0, 1.05)), col.accent);
          lab(g, 't', 8, 18, col.muted);
          lab(g, 'f →', w - 24, h - 8, col.muted);
          lab(g, `t = ${c.t.toFixed(2)} min`, 56, 22, col.ink);
          return 'Machining time falls as 1/f';
        }
        if (step === 'power') {
          const maxM = 600000;
          curve((u) => u, col.v);
          const u = clamp(c.mrr / maxM, 0, 1);
          dot(g, X(u), Y(u), col.accent);
          lab(g, 'P', 8, 18, col.muted);
          lab(g, 'MRR →', w - 38, h - 8, col.muted);
          lab(g, `${(c.W / 1000).toFixed(2)} kW`, X(u) - 30, Y(u) - 8, col.ink);
          return 'P = K·MRR is a straight line';
        }
        if (step === 'effects') {
          const f = (V) => 60 * Math.pow(100 / V, 4);
          curve((u) => Math.log(f(10 + u * 390) + 1) / Math.log(60 * Math.pow(10, 4) + 1) * 1.0, col.v);
          const u = clamp((P.V - 10) / 390, 0, 1);
          dot(g, X(u), Y(Math.log(c.life + 1) / Math.log(60 * Math.pow(10, 4) + 1)), col.accent);
          lab(g, 'T (log)', 6, 16, col.muted);
          lab(g, 'V →', w - 24, h - 8, col.muted);
          lab(g, `T = ${c.life.toFixed(0)} min`, 56, 24, col.ink);
          return 'Tool life falls steeply with V';
        }
        if (step === 'limits') {
          curve((u) => (P.K * P.V * 1000 * P.f * (0.5 + u * 7.5)) / 60000 / 1000 / 15, col.d);
          const y = P.Pm / 15;
          g.setLineDash([4, 3]);
          g.strokeStyle = col.v;
          g.beginPath(); g.moveTo(26, Y(y)); g.lineTo(w - 10, Y(y)); g.stroke();
          g.setLineDash([]);
          const u = clamp((P.d - 0.5) / 7.5, 0, 1);
          dot(g, X(u), Y(clamp(c.W / 1000 / 15, 0, 1.05)), col.accent);
          lab(g, 'P', 8, 18, col.muted);
          lab(g, 'd →', w - 20, h - 8, col.muted);
          lab(g, `limit ${P.Pm.toFixed(1)} kW`, 54, Y(y) - 4, col.v);
          return 'Power needed rises with d; the limit is the machine';
        }
        return '';
      },
    };
  },
};
