import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToStaticMarkup } from 'react-dom/server';
import { MobilePageHeader } from './MobilePageHeader';

afterEach(cleanup);

// The markup of the four header variants as it was BEFORE `trailing` was added: without `trailing` nothing may change.
const BEFORE = {
  plain: "<div class=\"flex md:hidden items-center gap-2\"><div class=\"flex items-center gap-1.5 min-w-0\" style=\"width:100%\"><button type=\"button\" aria-label=\"Go back\" class=\"shrink-0 w-8 h-8 -ml-1.5 rounded-full flex items-center justify-center text-gray-600 active:bg-gray-100\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-arrow-left w-5 h-5\" aria-hidden=\"true\"><path d=\"m12 19-7-7 7-7\"></path><path d=\"M19 12H5\"></path></svg></button><h1 class=\"text-xl font-bold tracking-tight text-gray-900 truncate\">Users</h1></div></div>",
  noBack: "<div class=\"flex md:hidden items-center gap-2\"><div class=\"flex items-center gap-1.5 min-w-0\" style=\"width:100%\"><h1 class=\"text-xl font-bold tracking-tight text-gray-900 truncate\">Overview</h1></div></div>",
  filter: "<div class=\"flex md:hidden items-center gap-2\"><div class=\"flex items-center gap-1.5 min-w-0\" style=\"width:80%\"><button type=\"button\" aria-label=\"Go back\" class=\"shrink-0 w-8 h-8 -ml-1.5 rounded-full flex items-center justify-center text-gray-600 active:bg-gray-100\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-arrow-left w-5 h-5\" aria-hidden=\"true\"><path d=\"m12 19-7-7 7-7\"></path><path d=\"M19 12H5\"></path></svg></button><h1 class=\"text-xl font-bold tracking-tight text-gray-900 truncate\">Feedback</h1></div><div class=\"flex items-center justify-end shrink-0\" style=\"width:20%\"><button type=\"button\" aria-label=\"Filter\" class=\"w-9 h-9 rounded-lg flex items-center justify-center border transition-colors bg-white border-gray-200 text-gray-600 active:bg-gray-50\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-sliders-horizontal w-4 h-4\" aria-hidden=\"true\"><path d=\"M10 5H3\"></path><path d=\"M12 19H3\"></path><path d=\"M14 3v4\"></path><path d=\"M16 17v4\"></path><path d=\"M21 12h-9\"></path><path d=\"M21 19h-5\"></path><path d=\"M21 5h-7\"></path><path d=\"M8 10v4\"></path><path d=\"M8 12H3\"></path></svg></button></div></div>",
  filterActiveCalendar: "<div class=\"flex md:hidden items-center gap-2\"><div class=\"flex items-center gap-1.5 min-w-0\" style=\"width:80%\"><h1 class=\"text-xl font-bold tracking-tight text-gray-900 truncate\">Social</h1></div><div class=\"flex items-center justify-end shrink-0\" style=\"width:20%\"><button type=\"button\" aria-label=\"Filter\" class=\"w-9 h-9 rounded-lg flex items-center justify-center border transition-colors \" style=\"background:var(--vs-color-brand-primary);border-color:var(--vs-color-brand-primary);color:var(--vs-color-text-on-primary)\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"lucide lucide-calendar w-4 h-4\" aria-hidden=\"true\"><path d=\"M8 2v4\"></path><path d=\"M16 2v4\"></path><rect width=\"18\" height=\"18\" x=\"3\" y=\"4\" rx=\"2\"></rect><path d=\"M3 10h18\"></path></svg></button></div></div>",
};

describe('MobilePageHeader: unchanged without `trailing`', () => {
  const noop = () => {};
  it('renders exactly the same HTML as before for every existing combination', () => {
    expect(renderToStaticMarkup(<MobilePageHeader title="Users" />)).toBe(BEFORE.plain);
    expect(renderToStaticMarkup(<MobilePageHeader title="Overview" showBack={false} />)).toBe(BEFORE.noBack);
    expect(renderToStaticMarkup(<MobilePageHeader title="Feedback" onFilterClick={noop} />)).toBe(BEFORE.filter);
    expect(renderToStaticMarkup(<MobilePageHeader title="Social" onFilterClick={noop} filterActive filterIcon="calendar" showBack={false} />)).toBe(
      BEFORE.filterActiveCalendar
    );
  });

  it('a null, false or undefined `trailing` is the same as none', () => {
    expect(renderToStaticMarkup(<MobilePageHeader title="Users" trailing={null} />)).toBe(BEFORE.plain);
    expect(renderToStaticMarkup(<MobilePageHeader title="Users" trailing={false} />)).toBe(BEFORE.plain);
    expect(renderToStaticMarkup(<MobilePageHeader title="Users" trailing={undefined} />)).toBe(BEFORE.plain);
  });
});

describe('MobilePageHeader: trailing control', () => {
  it('puts the control on the right of the title on the same row, and keeps the back arrow', () => {
    render(<MobilePageHeader title="Download Activity" trailing={<button>Range</button>} />);
    const row = screen.getByText('Download Activity').closest('div')!.parentElement!;
    expect(row.className).toContain('md:hidden'); // mobile only, like before
    expect(row.children).toHaveLength(2); // [title side, trailing side]
    expect(screen.getByRole('button', { name: 'Go back' })).toBeTruthy();
    expect(row.children[1].textContent).toBe('Range');
    expect(row.children[1].className).toContain('shrink-0'); // the control keeps its size
  });

  it('the title takes the rest of the row instead of 80%, and can be cut', () => {
    render(<MobilePageHeader title="Social Traffic & ROI" trailing={<button>Range</button>} />);
    const left = screen.getByText('Social Traffic & ROI').closest('div') as HTMLElement;
    expect(left.className).toContain('flex-1');
    expect(left.className).toContain('min-w-0');
    expect(left.style.width).toBe('');
    expect(screen.getByText('Social Traffic & ROI').className).toContain('truncate');
  });

  it('showBack false hides the arrow and keeps the control', () => {
    render(<MobilePageHeader title="Overview" showBack={false} trailing={<button>Range</button>} />);
    expect(screen.queryByRole('button', { name: 'Go back' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Range' })).toBeTruthy();
  });

  it('with onFilterClick too, the filter button sits after the control and still works', async () => {
    const onFilter = vi.fn();
    render(<MobilePageHeader title="Feedback" onFilterClick={onFilter} trailing={<button>Range</button>} />);
    const right = screen.getByRole('button', { name: 'Range' }).parentElement!;
    expect(Array.from(right.children).map((c) => c.getAttribute('aria-label') || c.textContent)).toEqual(['Range', 'Filter']);
    await userEvent.click(screen.getByRole('button', { name: 'Filter' }));
    expect(onFilter).toHaveBeenCalledTimes(1);
  });
});
