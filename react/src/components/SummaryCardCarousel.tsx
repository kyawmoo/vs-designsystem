import React from 'react';
import { SwipeCarousel } from './SwipeCarousel';

export interface SummaryCardCarouselProps {
  /** The cards, normally `SummaryCard`s. Empty children (`null`, `false`) are ignored. */
  children: React.ReactNode;
  /** Extra classes on the wrapper. */
  className?: string;
}

/**
 * A row of KPI cards (`SummaryCard`).
 *
 * - From 768px: a grid with 2 columns, 4 from 1024px, and 5 from 1280px when there are exactly five cards (so a fifth card is
 *   not left alone on a second row). The gap is 1rem.
 * - Under 768px: one swipeable row, each card 88% wide so the next one peeks in, snapping to the card, with a dot per card
 *   (the dots are buttons that scroll to their card).
 *
 * Built on `SwipeCarousel`, switching at 768px (the breakpoint of `FilterSheet` and `DateRangeSelector`). Both layouts are
 * rendered and CSS shows one of them. The swipe row hides its scrollbar with the site's `no-scrollbar` utility, as
 * `SwipeCarousel` does.
 */
export function SummaryCardCarousel({ children, className }: SummaryCardCarouselProps) {
  const count = React.Children.toArray(children).filter(Boolean).length;
  return (
    <SwipeCarousel
      className={className}
      itemClassName="w-[88%]"
      mobileClassName="md:hidden"
      desktopGridClassName={`hidden md:grid md:grid-cols-2 lg:grid-cols-4 ${count === 5 ? 'xl:grid-cols-5' : ''} gap-4`}
    >
      {children}
    </SwipeCarousel>
  );
}
