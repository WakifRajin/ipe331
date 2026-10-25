// Effect lab: taper turning (Answer Note E). Half-angle tan(a) = (D-d)/2l, tailstock set-over s = L(D-d)/2l,
// and the four methods: compound rest, tailstock offset, taper attachment, form tool.
// Work lies along x, tool on the +z side (plan view). One world unit is 1/sc millimetres (uniform, so angles are true).
const PI = Math.PI;
const DEG = 180 / PI;

export default {
  id: 'taper-calc',
  chapter: 'turning',
  title: 'Taper turning: angle and set-over',
  eyebrow: 'Turning · slide 32 · Answer Note E',
  sub: 'Set the large and small diameters and the taper length, read off the half-angle and the tailstock set-over, then see how each method makes that taper.',
  blurb: 'tan α = (D − d)/2l and s = L(D − d)/2l, plus how the compound rest, tailstock offset, taper attachment and form tool work and which suits a given taper.',
  qs: ['2017-18_5b', '2016-17_5c', '2014-15_5b', '2013-14_6a', '2012-13_5b', '2011-12_5c', '2011-12_5b'],
  params: { D: 40, d: 30, l: 100, L: 200, method: 'compound' },

  build({ THREE, scene, P, kit }) {
    const { M } = kit;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const ease = (s) => s * s * (3 - 2 * s);
    const S = 40; // radial segments of the frustum

    // ---------- derived values ----------
    const alpha = () => Math.atan((P.D - P.d) / (2 * P.l));
    const sc = () => Math.min(0.08, 16 / P.L);
    const setOver = () => (P.L * (P.D - P.d)) / (2 * P.l);
    const verdictFor = (m) => {
      const a = alpha() * DEG;
      if (m === 'form') return P.l <= 25 ? ['Suitable: short taper, plunge the form tool', 'ok'] : [`Not suitable: l = ${P.l.toFixed(0)} mm is too long for a form tool (limit about 25 mm)`, 'bad'];
      if (m === 'offset') return a <= 8 ? ['Suitable: gentle taper, external only', 'ok'] : [`Not suitable: α = ${a.toFixed(1)}° is steeper than about 8°`, 'bad'];
      if (m === 'attachment') return a <= 10 ? ['Suitable: power feed, good finish', 'ok'] : a <= 12 ? [`Marginal: α = ${a.toFixed(1)}° is at the attachment limit (10–12°)`, 'warn'] : [`Not suitable: α = ${a.toFixed(1)}° is beyond about 12°`, 'bad'];
      return P.l <= 75 ? ['Suitable: any angle, short taper, hand feed', 'ok'] : P.l <= 130 ? ['Marginal: length near the compound-slide travel, hand feed gives a poorer finish', 'warn'] : ['Not suitable: taper longer than the compound-slide travel', 'bad'];
    };
    const NAMES = { compound: 'Compound rest swivelled', offset: 'Tailstock set-over', attachment: 'Taper-turning attachment', form: 'Form tool plunged' };
    const stepOf = { compound: 'compound', offset: 'offset', attachment: 'attachment', form: 'form' };

    // ---------- fixed machine parts ----------
    const bed = kit.box(1, 1, 1, M.castIron);
    const head = kit.box(1, 1, 1, M.paint);
    const tailBase = kit.box(1, 1, 1, M.paintDark);
    const tailBody = kit.box(1, 1, 1, M.paint);
    const ctrL = kit.cyl(1, 1, M.steel, { axis: 'x', rTop: 0.12 });
    const ctrR = kit.cyl(1, 1, M.steel, { axis: 'x', rTop: 0.12 });
    scene.add(bed, head, tailBase, tailBody, ctrL, ctrR);

    // ---------- work (job-local frame: x' along the job axis from the headstock centre) ----------
    const job = new THREE.Group();
    const stock = kit.cyl(1, 1, M.work, { axis: 'x', seg: 48 });
    const frustumGeo = new THREE.BufferGeometry();
    const fpos = new Float32Array(2 * (S + 1) * 3);
    const fnor = new Float32Array(2 * (S + 1) * 3);
    const findex = [];
    for (let j = 0; j < S; j++) {
      const a = j, b = j + 1, c = j + S + 1, d = c + 1;
      findex.push(a, b, c, b, d, c);
    }
    frustumGeo.setAttribute('position', new THREE.BufferAttribute(fpos, 3));
    frustumGeo.setAttribute('normal', new THREE.BufferAttribute(fnor, 3));
    frustumGeo.setIndex(findex);
    const frustumMat = new THREE.MeshStandardMaterial({ color: 0xf1f3f5, roughness: 0.18, metalness: 0.9, side: THREE.DoubleSide });
    const frustum = new THREE.Mesh(frustumGeo, frustumMat);
    frustum.frustumCulled = false;
    frustum.castShadow = true;
    const capR = new THREE.Mesh(new THREE.CircleGeometry(1, 40).rotateY(PI / 2), M.workCut);
    const spin = kit.spinArrow(1, M.vColor, { axis: 'x', arc: PI * 1.4, tube: 0.04 });
    job.add(stock, frustum, capR, spin);
    scene.add(job);

    // ---------- tool and mechanisms ----------
    const tool = new THREE.Group();
    const toolNose = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 12).rotateX(-PI / 2), M.carbide); // tip points -z
    toolNose.position.z = 0.3;
    const toolBody = kit.box(0.55, 0.45, 2.2, M.darkSteel);
    toolBody.position.set(0, 0.05, 1.6);
    tool.add(toolNose, toolBody);
    const formTool = new THREE.Mesh(new THREE.BufferGeometry(), M.carbide);
    formTool.castShadow = true;
    const carriage = kit.box(1, 1, 1, M.paintLight);
    const cross = kit.box(1, 1, 1, M.paint);
    const swivel = kit.cyl(1, 0.3, M.chrome, { seg: 40 });
    const comp = kit.box(1, 1, 1, M.paintDark);
    const post = kit.box(1, 1, 1, M.darkSteel);
    const bar = kit.box(1, 1, 1, M.brass);
    const block = kit.box(1, 1, 1, M.red);
    const rod = kit.box(1, 1, 1, M.steel);
    const rodPost = kit.box(1, 1, 1, M.steel);
    scene.add(tool, formTool, carriage, cross, swivel, comp, post, bar, block, rod, rodPost);
    const chips = kit.chips(40, M.workCut);
    const CS = 2;
    chips.object.scale.setScalar(CS);
    scene.add(chips.object);

    const setBox = (m, w, h, d, x, y, z) => {
      m.scale.set(w, h, d);
      m.position.set(x, y, z);
    };

    // ---------- geometry bookkeeping ----------
    let method = '', jobAng = 0, p = 0, state = 'run', hold = 0, chipAcc = 0, curStep = 'what', dirty = true, lastBuild = 0;
    const g = { Lu: 0, lu: 0, rD: 0, rd: 0, Qu: 0, t: 0 };
    const W = [0, 0, 0]; // scratch world point
    const wpt = (xl, r, out = W) => {
      const ca = Math.cos(jobAng), sa = Math.sin(jobAng);
      out[0] = -g.Lu / 2 + xl * ca - r * sa;
      out[1] = 0;
      out[2] = xl * sa + r * ca;
      return out;
    };
    const refresh = () => {
      const s = sc();
      g.Lu = P.L * s;
      g.lu = P.l * s;
      g.rD = (P.D / 2) * s;
      g.rd = (P.d / 2) * s;
      g.Qu = g.rD - g.rd;
      g.t = Math.tan(alpha());
    };

    function layout() {
      refresh();
      const { Lu, rD } = g;
      setBox(bed, Lu + 16, 0.9, 18, 0, -4.05, 1);
      setBox(head, 3.2, 3.6, 3.4, -Lu / 2 - 2.6, -1.6, 0);
      setBox(tailBase, 3.4, 0.6, 3.4, Lu / 2 + 2.7, -3.3, 0);
      job.position.set(-Lu / 2, 0, 0);
      stock.scale.set(1, rD, rD);
      const sp = rD + 0.6;
      spin.position.x = 0.9;
      spin.scale.set(1, sp, sp);
      ctrL.scale.set(1.2, 0.5, 0.5);
      ctrL.position.set(-Lu / 2 - 0.6, 0, 0);
      ctrR.scale.set(1.2, 0.5, 0.5);
      buildForm();
    }
    function buildForm() {
      const { Lu, lu, rD, rd } = g;
      const xR = Lu / 2, xL = xR - lu;
      const shp = new THREE.Shape();
      shp.moveTo(xL, rD);
      shp.lineTo(xR, rd);
      shp.lineTo(xR + 0.3, rd);
      shp.lineTo(xR + 0.3, rD + 4.5);
      shp.lineTo(xL - 0.3, rD + 4.5);
      shp.lineTo(xL - 0.3, rD);
      shp.closePath();
      const geo = new THREE.ExtrudeGeometry(shp, { depth: 0.8, bevelEnabled: false }).rotateX(PI / 2).translate(0, 0.4, 0);
      formTool.geometry.dispose();
      formTool.geometry = geo;
    }

    function applyMethod() {
      method = P.method;
      p = 0; state = 'run'; hold = 0;
      const isForm = method === 'form';
      formTool.visible = isForm;
      tool.visible = !isForm;
      swivel.visible = comp.visible = method === 'compound';
      bar.visible = block.visible = rod.visible = rodPost.visible = method === 'attachment';
      cross.visible = carriage.visible = post.visible = !isForm;
      tailBody.visible = ctrR.visible = true;
    }

    function setFrustum(xA, rA, xB, rB) {
      const nx = g.t / Math.sqrt(1 + g.t * g.t), nr = 1 / Math.sqrt(1 + g.t * g.t);
      let k = 0;
      for (let ring = 0; ring < 2; ring++) {
        const x = ring ? xB : xA, r = ring ? rB : rA;
        for (let j = 0; j <= S; j++) {
          const th = (2 * PI * j) / S, c = Math.cos(th), s = Math.sin(th);
          fpos[k] = x; fnor[k++] = nx;
          fpos[k] = r * c; fnor[k++] = nr * c;
          fpos[k] = r * s; fnor[k++] = nr * s;
        }
      }
      frustumGeo.attributes.position.needsUpdate = true;
      frustumGeo.attributes.normal.needsUpdate = true;
      stock.scale.x = Math.max(xA, 0.001);
      stock.position.x = xA / 2;
      capR.position.x = xB;
      capR.scale.set(1, Math.max(rB, 0.001), Math.max(rB, 0.001));
    }

    // ---------- per-frame model pose ----------
    const tip = [0, 0, 0];
    function pose(dt) {
      const { Lu, lu, rD, rd, Qu, t } = g;
      const a = alpha();
      const target = method === 'offset' ? a : 0;
      jobAng += (target - jobAng) * Math.min(1, dt * 8);
      if (dt === 0) jobAng = target;
      job.rotation.y = -jobAng;
      const ca = Math.cos(jobAng), sa = Math.sin(jobAng);
      // tailstock follows the job's right-hand centre
      const c2x = -Lu / 2 + Lu * ca, c2z = Lu * sa;
      setBox(tailBody, 2.6, 2.6, 2.6, c2x + 2.4, -1.5, c2z);
      ctrR.position.set(c2x + 0.5, 0, c2z);
      ctrR.scale.set(1.0, 0.5, 0.5);

      let xA, rA, rB;
      let carX, toolZ;
      if (method === 'form') {
        const total = Qu + 1.5;
        const dl = (1 - p) * total; // tool retraction beyond the final position
        const q = Math.max(Qu - dl, 0);
        xA = Lu - (t > 0 ? q / t : 0);
        rA = rD;
        rB = Math.min(rd + dl, rD);
        setFrustum(xA, rA, Lu, rB);
        formTool.position.set(0, 0, dl);
        tip[0] = -Lu / 2 + (Lu - lu * 0.5) + 0; // for chips only
        tip[1] = 0;
        tip[2] = rD - Qu * 0.5 + dl;
        return q > 0.001 && p < 1;
      }
      xA = Lu - p * lu;
      rA = rd + p * lu * t;
      setFrustum(xA, rA, Lu, rd);
      wpt(xA, rA);
      tip[0] = W[0]; tip[1] = 0; tip[2] = W[2];
      tool.position.set(W[0], 0, W[2]);
      carX = W[0];
      toolZ = W[2];
      const ZC = rD + 8.5;
      if (method === 'compound') {
        // carriage and cross slide stay put; the swivelled compound slide carries the post along the line at angle a
        const sx = Lu / 2, sz = rd; // tool start point
        const slideLen = lu / Math.cos(a) + 5;
        const mx = sx - (lu / 2), mz = sz + (lu / 2) * t; // mid-travel point
        const px = mx, pz = mz + 2.3;
        setBox(carriage, 4, 2.2, 3.4, px, -2.5, ZC);
        setBox(cross, 3.2, 0.5, ZC + 1.7 - (pz - 0.5), px, -1.15, (pz - 0.5 + ZC + 1.7) / 2);
        swivel.scale.set(2.0, 1, 2.0);
        swivel.position.set(px, -0.8, pz);
        setBox(comp, slideLen, 0.4, 1.5, px, -0.45, pz);
        comp.rotation.y = a;
        // post slides on the swivelled slide
        setBox(post, 1.3, 0.5, 1.4, carX, -0.1, toolZ + 2.3);
        post.rotation.y = a;
      } else {
        setBox(carriage, 4, 2.2, 3.4, carX, -2.5, ZC);
        setBox(cross, 3.2, 0.5, ZC + 1.7 - (toolZ + 0.5), carX, -1.15, (toolZ + 0.5 + ZC + 1.7) / 2);
        setBox(post, 1.8, 0.7, 1.8, carX, -0.5, toolZ + 1.5);
        post.rotation.y = 0;
        if (method === 'attachment') {
          const off = rD + 5.5;
          const zb = toolZ - off;
          const mx = Lu / 2 - lu / 2, mz = rd + (lu / 2) * t - off;
          setBox(bar, lu / Math.cos(a) + 5, 0.45, 0.8, mx, -3.3, mz);
          bar.rotation.y = a;
          setBox(block, 1.3, 0.7, 1.4, carX, -3.3, zb);
          setBox(rod, 0.4, 0.4, toolZ + 0.4 - zb, carX, -3.3, (toolZ + 0.4 + zb) / 2);
          setBox(rodPost, 0.5, 2.3, 0.6, carX, -2.3, toolZ + 0.3);
        }
      }
      return p < 1 && state === 'run';
    }

    // ---------- plots ----------
    const frame = (gx, w, h, c) => {
      gx.strokeStyle = c.line; gx.lineWidth = 1;
      gx.beginPath(); gx.moveTo(26, 10); gx.lineTo(26, h - 22); gx.lineTo(w - 10, h - 22); gx.stroke();
    };
    const dotAt = (gx, x, y, col) => { gx.fillStyle = col; gx.beginPath(); gx.arc(x, y, 4, 0, 2 * PI); gx.fill(); };
    const text = (gx, s, x, y, col) => { gx.fillStyle = col; gx.fillText(s, x, y); };

    // ---------- step helpers ----------
    const sliders = (ids = 'Ddl') => {
      const rows = {
        D: `<div class="ctl-row"><label for="lab-D">Large diameter D</label><output class="val" data-out="D"></output></div><input id="lab-D" type="range" min="20" max="80" step="1" data-key="D">`,
        d: `<div class="ctl-row"><label for="lab-d">Small diameter d</label><output class="val" data-out="d"></output></div><input id="lab-d" type="range" min="5" max="79" step="1" data-key="d">`,
        l: `<div class="ctl-row"><label for="lab-l">Taper length l</label><output class="val" data-out="l"></output></div><input id="lab-l" type="range" min="5" max="300" step="1" data-key="l">`,
        L: `<div class="ctl-row"><label for="lab-L">Job length L between centres</label><output class="val" data-out="L"></output></div><input id="lab-L" type="range" min="60" max="400" step="5" data-key="L">`,
      };
      return [...ids].map((k) => rows[k].replace(/lab-(\w)/g, `lab-$1-${ids}`)).join('');
    };
    const presets = `<div class="presets"><button class="pbtn" type="button" data-set="D:40,d:36,l:100">Gentle</button><button class="pbtn" type="button" data-set="D:40,d:30,l:100">Medium</button><button class="pbtn" type="button" data-set="D:50,d:40,l:100,L:300">Exam eg.</button><button class="pbtn" type="button" data-set="D:40,d:20,l:40">Steep</button><button class="pbtn" type="button" data-set="D:40,d:34,l:20">Short</button></div>`;

    return {
      legend: [['var(--v)', 'Work rotation V'], ['var(--f)', 'Tool path'], ['var(--d)', 'Set-over or plunge']],
      live: true,
      steps: [
        {
          id: 'what', chip: 'What is a taper', group: 'Basics', eyebrow: 'Turning · slide 32', title: 'A taper is a cone cut on the job',
          cam: { position: [0, 16, 15], target: [0, 0, 1] }, plot: false,
          onEnter: () => { P.method = 'compound'; },
          html: () => `
            <p>A <mark>taper</mark> is a diameter that changes steadily along the length. Four numbers describe it: the <b>large diameter D</b>, the <b>small diameter d</b>, the <b>taper length l</b>, and the angle.</p>
            <div class="ctl">${sliders('Ddl')}${presets}
              <p class="ro">Half-angle α = <b data-ro="alpha"></b> · included angle 2α = <b data-ro="a2"></b> · taper = <b data-ro="ratio"></b></p>
            </div>
            <ul>
              <li><b>Half-angle α</b> is the angle between the taper surface and the job axis. It is the angle the tool path must make with the axis.</li>
              <li>Each radius changes by (D − d)/2 over the length l.</li>
              <li>Machine tapers (centres, drill shanks) are made this way, and so are chamfers.</li>
            </ul>
            <p class="key"><span class="key-tag">Remember</span>Taper needs D, d and l; the turning angle is the half-angle α, measured from the axis.</p>`,
        },
        {
          id: 'angle', chip: 'Half-angle formula', group: 'Basics', eyebrow: 'Answer Note E', title: 'tan α = (D − d) / 2l',
          cam: { position: [0, 11, 11], target: [1, 0, 1] },
          onEnter: () => { P.method = 'compound'; },
          html: () => `
            <p>Look at half of the side view: the radius drops by (D − d)/2 while the tool moves l along the axis. That makes a right-angled triangle (shaded on the model):</p>
            <p class="formula">tan α = (D − d) / (2 l)</p>
            <div class="ctl">${sliders('Ddl')}
              <p class="ro">(D − d)/2 = <b data-ro="rise"></b> over l = <b data-ro="run"></b> → tan α = <b data-ro="tan"></b> → α = <b data-ro="alpha"></b></p>
            </div>
            <ul>
              <li>Shorter l with the same D − d means a <b>steeper</b> taper (try the Steep preset).</li>
              <li>If an angle is given instead, d = D − 2l tan α.</li>
            </ul>
            <p class="key"><span class="key-tag">Remember</span>Half-angle α = arctan((D − d)/2l). The tool or job is set over by this angle.</p>`,
        },
        {
          id: 'compound', chip: 'Compound rest', group: 'Methods', eyebrow: 'Answer Note E · 2013-14 Q.6a, 2011-12 Q.5b', title: '1. Swivel the compound rest',
          cam: { position: [0, 17, 16], target: [0, -0.5, 3] }, plot: false,
          onEnter: () => { P.method = 'compound'; },
          html: () => `
            <p>The compound rest sits on the cross slide on a graduated swivel base. Turn it <mark>through the half-angle α</mark>, lock it, and feed with the compound handle. The tool then travels <b>at angle α to the axis</b> and cuts a cone.</p>
            <div class="ctl">${sliders('Ddl')}
              <p class="ro">Swivel the compound rest to α = <b data-ro="alpha"></b> · slide travel needed = <b data-ro="travel"></b></p>
              <p class="ro"><span data-ro="vcomp"></span></p>
            </div>
            <ul>
              <li><b>Good for</b>: short, steep tapers at any angle up to 90 degrees (centres, bevels, chamfers).</li>
              <li><b>Limits</b>: hand feed only, so poorer finish; length limited by the compound-slide travel.</li>
              <li>Internal tapers are possible too.</li>
            </ul>
            <p class="exam">Asked: TF 2013-14 Q.6(a), 2011-12 Q.5(b).</p>
            <p class="key"><span class="key-tag">Remember</span>Compound rest set to α: tool moves at α to the axis, by hand. Short, steep tapers only.</p>`,
        },
        {
          id: 'offset', chip: 'Tailstock offset', group: 'Methods', eyebrow: 'Answer Note E · 2014-15 Q.5b', title: '2. Offset the tailstock',
          cam: { position: [0, 17, 11], target: [0, 0, 1.5] },
          onEnter: () => { P.method = 'offset'; },
          html: () => `
            <p>The job is held <mark>between centres</mark>. The tailstock body is shifted sideways on its base by <b>s</b>, so the job axis is inclined to the line of carriage travel. The normal power feed then cuts a taper.</p>
            <p class="formula">s = L (D − d) / (2 l) = L tan α</p>
            <div class="ctl">${sliders('DdlL')}
              <p class="ro">α = <b data-ro="alpha"></b> · s = <b data-ro="s"></b> (exact L sin α = <b data-ro="ssin"></b>)</p>
              <p class="ro"><span data-ro="voff"></span></p>
            </div>
            <ul>
              <li>L is the <b>whole length between centres</b>, not the taper length. The same taper on a job twice as long needs twice the set-over.</li>
              <li><b>Good for</b>: long, slender, gentle tapers (α up to about 8 degrees), with power feed and good finish.</li>
              <li><b>Limits</b>: external only; centre holes wear unevenly; every job length needs a new set-up.</li>
            </ul>
            <p class="exam">Asked: TF 2014-15 Q.5(b).</p>
            <p class="key"><span class="key-tag">Remember</span>s = L(D − d)/2l. Tailstock set over by s, tool moves parallel to the bed. Gentle external tapers only.</p>`,
        },
        {
          id: 'attachment', chip: 'Taper attachment', group: 'Methods', eyebrow: 'Answer Note E · 2017-18 Q.5b, 2016-17 Q.5c, 2012-13 Q.5b, 2011-12 Q.5c', title: '3. Taper-turning attachment',
          cam: { position: [0, 18, 17], target: [0, -1.5, 1.5] }, plot: false,
          onEnter: () => { P.method = 'attachment'; },
          html: () => `
            <p>A <mark>guide bar</mark> is fixed behind the bed and swivelled to α. A sliding block on the bar is joined to the cross slide. The cross slide is <b>freed from the cross-feed screw</b> (the binder screw is removed). As the carriage feeds along, the block follows the bar and <mark>pulls the cross slide</mark>, so the tool follows the taper.</p>
            <div class="ctl">${sliders('Ddl')}
              <p class="ro">Set the guide bar to α = <b data-ro="alpha"></b></p>
              <p class="ro"><span data-ro="vatt"></span></p>
            </div>
            <ul>
              <li><b>Good for</b>: power feed gives a good finish; work can stay in the chuck or between centres; internal tapers too; the same taper repeats on different lengths.</li>
              <li><b>Limit</b>: angle up to about 10–12 degrees.</li>
            </ul>
            <p class="exam">Asked: TF 2017-18 Q.5(b), 2016-17 Q.5(c), 2012-13 Q.5(b), 2011-12 Q.5(c). Answer to the question that asks in which method the cross slide is freed from the lead screw: the taper-turning attachment.</p>
            <p class="key"><span class="key-tag">Remember</span>Guide bar at α, sliding block pulls the cross slide, binder screw removed. Power feed, up to about 12°.</p>`,
        },
        {
          id: 'form', chip: 'Form tool', group: 'Methods', eyebrow: 'Answer Note E', title: '4. Plunge a form tool',
          cam: { position: [0, 15, 13], target: [0, 0, 2] }, plot: false,
          onEnter: () => { P.method = 'form'; },
          html: () => `
            <p>The cutting edge is <mark>ground to the taper angle</mark> and fed straight in (radially). The taper is produced in one plunge with no longitudinal feed.</p>
            <div class="ctl">${sliders('Ddl')}
              <p class="ro">Edge angle α = <b data-ro="alpha"></b>, edge length l = <b data-ro="l"></b></p>
              <p class="ro"><span data-ro="vform"></span></p>
            </div>
            <ul>
              <li><b>Good for</b>: short tapers and chamfers, up to about 25 mm; fast and repeatable.</li>
              <li><b>Limits</b>: long edges chatter and need a lot of force and rigidity; one tool per taper.</li>
            </ul>
            <p class="key"><span class="key-tag">Remember</span>Form tool: the angle is in the tool, the motion is a radial plunge. Only for about 25 mm or less.</p>`,
        },
        {
          id: 'choose', chip: 'Choosing a method', group: 'Methods', eyebrow: 'Answer Note E', title: 'Which method suits this taper?',
          cam: { position: [0, 17, 16], target: [0, -0.5, 3] },
          html: () => `
            <p>Change the taper and see which methods work. Pick one to watch it.</p>
            <div class="ctl">${sliders('DdlL')}${presets}
              <div class="seg"><button type="button" data-set="method:compound">Compound</button><button type="button" data-set="method:offset">Offset</button><button type="button" data-set="method:attachment">Attachment</button><button type="button" data-set="method:form">Form tool</button></div>
              <p class="ro">α = <b data-ro="alpha"></b>, l = <b data-ro="l"></b>, s = <b data-ro="s"></b></p>
            </div>
            <div class="table-wrap"><table class="cmp">
              <tr><th>Method</th><th>Verdict for this taper</th></tr>
              <tr><td>Form tool</td><td data-ro="vform"></td></tr>
              <tr><td>Compound rest</td><td data-ro="vcomp"></td></tr>
              <tr><td>Tailstock offset</td><td data-ro="voff"></td></tr>
              <tr><td>Attachment</td><td data-ro="vatt"></td></tr>
            </table></div>
            <p class="note">Rules of thumb: form tool l ≤ 25 mm; offset α ≤ 8°, external only; attachment α ≤ 10–12°; compound any angle, but short and by hand.</p>`,
        },
        {
          id: 'answer', chip: 'Exam answer', group: 'Exam', eyebrow: 'Model answer', title: 'Methods of taper turning',
          cam: { position: [0, 15, 15], target: [0, 0, 1] }, plot: false,
          html: () => `
            <p><b>Taper:</b> tan α = (D − d)/2l, with α the half-angle, D and d the large and small diameters, l the taper length.</p>
            <ol class="steps">
              <li><b>Form tool</b>: edge ground to the angle, plunged in. Short tapers (up to about 25 mm).</li>
              <li><b>Compound rest</b>: swivelled through α, tool fed by hand at α to the axis. Short, steep tapers; poorer finish.</li>
              <li><b>Tailstock offset</b>: job between centres, tailstock set over s = L(D − d)/2l; power feed. Long gentle tapers (α up to about 8°); external only; centre holes wear.</li>
              <li><b>Taper-turning attachment</b>: guide bar at α behind the bed, sliding block pulls the cross slide (cross-feed screw disengaged by removing the binder screw); power feed, good finish, internal tapers possible, up to about 10–12°.</li>
              <li>Combined longitudinal and cross feed, and CNC.</li>
            </ol>
            <p class="key"><span class="key-tag">Sketch</span>Offset: plan view with the headstock centre on the axis and the tailstock centre displaced by s. Attachment: guide bar at α with the block, rod and cross slide.</p>`,
        },
      ],

      onParam(key) {
        if (key === 'D') P.d = Math.min(P.d, P.D - 1);
        if (key === 'd') P.d = Math.min(P.d, P.D - 1);
        if (key === 'L') P.l = Math.min(P.l, P.L);
        if (key === 'l') P.l = Math.min(P.l, P.L);
        if (key === 'D' || key === 'd' || key === 'l' || key === 'L') {
          p = 0; state = 'run';
          if (performance.now() - lastBuild > 50) { layout(); lastBuild = performance.now(); dirty = false; } else dirty = true;
        }
      },

      update(dt, t, step) {
        curStep = step || curStep;
        if (method !== P.method) applyMethod();
        if (dirty && performance.now() - lastBuild > 50) { layout(); lastBuild = performance.now(); dirty = false; }
        if (!g.Lu) layout();
        const dur = method === 'form' ? 3.5 : 7;
        if (state === 'run') {
          p = Math.min(p + dt / dur, 1);
          if (p >= 1) { state = 'hold'; hold = 0; }
        } else {
          hold += dt;
          if (hold > 1.8) { p = 0; state = 'run'; }
        }
        const cutting = pose(dt);
        if (cutting && dt > 0) {
          chipAcc += dt * 22;
          while (chipAcc >= 1) {
            chipAcc -= 1;
            chips.emit([tip[0] / CS, 0.1 / CS, (tip[2] + 0.2) / CS], [(Math.random() - 0.3) * 0.8 / CS, 1.4 / CS, 1.6 / CS]);
          }
        }
        chips.update(dt);
      },

      overlay(d, step) {
        curStep = step;
        refresh();
        const { Lu, lu, rD, rd, Qu } = g;
        const a = alpha();
        const E = wpt(Lu, rd, [0, 0, 0]);
        const Ed = wpt(Lu - lu, rD, [0, 0, 0]);
        const Eo = wpt(Lu, rD, [0, 0, 0]);
        const ca = Math.cos(jobAng), sa = Math.sin(jobAng);
        const axisDir = [ca, 0, sa], radDir = [-sa, 0, ca];
        // job axis (centre line)
        d.line(wpt(-1.2, 0, [0, 0, 0]), wpt(Lu + 1.5, 0, [0, 0, 0]), 'cl');
        // dimensions
        d.dim(wpt(0, -rD, [0, 0, 0]), wpt(0, rD, [0, 0, 0]), `D = ${P.D} mm`, [-1.2, 0, 0]);
        d.dim(wpt(Lu, -rd, [0, 0, 0]), wpt(Lu, rd, [0, 0, 0]), `d = ${P.d} mm`, [1.4, 0, 0]);
        d.dim(wpt(Lu - lu, rD, [0, 0, 0]), wpt(Lu, rD, [0, 0, 0]), `l = ${P.l} mm`, [radDir[0] * 1.6, 0, radDir[2] * 1.6]);
        // taper edge and the reference parallel to the axis through the small end
        d.line(E, Ed, 'dline');
        d.line(E, wpt(Lu - lu - 0.6, rd, [0, 0, 0]), 'ref');
        const r = clamp(lu * 0.45, 1.2, 4);
        d.arc(E, [-axisDir[0], 0, -axisDir[2]], radDir, r, 0, a, 'arc');
        d.label([E[0] - axisDir[0] * (r + 1.1) + radDir[0] * 0.5, 0, E[2] - axisDir[2] * (r + 1.1) + radDir[2] * 0.5], `α = ${(a * DEG).toFixed(2)}°`, 'hl');
        if (step === 'angle') {
          const A = wpt(Lu - lu, rD, [0, 0, 0]);
          const Bq = wpt(Lu, rD, [0, 0, 0]);
          const Cq = wpt(Lu, rd, [0, 0, 0]);
          d.path([A, Bq, Cq], 'zone', { closed: true });
          d.label([(A[0] + Bq[0]) / 2, 0, (A[2] + Bq[2]) / 2 + 0.9], `l = ${P.l}`, 'dimtxt');
          d.label([Bq[0] + 1.7, 0, (Bq[2] + Cq[2]) / 2], `(D−d)/2 = ${((P.D - P.d) / 2).toFixed(1)}`, 'dimtxt');
        }
        if (step === 'what') {
          d.label([Lu / 2 - 0.2, 0, -rD - 1.2], `2α = ${(2 * a * DEG).toFixed(2)}°`, 'minor');
        }
        // method specific
        const m = P.method;
        if (step === 'compound' || (step === 'choose' && m === 'compound')) {
          const sx = Lu / 2, sz = rd;
          const mx = sx - lu / 2, mz = sz + (lu / 2) * Math.tan(a) + 2.3;
          const L1 = clamp(lu + 3, 4, 14);
          d.line([mx + L1 / 2 * 1.0, 0, mz], [mx - L1, 0, mz], 'ref');
          d.line([mx, 0, mz], [mx - L1 * Math.cos(a), 0, mz + L1 * Math.sin(a)], 'fline');
          d.arc([mx, 0, mz], [-1, 0, 0], [0, 0, 1], L1 * 0.55, 0, a, 'arc');
          d.label([mx - L1 * 0.55 - 1.2, 0, mz + 0.8], `swivel ${(a * DEG).toFixed(1)}°`, 'f');
          d.path([[sx, 0.3, rd - 1.6], [sx - lu * 0.6, 0.3, rd - 1.6 + lu * 0.6 * Math.tan(a)]], 'fline', { arrowEnd: true });
          d.label([sx - lu * 0.3, 0.3, rd - 2.4], 'hand feed along α', 'f');
        }
        if (step === 'offset' || (step === 'choose' && m === 'offset')) {
          const c1 = wpt(0, 0, [0, 0, 0]);
          const c2z = Lu * Math.sin(jobAng);
          d.line([c1[0] - 1, 0, 0], [Lu / 2 + 3, 0, 0], 'ref');
          d.arc(c1, [1, 0, 0], [0, 0, 1], Math.min(5, Lu * 0.3), 0, jobAng, 'arc');
          if (jobAng > 0.002) {
            const c2 = wpt(Lu, 0, [0, 0, 0]);
            d.dim([c2[0], 0, 0], [c2[0], 0, c2z], `s = ${setOver().toFixed(1)} mm`, [2.6, 0, 0], 'dline');
            d.dot(c2, 'dot');
            d.label([c2[0] + 2.8, 0, c2z + 1.3], 'tailstock centre', 'minor');
          }
          d.path([[Lu / 2 - 0.3, 0.3, rd + 1.6], [Lu / 2 - Math.max(lu, 3), 0.3, rd + 1.6]], 'fline', { arrowEnd: true });
          d.label([Lu / 2 - Math.max(lu, 3) / 2, 0.3, rd + 2.3], 'tool path ∥ bed', 'f');
        }
        if (step === 'attachment' || (step === 'choose' && m === 'attachment')) {
          const off = rD + 5.5;
          const mx = Lu / 2 - lu / 2, mz = rd + (lu / 2) * Math.tan(a) - off;
          const L1 = clamp(lu + 3, 4, 14);
          d.line([mx + 2, -3, mz], [mx - L1, -3, mz], 'ref');
          d.arc([mx, -3, mz], [-1, 0, 0], [0, 0, 1], L1 * 0.55, 0, a, 'arc');
          d.label([mx - L1 * 0.55 - 1.4, -3, mz + 0.8], `guide bar ${(a * DEG).toFixed(1)}°`, 'hl');
          d.label([Lu / 2 + 1, -3, mz - 1.3], 'sliding block', 'minor');
          d.label([Lu / 2 + 4, -1.2, rD + 5], 'cross-feed screw disengaged', 'f');
          d.path([[Lu / 2 - 0.2, 0.3, rd + 1.7], [Lu / 2 - Math.max(lu, 3), 0.3, rd + 1.7]], 'fline', { arrowEnd: true });
          d.label([Lu / 2 - Math.max(lu, 3) / 2, 0.3, rd + 2.4], 'carriage power feed', 'f');
        }
        if (step === 'form' || (step === 'choose' && m === 'form')) {
          const xm = Lu / 2 - lu / 2;
          d.path([[xm, 0.5, rD + 5], [xm, 0.5, rD + 1.2]], 'dline', { arrowEnd: true });
          d.label([xm, 0.5, rD + 5.8], 'radial plunge', 'd');
          d.label([xm - lu / 2 - 1.0, 0.5, rD + 2.2], `edge ground to α`, 'hl');
        }
        // V arrow label
        d.label(wpt(0.9, rD + 1.4, [0, 0, 0]), 'V', 'v');
        void Qu;
      },

      hud() {
        const a = alpha() * DEG;
        const rows = [['Half-angle α', `${a.toFixed(2)}°`], ['Included 2α', `${(2 * a).toFixed(2)}°`], ['D / d / l', `${P.D} / ${P.d} / ${P.l} mm`]];
        const m = P.method;
        if (m === 'offset') rows.push(['Set-over s', `${setOver().toFixed(1)} mm`], ['Job length L', `${P.L} mm`]);
        if (m === 'compound') rows.push(['Swivel angle', `${a.toFixed(2)}°`]);
        if (m === 'attachment') rows.push(['Guide bar angle', `${a.toFixed(2)}°`]);
        if (m === 'form') rows.push(['Tool edge angle', `${a.toFixed(2)}°`]);
        return {
          status: NAMES[m] || '',
          statusCls: 'f',
          rows,
          verdict: curStep === 'what' || curStep === 'angle' ? null : verdictFor(m),
        };
      },

      readouts() {
        const a = alpha();
        const tn = (P.D - P.d) / (2 * P.l);
        const vc = (v) => `${v[1] === 'ok' ? '✓' : v[1] === 'warn' ? '~' : '✗'} ${v[0]}`;
        return {
          alpha: `${(a * DEG).toFixed(2)}°`,
          a2: `${(2 * a * DEG).toFixed(2)}°`,
          ratio: `${((P.D - P.d) / P.l).toFixed(3)} (1 in ${(P.l / (P.D - P.d)).toFixed(1)} on diameter)`,
          rise: `${((P.D - P.d) / 2).toFixed(1)} mm`,
          run: `${P.l.toFixed(0)} mm`,
          tan: tn.toFixed(4),
          travel: `${(P.l / Math.cos(a)).toFixed(1)} mm`,
          l: `${P.l.toFixed(0)} mm`,
          s: `${setOver().toFixed(1)} mm`,
          ssin: `${(P.L * Math.sin(a)).toFixed(1)} mm`,
          vform: vc(verdictFor('form')),
          vcomp: vc(verdictFor('compound')),
          voff: vc(verdictFor('offset')),
          vatt: vc(verdictFor('attachment')),
          rowband: stepOf[P.method] || '',
        };
      },

      format(key, v) {
        if (key === 'D' || key === 'd' || key === 'l' || key === 'L') return `${v.toFixed(0)} mm`;
        return null;
      },

      plot(gx, w, h, c, step) {
        const a = alpha();
        frame(gx, w, h, c);
        const X = (u) => 26 + u * (w - 38);
        const Y = (u) => h - 22 - u * (h - 36);
        if (step === 'angle') {
          gx.strokeStyle = c.accent; gx.lineWidth = 1.8; gx.beginPath();
          for (let i = 0; i <= 60; i++) {
            const l = 10 + (i / 60) * 290;
            const y = Math.min(Math.atan((P.D - P.d) / (2 * l)) * DEG / 45, 1);
            i ? gx.lineTo(X(i / 60), Y(y)) : gx.moveTo(X(i / 60), Y(y));
          }
          gx.stroke();
          const u = clamp((P.l - 10) / 290, 0, 1);
          dotAt(gx, X(u), Y(Math.min(a * DEG / 45, 1)), c.v);
          text(gx, 'α', 8, 18, c.muted);
          text(gx, 'l →', w - 22, h - 8, c.muted);
          text(gx, `${(a * DEG).toFixed(1)}°`, X(u) + 6, Y(Math.min(a * DEG / 45, 1)) - 6, c.ink);
          return 'Same D − d: shorter taper is steeper';
        }
        if (step === 'offset') {
          gx.strokeStyle = c.d; gx.lineWidth = 1.8; gx.beginPath();
          gx.moveTo(X(60 / 400), Y(60 / 400)); gx.lineTo(X(1), Y(1)); gx.stroke();
          const u = P.L / 400;
          dotAt(gx, X(u), Y(u), c.accent);
          text(gx, 's', 10, 18, c.muted);
          text(gx, 'L →', w - 22, h - 8, c.muted);
          text(gx, `s = ${setOver().toFixed(1)} mm at L = ${P.L}`, 34, 22, c.ink);
          return 'Set-over grows in proportion to L';
        }
        if (step === 'choose') {
          const lim = [['Offset', 8], ['Attach.', 12], ['Compound', 45], ['Form', 45]];
          lim.forEach(([n, v], i) => {
            const y = 20 + i * 20;
            gx.fillStyle = c.line;
            gx.fillRect(X(0), y, (X(1) - X(0)) * Math.min(v, 30) / 30, 12);
            text(gx, `${n}`, 30, y + 10, c.ink);
          });
          const ua = clamp(a * DEG / 30, 0, 1);
          gx.strokeStyle = c.v; gx.lineWidth = 2; gx.beginPath(); gx.moveTo(X(ua), 14); gx.lineTo(X(ua), h - 22); gx.stroke();
          text(gx, `α ${(a * DEG).toFixed(1)}°`, Math.min(X(ua) + 4, w - 52), h - 26, c.v);
          text(gx, '0', X(0), h - 8, c.muted);
          text(gx, '30°', w - 28, h - 8, c.muted);
          return 'Angle you need vs the angles each method reaches';
        }
        return '';
      },
    };
  },
};
