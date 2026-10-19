// Live QA for trading-am-see.de.
// Runs the Timbaly layout probe on every page at 390/768/1440, collects console
// errors and failed requests, and exercises the interactions: mobile menu open and
// close, FAQ details, cookie banner vs. sticky CTA, and the lead form. The form POST
// to /api/contact is intercepted, so no lead is created and no e-mail is sent.
// Usage: node tools/check-live.mjs [out_dir]   (screenshots go to out_dir, default shots/live)
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ORIGIN = 'https://trading-am-see.de';
const PAGES = ['/', '/programm', '/location', '/veranstalter', '/faq', '/anmeldung', '/risikohinweis', '/impressum', '/datenschutz'];
const SIZES = [[390, 844], [768, 1024], [1440, 900]];
const here = dirname(fileURLToPath(import.meta.url));
const PROBE = readFileSync(resolve(here, 'layout-probe.js'), 'utf8');
const outDir = process.argv[2] || resolve(here, '../shots/live');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
let problems = 0;
const fail = (msg) => { problems++; console.log('  ✗ ' + msg); };
const ok = (msg) => console.log('  ✓ ' + msg);

async function open(path, [w, h], { consent = 'accepted' } = {}) {
  const mobile = w < 800;
  const context = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(ORIGIN)) errors.push(`${r.status()} ${r.url()}`); });
  if (consent === 'accepted') {
    // the visitor already answered the banner (platform cookie aicms_cc), so it does not cover the probe
    const value = encodeURIComponent(JSON.stringify({ necessary: true, analytics: false, marketing: false }));
    await context.addCookies([{ name: 'aicms_cc', value, domain: 'trading-am-see.de', path: '/' }]);
  }
  await page.goto(ORIGIN + path, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1800);
  return { context, page, errors };
}

// 1. layout probe + console on every page and width
for (const path of PAGES) {
  console.log(path);
  for (const size of SIZES) {
    const { context, page, errors } = await open(path, size);
    await page.evaluate((w) => { window.__larghezzaAttesa = w; }, size[0]);
    const r = await page.evaluate(PROBE);
    const small = r.bersagliPiccoli.filter((b) => !/t-crumbs|t-footer|t-legal/.test(b.elemento));
    const tiny = r.testoPiccolo.filter((t) => !t.sembraEtichetta);
    const line = `${size[0]}: sheets=${r.fogliDiStile} forced=${r.viewportForzato} overflow=${r.sforamentoPagina} sforanti=${r.sforanti.length} smallTargets=${r.bersagliPiccoli.length} smallText=${tiny.length}`;
    if (r.fogliDiStile === 0 || r.viewportForzato > 0 || r.sforamentoPagina > 0 || tiny.length || errors.length) {
      fail(line);
      r.sforanti.slice(0, 5).forEach((s) => console.log('     sfora', JSON.stringify(s)));
      tiny.slice(0, 5).forEach((s) => console.log('     testo', JSON.stringify(s)));
      errors.slice(0, 5).forEach((e) => console.log('     err', e));
    } else {
      ok(line);
    }
    if (small.length) small.slice(0, 6).forEach((s) => console.log('     tap', JSON.stringify(s)));
    if (path === '/' || size[0] === 390) {
      const name = (path.replace(/\//g, '') || 'home') + '-' + size[0];
      await page.screenshot({ path: `${outDir}/${name}-top.png` });
    }
    await context.close();
  }
}

// 2. cookie banner on first visit (phone): visible, German, not hiding the sticky CTA
console.log('cookie banner');
{
  const { context, page } = await open('/', [390, 844], { consent: 'none' });
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.6));
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${outDir}/cookie-banner-390.png` });
  const info = await page.evaluate(() => {
    const el = document.getElementById('cc-banner');
    const banner = el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0 ? el : null;
    const sticky = document.querySelector('.t-sticky');
    const box = (el) => el && (({ top, bottom, height }) => ({ top: Math.round(top), bottom: Math.round(bottom), height: Math.round(height) }))(el.getBoundingClientRect());
    return {
      banner: !!banner,
      bannerText: banner ? banner.innerText.replace(/\s+/g, ' ').slice(0, 400) : '',
      buttons: banner ? [...banner.querySelectorAll('button,a')].map((b) => b.innerText.trim()).filter(Boolean) : [],
      bannerBox: box(banner),
      stickyBox: sticky && getComputedStyle(sticky).visibility !== 'hidden' ? box(sticky) : null,
      stickyClass: sticky ? sticky.className : '',
    };
  });
  console.log('  ', JSON.stringify(info));
  if (!info.banner) fail('banner not shown on first visit'); else ok('banner shown');
  if (/is-visible/.test(info.stickyClass)) fail('sticky CTA visible under the open banner'); else ok('sticky CTA waits for the banner');
  if (info.buttons.includes('Datenschutzerklärung')) ok('privacy link in German'); else fail('privacy link label: ' + info.buttons[0]);
  await page.locator('#cc-banner button', { hasText: 'Nur notwendige' }).click();
  await page.waitForTimeout(900);
  const after = await page.evaluate(() => ({
    banner: getComputedStyle(document.getElementById('cc-banner')).display,
    sticky: document.querySelector('.t-sticky').className,
    cookie: document.cookie.includes('aicms_cc'),
  }));
  if (after.banner === 'none' && /is-visible/.test(after.sticky) && after.cookie) ok('after "Nur notwendige": banner gone, sticky CTA back, choice stored');
  else fail('after answering the banner: ' + JSON.stringify(after));
  await context.close();
}

// 3. mobile menu open / close
console.log('menu');
{
  const { context, page } = await open('/', [390, 844]);
  const burger = page.locator('.t-burger');
  await burger.click();
  await page.waitForTimeout(700);
  const opened = await page.evaluate(() => ({
    expanded: document.querySelector('.t-burger').getAttribute('aria-expanded'),
    hidden: document.getElementById('t-menu').getAttribute('aria-hidden'),
    visible: getComputedStyle(document.getElementById('t-menu')).visibility,
  }));
  await page.screenshot({ path: `${outDir}/menu-open-390.png` });
  await burger.click();
  await page.waitForTimeout(700);
  const closed = await page.evaluate(() => ({
    expanded: document.querySelector('.t-burger').getAttribute('aria-expanded'),
    hidden: document.getElementById('t-menu').getAttribute('aria-hidden'),
  }));
  console.log('   open', JSON.stringify(opened), 'closed', JSON.stringify(closed));
  if (opened.expanded === 'true' && opened.hidden === 'false' && closed.expanded === 'false' && closed.hidden === 'true') ok('menu opens and closes');
  else fail('menu state wrong');
  // a menu link navigates
  await burger.click();
  await page.waitForTimeout(500);
  await Promise.all([page.waitForURL('**/programm'), page.locator('#t-menu a[href="/programm"]').click()]);
  ok('menu link navigates to ' + new URL(page.url()).pathname);
  await context.close();
}

// 4. FAQ details open / close
console.log('faq');
{
  const { context, page } = await open('/faq', [390, 844]);
  const first = page.locator('.t-faq details').first();
  await first.locator('summary').click();
  const isOpen = await first.evaluate((d) => d.open);
  await first.locator('summary').click();
  const isClosed = await first.evaluate((d) => !d.open);
  if (isOpen && isClosed) ok('details open and close'); else fail(`details open=${isOpen} closedAgain=${isClosed}`);
  await context.close();
}

// 5. lead form: validation, payload, German thank-you (request intercepted)
console.log('form');
for (const size of [[390, 844], [1440, 900]]) {
  const { context, page, errors } = await open('/anmeldung?utm_source=test&utm_campaign=qa', size);
  let payload = null;
  await page.route('**/api/contact', async (route) => {
    payload = JSON.parse(route.request().postData() || '{}');
    await new Promise((r) => setTimeout(r, 400));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: 'Messaggio inviato con successo!' }) });
  });
  const form = page.locator('form#contact-form');
  // empty submit must be blocked by the browser (required fields)
  await form.locator('[type=submit]').click();
  await page.waitForTimeout(300);
  if (payload) fail('empty form was sent'); else ok(`${size[0]}: empty form blocked`);
  await form.locator('#f-name').fill('QA Test');
  await form.locator('#f-email').fill('qa@example.com');
  await form.locator('#f-erfahrung').selectOption({ index: 2 });
  for (const v of ['Indizes / Futures', 'Devisen', 'Sommer 2027']) {
    await form.locator(`input[type=checkbox][value="${v}"]`).locator('xpath=..').click();
  }
  await form.locator('input[name=teilnahme]').first().locator('xpath=..').click();
  await form.locator('#f-message').fill('Automatischer Test – wird nicht gesendet.');
  // without consent the platform must refuse
  await form.locator('[type=submit]').click();
  await page.waitForTimeout(300);
  if (payload) fail('sent without consent'); else ok(`${size[0]}: blocked without consent`);
  await form.locator('#privacy_consent').check({ force: true });
  await form.locator('[type=submit]').click();
  await page.waitForTimeout(400);
  const loadingText = await form.locator('[type=submit]').innerText();
  await page.waitForTimeout(1500);
  const after = await page.evaluate(() => {
    const t = document.getElementById('t-thanks');
    const msg = document.querySelector('.aicms-form-message');
    return {
      thanksVisible: !!t && getComputedStyle(t).display !== 'none' && t.getBoundingClientRect().height > 0,
      thanksText: t ? t.innerText.replace(/\s+/g, ' ').slice(0, 160) : '',
      message: msg ? msg.innerText : '',
    };
  });
  await page.screenshot({ path: `${outDir}/form-thanks-${size[0]}.png` });
  console.log('   payload', JSON.stringify(payload && payload.fields));
  console.log('   loading text:', JSON.stringify(loadingText), 'after:', JSON.stringify(after));
  const f = (payload && payload.fields) || {};
  if (f.name === 'QA Test' && f.email === 'qa@example.com' && /Indizes/.test(f.maerkte) && /Devisen/.test(f.maerkte) && /Sommer 2027/.test(f.zeitraum)
      && f.teilnahme && f.privacy_consent === '1' && f.utm_source === 'test' && f.utm_campaign === 'qa' && f.seite) ok(`${size[0]}: payload complete`);
  else fail(`${size[0]}: payload incomplete`);
  if (after.thanksVisible && !/[àèìòù]|Messaggio|inviato/i.test(after.thanksText + after.message)) ok(`${size[0]}: German thank-you shown`);
  else fail(`${size[0]}: thank-you missing or Italian`);
  if (/Invio|corso/i.test(loadingText)) fail(`${size[0]}: Italian loading text "${loadingText}"`);
  if (errors.length) fail(errors.join(' | '));
  await context.close();
}

await browser.close();
console.log(problems ? `\n${problems} problem(s)` : '\nall checks passed');
process.exit(problems ? 1 : 0);
