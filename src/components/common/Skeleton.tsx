import React, { useEffect, useState } from 'react';

/**
 * Base Skeleton component with premium shimmer wave animation.
 */
interface SkeletonProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'none';
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  rounded = 'lg',
  width,
  height,
  style,
}) => {
  const roundedClass =
    rounded === 'full'
      ? 'rounded-full'
      : rounded === '2xl'
      ? 'rounded-2xl'
      : rounded === 'xl'
      ? 'rounded-xl'
      : rounded === 'lg'
      ? 'rounded-lg'
      : rounded === 'md'
      ? 'rounded-md'
      : rounded === 'sm'
      ? 'rounded-sm'
      : '';

  return (
    <div
      className={`skeleton-shimmer ${roundedClass} ${className}`}
      style={{
        width,
        height,
        ...style,
      }}
      aria-hidden="true"
    />
  );
};

/**
 * Skeleton lines for typography mimicking headings or paragraphs.
 */
export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
  lineHeight?: string;
}> = ({ lines = 2, className = '', lineHeight = 'h-3.5' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, idx) => {
        // Vary line widths for authentic content feel
        const widthClass =
          idx === 0
            ? 'w-full'
            : idx === lines - 1
            ? 'w-3/5'
            : idx % 2 === 0
            ? 'w-4/5'
            : 'w-11/12';
        return (
          <Skeleton
            key={idx}
            className={`${lineHeight} ${widthClass}`}
            rounded="md"
          />
        );
      })}
    </div>
  );
};

/**
 * Skeleton Metric Counter Card
 * Mimics high-visibility KPI and statistics cards.
 */
interface SkeletonMetricCardProps {
  variant?: 'emerald' | 'amber' | 'slate' | 'rose' | 'teal' | 'purple';
  hasBadge?: boolean;
  className?: string;
}

export const SkeletonMetricCard: React.FC<SkeletonMetricCardProps> = ({
  variant = 'slate',
  hasBadge = true,
  className = '',
}) => {
  const borderBg =
    variant === 'emerald'
      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-800/50'
      : variant === 'amber'
      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-800/50'
      : variant === 'rose'
      ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/70 dark:border-rose-800/50'
      : variant === 'teal'
      ? 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-200/70 dark:border-teal-800/50'
      : variant === 'purple'
      ? 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-200/70 dark:border-purple-800/50'
      : 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/80 dark:border-slate-800/70';

  return (
    <div
      className={`border rounded-xl p-4 flex flex-col justify-between ${borderBg} ${className} transition-all`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          {/* Label placeholder */}
          <Skeleton className="h-3 w-24 sm:w-28" rounded="sm" />
          {/* Counter big number placeholder */}
          <div className="flex items-baseline gap-2 pt-1">
            <Skeleton className="h-8 sm:h-9 w-16 sm:w-20" rounded="md" />
            {hasBadge && (
              <Skeleton className="h-5 w-10" rounded="md" />
            )}
          </div>
        </div>
        {/* Icon box placeholder */}
        <Skeleton className="w-10 h-10 shrink-0" rounded="xl" />
      </div>

      {/* Card footer detail placeholder */}
      <div className="mt-3 pt-2.5 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
        <Skeleton className="h-3 w-20" rounded="sm" />
        <Skeleton className="h-3 w-16" rounded="sm" />
      </div>
    </div>
  );
};

/**
 * Skeleton Table Rows
 * Renders shimmering placeholder table rows matching standard data grids.
 */
interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 5,
  className = '',
}) => {
  return (
    <div className={`w-full overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 ${className}`}>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div
          key={rIdx}
          className="flex items-center gap-4 px-4 py-3.5 animate-skeleton-pulse"
        >
          {Array.from({ length: columns }).map((_, cIdx) => {
            const isFirst = cIdx === 0;
            const isLast = cIdx === columns - 1;
            const widthClass = isFirst
              ? 'w-1/4'
              : isLast
              ? 'w-20'
              : cIdx % 2 === 0
              ? 'w-1/6'
              : 'w-1/5';

            return (
              <div key={cIdx} className={`flex items-center gap-2 ${widthClass}`}>
                {isFirst && (
                  <Skeleton className="w-7 h-7 shrink-0" rounded="lg" />
                )}
                <Skeleton
                  className={`h-4 ${isFirst ? 'w-3/4' : 'w-full'}`}
                  rounded="md"
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/**
 * Animated Counter Component
 * Smoothly counts up from 0 to value with easing when data is loaded from Firestore.
 */
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  formatter?: (val: number) => string;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 800,
  formatter,
  className = '',
  prefix = '',
  suffix = '',
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = 0;
    const targetValue = value;

    if (targetValue === 0) {
      setDisplayValue(0);
      return;
    }

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing out cubic: 1 - Math.pow(1 - progress, 3)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + (targetValue - startValue) * easeProgress);

      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(targetValue);
      }
    };

    const animFrame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animFrame);
  }, [value, duration]);

  const formatted = formatter
    ? formatter(displayValue)
    : displayValue.toLocaleString('vi-VN');

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};
