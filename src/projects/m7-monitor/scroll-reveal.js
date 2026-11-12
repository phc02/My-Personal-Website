/* Adapted from React Bits ScrollReveal (DavidHDev/react-bits).
 * Scrub/fade: opacity .1, rotation 3deg, blur 4px, stagger .05, no smoothing.
 * The reference uses a .5 unit piece span in scrub mode; duration .8 is enter-only.
 */
(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const segmenter = typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter('zh-CN', { granularity: 'word' }) : null;
  const targets = ['4048:566', '4048:475', '4048:565'].map(id => {
    const element = document.querySelector(`[data-node-id="${id}"]`);
    if (!element) return null;
    const text = document.createElement('div');
    text.className = 'monitor-scroll-reveal-text';
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    const words = [];
    nodes.forEach(node => {
      const parts = segmenter ? Array.from(segmenter.segment(node.data), item => item.segment)
        : node.data.match(/[\p{Script=Han}]|[\p{L}\p{N}]+|[^\p{L}\p{N}]/gu) || [];
      const fragment = document.createDocumentFragment();
      parts.forEach(part => {
        if (!part.trim()) { fragment.append(document.createTextNode(part)); return; }
        const word = document.createElement('span');
        word.className = 'monitor-scroll-reveal-word';
        word.textContent = part;
        fragment.append(word);
        words.push(word);
      });
      node.replaceWith(fragment);
    });
    // Keep existing paragraphs, inline emphasis, and explicit design line breaks.
    text.append(...element.childNodes);
    element.append(text);
    element.classList.add('monitor-scroll-reveal');
    return { element, text, words, id };
  }).filter(Boolean);
  const media = gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)', () => {
    targets.forEach(({ element, text, words, id }) => {
      // Chapter entrance/exit shells also move. Exclude those offsets when measuring
      // the text's scroll range so refresh and reverse scroll use stable coordinates.
      const top = () => {
        const enter = element.closest('.monitor-section-enter');
        const exit = element.closest('.monitor-section-exit');
        return element.getBoundingClientRect().top + scrollY
          - (enter ? Number(gsap.getProperty(enter, 'y')) : 0)
          - (exit ? Number(gsap.getProperty(exit, 'y')) : 0);
      };
      const height = () => element.getBoundingClientRect().height;
      const end = () => Math.min(top() + height() - innerHeight, ScrollTrigger.maxScroll(window));
      gsap.fromTo(text, { rotation: 3, transformOrigin: '0% 50%' }, {
        rotation: 0, ease: 'none',
        scrollTrigger: { id: `monitor-text-rotation-${id}`, trigger: element,
          start: () => top() - innerHeight, end, scrub: true, invalidateOnRefresh: true }
      });
      gsap.set(words, { opacity: .1, filter: 'blur(4px)' });
      gsap.to(words, {
        opacity: 1, filter: 'blur(0px)', duration: .5, stagger: .05, ease: 'none',
        scrollTrigger: { id: `monitor-text-reveal-${id}`, trigger: element,
          start: () => top() - innerHeight + .2 * Math.min(element.offsetHeight, innerHeight),
          end, scrub: true, invalidateOnRefresh: true }
      });
    });
    return () => targets.forEach(({ text, words }) => {
      words.forEach(word => { word.style.removeProperty('opacity'); word.style.removeProperty('filter'); });
      text.style.removeProperty('transform');
      text.style.removeProperty('transform-origin');
    });
  });
  document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
