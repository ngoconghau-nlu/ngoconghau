import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  SystemActivityLog,
  ActivityLogCategory,
  ActivityLogSeverity
} from '../types';
import {
  History,
  Shield,
  Key,
  Calendar,
  Award,
  HardDrive,
  Building,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Eye,
  User,
  Clock,
  ArrowRight,
  FileSpreadsheet,
  FileJson,
  RefreshCw,
  Sparkles,
  ChevronDown,
  Layers,
  Globe,
  Tag
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const SystemActivityLogView: React.FC = () => {
  const { systemActivityLogs, user, showToast, academicYear } = useApp();

  const isLevel4 = user.currentRole.roleLevel === 4;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedRoleLevel, setSelectedRoleLevel] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
  const [selectedLogDetail, setSelectedLogDetail] = useState<SystemActivityLog | null>(null);

  // Statistics
  const stats = useMemo(() => {
    const total = systemActivityLogs.length;
    const accountChanges = systemActivityLogs.filter(l => l.category === 'ACCOUNT_PERMISSION').length;
    const activityWorkflows = systemActivityLogs.filter(l => l.category === 'ACTIVITY_WORKFLOW').length;
    const scoreChanges = systemActivityLogs.filter(l => l.category === 'SCORE_MANAGEMENT').length;
    const securityOps = systemActivityLogs.filter(l => l.category === 'SYSTEM_SECURITY').length;
    return { total, accountChanges, activityWorkflows, scoreChanges, securityOps };
  }, [systemActivityLogs]);

  // Filtering
  const filteredLogs = useMemo(() => {
    return systemActivityLogs.filter(log => {
      const matchCategory = selectedCategory === 'ALL' || log.category === selectedCategory;
      const matchSeverity = selectedSeverity === 'ALL' || log.severity === selectedSeverity;
      const matchRoleLevel =
        selectedRoleLevel === 'ALL' || String(log.performedBy.roleLevel) === selectedRoleLevel;

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        q === '' ||
        log.actionTitle.toLowerCase().includes(q) ||
        log.actionDetail.toLowerCase().includes(q) ||
        log.performedBy.userName.toLowerCase().includes(q) ||
        log.performedBy.userEmail.toLowerCase().includes(q) ||
        (log.targetEntity?.name && log.targetEntity.name.toLowerCase().includes(q)) ||
        log.id.toLowerCase().includes(q);

      return matchCategory && matchSeverity && matchRoleLevel && matchSearch;
    });
  }, [systemActivityLogs, selectedCategory, selectedSeverity, selectedRoleLevel, searchQuery]);

  const getCategoryInfo = (category: ActivityLogCategory) => {
    switch (category) {
      case 'ACCOUNT_PERMISSION':
        return {
          label: 'Phân Quyền & Tài Khoản',
          icon: Key,
          color: 'bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800'
        };
      case 'ACTIVITY_WORKFLOW':
        return {
          label: 'Phê Duyệt Hoạt Động',
          icon: Calendar,
          color: 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800'
        };
      case 'SCORE_MANAGEMENT':
        return {
          label: 'Điểm Rèn Luyện & SV5T',
          icon: Award,
          color: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
        };
      case 'SYSTEM_SECURITY':
        return {
          label: 'Quản Trị & Sao Lưu',
          icon: HardDrive,
          color: 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
        };
      case 'ORGANIZATION_DATA':
        return {
          label: 'Danh Mục Đơn Vị',
          icon: Building,
          color: 'bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-800'
        };
      default:
        return {
          label: 'Hệ Thống',
          icon: Layers,
          color: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700'
        };
    }
  };

  const getSeverityBadge = (severity: ActivityLogSeverity) => {
    switch (severity) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Thành công
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            Cảnh báo
          </span>
        );
      case 'danger':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
            <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            Thu hồi/Xóa
          </span>
        );
      case 'info':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
            <Info className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            Thông tin
          </span>
        );
    }
  };

  const exportToExcel = () => {
    const data = filteredLogs.map(l => ({
      'Mã Nhật Ký': l.id,
      'Thời Gian': l.timestamp,
      'Phân Loại': getCategoryInfo(l.category).label,
      'Hành Động': l.actionTitle,
      'Chi Tiết Biến Động': l.actionDetail,
      'Mức Độ': l.severity.toUpperCase(),
      'Người Thực Hiện': l.performedBy.userName,
      'Email Người Thực Hiện': l.performedBy.userEmail,
      'Cấp Độ Cán Bộ': `Cấp ${l.performedBy.roleLevel}`,
      'Đối Tượng Tác Động': l.targetEntity ? `${l.targetEntity.type}: ${l.targetEntity.name}` : 'N/A',
      'Địa Chỉ IP': l.ipAddress || '14.161.45.102'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SystemActivityLogs');
    XLSX.writeFile(wb, `NLU_Youth_System_Activity_Log_${Date.now()}.xlsx`);
    showToast(`Đã xuất ${data.length} bản ghi nhật ký hệ thống ra Excel!`, 'success');
  };

  const exportToJson = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NLU_Youth_System_Activity_Log_${Date.now()}.json`;
    link.click();
    showToast('Đã tải xuống tệp JSON nhật ký hệ thống!', 'success');
  };

  if (!isLevel4) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl mx-auto space-y-3">
        <Shield className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-black text-slate-900 dark:text-white">
          Yêu Cầu Quyền Quản Trị Hệ Thống (Cấp 4)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Chỉ có Ban Thường vụ Đoàn trường (Quản trị viên Cấp 4) mới có quyền truy cập và kiểm tra toàn diện Nhật ký hoạt động & Thay đổi quyền hệ thống.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-10 -top-10 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 dark:bg-white/5 text-purple-200 border border-white/15 text-xs font-bold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-amber-300" />
              Kiểm Toán & Giám Sát Toàn Diện · Cấp 4 Admin
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Nhật Ký Hoạt Động & Biến Động Hệ Thống
            </h2>
            <p className="text-xs sm:text-sm text-purple-100/80 leading-relaxed">
              Theo dõi chi tiết mọi thay đổi quan trọng trên hệ thống: Cấp/thu hồi quyền tài khoản Google SSO, phê duyệt kế hoạch hoạt động, điều chỉnh điểm rèn luyện và sao lưu dữ liệu đám mây.
            </p>
          </div>

          {/* Export Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={exportToExcel}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất File Excel</span>
            </button>
            <button
              type="button"
              onClick={exportToJson}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all"
            >
              <FileJson className="w-4 h-4 text-amber-300" />
              <span>Xuất File JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Tổng Nhật Ký</span>
            <History className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {stats.total}
          </p>
          <span className="text-[10px] text-slate-400 block">Tất cả bản ghi</span>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-900 dark:text-purple-300 uppercase">Phân Quyền SSO</span>
            <Key className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-900 dark:text-purple-200 font-mono">
            {stats.accountChanges}
          </p>
          <span className="text-[10px] text-purple-700 dark:text-purple-300 block">Cấp/khóa tài khoản</span>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-900 dark:text-blue-300 uppercase">Duyệt Hoạt Động</span>
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-black text-blue-900 dark:text-blue-200 font-mono">
            {stats.activityWorkflows}
          </p>
          <span className="text-[10px] text-blue-700 dark:text-blue-300 block">Phê duyệt & thẩm định</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 uppercase">Điểm Rèn Luyện</span>
            <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-900 dark:text-emerald-200 font-mono">
            {stats.scoreChanges}
          </p>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block">Nạp Excel & minh chứng</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 shadow-xs space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase">Sao Lưu & Khóa</span>
            <HardDrive className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-900 dark:text-amber-200 font-mono">
            {stats.securityOps}
          </p>
          <span className="text-[10px] text-amber-700 dark:text-amber-300 block">Bảo mật đám mây</span>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tiêu đề, email cán bộ, tên hoạt động, MSSV..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl self-start md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'timeline'
                  ? 'bg-white dark:bg-slate-700 text-purple-900 dark:text-purple-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Dòng Thời Gian</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-purple-900 dark:text-purple-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Dạng Bảng</span>
            </button>
          </div>
        </div>

        {/* Category & Severity Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="font-bold text-slate-400 text-[11px] uppercase mr-1">Phân loại:</span>

          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'ACCOUNT_PERMISSION', label: '🔐 Phân quyền SSO' },
            { id: 'ACTIVITY_WORKFLOW', label: '📋 Phê duyệt HĐ' },
            { id: 'SCORE_MANAGEMENT', label: '🎖️ Điểm Rèn Luyện' },
            { id: 'SYSTEM_SECURITY', label: '💾 Quản trị & Sao lưu' },
            { id: 'ORGANIZATION_DATA', label: '🏛️ Đơn vị' }
          ].map((c, idx) => (
            <button
              key={`${c.id}_${idx}`}
              type="button"
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1 rounded-xl font-bold transition-colors ${
                selectedCategory === c.id
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {c.label}
            </button>
          ))}

          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

          {/* Severity filter */}
          <select
            value={selectedSeverity}
            onChange={e => setSelectedSeverity(e.target.value)}
            className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 font-semibold focus:outline-hidden"
          >
            <option value="ALL">Mức độ: Tất cả</option>
            <option value="success">✅ Thành công</option>
            <option value="warning">⚠️ Cảnh báo / Tạm khóa</option>
            <option value="danger">⛔ Thu hồi / Xóa</option>
            <option value="info">ℹ️ Thông tin</option>
          </select>

          {/* Actor Role Level filter */}
          <select
            value={selectedRoleLevel}
            onChange={e => setSelectedRoleLevel(e.target.value)}
            className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 font-semibold focus:outline-hidden"
          >
            <option value="ALL">Cấp thực hiện: Tất cả</option>
            <option value="4">👑 Cấp 4 (Trường)</option>
            <option value="3">🏛️ Cấp 3 (Khoa)</option>
            <option value="2">👥 Cấp 2 (Chi đoàn)</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'timeline' ? (
        /* TIMELINE VIEW */
        <div className="space-y-4">
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {filteredLogs.map(log => {
              const catInfo = getCategoryInfo(log.category);
              const CatIcon = catInfo.icon;
              return (
                <div key={log.id} className="relative group">
                  {/* Timeline Bullet Node */}
                  <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-purple-500 dark:border-purple-400 flex items-center justify-center shadow-xs">
                    <CatIcon className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  </div>

                  {/* Event Card */}
                  <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${catInfo.color}`}>
                          <CatIcon className="w-3 h-3" />
                          {catInfo.label}
                        </span>
                        {getSeverityBadge(log.severity)}
                        <span className="text-[11px] font-mono text-slate-400">
                          #{log.id}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.timestamp}</span>
                      </div>
                    </div>

                    {/* Title & Detail */}
                    <div className="space-y-1">
                      <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                        {log.actionTitle}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {log.actionDetail}
                      </p>
                    </div>

                    {/* Diffs / Changes badges if any */}
                    {log.changes && log.changes.length > 0 && (
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 space-y-1.5 text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Chi tiết thay đổi:</span>
                        <div className="flex flex-wrap gap-2">
                          {log.changes.map((c, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px]"
                            >
                              <strong className="text-purple-700 dark:text-purple-400 font-mono">{c.field}:</strong>
                              {c.oldValue && (
                                <span className="line-through text-slate-400">{c.oldValue}</span>
                              )}
                              {c.oldValue && c.newValue && (
                                <ArrowRight className="w-3 h-3 text-slate-400" />
                              )}
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">{c.newValue}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer: Actor & Target Entity */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      {/* Actor */}
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200 font-black text-[10px] flex items-center justify-center">
                          {log.performedBy.userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-[11px]">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {log.performedBy.userName}
                          </span>
                          <span className="text-slate-400 font-mono ml-1">
                            ({log.performedBy.userEmail})
                          </span>
                          <span className="ml-1.5 text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 px-1.5 py-0.2 rounded font-semibold">
                            Cấp {log.performedBy.roleLevel}
                          </span>
                        </div>
                      </div>

                      {/* View Details Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedLogDetail(log)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem Vết Kiểm Toán</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredLogs.length === 0 && (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              Không tìm thấy bản ghi nhật ký hoạt động nào phù hợp với bộ lọc.
            </div>
          )}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-bold">Thời Gian</th>
                  <th className="py-3.5 px-4 font-bold">Phân Loại</th>
                  <th className="py-3.5 px-4 font-bold">Hành Động & Chi Tiết</th>
                  <th className="py-3.5 px-4 font-bold">Người Thực Hiện</th>
                  <th className="py-3.5 px-4 font-bold">Mức Độ</th>
                  <th className="py-3.5 px-4 font-bold text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.map(log => {
                  const catInfo = getCategoryInfo(log.category);
                  const CatIcon = catInfo.icon;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${catInfo.color}`}>
                          <CatIcon className="w-3 h-3" />
                          {catInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs sm:max-w-md">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {log.actionTitle}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {log.actionDetail}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {log.performedBy.userName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {log.performedBy.userEmail} (Cấp {log.performedBy.roleLevel})
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getSeverityBadge(log.severity)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedLogDetail(log)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-purple-700 dark:text-purple-400 transition"
                          title="Xem chi tiết kiểm toán"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal / Drawer */}
      {selectedLogDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full overflow-hidden text-slate-900 dark:text-slate-100">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-purple-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-base tracking-tight">
                    Chi Tiết Nhật Ký Kiểm Toán
                  </h4>
                  <p className="text-xs text-purple-200 font-mono">
                    Mã bản ghi: #{selectedLogDetail.id}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLogDetail(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Thời Gian Ghi Nhận</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {selectedLogDetail.timestamp}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Địa Chỉ IP / Thiết Bị</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {selectedLogDetail.ipAddress || '14.161.45.102 (Đoàn Trường)'}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Hành Động</span>
                <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {selectedLogDetail.actionTitle}
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedLogDetail.actionDetail}
                </p>
              </div>

              {/* Actor Information */}
              <div className="p-3.5 rounded-2xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/30 space-y-2">
                <span className="text-[10px] text-purple-900 dark:text-purple-300 font-bold uppercase block">
                  Cán Bộ Thực Hiện
                </span>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-purple-700 text-white flex items-center justify-center font-bold text-xs">
                    {selectedLogDetail.performedBy.userName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 dark:text-white">
                      {selectedLogDetail.performedBy.userName}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {selectedLogDetail.performedBy.userEmail} · {selectedLogDetail.performedBy.roleName}
                    </div>
                  </div>
                </div>
              </div>

              {/* Changes / Diffs */}
              {selectedLogDetail.changes && selectedLogDetail.changes.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Vết Thay Đổi Trường Dữ Liệu
                  </span>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedLogDetail.changes.map((c, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-purple-700 dark:text-purple-400">
                          {c.field}
                        </span>
                        <div className="flex items-center gap-2">
                          {c.oldValue && (
                            <span className="line-through text-slate-400">{c.oldValue}</span>
                          )}
                          {c.oldValue && c.newValue && (
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {c.newValue}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLogDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-bold text-xs transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
