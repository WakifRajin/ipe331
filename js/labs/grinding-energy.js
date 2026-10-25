// Effect lab: why grinding needs so much energy (Answer Note K). A surface grinder (depth of cut exaggerated) plus a
// magnified single-grit inset. All numbers are computed from the formulas on slides 111-112 and Note K.
const R_RATIO = 15; // width : thickness ratio of a grinding chip (typical 10-20)
const BETA = 20; // friction angle on the rake face, degrees (Merchant)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const RAD = Math.PI / 180;

// every derived quantity in one place; units: mm, N, s unless named
function calc(P) {
  const D = Math.max(P.D, 1), N = Math.max(P.N, 1);
  const vmm = Math.PI * D * N; // mm/min
  const v = vmm / 60000; // m/s
  const mrr = P.vw * 1000 * P.w * P.d; // mm^3/min
  const lc = Math.sqrt(D * P.d);
  const Cmm = P.C / 100; // grits per mm^2
  const nc = vmm * P.w * Cmm; // chips per minute
  const vol = nc > 0 ? mrr / nc : 0; // mm^3 per chip
  const tum = lc > 0 ? Math.sqrt((2 * vol) / (R_RATIO * lc)) * 1000 : 0; // average undeformed chip thickness, micrometres
  const power = P.Ft * v; // W
  const U = mrr > 0 ? power / (mrr / 60) : 0; // J/mm^3
  const flux = lc * P.w > 0 ? power / (lc * P.w) : 0; // W/mm^2 into the contact patch
  const inContact = Cmm * lc * P.w;
  const Usize = 2.5 * Math.pow(Math.max(tum, 0.05) / 100, -0.65); // illustrative size-effect trend
  const cut = sstep(1.5, 8, tum);
  return { D, N, vmm, v, mrr, lc, nc, vol, tum, power, U, flux, inContact, Usize, cut, plough: (1 - cut) * 0.55, rub: (1 - cut) * 0.45 };
}
function shear(rakeDeg) {
  const g = clamp(-rakeDeg, 5, 80);
  const phi = Math.max(8, 35 - g / 2); // Merchant: phi = 45 + gamma/2 - beta/2, with gamma negative
  const strain = 1 / Math.tan(phi * RAD) + Math.tan((phi + g) * RAD);
  const comp = Math.cos((phi + g) * RAD) / Math.sin(phi * RAD);
  return { g, phi, strain, comp };
}
const fmt = (x, n = 2) => (Math.abs(x) >= 1e6 ? `${(x / 1e6).toFixed(2)}×10⁶` : Math.abs(x) < 1e-2 && x !== 0 ? `${(x * 1e4).toFixed(2)}×10⁻⁴` : x.toFixed(n));

export default {
  id: 'grinding-energy',
  chapter: 'grinding',
  title: 'Why grinding needs so much energy',
  eyebrow: 'Grinding · slides 111–112 · Note K',
  sub: 'Cutting 1 mm³ of steel takes about 2 to 5 joules in turning but 10 to 60 in grinding. Follow one grit from the wheel down to its chip to see where the energy goes.',
  blurb: 'Contact length, chips per minute, the size effect, negative rake and rubbing, with the 2017-18 numerical worked live.',
  qs: ['2023-24_8b', '2017-18_7c'],
  params: { D: 200, N: 2400, d: 0.05, w: 3.5, vw: 6, C: 64, Ft: 25, rake: -45 },
  start: 'conditions',

  build({ THREE, scene, P, kit }) {
    const { M } = kit;
    const kD = 0.015, WW = 4, LW = 14, INX = 11, INY = 9;
    const dVis = () => 0.05 + P.d * 3;
    const wVis = () => Math.max(0.3, WW * (P.w / 25));
    const Rv = () => P.D * kD;

    const gridH = new THREE.GridHelper(140, 70, 0x7d8791, 0x9aa4ad);
    gridH.position.y = -3.6;
    gridH.material.transparent = true;
    gridH.material.opacity = 0.28;
    scene.add(gridH);

    const mWheel = new THREE.MeshStandardMaterial({ color: 0xb87a5c, roughness: 0.85, metalness: 0.05 });
    const mGrain = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.1, flatShading: true });
    const mStock = new THREE.MeshStandardMaterial({ color: 0x77828d, roughness: 0.7, metalness: 0.3, flatShading: true });
    const mGround = new THREE.MeshStandardMaterial({ color: 0xe4e8eb, roughness: 0.18, metalness: 0.85 });
    const mChip = new THREE.MeshStandardMaterial({ color: 0xe9a321, roughness: 0.5, metalness: 0.3, transparent: true, opacity: 0.9, flatShading: true });
    const mHot = new THREE.MeshStandardMaterial({ color: 0xff7a1a, emissive: 0xff5a00, emissiveIntensity: 1.2, roughness: 0.5, transparent: true, opacity: 0.8 });
    const mGrit = new THREE.MeshStandardMaterial({ color: 0xc98a6b, roughness: 0.4, metalness: 0.1, flatShading: true });

    // ---------- wheel ----------
    const spin = new THREE.Group();
    const wheelG = new THREE.Group();
    const wheelMesh = new THREE.Mesh(new THREE.BufferGeometry(), mWheel);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, WW + 1.4, 20).rotateX(Math.PI / 2), M.darkSteel);
    const flA = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.12, 24).rotateX(Math.PI / 2), M.steel);
    const flB = flA.clone();
    flA.position.z = WW / 2 + 0.06; flB.position.z = -WW / 2 - 0.06;
    const marker = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.05), M.white);
    spin.add(wheelMesh, hub, flA, flB, marker);
    wheelG.add(spin);
    scene.add(wheelG);
    const column = new THREE.Mesh(new THREE.BoxGeometry(3, 9, 2), M.paintDark);
    column.position.set(0, 3.5, -WW / 2 - 2.6);
    scene.add(column);
    const NG = 700;
    const rimGrits = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.5, 0), mGrain, NG);
    rimGrits.frustumCulled = false;
    spin.add(rimGrits);
    const gr = (() => { let s = 5; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();
    const gAng = new Float32Array(NG), gZ = new Float32Array(NG), gSc = new Float32Array(NG), gQ = new Float32Array(NG * 4);
    const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();
    for (let i = 0; i < NG; i++) {
      gAng[i] = gr() * Math.PI * 2; gZ[i] = (gr() - 0.5) * (WW - 0.1); gSc[i] = 0.09 + gr() * 0.08;
      _q.setFromEuler(_e.set(gr() * 6, gr() * 6, gr() * 6));
      gQ[i * 4] = _q.x; gQ[i * 4 + 1] = _q.y; gQ[i * 4 + 2] = _q.z; gQ[i * 4 + 3] = _q.w;
      rimGrits.setColorAt(i, _c.setRGB(0.55 + gr() * 0.3, 0.3 + gr() * 0.2, 0.2 + gr() * 0.15));
    }
    let gKey = '';
    function buildWheel() {
      const R = Rv();
      wheelMesh.geometry.dispose();
      wheelMesh.geometry = new THREE.CylinderGeometry(R, R, WW, 96, 1).rotateX(Math.PI / 2);
      marker.position.set(R * 0.7, 0, WW / 2 + 0.13);
      const n = clamp(Math.round(P.C * 3), 30, NG);
      for (let i = 0; i < n; i++) {
        _p.set(Math.cos(gAng[i]) * (R + 0.01), Math.sin(gAng[i]) * (R + 0.01), gZ[i]);
        _q.set(gQ[i * 4], gQ[i * 4 + 1], gQ[i * 4 + 2], gQ[i * 4 + 3]);
        _s.setScalar(gSc[i]);
        _m.compose(_p, _q, _s);
        rimGrits.setMatrixAt(i, _m);
      }
      rimGrits.count = n;
      rimGrits.instanceMatrix.needsUpdate = true;
      rimGrits.instanceColor.needsUpdate = true;
    }

    // ---------- work, moves under the wheel ----------
    const table = new THREE.Mesh(new THREE.BoxGeometry(LW + 14, 0.8, 7), M.castIron);
    scene.add(table);
    const base = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mGround);
    const stockFront = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mStock);
    const stockL = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mStock);
    const stockR = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mStock);
    for (const m of [base, stockFront, stockL, stockR]) { m.castShadow = m.receiveShadow = true; scene.add(m); }
    const glow = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mHot);
    scene.add(glow);
    let xf = -1;
    function placeWork() {
      const dv = dVis(), wv = wVis();
      table.position.set(LW / 2 - 5, -dv - 1.2 - 0.4, 0);
      const x0 = xf - LW;
      base.scale.set(LW, 1.2, wv);
      base.position.set(xf - LW / 2, -dv - 0.6, 0);
      // unground stock: ahead of the wheel (world x < 0)
      const fx1 = Math.min(0, xf), fw = fx1 - x0;
      stockFront.visible = fw > 0.001;
      stockFront.scale.set(Math.max(fw, 0.001), dv, wv);
      stockFront.position.set(x0 + fw / 2, -dv / 2, 0);
      // past the wheel only the ground strip is lower; nothing remains beside it because the work is exactly w wide
      stockL.visible = stockR.visible = false;
    }

    // ---------- sparks ----------
    const NSP = 90;
    const sparks = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.05, 0), new THREE.MeshStandardMaterial({ color: 0xffd27a, emissive: 0xff9a2a, emissiveIntensity: 1.4 }), NSP);
    sparks.frustumCulled = false;
    scene.add(sparks);
    const sp = { x: new Float32Array(NSP), y: new Float32Array(NSP), z: new Float32Array(NSP), vx: new Float32Array(NSP), vy: new Float32Array(NSP), vz: new Float32Array(NSP), life: new Float32Array(NSP) };
    let spNext = 0, spAcc = 0;
    _s.setScalar(0);
    _m.compose(_p.set(0, 0, 0), _q.identity(), _s);
    for (let i = 0; i < NSP; i++) sparks.setMatrixAt(i, _m);

    // ---------- magnified grit inset ----------
    const ins = new THREE.Group();
    ins.position.set(INX, INY, 0);
    scene.add(ins);
    const insMain = new THREE.Group();
    const behG = new THREE.Group();
    ins.add(insMain, behG);
    const IW = 9, ID = 1.6;
    const inBase = new THREE.Mesh(new THREE.BoxGeometry(IW, 1, ID), mStock);
    const inStock = new THREE.Mesh(new THREE.BoxGeometry(1, 1, ID), mStock);
    const grainG = new THREE.Group();
    const grainMesh = new THREE.Mesh(new THREE.BufferGeometry(), mGrit);
    const chipMesh = new THREE.Mesh(new THREE.BufferGeometry(), mChip);
    grainG.add(grainMesh, chipMesh);
    insMain.add(inBase, inStock, grainG);
    const extr = (pts, depth) => {
      const sh = new THREE.Shape();
      pts.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y)));
      const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false });
      g.translate(0, 0, -depth / 2);
      return g;
    };
    let tv = 0.4, S = shear(P.rake), insKey = '', gx = -3, tipOff = 0;
    function buildInset() {
      const c = calc(P);
      tv = clamp(0.12 * c.tum, 0.1, 0.9);
      S = shear(P.rake);
      const g = S.g * RAD, sg = Math.sin(g), cg = Math.cos(g), L = 2.6;
      grainMesh.geometry.dispose(); chipMesh.geometry.dispose();
      grainMesh.geometry = extr([[0, -tv], [L * sg, -tv + L * cg], [L * sg + 1.3, -tv + L * cg + 0.25], [-1.5, -tv + 3.0]], ID * 0.9);
      const Sx = tv / Math.tan(S.phi * RAD);
      const cl = 1.5;
      chipMesh.geometry = extr([[0, -tv], [Sx, 0], [Sx + cl * sg, cl * cg], [cl * sg, -tv + cl * cg]], ID * 0.9);
      inBase.scale.set(1, 2.2, 1);
      inBase.position.set(0, -tv - 1.1, 0);
      insKey = `${P.rake}|${tv.toFixed(3)}`;
    }

    // behaviour panels: cutting / ploughing / rubbing
    const PX = [-3.6, 0, 3.6], PW = 3.2;
    const pan = PX.map((x) => {
      const gp = new THREE.Group();
      gp.position.x = x;
      const b = new THREE.Mesh(new THREE.BoxGeometry(PW, 1.2, ID), mStock);
      b.position.y = -0.6;
      const trail = new THREE.Mesh(new THREE.BoxGeometry(1, 0.12, ID * 0.98), mGround);
      const gm = new THREE.Group();
      gp.add(b, trail, gm);
      behG.add(gp);
      return { gp, b, trail, gm };
    });
    {
      const cutG = new THREE.Mesh(extr([[0, -0.35], [0.9, 1.4], [1.6, 1.6], [-1, 2.2]], ID * 0.9), mGrit);
      const cutChip = new THREE.Mesh(extr([[0, -0.35], [0.5, 0], [1.1, 0.6], [0.55, 0.3]].slice(0, 4), ID * 0.8), mChip);
      pan[0].gm.add(cutG, cutChip);
      pan[0].chip = cutChip;
      const shp = new THREE.Shape();
      shp.absarc(0, 0.25, 0.65, 0, Math.PI * 2, false);
      const gg = new THREE.ExtrudeGeometry(shp, { depth: ID * 0.9, bevelEnabled: false }); gg.translate(0, 0, -ID * 0.45);
      const plG = new THREE.Mesh(gg, mGrit);
      plG.position.y = -0.35 + 0.0;
      const wave = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), mStock);
      wave.scale.set(0.9, 0.5, ID * 0.9);
      wave.position.set(0.85, 0.1, 0);
      pan[1].gm.add(plG, wave);
      pan[1].wave = wave;
      const rubG = new THREE.Mesh(extr([[-0.7, 0], [0.7, 0], [0.9, 1.4], [-0.9, 1.5]], ID * 0.9), mGrit);
      rubG.position.y = 0.0;
      pan[2].gm.add(rubG);
      pan[2].heat = [];
      for (let i = 0; i < 3; i++) {
        const h = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), mHot);
        h.position.set(-0.6 - i * 0.35, 0.05, 0);
        pan[2].gm.add(h);
        pan[2].heat.push(h);
      }
    }
    pan[0].tipY = -0.35; pan[1].tipY = -0.35 * 0 - 0.35 + 0.0; pan[2].tipY = 0;

    buildWheel();
    buildInset();
    placeWork();

    // ---------- animation state ----------
    let pass = 0, visBeh = false, tAcc = 0, behT = 0, curStep = 'conditions';
    let C0 = calc(P);
    const camWheel = (p) => {
      const k = 0.65 + 0.35 * (p.D / 200);
      return { position: [6 * k + 2, 4.4 * k + 2.5, 15 * k + 3], target: [1.5, 2 * k, 0] };
    };
    const camIn = { position: [INX + 0.5, INY + 0.8, 11.5], target: [INX, INY, 0] };
    const camBeh = { position: [INX, INY + 0.6, 14], target: [INX, INY, 0] };

    const ctl = (id, key, label, min, max, step) => `
      <div class="ctl-row"><label for="${id}">${label}</label><output class="val" data-out="${key}"></output></div>
      <input id="${id}" type="range" min="${min}" max="${max}" step="${step}" data-key="${key}">`;
    const preset = `<div class="presets"><button class="pbtn" type="button" data-set="D:200,N:2400,d:0.05,w:3.5,vw:6,C:64,Ft:25,rake:-45">2017-18 Q.7(c) data</button></div>`;

    return {
      legend: [['var(--v)', 'V wheel speed'], ['var(--f)', 'vw work speed, crossfeed w'], ['var(--d)', 'd infeed'], ['var(--accent)', 'Contact length lc, chip']],
      steps: [
        {
          id: 'conditions', chip: 'Conditions', group: 'Set-up', eyebrow: 'Grinding · slides 111–112', title: 'Grinding conditions',
          cam: camWheel,
          html: () => `
            <p>A surface grinder: the wheel (diameter D, rotating at N) is fed down by the <span class="tag-d">infeed d</span>, and the work moves past at the <span class="tag-f">work speed vw</span>. After each pass the table steps sideways by the <span class="tag-f">crossfeed w</span>, the width of cut. (Here the work is drawn exactly w wide. The depth d is drawn exaggerated.)</p>
            <p class="formula">V = π D N &nbsp; · &nbsp; MRR = vw · w · d</p>
            <div class="ctl">
              ${ctl('lab-D', 'D', 'Wheel diameter D', 100, 400, 10)}
              ${ctl('lab-N', 'N', 'Wheel speed N', 1000, 4000, 50)}
              ${ctl('lab-vw', 'vw', 'Work speed vw', 1, 30, 0.5)}
              ${ctl('lab-w', 'w', 'Crossfeed (width of cut) w', 1, 20, 0.5)}
              ${ctl('lab-d', 'd', 'Infeed (depth) d', 0.005, 0.2, 0.005)}
              <p class="ro">V = <b data-ro="v"></b> · MRR = <b data-ro="mrr"></b></p>
            </div>
            <p class="note">Note the wheel speed: about 25 m/s here, against 1–3 m/s for a typical turning cut. That is the first hint of where the power goes.</p>`,
        },
        {
          id: 'contact', chip: 'Contact length', group: 'Set-up', eyebrow: 'Grinding · Note K', title: 'Contact length lc = √(D·d)',
          cam: camWheel,
          html: () => `
            <p>The wheel is round, so it only touches the work along a short arc, the <mark>contact length</mark>. By the geometry of a chord of a large circle:</p>
            <p class="formula">lc = √(D · d)</p>
            <div class="ctl">
              ${ctl('lab-D2', 'D', 'Wheel diameter D', 100, 400, 10)}
              ${ctl('lab-d2', 'd', 'Infeed d', 0.005, 0.2, 0.005)}
              <p class="ro">lc = √(<b data-ro="Dv"></b> × <b data-ro="dv"></b>) = <b data-ro="lc"></b> · grits in contact at once ≈ <b data-ro="inc"></b></p>
            </div>
            <ul><li>Larger wheel or deeper cut: longer contact.</li><li>Each grit rides through this arc, so every chip is a thin sliver about lc long.</li></ul>`,
        },
        {
          id: 'chips', chip: 'Chips per minute', group: 'Chips', eyebrow: 'Grinding · Note K', title: 'Millions of tiny chips',
          cam: camWheel,
          html: () => `
            <p>The wheel carries C grits per cm² of its face. Every grit passing over the work width w can cut one chip, so:</p>
            <p class="formula">nc = V · w · C &nbsp;&nbsp; (V in mm/min, C per mm²)<br>volume per chip = MRR / nc</p>
            <div class="ctl">
              ${ctl('lab-C', 'C', 'Grit density C', 10, 200, 2)}
              ${ctl('lab-w2', 'w', 'Width of cut w', 1, 20, 0.5)}
              ${ctl('lab-N2', 'N', 'Wheel speed N', 1000, 4000, 50)}
              <p class="ro">nc = <b data-ro="nc"></b> chips/min (<b data-ro="ncs"></b> per second)<br>volume per chip = <b data-ro="vol"></b><br>average chip thickness ≈ <b data-ro="t"></b></p>
            </div>
            <p class="note">The wheel face (rim dots) shows the grit density. A chip is typically a few micrometres thick, thousands of times thinner than a turning chip.</p>`,
        },
        {
          id: 'size', chip: 'Size effect', group: 'Why so much?', eyebrow: 'Grinding · Note K reason 1', title: 'Size effect: thin chips cost more per mm³',
          cam: camIn, plot: true,
          html: () => `
            <p>Metal is stronger at very small scale (fewer defects in the tiny volume being sheared), and the cutting edge is not perfectly sharp. As the <mark>undeformed chip thickness t</mark> falls to a few µm the specific energy rises steeply.</p>
            <div class="ctl">
              ${ctl('lab-d3', 'd', 'Infeed d', 0.005, 0.2, 0.005)}
              ${ctl('lab-vw3', 'vw', 'Work speed vw', 1, 30, 0.5)}
              ${ctl('lab-C3', 'C', 'Grit density C', 10, 200, 2)}
              <p class="ro">chip thickness t ≈ <b data-ro="t"></b> · size effect alone gives ≈ <b data-ro="Usize"></b> (plot)</p>
            </div>
            <ul><li>Smaller d, faster wheel or more grits make thinner chips: higher energy per mm³.</li><li>Turning chips are 0.1 mm or more: only 2 to 5 J/mm³.</li></ul>
            <p class="note">The curve is an empirical trend, drawn to show the shape. Size effect is only one of five reasons; the rest follow.</p>`,
        },
        {
          id: 'rake', chip: 'Negative rake', group: 'Why so much?', eyebrow: 'Grinding · Note K reason 2', title: 'Grains have large negative rake angles',
          cam: camIn, plot: true,
          html: () => `
            <p>A grain is a random sharp shape, not a ground tool. Its leading face usually leans <mark>forward</mark> over the work: a rake angle of −30° to −60°. Chip formation then needs a flat shear plane and a very large shear strain.</p>
            <div class="ctl">
              ${ctl('lab-rk', 'rake', 'Rake angle γ', -60, -15, 1)}
              <div class="presets"><button class="pbtn" type="button" data-set="rake:-15">−15°</button><button class="pbtn" type="button" data-set="rake:-30">−30°</button><button class="pbtn" type="button" data-set="rake:-45">−45°</button><button class="pbtn" type="button" data-set="rake:-60">−60°</button></div>
              <p class="ro">shear angle φ = <b data-ro="phi"></b> · shear strain = <b data-ro="strain"></b> (<b data-ro="strainx"></b> that of a 0° tool) · chip thickened ×<b data-ro="comp"></b></p>
            </div>
            <p class="small">In the magnified inset the amber area is the sheared chip. The more negative the rake, the longer the shear plane and the bigger the zone being deformed.</p>`,
        },
        {
          id: 'behaviour', chip: 'Cut, plough, rub', group: 'Why so much?', eyebrow: 'Grinding · Note K reason 3', title: 'Rubbing and ploughing waste energy',
          cam: camBeh,
          html: () => `
            <p>Not every grit that touches the work cuts. Three things happen, and only the first removes metal:</p>
            <ul>
              <li><mark>Cutting</mark> (left): deep enough, a chip forms.</li>
              <li><mark>Ploughing</mark> (middle): a rounded grit pushes material aside as a ridge, with plastic flow but no chip.</li>
              <li><mark>Rubbing</mark> (right): a worn flat grit slides on the surface, only friction and heat.</li>
            </ul>
            <div class="ctl">
              ${ctl('lab-d4', 'd', 'Infeed d', 0.005, 0.2, 0.005)}
              ${ctl('lab-vw4', 'vw', 'Work speed vw', 1, 30, 0.5)}
              <p class="ro">t ≈ <b data-ro="t"></b> → grits cutting <b data-ro="cutp"></b> · ploughing <b data-ro="plp"></b> · rubbing <b data-ro="rubp"></b> (illustrative split)</p>
            </div>
            <p class="note">The thinner the chip, the more grits only rub or plough. The bond and a dull or loaded wheel add yet more rubbing.</p>`,
        },
        {
          id: 'energy', chip: 'Specific energy', group: 'Numbers', eyebrow: 'Grinding · Note K', title: 'Specific energy U = Ft·V / MRR',
          cam: camWheel, plot: true,
          html: () => `
            <p>Power at the wheel is the tangential force times the wheel speed. Divide by the volume removed per second:</p>
            <p class="formula">P = Ft · V &nbsp; · &nbsp; U = P / MRR &nbsp; (J/mm³)</p>
            <div class="ctl">
              ${ctl('lab-Ft', 'Ft', 'Tangential force Ft', 5, 100, 1)}
              ${ctl('lab-d5', 'd', 'Infeed d', 0.005, 0.2, 0.005)}
              ${ctl('lab-vw5', 'vw', 'Work speed vw', 1, 30, 0.5)}
              <p class="ro">P = <b data-ro="P"></b> · MRR = <b data-ro="mrrs"></b> · U = <b data-ro="U"></b></p>
            </div>
            <div class="duo">
              <div data-band="turn"><h3>Turning, milling</h3><p>about 1–5 J/mm³</p></div>
              <div data-band="grind"><h3>Grinding</h3><p>about 10–60 J/mm³</p></div>
            </div>`,
        },
        {
          id: 'numerical', chip: '2017-18 Q.7(c)', group: 'Numbers', eyebrow: 'Grinding · Answer Note K', title: 'Worked numerical',
          cam: camWheel,
          html: () => `
            <p>Surface grinding: wheel Ø200 × 25, 2400 rpm, d = 0.05 mm, w = 3.5 mm, vw = 6 m/min, 64 grits/cm², Ft = 25 N. Find lc, MRR, chips per minute, volume per chip and specific energy.</p>
            ${preset}
            <div class="table-wrap"><table class="cmp">
              <tr><th>Quantity</th><th>Working</th><th>Now</th></tr>
              <tr><td>lc</td><td>√(200 × 0.05) = 3.16 mm</td><td><b data-ro="lc"></b></td></tr>
              <tr><td>MRR</td><td>6000 × 3.5 × 0.05 = 1050 mm³/min</td><td><b data-ro="mrr"></b></td></tr>
              <tr><td>V</td><td>π × 200 × 2400 = 1.508×10⁶ mm/min</td><td><b data-ro="vmm"></b></td></tr>
              <tr><td>nc</td><td>V · w · C = 3.38×10⁶ chips/min</td><td><b data-ro="nc"></b></td></tr>
              <tr><td>Volume/chip</td><td>1050 / 3.378×10⁶ = 3.11×10⁻⁴ mm³</td><td><b data-ro="vol"></b></td></tr>
              <tr><td>U</td><td>25 × 25.13 / 17.5 = 35.9 J/mm³</td><td><b data-ro="U"></b></td></tr>
            </table></div>
            <p class="small">Change any slider above (try d or Ft) and the last column follows.</p>
            <p class="exam">Asked: TF 2017-18 Q.7(c).</p>`,
        },
        {
          id: 'conseq', chip: 'Consequences', group: 'Exam', eyebrow: 'Grinding · Note K reason 4', title: 'All that energy becomes heat',
          cam: camWheel,
          html: () => `
            <p>Almost all the grinding energy turns into heat in the small contact patch, which is why a grinding wheel runs so hot. The heat flux through the patch is:</p>
            <p class="formula">q = P / (lc · w)</p>
            <div class="ctl">
              ${ctl('lab-Ft2', 'Ft', 'Tangential force Ft', 5, 100, 1)}
              ${ctl('lab-d6', 'd', 'Infeed d', 0.005, 0.2, 0.005)}
              <p class="ro">P = <b data-ro="P"></b> · patch lc × w = <b data-ro="patch"></b> · q = <b data-ro="q"></b></p>
            </div>
            <ul>
              <li>The glowing patch and the sparks grow with the power.</li>
              <li>The surface can be <b>burnt</b> (discolouration, tempering, cracks, residual tension).</li>
              <li>Hence <mark>coolant</mark> flooded into the contact, light cuts, and a wheel kept sharp (dressed), because a dull or loaded wheel rubs more.</li>
            </ul>`,
        },
        {
          id: 'answer', chip: 'Exam answer', group: 'Exam', eyebrow: 'Model answer', title: 'Why is specific energy in grinding so high?',
          cam: camIn,
          html: () => `
            <p>Grinding needs about 10–60 J/mm³, against about 1–5 J/mm³ in turning and milling, because:</p>
            <ol class="steps">
              <li><b>Size effect.</b> The undeformed chip is only a few µm thick; at this scale the metal is stronger, so more energy per unit volume.</li>
              <li><b>Large negative rake</b> (−30° to −60°) of the randomly oriented grains: flat shear plane, very high shear strain and force.</li>
              <li><b>Rubbing and ploughing.</b> Many grits only rub (wear flats) or plough, using energy without removing metal.</li>
              <li><b>High speed</b> (30–60 m/s) and a dull or loaded wheel give a lot of friction; most of the energy becomes heat.</li>
              <li>The bond also rubs the work.</li>
            </ol>
            <p class="formula">U = Ft · V / MRR &nbsp; (2017-18: 35.9 J/mm³)</p>`,
        },
      ],

      onParam(key) {
        C0 = calc(P);
        if (key === 'D' || key === 'C') buildWheel();
        if (key === 'rake' || key === 'd' || key === 'vw' || key === 'w' || key === 'N' || key === 'C' || key === 'D') buildInset();
        placeWork();
      },

      update(dt, t, stepId) {
        curStep = stepId || curStep;
        C0 = calc(P);
        const dv = dVis(), wv = wVis(), R = Rv();
        const k = `${P.rake}|${clamp(0.12 * C0.tum, 0.1, 0.9).toFixed(3)}`;
        if (k !== insKey) buildInset();
        visBeh = curStep === 'behaviour';
        insMain.visible = !visBeh;
        behG.visible = visBeh;
        // wheel
        const omega = 4 * (P.N / 2400);
        spin.rotation.z -= omega * dt;
        wheelG.position.set(0, R - dv, 0);
        // work pass
        const vv = 0.3 + 0.15 * P.vw;
        xf += vv * dt;
        if (xf > LW + 3) xf = -1;
        placeWork();
        const touching = xf > 0 && xf - LW < 0;
        const heat = clamp(C0.power / 1500, 0.1, 1.6);
        glow.visible = touching;
        glow.position.set(0, -dv * 0.5, 0);
        glow.scale.set(0.15 + 0.25 * heat, 0.1 + 0.12 * heat, Math.min(wv, WW) / 2 + 0.05);
        mHot.emissiveIntensity = 0.6 + 1.0 * heat;
        // sparks tangent to the wheel (the bottom of the wheel moves in -x)
        if (touching && dt > 0) {
          spAcc += dt * clamp(C0.mrr / 40, 6, 60);
          while (spAcc >= 1) {
            spAcc -= 1;
            const i = spNext; spNext = (spNext + 1) % NSP;
            sp.x[i] = (Math.random() - 0.5) * 0.6; sp.y[i] = 0.05; sp.z[i] = (Math.random() - 0.5) * wv;
            sp.vx[i] = -(2.5 + Math.random() * 3.5) * (0.6 + 0.4 * heat); sp.vy[i] = 0.8 + Math.random() * 2; sp.vz[i] = (Math.random() - 0.5) * 1.2;
            sp.life[i] = 0.7 + Math.random() * 0.4;
          }
        }
        for (let i = 0; i < NSP; i++) {
          if (sp.life[i] > 0) {
            sp.life[i] -= dt; sp.vy[i] -= 6 * dt;
            sp.x[i] += sp.vx[i] * dt; sp.y[i] += sp.vy[i] * dt; sp.z[i] += sp.vz[i] * dt;
            _s.setScalar(sp.life[i] > 0 ? Math.min(1, sp.life[i] * 3) : 0);
            _m.compose(_p.set(sp.x[i], sp.y[i], sp.z[i]), _q.identity(), _s);
            sparks.setMatrixAt(i, _m);
          }
        }
        sparks.instanceMatrix.needsUpdate = true;
        // inset: one grit travelling over the work
        tAcc += dt;
        const u = (tAcc * 0.35) % 1;
        gx = -3.2 + 5 * u;
        const Sx = tv / Math.tan(S.phi * RAD);
        grainG.position.x = gx;
        inStock.scale.set(Math.max(0.001, 4.6 - gx - Sx), tv, 1);
        inStock.position.set(gx + Sx + (4.6 - gx - Sx) / 2, -tv / 2, 0);
        // behaviours
        behT += dt;
        const bu = (behT * 0.4) % 1, bx = -1.1 + 2.2 * bu;
        for (let i = 0; i < 3; i++) {
          const p = pan[i];
          p.gm.position.x = bx;
          p.trail.scale.x = Math.max(0.001, bx + PW / 2 - 0.1);
          p.trail.position.set((bx - PW / 2 + 0.1) / 2 + 0.0, -0.06 - (i === 0 ? 0.3 : i === 1 ? 0.28 : 0.01), 0);
        }
        pan[0].gm.position.y = -0.0;
        pan[0].chip.scale.setScalar(0.4 + 0.6 * bu);
        pan[1].wave.scale.set(0.5 + 0.5 * bu, 0.3 + 0.3 * bu, ID * 0.9);
        for (let i = 0; i < 3; i++) pan[2].heat[i].scale.setScalar(0.5 + 0.7 * Math.abs(Math.sin(behT * 9 + i * 2)));
      },

      overlay(d, step) {
        const dv = dVis(), wv = wVis(), R = Rv(), c = C0;
        const cy = R - dv;
        // wheel motion V (bottom of wheel moves against the work), work feed vw, infeed d
        d.path([[1.2, 0.35, WW / 2 + 0.35], [-1.6, 0.35, WW / 2 + 0.35]], 'vline', { arrowEnd: true });
        d.label([-0.2, 0.9, WW / 2 + 0.35], `V ${c.v.toFixed(1)} m/s`, 'v');
        d.path([[xf - LW + 1.5, 0.5, 0], [xf - LW + 4.3, 0.5, 0]], 'fline', { arrowEnd: true });
        d.label([xf - LW + 3, 1.1, 0], `vw ${P.vw} m/min`, 'f');
        if (step === 'conditions') {
          d.dim([-R, cy, WW / 2 + 0.6], [R, cy, WW / 2 + 0.6], `D = ${P.D} mm`, [0, R * 0.35 + 0.8, 0]);
          d.label([0, cy + R + 0.9, 0], `N = ${P.N} rpm`, 'hl');
          d.dim([3.2, -dv, wv / 2], [3.2, 0, wv / 2], `d = ${P.d.toFixed(3)} mm`, [0.8, 0.2, 0], 'dm');
          d.dim([3.2, 0, -wv / 2], [3.2, 0, wv / 2], `w = ${P.w} mm`, [0, 0.9, 0]);
          d.label([5.5, 3.2, 0], `MRR = ${fmt(c.mrr, 0)} mm³/min`, 'dimtxt');
        } else if (step === 'contact' || step === 'chips' || step === 'conseq' || step === 'energy') {
          const th = Math.acos(clamp((R - dv) / R, -1, 1));
          d.arc([0, cy, 0], [1, 0, 0], [0, 1, 0], R + 0.12, -Math.PI / 2 - th, -Math.PI / 2 + th, 'arc');
          const h = Math.sqrt(Math.max(2 * R * dv - dv * dv, 0));
          d.dim([-h, 0, WW / 2 + 0.05], [h, 0, WW / 2 + 0.05], `lc = ${c.lc.toFixed(2)} mm`, [0, -0.7, 0]);
          if (step === 'contact') d.label([0, -1.8, WW / 2], `≈ ${c.inContact.toFixed(1)} grits in contact`, 'hl');
          if (step === 'chips') d.label([-R * 0.7, cy + R * 0.7, WW / 2], `${fmt(c.nc, 0)} chips/min`, 'hl');
          if (step === 'energy' || step === 'conseq') {
            d.path([[-0.2, -0.2, wv / 2 + 0.2], [1.8 + Math.min(c.power / 400, 3), -0.2, wv / 2 + 0.2]], 'dline', { arrowEnd: true });
            d.label([2.5, 0.35, wv / 2 + 0.2], `Ft ${P.Ft} N`, 'd');
            if (step === 'conseq') d.label([0, 1.6, 0], `${c.flux.toFixed(0)} W/mm² (hot)`, 'v');
          }
        }
        if (step === 'size' || step === 'rake' || step === 'chips') {
          const ox = INX + gx;
          const T = [ox, INY - tv, 0.9];
          const Sx = tv / Math.tan(S.phi * RAD);
          if (step === 'chips' || step === 'size') {
            const xa = ox + Sx + 1.0;
            d.dim([xa, INY - tv, 0.9], [xa, INY, 0.9], `t ≈ ${c.tum.toFixed(1)} µm`, [0.9, 0, 0]);
            d.label([INX - 2.5, INY + 1.9, 0], 'one grit, magnified', 'hl');
          }
          if (step === 'rake') {
            const g = S.g * RAD;
            d.line(T, [T[0], T[1] + 1.8, T[2]], 'ref');
            d.arc(T, [1, 0, 0], [0, 1, 0], 1.1, Math.PI / 2 - g, Math.PI / 2, 'arc');
            d.label([T[0] - 0.9, T[1] + 1.5, T[2]], `γ = −${S.g.toFixed(0)}°`, 'hl');
            d.path([T, [T[0] + Sx, INY, T[2]]], 'hx');
            d.label([T[0] + Sx * 0.5 + 0.4, INY - tv * 0.2, T[2]], `φ ${S.phi.toFixed(0)}° shear plane`, 'minor', 0, -14);
          }
        }
        if (step === 'behaviour') {
          const lab = ['Cutting: chip', 'Ploughing: ridge, no chip', 'Rubbing: friction only'];
          for (let i = 0; i < 3; i++) d.label([INX + PX[i], INY - 1.5, 0], lab[i], i === 0 ? 'hl' : 'minor');
        }
      },

      hud() {
        const c = C0;
        const vd = c.U > 40 ? ['Very high U: burn risk, flood coolant', 'bad'] : c.U > 12 ? ['High U: typical of grinding, mostly heat', 'warn'] : ['Low U: more like turning', 'ok'];
        return {
          status: 'Surface grinding',
          statusCls: 'v',
          rows: [
            ['V', `${c.v.toFixed(1)} m/s`],
            ['MRR', `${fmt(c.mrr, 0)} mm³/min`],
            ['lc', `${c.lc.toFixed(2)} mm`],
            ['Chip thickness', `${c.tum.toFixed(1)} µm`],
            ['U', `${c.U.toFixed(1)} J/mm³`],
          ],
          verdict: vd,
        };
      },

      readouts() {
        const c = C0, S2 = shear(P.rake), S0 = shear(0 - 5);
        return {
          v: `${c.v.toFixed(2)} m/s (${fmt(c.vmm, 0)} mm/min)`,
          vmm: `${fmt(c.vmm, 0)} mm/min`,
          mrr: `${fmt(c.mrr, 0)} mm³/min`,
          mrrs: `${(c.mrr / 60).toFixed(1)} mm³/s`,
          Dv: `${P.D}`,
          dv: `${P.d.toFixed(3)}`,
          lc: `${c.lc.toFixed(2)} mm`,
          inc: c.inContact.toFixed(1),
          nc: fmt(c.nc, 0),
          ncs: fmt(c.nc / 60, 0),
          vol: `${fmt(c.vol, 2)} mm³`,
          t: `${c.tum.toFixed(1)} µm`,
          Usize: `${c.Usize.toFixed(0)} J/mm³`,
          phi: `${S2.phi.toFixed(1)}°`,
          strain: S2.strain.toFixed(1),
          strainx: `${(S2.strain / (1 / Math.tan(35 * RAD) + Math.tan(35 * RAD))).toFixed(1)}×`,
          comp: S2.comp.toFixed(1),
          cutp: `${(c.cut * 100).toFixed(0)} %`,
          plp: `${(c.plough * 100).toFixed(0)} %`,
          rubp: `${(c.rub * 100).toFixed(0)} %`,
          P: `${c.power.toFixed(0)} W`,
          U: `${c.U.toFixed(1)} J/mm³ (${(c.U / 3).toFixed(0)}× turning at 3)`,
          patch: `${c.lc.toFixed(2)} × ${P.w} mm = ${(c.lc * P.w).toFixed(1)} mm²`,
          q: `${c.flux.toFixed(0)} W/mm²`,
          band: curStep === 'energy' ? (c.U < 8 ? 'turn' : 'grind') : '',
          S0: S0.strain.toFixed(1),
        };
      },
      live: true,

      format(key, v) {
        switch (key) {
          case 'D': return `${v} mm`;
          case 'N': return `${v} rpm`;
          case 'd': return `${v.toFixed(3)} mm`;
          case 'w': return `${v} mm`;
          case 'vw': return `${v} m/min`;
          case 'C': return `${v} /cm²`;
          case 'Ft': return `${v} N`;
          case 'rake': return `−${Math.abs(v)}°`;
          default: return null;
        }
      },

      plot(g, w, h, col, step) {
        const m = 22;
        const axis = () => {
          g.strokeStyle = col.muted; g.lineWidth = 1;
          g.beginPath(); g.moveTo(m, 10); g.lineTo(m, h - 18); g.lineTo(w - 8, h - 18); g.stroke();
          g.fillStyle = col.muted;
        };
        if (step === 'size') {
          axis();
          // x: log t 0.5..300 um; y: U 0..80
          const X = (t) => m + ((Math.log10(t) - Math.log10(0.5)) / (Math.log10(300) - Math.log10(0.5))) * (w - m - 10);
          const Y = (u) => h - 18 - (clamp(u, 0, 80) / 80) * (h - 30);
          g.strokeStyle = col.ink; g.lineWidth = 1.6; g.beginPath();
          for (let i = 0; i <= 40; i++) {
            const t = Math.pow(10, Math.log10(0.5) + (i / 40) * (Math.log10(300) - Math.log10(0.5)));
            const u = 2.5 * Math.pow(t / 100, -0.65);
            if (i) g.lineTo(X(t), Y(u)); else g.moveTo(X(t), Y(u));
          }
          g.stroke();
          g.fillStyle = col.muted;
          g.fillText('turning', X(120), Y(2.5) - 6);
          g.fillText('µm', w - 22, h - 6);
          g.fillText('U', 4, 14);
          const tx = X(clamp(C0.tum, 0.5, 300));
          g.fillStyle = col.accent;
          g.beginPath(); g.arc(tx, Y(C0.Usize), 4, 0, 7); g.fill();
          g.fillText('t', tx - 2, h - 6);
          return 'Specific energy vs chip thickness';
        }
        if (step === 'rake') {
          axis();
          const xr = (r) => m + ((-r - 15) / 45) * (w - m - 10);
          const Y = (s) => h - 18 - (clamp(s, 0, 11) / 11) * (h - 30);
          g.strokeStyle = col.ink; g.lineWidth = 1.6; g.beginPath();
          for (let r = -15; r >= -60; r -= 1.5) {
            const sv = shear(r).strain;
            if (r === -15) g.moveTo(xr(r), Y(sv)); else g.lineTo(xr(r), Y(sv));
          }
          g.stroke();
          g.fillStyle = col.muted;
          g.fillText('shear strain', m + 4, 14);
          g.fillText('−15°', m, h - 5);
          g.fillText('−60°', w - 34, h - 5);
          g.fillStyle = col.accent;
          g.beginPath(); g.arc(xr(clamp(P.rake, -60, -15)), Y(shear(P.rake).strain), 4, 0, 7); g.fill();
          return 'Shear strain vs rake angle';
        }
        axis();
        const X = (u) => m + ((Math.log10(clamp(u, 0.5, 200)) - Math.log10(0.5)) / (Math.log10(200) - Math.log10(0.5))) * (w - m - 10);
        const bar = (a, b, y, lab, colr) => {
          g.fillStyle = colr; g.globalAlpha = 0.55;
          g.fillRect(X(a), y, X(b) - X(a), 18);
          g.globalAlpha = 1; g.fillStyle = col.ink;
          g.fillText(lab, X(a) + 3, y + 13);
        };
        bar(1, 5, 20, 'turning', col.f);
        bar(10, 60, 50, 'grinding', col.v);
        g.fillStyle = col.accent;
        g.fillRect(X(C0.U) - 1.5, 12, 3, h - 30);
        g.fillStyle = col.muted;
        g.fillText('you: ' + C0.U.toFixed(1), clamp(X(C0.U) + 4, m, w - 60), 100);
        g.fillText('J/mm³ (log)', w - 70, h - 5);
        return 'Specific energy compared';
      },

      dispose() {
        wheelMesh.geometry.dispose();
        grainMesh.geometry.dispose();
        chipMesh.geometry.dispose();
        rimGrits.dispose();
        sparks.dispose();
      },
    };
  },
};
