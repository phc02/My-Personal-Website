const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/联想/node_modules/playwright');
const base = 'file:///D:/002秋招+实习/Codex%20Projects/special-intro/';
(async () => {
  const browser = await chromium.launch({ channel:'chrome', headless:true });
  try {
    const page = await browser.newPage({viewport:{width:1047,height:871}});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => {
      window.orbitFrames = [];
      function frame(time) {
        const root = document.querySelector('.skills-orbit');
        const card = root?.firstElementChild;
        const match = card?.style.transform.match(/translate3d\(([-\d.]+)px,\s*([-\d.]+)px/);
        if (root && !root.hidden && match) {
          const x = Number(match[1]), y = Number(match[2]);
          if (Math.hypot(x,y)>10) window.orbitFrames.push({time,angle:Math.atan2(y,x),mode:root.dataset.motion});
        }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
    await page.goto(base+'SPECIAL-intro.html?project-section=home');
    await page.waitForFunction(() => document.querySelector('.skills-orbit')?.dataset.motion==='entrance');
    assert.equal(await page.locator('.skill-orbit-card:enabled').count(),0,'Fast entrance must not be interrupted by accidental hover');
    await page.waitForFunction(() => document.querySelector('.skills-orbit')?.dataset.motion==='cruise');
    await page.waitForTimeout(150);
    const frames = await page.evaluate(() => window.orbitFrames.filter(f=>f.mode==='entrance'));
    assert(frames.length>40,'Must observe the complete animated entrance');
    let total=0,reverse=0,maxSpeed=0;
    const velocities=[];
    for(let i=1;i<frames.length;i++) {
      let delta=frames[i].angle-frames[i-1].angle;
      while(delta>Math.PI)delta-=2*Math.PI;
      while(delta<-Math.PI)delta+=2*Math.PI;
      total+=delta; if(delta<0)reverse+=delta;
      const speed=delta/(frames[i].time-frames[i-1].time)*1000;
      maxSpeed=Math.max(maxSpeed,speed); velocities.push(speed);
    }
    assert(Math.abs(total-2*Math.PI)<.12,`Must settle after one full revolution: ${total}`);
    assert(reverse<-.005&&reverse>-.35,`Must have a small reverse rebound: ${reverse}`);
    assert(maxSpeed>3,'Entrance must visibly accelerate beyond cruise speed');
    await page.waitForTimeout(700);
    const before=await page.locator('.skill-orbit-position').first().getAttribute('style');
    await page.waitForTimeout(400);
    assert.notEqual(await page.locator('.skill-orbit-position').first().getAttribute('style'),before,'Normal orbit must continue after rebound');
    await page.locator('.navigate-toggle').click(); await page.waitForTimeout(1500);
    await page.locator('.navigate-toggle').click(); await page.waitForTimeout(1200);
    assert.equal(await page.locator('.skills-orbit').getAttribute('data-motion'),'cruise','Navigation must not replay completed entrance');
    assert.deepEqual(errors,[]);
    console.log(`PASS one revolution ${(total*180/Math.PI).toFixed(2)}deg, visible reverse rebound, acceleration, continuous cruise, no replay on navigation.`);
    const reduced=await browser.newPage({reducedMotion:'reduce',viewport:{width:390,height:844}});
    await reduced.goto(base+'dist/index.html?project-section=home');
    await reduced.waitForFunction(()=>document.querySelector('.skills-orbit')?.dataset.motion==='static');
    console.log('PASS reduced motion skips fast entrance.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
