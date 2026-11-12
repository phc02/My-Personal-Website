const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {resolve}=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const server=spawn(process.execPath,['serve.mjs'],{cwd:resolve(__dirname,'..'),env:{...process.env,PORT:'4296'},stdio:['ignore','pipe','pipe']});let browser;
 try{
  await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no)});
  browser=await chromium.launch({channel:'chrome',headless:true});
  for(const mobile of [false,true]){
   const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile});
   await page.route('https://**/*',request=>request.abort());
   await page.addInitScript(()=>{
    window.__orbitFrames=[];
    addEventListener('homeentrancestart',()=>{
     const start=performance.now();
     const sample=()=>{
      const root=document.querySelector('.skills-orbit');
      if(root&&!root.hidden&&getComputedStyle(root).visibility==='visible'){
       const rect=root.getBoundingClientRect(),x=rect.left+rect.width/2,y=rect.top+rect.height/2;
       const cards=[...root.querySelectorAll('.skill-orbit-position')].filter(card=>Number(getComputedStyle(card).opacity)>.002);
       if(cards.length){
        const radius=Math.max(...cards.map(card=>{const box=card.getBoundingClientRect();return Math.hypot(box.left+box.width/2-x,box.top+box.height/2-y)}));
        window.__orbitFrames.push({at:performance.now()-start,radius,motion:root.dataset.motion,
         overlap:gsap.getTweensOf('.site-credit').some(t=>t.isActive())&&gsap.getTweensOf('.home-corner-copy').some(t=>t.isActive())});
       }
      }
      if(performance.now()-start<3100)requestAnimationFrame(sample);else window.__orbitSampleDone=true;
     };requestAnimationFrame(sample);
    });
   });
   await page.goto('http://127.0.0.1:4296/',{waitUntil:'domcontentloaded'});
   await page.getByRole('button',{name:'Enter portfolio',exact:true}).click();
   await page.waitForFunction(()=>window.__orbitSampleDone);
   const frames=await page.evaluate(()=>window.__orbitFrames),peak=Math.max(...frames.map(frame=>frame.radius));
   assert(frames[0].at<250,'The visible expansion started after the text entrance');
   assert(frames[0].radius<peak*.65,'The center-to-orbit expansion was hidden');
   assert(frames.some(frame=>frame.overlap),'Visible expansion did not overlap header and corner text');
   assert(frames.some(frame=>frame.motion==='cruise'),'Spin/rebound did not finish in normal orbit');
   console.log('PASS',mobile?'mobile':'desktop',`visible center expansion ${frames[0].radius.toFixed(1)}px → ${peak.toFixed(1)}px; starts ${frames[0].at.toFixed(0)}ms after text entrance cue; spin/rebound completes`);
   await page.close();
  }
 }finally{await browser?.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1});
