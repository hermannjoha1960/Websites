/* trading-am-see.de — interactions (served as the site's footer script).
   The platform loads forms.js / lightbox.js / tracker.js after this file. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function onScroll(fn) { window.addEventListener('scroll', fn, { passive: true }); }

  /* ---------- page ready: opens the letterbox and reveals the hero lines ---------- */
  function markLoaded() { root.classList.add('is-loaded'); }
  var firstSlide = $('.t-hero__slide img, .t-pagehero__media img');
  if (firstSlide && !firstSlide.complete && firstSlide.decode) {
    firstSlide.decode().then(markLoaded, markLoaded);
    setTimeout(markLoaded, 1400);
  } else {
    requestAnimationFrame(function () { requestAnimationFrame(markLoaded); });
  }

  /* ---------- navigation ---------- */
  var nav = $('#t-nav');
  var burger = $('.t-burger');
  var menu = $('#t-menu');
  var lastY = window.scrollY;
  function updateNav() {
    var y = window.scrollY;
    if (nav) {
      nav.classList.toggle('is-scrolled', y > 30);
      var menuOpen = root.classList.contains('t-menu-open');
      nav.classList.toggle('is-hidden', !menuOpen && y > window.innerHeight && y > lastY + 4);
      if (y < lastY - 4) nav.classList.remove('is-hidden');
    }
    lastY = y;
  }
  onScroll(updateNav);
  updateNav();

  function setMenu(open) {
    root.classList.toggle('t-menu-open', open);
    if (burger) {
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    }
    if (menu) menu.setAttribute('aria-hidden', open ? 'false' : 'true');
  }
  if (burger) burger.addEventListener('click', function () { setMenu(!root.classList.contains('t-menu-open')); });
  $$('#t-menu a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  var here = location.pathname.replace(/\/+$/, '') || '/';
  $$('.t-nav__link, .t-menu__link').forEach(function (a) {
    var p = (a.getAttribute('href') || '').replace(/\/+$/, '') || '/';
    if (p === here) a.setAttribute('aria-current', 'page');
  });

  /* ---------- the form is on this page: CTA links scroll to it instead of leaving ---------- */
  var formSection = document.getElementById('anmeldung');
  if (formSection) {
    $$('a[href="/anmeldung"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        setMenu(false);
        formSection.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      });
    });
  }

  /* ---------- carry UTM parameters across internal links (no storage on the device) ---------- */
  var params = new URLSearchParams(location.search);
  var utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  var utm = utmKeys.filter(function (k) { return params.get(k); });
  if (utm.length) {
    $$('a[href^="/"]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (href.indexOf('/uploads/') === 0) return;
      var url = new URL(href, location.origin);
      utm.forEach(function (k) { url.searchParams.set(k, params.get(k)); });
      a.setAttribute('href', url.pathname + url.search + url.hash);
    });
  }

  /* ---------- hero slideshow ---------- */
  var hero = $('.t-hero');
  if (hero) {
    var slides = $$('.t-hero__slide', hero);
    var bars = $$('.t-hero__bars i', hero);
    var count = $('.t-hero__count', hero);
    var caption = $('.t-hero__place', hero);
    var current = 0;
    var SLIDE_MS = 7000;
    hero.style.setProperty('--slide-ms', SLIDE_MS + 'ms');

    var loadSlide = function (i) {
      var img = $('img', slides[i]);
      if (img && img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
    };
    var show = function (i) {
      loadSlide(i);
      loadSlide((i + 1) % slides.length);
      slides.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      bars.forEach(function (b, k) {
        b.classList.remove('is-active');
        b.classList.toggle('is-done', k < i);
      });
      if (bars[i]) { void bars[i].offsetWidth; bars[i].classList.add('is-active'); }
      if (count) count.textContent = ('0' + (i + 1)).slice(-2) + ' / ' + ('0' + slides.length).slice(-2);
      if (caption) caption.textContent = slides[i].getAttribute('data-place') || '';
      current = i;
    };
    show(0);
    if (slides.length > 1 && !reduceMotion) {
      var timer = setInterval(function () {
        if (!document.hidden) show((current + 1) % slides.length);
      }, SLIDE_MS);
      window.addEventListener('pagehide', function () { clearInterval(timer); });
    }
  }

  /* ---------- reveal on scroll ---------- */
  var revealEls = $$('.rv');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- counters ---------- */
  var counters = $$('[data-count]');
  function runCounter(el) {
    var to = parseFloat(el.getAttribute('data-count'));
    var to2 = el.hasAttribute('data-count-to') ? parseFloat(el.getAttribute('data-count-to')) : null;
    var sep = el.getAttribute('data-sep') || '–';
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = 1600;
    var t0 = null;
    function frame(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      var a = Math.round(to * e);
      el.textContent = (to2 !== null ? a + sep + Math.round(to2 * e) : a) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  if ('IntersectionObserver' in window && !reduceMotion) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCounter(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ---------- parallax ---------- */
  var parallaxEls = $$('[data-parallax]');
  if (parallaxEls.length && !reduceMotion) {
    var ticking = false;
    var applyParallax = function () {
      var vh = window.innerHeight;
      parallaxEls.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.1;
        var max = r.height * 0.08;
        var offset = Math.max(-max, Math.min(max, (r.top + r.height / 2 - vh / 2) * -speed));
        el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
      });
      ticking = false;
    };
    onScroll(function () { if (!ticking) { ticking = true; requestAnimationFrame(applyParallax); } });
    window.addEventListener('resize', applyParallax);
    applyParallax();
  }

  /* ---------- card spotlight ---------- */
  $$('.t-card').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- "Ein Tag am See": sticky picture follows the active step ---------- */
  var steps = $$('.t-day__step');
  if (steps.length && 'IntersectionObserver' in window) {
    var shots = $$('.t-day__shot');
    var clock = $('.t-day__clock');
    var activate = function (i) {
      steps.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      shots.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      if (clock) clock.textContent = steps[i].getAttribute('data-time') || '';
    };
    activate(0);
    var dio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) activate(steps.indexOf(en.target));
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(function (s) { dio.observe(s); });
  }

  /* ---------- live chart visualisation (decorative, random walk – not market data) ---------- */
  var canvas = $('.t-term__canvas');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var candles = [];
    var W = 0;
    var H = 0;
    var running = false;
    var price = 100;
    var seed = 7;
    var rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    var newCandle = function (open) {
      return { o: open, h: open, l: open, c: open, drift: (rnd() - 0.48) * 0.9 };
    };
    for (var i = 0; i < 60; i++) {
      var cd = newCandle(price);
      for (var k = 0; k < 8; k++) {
        price += (rnd() - 0.5) * 1.1 + cd.drift * 0.25;
        cd.c = price; cd.h = Math.max(cd.h, price); cd.l = Math.min(cd.l, price);
      }
      candles.push(cd);
    }
    var resize = function () {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    var draw = function () {
      ctx.clearRect(0, 0, W, H);
      var n = Math.max(24, Math.min(candles.length, Math.floor(W / 14)));
      var view = candles.slice(-n);
      var hi = -Infinity; var lo = Infinity;
      view.forEach(function (c) { hi = Math.max(hi, c.h); lo = Math.min(lo, c.l); });
      var pad = (hi - lo) * 0.18 + 0.5;
      hi += pad; lo -= pad;
      var y = function (v) { return H - ((v - lo) / (hi - lo)) * H; };
      var step = W / (n + 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      for (var g = 1; g < 5; g++) {
        ctx.beginPath(); ctx.moveTo(0, (H / 5) * g + 0.5); ctx.lineTo(W, (H / 5) * g + 0.5); ctx.stroke();
      }
      var ema = null; var emaPts = [];
      view.forEach(function (c, idx) {
        var x = step * (idx + 1);
        var up = c.c >= c.o;
        var col = up ? '#2FBF8F' : '#E5484D';
        ctx.strokeStyle = col; ctx.fillStyle = col;
        ctx.beginPath(); ctx.moveTo(x, y(c.h)); ctx.lineTo(x, y(c.l)); ctx.stroke();
        var top = y(Math.max(c.o, c.c)); var bh = Math.max(1.5, Math.abs(y(c.o) - y(c.c)));
        ctx.globalAlpha = up ? 0.95 : 0.85;
        ctx.fillRect(x - step * 0.32, top, step * 0.64, bh);
        ctx.globalAlpha = 1;
        ema = ema === null ? c.c : ema + (c.c - ema) * 0.16;
        emaPts.push([x, y(ema)]);
      });
      var grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, 'rgba(212,162,76,0.18)');
      grad.addColorStop(1, 'rgba(212,162,76,0)');
      ctx.beginPath();
      emaPts.forEach(function (p, idx) { if (idx) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
      ctx.strokeStyle = '#D4A24C'; ctx.lineWidth = 2; ctx.stroke();
      ctx.lineTo(emaPts[emaPts.length - 1][0], H); ctx.lineTo(emaPts[0][0], H); ctx.closePath();
      ctx.fillStyle = grad; ctx.fill();
      var last = view[view.length - 1];
      var ly = y(last.c);
      ctx.setLineDash([4, 5]);
      ctx.strokeStyle = 'rgba(242,200,121,0.55)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(W, ly); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#F2C879';
      ctx.beginPath(); ctx.arc(step * view.length, ly, 3.5, 0, Math.PI * 2); ctx.fill();
    };
    var ticks = 0;
    var tick = function () {
      if (!running) return;
      var c = candles[candles.length - 1];
      price += (rnd() - 0.5) * 1.1 + c.drift * 0.25;
      c.c = price; c.h = Math.max(c.h, price); c.l = Math.min(c.l, price);
      if (++ticks % 10 === 0) { candles.push(newCandle(price)); if (candles.length > 200) candles.shift(); }
      draw();
      setTimeout(function () { requestAnimationFrame(tick); }, 130);
    };
    resize(); draw();
    window.addEventListener('resize', function () { resize(); draw(); });
    if ('IntersectionObserver' in window && !reduceMotion) {
      new IntersectionObserver(function (entries) {
        var vis = entries[0].isIntersecting;
        if (vis && !running) { running = true; tick(); }
        if (!vis) running = false;
      }).observe(canvas);
    }
    var clockEl = $('.t-term__clock');
    if (clockEl && window.Intl) {
      var fmt = new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', second: '2-digit' });
      var updateClock = function () { clockEl.textContent = fmt.format(new Date()) + ' Berlin'; };
      updateClock(); setInterval(updateClock, 1000);
    }
  }

  /* ---------- sticky mobile CTA ---------- */
  var sticky = $('#t-sticky');
  if (sticky) {
    var hideZones = $$('#anmeldung, .t-footer');
    var zoneVisible = false;
    // the platform cookie banner takes the same spot until it is answered (it is parsed after this script)
    var bannerOpen = function () {
      var b = document.getElementById('cc-banner');
      return !!b && b.style.display !== 'none' && b.offsetHeight > 0;
    };
    var updateSticky = function () {
      sticky.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.75 && !zoneVisible && !bannerOpen());
    };
    // fired just before the banner hides itself
    document.addEventListener('cookieConsentUpdate', function () { setTimeout(updateSticky, 0); });
    if ('IntersectionObserver' in window && hideZones.length) {
      var seen = new Map();
      var zio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { seen.set(en.target, en.isIntersecting); });
        zoneVisible = Array.from(seen.values()).some(Boolean);
        updateSticky();
      });
      hideZones.forEach(function (z) { zio.observe(z); });
    }
    onScroll(updateSticky);
    updateSticky();
  }

  /* ---------- platform cookie banner: the labels it leaves in Italian/English ---------- */
  var localizeBanner = function () {
    var named = { 'cc-banner': 'Cookie-Einwilligung', 'cc-settings': 'Cookie-Einstellungen' };
    Object.keys(named).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.setAttribute('aria-label', named[id]);
    });
    $$('.cc-panel-close').forEach(function (b) { b.setAttribute('aria-label', 'Schließen'); });
    $$('.cc-toggle').forEach(function (t) { t.setAttribute('aria-label', 'Analyse-Cookies'); });
    $$('.cc-desc a').forEach(function (a) { if (/privacy/i.test(a.textContent)) a.textContent = 'Datenschutzerklärung'; });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', localizeBanner);
  else localizeBanner();

  /* ---------- registration form ---------- */
  var form = document.getElementById('contact-form');
  if (form) {
    // multi-choice chips are joined into one hidden field (FormData keeps only one value per name)
    $$('[data-multi]', form).forEach(function (group) {
      var target = form.querySelector('input[type="hidden"][name="' + group.getAttribute('data-multi') + '"]');
      var sync = function () {
        if (!target) return;
        target.value = $$('input[type="checkbox"]:checked', group).map(function (c) { return c.value; }).join(', ');
      };
      group.addEventListener('change', sync);
      sync();
    });
    var setHidden = function (name, value) {
      var el = form.querySelector('input[type="hidden"][name="' + name + '"]');
      if (el && value) el.value = value;
    };
    setHidden('seite', location.pathname);
    utmKeys.forEach(function (k) { setHidden(k, params.get(k)); });

    // the platform handler writes its loading/error texts in Italian: show them in German
    var dict = {
      'Invio in corso...': 'Wird gesendet …',
      'Errore di rete. Riprova più tardi.': 'Netzwerkfehler – bitte versuchen Sie es in einem Moment erneut.',
      "Errore durante l'invio. Riprova.": 'Beim Senden ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
      'Nessun campo compilato.': 'Bitte füllen Sie die Pflichtfelder aus.',
      'Errore di configurazione. Riprova più tardi.': 'Technischer Fehler – bitte versuchen Sie es später erneut.'
    };
    var submit = form.querySelector('[type="submit"]');
    var thanks = document.getElementById('t-thanks');
    var translate = function () {
      if (submit && dict[submit.textContent.trim()]) submit.textContent = dict[submit.textContent.trim()];
      $$('.aicms-form-message', form).forEach(function (m) {
        var txt = m.textContent.trim();
        var ok = /46,\s*125,\s*50|2e7d32/i.test(m.getAttribute('style') || '');
        if (ok) {
          m.remove();
          if (thanks) {
            form.style.display = 'none';
            thanks.classList.add('is-visible');
            thanks.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
          }
        } else if (dict[txt]) {
          m.textContent = dict[txt];
        }
      });
    };
    new MutationObserver(translate).observe(form, { childList: true, subtree: true, characterData: true });
  }
})();
