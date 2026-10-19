// Timbaly layout probe (from get_layout_probe), evaluated in the rendered page.
// Set window.__larghezzaAttesa to the viewport width first.
// Report: viewportForzato > 0 = page widened the viewport (worst mobile defect),
// sforamentoPagina > 0 = horizontal scroll, sforanti = deepest overflowing elements,
// bersagliPiccoli = tap targets under 44px, testoPiccolo = text under 12px.
(() => {
  const TAP = 44;
  const TESTO_MIN = 12;
  const de = document.documentElement;
  const attesa = window.__larghezzaAttesa || window.screen.width || de.clientWidth;

  const scrollW = Math.max(de.scrollWidth, document.body ? document.body.scrollWidth : 0);
  const referto = {
    larghezzaAttesa: attesa,
    clientWidth: de.clientWidth,
    scostamentoDaAttesa: de.clientWidth - attesa,
    innerWidth: window.innerWidth,
    viewportForzato: window.innerWidth - de.clientWidth,
    sforamentoPagina: Math.round(scrollW - de.clientWidth),
    fogliDiStile: document.styleSheets.length,
    sforanti: [],
    dentroScorrevoli: 0,
    bersagliPiccoli: [],
    testoPiccolo: [],
    daProvare: []
  };

  const sel = el => {
    const cls = (el.getAttribute && el.getAttribute('class')) || '';
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
           (cls ? '.' + cls.trim().split(/\s+/).slice(0, 3).join('.') : '');
  };
  const testo = el => (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  const scorrevole = el => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const ox = getComputedStyle(p).overflowX;
      if (ox === 'auto' || ox === 'scroll') return true;
    }
    return false;
  };

  const limite = de.clientWidth;
  const candidati = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    if (getComputedStyle(el).position === 'fixed') continue;
    if (r.right > limite + 1 || r.left < -1) {
      if (scorrevole(el)) { referto.dentroScorrevoli++; continue; }
      candidati.push(el);
    }
  }
  for (const el of candidati) {
    if (candidati.some(altro => altro !== el && el.contains(altro))) continue;
    const r = el.getBoundingClientRect();
    referto.sforanti.push({
      elemento: sel(el), larghezza: Math.round(r.width),
      bordoDestro: Math.round(r.right), oltre: Math.round(r.right - limite), testo: testo(el)
    });
  }

  const CLICCABILI = 'a[href],button,input,select,textarea,summary,[role=button],[role=tab],[role=switch],[role=menuitem]';
  for (const el of document.querySelectorAll(CLICCABILI)) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (r.width <= 4 || r.height <= 4) continue;
    if (cs.clip && cs.clip !== 'auto') continue;
    if (cs.display === 'inline') continue;
    if (r.height >= TAP - 0.5 && r.width >= TAP - 0.5) continue;
    referto.bersagliPiccoli.push({
      elemento: sel(el), larghezza: Math.round(r.width), altezza: Math.round(r.height), testo: testo(el)
    });
  }

  for (const el of document.querySelectorAll('body *')) {
    if (el.children.length) continue;
    const t = (el.textContent || '').trim();
    if (t.length < 16) continue;
    const cs = getComputedStyle(el);
    const px = parseFloat(cs.fontSize);
    if (px >= TESTO_MIN) continue;
    referto.testoPiccolo.push({
      elemento: sel(el), px: px,
      sembraEtichetta: /mono/i.test(cs.fontFamily) || cs.textTransform === 'uppercase',
      testo: t.replace(/\s+/g, ' ').slice(0, 50)
    });
  }

  const conta = (etichetta, selettore) => {
    const n = document.querySelectorAll(selettore).length;
    if (n) referto.daProvare.push({ cosa: etichetta, quanti: n, selettore: selettore });
  };
  conta('menu apribile senza JS (checkbox nascosta + label)', 'input[type=checkbox][class*=sr], input[type=checkbox][hidden]');
  conta('blocchi a soffietto', 'details');
  conta('form', 'form');
  conta('casella di consenso privacy', 'input[type=checkbox][name*=privacy], input[type=checkbox][id*=privacy]');
  conta('bottoni con gestore inline', '[onclick]');
  conta('ancore interne', 'a[href^="#"]');
  conta('immagini che si ingrandiscono', 'img:not([data-no-lightbox])');

  return referto;
})()
