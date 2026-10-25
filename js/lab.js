// Effect-lab runtime: a sticky 3D stage with drafting overlays beside a stepped tour of
// parameter-driven explanations. Lab modules (js/labs/*.js) supply the scene and the steps.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as kit from './kit.js';
import { guardWheel, zoomBy } from './wheel.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const css = (name, fallback = '#888') => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

// Per-frame SVG drafting layer. Elements are pooled by call order so nothing is re-created each frame.
class Draft {
  constructor(svg, labels, camera, stage) {
    this.svg = svg;
    this.g = svg.querySelector('g');
    this.labels = labels;
    this.camera = camera;
    this.stage = stage;
    this.pool = { line: [], path: [], circle: [], label: [] };
    this.used = { line: 0, path: 0, circle: 0, label: 0 };
    this.v = new THREE.Vector3();
  }
  begin() {
    for (const k in this.used) this.used[k] = 0;
    this.w = this.stage.clientWidth;
    this.h = this.stage.clientHeight;
  }
  end() {
    for (const k in this.pool) for (let i = this.used[k]; i < this.pool[k].length; i++) this.pool[k][i].style.display = 'none';
  }
  _get(kind) {
    const i = this.used[kind]++;
    let el = this.pool[kind][i];
    if (!el) {
      if (kind === 'label') {
        el = document.createElement('div');
        this.labels.append(el);
      } else {
        el = document.createElementNS(SVGNS, kind);
        this.g.append(el);
      }
      this.pool[kind][i] = el;
    }
    el.style.display = '';
    return el;
  }
  // world point -> screen [x, y, visible]
  p(pt) {
    this.v.set(pt[0], pt[1], pt[2]).project(this.camera);
    return [(this.v.x * 0.5 + 0.5) * this.w, (-this.v.y * 0.5 + 0.5) * this.h, this.v.z < 1];
  }
  line(a, b, cls = 'dm', { arrows = false } = {}) {
    const [x1, y1] = this.p(a);
    const [x2, y2] = this.p(b);
    const el = this._get('line');
    el.setAttribute('x1', x1);
    el.setAttribute('y1', y1);
    el.setAttribute('x2', x2);
    el.setAttribute('y2', y2);
    el.setAttribute('class', cls);
    if (arrows) {
      el.setAttribute('marker-start', 'url(#lab-ar)');
      el.setAttribute('marker-end', 'url(#lab-ar)');
    } else {
      el.removeAttribute('marker-start');
      el.removeAttribute('marker-end');
    }
    return el;
  }
  // polyline through world points
  path(points, cls = 'dm', { closed = false, arrowEnd = false } = {}) {
    let d = '';
    for (let i = 0; i < points.length; i++) {
      const [x, y] = this.p(points[i]);
      d += `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
    }
    if (closed) d += 'Z';
    const el = this._get('path');
    el.setAttribute('d', d);
    el.setAttribute('class', cls);
    if (arrowEnd) el.setAttribute('marker-end', 'url(#lab-ar)');
    else el.removeAttribute('marker-end');
    return el;
  }
  // arc of radius r around centre c in the plane spanned by unit vectors u, v, from angle a0 to a1 (radians)
  arc(c, u, v, r, a0, a1, cls = 'arc', segs = 32) {
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const a = a0 + ((a1 - a0) * i) / segs;
      const ca = Math.cos(a) * r;
      const sa = Math.sin(a) * r;
      pts.push([c[0] + u[0] * ca + v[0] * sa, c[1] + u[1] * ca + v[1] * sa, c[2] + u[2] * ca + v[2] * sa]);
    }
    return this.path(pts, cls);
  }
  dot(pt, cls = 'dot', r = 4) {
    const [x, y] = this.p(pt);
    const el = this._get('circle');
    el.setAttribute('cx', x);
    el.setAttribute('cy', y);
    el.setAttribute('r', r);
    el.setAttribute('class', cls);
    return el;
  }
  // HTML label at a world point; dx/dy in px; cls: '', 'dimtxt', 'hl', 'minor', 'v', 'f', 'd'
  label(pt, text, cls = '', dx = 0, dy = 0) {
    const [x, y, vis] = this.p(pt);
    const el = this._get('label');
    if (el._t !== text) el.textContent = el._t = text;
    el.className = `lbl ${cls}`;
    el.style.transform = `translate(${(x + dx).toFixed(1)}px, ${(y + dy).toFixed(1)}px) translate(-50%, -50%)`;
    el.style.visibility = vis ? '' : 'hidden';
    return el;
  }
  // dimension line between two world points with extension offset vector and centred text
  dim(a, b, text, off = [0, 0, 0], cls = 'dm') {
    const a2 = [a[0] + off[0], a[1] + off[1], a[2] + off[2]];
    const b2 = [b[0] + off[0], b[1] + off[1], b[2] + off[2]];
    if (off[0] || off[1] || off[2]) {
      this.line(a, a2, 'ext');
      this.line(b, b2, 'ext');
    }
    this.line(a2, b2, cls, { arrows: true });
    if (text) this.label([(a2[0] + b2[0]) / 2, (a2[1] + b2[1]) / 2, (a2[2] + b2[2]) / 2], text, 'dimtxt');
  }
}

let active = null;

export function disposeLab() {
  active?.dispose();
  active = null;
}

export function renderLab(el, mod, { backHref = '#labs', backText = 'All labs', related = '' } = {}) {
  disposeLab();
  el.innerHTML = `
  <div class="lab">
    <header class="lab-head">
      <p class="eyebrow"><a href="${esc(backHref)}">← ${esc(backText)}</a> · ${esc(mod.eyebrow || '')}</p>
      <h1>${esc(mod.title)}</h1>
      <p class="sub">${esc(mod.sub || '')}</p>
    </header>
    <section class="lab-stage" data-el="stage" aria-label="Interactive 3D model: ${esc(mod.title)}">
      <svg class="lab-ov" aria-hidden="true"><defs>
        <marker id="lab-ar" viewBox="0 0 10 10" refX="9.2" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0,1.2 L10,5 L0,8.8 z" class="lab-ar-head"></path></marker>
      </defs><g></g></svg>
      <div class="lab-labels" aria-hidden="true"></div>
      <div class="lab-hud" data-el="hud" hidden></div>
      <div class="lab-plot" data-el="plotwrap" hidden><div class="lab-plot-title" data-el="plottitle"></div><canvas data-el="plot" width="260" height="130"></canvas></div>
      <div class="lab-legend" data-el="legend" hidden></div>
      <div class="lab-tools">
        <button class="tool" type="button" data-act="zoom-in" aria-label="Zoom in" title="Zoom in">+</button>
        <button class="tool" type="button" data-act="zoom-out" aria-label="Zoom out" title="Zoom out">−</button>
        <button class="tool" type="button" data-act="play" aria-pressed="true">Pause</button>
        <button class="tool" type="button" data-act="reset">Reset view</button>
      </div>
      <div class="lab-hint">Drag to rotate · Ctrl + scroll or pinch to zoom</div>
    </section>
    <section class="lab-panel">
      <nav class="lab-tour" data-el="tour" aria-label="Steps"></nav>
      <article class="lab-topic" data-el="topic" aria-live="polite"></article>
      <div class="lab-pager">
        <button type="button" data-act="prev">← Prev</button>
        <span class="count" data-el="count"></span>
        <button type="button" class="next" data-act="next">Next →</button>
      </div>
      ${related}
    </section>
  </div>`;
  const $ = (s) => el.querySelector(`[data-el="${s}"]`);
  const stage = $('stage');

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'lab-canvas';
  stage.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  scene.environment = envTex;
  pmrem.dispose();
  const hemi = new THREE.HemisphereLight(0xffffff, 0x445055, 0.55);
  const sun = new THREE.DirectionalLight(0xffffff, 1.5);
  sun.position.set(-6, 14, 9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(hemi, sun);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.02, 500);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  const unguardWheel = guardWheel(renderer.domElement, stage, controls);

  const draft = new Draft(el.querySelector('.lab-ov'), el.querySelector('.lab-labels'), camera, stage);
  const P = { ...(mod.params || {}) };
  const plotCanvas = $('plot');
  const ctx = {
    THREE, kit, scene, camera, controls, renderer, P, css, stage, sun,
    flyTo,
    rerender: () => refresh(),
  };
  const lab = mod.build(ctx);
  if (location.hostname === '127.0.0.1') window.__lab = { ctx, lab }; // dev inspection only
  const steps = lab.steps || [];
  let idx = Math.max(0, steps.findIndex((s) => s.id === mod.start));
  let playing = true;
  let fly = null;

  if (lab.legend?.length) {
    const lg = $('legend');
    lg.hidden = false;
    lg.innerHTML = lab.legend.map(([color, text]) => `<span><i style="background:${color}"></i>${esc(text)}</span>`).join('');
  }

  function flyTo(cam, instant = false) {
    if (!cam) return;
    const to = new THREE.Vector3(...cam.target);
    let camTo = new THREE.Vector3(...cam.position);
    // keep the framing on narrow (portrait) stages
    if (camera.aspect < 1) camTo = to.clone().add(camTo.sub(to).multiplyScalar(Math.min(1 / camera.aspect, 1.8)));
    if (instant) {
      controls.target.copy(to);
      camera.position.copy(camTo);
      controls.update();
      return;
    }
    fly = { from: controls.target.clone(), to, camFrom: camera.position.clone(), camTo, t: 0 };
  }

  function fmt(key, v) {
    if (lab.format) {
      const s = lab.format(key, v);
      if (s != null) return s;
    }
    return typeof v === 'number' ? (Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2)) : String(v);
  }

  function refresh() {
    const topic = $('topic');
    topic.querySelectorAll('[data-out]').forEach((o) => (o.textContent = fmt(o.dataset.out, P[o.dataset.out])));
    topic.querySelectorAll('input[data-key]').forEach((i) => {
      if (document.activeElement !== i) i.value = P[i.dataset.key];
    });
    topic.querySelectorAll('[data-set]').forEach((b) => {
      const pairs = b.dataset.set.split(',').map((kv) => kv.split(':'));
      b.setAttribute('aria-pressed', String(pairs.every(([k, v]) => String(P[k]) === v || Number(P[k]) === Number(v))));
    });
    const ro = lab.readouts?.() || {};
    topic.querySelectorAll('[data-ro]').forEach((o) => {
      const v = ro[o.dataset.ro];
      if (v != null) o.innerHTML = v;
    });
    topic.querySelectorAll('[data-band]').forEach((b) => b.classList.toggle('on', ro.band === b.dataset.band));
    drawPlot();
    drawHud();
  }

  function drawHud() {
    const h = lab.hud?.();
    const box = $('hud');
    box.hidden = !h;
    if (!h) return;
    const rows = (h.rows || []).map(([k, v]) => `<div class="row"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('');
    const html = `${h.status ? `<div class="status${h.statusCls ? ` ${h.statusCls}` : ''}">${esc(h.status)}</div>` : ''}${rows}${h.verdict ? `<div class="verdict ${h.verdict[1] || ''}">${esc(h.verdict[0])}</div>` : ''}`;
    if (box._html !== html) box.innerHTML = box._html = html;
  }

  function drawPlot() {
    const wrap = $('plotwrap');
    if (!lab.plot) return;
    const step = steps[idx];
    const show = step?.plot !== false;
    wrap.hidden = !show;
    if (!show) return;
    const w = 260;
    const h = 130;
    const dpr = Math.min(devicePixelRatio, 2);
    plotCanvas.width = w * dpr;
    plotCanvas.height = h * dpr;
    const g = plotCanvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    g.font = '11px "IBM Plex Mono", ui-monospace, monospace';
    const title = lab.plot(g, w, h, { ink: css('--fg'), muted: css('--muted'), line: css('--line'), accent: css('--accent'), v: css('--v'), f: css('--f'), d: css('--d'), surface: css('--surface-2') }, step?.id);
    $('plottitle').textContent = title || '';
  }

  function show(i, instant = false) {
    idx = Math.max(0, Math.min(steps.length - 1, i));
    const s = steps[idx];
    $('tour').innerHTML = steps
      .map((st, j) => {
        const grp = st.group && st.group !== steps[j - 1]?.group ? `<span class="grp">${esc(st.group)}</span>` : '';
        return `${grp}<button class="lab-chip" type="button" data-step="${j}" ${j === idx ? 'aria-current="step"' : ''}>${esc(st.chip || st.title)}</button>`;
      })
      .join('');
    $('tour').querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => show(Number(b.dataset.step))));
    // Scroll only the chip strip (scrollIntoView would also move the page).
    const tour = $('tour');
    const cur = tour.querySelector('[aria-current]');
    if (cur && tour.scrollWidth > tour.clientWidth) tour.scrollLeft = cur.offsetLeft - tour.clientWidth / 2 + cur.offsetWidth / 2;
    const topic = $('topic');
    topic.innerHTML = `<p class="eyebrow">${esc(s.eyebrow || '')}</p><h2>${esc(s.title)}</h2>${typeof s.html === 'function' ? s.html(P) : s.html || ''}`;
    topic.querySelectorAll('input[data-key]').forEach((inp) =>
      inp.addEventListener('input', () => {
        P[inp.dataset.key] = inp.type === 'range' || inp.type === 'number' ? Number(inp.value) : inp.value;
        lab.onParam?.(inp.dataset.key, P[inp.dataset.key]);
        refresh();
      }),
    );
    topic.querySelectorAll('[data-set]').forEach((b) =>
      b.addEventListener('click', () => {
        for (const [k, v] of b.dataset.set.split(',').map((kv) => kv.split(':'))) {
          P[k] = Number.isNaN(Number(v)) ? v : Number(v);
          lab.onParam?.(k, P[k]);
        }
        refresh();
      }),
    );
    topic.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => show(steps.findIndex((x) => x.id === b.dataset.go))));
    topic.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => lab.action?.(b.dataset.act, b)));
    s.onEnter?.(P);
    flyTo(typeof s.cam === 'function' ? s.cam(P) : s.cam, instant);
    $('count').textContent = `${idx + 1} / ${steps.length}`;
    el.querySelector('[data-act="prev"]').disabled = idx === 0;
    el.querySelector('[data-act="next"]').disabled = idx === steps.length - 1;
    refresh();
  }

  el.querySelector('[data-act="prev"]').addEventListener('click', () => show(idx - 1));
  el.querySelector('[data-act="next"]').addEventListener('click', () => show(idx + 1));
  el.querySelector('.lab-tools [data-act="play"]').addEventListener('click', (e) => {
    playing = !playing;
    e.currentTarget.setAttribute('aria-pressed', String(playing));
    e.currentTarget.textContent = playing ? 'Pause' : 'Play';
  });
  el.querySelector('.lab-tools [data-act="zoom-in"]').addEventListener('click', () => ((fly = null), zoomBy(camera, controls, 0.8)));
  el.querySelector('.lab-tools [data-act="zoom-out"]').addEventListener('click', () => ((fly = null), zoomBy(camera, controls, 1.25)));
  el.querySelector('.lab-tools [data-act="reset"]').addEventListener('click', () => {
    const s = steps[idx];
    flyTo(typeof s.cam === 'function' ? s.cam(P) : s.cam);
  });

  function resize() {
    const w = Math.max(stage.clientWidth, 1);
    const h = Math.max(stage.clientHeight, 1);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    draft.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();

  let visible = true;
  const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting));
  io.observe(stage);
  const themeObs = new MutationObserver(() => refresh());
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  const clock = new THREE.Clock();
  let t = 0;
  let lastHud = 0;
  renderer.setAnimationLoop(() => {
    const raw = Math.min(clock.getDelta(), 0.05);
    if (!visible || document.hidden) return;
    if (fly) {
      fly.t = Math.min(fly.t + raw * 2, 1);
      const k = 1 - Math.pow(1 - fly.t, 3);
      controls.target.lerpVectors(fly.from, fly.to, k);
      camera.position.lerpVectors(fly.camFrom, fly.camTo, k);
      if (fly.t >= 1) fly = null;
    }
    const dt = playing ? raw : 0;
    t += dt;
    try {
      lab.update?.(dt, t, steps[idx]?.id);
    } catch (err) {
      console.error(err);
      playing = false;
    }
    controls.update();
    renderer.render(scene, camera);
    draft.begin();
    try {
      lab.overlay?.(draft, steps[idx]?.id);
    } catch (err) {
      console.error(err);
    }
    draft.end();
    const now = performance.now();
    if (now - lastHud > 150) {
      lastHud = now;
      drawHud();
      if (lab.live) {
        const r = lab.readouts?.() || {};
        $('topic').querySelectorAll('[data-ro]').forEach((o) => {
          if (r[o.dataset.ro] != null && o._v !== r[o.dataset.ro]) o.innerHTML = o._v = r[o.dataset.ro];
        });
      }
    }
  });

  show(idx, true);

  active = {
    dispose() {
      renderer.setAnimationLoop(null);
      unguardWheel();
      ro.disconnect();
      io.disconnect();
      themeObs.disconnect();
      lab.dispose?.();
      scene.traverse((o) => {
        o.geometry?.dispose();
        const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
        for (const m of mats) {
          m.map?.dispose();
          if (!Object.values(kit.M).includes(m)) m.dispose?.();
        }
      });
      envTex.dispose();
      controls.dispose();
      renderer.dispose();
      renderer.forceContextLoss?.();
    },
  };
  return active;
}
