import React from 'react';
import { ArrowLeft, SlidersHorizontal, Calendar } from 'lucide-react';

interface MobilePageHeaderProps {
  title: string;
  onFilterClick?: () => void;
  filterActive?: boolean;
  showBack?: boolean;
  /** 'calendar' when the sheet is purely a day-range picker (7/30/90d); 'sliders' for any other filter. */
  filterIcon?: 'calendar' | 'sliders';
}

/**
 * Mobile-only page header: "[back icon] Title" on the left (~80% width),
 * an optional Filter icon on the right (~20% width) when the page has a
 * tab/segment control that collapses into a bottom sheet on mobile.
 * Desktop keeps each view's own existing header untouched.
 */
export function MobilePageHeader({
  title,
  onFilterClick,
  filterActive = false,
  showBack = true,
  filterIcon = 'sliders',
}: MobilePageHeaderProps) {
  const FilterIcon = filterIcon === 'calendar' ? Calendar : SlidersHorizontal;
  return (
    <div className="flex md:hidden items-center gap-2">
      <div className="flex items-center gap-1.5 min-w-0" style={{ width: onFilterClick ? '80%' : '100%' }}>
        {showBack && (
          <button
            type="button"
            onClick={() => window.history.back()}
            aria-label="Go back"
            className="shrink-0 w-8 h-8 -ml-1.5 rounded-full flex items-center justify-center text-gray-600 active:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-xl font-bold tracking-tight text-gray-900 truncate">{title}</h1>
      </div>

      {onFilterClick && (
        <div className="flex items-center justify-end shrink-0" style={{ width: '20%' }}>
          <button
            type="button"
            onClick={onFilterClick}
            aria-label="Filter"
            className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${
              filterActive ? 'text-white' : 'bg-white border-gray-200 text-gray-600 active:bg-gray-50'
            }`}
            style={
              filterActive
                ? { background: 'var(--vs-color-brand-primary)', borderColor: 'var(--vs-color-brand-primary)' }
                : undefined
            }
          >
            <FilterIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
