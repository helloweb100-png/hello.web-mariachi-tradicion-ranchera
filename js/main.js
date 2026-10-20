/* ==========================================================================
   MARIACHI TRADICIÓN RANCHERA | Comportamiento y animaciones
   Dependencias (CDN, ver index.html): GSAP 3 + ScrollTrigger + Lenis.
   Si alguna no carga, la página sigue funcionando sin animaciones.
   Sin window.addEventListener('scroll'): todo va por ScrollTrigger / IntersectionObserver.
   ========================================================================== */
(() => {
  'use strict';

  /* ------------------------------------------------------------------
     CONFIGURACIÓN: cambia aquí los datos de contacto
  ------------------------------------------------------------------ */
  const CONFIG = {
    whatsapp: '525611678708',          // WhatsApp de contrataciones (52 + 10 dígitos)
    defaultMsg: 'Hola, quiero información del mariachi.',
  };

  /* ------------------------------------------------------------------
     UTILIDADES
  ------------------------------------------------------------------ */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const root = document.documentElement;

  const reduceMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduceMotion = reduceMotionMQ.matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  const waUrl = (msg) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;

  /** Envuelve cada palabra en máscaras para revelarlas hacia arriba (conserva <em>). */
  function splitWords(el, { mask = true } = {}) {
    if (el.dataset.split === 'done') return $$(mask ? '.wi' : '.mw', el);
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const inner = document.createElement('span');
            inner.textContent = part;
            if (mask) {
              const outer = document.createElement('span');
              outer.className = 'w';
              inner.className = 'wi';
              outer.appendChild(inner);
              frag.appendChild(outer);
            } else {
              inner.className = 'mw';
              frag.appendChild(inner);
            }
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      });
    };
    walk(el);
    el.dataset.split = 'done';
    return $$(mask ? '.wi' : '.mw', el);
  }

  /* ------------------------------------------------------------------
     ENLACES DE WHATSAPP (un solo lugar para el número y los mensajes)
  ------------------------------------------------------------------ */
  function wireWhatsApp() {
    $$('a[data-wa]').forEach((a) => {
      a.href = waUrl(a.dataset.msg || CONFIG.defaultMsg);
    });
    $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
  }

  /* ------------------------------------------------------------------
     SCROLL SUAVE (Lenis) + ANCLAS
  ------------------------------------------------------------------ */
  let lenis = null;

  function initSmoothScroll() {
    if (reduceMotion || typeof window.Lenis === 'undefined') return;
    lenis = new window.Lenis({
      duration: 1.35,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 0.9,
      touchMultiplier: 1.3,
    });
    lenis.on('scroll', window.ScrollTrigger.update);
    window.gsap.ticker.add((time) => lenis.raf(time * 1000));
    window.gsap.ticker.lagSmoothing(0);
    lenis.stop(); // se libera cuando termina el loader
  }

  function scrollToTarget(target) {
    if (lenis) {
      lenis.scrollTo(target, { duration: 1.7, easing: (t) => 1 - Math.pow(1 - t, 4) });
    } else {
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
  }

  function initAnchors(closeMenu) {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const id = link.getAttribute('href');
      if (id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      scrollToTarget(id === '#inicio' ? document.body : target);
      history.replaceState(null, '', id);
    });
  }

  /* ------------------------------------------------------------------
     MENÚ MÓVIL
  ------------------------------------------------------------------ */
  const menuState = { open: false };

  function initMenu() {
    const burger = $('[data-burger]');
    const menu = $('#menu');
    if (!burger || !menu) return () => {};
    const header = $('[data-header]');
    const origin = 'calc(100% - 2.6rem) 2.3rem';

    const setOpen = (open) => {
      if (menuState.open === open) return;
      menuState.open = open;
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      root.classList.toggle('menu-open', open);
      header.classList.remove('is-hidden');

      if (open) {
        menu.hidden = false;
        if (lenis) lenis.stop();
        if (hasGSAP && !reduceMotion) {
          window.gsap.fromTo(menu, { clipPath: `circle(0% at ${origin})` }, { clipPath: `circle(150% at ${origin})`, duration: 0.9, ease: 'power3.inOut' });
          window.gsap.from('.menu__nav li', { y: 46, opacity: 0, duration: 1, stagger: 0.07, ease: 'expo.out', delay: 0.3 });
          window.gsap.from('.menu__foot', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', delay: 0.55 });
        }
        const first = $('[data-menu-link]', menu);
        if (first) setTimeout(() => first.focus({ preventScroll: true }), 80);
      } else {
        if (lenis) lenis.start(); // se libera ya: el enlace pulsado necesita poder desplazar la página
        const done = () => { menu.hidden = true; menu.style.clipPath = ''; };
        if (hasGSAP && !reduceMotion) {
          window.gsap.to(menu, { clipPath: `circle(0% at ${origin})`, duration: 0.6, ease: 'power3.inOut', onComplete: done });
        } else {
          done();
        }
        burger.focus({ preventScroll: true });
      }
    };

    burger.addEventListener('click', () => setOpen(!menuState.open));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuState.open) setOpen(false); });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
    return () => setOpen(false);
  }

  /* ------------------------------------------------------------------
     HEADER, PROGRESO Y BOTÓN FLOTANTE
  ------------------------------------------------------------------ */
  function initChrome() {
    const header = $('[data-header]');
    const float = $('[data-wa-float]');
    const contact = $('#contacto');
    let scrolled = false;
    let contactInView = false;

    const updateFloat = () => float && float.classList.toggle('is-visible', scrolled && !contactInView);

    if (contact && 'IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => { contactInView = entry.isIntersecting; updateFloat(); }, { threshold: 0.2 }).observe(contact);
    }

    if (!hasGSAP) {
      // Sin GSAP: cabecera sólida cuando se sale del tope, botón flotante siempre visible
      const sentinel = document.createElement('i');
      sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:60px;pointer-events:none';
      document.body.prepend(sentinel);
      new IntersectionObserver(([entry]) => {
        header.classList.toggle('is-solid', !entry.isIntersecting);
        scrolled = !entry.isIntersecting; updateFloat();
      }).observe(sentinel);
      return;
    }

    window.ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const y = self.scroll();
        header.classList.toggle('is-solid', y > 40);
        header.classList.toggle('is-hidden', self.direction === 1 && y > 520 && !menuState.open);
        const next = y > 280;
        if (next !== scrolled) { scrolled = next; updateFloat(); }
      },
    });

    window.gsap.to('[data-progress]', {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.15 },
    });
  }

  /* ------------------------------------------------------------------
     LOADER: anillo de progreso real (fuentes, recursos, imagen del hero)
  ------------------------------------------------------------------ */
  function runLoader() {
    const loader = $('#loader');
    return new Promise((resolve) => {
      if (!loader) { root.classList.remove('is-loading'); resolve(); return; }

      const count = $('[data-loader-count]', loader);
      const arc = $('.loader__arc', loader);
      const curtains = $$('.loader__curtain', loader);
      const core = $('.loader__core', loader);
      const state = { p: 0 };
      const paint = () => {
        count.textContent = String(Math.round(state.p)).padStart(2, '0');
        arc.style.strokeDashoffset = String(100 - state.p);
      };

      const finish = () => {
        root.classList.remove('is-loading');
        loader.remove();
      };

      if (!hasGSAP) {
        window.addEventListener('load', () => { state.p = 100; paint(); setTimeout(() => { finish(); resolve(); }, 300); }, { once: true });
        return;
      }

      const g = window.gsap;
      const MIN_TIME = reduceMotion ? 300 : 1900;
      const started = performance.now();
      const heroImg = $('.hero__kb img');
      const waits = [
        new Promise((r) => (document.readyState === 'complete' ? r() : window.addEventListener('load', r, { once: true }))),
        document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
        heroImg && heroImg.decode ? heroImg.decode().catch(() => {}) : Promise.resolve(),
      ];
      const ready = Promise.race([Promise.all(waits), new Promise((r) => setTimeout(r, 6500))]);

      // Progreso simulado hasta 88 % mientras carga lo real
      const crawl = g.to(state, { p: 88, duration: 2.6, ease: 'power2.out', onUpdate: paint });

      ready.then(() => {
        const wait = Math.max(0, MIN_TIME - (performance.now() - started));
        setTimeout(() => {
          crawl.kill();
          g.to(state, {
            p: 100, duration: 0.55, ease: 'power1.inOut', onUpdate: paint,
            onComplete: () => {
              if (reduceMotion) {
                g.to(loader, { opacity: 0, duration: 0.4, onComplete: () => { finish(); resolve(); } });
                return;
              }
              // Salida: el logo se disuelve y el telón se abre
              const tl = g.timeline({ onComplete: finish });
              tl.to(core, { scale: 0.86, opacity: 0, duration: 0.6, ease: 'power3.in' })
                .to(curtains[0], { xPercent: -101, duration: 1.25, ease: 'expo.inOut' }, 0.35)
                .to(curtains[1], { xPercent: 101, duration: 1.25, ease: 'expo.inOut' }, 0.35)
                .call(resolve, null, 0.75);
            },
          });
        }, wait);
      });
    });
  }

  /* ------------------------------------------------------------------
     HERO: entrada coreografiada, parallax y brasas de luz
  ------------------------------------------------------------------ */
  function buildHeroIntro() {
    const g = window.gsap;
    const words = splitWords($('[data-hero-title]'));
    g.set(words, { yPercent: 118 });

    const tl = g.timeline({ paused: true, defaults: { ease: 'expo.out' } });
    tl.from('[data-hero-media]', { scale: 1.28, duration: 2.6, ease: 'power3.out' }, 0)
      .from('.hero__beams', { opacity: 0, duration: 2.4, ease: 'power2.out' }, 0.2)
      .from('.site-header', { yPercent: -100, opacity: 0, duration: 1.2, clearProps: 'transform,opacity' }, 0.5)
      .from('[data-hero-eyebrow]', { y: 22, opacity: 0, duration: 1.1 }, 0.4)
      .to(words, { yPercent: 0, duration: 1.4, stagger: 0.075 }, 0.5)
      .from('[data-hero-lead]', { y: 26, opacity: 0, duration: 1.2 }, 1.05)
      .from('[data-hero-actions] > *', { y: 30, opacity: 0, duration: 1.1, stagger: 0.12 }, 1.2)
      .from('[data-hero-badge]', { scale: 0.5, opacity: 0, duration: 1.8 }, 1.3);
    return tl;
  }

  function initHeroScroll() {
    const g = window.gsap;
    const hero = $('[data-hero]');
    if (!hero || reduceMotion) return;
    g.to('[data-hero-media]', { yPercent: 16, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    g.to('[data-hero-content]', { yPercent: -14, opacity: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '72% top', scrub: true } });
    g.to('[data-hero-badge]', { yPercent: -70, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '60% top', scrub: true } });
  }

  function initEmbers() {
    const canvas = $('[data-embers]');
    if (!canvas || reduceMotion) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sprite precalculado: evita sombras/blur por partícula
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 64;
    const sctx = sprite.getContext('2d');
    const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 238, 190, 1)');
    grad.addColorStop(0.25, 'rgba(236, 208, 138, .55)');
    grad.addColorStop(1, 'rgba(201, 162, 74, 0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 64, 64);

    let w = 0, h = 0, parts = [], raf = 0, visible = true;
    const spawn = (anywhere) => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 24,
      size: 7 + Math.random() * 20,
      vy: 0.14 + Math.random() * 0.42,
      drift: 0.15 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.5 + Math.random() * 0.5,
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(64, Math.max(24, (w * h) / 24000)));
      parts = Array.from({ length: count }, () => spawn(true));
    };

    const frame = (t) => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const p of parts) {
        p.y -= p.vy;
        p.x += Math.sin(t / 1600 + p.phase) * p.drift * 0.35;
        if (p.y < -30) Object.assign(p, spawn(false));
        const twinkle = 0.55 + 0.45 * Math.sin(t / 520 + p.phase);
        ctx.globalAlpha = p.alpha * twinkle;
        ctx.drawImage(sprite, p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      raf = requestAnimationFrame(frame);
    };

    const start = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };

    resize();
    new ResizeObserver(resize).observe(canvas);
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; visible ? start() : stop(); }).observe(canvas);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    start();
  }

  /* ------------------------------------------------------------------
     MARQUEE: corre solo y reacciona a la velocidad del scroll
  ------------------------------------------------------------------ */
  function initMarquee() {
    const track = $('[data-marquee-track]');
    if (!track || reduceMotion) return;
    const g = window.gsap;
    const tween = g.to(track, { xPercent: -50, ease: 'none', duration: 40, repeat: -1 });
    let vel = 0, dir = 1, ts = 1;
    window.ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (self) => { vel = Math.abs(self.getVelocity()); dir = self.direction || dir; },
    });
    g.ticker.add(() => {
      const target = dir * (1 + Math.min(vel / 260, 8));
      ts += (target - ts) * 0.07;
      tween.timeScale(ts);
      vel *= 0.9;
    });
  }

  /* ------------------------------------------------------------------
     REVELACIONES GENÉRICAS
  ------------------------------------------------------------------ */
  function initReveals() {
    const g = window.gsap;
    const ST = window.ScrollTrigger;

    // Movimiento reducido: todo el contenido queda visible y quieto
    if (reduceMotion) return;

    // Titulares: palabras que suben desde una máscara
    $$('[data-split]').forEach((el) => {
      const words = splitWords(el);
      g.set(words, { yPercent: 118 });
      ST.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => g.to(words, { yPercent: 0, duration: 1.3, stagger: 0.06, ease: 'expo.out' }),
      });
    });

    // Manifiesto: las palabras se encienden al avanzar la lectura
    const manifesto = $('[data-words]');
    if (manifesto) {
      const words = splitWords(manifesto, { mask: false });
      g.fromTo(words, { opacity: 0.2 }, {
        opacity: 1, ease: 'none', stagger: { each: 0.1 }, duration: 0.3,
        scrollTrigger: { trigger: manifesto, start: 'top 82%', end: 'bottom 48%', scrub: 0.6 },
      });
    }

    // Contadores
    $$('[data-count]').forEach((el) => {
      const end = parseFloat(el.dataset.count);
      const decimals = Number(el.dataset.decimals || 0);
      const obj = { v: 0 };
      el.textContent = (0).toFixed(decimals);
      ST.create({
        trigger: el, start: 'top 92%', once: true,
        onEnter: () => g.to(obj, { v: end, duration: 2.2, ease: 'power2.out', onUpdate: () => { el.textContent = obj.v.toFixed(decimals); } }),
      });
    });

    // Grupos con entrada escalonada
    $$('[data-stagger]').forEach((group) => {
      g.from(group.children, {
        y: 40, opacity: 0, duration: 1.1, stagger: 0.1, ease: 'expo.out',
        scrollTrigger: { trigger: group, start: 'top 86%', once: true },
      });
    });

    // Elementos sueltos: aparecen con un leve ascenso
    const singles = '.eyebrow:not(.hero__eyebrow), .lead, .videos__cta, .process__cta, .zone__note, .zone__copy .btn, .faq__intro .btn, ' +
      '.contact__list li, .form-card, .faq__list details, .footer__grid > *, .repertoire__intro .tabs, .repertoire__panels';
    g.set(singles, { opacity: 0, y: 32 });
    ST.batch(singles, {
      start: 'top 92%', once: true,
      onEnter: (els) => g.to(els, { opacity: 1, y: 0, duration: 1.2, stagger: 0.09, ease: 'expo.out', overwrite: true }),
    });

    // Tarjetas de servicio
    g.from('.svc', {
      y: 70, opacity: 0, duration: 1.3, stagger: 0.12, ease: 'expo.out',
      scrollTrigger: { trigger: '.services', start: 'top 70%', once: true },
    });

    // Fondo del contacto con parallax
    g.fromTo('.contact__bg img', { yPercent: -6 }, {
      yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom top', scrub: true },
    });

    // Marca de agua del pie
    g.from('[data-wordmark] span', {
      yPercent: 70, opacity: 0, duration: 1.6, stagger: 0.18, ease: 'expo.out',
      scrollTrigger: { trigger: '[data-wordmark]', start: 'top 94%', once: true },
    });
  }

  /* ------------------------------------------------------------------
     SECCIONES CON SCROLL FIJADO (se adaptan con matchMedia)
  ------------------------------------------------------------------ */
  function initPinnedSections() {
    const g = window.gsap;
    const mm = g.matchMedia();

    // Imagen que se abre a pantalla completa
    mm.add({ desktop: '(min-width: 900px)', mobile: '(max-width: 899.98px)', reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => {
      const { desktop, reduce } = ctx.conditions;
      if (reduce) return;
      const pin = $('[data-expand]');
      const frame = $('[data-expand-frame]');
      const img = $('img', frame);
      const title = $('[data-expand-title]');
      const copy = $('[data-expand-copy]');
      const veil = $('.expand__veil', frame);
      if (!pin || !frame) return;

      const startClip = desktop
        ? 'inset(25% 31% 9% 31% round 230px 230px 22px 22px)'
        : 'inset(33% 9% 16% 9% round 150px 150px 18px 18px)';
      const endClip = 'inset(0% 0% 0% 0% round 0px 0px 0px 0px)';

      g.set(copy.children, { y: 50, autoAlpha: 0 });
      g.set(veil, { opacity: 0 });

      const tl = g.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: pin, start: 'top top', end: '+=170%', pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true },
      });
      tl.fromTo(frame, { clipPath: startClip }, { clipPath: endClip, ease: 'power2.inOut', duration: 1 }, 0)
        .fromTo(img, { scale: desktop ? 1.15 : 1.12, y: desktop ? 90 : 140 }, { scale: 1.02, y: 0, ease: 'power1.out', duration: 1 }, 0)
        .to(title, { yPercent: -45, autoAlpha: 0, duration: 0.45 }, 0.04)
        .to(veil, { opacity: 1, duration: 0.4 }, 0.55)
        .to(copy.children, { y: 0, autoAlpha: 1, stagger: 0.12, duration: 0.3, ease: 'power2.out' }, 0.64);
      // En móvil la foto es muy panorámica: se recorre de izquierda a derecha
      if (!desktop) tl.fromTo(img, { objectPosition: '16% 40%' }, { objectPosition: '84% 40%', duration: 1 }, 0);
    });

    // Servicios: paneo horizontal mientras la sección queda fija (escritorio)
    mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
      const pin = $('[data-services]');
      const viewport = $('[data-services-viewport]');
      const track = $('[data-services-track]');
      if (!pin || !viewport || !track) return;
      const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
      g.to(track, {
        x: () => -distance(), ease: 'none',
        scrollTrigger: { trigger: pin, start: 'top top', end: () => `+=${Math.round(distance() * 1.15)}`, pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true },
      });
    });

    // Proceso: la línea de oro se dibuja con el scroll y enciende cada paso
    mm.add({ desktop: '(min-width: 900px)', mobile: '(max-width: 899.98px)' }, (ctx) => {
      const { desktop } = ctx.conditions;
      const wrap = $('[data-steps]');
      const fill = $('[data-steps-fill]');
      const steps = $$('.step', wrap);
      const nodes = $$('.step__node', wrap);
      const rail = $('.steps__rail', wrap);
      if (!wrap || !fill) return;

      let marks = [];
      const measure = () => {
        const rb = rail.getBoundingClientRect();
        marks = nodes.map((n) => {
          const r = n.getBoundingClientRect();
          return desktop ? (r.left + r.width / 2 - rb.left) / rb.width : (r.top + r.height / 2 - rb.top) / rb.height;
        });
      };
      const prop = desktop ? 'scaleX' : 'scaleY';
      g.set(fill, { scaleX: desktop ? 0 : 1, scaleY: desktop ? 1 : 0 });
      if (reduceMotion) { g.set(fill, { [prop]: 1 }); steps.forEach((s) => s.classList.add('is-active')); return; }

      window.ScrollTrigger.create({
        trigger: wrap,
        start: desktop ? 'top 78%' : 'top 70%',
        end: desktop ? 'top 28%' : 'bottom 62%',
        scrub: true,
        onRefresh: measure,
        onUpdate: (self) => {
          const p = self.progress;
          g.set(fill, { [prop]: p });
          steps.forEach((s, i) => s.classList.toggle('is-active', p >= (marks[i] ?? i / steps.length) - 0.01));
        },
      });
      return () => steps.forEach((s) => s.classList.remove('is-active'));
    });
  }

  /* ------------------------------------------------------------------
     REPERTORIO: pestañas accesibles (flechas, Inicio, Fin)
  ------------------------------------------------------------------ */
  function initTabs() {
    const list = $('[data-tabs]');
    if (!list) return;
    const tabs = $$('[role="tab"]', list);
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));

    const activate = (tab, { focus = false } = {}) => {
      tabs.forEach((t, i) => {
        const on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panels[i].classList.toggle('is-active', on);
        panels[i].hidden = !on;
      });
      if (focus) tab.focus();
      const panel = panels[tabs.indexOf(tab)];
      if (hasGSAP && !reduceMotion) {
        window.gsap.fromTo($$('.panel__note, .songs li', panel), { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.06, ease: 'expo.out', overwrite: true });
      }
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => activate(tab));
      tab.addEventListener('keydown', (e) => {
        const last = tabs.length - 1;
        let next = null;
        if (e.key === 'ArrowRight') next = tabs[i === last ? 0 : i + 1];
        if (e.key === 'ArrowLeft') next = tabs[i === 0 ? last : i - 1];
        if (e.key === 'Home') next = tabs[0];
        if (e.key === 'End') next = tabs[last];
        if (next) { e.preventDefault(); activate(next, { focus: true }); }
      });
    });
  }

  /* ------------------------------------------------------------------
     FAQ: acordeón exclusivo con altura animada (details/summary nativos)
  ------------------------------------------------------------------ */
  function initFaq() {
    const group = $('[data-faq]');
    if (!group || !hasGSAP || reduceMotion) return;
    const g = window.gsap;
    const items = $$('details', group);
    const refresh = () => window.ScrollTrigger.refresh();

    const open = (d) => {
      const panel = $('.faq__answer', d);
      d.open = true;
      g.fromTo(panel, { height: 0 }, { height: 'auto', duration: 0.7, ease: 'power3.out', onComplete: () => { panel.style.height = ''; refresh(); } });
    };
    const close = (d) => {
      const panel = $('.faq__answer', d);
      g.to(panel, { height: 0, duration: 0.5, ease: 'power3.inOut', onComplete: () => { d.open = false; panel.style.height = ''; refresh(); } });
    };

    items.forEach((d) => {
      $('summary', d).addEventListener('click', (e) => {
        e.preventDefault();
        if (g.isTweening($('.faq__answer', d))) return;
        if (d.open) { close(d); return; }
        items.filter((o) => o !== d && o.open).forEach(close);
        open(d);
      });
    });
  }

  /* ------------------------------------------------------------------
     VIDEOS: botón de play propio; al reproducir uno se pausan los demás.
     Sin JS (o si algo falla) quedan los controles nativos del <video>.
  ------------------------------------------------------------------ */
  function initVideos() {
    const cards = $$('[data-video]');
    if (!cards.length) return;
    const videos = cards.map((card) => $('video', card));

    cards.forEach((card, i) => {
      const video = videos[i];
      const play = $('.vid__play', card);
      if (!video || !play) return;

      video.controls = false;
      play.hidden = false;

      play.addEventListener('click', () => {
        video.controls = true;
        play.hidden = true;
        video.focus({ preventScroll: true });
        video.play().catch(() => { video.controls = false; play.hidden = false; });
      });

      video.addEventListener('play', () => {
        videos.forEach((other) => { if (other !== video) other.pause(); });
      });
    });
  }

  /* ------------------------------------------------------------------
     FORMULARIO: valida y envía el mensaje a WhatsApp
  ------------------------------------------------------------------ */
  function initForm() {
    const form = $('[data-wa-form]');
    if (!form) return;
    const success = $('[data-form-success]');
    const retry = $('[data-wa-retry]');
    const reset = $('[data-form-reset]');
    const submit = $('button[type="submit"]', form);

    const pad = (n) => String(n).padStart(2, '0');
    const today = new Date();
    form.elements.fecha.min = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    const rules = {
      nombre: (v) => (v.trim().length >= 2 ? '' : 'Escribe tu nombre para saber cómo llamarte.'),
      evento: (v) => (v ? '' : 'Elige el tipo de evento.'),
      lugar:  (v) => (v.trim().length >= 2 ? '' : 'Dinos el municipio o la colonia del evento.'),
    };

    const check = (name) => {
      const field = form.elements[name];
      const wrap = field.closest('.field');
      const error = $('.field__error', wrap);
      const message = rules[name](field.value);
      wrap.classList.toggle('has-error', Boolean(message));
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
      error.textContent = message;
      return !message;
    };

    Object.keys(rules).forEach((name) => {
      const field = form.elements[name];
      field.addEventListener('blur', () => check(name));
      field.addEventListener('input', () => { if (field.closest('.field').classList.contains('has-error')) check(name); });
    });

    const formatDate = (iso) => {
      if (!iso) return 'Por definir';
      const d = new Date(`${iso}T12:00:00`);
      return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const results = Object.keys(rules).map(check);
      if (results.includes(false)) {
        const firstBad = Object.keys(rules).find((n) => form.elements[n].getAttribute('aria-invalid') === 'true');
        form.elements[firstBad].focus();
        return;
      }

      const f = form.elements;
      const lines = [
        'Hola, quiero cotizar un mariachi para mi evento.',
        '',
        `Nombre: ${f.nombre.value.trim()}`,
        `Evento: ${f.evento.value}`,
        `Fecha: ${formatDate(f.fecha.value)}`,
        `Lugar: ${f.lugar.value.trim()}`,
      ];
      if (f.mensaje.value.trim()) lines.push(`Detalles: ${f.mensaje.value.trim()}`);
      const url = waUrl(lines.join('\n'));

      submit.classList.add('is-busy');
      $('.btn__label', submit).textContent = 'Abriendo WhatsApp';
      window.open(url, '_blank', 'noopener');

      retry.href = url;
      setTimeout(() => {
        form.hidden = true;
        success.hidden = false;
        if (hasGSAP && !reduceMotion) window.gsap.from(success.children, { y: 24, opacity: 0, duration: 1, stagger: 0.09, ease: 'expo.out' });
        submit.classList.remove('is-busy');
        $('.btn__label', submit).textContent = 'Estoy listo, enviar por WhatsApp';
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      }, 700);
    });

    reset.addEventListener('click', () => {
      form.reset();
      $$('.field', form).forEach((w) => w.classList.remove('has-error'));
      success.hidden = true;
      form.hidden = false;
      form.elements.nombre.focus();
    });
  }

  /* ------------------------------------------------------------------
     MICRO-INTERACCIONES (solo puntero fino y sin movimiento reducido)
  ------------------------------------------------------------------ */
  function initMagnetic() {
    if (!hasGSAP || !finePointer || reduceMotion) return;
    $$('[data-magnetic]').forEach((el) => {
      const xTo = window.gsap.quickTo(el, 'x', { duration: 0.7, ease: 'power3' });
      const yTo = window.gsap.quickTo(el, 'y', { duration: 0.7, ease: 'power3' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.4);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  function initSpotlight() {
    if (!finePointer) return;
    $$('[data-spot]').forEach((el) => {
      let raf = 0;
      el.addEventListener('pointermove', (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          const r = el.getBoundingClientRect();
          el.style.setProperty('--mx', `${e.clientX - r.left}px`);
          el.style.setProperty('--my', `${e.clientY - r.top}px`);
        });
      });
    });
  }

  /* ------------------------------------------------------------------
     ARRANQUE
  ------------------------------------------------------------------ */
  function boot() {
    wireWhatsApp();
    const closeMenu = initMenu();
    initTabs();
    initVideos();
    initForm();
    initSpotlight();

    if (!hasGSAP) {
      // Modo degradado: contenido visible, sin animaciones
      initChrome();
      initAnchors(closeMenu);
      runLoader().then(() => {});
      return;
    }

    const g = window.gsap;
    g.registerPlugin(window.ScrollTrigger);
    window.ScrollTrigger.config({ ignoreMobileResize: true });

    initSmoothScroll();
    initAnchors(closeMenu);
    initChrome();

    const intro = reduceMotion ? null : buildHeroIntro();
    initHeroScroll();
    initEmbers();
    initMarquee();
    initReveals();
    initPinnedSections();
    initFaq();

    runLoader().then(() => {
      if (lenis) lenis.start();
      if (intro) { intro.play(); intro.eventCallback('onComplete', initMagnetic); }
      window.ScrollTrigger.refresh();
    });

    window.addEventListener('load', () => window.ScrollTrigger.refresh());
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => window.ScrollTrigger.refresh());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
