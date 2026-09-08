// Run with Node and Playwright available (NODE_PATH can point at bundled packages).
// All non-local browser requests are intercepted; no email can be sent.
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  if (req.url === '/favicon.ico') { res.writeHead(204).end(); return; }
  const file = path.join(root, new URL(req.url, 'http://localhost').pathname);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, body) => {
    res.writeHead(error ? 404 : 200, { 'Content-Type': file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'text/javascript' : file.endsWith('.html') ? 'text/html' : 'application/octet-stream' });
    res.end(error ? '' : body);
  });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  console.log('Local server ready; launching browser');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  let checks = 0;
  try {
    for (const pageName of process.env.LAYOUT_ONLY ? [] : ['contact', 'tarieven']) {
      for (const scenario of ['success', 'string-success', 'network', 'http', 'rejected', 'activation', 'malformed', 'timeout']) {
        console.log(`Testing ${pageName}: ${scenario}`);
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => {
          if (message.type() === 'error' && !/Failed to load resource/.test(message.text())) errors.push(message.text());
        });
        let requests = 0, payload = '';
        let release;
        const gate = new Promise(resolve => { release = resolve; });
        await page.route('**/*', async route => {
          const request = route.request();
          if (request.url().startsWith(base)) return route.continue();
          if (!request.url().startsWith('https://formsubmit.co/')) return route.fulfill({ body: '' });
          requests++;
          assert.equal(request.url(), 'https://formsubmit.co/ajax/info@fitmetzorge.com');
          assert.equal(request.method(), 'POST');
          payload = request.postData();
          await gate;
          if (scenario === 'network') return route.abort('internetdisconnected');
          if (scenario === 'timeout') return route.abort('timedout');
          const body = scenario === 'malformed' ? '<html>Blocked</html>' : JSON.stringify({
            success: scenario === 'string-success' ? 'true' : scenario === 'rejected' ? 'false' : true,
            message: scenario === 'activation' ? 'Please activate your email' : 'The form was submitted successfully.'
          });
          return route.fulfill({ status: scenario === 'http' ? 503 : 200, contentType: 'application/json', body });
        });
        await page.goto(`${base}/${pageName}.html`);
        if (scenario === 'timeout') await page.clock.install();
        if (pageName === 'tarieven') await page.locator('[data-plan="duo-progressie"]').click();
        const form = page.locator('[data-mail-form]');
        await form.locator('[type=submit]').click();
        assert.equal(requests, 0, 'empty form must not submit');
        await form.locator('[name=Naam]').fill('Synthetische Test');
        await form.locator('[name=email]').fill('invalid');
        await form.locator('[name=Telefoonnummer]').fill('0600000000');
        await form.locator('[name=Leeftijd]').fill('11');
        await form.locator('[name=Doel]').fill('Synthetische test, geen echte aanvraag');
        await form.locator('[type=submit]').click();
        assert.equal(requests, 0);
        await form.locator('[name=email]').fill('synthetic@example.com');
        await form.locator('[type=submit]').click();
        assert.equal(requests, 0, 'age validation');
        await form.locator('[name=Leeftijd]').fill('30');
        await form.evaluate(f => { f.requestSubmit(); f.requestSubmit(); });
        await page.waitForFunction(() => document.querySelector('[type=submit]').disabled);
        await new Promise(resolve => setTimeout(resolve, 100));
        assert.equal(requests, 1, 'double submit sends one request');
        assert(payload.includes('synthetic@example.com'));
        assert(payload.includes(`${base}/bedankt.html`));
        if (pageName === 'tarieven') {
          assert(payload.includes('Duo Progressie'));
          assert(payload.includes('EUR 31,25 p.p. per training - EUR 500 p/m totaal'));
        }
        if (scenario === 'timeout') await page.clock.runFor(20001);
        release();
        if (scenario.endsWith('success')) {
          await page.waitForURL('**/bedankt.html');
          assert.equal(await page.locator('h1').innerText(), 'Bedankt voor je aanvraag.');
          assert.equal(await page.locator('[data-form-receipt]').innerText(), 'Fit Met Zorge heeft je aanvraag ontvangen en zal snel contact met je opnemen.');
          assert.equal(await page.locator('main strong').innerText(), 'Fit met Zorge zonder zorgen.');
          await page.reload();
          assert.equal(await page.locator('[data-form-receipt]').innerText(), 'Fit Met Zorge heeft je aanvraag ontvangen en zal snel contact met je opnemen.');
        } else {
          await page.waitForFunction(() => !document.querySelector('[type=submit]').disabled);
          assert.equal(await form.locator('[name=Naam]').inputValue(), 'Synthetische Test');
          assert.equal(await form.locator('[name=email]').inputValue(), 'synthetic@example.com');
          assert((await form.locator('[data-form-status]').innerText()).includes('gegevens blijven'));
          assert(page.url().endsWith(`${pageName}.html`));
        }
        assert.deepEqual(errors, []);
        checks++;
        await page.close();
      }
    }
    for (const viewport of [{ width: 320, height: 568 }, { width: 375, height: 280 }, { width: 667, height: 320 }, { width: 1440, height: 900 }]) {
      const page = await browser.newPage({ viewport });
      await page.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.fulfill({ body: '' }));
      await page.goto(`${base}/tarieven.html`);
      for (const largeText of [false, true]) {
        if (largeText) await page.addStyleTag({ content: 'html { font-size: 200%; }' });
        await page.locator('[data-plan="single-basis"]').scrollIntoViewIfNeeded();
        // Capture at the actual click, after Playwright has scrolled the button into view.
        await page.evaluate(() => document.addEventListener('click', () => { window.testScrollBeforeOpen = window.scrollY; }, { capture: true, once: true }));
        await page.locator('[data-plan="single-basis"]').click();
        const before = await page.evaluate(() => window.testScrollBeforeOpen);
        const dialog = page.locator('.signup-dialog');
        await page.locator('[name=Doel]').fill('Scrolltest');
        await page.locator('[type=submit]').scrollIntoViewIfNeeded();
        const geometry = await dialog.evaluate(el => ({
          overflow: getComputedStyle(el).overflowY,
          scroll: el.scrollTop, width: el.clientWidth, contentWidth: el.scrollWidth,
          rect: el.getBoundingClientRect().toJSON(),
          button: el.querySelector('[type=submit]').getBoundingClientRect().toJSON()
        }));
        assert.equal(geometry.overflow, 'auto');
        assert(geometry.contentWidth <= geometry.width + 1, 'dialog horizontal overflow');
        assert(geometry.button.bottom <= viewport.height && geometry.button.top >= 0, 'submit reachable');
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'page horizontal overflow');
        await page.keyboard.press('Escape');
        assert.equal(await page.evaluate(() => window.scrollY), before, 'restore page scroll');
        await page.locator('[data-plan="duo-progressie"]').click();
        assert.equal(await page.locator('[data-signup-plan]').inputValue(), 'Duo Progressie');
        assert.equal(await page.locator('[name=Doel]').inputValue(), 'Scrolltest');
        await page.locator('[data-signup-close]').click();
        assert(await page.locator('[data-signup-modal]').isHidden());
        checks++;
      }
      await page.close();
    }
    for (const viewport of [{ width: 320, height: 568 }, { width: 375, height: 280 }, { width: 667, height: 320 }, { width: 1440, height: 900 }]) {
      const contact = await browser.newPage({ viewport });
      await contact.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.fulfill({ body: '' }));
      await contact.goto(`${base}/contact.html`);
      for (const largeText of [false, true]) {
        if (largeText) await contact.addStyleTag({ content: 'html { font-size: 200%; }' });
        await contact.locator('[type=submit]').scrollIntoViewIfNeeded();
        assert(await contact.locator('[data-mail-form]').evaluate(el => el.scrollWidth <= el.clientWidth + 1), 'contact horizontal overflow');
        assert(await contact.evaluate(() => document.documentElement.scrollWidth <= innerWidth), JSON.stringify(await contact.evaluate(() => [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).map(el => ({ tag: el.tagName, class: el.className, right: el.getBoundingClientRect().right })))));
        const button = await contact.locator('[type=submit]').boundingBox();
        assert(button.y >= 0 && button.y + button.height <= viewport.height);
        checks++;
      }
      await contact.close();
    }
    const page = await browser.newPage({ viewport: { width: 375, height: 667 } });
    await page.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.fulfill({ body: '' }));
    await page.goto(`${base}/tarieven.html`);
    for (const key of await page.locator('[data-plan]').evaluateAll(cards => cards.map(c => c.dataset.plan))) {
      await page.locator(`[data-plan="${key}"]`).click();
      const expected = await page.evaluate(key => planDetails[key], key);
      assert.equal(await page.locator('[data-signup-plan]').inputValue(), expected.title);
      assert.equal(await page.locator('[name="Duur / optie"]:checked').inputValue(), expected.durations[0]);
      await page.keyboard.press('Escape');
    }
    await page.locator('[data-plan="single-basis"]').click();
    await page.evaluate(() => {
      Object.defineProperty(visualViewport, 'height', { configurable: true, value: 270 });
      Object.defineProperty(visualViewport, 'offsetTop', { configurable: true, value: 30 });
      visualViewport.dispatchEvent(new Event('resize'));
    });
    await page.locator('[name=Doel]').focus();
    await page.locator('[type=submit]').scrollIntoViewIfNeeded();
    const keyboardButton = await page.locator('[type=submit]').boundingBox();
    assert(keyboardButton.y >= 30 && keyboardButton.y + keyboardButton.height <= 300, 'visual viewport keyboard bounds');
    await page.screenshot({ path: path.join(root, 'tests/mobile-keyboard.png') });
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.reload();
    await page.locator('[data-plan="duo-progressie"]').click();
    await page.screenshot({ path: path.join(root, 'tests/desktop.png') });
    await page.close();
    console.log(`PASS: ${checks} form/scenario and viewport/text combinations; all outgoing requests intercepted.`);
    console.log('PASS: all 7 package values and simulated visual viewport keyboard resize.');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
