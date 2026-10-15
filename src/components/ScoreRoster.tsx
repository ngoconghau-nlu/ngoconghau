import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StudentScoreRecord, StudentMembership, FilterAcademicYear, FilterActivityType, FilterSemester, ClubCategory, getClubCategory, CLUB_CATEGORY_LABELS } from '../types';
import { DataFilterToolbar } from './DataFilterToolbar';
import { AddStudentModal } from './AddStudentModal';
import { BulkStudentImportModal } from './BulkStudentImportModal';
import { Sv5tDetailModal } from './Sv5tDetailModal';
import {
  getActivitySemester,
  getActivityType,
  matchActivityFilters
} from '../utils/filterUtils';
import { verifySync } from '../utils/verifySync';
import { checkStudentScoreDiscrepancy } from '../utils/dataIntegrity';
import {
  FileText,
  Search,
  Download,
  HardDrive,
  CheckCircle2,
  Clock,
  Users,
  Edit2,
  CheckSquare,
  Square,
  Sparkles,
  PlusCircle,
  RefreshCw,
  X,
  Save,
  Check,
  Building,
  GraduationCap,
  UserPlus,
  FileSpreadsheet,
  Trash2,
  AlertTriangle,
  ExternalLink,
  Lock,
  Unlock,
  Filter,
  RotateCcw,
  SlidersHorizontal,
  ShieldCheck,
  BookOpen,
  Award,
  History,
  Trophy,
  TrendingUp,
  Printer,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  List,
  Activity,
  FileCheck
} from 'lucide-react';
import { createDriveFile } from '../services/driveService';
import { ScoreAuditLogModal } from './ScoreAuditLogModal';
import { FacultyEmulationRankings } from './FacultyEmulationRankings';
import { BranchEmulationRankings } from './BranchEmulationRankings';
import { ClubEmulationRankings } from './ClubEmulationRankings';
import { EmulationComparisonChart } from './EmulationComparisonChart';
import { ReportPdfExportModal } from './ReportPdfExportModal';
import { ExportReportOptions } from '../utils/pdfExportUtils';
import { Skeleton, SkeletonTable, AnimatedCounter } from './common/Skeleton';

interface ScoreRosterProps {
  defaultSubTab?: 'student-roster' | 'faculty-emulation' | 'branch-emulation' | 'club-emulation';
}

export const ScoreRoster: React.FC<ScoreRosterProps> = ({ defaultSubTab = 'student-roster' }) => {
  const [subTab, setSubTab] = useState<'student-roster' | 'faculty-emulation' | 'branch-emulation' | 'club-emulation'>(defaultSubTab);

  React.useEffect(() => {
    if (defaultSubTab) {
      setSubTab(defaultSubTab);
    }
  }, [defaultSubTab]);
  const {
    students,
    activities,
    updateStudent,
    deleteStudent,
    deleteBatchStudents,
    batchUpdateStudents,
    selfProofs,
    reviewSelfProof,
    user,
    branchClasses,
    organizations,
    academicYear,
    accessToken,
    setSelectedPortalStudentId,
    setActiveTab,
    showToast,
    scoreAuditLogs,
    isInitialLoading
  } = useApp();

  const currentLevel = user?.currentRole?.roleLevel ?? 0;

  // Search & Filtering States
  const [facultyFilter, setFacultyFilter] = useState<string>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [cohortFilter, setCohortFilter] = useState<string>('ALL'); // 'ALL' | '1' | '2' | '3' | '4'
  const [membershipFilter, setMembershipFilter] = useState<string>('ALL');
  const [clubCategoryFilter, setClubCategoryFilter] = useState<'ALL' | ClubCategory>('ALL'); // Lọc theo Danh mục CLB/Tổ/Đội/Nhóm
  const [clubFilter, setClubFilter] = useState<string>('ALL'); // Lọc theo CLB, Tổ, Đội, Nhóm theo danh mục
  const [sv5tStatusFilter, setSv5tStatusFilter] = useState<'ALL' | 'ELIGIBLE' | 'NOT_ELIGIBLE'>('ALL');
  const [academicYearFilter, setAcademicYearFilter] = useState<FilterAcademicYear>('ALL');
  const [semesterFilter, setSemesterFilter] = useState<FilterSemester>('ALL');
  const [activityTypeFilter, setActivityTypeFilter] = useState<FilterActivityType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showChart, setShowChart] = useState<boolean>(false);
  const [onlyDiscrepanciesFilter, setOnlyDiscrepanciesFilter] = useState<boolean>(false);

  // View Mode: Card-based vs Table-based
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [expandedStudentIds, setExpandedStudentIds] = useState<Set<string>>(new Set());

  // Phân trang Danh Mục Sinh Viên & Sổ Điểm Rèn Luyện (Mặc định 50 thẻ hoặc dòng dữ liệu mỗi trang theo yêu cầu)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  const toggleExpandStudent = (studentId: string) => {
    setExpandedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandedStudentIds(new Set(paginatedStudents.map(s => s.studentId)));
  };

  const handleCollapseAll = () => {
    setExpandedStudentIds(new Set());
  };

  const handleReviewProof = (proofId: string, decision: 'approve' | 'reject', score?: number) => {
    try {
      reviewSelfProof(
        proofId,
        decision,
        score,
        decision === 'approve' ? 'Duyệt thẩm định từ Sổ Điểm Rèn Luyện' : 'Chưa đủ điều kiện minh chứng'
      );
      showToast(
        decision === 'approve' ? 'Đã duyệt minh chứng thành công!' : 'Đã từ chối minh chứng.',
        decision === 'approve' ? 'success' : 'info'
      );
    } catch (err: any) {
      showToast('Lỗi khi cập nhật minh chứng: ' + (err?.message || String(err)), 'error');
    }
  };

  // Danh mục Câu Lạc Bộ, Tổ, Đội, Nhóm
  const availableClubs = useMemo(() => {
    return (organizations || []).filter(o => o && (o.type === 'CLB_TRUONG' || o.type === 'CLB_KHOA'));
  }, [organizations]);

  // Student Directory Modals & Actions
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showBulkStudentModal, setShowBulkStudentModal] = useState(false);
  const [bulkStudentModalTab, setBulkStudentModalTab] = useState<'integrity' | 'import'>('integrity');
  const [selectedSv5tStudent, setSelectedSv5tStudent] = useState<StudentScoreRecord | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<StudentScoreRecord | null>(null);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);

  // Batch Selection State
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [showBatchModal, setShowBatchModal] = useState<null | 'bonus' | 'membership' | 'academicYear' | 'club'>(null);
  const [batchBonusValue, setBatchBonusValue] = useState<number>(5);
  const [batchMembershipValue, setBatchMembershipValue] = useState<StudentMembership>('DOAN_VIEN');
  const [batchAcademicYearValue, setBatchAcademicYearValue] = useState<number>(1);
  const [batchClubValue, setBatchClubValue] = useState<string>('');

  // Single Student Edit Modal State & Personal Info Lock
  const [editingStudent, setEditingStudent] = useState<StudentScoreRecord | null>(null);
  const [isPersonalInfoLocked, setIsPersonalInfoLocked] = useState<boolean>(true);
  const [showAuditLogModal, setShowAuditLogModal] = useState<boolean>(false);
  const [selectedAuditStudentId, setSelectedAuditStudentId] = useState<string | null>(null);
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);

  const [editForm, setEditForm] = useState<{
    studentId: string;
    fullName: string;
    membershipType: StudentMembership;
    academicYearNumber: number;
    classCode: string;
    facultyCode: string;
    clubCodes: string[];
    activityScore: number;
    bonusScore: number;
    positionScore: number;
    researchScore: number;
    auditReason: string;
  }>({
    studentId: '',
    fullName: '',
    membershipType: 'DOAN_VIEN',
    academicYearNumber: 1,
    classCode: '',
    facultyCode: '',
    clubCodes: [],
    activityScore: 0,
    bonusScore: 0,
    positionScore: 0,
    researchScore: 0,
    auditReason: '',
  });

  const userOrgCode = user?.currentRole?.orgCode;
  const userClassCode = user?.currentRole?.classCode;

  // Yêu cầu 1: Mỗi cấp chỉ được quyền xem dữ liệu đến cấp của mình
  const roleScopedStudents = useMemo(() => {
    if (!user || !user.currentRole) return [];
    const stdList = students || [];
    if (currentLevel >= 4) return stdList;
    if (currentLevel === 3) {
      return stdList.filter(
        s => s && (s.facultyCode === userOrgCode || (s.clubCodes && Array.isArray(s.clubCodes) && s.clubCodes.includes(userOrgCode || '')))
      );
    }
    if (currentLevel === 2) {
      if (userClassCode) {
        return stdList.filter(s => s && s.classCode === userClassCode);
      }
      return stdList.filter(s => s && s.facultyCode === userOrgCode);
    }
    if (currentLevel === 1) {
      return stdList.filter(s => s && s.studentId === user.studentId);
    }
    return [];
  }, [students, currentLevel, userOrgCode, userClassCode, user?.studentId, user]);

  // Scoped student list with active UI filters (Khoa, Lớp, Khóa, Học kỳ, Năm học, Loại hình Đoàn/Hội, SV5T)
  const filteredStudents = useMemo(() => {
    return roleScopedStudents
      .filter(std => {
        // Faculty filter (Khoa)
        if (currentLevel >= 4 && facultyFilter !== 'ALL' && std.facultyCode !== facultyFilter) return false;

        // Class filter (Lớp)
        if (classFilter !== 'ALL' && std.classCode !== classFilter) return false;

        // Cohort filter (Khóa học: Năm 1 = K52, Năm 2 = K51, Năm 3 = K50, Năm 4 = K49, Năm 5+ = K48+)
        if (cohortFilter !== 'ALL') {
          const cNum = Number(cohortFilter);
          if (cNum === 5) {
            if (std.academicYearNumber < 5) return false;
          } else if (std.academicYearNumber !== cNum) {
            return false;
          }
        }

        // Membership filter (Đối tượng)
        if (membershipFilter !== 'ALL' && std.membershipType !== membershipFilter) return false;

        // Club Category filter (Phân loại danh mục: Câu Lạc Bộ, Tổ, Đội, Nhóm)
        if (clubCategoryFilter !== 'ALL') {
          const matchCat =
            std.clubCategory === clubCategoryFilter ||
            (std.clubCodes &&
              std.clubCodes.some(c => {
                const org = organizations.find(o => o.code === c);
                return org && getClubCategory(org).category === clubCategoryFilter;
              }));
          if (!matchCat) return false;
        }

        // Club filter (Câu Lạc Bộ, Tổ, Đội, Nhóm theo mã cụ thể)
        if (clubFilter !== 'ALL') {
          const inClub = (std.clubCodes && std.clubCodes.includes(clubFilter)) || std.clubCode === clubFilter;
          if (!inClub) return false;
        }

        // SV5T Status filter
        if (sv5tStatusFilter === 'ELIGIBLE' && !std.isSv5tEligible) return false;
        if (sv5tStatusFilter === 'NOT_ELIGIBLE' && std.isSv5tEligible) return false;

        // Activity Type filter (Đoàn / Hội / Liên tịch)
        if (activityTypeFilter !== 'ALL') {
          if (activityTypeFilter === 'DOAN') {
            const isDoanMember = std.membershipType === 'DOAN_VIEN';
            const hasDoanAct = activities?.some(
              a =>
                (getActivityType(a) === 'DOAN' || getActivityType(a) === 'DOAN_HOI') &&
                a.participants?.some(p => p.studentId === std.studentId)
            );
            if (!isDoanMember && !hasDoanAct) return false;
          } else if (activityTypeFilter === 'HOI') {
            const isHoiMember = std.membershipType === 'HOI_VIEN';
            const hasHoiAct = activities?.some(
              a =>
                (getActivityType(a) === 'HOI' || getActivityType(a) === 'DOAN_HOI') &&
                a.participants?.some(p => p.studentId === std.studentId)
            );
            if (!isHoiMember && !hasHoiAct) return false;
          } else if (activityTypeFilter === 'DOAN_HOI') {
            const hasJointAct = activities?.some(
              a =>
                getActivityType(a) === 'DOAN_HOI' &&
                a.participants?.some(p => p.studentId === std.studentId)
            );
            if (!hasJointAct) return false;
          }
        }

        // Semester filter (HK1 / HK2 / HK_HE)
        if (semesterFilter !== 'ALL') {
          const hasSemesterAct = activities?.some(
            a =>
              getActivitySemester(a) === semesterFilter &&
              (academicYearFilter === 'ALL' || a.planYear === academicYearFilter || a.startDate?.startsWith(academicYearFilter.slice(0, 4))) &&
              a.participants?.some(p => p.studentId === std.studentId)
          );
          if (!hasSemesterAct) return false;
        }

        // Academic Year filter
        if (academicYearFilter !== 'ALL') {
          const stdClass = branchClasses.find(c => c.code === std.classCode);
          const classMatchesYear = stdClass?.academicYear?.includes(academicYearFilter.slice(0, 4));
          const hasActInYear = activities?.some(
            a =>
              (a.planYear === academicYearFilter || a.startDate?.startsWith(academicYearFilter.slice(0, 4))) &&
              a.participants?.some(p => p.studentId === std.studentId)
          );
          if (!classMatchesYear && !hasActInYear && stdClass) return false;
        }

        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase().trim();
          const matchName = std.fullName.toLowerCase().includes(q);
          const matchId = std.studentId.toLowerCase().includes(q);
          const matchClass = std.classCode.toLowerCase().includes(q);
          const matchFaculty = std.facultyCode.toLowerCase().includes(q);
          if (!matchName && !matchId && !matchClass && !matchFaculty) return false;
        }

        // Lọc chỉ sinh viên có cảnh báo lỗi điểm / xếp loại
        if (onlyDiscrepanciesFilter) {
          if (!checkStudentScoreDiscrepancy(std, activities).hasIssue) return false;
        }

        return true;
      })
      .sort((a, b) => (b.totalScore - a.totalScore) || a.fullName.localeCompare(b.fullName, 'vi') || a.studentId.localeCompare(b.studentId)); // Xếp hạng thực tế theo Tổng điểm + tie-breaker
  }, [
    roleScopedStudents,
    currentLevel,
    facultyFilter,
    classFilter,
    cohortFilter,
    membershipFilter,
    sv5tStatusFilter,
    academicYearFilter,
    semesterFilter,
    activityTypeFilter,
    searchTerm,
    onlyDiscrepanciesFilter,
    activities,
    branchClasses,
  ]);

  // Phân trang danh mục sinh viên & sổ điểm (Mặc định 50 thẻ hoặc dòng dữ liệu mỗi trang)
  const totalItems = filteredStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedStudents = useMemo(() => {
    return filteredStudents.slice(startIndex, endIndex);
  }, [filteredStudents, startIndex, endIndex]);

  const pageStudentIds = useMemo(() => paginatedStudents.map(s => s.studentId), [paginatedStudents]);
  const allPageSelected = pageStudentIds.length > 0 && pageStudentIds.every(id => selectedStudentIds.includes(id));

  // Tự động chuyển về trang 1 khi người dùng lọc hoặc tìm kiếm dữ liệu
  React.useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    facultyFilter,
    classFilter,
    cohortFilter,
    membershipFilter,
    clubCategoryFilter,
    clubFilter,
    sv5tStatusFilter,
    activityTypeFilter,
    academicYearFilter,
    semesterFilter,
    onlyDiscrepanciesFilter,
    pageSize
  ]);

  const handlePageChange = (newPage: number) => {
    const target = Math.min(Math.max(1, newPage), totalPages);
    setCurrentPage(target);
    const el = document.getElementById('student-roster-content');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // List of students with score/ranking discrepancies
  const studentsWithDiscrepancy = useMemo(() => {
    return roleScopedStudents.filter(s => checkStudentScoreDiscrepancy(s, activities).hasIssue);
  }, [roleScopedStudents, activities]);

  // Quick auto-fix handler for a single student
  const handleFixStudentDiscrepancy = (std: StudentScoreRecord) => {
    const issue = checkStudentScoreDiscrepancy(std, activities);
    if (!issue.hasIssue) return;

    updateStudent(
      std.studentId,
      {
        totalScore: issue.expectedTotal,
        rankGrade: issue.expectedRankGrade as any,
        rankGeneral: issue.expectedRankGeneral as any
      },
      'Tự động sửa lỗi sai lệch tổng điểm và logic xếp loại quy chuẩn'
    );
    showToast(`Đã đồng bộ lại điểm chuẩn ${issue.expectedTotal}đ & xếp loại "${issue.expectedRankGrade}" cho sinh viên [${std.fullName}]!`, 'success');
  };

  // Quick auto-fix handler for ALL students with discrepancies
  const handleFixAllDiscrepancies = () => {
    let count = 0;
    studentsWithDiscrepancy.forEach(std => {
      const issue = checkStudentScoreDiscrepancy(std, activities);
      if (issue.hasIssue) {
        updateStudent(
          std.studentId,
          {
            totalScore: issue.expectedTotal,
            rankGrade: issue.expectedRankGrade as any,
            rankGeneral: issue.expectedRankGeneral as any
          },
          'Tự động sửa hàng loạt sai lệch tổng điểm & logic xếp loại'
        );
        count++;
      }
    });
    showToast(`Đã tự động sửa hoàn tất ${count} sinh viên có sai lệch!`, 'success');
  };

  // Indexed Map Data Structures for O(1) Student Lookups (Performance Optimization)
  const proofsByStudentIdMap = useMemo(() => {
    const map = new Map<string, typeof selfProofs>();
    (selfProofs || []).forEach(p => {
      if (!p.studentId) return;
      const list = map.get(p.studentId) || [];
      list.push(p);
      map.set(p.studentId, list);
    });
    return map;
  }, [selfProofs]);

  const activitiesByStudentIdMap = useMemo(() => {
    const map = new Map<string, typeof activities>();
    (activities || []).forEach(a => {
      if (!a.participants) return;
      a.participants.forEach(part => {
        if (!part.studentId) return;
        const list = map.get(part.studentId) || [];
        list.push(a);
        map.set(part.studentId, list);
      });
    });
    return map;
  }, [activities]);

  const maxScoreScale = useMemo(() => {
    if (filteredStudents.length === 0) return 100;
    const maxVal = Math.max(...filteredStudents.map(s => s.totalScore || 0));
    return Math.max(100, maxVal);
  }, [filteredStudents]);

  const availableFaculties = useMemo(() => {
    const khoas = organizations.filter(o => o.type === 'KHOA' || o.code === 'VC_NLD');
    if (currentLevel >= 4) return khoas;
    return khoas.filter(k => k.code === userOrgCode);
  }, [organizations, currentLevel, userOrgCode]);

  const availableClasses = useMemo(() => {
    if (currentLevel >= 4) {
      if (facultyFilter !== 'ALL') return branchClasses.filter(c => c.facultyCode === facultyFilter);
      return branchClasses;
    }
    if (currentLevel === 3) {
      return branchClasses.filter(c => c.facultyCode === userOrgCode);
    }
    if (currentLevel === 2) {
      if (userClassCode) return branchClasses.filter(c => c.code === userClassCode);
      return branchClasses.filter(c => c.facultyCode === userOrgCode);
    }
    return branchClasses;
  }, [branchClasses, currentLevel, userOrgCode, userClassCode, facultyFilter]);

  // Select all / deselect all
  const allFilteredSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every(s => selectedStudentIds.includes(s.studentId));

  const handleToggleSelectPage = () => {
    if (allPageSelected) {
      setSelectedStudentIds(prev => prev.filter(id => !pageStudentIds.includes(id)));
    } else {
      setSelectedStudentIds(prev => Array.from(new Set([...prev, ...pageStudentIds])));
    }
  };

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(s => s.studentId));
    }
  };

  const handleToggleSelectStudent = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  // Batch actions
  const handleApplyBatchBonus = () => {
    try {
      if (selectedStudentIds.length === 0) return;
      batchUpdateStudents(selectedStudentIds, { bonusAdd: Number(batchBonusValue) || 0, recalculate: true });
      setShowBatchModal(null);
    } catch (err: any) {
      showToast('Lỗi khi cộng điểm thưởng hàng loạt: ' + (err?.message || String(err)), 'error');
    }
  };

  const handleApplyBatchMembership = () => {
    try {
      if (selectedStudentIds.length === 0) return;
      batchUpdateStudents(selectedStudentIds, { membershipType: batchMembershipValue, recalculate: true });
      setShowBatchModal(null);
    } catch (err: any) {
      showToast('Lỗi khi đổi đối tượng hàng loạt: ' + (err?.message || String(err)), 'error');
    }
  };

  const handleApplyBatchAcademicYear = () => {
    try {
      if (selectedStudentIds.length === 0) return;
      batchUpdateStudents(selectedStudentIds, { academicYearNumber: Number(batchAcademicYearValue) || 1, recalculate: true });
      setShowBatchModal(null);
    } catch (err: any) {
      showToast('Lỗi khi đổi khóa hàng loạt: ' + (err?.message || String(err)), 'error');
    }
  };

  const handleApplyBatchRecalculate = () => {
    try {
      if (selectedStudentIds.length === 0) return;
      batchUpdateStudents(selectedStudentIds, { recalculate: true });
    } catch (err: any) {
      showToast('Lỗi khi tính lại xếp loại hàng loạt: ' + (err?.message || String(err)), 'error');
    }
  };

  // Edit single student
  const handleOpenEdit = (student: StudentScoreRecord) => {
    setEditingStudent(student);
    setIsPersonalInfoLocked(true); // Always locked by default for safety
    const studentClubs = student.clubCodes || (student.clubCode ? [student.clubCode] : []);
    setEditForm({
      studentId: student.studentId,
      fullName: student.fullName,
      membershipType: student.membershipType,
      academicYearNumber: student.academicYearNumber,
      classCode: student.classCode,
      facultyCode: student.facultyCode,
      clubCodes: studentClubs,
      activityScore: student.activityScore,
      bonusScore: student.bonusScore,
      positionScore: student.positionScore,
      researchScore: student.researchScore,
      auditReason: '',
    });
  };

  const handleSaveStudentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!editingStudent) return;

      // Chỉ Cấp Trường (Level 4) khi mở khóa mới được quyền lưu thông tin hành chính
      const canEditPersonal = currentLevel === 4 && !isPersonalInfoLocked;

      const primaryClub = (editForm.clubCodes && editForm.clubCodes[0]) || undefined;
      const primaryClubOrg = primaryClub ? (availableClubs || []).find(c => c && c.code === primaryClub) : undefined;
      const clubCatInfo = primaryClubOrg ? getClubCategory(primaryClubOrg) : undefined;

      const updates: Partial<StudentScoreRecord> = {
        membershipType: editForm.membershipType,
        academicYearNumber: Number(editForm.academicYearNumber) || 1,
        clubCodes: editForm.clubCodes || [],
        clubCode: primaryClub,
        clubName: primaryClubOrg?.name,
        clubCategory: clubCatInfo?.category,
        activityScore: Number(editForm.activityScore) || 0,
        bonusScore: Number(editForm.bonusScore) || 0,
        positionScore: Number(editForm.positionScore) || 0,
        researchScore: Number(editForm.researchScore) || 0,
      };

      if (canEditPersonal) {
        if (editForm.studentId?.trim()) updates.studentId = editForm.studentId.trim();
        if (editForm.fullName?.trim()) updates.fullName = editForm.fullName.trim();
        if (editForm.classCode?.trim()) updates.classCode = editForm.classCode.trim();
        if (editForm.facultyCode?.trim()) updates.facultyCode = editForm.facultyCode.trim();
      }

      updateStudent(editingStudent.studentId, updates, editForm.auditReason?.trim() || undefined);
      setEditingStudent(null);
    } catch (err: any) {
      showToast('Lỗi khi lưu thông tin sinh viên: ' + (err?.message || String(err)), 'error');
    }
  };

  // Link to Student Portal & SV5T
  const handleOpenStudentPortal = (studentId: string) => {
    try {
      if (!studentId) return;
      setSelectedPortalStudentId(studentId);
      setActiveTab('student-portal');
      showToast(`Đang chuyển đến Cổng Sinh Viên & SV5T của MSSV [${studentId}]...`, 'info');
    } catch (err: any) {
      showToast('Lỗi khi mở Cổng sinh viên: ' + (err?.message || String(err)), 'error');
    }
  };

  // Single student delete handler
  const handleConfirmSingleDelete = () => {
    try {
      if (!studentToDelete) return;
      deleteStudent(studentToDelete.studentId);
      setStudentToDelete(null);
      setSelectedStudentIds(prev => prev.filter(id => id !== studentToDelete.studentId));
    } catch (err: any) {
      showToast('Lỗi khi xóa sinh viên: ' + (err?.message || String(err)), 'error');
    }
  };

  // Batch delete handler
  const handleConfirmBatchDelete = () => {
    try {
      if (selectedStudentIds.length === 0) return;
      deleteBatchStudents(selectedStudentIds);
      setSelectedStudentIds([]);
      setShowBatchDeleteConfirm(false);
    } catch (err: any) {
      showToast('Lỗi khi xóa hàng loạt sinh viên: ' + (err?.message || String(err)), 'error');
    }
  };

  // Đoàn viên Quality Statistics (Đồng bộ 100% từ Firestore collection 'students' qua filteredStudents)
  const doanVienStats = useMemo(() => {
    const doanVienList = filteredStudents.filter(s => s.membershipType === 'DOAN_VIEN');
    const total = doanVienList.length || 1;

    const xuatSac = doanVienList.filter(s => s.rankGrade === 'Hoàn thành xuất sắc nhiệm vụ').length;
    const tot = doanVienList.filter(s => s.rankGrade === 'Hoàn thành tốt nhiệm vụ').length;
    const hoanThanh = doanVienList.filter(s => s.rankGrade === 'Hoàn thành nhiệm vụ').length;
    const khongHT = doanVienList.filter(s => s.rankGrade === 'Không hoàn thành nhiệm vụ').length;

    return {
      total: doanVienList.length,
      xuatSac: { count: xuatSac, pct: Math.round((xuatSac / total) * 100) },
      tot: { count: tot, pct: Math.round((tot / total) * 100) },
      hoanThanh: { count: hoanThanh, pct: Math.round((hoanThanh / total) * 100) },
      khongHT: { count: khongHT, pct: Math.round((khongHT / total) * 100) },
    };
  }, [filteredStudents]);

  // Total participations calculated using UNIFIED FILTER matching filteredStudents
  const filteredParticipations = useMemo(() => {
    const studentIdSet = new Set(filteredStudents.map(s => s.studentId));
    let count = 0;
    (activities || []).forEach(act => {
      if (act && act.status === 'Approved' && act.participants && Array.isArray(act.participants)) {
        act.participants.forEach(p => {
          if (p && p.studentId && studentIdSet.has(p.studentId)) {
            count++;
          }
        });
      }
    });
    return count;
  }, [filteredStudents, activities]);

  // Execute verifySync cross-check on mount and data updates for developer auditing
  React.useEffect(() => {
    if (students && activities) {
      verifySync(students, activities, 'ScoreRoster Runtime Audit');
    }
  }, [students, activities]);

  // Pending self proofs for review - scoped to user's permission
  const pendingProofs = useMemo(() => {
    return selfProofs.filter(p => {
      if (p.status !== 'Pending') return false;
      if (currentLevel >= 4) return true;
      const student = students.find(s => s.studentId === p.studentId);
      if (!student) return false;
      if (currentLevel === 3) return student.facultyCode === userOrgCode;
      if (currentLevel === 2) return student.classCode === userClassCode;
      return p.studentId === user.studentId;
    });
  }, [selfProofs, students, currentLevel, userOrgCode, userClassCode, user.studentId]);

  // Export to Excel .xlsx (dynamic import to optimize bundle size)
  const handleExportCSV = async () => {
    const headers = [
      'Xếp hạng',
      'MSSV',
      'Họ và tên',
      'Đối tượng',
      'Chi đoàn',
      'Khoa',
      'CLB / Tổ / Đội / Nhóm',
      'Phân loại danh mục',
      'Năm học',
      'Điểm Hoạt động',
      'Điểm Khen thưởng',
      'Điểm Chức vụ',
      'Điểm NCKH',
      'Tổng điểm',
      'Xếp loại',
      'Sinh viên 5 tốt',
    ];

    const rows = filteredStudents.map((std, idx) => [
      idx + 1,
      std.studentId,
      std.fullName,
      std.membershipType === 'DOAN_VIEN' ? 'Đoàn viên' : std.membershipType === 'HOI_VIEN' ? 'Hội viên' : 'Sinh viên',
      std.classCode,
      std.facultyCode,
      std.clubName || std.clubCode || 'Chưa tham gia',
      std.clubCategory === 'TO' ? 'Tổ' : std.clubCategory === 'DOI' ? 'Đội' : std.clubCategory === 'NHOM' ? 'Nhóm' : std.clubCategory === 'CLB' ? 'Câu Lạc Bộ' : '-',
      std.academicYearNumber === 1 ? 'Năm 1 (Mới)' : 'Năm 2+',
      std.activityScore,
      std.bonusScore,
      std.positionScore,
      std.researchScore,
      std.totalScore,
      std.rankGrade,
      std.isSv5tEligible ? 'Đạt SV5T' : 'Chưa đạt',
    ]);

    try {
      const XLSX = await import('xlsx');
      const wsData = [headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [
        { wch: 6 },
        { wch: 12 },
        { wch: 25 },
        { wch: 14 },
        { wch: 14 },
        { wch: 12 },
        { wch: 25 },
        { wch: 18 },
        { wch: 12 },
        { wch: 14 },
        { wch: 16 },
        { wch: 14 },
        { wch: 12 },
        { wch: 12 },
        { wch: 28 },
        { wch: 14 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'SoDiem_NLU');
      XLSX.writeFile(wb, `SoDiem_DRL_NLU_2026_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast('Đã xuất danh sách thành file Excel (.xlsx) thành công!', 'success');
    } catch (err: any) {
      showToast('Lỗi khi xuất file Excel: ' + (err?.message || String(err)), 'error');
    }
  };

  const handleExportToGoogleDrive = async () => {
    if (!accessToken) {
      showToast('Vui lòng kết nối Google Drive trước để xuất bảng điểm vào Google Drive của bạn.', 'warning');
      return;
    }

    try {
      showToast('Đang khởi tạo tệp báo cáo và tải lên Google Drive...', 'info');
      const csvData =
        'Xếp hạng,MSSV,Họ và tên,Đối tượng,Chi đoàn,Khoa,Tổng điểm,Xếp loại,Sinh viên 5 tốt\n' +
        (filteredStudents || [])
          .map(
            (s, i) =>
              `${i + 1},${s?.studentId || ''},"${s?.fullName || ''}",${s?.membershipType || ''},${s?.classCode || ''},${s?.facultyCode || ''},${s?.totalScore || 0},"${s?.rankGrade || ''}",${s?.isSv5tEligible ? 'Đạt' : 'Chưa'}`
          )
          .join('\n');

      const fileName = `SoDiem_DRL_NLU_${Date.now()}.csv`;
      const file = await createDriveFile(accessToken, fileName, csvData, 'text/csv');
      showToast(`Đã lưu sổ điểm vào Google Drive: ${file?.name || fileName}`, 'success');
      if (file?.webViewLink) {
        try {
          window.open(file.webViewLink, '_blank');
        } catch (e) {
          console.warn('Could not open drive link:', e);
        }
      }
    } catch (err: any) {
      showToast('Lỗi khi lưu lên Google Drive: ' + (err?.message || String(err)), 'error');
    }
  };

  const getRankBadgeClass = (rank: StudentScoreRecord['rankGrade']) => {
    switch (rank) {
      case 'Hoàn thành xuất sắc nhiệm vụ':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
      case 'Hoàn thành tốt nhiệm vụ':
        return 'bg-sky-100 text-sky-800 border border-sky-300';
      case 'Hoàn thành nhiệm vụ':
        return 'bg-amber-100 text-amber-800 border border-amber-300';
      case 'Không hoàn thành nhiệm vụ':
      default:
        return 'bg-rose-100 text-rose-800 border border-rose-300';
    }
  };

  const studentReportOptions: ExportReportOptions = useMemo(() => {
    return {
      title: 'BẢNG TỔNG HỢP SỔ ĐIỂM RÈN LUYỆN VÀ ĐÁNH GIÁ ĐOÀN VIÊN',
      subTitle: 'HỆ THỐNG QUẢN LÝ HOẠT ĐỘNG & ĐIỂM RÈN LUYỆN ĐOÀN VIÊN NLU',
      academicYear,
      semester: 'Học kỳ 2',
      unitName: (user?.facultyCode || user?.currentRole?.orgCode) ? `ĐOÀN KHOA ${(user.facultyCode || user.currentRole.orgCode || '').toUpperCase()}` : 'ĐOÀN TRƯỜNG ĐẠI HỌC NÔNG LÂM TP.HCM',
      scopeLabel: facultyFilter !== 'ALL' ? `Khoa ${facultyFilter}` : 'Toàn trường',
      generatedBy: `${user?.fullName || 'Cán bộ quản lý'} (${user?.currentRole?.roleName || 'Cán bộ Đoàn'})`,
      signerTitle: 'TM. BAN THƯỜNG VỤ ĐOÀN TRƯỜNG\nBÍ THƯ',
      signerName: 'ThS. Nguyễn Văn A',
      orientation: 'landscape',
      summaryStats: [
        { label: 'Tổng số sinh viên', value: filteredStudents.length, note: 'Bản ghi được lọc' },
        { label: 'HT Xuất sắc', value: `${doanVienStats.xuatSac.count} (${doanVienStats.xuatSac.pct}%)`, note: 'Chuẩn xếp loại cao nhất' },
        { label: 'HT Tốt', value: `${doanVienStats.tot.count} (${doanVienStats.tot.pct}%)` },
        { label: 'HT Nhiệm vụ', value: `${doanVienStats.hoanThanh.count} (${doanVienStats.hoanThanh.pct}%)` },
        { label: 'Đạt Chuẩn SV5T', value: `${filteredStudents.filter(s => s.isSv5tEligible).length} SV`, note: 'Đủ điều kiện xét duyệt' }
      ],
      columns: [
        { header: 'STT', key: 'stt', width: '40px', align: 'center' },
        { header: 'MSSV', key: 'studentId', width: '85px', align: 'center' },
        { header: 'Họ và Tên', key: 'fullName', width: '160px', align: 'left' },
        { header: 'Đối tượng', key: 'membershipLabel', width: '80px', align: 'center' },
        { header: 'Chi đoàn', key: 'classCode', width: '80px', align: 'center' },
        { header: 'Khoa', key: 'facultyCode', width: '60px', align: 'center' },
        { header: 'Hoạt động', key: 'activityScore', width: '60px', align: 'right' },
        { header: 'Điểm thưởng', key: 'bonusScore', width: '60px', align: 'right' },
        { header: 'Chức vụ', key: 'positionScore', width: '55px', align: 'right' },
        { header: 'NCKH', key: 'researchScore', width: '50px', align: 'right' },
        { header: 'Tổng ĐRL', key: 'totalScore', width: '65px', align: 'right' },
        { header: 'Xếp Loại Đoàn Viên', key: 'rankGrade', width: '140px', align: 'left' },
        { header: 'SV 5 Tốt', key: 'sv5tLabel', width: '75px', align: 'center' }
      ],
      rows: filteredStudents.map((s) => ({
        studentId: s.studentId,
        fullName: s.fullName,
        membershipLabel: s.membershipType === 'DOAN_VIEN' ? 'Đoàn viên' : s.membershipType === 'HOI_VIEN' ? 'Hội viên' : 'Sinh viên',
        classCode: s.classCode,
        facultyCode: s.facultyCode,
        activityScore: s.activityScore,
        bonusScore: s.bonusScore,
        positionScore: s.positionScore,
        researchScore: s.researchScore,
        totalScore: s.totalScore,
        rankGrade: s.rankGrade,
        sv5tLabel: s.isSv5tEligible ? 'ĐẠT' : 'Chưa đạt'
      }))
    };
  }, [academicYear, user, facultyFilter, filteredStudents, doanVienStats]);

  // Hàm hiển thị thanh điều khiển phân trang (50 bản ghi mỗi trang mặc định)
  const renderPaginationControls = (isTop: boolean = false) => {
    if (totalItems === 0) return null;

    // Tính toán dải số trang hiển thị linh hoạt
    const getPageNumbers = () => {
      const delta = 2;
      const range: number[] = [];
      const rangeWithDots: (number | string)[] = [];
      let l: number | undefined;

      for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= safePage - delta && i <= safePage + delta)) {
          range.push(i);
        }
      }

      for (const i of range) {
        if (l !== undefined) {
          if (i - l === 2) {
            rangeWithDots.push(l + 1);
          } else if (i - l !== 1) {
            rangeWithDots.push('...');
          }
        }
        rangeWithDots.push(i);
        l = i;
      }
      return rangeWithDots;
    };

    const pages = getPageNumbers();

    return (
      <div
        className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300 transition-colors ${
          isTop ? 'mb-3' : 'mt-4'
        }`}
      >
        {/* Vùng thông tin số lượng bản ghi và chọn số dòng */}
        <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
          <span className="font-medium text-slate-500 dark:text-slate-400">
            Hiển thị{' '}
            <strong className="text-slate-900 dark:text-white font-bold">
              {totalItems === 0 ? 0 : startIndex + 1} - {endIndex}
            </strong>{' '}
            trong tổng số{' '}
            <strong className="text-blue-700 dark:text-blue-400 font-extrabold">
              {totalItems}
            </strong>{' '}
            sinh viên
          </span>

          {/* Chọn số dòng mỗi trang */}
          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Mỗi trang:
            </span>
            <select
              value={pageSize}
              onChange={e => {
                const newSize = Number(e.target.value);
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs"
            >
              <option value={25}>25 bản ghi</option>
              <option value={50}>50 bản ghi (Chuẩn)</option>
              <option value={100}>100 bản ghi</option>
              <option value={200}>200 bản ghi</option>
            </select>
          </div>
        </div>

        {/* Nút điều hướng chuyển trang */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {/* Về trang đầu */}
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => handlePageChange(1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-35 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
            title="Về trang đầu tiên (Trang 1)"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Trang trước */}
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => handlePageChange(safePage - 1)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-35 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs font-bold text-xs"
            title="Lùi về trang trước"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Trước</span>
          </button>

          {/* Danh sách các số trang */}
          <div className="flex items-center gap-1">
            {pages.map((p, pIdx) => {
              if (p === '...') {
                return (
                  <span key={`dots-${pIdx}`} className="px-1 text-slate-400 font-bold select-none">
                    ...
                  </span>
                );
              }
              const pageNum = Number(p);
              const isActive = pageNum === safePage;
              return (
                <button
                  key={`page-${pageNum}`}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold border transition cursor-pointer shadow-2xs ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Trang sau */}
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => handlePageChange(safePage + 1)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-35 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs font-bold text-xs"
            title="Tiến sang trang tiếp theo"
          >
            <span className="hidden sm:inline">Sau</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Đến trang cuối */}
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => handlePageChange(totalPages)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-35 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
            title={`Đến trang cuối cùng (Trang ${totalPages})`}
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Menu Chuyển Đổi Phân Hệ: Danh Mục Sinh Viên, Sổ Điểm Rèn Luyện & Các Phân Hệ Thi Đua */}
      <div className="bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl text-xs font-bold overflow-x-auto no-scrollbar max-w-full">
          <button
            type="button"
            onClick={() => setSubTab('student-roster')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer h-9 active:scale-95 ${
              subTab === 'student-roster'
                ? 'bg-blue-700 text-white shadow-xs font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-white/60 dark:hover:bg-slate-700/60 font-semibold'
            }`}
          >
            <FileText className={`w-4 h-4 ${subTab === 'student-roster' ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
            <span>Danh Mục & Sổ Điểm SV</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              subTab === 'student-roster' ? 'bg-blue-800 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {roleScopedStudents.length} SV
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('faculty-emulation')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer h-9 active:scale-95 ${
              subTab === 'faculty-emulation'
                ? 'bg-amber-600 text-white shadow-xs font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-white/60 dark:hover:bg-slate-700/60 font-semibold'
            }`}
          >
            <Trophy className={`w-4 h-4 ${subTab === 'faculty-emulation' ? 'text-white' : 'text-amber-500'}`} />
            <span>Xếp Loại Đoàn Khoa</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              subTab === 'faculty-emulation' ? 'bg-amber-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              13 Đơn vị
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('branch-emulation')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer h-9 active:scale-95 ${
              subTab === 'branch-emulation'
                ? 'bg-emerald-700 text-white shadow-xs font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-white/60 dark:hover:bg-slate-700/60 font-semibold'
            }`}
          >
            <Building className={`w-4 h-4 ${subTab === 'branch-emulation' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
            <span>Xếp Loại Chi Đoàn</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              subTab === 'branch-emulation' ? 'bg-emerald-800 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {branchClasses.length} Chi đoàn
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('club-emulation')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer h-9 active:scale-95 ${
              subTab === 'club-emulation'
                ? 'bg-indigo-700 text-white shadow-xs font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-white/60 dark:hover:bg-slate-700/60 font-semibold'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${subTab === 'club-emulation' ? 'text-white' : 'text-indigo-500'}`} />
            <span>Xếp Loại CLB / Đội / Nhóm</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              subTab === 'club-emulation' ? 'bg-indigo-800 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {organizations.filter(o => o.type === 'CLB_TRUONG' || o.type === 'CLB_KHOA').length} CLB
            </span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 pr-2 hidden xl:block font-medium">
          {subTab === 'student-roster'
            ? `Quy chế đánh giá ĐRL & SV5T NLU (${academicYear})`
            : subTab === 'faculty-emulation'
            ? 'Xếp hạng thi đua theo Điểm thi đua chuẩn BTV Đoàn trường'
            : subTab === 'branch-emulation'
            ? 'Thống kê kết quả Chi đoàn: HĐ duyệt, Đoàn viên, Lượt tham gia, Điểm thi đua'
            : 'Xếp hạng phong trào & sức hút sự kiện CLB, Tổ, Đội nhóm'}
        </div>
      </div>

      {subTab === 'faculty-emulation' ? (
        <FacultyEmulationRankings onNavigateToRoster={(code) => {
          setFacultyFilter(code);
          setClassFilter('ALL');
          setClubFilter('ALL');
          setClubCategoryFilter('ALL');
          setSubTab('student-roster');
        }} />
      ) : subTab === 'branch-emulation' ? (
        <BranchEmulationRankings onNavigateToRoster={(code) => {
          const cls = branchClasses.find(c => c.code === code);
          if (cls) setFacultyFilter(cls.facultyCode);
          setClassFilter(code);
          setClubFilter('ALL');
          setClubCategoryFilter('ALL');
          setSubTab('student-roster');
        }} />
      ) : subTab === 'club-emulation' ? (
        <ClubEmulationRankings onNavigateToRoster={(code) => {
          setClubFilter(code);
          setFacultyFilter('ALL');
          setClassFilter('ALL');
          setClubCategoryFilter('ALL');
          setSubTab('student-roster');
        }} />
      ) : (
        <>
      {/* 1. Bento KPI Metric Cards - Compact & Space-Optimized */}
      {/* 2. Bento KPI Metric Cards - Optimized Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Tổng Sinh Viên & Lượt Tham Gia HĐ */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all duration-200 flex items-center justify-between group">
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
              Tổng Sinh Viên & Gốc Tích Lũy
            </span>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                {filteredStudents.length}
              </h2>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400 font-sans" title="Tổng số lượt tham gia hoạt động được phê duyệt">
                ({filteredParticipations} lượt HĐ)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              ĐRL Trung bình: <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-black">{filteredStudents.length > 0 ? (filteredStudents.reduce((acc, s) => acc + (s.totalScore || 0), 0) / filteredStudents.length).toFixed(1) : 0}đ</strong> ({doanVienStats.total} ĐV)
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Đoàn Viên Xuất Sắc */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all duration-200 flex items-center justify-between group">
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
              Đoàn Viên Xuất Sắc
            </span>
            <div className="flex items-baseline gap-1.5">
              <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                {doanVienStats.xuatSac.count}
              </h2>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                ({doanVienStats.xuatSac.pct}%)
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold truncate">
              Đánh giá chất lượng phân loại
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
            <Trophy className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Minh Chứng Chờ Duyệt */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all duration-200 flex items-center justify-between group">
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
              Minh Chứng Chờ Duyệt
            </span>
            <div className="flex items-baseline gap-1.5">
              <h2 className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight">
                {pendingProofs.length}
              </h2>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                hồ sơ
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              {pendingProofs.length > 0 ? 'Cần thẩm định ĐRL' : 'Đã hoàn tất thẩm định'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Đạt Chuẩn Sinh Viên 5 Tốt */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all duration-200 flex items-center justify-between group">
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
              Đủ Tiêu Chuẩn SV5T
            </span>
            <div className="flex items-baseline gap-1.5">
              <h2 className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono tracking-tight">
                {roleScopedStudents.filter(s => s.isSv5tEligible).length}
              </h2>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                SV
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              Đạt đủ 5 tiêu chí rèn luyện
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Biểu Đồ Recharts So Sánh Tương Quan & Biến Động ĐRL */}
      {showChart && (
        <EmulationComparisonChart initialFacultyFilter={facultyFilter} />
      )}

      {/* 3. Header and Controls - Seamless Non-Overlapping Layout */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 transition-all overflow-hidden">
        {/* Left: Content Information & Status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <FileText className="w-4 h-4" />
            </div>
            
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
              Danh Mục Sinh Viên, Sổ Điểm Rèn Luyện & Xếp Loại Đoàn - Hội
            </h2>

            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
              {academicYear}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono shrink-0">
              {filteredStudents.length} / {roleScopedStudents.length} SV
            </span>
          </div>

          {(facultyFilter !== 'ALL' || classFilter !== 'ALL' || clubFilter !== 'ALL') && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-200 dark:border-amber-800 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Đang lọc: {facultyFilter !== 'ALL' ? `Khoa ${facultyFilter}` : ''} {classFilter !== 'ALL' ? `Chi đoàn ${classFilter}` : ''} {clubFilter !== 'ALL' ? `CLB ${clubFilter}` : ''} ({filteredStudents.length} SV)
              </span>
              <button
                type="button"
                onClick={() => {
                  setFacultyFilter('ALL');
                  setClassFilter('ALL');
                  setClubFilter('ALL');
                  setClubCategoryFilter('ALL');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 hover:dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                title="Xóa bộ lọc để xem toàn trường"
              >
                <X className="w-3.5 h-3.5" />
                <span>Xóa bộ lọc</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Integrated Responsive Action Buttons Toolbar */}
        <div className="flex items-center gap-1.5 flex-wrap min-w-0 max-w-full">
          {/* Primary Action 1: Export Report */}
          <button
            type="button"
            onClick={() => setShowPdfModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl text-xs font-black shadow-2xs transition-all cursor-pointer min-h-[36px] active:scale-95"
            title="Xuất Báo Cáo Sổ Điểm & Xếp Loại Sinh Viên"
          >
            <Printer className="w-3.5 h-3.5 text-blue-100" />
            <span>Báo Cáo</span>
          </button>

          {/* Primary Action 2: Sync Data */}
          <button
            type="button"
            onClick={() => {
              showToast('Đồng bộ dữ liệu Sổ điểm với Cloud Firestore thành công!', 'success');
            }}
            className="inline-flex items-center justify-center p-2 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer min-h-[36px] min-w-[36px] active:scale-95 group"
            title="Đồng bộ dữ liệu"
          >
            <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:rotate-180 transition-transform duration-500" />
          </button>

          {/* Additional Actions: Add / Import */}
          {currentLevel >= 2 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setShowAddStudentModal(true)}
                className="inline-flex items-center justify-center p-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer min-h-[36px] min-w-[36px] active:scale-95"
                title="Thêm Sinh Viên"
              >
                <UserPlus className="w-4 h-4 text-emerald-100" />
              </button>

              {currentLevel >= 2 && (
                <button
                  type="button"
                  onClick={() => {
                    setBulkStudentModalTab('integrity');
                    setShowBulkStudentModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] active:scale-95 shadow-2xs"
                  title="Mở Modal Danh Mục Sinh Viên: Tự động kiểm tra tính toàn vẹn & Khôi phục sao lưu"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">Kiểm Tra Toàn Vẹn</span>
                </button>
              )}

              {currentLevel >= 2 && (
                <button
                  type="button"
                  onClick={() => {
                    setBulkStudentModalTab('import');
                    setShowBulkStudentModal(true);
                  }}
                  className="inline-flex items-center justify-center p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] min-w-[36px] active:scale-95"
                  title="Nhập danh sách sinh viên qua Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </button>
              )}
            </div>
          )}

          {/* Quick Export Tools (Icon Only) */}
          <div className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center justify-center p-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:text-emerald-700 shadow-2xs transition cursor-pointer min-h-[34px] min-w-[34px]"
              title="Xuất file Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            </button>

            <button
              type="button"
              onClick={handleExportToGoogleDrive}
              className="inline-flex items-center justify-center p-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:text-blue-700 shadow-2xs transition cursor-pointer min-h-[34px] min-w-[34px]"
              title="Lưu Google Drive"
            >
              <HardDrive className="w-4 h-4 text-blue-600" />
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedAuditStudentId(null);
                setShowAuditLogModal(true);
              }}
              className="inline-flex items-center justify-center p-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-700 shadow-2xs transition cursor-pointer min-h-[34px] min-w-[34px]"
              title="Nhật ký Audit Log"
            >
              <History className="w-4 h-4 text-indigo-600" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Thống kê đánh giá chất lượng đoàn viên theo 4 mức chuẩn - Compact */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 shadow-2xs">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100">
              Thống Kê Đánh Giá & Phân Loại Chất Lượng Đoàn Viên ({academicYear})
            </h3>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Tổng cộng: {doanVienStats.total} Đoàn viên
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-3">
          <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-2.5">
            <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold block">1. Hoàn thành xuất sắc</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-emerald-900 dark:text-emerald-200 font-mono">{doanVienStats.xuatSac.count}</span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">({doanVienStats.xuatSac.pct}%)</span>
            </div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Năm 1: ≥51đ | Năm 2+: ≥61đ</p>
          </div>

          <div className="bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 rounded-xl p-2.5">
            <span className="text-[11px] text-sky-800 dark:text-sky-300 font-bold block">2. Hoàn thành tốt</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-sky-900 dark:text-sky-200 font-mono">{doanVienStats.tot.count}</span>
              <span className="text-[11px] text-sky-700 dark:text-sky-400 font-semibold">({doanVienStats.tot.pct}%)</span>
            </div>
            <p className="text-[10px] text-sky-600 dark:text-sky-400 mt-0.5">Năm 1: 31-50đ | Năm 2+: 41-60đ</p>
          </div>

          <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-2.5">
            <span className="text-[11px] text-amber-800 dark:text-amber-300 font-bold block">3. Hoàn thành nhiệm vụ</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-amber-900 dark:text-amber-200 font-mono">{doanVienStats.hoanThanh.count}</span>
              <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">({doanVienStats.hoanThanh.pct}%)</span>
            </div>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">Năm 1: 16-30đ | Năm 2+: 21-40đ</p>
          </div>

          <div className="bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl p-2.5">
            <span className="text-[11px] text-rose-800 dark:text-rose-300 font-bold block">4. Không hoàn thành</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-rose-900 dark:text-rose-200 font-mono">{doanVienStats.khongHT.count}</span>
              <span className="text-[11px] text-rose-700 dark:text-rose-400 font-semibold">({doanVienStats.khongHT.pct}%)</span>
            </div>
            <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">Năm 1: ≤15đ | Năm 2+: ≤20đ</p>
          </div>
        </div>
      </div>

      {/* Pending Proofs Review Card */}
      {currentLevel >= 2 && pendingProofs.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 animate-spin" />
              <h3 className="text-xs font-bold text-amber-900">
                Có {pendingProofs.length} hồ sơ minh chứng cá nhân đang chờ thẩm định
              </h3>
            </div>
            <span className="text-[11px] text-amber-700 font-semibold">Quyền thẩm định cấp BCH</span>
          </div>

          <div className="mt-3 divide-y divide-amber-200/60 bg-white rounded-xl border border-amber-200 p-2">
            {pendingProofs.map(proof => {
              const student = students.find(s => s.studentId === proof.studentId);
              const approvedInGroup = (selfProofs || []).filter(
                p => p.studentId === proof.studentId && p.type === proof.type && p.status === 'Approved'
              );
              const currentCategoryMax = approvedInGroup.length > 0
                ? Math.max(...approvedInGroup.map(p => p.approvedScore ?? p.scoreClaimed ?? 0))
                : 0;

              const typeLabel =
                proof.type === 'KHEN_THUONG'
                  ? 'Khen Thưởng'
                  : proof.type === 'CHUC_VU'
                  ? 'Chức Vụ'
                  : proof.type === 'NCKH'
                  ? 'Nghiên Cứu KH'
                  : proof.type === 'DANG_VIEN_HUONG_DAN'
                  ? 'Đảng Viên HD'
                  : 'Hoạt Động Khác';

              return (
                <div key={proof.id} className="py-2.5 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">{student?.fullName}</span>
                      <span className="font-mono text-slate-500">({proof.studentId} - {student?.classCode})</span>
                      <span className="px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {typeLabel}
                      </span>
                      {currentCategoryMax > 0 && (
                        <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          Đã có mức: {currentCategoryMax}đ
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 font-medium mt-0.5">{proof.title}</p>
                    <a
                      href={proof.driveProofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-sky-700 hover:underline inline-flex items-center gap-1 font-semibold"
                    >
                      <HardDrive className="w-3 h-3 text-sky-600" /> Xem tệp minh chứng Drive
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right mr-2">
                      <span className="font-black text-emerald-700 block">+{proof.scoreClaimed} đ</span>
                      <span className="text-[9px] text-slate-500 block">
                        Tính: max({currentCategoryMax}, {proof.scoreClaimed}) = {Math.max(currentCategoryMax, proof.scoreClaimed)}đ
                      </span>
                    </div>
                    <button
                      onClick={() => reviewSelfProof(proof.id, 'approve', proof.scoreClaimed)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                    >
                      Duyệt (+ĐRL)
                    </button>
                    <button
                      onClick={() => reviewSelfProof(proof.id, 'reject', 0, 'Chưa đủ chứng từ hợp lệ')}
                      className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-xs font-semibold transition"
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Thanh Công Cụ Tra Cứu & Bộ Lọc Nhanh (Lớp, Khoa, Khóa, SV5T) - Compact */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 shadow-2xs space-y-3">
        {/* Top: Instant Search Bar & Summary */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-3.5 h-3.5 text-blue-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm nhanh theo MSSV, Họ và tên, Lớp (Chi đoàn), Khoa..."
              className="w-full pl-8 pr-8 py-1.5 sm:py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 shadow-2xs transition min-h-[36px]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800 shadow-2xs min-h-[34px] flex items-center">
              Hiển thị: <strong className="mx-1 text-blue-700 dark:text-blue-300">{filteredStudents.length}</strong> / {roleScopedStudents.length} sinh viên
            </span>

            {(searchTerm || facultyFilter !== 'ALL' || classFilter !== 'ALL' || cohortFilter !== 'ALL' || membershipFilter !== 'ALL' || sv5tStatusFilter !== 'ALL' || academicYearFilter !== 'ALL' || semesterFilter !== 'ALL' || activityTypeFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setFacultyFilter('ALL');
                  setClassFilter('ALL');
                  setCohortFilter('ALL');
                  setMembershipFilter('ALL');
                  setSv5tStatusFilter('ALL');
                  setAcademicYearFilter('ALL');
                  setSemesterFilter('ALL');
                  setActivityTypeFilter('ALL');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 rounded-lg border border-rose-200 dark:border-rose-800 shadow-2xs transition-all cursor-pointer min-h-[34px] active:scale-95"
                title="Đặt lại toàn bộ tiêu chí lọc về mặc định"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Đặt lại bộ lọc</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Section: Lớp, Khoa, Khóa */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          {/* 1. Lọc Khóa học (Cohort) */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
              <GraduationCap className="w-3 h-3 text-indigo-600" />
              Khóa Học (Năm Sinh Viên)
            </label>
            <div className="relative">
              <select
                value={cohortFilter}
                onChange={e => setCohortFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 appearance-none focus:ring-2 focus:ring-emerald-500 focus:outline-hidden pr-7 cursor-pointer shadow-2xs"
              >
                <option value="ALL">Tất cả các Khóa</option>
                <option value="1">Khóa 51 (Năm 1 - Mới tuyển)</option>
                <option value="2">Khóa 50 (Năm 2)</option>
                <option value="3">Khóa 49 (Năm 3)</option>
                <option value="4">Khóa 48+ (Năm 4 trở đi)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400 text-[10px]">
                ▼
              </div>
            </div>
          </div>

          {/* 2. Lọc Khoa đào tạo */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-emerald-600" />
              Khoa Đào Tạo
            </label>
            <div className="relative">
              <select
                value={facultyFilter}
                onChange={e => {
                  setFacultyFilter(e.target.value);
                  setClassFilter('ALL');
                }}
                disabled={currentLevel < 4}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 appearance-none focus:ring-2 focus:ring-emerald-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-500 pr-8 cursor-pointer"
              >
                {currentLevel >= 4 && <option value="ALL">Tất cả Khoa đào tạo (12 Khoa)</option>}
                {availableFaculties.map(f => (
                  <option key={f.code} value={f.code}>
                    Khoa {f.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* 3. Lọc Lớp / Chi đoàn */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-teal-600" />
              Lớp / Chi Đoàn
            </label>
            <div className="relative">
              <select
                value={classFilter}
                onChange={e => setClassFilter(e.target.value)}
                disabled={currentLevel === 2}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 appearance-none focus:ring-2 focus:ring-emerald-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-500 pr-8 cursor-pointer"
              >
                {currentLevel >= 3 && <option value="ALL">Tất cả Chi đoàn</option>}
                {availableClasses.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* 4. Lọc Tiêu chuẩn SV 5 Tốt */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              Danh Hiệu SV 5 Tốt
            </label>
            <div className="relative">
              <select
                value={sv5tStatusFilter}
                onChange={e => setSv5tStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 appearance-none focus:ring-2 focus:ring-emerald-500 focus:outline-hidden pr-8 cursor-pointer"
              >
                <option value="ALL">Tất cả sinh viên</option>
                <option value="ELIGIBLE">Đạt Sinh viên 5 Tốt</option>
                <option value="NOT_ELIGIBLE">Chưa đạt tiêu chuẩn</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* Quick Filter Pills for Khóa and Đối tượng */}
        <div className="pt-2 flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Chọn nhanh Khóa:</span>
          {[
            { id: 'ALL', label: 'Tất cả Khóa' },
            { id: '1', label: 'Khóa 52 (Năm 1)' },
            { id: '2', label: 'Khóa 51 (Năm 2)' },
            { id: '3', label: 'Khóa 50 (Năm 3)' },
            { id: '4', label: 'Khóa 49 (Năm 4)' },
            { id: '5', label: 'Khóa 48+ (Năm 5+)' },
          ].map((c, idx) => (
            <button
              key={`${c.id}_${idx}`}
              type="button"
              onClick={() => setCohortFilter(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm min-h-[34px] flex items-center justify-center active:scale-95 ${
                cohortFilter === c.id
                  ? 'bg-blue-700 text-white shadow-blue-700/25 border border-blue-700'
                  : 'bg-slate-100 hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {c.label}
            </button>
          ))}

          <span className="text-slate-300 dark:text-slate-700 mx-1 hidden sm:inline">|</span>

          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Đối tượng:</span>
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'DOAN_VIEN', label: 'Đoàn viên' },
            { id: 'HOI_VIEN', label: 'Hội viên' },
            { id: 'SINH_VIEN', label: 'Sinh viên' },
          ].map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMembershipFilter(m.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm min-h-[34px] flex items-center justify-center active:scale-95 ${
                membershipFilter === m.id
                  ? 'bg-blue-700 text-white shadow-blue-700/25 border border-blue-700'
                  : 'bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {m.label}
            </button>
          ))}
          {cohortFilter !== 'ALL' && filteredStudents.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedStudentIds(filteredStudents.map(s => s.studentId))}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 shadow-sm transition-all cursor-pointer flex items-center gap-1.5 sm:ml-auto min-h-[34px] active:scale-95"
              title="Chọn tất cả sinh viên thuộc Khóa đang lọc để cập nhật hàng loạt"
            >
              <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Chọn tất cả {filteredStudents.length} SV Khóa này
            </button>
          )}
        </div>

        {/* Quick Filter: Phân loại theo Danh mục Câu Lạc Bộ, Tổ, Đội, Nhóm */}
        <div className="pt-2 flex items-center gap-2 flex-wrap text-xs border-t border-slate-100 dark:border-slate-800/80">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Danh mục Đơn vị:</span>
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'CLB', label: 'Câu Lạc Bộ' },
            { id: 'TO', label: 'Tổ Tu dưỡng' },
            { id: 'DOI', label: 'Đội Tình nguyện' },
            { id: 'NHOM', label: 'Nhóm' },
          ].map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setClubCategoryFilter(cat.id as any);
                setClubFilter('ALL');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm min-h-[34px] flex items-center justify-center active:scale-95 ${
                clubCategoryFilter === cat.id
                  ? 'bg-blue-800 text-white shadow-blue-800/25 border border-blue-800'
                  : 'bg-slate-100 hover:bg-blue-50 hover:text-blue-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}

          <span className="text-slate-300 dark:text-slate-700 mx-1 hidden sm:inline">|</span>

          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Đơn vị cụ thể:</span>
          <select
            value={clubFilter}
            onChange={e => setClubFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer max-w-[240px] shadow-sm min-h-[34px]"
          >
            <option value="ALL">-- Tất cả ({availableClubs.length}) --</option>
            {availableClubs
              .filter(c => clubCategoryFilter === 'ALL' || getClubCategory(c).category === clubCategoryFilter)
              .map(c => {
                const cat = getClubCategory(c);
                return (
                  <option key={c.code} value={c.code}>
                    [{cat.label}] {c.name}
                  </option>
                );
              })}
          </select>

          {(clubCategoryFilter !== 'ALL' || clubFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setClubCategoryFilter('ALL');
                setClubFilter('ALL');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 shadow-2xs transition cursor-pointer min-h-[30px]"
            >
              <X className="w-3.5 h-3.5" />
              <span>Xóa lọc Đơn vị</span>
            </button>
          )}
        </div>
      </div>

      {/* Batch Action Bar (Yêu cầu 5: Cập nhật hàng loạt) */}
      {selectedStudentIds.length > 0 && (
        <div className="bg-blue-900 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-blue-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-blue-700 border border-blue-500/50 flex items-center justify-center font-black text-xs shadow-inner">
              {selectedStudentIds.length}
            </span>
            <div>
              <p className="font-bold text-xs">Đã chọn {selectedStudentIds.length} sinh viên</p>
              <p className="text-[11px] text-blue-200">Áp dụng thao tác cập nhật hàng loạt theo quy chuẩn Đoàn</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowBatchModal('bonus')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white text-blue-950 hover:bg-blue-50 text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer min-h-[36px] active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-emerald-700" />
              <span>Cộng Điểm Thưởng</span>
            </button>

            <button
              onClick={() => setShowBatchModal('membership')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-800 hover:bg-blue-700 text-white text-xs font-bold rounded-xl border border-blue-600 shadow-sm transition-all cursor-pointer min-h-[36px] active:scale-95"
            >
              <Users className="w-4 h-4 text-blue-200" />
              <span>Đổi Đối Tượng</span>
            </button>

            <button
              onClick={() => setShowBatchModal('academicYear')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-800 hover:bg-blue-700 text-white text-xs font-bold rounded-xl border border-blue-600 shadow-sm transition-all cursor-pointer min-h-[36px] active:scale-95"
              title="Đổi Khóa / Năm học hàng loạt cho các sinh viên đã chọn"
            >
              <GraduationCap className="w-4 h-4 text-amber-300" />
              <span>Đổi Khóa (K52, K51...)</span>
            </button>

            <button
              onClick={() => setShowBatchModal('club')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-800 hover:bg-blue-700 text-white text-xs font-bold rounded-xl border border-blue-600 shadow-sm transition-all cursor-pointer min-h-[36px] active:scale-95"
              title="Gán Câu Lạc Bộ, Tổ, Đội, Nhóm hàng loạt theo danh mục"
            >
              <Users className="w-4 h-4 text-purple-300" />
              <span>Gán CLB / Đội Nhóm</span>
            </button>

            <button
              onClick={handleApplyBatchRecalculate}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl border border-emerald-500 shadow-sm transition-all cursor-pointer min-h-[36px] active:scale-95"
              title="Tính toán lại tổng điểm và xếp loại theo quy định năm học"
            >
              <RefreshCw className="w-4 h-4 text-emerald-200" />
              <span>Tính Lại Xếp Loại</span>
            </button>

            {currentLevel === 4 && (
              <button
                type="button"
                onClick={() => setShowBatchDeleteConfirm(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer min-h-[36px] active:scale-95"
                title="Xóa các sinh viên đã chọn khỏi danh mục (Chỉ Cấp Trường)"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa Hàng Loạt ({selectedStudentIds.length})</span>
              </button>
            )}

            <button
              onClick={() => setSelectedStudentIds([])}
              className="p-2 text-blue-200 hover:text-white rounded-xl hover:bg-blue-800 transition min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              title="Bỏ chọn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* View Mode Toolbar: Dạng Thẻ Chi Tiết vs Dạng Bảng Báo Cáo */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Select All Checkbox */}
          <button
            type="button"
            onClick={handleToggleSelectAll}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs transition min-h-[34px] cursor-pointer"
          >
            {allFilteredSelected ? (
              <CheckSquare className="w-4 h-4 text-emerald-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>{allFilteredSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}</span>
            <span className="text-[11px] font-semibold text-slate-400">
              ({selectedStudentIds.length}/{filteredStudents.length})
            </span>
          </button>

          {/* View Mode Toggle: Cards vs Table */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer min-h-[30px] ${
                viewMode === 'cards'
                  ? 'bg-blue-800 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Xem danh sách dạng thẻ trực quan (Card-based)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Dạng Thẻ Chi Tiết</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer min-h-[30px] ${
                viewMode === 'table'
                  ? 'bg-blue-800 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Xem dạng bảng truyền thống"
            >
              <List className="w-3.5 h-3.5" />
              <span>Dạng Bảng Báo Cáo</span>
            </button>
          </div>
        </div>

        {/* Right: Expand all / collapse all buttons when in Card mode */}
        <div className="flex items-center gap-2 flex-wrap">
          {viewMode === 'cards' && filteredStudents.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleExpandAll}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-xl border border-blue-200 dark:border-blue-800 transition min-h-[32px] cursor-pointer"
                title="Mở rộng chi tiết minh chứng của tất cả sinh viên"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Mở rộng tất cả</span>
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition min-h-[32px] cursor-pointer"
                title="Thu gọn tất cả chi tiết minh chứng"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Thu gọn tất cả</span>
              </button>
            </div>
          )}

          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2.5 py-1 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            Hiển thị <span className="text-blue-700 dark:text-blue-400 font-black">{totalItems === 0 ? 0 : `${startIndex + 1}–${endIndex}`}</span> / <span className="text-blue-700 dark:text-blue-400 font-black">{totalItems}</span> SV (Trang {safePage}/{totalPages})
          </span>
        </div>
      </div>

      {/* Admin Discrepancy Banner */}
      {studentsWithDiscrepancy.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900 dark:text-rose-200 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 dark:bg-rose-900/80 rounded-xl text-rose-600 dark:text-rose-300 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm flex items-center gap-1.5">
                <span>Cảnh báo Admin: Phát hiện {studentsWithDiscrepancy.length} sinh viên có sai lệch tổng điểm hoặc logic xếp loại!</span>
              </h4>
              <p className="text-[11px] text-rose-700 dark:text-rose-300 leading-snug mt-0.5">
                Một số bản ghi có tổng điểm khác tổng cộng dồn các thành phần (thưởng, chức vụ, NCKH, hoạt động) hoặc xếp loại nhiệm vụ/thi đua chưa khớp với quy chuẩn.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setOnlyDiscrepanciesFilter(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                onlyDiscrepanciesFilter
                  ? 'bg-rose-700 text-white border-rose-800 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/40'
              }`}
            >
              {onlyDiscrepanciesFilter ? 'Hiện tất cả sinh viên' : `Chỉ hiện SV có lỗi (${studentsWithDiscrepancy.length})`}
            </button>

            <button
              type="button"
              onClick={handleFixAllDiscrepancies}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-sm transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>⚡ Tự động sửa toàn bộ ({studentsWithDiscrepancy.length} SV)</span>
            </button>
          </div>
        </div>
      )}

      {/* Anchor for Smooth Pagination Scrolling & Top Pagination Bar */}
      <div id="student-roster-content" className="space-y-3">
        {totalPages > 1 && renderPaginationControls(true)}
      </div>

      {/* Main View Display: Card-based or Table-based */}
      {isInitialLoading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Đang đồng bộ sổ điểm sinh viên từ Cloud Firestore...</span>
          </div>
          <SkeletonTable rows={7} columns={5} />
        </div>
      ) : viewMode === 'cards' ? (
        filteredStudents.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400">
            Không tìm thấy sinh viên nào trong tiêu chí lọc.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {paginatedStudents.map((std, idx) => {
              const globalIdx = startIndex + idx;
              const isSelected = selectedStudentIds.includes(std.studentId);
              const isExpanded = expandedStudentIds.has(std.studentId);
              const stdProofs = proofsByStudentIdMap.get(std.studentId) || [];
              const stdActivities = activitiesByStudentIdMap.get(std.studentId) || [];
              const pendingProofsCount = stdProofs.filter(p => p.status === 'Pending').length;
              const progressPct = Math.min(100, Math.max(0, Math.round((std.totalScore / maxScoreScale) * 100)));

              const issue = checkStudentScoreDiscrepancy(std, activities);

              return (
                <div
                  key={`card-${std.id || std.studentId}-${idx}`}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md overflow-hidden ${
                    issue.hasIssue
                      ? 'border-rose-400 dark:border-rose-700 ring-2 ring-rose-400/30 bg-rose-50/15'
                      : isSelected
                      ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/10'
                      : 'border-slate-200/90 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                >
                  {/* Top Red Discrepancy Alert Bar if record has issues */}
                  {issue.hasIssue && (
                    <div className="bg-rose-100 dark:bg-rose-950/80 border-b border-rose-200 dark:border-rose-800/80 px-4 py-2 flex items-center justify-between text-xs text-rose-900 dark:text-rose-200 font-medium">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 animate-pulse" />
                        <span className="font-extrabold text-[11px] sm:text-xs truncate">{issue.message}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFixStudentDiscrepancy(std);
                        }}
                        className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black cursor-pointer shadow-2xs transition active:scale-95 shrink-0 ml-2"
                        title="Tự động tính lại tổng điểm chuẩn & xếp loại quy chế"
                      >
                        Sửa ngay
                      </button>
                    </div>
                  )}

                  {/* Card Main Container */}
                  <div className="p-4 sm:p-5 space-y-3.5">
                    {/* Header: Select + Rank + Name + Actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        {/* Select button */}
                        <button
                          type="button"
                          onClick={() => handleToggleSelectStudent(std.studentId)}
                          className="p-1 text-slate-400 hover:text-emerald-700 mt-0.5 cursor-pointer"
                          title={isSelected ? 'Bỏ chọn sinh viên này' : 'Chọn sinh viên này'}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>

                        {/* Rank Badge */}
                        <span
                          className={`w-7 h-7 rounded-full shrink-0 inline-flex items-center justify-center text-xs font-black shadow-2xs ${
                            globalIdx === 0
                              ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300 shadow-amber-300/50'
                              : globalIdx === 1
                              ? 'bg-slate-200 text-slate-900 ring-1 ring-slate-300'
                              : globalIdx === 2
                              ? 'bg-amber-700/30 text-amber-900 ring-1 ring-amber-600/40'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          #{globalIdx + 1}
                        </span>

                        {/* Student Identity */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                              {std.fullName}
                            </h3>
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {std.studentId}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                std.membershipType === 'DOAN_VIEN'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                  : std.membershipType === 'HOI_VIEN'
                                  ? 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {std.membershipType === 'DOAN_VIEN'
                                ? 'Đoàn viên'
                                : std.membershipType === 'HOI_VIEN'
                                ? 'Hội viên'
                                : 'Sinh viên'}
                            </span>
                            {/* Score Discrepancy Red Warning Badge */}
                            {issue.hasIssue && (
                              <div
                                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 text-[11px] font-bold shadow-2xs"
                                title={issue.message}
                              >
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                <span>Cảnh báo: Sai lệch điểm/xếp loại</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFixStudentDiscrepancy(std);
                                  }}
                                  className="ml-1 px-1.5 py-0.2 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-extrabold cursor-pointer transition active:scale-95 shadow-2xs"
                                  title="Tự động tính lại tổng điểm chuẩn & xếp loại quy chế"
                                >
                                  Sửa nhanh
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Metadata tags */}
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {std.classCode}
                            </span>
                            <span>•</span>
                            <span>{std.facultyCode}</span>
                            <span>•</span>
                            <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                              {std.academicYearNumber === 1
                                ? 'Khóa 52 (Năm 1)'
                                : std.academicYearNumber === 2
                                ? 'Khóa 51 (Năm 2)'
                                : std.academicYearNumber === 3
                                ? 'Khóa 50 (Năm 3)'
                                : std.academicYearNumber === 4
                                ? 'Khóa 49 (Năm 4)'
                                : `Khóa 48+ (Năm ${std.academicYearNumber}+)`}
                            </span>
                            {(std.clubName || (std.clubCodes && std.clubCodes.length > 0)) && (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                                  <Users className="w-3 h-3 text-purple-500" />
                                  {std.clubName || std.clubCode || std.clubCodes?.[0]}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Row Quick Action Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenStudentPortal(std.studentId)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-800 shadow-2xs transition cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center active:scale-95"
                          title="Mở Cổng Sinh Viên & SV5T của sinh viên này"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAuditStudentId(std.studentId);
                            setShowAuditLogModal(true);
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-2xs transition cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center active:scale-95"
                          title={`Xem lịch sử thay đổi điểm rèn luyện của ${std.fullName}`}
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(std)}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800 shadow-2xs transition cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center active:scale-95"
                          title="Chỉnh sửa thông tin & điểm số trực tiếp"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {currentLevel === 4 && (
                          <button
                            type="button"
                            onClick={() => setStudentToDelete(std)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 rounded-xl text-xs border border-rose-200 dark:border-rose-800 shadow-2xs transition cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center active:scale-95"
                            title="Xóa sinh viên (Chỉ Cấp Trường)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Score & Rank Summary Banner (Tóm tắt tổng điểm và xếp loại) */}
                    <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-800/60 dark:to-blue-950/30 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-700/60">
                        {/* Total Score */}
                        <div>
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Tổng Điểm Rèn Luyện:
                            </span>
                            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                              {std.totalScore}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">điểm</span>
                            <span
                              className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1 ${
                                std.totalScore > 100
                                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white border-0 font-black shadow-emerald-500/20'
                                  : std.totalScore >= 90
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              }`}
                              title={`Tỷ lệ hoàn thành so với mốc chuẩn 100đ: ${std.totalScore}%`}
                            >
                              {std.totalScore > 100 && <Sparkles className="w-3 h-3 text-amber-300 animate-spin-slow" />}
                              <span>{std.totalScore}%</span>
                              {std.totalScore > 100 && (
                                <span className="text-[10px] bg-white/20 text-white font-extrabold px-1 rounded">
                                  +{std.totalScore - 100}đ
                                </span>
                              )}
                            </span>
                          </div>

                          {/* Flexible Progress Bar with Dynamic Color Shift */}
                          <div className="relative w-48 bg-slate-200/90 dark:bg-slate-700/90 h-2 rounded-full mt-2 overflow-hidden shadow-inner" title={`Tiến độ tích lũy: ${std.totalScore}%`}>
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                std.totalScore > 100
                                  ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-500 animate-pulse-subtle shadow-xs'
                                  : std.totalScore >= 90
                                  ? 'bg-emerald-600'
                                  : std.totalScore >= 80
                                  ? 'bg-blue-600'
                                  : std.totalScore >= 65
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                            {/* Standard 100pt Marker Line if maxScoreScale > 100 */}
                            {maxScoreScale > 100 && (
                              <div
                                className="absolute top-0 bottom-0 w-0.5 bg-slate-400 dark:bg-slate-300 shadow-xs z-10"
                                style={{ left: `${Math.round((100 / maxScoreScale) * 100)}%` }}
                                title="Mốc chuẩn 100 điểm"
                              />
                            )}
                          </div>
                        </div>

                        {/* Rank Grade & SV5T Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-extrabold ${getRankBadgeClass(
                              std.rankGrade
                            )}`}
                          >
                            {std.rankGrade}
                          </span>

                          {/* SV5T Badge */}
                          <button
                            type="button"
                            onClick={() => setSelectedSv5tStudent(std)}
                            className="hover:scale-105 transition cursor-pointer"
                            title="Bấm để xem chi tiết 5 nhóm tiêu chuẩn SV5T của sinh viên này"
                          >
                            {std.isSv5tEligible ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-full border border-emerald-300 shadow-2xs">
                                <CheckCircle2 className="w-3 h-3 text-emerald-700" /> SV5T Đạt
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-full border border-slate-200">
                                SV5T: Chưa
                              </span>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Score Component Breakdown Grid - Gốc Tính Điểm Chi Tiết */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 text-center text-xs">
                        <div className="bg-white/90 dark:bg-slate-800/90 p-2 rounded-lg border border-slate-200/70 dark:border-slate-700/70 shadow-2xs" title={`Gốc tính điểm: Tích lũy từ ${stdActivities.length} chương trình Đoàn - Hội đã tham gia`}>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                            1. Điểm Hoạt Động
                          </span>
                          <span className="font-black text-slate-900 dark:text-white text-sm font-mono">
                            +{std.activityScore}đ
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                            Từ {stdActivities.length} HĐ đã duyệt
                          </span>
                        </div>

                        <div className="bg-white/90 dark:bg-slate-800/90 p-2 rounded-lg border border-slate-200/70 dark:border-slate-700/70 shadow-2xs" title="Gốc tính điểm: Khen thưởng các cấp BTV Đoàn trường / BTV Thành đoàn">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                            2. Khen Thưởng
                          </span>
                          <span className="font-black text-amber-700 dark:text-amber-400 text-sm font-mono">
                            +{std.bonusScore}đ
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Khen thưởng các cấp</span>
                        </div>

                        <div className="bg-white/90 dark:bg-slate-800/90 p-2 rounded-lg border border-slate-200/70 dark:border-slate-700/70 shadow-2xs" title="Gốc tính điểm: Cán bộ kiêm nhiệm BCH Chi đoàn / Khoa / CLB">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                            3. Chức Vụ
                          </span>
                          <span className="font-black text-indigo-700 dark:text-indigo-400 text-sm font-mono">
                            +{std.positionScore}đ
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Cán bộ kiêm nhiệm</span>
                        </div>

                        <div className="bg-white/90 dark:bg-slate-800/90 p-2 rounded-lg border border-slate-200/70 dark:border-slate-700/70 shadow-2xs" title="Gốc tính điểm: Đề tài NCKH, Euréka, Bài báo khoa học">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                            4. Điểm NCKH
                          </span>
                          <span className="font-black text-purple-700 dark:text-purple-400 text-sm font-mono">
                            +{std.researchScore}đ
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Nghiên cứu khoa học</span>
                        </div>
                      </div>
                    </div>

                    {/* Proofs and Activities Expand / Collapse Bar */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => toggleExpandStudent(std.studentId)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs border ${
                          isExpanded
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                            : 'bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-wrap text-left">
                          <span className="flex items-center gap-1.5 font-bold">
                            <FileCheck className="w-4 h-4 text-blue-600" />
                            {stdProofs.length} minh chứng tự nộp
                          </span>
                          {pendingProofsCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-300">
                              {pendingProofsCount} chờ duyệt
                            </span>
                          )}
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span className="flex items-center gap-1.5 font-bold">
                            <Activity className="w-4 h-4 text-emerald-600" />
                            {stdActivities.length} hoạt động ghi nhận
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-blue-700 dark:text-blue-400 font-extrabold shrink-0">
                          <span>{isExpanded ? 'Thu gọn' : 'Xem chi tiết minh chứng'}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </button>
                    </div>

                    {/* Expandable Section: Chi tiết từng minh chứng và hoạt động */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-4 animate-in fade-in duration-200">
                        {/* Part 1: Minh Chứng Tự Khai của Sinh Viên */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                              Minh Chứng Tự Kê Khai ({stdProofs.length})
                            </h4>
                            {pendingProofsCount > 0 && (
                              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                {pendingProofsCount} minh chứng đang chờ thẩm định
                              </span>
                            )}
                          </div>

                          {stdProofs.length === 0 ? (
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400">
                              Sinh viên chưa nộp hồ sơ minh chứng cá nhân (Khen thưởng, Chức vụ, NCKH).
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                              {stdProofs.map(proof => {
                                const approvedInGroup = stdProofs.filter(
                                  p => p.type === proof.type && p.status === 'Approved'
                                );
                                const maxApprovedInGroup =
                                  approvedInGroup.length > 0
                                    ? Math.max(
                                        ...approvedInGroup.map(p => p.approvedScore ?? p.scoreClaimed ?? 0)
                                      )
                                    : -1;
                                const isHighest =
                                  proof.status === 'Approved' &&
                                  (proof.approvedScore ?? proof.scoreClaimed ?? 0) === maxApprovedInGroup;

                                return (
                                  <div
                                    key={proof.id}
                                    className="p-3 bg-white dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-blue-600 transition shadow-2xs space-y-1.5"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span
                                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                                            proof.type === 'KHEN_THUONG'
                                              ? 'bg-amber-100 text-amber-800'
                                              : proof.type === 'CHUC_VU'
                                              ? 'bg-blue-100 text-blue-800'
                                              : proof.type === 'NCKH'
                                              ? 'bg-purple-100 text-purple-800'
                                              : proof.type === 'DANG_VIEN_HUONG_DAN'
                                              ? 'bg-rose-100 text-rose-800'
                                              : 'bg-slate-100 text-slate-800'
                                          }`}
                                        >
                                          {proof.type === 'KHEN_THUONG'
                                            ? 'Khen Thưởng'
                                            : proof.type === 'CHUC_VU'
                                            ? 'Chức Vụ'
                                            : proof.type === 'NCKH'
                                            ? 'NCKH'
                                            : proof.type === 'DANG_VIEN_HUONG_DAN'
                                            ? 'Đảng Viên HD'
                                            : 'Hoạt Động Khác'}
                                        </span>

                                        <span
                                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            proof.status === 'Approved'
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : proof.status === 'Rejected'
                                              ? 'bg-rose-100 text-rose-800'
                                              : 'bg-amber-100 text-amber-800'
                                          }`}
                                        >
                                          {proof.status === 'Approved'
                                            ? 'Đã duyệt'
                                            : proof.status === 'Rejected'
                                            ? 'Từ chối'
                                            : 'Chờ duyệt'}
                                        </span>

                                        <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400">
                                          {proof.status === 'Approved'
                                            ? `Duyệt: +${proof.approvedScore ?? proof.scoreClaimed} đ`
                                            : `Đề xuất: +${proof.scoreClaimed} đ`}
                                        </span>

                                        {proof.status === 'Approved' && (
                                          isHighest ? (
                                            <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300">
                                              ⭐ Tính điểm cao nhất
                                            </span>
                                          ) : (
                                            <span className="text-[9.5px] font-medium px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                                              ✅ Lưu hồ sơ (không cộng dồn)
                                            </span>
                                          )
                                        )}
                                      </div>

                                      {proof.submissionDate && (
                                        <span className="text-[10px] text-slate-400 shrink-0">
                                          {proof.submissionDate}
                                        </span>
                                      )}
                                    </div>

                                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                                      {proof.title}
                                    </p>

                                    {proof.description && (
                                      <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                                        {proof.description}
                                      </p>
                                    )}

                                    {proof.reviewNotes && (
                                      <p className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                                        <span className="font-bold">Ghi chú cán bộ:</span> {proof.reviewNotes}
                                      </p>
                                    )}

                                    {/* Quick Officer Review Actions & Drive link */}
                                    <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                                      {proof.driveProofUrl ? (
                                        <a
                                          href={proof.driveProofUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 dark:text-blue-400 hover:text-blue-800 hover:underline bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                          <span>Xem tệp minh chứng trên Drive</span>
                                        </a>
                                      ) : (
                                        <span className="text-[10px] text-slate-400 italic">Không có link tệp</span>
                                      )}

                                      {/* Officer Quick Review buttons for pending proofs */}
                                      {currentLevel >= 2 && proof.status === 'Pending' && (
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => handleReviewProof(proof.id, 'approve', proof.scoreClaimed)}
                                            className="px-2.5 py-1 text-[11px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-2xs transition cursor-pointer"
                                          >
                                            Duyệt (+{proof.scoreClaimed}đ)
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleReviewProof(proof.id, 'reject')}
                                            className="px-2.5 py-1 text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 shadow-2xs transition cursor-pointer"
                                          >
                                            Từ chối
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Part 2: Hoạt Động Đoàn - Hội Tham Gia & Ghi Nhận Điểm */}
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-emerald-600" />
                            Hoạt Động & Sự Kiện Đã Tham Gia ({stdActivities.length})
                          </h4>

                          {stdActivities.length === 0 ? (
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400">
                              Chưa có hoạt động cấp trường/khoa/chi đoàn được ghi nhận tham gia.
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                              {stdActivities.map(act => {
                                const part = act.participants?.find(p => p.studentId === std.studentId);
                                return (
                                  <div
                                    key={act.id}
                                    className="p-3 bg-white dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:border-emerald-300 dark:hover:border-emerald-600 transition shadow-2xs space-y-1.5"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <span className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                                        {act.title}
                                      </span>
                                      <span className="font-black text-xs text-emerald-700 dark:text-emerald-400 shrink-0">
                                        +{part?.pointsAwarded ?? act.participantScorePoints ?? 5} đ
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 flex-wrap">
                                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                                        {act.orgName}
                                      </span>
                                      {act.startDate && (
                                        <>
                                          <span>•</span>
                                          <span>{act.startDate}</span>
                                        </>
                                      )}
                                      {part?.role && (
                                        <>
                                          <span>•</span>
                                          <span className="font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">
                                            {part.role}
                                          </span>
                                        </>
                                      )}
                                      {part?.attendanceStatus && (
                                        <>
                                          <span>•</span>
                                          <span
                                            className={`px-1.5 py-0.5 rounded font-bold ${
                                              part.attendanceStatus === 'Confirmed'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-slate-100 text-slate-600'
                                            }`}
                                          >
                                            {part.attendanceStatus === 'Confirmed' ? 'Đã điểm danh' : 'Đăng ký'}
                                          </span>
                                        </>
                                      )}
                                    </div>

                                    {/* Activity Proofs if provided by organizer */}
                                    {(act.attendanceSheetUrl || (act.proofImages && act.proofImages.length > 0) || act.actualPlanUrl) && (
                                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                                        {act.attendanceSheetUrl && (
                                          <a
                                            href={act.attendanceSheetUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 hover:underline"
                                          >
                                            <FileText className="w-3 h-3" /> Danh sách ký tên
                                          </a>
                                        )}
                                        {act.proofImages && act.proofImages.length > 0 && (
                                          <a
                                            href={act.proofImages[0]}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800 hover:underline"
                                          >
                                            <ExternalLink className="w-3 h-3" /> Ảnh minh chứng ({act.proofImages.length})
                                          </a>
                                        )}
                                        {act.actualPlanUrl && (
                                          <a
                                            href={act.actualPlanUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800 hover:underline"
                                          >
                                            <FileText className="w-3 h-3" /> Kế hoạch hoạt động
                                          </a>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Quick link to student portal */}
                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleOpenStudentPortal(std.studentId)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-xl border border-blue-200 dark:border-blue-800 transition shadow-2xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Xem toàn bộ hồ sơ điện tử tại Cổng Sinh Viên</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Table: Danh mục đoàn viên, hội viên, sinh viên (Dạng Bảng Báo Cáo Chuyên Nghiệp) */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
              <thead className="bg-slate-50/90 dark:bg-slate-800/90 text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-3 py-3.5 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectPage}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                      title={allPageSelected ? 'Bỏ chọn trang này' : `Chọn ${paginatedStudents.length} sinh viên trên trang này`}
                    >
                      {allPageSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      )}
                    </button>
                  </th>
                  <th className="px-3 py-3.5 text-center">Hạng</th>
                  <th className="px-4 py-3.5">MSSV</th>
                  <th className="px-4 py-3.5">Họ và Tên</th>
                  <th className="px-3 py-3.5">Đối tượng</th>
                  <th className="px-4 py-3.5">Chi Đoàn / Khoa</th>
                  <th className="px-3 py-3.5">CLB / Đội / Nhóm</th>
                  <th className="px-3 py-3.5">Khóa Học</th>
                  <th className="px-3 py-3.5 text-center">HĐ Rèn Luyện</th>
                  <th className="px-3 py-3.5 text-center">Khen Thưởng</th>
                  <th className="px-3 py-3.5 text-center">Chức Vụ</th>
                  <th className="px-3 py-3.5 text-center">NCKH</th>
                  <th className="px-4 py-3.5 text-right">Tổng Điểm</th>
                  <th className="px-4 py-3.5">Xếp Loại ĐRL</th>
                  <th className="px-3 py-3.5 text-center">SV 5 Tốt</th>
                  <th className="px-3 py-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-medium">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="text-center py-10 text-slate-400 dark:text-slate-500">
                      Không tìm thấy sinh viên nào theo tiêu chí lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((std, idx) => {
                    const globalIdx = startIndex + idx;
                    const isSelected = selectedStudentIds.includes(std.studentId);
                    const issue = checkStudentScoreDiscrepancy(std, activities);
                    const progressPct = Math.min(100, Math.max(0, Math.round((std.totalScore / maxScoreScale) * 100)));
                    return (
                      <tr
                        key={`${std.id || std.studentId}-${globalIdx}`}
                        className={`transition-colors ${
                          issue.hasIssue
                            ? 'bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100/70 dark:hover:bg-rose-900/40 border-l-4 border-l-rose-500'
                            : isSelected
                            ? 'bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-50/80 dark:hover:bg-slate-800/60'
                            : 'hover:bg-blue-50/40 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSelectStudent(std.studentId)}
                            className="text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                            )}
                          </button>
                        </td>

                        <td className="px-3 py-3 text-center">
                          <span
                            className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-black ${
                              globalIdx === 0
                                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 ring-2 ring-amber-400'
                                : globalIdx === 1
                                ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                                : globalIdx === 2
                                ? 'bg-amber-700/20 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {globalIdx + 1}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {std.studentId}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-slate-100">{std.fullName}</span>
                            {issue.hasIssue && (
                              <span
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/90 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700 text-[10px] font-extrabold shadow-2xs"
                                title={issue.message}
                              >
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 animate-pulse" />
                                <span className="font-bold">Cảnh báo: Sai lệch điểm/xếp loại</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFixStudentDiscrepancy(std);
                                  }}
                                  className="ml-0.5 px-1.5 py-0.2 bg-rose-600 hover:bg-rose-700 text-white rounded text-[9px] font-black cursor-pointer active:scale-95 shadow-2xs"
                                  title="Sửa nhanh về tổng điểm cộng dồn chuẩn & xếp loại quy chế"
                                >
                                  Sửa
                                </button>
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              std.membershipType === 'DOAN_VIEN'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                : std.membershipType === 'HOI_VIEN'
                                ? 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {std.membershipType === 'DOAN_VIEN'
                              ? 'Đoàn viên'
                              : std.membershipType === 'HOI_VIEN'
                              ? 'Hội viên'
                              : 'Sinh viên'}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block">{std.classCode}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">Khoa {std.facultyCode}</span>
                        </td>

                        <td className="px-3 py-3">
                          {std.clubName || (std.clubCodes && std.clubCodes.length > 0) ? (
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wide ${
                                    (std.clubCategory || 'CLB') === 'CLB'
                                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                                      : std.clubCategory === 'TO'
                                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                                      : std.clubCategory === 'DOI'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                      : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                                  }`}
                                >
                                  {std.clubCategory === 'TO'
                                    ? 'Tổ'
                                    : std.clubCategory === 'DOI'
                                    ? 'Đội'
                                    : std.clubCategory === 'NHOM'
                                    ? 'Nhóm'
                                    : 'CLB'}
                                </span>
                                <span
                                  className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[130px]"
                                  title={std.clubName || std.clubCode || std.clubCodes?.[0]}
                                >
                                  {std.clubName || std.clubCode || std.clubCodes?.[0]}
                                </span>
                              </div>
                              {std.clubCodes && std.clubCodes.length > 1 && (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                  +{std.clubCodes.length - 1} đơn vị khác
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 text-[11px] italic">Chưa gia nhập</span>
                          )}
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap text-center">
                          <span className="text-[11px] px-2 py-0.5 rounded-md font-bold font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800" title={std.academicYearNumber === 4 ? 'Khóa 49 (K49)' : `Khóa ${53 - std.academicYearNumber}`}>
                            {std.academicYearNumber === 1 ? 'K52' : std.academicYearNumber === 2 ? 'K51' : std.academicYearNumber === 3 ? 'K50' : std.academicYearNumber === 4 ? 'K49' : `K${53 - std.academicYearNumber}`}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-center">
                          <span className="font-mono font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-800/60">
                            +{std.activityScore}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-center">
                          <span className="font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-800/60">
                            +{std.bonusScore}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-center">
                          <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-200/60 dark:border-indigo-800/60">
                            +{std.positionScore}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-center">
                          <span className="font-mono font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-md border border-purple-200/60 dark:border-purple-800/60">
                            +{std.researchScore}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-mono text-sm ${
                                  issue.hasIssue && issue.issueTypes.includes('MATH')
                                    ? 'font-black text-rose-700 dark:text-rose-400 underline decoration-rose-400 decoration-wavy'
                                    : 'font-black text-emerald-700 dark:text-emerald-400'
                                }`}
                              >
                                {std.totalScore}đ
                              </span>
                              {issue.hasIssue && issue.issueTypes.includes('MATH') ? (
                                <span
                                  className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 border border-rose-300 flex items-center gap-0.5"
                                  title={`Sai lệch tổng: Hiện tại ${std.totalScore}đ ≠ Chuẩn cộng dồn ${issue.expectedTotal}đ`}
                                >
                                  <AlertTriangle className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                                  <span>Lệch ({issue.expectedTotal}đ)</span>
                                </span>
                              ) : (
                                <span
                                  className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                                    std.totalScore > 100
                                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black shadow-2xs'
                                      : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                                  }`}
                                >
                                  {std.totalScore > 100 ? `🔥 ${std.totalScore}%` : `${std.totalScore}%`}
                                </span>
                              )}
                            </div>
                            {/* Mini Progress Bar */}
                            <div className="w-20 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden" title={`Tiến độ: ${std.totalScore}%`}>
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  issue.hasIssue && issue.issueTypes.includes('MATH')
                                    ? 'bg-rose-500'
                                    : std.totalScore > 100
                                    ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500'
                                    : std.totalScore >= 90
                                    ? 'bg-emerald-600'
                                    : std.totalScore >= 80
                                    ? 'bg-blue-600'
                                    : std.totalScore >= 65
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-col items-start gap-1">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                issue.hasIssue && (issue.issueTypes.includes('RANK_GRADE') || issue.issueTypes.includes('RANK_GENERAL'))
                                  ? 'bg-rose-100 text-rose-800 border-2 border-rose-400 dark:bg-rose-950 dark:text-rose-200'
                                  : getRankBadgeClass(std.rankGrade)
                              }`}
                            >
                              {std.rankGrade}
                            </span>
                            {issue.hasIssue && (issue.issueTypes.includes('RANK_GRADE') || issue.issueTypes.includes('RANK_GENERAL')) && (
                              <span
                                className="text-[10px] text-rose-700 dark:text-rose-300 font-bold flex items-center gap-1"
                                title={`Chuẩn quy định: ${issue.expectedRankGrade}`}
                              >
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                <span>Chuẩn: {issue.expectedRankGrade}</span>
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedSv5tStudent(std)}
                            className="hover:scale-105 transition cursor-pointer"
                            title="Bấm để xem chi tiết 5 nhóm tiêu chuẩn SV5T của sinh viên này"
                          >
                            {std.isSv5tEligible ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-300 shadow-2xs">
                                <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Đạt
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-full border border-slate-200">
                                Chưa
                              </span>
                            )}
                          </button>
                        </td>

                        {/* Thao tác: Cổng SV, Lịch sử, Sửa, Xóa (Icon-only) */}
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenStudentPortal(std.studentId)}
                              className="inline-flex items-center justify-center p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60 rounded-xl text-xs border border-blue-200 dark:border-blue-800 shadow-xs transition cursor-pointer min-h-[30px] min-w-[30px]"
                              title="Mở Cổng Sinh Viên & SV5T"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAuditStudentId(std.studentId);
                                setShowAuditLogModal(true);
                              }}
                              className="inline-flex items-center justify-center p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl text-xs border border-slate-200 dark:border-slate-700 shadow-xs transition cursor-pointer min-h-[30px] min-w-[30px]"
                              title="Xem lịch sử thay đổi"
                            >
                              <History className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(std)}
                              className="inline-flex items-center justify-center p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60 rounded-xl text-xs border border-emerald-200 dark:border-emerald-800 shadow-xs transition cursor-pointer min-h-[30px] min-w-[30px]"
                              title="Chỉnh sửa thông tin & điểm số"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            </button>
                            {currentLevel === 4 && (
                              <button
                                type="button"
                                onClick={() => setStudentToDelete(std)}
                                className="inline-flex items-center justify-center p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 dark:hover:bg-rose-900/60 rounded-xl text-xs border border-rose-200 dark:border-rose-800 shadow-xs transition cursor-pointer min-h-[30px] min-w-[30px]"
                                title="Xóa sinh viên"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* Bottom Pagination Controls (50 bản ghi / trang) */}
      {renderPaginationControls(false)}

      {/* Batch Bonus Modal */}
      {showBatchModal === 'bonus' && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              Cộng Điểm Thưởng Hàng Loạt
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Áp dụng cho {selectedStudentIds.length} sinh viên đang được chọn.
            </p>

            <div className="mt-4 space-y-3">
              <label className="block text-xs font-bold text-slate-700">Mức điểm cộng (+)</label>
              <div className="flex gap-2">
                {[5, 10, 15, 20].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setBatchBonusValue(val)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm min-h-[36px] active:scale-95 ${
                      batchBonusValue === val
                        ? 'bg-blue-700 text-white border-blue-700 shadow-blue-700/25'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'
                    }`}
                  >
                    +{val}đ
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={batchBonusValue}
                onChange={e => setBatchBonusValue(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 min-h-[38px] font-semibold"
                placeholder="Hoặc nhập số điểm tùy ý..."
              />
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowBatchModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer min-h-[36px]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleApplyBatchBonus}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-blue-700/30 transition cursor-pointer min-h-[36px] active:scale-95"
              >
                Xác nhận cộng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Membership Modal */}
      {showBatchModal === 'membership' && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Chuyển Đổi Đối Tượng Hàng Loạt
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Áp dụng cho {selectedStudentIds.length} sinh viên đang được chọn.
            </p>

            <div className="mt-4 space-y-2">
              {[
                { value: 'DOAN_VIEN', label: 'Đoàn viên TNCS Hồ Chí Minh' },
                { value: 'HOI_VIEN', label: 'Hội viên Hội Sinh viên VN' },
                { value: 'SINH_VIEN', label: 'Sinh viên' },
              ].map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs transition ${
                    batchMembershipValue === opt.value
                      ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="membershipOption"
                    value={opt.value}
                    checked={batchMembershipValue === opt.value}
                    onChange={() => setBatchMembershipValue(opt.value as StudentMembership)}
                    className="text-emerald-600"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowBatchModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer min-h-[36px]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleApplyBatchMembership}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-blue-700/30 transition cursor-pointer min-h-[36px] active:scale-95"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Academic Year Modal (Đổi Khóa hàng loạt K52, K51, K50, K49...) */}
      {showBatchModal === 'academicYear' && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              Điều Chỉnh Khóa Năm Học Hàng Loạt
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Áp dụng điều chỉnh Khóa học cho <strong className="text-indigo-700">{selectedStudentIds.length}</strong> sinh viên đang chọn.
            </p>

            <div className="mt-4 space-y-2">
              {[
                { value: 1, label: 'Khóa 52 (Năm 1 - Tân Sinh Viên)' },
                { value: 2, label: 'Khóa 51 (Năm 2)' },
                { value: 3, label: 'Khóa 50 (Năm 3)' },
                { value: 4, label: 'Khóa 49 (Năm 4)' },
                { value: 5, label: 'Khóa 48+ (Năm 5 trở đi)' },
              ].map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer text-xs transition ${
                    batchAcademicYearValue === opt.value
                      ? 'bg-indigo-50 border-indigo-300 font-bold text-indigo-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="academicYearOption"
                    value={opt.value}
                    checked={batchAcademicYearValue === opt.value}
                    onChange={() => setBatchAcademicYearValue(opt.value)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBatchModal(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleApplyBatchAcademicYear}
                className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-lg shadow-xs transition"
              >
                Cập nhật Khóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Club Assignment Modal (Gán Câu Lạc Bộ, Tổ, Đội, Nhóm theo danh mục) */}
      {showBatchModal === 'club' && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              Gán Câu Lạc Bộ, Tổ, Đội, Nhóm Hàng Loạt
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Phân công đơn vị trực thuộc theo danh mục cho <strong className="text-purple-700">{selectedStudentIds.length}</strong> sinh viên đang chọn.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chọn Câu Lạc Bộ, Tổ, Đội, Nhóm theo danh mục
                </label>
                <select
                  value={batchClubValue}
                  onChange={e => setBatchClubValue(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- Chọn đơn vị trực thuộc --</option>
                  <optgroup label="🏛️ Câu Lạc Bộ / Tổ / Đội / Nhóm Cấp Trường">
                    {availableClubs
                      .filter(c => c.type === 'CLB_TRUONG')
                      .map(c => {
                        const cat = getClubCategory(c);
                        return (
                          <option key={c.code} value={c.code}>
                            [{cat.label}] {c.name} ({c.code})
                          </option>
                        );
                      })}
                  </optgroup>
                  <optgroup label="🏢 Câu Lạc Bộ / Đội / Nhóm Trực Thuộc Khoa">
                    {availableClubs
                      .filter(c => c.type === 'CLB_KHOA')
                      .map(c => {
                        const cat = getClubCategory(c);
                        return (
                          <option key={c.code} value={c.code}>
                            [{cat.label}] {c.name} ({c.code}) - Khoa {c.facultyCode}
                          </option>
                        );
                      })}
                  </optgroup>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowBatchModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer min-h-[36px]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    if (selectedStudentIds.length === 0 || !batchClubValue) return;
                    batchUpdateStudents(selectedStudentIds, { clubCode: batchClubValue, recalculate: true });
                    setShowBatchModal(null);
                    showToast(`Đã gán đơn vị cho ${selectedStudentIds.length} sinh viên!`, 'success');
                  } catch (err: any) {
                    showToast('Lỗi khi gán đơn vị hàng loạt: ' + (err?.message || String(err)), 'error');
                  }
                }}
                disabled={!batchClubValue}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-blue-700/30 transition cursor-pointer min-h-[36px] active:scale-95"
              >
                Gán Đơn Vị
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Student Inline Edit Modal (Yêu cầu 1: Chỉnh sửa trực tiếp) */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-emerald-300" />
                  Hiệu Chỉnh Trực Tiếp Thông Tin & Điểm Số
                </h3>
                <p className="text-xs text-emerald-200">
                  MSSV: {editingStudent.studentId} • {editingStudent.fullName}
                </p>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1 rounded-lg text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentEdit} className="p-6 space-y-4 text-xs">
              {/* Chức năng khóa chỉnh sửa thông tin cá nhân: MSSV, Họ tên, Lớp, Khoa */}
              {currentLevel < 4 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-900 text-xs">Khóa Chỉnh Sửa Thông Tin Cá Nhân</p>
                    <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                      Mã số sinh viên, họ tên, chi đoàn (lớp) và khoa được quản lý tập trung và khóa bảo vệ bởi Cấp Trường. Tài khoản cấp {currentLevel === 3 ? 'Khoa' : currentLevel === 2 ? 'Chi đoàn' : 'Sinh viên'} chỉ có quyền điều chỉnh Điểm Rèn Luyện và đối tượng Đoàn - Hội.
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className={`rounded-xl p-3 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isPersonalInfoLocked
                      ? 'bg-slate-50 border-slate-200 text-slate-700'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isPersonalInfoLocked ? 'bg-slate-200 text-slate-600' : 'bg-emerald-200 text-emerald-800'
                      }`}
                    >
                      {isPersonalInfoLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-bold text-xs flex items-center gap-1.5">
                        {isPersonalInfoLocked
                          ? 'Thông Tin Cá Nhân Đang Được Khóa An Toàn'
                          : 'Đã Mở Khóa Chỉnh Sửa Hành Chính'}
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white/70 border border-current">
                          Cấp Trường
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {isPersonalInfoLocked
                          ? 'Chế độ khóa an toàn kích hoạt để tránh vô ý điều chỉnh MSSV, Họ tên, Lớp, Khoa.'
                          : 'Cấp Trường có thể chỉnh sửa MSSV, Họ tên, Lớp, Khoa nếu có sai sót dữ liệu.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (isPersonalInfoLocked) {
                        const ok = window.confirm(
                          'Mở khóa chỉnh sửa thông tin hành chính (MSSV, Họ tên, Lớp, Khoa)? Hãy cẩn trọng khi lưu dữ liệu.'
                        );
                        if (ok) setIsPersonalInfoLocked(false);
                      } else {
                        setIsPersonalInfoLocked(true);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs ${
                      isPersonalInfoLocked
                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300'
                    }`}
                  >
                    {isPersonalInfoLocked ? (
                      <>
                        <Unlock className="w-3.5 h-3.5 text-amber-700" />
                        Mở Khóa Chỉnh Sửa
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-slate-600" />
                        Khóa Lại An Toàn
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Thông tin hành chính cá nhân */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span>Mã Số Sinh Viên (MSSV)</span>
                    {(currentLevel < 4 || isPersonalInfoLocked) && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-normal">
                        <Lock className="w-3 h-3 text-slate-400" /> Khóa
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={currentLevel < 4 || isPersonalInfoLocked}
                    value={editForm.studentId}
                    onChange={e => setEditForm(prev => ({ ...prev, studentId: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border font-mono font-bold ${
                      currentLevel < 4 || isPersonalInfoLocked
                        ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                        : 'bg-white border-slate-300 focus:ring-2 focus:ring-emerald-500 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span>Họ và Tên</span>
                    {(currentLevel < 4 || isPersonalInfoLocked) && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-normal">
                        <Lock className="w-3 h-3 text-slate-400" /> Khóa
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={currentLevel < 4 || isPersonalInfoLocked}
                    value={editForm.fullName}
                    onChange={e => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border font-medium ${
                      currentLevel < 4 || isPersonalInfoLocked
                        ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                        : 'bg-white border-slate-300 focus:ring-2 focus:ring-emerald-500 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span>Chi Đoàn (Lớp)</span>
                    {(currentLevel < 4 || isPersonalInfoLocked) && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-normal">
                        <Lock className="w-3 h-3 text-slate-400" /> Khóa
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={currentLevel < 4 || isPersonalInfoLocked}
                    value={editForm.classCode}
                    onChange={e => setEditForm(prev => ({ ...prev, classCode: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border font-mono ${
                      currentLevel < 4 || isPersonalInfoLocked
                        ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                        : 'bg-white border-slate-300 focus:ring-2 focus:ring-emerald-500 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span>Khoa Quản Lý</span>
                    {(currentLevel < 4 || isPersonalInfoLocked) && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-normal">
                        <Lock className="w-3 h-3 text-slate-400" /> Khóa
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={currentLevel < 4 || isPersonalInfoLocked}
                    value={editForm.facultyCode}
                    onChange={e => setEditForm(prev => ({ ...prev, facultyCode: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border font-mono ${
                      currentLevel < 4 || isPersonalInfoLocked
                        ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                        : 'bg-white border-slate-300 focus:ring-2 focus:ring-emerald-500 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Đối Tượng</label>
                  <select
                    value={editForm.membershipType}
                    onChange={e =>
                      setEditForm(prev => ({ ...prev, membershipType: e.target.value as StudentMembership }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="DOAN_VIEN">Đoàn viên</option>
                    <option value="HOI_VIEN">Hội viên</option>
                    <option value="SINH_VIEN">Sinh viên</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Khóa Năm Học</label>
                  <select
                    value={editForm.academicYearNumber}
                    onChange={e =>
                      setEditForm(prev => ({ ...prev, academicYearNumber: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value={1}>Khóa 52 (Năm 1 - Tân Sinh Viên)</option>
                    <option value={2}>Khóa 51 (Năm 2)</option>
                    <option value={3}>Khóa 50 (Năm 3)</option>
                    <option value={4}>Khóa 49 (Năm 4)</option>
                    <option value={5}>Khóa 48+ (Năm 5 trở đi)</option>
                  </select>
                </div>

                {/* Câu Lạc Bộ, Tổ, Đội, Nhóm theo danh mục */}
                <div className="col-span-2">
                  <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span>Câu Lạc Bộ, Tổ, Đội, Nhóm (Theo danh mục)</span>
                    <span className="text-[10px] text-slate-500 font-normal">Đơn vị sinh hoạt trực thuộc</span>
                  </label>
                  <select
                    value={editForm.clubCodes[0] || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setEditForm(prev => ({
                        ...prev,
                        clubCodes: val ? [val] : []
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-medium text-xs bg-white text-slate-800"
                  >
                    <option value="">-- Chưa tham gia Câu Lạc Bộ, Tổ, Đội, Nhóm nào --</option>
                    <optgroup label="🏛️ Câu Lạc Bộ / Tổ / Đội / Nhóm Cấp Trường">
                      {availableClubs
                        .filter(c => c.type === 'CLB_TRUONG')
                        .map(c => {
                          const catInfo = getClubCategory(c);
                          return (
                            <option key={c.code} value={c.code}>
                              [{catInfo.label}] {c.name} ({c.code})
                            </option>
                          );
                        })}
                    </optgroup>
                    <optgroup label="🏢 Câu Lạc Bộ / Đội / Nhóm Trực Thuộc Khoa">
                      {availableClubs
                        .filter(c => c.type === 'CLB_KHOA')
                        .map(c => {
                          const catInfo = getClubCategory(c);
                          return (
                            <option key={c.code} value={c.code}>
                              [{catInfo.label}] {c.name} ({c.code}) - Khoa {c.facultyCode}
                            </option>
                          );
                        })}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* 4 Score components */}
              <div className="pt-3 border-t border-slate-200">
                <p className="font-bold text-slate-800 mb-2">4 Thành Phần Điểm Rèn Luyện (Tự Động Tính Tổng)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">1. Điểm Hoạt động</label>
                    <input
                      type="number"
                      min={0}
                      value={editForm.activityScore}
                      onChange={e => setEditForm(prev => ({ ...prev, activityScore: Number(e.target.value) }))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">2. Điểm Khen thưởng</label>
                    <input
                      type="number"
                      min={0}
                      value={editForm.bonusScore}
                      onChange={e => setEditForm(prev => ({ ...prev, bonusScore: Number(e.target.value) }))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-amber-700"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">3. Điểm Chức vụ</label>
                    <input
                      type="number"
                      min={0}
                      value={editForm.positionScore}
                      onChange={e => setEditForm(prev => ({ ...prev, positionScore: Number(e.target.value) }))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-blue-700"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">4. Điểm NCKH</label>
                    <input
                      type="number"
                      min={0}
                      value={editForm.researchScore}
                      onChange={e => setEditForm(prev => ({ ...prev, researchScore: Number(e.target.value) }))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-purple-700"
                    />
                  </div>
                </div>

                <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <span className="font-bold text-slate-700">Tổng điểm rèn luyện dự kiến:</span>
                  <span className="text-base font-black text-emerald-700">
                    {Number(editForm.activityScore) +
                      Number(editForm.bonusScore) +
                      Number(editForm.positionScore) +
                      Number(editForm.researchScore)}{' '}
                    điểm
                  </span>
                </div>

                {/* Căn cứ điều chỉnh điểm minh bạch (Audit Log) */}
                <div className="mt-3 p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-indigo-950 flex items-center gap-1.5 text-xs">
                      <History className="w-3.5 h-3.5 text-indigo-700" />
                      Căn Cứ / Lý Do Điều Chỉnh (Ghi Vết Kiểm Toán Minh Bạch)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAuditStudentId(editingStudent.studentId);
                        setShowAuditLogModal(true);
                      }}
                      className="text-[11px] text-indigo-700 hover:text-indigo-900 font-bold underline cursor-pointer"
                    >
                      Xem lịch sử của SV này
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editForm.auditReason}
                    onChange={e => setEditForm(prev => ({ ...prev, auditReason: e.target.value }))}
                    placeholder="VD: Cập nhật theo Quyết định khen thưởng số 12/QĐ-ĐTN, minh chứng đã thẩm tra..."
                    className="w-full px-3 py-2 rounded-lg border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500 font-medium text-xs text-slate-800"
                  />
                  <p className="text-[10px] text-indigo-800/80">
                    Hệ thống sẽ tự động ghi vết thông tin định danh cán bộ, thời gian và số điểm thay đổi vào Nhật ký kiểm toán (Audit Log).
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-xs transition cursor-pointer min-h-[38px]"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow-blue-700/30 transition cursor-pointer min-h-[38px] active:scale-95"
                >
                  <Save className="w-4 h-4 text-blue-100" />
                  <span>Lưu & Tính Lại Điểm</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Thêm Sinh Viên Đơn Lẻ */}
      <AddStudentModal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
      />

      {/* Modal: Danh Mục Sinh Viên, Kiểm Tra Toàn Vẹn & Nhập Excel */}
      <BulkStudentImportModal
        isOpen={showBulkStudentModal}
        onClose={() => setShowBulkStudentModal(false)}
        initialTab={bulkStudentModalTab}
      />

      {/* Modal: Chi Tiết Đánh Giá Tiêu Chuẩn Sinh Viên 5 Tốt (SV5T) */}
      <Sv5tDetailModal
        student={selectedSv5tStudent}
        isOpen={Boolean(selectedSv5tStudent)}
        onClose={() => setSelectedSv5tStudent(null)}
        onOpenPortal={handleOpenStudentPortal}
      />

      {/* Modal: Xác Nhận Xóa Đơn Lẻ Sinh Viên */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Xác nhận xóa sinh viên?
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Bạn có chắc chắn muốn xóa sinh viên{' '}
              <strong className="text-slate-900">{studentToDelete.fullName}</strong> (MSSV:{' '}
              <span className="font-mono font-bold text-rose-700">{studentToDelete.studentId}</span>) thuộc chi đoàn {studentToDelete.classCode}?
            </p>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl mt-3 text-[11px] text-rose-800">
              Hành động này sẽ xóa dữ liệu điểm rèn luyện, xếp loại và hồ sơ SV5T của sinh viên khỏi danh mục hiện tại.
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-xs transition cursor-pointer min-h-[38px]"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow-rose-600/30 transition cursor-pointer min-h-[38px] active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xác Nhận Xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Xác Nhận Xóa Hàng Loạt Sinh Viên */}
      {showBatchDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Xác nhận xóa hàng loạt sinh viên?
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Bạn đang yêu cầu xóa <strong className="text-rose-700 font-bold">{selectedStudentIds.length}</strong> sinh viên đã chọn khỏi danh mục hệ thống.
            </p>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl mt-3 text-[11px] text-rose-800">
              Cảnh báo: Dữ liệu hồ sơ điểm rèn luyện và danh hiệu SV5T của các sinh viên này sẽ bị xóa khỏi bảng tổng hợp.
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowBatchDeleteConfirm(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-xs transition cursor-pointer min-h-[38px]"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchDelete}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow-rose-600/30 transition cursor-pointer min-h-[38px] active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa {selectedStudentIds.length} Sinh Viên</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )}

      {/* Modal: Lịch Sử Thay Đổi & Nhật Ký Kiểm Toán (Audit Log) */}
      <ScoreAuditLogModal
        isOpen={showAuditLogModal}
        onClose={() => {
          setShowAuditLogModal(false);
          setSelectedAuditStudentId(null);
        }}
        initialStudentId={selectedAuditStudentId}
      />

      {/* Modal: Xuất Báo Cáo Sổ Điểm PDF / Ngoại Tuyến */}
      <ReportPdfExportModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        reportOptions={studentReportOptions}
      />
    </div>
  );
};

export default ScoreRoster;
