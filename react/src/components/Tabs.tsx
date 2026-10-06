import React from 'react';

export type TabsVariant = 'segmented' | 'primary' | 'secondary';

export interface TabItem {
  /** Unique within one Tabs. Keep it simple (letters, digits, `-`, `_`): it is part of the generated DOM ids. */
  id: string;
  label: React.ReactNode;
  /** Primary / secondary only: leading icon (decorative, hidden from screen readers). */
  icon?: React.ReactNode;
  /** Primary / secondary only: trailing count or status, e.g. `<Badge tone="info">12</Badge>`. */
  badge?: React.ReactNode;
  /** Not selectable, not focusable. */
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  /**
   * `segmented` (default) is the original pill track used across the reports dashboard: a compact option/filter
   * switch, rendered exactly as before. `primary` and `secondary` are real tabs: an underline indicator, the ARIA
   * tablist pattern, arrow-key navigation and optional tab panels.
   */
  variant?: TabsVariant;
  /** `segmented` only. */
  size?: 'sm' | 'md';
  /**
   * Primary / secondary: base for the generated tab and panel ids. Pass it (and the same value to each `TabPanel`)
   * to wire `aria-controls` / `aria-labelledby`. Without it the tabs get an internal id and no `aria-controls`.
   */
  id?: string;
  /** Primary / secondary: accessible name of the tab list (`aria-label`). Give one whenever a page has several. */
  label?: string;
  className?: string;
  buttonClassName?: string;
}

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');
const safe = (value: string) => value.replace(/\s+/g, '-');

export const getTabId = (tabsId: string, tabId: string) => `${tabsId}-tab-${safe(tabId)}`;
export const getTabPanelId = (tabsId: string, tabId: string) => `${tabsId}-panel-${safe(tabId)}`;

/**
 * Tabs. The default `segmented` variant formalizes the `.vs-segment-control` / `.vs-segment-button` pattern
 * already live in production inside TableWidget.tsx (and duplicated inline across several report views):
 * same classes, same visual output. `primary` / `secondary` are the navigation tabs: text with an underline
 * indicator, `role="tablist"`, roving tabindex, Left/Right/Home/End keys (automatic activation), horizontal
 * scroll instead of wrapping. Pair them with `TabPanel`.
 */
export function Tabs({
  tabs,
  activeId,
  onChange,
  variant = 'segmented',
  size = 'md',
  id,
  label,
  className,
  buttonClassName,
}: TabsProps) {
  const generatedId = React.useId();
  const buttons = React.useRef(new Map<string, HTMLButtonElement>());

  if (variant === 'segmented') {
    return (
      <div className={className ? `vs-segment-control ${className}` : 'vs-segment-control'}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={`vs-segment-button ${size === 'sm' ? 'vs-segment-button--sm' : ''} ${
              activeId === tab.id ? 'is-active' : ''
            } ${buttonClassName ?? ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  if (tabs.length === 0) return null;

  const tabsId = id ?? generatedId;
  const enabled = tabs.filter((tab) => !tab.disabled);
  // Exactly one tab is in the page tab order: the selected one, else the first enabled one.
  const tabbableId = enabled.some((tab) => tab.id === activeId) ? activeId : enabled[0]?.id;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, tabId: string) => {
    if (event.altKey || event.ctrlKey || event.metaKey || enabled.length === 0) return;
    const at = enabled.findIndex((tab) => tab.id === tabId);
    if (at === -1) return;
    let next: TabItem | undefined;
    if (event.key === 'ArrowRight') next = enabled[(at + 1) % enabled.length];
    else if (event.key === 'ArrowLeft') next = enabled[(at - 1 + enabled.length) % enabled.length];
    else if (event.key === 'Home') next = enabled[0];
    else if (event.key === 'End') next = enabled[enabled.length - 1];
    else return;
    event.preventDefault();
    buttons.current.get(next.id)?.focus();
    if (next.id !== activeId) onChange(next.id);
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cx('vs-tabs', `vs-tabs--${variant}`, className)}
    >
      {tabs.map((tab) => {
        const selected = tab.id === activeId;
        const hasBadge = tab.badge !== undefined && tab.badge !== null && tab.badge !== false;
        return (
          <button
            key={tab.id}
            ref={(node) => {
              if (node) buttons.current.set(tab.id, node);
              else buttons.current.delete(tab.id);
            }}
            type="button"
            role="tab"
            id={getTabId(tabsId, tab.id)}
            aria-selected={selected}
            aria-controls={id ? getTabPanelId(tabsId, tab.id) : undefined}
            tabIndex={tab.id === tabbableId ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, tab.id)}
            className={cx('vs-tab', buttonClassName)}
          >
            {tab.icon ? (
              <span className="vs-tab__icon" aria-hidden="true">
                {tab.icon}
              </span>
            ) : null}
            <span className="vs-tab__label">{tab.label}</span>
            {/* a real space keeps the accessible name "Products 24" (flex layout ignores it) */}
            {hasBadge ? (
              <>
                {' '}
                <span className="vs-tab__badge">{tab.badge}</span>
              </>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export interface TabPanelProps {
  /** The `id` given to the matching `Tabs`. */
  tabsId: string;
  /** The `id` of the tab this panel belongs to. */
  tabId: string;
  /** The `activeId` of the matching `Tabs`: the panel is shown only while it equals `tabId`. */
  activeId: string;
  /** Keep the children mounted (hidden) while inactive, so their state survives a tab switch. Default: unmount. */
  keepMounted?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** The content region of one tab. Always rendered (so `aria-controls` resolves), hidden unless selected. */
export function TabPanel({ tabsId, tabId, activeId, keepMounted = false, className, children }: TabPanelProps) {
  const active = activeId === tabId;
  return (
    <div
      role="tabpanel"
      id={getTabPanelId(tabsId, tabId)}
      aria-labelledby={getTabId(tabsId, tabId)}
      hidden={!active}
      tabIndex={0}
      className={cx('vs-tab-panel', className)}
    >
      {active || keepMounted ? children : null}
    </div>
  );
}
