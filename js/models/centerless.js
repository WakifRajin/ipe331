import * as THREE from 'three';
import { M, box, cyl, revolve, extrude, at, group, arrow, spinArrow } from '../kit.js';

const ss = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const lerp = (a, b, t) => a + (b - a) * t;

const flip = (g) => { g.rotation.x = Math.PI; return g; }; // reverses the sense of a spin arrow

export default {
  id: 'centerless',
  title: 'Centerless grinding',
  subtitle: 'Work supported on a rest blade between a grinding wheel and a tilted regulating wheel',
  camera: { position: [5.5, 5.2, 7.5], target: [0.2, 2.1, 0] },
  build() {
    const root = new THREE.Group();
    const RG = 1.4, RR = 0.9, RP0 = 0.17, H = 0.25, YW = 2.1, YC = YW + H;
    const XG = Math.sqrt((RG + RP0) ** 2 - H * H); // grinding-wheel centre at x = -XG
    const XR0 = Math.sqrt((RR + RP0) ** 2 - H * H);
    const TILT = (10 * Math.PI) / 180, TILT_PL = (1.5 * Math.PI) / 180;
    const WLEN = 1.6, PSTEP = 0.05;

    // ---------- machine frame ----------
    const base = group(
      at(box(10, 0.6, 5.8, M.paint), 0, 0.3, 0.4),
      at(box(0.5, 0.9, 2.0, M.paintDark), 0, 1.05, 0),
    );

    // ---------- grinding wheel head (left) ----------
    const gSpin = new THREE.Group();
    const wStraight = cyl(RG, WLEN, M.abrasive, { axis: 'z', seg: 72 });
    const wFormed = revolve([[0, -0.8], [RG, -0.8], [RG, 0.05], [RG + PSTEP, 0.05], [RG + PSTEP, 0.8], [0, 0.8]], M.abrasive, { axis: 'z', seg: 72 });
    gSpin.add(wStraight, wFormed);
    for (const z of [-0.805, 0.805]) gSpin.add(at(box(0.9, 0.06, 0.02, M.white), 0.7, 0, z));
    gSpin.add(at(cyl(0.5, 0.08, M.steel, { axis: 'z' }), 0, 0, 0.84));
    const gWheel = at(group(gSpin), 0, 0, 0);
    const gHousing = group(
      at(box(1.6, 2.0, 1.4, M.paint), -0.2, -0.5, -1.7),
      at(cyl(0.4, 1.0, M.paintDark, { axis: 'z' }), -0.2, 0.9, -1.7),
      at(cyl(0.18, 2.2, M.steel, { axis: 'z', seg: 16 }), 0, 0, -0.1),
    );
    const gArrows = group(
      at(flip(group(spinArrow(RG + 0.2, M.vColor, { axis: 'z', arc: Math.PI * 0.7 }))), 0, 0, 1.0),
    );
    const gHead = group(gWheel, gHousing, gArrows);
    gHead.position.set(-XG, YW, 0);

    // ---------- regulating wheel head (right, tilted by angle i about the x axis) ----------
    const regProfile = [[0, -0.8]];
    const rc = RR;
    for (let k = 0; k <= 16; k++) {
      const s = -0.8 + (1.6 * k) / 16;
      regProfile.push([Math.sqrt(rc * rc + (s * Math.tan(TILT)) ** 2), s]);
    }
    regProfile.push([0, 0.8]);
    const rSpin = new THREE.Group();
    rSpin.add(revolve(regProfile, M.rubber, { axis: 'z', seg: 56 }));
    for (const z of [-0.805, 0.805]) rSpin.add(at(box(0.6, 0.05, 0.02, M.white), 0.45, 0, z));
    rSpin.add(at(cyl(0.3, 0.08, M.steel, { axis: 'z' }), 0, 0, 0.84));
    const regWheel = group(rSpin);
    const tilt = group(regWheel, at(cyl(0.15, 2.4, M.steel, { axis: 'z', seg: 16 }), 0, 0, -0.1));
    tilt.add(at(flip(group(spinArrow(RR + 0.25, M.fColor, { axis: 'z', arc: Math.PI * 0.8 }))), 0, 0, 1.0));
    tilt.rotation.x = TILT;
    const rHousing = group(
      at(box(1.6, 2.0, 1.4, M.paint), 0.4, -0.5, -1.7),
      at(cyl(0.4, 1.0, M.paintDark, { axis: 'z' }), 0.4, 0.9, -1.7),
      at(box(1.0, 0.2, 1.0, M.darkSteel), 0.1, -1.25, -0.4),
    );
    const plungeArrow = arrow([2.4, YC - YW, 0.6], [-1, 0, 0], 0.8, M.dColor);
    const rHead = group(tilt, rHousing, plungeArrow);
    rHead.position.set(XR0, YW, 0);

    // ---------- work-rest blade ----------
    const blade = extrude([[-0.14, 1.45], [0.14, 1.45], [0.14, 2.145], [-0.14, 2.215]], 3.4, M.hss, { axis: 'z' });

    // ---------- workpieces ----------
    const NPIN = 6, PITCH = 0.9, ZR = NPIN * PITCH;
    const pinGroup = new THREE.Group();
    const pins = [];
    for (let i = 0; i < NPIN; i++) {
      const pin = cyl(RP0, 0.6, M.work, { axis: 'z', seg: 20 });
      const mk = at(box(0.04, 0.03, 0.5, M.amber), 0, RP0, 0);
      const g = group(pin, mk);
      g.userData.mesh = pin;
      pinGroup.add(g);
      pins.push(g);
    }
    pinGroup.position.y = YC;
    const plA = cyl(1, 1, M.work, { axis: 'z', seg: 32 });
    const plB = cyl(1, 1, M.work, { axis: 'z', seg: 32 });
    const plSpin = new THREE.Group();
    plSpin.add(plA, plB, at(box(0.03, 0.04, 0.4, M.amber), 0, 0, 0));
    const plMark = plSpin.children[2];
    const endStop = at(box(0.5, 0.7, 0.04, M.darkSteel), 0, YC, -0.86);
    const plWork = group(plSpin);
    plWork.position.set(0, YC, 0);
    const plAll = group(plWork, endStop);

    // internal centerless: sleeve on three rolls, small wheel inside
    const C = [0, YC];
    const sleeveMat = M.work;
    const sleeve = extrude(
      Array.from({ length: 48 }, (_, i) => [Math.cos((i / 48) * Math.PI * 2) * 0.7, Math.sin((i / 48) * Math.PI * 2) * 0.7]),
      0.6, sleeveMat,
      { holes: [Array.from({ length: 48 }, (_, i) => [Math.cos(-(i / 48) * Math.PI * 2) * 0.5, Math.sin(-(i / 48) * Math.PI * 2) * 0.5])] },
    );
    const sleeveSpin = group(sleeve, at(box(0.06, 0.04, 0.5, M.amber), 0.7, 0, 0));
    sleeveSpin.userData.rim = true;
    const sleeveG = at(group(sleeveSpin), C[0], C[1], 0);
    const rollDefs = [
      { id: 'reg', ang: -40, rr: 0.55, mat: M.rubber },
      { id: 'sup', ang: -140, rr: 0.4, mat: M.steel },
      { id: 'prs', ang: 80, rr: 0.35, mat: M.steel },
    ];
    const rolls = [];
    const rollsG = new THREE.Group();
    for (const d of rollDefs) {
      const a = (d.ang * Math.PI) / 180;
      const dist = 0.7 + d.rr + 0.005;
      const spin = group(
        cyl(d.rr, 0.7, d.mat, { axis: 'z', seg: 32 }),
        at(box(d.rr * 1.0, 0.04, 0.02, M.white), d.rr * 0.5, 0, 0.36),
      );
      const g = at(group(spin, at(cyl(0.1, 1.0, M.darkSteel, { axis: 'z', seg: 12 }), 0, 0, -0.6)), C[0] + Math.cos(a) * dist, C[1] + Math.sin(a) * dist, 0);
      g.userData = { spin, rr: d.rr };
      rollsG.add(g);
      rolls.push(g);
    }
    const backPlate = at(box(4.4, 3.6, 0.15, M.paintDark), 0, 2.4, -1.05);
    const iSpin = new THREE.Group();
    iSpin.add(cyl(0.3, 0.35, M.abrasive, { axis: 'z', seg: 32 }), at(box(0.2, 0.04, 0.02, M.white), 0.15, 0, 0.18));
    const iHead = group(
      iSpin,
      at(cyl(0.12, 2.1, M.steel, { axis: 'z', seg: 12 }), 0, 0, 0.95),
      at(box(1.2, 1.2, 1.0, M.paint), 0, 0, 2.5),
      at(box(0.8, 1.2, 0.8, M.castIron), 0, -1.2, 2.5),
      at(cyl(0.3, 0.9, M.paintDark, { axis: 'x' }), 0, 0.85, 2.5),
    );
    const iArrows = group(
      at(flip(group(spinArrow(0.5, M.vColor, { axis: 'z', arc: Math.PI * 1.1 }))), 0, 0, 0.45),
      arrow([-0.2, 0.0, 0.6], [-1, 0, 0], 0.01, M.dColor, { head: 0.001 }),
    );
    iArrows.children[1].visible = false;
    const infeedArrowI = arrow([0.9, 0.25, 0.3], [-1, 0, 0], 0.5, M.dColor);
    iHead.add(iArrows, infeedArrowI);
    iHead.position.set(-0.2, YC, 0);
    const sleeveArrow = at(group(spinArrow(0.85, M.fColor, { axis: 'z', arc: Math.PI * 0.9 })), C[0], C[1], 0.4);
    const intAll = group(backPlate, rollsG, sleeveG, iHead, sleeveArrow);

    // axial (through-feed) arrow
    const vfArrow = arrow([0.9, YC - 0.1, -0.6], [0, 0, 1], 1.2, M.fColor);

    const workAll = group(pinGroup, plAll);
    root.add(base, gHead, rHead, blade, workAll, intAll, vfArrow);

    const parts = [
      { id: 'base', name: 'Machine base', object: base, slide: 130, qs: ['2016-17_7b'],
        desc: 'Rigid frame carrying the two wheel heads and the work-rest blade between them.' },
      { id: 'grinding-wheel', name: 'Grinding wheel (large)', object: gWheel, slide: 130, qs: ['2016-17_7b', '2009-10_5c', '2020-21_2b'],
        desc: 'The larger abrasive wheel does the cutting. It runs fast and its peripheral speed presses the work down onto the blade.',
        anchor: [-XG, YW + RG, 0] },
      { id: 'grinding-head', name: 'Grinding-wheel head', object: gHousing, slide: 130, qs: [],
        desc: 'Spindle housing and motor of the grinding wheel; in plunge grinding the wheel is formed to the shape of the part.' },
      { id: 'regulating-wheel', name: 'Regulating wheel (tilted by i)', object: regWheel, slide: 130, qs: ['2016-17_7b', '2009-10_5c', '2020-21_2b'],
        desc: 'Smaller, rubber-bonded wheel turning at low speed in the same sense as the grinding wheel. Tilted by angle i, it controls both work rotation and the axial speed Vf = πDN·sin i.',
        anchor: [XR0, YW + RR, 0] },
      { id: 'regulating-head', name: 'Regulating-wheel head', object: rHousing, slide: 130, qs: [],
        desc: 'Slide that swivels the regulating wheel (angle i) and, in plunge grinding, feeds it forward to produce the infeed.' },
      { id: 'work-rest-blade', name: 'Work-rest blade', object: blade, slide: 130, qs: ['2016-17_7b', '2009-10_5c'],
        desc: 'Hardened blade with an inclined top that supports the work; there are no centres or chuck. The work centre lies slightly above the line joining the wheel centres, which makes the work round.',
        anchor: [0, 1.45, 1.7] },
      { id: 'workpiece', name: 'Workpiece(s)', object: workAll, slide: 130, qs: ['2016-17_7b', '2009-10_5c'],
        desc: 'Pins, shafts or rollers: through-feed passes them continuously across the wheels; a stepped part is plunge-ground against an end stop.' },
      { id: 'support-rolls', name: 'Support rolls (internal)', object: rollsG, slide: 130, qs: ['2020-21_2b'],
        desc: 'In internal centerless grinding the sleeve is supported on its outside by a rubber regulating roll, a support roll and a pressure roll.' },
      { id: 'internal-wheel', name: 'Internal wheel (quill)', object: iHead, slide: 130, qs: ['2020-21_2b'],
        desc: 'A small wheel on a quill reciprocates inside the sleeve bore to grind it.' },
    ];

    const modes = [
      { id: 'through-feed', label: 'Through-feed', slide: 130, qs: ['2016-17_7b', '2009-10_5c', '2020-21_2b'],
        info: 'The most common type (external traverse feed). Pins are fed in at one side of the wheels and leave at the other. The tilted regulating wheel gives each pin an axial velocity Vf while it turns, so many parts are ground continuously. Typical work: piston pins, rollers, shafts.' },
      { id: 'plunge', label: 'Plunge (in-feed)', slide: 131, qs: ['2016-17_7b', '2009-10_5c'],
        info: 'The part is placed on the blade against an end stop and the wheels are fed together (plunge) until size is reached, with no axial travel. A formed grinding wheel produces parts of variable diameter: bolts, valve tappets, distributor shafts.' },
      { id: 'internal', label: 'Internal', slide: 131, qs: ['2020-21_2b', '2009-10_5c'],
        info: 'Sleeves and rings are ground on the inside: the part is supported on its outside by three rolls (regulating, support and pressure) while a small wheel on a quill grinds the bore. The bore then runs true to the outside surface.' },
    ];

    // ---------- animation ----------
    let mode = 'through-feed';
    let t = 0;
    let aG = 0, aR = 0, aW = 0;
    let tiltNow = TILT;
    let note = '';
    let prog = 0;

    function applyVis() {
      const tf = mode === 'through-feed', pl = mode === 'plunge', inn = mode === 'internal';
      gHead.visible = !inn; rHead.visible = !inn; blade.visible = !inn;
      wStraight.visible = tf; wFormed.visible = pl;
      pinGroup.visible = tf; vfArrow.visible = tf;
      plAll.visible = pl; plungeArrow.visible = pl;
      intAll.visible = inn;
    }

    function plungeState(p) {
      let extra, r = RP0;
      if (p < 0.1) { extra = 0.6 * (1 - ss(p / 0.1)); prog = 0; }
      else if (p < 0.7) { extra = 0; prog = (p - 0.1) / 0.6; }
      else if (p < 0.85) { extra = 0; prog = 1; }
      else { extra = 0.6 * ss((p - 0.85) / 0.15); prog = 1; }
      r = RP0 - 0.04 * prog;
      const xw = -XG + Math.sqrt((RG + r) ** 2 - H * H);
      plWork.position.x = xw;
      endStop.position.x = xw;
      rHead.position.x = xw + Math.sqrt((RR + r) ** 2 - H * H) + extra;
      plA.scale.set(r, r, 0.83);
      plA.position.z = -0.78 + 0.83 / 2;
      const rb = r - PSTEP;
      plB.scale.set(rb, rb, 0.65);
      plB.position.z = 0.05 + 0.65 / 2;
      const mat = prog > 0.001 ? M.workCut : M.work;
      plA.material = mat; plB.material = mat;
      plMark.position.set(0, r, -0.35);
      plWork.visible = p > 0.04 && p < 0.9;
      note = p < 0.1 ? 'loading' : p < 0.7 ? 'plunge infeed' : p < 0.85 ? 'spark-out' : 'retract';
    }

    function step(dt) {
      const target = mode === 'plunge' ? TILT_PL : TILT;
      tiltNow += (target - tiltNow) * Math.min(1, dt * 6);
      tilt.rotation.x = tiltNow;
      if (mode === 'through-feed') {
        rHead.position.x = XR0;
        for (let i = 0; i < NPIN; i++) {
          const z = (((i * PITCH + t * 0.5) % ZR) + ZR) % ZR - ZR / 2;
          pins[i].position.z = z;
          pins[i].userData.mesh.material = z > 0.1 ? M.workCut : M.work;
          pins[i].rotation.z = aW;
        }
        note = 'continuous feed';
      } else if (mode === 'plunge') {
        plungeState((t % 9) / 9);
        plSpin.rotation.z = aW;
      } else {
        const p = (t % 8) / 8;
        const inf = p < 0.85 ? 0.04 * ss(p / 0.85) : 0.04 * (1 - ss((p - 0.85) / 0.15));
        iHead.position.x = -(0.2 + inf);
        iHead.position.z = 0.3 * Math.sin((2 * Math.PI * t) / 2);
        sleeveSpin.rotation.z = aW * 0.5;
        for (let i = 0; i < 3; i++) rolls[i].userData.spin.rotation.z = -aW * 0.5 * (0.7 / rolls[i].userData.rr);
        iSpin.rotation.z = -aG * 1.4;
        note = 'wheel reciprocates in bore';
      }
    }

    function reset() {
      t = 0; aG = 0; aR = 0; aW = 0;
      tiltNow = mode === 'plunge' ? TILT_PL : TILT;
      applyVis();
      step(0);
    }
    reset();

    return {
      root,
      parts,
      modes,
      setMode(id) { mode = id; reset(); },
      update(dt) {
        t += dt;
        aG -= dt * 12;
        aR -= dt * 1.4;
        aW += dt * 7.4;
        gSpin.rotation.z = aG;
        rSpin.rotation.z = aR;
        step(dt);
      },
      readout() {
        return [
          ['Mode', mode],
          ['Phase', note],
          ['Tilt i (shown; real 1-5°)', `${((tiltNow * 180) / Math.PI).toFixed(1)}°`],
          ['Wheels', 'same sense (CW)'],
          ['Work', 'opposite sense (CCW)'],
          ['Vf (axial) = πDN·sin i', mode === 'through-feed' ? 'π·D_r·N_r·sin i' : '≈ 0'],
          ['Work centre above wheel line', `${(H * 10).toFixed(1)} mm`],
        ];
      },
      legend: [['V', 'grinding-wheel speed'], ['f', 'regulating wheel / axial feed Vf'], ['d', 'plunge infeed']],
    };
  },
};
