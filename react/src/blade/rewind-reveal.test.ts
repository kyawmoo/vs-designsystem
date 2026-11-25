import { afterEach, describe, expect, it } from 'vitest';
import SRC from '../../../blade/rewind-reveal.js?raw';
import fixtures from '../fixtures-rewind-order.json';

// Tests the plain script (blade/rewind-reveal.js) in jsdom, and that its rule gives the same answers as the React helper.
type Api = { indexByDay: (d: unknown[], t: string, m?: number) => Record<string, number>; apply: (c: Element, t: string, o?: { maxSteps?: number }) => number; clear: (c: Element) => void };
function load(): Api {
  const mod: { exports: any } = { exports: {} };
  new Function('module', 'window', SRC)(mod, window);
  return mod.exports;
}
const grid = (days: string[]) => {
  document.body.innerHTML = `<div id="g">${days.map((d) => `<div data-vs-rewind-day="${d}">${d.slice(8)}</div>`).join('')}</div>`;
  return document.getElementById('g')!;
};
const cell = (g: Element, d: string) => g.querySelector(`[data-vs-rewind-day="${d}"]`) as HTMLElement;
afterEach(() => { document.body.innerHTML = ''; });

describe('VsRewind.indexByDay: the shared fixtures', () => {
  for (const f of fixtures as { name: string; days: unknown[]; today: string; maxSteps?: number; expected: Record<string, number> }[]) {
    it(f.name, () => {
      expect(load().indexByDay(f.days, f.today, f.maxSteps)).toEqual(f.expected);
    });
  }
  it('a today that is not a real day throws', () => {
    for (const bad of ['', 'today', '2026-02-30', undefined as unknown as string]) expect(() => load().indexByDay(['2026-11-10'], bad)).toThrow(RangeError);
  });
  it('a bad maxSteps (0, -1, 1.5, NaN) gives the default of 18 steps', () => {
    const days = Array.from({ length: 30 }, (_, i) => `2026-10-${String(30 - i).padStart(2, '0')}`);
    for (const bad of [0, -1, 1.5, NaN]) expect(Math.max(...Object.values(load().indexByDay(days, '2026-11-12', bad)))).toBe(18);
  });
});

describe('VsRewind.apply and clear', () => {
  it('today step 0, older days later, future days left plain', () => {
    const g = grid(['2026-11-14', '2026-11-12', '2026-11-11', '2026-11-05']);
    expect(load().apply(g, '2026-11-12')).toBe(3);
    expect(cell(g, '2026-11-12').style.getPropertyValue('--vs-rewind-i')).toBe('0');
    expect(cell(g, '2026-11-11').style.getPropertyValue('--vs-rewind-i')).toBe('1');
    expect(cell(g, '2026-11-05').style.getPropertyValue('--vs-rewind-i')).toBe('2');
    expect(cell(g, '2026-11-14').hasAttribute('data-vs-rewind')).toBe(false);
    expect(cell(g, '2026-11-14').style.getPropertyValue('--vs-rewind-i')).toBe('');
    expect(cell(g, '2026-11-12').hasAttribute('data-vs-rewind')).toBe(true);
  });
  it('a second call (a new month, a redraw) recomputes from the cells that are there now', () => {
    const g = grid(['2026-11-12', '2026-11-11']);
    const api = load();
    api.apply(g, '2026-11-12');
    g.innerHTML = '<div data-vs-rewind-day="2026-10-31">31</div><div data-vs-rewind-day="2026-10-30">30</div>';
    expect(api.apply(g, '2026-11-12')).toBe(2);
    expect(cell(g, '2026-10-31').style.getPropertyValue('--vs-rewind-i')).toBe('1');
    expect(cell(g, '2026-10-30').style.getPropertyValue('--vs-rewind-i')).toBe('2');
  });
  it('replaying the same cells resets them first, so a cell that became a future day loses its attribute', () => {
    const g = grid(['2026-11-12', '2026-11-11']);
    const api = load();
    api.apply(g, '2026-11-12');
    expect(api.apply(g, '2026-11-11')).toBe(1);
    expect(cell(g, '2026-11-12').hasAttribute('data-vs-rewind')).toBe(false);
    expect(cell(g, '2026-11-11').style.getPropertyValue('--vs-rewind-i')).toBe('0');
  });
  it('cells whose date is not a real day are left plain; an empty or missing container is harmless', () => {
    const g = grid(['2026-02-30', 'abc', '2026-11-11']);
    const api = load();
    expect(api.apply(g, '2026-11-12')).toBe(1);
    expect(cell(g, 'abc').hasAttribute('data-vs-rewind')).toBe(false);
    expect(api.apply(document.createElement('div'), '2026-11-12')).toBe(0);
    expect(api.apply(null as unknown as Element, '2026-11-12')).toBe(0);
    expect(() => api.clear(null as unknown as Element)).not.toThrow();
  });
  it('apply with a bad today throws and leaves the cells as they were', () => {
    const g = grid(['2026-11-12']);
    const api = load();
    api.apply(g, '2026-11-12');
    expect(() => api.apply(g, 'oops')).toThrow(RangeError);
    expect(cell(g, '2026-11-12').hasAttribute('data-vs-rewind')).toBe(true);
  });
  it('maxSteps option cuts the steps', () => {
    const g = grid(['2026-11-12', '2026-11-11', '2026-11-10', '2026-11-09']);
    load().apply(g, '2026-11-12', { maxSteps: 2 });
    expect(cell(g, '2026-11-09').style.getPropertyValue('--vs-rewind-i')).toBe('2');
  });
  it('clear takes the attribute and the variable off', () => {
    const g = grid(['2026-11-12', '2026-11-11']);
    const api = load();
    api.apply(g, '2026-11-12');
    api.clear(g);
    for (const d of ['2026-11-12', '2026-11-11']) {
      expect(cell(g, d).hasAttribute('data-vs-rewind')).toBe(false);
      expect(cell(g, d).style.getPropertyValue('--vs-rewind-i')).toBe('');
    }
  });
});
