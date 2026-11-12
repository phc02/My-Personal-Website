/* Original implementation of the observed six-layer scroll choreography.
 * Reference motion: https://pensatori-irrazionali.com/ (Contact / BUILD).
 * Letter silhouettes are traced from the user's supplied DESIGN image.
 */
(() => {
  'use strict';
  const word = document.querySelector('.contact-word');
  const svgSource = `<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" viewBox="0 0 669 140">${window.DESIGN_SHAPE}</svg>`;
  for (let index = 0; index < 6; index++) {
    const layer = document.createElement('div');
    layer.className = `contact-word-layer${index === 5 ? ' contact-front-layer' : ''}`;
    layer.innerHTML = `<div class="contact-paper-mask"></div>${svgSource}`;
    if (index === 5) {
      // I is a rectangle, identified by its source-image location.
      for (const path of layer.querySelectorAll('path')) {
        const transform = path.getAttribute('transform') || '';
        if (transform.startsWith('translate(361,') && !matchMedia('(prefers-reduced-motion: reduce)').matches) path.remove();
      }
      const letter = document.createElement('div');
      letter.className = 'contact-falling-i';
      letter.innerHTML = `<span class="contact-contact-text"><button class="contact-action" type="button" aria-label="显示电话号码">
  <div class="outline"></div>
  <div class="state state--default">
    <div class="icon">
      <svg
        width="1em"
        height="1em"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g style="filter: url(#contact-plane-shadow)">
          <path
            d="M14.2199 21.63C13.0399 21.63 11.3699 20.8 10.0499 16.83L9.32988 14.67L7.16988 13.95C3.20988 12.63 2.37988 10.96 2.37988 9.78001C2.37988 8.61001 3.20988 6.93001 7.16988 5.60001L15.6599 2.77001C17.7799 2.06001 19.5499 2.27001 20.6399 3.35001C21.7299 4.43001 21.9399 6.21001 21.2299 8.33001L18.3999 16.82C17.0699 20.8 15.3999 21.63 14.2199 21.63ZM7.63988 7.03001C4.85988 7.96001 3.86988 9.06001 3.86988 9.78001C3.86988 10.5 4.85988 11.6 7.63988 12.52L10.1599 13.36C10.3799 13.43 10.5599 13.61 10.6299 13.83L11.4699 16.35C12.3899 19.13 13.4999 20.12 14.2199 20.12C14.9399 20.12 16.0399 19.13 16.9699 16.35L19.7999 7.86001C20.3099 6.32001 20.2199 5.06001 19.5699 4.41001C18.9199 3.76001 17.6599 3.68001 16.1299 4.19001L7.63988 7.03001Z"
            fill="currentColor"
          ></path>
          <path
            d="M10.11 14.4C9.92005 14.4 9.73005 14.33 9.58005 14.18C9.29005 13.89 9.29005 13.41 9.58005 13.12L13.16 9.53C13.45 9.24 13.93 9.24 14.22 9.53C14.51 9.82 14.51 10.3 14.22 10.59L10.64 14.18C10.5 14.33 10.3 14.4 10.11 14.4Z"
            fill="currentColor"
          ></path>
        </g>
        <defs>
          <filter id="contact-plane-shadow">
            <fedropshadow
              dx="0"
              dy="1"
              stdDeviation="0.6"
              flood-opacity="0.5"
            ></fedropshadow>
          </filter>
        </defs>
      </svg>
    </div>
    <p><span style="--i:0">C</span><span style="--i:1">O</span><span style="--i:2">N</span><span style="--i:3">T</span><span style="--i:4">A</span><span style="--i:5">C</span><span style="--i:6">T</span><span style="--i:7">&nbsp;</span><span style="--i:8">M</span><span style="--i:9">E</span></p>
  </div>
  <div class="state state--sent">
    <div class="icon">
      <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" aria-hidden="true"><path d="M217.856 94.677333c-36.608 14.762667-60.928 38.485333-96.597333 83.2-88.618667 111.232-9.386667 332.8 194.730666 535.210667l10.581334 10.368c192 184.576 434.986667 264.533333 527.701333 184.064l3.029333-2.816-1.450666 1.194667a249.301333 249.301333 0 0 0 64.042666-77.994667c33.152-64 24.149333-130.858667-41.173333-182.954667-94.037333-75.008-157.184-77.568-219.434667-20.48l-6.997333 6.570667-18.005333 17.834667c-7.808-1.621333-19.882667-7.338667-34.730667-16.896-29.610667-19.114667-66.517333-50.901333-108.586667-92.586667-41.941333-41.642667-74.069333-78.208-93.312-107.605333l-3.882666-6.101334a120.448 120.448 0 0 1-12.245334-24.832l-0.938666-3.413333 18.133333-17.92 6.613333-6.954667c57.472-61.738667 54.912-124.373333-20.650666-217.642666-51.328-63.36-109.653333-83.328-166.826667-60.245334z m99.925333 113.493334l11.221334 14.08c37.546667 48.682667 37.888 64.853333 16.384 89.258666l-8.32 8.874667-21.12 20.821333c-45.482667 45.056-25.258667 102.314667 41.856 181.205334l14.08 16.085333 15.232 16.682667 8.106666 8.533333 16.981334 17.621333 18.176 18.261334 9.258666 9.130666 18.090667 17.450667 17.408 16.298667c5.717333 5.205333 11.306667 10.24 16.810667 15.104l16.213333 13.909333c79.616 66.56 137.216 86.570667 182.698667 41.685333l21.034666-20.992 5.546667-5.248c24.277333-22.186667 39.296-25.301333 80.725333 3.968l12.586667 9.258667 14.250667 11.093333c31.232 24.917333 34.261333 47.573333 18.602666 77.781334a165.845333 165.845333 0 0 1-26.88 36.608l-7.253333 7.338666-5.546667 5.12-5.333333 4.650667c-14.421333 14.293333-69.888 15.658667-141.184-7.722667-90.709333-29.781333-189.994667-92.074667-280.746667-182.101333-177.109333-175.658667-241.408-355.413333-188.16-422.272 26.453333-33.194667 43.648-49.92 61.653334-57.173333 19.285333-7.808 38.570667-1.194667 67.626666 34.688z" fill="currentColor"></path></svg>
    </div>
    <p><span style="--i:5">1</span><span style="--i:6">7</span><span style="--i:7">5</span><span style="--i:8">0</span><span style="--i:9">1</span><span style="--i:10">1</span><span style="--i:11">4</span><span style="--i:12">9</span><span style="--i:13">7</span><span style="--i:14">6</span><span style="--i:15">6</span></p>
  </div>
</button></span>`;
      layer.append(letter);
    }
    word.append(layer);
  }

  gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);
  const letter = document.querySelector('.contact-falling-i');
  const action = letter.querySelector('.contact-action');
  gsap.set(action,{opacity:0});
  action.disabled=true;
  const resetContact = () => {
    action.classList.remove('is-sent');
    action.setAttribute('aria-label','显示电话号码');
  };
  action.addEventListener('click',()=>{action.classList.add('is-sent');action.setAttribute('aria-label','电话号码：17501149766');});
  const media = gsap.matchMedia();
  media.add({ mobile: '(max-width: 767px)', desktop: '(min-width: 768px)', reduced: '(prefers-reduced-motion: reduce)' }, context => {
    const { mobile, reduced } = context.conditions;
    if (reduced) { gsap.set(action,{opacity:1});action.disabled=false;return; }


    const contactSection=document.querySelector('#work-end');
    // Use the section's document position, not bounds affected by navigation scaling.
    const contactTop=()=>contactSection.offsetTop;
    // This final section's layout bottom stays stable while matchMedia reverts
    // transforms. maxScroll can temporarily include the old rotated letter.
    const scrollEnd=()=>Math.max(contactTop()+3,contactTop()+contactSection.offsetHeight-innerHeight-32);
    const phaseEnd=fraction=>Math.min(contactTop()+innerHeight*fraction,scrollEnd());
    const fallStart=()=>contactTop()+Math.min(innerHeight*.2,(scrollEnd()-contactTop())*.55);
    const layers = gsap.timeline({ scrollTrigger: {
      id: 'contact-layers', trigger: '.contact-home-cta',
      start: ()=>contactTop()+2, end: ()=>phaseEnd(.4),
      scrub: 1, invalidateOnRefresh: true,
    }});
    layers.to('.contact-word-layer', {
      scale: index => 1 - index / (mobile ? 12 : 13),
      yPercent: index => index * (mobile ? 10 : 2), ease: 'none',
    }, 0);

    // Keep the source rotation and vertical travel. Horizontal travel compensates
    // for the I sitting farther right in DESIGN than it does in BUILD.
    const fall = gsap.timeline({ scrollTrigger: {
      id: 'contact-letter', trigger: '.contact-front-layer',
      start: fallStart,
      // self.start still contains the previous width's value during refresh.
      end: () => Math.max(fallStart() + 1, Math.min(fallStart() + innerHeight * (mobile ? .3 : .5), scrollEnd())),
      scrub: 1, invalidateOnRefresh: true,
    }});
    fall.to(letter, {
      y: mobile ? '35%' : '145%',
      x: () => word.clientWidth * (0.5 - 366 / 669) - (mobile ? 28 : 32),
      height: mobile ? '15rem' : '17rem', width: mobile ? '3.5rem' : '4rem',
      rotation: 90, ease: 'none',
    });

    const reveal = gsap.timeline({ paused: true });
    reveal.to(action, { opacity:1, duration:.35, ease:'power2.out' });
    let revealed = false;
    const revealLabel = forward => {
      if (forward === revealed) return;
      revealed = forward;
      action.disabled = !forward;
      if (forward) reveal.play();
      else { reveal.reverse(); }
    };
    // Reveal from the rendered scrubbed animation, rather than a separate
    // viewport threshold that may lie beyond the bottom on narrow screens.
    const syncLabel = () => {
      const progress = fall.progress();
      if (progress <= .001) resetContact();
      revealLabel(progress >= .85);
    };
    fall.eventCallback('onUpdate', syncLabel);
    // A refresh can restore the scrubbed playhead without firing onUpdate.
    ScrollTrigger.addEventListener('refresh', syncLabel);
    syncLabel();
    return () => { ScrollTrigger.removeEventListener('refresh', syncLabel); reveal.kill(); gsap.set(action,{opacity:0}); action.disabled=true; };
  });

  window.__contactState = () => ({
    scrollY, layers: ScrollTrigger.getById('contact-layers')?.progress ?? 0,
    letter: ScrollTrigger.getById('contact-letter')?.progress ?? 0,
    rotation: gsap.getProperty(letter, 'rotation'),
    label: action.classList.contains('is-sent') ? '17501149766' : 'CONTACT ME',
    triggers: ScrollTrigger.getAll().map(t => ({ id: t.vars.id, start: t.start, end: t.end })),
  });
  window.addEventListener('navigationtarget', () => {
    ScrollTrigger.update();
    ['contact-layers', 'contact-letter'].forEach(id => {
      const t = ScrollTrigger.getById(id);
      t?.getTween()?.progress(1);
      if (t?.animation) t.animation.progress(t.progress);
    });
  });
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
