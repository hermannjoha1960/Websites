// Writes the exact strings that are saved in Timbaly (publish/ folder):
// page bodies with [[BLOCK:…]] placeholders kept, blocks, nav/footer, head tags,
// footer script and the compiled custom CSS. Leading indentation is stripped to keep payloads small.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, 'site');
const out = join(root, 'publish');
mkdirSync(join(out, 'blocks'), { recursive: true });
const squeeze = (html) => html.split('\n').map((l) => l.trim()).filter(Boolean).join('\n');
const read = (p) => readFileSync(join(site, p), 'utf8');

for (const f of readdirSync(join(site, 'pages')).filter((f) => f.endsWith('.html'))) {
  writeFileSync(join(out, f), squeeze(read('pages/' + f)));
}
for (const f of readdirSync(join(site, 'blocks'))) {
  writeFileSync(join(out, 'blocks', f), squeeze(read('blocks/' + f)));
}
writeFileSync(join(out, 'nav.html'), squeeze(read('src/nav.html')));
writeFileSync(join(out, 'footer.html'), squeeze(read('src/footer.html')));
writeFileSync(join(out, 'head.html'), squeeze(read('src/head.html')));
writeFileSync(join(out, 'footer-scripts.html'), '<script>\n' + read('src/scripts.js') + '</script>');
writeFileSync(join(out, 'site.css'), read('dist/site.css'));
for (const f of readdirSync(out)) {
  if (f.includes('.')) console.log(f, readFileSync(join(out, f), 'utf8').length);
}
