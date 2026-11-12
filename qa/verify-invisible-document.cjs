const assert = require('node:assert/strict');
const {chromium} = require('C:/Users/联想/node_modules/playwright');
const {pathToFileURL} = require('node:url');
const path = require('node:path');
const original = 'https://bcnpnx6wgaz0.feishu.cn/wiki/U02dwfw2BizSzYkYrO7cva9Mnjg?from=from_copylink';
// Controlled remote response tests iframe lifecycle independently of Feishu/CDN uptime.
const fixture = '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;font:20px Arial}main{height:5000px;padding:24px}h1{font-size:28px}</style></head><body><main><h1>Reader lifecycle fixture</h1><input aria-label="Reading note"></main><script>window.readerSession=crypto.randomUUID()</script></body></html>';

(async () => {
  const browser = await chromium.launch({channel: 'chrome', headless: true});
  try {
    for (const file of ['INVISIBLE-DESIGN.html', 'dist/INVISIBLE-DESIGN.html']) {
      const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
      const errors = []; let requests = 0;
      page.on('pageerror', error => errors.push(error.message));
      await page.route(original, route => { requests++; return route.fulfill({contentType: 'text/html', body: fixture}); });
      await page.goto(pathToFileURL(path.resolve(file)).href);
      await page.waitForFunction(() => !document.querySelector('video').paused);
      assert.equal(requests, 0, 'Remote document should not delay the video opening screen');
      assert.equal(await page.locator('iframe').getAttribute('src'), null);
      const video = page.locator('video');
      await page.locator('.invisible-video-toggle').click({position: {x: 600, y: 400}});
      await page.locator('#sharing-document').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('.invisible-reader-panel').dataset.connection === 'responded');
      const child = page.frames().find(frame => frame.url() === original);
      assert(child, 'Document frame must use the user-provided URL');
      assert.equal(requests, 1);
      await page.locator('#invisible-demo-video').scrollIntoViewIfNeeded();
      assert(await video.evaluate(v => v.paused), 'A deliberate pause survives leaving and returning');
      await page.locator('.invisible-video-toggle').click({position: {x: 600, y: 400}});
      await page.locator('#sharing-document').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('video').paused);
      await child.evaluate(() => scrollTo(0, 720));
      const session = await child.evaluate(() => window.readerSession);
      const parentScroll = await page.evaluate(() => scrollY);
      const expand = page.locator('.invisible-reader-expand');
      await expand.click();
      await page.waitForFunction(() => document.querySelector('.invisible-reader-panel').matches(':popover-open'));
      await page.waitForTimeout(500);
      assert.equal(await child.evaluate(() => window.readerSession), session, 'Expanding must preserve the iframe browsing context');
      assert.equal(await child.evaluate(() => scrollY), 720, 'Expanding must preserve document reading position');
      assert.equal(requests, 1, 'Expanding must not refetch the document');
      assert(await page.locator('.hero-header').evaluate(el => el.inert));
      assert(await page.evaluate(() => document.documentElement.classList.contains('invisible-reader-open')));
      await expand.click();
      await page.waitForFunction(() => !document.querySelector('.invisible-reader-panel').classList.contains('is-expanded'));
      assert.equal(await child.evaluate(() => window.readerSession), session);
      assert.equal(await child.evaluate(() => scrollY), 720);
      assert(Math.abs(await page.evaluate(() => scrollY) - parentScroll) < 2);
      assert.equal(await page.locator('.hero-header').evaluate(el => el.inert), false);
      assert(await expand.evaluate(el => document.activeElement === el));
      assert.equal(requests, 1);
      await expand.click(); await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.documentElement.classList.contains('invisible-reader-open'));
      assert.equal(await child.evaluate(() => window.readerSession), session, 'Rapid close must also preserve the frame');
      await expand.click(); await page.waitForTimeout(500);
      await page.locator('.invisible-reader-reload').focus(); await page.keyboard.press('Tab');
      assert(await expand.evaluate(el => el === document.activeElement), 'Keyboard focus must stay in expanded controls');
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.documentElement.classList.contains('invisible-reader-open'));
      await page.locator('.invisible-reader-reload').click();
      await page.waitForFunction(() => document.querySelector('.invisible-reader-panel').dataset.connection === 'responded');
      assert.equal(requests, 2, 'Only explicit reload should replace the browsing context');
      for (const width of [320, 390, 512, 789, 1280, 1703]) {
        await page.setViewportSize({width, height: 871});
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Horizontal overflow at ' + width);
      }
      assert.equal(await page.locator('.invisible-reader-actions a').getAttribute('href'), original);
      assert.deepEqual(errors, []);
      await page.close();
      console.log('PASS', file, ': lazy loading, video pause intent, same iframe and reading position, expand/collapse, rapid close, focus, explicit reload, six viewport widths.');
    }
    const mobile = await browser.newPage({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true, reducedMotion: 'reduce'});
    await mobile.route(original, route => route.fulfill({contentType: 'text/html', body: fixture}));
    await mobile.goto(pathToFileURL(path.resolve('dist/INVISIBLE-DESIGN.html')).href);
    await mobile.locator('#sharing-document').scrollIntoViewIfNeeded();
    await mobile.locator('.invisible-reader-expand').tap();
    assert(await mobile.locator('.invisible-reader-panel').evaluate(el => el.matches(':popover-open')));
    await mobile.locator('.invisible-reader-expand').tap();
    assert.equal(await mobile.locator('.invisible-reader-panel').evaluate(el => el.matches(':popover-open')), false);
    await mobile.close();
    const slow = await browser.newPage({viewport: {width: 1047, height: 871}, reducedMotion: 'reduce'});
    let pendingRoute;
    await slow.route(original, route => { pendingRoute = route; });
    await slow.goto(pathToFileURL(path.resolve('INVISIBLE-DESIGN.html')).href);
    await slow.clock.install();
    await slow.locator('#sharing-document').scrollIntoViewIfNeeded();
    await slow.waitForFunction(() => document.querySelector('iframe').getAttribute('src'));
    await slow.clock.fastForward(12500);
    assert.equal(await slow.locator('.invisible-reader-status').innerText(), '连接较慢');
    assert(await slow.locator('.invisible-reader-loading').evaluate(el => el.hidden), 'Slow requests must not indefinitely obscure the reader');
    await pendingRoute.fulfill({contentType: 'text/html', body: fixture});
    await slow.waitForFunction(() => document.querySelector('.invisible-reader-panel').dataset.connection === 'responded');
    await slow.close();
    console.log('PASS mobile touch, reduced motion, slow-response fallback and recovery.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
