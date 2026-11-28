import React from 'react';
import { ArrowLeft, SlidersHorizontal, Calendar } from 'lucide-react';

export interface MobilePageHeaderProps {
  title: string;
  onFilterClick?: () => void;
  filterActive?: boolean;
  /** Pages opened from a menu or a list show a back arrow (and a smaller title). Default true. */
  showBack?: boolean;
  /** 'calendar' when the sheet is purely a day-range picker (7/30/90d); 'sliders' for any other filter. */
  filterIcon?: 'calendar' | 'sliders';
  /** A control on the right of the title on the same row, for example a `DateRangeSelector`; the filter button sits after it. */
  trailing?: React.ReactNode;
  /** What the back arrow does (issue #145). Default: the browser's back; a full-screen panel passes its close. */
  onBack?: () => void;
}

/**
 * Mobile-only page header (hidden from 768px up; each view keeps its own desktop header), from the approved phone canvas
 * (Master KMO, 2026-11-08; moved into the DS 2026-11-28, decision 1a). Tab pages (no back arrow): a 28px title. Pages opened
 * from a menu or a list: a round 44px back button and a 20px title. An optional control (`trailing`) and a round 44px filter
 * button sit on the same row; the active filter is dark.
 */
export function MobilePageHeader({
  title,
  onFilterClick,
  filterActive = false,
  showBack = true,
  filterIcon = 'sliders',
  trailing,
  onBack,
}: MobilePageHeaderProps) {
  const FilterIcon = filterIcon === 'calendar' ? Calendar : SlidersHorizontal;
  return (
    <div className="vs-page-head-wrap">
      <header className={showBack ? 'vs-page-head vs-page-head--sub' : 'vs-page-head'}>
        {showBack && (
          <button type="button" className="vs-page-head__icon" onClick={onBack ?? (() => window.history.back())} aria-label="Go back">
            <ArrowLeft width={22} height={22} aria-hidden="true" />
          </button>
        )}
        <h1 className="vs-page-head__title">{title}</h1>
        {trailing}
        {onFilterClick && (
          <button
            type="button"
            className={filterActive ? 'vs-page-head__icon vs-page-head__icon--active' : 'vs-page-head__icon'}
            onClick={onFilterClick}
            aria-label="Filter"
            aria-pressed={filterActive}
          >
            <FilterIcon width={20} height={20} aria-hidden="true" />
          </button>
        )}
      </header>
    </div>
  );
}
