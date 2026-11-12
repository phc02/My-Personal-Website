/* Project-page adapter for the portfolio header; same magnetic hover module. */
(()=>{
 const header=document.querySelector('.hero-header'),toggle=header.querySelector('.navigate-toggle'),credit=header.querySelector('.work-return'),page=document.querySelector('.navigation-page'),links=page.querySelector('.navigation-links'),safety=document.querySelector('.header-safety');
 const reduce=matchMedia('(prefers-reduced-motion:reduce)');let open=false,animation,savedFocus,routing=false;
 const main=()=>document.querySelector('.zhurong-page');
 function show(){header.classList.remove('header-scroll-hidden');safety.classList.remove('header-safety-hidden')}
 function render(next){
  if(!main())return;animation?.kill();open=next;show();
  toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close navigation':'Navigate');page.setAttribute('aria-hidden',String(!open));page.inert=!open;main().inert=open;document.body.classList.toggle('navigation-route',open);
  const d=reduce.matches?0:1;document.body.style.overflow=open?'hidden':'';
  if(open){savedFocus=document.activeElement;gsap.set(page,{visibility:'visible'});const box=main().getBoundingClientRect(),viewportTop=Math.max(0,-box.top);gsap.set(main(),{transformOrigin:`50% ${viewportTop+innerHeight/2}px`,clipPath:`inset(${viewportTop}px 0 ${Math.max(0,main().offsetHeight-viewportTop-innerHeight)}px 0)`,willChange:'transform,opacity'});animation=gsap.timeline({onComplete:()=>{routing=false;page.querySelector('a').focus({preventScroll:true})}}).to(main(),{scale:0,opacity:0,duration:.85*d,ease:'power3.inOut'},0).fromTo(links,{scale:1.65,filter:reduce.matches?'none':'blur(18px)',opacity:0},{scale:1,filter:'blur(0px)',opacity:1,duration:1.05*d,ease:'power3.out'},.12*d);}
  else animation=gsap.timeline({onComplete:()=>{gsap.set(main(),{clearProps:'transform,transformOrigin,opacity,clipPath,willChange'});gsap.set(page,{visibility:'hidden'});safety.classList.remove('header-safety-routing');routing=false;savedFocus?.focus({preventScroll:true})}}).to(links,{scale:1.65,filter:reduce.matches?'none':'blur(18px)',opacity:0,duration:.65*d,ease:'power2.in'},0).to(main(),{scale:1,opacity:1,duration:.9*d,ease:'power3.inOut'},0);
 }
 async function clearSafety(){safety.classList.add('header-safety-routing');getComputedStyle(safety).opacity;if(!reduce.matches)await Promise.all(safety.getAnimations().filter(a=>a.transitionProperty==='opacity').map(a=>a.finished.catch(()=>{})))}
 async function toggleMenu(){if(routing)return;routing=true;await clearSafety();render(!open)}
 toggle.addEventListener('click',toggleMenu);
 credit.addEventListener('click',async()=>{await clearSafety();const target=new URL(page.querySelector('[data-work]').href);target.searchParams.delete('project-section');target.searchParams.set('project-return','work');if(window.projectTransitionBack){window.projectTransitionBack(target.href);}else if(history.length>1){history.back();}else{location.href=target.href;}});
 page.querySelectorAll('a').forEach(a=>{
  a.addEventListener('pointerenter',()=>window.projectPrefetch?.(a.href),{once:true});
  a.addEventListener('focus',()=>window.projectPrefetch?.(a.href),{once:true});
  a.addEventListener('click',async e=>{if(e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();await clearSafety();const name=a.hasAttribute('data-home')?'HOME':a.hasAttribute('data-about')?'ABOUT':a.hasAttribute('data-work')?'WORK':'CONTACT';if(window.projectTransitionTo)window.projectTransitionTo(a.href,name);else location.href=a.href;});
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&open)toggleMenu();if(e.key==='Tab'&&open){const list=[toggle,...page.querySelectorAll('a')];const first=list[0],last=list.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
 let lastY=scrollY,direction=0,distance=0,frame=0;
 addEventListener('scroll',()=>{if(frame)return;frame=requestAnimationFrame(()=>{frame=0;const y=Math.max(0,scrollY),delta=y-lastY;lastY=y;if(open||y<80||header.querySelector(':focus-visible')){show();return}if(Math.abs(delta)<1)return;const sign=Math.sign(delta);if(sign!==direction){direction=sign;distance=0}distance+=Math.abs(delta);if(direction>0&&distance>=28){header.classList.add('header-scroll-hidden');safety.classList.add('header-safety-hidden')}else if(direction<0&&distance>=12)show()})},{passive:true});header.addEventListener('focusin',show);
 document.fonts.ready.then(()=>{page.querySelector('.navigation-footer').style.fontSize=getComputedStyle(toggle).fontSize});
})();
