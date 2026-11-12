/* Exercise first paint with deferred JS, full refresh, and the real exit timeline. */
const assert = require('node:assert/strict');
const {readFileSync, readdirSync} = require('node:fs');
const {resolve} = require('node:path');
const {spawn} = require('node:child_process');
const {chromium} = require('playwright');
const root = resolve(__dirname, '..');

(async () => {
  const port = '4292', base = `http://127.0.0.1:${port}/`;
  const server = spawn(process.execPath, ['serve.mjs'], {cwd:root,env:{...process.env,PORT:port},stdio:['ignore','pipe','pipe']});
  let browser;
  try {
    await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('error', reject); });
    const generated = resolve(root, 'dist/generated');
    const loading = readdirSync(generated).find(name => name.endsWith('.js') && readFileSync(resolve(generated,name),'utf8').includes('Circular loading gate'));
    assert(loading);
    const html = readFileSync(resolve(root,'dist/index.html'),'utf8');
    assert.match(html, /<style id="home-loading-guard">/);
    browser = await chromium.launch({channel:'chrome',headless:true});
    for (const mobile of [false,true]) {
      const page = await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile});
      await page.route('https://**/*', request => request.abort());
      // The original flash appears while this deferred script is still loading.
      await page.route('**/'+loading, async request => {
        await new Promise(resolve => setTimeout(resolve,1500));
        await request.continue();
      });
      await page.addInitScript(() => {
        window.__homeFlash = false;
        window.__gateReadyAt = null;
        const sample = () => {
          const main = document.querySelector('body > main');
          const loading = document.querySelector('.home-loading');
          if (main && document.documentElement.classList.contains('loading') && !document.documentElement.classList.contains('loading-revealing')
              && !loading && Number(getComputedStyle(main).opacity) > 0) window.__homeFlash = true;
          if (loading?.dataset.phase === 'ready' && window.__gateReadyAt === null) window.__gateReadyAt = performance.now();
          requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });
      for (const refresh of [false,true]) {
        if (refresh) await page.reload({waitUntil:'domcontentloaded'});
        else await page.goto(base, {waitUntil:'domcontentloaded'});
        await page.waitForFunction(() => window.__gateReadyAt !== null);
        const state = await page.evaluate(() => ({flash:window.__homeFlash,ready:window.__gateReadyAt,opacity:getComputedStyle(document.querySelector('main')).opacity}));
        assert.equal(state.flash,false,'HOME appeared before Loading mounted');
        assert.equal(state.opacity,'0','HOME appeared before clicking ENTER');
        assert(state.ready >= 4300 && state.ready < 5300, `Unexpected ready time: ${state.ready}ms`);
        await page.getByRole('button',{name:'Enter portfolio',exact:true}).click();
        const clicked = await page.evaluate(() => performance.now());
        await page.evaluate(() => window.homeLoading);
        const exit = await page.evaluate(() => performance.now()) - clicked;
        assert(Math.abs(exit-3000)<250, `Exit duration changed: ${exit}ms`);
        await page.waitForFunction(() => window.__introState?.().ready);
        assert.equal(await page.evaluate(() => document.documentElement.classList.contains('loading-revealing')),false);
        assert.equal(await page.locator('main').evaluate(main => main.inert),false);
        console.log('PASS',mobile?'mobile':'desktop',refresh?'refresh':'cold load',`${(state.ready/1000).toFixed(2)}s ready, ${(exit/1000).toFixed(2)}s exit, no first-paint flash`);
      }
      await page.goto(base+'?project-section=work', {waitUntil:'domcontentloaded'});
      await page.waitForFunction(() => window.__introState?.().ready && !window.__navigationState?.().animating);
      assert.equal(await page.locator('.home-loading').count(),0);
      assert.equal(await page.locator('main').evaluate(main => getComputedStyle(main).opacity),'1');
      assert.equal(new URL(page.url()).hash,'#work');
      await page.close();
    }
  } finally { await browser?.close(); server.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
