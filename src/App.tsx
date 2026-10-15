import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ToastContainer } from './components/ToastContainer';
import { Footer } from './components/Footer';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AppSidebar } from './components/layout/AppSidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { MobileNavigationDrawer } from './components/header/MobileNavigationDrawer';
import { NavigationSearch } from './components/header/NavigationSearch';
import { RetryQueueBanner } from './components/RetryQueueBanner';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { lazyRetry } from './utils/lazyRetry';

// Code-splitting with React.lazy and lazyRetry for major views
const Dashboard = lazyRetry(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })), 'Dashboard');
const ActivityManagement = lazyRetry(() => import('./components/ActivityManagement'), 'ActivityManagement');
const StudentPortal = lazyRetry(() => import('./components/StudentPortal'), 'StudentPortal');
const ScoreRoster = lazyRetry(() => import('./components/ScoreRoster'), 'ScoreRoster');
const OrganizationDirectory = lazyRetry(() => import('./components/OrganizationDirectory'), 'OrganizationDirectory');
const AccountManagement = lazyRetry(() => import('./components/AccountManagement'), 'AccountManagement');
const TargetManagement = lazyRetry(() => import('./components/TargetManagement'), 'TargetManagement');
const GoogleDriveExplorer = lazyRetry(() => import('./components/GoogleDriveExplorer'), 'GoogleDriveExplorer');
const SystemActivityLogView = lazyRetry(() => import('./components/SystemActivityLogView'), 'SystemActivityLogView');
const ScoringCatalogsManagement = lazyRetry(() => import('./components/ScoringCatalogsManagement'), 'ScoringCatalogsManagement');

// Lazy-loaded on-demand modals to optimize initial app load & reduce bundle footprint
const SystemBackupModal = lazyRetry(() => import('./components/SystemBackupModal').then(m => ({ default: m.SystemBackupModal })), 'SystemBackupModal');
const HelpCenterModal = lazyRetry(() => import('./components/HelpCenterModal').then(m => ({ default: m.HelpCenterModal })), 'HelpCenterModal');
const MenuEditorModal = lazyRetry(() => import('./components/MenuEditorModal').then(m => ({ default: m.MenuEditorModal })), 'MenuEditorModal');
const HeaderLogoEditorModal = lazyRetry(() => import('./components/HeaderLogoEditorModal').then(m => ({ default: m.HeaderLogoEditorModal })), 'HeaderLogoEditorModal');
const TrashRecoveryModal = lazyRetry(() => import('./components/TrashRecoveryModal').then(m => ({ default: m.TrashRecoveryModal })), 'TrashRecoveryModal');
const FirestoreCleanupModal = lazyRetry(() => import('./components/FirestoreCleanupModal').then(m => ({ default: m.FirestoreCleanupModal })), 'FirestoreCleanupModal');
import { Breadcrumb } from './components/common/Breadcrumb';
import { AccessDenied } from './components/common/AccessDenied';
import { ScrollToTop } from './components/common/ScrollToTop';
import { hasAccessToTab } from './config/navigationConfig';
import { verifySync, VerifySyncResult } from './utils/verifySync';
import { DataSyncStatus } from './components/DataSyncStatus';
import { NotificationSystem } from './components/NotificationSystem';
import {
  LogIn,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  LogOut,
  Key,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  X,
  Menu,
  FileText,
  Download,
  PanelLeftClose,
  PanelLeft,
  Sun,
  Moon,
  Search
} from 'lucide-react';

const SsoAuthGate: React.FC = () => {
  const { googleUser, loginGoogle, logoutGoogle, isConnectingGoogle, setActiveTab, activeTab } = useApp();

  const getTabTitle = () => {
    switch (activeTab) {
      case 'targets': return 'Danh Mục Chỉ Tiêu & Đánh Giá Thông Minh';
      case 'activities': return 'Quản Lý Hoạt Động & Đăng Ký Kế Hoạch';
      case 'student-portal': return 'Cổng Sinh Viên & Nộp Minh Chứng SV5T';
      case 'score-roster': return 'Danh Mục & Sổ Điểm Rèn Luyện Sinh Viên';
      case 'faculty-emulation': return 'Bảng Xếp Hạng Thi Đua Đoàn Khoa';
      case 'branch-emulation': return 'Bảng Xếp Hạng & Thi Đua Chi Đoàn';
      case 'club-emulation': return 'Bảng Xếp Hạng & Thi Đua CLB, Tổ, Đội Nhóm';
      case 'organizations': return 'Danh Mục Đơn Vị Đoàn - Hội';
      case 'accounts': return 'Cấp Quyền Hệ Thống & Quản Lý Tài Khoản';
      case 'activity-logs': return 'Nhật Ký Hoạt Động & Kiểm Toán Hệ Thống';
      case 'drive': return 'Google Drive & Hồ Sơ Lưu Trữ';
      default: return 'Chức Năng Hệ Thống Đoàn - Hội NLU';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-colors">
        {/* Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-950 dark:from-emerald-950 dark:via-teal-950 dark:to-slate-950 text-white p-8 sm:p-10 text-center relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -left-10 -top-10 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 dark:bg-white/5 text-emerald-200 border border-white/15 dark:border-white/10 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Xác Thực Phân Quyền Google SSO
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Yêu Cầu Đăng Nhập SSO Bằng Tài Khoản Được Cấp Quyền
            </h2>

            <p className="text-sm text-emerald-100/90 dark:text-emerald-200/80 leading-relaxed">
              Bạn đang truy cập phân hệ: <strong className="text-white font-extrabold">{getTabTitle()}</strong>.
              Để thực hiện các tác vụ quản lý, đăng ký kế hoạch, nhập danh sách hoặc cấp điểm, vui lòng đăng nhập bằng tài khoản Google đã được Cấp Quyền Hệ Thống.
            </p>

            {/* Login / Auth State Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              {googleUser ? (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={loginGoogle}
                    disabled={isConnectingGoogle}
                    className="inline-flex items-center gap-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-6 py-3 rounded-2xl text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <LogIn className="w-4 h-4 text-slate-950" />
                    <span>{isConnectingGoogle ? 'Đang chuyển tài khoản...' : 'Đăng Nhập Tài Khoản Google Khác'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={logoutGoogle}
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-3 rounded-2xl text-sm transition"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Đăng Xuất</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={loginGoogle}
                  disabled={isConnectingGoogle}
                  className="inline-flex items-center gap-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black px-8 py-3.5 rounded-2xl text-sm shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.03] active:scale-95"
                >
                  <LogIn className="w-5 h-5 text-slate-950" />
                  <span>{isConnectingGoogle ? 'Đang xác thực Google SSO...' : 'Đăng Nhập Bằng Google SSO Ngay'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Account Status / Permissions Guide */}
        <div className="p-6 sm:p-8 space-y-6 gap-y-6">
          {googleUser && (
            /* Logged in with unauthorized Google email */
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 flex items-start gap-3.5 shadow-xs">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-extrabold text-amber-950 dark:text-amber-200 text-sm">
                  Tài khoản Google [{googleUser.email}] chưa được Cấp Quyền trong Hệ thống!
                </p>
                <p className="text-amber-900 dark:text-amber-300/90 leading-relaxed">
                  Email này đã được xác thực qua Google, nhưng chưa được gán vai trò cán bộ trong phân hệ <strong>Cấp Quyền Hệ Thống</strong>. Vui lòng liên hệ Quản trị viên Cấp 4 (Ban Thường vụ Đoàn trường) qua email <strong className="font-mono text-emerald-800 dark:text-emerald-400">doanhoi@hcmuaf.edu.vn</strong> để được cấp quyền theo đơn vị của bạn.
                </p>
              </div>
            </div>
          )}

          {/* Unified Permissions Guide Grid */}
          <div className="space-y-4 gap-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Cơ Chế Phân Quyền Tự Động Theo Tài Khoản Google SSO
              </h4>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                4 Cấp Bậc Thẩm Quyền Chuẩn Hóa
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Level 4: BTV Đoàn Trường */}
              <div className="bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/70 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4.5 flex flex-col justify-between space-y-3.5 transform hover:scale-105 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-md transition-all duration-200 cursor-default">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700/60 flex items-center justify-center text-xs font-black shrink-0">
                      L4
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 uppercase tracking-wide">
                      Toàn Trường
                    </span>
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                      Cấp 4: BTV Đoàn Trường (Admin)
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                      Toàn quyền quản trị hệ thống, phê duyệt kế hoạch toàn trường, cấp quyền tài khoản Google SSO và khóa sổ dữ liệu.
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/60 flex flex-wrap gap-1.5 text-[10px]">
                  <span className="px-2 py-0.5 rounded-md font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    Phê duyệt toàn trường
                  </span>
                  <span className="px-2 py-0.5 rounded-md font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    Cấp quyền SSO & Thùng rác
                  </span>
                </div>
              </div>

              {/* Level 3: BCH Đoàn Khoa / CLB Trường */}
              <div className="bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/70 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4.5 flex flex-col justify-between space-y-3.5 transform hover:scale-105 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-md transition-all duration-200 cursor-default">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200 border border-blue-300/80 dark:border-blue-700/60 flex items-center justify-center text-xs font-black shrink-0">
                      L3
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 uppercase tracking-wide">
                      Cấp Khoa / CLB Trường
                    </span>
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                      Cấp 3: BCH Đoàn Khoa / CLB Trường
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                      Quản lý hoạt động Đoàn khoa, thẩm định điểm rèn luyện và theo dõi bảng xếp hạng thi đua các Chi đoàn trực thuộc.
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/60 flex flex-wrap gap-1.5 text-[10px]">
                  <span className="px-2 py-0.5 rounded-md font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    Thẩm định điểm Đoàn khoa
                  </span>
                  <span className="px-2 py-0.5 rounded-md font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    Xếp hạng thi đua Chi đoàn
                  </span>
                </div>
              </div>

              {/* Level 2: Ban Chấp Hành Chi Đoàn / CLB */}
              <div className="bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/70 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4.5 flex flex-col justify-between space-y-3.5 transform hover:scale-105 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-md transition-all duration-200 cursor-default">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-200 border border-emerald-300/80 dark:border-emerald-700/60 flex items-center justify-center text-xs font-black shrink-0">
                      L2
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 uppercase tracking-wide">
                      Cơ Sở Chi Đoàn
                    </span>
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                      Cấp 2: Ban Chấp Hành Chi Đoàn / CLB
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                      Đăng ký chương trình, nạp danh sách tham gia từ Excel và đánh giá 4 mức chuẩn đoàn viên của Chi đoàn.
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/60 flex flex-wrap gap-1.5 text-[10px]">
                  <span className="px-2 py-0.5 rounded-md font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    Đăng ký & Nạp Excel
                  </span>
                  <span className="px-2 py-0.5 rounded-md font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    Đánh giá 4 mức chuẩn
                  </span>
                </div>
              </div>

              {/* Level 1: Cá Nhân Sinh Viên / Đoàn Viên */}
              <div className="bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/70 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4.5 flex flex-col justify-between space-y-3.5 transform hover:scale-105 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-md transition-all duration-200 cursor-default">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/50 text-teal-900 dark:text-teal-200 border border-teal-300/80 dark:border-teal-700/60 flex items-center justify-center text-xs font-black shrink-0">
                      L1
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/60 uppercase tracking-wide">
                      Cá Nhân Sinh Viên
                    </span>
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                      Cấp 1: Cá Nhân Sinh Viên / Đoàn Viên
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                      Tra cứu sổ điểm ĐRL cá nhân, nộp hồ sơ minh chứng Google Drive và theo dõi tiến độ danh hiệu Sinh viên 5 tốt.
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/60 flex flex-wrap gap-1.5 text-[10px]">
                  <span className="px-2 py-0.5 rounded-md font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    Tra cứu sổ điểm ĐRL
                  </span>
                  <span className="px-2 py-0.5 rounded-md font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    Nộp minh chứng SV5T
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Fallback back to Dashboard button */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Bạn vẫn có thể xem các bảng thống kê và báo cáo xếp hạng công khai trên Dashboard.
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition"
            >
              Về Dashboard Công Khai <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Dedicated Toast component that performs a runtime cross-check using verifySync
 * and displays detailed discrepancy error alerts when Firestore collections are not synced.
 */
const SyncErrorToast: React.FC = () => {
  const { user, students, activities, branchClasses, autoFixUncatalogedClasses, showToast } = useApp();
  const [syncResult, setSyncResult] = useState<VerifySyncResult | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (students && activities) {
      const allowedClassCodes = branchClasses ? branchClasses.map(c => c.code) : undefined;
      const res = verifySync(
        students,
        activities,
        'App.tsx Sync Monitor',
        allowedClassCodes,
        user?.currentRole?.roleLevel
      );
      setSyncResult(res);
      if (!res.isSynced) {
        setIsDismissed(false);
      }
    }
  }, [students, activities, branchClasses, user?.currentRole?.roleLevel]);

  const handleExportDiagnosticData = () => {
    if (!students || !activities) return;

    const timestamp = new Date().toISOString();
    const diagnosticPayload = {
      diagnosticType: 'FIRESTORE_SYNC_CACHE_EXPORT',
      exportedAt: timestamp,
      userContext: {
        email: user?.email,
        studentId: user?.studentId,
        roleLevel: user?.currentRole?.roleLevel,
        roleName: user?.currentRole?.roleName,
        orgCode: user?.currentRole?.orgCode,
      },
      syncVerificationResult: syncResult,
      summary: {
        studentsCount: students.length,
        activitiesCount: activities.length,
        discrepanciesCount: syncResult?.discrepancies.length || 0,
        orphanedCount: syncResult?.orphanedDetails.length || 0,
      },
      studentsState: students,
      activitiesState: activities,
    };

    // 1. Output rich diagnostic dump to browser console
    console.group(`🚨 [FIRESTORE SYNC DIAGNOSTIC DATA EXPORT] ${timestamp}`);
    console.warn(`User Context:`, diagnosticPayload.userContext);
    console.warn(`Sync Verification Result:`, syncResult);
    console.log(`Summary Counts:`, diagnosticPayload.summary);
    console.log(`Current 'students' state (${students.length} records):`, students);
    console.log(`Current 'activities' state (${activities.length} records):`, activities);
    console.groupEnd();

    // 2. Trigger browser download of diagnostic JSON payload
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(diagnosticPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `firestore_sync_diagnostic_${timestamp.replace(/[:.]/g, '-')}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      if (showToast) {
        showToast(
          `Đã xuất file Diagnostic JSON & ghi log ${students.length} SV / ${activities.length} Hoạt động lên Console F12!`,
          'info',
          { title: 'Export Diagnostic Data' }
        );
      }
    } catch (err) {
      console.error('Failed to download diagnostic data JSON file:', err);
    }
  };

  if (!syncResult || syncResult.isSynced || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-lg w-full animate-in slide-in-from-top-4 duration-300 pointer-events-auto">
      <div className="bg-rose-950/95 dark:bg-rose-950/95 text-white border-2 border-rose-600 rounded-2xl p-4 shadow-2xl shadow-rose-950/50 backdrop-blur-md relative overflow-hidden">
        {/* Accent Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 animate-pulse" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-900/80 border border-rose-500/50 text-rose-300 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-rose-600 text-white tracking-wider">
                  Cảnh Báo Firestore
                </span>
                <h4 className="font-extrabold text-sm text-rose-100">
                  Phát Hiện Lỗi Không Đồng Bộ Collections
                </h4>
              </div>
              <p className="text-xs text-rose-200/90 mt-1 leading-relaxed">
                Hàm <code className="font-mono bg-rose-900/60 px-1 py-0.5 rounded text-amber-300">verifySync</code> đã phát hiện <strong>{syncResult.discrepancies.length} bất thường</strong> giữa dữ liệu Sinh viên và Hoạt động.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-lg hover:bg-rose-900/60 text-rose-300 hover:text-white transition cursor-pointer"
            title="Đóng cảnh báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Detailed Discrepancy List */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-rose-800/80 space-y-2 text-xs animate-in fade-in duration-200">
            <div className="font-bold text-amber-300 text-[11px] uppercase tracking-wide flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              Chi Tiết Sai Lệch Dữ Liệu ({syncResult.timestamp.split('T')[1]?.split('.')[0] || ''}):
            </div>
            <ul className="space-y-1.5 list-disc list-inside text-rose-100/90 bg-rose-900/40 p-2.5 rounded-xl border border-rose-800/60 text-[11px] max-h-36 overflow-y-auto no-scrollbar font-sans">
              {syncResult.discrepancies.map((disc, idx) => (
                <li key={idx} className="leading-snug">{disc}</li>
              ))}
            </ul>

            {syncResult.orphanedDetails.length > 0 && (
              <div className="p-2 bg-amber-950/80 rounded-xl border border-amber-800/60 text-[11px] text-amber-200">
                <span className="font-bold block text-amber-300">Danh sách MSSV mồ côi (chưa có trong 'students'):</span>
                <div className="flex flex-wrap gap-1 mt-1 font-mono text-[10px]">
                  {syncResult.orphanedDetails.slice(0, 5).map((o, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-amber-900/80 rounded border border-amber-700/60 text-amber-100">
                      {o.studentId} ({o.activityId})
                    </span>
                  ))}
                  {syncResult.orphanedDetails.length > 5 && (
                    <span className="text-amber-400 font-bold self-center">+{syncResult.orphanedDetails.length - 5} MSSV khác</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="mt-3 pt-2.5 border-t border-rose-800/60 flex items-center justify-between text-xs gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 font-bold text-[11px] transition cursor-pointer"
          >
            <span>{isExpanded ? 'Thu gọn chi tiết' : 'Xem chi tiết cảnh báo'}</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </button>

          <div className="flex items-center gap-2">
            {syncResult.invalidClassCodesCount > 0 && (
              <button
                type="button"
                onClick={() => autoFixUncatalogedClasses()}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg text-[11px] shadow-xs transition cursor-pointer active:scale-95"
                title="Tự động bổ sung các mã lớp sinh viên chưa có vào danh mục Lớp chính thức của Nhà trường"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>Bổ Sung {syncResult.invalidClassCodesCount} Lớp Vào Danh Mục</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportDiagnosticData}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-900/80 hover:bg-amber-800 border border-amber-600/80 text-amber-100 font-bold rounded-lg text-[11px] transition cursor-pointer shadow-2xs"
              title="Xuất dữ liệu sinh viên & hoạt động hiện tại để đối soát Firestore cache"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>Export Diagnostic Data</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (students && activities) {
                  const res = verifySync(students, activities, 'App.tsx Manual Re-check');
                  setSyncResult(res);
                }
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-900 hover:bg-rose-800 border border-rose-700 text-rose-100 font-bold rounded-lg text-[11px] transition cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-rose-300" />
              <span>Kiểm tra lại</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MainContent: React.FC = () => {
  const { activeTab, setActiveTab, user, academicYear, theme, toggleTheme } = useApp();
  const userRoleLevel = user.currentRole.roleLevel ?? 0;
  const isGuest = userRoleLevel === 0;

  // Sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('nlu_sidebar_collapsed') === 'true';
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('nlu_sidebar_collapsed', String(next)); } catch {}
      return next;
    });
  };

  // Modals & Drawer State
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showMenuEditorModal, setShowMenuEditorModal] = useState(false);
  const [showLogoEditorModal, setShowLogoEditorModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [menuEditorInitialTab, setMenuEditorInitialTab] = useState<any>('menu');

  // Global keyboard shortcut for search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearchModal(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenMenuEditorWithTab = (tab?: string) => {
    setMenuEditorInitialTab(tab || 'menu');
    setShowMenuEditorModal(true);
  };

  // Strict route authorization check
  const isAuthorized = hasAccessToTab(activeTab, userRoleLevel);

  return (
    <div className="h-screen flex bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-hidden">
      {/* 1. Desktop Collapsible Sidebar */}
      <AppSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        onOpenMenuEditor={handleOpenMenuEditorWithTab}
        onOpenLogoEditor={() => setShowLogoEditorModal(true)}
        onOpenBackup={() => setShowBackupModal(true)}
        onOpenTrash={() => setShowTrashModal(true)}
        onOpenHelp={() => setShowHelpModal(true)}
      />

      {/* 2. Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Global Toast Stack Notifications */}
        <ToastContainer />

        {/* Dedicated Firestore Sync Error Toast */}
        <SyncErrorToast />

        {/* PWA Offline Mode Indicator */}
        <OfflineIndicator />

        {/* Wide Responsive Content Area with Optimized Spacing & Readability */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 pb-20 lg:pb-6 max-w-[1800px] w-full mx-auto space-y-4 sm:space-y-5 custom-scrollbar transition-all">
          {/* Firestore Write Operations Retry Queue Banner */}
          <RetryQueueBanner onOpenCleanup={() => setShowCleanupModal(true)} />

          {/* Minimalist Responsive Header & Utility Bar */}
          {isAuthorized && (
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-medium py-1 px-1 border-b border-slate-200/60 dark:border-slate-800/80">
              {/* Left: Sidebar Toggle, Mobile Menu & User Role Context */}
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 min-w-0">
                {/* Desktop Sidebar Toggle */}
                <button
                  type="button"
                  onClick={toggleSidebarCollapse}
                  className="hidden lg:inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs transition cursor-pointer"
                  title={isSidebarCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
                  aria-label="Thu gọn/mở rộng sidebar"
                >
                  {isSidebarCollapsed ? <PanelLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <PanelLeftClose className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
                </button>

                {/* Mobile / Tablet Drawer Trigger */}
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(true)}
                  className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs shadow-xs transition cursor-pointer shrink-0"
                  title="Mở menu điều hướng di động"
                  aria-label="Mở menu"
                >
                  <Menu className="w-4 h-4 shrink-0" />
                  <span>Menu</span>
                </button>

                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="truncate">
                    Xin chào, <strong className="text-slate-900 dark:text-white font-bold">{user.fullName || 'Thành viên NLU'}</strong>
                  </span>
                  <span className="hidden sm:inline text-slate-300 dark:text-slate-700 font-bold">•</span>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 text-[10.5px] font-bold">
                    Cấp {userRoleLevel}: {user.currentRole.roleName}
                  </span>
                </div>
              </div>

              {/* Right: Search, Theme Toggle, Data Sync, Notifications & Academic Year */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Search Spotlight Shortcut */}
                <button
                  type="button"
                  onClick={() => setShowSearchModal(true)}
                  className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs transition cursor-pointer text-xs font-semibold"
                  title="Tìm kiếm chức năng nhanh (Ctrl+K / ⌘K)"
                >
                  <Search className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden md:inline">Tìm kiếm</span>
                  <kbd className="hidden lg:inline text-[9.5px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-1 py-0.2 rounded">
                    ⌘K
                  </kbd>
                </button>

                {/* Dark Mode Toggle */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs transition flex items-center justify-center cursor-pointer"
                  title={theme === 'dark' ? 'Chế độ Sáng' : 'Chế độ Tối'}
                  aria-label="Đổi giao diện Sáng / Tối"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-slate-600" />
                  )}
                </button>

                {/* Live Firestore Sync Status */}
                <DataSyncStatus />

                {/* System Notifications */}
                <NotificationSystem />

                {/* Academic Year Pill */}
                <span className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 text-[11px] font-bold">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>{academicYear.replace(/^(Năm học\s*)+/i, 'NH ')}</span>
                </span>
              </div>
            </div>
          )}

          {/* Dynamic Contextual Breadcrumb */}
          {isAuthorized && <Breadcrumb />}

          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="py-24 flex flex-col items-center justify-center space-y-3 animate-in fade-in duration-200">
                  <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Đang tải phân hệ dữ liệu NLU Youth...</p>
                </div>
              }
            >
              {!isAuthorized ? (
                <AccessDenied requestedTab={activeTab} />
              ) : (
                <>
                  {activeTab === 'dashboard' && <Dashboard />}
                  {(activeTab === 'targets' || activeTab === 'targets-kpi') && <TargetManagement initialSubTab="overview" />}
                  {activeTab === 'targets-units' && <TargetManagement initialSubTab="hierarchical" />}
                  {activeTab === 'activities' && <ActivityManagement />}
                  {(activeTab === 'student-portal' || activeTab === 'portal-records') && <StudentPortal initialSubTab="records" />}
                  {activeTab === 'portal-sv5t' && <StudentPortal initialSubTab="sv5t" />}
                  {(activeTab === 'score-roster' || activeTab === 'faculty-emulation' || activeTab === 'branch-emulation' || activeTab === 'club-emulation') && (
                    <ScoreRoster defaultSubTab={
                      activeTab === 'faculty-emulation' ? 'faculty-emulation' :
                      activeTab === 'branch-emulation' ? 'branch-emulation' :
                      activeTab === 'club-emulation' ? 'club-emulation' :
                      'student-roster'
                    } />
                  )}
                  {activeTab === 'organizations' && <OrganizationDirectory />}
                  {activeTab === 'accounts' && <AccountManagement />}
                  {activeTab === 'activity-logs' && <SystemActivityLogView />}
                  {activeTab === 'drive' && <GoogleDriveExplorer />}
                  {activeTab === 'system-catalogs' && <ScoringCatalogsManagement />}
                  {isGuest && activeTab === 'auth-gate' && <SsoAuthGate />}
                </>
              )}
            </Suspense>
          </ErrorBoundary>
        </main>

        {/* Dynamic Customizable Footer */}
        <Footer />
      </div>

      {/* Floating Scroll to Top Button */}
      <ScrollToTop />

      {/* Mobile Native-Style Bottom Navigation Bar */}
      <MobileBottomNav onOpenMobileDrawer={() => setMobileDrawerOpen(true)} />

      {/* Mobile / Tablet Slide-over Navigation Drawer */}
      <MobileNavigationDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        onOpenHelp={() => setShowHelpModal(true)}
        onOpenLogoEditor={() => setShowLogoEditorModal(true)}
        onOpenTrash={() => setShowTrashModal(true)}
        onOpenBackup={() => setShowBackupModal(true)}
        onOpenSearch={() => setShowSearchModal(true)}
      />

      {/* Quick Search Spotlight Modal */}
      <NavigationSearch
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSelectTab={(tabId) => {
          if (tabId === 'system-ui-branding') {
            setShowLogoEditorModal(true);
          } else if (tabId === 'system-backup') {
            setShowBackupModal(true);
          } else if (tabId === 'system-trash') {
            setShowTrashModal(true);
          } else if (tabId === 'system-help') {
            setShowHelpModal(true);
          } else {
            setActiveTab(tabId);
          }
        }}
      />

      {/* Shared Modals - On-demand Lazy Loading */}
      {showBackupModal && (
        <Suspense fallback={null}>
          <SystemBackupModal isOpen={showBackupModal} onClose={() => setShowBackupModal(false)} onOpenCleanup={() => setShowCleanupModal(true)} />
        </Suspense>
      )}
      {showHelpModal && (
        <Suspense fallback={null}>
          <HelpCenterModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
        </Suspense>
      )}
      {showMenuEditorModal && (
        <Suspense fallback={null}>
          <MenuEditorModal
            isOpen={showMenuEditorModal}
            onClose={() => setShowMenuEditorModal(false)}
            initialTab={menuEditorInitialTab}
          />
        </Suspense>
      )}
      {showLogoEditorModal && (
        <Suspense fallback={null}>
          <HeaderLogoEditorModal isOpen={showLogoEditorModal} onClose={() => setShowLogoEditorModal(false)} />
        </Suspense>
      )}
      {showTrashModal && (
        <Suspense fallback={null}>
          <TrashRecoveryModal isOpen={showTrashModal} onClose={() => setShowTrashModal(false)} />
        </Suspense>
      )}
      {showCleanupModal && (
        <Suspense fallback={null}>
          <FirestoreCleanupModal isOpen={showCleanupModal} onClose={() => setShowCleanupModal(false)} />
        </Suspense>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
