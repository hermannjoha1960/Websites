// Assembles full HTML previews of every page exactly as Timbaly serves them:
// head tags + custom CSS + nav + page (blocks expanded) + footer + footer script.
// A <base> tag points /uploads and /fonts at the live domain, so the previews show the real media.
// Usage (from site/): node ../tools/build-preview.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = join(dirname(fileURLToPath(import.meta.url)), '..', 'site');
const read = (p) => readFileSync(join(site, p), 'utf8');

const meta = JSON.parse(read('pages/pages.json'));
const css = read('dist/site.css');
const head = read('src/head.html');
const nav = read('src/nav.html');
const footer = read('src/footer.html');
const js = read('src/scripts.js');
const blocks = Object.fromEntries(
  readdirSync(join(site, 'blocks'))
    .filter((f) => f.endsWith('.html'))
    .map((f) => [f.replace(/\.html$/, ''), read(join('blocks', f))]),
);

const expandBlocks = (html) =>
  html.replace(/\[\[BLOCK:([a-z0-9-]+)[^\]]*\]\]/g, (m, name) => {
    if (!blocks[name]) throw new Error(`unknown block ${name}`);
    return blocks[name];
  });

mkdirSync(join(site, '..', 'preview'), { recursive: true });
for (const page of meta) {
  const file = join(site, 'pages', page.file);
  if (!existsSync(file)) continue;
  const body = expandBlocks(readFileSync(file, 'utf8'));
  const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${page.title}</title>
<meta name="description" content="${page.metaDescription}">
<base href="https://trading-am-see.de/">
${head}
<style>${css}</style>
</head>
<body>
${nav}
${body}
${footer}
<script>${js}</script>
</body>
</html>`;
  const out = join(site, '..', 'preview', page.file);
  writeFileSync(out, html);
  console.log('preview/' + page.file, Math.round(html.length / 1024) + ' KB');
}
