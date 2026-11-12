/* Local eye-following ball, matching the supplied Eye Tracker motion settings. */
(() => {
  const ball=document.querySelector('.eye-tracker');
  const trigger=ball.closest('.brand');
  let spin=null;
  const ns='http://www.w3.org/2000/svg';
  const back=document.createElementNS(ns,'g'),front=document.createElementNS(ns,'g');
  ball.insertBefore(back,ball.querySelector(':scope > circle'));ball.append(front);
  const palette=[
    ['#713cff','#b856ff','#ff59b4'],['#9652ff','#547cff','#25d9ed'],
    ['#ff528e','#ff8463','#ffd45c'],['#306cff','#28d6ed','#6df3b7'],
    ['#e64bfa','#a156ff','#5887ff'],['#ffbb42','#ff678e','#ed4ddd']
  ];
  const defs=ball.querySelector('defs');
  const ribbons=Array.from({length:12},(_,i)=>{
    const gradient=document.createElementNS(ns,'linearGradient');
    gradient.id=`mascot-ribbon-${i}`;gradient.setAttribute('gradientUnits','userSpaceOnUse');
    palette[i%palette.length].forEach((color,j)=>{
      const stop=document.createElementNS(ns,'stop');stop.setAttribute('offset',`${j*50}%`);
      stop.setAttribute('stop-color',color);gradient.append(stop);
    });
    defs.append(gradient);
    const pair=[back,front].map(parent=>{
      const p=document.createElementNS(ns,'path');p.setAttribute('fill','none');
      p.setAttribute('stroke',`url(#${gradient.id})`);p.setAttribute('stroke-linecap','round');
      parent.append(p);return p;
    });
    return {pair,gradient,tilt:((i%6)-2.5)*.31+(i>=6?.16:0),phase:i*2.39996};
  });
  function paintRibbons(now){
    const elapsed=spin?(now-spin.start)/1000:10;
    ribbons.forEach(({pair,gradient,tilt,phase},i)=>{
      const age=elapsed-i*.025-.06;
      if(age<0||age>1.3){pair.forEach(p=>p.setAttribute('d',''));return;}
      const alpha=Math.min(1,age/.12)*Math.max(0,Math.min(1,(1.3-age)/.65));
      const angle=(spin?.x||0)*.8+phase+age*.7;
      const radius=48+(i%6)*2.4+age*8,arc=1.3*Math.sin(Math.PI*Math.min(1,age/1.3));
      const paths=['',''];let previous=-1;
      for(let k=0;k<=32;k++){
        const a=angle-arc+k/32*arc;
        const px=Math.sin(a)*radius,py=Math.cos(a)*radius*.28;
        const x=50+px*Math.cos(tilt)-py*Math.sin(tilt),y=50+px*Math.sin(tilt)+py*Math.cos(tilt);
        if(k===0){gradient.setAttribute('x1',String(x));gradient.setAttribute('y1',String(y));}
        if(k===32){gradient.setAttribute('x2',String(x));gradient.setAttribute('y2',String(y));}
        const layer=Math.cos(a)>0?1:0;
        paths[layer]+=(layer===previous?'L':'M')+x.toFixed(2)+' '+y.toFixed(2);previous=layer;
      }
      pair.forEach((p,j)=>{p.setAttribute('d',paths[j]);p.setAttribute('stroke-width',String(5.2*(1-.3*age/1.3)));p.setAttribute('opacity',String(alpha));});
    });
  }
  const eyes=[...ball.querySelectorAll('.eye')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const state={x:0,y:0,vx:0,vy:0,tx:0,ty:0};
  let frame=0,last=0,blinkStart=-Infinity,timer=0;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function draw(now){
    const yaw=Math.asin(clamp(state.x,-.92,.92))+(spin?.x||0);
    const pitch=-Math.asin(clamp(state.y,-.92,.92));
    const elapsed=now-blinkStart;
    const lid=elapsed>=0&&elapsed<160?1-.9*Math.sin(elapsed/160*Math.PI):1;
    eyes.forEach((eye,index)=>{
      const side=index===0?-.19:.19,z=Math.sqrt(1-side*side);
      const x=side*Math.cos(yaw)+z*Math.sin(yaw);
      const depth0=-side*Math.sin(yaw)+z*Math.cos(yaw);
      const depth=depth0*Math.cos(pitch),facing=clamp(depth,0,1);
      const scale=.45+.55*facing,w=12.15*scale*(.7+.3*facing),h=Math.max(.6,20.25*scale*lid);
      eye.setAttribute('transform',`translate(${50+50*x} ${50-50*depth0*Math.sin(pitch)}) rotate(${64*state.x*state.y})`);
      eye.style.opacity=depth<.05?'0':'1';
      const rect=eye.firstElementChild;
      Object.entries({x:-w/2,y:-h/2,width:w,height:h,rx:Math.min(6.075,w/2,h/2)}).forEach(([k,v])=>rect.setAttribute(k,v));
    });
  }
  function tick(now){
    const dt=last?Math.min(2.5,(now-last)/16.67):1;last=now;
    for(const axis of ['x','y']){
      const velocity='v'+axis,target='t'+axis;
      if(reduced.matches){state[axis]=state[target];state[velocity]=0;}
      else{state[velocity]+=((state[target]-state[axis])*.06-state[velocity]*.274)*dt;state[axis]+=state[velocity]*dt;}
    }
    if(spin){
      const seconds=Math.min(dt/60,.04),steps=Math.max(1,Math.ceil(seconds*120)),step=seconds/steps;
      for(let i=0;i<steps;i++){
        spin.v+=(-12.4*spin.v-38.44*(spin.x-spin.target))*step;
        spin.x+=spin.v*step;
      }
      if(now-spin.start>1800&&Math.abs(spin.x-spin.target)<.01){spin=null;trigger.removeAttribute('data-spinning');}
    }
    draw(now);paintRibbons(now);
    const resting=['x','y'].every(a=>Math.abs(state[a]-state['t'+a])<.0005&&Math.abs(state['v'+a])<.0005);
    if(!spin&&resting&&now-blinkStart>=160){frame=last=0;return;}
    frame=requestAnimationFrame(tick);
  }
  function wake(){if(!frame&&!document.hidden)frame=requestAnimationFrame(tick);}
  trigger.addEventListener('click',()=>{
    if(spin||trigger.hasAttribute('data-orbit-spinning')||window.__introState?.().progress>.02)return;
    if(reduced.matches){blinkStart=performance.now();wake();return;}
    spin={x:0,v:0,target:Math.PI*2*(Math.random()<.5?-1:1),start:performance.now()};
    trigger.setAttribute('data-spinning','');wake();
    window.dispatchEvent(new CustomEvent('mascotspin',{detail:{direction:Math.sign(spin.target)}}));
  });
  function stopSpin(){spin=null;trigger.removeAttribute('data-spinning');paintRibbons(performance.now());wake();}
  window.addEventListener('scroll',()=>{if(spin&&scrollY>20)stopSpin();},{passive:true});
  window.addEventListener('navigationchange',stopSpin);
  function home(){state.tx=state.ty=0;wake();}
  window.addEventListener('pointermove',e=>{
    if(e.pointerType==='touch'||document.hidden)return;
    const rect=ball.getBoundingClientRect();
    if(rect.bottom<0||rect.top>innerHeight)return;
    const dx=e.clientX-rect.left-rect.width/2,dy=e.clientY-rect.top-rect.height/2;
    const distance=Math.hypot(dx,dy)||1,amount=Math.min(.85,Math.tanh(distance/240)*.9);
    state.tx=dx/distance*amount;state.ty=dy/distance*amount;wake();
  },{passive:true});
  document.documentElement.addEventListener('pointerleave',home);
  window.addEventListener('blur',home);
  function scheduleBlink(delay){
    clearTimeout(timer);
    if(document.hidden||reduced.matches)return;
    timer=setTimeout(()=>{
      if(Number(getComputedStyle(ball.parentElement).opacity)>.1){blinkStart=performance.now();wake();}
      scheduleBlink(2600+Math.random()*3200);
    },delay);
  }
  function reset(){
    spin=null;trigger.removeAttribute('data-spinning');paintRibbons(0);
    cancelAnimationFrame(frame);frame=last=0;clearTimeout(timer);blinkStart=-Infinity;
    Object.keys(state).forEach(k=>state[k]=0);draw(0);scheduleBlink(2200);
  }
  document.addEventListener('visibilitychange',reset);
  reduced.addEventListener('change',reset);
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);clearTimeout(timer);frame=last=0;});
  window.addEventListener('pageshow',reset);
  draw(0);scheduleBlink(2200);
})();
