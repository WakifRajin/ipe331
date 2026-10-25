// Effect lab: clapper box, strain-back and clearance angle on a shaper tool head (side view, Answer Note J).
// Units: 1 unit = 10 mm. The finished surface is y = 0, the cutting direction is +x, the hinge pin sits 7 units above the tool tip.
// Spring-back dig-in model (qualitative but monotonic): penetration = deflection * sin(g) / (sin(g) + sin(3 deg)); a small flank
// angle gives a long flank contact for a small penetration, so the flank carries the load.
const DEG = Math.PI / 180;
const RAKE = 10 * DEG; // back rake used for the wedge-angle sum (clearance + wedge + rake = 90 deg)
const G0 = Math.sin(3 * DEG);
const EI = 6.51e9; // N·mm², 25 × 25 mm steel shank
const K_HEAD = 20000; // N/mm lumped stiffness of ram + head + clapper (representative)

export default {
  id: 'clapper-strainback',
  chapter: 'shaping',
  title: 'Clapper box, strain-back and clearance angle',
  eyebrow: 'Shaping · slide 89 · Answer Note J',
  sub: 'Why the tool lifts on the return stroke, how the elastic deflection of the tool head springs the tool back into the work, and why a shaper tool needs only a small clearance angle.',
  blurb: 'Clapper box action, strain-back deflection and dig-in, and why shaper tool clearance is under 4 degrees.',
  qs: ['2015-16_4d', '2010-11_7a', '2011-12_6b', '2009-10_6c'],
  params: { clr: 3, clapper: 'on', oh: 6, F: 800, exag: 250 },

  build({ THREE, scene, P, kit }) {
    const { M, box, cyl } = kit;
    const ease = (s) => s * s * (3 - 2 * s);
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const A0 = 2.2; // block half width: tool enters the block here
    const B = 7; // pin height above the tip
    const Hr = 4.4; // tool shank thickness
    const X1 = 6; // tip position at end of the cut
    const D = 1.2; // depth of cut shown

    // ------------------------------------------------------------------ derived numbers
    const Lo = () => P.oh * 10; // overhang, mm
    const dTool = () => (P.F * Math.pow(Lo(), 3)) / (3 * EI); // mm
    const dHead = () => P.F / K_HEAD; // mm
    const dTot = () => dTool() + dHead(); // mm
    const dDraw = () => clamp((dTot() * P.exag) / 10, 0, 2.2); // drawn deflection, units
    const dig = () => Math.sin(P.clr * DEG) / (Math.sin(P.clr * DEG) + G0); // 0..1
    const digMM = () => dTot() * dig();
    const digDraw = () => clamp((digMM() * P.exag) / 10, 0, 2);
    const wedge = () => 90 - P.clr - RAKE / DEG;
    const rub = () => Math.exp(-P.clr / 1.2);
    const strength = () => wedge() / (90 - RAKE / DEG);
    const verdict = () => {
      if (P.clapper === 'locked') return ['Clapper locked: edge drags and scores', 'bad'];
      const g = P.clr;
      if (g < 1) return ['Flank rubs: heat and wear', 'bad'];
      if (g < 2) return ['Light rubbing, a little low', 'warn'];
      if (g <= 4) return ['Good: strong edge, flank supports', 'ok'];
      if (g <= 6) return ['Edge weakening, dig-in rising', 'warn'];
      return ['Digs in: weak, sharp edge', 'bad'];
    };
    const band = () => (P.clr < 2 ? 'rub' : P.clr <= 4 ? 'good' : 'dig');

    // ------------------------------------------------------------------ scene
    const grid = new THREE.GridHelper(120, 60, 0x7d8791, 0x9aa4ad);
    grid.position.y = -6;
    grid.material.transparent = true;
    grid.material.opacity = 0.3;
    scene.add(grid);

    // work
    const base = box(40, 5, 3.6, M.work);
    base.position.set(0, -2.5, 0);
    const stock = box(1, D, 3, M.work);
    const gouge = box(1, 1, 3.7, M.black);
    const scratch = box(1, 0.07, 3, M.red);
    scene.add(base, stock, gouge, scratch);

    // head (origin = hinge pin)
    const head = new THREE.Group();
    scene.add(head);
    const ram = box(34, 5.5, 5.4, M.paint);
    ram.position.set(-23, 13.5, 0);
    const slide = box(6.3, 20, 4.6, M.paintLight);
    slide.position.set(-6.35, 2, 0);
    const seat = box(1, 10.5, 4, M.darkSteel);
    seat.position.set(-2.7, -2.8, 0);
    const cheek = box(6.4, 11.5, 0.3, M.glass);
    cheek.position.set(0.5, -2.8, 2.35);
    const cap = box(6.4, 1.2, 4.4, M.paintDark);
    cap.position.set(0.2, 3.7, 0);
    const pin = cyl(0.7, 4.6, M.brass, { axis: 'z' });
    head.add(ram, slide, seat, cheek, cap, pin);

    const blk = new THREE.Group(); // clapper block + tool post + tool, hinged at the pin
    head.add(blk);
    const body = box(4.4, 11, 3.2, M.steel);
    body.position.set(0, -2.5, 0);
    const clamp1 = box(2.8, 1.4, 3.2, M.darkSteel);
    const toolG = new THREE.Mesh(new THREE.BufferGeometry(), M.hss);
    toolG.castShadow = true;
    blk.add(body, clamp1, toolG);

    function buildTool() {
      const lo = P.oh;
      const g = P.clr * DEG;
      const s = new THREE.Shape();
      s.moveTo(0, 0);
      s.lineTo(-lo * Math.cos(g), lo * Math.sin(g));
      s.lineTo(-lo * Math.cos(g), Hr * Math.cos(RAKE));
      s.lineTo(-Hr * Math.sin(RAKE), Hr * Math.cos(RAKE));
      s.closePath();
      const geo = new THREE.ExtrudeGeometry(s, { depth: 3, bevelEnabled: false });
      geo.translate(0, 0, -1.5);
      toolG.geometry.dispose();
      toolG.geometry = geo;
      toolG.position.set(A0 + lo, -B, 0);
      clamp1.position.set(A0 + 1.4, -B + Hr * Math.cos(RAKE) + 0.7, 0);
    }

    // ------------------------------------------------------------------ state
    const TT = { fwd: 3.2, rel: 1.1, ret: 2.0, hold: 0.7 };
    let ph = 'fwd', tp = 0, travel = 10;
    let gNow = 0, theta = 0, eps = 0, xs = X1 - travel, stockL = xs, rubL = 0;
    let tipX = 0, tipY = 0, pinX = 0, pinY = B, swing = 0, lift = 0, gougeD = 0, gougeX = 0;
    const THMAX = 17 * DEG;
    let curStep = '';

    function setMode(m) {
      travel = m === 'full' ? 10 : 3;
      ph = 'fwd';
      tp = 0;
      gNow = 0;
      rubL = 0;
    }

    function layout() {
      buildTool();
    }
    layout();

    function step(dt) {
      tp += dt / TT[ph];
      if (tp >= 1) {
        tp = 0;
        ph = ph === 'fwd' ? 'rel' : ph === 'rel' ? 'ret' : ph === 'ret' ? 'hold' : 'fwd';
        if (ph === 'fwd') gougeD = 0;
      }
    }

    function pose() {
      const locked = P.clapper === 'locked';
      const gEff = locked ? 1 : 0.25;
      const eMax = dDraw() / B;
      theta = 0;
      eps = 0;
      let gdip = 0;
      rubL = 0;
      if (ph === 'fwd') {
        xs = X1 - travel + travel * tp;
        eps = eMax * Math.min(1, tp * 6);
        stockL = xs;
      } else if (ph === 'rel') {
        xs = X1;
        eps = eMax * (1 - ease(tp));
        gdip = ease(Math.min(1, tp * 2.5));
        stockL = X1;
        gougeD = digDraw() * gEff * gdip;
        gougeX = X1;
      } else if (ph === 'ret') {
        xs = X1 - travel * tp;
        gdip = Math.max(0, 1 - tp * 5);
        stockL = X1;
        if (locked) rubL = travel * tp;
        else theta = THMAX * ease(Math.min(1, Math.min(tp * 6, (1 - tp) * 6)));
      } else {
        xs = X1 - travel;
        stockL = xs;
        gdip = 0;
      }
      gNow = gdip;
      const xl = A0 + P.oh;
      const thn = theta - eps;
      pinX = xs - xl + gdip * digDraw() * gEff * 1.6;
      // keep the tip on the surface while only the deflection rotates the tool
      pinY = B + xl * Math.sin(eps) - B * (1 - Math.cos(eps)) - gdip * digDraw() * gEff;
      const c = Math.cos(thn), s = Math.sin(thn);
      tipX = pinX + c * xl + s * B;
      tipY = pinY + s * xl - c * B;
      swing = theta;
      lift = tipY - (pinY - B);
    }

    function apply() {
      head.position.set(pinX, pinY, 0);
      blk.rotation.z = theta - eps;
      const rubbing = P.clapper === 'locked' && ph === 'ret';
      toolG.material = rubbing ? M.red : M.hss;
      const sl = stockL + 0.0;
      const len = Math.max(0.001, 16 - sl);
      stock.scale.x = len;
      stock.position.set(sl + len / 2, D / 2, 0);
      stock.visible = true;
      gouge.visible = gougeD > 0.01 && ph !== 'fwd';
      gouge.scale.set(0.9 + gougeD, Math.max(gougeD, 0.01), 1);
      gouge.position.set(gougeX, -gougeD / 2 + 0.005, 0);
      scratch.visible = rubL > 0.02;
      scratch.scale.x = Math.max(rubL, 0.001);
      scratch.position.set(X1 - rubL / 2, 0.04, 0);
    }

    pose();
    apply();

    const cam = {
      head: { position: [-3, 5, 31], target: [-3, 5, 0] },
      close: { position: [-2.5, 1.2, 12], target: [-2.5, 0.8, 0] },
      side: { position: [10, 7, 28], target: [-3, 4, 0] },
    };

    const ctl = (id, key, label, min, max, st) =>
      `<div class="ctl-row"><label for="lab-${id}">${label}</label><output class="val" data-out="${key}"></output></div><input id="lab-${id}" type="range" min="${min}" max="${max}" step="${st}" data-key="${key}">`;
    const clapSeg = `<div class="seg"><button type="button" data-set="clapper:on">Clapper free</button><button type="button" data-set="clapper:locked">Clapper locked</button></div>`;
    const f0 = (v) => v.toFixed(0);
    const f1 = (v) => v.toFixed(1);

    return {
      legend: [['var(--v)', 'Cutting force / drag'], ['var(--f)', 'Seat reaction'], ['var(--d)', 'Deflection / dig-in']],
      steps: [
        {
          id: 'what', chip: 'What it is', group: 'Clapper box', eyebrow: 'Shaping · slide 89', title: 'The clapper box',
          cam: cam.head, onEnter: () => setMode('full'),
          html: () => `
            <p>The tool is not fixed rigidly to the ram. The <mark>tool post</mark> is mounted on a <mark>clapper block</mark> that is <mark>hinged by a pin</mark> in the <mark>clapper box</mark>. The clapper box is fixed to the <mark>down-feed slide</mark> of the tool head, which sits on the ram.</p>
            <ul>
              <li>The block can swing up on its pin, but only one way. In the other direction it rests against the solid <b>seat</b> of the box.</li>
              <li>On a large shaper the block is lifted automatically (mechanically, by air or hydraulically).</li>
            </ul>
            ${clapSeg}
            <p class="note">Watch the whole cycle: cut, end of cut, return.</p>
            <p class="exam">Asked: TF 2009-10 Q.6(c) (need for a clapper box).</p>`,
        },
        {
          id: 'forward', chip: 'Forward stroke', group: 'Clapper box', eyebrow: 'Note J · slide 89', title: 'Forward stroke: the cutting force seats the block',
          cam: cam.head, onEnter: () => setMode('full'),
          html: () => `
            <p>While cutting, the cutting force F pushes the tool back. That pushes the clapper block <mark>against the solid seat</mark> of the box, so the seat takes the force and the tool is held <b>rigid</b>, as if bolted.</p>
            <div class="ctl">${ctl('f2', 'F', 'Cutting force F', 200, 2000, 50)}
              <p class="ro">Seat reaction = <b data-ro="F"></b> (equal and opposite to the cutting force)</p></div>
            <p class="key"><span class="key-tag">Remember</span>Forward: force → block pressed on the seat → rigid tool.</p>`,
        },
        {
          id: 'return', chip: 'Return stroke', group: 'Clapper box', eyebrow: 'Note J · slide 89', title: 'Return stroke: the block swings up',
          cam: cam.head, onEnter: () => setMode('full'),
          html: () => `
            <p>On the return the ram moves back and the tool drags on the work. The drag has no seat to rest on, so it makes the block <mark>swing up about the hinge pin</mark>. The tool lifts and slides lightly over the surface.</p>
            ${clapSeg}
            <p class="ro">Tool tip lift on this return: <b data-ro="lift"></b></p>
            <div class="duo">
              <div data-band="on"><h3>Clapper free</h3><p>Tool lifts. No rubbing, no blunting or chipping of the edge, no scoring of the finished surface.</p></div>
              <div data-band="locked"><h3>Clapper locked</h3><p>The edge drags back over the cut surface: it rubs, blunts or chips, and scores the surface (red).</p></div>
            </div>`,
        },
        {
          id: 'strain', chip: 'Strain-back', group: 'Strain-back', eyebrow: 'Note J · 2010-11 Q.7(a)', title: 'The tool head is elastic',
          cam: cam.head, onEnter: () => setMode('full'),
          html: () => `
            <p>During the cut, the cutting force <mark>elastically deflects</mark> the ram, the tool head, the holder and the overhung tool backward (and tilts the tip down) about the clapper hinge. The deflection is only a few hundredths of a millimetre; the picture is <b>exaggerated</b>.</p>
            <div class="ctl">${ctl('f3', 'F', 'Cutting force F', 200, 2000, 50)}${ctl('o3', 'oh', 'Tool overhang', 3, 10, 0.5)}${ctl('e3', 'exag', 'Exaggeration on screen', 50, 500, 10)}
              <p class="ro">Tool bending = <b data-ro="dtool"></b> · head and ram = <b data-ro="dhead"></b> · total strain δ = <b data-ro="dtot"></b></p></div>
            <p class="formula">δ = F / k<sub>head</sub> + F L³ / (3 E I)</p>
            <ul><li>More force → more deflection (linear).</li><li>Longer overhang L → much more bending (cube of L). Keep overhang short.</li></ul>
            <p class="note">k<sub>head</sub> = 20 N/µm and a 25 × 25 mm steel shank are representative values for the plot, not from the slides.</p>`,
        },
        {
          id: 'spring', chip: 'Spring-back and dig-in', group: 'Strain-back', eyebrow: 'Note J · 2015-16 Q.4(d)', title: 'At the end of the cut the tool springs back',
          cam: cam.close, onEnter: () => setMode('local'),
          html: () => `
            <p>At the end of the cut, or at a hard spot, or when the load suddenly falls, the stored elastic energy is released. The tool <mark>springs back toward and into the work</mark>. The sharp tip digs a notch below the finished surface.</p>
            <div class="ctl">${ctl('c4', 'clr', 'Clearance angle', 0.5, 12, 0.5)}${ctl('e4', 'exag', 'Exaggeration on screen', 50, 500, 10)}
              <p class="ro">Spring-back δ = <b data-ro="dtot"></b>; penetration = <b data-ro="dig"></b> (<b data-ro="digpct"></b> of δ)</p></div>
            ${clapSeg}
            <ul>
              <li><b>Large clearance</b>: little metal under the edge, no flank support, so the tip digs in deep.</li>
              <li><b>Small clearance</b>: the flank bears on the surface and <mark>supports</mark> the tool, so it cannot dig in.</li>
              <li><b>Clapper free</b>: the hinge lets the tool swing up and away instead of digging (penetration cut to about a quarter here).</li>
            </ul>`,
        },
        {
          id: 'why4', chip: 'Why clearance < 4°', group: 'Clearance', eyebrow: 'Note J · 2011-12 Q.6(b)', title: 'Why a shaper tool needs under 4° clearance',
          cam: cam.close, onEnter: () => setMode('local'), plot: true,
          html: () => `
            <div class="ctl">${ctl('c5', 'clr', 'Clearance angle', 0.5, 12, 0.5)}
              <div class="presets"><button class="pbtn" type="button" data-set="clr:0.5">0.5° rubs</button><button class="pbtn" type="button" data-set="clr:3">3° good</button><button class="pbtn" type="button" data-set="clr:8">8° digs in</button></div></div>
            <div class="duo">
              <div data-band="rub"><h3>Under 2° (below 1° rubs)</h3><p>Flank rubs hard on the surface: friction, heat and flank wear.</p></div>
              <div data-band="good"><h3>2° to 4°: good</h3><p>Strong edge, flank gives light support, no dig-in.</p></div>
              <div data-band="dig"><h3>Over 4° (over 6° digs in)</h3><p>Weak, sharp edge: it chips under impact and digs in on spring-back.</p></div>
            </div>
            <ul>
              <li>Cutting is <b>intermittent</b>: every stroke starts with an impact. Small clearance leaves more metal behind the edge, so it is stronger against shock.</li>
              <li>Because of strain-back, a large clearance lets the edge dig in; a small one lets the flank rub lightly and <b>support</b> it.</li>
              <li>The cut surface is flat and the tool does not travel in a helix (unlike turning), so no large clearance is needed to avoid rubbing.</li>
              <li>Better heat dissipation and less re-grinding.</li>
            </ul>
            <p class="ro">Now: wedge angle <b data-ro="wedge"></b>, dig-in <b data-ro="digpct"></b> of δ</p>
            <p class="exam">Asked: TF 2011-12 Q.6(b).</p>`,
        },
        {
          id: 'heat', chip: 'Edge strength and heat', group: 'Clearance', eyebrow: 'Note J', title: 'Wedge angle: edge strength and heat flow',
          cam: cam.close, onEnter: () => setMode('local'), plot: true,
          html: () => `
            <p>Clearance angle + wedge (included) angle + rake angle = 90°. If clearance takes more of the 90°, the <mark>wedge angle shrinks</mark>: the edge is thinner, weaker and carries heat away less well.</p>
            <div class="ctl">${ctl('c6', 'clr', 'Clearance angle', 0.5, 12, 0.5)}
              <p class="ro">Clearance <b data-ro="clr"></b> + wedge <b data-ro="wedge"></b> + rake 10° = 90° · edge strength index <b data-ro="str"></b></p></div>
            <p class="formula">wedge angle = 90° − clearance − rake</p>
            <ul><li>Smaller clearance: thicker wedge, stronger edge, better heat conduction into the shank, less grinding to resharpen.</li><li>But below about 1° the flank rubs and makes its own heat.</li></ul>`,
        },
        {
          id: 'answer', chip: 'Exam answer', group: 'Exam', eyebrow: 'Model answer', title: 'Clapper box, strain-back, clearance < 4°',
          cam: cam.side, onEnter: () => setMode('full'), plot: false,
          html: () => `
            <ul>
              <li><b>Clapper box:</b> the tool post sits on a clapper block hinged by a pin in a box on the down-feed slide. Forward, the cutting force presses the block on its seat so the tool is rigid. On the return the drag swings the block up about the pin, the tool lifts and slides lightly, which prevents rubbing, blunting or chipping of the edge and scoring of the finished surface.</li>
              <li><b>Strain-back:</b> the cutting force elastically deflects the ram, tool head, holder and overhung tool backward about the clapper hinge. At the end of the cut or at a hard spot the energy is released and the tool springs back into the work; with a large clearance the sharp, weak tip digs in, gouges the surface and may break. The hinge makes the tool swing up and away instead.</li>
              <li><b>Clearance under 4°:</b> intermittent cutting means impact, so a small clearance keeps more metal behind the edge and makes it stronger; the flank supports the tool against strain-back instead of letting it dig in; the flat cut and no helical path mean a large clearance is not needed; better heat dissipation and less re-grinding.</li>
            </ul>
            <p class="key"><span class="key-tag">Sketch</span>Side view of the clapper box: ram, slide, pin, block on its seat, tool; then the block swung up on the return.</p>`,
        },
      ],

      onParam(key) {
        if (key === 'clr' || key === 'oh') layout();
        pose();
        apply();
      },

      update(dt, t, stepId) {
        curStep = stepId;
        step(dt);
        pose();
        apply();
      },

      overlay(d, stepId) {
        const z = 3.2;
        const lc = Math.cos(theta - eps), ls = Math.sin(theta - eps);
        // world position of a point given in block-local coordinates
        const wx = (x, y) => pinX + lc * x - ls * y;
        const wy = (x, y) => pinY + ls * x + lc * y;
        const xl = A0 + P.oh;
        if (stepId === 'what') {
          d.label([pinX - 11, pinY + 12.5, z], 'Ram', 'minor');
          d.label([pinX - 9.5, pinY + 2, z], 'Down-feed slide', 'minor');
          d.label([pinX + 4.2, pinY + 4.6, z], 'Clapper box (fixed)', 'minor');
          d.label([wx(A0 + 0.3, -3.3) + 4.2, wy(A0 + 0.3, -3.3) + 0.6, z], 'Tool post', 'minor');
          d.label([wx(-0.2, -5.4) - 3.4, wy(-0.2, -5.4), z], 'Clapper block', 'minor');
          d.label([pinX - 2.6, pinY + 1.1, z], 'Hinge pin', 'hl');
          d.label([pinX - 6.5, pinY - 6, z], 'Seat', 'minor');
          d.label([tipX + 0.4, tipY - 1.4, z], 'Tool', 'minor');
          d.label([tipX + 5, -1.3, z], 'Work', 'minor');
          d.dot([pinX, pinY, z], 'dot');
        }
        if (stepId === 'forward' || stepId === 'what') {
          if (ph === 'fwd') {
            const len = 1.2 + P.F / 500;
            d.path([[tipX + len, tipY + 1.8, z], [tipX + 0.2, tipY + 1.8, z]], 'vline', { arrowEnd: true });
            d.label([tipX + len / 2 + 0.6, tipY + 3, z], 'F cutting force', 'v');
            d.path([[wx(-A0 - 1.3, -2) - len, wy(-A0 - 1.3, -2), z], [wx(-A0 - 1.3, -2) - 0.2, wy(-A0 - 1.3, -2), z]], 'dm', { arrowEnd: true });
            d.label([wx(-A0 - 1.3, -2) - len / 2 - 0.6, wy(-A0 - 1.3, -2) - 1.3, z], 'seat reaction', 'minor');
          }
        }
        if (stepId === 'return' || stepId === 'what') {
          if (ph === 'ret') {
            d.path([[tipX - 2, tipY + 2.6, z], [tipX + 1.6, tipY + 2.6, z]], 'vline', { arrowEnd: true });
            d.label([tipX - 0.6, tipY + 3.8, z], P.clapper === 'locked' ? 'drag, tool cannot lift' : 'drag lifts the block', 'v');
          }
          if (stepId === 'return') {
            const a0 = Math.atan2(-B, xl);
            d.arc([pinX, pinY, z], [1, 0, 0], [0, 1, 0], Math.hypot(xl, B), a0, a0 + THMAX, 'arc');
            d.label([pinX + Math.hypot(xl, B) * Math.cos(a0 + THMAX / 2) + 1.6, pinY + Math.hypot(xl, B) * Math.sin(a0 + THMAX / 2), z], 'swing', 'hl');
            if (P.clapper === 'locked' && ph === 'ret') d.label([X1 - rubL / 2, -1.2, z], 'scored surface', 'v');
          }
        }
        if (stepId === 'strain') {
          d.line([X1, -1.2, z], [X1, 2.6, z], 'ref');
          d.dim([X1, 1.6, z], [tipX, 1.6, z], `δ = ${(dTot() * 1000).toFixed(0)} µm (×${P.exag})`, [0, 0.9, 0]);
          d.label([pinX, pinY + 5.3, z], `overhang ${(Lo()).toFixed(0)} mm`, 'minor');
          d.dim([wx(A0, -B), wy(A0, -B), z], [tipX, tipY, z], '', [0, -1.6, 0]);
        }
        if (stepId === 'spring' || stepId === 'why4' || stepId === 'heat') {
          const rot = theta - eps;
          const g = P.clr * DEG;
          // flank (angle g above the surface behind the tip), rake face and wedge angle
          const aFlank = Math.PI - g + rot, aRake = Math.PI / 2 + RAKE + rot;
          d.arc([tipX, tipY, z], [1, 0, 0], [0, 1, 0], 2.6, Math.PI + rot, aFlank + 0.0001, 'arc');
          d.label([tipX - 3.5, tipY + 0.45, z], `γ = ${f1(P.clr)}°`, 'hl');
          if (stepId === 'heat' || stepId === 'why4') {
            d.arc([tipX, tipY, z], [1, 0, 0], [0, 1, 0], 1.6, aRake, aFlank, 'hx');
            d.label([tipX - 0.2, tipY + 2.2, z], `wedge ${f1(wedge())}°`, 'dimtxt');
          }
          if (stepId === 'spring' && gougeD > 0.02) {
            d.dim([gougeX, 0, z], [gougeX, -gougeD, z], `dig-in ${(digMM() * 1000 * (P.clapper === 'locked' ? 1 : 0.25)).toFixed(0)} µm (×${P.exag})`, [3, 0, 0]);
          }
          if (stepId === 'spring' && ph === 'rel') d.label([tipX + 3.4, tipY + 2.2, z], 'springs back into work', 'd');
        }
      },

      hud() {
        const status = ph === 'fwd' ? 'Forward stroke: cutting, block on seat' : ph === 'rel' ? 'End of cut: strain released' : ph === 'ret' ? (P.clapper === 'locked' ? 'Return: tool dragging' : 'Return: block swung up') : 'Idle';
        return {
          status,
          statusCls: ph === 'fwd' ? 'v' : ph === 'ret' ? 'f' : '',
          rows: [
            ['Clapper', P.clapper === 'locked' ? 'Locked' : 'Free to swing'],
            ['Clearance angle', `${f1(P.clr)}°`],
            ['Wedge angle', `${f1(wedge())}°`],
            ['Strain-back δ', `${(dTot() * 1000).toFixed(0)} µm`],
            ['Dig-in depth', `${(digMM() * 1000 * (P.clapper === 'locked' ? 1 : 0.25)).toFixed(0)} µm`],
          ],
          verdict: verdict(),
        };
      },

      readouts() {
        return {
          F: `${f0(P.F)} N`,
          lift: `${(lift * 10).toFixed(1)} mm`,
          dtool: `${(dTool() * 1000).toFixed(1)} µm`,
          dhead: `${(dHead() * 1000).toFixed(1)} µm`,
          dtot: `${(dTot() * 1000).toFixed(1)} µm`,
          dig: `${(digMM() * 1000 * (P.clapper === 'locked' ? 1 : 0.25)).toFixed(1)} µm`,
          digpct: `${f0(dig() * 100)} %`,
          wedge: `${f1(wedge())}°`,
          clr: `${f1(P.clr)}°`,
          str: strength().toFixed(2),
          band: curStep === 'return' ? P.clapper : band(),
        };
      },
      live: true,

      format(key, v) {
        if (key === 'clr') return `${v.toFixed(1)}°`;
        if (key === 'oh') return `${(v * 10).toFixed(0)} mm`;
        if (key === 'F') return `${v} N`;
        if (key === 'exag') return `×${v}`;
        return null;
      },

      plot(g, w, h, c) {
        const mx = 24, top = 12, bot = h - 20;
        const X = (a) => mx + (a / 12) * (w - mx - 8);
        const Y = (v) => bot - v * (bot - top);
        g.globalAlpha = 0.18;
        g.fillStyle = c.d;
        g.fillRect(X(2), top, X(4) - X(2), bot - top);
        g.globalAlpha = 1;
        g.strokeStyle = c.muted;
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(mx, top);
        g.lineTo(mx, bot);
        g.lineTo(w - 8, bot);
        g.stroke();
        const curve = (fn, col) => {
          g.strokeStyle = col;
          g.lineWidth = 1.8;
          g.beginPath();
          for (let i = 0; i <= 48; i++) {
            const a = 0.5 + (i / 48) * 11.5;
            const x = X(a), y = Y(fn(a));
            if (i) g.lineTo(x, y);
            else g.moveTo(x, y);
          }
          g.stroke();
        };
        curve((a) => Math.sin(a * DEG) / (Math.sin(a * DEG) + G0), c.v);
        curve((a) => (90 - 10 - a) / 80, c.f);
        curve((a) => Math.exp(-a / 1.2), c.accent);
        g.strokeStyle = c.ink;
        g.setLineDash([3, 3]);
        g.beginPath();
        g.moveTo(X(P.clr), top);
        g.lineTo(X(P.clr), bot);
        g.stroke();
        g.setLineDash([]);
        g.fillStyle = c.v;
        g.fillText('dig-in', X(8.2), Y(0.97) + 11);
        g.fillStyle = c.f;
        g.fillText('edge strength', X(3.2), Y(0.8) - 4);
        g.fillStyle = c.accent;
        g.fillText('rubbing', X(0.7), Y(0.35));
        g.fillStyle = c.muted;
        g.fillText('clearance angle 0 to 12°', mx + 30, h - 4);
        return 'Tendencies vs clearance (qualitative)';
      },
    };
  },
};
