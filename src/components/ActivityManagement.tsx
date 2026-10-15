import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ActivitySubmission, ActivityStatus, FilterAcademicYear, FilterActivityType, FilterSemester } from '../types';
import { ActivityFormModal } from './ActivityFormModal';
import { ExcelUploadModal } from './ExcelUploadModal';
import { BulkActivityImportModal } from './BulkActivityImportModal';
import { DataFilterToolbar } from './DataFilterToolbar';
import {
  logFirestoreWriteDiagnostic,
  getRecentDiagnosticLogs,
  clearDiagnosticLogs,
  DiagnosticLogRecord
} from '../utils/firestoreDiagnosticLogger';
export { logFirestoreWriteDiagnostic };
import {
  downloadActivity15BlankTemplate,
  exportActivitiesToExcel15Items
} from '../utils/activity15TemplateUtils';
import {
  getActivitySemester,
  getActivityType,
  matchActivityFilters,
  getSemesterBadge,
  getActivityTypeBadge,
  ACADEMIC_YEARS,
  SEMESTERS,
  ACTIVITY_TYPES
} from '../utils/filterUtils';
import { isSchoolYouthUnionOrAssociation } from '../utils/dataIntegrity';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  FileText,
  Award,
  Shield,
  Eye,
  Check,
  X,
  MessageSquare,
  Sparkles,
  HardDrive,
  FileSpreadsheet,
  Users,
  Upload,
  Download,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Lock,
  Unlock,
  Edit2,
  AlertTriangle,
  Mail,
  Image,
  CloudUpload,
  Link,
  Save,
  Trash2,
  AlertOctagon,
  CheckSquare,
  Square,
  RefreshCw,
  Info,
  LayoutGrid,
  List,
  Building2,
  TrendingUp,
  BarChart3,
  QrCode,
  Wand2,
  Loader2
} from 'lucide-react';
import { normalizeActivityTitle, normalizeMultipleTitles } from '../utils/aiTitleNormalizer';
import { SkeletonMetricCard, SkeletonTable, AnimatedCounter } from './common/Skeleton';

export const ActivityManagement: React.FC = () => {
  const {
    user,
    activities,
    reviewActivity,
    deleteActivity,
    deleteBatchActivities,
    updateActivity,
    updateActivityProof,
    sendActivityRosterReminder,
    toggleLockActivity,
    branchClasses,
    academicYear,
    showToast,
    isInitialLoading
  } = useApp();

  const currentLevel = user.currentRole.roleLevel;
  const currentOrgCode = user.currentRole.orgCode;
  const currentClassCode = user.currentRole.classCode || user.classCode;

  // Filter & Search states: Học kỳ, Năm học, Loại hình Đoàn/Hội & Trạng thái
  const [searchTerm, setSearchTerm] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState<FilterAcademicYear>('ALL');
  const [semesterFilter, setSemesterFilter] = useState<FilterSemester>('ALL');
  const [activityTypeFilter, setActivityTypeFilter] = useState<FilterActivityType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ActivityStatus>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Pagination State for high-performance responsive rendering
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(24);

  // Reset to page 1 on filter or search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, academicYearFilter, semesterFilter, activityTypeFilter, statusFilter]);

  // Bento Stats Overview
  const stats = useMemo(() => {
    const total = activities.length;
    const approved = activities.filter(a => a.status === 'Approved').length;
    const pending = activities.filter(a => a.status.startsWith('Pending') || a.status === 'Request_Edit').length;
    const totalParticipants = activities.reduce(
      (acc, a) => acc + (a.officialParticipantCount || (a.participants?.length || 0)),
      0
    );
    const approvedRate = total > 0 ? Math.round((approved / total) * 100) : 0;
    return { total, approved, pending, totalParticipants, approvedRate };
  }, [activities]);

  // Excel Modal State
  const [excelTargetAct, setExcelTargetAct] = useState<ActivitySubmission | null>(null);

  // Review & Edit Modal State
  const [selectedAct, setSelectedAct] = useState<ActivitySubmission | null>(null);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [reviewModalType, setReviewModalType] = useState<'approve' | 'reject' | 'request_edit' | 'view' | 'edit' | null>(null);

  // Edit fields state
  const [editTitle, setEditTitle] = useState('');
  const [editManager, setEditManager] = useState('');
  const [editSignedDoc, setEditSignedDoc] = useState('');
  const [editProofUrl, setEditProofUrl] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');

  // Proof Update Modal State
  const [proofModalAct, setProofModalAct] = useState<ActivitySubmission | null>(null);
  const [proofForm, setProofForm] = useState({
    actualPlanUrl: '',
    attendanceSheetUrl: '',
    proofArticleUrl: '',
    proofImageUrl: '',
    proofImages: [] as string[],
  });

  // Delete Action Modal States
  const [deleteTargetAct, setDeleteTargetAct] = useState<ActivitySubmission | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Batch Selection States
  const [selectedActIds, setSelectedActIds] = useState<string[]>([]);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
  const [batchDeleteReason, setBatchDeleteReason] = useState('');

  // Bulk 15-Item Activity Management (Cấp 4)
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Diagnostic Log Inspector Modal State
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);

  // AI Title Normalization States
  const [normalizingActId, setNormalizingActId] = useState<string | null>(null);
  const [isBatchNormalizing, setIsBatchNormalizing] = useState<boolean>(false);

  const handleNormalizeSingleActivityTitle = async (act: ActivitySubmission) => {
    setNormalizingActId(act.id);
    try {
      showToast(`Đang dùng AI Gemini chuẩn hóa tên hoạt động #${act.id}...`, 'info');
      const res = await normalizeActivityTitle(act.title, {
        category: act.activityType,
        orgName: act.orgCode
      });
      if (res.normalizedTitle && res.normalizedTitle !== act.title) {
        await updateActivity(act.id, { title: res.normalizedTitle });
        showToast(`Đã chuẩn hóa tên hoạt động #${act.id} thành: "${res.normalizedTitle}"`, 'success');
      } else {
        showToast(`Tên hoạt động #${act.id} đã đầy đủ và chuẩn hóa.`, 'info');
      }
    } catch (err) {
      console.error(err);
      showToast(`Lỗi khi chuẩn hóa tên hoạt động #${act.id}`, 'error');
    } finally {
      setNormalizingActId(null);
    }
  };

  const handleBatchNormalizeSelectedTitles = async () => {
    const selectedActs = activities.filter(a => selectedActIds.includes(a.id));
    if (selectedActs.length === 0) return;

    setIsBatchNormalizing(true);
    showToast(`Đang dùng AI Gemini chuẩn hóa ${selectedActs.length} hoạt động đã chọn...`, 'info');
    try {
      const titles = selectedActs.map(a => a.title);
      const normalizedTitles = await normalizeMultipleTitles(titles);

      let updatedCount = 0;
      for (let i = 0; i < selectedActs.length; i++) {
        const act = selectedActs[i];
        const newTitle = normalizedTitles[i];
        if (newTitle && newTitle !== act.title) {
          await updateActivity(act.id, { title: newTitle });
          updatedCount++;
        }
      }
      showToast(`Đã dùng AI chuẩn hóa thành công ${updatedCount}/${selectedActs.length} tên hoạt động!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi chuẩn hóa tên hoạt động hàng loạt', 'error');
    } finally {
      setIsBatchNormalizing(false);
    }
  };

  const handleBatchNormalizeAllFilteredTitles = async () => {
    if (filteredActivities.length === 0) {
      showToast('Không có hoạt động nào trong bộ lọc hiện tại', 'warning');
      return;
    }

    setIsBatchNormalizing(true);
    showToast(`Đang dùng AI Gemini chuẩn hóa ${filteredActivities.length} hoạt động trong bộ lọc...`, 'info');
    try {
      const titles = filteredActivities.map(a => a.title);
      const normalizedTitles = await normalizeMultipleTitles(titles);

      let updatedCount = 0;
      for (let i = 0; i < filteredActivities.length; i++) {
        const act = filteredActivities[i];
        const newTitle = normalizedTitles[i];
        if (newTitle && newTitle !== act.title) {
          await updateActivity(act.id, { title: newTitle });
          updatedCount++;
        }
      }
      showToast(`Đã chuẩn hóa thành công ${updatedCount}/${filteredActivities.length} tên hoạt động!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi chuẩn hóa tên hoạt động hàng loạt', 'error');
    } finally {
      setIsBatchNormalizing(false);
    }
  };

  const handleDownloadTemplate = () => {
    try {
      downloadActivity15BlankTemplate();
      showToast('Đã tải xuống biểu mẫu Excel chuẩn 15 mục thành công!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi tải file mẫu Excel.', 'error');
    }
  };

  const handleExport15Items = () => {
    if (filteredActivities.length === 0) {
      showToast('Không có hoạt động nào trong bộ lọc để xuất file!', 'error');
      return;
    }
    try {
      exportActivitiesToExcel15Items(
        filteredActivities,
        `DanhSach_${filteredActivities.length}HoatDong_Mau15Muc_NLU`
      );
      showToast(`Đã xuất thành công ${filteredActivities.length} hoạt động ra file Excel chuẩn 15 mục!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi xuất file Excel hoạt động.', 'error');
    }
  };

  const handleExportSelected15Items = () => {
    const selectedActs = activities.filter(a => selectedActIds.includes(a.id));
    if (selectedActs.length === 0) {
      showToast('Chưa chọn hoạt động nào để xuất file!', 'error');
      return;
    }
    try {
      exportActivitiesToExcel15Items(
        selectedActs,
        `DanhSach_${selectedActs.length}HoatDong_DaChon_Mau15Muc_NLU`
      );
      showToast(`Đã xuất thành công ${selectedActs.length} hoạt động đã chọn ra file Excel chuẩn 15 mục!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi xuất file Excel hoạt động đã chọn.', 'error');
    }
  };

  // Check delete permission
  const canDeleteAct = (act: ActivitySubmission): boolean => {
    if (currentLevel < 2) return false;
    if (currentLevel === 4) return true; // Cấp 4 toàn quyền xóa
    if (act.isLocked) return false; // Khóa sổ thì chỉ Cấp 4 xóa được

    if (currentLevel === 3) {
      const isMyOrg = act.orgCode === currentOrgCode;
      const isMyBranch = act.branchClass && branchClasses.some(c => c.code === act.branchClass && c.facultyCode === currentOrgCode);
      return Boolean(isMyOrg || isMyBranch);
    }

    if (currentLevel === 2) {
      if (currentClassCode && act.branchClass) {
        return act.branchClass === currentClassCode;
      }
      return act.orgCode === currentOrgCode;
    }

    return false;
  };

  // Proof Modal Handlers: Chỉ cho phép cập nhật theo từng cấp, không hiển thị và cấm cấp 1 (L1) và cấp 0 (L0)
  const canUpdateProof = (act: ActivitySubmission): boolean => {
    if (currentLevel < 2) return false;
    if (currentLevel === 4) return true;

    if (currentLevel === 3) {
      const isMyFacultyAct = act.orgCode === currentOrgCode;
      const isMyFacultyBranch = act.branchClass && branchClasses.some(c => c.code === act.branchClass && c.facultyCode === currentOrgCode);
      return Boolean(isMyFacultyAct || isMyFacultyBranch);
    }

    if (currentLevel === 2) {
      if (currentClassCode && act.branchClass) {
        return act.branchClass === currentClassCode;
      }
      return act.orgCode === currentOrgCode;
    }

    return false;
  };

  const myBranchClassCodes = useMemo(() => {
    if (!currentOrgCode) return new Set<string>();
    return new Set(branchClasses.filter(c => c.facultyCode === currentOrgCode).map(c => c.code));
  }, [branchClasses, currentOrgCode]);

  // Filter activities based on role context, academic year, semester, activity type, status and search
  const filteredActivities = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const currentClass = user.currentRole.classCode;
    const currentStudentId = user.studentId;
    const userEmail = user.email ? user.email.toLowerCase() : '';

    return activities.filter(act => {
      const isCreator =
        (act.createdEmail && userEmail && act.createdEmail.toLowerCase() === userEmail) ||
        (act.createdBy && act.createdBy === user.id) ||
        (act.managerStudentId && act.managerStudentId === currentStudentId) ||
        (userEmail && act.approvedByL4 && act.approvedByL4.toLowerCase() === userEmail);

      if (currentLevel === 3) {
        const isMyOrg = act.orgCode === currentOrgCode;
        const isMyBranch = act.branchClass ? myBranchClassCodes.has(act.branchClass) : false;
        if (!isMyOrg && !isMyBranch && !isCreator) return false;
      } else if (currentLevel === 2) {
        const isMyClass = currentClass && act.branchClass === currentClass;
        const isMyOrg = act.orgCode === currentOrgCode;
        if (!isMyClass && !isMyOrg && !isCreator) return false;
      } else if (currentLevel === 1) {
        const isMyParticipation = act.participants?.some(p => p.studentId === currentStudentId);
        if (!isMyParticipation && !isCreator) return false;
      }

      if (statusFilter !== 'ALL' && act.status !== statusFilter) return false;

      return matchActivityFilters(act, {
        academicYear: academicYearFilter,
        semester: semesterFilter,
        activityType: activityTypeFilter,
        searchTerm: term,
      });
    });
  }, [
    activities,
    currentLevel,
    currentOrgCode,
    user.currentRole.classCode,
    user.studentId,
    user.id,
    user.email,
    myBranchClassCodes,
    statusFilter,
    academicYearFilter,
    semesterFilter,
    activityTypeFilter,
    searchTerm,
  ]);

  // High-performance pagination calculations
  const totalItems = filteredActivities.length;
  const isShowAll = pageSize === -1;
  const totalPages = isShowAll ? 1 : Math.max(1, Math.ceil(totalItems / (pageSize > 0 ? pageSize : 1)));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = isShowAll ? 0 : (safePage - 1) * pageSize;
  const endIndex = isShowAll ? totalItems : Math.min(startIndex + pageSize, totalItems);

  const paginatedActivities = useMemo(() => {
    if (isShowAll) return filteredActivities;
    return filteredActivities.slice(startIndex, endIndex);
  }, [filteredActivities, startIndex, endIndex, isShowAll]);

  // List of deletable activities among currently filtered
  const deletableFilteredActs = useMemo(() => {
    return filteredActivities.filter(act => canDeleteAct(act));
  }, [filteredActivities, currentLevel, currentOrgCode, currentClassCode, branchClasses]);

  const isAllSelected = deletableFilteredActs.length > 0 && deletableFilteredActs.every(act => selectedActIds.includes(act.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedActIds(prev => prev.filter(id => !deletableFilteredActs.some(act => act.id === id)));
    } else {
      const newIds = Array.from(new Set([...selectedActIds, ...deletableFilteredActs.map(act => act.id)]));
      setSelectedActIds(newIds);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedActIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const handleOpenReview = (act: ActivitySubmission, type: 'approve' | 'reject' | 'request_edit' | 'view' | 'edit') => {
    setSelectedAct(act);
    setReviewModalType(type);
    setFeedbackNote(act.feedbackNotes || '');
    if (type === 'edit') {
      setEditTitle(act.title);
      setEditManager(act.managerName);
      setEditSignedDoc(act.signedDocUrl);
      setEditProofUrl(act.proofArticleUrl);
      setEditStartDate(act.startDate);
      setEditEndDate(act.endDate || act.startDate);
    }
  };

  const userContext = useMemo(() => ({
    email: user.email,
    id: user.id,
    roleLevel: currentLevel,
    orgCode: currentOrgCode
  }), [user.email, user.id, currentLevel, currentOrgCode]);

  const handleConfirmReview = async (decision: 'approve' | 'reject' | 'request_edit') => {
    if (!selectedAct) return;
    try {
      await reviewActivity(selectedAct.id, decision, feedbackNote);
      setReviewModalType(null);
      setSelectedAct(null);
    } catch (err) {
      logFirestoreWriteDiagnostic('REVIEW_ACTIVITY', { id: selectedAct.id, decision, feedbackNote }, err, showToast, userContext);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAct) return;
    const editData = {
      title: editTitle,
      managerName: editManager,
      signedDocUrl: editSignedDoc,
      proofArticleUrl: editProofUrl,
      startDate: editStartDate,
      endDate: editEndDate,
    };
    try {
      await updateActivity(selectedAct.id, editData);
      setReviewModalType(null);
      setSelectedAct(null);
    } catch (err) {
      logFirestoreWriteDiagnostic('UPDATE_ACTIVITY', { id: selectedAct.id, ...editData }, err, showToast, userContext);
    }
  };

  // Proof Modal
  const handleOpenProofModal = (act: ActivitySubmission) => {
    if (!canUpdateProof(act)) {
      showToast('Bạn chỉ có quyền cập nhật hồ sơ minh chứng theo đúng cấp quản lý của đơn vị!', 'error');
      return;
    }
    setProofModalAct(act);
    setProofForm({
      actualPlanUrl: act.actualPlanUrl || act.signedDocUrl || '',
      attendanceSheetUrl: act.attendanceSheetUrl || '',
      proofArticleUrl: act.proofArticleUrl || '',
      proofImageUrl: '',
      proofImages: act.proofImages || [],
    });
  };

  const handleAddProofImage = () => {
    if (!proofForm.proofImageUrl.trim()) return;
    setProofForm(prev => ({
      ...prev,
      proofImages: [...prev.proofImages, prev.proofImageUrl.trim()],
      proofImageUrl: '',
    }));
  };

  const handleRemoveProofImage = (index: number) => {
    setProofForm(prev => ({
      ...prev,
      proofImages: prev.proofImages.filter((_, i) => i !== index),
    }));
  };

  const handleSaveProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofModalAct) return;

    if (!canUpdateProof(proofModalAct)) {
      showToast('Cảnh báo: Bạn không có quyền lưu minh chứng cho hoạt động này!', 'error');
      return;
    }

    const proofData = {
      actualPlanUrl: proofForm.actualPlanUrl,
      attendanceSheetUrl: proofForm.attendanceSheetUrl,
      proofArticleUrl: proofForm.proofArticleUrl,
      proofImages: proofForm.proofImages,
    };

    try {
      await updateActivityProof(proofModalAct.id, proofData);
      setProofModalAct(null);
    } catch (err) {
      logFirestoreWriteDiagnostic('UPDATE_ACTIVITY_PROOF', { id: proofModalAct.id, ...proofData }, err, showToast, userContext);
    }
  };

  // Single Deletion
  const handleOpenDeleteModal = (act: ActivitySubmission) => {
    if (!canDeleteAct(act)) {
      showToast('Bạn không có quyền xóa hoạt động này!', 'error');
      return;
    }
    setDeleteTargetAct(act);
    setDeleteReason('');
  };

  const handleConfirmSingleDelete = async () => {
    if (!deleteTargetAct) return;
    setIsDeleting(true);
    try {
      const ok = await deleteActivity(deleteTargetAct.id, deleteReason.trim());
      if (ok) {
        if (selectedAct?.id === deleteTargetAct.id) {
          setSelectedAct(null);
          setReviewModalType(null);
        }
        setSelectedActIds(prev => prev.filter(id => id !== deleteTargetAct.id));
        setDeleteTargetAct(null);
        setDeleteReason('');
      }
    } catch (err) {
      logFirestoreWriteDiagnostic('DELETE_ACTIVITY', { id: deleteTargetAct.id, reason: deleteReason }, err, showToast, userContext);
    } finally {
      setIsDeleting(false);
    }
  };

  // Batch Deletion
  const handleConfirmBatchDelete = async () => {
    if (!selectedActIds.length) return;
    setIsDeleting(true);
    try {
      const ok = await deleteBatchActivities(selectedActIds, batchDeleteReason.trim());
      if (ok) {
        if (selectedAct && selectedActIds.includes(selectedAct.id)) {
          setSelectedAct(null);
          setReviewModalType(null);
        }
        setSelectedActIds([]);
        setShowBatchDeleteModal(false);
        setBatchDeleteReason('');
      }
    } catch (err) {
      logFirestoreWriteDiagnostic('BATCH_DELETE_ACTIVITIES', { ids: selectedActIds, reason: batchDeleteReason }, err, showToast, userContext);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: ActivityStatus) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Đã Phê Duyệt
          </span>
        );
      case 'Pending_L3':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Chờ Khoa Duyệt
          </span>
        );
      case 'Pending_L4':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/60 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            Chờ Trường Duyệt
          </span>
        );
      case 'Request_Edit':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200/60 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            Yêu Cầu Sửa
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Từ Chối
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Bento Overview Metric Cards */}
      {isInitialLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonMetricCard variant="slate" hasBadge={false} />
          <SkeletonMetricCard variant="emerald" hasBadge={true} />
          <SkeletonMetricCard variant="amber" hasBadge={true} />
          <SkeletonMetricCard variant="teal" hasBadge={false} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Tổng Hoạt Động */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4.5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Tổng Kế Hoạch
              </span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                <AnimatedCounter value={stats.total} />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Năm học <span className="font-semibold text-slate-700 dark:text-slate-300">{academicYear}</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Đã Phê Duyệt */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4.5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Đã Phê Duyệt
              </span>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                <AnimatedCounter value={stats.approved} />
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{stats.approvedRate}% hoàn tất xét duyệt</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Check className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Chờ Thẩm Định */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4.5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Chờ Thẩm Định
              </span>
              <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                <AnimatedCounter value={stats.pending} />
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1 font-semibold">
                <Clock className="w-3.5 h-3.5" />
                <span>Cần xử lý quy trình L3/L4</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Tổng Lượt SV Tham Gia */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4.5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between group">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Lượt SV Tham Gia
              </span>
              <div className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 font-mono tabular-nums">
                <AnimatedCounter value={stats.totalParticipants} />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                <Users className="w-3.5 h-3.5 text-sky-500" />
                <span>Theo danh sách chính thức</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* 2. Top Header & Primary Action Bar - Fixed Non-Overlapping Layout */}
      <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3 transition-all overflow-hidden">
        {/* Left: Content Header, Title */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2.5 flex-wrap min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Calendar className="w-4 h-4" />
            </div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
              Cổng Quản Lý Hoạt Động & Quy Trình Phê Duyệt
            </h2>
          </div>
        </div>

        {/* Right: Compact Action Buttons Toolbar (Icon Only) */}
        <div className="flex items-center gap-2 flex-wrap shrink-0 self-start md:self-center">
          {/* Nút Chuẩn Hóa AI Tên Hoạt Động Hàng Loạt */}
          <button
            type="button"
            onClick={handleBatchNormalizeAllFilteredTitles}
            disabled={isBatchNormalizing || filteredActivities.length === 0}
            className="inline-flex items-center justify-center p-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-95 text-white rounded-xl shadow-2xs transition cursor-pointer min-h-[36px] min-w-[36px] disabled:opacity-50"
            title="Sử dụng AI Gemini chuẩn hóa tự động tên toàn bộ hoạt động trong bộ lọc"
          >
            {isBatchNormalizing ? (
              <Loader2 className="w-4 h-4 text-purple-100 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4 text-purple-100" />
            )}
          </button>

          {/* Quyền Cấp 4: Tải Hàng Loạt Hoạt Động Theo Mẫu Đăng Ký 15 Mục */}
          {currentLevel === 4 && (
            <button
              type="button"
              onClick={() => setShowBulkModal(true)}
              className="inline-flex items-center justify-center p-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl shadow-2xs transition cursor-pointer min-h-[36px] min-w-[36px]"
              title="Nạp hàng loạt hoạt động theo mẫu đăng ký 15 mục qua tệp Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            </button>
          )}

          {/* Nút Kiểm Tra Nhật Ký Diagnostic Logs Firestore */}
          <button
            type="button"
            onClick={() => setShowDiagnosticModal(true)}
            className="inline-flex items-center justify-center p-2.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 active:scale-95 text-amber-800 dark:text-amber-300 rounded-xl shadow-2xs transition cursor-pointer min-h-[36px] min-w-[36px]"
            title="Xem Diagnostic Logs: Nhật ký bắt vết lỗi ghi Firestore"
          >
            <AlertOctagon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </button>

          {/* Nút Tải Xuất Danh Sách Hoạt Động */}
          <button
            type="button"
            onClick={handleExport15Items}
            className="inline-flex items-center justify-center p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 rounded-xl shadow-2xs transition cursor-pointer min-h-[36px] min-w-[36px]"
            title="Tải xuất danh sách hoạt động hiện có ra Excel"
          >
            <Download className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </button>

          {currentLevel >= 2 && (
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center justify-center p-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl shadow-2xs hover:shadow-xs transition cursor-pointer shrink-0 min-h-[36px] min-w-[36px]"
              title="Đăng Ký Kế Hoạch"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Unified Balanced Header & Toolbar with Frosted Glass */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-4 space-y-3 transition-colors">
        {/* Row 1: 1. Ô tìm kiếm & Dropdown filters & 3. Display mode (Icon only) */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* 1. Ô tìm kiếm */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm hoạt động..."
              className="w-full pl-9.5 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter dropdowns (Năm học, Học kỳ, Khối) */}
            <select
              value={academicYearFilter}
              onChange={e => setAcademicYearFilter(e.target.value as FilterAcademicYear)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer"
            >
              {ACADEMIC_YEARS.map(y => (
                <option key={y.value} value={y.value}>
                  {y.label}
                </option>
              ))}
            </select>

            <select
              value={semesterFilter}
              onChange={e => setSemesterFilter(e.target.value as FilterSemester)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer"
            >
              {SEMESTERS.map(s => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <select
              value={activityTypeFilter}
              onChange={e => setActivityTypeFilter(e.target.value as FilterActivityType)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer"
            >
              {ACTIVITY_TYPES.map(t => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            {/* 3. Tính năng hiển thị ưu tiên Lưới Bento (Icon only) */}
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/60 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`inline-flex items-center justify-center p-2 rounded-lg transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Xem dạng Lưới Bento"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`inline-flex items-center justify-center p-2 rounded-lg transition cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Xem dạng Bảng"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: 2. Các tính năng trạng thái (Status Filter Tabs) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {(
              [
                { id: 'ALL', label: 'Tất cả' },
                { id: 'Pending_L3', label: 'Chờ Khoa' },
                { id: 'Pending_L4', label: 'Chờ Trường' },
                { id: 'Request_Edit', label: 'Cần Sửa' },
                { id: 'Approved', label: 'Đã Duyệt' },
                { id: 'Rejected', label: 'Từ Chối' },
              ] as const
            ).map(st => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                  statusFilter === st.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0 font-mono">
            <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
              {filteredActivities.length}
            </strong>
            /{activities.length} HĐ
          </div>
        </div>
      </div>

      {/* 4. Batch Selection Floating Bar */}
      {selectedActIds.length > 0 && (
        <div className="flex items-center justify-between gap-3 p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl animate-in fade-in duration-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-200">
            <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Đã chọn {selectedActIds.length} hoạt động</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedActIds([])}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl transition"
            >
              Bỏ chọn tất cả
            </button>
            <button
              type="button"
              onClick={handleBatchNormalizeSelectedTitles}
              disabled={isBatchNormalizing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
              title="Dùng AI Gemini chuẩn hóa tên các hoạt động đã chọn"
            >
              {isBatchNormalizing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5" />
              )}
              Chuẩn hóa AI ({selectedActIds.length})
            </button>
            {currentLevel === 4 && (
              <button
                type="button"
                onClick={handleExportSelected15Items}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-700 hover:bg-sky-800 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition"
                title="Tải xuất các hoạt động đã chọn ra file Excel chuẩn 15 mục"
              >
                <Download className="w-3.5 h-3.5" />
                Xuất {selectedActIds.length} HĐ Đã Chọn (Mẫu 15 Mục)
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setBatchDeleteReason('');
                setShowBatchDeleteModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa các hoạt động đã chọn ({selectedActIds.length})
            </button>
          </div>
        </div>
      )}

      {/* 5. Main Content: Bento Cards Grid OR High-Density Table */}
      {isInitialLoading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Đang tải danh sách hoạt động từ Cloud Firestore...</span>
          </div>
          <SkeletonTable rows={6} columns={6} />
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Không Tìm Thấy Hoạt Động Nào
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Không có dữ liệu kế hoạch hoạt động nào phù hợp với các tiêu chí tìm kiếm hoặc bộ lọc hiện hành.
          </p>
          {(searchTerm || academicYearFilter !== 'ALL' || semesterFilter !== 'ALL' || activityTypeFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setAcademicYearFilter('ALL');
                setSemesterFilter('ALL');
                setActivityTypeFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl hover:bg-indigo-100 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Xóa bộ lọc để hiển thị tất cả
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ================= BENTO-INSPIRED ACTIVITY CARDS GRID ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedActivities.map(act => {
            const canReviewL3 = currentLevel === 3 && (act.status === 'Pending_L3' || act.status === 'Request_Edit');
            const canReviewL4 = currentLevel === 4 && (act.status === 'Pending_L4' || act.status === 'Pending_L3' || act.status === 'Request_Edit');
            const canUploadExcel = (act.status === 'Approved' || currentLevel >= 2) && !act.isLocked;
            const isDeletable = canDeleteAct(act);
            const isSelected = selectedActIds.includes(act.id);

            // Capacity & Quota calculation for sleek progress bar
            const currentCount = act.officialParticipantCount || (act.participants ? act.participants.length : 0);
            const targetQuota =
              act.scaleId === 1
                ? 100
                : act.scaleId === 2
                ? 50
                : act.scaleId === 3
                ? 150
                : act.scaleId === 4
                ? 300
                : act.scaleId === 5
                ? 600
                : 1200;
            const capacityPercent = Math.min(100, Math.round((currentCount / targetQuota) * 100));

            // Semester & Type Badges
            const actSemester = getActivitySemester(act);
            const semBadge = getSemesterBadge(actSemester);
            const actType = getActivityType(act);
            const typeBadge = getActivityTypeBadge(actType);

            // Deadline calculations
            const nowMs = Date.now();
            const startMs = new Date(act.startDate).getTime();
            const daysPassed = Math.floor((nowMs - startMs) / (1000 * 60 * 60 * 24));
            const isFinished = nowMs >= startMs;
            const isRosterMissing = act.status === 'Approved' && currentCount === 0;
            const isOverdue = isFinished && isRosterMissing && daysPassed > 7;
            const daysRemaining = Math.max(0, 7 - daysPassed);

            return (
              <div
                key={act.id}
                className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group relative ${
                  isSelected ? 'ring-2 ring-indigo-500 bg-indigo-50/20' : ''
                }`}
              >
                {/* Card Top: Code, Score Level, Status Badge & Batch Selection */}
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Batch Checkbox */}
                      {currentLevel >= 2 && isDeletable && (
                        <button
                          type="button"
                          onClick={() => handleToggleSelectOne(act.id)}
                          className="mr-0.5 text-slate-400 hover:text-indigo-600 transition"
                          title="Chọn hoạt động này"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                          )}
                        </button>
                      )}

                      {/* Code Badge */}
                      <span
                        className={`font-mono text-xs font-black px-2 py-0.5 rounded-lg border inline-flex items-center gap-1 ${
                          act.id.startsWith('A')
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800'
                            : 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        #{act.id}
                      </span>

                      {/* Program Level */}
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-700">
                        Cấp {act.programLevel} · {act.totalLevelScore}đ
                      </span>

                      {isSchoolYouthUnionOrAssociation(act.orgCode, act.orgName) && (
                        <span
                          className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded-lg border border-emerald-200 dark:border-emerald-800"
                          title="Hoạt động do Đoàn trường / Hội Sinh viên trường tổ chức (Ràng buộc tối thiểu từ Cấp 3 trở lên)"
                        >
                          Đoàn - Hội Trường (≥ Cấp 3)
                        </span>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-1">
                      {getStatusBadge(act.status)}
                      {act.isLocked && (
                        <span
                          className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px]"
                          title="Hoạt động đã đóng sổ"
                        >
                          <Lock className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Activity Title */}
                  <h3
                    onClick={() => handleOpenReview(act, 'view')}
                    className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 mt-3 cursor-pointer"
                    title={act.title}
                  >
                    {act.title}
                  </h3>

                  {/* Metadata: Organizer & Branch */}
                  <div className="flex items-center gap-1.5 mt-2.5 text-xs text-slate-600 dark:text-slate-400">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold truncate" title={act.orgName}>
                      {act.orgName}
                    </span>
                    {act.branchClass && (
                      <span className="px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono border border-indigo-200/60 dark:border-indigo-800/60">
                        {act.branchClass}
                      </span>
                    )}
                  </div>

                  {/* Metadata: Date, Semester & Type */}
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {act.startDate}
                        {act.endDate && act.endDate !== act.startDate ? ` → ${act.endDate}` : ''}
                      </span>
                    </div>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border ${semBadge.bgClass} ${semBadge.textClass} ${semBadge.borderClass}`}
                    >
                      {semBadge.label}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border ${typeBadge.bgClass} ${typeBadge.textClass} ${typeBadge.borderClass}`}
                    >
                      {typeBadge.label}
                    </span>
                  </div>

                  {/* Visual Capacity Indicator: Registration Quota Progress Bar */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        Định mức tham gia:
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {currentCount} / {targetQuota} SV
                        <span className="text-slate-400 text-[10px] ml-1">({capacityPercent}%)</span>
                      </span>
                    </div>

                    {/* Sleek Progress Bar */}
                    <div className="w-full bg-slate-200/70 dark:bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          capacityPercent >= 100
                            ? 'bg-emerald-500'
                            : capacityPercent >= 50
                            ? 'bg-indigo-500'
                            : currentCount > 0
                            ? 'bg-sky-500'
                            : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                        style={{ width: `${Math.max(4, capacityPercent)}%` }}
                      />
                    </div>

                    {/* Deadline Alert if missing roster */}
                    {isRosterMissing && (
                      <div className="pt-0.5 flex items-center justify-between text-[10px]">
                        {isOverdue ? (
                          <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Quá hạn nộp DS (&gt;7 ngày)
                          </span>
                        ) : isFinished ? (
                          <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Hạn nộp: Còn {daysRemaining} ngày
                          </span>
                        ) : (
                          <span className="text-slate-400">Chưa nạp DS người tham gia</span>
                        )}

                        {currentLevel >= 3 && (
                          <button
                            type="button"
                            onClick={() => sendActivityRosterReminder(act.id)}
                            className="text-sky-600 dark:text-sky-400 hover:underline font-semibold"
                          >
                            Nhắc email
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Tags row: DRL, SV5T, Cert */}
                  <div className="flex items-center gap-1.5 mt-3 flex-wrap text-[10px]">
                    {act.drlCriteriaId && (
                      <span className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-mono font-bold border border-sky-200/60 dark:border-sky-800/60">
                        ĐRL: {act.drlCriteriaId}
                      </span>
                    )}
                    {act.sv5tCriteriaId && (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono font-bold border border-indigo-200/60 dark:border-indigo-800/60">
                        SV5T: {act.sv5tCriteriaId}
                      </span>
                    )}
                    {act.proofImages && act.proofImages.length > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold border border-teal-200/60 dark:border-teal-800/60">
                        {act.proofImages.length} ảnh
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer: Clean, Non-intrusive Action Buttons */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3.5 mt-4 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    {/* Quick View Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenReview(act, 'view')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Xem chi tiết hoạt động"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Chi tiết</span>
                    </button>

                    {/* Excel Upload / Roster Check-in */}
                    {canUploadExcel && (
                      <button
                        type="button"
                        onClick={() => setExcelTargetAct(act)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                        title="Tải lên danh sách người tham gia từ file Excel"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>{currentCount > 0 ? 'Nạp lại' : 'Nạp DS'}</span>
                      </button>
                    )}
                  </div>

                  {/* Action Icons right side */}
                  <div className="flex items-center gap-0.5">
                    {/* AI Title Normalization Button */}
                    <button
                      type="button"
                      onClick={() => handleNormalizeSingleActivityTitle(act)}
                      disabled={normalizingActId === act.id}
                      title="Dùng AI Gemini chuẩn hóa tên chương trình đầy đủ ý nghĩa"
                      className="p-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition disabled:opacity-50 cursor-pointer"
                    >
                      {normalizingActId === act.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                      ) : (
                        <Wand2 className="w-4 h-4" />
                      )}
                    </button>

                    {/* Upload Proof */}
                    {currentLevel >= 2 && canUpdateProof(act) && (
                      <button
                        type="button"
                        onClick={() => handleOpenProofModal(act)}
                        title="Cập nhật minh chứng tổ chức"
                        className="p-1.5 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg transition"
                      >
                        <CloudUpload className="w-4 h-4" />
                      </button>
                    )}

                    {/* Level 4 Edit & Lock */}
                    {currentLevel === 4 && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenReview(act, 'edit')}
                          title="Sửa thông tin"
                          className="p-1.5 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleLockActivity(act.id)}
                          title={act.isLocked ? 'Mở khóa hoạt động' : 'Khóa sổ'}
                          className={`p-1.5 rounded-lg transition ${
                            act.isLocked
                              ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                              : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {act.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                      </>
                    )}

                    {/* Review Actions */}
                    {(canReviewL3 || canReviewL4) && !act.isLocked && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenReview(act, 'approve')}
                          title="Phê duyệt"
                          className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenReview(act, 'request_edit')}
                          title="Yêu cầu sửa"
                          className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenReview(act, 'reject')}
                          title="Từ chối"
                          className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {/* Delete Action */}
                    {isDeletable && (
                      <button
                        type="button"
                        onClick={() => handleOpenDeleteModal(act)}
                        title="Xóa hoạt động"
                        className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= HIGH-DENSITY DATA TABLE VIEW ================= */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                <tr>
                  {currentLevel >= 2 && (
                    <th className="px-3 py-3 w-10 text-center">
                      <button
                        type="button"
                        onClick={handleToggleSelectAll}
                        title={isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả hoạt động có thể xóa'}
                        className="text-slate-500 hover:text-indigo-600 transition"
                      >
                        {isAllSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </th>
                  )}
                  <th className="px-4 py-3">Mã Hoạt Động</th>
                  <th className="px-4 py-3">Tên Chương Trình & Học Kỳ</th>
                  <th className="px-4 py-3">Đơn Vị & Kế Hoạch</th>
                  <th className="px-4 py-3">Điểm Phân Cấp</th>
                  <th className="px-4 py-3 min-w-[160px]">Định Mức & Tham Gia</th>
                  <th className="px-4 py-3">Trạng Thái & Khóa</th>
                  <th className="px-4 py-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {paginatedActivities.map(act => {
                  const canReviewL3 = currentLevel === 3 && (act.status === 'Pending_L3' || act.status === 'Request_Edit');
                  const canReviewL4 = currentLevel === 4 && (act.status === 'Pending_L4' || act.status === 'Pending_L3' || act.status === 'Request_Edit');
                  const canUploadExcel = (act.status === 'Approved' || currentLevel >= 2) && !act.isLocked;
                  const isDeletable = canDeleteAct(act);
                  const isSelected = selectedActIds.includes(act.id);

                  const actSemester = getActivitySemester(act);
                  const semBadge = getSemesterBadge(actSemester);
                  const actType = getActivityType(act);
                  const typeBadge = getActivityTypeBadge(actType);

                  const currentCount = act.officialParticipantCount || (act.participants ? act.participants.length : 0);
                  const targetQuota =
                    act.scaleId === 1
                      ? 100
                      : act.scaleId === 2
                      ? 50
                      : act.scaleId === 3
                      ? 150
                      : act.scaleId === 4
                      ? 300
                      : act.scaleId === 5
                      ? 600
                      : 1200;
                  const capacityPercent = Math.min(100, Math.round((currentCount / targetQuota) * 100));

                  return (
                    <tr
                      key={act.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition ${
                        act.isLocked ? 'bg-slate-50/40 dark:bg-slate-900/40' : ''
                      } ${isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''}`}
                    >
                      {currentLevel >= 2 && (
                        <td className="px-3 py-3 text-center">
                          {isDeletable ? (
                            <button
                              type="button"
                              onClick={() => handleToggleSelectOne(act.id)}
                              className="text-slate-400 hover:text-indigo-600 transition"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                              )}
                            </button>
                          ) : (
                            <span className="w-4 h-4 block" />
                          )}
                        </td>
                      )}

                      {/* Mã HĐ */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`font-mono text-xs font-black px-2.5 py-1 rounded-md border inline-flex items-center gap-1 ${
                            act.id.startsWith('A')
                              ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800'
                              : 'bg-blue-50 dark:bg-blue-950/80 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          #{act.id}
                        </span>
                        <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {act.id.startsWith('A') ? 'Cấp A (Trường/TW)' : 'Cấp B (Khoa/CLB)'}
                        </span>
                      </td>

                      {/* Tên chương trình */}
                      <td className="px-4 py-3 max-w-xs">
                        <span
                          onClick={() => handleOpenReview(act, 'view')}
                          className="font-bold text-slate-900 dark:text-slate-100 block truncate cursor-pointer hover:text-indigo-600 transition-colors"
                          title={act.title}
                        >
                          {act.title}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${semBadge.bgClass} ${semBadge.textClass} ${semBadge.borderClass}`}
                          >
                            {semBadge.label}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${typeBadge.bgClass} ${typeBadge.textClass} ${typeBadge.borderClass}`}
                          >
                            {typeBadge.label}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            {act.planYear || '2026-2027'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {act.startDate} {act.endDate && act.endDate !== act.startDate ? `→ ${act.endDate}` : ''}
                        </span>
                      </td>

                      {/* Đơn vị */}
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[170px]">
                          {act.orgName}
                        </span>
                        {act.branchClass && (
                          <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono px-1.5 py-0.5 rounded-sm block w-fit mt-0.5 border border-indigo-200 dark:border-indigo-800">
                            {act.branchClass}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          {act.planYearOption || 'Trong kế hoạch năm'}
                        </span>
                      </td>

                      {/* Điểm phân cấp */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-indigo-600 text-white text-[11px] font-black rounded-md">
                            Cấp {act.programLevel}
                          </span>
                          <span className="font-bold text-indigo-700 dark:text-indigo-300 text-xs">
                            ({act.totalLevelScore}đ)
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          Quy mô: {act.scalePoints}đ | SL: {act.participantScorePoints}đ | Cấp: {act.hostLevelPoints}đ
                        </span>
                      </td>

                      {/* Định mức & Tham gia */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {currentCount} / {targetQuota} SV
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {capacityPercent}%
                            </span>
                          </div>
                          <div className="w-28 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full"
                              style={{ width: `${Math.max(4, capacityPercent)}%` }}
                            />
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {canUploadExcel && (
                              <button
                                type="button"
                                onClick={() => setExcelTargetAct(act)}
                                className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline font-bold"
                              >
                                <FileSpreadsheet className="w-3 h-3" />
                                {currentCount > 0 ? 'Nạp lại' : 'Tải Excel'}
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Trạng thái & Khóa */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {getStatusBadge(act.status)}
                          {act.isLocked && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 block w-fit">
                              <Lock className="w-2.5 h-2.5" /> Đã Khóa
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Thao tác */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenReview(act, 'view')}
                            title="Xem chi tiết"
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* AI Title Normalization Button */}
                          <button
                            type="button"
                            onClick={() => handleNormalizeSingleActivityTitle(act)}
                            disabled={normalizingActId === act.id}
                            title="Dùng AI Gemini chuẩn hóa tên chương trình đầy đủ ý nghĩa"
                            className="p-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition disabled:opacity-50 cursor-pointer"
                          >
                            {normalizingActId === act.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                            ) : (
                              <Wand2 className="w-4 h-4" />
                            )}
                          </button>

                          {currentLevel >= 2 && canUpdateProof(act) && (
                            <button
                              type="button"
                              onClick={() => handleOpenProofModal(act)}
                              title="Minh chứng tổ chức"
                              className="p-1.5 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg transition"
                            >
                              <CloudUpload className="w-4 h-4" />
                            </button>
                          )}

                          {currentLevel === 4 && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenReview(act, 'edit')}
                                title="Sửa thông tin"
                                className="p-1.5 text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleLockActivity(act.id)}
                                title={act.isLocked ? 'Mở khóa' : 'Khóa sổ'}
                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                              >
                                {act.isLocked ? <Lock className="w-4 h-4 text-amber-600" /> : <Unlock className="w-4 h-4" />}
                              </button>
                            </>
                          )}

                          {(canReviewL3 || canReviewL4) && !act.isLocked && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenReview(act, 'approve')}
                                title="Phê duyệt"
                                className="p-1.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenReview(act, 'request_edit')}
                                title="Yêu cầu sửa"
                                className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition"
                              >
                                <AlertTriangle className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenReview(act, 'reject')}
                                title="Từ chối"
                                className="p-1.5 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {isDeletable && (
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteModal(act)}
                              title="Xóa hoạt động"
                              className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* High-Performance Pagination Bar */}
      {filteredActivities.length > 0 && (
        <div className="mt-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>
              Hiển thị <strong className="text-slate-900 dark:text-slate-100">{totalItems === 0 ? 0 : startIndex + 1}</strong> - <strong className="text-slate-900 dark:text-slate-100">{endIndex}</strong> trên tổng số <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{totalItems}</strong> hoạt động
            </span>
            <div className="hidden sm:inline-flex items-center gap-1.5 ml-4 pl-4 border-l border-slate-200 dark:border-slate-800">
              <span>Mỗi trang:</span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
                <option value={96}>96</option>
                <option value={-1}>Tất cả</option>
              </select>
            </div>
          </div>

          {!isShowAll && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage(1)}
                title="Trang đầu"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                title="Trang trước"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 px-2 font-semibold">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{safePage}</span>
                <span>/</span>
                <span>{totalPages}</span>
              </div>

              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                title="Trang tiếp"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                title="Trang cuối"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Review, Detail & Edit Modal */}
      {selectedAct && reviewModalType && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  {reviewModalType === 'edit'
                    ? 'Chỉnh Sửa Bổ Sung Hoạt Động (Cấp Trường)'
                    : reviewModalType === 'request_edit'
                    ? 'Gửi Yêu Cầu Chỉnh Sửa Kế Hoạch'
                    : `Hồ Sơ Hoạt Động: ${selectedAct.id}`}
                </h3>
                <p className="text-xs text-slate-300">{selectedAct.title}</p>
              </div>
              <button
                onClick={() => setReviewModalType(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If Edit Mode */}
            {reviewModalType === 'edit' ? (
              <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
                <div className="p-3 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/60 rounded-xl text-sky-800 dark:text-sky-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400" />
                  <span>Cấp Trường có quyền điều chỉnh bổ sung thông tin mà không làm ảnh hưởng đến luồng phê duyệt chính.</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Tên chương trình</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Ngày bắt đầu</label>
                    <input
                      type="date"
                      required
                      value={editStartDate}
                      onChange={e => setEditStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Ngày kết thúc</label>
                    <input
                      type="date"
                      required
                      value={editEndDate}
                      onChange={e => setEditEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Người phụ trách</label>
                  <input
                    type="text"
                    required
                    value={editManager}
                    onChange={e => setEditManager(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Link VB trình ký (Google Drive)</label>
                  <input
                    type="url"
                    value={editSignedDoc}
                    onChange={e => setEditSignedDoc(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Link bài viết minh chứng</label>
                  <input
                    type="url"
                    value={editProofUrl}
                    onChange={e => setEditProofUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-[11px]"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  {canDeleteAct(selectedAct) ? (
                    <button
                      type="button"
                      onClick={() => handleOpenDeleteModal(selectedAct)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl font-bold transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      Xóa hoạt động này
                    </button>
                  ) : <div />}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewModalType(null)}
                      className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs"
                    >
                      Lưu Thay Đổi
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* View / Approve / Request_Edit / Reject Mode */
              <div className="p-6 space-y-4 text-xs">
                {/* Information summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Mã hoạt động</span>
                    <span className="font-mono font-bold text-emerald-800 dark:text-emerald-400 text-sm">{selectedAct.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Đơn vị tổ chức</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{selectedAct.orgName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Người phụ trách</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{selectedAct.managerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Điểm phân cấp</span>
                    <span className="font-black text-emerald-700 dark:text-emerald-400 text-sm">
                      Cấp {selectedAct.programLevel} ({selectedAct.totalLevelScore} điểm)
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                  <span className="font-bold text-emerald-900 dark:text-emerald-200 block mb-1">
                    Điểm phân cấp = Quy mô ({selectedAct.scalePoints}đ) + Số lượng ({selectedAct.participantScorePoints}đ) + Cấp đăng cai ({selectedAct.hostLevelPoints}đ)
                  </span>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                    Số lượng sinh viên tham gia chính thức: {selectedAct.officialParticipantCount} người.
                  </p>
                </div>

                {/* Proof documents links */}
                <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">Hồ Sơ Minh Chứng & Kế Hoạch:</span>
                  {selectedAct.signedDocUrl && (
                    <a
                      href={selectedAct.signedDocUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-700 dark:text-sky-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <HardDrive className="w-3.5 h-3.5" /> Văn bản kế hoạch trình ký
                    </a>
                  )}
                  {selectedAct.actualPlanUrl && (
                    <a
                      href={selectedAct.actualPlanUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-700 dark:text-sky-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Văn bản kế hoạch thực tế (Cập nhật)
                    </a>
                  )}
                  {selectedAct.attendanceSheetUrl && (
                    <a
                      href={selectedAct.attendanceSheetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-700 dark:text-sky-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" /> Danh sách điểm danh ký tên
                    </a>
                  )}
                  {selectedAct.proofArticleUrl && (
                    <a
                      href={selectedAct.proofArticleUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-700 dark:text-sky-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Link className="w-3.5 h-3.5" /> Bài viết truyền thông nghiệm thu
                    </a>
                  )}

                  {/* Cho phép cập nhật theo từng cấp, không hiển thị cấp 1 và cấp 0 */}
                  {currentLevel >= 2 && canUpdateProof(selectedAct) && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setReviewModalType(null);
                          handleOpenProofModal(selectedAct);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-300 text-xs font-bold rounded-lg border border-teal-200 dark:border-teal-800 transition"
                      >
                        <CloudUpload className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                        Cập Nhật Hồ Sơ Minh Chứng Tổ Chức
                      </button>
                    </div>
                  )}
                </div>

                {/* Participant roster preview */}
                {selectedAct.participants && selectedAct.participants.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Danh sách tham gia ({selectedAct.participants.length} SV)
                      </span>
                    </div>
                    <div className="max-h-32 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-100 dark:bg-slate-800 font-bold uppercase text-slate-500 dark:text-slate-400">
                          <tr>
                            <th className="p-2">MSSV</th>
                            <th className="p-2">Họ Tên</th>
                            <th className="p-2">Vai trò</th>
                            <th className="p-2 text-right">Điểm</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {selectedAct.participants.slice(0, 8).map((p, i) => (
                            <tr key={`${p.studentId || ''}-${i}`}>
                              <td className="p-2 font-mono text-slate-800 dark:text-slate-200">{p.studentId}</td>
                              <td className="p-2 text-slate-700 dark:text-slate-300">{p.fullName}</td>
                              <td className="p-2 font-semibold text-slate-700 dark:text-slate-300">{p.role}</td>
                              <td className="p-2 text-right font-black text-emerald-700 dark:text-emerald-400">+{p.pointsAwarded}đ</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Approval Action Section */}
                {reviewModalType !== 'view' && !selectedAct.isLocked && (
                  <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Ý kiến nhận xét & ghi chú phê duyệt (Phản hồi cho đơn vị)
                    </label>
                    <textarea
                      rows={3}
                      value={feedbackNote}
                      onChange={e => setFeedbackNote(e.target.value)}
                      placeholder="Nhập ý kiến đánh giá hồ sơ, minh chứng hoặc nội dung yêu cầu đơn vị chỉnh sửa..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    ></textarea>

                    <div className="flex items-center justify-between gap-2 pt-2 flex-wrap">
                      {canDeleteAct(selectedAct) ? (
                        <button
                          type="button"
                          onClick={() => handleOpenDeleteModal(selectedAct)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                          Xóa hoạt động
                        </button>
                      ) : <div />}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setReviewModalType(null)}
                          className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                        >
                          Đóng
                        </button>

                        <button
                          type="button"
                          onClick={() => handleConfirmReview('request_edit')}
                          className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm transition"
                        >
                          Yêu Cầu Chỉnh Sửa
                        </button>

                        <button
                          type="button"
                          onClick={() => handleConfirmReview('reject')}
                          className="px-4 py-2 text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white rounded-lg shadow-sm transition"
                        >
                          Từ Chối
                        </button>

                        <button
                          type="button"
                          onClick={() => handleConfirmReview('approve')}
                          className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-sm transition"
                        >
                          Phê Duyệt ({currentLevel === 3 ? 'Trình Cấp 4' : 'Duyệt Chính Thức'})
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {reviewModalType === 'view' && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    {canDeleteAct(selectedAct) ? (
                      <button
                        type="button"
                        onClick={() => handleOpenDeleteModal(selectedAct)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                        Xóa hoạt động này
                      </button>
                    ) : <div />}

                    <button
                      type="button"
                      onClick={() => setReviewModalType(null)}
                      className="px-5 py-2 text-xs font-bold bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900 rounded-xl"
                    >
                      Đóng Hồ Sơ
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Proof Update Modal (Module 4: Bổ sung Minh chứng tổ chức) */}
      {proofModalAct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-teal-800 to-emerald-800 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <CloudUpload className="w-5 h-5 text-teal-300" />
                  Cập Nhật Hồ Sơ Minh Chứng Tổ Chức
                </h3>
                <p className="text-xs text-teal-100">
                  Hoạt động: [{proofModalAct.id}] {proofModalAct.title}
                </p>
              </div>
              <button
                onClick={() => setProofModalAct(null)}
                className="p-1 rounded-lg text-teal-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProof} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Đường dẫn Văn bản Kế hoạch thực tế (Google Drive / File)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/..."
                  value={proofForm.actualPlanUrl}
                  onChange={e => setProofForm(prev => ({ ...prev, actualPlanUrl: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Danh sách Điểm danh ký tên (Google Drive / PDF / Sheet)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/... hoặc link trang tính điểm danh"
                  value={proofForm.attendanceSheetUrl}
                  onChange={e => setProofForm(prev => ({ ...prev, attendanceSheetUrl: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Link Bài viết truyền thông / Tổng kết nghiệm thu
                </label>
                <input
                  type="url"
                  placeholder="https://tuoitrenonglam.com/tin-tuc/..."
                  value={proofForm.proofArticleUrl}
                  onChange={e => setProofForm(prev => ({ ...prev, proofArticleUrl: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-[11px]"
                />
              </div>

              {/* Proof Images */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Hình ảnh Minh chứng hoạt động (URL hình ảnh)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Dán link ảnh (https://...jpg/png)"
                    value={proofForm.proofImageUrl}
                    onChange={e => setProofForm(prev => ({ ...prev, proofImageUrl: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={handleAddProofImage}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg shrink-0"
                  >
                    Thêm Ảnh
                  </button>
                </div>

                {proofForm.proofImages.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {proofForm.proofImages.map((img, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px]">
                        <span className="truncate max-w-sm text-slate-600 dark:text-slate-300 font-mono">{img}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveProofImage(idx)}
                          className="text-rose-600 dark:text-rose-400 hover:text-rose-800 font-bold ml-2"
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProofModalAct(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  Lưu Minh Chứng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Xóa Hoạt Động Đơn Lẻ */}
      {deleteTargetAct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-rose-200 dark:border-rose-900/60 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-rose-700 to-red-800 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Xác Nhận Xóa Hoạt Động Đoàn - Hội</h3>
                  <p className="text-xs text-rose-100">Thao tác có lưu vết kiểm toán hệ thống Cấp 4</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTargetAct(null)}
                disabled={isDeleting}
                className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Target Activity Summary Card */}
              <div className="p-4 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-rose-800 dark:text-rose-300 text-sm">
                    #{deleteTargetAct.id}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-rose-200 dark:border-rose-900">
                    Cấp {deleteTargetAct.programLevel} ({deleteTargetAct.totalLevelScore}đ)
                  </span>
                </div>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {deleteTargetAct.title}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
                  <span>Đơn vị: <strong>{deleteTargetAct.orgName}</strong></span>
                  <span>Học kỳ: <strong>{deleteTargetAct.semester || 'Học kỳ I'}</strong></span>
                  <span>Người tham gia: <strong>{deleteTargetAct.officialParticipantCount || 0} SV</strong></span>
                </div>
              </div>

              {/* Safety Warning */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Cảnh báo quan trọng:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-800 dark:text-amber-300">
                    <li>Dữ liệu hồ sơ hoạt động sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu.</li>
                    {deleteTargetAct.status === 'Approved' && (deleteTargetAct.officialParticipantCount || 0) > 0 && (
                      <li>Điểm rèn luyện của <strong>{deleteTargetAct.officialParticipantCount} sinh viên</strong> đã ghi nhận sẽ tự động được hoàn tác và tính toán lại xếp loại thi đua.</li>
                    )}
                    <li>Hành động xóa sẽ được ghi nhận vào <strong>Lịch Sử Hoạt Động (System Activity Log)</strong> của Cấp 4 để đối soát minh bạch.</li>
                  </ul>
                </div>
              </div>

              {/* Reason Input */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Lý do xóa hoạt động (ghi nhận vào nhật ký kiểm toán)
                </label>
                <textarea
                  rows={2}
                  value={deleteReason}
                  onChange={e => setDeleteReason(e.target.value)}
                  placeholder="Nhập lý do xóa (ví dụ: Hủy kế hoạch, trùng lặp thông tin, tạo nhầm dữ liệu...)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteTargetAct(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold rounded-xl transition"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSingleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-rose-700 hover:bg-rose-800 active:scale-95 text-white font-bold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Đang Xóa...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Xác Nhận Xóa Vĩnh Viễn
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Xóa Hàng Loạt Hoạt Động */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-rose-200 dark:border-rose-900/60 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-rose-700 to-red-800 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Xác Nhận Xóa {selectedActIds.length} Hoạt Động</h3>
                  <p className="text-xs text-rose-100">Xóa hàng loạt có lưu vết kiểm toán hệ thống</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBatchDeleteModal(false)}
                disabled={isDeleting}
                className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl space-y-2">
                <span className="font-bold text-rose-900 dark:text-rose-200 block">
                  Danh sách {selectedActIds.length} hoạt động sẽ bị xóa:
                </span>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {selectedActIds.map(id => {
                    const act = activities.find(a => a.id === id);
                    return (
                      <div key={id} className="flex items-center justify-between text-[11px] p-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{id}</span>
                        <span className="truncate max-w-[220px] font-semibold text-slate-700 dark:text-slate-300">{act?.title || id}</span>
                        <span className="text-[10px] text-slate-500">{act?.orgName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <p className="text-[11px]">
                  Tất cả các hoạt động đã chọn sẽ được xóa vĩnh viễn, hoàn tác điểm rèn luyện tương ứng và lưu vết từng bản ghi vào Activity Log Cấp 4.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Lý do xóa hàng loạt (ghi nhận vào nhật ký kiểm toán)
                </label>
                <textarea
                  rows={2}
                  value={batchDeleteReason}
                  onChange={e => setBatchDeleteReason(e.target.value)}
                  placeholder="Nhập lý do xóa hàng loạt..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowBatchDeleteModal(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold rounded-xl transition"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBatchDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-rose-700 hover:bg-rose-800 active:scale-95 text-white font-bold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Đang Xóa {selectedActIds.length} Hoạt Động...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Xác Nhận Xóa {selectedActIds.length} Hoạt Động
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk 15-Item Activity Import Modal (Cấp 4) */}
      <BulkActivityImportModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
      />

      {/* Registration Modal */}
      <ActivityFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />

      {/* Excel Upload Modal */}
      {excelTargetAct && (
        <ExcelUploadModal
          activity={excelTargetAct}
          isOpen={!!excelTargetAct}
          onClose={() => setExcelTargetAct(null)}
        />
      )}

      {/* Firestore Write Diagnostic Logs Inspection Modal */}
      {showDiagnosticModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-400" />
                <div>
                  <h3 className="text-sm font-bold">Diagnostic Logs: Nhật Ký Thất Bại Ghi Firestore</h3>
                  <p className="text-[11px] text-slate-400">Xem vết stack trace, mã lỗi và cấu trúc payload các thao tác bị từ chối</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDiagnosticModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {getRecentDiagnosticLogs().length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Không ghi nhận lỗi Firestore Write nào trong phiên làm việc hiện tại!
                  </p>
                  <p className="text-xs text-slate-500">
                    Tất cả các thao tác thêm, sửa, xóa, nạp hàng loạt hoạt động đã ghi nhận thành công hoặc chưa có lỗi bị từ chối.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      Tổng số bản ghi lỗi ({getRecentDiagnosticLogs().length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        clearDiagnosticLogs();
                        showToast('Đã xóa danh sách nhật ký diagnostic.', 'info');
                      }}
                      className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Xóa Nhật Ký
                    </button>
                  </div>

                  {getRecentDiagnosticLogs().map((log: DiagnosticLogRecord) => (
                    <div
                      key={log.id}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-mono"
                    >
                      <div className="flex items-center justify-between border-b pb-2 dark:border-slate-800">
                        <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" />
                          [{log.operation}] Mã: {log.errorCode}
                        </span>
                        <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                      </div>

                      <div className="space-y-1 text-slate-700 dark:text-slate-300">
                        <p><span className="font-bold text-slate-900 dark:text-slate-100">Thông báo lỗi:</span> {log.errorMessage}</p>
                        <p><span className="font-bold text-slate-900 dark:text-slate-100">Tài khoản:</span> {log.userContext.email} (Cấp {log.userContext.roleLevel})</p>
                        {log.payloadAnalysis.missingRequiredFields.length > 0 && (
                          <p className="text-amber-600 dark:text-amber-400 font-semibold">
                            ⚠️ Thiếu trường: {log.payloadAnalysis.missingRequiredFields.join(', ')}
                          </p>
                        )}
                      </div>

                      <div className="bg-slate-900 text-slate-200 p-3 rounded-lg text-[11px] space-y-2 overflow-x-auto">
                        <p className="font-bold text-emerald-400">📦 Cấu Trúc Payload Map:</p>
                        <pre className="text-[10px] leading-tight text-slate-300">
                          {JSON.stringify(log.payloadAnalysis.structureMap, null, 2)}
                        </pre>

                        <p className="font-bold text-amber-400 pt-2 border-t border-slate-800">📜 Stack Trace:</p>
                        <pre className="text-[10px] leading-tight text-rose-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                          {log.errorStack}
                        </pre>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(log.fullReportJson);
                              showToast('Đã sao chép Diagnostic JSON vào Clipboard!', 'success');
                            }
                          }}
                          className="px-3 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Sao chép JSON Report
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
