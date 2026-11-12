/* Shared lightweight curtain, cached document prefetch and history restoration. */
(() => {
  const key = 'portfolio-project-transition';
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const prefetched = new Set();
  let busy = false, curtain;
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const frame = () => new Promise(requestAnimationFrame);
  function surface(label) {
    if (!curtain) {
      curtain = document.createElement('div'); curtain.className = 'project-curtain';
      curtain.setAttribute('aria-hidden', 'true');
      curtain.innerHTML = '<div class="project-curtain-panel"><div class="project-curtain-cap project-curtain-top"></div><div class="project-curtain-cap project-curtain-bottom"></div></div><div class="project-curtain-label"></div>';
      document.documentElement.append(curtain);
    }
    curtain.querySelector('.project-curtain-label').textContent = label;
    return curtain;
  }
  const animate = (el, frames, options) => el.animate(frames, {fill: 'forwards', ...options}).finished.catch(() => {});
  window.projectPrefetch = href => {
    const connection = navigator.connection;
    if (location.protocol === 'file:' || connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '')) return;
    const url = new URL(href, location.href);
    if (url.origin !== location.origin || prefetched.has(url.href)) return;
    prefetched.add(url.href);
    const link = document.createElement('link'); link.rel = 'prefetch'; link.as = 'document'; link.href = url.href;
    document.head.append(link);
  };
  async function depart(href, label, back = false) {
    if (busy) return;
    busy = true;
    const target = new URL(href, location.href);
    window.projectPrefetch(target.href);
    const layer = surface(label); document.documentElement.classList.add('project-transitioning');
    window.dispatchEvent(new Event('projecttransitionstart'));
    try { sessionStorage.setItem(key, JSON.stringify({target: target.href, label, back, origin:location.href, time: Date.now()})); } catch {}
    await Promise.all([
      animate(layer.querySelector('.project-curtain-panel'), [{transform:'translateY(110%)'},{transform:'translateY(0%)'}], {duration: reduced.matches ? 0 : 420, easing:'cubic-bezier(.7,0,.84,0)'}),
      animate(layer.querySelector('.project-curtain-top'), [{transform:'scaleY(0)'},{transform:'scaleY(1)'}], {duration: reduced.matches ? 0 : 360, easing:'cubic-bezier(.7,0,.84,0)'})
    ]);
    if (back) history.back(); else location.href = target.href;
  }
  window.projectTransitionTo = (href, label) => depart(href, label);
  window.projectTransitionBack = fallback => {
    let origin; try { origin = JSON.parse(sessionStorage.getItem('portfolio-project-origin')); } catch {}
    return origin?.url && history.state?.portfolioOrigin === origin.url && history.length > 1 ? depart(origin.url, 'WORK & EXPERIENCE', true) : depart(fallback, 'WORK & EXPERIENCE');
  };
  function consume() {
    let pending;
    try {
      pending = JSON.parse(sessionStorage.getItem(key));
      if (pending && pending.target === location.href && Date.now() - pending.time < 15000) sessionStorage.removeItem(key);
      else pending = null;
    } catch {}
    return pending;
  }
  function reset() {
    curtain?.remove(); curtain = null; busy = false;
    document.documentElement.classList.remove('project-transitioning', 'project-arriving');
    window.dispatchEvent(new Event('projecttransitioncomplete'));
  }
  async function ready(pending) {
    await frame(); await frame();
    if (document.querySelector('#intro')) {
      const until = performance.now() + 3000;
      while (!window.__introState?.().ready && performance.now() < until) await frame();
    }
    if (pending.back) {
      window.ScrollTrigger?.refresh();
      const saved = history.state?.portfolioReturn;
      if (Number.isFinite(saved?.y)) window.scrollTo({top: saved.y, behavior: 'instant'});
      window.dispatchEvent(new Event('navigationtarget'));
      await frame();
    } else {
      const image = document.querySelector('main img[fetchpriority="high"],main .twin-artboard');
      if (image && !image.complete) await Promise.race([image.decode().catch(() => {}), delay(900)]);
    }
  }
  function arrive(pending) {
    if (!pending.back && pending.origin) history.replaceState({...history.state,portfolioOrigin:pending.origin},'',location.href);
    busy = true; document.documentElement.classList.add('project-transitioning', 'project-arriving');
    const layer = surface(pending.label), panel = layer.querySelector('.project-curtain-panel');
    const label = layer.querySelector('.project-curtain-label'), bottom = layer.querySelector('.project-curtain-bottom');
    panel.style.transform = 'translateY(0)'; layer.querySelector('.project-curtain-top').style.transform = 'scaleY(0)';
    const enter = async () => {
      await ready(pending);
      const duration = reduced.matches ? 0 : 1;
      animate(label, [{opacity:0, transform:'translateY(0)'},{opacity:1, transform:'translateY(-42px)'}], {duration:500*duration,easing:'cubic-bezier(.16,1,.3,1)'});
      await delay(400 * duration);
      document.documentElement.classList.remove('project-arriving');
      // Move only the visible hero, never a several-dozen-screen-long case-study page.
      const hero = document.querySelector('main .monitor-hero,main .twin-section,main .invisible-video-section');
      if (!pending.back && hero) hero.animate([{transform:'translateY(12vh)'},{transform:'translateY(0)'}], {duration:700*duration,easing:'cubic-bezier(.16,1,.3,1)'});
      await Promise.all([
        animate(panel, [{transform:'translateY(0)'},{transform:'translateY(-110%)'}], {duration:650*duration,easing:'cubic-bezier(.65,0,.35,1)'}),
        animate(bottom, [{transform:'scaleY(1)'},{transform:'scaleY(0)'}], {duration:650*duration,delay:80*duration,easing:'cubic-bezier(.65,0,.35,1)'}),
        animate(label, [{opacity:1,transform:'translateY(-42px)'},{opacity:0,transform:'translateY(-70px)'}], {duration:400*duration})
      ]);
      reset();
    };
    if (document.readyState === 'loading') addEventListener('DOMContentLoaded', enter, {once:true});
    else enter();
  }
  const pending = consume(); if (pending) arrive(pending);
  addEventListener('pageshow', event => {
    if (!event.persisted) return;
    reset(); const pending = consume(); if (pending) arrive(pending);
  });
})();
