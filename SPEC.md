# IPE 331 Machine Shop Atlas — build spec

Static site, no build step. ES modules + Three.js 0.160.0 from jsDelivr via an import map
(`import * as THREE from 'three'`, addons from `three/addons/...`). Must also run when
published as a claude.ai Artifact, so:

- No network fetches except our own relative files and the jsDelivr Three.js modules.
- No `alert/confirm/prompt`, no `window.print`, no downloads, no iframes.
- `localStorage` only through `js/store.js` (wrapped in try/catch).
- Navigation uses bare hash tokens only: `#home #intro #turning #milling #shaping #grinding #drilling #bank #formulas #practice`.
  Never `#/path` or `#a=b`.
- Every color comes from CSS tokens in `css/style.css` (light + dark). Don't hard-code colors in HTML you generate;
  use the classes listed below. 3D materials are the only place literal colors live (in `js/kit.js`).
- Page must work at 400 px wide (no horizontal page scroll; wide tables go inside `<div class="table-wrap">`).

Source material: `C:\Users\User\AppData\Local\Temp\claude\C--Users-User--claude-spares-spare-mISV3M\22d4dd5a-75d7-4906-9c8d-0e509a00ddf6\scratchpad\pdf.txt`
(text of "IPE Priyanka Mam - TF Marked v2 (with answers).pdf": Prianka ma'am's slides 1–171 + the term-final
question map + Answer Notes A–M). Slide numbers below are the "Slide N" numbers printed in that file.

## File layout

```
index.html            shell (header, nav, <main id="app">), import map, loads js/app.js
css/style.css         tokens + components
js/app.js             router, page renderers, chapter→model registry          (lead)
js/viewer.js          Viewer class (Three.js scene, picking, labels, explode)  (lead)
js/kit.js             shared materials + geometry helpers for models           (lead)
js/store.js           safe localStorage helpers                                (lead)
js/models/*.js        one 3D model per file                                    (model coders)
js/data/questions.js  question bank, topics, answer notes A–M                  (data coder 1)
js/data/content.js    chapter study notes                                       (data coder 2)
js/data/answers.js    model answers / worked solutions                          (data coder 2)
js/data/quiz.js       MCQs + flashcards                                         (study coder)
js/study/*.js         question bank UI, calculators, quiz/flashcards UI        (study coder)
```

## Chapters (ids are fixed)

| id        | title                                   | slides   |
|-----------|-----------------------------------------|----------|
| intro     | Introduction & cutting tools            | 1–13     |
| turning   | Turning & the lathe                     | 14–44    |
| milling   | Milling                                 | 45–77    |
| shaping   | Shaping & planing                       | 78–107   |
| grinding  | Grinding                                | 108–144  |
| drilling  | Drilling & hole making                  | 145–171  |

## Question ids

`id = session + '_' + q` with brackets removed, lower-case: session `2023-24`, Q `5(a)` → `"2023-24_5a"`;
`6(d)` → `"2023-24_6d"`. Use these ids everywhere (model parts, answers, notes).

## Model module contract (`js/models/<file>.js`)

```js
import * as THREE from 'three';
import { M, box, cyl, ... } from '../kit.js';

export default {
  id: 'lathe',                     // unique, = file name without .js
  title: 'Centre lathe',
  subtitle: 'Main parts of an engine lathe',      // one line
  camera: { position: [6, 4, 8], target: [0, 1, 0] },   // world units ≈ decimetres; keep models ~2–12 units wide
  build(ctx) {                     // ctx = { THREE, kit }  (kit = everything exported by kit.js)
    const root = new THREE.Group();
    // ... create meshes ...
    return {
      root,                        // THREE.Object3D added to the scene; model rests on y = 0 (floor)
      parts: [                     // clickable/labelled parts (5–20 per model)
        { id: 'bed', name: 'Bed', object: bedGroup,
          desc: 'Foundation of the lathe; supports all major components. Its ways guide the carriage and tailstock.',
          slide: 40, qs: ['2023-24_6c'],
          explode: [0, -1.5, 0],   // optional offset (world units) used by the Explode slider
          anchor: [x, y, z] },     // optional label position in root coordinates; default = top of bbox
      ],
      modes: [                     // optional: operations/variants the user can switch between
        { id: 'facing', label: 'Facing', info: 'Tool fed radially into the rotating work … (text with directions of motion)', slide: 29, qs: [] },
      ],
      setMode(id) {},              // required if modes exist; reset the animation for that mode
      update(dt, t) {},            // optional; called every frame while playing (dt seconds, already speed-scaled)
      readout() { return [['Crank angle', '132°'], ['Ram velocity', '0.42 m/s']]; },  // optional live HUD
      legend: [['V', 'cutting motion'], ['f', 'feed'], ['d', 'depth of cut']],      // optional key shown under viewport
    };
  },
};
```

Rules for models:
- Pure procedural geometry (boxes, cylinders, LatheGeometry, ExtrudeGeometry, TubeGeometry). No external assets/textures.
- Use the materials in `kit.M` (clone only if you need a variant). The viewer clones materials per part for highlighting,
  so don't rely on material identity.
- Every mesh that belongs to a part must be a descendant of that part's `object`. Meshes not in any part are fine
  (decorative), they just aren't clickable.
- Motion arrows: use `kit.arrow()` / `kit.spinArrow()` with the shared colour code — **V (cutting/primary) = M.vColor red,
  f (feed) = M.fColor blue, d (depth) = M.dColor green**. This colour code is used site-wide.
- Animations must be smooth, loop, and be driven only by `update(dt,t)`. Keep per-frame allocation near zero
  (reuse vectors). Keep total triangles < 150k per model.
- `desc` / `info` text: plain sentences from the slides (paraphrase, exam-useful, 1–3 sentences; mode info may be up to 5).
  Mention slide numbers via the `slide` field, not in the text.
- `qs`: ids of term-final questions that the part/mode answers (see `js/data/questions.js` once written; the
  question list is also in pdf.txt pages 1–5 and in each slide's side panel).
- File must parse: run `node --check js/models/<file>.js` (it will fail on bare import 'three' resolution only at
  runtime, not at --check).

## kit.js (available helpers)

```
M.castIron M.paint M.paintDark M.paintLight M.steel M.darkSteel M.chrome M.brass M.work M.workCut
M.hss M.carbide M.abrasive M.rubber M.glass M.fluid M.oil M.red M.blue M.green M.amber M.black M.white M.floor
M.vColor M.fColor M.dColor (hex numbers)
box(w,h,d,mat)                         -> Mesh, centred at origin
cyl(r,h,mat,{rTop,seg,axis,open})      -> Mesh, axis 'y'(default)|'x'|'z', centred
tube(points[], radius, mat, {seg,radial,closed})  -> Mesh along CatmullRom curve of [x,y,z] points
revolve(profile[[r,y],...], mat, {seg,axis})        -> LatheGeometry mesh (profile r>=0 along y), axis 'y'|'x'|'z'
extrude(shape[[x,y],...], depth, mat, {bevel, holes:[[...]], axis})  -> ExtrudeGeometry mesh, extruded along +z then centred
gear(rOuter, teeth, thickness, mat, {rInner, axis})   -> spur gear mesh
helixTeeth(...)                        -> see kit.js docs
at(obj,x,y,z) rot(obj,rx,ry,rz) (radians) scl(obj,s) group(...objs) named(obj,name)
arrow(from[x,y,z], dir[x,y,z], len, color, {head})  -> Group (straight arrow, solid)
spinArrow(radius, color, {axis, arc, tube})          -> Group (curved arrow around axis for rotations)
textSprite(text, {color, size})                      -> Sprite (use sparingly; labels are normally done by the viewer)
chips(count, mat)  -> { object, emit(pos[x,y,z], vel[x,y,z]), update(dt) }  simple chip particle system
```

## CSS classes available for generated HTML (data files & study UI)

`.card` `.chip` `.chip.is-on` `.pill pill-in|pill-partly|pill-not|pill-recent` `.btn` `.btn.primary` `.btn.ghost`
`.grid-2` `.grid-3` `.stack` `.row` `.muted` `.small` `.mono` `.formula` (block equation, monospace-ish, centered)
`.steps` (ol for worked steps) `.table-wrap` + `table.cmp` (comparison tables) `.note-tag` (e.g. "Note E")
`.callout` `.callout.warn` `.kbd` `.field` (label+input wrapper) `.result` (calculator output) `.tag-v` `.tag-f` `.tag-d`
(red/blue/green text for V/f/d).

## Effect labs (`js/labs/<id>.js`, runtime in `js/lab.js`)

A lab is a guided, slider-driven 3D experiment on ONE effect (like the user's reference pages
`D:\Downloads\Shaping_ effect of feed per stroke (3D).html` and `D:\Downloads\Twist-Drill-Anatomy.html`).
**Reference implementation: `js/labs/shaper-feed.js` — copy its structure.** Route: `#lab-<id>`.

```js
export default {
  id, chapter, title, eyebrow: 'Milling · slides 69–72', sub: 'one-sentence subtitle',
  blurb: 'one sentence for the lab card', qs: ['2023-24_6d', ...],   // term-final question ids this lab answers
  params: { ... },          // initial values; the runtime mutates this object (P) from sliders/presets
  start: 'stepId',          // optional first step
  build(ctx) {              // ctx = { THREE, kit, scene, camera, controls, renderer, P, css(varName), stage, sun, flyTo(cam), rerender() }
    // add meshes to ctx.scene yourself (lights + environment already exist; no floor)
    return {
      steps: [ { id, chip, group, eyebrow, title, cam: {position, target} | (P)=>cam, plot: true|false,
                 html: (P) => `...`, onEnter(P) {} } ],
      onParam(key, value) {},       // rebuild geometry when a param changes
      update(dt, t, stepId) {},     // per frame (dt = 0 when paused)
      overlay(draft, stepId) {},    // per frame drafting layer, see below
      hud() { return { status, statusCls: 'v'|'f'|'', rows: [[k, v]], verdict: [text, 'ok'|'warn'|'bad'] } },
      readouts() { return { key: 'html string', band: 'id' } },  // fills <b data-ro="key">, toggles .duo > [data-band]
      live: true,                   // refresh readouts ~7×/s (for animated values)
      format(key, v) { return 'string' | null },  // how <output data-out="key"> shows a param
      plot(g, w, h, colors, stepId) { ...; return 'plot title' },  // 260×130 canvas 2D, colors = {ink,muted,line,accent,v,f,d,surface}
      legend: [['var(--v)', 'text'], ...],
      action(name, el) {},          // buttons with data-act="name" inside step html
      dispose() {},
    };
  },
};
```

Step HTML vocabulary (bound automatically by the runtime):
- slider: `<input type="range" id="lab-x" min max step data-key="x">` + `<output class="val" data-out="x"></output>`, inside `<div class="ctl">` with `<div class="ctl-row"><label for="lab-x">…</label><output …></div>`
- presets: `<div class="presets"><button class="pbtn" type="button" data-set="x:1.5,y:2">Label</button></div>` (aria-pressed auto)
- segmented: `<div class="seg"><button type="button" data-set="mode:up">Up</button>…</div>` (string params allowed)
- live numbers: `<p class="ro">MRR: <b data-ro="mrr"></b></p>`
- comparison boxes: `<div class="duo"><div data-band="soft"><h3>…</h3><p>…</p></div>…</div>` (highlighted when readouts().band matches)
- `<mark>` key phrases, `<ul><li>` bullets, `<p class="formula">`, `<p class="note">`, `<p class="exam">Asked: TF …</p>`,
  `<p class="key"><span class="key-tag">Remember</span>…</p>`, `<div class="table-wrap"><table class="cmp">`, `<button data-go="stepId">`.

Draft API (screen-space overlay that follows the 3D model; world coordinates):
`draft.line(a, b, cls, {arrows})`, `draft.path(points, cls, {closed, arrowEnd})`, `draft.arc(centre, u, v, r, a0, a1, cls)`,
`draft.dot(p, cls)`, `draft.label(p, text, cls, dx, dy)`, `draft.dim(a, b, text, offset)`.
Classes: `dm` (dimension, blue), `ext`, `cl` (centre line), `ref` (dashed), `arc`/`hx` (amber), `vline`/`fline`/`dline`
(V/f/d coloured), `zone` (filled amber area); label classes `''`, `hl`, `minor`, `dimtxt`, `v`, `f`, `d`.

Quality bar for labs: 6–10 steps grouped (e.g. "Set-up", "Effect", "Exam"), every effect step has at least one slider or
preset that visibly changes the 3D model AND a live number; correct physics/formulas (compute, don't guess); a final
"Exam answer" step with a model answer; overlays with dimension lines on the model where a dimension matters; HUD with a
verdict where it makes sense; 2D plot when a curve explains the effect better than 3D. Phone width must work (HUD/plot shrink).
