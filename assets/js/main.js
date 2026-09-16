/* ==========================================================================
   Guia Power BI + Git + GitHub + VS Code
   JavaScript puro, sem dependencias externas.

   Todo texto visivel ao usuario vem de assets/i18n/<idioma>.json.
   Este arquivo e mantido em ASCII de proposito: acentos e caracteres
   especiais ficam nos JSON de traducao, nunca no codigo.
   ========================================================================== */
(function () {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const STORE = {
    theme: 'guia-pbip:theme',
    check: 'guia-pbip:checklist',
    lang:  'guia-pbip:lang'
  };

  /* ---------------------------------------------------------------- i18n -- */
  const I18n = (function () {
    const SUPPORTED = ['pt-BR', 'en-US', 'es-MX'];
    const BASE = 'pt-BR';
    const SHORT = { 'pt-BR': 'PT', 'en-US': 'EN', 'es-MX': 'ES' };

    const cache = {};
    let current = BASE;
    let dict = {};
    let base = {};
    let ready = false;

    // Ordem de deteccao: ?lang= > preferencia salva > idioma do navegador.
    function detect() {
      let param = null;
      try { param = new URLSearchParams(window.location.search).get('lang'); } catch (e) { /* ignora */ }
      const fromParam = match(param);
      if (fromParam) return fromParam;

      let saved = null;
      try { saved = localStorage.getItem(STORE.lang); } catch (e) { /* storage bloqueado */ }
      const fromSaved = match(saved);
      if (fromSaved) return fromSaved;

      const prefs = navigator.languages && navigator.languages.length
        ? navigator.languages
        : [navigator.language || ''];
      for (let i = 0; i < prefs.length; i++) {
        const hit = match(prefs[i]);
        if (hit) return hit;
      }
      return BASE;
    }

    // Aceita 'en', 'en-GB', 'ES-mx' etc. e resolve para um idioma suportado.
    function match(tag) {
      if (!tag) return null;
      const wanted = String(tag).toLowerCase();
      const exact = SUPPORTED.filter(l => l.toLowerCase() === wanted)[0];
      if (exact) return exact;
      const prefix = wanted.slice(0, 2);
      return SUPPORTED.filter(l => l.slice(0, 2) === prefix)[0] || null;
    }

    function load(lang) {
      if (cache[lang]) return Promise.resolve(cache[lang]);
      return fetch('assets/i18n/' + lang + '.json', { cache: 'no-cache' })
        .then(res => {
          if (!res.ok) throw new Error('i18n ' + lang + ': HTTP ' + res.status);
          return res.json();
        })
        .then(json => { cache[lang] = json; return json; });
    }

    // Aceita chave plana ("nav.introducao") ou aninhada ({ nav: { introducao } }).
    function pluck(source, key) {
      if (source && typeof source[key] === 'string') return source[key];

      const parts = key.split('.');
      let node = source;
      for (let i = 0; i < parts.length; i++) {
        if (node === null || typeof node !== 'object' || !(parts[i] in node)) return undefined;
        node = node[parts[i]];
      }
      return typeof node === 'string' ? node : undefined;
    }

    // Devolve a chave quando nao ha traducao, para o texto original do HTML ficar intacto.
    function t(key, vars) {
      let value = pluck(dict, key);
      if (value === undefined) value = pluck(base, key);
      if (value === undefined) return key;
      if (vars) {
        Object.keys(vars).forEach(name => {
          value = value.split('{' + name + '}').join(String(vars[name]));
        });
      }
      return value;
    }

    function setMeta(kind, name, key) {
      const value = t(key);
      if (value === key) return;
      const el = document.head.querySelector('meta[' + kind + '="' + name + '"]');
      if (el) el.setAttribute('content', value);
    }

    function apply() {
      document.documentElement.setAttribute('lang', current);

      $$('[data-i18n]').forEach(el => {
        const value = t(el.dataset.i18n);
        if (value !== el.dataset.i18n) el.textContent = value;
      });

      $$('[data-i18n-html]').forEach(el => {
        const value = t(el.dataset.i18nHtml);
        if (value !== el.dataset.i18nHtml) el.innerHTML = value;
      });

      $$('[data-i18n-attr]').forEach(el => {
        el.dataset.i18nAttr.split('|').forEach(pair => {
          const cut = pair.indexOf(':');
          if (cut < 0) return;
          const attr = pair.slice(0, cut).trim();
          const key = pair.slice(cut + 1).trim();
          const value = t(key);
          if (value !== key) el.setAttribute(attr, value);
        });
      });

      const title = t('meta.title');
      if (title !== 'meta.title') document.title = title;
      setMeta('name', 'description', 'meta.description');
      setMeta('property', 'og:title', 'meta.ogTitle');
      setMeta('property', 'og:description', 'meta.ogDescription');
    }

    function setLang(lang, options) {
      const target = match(lang) || BASE;
      const persist = !options || options.persist !== false;

      return load(BASE)
        .then(baseDict => {
          base = baseDict;
          return target === BASE ? baseDict : load(target);
        })
        .then(langDict => {
          dict = langDict;
          current = target;
          ready = true;
          apply();
          if (persist) {
            try { localStorage.setItem(STORE.lang, target); } catch (e) { /* ignora */ }
          }
          document.dispatchEvent(new CustomEvent('i18n:change', { detail: { lang: target } }));
        })
        .catch(err => {
          // Em file:// o fetch e bloqueado: o site segue no texto original do HTML.
          if (window.console && console.info) {
            console.info('i18n indisponivel, mantendo o conteudo original:', err.message);
          }
        });
    }

    return {
      init: () => setLang(detect(), { persist: false }),
      setLang: setLang,
      t: t,
      get lang() { return current; },
      get ready() { return ready; },
      supported: SUPPORTED,
      short: SHORT
    };
  })();

  /* ---------------------------------------------------------------- tema -- */
  const html = document.documentElement;

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    const btn = $('#themeToggle');
    if (btn) {
      const dark = theme === 'dark';
      btn.innerHTML = '<i class="fa-solid fa-' + (dark ? 'sun' : 'moon') + '"></i>';
      btn.setAttribute('aria-label', I18n.t(dark ? 'ui.theme.toLight' : 'ui.theme.toDark'));
      btn.title = I18n.t(dark ? 'ui.theme.light' : 'ui.theme.dark');
    }
  }

  function currentTheme() {
    return html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem(STORE.theme); } catch (e) { /* storage bloqueado */ }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved || (prefersDark ? 'dark' : 'light'));

    const toggle = $('#themeToggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const next = currentTheme() === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        try { localStorage.setItem(STORE.theme, next); } catch (e) { /* ignora */ }
      });
    }

    document.addEventListener('i18n:change', () => applyTheme(currentTheme()));
  }

  /* ------------------------------------------------- seletor de idioma ---- */
  function initLangSwitch() {
    const wrap   = $('#langSwitch');
    const toggle = $('#langToggle');
    const menu   = $('#langMenu');
    const code   = $('#langCode');
    if (!wrap || !toggle || !menu) return;

    const close = () => { wrap.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); };
    const open  = () => { wrap.classList.add('is-open');    toggle.setAttribute('aria-expanded', 'true'); };

    toggle.addEventListener('click', event => {
      event.stopPropagation();
      if (wrap.classList.contains('is-open')) close(); else open();
    });

    $$('button[data-lang]', menu).forEach(btn => {
      btn.addEventListener('click', () => {
        I18n.setLang(btn.dataset.lang);
        close();
      });
    });

    document.addEventListener('click', event => {
      if (!event.target.closest('#langSwitch')) close();
    });
    window.addEventListener('keydown', event => {
      if (event.key === 'Escape') close();
    });

    function sync() {
      if (code) code.textContent = I18n.short[I18n.lang] || I18n.lang;
      $$('button[data-lang]', menu).forEach(btn => {
        btn.setAttribute('aria-selected', String(btn.dataset.lang === I18n.lang));
      });
    }

    document.addEventListener('i18n:change', sync);
    sync();
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

  function copyIdleLabel(btn) {
    btn.innerHTML = '<i class="fa-regular fa-copy"></i> ' + I18n.t('ui.copy.label');
    btn.setAttribute('aria-label', I18n.t('ui.copy.aria'));
  }

  function initCopyButtons() {
    $$('.code').forEach(block => {
      if (block.classList.contains('code--nocopy')) return;
      if (!block.querySelector('code')) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'code__copy';
      copyIdleLabel(btn);

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
        btn.innerHTML = '<i class="fa-solid fa-check"></i> ' + I18n.t('ui.copy.done');
        setTimeout(() => {
          btn.classList.remove('is-done');
          copyIdleLabel(btn);
        }, 1800);
      });

      block.appendChild(btn);
    });

    document.addEventListener('i18n:change', () => {
      $$('.code__copy').forEach(btn => {
        if (!btn.classList.contains('is-done')) copyIdleLabel(btn);
      });
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

  /* ------------------------------------------------ menu ativo + leitura -- */
  function initScrollSpy() {
    const sections = $$('.section, .hero');
    const links = $$('.nav__link');
    if (!sections.length) return;

    const fill  = $('#readProgress');
    const label = $('#readLabel');

    function setActive(id) {
      links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));

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

    let index = buildIndex();
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
        : '<p class="search__empty">' +
            I18n.t('ui.search.empty', { query: '<b>' + escapeHtml(raw) + '</b>' }) + '<br>' +
            I18n.t('ui.search.hint') +
          '</p>';

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

    // O indice guarda o texto traduzido, entao precisa ser refeito na troca de idioma.
    document.addEventListener('i18n:change', () => {
      index = buildIndex();
      if (input.value.trim().length >= 2) render(input.value); else close();
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
      if (count) count.textContent = I18n.t('checklist.count', { done: done, total: boxes.length });
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

    document.addEventListener('i18n:change', update);
    update();
  }

  /* ------------------------------------------------ fluxogramas interativos */
  function initFlows() {
    $$('.flow').forEach(flow => {
      const detail = $('.flow__detail', flow);
      const nodes = $$('.flow__node', flow);
      if (!detail || !nodes.length) return;

      let active = nodes[0];

      const show = node => {
        active = node;
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

      // Reaplica o detalhe do no ativo quando o idioma muda.
      document.addEventListener('i18n:change', () => show(active));

      show(nodes[0]);
    });
  }

  /* --------------------------------------------------- animacoes de entrada */
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

  /* ------------------------------------------------- ancoras em titulos --- */
  function initAnchors() {
    $$('.section h2[id], .section h3[id]').forEach(h => {
      const a = document.createElement('a');
      a.className = 'anchor';
      a.href = '#' + h.id;
      a.innerHTML = '<i class="fa-solid fa-link"></i>';
      a.setAttribute('aria-label', I18n.t('ui.anchor.aria'));
      a.setAttribute('data-i18n-attr', 'aria-label:ui.anchor.aria');
      h.appendChild(a);
    });
  }

  /* ------------------------------------------------------------- arranque - */
  function start() {
    initTheme();
    initLangSwitch();
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

  // API publica: window.I18n.setLang('en-US'), .t('chave'), .lang, .supported
  window.I18n = I18n;

  // O texto traduzido muda a altura da pagina depois que o navegador ja pulou
  // para a ancora do link, entao o alvo precisa ser reposicionado uma vez.
  function realignHash() {
    if (!window.location.hash || window.location.hash === '#') return;
    let target = null;
    try { target = document.querySelector(window.location.hash); } catch (e) { return; }
    if (target) requestAnimationFrame(() => target.scrollIntoView());
  }

  // O idioma carrega antes do resto para que a busca indexe o texto correto.
  function boot() {
    const run = () => { start(); realignHash(); };
    I18n.init().then(run, run);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
