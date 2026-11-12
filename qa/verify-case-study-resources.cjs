const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright');
const root = path.resolve(__dirname,'..');
const captures = path.resolve(root,'../.tmp/case-study-validation');
const hosted = process.env.PORTFOLIO_BASE || 'http://localhost:4275/';

(async()=>{
  await fs.mkdir(captures,{recursive:true});
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try {
    for (const local of process.env.CASE_MODE==='hosted'?[false]:[true,false]) {
      const page=await browser.newPage({viewport:{width:1047,height:871}});
      const failures=[],warnings=[],errors=[];
      page.on('requestfailed',r=>{
        // file:// font preloads require CORS; masks/images/scripts must not fail.
        if ((r.url().startsWith('file:') || r.url().startsWith(hosted)) && /\.(?:webp|png|svg|js|css)(?:[?#]|$)/i.test(r.url())) failures.push(r.url());
      });
      page.on('console',m=>{if(/Missing plugin|Invalid property scrollTrigger/.test(m.text())) warnings.push(m.text());});
      page.on('pageerror',e=>errors.push(e.message));
      const url=file=>local?pathToFileURL(path.join(root,file)).href:new URL(file,hosted).href;
      await page.goto(url('ZHURONG.html'),{waitUntil:'domcontentloaded'});
      await page.waitForSelector('.pin-spacer-hero-device-scroll');
      await page.waitForSelector('.case-orbit-preview > section');
      const device=page.locator('[data-testid="hero-device"]');
      const initialTransform=await device.evaluate(e=>getComputedStyle(e).transform);
      await page.evaluate(()=>scrollTo(0,1100)); await page.waitForTimeout(300);
      assert.notEqual(await device.evaluate(e=>getComputedStyle(e).transform),initialTransform,'Tablet must animate on scroll');
      assert.equal(await page.locator('.zhurong-followups > section').count(),17);
      const sections=page.locator('.zhurong-followups > section');
      for(let i=0;i<17;i++){
        await sections.nth(i).evaluate(e=>scrollTo(0,e.getBoundingClientRect().top+scrollY));
        await page.waitForTimeout(100);
        assert.equal(await sections.nth(i).evaluate(e=>getComputedStyle(e).visibility),'visible',`Chapter ${i+1} remains hidden`);
      }
      await page.screenshot({path:path.join(captures,`${local?'file':'hosted'}-zhurong-last.png`)});
      await page.goto(url('M7-MONITOR.html'),{waitUntil:'domcontentloaded'});
      for(const id of ['3985:8090','3985:8376','4048:472']){
        const mockup=page.locator(`[data-node-id="${id}"]`);
        await mockup.scrollIntoViewIfNeeded(); await page.waitForTimeout(1100);
        const state=await mockup.evaluate(async e=>{
          const mask=getComputedStyle(e).maskImage;
          const source=mask.slice(4,-1).replace(/^['"]|['"]$/g,'');
          const image=new Image(); image.src=source; await image.decode();
          const images=[...e.querySelectorAll('img')];
          await Promise.all(images.map(i=>i.decode()));
          return {mask:mask.startsWith('url('),width:image.naturalWidth,images:images.length,visible:getComputedStyle(e).visibility};
        });
        assert(state.mask&&state.width>0&&state.images>0&&state.visible==='visible',`Mockup ${id} must load with its mask`);
        await page.screenshot({path:path.join(captures,`${local?'file':'hosted'}-monitor-${id.replace(':','-')}.png`)});
      }
      assert.deepEqual(failures,[]);assert.deepEqual(warnings,[]);assert.deepEqual(errors,[]);
      console.log('PASS',local?'local file':'hosted deployment','tablet motion, circular preview, 17 readable chapters, 3 masked mockups, no failed artwork or plugin warnings');
      await page.close();
    }
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
