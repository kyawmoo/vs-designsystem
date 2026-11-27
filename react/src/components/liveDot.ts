import type { Chart, Plugin } from 'chart.js';

/**
 * Live dot (added 27 Nov 2026, Master KMO): an HTML dot over the canvas on the newest reading of a line, with a soft
 * ripple that grows and fades on repeat (CSS `.vs-live-dot`, no ripple under reduced motion). HTML, not canvas, so the
 * ripple runs without redrawing the chart.
 */

/** One dot: which point of which dataset, in which colour, and how it looks. */
export interface LiveDotTarget {
  datasetIndex: number;
  /** Index of the point in the dataset's data. */
  index: number;
  /** Resolved colour ("#rrggbb" / "rgba(...)"). */
  color: string;
  /** `sm` for sparklines; `ring` = ripple only, for a point the chart already draws as a large dot. */
  size: 'md' | 'sm' | 'ring';
}

/** Newest index with a value at or before `last` (today); -1 when there is none. */
export function newestIndex(row: (number | null)[], last: number): number {
  for (let d = Math.min(last, row.length - 1); d >= 0; d--) if (row[d] !== null && row[d] !== undefined) return d;
  return -1;
}

/** Class names of a dot of this size. */
export function liveDotClass(size: LiveDotTarget['size']): string {
  return size === 'md' ? 'vs-live-dot' : `vs-live-dot vs-live-dot--${size}`;
}

/**
 * Places each dot on its point after every draw (resize and hover included), using the point's final position, so a
 * dot never follows the line's draw-in animation. A point that is missing or outside the plot hides its dot.
 * `delayMs`: the dot fades in once the line has drawn up to it.
 */
export function liveDotPlugin(getEls: () => (HTMLElement | null)[], targets: LiveDotTarget[], delayMs: number): Plugin<any> {
  return {
    id: 'vsLiveDot',
    afterDraw(chart: Chart) {
      const els = getEls();
      const area = chart.chartArea;
      targets.forEach((t, k) => {
        const el = els[k];
        if (!el) return;
        const point: any = chart.getDatasetMeta(t.datasetIndex)?.data[t.index];
        const pos = point && typeof point.getProps === 'function' ? point.getProps(['x', 'y'], true) : null;
        const ok =
          !!pos && !!area && Number.isFinite(pos.x) && Number.isFinite(pos.y) && pos.x >= area.left - 0.5 && pos.x <= area.right + 0.5;
        if (!ok) {
          el.hidden = true;
          return;
        }
        el.style.left = `${pos.x}px`;
        el.style.top = `${pos.y}px`;
        el.style.setProperty('--vs-live-dot-color', t.color);
        el.style.setProperty('--vs-live-dot-delay', `${Math.max(0, Math.round(delayMs))}ms`);
        el.hidden = false;
      });
    },
  };
}
