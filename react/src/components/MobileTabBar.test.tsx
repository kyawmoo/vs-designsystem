import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Home, Package, MoreHorizontal, Users, Star, Bell } from 'lucide-react';
import { MobileTabBar, MobileTabBarDock } from './MobileTabBar';
import type { MobileTabBarItem } from './MobileTabBar';

afterEach(cleanup);
const items: MobileTabBarItem[] = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'items', label: 'Items', icon: Package },
  { id: 'more', label: 'More', icon: MoreHorizontal },
];
const html = (activeId: string, list: readonly MobileTabBarItem[] = items) => renderToStaticMarkup(<MobileTabBar items={list} activeId={activeId} />);

describe('MobileTabBar', () => {
  it('one button with a visible label per item; icons hidden from screen readers', () => {
    const h = html('overview');
    expect(h.match(/<button type="button" class="vs-tabbar__item"/g)).toHaveLength(3);
    for (const l of ['Overview', 'Items', 'More']) expect(h).toContain(`<span>${l}</span>`);
    expect(h).toMatch(/<svg[^>]*aria-hidden="true"/);
  });
  it('only the active item is aria-current="page"', () => {
    const h = html('items');
    expect(h.match(/aria-current="page"/g)).toHaveLength(1);
    expect(h).toMatch(/aria-current="page">(?:(?!<\/button>).)*<span>Items<\/span>/s);
  });
  it('an unknown active id marks nothing and draws no slider', () => {
    const h = html('nope');
    expect(h).not.toContain('aria-current');
    expect(h).not.toContain('vs-tabbar__slider');
  });
  it('0 items: an empty navigation landmark, no error', () => {
    expect(html('overview', [])).toBe('<nav class="vs-tabbar" aria-label="Main"></nav>');
  });
  it('6 items still render (designed for 5; each slot gets narrower)', () => {
    const six = [...items, { id: 'u', label: 'Users', icon: Users }, { id: 's', label: 'Saved', icon: Star }, { id: 'b', label: 'Alerts', icon: Bell }].slice(0, 6);
    const h = html('b', six);
    expect(h.match(/class="vs-tabbar__item"/g)).toHaveLength(6);
    expect(h).toContain('--vs-tab-count:6;--vs-tab-index:5');
  });
  it('one slider knows the count and the active index; round only on the first and last item', () => {
    expect(html('items')).toContain('style="--vs-tab-count:3;--vs-tab-index:1"');
    expect(html('overview')).toContain('data-edge="true"');
    expect(html('more')).toContain('data-edge="true"');
    expect(html('items')).toContain('data-edge="false"');
  });
  it('an item with href is a link (still aria-current and onSelect)', () => {
    const onSelect = vi.fn();
    render(<MobileTabBar items={[{ id: 'a', label: 'A', icon: Home, href: '/a' }, { id: 'b', label: 'B', icon: Package }]} activeId="a" onSelect={onSelect} />);
    const link = screen.getByRole('link', { name: 'A' });
    expect(link.getAttribute('href')).toBe('/a');
    expect(link.getAttribute('aria-current')).toBe('page');
    fireEvent.click(link);
    fireEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(onSelect.mock.calls).toEqual([['a'], ['b']]);
  });
  it('a custom aria label and class', () => {
    expect(renderToStaticMarkup(<MobileTabBar items={items} activeId="items" ariaLabel="Tabs" className="x" />)).toContain('class="vs-tabbar x" aria-label="Tabs"');
  });
  it('the dock wraps its children', () => {
    expect(renderToStaticMarkup(<MobileTabBarDock className="lg:hidden"><b>x</b></MobileTabBarDock>)).toBe('<div class="vs-tabbar-dock lg:hidden"><b>x</b></div>');
  });
});
