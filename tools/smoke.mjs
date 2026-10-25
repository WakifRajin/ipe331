// Headless smoke test for model modules.
// Usage: node tools/smoke.mjs js/models/lathe.js [more files...]
// Builds each model, checks the contract, cycles every mode and runs 200 animation frames.
import * as THREE from 'three';
import * as kit from '../js/kit.js';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

// Minimal DOM stubs so textSprite() can run.
globalThis.document ??= {
  createElement: () => ({
    getContext: () => ({ measureText: () => ({ width: 100 }), fillRect() {}, fillText() {}, set font(v) {}, set fillStyle(v) {}, set textBaseline(v) {} }),
    width: 0,
    height: 0,
  }),
};

let failed = false;
for (const file of process.argv.slice(2)) {
  const label = path.basename(file);
  try {
    const mod = (await import(pathToFileURL(path.resolve(file)).href)).default;
    const problems = [];
    for (const k of ['id', 'title', 'camera', 'build']) if (!mod?.[k]) problems.push(`missing ${k}`);
    if (mod.id && mod.id !== path.basename(file, '.js')) problems.push(`id "${mod.id}" should equal file name`);
    const m = mod.build({ THREE, kit });
    if (!(m.root instanceof THREE.Object3D)) problems.push('build() must return { root: Object3D }');
    const ids = new Set();
    for (const p of m.parts ?? []) {
      if (!p.id || !p.name || !p.desc) problems.push(`part missing id/name/desc: ${p.id ?? p.name}`);
      if (ids.has(p.id)) problems.push(`duplicate part id ${p.id}`);
      ids.add(p.id);
      if (!(p.object instanceof THREE.Object3D)) problems.push(`part ${p.id} has no object`);
      else {
        let inRoot = false;
        p.object.traverseAncestors((a) => { if (a === m.root) inRoot = true; });
        if (!inRoot) problems.push(`part ${p.id} object is not inside root`);
      }
    }
    if (m.modes?.length && typeof m.setMode !== 'function') problems.push('modes without setMode()');
    const modes = m.modes?.length ? m.modes : [null];
    for (const mode of modes) {
      if (mode) m.setMode(mode.id);
      for (let i = 0; i < 200; i++) m.update?.(1 / 60, i / 60);
      m.readout?.();
    }
    let tris = 0;
    let meshes = 0;
    m.root.updateMatrixWorld(true);
    m.root.traverse((o) => {
      if (o.isMesh) {
        meshes++;
        const g = o.geometry;
        const n = g.index ? g.index.count / 3 : g.attributes.position.count / 3;
        tris += n * (o.isInstancedMesh ? o.count : 1);
      }
    });
    const bb = new THREE.Box3().setFromObject(m.root);
    const size = bb.getSize(new THREE.Vector3());
    if (tris > 150000) problems.push(`too many triangles: ${tris}`);
    if (Number.isNaN(size.x)) problems.push('NaN in geometry');
    console.log(`${problems.length ? 'FAIL' : 'ok  '} ${label}: ${m.parts?.length ?? 0} parts, ${m.modes?.length ?? 0} modes, ${meshes} meshes, ${Math.round(tris)} tris, size ${size.x.toFixed(1)}×${size.y.toFixed(1)}×${size.z.toFixed(1)}, minY ${bb.min.y.toFixed(2)}`);
    for (const p of problems) console.log('     - ' + p);
    if (problems.length) failed = true;
  } catch (e) {
    failed = true;
    console.log(`FAIL ${label}: ${e.stack}`);
  }
}
process.exit(failed ? 1 : 0);
