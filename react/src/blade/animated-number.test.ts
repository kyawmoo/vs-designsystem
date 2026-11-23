import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SRC from '../../../blade/animated-number.js?raw';

// Tests the Blade companion script (blade/animated-number.js) in jsdom: the markup is what the Blade component writes.
const markup = (value: string, text: string, extra = '') =>
  `<span id="n" data-vs-animated-number data-value="${value}" data-decimals="0" data-duration="1000" data-locale="en-US" ${extra}><span class="vs-animated-number__sr">${text}</span><span aria-hidden="true">${text}</span></span>`;

let reduced = false;
let observers: { cb: (e: any[]) => void; observed: Element[] }[] = [];
function load() {
  const mod: { exports: any } = { exports: {} };
  new Function('module', 'window', SRC)(mod, window);
  return mod.exports as { init: (c?: ParentNode) => void };
}
const text = () => document.querySelector('#n [aria-hidden="true"]')!.textContent;

beforeEach(() => {
  reduced = false;
  observers = [];
  (window as any).matchMedia = (q: string) => ({ matches: reduced && q.includes('reduce'), media: q });
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
});
afterEach(() => {
  document.body.innerHTML = '';
  delete (window as any).IntersectionObserver;
  vi.useRealTimers();
});

function withObserver() {
  (window as any).IntersectionObserver = class {
    cb: (e: any[]) => void;
    observed: Element[] = [];
    constructor(cb: (e: any[]) => void) {
      this.cb = cb;
      observers.push(this);
    }
    observe(el: Element) { this.observed.push(el); }
    unobserve(el: Element) { this.observed = this.observed.filter((x) => x !== el); }
  };
}

describe('animated-number.js', () => {
  it('counts up from 0 and puts the server text back at the end (without IntersectionObserver it starts at once)', () => {
    document.body.innerHTML = markup('4214', '4,214');
    load();
    expect(text()).toBe('0');
    vi.advanceTimersByTime(500);
    const mid = Number(text()!.replace(/,/g, ''));
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(4214);
    vi.advanceTimersByTime(700);
    expect(text()).toBe('4,214');
  });

  it('reduced motion: the final text stays, no timer is started', () => {
    reduced = true;
    const raf = vi.spyOn(window, 'requestAnimationFrame');
    document.body.innerHTML = markup('4214', '4,214');
    load();
    expect(text()).toBe('4,214');
    expect(raf).not.toHaveBeenCalled();
    raf.mockRestore();
  });

  it('the last text is exactly the server text, also with decimals and another number format', () => {
    document.body.innerHTML = '<span id="n" data-vs-animated-number data-value="1234.5" data-decimals="2" data-duration="600" data-locale="en-US"><span class="vs-animated-number__sr">1,234.50</span><span aria-hidden="true">1,234.50</span></span>';
    load();
    vi.advanceTimersByTime(300);
    expect(text()).toMatch(/^\d{1,3}(,\d{3})*\.\d{2}$/); // moving in cents
    vi.advanceTimersByTime(500);
    expect(text()).toBe('1,234.50');
  });

  it('the server text is put back exactly even when it is not what the formatter would write (a host that formats differently)', () => {
    document.body.innerHTML = markup('4214', '4.214');
    load();
    vi.advanceTimersByTime(1200);
    expect(text()).toBe('4.214');
  });

  it('below the fold: it shows 0 and starts only when the element is scrolled into view', () => {
    withObserver();
    document.body.innerHTML = markup('200', '200');
    load();
    expect(text()).toBe('0');
    vi.advanceTimersByTime(2000);
    expect(text()).toBe('0'); // not in view: nothing moves
    const el = document.getElementById('n')!;
    observers[0].cb([{ isIntersecting: false, target: el }]);
    vi.advanceTimersByTime(300);
    expect(text()).toBe('0');
    observers[0].cb([{ isIntersecting: true, target: el }]);
    expect(observers[0].observed).toHaveLength(0); // stops watching
    vi.advanceTimersByTime(1200);
    expect(text()).toBe('200');
  });

  it('skips a bad value or a duration of 0 and leaves the server text; init twice does not start it twice', () => {
    document.body.innerHTML = markup('abc', 'x') + '<span id="z" data-vs-animated-number data-value="5" data-duration="0"><span aria-hidden="true">5</span></span>';
    const api = load();
    expect(document.querySelector('#n [aria-hidden]')!.textContent).toBe('x');
    expect(document.querySelector('#z [aria-hidden]')!.textContent).toBe('5');
    document.body.innerHTML = markup('300', '300');
    api.init();
    api.init();
    vi.advanceTimersByTime(100);
    const afterTwo = Number(text());
    document.body.innerHTML = markup('300', '300');
    api.init();
    vi.advanceTimersByTime(100);
    expect(Number(text())).toBe(afterTwo); // same progress: one animation per element
  });

  it('a bad locale does not break it (falls back to plain digits)', () => {
    document.body.innerHTML = '<span id="n" data-vs-animated-number data-value="100" data-decimals="0" data-duration="500" data-locale="x_y_z!!"><span aria-hidden="true">100</span></span>';
    load();
    vi.advanceTimersByTime(700);
    expect(text()).toBe('100');
  });
});
