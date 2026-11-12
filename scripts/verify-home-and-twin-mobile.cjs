const assert=require('node:assert/strict');
const {resolve}=require('node:path');
const {chromium}=require('playwright');
const base=process.env.PORTFOLIO_BASE||'http://127.0.0.1:4288/';
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--autoplay-policy=document-user-activation-required']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://**/*',request=>request.abort());
  await page.addInitScript(()=>{
   window.__entranceSync=false;
   addEventListener('homeentrancestart',()=>{
    const start=performance.now();
    const sample=()=>{
     const orbit=document.querySelector('.skills-orbit');
     if(orbit&&!orbit.hidden&&orbit.dataset.motion==='entrance'
       &&gsap.getTweensOf('.site-credit').some(tween=>tween.isActive())
       &&gsap.getTweensOf('.home-corner-copy').some(tween=>tween.isActive())){
      window.__entranceSync=performance.now()-start;return;
     }
     if(performance.now()-start<1500)requestAnimationFrame(sample);
    };requestAnimationFrame(sample);
   });
  });
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Enter portfolio',exact:true}).click();
  await page.waitForFunction(()=>window.__entranceSync!==false);
  const sync=await page.evaluate(()=>window.__entranceSync);assert(sync<300,`Orbit entered late: ${sync}ms`);
  await page.waitForFunction(()=>window.__introState?.().ready);
  console.log('PASS HOME orbit/header/corner entrance overlap',Math.round(sync)+'ms');
  // Mobile browser toolbars can make the sticky stage taller than innerHeight.
  await page.addStyleTag({content:'.stage{height:960px!important}'});
  await page.evaluate(()=>{ScrollTrigger.refresh();scrollTo({top:window.__introState().scrollEnd*.85,behavior:'instant'});});
  await page.waitForFunction(()=>window.__introState().aboutRevealed);
  const entry=page.locator('.resume-entry');await entry.waitFor({state:'visible'});
  assert.equal(await entry.isEnabled(),true);assert.equal(await entry.getAttribute('aria-hidden'),'false');
  await entry.click();await page.waitForFunction(()=>document.querySelector('#resume-dialog').dataset.phase==='open');
  console.log('PASS first HOME → ABOUT envelope visible and opens with mismatched mobile viewport height');
  await page.locator('.resume-sheet').click();await page.waitForFunction(()=>!document.querySelector('#resume-dialog').open);
  const twin=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  twin.on('pageerror',error=>errors.push(error.message));
  await twin.route('https://**/*',async request=>{
   if(request.request().url().startsWith('https://media.penghaichao.com/'))return request.fulfill({path:resolve(__dirname,'../public/assets/小米汽车M7原型演示.mp4'),contentType:'video/mp4'});
   return request.abort();
  });
  // This test covers the preview video, not the separate network-dependent map.
  await twin.route('**/projects/m7-digital-twin/demo/**',request=>request.fulfill({contentType:'text/html',body:'<!doctype html><title>Map fixture</title>'}));
  await twin.goto(new URL('M7-DIGITAL-TWIN.html',base).href,{waitUntil:'domcontentloaded'});
  const size=await twin.locator('.twin-flow-link').evaluate(element=>parseFloat(getComputedStyle(element).fontSize));
  assert(size<=20*390/1920+.02,'Mobile flow link exceeds the reference caption size');
  await twin.waitForFunction(()=>{const video=document.querySelector('.twin-screen-video');return !video.paused&&video.currentTime>.15;});
  assert(await twin.locator('video').evaluate(video=>video.muted&&video.loop&&video.playsInline&&!video.controls));
  await twin.locator('video').evaluate(video=>video.pause());
  await twin.evaluate(()=>dispatchEvent(new Event('projecttransitioncomplete')));
  await twin.waitForFunction(()=>!document.querySelector('video').paused);
  console.log('PASS project 3 mobile caption size and muted inline autoplay/retry without clicking');
  assert.deepEqual(errors,[]);
  await page.close();await twin.close();
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
