import React from 'react';
import { ArrowRight, Calendar, ChevronDown, Info, LoaderCircle } from 'lucide-react';
import { Button } from './Button';
import { FilterSheet } from './FilterSheet';
import { Popover, useIsNarrow } from './Popover';
import { RangeCalendar } from './RangeCalendar';
import type { DateRangeValue } from './RangeCalendar';
import { daysInclusive, formatDMY, formatRangeLabel, todayIsoDate } from './rangeCalendarDates';
import type { IsoDate, WeekStart } from './rangeCalendarDates';

export interface DateRangeOption {
  /** Unique within one selector. This is the value `onChange` hands back (for example `'7d'`). */
  id: string;
  /** Short text on the desktop buttons and the mobile trigger, e.g. `7D`. */
  label: string;
  /** Full text for screen readers and the mobile list, e.g. `7 Days`. */
  fullLabel: string;
}

/** Today · 3 Days · 7 Days · 90 Days. `id`s are `today`, `3d`, `7d`, `90d`. */
export const DATE_RANGE_PRESETS: DateRangeOption[] = [
  { id: 'today', label: 'Today', fullLabel: 'Today' },
  { id: '3d', label: '3D', fullLabel: '3 Days' },
  { id: '7d', label: '7D', fullLabel: '7 Days' },
  { id: '90d', label: '90D', fullLabel: '90 Days' },
];

/** The `value` that means "the custom range" (when `allowCustom` is on). Do not use it as the `id` of a preset. */
export const DATE_RANGE_CUSTOM_ID = 'custom';

export interface DateRangeSelectorProps {
  /** Defaults to `DATE_RANGE_PRESETS`. Pass your own list when a page needs other presets (for example Today / 3D / 7D). */
  options?: DateRangeOption[];
  /** The selected option's `id`. Controlled: the page owns the state. */
  value: string;
  /** Called with the new `id` when the viewer picks a different option. Not called for the option that is already selected. */
  onChange: (id: string) => void;
  /** The data for the selected range is being fetched: the selected button shows a spinner and `aria-busy`. Buttons stay clickable, so the latest click wins. */
  loading?: boolean;
  /** The resolved dates under the control, e.g. `26 Oct – 1 Nov 2026 · 7 days`. Announced politely when it changes. */
  summary?: React.ReactNode;
  /** Accessible name of the group and title of the mobile sheet. */
  label?: string;
  className?: string;
  /** Adds a Custom button (calendar icon). Picking a range there calls `onCustomChange` and then `onChange('custom')`. Default: off. */
  allowCustom?: boolean;
  /** The applied custom range. Shown on the button (`14–20 Oct`) while `value` is `'custom'`, and preselected when the picker opens. */
  customRange?: { from: IsoDate; to: IsoDate } | null;
  /** Called when the viewer applies a custom range (From and To are in order). */
  onCustomChange?: (range: { from: IsoDate; to: IsoDate }) => void;
  /** Earliest day the picker allows (`'YYYY-MM-DD'`). */
  minDate?: IsoDate;
  /** Latest day the picker allows. Default: today. */
  maxDate?: IsoDate;
  /** Longest custom range in days, both ends counted. Default 365. */
  maxDays?: number;
  /** `0` Sunday (default) or `1` Monday. */
  weekStartsOn?: WeekStart;
}

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

/** "7D, 7 Days": the accessible name starts with the visible text (WCAG 2.5.3) and still says the full word. */
const accessibleName = (option: DateRangeOption) =>
  option.label === option.fullLabel ? option.label : `${option.label}, ${option.fullLabel}`;

/**
 * Day-range selector for report pages: a compact segmented control on desktop; on phones one button (calendar icon +
 * current range) that opens a bottom sheet with the full list. Built on the segmented control look
 * (`.vs-segment-*`) and `FilterSheet`. With `allowCustom` it also has a Custom button that opens a `Popover` (a bottom
 * sheet on a phone) with a `RangeCalendar`, From / To, Cancel and Apply.
 *
 * Desktop and mobile are both rendered; CSS shows one of them (breakpoint 768px, the same as `FilterSheet`'s `md`).
 * The page decides where it sits, for example on the right of the page title.
 */
export function DateRangeSelector({
  options = DATE_RANGE_PRESETS,
  value,
  onChange,
  loading = false,
  summary,
  label = 'Date range',
  className,
  allowCustom = false,
  customRange = null,
  onCustomChange,
  minDate,
  maxDate,
  maxDays = 365,
  weekStartsOn = 0,
}: DateRangeSelectorProps) {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DateRangeValue>({ from: null, to: null });
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const customRef = React.useRef<HTMLButtonElement>(null);
  const narrow = useIsNarrow(768);

  if (options.length === 0) return null;

  const customActive = allowCustom && value === DATE_RANGE_CUSTOM_ID;
  const customLabel = customRange ? formatRangeLabel(customRange.from, customRange.to) : '';
  const active = customActive ? undefined : options.find((option) => option.id === value);

  const select = (id: string) => {
    if (id !== value) onChange(id);
  };

  const openPicker = () => {
    setDraft(customRange ? { from: customRange.from, to: customRange.to } : { from: null, to: null });
    setPickerOpen(true);
  };

  const apply = () => {
    if (!draft.from || !draft.to) return;
    onCustomChange?.({ from: draft.from, to: draft.to });
    if (value !== DATE_RANGE_CUSTOM_ID) onChange(DATE_RANGE_CUSTOM_ID);
    setPickerOpen(false);
  };

  const chosenDays = draft.from && draft.to ? daysInclusive(draft.from, draft.to) : 0;
  const today = todayIsoDate();
  const lastDay = maxDate ?? today;
  const helpText = `${lastDay === today ? 'Days after today are unavailable.' : `Latest day: ${formatDMY(lastDay)}.`}${
    minDate ? ` Earliest day: ${formatDMY(minDate)}.` : ''
  } Pick up to ${Math.max(1, Math.floor(maxDays))} days.`;

  return (
    <div className={cx('vs-date-range', className)}>
      <div className="vs-segment-control vs-date-range__desktop" role="group" aria-label={label}>
        {options.map((option) => {
          const isActive = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              className={cx('vs-segment-button', 'vs-segment-button--sm', 'vs-date-range__button', isActive && 'is-active')}
              aria-pressed={isActive}
              aria-label={accessibleName(option)}
              aria-busy={isActive && loading ? true : undefined}
              onClick={() => select(option.id)}
            >
              {isActive && loading && <LoaderCircle className="vs-date-range__spinner" size={14} aria-hidden="true" />}
              {option.label}
            </button>
          );
        })}
        {allowCustom && (
          <>
            <span className="vs-date-range__sep" aria-hidden="true" />
            <button
              ref={customRef}
              type="button"
              className={cx('vs-segment-button', 'vs-segment-button--sm', 'vs-date-range__button', 'vs-date-range__custom', customActive && 'is-active')}
              aria-pressed={customActive}
              aria-haspopup="dialog"
              aria-expanded={pickerOpen}
              aria-label={customActive && customLabel ? `Custom range ${customLabel}` : 'Custom range'}
              title={customActive && customRange ? `${formatDMY(customRange.from)} to ${formatDMY(customRange.to)}` : 'Custom range'}
              onClick={() => (pickerOpen ? setPickerOpen(false) : openPicker())}
            >
              <Calendar size={16} aria-hidden="true" />
              {customActive && customLabel && <span>{customLabel}</span>}
            </button>
          </>
        )}
      </div>

      <button
        ref={triggerRef}
        type="button"
        className="vs-date-range__trigger"
        aria-haspopup="dialog"
        aria-expanded={sheetOpen || pickerOpen}
        aria-label={`${label}: ${customActive ? (customLabel ? `custom, ${customLabel}` : 'custom') : active ? active.fullLabel : 'none selected'}`}
        aria-busy={loading ? true : undefined}
        onClick={() => setSheetOpen(true)}
      >
        <Calendar size={16} aria-hidden="true" />
        <span>{customActive && customLabel ? customLabel : active ? active.label : label}</span>
        {loading ? (
          <LoaderCircle className="vs-date-range__spinner" size={16} aria-hidden="true" />
        ) : (
          <ChevronDown size={16} aria-hidden="true" />
        )}
      </button>

      {summary != null && summary !== false && summary !== '' && (
        <div className="vs-date-range__summary" aria-live="polite">
          {summary}
        </div>
      )}

      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={label}
        groups={[
          {
            options: [
              ...options.map((option) => ({ id: option.id, label: option.fullLabel })),
              ...(allowCustom ? [{ id: DATE_RANGE_CUSTOM_ID, label: customActive && customLabel ? `Custom range: ${customLabel}` : 'Custom range…' }] : []),
            ],
            selectedId: value,
            onSelect: (id) => (allowCustom && id === DATE_RANGE_CUSTOM_ID ? openPicker() : select(id)),
          },
        ]}
      />

      {allowCustom && (
        <Popover open={pickerOpen} onClose={() => setPickerOpen(false)} anchorRef={narrow ? triggerRef : customRef} label="Custom date range" align="end">
          <div className="vs-drp">
            <div className="vs-drp-fields">
              <div className="vs-drp-field">
                <span className="vs-drp-field-label">From</span>
                <span className="vs-drp-field-value">{draft.from ? formatDMY(draft.from) : 'Pick a date'}</span>
              </div>
              <ArrowRight size={16} aria-hidden="true" className="vs-drp-arrow" />
              <div className="vs-drp-field">
                <span className="vs-drp-field-label">To</span>
                <span className="vs-drp-field-value">{draft.to ? formatDMY(draft.to) : 'Pick a date'}</span>
              </div>
              <span className="vs-drp-count" role="status">
                {chosenDays > 0 ? `${chosenDays} ${chosenDays === 1 ? 'day' : 'days'} selected` : ''}
              </span>
            </div>
            <RangeCalendar
              value={draft}
              onChange={setDraft}
              minDate={minDate}
              maxDate={maxDate}
              maxDays={maxDays}
              weekStartsOn={weekStartsOn}
              months={narrow ? 1 : 2}
              label="Custom range calendar"
            />
            <div className="vs-drp-foot">
              <span className="vs-drp-help">
                <Info size={16} aria-hidden="true" />
                <span>{helpText}</span>
              </span>
              <div className="vs-drp-actions">
                <Button emphasis="secondary" onClick={() => setPickerOpen(false)}>
                  Cancel
                </Button>
                <Button emphasis="primary" disabled={!draft.from || !draft.to} onClick={apply}>
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </Popover>
      )}
    </div>
  );
}
