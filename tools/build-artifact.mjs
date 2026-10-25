// Builds dist/artifact.html: the page body for a claude.ai Artifact (the host adds doctype/head/body),
// and prints the list of supporting files to publish next to it.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];

// Keep everything from <head> except the charset/viewport metas the host already provides.
const headKept = head
  .split('\n')
  .filter((l) => !/<meta charset|<meta name="viewport"/.test(l))
  .join('\n')
  .trim();

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'artifact.html'), `${headKept}\n${body.trim()}\n`);

const files = [];
const walk = (dir) => {
  for (const f of fs.readdirSync(path.join(root, dir))) {
    const rel = `${dir}/${f}`;
    if (fs.statSync(path.join(root, rel)).isDirectory()) walk(rel);
    else if (/\.(js|css)$/.test(f)) files.push(rel);
  }
};
walk('css');
walk('js');
fs.writeFileSync(path.join(root, 'dist', 'files.json'), JSON.stringify(Object.fromEntries(files.map((f) => [f, f])), null, 2));
console.log(`dist/artifact.html written; ${files.length} supporting files listed in dist/files.json`);
