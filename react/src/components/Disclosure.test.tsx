import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Disclosure } from './Disclosure';

afterEach(cleanup);
const toggle = (d: HTMLDetailsElement) => act(() => { d.open = !d.open; d.dispatchEvent(new Event('toggle')); });

describe('Disclosure', () => {
  it('closed by default: native details without open, aria-expanded false, body present', () => {
    const h = renderToStaticMarkup(<Disclosure title="Traffic" description="Last 30 days">body</Disclosure>);
    expect(h).toMatch(/^<details class="vs-disclosure"><summary class="vs-disclosure__head" aria-expanded="false">/);
    expect(h).toContain('<span class="vs-disclosure__desc">Last 30 days</span>');
    expect(h).toContain('<div class="vs-disclosure__body">body</div>');
  });
  it('defaultOpen renders open with aria-expanded true', () => {
    const h = renderToStaticMarkup(<Disclosure title="T" defaultOpen>x</Disclosure>);
    expect(h).toMatch(/<details class="vs-disclosure" open="">/);
    expect(h).toContain('aria-expanded="true"');
  });
  it('opening and closing (click, Enter and Space are native to summary) keeps aria-expanded in step', () => {
    const { container } = render(<Disclosure title="T">x</Disclosure>);
    const d = container.querySelector('details') as HTMLDetailsElement;
    const s = container.querySelector('summary') as HTMLElement;
    toggle(d);
    expect(s.getAttribute('aria-expanded')).toBe('true');
    toggle(d);
    expect(s.getAttribute('aria-expanded')).toBe('false');
  });
  it('several Disclosures open and close on their own', () => {
    const { container } = render(<><Disclosure title="A">a</Disclosure><Disclosure title="B">b</Disclosure></>);
    const [a, b] = Array.from(container.querySelectorAll('details')) as HTMLDetailsElement[];
    toggle(a);
    expect(a.open).toBe(true);
    expect(b.open).toBe(false);
    expect(container.querySelectorAll('summary')[1].getAttribute('aria-expanded')).toBe('false');
  });
  it('icon in a hidden tile; no icon draws no tile; chevron hidden; text escaped', () => {
    expect(renderToStaticMarkup(<Disclosure title="T" icon={<svg />}>x</Disclosure>)).toContain('<span class="vs-disclosure__icon" aria-hidden="true"><svg></svg></span>');
    const h = renderToStaticMarkup(<Disclosure title="<b>x</b>">x</Disclosure>);
    expect(h).not.toContain('vs-disclosure__icon');
    expect(h).toMatch(/<svg[^>]*vs-disclosure__chev[^>]*aria-hidden="true"/);
    expect(h).toContain('&lt;b&gt;x&lt;/b&gt;');
  });
});
