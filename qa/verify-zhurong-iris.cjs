const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/联想/node_modules/playwright');
const {pathToFileURL} = require('node:url');
const path = require('node:path');
const fs = require('node:fs/promises');
const base = process.env.PORTFOLIO_BASE || pathToFileURL(path.resolve(__dirname,'..')+path.sep).href;
const captures = path.resolve(__dirname,'../../.tmp/zhurong-soft-iris-validation');
(async () => {
  await fs.mkdir(captures,{recursive:true});
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const [width, height] of [[1047,871],[1703,871],[390,844]]) {
      const page = await browser.newPage({ viewport: { width, height } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base + 'ZHURONG.html');
      await page.waitForSelector('.case-orbit-preview > section');
      await page.evaluate(() => document.fonts.ready);
      const end = await page.locator('.zhurong-followups').evaluate(e => e.getBoundingClientRect().top + scrollY);
      const sample = () => page.evaluate(() => {
        const live = document.querySelector('.zhurong-followups');
        const preview = document.querySelector('.case-orbit-preview');
        const ball = document.querySelector('.case-orbit-ball');
        const rect = ball.getBoundingClientRect();
        return { live: getComputedStyle(live).visibility, opacity: Number(getComputedStyle(live).opacity),
          top: live.getBoundingClientRect().top, mask: getComputedStyle(preview).maskImage,
          layer: getComputedStyle(preview.parentElement).visibility,
          ring: parseFloat(getComputedStyle(ball).boxShadow.match(/0px 0px 0px ([\d.]+)px/)?.[1] || 0) * rect.width / ball.offsetWidth,
          alpha: Number(getComputedStyle(ball).boxShadow.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/)?.[1] ?? 1),
          shadow: getComputedStyle(ball).boxShadow,
          feather: parseFloat(preview.style.getPropertyValue('--iris-clear'))-parseFloat(preview.style.getPropertyValue('--iris-solid')),
          size: rect.width, y: rect.top + rect.height/2,
          previewHeight: [...preview.children].reduce((sum,e) => sum+e.getBoundingClientRect().height,0),
          overflow: document.documentElement.scrollWidth > innerWidth };
      });
      const go = async y => { await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), y); await page.waitForTimeout(350); };
      await go(0);
      const resting = await sample();
      assert(Math.abs(resting.ring-1)<.1 && Math.abs(resting.alpha-.35)<.01, 'Resting rim must be 1px and 35% opaque');
      const middle = 1800 + (end-1800)*.5;
      await go(middle);
      const growing = await sample();
      assert.equal(growing.live, 'hidden');
      assert.equal(growing.layer, 'visible');
      assert(growing.mask.startsWith('radial-gradient('), 'Only the circular edge should be feathered');
      assert(growing.previewHeight >= height, 'Preview must contain every section visible at handoff');
      assert(growing.alpha < .01, `Rim must fade out during early expansion: ${JSON.stringify(growing)}`);
      assert(growing.feather >= 8 && growing.feather <= 16, 'Feather must remain 8–16px wide');
      assert(!growing.overflow);
      await page.screenshot({ path: path.join(captures,`zhurong-iris-${width}-middle.png`) });
      await page.mouse.wheel(0, 90); await page.waitForTimeout(350);
      assert((await sample()).size > growing.size, 'Wheel must enlarge the reveal');
      await go(Math.floor(end)-1);
      await page.screenshot({ path: path.join(captures,`zhurong-iris-${width}-before.png`) });
      const covered=await page.locator('.case-orbit-preview').evaluate(e=>{
        const x=parseFloat(e.style.getPropertyValue('--iris-x')),y=parseFloat(e.style.getPropertyValue('--iris-y'));
        return parseFloat(e.style.getPropertyValue('--iris-solid'))>=Math.max(...[[0,0],[e.clientWidth,0],[0,e.clientHeight],[e.clientWidth,e.clientHeight]].map(([cx,cy])=>Math.hypot(cx-x,cy-y)));
      });
      assert(covered, 'Solid interior must cover every corner before handoff');
      await page.evaluate(y=>scrollTo(0,y),Math.ceil(end)+1);
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const handoff = await sample();
      assert.equal(handoff.live, 'visible'); assert.equal(handoff.opacity, 1);
      assert.equal(handoff.layer, 'hidden'); assert(Math.abs(handoff.top) <= 1);
      await page.screenshot({ path: path.join(captures,`zhurong-iris-${width}-after.png`) });
      await go(end+160);
      assert(Math.abs((await sample()).top+160) <= 1, 'Live content must continue scrolling naturally');
      await go(middle);
      const reversed = await sample();
      assert.equal(reversed.live, 'hidden'); assert.equal(reversed.layer, 'visible');
      assert(Math.abs(reversed.size-growing.size)<1, 'Reverse scroll must restore the same circle');
      await page.locator('.navigate-toggle').click(); await page.waitForTimeout(1800);
      assert.equal(await page.locator('.case-orbit-layer').evaluate(e => getComputedStyle(e).visibility), 'hidden');
      await page.locator('.navigate-toggle').click(); await page.waitForTimeout(1800);
      assert.equal((await sample()).layer, 'visible');
      assert.equal(await page.locator('.zhurong-followups > .zhurong-case-section').count(), 17);
      assert.deepEqual(errors, []);
      console.log(`PASS ${width}px: feathered page window, fading 1px rim, full-corner coverage, continuous handoff, reverse/wheel/navigation.`);
      await page.close();
    }
    const reduced = await browser.newPage({ reducedMotion:'reduce', viewport:{width:390,height:844} });
    await reduced.goto(new URL(base.startsWith('file:')?'dist/ZHURONG.html':'ZHURONG.html',base).href);
    await reduced.waitForSelector('.case-screen');
    assert.equal(await reduced.locator('.zhurong-followups').evaluate(e => getComputedStyle(e).visibility), 'visible');
    assert.equal(await reduced.locator('.case-orbit-layer').evaluate(e => getComputedStyle(e).visibility), 'hidden');
    console.log('PASS reduced motion: direct readable content, no hidden circular gate.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
