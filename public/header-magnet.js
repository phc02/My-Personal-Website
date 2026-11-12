/* Magnetic header text with the reference's power4 follow and elastic return. */
(() => {
  const fine=matchMedia('(hover:hover) and (pointer:fine)');
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const controls=[...document.querySelectorAll('.site-credit,.navigate-toggle,.work-view-icon')];
  const entries=controls.map(button=>{
    // Animate a separate layer: the hit area, text carousel and menu icon stay independent.
    const layer=document.createElement('span');
    layer.className='header-magnet';
    layer.append(...button.childNodes);button.append(layer);
    const reset=(immediate=false)=>{
      gsap.to(layer,{x:0,y:0,duration:immediate?0:1.5,ease:'elastic.out(1,.3)',overwrite:true});
    };
    button.addEventListener('pointermove',event=>{
      if(event.pointerType==='touch'||!fine.matches||reduced.matches)return;
      const rect=button.getBoundingClientRect();
      const x=gsap.utils.clamp(-.5,.5,(event.clientX-rect.left)/rect.width-.5);
      const y=gsap.utils.clamp(-.5,.5,(event.clientY-rect.top)/rect.height-.5);
      gsap.to(layer,{x:x*30,y:y*24,duration:1.5,ease:'power4.out',overwrite:true});
    });
    button.addEventListener('pointerleave',()=>reset());
    button.addEventListener('pointercancel',()=>reset(true));
    button.addEventListener('click',()=>reset());
    return {reset};
  });
  const clear=()=>entries.forEach(entry=>entry.reset(true));
  fine.addEventListener('change',clear);reduced.addEventListener('change',clear);
  window.addEventListener('blur',clear);window.addEventListener('resize',clear);
  window.addEventListener('pagehide',clear);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
})();
