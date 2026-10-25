// Headless smoke test for effect labs: node tools/smoke-lab.mjs js/labs/<id>.js [...]
// Builds the lab against stub runtime objects, visits every step, changes every param, runs frames,
// and calls overlay/hud/readouts/plot. Catches runtime errors and contract slips; it cannot judge visuals.
import * as THREE from 'three';
import * as kit from '../js/kit.js';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

globalThis.document ??= {
  createElement: () => ({ getContext: () => new Proxy({}, { get: (t, k) => (k === 'measureText' ? () => ({ width: 40 }) : () => {}), set: () => true }), width: 0, height: 0 }),
};
const g2d = new Proxy({}, { get: (t, k) => (k === 'measureText' ? () => ({ width: 40 }) : () => {}), set: () => true });
const draft = new Proxy({}, { get: () => (...args) => { for (const a of args) if (Array.isArray(a) && a.some((x) => Array.isArray(x) ? x.some(Number.isNaN) : Number.isNaN(x))) throw new Error('NaN passed to draft'); } });

let failed = false;
for (const file of process.argv.slice(2)) {
  const label = path.basename(file);
  const problems = [];
  try {
    const mod = (await import(pathToFileURL(path.resolve(file)).href)).default;
    for (const k of ['id', 'chapter', 'title', 'eyebrow', 'sub', 'blurb', 'params', 'build']) if (mod[k] == null) problems.push(`missing ${k}`);
    if (mod.id !== path.basename(file, '.js')) problems.push('id must equal file name');
    const P = { ...mod.params };
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1.3, 0.02, 500);
    const ctx = { THREE, kit, scene, camera, controls: { target: new THREE.Vector3(), update() {} }, renderer: {}, P, css: () => '#888', stage: {}, sun: new THREE.DirectionalLight(), flyTo() {}, rerender() {} };
    const lab = mod.build(ctx);
    const steps = lab.steps || [];
    if (steps.length < 5) problems.push(`only ${steps.length} steps (want 6–10)`);
    const ids = new Set();
    let tris = 0;
    for (const s of steps) {
      if (!s.id || !s.title || !s.html) problems.push(`step missing id/title/html: ${s.id}`);
      if (ids.has(s.id)) problems.push(`duplicate step ${s.id}`);
      ids.add(s.id);
      const html = typeof s.html === 'function' ? s.html(P) : s.html;
      for (const m of html.matchAll(/data-key="([^"]+)"/g)) if (!(m[1] in P)) problems.push(`step ${s.id}: slider data-key "${m[1]}" not in params`);
      for (const m of html.matchAll(/data-out="([^"]+)"/g)) if (!(m[1] in P)) problems.push(`step ${s.id}: data-out "${m[1]}" not in params`);
      for (const m of html.matchAll(/data-set="([^"]+)"/g)) for (const kv of m[1].split(',')) if (!(kv.split(':')[0] in P)) problems.push(`step ${s.id}: data-set key "${kv}" not in params`);
      const ro = lab.readouts?.() || {};
      for (const m of html.matchAll(/data-ro="([^"]+)"/g)) if (ro[m[1]] == null) problems.push(`step ${s.id}: readout "${m[1]}" missing from readouts()`);
      for (const m of html.matchAll(/data-go="([^"]+)"/g)) if (!steps.some((x) => x.id === m[1])) problems.push(`step ${s.id}: data-go "${m[1]}" unknown`);
      s.onEnter?.(P);
      if (typeof s.cam === 'function') s.cam(P);
      for (let i = 0; i < 120; i++) lab.update?.(1 / 60, i / 60, s.id);
      lab.overlay?.(draft, s.id);
      lab.hud?.();
      lab.plot?.(g2d, 260, 130, { ink: '#000', muted: '#666', line: '#ccc', accent: '#f80', v: '#f00', f: '#00f', d: '#0a0', surface: '#eee' }, s.id);
    }
    // nudge every numeric param and every preset value
    for (const [k, v] of Object.entries(mod.params)) {
      if (typeof v === 'number') {
        for (const x of [v * 0.5 || 0.1, v * 1.5 || 1, v]) {
          P[k] = x;
          lab.onParam?.(k, x);
          for (let i = 0; i < 20; i++) lab.update?.(1 / 60, i / 60, steps[0]?.id);
          lab.readouts?.();
          lab.hud?.();
        }
      }
    }
    for (const s of steps) {
      const html = typeof s.html === 'function' ? s.html(P) : s.html;
      for (const m of html.matchAll(/data-set="([^"]+)"/g)) {
        for (const [k, val] of m[1].split(',').map((kv) => kv.split(':'))) {
          P[k] = Number.isNaN(Number(val)) ? val : Number(val);
          lab.onParam?.(k, P[k]);
        }
        for (let i = 0; i < 10; i++) lab.update?.(1 / 60, i / 60, s.id);
        lab.overlay?.(draft, s.id);
        const ro = lab.readouts?.() || {};
        for (const [rk, rv] of Object.entries(ro)) if (typeof rv === 'string' && /NaN|undefined|Infinity/.test(rv)) problems.push(`readout ${rk} = "${rv}" after preset ${m[1]}`);
      }
    }
    scene.traverse((o) => {
      if (o.isMesh) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position?.count || 0) / 3;
    });
    if (tris > 200000) problems.push(`too many triangles: ${tris}`);
    console.log(`${problems.length ? 'FAIL' : 'ok  '} ${label}: ${steps.length} steps, ${Object.keys(mod.params).length} params, ${Math.round(tris)} tris`);
  } catch (e) {
    problems.push(e.stack);
    console.log(`FAIL ${label}`);
  }
  for (const p of [...new Set(problems)]) console.log('     - ' + p);
  if (problems.length) failed = true;
}
process.exit(failed ? 1 : 0);
