const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/联想/node_modules/playwright');
const base='file:///D:/002秋招+实习/Codex%20Projects/special-intro/';
const ready=p=>p.waitForFunction(()=>document.querySelector('.skills-orbit')?.dataset.motion==='cruise'
 &&!document.querySelector('.skills-orbit').hidden&&!window.__navigationState?.().animating);
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1047,height:871}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.clickOrbitFrames=[];window.mascotSpinCount=0;window.mascotSpinDirection=1;
   const point=()=>{
    const s=document.querySelector('.skill-orbit-position')?.style.transform;
    const m=s?.match(/translate3d\(([-\d.]+)px,\s*([-\d.]+)px/);
    return m?Math.atan2(Number(m[2]),Number(m[1])):null;
   };
   addEventListener('mascotspin',e=>{
    window.mascotSpinCount++;window.mascotSpinDirection=e.detail.direction;
    window.clickOrbitFrames=[point()];
   });
   function frame(){
    if(document.querySelector('.skills-orbit')?.dataset.motion==='replay')window.clickOrbitFrames.push(point());
    requestAnimationFrame(frame);
   }
   requestAnimationFrame(frame);
  });
  await page.goto(base+'SPECIAL-intro.html?project-section=home');await ready(page);await page.waitForTimeout(800);
  const continuity=await page.locator('.brand').evaluate(button=>{
   const positions=()=>[...document.querySelectorAll('.skill-orbit-position')].map(e=>e.style.transform);
   const before=positions(),random=Math.random;
   try{Math.random=()=>0;button.click();}finally{Math.random=random;}
   return{before,after:positions()};
  });
  assert.deepEqual(continuity.after,continuity.before,'Click must begin from the current layout, without resetting phase');
  assert.equal(await page.locator('.skills-orbit').getAttribute('data-motion'),'replay');
  assert(await page.locator('.brand').evaluate(e=>e.hasAttribute('data-spinning')&&e.hasAttribute('data-orbit-spinning')));
  await page.locator('.brand').evaluate(e=>{e.click();e.click();e.click();});
  assert.equal(await page.evaluate(()=>window.mascotSpinCount),1,'Rapid clicks must not stack either animation');
  await page.waitForTimeout(300);
  assert(await page.locator('.eye-tracker path[stroke]').evaluateAll(paths=>paths.some(p=>p.getAttribute('d'))),'Original coloured ribbons must still draw');
  await page.waitForFunction(()=>document.querySelector('.skills-orbit').dataset.motion==='cruise');
  const trajectory=await page.evaluate(()=>({frames:window.clickOrbitFrames.filter(a=>a!==null),direction:window.mascotSpinDirection}));
  assert.equal(trajectory.direction,-1,'Exercise a reverse-yaw mascot click');
  let total=0,reverse=0;
  for(let i=1;i<trajectory.frames.length;i++){
   let d=trajectory.frames[i]-trajectory.frames[i-1];while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;
   total+=d;if(d<0)reverse+=d;
  }
  assert(Math.abs(total-3*Math.PI)<.12,`Expected 1.5 clockwise laps, observed ${total}`);
  assert(reverse<-.005,'Lap must end with a small reverse rebound');
  assert.equal(await page.locator('.brand').evaluate(e=>e.hasAttribute('data-orbit-spinning')),false);
  await page.waitForTimeout(750);
  const moving=await page.locator('.skill-orbit-position').first().getAttribute('style');await page.waitForTimeout(350);
  assert.notEqual(await page.locator('.skill-orbit-position').first().getAttribute('style'),moving);
  await page.locator('.brand').evaluate(button=>{
   const random=Math.random;try{Math.random=()=>1;button.click();}finally{Math.random=random;}
  });
  assert.equal(await page.evaluate(()=>window.mascotSpinCount),2);
  await ready(page);
  const forward=await page.evaluate(()=>({frames:window.clickOrbitFrames.filter(a=>a!==null),direction:window.mascotSpinDirection}));
  assert.equal(forward.direction,1,'Exercise the other mascot yaw direction');
  let forwardTotal=0;
  for(let i=1;i<forward.frames.length;i++){
   let d=forward.frames[i]-forward.frames[i-1];while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;forwardTotal+=d;
  }
  assert(Math.abs(forwardTotal-3*Math.PI)<.12,'Cards must also complete 1.5 clockwise laps for the other mascot yaw');
  await page.waitForTimeout(200);await page.locator('.brand').click();
  await page.locator('.navigate-toggle').click();await page.waitForTimeout(1500);
  assert(await page.locator('.skills-orbit').evaluate(e=>e.hidden));
  assert.equal(await page.locator('.brand').evaluate(e=>e.hasAttribute('data-orbit-spinning')),false);
  await page.locator('.navigate-toggle').click();await ready(page);
  assert.equal(await page.locator('.skills-orbit').getAttribute('data-motion'),'cruise');
  assert.deepEqual(errors,[]);
  console.log(`PASS clockwise for both mascot yaw directions: ${(total*180/Math.PI).toFixed(2)}deg and ${(forwardTotal*180/Math.PI).toFixed(2)}deg; rebound, ribbons, no jump/stack, repeat and cancellation.`);
  await page.close();
  const mobile=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  await mobile.goto(base+'dist/index.html?project-section=home');await ready(mobile);await mobile.locator('.brand').tap();
  assert.equal(await mobile.locator('.skills-orbit').getAttribute('data-motion'),'replay');await ready(mobile);
  console.log('PASS mobile touch triggers the same lap and returns to cruise.');
  await mobile.close();
  const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await reduced.goto(base+'SPECIAL-intro.html?project-section=home');
  await reduced.waitForFunction(()=>document.querySelector('.skills-orbit')?.dataset.motion==='static'&&!document.querySelector('.skills-orbit').hidden);
  await reduced.locator('.brand').click();assert.equal(await reduced.locator('.skills-orbit').getAttribute('data-motion'),'static');
  console.log('PASS reduced motion retains static cards and lightweight mascot feedback.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
