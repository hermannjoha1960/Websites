// Renders the previews (or live URLs) in Chromium and saves screenshots.
// Usage: node tools/screenshots.mjs <out_dir> <file-or-url> [more...]
//   env WIDTHS="390,1440"  FULL=1 (full-page)  SCROLL=1 (scroll through to trigger reveals)
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

const [outDir, ...targets] = process.argv.slice(2);
const widths = (process.env.WIDTHS || '390,1440').split(',').map(Number);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
for (const target of targets) {
  // local previews are served under the live origin so fonts and media load same-origin
  const isLocal = !/^https?:/.test(target);
  const url = isLocal ? 'https://trading-am-see.de/__preview/' + basename(target) : target;
  const name = /^https?:/.test(target)
    ? (new URL(target).pathname.replace(/\//g, '_') || '_') + 'live'
    : basename(target, '.html');
  for (const w of widths) {
    const page = await browser.newPage({ viewport: { width: w, height: w < 600 ? 844 : 900 }, deviceScaleFactor: 1 });
    if (isLocal) {
      const html = readFileSync(resolve(target), 'utf8');
      await page.route('https://trading-am-see.de/__preview/**', (route) =>
        route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html }));
    }
    const errors = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2600);
    await page.screenshot({ path: `${outDir}/${name}-${w}-top.png` });
    if (process.env.SCROLL !== '0') {
      await page.evaluate(async () => {
        const step = window.innerHeight * 0.6;
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 120));
        }
        document.querySelectorAll('.rv').forEach((el) => el.classList.add('is-in'));
        document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
        window.scrollTo(0, 0);
      });
      await page.waitForFunction(() => Array.from(document.images).every((i) => i.complete), null, { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(1500);
    }
    if (process.env.FULL !== '0') {
      await page.screenshot({ path: `${outDir}/${name}-${w}-full.png`, fullPage: true });
    }
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      height: document.documentElement.scrollHeight,
    }));
    console.log(name, w, JSON.stringify(metrics), errors.length ? errors.join(' | ') : 'no errors');
    await page.close();
  }
}
await browser.close();
