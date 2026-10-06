import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToStaticMarkup } from 'react-dom/server';
import { SegmentedControl } from './SegmentedControl';
import { TabPanel, Tabs } from './Tabs';
import type { TabItem, TabsVariant } from './Tabs';

afterEach(cleanup);

const TABS: TabItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'products', label: 'Products' },
  { id: 'analytics', label: 'Analytics' },
];

/** Controlled harness: the real usage (state lives in the page). */
function Harness({
  tabs = TABS,
  variant = 'primary',
  initial = 'overview',
  onChange,
  withPanels = true,
  keepMounted,
}: {
  tabs?: TabItem[];
  variant?: TabsVariant;
  initial?: string;
  onChange?: (id: string) => void;
  withPanels?: boolean;
  keepMounted?: boolean;
}) {
  const [active, setActive] = useState(initial);
  return (
    <>
      <Tabs
        id="demo"
        label="Sections"
        variant={variant}
        tabs={tabs}
        activeId={active}
        onChange={(id) => {
          onChange?.(id);
          setActive(id);
        }}
      />
      {withPanels &&
        tabs.map((tab) => (
          <TabPanel key={tab.id} tabsId="demo" tabId={tab.id} activeId={active} keepMounted={keepMounted}>
            {`${tab.id} content`}
          </TabPanel>
        ))}
    </>
  );
}

describe('Tabs — segmented (default, existing behaviour must not change)', () => {
  it('renders the original markup: no tab roles, same classes, active marker', () => {
    const { container } = render(<Tabs tabs={TABS} activeId="products" onChange={() => {}} size="sm" className="shrink-0" />);
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByRole('tab')).toBeNull();
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toBe('vs-segment-control shrink-0');
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual(['Overview', 'Products', 'Analytics']);
    expect(buttons[1].className).toContain('vs-segment-button');
    expect(buttons[1].className).toContain('vs-segment-button--sm');
    expect(buttons[1].className).toContain('is-active');
    expect(buttons[0].className).not.toContain('is-active');
    expect(buttons[0].hasAttribute('disabled')).toBe(false);
    expect(buttons[0].hasAttribute('aria-selected')).toBe(false);
  });

  it('calls onChange with the clicked id', async () => {
    const onChange = vi.fn();
    render(<Tabs tabs={TABS} activeId="overview" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Analytics' }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith('analytics');
  });

  it('renders exactly what SegmentedControl renders (the deprecated alias path)', () => {
    const props = { tabs: TABS, activeId: 'products', onChange: () => {}, size: 'sm' as const, className: 'x', buttonClassName: 'y' };
    expect(renderToStaticMarkup(<Tabs {...props} />)).toBe(renderToStaticMarkup(<SegmentedControl {...props} />));
  });
});

describe('Tabs — primary / secondary: structure and ARIA', () => {
  it.each(['primary', 'secondary'] as const)('%s: tablist, tabs, selected state, class', (variant) => {
    render(<Harness variant={variant} />);
    const list = screen.getByRole('tablist', { name: 'Sections' });
    expect(list.className).toContain('vs-tabs');
    expect(list.className).toContain(`vs-tabs--${variant}`);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(tabs.map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
  });

  it('links each tab to its panel both ways (aria-controls / aria-labelledby)', () => {
    render(<Harness />);
    for (const tab of screen.getAllByRole('tab')) {
      const panelId = tab.getAttribute('aria-controls');
      expect(panelId).toBeTruthy();
      const panel = document.getElementById(panelId as string) as HTMLElement;
      expect(panel).not.toBeNull();
      expect(panel.getAttribute('role')).toBe('tabpanel');
      expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
    }
  });

  it('omits aria-controls when no id is given (no dangling reference)', () => {
    render(<Tabs variant="primary" tabs={TABS} activeId="overview" onChange={() => {}} />);
    for (const tab of screen.getAllByRole('tab')) {
      expect(tab.hasAttribute('aria-controls')).toBe(false);
      expect(tab.id).toBeTruthy();
    }
  });

  it('gives two Tabs without ids different generated ids', () => {
    render(
      <>
        <Tabs variant="primary" tabs={TABS} activeId="overview" onChange={() => {}} />
        <Tabs variant="secondary" tabs={TABS} activeId="overview" onChange={() => {}} />
      </>,
    );
    const ids = screen.getAllByRole('tab').map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps ids valid when a tab id contains whitespace', () => {
    render(<Tabs variant="primary" id="x" tabs={[{ id: 'all items', label: 'All Items' }]} activeId="all items" onChange={() => {}} />);
    expect(/\s/.test(screen.getByRole('tab').id)).toBe(false);
  });

  it('renders icon (hidden from screen readers) and badge, both inside the tab', () => {
    render(
      <Tabs
        variant="primary"
        tabs={[{ id: 'p', label: 'Products', icon: <svg data-testid="ic" />, badge: <span>24</span> }]}
        activeId="p"
        onChange={() => {}}
      />,
    );
    const tab = screen.getByRole('tab');
    const icon = screen.getByTestId('ic');
    expect(tab.contains(icon)).toBe(true);
    expect(icon.parentElement?.getAttribute('aria-hidden')).toBe('true');
    expect(tab.textContent).toBe('Products 24');
    expect(screen.getByRole('tab', { name: 'Products 24' })).toBe(tab);
  });

  it('renders badge 0 but not null / false / undefined', () => {
    render(
      <Tabs
        variant="primary"
        tabs={[
          { id: 'z', label: 'Zero', badge: 0 },
          { id: 'n', label: 'Null', badge: null },
          { id: 'f', label: 'False', badge: false },
        ]}
        activeId="z"
        onChange={() => {}}
      />,
    );
    expect(document.querySelectorAll('.vs-tab__badge')).toHaveLength(1);
    expect(screen.getByRole('tab', { name: /Zero/ }).textContent).toBe('Zero 0');
  });

  it('renders nothing when there are no tabs', () => {
    const { container } = render(<Tabs variant="primary" tabs={[]} activeId="" onChange={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('Tabs — primary: selection and panels', () => {
  it('clicking a tab selects it and swaps the panel', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    expect(screen.getByRole('tabpanel').textContent).toBe('overview content');
    await userEvent.click(screen.getByRole('tab', { name: 'Products' }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith('products');
    expect(screen.getByRole('tab', { name: 'Products' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tab', { name: 'Overview' }).getAttribute('aria-selected')).toBe('false');
    expect(screen.getByRole('tabpanel').textContent).toBe('products content');
  });

  it('exactly one panel is visible; the others are hidden and empty', () => {
    render(<Harness initial="analytics" />);
    const all = document.querySelectorAll('[role="tabpanel"]');
    expect(all).toHaveLength(3);
    const visible = [...all].filter((p) => !(p as HTMLElement).hidden);
    expect(visible).toHaveLength(1);
    expect(visible[0].textContent).toBe('analytics content');
    expect([...all].filter((p) => (p as HTMLElement).hidden).every((p) => p.textContent === '')).toBe(true);
  });

  it('keepMounted keeps hidden panels’ content (state survives a switch)', () => {
    render(<Harness keepMounted />);
    const hidden = [...document.querySelectorAll('[role="tabpanel"]')].filter((p) => (p as HTMLElement).hidden);
    expect(hidden.map((p) => p.textContent)).toEqual(['products content', 'analytics content']);
  });

  it('a disabled tab cannot be selected', async () => {
    const onChange = vi.fn();
    render(<Harness tabs={[...TABS.slice(0, 2), { id: 'history', label: 'History', disabled: true }]} onChange={onChange} />);
    const disabled = screen.getByRole('tab', { name: 'History' });
    expect(disabled.hasAttribute('disabled')).toBe(true);
    await userEvent.click(disabled);
    expect(onChange).not.toHaveBeenCalled();
    expect(disabled.getAttribute('aria-selected')).toBe('false');
  });
});

describe('Tabs — primary: keyboard', () => {
  const focused = () => document.activeElement as HTMLElement;

  it('roving tabindex: only the selected tab is in the tab order', () => {
    render(<Harness initial="products" />);
    expect(screen.getAllByRole('tab').map((t) => t.tabIndex)).toEqual([-1, 0, -1]);
  });

  it('Tab key enters the list on the selected tab and leaves to the panel', async () => {
    render(<Harness initial="products" />);
    await userEvent.tab();
    expect(focused()).toBe(screen.getByRole('tab', { name: 'Products' }));
    await userEvent.tab();
    expect(focused()).toBe(screen.getByRole('tabpanel'));
  });

  it('ArrowRight / ArrowLeft move focus and select (automatic activation), wrapping at the ends', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    expect(focused()).toBe(screen.getByRole('tab', { name: 'Products' }));
    expect(screen.getByRole('tab', { name: 'Products' }).getAttribute('aria-selected')).toBe('true');
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    expect(focused()).toBe(screen.getByRole('tab', { name: 'Overview' })); // wrapped from the last
    await userEvent.keyboard('{ArrowLeft}');
    expect(focused()).toBe(screen.getByRole('tab', { name: 'Analytics' })); // wrapped from the first
    expect(onChange.mock.calls.map((c) => c[0])).toEqual(['products', 'analytics', 'overview', 'analytics']);
  });

  it('Home and End jump to the first and last enabled tab', async () => {
    render(<Harness initial="products" />);
    await userEvent.tab();
    await userEvent.keyboard('{End}');
    expect(focused()).toBe(screen.getByRole('tab', { name: 'Analytics' }));
    await userEvent.keyboard('{Home}');
    expect(focused()).toBe(screen.getByRole('tab', { name: 'Overview' }));
    expect(screen.getByRole('tab', { name: 'Overview' }).getAttribute('aria-selected')).toBe('true');
  });

  it('arrow keys skip disabled tabs', async () => {
    render(
      <Harness
        tabs={[
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B', disabled: true },
          { id: 'c', label: 'C' },
        ]}
        initial="a"
      />,
    );
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    expect(focused()).toBe(screen.getByRole('tab', { name: 'C' }));
    await userEvent.keyboard('{ArrowLeft}');
    expect(focused()).toBe(screen.getByRole('tab', { name: 'A' }));
  });

  it('Home / End ignore a disabled first or last tab', async () => {
    render(
      <Harness
        tabs={[
          { id: 'a', label: 'A', disabled: true },
          { id: 'b', label: 'B' },
          { id: 'c', label: 'C' },
          { id: 'd', label: 'D', disabled: true },
        ]}
        initial="b"
      />,
    );
    await userEvent.tab();
    await userEvent.keyboard('{End}');
    expect(focused()).toBe(screen.getByRole('tab', { name: 'C' }));
    await userEvent.keyboard('{Home}');
    expect(focused()).toBe(screen.getByRole('tab', { name: 'B' }));
  });

  it('does not call onChange when the arrow lands on the already-selected tab (single enabled tab)', async () => {
    const onChange = vi.fn();
    render(<Harness tabs={[{ id: 'only', label: 'Only' }, { id: 'x', label: 'X', disabled: true }]} initial="only" onChange={onChange} />);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}{End}{Home}');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('leaves browser shortcuts and other keys alone (Alt+Arrow, Ctrl+Home, letters)', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const tab = screen.getByRole('tab', { name: 'Overview' });
    tab.focus();
    for (const init of [{ key: 'ArrowRight', altKey: true }, { key: 'Home', ctrlKey: true }, { key: 'ArrowLeft', metaKey: true }, { key: 'a' }, { key: 'ArrowDown' }]) {
      const notPrevented = fireEvent.keyDown(tab, init);
      expect(notPrevented).toBe(true);
    }
    expect(onChange).not.toHaveBeenCalled();
    expect(focused()).toBe(tab);
  });

  it('prevents default for the keys it handles (so the tab list does not scroll the page)', () => {
    render(<Harness />);
    const tab = screen.getByRole('tab', { name: 'Overview' });
    tab.focus();
    expect(fireEvent.keyDown(tab, { key: 'ArrowRight' })).toBe(false);
  });

  it('Enter and Space on a focused tab keep working as a button click', async () => {
    const onChange = vi.fn();
    render(<Tabs variant="primary" tabs={TABS} activeId="overview" onChange={onChange} />);
    screen.getByRole('tab', { name: 'Overview' }).focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});

describe('Tabs — primary: edge cases', () => {
  it('when activeId matches nothing, the first enabled tab is the one tabbable tab', () => {
    render(<Tabs variant="primary" tabs={[{ id: 'a', label: 'A', disabled: true }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }]} activeId="missing" onChange={() => {}} />);
    expect(screen.getAllByRole('tab').map((t) => t.tabIndex)).toEqual([-1, 0, -1]);
    expect(screen.getAllByRole('tab').every((t) => t.getAttribute('aria-selected') === 'false')).toBe(true);
  });

  it('when the selected tab is disabled, the first enabled tab is tabbable instead', () => {
    render(<Tabs variant="primary" tabs={[{ id: 'a', label: 'A' }, { id: 'b', label: 'B', disabled: true }]} activeId="b" onChange={() => {}} />);
    expect(screen.getAllByRole('tab').map((t) => t.tabIndex)).toEqual([0, -1]);
  });

  it('all tabs disabled: renders, nothing tabbable, no crash on keys', () => {
    const onChange = vi.fn();
    render(<Tabs variant="primary" tabs={[{ id: 'a', label: 'A', disabled: true }, { id: 'b', label: 'B', disabled: true }]} activeId="a" onChange={onChange} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.every((t) => t.tabIndex === -1)).toBe(true);
    for (const t of tabs) fireEvent.keyDown(t, { key: 'ArrowRight' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('survives a tab being removed while focused (list changes between renders)', () => {
    const { rerender } = render(<Tabs variant="primary" tabs={TABS} activeId="analytics" onChange={() => {}} />);
    rerender(<Tabs variant="primary" tabs={TABS.slice(0, 2)} activeId="analytics" onChange={() => {}} />);
    expect(screen.getAllByRole('tab')).toHaveLength(2);
    expect(screen.getAllByRole('tab').map((t) => t.tabIndex)).toEqual([0, -1]);
  });

  it('handles a very long label without altering structure', () => {
    const label = 'A'.repeat(300);
    render(<Tabs variant="primary" tabs={[{ id: 'l', label }]} activeId="l" onChange={() => {}} />);
    expect(screen.getByRole('tab').textContent).toBe(label);
  });

  it('merges className on the list and buttonClassName on every tab', () => {
    render(<Tabs variant="secondary" tabs={TABS} activeId="overview" onChange={() => {}} className="mt-2" buttonClassName="extra" />);
    expect(screen.getByRole('tablist').className).toBe('vs-tabs vs-tabs--secondary mt-2');
    expect(screen.getAllByRole('tab').every((t) => t.className === 'vs-tab extra')).toBe(true);
  });
});
