const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/联想/node_modules/playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const errors = [];
  const ready = async (page, file) => {
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(path.resolve(file)).href + '?project-section=about');
    await page.waitForFunction(() => window.__introState?.().ready
      && window.__navigationState?.().open === false
      && window.__navigationState?.().animating === false
      && document.querySelector('.resume-entry').disabled === false
      && Number(gsap.getProperty(document.querySelector('main'), 'scaleX')) > .999
      && document.querySelector('.resume-entry').getBoundingClientRect().width > 50);
    await page.waitForFunction(() => [...document.querySelectorAll('.resume-entry img')]
      .every(image => image.complete && image.naturalWidth > 0));
  };
  const open = async page => {
    await page.locator('.resume-entry').click();
    await page.waitForFunction(() => document.querySelector('#resume-dialog').dataset.phase === 'open');
    assert(await page.locator('#resume-dialog').evaluate(dialog => dialog.open));
    assert(await page.locator('.resume-sheet img').evaluate(image => image.naturalWidth === 2380 && image.naturalHeight === 3368));
    assert.equal(await page.locator('.resume-controls,.resume-close,.resume-read-toggle').count(), 0);
    const r = await page.locator('.resume-sheet').boundingBox();
    const size = page.viewportSize();
    assert(r.x >= 0 && r.y >= 0);
    assert(r.height > size.height, 'Resume should open directly at reading size');
    if(size.width >= 768) assert(r.x + r.width <= size.width + 1);
  };
  const closed = async page => {
    await page.waitForFunction(() => !document.querySelector('#resume-dialog').open);
    assert(await page.evaluate(() => !document.documentElement.classList.contains('resume-view-open')));
    assert(await page.locator('.resume-entry').evaluate(el => document.activeElement === el));
    assert(await page.evaluate(() => {
      const entry = document.querySelector('.resume-entry').getBoundingClientRect();
      const seal = document.querySelector('.resume-envelope-stamp').getBoundingClientRect();
      return Math.abs(seal.left + seal.width / 2 - entry.left - entry.width / 2) < 1
        && +getComputedStyle(document.querySelector('.resume-envelope-flap')).zIndex
          > +getComputedStyle(document.querySelector('.resume-envelope-front')).zIndex;
    }), 'Closed envelope must restore the centered seal and the top flap');
  };
  try {
    const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await ready(desktop, 'SPECIAL-intro.html');
    await desktop.screenshot({ path: 'qa/resume-envelope-desktop.png' });
    const originalY = await desktop.evaluate(() => scrollY);
    await open(desktop);
    await desktop.mouse.move(630, 430);
    await desktop.waitForFunction(() => document.querySelector('.resume-cursor').classList.contains('is-visible'));
    await desktop.waitForFunction(() => +getComputedStyle(document.querySelector('.resume-cursor')).opacity > .99);
    assert(await desktop.locator('.resume-cursor img').evaluate(e => e.complete && e.naturalWidth > 0));
    assert.equal(await desktop.locator('.resume-cursor').evaluate(e => getComputedStyle(e).backgroundColor), 'rgb(17, 17, 17)');
    assert.equal(await desktop.locator('.resume-cursor img').evaluate(e => getComputedStyle(e).filter), 'invert(1)');
    await desktop.screenshot({ path: 'qa/resume-preview-desktop.png' });
    await desktop.mouse.wheel(0, 500);
    await desktop.waitForTimeout(200);
    assert.equal(await desktop.evaluate(() => scrollY), originalY, 'Preview wheel must not scroll the portfolio');
    assert(await desktop.locator('.resume-sheet').evaluate(e => e.getBoundingClientRect().width > 1000));
    await desktop.mouse.move(30, 500);
    await desktop.mouse.wheel(0, 650);
    await desktop.waitForFunction(() => document.querySelector('.resume-scroll').scrollTop > 100);
    await desktop.screenshot({ path: 'qa/resume-reading-desktop.png' });
    await desktop.keyboard.press('Escape');
    await closed(desktop);
    assert.equal(await desktop.evaluate(() => scrollY), originalY);
    // Closing while the flap is still opening must release the modal and scroll lock.
    await desktop.locator('.resume-entry').click();
    await desktop.waitForFunction(() => document.querySelector('#resume-dialog').open);
    await desktop.keyboard.press('Escape');
    await closed(desktop);
    await open(desktop);
    await desktop.locator('.resume-sheet').click({ position: { x: 100, y: 100 } });
    await closed(desktop);
    await desktop.locator('.navigate-toggle').click();
    await desktop.waitForFunction(() => window.__navigationState().open && !window.__navigationState().animating);
    await desktop.locator('[data-work]').click();
    await desktop.waitForFunction(() => !window.__navigationState().open && !window.__navigationState().animating);
    assert.equal(await desktop.locator('#work .work-row').count(), 5);
    await desktop.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    await ready(mobile, 'dist/index.html');
    await mobile.screenshot({ path: 'qa/resume-envelope-mobile.png' });
    await open(mobile);
    assert.equal(await mobile.locator('.resume-cursor').isVisible(), false);
    await mobile.screenshot({ path: 'qa/resume-preview-mobile.png' });
    assert(await mobile.locator('.resume-scroll').evaluate(el => el.scrollWidth > el.clientWidth && el.scrollHeight > el.clientHeight));
    await mobile.locator('.resume-sheet').tap({position:{x:100,y:100}});
    await closed(mobile);
    await mobile.setViewportSize({ width: 700, height: 500 });
    await ready(mobile, 'dist/index.html');
    await mobile.screenshot({ path: 'qa/resume-envelope-short.png' });
    assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await mobile.close();
    assert.deepEqual(errors, []);
    console.log('PASS direct reading size, removed corner controls, black cursor with white icon, reading scroll, close animation, keyboard, rapid close, focus restore, nav, touch, reduced motion and dist.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
