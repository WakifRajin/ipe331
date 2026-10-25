// Hash router + page renderers. Chapter pages pair a 3D workbench with the study notes and exam questions.
import { Viewer } from './viewer.js';
import { load, save } from './store.js';

export const CHAPTERS = [
  { id: 'intro', nav: 'Tools', title: 'Introduction & cutting tools', slides: '1–13', blurb: 'Generating vs forming, single- and multi-point tools, broaches and the dividing head.',
    models: ['gen-form', 'single-point-tool', 'multi-point-tools', 'broach', 'dividing-head'] },
  { id: 'turning', nav: 'Turning', title: 'Turning & the lathe', slides: '14–44', blurb: 'Lathe anatomy, eleven turning operations, taper turning methods and work-holding.',
    models: ['lathe', 'turning-ops', 'taper-methods', 'work-holding'] },
  { id: 'milling', nav: 'Milling', title: 'Milling', slides: '45–77', blurb: 'Column-and-knee machines, up vs down milling, peripheral and face operations, cutters.',
    models: ['milling-horizontal', 'milling-vertical', 'up-down-milling', 'milling-ops', 'milling-cutters'] },
  { id: 'shaping', nav: 'Shaping', title: 'Shaping & planing', slides: '78–107', blurb: 'Shaper parts, clapper box, crank and hydraulic quick return, feed per stroke, planer.',
    models: ['shaper', 'quick-return', 'hydraulic-shaper', 'shaper-geometry', 'planer'] },
  { id: 'grinding', nav: 'Grinding', title: 'Grinding', slides: '108–144', blurb: 'Wheel anatomy and marking, surface, cylindrical, centerless and creep-feed grinding.',
    models: ['grinding-wheel', 'surface-grinder', 'cylindrical-grinding', 'centerless', 'creep-feed'] },
  { id: 'drilling', nav: 'Drilling', title: 'Drilling & hole making', slides: '145–171', blurb: 'Twist drill nomenclature, drill types, the hole-making sequence and drill presses.',
    models: ['twist-drill', 'hole-ops', 'drill-types', 'drill-press', 'radial-drill'] },
  { id: 'cutting', nav: 'Cutting', part: 'naimul', title: 'Cutting mechanics', slides: 'Naimul Sir · Lec 1–4', blurb: 'Tool geometry and designation, chip formation, Merchant’s circle, tool wear, tool life and cutting fluids.',
    models: ['orth-oblique', 'tool-planes', 'chip-formation', 'tool-wear', 'single-point-tool'] },
  { id: 'finishing', nav: 'Finishing', part: 'naimul', title: 'Finishing processes', slides: 'Naimul Sir · Lec 5', blurb: 'Precision finishing (lapping, honing, super-finishing) and non-precision finishing (polishing, buffing, brushing, tumbling).',
    models: ['finishing'] },
];
for (const c of CHAPTERS) c.part ??= 'prianka';
const PART_NAMES = { prianka: "Prianka ma'am's part", naimul: "Naimul Sir's part" };
const CHAPTER_BY_ID = new Map(CHAPTERS.map((c) => [c.id, c]));

// Effect labs: guided, slider-driven explorations of one effect each (js/labs/<id>.js).
export const LABS = [
  { id: 'generating-forming', chapter: 'intro' },
  { id: 'turning-vfd', chapter: 'turning' },
  { id: 'taper-calc', chapter: 'turning' },
  { id: 'updown-chip', chapter: 'milling' },
  { id: 'milling-approach', chapter: 'milling' },
  { id: 'cutter-entry', chapter: 'milling' },
  { id: 'shaper-feed', chapter: 'shaping' },
  { id: 'quick-return-ratio', chapter: 'shaping' },
  { id: 'clapper-strainback', chapter: 'shaping' },
  { id: 'wheel-selection', chapter: 'grinding' },
  { id: 'grinding-energy', chapter: 'grinding' },
  { id: 'centerless-feed', chapter: 'grinding' },
  { id: 'drill-anatomy', chapter: 'drilling' },
  { id: 'drill-point', chapter: 'drilling' },
  { id: 'hole-quality', chapter: 'drilling' },
  { id: 'merchant-circle', chapter: 'cutting' },
];
const LAB_IDS = new Set(LABS.map((l) => l.id));
const PAGES = new Set(['home', 'bank', 'formulas', 'practice', 'labs', ...CHAPTERS.map((c) => c.id)]);

const labCache = new Map();
function importLab(id) {
  if (!labCache.has(id)) labCache.set(id, import(`./labs/${id}.js`).then((m) => m.default));
  return labCache.get(id);
}
async function availableLabs(chapter) {
  const list = LABS.filter((l) => !chapter || l.chapter === chapter);
  const mods = await Promise.all(list.map((l) => importLab(l.id).catch(() => null)));
  return mods.filter(Boolean);
}
function labCards(mods) {
  return `<div class="lab-cards">${mods
    .map(
      (m) => `<a class="lab-card" href="#lab-${esc(m.id)}">
        <span class="meta">${esc(m.eyebrow || '')}${m.qs?.length ? ` · asked ${m.qs.length}×` : ''}</span>
        <h3>${esc(m.title)}</h3><p class="fxs">${esc(m.blurb || m.sub || '')}</p></a>`,
    )
    .join('')}</div>`;
}

const app = document.getElementById('app');
let viewer = null;
let data = null;

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const h = (html) => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};

async function optional(path) {
  try {
    return await import(path);
  } catch (err) {
    console.warn(`Could not load ${path}`, err);
    return {};
  }
}

async function loadData() {
  if (data) return data;
  const [q, c, a, fb, cn, an] = await Promise.all([
    optional('./data/questions.js'), optional('./data/content.js'), optional('./data/answers.js'),
    optional('./data/fullbank.js'), optional('./data/content-naimul.js'), optional('./data/answers-naimul.js'),
  ]);
  // The full topic-wise bank is the master list; Prianka ma'am's mapped questions add slide/status/notes on top.
  const mapped = new Map((q.QUESTIONS || []).map((x) => [x.id, { ...x, part: 'prianka' }]));
  const questions = [];
  for (const b of fb.BANK || []) {
    const m = mapped.get(b.id);
    // Keep slide/status/notes from the mapped entry, but trust the bank on part (some belong to Naimul Sir's topics).
    const naimul = b.part === 'naimul';
    questions.push(m ? { ...b, ...m, part: b.part, chapter: naimul ? b.chapter : m.chapter, topic: naimul ? b.topic : m.topic } : b);
    mapped.delete(b.id);
  }
  questions.push(...mapped.values());
  const order = (fb.PAPERS || q.SESSIONS || []).map((p) => p.session);
  questions.sort((x, y) => order.indexOf(x.session) - order.indexOf(y.session));
  const sessions = (fb.PAPERS || []).length ? fb.PAPERS.filter((p, i, arr) => arr.findIndex((z) => z.session === p.session) === i).map((p) => ({ session: p.session, exam: p.exam, recent: p.session >= '2020-21' })) : q.SESSIONS || [];
  // Topic counts for the bank's own topics come from the bank itself.
  const bankTopics = (fb.BANK_TOPICS || []).map((t) => ({ ...t, count: questions.filter((x) => x.topic === t.id).length, chapter: null, priority: 1 }));
  data = {
    QUESTIONS: questions,
    TOPICS: [...(q.TOPICS || []), ...bankTopics.filter((t) => t.count)],
    NOTES: q.NOTES || {},
    SESSIONS: sessions,
    SOURCE: q.SOURCE || {},
    CONTENT: [...(c.CHAPTERS || []), ...(cn.CHAPTERS_EXTRA || [])],
    ANSWERS: [...(a.ANSWERS || []), ...(an.ANSWERS_NAIMUL || [])],
  };
  data.qById = new Map(data.QUESTIONS.map((x) => [x.id, x]));
  return data;
}

function chapterTitle(id) {
  return CHAPTER_BY_ID.get(id)?.title ?? id;
}

const STATUS = { in: ['pill-in', '✓ In slide'], partly: ['pill-partly', '◐ Partly'], not: ['pill-not', '⚠ Not in slide'] };
function statusPill(q) {
  const [cls, txt] = STATUS[q.status] || ['pill-in', q.status];
  return `<span class="pill ${cls}">${txt}${q.note ? ` · Note ${esc(q.note)}` : ''}</span>`;
}

function questionLinks(ids) {
  if (!ids?.length || !data) return '';
  const rows = ids
    .map((id) => data.qById.get(id))
    .filter(Boolean)
    .map(
      (q) => `<div class="qlink">
        <div class="row"><span class="mono small">TF ${esc(q.session)} · Q.${esc(q.q)} · [${esc(q.marks)}]</span>${q.recent ? '<span class="pill pill-recent">recent</span>' : ''}${statusPill(q)}</div>
        <div>${esc(q.text)}</div></div>`,
    )
    .join('');
  return rows ? `<div><div class="eyebrow">Asked in term finals</div>${rows}<p class="small"><a href="#bank">Open the question bank for answers →</a></p></div>` : '';
}

/* ---------------- 3D workbench ---------------- */

const modCache = new Map();
async function importModel(id) {
  if (!modCache.has(id)) modCache.set(id, import(`./models/${id}.js`).then((m) => m.default));
  return modCache.get(id);
}

function workbenchMarkup(models, { compact = false } = {}) {
  const tabs = models.length > 1 && !compact
    ? `<div class="model-tabs" role="tablist" aria-label="Models">${models.map((m, i) => `<button class="chip" role="tab" data-model="${m}" aria-selected="${i === 0}">${esc(m)}</button>`).join('')}</div>`
    : '';
  return `
  <div class="stage-wrap">
    ${tabs}
    ${compact ? '' : '<div class="stack" style="gap:2px"><h2 data-el="mtitle">Loading…</h2><p class="muted" data-el="msub"></p></div>'}
    <div class="stage" data-el="stage">
      <dl class="readout" data-el="readout" hidden></dl>
      <div class="stage-hint" data-el="hint">Drag to orbit · Ctrl + scroll or pinch to zoom · click a part</div>
      <div class="stage-toolbar">
        <button class="tool" data-act="play" aria-pressed="true" title="Play or pause the animation">Pause</button>
        <label class="tool-range" title="Animation speed">Speed <input type="range" min="0.1" max="2.5" step="0.1" value="1" data-act="speed" aria-label="Animation speed"></label>
        ${compact ? '' : '<label class="tool-range" title="Pull the assemblies apart">Explode <input type="range" min="0" max="1" step="0.01" value="0" data-act="explode" aria-label="Explode view"></label>'}
        <button class="tool" data-act="zoom-in" aria-label="Zoom in" title="Zoom in">+</button>
        <button class="tool" data-act="zoom-out" aria-label="Zoom out" title="Zoom out">−</button>
        <button class="tool" data-act="labels" aria-pressed="true">Labels</button>
        <button class="tool" data-act="reset">Reset view</button>
        ${compact ? '' : '<button class="tool" data-act="full">Full screen</button>'}
      </div>
    </div>
    ${compact ? '' : '<div class="mode-bar" data-el="modes" role="group" aria-label="Operations"></div><div class="legend" data-el="legend"></div>'}
  </div>`;
}

function mountWorkbench(root, models, { onModel, compact = false } = {}) {
  const $ = (sel) => root.querySelector(`[data-el="${sel}"]`);
  const stage = $('stage');
  const rail = root.querySelector('.rail');
  const readout = $('readout');
  let current = null;

  viewer = new Viewer(stage, {
    onSelect: (part) => showPart(part),
    onReadout: (rows) => {
      readout.hidden = !rows.length;
      readout.innerHTML = rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('');
    },
    onHover: (id) => rail?.querySelectorAll('.part-btn').forEach((b) => b.classList.toggle('is-hover', b.dataset.part === id)),
  });
  const v = viewer;

  function showPart(part) {
    if (!rail) return;
    rail.querySelectorAll('.part-btn').forEach((b) => b.classList.toggle('is-on', b.dataset.part === part?.id));
    const card = rail.querySelector('[data-el="part"]');
    if (!part) {
      card.innerHTML = `<div class="eyebrow">Part</div><p class="muted small">Click any part in the 3D view or in the list below to see what it does and where it appears in the exams.</p>`;
      return;
    }
    card.innerHTML = `<div class="eyebrow">Part${part.slide ? ` · slide ${esc(part.slide)}` : ''}</div>
      <h3>${esc(part.name)}</h3>
      <p>${esc(part.desc)}</p>
      <div class="row"><button class="btn" data-act="focus">Zoom to part</button></div>
      ${questionLinks(part.qs)}`;
    card.querySelector('[data-act="focus"]').addEventListener('click', () => v.focusPart(part.id));
  }

  function showMode(mode, built) {
    const box = rail?.querySelector('[data-el="mode"]');
    if (!box) return;
    box.hidden = !mode;
    if (!mode) return;
    box.innerHTML = `<div class="eyebrow">Operation${mode.slide ? ` · slide ${esc(mode.slide)}` : ''}</div>
      <h3>${esc(mode.label)}</h3><p>${esc(mode.info)}</p>${questionLinks(mode.qs)}`;
    root.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode.id)));
  }

  async function open(id) {
    current = id;
    root.querySelectorAll('[data-model]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.model === id)));
    stage.querySelector('.stage-error')?.remove();
    const staleModes = $('modes');
    if (staleModes) staleModes.innerHTML = '';
    let mod;
    let built;
    try {
      mod = await importModel(id);
      if (current !== id || viewer !== v) return;
      built = v.load(mod);
    } catch (err) {
      console.error(err);
      v.unload();
      stage.append(h(`<div class="stage-error"><div><b>This model could not be loaded.</b><br><span class="small">${esc(err.message || err)}</span></div></div>`));
      return;
    }
    const t = $('mtitle');
    if (t) t.textContent = mod.title;
    const s = $('msub');
    if (s) s.textContent = mod.subtitle || '';
    root.querySelectorAll(`[data-model="${id}"]`).forEach((b) => (b.textContent = mod.title));

    const modes = $('modes');
    if (modes) {
      modes.innerHTML = (built.modes || [])
        .map((m) => `<button class="chip" data-mode="${esc(m.id)}" aria-pressed="false">${esc(m.label)}</button>`)
        .join('');
      modes.querySelectorAll('[data-mode]').forEach((b) =>
        b.addEventListener('click', () => {
          v.setMode(b.dataset.mode);
          showMode(built.modes.find((m) => m.id === b.dataset.mode), built);
        }),
      );
    }
    const legend = $('legend');
    if (legend) {
      const rows = built.legend || [['V', 'cutting motion'], ['f', 'feed'], ['d', 'depth of cut']];
      const cls = { V: 'tag-v', f: 'tag-f', d: 'tag-d' };
      legend.innerHTML = rows.map(([k, txt]) => `<span><b class="${cls[k] || ''}">${esc(k)}</b> ${esc(txt)}</span>`).join('');
    }
    if (rail) {
      rail.querySelector('[data-el="plist"]').innerHTML = v.parts
        .map((p) => `<button class="part-btn" data-part="${esc(p.id)}">${esc(p.name)}</button>`)
        .join('') || '<p class="muted small">This view has no separately labelled parts.</p>';
      rail.querySelectorAll('.part-btn').forEach((b) => {
        b.addEventListener('click', () => v.select(b.dataset.part));
        b.addEventListener('pointerenter', () => v.setHover(b.dataset.part));
        b.addEventListener('pointerleave', () => v.setHover(null));
      });
      showPart(null);
      showMode(built.modes?.[0], built);
    }
    onModel?.(mod, built);
  }

  root.querySelectorAll('[data-model]').forEach((b) => {
    b.addEventListener('click', () => open(b.dataset.model));
    importModel(b.dataset.model).then((m) => (b.textContent = m.title)).catch(() => (b.disabled = true));
  });
  root.querySelector('[data-act="play"]').addEventListener('click', (e) => {
    v.playing = !v.playing;
    e.currentTarget.setAttribute('aria-pressed', String(v.playing));
    e.currentTarget.textContent = v.playing ? 'Pause' : 'Play';
  });
  root.querySelector('[data-act="speed"]').addEventListener('input', (e) => (v.speed = Number(e.target.value)));
  root.querySelector('[data-act="explode"]')?.addEventListener('input', (e) => v.setExplode(Number(e.target.value)));
  root.querySelector('[data-act="labels"]').addEventListener('click', (e) => {
    v.setLabels(!v.labels);
    e.currentTarget.setAttribute('aria-pressed', String(v.labels));
  });
  root.querySelector('[data-act="reset"]').addEventListener('click', () => v.resetView());
  root.querySelector('[data-act="zoom-in"]').addEventListener('click', () => v.zoom(0.8));
  root.querySelector('[data-act="zoom-out"]').addEventListener('click', () => v.zoom(1.25));
  root.querySelector('[data-act="full"]')?.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await stage.requestFullscreen();
    } catch {
      /* fullscreen not allowed here */
    }
  });
  if (compact) v.setLabels(false), root.querySelector('[data-act="labels"]').setAttribute('aria-pressed', 'false');
  open(models[0]);
  return { open };
}

/* ---------------- pages ---------------- */

function radar(topics) {
  const max = Math.max(1, ...topics.map((t) => t.count || 0));
  return `<div class="radar">${topics
    .map(
      (t) => `<div class="radar-row"><a href="#${esc(t.chapter || 'bank')}">${esc(t.name)}</a>
      <div class="radar-bar" aria-hidden="true"><span class="${t.recent ? 'hot' : ''}" style="width:${((t.count || 0) / max) * 100}%"></span></div>
      <span class="n">${t.count ?? ''}</span></div>`,
    )
    .join('')}</div>`;
}

async function renderHome() {
  const d = await loadData();
  const progress = load('bank-progress', {});
  const done = Object.values(progress).filter((x) => x === 'done').length;
  const counts = {};
  for (const q of d.QUESTIONS) counts[q.chapter] = (counts[q.chapter] || 0) + 1;
  const topics = [...d.TOPICS].sort((a, b) => (b.count || 0) - (a.count || 0));
  const page = h(`<div class="page">
    <section class="hero">
      <div class="hero-copy">
        <div class="eyebrow">IPE 331 · Prianka ma'am's &amp; Naimul Sir's parts · term-final prep</div>
        <h1>Every machine in the syllabus, in 3D, beside the questions that ask about it</h1>
        <p>Turn the lathe, run up and down milling, watch the shaper's quick return, build a Merchant circle, wear out a tool and hone a bore. Each part links to the term-final questions from 2009-10 to 2023-24 and to a written answer.</p>
        <div class="row"><a class="btn primary" href="#turning">Start with the lathe</a><a class="btn" href="#bank">Question bank (${d.QUESTIONS.length || 128})</a><a class="btn" href="#practice">Quiz yourself</a></div>
        <p class="small muted">${done ? `You have marked ${done} question${done === 1 ? '' : 's'} as done.` : 'Mark questions as done in the bank and your progress shows here.'}</p>
      </div>
      <div data-el="herostage-wrap">${workbenchMarkup(['turning-ops'], { compact: true })}</div>
    </section>

    ${Object.entries(PART_NAMES).map(([part, name]) => `<section>
      <div class="section-title"><h2>${esc(name)}</h2><span class="muted small">${part === 'prianka' ? 'Metal removing processes · 171 slides' : 'Metal cutting theory & finishing · 96 slides'}</span></div>
      <div class="chapter-cards">${CHAPTERS.filter((c) => c.part === part).map(
        (c) => `<a class="chapter-card" href="#${c.id}">
          <span class="meta">${/^\d/.test(c.slides) ? 'Slides ' : ''}${esc(c.slides)} · ${counts[c.id] || 0} exam questions · ${c.models.length} 3D models</span>
          <h3>${esc(c.title)}</h3><p class="muted small">${esc(c.blurb)}</p></a>`,
      ).join('')}</div>
    </section>`).join('')}

    <section data-el="homelabs" hidden></section>

    <section class="grid-2">
      <div class="card">
        <div class="section-title"><h2>Exam radar</h2><span class="small muted">questions per topic · amber = asked 2020-21 or later</span></div>
        ${topics.length ? radar(topics.slice(0, 20)) : '<p class="muted">Topic data is loading.</p>'}
      </div>
      <div class="card stack">
        <h2>What keeps coming back</h2>
        ${(d.SOURCE.observations || []).length ? `<ul class="prose" style="padding-left:1.2em">${d.SOURCE.observations.map((o) => `<li>${esc(o)}</li>`).join('')}</ul>` : ''}
        <div class="callout small">Colour code used in every animation: <span class="tag-v">V</span> cutting motion · <span class="tag-f">f</span> feed · <span class="tag-d">d</span> depth of cut.</div>
      </div>
    </section>
  </div>`);
  app.replaceChildren(page);
  availableLabs().then((mods) => {
    const box = page.querySelector('[data-el="homelabs"]');
    if (!mods.length || !box.isConnected) return;
    box.hidden = false;
    box.innerHTML = `<div class="section-title"><h2>Effect labs</h2><a class="small" href="#labs">All ${mods.length} labs →</a></div>
      <p class="muted" style="margin-bottom:12px;max-width:70ch">Guided experiments on the effects examiners ask about: move a slider and watch the model, the dimensions and the numbers change together.</p>${labCards(mods.slice(0, 6))}`;
  });
  mountWorkbench(page.querySelector('[data-el="herostage-wrap"]'), ['turning-ops'], {
    compact: true,
    onModel: () => viewer.setMode('straight-turning'),
  });
}

async function renderChapter(id) {
  const ch = CHAPTER_BY_ID.get(id);
  const d = await loadData();
  const content = d.CONTENT.find((c) => c.id === id) || {};
  const page = h(`<div class="page">
    <header class="chapter-head">
      <div class="eyebrow">Chapter · slides ${esc(ch.slides)}</div>
      <h1>${esc(ch.title)}</h1>
      <p class="lead">${content.lead || esc(ch.blurb)}</p>
    </header>
    <section class="workbench">
      ${workbenchMarkup(ch.models)}
      <aside class="rail" aria-label="Model details">
        <div class="card mode-info" data-el="mode" hidden></div>
        <div class="card part-card" data-el="part"></div>
        <div class="card stack"><div class="eyebrow">Parts</div><div class="parts-list" data-el="plist"></div></div>
      </aside>
    </section>
    <section class="stack" data-el="labs" hidden></section>
    <section class="stack" data-el="notes"></section>
    <section class="stack" data-el="questions"></section>
  </div>`);
  app.replaceChildren(page);
  mountWorkbench(page.querySelector('.workbench'), ch.models);

  availableLabs(id).then((mods) => {
    const box = page.querySelector('[data-el="labs"]');
    if (!mods.length || !box.isConnected) return;
    box.hidden = false;
    box.innerHTML = `<div class="section-title"><h2>Effect labs</h2><span class="small muted">Change one parameter, see what it does</span></div>${labCards(mods)}`;
  });

  const notes = page.querySelector('[data-el="notes"]');
  const openSet = new Set(load(`open-${id}`, []));
  notes.innerHTML = `<div class="section-title"><h2>Study notes</h2><span class="small muted">From the slides, arranged for the exam</span></div>
    <div class="notes">${(content.sections || [])
      .map(
        (s, i) => `<details class="note-section" data-sec="${esc(s.id || i)}" ${openSet.has(String(s.id || i)) || (!openSet.size && i === 0) ? 'open' : ''}>
        <summary><h3>${esc(s.title)}</h3><span class="mono small muted">${s.slides?.length ? `slides ${s.slides.join(', ')}` : ''}</span></summary>
        <div class="prose">${s.html || ''}</div></details>`,
      )
      .join('') || '<p class="muted">Notes for this chapter are not available.</p>'}</div>
    ${content.formulas?.length ? `<div class="card"><h3>Formula sheet</h3><div class="formula-list">${content.formulas
      .map((f) => `<div class="formula-item"><b>${esc(f.name)}</b><div><div class="expr">${esc(f.expr)}</div><div class="small muted">${esc(f.vars || '')}${f.slide ? ` · slide ${esc(f.slide)}` : ''}</div></div></div>`)
      .join('')}</div><p class="small" style="margin-top:10px"><a href="#formulas">Work exam numericals in the calculators →</a></p></div>` : ''}
    ${content.keyTerms?.length ? `<div class="card"><h3>Key terms</h3><div class="terms" style="margin-top:10px">${content.keyTerms.map(([t, def]) => `<div><b>${esc(t)}</b>${esc(def)}</div>`).join('')}</div></div>` : ''}`;
  notes.querySelectorAll('details.note-section').forEach((det) =>
    det.addEventListener('toggle', () => {
      const ids = [...notes.querySelectorAll('details.note-section[open]')].map((x) => x.dataset.sec);
      save(`open-${id}`, ids);
    }),
  );

  const qs = page.querySelector('[data-el="questions"]');
  qs.innerHTML = `<div class="section-title"><h2>Term-final questions from this chapter</h2><a class="small" href="#bank">All chapters →</a></div><div data-el="qbank"></div>`;
  try {
    const { renderQuestionBank } = await import('./study/question-bank.js');
    renderQuestionBank(qs.querySelector('[data-el="qbank"]'), {
      ...d,
      QUESTIONS: d.QUESTIONS.filter((q) => q.chapter === id),
      TOPICS: d.TOPICS.filter((t) => !t.chapter || t.chapter === id),
      chapterTitle,
      fixedChapter: id,
    });
  } catch (err) {
    console.warn(err);
    qs.querySelector('[data-el="qbank"]').innerHTML = '<p class="muted">The question bank could not be loaded.</p>';
  }
}

async function renderTool(kind) {
  const d = await loadData();
  const titles = {
    bank: ['Question bank', 'Every IPE 331 term-final question from 14 papers, 2009-10 → 2023-24, sorted by topic, with model answers and Answer Notes A–M. Filter by part to focus on one teacher.'],
    formulas: ['Calculators', 'Work the exam numericals step by step. Load a past question and check every substitution.'],
    practice: ['Practice', 'Quiz yourself chapter by chapter, then drill the terms with flashcards.'],
  };
  const [title, lead] = titles[kind];
  const page = h(`<div class="page"><header class="chapter-head"><div class="eyebrow">Study helper</div><h1>${title}</h1><p class="lead">${lead}</p></header><section data-el="tool"></section></div>`);
  app.replaceChildren(page);
  const el = page.querySelector('[data-el="tool"]');
  try {
    if (kind === 'bank') (await import('./study/question-bank.js')).renderQuestionBank(el, { ...d, chapterTitle });
    if (kind === 'formulas') (await import('./study/calculators.js')).renderCalculators(el);
    if (kind === 'practice') {
      const [quiz, extra] = await Promise.all([import('./data/quiz.js'), optional('./data/quiz-naimul.js')]);
      (await import('./study/practice.js')).renderPractice(el, {
        MCQ: [...(quiz.MCQ || []), ...(extra.MCQ_NAIMUL || [])],
        CARDS: [...(quiz.CARDS || []), ...(extra.CARDS_NAIMUL || [])],
        chapterTitle,
      });
    }
  } catch (err) {
    console.error(err);
    el.innerHTML = `<p class="muted">This tool could not be loaded (${esc(err.message)}).</p>`;
  }
}

async function renderLabsIndex() {
  const page = h(`<div class="page"><header class="chapter-head"><div class="eyebrow">Effect labs</div><h1>See what each parameter does</h1>
    <p class="lead">Each lab is a guided 3D experiment on one exam topic. Move a slider and the model, the drafting lines and the numbers all change together.</p></header>
    <div class="stack" data-el="list"><p class="muted">Loading labs…</p></div></div>`);
  app.replaceChildren(page);
  const list = page.querySelector('[data-el="list"]');
  const parts = [];
  for (const ch of CHAPTERS) {
    const mods = await availableLabs(ch.id);
    if (mods.length) parts.push(`<section class="stack"><h2>${esc(ch.title)}</h2>${labCards(mods)}</section>`);
  }
  list.innerHTML = parts.join('') || '<p class="muted">No labs are available yet.</p>';
}

async function renderLabPage(id) {
  const page = h('<div class="page-lab"></div>');
  app.replaceChildren(page);
  try {
    const [mod, { renderLab }] = await Promise.all([importLab(id), import('./lab.js')]);
    const ch = CHAPTER_BY_ID.get(mod.chapter);
    const d = await loadData();
    const asked = (mod.qs || []).map((q) => d.qById.get(q)).filter(Boolean);
    const others = (await availableLabs(mod.chapter)).filter((m) => m.id !== id);
    const related = `<div class="lab-related">
      ${asked.length ? `<div class="eyebrow">Asked in term finals</div>${asked.map((q) => `<div class="qlink"><div class="row"><span class="mono small">TF ${esc(q.session)} · Q.${esc(q.q)} · [${esc(q.marks)}]</span>${q.recent ? '<span class="pill pill-recent">recent</span>' : ''}${statusPill(q)}</div><div>${esc(q.text)}</div></div>`).join('')}<p class="small"><a href="#bank">Model answers in the question bank →</a></p>` : ''}
      ${others.length ? `<div class="eyebrow" style="margin-top:12px">More labs in ${esc(ch?.title || '')}</div><div class="row">${others.map((m) => `<a class="chip" href="#lab-${esc(m.id)}">${esc(m.title)}</a>`).join('')}</div>` : ''}
    </div>`;
    renderLab(page, mod, { backHref: `#${mod.chapter}`, backText: ch?.title || 'Chapter', related });
    document.title = `${mod.title} · IPE 331 Machine Shop Atlas`;
  } catch (err) {
    console.error(err);
    page.innerHTML = `<div class="page"><p class="muted">This lab could not be loaded (${esc(err.message)}). <a href="#labs">All labs</a></p></div>`;
  }
}

async function route() {
  const token = location.hash.replace('#', '') || 'home';
  const labId = token.startsWith('lab-') ? token.slice(4) : null;
  const page = labId && LAB_IDS.has(labId) ? 'lab' : PAGES.has(token) ? token : 'home';
  if (viewer) {
    viewer.dispose();
    viewer = null;
  }
  (await import('./lab.js')).disposeLab();
  const navKey = page === 'lab' ? 'labs' : page;
  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('is-active', a.dataset.nav === navKey));
  if (page === 'lab') {
    await renderLabPage(labId);
    window.scrollTo(0, 0);
    return;
  }
  if (page === 'labs') {
    await renderLabsIndex();
    document.title = 'Effect labs · IPE 331 Machine Shop Atlas';
    window.scrollTo(0, 0);
    return;
  }
  if (page === 'home') await renderHome();
  else if (CHAPTER_BY_ID.has(page)) await renderChapter(page);
  else await renderTool(page);
  document.title = page === 'home' ? 'IPE 331 Machine Shop Atlas' : `${CHAPTER_BY_ID.get(page)?.title || { bank: 'Question bank', formulas: 'Calculators', practice: 'Practice' }[page]} · IPE 331 Machine Shop Atlas`;
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
route();
