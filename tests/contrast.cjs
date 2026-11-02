// Regression check: light cards must not retain white text from the old dark theme.
// All external requests and submissions are blocked.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const file = path.join(root, new URL(req.url, 'http://localhost').pathname);
  fs.readFile(file, (err, data) => {
    res.writeHead(err ? 404 : 200, { 'Content-Type': file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'text/javascript' : file.endsWith('.html') ? 'text/html' : 'application/octet-stream' });
    res.end(err ? '' : data);
  });
});
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = process.env.LIVE_BASE || `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const width of [320, 375, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 800 } });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.route('**/*', r => r.request().method() === 'GET' && r.request().url().startsWith(base + '/') ? r.continue() : r.fulfill({ body: '' }));
      for (const [file, selector] of [['index.html', '.premium-panel'], ['tarieven.html', '.plan-detail']]) {
        await page.goto(base + '/' + file);
        const card = page.locator(selector);
        await card.scrollIntoViewIfNeeded();
        await page.waitForFunction(s => getComputedStyle(document.querySelector(s)).opacity === '1', selector);
        const contrast = await card.evaluate(el => {
          const rgb = s => s.match(/[\d.]+/g).map(Number);
          const blend = (fg, bg) => fg.slice(0, 3).map((v, i) => v * (fg[3] ?? 1) + bg[i] * (1 - (fg[3] ?? 1)));
          const luminance = c => c.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
          const bg = blend(rgb(getComputedStyle(el).backgroundColor), rgb(getComputedStyle(document.documentElement).backgroundColor));
          return [...el.querySelectorAll('h2, li, p:not(.eyebrow), .metric-row span, .metric-row strong')].map(node => {
            const fg = blend(rgb(getComputedStyle(node).color), bg);
            const a = luminance(fg), b = luminance(bg);
            return { text: node.textContent.trim(), ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
          });
        });
        assert(contrast.length > 0);
        for (const item of contrast) assert(item.ratio >= 4.5, `${file}: ${item.text}: contrast ${item.ratio}`);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'horizontal overflow');
        console.log('PASS', width, file, 'visible text contrast >= 4.5:1');
        if (process.env.SCREENSHOT_DIR) await card.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, `contrast-${width}-${file}.png`) });
      }
      assert.deepEqual(errors, []);
      await page.close();
    }
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
