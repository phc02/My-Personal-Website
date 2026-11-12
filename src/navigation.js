/* Full-screen hash route; locally authored transition based on the supplied Forge recording. */
(() => {
  const page=document.querySelector('.navigation-page');
  const main=document.querySelector('main');
  const links=document.querySelector('.navigation-links');
  const toggle=document.querySelector('.navigate-toggle');
  const credit=document.querySelector('.site-credit');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  let open=false,animation=null,savedY=0,destinationPending=false;
  const originalTitle=document.title;
  const footer=page.querySelector('.navigation-footer');
  const syncFooterType=()=>{footer.style.fontSize=getComputedStyle(document.querySelector('.site-credit')).fontSize;};
  syncFooterType();
  window.addEventListener('resize',syncFooterType,{passive:true});
  function render(next,instant=false){
    if(next===open)return;
    open=next;animation?.kill();
    const immediate=instant||reduce.matches;
    toggle.setAttribute('aria-expanded',String(open));
    toggle.setAttribute('aria-label',open?'Close navigation':'Navigate');
    page.setAttribute('aria-hidden',String(!open));page.inert=!open;
    main.inert=open;
    document.body.classList.toggle('navigation-route',open);
    window.dispatchEvent(new Event('navigationchange'));
    document.title=open?'Navigate — Haichao':originalTitle;
    if(open){
      savedY=scrollY;
      gsap.set(page,{visibility:'visible'});
      const height=main.offsetHeight;
      const top=scrollY+main.getBoundingClientRect().top;
      const viewportTop=Math.max(0,savedY-top);
      gsap.set(main,{transformOrigin:`50% ${viewportTop+innerHeight/2}px`,clipPath:`inset(${viewportTop}px 0 ${Math.max(0,height-viewportTop-innerHeight)}px 0)`});
      animation=gsap.timeline({onComplete:()=>{if(open)page.querySelector('[data-home]').focus({preventScroll:true});}})
        .to(main,{scale:0,opacity:0,duration:immediate?0:.85,ease:'power3.inOut'},0)
        .fromTo(links,{scale:1.65,filter:immediate?'none':'blur(18px)',opacity:0},{scale:1,filter:'blur(0px)',opacity:1,duration:immediate?0:1.05,ease:'power3.out'},immediate?0:.12);
    }else{
      animation=gsap.timeline({onComplete:()=>{
        if(open)return;
        destinationPending=false;
        gsap.set(main,{clearProps:'transform,opacity,transformOrigin,clipPath'});
        gsap.set(page,{visibility:'hidden'});
        window.scrollTo(0,savedY);
        window.dispatchEvent(new Event('navigationcomplete'));
        toggle.focus({preventScroll:true});
      }})
        .to(links,{scale:1.65,filter:immediate?'none':'blur(18px)',opacity:0,duration:immediate?0:.65,ease:'power2.in'},0)
        .to(main,{scale:1,opacity:1,duration:immediate?0:.9,ease:'power3.inOut'},0);
    }
  }
  function goHome(resetScroll=false){
    if(resetScroll){goToSection('#home');return;}
    if(location.hash==='#navigate')history.replaceState(null,'',location.pathname+location.search);
    render(false);
  }
  toggle.addEventListener('click',()=>{
    if(open)goHome();
    else{history.pushState({navigation:true},'','#navigate');render(true);}
  });
  page.querySelector('[data-home]').addEventListener('click',event=>{event.preventDefault();goHome(true);});
  function goToSection(hash){
    if(!open)return;
    if(!window.__introState?.().ready){
      requestAnimationFrame(()=>{if(open)goToSection(hash);});
      return;
    }
    animation?.kill();
    // Resolve the destination while the navigation still covers the document.
    gsap.set(main,{scale:1,opacity:0,clearProps:'transformOrigin,clipPath'});
    // Scroll triggers must measure the full-size document, never the collapsed menu view.
    ScrollTrigger.refresh();
    savedY=hash==='#home' ? 0 : hash==='#about' ? (document.querySelector('#about').getBoundingClientRect().top+scrollY) : document.querySelector(hash==='#contact'?'#contact':'#work').getBoundingClientRect().top+scrollY;
    window.scrollTo({top:savedY,behavior:'instant'});
    window.dispatchEvent(new Event('navigationtarget'));
    const top=scrollY+main.getBoundingClientRect().top;
    const viewportTop=Math.max(0,savedY-top);
    gsap.set(main,{scale:0,transformOrigin:`50% ${viewportTop+innerHeight/2}px`,clipPath:`inset(${viewportTop}px 0 ${Math.max(0,main.offsetHeight-viewportTop-innerHeight)}px 0)`});
    history.replaceState(null,'',hash==='#home'?location.pathname+location.search:hash);
    render(false);
  }
  page.querySelector('[data-about]').addEventListener('click',event=>{event.preventDefault();goToSection('#about');});
  page.querySelector('[data-work]').addEventListener('click',event=>{event.preventDefault();goToSection('#work');});
  page.querySelector('[data-contact]').addEventListener('click',event=>{event.preventDefault();goToSection('#contact');});
  credit.addEventListener('click',()=>{if(open)goHome(true);});
  let routeFrame=0;
  function restoreRoute(){
    cancelAnimationFrame(routeFrame);
    if(!['#about','#contact'].includes(location.hash)){
      render(location.hash==='#navigate');
      return;
    }
    if(open){goToSection(location.hash);return;}
    // #about belongs to the fully revealed portrait scene, not the intro's top anchor.
    gsap.set(main,{opacity:0});
    const settle=()=>{
      if(!['#about','#contact'].includes(location.hash)){gsap.set(main,{clearProps:'opacity'});return;}
      const state=window.__introState?.();
      if(!state?.ready){routeFrame=requestAnimationFrame(settle);return;}
      savedY=document.querySelector(location.hash).getBoundingClientRect().top+scrollY;
      window.scrollTo({top:savedY,behavior:'instant'});
      window.dispatchEvent(new Event('navigationtarget'));
      gsap.set(main,{clearProps:'opacity'});
    };
    routeFrame=requestAnimationFrame(settle);
  }
  window.addEventListener('popstate',restoreRoute);
  window.addEventListener('hashchange',restoreRoute);
  window.addEventListener('keydown',event=>{
    if(!open)return;
    if(event.key==='Escape'){event.preventDefault();goHome();}
    if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key)&&event.target===document.body)event.preventDefault();
  });
  const blockScroll=event=>{if(open||animation?.isActive())event.preventDefault();};
  window.addEventListener('wheel',blockScroll,{passive:false});
  // Accumulate wheel input; one time-based frame loop eases toward the destination.
  let wheelTarget=0,wheelFrame=0,wheelTime=0,wheelLastY=0;
  const cancelWheel=()=>{
    if(wheelFrame)cancelAnimationFrame(wheelFrame);
    wheelFrame=0;wheelTime=0;wheelTarget=scrollY;
  };
  function advanceWheel(now){
    wheelFrame=0;
    if(open||animation?.isActive()){cancelWheel();return;}
    const dt=wheelTime?Math.min(now-wheelTime,50):16.67;
    wheelTime=now;
    const distance=wheelTarget-scrollY;
    const step=distance*(1-Math.exp(-dt/95));
    const next=Math.abs(distance)<3?wheelTarget:scrollY+Math.sign(step)*Math.max(1,Math.abs(step));
    window.scrollTo({top:next,left:scrollX,behavior:'instant'});
    wheelLastY=scrollY;
    if(Math.abs(wheelTarget-scrollY)>.75)wheelFrame=requestAnimationFrame(advanceWheel);
    else wheelTime=0;
  }
  window.addEventListener('wheel',event=>{
    if(event.defaultPrevented||!event.cancelable||event.ctrlKey||event.deltaY<=0||Math.abs(event.deltaX)>Math.abs(event.deltaY)){cancelWheel();return;}
    if(document.documentElement.classList.contains('loading')||!window.__introState?.().ready)return;
    for(let el=event.target instanceof Element?event.target:null;el&&el!==document.body;el=el.parentElement){
      if(/auto|scroll/.test(getComputedStyle(el).overflowY)&&el.scrollHeight>el.clientHeight){cancelWheel();return;}
    }
    const unit=event.deltaMode===1?16:event.deltaMode===2?innerHeight:1;
    event.preventDefault();
    const maximum=Math.max(0,document.documentElement.scrollHeight-innerHeight);
    if(!wheelFrame){wheelTarget=scrollY;wheelLastY=scrollY;wheelTime=0;}
    wheelTarget=Math.min(maximum,wheelTarget+event.deltaY*unit*.65);
    if(reduce.matches){window.scrollTo({top:wheelTarget,behavior:'instant'});return;}
    if(!wheelFrame)wheelFrame=requestAnimationFrame(advanceWheel);
  },{passive:false});
  ['touchstart','pointerdown','keydown','navigationchange','navigationtarget','resize'].forEach(name=>window.addEventListener(name,cancelWheel,{passive:true}));
  window.addEventListener('touchmove',blockScroll,{passive:false});
  reduce.addEventListener('change',()=>{if(animation?.isActive())animation.progress(1);});
  if(location.hash==='#navigate')render(true,true);
  else if(!window.__projectDestination&&['#about','#contact'].includes(location.hash))restoreRoute();
  window.__navigationState=()=>({open,animating:destinationPending||!!animation?.isActive()});
  const projectSection=window.__projectDestination||new URLSearchParams(location.search).get('project-section');
  if(['home','about','work','contact'].includes(projectSection)){
    destinationPending=true;
    const clean=new URL(location.href);clean.searchParams.delete('project-section');history.replaceState(history.state,'',clean.pathname+clean.search+clean.hash);
    const arrive=()=>{if(document.readyState!=='complete'||document.documentElement.classList.contains('loading')||!window.__introState?.().ready){requestAnimationFrame(arrive);return;}ScrollTrigger.refresh();render(true,true);goToSection('#'+projectSection);};
    requestAnimationFrame(arrive);
  }

  if(window.__projectReturn){
    const saved=window.__projectReturn;
    const restore=()=>{
      if(!window.__introState?.().ready){requestAnimationFrame(restore);return;}
      ScrollTrigger.refresh();
      const y=Number.isFinite(saved.y)?saved.y:document.querySelector('#work').getBoundingClientRect().top+scrollY;
      window.scrollTo({top:y,behavior:'instant'});window.dispatchEvent(new Event('navigationtarget'));
      if(saved.hash)history.replaceState(history.state,'',location.pathname+location.search+saved.hash);
      window.__projectReturn=null;
    };
    requestAnimationFrame(restore);
  }
})();
