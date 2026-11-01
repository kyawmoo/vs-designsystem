import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DATE_RANGE_PRESETS, DateRangeSelector } from './DateRangeSelector';
import type { DateRangeOption } from './DateRangeSelector';

afterEach(cleanup);

/** Controlled harness: the real usage (state lives in the page). */
function Harness({
  initial = '7d',
  options,
  onChange,
  loading,
  summary,
}: {
  initial?: string;
  options?: DateRangeOption[];
  onChange?: (id: string) => void;
  loading?: boolean;
  summary?: React.ReactNode;
}) {
  const [value, setValue] = useState(initial);
  return (
    <DateRangeSelector
      options={options}
      value={value}
      loading={loading}
      summary={summary}
      onChange={(id) => {
        onChange?.(id);
        setValue(id);
      }}
    />
  );
}

const desktopGroup = () => screen.getByRole('group', { name: 'Date range' });
const trigger = () => screen.getByRole('button', { name: /^Date range:/ });

describe('DateRangeSelector: desktop buttons', () => {
  it('shows the four presets in order with short labels', () => {
    render(<Harness />);
    const labels = within(desktopGroup())
      .getAllByRole('button')
      .map((b) => b.textContent);
    expect(labels).toEqual(['Today', '3D', '7D', '90D']);
    expect(DATE_RANGE_PRESETS.map((p) => p.id)).toEqual(['today', '3d', '7d', '90d']);
  });

  it('marks only the selected option as pressed and active', () => {
    render(<Harness initial="3d" />);
    const buttons = within(desktopGroup()).getAllByRole('button');
    expect(buttons.map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'true', 'false', 'false']);
    expect(buttons.filter((b) => b.classList.contains('is-active'))).toHaveLength(1);
    expect(buttons[1].classList.contains('is-active')).toBe(true);
  });

  it('keeps the visible text inside the accessible name and adds the full word', () => {
    render(<Harness />);
    expect(within(desktopGroup()).getByRole('button', { name: '3D, 3 Days' })).toBeTruthy();
    expect(within(desktopGroup()).getByRole('button', { name: 'Today' })).toBeTruthy();
  });

  it('calls onChange with the id of the clicked option', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.click(within(desktopGroup()).getByRole('button', { name: '90D, 90 Days' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('90d');
    expect(within(desktopGroup()).getByRole('button', { name: '90D, 90 Days' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('does not call onChange for the option that is already selected', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.click(within(desktopGroup()).getByRole('button', { name: '7D, 7 Days' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('can be driven from the keyboard (Tab to a button, Enter selects)', async () => {
    const onChange = vi.fn();
    render(<Harness initial="today" onChange={onChange} />);
    await userEvent.tab();
    await userEvent.tab();
    expect(document.activeElement?.textContent).toBe('3D');
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('3d');
  });

  it('accepts a custom option list', async () => {
    const onChange = vi.fn();
    const options: DateRangeOption[] = [
      { id: 'today', label: 'Today', fullLabel: 'Today' },
      { id: '3d', label: '3D', fullLabel: '3 Days' },
      { id: '7d', label: '7D', fullLabel: '7 Days' },
    ];
    render(<Harness options={options} initial="today" onChange={onChange} />);
    expect(within(desktopGroup()).getAllByRole('button')).toHaveLength(3);
    await userEvent.click(within(desktopGroup()).getByRole('button', { name: '7D, 7 Days' }));
    expect(onChange).toHaveBeenCalledWith('7d');
  });

  it('renders nothing for an empty option list', () => {
    const { container } = render(<DateRangeSelector options={[]} value="7d" onChange={() => {}} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows no pressed button when the value matches no option', () => {
    render(<Harness initial="nope" />);
    const buttons = within(desktopGroup()).getAllByRole('button');
    expect(buttons.every((b) => b.getAttribute('aria-pressed') === 'false')).toBe(true);
    expect(trigger().getAttribute('aria-label')).toBe('Date range: none selected');
  });
});

describe('DateRangeSelector: loading', () => {
  it('marks only the selected button busy and shows a spinner there', () => {
    render(<Harness loading />);
    const buttons = within(desktopGroup()).getAllByRole('button');
    expect(buttons.map((b) => b.getAttribute('aria-busy'))).toEqual([null, null, 'true', null]);
    const spinners = desktopGroup().querySelectorAll('.vs-date-range__spinner');
    expect(spinners).toHaveLength(1);
    expect(spinners[0].getAttribute('aria-hidden')).toBe('true');
    expect(buttons[2].contains(spinners[0])).toBe(true);
  });

  it('keeps every button clickable while loading (latest click wins)', async () => {
    const onChange = vi.fn();
    render(<Harness loading onChange={onChange} />);
    await userEvent.click(within(desktopGroup()).getByRole('button', { name: '3D, 3 Days' }));
    await userEvent.click(within(desktopGroup()).getByRole('button', { name: 'Today' }));
    expect(onChange.mock.calls.map((c) => c[0])).toEqual(['3d', 'today']);
  });

  it('shows no spinner and no aria-busy when not loading', () => {
    render(<Harness />);
    expect(document.querySelector('.vs-date-range__spinner')).toBeNull();
    expect(document.querySelector('[aria-busy]')).toBeNull();
  });
});

describe('DateRangeSelector: summary', () => {
  it('renders the summary in a polite live region', () => {
    render(<Harness summary="26 Oct – 1 Nov 2026 · 7 days" />);
    const el = screen.getByText('26 Oct – 1 Nov 2026 · 7 days');
    expect(el.getAttribute('aria-live')).toBe('polite');
  });

  it('renders no summary element when none is given or it is empty', () => {
    const { rerender } = render(<DateRangeSelector value="7d" onChange={() => {}} />);
    expect(document.querySelector('.vs-date-range__summary')).toBeNull();
    rerender(<DateRangeSelector value="7d" onChange={() => {}} summary="" />);
    expect(document.querySelector('.vs-date-range__summary')).toBeNull();
  });
});

describe('DateRangeSelector: mobile trigger and sheet', () => {
  it('shows the selected range on the trigger, closed at first', () => {
    render(<Harness initial="90d" />);
    expect(trigger().textContent).toBe('90D');
    expect(trigger().getAttribute('aria-label')).toBe('Date range: 90 Days');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(trigger().getAttribute('aria-haspopup')).toBe('dialog');
  });

  it('opens the sheet from the trigger and lists the full labels', async () => {
    render(<Harness />);
    await userEvent.click(trigger());
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    const sheet = screen.getByRole('dialog');
    expect(within(sheet).getAllByRole('button').map((b) => b.textContent)).toEqual(['', 'Today', '3 Days', '7 Days', '90 Days']);
  });

  it('picks from the sheet, closes it and updates the trigger', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.click(trigger());
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '3 Days' }));
    expect(onChange).toHaveBeenCalledWith('3d');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(trigger().textContent).toBe('3D');
  });

  it('closes without calling onChange when the selected option is picked again', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.click(trigger());
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '7 Days' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  });

  it('shows a spinner and aria-busy on the trigger while loading', () => {
    render(<Harness loading />);
    expect(trigger().getAttribute('aria-busy')).toBe('true');
    expect(trigger().querySelector('.vs-date-range__spinner')).not.toBeNull();
  });
});
