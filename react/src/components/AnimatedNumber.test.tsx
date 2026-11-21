import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { AnimatedNumber } from './AnimatedNumber';

// The old behaviour (count up, reduced motion, NaN as 0) is pinned in LineChart.test.tsx. These tests cover what was added:
// an empty value, decimals, the exact final figure and counting on from the last number.
let reducedMotion = false;
beforeEach(() => {
  reducedMotion = false;
  window.matchMedia = ((q: string) => ({ matches: reducedMotion && q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} })) as any;
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const visible = (c: HTMLElement) => c.querySelector('[aria-hidden="true"]')?.textContent ?? c.textContent;
const label = (c: HTMLElement) => c.querySelector('[aria-label]')?.getAttribute('aria-label');

describe('AnimatedNumber: empty value', () => {
  it('null and undefined show the fallback and start no animation', () => {
    const raf = vi.spyOn(globalThis, 'requestAnimationFrame');
    const a = render(<AnimatedNumber value={null} />);
    expect(a.container.textContent).toBe('—');
    expect(a.container.querySelector('[aria-label]')).toBeNull();
    const b = render(<AnimatedNumber value={undefined} fallback="n/a" />);
    expect(b.container.textContent).toBe('n/a');
    expect(raf).not.toHaveBeenCalled();
    raf.mockRestore();
  });

  it('a number that arrives later counts up from 0', () => {
    const { container, rerender } = render(<AnimatedNumber value={null} duration={1000} />);
    rerender(<AnimatedNumber value={200} duration={1000} />);
    expect(visible(container)).toBe('0');
    act(() => { vi.advanceTimersByTime(300); });
    const mid = Number(visible(container));
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(200);
    act(() => { vi.advanceTimersByTime(800); });
    expect(visible(container)).toBe('200');
  });

  it('after a number was shown, an empty value and then a new number counts on from the last one, not from 0', () => {
    reducedMotion = true; // shows 500 at once
    const { container, rerender } = render(<AnimatedNumber value={500} duration={1000} />);
    expect(visible(container)).toBe('500');
    rerender(<AnimatedNumber value={null} duration={1000} />);
    expect(container.textContent).toBe('—');
    reducedMotion = false;
    rerender(<AnimatedNumber value={600} duration={1000} />);
    act(() => { vi.advanceTimersByTime(100); });
    expect(Number(visible(container))).toBeGreaterThanOrEqual(500);
  });
});

describe('AnimatedNumber: decimals and the exact final figure', () => {
  it('moves in steps of 10^-decimals and ends on exactly the value, formatted by `format`', () => {
    const seen: number[] = [];
    const format = (v: number) => {
      seen.push(v);
      return v.toFixed(1);
    };
    const { container } = render(<AnimatedNumber value={12.35} decimals={2} duration={1000} format={format} />);
    act(() => { vi.advanceTimersByTime(500); });
    expect(seen.some((v) => v > 0 && v < 12.35)).toBe(true);
    for (const v of seen.filter((x) => x !== 12.35)) expect(Math.abs(Math.round(v * 100) - v * 100)).toBeLessThan(1e-9); // whole cents
    act(() => { vi.advanceTimersByTime(700); });
    expect(visible(container)).toBe('12.3'); // 12.35 with toFixed(1), not rounded again
    expect(seen[seen.length - 1]).toBe(12.35);
    expect(label(container)).toBe('12.3');
  });

  it('the last frame passes the value itself, not a value rounded to the steps (12.3456 stays 12.3456 with decimals 2)', () => {
    const { container } = render(<AnimatedNumber value={12.3456} decimals={2} duration={500} format={(v) => String(v)} />);
    act(() => { vi.advanceTimersByTime(700); });
    expect(visible(container)).toBe('12.3456');
  });

  it('the default format writes the decimals (12.30) and thousands separators (4,214)', () => {
    reducedMotion = true;
    const a = render(<AnimatedNumber value={12.3} decimals={2} />);
    expect(visible(a.container)).toBe('12.30');
    cleanup();
    const b = render(<AnimatedNumber value={4214} />);
    expect(visible(b.container)).toBe('4,214');
  });

  it('a decimals value that is out of range or not a whole number counts as 0', () => {
    reducedMotion = true;
    for (const d of [-1, 7, 1.5, Number.NaN]) {
      const { container } = render(<AnimatedNumber value={12.6} decimals={d} />);
      expect(visible(container)).toBe('13');
      cleanup();
    }
  });
});

describe('AnimatedNumber: whole steps by default', () => {
  it('with decimals 0 a custom format only ever sees whole numbers while it counts, and the exact value at the end', () => {
    const seen: number[] = [];
    const { container } = render(<AnimatedNumber value={1248} duration={1000} format={(v) => { seen.push(v); return String(v); }} />);
    for (let i = 0; i < 12; i++) act(() => { vi.advanceTimersByTime(100); }); // many small steps: one big step would run only the last frame
    expect(seen.length).toBeGreaterThan(8);
    expect(seen.some((v) => v > 0 && v < 1248)).toBe(true); // it really was in between
    for (const v of seen) expect(Number.isInteger(v)).toBe(true);
    expect(visible(container)).toBe('1248');
  });

  it('a value that is not a whole number still ends exactly on itself (12.5 with decimals 0 and a format that shows one decimal)', () => {
    const { container } = render(<AnimatedNumber value={12.5} duration={500} format={(v) => v.toFixed(1)} />);
    act(() => { vi.advanceTimersByTime(700); });
    expect(visible(container)).toBe('12.5');
  });
});

describe('AnimatedNumber: odd values', () => {
  it('negative and very large numbers end on the exact figure', () => {
    for (const v of [-2500, 1e12]) {
      const { container } = render(<AnimatedNumber value={v} duration={500} />);
      act(() => { vi.advanceTimersByTime(700); });
      expect(visible(container)).toBe(Math.round(v).toLocaleString());
      cleanup();
    }
  });

  it('a new value counts on from the number last shown', () => {
    const { container, rerender } = render(<AnimatedNumber value={1000} duration={1000} />);
    act(() => { vi.advanceTimersByTime(1100); });
    expect(visible(container)).toBe('1,000');
    rerender(<AnimatedNumber value={2000} duration={1000} />);
    act(() => { vi.advanceTimersByTime(50); });
    expect(Number(visible(container)!.replace(/,/g, ''))).toBeGreaterThanOrEqual(1000);
  });

  it('reduced motion shows the final figure at once, with decimals too', () => {
    reducedMotion = true;
    const { container } = render(<AnimatedNumber value={99.5} decimals={1} />);
    expect(visible(container)).toBe('99.5');
  });
});
