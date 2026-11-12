const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const base = process.env.PORTFOLIO_BASE || 'http://localhost:4274/';
const routes = ['ZHURONG.html','M7-MONITOR.html','M7-DIGITAL-TWIN.html','INVISIBLE-DESIGN.html','DYSLEXIA.html'];
const url = value => new URL(value, base).href;
const settle = async page => {
  await page.waitForFunction(() => !document.documentElement.classList.contains('project-transitioning'));
  if (await page.locator('#intro').count()) await page.waitForFunction(() => window.__introState?.().ready && !window.__navigationState?.().animating);
};

(async () => {
  const browser = await chromium.launch({channel:'chrome',headless:true});
  const errors = [], missing = [];
  try {
    for (const mobile of [false,true]) {
      const page = await browser.newPage(mobile ? {viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'} : {viewport:{width:1440,height:1000}});
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(base) && !response.url().endsWith('/favicon.ico')) missing.push(response.url()); });
      await page.goto(url('index.html?project-section=work'), {waitUntil:'domcontentloaded'}); await settle(page);
      for (let i = 0; i < routes.length; i++) {
        if (i === routes.length - 1) { await page.locator('[data-work-view="grid"]').click(); await page.waitForTimeout(mobile ? 100 : 750); }
        const link = page.locator('.work-project-link').nth(i);
        await link.scrollIntoViewIfNeeded(); await page.waitForTimeout(100);
        await link.click(); await page.waitForURL('**/' + routes[i]); await settle(page);
        const position = await page.evaluate(() => JSON.parse(sessionStorage.getItem('portfolio-project-origin')).y);
        assert(await page.locator('main').isVisible());
        assert.equal(await page.locator('.home-loading').count(), 0);
        await page.locator('.work-return').click();
        await page.waitForURL(value => /(?:index|SPECIAL-intro)\.html$/.test(value.pathname)); await settle(page);
        assert.equal(await page.locator('.home-loading').count(), 0, 'Project return must bypass the welcome gate');
        assert(Math.abs(await page.evaluate(() => scrollY) - position) < 4, `${routes[i]} return changed scroll position`);
        if (i === routes.length - 1) assert(await page.locator('#work').evaluate(el => el.classList.contains('is-grid')));
        assert.equal(await page.locator('.work-project-link').count(), 5);
        console.log('PASS',mobile ? 'mobile' : 'desktop',routes[i],'enter / return');
      }
      for (const name of ['about','work','contact','home']) {
        await page.locator('.navigate-toggle').click();
        await page.waitForFunction(() => window.__navigationState().open && !window.__navigationState().animating).catch(async error=>{console.log('MENU_STATE',name,await page.evaluate(()=>({state:window.__navigationState(),hash:location.hash,body:document.body.className,html:document.documentElement.className,aria:document.querySelector('.navigate-toggle').getAttribute('aria-expanded')})));throw error;});
        await page.locator(`[data-${name}]`).click(); await settle(page);
        assert.equal(await page.evaluate(() => window.__navigationState().open), false);
        assert.equal(await page.evaluate(() => document.querySelector('main').inert), false);
        console.log('PASS',mobile ? 'mobile' : 'desktop','menu',name);
      }
      // All project-menu destinations use the same curtain, including the loading bypass.
      for (const name of ['home','about','work','contact']) {
        await page.goto(url('DYSLEXIA.html'),{waitUntil:'domcontentloaded'});
        await page.locator('.navigate-toggle').click();
        await page.waitForFunction(() => document.body.classList.contains('navigation-route') && document.activeElement === document.querySelector('.navigation-page a'));
        await page.locator(`[data-${name}]`).click();
        await page.waitForURL(value => value.pathname.endsWith('SPECIAL-intro.html')); await settle(page);
        assert.equal(await page.locator('.home-loading').count(), 0);
        assert.equal(await page.evaluate(() => location.hash), name === 'home' ? '' : '#' + name);
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.close();
    }
    assert.deepEqual(missing, []); assert.deepEqual(errors, []);
    console.log('PASS all project round trips, list/grid restoration, HOME/ABOUT/WORK/CONTACT, project-menu routes, desktop/mobile, no local 404 or script errors.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
