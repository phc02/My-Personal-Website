(()=>{
 const buttons=[...document.querySelectorAll('.twin-step')];if(!buttons.length)return;
 const tooltip=document.createElement('div');tooltip.className='twin-tooltip';tooltip.id='twin-step-tooltip';tooltip.setAttribute('role','tooltip');tooltip.setAttribute('aria-hidden','true');
 tooltip.innerHTML='<div class="twin-tooltip-card"><div class="twin-tooltip-heading"><span class="twin-tooltip-number"></span><span class="twin-tooltip-title"></span></div><p class="twin-tooltip-description"></p></div>';
 document.body.append(tooltip);
 const card=tooltip.firstElementChild,reduce=matchMedia('(prefers-reduced-motion: reduce)');
 let active=null,raf=0,last=0,progress=0,velocity=0,follow=0,followVelocity=0,target=0;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function position(){
  if(!active)return;
  const r=active.getBoundingClientRect(),width=tooltip.offsetWidth,height=tooltip.offsetHeight;
  const above=r.top-height-18>=84;
  tooltip.dataset.placement=above?'above':'below';
  tooltip.style.left=`${clamp(r.left+r.width/2,width/2+24,innerWidth-width/2-24)}px`;
  tooltip.style.top=`${above?r.top-16:r.bottom+16}px`;
 }
 function paint(){
  card.style.opacity=String(clamp(progress,0,1));
  card.style.transform=`translate3d(${follow*.5}px,${20*(1-progress)}px,0) rotate(${follow*.45}deg) scale(${.6+.4*progress})`;
 }
 function tick(now){
  const dt=Math.min((now-last)/1000||1/60,1/30);last=now;
  // Same spring constants as the reference: entrance 260/10, pointer follow 100/15.
  velocity+=(260*((active?1:0)-progress)-10*velocity)*dt;progress+=velocity*dt;
  followVelocity+=(100*(target-follow)-15*followVelocity)*dt;follow+=followVelocity*dt;
  paint();
  if(Math.abs((active?1:0)-progress)<.001&&Math.abs(velocity)<.01&&Math.abs(target-follow)<.01&&Math.abs(followVelocity)<.01){
   progress=active?1:0;paint();raf=0;if(!active)tooltip.style.visibility='hidden';return;
  }
  raf=requestAnimationFrame(tick);
 }
 function animate(){if(reduce.matches){progress=active?1:0;follow=0;paint();if(!active)tooltip.style.visibility='hidden';return;}if(!raf){last=performance.now();raf=requestAnimationFrame(tick);}}
 function show(button){
  if(active===button)return;
  if(active){active.classList.remove('is-active');active.removeAttribute('aria-describedby');}
  active=button;button.classList.add('is-active');button.setAttribute('aria-describedby',tooltip.id);
  tooltip.querySelector('.twin-tooltip-number').textContent=`// ${button.dataset.step}`;
  tooltip.querySelector('.twin-tooltip-title').textContent=button.dataset.title;
  tooltip.querySelector('.twin-tooltip-description').textContent=button.dataset.tip;
  target=0;tooltip.style.visibility='visible';tooltip.setAttribute('aria-hidden','false');position();animate();
 }
 function hide(){if(!active)return;active.classList.remove('is-active');active.removeAttribute('aria-describedby');active=null;target=0;tooltip.setAttribute('aria-hidden','true');animate();}
 for(const button of buttons){
  button.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')show(button);});
  button.addEventListener('pointermove',event=>{if(active!==button)return;const r=button.getBoundingClientRect();target=reduce.matches?0:clamp((event.clientX-r.left-r.width/2)*.25,-14,14);animate();});
  button.addEventListener('pointerleave',()=>{if(active===button&&!button.matches(':focus-visible'))hide();});
  button.addEventListener('focus',()=>{if(button.matches(':focus-visible'))show(button);});
  button.addEventListener('blur',()=>{if(active===button)hide();});
  button.addEventListener('click',event=>{if(event.pointerType==='touch'||!matchMedia('(hover:hover)').matches)active===button?hide():show(button);});
 }
 document.addEventListener('keydown',event=>{if(event.key==='Escape')hide();});
 document.addEventListener('pointerdown',event=>{if(active&&!event.target.closest('.twin-step'))hide();});
 addEventListener('scroll',()=>{if(!active)return;const r=active.getBoundingClientRect();if(r.bottom<84||r.top>innerHeight)hide();else position();},{passive:true});
 addEventListener('resize',position,{passive:true});
})();

(()=>{
 const screen=document.querySelector('.twin-screen-window');if(!screen)return;
 const fine=matchMedia('(hover:hover) and (pointer:fine)');
 const cursor=document.createElement('div');cursor.className='twin-experience-cursor';cursor.setAttribute('aria-hidden','true');cursor.innerHTML='<span>体验</span>';document.body.append(cursor);
 let active=false,x=0,y=0,raf=0;
 function paint(){if(window.gsap){if(!active||matchMedia('(prefers-reduced-motion: reduce)').matches)gsap.set(cursor,{x,y});else gsap.to(cursor,{x,y,duration:.13,ease:'power2.out',overwrite:true});}else cursor.style.transform=`translate3d(${x}px,${y}px,0)`;raf=0;}
 function hide(){active=false;cursor.classList.remove('is-visible');document.body.classList.remove('twin-experience-active');}
 function move(event){
  if(!fine.matches||event.pointerType==='touch'){hide();return;}
  x=event.clientX;y=event.clientY;
  if(!active){paint();active=true;cursor.classList.add('is-visible');document.body.classList.add('twin-experience-active');}
  else if(!raf)raf=requestAnimationFrame(paint);
 }
 screen.addEventListener('pointerenter',move);screen.addEventListener('pointermove',move);screen.addEventListener('pointerleave',hide);
 document.addEventListener('mouseleave',hide);addEventListener('blur',hide);
 addEventListener('scroll',()=>{if(active&&!document.elementFromPoint(x,y)?.closest('.twin-screen-window'))hide();},{passive:true});
 fine.addEventListener('change',()=>{if(!fine.matches)hide();});
})();

document.querySelector('.twin-flow-link')?.addEventListener('click',event=>{
 const section=document.querySelector('#twin-development-flow');if(!section)return;
 event.preventDefault();section.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
});
