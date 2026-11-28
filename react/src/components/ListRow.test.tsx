import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ListRow } from './ListRow';

afterEach(cleanup);
const html = (p: Partial<React.ComponentProps<typeof ListRow>> = {}) => renderToStaticMarkup(<ListRow title="Settings" {...p} />);

describe('ListRow', () => {
  it('without href: a button that calls onClick', () => {
    const onClick = vi.fn();
    render(<ListRow title="Settings" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it('with href: a link', () => {
    render(<ListRow title="Help" href="/help" />);
    expect(screen.getByRole('link', { name: 'Help' }).getAttribute('href')).toBe('/help');
  });
  it('icon in a hidden tile, title, description, chevron by default', () => {
    const h = html({ icon: <svg />, description: 'Account and team' });
    expect(h).toContain('<span class="vs-list-row__icon" aria-hidden="true"><svg></svg></span>');
    expect(h).toContain('<span class="vs-list-row__desc">Account and team</span>');
    expect(h).toContain('vs-list-row__chev');
  });
  it('a long description is the ellipsis span (CSS cuts it), the chevron stays outside the text box', () => {
    const h = html({ description: 'x'.repeat(300) });
    expect(h).toMatch(/<span class="vs-list-row__text">.*<\/span><svg[^>]*vs-list-row__chev/s);
  });
  it('avatar replaces the icon tile', () => {
    const h = html({ icon: <svg />, avatar: <img alt="" src="a.png" /> });
    expect(h).toContain('vs-list-row__avatar');
    expect(h).not.toContain('vs-list-row__icon');
  });
  it('badge, value, no chevron, danger', () => {
    const h = html({ badge: 'NEW', value: 12, chevron: false, danger: true });
    expect(h).toContain('<span class="vs-list-row__badge">NEW</span>');
    expect(h).toContain('<span class="vs-list-row__value">12</span>');
    expect(h).not.toContain('vs-list-row__chev');
    expect(h).toContain('class="vs-list-row vs-list-row--danger"');
  });
  it('an empty value and no description draw nothing for them; text is escaped', () => {
    const h = html({ value: '', title: '<b>x</b>' });
    expect(h).not.toContain('vs-list-row__value');
    expect(h).not.toContain('vs-list-row__desc');
    expect(h).toContain('&lt;b&gt;x&lt;/b&gt;');
  });
});
