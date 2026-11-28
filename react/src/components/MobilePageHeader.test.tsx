import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToStaticMarkup } from 'react-dom/server';
import { MobilePageHeader } from './MobilePageHeader';

afterEach(cleanup);
const noop = () => {};

// Decision 1a (Master KMO, 2026-11-28): the DS header takes the approved phone look (the reports site's stand-in), so the
// old markup is replaced on purpose.
describe('MobilePageHeader', () => {
  it('a tab page: no back arrow, the big title', () => {
    const h = renderToStaticMarkup(<MobilePageHeader title="Items" showBack={false} />);
    expect(h).toBe('<div class="vs-page-head-wrap"><header class="vs-page-head"><h1 class="vs-page-head__title">Items</h1></header></div>');
  });
  it('a page from a menu: a round back button and the smaller title', () => {
    const h = renderToStaticMarkup(<MobilePageHeader title="Server Health" />);
    expect(h).toContain('<header class="vs-page-head vs-page-head--sub">');
    expect(h).toMatch(/<button type="button" class="vs-page-head__icon" aria-label="Go back"><svg[^>]*aria-hidden="true"/);
  });
  it('the back button goes back in history by default', async () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    render(<MobilePageHeader title="T" />);
    await userEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(back).toHaveBeenCalledTimes(1);
    back.mockRestore();
  });
  it('onBack runs instead, and history is not touched (#145)', async () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const onBack = vi.fn();
    render(<MobilePageHeader title="T" onBack={onBack} />);
    await userEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(back).not.toHaveBeenCalled();
    back.mockRestore();
  });
  it('showBack=false: no arrow, onBack unused', () => {
    render(<MobilePageHeader title="T" showBack={false} onBack={noop} />);
    expect(screen.queryByRole('button', { name: 'Go back' })).toBeNull();
  });
  it('filter button: calls onFilterClick, shows pressed + dark when active, calendar or sliders icon', async () => {
    const onFilter = vi.fn();
    render(<MobilePageHeader title="T" onFilterClick={onFilter} filterActive filterIcon="calendar" />);
    const f = screen.getByRole('button', { name: 'Filter' });
    expect(f.getAttribute('aria-pressed')).toBe('true');
    expect(f.className).toBe('vs-page-head__icon vs-page-head__icon--active');
    expect(f.innerHTML).toContain('lucide-calendar');
    await userEvent.click(f);
    expect(onFilter).toHaveBeenCalledTimes(1);
    cleanup();
    expect(renderToStaticMarkup(<MobilePageHeader title="T" onFilterClick={noop} />)).toMatch(/class="vs-page-head__icon" aria-label="Filter" aria-pressed="false"><svg[^>]*lucide-sliders/);
  });
  it('trailing sits after the title and before the filter', () => {
    const h = renderToStaticMarkup(<MobilePageHeader title="T" trailing={<span id="tr">x</span>} onFilterClick={noop} />);
    expect(h).toMatch(/<\/h1><span id="tr">x<\/span><button type="button" class="vs-page-head__icon" aria-label="Filter"/);
  });
  it('escapes the title', () => {
    expect(renderToStaticMarkup(<MobilePageHeader title="<b>x</b>" />)).toContain('&lt;b&gt;x&lt;/b&gt;');
  });
});
