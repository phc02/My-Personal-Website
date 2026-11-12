/* Work rises over the held About scene; its curved exit leads into Contact. */
(() => {
  const section=document.querySelector('#work');
  const ending=document.querySelector('#work-end');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  let active=false,tween=null;
  let workView='list';
  const edge=document.createElementNS('http://www.w3.org/2000/svg','svg');
  edge.setAttribute('viewBox','0 0 100 100');edge.setAttribute('preserveAspectRatio','none');
  edge.setAttribute('aria-hidden','true');edge.classList.add('work-curve');
  edge.innerHTML='<path d="M0 0 H100 Q50 200 0 0Z" fill="#000"/>';
  const content=document.createElement("div");content.className="work-content";
  while(section.firstChild)content.append(section.firstChild);
  section.append(content);ending.prepend(edge);
  const projectRoutes=['ZHURONG.html','M7-MONITOR.html','M7-DIGITAL-TWIN.html','INVISIBLE-DESIGN.html','DYSLEXIA.html'];
  section.querySelectorAll('.work-row').forEach((row,index)=>{
    const projectLink=document.createElement('a');projectLink.className='work-project-link';projectLink.href=projectRoutes[index];
    // Read semantic text: innerText is empty while the return curtain hides main.
    const title=row.querySelector('h3').cloneNode(true);
    title.querySelectorAll('br').forEach(br=>br.replaceWith(document.createTextNode(' ')));
    const projectName=title.textContent.replace(/\s+/g,' ').trim();
    projectLink.setAttribute('aria-label','查看'+projectName);row.append(projectLink);
    projectLink.addEventListener('pointerenter',()=>window.projectPrefetch?.(projectLink.href),{once:true});
    projectLink.addEventListener('focus',()=>window.projectPrefetch?.(projectLink.href),{once:true});
    projectLink.addEventListener('click',event=>{
      if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
      history.replaceState({...history.state,portfolioReturn:{y:scrollY,hash:location.hash||'#work',view:workView}},'',location.href);
      try{sessionStorage.setItem('portfolio-project-origin',JSON.stringify({url:location.href,y:scrollY}))}catch{}
      if(window.projectTransitionTo){event.preventDefault();window.dispatchEvent(new Event('navigationtarget'));window.projectTransitionTo(projectLink.href,projectName);}
    });
  });
  window.addEventListener('pageshow',event=>{
    const saved=history.state?.portfolioReturn;
    if(event.persisted&&saved)requestAnimationFrame(()=>{window.scrollTo(0,saved.y);window.dispatchEvent(new Event('navigationtarget'));});
  });

  const preview=document.createElement('div');
  preview.className='work-hover-preview';preview.setAttribute('aria-hidden','true');
  const previewSources=[
    'assets/work-previews/project-1.webp','assets/work-previews/project-2.webp',
    'assets/work-previews/project-3.webp','assets/work-previews/project-4.webp',
    'assets/work-previews/project-5.webp'
  ];
  previewSources.forEach(src=>{const img=new Image();img.src=src;img.alt='';img.decoding='async';preview.append(img);});
  document.body.append(preview);
  const cursor=document.createElement('span');cursor.className='work-preview-cursor';cursor.textContent='预览';cursor.setAttribute('aria-hidden','true');document.body.append(cursor);
  const fine=matchMedia('(hover:hover) and (pointer:fine)');
  const xTo=gsap.quickTo(preview,'x',{duration:.5,ease:'power3.out'});
  const yTo=gsap.quickTo(preview,'y',{duration:.5,ease:'power3.out'});
  const tiltTo=gsap.quickTo(preview,'rotation',{duration:.6,ease:'power3.out'});
  const cursorX=gsap.quickTo(cursor,'x',{duration:.13,ease:'power2.out'});
  const cursorY=gsap.quickTo(cursor,'y',{duration:.13,ease:'power2.out'});
  let hoveredRow=null,lastPointerX=0;
  function sizePreview(index){
    const image=preview.children[index];
    const ratios=[3840/2080,3840/2816,3840/2880,1084/635,2759/2392];
    const ratio=image.naturalWidth?image.naturalWidth/image.naturalHeight:ratios[index];
    const maxWidth=Math.min(560,innerWidth*.42),maxHeight=Math.min(560,innerHeight*.58);
    const width=Math.min(maxWidth,maxHeight*ratio),height=width/ratio;
    Object.assign(preview.style,{width:`${width}px`,height:`${height}px`,marginLeft:`${-width/2}px`,marginTop:`${-height/2}px`});
  }
  function hidePreview(){
    hoveredRow?.classList.remove('is-previewed');hoveredRow=null;
    gsap.to([preview,cursor],{autoAlpha:0,scale:.92,duration:.2,overwrite:'auto'});
    tiltTo(0);
  }
  function movePreview(event,instant=false){
    const width=preview.offsetWidth,height=preview.offsetHeight,margin=20;
    // Reserve room for the maximum tilt so wide and portrait images stay in view.
    const angle=12*Math.PI/180;
    const halfX=(width*Math.cos(angle)+height*Math.sin(angle))/2;
    const halfY=(height*Math.cos(angle)+width*Math.sin(angle))/2;
    const x=gsap.utils.clamp(halfX+margin,innerWidth-halfX-margin,event.clientX);
    const y=gsap.utils.clamp(halfY+margin,innerHeight-halfY-margin,event.clientY-55);
    if(instant){gsap.set(preview,{x,y,rotation:0});gsap.set(cursor,{x:event.clientX,y:event.clientY});}
    else{xTo(x);yTo(y);cursorX(event.clientX);cursorY(event.clientY);tiltTo(reduce.matches?0:gsap.utils.clamp(-12,12,(event.clientX-lastPointerX)*.3));}
    lastPointerX=event.clientX;
  }
  [...section.querySelectorAll('.work-row')].forEach((row,index)=>{
    const enterPreview=event=>{
      if(workView==='grid'||!fine.matches||event.pointerType==='touch'||document.body.classList.contains('navigation-route'))return;
      hoveredRow?.classList.remove('is-previewed');hoveredRow=row;row.classList.add('is-previewed');
      [...preview.children].forEach((img,i)=>img.classList.toggle('is-active',i===index));
      sizePreview(index);
      movePreview(event,true);
      gsap.fromTo([preview,cursor],{autoAlpha:0,scale:.92},{autoAlpha:1,scale:1,duration:reduce.matches?0:.35,ease:'power3.out',overwrite:'auto'});
    };
    row.addEventListener('pointerenter',enterPreview);
    row.addEventListener('pointermove',event=>{
      if(hoveredRow!==row)enterPreview(event);
      else movePreview(event);
    });
    row.addEventListener('pointerleave',hidePreview);
  });
  ['scroll','resize','navigationchange','pagehide'].forEach(name=>window.addEventListener(name,()=>{if(hoveredRow)hidePreview();},{passive:true}));
  // LIST and GRID share the same semantic project rows and real links.
  const list=section.querySelector('.work-list');
  const rows=[...section.querySelectorAll('.work-row')];
  const viewButtons=[...section.querySelectorAll('[data-work-view]')];
  rows.forEach((row,index)=>{
    const media=document.createElement('div');media.className='work-grid-media';
    const image=new Image();image.src=previewSources[index];image.alt='';image.decoding='async';image.loading='lazy';
    media.append(image);row.prepend(media);
  });
  let switching=false,queuedView=null;
  function applyView(next){
    workView=next;section.classList.toggle('is-grid',next==='grid');
    viewButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.workView===next)));
  }
  function setView(next,instant=false){
    if(next!== 'list'&&next!=='grid')return;
    if(switching){queuedView=next;return;}
    if(next===workView)return;
    hidePreview();
    if(instant||reduce.matches){applyView(next);ScrollTrigger.refresh();sync();return;}
    switching=true;
    const oldHeight=list.getBoundingClientRect().height;
    gsap.to(rows,{opacity:0,y:8,duration:.14,overwrite:true,onComplete:()=>{
      applyView(next);
      const newHeight=list.getBoundingClientRect().height;
      gsap.set(list,{height:oldHeight,overflow:'hidden'});
      gsap.set(rows,{opacity:0,y:24});
      const finish=()=>{
        gsap.set(list,{clearProps:'height,overflow'});gsap.set(rows,{clearProps:'opacity,transform'});
        switching=false;ScrollTrigger.refresh();sync();
        if(queuedView){const queued=queuedView;queuedView=null;setView(queued);}
      };
      gsap.timeline({onComplete:finish})
       .to(list,{height:newHeight,duration:.5,ease:'power3.inOut'},0)
       .to(rows,{opacity:1,y:0,duration:.5,stagger:.035,ease:'power3.out'},.05);
    }});
  }
  viewButtons.forEach(button=>button.addEventListener('click',()=>setView(button.dataset.workView)));
  const restoredView=window.__projectReturn?.view||(performance.getEntriesByType('navigation')[0]?.type==='back_forward'?history.state?.portfolioReturn?.view:null);
  if(restoredView==='grid')applyView('grid');else applyView('list');
  let lastCurve=-1;
  const workTop=()=>section.getBoundingClientRect().top+scrollY;
  function scrollToY(y){
    tween?.kill();
    const state={y:scrollY};
    tween=gsap.to(state,{y,duration:reduce.matches?0:1.15,ease:'power3.inOut',onUpdate:()=>scrollTo(0,state.y)});
  }
  function sync(){
    const navigation=document.body.classList.contains('navigation-route');
    const rect={top:section.offsetTop-scrollY};
    const endTop=ending.offsetTop-scrollY;
    const progress=gsap.utils.clamp(0,1,1-endTop/innerHeight);
    const curve=reduce.matches?0:Math.round(innerHeight*(innerWidth<768?.075:.15)*(1-progress));
    if(!navigation&&curve!==lastCurve){edge.style.height=`${curve}px`;lastCurve=curve;}
    const endActive=!navigation&&endTop+curve<70;
    if(document.body.classList.contains('work-end-active')!==endActive)document.body.classList.toggle('work-end-active',endActive);
    const next=!navigation&&rect.top<95&&!endActive;
    if(next!==active){
      active=next;document.body.classList.toggle('work-active',active);
    }
  }
  document.querySelector('.site-credit').addEventListener('click',()=>{
    tween?.kill();if(location.hash==='#work')history.replaceState(null,'',location.pathname+location.search);
  },true);
  window.addEventListener('navigationcomplete',sync);
  window.addEventListener('wheel',()=>tween?.kill(),{passive:true});
  window.addEventListener('touchstart',()=>tween?.kill(),{passive:true});
  window.addEventListener('navigationchange',()=>{tween?.kill();sync();});
  let syncFrame=0;
  const scheduleSync=()=>{if(!syncFrame)syncFrame=requestAnimationFrame(()=>{syncFrame=0;sync();});};
  window.addEventListener('scroll',scheduleSync,{passive:true});
  window.addEventListener('resize',scheduleSync,{passive:true});
  ScrollTrigger.addEventListener('refresh',scheduleSync);
  scheduleSync();
  function route(){
    if(location.hash!=='#work')return;
    if(!window.__introState?.().ready){requestAnimationFrame(route);return;}
    scrollToY(workTop());
  }
  window.addEventListener('hashchange',route);route();
  window.addEventListener('pagehide',()=>{tween?.kill();cancelAnimationFrame(syncFrame);syncFrame=0;});
  window.addEventListener('pageshow',scheduleSync);
})();
