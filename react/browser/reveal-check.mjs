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
    letters: Array.from(document.querySelectorAll('#demo-title .vs-reveal-text__letter'), (l) => { const c = cs(l); return { opacity: c.opacity, transform: c.transform, filter: c.filter }; }),
  };
});
// Waits until the curtain is hidden. A curtain that never ends must show up as a failed check, not as a crash.
const waitForEnd = (page) => page.waitForFunction(() => getComputedStyle(document.querySelector('.vs-reveal-curtain')).visibility === 'hidden', null, { timeout: 8000 }).catch(() => undefined);
// Waits until every entrance (side menu, body, header, title letters) has finished, whatever the browser's frame rate. A fixed sleep was too
// short in WebKit once the title letters (blur filters) were added: its frames came late and the animations were not yet at the end. An entrance
// that never ends is not hidden by this: the wait stops after 10 seconds and the snapshot that follows shows it (a failed check).
const waitForEntrances = (page) => page.waitForFunction(() => document.getAnimations().every((a) => a.animationName === 'vs-reveal-curtain'), null, { timeout: 10000, polling: 100 }).catch(() => undefined);
// Waits until no text-effect animation is left (the title letters of the Text Effects page).
const waitForTextAnimations = (page) => page.waitForFunction(() => document.getAnimations().every((a) => !(a.animationName || '').startsWith('vs-reveal-text')), null, { timeout: 10000, polling: 100 }).catch(() => undefined);
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
      // When each animation really starts, from the animation itself (start time on the document timeline plus its
      // delay), not from the time the animationstart event arrived: an event reaches the page in some later frame,
      // and in WebKit that gap moved the measured start of the side menu by about 150ms between runs.
      window.__active = {};
      window.__letters = [];
      const seenLetters = new WeakSet();
      const sample = () => {
        for (const a of document.getAnimations()) {
          const n = a.animationName;
          if (n === 'vs-reveal-text-rise' && a.startTime != null && !seenLetters.has(a)) {
            seenLetters.add(a);
            window.__letters.push(Math.round(Number(a.startTime) + a.effect.getTiming().delay));
          }
          if (n && n.startsWith('vs-reveal') && a.startTime != null && !(n in window.__active)) {
            window.__active[n] = Math.round(Number(a.startTime) + a.effect.getTiming().delay);
          }
        }
        if (performance.now() < 6000) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
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
    // keyboard: while the body is not shown yet (curtain up) Tab must not land on a hidden link; once it is shown it must
    await page.keyboard.press('Tab');
    const focusedDuring = await page.evaluate(() => (document.activeElement && document.activeElement.id) || '');
    check(name, 'keyboard: while the body is not shown yet, Tab does not land on its (invisible) link', focusedDuring !== 'demo-link', `focused: "${focusedDuring}"`);
    await waitForEnd(page);
    await waitForEntrances(page); // the entrances run 150ms + 700ms after the curtain; the title's last letter ends 150 + 7 x 35 + 420ms after it
    await page.focus('#demo-replay'); // the focusable element after the link: one step back must reach the link
    await page.keyboard.press('Shift+Tab');
    const focusedAfter = await page.evaluate(() => (document.activeElement && document.activeElement.id) || '');
    check(name, 'keyboard: once the opening is over, the link in the body can take focus', focusedAfter === 'demo-link', `focused: "${focusedAfter}"`);
    const after = await snapshot(page);
    check(name, 'afterwards the curtain is hidden and every element is back to plain styles (no transform, fully visible, nothing held)', plain(after), JSON.stringify(after));
    check(name, 'a data-vs-reveal element inside another one does not animate by itself', during.nestedAnimations === 0 && after.nestedAnimations === 0);
    const starts = await page.evaluate(() => window.__starts);
    const active = await page.evaluate(() => window.__active);
    const at = (n) => (starts.find((s) => s[0] === n) || [])[1];
    const eventText = `events: curtain ${at('vs-reveal-curtain')}, side +${at('vs-reveal-slide-left') - at('vs-reveal-curtain')}, fade +${at('vs-reveal-fade') - at('vs-reveal-curtain')}, rise +${at('vs-reveal-rise') - at('vs-reveal-curtain')}`;
    const curtainAt = active['vs-reveal-curtain']; const sideAt = active['vs-reveal-slide-left']; const fadeAt = active['vs-reveal-fade']; const riseAt = active['vs-reveal-rise'];
    const known = [curtainAt, sideAt, fadeAt, riseAt].every((v) => Number.isFinite(v));
    // Expected from the CSS: the side menu starts when the curtain ends (--vs-motion-duration-curtain, 1050ms), the body and the header 150ms after that.
    check(name, 'order: the side menu starts when the curtain ends (about 1 second after it), the body and the header start after the side menu',
      known && sideAt - curtainAt > 900 && sideAt - curtainAt < 1200 && fadeAt - sideAt > 100 && fadeAt - sideAt < 250 && riseAt - sideAt > 100 && riseAt - sideAt < 250,
      `animation start times: curtain ${curtainAt}, side +${sideAt - curtainAt}, fade +${fadeAt - curtainAt}, rise +${riseAt - curtainAt}; ${eventText}`);
    // the title: its letters start one after another from the left, one stagger apart (35ms from the token), the first one together with the body
    const letters = await page.evaluate(() => window.__letters);
    const gaps = letters.slice(1).map((t, i) => t - letters[i]);
    check(name, 'title: 8 letters start in order, about 35ms apart, the first one 150ms after the side menu',
      letters.length === 8 && gaps.every((g) => g >= 20 && g <= 50) && letters[0] - sideAt > 100 && letters[0] - sideAt < 250,
      `letters ${JSON.stringify(letters)}, gaps ${JSON.stringify(gaps)}, first - side ${letters[0] - sideAt}`);
    check(name, 'title: afterwards every letter is in plain styles (fully visible, no transform, no filter)',
      after.letters.length === 8 && after.letters.every((l) => l.opacity === '1' && (l.transform === 'none' || l.transform === 'matrix(1, 0, 0, 1, 0, 0)') && l.filter === 'none'), JSON.stringify(after.letters));
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
    await waitForEntrances(page);
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
    await waitForEntrances(page);
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

  { // the Text Effects page: both effects, the menu entry, the count-up ends on its final figures, Replay works, reduced motion shows the final state
    const { context, page } = await open();
    await page.goto(`${BASE}/components/text-effects.html`);
    const figures = () => page.evaluate(() => [...document.querySelectorAll('#count-stage [data-vs-animated-number] [aria-hidden="true"]')].map((e) => e.textContent));
    await sleep(1500);
    const below = await page.evaluate(() => ({ top: document.getElementById('count-stage').getBoundingClientRect().top, height: innerHeight }));
    const before = await figures();
    check(name, 'the count-up below the fold shows 0 and waits until it is scrolled into view', below.top < below.height || (before[0] === '0' && before[1] === '0.00'), JSON.stringify({ below, before }));
    await page.evaluate(() => document.getElementById('count-stage').scrollIntoView());
    await page.waitForFunction(() => [...document.querySelectorAll('#count-stage [data-vs-animated-number]')].every((el) => el.querySelector('[aria-hidden="true"]').textContent === el.getAttribute('data-demo-final')), null, { timeout: 8000, polling: 100 }).catch(() => undefined);
    await waitForTextAnimations(page);
    await sleep(300); // the figure passes through its final text a frame or two before the last frame: let the last frame happen, then read
    const t = await page.evaluate(() => ({
      nav: [...document.querySelectorAll('a')].some((a) => a.getAttribute('href') === '/components/text-effects.html'),
      sections: ['title-wipe', 'number-count-up', 'adding-an-effect'].every((id) => !!document.getElementById(id)),
      letters: [...document.querySelectorAll('#wipe-stage .vs-reveal-text__letter')].map((l) => { const c = getComputedStyle(l); return c.opacity === '1' && c.transform === 'none' && c.filter === 'none'; }),
      realText: document.querySelector('#wipe-stage .vs-reveal-text__sr')?.textContent,
    }));
    check(name, 'the Text Effects page loads with both effects, the menu entry, and the title ends in plain styles', t.nav && t.sections && t.letters.length > 10 && t.letters.every(Boolean) && t.realText === 'Welcome back, Overview', JSON.stringify(t));
    const final = await figures();
    check(name, 'the count-up demo ends on exactly its final figures (the server text)', final[0] === '4,214' && final[1] === '12.35', JSON.stringify(final));
    await page.click('#replay-count');
    await sleep(120);
    const during = await figures();
    check(name, 'Replay starts the count again (the figures are not the final ones a moment later)', during[0] !== '4,214' && during[1] !== '12.35', JSON.stringify(during));
    await page.waitForFunction(() => [...document.querySelectorAll('#count-stage [data-vs-animated-number]')].every((el) => el.querySelector('[aria-hidden="true"]').textContent === el.getAttribute('data-demo-final')), null, { timeout: 8000, polling: 100 }).catch(() => undefined);
    await sleep(300);
    const again = await figures();
    check(name, 'after Replay the figures end on the final text again', again[0] === '4,214' && again[1] === '12.35', JSON.stringify(again));
    await context.close();
    const reduced = await open({ reducedMotion: 'reduce' });
    await reduced.page.goto(`${BASE}/components/text-effects.html`);
    await sleep(300);
    const r = await reduced.page.evaluate(() => ({
      figures: [...document.querySelectorAll('#count-stage [data-vs-animated-number] [aria-hidden="true"]')].map((e) => e.textContent),
      running: document.getAnimations().length,
    }));
    check(name, 'Text Effects, reduced motion: the final figures at once, no animation runs', r.figures[0] === '4,214' && r.figures[1] === '12.35' && r.running === 0, JSON.stringify(r));
    await reduced.context.close();
  }

  await browser.close();
}

for (const name of wanted) await run(name);
server.close();
console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll checks passed');
process.exit(failed ? 1 : 0);
