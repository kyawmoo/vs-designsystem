import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TableWidget } from './TableWidget';
import type { TableColumn } from './TableWidget';

interface Row {
  name: string;
  n: number;
}
const ROWS: Row[] = [
  { name: 'A', n: 1 },
  { name: 'B', n: 2 },
  { name: 'C', n: 3 },
];
const COLS: TableColumn<Row>[] = [{ label: 'Count', value: (r) => r.n }];

const render = (props: Partial<React.ComponentProps<typeof TableWidget<Row>>> = {}) =>
  renderToStaticMarkup(
    <TableWidget<Row> itemLabel="Name" rows={ROWS} columns={COLS} renderItem={(r) => r.name} {...props} />,
  );

/** The "#" cells of the body, in order. */
const rankCells = (html: string) =>
  [...html.matchAll(/<td class="[^"]*tabular-nums">(\d+)<\/td>/g)].map((m) => m[1]);

describe('TableWidget startRank', () => {
  it('counts from 1 by default', () => {
    expect(rankCells(render())).toEqual(['1', '2', '3']);
  });
  it('continues the count from startRank', () => {
    expect(rankCells(render({ startRank: 21 }))).toEqual(['21', '22', '23']);
  });
  it.each([0, -5, NaN, Infinity, 2.5])('falls back to 1 for %s', (bad) => {
    const html = render({ startRank: bad });
    expect(rankCells(html)).toEqual(['1', '2', '3']);
    expect(html).not.toMatch(/NaN|Infinity/);
  });
  it('falls back to 1 for a value that is not a number', () => {
    expect(rankCells(render({ startRank: '7' as unknown as number }))).toEqual(['1', '2', '3']);
  });
});

describe('TableWidget column align', () => {
  const cols: TableColumn<Row>[] = [
    { label: 'Default', value: (r) => r.n },
    { label: 'Left', value: (r) => r.name, align: 'left' },
    { label: 'Center', value: (r) => r.n, align: 'center' },
    { label: 'Right', value: (r) => r.n, align: 'right' },
    { label: 'Bogus', value: (r) => r.n, align: 'diagonal' as unknown as 'left' },
  ];
  const html = render({ columns: cols });
  const thClass = (label: string) => html.match(new RegExp(`<th class="([^"]*)">${label}</th>`))?.[1] ?? '';

  it('keeps right as the default', () => {
    expect(thClass('Default')).toContain('text-right');
  });
  it('aligns the title as asked', () => {
    expect(thClass('Left')).toContain('text-left');
    expect(thClass('Left')).not.toContain('text-right');
    expect(thClass('Center')).toContain('text-center');
    expect(thClass('Right')).toContain('text-right');
  });
  it('falls back to right for an unknown value', () => {
    expect(thClass('Bogus')).toContain('text-right');
  });
  it('gives the cells the same alignment as the title, column by column', () => {
    const firstRow = html.split('<tbody')[1].split('</tr>')[0];
    const cells = [...firstRow.matchAll(/<td class="([^"]*)"/g)].map((m) => m[1]);
    // cells: #, item, then the five columns
    expect(cells[2]).toContain('text-right');
    expect(cells[3]).toContain('text-left');
    expect(cells[4]).toContain('text-center');
    expect(cells[5]).toContain('text-right');
    expect(cells[6]).toContain('text-right');
  });
  it('leaves the empty-state row without a column alignment class change', () => {
    const empty = render({ rows: [], columns: cols });
    expect(empty).toContain('No data available');
    expect(empty).toContain('colSpan="7"');
  });
});

describe('TableWidget showRank', () => {
  it('shows the # column by default', () => {
    const html = render();
    expect(html).toContain('>#</th>');
    expect(rankCells(html)).toHaveLength(3);
  });
  it('drops the # th and td when false', () => {
    const html = render({ showRank: false });
    expect(html).not.toContain('>#</th>');
    expect(rankCells(html)).toHaveLength(0);
    expect(html.match(/<th /g)).toHaveLength(2);
  });
  it('spans only the remaining columns in the empty row when false', () => {
    expect(render({ showRank: false, rows: [] })).toContain('colSpan="2"');
    expect(render({ rows: [] })).toContain('colSpan="3"');
  });
  it('shows the empty message for null rows too', () => {
    expect(render({ rows: null, showRank: false })).toContain('No data available');
  });
});

describe('TableWidget scrollLabel', () => {
  it('leaves the scroll area as it was by default', () => {
    const html = render();
    expect(html).not.toContain('tabindex');
    expect(html).not.toContain('role="region"');
  });
  it('makes the scroll area a focusable named region', () => {
    const html = render({ scrollLabel: 'Numbers table, scrolls sideways' });
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Numbers table, scrolls sideways"');
    expect(html).toContain('vs-table-scroll');
  });
  it('treats an empty label as not set', () => {
    expect(render({ scrollLabel: '' })).not.toContain('role="region"');
  });
});

describe('TableWidget rowMuted', () => {
  it('mutes nothing by default', () => {
    expect(render()).not.toContain('vs-table-row--muted');
  });
  it('mutes only the rows the callback picks', () => {
    const html = render({ rowMuted: (r) => r.name === 'B' });
    expect(html.match(/vs-table-row--muted/g)).toHaveLength(1);
    const mutedRow = html.split('<tr').find((t) => t.includes('vs-table-row--muted')) ?? '';
    expect(mutedRow).toContain('>B<');
  });
  it('passes the row index to the callback', () => {
    const seen: number[] = [];
    render({ rowMuted: (_r, i) => (seen.push(i), false) });
    expect(seen).toEqual([0, 1, 2]);
  });
});

describe('TableWidget colours', () => {
  it('uses design system tokens only: no Tailwind palette classes, so a token change reaches every table', () => {
    const html = render({ title: 'T', subtitle: 'S', rowMuted: (r) => r.name === 'B' }) + render({ rows: [] }) + render({ bare: true });
    expect(html).not.toMatch(/(?:text|bg|border|divide)-(?:gray|slate|zinc|neutral)-\d|bg-white|text-white/);
    expect(html).toContain('var(--vs-color-border)');
    expect(html).toContain('var(--vs-color-text-heading)');
  });
});
