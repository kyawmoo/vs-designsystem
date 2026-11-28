import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TextInput } from './TextInput';

const render = (props: Partial<React.ComponentProps<typeof TextInput>> = {}) =>
  renderToStaticMarkup(<TextInput name="email" {...props} />);

describe('TextInput autoComplete and inputMode', () => {
  it('adds neither attribute when not given (markup as before)', () => {
    const html = render();
    expect(html).not.toContain('autoComplete');
    expect(html).not.toContain('autocomplete');
    expect(html).not.toContain('inputmode');
    expect(html).toMatch(/^<div><input type="text" id="email"/);
    expect(html).toContain('name="email"');
  });
  it('passes autoComplete to the input', () => {
    expect(render({ type: 'password', autoComplete: 'current-password' })).toMatch(/<input[^>]*autoComplete="current-password"|<input[^>]*autocomplete="current-password"/i);
  });
  it('passes inputMode to the input', () => {
    expect(render({ inputMode: 'email' })).toMatch(/<input[^>]*inputMode="email"|<input[^>]*inputmode="email"/i);
  });
});

describe('TextInput icon', () => {
  it('draws no icon wrapper without an icon', () => {
    expect(render()).not.toContain('vs-field-icon');
  });
  it('draws the icon inside the field, hidden from screen readers, and moves the text after it', () => {
    const html = render({ icon: <svg data-x="mail" /> });
    expect(html).toMatch(/<span aria-hidden="true" class="vs-field-icon"[^>]*><svg data-x="mail"><\/svg><\/span><input/);
    expect(html).toContain('padding-left:42px');
    expect(html).toContain('color:var(--vs-color-text-muted)');
  });
  it('uses a wider start for the large size', () => {
    expect(render({ icon: <svg />, size: 'lg' })).toContain('padding-left:48px');
  });
  it('keeps the label, the error and the disabled look with an icon', () => {
    const html = render({ icon: <svg />, label: 'Email', error: 'Required', disabled: true });
    expect(html).toContain('<label for="email"');
    expect(html).toContain('>Required</p>');
    expect(html).toContain('disabled=""');
    expect(html).toContain('var(--vs-color-danger-border)');
  });
});
