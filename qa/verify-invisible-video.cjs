const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/联想/node_modules/playwright');
const base = 'file:///D:/002秋招+实习/Codex%20Projects/special-intro/';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1047, height: 871 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + 'INVISIBLE-DESIGN.html');
    await page.waitForFunction(() => !document.querySelector('video').paused);
    const video = page.locator('video'), toggle = page.locator('.invisible-video-toggle');
    assert(await video.evaluate(e => e.muted && e.loop && !e.controls));
    for (const width of [1047, 1703, 390]) {
      await page.setViewportSize({ width, height: 871 });
      assert.deepEqual(await video.evaluate(e => {
        const r = e.getBoundingClientRect();
        return [r.x, r.y, r.width, r.height, getComputedStyle(e).objectFit,
          document.documentElement.scrollWidth > innerWidth];
      }), [0, 0, width, 871, 'cover', false]);
    }
    await page.setViewportSize({ width: 1047, height: 871 });
    await page.mouse.move(420, 350);
    await page.waitForTimeout(300);
    assert(await page.locator('.invisible-video-cursor').evaluate(e => getComputedStyle(e).visibility === 'visible'));
    await page.mouse.click(420, 350);
    await page.waitForFunction(() => document.querySelector('video').paused);
    assert.equal(await toggle.getAttribute('aria-label'), '播放视频');
    const held = await video.evaluate(e => e.currentTime);
    await page.waitForTimeout(200);
    assert(Math.abs(await video.evaluate(e => e.currentTime) - held) < .01);
    await page.screenshot({ path: 'qa/invisible-video-paused.png' });
    await page.mouse.click(420, 350);
    await page.waitForFunction(() => !document.querySelector('video').paused);
    await page.screenshot({ path: 'qa/invisible-video-playing.png' });
    await page.locator('.invisible-sound-toggle').click();
    assert.equal(await video.evaluate(e => e.muted), false);
    await page.locator('.invisible-sound-toggle').click();
    await page.locator('.navigate-toggle').hover();
    assert(await page.locator('.invisible-video-cursor').evaluate(e => getComputedStyle(e).visibility === 'hidden'));
    await page.locator('.navigate-toggle').click();
    await page.waitForTimeout(1800);
    assert(await page.evaluate(() => document.body.classList.contains('navigation-route')));
    assert(await video.evaluate(e => e.paused));
    await page.locator('.navigate-toggle').click();
    await page.waitForTimeout(1800);
    assert.equal(await video.evaluate(e => e.paused), false);
    await toggle.focus(); await page.keyboard.press('Space');
    await page.waitForFunction(() => document.querySelector('video').paused);
    await page.locator('.navigate-toggle').click(); await page.waitForTimeout(1800);
    await page.locator('.navigate-toggle').click(); await page.waitForTimeout(1800);
    assert(await video.evaluate(e => e.paused), 'Menu close must preserve an intentional pause');
    await toggle.focus(); await page.keyboard.press('Enter');
    await page.waitForFunction(() => !document.querySelector('video').paused);
    // Emulate arrival under the portfolio curve transition before the player starts.
    await page.addInitScript(() => {
      const mark = () => {
        if (!document.documentElement) return false;
        document.documentElement.classList.add('project-transitioning'); return true;
      };
      if (!mark()) {
        const observer = new MutationObserver(() => { if (mark()) observer.disconnect(); });
        observer.observe(document, { childList: true, subtree: true });
      }
    });
    await page.reload(); await page.waitForTimeout(150);
    await page.evaluate(() => document.documentElement.classList.remove('project-transitioning'));
    await page.waitForFunction(() => !document.querySelector('video').paused);
    assert.deepEqual(errors, []);
    await page.close();
    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await mobile.goto(base + 'dist/INVISIBLE-DESIGN.html');
    await mobile.waitForFunction(() => !document.querySelector('video').paused);
    await mobile.touchscreen.tap(180, 400);
    await mobile.waitForFunction(() => document.querySelector('video').paused);
    assert(await mobile.locator('.invisible-touch-play').isVisible());
    await mobile.touchscreen.tap(180, 400);
    await mobile.waitForFunction(() => !document.querySelector('video').paused);
    console.log('PASS fullscreen geometry, autoplay, cursor, pause/resume, sound, keyboard, navigation, transition entry, touch, dist media.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
