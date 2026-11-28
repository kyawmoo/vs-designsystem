import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RankPill, isValidRank } from './RankPill';

afterEach(cleanup);

const html = (el: React.ReactElement) => renderToStaticMarkup(el);

describe('RankPill', () => {
  it('rank 1 is lime by default, every other rank is dark', () => {
    expect(html(<RankPill rank={1} />)).toContain('class="vs-rank vs-rank--lime"');
    for (const r of [2, 3, 10, 99]) expect(html(<RankPill rank={r} />), String(r)).toContain('class="vs-rank vs-rank--dark"');
  });

  it('shows "#2", or "#1 · Top asset" with a label', () => {
    expect(html(<RankPill rank={2} />)).toContain('<span aria-hidden="true">#2</span>');
    expect(html(<RankPill rank={1} label="Top asset" />)).toContain('<span aria-hidden="true">#1 · Top asset</span>');
  });

  it('a screen reader hears "Rank 2" or "Rank 1, Top asset", not the symbols', () => {
    render(<RankPill rank={1} label="Top asset" />);
    expect(screen.getByText('Rank 1, Top asset')).toBeTruthy();
    cleanup();
    render(<RankPill rank={4} />);
    expect(screen.getByText('Rank 4')).toBeTruthy();
    expect(document.querySelector('[aria-hidden="true"]')?.textContent).toBe('#4');
  });

  it('a tone overrides the automatic one', () => {
    expect(html(<RankPill rank={1} tone="dark" />)).toContain('vs-rank--dark');
    expect(html(<RankPill rank={5} tone="lime" />)).toContain('vs-rank--lime');
    expect(html(<RankPill rank={5} tone="light" />)).toContain('vs-rank--light');
    expect(html(<RankPill rank={1} tone="auto" />)).toContain('vs-rank--lime');
  });

  it('the circle shows the number alone; the label is still spoken', () => {
    const out = html(<RankPill rank={3} label="Top asset" shape="circle" />);
    expect(out).toContain('class="vs-rank vs-rank--dark vs-rank--circle"');
    expect(out).toContain('<span aria-hidden="true">3</span>');
    expect(out).toContain('Rank 3, Top asset');
    expect(out).not.toContain('#3');
  });

  it('draws nothing for a rank that is not 1, 2, 3 ...', () => {
    for (const r of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 0.9]) {
      expect(html(<RankPill rank={r} label="x" />), String(r)).toBe('');
      expect(isValidRank(r), String(r)).toBe(false);
    }
    expect(html(<RankPill rank={undefined as unknown as number} />)).toBe('');
    expect(isValidRank(1)).toBe(true);
    expect(isValidRank(250)).toBe(true);
  });

  it('passes a class name through and uses tokens only', () => {
    const out = html(<RankPill rank={2} className="mine" />);
    expect(out).toContain('class="vs-rank vs-rank--dark mine"');
    expect(out).not.toMatch(/#[0-9a-fA-F]{3,8}"|rgba?\(|style=/);
  });
});
