import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SummaryCard } from './SummaryCard';

afterEach(cleanup);

// The markup of every existing SummaryCard combination as it was BEFORE the `metric` variant, the `dark` tone, `icon`, `change`
// and `sparkline` were added (Task 3, 23 Nov 2026). Adding them must not change any of it.
const BEFORE = {
  full_default: "<div class=\"vs-summary-card  \"><div class=\"flex justify-between items-start min-h-[22px]\"><span class=\"vs-summary-badge \">Live</span></div><div class=\"vs-summary-body\"><p class=\"vs-summary-label \">Total</p><div class=\"vs-summary-figure\"><p class=\"vs-summary-figure-value\">1,953</p><span class=\"vs-summary-figure-unit \">items</span></div><div class=\"vs-summary-desc \">High-resolution assets</div></div></div>",
  full_accent: "<div class=\"vs-summary-card vs-summary-card--accent \"><div class=\"flex justify-between items-start min-h-[22px]\"><span class=\"vs-summary-badge vs-summary-badge--accent\">Live</span></div><div class=\"vs-summary-body\"><p class=\"vs-summary-label vs-summary-label--accent\">Total</p><div class=\"vs-summary-figure\"><p class=\"vs-summary-figure-value\">1,953</p><span class=\"vs-summary-figure-unit vs-summary-figure-unit--accent\">items</span></div><div class=\"vs-summary-desc vs-summary-desc--accent\">High-resolution assets</div></div></div>",
  full_warning: "<div class=\"vs-summary-card vs-summary-card--yellow \"><div class=\"flex justify-between items-start min-h-[22px]\"><span class=\"vs-summary-badge vs-summary-badge--yellow\">Live</span></div><div class=\"vs-summary-body\"><p class=\"vs-summary-label vs-summary-label--yellow\">Total</p><div class=\"vs-summary-figure\"><p class=\"vs-summary-figure-value\">1,953</p><span class=\"vs-summary-figure-unit vs-summary-figure-unit--yellow\">items</span></div><div class=\"vs-summary-desc vs-summary-desc--yellow\">High-resolution assets</div></div></div>",
  full_yellow: "<div class=\"vs-summary-card vs-summary-card--yellow \"><div class=\"flex justify-between items-start min-h-[22px]\"><span class=\"vs-summary-badge vs-summary-badge--yellow\">Live</span></div><div class=\"vs-summary-body\"><p class=\"vs-summary-label vs-summary-label--yellow\">Total</p><div class=\"vs-summary-figure\"><p class=\"vs-summary-figure-value\">1,953</p><span class=\"vs-summary-figure-unit vs-summary-figure-unit--yellow\">items</span></div><div class=\"vs-summary-desc vs-summary-desc--yellow\">High-resolution assets</div></div></div>",
  minimal: "<div class=\"vs-summary-card  \"><div class=\"flex justify-between items-start min-h-[22px]\"><span></span></div><div class=\"vs-summary-body\"><p class=\"vs-summary-label \">Views</p><div class=\"vs-summary-figure\"><p class=\"vs-summary-figure-value\">42</p></div></div></div>",
  default_tone_omitted: "<div class=\"vs-summary-card  \"><div class=\"flex justify-between items-start min-h-[22px]\"><span></span></div><div class=\"vs-summary-body\"><p class=\"vs-summary-label \">Views</p><div class=\"vs-summary-figure\"><p class=\"vs-summary-figure-value\">9</p><span class=\"vs-summary-figure-unit \">k</span></div></div></div>",
  no_badge_with_desc: "<div class=\"vs-summary-card  \"><div class=\"flex justify-between items-start min-h-[22px]\"><span></span></div><div class=\"vs-summary-body\"><p class=\"vs-summary-label \">Rate</p><div class=\"vs-summary-figure\"><p class=\"vs-summary-figure-value\">1.5%</p></div><div class=\"vs-summary-desc \"><b>note</b></div></div></div>",
  loading: "<div class=\"vs-summary-card  \"><div class=\"flex justify-between items-start min-h-[22px]\"><span></span></div><div class=\"vs-summary-body\"><p class=\"vs-summary-label \">Users</p><div class=\"vs-summary-figure\"><p class=\"vs-summary-figure-value\">\u2026</p></div></div></div>",
  class: "<div class=\"vs-summary-card  extra\"><div class=\"flex justify-between items-start min-h-[22px]\"><span class=\"vs-summary-badge \"><i>+3</i></span></div><div class=\"vs-summary-body\"><p class=\"vs-summary-label \">Users</p><div class=\"vs-summary-figure\"><p class=\"vs-summary-figure-value\">12</p></div></div></div>",
} as const;

describe('SummaryCard: existing output is unchanged', () => {
  it('every tone with badge, unit and description', () => {
    for (const tone of ['default', 'accent', 'warning', 'yellow'] as const) {
      expect(
        renderToStaticMarkup(<SummaryCard tone={tone} badge="Live" label="Total" value="1,953" unit="items" description="High-resolution assets" />),
        tone
      ).toBe(BEFORE[`full_${tone}` as keyof typeof BEFORE]);
    }
  });

  it('minimal, no tone, no badge, loading, extra class', () => {
    expect(renderToStaticMarkup(<SummaryCard label="Views" value={42} />)).toBe(BEFORE.minimal);
    expect(renderToStaticMarkup(<SummaryCard label="Views" value="9" unit="k" />)).toBe(BEFORE.default_tone_omitted);
    expect(renderToStaticMarkup(<SummaryCard label="Rate" value="1.5%" description={<b>note</b>} />)).toBe(BEFORE.no_badge_with_desc);
    expect(renderToStaticMarkup(<SummaryCard label="Users" value="12" loading />)).toBe(BEFORE.loading);
    expect(renderToStaticMarkup(<SummaryCard label="Users" value="12" className="extra" badge={<i>+3</i>} />)).toBe(BEFORE.class);
  });
});

describe('SummaryCard: metric variant (opt-in)', () => {
  const spark = <svg data-spark="1" />;
  const full = (tone?: 'default' | 'dark') => (
    <SummaryCard variant="metric" tone={tone} icon={<svg data-i="1" />} label="Users" value="11,920" change={{ text: '+18.4%', direction: 'up' }} sparkline={spark} />
  );

  it('header row (icon, label, change), then value and sparkline on one row, in this order', () => {
    const html = renderToStaticMarkup(full());
    expect(html).toContain('class="vs-summary-card vs-summary-card--metric  "');
    const order = ['vs-summary-head', 'vs-summary-icon', 'vs-summary-label', 'vs-summary-change', 'vs-summary-metric-row', 'vs-summary-figure-value', 'vs-summary-spark', 'data-spark'];
    const at = order.map((k) => html.indexOf(k));
    expect(at.every((i) => i >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  it('the icon is decorative and the sparkline slot gets exactly what the caller passes', () => {
    const html = renderToStaticMarkup(full());
    expect(html).toContain('<span class="vs-summary-icon" aria-hidden="true"><svg data-i="1"></svg></span>');
    expect(html).toContain('<div class="vs-summary-spark"><svg data-spark="1"></svg></div>');
  });

  it('the change chip carries its direction in words as well as colour', () => {
    for (const [direction, reading] of [['up', 'Increase'], ['down', 'Decrease'], ['flat', 'No change']] as const) {
      const html = renderToStaticMarkup(<SummaryCard variant="metric" label="L" value="1" change={{ text: '+2%', direction }} />);
      expect(html).toContain(`vs-summary-change--${direction}`);
      expect(html).toContain(`<span class="vs-summary-sr">${reading}: </span>+2%`);
    }
  });

  it('without icon, change or sparkline those parts are simply not there', () => {
    const html = renderToStaticMarkup(<SummaryCard variant="metric" label="Rate" value="1.5%" description="note" />);
    for (const k of ['vs-summary-icon', 'vs-summary-change', 'vs-summary-spark']) expect(html).not.toContain(k);
    expect(html).toContain('vs-summary-desc');
  });

  it('a badge still shows when there is no change; the change replaces the badge', () => {
    expect(renderToStaticMarkup(<SummaryCard variant="metric" label="L" value="1" badge="Live" />)).toContain('<span class="vs-summary-badge ">Live</span>');
    const both = renderToStaticMarkup(<SummaryCard variant="metric" label="L" value="1" badge="Live" change={{ text: '-1%', direction: 'down' }} />);
    expect(both).not.toContain('Live');
  });

  it('unit and loading work like the classic card', () => {
    expect(renderToStaticMarkup(<SummaryCard variant="metric" label="L" value="1,953" unit="items" />)).toContain('<span class="vs-summary-figure-unit ">items</span>');
    expect(renderToStaticMarkup(<SummaryCard variant="metric" label="L" value="1,953" loading />)).toContain('<p class="vs-summary-figure-value">…</p>');
  });

  it('variant="classic" is the same as no variant', () => {
    expect(renderToStaticMarkup(<SummaryCard variant="classic" badge="Live" label="Total" value="1,953" unit="items" description="High-resolution assets" />)).toBe(
      renderToStaticMarkup(<SummaryCard badge="Live" label="Total" value="1,953" unit="items" description="High-resolution assets" />)
    );
  });

  it('icon, change and sparkline are ignored by the classic layout', () => {
    expect(renderToStaticMarkup(<SummaryCard label="Views" value={42} icon={<svg />} change={{ text: '+1%', direction: 'up' }} sparkline={spark} />)).toBe(BEFORE.minimal);
  });

  it('reads out in the page like any other card', () => {
    render(full());
    expect(screen.getByText('Users')).toBeTruthy();
    expect(screen.getByText('11,920')).toBeTruthy();
    expect(screen.getByText(/Increase/)).toBeTruthy();
  });
});

describe('SummaryCard: dark tone (opt-in)', () => {
  it('adds the dark classes in both variants and nothing else changes', () => {
    const classic = renderToStaticMarkup(<SummaryCard tone="dark" badge="Live" label="Total" value="1" unit="u" description="d" />);
    for (const k of ['vs-summary-card--dark', 'vs-summary-badge--dark', 'vs-summary-label--dark', 'vs-summary-figure-unit--dark', 'vs-summary-desc--dark']) expect(classic).toContain(k);
    const metric = renderToStaticMarkup(<SummaryCard variant="metric" tone="dark" label="Total" value="1" unit="u" description="d" />);
    for (const k of ['vs-summary-card--dark', 'vs-summary-label--dark', 'vs-summary-figure-unit--dark', 'vs-summary-desc--dark']) expect(metric).toContain(k);
  });

  it('the other tones never pick up a dark class', () => {
    for (const tone of ['default', 'accent', 'warning', 'yellow'] as const) {
      expect(renderToStaticMarkup(<SummaryCard tone={tone} badge="b" label="L" value="1" unit="u" description="d" />), tone).not.toContain('--dark');
    }
  });
});
