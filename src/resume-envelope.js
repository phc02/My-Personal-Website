/* Local Reverse UI envelope artwork, opened as an accessible resume lightbox. */
(() => {
  const entry = document.querySelector('.resume-entry');
  if (!entry || !window.gsap) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  const art = entry.querySelector('.resume-envelope-art');
  const flap = entry.querySelector('.resume-envelope-flap');
  const stamp = entry.querySelector('.resume-envelope-stamp');
  const label = entry.querySelector('.resume-envelope-label');
  entry.setAttribute('aria-expanded', 'false');

  const dialog = document.createElement('dialog');
  dialog.id = 'resume-dialog';
  dialog.className = 'resume-dialog';
  dialog.setAttribute('aria-label', '彭海朝的个人简历');
  dialog.dataset.cursor = 'hide';
  const shade = document.createElement('div');
  shade.className = 'resume-shade';
  shade.setAttribute('aria-hidden', 'true');
  const scroller = document.createElement('div');
  scroller.className = 'resume-scroll';
  const content = document.createElement('div');
  content.className = 'resume-content';
  const sheet = document.createElement('button');
  sheet.className = 'resume-sheet';
  sheet.type = 'button';
  sheet.setAttribute('aria-label', '收起简历并返回信封');
  const image = new Image(2380, 3368);
  image.src = entry.dataset.resumeSrc;
  image.alt = '彭海朝的个人简历，包含教育背景、实习经历、项目经历和校园经历';
  image.draggable = false;
  sheet.append(image);
  content.append(sheet);
  scroller.append(content);
  const cursor = document.createElement('div');
  cursor.className = 'resume-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  const cursorIcon = new Image(26, 26);
  cursorIcon.src = entry.dataset.collapseIcon;
  cursorIcon.alt = '';
  cursor.append(cursorIcon);
  dialog.append(shade, scroller, cursor);
  document.body.append(dialog);

  let phase = 'closed', revealed = false;
  let sequence = null, idle = null, wiggle = null, hovered = false;
  let savedScroll = 0, openingBounds = null, locked = false;
  const duration = value => reduced.matches ? 0 : value;
  const hideCursor = () => cursor.classList.remove('is-visible');
  const cursorX = gsap.quickTo(cursor, 'x', {duration: .12, ease: 'power2.out'});
  const cursorY = gsap.quickTo(cursor, 'y', {duration: .12, ease: 'power2.out'});
  function moveCursor(event) {
    if (!fine.matches || event.pointerType === 'touch' || phase !== 'open') return hideCursor();
    if (!cursor.classList.contains('is-visible') || reduced.matches) {
      cursorX.tween.pause(); cursorY.tween.pause();
      gsap.set(cursor, {x: event.clientX, y: event.clientY});
    } else { cursorX(event.clientX); cursorY(event.clientY); }
    cursor.classList.add('is-visible');
  }
  sheet.addEventListener('pointerenter', moveCursor);
  sheet.addEventListener('pointermove', moveCursor);
  sheet.addEventListener('pointerleave', hideCursor);
  scroller.addEventListener('scroll', hideCursor, {passive: true});
  // Keep the portfolio's global wheel smoothing from scrolling behind the dialog.
  dialog.addEventListener('wheel', event => event.stopPropagation(), {passive: true});
  window.addEventListener('blur', hideCursor);

  function stopHint() {
    idle?.kill(); wiggle?.kill();
    idle = wiggle = null;
    gsap.set(art, {rotation: 0, y: 0});
  }
  function scheduleHint() {
    idle?.kill();
    if (reduced.matches) return;
    idle = gsap.delayedCall(3.5, () => {
      const r = entry.getBoundingClientRect();
      if (phase !== 'closed' || !revealed || hovered || document.hidden
        || document.body.classList.contains('navigation-route') || r.top < 0 || r.bottom > innerHeight) {
        scheduleHint(); return;
      }
      wiggle = gsap.timeline({onComplete: scheduleHint})
        .to(art, {rotation: -5, y: -2, duration: .1, ease: 'power2.out'})
        .to(art, {rotation: 4, duration: .13, ease: 'power1.inOut'})
        .to(art, {rotation: -2, duration: .14, ease: 'power1.inOut'})
        .to(art, {rotation: 0, y: 0, duration: .3, ease: 'power2.out'});
    });
  }
  entry.addEventListener('pointerenter', event => {
    if (event.pointerType === 'touch' || phase !== 'closed') return;
    hovered = true; stopHint();
    gsap.to(art, {y: -4, rotation: -2, duration: duration(.3), ease: 'power3.out'});
  });
  entry.addEventListener('pointerleave', () => {
    hovered = false;
    if (phase !== 'closed') return;
    gsap.to(art, {y: 0, rotation: 0, duration: duration(.45), ease: 'power3.out'});
    scheduleHint();
  });
  function showEntry(next) {
    revealed = next;
    entry.disabled = !next;
    entry.setAttribute('aria-hidden', String(!next));
    gsap.to(entry, {autoAlpha: next ? 1 : 0, duration: duration(.3), overwrite: true});
    if (next) scheduleHint(); else stopHint();
  }
  window.addEventListener('aboutreveal', event => showEntry(event.detail.revealed));
  if (window.__introState?.().aboutRevealed) showEntry(true);

  function geometry() {
    const ratio = (image.naturalWidth || 2380) / (image.naturalHeight || 3368);
    const margin = innerWidth < 768 ? 18 : 48;
    const width = Math.min(image.naturalWidth || 2380, innerWidth < 768 ? 800 : Math.min(1180, innerWidth * .84));
    const height = width / ratio;
    const contentWidth = Math.max(innerWidth, width + margin * 2);
    const top = innerWidth < 768 ? 18 : 28;
    return {width, height, left: (contentWidth - width) / 2, top,
      contentWidth, contentHeight: Math.max(innerHeight, top + height + 40)};
  }
  function sizeContent(g) {
    content.style.width = `${g.contentWidth}px`;
    content.style.height = `${g.contentHeight}px`;
  }
  function extractedPaper(r) {
    const ratio = (image.naturalWidth || 2380) / (image.naturalHeight || 3368);
    // Clear the envelope lip while keeping the whole sheet below the viewport top.
    const bottom = r.top + r.height * 6 / 145 - 8;
    const width = Math.min(r.width * .46, Math.max(24, bottom - 12) * ratio);
    const height = width / ratio;
    const top = bottom - height;
    const left = r.left + (r.width - width) / 2;
    return {width, height, top, left, lip: bottom + 8};
  }
  function fitSheet() {
    const g = geometry();
    sizeContent(g);
    scroller.scrollTo(0, 0);
    const {width, height, left, top} = g;
    gsap.killTweensOf(sheet);
    gsap.set(sheet, {width, height, left, top, x: 0, y: 0, scale: 1, rotation: 0});
  }
  function finishClosed() {
    dialog.dataset.phase = 'closed';
    dialog.close();
    document.documentElement.classList.remove('resume-view-open');
    locked = false;
    gsap.set([flap, stamp, label], {clearProps: 'all'});
    gsap.set(art, {rotation: 0, y: 0});
    phase = 'closed';
    entry.setAttribute('aria-expanded', 'false');
    window.scrollTo(0, savedScroll);
    entry.focus({preventScroll: true});
    scheduleHint();
  }
  function close() {
    if (phase === 'closed' || phase === 'closing') return;
    sequence?.kill(); gsap.killTweensOf(sheet); hideCursor();
    phase = 'closing';
    dialog.dataset.phase = phase;
    // A resize can move the envelope while the preview is open.
    openingBounds = art.getBoundingClientRect();
    // Return from the sheet's actual visible position, even after reading/panning.
    const visual = sheet.getBoundingClientRect();
    scroller.scrollTo(0, 0);
    sizeContent({contentWidth: innerWidth, contentHeight: innerHeight});
    gsap.set(sheet, {left: visual.left, top: visual.top, width: visual.width, height: visual.height,
      x: 0, y: 0, scale: 1, rotation: 0, autoAlpha: 1, clipPath: 'inset(0 0 0% 0)'});
    const r = openingBounds;
    const paper = extractedPaper(r);
    sequence = gsap.timeline({onComplete: finishClosed})
      .to(sheet, {x: paper.left + paper.width / 2 - visual.left - visual.width / 2,
        y: paper.top + paper.height / 2 - visual.top - visual.height / 2,
        scale: paper.width / visual.width,
        duration: duration(.65), ease: 'power3.inOut'}, 0)
      .to(shade, {autoAlpha: 0, duration: duration(.55)}, 0)
      .to(sheet, {y: paper.lip + paper.height / 2 - visual.top - visual.height / 2,
        clipPath: 'inset(0 0 100% 0)', duration: duration(.3), ease: 'power2.in'}, duration(.69))
      .set(sheet, {autoAlpha: 0}, duration(.99))
      .to(flap, {rotationX: 0, duration: duration(.4), ease: 'power2.inOut'}, duration(.93))
      .set(flap, {zIndex: 5}, duration(1.13))
      .to([stamp, label], {autoAlpha: 1, y: 0, duration: duration(.25)}, duration(1.08));
  }
  async function open() {
    if (phase !== 'closed' || !revealed) return;
    phase = 'opening'; stopHint();
    dialog.dataset.phase = phase;
    try { await image.decode(); } catch { phase = 'closed'; scheduleHint(); return; }
    if (phase !== 'opening') return;
    savedScroll = scrollY;
    openingBounds = art.getBoundingClientRect();
    const r = openingBounds;
    dialog.showModal();
    document.documentElement.classList.add('resume-view-open');
    locked = true;
    entry.setAttribute('aria-expanded', 'true');
    gsap.set([shade, sheet], {autoAlpha: 0});
    gsap.set(flap, {transformPerspective: 650, rotationX: 0, zIndex: 5});
    const g = geometry();
    sizeContent(g);
    scroller.scrollTo(0, 0);
    const paper = extractedPaper(r);
    gsap.set(sheet, {left: g.left, top: g.top, width: g.width, height: g.height,
      x: paper.left + paper.width / 2 - g.left - g.width / 2,
      y: paper.lip + paper.height / 2 - g.top - g.height / 2,
      scale: paper.width / g.width, rotation: 0, clipPath: 'inset(0 0 100% 0)'});
    // Keep the moving resume in the native top layer, above the pinned page header.
    // Its bottom mask follows the envelope lip until the sheet is fully extracted.
    sequence = gsap.timeline({onComplete: () => {
      phase = 'open'; sheet.focus({preventScroll: true});
      dialog.dataset.phase = 'open';
    }})
      .to([stamp, label], {autoAlpha: 0, y: -5, duration: duration(.2)}, 0)
      .to(flap, {rotationX: -180, duration: duration(.5), ease: 'power2.inOut'}, duration(.08))
      .set(flap, {zIndex: 1}, duration(.34))
      .set(sheet, {autoAlpha: 1}, duration(.60))
      .to(sheet, {y: paper.top + paper.height / 2 - g.top - g.height / 2,
        clipPath: 'inset(0 0 0% 0)', duration: duration(.5), ease: 'power3.inOut'}, duration(.60))
      .to(shade, {autoAlpha: 1, duration: duration(.7)}, duration(1.05))
      .to(sheet, {x: 0, y: 0, scale: 1, rotation: 0,
        duration: duration(.85), ease: 'power3.inOut'}, duration(1.11));
  }
  entry.addEventListener('click', open);
  sheet.addEventListener('click', close);
  scroller.addEventListener('click', event => {
    if (event.target === scroller || event.target === content) close();
  });
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  // Native dialog makes the background inert; the resume is its close control.
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    event.preventDefault(); sheet.focus({preventScroll: true});
  });
  window.addEventListener('resize', () => {
    if (phase !== 'open') return;
    fitSheet(); hideCursor();
  }, {passive: true});
  window.addEventListener('pagehide', () => {
    sequence?.kill(); stopHint(); hideCursor();
    if (locked) finishClosed();
  });
  reduced.addEventListener('change', () => {
    stopHint(); if (!reduced.matches && phase === 'closed') scheduleHint();
  });
  window.addEventListener('pageshow', () => { if (phase === 'closed' && revealed) scheduleHint(); });
})();
