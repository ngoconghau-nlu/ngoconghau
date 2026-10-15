import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ActivitySubmission, ActivityStatus } from '../types';
import { getActivityType } from '../utils/filterUtils';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  Building,
  Award,
  Sparkles,
  ExternalLink,
  Search,
  Filter,
  Layers,
  FileCheck,
  CalendarDays,
  List,
  MapPin,
  CalendarCheck,
  ArrowRight,
  X,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';

export const DashboardCalendarView: React.FC = () => {
  const { activities, user, organizations, setActiveTab, academicYear } = useApp();

  // Hidden by default per user specification
  const [isVisible, setIsVisible] = useState<boolean>(false);

  // Reference date: October 2026 (matching system context 2026-10-06)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(9); // 0-indexed: 9 = October
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');

  // Filters
  const [filterOrg, setFilterOrg] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<'ALL' | 'DOAN' | 'HOI' | 'DOAN_HOI'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'Approved' | 'Pending'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected date or activity for drawer / detail modal
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>('2026-10-15');
  const [selectedActivity, setSelectedActivity] = useState<ActivitySubmission | null>(null);

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const daysOfWeek = [
    { key: 't2', label: 'Thứ 2', short: 'T2' },
    { key: 't3', label: 'Thứ 3', short: 'T3' },
    { key: 't4', label: 'Thứ 4', short: 'T4' },
    { key: 't5', label: 'Thứ 5', short: 'T5' },
    { key: 't6', label: 'Thứ 6', short: 'T6' },
    { key: 't7', label: 'Thứ 7', short: 'T7' },
    { key: 'cn', label: 'Chủ Nhật', short: 'CN' }
  ];

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonthIndex(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonthIndex(prev => prev + 1);
    }
  };

  const handleToday = () => {
    setCurrentYear(2026);
    setCurrentMonthIndex(9); // October
    setSelectedDateStr('2026-10-06');
  };

  // Role scoping of activities
  const roleScopedActivities = useMemo(() => {
    const roleLevel = user.currentRole.roleLevel;
    const orgCode = user.currentRole.orgCode;
    const classCode = user.currentRole.classCode;

    if (roleLevel >= 4) return activities;
    if (roleLevel === 3) {
      return activities.filter(
        a => a.orgCode === orgCode || a.branchClass?.startsWith(orgCode || '')
      );
    }
    if (roleLevel === 2) {
      return activities.filter(
        a => a.orgCode === orgCode || (classCode && a.branchClass === classCode)
      );
    }
    return activities.filter(
      a => a.status === 'Approved' || (classCode && a.branchClass === classCode)
    );
  }, [activities, user]);

  // Filter activities for the selected month
  const monthActivities = useMemo(() => {
    const monthNum = currentMonthIndex + 1; // 1-12
    const monthStr = String(monthNum).padStart(2, '0');
    const yearStr = String(currentYear);

    return roleScopedActivities.filter(act => {
      // Date matching
      let actDate = act.startDate || act.createdAt || '';
      if (!actDate.startsWith(`${yearStr}-${monthStr}`)) {
        // Check if endDate covers this month
        if (act.endDate && act.endDate.startsWith(`${yearStr}-${monthStr}`)) {
          // Included
        } else {
          return false;
        }
      }

      // Filter by Org
      if (filterOrg !== 'ALL' && act.orgCode !== filterOrg) return false;

      // Filter by Type
      if (filterType !== 'ALL') {
        const type = getActivityType(act);
        if (type !== filterType && type !== 'DOAN_HOI') return false;
      }

      // Filter by Status
      if (filterStatus === 'Approved' && act.status !== 'Approved') return false;
      if (filterStatus === 'Pending' && !act.status.startsWith('Pending')) return false;

      // Filter by Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = act.title.toLowerCase().includes(q);
        const matchId = act.id.toLowerCase().includes(q);
        const matchOrg = act.orgName.toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchOrg) return false;
      }

      return true;
    });
  }, [roleScopedActivities, currentYear, currentMonthIndex, filterOrg, filterType, filterStatus, searchQuery]);

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    const total = monthActivities.length;
    const approved = monthActivities.filter(a => a.status === 'Approved').length;
    const pending = monthActivities.filter(a => a.status.startsWith('Pending')).length;
    const certNeeded = monthActivities.filter(a => a.needsCertificate).length;
    return { total, approved, pending, certNeeded };
  }, [monthActivities]);

  // Map activities by day number: { "2026-10-15": [act1, act2], ... }
  const activitiesByDate = useMemo(() => {
    const map: Record<string, ActivitySubmission[]> = {};

    monthActivities.forEach(act => {
      const dateKey = act.startDate || act.createdAt;
      if (dateKey) {
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(act);
      }
    });

    return map;
  }, [monthActivities]);

  // Calendar cells generation (Monday-based: T2=0, CN=6)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonthIndex, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonthIndex + 1, 0);

    // Day of week: 0 is Sunday, 1 is Monday... In Monday-based: Mon=0, Sun=6
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInMonth = lastDayOfMonth.getDate();

    const days = [];

    // Previous month padding days
    const prevMonthLastDay = new Date(currentYear, currentMonthIndex, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevMonth = currentMonthIndex === 0 ? 12 : currentMonthIndex;
      const prevYear = currentMonthIndex === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dayNum,
        dateStr,
        isCurrentMonth: false,
        isToday: false,
        activities: []
      });
    }

    // Current month days
    const todayStr = '2026-10-06'; // Target current date in simulated context
    for (let i = 1; i <= daysInMonth; i++) {
      const monthStr = String(currentMonthIndex + 1).padStart(2, '0');
      const dayStr = String(i).padStart(2, '0');
      const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
      const dayActs = activitiesByDate[dateStr] || [];

      days.push({
        dayNum: i,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        activities: dayActs
      });
    }

    // Next month padding days to complete standard 35 or 42 grid cells
    const remainingCells = (7 - (days.length % 7)) % 7;
    const nextMonth = currentMonthIndex === 11 ? 1 : currentMonthIndex + 2;
    const nextYear = currentMonthIndex === 11 ? currentYear + 1 : currentYear;

    for (let i = 1; i <= remainingCells; i++) {
      const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dayNum: i,
        dateStr,
        isCurrentMonth: false,
        isToday: false,
        activities: []
      });
    }

    return days;
  }, [currentYear, currentMonthIndex, activitiesByDate]);

  // Selected date's activities for detail pane
  const selectedDateActivities = useMemo(() => {
    if (!selectedDateStr) return [];
    return monthActivities.filter(a => (a.startDate === selectedDateStr || a.createdAt === selectedDateStr));
  }, [selectedDateStr, monthActivities]);

  // Get status badge colors
  const getStatusBadge = (status: ActivityStatus) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã duyệt
          </span>
        );
      case 'Pending_L3':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" /> Chờ Đoàn Khoa
          </span>
        );
      case 'Pending_L4':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-300">
            <Clock className="w-3 h-3 text-orange-600" /> Chờ Đoàn Trường
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-600" /> Từ chối
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const getTypeStyle = (act: ActivitySubmission) => {
    const type = getActivityType(act);
    if (type === 'DOAN') {
      return {
        bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-900',
        dot: 'bg-blue-600',
        tag: 'Đoàn TN'
      };
    }
    if (type === 'HOI') {
      return {
        bg: 'bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-900',
        dot: 'bg-teal-600',
        tag: 'Hội SV'
      };
    }
    return {
      bg: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-900',
      dot: 'bg-purple-600',
      tag: 'Đoàn - Hội'
    };
  };

  if (!isVisible) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-all hover:border-emerald-300 dark:hover:border-emerald-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-center shrink-0">
              <CalendarIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base tracking-tight">
                  Lịch Hoạt Động Đoàn - Hội
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {academicYear}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsVisible(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
          >
            <CalendarDays className="w-4 h-4" />
            <span>Xem lịch hoạt động</span>
            <ChevronDown className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-all">
      {/* Top Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
              <CalendarIcon className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Lịch Hoạt Động Đoàn - Hội
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {academicYear}
                </span>
              </h3>
            </div>
          </div>
        </div>

        {/* Month Navigation Controls, View Mode Toggle & Hide Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Month Navigator */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-3 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap min-w-[130px] text-center">
              {monthNames[currentMonthIndex]} {currentYear}
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Today Button */}
          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
            title="Quay về tháng hiện tại (Tháng 10/2026)"
          >
            Hôm nay
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Lưới Tháng
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Tiến Độ Mốc
            </button>
          </div>

          {/* Collapse/Hide Button */}
          <button
            type="button"
            onClick={() => setIsVisible(false)}
            className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0"
            title="Thu gọn lịch hoạt động"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Thu gọn</span>
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Monthly KPI Progress Strip */}
      <div className="bg-slate-50/70 border-b border-slate-200 px-5 py-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 font-medium">Hoạt động trong tháng</span>
              <p className="text-lg font-black text-slate-900 mt-0.5">{monthlyStats.total}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-emerald-700 font-medium">Đã phê duyệt chính thức</span>
              <p className="text-lg font-black text-emerald-800 mt-0.5">{monthlyStats.approved}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-amber-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-amber-700 font-medium">Đang chờ thẩm định</span>
              <p className="text-lg font-black text-amber-800 mt-0.5">{monthlyStats.pending}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-purple-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-purple-700 font-medium">Có nhu cầu cấp GCN</span>
              <p className="text-lg font-black text-purple-800 mt-0.5">{monthlyStats.certNeeded}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Quick Search Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm sự kiện trong tháng..."
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter by Type */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="ALL">Tất cả loại hình</option>
            <option value="DOAN">Đoàn Thanh niên</option>
            <option value="HOI">Hội Sinh viên</option>
            <option value="DOAN_HOI">Liên tịch Đoàn - Hội</option>
          </select>

          {/* Filter by Unit */}
          <select
            value={filterOrg}
            onChange={e => setFilterOrg(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="ALL">Tất cả đơn vị tổ chức</option>
            {organizations.slice(0, 15).map(o => (
              <option key={o.code} value={o.code}>
                {o.name}
              </option>
            ))}
          </select>

          {/* Filter by Status */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="Approved">Đã phê duyệt</option>
            <option value="Pending">Đang chờ thẩm định</option>
          </select>
        </div>
      </div>

      {/* Main Calendar View Content */}
      {viewMode === 'month' ? (
        /* MONTH GRID VIEW */
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            {/* Weekdays Header */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 text-center uppercase tracking-wider py-2">
              {daysOfWeek.map(day => (
                <div key={day.key} className="px-2 py-1">
                  <span>{day.label}</span>
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-slate-50/20">
              {calendarDays.map((cell, idx) => {
                const isSelected = selectedDateStr === cell.dateStr;
                const hasActs = cell.activities.length > 0;

                return (
                  <div
                    key={`${cell.dateStr}-${idx}`}
                    onClick={() => {
                      if (cell.isCurrentMonth) {
                        setSelectedDateStr(cell.dateStr);
                      }
                    }}
                    className={`min-h-[110px] p-2 flex flex-col justify-between transition cursor-pointer select-none ${
                      !cell.isCurrentMonth
                        ? 'bg-slate-50/60 opacity-40'
                        : isSelected
                        ? 'bg-emerald-50/40 ring-2 ring-emerald-500 ring-inset'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    {/* Date Number & Badge */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                          cell.isToday
                            ? 'bg-emerald-700 text-white shadow-2xs font-black'
                            : isSelected
                            ? 'bg-emerald-100 text-emerald-900 font-black'
                            : 'text-slate-700'
                        }`}
                      >
                        {cell.dayNum}
                      </span>

                      {cell.isToday && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Hôm nay
                        </span>
                      )}

                      {cell.isCurrentMonth && cell.activities.length > 0 && !cell.isToday && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      )}
                    </div>

                    {/* Activities List on Day Cell */}
                    <div className="mt-1 space-y-1 flex-1 overflow-hidden">
                      {cell.activities.slice(0, 2).map(act => {
                        const style = getTypeStyle(act);
                        return (
                          <div
                            key={act.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedActivity(act);
                            }}
                            className={`p-1 rounded-md text-[10px] font-semibold border truncate transition flex items-center gap-1 ${style.bg}`}
                            title={`[${act.id}] ${act.title} (${act.orgName})`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`}></span>
                            <span className="font-mono text-[9px] text-slate-500 shrink-0">{act.id}</span>
                            <span className="truncate">{act.title}</span>
                          </div>
                        );
                      })}

                      {cell.activities.length > 2 && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDateStr(cell.dateStr);
                          }}
                          className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 px-1 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-center"
                        >
                          +{cell.activities.length - 2} hoạt động khác
                        </div>
                      )}
                    </div>

                    {/* Bottom date label */}
                    <div className="pt-1 text-right">
                      {hasActs && (
                        <span className="text-[9px] text-slate-400 font-medium">
                          {cell.activities.length} sự kiện
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* AGENDA / TIMELINE VIEW */
        <div className="p-5 divide-y divide-slate-100">
          {monthActivities.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">
                Không có hoạt động nào trong {monthNames[currentMonthIndex]} {currentYear}
              </p>
              <p className="text-xs text-slate-400">
                Hãy thử chọn tháng khác hoặc điều chỉnh bộ lọc tìm kiếm.
              </p>
            </div>
          ) : (
            monthActivities
              .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''))
              .map(act => {
                const style = getTypeStyle(act);
                const isApproved = act.status === 'Approved';

                return (
                  <div
                    key={act.id}
                    onClick={() => setSelectedActivity(act)}
                    className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 -mx-5 px-5 transition cursor-pointer"
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Date Badge */}
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] uppercase font-bold text-emerald-700">
                          {act.startDate ? `T${act.startDate.split('-')[1]}` : 'N/A'}
                        </span>
                        <span className="text-lg font-black text-emerald-900 leading-tight">
                          {act.startDate ? act.startDate.split('-')[2] : '--'}
                        </span>
                      </div>

                      {/* Content */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-extrabold bg-slate-100 text-slate-800 border border-slate-200">
                            {act.id}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${style.bg}`}>
                            {style.tag}
                          </span>
                          {getStatusBadge(act.status)}
                          {act.needsCertificate && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              Cấp GCN
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 leading-snug hover:text-emerald-700 transition">
                          {act.title}
                        </h4>

                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            {act.orgName} {act.branchClass ? `(${act.branchClass})` : ''}
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            Quy mô: {act.scaleName} ({act.officialParticipantCount} SV)
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                            <Sparkles className="w-3.5 h-3.5" />
                            Phân cấp: Cấp {act.programLevel} ({act.totalLevelScore}đ)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedActivity(act);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                      >
                        Chi tiết
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab('activities');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-2xs transition"
                      >
                        <span>Quản lý</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* Selected Day Milestone Drawer (When a date with events is picked in Month view) */}
      {viewMode === 'month' && selectedDateStr && (
        <div className="border-t border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-emerald-700" />
              <h4 className="text-xs font-bold text-slate-800">
                Tiến độ sự kiện ngày {selectedDateStr.split('-')[2]}/{selectedDateStr.split('-')[1]}/{selectedDateStr.split('-')[0]}
              </h4>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                {selectedDateActivities.length} hoạt động
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSelectedDateStr(null)}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              Ẩn danh sách
            </button>
          </div>

          {selectedDateActivities.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2">
              Không có mốc thời gian hoạt động nào được lên kế hoạch trong ngày này.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedDateActivities.map(act => {
                const style = getTypeStyle(act);
                return (
                  <div
                    key={act.id}
                    onClick={() => setSelectedActivity(act)}
                    className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 shadow-2xs transition cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-mono text-xs font-bold text-emerald-800">{act.id}</span>
                        {getStatusBadge(act.status)}
                      </div>
                      <h5 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">
                        {act.title}
                      </h5>
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-400" />
                        {act.orgName}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-emerald-700">
                        Cấp {act.programLevel} ({act.totalLevelScore}đ)
                      </span>
                      <span className="text-slate-400 hover:text-emerald-700 font-bold inline-flex items-center gap-0.5">
                        Xem chi tiết →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Activity Detail Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white/20 text-white border border-white/30">
                  {selectedActivity.id}
                </span>
                <h3 className="font-bold text-sm text-white mt-1">
                  Chi Tiết Mốc Thời Gian Hoạt Động
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedActivity(null)}
                className="p-1 rounded-lg text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div>
                <h4 className="text-base font-bold text-slate-900 leading-snug">
                  {selectedActivity.title}
                </h4>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {getStatusBadge(selectedActivity.status)}
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                    {selectedActivity.planYear || academicYear}
                  </span>
                  {selectedActivity.needsCertificate && (
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[11px] border border-purple-300">
                      Cấp Giấy Chứng Nhận
                    </span>
                  )}
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Đơn Vị Tổ Chức</span>
                  <span className="font-bold text-slate-800">{selectedActivity.orgName}</span>
                  {selectedActivity.branchClass && (
                    <span className="text-slate-500 block text-[11px]">Chi đoàn: {selectedActivity.branchClass}</span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Thời Gian Tổ Chức</span>
                  <span className="font-bold text-emerald-800">
                    {selectedActivity.startDate} {selectedActivity.endDate ? `đến ${selectedActivity.endDate}` : ''}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Quy Mô & Người Tham Gia</span>
                  <span className="font-semibold text-slate-800">{selectedActivity.scaleName}</span>
                  <span className="text-slate-500 block text-[11px]">
                    {selectedActivity.officialParticipantCount} sinh viên ghi nhận
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Phân Cấp & Điểm Số</span>
                  <span className="font-black text-emerald-700">
                    Chương trình Cấp {selectedActivity.programLevel} ({selectedActivity.totalLevelScore} điểm)
                  </span>
                </div>

                <div className="col-span-2 pt-2 border-t border-slate-200/80">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Cán Bộ / Sinh Viên Phụ Trách</span>
                  <span className="font-bold text-slate-800">{selectedActivity.managerName}</span>
                  {selectedActivity.managerStudentId && (
                    <span className="text-slate-500 text-[11px] font-mono ml-1">
                      (MSSV: {selectedActivity.managerStudentId})
                    </span>
                  )}
                </div>
              </div>

              {/* DRL & SV5T Criteria */}
              <div className="space-y-2">
                {selectedActivity.drlCriteriaText && (
                  <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200">
                    <span className="text-[10px] font-bold text-blue-900 uppercase block">Tiêu Chuẩn ĐRL Liên Kết</span>
                    <p className="text-blue-800 font-medium text-[11px] mt-0.5">{selectedActivity.drlCriteriaText}</p>
                  </div>
                )}

                {selectedActivity.sv5tCriteriaText && (
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-900 uppercase block">Tiêu Chuẩn Sinh Viên 5 Tốt</span>
                    <p className="text-amber-800 font-medium text-[11px] mt-0.5">{selectedActivity.sv5tCriteriaText}</p>
                  </div>
                )}
              </div>

              {/* Links */}
              <div className="pt-2 flex flex-col gap-2">
                {selectedActivity.signedDocUrl && (
                  <a
                    href={selectedActivity.signedDocUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      Văn bản trình ký (Google Drive)
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                )}

                {selectedActivity.proofArticleUrl && (
                  <a
                    href={selectedActivity.proofArticleUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-sky-600" />
                      Bài viết minh chứng hoạt động
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedActivity(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-semibold transition"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedActivity(null);
                  setActiveTab('activities');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs transition"
              >
                <span>Xem Trong Quản Lý Hoạt Động</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
