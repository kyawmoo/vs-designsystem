import React from 'react';
import { Calendar, ChevronDown, LoaderCircle } from 'lucide-react';
import { FilterSheet } from './FilterSheet';

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
}

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

/** "7D, 7 Days": the accessible name starts with the visible text (WCAG 2.5.3) and still says the full word. */
const accessibleName = (option: DateRangeOption) =>
  option.label === option.fullLabel ? option.label : `${option.label}, ${option.fullLabel}`;

/**
 * Day-range selector for report pages: a compact segmented control on desktop; on phones one button (calendar icon +
 * current range) that opens a bottom sheet with the full list. Built on the segmented control look
 * (`.vs-segment-*`) and `FilterSheet`. Presets only: a custom date range (calendar) is a separate component.
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
}: DateRangeSelectorProps) {
  const [sheetOpen, setSheetOpen] = React.useState(false);

  if (options.length === 0) return null;

  const active = options.find((option) => option.id === value);

  const select = (id: string) => {
    if (id !== value) onChange(id);
  };

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
      </div>

      <button
        type="button"
        className="vs-date-range__trigger"
        aria-haspopup="dialog"
        aria-expanded={sheetOpen}
        aria-label={`${label}: ${active ? active.fullLabel : 'none selected'}`}
        aria-busy={loading ? true : undefined}
        onClick={() => setSheetOpen(true)}
      >
        <Calendar size={16} aria-hidden="true" />
        <span>{active ? active.label : label}</span>
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
            options: options.map((option) => ({ id: option.id, label: option.fullLabel })),
            selectedId: value,
            onSelect: select,
          },
        ]}
      />
    </div>
  );
}
