import * as THREE from 'three';
import { M, box, cyl, at, group, arrow } from '../kit.js';

// Schematic-but-3D hydraulic shaper drive. Ram stroke along x (forward = +x). Units dm.
const clamp01 = (a) => (a < 0 ? 0 : a > 1 ? 1 : a);

const AREA_RATIO = 0.6; // rod-side area / head-side area  (A2 / A1)
const DELTA = 0.3; // lever tip travel each side of centre (at dog height)
const LEV_H = 2.0; // lever length above its pivot
const LEV_DOG = 1.2; // height of dog contact above lever pivot
const PIVOT_Y = 1.0;
const DOG_X = 1.025;
const DOG_W = 0.25;
const P_MAX = 1.0;
const N_PART = 10;

const MODES = {
  'quick-return': 0.6,
  advantages: 0.6,
  'low-flow': 0.4,
  'high-flow': 0.9,
};

export default {
  id: 'hydraulic-shaper',
  title: 'Hydraulic shaper drive',
  subtitle: 'Oil circuit that gives constant-speed cutting and a quick return',
  camera: { position: [2.5, 8.5, 13], target: [-0.3, 1.4, 1] },
  build() {
    const root = new THREE.Group();

    // fluid materials (pressure = red-ish, return/low pressure = blue)
    const pressMat = M.fluid.clone();
    pressMat.color.set(0xe0503a);
    pressMat.opacity = 0.9;
    const returnMat = M.fluid.clone();
    returnMat.opacity = 0.9;
    const pressChamber = M.fluid.clone();
    pressChamber.color.set(0xe0503a);
    pressChamber.opacity = 0.6;
    const returnChamber = M.fluid.clone();
    returnChamber.opacity = 0.5;

    // base plate
    root.add(at(box(13, 0.2, 6.4, M.paintDark), -0.2, 0.1, 0.9));

    // ------------------------------------------------------------ tank
    const tank = new THREE.Group();
    tank.add(at(box(2, 1.5, 2, M.paintLight), -5, 0.95, -0.6));
    tank.add(at(box(1.2, 0.6, 0.04, M.oil), -5, 0.95, 0.42));
    tank.add(at(cyl(0.2, 0.15, M.steel), -5.5, 1.77, -1.2));
    tank.add(at(cyl(0.12, 0.2, M.black), -5.5, 1.9, -1.2));
    root.add(tank);

    // ------------------------------------------------------ pump + motor
    const pump = new THREE.Group();
    pump.add(at(cyl(0.5, 1.0, M.paintDark, { axis: 'x' }), -3.4, 0.7, -0.6));
    for (let i = 0; i < 5; i++) pump.add(at(cyl(0.53, 0.05, M.castIron, { axis: 'x' }), -3.8 + i * 0.2, 0.7, -0.6));
    pump.add(at(box(0.9, 0.2, 0.9, M.castIron), -3.4, 0.2, -0.6));
    pump.add(at(cyl(0.12, 0.3, M.chrome, { axis: 'x' }), -2.85, 0.7, -0.6));
    pump.add(at(cyl(0.38, 0.8, M.paint, { axis: 'x' }), -2.5, 0.7, -0.6));
    pump.add(at(cyl(0.2, 0.1, M.steel), -2.5, 1.12, -0.6));
    root.add(pump);

    // ---------------------------------------------------- relief valve
    const relief = new THREE.Group();
    relief.add(at(box(0.5, 0.6, 0.5, M.paint), -1.8, 2.3, -0.6));
    relief.add(at(cyl(0.18, 0.35, M.steel), -1.8, 2.75, -0.6));
    relief.add(at(cyl(0.06, 0.3, M.chrome), -1.8, 3.0, -0.6));
    relief.add(at(cyl(0.12, 0.05, M.red), -1.8, 3.17, -0.6));
    relief.add(at(cyl(0.07, 0.3, M.chrome), -1.8, 1.95, -0.6));
    root.add(relief);

    // ------------------------------------------------ flow control valve
    const fcv = new THREE.Group();
    fcv.add(at(cyl(0.3, 0.6, M.paint, { axis: 'x' }), -0.6, 1.8, -0.6));
    fcv.add(at(cyl(0.12, 0.3, M.steel), -0.6, 2.15, -0.6));
    const needle = new THREE.Group();
    needle.position.set(-0.6, 2.36, -0.6);
    needle.add(at(cyl(0.2, 0.08, M.black), 0, 0, 0));
    needle.add(at(box(0.34, 0.06, 0.06, M.amber), 0, 0.06, 0));
    fcv.add(needle);
    root.add(fcv);

    // ----------------------------------- 4/3 direction control valve
    const dcv = new THREE.Group();
    dcv.add(at(box(2, 0.9, 0.8, M.glass), 0, 0.9, 0.5));
    for (const x of [-1.15, 1.15]) dcv.add(at(box(0.3, 0.8, 0.7, M.paint), x, 0.9, 0.5));
    dcv.add(at(box(2, 0.06, 0.82, M.paintDark), 0, 1.35, 0.5));
    dcv.add(at(box(2, 0.06, 0.82, M.paintDark), 0, 0.45, 0.5));
    root.add(dcv);

    const spool = new THREE.Group();
    spool.position.set(0, 0.9, 0.5);
    spool.add(at(cyl(0.1, 3.5, M.chrome, { axis: 'x' }), 0, 0, 0));
    for (const x of [-0.6, 0.0, 0.6]) spool.add(at(cyl(0.31, 0.35, M.steel, { axis: 'x' }), x, 0, 0));
    spool.add(at(box(0.15, 0.4, 0.3, M.brass), 1.55, 0, 0));
    spool.add(at(cyl(0.05, 2.1, M.darkSteel), 1.55, 1.05, 0));
    root.add(spool);

    const startStop = new THREE.Group();
    startStop.position.set(-0.8, 1.38, 0.5);
    startStop.rotation.z = -0.45;
    startStop.add(at(cyl(0.04, 0.8, M.darkSteel), 0, 0.4, 0));
    startStop.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), M.red), 0, 0.82, 0));
    const ssBase = at(cyl(0.12, 0.08, M.castIron), -0.8, 1.4, 0.5);
    root.add(ssBase);
    root.add(startStop);
    const startStopPart = group(ssBase, startStop);
    root.remove(ssBase, startStop);
    root.add(startStopPart);

    // ---------------------------------------------------------- cylinder
    const cylinder = new THREE.Group();
    cylinder.add(at(cyl(0.6, 4, M.glass, { axis: 'x' }), 0, 1.2, 2.4));
    for (const x of [-2.075, 2.075]) cylinder.add(at(cyl(0.66, 0.15, M.paint, { axis: 'x' }), x, 1.2, 2.4));
    for (const x of [-1.4, 1.4]) cylinder.add(at(box(0.5, 0.45, 1.3, M.castIron), x, 0.42, 2.4));
    for (const x of [-1.0, 1.2]) cylinder.add(at(box(1.0, 0.15, 0.8, M.darkSteel), x, 1.875, 2.4));
    const unitCylX = (mat) => cyl(0.56, 1, mat, { axis: 'x' });
    const headP = unitCylX(pressChamber);
    const headR = unitCylX(returnChamber);
    const rodP = unitCylX(pressChamber);
    const rodR = unitCylX(returnChamber);
    for (const c of [headP, headR, rodP, rodR]) {
      c.position.set(0, 1.2, 2.4);
      cylinder.add(c);
    }
    root.add(cylinder);

    // piston, rod, ram, dogs (move together)
    const pistonG = new THREE.Group();
    pistonG.position.set(-0.9, 1.2, 2.4);
    root.add(pistonG);

    const pistRod = new THREE.Group();
    pistRod.add(at(cyl(0.58, 0.3, M.steel, { axis: 'x' }), 0, 0, 0));
    pistRod.add(at(cyl(0.2, 3.6, M.chrome, { axis: 'x' }), 1.8, 0, 0));
    pistRod.add(at(box(0.4, 0.9, 0.5, M.castIron), 3.5, 0.55, 0));
    pistonG.add(pistRod);

    const ram = new THREE.Group();
    ram.add(at(box(5.6, 0.5, 0.8, M.paintLight), 1.1, 1.0, 0));
    ram.add(at(box(0.5, 0.8, 0.6, M.paint), 4.15, 0.7, 0));
    ram.add(at(box(0.1, 0.35, 0.2, M.hss), 4.25, 0.2, 0));
    ram.add(arrow([0.5, 1.4, 0], [1, 0, 0], 1.3, M.vColor));
    pistonG.add(ram);

    const dogs = new THREE.Group();
    dogs.add(at(box(3.4, 0.12, 0.1, M.darkSteel), 0, 1.0, 0.45));
    const dogL = at(box(DOG_W, 0.4, 0.5, M.red), -DOG_X, 1.0, 0.75);
    const dogR = at(box(DOG_W, 0.4, 0.5, M.blue), DOG_X, 1.0, 0.75);
    dogs.add(dogL, dogR);
    pistonG.add(dogs);

    // reversing lever + link to spool
    const leverPart = new THREE.Group();
    leverPart.add(at(box(0.3, 0.8, 0.3, M.castIron), 0, 0.6, 3.15));
    const leverG = new THREE.Group();
    leverG.position.set(0, PIVOT_Y, 3.15);
    leverG.add(at(cyl(0.05, LEV_H, M.darkSteel), 0, LEV_H / 2, 0));
    leverG.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), M.amber), 0, LEV_H, 0));
    leverG.add(at(cyl(0.1, 0.12, M.brass, { axis: 'z' }), 0, 0, 0));
    leverPart.add(leverG);
    const linkRod = box(1, 0.07, 0.07, M.darkSteel);
    leverPart.add(linkRod);
    root.add(leverPart);

    // ------------------------------------------------------------ pipes
    const mk = (pts) => new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    const pipeDefs = [
      { id: 'suction', pts: [[-4.0, 0.45, -1.35], [-2.5, 0.45, -1.35], [-2.5, 0.45, -1.1], [-2.5, 0.55, -0.98]], kind: 'ret' },
      { id: 'pump', pts: [[-2.5, 1.12, -0.6], [-2.5, 1.8, -0.6], [-1.8, 1.8, -0.6], [-0.9, 1.8, -0.6]], kind: 'press' },
      { id: 'relief', pts: [[-1.55, 2.3, -0.6], [-1.3, 2.3, -0.6], [-1.3, 3.1, -0.6], [-3, 3.1, -0.6], [-5, 3.1, -0.6], [-5, 2.4, -0.6], [-5, 1.7, -0.6]], kind: 'ret' },
      { id: 'supply', pts: [[-0.3, 1.8, -0.6], [-0.3, 1.8, -0.05], [-0.3, 1.5, 0.05], [-0.3, 1.3, 0.12]], kind: 'press' },
      { id: 'tankline', pts: [[0.3, 0.95, 0.12], [0.3, 0.6, 0.2], [0.3, 0.4, 0.3], [-1, 0.4, 0.3], [-3, 0.4, 0.3], [-3.95, 0.4, 0.2]], kind: 'ret' },
      { id: 'portA', pts: [[-0.6, 0.9, 0.9], [-0.6, 0.5, 1.2], [-0.9, 0.4, 1.5], [-1.85, 0.4, 1.9], [-1.85, 0.55, 2.4]], kind: 'dual' },
      { id: 'portB', pts: [[0.6, 0.9, 0.9], [0.6, 0.5, 1.2], [0.9, 0.4, 1.5], [1.85, 0.4, 1.9], [1.85, 0.55, 2.4]], kind: 'dual' },
    ];
    const pipes = new THREE.Group();
    const flowGeo = new THREE.SphereGeometry(0.1, 8, 6);
    const flowMat = M.white;
    const dummy = new THREE.Object3D();
    const tmp = new THREE.Vector3();
    const pipeObjs = pipeDefs.map((d) => {
      const curve = mk(d.pts);
      const geo = new THREE.TubeGeometry(curve, 60, 0.07, 8, false);
      const o = { def: d, curve, phase: Math.random(), meshes: [] };
      if (d.kind === 'press') o.meshes.push(new THREE.Mesh(geo, pressMat));
      else if (d.kind === 'ret') o.meshes.push(new THREE.Mesh(geo, returnMat));
      else {
        o.meshes.push(new THREE.Mesh(geo, pressMat), new THREE.Mesh(geo, returnMat));
      }
      for (const m of o.meshes) {
        m.castShadow = true;
        pipes.add(m);
      }
      o.inst = new THREE.InstancedMesh(flowGeo, flowMat, N_PART);
      o.inst.frustumCulled = false;
      pipes.add(o.inst);
      return o;
    });
    root.add(pipes);
    const P = {};
    pipeObjs.forEach((o) => (P[o.def.id] = o));

    // -------------------------------------------------------------- state
    let Q = MODES['quick-return'];
    let curMode = 'quick-return';
    let p = -0.9;
    let v = Q;
    let dir = 1;
    let xt = -DELTA;
    let sp = -0.4;
    let vNow = Q;

    function setFlows(o, speed) {
      o.speed = speed;
    }

    function place() {
      pistonG.position.x = p;
      // chamber lengths
      const headLen = p + 1.85;
      const headC = (-2 + p - 0.15) / 2;
      const rodLen = 1.85 - p;
      const rodC = (p + 0.15 + 2) / 2;
      for (const c of [headP, headR]) {
        c.scale.x = headLen;
        c.position.x = headC;
      }
      for (const c of [rodP, rodR]) {
        c.scale.x = rodLen;
        c.position.x = rodC;
      }
      const fwd = dir > 0;
      headP.visible = fwd;
      headR.visible = !fwd;
      rodP.visible = !fwd;
      rodR.visible = fwd;
      P.portA.meshes[0].visible = fwd;
      P.portA.meshes[1].visible = !fwd;
      P.portB.meshes[0].visible = !fwd;
      P.portB.meshes[1].visible = fwd;
      spool.position.x = sp;
      // lever
      const ang = Math.atan(xt / LEV_DOG);
      leverG.rotation.z = -ang;
      const topX = Math.tan(ang) * LEV_H;
      // link: lever top (topX, 3.0, 3.15) -> (1.55 + sp, 3.0, 0.5)
      const ax = topX;
      const az = 3.15;
      const bx = 1.55 + sp;
      const bz = 0.5;
      const dx = bx - ax;
      const dz = bz - az;
      linkRod.scale.x = Math.sqrt(dx * dx + dz * dz);
      linkRod.position.set((ax + bx) / 2, PIVOT_Y + LEV_H, (az + bz) / 2);
      linkRod.rotation.y = Math.atan2(-dz, dx);
      needle.rotation.y = (Q / 0.6) * 2.5;
    }

    function flows() {
      const f = v;
      P.suction.speed = Q * 1.25;
      P.pump.speed = Q * 1.25;
      P.relief.speed = Q * 0.25;
      P.supply.speed = Q;
      P.tankline.speed = f > 0 ? AREA_RATIO * f : -f;
      P.portA.speed = f;
      P.portB.speed = -AREA_RATIO * f;
    }

    function stepParticles(dt) {
      for (const o of pipeObjs) {
        o.phase += o.speed * dt * 0.35;
        o.phase -= Math.floor(o.phase);
        const on = Math.abs(o.speed) > 0.02;
        for (let j = 0; j < N_PART; j++) {
          let u = o.phase + j / N_PART;
          u -= Math.floor(u);
          o.curve.getPointAt(u, tmp);
          dummy.position.copy(tmp);
          dummy.scale.setScalar(on ? 1 : 0.0001);
          dummy.updateMatrix();
          o.inst.setMatrixAt(j, dummy.matrix);
        }
        o.inst.instanceMatrix.needsUpdate = true;
      }
    }

    function reset() {
      p = -0.9;
      dir = 1;
      v = Q;
      xt = -DELTA;
      sp = -0.4;
      flows();
      place();
      stepParticles(0);
    }
    reset();

    function step(dt) {
      const vt = dir > 0 ? Q : -Q / AREA_RATIO;
      v += (vt - v) * Math.min(1, dt * 10);
      p += v * dt;
      if (p > P_MAX) p = P_MAX;
      if (p < -P_MAX) p = -P_MAX;
      const faceL = p - DOG_X + DOG_W / 2;
      const faceR = p + DOG_X - DOG_W / 2;
      if (dir > 0) {
        xt += (-DELTA - xt) * Math.min(1, dt * 12);
        if (faceL > xt) xt = faceL;
        if (xt >= 0) dir = -1;
      } else {
        xt += (DELTA - xt) * Math.min(1, dt * 12);
        if (faceR < xt) xt = faceR;
        if (xt <= 0) dir = 1;
      }
      sp += ((dir > 0 ? -0.4 : 0.4) - sp) * Math.min(1, dt * 14);
    }

    const ADV =
      'Advantages over the mechanical (crank) shaper: cutting speed stays constant through the whole stroke, so the full power and tool capacity can be used; the ram reverses quickly and without shock because the moving mass is small; the range and number of cutting speeds is large; more strokes per minute are possible because reversal takes less time. Disadvantages: more expensive, and the stopping point of the cutting stroke can vary with the cutting resistance of the work material.';

    const hq = ['2023-24_5c', '2020-21_1c', '2016-17_6c', '2014-15_6c', '2012-13_5d', '2009-10_6c'];
    const parts = [
      { id: 'tank', name: 'Reservoir (tank)', object: tank, slide: 100, qs: hq,
        desc: 'Holds the hydraulic oil. The pump draws oil from it, and the return oil from the direction control valve and the relief valve flows back into it.', anchor: [-5, 1.8, -0.6] },
      { id: 'pump', name: 'Pump & motor', object: pump, slide: 100, qs: hq,
        desc: 'The electric motor drives the hydraulic pump, which delivers a steady flow of high-pressure oil to the system.', anchor: [-3.2, 1.3, -0.6] },
      { id: 'relief-valve', name: 'Relief valve', object: relief, slide: 99, qs: hq,
        desc: 'Limits the system pressure: oil not needed by the cylinder (the flow control valve passes less than the pump delivers) escapes through it back to the tank.', anchor: [-1.8, 3.3, -0.6] },
      { id: 'flow-control-valve', name: 'Flow control valve', object: fcv, slide: 100, qs: hq,
        desc: 'Controls the flow rate of hydraulic fluid, and thereby the speed at which the ram moves. Opening it raises the speed of both strokes.', anchor: [-0.6, 2.5, -0.6] },
      { id: 'dcv', name: '4/3 direction control valve', object: dcv, slide: 100, qs: hq,
        desc: 'Connected to pump, reservoir and both ends of the cylinder. It directs high-pressure oil to one side of the piston and exhausts the other side, deciding whether the ram makes the cutting or the return stroke.', anchor: [0, 1.5, 0.5] },
      { id: 'spool', name: 'Valve spool', object: spool, slide: 100, qs: hq,
        desc: 'The spool shifts when the reversing lever is tripped, connecting the pressure port to the other cylinder port and reversing the ram.', anchor: [0, 1.3, 0.5] },
      { id: 'cylinder', name: 'Double-acting cylinder', object: cylinder, slide: 99, qs: hq,
        desc: 'Oil to the full-bore (head) side gives the slow, powerful cutting stroke; oil to the rod side, where the piston area is smaller, moves the ram faster for the quick return at the same pump flow.', anchor: [0, 1.9, 2.4] },
      { id: 'piston-rod', name: 'Piston & rod', object: pistRod, slide: 99, qs: hq,
        desc: 'The piston rod is connected to the ram, so the ram moves with the piston at constant speed during each stroke (v = flow / area).', anchor: [2.5, 1.6, 2.4] },
      { id: 'ram', name: 'Ram', object: ram, slide: 99, qs: hq,
        desc: 'Carries the tool and is driven by the piston rod. Constant ram speed means constant cutting speed over the whole stroke, unlike the crank shaper where it varies continuously.', anchor: [1.5, 2.6, 2.4] },
      { id: 'trip-dogs', name: 'Adjustable trip dogs', object: dogs, slide: 100, qs: hq,
        desc: 'Two dogs clamped on the ram. At the end of each stroke a dog strikes the reversing lever; their spacing sets the length of the stroke and they can be adjusted.', anchor: [0, 2.6, 3.1] },
      { id: 'reversing-lever', name: 'Reversing lever', object: leverPart, slide: 100, qs: hq,
        desc: 'The adjustable trip-dog-operated lever shifts the direction control valve to reverse the ram at the end of each stroke.', anchor: [0, 3.2, 3.15] },
      { id: 'start-stop', name: 'Start / stop lever', object: startStopPart, slide: 100, qs: hq,
        desc: 'A finger-operated lever used for starting and stopping the machine.', anchor: [-0.8, 2.3, 0.5] },
      { id: 'pipes', name: 'Pipes (pressure & return)', object: pipes, slide: 99, qs: hq,
        desc: 'Red lines carry high-pressure oil from the pump; blue lines carry low-pressure return oil to the tank. The white beads show the oil flow direction and rate.', anchor: [-2.5, 2.0, -0.6] },
    ];

    const modes = [
      { id: 'quick-return', label: 'Quick return', slide: 99, qs: hq,
        info: 'The ram is joined to a hydraulic cylinder and the direction control valve sends pump oil to one side of the piston. On the cutting stroke oil goes to the large-area head side, so the ram moves slowly. On the return stroke the oil goes to the rod side, where the area is smaller, so the same flow moves the ram faster. Trip dogs on the ram operate the reversing lever, which shifts the valve spool at the end of each stroke.' },
      { id: 'advantages', label: 'Advantages / disadvantages', slide: 101, qs: hq, info: ADV },
      { id: 'low-flow', label: 'Flow valve: low', slide: 100, qs: hq,
        info: 'The flow control valve is nearly closed, so little oil reaches the cylinder: the ram is slower on both strokes, and the excess pump oil returns to the tank over the relief valve.' },
      { id: 'high-flow', label: 'Flow valve: high', slide: 100, qs: hq,
        info: 'The flow control valve is opened further, so more oil per second reaches the cylinder and the ram speed rises on both strokes (the return stroke stays faster by the area ratio).' },
    ];

    return {
      root,
      parts,
      modes,
      setMode(id) {
        curMode = MODES[id] !== undefined ? id : 'quick-return';
        Q = MODES[curMode];
        reset();
      },
      update(dt) {
        if (dt > 0.05) dt = 0.05;
        step(dt);
        flows();
        place();
        stepParticles(dt);
        vNow = v;
      },
      readout() {
        const pct = Math.round(clamp01((p + 0.9) / 1.8) * 100);
        const fwd = dir > 0;
        return [
          ['Ram stroke', pct + ' %'],
          ['Ram speed', Math.abs(vNow).toFixed(2) + ' dm/s (constant in the stroke)'],
          ['Direction', fwd ? 'Forward / cutting (oil to head end, large area)' : 'Return (oil to rod end, small area)'],
          ['Valve spool', Math.abs(sp) > 0.38 ? (sp < 0 ? 'forward position' : 'return position') : 'shifting'],
          ['Return / cutting speed', (1 / AREA_RATIO).toFixed(2) + ' : 1'],
        ];
      },
      legend: [['V', 'ram (cutting) direction'], ['red', 'pressure oil'], ['blue', 'return oil']],
    };
  },
};
