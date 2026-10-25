import * as THREE from 'three';
import { M, box, cyl, tube, at, group, arrow, spinArrow, chips } from '../kit.js';

const ss = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);

function rod(a, b, r, mat, seg = 10) {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, va.distanceTo(vb), seg), mat);
  m.position.copy(va).add(vb).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.sub(va).normalize());
  return m;
}

const dbl = (from, dir, len, color) =>
  group(arrow(from, dir, len, color), arrow(from, [-dir[0], -dir[1], -dir[2]], len, color));

export default {
  id: 'creep-feed',
  title: 'Creep-feed vs conventional grinding',
  subtitle: 'Many fast shallow passes against one slow, deep pass with heavy coolant',
  camera: { position: [7.5, 5.5, 8.5], target: [0, 2.4, 0] },
  build() {
    const root = new THREE.Group();
    const R = 1.0, WW = 0.46, L = 2.6, D = 0.44, NL = 8, DV = D / NL;
    const TOP = 2.29, A = 2.25;
    const yClear = TOP + R + 0.25;
    const ycConv = [];
    for (let k = 0; k < NL; k++) ycConv.push(TOP - (k + 1) * DV + R);
    const ycCreep = TOP - D + R;
    const lcConv = Math.sqrt(DV * (2 * R - DV));
    const lcCreep = Math.sqrt(D * (2 * R - D));

    // ---------- frame ----------
    const base = group(
      at(box(9.4, 1.0, 3.9, M.paint), 0, 0.5, -0.25),
      at(box(9.7, 0.08, 4.2, M.paintDark), 0, 0.04, -0.25),
      at(box(8.4, 0.06, 0.2, M.steel), 0, 1.03, 0.4),
      at(box(8.4, 0.06, 0.2, M.steel), 0, 1.03, -0.4),
    );
    const column = group(
      at(box(1.6, 4.3, 1.0, M.paint), 0, 3.15, -1.45),
      at(box(2.2, 0.2, 1.4), 0, 1.1, -1.4),
      at(box(1.3, 0.12, 0.8, M.paintLight), 0, 5.35, -1.45),
    );

    // ---------- wheel head (origin = wheel centre) ----------
    const convMat = M.abrasive;
    const creepMat = M.abrasive.clone();
    creepMat.color = new THREE.Color(0xa0603c);
    const wheelSpin = new THREE.Group();
    const wheelMesh = cyl(R, WW, convMat, { axis: 'z', seg: 72 });
    wheelSpin.add(wheelMesh);
    // open-structure pores visible on the creep-feed wheel
    const pores = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), M.black, 160);
    const dm = new THREE.Object3D();
    for (let i = 0; i < 160; i++) {
      const a = Math.random() * Math.PI * 2;
      dm.position.set(Math.cos(a) * R, Math.sin(a) * R, (Math.random() - 0.5) * (WW - 0.06));
      dm.rotation.set(Math.random(), Math.random(), a);
      dm.updateMatrix();
      pores.setMatrixAt(i, dm.matrix);
    }
    wheelSpin.add(pores);
    wheelSpin.add(at(box(0.6, 0.05, 0.02, M.white), 0.55, 0, WW / 2 + 0.005));
    wheelSpin.add(at(cyl(0.4, 0.06, M.steel, { axis: 'z' }), 0, 0, WW / 2 + 0.03));
    wheelSpin.add(at(cyl(0.4, 0.06, M.steel, { axis: 'z' }), 0, 0, -WW / 2 - 0.03));
    const wheel = group(wheelSpin);

    const headBody = group(
      at(box(1.3, 1.1, 0.5, M.paint), 0, 0.15, -0.6),
      at(box(1.2, 1.7, 0.1, M.paintDark), 0, 0.15, -0.9),
      at(cyl(0.15, 1.4, M.steel, { axis: 'z' }), 0, 0, -0.15),
    );
    const motor = group(
      at(cyl(0.4, 0.9, M.paintDark, { axis: 'z' }), 0, 0.95, -0.6),
      at(box(0.7, 0.14, 0.6, M.paint), 0, 0.72, -0.6),
    );

    // dresser roll (continuous dressing in creep-feed)
    const dresserSpin = new THREE.Group();
    dresserSpin.add(cyl(0.2, 0.6, M.carbide, { axis: 'z', seg: 24 }));
    dresserSpin.add(at(box(0.18, 0.03, 0.02, M.black), 0.1, 0, 0.31));
    const dresser = group(
      at(group(dresserSpin), -0.86, 0.86, 0),
      rod([-0.86, 0.86, -0.32], [-0.3, 0.5, -0.45], 0.06, M.darkSteel, 8),
    );

    // coolant nozzle and jet
    const tip = [-0.3, -0.5, 1.0];
    const hit = [0.0, -0.95, 0.15];
    const jet = rod(tip, hit, 1, M.fluid, 12);
    const jetBase = jet.scale.clone();
    const nozzle = group(
      tube([[-0.9, 0.9, -0.5], [-1.3, 0.2, 0.5], [-0.9, -0.3, 1.1], tip], 0.05, M.steel, { seg: 32, radial: 8 }),
      at(box(0.5, 0.1, 0.08, M.chrome), tip[0], tip[1], tip[2]),
      jet,
    );

    const headAll = group(headBody, motor);
    const head = new THREE.Group();
    head.add(headAll, wheel, dresser, nozzle);
    head.add(at(spinArrow(1.3, M.vColor, { axis: 'z', arc: Math.PI * 0.8 }), 0, 0, WW / 2 + 0.2));
    head.add(arrow([1.45, 0.9, 0.2], [0, -1, 0], 0.7, M.dColor));
    head.position.y = yClear;

    // ---------- table, workpiece ----------
    const layers = [];
    const layerGroup = new THREE.Group();
    for (let k = 0; k < NL; k++) {
      const m = box(1, 1, 1, M.work);
      m.scale.set(L, DV * 0.995, 0.5);
      m.position.y = TOP - (k + 0.5) * DV;
      layerGroup.add(m);
      layers.push(m);
    }
    const strip = box(1, 0.01, 0.5, M.workCut);
    const glassMat = M.glass.clone();
    const workpiece = group(
      at(box(L, 0.6, 1.2, M.work), 0, 1.55, 0),
      at(box(L, D, 0.35, M.work), 0, TOP - D / 2, -0.425),
      at(box(L, D, 0.35, glassMat), 0, TOP - D / 2, 0.425),
      layerGroup,
      strip,
    );
    const table = group(
      at(box(4.2, 0.25, 1.5, M.paintLight), 0, 1.125, 0),
      at(box(3.2, 0.12, 1.3, M.darkSteel), 0, 1.31, 0),
      workpiece,
      dbl([0, 1.5, 0.95], [1, 0, 0], 1.0, M.fColor),
    );
    // overall wp base sits on fixture: 1.25..1.85 is the work's lower solid (y centre 1.55)

    const sparkMat = M.amber.clone();
    sparkMat.emissive = new THREE.Color(0xff9a10);
    sparkMat.emissiveIntensity = 1.6;
    const sparks = chips(36, sparkMat);
    const splash = chips(90, M.fluid);

    root.add(base, column, head, table, sparks.object, splash.object);

    const parts = [
      { id: 'base', name: 'Base', object: base, slide: 133, qs: [],
        desc: 'Very rigid, heavy base: creep-feed grinding creates large forces, so static and dynamic stiffness are essential.' },
      { id: 'column', name: 'Column', object: column, slide: 135, qs: ['2021-22_3b'],
        desc: 'Stiff column guiding the wheel head; the machine needs a powerful spindle drive (about 40-120 kW).' },
      { id: 'wheel-head', name: 'Wheel head & motor', object: headAll, slide: 135, qs: ['2021-22_3b'],
        desc: 'High-power spindle head. Power requirement is high because the deep cut gives large cutting forces.' },
      { id: 'grinding-wheel', name: 'Grinding wheel', object: wheel, slide: 133, qs: ['2021-22_3b', '2020-21_2b'],
        desc: 'Soft-grade, open-structure, resin-bonded wheel: the open pores take the large chip volume and the soft bond keeps shedding dull grains so it stays sharp.',
        anchor: [0, R, 0] },
      { id: 'dresser', name: 'Dressing roll', object: dresser, slide: 134, qs: ['2021-22_3b'],
        desc: 'The wheel must be dressed continuously to remove dullness, so a rotary dressing unit is part of the machine.' },
      { id: 'table', name: 'Table', object: table, slide: 133, qs: ['2021-22_3b'],
        desc: 'Carries the work past the wheel. In creep-feed it moves very slowly in one pass; conventional grinding uses fast strokes with many reversals.' },
      { id: 'workpiece', name: 'Workpiece (slot / profile)', object: workpiece, slide: 132, qs: ['2021-22_3b', '2020-21_2b'],
        desc: 'Creep-feed grinding suits cavities, grooves and deep profiles in hard materials; the full depth is cut in a single pass. The front wall is shown transparent.',
        anchor: [0, TOP, 0.6] },
      { id: 'coolant-nozzle', name: 'Coolant nozzle & jet', object: nozzle, slide: 135, qs: ['2021-22_3b'],
        desc: 'Heavy, high-pressure coolant flow reaches into the deep contact zone to limit heat, otherwise burn and cracking occur.' },
    ];

    const modes = [
      { id: 'conventional', label: 'Conventional', slide: 133, qs: ['2021-22_3b'],
        info: 'The depth of cut is only a few hundredths of a mm, so many fast passes are needed. The table reverses at the end of every stroke (idle time) and the wheel is infed after each pass. The contact length is short and forces are modest.' },
      { id: 'creep-feed', label: 'Creep-feed', slide: 133, qs: ['2021-22_3b', '2020-21_2b'],
        info: 'The infeed d is up to 6 mm and the work speed is very low, so the full profile is cut in one slow pass: no reversals or idle time, higher MRR and accuracy. A soft, open resin-bonded wheel, continuous dressing and heavy coolant flow are needed. Drawbacks: very high cutting force and power, expensive rigid machine, thermal damage risk if cooling is poor.' },
    ];

    // ---------- animation ----------
    let mode = 'conventional';
    let t = 0;
    let wAng = 0;
    let xw = -A;
    let note = '';
    let pass = 1;
    let contact = false;
    let spawn = 0;
    const P = [0, 0, 0];
    const V = [0, 0, 0];

    function setLayer(m, x0, x1) {
      const len = x1 - x0;
      if (len < 0.004) { m.visible = false; return; }
      m.visible = true;
      m.scale.x = len;
      m.position.x = (x0 + x1) / 2;
    }

    // dir +1: uncut = [front, L/2]; dir -1: uncut = [-L/2, front]
    function layerRange(k, cur, dir, front, done) {
      const m = layers[k];
      if (done || k < cur) { m.visible = false; return; }
      if (k > cur) { setLayer(m, -L / 2, L / 2); return; }
      if (dir > 0) setLayer(m, clamp(front, -L / 2, L / 2), L / 2);
      else setLayer(m, -L / 2, clamp(front, -L / 2, L / 2));
    }

    function step() {
      const creep = mode === 'creep-feed';
      let y, dir = 1, cur = 0, done = false, floor, passed0, passed1;
      contact = false;
      if (!creep) {
        const T = 1.5;
        const n = Math.floor(t / T) % NL;
        const u = (t / T) % 1;
        dir = n % 2 === 0 ? 1 : -1;
        xw = -A * dir * Math.cos(Math.PI * u);
        const prev = n === 0 ? yClear : ycConv[n - 1];
        y = lerp(prev, ycConv[n], ss(u / 0.12));
        if (n === NL - 1 && u > 0.85) y = lerp(ycConv[n], yClear, ss((u - 0.85) / 0.15));
        cur = n;
        pass = n + 1;
        const front = dir > 0 ? xw + 0.55 * lcConv : xw - 0.55 * lcConv;
        for (let k = 0; k < NL; k++) layerRange(k, cur, dir, front, false);
        floor = TOP - (n + 1) * DV;
        if (dir > 0) { passed0 = -L / 2; passed1 = clamp(front, -L / 2, L / 2); }
        else { passed0 = clamp(front, -L / 2, L / 2); passed1 = L / 2; }
        contact = u > 0.12 && Math.abs(xw) < L / 2 + 0.1 && !(n === NL - 1 && u > 0.85);
        note = `pass ${pass}/${NL}, ${dir > 0 ? 'forward' : 'return'} stroke`;
      } else {
        const p = (t % 16) / 16;
        pass = 1;
        if (p < 0.1) { y = lerp(yClear, ycCreep, ss(p / 0.1)); xw = -A; note = 'wheel plunges to full depth'; }
        else if (p < 0.82) { y = ycCreep; xw = lerp(-A, A, (p - 0.1) / 0.72); note = 'single slow deep pass'; contact = Math.abs(xw) < L / 2 + 0.3; }
        else if (p < 0.9) { y = lerp(ycCreep, yClear, ss((p - 0.82) / 0.08)); xw = A; note = 'wheel lifts'; }
        else { y = yClear; xw = lerp(A, -A, ss((p - 0.9) / 0.1)); note = 'table returns'; }
        done = p >= 0.82;
        const front = xw + 0.55 * lcCreep;
        for (let k = 0; k < NL; k++) layerRange(k, 0, 1, p < 0.1 ? -L : front, done);
        if (p < 0.1) for (let k = 0; k < NL; k++) setLayer(layers[k], -L / 2, L / 2);
        floor = ycCreep - R;
        passed0 = -L / 2;
        passed1 = p < 0.1 ? -L / 2 : p >= 0.82 ? L / 2 : clamp(front, -L / 2, L / 2);
      }
      head.position.y = y;
      table.position.x = -xw;
      setLayer(strip, passed0, passed1);
      strip.scale.y = 0.01;
      strip.position.y = floor + 0.005;
      return contact;
    }

    function applyVis() {
      const creep = mode === 'creep-feed';
      wheelMesh.material = creep ? creepMat : convMat;
      pores.visible = creep;
      dresser.visible = creep;
    }

    function reset() {
      t = 0; wAng = 0; spawn = 0;
      sparks.reset(); splash.reset();
      applyVis();
      step();
    }
    reset();

    return {
      root,
      parts,
      modes,
      setMode(id) { mode = id; reset(); },
      update(dt) {
        t += dt;
        wAng += dt * 16;
        wheelSpin.rotation.z = wAng;
        dresserSpin.rotation.z = -wAng * 0.6;
        const c = step();
        const creep = mode === 'creep-feed';
        // coolant jet: thin in conventional, heavy and pulsing in creep-feed
        const rj = creep ? 0.11 + 0.012 * Math.sin(t * 22) : 0.025;
        jet.scale.set(rj, jetBase.y, rj);
        if (c) {
          let n = Math.round(dt * (creep ? 30 : 55) + Math.random());
          while (n-- > 0) {
            P[0] = (Math.random() - 0.5) * 0.1;
            P[1] = head.position.y - R + 0.03;
            P[2] = (Math.random() - 0.5) * WW;
            V[0] = 2.0 + Math.random() * 1.6; V[1] = 0.5 + Math.random() * 0.8; V[2] = 0.8 + Math.random();
            sparks.emit(P, V);
          }
          if (creep) {
            let m = Math.round(dt * 90 + Math.random());
            while (m-- > 0) {
              P[0] = (Math.random() - 0.5) * 0.4;
              P[1] = head.position.y - R + 0.1;
              P[2] = 0.3 + Math.random() * 0.3;
              V[0] = (Math.random() - 0.3) * 1.5; V[1] = 0.8 + Math.random() * 1.2; V[2] = 1.0 + Math.random() * 1.5;
              splash.emit(P, V);
            }
          }
        }
        sparks.update(dt);
        splash.update(dt);
      },
      readout() {
        const creep = mode === 'creep-feed';
        // illustrative values for a Ø200 wheel, 25 mm wide
        const d = creep ? 6 : 0.05;
        const vw = creep ? 0.3 : 15; // m/min
        const lc = Math.sqrt(d * (200 - d));
        return [
          ['Mode', creep ? 'creep-feed' : 'conventional'],
          ['Phase', note],
          ['Infeed d', `${d} mm`],
          ['Table speed Vw', `${vw} m/min`],
          ['Contact length √(d(D−d))', `${lc.toFixed(1)} mm`],
          ['MRR = Vw·w·d (w = 25 mm)', `${Math.round(vw * 1000 * 25 * d)} mm³/min`],
          ['Passes / reversals for full depth', creep ? '1 / 0' : `${NL} / ${NL - 1}`],
        ];
      },
      legend: [['V', 'wheel speed'], ['Vw', 'table speed (slow in creep-feed)'], ['d', 'infeed (not to scale)']],
    };
  },
};
