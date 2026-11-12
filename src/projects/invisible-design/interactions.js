(() => {
  const section = document.querySelector('.invisible-video-section');
  if (!section) return;
  const video = section.querySelector('video');
  const toggle = section.querySelector('.invisible-video-toggle');
  const sound = section.querySelector('.invisible-sound-toggle');
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  const reduce = matchMedia('(prefers-reduced-motion:reduce)');
  const cursor = document.createElement('div');
  cursor.className = 'invisible-video-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = '<span class="invisible-video-cursor-disc"><svg class="invisible-cursor-pause" viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg><svg class="invisible-cursor-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>';
  document.body.append(cursor);
  video.controls = false;
  toggle.hidden = sound.hidden = false;
  const sync = () => {
    const paused = video.paused || video.ended;
    section.dataset.paused = cursor.dataset.paused = String(paused);
    toggle.setAttribute('aria-label', paused ? '播放视频' : '暂停视频');
    sound.setAttribute('aria-label', video.muted ? '开启视频声音' : '关闭视频声音');
    sound.setAttribute('aria-pressed', String(!video.muted));
  };
  const hide = () => cursor.classList.remove('is-visible');
  const xTo = window.gsap?.quickTo(cursor, 'x', { duration: .13, ease: 'power2.out' });
  const yTo = window.gsap?.quickTo(cursor, 'y', { duration: .13, ease: 'power2.out' });
  const move = event => {
    if (!fine.matches || event.pointerType === 'touch') return hide();
    const { clientX: x, clientY: y } = event;
    if (window.gsap) {
      if (reduce.matches || !cursor.classList.contains('is-visible')) {
        xTo.tween.pause(); yTo.tween.pause();
        gsap.set(cursor, { x, y });
      } else { xTo(x); yTo(y); }
    } else cursor.style.transform = `translate3d(${x}px,${y}px,0)`;
    cursor.classList.add('is-visible');
  };
  const play = () => video.play().catch(sync);
  toggle.addEventListener('click', () => { video.paused || video.ended ? play() : video.pause(); sync(); });
  sound.addEventListener('click', () => { video.muted = !video.muted; sync(); });
  toggle.addEventListener('pointerenter', move);
  toggle.addEventListener('pointermove', move);
  toggle.addEventListener('pointerleave', hide);
  document.addEventListener('mouseleave', hide);
  addEventListener('blur', hide);
  fine.addEventListener('change', hide);
  ['play', 'pause', 'ended', 'volumechange', 'error'].forEach(event => video.addEventListener(event, sync));
  // Keep playback silent while navigation or the return transition hides the page.
  let suspended = false, resume = false, offscreen = false;
  const suspend = () => {
    const blocked = offscreen || document.hidden || document.body.classList.contains('navigation-route')
      || document.documentElement.classList.contains('project-transitioning');
    if (blocked && !suspended) { resume = !video.paused; suspended = true; video.pause(); hide(); }
    else if (!blocked && suspended) { suspended = false; if (resume) play(); resume = false; }
  };
  const observer = new MutationObserver(suspend);
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', suspend);
  if (section.dataset.pauseOffscreen === 'true') {
    const visibility = new IntersectionObserver(entries => {
      offscreen = !entries[0].isIntersecting; suspend();
    }, {threshold: 0});
    visibility.observe(section);
  }
  addEventListener('pagehide', () => { video.pause(); hide(); });
  addEventListener('pageshow', event => { if (event.persisted) { suspended = false; sync(); } });
  sync();
  if (document.documentElement.classList.contains('project-transitioning')) { suspend(); resume = true; }
  else play();
})();
