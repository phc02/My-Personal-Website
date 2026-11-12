/* Original-image previews with the portfolio's black icon cursor treatment. */
(() => {
  const root = document.querySelector('.dyslexia-diagrams');
  if (!root) return;
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  const reduce = matchMedia('(prefers-reduced-motion:reduce)');
  const buttons = [...root.querySelectorAll('.dyslexia-diagram-open')];
  const cursor = document.createElement('div');
  cursor.className = 'dyslexia-image-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  const disc = document.createElement('span');
  disc.className = 'dyslexia-image-cursor-disc';
  for (const name of ['expand', 'collapse']) {
    const icon = new Image(24, 24);
    icon.src = root.dataset[name + 'Icon']; icon.alt = ''; icon.dataset.icon = name;
    disc.append(icon);
  }
  cursor.append(disc); document.body.append(cursor);

  const dialog = document.createElement('dialog');
  dialog.className = 'dyslexia-image-dialog'; dialog.setAttribute('data-cursor', 'hide');
  dialog.setAttribute('aria-label', '项目图片放大预览');
  const shade = document.createElement('div'); shade.className = 'dyslexia-image-shade';
  const stage = document.createElement('div'); stage.className = 'dyslexia-image-stage';
  const preview = new Image(); preview.draggable = false; stage.append(preview);
  dialog.setAttribute('aria-description', '点击图片或按 Escape 收起预览');
  dialog.append(shade, stage); document.body.append(dialog);

  const xTo = window.gsap?.quickTo(cursor, 'x', {duration: .13, ease: 'power2.out'});
  const yTo = window.gsap?.quickTo(cursor, 'y', {duration: .13, ease: 'power2.out'});
  let phase = 'closed', source = null, destination = null;
  let lastPointer = null, pending = 0;
  function hideCursor() { cursor.classList.remove('is-visible'); }
  function moveCursor(event, mode) {
    if (!fine.matches || event.pointerType === 'touch') { hideCursor(); return; }
    lastPointer = {clientX: event.clientX, clientY: event.clientY, pointerType: event.pointerType};
    cursor.dataset.mode = mode;
    const snap = reduce.matches || !cursor.classList.contains('is-visible');
    if (window.gsap) {
      if (snap) {
        xTo.tween.pause(); yTo.tween.pause();
        gsap.set(cursor, {x: event.clientX, y: event.clientY});
      } else { xTo(event.clientX); yTo(event.clientY); }
    } else cursor.style.transform = `translate(${event.clientX}px,${event.clientY}px)`;
    cursor.classList.add('is-visible');
  }
  function syncCursor() {
    if (!lastPointer || !fine.matches || document.hidden || document.body.classList.contains('navigation-route')) {
      hideCursor(); return;
    }
    const el = document.elementFromPoint(lastPointer.clientX, lastPointer.clientY);
    if (dialog.open && el?.closest('.dyslexia-image-stage')) moveCursor(lastPointer, 'collapse');
    else if (phase === 'closed' && el?.closest('.dyslexia-diagram-open')) moveCursor(lastPointer, 'expand');
    else hideCursor();
  }
  function originTransform() {
    const origin = source.querySelector('img').getBoundingClientRect();
    return {
      x: origin.left + origin.width / 2 - destination.left - destination.width / 2,
      y: origin.top + origin.height / 2 - destination.top - destination.height / 2,
      scale: origin.width / destination.width
    };
  }
  async function openImage(button) {
    if (phase !== 'closed') return;
    phase = 'loading'; source = button;
    const sequence = ++pending;
    const img = button.querySelector('img');
    preview.src = img.currentSrc || img.src; preview.alt = img.alt;
    try { await preview.decode(); } catch { phase = 'closed'; return; }
    if (pending !== sequence) return;
    dialog.setAttribute('aria-label', button.getAttribute('aria-label'));
    document.documentElement.classList.add('dyslexia-image-open');
    dialog.showModal(); dialog.append(cursor);
    phase = 'opening';
    if (window.gsap) gsap.set(preview, {clearProps: 'transform,opacity'});
    destination = preview.getBoundingClientRect();
    dialog.focus({preventScroll: true}); syncCursor();
    const duration = reduce.matches ? 0 : .48;
    if (window.gsap) {
      gsap.fromTo(shade, {opacity: 0}, {opacity: 1, duration, overwrite: true});
      gsap.fromTo(preview, {...originTransform(), opacity: .65}, {
        x: 0, y: 0, scale: 1, opacity: 1, duration, ease: 'power3.inOut', overwrite: true,
        onComplete: () => { if (phase === 'opening') phase = 'open'; }
      });
    } else phase = 'open';
  }
  function finishClose() {
    dialog.close(); document.documentElement.classList.remove('dyslexia-image-open');
    document.body.append(cursor); phase = 'closed'; hideCursor();
    source?.focus({preventScroll: true}); syncCursor();
  }
  function closeImage(instant = false) {
    if (phase === 'closed' || phase === 'closing') return;
    ++pending;
    if (phase === 'loading') { phase = 'closed'; return; }
    phase = 'closing';
    if (window.gsap) gsap.killTweensOf([preview, shade]);
    if (instant || reduce.matches || !window.gsap) { finishClose(); return; }
    gsap.to(shade, {opacity: 0, duration: .3});
    gsap.to(preview, {...originTransform(), opacity: .2, duration: .38, ease: 'power3.inOut', onComplete: finishClose});
  }
  for (const button of buttons) {
    button.addEventListener('click', () => openImage(button));
    button.addEventListener('pointerenter', event => moveCursor(event, 'expand'));
    button.addEventListener('pointermove', event => moveCursor(event, 'expand'));
    button.addEventListener('pointerleave', hideCursor);
  }
  stage.addEventListener('pointerenter', event => moveCursor(event, 'collapse'));
  stage.addEventListener('pointermove', event => moveCursor(event, 'collapse'));
  stage.addEventListener('pointerleave', hideCursor);
  stage.addEventListener('click', () => closeImage());
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeImage(); });
  document.addEventListener('scroll', syncCursor, {capture: true, passive: true});
  document.addEventListener('pointerout', event => { if (!event.relatedTarget) hideCursor(); });
  document.addEventListener('visibilitychange', hideCursor);
  addEventListener('blur', hideCursor);
  addEventListener('pagehide', () => { hideCursor(); closeImage(true); });
  addEventListener('resize', () => {
    hideCursor();
    if (!dialog.open || phase === 'closing') return;
    if (window.gsap) {
      gsap.killTweensOf([preview, shade]);
      gsap.set(preview, {clearProps: 'transform,opacity'}); gsap.set(shade, {opacity: 1});
    }
    destination = preview.getBoundingClientRect(); phase = 'open';
  });
  fine.addEventListener('change', hideCursor);
  reduce.addEventListener('change', () => {
    hideCursor();
    if (!reduce.matches || !window.gsap || !dialog.open) return;
    if (phase === 'closing') { gsap.killTweensOf([preview, shade]); finishClose(); }
    else {
      gsap.killTweensOf([preview, shade]);
      gsap.set(preview, {clearProps: 'transform,opacity'}); gsap.set(shade, {opacity: 1}); phase = 'open';
    }
  });
  new MutationObserver(syncCursor).observe(document.body, {attributes: true, attributeFilter: ['class']});
})();
