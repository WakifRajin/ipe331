// Question bank UI: filters, grouped results, answers, done/revise progress.
import { load, save } from '../store.js';

const CHAPTER_ORDER = ['intro', 'turning', 'milling', 'shaping', 'grinding', 'drilling', 'cutting', 'finishing'];
const PART_INFO = { prianka: "Prianka ma'am", naimul: 'Naimul Sir', sectionA: 'Casting, welding & forming', mme: 'MME 345 (appendix)' };
const STATUS_INFO = {
  in: { sym: '✓', label: 'In slide', cls: 'pill-in' },
  partly: { sym: '◐', label: 'Partly in slide', cls: 'pill-partly' },
  not: { sym: '⚠', label: 'Not in slide', cls: 'pill-not' },
};

const h = (tag, attrs, ...kids) => {
  const e = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, '');
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c)));
  return e;
};

export function renderQuestionBank(el, data = {}) {
  const QUESTIONS = Array.isArray(data.QUESTIONS) ? data.QUESTIONS : [];
  const NOTES = data.NOTES && typeof data.NOTES === 'object' ? data.NOTES : {};
  const ANSWERS = Array.isArray(data.ANSWERS) ? data.ANSWERS : [];
  const TOPICS = Array.isArray(data.TOPICS) ? data.TOPICS : [];
  const SESSIONS = Array.isArray(data.SESSIONS) ? data.SESSIONS : [];
  const chapterTitle = typeof data.chapterTitle === 'function' ? data.chapterTitle : (id) => id;

  el.innerHTML = '';
  if (!QUESTIONS.length) {
    el.append(h('div', { class: 'callout warn' }, 'The question bank data is not available.'));
    return;
  }

  let progress = load('bank-progress', {});
  if (!progress || typeof progress !== 'object' || Array.isArray(progress)) progress = {};

  const state = { parts: new Set(), chapters: new Set(), session: '', status: new Set(), recent: false, topic: '', text: '', show: 'all' };
  const parts = Object.keys(PART_INFO).filter((p) => QUESTIONS.some((q) => q.part === p));
  const topicById = new Map(TOPICS.map((t) => [t.id, t]));
  const answerFor = (q) => ANSWERS.find((a) => a && Array.isArray(a.ids) && a.ids.includes(q.id));
  const chapters = CHAPTER_ORDER.filter((c) => QUESTIONS.some((q) => q.chapter === c)).concat(
    [...new Set(QUESTIONS.map((q) => q.chapter))].filter((c) => c && !CHAPTER_ORDER.includes(c)));
  const sessionList = SESSIONS.length ? SESSIONS.map((s) => s.session) : [...new Set(QUESTIONS.map((q) => q.session))];

  const topicRank = (id) => {
    const t = topicById.get(id);
    return t ? [t.priority || 0, t.count || 0, t.recent ? 1 : 0] : [0, 0, 0];
  };
  const topicCmp = (a, b) => {
    const x = topicRank(a), y = topicRank(b);
    return y[0] - x[0] || y[1] - x[1] || y[2] - x[2] || String(a).localeCompare(String(b));
  };
  const topicName = (id) => (topicById.get(id) || {}).name || id || 'Other';

  const stars = (n) => '★'.repeat(Math.max(0, Math.min(3, n || 0)));
  const persist = () => save('bank-progress', progress);
  const flag = (id, k) => !!(progress[id] && progress[id][k]);
  const toggle = (id, k) => {
    const cur = progress[id] || {};
    cur[k] = !cur[k];
    if (!cur.done && !cur.revise) delete progress[id];
    else progress[id] = cur;
    persist();
  };

  // ---------------------------------------------------------------- summary + frequent
  const summary = h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap', 'aria-live': 'polite' });
  const frequent = h('section', { class: 'card stack' });
  const controls = h('section', { class: 'card stack' });
  const results = h('div', { class: 'stack', 'aria-live': 'polite' });

  function renderSummary() {
    const total = QUESTIONS.length;
    const cnt = { in: 0, partly: 0, not: 0 };
    let recent = 0, done = 0, revise = 0;
    for (const q of QUESTIONS) {
      if (cnt[q.status] != null) cnt[q.status]++;
      if (q.recent) recent++;
      if (flag(q.id, 'done')) done++;
      if (flag(q.id, 'revise')) revise++;
    }
    summary.innerHTML = '';
    const pill = (t, cls) => h('span', { class: 'pill ' + (cls || '') }, t);
    summary.append(
      pill(`${total} questions`),
      pill(`✓ ${cnt.in} in slide`, 'pill-in'),
      pill(`◐ ${cnt.partly} partly`, 'pill-partly'),
      pill(`⚠ ${cnt.not} not in slide`, 'pill-not'),
      pill(`${recent} recent`, 'pill-recent'),
      pill(`${done} of ${total} done`),
      pill(`${revise} to revise`));
  }

  function renderFrequent() {
    frequent.innerHTML = '';
    const hot = TOPICS.filter((t) => (t.count || 0) >= 6).sort((a, b) => topicCmp(a.id, b.id));
    if (!hot.length) { frequent.style.display = 'none'; return; }
    frequent.append(
      h('h3', null, 'Frequently repeated'),
      h('p', { class: 'muted small' }, 'Topics asked six or more times across the 14 papers. Tap one to filter the list.'),
      h('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap' },
        hot.map((t) => h('button', { type: 'button', class: 'chip', onclick: () => {
          state.topic = t.id;
          topicSel.value = t.id;
          renderResults();
          results.scrollIntoView && results.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } }, `${t.name} · ${t.count}${t.recent ? ' · recent' : ''}`))));
  }

  // ---------------------------------------------------------------- controls
  const chipRow = (label, items, setFn, isOn) => {
    const row = h('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap;align-items:center', role: 'group', 'aria-label': label });
    row.append(h('span', { class: 'small muted' }, label));
    const btns = items.map(([val, text]) => {
      const b = h('button', { type: 'button', class: 'chip', 'aria-pressed': 'false' }, text);
      b.addEventListener('click', () => { setFn(val); sync(); renderResults(); });
      b._val = val;
      return b;
    });
    row.append(...btns);
    const sync = () => btns.forEach((b) => { const on = isOn(b._val); b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    sync();
    return row;
  };
  const toggleSet = (set) => (v) => { if (set.has(v)) set.delete(v); else set.add(v); };

  const sessionSel = h('select', { id: 'bank-session', 'aria-label': 'Session' },
    h('option', { value: '' }, 'All sessions'),
    sessionList.map((s) => h('option', { value: s }, s)));
  sessionSel.addEventListener('change', () => { state.session = sessionSel.value; renderResults(); });

  const topicSel = h('select', { id: 'bank-topic', 'aria-label': 'Topic' },
    h('option', { value: '' }, 'All topics'),
    [...new Set(QUESTIONS.map((q) => q.topic))].sort(topicCmp).map((id) => h('option', { value: id }, topicName(id))));
  topicSel.addEventListener('change', () => { state.topic = topicSel.value; renderResults(); });

  const search = h('input', { id: 'bank-search', type: 'search', placeholder: 'Search question text…', 'aria-label': 'Search questions', autocomplete: 'off' });
  search.addEventListener('input', () => { state.text = search.value.trim().toLowerCase(); renderResults(); });

  const recentChip = h('button', { type: 'button', class: 'chip', 'aria-pressed': 'false' }, 'Recent only (2020-21 onward)');
  recentChip.addEventListener('click', () => {
    state.recent = !state.recent;
    recentChip.classList.toggle('is-on', state.recent);
    recentChip.setAttribute('aria-pressed', state.recent ? 'true' : 'false');
    renderResults();
  });

  const partRow = parts.length > 1 ? chipRow('Part', parts.map((p) => [p, PART_INFO[p]]), toggleSet(state.parts), (v) => state.parts.has(v)) : null;
  const chapterRow = chipRow('Chapter', chapters.map((c) => [c, chapterTitle(c)]), toggleSet(state.chapters), (v) => state.chapters.has(v));
  const statusRow = chipRow('Status', Object.entries(STATUS_INFO).map(([k, v]) => [k, `${v.sym} ${v.label}`]), toggleSet(state.status), (v) => state.status.has(v));
  const showRow = chipRow('Show', [['all', 'All'], ['revise', 'To revise'], ['done', 'Done']], (v) => { state.show = v; }, (v) => state.show === v);

  controls.append(
    h('h3', null, 'Filters'),
    partRow,
    chapterRow,
    statusRow,
    h('div', { class: 'grid-2' },
      h('div', { class: 'field' }, h('label', { for: 'bank-session' }, 'Session'), sessionSel),
      h('div', { class: 'field' }, h('label', { for: 'bank-topic' }, 'Topic'), topicSel)),
    h('div', { class: 'field' }, h('label', { for: 'bank-search' }, 'Search'), search),
    h('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap;align-items:center' }, recentChip),
    showRow,
    h('div', null, h('button', { type: 'button', class: 'btn ghost', onclick: () => {
      state.parts.clear(); state.chapters.clear(); state.status.clear(); state.session = ''; state.topic = ''; state.text = ''; state.recent = false; state.show = 'all';
      sessionSel.value = ''; topicSel.value = ''; search.value = '';
      recentChip.classList.remove('is-on'); recentChip.setAttribute('aria-pressed', 'false');
      for (const row of [partRow, chapterRow, statusRow, showRow].filter(Boolean)) row.querySelectorAll('.chip').forEach((b) => b.classList.remove('is-on'));
      showRow.querySelector('.chip').classList.add('is-on');
      renderResults();
    } }, 'Clear filters')));

  // ---------------------------------------------------------------- cards
  function answerBlock(q) {
    const ans = answerFor(q);
    const note = q.note && NOTES[q.note];
    if (!ans && !note) {
      return h('p', { class: 'muted small' }, 'No written answer in the book for this one. Use the slide reference above.');
    }
    const wrap = h('div', { class: 'stack' });
    if (ans) {
      wrap.append(h('div', { class: 'stack' },
        h('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap;align-items:center' },
          h('strong', null, ans.title || 'Model answer'), ans.numerical ? h('span', { class: 'pill' }, 'numerical') : null),
        h('div', { class: 'stack', html: ans.html || '' })));
    }
    if (note) {
      wrap.append(h('div', { class: 'stack' },
        h('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap;align-items:center' },
          h('span', { class: 'note-tag' }, `Note ${q.note}`), h('strong', null, note.title || '')),
        h('div', { class: 'stack', html: note.html || '' })));
    }
    return wrap;
  }

  function card(q) {
    const info = STATUS_INFO[q.status];
    const done = flag(q.id, 'done'), rev = flag(q.id, 'revise');
    const doneBtn = h('button', { type: 'button', class: 'btn ' + (done ? 'primary' : 'ghost'), 'aria-pressed': done ? 'true' : 'false' }, done ? '✓ Done' : 'Mark done');
    const revBtn = h('button', { type: 'button', class: 'btn ' + (rev ? 'primary' : 'ghost'), 'aria-pressed': rev ? 'true' : 'false' }, rev ? '↻ To revise' : 'Revise');
    const rerender = () => { renderSummary(); renderResults(); };
    doneBtn.addEventListener('click', () => { toggle(q.id, 'done'); rerender(); });
    revBtn.addEventListener('click', () => { toggle(q.id, 'revise'); rerender(); });
    const details = h('details', null, h('summary', null, 'Show answer'), h('div', { class: 'stack', style: 'margin-top:8px' }, answerBlock(q)));
    // keep expanded state across re-renders
    if (openIds.has(q.id)) details.open = true;
    details.addEventListener('toggle', () => { if (details.open) openIds.add(q.id); else openIds.delete(q.id); });
    return h('article', { class: 'card stack', id: 'q-' + q.id },
      h('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap;align-items:center' },
        h('span', { class: 'mono small' }, `${q.session} · ${q.exam} · Q.${q.q} · [${q.marks}]`),
        info ? h('span', { class: 'pill ' + info.cls }, `${info.sym} ${info.label}${q.note ? ' → Note ' + q.note : ''}`) : null,
        q.recent ? h('span', { class: 'pill pill-recent' }, 'recent') : null),
      h('p', null, q.text),
      h('div', { class: 'row small muted', style: 'gap:12px;flex-wrap:wrap' },
        q.slide ? h('span', null, `Slide ${q.slide}`) : null,
        q.also && q.also.length ? h('span', null, `Also: slides ${q.also.join(', ')}`) : null,
        q.part && PART_INFO[q.part] ? h('span', null, PART_INFO[q.part]) : null,
        q.chapter ? h('a', { href: '#' + q.chapter }, `Open ${chapterTitle(q.chapter)}`) : null),
      details,
      h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap' }, doneBtn, revBtn));
  }
  const openIds = new Set();

  function matches(q) {
    if (state.parts.size && !state.parts.has(q.part)) return false;
    if (state.chapters.size && !state.chapters.has(q.chapter)) return false;
    if (state.session && q.session !== state.session) return false;
    if (state.status.size && !state.status.has(q.status)) return false;
    if (state.recent && !q.recent) return false;
    if (state.topic && q.topic !== state.topic) return false;
    if (state.show === 'done' && !flag(q.id, 'done')) return false;
    if (state.show === 'revise' && !flag(q.id, 'revise')) return false;
    if (state.text) {
      const hay = `${q.text} ${q.id} ${q.session} ${q.q} ${topicName(q.topic)}`.toLowerCase();
      if (!state.text.split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    return true;
  }

  function renderResults() {
    results.innerHTML = '';
    const list = QUESTIONS.filter(matches);
    results.append(h('p', { class: 'muted small' }, `${list.length} of ${QUESTIONS.length} questions shown`));
    if (!list.length) {
      results.append(h('div', { class: 'callout' }, 'No questions match these filters.'));
      return;
    }
    const groups = new Map();
    for (const q of list) {
      const k = q.topic || 'other';
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(q);
    }
    const sessionIdx = (s) => { const i = sessionList.indexOf(s); return i < 0 ? 99 : i; };
    for (const id of [...groups.keys()].sort(topicCmp)) {
      const t = topicById.get(id);
      const qs = groups.get(id).sort((a, b) => sessionIdx(a.session) - sessionIdx(b.session) || String(a.q).localeCompare(String(b.q)));
      results.append(h('section', { class: 'stack' },
        h('h3', null, topicName(id)),
        h('div', { class: 'small muted' },
          [t ? `${t.count} asked${t.sessions ? ' in ' + t.sessions : ''}` : null, t && t.priority ? stars(t.priority) : null, t && t.recent ? 'recent' : null].filter(Boolean).join(' · ')),
        qs.map(card)));
    }
  }

  el.append(h('div', { class: 'stack' }, summary, frequent, controls, results));
  renderSummary();
  renderFrequent();
  renderResults();
}
