/** Helpers shared by LineChart and BarChart (colours, motion). */

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Resolves `var(--x)` against the element, then lets the canvas normalise the colour ("#rrggbb" or "rgba(...)"). */
export function resolveColor(el: HTMLElement, ctx: CanvasRenderingContext2D, color: string, fallback: string): string {
  let value = color.trim();
  const m = /^var\((--[a-z0-9-]+)\)$/i.exec(value);
  if (m) value = getComputedStyle(el).getPropertyValue(m[1]).trim();
  if (!value) value = fallback;
  ctx.fillStyle = fallback;
  ctx.fillStyle = value; // an invalid colour leaves the fallback
  return String(ctx.fillStyle);
}

/** "#rrggbb" or "rgb(a)(...)" with a new alpha. */
export function withAlpha(color: string, alpha: number): string {
  const hex = /^#([0-9a-f]{6})$/i.exec(color);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }
  const rgb = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i.exec(color);
  return rgb ? `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${alpha})` : color;
}

/** Each point starts after the one before it, so the line draws from left to right. */
export function progressiveAnimation(total: number, count: number) {
  const step = total / Math.max(1, count);
  const previousY = (ctx: any) =>
    ctx.index === 0
      ? ctx.chart.scales.y.getPixelForValue(0)
      : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y;
  const delay = (key: 'xStarted' | 'yStarted') => (ctx: any) => {
    if (ctx.type !== 'data' || ctx[key]) return 0;
    ctx[key] = true;
    return ctx.index * step;
  };
  return {
    x: { type: 'number' as const, easing: 'linear' as const, duration: step, from: NaN, delay: delay('xStarted') },
    y: { type: 'number' as const, easing: 'linear' as const, duration: step, from: previousY, delay: delay('yStarted') },
  };
}

