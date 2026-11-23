import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup } from '@testing-library/react';
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
