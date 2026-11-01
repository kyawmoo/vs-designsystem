/**
 * Calendar-day maths for RangeCalendar. A day is the text `'YYYY-MM-DD'` (a calendar date, no time and no time zone), so
 * "14 Oct" is the same day for every viewer and nothing shifts at midnight UTC. Text in this form sorts like the dates it names.
 */

export type IsoDate = string;
export type WeekStart = 0 | 1;

export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS_SUNDAY_FIRST = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const pad2 = (n: number) => String(n).padStart(2, '0');

/** Days in a month (`month` 0-11). */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** Parses `'2026-10-14'`; returns null for anything that is not a real calendar day (`'2026-02-30'`, `'14 Oct'`, ``). */
export function parseIsoDate(text: string | null | undefined): { year: number; month: number; day: number } | null {
  if (typeof text !== 'string') return null;
  const m = ISO_RE.exec(text);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  if (month < 0 || month > 11 || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

export function isIsoDate(text: string | null | undefined): text is IsoDate {
  return parseIsoDate(text) !== null;
}

export function toIsoDate(year: number, month: number, day: number): IsoDate {
  return `${String(year).padStart(4, '0')}-${pad2(month + 1)}-${pad2(day)}`;
}

/** Today in the viewer's local calendar. */
export function todayIsoDate(now: Date = new Date()): IsoDate {
  return toIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
}

export function addDays(iso: IsoDate, n: number): IsoDate {
  const p = parseIsoDate(iso);
  if (!p) return iso;
  const d = new Date(Date.UTC(p.year, p.month, p.day + n));
  return toIsoDate(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Same day of the month `n` months later; a 31st lands on the last day of a shorter month. */
export function addMonthsKeepDay(iso: IsoDate, n: number): IsoDate {
  const p = parseIsoDate(iso);
  if (!p) return iso;
  const index = p.year * 12 + p.month + n;
  const year = Math.floor(index / 12);
  const month = index - year * 12;
  return toIsoDate(year, month, Math.min(p.day, daysInMonth(year, month)));
}

/** 0 = Sunday ... 6 = Saturday. */
export function weekdayOf(iso: IsoDate): number {
  const p = parseIsoDate(iso);
  return p ? new Date(Date.UTC(p.year, p.month, p.day)).getUTCDay() : 0;
}

/** Whole days from `a` to `b` (negative when `b` is earlier). */
export function diffDays(a: IsoDate, b: IsoDate): number {
  const pa = parseIsoDate(a);
  const pb = parseIsoDate(b);
  if (!pa || !pb) return 0;
  return Math.round((Date.UTC(pb.year, pb.month, pb.day) - Date.UTC(pa.year, pa.month, pa.day)) / 86_400_000);
}

/** Number of days in a range, both ends counted (14 Oct to 20 Oct = 7). */
export function daysInclusive(from: IsoDate, to: IsoDate): number {
  return Math.abs(diffDays(from, to)) + 1;
}

export function clampIsoDate(iso: IsoDate, min?: IsoDate, max?: IsoDate): IsoDate {
  let out = iso;
  if (min && out < min) out = min;
  if (max && out > max) out = max;
  return out;
}

/** `year * 12 + month`: months in a row, so two months compare and step with plain numbers. */
export function monthIndexOf(iso: IsoDate): number {
  const p = parseIsoDate(iso);
  return p ? p.year * 12 + p.month : 0;
}

export function weekdayLabels(weekStartsOn: WeekStart): string[] {
  return weekStartsOn === 1 ? [...WEEKDAYS_SUNDAY_FIRST.slice(1), WEEKDAYS_SUNDAY_FIRST[0]] : [...WEEKDAYS_SUNDAY_FIRST];
}

/** The weeks of one month, each 7 cells: the day as `IsoDate`, or null for a cell outside the month. */
export function monthGrid(year: number, month: number, weekStartsOn: WeekStart): Array<Array<IsoDate | null>> {
  const lead = (new Date(Date.UTC(year, month, 1)).getUTCDay() - weekStartsOn + 7) % 7;
  const total = daysInMonth(year, month);
  const weeks: Array<Array<IsoDate | null>> = [];
  let day = 1 - lead;
  while (day <= total) {
    const week: Array<IsoDate | null> = [];
    for (let i = 0; i < 7; i++, day++) week.push(day >= 1 && day <= total ? toIsoDate(year, month, day) : null);
    weeks.push(week);
  }
  return weeks;
}

/** `14 Oct 2026` (DD MMM YYYY). */
export function formatDMY(iso: IsoDate): string {
  const p = parseIsoDate(iso);
  return p ? `${pad2(p.day)} ${MONTH_ABBR[p.month]} ${p.year}` : '';
}

/** `14 October 2026`: what a screen reader says for a day button. */
export function formatLongDate(iso: IsoDate): string {
  const p = parseIsoDate(iso);
  return p ? `${p.day} ${MONTH_NAMES[p.month]} ${p.year}` : '';
}

/**
 * Short label for a chosen range: `28 Oct` (one day), `14–20 Oct`, `28 Sep – 04 Oct`, `28 Dec 2025 – 03 Jan 2026`.
 * The two dates may be given in either order.
 */
export function formatRangeLabel(a: IsoDate, b: IsoDate): string {
  const [from, to] = a <= b ? [a, b] : [b, a];
  const pf = parseIsoDate(from);
  const pt = parseIsoDate(to);
  if (!pf || !pt) return '';
  if (from === to) return `${pad2(pf.day)} ${MONTH_ABBR[pf.month]}`;
  if (pf.year !== pt.year) return `${formatDMY(from)} – ${formatDMY(to)}`;
  if (pf.month === pt.month) return `${pad2(pf.day)}–${pad2(pt.day)} ${MONTH_ABBR[pt.month]}`;
  return `${pad2(pf.day)} ${MONTH_ABBR[pf.month]} – ${pad2(pt.day)} ${MONTH_ABBR[pt.month]}`;
}
