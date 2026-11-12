const assert = require('node:assert/strict');
const {chromium} = require('C:/Users/联想/node_modules/playwright');
const {pathToFileURL} = require('node:url');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({channel: 'chrome', headless: true});
  try {
    for (const file of ['DYSLEXIA.html', 'dist/DYSLEXIA.html']) {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(pathToFileURL(path.resolve(file)).href);
      await page.waitForFunction(() => document.querySelector('video').readyState >= 2);
      for (const width of [789, 1047, 1703, 390]) {
        await page.setViewportSize({width, height: 871});
        const view = await page.locator('video').evaluate(video => {
          const box = video.getBoundingClientRect();
          const style = getComputedStyle(video), fit = style.objectFit;
          const scale = (fit === 'cover' ? Math.max : Math.min)(box.width / video.videoWidth, box.height / video.videoHeight);
          const width = scale * video.videoWidth, height = scale * video.videoHeight;
          const [positionX, positionY] = style.objectPosition.split(' ').map(value => parseFloat(value) / 100);
          const left = box.left + (box.width - width) * positionX, top = box.top + (box.height - height) * positionY;
          return {
            source: [video.videoWidth, video.videoHeight],
            frame: {left, top, right: left + width, bottom: top + height},
            box: {left: box.left, top: box.top, right: box.right, bottom: box.bottom},
            stageHeight: video.closest('section').getBoundingClientRect().height,
            viewportHeight: innerHeight,
            viewportWidth: innerWidth,
            overflow: document.documentElement.scrollWidth > innerWidth
          };
        });
        const {frame, box} = view;
        assert(Math.abs(box.left) < 1 && Math.abs(box.top) < 1 && Math.abs(box.right - view.viewportWidth) < 1 && Math.abs(box.bottom - view.viewportHeight) < 1, `Video element must fill the viewport at ${width}`);
        assert(frame.left <= box.left + 1 && frame.right >= box.right - 1 && frame.top <= box.top + 1 && frame.bottom >= box.bottom - 1, `Video must cover the viewport without letterboxing at ${width}`);
        assert(Math.abs(frame.bottom - box.bottom) < 1, `Retain the source bottom/subtitle edge at ${width}`);
        assert(Math.abs(view.stageHeight - view.viewportHeight) < 1, 'Player must retain a fullscreen stage');
        assert.equal(view.overflow, false);
        if (file === 'DYSLEXIA.html' && (width === 789 || width === 1703)) {
          await page.locator('video').evaluate(video => {
            video.pause(); video.currentTime = 5;
            return new Promise(resolve => video.addEventListener('seeked', resolve, {once: true}));
          });
          await page.screenshot({path: `qa/dyslexia-video-fit-${width}.png`});
          await page.mouse.move(width / 2, 350);
          await page.waitForFunction(() => document.querySelector('.invisible-video-cursor').classList.contains('is-visible'));
          await page.mouse.click(width / 2, 350);
          await page.waitForFunction(() => !document.querySelector('video').paused);
        }
      }
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log('PASS fullscreen video without letterboxing, bottom/subtitle edge alignment, cursor/playback and four viewport widths in standalone and dist.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
