// Browser check for the Reveal CSS (the page-opening animation). It loads the real demo page
// docs/assets/reveal-demo.html in real browsers and checks what the CSS does there.
//
//   npm run test:browser                          every engine (chromium, webkit, firefox)
//   npm run test:browser -- --browsers=chromium   only the ones listed
//
// Needs the browsers installed: npx playwright install --with-deps chromium webkit firefox
// (the CI job does this). To use a Chromium that is already on the machine, set CHROMIUM_PATH.
// No other server is needed: this script serves docs/ itself on 127.0.0.1. Exit code 1 if any check fails, and a
// browser that cannot be started counts as a failure (a missing browser must never look like a pass).
import { chromium, webkit, firefox } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.ico': 'image/x-icon', '.svg': 'image/svg+xml' };
const ENGINES = { chromium, webkit, firefox };
const wanted = (process.argv.find((a) => a.startsWith('--browsers=')) || '--browsers=chromium,webkit,firefox').split('=')[1].split(',').filter(Boolean);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let failed = 0;
const check = (browser, name, ok, detail = '') => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'} [${browser}] ${name}${detail ? '  ' + detail : ''}`);
};

const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const BASE = `http://127.0.0.1:${server.address().port}`;
const DEMO = `${BASE}/assets/reveal-demo.html`;

// What the demo looks like right now.
const snapshot = (page) => page.evaluate(() => {
  const cs = (el) => getComputedStyle(el);
  const byId = (id) => document.getElementById(id);
  const curtain = document.querySelector('.vs-reveal-curtain');
  return {
    curtainVisibility: cs(curtain).visibility,
    curtainDisplay: cs(curtain).display,
    hole: cs(curtain).getPropertyValue('--vs-reveal-r'),
    sideTransform: cs(byId('demo-side')).transform,
    bodyOpacity: Number(cs(byId('demo-main')).opacity),
    headOpacity: Number(cs(byId('demo-head')).opacity),
    headTransform: cs(byId('demo-head')).transform,
    nestedAnimations: byId('demo-nested').getAnimations().length,
    // the finished curtain animation is kept on purpose (it holds visibility: hidden); nothing else may be left running or held
    otherAnimations: document.getAnimations().filter((a) => a.animationName !== 'vs-reveal-curtain').length,
  };
});
// Waits until the curtain is hidden. A curtain that never ends must show up as a failed check, not as a crash.
const waitForEnd = (page) => page.waitForFunction(() => getComputedStyle(document.querySelector('.vs-reveal-curtain')).visibility === 'hidden', null, { timeout: 8000 }).catch(() => undefined);
const plain = (s) => s.curtainVisibility === 'hidden' && s.sideTransform === 'none' && s.bodyOpacity === 1 && s.headOpacity === 1 && s.headTransform === 'none' && s.otherAnimations === 0;

async function run(name) {
  const engine = ENGINES[name];
  if (!engine) { failed += 1; console.log(`FAIL [${name}] unknown browser (use chromium, webkit or firefox)`); return; }
  let browser;
  try {
    browser = await engine.launch(name === 'chromium' && process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  } catch (error) {
    failed += 1;
    console.log(`FAIL [${name}] could not start the browser (${String(error.message).split('\n')[0]}). Install it: npx playwright install --with-deps ${name}`);
    return;
  }
  const open = async (options = {}) => {
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, ...options });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__starts = [];
      document.addEventListener('animationstart', (e) => window.__starts.push([e.animationName, Math.round(performance.now())]), true);
    });
    return { context, page };
  };

  { // normal run: what happens during the curtain, and the state afterwards
    const { context, page } = await open();
    await page.goto(DEMO);
    await sleep(350);
    const during = await snapshot(page);
    check(name, 'during the curtain: it is shown, the side menu waits off to the left, header and body are not shown yet',
      during.curtainVisibility === 'visible' && during.sideTransform !== 'none' && during.bodyOpacity < 0.05 && during.headOpacity < 0.05, JSON.stringify(during));
    await waitForEnd(page);
    await sleep(900); // the entrances run 150ms + 700ms after the curtain
    const after = await snapshot(page);
    check(name, 'afterwards the curtain is hidden and every element is back to plain styles (no transform, fully visible, nothing held)', plain(after), JSON.stringify(after));
    check(name, 'a data-vs-reveal element inside another one does not animate by itself', during.nestedAnimations === 0 && after.nestedAnimations === 0);
    const starts = await page.evaluate(() => window.__starts);
    const at = (n) => (starts.find((s) => s[0] === n) || [])[1];
    const curtainAt = at('vs-reveal-curtain'); const sideAt = at('vs-reveal-slide-left'); const fadeAt = at('vs-reveal-fade'); const riseAt = at('vs-reveal-rise');
    check(name, 'order: the side menu starts about 1 second after the curtain, the body and the header start after the side menu',
      sideAt - curtainAt > 800 && sideAt - curtainAt < 1600 && fadeAt - sideAt > 50 && fadeAt - sideAt < 450 && riseAt - sideAt > 50 && riseAt - sideAt < 450,
      `curtain ${curtainAt}, side +${sideAt - curtainAt}, fade +${fadeAt - curtainAt}, rise +${riseAt - curtainAt}`);
    await context.close();
  }

  { // reduced motion: set before loading
    const { context, page } = await open({ reducedMotion: 'reduce' });
    await page.goto(DEMO);
    await sleep(150);
    const s = await snapshot(page);
    check(name, 'reduced motion at load: no curtain, nothing animates, everything visible at once',
      s.curtainDisplay === 'none' && s.sideTransform === 'none' && s.bodyOpacity === 1 && s.headOpacity === 1 && s.otherAnimations === 0, JSON.stringify(s));
    await context.close();
  }

  { // reduced motion switched on WHILE the animation runs: nothing may stay hidden
    const { context, page } = await open({ reducedMotion: 'no-preference' });
    await page.goto(DEMO);
    await sleep(500);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await sleep(250);
    const s = await snapshot(page);
    check(name, 'reduced motion switched on while it runs: the curtain goes and the content is visible at once (nothing stays hidden)',
      s.curtainDisplay === 'none' && s.sideTransform === 'none' && s.bodyOpacity === 1 && s.headOpacity === 1 && s.otherAnimations === 0, JSON.stringify(s));
    await context.close();
  }

  { // the opening started while the page is scrolled (restarted by cloning the elements)
    const { context, page } = await open();
    await page.goto(DEMO);
    await waitForEnd(page);
    await sleep(900);
    await page.evaluate(() => {
      scrollTo(0, 300);
      for (const sel of ['.vs-reveal-curtain', '#demo-side', '#demo-head', '#demo-main']) {
        const el = document.querySelector(sel);
        el.replaceWith(el.cloneNode(true));
      }
    });
    await sleep(450);
    const mid = await page.evaluate(() => {
      // points away from the Replay button (bottom right), one inside the dark part, one near the top left
      const hits = [[1000, 400], [600, 650], [200, 200]].map(([x, y]) => { const el = document.elementFromPoint(x, y); return el ? (el.id || el.className || el.tagName) : 'none'; });
      return { scrollY: Math.round(scrollY), hits, curtainVisibility: getComputedStyle(document.querySelector('.vs-reveal-curtain')).visibility };
    });
    check(name, 'the opening started while the page is scrolled: the curtain is shown and does not take clicks',
      mid.scrollY > 0 && mid.curtainVisibility === 'visible' && mid.hits.every((h) => !String(h).includes('vs-reveal-curtain')), JSON.stringify(mid));
    await context.close();
  }

  { // JavaScript off: the effect is plain CSS. Compared by screenshots, which work the same in every engine.
    const viewport = { width: 900, height: 600 };
    const off = await open({ javaScriptEnabled: false, viewport });
    await off.page.goto(DEMO);
    await sleep(350);
    const early = await off.page.screenshot();
    await sleep(2800);
    const lateOff = await off.page.screenshot();
    await off.context.close();
    const ref = await open({ reducedMotion: 'reduce', viewport });
    await ref.page.goto(DEMO);
    await sleep(600);
    const lateRef = await ref.page.screenshot();
    await ref.context.close();
    check(name, 'JavaScript off: the curtain shows first, and in the end the page looks exactly like the reduced-motion (final) page',
      !early.equals(lateOff) && lateOff.equals(lateRef));
  }

  { // phone width
    const { context, page } = await open({ viewport: { width: 390, height: 844 } });
    await page.goto(DEMO);
    await waitForEnd(page);
    await sleep(900);
    const s = await snapshot(page);
    check(name, 'phone width: it also ends in plain styles', plain(s), JSON.stringify(s));
    await context.close();
  }

  { // the docs page
    const { context, page } = await open();
    await page.goto(`${BASE}/components/reveal.html`);
    await sleep(500);
    const d = await page.evaluate(() => ({
      frame: !!document.querySelector('iframe.demo-frame'),
      nav: [...document.querySelectorAll('a')].some((a) => a.getAttribute('href') === '/components/reveal.html'),
      heading: document.querySelector('h1') && document.querySelector('h1').textContent,
    }));
    check(name, 'the docs page loads with the demo frame, and the sidebar lists Reveal', d.frame && d.nav && d.heading === 'Reveal', JSON.stringify(d));
    await context.close();
  }

  await browser.close();
}

for (const name of wanted) await run(name);
server.close();
console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll checks passed');
process.exit(failed ? 1 : 0);
