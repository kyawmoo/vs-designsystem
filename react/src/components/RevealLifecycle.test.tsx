import React, { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { Reveal, RevealItem, RevealText } from './Reveal';

// The opening ends after a time read from the tokens (curtain + body delay + the longest entrance or title + room). jsdom has no
// CSS, so the fallback values are used (1050 + 150 + max(700, 420 + 30 x 35) + 200 = 2870ms).
const OPENING_MS = 2870;

beforeEach(() => {
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as any;
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

// A view that can be shown again later, like a tab or a route (it unmounts and mounts its content again).
function Views() {
  const [shown, setShown] = useState(true);
  return (
    <>
      <button onClick={() => setShown((v) => !v)}>toggle</button>
      {shown && (
        <section id="view">
          <RevealText as="h1" text="Overview" />
          <RevealItem id="card" variant="rise" />
        </section>
      )}
    </>
  );
}

const toggle = (c: HTMLElement) => act(() => { (c.querySelector('button') as HTMLButtonElement).click(); });

describe('Reveal owns the lifecycle: nothing replays after the opening, and the app needs no guard', () => {
  it('a view shown again AFTER the opening has plain text and no attribute (no replay)', () => {
    const { container } = render(
      <Reveal play>
        <Views />
      </Reveal>,
    );
    expect(container.querySelector('h1')!.hasAttribute('data-vs-reveal-text')).toBe(true); // mounted during the opening: written
    expect(container.querySelector('#card')!.getAttribute('data-vs-reveal')).toBe('rise');
    act(() => { vi.advanceTimersByTime(OPENING_MS + 50); });
    toggle(container); // hide the view
    toggle(container); // show it again
    const h1 = container.querySelector('h1')!;
    expect(h1.hasAttribute('data-vs-reveal-text')).toBe(false);
    expect(h1.innerHTML).toBe('Overview');
    expect(container.querySelector('#card')!.hasAttribute('data-vs-reveal')).toBe(false);
    expect(container.querySelectorAll('.vs-reveal-text__letter')).toHaveLength(0);
  });

  it('a view that remounts DURING the opening still plays (the window is the opening, not a count)', () => {
    const { container } = render(
      <Reveal play>
        <Views />
      </Reveal>,
    );
    act(() => { vi.advanceTimersByTime(500); });
    toggle(container);
    toggle(container);
    expect(container.querySelector('h1')!.hasAttribute('data-vs-reveal-text')).toBe(true);
    expect(container.querySelector('#card')!.getAttribute('data-vs-reveal')).toBe('rise');
  });

  it('elements that were already there keep their markup when the opening ends (nothing changes under the visitor)', () => {
    const { container } = render(
      <Reveal play>
        <Views />
      </Reveal>,
    );
    const before = container.querySelector('#view')!.innerHTML;
    act(() => { vi.advanceTimersByTime(OPENING_MS + 50); });
    expect(container.querySelector('#view')!.innerHTML).toBe(before);
  });

  it('play={false}: nothing plays, before or after', () => {
    const { container } = render(
      <Reveal play={false}>
        <Views />
      </Reveal>,
    );
    expect(container.querySelector('.vs-reveal-curtain')).toBeNull();
    expect(container.querySelector('h1')!.hasAttribute('data-vs-reveal-text')).toBe(false);
    expect(container.querySelector('#card')!.hasAttribute('data-vs-reveal')).toBe(false);
  });

  it('works under StrictMode (effects run twice in development) and the timer is cleared on unmount', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container, unmount } = render(
      <React.StrictMode>
        <Reveal play>
          <Views />
        </Reveal>
      </React.StrictMode>,
    );
    expect(container.querySelector('#card')!.getAttribute('data-vs-reveal')).toBe('rise');
    act(() => { vi.advanceTimersByTime(OPENING_MS + 50); });
    toggle(container);
    toggle(container);
    expect(container.querySelector('#card')!.hasAttribute('data-vs-reveal')).toBe(false);
    const cleared = vi.spyOn(globalThis, 'clearTimeout');
    unmount();
    expect(cleared).toHaveBeenCalled(); // the opening timer is cancelled with the Reveal
    cleared.mockRestore();
    act(() => { vi.advanceTimersByTime(OPENING_MS); }); // and nothing fires afterwards
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });

  it('reduced motion: the opening counts as over at once, so a later mount is plain', () => {
    window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} })) as any;
    const { container } = render(
      <Reveal play>
        <Views />
      </Reveal>,
    );
    act(() => { vi.advanceTimersByTime(10); });
    toggle(container);
    toggle(container);
    expect(container.querySelector('h1')!.hasAttribute('data-vs-reveal-text')).toBe(false);
  });

  it('outside any Reveal an item still gets its attribute (unchanged default)', () => {
    const { container } = render(<RevealItem id="x" variant="fade" />);
    expect(container.querySelector('#x')!.getAttribute('data-vs-reveal')).toBe('fade');
  });
});
