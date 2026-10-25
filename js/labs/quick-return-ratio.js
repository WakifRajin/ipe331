// Effect lab: quick-return in shaping. Crank-and-slotted-lever geometry (exact), hydraulic drive, and the shaper time numerical.
// Drawing units: 1 unit = 10 mm of the real machine. Mechanism: bull-gear centre O at the origin, lever pivot Q at (0, -c),
// crank pin at radius r, slotted lever Q-A, link A-ram. Crank angle theta is measured clockwise from the top (far side from Q).
const DEG = 180 / Math.PI;

export default {
  id: 'quick-return-ratio',
  chapter: 'shaping',
  title: 'Quick return: why the return is faster',
  eyebrow: 'Shaping · slides 97–104',
  sub: 'The ram only cuts on the forward stroke, so the idle return should be quick. See how the crank and slotted lever make the return faster, how a hydraulic shaper does it, and how to time a job.',
  blurb: 'Cutting and return angles from the crank geometry, ram velocity curves, hydraulic drive and the shaper time numerical.',
  qs: ['2022-23_7c', '2023-24_5c', '2020-21_1c', '2016-17_6c', '2014-15_6c', '2012-13_5d', '2009-10_6c', '2016-17_6d'],
  params: { r: 4.8, c: 12, N: 30, drive: 'crank', rod: 0.6, pos: 0, L: 250, cl: 25, f: 0.6, W: 120, d: 3, H: 6, V: 24000 },

  build({ THREE, scene, P, kit }) {
    const { M, box, cyl } = kit;
    const yg = 17; // ram axis height
    const ZL = 2.4; // lever / ram plane
    const LR = 16; // ram length
    const LINK = 10; // link length
    const yT = yg - 6; // work top surface
    const BORE = 2.2; // hydraulic bore radius
    const yc = yg + 6; // hydraulic cylinder axis
    const Lv = () => P.c + 17;

    // ------------------------------------------------------------------ kinematics
    const K = { phi: 0, alpha: 0, beta: 0, ratio: 1, S: 0, xmin: 0, xmax: 0, peakF: 1, peakR: -1, R: 1.5, fT: 0.6 };
    const xr = (psi) => {
      const L = Lv();
      const dy = L * (Math.cos(psi) - 1);
      return L * Math.sin(psi) + Math.sqrt(LINK * LINK - dy * dy) + P.pos;
    };
    const xAt = (sg) => {
      const th = sg - K.alpha / 2;
      return xr(Math.atan2(P.r * Math.sin(th), P.r * Math.cos(th) + P.c));
    };
    const vnorm = (sg) => {
      const e = 0.004;
      return ((xAt(sg + e) - xAt(sg - e)) / (2 * e)) / (K.S / K.alpha);
    };
    const hydR = () => 1 / (1 - P.rod * P.rod);
    function calcKin() {
      P.r = Math.max(0.3, Math.min(P.r, 0.9 * P.c, 8.2));
      K.phi = Math.asin(P.r / P.c);
      K.alpha = Math.PI + 2 * K.phi;
      K.beta = Math.PI - 2 * K.phi;
      K.ratio = K.alpha / K.beta;
      K.xmin = xr(-K.phi);
      K.xmax = xr(K.phi);
      K.S = K.xmax - K.xmin;
      let pf = 0, pr = 0;
      for (let i = 0; i <= 120; i++) {
        const v = vnorm((i / 120) * 2 * Math.PI);
        if (v > pf) pf = v;
        if (v < pr) pr = v;
      }
      K.peakF = pf;
      K.peakR = pr;
      K.R = hydR();
      K.fT = K.R / (K.R + 1);
    }
    const isHyd = () => P.drive === 'hydraulic';
    const ratioNow = () => (isHyd() ? K.R : K.ratio);
    const fwdFrac = () => (isHyd() ? K.fT : K.alpha / (2 * Math.PI));

    // ------------------------------------------------------------------ scene
    const grid = new THREE.GridHelper(150, 60, 0x7d8791, 0x9aa4ad);
    grid.position.y = -19;
    grid.material.transparent = true;
    grid.material.opacity = 0.3;
    scene.add(grid);
    const wall = box(72, 50, 1, M.paintDark);
    wall.position.set(2, 3, -1.4);
    scene.add(wall);

    // mechanical drive
    const mech = new THREE.Group();
    scene.add(mech);
    const disc = new THREE.Group();
    disc.position.z = 0;
    const bull = kit.gear(9, 40, 1.4, M.steel);
    const face = cyl(7.4, 0.3, M.paintLight, { axis: 'z' });
    face.position.z = 0.85;
    const slotCrank = box(0.9, 8.4, 0.2, M.black);
    slotCrank.position.set(0, 4.3, 1.05);
    const pin = cyl(0.55, 3, M.brass, { axis: 'z' });
    disc.add(bull, face, slotCrank, pin);
    const hub = cyl(1.3, 2.4, M.darkSteel, { axis: 'z' });
    hub.position.z = 0.8;
    const levG = new THREE.Group();
    const bar = box(0.9, 1, 0.8, M.paintLight);
    const slot = box(0.4, 1, 0.3, M.black);
    slot.position.z = 0.45;
    const block = box(1.3, 1.5, 0.8, M.brass);
    block.position.z = 0.3;
    const pivotPin = cyl(0.9, 2.2, M.darkSteel, { axis: 'z' });
    const topPin = cyl(0.5, 1.4, M.darkSteel, { axis: 'z' });
    levG.add(bar, slot, block, pivotPin, topPin);
    const link = box(1, 0.7, 0.6, M.darkSteel);
    const bracket = box(3.2, 3.2, 1.6, M.castIron);
    mech.add(disc, hub, levG, link, bracket);

    // ram, tool head, work (shared by both drives)
    const ram = new THREE.Group();
    const ramBody = box(LR, 3.2, 4.6, M.paint);
    ramBody.position.x = LR / 2;
    const ramTop = box(LR - 2, 0.5, 3.4, M.paintLight);
    ramTop.position.set(LR / 2, 1.8, 0);
    const head = box(3, 4.2, 3.6, M.paintDark);
    head.position.set(LR - 1.5, -2.1, 0);
    const tip = new THREE.Group(); // clapper + tool: lifts on return
    tip.position.set(LR - 1.5, -3.4, 2.0);
    const clap = box(1.8, 1.6, 0.9, M.steel);
    const bit = box(0.8, 2.6, 0.6, M.hss);
    bit.position.set(0, -1.9, 0.1);
    tip.add(clap, bit);
    ram.add(ramBody, ramTop, head, tip);
    ram.position.z = ZL;
    scene.add(ram);
    const rail = box(46, 0.7, 5.4, M.castIron);
    rail.position.set(6, yg + 2.4, ZL);
    scene.add(rail);

    const table = box(50, 2.4, 18, M.castIron);
    const work = box(1, 1, 1, M.work);
    const strip = box(1, 0.08, 0.5, M.workCut);
    scene.add(table, work, strip);

    // hydraulic drive
    const hyd = new THREE.Group();
    scene.add(hyd);
    const unitCylX = (r, mat) => {
      const g = new THREE.CylinderGeometry(r, r, 1, 28, 1);
      g.rotateZ(Math.PI / 2);
      const m = new THREE.Mesh(g, mat);
      m.castShadow = true;
      return m;
    };
    const cylBody = unitCylX(BORE, M.glass);
    const fluidL = unitCylX(BORE * 0.92, M.fluid);
    const fluidR = unitCylX(BORE * 0.92, M.oil);
    const rodM = unitCylX(1, M.chrome);
    const piston = cyl(BORE * 0.96, 0.8, M.steel, { axis: 'x' });
    const capL = cyl(BORE * 1.15, 0.7, M.darkSteel, { axis: 'x' });
    const capR = cyl(BORE * 1.15, 0.7, M.darkSteel, { axis: 'x' });
    const brk = box(1, 1, 1.6, M.castIron);
    const valve = box(5, 3, 3, M.paintLight);
    const tank = box(4, 2.4, 3, M.castIron);
    const pumpM = cyl(1.3, 2.2, M.paintDark, { axis: 'z' });
    const pipeA = [box(1, 0.5, 0.5, M.darkSteel), box(0.5, 1, 0.5, M.darkSteel)]; // valve -> cap end
    const pipeB = [box(1, 0.5, 0.5, M.darkSteel), box(0.5, 1, 0.5, M.darkSteel)]; // valve -> rod end
    hyd.add(cylBody, fluidL, fluidR, rodM, piston, capL, capR, brk, valve, tank, pumpM, ...pipeA, ...pipeB);
    for (const o of hyd.children) o.position.z = ZL;

    const seg = (m, ax, ay, bx, by, th) => {
      const dx = bx - ax, dy = by - ay;
      m.position.set((ax + bx) / 2, (ay + by) / 2, ZL);
      m.rotation.z = Math.atan2(dy, dx);
      m.scale.set(Math.hypot(dx, dy) + th, th, th);
    };

    // ------------------------------------------------------------------ state + layout
    let phi = 0, strokes = 0, th = 0, psi = 0, xrNow = 0, fwd = true, vnow = 0, ang = 0, lift = 0;
    let workX = 0, workL = 1, workZ = 0, wd = 8, pLeft = 0, rho = 0;
    const ease = (s) => s * s * (3 - 2 * s);
    const zTool = ZL + 2.0;

    function setDrive() {
      mech.visible = !isHyd();
      hyd.visible = isHyd();
    }
    function layout() {
      calcKin();
      const L = Lv();
      levG.position.set(0, -P.c, ZL);
      bar.scale.y = L + 3;
      bar.position.y = L / 2;
      slot.scale.y = 2 * P.r + 2;
      slot.position.y = P.c;
      topPin.position.set(0, L, 0.6);
      pivotPin.position.z = 0.2;
      bracket.position.set(0, -P.c, 0.3);
      pin.position.set(0, P.r, 1.7);
      // work block: centred on the stroke, length shows L / (L + clearance)
      const noseMin = K.xmin + LR - 1.5, noseMax = K.xmax + LR - 1.5;
      workX = (noseMin + noseMax) / 2;
      workL = Math.max(K.S * (P.L / (P.L + P.cl)), 0.5);
      wd = Math.max(3, Math.min(12, P.W / 12));
      work.scale.set(workL, 2.5, wd);
      table.position.set(workX, yT - 3.7, ZL + 2);
      // hydraulic geometry
      rho = K.S + 4;
      pLeft = K.xmin + 2 - rho; // piston position at the start of the cutting stroke
      const xl = pLeft - 1, xrr = pLeft + K.S + 1;
      cylBody.scale.x = xrr - xl;
      cylBody.position.set((xl + xrr) / 2, yc, ZL);
      capL.position.set(xl, yc, ZL);
      capR.position.set(xrr, yc, ZL);
      rodM.scale.y = rodM.scale.z = BORE * P.rod;
      valve.position.set((xl + xrr) / 2, yc + 5.4, ZL);
      tank.position.set((xl + xrr) / 2 + 7.5, yc + 5.1, ZL);
      pumpM.position.set((xl + xrr) / 2 - 6.5, yc + 5.4, ZL);
      pipeFixed();
    }
    function pipeFixed() {
      const yv = yc + 5.4;
      const xa = pLeft - 0.5, xb = pLeft + K.S + 1.5;
      const xv = valve.position.x;
      seg(pipeA[0], xv - 1.2, yv - 0.6, xa, yv - 0.6, 0.5);
      seg(pipeA[1], xa, yv - 0.6, xa, yc + BORE + 0.2, 0.5);
      seg(pipeB[0], xv + 1.2, yv + 0.6, xb, yv + 0.6, 0.5);
      seg(pipeB[1], xb, yv + 0.6, xb, yc + BORE + 0.2, 0.5);
    }

    function pose() {
      if (isHyd()) {
        fwd = phi < K.fT;
        const s = fwd ? phi / K.fT : 1 - (phi - K.fT) / (1 - K.fT);
        xrNow = K.xmin + K.S * s;
        vnow = fwd ? 1 : -K.R;
        ang = phi * 360;
        lift = fwd ? 0 : 0.9 * Math.sin(Math.PI * (phi - K.fT) / (1 - K.fT));
      } else {
        const sg = phi * 2 * Math.PI;
        th = sg - K.alpha / 2;
        psi = Math.atan2(P.r * Math.sin(th), P.r * Math.cos(th) + P.c);
        xrNow = xr(psi);
        vnow = vnorm(sg);
        fwd = sg < K.alpha;
        ang = phi * 360;
        lift = fwd ? 0 : 0.9 * Math.sin((Math.PI * (sg - K.alpha)) / K.beta);
      }
    }
    function apply() {
      ram.position.x = xrNow;
      tip.position.y = -3.4 + lift;
      clap.rotation.z = lift * 0.3;
      const tx = xrNow + LR - 1.5;
      const nStr = Math.max(1, Math.ceil(P.W / P.f));
      const nv = Math.min(nStr, 24);
      const wz = zTool + wd / 2 - 0.2 - ((strokes % nv) / nv) * (wd - 0.4);
      work.position.set(workX, yT - 1.25, wz);
      const ws = workX - workL / 2;
      const cutLen = fwd ? Math.max(0, Math.min(tx - ws, workL)) : 0;
      strip.visible = fwd && cutLen > 0.02;
      strip.scale.x = Math.max(cutLen, 0.001);
      strip.position.set(ws + cutLen / 2, yT + 0.04, zTool);
      if (!isHyd()) {
        const L = Lv();
        disc.rotation.z = -th;
        levG.rotation.z = -psi;
        block.position.y = Math.hypot(P.r * Math.sin(th), P.r * Math.cos(th) + P.c);
        const ax = L * Math.sin(psi), ay = -P.c + L * Math.cos(psi);
        seg(link, ax, ay, xrNow, yg, 0.7);
        link.position.z = ZL + 1.0;
      } else {
        const p = xrNow + 2 - rho;
        const xl = pLeft - 1, xrr = pLeft + K.S + 1;
        piston.position.set(p, yc, ZL);
        fluidL.scale.x = Math.max(p - 0.4 - xl, 0.01);
        fluidL.position.set((xl + p - 0.4) / 2, yc, ZL);
        fluidR.scale.x = Math.max(xrr - p - 0.4, 0.01);
        fluidR.position.set((p + 0.4 + xrr) / 2, yc, ZL);
        const xb = xrNow + 2;
        rodM.scale.x = xb - p;
        rodM.position.set((p + xb) / 2, yc, ZL);
        brk.scale.set(1.4, yc - yg, 1);
        brk.position.set(xb, (yc + yg) / 2, ZL);
        fluidL.material = fwd ? M.fluid : M.oil;
        fluidR.material = fwd ? M.oil : M.fluid;
        for (const o of pipeA) o.material = fwd ? M.fluid : M.darkSteel;
        for (const o of pipeB) o.material = fwd ? M.darkSteel : M.fluid;
      }
    }

    // ------------------------------------------------------------------ numerical
    const num = () => {
      const R = ratioNow();
      const tf = ((P.L + P.cl) / P.V) * 60;
      const tr = tf / R;
      const cyc = tf + tr;
      const nPer = Math.ceil(P.W / P.f - 1e-9);
      const passes = Math.ceil(P.H / P.d - 1e-9);
      const n = nPer * passes;
      return { R, tf, tr, cyc, spm: 60 / cyc, nPer, passes, n, total: (n * cyc) / 60, fa: 360 * fwdFrac(), ra: 360 * (1 - fwdFrac()) };
    };
    const f1 = (v, d = 1) => v.toFixed(d);
    const fmin = (s) => `${f1(s / 60, 2)} min`;

    layout();
    setDrive();
    pose();
    apply();

    const cam = {
      front: { position: [4, 3, 66], target: [4, 2, 0] },
      hyd: { position: [-2, 6, 66], target: [-2, 6, 0] },
      iso: { position: [30, 18, 46], target: [10, 8, 2] },
      top: { position: [14, 60, 12], target: [14, 8, 2] },
    };
    const crankOn = () => {
      P.drive = 'crank';
      setDrive();
      layout();
      pose();
      apply();
    };
    const hydOn = () => {
      P.drive = 'hydraulic';
      setDrive();
      layout();
      pose();
      apply();
    };
    const ctl = (id, key, label, min, max, step) =>
      `<div class="ctl-row"><label for="lab-${id}">${label}</label><output class="val" data-out="${key}"></output></div><input id="lab-${id}" type="range" min="${min}" max="${max}" step="${step}" data-key="${key}">`;

    return {
      legend: [['var(--v)', 'Cutting stroke / arc'], ['var(--f)', 'Return stroke / arc'], ['var(--d)', 'Stroke length']],
      steps: [
        {
          id: 'why', chip: 'Why quick return', group: 'Idea', eyebrow: 'Shaping · slide 97', title: 'The return stroke does no cutting',
          cam: cam.front, onEnter: crankOn,
          html: () => `
            <p>A shaper cuts only on the <b>forward stroke</b>. The return stroke is <mark>idle: no metal is removed</mark>, so every second spent returning is wasted production time.</p>
            <p>A <mark>quick-return mechanism</mark> makes the return stroke faster than the cutting stroke, so the idle part of each cycle is short, and the shaper makes more cutting strokes per minute. Because the ram is also slower while cutting, the tool and the finish suffer less.</p>
            <div class="ctl">${ctl('r1', 'r', 'Crank radius r', 0.5, 8.2, 0.05)}
              <p class="ro">Cutting takes <b data-ro="shareC"></b> of each cycle, the idle return only <b data-ro="shareR"></b>. Quick-return ratio = <b data-ro="ratio"></b></p>
            </div>
            <p class="key"><span class="key-tag">Remember</span>Quick return = return time shorter than cutting time. Ratio = cutting time ÷ return time = α ÷ β (always more than 1).</p>
            <p class="exam">Asked: TF 2022-23 Q.7(c).</p>`,
        },
        {
          id: 'parts', chip: 'The mechanism', group: 'Crank and lever', eyebrow: 'Shaping · slide 98', title: 'Crank and slotted lever',
          cam: cam.front, onEnter: crankOn,
          html: () => `
            <p>The motor turns the <mark>bull gear</mark> at a constant speed. A <mark>crank pin</mark> on the gear carries a <mark>sliding block</mark> that runs in the slot of the <mark>slotted lever</mark> (rocker arm). The lever pivots at the bottom (<b>Q</b>) and its top end drives the <mark>ram</mark> through a <mark>link</mark>.</p>
            <ul>
              <li>Pin far from Q (top of the circle): the block is far from the pivot, so the lever turns slowly. This is the <span class="tag-v">cutting stroke</span>.</li>
              <li>Pin near Q (bottom): the block is close to the pivot, so the lever turns quickly. This is the <span class="tag-f">return stroke</span>.</li>
            </ul>
            <div class="ctl">${ctl('n1', 'N', 'Bull gear speed N', 10, 60, 1)}
              <p class="ro">Strokes per minute at this speed: <b data-ro="N"></b> (slow-motion on screen)</p></div>
            <p class="note">The gear speed is constant. The lever turns slowly at the top of the crank circle and quickly at the bottom. That is what makes the return quick.</p>`,
        },
        {
          id: 'angles', chip: 'Cutting / return angles', group: 'Crank and lever', eyebrow: 'Shaping · slide 98', title: 'The two angles come from tangents',
          cam: cam.front, onEnter: crankOn,
          html: () => `
            <p>The lever reaches its two extreme positions when it is <mark>tangent to the crank circle</mark>. Draw the tangents from Q. Each makes an angle φ with the line OQ, where <b>sin φ = r / c</b>.</p>
            <p class="formula">α = 180° + 2 sin⁻¹(r / c)   (cutting)<br>β = 180° − 2 sin⁻¹(r / c)   (return)<br>ratio = α / β</p>
            <p>The red arc is the crank angle turned while cutting, the blue arc while returning. The gear turns at constant speed, so angle is proportional to time.</p>
            <div class="ctl">${ctl('r2', 'r', 'Crank radius r', 0.5, 8.2, 0.05)}${ctl('c2', 'c', 'Pivot distance c (O to Q)', 10, 16, 0.1)}
              <p class="ro">sin φ = <b data-ro="q"></b> → φ = <b data-ro="phi"></b>, α = <b data-ro="alpha"></b>, β = <b data-ro="beta"></b>, ratio = <b data-ro="ratio"></b></p>
              <p class="ro">Stroke length S = <b data-ro="S"></b></p></div>
            <ul>
              <li><b>Bigger r</b> (or smaller c): the ratio increases, <b>and</b> the stroke gets longer.</li>
              <li>r = 0 would give α = β = 180°: no quick return.</li>
            </ul>
            <p class="exam">Asked: TF 2022-23 Q.7(c); 2016-17 Q.6(d) uses α = 220°.</p>`,
        },
        {
          id: 'velocity', chip: 'Ram velocity', group: 'Crank and lever', eyebrow: 'Shaping · slide 84', title: 'Ram velocity is not constant',
          cam: cam.front, onEnter: crankOn,
          html: () => `
            <p>Look at the graph. The ram speeds up from rest, is fastest near mid-stroke and stops at each end. Cutting speed therefore <mark>varies through the stroke</mark>. On the return the ram is faster, with a higher peak.</p>
            <div class="ctl">${ctl('r3', 'r', 'Crank radius r', 0.5, 8.2, 0.05)}
              <p class="ro">Now: <b data-ro="vel"></b> of the mean cutting velocity. Peak cutting velocity = <b data-ro="vpk"></b> × mean; peak return = <b data-ro="vpr"></b> × mean</p>
            </div>
            <p>In calculations the cutting speed V is the <mark>average</mark> speed over the forward stroke; the course takes the peak as about <mark>V = 2 × average forward velocity</mark>.</p>
            <p class="formula">V<sub>avg,forward</sub> = S / t<sub>forward</sub>,  V<sub>avg,return</sub> = S / t<sub>return</sub> = V<sub>avg,forward</sub> × (α / β)</p>`,
        },
        {
          id: 'adjust', chip: 'Stroke adjustment', group: 'Crank and lever', eyebrow: 'Shaping · slide 98', title: 'Stroke length and stroke position',
          cam: cam.front, onEnter: crankOn,
          html: () => `
            <p><b>Stroke length</b> is set by the <mark>crank pin radius r</mark>: the pin is moved along the slot in the bull gear. A larger r swings the lever more, so the ram stroke is longer (S ≈ 2 r × lever length ÷ c). Stroke = job length + clearance.</p>
            <p><b>Stroke position</b> is set by changing the length of the ram–link connection (a screw and clamping handle on the ram). It shifts the whole stroke forward or back without changing its length or the ratio.</p>
            <div class="ctl">${ctl('r4', 'r', 'Crank radius r (stroke length)', 0.5, 8.2, 0.05)}${ctl('p4', 'pos', 'Stroke position (ram offset)', -4, 4, 0.1)}
              <p class="ro">Stroke S = <b data-ro="S"></b>; ratio unchanged by position: <b data-ro="ratio"></b></p></div>
            <p class="note">The stroke must clear the job at both ends. A short clearance before and after the job avoids hitting the work and wasted travel.</p>`,
        },
        {
          id: 'hydraulic', chip: 'Hydraulic drive', group: 'Hydraulic', eyebrow: 'Shaping · slides 99–100', title: 'Hydraulic shaper: constant speed, faster return',
          cam: cam.hyd, onEnter: hydOn,
          html: () => `
            <p>The ram is joined to a <mark>piston rod</mark> in a hydraulic cylinder. A pump sends oil through a <mark>reversing valve</mark>: the valve directs high-pressure oil to one end of the cylinder, and the other end drains to the tank. An <mark>adjustable trip dog</mark> on the ram flips the valve at each end of the stroke. A flow-control valve sets the ram speed.</p>
            <ul>
              <li><span class="tag-v">Cutting stroke</span>: oil goes into the <b>cap end</b> (full piston area A₁). Speed = Q / A₁.</li>
              <li><span class="tag-f">Return stroke</span>: oil goes into the <b>rod end</b>, where the rod takes up area. The area is smaller (A₂ = A₁ − A<sub>rod</sub>), so the <mark>same pump flow Q gives a higher speed</mark> = Q / A₂.</li>
            </ul>
            <div class="ctl">${ctl('k6', 'rod', 'Rod diameter ÷ bore', 0.3, 0.85, 0.01)}
              <p class="ro">A₂ / A₁ = 1 − k² = <b data-ro="a2"></b> → return ÷ cutting speed = <b data-ro="hr"></b>; cutting is <b data-ro="hfw"></b> of the cycle</p>
            </div>
            <p class="formula">V<sub>cut</sub> = Q / A₁,  V<sub>return</sub> = Q / (A₁ − A<sub>rod</sub>),  ratio = A₁ / A₂ = 1 / (1 − k²)</p>
            <p class="exam">Asked: TF 2023-24 Q.5(c); 2020-21 Q.1(c); 2016-17 Q.6(c); 2014-15 Q.6(c); 2012-13 Q.5(d).</p>`,
        },
        {
          id: 'compare', chip: 'Mechanical vs hydraulic', group: 'Hydraulic', eyebrow: 'Shaping · slides 100–101', title: 'Advantages and disadvantages',
          cam: cam.front,
          html: () => `
            <p>Switch the drive to compare. The graph shows the speed pattern.</p>
            <div class="seg"><button type="button" data-set="drive:crank">Crank and slotted lever</button><button type="button" data-set="drive:hydraulic">Hydraulic</button></div>
            <div class="duo">
              <div data-band="crank"><h3>Mechanical (crank)</h3><ul><li>Cheaper, simple, positive stroke.</li><li>Cutting speed varies through the stroke.</li><li>Reversal causes inertia and shock; needs a clapper box (see the clapper lab).</li></ul></div>
              <div data-band="hydraulic"><h3>Hydraulic</h3><ul><li><b>Constant cutting speed</b> over the stroke, so full cutting power can be used.</li><li>Quick return, little shock, smooth reversal; small moving inertia.</li><li>Wide range of speeds; more strokes per minute possible.</li><li>More expensive; the stroke end depends on trip dogs and cutting resistance.</li></ul></div>
            </div>
            <p class="ro">Speed variation: peak ÷ mean cutting velocity = <b data-ro="vpk2"></b></p>
            <p class="exam">Asked: TF 2009-10 Q.6(c); 2023-24 Q.5(c); 2020-21 Q.1(c); 2012-13 Q.5(d).</p>`,
        },
        {
          id: 'numbers', chip: 'Shaper time numerical', group: 'Numerical', eyebrow: 'Shaping · slides 102–104', title: 'Machining time of a shaping job',
          cam: cam.iso, plot: false,
          html: () => `
            <p>Pick a problem or change the data. <b>Assumptions</b>: stroke = job length + clearance; clearance is <mark>25 mm</mark> in total (given in 2016-17 Q.6(d), assumed for slide-104 Q1); feed is applied on the return; the number of passes = height to remove ÷ d; the average cutting speed is the given mm/min.</p>
            <div class="presets">
              <button class="pbtn" type="button" data-set="drive:crank,r:4.104,c:12,V:24000,L:250,W:120,f:0.6,d:3,H:6,cl:25">Slide 104 Q1</button>
              <button class="pbtn" type="button" data-set="drive:crank,r:4.104,c:12,V:22000,L:240,W:100,f:0.6,d:3,H:6,cl:25">2016-17 Q.6(d)</button>
            </div>
            <div class="ctl">${ctl('v7', 'V', 'Cutting speed V', 10000, 40000, 500)}${ctl('l7', 'L', 'Job length L', 100, 400, 5)}${ctl('cl7', 'cl', 'Clearance (total)', 0, 60, 5)}
              ${ctl('w7', 'W', 'Job width W', 40, 200, 5)}${ctl('f7', 'f', 'Feed f', 0.2, 2, 0.05)}${ctl('d7', 'd', 'Depth of cut d', 1, 6, 0.5)}${ctl('h7', 'H', 'Height to remove', 1, 12, 0.5)}
              ${ctl('r7', 'r', 'Crank radius r (sets α)', 0.5, 8.2, 0.05)}
            </div>
            <p class="formula">t<sub>fwd</sub> = (L + clearance) / V<br>t<sub>ret</sub> = t<sub>fwd</sub> × β / α<br>strokes/pass = W / f,  passes = H / d</p>
            <p class="ro">Forward angle α = <b data-ro="alpha"></b>, return β = <b data-ro="beta"></b></p>
            <p class="ro">Forward time = <b data-ro="tf"></b> · Return time = <b data-ro="tr"></b> · Cycle = <b data-ro="cyc"></b></p>
            <p class="ro">Strokes per pass = <b data-ro="nper"></b>, passes = <b data-ro="passes"></b>, total strokes = <b data-ro="n"></b></p>
            <p class="ro">Strokes per minute = <b data-ro="spm"></b> · <mark>Total time = <b data-ro="total"></b></mark></p>
            <p class="note">The "drive" is the crank mechanism with the ratio α/β from r and c here. For a different ratio, change r.</p>
            <p class="exam">Asked: TF 2016-17 Q.6(d) (about the same as slide-104 Q1).</p>`,
          onEnter: crankOn,
        },
        {
          id: 'answer', chip: 'Exam answer', group: 'Exam', eyebrow: 'Model answer', title: 'Quick return mechanism and hydraulic shaper',
          cam: cam.hyd, onEnter: hydOn,
          html: () => `
            <ul>
              <li><b>Quick return:</b> a mechanism that makes the return (idle) stroke of the ram faster than the forward (cutting) stroke. Ratio = α/β = cutting time / return time, with α = 180° + 2 sin⁻¹(r/c).</li>
              <li><b>Why used:</b> no cutting happens on the return, so a quick return cuts the idle time and raises production.</li>
              <li><b>Hydraulic quick return:</b> the ram is driven by a piston in a cylinder; a pump with a reversing valve (flipped by trip dogs) sends oil to the cap end for cutting (area A₁) and to the rod end for the return (area A₁ − A<sub>rod</sub>). Same flow Q, smaller area, so higher return speed. Cutting speed is constant.</li>
              <li><b>Advantages:</b> constant cutting speed, full power used, smooth reversal, little shock, wide speed range, more strokes per minute. <b>Disadvantages:</b> costlier; stroke end depends on trip dogs and cutting load.</li>
              <li><b>Numerical (slide 104 Q1, clearance 25 mm assumed):</b> t<sub>fwd</sub> = 275/24000 = 0.01146 min = 0.6875 s; t<sub>ret</sub> = 0.6875 × 140/220 = 0.4375 s; cycle = 1.125 s → 53.3 strokes/min; strokes/pass = 120/0.6 = 200, passes = 6/3 = 2, so 400 strokes = 450 s = 7.5 min.</li>
              <li><b>2016-17 Q.6(d)</b> (height 6 mm assumed): t<sub>fwd</sub> = 265/22000 min = 0.7227 s; t<sub>ret</sub> = 0.4599 s; cycle 1.1826 s → 50.7 strokes/min; 100/0.6 → 167 strokes/pass, 2 passes = 334 strokes ≈ 395 s = 6.58 min.</li>
            </ul>
            <p class="key"><span class="key-tag">Sketch</span>Crank circle with the two tangents from Q, marking α (cutting arc) and β (return arc); and the hydraulic cylinder with cap-end and rod-end ports to the valve.</p>`,
        },
      ],

      onParam(key) {
        if (key === 'drive') {
          setDrive();
        }
        if (['r', 'c', 'pos', 'rod', 'L', 'cl', 'W', 'drive'].includes(key)) layout();
        pose();
        apply();
      },

      update(dt) {
        const rate = (P.N / 60) * 0.45;
        phi += dt * rate;
        if (phi >= 1) {
          phi -= Math.floor(phi);
          strokes++;
        }
        pose();
        apply();
      },

      overlay(d, step) {
        const z = 4.6;
        const nose = (x) => x + LR - 1.5;
        // velocity arrow over the ram
        if (fwd) {
          d.path([[nose(xrNow) - 6, yg + 4, z], [nose(xrNow) + 3, yg + 4, z]], 'vline', { arrowEnd: true });
          d.label([nose(xrNow) - 1, yg + 5.6, z], 'V  cutting', 'v');
        } else {
          d.path([[nose(xrNow) + 3, yg + 4, z], [nose(xrNow) - 6, yg + 4, z]], 'dm', { arrowEnd: true });
          d.label([nose(xrNow) - 1, yg + 5.6, z], 'return (idle)', 'minor');
        }
        // stroke length dimension, shown whenever the mechanism geometry matters
        if (step !== 'numbers' && step !== 'hydraulic') {
          d.dim([nose(K.xmin), yg - 1.6, z], [nose(K.xmax), yg - 1.6, z], `S = ${f1(K.S * 10, 0)} mm`, [0, 11.5, 0]);
        }
        if (isHyd()) {
          const xl = pLeft - 1, xrr = pLeft + K.S + 1;
          d.label([xl + 2, yc - 3.6, z], 'cap end, area A₁', 'minor');
          d.label([xrr - 2, yc - 3.6, z], 'rod end, A₂ = A₁ − A rod', 'minor');
          d.label([valve.position.x, yc + 8, z], 'reversing valve', 'minor');
          d.label([tank.position.x, yc + 7.4, z], 'tank', 'minor');
          d.label([pumpM.position.x, yc + 7.4, z], 'pump', 'minor');
          d.label([nose(xrNow) + 5, yg + 2.2, z], fwd ? 'speed Q / A₁' : 'speed Q / A₂ (faster)', fwd ? 'v' : 'f');
          const len = fwd ? 6 : 6 * K.R;
          const x0 = nose(xrNow) + 4;
          d.path([[x0, yg - 4, z], [x0 + (fwd ? len : -len), yg - 4, z]], fwd ? 'vline' : 'fline', { arrowEnd: true });
          return;
        }
        if (step === 'numbers') {
          d.dim([workX - workL / 2, yT, zTool + 6], [workX + workL / 2, yT, zTool + 6], `L = ${P.L} mm`, [0, -1.8, 0]);
          d.path([[workX + workL / 2 + 3, yT + 0.5, work.position.z], [workX + workL / 2 + 3, yT + 0.5, work.position.z - 5]], 'fline', { arrowEnd: true });
          d.label([workX + workL / 2 + 4, yT + 1.8, work.position.z - 2], 'f', 'f');
          return;
        }
        // crank circle with cutting (red) and return (blue) arcs, tangents and angle labels
        if (step === 'why' || step === 'angles' || step === 'velocity' || step === 'adjust' || step === 'parts') {
          const O = [0, 0, z], Q = [0, -P.c, z], U = [1, 0, 0], W = [0, 1, 0];
          const a0 = Math.PI / 2 - K.alpha / 2;
          d.arc(O, U, W, P.r, a0, a0 + K.alpha, 'vline', 48);
          d.arc(O, U, W, P.r, a0 - K.beta, a0, 'fline', 36);
          d.dot(O, 'dot');
          d.dot(Q, 'dot');
          if (step === 'parts') {
            d.label([0, -P.c - 2.3, z], 'Q  lever pivot', 'minor');
            d.label([-11, 3, z], 'bull gear', 'minor');
            d.label([P.r * Math.sin(th) + 3.4, P.r * Math.cos(th) + 1, z], 'crank pin + block', 'minor');
            d.label([Math.sin(psi) * (Lv() - 5) - 5, -P.c + (Lv() - 5) * Math.cos(psi), z], 'slotted lever', 'minor');
            d.label([nose(xrNow) - LR + 4, yg - 3, z], 'ram', 'minor');
          }
          if (step === 'angles' || step === 'why') {
            const L = Lv(), sn = Math.sin(K.phi), cs = Math.cos(K.phi), tl = Math.sqrt(P.c * P.c - P.r * P.r);
            for (const s of [-1, 1]) {
              d.line(Q, [s * L * sn, -P.c + L * cs, z], 'hx');
              d.dot([s * tl * sn, -P.c + tl * cs, z], 'dot');
            }
            d.label([L * sn + 3, -P.c + L * cs + 0.6, z], 'extreme 2', 'minor');
            d.label([-L * sn - 3, -P.c + L * cs + 0.6, z], 'extreme 1', 'minor');
            d.line(O, Q, 'cl');
            d.label([1.2, -P.c / 2, z], 'c', 'dimtxt');
            d.arc(Q, U, W, 6, Math.PI / 2 - K.phi, Math.PI / 2 + K.phi, 'arc');
            d.label([0, -P.c + 7.4, z], '2φ', 'hl');
          }
          d.label([0, P.r + 1.7, z], `α = ${f1(K.alpha * DEG, 1)}° cutting`, 'v');
          d.label([0, -P.r - 1.7, z], `β = ${f1(K.beta * DEG, 1)}° return`, 'f');
        }
      },

      hud() {
        const R = ratioNow();
        return {
          status: fwd ? 'Forward stroke: cutting' : 'Return stroke: idle, tool lifted',
          statusCls: fwd ? 'v' : 'f',
          rows: [
            ['Drive', isHyd() ? 'Hydraulic' : 'Crank + slotted lever'],
            [isHyd() ? 'Cycle phase' : 'Crank angle', `${f1(ang, 0)}°`],
            ['Ram velocity', `${f1(vnow, 2)} × mean cutting`],
            [isHyd() ? 'Cutting share' : 'α / β', isHyd() ? `${f1(K.fT * 100, 0)} %` : `${f1(K.alpha * DEG, 0)}° / ${f1(K.beta * DEG, 0)}°`],
            ['Quick-return ratio', f1(R, 2)],
            ['Stroke S', `${f1(K.S * 10, 0)} mm`],
          ],
          verdict: R >= 1.6 ? ['Good quick return', 'ok'] : R >= 1.25 ? ['Modest quick return', 'warn'] : ['Almost no quick return', 'bad'],
        };
      },

      readouts() {
        const n = num();
        const pk = isHyd() ? 1 : K.peakF;
        return {
          shareC: `${f1((K.alpha / (2 * Math.PI)) * 100, 0)} %`,
          shareR: `${f1((K.beta / (2 * Math.PI)) * 100, 0)} %`,
          ratio: f1(K.ratio, 2),
          N: `${P.N} strokes/min`,
          q: f1(P.r / P.c, 3),
          phi: `${f1(K.phi * DEG, 1)}°`,
          alpha: `${f1(K.alpha * DEG, 1)}°`,
          beta: `${f1(K.beta * DEG, 1)}°`,
          S: `${f1(K.S * 10, 0)} mm`,
          vel: `${f1(Math.abs(vnow), 2)} ×`,
          vpk: f1(K.peakF, 2),
          vpr: f1(-K.peakR, 2),
          vpk2: isHyd() ? '1.00 (constant)' : f1(pk, 2),
          a2: f1(1 - P.rod * P.rod, 2),
          hr: f1(K.R, 2),
          hfw: `${f1(K.fT * 100, 0)} %`,
          tf: `${f1(n.tf, 4)} s`,
          tr: `${f1(n.tr, 4)} s`,
          cyc: `${f1(n.cyc, 4)} s`,
          nper: String(n.nPer),
          passes: String(n.passes),
          n: String(n.n),
          spm: f1(n.spm, 1),
          total: `${f1(n.total, 0)} s = ${fmin(n.total)}`,
          band: P.drive,
        };
      },
      live: true,

      format(key, v) {
        if (key === 'r' || key === 'c') return `${(v * 10).toFixed(0)} mm`;
        if (key === 'pos') return `${(v * 10).toFixed(0)} mm`;
        if (key === 'N') return `${v} rpm`;
        if (key === 'rod') return `k = ${v.toFixed(2)}`;
        if (key === 'L' || key === 'cl' || key === 'W' || key === 'd' || key === 'H') return `${v} mm`;
        if (key === 'f') return `${v.toFixed(2)} mm/stroke`;
        if (key === 'V') return `${Math.round(v)} mm/min`;
        return null;
      },

      plot(g, w, h, c) {
        const mx = 26, top = 14, bot = h - 20;
        const hyd = isHyd();
        const ymax = (hyd ? 1 : K.peakF) * 1.15;
        const ymin = (hyd ? -K.R : K.peakR) * 1.15;
        const X = (a) => mx + (a / 360) * (w - mx - 8);
        const Y = (v) => bot - ((v - ymin) / (ymax - ymin)) * (bot - top);
        const aC = (fwdFrac() * 360);
        g.globalAlpha = 0.16;
        g.fillStyle = c.v;
        g.fillRect(X(0), top, X(aC) - X(0), bot - top);
        g.fillStyle = c.f;
        g.fillRect(X(aC), top, X(360) - X(aC), bot - top);
        g.globalAlpha = 1;
        g.strokeStyle = c.muted;
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(mx, Y(0));
        g.lineTo(w - 8, Y(0));
        g.moveTo(mx, top);
        g.lineTo(mx, bot);
        g.stroke();
        g.strokeStyle = c.ink;
        g.lineWidth = 1.8;
        g.beginPath();
        if (hyd) {
          g.moveTo(X(0), Y(0));
          g.lineTo(X(0), Y(1));
          g.lineTo(X(aC), Y(1));
          g.lineTo(X(aC), Y(-K.R));
          g.lineTo(X(360), Y(-K.R));
          g.lineTo(X(360), Y(0));
        } else {
          for (let i = 0; i <= 90; i++) {
            const a = (i / 90) * 360;
            const x = X(a), y = Y(vnorm((a / 360) * 2 * Math.PI));
            if (i) g.lineTo(x, y);
            else g.moveTo(x, y);
          }
        }
        g.stroke();
        g.fillStyle = c.accent;
        g.beginPath();
        g.arc(X(ang), Y(vnow), 3.5, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = c.v;
        g.fillText(`cut ${f1(aC, 0)}°`, X(aC / 2) - 18, top + 10);
        g.fillStyle = c.f;
        g.fillText(`return ${f1(360 - aC, 0)}°`, X(aC + (360 - aC) / 2) - 24, bot - 4);
        g.fillStyle = c.muted;
        g.fillText('v/mean', 2, top + 4);
        g.fillText('crank angle 0 to 360°', mx + 40, h - 4);
        return hyd ? 'Hydraulic: constant speed each way' : 'Ram velocity vs crank angle';
      },
    };
  },
};
