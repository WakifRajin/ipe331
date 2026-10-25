// Effect lab: plain (straight-tooth) vs helical slab cutter.
// Each tooth is a helix: its angular position at axial distance y is  a(y) = beta_i + theta + y*tan(lambda)/R
// (angles measured from the bottom of the cutter). It is in the work while a(y) mod 2pi lies in [0, phic],
// phic = acos(1 - 2d/D). Engaged tooth length (along the helix) is taken as proportional to the cutting force.
export default {
  id: 'cutter-entry',
  chapter: 'milling',
  title: 'Plain vs helical cutter',
  eyebrow: 'Milling · slide 65',
  sub: 'Straight teeth hit the work along their whole length at once; helical teeth enter gradually. See which part of every tooth is cutting, and what that does to the load.',
  blurb: 'How the helix angle turns a spiky impact load into a smooth one, how many teeth cut at once and where the axial thrust comes from.',
  qs: ['2009-10_6a', '2013-14_6c'],
  params: { helix: 0, z: 8, D: 80, b: 80, d: 5, pair: 0 },
  start: 'plain',

  build({ THREE, scene, P, kit, rerender }) {
    const S = 0.06; // units per mm
    const TAU = Math.PI * 2;
    const NSEG = 48; // segments along each tooth
    const cl = (v, a, b) => Math.max(a, Math.min(b, v));
    const deg = (r) => (r * 180) / Math.PI;

    // ---------- configuration from the parameters ----------
    const C = {};
    function cfg(lam = null) {
      C.D = Math.max(P.D, 10);
      C.R = C.D / 2;
      C.b = Math.max(P.b, 1);
      C.z = Math.max(2, Math.round(P.z));
      C.d = cl(P.d, 0.05, C.D / 2);
      C.lam = ((lam ?? P.helix) * Math.PI) / 180;
      C.tl = Math.tan(C.lam);
      C.cl = Math.cos(C.lam);
      C.phic = Math.acos(cl(1 - (2 * C.d) / C.D, -1, 1));
      C.step = TAU / C.z;
      return C;
    }
    const norm = (a) => {
      const m = a % TAU;
      return m < 0 ? m + TAU : m;
    };

    // engaged tooth length (mm along the helix) and number of teeth touching the work at rotation theta
    let lenCnt = 0;
    function engaged(theta, c) {
      let total = 0;
      let cnt = 0;
      const twist = (c.b * c.tl) / c.R;
      for (let i = 0; i < c.z; i++) {
        const ai = norm(i * c.step + theta);
        let ln = 0;
        if (c.tl < 1e-6) {
          if (ai <= c.phic) ln = c.b;
        } else {
          const kmax = Math.floor((ai + twist) / TAU);
          for (let k = 0; k <= kmax; k++) {
            const y0 = ((TAU * k - ai) * c.R) / c.tl;
            const y1 = ((TAU * k + c.phic - ai) * c.R) / c.tl;
            const lo = Math.max(y0, 0);
            const hi = Math.min(y1, c.b);
            if (hi > lo) ln += hi - lo;
          }
        }
        if (ln > 1e-9) {
          cnt++;
          total += ln / c.cl;
        }
      }
      lenCnt = cnt;
      return total;
    }
    const cache = new Map();
    function stats(lam) {
      const c = cfg(lam);
      const key = `${lam}|${c.z}|${c.D}|${c.b}|${c.d}`;
      if (cache.has(key)) return cache.get(key);
      let mx = -1, mn = 1e12, sum = 0, nmx = 0, nmn = 99;
      const NS = 120;
      for (let s = 0; s < NS; s++) {
        const L = engaged((c.step * s) / NS, c);
        mx = Math.max(mx, L);
        mn = Math.min(mn, L);
        sum += L;
        nmx = Math.max(nmx, lenCnt);
        nmn = Math.min(nmn, lenCnt);
      }
      const mean = sum / NS;
      const r = { max: mx, min: mn, mean, fl: mean > 1e-9 ? ((mx - mn) / mean) * 100 : 0, nmax: nmx, nmin: nmn };
      if (cache.size > 60) cache.clear();
      cache.set(key, r);
      return r;
    }

    // ---------- materials ----------
    const mCut = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, metalness: 0.65, roughness: 0.4 });
    const mBody = new THREE.MeshStandardMaterial({ color: 0x6b7379, metalness: 0.75, roughness: 0.45 });
    const mWork = new THREE.MeshStandardMaterial({ color: 0x9fb4c4, transparent: true, opacity: 0.32, roughness: 0.4, metalness: 0.1, depthWrite: false });
    const mEdge = new THREE.LineBasicMaterial({ color: 0x5d6b78 });

    // ---------- scene ----------
    const cutter = new THREE.Group();
    const teeth = new THREE.Mesh(new THREE.BufferGeometry(), mCut);
    const body = new THREE.Mesh(new THREE.BufferGeometry(), mBody);
    const arbor = new THREE.Mesh(new THREE.BufferGeometry(), kit.M.darkSteel);
    teeth.castShadow = true;
    cutter.add(teeth, body);
    scene.add(cutter, arbor);
    const work = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mWork);
    const workEdges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), mEdge);
    const tableM = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), kit.M.castIron);
    scene.add(work, workEdges, tableM);
    const brgL = kit.box(1.1, 1.4, 0.6, kit.M.paint);
    const brgR = kit.box(1.1, 1.4, 0.6, kit.M.paint);
    scene.add(brgL, brgR);

    let colors = null;
    let state = null;
    let yc = 0;
    const AMBER = [1.0, 0.52, 0.04];
    const STEEL = [0.74, 0.78, 0.82];

    function rebuild() {
      const c = cfg();
      const Rr = c.R * S;
      const bs = c.b * S;
      const th = Math.max(0.1, Rr * 0.1);
      const tw = Math.max(0.07, Rr * 0.07);
      const dl = tw / Rr / 2;
      yc = Rr - c.d * S;
      const nq = c.z * NSEG;
      const pos = new Float32Array(nq * 8 * 3);
      const idx = new Uint32Array(nq * 12);
      colors = new Float32Array(nq * 8 * 3);
      state = new Uint8Array(nq);
      let vp = 0;
      let ip = 0;
      const put = (a, r, y) => {
        pos[vp++] = -r * Math.sin(a);
        pos[vp++] = -r * Math.cos(a);
        pos[vp++] = y;
      };
      for (let i = 0; i < c.z; i++) {
        const base = i * c.step;
        for (let j = 0; j < NSEG; j++) {
          const y0 = (j / NSEG) * c.b;
          const y1 = ((j + 1) / NSEG) * c.b;
          const a0 = base + (y0 * c.tl) / c.R;
          const a1 = base + (y1 * c.tl) / c.R;
          const z0 = (y0 - c.b / 2) * S;
          const z1 = (y1 - c.b / 2) * S;
          const v0 = vp / 3;
          // top quad
          put(a0 - dl, Rr, z0); put(a0 + dl, Rr, z0); put(a1 - dl, Rr, z1); put(a1 + dl, Rr, z1);
          // leading face quad
          put(a0 + dl, Rr, z0); put(a0 + dl, Rr - th, z0); put(a1 + dl, Rr, z1); put(a1 + dl, Rr - th, z1);
          for (const q of [0, 4]) {
            idx[ip++] = v0 + q; idx[ip++] = v0 + q + 1; idx[ip++] = v0 + q + 2;
            idx[ip++] = v0 + q + 2; idx[ip++] = v0 + q + 1; idx[ip++] = v0 + q + 3;
          }
        }
      }
      for (let k = 0; k < colors.length; k += 3) {
        colors[k] = STEEL[0]; colors[k + 1] = STEEL[1]; colors[k + 2] = STEEL[2];
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      g.setIndex(new THREE.BufferAttribute(idx, 1));
      g.computeVertexNormals();
      teeth.geometry.dispose();
      teeth.geometry = g;
      body.geometry.dispose();
      body.geometry = new THREE.CylinderGeometry(Rr - th * 0.95, Rr - th * 0.95, bs, 40).rotateX(Math.PI / 2);
      arbor.geometry.dispose();
      arbor.geometry = new THREE.CylinderGeometry(0.3, 0.3, bs + 2.6, 16).rotateX(Math.PI / 2);
      cutter.position.set(0, yc, 0);
      arbor.position.set(0, yc, 0);
      brgL.position.set(0, yc, -bs / 2 - 1.1);
      brgR.position.set(0, yc, bs / 2 + 1.1);
      const wz = bs + 1.0;
      work.scale.set(14, 1.3, wz);
      work.position.set(0, -0.65, 0);
      workEdges.scale.copy(work.scale);
      workEdges.position.copy(work.position);
      tableM.scale.set(15, 0.5, wz + 0.6);
      tableM.position.set(0, -1.55, 0);
      lastTheta = -1;
    }

    let theta = 0;
    let lastTheta = -1;
    const cur = { len: 0, n: 0 };
    function paint(c) {
      // recolour segments that are in the work
      let dirty = false;
      for (let i = 0; i < c.z; i++) {
        const ai = i * c.step + theta;
        for (let j = 0; j < NSEG; j++) {
          const yc2 = ((j + 0.5) / NSEG) * c.b;
          const a = norm(ai + (yc2 * c.tl) / c.R);
          const on = a <= c.phic ? 1 : 0;
          const q = i * NSEG + j;
          if (state[q] !== on) {
            state[q] = on;
            dirty = true;
            const col = on ? AMBER : STEEL;
            let o = q * 24;
            for (let v = 0; v < 8; v++) {
              colors[o++] = col[0]; colors[o++] = col[1]; colors[o++] = col[2];
            }
          }
        }
      }
      if (dirty) teeth.geometry.attributes.color.needsUpdate = true;
    }

    rebuild();

    const camIso = { position: [-8.5, 4.2, 12.5], target: [0, 0.2, 0] };
    const camClose = { position: [-5.5, 2.4, 9.5], target: [0, 0.2, 0] };
    const camThrust = { position: [-3, 5.5, 13], target: [0, 1.5, 0] };

    const sl = (id, key, label, min, max, step) => `
      <div class="ctl-row"><label for="lab-${id}">${label}</label><output class="val" data-out="${key}"></output></div>
      <input id="lab-${id}" type="range" min="${min}" max="${max}" step="${step}" data-key="${key}">`;
    const helixPresets = `<div class="presets"><button class="pbtn" type="button" data-set="helix:0">Plain 0°</button><button class="pbtn" type="button" data-set="helix:15">15°</button><button class="pbtn" type="button" data-set="helix:30">30°</button><button class="pbtn" type="button" data-set="helix:45">45°</button></div>`;

    const verdict = () => {
      const f = stats(P.helix).fl;
      if (f < 15) return ['Smooth, near-constant load', 'ok'];
      if (f < 60) return ['Some fluctuation in the load', 'warn'];
      return ['Spiky impact load: vibration, chatter', 'bad'];
    };

    return {
      legend: [['#e68a0a', 'Tooth length in the cut'], ['#bcc7d0', 'Tooth length not cutting']],
      steps: [
        {
          id: 'plain', chip: 'Plain cutter', group: 'Cutters', eyebrow: 'Milling · slide 65', title: 'Plain cutter: the whole tooth strikes at once',
          cam: camIso,
          onEnter: () => { P.helix = 0; lastTheta = -1; rebuild(); },
          html: () => `
            <p>The <mark>plain milling cutter</mark> has straight teeth, parallel to the axis. A tooth is either completely out of the work or, in an instant, <b>all of it enters the work along the whole width</b>. Amber shows the part of each tooth that is cutting.</p>
            <div class="ctl">
              ${sl('z1', 'z', 'Number of teeth z', 3, 16, 1)}
              ${sl('d1', 'd', 'Depth of cut d', 1, 12, 0.5)}
              <p class="ro">Tooth length cutting now: <b data-ro="Lnow"></b> of <b data-ro="Lfull"></b> · load fluctuation <b data-ro="fl"></b></p>
            </div>
            <ul>
              <li>Strikes the work along the entire length of the tooth at once: <mark>intermittent impact</mark>.</li>
              <li>More <b>vibration</b>; needs <b>more power</b> in heavy cuts.</li>
              <li>Suits wide, rough or light-duty flat surfaces; leaves a slightly <b>rougher finish</b> because of the impact.</li>
            </ul>
            <p class="key"><span class="key-tag">Remember</span>Plain cutter = straight teeth = full-width impact.</p>`,
        },
        {
          id: 'helical', chip: 'Helical cutter', group: 'Cutters', eyebrow: 'Milling · slide 65', title: 'Helical cutter: progressive entry',
          cam: camIso,
          onEnter: () => { if (P.helix < 1) P.helix = 30; lastTheta = -1; rebuild(); },
          html: () => `
            <p>The teeth wind round the cutter like a thread at the <b>helix angle λ</b> to the axis. A tooth first touches the work at <b>one end</b> and the contact line then sweeps along the tooth: <mark>gradual entry</mark>.</p>
            <div class="ctl">
              ${sl('h2', 'helix', 'Helix angle λ', 0, 45, 1)}
              ${helixPresets}
              <p class="ro">Tooth length cutting now: <b data-ro="Lnow"></b> · load fluctuation <b data-ro="fl"></b> · teeth touching: <b data-ro="nnow"></b></p>
            </div>
            <div class="duo">
              <div data-band="plain"><h3>Plain</h3><p>Full-width impact, vibration, noisy, rough finish.</p></div>
              <div data-band="helical"><h3>Helical</h3><p>Smooth, quiet, continuous; less shock, less power, better finish. Good for intermittent cuts (holes, slots in the work) and tough materials where chatter must be avoided.</p></div>
            </div>`,
        },
        {
          id: 'force', chip: 'Load vs rotation', group: 'The load', eyebrow: 'Milling · slide 65', title: 'The cutting load while the cutter turns',
          cam: camClose, plot: true,
          html: () => `
            <p>The cutting force is roughly proportional to the <mark>total length of tooth edge in the work</mark>. The plot shows it over two tooth pitches (dashed: the plain cutter for comparison).</p>
            <div class="ctl">
              ${sl('h3', 'helix', 'Helix angle λ', 0, 45, 1)}
              ${sl('z3', 'z', 'Number of teeth z', 3, 16, 1)}
              ${helixPresets}
              <p class="ro">Peak <b data-ro="Lmax"></b>, minimum <b data-ro="Lmin"></b>, mean <b data-ro="Lmean"></b> → fluctuation (max − min) / mean = <b data-ro="fl"></b></p>
            </div>
            <ul>
              <li><b>Straight teeth</b>: the load jumps from zero to full as each tooth strikes: a <mark>spiky</mark> force, shocks and vibration.</li>
              <li><b>Helical teeth</b>: one tooth is entering while another is leaving: the total is smooth and nearly constant.</li>
            </ul>
            <p class="note">Plot shows tooth-length only; the real force also depends on chip thickness, which varies within the arc.</p>`,
        },
        {
          id: 'teeth', chip: 'Teeth in contact', group: 'The load', eyebrow: 'Milling · slide 65', title: 'How many teeth cut at once',
          cam: camClose, plot: true,
          html: () => `
            <p>The engagement angle φc (cos φc = 1 − 2d/D) sets how many teeth are in the work together: on average z·φc/2π.</p>
            <div class="ctl">
              ${sl('z4', 'z', 'Number of teeth z', 3, 16, 1)}
              ${sl('d4', 'd', 'Depth of cut d', 1, 12, 0.5)}
              ${sl('D4', 'D', 'Cutter diameter D', 40, 120, 5)}
              <p class="ro">φc = <b data-ro="phic"></b> · mean teeth in the cut = <b data-ro="navg"></b> · touching at a time: <b data-ro="nrange"></b></p>
            </div>
            <ul>
              <li>If fewer than one tooth is in the work on average (shallow cut, few teeth) a <b>straight-tooth cutter has gaps with no cutting</b> and the load drops to zero between teeth.</li>
              <li>A helical tooth stays in contact over a longer angle (its own helix spreads the entry), so <b>more teeth share the load</b>.</li>
            </ul>`,
        },
        {
          id: 'width', chip: 'Width and helix', group: 'The load', eyebrow: 'Milling · slide 65', title: 'Choosing the helix so the load is flat',
          cam: camClose, plot: true,
          html: () => `
            <p>Across the cutter width b the tooth advances round the cutter by ψ = b·tan λ / R. If ψ is <mark>a whole number of tooth pitches</mark> (2π/z), the length in the cut is exactly constant.</p>
            <div class="ctl">
              ${sl('b5', 'b', 'Cutter width b', 20, 150, 5)}
              ${sl('h5', 'helix', 'Helix angle λ', 0, 45, 1)}
              <div class="presets"><button class="pbtn" type="button" data-act="ideal">Set smoothest λ (1 pitch)</button></div>
              <p class="ro">ψ = <b data-ro="psi"></b> · tooth pitch = <b data-ro="pitch"></b> · ψ / pitch = <b data-ro="ratio"></b> → fluctuation <b data-ro="fl"></b></p>
              <p class="ro">Helix for exactly one pitch across the width: <b data-ro="ideal"></b></p>
            </div>
            <ul>
              <li>A wider cutter needs only a small helix to overlap the entries.</li>
              <li>Too small a helix (ratio below 1) leaves spikes; every whole ratio is smooth.</li>
            </ul>`,
        },
        {
          id: 'thrust', chip: 'Axial thrust', group: 'Side effect', eyebrow: 'Milling · slide 64–65', title: 'The helix pushes the cutter sideways',
          cam: camThrust,
          html: () => `
            <p>On a helical edge the cutting force is not perpendicular to the axis, so it has an <mark>axial component</mark>: F<sub>axial</sub> = F<sub>tangential</sub> · tan λ.</p>
            <div class="ctl">
              ${sl('h6', 'helix', 'Helix angle λ', 0, 45, 1)}
              <div class="seg"><button type="button" data-set="pair:0">Single cutter</button><button type="button" data-set="pair:1">Left + right hand pair</button></div>
              <p class="ro">F<sub>axial</sub> / F<sub>tangential</sub> = tan λ = <b data-ro="fa"></b> · net thrust: <b data-ro="net"></b></p>
            </div>
            <ul>
              <li>The hand of the helix (<b>right-hand</b> or <b>left-hand</b> cutter, slide 64) decides which way the thrust acts. It is chosen so that the thrust presses the cutter against the arbor shoulder or spindle.</li>
              <li>Wide work is cut by a <mark>pair of cutters of opposite hand</mark> (or one cutter with a double helix): the two thrusts cancel.</li>
              <li>The arbor nut is threaded so that the cutting drag tightens it rather than loosens it (left-hand thread for a clockwise-rotating arbor).</li>
            </ul>`,
        },
        {
          id: 'answer', chip: 'Exam answer', group: 'Exam', eyebrow: 'Model answer', title: 'Differentiate helical and plain milling cutters',
          cam: camIso, plot: false,
          html: () => `
            <div class="table-wrap"><table class="cmp">
              <thead><tr><th>Point</th><th>Plain milling cutter</th><th>Helical milling cutter</th></tr></thead>
              <tbody>
                <tr><td>Teeth</td><td>Straight, parallel to the axis</td><td>Wrapped round the body as a helix (like a twist drill)</td></tr>
                <tr><td>Entry</td><td>Whole tooth length strikes at once</td><td>Gradual, progressive entry</td></tr>
                <tr><td>Load</td><td>Intermittent impact, spiky force</td><td>Nearly constant, smooth cut</td></tr>
                <tr><td>Vibration / noise</td><td>More vibration</td><td>Quiet, less shock, less chatter</td></tr>
                <tr><td>Power</td><td>More power in heavy cuts</td><td>Less power</td></tr>
                <tr><td>Finish</td><td>Slightly rougher</td><td>Much smoother</td></tr>
                <tr><td>Axial thrust</td><td>None</td><td>Present (F tan λ); opposite-hand pairs cancel it</td></tr>
                <tr><td>Best for</td><td>Wide, rough or light flat surfaces</td><td>Uneven or interrupted surfaces (holes), tough materials, finishing</td></tr>
              </tbody></table></div>
            <p class="exam">Asked: TF 2009-10 Q.6(a) (slide 65); 2013-14 Q.6(c) (slide 64).</p>
            <p class="key"><span class="key-tag">Sketch</span>Two cutters side by side: straight teeth and spiral teeth, with the contact line on one tooth of each and the load-vs-angle sketch (spikes vs flat).</p>`,
        },
      ],

      onParam(key) {
        if (key === 'D' || key === 'd') P.d = Math.min(P.d, P.D / 2);
        if (key !== 'pair') rebuild();
        lastTheta = -1;
      },

      update(dt) {
        theta += dt * 0.6;
        const c = cfg();
        cutter.rotation.z = -theta;
        if (theta !== lastTheta) {
          paint(c);
          cur.len = engaged(theta, c);
          cur.n = lenCnt;
          lastTheta = theta;
        }
      },

      overlay(d, step) {
        const c = cfg();
        const Rr = c.R * S;
        const bs = c.b * S;
        const zf = bs / 2 + 0.03;
        const ctr = [0, yc, zf];
        d.dim([-Rr, yc, zf], [Rr, yc, zf], `D = ${c.D.toFixed(0)}`, [0, Rr + 0.5, 0]);
        d.dim([Rr + 0.7, yc, -bs / 2], [Rr + 0.7, yc, bs / 2], `b = ${c.b.toFixed(0)} mm`, [0, 0, 0]);
        // depth of cut and engagement arc
        const x0 = -Rr - 1.4;
        d.line([x0 - 0.4, 0, zf], [-Math.sqrt(Math.max(Rr * Rr - (Rr - c.d * S) ** 2, 0)), 0, zf], 'ref');
        d.line([x0, 0, zf], [x0, -c.d * S, zf], 'dline', { arrows: true });
        d.label([x0 - 0.1, -c.d * S - 0.4, zf], `d = ${c.d.toFixed(1)}`, 'd');
        d.arc(ctr, [0, -1, 0], [-1, 0, 0], Rr * 1.1, 0, c.phic, 'arc');
        d.label([-Rr * 1.1 * Math.sin(c.phic * 0.5) - 0.7, yc - Rr * 1.1 * Math.cos(c.phic * 0.5) - 0.1, zf], `φc = ${deg(c.phic).toFixed(0)}°`, 'hl');
        // helix angle schematic (axis direction vs tooth direction), drawn beside the cutter
        if (step !== 'answer') {
          const X = Rr + 2.3;
          const Y = yc + Rr * 0.9;
          const zA = -bs / 2;
          const lam = c.lam;
          const len = bs;
          d.line([X, Y, zA], [X, Y, zA + len], 'cl');
          d.line([X, Y, zA], [X, Y + Math.sin(lam) * len, zA + Math.cos(lam) * len], 'arc');
          d.arc([X, Y, zA], [0, 0, 1], [0, 1, 0], len * 0.35, 0, lam, 'hl');
          d.label([X, Y + 0.45, zA + len * 0.42], `λ = ${P.helix.toFixed(0)}°`, 'hl');
          d.label([X, Y - 0.35, zA + len * 0.5], 'axis', 'minor');
        }
        if (step === 'thrust') {
          const t = Math.tan(c.lam);
          const Lz = 0.6 + 2.2 * Math.min(t, 1.2);
          if (P.pair < 0.5) {
            d.path([[0, yc + Rr + 0.6, 0], [0, yc + Rr + 0.6, Lz]], 'arc', { arrowEnd: true });
            d.label([0, yc + Rr + 1.1, Lz / 2], `F axial = F·tan λ (${t.toFixed(2)} F)`, 'hl');
          } else {
            d.path([[0, yc + Rr + 0.6, -0.15], [0, yc + Rr + 0.6, -0.15 + Lz * 0.8]], 'arc', { arrowEnd: true });
            d.path([[0, yc + Rr + 0.6, 0.15], [0, yc + Rr + 0.6, 0.15 - Lz * 0.8]], 'arc', { arrowEnd: true });
            d.label([0, yc + Rr + 1.1, 0], 'two thrusts cancel: net 0', 'hl');
          }
        }
      },

      hud() {
        const s = stats(P.helix);
        const c = cfg();
        return {
          status: cur.n ? `${cur.n} tooth${cur.n > 1 ? 'es' : ''} in the work` : 'No tooth cutting',
          statusCls: cur.n ? 'v' : '',
          rows: [
            ['Helix λ', `${P.helix.toFixed(0)}°`],
            ['Tooth length cutting', `${cur.len.toFixed(0)} mm`],
            ['Load fluctuation', `${s.fl.toFixed(0)} %`],
            ['Teeth touching', `${s.nmin}–${s.nmax}`],
          ],
          verdict: verdict(),
        };
      },

      readouts() {
        const s = stats(P.helix);
        const c = cfg();
        const psi = (c.b * c.tl) / c.R;
        const idealLam = deg(Math.atan((c.step * c.R) / c.b));
        return {
          Lnow: `${cur.len.toFixed(0)} mm`,
          Lfull: `${c.b.toFixed(0)} mm`,
          nnow: String(cur.n),
          fl: `${s.fl.toFixed(0)} %`,
          Lmax: `${s.max.toFixed(0)} mm`,
          Lmin: `${s.min.toFixed(0)} mm`,
          Lmean: `${s.mean.toFixed(0)} mm`,
          phic: `${deg(c.phic).toFixed(1)}°`,
          navg: ((c.z * c.phic) / TAU).toFixed(2),
          nrange: `${s.nmin} to ${s.nmax}`,
          psi: `${deg(psi).toFixed(1)}°`,
          pitch: `${deg(c.step).toFixed(1)}°`,
          ratio: (psi / c.step).toFixed(2),
          ideal: idealLam <= 45 ? `${idealLam.toFixed(1)}°` : `${idealLam.toFixed(1)}° (beyond 45°: use a wider cutter or fewer teeth)`,
          fa: c.tl.toFixed(2),
          net: P.pair >= 0.5 ? '0 (opposite hands cancel)' : `${c.tl.toFixed(2)} F along the axis`,
          band: P.helix < 1 ? 'plain' : 'helical',
        };
      },
      live: true,

      action(name) {
        if (name === 'ideal') {
          const c = cfg();
          P.helix = Math.min(45, Math.round(deg(Math.atan((c.step * c.R) / c.b))));
          rebuild();
          rerender();
        }
      },

      format(key, v) {
        if (key === 'helix') return `${v.toFixed(0)}°`;
        if (key === 'D' || key === 'b') return `${v.toFixed(0)} mm`;
        if (key === 'd') return `${v.toFixed(1)} mm`;
        if (key === 'z') return String(Math.round(v));
        return null;
      },

      plot(g, w, h, col, step) {
        const c = cfg();
        const ml = 30, mr = 8, mt = 16, mb = 22;
        const pw = w - ml - mr;
        const ph = h - mt - mb;
        const NP = 2;
        const NS = 96;
        const sPlain = stats(0);
        const sCur = stats(P.helix);
        cfg();
        const ymax = Math.max(sPlain.max, sCur.max, 1) * 1.1;
        const X = (i) => ml + (i / NS) * pw;
        const Y = (v) => mt + ph - (v / ymax) * ph;
        const trace = (lam, color, dash, lw) => {
          const cc = cfg(lam);
          g.strokeStyle = color;
          g.lineWidth = lw;
          g.setLineDash(dash);
          g.beginPath();
          for (let i = 0; i <= NS; i++) {
            const v = engaged((cc.step * NP * i) / NS, cc);
            if (i) g.lineTo(X(i), Y(v));
            else g.moveTo(X(i), Y(v));
          }
          g.stroke();
          g.setLineDash([]);
        };
        g.strokeStyle = col.muted;
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(ml, mt);
        g.lineTo(ml, mt + ph);
        g.lineTo(ml + pw, mt + ph);
        g.stroke();
        if (P.helix > 0.5) trace(0, col.muted, [3, 3], 1.2);
        trace(P.helix, P.helix > 0.5 ? col.f : col.v, [], 2);
        cfg();
        // mean line
        g.strokeStyle = col.d;
        g.setLineDash([2, 3]);
        g.beginPath();
        g.moveTo(ml, Y(sCur.mean));
        g.lineTo(ml + pw, Y(sCur.mean));
        g.stroke();
        g.setLineDash([]);
        g.fillStyle = col.muted;
        g.fillText(`${ymax.toFixed(0)}`, 0, mt + 4);
        g.fillText('0', ml - 8, mt + ph + 10);
        g.fillText(`rotation: ${NP} tooth pitches = ${deg(c.step * NP).toFixed(0)}°`, ml, h - 3);
        g.fillStyle = col.ink;
        g.fillText(`fluct. ${sCur.fl.toFixed(0)}%`, ml + pw - 66, mt - 4);
        return 'Tooth length in the cut (∝ force) vs rotation';
      },

      dispose() {
        for (const m of [teeth, body, arbor, work, tableM]) m.geometry.dispose();
        workEdges.geometry.dispose();
        for (const m of [mCut, mBody, mWork, mEdge]) m.dispose();
        cache.clear();
      },
    };
  },
};
