import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RangeCalendar } from './RangeCalendar';
import type { DateRangeValue, RangeCalendarProps } from './RangeCalendar';

afterEach(cleanup);

const TODAY = '2026-11-01'; // a Sunday

/** Controlled harness: the real usage (the page keeps the value). */
function Harness({ initial = { from: null, to: null }, onChange, ...rest }: { initial?: DateRangeValue; onChange?: (v: DateRangeValue) => void } & Partial<RangeCalendarProps>) {
  const [value, setValue] = useState<DateRangeValue>(initial);
  return (
    <RangeCalendar
      today={TODAY}
      {...rest}
      value={value}
      onChange={(v) => {
        onChange?.(v);
        setValue(v);
      }}
    />
  );
}

const day = (name: string) => screen.getByRole('button', { name });
const titles = () => Array.from(document.querySelectorAll('.vs-rc-title')).map((e) => e.textContent);

describe('RangeCalendar: what is shown', () => {
  it('opens on the latest two months that can be picked, Sunday first', () => {
    render(<Harness />);
    expect(titles()).toEqual(['October 2026', 'November 2026']);
    expect(Array.from(document.querySelectorAll('.vs-rc-weekday')).slice(0, 7).map((e) => e.textContent)).toEqual(['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']);
    expect(day('14 October 2026')).toBeTruthy(); // every day button is named by its full date
  });

  it('can start on Monday and can show one month', () => {
    render(<Harness weekStartsOn={1} months={1} />);
    expect(titles()).toEqual(['November 2026']);
    expect(Array.from(document.querySelectorAll('.vs-rc-weekday')).map((e) => e.textContent)[0]).toBe('Mo');
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Next month' })).toBeTruthy(); // one month: both arrows in the same header
  });

  it('opens on the month of the picked From date', () => {
    render(<Harness initial={{ from: '2026-08-12', to: '2026-08-14' }} />);
    expect(titles()).toEqual(['August 2026', 'September 2026']);
  });

  it('marks today with aria-current and nothing else', () => {
    render(<Harness />);
    expect(document.querySelectorAll('[aria-current="date"]')).toHaveLength(1);
    expect(day('1 November 2026').getAttribute('aria-current')).toBe('date');
  });

  it('treats a value that is not a real date as nothing picked', () => {
    render(<Harness initial={{ from: 'garbage', to: '2026-02-30' }} />);
    expect(document.querySelectorAll('[aria-pressed="true"]')).toHaveLength(0);
  });
});

describe('RangeCalendar: picking a range', () => {
  it('first click is From, second click is To, both marked', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.click(day('14 October 2026'));
    await userEvent.click(day('20 October 2026'));
    expect(onChange.mock.calls.map((c) => c[0])).toEqual([
      { from: '2026-10-14', to: null },
      { from: '2026-10-14', to: '2026-10-20' },
    ]);
    expect(day('14 October 2026').getAttribute('aria-pressed')).toBe('true');
    expect(day('20 October 2026').getAttribute('aria-pressed')).toBe('true');
    expect(day('17 October 2026').getAttribute('aria-pressed')).toBe('false');
  });

  it('swaps the two dates when they are picked in reverse order', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.click(day('20 October 2026'));
    await userEvent.click(day('14 October 2026'));
    expect(onChange).toHaveBeenLastCalledWith({ from: '2026-10-14', to: '2026-10-20' });
  });

  it('the same day twice is a one-day range', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.click(day('28 October 2026'));
    await userEvent.click(day('28 October 2026'));
    expect(onChange).toHaveBeenLastCalledWith({ from: '2026-10-28', to: '2026-10-28' });
  });

  it('a click after a finished range starts a new one', async () => {
    const onChange = vi.fn();
    render(<Harness initial={{ from: '2026-10-14', to: '2026-10-20' }} onChange={onChange} />);
    await userEvent.click(day('25 October 2026'));
    expect(onChange).toHaveBeenLastCalledWith({ from: '2026-10-25', to: null });
  });

  it('a range can cross a month end', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.click(day('30 October 2026'));
    await userEvent.click(day('1 November 2026'));
    expect(onChange).toHaveBeenLastCalledWith({ from: '2026-10-30', to: '2026-11-01' });
  });
});

describe('RangeCalendar: limits', () => {
  it('disables the days after today and does not pick them', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    expect((day('1 November 2026') as HTMLButtonElement).disabled).toBe(false);
    expect((day('2 November 2026') as HTMLButtonElement).disabled).toBe(true);
    await userEvent.click(day('2 November 2026'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('maxDate overrides "today" as the last pickable day', () => {
    render(<Harness maxDate="2026-10-20" />);
    expect((day('20 October 2026') as HTMLButtonElement).disabled).toBe(false);
    expect((day('21 October 2026') as HTMLButtonElement).disabled).toBe(true);
    expect(titles()).toEqual(['September 2026', 'October 2026']); // latest months that can be picked
  });

  it('minDate disables earlier days and stops the previous-month arrow', async () => {
    render(<Harness minDate="2026-10-10" />);
    expect((day('9 October 2026') as HTMLButtonElement).disabled).toBe(true);
    expect((day('10 October 2026') as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByRole('button', { name: 'Previous month' }) as HTMLButtonElement).disabled).toBe(true); // October is the first month
  });

  it('while the second date is pending, days that make a range longer than maxDays are disabled on both sides', async () => {
    render(<Harness maxDays={7} />);
    expect((day('1 October 2026') as HTMLButtonElement).disabled).toBe(false); // nothing picked yet: any day can start
    await userEvent.click(day('14 October 2026'));
    expect((day('20 October 2026') as HTMLButtonElement).disabled).toBe(false); // 14..20 = 7 days
    expect((day('21 October 2026') as HTMLButtonElement).disabled).toBe(true); // 8 days
    expect((day('8 October 2026') as HTMLButtonElement).disabled).toBe(false); // 8..14 = 7 days
    expect((day('7 October 2026') as HTMLButtonElement).disabled).toBe(true);
  });

  it('after a finished range every pickable day can start a new one again', async () => {
    render(<Harness maxDays={7} initial={{ from: '2026-10-14', to: '2026-10-20' }} />);
    expect((day('1 October 2026') as HTMLButtonElement).disabled).toBe(false);
  });

  it('the next-month arrow is off on the last month that can be picked, and the previous arrow goes back', async () => {
    render(<Harness />);
    expect((screen.getByRole('button', { name: 'Next month' }) as HTMLButtonElement).disabled).toBe(true);
    await userEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(titles()).toEqual(['September 2026', 'October 2026']);
    expect((screen.getByRole('button', { name: 'Next month' }) as HTMLButtonElement).disabled).toBe(false);
    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(titles()).toEqual(['October 2026', 'November 2026']);
  });
});

describe('RangeCalendar: keyboard', () => {
  it('has exactly one tab stop among the days', () => {
    render(<Harness />);
    const stops = Array.from(document.querySelectorAll<HTMLButtonElement>('.vs-rc-day')).filter((b) => b.tabIndex === 0);
    expect(stops).toHaveLength(1);
    expect(stops[0].getAttribute('aria-label')).toBe('1 November 2026'); // today, the last pickable day
  });

  it('moves by a day, a week, to the week ends and by a month', async () => {
    render(<Harness initial={{ from: '2026-10-14', to: '2026-10-14' }} />);
    day('14 October 2026').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(day('15 October 2026'));
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(day('22 October 2026'));
    await userEvent.keyboard('{ArrowLeft}{ArrowUp}');
    expect(document.activeElement).toBe(day('14 October 2026'));
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(day('11 October 2026')); // Sunday
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(day('17 October 2026')); // Saturday
    await userEvent.keyboard('{PageUp}');
    expect(document.activeElement).toBe(day('17 September 2026'));
    expect(titles()).toEqual(['September 2026', 'October 2026']); // the month scrolled into view
    await userEvent.keyboard('{PageDown}');
    expect(document.activeElement).toBe(day('17 October 2026'));
  });

  it('Monday-first: Home goes to the Monday of the week', async () => {
    render(<Harness weekStartsOn={1} initial={{ from: '2026-10-14', to: '2026-10-14' }} />);
    day('14 October 2026').focus();
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(day('12 October 2026'));
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(day('18 October 2026'));
  });

  it('does not move onto a disabled day (after today)', async () => {
    render(<Harness />);
    day('1 November 2026').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(day('1 November 2026'));
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(day('1 November 2026'));
    await userEvent.keyboard('{PageDown}');
    expect(document.activeElement).toBe(day('1 November 2026'));
  });

  it('does not move onto a day that would make the range longer than maxDays', async () => {
    render(<Harness maxDays={7} />);
    await userEvent.click(day('14 October 2026')); // second date pending
    day('14 October 2026').focus();
    await userEvent.keyboard('{ArrowDown}'); // 21 October = 8 days: not allowed
    expect(document.activeElement).toBe(day('14 October 2026'));
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}'); // 20 October = 7 days: allowed
    expect(document.activeElement).toBe(day('20 October 2026'));
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(day('20 October 2026'));
  });

  it('Enter picks the focused day', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    day('14 October 2026').focus();
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith({ from: '2026-10-14', to: null });
  });
});

describe('RangeCalendar: preview while the second date is pending', () => {
  const cell = (name: string) => day(name).closest('.vs-rc-cell') as HTMLElement;

  it('shades the days between the first date and the day under the pointer, and clears when the pointer leaves', async () => {
    render(<Harness />);
    await userEvent.click(day('14 October 2026'));
    await userEvent.hover(day('18 October 2026'));
    expect(cell('16 October 2026').classList.contains('is-in')).toBe(true);
    expect(cell('16 October 2026').classList.contains('is-preview')).toBe(true);
    expect(cell('14 October 2026').classList.contains('is-start')).toBe(true);
    expect(cell('18 October 2026').classList.contains('is-end')).toBe(true);
    expect(cell('20 October 2026').classList.contains('is-in')).toBe(false);
    fireEvent.mouseLeave(document.querySelector('.vs-range-calendar') as HTMLElement);
    expect(cell('16 October 2026').classList.contains('is-in')).toBe(false);
  });

  it('shades a finished range without the preview style', () => {
    render(<Harness initial={{ from: '2026-10-14', to: '2026-10-20' }} />);
    const mid = document.querySelector('.vs-rc-cell.is-in') as HTMLElement;
    expect(mid).not.toBeNull();
    expect(mid.classList.contains('is-preview')).toBe(false);
    expect(document.querySelectorAll('.vs-rc-cell.is-in')).toHaveLength(5); // 15..19
    expect(within(document.querySelector('.vs-range-calendar') as HTMLElement).getAllByRole('button', { pressed: true })).toHaveLength(2);
  });

  it('shades a range in reverse hover order too (hovering before the first date)', async () => {
    render(<Harness />);
    await userEvent.click(day('20 October 2026'));
    await userEvent.hover(day('16 October 2026'));
    expect(cell('18 October 2026').classList.contains('is-in')).toBe(true);
    expect(cell('16 October 2026').classList.contains('is-start')).toBe(true);
    expect(cell('20 October 2026').classList.contains('is-end')).toBe(true);
  });
});
