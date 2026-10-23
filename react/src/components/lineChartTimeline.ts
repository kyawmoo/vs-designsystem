/**
 * Builds the x axis of a LineChart so every time chart follows the same rules:
 * one point per calendar day, today marked, exactly one empty day after today, and a day with no
 * value is a gap (null), never drawn as 0. Pure (no DOM), so it is unit-tested on its own.
 */

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// A year of days is far more than any chart shows; this only stops a bad date from looping forever.
const MAX_DAYS = 400;

export interface Timeline {
  /** "YYYY-MM-DD" per slot, consecutive calendar days */
  dates: string[];
  /** x-axis label per slot: "22 Oct", today's reads "22 Oct (Today)" */
  labels: string[];
  /** slot of today, or -1 when today is outside the axis */
  todayIndex: number;
  /** Values of one series laid onto the slots: missing days and future days are null. */
  align: (dates: string[], data: (number | null | undefined)[]) => (number | null)[];
}

/** "YYYY-MM-DD" from local calendar fields (never toISOString, which shifts to UTC). */
export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function shortLabel(key: string): string {
  const d = fromKey(key);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function cleanValue(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/**
 * @param dates the series' dates ("YYYY-MM-DD"); order and duplicates do not matter
 * @param today defaults to now; injectable for tests
 * @param futureDays empty days after today (the design system rule is 1)
 */
export function buildTimeline(dates: string[], today: Date = new Date(), futureDays = 1): Timeline {
  const valid = dates.filter((d) => typeof d === 'string' && DATE_KEY.test(d) && dateKey(fromKey(d)) === d).sort();
  const todayKey = dateKey(today);
  const lastWanted = dateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + futureDays));
  const first = valid.length ? valid[0] : todayKey;
  // The axis runs to one day after today; data dated later than that (clock skew) still shows.
  const last = valid.length && valid[valid.length - 1] > lastWanted ? valid[valid.length - 1] : lastWanted;

  // Too long a range keeps the most recent MAX_DAYS days (today stays on the axis).
  const end = fromKey(last);
  const earliest = dateKey(new Date(end.getFullYear(), end.getMonth(), end.getDate() - (MAX_DAYS - 1)));
  const start = fromKey(first < earliest ? earliest : first);
  const slots: string[] = [];
  for (let i = 0; slots.length < MAX_DAYS; i++) {
    const key = dateKey(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
    if (key > last) break;
    slots.push(key);
  }
  const todayIndex = slots.indexOf(todayKey);
  const index = new Map(slots.map((k, i) => [k, i]));

  return {
    dates: slots,
    labels: slots.map((k, i) => (i === todayIndex ? `${shortLabel(k)} (Today)` : shortLabel(k))),
    todayIndex,
    align(seriesDates, data) {
      const row: (number | null)[] = slots.map(() => null);
      seriesDates.forEach((d, i) => {
        const slot = index.get(d);
        const v = cleanValue(data[i]);
        if (slot === undefined || v === null) return;
        row[slot] = (row[slot] ?? 0) + v; // the same day twice adds up
      });
      return row;
    },
  };
}

/** Which x labels to print: every `step`-th counted back from today, so today's label always shows. */
export function visibleTicks(count: number, todayIndex: number, maxLabels: number): boolean[] {
  const step = Math.max(1, Math.ceil(count / Math.max(1, Math.floor(maxLabels))));
  const anchor = todayIndex >= 0 ? todayIndex : count - 1;
  return Array.from({ length: count }, (_, i) => (((anchor - i) % step) + step) % step === 0);
}
