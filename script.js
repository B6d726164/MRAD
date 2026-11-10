(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;

  /* Header, scroll progress, back-to-top ring */
  const header = $('[data-header]');
  const bar = $('[data-progress]');
  const toTop = $('[data-to-top]');
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, y / max) : 0;
    if (bar) bar.style.setProperty('--p', p);
    if (toTop) { toTop.style.setProperty('--p', p); toTop.classList.toggle('show', y > 600); }
    if (header) {
      header.classList.toggle('scrolled', y > 24);
      const navOpen = $('[data-nav]')?.classList.contains('open');
      header.classList.toggle('hide', !navOpen && y > 400 && y > lastY + 4);
      if (y < lastY - 4) header.classList.remove('hide');
    }
    lastY = y;
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Mobile menu */
  const toggle = $('[data-nav-toggle]');
  const nav = $('[data-nav]');
  if (toggle && nav) {
    const setOpen = (open) => { nav.classList.toggle('open', open); toggle.setAttribute('aria-expanded', String(open)); };
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  }

  /* Active section in nav */
  const spyLinks = $$('[data-spy]');
  if (spyLinks.length && 'IntersectionObserver' in window) {
    const map = new Map(spyLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          spyLinks.forEach((a) => a.classList.remove('is-current'));
          map.get(en.target.id)?.classList.add('is-current');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const el = document.getElementById(id); if (el) spy.observe(el); });
  }

  /* Reveal on scroll, with a small stagger for siblings */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        const sibs = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
        el.style.setProperty('--d', Math.min(sibs.indexOf(el), 5) * 0.07 + 's');
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  window.addEventListener('beforeprint', () => reveals.forEach((el) => el.classList.add('is-in')));

  /* Count-up numbers */
  const counters = $$('[data-count]');
  if (counters.length && !reduce && 'IntersectionObserver' in window) {
    const run = (el) => {
      const end = +el.dataset.count; const dur = 1400; const t0 = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(end * e); if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const co = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { run(en.target); co.unobserve(en.target); } }), { threshold: 0.6 });
    counters.forEach((el) => { el.textContent = '0'; co.observe(el); });
  }

  /* Rotating end of the headline */
  const rot = $('[data-rotator]');
  if (rot && !reduce) {
    const words = ['use every day.', 'rely on.', 'trust on site.', 'use every day.'];
    let i = 0;
    const span = rot.firstElementChild;
    setInterval(() => {
      rot.classList.remove('in'); rot.classList.add('out');
      setTimeout(() => {
        i = (i + 1) % (words.length - 1);
        span.textContent = words[i];
        rot.classList.remove('out'); rot.classList.add('in');
      }, 340);
    }, 3200);
  }

  /* Project filters with live counts */
  const filters = $('[data-filters]');
  const projects = $$('[data-work] .project');
  if (filters && projects.length) {
    const chips = $$('.chip', filters);
    chips.forEach((c) => {
      const f = c.dataset.filter;
      $('.n', c).textContent = f === 'all' ? projects.length : projects.filter((p) => p.dataset.cat === f).length;
    });
    filters.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip'); if (!chip) return;
      const f = chip.dataset.filter;
      chips.forEach((c) => { const on = c === chip; c.classList.toggle('is-active', on); c.setAttribute('aria-pressed', String(on)); });
      const apply = () => {
        let shown = 0;
        projects.forEach((p) => {
          const show = f === 'all' || p.dataset.cat === f;
          p.classList.toggle('is-hidden', !show);
          if (show) { shown++; p.classList.add('is-in'); }
        });
        const empty = $('[data-empty]'); if (empty) empty.hidden = shown > 0;
      };
      if (document.startViewTransition && !reduce) document.startViewTransition(apply); else apply();
    });
  }

  /* Expandable project details */
  $$('[data-more]').forEach((btn) => {
    const body = btn.nextElementSibling;
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      btn.querySelector('span').textContent = open ? 'Details' : 'Less';
      body.hidden = open;
    });
  });

  /* Cursor spotlight on cards */
  if (fine) {
    document.addEventListener('pointermove', (e) => {
      const el = e.target.closest('[data-spot]'); if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', e.clientX - r.left + 'px');
      el.style.setProperty('--my', e.clientY - r.top + 'px');
    }, { passive: true });
  }

  /* Subtle 3D tilt on the hero photo */
  const tilt = $('[data-tilt]');
  if (tilt && fine && !reduce) {
    tilt.addEventListener('pointermove', (e) => {
      const r = tilt.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5; const y = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = `perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
    });
    tilt.addEventListener('pointerleave', () => { tilt.style.transform = ''; });
  }

  /* Timeline line fills as you scroll */
  const tl = $('[data-timeline]');
  if (tl) {
    const items = $$('li', tl);
    const fill = () => {
      const r = tl.getBoundingClientRect(); const mid = window.innerHeight * 0.6;
      const k = Math.max(0, Math.min(1, (mid - r.top) / r.height));
      tl.style.setProperty('--fill', reduce ? 1 : k);
      items.forEach((li) => li.classList.toggle('lit', reduce || li.getBoundingClientRect().top + 30 < mid));
    };
    fill();
    window.addEventListener('scroll', fill, { passive: true });
    window.addEventListener('resize', fill);
  }

  /* Copy email + toast */
  const toast = $('[data-toast]');
  let tt;
  const say = (msg) => { if (!toast) return; toast.textContent = msg; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 2200); };
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); say('Email address copied'); }
    catch { say('Copy failed. Select the address and copy it manually.'); }
  }));

  /* Network canvas, like the STED hero: drifting nodes joined by lines */
  $$('[data-net]').forEach((cv) => {
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const soft = cv.dataset.net === 'soft';
    let w, h, dpr, nodes = [], raf, visible = true;
    const mouse = { x: -9999, y: -9999 };
    const size = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(soft ? 40 : 70, (w * h) / (soft ? 26000 : 16000)));
      nodes = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() < 0.15 ? 2.6 : 1.6, warm: Math.random() < 0.18
      }));
    };
    const LINK = soft ? 130 : 150;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        if (!reduce) {
          a.x += a.vx; a.y += a.vy;
          if (a.x < 0 || a.x > w) a.vx *= -1;
          if (a.y < 0 || a.y > h) a.vy *= -1;
          const dx = a.x - mouse.x, dy = a.y - mouse.y, d = Math.hypot(dx, dy);
          if (d < 120) { a.x += dx / d * 0.6; a.y += dy / d * 0.6; }
        }
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]; const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK) {
            const o = (1 - d / LINK) * (soft ? 0.22 : 0.32);
            ctx.strokeStyle = a.warm || b.warm ? `rgba(240,164,58,${o})` : `rgba(63,184,200,${o})`;
            ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      nodes.forEach((n) => {
        ctx.fillStyle = n.warm ? 'rgba(240,164,58,.9)' : 'rgba(63,184,200,.7)';
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      });
      if (!reduce && visible) raf = requestAnimationFrame(draw);
    };
    size(); draw();
    window.addEventListener('resize', () => { cancelAnimationFrame(raf); size(); draw(); });
    const host = cv.parentElement;
    host.addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; }, { passive: true });
    host.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => {
        const was = visible; visible = en.isIntersecting;
        if (visible && !was) { cancelAnimationFrame(raf); draw(); }
      }).observe(cv);
    }
  });

  /* Seamless ticker: duplicate the items once */
  const mq = $('[data-marquee]');
  if (mq && !reduce) {
    [...mq.children].forEach((c) => { const d = c.cloneNode(true); d.setAttribute('aria-hidden', 'true'); mq.appendChild(d); });
  }

  /* Riyadh local time */
  const clock = $('[data-clock]');
  if (clock) {
    const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Riyadh' });
    const tick = () => { clock.textContent = fmt.format(new Date()) + ' local time'; };
    tick(); setInterval(tick, 30000);
  }

  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
