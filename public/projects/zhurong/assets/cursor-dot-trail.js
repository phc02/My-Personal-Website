/* Independently implemented canvas effect, matching the visible behavior and
 * default parameters of Helder Vilela's CursorDotTrail (specified version):
 * https://framer.com/m/CursorDotTrail-ZDqFAE.js@iLyzK205nNCuHNDP5Nsc
 * No Framer runtime or third-party component code is bundled.
 */
(() => {
  'use strict';
  const settings={size:12,hoverSize:40,border:2,spring:.15,friction:.5,trail:200,transition:.15};
  const fine=matchMedia('(any-hover: hover) and (any-pointer: fine)');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const canvas=document.createElement('canvas');
  canvas.className='cursor-dot-trail';canvas.setAttribute('aria-hidden','true');
  document.body.append(canvas);
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  const overlay=document.querySelector('.introduction');
  const target={x:0,y:0},ball={x:0,y:0,vx:0,vy:0};
  let points=[],active=false,raf=0,lastFrame=0,accumulator=0;
  let radius=6,fill=1,stroke=0,lineAlpha=0,lineWidth=0,lineProgress=0;
  let mode='dot',color='#FFFFFF',link=null,suppressed=false;
  const stepMs=1000/60;
  const eligible=()=>fine.matches&&!reduced.matches;
  const flag=(el,name)=>el?.closest(`[data-cursor="${name}"],[aria-label~="trail{${name}}"],[data-framer-name~="trail{${name}}"]`);
  const ease=(a,b)=>a+(b-a)*settings.transition;
  function resize(){
    const dpr=Math.max(1,devicePixelRatio||1);
    canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function clear(){ctx.clearRect(0,0,innerWidth,innerHeight);}
  function hide(){
    active=false;points=[];cancelAnimationFrame(raf);raf=0;clear();
    canvas.classList.remove('is-visible');
  }
  function pickMode(){
    const el=document.elementFromPoint(target.x,target.y);
    suppressed=!!flag(el,'hide')||!!el?.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),iframe');
    link=flag(el,'link');
    const card=el?.closest('[aria-label~="work-card"],[data-cursor="work-card"]');
    mode=card?'dot':link?'link':el?.closest('a,button,[role~="button"]')?'ring':'dot';
    // The white introduction is revealed through a moving circular mask.
    // Choose contrast at the actual follower position, including partial reveals.
    const scene=window.__introState?.(),circle=scene?.circle;
    const workRect=document.querySelector('#work')?.getBoundingClientRect();
    const overWork=workRect&&ball.y>=workRect.top&&ball.y<=workRect.bottom;
    const light=!overWork&&!document.body.classList.contains('navigation-route')&&overlay&&+getComputedStyle(overlay).opacity>.5&&
      (overlay.style.clipPath==='none'||circle&&Math.hypot(ball.x-circle.x,ball.y-circle.y)<=circle.r);
    color=flag(el,'invert-color')?'#FFFFFF':light?'#080808':'#FFFFFF';
  }
  function simulate(){
    ball.vx=(ball.vx+(target.x-ball.x)*settings.spring)*settings.friction;
    ball.vy=(ball.vy+(target.y-ball.y)*settings.spring)*settings.friction;
    ball.x+=ball.vx;ball.y+=ball.vy;
    radius=ease(radius,(mode==='dot'?settings.size:settings.hoverSize)/2);
    fill=ease(fill,mode==='dot'?1:0);stroke=ease(stroke,mode==='ring'?1:0);
    lineAlpha=ease(lineAlpha,mode==='link'?1:0);
    lineProgress+=(Number(mode==='link')-lineProgress)*.15;
    const rect=mode==='link'?link.getBoundingClientRect():null;
    lineWidth=ease(lineWidth,rect?rect.width*lineProgress:0);
    if(rect){ball.x=rect.left+rect.width/2;ball.y=rect.bottom;}
  }
  function draw(now){
    clear();
    if(suppressed){points=[];return;}
    if(points.length>1){
      const first=points[0],last=points.at(-1);
      if(Math.hypot(last.x-first.x,last.y-first.y)>.2){
        const gradient=ctx.createLinearGradient(first.x,first.y,last.x,last.y);
        const rgb=color==='#FFFFFF'?'255,255,255':'8,8,8';
        gradient.addColorStop(0,`rgba(${rgb},${Math.max(0,1-(now-first.time)/settings.trail)*.3})`);
        gradient.addColorStop(1,`rgba(${rgb},1)`);
        ctx.beginPath();ctx.moveTo(first.x,first.y);
        for(const p of points.slice(1))ctx.lineTo(p.x,p.y);
        ctx.globalAlpha=1;ctx.strokeStyle=gradient;ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
      }
    }
    if(mode==='link'&&link&&lineAlpha>.01){
      const rect=link.getBoundingClientRect();
      ctx.beginPath();ctx.moveTo(rect.left+(rect.width-lineWidth)/2,rect.bottom+1);
      ctx.lineTo(rect.left+(rect.width+lineWidth)/2,rect.bottom+1);
      ctx.globalAlpha=lineAlpha;ctx.strokeStyle=color;ctx.lineWidth=1;ctx.stroke();
    }else{
      ctx.beginPath();ctx.arc(ball.x,ball.y,radius,0,Math.PI*2);
      if(fill>.01){ctx.globalAlpha=fill;ctx.fillStyle=color;ctx.fill();}
      if(stroke>.01){ctx.globalAlpha=stroke;ctx.strokeStyle=color;ctx.lineWidth=settings.border;ctx.stroke();}
    }
    ctx.globalAlpha=1;
  }
  function tick(now){
    if(!active)return;
    accumulator+=Math.min(now-lastFrame,33);lastFrame=now;
    pickMode();
    // Fixed simulation steps reproduce the reference's 60Hz feel on 120/144Hz screens.
    while(accumulator>=stepMs){simulate();accumulator-=stepMs;}
    points.push({x:ball.x,y:ball.y,time:now});
    points=points.filter(p=>now-p.time<settings.trail);
    draw(now);raf=requestAnimationFrame(tick);
  }
  function move(e){
    if(!eligible()||e.pointerType==='touch'){hide();return;}
    target.x=e.clientX;target.y=e.clientY;
    if(!active){
      ball.x=target.x;ball.y=target.y;ball.vx=ball.vy=0;
      radius=6;fill=1;stroke=lineAlpha=lineWidth=lineProgress=0;points=[];
      active=true;accumulator=0;lastFrame=performance.now();
      canvas.classList.add('is-visible');raf=requestAnimationFrame(tick);
    }
  }
  resize();
  window.addEventListener('resize',resize);
  window.addEventListener('pointermove',move,{passive:true});
  window.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')hide();},{passive:true});
  document.addEventListener('pointerout',e=>{if(!e.relatedTarget)hide();});
  window.addEventListener('blur',hide);window.addEventListener('pagehide',hide);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)hide();});
  const sync=()=>{if(!eligible())hide();};
  fine.addEventListener('change',sync);reduced.addEventListener('change',sync);
  // Read-only QA information, never rendered into the page.
  window.__cursorState=()=>({active,mode,color,x:ball.x,y:ball.y,radius,fill,stroke,suppressed,
    trailLength:points.length,trailSpan:points.length?Math.hypot(points.at(-1).x-points[0].x,points.at(-1).y-points[0].y):0});
})();
