import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SummaryCardCarousel } from './SummaryCardCarousel';
import { SummaryCard } from './SummaryCard';

afterEach(cleanup);

const cards = (n: number) => Array.from({ length: n }, (_, i) => <SummaryCard key={i} label={`Card ${i + 1}`} value={i + 1} />);
const grid = (c: HTMLElement) => c.querySelector('.md\\:grid') as HTMLElement;
const row = (c: HTMLElement) => c.querySelector('.snap-x') as HTMLElement;
const dots = () => screen.queryAllByRole('button', { name: /^Go to slide/ });

describe('SummaryCardCarousel: layout', () => {
  it('renders every card in the desktop grid and again in the swipe row (CSS shows one of them)', () => {
    const { container } = render(<SummaryCardCarousel>{cards(4)}</SummaryCardCarousel>);
    expect(within(grid(container)).getAllByText(/^Card \d$/)).toHaveLength(4);
    expect(within(row(container)).getAllByText(/^Card \d$/)).toHaveLength(4);
  });

  it('is a grid from 768px (md) with 2 columns and 4 from 1024px, and shows the swipe row only below 768px', () => {
    const { container } = render(<SummaryCardCarousel>{cards(4)}</SummaryCardCarousel>);
    const g = grid(container);
    for (const c of ['hidden', 'md:grid', 'md:grid-cols-2', 'lg:grid-cols-4', 'gap-4']) expect(g.classList.contains(c), c).toBe(true);
    expect(g.className).not.toMatch(/\bsm:/);
    expect(row(container).parentElement!.className).toBe('md:hidden');
  });

  it('gives exactly five cards a fifth column from 1280px; four or six cards do not', () => {
    for (const n of [4, 6]) {
      const { container, unmount } = render(<SummaryCardCarousel>{cards(n)}</SummaryCardCarousel>);
      expect(grid(container).className, `${n} cards`).not.toContain('xl:grid-cols-5');
      unmount();
    }
    const five = render(<SummaryCardCarousel>{cards(5)}</SummaryCardCarousel>);
    expect(grid(five.container).classList.contains('xl:grid-cols-5')).toBe(true);
  });

  it('does not count empty children (null, false) as cards', () => {
    const { container } = render(
      <SummaryCardCarousel>
        {cards(5)}
        {null}
        {false}
      </SummaryCardCarousel>
    );
    expect(grid(container).classList.contains('xl:grid-cols-5')).toBe(true);
    expect(within(row(container)).getAllByText(/^Card \d$/)).toHaveLength(5);
  });

  it('makes each swipe card 88% wide and puts className on the wrapper', () => {
    const { container } = render(<SummaryCardCarousel className="my-kpis">{cards(3)}</SummaryCardCarousel>);
    expect(container.firstElementChild!.classList.contains('my-kpis')).toBe(true);
    expect([...row(container).children].every((el) => el.classList.contains('w-[88%]'))).toBe(true);
  });

  it('renders nothing visible and does not throw without cards', () => {
    const { container } = render(<SummaryCardCarousel>{null}</SummaryCardCarousel>);
    expect(row(container).children).toHaveLength(0);
    expect(dots()).toHaveLength(0);
  });
});

describe('SummaryCardCarousel: dots', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('has one dot button per card, and none for a single card', () => {
    render(<SummaryCardCarousel>{cards(4)}</SummaryCardCarousel>);
    expect(dots().map((d) => d.getAttribute('aria-label'))).toEqual(['Go to slide 1', 'Go to slide 2', 'Go to slide 3', 'Go to slide 4']);
    cleanup();
    render(<SummaryCardCarousel>{cards(1)}</SummaryCardCarousel>);
    expect(dots()).toHaveLength(0);
  });

  it('tapping a dot scrolls that card into view and makes that dot the wide, active one', async () => {
    render(<SummaryCardCarousel>{cards(4)}</SummaryCardCarousel>);
    expect(dots().map((d) => d.style.width)).toEqual(['20px', '8px', '8px', '8px']);
    await userEvent.click(screen.getByRole('button', { name: 'Go to slide 3' }));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(dots().map((d) => d.style.width)).toEqual(['8px', '8px', '20px', '8px']);
  });
});
