import React, { useEffect, useRef, useState } from 'react';

export interface AnimatedNumberProps {
  value: number;
  /** Count-up time in ms. Default 1000. */
  duration?: number;
  /** Default: toLocaleString (4,214). */
  format?: (value: number) => string;
  className?: string;
}

export const ANIMATED_NUMBER_MS = 1000;

/**
 * A number that counts up from its previous value (0 at first) with an ease-out curve, for KPI
 * cards. Screen readers get the final value at once; reduced motion shows the final value only.
 */
export function AnimatedNumber({ value, duration = ANIMATED_NUMBER_MS, format = (v) => Math.round(v).toLocaleString(), className }: AnimatedNumberProps) {
  const target = Number.isFinite(value) ? value : 0;
  const reduce = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [shown, setShown] = useState(reduce ? target : 0);
  const fromRef = useRef(reduce ? target : 0);

  useEffect(() => {
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
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (target - from) * eased;
      fromRef.current = current;
      setShown(current);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, reduce]);

  return (
    <span className={className} aria-label={format(target)}>
      <span aria-hidden="true">{format(shown)}</span>
    </span>
  );
}
