// Shared materials and geometry helpers for the procedural machine models.
import * as THREE from 'three';

const std = (color, metalness, roughness, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });

// Motion colour code used across the whole site: V red, f blue, d green.
export const M = {
  vColor: 0xd8342c,
  fColor: 0x2f6fd6,
  dColor: 0x2e9b57,

  castIron: std(0x4a5157, 0.35, 0.75),
  paint: std(0x5f7f7a, 0.15, 0.55),       // machine-tool green-grey
  paintDark: std(0x3d5552, 0.2, 0.6),
  paintLight: std(0x8fa9a3, 0.15, 0.5),
  steel: std(0xb9c0c6, 0.85, 0.32),
  darkSteel: std(0x6b7379, 0.8, 0.4),
  chrome: std(0xe6eaee, 1.0, 0.12),
  brass: std(0xc9a14a, 0.9, 0.3),
  work: std(0xd5dade, 0.7, 0.28),         // aluminium-looking workpiece
  workCut: std(0xf1f3f5, 0.9, 0.14),      // freshly machined surface
  hss: std(0x9aa3ab, 0.9, 0.25),
  carbide: std(0xd2a83a, 0.85, 0.3),      // TiN gold insert / cutter
  abrasive: std(0x8a7f74, 0.05, 0.95),
  rubber: std(0x222426, 0.0, 0.9),
  glass: std(0xbfd8e6, 0.1, 0.05, { transparent: true, opacity: 0.25, depthWrite: false }),
  fluid: std(0x3f8fd8, 0.1, 0.2, { transparent: true, opacity: 0.55 }),
  oil: std(0xc58b2a, 0.2, 0.3, { transparent: true, opacity: 0.7 }),
  red: std(0xd8342c, 0.1, 0.5),
  blue: std(0x2f6fd6, 0.1, 0.5),
  green: std(0x2e9b57, 0.1, 0.5),
  amber: std(0xe9a321, 0.2, 0.45),
  black: std(0x1b1d1f, 0.3, 0.6),
  white: std(0xf2f2ef, 0.0, 0.7),
  floor: std(0x2a2f33, 0.0, 0.95),
};

const AXIS_ROT = {
  x: (o) => o.rotateZ(-Math.PI / 2),
  y: () => {},
  z: (o) => o.rotateX(Math.PI / 2),
};

function shadowed(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function box(w, h, d, mat = M.paint) {
  return shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat));
}

export function cyl(r, h, mat = M.steel, { rTop = r, seg = 32, axis = 'y', open = false } = {}) {
  const geo = new THREE.CylinderGeometry(rTop, r, h, seg, 1, open);
  AXIS_ROT[axis](geo);
  return shadowed(new THREE.Mesh(geo, mat));
}

export function tube(points, radius, mat = M.steel, { seg = 64, radial = 12, closed = false } = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), closed);
  return shadowed(new THREE.Mesh(new THREE.TubeGeometry(curve, seg, radius, radial, closed), mat));
}

// profile: [[r, y], ...] revolved about the y axis, then turned to `axis`.
export function revolve(profile, mat = M.work, { seg = 48, axis = 'y' } = {}) {
  const geo = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(Math.max(r, 0), y)), seg);
  AXIS_ROT[axis](geo);
  geo.computeVertexNormals();
  return shadowed(new THREE.Mesh(geo, mat));
}

// shape: [[x, y], ...] outline in the xy plane, extruded along z and centred on z.
export function extrude(shape, depth, mat = M.paint, { bevel = 0, holes = [], axis = 'z' } = {}) {
  const s = new THREE.Shape(shape.map(([x, y]) => new THREE.Vector2(x, y)));
  for (const h of holes) s.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y))));
  const geo = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 2,
    curveSegments: 24,
  });
  geo.translate(0, 0, -depth / 2);
  if (axis === 'x') geo.rotateY(Math.PI / 2);
  if (axis === 'y') geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  return shadowed(new THREE.Mesh(geo, mat));
}

// Spur gear with trapezoidal teeth; axis of rotation along `axis` (default z).
export function gear(rOuter, teeth, thickness, mat = M.steel, { rInner = 0, axis = 'z' } = {}) {
  const depth = Math.min(rOuter * 0.18, (Math.PI * 2 * rOuter) / teeth / 1.6);
  const rRoot = rOuter - depth;
  const pts = [];
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const step = (Math.PI * 2) / teeth;
    const local = [
      [rRoot, a],
      [rRoot, a + step * 0.15],
      [rOuter, a + step * 0.3],
      [rOuter, a + step * 0.55],
      [rRoot, a + step * 0.7],
    ];
    for (const [r, ang] of local) pts.push([Math.cos(ang) * r, Math.sin(ang) * r]);
  }
  const holes = [];
  if (rInner > 0) {
    const h = [];
    for (let i = 0; i < 24; i++) {
      const ang = -(i / 24) * Math.PI * 2;
      h.push([Math.cos(ang) * rInner, Math.sin(ang) * rInner]);
    }
    holes.push(h);
  }
  const mesh = extrude(pts, thickness, mat, { holes });
  if (axis === 'x') mesh.geometry.rotateY(Math.PI / 2);
  if (axis === 'y') mesh.geometry.rotateX(Math.PI / 2);
  return mesh;
}

// Helical/straight cutter teeth: `count` thin boxes twisted around the y axis.
export function helixTeeth(radius, length, count, mat = M.carbide, { helix = 0.5, width = 0.06, height = 0.08, segs = 16 } = {}) {
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const a0 = (i / count) * Math.PI * 2;
    const pts = [];
    for (let s = 0; s <= segs; s++) {
      const y = -length / 2 + (length * s) / segs;
      const a = a0 + (helix * y) / radius;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, segs * 2, Math.max(width, height) / 2, 4, false);
    g.add(shadowed(new THREE.Mesh(geo, mat)));
  }
  return g;
}

export const at = (obj, x = 0, y = 0, z = 0) => (obj.position.set(x, y, z), obj);
export const rot = (obj, rx = 0, ry = 0, rz = 0) => (obj.rotation.set(rx, ry, rz), obj);
export const scl = (obj, s) => (typeof s === 'number' ? obj.scale.setScalar(s) : obj.scale.set(...s), obj);
export const named = (obj, name) => ((obj.name = name), obj);
export function group(...objs) {
  const g = new THREE.Group();
  for (const o of objs) if (o) g.add(o);
  return g;
}

const arrowMats = new Map();
function arrowMat(color) {
  if (!arrowMats.has(color)) {
    arrowMats.set(color, new THREE.MeshStandardMaterial({ color, metalness: 0.1, roughness: 0.45, emissive: color, emissiveIntensity: 0.25 }));
  }
  return arrowMats.get(color);
}

// Solid straight arrow starting at `from`, pointing along `dir`.
export function arrow(from, dir, len, color = M.fColor, { head = 0.18, shaft = 0.035 } = {}) {
  const mat = arrowMat(color);
  const g = new THREE.Group();
  const shaftLen = Math.max(len - head, 0.01);
  const s = new THREE.Mesh(new THREE.CylinderGeometry(shaft, shaft, shaftLen, 12), mat);
  s.position.y = shaftLen / 2;
  const h = new THREE.Mesh(new THREE.ConeGeometry(shaft * 2.6, head, 16), mat);
  h.position.y = shaftLen + head / 2;
  g.add(s, h);
  const d = new THREE.Vector3(...dir).normalize();
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
  g.position.set(...from);
  g.userData.isArrow = true;
  return g;
}

// Curved arrow (arc of `arc` radians) around the given axis, centred at origin.
export function spinArrow(radius, color = M.vColor, { axis = 'y', arc = Math.PI * 1.5, tube: t = 0.03 } = {}) {
  const mat = arrowMat(color);
  const g = new THREE.Group();
  const torus = new THREE.Mesh(new THREE.TorusGeometry(radius, t, 8, 48, arc), mat);
  const head = new THREE.Mesh(new THREE.ConeGeometry(t * 2.8, t * 7, 16), mat);
  head.position.set(Math.cos(arc) * radius, Math.sin(arc) * radius, 0);
  head.rotation.z = arc; // tangent direction (counter-clockwise)
  g.add(torus, head);
  // torus lies in xy plane (axis z); rotate to requested axis
  if (axis === 'y') g.rotation.x = Math.PI / 2;
  if (axis === 'x') g.rotation.y = Math.PI / 2;
  g.userData.isArrow = true;
  return group(g);
}

export function textSprite(text, { color = '#1b1d1f', bg = 'rgba(255,255,255,0.85)', size = 0.35 } = {}) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  const font = 'bold 48px system-ui, sans-serif';
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + 32;
  c.width = w;
  c.height = 72;
  ctx.font = font;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, 72);
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 16, 38);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
  sp.scale.set((size * w) / 72, size, 1);
  sp.renderOrder = 10;
  return sp;
}

// Tiny chip particle system: emit() small curled chips that fly and fade.
export function chips(count = 60, mat = M.workCut) {
  const geo = new THREE.TorusGeometry(0.03, 0.008, 4, 8, Math.PI * 1.4);
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.frustumCulled = false;
  const pos = Array.from({ length: count }, () => new THREE.Vector3(0, -999, 0));
  const vel = Array.from({ length: count }, () => new THREE.Vector3());
  const life = new Float32Array(count);
  const spin = Array.from({ length: count }, () => new THREE.Euler());
  const dummy = new THREE.Object3D();
  let next = 0;
  // Hidden chips are scaled to zero (not moved far away) so bounding boxes stay honest.
  const hide = () => {
    for (let i = 0; i < count; i++) {
      dummy.position.set(0, 0, 0);
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  hide();
  return {
    object: mesh,
    emit(p, v) {
      const i = next;
      next = (next + 1) % count;
      pos[i].set(...p);
      vel[i].set(v[0] + (Math.random() - 0.5) * 0.4, v[1] + Math.random() * 0.3, v[2] + (Math.random() - 0.5) * 0.4);
      life[i] = 1.2;
      spin[i].set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    },
    update(dt) {
      for (let i = 0; i < count; i++) {
        if (life[i] <= 0) continue;
        life[i] -= dt;
        vel[i].y -= 4 * dt;
        pos[i].addScaledVector(vel[i], dt);
        spin[i].x += dt * 8;
        spin[i].y += dt * 6;
        dummy.position.copy(pos[i]);
        dummy.scale.setScalar(life[i] > 0 ? 1 : 0);
        dummy.rotation.copy(spin[i]);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
    reset: hide,
  };
}
