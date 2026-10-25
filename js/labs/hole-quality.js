// Effect lab: why one drill is not enough. A half-sectioned block (and an end view of the hole) is made by different operation
// sequences; each operation is animated and the hole profile is redrawn. Errors are exaggerated on screen; the HUD gives real values.
//   0 drill only · 1 centre + drill · 2 centre + drill + ream · 3 centre + drill + bore · 4 centre + drill + bore + ream
export default {
  id: 'hole-quality',
  chapter: 'drilling',
  title: 'Why one drill is not enough',
  eyebrow: 'Drilling · slides 158–160',
  sub: 'Drilling alone leaves a hole that is off position, tilted, oversize, out of round and rough. Add centring, boring and reaming one at a time and watch each error shrink.',
  blurb: 'The hole-making sequence: what drilling alone gets wrong and what centring, boring and reaming each correct.',
  qs: ['2023-24_6b', '2018-19_5b', '2013-14_5c', '2011-12_5d', '2009-10_7a'],
  params: { stage: 0, mismatch: 0.3, overhang: 50, rel: 0 },

  build({ THREE: T, scene, P, kit }) {
    const M = kit.M;
    const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
    const W = 46, TH = 40, ZB = 23, RN = 6; // block width, thickness, half-depth, nominal hole radius (mm)
    const EXP = 8, EXR = 25, EXS = 20, EXB = 6; // exaggeration: position, roundness, size, burr
    const PLATE_X = W / 2 + 26;

    /* ---------------- sequences and error model ---------------- */
    const SEQ = [['drill'], ['centre', 'drill'], ['centre', 'drill', 'ream'], ['centre', 'drill', 'bore'], ['centre', 'drill', 'bore', 'ream']];
    const OPN = { centre: 'Centre drilling', drill: 'Drilling', bore: 'Boring', ream: 'Reaming' };
    const SEQN = ['Drilling only', 'Centre drill → drill', 'Centre → drill → ream', 'Centre → drill → bore', 'Centre → drill → bore → ream'];
    const stage = () => clamp(Math.round(P.stage), 0, 4);

    function runOps(list, k) {
      const oh = P.overhang / 60, mm = P.mismatch;
      const st = { hole: false, pilot: false, centred: false, loc: 0, str: 0, err: 0, rnd: 0, ra: 0, burr: 0, allow: 0 };
      for (let i = 0; i < k; i++) {
        const op = list[i], next = list[i + 1];
        if (op === 'centre') {
          st.pilot = true;
          st.centred = true;
          st.loc = 0.03 + 0.05 * mm;
        } else if (op === 'drill') {
          const c = st.centred;
          st.hole = true;
          st.loc = c ? 0.03 + 0.05 * mm + 0.02 * oh : 0.1 + 0.5 * oh + 0.2 * mm;
          st.str = (c ? 0.6 : 1) * (0.05 + 0.45 * mm * (0.5 + oh) + 0.25 * oh);
          st.err = 0.04 + 0.3 * mm * (c ? 0.7 : 1);
          st.allow = next === 'ream' ? 0.4 : next === 'bore' ? 1.0 : 0;
          st.rnd = 0.03 + 0.15 * mm * (c ? 0.7 : 1) + 0.06 * oh;
          st.ra = 6.3 + 5 * mm * (c ? 0.8 : 1);
          st.burr = 0.3;
        } else if (op === 'bore') {
          st.loc = 0.015;
          st.str = 0.01 + 0.06 * st.str;
          st.err = 0.02;
          st.allow = next === 'ream' ? 0.2 : 0;
          st.rnd = 0.012;
          st.ra = 1.6;
          st.burr = 0.05;
        } else if (op === 'ream') {
          st.err = 0.006;
          st.allow = 0;
          st.rnd = Math.max(0.004, 0.35 * st.rnd);
          st.ra = 0.8;
          st.burr = 0.02;
          st.str *= 0.9;
        }
      }
      return st;
    }
    const finalState = (s = stage()) => runOps(SEQ[s], SEQ[s].length);

    const axisX = (st, y) => {
      const u = clamp(-y / TH, 0, 1);
      return EXP * (st.loc + st.str * (1.4 * u - 0.4 * u * u));
    };
    // radius of the drawn hole at depth y and angle phi (phi = pi/2 right edge of the section, 3pi/2 left edge)
    function radius(st, y, phi, rough = true) {
      if (!st.hole) return Math.max(1.6, 4.5 - 0.58 * -y); // centre-drill pilot
      let r = RN - st.allow / 2 + (EXS * st.err) / 2 + ((EXR * st.rnd) / 2) * Math.cos(3 * phi + 0.7);
      if (rough) {
        const amp = st.ra * 0.045;
        r += amp * (0.7 * Math.sin((2 * Math.PI * -y) / 2.6 + 1.7 * phi) + 0.3 * Math.sin((2 * Math.PI * -y) / 0.9));
        r -= st.burr * EXB * Math.exp(-(TH + y) / 0.9);
      }
      return r;
    }

    /* ---------------- materials ---------------- */
    const faceM = new T.MeshStandardMaterial({ color: 0xe9edf0, metalness: 0.3, roughness: 0.5, side: T.DoubleSide });
    const sideM = new T.MeshStandardMaterial({ color: 0x8d979f, metalness: 0.4, roughness: 0.6 });
    const topM = new T.MeshStandardMaterial({ color: 0xaab3bb, metalness: 0.5, roughness: 0.45, side: T.DoubleSide });
    const wallM = new T.MeshStandardMaterial({ color: 0x6d767e, metalness: 0.5, roughness: 0.55, side: T.DoubleSide });
    const plateM = new T.MeshStandardMaterial({ color: 0xc4cbd1, metalness: 0.5, roughness: 0.45 });
    const hid = new T.MeshBasicMaterial({ visible: false });

    /* ---------------- main workpiece ---------------- */
    const mainG = new T.Group();
    scene.add(mainG);
    const boxMesh = new T.Mesh(new T.BoxGeometry(W, TH, ZB).translate(0, -TH / 2, -ZB / 2), [sideM, sideM, hid, sideM, hid, sideM]);
    const faceL = new T.Mesh(new T.BufferGeometry(), faceM);
    const faceR = new T.Mesh(new T.BufferGeometry(), faceM);
    const topMesh = new T.Mesh(new T.BufferGeometry(), topM);
    const wallMesh = new T.Mesh(new T.BufferGeometry(), wallM);
    const plate = new T.Mesh(new T.BufferGeometry(), plateM);
    const supports = [-1, 1].map((s) => {
      const m = new T.Mesh(new T.BoxGeometry(10, 8, ZB * 1.5), M.castIron);
      m.position.set(s * (W / 2 - 8), -TH - 4, -ZB / 2);
      return m;
    });
    mainG.add(boxMesh, faceL, faceR, topMesh, wallMesh, plate, ...supports);
    const toolG = new T.Group();
    const toolSpin = new T.Group();
    toolG.add(toolSpin);
    scene.add(toolG);

    const swap = (mesh, geo) => {
      mesh.geometry.dispose();
      mesh.geometry = geo;
    };
    const HS = { st: runOps([], 0), blind: false, Td: TH, k: 0 };

    function rebuildHole(st) {
      HS.st = st;
      const pilot = st.pilot && !st.hole;
      const has = st.hole || pilot;
      HS.blind = pilot;
      HS.Td = pilot ? 9 : TH;
      const Td = HS.Td;
      const NY = pilot ? 24 : 64;
      const rows = [];
      for (let j = 0; j <= NY; j++) rows.push([(-Td * j) / NY, 1]);
      if (pilot) rows.push([-Td - 1.0, 0]);
      // ---- section face(s)
      if (!has) {
        const sh = new T.Shape([new T.Vector2(-W / 2, 0), new T.Vector2(W / 2, 0), new T.Vector2(W / 2, -TH), new T.Vector2(-W / 2, -TH)]);
        swap(faceL, new T.ShapeGeometry(sh));
        swap(faceR, new T.BufferGeometry());
      } else {
        const L = [], Rr = [];
        for (const [y, k] of rows) {
          const xc = axisX(st, y);
          L.push(new T.Vector2(xc - k * radius(st, y, 1.5 * Math.PI), y));
          Rr.push(new T.Vector2(xc + k * radius(st, y, 0.5 * Math.PI), y));
        }
        if (pilot) {
          const poly = [new T.Vector2(-W / 2, 0), ...L, ...Rr.slice(0, -1).reverse(), new T.Vector2(W / 2, 0), new T.Vector2(W / 2, -TH), new T.Vector2(-W / 2, -TH)];
          swap(faceL, new T.ShapeGeometry(new T.Shape(poly)));
          swap(faceR, new T.BufferGeometry());
        } else {
          swap(faceL, new T.ShapeGeometry(new T.Shape([new T.Vector2(-W / 2, 0), ...L, new T.Vector2(-W / 2, -TH)])));
          swap(faceR, new T.ShapeGeometry(new T.Shape([new T.Vector2(W / 2, 0), ...Rr, new T.Vector2(W / 2, -TH)])));
        }
      }
      // ---- top face with the hole outline
      {
        const pts = [new T.Vector2(-W / 2, 0)];
        if (has) {
          pts.push(new T.Vector2(axisX(st, 0) - radius(st, 0, 1.5 * Math.PI, false), 0));
          for (let i = 1; i < 36; i++) {
            const phi = 1.5 * Math.PI - (Math.PI * i) / 36;
            const r = radius(st, 0, phi, false), xc = axisX(st, 0);
            pts.push(new T.Vector2(xc + r * Math.sin(phi), -r * Math.cos(phi)));
          }
          pts.push(new T.Vector2(axisX(st, 0) + radius(st, 0, 0.5 * Math.PI, false), 0));
        }
        pts.push(new T.Vector2(W / 2, 0), new T.Vector2(W / 2, ZB), new T.Vector2(-W / 2, ZB));
        const g = new T.ShapeGeometry(new T.Shape(pts));
        g.rotateX(-Math.PI / 2);
        swap(topMesh, g);
      }
      // ---- hole wall (back half)
      if (has) {
        const NP = 28, pos = [], idx = [];
        for (const [y, k] of rows) {
          const xc = axisX(st, y);
          for (let p = 0; p <= NP; p++) {
            const phi = 0.5 * Math.PI + (Math.PI * p) / NP, r = k * radius(st, y, phi);
            pos.push(xc + r * Math.sin(phi), y, r * Math.cos(phi));
          }
        }
        for (let j = 0; j < rows.length - 1; j++)
          for (let p = 0; p < NP; p++) {
            const a = j * (NP + 1) + p, b = a + NP + 1;
            idx.push(a, b, a + 1, b, b + 1, a + 1);
          }
        const g = new T.BufferGeometry();
        g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
        g.setIndex(idx);
        g.computeVertexNormals();
        swap(wallMesh, g);
      } else swap(wallMesh, new T.BufferGeometry());
      // ---- end view plate with the entry outline
      {
        const sh = new T.Shape([new T.Vector2(-20, -20), new T.Vector2(20, -20), new T.Vector2(20, 20), new T.Vector2(-20, 20)]);
        if (has) {
          const hole = [], xc = axisX(st, 0);
          for (let i = 0; i < 72; i++) {
            const phi = (2 * Math.PI * i) / 72, r = radius(st, 0, phi, false);
            hole.push(new T.Vector2(xc + r * Math.cos(phi), r * Math.sin(phi)));
          }
          sh.holes.push(new T.Path(hole));
        }
        const g = new T.ExtrudeGeometry(sh, { depth: 3, bevelEnabled: false, curveSegments: 12 });
        g.translate(PLATE_X, -TH / 2, 0);
        swap(plate, g);
      }
    }

    /* ---------------- tools ---------------- */
    function disposeGroup(g) {
      g.traverse((o) => o.geometry?.dispose());
      g.clear();
    }
    function makeTool(op, st) {
      disposeGroup(toolSpin);
      const R = RN - st.allow / 2;
      if (op === 'centre') {
        toolSpin.add(kit.at(kit.cyl(0.01, 1.2, M.carbide, { rTop: 1.6 }), 0, 0.6, 0), kit.at(kit.cyl(1.6, 3.8, M.carbide), 0, 3.1, 0), kit.at(kit.cyl(1.6, 5, M.carbide, { rTop: 4.5 }), 0, 7.5, 0), kit.at(kit.cyl(4.5, 50, M.hss), 0, 35, 0));
      } else if (op === 'drill') {
        const hc = R / Math.tan((59 * Math.PI) / 180);
        toolSpin.add(kit.at(kit.cyl(0.01, hc, M.carbide, { rTop: R }), 0, hc / 2, 0), kit.at(kit.cyl(R * 0.88, 40, M.hss), 0, hc + 20, 0), kit.at(kit.cyl(R, 25, M.steel), 0, hc + 52, 0));
        const fl = kit.helixTeeth(R * 0.9, 40, 2, M.steel, { helix: 0.58, width: R * 0.45, height: R * 0.45, segs: 16 });
        fl.position.y = hc + 20;
        toolSpin.add(fl);
      } else if (op === 'bore') {
        toolSpin.add(kit.at(kit.cyl(3.2, 55, M.steel), 0, 27.5, 0), kit.at(kit.box(R - 2.4, 2.4, 2, M.carbide), (2.4 + R) / 2, 1.2, 0));
      } else {
        toolSpin.add(kit.at(kit.cyl(R * 0.92, 1.5, M.hss, { rTop: R }), 0, 0.75, 0), kit.at(kit.cyl(R, 40, M.hss), 0, 21.5, 0), kit.at(kit.cyl(R * 0.8, 25, M.steel), 0, 54, 0));
        const fl = kit.helixTeeth(R * 0.98, 40, 6, M.carbide, { helix: 0, width: 0.9, height: 0.9, segs: 4 });
        fl.position.y = 21.5;
        toolSpin.add(fl);
      }
    }

    /* ---------------- related operations (static mini sections) ---------------- */
    const relG = new T.Group();
    relG.visible = false;
    scene.add(relG);
    const REL = [
      { name: 'Counterbore', desc: 'A larger diameter follows a smaller one partway into the hole, giving a stepped hole with a flat bottom. A bolt head sits in it and does not protrude.' },
      { name: 'Countersink', desc: 'Like counterboring, but the step is cone-shaped, to seat flat-head screws and bolts flush.' },
      { name: 'Spotface', desc: 'Similar to milling: a flat machined surface on a localised area, for example a seat for a nut or washer on a rough casting.' },
      { name: 'Tapping', desc: 'A tap cuts internal screw threads in an existing (tap-drill size) hole.' },
    ];
    const RX = [-48, -16, 16, 48];
    function miniShape(k) {
      const w = 13, d = 22;
      const P2 = (x, y) => new T.Vector2(x, y);
      let pts;
      if (k === 0) pts = [P2(-w, 0), P2(-5.5, 0), P2(-5.5, -6), P2(-3, -6), P2(-3, -d), P2(3, -d), P2(3, -6), P2(5.5, -6), P2(5.5, 0), P2(w, 0), P2(w, -d - 4), P2(-w, -d - 4)];
      else if (k === 1) pts = [P2(-w, 0), P2(-6, 0), P2(-3, -3.2), P2(-3, -d), P2(3, -d), P2(3, -3.2), P2(6, 0), P2(w, 0), P2(w, -d - 4), P2(-w, -d - 4)];
      else if (k === 2) pts = [P2(-w, 2.2), P2(-10, 3), P2(-8, 2.2), P2(-7, -1.2), P2(-3, -1.2), P2(-3, -d), P2(3, -d), P2(3, -1.2), P2(7, -1.2), P2(8, 2.2), P2(10, 3), P2(w, 2.4), P2(w, -d - 4), P2(-w, -d - 4)];
      else {
        pts = [P2(-w, 0), P2(-3.1, 0)];
        for (let y = -1; y > -d; y -= 1.2) pts.push(P2(-2.4, y), P2(-3.1, y - 0.6));
        pts.push(P2(-2.4, -d), P2(2.4, -d));
        const th = [];
        for (let y = -d; y < -0.5; y += 1.2) th.push(P2(2.4, y), P2(3.1, y + 0.6));
        pts.push(...th.reverse(), P2(3.1, 0), P2(w, 0), P2(w, -d - 4), P2(-w, -d - 4));
      }
      return new T.Shape(pts);
    }
    REL.forEach((r, k) => {
      const g = new T.ExtrudeGeometry(miniShape(k), { depth: 10, bevelEnabled: false });
      g.translate(0, 0, -10);
      const m = new T.Mesh(g, faceM);
      m.position.x = RX[k];
      relG.add(m);
      if (k === 0) {
        relG.add(kit.at(kit.cyl(5.2, 5, M.steel), RX[k], -3.4, -5), kit.at(kit.cyl(2.7, 18, M.steel), RX[k], -14, -5));
      } else if (k === 1) {
        relG.add(kit.at(kit.cyl(0.05, 3, M.steel, { rTop: 5.8 }), RX[k], -1.6, -5), kit.at(kit.cyl(2.7, 18, M.steel), RX[k], -12, -5));
      } else if (k === 2) {
        relG.add(kit.at(kit.cyl(6.5, 1.6, M.brass), RX[k], -0.4, -5), kit.at(kit.cyl(2.7, 14, M.steel), RX[k], -8.5, -5));
      }
    });

    /* ---------------- animation state ---------------- */
    const S = { k: 0, op: -1, t: 0, done: false, hold: 3, prevStep: '', spin: 0, toolOp: '', stageSeen: -1, mm: -1, oh: -1 };
    const DOP = { centre: 2.2, drill: 3.2, bore: 3.2, ream: 3.2 };
    function showK(k) {
      S.k = k;
      rebuildHole(runOps(SEQ[stage()], k));
    }
    const ease = (s) => s * s * (3 - 2 * s);

    const camMain = { position: [24, -16, 118], target: [24, -17, 0] };
    const camPlate = { position: [34, -18, 74], target: [32, -18, 0] };
    const camRel = { position: [0, -10, 132], target: [0, -11, 0] };

    const ctl = (id, key, label, min, max, step) =>
      `<div class="ctl-row"><label for="lab-${id}">${label}</label><output class="val" data-out="${key}"></output></div>
        <input id="lab-${id}" type="range" min="${min}" max="${max}" step="${step}" data-key="${key}">`;
    const quality = `<p class="ro">Position error <b data-ro="loc"></b> · straightness <b data-ro="str"></b> · size error <b data-ro="size"></b></p>
            <p class="ro">Out-of-round <b data-ro="rnd"></b> · surface roughness <b data-ro="ra"></b></p>`;
    const first = (s) => (P.stage = s);

    const steps = [
      {
        id: 'problem', chip: 'Drilling alone', group: 'The problem', eyebrow: 'Drilling · slide 159', title: 'Why not drill straight to size?',
        cam: camMain, onEnter: () => first(0),
        html: () => `
          <p>A twist drill is a poor tool for making an <mark>accurate</mark> hole. Drilling alone leaves:</p>
          <ul>
            <li><b>Wandering at entry</b>: the chisel edge has no guide, so the tip skates. The hole axis ends up <mark>off position</mark> and <mark>inclined</mark> (the red offset on the model).</li>
            <li><b>Oversize and out-of-round</b>: if the two lips are not ground equal in length and angle, one lip does more work and the hole comes out bigger and lobed.</li>
            <li><b>Rough wall</b>: feed marks and tearing, and a <b>burr</b> where the drill exits.</li>
          </ul>
          <div class="ctl">
            ${ctl('mm', 'mismatch', 'Lip-length / angle mismatch', 0, 1, 0.05)}
            ${ctl('oh', 'overhang', 'Drill overhang (stick-out)', 20, 100, 5)}
            ${quality}
          </div>
          <p class="note">Errors on the model are exaggerated (×8 for position, ×25 for size and roundness); the numbers are real.</p>
          <p class="exam">Asked: TF 2011-12 Q.5(d).</p>
          <p class="key"><span class="key-tag">Remember</span>Drilling only: off-centre, tilted, oversize, out-of-round, rough. So drilling is a roughing step.</p>`,
      },
      {
        id: 'sequence', chip: 'The sequence', group: 'The sequence', eyebrow: 'Drilling · slide 159', title: 'Add operations one at a time',
        cam: camMain, onEnter: () => first(4),
        html: () => `
          <p>The sequence for a hole accurate in size and aligned on centre: <mark>centre drill → drill → bore → ream</mark>. Move the slider, or pick a sequence, and watch each operation run.</p>
          <div class="ctl">
            ${ctl('st', 'stage', 'Sequence', 0, 4, 1)}
            <div class="presets"><button class="pbtn" type="button" data-set="stage:0">Drill only</button><button class="pbtn" type="button" data-set="stage:1">+ Centre</button><button class="pbtn" type="button" data-set="stage:2">Ream, no bore</button><button class="pbtn" type="button" data-set="stage:3">Bore, no ream</button><button class="pbtn" type="button" data-set="stage:4">Full</button></div>
            <p class="ro">Operations: <b data-ro="ops"></b></p>
            ${quality}
          </div>
          <p class="key"><span class="key-tag">Remember</span>Each operation fixes something different: centring = location, drilling = bulk removal, boring = position and straightness, reaming = size and finish.</p>`,
      },
      {
        id: 'centre', chip: 'Centring', group: 'The sequence', eyebrow: 'Drilling · slide 158', title: 'Centring (centre drilling)',
        cam: camMain, onEnter: () => first(1),
        html: () => `
          <p>Centring drills a <mark>starting hole to accurately establish its location</mark> for the drilling that follows. The tool is a <b>centre drill</b>: short and stiff, with a tiny pilot and a 60° cone.</p>
          <div class="ctl">
            <div class="seg"><button type="button" data-set="stage:0">Without centring</button><button type="button" data-set="stage:1">With centre drill</button></div>
            <p class="ro">Position error <b data-ro="loc"></b> · straightness <b data-ro="str"></b></p>
          </div>
          <ul>
            <li>Being short, it cannot bend or skate, so the pilot is placed exactly.</li>
            <li>The pilot's cone guides the drill's chisel edge into the right place, <b>preventing walking</b>.</li>
            <li>It <b>locates</b> the hole but removes almost no metal.</li>
          </ul>
          <p class="key"><span class="key-tag">Remember</span>Centre drill: locates the hole and stops the drill from walking.</p>`,
      },
      {
        id: 'drill', chip: 'Drilling', group: 'The sequence', eyebrow: 'Drilling · slide 159', title: 'Drilling removes the bulk, undersize',
        cam: camMain, onEnter: () => first(3),
        html: () => `
          <p>The twist drill removes most of the metal quickly. Because it is not accurate, it is chosen <mark>smaller than the final size</mark>, leaving an allowance for the finishing tool.</p>
          <div class="ctl">
            <div class="seg"><button type="button" data-set="stage:1">Drill to size</button><button type="button" data-set="stage:2">Then ream</button><button type="button" data-set="stage:3">Then bore</button></div>
            <p class="ro">Drill diameter = <b data-ro="drillD"></b> for a Ø12 finished hole · allowance left = <b data-ro="allow"></b></p>
            ${ctl('mm', 'mismatch', 'Lip mismatch', 0, 1, 0.05)}
          </div>
          <ul>
            <li>Typical allowance: about 0.4 mm for reaming, about 1 mm for boring.</li>
            <li>Uneven lips still make the drilled hole oversize and lobed; the allowance absorbs this.</li>
          </ul>
          <p class="key"><span class="key-tag">Remember</span>Drill = roughing: fast, but undersize and inaccurate on purpose.</p>`,
      },
      {
        id: 'bore', chip: 'Boring', group: 'The sequence', eyebrow: 'Drilling · slide 158', title: 'Boring corrects position and straightness',
        cam: camMain, onEnter: () => first(3),
        html: () => `
          <p>A <mark>boring tool enters axially</mark> and cuts along the internal surface of an existing hole to enlarge it or obtain more precise dimensions. It is a <b>single-point tool</b> set to size with an adjustable boring head.</p>
          <div class="ctl">
            <div class="seg"><button type="button" data-set="stage:2">Ream only</button><button type="button" data-set="stage:3">Bore</button></div>
            <p class="ro">Position error <b data-ro="loc"></b> · straightness <b data-ro="str"></b> · roundness <b data-ro="rnd"></b></p>
          </div>
          <ul>
            <li>The cutter circles the <b>spindle axis</b>, not the old hole, so it cuts the hole concentric with the machine axis: <b>position and straightness are corrected</b>.</li>
            <li>The red line is the spindle axis; the amber line is the drilled hole axis.</li>
          </ul>
          <p class="key"><span class="key-tag">Remember</span>Boring follows the spindle axis, so it can move the hole back onto position.</p>`,
      },
      {
        id: 'ream', chip: 'Reaming', group: 'The sequence', eyebrow: 'Drilling · slide 158', title: 'Reaming gives size and finish',
        cam: camMain, onEnter: () => first(4),
        html: () => `
          <p><mark>Reaming slightly enlarges a hole</mark>, provides better tolerance on its diameter and improves its surface finish. The <b>reamer</b> usually has straight flutes and takes a very small allowance.</p>
          <div class="ctl">
            <div class="seg"><button type="button" data-set="stage:3">Bore only</button><button type="button" data-set="stage:4">Bore + ream</button></div>
            <p class="ro">Size error <b data-ro="size"></b> · roundness <b data-ro="rnd"></b> · roughness <b data-ro="ra"></b></p>
          </div>
          <ul>
            <li>It <b>follows the existing hole</b>, so a reamer cannot fix position or straightness. Set the stage to <button class="pbtn" type="button" data-set="stage:2">Ream, no bore</button> and the location error stays.</li>
            <li>That is why boring comes before reaming when location matters.</li>
          </ul>
          <p class="key"><span class="key-tag">Remember</span>Reaming: size, roundness and finish only. Position and straightness must be right before it.</p>`,
      },
      {
        id: 'related', chip: 'Related operations', group: 'More', eyebrow: 'Drilling · slides 158–159', title: 'Operations related to drilling',
        cam: camRel, plot: false,
        html: () => `
          <p>Four more operations that are done on or around a drilled hole. Pick one.</p>
          <div class="ctl">
            <div class="seg"><button type="button" data-set="rel:0">Counterbore</button><button type="button" data-set="rel:1">Countersink</button><button type="button" data-set="rel:2">Spotface</button><button type="button" data-set="rel:3">Tapping</button></div>
            <p><b data-ro="relname"></b>: <span data-ro="reldesc"></span></p>
          </div>
          <p class="exam">Asked: TF 2013-14 Q.5(c) (boring, reaming, countersinking).</p>`,
      },
      {
        id: 'answer', chip: 'Exam answer', group: 'Exam', eyebrow: 'Model answer', title: 'Sequence to make an accurate hole',
        cam: camMain, onEnter: () => first(4),
        html: () => `
          <p><b>Sequence:</b> centring → drilling → boring → reaming.</p>
          <ol class="steps">
            <li><b>Centring</b>: a short, stiff centre drill makes a starting hole that locates the hole and stops the drill walking.</li>
            <li><b>Drilling</b>: a twist drill, smaller than final size, removes the bulk of the metal.</li>
            <li><b>Boring</b>: a single-point tool, set by the boring head, corrects position, straightness and roundness because it follows the spindle axis.</li>
            <li><b>Reaming</b>: a multi-tooth reamer with a small allowance gives the final diameter tolerance and surface finish.</li>
          </ol>
          <p><b>Why not drill only?</b> The drill wanders at entry (off-position, tilted hole), uneven lips make it oversize and out of round, the wall is rough and has burrs. Each later operation removes one of those errors.</p>
          <p class="ro">Full sequence on this model: position <b data-ro="loc"></b>, size error <b data-ro="size"></b>, out-of-round <b data-ro="rnd"></b>, Ra <b data-ro="ra"></b></p>
          <p class="key"><span class="key-tag">Sketch</span>Draw the four tools in order with the hole section after each.</p>`,
      },
    ];

    /* ---------------- helpers for HUD and readouts ---------------- */
    const fx = (v, n) => v.toFixed(n);
    const grades = (f) => ({
      loc: f.loc < 0.05 ? 0 : f.loc < 0.2 ? 1 : 2,
      str: f.str < 0.03 ? 0 : f.str < 0.15 ? 1 : 2,
      size: Math.abs(f.err) < 0.02 ? 0 : Math.abs(f.err) < 0.1 ? 1 : 2,
      rnd: f.rnd < 0.015 ? 0 : f.rnd < 0.06 ? 1 : 2,
      ra: f.ra < 1.6 ? 0 : f.ra < 3.2 ? 1 : 2,
    });
    const NAMES = { loc: 'Position', str: 'Straightness', size: 'Size', rnd: 'Roundness', ra: 'Finish' };

    function planePt(st, y) {
      return [axisX(st, y), y, 0.2];
    }

    return {
      legend: [['var(--v)', 'Machine spindle axis'], ['var(--accent)', 'Actual hole axis']],
      steps,
      live: true,

      onParam() {
        S.stageSeen = -2; // force a refresh in update
      },

      update(dt, t, stepId) {
        const s = stage();
        const changed = S.stageSeen !== s || S.mm !== P.mismatch || S.oh !== P.overhang || S.prevStep !== stepId;
        if (changed) {
          S.stageSeen = s;
          S.mm = P.mismatch;
          S.oh = P.overhang;
          S.prevStep = stepId;
          S.op = -1;
          S.hold = 3;
          showK(SEQ[s].length);
        }
        const rel = stepId === 'related';
        mainG.visible = !rel;
        relG.visible = rel;
        const list = SEQ[s];
        if (S.op === -1) {
          toolG.visible = false;
          if (dt > 0) {
            S.hold -= dt;
            if (S.hold <= 0) {
              S.op = 0;
              S.t = 0;
              S.done = false;
              showK(0);
            }
          }
        } else if (dt > 0) {
          const op = list[S.op];
          const dur = DOP[op];
          S.t += dt;
          const ph = S.t / dur;
          if (S.toolOp !== `${s}:${S.op}:${P.mismatch}:${P.overhang}`) {
            S.toolOp = `${s}:${S.op}:${P.mismatch}:${P.overhang}`;
            makeTool(op, runOps(list, S.op + 1));
          }
          const after = runOps(list, S.op + 1);
          const depth = op === 'centre' ? 5 : TH + (op === 'drill' ? 8 : 6);
          const prog = ph < 0.45 ? ease(ph / 0.45) : ph < 0.55 ? 1 : 1 - ease((ph - 0.55) / 0.45);
          const tipY = 12 - prog * (12 + depth);
          let x = 0, tilt = 0;
          if (op === 'drill' || op === 'ream') {
            x = axisX(after, clamp(tipY, -TH, 0));
            tilt = Math.atan2(axisX(after, -TH) - axisX(after, 0), TH);
          } else if (op === 'centre') x = axisX(after, 0);
          toolG.position.set(x, tipY, 0);
          toolG.rotation.z = -tilt;
          toolG.visible = true;
          S.spin += dt * 9;
          toolSpin.rotation.y = S.spin;
          if (!S.done && ph >= 0.5) {
            S.done = true;
            showK(S.op + 1);
          }
          if (ph >= 1) {
            S.op++;
            S.t = 0;
            S.done = false;
            if (S.op >= list.length) {
              S.op = -1;
              S.hold = 3;
            }
          }
        }
      },

      overlay(d, step) {
        if (step === 'related') {
          REL.forEach((r, k) => {
            d.label([RX[k], 8, 0], r.name, k === Math.round(P.rel) ? 'hl' : 'minor');
          });
          const k = clamp(Math.round(P.rel), 0, 3), x = RX[k];
          d.path([[x - 14, 2, 1], [x + 14, 2, 1], [x + 14, -27, 1], [x - 14, -27, 1]], 'arc', { closed: true });
          return;
        }
        const st = HS.st;
        // spindle axis
        d.line([0, 14, 0.3], [0, -TH - 6, 0.3], 'vline');
        d.label([0, 17, 0.3], 'spindle axis', 'v', 0, 0);
        if (!(st.hole || st.pilot)) return;
        if (st.hole) {
          const pts = [];
          for (let i = 0; i <= 8; i++) pts.push(planePt(st, (-TH * i) / 8));
          d.path(pts, 'hx');
          const e0 = axisX(st, 0), e1 = axisX(st, -TH);
          if (Math.abs(e0) > 0.05) d.dim([0, 3, 0.3], [e0, 3, 0.3], `position e = ${st.loc.toFixed(2)} mm`, [0, 4, 0]);
          if (Math.abs(e1 - e0) > 0.2) d.dim([e0, -TH - 3, 0.3], [e1, -TH - 3, 0.3], `drift ${st.str.toFixed(2)} mm`, [0, -3, 0]);
          const r = radius(st, -TH / 2, 0.5 * Math.PI, false), xc = axisX(st, -TH / 2);
          d.dim([xc - radius(st, -TH / 2, 1.5 * Math.PI, false), -TH / 2, 0.3], [xc + r, -TH / 2, 0.3], `Ø ${(2 * RN - st.allow + st.err).toFixed(2)}`, [0, 0, 0]);
          d.label([xc + r + 11, -TH * 0.78, 0.3], `Ra ${st.ra.toFixed(1)} µm`, 'minor');
          // end view: nominal circle and cross-hair
          const ring = [];
          for (let i = 0; i <= 48; i++) {
            const a = (2 * Math.PI * i) / 48;
            ring.push([PLATE_X + RN * Math.cos(a), -TH / 2 + RN * Math.sin(a), 3.2]);
          }
          d.path(ring, 'ref');
          d.line([PLATE_X - 12, -TH / 2, 3.2], [PLATE_X + 12, -TH / 2, 3.2], 'cl');
          d.line([PLATE_X, -TH / 2 - 12, 3.2], [PLATE_X, -TH / 2 + 12, 3.2], 'cl');
          d.label([PLATE_X, -TH / 2 - 24, 3.2], `end view · round ${st.rnd.toFixed(3)} mm`, 'minor');
          d.label([PLATE_X, -TH / 2 + 25, 3.2], 'dashed = ideal Ø12 hole', 'minor');
        } else {
          d.label([0, -TH * 0.4, 0.3], 'centre-drill pilot (location only)', 'minor', 40, 0);
        }
      },

      hud() {
        const f = finalState();
        const gr = grades(f);
        const poor = Object.keys(gr).filter((k) => gr[k] === 2);
        const good = Object.keys(gr).filter((k) => gr[k] === 0);
        const status = S.op >= 0 ? `Now: ${OPN[SEQ[stage()][S.op]]}` : `${SEQN[stage()]}`;
        let verdict;
        if (poor.length === 0 && good.length >= 4) verdict = ['Accurate hole: position, size and finish', 'ok'];
        else if (poor.length >= 3) verdict = ['Poor hole: wanders, oversize, rough', 'bad'];
        else verdict = [`Weakest: ${NAMES[poor[0] || Object.keys(gr).find((k) => gr[k] === 1)]}`, 'warn'];
        return {
          status,
          statusCls: S.op >= 0 ? 'f' : '',
          rows: [
            ['Position error', `${fx(f.loc, 3)} mm`],
            ['Straightness', `${fx(f.str, 3)} mm / 40`],
            ['Size error', `${f.err >= 0 ? '+' : ''}${fx(f.err, 3)} mm`],
            ['Out-of-round', `${fx(f.rnd, 3)} mm`],
            ['Roughness Ra', `${fx(f.ra, 1)} µm`],
          ],
          verdict,
        };
      },

      readouts() {
        const f = finalState();
        const gr = grades(f);
        const tag = (g) => (g === 0 ? ' (good)' : g === 1 ? ' (fair)' : ' (poor)');
        const rr = REL[clamp(Math.round(P.rel), 0, 3)];
        const after = runOps(SEQ[stage()], 2);
        return {
          loc: fx(f.loc, 3) + ' mm' + tag(gr.loc),
          str: fx(f.str, 3) + ' mm' + tag(gr.str),
          size: `${f.err >= 0 ? '+' : ''}${fx(f.err, 3)} mm` + tag(gr.size),
          rnd: fx(f.rnd, 3) + ' mm' + tag(gr.rnd),
          ra: fx(f.ra, 1) + ' µm' + tag(gr.ra),
          ops: SEQN[stage()],
          drillD: `Ø${fx(2 * RN - after.allow + after.err, 2)} mm`,
          allow: `${fx(after.allow, 1)} mm`,
          relname: rr.name,
          reldesc: rr.desc,
        };
      },

      format(key, v) {
        if (key === 'mismatch') return `${Math.round(v * 100)} %`;
        if (key === 'overhang') return `${v} mm`;
        if (key === 'stage') return SEQN[clamp(Math.round(v), 0, 4)];
        return null;
      },

      plot(g, w, h, c) {
        const m = { l: 28, r: 8, t: 10, b: 22 };
        const pw = w - m.l - m.r, ph = h - m.t - m.b;
        const f0 = finalState(0);
        const series = [
          ['loc', c.v, (f) => f.loc / f0.loc],
          ['rnd', c.f, (f) => f.rnd / f0.rnd],
          ['ra', c.d, (f) => f.ra / f0.ra],
        ];
        g.strokeStyle = c.muted;
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(m.l, m.t);
        g.lineTo(m.l, m.t + ph);
        g.lineTo(m.l + pw, m.t + ph);
        g.stroke();
        const X = (s) => m.l + (pw * s) / 4;
        const Y = (v) => m.t + ph - ph * clamp(v, 0, 1);
        for (const [, col, fn] of series) {
          g.strokeStyle = col;
          g.fillStyle = col;
          g.lineWidth = 1.8;
          g.beginPath();
          for (let s = 0; s <= 4; s++) {
            const x = X(s), y = Y(fn(finalState(s)));
            if (s) g.lineTo(x, y);
            else g.moveTo(x, y);
          }
          g.stroke();
          for (let s = 0; s <= 4; s++) {
            g.beginPath();
            g.arc(X(s), Y(fn(finalState(s))), s === stage() ? 4 : 2, 0, Math.PI * 2);
            g.fill();
          }
        }
        g.strokeStyle = c.accent;
        g.setLineDash([3, 3]);
        g.beginPath();
        g.moveTo(X(stage()), m.t);
        g.lineTo(X(stage()), m.t + ph);
        g.stroke();
        g.setLineDash([]);
        g.fillStyle = c.muted;
        g.fillText('0', m.l - 4, h - 8);
        g.fillText('stage 1 2 3 4', m.l + 14, h - 8);
        g.fillStyle = c.v;
        g.fillText('pos', m.l + 4, m.t + 10);
        g.fillStyle = c.f;
        g.fillText('round', m.l + 30, m.t + 10);
        g.fillStyle = c.d;
        g.fillText('Ra', m.l + 72, m.t + 10);
        return 'Error relative to drilling alone';
      },

      dispose() {
        disposeGroup(toolSpin);
      },
    };
  },
};
