const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const base = process.env.PORTFOLIO_BASE || 'http://127.0.0.1:4288/';
const routes = ['ZHURONG.html', 'M7-MONITOR.html'];

(async () => {
  const browser = await chromium.launch({channel:'chrome',headless:true});
  try {
    for (const dpr of [2, 3]) {
      for (const route of routes) {
        const page = await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:dpr});
        const errors = [], missing = [];
        let documents = 0;
        page.on('pageerror', error => errors.push(error.message));
        page.on('framenavigated', frame => { if (frame === page.mainFrame()) documents++; });
        page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400 && !response.url().endsWith('/favicon.ico')) missing.push(response.url()); });
        await page.route('https://**/*', request => request.abort());
        await page.goto(new URL(route, base).href, {waitUntil:'load'});
        await page.waitForTimeout(1000);
        const token = await page.evaluate(() => window.__scrollTestDocument = crypto.randomUUID());
        assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).overscrollBehaviorY), 'none');
        assert(await page.evaluate(()=>document.documentElement.classList.contains('case-mobile-reading')));
        assert.equal(await page.locator('.zhurong-case-canvas,.monitor-case-canvas').count(),0,'Phone retained the full Figma DOM');
        const cdp = await page.context().newCDPSession(page);
        // Native touch gestures through multiple chapters, in both directions.
        for (let pass = 0; pass < 2; pass++) {
          for (const direction of [-1, 1]) {
            for (let step = 0; step < 8; step++) {
              await cdp.send('Input.synthesizeScrollGesture', {x:195,y:600,yDistance:direction*1400,speed:7000,gestureSourceType:'touch'});
            }
          }
        }
        // Visit each chapter so native lazy loading and every responsive source run.
        const chapters = page.locator('.zhurong-followups > .zhurong-case-section, .monitor-case-section');
        for (let i = 0; i < await chapters.count(); i++) {
          await chapters.nth(i).scrollIntoViewIfNeeded();
          await page.waitForTimeout(80);
        }
        await page.waitForTimeout(300);
        const sources = await page.locator('img[srcset]').evaluateAll(images => images.filter(image => image.complete && image.currentSrc).map(image => image.currentSrc));
        assert(sources.length > 0);
        assert(sources.every(source => /\/(?:case-responsive|case-mobile-chapters)\/[^/]+-(480|960|1440)\.webp$/.test(source)), 'Phone loaded desktop-size artwork');
        assert(await page.locator('.case-mobile-chapter-image').count()<=12,'Distant chapters retained their images');
        // Simulate browser toolbar height changes midway through a long document.
        await page.evaluate(() => scrollTo({top:document.documentElement.scrollHeight*.65,behavior:'instant'}));
        for (const height of [744, 844, 744, 844]) {
          await page.setViewportSize({width:390,height});
          await page.waitForTimeout(300);
          assert(await page.evaluate(() => scrollY > 500), 'Viewport height change jumped to the top');
        }
        assert.equal(await page.evaluate(() => window.__scrollTestDocument), token, 'Document was reloaded');
        assert.equal(documents, 1, 'Unexpected main-frame navigation');
        assert(await page.locator('main').isVisible());
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        if (route === 'M7-MONITOR.html') {
          assert(await page.locator('.monitor-section-exit').evaluateAll(elements => elements.every(element => getComputedStyle(element).transform === 'none')));
          assert(await page.locator('.monitor-scroll-reveal-word').evaluateAll(elements => elements.every(element => getComputedStyle(element).filter === 'none')));
        }
        assert.deepEqual(errors, []); assert.deepEqual(missing, []);
        console.log('PASS', route, 'DPR', dpr, '32 long touch gestures, bounded chapters, toolbar resize, no reload/404/JS errors',await page.evaluate(()=>({nodes:document.querySelectorAll('*').length,mounted:document.querySelectorAll('.case-mobile-chapter-image').length})));
        await page.close();
      }
    }
    for (const route of routes) {
      const page = await browser.newPage({viewport:{width:1440,height:1000}});
      await page.route('https://**/*', request => request.abort());
      await page.goto(new URL(route,base).href, {waitUntil:'load'});
      await page.waitForTimeout(500);
      assert(await page.locator('img[srcset]').evaluateAll(images => images.filter(image => image.complete && image.currentSrc).every(image => image.currentSrc === image.src)), 'Desktop original was replaced');
      console.log('PASS', route, 'desktop keeps original artwork');
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
