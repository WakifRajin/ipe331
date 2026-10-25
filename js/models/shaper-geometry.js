import * as THREE from 'three';
import { M, box, cyl, extrude, at, arrow } from '../kit.js';

// Shaping: effect of feed per stroke, and common shaped products.
// Stroke axis x (cutting = +x); work cross-section lies in the z-y plane and is extruded along x.
const clamp01 = (a) => (a < 0 ? 0 : a > 1 ? 1 : a);
const sstep = (a) => {
  a = clamp01(a);
  return a * a * (3 - 2 * a);
};

const PERIOD = 4;
const FW = 0.6;
const NOSE_R = 0.8;
const EXAG = 2; // ridge height exaggeration in the figure
const D_CUT = 0.6; // depth of cut shown in feed modes
const YB = 1.5; // top of the machined body in feed modes
const WB = 3.2; // work width in feed modes
const L_FEED = 2.0;

const FEED_MODES = { 'feed-small': 8, 'feed-large': 3 }; // number of ridges across WB

const PRODUCT_IDS = ['v-block', 'dovetail', 'keyway-external', 'keyway-internal', 'rack', 't-slot'];

const circlePts = (cy, r, a0, a1, n) => {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push([r * Math.sin(a), cy + r * Math.cos(a)]);
  }
  return pts;
};

function clearGroup(g) {
  while (g.children.length) {
    const c = g.children.pop();
    c.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
    });
  }
}

// polygon given as [z,y]; mesh extruded along x by `len`
const prism = (zy, len, mat) => extrude(zy.map(([z, y]) => [-z, y]), len, mat, { axis: 'x' });

export default {
  id: 'shaper-geometry',
  title: 'Shaping: feed & common geometry',
  subtitle: 'How feed per stroke sets surface finish, and typical shaped products',
  camera: { position: [7.5, 6.5, 9.5], target: [-0.3, 1.6, 0] },
  build() {
    const root = new THREE.Group();

    const baseG = new THREE.Group();
    baseG.add(at(box(6.4, 0.5, 5.2, M.castIron), 0, 0.25, 0));
    for (const z of [-1.9, 0, 1.9]) baseG.add(at(box(6.4, 0.02, 0.16, M.black), 0, 0.501, z));
    root.add(baseG);

    const workG = new THREE.Group();
    root.add(workG);

    // moving tool + ram
    const toolG = new THREE.Group();
    root.add(toolG);
    const toolBit = new THREE.Group();
    toolG.add(toolBit);
    const ramPart = new THREE.Group();
    ramPart.add(at(box(0.8, 0.9, 0.55, M.paint), 0, 1.55, 0));
    ramPart.add(at(box(3.2, 0.5, 0.8, M.paintLight), -1.7, 2.25, 0));
    ramPart.add(at(cyl(0.06, 0.4, M.chrome), 0, 2.15, 0));
    ramPart.add(arrow([-2.8, 2.75, 0], [1, 0, 0], 1.3, M.vColor));
    toolG.add(ramPart);
    const extras = new THREE.Group(); // dimension arrows etc. (static, per mode)
    root.add(extras);

    const parts = [
      { id: 'table', name: 'Table / base', object: baseG, slide: 89,
        desc: 'The work is held rigidly on the table (here on its T-slots) and is fed sideways by the feed per stroke.' },
      { id: 'workpiece', name: 'Workpiece', object: workG, slide: 86, qs: ['2023-24_5a', '2021-22_2a', '2016-17_6a'],
        desc: 'The surface left behind consists of ridges (scallops) whose spacing equals the feed per stroke. In the other modes it shows common shaped geometry.' },
      { id: 'tool', name: 'Single-point tool', object: toolBit, slide: 85, qs: ['2013-14_6d'],
        desc: 'A single-point tool cuts only on the forward stroke; the clapper box lifts it on the return. The depth of cut d is the distance between the work and machined surfaces.' },
      { id: 'ram', name: 'Ram & tool head', object: ramPart, slide: 84,
        desc: 'The ram carries the tool in a straight-line reciprocating motion; cutting velocity is zero at the ends of the stroke, rises to a maximum and falls again.' },
    ];

    const FEED_INFO = (n, f) =>
      'Feed per stroke f is the sideways step of the work (mm per stroke) at right angles to the cutting direction. The tool leaves ridges spaced exactly f apart; their height is about h = f² / (8 r), where r is the nose radius, so doubling the feed gives about four times the ridge height. ' +
      (n > 5
        ? 'Small feed: closely spaced low ridges, good surface finish, but many strokes and long machining time.'
        : 'Large feed: widely spaced tall ridges, rough surface, but few strokes and short machining time.') +
      ' (Ridge height is exaggerated x2 in the figure.)';

    const modes = [
      { id: 'feed-small', label: 'Small feed', slide: 86, qs: ['2023-24_5a', '2021-22_2a', '2016-17_6a'], info: FEED_INFO(8) },
      { id: 'feed-large', label: 'Large feed', slide: 86, qs: ['2023-24_5a', '2021-22_2a', '2016-17_6a'], info: FEED_INFO(3) },
      { id: 'v-block', label: 'V-block', slide: 93, qs: ['2018-19_6c', '2017-18_6b'],
        info: 'A V-groove is cut by shaping with the tool head swivelled or with an angle tool. V-blocks are typical shaping products (slide: making a V block).' },
      { id: 'dovetail', label: 'Dovetail', slide: 94, qs: ['2018-19_6c', '2017-18_6b'],
        info: 'A dovetail slide is shaped with the tool head swung over to the dovetail angle and an angle-cutting tool, one flank at a time.' },
      { id: 'keyway-external', label: 'Keyway (external)', slide: 94, qs: ['2018-19_6c', '2017-18_6b'],
        info: 'An external keyway on a shaft is cut along the shaft axis with a square-nose tool; the shaft is clamped in V-blocks or a vise.' },
      { id: 'keyway-internal', label: 'Keyway (internal)', slide: 95, qs: ['2018-19_6c', '2017-18_6b'],
        info: 'An internal keyway in a hub or gear bore is cut with a slender tool bar reaching through the bore; the cut is made on the stroke along the bore axis.' },
      { id: 'rack', label: 'Rack', slide: 95, qs: ['2018-19_6c', '2017-18_6b'],
        info: 'Straight rack teeth are cut one tooth space at a time with a pointed tool and an indexed table feed equal to the tooth pitch.' },
      { id: 't-slot', label: 'T-slot', slide: 92, qs: ['2018-19_6c', '2017-18_6b'],
        info: 'A T-slot is made in stages: first the vertical neck slot with a square tool, then the wide undercut with side-cutting (bent) tools.' },
    ];

    // ----------------------------------------------------------------- stage state
    let mode = 'feed-small';
    let cyc = 0;
    let phi = 0;
    let kk = 0;
    let X = 1.6; // half stroke of tool tip
    let tipY = YB;
    let tipZ = 0;
    let lift = 0;
    let curX = -X;
    const feed = { on: false, n: 0, f: 0, ridges: [], mainSlab: null, strip: null };

    function toolMesh(poly, thick, mat = M.hss) {
      return prism(poly, thick, mat);
    }

    function mountTool(poly, thick, shankPoly) {
      const t = toolMesh(poly, thick);
      toolBit.add(t);
      if (shankPoly) toolBit.add(toolMesh(shankPoly, thick, M.darkSteel));
    }

    function build(id) {
      clearGroup(workG);
      clearGroup(toolBit);
      clearGroup(extras);
      feed.on = false;
      feed.ridges = [];
      const matW = M.workCut;
      const nRidges = FEED_MODES[id];
      if (nRidges) {
        const n = nRidges;
        const f = WB / n;
        feed.on = true;
        feed.n = n;
        feed.f = f;
        X = L_FEED / 2 + 0.6;
        workG.add(at(box(L_FEED, 1.0, WB, matW), 0, 1.0, 0));
        // ridge profile (z,y), valley at z=0
        const seg = 10;
        const pts = [];
        for (let i = 0; i <= seg; i++) {
          const z = -f / 2 + (f * i) / seg;
          pts.push([z, EXAG * (NOSE_R - Math.sqrt(NOSE_R * NOSE_R - z * z))]);
        }
        pts.push([f / 2, -0.02], [-f / 2, -0.02]);
        const proto = prism(pts, 1, matW);
        for (let i = 0; i < n; i++) {
          const m = new THREE.Mesh(proto.geometry, matW);
          m.castShadow = true;
          m.position.set(0, YB, -WB / 2 + f / 2 + i * f);
          workG.add(m);
          feed.ridges.push(m);
        }
        const mainSlab = box(1, D_CUT, 1, M.work);
        const strip = box(1, D_CUT, 1, M.work);
        workG.add(mainSlab, strip);
        feed.mainSlab = mainSlab;
        feed.strip = strip;
        // pointed-nose tool (front view): nose arc radius NOSE_R, tip at origin
        const tp = [];
        const half = Math.min(f / 2, NOSE_R * 0.95);
        for (let i = 0; i <= 8; i++) {
          const z = -half + (2 * half * i) / 8;
          tp.push([z, NOSE_R - Math.sqrt(NOSE_R * NOSE_R - z * z)]);
        }
        tp.push([0.62, 1.1], [-0.62, 1.1]);
        mountTool(tp, 0.35, [[-0.35, 1.1], [0.35, 1.1], [0.35, 1.7], [-0.35, 1.7]]);
        tipY = YB;
        tipZ = -WB / 2 + f / 2;
        // arrows: depth of cut and feed
        extras.add(arrow([-L_FEED / 2 - 0.35, YB + D_CUT, -WB / 2 - 0.4], [0, -1, 0], D_CUT, M.dColor, { head: 0.15 }));
        extras.add(arrow([L_FEED / 2 + 0.5, YB + D_CUT + 0.35, -f * 1.0], [0, 0, 1], Math.max(f, 0.7), M.fColor));
        return;
      }

      X = 1.9;
      const len = 2.4;
      let toolZ = 0;
      if (id === 'v-block') {
        const poly = [[-1.5, 0.5], [1.5, 0.5], [1.5, 1.7], [0.9, 1.7], [0, 0.8], [-0.9, 1.7], [-1.5, 1.7]];
        workG.add(prism(poly, len, matW));
        mountTool([[0, 0], [0.9, 0.9], [0.9, 1.8], [-0.9, 1.8], [-0.9, 0.9]], 0.35, null);
        tipY = 0.8;
      } else if (id === 'dovetail') {
        const poly = [[-1.7, 0.5], [1.7, 0.5], [1.7, 1.0], [0.5, 1.0], [0.96, 1.8], [-0.96, 1.8], [-0.5, 1.0], [-1.7, 1.0]];
        workG.add(prism(poly, len, matW));
        mountTool([[0, 0], [1.3, 0], [1.3, 1.9], [1.09, 1.9]], 0.35, null);
        tipY = 1.0;
        toolZ = 0.5;
      } else if (id === 'keyway-external') {
        const r = 1.0;
        const cy = 1.7;
        const w = 0.25;
        const dp = 0.35;
        const a0 = Math.asin(w / r);
        const pts = circlePts(cy, r, a0, Math.PI * 2 - a0, 48);
        const ySlot = cy + Math.sqrt(r * r - w * w) - dp;
        pts.push([-w, ySlot], [w, ySlot]);
        workG.add(prism(pts, len, matW));
        for (const x of [-0.8, 0.8]) workG.add(at(prism([[-1.0, 0.5], [1.0, 0.5], [1.0, 0.7], [0.1, 0.7], [0, 0.65], [-0.1, 0.7], [-1.0, 0.7]], 0.4, M.paintDark), x, 0, 0));
        mountTool([[-w + 0.02, 0], [w - 0.02, 0], [w - 0.02, 0.9], [-w + 0.02, 0.9]], 0.4, [[-0.3, 0.9], [0.3, 0.9], [0.3, 1.6], [-0.3, 1.6]]);
        tipY = ySlot;
      } else if (id === 'keyway-internal') {
        const r = 0.8;
        const cy = 1.6;
        const w = 0.2;
        const a0 = Math.asin(w / r);
        const outer = [[-1.5, 0.5], [1.5, 0.5], [1.5, 2.7], [-1.5, 2.7]];
        const hole = circlePts(cy, r, a0, Math.PI * 2 - a0, 40);
        const yTopSlot = cy + r + 0.25;
        const yc = cy + Math.sqrt(r * r - w * w);
        hole.push([-w, yc], [-w, yTopSlot], [w, yTopSlot], [w, yc]);
        const hs = hole.map(([z, y]) => [-z, y]).reverse();
        workG.add(extrude(outer.map(([z, y]) => [-z, y]), len, matW, { axis: 'x', holes: [hs] }));
        // boring bar through the bore, bit pointing up at its right end
        const bar = [[-0.18, -0.35], [0.18, -0.35], [0.18, -0.05], [-0.18, -0.05]];
        const bartool = prism(bar.map(([z, y]) => [z, y]), 3.2, M.darkSteel);
        bartool.position.x = -1.6;
        toolBit.add(bartool);
        mountTool([[-0.18, 0], [0.18, 0], [0.18, 0.02], [-0.18, 0.02]], 0.35, [[-0.18, -0.05], [0.18, -0.05], [0.18, 0], [-0.18, 0]]);
        const post = at(box(0.5, 1.0, 0.45, M.darkSteel), -3.3, 0.2, 0);
        toolBit.add(post);
        tipY = yTopSlot;
      } else if (id === 'rack') {
        const pts = [[-1.5, 0.5], [1.5, 0.5], [1.5, 1.2]];
        const nTooth = 6;
        const pitch = 3 / nTooth;
        for (let i = nTooth - 1; i >= 0; i--) {
          const z0 = -1.5 + i * pitch;
          pts.push([z0 + pitch * 0.85, 1.2], [z0 + pitch * 0.62, 1.6], [z0 + pitch * 0.38, 1.6], [z0 + pitch * 0.15, 1.2]);
        }
        pts.push([-1.5, 1.2]);
        // remove duplicate consecutive points
        const clean = pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]);
        workG.add(prism(clean, len, matW));
        mountTool([[0, 0], [0.2, 0.45], [0.35, 1.4], [-0.35, 1.4], [-0.2, 0.45]], 0.35, [[-0.35, 1.4], [0.35, 1.4], [0.35, 2.0], [-0.35, 2.0]]);
        tipY = 1.2;
        toolZ = -1.5 + 4 * pitch + pitch * 0.5;
      } else {
        // t-slot
        const poly = [[-1.6, 0.5], [1.6, 0.5], [1.6, 2.1], [0.25, 2.1], [0.25, 1.5], [0.65, 1.5], [0.65, 1.0], [-0.65, 1.0], [-0.65, 1.5], [-0.25, 1.5], [-0.25, 2.1], [-1.6, 2.1]];
        workG.add(prism(poly, len, matW));
        mountTool([[-0.15, 0], [0.5, 0], [0.5, 0.5], [0.15, 0.5], [0.15, 1.8], [-0.15, 1.8]], 0.35, null);
        tipY = 1.0;
        toolZ = 0;
      }
      tipZ = toolZ;
      extras.add(arrow([-X - 0.2, 0.9, 2.4], [0, 0, -1], 0.7, M.fColor));
    }

    function reset() {
      cyc = 0;
      kk = 0;
      apply();
    }

    function apply() {
      const n = Math.floor(cyc);
      phi = cyc - n;
      let s;
      let u;
      if (phi < FW) {
        u = phi / FW;
        s = 0.5 * u + 0.5 * sstep(u);
        curX = -X + 2 * X * s;
      } else {
        u = (phi - FW) / (1 - FW);
        s = 0.5 * u + 0.5 * sstep(u);
        curX = X - 2 * X * s;
      }
      lift = phi < FW + 0.02 ? 0 : sstep((phi - FW - 0.02) / 0.05) * (1 - sstep((phi - 0.9) / 0.08));
      toolG.position.x = curX;
      toolG.position.y = tipY + lift * 0.3;
      if (feed.on) {
        const N = feed.n;
        const f = feed.f;
        kk = n % N;
        const idx = sstep((phi - 0.86) / 0.14);
        toolG.position.z = -WB / 2 + f / 2 + (kk + idx) * f;
        const half = L_FEED / 2;
        const fwd = phi < FW;
        const xs = fwd ? Math.max(-half, Math.min(half, curX)) : half;
        for (let i = 0; i < N; i++) {
          const m = feed.ridges[i];
          let ln = 0;
          if (i < kk) ln = L_FEED;
          else if (i === kk) ln = xs + half;
          if (ln > 1e-3) {
            m.visible = true;
            m.scale.x = ln;
            m.position.x = -half + ln / 2;
          } else m.visible = false;
        }
        // raw material remaining
        const zc = -WB / 2 + f / 2 + kk * f;
        const zStart = zc + f / 2;
        const mainLen = WB / 2 - zStart;
        const ms = feed.mainSlab;
        if (mainLen > 1e-3) {
          ms.visible = true;
          ms.scale.set(L_FEED, 1, mainLen);
          ms.position.set(0, YB + D_CUT / 2, zStart + mainLen / 2);
        } else ms.visible = false;
        const st = feed.strip;
        const sl = half - xs;
        if (sl > 1e-3 && fwd) {
          st.visible = true;
          st.scale.set(sl, 1, f);
          st.position.set(xs + sl / 2, YB + D_CUT / 2, zc);
        } else st.visible = false;
      } else {
        toolG.position.z = tipZ;
      }
    }

    build(mode);
    apply();

    return {
      root,
      parts,
      modes,
      setMode(id) {
        mode = FEED_MODES[id] || PRODUCT_IDS.includes(id) ? id : 'feed-small';
        build(mode);
        reset();
      },
      update(dt) {
        cyc += dt / PERIOD;
        apply();
      },
      readout() {
        const fwd = phi < FW;
        if (feed.on) {
          const f = feed.f;
          const h = (f * f) / (8 * NOSE_R);
          return [
            ['Stroke', fwd ? 'Cutting (forward)' : 'Return (idle)'],
            ['Feed per stroke f', f.toFixed(2) + ' dm (figure scale)'],
            ['Ridge height h = f²/8r', h.toFixed(3) + ' dm  (' + ((h / f) * 100).toFixed(1) + '% of f)'],
            ['Strokes to cover width', String(feed.n)],
            ['Current stroke', kk + 1 + ' / ' + feed.n],
          ];
        }
        return [
          ['Product', mode],
          ['Stroke', fwd ? 'Cutting (forward)' : 'Return (idle, tool lifted)'],
          ['Tool position', (curX >= 0 ? '+' : '') + curX.toFixed(2) + ' dm'],
        ];
      },
      legend: [['V', 'cutting motion (ram)'], ['f', 'feed (table, at right angles)'], ['d', 'depth of cut']],
    };
  },
};
