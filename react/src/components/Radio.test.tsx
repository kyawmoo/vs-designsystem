import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Radio } from './Radio';

describe('Radio variants', () => {
  it('keeps the row layout by default (circle, then one label)', () => {
    const html = renderToStaticMarkup(<Radio name="r" value="a">Label</Radio>);
    expect(html).toContain('display:flex');
    expect(html).toContain('<label for="r-a"');
    expect(html).not.toContain('vs-radio-card');
  });
  it('card variant: one label holds the circle, the title and the description', () => {
    const html = renderToStaticMarkup(
      <Radio name="r" value="a" variant="card" description="Hint text">Title</Radio>,
    );
    expect(html).toMatch(/^<label for="r-a" class="vs-radio-card"><input type="radio"[^>]*class="vs-check"[^>]*\/>/);
    expect(html).toContain('<span class="vs-radio-card__title">Title</span>');
    expect(html).toContain('<span class="vs-radio-card__hint">Hint text</span>');
    expect((html.match(/<label/g) ?? []).length).toBe(1);
  });
  it('card variant without a description has no hint element', () => {
    const html = renderToStaticMarkup(<Radio name="r" value="a" variant="card">Title</Radio>);
    expect(html).not.toContain('vs-radio-card__hint');
  });
  it('card variant passes checked, disabled, name and value to the input', () => {
    const html = renderToStaticMarkup(
      <Radio name="r" value="b" variant="card" checked onChange={() => {}} disabled>T</Radio>,
    );
    expect(html).toContain('name="r"');
    expect(html).toContain('value="b"');
    expect(html).toContain('checked=""');
    expect(html).toContain('disabled=""');
  });
  it('card variant puts a custom class on the label and escapes text', () => {
    const html = renderToStaticMarkup(
      <Radio name="r" value="a" variant="card" className="extra" description="<i>x</i>">{'<b>t</b>'}</Radio>,
    );
    expect(html).toContain('class="vs-radio-card extra"');
    expect(html).not.toContain('<b>t</b>');
    expect(html).not.toContain('<i>x</i>');
  });
});
