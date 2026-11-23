import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { Reveal, RevealItem } from './Reveal';

// jsdom runs no CSS animation, so these tests check the markup the CSS contract needs: the curtain, the
// data-vs-reveal attribute on the element itself, and no wrapper. How it looks and moves is checked in real browsers by
// react/browser/reveal-check.mjs (npm run test:browser). The "plays once" rule is in RevealOnce.test.tsx (it needs a
// fresh module, so it has a file of its own).
afterEach(cleanup);

describe('Reveal', () => {
  it('adds one curtain, hidden from assistive technology, and renders no wrapper element', () => {
    const { container } = render(
      <Reveal play>
        <p id="a">a</p>
        <p id="b">b</p>
      </Reveal>,
    );
    const kids = Array.from(container.children);
    expect(kids.map((k) => k.tagName + (k.id ? '#' + k.id : ''))).toEqual(['DIV', 'P#a', 'P#b']);
    expect(kids[0].className).toBe('vs-reveal-curtain');
    expect(kids[0].getAttribute('aria-hidden')).toBe('true');
    expect(kids[0].childElementCount).toBe(0);
    expect(kids[0].textContent).toBe('');
  });

  it('play={false}: no curtain, and the items carry no attribute (they show at once)', () => {
    const { container } = render(
      <Reveal play={false}>
        <RevealItem variant="slide-left" id="side">menu</RevealItem>
      </Reveal>,
    );
    expect(container.querySelector('.vs-reveal-curtain')).toBeNull();
    expect(container.querySelector('#side')?.hasAttribute('data-vs-reveal')).toBe(false);
  });

  it('play={true}: the curtain and the item attribute are there', () => {
    const { container } = render(
      <Reveal play>
        <RevealItem variant="rise" id="head">head</RevealItem>
      </Reveal>,
    );
    expect(container.querySelectorAll('.vs-reveal-curtain')).toHaveLength(1);
    expect(container.querySelector('#head')?.getAttribute('data-vs-reveal')).toBe('rise');
  });

  it('a play value given later is ignored (read once, when it mounts)', () => {
    const { container, rerender } = render(<Reveal play>x</Reveal>);
    expect(container.querySelector('.vs-reveal-curtain')).not.toBeNull();
    rerender(<Reveal play={false}>x</Reveal>);
    expect(container.querySelector('.vs-reveal-curtain')).not.toBeNull();
  });
});

describe('RevealItem', () => {
  it('is the element itself (as), with its own props, and not a wrapper around it', () => {
    const { container } = render(
      <Reveal play>
        <RevealItem as="aside" variant="slide-left" id="side" className="menu" role="complementary" data-x="1">
          <nav>links</nav>
        </RevealItem>
      </Reveal>,
    );
    const el = container.querySelector('#side') as HTMLElement;
    expect(el.tagName).toBe('ASIDE');
    expect(el.getAttribute('data-vs-reveal')).toBe('slide-left');
    expect(el.className).toBe('menu');
    expect(el.getAttribute('role')).toBe('complementary');
    expect(el.getAttribute('data-x')).toBe('1');
    expect(el.children).toHaveLength(1);
    expect(el.firstElementChild?.tagName).toBe('NAV');
    expect(container.querySelectorAll('aside')).toHaveLength(1);
  });

  it('is a div by default and fades by default', () => {
    const { container } = render(
      <Reveal play>
        <RevealItem id="x">content</RevealItem>
      </Reveal>,
    );
    const el = container.querySelector('#x') as HTMLElement;
    expect(el.tagName).toBe('DIV');
    expect(el.getAttribute('data-vs-reveal')).toBe('fade');
    expect(el.textContent).toBe('content');
  });

  it('can be a component of your own that puts the props on its root', () => {
    function Menu(props: React.HTMLAttributes<HTMLElement>) {
      return <aside {...props}>menu</aside>;
    }
    const { container } = render(
      <Reveal play>
        <RevealItem as={Menu} variant="slide-left" id="menu" />
      </Reveal>,
    );
    const el = container.querySelector('#menu') as HTMLElement;
    expect(el.tagName).toBe('ASIDE');
    expect(el.getAttribute('data-vs-reveal')).toBe('slide-left');
  });

  it('outside a <Reveal> it still carries its attribute', () => {
    const { container } = render(<RevealItem id="alone" variant="rise">x</RevealItem>);
    expect(container.querySelector('#alone')?.getAttribute('data-vs-reveal')).toBe('rise');
  });

  it('every variant is written to the attribute as it is', () => {
    const { container } = render(
      <Reveal play>
        <RevealItem id="a" variant="slide-left" />
        <RevealItem id="b" variant="fade" />
        <RevealItem id="c" variant="rise" />
      </Reveal>,
    );
    expect(['a', 'b', 'c'].map((id) => container.querySelector('#' + id)?.getAttribute('data-vs-reveal'))).toEqual(['slide-left', 'fade', 'rise']);
  });
});
