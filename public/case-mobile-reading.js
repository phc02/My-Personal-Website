/* Mobile chapters keep exact artwork without retaining every Figma DOM/layer. */
(()=>{
 const mobile=matchMedia('(pointer:coarse), (hover:none)').matches;
 const chapters=[...document.querySelectorAll('[data-case-chapter]')];
 if(!chapters.length)return;
 if(!mobile){
  chapters.forEach(section=>{const template=section.querySelector('template[data-case-desktop]');if(template)section.replaceChildren(template.content);});
  return;
 }
 document.documentElement.classList.add('case-mobile-reading');
 const watched=new WeakSet();
 const mount=section=>{
  if(section.querySelector(':scope > .case-mobile-chapter-image'))return;
  const image=new Image();image.className='case-mobile-chapter-image';image.alt=section.getAttribute('aria-label')||'';
  image.decoding='async';image.sizes='100vw';image.srcset=section.dataset.caseSrcset;image.src=section.dataset.caseChapter;
  section.append(image);
 };
 const unmount=section=>{
  const image=section.querySelector(':scope > .case-mobile-chapter-image');if(!image)return;
  image.remove();image.removeAttribute('srcset');image.removeAttribute('src');
 };
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(entry.isIntersecting)mount(entry.target);else unmount(entry.target);
 }),{rootMargin:`${Math.min(innerHeight,1000)}px 0px`});
 const watch=section=>{
  if(watched.has(section))return;watched.add(section);
  section.querySelector('template[data-case-desktop]')?.remove();observer.observe(section);
 };
 chapters.forEach(watch);
 // The hero's circular window clones the first chapters. Its copies also need
 // their own bounded image lifetime, not the removed desktop template contents.
 new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{
  if(node.nodeType!==1)return;
  if(node.matches('[data-case-chapter]'))watch(node);
  node.querySelectorAll('[data-case-chapter]').forEach(watch);
 }))).observe(document.body,{childList:true,subtree:true});
})();
