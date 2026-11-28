import React from 'react';

/** An icon component, e.g. a lucide-react icon. It gets a class, a stroke width and aria-hidden. */
export type MobileTabBarIcon = React.ComponentType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: boolean | 'true' | 'false' }>;

export interface MobileTabBarItem {
  id: string;
  /** The short visible label under the icon. */
  label: string;
  icon: MobileTabBarIcon;
  /** With an address the item is a link; without, a button. */
  href?: string;
}

export interface MobileTabBarProps {
  /** Designed for up to 5 items (more still render, each slot gets narrower). */
  items: readonly MobileTabBarItem[];
  /** The id of the current page; no match = nothing marked. */
  activeId: string;
  /** Called with the item id when an item is tapped (links too, before the browser follows them). */
  onSelect?: (id: string) => void;
  /** Accessible name of the navigation landmark. Default "Main". */
  ariaLabel?: string;
  className?: string;
}

/**
 * VectorSticker MobileTabBar (issue #68): the phone bottom navigation, a dark pill with icon + label items. The selected item
 * sits on one accent pill that slides to it (fully round on the first and last item, small corners in between); no slide with
 * reduced motion. Moved from the reports site's approved stand-in (Master KMO, 2026-11-07; spike #67 decision (b)).
 * Place it in a `MobileTabBarDock` to fix it to the bottom of the screen.
 */
export function MobileTabBar({ items, activeId, onSelect, ariaLabel = 'Main', className }: MobileTabBarProps) {
  const activeIndex = items.findIndex((item) => item.id === activeId);
  const slider =
    items.length > 0 ? ({ '--vs-tab-count': items.length, '--vs-tab-index': Math.max(activeIndex, 0) } as React.CSSProperties) : undefined;
  const edge = items.length > 0 && activeIndex >= 0 && (activeIndex === 0 || activeIndex === items.length - 1);
  return (
    <nav
      className={className ? `vs-tabbar ${className}` : 'vs-tabbar'}
      aria-label={ariaLabel}
      style={slider}
      data-edge={items.length > 0 ? String(edge) : undefined}
    >
      {activeIndex >= 0 && (
        <span className="vs-tabbar__slider" aria-hidden="true">
          <span />
        </span>
      )}
      {items.map((item) => {
        const active = item.id === activeId;
        const Icon = item.icon;
        const inner = (
          <>
            <Icon className="vs-tabbar__icon" strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
            <span>{item.label}</span>
          </>
        );
        return item.href ? (
          <a key={item.id} href={item.href} className="vs-tabbar__item" aria-current={active ? 'page' : undefined} onClick={() => onSelect?.(item.id)}>
            {inner}
          </a>
        ) : (
          <button key={item.id} type="button" className="vs-tabbar__item" aria-current={active ? 'page' : undefined} onClick={() => onSelect?.(item.id)}>
            {inner}
          </button>
        );
      })}
    </nav>
  );
}

/** Fixes its children (the tab bar, and e.g. a loading bar) to the bottom of the screen, clear of the home indicator. */
export function MobileTabBarDock({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className ? `vs-tabbar-dock ${className}` : 'vs-tabbar-dock'}>{children}</div>;
}
