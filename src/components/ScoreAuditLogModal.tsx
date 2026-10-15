import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ScoreAuditLog, ScoreAuditActionType } from '../types';
import {
  History,
  Search,
  Filter,
  X,
  Download,
  FileSpreadsheet,
  FileText,
  User,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  AlertCircle,
  Building,
  GraduationCap,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Eye,
  RotateCcw,
  SlidersHorizontal,
  Info,
  Calendar,
  Lock,
  Printer
} from 'lucide-react';

interface ScoreAuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStudentId?: string | null;
}

export const ScoreAuditLogModal: React.FC<ScoreAuditLogModalProps> = ({
  isOpen,
  onClose,
  initialStudentId = null
}) => {
  const { scoreAuditLogs, students, academicYear, showToast } = useApp();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string | null>(initialStudentId);
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('ALL');
  const [roleLevelFilter, setRoleLevelFilter] = useState<string>('ALL');
  const [scoreTrendFilter, setScoreTrendFilter] = useState<string>('ALL'); // 'ALL' | 'INCREASE' | 'DECREASE' | 'NO_CHANGE'
  
  // Selected detail log for deep inspection
  const [selectedLogDetail, setSelectedLogDetail] = useState<ScoreAuditLog | null>(null);

  // Sync initialStudentId if prop changes
  React.useEffect(() => {
    if (initialStudentId) {
      setSelectedStudentFilter(initialStudentId);
    }
  }, [initialStudentId]);

  // Filtered Audit Logs
  const filteredLogs = useMemo(() => {
    return scoreAuditLogs.filter(log => {
      // Filter by specific student
      if (selectedStudentFilter && log.studentId !== selectedStudentFilter) {
        return false;
      }

      // Filter by Action Type
      if (actionTypeFilter !== 'ALL' && log.actionType !== actionTypeFilter) {
        return false;
      }

      // Filter by Role Level
      if (roleLevelFilter !== 'ALL') {
        const targetLevel = Number(roleLevelFilter);
        if (log.performedBy.roleLevel !== targetLevel) {
          return false;
        }
      }

      // Filter by Score Trend
      if (scoreTrendFilter === 'INCREASE' && log.scoreDifference <= 0) return false;
      if (scoreTrendFilter === 'DECREASE' && log.scoreDifference >= 0) return false;
      if (scoreTrendFilter === 'NO_CHANGE' && log.scoreDifference !== 0) return false;

      // Search Query
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchStudentId = log.studentId?.toLowerCase().includes(query);
        const matchStudentName = log.studentName?.toLowerCase().includes(query);
        const matchUserName = log.performedBy.userName?.toLowerCase().includes(query);
        const matchUserEmail = log.performedBy.userEmail?.toLowerCase().includes(query);
        const matchReason = log.reason?.toLowerCase().includes(query);
        const matchTitle = log.actionTitle?.toLowerCase().includes(query);
        const matchClass = log.classCode?.toLowerCase().includes(query);

        if (!matchStudentId && !matchStudentName && !matchUserName && !matchUserEmail && !matchReason && !matchTitle && !matchClass) {
          return false;
        }
      }

      return true;
    });
  }, [scoreAuditLogs, selectedStudentFilter, actionTypeFilter, roleLevelFilter, scoreTrendFilter, searchTerm]);

  // Overall KPI statistics
  const stats = useMemo(() => {
    const total = scoreAuditLogs.length;
    const increased = scoreAuditLogs.filter(l => l.scoreDifference > 0).length;
    const decreased = scoreAuditLogs.filter(l => l.scoreDifference < 0).length;
    
    // Unique editors
    const editorEmails = new Set(scoreAuditLogs.map(l => l.performedBy.userEmail || l.performedBy.userName));
    const uniqueEditorsCount = editorEmails.size;

    return { total, increased, decreased, uniqueEditorsCount };
  }, [scoreAuditLogs]);

  // Export Audit Logs to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      showToast('Không có dữ liệu nhật ký kiểm toán để xuất file!', 'warning');
      return;
    }

    const headers = [
      'STT',
      'Mã Nhật Ký',
      'Thời Gian',
      'MSSV',
      'Họ Và Tên Sinh Viên',
      'Lớp',
      'Khoa',
      'Loại Thao Tác',
      'Người Thực Hiện',
      'Email Người Thực Hiện',
      'Cấp Quyền',
      'Biến Động Điểm',
      'Tổng Điểm Trước',
      'Tổng Điểm Sau',
      'Khen Thưởng Trước',
      'Khen Thưởng Sau',
      'Chức Vụ Trước',
      'Chức Vụ Sau',
      'NCKH Trước',
      'NCKH Sau',
      'Hoạt Động Trước',
      'Hoạt Động Sau',
      'Căn Cứ / Ghi Chú',
      'Địa Chỉ IP'
    ];

    const rows = filteredLogs.map((log, idx) => [
      idx + 1,
      log.id,
      log.timestamp,
      log.studentId,
      `"${log.studentName.replace(/"/g, '""')}"`,
      log.classCode || '',
      log.facultyCode || '',
      log.actionType,
      `"${log.performedBy.userName.replace(/"/g, '""')}"`,
      log.performedBy.userEmail,
      `Cấp ${log.performedBy.roleLevel} - ${log.performedBy.roleName}`,
      log.scoreDifference > 0 ? `+${log.scoreDifference}` : log.scoreDifference,
      log.previousScores.totalScore,
      log.newScores.totalScore,
      log.previousScores.bonusScore,
      log.newScores.bonusScore,
      log.previousScores.positionScore,
      log.newScores.positionScore,
      log.previousScores.researchScore,
      log.newScores.researchScore,
      log.previousScores.activityScore,
      log.newScores.activityScore,
      `"${(log.reason || '').replace(/"/g, '""')}"`,
      log.ipAddress || ''
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NhatKyKiemToan_DRL_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Đã xuất tệp CSV lịch sử kiểm toán thành công!', 'success');
  };

  // Export to JSON Backup
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `AuditLog_DRL_NLU_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Đã tải xuống tệp JSON nhật ký kiểm toán!', 'success');
  };

  if (!isOpen) return null;

  const getActionBadge = (type: ScoreAuditActionType) => {
    switch (type) {
      case 'MODAL_EDIT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <SlidersHorizontal className="w-3 h-3 text-indigo-600" /> Chỉnh sửa chi tiết
          </span>
        );
      case 'INLINE_EDIT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <History className="w-3 h-3 text-blue-600" /> Sửa trực tiếp
          </span>
        );
      case 'BATCH_BONUS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Sparkles className="w-3 h-3 text-emerald-600" /> Cộng điểm hàng loạt
          </span>
        );
      case 'PROOF_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <CheckCircle2 className="w-3 h-3 text-amber-600" /> Duyệt minh chứng
          </span>
        );
      case 'EXCEL_IMPORT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
            <FileSpreadsheet className="w-3 h-3 text-teal-600" /> Nạp file Excel
          </span>
        );
      case 'BATCH_MEMBERSHIP':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <GraduationCap className="w-3 h-3 text-purple-600" /> Đổi đối tượng
          </span>
        );
      case 'BATCH_RECALCULATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
            <RotateCcw className="w-3 h-3 text-sky-600" /> Chuẩn hóa xếp loại
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            {type}
          </span>
        );
    }
  };

  const getRoleBadge = (level: number, roleName: string) => {
    if (level === 4) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-50 text-purple-800 border border-purple-200">
          <ShieldCheck className="w-3 h-3 text-purple-600" /> Cấp Trường (Admin)
        </span>
      );
    }
    if (level === 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
          <Building className="w-3 h-3 text-blue-600" /> Cấp Khoa
        </span>
      );
    }
    if (level === 2) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <GraduationCap className="w-3 h-3 text-emerald-600" /> Cấp Chi đoàn
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-700">
        <User className="w-3 h-3 text-slate-500" /> Sinh viên
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-6xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base text-white tracking-tight flex items-center gap-2">
                  Lịch Sử Thay Đổi & Nhật Ký Kiểm Toán Điểm Rèn Luyện (Audit Log)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  {academicYear}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Minh Bạch Dữ Liệu
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Ghi vết tự động mọi thao tác điều chỉnh điểm: ai đã chỉnh sửa, thời gian thực hiện, điểm trước & sau, và căn cứ thay đổi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 transition cursor-pointer"
              title="Xuất file Excel CSV"
            >
              <Download className="w-3.5 h-3.5 text-indigo-300" />
              <span className="hidden sm:inline">Xuất CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportJSON}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 transition cursor-pointer"
              title="Tải tệp JSON kiểm toán"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-300" />
              <span className="hidden sm:inline">JSON</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Đóng modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Executive Metric Cards (KPI Strip) */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 shrink-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tổng lượt chỉnh sửa</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">{stats.total}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Ghi vết toàn hệ thống</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <History className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-emerald-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Điều chỉnh tăng điểm (+)</p>
                <p className="text-xl font-black text-emerald-800 mt-0.5">{stats.increased}</p>
                <p className="text-[10px] text-emerald-600 mt-0.5">Cộng thưởng, duyệt minh chứng</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-rose-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">Điều chỉnh giảm điểm (-)</p>
                <p className="text-xl font-black text-rose-800 mt-0.5">{stats.decreased}</p>
                <p className="text-[10px] text-rose-600 mt-0.5">Thu hồi / hiệu chỉnh sai sót</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-purple-200 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">Cán bộ thực hiện</p>
                <p className="text-xl font-black text-purple-800 mt-0.5">{stats.uniqueEditorsCount}</p>
                <p className="text-[10px] text-purple-600 mt-0.5">Đã xác thực định danh</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar: Search & Filters */}
        <div className="p-4 border-b border-slate-200 bg-white shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Tìm theo MSSV, tên SV, cán bộ, căn cứ..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium text-xs text-slate-800"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter by Action */}
            <select
              value={actionTypeFilter}
              onChange={e => setActionTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 text-xs"
            >
              <option value="ALL">Tất cả loại thao tác</option>
              <option value="MODAL_EDIT">Chỉnh sửa chi tiết (Modal)</option>
              <option value="INLINE_EDIT">Chỉnh sửa trực tiếp (Inline)</option>
              <option value="BATCH_BONUS">Cộng điểm hàng loạt</option>
              <option value="PROOF_APPROVAL">Duyệt minh chứng cá nhân</option>
              <option value="EXCEL_IMPORT">Nạp điểm từ file Excel</option>
              <option value="BATCH_RECALCULATE">Chuẩn hóa xếp loại</option>
              <option value="BATCH_MEMBERSHIP">Chuyển đối tượng Đoàn/Hội</option>
            </select>

            {/* Filter by Role Level */}
            <select
              value={roleLevelFilter}
              onChange={e => setRoleLevelFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 text-xs"
            >
              <option value="ALL">Tất cả cấp thẩm quyền</option>
              <option value="4">Cấp 4: Đoàn Trường (Admin)</option>
              <option value="3">Cấp 3: Đoàn Khoa</option>
              <option value="2">Cấp 2: Chi đoàn</option>
            </select>

            {/* Filter by Score Trend */}
            <select
              value={scoreTrendFilter}
              onChange={e => setScoreTrendFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 text-xs"
            >
              <option value="ALL">Tất cả biến động</option>
              <option value="INCREASE">Tăng điểm (+)</option>
              <option value="DECREASE">Giảm điểm (-)</option>
              <option value="NO_CHANGE">Không đổi (0đ)</option>
            </select>

            {/* Reset Filters */}
            {(searchTerm || actionTypeFilter !== 'ALL' || roleLevelFilter !== 'ALL' || scoreTrendFilter !== 'ALL' || selectedStudentFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setActionTypeFilter('ALL');
                  setRoleLevelFilter('ALL');
                  setScoreTrendFilter('ALL');
                  setSelectedStudentFilter(null);
                }}
                className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl font-bold flex items-center gap-1 transition cursor-pointer"
                title="Khôi phục bộ lọc mặc định"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Student Filter Chip (if single student view) */}
        {selectedStudentFilter && (
          <div className="bg-indigo-50 border-b border-indigo-200 px-6 py-2 flex items-center justify-between text-xs text-indigo-900 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Đang lọc lịch sử của riêng sinh viên:</span>
              <span className="px-2 py-0.5 rounded-md font-mono font-bold bg-white text-indigo-800 border border-indigo-300">
                {selectedStudentFilter}
              </span>
              <span className="font-medium text-slate-600">
                ({students.find(s => s.studentId === selectedStudentFilter)?.fullName || 'Sinh viên'})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedStudentFilter(null)}
              className="text-indigo-600 hover:text-indigo-900 font-bold flex items-center gap-1 underline cursor-pointer"
            >
              <span>Xem toàn bộ sinh viên</span>
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Audit Log Table Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <History className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Không tìm thấy bản ghi kiểm toán phù hợp</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Không có sự kiện điều chỉnh điểm rèn luyện nào khớp với các tiêu chí tìm kiếm hoặc bộ lọc hiện hành.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setActionTypeFilter('ALL');
                  setRoleLevelFilter('ALL');
                  setScoreTrendFilter('ALL');
                  setSelectedStudentFilter(null);
                }}
                className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map(log => {
                const isPositive = log.scoreDifference > 0;
                const isNegative = log.scoreDifference < 0;

                return (
                  <div
                    key={log.id}
                    className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-2xs hover:shadow-xs transition p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Left: Timestamp, Editor, Student info */}
                    <div className="space-y-2 flex-1">
                      {/* Top meta tags */}
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        {/* Time */}
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {log.timestamp}
                        </span>

                        {/* Action Type Badge */}
                        {getActionBadge(log.actionType)}

                        {/* Role Level Badge */}
                        {getRoleBadge(log.performedBy.roleLevel, log.performedBy.roleName)}

                        {/* IP Address */}
                        {log.ipAddress && (
                          <span className="hidden lg:inline text-[10px] text-slate-400 font-mono">
                            [{log.ipAddress}]
                          </span>
                        )}
                      </div>

                      {/* Main Title & Action Details */}
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {log.actionTitle}
                        </h4>

                        <div className="flex items-center gap-2 text-xs text-slate-600 mt-1 flex-wrap">
                          <span className="font-semibold text-slate-800">
                            Người thực hiện: <span className="font-bold text-indigo-900">{log.performedBy.userName}</span>
                          </span>
                          <span className="text-slate-400">({log.performedBy.userEmail})</span>
                          <span>•</span>
                          <span className="text-slate-700">
                            Đối tượng: <span className="font-mono font-bold text-slate-900">{log.studentId}</span> - <span className="font-bold">{log.studentName}</span>
                            {log.classCode ? ` (${log.classCode})` : ''}
                          </span>
                        </div>
                      </div>

                      {/* Reason / Transparent Justification Note */}
                      {log.reason && (
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                          <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-slate-800">Căn cứ / Ghi chú kiểm toán: </span>
                            <span className="italic text-slate-600">{log.reason}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Score Difference & Snapshot comparison */}
                    <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-end md:items-end justify-between md:justify-end gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                      {/* Score Diff Badge */}
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-black text-sm ${
                            isPositive
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : isNegative
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {isPositive ? <ArrowUpRight className="w-4 h-4" /> : isNegative ? <ArrowDownRight className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                          <span>{isPositive ? `+${log.scoreDifference}` : log.scoreDifference} đ</span>
                        </span>

                        <div className="text-[11px] text-slate-500 mt-1 font-medium">
                          Tổng điểm: <span className="line-through text-slate-400">{log.previousScores.totalScore}đ</span> → <span className="font-bold text-slate-900">{log.newScores.totalScore}đ</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedLogDetail(log)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                          title="Xem chi tiết biến động các thành phần điểm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Chi tiết</span>
                        </button>

                        {!selectedStudentFilter && log.studentId && !log.studentId.startsWith('BATCH') && (
                          <button
                            type="button"
                            onClick={() => setSelectedStudentFilter(log.studentId)}
                            className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl font-semibold transition cursor-pointer"
                            title={`Lọc lịch sử của riêng ${log.studentName}`}
                          >
                            Lọc SV này
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              Hiển thị <strong className="text-slate-800">{filteredLogs.length}</strong> / {scoreAuditLogs.length} bản ghi nhật ký kiểm toán.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>

        {/* Detailed Single Audit Log Popover Modal */}
        {selectedLogDetail && (
          <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-gradient-to-r from-indigo-900 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-white/20 text-white border border-white/30">
                    {selectedLogDetail.id}
                  </span>
                  <h4 className="font-bold text-sm text-white mt-1">
                    Chi Tiết Biến Động Kiểm Toán Điểm
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLogDetail(null)}
                  className="p-1 rounded-lg text-indigo-200 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
                {/* Meta details */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Thời gian:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedLogDetail.timestamp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Người thực hiện:</span>
                    <span className="font-bold text-slate-800">{selectedLogDetail.performedBy.userName} ({selectedLogDetail.performedBy.userEmail})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Thẩm quyền:</span>
                    <span>{getRoleBadge(selectedLogDetail.performedBy.roleLevel, selectedLogDetail.performedBy.roleName)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Sinh viên thụ hưởng:</span>
                    <span className="font-bold text-slate-900">[{selectedLogDetail.studentId}] {selectedLogDetail.studentName}</span>
                  </div>
                  {selectedLogDetail.ipAddress && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Địa chỉ truy cập IP:</span>
                      <span className="font-mono text-slate-600">{selectedLogDetail.ipAddress}</span>
                    </div>
                  )}
                </div>

                {/* Score Diff Breakdown Table */}
                <div>
                  <h5 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                    Bảng Đối Chiếu 4 Thành Phần Điểm Trước & Sau
                  </h5>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Thành Phần Điểm</th>
                          <th className="p-2.5 text-center">Trước Khi Sửa</th>
                          <th className="p-2.5 text-center">Sau Khi Sửa</th>
                          <th className="p-2.5 text-right">Biến Động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        <tr>
                          <td className="p-2.5 text-slate-700">Điểm Khen Thưởng</td>
                          <td className="p-2.5 text-center font-mono">{selectedLogDetail.previousScores.bonusScore} đ</td>
                          <td className="p-2.5 text-center font-mono font-bold text-emerald-700">{selectedLogDetail.newScores.bonusScore} đ</td>
                          <td className="p-2.5 text-right font-bold">
                            {selectedLogDetail.newScores.bonusScore - selectedLogDetail.previousScores.bonusScore !== 0 ? (
                              <span className={selectedLogDetail.newScores.bonusScore > selectedLogDetail.previousScores.bonusScore ? 'text-emerald-700' : 'text-rose-700'}>
                                {selectedLogDetail.newScores.bonusScore > selectedLogDetail.previousScores.bonusScore ? '+' : ''}
                                {selectedLogDetail.newScores.bonusScore - selectedLogDetail.previousScores.bonusScore} đ
                              </span>
                            ) : '-'}
                          </td>
                        </tr>

                        <tr>
                          <td className="p-2.5 text-slate-700">Điểm Chức Vụ</td>
                          <td className="p-2.5 text-center font-mono">{selectedLogDetail.previousScores.positionScore} đ</td>
                          <td className="p-2.5 text-center font-mono font-bold text-blue-700">{selectedLogDetail.newScores.positionScore} đ</td>
                          <td className="p-2.5 text-right font-bold">
                            {selectedLogDetail.newScores.positionScore - selectedLogDetail.previousScores.positionScore !== 0 ? (
                              <span className={selectedLogDetail.newScores.positionScore > selectedLogDetail.previousScores.positionScore ? 'text-emerald-700' : 'text-rose-700'}>
                                {selectedLogDetail.newScores.positionScore > selectedLogDetail.previousScores.positionScore ? '+' : ''}
                                {selectedLogDetail.newScores.positionScore - selectedLogDetail.previousScores.positionScore} đ
                              </span>
                            ) : '-'}
                          </td>
                        </tr>

                        <tr>
                          <td className="p-2.5 text-slate-700">Điểm Nghiên Cứu Khoa Học</td>
                          <td className="p-2.5 text-center font-mono">{selectedLogDetail.previousScores.researchScore} đ</td>
                          <td className="p-2.5 text-center font-mono font-bold text-purple-700">{selectedLogDetail.newScores.researchScore} đ</td>
                          <td className="p-2.5 text-right font-bold">
                            {selectedLogDetail.newScores.researchScore - selectedLogDetail.previousScores.researchScore !== 0 ? (
                              <span className={selectedLogDetail.newScores.researchScore > selectedLogDetail.previousScores.researchScore ? 'text-emerald-700' : 'text-rose-700'}>
                                {selectedLogDetail.newScores.researchScore > selectedLogDetail.previousScores.researchScore ? '+' : ''}
                                {selectedLogDetail.newScores.researchScore - selectedLogDetail.previousScores.researchScore} đ
                              </span>
                            ) : '-'}
                          </td>
                        </tr>

                        <tr>
                          <td className="p-2.5 text-slate-700">Điểm Hoạt Động (Tham gia CT)</td>
                          <td className="p-2.5 text-center font-mono">{selectedLogDetail.previousScores.activityScore} đ</td>
                          <td className="p-2.5 text-center font-mono font-bold text-teal-700">{selectedLogDetail.newScores.activityScore} đ</td>
                          <td className="p-2.5 text-right font-bold">
                            {selectedLogDetail.newScores.activityScore - selectedLogDetail.previousScores.activityScore !== 0 ? (
                              <span className={selectedLogDetail.newScores.activityScore > selectedLogDetail.previousScores.activityScore ? 'text-emerald-700' : 'text-rose-700'}>
                                {selectedLogDetail.newScores.activityScore > selectedLogDetail.previousScores.activityScore ? '+' : ''}
                                {selectedLogDetail.newScores.activityScore - selectedLogDetail.previousScores.activityScore} đ
                              </span>
                            ) : '-'}
                          </td>
                        </tr>

                        <tr className="bg-slate-50/80 font-black">
                          <td className="p-2.5 text-slate-900">TỔNG ĐIỂM RÈN LUYỆN</td>
                          <td className="p-2.5 text-center font-mono text-slate-700">{selectedLogDetail.previousScores.totalScore} đ</td>
                          <td className="p-2.5 text-center font-mono text-emerald-800 text-sm">{selectedLogDetail.newScores.totalScore} đ</td>
                          <td className="p-2.5 text-right text-sm">
                            <span className={selectedLogDetail.scoreDifference > 0 ? 'text-emerald-700' : selectedLogDetail.scoreDifference < 0 ? 'text-rose-700' : 'text-slate-700'}>
                              {selectedLogDetail.scoreDifference > 0 ? `+${selectedLogDetail.scoreDifference}` : selectedLogDetail.scoreDifference} đ
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Reason */}
                {selectedLogDetail.reason && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <span className="font-bold text-amber-900 block mb-0.5">Căn cứ điều chỉnh minh bạch:</span>
                    <p className="text-amber-800 leading-relaxed">{selectedLogDetail.reason}</p>
                  </div>
                )}

                {/* Verification Seal */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" /> Bản ghi kiểm toán điện tử đã mã hóa toàn vẹn
                  </span>
                  <span>SHA-256 Verified</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedLogDetail(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition"
                >
                  Đóng chi tiết
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
