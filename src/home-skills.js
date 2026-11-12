/* User-supplied creative tools orbit the existing HOME mascot. */
(() => {
  const hero = document.querySelector('#intro .hero');
  if (!hero || !window.gsap) return;
  const tools = [
    ['figma', 'Figma', '交互与界面设计'],
    ['blender', 'Blender', '三维视觉表达'],
    ['codex', 'Codex', 'AI 辅助开发'],
    ['photoshop', 'Photoshop', '视觉设计与图像处理'],
    ['jimeng-ai', '即梦 AI', 'AI 图像与视频创作'],
    ['jianying', '剪映', '视频剪辑与表达'],
    ['unity', 'Unity', '实时交互与原型'],
    ['after-effects', 'After Effects', '动效设计与视频合成'],
    ['vscode', 'Visual Studio Code', '前端开发与交互实现']
  ];
  const images = [
    'assets/software-icons/home/figma.png', 'assets/software-icons/home/blender.png',
    'assets/software-icons/home/codex.png', 'assets/software-icons/home/photoshop.png',
    'assets/software-icons/home/jimeng-ai.png', 'assets/software-icons/home/jianying.png',
    'assets/software-icons/home/unity.png', 'assets/software-icons/home/after-effects.png',
    'assets/software-icons/home/vscode.png'
  ];
  const root = document.createElement('div');
  root.className = 'skills-orbit';
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', '常用创作工具');
  root.dataset.motion = 'waiting';
  root.hidden = true;
  const cards = tools.map(([id, name, description], index) => {
    const position = document.createElement('div');
    position.className = 'skill-orbit-position';
    position.dataset.skill = id;
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'skill-orbit-card';
    button.disabled = true; position.inert = true;
    button.setAttribute('aria-label', `${name} · ${description}`);
    button.setAttribute('aria-describedby', `skill-tip-${id}`);
    button.setAttribute('aria-expanded', 'false');
    const image = document.createElement('img');
    image.src = images[index]; image.alt = ''; image.width = image.height = 512;
    image.draggable = false;
    const label = document.createElement('span');
    label.className = 'skill-orbit-label'; label.id = `skill-tip-${id}`;
    label.setAttribute('role', 'tooltip');
    const title = document.createElement('strong'); title.textContent = name;
    const detail = document.createElement('span'); detail.textContent = description;
    label.append(title, detail); button.append(image, label);
    position.append(button); root.append(position);
    return { position, button, label, index, depth: 0, available: false, layer: '' };
  });
  hero.append(root);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  const mascot = hero.querySelector('.brand');
  const state = { phase: -.38, spread: 0, speed: 0, x: 0, y: 0 };
  const tau = Math.PI*2, slant = -12*Math.PI/180;
  let ready = false, ticking = false, active = null, touch = null;
  let entrance = null, entranceDone = false;
  let radiusX = 260, radiusY = 105, compact = false, stageHeight = innerHeight;
  let exit = 1, wasShown = false;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const pointerX = gsap.quickTo(state, 'x', { duration: .8, ease: 'power3.out' });
  const pointerY = gsap.quickTo(state, 'y', { duration: .8, ease: 'power3.out' });
  function measure() {
    const width = hero.clientWidth;
    stageHeight = hero.clientHeight;
    compact = width < 768;
    radiusX = compact ? Math.min(142, width*.34) : clamp(width*.255, 225, 310);
    radiusY = compact ? clamp(stageHeight*.095, 68, 78) : clamp(stageHeight*.09, 68, 90);
  }
  function setActive(card) {
    if (active === card) return;
    active?.button.classList.remove('is-active');
    active?.button.setAttribute('aria-expanded', 'false');
    active = card;
    if (active) {
      active.button.classList.add('is-active');
      active.button.setAttribute('aria-expanded', 'true');
      active.label.style.setProperty('--tip-shift', '0px');
      const rect = active.label.getBoundingClientRect();
      const shift = rect.left < 16 ? 16-rect.left : rect.right > innerWidth-16 ? innerWidth-16-rect.right : 0;
      active.label.style.setProperty('--tip-shift', `${shift}px`);
    }
    gsap.to(state, { speed: active ? 0 : 1, duration: reduce.matches ? 0 : active ? .5 : .75, ease: 'power2.out', overwrite: 'auto' });
  }
  function paint() {
    const spread = state.spread*(.55+.45*exit);
    cards.forEach(card => {
      const angle = state.phase + card.index*tau/cards.length;
      const depth = Math.sin(angle), near = (depth+1)/2;
      const x0 = Math.cos(angle)*radiusX*spread, y0 = depth*radiusY*spread;
      const x = x0*Math.cos(slant)-y0*Math.sin(slant)+state.x;
      const y = x0*Math.sin(slant)+y0*Math.cos(slant)+state.y;
      const scale = (.8+.26*near)*(.68+.32*state.spread);
      // Small screens show only the nearer arc, so all tools take turns
      // without crowding the mascot or screen edges.
      const arc = compact && !reduce.matches ? clamp((depth+.32)/.5, 0, 1) : 1;
      const alpha = (.4+.6*near)*state.spread*exit*arc;
      const layer = depth >= 0 ? 'front' : 'back';
      if (card.layer !== layer) { card.position.dataset.layer = layer; card.layer = layer; }
      card.position.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) translate(-50%,-50%) rotate(${(-3*Math.cos(angle)).toFixed(2)}deg) perspective(600px) rotateY(${(-14*Math.cos(angle)).toFixed(2)}deg) scale(${scale.toFixed(4)})`;
      card.position.style.opacity = String(alpha);
      card.depth = depth;
      const available = entranceDone && alpha > .12 && exit > .9 && state.spread > .85;
      if (card.available !== available) {
        card.available = available; card.button.disabled = !available;
        card.position.inert = !available;
        card.position.style.pointerEvents = available ? 'auto' : 'none';
      }
    });
  }
  function finishLap() {
    entranceDone = true; root.dataset.motion = 'cruise';
    mascot?.removeAttribute('data-orbit-spinning');
    gsap.to(state, { speed: 1, duration: .6, ease: 'power2.out', overwrite: 'auto' });
    paint();
  }
  function playLap(expand = false) {
    entrance?.kill(); touch = null; setActive(null);
    gsap.killTweensOf(state, 'phase,speed');
    state.speed = 0; entranceDone = false;
    root.dataset.motion = expand ? 'entrance' : 'replay';
    if (!expand) mascot?.setAttribute('data-orbit-spinning', '');
    // Begin at the current phase. Clicking never collapses or resets the ring.
    // Positive phase is clockwise on screen, independent of the mascot's yaw.
    const lap = state.phase + tau*(expand ? 1 : 1.5);
    entrance = gsap.timeline({ paused: true, onComplete: finishLap })
      .to(state, { spread: 1, duration: expand ? .65 : .35, ease: 'power3.out' }, 0)
      .to(state, { phase: lap + .1, duration: 1.8, ease: 'power2.inOut' }, expand ? .25 : 0)
      .to(state, { phase: lap - .025, duration: .24, ease: 'power2.out' })
      .to(state, { phase: lap, duration: .32, ease: 'sine.inOut' });
    paint();
    if (wasShown) entrance.play();
  }
  function cancelReplay() {
    if (root.dataset.motion !== 'replay') return;
    entrance?.kill(); entrance = null; entranceDone = true; state.speed = 1;
    root.dataset.motion = 'cruise'; mascot?.removeAttribute('data-orbit-spinning');
  }
  function context() {
    const intro = window.__introState?.();
    const progress = intro?.progress || 0;
    exit = 1-clamp(progress/.075, 0, 1);
    const shown = ready && exit > .001 && !document.hidden
      && (!document.documentElement.classList.contains('loading') || window.__homeEntranceStarted)
      && !document.documentElement.classList.contains('project-transitioning')
      && !document.body.classList.contains('navigation-route') && !window.__navigationState?.().animating;
    if (shown !== wasShown) {
      wasShown = shown; root.hidden = !shown; root.inert = !shown;
      if (!shown) { entrance?.pause(); cancelReplay(); touch = null; setActive(null); }
      else if (!entranceDone) entrance?.play();
    }
    return shown;
  }
  function tick(_time, delta) {
    if (!context()) { sleep(); return; }
    if (!reduce.matches && entranceDone) state.phase += Math.min(delta, 40)/1000*tau/24*state.speed;
    paint();
  }
  function sleep() { if (ticking) { gsap.ticker.remove(tick); ticking = false; } }
  function wake() {
    if (!ready) return;
    if (!context()) { sleep(); return; }
    if (!ticking) paint();
    if (!reduce.matches && !ticking) { ticking = true; gsap.ticker.add(tick); }
  }
  cards.forEach(card => {
    card.button.addEventListener('pointerenter', event => { if (fine.matches && event.pointerType !== 'touch') setActive(card); });
    card.button.addEventListener('pointerleave', () => { if (active === card && !card.button.matches(':focus-visible')) setActive(null); });
    card.button.addEventListener('focus', () => { if (card.button.matches(':focus-visible')) setActive(card); });
    card.button.addEventListener('blur', () => { if (active === card && touch !== card) setActive(null); });
    card.button.addEventListener('click', event => {
      if (event.pointerType === 'touch' || !fine.matches) { touch = touch === card ? null : card; setActive(touch); }
    });
  });
  document.addEventListener('pointerdown', event => { if (!event.target.closest('.skill-orbit-card')) { touch = null; setActive(null); } });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { touch = null; setActive(null); } });
  hero.addEventListener('pointermove', event => {
    if (!wasShown || !fine.matches || reduce.matches || event.pointerType === 'touch') return;
    pointerX((event.clientX/innerWidth-.5)*14);
    pointerY((event.clientY/stageHeight-.5)*10);
  });
  hero.addEventListener('pointerleave', () => { pointerX(0); pointerY(0); });
  addEventListener('scroll', wake, { passive: true });
  ['navigationchange','navigationcomplete','navigationtarget'].forEach(name => addEventListener(name, () => { touch = null; setActive(null); wake(); }));
  addEventListener('introprogress', wake);
  addEventListener('mascotspin', () => {
    if (reduce.matches || !ready || root.dataset.motion === 'replay' || !context()) return;
    playLap(false); wake();
  });
  document.addEventListener('visibilitychange', wake);
  addEventListener('resize', () => { measure(); wake(); }, { passive: true });
  reduce.addEventListener('change', () => {
    sleep(); entrance?.kill(); entrance = null; entranceDone = true;
    mascot?.removeAttribute('data-orbit-spinning');
    gsap.killTweensOf(state); state.spread = 1; state.speed = 1; state.x = state.y = 0;
    root.dataset.motion = reduce.matches ? 'static' : 'cruise';
    measure(); wake();
  });
  addEventListener('pagehide', () => { cancelReplay(); entrance?.pause(); sleep(); });
  addEventListener('pageshow', wake);
  function start() {
    if (ready) { wake(); return; }
    if (!window.__homeEntranceStarted && !window.__introState?.().ready) { requestAnimationFrame(start); return; }
    ready = true; measure();
    if (reduce.matches) {
      state.spread = 1; state.speed = 1; entranceDone = true;
      root.dataset.motion = 'static';
    } else {
      playLap(true);
    }
    wake();
  }
  start();
})();
