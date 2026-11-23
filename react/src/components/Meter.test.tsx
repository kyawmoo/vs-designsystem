import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Meter, meterMax, meterPercent } from './Meter';

afterEach(cleanup);

const fillWidth = (html: string) => /class="vs-meter__fill" style="width:([\d.]+)%"/.exec(html)?.[1] ?? null;
const meter = (props: Partial<React.ComponentProps<typeof Meter>> & { value: React.ComponentProps<typeof Meter>['value'] }) => (
  <Meter label="Memory" {...props} />
);

describe('Meter: fill', () => {
  it('value 39 of 100 fills 39% of the track', () => {
    expect(fillWidth(renderToStaticMarkup(meter({ value: 39 })))).toBe('39');
  });

  it('0, 25, 50, 75, 100 fill exactly their percentage', () => {
    for (const v of [0, 25, 50, 75, 100]) expect(fillWidth(renderToStaticMarkup(meter({ value: v, max: 100 }))), String(v)).toBe(String(v));
  });

  it('zero is a real reading: an empty-looking fill that still exists and says 0%', () => {
    const html = renderToStaticMarkup(meter({ value: 0 }));
    expect(fillWidth(html)).toBe('0');
    expect(html).toContain('aria-valuenow="0"');
    expect(html).toContain('aria-valuetext="0%"');
  });

  it('a configurable maximum: 8 of 16 is half', () => {
    expect(fillWidth(renderToStaticMarkup(meter({ value: 8, max: 16 })))).toBe('50');
  });

  it('a negative value is clamped to an empty fill, the real reading stays in the text', () => {
    const html = renderToStaticMarkup(meter({ value: -5 }));
    expect(fillWidth(html)).toBe('0');
    expect(html).toContain('aria-valuenow="0"');
    expect(html).toContain('aria-valuetext="-5%"');
  });

  it('a value above max is capped at 100%, aria-valuenow stays inside the range, the real reading stays in the text', () => {
    const html = renderToStaticMarkup(meter({ value: 120 }));
    expect(fillWidth(html)).toBe('100');
    expect(html).toContain('aria-valuenow="100"');
    expect(html).toContain('aria-valuemax="100"');
    expect(html).toContain('aria-valuetext="120%"');
    const big = renderToStaticMarkup(meter({ value: 3.5, max: 2 }));
    expect(big).toContain('aria-valuenow="2"');
    expect(big).toContain('aria-valuetext="3.5 of 2"');
  });
});

describe('Meter: no reading and invalid input', () => {
  it('null, undefined, NaN and Infinity draw an empty track with no fill and say "No reading"', () => {
    for (const v of [null, undefined, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const html = renderToStaticMarkup(meter({ value: v }));
      expect(html, String(v)).not.toContain('vs-meter__fill');
      expect(html, String(v)).not.toContain('aria-valuenow');
      expect(html, String(v)).toContain('aria-valuetext="No reading"');
    }
  });

  it('an invalid max (0, negative, NaN, Infinity) falls back to 100', () => {
    for (const m of [0, -4, Number.NaN, Number.POSITIVE_INFINITY, undefined]) {
      expect(fillWidth(renderToStaticMarkup(meter({ value: 40, max: m }))), String(m)).toBe('40');
      expect(meterMax(m as number | undefined)).toBe(100);
    }
  });

  it('meterPercent keeps every result between 0 and 100 or null', () => {
    expect(meterPercent(50, 100)).toBe(50);
    expect(meterPercent(-1, 100)).toBe(0);
    expect(meterPercent(1e9, 100)).toBe(100);
    expect(meterPercent(null, 100)).toBeNull();
    expect(meterPercent(Number.NaN, 100)).toBeNull();
  });
});

describe('Meter: accessibility', () => {
  it('is a meter with a name, min, max, now and text', () => {
    render(meter({ value: 61, valueText: '61.0% — Normal' }));
    const m = screen.getByRole('meter', { name: 'Memory' });
    expect(m.getAttribute('aria-valuemin')).toBe('0');
    expect(m.getAttribute('aria-valuemax')).toBe('100');
    expect(m.getAttribute('aria-valuenow')).toBe('61');
    expect(m.getAttribute('aria-valuetext')).toBe('61.0% — Normal');
  });

  it('with no reading it is still a named meter that says so', () => {
    render(meter({ value: null }));
    const m = screen.getByRole('meter', { name: 'Memory' });
    expect(m.getAttribute('aria-valuetext')).toBe('No reading');
    expect(m.hasAttribute('aria-valuenow')).toBe(false);
  });

  it('the default text is "39%" or "8 of 16", with thousands separators', () => {
    expect(renderToStaticMarkup(meter({ value: 39 }))).toContain('aria-valuetext="39%"');
    expect(renderToStaticMarkup(meter({ value: 8, max: 16 }))).toContain('aria-valuetext="8 of 16"');
    expect(renderToStaticMarkup(meter({ value: 1200, max: 5000 }))).toContain('aria-valuetext="1,200 of 5,000"');
  });
});

describe('Meter: tones and thresholds', () => {
  it('every tone sets its class; default has none and uses the default fill token', () => {
    expect(renderToStaticMarkup(meter({ value: 1 }))).toContain('class="vs-meter"');
    for (const tone of ['success', 'warning', 'danger', 'neutral'] as const) {
      expect(renderToStaticMarkup(meter({ value: 1, tone })), tone).toContain(`class="vs-meter vs-meter--${tone}"`);
    }
  });

  it('draws a tick at each threshold position in its tone, on the same scale as the value', () => {
    const html = renderToStaticMarkup(meter({ value: 50, thresholds: [{ value: 70, tone: 'warning' }, { value: 90, tone: 'danger' }] }));
    expect(html).toContain('vs-meter__tick vs-meter__tick--warning" style="left:min(70%, calc(100% - 2px))"');
    expect(html).toContain('vs-meter__tick vs-meter__tick--danger" style="left:min(90%, calc(100% - 2px))"');
    const scaled = renderToStaticMarkup(meter({ value: 1, max: 4, thresholds: [{ value: 2, tone: 'warning' }, { value: 4, tone: 'danger' }] }));
    expect(scaled).toContain('left:min(50%, calc(100% - 2px))');
    expect(scaled).toContain('left:min(100%, calc(100% - 2px))');
  });

  it('a threshold outside the scale is kept on the track; an invalid one is not drawn; ticks are decorative', () => {
    const html = renderToStaticMarkup(
      meter({ value: 1, thresholds: [{ value: 250, tone: 'danger' }, { value: -3, tone: 'warning' }, { value: Number.NaN, tone: 'neutral' }] })
    );
    expect(html).toContain('left:min(100%, calc(100% - 2px))');
    expect(html).toContain('left:min(0%, calc(100% - 2px))');
    expect((html.match(/vs-meter__tick /g) ?? []).length).toBe(2);
    expect((html.match(/aria-hidden="true"/g) ?? []).length).toBe(2);
  });

  it('ticks are drawn with no reading too (the limits are still true)', () => {
    expect(renderToStaticMarkup(meter({ value: null, thresholds: [{ value: 80, tone: 'danger' }] }))).toContain('vs-meter__tick--danger');
  });

  it('uses tokens only: no colour literal in the markup', () => {
    const html = renderToStaticMarkup(meter({ value: 40, tone: 'warning', thresholds: [{ value: 70, tone: 'danger' }] }));
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}|rgba?\(/);
  });

  it('passes a class name through', () => {
    expect(renderToStaticMarkup(meter({ value: 1, className: 'mine' }))).toContain('class="vs-meter mine"');
  });
});
