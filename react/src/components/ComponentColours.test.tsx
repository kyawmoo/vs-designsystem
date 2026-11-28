import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FilterSheet } from './FilterSheet';
import { MobilePageHeader } from './MobilePageHeader';
import { FilterBar } from './FilterBar';
import { WidgetLoader } from './WidgetLoader';

/** Tailwind palette colour classes: a design-system token change would not reach them (issue #154). */
const PALETTE = /\b(?:[a-z]+:)?(?:text|bg|border|divide|ring|fill|stroke|placeholder)-(?:gray|slate|zinc|neutral|stone|red|orange|amber|yellow|green|emerald|teal|blue|indigo|violet|purple|pink|rose|white|black)(?:-\d{2,3})?(?:\/\d+)?\b/;

const noop = () => {};
const group = (selectedId: string) => ({ title: 'Range', options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], selectedId, onSelect: noop });

describe('design system colours: tokens only, no Tailwind palette classes (issue #154)', () => {
  it('FilterSheet (open and closed, two groups, one option active)', () => {
    const html =
      renderToStaticMarkup(<FilterSheet open onClose={noop} title="Filter" groups={[group('a'), { ...group('b'), title: undefined }]} />) +
      renderToStaticMarkup(<FilterSheet open={false} onClose={noop} title="Filter" groups={[group('a')]} />);
    expect(html).not.toMatch(PALETTE);
    expect(html).toContain('var(--vs-color-surface)');
    expect(html).toContain('var(--vs-color-text-heading)');
  });
  it('MobilePageHeader (back, filter on and off, both icons, trailing)', () => {
    const html = [
      <MobilePageHeader key="1" title="T" showBack onFilterClick={noop} />,
      <MobilePageHeader key="2" title="T" onFilterClick={noop} filterActive filterIcon="calendar" />,
      <MobilePageHeader key="3" title="T" showBack trailing={<span>x</span>} onFilterClick={noop} />,
    ]
      .map((el) => renderToStaticMarkup(el))
      .join('');
    expect(html).not.toMatch(PALETTE);
    expect(html).toContain('vs-page-head__title'); // its colours are tokens in styles.css (.vs-page-head*)
  });
  it('FilterBar (with tabs)', () => {
    const html = renderToStaticMarkup(
      <FilterBar searchValue="q" onSearchChange={noop} tabs={[{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }]} activeTabId="a" onTabChange={noop} sortLabel="Sort" />,
    );
    expect(html).not.toMatch(PALETTE);
  });
  it('WidgetLoader', () => {
    const html = renderToStaticMarkup(<WidgetLoader />);
    expect(html).not.toMatch(PALETTE);
    expect(html).toContain('var(--vs-color-text-muted)');
  });
});
