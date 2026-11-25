import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { RewindItem } from './RewindItem';
import { REWIND_HARD_MAX_STEPS } from './rewindOrder';

// jsdom runs no CSS animation: these tests check the markup the CSS contract needs (the attribute and the step variable on the
// element itself, no wrapper). How it moves is shown in the docs page and checked in a real browser (see HISTORY).
afterEach(cleanup);

describe('RewindItem', () => {
  it('is the element itself: data-vs-rewind and the step variable, no wrapper', () => {
    const { container } = render(<RewindItem as="li" index={3} id="d" className="day">12</RewindItem>);
    expect(container.children.length).toBe(1);
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe('LI');
    expect(el.hasAttribute('data-vs-rewind')).toBe(true);
    expect(el.style.getPropertyValue('--vs-rewind-i')).toBe('3');
    expect(el.id).toBe('d');
    expect(el.className).toBe('day');
    expect(el.textContent).toBe('12');
  });
  it('step 0 (today) still animates, at once', () => {
    const { container } = render(<RewindItem index={0} />);
    expect(container.firstElementChild!.hasAttribute('data-vs-rewind')).toBe(true);
    expect((container.firstElementChild as HTMLElement).style.getPropertyValue('--vs-rewind-i')).toBe('0');
  });
  it('null, undefined, negative, NaN and non-number: no attribute and no variable (shown at once)', () => {
    for (const bad of [null, undefined, -1, NaN, Infinity, '3' as unknown as number]) {
      const { container, unmount } = render(<RewindItem index={bad} />);
      const el = container.firstElementChild as HTMLElement;
      expect(el.hasAttribute('data-vs-rewind')).toBe(false);
      expect(el.style.getPropertyValue('--vs-rewind-i')).toBe('');
      unmount();
    }
  });
  it('a fractional step is rounded down and a huge one is cut at the hard limit', () => {
    const a = render(<RewindItem index={2.9} />);
    expect((a.container.firstElementChild as HTMLElement).style.getPropertyValue('--vs-rewind-i')).toBe('2');
    a.unmount();
    const b = render(<RewindItem index={99999} />);
    expect((b.container.firstElementChild as HTMLElement).style.getPropertyValue('--vs-rewind-i')).toBe(String(REWIND_HARD_MAX_STEPS));
  });
  it('keeps the style the caller passed', () => {
    const { container } = render(<RewindItem index={1} style={{ color: 'red' }} />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.color).toBe('red');
    expect(el.style.getPropertyValue('--vs-rewind-i')).toBe('1');
  });
  it('passes other attributes through (aria, data) and defaults to a div', () => {
    const { container } = render(<RewindItem index={1} aria-label="12 November" data-day="2026-11-12" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe('DIV');
    expect(el.getAttribute('aria-label')).toBe('12 November');
    expect(el.getAttribute('data-day')).toBe('2026-11-12');
  });
});
