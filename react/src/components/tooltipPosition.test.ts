import { describe, expect, it } from 'vitest';
import { computeTooltipPosition } from './tooltipPosition';
import type { TooltipPlacement } from './tooltipPosition';

const VIEWPORT = { width: 1000, height: 800 };
const SIZE = { width: 120, height: 30 };
const centre = { top: 400, left: 480, width: 40, height: 40 };

const place = (over: Partial<Parameters<typeof computeTooltipPosition>[0]> = {}) =>
  computeTooltipPosition({ anchor: centre, size: SIZE, placement: 'top', viewport: VIEWPORT, ...over });

describe('computeTooltipPosition — each side, with room', () => {
  it('top: above the trigger, centred, gap 8', () => {
    expect(place({ placement: 'top' })).toMatchObject({ placement: 'top', top: 400 - 30 - 8, left: 500 - 60, arrow: 60 });
  });
  it('bottom: below the trigger', () => {
    expect(place({ placement: 'bottom' })).toMatchObject({ placement: 'bottom', top: 440 + 8, left: 440, arrow: 60 });
  });
  it('left: left of the trigger, vertically centred', () => {
    expect(place({ placement: 'left' })).toMatchObject({ placement: 'left', left: 480 - 120 - 8, top: 420 - 15, arrow: 15 });
  });
  it('right: right of the trigger', () => {
    expect(place({ placement: 'right' })).toMatchObject({ placement: 'right', left: 520 + 8, top: 405, arrow: 15 });
  });
  it('honours a custom gap', () => {
    expect(place({ placement: 'top', gap: 16 }).top).toBe(400 - 30 - 16);
  });
});

describe('computeTooltipPosition — flipping', () => {
  it('top → bottom when the trigger touches the top edge', () => {
    expect(place({ placement: 'top', anchor: { ...centre, top: 10 } }).placement).toBe('bottom');
  });
  it('bottom → top when the trigger touches the bottom edge', () => {
    expect(place({ placement: 'bottom', anchor: { ...centre, top: 760 } }).placement).toBe('top');
  });
  it('left → right when the trigger touches the left edge', () => {
    expect(place({ placement: 'left', anchor: { ...centre, left: 20 } }).placement).toBe('right');
  });
  it('right → left when the trigger touches the right edge', () => {
    expect(place({ placement: 'right', anchor: { ...centre, left: 950 } }).placement).toBe('left');
  });
  it('does not flip when the preferred side just fits', () => {
    // top needs 30 + 8 = 38 above the margin of 8: trigger top at 46 fits exactly
    expect(place({ placement: 'top', anchor: { ...centre, top: 46 } }).placement).toBe('top');
    expect(place({ placement: 'top', anchor: { ...centre, top: 45 } }).placement).toBe('bottom');
  });
  it('left/right that fit on neither side fall back to the vertical axis', () => {
    const narrow = { width: 150, height: 600 };
    const r = computeTooltipPosition({ anchor: { top: 300, left: 55, width: 40, height: 40 }, size: SIZE, placement: 'left', viewport: narrow });
    expect(['top', 'bottom']).toContain(r.placement);
  });
  it('when nothing fits it takes the roomiest side and still returns finite numbers', () => {
    const r = computeTooltipPosition({
      anchor: { top: 20, left: 20, width: 20, height: 20 },
      size: { width: 300, height: 200 },
      placement: 'top',
      viewport: { width: 330, height: 260 },
    });
    expect(Object.values(r).every((v) => typeof v === 'string' || Number.isFinite(v))).toBe(true);
  });
});

describe('computeTooltipPosition — sliding along the edge', () => {
  it('keeps the tooltip inside the left edge; the arrow still points at the trigger', () => {
    const r = place({ placement: 'top', anchor: { top: 400, left: 0, width: 20, height: 20 } });
    expect(r.left).toBe(8);
    expect(r.arrow).toBe(12); // trigger centre 10 − left 8 = 2, clamped to the 12px inset
  });
  it('keeps the tooltip inside the right edge', () => {
    const r = place({ placement: 'top', anchor: { top: 400, left: 980, width: 20, height: 20 } });
    expect(r.left).toBe(1000 - 120 - 8);
    expect(r.arrow).toBe(120 - 12);
  });
  it('arrow tracks the trigger centre when the tooltip is slid but the centre is still inside it', () => {
    const r = place({ placement: 'top', anchor: { top: 400, left: 40, width: 40, height: 40 } });
    expect(r.left).toBe(8);
    expect(r.arrow).toBe(60 - 8 + 0); // centre 60 − left 8 = 52
  });
  it('slides vertically for left/right placements', () => {
    const r = place({ placement: 'right', anchor: { top: 0, left: 400, width: 40, height: 20 } });
    expect(r.top).toBe(8);
  });
});

describe('computeTooltipPosition — properties over many positions', () => {
  // Deterministic pseudo-random sweep (no flakiness): every result stays in the viewport, and when the chosen side
  // truly had room the tooltip does not overlap its trigger.
  let seed = 12345;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const sides: TooltipPlacement[] = ['top', 'bottom', 'left', 'right'];

  it('2000 random cases', () => {
    for (let i = 0; i < 2000; i += 1) {
      const viewport = { width: 320 + Math.floor(rnd() * 1200), height: 400 + Math.floor(rnd() * 800) };
      const size = { width: 40 + Math.floor(rnd() * 200), height: 20 + Math.floor(rnd() * 80) };
      const anchor = {
        width: 16 + Math.floor(rnd() * 80),
        height: 16 + Math.floor(rnd() * 60),
        left: Math.floor(rnd() * viewport.width) - 10,
        top: Math.floor(rnd() * viewport.height) - 10,
      };
      const placement = sides[Math.floor(rnd() * 4)];
      const r = computeTooltipPosition({ anchor, size, placement, viewport });

      expect(Number.isFinite(r.top) && Number.isFinite(r.left) && Number.isFinite(r.arrow)).toBe(true);
      expect(r.left).toBeGreaterThanOrEqual(8);
      expect(r.top).toBeGreaterThanOrEqual(8);
      if (size.width <= viewport.width - 16) expect(r.left + size.width).toBeLessThanOrEqual(viewport.width - 8);
      if (size.height <= viewport.height - 16) expect(r.top + size.height).toBeLessThanOrEqual(viewport.height - 8);

      const anchorFullyInside = anchor.left >= 0 && anchor.top >= 0 && anchor.left + anchor.width <= viewport.width && anchor.top + anchor.height <= viewport.height;
      const hadRoom = (['top', 'bottom', 'left', 'right'] as const).some((s) => {
        const space = { top: anchor.top - 8, bottom: viewport.height - anchor.top - anchor.height - 8, left: anchor.left - 8, right: viewport.width - anchor.left - anchor.width - 8 }[s];
        return space >= (s === 'top' || s === 'bottom' ? size.height : size.width) + 8;
      });
      if (hadRoom && anchorFullyInside) {
        const overlapX = r.left < anchor.left + anchor.width && r.left + size.width > anchor.left;
        const overlapY = r.top < anchor.top + anchor.height && r.top + size.height > anchor.top;
        expect(overlapX && overlapY).toBe(false);
      }
    }
  });
});
