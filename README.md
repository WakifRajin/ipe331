# IPE 331 Machine Shop Atlas

Interactive 3D study site for Prianka ma'am's part of IPE 331 (metal removing processes): turning, milling,
shaping/planing, grinding and drilling, plus cutting tools and indexing.

- **6 chapters, 29 procedural 3D models** (Three.js): click parts, explode assemblies, switch operations and
  watch animated cuts. The colour code is V red = cutting motion, f blue = feed, d green = depth of cut.
- **Question bank**: all 128 mapped term-final questions (2009-10 → 2023-24) with model answers, Answer Notes A–M,
  filters and done/revise tracking.
- **Calculators** for turning, milling, shaper, drilling, grinding and indexing numericals, with past exam
  questions preloaded.
- **Practice**: 152 MCQs and 94 flashcards.

## Run locally

ES modules need a web server (opening `index.html` as a file will not work):

```bash
python tools/serve.py 5173
```

Then open http://127.0.0.1:5173.

## Develop

- `SPEC.md`: the model contract and the site's conventions.
- `node tools/smoke.mjs js/models/*.js`: builds every model headlessly and checks the contract (run `npm install` first).
- `node tools/build-artifact.mjs`: writes `dist/artifact.html` + `dist/files.json` for publishing as a claude.ai Artifact.
