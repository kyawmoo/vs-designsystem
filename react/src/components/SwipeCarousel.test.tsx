import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { SwipeCarousel } from './SwipeCarousel';

afterEach(cleanup);

const slides = [<div key="a">A</div>, <div key="b">B</div>];
/** The wrapper of the swipe row + dots (the sibling after the desktop grid). */
const mobilePart = (c: HTMLElement) => c.querySelector('.snap-x')!.parentElement as HTMLElement;

describe('SwipeCarousel: breakpoint of the swipe row', () => {
  it('keeps hiding the swipe row from 640px (sm) when mobileClassName is not given', () => {
    const { container } = render(<SwipeCarousel>{slides}</SwipeCarousel>);
    expect(mobilePart(container).className).toBe('sm:hidden');
  });

  it('uses mobileClassName instead, so a grid that starts at md can be matched', () => {
    const { container } = render(
      <SwipeCarousel desktopGridClassName="hidden md:grid md:grid-cols-2" mobileClassName="md:hidden">
        {slides}
      </SwipeCarousel>
    );
    expect(mobilePart(container).className).toBe('md:hidden');
  });

  it('without a desktop grid the swipe row is always shown, whatever mobileClassName says', () => {
    const { container } = render(
      <SwipeCarousel desktopGridClassName="" mobileClassName="md:hidden">
        {slides}
      </SwipeCarousel>
    );
    expect(mobilePart(container).className).toBe('block');
  });
});
