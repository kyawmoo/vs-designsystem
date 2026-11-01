import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  MONTH_NAMES,
  addDays,
  addMonthsKeepDay,
  clampIsoDate,
  diffDays,
  formatLongDate,
  isIsoDate,
  monthGrid,
  monthIndexOf,
  parseIsoDate,
  todayIsoDate,
  weekdayLabels,
  weekdayOf,
} from './rangeCalendarDates';
import type { IsoDate, WeekStart } from './rangeCalendarDates';

export interface DateRangeValue {
  /** `'YYYY-MM-DD'`, or null while nothing is picked. */
  from: IsoDate | null;
  /** `null` while the first date is picked and the second is still to come. */
  to: IsoDate | null;
}

export interface RangeCalendarProps {
  value: DateRangeValue;
  /** Called on every pick: `{ from, to: null }` after the first click, then `{ from, to }` (already in order) after the second. */
  onChange: (next: DateRangeValue) => void;
  /** Earliest day that can be picked (inclusive). */
  minDate?: IsoDate;
  /** Latest day that can be picked (inclusive). Default: today. */
  maxDate?: IsoDate;
  /** Longest range in days, both ends counted. Default 365. While the second date is picked, days that would make a longer range are disabled. */
  maxDays?: number;
  /** `0` Sunday (default) or `1` Monday. */
  weekStartsOn?: WeekStart;
  /** How many months are shown side by side (`2` default; use `1` on a phone). */
  months?: 1 | 2;
  /** The day shown with a ring, and the default for `maxDate`. Default: today in the viewer's calendar. */
  today?: IsoDate;
  /** Month to open on. Default: the month of `value.from`, else the latest months that can be picked. */
  defaultMonth?: IsoDate;
  /** Accessible name of the whole calendar. */
  label?: string;
  className?: string;
}

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

/**
 * RangeCalendar: pick a From and a To day. Click one day, then another (picked in reverse order they swap by themselves;
 * the same day twice is a one-day range). Days outside `minDate`..`maxDate` are disabled and skipped by the keyboard,
 * and so are days that would make the range longer than `maxDays`. Presentation only: no Apply / Cancel and no text
 * fields; those belong to whatever opens it (for example `DateRangeSelector`).
 *
 * Keyboard: Tab goes to the days (one tab stop), arrows move by a day / a week, Home / End to the start / end of the
 * week, PageUp / PageDown by a month, Enter or Space picks. Every day button has its full date as its name.
 * Dates are calendar days as `'YYYY-MM-DD'` text, so no time zone can move them.
 */
export function RangeCalendar({
  value,
  onChange,
  minDate,
  maxDate,
  maxDays = 365,
  weekStartsOn = 0,
  months = 2,
  today,
  defaultMonth,
  label = 'Calendar',
  className,
}: RangeCalendarProps) {
  const todayIso = today && isIsoDate(today) ? today : todayIsoDate();
  const max = maxDate && isIsoDate(maxDate) ? maxDate : todayIso;
  const min = minDate && isIsoDate(minDate) ? minDate : undefined;
  const limit = Math.max(1, Math.floor(maxDays));
  const from = value.from && isIsoDate(value.from) ? value.from : null;
  const to = from && value.to && isIsoDate(value.to) ? value.to : null;
  const pending = from !== null && to === null;

  const maxIdx = monthIndexOf(max);
  const minIdx = min ? monthIndexOf(min) : -Infinity;
  const clampFirst = (idx: number) => Math.max(minIdx, Math.min(idx, maxIdx - (months - 1)));

  const [firstIdx, setFirstIdx] = React.useState(() => {
    const seed = defaultMonth && isIsoDate(defaultMonth) ? defaultMonth : from ?? max;
    return clampFirst(from || defaultMonth ? monthIndexOf(seed) : maxIdx - (months - 1));
  });
  const [focusIso, setFocusIso] = React.useState<IsoDate>(() => clampIsoDate(from ?? todayIso, min, max));
  const [hover, setHover] = React.useState<IsoDate | null>(null);
  const keyboardMove = React.useRef(false);
  const dayRefs = React.useRef(new Map<IsoDate, HTMLButtonElement>());

  const enabled = (iso: IsoDate): boolean => {
    if (iso > max) return false;
    if (min && iso < min) return false;
    if (pending && from && Math.abs(diffDays(from, iso)) >= limit) return false;
    return true;
  };

  const visibleMonths = Array.from({ length: months }, (_, i) => {
    const idx = firstIdx + i;
    const year = Math.floor(idx / 12);
    return { idx, year, month: idx - year * 12 };
  });

  const showMonthOf = (iso: IsoDate) => {
    const idx = monthIndexOf(iso);
    if (idx < firstIdx) setFirstIdx(clampFirst(idx));
    else if (idx > firstIdx + months - 1) setFirstIdx(clampFirst(idx - (months - 1)));
  };

  // After a keyboard move, put the real focus on the new day once it is on screen.
  React.useEffect(() => {
    if (!keyboardMove.current) return;
    keyboardMove.current = false;
    dayRefs.current.get(focusIso)?.focus();
  }, [focusIso, firstIdx]);

  const pick = (iso: IsoDate) => {
    if (!enabled(iso)) return;
    setFocusIso(iso);
    if (!pending || !from) {
      onChange({ from: iso, to: null });
    } else if (iso < from) {
      onChange({ from: iso, to: from });
    } else {
      onChange({ from, to: iso });
    }
    setHover(null);
  };

  const move = (target: IsoDate) => {
    const clamped = clampIsoDate(target, min, max);
    if (!enabled(clamped)) return;
    keyboardMove.current = true;
    setFocusIso(clamped);
    showMonthOf(clamped);
  };

  const onDayKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, iso: IsoDate) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const dow = (weekdayOf(iso) - weekStartsOn + 7) % 7;
    let target: IsoDate | null = null;
    switch (e.key) {
      case 'ArrowLeft': target = addDays(iso, -1); break;
      case 'ArrowRight': target = addDays(iso, 1); break;
      case 'ArrowUp': target = addDays(iso, -7); break;
      case 'ArrowDown': target = addDays(iso, 7); break;
      case 'Home': target = addDays(iso, -dow); break;
      case 'End': target = addDays(iso, 6 - dow); break;
      case 'PageUp': target = addMonthsKeepDay(iso, -1); break;
      case 'PageDown': target = addMonthsKeepDay(iso, 1); break;
      default: return;
    }
    e.preventDefault();
    move(target);
  };

  // Which day gets the single tab stop: the remembered one if it can be reached, else the first reachable day on screen.
  const visibleDays = visibleMonths.flatMap((m) => monthGrid(m.year, m.month, weekStartsOn).flat().filter((d): d is IsoDate => d !== null));
  const tabStop = visibleDays.includes(focusIso) && enabled(focusIso) ? focusIso : visibleDays.find(enabled) ?? null;

  // Band to draw: the picked range, or while the second date is pending, from the first date to the day under the pointer / focus.
  const bandEnd = to ?? (pending && hover && enabled(hover) ? hover : null);
  const [bandLo, bandHi] = from && bandEnd ? (from <= bandEnd ? [from, bandEnd] : [bandEnd, from]) : [null, null];
  const isPreview = pending;

  const prevDisabled = firstIdx <= minIdx;
  const nextDisabled = firstIdx + months - 1 >= maxIdx;
  const labels = weekdayLabels(weekStartsOn);

  return (
    <div className={cx('vs-range-calendar', className)} role="group" aria-label={label} onMouseLeave={() => setHover(null)}>
      {visibleMonths.map((m, mi) => {
        const showPrev = mi === 0;
        const showNext = mi === months - 1;
        return (
          <div className="vs-rc-month" key={m.idx}>
            <div className="vs-rc-head">
              {showPrev ? (
                <button type="button" className="vs-rc-nav" aria-label="Previous month" disabled={prevDisabled} onClick={() => setFirstIdx(clampFirst(firstIdx - 1))}>
                  <ChevronLeft size={18} aria-hidden="true" />
                </button>
              ) : (
                <span className="vs-rc-nav-spacer" aria-hidden="true" />
              )}
              <div className="vs-rc-title" aria-live="polite">
                {MONTH_NAMES[m.month]} {m.year}
              </div>
              {showNext ? (
                <button type="button" className="vs-rc-nav" aria-label="Next month" disabled={nextDisabled} onClick={() => setFirstIdx(clampFirst(firstIdx + 1))}>
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              ) : (
                <span className="vs-rc-nav-spacer" aria-hidden="true" />
              )}
            </div>
            <div className="vs-rc-weekdays" aria-hidden="true">
              {labels.map((l) => (
                <div key={l} className="vs-rc-weekday">
                  {l}
                </div>
              ))}
            </div>
            <div className="vs-rc-grid">
              {monthGrid(m.year, m.month, weekStartsOn).flat().map((iso, i) => {
                const col = i % 7;
                if (iso === null) return <div key={`b${i}`} className="vs-rc-cell" aria-hidden="true" />;
                const isFrom = iso === from;
                const isTo = iso === to;
                const inBand = bandLo !== null && bandHi !== null && iso >= bandLo && iso <= bandHi;
                const isStart = inBand && iso === bandLo;
                const isEnd = inBand && iso === bandHi;
                const ok = enabled(iso);
                return (
                  <div
                    key={iso}
                    className={cx(
                      'vs-rc-cell',
                      inBand && !isStart && !isEnd && 'is-in',
                      isStart && 'is-start',
                      isEnd && 'is-end',
                      inBand && isPreview && 'is-preview',
                      col === 0 && 'is-row-start',
                      col === 6 && 'is-row-end'
                    )}
                  >
                    <button
                      type="button"
                      ref={(el) => {
                        if (el) dayRefs.current.set(iso, el);
                        else dayRefs.current.delete(iso);
                      }}
                      className={cx('vs-rc-day', (isFrom || isTo) && 'is-selected', iso === todayIso && 'is-today', pending && iso === hover && ok && 'is-hover')}
                      disabled={!ok}
                      tabIndex={iso === tabStop ? 0 : -1}
                      aria-label={formatLongDate(iso)}
                      aria-pressed={isFrom || isTo}
                      aria-current={iso === todayIso ? 'date' : undefined}
                      onClick={() => pick(iso)}
                      onMouseEnter={() => pending && setHover(iso)}
                      onFocus={() => {
                        setFocusIso(iso);
                        if (pending) setHover(iso);
                      }}
                      onKeyDown={(e) => onDayKeyDown(e, iso)}
                    >
                      {parseIsoDate(iso)?.day}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
