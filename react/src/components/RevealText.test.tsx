import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { Reveal, RevealText, canSplitIntoLetters } from './Reveal';
import fixtures from '../fixtures-reveal-text-scripts.json';

// Markup only (jsdom runs no CSS animation). How the letters look and move is checked in real browsers by
// react/browser/reveal-check.mjs.
afterEach(cleanup);

const letters = (c: HTMLElement) => Array.from(c.querySelectorAll('.vs-reveal-text__letter'));

describe('RevealText', () => {
  it('while the opening plays: the element itself carries the attribute, with a hidden real copy and aria-hidden letters', () => {
    const { container } = render(
      <Reveal play>
        <RevealText as="h1" id="t" className="title" text="Overview" />
      </Reveal>,
    );
    const h1 = container.querySelector('h1#t') as HTMLElement;
    expect(h1.className).toBe('title');
    expect(h1.hasAttribute('data-vs-reveal-text')).toBe(true);
    expect(h1.children[0].className).toBe('vs-reveal-text__sr');
    expect(h1.children[0].textContent).toBe('Overview');
    expect(h1.children[1].getAttribute('aria-hidden')).toBe('true');
    expect(letters(container).map((l) => l.textContent).join('')).toBe('Overview');
    expect(letters(container).map((l) => (l as HTMLElement).style.getPropertyValue('--i'))).toEqual(['0', '1', '2', '3', '4', '5', '6', '7']);
  });

  it('words stay together and are separated by a normal space, so a long title can wrap', () => {
    const { container } = render(
      <Reveal play>
        <RevealText text="Welcome   back  today" />
      </Reveal>,
    );
    const words = Array.from(container.querySelectorAll('.vs-reveal-text__word'));
    expect(words.map((w) => w.textContent)).toEqual(['Welcome', 'back', 'today']);
    expect(container.querySelector('.vs-reveal-text__visual')!.textContent).toBe('Welcome back today');
    expect(letters(container)).toHaveLength(16); // 7 + 4 + 5, the spaces are not letters
  });

  it('letters after the 30th share the last delay, and an empty title renders no letters', () => {
    const { container, rerender } = render(
      <Reveal play>
        <RevealText text={'a'.repeat(45)} />
      </Reveal>,
    );
    const idx = letters(container).map((l) => Number((l as HTMLElement).style.getPropertyValue('--i')));
    expect(idx[29]).toBe(29);
    expect(idx[30]).toBe(30);
    expect(Math.max(...idx)).toBe(30);
    rerender(
      <Reveal play>
        <RevealText text="" />
      </Reveal>,
    );
    expect(letters(container)).toHaveLength(0);
  });

  it('a letter with combining marks or a joined emoji is one letter, never cut in two', () => {
    for (const word of ['Cafe\u0301', '👨‍👩‍👧‍👦']) {
      const { container } = render(
        <Reveal play>
          <RevealText text={word} />
        </Reveal>,
      );
      const texts = letters(container).map((l) => l.textContent);
      expect(texts.join(''), word).toBe(word);
      expect(texts.length, word).toBeLessThan(Array.from(word).length);
      cleanup();
    }
  });

  it('play={false}: the element holds only the plain text', () => {
    const { container } = render(
      <Reveal play={false}>
        <RevealText as="h1" text="Overview" />
      </Reveal>,
    );
    const h1 = container.querySelector('h1')!;
    expect(h1.innerHTML).toBe('Overview');
    expect(h1.hasAttribute('data-vs-reveal-text')).toBe(false);
  });

  it('escapes the text (it is rendered as text, not as markup)', () => {
    const { container } = render(
      <Reveal play>
        <RevealText text="<b>x</b>" />
      </Reveal>,
    );
    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('.vs-reveal-text__sr')!.textContent).toBe('<b>x</b>');
  });
});

describe('RevealText: scripts that cannot be split keep their original text', () => {
  it('canSplitIntoLetters gives the expected answer for every shared fixture (the same fixtures check the Blade rule in check-tokens)', () => {
    for (const f of fixtures) expect(canSplitIntoLetters(f.text), JSON.stringify(f.text)).toBe(f.split);
  });

  it('Arabic, Hebrew, Burmese, Thai, Devanagari, Han and Kana render the plain text: no letters, no hidden copy, no attribute', () => {
    for (const text of ['مرحبا بالعالم', 'שלום עולם', 'မင်္ဂလာပါ မြန်မာ', 'สวัสดีชาวโลก', 'नमस्ते दुनिया', '你好世界', 'こんにちは']) {
      const { container } = render(
        <Reveal play>
          <RevealText as="h1" text={text} />
        </Reveal>,
      );
      const h1 = container.querySelector('h1')!;
      expect(h1.innerHTML, text).toBe(text);
      expect(h1.hasAttribute('data-vs-reveal-text'), text).toBe(false);
      expect(letters(container), text).toHaveLength(0);
      cleanup();
    }
  });

  it('a title that mixes Latin with one of those scripts stays plain as a whole (the original text is preserved)', () => {
    const { container } = render(
      <Reveal play>
        <RevealText text="Hello مرحبا World" />
      </Reveal>,
    );
    expect(container.querySelector('span')!.textContent).toBe('Hello مرحبا World');
    expect(letters(container)).toHaveLength(0);
  });

  it('Cyrillic, Greek, Hangul, accents and emoji are still written letter by letter', () => {
    for (const text of ['Привет мир', 'Καλημέρα', '안녕하세요', 'Café', '👨‍👩‍👧‍👦 ❤️']) {
      const { container } = render(
        <Reveal play>
          <RevealText text={text} />
        </Reveal>,
      );
      expect(letters(container).length, text).toBeGreaterThan(0);
      expect(container.querySelector('.vs-reveal-text__sr')!.textContent, text).toBe(text);
      cleanup();
    }
  });
});
