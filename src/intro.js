/* Centered eye-ball homepage, revealing About directly on scroll. */
(() => {
  'use strict';
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ignoreMobileResize:true});
  history.scrollRestoration='manual';
  window.scrollTo(0,0);
  const $=s=>document.querySelector(s);
  const mark=$('.mark-art'),overlay=$('.introduction'),heading=$('h1'),prompt=$('.scroll-prompt');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const circle={radius:0};
  let aboutRevealed=false;
  let timeline,scrollTween,unlocked=false,latestCircle={x:0,y:0,r:0};
  // Keep word wrapping intact while matching the source's character-by-character ink reveal.
  for(const block of document.querySelectorAll('.about-title-line,.about-copy p')){
    const walker=document.createTreeWalker(block,NodeFilter.SHOW_TEXT);
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    for(const node of nodes){
      const fragment=document.createDocumentFragment();
      for(const word of node.textContent.split(/(\s+)/)){
        if(!word.trim()){fragment.append(document.createTextNode(word));continue;}
        // Chinese characters retain natural wrapping; English words stay together.
        const parts=word.match(/[\u3400-\u9fff]|[^\u3400-\u9fff]+/gu)||[];
        for(const part of parts){
          const span=document.createElement('span');span.className='word';
          for(const char of part){const el=document.createElement('span');el.className='char';el.textContent=char;span.append(el);}
          fragment.append(span);
        }
      }
      node.replaceWith(fragment);
    }
  }
  const chars=[...overlay.querySelectorAll('.char')];
  const titleChars=[...heading.querySelectorAll('.char')];
  const bodyChars=[...overlay.querySelectorAll('.about-copy .char')];

  // One shared selection frame follows words without changing their layout.
  const selection=document.createElement('span');
  selection.className='about-word-selection';
  selection.setAttribute('aria-hidden','true');
  selection.innerHTML='<i></i><i></i><i></i><i></i>';
  heading.append(selection);
  let selectedWord=null,selectionVisible=false;
  const selectionWords=[...heading.querySelectorAll('.word')].filter(word=>!word.closest('.about-title-slash'));
  const hideSelection=()=>{
    selectedWord=null;selectionVisible=false;
    gsap.to(selection,{autoAlpha:0,duration:reduced?0:.16,overwrite:true});
  };
  function selectWord(word,event){
    if(!aboutRevealed||document.body.classList.contains('navigation-route'))return;
    const box=word.getBoundingClientRect(),base=heading.getBoundingClientRect();
    const pad=5;
    const bounds={x:box.left-base.left-pad,y:box.top-base.top-pad,width:box.width+pad*2,height:box.height+pad*2};
    if(!selectionVisible){
      const dx=(event.clientX-(box.left+box.width/2))/box.width;
      const dy=(event.clientY-(box.top+box.height/2))/box.height;
      const horizontal=Math.abs(dx)>Math.abs(dy);
      gsap.set(selection,{...bounds,autoAlpha:1,
        clipPath:horizontal?(dx<0?'inset(0 100% 0 0)':'inset(0 0 0 100%)'):(dy<0?'inset(0 0 100% 0)':'inset(100% 0 0 0)')});
    }
    selectedWord=word;selectionVisible=true;
    gsap.to(selection,{...bounds,autoAlpha:1,clipPath:'inset(-8px -8px -8px -8px)',duration:reduced?0:.28,ease:'power3.out',overwrite:true});
  }
  selectionWords.forEach(word=>word.addEventListener('pointerenter',event=>{
    if(event.pointerType!=='touch')selectWord(word,event);
  }));
  heading.addEventListener('pointerleave',hideSelection);
  heading.addEventListener('pointermove',event=>{
    if(!event.target.closest('.word')&&selectedWord)hideSelection();
  });
  ['scroll','resize','navigationchange'].forEach(name=>window.addEventListener(name,()=>{
    if(selectionVisible)hideSelection();
  },{passive:true}));


  function updateMask(){
    const w=$('.stage').clientWidth,h=$('.stage').clientHeight;
    const x=w/2,y=h/2,r=circle.radius;
    latestCircle={x,y:y+$('.stage').getBoundingClientRect().top,r};
    const revealed=r>=Math.hypot(w,h)/2;
    overlay.style.clipPath=revealed?'none':`circle(${r}px at ${x}px ${y}px)`;
    if(revealed!==aboutRevealed){
      aboutRevealed=revealed;
      window.dispatchEvent(new CustomEvent('aboutreveal',{detail:{revealed}}));
    }
    $('meta[name="theme-color"]').content=timeline?.progress()>.5?'#F3F4EF':'#0F0E11';
    window.dispatchEvent(new Event('introprogress'));
  }
  function scrollToProgress(progress,duration=1.25){
    if(!unlocked||!timeline)return;
    scrollTween?.kill();
    const state={y:scrollY};
    scrollTween=gsap.to(state,{y:timeline.scrollTrigger.end*progress,duration:reduced?0:duration,ease:'power2.inOut',onUpdate:()=>window.scrollTo(0,state.y)});
  }
  prompt.addEventListener('click',()=>scrollToProgress(1));
  const credit=$('.site-credit');
  function measureCredit(){
    const prefix=$('.credit-prefix').getBoundingClientRect().width;
    const name=$('.credit-name').getBoundingClientRect().width;
    const suffix=$('.credit-surname').getBoundingClientRect().width;
    credit.style.setProperty('--credit-prefix',`${prefix}px`);
    credit.style.setProperty('--credit-rest',`${prefix+name-suffix}px`);
    credit.style.setProperty('--credit-full',`${name}px`);
  }
  document.fonts.ready.then(measureCredit);
  window.addEventListener('resize',measureCredit,{passive:true});
  credit.addEventListener('click',()=>scrollToProgress(0));
  window.addEventListener('wheel',()=>scrollTween?.kill(),{passive:true});
  window.addEventListener('touchstart',()=>scrollTween?.kill(),{passive:true});


  function createScene(){
    const mm=gsap.matchMedia();
    mm.add('(min-width:0px)',()=>{
      circle.radius=$('.eye-tracker').getBoundingClientRect().width/2;
      gsap.set(mark,{clearProps:'transform,opacity,visibility'});
      gsap.set(overlay,{autoAlpha:0});
      gsap.set(chars,{color:'#C2C0BD'});
      timeline=gsap.timeline({onUpdate:updateMask,scrollTrigger:{trigger:'.intro',start:'top top',end:()=>`+=${Math.round(2.4*innerHeight)}`,scrub:reduced?true:.45,invalidateOnRefresh:true,onRefresh:updateMask}});
      timeline.to(mark,{scale:1.12,autoAlpha:0,duration:.35,ease:'power1.in'},0)
        .to(overlay,{autoAlpha:1,duration:.2,ease:'none'},.05)
        .fromTo(circle,{radius:()=>$('.eye-tracker').clientWidth/2},{radius:()=>Math.hypot($('.stage').clientWidth,$('.stage').clientHeight)/2+2,duration:2,ease:'power2.inOut'},0)
        .fromTo(heading,{y:reduced?0:24},{y:0,duration:.8,ease:'power1.out'},1)
        .to(titleChars,{color:'#0F0E11',duration:.4,ease:'none',stagger:{amount:1.1}},1.6)
        .to(bodyChars,{color:'#0F0E11',duration:.4,ease:'none',stagger:{amount:.9}},2.6)
        .to(prompt,{autoAlpha:0,duration:.25,ease:'none'},0);
      timeline.to('.home-corner-copy',{autoAlpha:0,y:8,duration:.25,ease:'none'},0);
      updateMask();
    });
  }
  window.addEventListener('navigationchange',()=>scrollTween?.kill());
  window.addEventListener('navigationcomplete',updateMask);
  window.addEventListener('navigationtarget',()=>{
    scrollTween?.kill();ScrollTrigger.update();
    timeline?.scrollTrigger?.getTween()?.progress?.(1);
    if(timeline)timeline.progress(timeline.scrollTrigger.progress);
    updateMask();
  });
  async function initialize(){
    await document.fonts.ready;
    const loaded = await (window.homeLoading || Promise.resolve(false));
    window.__homeEntranceStarted=true;
    window.dispatchEvent(new Event('homeentrancestart'));
    const finish=()=>{
      gsap.set('.site-credit,.navigate-toggle',{clearProps:'transform,opacity,visibility'});
      gsap.set(prompt,{autoAlpha:.85});
      gsap.set('.home-corner-copy',{autoAlpha:1,y:0});
      createScene();document.documentElement.classList.remove('loading','loading-revealing');unlocked=true;ScrollTrigger.refresh();
    };
    if(reduced||window.__projectReturn||['#about','#work','#contact'].includes(location.hash)){finish();return;}
    const entrance=gsap.timeline({onComplete:finish});
    if(!loaded)entrance.fromTo(mark,{scale:.75,opacity:0},{scale:1,opacity:1,duration:.65,ease:'power3.out'},0);
    entrance
      .fromTo('.site-credit,.navigate-toggle',{autoAlpha:0,y:-65},{autoAlpha:1,y:0,duration:.95,ease:'back.out(1.35)',stagger:.04},.05)
      .fromTo(prompt,{autoAlpha:0,y:65},{autoAlpha:.85,y:0,duration:.9,ease:'back.out(1.25)'},.18)
      .fromTo('.home-corner-copy',{autoAlpha:0,y:12},{autoAlpha:1,y:0,duration:.7,ease:'power2.out'},.05);
  }
  initialize();
  window.__introState=()=>({ready:unlocked,aboutRevealed,progress:timeline?.progress()??0,duration:timeline?.duration(),scrollEnd:timeline?.scrollTrigger.end,circle:latestCircle,theme:Number(gsap.getProperty(overlay,'opacity'))>=.5?'light':'dark',phraseIndex:0,phraseRotationActive:false});
})();
