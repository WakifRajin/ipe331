// Effect lab: point angle, feed and drilling time. A half-sectioned workpiece is drilled by a twist drill whose point angle can
// be changed. Units are millimetres of the real job; the animation is a time-lapse of the real drilling time (shown on the timer).
//   N = 1000 V / (pi D)   fr = f N   A = 0.5 D tan(90 - theta/2)   Tm = (t + A [+ overtravel]) / fr   MRR = (pi D^2 / 4) fr
export default {
  id: 'drill-point',
  chapter: 'drilling',
  title: 'Point angle, feed and drilling time',
  eyebrow: 'Drilling · slides 165–170',
  sub: 'Drill a sectioned block and see how speed varies along the lip, why the point adds an approach allowance, and how time and MRR follow from D, V, f, depth and point angle.',
  blurb: 'Cutting speed along the lip, feed per tooth, the approach allowance set by the point angle, drilling time and MRR for blind and through holes.',
  qs: ['2023-24_5b', '2022-23_5b', '2021-22_3c', '2017-18_6c', '2018-19_5c', '2012-13_6c'],
  params: { D: 25, V: 44, f: 0.25, t: 60, theta: 120, holeType: 'blind', over: 5, nHoles: 15, hardness: 45, core: 0, Dh: 12 },

  build(ctx) {
    const { THREE: T, scene, P, kit, renderer } = ctx;
    const M = kit.M;
    const DEG = Math.PI / 180;
    const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
    renderer.localClippingEnabled = true;
    const GAP = 14; // tip starts this far above the surface

    /* ---------------- physics ---------------- */
    function calc() {
      const D = P.D, R = D / 2;
      const th = clamp(P.theta, 60, 150); // model limit; the slider runs 80-140
      const h = (th * DEG) / 2, tn = Math.tan(h);
      const A = 0.5 * D * Math.tan((90 - th / 2) * DEG);
      const N = (1000 * P.V) / (Math.PI * D);
      const fr = P.f * N;
      const through = P.holeType === 'through';
      const over = through ? P.over : 0;
      const travel = P.t + A + over;
      const Tm = travel / fr; // min per hole
      const n = Math.max(1, Math.round(P.nHoles));
      const core = P.core >= 0.5;
      const Dh = core ? clamp(P.Dh, 0, D - 2) : 0;
      return { D, R, th, h, tn, A, N, fr, fz: P.f / 2, through, over, travel, Tm, n, tot: n * Tm, core, Dh, dcut: (D - Dh) / 2, mrr: (Math.PI / 4) * (D * D - Dh * Dh) * fr, Vmax: P.V };
    }
    const recAngle = () => 90 + 0.5 * P.hardness;
    const band = () => {
      const d = clamp(P.theta, 60, 150) - recAngle();
      return d < -10 ? 'sharp' : d > 10 ? 'flat' : 'ok';
    };
    const verdict = () => {
      const d = clamp(P.theta, 60, 150) - recAngle();
      if (Math.abs(d) <= 10) return ['Point angle suits this hardness', 'ok'];
      if (d < 0) return [Math.abs(d) > 25 ? 'Far too sharp: weak corners wear, the tip wanders' : 'Sharper than needed: aggressive, but the tip wanders', Math.abs(d) > 25 ? 'bad' : 'warn'];
      return [d > 25 ? 'Far too flat: high thrust, chatter, long chisel' : 'Flatter than needed: more thrust, stronger corners', d > 25 ? 'bad' : 'warn'];
    };
    const hardLabel = (v) => (v < 25 ? 'soft (Al, brass)' : v < 55 ? 'medium (mild steel)' : v < 80 ? 'hard (alloy steel)' : 'very hard (hardened)');

    /* ---------------- materials ---------------- */
    const wallM = new T.MeshStandardMaterial({ color: 0x6d767e, metalness: 0.5, roughness: 0.55, side: T.DoubleSide });
    const coneM = wallM.clone();
    const preM = wallM.clone();
    const topM = new T.MeshStandardMaterial({ color: 0xaab3bb, metalness: 0.5, roughness: 0.45, side: T.DoubleSide });
    const sideM = new T.MeshStandardMaterial({ color: 0x8d979f, metalness: 0.4, roughness: 0.6 });
    const faceM = new T.MeshStandardMaterial({ color: 0xe9edf0, metalness: 0.3, roughness: 0.5, side: T.DoubleSide });
    const hid = new T.MeshBasicMaterial({ visible: false });
    const ghostM = new T.MeshStandardMaterial({ color: M.dColor, transparent: true, opacity: 0.4, roughness: 0.4 });
    const planeBottom = new T.Plane(new T.Vector3(0, 1, 0), 0); // keeps y >= -H
    const planeCone = new T.Plane(new T.Vector3(0, 1, 0), 0); // keeps y >= yc
    const planePre = new T.Plane(new T.Vector3(0, -1, 0), 0); // keeps y <= yc
    wallM.clippingPlanes = [planeBottom];
    coneM.clippingPlanes = [planeBottom, planeCone];
    preM.clippingPlanes = [planeBottom, planePre];

    /* ---------------- workpiece ---------------- */
    const work = new T.Group();
    scene.add(work);
    let W = 100, Zb = 50, H = 80;
    const faceGeo = new T.BufferGeometry();
    const facePos = new Float32Array(30 * 3);
    faceGeo.setAttribute('position', new T.BufferAttribute(facePos, 3));
    faceGeo.setAttribute('normal', new T.BufferAttribute(new Float32Array(30 * 3).map((v, i) => (i % 3 === 2 ? 1 : 0)), 3));
    const face = new T.Mesh(faceGeo, faceM);
    face.frustumCulled = false;
    const boxMesh = new T.Mesh(new T.BufferGeometry(), [sideM, sideM, hid, sideM, hid, sideM]);
    const NANG = 72;
    let topOuter = [], topAng = [];
    const top = new T.Mesh(new T.BufferGeometry(), topM);
    top.frustumCulled = false;
    const wallCyl = new T.Mesh(new T.BufferGeometry(), wallM);
    const wallCone = new T.Mesh(new T.BufferGeometry(), coneM);
    const wallPre = new T.Mesh(new T.BufferGeometry(), preM);
    const par1 = new T.Mesh(new T.BoxGeometry(10, 10, 10), M.castIron);
    const par2 = new T.Mesh(new T.BoxGeometry(10, 10, 10), M.castIron);
    const ghost = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 40).translate(0, 0.5, 0), ghostM);
    ghost.visible = false;
    work.add(face, boxMesh, top, wallCyl, wallCone, wallPre, par1, par2, ghost);

    function swap(mesh, geo) {
      mesh.geometry.dispose();
      mesh.geometry = geo;
    }
    function buildBlock() {
      const c = calc();
      W = Math.round(3.2 * c.D + 36);
      Zb = W / 2;
      H = c.through ? P.t : P.t + 0.65 * c.D + 8;
      planeBottom.constant = H;
      swap(boxMesh, new T.BoxGeometry(W, H, Zb).translate(0, -H / 2, -Zb / 2));
      // top face: fan strip between a dynamic inner semicircle and a fixed outer rectangle boundary
      const corner = Math.atan2(Zb, W / 2);
      topAng = [];
      for (let i = 0; i <= NANG; i++) topAng.push((Math.PI * i) / NANG);
      topAng.push(corner, Math.PI - corner);
      topAng.sort((a, b) => a - b);
      topOuter = topAng.map((a) => {
        const ca = Math.cos(a), sa = Math.sin(a);
        const rho = Math.min(Math.abs(ca) > 1e-9 ? W / 2 / Math.abs(ca) : 1e9, sa > 1e-9 ? Zb / sa : 1e9);
        return [rho * ca, -rho * sa];
      });
      const g = new T.BufferGeometry();
      const nv = (topAng.length - 1) * 6;
      g.setAttribute('position', new T.BufferAttribute(new Float32Array(nv * 3), 3));
      g.setAttribute('normal', new T.BufferAttribute(new Float32Array(nv * 3).map((v, i) => (i % 3 === 1 ? 1 : 0)), 3));
      swap(top, g);
      // pre-existing hole (core drilling)
      const Rh = c.core ? Math.max(c.Dh / 2, 0.01) : 0.01;
      swap(wallPre, new T.CylinderGeometry(Rh, Rh, H, 40, 1, true, Math.PI / 2, Math.PI).translate(0, -H / 2, 0));
      wallPre.visible = c.core;
      // hole walls for the final diameter
      swap(wallCyl, new T.CylinderGeometry(c.R, c.R, 1, 48, 1, true, Math.PI / 2, Math.PI).translate(0, -0.5, 0));
      rebuildCone(c);
      par1.geometry.dispose();
      par2.geometry.dispose();
      par1.geometry = new T.BoxGeometry(14, 14, Zb * 1.6);
      par2.geometry = new T.BoxGeometry(14, 14, Zb * 1.6);
      par1.position.set(-W / 2 + 12, -H - 7, -Zb / 2);
      par2.position.set(W / 2 - 12, -H - 7, -Zb / 2);
      ghost.geometry.dispose();
      ghost.geometry = new T.CylinderGeometry(c.R, c.R, 1, 40).translate(0, 0.5, 0);
      ghost.position.set(W / 2 + c.R + 22, -0, -Zb / 2);
    }
    function rebuildCone(c) {
      // apex at the origin, base (full diameter) at y = +A
      const g = new T.CylinderGeometry(c.R, 0, c.A, 48, 1, true, Math.PI / 2, Math.PI);
      g.translate(0, c.A / 2, 0);
      swap(wallCone, g);
    }

    // state of the cut
    const S = { tip: -GAP, maxD: 0, phase: 'feed', dw: 0, hole: 0, spin: 0, sinceEmit: 0, prevStep: '', cumDone: 0 };

    function quad(o, x0, y0, x1, y1) {
      const p = facePos;
      const v = [x0, y0, x1, y0, x1, y1, x0, y0, x1, y1, x0, y1];
      for (let i = 0; i < 6; i++) {
        p[(o + i) * 3] = v[i * 2];
        p[(o + i) * 3 + 1] = v[i * 2 + 1];
        p[(o + i) * 3 + 2] = 0;
      }
      return o + 6;
    }
    function tri(o, x0, y0, x1, y1, x2, y2) {
      const p = facePos, v = [x0, y0, x1, y1, x2, y2];
      for (let i = 0; i < 3; i++) {
        p[(o + i) * 3] = v[i * 2];
        p[(o + i) * 3 + 1] = v[i * 2 + 1];
        p[(o + i) * 3 + 2] = 0;
      }
      return o + 3;
    }
    const G = { rs: 0, rb: 0, y1: 0, yb: 0, yc: 0, dc: 0 }; // geometry of the cut profile, for the overlay
    function updateWork(c) {
      const dt = Math.max(S.maxD, 0);
      const Rh = c.core ? Math.min(c.Dh / 2, c.R - 0.3) : 0;
      let rs, y1, yb, rb, yc;
      if (dt * c.tn <= Rh + 1e-6) {
        rs = Rh;
        rb = Rh;
        y1 = 0;
        yb = 0;
        yc = 0;
      } else {
        rs = Math.max(Rh, Math.min(c.R, dt * c.tn));
        y1 = Math.max(-Math.max(dt - c.A, 0), -H);
        yc = -dt + Rh / c.tn;
        yb = Math.min(Math.max(yc, -H), y1);
        rb = clamp((yb + dt) * c.tn, Rh, c.R);
      }
      G.rs = rs; G.rb = rb; G.y1 = y1; G.yb = yb; G.yc = yc; G.dc = dt - c.A;
      // section face: two outer strips, two side triangles, two lower blocks
      let o = 0;
      o = quad(o, -W / 2, -H, -rs, 0);
      o = quad(o, rs, -H, W / 2, 0);
      o = quad(o, -rs, -H, -rb, yb);
      o = quad(o, rb, -H, rs, yb);
      o = tri(o, -rs, y1, -rs, yb, -rb, yb);
      o = tri(o, rs, y1, rb, yb, rs, yb);
      faceGeo.attributes.position.needsUpdate = true;
      // top face
      const topG = top.geometry, tp = topG.attributes.position.array;
      let k = 0;
      for (let i = 0; i < topAng.length - 1; i++) {
        const a0 = topAng[i], a1 = topAng[i + 1];
        const ix0 = rs * Math.cos(a0), iz0 = -rs * Math.sin(a0), ix1 = rs * Math.cos(a1), iz1 = -rs * Math.sin(a1);
        const o0 = topOuter[i], o1 = topOuter[i + 1];
        const v = [ix0, iz0, o0[0], o0[1], o1[0], o1[1], ix0, iz0, o1[0], o1[1], ix1, iz1];
        for (let j = 0; j < 6; j++) {
          tp[k++] = v[j * 2];
          tp[k++] = 0;
          tp[k++] = v[j * 2 + 1];
        }
      }
      topG.attributes.position.needsUpdate = true;
      // walls
      const Lc = Math.max(dt - c.A, 0);
      wallCyl.visible = Lc > 1e-3;
      wallCyl.scale.y = Math.max(Lc, 1e-4);
      const s = clamp(dt / c.A, 0, 1);
      wallCone.visible = dt > 1e-3;
      wallCone.scale.set(Math.max(s, 1e-4), Math.max(s, 1e-4), Math.max(s, 1e-4));
      wallCone.position.y = -dt;
      planeCone.constant = -yc;
      planePre.constant = yc;
    }

    /* ---------------- drill ---------------- */
    const rig = new T.Group();
    const drill = new T.Group();
    rig.add(drill);
    scene.add(rig);
    const drillParts = new T.Group();
    drill.add(drillParts);
    function disposeGroup(g) {
      g.traverse((o) => o.geometry?.dispose());
      g.clear();
    }
    function buildDrill() {
      disposeGroup(drillParts);
      const c = calc();
      const Lf = P.t + c.A + c.over + 8;
      const cone = new T.Mesh(new T.CylinderGeometry(c.R, 0, c.A, 48).translate(0, c.A / 2, 0), M.carbide);
      const body = new T.Mesh(new T.CylinderGeometry(c.R * 0.86, c.R * 0.86, Lf, 40).translate(0, c.A + Lf / 2, 0), M.hss);
      const shank = new T.Mesh(new T.CylinderGeometry(c.R, c.R, 40, 40).translate(0, c.A + Lf + 20, 0), M.steel);
      const lands = kit.helixTeeth(c.R * 0.9, Lf, 2, M.steel, { helix: 0.58, width: c.D * 0.3, height: c.D * 0.3, segs: 24 });
      lands.position.y = c.A + Lf / 2;
      drillParts.add(cone, body, shank, lands);
      // the two cutting lips on the cone
      for (const sg of [1, -1]) {
        const lip = kit.tube([[0, 0.05, 0], [sg * c.R * 0.5, c.A * 0.5, 0], [sg * c.R * 1.0, c.A, 0]], Math.max(c.D * 0.025, 0.25), M.red, { seg: 8, radial: 6 });
        drillParts.add(lip);
      }
    }

    const chipSys = kit.chips(70, M.workCut);
    const SC = 45;
    chipSys.object.scale.setScalar(SC);
    scene.add(chipSys.object);

    /* ---------------- rebuild management ---------------- */
    let dirtyBlock = true, dirtyDrill = true;
    buildBlock();
    buildDrill();
    dirtyBlock = dirtyDrill = false;
    const hold = { speed: true, feed: true, approach: true };
    const holdDepth = (c) => Math.min(c.A + 6, c.travel);

    /* ---------------- cameras ---------------- */
    const camAt = (ty, dist, tx = 0, dx = 0.5, dy = 0.28, dz = 1) => {
      const l = Math.hypot(dx, dy, dz);
      return { position: [tx + (dx / l) * dist, ty + (dy / l) * dist, (dz / l) * dist], target: [tx, ty, 0] };
    };
    const camWhole = () => {
      const c = calc();
      return camAt(-c.travel * 0.25 + 22, (c.travel + 120) * 1.5);
    };
    const camTip = (k) => () => {
      const c = calc();
      return camAt(-holdDepth(c) + c.A * 0.4, Math.max(c.D * k, 55));
    };

    /* ---------------- HTML helpers ---------------- */
    const slider = (id, key, label, min, max, step) =>
      `<div class="ctl-row"><label for="lab-${id}">${label}</label><output class="val" data-out="${key}"></output></div>
        <input id="lab-${id}" type="range" min="${min}" max="${max}" step="${step}" data-key="${key}">`;
    const LAB = {
      D: (id) => slider(id, 'D', 'Drill diameter D', 5, 40, 0.1),
      V: (id) => slider(id, 'V', 'Cutting speed V', 10, 80, 1),
      f: (id) => slider(id, 'f', 'Feed per revolution f', 0.05, 0.6, 0.01),
      t: (id) => slider(id, 't', 'Hole depth t (full diameter)', 10, 100, 1),
    };

    const steps = [
      {
        id: 'cond', chip: 'Cutting conditions', group: 'Set-up', eyebrow: 'Drilling · slides 165–166', title: 'Cutting conditions in drilling',
        cam: camWhole,
        html: () => `
          <p>A twist drill has <mark>two symmetrical cutting edges</mark> (lips), each removing part of the material as a chip. The drill rotates at <b>N</b> and is fed down along its axis.</p>
          <div class="ctl">
            ${LAB.D('d')}
            ${LAB.V('v')}
            <p class="ro">N = 1000 V / (πD) = <b data-ro="N"></b> · feed motion fr = f N = <b data-ro="fr"></b></p>
          </div>
          <ul>
            <li><span class="tag-v">V</span> red: the rotation. The maximum cutting speed is <mark>V = πDN</mark> at the drill corner.</li>
            <li><span class="tag-f">f</span> blue: feed, along the drill axis, per revolution.</li>
            <li><span class="tag-d">d</span> green: <mark>depth of cut d = D/2</mark>, half the drill diameter (the radius that the lips remove).</li>
          </ul>
          <div class="ctl">
            <div class="ctl-row"><span>Operation</span></div>
            <div class="seg"><button type="button" data-set="core:0">Drilling a solid</button><button type="button" data-set="core:1">Core drilling</button></div>
            <div class="ctl-row"><label for="lab-dh">Existing hole Dhole</label><output class="val" data-out="Dh"></output></div>
            <input id="lab-dh" type="range" min="2" max="30" step="0.5" data-key="Dh">
            <p class="ro">Depth of cut d = <b data-ro="dcut"></b> · cutting area is the ring between Dhole and D</p>
          </div>
          <p class="key"><span class="key-tag">Remember</span>Solid drilling: d = D/2. Core drilling: d = ½ (Ddrill − Dhole).</p>`,
      },
      {
        id: 'speed', chip: 'V along the lip', group: 'Set-up', eyebrow: 'Drilling · slide 165', title: 'Cutting speed is not constant along the lip',
        cam: camTip(5.2), plot: false,
        html: () => `
          <p>A point on the lip at radius r moves at v = 2πrN. So V is <mark>zero at the centre</mark> of the drill and has a <mark>maximum at the corner</mark>, where r = D/2.</p>
          <div class="ctl">
            ${LAB.D('d')}
            ${LAB.V('v')}
            <p class="ro">Corner speed V = πDN = <b data-ro="vcorner"></b> · half way along the lip: <b data-ro="vhalf"></b> · at the centre: 0</p>
          </div>
          <ul>
            <li>The red arrows on the lip are the local cutting speeds; they grow in a straight line from the centre.</li>
            <li>That is why the <b>chisel edge</b> does not cut: near the centre the speed is almost nothing, so it scrapes and extrudes metal.</li>
            <li>The corner works hardest, so it wears first.</li>
          </ul>
          <p class="key"><span class="key-tag">Remember</span>Drilling: V = 0 at the centre, maximum V = πDN at the corner.</p>`,
      },
      {
        id: 'feed', chip: 'Feed per rev / tooth', group: 'Set-up', eyebrow: 'Drilling · slide 166', title: 'Feed per revolution and feed per tooth',
        cam: camTip(5.6), plot: false,
        html: () => `
          <p>Two kinds of feed are used. <mark>Feed per tooth fz</mark> is the thickness each lip takes in one revolution; feed per tooth is roughly proportional to drill diameter. <mark>Feed per minute fm</mark> adjusts the feed gears.</p>
          <p class="formula">fm = 2 fz N</p>
          <div class="ctl">
            ${LAB.f('f')}
            ${LAB.V('v')}
            <p class="ro">f = 2 fz = <b data-ro="f"></b> per rev, so fz = <b data-ro="fz"></b> per lip · fm = 2 fz N = <b data-ro="fr"></b></p>
          </div>
          <ul>
            <li>The drill has two lips, so the feed per revolution f is shared: f = 2 fz.</li>
            <li>The feed rate (the speed of the drill down the hole) is fr = f N, the same number as fm.</li>
          </ul>
          <p class="key"><span class="key-tag">Remember</span>Two teeth: f = 2 fz, and feed per minute fm = 2 fz N = f N.</p>`,
      },
      {
        id: 'approach', chip: 'Point angle & A', group: 'Effect', eyebrow: 'Drilling · slides 150, 167', title: 'The point adds an approach allowance',
        cam: camTip(4.6),
        html: () => `
          <p>The tip is a cone, so the drill must travel an extra distance <mark>A</mark> before it reaches full diameter. From the right triangle on the cone:</p>
          <p class="formula">A = ½ D tan(90° − θ/2)</p>
          <div class="ctl">
            <div class="ctl-row"><label for="lab-theta">Point angle θ</label><output class="val" data-out="theta"></output></div>
            <input id="lab-theta" type="range" min="80" max="140" step="1" data-key="theta">
            <div class="presets"><button class="pbtn" type="button" data-set="theta:90">90°</button><button class="pbtn" type="button" data-set="theta:118">118° general</button><button class="pbtn" type="button" data-set="theta:140">140°</button></div>
            ${LAB.D('d')}
            <div class="ctl-row"><label for="lab-hard">Work material hardness</label><output class="val" data-out="hardness"></output></div>
            <input id="lab-hard" type="range" min="0" max="100" step="1" data-key="hardness">
            <p class="ro">A = <b data-ro="A"></b> · suggested θ for this material ≈ <b data-ro="rec"></b></p>
          </div>
          <div class="duo">
            <div data-band="sharp"><h3>Sharper point (small θ)</h3><p>Long cone, larger A, more time. Cuts easily with low thrust, but the weak corners wear in hard metal and the tip wanders on the surface.</p></div>
            <div data-band="flat"><h3>Flatter point (large θ)</h3><p>Short cone, small A, less time. Stronger corners, less wandering, but more thrust. Suits harder material.</p></div>
          </div>
          <p class="note">General purpose is 118°: a balance between aggressive cutting and preventing the drill from wandering on the surface.</p>
          <p class="key"><span class="key-tag">Remember</span>θ up → A down. Harder material → larger θ; softer → sharper.</p>`,
      },
      {
        id: 'time', chip: 'Drilling time', group: 'Effect', eyebrow: 'Drilling · slides 167–168', title: 'Drilling time for one hole and for many',
        cam: camWhole,
        html: () => `
          <p>The drill must travel the hole depth t <b>plus</b> the approach allowance A. <mark>Convention: t is the depth at full diameter, so the cone tip goes A deeper</mark>. For a through hole the drill also needs an overtravel to clear the exit.</p>
          <p class="formula">Tm = (t + A) / fr  (blind) · Tm = (t + A + overtravel) / fr  (through)</p>
          <div class="ctl">
            <div class="seg"><button type="button" data-set="holeType:blind">Blind hole</button><button type="button" data-set="holeType:through">Through hole</button></div>
            ${LAB.t('t')}
            <div class="ctl-row"><label for="lab-over">Overtravel (through only)</label><output class="val" data-out="over"></output></div>
            <input id="lab-over" type="range" min="0" max="10" step="1" data-key="over">
            <div class="ctl-row"><label for="lab-n">Number of holes</label><output class="val" data-out="nHoles"></output></div>
            <input id="lab-n" type="range" min="1" max="30" step="1" data-key="nHoles">
            ${LAB.f('f')}
            <p class="ro">Travel = <b data-ro="travel"></b> · Tm per hole = <b data-ro="Tm"></b> · all holes = <b data-ro="tot"></b></p>
            <p class="ro">Live timer: <b data-ro="timer"></b></p>
          </div>
          <p class="note">The animation is a time-lapse; the timer shows real machine time, hole by hole.</p>`,
      },
      {
        id: 'mrr', chip: 'MRR', group: 'Effect', eyebrow: 'Drilling · slide 168', title: 'Material removal rate of a blind hole',
        cam: () => {
          const c = calc();
          return camAt(-c.travel * 0.2 + 20, (c.travel + 130) * 1.45, W / 4);
        },
        html: () => `
          <p>While the drill is cutting at full diameter, the hole cross-section area πD²/4 advances at the feed rate fr. In one minute the drill removes a cylinder (the green solid) of diameter D and length fr.</p>
          <ul>
            <li>Rotational speed: N = 1000 V / (πD)</li>
            <li>Feed rate: fr = f N</li>
            <li>Volume per minute: <mark>MRR = (πD²/4) · fr = (πD²/4) f N</mark></li>
            <li>Substituting N: MRR = 250 · D · V · f  (D in mm, V in m/min)</li>
          </ul>
          <div class="ctl">
            ${LAB.D('d')}
            ${LAB.f('f')}
            ${LAB.V('v')}
            <p class="ro">N = <b data-ro="N"></b> · fr = <b data-ro="fr"></b> · MRR = <b data-ro="mrr"></b> (check 250 D V f = <b data-ro="mrr2"></b>)</p>
          </div>
          <p class="note">For the whole blind hole the volume is πD²t/4 plus the cone πD²A/12, removed in (t + A)/fr; the rate quoted in the numerical is the steady rate πD²fr/4. Core drilling: MRR = π(D² − Dhole²) fr / 4.</p>
          <p class="exam">Asked: TF 2018-19 Q.5(c).</p>`,
      },
      {
        id: 'worked', chip: 'Worked problems', group: 'Exam', eyebrow: 'Drilling · slides 168–169', title: 'Past-paper numericals',
        cam: camWhole,
        html: () => `
          <p>Load a problem and compare the live numbers with the model answer. Point angle and hole type are applied too.</p>
          <div class="ctl">
            <div class="presets">
              <button class="pbtn" type="button" data-set="D:25,V:44,f:0.25,t:60,theta:120,holeType:blind,nHoles:15,core:0">Ø25 · 60 deep · 120° · 15 holes (2023-24 Q5b, 2012-13 Q6c)</button>
              <button class="pbtn" type="button" data-set="D:12.7,V:25,f:0.3,t:60,theta:118,holeType:blind,nHoles:1,core:0">Ø12.7 · 60 deep · 118° (2022-23 Q5b, 2017-18 Q6c)</button>
              <button class="pbtn" type="button" data-set="D:25.4,V:25,f:0.25,t:50,theta:100,holeType:blind,nHoles:1,core:0">Ø25.4 · 50 deep · 100° (2021-22 Q3c)</button>
            </div>
            <p class="ro">N = <b data-ro="N"></b> · fr = <b data-ro="fr"></b> · A = <b data-ro="A"></b></p>
            <p class="ro">Tm = <b data-ro="Tm"></b> per hole · <b data-ro="n"></b> hole(s): <b data-ro="tot"></b> · MRR = <b data-ro="mrr"></b></p>
          </div>
          <div class="table-wrap"><table class="cmp">
            <tr><th>Problem</th><th>N rpm</th><th>fr mm/min</th><th>A mm</th><th>Tm min</th><th>MRR mm³/min</th></tr>
            <tr><td>Ø25, 60, 120°, V44, f0.25</td><td>560.2</td><td>140.06</td><td>7.217</td><td>0.480 (15 holes: 7.20)</td><td>68 750</td></tr>
            <tr><td>Ø12.7, 60, 118°, V25, f0.30</td><td>626.6</td><td>188.0</td><td>3.815</td><td>0.339</td><td>23 810</td></tr>
            <tr><td>Ø25.4, 50, 100°, V25, f0.25</td><td>313.3</td><td>78.3</td><td>10.66</td><td>0.774</td><td>39 690</td></tr>
          </table></div>`,
      },
      {
        id: 'answer', chip: 'Exam answer', group: 'Exam', eyebrow: 'Model answer', title: 'MRR and drilling time',
        cam: camWhole,
        html: () => `
          <p><b>Ø25 hole, 60 deep, 1020 steel, V = 44 m/min, f = 0.25 mm/rev, θ = 120°, 15 holes</b></p>
          <ul>
            <li>N = 1000 V / (πD) = 1000 × 44 / (π × 25) = <b>560.2 rpm</b></li>
            <li>fr = f N = 0.25 × 560.2 = <b>140.06 mm/min</b></li>
            <li>A = ½ D tan(90° − θ/2) = 12.5 tan 30° = <b>7.217 mm</b></li>
            <li>Tm = (t + A) / fr = (60 + 7.217) / 140.06 = <b>0.480 min</b> per hole; 15 holes = <b>7.20 min</b></li>
            <li>MRR = (πD²/4) fr = 490.87 × 140.06 = <b>68 750 mm³/min</b></li>
          </ul>
          <p><b>MRR for a blind hole (2018-19):</b> N = 1000V/πD; feed rate fr = fN; area of the hole πD²/4 advances at fr, so MRR = (πD²/4) f N. The drill travels t + A, with A = ½ D tan(90° − θ/2), so Tm = (t + A)/fr.</p>
          <p class="key"><span class="key-tag">Remember</span>State the convention: t is the full-diameter depth and the cone adds A. Through hole: add overtravel.</p>`,
      },
    ];

    /* ---------------- animation ---------------- */
    function emitChips(c) {
      const a = S.spin;
      const x = Math.cos(a) * c.R * 0.9, z = Math.sin(a) * c.R * 0.9;
      chipSys.emit([x / SC, 1 / SC, z / SC], [(Math.cos(a + 0.6) * 14) / SC, 28 / SC, (Math.sin(a + 0.6) * 14) / SC]);
    }

    function reinit(isHold, c) {
      S.hole = 0;
      S.phase = 'feed';
      S.dw = 0;
      if (isHold) {
        S.tip = S.maxD = holdDepth(c);
      } else {
        S.tip = -GAP;
        S.maxD = 0;
      }
    }

    return {
      legend: [['var(--v)', 'Rotation V'], ['var(--f)', 'Feed f'], ['var(--d)', 'Depth of cut d']],
      steps,
      live: true,

      onParam(key) {
        if (key === 'D' || key === 't' || key === 'holeType' || key === 'core' || key === 'Dh' || key === 'over') dirtyBlock = true;
        if (key === 'D' || key === 'theta' || key === 't' || key === 'holeType' || key === 'over') dirtyDrill = true;
        if (key === 'theta') dirtyBlock = true; // cone wall
      },

      update(dt, t, stepId) {
        if (dirtyBlock || dirtyDrill) {
          if (dirtyBlock) buildBlock();
          if (dirtyDrill) buildDrill();
          dirtyBlock = dirtyDrill = false;
        }
        const c = calc();
        const isHold = !!hold[stepId];
        if (S.prevStep !== stepId || S.prevHold !== isHold) {
          S.prevStep = stepId;
          S.prevHold = isHold;
          reinit(isHold, c);
        }
        const omega = Math.min(((2 * Math.PI * c.N) / 60) * 0.06, 10);
        S.spin += dt * omega;
        let cutting = false;
        if (isHold) {
          S.tip = S.maxD = holdDepth(c);
          cutting = dt > 0;
        } else {
          const lapse = Math.max(3, (c.Tm * 60) / 10); // time-lapse factor
          if (S.phase === 'feed') {
            S.tip += (c.fr / 60) * lapse * dt;
            if (S.tip >= c.travel) {
              S.tip = c.travel;
              S.phase = 'up';
            }
            cutting = S.tip > 0 && dt > 0;
          } else if (S.phase === 'up') {
            S.tip -= 70 * dt;
            if (S.tip <= -GAP) {
              S.tip = -GAP;
              S.phase = 'dwell';
              S.dw = 0;
            }
          } else {
            S.dw += dt;
            if (S.dw > 0.7) {
              S.hole = (S.hole + 1) % c.n;
              S.maxD = 0;
              S.tip = -GAP;
              S.phase = 'feed';
            }
          }
          if (S.phase === 'feed') S.maxD = Math.max(S.maxD, S.tip);
          if (S.maxD > c.travel) S.maxD = c.travel;
        }
        rig.position.y = -S.tip;
        drill.rotation.y = -S.spin;
        updateWork(c);
        ghost.visible = stepId === 'mrr';
        ghost.scale.set(1, clamp(c.fr, 8, 300), 1);
        if (cutting) {
          S.sinceEmit += dt;
          while (S.sinceEmit > 0.05) {
            S.sinceEmit -= 0.05;
            emitChips(c);
          }
        }
        chipSys.update(dt);
      },

      overlay(d, step) {
        const c = calc();
        const R = c.R;
        const s = S.spin;
        const tipY = -S.tip;
        const cs = Math.cos(s), sn = Math.sin(s);
        // V (red) rotation arc, f (blue) feed arrow, d (green) depth of cut: steps 1 and 3
        if (step === 'cond' || step === 'feed') {
          const yv = tipY + c.A + 24 + R, rv = R * 1.9;
          const arc = [];
          for (let i = 0; i <= 14; i++) {
            const a = s + (i / 14) * 1.2 * Math.PI;
            arc.push([rv * Math.cos(a), yv, rv * Math.sin(a)]);
          }
          d.path(arc, 'vline', { arrowEnd: true });
          d.label([rv * Math.cos(s), yv + 7, rv * Math.sin(s)], `V  N = ${c.N.toFixed(0)} rpm`, 'v');
          d.path([[R * 2.6, tipY + c.A + 50, 0], [R * 2.6, tipY + c.A + 14, 0]], 'fline', { arrowEnd: true });
          d.label([R * 2.6, tipY + c.A + 56, 0], `f  ${P.f.toFixed(2)} mm/rev`, 'f');
        }
        if (step === 'cond') {
          const yd = 0.5;
          d.path([[0, yd, 0.6], [R, yd, 0.6]], 'dline', { arrowEnd: true });
          d.label([R / 2, yd + 5, 0.6], c.core ? `d = ½(D − Dh) = ${c.dcut.toFixed(1)}` : `d = D/2 = ${c.dcut.toFixed(1)}`, 'd');
          d.dim([-R, yd + 14, 0.6], [R, yd + 14, 0.6], `D = ${c.D.toFixed(1)}`, [0, 0, 0]);
          if (c.core) d.dim([-c.Dh / 2, yd + 26, 0.6], [c.Dh / 2, yd + 26, 0.6], `Dhole = ${c.Dh.toFixed(1)}`, [0, 0, 0]);
        }
        if (step === 'speed') {
          // local cutting speed along the lip: arrows grow linearly from the centre to the corner
          const Lmax = R * 1.1;
          const ptn = (x, y, z) => [x, y, z];
          const E = [];
          for (let k = 1; k <= 4; k++) {
            const r = (R * k) / 4, y = tipY + r / c.tn;
            const bx = r * cs, bz = r * sn, len = (Lmax * k) / 4;
            const ex = bx - sn * len, ez = bz + cs * len;
            d.path([ptn(bx, y, bz), ptn(ex, y, ez)], 'vline', { arrowEnd: true });
            E.push(ptn(ex, y, ez));
          }
          d.path([ptn(0, tipY, 0), ...E], 'ref');
          d.label(E[3], `V = πDN = ${P.V} m/min at the corner`, 'v', 0, -14);
          d.label(ptn(0, tipY - 5, 0), 'v = 0 at the centre', 'minor', 0, 16);
          d.label(E[1], `${(P.V / 2).toFixed(1)}`, 'minor', 12, -8);
        }
        if (step === 'feed') {
          const y = tipY + c.A;
          d.label([R * cs, y, R * sn], `fz = f/2 = ${c.fz.toFixed(3)}`, 'f', 36, -14);
          d.label([-R * cs, y, -R * sn], `fz = f/2 = ${c.fz.toFixed(3)}`, 'f', -36, -14);
          d.label([0, tipY - 6, 0], `fm = 2 fz N = ${c.fr.toFixed(1)} mm/min`, 'f', 0, 18);
        }
        if (step === 'approach') {
          const apexY = -S.maxD, yb = apexY + c.A;
          const th = c.h;
          d.line([0, apexY + 8 + c.R * 1.1, 0.5], [0, apexY - 6, 0.5], 'cl');
          d.line([0, apexY, 0.5], [c.R * 1.6, apexY + (c.R * 1.6) / c.tn, 0.5], 'dm');
          d.line([0, apexY, 0.5], [-c.R * 1.6, apexY + (c.R * 1.6) / c.tn, 0.5], 'dm');
          d.arc([0, apexY, 0.5], [0, 1, 0], [1, 0, 0], c.R * 0.9, -th, th, 'arc');
          d.label([0, apexY + c.R * 0.9 + 4, 0.5], `θ = ${clamp(P.theta, 60, 150).toFixed(0)}°`, 'dimtxt hl');
          d.dim([c.R, yb, 0.5], [c.R, apexY, 0.5], `A = ${c.A.toFixed(2)} mm`, [c.R * 0.8 + 8, 0, 0]);
          d.dim([-c.R, yb + 6, 0.5], [c.R, yb + 6, 0.5], `D = ${c.D.toFixed(1)}`, [0, 0, 0]);
          d.line([-c.R * 1.5, yb, 0.5], [c.R * 1.5, yb, 0.5], 'ref');
        }
        if (step === 'time' || step === 'worked' || step === 'answer') {
          const xL = -W / 2 - 10;
          const A = c.A;
          d.dim([-W / 2, 0, 0.5], [-W / 2, -P.t, 0.5], `t = ${P.t}`, [-14, 0, 0]);
          d.dim([-W / 2, -P.t, 0.5], [-W / 2, -P.t - A, 0.5], `A = ${A.toFixed(1)}`, [-14, 0, 0]);
          if (c.through) d.dim([-W / 2, -P.t - A, 0.5], [-W / 2, -P.t - A - c.over, 0.5], `over = ${c.over}`, [-14, 0, 0]);
          d.line([-W / 2 - 4, 0, 0.5], [W / 2, 0, 0.5], 'ref');
          d.label([xL - 22, -c.travel / 2, 0.5], `travel ${c.travel.toFixed(1)} mm`, 'f');
          d.label([0, -S.tip + c.A + 40, 0], `${(timeNow(c) * 60).toFixed(1)} s of ${(c.Tm * 60).toFixed(1)} s`, 'minor');
        }
        if (step === 'mrr') {
          const h = clamp(c.fr, 8, 300);
          const gx = W / 2 + c.R + 22;
          d.dim([gx + c.R + 4, 0, -Zb / 2], [gx + c.R + 4, h, -Zb / 2], `fr = ${c.fr.toFixed(1)} mm`, [8, 0, 0]);
          d.label([gx, h + 10, -Zb / 2], `MRR = πD²/4 · fr = ${Math.round(c.mrr).toLocaleString('en-US')} mm³/min`, 'd');
        }
      },

      hud() {
        const c = calc();
        const v = verdict();
        const cut = S.tip > 0;
        return {
          status: S.phase === 'feed' ? (cut ? `Drilling hole ${S.hole + 1} of ${c.n}: tip ${Math.max(S.tip, 0).toFixed(1)} mm deep` : 'Approaching the work') : S.phase === 'up' ? 'Retracting' : 'Next hole',
          statusCls: S.phase === 'feed' ? 'f' : '',
          rows: [
            ['N', `${c.N.toFixed(1)} rpm`],
            ['Feed rate fr', `${c.fr.toFixed(1)} mm/min`],
            ['Allowance A', `${c.A.toFixed(2)} mm`],
            ['Tm per hole', `${c.Tm.toFixed(3)} min`],
            ['MRR', `${Math.round(c.mrr).toLocaleString('en-US')} mm³/min`],
          ],
          verdict: v,
        };
      },

      readouts() {
        const c = calc();
        const fx = (x, n) => x.toFixed(n);
        const cum = c.Tm * S.hole + timeNow(c);
        return {
          N: `${fx(c.N, 1)} rpm`,
          fr: `${fx(c.fr, 1)} mm/min`,
          f: `${fx(P.f, 2)} mm`,
          fz: `${fx(c.fz, 3)} mm`,
          A: `${fx(c.A, 3)} mm`,
          rec: `${fx(recAngle(), 0)}° (${hardLabel(P.hardness)})`,
          travel: `${fx(c.travel, 1)} mm`,
          Tm: `${fx(c.Tm, 3)} min`,
          tot: `${fx(c.tot, 2)} min`,
          n: String(c.n),
          mrr: `${Math.round(c.mrr).toLocaleString('en-US')} mm³/min`,
          mrr2: `${Math.round(250 * c.D * P.V * P.f).toLocaleString('en-US')}`,
          dcut: `${fx(c.dcut, 2)} mm`,
          vcorner: `${fx(P.V, 1)} m/min`,
          vhalf: `${fx(P.V / 2, 1)} m/min`,
          timer: `hole ${S.hole + 1}/${c.n} · ${fx(timeNow(c) * 60, 1)} s of ${fx(c.Tm * 60, 1)} s · total ${fx(cum * 60, 1)} s of ${fx(c.tot * 60, 1)} s`,
          band: band(),
        };
      },

      format(key, v) {
        if (key === 'D' || key === 'Dh') return `Ø${v.toFixed(1)} mm`;
        if (key === 'V') return `${v} m/min`;
        if (key === 'f') return `${v.toFixed(2)} mm/rev`;
        if (key === 't' || key === 'over') return `${v} mm`;
        if (key === 'theta') return `${v}°`;
        if (key === 'nHoles') return String(Math.round(v));
        if (key === 'hardness') return hardLabel(v);
        return null;
      },

      plot(g, w, h, col, stepId) {
        const m = { l: 34, r: 8, t: 10, b: 22 };
        const pw = w - m.l - m.r, ph = h - m.t - m.b;
        const c = calc();
        const mrrPlot = stepId === 'mrr' || stepId === 'cond';
        let xs, ys, xv, yv, xl, yl, title;
        if (mrrPlot) {
          xs = [0.05, 0.6];
          const f = (x) => ((Math.PI / 4) * (c.D * c.D - c.Dh * c.Dh) * x * c.N) / 1000;
          ys = [0, f(0.6)];
          xv = P.f;
          yv = f(P.f);
          xl = 'f mm/rev';
          yl = 'MRR cm³/min';
          title = 'MRR rises in proportion to the feed';
          g.strokeStyle = col.f;
          g.lineWidth = 2;
          g.beginPath();
          g.moveTo(m.l, m.t + ph);
          g.lineTo(m.l + pw, m.t);
          g.stroke();
        } else {
          const Tf = (th) => (P.t + 0.5 * c.D * Math.tan((90 - th / 2) * DEG) + c.over) / c.fr;
          xs = [80, 140];
          ys = [Tf(140) * 0.98, Tf(80)];
          if (ys[1] - ys[0] < 1e-6) ys[1] = ys[0] + 1e-3;
          xv = clamp(P.theta, 80, 140);
          yv = Tf(xv);
          xl = 'θ°';
          yl = 'Tm min';
          title = 'Time per hole falls as the point gets flatter';
          g.strokeStyle = col.accent;
          g.lineWidth = 2;
          g.beginPath();
          for (let i = 0; i <= 30; i++) {
            const th = 80 + (60 * i) / 30;
            const x = m.l + (pw * (th - 80)) / 60, y = m.t + ph - (ph * (Tf(th) - ys[0])) / (ys[1] - ys[0]);
            if (i) g.lineTo(x, y);
            else g.moveTo(x, y);
          }
          g.stroke();
        }
        g.strokeStyle = col.muted;
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(m.l, m.t);
        g.lineTo(m.l, m.t + ph);
        g.lineTo(m.l + pw, m.t + ph);
        g.stroke();
        const px = m.l + (pw * (xv - xs[0])) / (xs[1] - xs[0]);
        const py = m.t + ph - (ph * (yv - ys[0])) / (ys[1] - ys[0]);
        g.fillStyle = col.v;
        g.beginPath();
        g.arc(px, py, 4, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = col.muted;
        g.fillText(xl, m.l + pw - 30, h - 6);
        g.fillText(yl, 2, 9);
        g.fillText(yv.toFixed(mrrPlot ? 1 : 3), Math.min(px + 6, w - 44), Math.max(py - 6, 20));
        return title;
      },

      dispose() {
        disposeGroup(drillParts);
      },
    };

    function timeNow(c) {
      return clamp(Math.max(S.maxD, 0) / c.fr, 0, c.Tm);
    }
  },
};
