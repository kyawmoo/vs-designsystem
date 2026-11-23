import React from 'react';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { AnimatedNumber } from './AnimatedNumber';
import { Reveal, RevealText } from './Reveal';

// Automated accessibility check (axe-core, WCAG 2 A/AA rules; jsdom has no layout, so colour contrast is not judged here). It is a floor,
// not proof: no screen reader (NVDA, VoiceOver) was run.
const check = async (container: HTMLElement) =>
  (await axe.run(container, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'], rules: { 'color-contrast': { enabled: false } } })).violations.map((v) => v.id);

beforeEach(() => {
  window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} })) as any;
});
afterEach(cleanup);

describe('text effects: axe-core finds no violation', () => {
  it('AnimatedNumber with a value, with decimals and with no value', async () => {
    const { container } = render(
      <main>
        <p>
          Downloads <AnimatedNumber value={4214} />
        </p>
        <p>
          Rate <AnimatedNumber value={12.35} decimals={2} />%
        </p>
        <p>
          Nothing <AnimatedNumber value={null} />
        </p>
      </main>,
    );
    expect(await check(container)).toEqual([]);
  });

  it('RevealText as a heading inside a playing Reveal', async () => {
    const { container } = render(
      <Reveal play>
        <main>
          <RevealText as="h1" text="Overview" />
        </main>
      </Reveal>,
    );
    expect(await check(container)).toEqual([]);
  });

  it('the Blade markup of x-vs-animated-number (the same structure)', async () => {
    const { container } = render(
      <main
        dangerouslySetInnerHTML={{
          __html:
            '<p>Downloads <span data-vs-animated-number data-value="4214" data-decimals="0" data-duration="1000" data-locale="en-US"><span class="vs-animated-number__sr">4,214</span><span aria-hidden="true">4,214</span></span></p>',
        }}
      />,
    );
    expect(await check(container)).toEqual([]);
  });

  it('control: the old markup (aria-label on a plain span) IS reported, so this check can fail', async () => {
    const { container } = render(
      <main
        dangerouslySetInnerHTML={{ __html: '<p>Downloads <span aria-label="4,214"><span aria-hidden="true">4,214</span></span></p>' }}
      />,
    );
    expect(await check(container)).toContain('aria-prohibited-attr');
  });
});
