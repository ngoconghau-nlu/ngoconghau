import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { verifySync } from '../utils/verifySync';
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Database,
  ShieldCheck,
  Info,
  Cloud,
  CloudOff,
  XCircle,
  AlertCircle
} from 'lucide-react';

import { UserRole } from '../types';

function isChiDoanOrClubRole(userRole?: UserRole): boolean {
  if (!userRole) return true;
  if (userRole.roleLevel <= 2) return true; // Level 0 (Guest), 1 (Student), 2 (Chi đoàn / Tổ / Đội / Nhóm)

  const orgCode = (userRole.orgCode || '').toUpperCase();
  const orgName = (userRole.orgName || '').toLowerCase();
  const roleName = (userRole.roleName || '').toLowerCase();

  return (
    orgCode.startsWith('CLB_') ||
    orgCode.startsWith('TO_') ||
    orgCode.startsWith('DOI_') ||
    orgCode.startsWith('NHOM_') ||
    roleName.includes('câu lạc bộ') ||
    roleName.includes('clb') ||
    roleName.includes('tổ') ||
    roleName.includes('đội') ||
    roleName.includes('nhóm') ||
    orgName.startsWith('clb') ||
    orgName.startsWith('câu lạc bộ') ||
    orgName.startsWith('tổ') ||
    orgName.startsWith('đội') ||
    orgName.startsWith('nhóm')
  );
}

export const DataSyncStatus: React.FC = () => {
  const { students, activities, branchClasses, autoFixUncatalogedClasses, showToast, user, syncStatus } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Compute multi-module data quality metrics via verifySync
  const auditReport = useMemo(() => {
    const allowedClassCodes = branchClasses ? branchClasses.map(c => c.code) : undefined;
    return verifySync(
      students,
      activities,
      'Header DataSyncStatus Component',
      allowedClassCodes,
      user?.currentRole?.roleLevel
    );
  }, [students, activities, branchClasses, user?.currentRole?.roleLevel]);

  // Always render DataSyncStatus so sync status and database health can be monitored
  const totalStudents = auditReport.totalStudents;

  // Filter true quality-affecting errors (excluding membershipType warning which is not an error)
  const missingFields = auditReport.missingRequiredFieldsCount;
  const duplicateMssv = auditReport.duplicateMssvCount;
  const invalidClass = auditReport.invalidClassCodesCount;
  const facultyMismatch = auditReport.facultyClassMismatchCount;
  const scoreAnomalies = auditReport.scoreAnomalyCount;
  const orphanedParticipants = auditReport.orphanedParticipantsCount;

  const totalIssues = missingFields + duplicateMssv + invalidClass + facultyMismatch + scoreAnomalies + orphanedParticipants;

  // Data Quality Score is evaluated out of 100%
  const dataQualityPercentage = totalStudents > 0
    ? Math.max(0, Math.round(((totalStudents - totalIssues) / totalStudents) * 100))
    : 100;

  // Trigger manual refresh/recheck
  const handleTriggerRecheck = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      showToast(
        totalIssues > 0
          ? `Đã rà soát dữ liệu: Phát hiện ${totalIssues} lỗi chất lượng dữ liệu cần xử lý.`
          : 'Hệ thống đã rà soát: Dữ liệu Sinh viên, Hoạt động & Thi đua sạch 100%!',
        totalIssues > 0 ? 'warning' : 'success',
        { title: 'Kiểm Toán Hoàn Tất', category: 'system' }
      );
    }, 800);
  };

  return (
    <>
      {/* Header Status Badge / Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold transition-all duration-200 shadow-2xs hover:scale-102 cursor-pointer ${
          syncStatus.state === 'syncing'
            ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-700 ring-2 ring-sky-400/30 animate-pulse'
            : syncStatus.state === 'offline'
            ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100'
            : syncStatus.state === 'error'
            ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-900 dark:text-rose-300 border-rose-300 dark:border-rose-700'
            : totalIssues > 0
            ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100'
            : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
        }`}
        title="Kiểm tra trạng thái đồng bộ Firestore và chất lượng dữ liệu"
      >
        {syncStatus.state === 'syncing' ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 animate-spin" />
            <span className="hidden sm:inline text-[11px]">Đang đồng bộ...</span>
          </>
        ) : syncStatus.state === 'offline' ? (
          <>
            <CloudOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-[11px] hidden sm:inline">Ngoại tuyến (Offline)</span>
            <span className="text-[11px] sm:hidden">Offline</span>
          </>
        ) : syncStatus.state === 'error' ? (
          <>
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 animate-bounce" />
            <span className="text-[11px]">Lỗi đồng bộ</span>
          </>
        ) : totalIssues > 0 ? (
          <>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-bounce" />
            <span className="text-[11px]">Kiểm toán ({dataQualityPercentage}%)</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px] hidden sm:inline">Khớp & Đạt 100%</span>
            <span className="text-[11px] sm:hidden">100%</span>
          </>
        )}
      </button>

      {/* Synchronization & Audit Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-6 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  <Database className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      Kiểm Toán Chất Lượng & Đồng Bộ Dữ Liệu
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                      Real-time
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Đảm bảo tính chính xác và đồng bộ giữa Sinh viên, Hoạt động & Bảng điểm rèn luyện
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CONCEPT 1: FIRESTORE CLOUD SYNC STATE */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-sky-500" />
                <span>1. Đồng bộ đám mây (Cloud Firestore Sync)</span>
              </h4>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {syncStatus.state === 'synced' ? (
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-xl">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : syncStatus.state === 'syncing' ? (
                    <div className="p-2 bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-400 rounded-xl animate-spin">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                  ) : syncStatus.state === 'offline' ? (
                    <div className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 rounded-xl">
                      <CloudOff className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="p-2 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 rounded-xl">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  )}

                  <div>
                    <div className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                      {syncStatus.state === 'synced' && 'Đồng bộ hoàn tất (Máy chủ Live)'}
                      {syncStatus.state === 'syncing' && 'Đang đồng bộ với Firestore...'}
                      {syncStatus.state === 'offline' && 'Chế độ Ngoại tuyến (Offline persistence)'}
                      {syncStatus.state === 'error' && 'Lỗi kết nối hoặc phân quyền Firestore'}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 text-rose-600 font-semibold">
                      {syncStatus.errorMessage || 'Tất cả các thay đổi dữ liệu đã được ghi nhận trên hệ thống.'}
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-400 shrink-0">
                  {syncStatus.lastSyncedAt && (
                    <>
                      <div className="font-semibold text-slate-500">Đồng bộ cuối lúc</div>
                      <div className="font-mono mt-0.5">{new Date(syncStatus.lastSyncedAt).toLocaleTimeString('vi-VN')}</div>
                    </>
                  )}
                  {syncStatus.pendingCount > 0 && (
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-extrabold text-[10px] animate-pulse">
                      {syncStatus.pendingCount} ghi chờ
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* CONCEPT 2: DATA QUALITY AUDIT INDEX */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>2. Chỉ số chất lượng dữ liệu (Data Quality)</span>
                </h4>

                <button
                  type="button"
                  onClick={handleTriggerRecheck}
                  disabled={isVerifying}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-700/10 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} />
                  <span>Rà soát chất lượng</span>
                </button>
              </div>

              {/* Progress Bar / Gauge */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600 dark:text-slate-300">Độ sạch của dữ liệu cán bộ & sinh viên</span>
                  <span className={`text-sm font-black ${dataQualityPercentage === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {dataQualityPercentage}% Sạch
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      dataQualityPercentage === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-emerald-500'
                    }`}
                    style={{ width: `${dataQualityPercentage}%` }}
                  />
                </div>
              </div>

              {/* Issue Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {/* 1. Thiếu thông tin */}
                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 text-center">
                  <div className="text-xs text-slate-400">Thiếu thông tin</div>
                  <div className={`text-lg font-black mt-0.5 ${missingFields > 0 ? 'text-rose-600 font-black' : 'text-slate-700 dark:text-slate-300'}`}>
                    {missingFields}
                  </div>
                </div>

                {/* 2. Trùng lặp MSSV */}
                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 text-center">
                  <div className="text-xs text-slate-400">Trùng MSSV</div>
                  <div className={`text-lg font-black mt-0.5 ${duplicateMssv > 0 ? 'text-rose-600 font-black' : 'text-slate-700 dark:text-slate-300'}`}>
                    {duplicateMssv}
                  </div>
                </div>

                {/* 3. Sai mã lớp */}
                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 text-center">
                  <div className="text-xs text-slate-400">Mã lớp bất hợp lệ</div>
                  <div className={`text-lg font-black mt-0.5 ${invalidClass > 0 ? 'text-amber-600 font-black' : 'text-slate-700 dark:text-slate-300'}`}>
                    {invalidClass}
                  </div>
                </div>

                {/* 4. Lệch Khoa - Lớp */}
                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 text-center">
                  <div className="text-xs text-slate-400">Lệch Khoa - Lớp</div>
                  <div className={`text-lg font-black mt-0.5 ${facultyMismatch > 0 ? 'text-amber-600 font-black' : 'text-slate-700 dark:text-slate-300'}`}>
                    {facultyMismatch}
                  </div>
                </div>

                {/* 5. Điểm bất thường */}
                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 text-center">
                  <div className="text-xs text-slate-400">Lệch điểm rèn luyện</div>
                  <div className={`text-lg font-black mt-0.5 ${scoreAnomalies > 0 ? 'text-amber-600 font-black' : 'text-slate-700 dark:text-slate-300'}`}>
                    {scoreAnomalies}
                  </div>
                </div>

                {/* 6. Lượt tham gia mồ côi */}
                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 text-center">
                  <div className="text-xs text-slate-400">Chưa khớp ĐRL</div>
                  <div className={`text-lg font-black mt-0.5 ${orphanedParticipants > 0 ? 'text-amber-600 font-black' : 'text-slate-700 dark:text-slate-300'}`}>
                    {orphanedParticipants}
                  </div>
                </div>
              </div>
            </div>

            {/* Audit Log / Verification Note */}
            <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Quy Trình Kiểm Tra & Đồng Bộ Dữ Liệu Tự Động:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] pl-1 leading-relaxed">
                <li>
                  Hệ thống tự động liên kết mã sinh viên trong danh sách tham gia hoạt động với bộ dữ liệu Firestore collection{' '}
                  <code className="text-emerald-800 dark:text-emerald-300 font-mono font-bold">students</code>.
                </li>
                <li>
                  Tất cả điểm thưởng, điểm rèn luyện và xếp loại thi đua cấp Đoàn Khoa & Chi đoàn được tự động tính toán lại
                  ngay khi có thay đổi.
                </li>
                <li>
                  Đảm bảo không có sai lệch chỉ số giữa danh mục quản lý sinh viên và các biểu đồ báo cáo thống kê.
                </li>
              </ul>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
