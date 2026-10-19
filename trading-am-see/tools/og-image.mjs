// Renders the 1200x630 social sharing image (Open Graph) with the site fonts.
// Usage: node tools/og-image.mjs <out.jpg>
import { chromium } from 'playwright';

const out = process.argv[2] || 'og-trading-am-see.jpg';
const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="/fonts/sets/instrument-serif-a861b5c6.css">
<style>
@font-face{font-family:'Instrument Serif';font-style:italic;src:url(/uploads/site-87/brand/instrument-serif-italic-latin.woff2) format('woff2')}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;background:#070b12;font-family:Inter,sans-serif;color:#fff;position:relative}
.bg{position:absolute;inset:0;background:url(/uploads/site-87/symbolbild-goldener-kerzenchart-der-sich-bei-sonnenaufgang-i.jpg) 62% 50%/cover}
.shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(7,11,18,.94) 0%,rgba(7,11,18,.78) 42%,rgba(7,11,18,.15) 75%,rgba(7,11,18,0) 100%)}
.c{position:absolute;left:72px;top:70px;right:420px}
.eb{font-size:17px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:#D4A24C;display:flex;align-items:center;gap:14px}
.eb:before{content:'';width:34px;height:1px;background:#D4A24C}
h1{margin-top:30px;font-family:'Instrument Serif',serif;font-weight:400;font-size:82px;line-height:.98;letter-spacing:-.01em}
h1 em{font-style:italic;background:linear-gradient(100deg,#fff0cc,#F2C879 45%,#f0b25f);-webkit-background-clip:text;color:transparent}
.f{position:absolute;left:72px;bottom:58px;display:flex;align-items:center;gap:16px;font-size:20px}
.f b{font-family:'Instrument Serif',serif;font-weight:400;font-size:34px}
.f b i{color:#D4A24C;font-size:.86em}
.f span{color:rgba(255,255,255,.7);padding-left:18px;border-left:1px solid rgba(255,255,255,.25)}
</style></head><body><div class="bg"></div><div class="shade"></div>
<div class="c"><p class="eb">Live-Trading-Retreat · Krüpelsee</p>
<h1>Sechs Nächte am See.<br><em>Fünf Tage live im Markt.</em></h1></div>
<div class="f"><svg width="44" height="44" viewBox="0 0 40 40" fill="none"><g stroke="#D4A24C" stroke-linecap="round"><line x1="10" y1="14" x2="10" y2="27" stroke-width="1.4"/><line x1="20" y1="8" x2="20" y2="24" stroke-width="1.4"/><line x1="30" y1="3" x2="30" y2="20" stroke-width="1.4"/><line x1="3" y1="29.5" x2="37" y2="29.5" stroke-width="1.3"/><path d="M7.5 32.6h5M17.5 32.6h5M27.5 32.6h5" stroke-width="1.3" opacity=".6"/><path d="M8.6 35.2h2.8M18.6 35.2h2.8M28.6 35.2h2.8" stroke-width="1.2" opacity=".38"/></g><g fill="#D4A24C"><rect x="7.5" y="17" width="5" height="8" rx="1"/><rect x="17.5" y="11" width="5" height="10" rx="1"/><rect x="27.5" y="5" width="5" height="11" rx="1"/></g></svg>
<b>Trading <i>am</i> See</b><span>30 km vor Berlin · 5.500 € all-inclusive</span></div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.route('https://trading-am-see.de/__og', (r) => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html }));
await page.goto('https://trading-am-see.de/__og', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);
await page.screenshot({ path: out, type: 'jpeg', quality: 88 });
await browser.close();
console.log('wrote', out);
