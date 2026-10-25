// Effect lab: centerless grinding. The tilted regulating wheel feeds the work along its own axis (Vf = pi*Dr*Nr*sin i),
// and the work centre height h above the wheel centre line is what makes the part round.
// Scale: 1 scene unit = 1/0.028 mm. Wheel/work rotation is slowed for display; the axial feed runs in real time.
const KS = 0.028;
const DW = 20; // work diameter, mm
const WG = 150; // wheel width, mm
const RAD = Math.PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

function calc(P) {
  const plunge = P.mode === 'plunge';
  const iUsed = plunge ? Math.min(P.i, 1.5) : P.i;
  const Vr = Math.PI * P.Dr * P.Nr; // mm/min
  const Vf = Vr * Math.sin(iUsed * RAD);
  const Vt = Vr * Math.cos(iUsed * RAD);
  const q = P.h / DW;
  const wrpm = Vt / (Math.PI * DW);
  const perHour = plunge ? 0 : (60 * Vf) / Math.max(P.Lp, 1);
  const tCut = Vf > 1e-6 ? ((WG + P.Lp) / Vf) * 60 : Infinity; // seconds
  const L1 = 0.9 * (1 - sstep(0.03, 0.15, q));
  const L2 = sstep(0.5, 0.75, q);
  return { plunge, iUsed, Vr, Vf, Vt, q, wrpm, perHour, tCut, L1, L2 };
}
function verdictOf(c, P) {
  if (c.plunge) return c.q < 0.05 ? ['Plunge cut but h ≈ 0: lobes remain', 'bad'] : c.q > 0.55 ? ['Centre too high: chatter', 'bad'] : ['Plunge: part held on the end stop', 'ok'];
  if (c.iUsed < 0.05) return ['No tilt: work does not feed axially', 'warn'];
  if (c.q < 0.05) return ['h ≈ 0: lobed, out-of-round parts', 'bad'];
  if (c.q > 0.55) return ['Centre too high: chatter, work may jump', 'bad'];
  if (c.q < 0.15) return ['Low centre: slow rounding', 'warn'];
  return ['Good: rounds and feeds', 'ok'];
}

export default {
  id: 'centerless-feed',
  chapter: 'grinding',
  title: 'Centerless grinding: how the work feeds itself',
  eyebrow: 'Grinding · slides 130–132',
  sub: 'No centres, no chuck. The work rests on a blade between two wheels; tilting the rubber regulating wheel makes it walk through the machine, and raising the work centre makes it round.',
  blurb: 'How the regulating-wheel tilt sets the through-feed speed, and why the work centre sits above the wheel centre line.',
  qs: ['2016-17_7b', '2009-10_5c', '2020-21_2b'],
  params: { i: 3, Dr: 200, Nr: 30, h: 6, mode: 'through', Lp: 60 },
  start: 'parts',

  build({ THREE, scene, P, kit }) {
    const { M } = kit;
    const RG = (400 / 2) * KS, W = WG * KS, rw = (DW / 2) * KS, PSTEP = 0.12;
    const RRv = () => (P.Dr / 2) * KS;
    const Hv = () => P.h * KS;

    const gridH = new THREE.GridHelper(140, 70, 0x7d8791, 0x9aa4ad);
    gridH.position.y = -RG - 1.2;
    gridH.material.transparent = true;
    gridH.material.opacity = 0.28;
    scene.add(gridH);

    const ext = new THREE.Group(); // external grinding set-up
    const int = new THREE.Group(); // internal set-up
    scene.add(ext, int);
    int.visible = false;
    const mWork = new THREE.MeshStandardMaterial({ color: 0xd5dade, roughness: 0.28, metalness: 0.7 });
    const mCut = new THREE.MeshStandardMaterial({ color: 0xf4f6f7, roughness: 0.14, metalness: 0.9 });
    const mWheel = new THREE.MeshStandardMaterial({ color: 0x9c6f58, roughness: 0.85, metalness: 0.05 });
    const mAmber = new THREE.MeshStandardMaterial({ color: 0xe9a321, roughness: 0.5 });

    // ---------- machine base and wheel heads ----------
    const base = new THREE.Mesh(new THREE.BoxGeometry(26, 1.0, 9), M.paint);
    base.position.set(-1.5, -RG - 0.7, -0.5);
    const gHead = new THREE.Group();
    const gSpin = new THREE.Group();
    const wStraight = new THREE.Mesh(new THREE.CylinderGeometry(RG, RG, W, 96).rotateX(Math.PI / 2), mWheel);
    const wFormed = new THREE.Mesh(new THREE.LatheGeometry([[0, -W / 2], [RG, -W / 2], [RG, 0.05], [RG + PSTEP, 0.05], [RG + PSTEP, W / 2], [0, W / 2]].map(([x, y]) => new THREE.Vector2(x, y)), 96).rotateX(Math.PI / 2), mWheel);
    wFormed.visible = false;
    const gMark = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.06), M.white);
    gMark.position.set(RG * 0.8, 0, W / 2 + 0.03);
    gSpin.add(wStraight, wFormed, gMark);
    const gHub = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, W + 2.5, 20).rotateX(Math.PI / 2), M.darkSteel);
    const gHouse = new THREE.Mesh(new THREE.BoxGeometry(3.2, RG * 1.3, 2.2), M.paint);
    gHouse.position.set(0, -RG * 0.55, -W / 2 - 1.6);
    gHead.add(gSpin, gHub, gHouse);

    const rHead = new THREE.Group();
    const rTilt = new THREE.Group();
    const rSpin = new THREE.Group();
    const rWheel = new THREE.Mesh(new THREE.BufferGeometry(), M.rubber);
    const rMark = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.06), M.white);
    rSpin.add(rWheel, rMark);
    const rHub = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, W + 2.5, 16).rotateX(Math.PI / 2), M.darkSteel);
    rTilt.add(rSpin, rHub);
    const rHouse = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.6, 2.0), M.paint);
    rHouse.position.set(0.4, -2.4, -W / 2 - 1.5);
    rHead.add(rTilt, rHouse);
    let rKey = '';
    function buildReg() {
      const RR = RRv(), tn = Math.tan(P.i * RAD);
      const pts = [new THREE.Vector2(0, -W / 2)];
      for (let k = 0; k <= 20; k++) {
        const s = -W / 2 + (W * k) / 20;
        pts.push(new THREE.Vector2(Math.sqrt(RR * RR + (s * tn) ** 2), s));
      }
      pts.push(new THREE.Vector2(0, W / 2));
      rWheel.geometry.dispose();
      rWheel.geometry = new THREE.LatheGeometry(pts, 72).rotateX(Math.PI / 2);
      rMark.position.set(RR * 0.8, 0, W / 2 + 0.03);
      rKey = `${P.i}|${P.Dr}`;
    }

    // ---------- blade, work, end stop ----------
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.6, W + 0.4), M.hss);
    const bladeAng = -20 * RAD;
    blade.rotation.z = bladeAng;
    const NPIN = 6;
    const pinGroup = new THREE.Group();
    const pins = [];
    for (let k = 0; k < NPIN; k++) {
      const m = new THREE.Mesh(new THREE.BufferGeometry(), mWork);
      m.castShadow = true;
      const mk = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.4), mAmber);
      m.add(mk);
      mk.position.set(0, rw * 1.03, 0);
      pinGroup.add(m);
      pins.push(m);
    }
    const plSpin = new THREE.Group();
    const plA = new THREE.Mesh(new THREE.BufferGeometry(), mWork);
    const plB = new THREE.Mesh(new THREE.BufferGeometry(), mWork);
    const plMark = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.4), mAmber);
    plMark.position.set(0, rw * 1.03, -0.4);
    plSpin.add(plA, plB, plMark);
    const plAll = new THREE.Group();
    plAll.add(plSpin);
    const endStop = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.12), M.darkSteel);
    plAll.add(endStop);
    const workAll = new THREE.Group();
    workAll.add(pinGroup, plAll);
    ext.add(base, gHead, rHead, blade, workAll);

    let L1 = 0.9, L2 = 0, shown1 = -1, shown2 = -1;
    function lobed(rad, len) {
      const sh = new THREE.Shape();
      const n = 96;
      for (let k = 0; k < n; k++) {
        const th = (2 * Math.PI * k) / n;
        const r = rad * (1 + 0.12 * L1 * Math.cos(3 * th) + 0.07 * L2 * Math.cos(9 * th));
        if (k) sh.lineTo(Math.cos(th) * r, Math.sin(th) * r); else sh.moveTo(r, 0);
      }
      const g = new THREE.ExtrudeGeometry(sh, { depth: len, bevelEnabled: false });
      g.translate(0, 0, -len / 2);
      return g;
    }
    let pitchZ = 1, ZR = 1, lenKey = '';
    function buildWork() {
      const len = P.Lp * KS;
      pitchZ = (P.Lp + 3) * KS;
      ZR = NPIN * pitchZ;
      const g = lobed(rw, len);
      for (const m of pins) { m.geometry.dispose(); m.geometry = g.clone(); }
      g.dispose();
      plA.geometry.dispose(); plB.geometry.dispose();
      plA.geometry = lobed(rw, 1.0).translate(0, 0, -0.55);
      plB.geometry = lobed(rw - PSTEP, 0.9).translate(0, 0, 0.5);
      shown1 = L1; shown2 = L2; lenKey = `${P.Lp}`;
    }

    // ---------- internal centerless set-up ----------
    const ro = 1.5, ri = 1.0;
    const sleeveSh = new THREE.Shape();
    sleeveSh.absarc(0, 0, ro, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, ri, 0, Math.PI * 2, true);
    sleeveSh.holes.push(hole);
    const sleeveGeo = new THREE.ExtrudeGeometry(sleeveSh, { depth: 1.4, bevelEnabled: false, curveSegments: 48 });
    sleeveGeo.translate(0, 0, -0.7);
    const sleeveSpin = new THREE.Group();
    sleeveSpin.add(new THREE.Mesh(sleeveGeo, mWork), new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 1.2), mAmber));
    sleeveSpin.children[1].position.set(ro, 0, 0);
    const rollDefs = [{ ang: -40, rr: 0.9, mat: M.rubber }, { ang: -140, rr: 0.7, mat: M.steel }, { ang: 80, rr: 0.65, mat: M.steel }];
    const rolls = rollDefs.map((d) => {
      const a = d.ang * RAD, dist = ro + d.rr + 0.005;
      const g = new THREE.Group();
      const sp = new THREE.Group();
      sp.add(new THREE.Mesh(new THREE.CylinderGeometry(d.rr, d.rr, 1.7, 40).rotateX(Math.PI / 2), d.mat));
      const mk = new THREE.Mesh(new THREE.BoxGeometry(d.rr, 0.05, 0.04), M.white);
      mk.position.set(d.rr * 0.5, 0, 0.86);
      sp.add(mk);
      g.add(sp);
      g.position.set(Math.cos(a) * dist, Math.sin(a) * dist, 0);
      g.userData = { sp, rr: d.rr, dist, a };
      return g;
    });
    const quill = new THREE.Group();
    const iSpin = new THREE.Group();
    iSpin.add(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.8, 32).rotateX(Math.PI / 2), mWheel), (() => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.04), M.white); m.position.set(0.27, 0, 0.42); return m; })());
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 5, 16).rotateX(Math.PI / 2), M.steel);
    shaft.position.z = 3.1;
    quill.add(iSpin, shaft);
    const backPlate = new THREE.Mesh(new THREE.BoxGeometry(7, 6, 0.2), M.paintDark);
    backPlate.position.set(0, 0, -1.3);
    int.add(backPlate, sleeveSpin, quill, ...rolls);

    // ---------- state ----------
    let aG = 0, aR = 0, aW = 0, t = 0, plT = 0, zTrav = 0, intT = 0;
    let curStep = 'parts', view = 'ext';
    let cg = -RG - rw, cr = 3, wx = 0, wy = 0, prog = 0, extra = 0, plNote = '';
    let C0 = calc(P);
    buildReg();
    buildWork();

    const cam = {
      iso: { position: [9, 7, 29], target: [-1, 0, 0] },
      side: { position: [26, 3.5, 5], target: [2.5, 0, 0] },
      close: { position: [1, 1.6, 8.5], target: [0, 0.2, 0] },
      top: { position: [0.5, 26, 7], target: [0, 0, 0.5] },
      int: { position: [4, 2.5, 11], target: [0, 0, 0] },
    };
    const ctl = (id, key, label, min, max, step) => `
      <div class="ctl-row"><label for="${id}">${label}</label><output class="val" data-out="${key}"></output></div>
      <input id="${id}" type="range" min="${min}" max="${max}" step="${step}" data-key="${key}">`;
    const arcPts = (cx, cy, z, r, a0, a1, n = 18) => {
      const out = [];
      for (let k = 0; k <= n; k++) { const a = (a0 + ((a1 - a0) * k) / n) * RAD; out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, z]); }
      return out;
    };

    return {
      legend: [['var(--v)', 'Wheel speed V'], ['var(--f)', 'Axial feed Vf'], ['var(--d)', 'Plunge infeed']],
      steps: [
        {
          id: 'parts', chip: 'Parts', group: 'Set-up', eyebrow: 'Grinding · slides 130–131', title: 'Two wheels and a blade',
          cam: cam.iso,
          onEnter: () => (view = 'ext'),
          html: () => `
            <p>Centerless grinding holds the work with <b>no centres and no chuck</b>. Three things support it:</p>
            <ul>
              <li>The <mark>grinding wheel</mark> (large, fast): does the cutting.</li>
              <li>The <mark>regulating wheel</mark> (smaller, rubber bond, slow): controls the work's rotation and, when tilted, its axial motion.</li>
              <li>The <mark>work-rest blade</mark> between them: carries the work, with its top face sloped.</li>
            </ul>
            <div class="seg"><button type="button" data-set="mode:through">Through-feed</button><button type="button" data-set="mode:plunge">Plunge (in-feed)</button></div>
            <p class="ro">Mode: <b data-ro="modeName"></b></p>
            <p class="note">Rotation is slowed for display; the axial feed shown is the real speed.</p>
            <p class="exam">Asked: TF 2016-17 Q.7(b), 2009-10 Q.5(c), 2020-21 Q.2(b).</p>`,
        },
        {
          id: 'rotation', chip: 'Rotation directions', group: 'Set-up', eyebrow: 'Grinding · slide 130', title: 'Who turns which way',
          cam: cam.iso,
          onEnter: () => (view = 'ext'),
          html: () => `
            <p>Both wheels turn the <b>same way</b>. The grinding wheel's surface moves <span class="tag-v">down</span> where it meets the work, pressing it on the blade. The regulating wheel's surface moves up on its side. So the work, squeezed between them, turns the <b>opposite way</b> to both wheels.</p>
            <div class="ctl">
              ${ctl('lab-Nr0', 'Nr', 'Regulating wheel speed Nr', 10, 80, 1)}
              ${ctl('lab-Dr0', 'Dr', 'Regulating wheel diameter Dr', 100, 300, 10)}
              <p class="ro">Work turns at about <b data-ro="wrpm"></b> (a 20 mm part)</p>
            </div>
            <p class="key"><span class="key-tag">Remember</span>The regulating wheel is slow and rubber-bonded: friction makes the work follow its surface speed, while the fast grinding wheel does the cutting. Work speed ≈ regulating wheel surface speed.</p>`,
        },
        {
          id: 'tilt', chip: 'Tilt gives feed', group: 'Effect', eyebrow: 'Grinding · slide 131', title: 'Tilt the regulating wheel: the work walks along',
          cam: cam.side, plot: true,
          onEnter: () => (view = 'ext'),
          html: () => `
            <p>The regulating wheel is tilted by a small angle <mark>i</mark> (about 1 to 5°). Its surface speed V = π·Dr·Nr then has two parts at the contact with the work:</p>
            <ul>
              <li><span class="tag-v">V cos i</span> along the surface: makes the work rotate (≈ V).</li>
              <li><span class="tag-f">V sin i</span> along the work axis: pushes the work through, the <mark>through-feed velocity</mark>.</li>
            </ul>
            <p class="formula">Vf = π · Dr · Nr · sin i</p>
            <div class="ctl">
              ${ctl('lab-i', 'i', 'Tilt angle i', 0, 8, 0.1)}
              <div class="presets"><button class="pbtn" type="button" data-set="i:0">0° (no feed)</button><button class="pbtn" type="button" data-set="i:1.5">1.5°</button><button class="pbtn" type="button" data-set="i:3">3°</button><button class="pbtn" type="button" data-set="i:6">6°</button></div>
              ${ctl('lab-Nr', 'Nr', 'Regulating wheel speed Nr', 10, 80, 1)}
              ${ctl('lab-Dr', 'Dr', 'Regulating wheel diameter Dr', 100, 300, 10)}
              <p class="ro">V = <b data-ro="Vr"></b> · V cos i = <b data-ro="Vt"></b> · Vf = <b data-ro="Vf"></b></p>
            </div>
            <p class="small">At i = 0 the work does not move axially at all: that is the set-up for plunge grinding. In the picture the axial arrow is drawn ×6 so you can see it.</p>`,
        },
        {
          id: 'rate', chip: 'Throughput', group: 'Effect', eyebrow: 'Grinding · slide 130', title: 'How many parts per hour?',
          cam: cam.top,
          onEnter: () => (view = 'ext'),
          html: () => `
            <p>Parts are fed in end to end, one after the other, so a new part leaves every Lp / Vf minutes:</p>
            <p class="formula">parts per hour = 60 · Vf / Lp</p>
            <div class="ctl">
              ${ctl('lab-Lp', 'Lp', 'Part length Lp', 20, 150, 5)}
              ${ctl('lab-i2', 'i', 'Tilt angle i', 0, 8, 0.1)}
              ${ctl('lab-Nr2', 'Nr', 'Regulating wheel speed Nr', 10, 80, 1)}
              <p class="ro">Vf = <b data-ro="Vf"></b> → <b data-ro="perHour"></b> parts per hour · each part is in contact for about <b data-ro="tCut"></b></p>
            </div>
            <p class="note">Time in contact = (wheel width + part length) / Vf. A larger tilt or speed raises the output, but the part then spends less time under the wheel, so it is ground less (rougher, less accurate). Slow down for finishing.</p>`,
        },
        {
          id: 'height', chip: 'Centre height', group: 'Effect', eyebrow: 'Grinding · slide 130', title: 'Why the work centre sits above the wheel centres',
          cam: cam.close, plot: true,
          onEnter: () => (view = 'ext'),
          html: () => `
            <p>The work centre is set a height <mark>h</mark> above the line joining the two wheel centres (about D/6 to D/2 of the work). Because the three contact points are not in line, a high spot on the part is cut harder than a low spot, and the error shrinks each turn: the part becomes <mark>round</mark>.</p>
            <div class="ctl">
              ${ctl('lab-h', 'h', 'Centre height h', 0, 15, 0.5)}
              <div class="presets"><button class="pbtn" type="button" data-set="h:0">h = 0</button><button class="pbtn" type="button" data-set="h:6">h = 6 mm</button><button class="pbtn" type="button" data-set="h:14">h = 14 mm</button></div>
              <p class="ro">h / part dia = <b data-ro="hq"></b> · <b data-ro="hverdict"></b></p>
            </div>
            <div class="duo">
              <div data-band="low"><h3>h = 0</h3><p>Centre on the wheel line: the part can settle into lobes of constant width. It is not rounded: out-of-round (lobed) parts.</p></div>
              <div data-band="ok"><h3>h above the line</h3><p>High spots are removed: rounding works. Typical h is about a sixth to half of the work diameter.</p></div>
              <div data-band="high"><h3>Too high</h3><p>The blade angle becomes steep, the work bounces: chatter marks.</p></div>
            </div>
            <p class="small">Lobes and chatter marks are drawn exaggerated. Watch the end of the part rotate.</p>`,
        },
        {
          id: 'modes', chip: 'Through-feed vs plunge', group: 'Variants', eyebrow: 'Grinding · slides 131–132', title: 'Through-feed or plunge',
          cam: cam.iso,
          onEnter: () => (view = 'ext'),
          html: () => `
            <div class="seg"><button type="button" data-set="mode:through">Through-feed</button><button type="button" data-set="mode:plunge">Plunge (in-feed)</button></div>
            <div class="duo">
              <div data-band="through"><h3>Through-feed</h3><p>Plain cylinders. Tilt i ≈ 1–5°, parts pass straight through and leave at the far side. High output (pins, rollers, shafts).</p></div>
              <div data-band="plunge"><h3>Plunge (in-feed)</h3><p>Stepped, shouldered or formed parts. The part rests on the blade against an <b>end stop</b>, tilt is almost zero, a formed grinding wheel is fed in (plunged) by the regulating wheel. The slight tilt presses the part against the stop.</p></div>
            </div>
            <div class="ctl">
              ${ctl('lab-i3', 'i', 'Tilt angle i', 0, 8, 0.1)}
              <p class="ro">Axial feed Vf = <b data-ro="Vf"></b> · <b data-ro="plNote"></b></p>
            </div>
            <p class="note">In plunge mode the tilt is limited to a small angle so the part stays on its end stop (Vf = 0).</p>`,
        },
        {
          id: 'internal', chip: 'Internal centerless', group: 'Variants', eyebrow: 'Grinding · slide 131', title: 'Internal centerless: three rolls',
          cam: cam.int,
          onEnter: () => (view = 'int'),
          html: () => `
            <p>For sleeves and rings, the part is supported on its <b>outside</b> by three rolls: a rubber <mark>regulating roll</mark> that drives it, a <mark>support roll</mark>, and a <mark>pressure roll</mark> that holds it in place. A small wheel on a quill reciprocates inside the bore.</p>
            <div class="ctl">
              ${ctl('lab-Nr3', 'Nr', 'Regulating roll speed Nr', 10, 80, 1)}
              <p class="ro">Work speed set by the regulating roll: <b data-ro="wrpm"></b></p>
            </div>
            <p class="key"><span class="key-tag">Remember</span>Because the bore is ground while the outside rides on the rolls, the bore ends up concentric with the outside surface.</p>`,
        },
        {
          id: 'pros', chip: 'Pros and limits', group: 'Exam', eyebrow: 'Grinding · slide 132', title: 'Advantages and limitations',
          cam: cam.iso,
          onEnter: () => (view = 'ext'),
          html: () => `
            <div class="duo">
              <div><h3>Advantages</h3><ul><li>No centring, loading or unloading time: continuous production.</li><li>Parts held rigidly by the blade and wheels, so slender work does not bend.</li><li>Little skill and no work-holding fixture.</li></ul></div>
              <div><h3>Limitations</h3><ul><li>Not for parts with keyways or flats: the work would not roll true.</li><li>Needs a long, regular cylindrical surface (or a formed wheel and end stop).</li><li>Setting up the wheel heights and tilt is demanding.</li></ul></div>
            </div>`,
        },
        {
          id: 'answer', chip: 'Exam answer', group: 'Exam', eyebrow: 'Model answer', title: 'What is centerless grinding?',
          cam: cam.iso,
          onEnter: () => (view = 'ext'),
          html: () => `
            <ul>
              <li>Centerless grinding is a method of grinding cylindrical parts that are supported between a grinding wheel and a regulating wheel on a work-rest blade, with no centres or chuck.</li>
              <li>The large grinding wheel cuts. The smaller, rubber-bonded regulating wheel turns slowly in the same sense and, by friction, controls the work speed.</li>
              <li><b>Through-feed:</b> the regulating wheel is tilted by i, so Vf = π·Dr·Nr·sin i carries the work through; plain cylinders.</li>
              <li><b>Plunge (in-feed):</b> i ≈ 0 and an end stop; the wheel is fed in to grind shoulders and formed shapes.</li>
              <li>The work centre is set above the line of wheel centres by about a sixth to half of the diameter; this makes the part round.</li>
            </ul>
            <p class="key"><span class="key-tag">Sketch</span>Front view: two wheels, blade, work above the centre line with h marked, rotation arrows; side view: tilt angle i.</p>`,
        },
      ],

      onParam(key) {
        C0 = calc(P);
        if (key === 'i' || key === 'Dr') buildReg();
        if (key === 'Lp') buildWork();
      },

      update(dt, tt, stepId) {
        curStep = stepId || curStep;
        C0 = calc(P);
        ext.visible = view === 'ext';
        int.visible = view === 'int';
        const plunge = C0.plunge;
        // relax lobes towards the state set by the centre height
        const k = Math.min(1, dt * 1.5);
        L1 += (C0.L1 - L1) * k;
        L2 += (C0.L2 - L2) * k;
        if (Math.abs(L1 - shown1) > 0.015 || Math.abs(L2 - shown2) > 0.015) buildWork();
        // wheel spin (slowed)
        const wr = ((2 * Math.PI * P.Nr) / 60) * 0.2;
        const RR = RRv(), H = Hv();
        aG -= 5 * dt;
        aR -= wr * dt;
        aW += wr * (RR / rw) * Math.cos(C0.iUsed * RAD) * dt;
        gSpin.rotation.z = aG;
        rSpin.rotation.z = aR;
        rTilt.rotation.x = C0.iUsed * RAD;
        wFormed.visible = plunge;
        wStraight.visible = !plunge;
        pinGroup.visible = !plunge;
        plAll.visible = plunge;
        // plunge cycle
        let rEff = rw;
        extra = 0;
        if (plunge) {
          plT += dt;
          const p = (plT % 9) / 9;
          if (p < 0.1) { extra = 0.6 * (1 - sstep(0, 1, p / 0.1)); prog = 0; plNote = 'loading'; }
          else if (p < 0.7) { prog = (p - 0.1) / 0.6; plNote = 'plunge infeed'; }
          else if (p < 0.85) { prog = 1; plNote = 'spark-out'; }
          else { extra = 0.6 * sstep(0, 1, (p - 0.85) / 0.15); prog = 1; plNote = 'retract'; }
          rEff = rw - 0.04 * prog;
          plSpin.scale.set(rEff / rw, rEff / rw, 1);
          plAll.visible = p > 0.04 && p < 0.9;
          plSpin.rotation.z = aW;
        } else plNote = P.i < 0.05 ? 'no axial feed' : 'continuous through-feed';
        // geometry of the three contacts: work centre at (0, H); wheel centres on y = 0
        wx = 0; wy = H;
        cg = -Math.sqrt((RG + rEff) ** 2 - H * H);
        const cr0 = Math.sqrt((RR + rEff) ** 2 - H * H);
        cr = cr0 + extra;
        gHead.position.set(cg, 0, 0);
        rHead.position.set(cr, 0, 0);
        workAll.position.set(0, H, 0);
        const nx = Math.sin(-bladeAng), ny = Math.cos(bladeAng);
        blade.position.set(-rEff * nx - nx * 0.8, H - rEff * ny - ny * 0.8, 0);
        endStop.position.set(0, 0, -0.62);
        // through-feed: real-time axial motion
        if (!plunge) {
          zTrav += (C0.Vf / 60) * KS * dt;
          for (let q = 0; q < NPIN; q++) {
            const z = ((((q * pitchZ + zTrav) % ZR) + ZR) % ZR) - ZR / 2;
            pins[q].position.z = z;
            pins[q].material = z > 0 ? mCut : mWork;
            pins[q].rotation.z = aW;
          }
        }
        // internal set-up
        intT += dt;
        sleeveSpin.rotation.z = aW * 0.12;
        for (const g of rolls) g.userData.sp.rotation.z = aW * 0.12 * (ro / g.userData.rr) * (g.userData.rr === 0.9 ? -1 : 1);
        iSpin.rotation.z = -aG * 1.4;
        quill.position.z = 0.45 * Math.sin(intT * 1.6);
        void tt;
      },

      overlay(d, step) {
        const RR = RRv(), H = Hv(), c = C0, zf = W / 2 + 0.3;
        if (view === 'int') {
          d.label([ro * 1.6, -ro * 1.4, 0.9], 'regulating roll (rubber)', 'minor');
          d.label([-ro * 1.8, -ro * 1.5, 0.9], 'support roll', 'minor');
          d.label([0.4, ro + 1.7, 0.9], 'pressure roll', 'minor');
          d.label([0, 0, 1.0], 'internal wheel on quill', 'hl');
          d.label([-2.5, 1.9, 0.9], 'sleeve (work)', 'minor');
          return;
        }
        d.path(arcPts(cg, 0, zf, RG * 0.55, 130, 50), 'vline', { arrowEnd: true });
        d.label([cg, RG * 0.55 + 0.7, zf], 'grinding wheel (fast)', 'v');
        d.path(arcPts(cr, 0, zf, RR * 0.55, 130, 50), 'fline', { arrowEnd: true });
        d.label([cr + 0.2, RR + 0.8, zf], 'regulating wheel (rubber, slow)', 'f');
        if (step === 'parts' || step === 'rotation') {
          d.path(arcPts(0, H, zf, 0.7, 50, 130), 'dline', { arrowEnd: true });
          d.label([0, H + 1.4, zf], 'work rotates the other way', 'd');
          d.label([-0.6, H - 1.9, 0], 'work-rest blade', 'minor');
        }
        if (step === 'tilt') {
          // side-on: regulating wheel axis tilted by i about the x axis; draw axis and the z reference, arc for i
          const a = c.iUsed * RAD;
          const L = W / 2 + 1.2;
          d.line([cr, 0, -L], [cr, 0, L], 'ref');
          d.line([cr, Math.sin(a) * L, -Math.cos(a) * L], [cr, -Math.sin(a) * L, Math.cos(a) * L], 'cl');
          const arcR = L * 0.8;
          const pts = [];
          for (let q = 0; q <= 10; q++) { const b = (-a * q) / 10; pts.push([cr, Math.sin(b) * arcR, Math.cos(b) * arcR]); }
          d.path(pts, 'arc');
          d.label([cr, -0.9, arcR + 0.6], `i = ${c.iUsed.toFixed(1)}°`, 'hl');
          // velocity decomposition at the contact
          const px = wx + rw * ((cr - 0) / Math.hypot(cr, H)), py = H - rw * (H / Math.hypot(cr, H));
          const len = 2.2;
          d.path([[px, py, 0], [px, py + len * Math.cos(a), len * Math.sin(a) * 6 * 0 + len * Math.sin(a)]], 'vline', { arrowEnd: true });
          d.label([px, py + len + 0.4, 0], `V = ${(c.Vr / 1000).toFixed(1)} m/min`, 'v');
          d.path([[px, py - 0.35, 0], [px, py - 0.35, 6 * len * Math.sin(Math.max(a, 0.001)) + 0.2]], 'fline', { arrowEnd: true });
          d.label([px, py - 1.1, 2.5], `Vf = V sin i = ${(c.Vf / 1000).toFixed(2)} m/min (×6)`, 'f');
        }
        if (step === 'rate') {
          d.path([[-W / 2 - 1.2, H + 0.9, -2.5], [-W / 2 - 1.2, H + 0.9, 2.5]], 'fline', { arrowEnd: true });
          d.label([-W / 2 - 1.2, H + 1.5, 0], `Vf ${(c.Vf / 1000).toFixed(2)} m/min`, 'f');
          d.dim([W / 2 + 0.4, H + 0.2, -W / 2], [W / 2 + 0.4, H + 0.2, W / 2], 'wheel width 150 mm', [0, 0.5, 0]);
        }
        if (step === 'height' || step === 'parts') {
          const zf2 = W / 2 + 0.05;
          d.line([cg, 0, zf2], [cr, 0, zf2], 'cl');
          d.label([cg + 0.8, -0.35, zf2], 'wheel centre line', 'minor');
          if (H > 0.02) d.dim([wx + 1.3, 0, zf2], [wx + 1.3, H, zf2], `h = ${P.h.toFixed(1)} mm`, [0.9, 0, 0]);
          else d.label([wx + 1.6, 0.3, zf2], 'h = 0', 'hl');
          d.dot([wx, H, zf2], 'dot');
          d.label([wx - 1.1, H + 0.7, zf2], 'work centre', 'hl');
        }
        if (step === 'modes') {
          if (c.plunge) {
            d.path([[cr + 1.5, 0, 0.3], [cr - 0.5, 0, 0.3]], 'dline', { arrowEnd: true });
            d.label([cr + 1.5, 0.6, 0.3], 'plunge infeed', 'd');
            d.label([0, H + 0.9, -0.62], 'end stop', 'hl');
          } else {
            d.path([[0, H + 0.9, -2.2], [0, H + 0.9, 2.2]], 'fline', { arrowEnd: true });
            d.label([0, H + 1.5, 0], 'through-feed', 'f');
          }
        }
      },

      hud() {
        const c = C0;
        return {
          status: c.plunge ? `Plunge · ${plNote}` : P.i < 0.05 ? 'Through-feed, i = 0: work does not move' : 'Through-feed',
          statusCls: c.plunge ? '' : 'f',
          rows: [
            ['Tilt i', `${c.iUsed.toFixed(1)}°`],
            ['Vf', c.plunge ? '0 (end stop)' : `${(c.Vf / 1000).toFixed(2)} m/min`],
            ['Work speed', `${c.wrpm.toFixed(0)} rpm`],
            ['Parts / hour', c.plunge ? '1 per cycle' : `${c.perHour.toFixed(0)}`],
            ['h / work dia', `${c.q.toFixed(2)}`],
          ],
          verdict: verdictOf(c, P),
        };
      },

      readouts() {
        const c = C0;
        const band = curStep === 'height' ? (c.q < 0.06 ? 'low' : c.q > 0.55 ? 'high' : 'ok') : curStep === 'modes' ? (c.plunge ? 'plunge' : 'through') : '';
        return {
          modeName: P.mode === 'plunge' ? 'plunge (in-feed)' : 'through-feed',
          wrpm: `${c.wrpm.toFixed(0)} rpm`,
          Vr: `${(c.Vr / 1000).toFixed(2)} m/min`,
          Vt: `${(c.Vt / 1000).toFixed(2)} m/min`,
          Vf: c.plunge ? '0 (held by end stop)' : `${(c.Vf / 1000).toFixed(2)} m/min (${c.Vf.toFixed(0)} mm/min)`,
          perHour: c.plunge ? 'n/a (plunge cycle)' : c.perHour.toFixed(0),
          tCut: Number.isFinite(c.tCut) ? `${c.tCut.toFixed(1)} s` : 'never (no feed)',
          hq: c.q.toFixed(2),
          hverdict: c.q < 0.05 ? 'lobed parts' : c.q > 0.55 ? 'chatter' : c.q < 0.15 ? 'rounds slowly' : 'rounds well',
          plNote,
          band,
        };
      },
      live: true,

      format(key, v) {
        switch (key) {
          case 'i': return `${v.toFixed(1)}°`;
          case 'Dr': return `${v} mm`;
          case 'Nr': return `${v} rpm`;
          case 'h': return `${v.toFixed(1)} mm`;
          case 'Lp': return `${v} mm`;
          default: return null;
        }
      },
      action() {},

      plot(g, w, h, col, step) {
        const m = 24;
        g.strokeStyle = col.muted; g.lineWidth = 1;
        g.beginPath(); g.moveTo(m, 10); g.lineTo(m, h - 18); g.lineTo(w - 8, h - 18); g.stroke();
        if (step === 'tilt') {
          const vmax = (Math.PI * 300 * 80 * Math.sin(8 * RAD)) / 1000;
          const X = (i) => m + (i / 8) * (w - m - 10);
          const Y = (v) => h - 18 - (v / vmax) * (h - 30);
          g.strokeStyle = col.ink; g.lineWidth = 1.6; g.beginPath();
          for (let i = 0; i <= 8; i += 0.25) {
            const v = (Math.PI * P.Dr * P.Nr * Math.sin(i * RAD)) / 1000;
            if (i) g.lineTo(X(i), Y(v)); else g.moveTo(X(i), Y(v));
          }
          g.stroke();
          g.fillStyle = col.accent;
          g.beginPath(); g.arc(X(C0.iUsed), Y(C0.Vf / 1000), 4, 0, 7); g.fill();
          g.fillStyle = col.muted;
          g.fillText('Vf', 4, 14); g.fillText('i °', w - 22, h - 5);
          return 'Through-feed Vf vs tilt i (this Dr, Nr)';
        }
        // height: lobe amplitude vs h
        const X = (hh) => m + (hh / 15) * (w - m - 10);
        const Y = (a) => h - 18 - clamp(a, 0, 1) * (h - 30);
        g.strokeStyle = col.ink; g.lineWidth = 1.6; g.beginPath();
        for (let hh = 0; hh <= 15; hh += 0.25) {
          const q = hh / DW;
          const a = Math.max(0.9 * (1 - sstep(0.03, 0.15, q)), sstep(0.5, 0.75, q));
          if (hh) g.lineTo(X(hh), Y(a)); else g.moveTo(X(hh), Y(a));
        }
        g.stroke();
        g.fillStyle = col.accent;
        g.beginPath(); g.arc(X(P.h), Y(Math.max(C0.L1, C0.L2)), 4, 0, 7); g.fill();
        g.fillStyle = col.muted;
        g.fillText('out-of-round', m + 4, 14); g.fillText('h mm', w - 36, h - 5);
        return 'Roundness error vs centre height (illustrative)';
      },

      dispose() {
        rWheel.geometry.dispose();
        for (const m of pins) m.geometry.dispose();
        plA.geometry.dispose(); plB.geometry.dispose();
        sleeveGeo.dispose();
      },
    };
  },
};
