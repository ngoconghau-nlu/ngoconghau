import React from 'react';
import { useApp } from '../../context/AppContext';
import { resolveIcon, getBreadcrumbPath } from '../../config/navigationConfig';
import { ExternalLink } from 'lucide-react';

export const PageHeader: React.FC = () => {
  const { activeTab, setActiveTab, user } = useApp();
  const userRoleLevel = user?.currentRole?.roleLevel ?? 0;

  // Find active canonical navigation item or sub-item
  const breadcrumb = getBreadcrumbPath(activeTab);
  const IconComponent = resolveIcon(breadcrumb.currentIcon);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-2xs transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Module Title & Description */}
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 text-white flex items-center justify-center shrink-0 shadow-xs ring-2 ring-emerald-500/20">
            <IconComponent className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                {breadcrumb.groupLabel}
              </span>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                {breadcrumb.currentLabel}
              </h1>
            </div>

            {breadcrumb.description && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed max-w-4xl">
                {breadcrumb.description}
              </p>
            )}
          </div>
        </div>

        {/* Dynamic Contextual Quick Action Bar */}
        <div className="flex items-center gap-2 flex-wrap shrink-0 self-start md:self-center">
          {(activeTab === 'score-roster' || activeTab === 'faculty-emulation' || activeTab === 'branch-emulation' || activeTab === 'club-emulation') && userRoleLevel >= 1 && (
            <button
              type="button"
              onClick={() => setActiveTab('student-portal')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer min-h-[34px] active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-100" />
              <span>Xem Cổng Sinh Viên</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
