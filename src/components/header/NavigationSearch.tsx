import React, { useState, useEffect, useRef } from 'react';
import { Search, X, CornerDownLeft } from 'lucide-react';
import { getEffectiveNavItems, resolveIcon } from '../../config/navigationConfig';
import { useApp } from '../../context/AppContext';
import { searchMatches } from '../../utils/textUtils';

interface NavigationSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tabId: string) => void;
}

interface SearchResultItem {
  id: string;
  targetTab: string;
  label: string;
  groupLabel: string;
  badge: string;
  badgeColor?: string;
  description: string;
  iconName: string;
  isSubItem?: boolean;
}

export const NavigationSearch: React.FC<NavigationSearchProps> = ({ isOpen, onClose, onSelectTab }) => {
  const { user, customNavItems } = useApp();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const userRoleLevel = user.currentRole.roleLevel ?? 0;

  // Single source of truth: Flatten items strictly from effective active menu configuration
  const allSearchableItems: SearchResultItem[] = React.useMemo(() => {
    const effectiveItems = getEffectiveNavItems(customNavItems, userRoleLevel);
    const list: SearchResultItem[] = [];

    effectiveItems.forEach(item => {
      list.push({
        id: item.id,
        targetTab: item.id,
        label: item.label,
        groupLabel: item.groupLabel,
        badge: item.badge,
        badgeColor: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300',
        description: item.description,
        iconName: item.iconName,
        isSubItem: false
      });

      if (item.subItems && item.subItems.length > 0) {
        item.subItems.forEach(sub => {
          list.push({
            id: `${item.id}-${sub.id}`,
            targetTab: sub.targetTab,
            label: `${sub.label} (${item.shortLabel || item.label})`,
            groupLabel: item.groupLabel,
            badge: sub.badge || 'Phân hệ con',
            badgeColor: sub.badgeColor,
            description: sub.subLabel || item.description,
            iconName: sub.iconName,
            isSubItem: true
          });
        });
      }
    });

    return list;
  }, [customNavItems, userRoleLevel]);

  // Filter items using accent-insensitive Vietnamese fuzzy matching
  const filteredResults = React.useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      // Default recommended results (top 6)
      return allSearchableItems.slice(0, 6);
    }
    return allSearchableItems.filter(item => {
      return (
        searchMatches(item.label, trimmed) ||
        searchMatches(item.description, trimmed) ||
        searchMatches(item.groupLabel, trimmed) ||
        searchMatches(item.badge, trimmed)
      );
    });
  }, [query, allSearchableItems]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation (ArrowDown, ArrowUp, Enter, Escape)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelect(filteredResults[selectedIndex].targetTab);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleSelect = (targetTab: string) => {
    onSelectTab(targetTab);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 ring-1 ring-black/5 dark:ring-white/10 overflow-hidden flex flex-col max-h-[80vh] z-10 animate-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Tìm kiếm phân hệ, hoạt động, điểm rèn luyện, QR..."
            className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-xs">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100/50 dark:divide-slate-800/50">
          {filteredResults.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 space-y-1">
              <Search className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold">Không tìm thấy chức năng phù hợp</p>
              <p className="text-xs">Hãy thử từ khóa như "hoạt động", "điểm rèn luyện", "chỉ tiêu", "QR"...</p>
            </div>
          ) : (
            filteredResults.map((item, idx) => {
              const IconComp = resolveIcon(item.iconName);
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.targetTab)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/60 text-slate-900 dark:text-white ring-1 ring-emerald-500/30'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-emerald-900 dark:text-emerald-200' : ''}`}>
                          {item.label}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                          • {item.groupLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-normal">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[9.5px] px-2 py-0.5 rounded-md font-mono font-bold ${
                        item.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[9px] font-mono">↑↓</kbd> Di chuyển
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[9px] font-mono">↵</kbd> Truy cập
            </span>
          </div>
          <span>Tìm kiếm điều hướng NLU Youth 2026</span>
        </div>
      </div>
    </div>
  );
};
