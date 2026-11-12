const fs = require('node:fs');
const {chromium} = require('playwright');
const base = process.env.PORTFOLIO_BASE || 'http://localhost:4274';
(async () => {
  const browser = await chromium.launch({channel:'chrome',headless:true}); const output = [];
  try {
    for (const route of ['/index.html?project-section=work','/M7-MONITOR.html','/ZHURONG.html']) {
      const page = await browser.newPage({viewport:{width:1440,height:1000}});
      await page.addInitScript(() => {
        window.__profile = {long:[],frames:[]};
        new PerformanceObserver(list => list.getEntries().forEach(entry => __profile.long.push(entry.duration))).observe({type:'longtask',buffered:true});
        let last = performance.now();
        function frame(time) { __profile.frames.push(time-last); last=time; requestAnimationFrame(frame); }
        requestAnimationFrame(frame);
      });
      await page.goto(base + route,{waitUntil:'domcontentloaded'}); await page.waitForTimeout(1500);
      if (route.startsWith('/index')) await page.waitForFunction(() => window.__introState?.().ready);
      const initial = await page.evaluate(() => {
        const n = performance.getEntriesByType('navigation')[0];
        return {domInteractive:Math.round(n.domInteractive),domContentLoaded:Math.round(n.domContentLoadedEventEnd),transferBytes:n.transferSize,longTasks:__profile.long.length,maxLongTask:Math.round(Math.max(0,...__profile.long)),longTaskTotal:Math.round(__profile.long.reduce((a,b)=>a+b,0)),maxFrameGap:Math.round(Math.max(0,...__profile.frames))};
      });
      await page.evaluate(() => { __profile.long=[]; __profile.frames=[]; });
      await page.locator('.navigate-toggle').focus(); await page.locator('.navigate-toggle').click(); await page.waitForTimeout(1300);
      await page.locator('.navigate-toggle').click(); await page.waitForTimeout(1300);
      const menu = await page.evaluate(() => ({longTasks:__profile.long.length,maxLongTask:Math.round(Math.max(0,...__profile.long)),longTaskTotal:Math.round(__profile.long.reduce((a,b)=>a+b,0)),maxFrameGap:Math.round(Math.max(0,...__profile.frames)),framesOver50:__profile.frames.filter(n=>n>50).length}));
      output.push({route,initial,menu}); console.log(JSON.stringify(output.at(-1))); await page.close();
    }
    fs.writeFileSync('docs/performance-after.json',JSON.stringify(output,null,2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
