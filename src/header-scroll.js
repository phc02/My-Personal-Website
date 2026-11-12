/* Direction-aware visibility; magnetic hover lives on a separate inner layer. */
(() => {
  const header=document.querySelector('.hero-header');
  if(!header)return;
  // A separate layer keeps the header's existing difference blend and hover intact.
  const safety=document.createElement('div');
  safety.className='header-safety';safety.setAttribute('aria-hidden','true');
  header.before(safety);
  let replaying=false, pendingClick=false, queuedButton=null, clickSequence=0;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  header.addEventListener('click',async event=>{
    const button=event.target.closest('.site-credit,.navigate-toggle');
    if(!button||replaying)return;
    // Capture before the existing button handlers so the backing clears first.
    event.preventDefault();event.stopImmediatePropagation();
    if(pendingClick){queuedButton=button;return;}
    pendingClick=true;
    const sequence=++clickSequence;
    safety.classList.add('header-safety-routing');
    // Wait for the rendered fade, rather than a timer that can race the first paint.
    getComputedStyle(safety).opacity;
    if(!reduced.matches)await Promise.all(safety.getAnimations().filter(animation=>animation.transitionProperty==='opacity').map(animation=>animation.finished.catch(()=>{}))); 
    replaying=true;
    try{button.click();}finally{replaying=false;}
    // The fade gate ends here; a finishing menu animation must not swallow the next click.
    pendingClick=false;
    if(queuedButton){const next=queuedButton;queuedButton=null;queueMicrotask(()=>next.click());}
    const started=performance.now();let y=scrollY,stableSince=started;
    const settle=now=>{
      if(sequence!==clickSequence)return;
      if(Math.abs(scrollY-y)>.1||window.__navigationState?.().animating){stableSince=now;y=scrollY;}
      if(now-started<250||now-stableSince<180){requestAnimationFrame(settle);return;}
      syncSafety();
      safety.classList.remove('header-safety-routing');
    };
    requestAnimationFrame(settle);
  },true);

  function syncSafety(){
    const style=getComputedStyle(header);
    const height=header.offsetHeight;
    safety.style.height=`${parseFloat(style.top)+height+18}px`;
    safety.style.setProperty('--header-travel',`${height+60}px`);
    const nav=document.body.classList.contains('navigation-route');
    const work=document.body.classList.contains('work-active');
    const ending=document.body.classList.contains('work-end-active');
    const state=window.__introState?.();
    const light=state?.circle?.r>=Math.hypot(innerWidth,innerHeight)/2;
    const surface=document.querySelector(nav?'.navigation-page':ending?'#work-end':work?'#work':light?'.introduction':'.stage');
    safety.style.backgroundColor=getComputedStyle(surface).backgroundColor;
    safety.classList.toggle('header-safety-hidden',!nav&&header.classList.contains('header-scroll-hidden'));
  }
  const observer=new MutationObserver(syncSafety);
  observer.observe(header,{attributes:true,attributeFilter:['class']});
  observer.observe(document.body,{attributes:true,attributeFilter:['class']});
  ['aboutreveal','navigationchange','navigationtarget','navigationcomplete','resize','pageshow'].forEach(name=>window.addEventListener(name,syncSafety));
  document.fonts.ready.then(syncSafety);
  syncSafety();
  let lastY=window.scrollY, direction=0, distance=0, frame=0, aboutArrival=false;
  const position=()=>Math.max(0,Math.min(window.scrollY,document.documentElement.scrollHeight-innerHeight));
  const show=()=>header.classList.remove('header-scroll-hidden');
  const reset=()=>{lastY=position();direction=0;distance=0;show();};
  function update(){
    frame=0;
    const y=position(), delta=y-lastY;
    lastY=y;
    const nav=window.__navigationState?.();
    const intro=window.__introState?.();
    if(aboutArrival&&y>(intro?.scrollEnd??0)+28)aboutArrival=false;
    if(y<80||aboutArrival||nav?.open||nav?.animating||header.querySelector(':focus-visible')){
      direction=0;distance=0;show();return;
    }
    if(Math.abs(delta)<1)return;
    const next=Math.sign(delta);
    if(next!==direction){direction=next;distance=0;}
    distance+=Math.abs(delta);
    // Separate thresholds prevent tiny reversals and trackpad noise from flickering.
    if(direction>0&&distance>=28)header.classList.add('header-scroll-hidden');
    else if(direction<0&&distance>=12)show();
  }
  window.addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(update);},{passive:true});
  ['navigationchange','navigationtarget','navigationcomplete','resize','pageshow'].forEach(name=>window.addEventListener(name,reset));
  // Reveal the header once the expanding home circle has uncovered About.
  window.addEventListener('aboutreveal',event=>{
    aboutArrival=event.detail.revealed;
    if(aboutArrival)reset();
  });
  header.addEventListener('focusin',reset);
  reset();
})();
