const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
const path = require('node:path');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const entry = process.env.CONTACT_ENTRY || pathToFileURL(path.join(root, 'SPECIAL-intro.html')).href;

(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  try {
    for (const reduced of [false,true]) {
      const page = await browser.newPage({viewport:{width:661,height:871}, reducedMotion:reduced?'reduce':'no-preference'});
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(entry + '?project-section=contact', {waitUntil:'load'});
      await page.waitForFunction(() => window.__introState?.().ready && !window.__navigationState?.().animating);
      for (const width of [661,390,767,768,1047,1440,661]) {
        await page.setViewportSize({width,height:871});
        await page.evaluate(() => { ScrollTrigger.refresh(); window.scrollTo(0,document.documentElement.scrollHeight); });
        await page.waitForTimeout(1600);
        const state = await page.locator('.contact-action').evaluate(button => {
          const rect = button.getBoundingClientRect(), css = getComputedStyle(button);
          const x = rect.left + rect.width/2, y = rect.top + rect.height/2;
          return {width:innerWidth, opacity:+css.opacity, disabled:button.disabled,
            rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},
            hit:button.contains(document.elementFromPoint(x,y)),
            contact:window.__contactState(), maxScroll:ScrollTrigger.maxScroll(window)};
        });
        if (!reduced && width===661 && process.env.CONTACT_SCREENSHOT) await page.screenshot({path:process.env.CONTACT_SCREENSHOT});
        assert(state.opacity > .99 && !state.disabled, `Contact hidden: ${JSON.stringify({reduced,...state})}`);
        assert(state.rect.x>=0 && state.rect.x+state.rect.width<=width && state.rect.y>=0 && state.rect.y+state.rect.height<=871, 'Contact must fit inside viewport');
        assert(state.hit, 'Contact button must receive pointer input');
        await page.locator('.contact-action').click();
        await page.waitForTimeout(400);
        assert.equal(await page.locator('.contact-action').getAttribute('aria-label'),'电话号码：17501149766');
        await page.evaluate(() => window.scrollTo(0,document.querySelector('#work-end').offsetTop));
        await page.waitForTimeout(1600);
        await page.evaluate(() => window.scrollTo(0,document.documentElement.scrollHeight));
        await page.waitForTimeout(1600);
        assert.equal(await page.locator('.contact-action').isDisabled(), false, 'Contact must reappear after reverse scrolling');
        console.log('PASS',width+'px',reduced?'reduced motion':'animated','visible / clickable / reverse scroll');
      }
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log('PASS Contact responsive reveal, resizing, phone click, reverse scrolling, reduced motion.');
  } finally { await browser.close(); }
})().catch(error => {console.error(error); process.exitCode=1;});
