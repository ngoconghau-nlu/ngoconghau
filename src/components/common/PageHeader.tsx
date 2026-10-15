import React from 'react';
import { resolveIcon } from '../../config/navigationConfig';

interface PageHeaderProps {
  title: string;
  description?: string;
  iconName?: string;
  badgeText?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  iconName,
  badgeText,
  actions
}) => {
  const IconComponent = iconName ? resolveIcon(iconName) : null;

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-200/80 dark:border-slate-800/80">
      <div className="flex items-start gap-3.5">
        {IconComponent && (
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5 shadow-2xs">
            <IconComponent className="w-5 h-5" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
            {badgeText && (
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-md border border-emerald-200/70 dark:border-emerald-800/70">
                {badgeText}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0 self-start md:self-center flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
};
