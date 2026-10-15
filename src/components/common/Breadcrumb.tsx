import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getBreadcrumbPath, resolveIcon } from '../../config/navigationConfig';

export const Breadcrumb: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();
  const pathInfo = getBreadcrumbPath(activeTab);
  const IconComponent = resolveIcon(pathInfo.currentIcon);

  if (activeTab === 'dashboard') {
    return null; // Dashboard is home, no need for breadcrumb
  }

  return (
    <nav
      aria-label="Đường dẫn phân hệ"
      className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 overflow-x-auto no-scrollbar py-0.5"
    >
      {/* Home / Dashboard */}
      <button
        type="button"
        onClick={() => setActiveTab('dashboard')}
        className="inline-flex items-center gap-1 text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 font-medium transition cursor-pointer shrink-0"
        title="Quay lại Dashboard Tổng Quan"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Tổng Quan</span>
      </button>

      <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-600 shrink-0" aria-hidden="true" />

      {/* Group Name */}
      <span className="text-slate-600 dark:text-slate-400 font-medium shrink-0">
        {pathInfo.groupLabel}
      </span>

      {/* Parent Name (if sub-feature) */}
      {pathInfo.parentLabel && (
        <>
          <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-600 shrink-0" aria-hidden="true" />
          <span className="text-slate-600 dark:text-slate-400 font-medium shrink-0">
            {pathInfo.parentLabel}
          </span>
        </>
      )}

      <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-600 shrink-0" aria-hidden="true" />

      {/* Current Active Item */}
      <span className="font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5 shrink-0">
        <IconComponent className="w-3.5 h-3.5" />
        <span>{pathInfo.currentLabel}</span>
      </span>
    </nav>
  );
};
