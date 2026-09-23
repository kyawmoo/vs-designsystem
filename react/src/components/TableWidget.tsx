import React from 'react';

export interface TableColumn<T> {
  label: string;
  value: (row: T, index: number) => React.ReactNode;
  strong?: boolean;
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
}: TableWidgetProps<T>) {
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
            <div className="vs-segment-control shrink-0">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onTabChange && onTabChange(t.id)}
                  className={`vs-segment-button vs-segment-button--sm ${
                    activeTabId === t.id ? 'is-active' : ''
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="vs-table w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50">
              <th className="py-3 px-5 font-semibold text-gray-700 uppercase tracking-wider text-xs w-10">
                #
              </th>
              <th className="py-3 px-5 font-semibold text-gray-700 uppercase tracking-wider text-xs">
                {itemLabel}
              </th>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className="py-3 px-5 text-right font-semibold text-gray-700 uppercase tracking-wider text-xs whitespace-nowrap"
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
                  className="hover:bg-gray-50/60 transition-colors"
                >
                  <td className="py-3 px-5 text-gray-500 text-sm tabular-nums">
                    {i + 1}
                  </td>
                  <td className="py-3 px-5 text-gray-900 font-medium">
                    {renderItem(row, i)}
                  </td>
                  {columns.map((col, j) => (
                    <td
                      key={j}
                      className={`py-3 px-5 text-right text-sm tabular-nums ${
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
                  colSpan={2 + columns.length}
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
