import React from 'react';
import { Check, X } from 'lucide-react';

export interface FilterOption {
  id: string;
  label: string;
}

export interface FilterGroup {
  title?: string;
  options: FilterOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  groups: FilterGroup[];
}

/**
 * Mobile-only bottom sheet that replaces a `vs-segment-control` tab row.
 * Supports one or more option groups (e.g. Feedback needs both a day-range
 * group and an All/Favourites group in the same sheet).
 */
export function FilterSheet({ open, onClose, title, groups }: FilterSheetProps) {
  return (
    <div
      className={`fixed inset-0 z-50 md:hidden overflow-hidden ${open ? '' : 'invisible pointer-events-none'}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`absolute bottom-0 inset-x-0 bg-white rounded-t-2xl shadow-2xl transition-transform duration-200 max-h-[80vh] overflow-y-auto ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex items-center justify-center pt-2.5 pb-1 sticky top-0 bg-white">
          <span className="w-10 h-1 rounded-full bg-gray-300" />
        </div>
        <div className="px-5 pt-2 pb-1 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 -mr-1 flex items-center justify-center rounded-full text-gray-400 active:bg-gray-100 active:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-1">
          {groups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-3 pt-3 border-t border-gray-100' : ''}>
              {group.title && (
                <p className="px-3.5 pb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  {group.title}
                </p>
              )}
              {group.options.map((opt) => {
                const active = opt.id === group.selectedId;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      group.onSelect(opt.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left text-sm font-semibold cursor-pointer ${
                      active ? '' : 'text-gray-700 active:bg-gray-50'
                    }`}
                    style={
                      active
                        ? { background: 'var(--vs-color-success-bg)', color: 'var(--vs-color-brand-primary)' }
                        : undefined
                    }
                  >
                    {opt.label}
                    {active && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
