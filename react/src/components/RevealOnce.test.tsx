import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { Reveal, RevealItem } from './Reveal';

// "The opening plays once per page load" is kept in module state, so these tests need a module nobody has mounted a
// <Reveal> in yet. Vitest gives every test file its own modules, so that is why this file is separate from
// Reveal.test.tsx. The tests below depend on their order on purpose: they walk one page load from start to end.
afterEach(cleanup);

describe('Reveal plays once per page load', () => {
  it('the first Reveal plays (also under StrictMode, which mounts effects twice)', () => {
    const { container } = render(
      <React.StrictMode>
        <Reveal>
          <RevealItem id="side" variant="slide-left" />
        </Reveal>
      </React.StrictMode>,
    );
    expect(container.querySelectorAll('.vs-reveal-curtain')).toHaveLength(1);
    expect(container.querySelector('#side')?.getAttribute('data-vs-reveal')).toBe('slide-left');
  });

  it('a Reveal that mounts later (for example after signing out and in again) does not play: no curtain, no attribute', () => {
    const { container } = render(
      <Reveal>
        <RevealItem id="side" variant="slide-left" />
        <RevealItem id="body" variant="fade" />
      </Reveal>,
    );
    expect(container.querySelector('.vs-reveal-curtain')).toBeNull();
    expect(container.querySelector('#side')?.hasAttribute('data-vs-reveal')).toBe(false);
    expect(container.querySelector('#body')?.hasAttribute('data-vs-reveal')).toBe(false);
    expect(container.querySelector('#body')?.tagName).toBe('DIV');
  });

  it('even a third one does not play', () => {
    const { container } = render(<Reveal>x</Reveal>);
    expect(container.querySelector('.vs-reveal-curtain')).toBeNull();
  });

  it('play={true} plays it again when asked to', () => {
    const { container } = render(
      <Reveal play>
        <RevealItem id="again" variant="rise" />
      </Reveal>,
    );
    expect(container.querySelectorAll('.vs-reveal-curtain')).toHaveLength(1);
    expect(container.querySelector('#again')?.getAttribute('data-vs-reveal')).toBe('rise');
  });
});
