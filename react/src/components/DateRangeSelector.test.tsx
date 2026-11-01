import React, { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

// ---------------------------------------------------------------------------------------------------------------------
// Custom date range (allowCustom)
// ---------------------------------------------------------------------------------------------------------------------

type Range = { from: string; to: string };

function CustomHarness({
  initialValue = '7d',
  initialCustom = null,
  onChange,
  onCustomChange,
  ...rest
}: {
  initialValue?: string;
  initialCustom?: Range | null;
  onChange?: (id: string) => void;
  onCustomChange?: (r: Range) => void;
} & Partial<React.ComponentProps<typeof DateRangeSelector>>) {
  const [value, setValue] = useState(initialValue);
  const [custom, setCustom] = useState<Range | null>(initialCustom);
  return (
    <DateRangeSelector
      allowCustom
      maxDate="2026-11-01"
      {...rest}
      value={value}
      customRange={custom}
      onChange={(id) => {
        onChange?.(id);
        setValue(id);
      }}
      onCustomChange={(r) => {
        onCustomChange?.(r);
        setCustom(r);
      }}
    />
  );
}

const customButton = () => screen.getByRole('button', { name: /^Custom range/ });
const calendarDay = (name: string) => screen.getByRole('button', { name });
const pickerDialog = () => screen.getByRole('dialog', { name: 'Custom date range' });
const stubNarrow = (narrow: boolean) => {
  window.matchMedia = ((q: string) => ({ matches: narrow, media: q, addEventListener: () => {}, removeEventListener: () => {} })) as unknown as typeof window.matchMedia;
};

describe('DateRangeSelector: custom range off (default)', () => {
  it('has no Custom button and no extra sheet row', () => {
    stubNarrow(false);
    render(<Harness />);
    expect(screen.queryByRole('button', { name: /^Custom range/ })).toBeNull();
    expect(document.querySelector('.vs-date-range__sep')).toBeNull();
  });
});

// "Today" must not depend on the day the tests run: only Date is faked (timers stay real, so user-event still works).
function fakeToday() {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 20, 12, 0, 0));
  });
  afterEach(() => {
    vi.useRealTimers();
  });
}

describe('DateRangeSelector: custom range', () => {
  fakeToday();

  it('shows a Custom button after a divider, not pressed until a custom range is applied', () => {
    stubNarrow(false);
    render(<CustomHarness />);
    const btn = customButton();
    expect(btn.getAttribute('aria-haspopup')).toBe('dialog');
    expect(btn.getAttribute('aria-pressed')).toBe('false');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(btn.textContent).toBe(''); // icon only until a range is applied
    expect(document.querySelector('.vs-date-range__sep')).not.toBeNull();
  });

  it('opens a named dialog with From / To, the calendar and Apply off until both dates are picked', async () => {
    stubNarrow(false);
    render(<CustomHarness />);
    await userEvent.click(customButton());
    const dlg = pickerDialog();
    expect(customButton().getAttribute('aria-expanded')).toBe('true');
    expect(within(dlg).getAllByText('Pick a date')).toHaveLength(2);
    expect((within(dlg).getByRole('button', { name: 'Apply' }) as HTMLButtonElement).disabled).toBe(true);
    expect(document.querySelectorAll('.vs-rc-title')).toHaveLength(2); // two months on a wide screen
  });

  it('shows the picked dates as DD MMM YYYY with the number of days, and turns Apply on', async () => {
    stubNarrow(false);
    render(<CustomHarness />);
    await userEvent.click(customButton());
    await userEvent.click(calendarDay('14 October 2026'));
    expect((screen.getByRole('button', { name: 'Apply' }) as HTMLButtonElement).disabled).toBe(true); // only From so far
    await userEvent.click(calendarDay('20 October 2026'));
    const dlg = pickerDialog();
    expect(within(dlg).getByText('14 Oct 2026')).toBeTruthy();
    expect(within(dlg).getByText('20 Oct 2026')).toBeTruthy();
    expect(within(dlg).getByText('7 days selected')).toBeTruthy();
    expect((within(dlg).getByRole('button', { name: 'Apply' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('says "1 day" for a one-day range', async () => {
    stubNarrow(false);
    render(<CustomHarness />);
    await userEvent.click(customButton());
    await userEvent.click(calendarDay('28 October 2026'));
    await userEvent.click(calendarDay('28 October 2026'));
    expect(within(pickerDialog()).getByText('1 day selected')).toBeTruthy();
  });

  it('Apply hands back the range, switches to custom, closes, and the button shows the dates', async () => {
    stubNarrow(false);
    const onChange = vi.fn();
    const onCustomChange = vi.fn();
    render(<CustomHarness onChange={onChange} onCustomChange={onCustomChange} />);
    await userEvent.click(customButton());
    await userEvent.click(calendarDay('20 October 2026')); // picked in reverse order on purpose
    await userEvent.click(calendarDay('14 October 2026'));
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onCustomChange).toHaveBeenCalledWith({ from: '2026-10-14', to: '2026-10-20' });
    expect(onChange).toHaveBeenCalledWith('custom');
    expect(screen.queryByRole('dialog', { name: 'Custom date range' })).toBeNull();
    const btn = customButton();
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    expect(btn.classList.contains('is-active')).toBe(true);
    expect(btn.textContent).toBe('14–20 Oct');
    expect(btn.getAttribute('aria-label')).toBe('Custom range 14–20 Oct'); // starts with the visible text
    expect(btn.getAttribute('title')).toBe('14 Oct 2026 to 20 Oct 2026');
    expect(within(desktopGroup()).getByRole('button', { name: '7D, 7 Days' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('applying a new range while custom is already selected does not call onChange again', async () => {
    stubNarrow(false);
    const onChange = vi.fn();
    const onCustomChange = vi.fn();
    render(<CustomHarness initialValue="custom" initialCustom={{ from: '2026-10-14', to: '2026-10-20' }} onChange={onChange} onCustomChange={onCustomChange} />);
    await userEvent.click(customButton());
    // the applied range is preselected
    expect(calendarDay('14 October 2026').getAttribute('aria-pressed')).toBe('true');
    expect(calendarDay('20 October 2026').getAttribute('aria-pressed')).toBe('true');
    await userEvent.click(calendarDay('3 October 2026'));
    await userEvent.click(calendarDay('5 October 2026'));
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onCustomChange).toHaveBeenCalledWith({ from: '2026-10-03', to: '2026-10-05' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('Cancel and Escape close without changing anything, and a reopened picker starts from the applied range', async () => {
    stubNarrow(false);
    const onChange = vi.fn();
    const onCustomChange = vi.fn();
    render(<CustomHarness initialValue="custom" initialCustom={{ from: '2026-10-14', to: '2026-10-20' }} onChange={onChange} onCustomChange={onCustomChange} />);
    await userEvent.click(customButton());
    await userEvent.click(calendarDay('3 October 2026')); // an abandoned draft
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog', { name: 'Custom date range' })).toBeNull();
    await userEvent.click(customButton());
    expect(within(pickerDialog()).getByText('14 Oct 2026')).toBeTruthy();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Custom date range' })).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
    expect(onCustomChange).not.toHaveBeenCalled();
  });

  it('clicking a preset while a custom range is applied selects the preset', async () => {
    stubNarrow(false);
    const onChange = vi.fn();
    render(<CustomHarness initialValue="custom" initialCustom={{ from: '2026-10-14', to: '2026-10-20' }} onChange={onChange} />);
    await userEvent.click(within(desktopGroup()).getByRole('button', { name: '90D, 90 Days' }));
    expect(onChange).toHaveBeenCalledWith('90d');
    expect(customButton().getAttribute('aria-pressed')).toBe('false');
  });

  it('passes maxDays, minDate and maxDate to the calendar and says so in the help text', async () => {
    stubNarrow(false);
    render(<CustomHarness maxDays={7} minDate="2026-10-05" maxDate="2026-11-01" />);
    await userEvent.click(customButton());
    expect((calendarDay('4 October 2026') as HTMLButtonElement).disabled).toBe(true); // before minDate
    await userEvent.click(calendarDay('14 October 2026'));
    expect((calendarDay('21 October 2026') as HTMLButtonElement).disabled).toBe(true); // 8 days
    expect((calendarDay('20 October 2026') as HTMLButtonElement).disabled).toBe(false); // 7 days
    const help = within(pickerDialog()).getByText(/Pick up to/).textContent;
    expect(help).toBe('Latest day: 01 Nov 2026. Earliest day: 05 Oct 2026. Pick up to 7 days.');
  });

  it('says "Days after today are unavailable" when the last day is today', async () => {
    stubNarrow(false);
    render(<CustomHarness maxDate={undefined} />);
    await userEvent.click(customButton());
    expect(within(pickerDialog()).getByText(/Pick up to/).textContent).toBe('Days after today are unavailable. Pick up to 365 days.');
  });

  it('clicking the Custom button again closes the picker', async () => {
    stubNarrow(false);
    render(<CustomHarness />);
    await userEvent.click(customButton());
    await userEvent.click(customButton());
    expect(screen.queryByRole('dialog', { name: 'Custom date range' })).toBeNull();
  });
});

describe('DateRangeSelector: custom range on a phone', () => {
  fakeToday();

  it('adds a "Custom range…" row to the sheet; it opens the picker as a one-month bottom sheet', async () => {
    stubNarrow(true);
    render(<CustomHarness />);
    await userEvent.click(trigger());
    const sheet = screen.getAllByRole('dialog').find((d) => within(d).queryByText('7 Days'))!;
    expect(within(sheet).getAllByRole('button').map((b) => b.textContent)).toEqual(['', 'Today', '3 Days', '7 Days', '90 Days', 'Custom range…']);
    await userEvent.click(within(sheet).getByText('Custom range…'));
    const dlg = pickerDialog();
    expect(dlg.getAttribute('aria-modal')).toBe('true');
    expect(dlg.classList.contains('vs-popover--sheet')).toBe(true);
    expect(document.querySelectorAll('.vs-rc-title')).toHaveLength(1); // one month on a phone
    await userEvent.click(screen.getByRole('button', { name: 'Previous month' })); // it opens on the latest month (November)
    await userEvent.click(calendarDay('14 October 2026'));
    await userEvent.click(calendarDay('20 October 2026'));
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(trigger().textContent).toBe('14–20 Oct');
    expect(trigger().getAttribute('aria-label')).toBe('Date range: custom, 14–20 Oct');
  });

  it('marks the custom row as selected in the sheet while a custom range is applied', async () => {
    stubNarrow(true);
    render(<CustomHarness initialValue="custom" initialCustom={{ from: '2026-10-14', to: '2026-10-20' }} />);
    await userEvent.click(trigger());
    const sheet = screen.getAllByRole('dialog').find((d) => within(d).queryByText('7 Days'))!;
    expect(within(sheet).getByText('Custom range: 14–20 Oct')).toBeTruthy();
  });
});
