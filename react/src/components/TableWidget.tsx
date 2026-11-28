import React from 'react';
import { SegmentedControl } from './SegmentedControl';

export type TableColumnAlign = 'left' | 'center' | 'right';

export interface TableColumn<T> {
  label: string;
  value: (row: T, index: number) => React.ReactNode;
  strong?: boolean;
  /** Title and cells share this alignment. Default and fallback: 'right'. */
  align?: TableColumnAlign;
}

const ALIGN_CLASS: Record<TableColumnAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

function alignClass(align: TableColumn<unknown>['align']): string {
  return (align && ALIGN_CLASS[align]) || ALIGN_CLASS.right;
}

/** A usable first rank: a whole number of 1 or more. Anything else counts from 1. */
function safeStartRank(startRank: number | undefined): number {
  return typeof startRank === 'number' && Number.isInteger(startRank) && startRank >= 1 ? startRank : 1;
}

export interface TableTab {
  id: string;
  label: string;
}

export interface TableWidgetProps<T> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  tabs?: TableTab[];
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  itemLabel?: string;
  renderItem: (row: T, index: number) => React.ReactNode;
  columns: TableColumn<T>[];
  rows: T[] | null | undefined;
  rowKey?: (row: T, index: number) => string | number;
  emptyLabel?: string;
  bare?: boolean;
  /** Number shown for the first row, so ranks continue across pages. Default 1. */
  startRank?: number;
  /** Show the "#" rank column. Default true. */
  showRank?: boolean;
  /** True for a partial or incomplete row: it is drawn in italic (same text colour, so it stays readable). */
  rowMuted?: (row: T, index: number) => boolean;
  /**
   * Makes the sideways-scrolling area reachable with the keyboard: it becomes a focusable region with this accessible name
   * (for example "Weekly numbers table, scrolls sideways"). Without it the markup is unchanged.
   */
  scrollLabel?: string;
}

export function TableWidget<T>({
  title,
  subtitle,
  tabs,
  activeTabId,
  onTabChange,
  itemLabel = 'Item',
  renderItem,
  columns,
  rows,
  rowKey,
  emptyLabel = 'No data available',
  bare = false,
  startRank,
  showRank = true,
  rowMuted,
  scrollLabel,
}: TableWidgetProps<T>) {
  const firstRank = safeStartRank(startRank);
  return (
    <div
      className={
        bare
          ? 'vs-table-card vs-table-card--bare'
          : 'vs-table-card bg-white rounded-xl border border-gray-200 overflow-hidden'
      }
    >
      {(title || subtitle || (tabs && tabs.length > 0)) && (
        <div className="vs-table-card-head px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title && (
              <h3 className="vs-table-card-title text-gray-900 text-base font-semibold">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="vs-table-card-subtitle text-gray-500 text-sm mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {tabs && tabs.length > 0 && (
            <SegmentedControl
              tabs={tabs}
              activeId={activeTabId ?? ''}
              onChange={(id) => onTabChange && onTabChange(id)}
              size="sm"
              className="shrink-0"
            />
          )}
        </div>
      )}
      <div
        className={scrollLabel ? 'overflow-x-auto vs-table-scroll' : 'overflow-x-auto'}
        {...(scrollLabel ? { tabIndex: 0, role: 'region', 'aria-label': scrollLabel } : {})}
      >
        <table className="vs-table w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50">
              {showRank && (
                <th className="py-3 px-5 font-semibold text-gray-700 uppercase tracking-wider text-xs w-10">
                  #
                </th>
              )}
              <th className="py-3 px-5 font-semibold text-gray-700 uppercase tracking-wider text-xs">
                {itemLabel}
              </th>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`py-3 px-5 ${alignClass(col.align)} font-semibold text-gray-700 uppercase tracking-wider text-xs whitespace-nowrap`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows && rows.length > 0 ? (
              rows.map((row, i) => (
                <tr
                  key={rowKey ? rowKey(row, i) : i}
                  className={`hover:bg-gray-50/60 transition-colors${
                    rowMuted && rowMuted(row, i) ? ' vs-table-row--muted' : ''
                  }`}
                >
                  {showRank && (
                    <td className="py-3 px-5 text-gray-500 text-sm tabular-nums">
                      {firstRank + i}
                    </td>
                  )}
                  <td className="py-3 px-5 text-gray-900 font-medium">
                    {renderItem(row, i)}
                  </td>
                  {columns.map((col, j) => (
                    <td
                      key={j}
                      className={`py-3 px-5 ${alignClass(col.align)} text-sm tabular-nums ${
                        col.strong ? 'font-semibold text-gray-900' : 'text-gray-600'
                      }`}
                    >
                      {col.value(row, i)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={(showRank ? 2 : 1) + columns.length}
                  className="text-center text-gray-400 py-8 text-sm"
                >
                  {emptyLabel}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
