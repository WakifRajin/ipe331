// One Three.js workbench: loads a model module, handles orbit, picking, labels, explode and animation.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as kit from './kit.js';
import { guardWheel, zoomBy } from './wheel.js';

const HOVER = new THREE.Color(0xe9a321);
const tmpV = new THREE.Vector3();
const tmpBox = new THREE.Box3();

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export class Viewer {
  constructor(container, { onSelect, onReadout, onHover } = {}) {
    this.container = container;
    this.onSelect = onSelect || (() => {});
    this.onReadout = onReadout || (() => {});
    this.onHover = onHover || (() => {});
    this.playing = true;
    this.speed = 1;
    this.explode = 0;
    this.labels = true;
    this.parts = [];
    this.model = null;
    this.selected = null;
    this.hovered = null;
    this.t = 0;
    this.visible = true;

    const renderer = (this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: false }));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = 'viewer-canvas';
    container.appendChild(renderer.domElement);

    const labelRenderer = (this.labelRenderer = new CSS2DRenderer());
    labelRenderer.domElement.className = 'viewer-labels';
    container.appendChild(labelRenderer.domElement);

    this.scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    this.envTex = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
    this.scene.environment = this.envTex;
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(40, 1, 0.05, 400);
    this.controls = new OrbitControls(this.camera, renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI * 0.495;

    const hemi = new THREE.HemisphereLight(0xffffff, 0x445055, 0.6);
    const sun = (this.sun = new THREE.DirectionalLight(0xffffff, 1.6));
    sun.position.set(6, 12, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    this.scene.add(hemi, sun, sun.target);

    this.ground = new THREE.Mesh(new THREE.CircleGeometry(60, 64), new THREE.ShadowMaterial({ opacity: 0.22 }));
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.grid = new THREE.GridHelper(40, 40, 0x000000, 0x000000);
    this.grid.material.transparent = true;
    this.grid.material.opacity = 0.08;
    this.grid.position.y = 0.001;
    this.scene.add(this.ground, this.grid);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.clock = new THREE.Clock();
    this.applyTheme();

    this.unguardWheel = guardWheel(renderer.domElement, container, this.controls);
    this._down = null;
    renderer.domElement.addEventListener('pointerdown', (e) => (this._down = [e.clientX, e.clientY]));
    renderer.domElement.addEventListener('pointerup', (e) => {
      if (!this._down) return;
      const moved = Math.hypot(e.clientX - this._down[0], e.clientY - this._down[1]);
      this._down = null;
      if (moved < 5) this.select(this.pick(e)?.id ?? null, true);
    });
    renderer.domElement.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      this.setHover(this.pick(e)?.id ?? null);
    });
    renderer.domElement.addEventListener('pointerleave', () => this.setHover(null));

    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(container);
    this.visObs = new IntersectionObserver(([en]) => (this.visible = en.isIntersecting));
    this.visObs.observe(container);
    this.themeObs = new MutationObserver(() => this.applyTheme());
    this.themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    this.mq = window.matchMedia('(prefers-color-scheme: dark)');
    this._mqHandler = () => this.applyTheme();
    this.mq.addEventListener?.('change', this._mqHandler);

    this.resize();
    this._lastReadout = 0;
    renderer.setAnimationLoop(() => this.frame());
  }

  applyTheme() {
    const bg = new THREE.Color(cssVar('--viewport', '#dfe5e3'));
    this.scene.background = bg;
    const dark = bg.getHSL({}).l < 0.4;
    this.grid.material.color.set(dark ? 0xffffff : 0x000000);
    this.grid.material.opacity = dark ? 0.06 : 0.08;
    this.ground.material.opacity = dark ? 0.35 : 0.2;
  }

  resize() {
    const w = Math.max(this.container.clientWidth, 1);
    const h = Math.max(this.container.clientHeight, 1);
    this.renderer.setSize(w, h, false);
    this.labelRenderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  load(mod) {
    this.unload();
    let built;
    try {
      built = mod.build({ THREE, kit });
    } catch (err) {
      console.error(`Model ${mod.id} failed to build`, err);
      throw err;
    }
    this.mod = mod;
    this.model = built;
    this.root = built.root;
    this.scene.add(this.root);
    this.root.updateMatrixWorld(true);

    // Per-part materials so highlighting one part never lights up another.
    this.parts = (built.parts || []).map((p) => {
      const cache = new Map();
      const meshes = [];
      p.object.traverse((o) => {
        o.userData.partId = p.id;
        if (!o.isMesh && !o.isSprite) return;
        if (o.isMesh) {
          const swap = (m) => {
            if (!m || !m.isMeshStandardMaterial) return m;
            if (!cache.has(m)) {
              const c = m.clone();
              c.userData.baseEmissive = c.emissive.clone();
              c.userData.baseIntensity = c.emissiveIntensity;
              cache.set(m, c);
            }
            return cache.get(m);
          };
          o.material = Array.isArray(o.material) ? o.material.map(swap) : swap(o.material);
          meshes.push(o);
        }
      });
      const part = { ...p, mats: [...cache.values()], meshes };

      // explode offset expressed in the part's parent space
      part.offsetLocal = new THREE.Vector3();
      part.applied = new THREE.Vector3();
      if (p.explode && p.object.parent) {
        const wp = p.object.getWorldPosition(new THREE.Vector3());
        const a = p.object.parent.worldToLocal(wp.clone());
        const b = p.object.parent.worldToLocal(wp.clone().add(new THREE.Vector3(...p.explode)));
        part.offsetLocal.copy(b.sub(a));
      }

      // label
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'part-label';
      el.textContent = p.name;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.select(p.id, true);
      });
      el.addEventListener('pointerenter', () => this.setHover(p.id));
      el.addEventListener('pointerleave', () => this.setHover(null));
      const label = new CSS2DObject(el);
      let anchorWorld;
      if (p.anchor) anchorWorld = this.root.localToWorld(new THREE.Vector3(...p.anchor));
      else {
        tmpBox.setFromObject(p.object);
        anchorWorld = tmpBox.isEmpty() ? p.object.getWorldPosition(new THREE.Vector3()) : tmpBox.getCenter(new THREE.Vector3()).setY(tmpBox.max.y);
      }
      // Labels live on the root and follow the part's position only, so spinning parts don't swing them around.
      part.labelOffset = anchorWorld.clone().sub(p.object.getWorldPosition(new THREE.Vector3()));
      label.position.copy(this.root.worldToLocal(anchorWorld.clone()));
      this.root.add(label);
      part.label = label;
      part.labelEl = el;
      return part;
    });
    this.partById = new Map(this.parts.map((p) => [p.id, p]));
    this.setLabels(this.labels);

    this.t = 0;
    if (built.modes?.length) built.setMode?.(built.modes[0].id);
    this.mode = built.modes?.[0]?.id ?? null;
    this.applyExplode();
    this.fitShadow();
    this.resetView();
    this.selected = null;
    this.hovered = null;
    this.emitReadout(true);
    return built;
  }

  unload() {
    if (!this.root) return;
    this.scene.remove(this.root);
    this.root.traverse((o) => {
      if (o.isCSS2DObject) o.element.remove();
      if (o.geometry) o.geometry.dispose();
      const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of mats) {
        if (m.map) m.map.dispose();
        // shared kit materials are reused across models; only dispose per-part clones
        if (m.userData?.baseEmissive) m.dispose();
      }
    });
    this.labelRenderer.domElement.replaceChildren();
    this.root = null;
    this.model = null;
    this.parts = [];
    this.partById = new Map();
  }

  fitShadow() {
    tmpBox.setFromObject(this.root);
    const size = tmpBox.getSize(tmpV);
    const r = Math.max(size.x, size.y, size.z) * 0.8 + 1;
    const cam = this.sun.shadow.camera;
    cam.left = -r;
    cam.right = r;
    cam.top = r;
    cam.bottom = -r;
    cam.near = 0.5;
    cam.far = 60;
    cam.updateProjectionMatrix();
    const c = tmpBox.getCenter(new THREE.Vector3());
    this.sun.target.position.copy(c);
    this.sun.position.copy(c).add(new THREE.Vector3(6, 14, 8));
  }

  // Bounds of what is actually drawn: skips hidden subtrees (other modes), sprites and labels.
  visibleBounds(obj = this.root) {
    const box = new THREE.Box3();
    const walk = (o) => {
      if (!o.visible || o.isCSS2DObject || o.isSprite || o.userData.isArrow) return;
      if (o.isMesh && !o.isInstancedMesh) {
        o.geometry.computeBoundingBox?.();
        if (o.geometry.boundingBox) box.union(tmpBox.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld));
      }
      for (const c of o.children) walk(c);
    };
    obj.updateMatrixWorld(true);
    walk(obj);
    return box;
  }

  resetView() {
    const cam = this.mod?.camera;
    const box = this.visibleBounds();
    const center = box.isEmpty() ? new THREE.Vector3(0, 1, 0) : box.getCenter(new THREE.Vector3());
    const radius = box.isEmpty() ? 5 : box.getBoundingSphere(new THREE.Sphere()).radius;
    // Keep the model's chosen viewing direction, but frame its visible bounds.
    const dir = cam ? new THREE.Vector3(...cam.position).sub(new THREE.Vector3(...cam.target)).normalize() : new THREE.Vector3(0.55, 0.4, 0.75).normalize();
    const vFov = THREE.MathUtils.degToRad(this.camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * this.camera.aspect);
    // A bounding sphere over-estimates long, low machines; 0.8 frames them snugly with labels still inside.
    const dist = (radius * 0.8) / Math.sin(Math.min(vFov, hFov) / 2);
    this.controls.target.copy(center);
    this.camera.position.copy(center).addScaledVector(dir, dist);
    this.controls.minDistance = dist * 0.15;
    this.controls.maxDistance = dist * 4;
    this.controls.update();
  }

  pick(e) {
    if (!this.root) return null;
    const r = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObject(this.root, true);
    for (const h of hits) {
      if (!h.object.visible) continue;
      let o = h.object;
      while (o && o.userData.partId === undefined) o = o.parent;
      if (o) return this.partById.get(o.userData.partId) || null;
    }
    return null;
  }

  paint(part) {
    if (!part) return;
    const sel = this.selected === part.id;
    const hov = this.hovered === part.id;
    for (const m of part.mats) {
      if (sel || hov) {
        m.emissive.copy(HOVER);
        m.emissiveIntensity = sel ? 0.55 : 0.28;
      } else {
        m.emissive.copy(m.userData.baseEmissive);
        m.emissiveIntensity = m.userData.baseIntensity;
      }
    }
    part.labelEl.classList.toggle('is-selected', sel);
    part.labelEl.classList.toggle('is-hover', hov);
    part.label.visible = this.labels || sel || hov;
  }

  setHover(id) {
    if (this.hovered === id) return;
    const prev = this.partById.get(this.hovered);
    this.hovered = id;
    this.paint(prev);
    this.paint(this.partById.get(id));
    this.renderer.domElement.style.cursor = id ? 'pointer' : '';
    this.onHover(id);
  }

  select(id, fromScene = false) {
    const prev = this.partById.get(this.selected);
    this.selected = this.selected === id && fromScene ? null : id;
    this.paint(prev);
    this.paint(this.partById.get(this.selected));
    this.onSelect(this.selected ? this.partById.get(this.selected) : null);
  }

  focusPart(id) {
    const p = this.partById.get(id);
    if (!p) return;
    tmpBox.setFromObject(p.object);
    if (tmpBox.isEmpty()) return;
    const c = tmpBox.getCenter(new THREE.Vector3());
    const r = Math.max(tmpBox.getSize(tmpV).length(), 1.2);
    const dir = this.camera.position.clone().sub(this.controls.target).normalize();
    this._fly = { from: this.controls.target.clone(), to: c, camFrom: this.camera.position.clone(), camTo: c.clone().add(dir.multiplyScalar(r * 1.8)), t: 0 };
  }

  zoom(factor) {
    this._fly = null;
    zoomBy(this.camera, this.controls, factor);
  }

  setLabels(on) {
    this.labels = on;
    for (const p of this.parts) p.label.visible = on || this.selected === p.id || this.hovered === p.id;
  }

  setExplode(f) {
    this.explode = f;
    this.applyExplode();
  }

  applyExplode() {
    for (const p of this.parts) {
      p.object.position.sub(p.applied);
      p.applied.copy(p.offsetLocal).multiplyScalar(this.explode);
      p.object.position.add(p.applied);
    }
  }

  setMode(id) {
    if (!this.model?.setMode || !this.model.modes?.some((m) => m.id === id)) return;
    this.mode = id;
    for (const p of this.parts) p.object.position.sub(p.applied), p.applied.set(0, 0, 0);
    this.model.setMode(id);
    this.applyExplode();
    this.t = 0;
    this.emitReadout(true);
  }

  emitReadout(force) {
    const now = performance.now();
    if (!force && now - this._lastReadout < 200) return;
    this._lastReadout = now;
    let rows = [];
    try {
      rows = this.model?.readout?.() || [];
    } catch {
      rows = [];
    }
    this.onReadout(rows);
  }

  frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (!this.visible || document.hidden) return;
    if (this._fly) {
      const f = this._fly;
      f.t = Math.min(f.t + dt * 2.2, 1);
      const k = 1 - Math.pow(1 - f.t, 3);
      this.controls.target.lerpVectors(f.from, f.to, k);
      this.camera.position.lerpVectors(f.camFrom, f.camTo, k);
      if (f.t >= 1) this._fly = null;
    }
    if (this.model && this.playing && this.model.update) {
      const sdt = dt * this.speed;
      this.t += sdt;
      for (const p of this.parts) p.object.position.sub(p.applied);
      try {
        this.model.update(sdt, this.t);
      } catch (err) {
        console.error(err);
        this.playing = false;
      }
      for (const p of this.parts) p.object.position.add(p.applied);
      this.emitReadout(false);
    }
    this.controls.update();
    if (this.root) {
      this.root.updateMatrixWorld();
      for (const p of this.parts) {
        let shown = this.labels || this.selected === p.id || this.hovered === p.id;
        for (let o = p.object; o && shown; o = o.parent) if (!o.visible) shown = false;
        p.label.visible = shown;
        if (!shown) continue;
        p.object.getWorldPosition(tmpV).add(p.labelOffset);
        p.label.position.copy(this.root.worldToLocal(tmpV));
      }
    }
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.unguardWheel();
    this.unload();
    this.resizeObs.disconnect();
    this.visObs.disconnect();
    this.themeObs.disconnect();
    this.mq.removeEventListener?.('change', this._mqHandler);
    this.controls.dispose();
    this.envTex.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss?.();
    this.container.replaceChildren();
  }
}
