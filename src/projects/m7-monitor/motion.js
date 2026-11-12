/* The Figma canvas retains its width scale. Motion lives on independent shells. */
(()=>{
 const hero=document.querySelector('.monitor-hero');
 if(!hero||!window.gsap||!window.ScrollTrigger)return;
 gsap.registerPlugin(ScrollTrigger);
 ScrollTrigger.config({ignoreMobileResize:true});
 const wrap=(element,name)=>{const wrapper=document.createElement('div');wrapper.className=name;element.before(wrapper);wrapper.append(element);return wrapper;};
 const pointer=wrap(hero.querySelector('.monitor-artboard'),'monitor-hero-pointer');
 const scroll=wrap(pointer,'monitor-hero-scroll');
 const entrance=wrap(scroll,'monitor-hero-enter');
 const entries=[...document.querySelectorAll(document.documentElement.classList.contains('case-mobile-reading')?'.no-mobile-chapter-motion':'.monitor-case-section')].map(section=>{
  const enter=document.createElement('div');enter.className='monitor-section-enter';enter.append(...section.childNodes);
  const exit=document.createElement('div');exit.className='monitor-section-exit';exit.append(enter);section.append(exit);
  return {section,enter,exit};
 });
 const progress=document.createElement('div');progress.className='monitor-read-progress';progress.setAttribute('aria-hidden','true');document.body.append(progress);
 const media=gsap.matchMedia();let cancelStart=()=>{};
 media.add({all:'all',reduce:'(prefers-reduced-motion: reduce)',fine:'(hover:hover) and (pointer:fine)',desktop:'(min-width:768px)'},context=>{
  if(context.conditions.reduce)return;
  const cleanups=[],counters=[];
  const intro=gsap.timeline({paused:true,defaults:{ease:'power3.out'}})
   .fromTo(entrance,{scale:1.075},{scale:1,duration:1.35,force3D:false},0)
   .fromTo('.monitor-project',{autoAlpha:0,y:22},{autoAlpha:1,y:0,duration:.85},.18)
   .fromTo('.monitor-tags li',{autoAlpha:0,y:18},{autoAlpha:1,y:0,duration:.7,stagger:.09},.32);
  let observer,timer;
  const start=()=>{if(document.documentElement.classList.contains('project-transitioning'))return;observer?.disconnect();clearTimeout(timer);intro.play();};
  observer=new MutationObserver(start);observer.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  timer=setTimeout(()=>{observer.disconnect();intro.play();},2400);start();
  cancelStart=()=>{observer.disconnect();clearTimeout(timer);};cleanups.push(cancelStart);
  // Keep the artwork opaque and covering the hero throughout entrance and scroll.
  if(context.conditions.desktop)gsap.fromTo(scroll,{scale:1},{scale:1.035,ease:'none',force3D:false,immediateRender:false,scrollTrigger:{id:'monitor-hero-exit',trigger:hero,start:'top top',end:'bottom top',scrub:.65}});
  gsap.to('.monitor-meta',{y:-32,autoAlpha:0,ease:'none',scrollTrigger:{trigger:hero,start:'top -10%',end:'top -60%',scrub:.4}});
  gsap.to(progress,{scaleX:1,ease:'none',scrollTrigger:{id:'monitor-read-progress',trigger:document.querySelector('.zhurong-page'),start:'top top',end:'bottom bottom',scrub:.2,invalidateOnRefresh:true}});
  entries.forEach(({section,enter,exit},index)=>{
   const at=()=>section.getBoundingClientRect().top+scrollY;
   gsap.fromTo(enter,{y:context.conditions.desktop?52:0,autoAlpha:0},{y:0,autoAlpha:1,duration:.85,ease:'power3.out',force3D:false,scrollTrigger:{id:`monitor-reveal-${index}`,trigger:section,start:'top 94%',toggleActions:'play none none reverse',onEnter:()=>{enter.style.willChange=context.conditions.desktop?'transform,opacity':'opacity';},onLeave:()=>{enter.style.willChange='auto';},onLeaveBack:()=>{enter.style.willChange='auto';}}});
   // Fade only the trailing part of a chapter, after its content has been read.
   if(context.conditions.desktop)gsap.fromTo(exit,{y:0,opacity:1},{y:-24,opacity:.68,ease:'none',force3D:false,immediateRender:false,scrollTrigger:{id:`monitor-exit-${index}`,trigger:section,start:'bottom 25%',end:'bottom top',scrub:.45,invalidateOnRefresh:true}});
   if(at()<scrollY+innerHeight*.94)ScrollTrigger.getById(`monitor-reveal-${index}`)?.animation?.progress(1);
  });
  for(const id of ['3985:8105','3985:8111','3985:8117']){
   const container=document.querySelector(`[data-node-id="${id}"]`),text=container?.querySelector('p');if(!text)continue;
   const original=text.textContent,value=Number(original.trim());if(!Number.isFinite(value))continue;
   const counter={value:0};counters.push(()=>{text.textContent=original;});
   gsap.fromTo(counter,{value:0},{value,duration:1.25,ease:'power2.out',snap:{value:1},onUpdate:()=>{text.textContent=String(counter.value);},onComplete:()=>{text.textContent=original;},scrollTrigger:{trigger:container,start:'top 90%',toggleActions:'play none none reverse'}});
  }
  if(context.conditions.fine&&context.conditions.desktop){
   const xTo=gsap.quickTo(pointer,'x',{duration:.8,ease:'power3.out'}),yTo=gsap.quickTo(pointer,'y',{duration:.8,ease:'power3.out'});
   let bounds=null;const measure=()=>{bounds=hero.getBoundingClientRect();};measure();
   const move=event=>{if(!bounds||document.body.classList.contains('navigation-route')||document.documentElement.classList.contains('project-transitioning'))return;xTo((event.clientX-bounds.left)/bounds.width*14-7);yTo((event.clientY-bounds.top)/bounds.height*10-5);};
   const reset=()=>{xTo(0);yTo(0);};
   hero.addEventListener('pointerenter',measure);hero.addEventListener('pointermove',move);hero.addEventListener('pointerleave',reset);addEventListener('resize',measure);
   cleanups.push(()=>{hero.removeEventListener('pointerenter',measure);hero.removeEventListener('pointermove',move);hero.removeEventListener('pointerleave',reset);removeEventListener('resize',measure);});
  }
  const depart=()=>{
   const visible=[entrance,...entries.map(e=>e.enter)].filter(e=>{const r=e.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight;});
   gsap.to(visible,{y:'-=22',autoAlpha:.4,duration:.4,ease:'power2.in',overwrite:'auto'});
  };
  document.querySelector('.work-return')?.addEventListener('click',depart);cleanups.push(()=>document.querySelector('.work-return')?.removeEventListener('click',depart));
  // Native bfcache restores in-flight departure styles; complete them before showing.
  const pageShow=event=>{if(event.persisted){gsap.set(entrance,{autoAlpha:1,y:0,scale:1});entries.forEach(e=>{gsap.set(e.enter,{autoAlpha:1,y:0});});ScrollTrigger.refresh();}};
  addEventListener('pageshow',pageShow);cleanups.push(()=>removeEventListener('pageshow',pageShow));
  return ()=>{cleanups.forEach(fn=>fn());counters.forEach(fn=>fn());};
 });
 document.fonts.ready.then(()=>ScrollTrigger.refresh());
 addEventListener('load',()=>ScrollTrigger.refresh(),{once:true});
})();
