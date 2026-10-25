// Effect lab: feed per stroke in shaping. The surface is built stroke by stroke so the scallops show how f and r set roughness.
// Units are millimetres of the real cut; ridge heights are drawn exaggerated (P.exag).
export default {
  id: 'shaper-feed',
  chapter: 'shaping',
  title: 'Feed per stroke in shaping',
  eyebrow: 'Shaping · slides 84–86',
  sub: 'The ram cuts on the forward stroke, the work feeds sideways on the return. Change the feed and the nose radius and watch the ridges they leave.',
  blurb: 'How feed per stroke and nose radius set the ridge height, the surface roughness and the number of strokes.',
  qs: ['2023-24_5a', '2021-22_2a', '2016-17_6a'],
  params: { f: 1.0, r: 1.5, exag: 5, speed: 2, W: 20, Vc: 12 },

  build({ THREE, scene, P, kit }) {
    const L = 14, H = 6, D = 1.5;
    const mMach = new THREE.MeshStandardMaterial({ color: 0xcfd8e0, roughness: 0.3, metalness: 0.5, flatShading: true });
    const mStock = new THREE.MeshStandardMaterial({ color: 0x77828d, roughness: 0.8, metalness: 0.2, flatShading: true });
    const mTool = kit.M.carbide;

    const floor = new THREE.GridHelper(120, 60, 0x7d8791, 0x9aa4ad);
    floor.position.y = -11;
    floor.material.transparent = true;
    floor.material.opacity = 0.3;
    scene.add(floor);

    // Workpiece group slides in x to give the feed.
    const wp = new THREE.Group();
    scene.add(wp);
    const table = new THREE.Mesh(new THREE.BoxGeometry(P.W + 34, 2.2, L + 8), kit.M.castIron);
    table.position.set(P.W / 2, -H - 1.1, 0);
    table.receiveShadow = true;
    const bodyA = new THREE.Mesh(new THREE.BufferGeometry(), mMach);
    const strip = new THREE.Mesh(new THREE.BufferGeometry(), mMach);
    const unm = new THREE.Mesh(new THREE.BufferGeometry(), mStock);
    const bodyB = new THREE.Mesh(new THREE.BufferGeometry(), mStock);
    wp.add(table, bodyA, strip, unm, bodyB);

    // Ram + tool rig moves along z and lifts on the return stroke.
    const rig = new THREE.Group();
    scene.add(rig);
    const toolG = new THREE.Group();
    const ram = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 10), kit.M.paint);
    const clapper = new THREE.Mesh(new THREE.BoxGeometry(3.4, 4, 3), kit.M.paintDark);
    rig.add(toolG, ram, clapper);
    const col = new THREE.Mesh(new THREE.BoxGeometry(9, 20, 6), kit.M.paintDark);
    col.position.set(0, 2, -L / 2 - 17);
    scene.add(col);

    function buildTool() {
      for (const c of toolG.children) c.geometry.dispose();
      toolG.clear();
      const shank = new THREE.Mesh(new THREE.CylinderGeometry(P.r, P.r, 7, 28), mTool);
      shank.position.y = 3.5;
      const nose = new THREE.Mesh(new THREE.SphereGeometry(P.r, 28, 18), mTool);
      toolG.add(shank, nose);
      toolG.position.y = -D + P.r;
      ram.position.set(0, -D + P.r + 7 + 1.5, -5);
      clapper.position.set(0, -D + P.r + 5.6, 0);
    }

    // Scallop left by a round nose of radius r between two passes f apart.
    const hh = (u) => {
      const dx = u - P.f / 2;
      return P.r - Math.sqrt(Math.max(P.r * P.r - dx * dx, 0));
    };
    const ridge = () => hh(0); // true peak-to-valley height, mm
    function shapeFor(n0, n1) {
      const S = 14;
      const s = new THREE.Shape();
      s.moveTo(n0 * P.f, -H);
      s.lineTo(n1 * P.f, -H);
      for (let i = n1 - 1; i >= n0; i--) {
        for (let k = S; k >= 0; k--) {
          if (k === S && i < n1 - 1) continue;
          const u = (P.f * k) / S;
          s.lineTo(i * P.f + u, -D + P.exag * hh(u));
        }
      }
      s.lineTo(n0 * P.f, -H);
      return s;
    }
    const ext = (shape, depth) => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, steps: 1 });

    let strokes = 0, xcut = 0, finished = false;
    function rebuild() {
      for (const m of [bodyA, strip, unm, bodyB]) m.geometry.dispose();
      const n = Math.round(xcut / P.f);
      bodyA.visible = n > 0;
      bodyA.geometry = n > 0 ? ext(shapeFor(0, n), L).translate(0, 0, -L / 2) : new THREE.BufferGeometry();
      strip.visible = unm.visible = !finished;
      if (!finished) {
        strip.geometry = ext(shapeFor(n, n + 1), 1);
        unm.geometry = new THREE.BoxGeometry(P.f, H, 1).translate(n * P.f + P.f / 2, -H / 2, 0.5);
      } else {
        strip.geometry = new THREE.BufferGeometry();
        unm.geometry = new THREE.BufferGeometry();
      }
      const x0 = finished ? n * P.f : (n + 1) * P.f;
      const w = P.W - x0;
      bodyB.visible = w > 0.001;
      bodyB.geometry = w > 0.001 ? new THREE.BoxGeometry(w, H, L).translate(x0 + w / 2, -H / 2, 0) : new THREE.BufferGeometry();
    }

    const zStart = L / 2 + 3, zEnd = -L / 2 - 3, Tf = 2.4, Tr = 1.0;
    let state = 'forward', t = 0, holdFinished = false, toolz = zStart, lift = 0, gx0 = 0, gx1 = 0;
    const ease = (s) => s * s * (3 - 2 * s);
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    function resetRun() {
      strokes = 0; xcut = 0; finished = false; state = 'forward'; t = 0; holdFinished = false;
      rebuild();
      wp.position.x = -P.f / 2;
      toolz = zStart; lift = 0;
    }
    function finishNow() {
      strokes = Math.floor(P.W / P.f + 1e-6); xcut = strokes * P.f; finished = true; state = 'hold'; t = 0; holdFinished = true;
      rebuild();
      wp.position.x = -P.W / 2;
      toolz = zStart; lift = 0.9;
    }
    const clampFeed = () => (P.f = Math.min(P.f, 1.96 * P.r));

    buildTool();
    resetRun();

    const verdict = () => {
      const e = ridge();
      return e < 0.025 ? ['Smooth surface', 'ok'] : e < 0.1 ? ['Medium finish', 'warn'] : ['Rough surface', 'bad'];
    };
    const nStrokes = () => Math.ceil(P.W / P.f);
    const L_mm = 250; // job length used for the time estimate (slide 104 example)
    const strokeTime = () => {
      // forward stroke at Vc (m/min) over L + 25 mm clearance; return is 140/220 of it (crank shaper)
      const tf = ((L_mm + 25) / 1000 / P.Vc) * 60;
      return tf * (1 + 140 / 220);
    };
    const W_mm = 120;

    const cam = {
      iso: { position: [27, 20, 33], target: [0, -3, -2] },
      front: { position: [0, 2, 34], target: [0, -2, 0] },
      close: { position: [-4, 2.5, 13], target: [-2, -1.5, 0] },
      top: { position: [0.01, 52, 0.01], target: [0, -2, 0] },
    };

    return {
      legend: [['var(--v)', 'Cutting stroke (ram)'], ['var(--f)', 'Feed (work moves)'], ['var(--d)', 'Depth of cut']],
      steps: [
        {
          id: 'setup', chip: 'Set-up', group: 'Motion', eyebrow: 'Shaping · slide 85', title: 'Forward cut, idle return',
          cam: cam.iso,
          html: () => `
            <p>The job is clamped on the table. The tool, held in the clapper box on the <mark>reciprocating ram</mark>, cuts only on the <b>forward stroke</b>. On the <b>return stroke</b> there is no cutting: the clapper lets the tool lift and the table moves the work sideways by the <mark>feed per stroke f</mark>.</p>
            <ul>
              <li><span class="tag-v">V</span> red: cutting motion, along the ram.</li>
              <li><span class="tag-f">f</span> blue: feed, at right angles to the cut, applied once per stroke.</li>
              <li><span class="tag-d">d</span> green: depth of cut, set with the tool-head down-feed.</li>
            </ul>
            <p class="key"><span class="key-tag">Remember</span>Forward + return stroke = one cycle. Feed happens on the idle return.</p>` ,
        },
        {
          id: 'speed', chip: 'Cutting speed', group: 'Motion', eyebrow: 'Shaping · slide 84', title: 'Cutting speed changes along the stroke',
          cam: cam.iso,
          html: () => `
            <p>In a crank shaper the ram starts from rest, speeds up to a maximum mid-stroke and slows to zero at the end. So the <mark>cutting speed is not constant</mark> along the cut.</p>
            <p>For calculations the cutting speed V is taken as <mark>twice the average forward ram velocity</mark>.</p>
            <p class="ro">Ram velocity now: <b data-ro="vel"></b></p>
            <p class="key"><span class="key-tag">Remember</span>Planing: V constant along the cut. Shaping: V varies, take V = 2 × average forward velocity.</p>`,
        },
        {
          id: 'feed', chip: 'Feed per stroke', group: 'Effect', eyebrow: 'Shaping · slide 86', title: 'Feed per stroke sets the ridges',
          cam: cam.front,
          html: () => `
            <p>Each stroke leaves a groove the shape of the tool nose. The next stroke is f further along, so between grooves a <mark>ridge (scallop)</mark> is left standing.</p>
            <div class="ctl">
              <div class="ctl-row"><label for="lab-f">Feed per stroke f</label><output class="val" data-out="f"></output></div>
              <input id="lab-f" type="range" min="0.2" max="2.9" step="0.02" data-key="f">
              <div class="presets"><button class="pbtn" type="button" data-set="f:0.3">Fine 0.3 mm</button><button class="pbtn" type="button" data-set="f:1">Medium 1 mm</button><button class="pbtn" type="button" data-set="f:1.9">Coarse 1.9 mm</button></div>
              <p class="ro">Ridge height h: <b data-ro="h"></b> · <span data-ro="verdict"></span></p>
            </div>
            <ul>
              <li><b>Larger feed</b>: grooves further apart, taller ridges, <b>rougher surface</b>.</li>
              <li><b>Smaller feed</b>: ridges overlap more and become shallow, <b>smoother surface</b>.</li>
            </ul>
            <p class="exam">Asked: TF 2023-24 Q.5(a), 2021-22 Q.2(a), 2016-17 Q.6(a).</p>`,
          onEnter: () => finishNow(),
        },
        {
          id: 'nose', chip: 'Nose radius', group: 'Effect', eyebrow: 'Shaping · slide 86', title: 'A bigger nose radius flattens the ridges',
          cam: cam.close,
          html: () => `
            <p>For the same feed, a tool with a larger nose radius r leaves wider, shallower grooves, so the ridges are lower.</p>
            <div class="ctl">
              <div class="ctl-row"><label for="lab-r">Nose radius r</label><output class="val" data-out="r"></output></div>
              <input id="lab-r" type="range" min="1" max="4" step="0.1" data-key="r">
              <div class="ctl-row"><label for="lab-f2">Feed per stroke f</label><output class="val" data-out="f"></output></div>
              <input id="lab-f2" type="range" min="0.2" max="2.9" step="0.02" data-key="f">
              <p class="ro">Ridge height h: <b data-ro="h"></b></p>
            </div>
            <p class="note">The feed cannot be larger than about 2r, or the grooves would not meet.</p>`,
          onEnter: () => finishNow(),
        },
        {
          id: 'formula', chip: 'h = f²/8r', group: 'Effect', eyebrow: 'Surface roughness', title: 'Peak-to-valley height',
          cam: cam.front,
          html: () => `
            <p>From the geometry of a circle of radius r cut by a chord of length f, the ridge (peak-to-valley) height is</p>
            <p class="formula">h ≈ f² / (8 r)</p>
            <ul>
              <li>h grows with the <b>square</b> of the feed: double f, four times the roughness.</li>
              <li>h falls in proportion to r.</li>
            </ul>
            <div class="ctl">
              <div class="ctl-row"><label for="lab-ex">Ridge exaggeration on screen</label><output class="val" data-out="exag"></output></div>
              <input id="lab-ex" type="range" min="1" max="10" step="1" data-key="exag">
              <p class="ro">f = <b data-ro="f"></b>, r = <b data-ro="r"></b> → h = <b data-ro="h"></b> (exact circle: <b data-ro="hexact"></b>)</p>
            </div>`,
          onEnter: () => finishNow(),
        },
        {
          id: 'time', chip: 'Time trade-off', group: 'Effect', eyebrow: 'Shaping · slides 102–104', title: 'A finer finish costs strokes',
          cam: cam.top,
          html: () => `
            <p>The work must move across its whole width one feed at a time, so the number of strokes is width ÷ f.</p>
            <div class="ctl">
              <div class="ctl-row"><label for="lab-f3">Feed per stroke f</label><output class="val" data-out="f"></output></div>
              <input id="lab-f3" type="range" min="0.2" max="2.9" step="0.02" data-key="f">
              <div class="ctl-row"><label for="lab-v">Cutting speed V (m/min)</label><output class="val" data-out="Vc"></output></div>
              <input id="lab-v" type="range" min="6" max="30" step="1" data-key="Vc">
              <p class="ro">For a 250 × 120 mm job (slide 104): strokes <b data-ro="nstrokes"></b>, time per cycle <b data-ro="tc"></b>, total <b data-ro="ttot"></b></p>
            </div>
            <div class="duo">
              <div data-band="fine"><h3>Small feed</h3><p>Smooth surface, many strokes, long machining time. Use for finishing.</p></div>
              <div data-band="coarse"><h3>Large feed</h3><p>Rough surface, fewer strokes, short time. Use for roughing.</p></div>
            </div>`,
          onEnter: () => resetRun(),
        },
        {
          id: 'answer', chip: 'Exam answer', group: 'Exam', eyebrow: 'Model answer', title: 'Effect of feed per stroke',
          cam: cam.iso, plot: true,
          html: () => `
            <ul>
              <li>Feed per stroke is the sideways movement of the work (table) between two cutting strokes, in mm/stroke, applied during the idle return.</li>
              <li>A round-nosed tool leaves a scallop between adjacent cuts; its height h ≈ f²/8r.</li>
              <li>Increasing f increases ridge height and surface roughness (h ∝ f²), but fewer strokes are needed, so machining time falls.</li>
              <li>Decreasing f gives a smoother surface at the cost of more strokes and time. A larger nose radius also improves the finish.</li>
              <li>So use a coarse feed for roughing and a fine feed (with a broad-nosed tool) for finishing.</li>
            </ul>
            <p class="key"><span class="key-tag">Sketch</span>Draw the side view of two or three adjacent grooves with the feed f marked between them and the ridge height h.</p>`,
        },
      ],

      onParam(key) {
        if (key === 'f' || key === 'r') {
          clampFeed();
          buildTool();
          finishNow();
        }
        if (key === 'exag') {
          const keep = strokes;
          rebuild();
          strokes = keep;
        }
      },

      update(dt) {
        const s = dt * P.speed;
        if (state === 'forward') {
          t += s / Tf;
          const k = Math.min(t, 1);
          const p = 0.5 - 0.5 * Math.cos(Math.PI * k);
          toolz = zStart - p * (zStart - zEnd);
          this._vel = Math.sin(Math.PI * k);
          lift = 0;
          wp.position.x = -(xcut + P.f / 2);
          const pm = clamp((L / 2 - toolz) / L, 0, 1);
          strip.scale.z = Math.max(pm * L, 1e-4);
          strip.position.z = L / 2 - pm * L;
          unm.scale.z = Math.max((1 - pm) * L, 1e-4);
          unm.position.z = -L / 2;
          if (t >= 1) {
            strokes++;
            const old = xcut;
            xcut = strokes * P.f;
            if (xcut + P.f > P.W + 1e-6) {
              finished = true;
              rebuild();
              state = 'hold';
              t = 0;
              wp.position.x = -P.W / 2;
            } else {
              rebuild();
              state = 'return';
              t = 0;
              gx0 = -(old + P.f / 2);
              gx1 = -(xcut + P.f / 2);
              strip.scale.z = 1e-4;
              unm.scale.z = L;
              unm.position.z = -L / 2;
              strip.position.z = L / 2;
            }
          }
        } else if (state === 'return') {
          t += s / Tr;
          const k = Math.min(t, 1);
          toolz = zEnd + (zStart - zEnd) * ease(k);
          this._vel = -2.4 * Math.sin(Math.PI * k);
          lift = 0.9 * Math.sin(Math.PI * k);
          wp.position.x = gx0 + (gx1 - gx0) * ease(clamp((k - 0.15) / 0.7, 0, 1));
          if (t >= 1) {
            state = 'forward';
            t = 0;
          }
        } else {
          toolz = zStart;
          lift = 0.9;
          this._vel = 0;
          t += s;
          if (!holdFinished && t > 1.8) resetRun();
        }
        rig.position.set(0, lift, toolz);
        clapper.rotation.x = -lift * 0.25;
      },

      overlay(d, step) {
        const y = 3;
        if (state === 'forward') d.path([[-10, y, 7], [-10, y, -5]], 'vline', { arrowEnd: true });
        d.label([-10, y + 1.2, 1], 'V  cutting stroke', 'v');
        d.path([[10, y, -8], [2, y, -8]], 'fline', { arrowEnd: true });
        d.label([6, y + 1.2, -8], 'f  feed', 'f');
        if (step === 'feed' || step === 'nose' || step === 'formula') {
          // dimension the feed between two groove centres on the front face
          const x0 = wp.position.x + P.f * 2;
          d.dim([x0, -D, L / 2], [x0 + P.f, -D, L / 2], `f = ${P.f.toFixed(2)}`, [0, 2.2, 0]);
          d.line([x0 - 1, -D + P.exag * ridge(), L / 2], [x0 + P.f * 3, -D + P.exag * ridge(), L / 2], 'ref');
          d.label([x0 + P.f * 3 + 1.2, -D + P.exag * ridge() * 0.5, L / 2], `h = ${(ridge() * 1000).toFixed(0)} µm`, 'dimtxt');
        }
        if (step === 'setup') d.dim([-P.W / 2 - 1, -D, L / 2 + 1], [-P.W / 2 - 1, 0, L / 2 + 1], 'd', [-1.5, 0, 0]);
      },

      hud() {
        return {
          status: state === 'forward' ? 'Forward stroke: cutting' : state === 'return' ? 'Return stroke: idle, work feeds by f' : 'Finished surface',
          statusCls: state === 'forward' ? 'v' : state === 'return' ? 'f' : '',
          rows: [
            ['Strokes done', String(strokes)],
            ['Feed per stroke f', `${P.f.toFixed(2)} mm`],
            ['Tool nose radius r', `${P.r.toFixed(1)} mm`],
            ['Ridge height h', `${(ridge() * 1000).toFixed(0)} µm`],
          ],
          verdict: verdict(),
        };
      },

      readouts() {
        const h = (P.f * P.f) / (8 * P.r);
        const cyc = strokeTime();
        const n = Math.ceil(W_mm / P.f);
        return {
          h: `${(h * 1000).toFixed(0)} µm`,
          hexact: `${(ridge() * 1000).toFixed(1)} µm`,
          f: `${P.f.toFixed(2)} mm`,
          r: `${P.r.toFixed(1)} mm`,
          verdict: verdict()[0],
          vel: `${Math.abs(this._vel || 0).toFixed(2)} × mean`,
          nstrokes: String(n),
          tc: `${cyc.toFixed(2)} s`,
          ttot: `${((n * cyc) / 60).toFixed(1)} min`,
          band: P.f <= 0.8 ? 'fine' : P.f >= 1.4 ? 'coarse' : '',
          strokes: String(nStrokes()),
        };
      },
      live: true,

      format(key, v) {
        if (key === 'f' || key === 'r') return `${v.toFixed(key === 'f' ? 2 : 1)} mm`;
        if (key === 'exag') return `×${v}`;
        if (key === 'Vc') return `${v} m/min`;
        return null;
      },

      plot(g, w, h, c) {
        const m = 12, sx = (w - 2 * m) / (3 * P.f), base = 100, yv = sx * P.exag;
        const pts = [];
        for (let x = 0; x <= 3 * P.f + 1e-9; x += P.f / 24) {
          let u = x % P.f;
          if (x > 0 && Math.abs(u) < 1e-9) u = P.f;
          pts.push([m + x * sx, base - yv * hh(u)]);
        }
        g.beginPath();
        g.moveTo(pts[0][0], h);
        for (const q of pts) g.lineTo(q[0], q[1]);
        g.lineTo(pts[pts.length - 1][0], h);
        g.closePath();
        g.fillStyle = c.line;
        g.fill();
        g.beginPath();
        pts.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])));
        g.strokeStyle = c.ink;
        g.lineWidth = 1.6;
        g.stroke();
        const ty = 16;
        g.strokeStyle = c.f;
        g.fillStyle = c.f;
        g.lineWidth = 1.2;
        g.beginPath();
        g.moveTo(m, ty);
        g.lineTo(m + P.f * sx, ty);
        g.stroke();
        g.fillText('f', m + (P.f * sx) / 2 - 3, ty - 4);
        const top = base - yv * ridge();
        g.strokeStyle = c.muted;
        g.setLineDash([3, 3]);
        g.beginPath();
        g.moveTo(m, top);
        g.lineTo(w - m, top);
        g.moveTo(m, base);
        g.lineTo(w - m, base);
        g.stroke();
        g.setLineDash([]);
        g.fillStyle = c.muted;
        g.fillText('h', w - m - 8, (top + base) / 2 + 4);
        return 'Cross-section of the shaped surface';
      },
    };
  },
};
