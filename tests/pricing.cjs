// All external requests, including ALL FormSubmit submissions, are intercepted.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const root = path.resolve(__dirname, '..');
const expected = {
  'single-basis': ['Basis - 1 persoon', '50', '200', 4],
  'single-progressie': ['Progressie - 1 persoon', '47,50', '380', 8],
  'single-transformatie': ['Transformatie - 1 persoon', '40', '480', 12],
  'duo-basis': ['Duo Basis', '32,50', '260', 4],
  'duo-progressie': ['Duo Progressie', '31,25', '500', 8],
  'duo-transformatie': ['Duo Transformatie', '27,50', '660', 12],
  'online-coaching': ['Online coaching', null, '200', null]
};
const server = http.createServer((req, res) => {
  if (req.url === '/favicon.ico') return res.writeHead(204).end();
  const file = path.join(root, new URL(req.url, 'http://localhost').pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (error, body) => {
    res.writeHead(error ? 404 : 200, { 'Content-Type': file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'text/javascript' : 'text/html' });
    res.end(error ? '' : body);
  });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = process.env.LIVE_BASE || `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  let checks = 0;
  try {
    for (const viewport of [{ width: 320, height: 568 }, { width: 375, height: 280 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
      if (process.env.PRICING_WIDTH && viewport.width !== Number(process.env.PRICING_WIDTH)) continue;
      for (const large of [false, true]) {
        console.log(`Pricing ${viewport.width}x${viewport.height}, text ${large ? 200 : 100}%`);
        const page = await browser.newPage({ viewport });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
        let payload = '', sent = 0;
        await page.route('**/*', route => {
          if (route.request().url().startsWith(base + '/')) return route.continue();
          if (route.request().url().startsWith('https://formsubmit.co/')) {
            assert.equal(route.request().url(), 'https://formsubmit.co/ajax/info@fitmetzorge.com');
            payload = route.request().postData(); sent++;
            return route.fulfill({ contentType: 'application/json', body: '{"success":false,"message":"Intercepted test"}' });
          }
          return route.fulfill({ body: '' });
        });
        await page.goto(base + '/tarieven.html');
        if (large) await page.addStyleTag({ content: 'html { font-size: 200%; }' });
        // The site defers off-screen sections with content-visibility: auto.
        await page.locator('.pricing-terms h2').scrollIntoViewIfNeeded();
        await page.waitForFunction(() => document.querySelector('.pricing-terms').innerText.length > 0);
        assert(!/per maand|maandelijks|p\/m/i.test(await page.locator('body').innerText()));
        const terms = await page.locator('.pricing-terms').innerText();
        for (const text of ['inclusief btw', '28 dagen', '13 betaalperiodes per jaar', 'opzegtermijn van vier weken', '24 uur', 'Bestaande klantafspraken en contracten blijven ongewijzigd']) assert(terms.includes(text), JSON.stringify({ missing: text, terms }));
        assert((await page.locator('.extra-pricing-grid').innerText()).includes('€520 totaal'));
        assert((await page.locator('.extra-pricing-grid').innerText()).includes('€55'));
        assert(!(await page.locator('.extra-pricing-grid').innerText()).includes('per 4 weken'));
        for (const [key, [title, session, total, count]] of Object.entries(expected)) {
          const card = page.locator(`[data-plan="${key}"]`);
          await card.scrollIntoViewIfNeeded();
          const text = await card.innerText();
          assert(text.includes(`€${total} per 4 weken`));
          assert(text.toLowerCase().includes('inclusief btw'));
          assert(text.includes('13 betaalperiodes per jaar'));
          if (count) {
            assert(text.includes(`${count} trainingen per 4 weken`));
            assert.equal(await card.locator('.session-price').evaluate(el => el.nextElementSibling.className), 'period-price');
            assert((await card.locator('.session-price').innerText()).startsWith('€' + session));
          }
          if (key.startsWith('duo-')) assert(text.includes('totaal voor 2 personen') && text.includes('p.p. per training'));
          assert(await card.evaluate(el => el.scrollWidth <= el.clientWidth + 1), key + ' card overflow: ' + JSON.stringify(await card.evaluate(el => ({ width: el.clientWidth, scroll: el.scrollWidth, children: [...el.children].map(c => ({ text: c.textContent, width: c.getBoundingClientRect().width, scroll: c.scrollWidth })) }))));
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'page overflow');
          await card.focus();
          await page.keyboard.press('Enter');
          assert.equal(await page.locator('[data-signup-plan]').inputValue(), title);
          const option = await page.locator('[name="Duur / optie"]:checked').inputValue();
          assert(option.includes('€' + total + ' per 4 weken'));
          const form = page.locator('[data-mail-form]');
          await form.locator('[name=Naam]').fill('Synthetische onderschepte prijstest');
          await form.locator('[name=email]').fill('synthetic@example.com');
          await form.locator('[name=Telefoonnummer]').fill('0000000000');
          await form.locator('[name=Doel]').fill('Geen echte aanvraag');
          await form.locator('[type=submit]').scrollIntoViewIfNeeded();
          const button = await form.locator('[type=submit]').boundingBox();
          assert(button.y >= 0 && button.y + button.height <= viewport.height, 'submit not reachable');
          const previous = sent;
          await form.locator('[type=submit]').click();
          await page.waitForFunction(() => document.querySelector('[data-form-status]').textContent.includes('niet bevestigd'));
          assert.equal(sent, previous + 1);
          for (const value of [title, option, '28 dagen', '13 betaalperiodes per jaar', 'inclusief btw', 'Vier weken']) assert(payload.includes(value), 'missing payload: ' + value);
          assert(!/per maand|maandelijks|p\/m/i.test(payload));
          await page.keyboard.press('Escape');
          assert(await page.locator('[data-signup-modal]').isHidden());
          assert(await card.evaluate(el => el === document.activeElement), 'focus restoration');
          checks++;
        }
        if (!large && [375, 1440].includes(viewport.width)) {
          const category = page.locator('.pricing-category').nth(1);
          await category.scrollIntoViewIfNeeded();
          await category.screenshot({ path: path.join(__dirname, `pricing-${viewport.width}.png`) });
        }
        assert.deepEqual(errors, []);
        await page.close();
      }
    }
    console.log(`PASS ${checks} package/card/payload checks; no live submissions.`);
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
