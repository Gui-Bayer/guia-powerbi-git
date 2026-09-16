/* ==========================================================================
   Guia Power BI + Git + GitHub + VS Code
   JavaScript puro, sem dependencias externas.
   ========================================================================== */
(function () {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const STORE = {
    theme: 'guia-pbip:theme',
    check: 'guia-pbip:checklist'
  };

  /* ---------------------------------------------------------------- tema -- */
  const html = document.documentElement;

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    const btn = $('#themeToggle');
    if (btn) {
      const dark = theme === 'dark';
      btn.innerHTML = '<i class="fa-solid fa-' + (dark ? 'sun' : 'moon') + '"></i>';
      btn.setAttribute('aria-label', dark ? 'Ativar tema claro' : 'Ativar tema escuro');
      btn.title = dark ? 'Tema claro' : 'Tema escuro';
    }
  }

  function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem(STORE.theme); } catch (e) { /* storage bloqueado */ }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved || (prefersDark ? 'dark' : 'light'));

    const toggle = $('#themeToggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        try { localStorage.setItem(STORE.theme, next); } catch (e) { /* ignora */ }
      });
    }
  }

  /* ----------------------------------------------- copiar comandos -------- */
  // Monta o texto copiavel: descarta o prompt e a saida do terminal,
  // deixando apenas os comandos que o leitor precisa executar.
  function copyableText(block) {
    const explicit = block.getAttribute('data-copy');
    if (explicit) return explicit;

    const clone = block.querySelector('code').cloneNode(true);
    clone.querySelectorAll('.t-prompt, .t-out').forEach(n => n.remove());
    return clone.textContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line !== '')
      .join('\n');
  }

  function initCopyButtons() {
    $$('.code').forEach(block => {
      if (block.classList.contains('code--nocopy')) return;
      if (!block.querySelector('code')) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'code__copy';
      btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copiar';
      btn.setAttribute('aria-label', 'Copiar comando');

      btn.addEventListener('click', async () => {
        const text = copyableText(block);
        try {
          await navigator.clipboard.writeText(text);
        } catch (e) {
          // Fallback para contextos sem Clipboard API (por exemplo, file://)
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
        }
        btn.classList.add('is-done');
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Copiado!';
        setTimeout(() => {
          btn.classList.remove('is-done');
          btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copiar';
        }, 1800);
      });

      block.appendChild(btn);
    });
  }

  /* --------------------------------------------------------- navegacao ---- */
  function initSidebar() {
    const sidebar  = $('#sidebar');
    const backdrop = $('#backdrop');
    const toggle   = $('#menuToggle');
    if (!sidebar) return;

    const sync = () => {
      const open = sidebar.classList.contains('is-open');
      if (backdrop) backdrop.classList.toggle('is-on', open);
      if (toggle) toggle.setAttribute('aria-expanded', String(open));
    };

    const close = () => {
      sidebar.classList.remove('is-open');
      sync();
    };

    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.addEventListener('click', () => {
        sidebar.classList.toggle('is-open');
        sync();
      });
    }
    if (backdrop) backdrop.addEventListener('click', close);
    $$('.nav__link').forEach(a => a.addEventListener('click', () => {
      if (window.innerWidth <= 900) close();
    }));
    window.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  /* --------------------------------------------- scroll-spy + progresso -- */
  function initScrollSpy() {
    const sections = $$('.section');
    const links = new Map($$('.nav__link').map(a => [a.getAttribute('href').slice(1), a]));
    const fill  = $('#readProgress');
    const label = $('#readLabel');
    const sidebar = $('#sidebar');
    if (!sections.length) return;

    let current = '';

    function setActive(id) {
      if (id === current) return;
      current = id;
      links.forEach(a => a.classList.remove('is-active'));

      const active = links.get(id);
      if (active && sidebar) {
        active.classList.add('is-active');
        const box = active.getBoundingClientRect();
        const wrap = sidebar.getBoundingClientRect();
        if (box.top < wrap.top + 60 || box.bottom > wrap.bottom - 60) {
          active.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }

      const index = sections.findIndex(s => s.id === id);
      if (index >= 0 && fill) {
        const pct = Math.round(((index + 1) / sections.length) * 100);
        fill.style.width = pct + '%';
        if (label) label.textContent = pct + '%';
      }
    }

    const observer = new IntersectionObserver(entries => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) setActive(visible[0].target.id);
    }, { rootMargin: '-15% 0px -70% 0px', threshold: [0, .1, .5, 1] });

    sections.forEach(s => observer.observe(s));
  }

  /* ------------------------------------------------------------- busca ---- */
  function normalize(str) {
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function buildIndex() {
    return $$('.section').map(section => {
      const heading = $('h1, h2', section);
      const title = heading ? heading.textContent.replace('#', '').trim() : section.id;
      const label = section.dataset.label || title;

      // Corpo + comandos, para a busca encontrar termos como "git rebase".
      const body = $$('p, li, h3, h4, td, .code__body, .tl__title, .flow__node b', section)
        .map(n => n.textContent)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      const haystack = label + ' ' + title + ' ' + body + ' ' + (section.dataset.keywords || '');

      return {
        id: section.id,
        label,
        icon: section.dataset.icon || 'fa-solid fa-hashtag',
        body,
        norm: normalize(haystack)
      };
    });
  }

  function initSearch() {
    const input   = $('#searchInput');
    const results = $('#searchResults');
    if (!input || !results) return;

    const index = buildIndex();
    let cursor = -1;

    function escapeHtml(str) {
      return str.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    }

    function snippet(item, query) {
      const pos = normalize(item.body).indexOf(query);
      if (pos < 0) return escapeHtml(item.body.slice(0, 96)) + '...';
      const start = Math.max(0, pos - 38);
      const safe = escapeHtml(item.body.slice(start, start + 116));
      const re = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      return (start > 0 ? '...' : '') + safe.replace(re, '<mark>$1</mark>') + '...';
    }

    function close() {
      results.classList.remove('is-open');
      results.innerHTML = '';
      cursor = -1;
    }

    function render(raw) {
      const q = normalize(raw.trim());
      if (q.length < 2) { close(); return; }

      const hits = index.filter(item => item.norm.includes(q)).slice(0, 8);
      cursor = -1;

      results.innerHTML = hits.length
        ? hits.map(item =>
            '<a class="search__hit" href="#' + item.id + '">' +
              '<span class="search__hit-title"><i class="' + item.icon + '"></i>' + item.label + '</span>' +
              '<span class="search__hit-ctx">' + snippet(item, q) + '</span>' +
            '</a>').join('')
        : '<p class="search__empty">Nenhum resultado para "<b>' + escapeHtml(raw) + '</b>".<br>' +
          'Tente <code>commit</code>, <code>branch</code>, <code>pbip</code> ou <code>conflito</code>.</p>';

      results.classList.add('is-open');
    }

    function move(delta) {
      const items = $$('.search__hit', results);
      if (!items.length) return;
      cursor = (cursor + delta + items.length) % items.length;
      items.forEach((el, i) => el.classList.toggle('is-active', i === cursor));
      items[cursor].scrollIntoView({ block: 'nearest' });
    }

    input.addEventListener('input', () => render(input.value));
    input.addEventListener('focus', () => { if (input.value.trim().length >= 2) render(input.value); });

    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') {
        const items = $$('.search__hit', results);
        const target = items[cursor >= 0 ? cursor : 0];
        if (target) { e.preventDefault(); target.click(); }
      } else if (e.key === 'Escape') { input.blur(); close(); }
    });

    results.addEventListener('click', e => {
      if (e.target.closest('.search__hit')) { close(); input.blur(); }
    });

    document.addEventListener('click', e => {
      if (!e.target.closest('.search')) close();
    });

    // Ctrl+K / Cmd+K e "/" abrem a busca
    window.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); input.focus(); input.select();
      } else if (e.key === '/' && document.activeElement !== input &&
                 !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
        e.preventDefault(); input.focus();
      }
    });
  }

  /* --------------------------------------------------------- checklist ---- */
  function initChecklist() {
    const boxes = $$('.check input[type="checkbox"]');
    if (!boxes.length) return;

    const fill  = $('#checkProgress');
    const count = $('#checkCount');
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(STORE.check) || '{}'); } catch (e) { saved = {}; }

    function update() {
      const done = boxes.filter(b => b.checked).length;
      const pct = Math.round((done / boxes.length) * 100);
      if (fill) fill.style.width = pct + '%';
      if (count) count.textContent = done + ' de ' + boxes.length + ' concluídos';
    }

    function persist() {
      const state = {};
      boxes.forEach(b => { state[b.id] = b.checked; });
      try { localStorage.setItem(STORE.check, JSON.stringify(state)); } catch (e) { /* ignora */ }
    }

    boxes.forEach(box => {
      if (saved[box.id]) box.checked = true;
      box.addEventListener('change', () => { persist(); update(); });
    });

    const reset = $('#checkReset');
    if (reset) {
      reset.addEventListener('click', () => {
        boxes.forEach(b => { b.checked = false; });
        persist(); update();
      });
    }

    update();
  }

  /* ------------------------------------------------ fluxogramas interativos */
  function initFlows() {
    $$('.flow').forEach(flow => {
      const detail = $('.flow__detail', flow);
      const nodes = $$('.flow__node', flow);
      if (!detail || !nodes.length) return;

      const show = node => {
        nodes.forEach(n => n.classList.toggle('is-on', n === node));
        detail.innerHTML = node.dataset.detail || '';
      };

      nodes.forEach(node => {
        node.setAttribute('tabindex', '0');
        node.setAttribute('role', 'button');
        node.addEventListener('click', () => show(node));
        node.addEventListener('mouseenter', () => show(node));
        node.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(node); }
        });
      });

      show(nodes[0]);
    });
  }

  /* ------------------------------------------------- animações de entrada - */
  function initReveal() {
    const items = $$('.reveal');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('is-in'));
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });

    items.forEach(el => observer.observe(el));
  }

  /* ------------------------------------------------------- voltar ao topo - */
  function initToTop() {
    const btn = $('#toTop');
    if (!btn) return;
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    window.addEventListener('scroll', () => {
      btn.classList.toggle('is-on', window.scrollY > 600);
    }, { passive: true });
  }

  /* ------------------------------------------- links externos em nova aba - */
  function initExternalLinks() {
    $$('a[href^="http"]').forEach(a => {
      if (a.hostname !== window.location.hostname) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
    });
  }

  /* ----------------------------------------------------- âncoras em títulos */
  function initAnchors() {
    $$('.section h2[id], .section h3[id]').forEach(h => {
      const a = document.createElement('a');
      a.className = 'anchor';
      a.href = '#' + h.id;
      a.innerHTML = '<i class="fa-solid fa-link"></i>';
      a.setAttribute('aria-label', 'Link para esta seção');
      h.appendChild(a);
    });
  }

  /* ------------------------------------------------------------- arranque - */
  function boot() {
    initTheme();
    initCopyButtons();
    initSidebar();
    initScrollSpy();
    initSearch();
    initChecklist();
    initFlows();
    initReveal();
    initToTop();
    initExternalLinks();
    initAnchors();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
