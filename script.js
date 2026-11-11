/* ==========================================================================
   Cleso Host – Skript
   Keine externen Bibliotheken, keine Tracker.
   ========================================================================== */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- Hell/Dunkel-Modus ---------- */
  // Gespeichert wird nur, wenn der Nutzer selbst umschaltet (Schlüssel: cleso-theme).
  const KEY = 'cleso-theme';
  const sys = matchMedia('(prefers-color-scheme: dark)');
  let stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) { /* Speicher nicht verfügbar */ }

  const btn = $('#themeToggle');
  const label = () => {
    const dark = root.getAttribute('data-theme') === 'dark';
    const text = dark ? 'Zum hellen Modus wechseln' : 'Zum dunklen Modus wechseln';
    if (btn) { btn.setAttribute('aria-label', text); btn.title = text; btn.setAttribute('aria-pressed', String(dark)); }
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#08080b' : '#f6f6fa');
  };
  const apply = (t) => { root.setAttribute('data-theme', t); label(); };
  if (!root.getAttribute('data-theme')) apply(stored || (sys.matches ? 'dark' : 'light')); else label();

  if (btn) {
    btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      const r = btn.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      const change = () => { apply(next); try { localStorage.setItem(KEY, next); } catch (e) { /* ignorieren */ } stored = next; };
      if (document.startViewTransition && !reduced) {
        const t = document.startViewTransition(change);
        t.ready.then(() => {
          root.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
            { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)', pseudoElement: '::view-transition-new(root)' }
          );
        }).catch(() => {});
      } else change();
    });
  }
  sys.addEventListener && sys.addEventListener('change', (e) => { if (!stored) apply(e.matches ? 'dark' : 'light'); });

  /* ---------- Navigation ---------- */
  const nav = $('.nav');
  const bar = $('.progress');
  const onScroll = () => {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    if (nav) nav.classList.toggle('scrolled', y > 20);
    if (bar) bar.style.transform = `scaleX(${h > 0 ? Math.min(1, y / h) : 0})`;
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const menu = $('.menu-btn');
  if (menu && nav) {
    menu.addEventListener('click', () => { const o = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', String(o)); });
    $$('.nav-links a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
  }

  /* ---------- Hero-Überschrift Wort für Wort ---------- */
  $$('[data-words]').forEach(el => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
            const s = document.createElement('span'); s.className = 'word'; s.style.setProperty('--i', i++); s.textContent = part; frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
  });

  /* ---------- Einblend-Animationen beim Scrollen ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .15, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal, .steps').forEach(el => io.observe(el));

  /* ---------- Zähler ---------- */
  const counter = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, end = +el.dataset.count, suffix = el.dataset.suffix || '';
      if (reduced) { el.textContent = end + suffix; counter.unobserve(el); return; }
      const t0 = performance.now(), dur = 1400;
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
        el.textContent = v + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick); counter.unobserve(el);
    });
  }, { threshold: .6 });
  $$('[data-count]').forEach(el => counter.observe(el));

  /* ---------- Terminal-Animation ---------- */
  const term = $('#terminal');
  if (term) {
    const body = $('.term-body', term), status = $('.status', term);
    const script = [
      ['mut', '$ npm install'], ['mut', 'added 27 packages in 3s'], ['pk', '$ node index.js'],
      ['ok', '✓ Eingeloggt als MeinBot#1234'], ['ok', '✓ Bot ist bereit – läuft rund um die Uhr']
    ];
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    let running = false;
    async function play() {
      if (running) return; running = true;
      while (true) {
        body.innerHTML = ''; status.textContent = 'Startet …'; status.classList.remove('on');
        for (let i = 0; i < script.length; i++) {
          const [cls, txt] = script[i];
          const line = document.createElement('div'); line.className = 'ln ' + cls; body.appendChild(line);
          const caret = document.createElement('span'); caret.className = 'caret';
          for (let c = 0; c <= txt.length; c++) {
            line.textContent = txt.slice(0, c); line.appendChild(caret);
            await sleep(reduced ? 0 : (cls === 'mut' || cls === 'pk' ? 38 : 22));
          }
          caret.remove();
          if (i === 3) { status.textContent = 'Läuft'; status.classList.add('on'); }
          await sleep(reduced ? 0 : 420);
        }
        const end = document.createElement('div'); end.className = 'ln'; end.appendChild(Object.assign(document.createElement('span'), { className: 'caret' })); body.appendChild(end);
        await sleep(reduced ? 600000 : 4200);
      }
    }
    new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { play(); o.disconnect(); } }, { threshold: .3 }).observe(term);
  }

  /* ---------- Karten: Lichtschein + leichte 3D-Neigung ---------- */
  if (!reduced && matchMedia('(hover: hover)').matches) {
    $$('.card').forEach(card => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', (px * 100) + '%'); card.style.setProperty('--my', (py * 100) + '%');
        if (card.dataset.tilt !== 'off') card.style.transform = `perspective(900px) rotateX(${(.5 - py) * 6}deg) rotateY(${(px - .5) * 8}deg) translateY(-4px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  /* ---------- FAQ ---------- */
  $$('.faq-item').forEach(item => {
    const q = $('.faq-q', item), a = $('.faq-a', item);
    q.addEventListener('click', () => {
      const open = item.classList.toggle('open');
      q.setAttribute('aria-expanded', String(open));
      a.style.height = open ? a.scrollHeight + 'px' : '0px';
    });
  });

  /* ---------- Inhaltsverzeichnis (Rechtstexte) ---------- */
  const tocLinks = $$('.toc a');
  if (tocLinks.length) {
    const spy = new IntersectionObserver((es) => {
      es.forEach(e => { if (e.isIntersecting) tocLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id)); });
    }, { rootMargin: '-30% 0px -60% 0px' });
    $$('.prose section[id]').forEach(s => spy.observe(s));
  }

  /* ---------- Jahr im Footer ---------- */
  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
})();
