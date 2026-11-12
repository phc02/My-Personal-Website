/* Exercise the real curtain across both literal and Pages-canonical HTML routes. */
const assert = require('node:assert/strict');
const {createServer} = require('node:http');
const {readFileSync} = require('node:fs');
const {resolve} = require('node:path');
const {chromium} = require('playwright');
const root = resolve(__dirname, '..');
const script = readFileSync(resolve(root, 'public/project-transition.js'), 'utf8');
const css = readFileSync(resolve(root, 'public/project-transition.css'), 'utf8');
const projects = [
  ['ZHURONG', '“铸融”全域无人化 超级大压铸智能生产系统'],
  ['M7-MONITOR', '小米汽车M7 供应看板实时监控'],
  ['M7-DIGITAL-TWIN', '小米汽车M7 数字孪生交互原型'],
  ['INVISIBLE-DESIGN', '无感设计分享'],
  ['DYSLEXIA', '触解迷障'],
];
const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const mode = url.pathname.split('/')[1];
  if (mode === 'clean' && url.pathname.endsWith('.html')) {
    const pathname = url.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
    res.writeHead(301, {Location: pathname + url.search}); res.end(); return;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html><html><head><style>${css}</style><script>${script}</script></head>
    <body><main>Transition fixture</main>
    ${projects.map(([route, label]) => `<button data-project="${route}">${label}</button>`).join('')}
    <button id="back">Return to WORK</button>
    <script>
      document.querySelectorAll('[data-project]').forEach(button => button.onclick = () => {
        history.replaceState({...history.state, portfolioReturn:{y:0}}, '', location.href);
        sessionStorage.setItem('portfolio-project-origin', JSON.stringify({url:location.href}));
        projectTransitionTo('/${mode}/' + button.dataset.project + '.html', button.textContent);
      });
      document.querySelector('#back').onclick = () => projectTransitionBack('/${mode}/index.html#work');
    </script></body></html>`);
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  let browser;
  try {
    browser = await chromium.launch({channel:'chrome', headless:true});
    for (const mobile of [false, true]) {
      const page = await browser.newPage({viewport: mobile ? {width:390,height:844} : {width:1440,height:1000}});
      await page.addInitScript(() => {
        window.__visibleTransitionLabels = [];
        function sample() {
          const label = document.querySelector('.project-curtain-label');
          if (label && getComputedStyle(label).visibility === 'visible' && Number(getComputedStyle(label).opacity) > .2) {
            if (!window.__visibleTransitionLabels.includes(label.textContent)) window.__visibleTransitionLabels.push(label.textContent);
          }
          requestAnimationFrame(sample);
        }
        requestAnimationFrame(sample);
      });
      const seen = async label => {
        await page.waitForFunction(text => window.__visibleTransitionLabels.includes(text), label, {timeout:5000});
        await page.waitForFunction(() => !document.documentElement.classList.contains('project-transitioning'));
        assert.equal(await page.evaluate(() => sessionStorage.getItem('portfolio-project-transition')), null);
      };
      for (const mode of ['exact', 'clean']) {
        await page.goto(`${base}/${mode}/index.html#work`);
        const home = page.url();
        for (const [route, label] of projects) {
          await page.locator(`[data-project="${route}"]`).click();
          await page.waitForURL(`${base}/${mode}/${route}${mode === 'exact' ? '.html' : ''}`);
          await seen(label);
          await page.locator('#back').click();
          await page.waitForURL(home);
          await seen('WORK & EXPERIENCE');
        }
        await page.evaluate(mode => projectTransitionTo(`/${mode}/index.html?project-return=work#work`, 'WORK'), mode);
        await page.waitForURL(`${base}/${mode}/${mode === 'exact' ? 'index.html' : ''}?project-return=work#work`);
        await seen('WORK');
        await page.evaluate(mode => projectTransitionTo(`/${mode}/SPECIAL-intro.html?project-section=about#about`, 'ABOUT'), mode);
        await page.waitForURL(`${base}/${mode}/SPECIAL-intro${mode === 'exact' ? '.html' : ''}?project-section=about#about`);
        await seen('ABOUT');
        console.log('PASS', mobile ? 'mobile' : 'desktop', mode, 'five project titles, history return, index alias and section query/hash');
      }
      // A pending transition for a different document must not be replayed.
      await page.evaluate(base => sessionStorage.setItem('portfolio-project-transition', JSON.stringify({target:base+'/clean/ZHURONG.html',label:'WRONG',time:Date.now()})), base);
      await page.goto(base+'/clean/DYSLEXIA');
      assert.equal(await page.locator('.project-curtain').count(), 0);
      await page.close();
    }
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
