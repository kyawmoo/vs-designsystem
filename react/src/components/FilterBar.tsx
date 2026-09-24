import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Tabs, TabItem } from './Tabs';

export interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  tabs?: TabItem[];
  activeTabId?: string;
  onTabChange?: (id: string) => void;
  sortLabel?: string;
  id?: string;
  className?: string;
}

/**
 * The reports dashboard's own search + sort bar — a bordered white
 * card holding a search field and a segment-control sort group.
 * Formalizes the pattern already duplicated across ItemsView and
 * CategoryView (both: `bg-white rounded-xl border ... p-4` container,
 * `bg-gray-50` search input focusing to #005c55). React-only: this is
 * the reports dashboard's own convention, not derived from any real
 * main-site markup, so there is no Blade counterpart — same treatment
 * as SummaryCard/TableWidget/FilterSheet.
 */
export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  tabs,
  activeTabId,
  onTabChange,
  sortLabel = 'Sort:',
  id,
  className,
}: FilterBarProps) {
  return (
    <div id={id} className={className ? `vs-filter-bar ${className}` : 'vs-filter-bar'}>
      <div className="vs-filter-bar-search">
        <Search size={16} strokeWidth={2} />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="vs-filter-bar-input"
        />
      </div>

      {tabs && tabs.length > 0 && (
        <div className="vs-filter-bar-sort">
          <span className="vs-filter-bar-sort-label">
            <Filter size={14} strokeWidth={2} />
            {sortLabel}
          </span>
          <Tabs tabs={tabs} activeId={activeTabId ?? ''} onChange={onTabChange ?? (() => {})} size="sm" />
        </div>
      )}
    </div>
  );
}
