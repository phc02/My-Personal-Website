(()=>{
 const screen=document.querySelector('.twin-screen-window');if(!screen)return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const dialog=document.createElement('div');dialog.className='twin-demo-dialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-label','M7数字孪生交互体验');dialog.setAttribute('aria-hidden','true');
 Object.assign(dialog.style,{visibility:'hidden',pointerEvents:'none'});
 const live=document.createElement('div');live.className='twin-demo-live';
 const frame=document.createElement('iframe');frame.className='twin-demo-frame';frame.title='小米汽车M7供应地图交互Demo';frame.src=screen.dataset.demoSrc;frame.tabIndex=-1;
 Object.assign(frame.style,{opacity:'1',transformOrigin:'50% 50%'});
 const closeButton=document.createElement('button');closeButton.className='twin-demo-close';closeButton.type='button';closeButton.setAttribute('aria-label','关闭体验，返回原型');closeButton.title='关闭体验，返回原型';closeButton.innerHTML=`<span class="twin-demo-close-face"><svg viewBox="0 0 1024 1024" width="24" height="24" aria-hidden="true"><path fill="currentColor" d="M351.901 630.872c15.704 0 28.765 11.32 31.474 26.248l0.515 5.752v256c0 17.673-14.322 32-31.989 32-15.704 0-28.765-11.32-31.474-26.248l-0.515-5.752-0.051-170.368-200.664 200.76c-12.493 12.497-32.747 12.497-45.24 0-11.104-11.108-12.338-28.351-3.7-40.823l3.7-4.432L281.416 696.48l1.914-1.608H95.99c-15.704 0-28.765-11.32-31.474-26.248L64 662.872c0-15.71 11.316-28.775 26.239-31.484l5.75-0.516h255.912z m575.214 0l5.75 0.516c14.773 2.682 26.012 15.515 26.235 31.014l0.004 0.47-0.516 5.752c-2.681 14.779-15.509 26.021-31.003 26.245l-0.47 0.003h-187.34l1.913 1.608 207.458 207.53 3.702 4.431c8.636 12.472 7.403 29.715-3.702 40.823-12.367 12.372-32.342 12.496-44.862 0.371l-0.377-0.37-200.664-200.76-0.051 170.367-0.516 5.752c-2.708 14.928-15.77 26.248-31.473 26.248-17.49 0-31.702-14.042-31.985-31.47l-0.004-0.53v-256l0.515-5.752c2.682-14.779 15.51-26.021 31.003-26.244l0.47-0.004h255.913z m22.33-557.5c11.104 11.109 12.338 28.352 3.7 40.824l-3.7 4.431-207.458 207.53-1.914 1.608h187.34c15.704 0 28.765 11.32 31.474 26.247l0.515 5.753c0 15.709-11.316 28.774-26.239 31.484l-5.75 0.516H671.5c-15.704 0-28.765-11.32-31.474-26.248l-0.515-5.752v-256c0-17.674 14.322-32 31.989-32 15.704 0 28.765 11.32 31.473 26.247l0.516 5.753 0.051 170.368 200.664-200.76c12.492-12.497 32.747-12.497 45.24 0z m-875.19 0c12.368-12.371 32.343-12.495 44.863-0.37l0.377 0.37 200.664 200.76 0.051-170.367 0.516-5.753c2.708-14.927 15.77-26.247 31.473-26.247 17.49 0 31.702 14.041 31.985 31.47l0.004 0.53v256l-0.515 5.752c-2.682 14.778-15.51 26.02-31.004 26.244l-0.47 0.004H96.287l-5.75-0.516c-14.774-2.682-26.012-15.515-26.236-31.014l-0.003-0.47 0.515-5.753c2.682-14.778 15.51-26.02 31.004-26.244l0.47-0.003h187.34l-1.914-1.609L74.256 118.627l-3.702-4.431c-8.636-12.472-7.403-29.715 3.702-40.823z"/></svg></span>`;
 live.append(frame);dialog.append(live,closeButton);document.body.append(dialog);
 let active=false,ready=false,closing=false,scene=null,zoom=null,bounds=null,originalTime=0,started=false;
 function clip(r){return `inset(${r.top}px ${Math.max(0,innerWidth-r.right)}px ${Math.max(0,innerHeight-r.bottom)}px ${r.left}px round 6px)`;}
 function enter(){
  if(!active||closing||!ready||started)return;started=true;
  const r=bounds.screen,cx=r.left+r.width/2,cy=r.top+r.height/2;
  gsap.set(live,{clipPath:clip(r),autoAlpha:1});
  gsap.set(frame,{x:cx-innerWidth/2,y:cy-innerHeight/2,scale:Math.max(r.width/innerWidth,r.height/innerHeight),opacity:1});
  const duration=reduce.matches?0:1.05;
  zoom=gsap.timeline({delay:reduce.matches?0:.12,onComplete:()=>{frame.style.pointerEvents='auto';frame.tabIndex=0;scene.style.visibility='hidden';frame.focus();}});
  zoom.to(scene,{x:innerWidth/2-cx,y:innerHeight/2-cy,scale:Math.max(innerWidth/r.width,innerHeight/r.height)*1.04,duration,ease:'power3.inOut'},0)
   .to(live,{clipPath:'inset(0px 0px 0px 0px round 0px)',duration,ease:'power3.inOut'},0)
   .to(frame,{x:0,y:0,scale:1,duration,ease:'power3.inOut'},0);
 }
 function close(){
  if(!active||closing)return;closing=true;zoom?.kill();frame.style.pointerEvents='none';frame.tabIndex=-1;scene.style.visibility='visible';
  const r=bounds.screen,cx=r.left+r.width/2,cy=r.top+r.height/2,duration=reduce.matches?0:.7;
  const out=gsap.timeline({onComplete:()=>{scene.remove();scene=null;active=false;closing=false;started=false;dialog.style.visibility='hidden';dialog.style.pointerEvents='none';dialog.setAttribute('aria-hidden','true');dialog.removeAttribute('aria-modal');document.body.classList.remove('twin-demo-open','twin-experience-active');document.documentElement.classList.remove('twin-demo-open');const video=screen.querySelector('video');video.currentTime=originalTime;video.play().catch(()=>{});screen.focus({preventScroll:true});}});
  out.to(scene,{x:0,y:0,scale:1,duration,ease:'power3.inOut'},0)
   .to(live,{clipPath:clip(r),duration,ease:'power3.inOut'},0)
   .to(frame,{x:cx-innerWidth/2,y:cy-innerHeight/2,scale:Math.max(r.width/innerWidth,r.height/innerHeight),duration,ease:'power3.inOut'},0)
   .to(live,{autoAlpha:0,duration:reduce.matches?0:.12},Math.max(0,duration-.12))
   .to(closeButton,{autoAlpha:0,duration:.15},0);
 }
 function open(){
  if(active)return;active=true;closing=false;started=false;
  const source=screen.closest('.twin-section'),rect=source.getBoundingClientRect(),r=screen.getBoundingClientRect();bounds={screen:r};
  originalTime=screen.querySelector('video').currentTime;
  scene=source.cloneNode(true);scene.classList.add('twin-demo-scene');scene.setAttribute('aria-hidden','true');scene.inert=true;
  Object.assign(scene.style,{left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`,transformOrigin:`${r.left+r.width/2-rect.left}px ${r.top+r.height/2-rect.top}px`});
  const video=scene.querySelector('video');video.addEventListener('loadedmetadata',()=>{video.currentTime=originalTime;video.play().catch(()=>{});},{once:true});dialog.prepend(scene);
  dialog.style.visibility='visible';dialog.style.pointerEvents='auto';dialog.setAttribute('aria-hidden','false');dialog.setAttribute('aria-modal','true');
  document.body.classList.add('twin-demo-open');document.documentElement.classList.add('twin-demo-open');screen.querySelector('video').pause();
  gsap.set(live,{autoAlpha:0});gsap.set(closeButton,{autoAlpha:1});closeButton.focus({preventScroll:true});enter();
 }
 const face=closeButton.querySelector('.twin-demo-close-face');
 const resetClose=()=>gsap.to(face,{x:0,y:0,duration:1.5,ease:'elastic.out(1,.3)',overwrite:true});
 closeButton.addEventListener('pointermove',event=>{
  if(event.pointerType==='touch'||reduce.matches||!matchMedia('(hover:hover) and (pointer:fine)').matches)return;
  const r=closeButton.getBoundingClientRect(),x=gsap.utils.clamp(-.5,.5,(event.clientX-r.left)/r.width-.5),y=gsap.utils.clamp(-.5,.5,(event.clientY-r.top)/r.height-.5);
  gsap.to(face,{x:x*30,y:y*24,duration:1.5,ease:'power4.out',overwrite:true});
 });
 closeButton.addEventListener('pointerleave',resetClose);closeButton.addEventListener('pointercancel',resetClose);
 closeButton.onclick=()=>{resetClose();close();};
 screen.addEventListener('click',open);screen.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();open();}});
 addEventListener('message',event=>{if(event.source!==frame.contentWindow)return;if(event.data?.type==='m7-demo-close'){close();return;}if(event.data?.type==='m7-demo-ready'||event.data?.type==='m7-demo-load-error'){ready=true;enter();}});
 document.addEventListener('keydown',event=>{if(!active)return;if(event.key==='Escape'){event.preventDefault();close();}if(event.key==='Tab'&&document.activeElement===closeButton){event.preventDefault();frame.focus();}});
})();
