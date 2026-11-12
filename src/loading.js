/* Circular loading gate and two-pass scan reveal. */
(() => {
  // Explicit project-menu navigation bypasses the loading gate once.
  const destination=new URLSearchParams(location.search).get('project-section');
  if(['home','about','work','contact'].includes(destination)){
    window.__projectDestination=destination;
    const url=new URL(location.href);url.searchParams.delete('project-section');url.hash=destination==='home'?'':'#'+destination;
    history.replaceState(history.state,'',url.pathname+url.search+url.hash);
    document.documentElement.classList.remove('loading');window.homeLoading=Promise.resolve(true);
    return;
  }
  // History return restores the previous view; a refresh still starts Loading.
  const returning=performance.getEntriesByType('navigation')[0]?.type==='back_forward';
  const fallback=new URLSearchParams(location.search).get('project-return');
  const saved=returning?history.state?.portfolioReturn:null;
  if(saved||fallback==='work'){
    window.__projectReturn=saved||{hash:'#work'};
    const url=new URL(location.href);url.searchParams.delete('project-return');url.hash=saved?'':'#work';
    history.replaceState(history.state,'',url.pathname+url.search+url.hash);
    document.documentElement.classList.remove('loading');window.homeLoading=Promise.resolve(true);
    return;
  }

  // Every document load starts at the loading gate, including a refresh on a route.
  if (location.hash) history.replaceState(history.state, '', location.pathname + location.search);
  history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  window.homeLoading = new Promise(resolve => {
    const root = document.createElement('div');
    root.className = 'home-loading';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Welcome to Peng Haichao’s portfolio');
    root.innerHTML = `<div class="loading-surround" aria-hidden="true"></div><div class="loading-frame" aria-hidden="true"><span>PENG HAICHAO / PORTFOLIO<br>DESIGN × TECHNOLOGY</span><span>BOOT COMPLETE<br>ENTER → HOME</span></div>
      <div class="loading-panel">
        <div class="loading-underlay"></div>
        <div class="loading-face">
          <div class="loading-status" role="status">0</div>
          <button class="loading-enter" disabled aria-label="Loading portfolio">
            <svg viewBox="0 0 218 218" aria-hidden="true"><circle class="loading-dots" cx="109" cy="109" r="108.323" pathLength="1"/><circle class="loading-ring" cx="109" cy="109" r="108.323" pathLength="1"/></svg>
            <span class="loading-hello">HELLO</span><span class="loading-label">ENTER</span>
          </button>
          <span class="loading-access">WELCOME ABOARD</span>
          <div class="loading-meta"><div class="loading-meta-group"><span class="loading-meta-caption">DIRECTION</span><span>用户体验设计/AI体验设计</span></div><div class="loading-meta-group"><span class="loading-meta-caption">CODE</span><span>@彭海朝</span></div></div>
        </div>
      </div>`;
    document.body.append(root);
    const main = document.querySelector('main');
    const header = document.querySelector('.hero-header');
    const blocked = [main, header].filter(Boolean);
    const priorInert = blocked.map(el => el.inert);
    blocked.forEach(el => { el.inert = true; });
    const button = root.querySelector('button'), ring = root.querySelector('.loading-ring');
    const dots = root.querySelector('.loading-dots');
    const svg = button.querySelector('svg');
    const label = root.querySelector('.loading-label');
    const status = root.querySelector('.loading-status');
    const meta = root.querySelector('.loading-meta');
    const progressState = { value: 0 };
    const paintProgress = () => {
      ring.style.strokeDashoffset = String(1 + progressState.value);
      status.textContent = String(Math.round(progressState.value * 100));
    };
    let entering = false, finished = false, blink, load;
    const out = t => 1 - Math.pow(1 - t, 6);
    const inOut = t => t < .5 ? 32 * Math.pow(t, 6) : 1 - Math.pow(-2 * t + 2, 6) / 2;
    gsap.set([dots, ring], { transformOrigin: '50% 50%', scale: 1 });
    // Draw the subdued track first, then sweep the bright progress in six steps.
    const track = gsap.timeline()
      .fromTo(svg, { rotation: -360 }, { rotation: -90, duration: 1.1, ease: inOut }, 0)
      .to(dots, { strokeDashoffset: 0, autoRound: false, duration: 1.1, ease: inOut }, 0);
    // Only prepare HOME artwork; decoding the hidden WORK images defeats lazy loading.
    const assets = [document.fonts.ready, ...Array.from(document.querySelectorAll('#intro .hero img:not([loading="lazy"])'), img => img.decode ? img.decode().catch(() => {}) : Promise.resolve())];
    let timeout;
    const fallback = new Promise(r => { timeout = setTimeout(r, 2400); });
    Promise.all([Promise.race([Promise.allSettled(assets), fallback]), new Promise(r => setTimeout(r, 1200))]).then(() => {
      clearTimeout(timeout);
      load = gsap.timeline();
      load.to(status, { autoAlpha: 1, y: 0, duration: .4, ease: out }, 0)
        .to(meta, { autoAlpha: 1, y: 0, duration: .55, ease: out }, 0);
      [.13, .31, .46, .68, .84, 1].forEach((value, index) => {
        load.to(progressState, { value, duration: .16, ease: 'power1.inOut', onUpdate: paintProgress }, index * .16);
      });
      load.addLabel('ready')
        .set(dots, { strokeDasharray: '0.00294 0.00294' }, 'ready')
        .to(root.querySelector('.loading-hello'), { opacity: 0, duration: .25, ease: 'power1.out' }, 'ready')
        .to(dots, { scale: .8, duration: .85, ease: out }, 'ready+=0.15')
        .to(ring, { scale: .88, duration: .85, ease: out }, 'ready+=0.25')
        .to(label, { opacity: 1, y: 0, duration: .65, ease: out }, 'ready+=0.25')
        .call(() => {
          button.disabled = false; button.setAttribute('aria-label', 'Enter portfolio');
          root.dataset.phase = 'ready';
          button.style.cursor = 'pointer';
          status.textContent = 'READY';
          button.focus({ preventScroll: true });
        }, null, 'ready+=0.25')
        .call(() => {
          if (entering) return;
          blink = gsap.timeline({ repeat: -1, repeatDelay: 1, delay: .2 })
            .to(label, { opacity: .15, duration: .1 })
            .to(label, { opacity: 1, duration: .1 }, .5);
          if (button.matches(':hover')) hover(true);
        });
    });
    function hover(active) {
      if (button.disabled || entering) return;
      const duration = active ? .6 : .8;
      gsap.to(dots, { scale: active ? .9 : .8, duration, ease: out, overwrite: true });
      gsap.to(ring, { scale: active ? .7 : .88, duration, ease: out, overwrite: true });
    }
    button.addEventListener('pointerenter', () => hover(true));
    button.addEventListener('pointerleave', () => hover(false));
    function finish() {
      if (finished) return; finished = true;
      blink?.kill(); gsap.killTweensOf([dots, ring, label]);
      gsap.set(main, { clearProps: 'transform,transformOrigin,willChange' });
      blocked.forEach((el, i) => { el.inert = priorInert[i]; });
      root.remove(); resolve(true);
    }
    button.addEventListener('click', () => {
      if (entering || button.disabled) return;
      entering = true; load?.kill(); blink?.kill(); button.disabled = true; root.dataset.phase = 'exit';
      gsap.set(main, { scale: .8, transformOrigin: `50% ${innerHeight / 2}px`, willChange: 'transform' });
      // Two right-to-left cuts: the face clears first, followed by its backing mask.
      gsap.timeline({ onComplete: finish })
        .to('.loading-enter', { opacity: 0, duration: .18 }, 0)
        .to('.loading-access', { opacity: 1, duration: .18 }, .1)
        .to('.loading-panel', { scale: .8, duration: .5, ease: 'power3.inOut' }, 0)
        .set(root, { backgroundColor: 'transparent' }, .55)
        .to('.loading-face', { clipPath: 'inset(0 100% 0 0)', duration: .65, ease: 'power2.inOut' }, .55)
        .to('.loading-underlay', { clipPath: 'inset(0 100% 0 0)', duration: .65, ease: 'power2.inOut' }, .63)
        .set('.loading-panel', { visibility: 'hidden' }, 1.3)
        .to(root, { backgroundColor: 'transparent', duration: .01 }, 1.3)
        .to('.loading-frame,.loading-surround', { opacity: 0, duration: .22 }, 1.3)
        .to(main, { scale: 1, duration: .55, ease: 'power3.inOut' }, 1.3);
    });
  });
})();
