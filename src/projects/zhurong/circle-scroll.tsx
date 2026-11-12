import React,{useRef,useState,useLayoutEffect} from 'react';
import {createPortal} from 'react-dom';
import {useGSAP} from '@gsap/react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
gsap.registerPlugin(useGSAP,ScrollTrigger);
/** Reveal the next page through a feathered window, then hand off to its live DOM. */
export default function CircleScroll(){
 const ball=useRef<HTMLDivElement>(null),layer=useRef<HTMLDivElement>(null),preview=useRef<HTMLDivElement>(null);
 const [scene,setScene]=useState<Element|null>(null);
 useLayoutEffect(()=>{setScene(document.querySelector('#demo'));},[]);
 useGSAP(()=>{
  const trigger=ScrollTrigger.getById('hero-device-scroll');
  const timeline=trigger?.animation as gsap.core.Timeline|undefined;
  const visuals=scene?.querySelector('.case-visuals');
  const followups=document.querySelector<HTMLElement>('.zhurong-followups');
  const first=followups?.querySelector('.zhurong-case-section');
  if(!timeline||!scene||!visuals||!ball.current||!layer.current||!preview.current||!followups||!first)return;
  const ring=ball.current,overlay=layer.current,viewport=preview.current;
  // Same DOM artwork and responsive scale as the live page; only the circular
  // window changes size. Content itself never stretches with the sphere.
  const pages=Array.from(followups.children) as HTMLElement[];
  const syncPreview=()=>{
   let height=0,count=0;
   while(count<pages.length&&height<scene.clientHeight+2){height+=pages[count++].getBoundingClientRect().height;}
   if(viewport.childElementCount===count)return;
   viewport.replaceChildren(...pages.slice(0,count).map(page=>{
    const copy=page.cloneNode(true) as HTMLElement;
    copy.querySelectorAll('[id]').forEach(element=>element.removeAttribute('id'));
    copy.querySelectorAll('img').forEach(image=>{image.loading='eager';image.decoding='async';});
    return copy;
   }));
  };
  viewport.inert=true;
  syncPreview();
  const diameter=()=>Math.min(380,Math.max(180,innerWidth*.36))/3;
  const fit=()=>Math.min(innerWidth/1920,innerHeight/1040);
  // The animated arrow ends at design y=1070. Leave real viewport space below it.
  const restingY=()=>(1070-520)*fit()+Math.max(64,innerHeight*.08)+diameter()/2;
  const bottomOffset=()=>Math.max(0,restingY()+diameter()/2-innerHeight/2+32);
  // Leave the feather fully outside all four corners before releasing the pin.
  const cover=()=>(Math.hypot(innerWidth,innerHeight)+40)/diameter();
  const scrollUnit=Math.max(innerHeight*2,1800);
  const approachDuration=bottomOffset()/scrollUnit;
  const expandDuration=Math.max(innerHeight*1.25,900)/scrollUnit;
  const revealDuration=approachDuration+expandDuration;
  gsap.set(ring,{xPercent:-50,yPercent:-50,y:restingY,scale:1});
  gsap.set(overlay,{visibility:'visible'});
  gsap.set(followups,{opacity:1,visibility:'hidden'});
  timeline.to(visuals,{y:()=>-restingY(),duration:revealDuration,ease:'none'},1)
   .to(ring,{y:0,duration:revealDuration,ease:'none'},1)
   .to(ring,{scale:cover,duration:expandDuration,ease:'sine.inOut'},1+approachDuration);
  const revealEnd=timeline.duration();
  const softMask=CSS.supports('mask-image','radial-gradient(black, transparent)')||CSS.supports('-webkit-mask-image','radial-gradient(black, transparent)');
  const previousUpdate=timeline.eventCallback('onUpdate');
  const update=()=>{
   const scale=Number(gsap.getProperty(ring,'scaleX'))||1;
   const y=Number(gsap.getProperty(ring,'y'))||0;
   const radius=diameter()*scale/2;
   const progress=gsap.utils.clamp(0,1,(timeline.time()-1-approachDuration)/expandDuration);
   const feather=8+8*progress;
   viewport.style.setProperty('--iris-x',`${scene.clientWidth/2}px`);
   viewport.style.setProperty('--iris-y',`${scene.clientHeight/2+y}px`);
   viewport.style.setProperty('--iris-solid',`${Math.max(0,radius-feather/2)}px`);
   viewport.style.setProperty('--iris-clear',`${radius+feather/2}px`);
   if(!softMask)viewport.style.clipPath=`circle(${radius}px at ${scene.clientWidth/2}px ${scene.clientHeight/2+y}px)`;
   const fade=gsap.utils.clamp(0,1,progress/.35);
   const alpha=.35*(1-fade*fade*(3-2*fade));
   // Compensate for scale so the resting rim is 1px rather than growing thicker.
   ring.style.boxShadow=`0 0 0 ${1/scale}px rgba(255,255,255,${alpha})`;
   // Existing -100svh overlap places the live page exactly at viewport top when
   // the pin ends. No final opacity tween or second scroll range is necessary.
   const complete=timeline.time()>=revealEnd-.000001;
   followups.style.visibility=complete?'visible':'hidden';
   overlay.style.visibility=complete?'hidden':'visible';
   previousUpdate?.call(timeline);
  };
  timeline.eventCallback('onUpdate',update);
  const refresh=()=>{syncPreview();update();};
  ScrollTrigger.addEventListener('refresh',refresh);
  ScrollTrigger.refresh();update();
  return ()=>{
   ScrollTrigger.removeEventListener('refresh',refresh);
   timeline.eventCallback('onUpdate',previousUpdate);
   viewport.replaceChildren();
  };
 },{dependencies:[scene],scope:layer,revertOnUpdate:true});
 return scene?createPortal(<div ref={layer} className="case-orbit-layer" aria-hidden="true"><div ref={preview} className="case-orbit-preview"/><div ref={ball} className="case-orbit-ball"/></div>,scene):null;
}
