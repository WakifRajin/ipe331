// Effect lab: approach length and machining time in milling (slab milling, face milling centred and offset).
// Scene units: S units per mm. Work occupies x in [0, L]; the cutter centre travels from -A (first contact)
// to L + O (cutter clear). Numbers on screen are the true mm values.
export default {
  id: 'milling-approach',
  chapter: 'milling',
  title: 'Approach length and milling time',
  eyebrow: 'Milling · slides 68–76',
  sub: 'A round cutter touches the work before its centre reaches the edge. Build the approach A from a right triangle, then see how it adds to the table travel and the machining time.',
  blurb: 'Derive the approach length for slab and face milling, and use Tm = (L + A + O) / fr with real numbers from the slide examples.',
  qs: ['2023-24_6d', '2021-22_2c', '2020-21_3a', '2018-19_7c', '2017-18_6a'],
  params: { type: 'slab', D: 100, d: 2, w: 100, L: 150, V: 20, fz: 0.13, z: 8 },

  build({ THREE, scene, P, kit, flyTo, rerender }) {
    const S = 0.05;
    const H = 1.8;
    const cl = (v, a, b) => Math.max(a, Math.min(b, v));
    const TAU = Math.PI * 2;
    const HOLD = ['slab-derive', 'slab-d4', 'face-c', 'face-o'];

    // ---------- formulas (mm) ----------
    function calc() {
      const D = Math.max(P.D, 5);
      const z = Math.max(1, Math.round(P.z));
      const fz = Math.max(P.fz, 1e-4);
      const V = Math.max(P.V, 0.1);
      const L = Math.max(P.L, 1);
      const slab = P.type === 'slab';
      const off = P.type === 'face-offset';
      const d = slab ? cl(P.d, 0.01, D / 2) : Math.max(P.d, 0.01);
      const w = slab ? Math.max(P.w, 1) : cl(P.w, 1, D);
      const lat = off ? Math.max(D / 2 - w, 0) : 0; // lateral distance of the nearest work point from the cutter centre-line
      let A;
      let O;
      if (slab) {
        A = Math.sqrt(d * (D - d));
        O = 0;
      } else {
        A = Math.sqrt(Math.max(D * D / 4 - lat * lat, 0));
        O = A;
      }
      const N = (1000 * V) / (Math.PI * D);
      const fr = N * z * fz;
      const Ltot = L + A + O;
      const Tm = Ltot / fr;
      const MRR = w * d * fr;
      return { D, z, fz, V, L, d, w, lat, A, O, N, fr, Ltot, Tm, MRR, slab, off };
    }
    const exOf = (type, D, d, w, L, V, fz, z) => {
      const keep = { ...P };
      Object.assign(P, { type, D, d, w, L, V, fz, z });
      const r = calc();
      Object.assign(P, keep);
      return r;
    };
    const fmin = (t) => `${t.toFixed(2)} min (${(t * 60).toFixed(1)} s)`;

    // ---------- materials ----------
    const mWork = new THREE.MeshStandardMaterial({ color: 0x77828d, roughness: 0.75, metalness: 0.2 });
    const mMach = new THREE.MeshStandardMaterial({ color: 0xcfd8e0, roughness: 0.3, metalness: 0.55 });
    const mFace = new THREE.MeshStandardMaterial({ color: 0x9aa3ab, roughness: 0.35, metalness: 0.8, transparent: true, opacity: 0.5, depthWrite: false });

    // ---------- work ----------
    const unitBox = new THREE.BoxGeometry(1, 1, 1).translate(0.5, 0.5, 0);
    const unm = new THREE.Mesh(unitBox, mWork);
    const mach = new THREE.Mesh(unitBox, mMach);
    const table = new THREE.Mesh(unitBox, kit.M.castIron);
    unm.castShadow = mach.castShadow = true;
    scene.add(unm, mach, table);

    // ---------- cutters ----------
    const slabG = new THREE.Group();
    const faceG = new THREE.Group();
    const slabBody = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 48).rotateX(Math.PI / 2), kit.M.hss);
    const arbor = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 20).rotateX(Math.PI / 2), kit.M.darkSteel);
    slabG.add(slabBody, arbor);
    const faceBody = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 56), mFace);
    faceG.add(faceBody);
    const toothGeo = new THREE.BoxGeometry(1, 1, 1);
    const slabTeeth = [];
    const faceTeeth = [];
    for (let i = 0; i < 24; i++) {
      const a = new THREE.Mesh(toothGeo, kit.M.carbide);
      const b = new THREE.Mesh(toothGeo, kit.M.carbide);
      slabG.add(a);
      faceG.add(b);
      slabTeeth.push(a);
      faceTeeth.push(b);
    }
    scene.add(slabG, faceG);

    let cw = 5; // slab cutter width (units)
    let zc = 0; // work z centre (units)
    let wz = 5; // work z span (units)
    function layout() {
      const c = calc();
      const R = (c.D / 2) * S;
      cw = (c.w + 10) * S;
      wz = c.w * S;
      zc = c.off ? (c.D / 2 - c.w / 2) * S : 0;
      slabBody.scale.set(R - 0.06, R - 0.06, cw);
      arbor.scale.set(Math.min(0.5, R * 0.35), Math.min(0.5, R * 0.35), cw + 2.4);
      const tr = Math.max(0.1, R * 0.07);
      for (let i = 0; i < 24; i++) {
        const t = slabTeeth[i];
        t.visible = i < c.z;
        const a = (i / c.z) * TAU;
        t.position.set(Math.cos(a) * (R - tr / 2 + 0.01), Math.sin(a) * (R - tr / 2 + 0.01), 0);
        t.rotation.set(0, 0, a);
        t.scale.set(tr, tr * 0.6, cw);
        const f = faceTeeth[i];
        f.visible = i < c.z;
        f.position.set(Math.cos(a) * (R - 0.14), -0.2, Math.sin(a) * (R - 0.14));
        f.rotation.set(0, -a, 0);
        f.scale.set(0.3, 0.22, 0.34);
      }
      faceBody.scale.set(R - 0.02, 0.5, R - 0.02);
      faceBody.position.y = 0;
      const ln = Math.max(c.L * S, 1);
      table.position.set(-2, -H - 0.4, zc);
      table.scale.set(ln + 4, 0.4, wz + 3.2);
    }
    // unit boxes are centred in z (translate(0.5,0.5,0)), so z-extent scales about zc
    layout();

    const camFor = (type, Pp) => {
      const D = Math.max(Pp.D, 5);
      const L = Math.max(Pp.L, 1);
      const m = (L * S) / 2;
      if (type === 'slab') return { position: [m, 3.2 + D * S * 0.25, 12 + (L + D) * S], target: [m, 0.3, 0] };
      const zcm = type === 'face-offset' ? (D / 2 - Math.min(Pp.w, D) / 2) * S * 0.5 : 0;
      return { position: [m, 8 + 1.25 * (L + D) * S, 0.01], target: [m, 0, zcm] };
    };
    const camNow = () => camFor(P.type, P);

    // ---------- state ----------
    let prog = 0;
    let hold = 0;
    let spin = 0;
    let cxmm = 0;

    const sl = (id, key, label, min, max, step) => `
      <div class="ctl-row"><label for="lab-${id}">${label}</label><output class="val" data-out="${key}"></output></div>
      <input id="lab-${id}" type="range" min="${min}" max="${max}" step="${step}" data-key="${key}">`;
    const typeSeg = () => `<div class="seg"><button type="button" data-set="type:slab">Slab</button><button type="button" data-set="type:face-centred">Face, centred</button><button type="button" data-set="type:face-offset">Face, offset</button></div>`;

    function setType(t) {
      P.type = t;
      onParam('type');
    }
    function onParam(key) {
      if (key === 'type' || key === 'D' || key === 'd') {
        const c0 = P.type === 'slab';
        if (c0) P.d = Math.min(P.d, P.D / 2);
        else P.w = Math.min(P.w, P.D);
      }
      if (key === 'w' && P.type !== 'slab') P.w = Math.min(P.w, P.D);
      layout();
      if (key === 'type') flyTo(camNow());
    }

    const fmtRow = (r) => `<tr><td>${r.name}</td><td>${r.A.toFixed(2)}</td><td>${r.O.toFixed(2)}</td><td>${r.N.toFixed(1)}</td><td>${r.fr.toFixed(1)}</td><td><b>${r.Tm.toFixed(2)}</b></td></tr>`;

    return {
      legend: [['var(--v)', 'Cutting speed V (cutter rotation)'], ['var(--f)', 'Feed: table travel L + A + O'], ['var(--d)', 'Depth of cut d']],
      steps: [
        {
          id: 'intro', chip: 'Why A and O', group: 'Idea', eyebrow: 'Milling · slide 68', title: 'The cutter travels more than the length of the work',
          cam: camNow,
          html: () => `
            <p>The cutter is round. Its first tooth touches the work when the <b>centre is still a distance A before the edge</b> (approach). At the end the cutter must travel a further <b>O</b> (overtravel) to clear. So the table moves</p>
            <p class="formula">L + A + O</p>
            ${typeSeg()}
            <p class="ro">L = <b data-ro="Ls"></b>, A = <b data-ro="A"></b>, O = <b data-ro="O"></b> → travel <b data-ro="ltot"></b></p>
            <ul>
              <li><span class="tag-f">f</span> blue: table travel, measured along the work.</li>
              <li><span class="tag-d">d</span> green: depth of cut (slab milling).</li>
              <li>The bar under the work grows as the cutter moves; the clock shows the real time elapsed.</li>
            </ul>
            <p class="key"><span class="key-tag">Remember</span>Tm = (L + A + O) / fr. A and O depend on the cutter and the cut, not on the length L.</p>`,
        },
        {
          id: 'slab-derive', chip: 'Slab: A = √(d(D−d))', group: 'Approach length', eyebrow: 'Milling · slides 69–70', title: 'Slab milling: the right triangle',
          cam: () => camFor('slab', P), plot: true,
          onEnter() { setType('slab'); },
          html: () => `
            <p>Freeze the cutter at <mark>first contact</mark>: the tooth touches the top corner of the work. Look at the right triangle (hypotenuse red-amber, legs blue and grey):</p>
            <ol class="steps">
              <li>Hypotenuse = cutter radius = <b>D/2</b>.</li>
              <li>Vertical side = D/2 − d (the centre is d below the radius from the surface line): <b>δ = D/2 − d</b>.</li>
              <li>Horizontal side = approach <b>A</b>.</li>
              <li>Pythagoras: A² = (D/2)² − (D/2 − d)² = <b>d(D − d)</b>.</li>
            </ol>
            <p class="formula">A = √( d (D − d) )</p>
            <div class="ctl">
              ${sl('D1', 'D', 'Cutter diameter D', 40, 200, 5)}
              ${sl('d1', 'd', 'Depth of cut d', 0.5, 30, 0.5)}
              <p class="ro">D/2 = <b data-ro="R"></b>, D/2 − d = <b data-ro="delta"></b>, A = <b data-ro="A"></b>, angle at centre <b data-ro="ang"></b></p>
            </div>
            <p class="exam">Asked: TF 2023-24 Q.6(d), 2021-22 Q.2(c), 2020-21 Q.3(a).</p>`,
        },
        {
          id: 'slab-d4', chip: 'Case d = D/4', group: 'Approach length', eyebrow: 'Milling · slide 59 (2017-18 Q.6(a))', title: 'Prove A = (√3/4)·D when d = D/4',
          cam: () => camFor('slab', P), plot: true,
          onEnter() { setType('slab'); P.d = P.D / 4; layout(); },
          html: () => `
            <p>Put d = D/4 in A = √(d(D − d)):</p>
            <p class="formula">A = √( (D/4)(3D/4) ) = √(3D²/16) = (√3 / 4) · D ≈ 0.433 D</p>
            <p>Check on the triangle: D/2 − d = D/4 is <b>half</b> the hypotenuse, so the angle at the centre is 60° and A = (D/2) sin 60° = (√3/4) D.</p>
            <div class="ctl">
              ${sl('D2', 'D', 'Cutter diameter D', 40, 200, 5)}
              <div class="presets"><button class="pbtn" type="button" data-act="d4">Set d = D/4</button></div>
              <p class="ro">d = D/4 = <b data-ro="dq"></b>: √(d(D − d)) = <b data-ro="Aq"></b> and (√3/4)·D = <b data-ro="Bq"></b>. Angle now: <b data-ro="ang"></b></p>
            </div>
            <p class="note">Changing the slider D moves d with it only after you press the button again.</p>
            <p class="exam">Asked: TF 2017-18 Q.6(a).</p>`,
        },
        {
          id: 'face-c', chip: 'Face, centred', group: 'Approach length', eyebrow: 'Milling · slides 71–72 (case 1)', title: 'Face milling, cutter centred over the work',
          cam: () => camFor('face-centred', P), plot: true,
          onEnter() { setType('face-centred'); },
          html: () => `
            <p>Viewed from above. The face cutter is centred on the work. The first tooth touches the front edge at the centre line, so the centre is a full radius short of the edge, and the same at the exit:</p>
            <p class="formula">A = O = D / 2</p>
            <div class="ctl">
              ${sl('D3', 'D', 'Cutter diameter D', 40, 200, 5)}
              ${sl('w3', 'w', 'Work width w', 10, 200, 5)}
              <p class="ro">A = O = D/2 = <b data-ro="A"></b>; extra travel A + O = <b data-ro="AO"></b></p>
            </div>
            <ul><li>Valid when the cutter is wider than the work (w ≤ D) and centred on it.</li></ul>
            <p class="exam">Asked: TF 2018-19 Q.7(c) (slab and face).</p>`,
        },
        {
          id: 'face-o', chip: 'Face, offset', group: 'Approach length', eyebrow: 'Milling · slides 71–72 (case 2)', title: 'Face milling, cutter offset to one side',
          cam: () => camFor('face-offset', P), plot: true,
          onEnter() { setType('face-offset'); if (P.w > P.D / 2) P.w = P.D / 2; layout(); },
          html: () => `
            <p>The cutter edge is flush with one side of the work, so the work lies on one side of the centre line. The tooth first touches the front edge at the work corner nearest the centre line, a lateral distance D/2 − w from it. The right triangle now has hypotenuse D/2 and lateral side D/2 − w:</p>
            <p class="formula">A = O = √( (D/2)² − (D/2 − w)² ) = √( w (D − w) )</p>
            <div class="ctl">
              ${sl('w4', 'w', 'Work width w', 5, 150, 1)}
              ${sl('D4', 'D', 'Cutter diameter D', 40, 200, 5)}
              <p class="ro">A = O = <b data-ro="A"></b>; lateral side D/2 − w = <b data-ro="lat"></b></p>
            </div>
            <p class="note"><b>Condition</b>: w ≤ D/2 (work wholly on one side of the centre line). For w ≥ D/2 the centre line lies inside the work and A = O = D/2 again (the two cases meet at w = D/2). This is the usual textbook arrangement (Groover).</p>`,
        },
        {
          id: 'time', chip: 'Machining time', group: 'Time and MRR', eyebrow: 'Milling · slide 73', title: 'Tm = (L + A + O) / fr',
          cam: camNow, plot: true,
          html: () => `
            <p>Spindle speed N = 1000 V / (π D); table feed rate fr = N · z · f<sub>z</sub>; then the time is the travel divided by fr.</p>
            ${typeSeg()}
            <div class="ctl">
              ${sl('V5', 'V', 'Cutting speed V', 5, 120, 1)}
              ${sl('fz5', 'fz', 'Feed per tooth f<sub>z</sub>', 0.02, 0.4, 0.01)}
              ${sl('z5', 'z', 'Teeth z', 1, 24, 1)}
              ${sl('L5', 'L', 'Length of cut L', 50, 300, 5)}
              <p class="ro">N = <b data-ro="N"></b> · fr = <b data-ro="fr"></b></p>
              <p class="ro">Travel = <b data-ro="ltot"></b> → Tm = <b data-ro="tm"></b></p>
              <p class="ro">Clock (animation): <b data-ro="tick"></b></p>
            </div>
            <p class="key"><span class="key-tag">Remember</span>A and O are lost travel: they add <b data-ro="extra"></b> to the time for this cut.</p>`,
        },
        {
          id: 'mrr', chip: 'MRR', group: 'Time and MRR', eyebrow: 'Milling · slide 73', title: 'Material removal rate MRR = w · d · fr',
          cam: camNow, plot: true,
          html: () => `
            <p>Width × depth is the cross-section of the cut; fr is how fast it moves. So</p>
            <p class="formula">MRR = w · d · fr</p>
            <div class="ctl">
              ${sl('w6', 'w', 'Width of cut w', 10, 200, 5)}
              ${sl('d6', 'd', 'Depth of cut d', 0.5, 30, 0.5)}
              ${sl('fz6', 'fz', 'Feed per tooth f<sub>z</sub>', 0.02, 0.4, 0.01)}
              <p class="ro">fr = <b data-ro="fr"></b> · MRR = <b data-ro="mrr"></b></p>
            </div>
            <ul><li>MRR does not contain L, A or O: those change the <b>time</b>, not the rate.</li></ul>`,
        },
        {
          id: 'examples', chip: 'Slide examples', group: 'Worked', eyebrow: 'Milling · slides 69, 74–75', title: 'Check the numbers on the slide problems',
          cam: camNow, plot: true,
          html: () => {
            const q1 = exOf('slab', 100, 2, 100, 150, 20, 0.13, 8);
            const q2 = exOf('face-centred', 150, 6, 115, 250, 60, 0.18, 16);
            const q3 = exOf('slab', 32, 15, 32, 150, 30, 0.15, 8);
            q1.name = 'Q1 slab';
            q2.name = 'Q2 face';
            q3.name = '2023-24';
            return `
            <div class="presets">
              <button class="pbtn" type="button" data-set="type:slab,D:100,d:2,w:100,L:150,V:20,fz:0.13,z:8">Q1: C50, slab Ø100</button>
              <button class="pbtn" type="button" data-set="type:face-centred,D:150,d:6,w:115,L:250,V:60,fz:0.18,z:16">Q2: face mill Ø150</button>
              <button class="pbtn" type="button" data-set="type:slab,D:32,d:15,w:32,L:150,V:30,fz:0.15,z:8">2023-24 Q.6(d)</button>
            </div>
            <div class="table-wrap"><table class="cmp"><thead><tr><th></th><th>A mm</th><th>O mm</th><th>N rpm</th><th>fr mm/min</th><th>Tm min</th></tr></thead><tbody>${fmtRow(q1)}${fmtRow(q2)}${fmtRow(q3)}</tbody></table></div>
            <ul>
              <li><b>Q1</b>: 150 × 100 flat, HSS slab mill Ø100 × 150 wide, 8 teeth, d = 2, V = 20, f<sub>z</sub> = 0.13. A = √(2·98) = 14 mm, L = 150, so Tm = 164 / 66.2 = ${q1.Tm.toFixed(2)} min.</li>
              <li><b>Q2</b>: 115 × 250, d = 6, 16-tooth face mill Ø150, V = 60, f<sub>z</sub> = 0.18. Cutter centred (w &lt; D): A = O = 75, Tm = 400 / 366.7 = ${q2.Tm.toFixed(2)} min.</li>
              <li><b>2023-24 Q.6(d)</b>: 150 long, 15 deep, 8-tooth Ø32 HSS end mill, V = 30, f<sub>z</sub> = 0.15. <mark>Assumption</mark>: treated as peripheral (horizontal) milling with d = 15 &lt; D/2, so A = √(15·17) = ${q3.A.toFixed(2)} mm, O = 0 → Tm = ${q3.Tm.toFixed(2)} min (${(q3.Tm * 60).toFixed(0)} s). MRR taken with w = D = 32.</li>
            </ul>
            <p class="ro">Now loaded: A = <b data-ro="A"></b>, Tm = <b data-ro="tm"></b>, MRR = <b data-ro="mrr"></b></p>
            <p class="note">For slab milling the slide solutions take O = 0 (Tm = (L + A)/fr). If your course adds a clearance overtravel, add it to L + A.</p>`;
          },
        },
        {
          id: 'answer', chip: 'Exam answer', group: 'Exam', eyebrow: 'Model answer', title: 'Derive the approach length for milling',
          cam: camNow, plot: false,
          html: () => `
            <ol class="steps">
              <li><b>Slab milling</b>: at first contact the tooth touches the corner of the work. The right triangle has hypotenuse D/2 (radius), vertical side D/2 − d, horizontal side A.</li>
              <li>A² = (D/2)² − (D/2 − d)² = D·d − d² so <b>A = √(d(D − d))</b>. For d = D/4: A = (√3/4)·D.</li>
              <li><b>Face milling, centred</b>: A = O = D/2.</li>
              <li><b>Face milling, offset</b> (w ≤ D/2): A = O = √(w(D − w)).</li>
              <li>Machining time: Tm = (L + A + O) / fr with fr = N·z·f<sub>z</sub> and N = 1000V/(πD); MRR = w·d·fr.</li>
            </ol>
            <p class="key"><span class="key-tag">Sketch</span>Circle of radius D/2 at first contact with the work corner, the vertical side D/2 − d dashed, A along the surface line.</p>`,
        },
      ],

      onParam,

      update(dt, t, step) {
        const c = calc();
        spin += dt * 3;
        const isHold = HOLD.includes(step);
        if (isHold) {
          prog = 0;
          hold = 0;
        } else if (prog >= 1) {
          hold += dt;
          if (hold > 1.4) {
            prog = 0;
            hold = 0;
          }
        } else {
          prog = Math.min(1, prog + dt / 9);
        }
        cxmm = -c.A + prog * c.Ltot;
        const R = (c.D / 2) * S;
        if (c.slab) {
          slabG.visible = true;
          faceG.visible = false;
          slabG.position.set(cxmm * S, R - c.d * S, 0);
          slabG.rotation.z = -spin;
        } else {
          slabG.visible = false;
          faceG.visible = true;
          faceG.position.set(cxmm * S, -c.d * S + 0.25, 0);
          faceG.rotation.y = spin;
        }
        const xu = cl(cxmm, 0, c.L);
        const dd = Math.min(c.d * S, H - 0.05);
        unm.position.set(xu * S, -H, zc);
        unm.scale.set(Math.max((c.L - xu) * S, 1e-4), H, wz);
        mach.position.set(0, -H, zc);
        mach.scale.set(Math.max(xu * S, 1e-4), H - dd, wz);
        this._tick = prog * c.Tm;
      },

      overlay(d, step) {
        const c = calc();
        const R = (c.D / 2) * S;
        const A = c.A * S;
        const O = c.O * S;
        const L = c.L * S;
        const slab = c.slab;
        const zf = slab ? cw / 2 + 0.03 : 0;
        const y0 = slab ? 0 : 0.02;

        // progress bar with segment dimensions under the work
        const rowY = slab ? -H - 1.0 : 0.02;
        const rowZ = slab ? zf : (c.off ? (c.D / 2) * S : wz / 2) + 1.4;
        const mk = (x, dz = 0, dy = 0) => [x, rowY + dy, rowZ + dz];
        d.dim(mk(-A), mk(0), `A = ${c.A.toFixed(1)}`, [0, 0, 0], 'dm');
        d.dim(mk(0), mk(L), `L = ${c.L.toFixed(0)}`, [0, 0, 0], 'dm');
        if (c.O > 0.01) d.dim(mk(L), mk(L + O), `O = ${c.O.toFixed(1)}`, [0, 0, 0], 'dm');
        const e = L + O;
        const sx = -A + (prog * (A + e));
        const t2 = slab ? 0 : 0.6;
        const dy2 = slab ? -0.55 : 0;
        d.line(mk(-A, t2, dy2), mk(e, t2, dy2), 'ref');
        d.line(mk(-A, t2, dy2), mk(sx, t2, dy2), 'fline');
        d.dot(mk(sx, t2, dy2), 'dot');
        d.label(mk(sx, t2 + (slab ? 0 : 0.7), dy2 - (slab ? 0.5 : 0)), `t = ${(prog * c.Tm).toFixed(2)} min`, 'f');

        if (step === 'slab-derive' || step === 'slab-d4') {
          const cx = -A;
          const cy = R - c.d * S;
          const C = [cx, cy, zf];
          const F = [cx, 0, zf];
          const K = [0, 0, zf];
          const B = [cx, -c.d * S, zf];
          d.arc([cx, cy, zf], [1, 0, 0], [0, 1, 0], R, 0, TAU, 'ref', 64);
          d.path([C, F, K], 'dm');
          d.line(C, K, 'arc');
          d.line(F, K, 'fline');
          d.line(F, B, 'dline', { arrows: true });
          d.dot(K, 'dot');
          const q = 0.22;
          d.path([[cx + q, 0, zf], [cx + q, q, zf], [cx, q, zf]], 'ref');
          const ang = Math.acos(cl((c.D / 2 - c.d) / (c.D / 2), -1, 1));
          d.arc(C, [0, -1, 0], [1, 0, 0], R * 0.35, 0, ang, 'arc');
          d.label([cx + 0.3 * R * Math.sin(ang * 0.5) * 1.3, cy - 0.45 * R * Math.cos(ang * 0.5), zf], `${(ang * 180 / Math.PI).toFixed(1)}°`, 'hl');
          d.label([cx - 0.55, cy * 0.5, zf], `D/2 − d = ${(c.D / 2 - c.d).toFixed(1)}`, 'dimtxt');
          d.label([cx / 2 + 0.2, cy / 2 + 0.55, zf], `D/2 = ${(c.D / 2).toFixed(1)}`, 'hl');
          d.label([cx / 2, 0.45, zf], `A = ${c.A.toFixed(2)}`, 'f');
          d.label([cx + 0.5, -c.d * S - 0.45, zf], `d = ${c.d.toFixed(1)}`, 'd');
        }
        if (step === 'face-c' || step === 'face-o') {
          const zK = c.lat * S;
          const C = [-A, y0, 0];
          const F = [0, y0, 0];
          const K = [0, y0, zK];
          d.arc(C, [1, 0, 0], [0, 0, 1], R, 0, TAU, 'ref', 64);
          d.arc([L + O, y0, 0], [1, 0, 0], [0, 0, 1], R, 0, TAU, 'ref', 64);
          d.line(C, [C[0] + 0.001, y0, 0.001], 'cl');
          d.dot(C, 'dot');
          d.dot([L + O, y0, 0], 'dot');
          d.line([-R - 0.5, y0, 0], [L + O + R + 0.5, y0, 0], 'cl');
          if (step === 'face-c' || c.lat < 1e-6) {
            d.line(C, F, 'arc');
            d.label([-A / 2, y0, -0.65], `A = D/2 = ${c.A.toFixed(1)}`, 'hl');
          } else {
            d.path([C, F, K], 'dm');
            d.line(C, K, 'arc');
            d.line(F, K, 'fline');
            d.label([-A / 2 - 0.2, y0, 0.55 * 1.0 + zK * 0.5 + 0.6], `D/2 = ${(c.D / 2).toFixed(1)}`, 'hl');
            d.label([-0.9, y0, zK / 2], `D/2 − w = ${c.lat.toFixed(1)}`, 'dimtxt');
            d.label([-A / 2, y0, -0.65], `A = ${c.A.toFixed(1)}`, 'f');
          }
          d.dot(K, 'dot');
          d.label([L + O + 0.2, y0, -R - 0.55], 'ghost = clear', 'minor');
        }
      },

      hud() {
        const c = calc();
        const ph = prog <= 0 ? 'First contact' : prog >= 1 ? 'Cutter clear' : cxmm < 0 ? 'Approach: cutter entering' : cxmm <= c.L ? 'Full cut' : 'Overtravel: leaving';
        return {
          status: ph,
          statusCls: cxmm >= 0 && cxmm <= c.L && prog > 0 && prog < 1 ? 'f' : '',
          rows: [
            ['Approach A', `${c.A.toFixed(1)} mm`],
            ['Overtravel O', `${c.O.toFixed(1)} mm`],
            ['Travel', `${c.Ltot.toFixed(1)} mm`],
            ['Time', `${(prog * c.Tm).toFixed(2)} / ${c.Tm.toFixed(2)} min`],
          ],
          verdict: [`Tm = ${c.Tm.toFixed(2)} min, MRR = ${(c.MRR / 1000).toFixed(1)} cm³/min`, 'ok'],
        };
      },

      readouts() {
        const c = calc();
        const D = c.D;
        const dq = D / 4;
        const ang = Math.acos(cl((c.D / 2 - c.d) / (c.D / 2), -1, 1));
        return {
          A: `${c.A.toFixed(2)} mm`,
          O: `${c.O.toFixed(2)} mm`,
          Ls: `${c.L.toFixed(0)} mm`,
          AO: `${(c.A + c.O).toFixed(1)} mm`,
          ltot: `${c.Ltot.toFixed(1)} mm`,
          R: `${(D / 2).toFixed(1)} mm`,
          delta: `${(D / 2 - c.d).toFixed(2)} mm`,
          ang: c.slab ? `${((ang * 180) / Math.PI).toFixed(1)}°` : 'n/a (face milling)',
          dq: `${dq.toFixed(2)} mm`,
          Aq: `${Math.sqrt(dq * (D - dq)).toFixed(3)} mm`,
          Bq: `${((Math.sqrt(3) / 4) * D).toFixed(3)} mm`,
          lat: `${c.lat.toFixed(1)} mm`,
          N: `${c.N.toFixed(1)} rpm`,
          fr: `${c.fr.toFixed(1)} mm/min`,
          tm: fmin(c.Tm),
          tick: `${(this._tick || 0).toFixed(2)} min of ${c.Tm.toFixed(2)}`,
          extra: `${(((c.A + c.O) / c.fr)).toFixed(2)} min (${Math.round(((c.A + c.O) / c.Ltot) * 100)} % of the travel)`,
          mrr: `${c.MRR.toFixed(0)} mm³/min = ${(c.MRR / 1000).toFixed(1)} cm³/min`,
        };
      },
      live: true,

      action(name) {
        if (name === 'd4') {
          P.d = P.D / 4;
          onParam('d');
        }
        rerender();
      },

      format(key, v) {
        if (key === 'D' || key === 'd' || key === 'w' || key === 'L') return `${v.toFixed(key === 'd' ? 1 : 0)} mm`;
        if (key === 'V') return `${v.toFixed(0)} m/min`;
        if (key === 'fz') return `${v.toFixed(2)} mm/tooth`;
        if (key === 'z') return `${Math.round(v)}`;
        if (key === 'type') return String(v);
        return null;
      },

      plot(g, w, h, col, step) {
        const c = calc();
        const ml = 30, mr = 8, mt = 16, mb = 24;
        const pw = w - ml - mr;
        const ph = h - mt - mb;
        const axes = () => {
          g.strokeStyle = col.muted;
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(ml, mt);
          g.lineTo(ml, mt + ph);
          g.lineTo(ml + pw, mt + ph);
          g.stroke();
        };
        if (step === 'slab-derive' || step === 'slab-d4' || step === 'face-o') {
          const slabCurve = step !== 'face-o';
          const xmax = c.D / 2;
          const f = slabCurve ? (x) => Math.sqrt(x * (c.D - x)) : (x) => Math.sqrt(x * (c.D - x));
          const X = (x) => ml + (x / xmax) * pw;
          const Y = (a) => mt + ph - (a / xmax) * ph;
          axes();
          g.setLineDash([3, 3]);
          g.beginPath();
          g.moveTo(ml, Y(xmax));
          g.lineTo(ml + pw, Y(xmax));
          g.stroke();
          g.setLineDash([]);
          g.strokeStyle = col.ink;
          g.lineWidth = 2;
          g.beginPath();
          for (let i = 0; i <= 40; i++) {
            const x = (xmax * i) / 40;
            if (i) g.lineTo(X(x), Y(f(x)));
            else g.moveTo(X(x), Y(f(x)));
          }
          g.stroke();
          const cur = slabCurve ? c.d : Math.min(c.w, xmax);
          g.fillStyle = col.accent;
          g.beginPath();
          g.arc(X(Math.min(cur, xmax)), Y(f(Math.min(cur, xmax))), 4, 0, TAU);
          g.fill();
          g.fillStyle = col.muted;
          g.fillText(`${xmax.toFixed(0)}`, 2, mt + 4);
          g.fillText('A', 12, mt + ph / 2);
          g.fillText(slabCurve ? 'depth d  →  D/2' : 'width w  →  D/2', ml + 6, h - 3);
          return slabCurve ? 'A = √(d(D − d)) against d' : 'A = √(w(D − w)) against w';
        }
        // stacked travel bar
        const tot = c.Ltot;
        const bx = ml;
        const bw = pw;
        const by = mt + 16;
        const seg = (v, color, label, x0) => {
          const ww = (v / tot) * bw;
          g.fillStyle = color;
          g.fillRect(x0, by, Math.max(ww, 0.5), 28);
          if (ww > 24) {
            g.fillStyle = col.surface;
            g.fillText(label, x0 + 3, by + 18);
          }
          return ww;
        };
        let x = bx;
        x += seg(c.A, col.accent, 'A', x);
        x += seg(c.L, col.f, 'L', x);
        seg(c.O, col.accent, 'O', x);
        g.fillStyle = col.ink;
        g.fillText(`travel ${c.Ltot.toFixed(0)} mm`, bx, by - 5);
        g.fillText(`fr = ${c.fr.toFixed(0)} mm/min`, bx, by + 50);
        g.fillText(`Tm = ${c.Tm.toFixed(2)} min`, bx, by + 66);
        g.fillStyle = col.muted;
        g.fillText(`A + O = ${Math.round(((c.A + c.O) / tot) * 100)}% of travel`, bx + 110, by + 66);
        return 'Where the table travel goes';
      },

      dispose() {
        unitBox.dispose();
        toothGeo.dispose();
        for (const m of [mWork, mMach, mFace]) m.dispose();
      },
    };
  },
};
