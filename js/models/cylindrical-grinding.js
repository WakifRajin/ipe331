import * as THREE from 'three';
import { M, box, cyl, at, group, arrow, spinArrow, chips } from '../kit.js';

const ss = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);

const dbl = (from, dir, len, color) =>
  group(arrow(from, dir, len, color), arrow(from, [-dir[0], -dir[1], -dir[2]], len, color));

export default {
  id: 'cylindrical-grinding',
  title: 'Cylindrical grinding',
  subtitle: 'External traverse, external plunge and internal grinding between centres / in a chuck',
  camera: { position: [7.5, 6, 9], target: [0, 2, 0.8] },
  build() {
    const root = new THREE.Group();
    const YA = 2.0, R = 0.9, R0 = 0.5, R1 = 0.46, R2 = 0.43, RP = 0.4, BL = 0.9;
    const WT = 0.6, WP = 1.8, RW = 0.28;

    // ---------- bed ----------
    const base = group(
      at(box(9.4, 1.0, 5.2, M.paint), 0, 0.5, 1.1),
      at(box(9.7, 0.08, 5.5, M.paintDark), 0, 0.04, 1.1),
      at(box(5.4, 0.06, 0.2, M.steel), 0, 1.03, 0.3),
      at(box(0.4, 0.06, 2.6, M.steel), 0, 1.03, 2.2),
      at(box(0.4, 0.06, 2.6, M.steel), 0.5, 1.03, 2.2),
    );
    // ---------- table assembly (moves along x) ----------
    const headstock = group(
      at(box(0.85, 1.3, 0.9, M.paint), -2.075, 1.9, 0),
      at(box(0.6, 0.5, 0.5, M.paintDark), -2.4, 2.8, 0),
      at(cyl(0.25, 0.3, M.darkSteel, { axis: 'x' }), -2.25, 2.0, 0),
    );
    const liveCentre = at(cyl(0.12, 0.5, M.steel, { rTop: 0.02, axis: 'x', seg: 16 }), -1.45, YA, 0);
    const tailstock = group(
      at(box(0.9, 1.3, 0.8, M.paint), 2.4, 1.9, 0),
      at(cyl(0.2, 0.5, M.darkSteel, { axis: 'x' }), 1.9, YA, 0),
      at(cyl(0.02, 0.5, M.steel, { rTop: 0.12, axis: 'x', seg: 16 }), 1.45, YA, 0),
    );
    const jaws = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const j = box(0.22, 0.2, 0.2, M.darkSteel);
      j.position.set(-1.3, Math.cos(a) * 0.62, Math.sin(a) * 0.62);
      jaws.add(j);
    }
    const chuckSpin = new THREE.Group();
    chuckSpin.add(at(cyl(0.8, 0.35, M.steel, { axis: 'x', seg: 32 }), -1.475, 0, 0), jaws);
    const chuck = at(group(chuckSpin), 0, YA, 0);

    // external work (stepped shaft)
    const wSpinExt = new THREE.Group();
    const jl = at(cyl(0.3, 0.3, M.work, { axis: 'x' }), -1.05, 0, 0);
    const jr = at(cyl(0.3, 0.3, M.work, { axis: 'x' }), 1.05, 0, 0);
    const mk1 = at(box(0.2, 0.04, 0.05, M.amber), -1.05, 0.3, 0);
    const mk2 = at(box(0.2, 0.04, 0.05, M.amber), 1.05, 0.3, 0);
    wSpinExt.add(jl, jr, mk1, mk2);
    const seg0 = cyl(1, 1, M.work, { axis: 'x', seg: 48 });
    const seg1 = cyl(1, 1, M.workCut, { axis: 'x', seg: 48 });
    const seg2 = cyl(1, 1, M.workCut, { axis: 'x', seg: 48 });
    const extWork = at(group(wSpinExt, seg0, seg1, seg2), 0, YA, 0);

    // internal work: half-shell sleeve (front half removed so the bore can be seen)
    const sleeveMat = M.work.clone();
    sleeveMat.side = THREE.DoubleSide;
    const prof = [new THREE.Vector2(0.45, -0.8), new THREE.Vector2(0.7, -0.8), new THREE.Vector2(0.7, 0.8), new THREE.Vector2(0.45, 0.8), new THREE.Vector2(0.45, -0.8)];
    const sg = new THREE.LatheGeometry(prof, 48, Math.PI / 2, Math.PI);
    sg.rotateZ(-Math.PI / 2);
    sg.translate(-0.5, 0, 0);
    const sleeve = new THREE.Mesh(sg, sleeveMat);
    sleeve.castShadow = true;
    const boreBand = new THREE.Mesh(new THREE.CylinderGeometry(0.452, 0.452, 1.6, 40, 1, true, Math.PI / 2 + Math.PI, Math.PI), M.workCut);
    boreBand.geometry.rotateZ(-Math.PI / 2);
    boreBand.geometry.translate(-0.5, 0, 0);
    boreBand.material = M.workCut.clone();
    boreBand.material.side = THREE.DoubleSide;
    const intWork = at(group(sleeve, boreBand), 0, YA, 0);

    const workAll = group(extWork, intWork);
    const arrowsExtTable = group(
      dbl([0, 3.3, 0], [1, 0, 0], 1.0, M.fColor),
    );
    const spinWrap = new THREE.Group();
    spinWrap.add(at(spinArrow(0.8, M.fColor, { axis: 'x', arc: Math.PI * 1.2 }), -1.0, 0, 0));
    spinWrap.rotation.z = Math.PI;
    spinWrap.position.y = YA;
    const table = group(
      at(box(5.0, 0.25, 1.4, M.paintLight), 0, 1.125, 0),
      headstock, liveCentre, tailstock, chuck, workAll, spinWrap, arrowsExtTable,
    );

    // ---------- external wheel head (moves along z) ----------
    const wheelSpin = new THREE.Group();
    const wheelT = cyl(R, WT, M.abrasive, { axis: 'x', seg: 64 });
    const wheelP = cyl(R, WP, M.abrasive, { axis: 'x', seg: 64 });
    wheelSpin.add(wheelT, wheelP);
    for (const x of [-WP / 2 - 0.01, WP / 2 + 0.01, -WT / 2 - 0.01, WT / 2 + 0.01]) {
      const m = box(0.02, 0.05, 0.55, M.white);
      m.position.set(x, 0, 0.5);
      wheelSpin.add(m);
    }
    wheelSpin.add(cyl(0.12, 2.8, M.steel, { axis: 'x', seg: 12 }));
    const wheelExt = group(wheelSpin);
    const whHousing = group(
      at(box(3.2, 1.2, 0.9, M.paint), 0, 0, 1.55),
      at(box(0.3, 0.5, 1.3), -1.4, 0, 0.7),
      at(box(0.3, 0.5, 1.3), 1.4, 0, 0.7),
      at(cyl(0.35, 1.4, M.paintDark, { axis: 'x' }), 0, 0.95, 1.55),
      at(box(3.6, 0.2, 1.6, M.paintDark), 0, -0.7, 1.55),
    );
    const extArrows = group(
      at(spinArrow(1.05, M.vColor, { axis: 'x', arc: Math.PI * 0.9 }), 0, 0, 0),
      arrow([1.5, 0, 1.5], [0, 0, -1], 0.8, M.dColor),
    );
    const wh = group(wheelExt, whHousing, extArrows);
    wh.position.set(0, YA, R0 + R);
    const slideWays = group(
      at(box(3.6, 0.15, 3.2, M.castIron), 0, 1.075, 2.4),
      at(box(0.1, 0.06, 3.2, M.steel), -1.2, 1.18, 2.4),
      at(box(0.1, 0.06, 3.2, M.steel), 1.2, 1.18, 2.4),
    );

    // ---------- internal wheel on quill (static in x, small z infeed) ----------
    const intSpin = new THREE.Group();
    intSpin.add(cyl(RW, 0.4, M.abrasive, { axis: 'x', seg: 32 }));
    const imk = box(0.02, 0.04, 0.2, M.white);
    imk.position.set(0.2, 0, 0.17);
    intSpin.add(imk);
    const quill = group(at(cyl(0.1, 3.8, M.steel, { axis: 'x', seg: 12 }), 1.9, 0, 0), intSpin);
    const intHousing = group(
      at(box(1.0, 1.1, 1.2, M.paint), 4.0, 0.0, 0),
      at(cyl(0.3, 0.9, M.paintDark, { axis: 'x' }), 4.0, 0.8, 0),
      at(box(1.0, 0.6, 1.0, M.castIron), 4.0, -0.85, 0),
    );
    const intArrows = group(
      at(spinArrow(0.45, M.vColor, { axis: 'x', arc: Math.PI * 1.2 }), -0.5, 0, 0),
      arrow([0.2, 0, 0.7], [0, 0, -1], 0.4, M.dColor),
      dbl([2.5, 1.0, 0], [1, 0, 0], 0.6, M.fColor),
    );
    const intHead = group(quill, intHousing, intArrows);
    intHead.position.set(-0.5, YA, -0.17);
    // keep housing/arrows at fixed x offset relative to the wheel position
    quill.position.x = 0;
    intHousing.position.x = 0.5;
    intHead.userData = {};

    // ---------- sparks ----------
    const sparkMat = M.amber.clone();
    sparkMat.emissive = new THREE.Color(0xff9a10);
    sparkMat.emissiveIntensity = 1.6;
    const sparks = chips(36, sparkMat);

    const bed = group(base, slideWays);
    root.add(bed, table, wh, intHead, sparks.object);

    const parts = [
      { id: 'bed', name: 'Bed & slides', object: bed, slide: 128, qs: ['2018-19_8a'],
        desc: 'Rigid base carrying the reciprocating table and the cross-slide on which the wheel head advances toward the work.' },
      { id: 'table', name: 'Work table (traverse)', object: table, slide: 128, qs: ['2018-19_8a', '2013-14_6b'],
        desc: 'Carries headstock and tailstock and reciprocates along the work axis to give the traverse feed in traverse grinding.',
        anchor: [0, 1.3, 0.8] },
      { id: 'headstock', name: 'Headstock', object: headstock, slide: 128, qs: ['2013-14_6b'],
        desc: 'Holds the work and rotates it with its own motor, at a much lower speed than the wheel.', anchor: [-2.1, 2.6, 0] },
      { id: 'tailstock', name: 'Tailstock & centre', object: tailstock, slide: 128, qs: ['2013-14_6b'],
        desc: 'Supports the other end of the work on a dead centre (external grinding between centres only).', anchor: [2.4, 2.6, 0] },
      { id: 'chuck', name: 'Chuck (internal grinding)', object: chuck, slide: 128, qs: ['2018-19_8a'],
        desc: 'For internal grinding the hollow part is clamped in a chuck so that its bore is free for the small wheel.', anchor: [-1.5, 2.9, 0] },
      { id: 'workpiece', name: 'Workpiece', object: workAll, slide: 129, qs: ['2018-19_8a', '2012-13_6b'],
        desc: 'Rotates slowly about its own axis; the wheel removes a thin layer from the outside (external) or the bore (internal).' },
      { id: 'grinding-wheel', name: 'Grinding wheel', object: wheelExt, slide: 129, qs: ['2013-14_6b', '2012-13_6b'],
        desc: 'Wide wheel with axis parallel to the work axis; rotates at high peripheral speed V in its own motor drive. A wider wheel is used for plunge grinding.',
        anchor: [0, 3.1, R0 + R] },
      { id: 'wheel-head', name: 'Wheel head', object: whHousing, slide: 129, qs: ['2013-14_6b'],
        desc: 'Housing, spindle and motor of the external wheel, fed toward the work (infeed d) on its cross-slide.' },
      { id: 'internal-wheel', name: 'Internal wheel & quill', object: intHead, slide: 129, qs: ['2018-19_8a'],
        desc: 'A small wheel on a long quill enters the bore; its axis is offset so it touches the bore wall. It must run much faster to reach a useful surface speed.' },
    ];

    const modes = [
      { id: 'external-traverse', label: 'External traverse', slide: 128, qs: ['2018-19_8a', '2013-14_6b', '2012-13_6b'],
        info: 'Work between centres turns slowly while the narrow wheel rotates fast on a separate motor. The table reciprocates, so the wheel traverses the full length of the cylindrical surface; infeed d is applied at the end of each pass. Used for shafts and long cylindrical surfaces, also tapers if the axes are swivelled.' },
      { id: 'external-plunge', label: 'External plunge', slide: 128, qs: ['2018-19_8a', '2013-14_6b'],
        info: 'A wheel as wide as the surface is fed radially into the rotating work with no traverse, until size is reached, then spark-out. Used for short surfaces, shoulders and formed profiles.' },
      { id: 'internal', label: 'Internal', slide: 129, qs: ['2018-19_8a', '2012-13_6b'],
        info: 'Hollow work held in a chuck rotates while a small wheel on a quill grinds the bore, reciprocating along its length. Tapered holes can be ground by swivelling the head. Together with external grinding it finishes all surfaces of a hollow cylindrical part.' },
    ];

    // ---------- animation ----------
    let mode = 'external-traverse';
    let t = 0;
    let wAng = 0;
    let kAng = 0;
    let spawn = 0;
    let cPos = 0;
    let rNow = R0;
    let phaseName = '';
    const P = [0, 0, 0];
    const V = [0, 0, 0];

    function setSeg(m, x0, x1, r) {
      const len = x1 - x0;
      if (len < 0.003 || r <= 0) { m.visible = false; return; }
      m.visible = true;
      m.scale.set(len, r, r);
      m.position.x = (x0 + x1) / 2;
    }

    function applyVis() {
      const ext = mode !== 'internal';
      const trav = mode === 'external-traverse';
      wh.visible = ext;
      slideWays.visible = ext;
      extWork.visible = ext;
      tailstock.visible = ext;
      liveCentre.visible = ext;
      wheelT.visible = trav;
      wheelP.visible = mode === 'external-plunge';
      chuck.visible = !ext;
      intWork.visible = !ext;
      intHead.visible = !ext;
      arrowsExtTable.visible = trav || mode === 'internal';
      spinWrap.visible = ext;
    }

    function step() {
      let c = 0;
      let tx = 0;
      let contact = false;
      if (mode === 'external-traverse') {
        const p = (t % 14) / 14;
        const zEnd = R2 + R + 0.6;
        let z;
        if (p < 0.08) { c = -1.2; z = lerp(zEnd, R1 + R, ss(p / 0.08)); phaseName = 'approach'; }
        else if (p < 0.5) { c = lerp(-1.2, 1.2, (p - 0.08) / 0.42); z = R1 + R; phaseName = 'traverse pass'; }
        else if (p < 0.58) { c = 1.2; z = lerp(R1 + R, R2 + R, ss((p - 0.5) / 0.08)); phaseName = 'infeed d'; }
        else if (p < 0.92) { c = lerp(1.2, -1.2, (p - 0.58) / 0.34); z = R2 + R; phaseName = 'return pass'; }
        else { c = -1.2; z = lerp(R2 + R, zEnd, ss((p - 0.92) / 0.08)); phaseName = 'retract'; }
        wh.position.z = z;
        tx = -c;
        const fwd = p < 0.54;
        if (fwd) {
          const b = clamp(c + WT / 2, -BL, BL);
          setSeg(seg1, -BL, b, R1); setSeg(seg0, b, BL, R0); setSeg(seg2, 0, 0, 0);
        } else {
          const b = clamp(c - WT / 2, -BL, BL);
          setSeg(seg2, b, BL, R2); setSeg(seg1, -BL, b, R1); setSeg(seg0, 0, 0, 0);
        }
        rNow = fwd ? R1 : R2;
        contact = p > 0.08 && p < 0.92 && Math.abs(c) < 1.1;
        cPos = c;
        P[0] = 0; P[1] = YA + 0.0; P[2] = (fwd ? R1 : R2) + 0.03;
      } else if (mode === 'external-plunge') {
        const p = (t % 10) / 10;
        const zEnd = RP + R + 0.6;
        let z;
        if (p < 0.12) { z = lerp(zEnd, R0 + R + 0.05, ss(p / 0.12)); phaseName = 'approach'; }
        else if (p < 0.7) { z = lerp(R0 + R + 0.05, RP + R, (p - 0.12) / 0.58); phaseName = 'plunge infeed d'; }
        else if (p < 0.85) { z = RP + R; phaseName = 'spark-out'; }
        else { z = lerp(RP + R, zEnd, ss((p - 0.85) / 0.15)); phaseName = 'retract'; }
        wh.position.z = z;
        const r = p < 0.85 ? Math.min(R0, z - R) : RP;
        rNow = r;
        if (r >= R0 - 1e-4) { setSeg(seg0, -BL, BL, R0); setSeg(seg1, 0, 0, 0); }
        else { setSeg(seg0, 0, 0, 0); setSeg(seg1, -BL, BL, r); }
        setSeg(seg2, 0, 0, 0);
        contact = p > 0.12 && p < 0.85 && r < R0 - 1e-4;
        cPos = 0;
        P[0] = 0; P[1] = YA; P[2] = r + 0.03;
      } else {
        const p = (t % 12) / 12;
        tx = 0.8 * Math.cos((2 * Math.PI * t) / 3);
        const inf = p < 0.85 ? 0.04 * ss(p / 0.85) : 0.04 * (1 - ss((p - 0.85) / 0.15));
        intHead.position.z = -(0.17 + inf);
        phaseName = p < 0.85 ? 'reciprocate + infeed d' : 'retract';
        contact = p > 0.03 && p < 0.85;
        cPos = tx;
        P[0] = -0.5; P[1] = YA; P[2] = -0.43;
        rNow = 0.45 + inf;
      }
      table.position.x = tx;
      if (contact) {
        spawn += 1;
      }
      return contact;
    }

    function reset() {
      t = 0;
      wAng = 0;
      kAng = 0;
      spawn = 0;
      sparks.reset();
      applyVis();
      step();
    }
    reset();

    return {
      root,
      parts,
      modes,
      setMode(id) {
        mode = id;
        reset();
      },
      update(dt) {
        t += dt;
        wAng += dt * 15;
        kAng -= dt * 2.2;
        wheelSpin.rotation.x = wAng;
        intSpin.rotation.x = wAng * 1.6;
        wSpinExt.rotation.x = kAng;
        chuckSpin.rotation.x = kAng;
        spawn = 0;
        const contact = step();
        if (contact) {
          let n = Math.round(dt * 50 + Math.random());
          while (n-- > 0) {
            V[0] = (Math.random() - 0.5) * 0.8;
            V[1] = 1.6 + Math.random() * 1.0;
            V[2] = mode === 'internal' ? 1.2 + Math.random() : 0.8 + Math.random() * 0.6;
            sparks.emit(P, V);
          }
        }
        sparks.update(dt);
      },
      readout() {
        return [
          ['Mode', mode.replace('-', ' ')],
          ['Phase', phaseName],
          ['Wheel rotation (V = πDN)', 'fast, own motor'],
          ['Work rotation', 'slow, own motor, opposite sense'],
          ['Work radius now', `${(rNow * 10).toFixed(0)} mm (exaggerated)`],
          ['Wheel / work axial offset', mode === 'external-plunge' ? 'none (plunge)' : `${cPos.toFixed(2)} dm`],
        ];
      },
      legend: [['V', 'wheel rotation (cutting)'], ['f', 'work rotation / traverse'], ['d', 'infeed']],
    };
  },
};
