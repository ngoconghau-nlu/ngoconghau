import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Filter,
  RotateCcw,
  Search,
  X,
  Flag
} from 'lucide-react';
import { FilterAcademicYear, FilterActivityType, FilterSemester } from '../types';
import { ACADEMIC_YEARS, SEMESTERS, ACTIVITY_TYPES } from '../utils/filterUtils';

export interface DataFilterToolbarProps {
  academicYear: FilterAcademicYear;
  onAcademicYearChange: (year: string) => void;
  semester: FilterSemester;
  onSemesterChange: (sem: FilterSemester) => void;
  activityType: FilterActivityType;
  onActivityTypeChange: (type: FilterActivityType) => void;

  // Search input (optional)
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  searchPlaceholder?: string;

  // Counts and labeling (optional)
  totalCount?: number;
  filteredCount?: number;
  itemName?: string;
  title?: string;

  // Custom additional filter elements
  children?: React.ReactNode;
  extraActions?: React.ReactNode;
  compact?: boolean;
}

export const DataFilterToolbar: React.FC<DataFilterToolbarProps> = ({
  academicYear,
  onAcademicYearChange,
  semester,
  onSemesterChange,
  activityType,
  onActivityTypeChange,
  searchTerm = '',
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm dữ liệu...',
  totalCount,
  filteredCount,
  itemName = 'kết quả',
  title,
  children,
  extraActions,
  compact = false,
}) => {
  // Local immediate search term for buttery-smooth typing feedback
  const [localSearch, setLocalSearch] = useState(searchTerm);

  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    if (!onSearchChange) return;
    const timer = setTimeout(() => {
      if (localSearch !== searchTerm) {
        onSearchChange(localSearch);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [localSearch, searchTerm, onSearchChange]);

  const isFiltered =
    academicYear !== 'ALL' ||
    semester !== 'ALL' ||
    activityType !== 'ALL' ||
    Boolean(localSearch && localSearch.trim() !== '');

  const handleReset = () => {
    onAcademicYearChange('ALL');
    onSemesterChange('ALL');
    onActivityTypeChange('ALL');
    setLocalSearch('');
    if (onSearchChange) onSearchChange('');
  };

  const selectedSemester = SEMESTERS.find(s => s.value === semester);
  const selectedActivityType = ACTIVITY_TYPES.find(t => t.value === activityType);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-4 space-y-3 transition-colors">
      {/* Top Header / Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-center shrink-0">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>{title || 'Bộ Lọc Dữ Liệu Đa Chiều'}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                (Học kỳ · Năm học · Loại hình)
              </span>
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {totalCount !== undefined && (
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Hiển thị <span className="font-bold text-emerald-600 dark:text-emerald-400">{filteredCount ?? totalCount}</span> / {totalCount} {itemName}
            </span>
          )}

          {isFiltered && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-800 rounded-lg transition cursor-pointer"
              title="Đặt lại toàn bộ bộ lọc về mặc định"
            >
              <RotateCcw className="w-3 h-3" />
              Đặt lại
            </button>
          )}

          {extraActions}
        </div>
      </div>

      {/* Main Filter Controls Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${compact ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-3`}>
        {/* Search input (if enabled) */}
        {onSearchChange && (
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              className="w-full pl-8 pr-7 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden transition"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch('');
                  onSearchChange('');
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* 1. Năm học (Academic Year) */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Năm Học
          </label>
          <div className="relative">
            <select
              value={academicYear}
              onChange={e => onAcademicYearChange(e.target.value)}
              className={`w-full px-3 py-2 text-xs rounded-xl border appearance-none font-semibold transition focus:ring-2 focus:ring-emerald-500 focus:outline-hidden pr-8 cursor-pointer ${
                academicYear !== 'ALL'
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              {ACADEMIC_YEARS.map(y => (
                <option key={y.value} value={y.value}>
                  {y.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* 2. Học kỳ (Semester) */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            Học Kỳ
          </label>
          <div className="relative">
            <select
              value={semester}
              onChange={e => onSemesterChange(e.target.value as FilterSemester)}
              className={`w-full px-3 py-2 text-xs rounded-xl border appearance-none font-semibold transition focus:ring-2 focus:ring-emerald-500 focus:outline-hidden pr-8 cursor-pointer ${
                semester !== 'ALL'
                  ? 'bg-blue-50/70 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200 font-bold'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              {SEMESTERS.map(s => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* 3. Loại hình hoạt động (Đoàn / Hội) */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
            <Flag className="w-3 h-3 text-red-600 dark:text-rose-400" />
            Loại Hình (Đoàn / Hội)
          </label>
          <div className="relative">
            <select
              value={activityType}
              onChange={e => onActivityTypeChange(e.target.value as FilterActivityType)}
              className={`w-full px-3 py-2 text-xs rounded-xl border appearance-none font-semibold transition focus:ring-2 focus:ring-emerald-500 focus:outline-hidden pr-8 cursor-pointer ${
                activityType !== 'ALL'
                  ? 'bg-purple-50/70 dark:bg-purple-950/60 border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-200 font-bold'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              {ACTIVITY_TYPES.map(t => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* Custom child filters (e.g. status, faculties, classes) */}
        {children}
      </div>

      {/* Active Filter Tags Bar (Quick Remove Chips) */}
      {isFiltered && (
        <div className="pt-2 flex items-center gap-2 flex-wrap text-[11px]">
          <span className="text-slate-400 dark:text-slate-500 font-medium">Đang lọc theo:</span>

          {academicYear !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 font-medium">
              <span>Năm: {academicYear}</span>
              <button
                type="button"
                onClick={() => onAcademicYearChange('ALL')}
                className="hover:text-emerald-950 dark:hover:text-white ml-0.5 cursor-pointer"
                title="Bỏ lọc năm học"
              >
                ×
              </button>
            </span>
          )}

          {semester !== 'ALL' && selectedSemester && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 font-medium">
              <span>{selectedSemester.shortLabel}</span>
              <button
                type="button"
                onClick={() => onSemesterChange('ALL')}
                className="hover:text-blue-950 dark:hover:text-white ml-0.5 cursor-pointer"
                title="Bỏ lọc học kỳ"
              >
                ×
              </button>
            </span>
          )}

          {activityType !== 'ALL' && selectedActivityType && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800 font-medium">
              <span>{selectedActivityType.shortLabel}</span>
              <button
                type="button"
                onClick={() => onActivityTypeChange('ALL')}
                className="hover:text-purple-950 dark:hover:text-white ml-0.5 cursor-pointer"
                title="Bỏ lọc loại hình"
              >
                ×
              </button>
            </span>
          )}

          {localSearch && localSearch.trim() !== '' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
              <span>Từ khóa: "{localSearch}"</span>
              <button
                type="button"
                onClick={() => {
                  setLocalSearch('');
                  if (onSearchChange) onSearchChange('');
                }}
                className="hover:text-slate-900 dark:hover:text-white ml-0.5 cursor-pointer"
                title="Bỏ tìm kiếm"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
