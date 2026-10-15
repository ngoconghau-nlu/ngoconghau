import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  TargetItem,
  TargetCategory,
  TargetSubAllocation,
  TargetAiForecastStatus,
  TargetOrgType,
  TargetRegistrationStatus,
  TARGET_CATEGORY_LABELS,
  TargetEvidenceCheck,
  ActivitySubmission
} from '../types';
import { calculateTargetAiForecast } from '../data/initialTargets';
import {
  ORGANIZATIONS_LIST,
  BRANCH_CLASSES,
  DOAN_PROGRAMS,
  HOI_PROGRAMS
} from '../data/mockData';
import {
  Target,
  Plus,
  Search,
  Filter,
  Sparkles,
  Lock,
  Unlock,
  Edit,
  Trash2,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Upload,
  RefreshCw,
  BarChart3,
  PieChart,
  Layers,
  Building,
  TrendingUp,
  Award,
  ChevronRight,
  ShieldCheck,
  ArrowUpRight,
  ExternalLink,
  SlidersHorizontal,
  X,
  FileSpreadsheet,
  Printer,
  BellRing,
  Send,
  CheckCheck,
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

interface TargetManagementProps {
  initialSubTab?: 'overview' | 'analytics' | 'hierarchical' | 'ai-audit';
}

export const TargetManagement: React.FC<TargetManagementProps> = ({ initialSubTab }) => {
  const {
    targets,
    addTarget,
    updateTarget,
    deleteTarget,
    toggleLockTarget,
    allocateSubTarget,
    batchImportTargets,
    restoreSampleTargets,
    autoAllocateUnregisteredUnits,
    approveUnitRegistration,
    rejectUnitRegistration,
    submitUnitRegistration,
    syncTargetActivitiesFromPrograms,
    activities,
    allActivities,
    user,
    academicYear,
    showToast,
    setActiveTab
  } = useApp();

  const userLevel = user.currentRole.roleLevel;
  const isLevel4 = userLevel === 4;
  const isLevel3Or4 = userLevel >= 3;
  const isLevel2OrAbove = userLevel >= 2;

  // 1. Phân loại 2 Tab chính: Đoàn Thanh niên vs Hội Sinh viên
  const [activeOrgTab, setActiveOrgTab] = useState<TargetOrgType>('DOAN');

  // Sub-tab: 'overview' (Bảng trung tâm), 'analytics' (Dashboard đa chiều), 'hierarchical' (Mô hình phân cấp & Đăng ký), 'ai-audit' (Đối soát & Đề xuất AI)
  const [subTab, setSubTab] = useState<'overview' | 'analytics' | 'hierarchical' | 'ai-audit'>(initialSubTab || 'overview');

  React.useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [programFilter, setProgramFilter] = useState<string>('ALL'); // Lọc theo mảng công tác C.14 hoặc C.13
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [registrationStatusFilter, setRegistrationStatusFilter] = useState<string>('ALL');
  const [selectedTargetForDetail, setSelectedTargetForDetail] = useState<TargetItem | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState<TargetItem | null>(null);
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [targetForAlloc, setTargetForAlloc] = useState<TargetItem | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [targetForRegistration, setTargetForRegistration] = useState<TargetItem | null>(null);
  const [showSchoolDecisionModal, setShowSchoolDecisionModal] = useState(false);
  const [targetForDecision, setTargetForDecision] = useState<TargetItem | null>(null);
  const [unitForDecision, setUnitForDecision] = useState<TargetSubAllocation | null>(null);
  const [showAutoAllocateModal, setShowAutoAllocateModal] = useState(false);
  const [targetForAutoAllocate, setTargetForAutoAllocate] = useState<TargetItem | null>(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [targetForEvidence, setTargetForEvidence] = useState<TargetItem | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [targetForLock, setTargetForLock] = useState<TargetItem | null>(null);
  const [lockReasonInput, setLockReasonInput] = useState('');

  // AI Scanning State
  const [isScanning, setIsScanning] = useState(false);

  // Programs corresponding to current tab
  const activePrograms = useMemo(() => {
    return activeOrgTab === 'DOAN' ? DOAN_PROGRAMS : HOI_PROGRAMS;
  }, [activeOrgTab]);

  // Current tab targets
  const tabTargets = useMemo(() => {
    return targets.filter(t => (t.orgType || 'DOAN') === activeOrgTab);
  }, [targets, activeOrgTab]);

  // KPI Statistics Calculation for current active tab
  const stats = useMemo(() => {
    const total = tabTargets.length;
    if (total === 0) {
      return {
        total: 0,
        avgCompletion: 0,
        datCount: 0,
        baoDongCount: 0,
        nguyCoCount: 0,
        totalUnitsAllocated: 0,
        totalLinkedActivities: 0,
        totalUnregisteredUnits: 0
      };
    }

    const totalRate = tabTargets.reduce((sum, t) => sum + (t.completionRate || 0), 0);
    const avgCompletion = Math.round((totalRate / total) * 10) / 10;
    const datCount = tabTargets.filter(t => t.aiForecastStatus === 'DAT').length;
    const baoDongCount = tabTargets.filter(t => t.aiForecastStatus === 'BAO_DONG').length;
    const nguyCoCount = tabTargets.filter(t => t.aiForecastStatus === 'NGUY_CO').length;
    const totalUnitsAllocated = tabTargets.reduce((sum, t) => sum + (t.allocatedUnitsCount || (t.allocations?.length || 0)), 0);
    const totalLinkedActivities = tabTargets.reduce((sum, t) => sum + (t.linkedActivityCount || (t.linkedActivityIds?.length || 0)), 0);
    const totalUnregisteredUnits = tabTargets.reduce((sum, t) => {
      const unreg = (t.allocations || []).filter(a => a.registrationStatus === 'CHUA_DANG_KY').length;
      return sum + (t.unregisteredUnitsCount || unreg);
    }, 0);

    return {
      total,
      avgCompletion,
      datCount,
      baoDongCount,
      nguyCoCount,
      totalUnitsAllocated,
      totalLinkedActivities,
      totalUnregisteredUnits
    };
  }, [tabTargets]);

  // Filtered Targets List for table
  const filteredTargets = useMemo(() => {
    return tabTargets.filter(t => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = t.code.toLowerCase().includes(q);
        const matchName = t.name.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchProg = t.programText?.toLowerCase().includes(q) || t.programId?.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchDesc && !matchProg) return false;
      }
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
      if (programFilter !== 'ALL' && t.programId !== programFilter) return false;
      if (statusFilter !== 'ALL' && t.aiForecastStatus !== statusFilter) return false;
      if (registrationStatusFilter !== 'ALL') {
        const hasMatchingAlloc = (t.allocations || []).some(a => a.registrationStatus === registrationStatusFilter);
        if (!hasMatchingAlloc) return false;
      }
      return true;
    });
  }, [tabTargets, searchQuery, categoryFilter, programFilter, statusFilter, registrationStatusFilter]);

  // AI forecast status visual helpers
  const getForecastBadge = (status: TargetAiForecastStatus) => {
    switch (status) {
      case 'DAT':
        return {
          label: 'Đạt kỳ vọng',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
          dotClass: 'bg-emerald-500'
        };
      case 'BAO_DONG':
        return {
          label: 'Báo động',
          badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-700',
          dotClass: 'bg-amber-500'
        };
      case 'NGUY_CO':
        return {
          label: 'Nguy cơ thiếu hụt',
          badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-700 animate-pulse',
          dotClass: 'bg-rose-500'
        };
      default:
        return {
          label: 'Chưa phân tích',
          badgeClass: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
          dotClass: 'bg-gray-400'
        };
    }
  };

  const getRegistrationBadge = (status?: TargetRegistrationStatus, isAuto?: boolean) => {
    if (isAuto) {
      return {
        label: 'Trường phân bổ trực tiếp',
        badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300 dark:border-purple-700',
        icon: Award
      };
    }
    switch (status) {
      case 'DA_DUYET':
        return {
          label: 'Đã phê duyệt',
          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
          icon: CheckCircle2
        };
      case 'CHO_DUYET':
        return {
          label: 'Chờ duyệt',
          badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-700',
          icon: Clock
        };
      case 'TU_CHOI':
        return {
          label: 'Yêu cầu điều chỉnh',
          badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-700',
          icon: AlertCircle
        };
      case 'CHUA_DANG_KY':
      default:
        return {
          label: 'Chưa đăng ký',
          badgeClass: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700',
          icon: AlertTriangle
        };
    }
  };

  // Run AI sync for linked activities
  const handleTriggerSync = () => {
    setIsScanning(true);
    setTimeout(() => {
      syncTargetActivitiesFromPrograms();
      setIsScanning(false);
    }, 600);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ==================================================================== */}
      {/* 1. TOP HEADER & 2 MAIN TABS: ĐOÀN THANH NIÊN & HỘI SINH VIÊN */}
      {/* ==================================================================== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${activeOrgTab === 'DOAN' ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-teal-600 text-white shadow-teal-500/20'} shadow-md`}>
              <Target className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Danh Mục Chỉ Tiêu & Đánh Giá Thông Minh
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> AI Forecast
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Theo dõi tiến độ thời gian thực, cơ chế phân cấp đa tầng và tự động đối soát hoạt động Đoàn - Hội {academicYear}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleTriggerSync}
              disabled={isScanning}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 transition-colors shadow-sm disabled:opacity-50"
              title="Tự động quét và liên kết các hoạt động đã hoàn thành khớp với mảng công tác"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Đang đối soát...' : 'Đối soát Hoạt động'}</span>
            </button>

            {isLevel3Or4 && (
              <button
                onClick={() => {
                  setEditingTarget(null);
                  setShowCreateModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm chỉ tiêu</span>
              </button>
            )}

            <button
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors border border-gray-300 dark:border-gray-600"
            >
              <Download className="w-4 h-4" />
              <span>Xuất báo cáo</span>
            </button>
          </div>
        </div>

        {/* 2 MAIN TABS: ĐOÀN THANH NIÊN & HỘI SINH VIÊN */}
        <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex p-1 bg-gray-100 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700 w-full sm:w-auto">
              <button
                onClick={() => {
                  setActiveOrgTab('DOAN');
                  setProgramFilter('ALL');
                }}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeOrgTab === 'DOAN'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${activeOrgTab === 'DOAN' ? 'bg-white' : 'bg-blue-500'}`} />
                <span>ĐOÀN THANH NIÊN</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${activeOrgTab === 'DOAN' ? 'bg-blue-700 text-blue-100' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                  C.14 (22 Mảng CT)
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveOrgTab('HOI');
                  setProgramFilter('ALL');
                }}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeOrgTab === 'HOI'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${activeOrgTab === 'HOI' ? 'bg-white' : 'bg-teal-500'}`} />
                <span>HỘI SINH VIÊN</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${activeOrgTab === 'HOI' ? 'bg-teal-700 text-teal-100' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                  C.13 (14 Mảng CT)
                </span>
              </button>
            </div>

            {/* Sub-view Navigation Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSubTab('overview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  subTab === 'overview'
                    ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Bảng Chỉ Tiêu</span>
              </button>

              <button
                onClick={() => setSubTab('analytics')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  subTab === 'analytics'
                    ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Dashboard Đa Chiều</span>
              </button>

              <button
                onClick={() => setSubTab('hierarchical')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  subTab === 'hierarchical'
                    ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Mô Hình Phân Cấp & Đăng Ký</span>
                {stats.totalUnregisteredUnits > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </button>

              <button
                onClick={() => setSubTab('ai-audit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  subTab === 'ai-audit'
                    ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Đối Soát Minh Chứng AI</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. STATS KPI CARDS FOR ACTIVE ORG TAB */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-medium">
            <span>Tổng chỉ tiêu ({activeOrgTab === 'DOAN' ? 'Đoàn' : 'Hội'})</span>
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">chỉ tiêu</span>
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <span>Hoạt động gắn kết:</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{stats.totalLinkedActivities} sự kiện</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-medium">
            <span>Tỷ lệ hoàn thành trung bình</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.avgCompletion}%</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">tiến độ</span>
          </div>
          <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stats.avgCompletion)}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-medium">
            <span>Dự báo AI khả năng đạt</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="text-center">
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{stats.datCount}</span>
              <p className="text-[10px] text-gray-500">Đạt</p>
            </div>
            <div className="text-center">
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{stats.baoDongCount}</span>
              <p className="text-[10px] text-gray-500">Báo động</p>
            </div>
            <div className="text-center">
              <span className="text-lg font-bold text-rose-600 dark:text-rose-400">{stats.nguyCoCount}</span>
              <p className="text-[10px] text-gray-500">Nguy cơ</p>
            </div>
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            {stats.nguyCoCount > 0 ? (
              <span className="text-rose-600 dark:text-rose-400 font-medium">Cần bổ sung hoạt động</span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Tiến độ khả quan</span>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-medium">
            <span>Phân cấp & Đăng ký đơn vị</span>
            <Building className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalUnitsAllocated}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">lượt đơn vị</span>
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
            <span>Chưa đăng ký:</span>
            {stats.totalUnregisteredUnits > 0 ? (
              <span className="font-semibold text-rose-600 dark:text-rose-400">{stats.totalUnregisteredUnits} đơn vị</span>
            ) : (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">100% đã đăng ký</span>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. SUBTAB CONTENT RENDERING */}
      {/* ==================================================================== */}

      {/* SUBTAB 1: OVERVIEW TABLE */}
      {subTab === 'overview' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Search */}
              <div className="relative min-w-[240px] flex-1 max-w-sm">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm mã, tên chỉ tiêu, mảng CT..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Mảng công tác C.14 or C.13 Filter */}
              <div className="min-w-[200px]">
                <select
                  value={programFilter}
                  onChange={e => setProgramFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">
                    Tất cả mảng công tác ({activeOrgTab === 'DOAN' ? 'C.14 Đoàn' : 'C.13 Hội'})
                  </option>
                  {activePrograms.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.id}. {p.title.length > 50 ? p.title.slice(0, 50) + '...' : p.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status AI Filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Tất cả dự báo AI</option>
                <option value="DAT">Đạt kỳ vọng</option>
                <option value="BAO_DONG">Báo động</option>
                <option value="NGUY_CO">Nguy cơ thiếu hụt</option>
              </select>

              {/* Sub-allocation Registration Status Filter */}
              <select
                value={registrationStatusFilter}
                onChange={e => setRegistrationStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Tất cả trạng thái đăng ký</option>
                <option value="CHUA_DANG_KY">Có đơn vị chưa đăng ký</option>
                <option value="CHO_DUYET">Có đơn vị chờ duyệt</option>
                <option value="DA_DUYET">Đã duyệt phân bổ</option>
                <option value="TU_CHOI">Yêu cầu điều chỉnh</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Hiển thị: <strong>{filteredTargets.length}</strong> / {tabTargets.length} chỉ tiêu</span>
              {(searchQuery || programFilter !== 'ALL' || statusFilter !== 'ALL' || registrationStatusFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setProgramFilter('ALL');
                    setStatusFilter('ALL');
                    setRegistrationStatusFilter('ALL');
                  }}
                  className="text-blue-600 hover:underline ml-2"
                >
                  Xóa lọc
                </button>
              )}
            </div>
          </div>

          {/* Central Target Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 w-28">Mã & Cấp</th>
                    <th className="py-3.5 px-4 min-w-[280px]">Tên Chỉ Tiêu & Mảng Công Tác</th>
                    <th className="py-3.5 px-4 w-36 text-center">Chỉ Số & Mục Tiêu</th>
                    <th className="py-3.5 px-4 w-48 text-center">Tiến Độ Thực Tế</th>
                    <th className="py-3.5 px-4 w-40 text-center">Phân Bổ & Liên Kết</th>
                    <th className="py-3.5 px-4 w-36 text-center">Dự Báo AI</th>
                    <th className="py-3.5 px-4 w-44 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredTargets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500 dark:text-gray-400">
                        <Target className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="font-medium text-base">Không tìm thấy chỉ tiêu nào phù hợp</p>
                        <p className="text-xs mt-1">Vui lòng điều chỉnh lại bộ lọc hoặc tạo chỉ tiêu mới</p>
                        {isLevel3Or4 && (
                          <button
                            onClick={() => {
                              setEditingTarget(null);
                              setShowCreateModal(true);
                            }}
                            className="mt-3 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                          >
                            + Tạo chỉ tiêu mới
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredTargets.map(target => {
                      const forecastBadge = getForecastBadge(target.aiForecastStatus);
                      const unregUnits = (target.allocations || []).filter(a => a.registrationStatus === 'CHUA_DANG_KY');

                      return (
                        <tr
                          key={target.id}
                          className="hover:bg-gray-50/80 dark:hover:bg-gray-750 transition-colors group"
                        >
                          {/* Mã & Cấp */}
                          <td className="py-4 px-4 align-top">
                            <div className="flex flex-col gap-1">
                              <span className="font-mono font-bold text-gray-900 dark:text-white text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded w-max">
                                {target.code}
                              </span>
                              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                                {target.level === 'TRUONG' ? 'Cấp Trường' : target.level === 'KHOA' ? 'Cấp Khoa' : 'Cơ sở'}
                              </span>
                              {target.isLocked && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300 font-medium">
                                  <Lock className="w-3 h-3 text-amber-500" /> Đã khóa
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Tên & Mảng công tác C.14 / C.13 */}
                          <td className="py-4 px-4 align-top">
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                                onClick={() => setSelectedTargetForDetail(target)}
                              >
                                {target.name}
                              </p>
                              {target.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                                  {target.description}
                                </p>
                              )}
                              
                              {/* Mảng công tác C.14 hoặc C.13 badge */}
                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                                  <span className="font-semibold">{target.orgType === 'DOAN' ? 'C.14' : 'C.13'}:</span>
                                  <span className="truncate max-w-[240px]">{target.programText || target.programId || 'Chưa gán mảng CT'}</span>
                                </span>

                                <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                  {TARGET_CATEGORY_LABELS[target.category] || 'Mảng chung'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Chỉ số & Mục tiêu */}
                          <td className="py-4 px-4 align-top text-center">
                            <div>
                              <span className="text-base font-bold text-gray-900 dark:text-white">
                                {target.targetValue}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                {target.unitOfMeasure}
                              </span>
                              <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                                {target.metricType === 'PERCENTAGE' ? 'Định mức tỷ lệ' : 'Số lượng định lượng'}
                              </div>
                            </div>
                          </td>

                          {/* Tiến độ thực tế & % */}
                          <td className="py-4 px-4 align-top">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {target.currentValue} / {target.targetValue} {target.unitOfMeasure}
                                </span>
                                <span className={`font-bold ${
                                  target.completionRate >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                                  target.completionRate >= 50 ? 'text-amber-600 dark:text-amber-400' :
                                  'text-rose-600 dark:text-rose-400'
                                }`}>
                                  {target.completionRate}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    target.completionRate >= 80 ? 'bg-emerald-500' :
                                    target.completionRate >= 50 ? 'bg-amber-500' :
                                    'bg-rose-500'
                                  }`}
                                  style={{ width: `${Math.min(100, target.completionRate)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Phân bổ & Liên kết hoạt động */}
                          <td className="py-4 px-4 align-top text-center">
                            <div className="space-y-1">
                              <div className="inline-flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-750 px-2 py-0.5 rounded">
                                <Building className="w-3.5 h-3.5 text-purple-500" />
                                <span>{target.allocations?.length || 0} đơn vị</span>
                              </div>
                              
                              <div>
                                <span className="inline-flex items-center gap-1 text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>{target.linkedActivityCount || target.linkedActivityIds?.length || 0} hoạt động</span>
                                </span>
                              </div>

                              {/* Unregistered unit warning */}
                              {unregUnits.length > 0 && (
                                <div className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                                  {unregUnits.length} khoa chưa đăng ký
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Trạng thái dự báo AI */}
                          <td className="py-4 px-4 align-top text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${forecastBadge.badgeClass}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${forecastBadge.dotClass}`} />
                                <span>{forecastBadge.label}</span>
                              </span>
                              <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                Độ tin cậy: {target.aiForecastProbability}%
                              </span>
                            </div>
                          </td>

                          {/* Thao tác & Quản trị */}
                          <td className="py-4 px-4 align-top text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Xem chi tiết */}
                              <button
                                onClick={() => setSelectedTargetForDetail(target)}
                                className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                title="Xem chi tiết & Hoạt động liên kết"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>

                              {/* Đăng ký chỉ tiêu (Cấp 2/3) */}
                              <button
                                onClick={() => {
                                  setTargetForRegistration(target);
                                  setShowRegistrationModal(true);
                                }}
                                className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                title="Lập hồ sơ đăng ký chỉ tiêu đơn vị"
                              >
                                <Send className="w-4 h-4" />
                              </button>

                              {/* Phân bổ chỉ tiêu cho đơn vị */}
                              {isLevel3Or4 && (
                                <button
                                  onClick={() => {
                                    setTargetForAlloc(target);
                                    setShowAllocModal(true);
                                  }}
                                  className="p-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                                  title="Phân bổ chỉ tiêu cho Khoa / CLB"
                                >
                                  <Users className="w-4 h-4" />
                                </button>
                              )}

                              {/* Cấp trường tự động phân bổ cho đơn vị chưa đăng ký */}
                              {isLevel4 && unregUnits.length > 0 && (
                                <button
                                  onClick={() => {
                                    setTargetForAutoAllocate(target);
                                    setShowAutoAllocateModal(true);
                                  }}
                                  className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                                  title="Cấp trường tự động phân bổ cho đơn vị chưa đăng ký"
                                >
                                  <Award className="w-4 h-4" />
                                </button>
                              )}

                              {/* Khóa/Mở khóa */}
                              {isLevel4 && (
                                <button
                                  onClick={() => {
                                    setTargetForLock(target);
                                    setLockReasonInput(target.lockedReason || '');
                                    setShowLockModal(true);
                                  }}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    target.isLocked
                                      ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30'
                                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                                  }`}
                                  title={target.isLocked ? 'Mở khóa chỉ tiêu' : 'Khóa chỉ tiêu'}
                                >
                                  {target.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                </button>
                              )}

                              {/* Sửa */}
                              {isLevel3Or4 && !target.isLocked && (
                                <button
                                  onClick={() => {
                                    setEditingTarget(target);
                                    setShowCreateModal(true);
                                  }}
                                  className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                  title="Chỉnh sửa chỉ tiêu"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}

                              {/* Xóa */}
                              {isLevel4 && !target.isLocked && (
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Bạn có chắc chắn muốn xóa chỉ tiêu [${target.code}]: "${target.name}"?`)) {
                                      deleteTarget(target.id);
                                    }
                                  }}
                                  className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                                  title="Xóa chỉ tiêu"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUBTAB 2: DASHBOARD PHÂN TÍCH ĐA CHIỀU (THEO MỤC 1) */}
      {/* ==================================================================== */}
      {subTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl p-6 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/30 border border-blue-400/40 text-blue-200">
                  Phân tích Đa Chiều {activeOrgTab === 'DOAN' ? 'Đoàn Thanh niên (C.14)' : 'Hội Sinh viên (C.13)'}
                </span>
                <h2 className="text-xl font-bold mt-2">
                  Ma Trận Tiến Độ Real-time Theo Từng Mảng Công Tác
                </h2>
                <p className="text-sm text-blue-200 mt-1">
                  Đánh giá tương quan giữa Kế hoạch chỉ tiêu - Các hoạt động thực thi - Tiến độ phân bổ của từng Khoa & CLB
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleTriggerSync}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium border border-white/20 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Quét & Tái tính toán AI</span>
                </button>
              </div>
            </div>
          </div>

          {/* Grid: Progress by Mảng công tác C.14 or C.13 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1 & 2: Mảng công tác ranking */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-base">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <span>Tiến Độ Theo Từng Mảng Công Tác ({activeOrgTab === 'DOAN' ? 'C.14' : 'C.13'})</span>
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {activePrograms.length} mảng công tác
                </span>
              </div>

              <div className="space-y-3.5 max-h-[580px] overflow-y-auto pr-2">
                {activePrograms.map(prog => {
                  const matchingTargets = tabTargets.filter(t => t.programId === prog.id);
                  const targetCount = matchingTargets.length;
                  const avgRate = targetCount > 0
                    ? Math.round(matchingTargets.reduce((s, t) => s + t.completionRate, 0) / targetCount)
                    : 0;
                  const linkedActs = matchingTargets.reduce((s, t) => s + (t.linkedActivityCount || 0), 0);

                  return (
                    <div
                      key={prog.id}
                      className="p-3.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all bg-gray-50/50 dark:bg-gray-750"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 font-mono text-xs font-bold rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                              {prog.id}
                            </span>
                            <h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">
                              {prog.title}
                            </h4>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>Chỉ tiêu gắn kết: <strong className="text-gray-900 dark:text-white">{targetCount}</strong></span>
                            <span>Hoạt động đối soát: <strong className="text-indigo-600 dark:text-indigo-400">{linkedActs}</strong></span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`text-base font-bold ${
                            avgRate >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                            avgRate >= 50 ? 'text-amber-600 dark:text-amber-400' :
                            'text-rose-600 dark:text-rose-400'
                          }`}>
                            {avgRate}%
                          </span>
                          <p className="text-[10px] text-gray-400">Hoàn thành</p>
                        </div>
                      </div>

                      <div className="mt-2.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            avgRate >= 80 ? 'bg-emerald-500' :
                            avgRate >= 50 ? 'bg-amber-500' :
                            'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, avgRate)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Column 3: AI Recommendations & Lagging Units Warning */}
            <div className="space-y-6">
              {/* AI Warning Box */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                    Cảnh Báo Tự Động Chỉ Tiêu Chậm Trễ
                  </h3>
                </div>

                <div className="space-y-3">
                  {tabTargets
                    .filter(t => t.aiForecastStatus === 'NGUY_CO' || t.aiForecastStatus === 'BAO_DONG')
                    .slice(0, 4)
                    .map(t => (
                      <div
                        key={t.id}
                        className="p-3 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-700 dark:text-rose-300">[{t.code}] {t.name}</span>
                          <span className="font-bold text-rose-600">{t.completionRate}%</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                          {t.aiForecastAnalysis}
                        </p>
                        <div className="mt-2 pt-2 border-t border-rose-200/60 dark:border-rose-800/40 flex items-center justify-between">
                          <span className="text-[11px] text-gray-500">Mảng: {t.programId}</span>
                          <button
                            onClick={() => setSelectedTargetForDetail(t)}
                            className="text-blue-600 hover:underline text-[11px] font-medium"
                          >
                            Xem giải pháp AI →
                          </button>
                        </div>
                      </div>
                    ))}

                  {tabTargets.filter(t => t.aiForecastStatus === 'NGUY_CO' || t.aiForecastStatus === 'BAO_DONG').length === 0 && (
                    <div className="py-6 text-center text-emerald-600 dark:text-emerald-400 text-xs">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-1 text-emerald-500" />
                      <p className="font-semibold">Tuyệt vời! Không có chỉ tiêu nào ở mức báo động</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Multi-Dimensional Faculty Heatmap Overview */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                    <Building className="w-4 h-4 text-purple-600" />
                    <span>Tiến Độ Phân Bổ Các Khoa (Top 6)</span>
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {ORGANIZATIONS_LIST.filter(o => o.type === 'KHOA').slice(0, 6).map(fac => {
                    // Aggregate sub-allocations for this faculty across all tab targets
                    const facAllocs = tabTargets.flatMap(t => (t.allocations || []).filter(a => a.unitCode === fac.code));
                    const totalAssigned = facAllocs.reduce((s, a) => s + (a.assignedValue || 0), 0);
                    const totalCurrent = facAllocs.reduce((s, a) => s + (a.currentValue || 0), 0);
                    const avgFacRate = totalAssigned > 0 ? Math.min(100, Math.round((totalCurrent / totalAssigned) * 100)) : 0;

                    return (
                      <div key={fac.code} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-100 dark:border-gray-700/60 last:border-0">
                        <div className="min-w-0 pr-2">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{fac.name}</p>
                          <span className="text-[10px] text-gray-500">{facAllocs.length} chỉ tiêu nhận</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`font-bold ${avgFacRate >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {avgFacRate}%
                          </span>
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-purple-600 h-1.5 rounded-full"
                              style={{ width: `${avgFacRate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUBTAB 3: MÔ HÌNH PHÂN CẤP QUẢN LÝ CHỈ TIÊU (THEO MỤC 3) */}
      {/* ==================================================================== */}
      {subTab === 'hierarchical' && (
        <div className="space-y-6">
          {/* Explanation Banner */}
          <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-xl p-6 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/30 border border-purple-400/40 text-purple-200">
                  Cơ chế Phân cấp Đa tầng Đoàn - Hội
                </span>
                <h2 className="text-xl font-bold mt-2">
                  Mô Hình Phân Cấp & Quản Lý Đăng Ký Chỉ Tiêu
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-purple-200 mt-2">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <strong>Mục tiêu 1:</strong> Cấp dưới đăng ký với cấp trên (Khoa / Chi đoàn / CLB)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" />
                    <strong>Mục tiêu 2:</strong> Cấp trường (Cấp 4) quyết định cuối cùng, nếu cấp khoa không đăng ký thì phân bổ trực tiếp
                  </span>
                </div>
              </div>

              {/* Action for Level 4 */}
              {isLevel4 && (
                <div className="shrink-0">
                  <button
                    onClick={() => {
                      if (tabTargets.length > 0) {
                        setTargetForAutoAllocate(tabTargets[0]);
                        setShowAutoAllocateModal(true);
                      }
                    }}
                    className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold text-sm shadow-md transition-colors flex items-center gap-2"
                  >
                    <Award className="w-4 h-4 text-gray-950" />
                    <span>Tự Động Phân Bổ Khoa Chưa Đăng Ký</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sub-allocations & Registrations Table across all Targets in this tab */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">
                  Danh Sách Đăng Ký & Phân Bổ Của Các Đơn Vị ({activeOrgTab === 'DOAN' ? 'Đoàn Thanh niên' : 'Hội Sinh viên'})
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Theo dõi trạng thái: Chưa đăng ký / Chờ duyệt / Đã phê duyệt / Phân bổ áp đặt từ Cấp trường
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={registrationStatusFilter}
                  onChange={e => setRegistrationStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                  <option value="ALL">Tất cả trạng thái đăng ký</option>
                  <option value="CHUA_DANG_KY">Chưa đăng ký</option>
                  <option value="CHO_DUYET">Chờ phê duyệt</option>
                  <option value="DA_DUYET">Đã phê duyệt</option>
                  <option value="TU_CHOI">Yêu cầu điều chỉnh</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  <tr>
                    <th className="py-3 px-4 w-32">Chỉ Tiêu</th>
                    <th className="py-3 px-4 min-w-[200px]">Đơn Vị Nhận Phân Bổ</th>
                    <th className="py-3 px-4 w-28 text-center">Định Mức Sàn</th>
                    <th className="py-3 px-4 w-32 text-center">Mức Đăng Ký</th>
                    <th className="py-3 px-4 w-32 text-center">Mức Giao Chính Thức</th>
                    <th className="py-3 px-4 w-40 text-center">Trạng Thái Đăng Ký</th>
                    <th className="py-3 px-4 w-36 text-center">Quyết Định Cấp 4</th>
                    <th className="py-3 px-4 w-32 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-xs">
                  {tabTargets.flatMap(target => {
                    const allocs = target.allocations || [];
                    if (allocs.length === 0) {
                      return [
                        <tr key={`${target.id}-empty`} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                          <td className="py-3 px-4 font-mono font-bold text-gray-700 dark:text-gray-300">
                            {target.code}
                          </td>
                          <td colSpan={6} className="py-3 px-4 text-gray-400 italic">
                            Chưa thiết lập danh sách phân bổ cho các Khoa/CLB.
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isLevel4 && (
                              <button
                                onClick={() => {
                                  autoAllocateUnregisteredUnits(target.id);
                                }}
                                className="px-2.5 py-1 text-[11px] rounded bg-purple-600 text-white font-medium hover:bg-purple-700"
                              >
                                Tự động phân bổ
                              </button>
                            )}
                          </td>
                        </tr>
                      ];
                    }

                    return allocs
                      .filter(alloc => {
                        if (registrationStatusFilter !== 'ALL' && alloc.registrationStatus !== registrationStatusFilter) {
                          return false;
                        }
                        return true;
                      })
                      .map(alloc => {
                        const regBadge = getRegistrationBadge(alloc.registrationStatus, alloc.isAutoAllocatedBySchool);
                        const RegIcon = regBadge.icon;

                        return (
                          <tr key={`${target.id}-${alloc.id}`} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                            <td className="py-3 px-4 align-top">
                              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                {target.code}
                              </span>
                              <p className="text-[11px] text-gray-500 truncate max-w-[120px]">{target.name}</p>
                            </td>

                            <td className="py-3 px-4 align-top">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {alloc.unitName}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5 text-gray-500">
                                <span className="font-mono">[{alloc.unitCode}]</span>
                                <span>• {alloc.unitType}</span>
                              </div>
                              {alloc.actionPlan && (
                                <p className="text-[11px] text-gray-500 italic mt-1 line-clamp-1">
                                  KH: {alloc.actionPlan}
                                </p>
                              )}
                            </td>

                            <td className="py-3 px-4 align-top text-center font-medium text-gray-700 dark:text-gray-300">
                              {alloc.targetQuota || 'Chưa định mức'}
                            </td>

                            <td className="py-3 px-4 align-top text-center">
                              {alloc.registeredValue !== undefined && alloc.registeredValue > 0 ? (
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                  {alloc.registeredValue}
                                </span>
                              ) : (
                                <span className="text-gray-400 italic">Chưa nộp</span>
                              )}
                            </td>

                            <td className="py-3 px-4 align-top text-center font-bold text-gray-900 dark:text-white">
                              {alloc.assignedValue || 0} {target.unitOfMeasure}
                            </td>

                            <td className="py-3 px-4 align-top text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-medium ${regBadge.badgeClass}`}>
                                <RegIcon className="w-3 h-3" />
                                <span>{regBadge.label}</span>
                              </span>
                            </td>

                            <td className="py-3 px-4 align-top text-center text-gray-500">
                              {alloc.decisionNote ? (
                                <span className="text-[11px] text-purple-700 dark:text-purple-300 font-medium line-clamp-2">
                                  {alloc.decisionNote}
                                </span>
                              ) : (
                                <span className="text-gray-400 italic">Đang chờ phê duyệt</span>
                              )}
                            </td>

                            <td className="py-3 px-4 align-top text-right">
                              <div className="flex items-center justify-end gap-1">
                                {/* Cấp 4 phê duyệt hoặc tự động phân bổ */}
                                {isLevel4 && (
                                  <button
                                    onClick={() => {
                                      setTargetForDecision(target);
                                      setUnitForDecision(alloc);
                                      setShowSchoolDecisionModal(true);
                                    }}
                                    className="px-2 py-1 text-[11px] font-medium rounded bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300"
                                    title="Phê duyệt hoặc Phân bổ Cấp Trường"
                                  >
                                    Quyết định
                                  </button>
                                )}

                                {/* Cấp dưới chỉnh sửa đăng ký */}
                                {(!isLevel4 || alloc.registrationStatus === 'CHUA_DANG_KY') && (
                                  <button
                                    onClick={() => {
                                      setTargetForRegistration(target);
                                      setShowRegistrationModal(true);
                                    }}
                                    className="p-1 text-gray-500 hover:text-indigo-600"
                                    title="Chỉnh sửa đăng ký"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      });
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUBTAB 4: ĐỐI SOÁT MINH CHỨNG AI & ĐỀ XUẤT HOẠT ĐỘNG */}
      {/* ==================================================================== */}
      {subTab === 'ai-audit' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>Trí Tuệ Nhân Tạo Đối Soát Minh Chứng & Tự Động Hóa Tiến Độ</span>
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  AI quét danh sách sinh viên tham gia, đối soát mã QR điểm danh từ các Hoạt động đã duyệt để tự động cộng dồn tiến độ chỉ tiêu tương ứng
                </p>
              </div>

              <button
                onClick={handleTriggerSync}
                disabled={isScanning}
                className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'AI Đang Quét Minh Chứng...' : 'Khởi Chạy Quét AI Toàn Bộ'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs">
                <span className="font-bold text-blue-900 dark:text-blue-300 text-sm">1. Tự Động Đối Soát</span>
                <p className="text-gray-600 dark:text-gray-300 mt-1.5">
                  Khi hoạt động Cấp A hoặc B hoàn thành, hệ thống quét mã QR và danh sách sinh viên chính thức để cộng dồn vào tiến độ chỉ tiêu liên quan theo thời gian thực.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs">
                <span className="font-bold text-purple-900 dark:text-purple-300 text-sm">2. Kiểm Duyệt Minh Chứng AI</span>
                <p className="text-gray-600 dark:text-gray-300 mt-1.5">
                  Đánh giá độ tin cậy từ 95% - 99% dựa trên tính hợp lệ của bài viết minh chứng, ảnh chụp sự kiện và dấu kiểm duyệt số Cấp 3/4.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                <span className="font-bold text-emerald-900 dark:text-emerald-300 text-sm">3. Đề Xuất Hoạt Động Bổ Sung</span>
                <p className="text-gray-600 dark:text-gray-300 mt-1.5">
                  Chủ động đề xuất các chương trình, hội thảo hoặc ngày hội cần tổ chức bổ sung cho các đơn vị đang bị trễ hạn hoặc nguy cơ thiếu hụt chỉ tiêu.
                </p>
              </div>
            </div>
          </div>

          {/* AI Evidence Audit History */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
            <h4 className="font-bold text-gray-900 dark:text-white text-base">
              Nhật Ký Đối Soát Minh Chứng Hoạt Động Gần Nhất
            </h4>

            <div className="space-y-3">
              {tabTargets.flatMap(t => (t.evidenceChecks || []).map(ev => ({ ...ev, targetCode: t.code, targetName: t.name }))).length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs">
                  Chưa có nhật ký đối soát minh chứng nào được ghi nhận. Bấm "Khởi Chạy Quét AI" để bắt đầu.
                </div>
              ) : (
                tabTargets.flatMap(t => (t.evidenceChecks || []).map(ev => ({ ...ev, targetCode: t.code, targetName: t.name }))).map(ev => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs bg-gray-50/50 dark:bg-gray-750"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">[{ev.targetCode}]</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{ev.activityTitle}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {ev.status}
                        </span>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">
                        Chỉ tiêu: {ev.targetName} • Ghi nhận: {ev.notes}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300">
                      <div>
                        <span className="text-gray-400">Điểm danh QR:</span>
                        <strong className="ml-1 text-emerald-600">{ev.qrVerifiedCount} / {ev.participantCountVerified} SV</strong>
                      </div>
                      <div className="px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold">
                        Độ tin cậy: {Math.round(ev.aiVerificationConfidence * 100)}%
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. MODALS & INTERACTIVE PANELS */}
      {/* ==================================================================== */}

      {/* MODAL 1: CREATE OR EDIT TARGET */}
      {showCreateModal && (
        <TargetFormModal
          isOpen={showCreateModal}
          initialData={editingTarget}
          defaultOrgType={activeOrgTab}
          programs={activePrograms}
          onClose={() => setShowCreateModal(false)}
          onSave={data => {
            if (editingTarget) {
              updateTarget(editingTarget.id, data);
            } else {
              addTarget(data as any);
            }
            setShowCreateModal(false);
          }}
        />
      )}

      {/* MODAL 2: SUBORDINATE REGISTRATION (CẤP DƯỚI ĐĂNG KÝ VỚI CẤP TRÊN) */}
      {showRegistrationModal && targetForRegistration && (
        <UnitRegistrationModal
          target={targetForRegistration}
          isOpen={showRegistrationModal}
          onClose={() => setShowRegistrationModal(false)}
          onSubmit={allocData => {
            submitUnitRegistration(targetForRegistration.id, allocData);
            setShowRegistrationModal(false);
          }}
        />
      )}

      {/* MODAL 3: SCHOOL FINAL DECISION (CẤP TRƯỜNG PHÊ DUYỆT / QUYẾT ĐỊNH CUỐI CÙNG) */}
      {showSchoolDecisionModal && targetForDecision && unitForDecision && (
        <SchoolDecisionModal
          target={targetForDecision}
          allocation={unitForDecision}
          isOpen={showSchoolDecisionModal}
          onClose={() => setShowSchoolDecisionModal(false)}
          onApprove={(approvedValue, note) => {
            approveUnitRegistration(targetForDecision.id, unitForDecision.unitCode, approvedValue, note);
            setShowSchoolDecisionModal(false);
          }}
          onReject={reason => {
            rejectUnitRegistration(targetForDecision.id, unitForDecision.unitCode, reason);
            setShowSchoolDecisionModal(false);
          }}
        />
      )}

      {/* MODAL 4: AUTO ALLOCATE UNREGISTERED UNITS */}
      {showAutoAllocateModal && targetForAutoAllocate && (
        <AutoAllocateModal
          target={targetForAutoAllocate}
          isOpen={showAutoAllocateModal}
          onClose={() => setShowAutoAllocateModal(false)}
          onConfirm={quota => {
            autoAllocateUnregisteredUnits(targetForAutoAllocate.id, quota);
            setShowAutoAllocateModal(false);
          }}
        />
      )}

      {/* MODAL 5: SUB-ALLOCATION MODAL */}
      {showAllocModal && targetForAlloc && (
        <SubAllocationModal
          target={targetForAlloc}
          isOpen={showAllocModal}
          onClose={() => setShowAllocModal(false)}
          onSave={allocation => {
            allocateSubTarget(targetForAlloc.id, allocation);
            setShowAllocModal(false);
          }}
        />
      )}

      {/* MODAL 6: TARGET DETAIL SLIDEOVER / MODAL */}
      {selectedTargetForDetail && (
        <TargetDetailModal
          target={selectedTargetForDetail}
          allActivities={allActivities}
          isOpen={Boolean(selectedTargetForDetail)}
          onClose={() => setSelectedTargetForDetail(null)}
          onOpenRegistration={() => {
            setTargetForRegistration(selectedTargetForDetail);
            setSelectedTargetForDetail(null);
            setShowRegistrationModal(true);
          }}
        />
      )}

      {/* MODAL 7: LOCK / UNLOCK MODAL */}
      {showLockModal && targetForLock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 text-amber-600">
              <Lock className="w-6 h-6" />
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                {targetForLock.isLocked ? 'Mở Khóa Chỉ Tiêu' : 'Khóa Dữ Liệu Chỉ Tiêu'}
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Chỉ tiêu [{targetForLock.code}]: "{targetForLock.name}"
            </p>

            {!targetForLock.isLocked && (
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lý do khóa định biên mức chỉ tiêu:
                </label>
                <input
                  type="text"
                  value={lockReasonInput}
                  onChange={e => setLockReasonInput(e.target.value)}
                  placeholder="Vd: Nghị quyết Đại hội Đoàn trường thông qua"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowLockModal(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  toggleLockTarget(targetForLock.id, lockReasonInput);
                  setShowLockModal(false);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg text-white ${
                  targetForLock.isLocked ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {targetForLock.isLocked ? 'Xác nhận mở khóa' : 'Khóa chỉ tiêu ngay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: EXPORT REPORT MODAL */}
      {showExportModal && (
        <ExportReportModal
          isOpen={showExportModal}
          targets={tabTargets}
          academicYear={academicYear}
          orgType={activeOrgTab}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
};

// ============================================================================
// HELPER COMPONENT: TARGET CREATE / EDIT MODAL
// ============================================================================
interface TargetFormModalProps {
  isOpen: boolean;
  initialData: TargetItem | null;
  defaultOrgType: TargetOrgType;
  programs: { id: string; title: string }[];
  onClose: () => void;
  onSave: (data: Partial<TargetItem>) => void;
}

const TargetFormModal: React.FC<TargetFormModalProps> = ({
  isOpen,
  initialData,
  defaultOrgType,
  programs,
  onClose,
  onSave
}) => {
  const [code, setCode] = useState(initialData?.code || 'CT01');
  const [name, setName] = useState(initialData?.name || '');
  const [orgType, setOrgType] = useState<TargetOrgType>(initialData?.orgType || defaultOrgType);
  const [programId, setProgramId] = useState(initialData?.programId || programs[0]?.id || '1');
  const [category, setCategory] = useState<TargetCategory>(initialData?.category || 'TO_CHUC_DOAN_HOI');
  const [metricType, setMetricType] = useState<any>(initialData?.metricType || 'NUMBER');
  const [unitOfMeasure, setUnitOfMeasure] = useState(initialData?.unitOfMeasure || 'Sinh viên');
  const [targetValue, setTargetValue] = useState(initialData?.targetValue || 100);
  const [priorityWeight, setPriorityWeight] = useState(initialData?.priorityWeight || 4);
  const [registrationDeadline, setRegistrationDeadline] = useState(initialData?.registrationDeadline || '2026-10-30');
  const [description, setDescription] = useState(initialData?.description || '');

  // Update programs list when orgType toggles
  const currentPrograms = orgType === 'DOAN' ? DOAN_PROGRAMS : HOI_PROGRAMS;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const selectedProg = currentPrograms.find(p => p.id === programId);
    const progText = selectedProg ? `${selectedProg.id}. ${selectedProg.title}` : programId;

    onSave({
      id: initialData?.id || `CT-${orgType}-${Date.now()}`,
      code: code.trim(),
      name: name.trim(),
      orgType,
      programId,
      programText: progText,
      category,
      metricType,
      unitOfMeasure: unitOfMeasure.trim(),
      targetValue: Number(targetValue),
      currentValue: initialData?.currentValue || 0,
      priorityWeight: Number(priorityWeight),
      registrationDeadline,
      description: description.trim(),
      level: 'TRUONG',
      academicYear: initialData?.academicYear || 'Năm học 2026-2027',
      semester: 'ALL',
      isLocked: initialData?.isLocked || false,
      linkedActivityIds: initialData?.linkedActivityIds || [],
      linkedActivityCount: initialData?.linkedActivityCount || 0,
      allocations: initialData?.allocations || [],
      allocatedUnitsCount: initialData?.allocatedUnitsCount || 0,
      createdBy: initialData?.createdBy || {
        userId: 'usr_current',
        userName: 'Cán bộ Đoàn - Hội quản lý',
        userEmail: 'doanhoi@hcmuaf.edu.vn',
        roleLevel: 4
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full p-6 border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            <span>{initialData ? 'Chỉnh Sửa Chỉ Tiêu' : 'Khởi Tạo Chỉ Tiêu Mới'}</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Org Type (Đoàn vs Hội), Mã Chỉ Tiêu & Phân Loại Danh Mục */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Thuộc Tổ Chức *
              </label>
              <select
                value={orgType}
                onChange={e => {
                  const val = e.target.value as TargetOrgType;
                  setOrgType(val);
                  setProgramId(val === 'DOAN' ? DOAN_PROGRAMS[0].id : HOI_PROGRAMS[0].id);
                }}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="DOAN">Đoàn Thanh niên</option>
                <option value="HOI">Hội Sinh viên</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Mã Chỉ Tiêu *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Vd: CT-D01 hoặc CT-H01"
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Phân Loại Danh Mục *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as TargetCategory)}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="HOC_THUAT">Học thuật & NCKH</option>
                <option value="TRACH_NHIEM_XA_HOI">Trách nhiệm Xã hội</option>
                <option value="THE_LUC">Thể lực & Rèn luyện</option>
                <option value="KY_NANG">Kỹ năng & Hội nhập</option>
                <option value="TO_CHUC_DOAN_HOI">Tổ chức Đoàn - Hội</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {orgType === 'DOAN' ? '14. Mảng CT Đoàn & Phong trào TT (C.14) *' : '13. Mảng CT Hội & Phong trào SV (C.13) *'}
            </label>
            <select
              value={programId}
              onChange={e => setProgramId(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {currentPrograms.map(p => (
                <option key={p.id} value={p.id}>
                  {p.id}. {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Tên chỉ tiêu */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Tên Chỉ Tiêu *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Vd: 100% Chi đoàn tổ chức sinh hoạt chuyên đề NCKH"
              className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white font-medium"
            />
          </div>

          {/* Định lượng & Đơn vị tính */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Loại Chỉ Số
              </label>
              <select
                value={metricType}
                onChange={e => setMetricType(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="NUMBER">Số lượng định lượng</option>
                <option value="PERCENTAGE">Tỷ lệ %</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Mức Chỉ Tiêu Giao *
              </label>
              <input
                type="number"
                min={1}
                required
                value={targetValue}
                onChange={e => setTargetValue(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Đơn Vị Tính *
              </label>
              <input
                type="text"
                required
                value={unitOfMeasure}
                onChange={e => setUnitOfMeasure(e.target.value)}
                placeholder="Vd: Sinh viên, Chi đoàn, %"
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Hạn Chót Cấp Khoa Đăng Ký
              </label>
              <input
                type="date"
                value={registrationDeadline}
                onChange={e => setRegistrationDeadline(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Trọng Số Ưu Tiên (1 - 5)
              </label>
              <select
                value={priorityWeight}
                onChange={e => setPriorityWeight(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value={5}>5 sao (Trọng tâm cốt lõi)</option>
                <option value={4}>4 sao (Quan trọng)</option>
                <option value={3}>3 sao (Tiêu chuẩn)</option>
                <option value={2}>2 sao (Khuyến khích)</option>
                <option value={1}>1 sao (Tham khảo)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Mô Tả & Hướng Dẫn Thực Hiện
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Chi tiết yêu cầu, cách tính điểm và giải pháp triển khai..."
              className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow"
            >
              {initialData ? 'Lưu Thay Đổi' : 'Khởi Tạo Chỉ Tiêu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// HELPER COMPONENT: SUBORDINATE REGISTRATION MODAL (CẤP DƯỚI ĐĂNG KÝ VỚI CẤP TRÊN)
// ============================================================================
interface UnitRegistrationModalProps {
  target: TargetItem;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<TargetSubAllocation>) => void;
}

const UnitRegistrationModal: React.FC<UnitRegistrationModalProps> = ({
  target,
  isOpen,
  onClose,
  onSubmit
}) => {
  const faculties = ORGANIZATIONS_LIST.filter(o => o.type === 'KHOA');
  const [selectedUnitCode, setSelectedUnitCode] = useState(faculties[0]?.code || 'CNTT');
  const [registeredValue, setRegisteredValue] = useState<number>(target.targetValue ? Math.round(target.targetValue / 10) : 10);
  const [actionPlan, setActionPlan] = useState('');
  const [notes, setNotes] = useState('');

  const selectedUnit = ORGANIZATIONS_LIST.find(o => o.code === selectedUnitCode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      unitCode: selectedUnitCode,
      unitName: selectedUnit?.name || selectedUnitCode,
      unitType: 'KHOA',
      registeredValue: Number(registeredValue),
      actionPlan: actionPlan.trim(),
      notes: notes.trim(),
      targetQuota: target.targetValue ? Math.round(target.targetValue / 10) : 10
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-600" />
              <span>Đăng Ký Chỉ Tiêu Với Cấp Trên</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Chỉ tiêu [{target.code}]: {target.name}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Đơn Vị Đăng Ký (Đoàn Khoa / Liên Chi Hội / CLB) *
            </label>
            <select
              value={selectedUnitCode}
              onChange={e => setSelectedUnitCode(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {faculties.map(f => (
                <option key={f.code} value={f.code}>
                  {f.name} ({f.code})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs">
            <div className="flex justify-between items-center text-blue-900 dark:text-blue-300">
              <span>Định mức toàn trường:</span>
              <strong>{target.targetValue} {target.unitOfMeasure}</strong>
            </div>
            <div className="flex justify-between items-center text-blue-900 dark:text-blue-300 mt-1">
              <span>Hạn chót gửi đăng ký:</span>
              <strong className="text-rose-600 dark:text-rose-400">{target.registrationDeadline || '25/10/2026'}</strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Mức Đơn Vị Cam Kết Đăng Ký ({target.unitOfMeasure}) *
            </label>
            <input
              type="number"
              min={1}
              required
              value={registeredValue}
              onChange={e => setRegisteredValue(Number(e.target.value))}
              className="w-full px-3 py-2 text-base font-bold border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Kế Hoạch & Chương Trình Dự Kiến Triển Khai
            </label>
            <textarea
              rows={3}
              value={actionPlan}
              onChange={e => setActionPlan(e.target.value)}
              placeholder="Vd: Dự kiến tổ chức 2 ngày hội cấp khoa và huy động 10 chi đoàn tham gia..."
              className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Ghi Chú / Giải Trình (nếu điều chỉnh tăng/giảm)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Giải trình lý do đề xuất mức chỉ tiêu này..."
              className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow"
            >
              Gửi Đăng Ký Lên Cấp Trên
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// HELPER COMPONENT: SCHOOL FINAL DECISION MODAL (CẤP TRƯỜNG PHÊ DUYỆT)
// ============================================================================
interface SchoolDecisionModalProps {
  target: TargetItem;
  allocation: TargetSubAllocation;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (approvedValue: number, note?: string) => void;
  onReject: (reason?: string) => void;
}

const SchoolDecisionModal: React.FC<SchoolDecisionModalProps> = ({
  target,
  allocation,
  isOpen,
  onClose,
  onApprove,
  onReject
}) => {
  const [approvedValue, setApprovedValue] = useState<number>(allocation.registeredValue || allocation.targetQuota || 10);
  const [note, setNote] = useState('Ban Thường vụ Đoàn trường phê duyệt chỉ tiêu giao chính thức');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              <span>Quyết Định Cấp Trường (Cấp 4)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Đơn vị: {allocation.unitName} [{allocation.unitCode}]
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="p-3.5 rounded-lg bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Chỉ tiêu:</span>
              <strong className="text-gray-900 dark:text-white">[{target.code}] {target.name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Mức đơn vị đăng ký:</span>
              <strong className="text-indigo-600 font-bold">{allocation.registeredValue || 'Chưa đăng ký'} {target.unitOfMeasure}</strong>
            </div>
            {allocation.actionPlan && (
              <div>
                <span className="text-gray-500">Kế hoạch đơn vị:</span>
                <p className="mt-0.5 text-gray-700 dark:text-gray-300 italic">{allocation.actionPlan}</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Mức Chỉ Tiêu Cấp Trường Phê Chuẩn Chính Thức ({target.unitOfMeasure}) *
            </label>
            <input
              type="number"
              min={1}
              value={approvedValue}
              onChange={e => setApprovedValue(Number(e.target.value))}
              className="w-full px-3 py-2 text-base font-bold border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-purple-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Ý Kiến Chỉ Đạo / Căn Cứ Quyết Định Cấp Trường
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between gap-3">
            <button
              type="button"
              onClick={() => onReject('Chưa đạt định mức yêu cầu, đề nghị đơn vị điều chỉnh và đăng ký lại')}
              className="px-4 py-2 text-xs font-medium rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200"
            >
              Yêu cầu đăng ký lại
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium rounded-lg text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => onApprove(approvedValue, note)}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-white bg-purple-600 hover:bg-purple-700 shadow"
              >
                Phê Chuẩn Quyết Định
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// HELPER COMPONENT: AUTO ALLOCATE MODAL (CẤP TRƯỜNG PHÂN BỔ ÁP ĐẶT ĐƠN VỊ CHƯA ĐĂNG KÝ)
// ============================================================================
interface AutoAllocateModalProps {
  target: TargetItem;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quota?: number) => void;
}

const AutoAllocateModal: React.FC<AutoAllocateModalProps> = ({
  target,
  isOpen,
  onClose,
  onConfirm
}) => {
  const faculties = ORGANIZATIONS_LIST.filter(o => o.type === 'KHOA');
  const defaultQuota = target.metricType === 'PERCENTAGE'
    ? 100
    : Math.max(1, Math.round(target.targetValue / faculties.length));
  const [quota, setQuota] = useState<number>(defaultQuota);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 text-amber-600">
          <Award className="w-6 h-6" />
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
            Cấp Trường Phân Bổ Áp Đặt
          </h3>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Áp dụng cho chỉ tiêu [{target.code}]: <strong>{target.name}</strong>
        </p>

        <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
          <p className="font-semibold">Quy định Cấp trường:</p>
          <p className="mt-1">
            Nếu cấp khoa không gửi hồ sơ đăng ký trước hạn chót, Cấp trường có thẩm quyền quyết định cuối cùng và tự động phân bổ áp đặt định mức giao cho toàn bộ các khoa chưa đăng ký.
          </p>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Định Mức Sàn Phân Bổ Cho Mỗi Khoa ({target.unitOfMeasure})
          </label>
          <input
            type="number"
            min={1}
            value={quota}
            onChange={e => setQuota(Number(e.target.value))}
            className="w-full px-3 py-2 text-base font-bold border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-purple-600"
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => onConfirm(quota)}
            className="px-5 py-2 text-sm font-semibold rounded-lg text-white bg-purple-600 hover:bg-purple-700 shadow"
          >
            Xác Nhận Phân Bổ Toàn Trường
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// HELPER COMPONENT: SUB-ALLOCATION MODAL (PHÂN BỔ THỦ CÔNG)
// ============================================================================
interface SubAllocationModalProps {
  target: TargetItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (allocation: TargetSubAllocation) => void;
}

const SubAllocationModal: React.FC<SubAllocationModalProps> = ({
  target,
  isOpen,
  onClose,
  onSave
}) => {
  const [unitCode, setUnitCode] = useState('CNTT');
  const [assignedValue, setAssignedValue] = useState(10);
  const [notes, setNotes] = useState('');

  const selectedOrg = ORGANIZATIONS_LIST.find(o => o.code === unitCode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: `alc-${Date.now()}-${unitCode}`,
      unitCode,
      unitName: selectedOrg?.name || unitCode,
      unitType: (selectedOrg?.type === 'KHOA' ? 'KHOA' : 'CLB') as any,
      assignedValue: Number(assignedValue),
      currentValue: 0,
      completionRate: 0,
      forecastStatus: 'BAO_DONG',
      registrationStatus: 'DA_DUYET',
      isAutoAllocatedBySchool: false,
      notes: notes.trim(),
      updatedAt: new Date().toISOString()
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <span>Phân Bổ Chỉ Tiêu Đơn Vị Con</span>
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Chọn Đơn Vị Nhận Chỉ Tiêu *
            </label>
            <select
              value={unitCode}
              onChange={e => setUnitCode(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {ORGANIZATIONS_LIST.map(org => (
                <option key={org.code} value={org.code}>
                  {org.name} ({org.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Mức Chỉ Tiêu Phân Bổ ({target.unitOfMeasure}) *
            </label>
            <input
              type="number"
              min={1}
              required
              value={assignedValue}
              onChange={e => setAssignedValue(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm font-bold border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Ghi Chú Phân Bổ
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Vd: Ưu tiên phân bổ theo số lượng đoàn viên năm 1"
              className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold rounded-lg text-white bg-purple-600 hover:bg-purple-700 shadow"
            >
              Lưu Phân Bổ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// HELPER COMPONENT: TARGET DETAIL SLIDEOVER & LINKED ACTIVITIES
// ============================================================================
interface TargetDetailModalProps {
  target: TargetItem;
  allActivities: ActivitySubmission[];
  isOpen: boolean;
  onClose: () => void;
  onOpenRegistration: () => void;
}

const TargetDetailModal: React.FC<TargetDetailModalProps> = ({
  target,
  allActivities,
  isOpen,
  onClose,
  onOpenRegistration
}) => {
  // Find linked activities
  const linkedActivities = useMemo(() => {
    return allActivities.filter(a => {
      if (a.isDeleted || a.deleted) return false;
      const isExplicitLinked = (target.linkedActivityIds || []).includes(a.id);
      const isProgramLinked = target.orgType === 'DOAN'
        ? a.doanProgramId === target.programId
        : a.hoiProgramId === target.programId;
      return isExplicitLinked || isProgramLinked;
    });
  }, [allActivities, target]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full p-6 border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2.5 py-0.5 rounded">
                {target.code}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                {target.orgType === 'DOAN' ? 'Đoàn Thanh niên' : 'Hội Sinh viên'}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2">
              {target.name}
            </h3>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
              Mảng công tác: {target.programText}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress & AI Forecast Card */}
        <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 space-y-3">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500">Mục tiêu giao</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{target.targetValue} {target.unitOfMeasure}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Tiến độ thực tế</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{target.currentValue} {target.unitOfMeasure}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Tỷ lệ hoàn thành</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{target.completionRate}%</p>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>Phân Tích Đánh Giá AI:</span>
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
              {target.aiForecastAnalysis}
            </p>

            {target.aiSuggestedActions && target.aiSuggestedActions.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-[11px] font-semibold text-gray-500">Gợi ý hoạt động đề xuất:</p>
                <ul className="list-disc list-inside text-xs text-indigo-700 dark:text-indigo-300 space-y-0.5">
                  {target.aiSuggestedActions.map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Linked Activities Section */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>Các Hoạt Động Liên Kết Trực Tiếp ({linkedActivities.length} sự kiện)</span>
            </h4>
            <span className="text-xs text-gray-500">Tự động đối soát từ C.14 & C.13</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {linkedActivities.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-3 text-center">
                Chưa có hoạt động nào gắn kết với mảng công tác này.
              </p>
            ) : (
              linkedActivities.map(act => (
                <div
                  key={act.id}
                  className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-blue-600 dark:text-blue-400">[{act.id}]</span>
                    <span className="font-semibold text-gray-900 dark:text-white ml-1.5">{act.title}</span>
                    <p className="text-gray-500 mt-0.5">Đơn vị: {act.orgName} • Ngày: {act.startDate}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-emerald-600">{act.officialParticipantCount || act.participants?.length || 0} SV</span>
                    <p className="text-[10px] text-gray-400">{act.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Allocations by Faculties */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-purple-500" />
              <span>Phân Bổ & Trạng Thái Đăng Ký Của Các Đơn Vị ({target.allocations?.length || 0})</span>
            </h4>

            <button
              onClick={onOpenRegistration}
              className="text-xs text-indigo-600 hover:underline font-semibold"
            >
              + Đăng ký chỉ tiêu
            </button>
          </div>

          <div className="space-y-1.5 max-h-44 overflow-y-auto">
            {(target.allocations || []).map(alloc => (
              <div
                key={alloc.id}
                className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">{alloc.unitName}</span>
                  <span className="text-gray-500 ml-1.5 font-mono">[{alloc.unitCode}]</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 dark:text-gray-300">
                    Giao: <strong>{alloc.assignedValue}</strong>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    alloc.registrationStatus === 'DA_DUYET' ? 'bg-emerald-100 text-emerald-800' :
                    alloc.registrationStatus === 'CHO_DUYET' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {alloc.registrationStatus || 'CHUA_DANG_KY'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// HELPER COMPONENT: EXPORT REPORT MODAL
// ============================================================================
interface ExportReportModalProps {
  isOpen: boolean;
  targets: TargetItem[];
  academicYear: string;
  orgType: TargetOrgType;
  onClose: () => void;
}

const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  targets,
  academicYear,
  orgType,
  onClose
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Mã', 'Tên chỉ tiêu', 'Tổ chức', 'Mảng CT', 'Chỉ số', 'Mục tiêu', 'Đã đạt', 'Tỷ lệ %', 'Dự báo AI'];
    const rows = targets.map(t => [
      `"${t.code}"`,
      `"${t.name.replace(/"/g, '""')}"`,
      `"${t.orgType === 'DOAN' ? 'Đoàn Thanh niên' : 'Hội Sinh viên'}"`,
      `"${(t.programText || '').replace(/"/g, '""')}"`,
      `"${t.unitOfMeasure}"`,
      t.targetValue,
      t.currentValue,
      `${t.completionRate}%`,
      `"${t.aiForecastStatus}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bao_Cao_Chi_Tieu_${orgType}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-xl w-full p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            <span>Kết Xuất Báo Cáo Định Dạng Đoàn - Hội</span>
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm text-gray-600 dark:text-gray-300">
          <p>
            Kết xuất toàn bộ bảng số liệu phân bổ, tiến độ hoàn thành và phân tích AI cho bộ chỉ tiêu <strong>{orgType === 'DOAN' ? 'Đoàn Thanh niên (C.14)' : 'Hội Sinh viên (C.13)'}</strong> - Năm học {academicYear}.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleExportCSV}
              className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all text-left group"
            >
              <FileSpreadsheet className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-bold text-gray-900 dark:text-white">Xuất File Excel / CSV</p>
              <p className="text-xs text-gray-500 mt-1">Dữ liệu dạng bảng phục vụ tổng hợp và phân tích.</p>
            </button>

            <button
              onClick={handlePrint}
              className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all text-left group"
            >
              <Printer className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-bold text-gray-900 dark:text-white">In / Xuất PDF Đoàn - Hội</p>
              <p className="text-xs text-gray-500 mt-1">Định dạng chuẩn văn bản trình ký Ban Thường vụ.</p>
            </button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
