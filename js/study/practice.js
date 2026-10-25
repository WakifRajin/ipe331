// Practice: MCQ quiz and Leitner flashcards.
import { load, save } from '../store.js';

const CHAPTERS = [
  ['intro', 'Intro & tools'], ['turning', 'Turning'], ['milling', 'Milling'],
  ['shaping', 'Shaping'], ['grinding', 'Grinding'], ['drilling', 'Drilling'],
  ['cutting', 'Cutting mechanics'], ['finishing', 'Finishing'],
];

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
const shuffle = (a) => {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
};
const chTitle = (id) => (CHAPTERS.find((c) => c[0] === id) || [id, id])[1];

export function renderPractice(el, data = {}) {
  const MCQ = Array.isArray(data.MCQ) ? data.MCQ : [];
  const CARDS = Array.isArray(data.CARDS) ? data.CARDS : [];
  el.innerHTML = '';

  const body = h('div', { class: 'stack' });
  const tabs = h('div', { class: 'row', role: 'tablist', 'aria-label': 'Practice mode', style: 'gap:6px;flex-wrap:wrap' });
  const tabBtns = {};
  let current = 'quiz';
  const show = (name) => {
    current = name;
    for (const [k, b] of Object.entries(tabBtns)) { b.classList.toggle('is-on', k === name); b.setAttribute('aria-selected', k === name ? 'true' : 'false'); }
    body.innerHTML = '';
    (name === 'quiz' ? quiz : cards)(body);
  };
  for (const [k, label] of [['quiz', 'Quiz'], ['cards', 'Flashcards']]) {
    tabBtns[k] = h('button', { type: 'button', class: 'chip', role: 'tab', 'aria-selected': 'false', onclick: () => show(k) }, label);
    tabs.append(tabBtns[k]);
  }
  el.append(h('div', { class: 'stack' }, tabs, body));

  // chapter chip group shared by both tabs. selected: Set (empty = all)
  function chapterChips(selected, onChange, available) {
    const row = h('div', { class: 'row', role: 'group', 'aria-label': 'Chapters', style: 'gap:6px;flex-wrap:wrap' });
    const sync = () => row.querySelectorAll('button').forEach((b) => {
      const on = b._ch === '*' ? selected.size === 0 : selected.has(b._ch);
      b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    const mk = (ch, label) => {
      const b = h('button', { type: 'button', class: 'chip', 'aria-pressed': 'false' }, label);
      b._ch = ch;
      b.addEventListener('click', () => {
        if (ch === '*') selected.clear();
        else if (selected.has(ch)) selected.delete(ch); else selected.add(ch);
        sync(); onChange();
      });
      row.append(b);
    };
    mk('*', 'All chapters');
    for (const [id, t] of CHAPTERS) if (available.some((x) => x.chapter === id)) mk(id, t);
    sync();
    return row;
  }

  // ================================================================ QUIZ
  function quiz(root) {
    if (!MCQ.length) { root.append(h('div', { class: 'callout warn' }, 'No quiz questions are available.')); return; }
    const selected = new Set();
    let length = 10;

    function setup() {
      root.innerHTML = '';
      const best = load('quiz-best', {});
      const countEl = h('p', { class: 'muted small', 'aria-live': 'polite' });
      const pool = () => MCQ.filter((q) => !selected.size || selected.has(q.chapter));
      const upd = () => { countEl.textContent = `${pool().length} questions available`; };
      const lenRow = h('div', { class: 'row', role: 'group', 'aria-label': 'Quiz length', style: 'gap:6px;flex-wrap:wrap' });
      const lenBtns = [[10, '10'], [20, '20'], [0, 'All']].map(([n, t]) => {
        const b = h('button', { type: 'button', class: 'chip' + (length === n ? ' is-on' : ''), 'aria-pressed': length === n ? 'true' : 'false' }, t);
        b.addEventListener('click', () => { length = n; lenBtns.forEach((x) => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); }); });
        lenRow.append(b);
        return b;
      });
      const bestList = Object.entries(best).filter(([, v]) => v && typeof v.pct === 'number');
      root.append(h('section', { class: 'card stack' },
        h('h3', null, 'Quiz'),
        h('p', { class: 'muted small' }, 'Pick chapters and a length. You get instant feedback with an explanation and the slide number.'),
        chapterChips(selected, upd, MCQ),
        h('div', { class: 'row small', style: 'gap:8px;align-items:center' }, h('span', { class: 'muted' }, 'Questions'), lenRow),
        countEl,
        h('div', null, h('button', { type: 'button', class: 'btn primary', onclick: () => {
          const p = shuffle(pool());
          if (!p.length) return;
          start(length ? p.slice(0, length) : p, selected.size === 1 ? [...selected][0] : 'all');
        } }, 'Start quiz'))));
      if (bestList.length) {
        root.append(h('section', { class: 'card stack' }, h('h3', null, 'Best scores'),
          h('div', { class: 'row small', style: 'gap:6px;flex-wrap:wrap' },
            bestList.map(([k, v]) => h('span', { class: 'pill' }, `${k === 'all' ? 'Mixed/all' : chTitle(k)}: ${v.score}/${v.total} (${v.pct}%)`)))));
      }
      upd();
    }

    function start(list, key, noSave) {
      // each question gets its options shuffled (answer tracked by text)
      const qs = list.map((q) => ({ q, opts: shuffle(q.options.map((t, i) => ({ t, ok: i === q.answer }))) }));
      let i = 0, score = 0;
      const wrong = [];

      function ask() {
        root.innerHTML = '';
        const { q, opts } = qs[i];
        let answered = false;
        const fb = h('div', { class: 'stack', 'aria-live': 'polite' });
        const next = h('button', { type: 'button', class: 'btn primary', style: 'display:none' }, i + 1 < qs.length ? 'Next question' : 'See results');
        next.addEventListener('click', () => { i++; if (i < qs.length) ask(); else finish(); });
        const btns = opts.map((o, n) => {
          const b = h('button', { type: 'button', class: 'btn ghost', style: 'text-align:left;white-space:normal;justify-content:flex-start' },
            h('span', { class: 'kbd' }, String.fromCharCode(65 + n)), ' ', o.t);
          b.addEventListener('click', () => {
            if (answered) return;
            answered = true;
            btns.forEach((x, m) => { x.disabled = true; if (opts[m].ok) { x.classList.remove('ghost'); x.classList.add('primary'); } });
            if (o.ok) score++; else wrong.push({ q, picked: o.t, right: opts.find((z) => z.ok).t });
            fb.innerHTML = '';
            fb.append(h('div', { class: 'callout' + (o.ok ? '' : ' warn') },
              h('strong', null, o.ok ? 'Correct. ' : 'Not quite. The answer is: ' + opts.find((z) => z.ok).t + '. '), q.why || ''),
              h('div', { class: 'small muted' }, q.slide ? `Slide ${q.slide}` : ''));
            next.style.display = '';
            next.focus();
          });
          return b;
        });
        root.append(h('section', { class: 'card stack' },
          h('div', { class: 'row small muted', style: 'justify-content:space-between;gap:8px;flex-wrap:wrap' },
            h('span', null, `Question ${i + 1} of ${qs.length}`), h('span', null, `${chTitle(q.chapter)} · score ${score}`)),
          h('progress', { max: qs.length, value: i, 'aria-label': 'Quiz progress', style: 'width:100%' }),
          h('h3', { style: 'overflow-wrap:anywhere' }, q.q),
          h('div', { class: 'stack', role: 'group', 'aria-label': 'Answer options' }, btns),
          fb, next));
      }

      function finish() {
        root.innerHTML = '';
        const pct = Math.round((100 * score) / qs.length);
        const best = load('quiz-best', {});
        const prev = best && best[key];
        let isBest = false;
        if (!noSave && (!prev || pct > prev.pct)) { best[key] = { score, total: qs.length, pct }; save('quiz-best', best); isBest = true; }
        root.append(h('section', { class: 'card stack' },
          h('h3', null, 'Results'),
          h('p', { style: 'font-size:1.4em;font-variant-numeric:tabular-nums' }, `${score} / ${qs.length} (${pct}%)`),
          h('p', { class: 'muted small' }, noSave ? 'Review round: best scores are not changed.' : isBest ? 'New best score for ' + (key === 'all' ? 'mixed chapters' : chTitle(key)) + '.' : `Best for ${key === 'all' ? 'mixed chapters' : chTitle(key)}: ${prev ? prev.score + '/' + prev.total + ' (' + prev.pct + '%)' : '-'}.`),
          h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap' },
            wrong.length ? h('button', { type: 'button', class: 'btn primary', onclick: () => start(wrong.map((w) => w.q), key, true) }, `Retry ${wrong.length} wrong`) : null,
            h('button', { type: 'button', class: 'btn', onclick: setup }, 'New quiz'))));
        if (wrong.length) {
          root.append(h('section', { class: 'card stack' }, h('h3', null, 'Review wrong answers'),
            wrong.map((w) => h('div', { class: 'stack' },
              h('strong', null, w.q.q),
              h('div', { class: 'small' }, 'Your answer: ', w.picked),
              h('div', { class: 'small' }, 'Correct: ', w.right),
              h('div', { class: 'small muted' }, `${w.q.why || ''}${w.q.slide ? ' (Slide ' + w.q.slide + ')' : ''}`)))));
        }
      }
      ask();
    }
    setup();
  }

  // ================================================================ FLASHCARDS
  function cards(root) {
    if (!CARDS.length) { root.append(h('div', { class: 'callout warn' }, 'No flashcards are available.')); return; }
    const selected = new Set();
    let boxes = load('card-boxes', {});
    if (!boxes || typeof boxes !== 'object' || Array.isArray(boxes)) boxes = {};
    const MAXBOX = 3;
    let deck = [], idx = 0, flipped = false, dueOnly = false, seen = 0;
    const boxOf = (c) => Math.min(MAXBOX, Math.max(1, boxes[c.id] || 1));
    const pool = () => CARDS.filter((c) => !selected.size || selected.has(c.chapter));
    const build = (rand) => {
      let p = pool().filter((c) => !dueOnly || boxOf(c) < MAXBOX);
      p = rand ? shuffle(p) : p.slice();
      // lower boxes first (stable w.r.t. the random order above)
      p.sort((a, b) => boxOf(a) - boxOf(b));
      deck = p; idx = 0; flipped = false;
    };
    build(true);

    const top = h('section', { class: 'card stack' });
    const stage = h('div', { class: 'stack' });
    root.append(h('div', { class: 'stack' }, top, stage));

    const sum = () => {
      const p = pool();
      const c = [0, 0, 0, 0];
      p.forEach((x) => c[boxOf(x)]++);
      return { total: p.length, c, mastered: c[MAXBOX] };
    };

    function renderTop() {
      top.innerHTML = '';
      const s = sum();
      const dueChip = h('button', { type: 'button', class: 'chip' + (dueOnly ? ' is-on' : ''), 'aria-pressed': dueOnly ? 'true' : 'false' }, 'Hide mastered');
      dueChip.addEventListener('click', () => { dueOnly = !dueOnly; build(false); renderTop(); renderCard(); });
      top.append(
        h('h3', null, 'Flashcards'),
        chapterChips(selected, () => { build(true); renderTop(); renderCard(); }, CARDS),
        h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap;align-items:center' },
          dueChip,
          h('button', { type: 'button', class: 'btn ghost', onclick: () => { build(true); renderCard(); } }, 'Shuffle'),
          h('button', { type: 'button', class: 'btn ghost', onclick: () => { for (const c of pool()) delete boxes[c.id]; save('card-boxes', boxes); build(true); renderTop(); renderCard(); } }, 'Reset progress')),
        h('div', { class: 'small muted' }, `Box 1 (new/again): ${s.c[1]} · Box 2: ${s.c[2]} · Box 3 (known): ${s.c[3]}`),
        h('progress', { max: Math.max(1, s.total), value: s.mastered, 'aria-label': 'Mastered cards', style: 'width:100%' }),
        h('div', { class: 'small muted' }, `${s.mastered} of ${s.total} mastered`));
    }

    function mark(known) {
      const c = deck[idx];
      boxes[c.id] = known ? Math.min(MAXBOX, boxOf(c) + 1) : 1;
      save('card-boxes', boxes);
      seen++;
      if (!known) {
        // show it again a few cards later
        deck.splice(idx, 1);
        deck.splice(Math.min(deck.length, idx + 4), 0, c);
      } else idx++;
      flipped = false;
      renderTop();
      renderCard();
    }

    function renderCard() {
      stage.innerHTML = '';
      if (!deck.length) {
        stage.append(h('div', { class: 'callout' }, dueOnly ? 'Everything here is mastered. Turn off "Hide mastered" to review again.' : 'No cards for this selection.'));
        return;
      }
      if (idx >= deck.length) {
        stage.append(h('section', { class: 'card stack' }, h('h3', null, 'Deck finished'),
          h('p', { class: 'muted' }, 'Shuffle to go through the cards again; cards you know less well come first.'),
          h('button', { type: 'button', class: 'btn primary', onclick: () => { build(true); renderCard(); } }, 'Start again')));
        return;
      }
      const c = deck[idx];
      const face = h('button', { type: 'button', class: 'card', 'aria-live': 'polite', 'aria-label': flipped ? 'Answer. Press to show the question.' : 'Question. Press to show the answer.',
        style: 'width:100%;min-height:180px;text-align:center;cursor:pointer;display:flex;flex-direction:column;justify-content:center;gap:8px;white-space:normal;overflow-wrap:anywhere;font:inherit;color:inherit' },
        h('span', { class: 'small muted' }, `${chTitle(c.chapter)}${c.slide ? ' · Slide ' + c.slide : ''}${flipped ? ' · answer' : ' · question'}`),
        h('span', { style: 'font-size:' + (flipped ? '1em' : '1.25em') + ';font-weight:' + (flipped ? '400' : '600') }, flipped ? c.back : c.front),
        h('span', { class: 'small muted' }, flipped ? '' : 'Click or press Space to flip'));
      face.addEventListener('click', () => { flipped = !flipped; renderCard(); const f = stage.querySelector('button.card'); if (f) f.focus(); });
      const known = h('button', { type: 'button', class: 'btn primary', onclick: () => mark(true) }, 'Known');
      const again = h('button', { type: 'button', class: 'btn', onclick: () => mark(false) }, 'Again');
      if (!flipped) { known.disabled = true; again.disabled = true; }
      stage.append(
        h('div', { class: 'small muted' }, `Card ${idx + 1} of ${deck.length} · box ${boxOf(c)}`),
        face,
        h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap' }, again, known,
          h('span', { class: 'small muted' }, flipped ? '' : 'Flip the card to rate it')));
    }
    renderTop();
    renderCard();
  }

  show('quiz');
}
