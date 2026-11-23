import React, { useEffect, useRef, useState } from 'react';

export interface AnimatedNumberProps {
  /** The figure. `null` or `undefined` means "no number yet" (loading, no data): `fallback` is shown and nothing moves. */
  value: number | null | undefined;
  /** Count-up time in ms. Default 1000. */
  duration?: number;
  /**
   * How the figure is written. It receives the real value (12.3, not 123). Default: thousands separators, and exactly `decimals` decimals
   * (4,214 and 12.30).
   */
  format?: (value: number) => string;
  className?: string;
  /** Digits after the decimal point, 0 to 6 (default 0). The figure moves in steps of 10^-decimals: whole numbers by default, cents for 2. */
  decimals?: number;
  /** Shown when `value` is `null` or `undefined` (default "—"). */
  fallback?: React.ReactNode;
}

export const ANIMATED_NUMBER_MS = 1000;

/**
 * A number that counts up from the number last shown (0 at first) with an ease-out curve, for KPI cards, a headline figure or
 * any number that should arrive with some life. The LAST frame passes `value` itself, untouched, to `format`, so the figure that
 * stays on screen is written exactly as it would be without the animation (12.35 with toFixed(1) stays "12.3"). Screen readers get
 * the final value at once (a visually hidden copy; the counting text is aria-hidden); reduced motion shows the final value only. No number yet (`null` / `undefined`) shows `fallback`;
 * when a number arrives later it counts on from the last one shown (from 0 if there was none). A value that is not a finite number
 * (NaN, Infinity) is treated as 0.
 */
export function AnimatedNumber({ value, duration = ANIMATED_NUMBER_MS, format, className, decimals = 0, fallback = '—' }: AnimatedNumberProps) {
  const empty = value === null || value === undefined;
  const target = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  const places = Number.isInteger(decimals) && decimals > 0 && decimals <= 6 ? decimals : 0;
  const scale = 10 ** places;
  const write =
    format ??
    ((v: number) => (places === 0 ? Math.round(v).toLocaleString() : v.toLocaleString(undefined, { minimumFractionDigits: places, maximumFractionDigits: places })));
  const reduce = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [shown, setShown] = useState(reduce && !empty ? target : 0);
  // The number last on screen. Kept while the value is empty, so a reload counts on from it.
  const fromRef = useRef(reduce && !empty ? target : 0);

  useEffect(() => {
    if (empty) return;
    if (reduce || duration <= 0 || typeof requestAnimationFrame !== 'function') {
      fromRef.current = target;
      setShown(target);
      return;
    }
    const from = fromRef.current;
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      if (t >= 1) {
        fromRef.current = target;
        setShown(target); // the exact value, never a rounded one
        return;
      }
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (target - from) * eased;
      const stepped = Math.round(current * scale) / scale; // whole numbers when decimals is 0, so a custom `format` (String, ...) never sees 123.456 on the way
      fromRef.current = stepped;
      setShown(stepped);
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [empty, target, duration, reduce, places, scale]);

  if (empty) return <span className={className}>{fallback}</span>;
  // The final text is in a visually hidden element (read once by screen readers); the moving text is aria-hidden. An aria-label on a
  // role-less span is not allowed (axe: aria-prohibited-attr) and many screen readers ignore it.
  return (
    <span className={className}>
      <span className="vs-animated-number__sr">{write(target)}</span>
      <span aria-hidden="true">{write(shown)}</span>
    </span>
  );
}
