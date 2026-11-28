import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { LiveDot } from './LiveDot';
import { LiveDot as FromIndex } from '../index';

afterEach(cleanup);

describe('LiveDot', () => {
  it('is an inline, decorative dot with the ripple by default (md, brand green from CSS)', () => {
    const { container } = render(<LiveDot />);
    const dot = container.firstElementChild as HTMLElement;
    expect(dot.tagName).toBe('SPAN');
    expect(dot.className).toBe('vs-live-dot vs-live-dot--inline');
    expect(dot.getAttribute('aria-hidden')).toBe('true');
    expect(dot.getAttribute('role')).toBeNull();
    expect(dot.style.getPropertyValue('--vs-live-dot-color')).toBe('');
  });

  it('sizes, no ripple, colour and extra props', () => {
    const { container, rerender } = render(<LiveDot size="sm" ripple={false} color="var(--vs-alert-danger)" className="x" data-testid="d" style={{ marginLeft: 4 }} />);
    let dot = screen.getByTestId('d');
    expect(dot.className).toBe('vs-live-dot vs-live-dot--inline vs-live-dot--sm vs-live-dot--still x');
    expect(dot.style.getPropertyValue('--vs-live-dot-color')).toBe('var(--vs-alert-danger)');
    expect(dot.style.marginLeft).toBe('4px');
    rerender(<LiveDot size="lg" />);
    expect((container.firstElementChild as HTMLElement).className).toBe('vs-live-dot vs-live-dot--inline vs-live-dot--lg');
    rerender(<LiveDot size={'huge' as any} />);
    expect((container.firstElementChild as HTMLElement).className).toBe('vs-live-dot vs-live-dot--inline');
  });

  it('with a label it is an image with that name for screen readers', () => {
    render(<LiveDot label="Live" />);
    const dot = screen.getByRole('img', { name: 'Live' });
    expect(dot.getAttribute('aria-hidden')).toBeNull();
  });

  it('is exported from the package', () => {
    expect(FromIndex).toBe(LiveDot);
  });
});
