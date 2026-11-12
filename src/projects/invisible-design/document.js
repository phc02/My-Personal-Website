/* A live Feishu reader; expanding keeps the iframe in the same DOM location. */
(() => {
  const article = document.querySelector('.invisible-article');
  if (!article) return;
  const panel = article.querySelector('.invisible-reader-panel');
  const host = article.querySelector('.invisible-reader-host');
  const frame = panel.querySelector('iframe');
  const expandButton = panel.querySelector('.invisible-reader-expand');
  const reloadButton = panel.querySelector('.invisible-reader-reload');
  const status = panel.querySelector('.invisible-reader-status');
  const loading = panel.querySelector('.invisible-reader-loading');
  const loadingCopy = loading.querySelector('span');
  const reduce = matchMedia('(prefers-reduced-motion:reduce)');
  const hero = document.querySelector('.invisible-video-section');
  hero.id = 'invisible-demo-video';
  const readingLink = document.createElement('a');
  readingLink.className = 'invisible-reading-link'; readingLink.href = '#sharing-notes';
  readingLink.textContent = '阅读分享文档 ↘'; hero.append(readingLink);
  const shade = document.createElement('div');
  shade.className = 'invisible-reader-shade'; shade.hidden = true; shade.setAttribute('aria-hidden', 'true');
  document.body.append(shade);
  let started = false, watchdog = 0, expanded = false, phase = 'inline', motion = null;
  let inertElements = [], savedY = 0, usingPopover = false, expandedBounds = null;

  function setStatus(state) {
    panel.dataset.connection = state;
    const pending = state === 'loading' || state === 'error';
    frame.setAttribute('aria-busy', String(state === 'loading'));
    loading.hidden = !pending;
    status.textContent = state === 'loading' ? '正在连接飞书' : state === 'slow' ? '连接较慢' : state === 'error' ? '暂未连接' : '';
    loadingCopy.textContent = state === 'loading' ? '正在连接飞书文档…' : state === 'slow'
      ? '连接时间较长，可继续等待、重新加载，或打开飞书原文阅读。'
      : '暂时无法连接，可重新加载，或打开飞书原文阅读。';
  }
  function loadDocument(force = false) {
    if (started && !force) return;
    started = true; clearTimeout(watchdog); setStatus('loading');
    frame.src = frame.dataset.src;
    watchdog = setTimeout(() => setStatus('slow'), 12000);
  }
  frame.addEventListener('load', () => {
    if (!started || !frame.getAttribute('src')) return;
    clearTimeout(watchdog);
    // An iframe load event is a response, not proof of document access or rendering.
    setStatus('responded');
  });
  frame.addEventListener('error', () => { if (started) { clearTimeout(watchdog); setStatus('error'); } });
  reloadButton.addEventListener('click', () => loadDocument(true));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { loadDocument(); observer.disconnect(); }
    }, {rootMargin: '180px 0px'});
    observer.observe(host);
  } else loadDocument();

  // Lock only siblings along the panel's ancestor path; never inert the iframe.
  function lockBackground() {
    inertElements = [];
    for (let branch = panel; branch.parentElement && branch.parentElement !== document.documentElement; branch = branch.parentElement) {
      for (const sibling of branch.parentElement.children) {
        if (sibling === branch || !(sibling instanceof HTMLElement) || /^(SCRIPT|STYLE|LINK)$/.test(sibling.tagName)) continue;
        inertElements.push([sibling, sibling.inert]); sibling.inert = true;
      }
    }
  }
  function unlockBackground() {
    for (const [element, value] of inertElements) element.inert = value;
    inertElements = [];
  }
  function clearMotion() {
    motion?.kill(); motion = null;
    if (window.gsap) { gsap.killTweensOf(shade); gsap.set(panel, {clearProps: 'transform'}); }
  }
  function expand() {
    if (expanded || phase !== 'inline') return;
    loadDocument(); savedY = scrollY;
    const start = panel.getBoundingClientRect();
    expanded = true; phase = 'opening';
    document.documentElement.classList.add('invisible-reader-open');
    panel.classList.add('is-expanded');
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', '无感设计分享文档阅读');
    expandButton.textContent = '收起阅读'; expandButton.setAttribute('aria-expanded', 'true');
    // The popover top layer preserves the iframe's browsing context without reparenting.
    if (typeof panel.showPopover === 'function') {
      try { panel.setAttribute('popover', 'manual'); panel.showPopover(); usingPopover = true; }
      catch { panel.removeAttribute('popover'); usingPopover = false; }
    }
    shade.hidden = false; lockBackground(); expandButton.focus({preventScroll: true});
    const target = panel.getBoundingClientRect();
    expandedBounds = target;
    if (window.gsap && !reduce.matches) {
      gsap.fromTo(shade, {opacity: 0}, {opacity: 1, duration: .35});
      motion = gsap.fromTo(panel, {
        x: start.left + start.width / 2 - target.left - target.width / 2,
        y: start.top + start.height / 2 - target.top - target.height / 2,
        scaleX: start.width / target.width, scaleY: start.height / target.height
      }, {x: 0, y: 0, scaleX: 1, scaleY: 1, duration: .45, ease: 'power3.inOut', clearProps: 'transform',
        onComplete: () => { phase = 'expanded'; }});
    } else { if (window.gsap) gsap.set(shade, {opacity: 1}); phase = 'expanded'; }
  }
  function finishCollapse() {
    clearMotion();
    if (usingPopover) { panel.hidePopover(); panel.removeAttribute('popover'); usingPopover = false; }
    panel.classList.remove('is-expanded');
    panel.removeAttribute('role'); panel.removeAttribute('aria-modal'); panel.removeAttribute('aria-label');
    expandButton.textContent = '展开阅读'; expandButton.setAttribute('aria-expanded', 'false');
    shade.hidden = true; unlockBackground();
    document.documentElement.classList.remove('invisible-reader-open');
    expanded = false; phase = 'inline';
    window.scrollTo({top: savedY, behavior: 'instant'}); expandButton.focus({preventScroll: true});
  }
  function collapse(instant = false) {
    if (!expanded || phase === 'closing') return;
    phase = 'closing'; motion?.kill();
    if (!window.gsap || reduce.matches || instant) { finishCollapse(); return; }
    const current = expandedBounds, target = host.getBoundingClientRect();
    gsap.to(shade, {opacity: 0, duration: .28, overwrite: true});
    motion = gsap.to(panel, {
      x: target.left + target.width / 2 - (current.left + current.width / 2),
      y: target.top + target.height / 2 - (current.top + current.height / 2),
      scaleX: target.width / panel.offsetWidth, scaleY: target.height / panel.offsetHeight,
      duration: .36, ease: 'power3.inOut', onComplete: finishCollapse
    });
  }
  expandButton.addEventListener('click', () => expanded ? collapse() : expand());
  document.addEventListener('keydown', event => {
    if (!expanded) return;
    if (event.key === 'Escape') { event.preventDefault(); collapse(); }
    if (event.key === 'Tab') {
      const items = [...panel.querySelectorAll('button,a[href],iframe')].filter(el => !el.disabled);
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  for (const link of [readingLink, article.querySelector('.invisible-article-footer a')]) {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      document.querySelector(link.hash).scrollIntoView({behavior: reduce.matches ? 'instant' : 'smooth', block: 'start'});
    });
  }
  addEventListener('resize', () => {
    if (!expanded) return;
    if (phase === 'closing') finishCollapse();
    else { clearMotion(); expandedBounds = panel.getBoundingClientRect(); phase = 'expanded'; }
  });
  reduce.addEventListener('change', () => {
    if (!reduce.matches || !expanded) return;
    if (phase === 'closing') finishCollapse();
    else { clearMotion(); phase = 'expanded'; }
  });
  addEventListener('pagehide', () => { clearTimeout(watchdog); if (expanded) collapse(true); });
})();
