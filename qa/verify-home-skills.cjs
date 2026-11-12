const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/联想/node_modules/playwright');
const base = 'file:///D:/002秋招+实习/Codex%20Projects/special-intro/';
const homeReady = p => p.waitForFunction(() => window.__introState?.().ready
  && !window.__navigationState?.().animating && !document.body.classList.contains('navigation-route')
  && document.querySelector('.skills-orbit')?.hidden === false
  && ['cruise','static'].includes(document.querySelector('.skills-orbit')?.dataset.motion));
const positions = p => p.locator('.skill-orbit-position').evaluateAll(nodes => nodes.map(n => n.style.transform));
async function pointAt(p, locator, touch=false) {
  const r = await locator.boundingBox(); assert(r);
  if (touch) await p.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);
  else await p.mouse.move(r.x+r.width/2,r.y+r.height/2);
}
(async () => {
  const browser = await chromium.launch({ channel:'chrome', headless:true });
  try {
    const page = await browser.newPage({ viewport:{width:1047,height:871} });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base+'SPECIAL-intro.html?project-section=home');
    await homeReady(page); await page.waitForTimeout(1400);
    assert.equal(await page.locator('.skill-orbit-card').count(),9);
    assert(await page.locator('.skill-orbit-card img').evaluateAll(images => images.every(i=>i.complete&&i.naturalWidth===512)));
    await page.mouse.move(-5,-5); await page.evaluate(()=>document.activeElement?.blur());
    const moving = await positions(page); await page.waitForTimeout(500);
    assert.notDeepEqual(await positions(page),moving,'The orbit must keep revolving');
    assert(await page.locator('[data-layer="front"]').count()>0);
    assert(await page.locator('[data-layer="back"]').count()>0);
    await page.screenshot({path:'qa/home-skills-desktop.png'});
    const frontId = await page.locator('.skill-orbit-position[data-layer="front"] button:enabled').first().evaluate(e=>e.parentElement.dataset.skill);
    const front = page.locator(`[data-skill="${frontId}"] button`);
    await pointAt(page,front); await page.waitForTimeout(1400);
    assert.equal(await front.getAttribute('aria-expanded'),'true');
    assert(await front.locator('.skill-orbit-label').evaluate(e=>Number(getComputedStyle(e).opacity)>.99));
    const stopped = await positions(page); await page.waitForTimeout(450);
    const stable = await positions(page);
    assert.deepEqual(stable,stopped,'Hover must gently stop the whole orbit');
    await page.screenshot({path:'qa/home-skills-hover.png'});
    await page.mouse.move(20,180); await page.waitForTimeout(1200);
    assert.notDeepEqual(await positions(page),stable,'Leaving must restart motion');
    for (const skill of ['after-effects','vscode']) {
      const added = page.locator(`[data-skill="${skill}"] button`);
      await pointAt(page,added); await page.waitForTimeout(1100);
      assert.equal(await added.getAttribute('aria-expanded'),'true');
      assert(await added.locator('.skill-orbit-label').evaluate(e=>Number(getComputedStyle(e).opacity)>.99));
      await page.mouse.move(20,180); await page.waitForTimeout(350);
    }
    await page.locator('.brand').click();
    assert(await page.locator('.brand').evaluate(e=>e.hasAttribute('data-spinning')));
    await page.waitForTimeout(2000);
    await page.locator('.navigate-toggle').click(); await page.waitForTimeout(1500);
    assert(await page.locator('.skills-orbit').evaluate(e=>e.hidden&&e.inert));
    const hidden = await positions(page); await page.waitForTimeout(250);
    assert.deepEqual(await positions(page),hidden,'Menu must suspend orbit work');
    await page.locator('.navigate-toggle').click(); await homeReady(page);
    await page.evaluate(()=>scrollTo({top:300,behavior:'instant'})); await page.waitForTimeout(1000);
    assert(await page.locator('.skills-orbit').evaluate(e=>e.hidden&&e.inert));
    await page.evaluate(()=>scrollTo({top:window.__introState().scrollEnd,behavior:'instant'}));
    await page.waitForTimeout(1000);
    assert(await page.evaluate(()=>window.__introState().progress>.99));
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'})); await homeReady(page);
    await page.waitForTimeout(900);
    assert(await page.locator('.skills-orbit').isVisible(),'Reverse scroll must restore orbit');
    await page.emulateMedia({reducedMotion:'reduce'}); await page.waitForTimeout(200);
    const reduced = await positions(page); await page.waitForTimeout(400);
    assert.deepEqual(await positions(page),reduced,'Reduced motion must remain static');
    await page.setViewportSize({width:1703,height:871}); await page.waitForTimeout(200);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.deepEqual(errors,[]);
    await page.close();
    const entrance = await browser.newPage({viewport:{width:1047,height:871}});
    await entrance.goto(base+'SPECIAL-intro.html');
    await entrance.waitForFunction(()=>document.querySelector('.loading-enter')&&!document.querySelector('.loading-enter').disabled);
    assert(await entrance.locator('.skills-orbit').evaluate(e=>e.hidden),'Icons must stay behind the loading gate');
    await entrance.locator('.loading-enter').click();
    await homeReady(entrance); await entrance.waitForTimeout(1300);
    assert.equal(await entrance.locator('.skill-orbit-card:enabled').count(),9);
    await entrance.close();
    const mobile = await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    await mobile.goto(base+'dist/index.html?project-section=home');
    await homeReady(mobile); await mobile.waitForTimeout(1500);
    assert(await mobile.locator('.skill-orbit-card img').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth===512)));
    const visible = await mobile.locator('.skill-orbit-card:enabled').count();
    assert(visible>=3&&visible<=6,'Mobile must show a compact near arc');
    assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await mobile.screenshot({path:'qa/home-skills-mobile.png'});
    const cardId = await mobile.locator('.skill-orbit-position[data-layer="front"] button:enabled').first().evaluate(e=>e.parentElement.dataset.skill);
    const card = mobile.locator(`[data-skill="${cardId}"] button`);
    await pointAt(mobile,card,true); await mobile.waitForTimeout(900);
    assert.equal(await card.getAttribute('aria-expanded'),'true');
    await mobile.screenshot({path:'qa/home-skills-mobile-tip.png'});
    console.log('PASS nine local icons including AE/VS Code, orbit depth, hover pause/tip/resume, mascot click, navigation, HOME/ABOUT return, Loading entry, reduced motion, desktop widths, mobile touch and dist assets.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
