import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StudentSelfProof, FilterAcademicYear, FilterActivityType, FilterSemester } from '../types';
import { SV5T_STANDARDS, checkSv5tEligibility } from '../data/mockData';
import { fetchDriveFiles, createDriveFile } from '../services/driveService';
import { DriveItem } from '../types';
import { DataFilterToolbar } from './DataFilterToolbar';
import {
  getActivitySemester,
  getActivityType,
  getSemesterBadge,
  getActivityTypeBadge,
  matchActivityFilters
} from '../utils/filterUtils';
import {
  Award,
  Plus,
  FileCheck,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  HardDrive,
  Sparkles,
  BookOpen,
  Briefcase,
  Trophy,
  GraduationCap,
  Calendar,
  AlertCircle,
  Check,
  Shield,
  ShieldCheck,
  Info,
  Activity,
  Layers,
  Users,
  History,
  Bell,
  Volume2,
  Radio,
  Zap,
  Trash2,
  Download
} from 'lucide-react';
import { ScoreAuditLogModal } from './ScoreAuditLogModal';
import { Skeleton, SkeletonMetricCard, AnimatedCounter } from './common/Skeleton';

interface StudentPortalProps {
  initialSubTab?: 'records' | 'sv5t' | 'activities' | 'proofs' | 'notifications';
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ initialSubTab }) => {
  const {
    user,
    students,
    activities,
    selfProofs,
    annualAwardsCatalog,
    researchAwardsCatalog,
    positionRolesCatalog,
    partyMentorCatalog,
    isInitialLoading,
    addSelfProof,
    toggleSv5tCriterion,
    academicYear,
    accessToken,
    googleUser,
    selectedPortalStudentId,
    setSelectedPortalStudentId,
    setActiveTab,
    showToast,
    studentPushNotifications,
    sendStudentPushNotification,
    markPushNotificationAsRead,
    markAllPushNotificationsAsRead,
    clearPushNotifications,
    requestNotificationPermission,
    restoreSampleStudents,
    updateActivity,
    checkInActivity
  } = useApp();

  const isOfficer = user.currentRole.roleLevel >= 2;

  // Current student record (honoring selectedPortalStudentId or user's own studentId)
  const currentStudent = useMemo(() => {
    if (selectedPortalStudentId) {
      const found = students.find(s => s.studentId === selectedPortalStudentId);
      if (found) return found;
    }
    if (user.studentId) {
      const found = students.find(s => s.studentId === user.studentId);
      if (found) return found;
    }
    if (user.email) {
      const emailMatch = students.find(s => s.email && s.email.toLowerCase().trim() === user.email.toLowerCase().trim());
      if (emailMatch) return emailMatch;
    }
    if (students && students.length > 0) {
      return students[0];
    }
    return null;
  }, [selectedPortalStudentId, user.studentId, user.email, students]);

  // Filter toolbar states
  const [academicYearFilter, setAcademicYearFilter] = useState<FilterAcademicYear>('ALL');
  const [semesterFilter, setSemesterFilter] = useState<FilterSemester>('ALL');
  const [activityTypeFilter, setActivityTypeFilter] = useState<FilterActivityType>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewTab, setViewTab] = useState<'activities' | 'proofs' | 'notifications'>('activities');
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [webPushStatus, setWebPushStatus] = useState<NotificationPermission | 'unsupported'>('default');
  const [pushFilterType, setPushFilterType] = useState<string>('ALL');

  React.useEffect(() => {
    if (initialSubTab === 'proofs') {
      setViewTab('proofs');
    } else if (initialSubTab === 'notifications') {
      setViewTab('notifications');
    } else if (initialSubTab === 'activities' || initialSubTab === 'records') {
      setViewTab('activities');
    } else if (initialSubTab === 'sv5t') {
      // Smooth scroll to SV5T section
      setTimeout(() => {
        const sv5tElem = document.getElementById('sv5t-standards-section');
        if (sv5tElem) {
          sv5tElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [initialSubTab]);

  // Push notifications for the current student
  const studentPushNotifs = useMemo(() => {
    if (!currentStudent) return [];
    return studentPushNotifications.filter(n => n.studentId === currentStudent.studentId);
  }, [studentPushNotifications, currentStudent?.studentId]);

  const unreadStudentPushCount = studentPushNotifs.filter(n => !n.isRead).length;

  // Check browser notification permission
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setWebPushStatus(Notification.permission);
    } else {
      setWebPushStatus('unsupported');
    }
  }, []);

  // Self Proof form states
  const [proofType, setProofType] = useState<StudentSelfProof['type']>('KHEN_THUONG');
  const [selectedCatalogItemId, setSelectedCatalogItemId] = useState<string>('');
  const [proofTitle, setProofTitle] = useState('');
  const [proofDesc, setProofDesc] = useState('');
  const [scoreClaimed, setScoreClaimed] = useState(10);
  const [driveProofUrl, setDriveProofUrl] = useState('');
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);

  // Active items for the currently selected proof category
  const activeCatalogItems = useMemo(() => {
    switch (proofType) {
      case 'KHEN_THUONG':
        return (annualAwardsCatalog || []).filter(c => c.active !== false);
      case 'NCKH':
        return (researchAwardsCatalog || []).filter(c => c.active !== false);
      case 'CHUC_VU':
        return (positionRolesCatalog || []).filter(c => c.active !== false);
      case 'DANG_VIEN_HUONG_DAN':
        return (partyMentorCatalog || []).filter(c => c.active !== false);
      default:
        return [];
    }
  }, [proofType, annualAwardsCatalog, researchAwardsCatalog, positionRolesCatalog, partyMentorCatalog]);

  // Google Drive browser state
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveItem[]>([]);
  const [loadingDrive, setLoadingDrive] = useState(false);

  // Load student's proofs with filter
  const studentProofs = useMemo(() => {
    if (!currentStudent) return [];
    return selfProofs.filter(p => p.studentId === currentStudent.studentId);
  }, [selfProofs, currentStudent?.studentId]);

  // Current approved proofs for this student in the selected category
  const approvedInSelectedCategory = useMemo(() => {
    if (!currentStudent) return [];
    return studentProofs.filter(p => p.type === proofType && p.status === 'Approved');
  }, [studentProofs, proofType, currentStudent]);

  // Current highest approved score in this category
  const currentCategoryMaxScore = useMemo(() => {
    if (approvedInSelectedCategory.length === 0) return 0;
    return Math.max(...approvedInSelectedCategory.map(p => p.approvedScore ?? p.scoreClaimed ?? 0));
  }, [approvedInSelectedCategory]);

  // Mapping of category -> id of highest approved proof (Quy tắc chỉ tính điểm cao nhất)
  const highestApprovedProofMap = useMemo(() => {
    const map = new Map<string, string>();
    const categories: Array<StudentSelfProof['type']> = [
      'KHEN_THUONG',
      'NCKH',
      'CHUC_VU',
      'DANG_VIEN_HUONG_DAN',
      'KHAC'
    ];
    categories.forEach(cat => {
      const list = studentProofs.filter(p => p.type === cat && p.status === 'Approved');
      if (list.length > 0) {
        let maxVal = -1;
        let bestId = '';
        list.forEach(p => {
          const val = p.approvedScore !== undefined ? p.approvedScore : p.scoreClaimed;
          if (val > maxVal) {
            maxVal = val;
            bestId = p.id;
          }
        });
        if (bestId) {
          map.set(cat, bestId);
        }
      }
    });
    return map;
  }, [studentProofs]);

  const filteredStudentProofs = useMemo(() => {
    if (!currentStudent) return [];
    return studentProofs.filter(p => {
      // Academic year
      if (academicYearFilter !== 'ALL') {
        const year = p.submissionDate ? p.submissionDate.slice(0, 4) : '';
        if (!academicYearFilter.includes(year)) return false;
      }
      // Semester
      if (semesterFilter !== 'ALL') {
        try {
          const month = new Date(p.submissionDate).getMonth() + 1;
          let sem = 'HK1';
          if (month >= 9 || month === 1) sem = 'HK1';
          else if (month >= 2 && month <= 6) sem = 'HK2';
          else if (month >= 7 && month <= 8) sem = 'HK_HE';
          if (sem !== semesterFilter) return false;
        } catch {}
      }
      // Search
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [studentProofs, academicYearFilter, semesterFilter, searchTerm, currentStudent]);

  // Load student's joined activities with filter
  const filteredStudentActivities = useMemo(() => {
    if (!currentStudent) return [];
    return activities.filter(act => {
      const isParticipant = act.participants?.some(p => p.studentId === currentStudent.studentId);
      if (!isParticipant) return false;

      return matchActivityFilters(act, {
        academicYear: academicYearFilter,
        semester: semesterFilter,
        activityType: activityTypeFilter,
        searchTerm,
      });
    });
  }, [activities, currentStudent?.studentId, academicYearFilter, semesterFilter, activityTypeFilter, searchTerm]);

  // SV5T detailed check (Strict 100% Rule)
  const sv5tStats = useMemo(() => {
    if (!currentStudent) {
      return {
        isEligible: false,
        totalAchieved: 0,
        totalRequired: 22,
        percent: 0,
      };
    }
    return checkSv5tEligibility(currentStudent.sv5tCriteriaAchieved || {});
  }, [currentStudent]);

  const handleOpenDrivePicker = async () => {
    if (!accessToken) {
      alert('Vui lòng bấm nút "Kết nối Google Drive" ở góc trên cùng để liên kết tài khoản Drive của bạn.');
      return;
    }
    setLoadingDrive(true);
    setShowDrivePicker(true);
    try {
      const files = await fetchDriveFiles(accessToken);
      setDriveFiles(files);
    } catch (err: any) {
      alert('Không thể đọc file từ Google Drive: ' + (err.message || 'Lỗi'));
    } finally {
      setLoadingDrive(false);
    }
  };

  const handleCreateSampleProofOnDrive = async () => {
    if (!currentStudent) return;
    if (!accessToken) {
      alert('Vui lòng kết nối Google Drive trước.');
      return;
    }
    const confirmed = window.confirm(
      'Hệ thống sẽ tạo 1 tệp ghi nhận minh chứng tự động trên Google Drive của bạn. Bạn có muốn tiếp tục?'
    );
    if (!confirmed) return;

    try {
      const docName = `MinhChung_${currentStudent.studentId}_${Date.now()}.txt`;
      const docContent = `HỆ THỐNG NLU YOUTH 2026 - TÀI LIỆU MINH CHỨNG (${academicYear})\n\nSinh viên: ${currentStudent.fullName} (MSSV: ${currentStudent.studentId})\nLớp: ${currentStudent.classCode}\nKhoa: ${currentStudent.facultyCode}\nLoại minh chứng: ${proofType}\nTiêu đề: ${proofTitle || 'Minh chứng hoạt động'}\nNgày nộp: ${new Date().toLocaleString('vi-VN')}`;
      const createdFile = await createDriveFile(accessToken, docName, docContent);
      setDriveProofUrl(createdFile.webViewLink || '');
      showToast(`Đã tạo tệp minh chứng trên Google Drive: ${docName}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu tệp lên Google Drive', 'error');
    }
  };

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) return;
    if (!proofTitle.trim()) {
      alert('Vui lòng nhập tiêu đề minh chứng!');
      return;
    }
    if (!driveProofUrl.trim()) {
      alert('Vui lòng dán link tệp minh chứng trên Google Drive hoặc chọn tệp từ Drive.');
      return;
    }

    addSelfProof({
      studentId: currentStudent.studentId,
      type: proofType,
      catalogItemId: selectedCatalogItemId || undefined,
      title: proofTitle.trim(),
      description: proofDesc.trim(),
      scoreClaimed: Number(scoreClaimed) || 0,
      driveProofUrl: driveProofUrl.trim(),
    });

    setProofTitle('');
    setProofDesc('');
    setDriveProofUrl('');
    setSelectedCatalogItemId('');
    setIsSubmittingProof(false);
  };

  const getMembershipBadge = (type: string) => {
    switch (type) {
      case 'DOAN_VIEN':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            Đoàn viên TNCS HCM
          </span>
        );
      case 'HOI_VIEN':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800">
            Hội viên Hội SVVN
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            Sinh viên
          </span>
        );
    }
  };

  if (!currentStudent) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center space-y-5 shadow-xs transition-colors animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto shadow-xs">
          <GraduationCap className="w-8 h-8" />
        </div>
        
        <div className="space-y-2 max-w-lg mx-auto">
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
            Chưa Có Dữ Liệu Sinh Viên Trong Danh Mục
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Hiện tại hệ thống không tìm thấy hồ sơ sinh viên nào (toàn bộ dữ liệu đã được xóa hoặc chưa được khởi tạo). Bạn có thể thêm mới sinh viên, nhập tệp Excel hoặc khôi phục danh mục sinh viên mẫu của trường để tiếp tục thao tác.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {isOfficer && (
            <button
              type="button"
              onClick={() => setActiveTab('score-roster')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Users className="w-4 h-4" />
              Đi Đến Sổ Điểm & Danh Mục Sinh Viên
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('score-roster')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Users className="w-4 h-4 text-slate-500" />
            Tra Cứu Danh Mục Sinh Viên & Điểm Rèn Luyện
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Officer Student Selector Banner */}
      {isOfficer && (
        <div className="bg-emerald-950 text-white p-4 rounded-2xl shadow-lg border border-emerald-800 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center text-emerald-300 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-2 flex-wrap">
                Chế độ Cán bộ: Xem & Thẩm định Hồ Sơ Sinh Viên
                <span className="px-2 py-0.5 rounded-md bg-emerald-800 text-[10px] text-emerald-200 border border-emerald-700">
                  {user.currentRole.roleName}
                </span>
              </p>
              <p className="text-[11px] text-emerald-300 mt-0.5">
                Đang thẩm định hồ sơ: <strong className="text-white">{currentStudent.fullName}</strong> (MSSV: {currentStudent.studentId} • Lớp: {currentStudent.classCode})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <select
                value={currentStudent.studentId}
                onChange={e => setSelectedPortalStudentId(e.target.value)}
                className="px-3 py-2 bg-emerald-900 border border-emerald-700 text-white text-xs font-semibold rounded-xl focus:ring-2 focus:ring-emerald-400 focus:outline-hidden"
              >
                {students.map(std => (
                  <option key={std.studentId} value={std.studentId} className="bg-slate-900 text-white">
                    {std.studentId} - {std.fullName} ({std.classCode})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('score-roster')}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition"
            >
              ← Về Sổ Điểm / Danh Mục
            </button>
          </div>
        </div>
      )}



      {/* Student Profile & Live Score Overview */}
      {isInitialLoading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16" rounded="2xl" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" rounded="md" />
                <Skeleton className="h-4 w-72" rounded="sm" />
              </div>
            </div>
            <Skeleton className="w-48 h-20" rounded="2xl" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <SkeletonMetricCard variant="slate" hasBadge={false} />
            <SkeletonMetricCard variant="amber" hasBadge={false} />
            <SkeletonMetricCard variant="teal" hasBadge={false} />
            <SkeletonMetricCard variant="purple" hasBadge={false} />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-tr from-emerald-600 to-sky-600 flex items-center justify-center text-white text-xl font-black shadow-2xs shrink-0">
                {currentStudent.fullName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900">{currentStudent.fullName}</h2>
                  {getMembershipBadge(currentStudent.membershipType)}
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {currentStudent.academicYearNumber === 1
                      ? 'Khóa 52 (Năm 1)'
                      : currentStudent.academicYearNumber === 2
                      ? 'Khóa 51 (Năm 2)'
                      : currentStudent.academicYearNumber === 3
                      ? 'Khóa 50 (Năm 3)'
                      : currentStudent.academicYearNumber === 4
                      ? 'Khóa 49 (Năm 4)'
                      : `Khóa 48+ (Năm ${currentStudent.academicYearNumber}+)`}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  MSSV: <span className="font-mono font-bold text-slate-700">{currentStudent.studentId}</span> • Chi đoàn:{' '}
                  <span className="font-semibold text-slate-700">{currentStudent.classCode}</span> • Khoa:{' '}
                  <span className="font-semibold text-slate-700">{currentStudent.facultyCode}</span> • {academicYear}
                </p>
              </div>
            </div>

            {/* Big Score Badge - Compact */}
            <div className="flex flex-col sm:items-end gap-2">
              <div className="flex items-center gap-3 bg-gradient-to-br from-emerald-50/80 via-teal-50/50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200/90 dark:border-emerald-800 rounded-xl px-4 py-3 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-800 dark:text-emerald-300 block">
                      Tổng Điểm Rèn Luyện
                    </span>
                    {currentStudent.totalScore > 100 && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-xs flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-300 animate-spin-slow" />
                        <span>Vượt mốc +{currentStudent.totalScore - 100}đ</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-2 flex-wrap mt-1">
                    <span className="text-3xl font-black text-emerald-800 dark:text-emerald-300 font-mono">
                      <AnimatedCounter value={currentStudent.totalScore} />
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">điểm tích luỹ</span>
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1 ${
                        currentStudent.totalScore > 100
                          ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white font-black'
                          : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                      }`}
                      title={`Tỷ lệ hoàn thành so với mốc chuẩn 100đ: ${currentStudent.totalScore}%`}
                    >
                      ({currentStudent.totalScore}%)
                    </span>
                  </div>

                  {/* Flexible Progress Bar with Dynamic Color Shift */}
                  <div className="w-52 bg-slate-200/90 dark:bg-slate-700/90 h-2 rounded-full mt-2 overflow-hidden shadow-inner relative" title={`Tiến độ tích lũy: ${currentStudent.totalScore}%`}>
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        currentStudent.totalScore > 100
                          ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-500 animate-pulse-subtle shadow-xs'
                          : currentStudent.totalScore >= 90
                          ? 'bg-emerald-600'
                          : currentStudent.totalScore >= 80
                          ? 'bg-blue-600'
                          : currentStudent.totalScore >= 65
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(0, Math.round((currentStudent.totalScore / Math.max(100, currentStudent.totalScore)) * 100)))}%`
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-1.5">
                    <span className="inline-block text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      ★ {currentStudent.rankGrade}
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                      {currentStudent.totalScore > 100 ? `Đạt ${currentStudent.totalScore}% chỉ tiêu` : `${currentStudent.totalScore}/100đ chuẩn`}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={() => setShowAuditModal(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
                  title="Xem lịch sử ai đã chỉnh sửa điểm và thời gian thực hiện"
                >
                  <History className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Audit Log</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4 Score Breakdown Cards - Compact */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-100">
            {/* Activity Score */}
            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 mb-0.5">
                <span className="text-xs font-semibold">1. Điểm Hoạt động</span>
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-lg font-black text-slate-900">
                <AnimatedCounter value={currentStudent.activityScore} /> đ
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">{currentStudent.approvedActivitiesCount} hoạt động được tính</p>
            </div>

            {/* Bonus Score */}
            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 mb-0.5">
                <span className="text-xs font-semibold">2. Điểm Khen thưởng</span>
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className="text-lg font-black text-slate-900">
                <AnimatedCounter value={currentStudent.bonusScore} /> đ
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Khen thưởng Thành & Trường</p>
            </div>

            {/* Position Score */}
            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 mb-0.5">
                <span className="text-xs font-semibold">3. Điểm Chức vụ</span>
                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <p className="text-lg font-black text-slate-900">
                <AnimatedCounter value={currentStudent.positionScore} /> đ
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">BCH Chi đoàn / Đoàn Khoa</p>
            </div>

            {/* Research Score */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">4. Điểm NCKH</span>
                <GraduationCap className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-xl font-black text-slate-900">
                <AnimatedCounter value={currentStudent.researchScore} /> đ
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Giải thưởng & Đề tài NCKH</p>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Theo dõi chi tiết 5 Tiêu chuẩn "Sinh viên 5 tốt" (Quy tắc 100%) */}
      <div id="sv5t-standards-section" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-900 text-base">
                Theo Dõi Chi Tiết Tiến Độ Danh Hiệu "Sinh Viên 5 Tốt"
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Quy tắc hệ thống: Sinh viên phải đạt đủ <span className="font-bold text-rose-600">100% yêu cầu của tất cả các tiêu chí thành phần</span> thuộc cả 5 tiêu chuẩn thì mới được công nhận đạt danh hiệu.
            </p>
          </div>

          <div className="text-right shrink-0">
            {sv5tStats.isEligible ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-extrabold shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ĐẠT DANH HIỆU SINH VIÊN 5 TỐT (100%)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-300 rounded-xl text-xs font-extrabold shadow-2xs">
                <Clock className="w-4 h-4 text-amber-600" />
                CHƯA ĐỦ ĐIỀU KIỆN ({sv5tStats.totalAchieved}/{sv5tStats.totalRequired} tiêu chí - {sv5tStats.percent}%)
              </span>
            )}
          </div>
        </div>

        {/* 5 Standards breakdown cards with all sub-criteria */}
        <div className="space-y-4 pt-2">
          {SV5T_STANDARDS.map(std => {
            const criteriaList = std.criteria;
            const achievedCount = criteriaList.filter(
              c => currentStudent.sv5tCriteriaAchieved?.[c.id]
            ).length;
            const isStandardComplete = achievedCount === criteriaList.length;

            return (
              <div
                key={std.id}
                className={`rounded-xl border p-4 transition ${
                  isStandardComplete
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isStandardComplete
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isStandardComplete ? '✓' : '!'}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">{std.name}</h4>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      isStandardComplete
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Đạt {achievedCount} / {criteriaList.length} tiêu chí
                  </span>
                </div>

                {/* Sub-criteria list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {criteriaList.map(criterion => {
                    const isAchieved = !!currentStudent.sv5tCriteriaAchieved?.[criterion.id];
                    return (
                      <div
                        key={criterion.id}
                        className={`flex items-start justify-between gap-3 p-2.5 rounded-lg border text-xs transition ${
                          isAchieved
                            ? 'bg-white border-emerald-200 shadow-2xs'
                            : 'bg-white border-slate-200 opacity-90'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            onClick={() => toggleSv5tCriterion(currentStudent.studentId, criterion.id)}
                            title="Bấm để đánh dấu / kiểm tra tiêu chí"
                            className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center shrink-0 transition ${
                              isAchieved
                                ? 'bg-emerald-600 text-white'
                                : 'border border-slate-300 hover:border-emerald-500'
                            }`}
                          >
                            {isAchieved && <Check className="w-3.5 h-3.5" />}
                          </button>
                          <div>
                            <span className="font-bold text-slate-800 block">
                              [{criterion.code}] {criterion.title}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {isAchieved ? '✓ Đã hoàn thành' : 'Chưa hoàn thành'}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm shrink-0 ${
                            isAchieved
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {isAchieved ? 'Đạt' : 'Chưa'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Khai báo minh chứng cá nhân (Khen thưởng, Chức vụ, NCKH) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              Khai Báo & Đăng Ký Minh Chứng Điểm (Khen thưởng, Chức vụ, NCKH)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sinh viên tự khai báo hồ sơ minh chứng từ Google Drive để Chi đoàn & Đoàn Khoa thẩm định tính điểm
            </p>
          </div>

          <button
            onClick={() => setIsSubmittingProof(!isSubmittingProof)}
            className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            {isSubmittingProof ? 'Đóng Biểu Mẫu' : 'Khai Báo Minh Chứng Mới'}
          </button>
        </div>

        {/* Self-Proof Submission Form */}
        {isSubmittingProof && (
          <form onSubmit={handleSubmitProof} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Biểu Mẫu Tự Kê Khai Minh Chứng
            </h4>

            {/* Ràng Buộc Quy Chế NLU Banner */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
              <div className="flex items-center gap-1.5 font-extrabold text-emerald-900">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Ràng Buộc Quy Chế Đoàn - Hội NLU:</span>
              </div>
              <p className="leading-relaxed">
                Sinh viên được nộp <strong>nhiều minh chứng</strong> (nhiều giải thưởng, nhiều chức vụ, nhiều đề tài NCKH...).
                Hệ thống lưu giữ đầy đủ hồ sơ, nhưng <strong>CHỈ TÍNH 01 MỨC ĐIỂM CAO NHẤT</strong> trong từng nhóm khi cộng vào Điểm Rèn Luyện chính thức.
              </p>
              <div className="pt-1 flex items-center gap-2 flex-wrap font-semibold text-emerald-800 text-[11px]">
                <span className="bg-emerald-100/80 px-2 py-0.5 rounded-md">
                  Đã nộp: <strong>{studentProofs.filter(p => p.type === proofType).length}</strong> minh chứng
                </span>
                <span className="bg-emerald-100/80 px-2 py-0.5 rounded-md">
                  Đã duyệt: <strong>{approvedInSelectedCategory.length}</strong>
                </span>
                <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md font-bold">
                  Điểm cao nhất hiện tại: <strong>{currentCategoryMaxScore} đ</strong>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nhóm danh mục minh chứng <span className="text-rose-500">*</span>
                </label>
                <select
                  value={proofType}
                  onChange={e => {
                    const newType = e.target.value as any;
                    setProofType(newType);
                    setSelectedCatalogItemId('');
                    setProofTitle('');
                    setProofDesc('');
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-semibold"
                >
                  <option value="KHEN_THUONG">1. Khen thưởng hằng năm (Thành, Trường, Khoa...)</option>
                  <option value="NCKH">2. Nghiên cứu khoa học & Sáng tạo (Euréka, Đề tài, Bài báo...)</option>
                  <option value="CHUC_VU">3. Chức vụ Cán bộ Đoàn - Hội & Lớp (Bí thư, Lớp trưởng, BCH...)</option>
                  <option value="DANG_VIEN_HUONG_DAN">4. Đảng viên hướng dẫn & Đoàn viên ưu tú</option>
                  <option value="KHAC">5. Hoạt động khác / Tự nhập</option>
                </select>
              </div>

              {/* Hạng mục chuẩn Cấp 4 Dropdown */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Hạng mục quy chuẩn Cấp 4 (Khuyến nghị chọn theo danh mục chuẩn)
                </label>
                <select
                  value={selectedCatalogItemId}
                  onChange={e => {
                    const catId = e.target.value;
                    setSelectedCatalogItemId(catId);
                    if (catId) {
                      const item = activeCatalogItems.find(it => it.id === catId);
                      if (item) {
                        setProofTitle(item.title);
                        setScoreClaimed(item.points);
                        setProofDesc(item.description || item.maxCapNote || '');
                      }
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                >
                  <option value="">-- Chọn từ danh mục quy chuẩn Cấp 4 ({activeCatalogItems.length} mục) --</option>
                  {activeCatalogItems.map(it => (
                    <option key={it.id} value={it.id}>
                      +{it.points}đ | [{it.level || 'Chuẩn'}] {it.title}
                    </option>
                  ))}
                  <option value="">✏️ Tự nhập hạng mục khác ngoài danh mục</option>
                </select>
              </div>
            </div>

            {/* Tiêu đề & Điểm */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Tiêu đề minh chứng / Quyết định công nhận <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={proofTitle}
                  onChange={e => setProofTitle(e.target.value)}
                  placeholder="Vd: Giấy khen Cán bộ Đoàn xuất sắc cấp Thành 2026..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Điểm đề xuất (+ĐRL)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={scoreClaimed}
                  onChange={e => setScoreClaimed(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-black text-emerald-700"
                />
              </div>
            </div>

            {/* Thông báo nếu điểm đề xuất <= điểm đã có */}
            {currentCategoryMaxScore > 0 && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Bạn đã có minh chứng được duyệt đạt <strong>{currentCategoryMaxScore} đ</strong> trong nhóm này.
                  Minh chứng mới vẫn được tiếp nhận đầy đủ vào sổ lưu trữ, và điểm ĐRL sẽ cập nhật mức cao nhất nếu minh chứng này có số điểm lớn hơn ({scoreClaimed}đ).
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Mô tả chi tiết nội dung / Số quyết định / Cơ quan ban hành
              </label>
              <input
                type="text"
                value={proofDesc}
                onChange={e => setProofDesc(e.target.value)}
                placeholder="Số QĐ 123/QĐ-ĐTN, ngày ban hành 26/03/2026, cơ quan ban hành..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            {/* Google Drive Link for Proof */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-800">
                  Link Tệp Minh Chứng (Google Drive) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenDrivePicker}
                    className="text-xs text-sky-700 hover:text-sky-800 font-semibold inline-flex items-center gap-1"
                  >
                    <HardDrive className="w-3.5 h-3.5 text-sky-600" />
                    Chọn từ Google Drive
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleCreateSampleProofOnDrive}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Lưu minh chứng lên Drive
                  </button>
                </div>
              </div>
              <input
                type="url"
                required
                value={driveProofUrl}
                onChange={e => setDriveProofUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
              />

              {/* Inline Drive Picker dropdown */}
              {showDrivePicker && (
                <div className="mt-2 p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-sky-600" />
                      Tệp Google Drive của bạn
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowDrivePicker(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  </div>

                  {loadingDrive ? (
                    <p className="text-xs text-slate-500 py-1">Đang duyệt Google Drive...</p>
                  ) : driveFiles.length === 0 ? (
                    <p className="text-xs text-slate-500 py-1">Chưa có tệp nào trên Google Drive.</p>
                  ) : (
                    <div className="max-h-32 overflow-y-auto divide-y divide-slate-100 text-xs">
                      {driveFiles.map(file => (
                        <div
                          key={file.id}
                          onClick={() => {
                            setDriveProofUrl(file.webViewLink || '');
                            setShowDrivePicker(false);
                          }}
                          className="py-1.5 px-2 hover:bg-emerald-50 rounded-md cursor-pointer flex items-center justify-between"
                        >
                          <span className="truncate max-w-sm font-medium">{file.name}</span>
                          <span className="text-[10px] text-slate-400">{file.modifiedTime}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSubmittingProof(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-sm"
              >
                Gửi Minh Chứng Thẩm Định
              </button>
            </div>
          </form>
        )}

        {/* Thanh công cụ lọc dữ liệu đa chiều cho Sinh viên */}
        <DataFilterToolbar
          title="Lọc Hoạt Động & Minh Chứng Cá Nhân"
          academicYear={academicYearFilter}
          onAcademicYearChange={setAcademicYearFilter}
          semester={semesterFilter}
          onSemesterChange={setSemesterFilter}
          activityType={activityTypeFilter}
          onActivityTypeChange={setActivityTypeFilter}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Tìm theo tên hoạt động, minh chứng, đơn vị tổ chức..."
          totalCount={studentProofs.length + activities.filter(a => a.participants?.some(p => p.studentId === currentStudent.studentId)).length}
          filteredCount={viewTab === 'activities' ? filteredStudentActivities.length : filteredStudentProofs.length}
          itemName={viewTab === 'activities' ? 'hoạt động' : 'minh chứng'}
        >
          {/* Subtab Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-end flex-wrap">
            <button
              type="button"
              onClick={() => setViewTab('activities')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewTab === 'activities'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              Hoạt Động Tham Gia ({filteredStudentActivities.length})
            </button>
            <button
              type="button"
              onClick={() => setViewTab('proofs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewTab === 'proofs'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 text-blue-600" />
              Minh Chứng Tự Khai ({filteredStudentProofs.length})
            </button>
            <button
              type="button"
              onClick={() => setViewTab('notifications')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewTab === 'notifications'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-amber-300" />
              Thông Báo Đẩy ({studentPushNotifs.length})
              {unreadStudentPushCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black">
                  {unreadStudentPushCount} mới
                </span>
              )}
            </button>
          </div>
        </DataFilterToolbar>

        {/* Tab 1: Hoạt Động Đoàn - Hội Đã Tham Gia */}
        {viewTab === 'activities' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                Danh Sách Hoạt Động Đoàn - Hội Sinh Viên Đã Tham Gia ({filteredStudentActivities.length})
              </h4>
            </div>

            <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-xs">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Mã & Cấp</th>
                    <th className="px-4 py-2.5">Tên Chương Trình & Thời Gian</th>
                    <th className="px-4 py-2.5">Học Kỳ & Năm</th>
                    <th className="px-4 py-2.5">Loại Hình</th>
                    <th className="px-4 py-2.5">Đơn Vị Tổ Chức</th>
                    <th className="px-4 py-2.5">Vai Trò & Điểm ĐRL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredStudentActivities.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400">
                        Không tìm thấy hoạt động nào phù hợp với bộ lọc (Học kỳ / Năm học / Loại hình Đoàn - Hội).
                      </td>
                    </tr>
                  ) : (
                    filteredStudentActivities.map(act => {
                      const participantInfo = act.participants.find(p => p.studentId === currentStudent.studentId);
                      const actSemester = getActivitySemester(act);
                      const semBadge = getSemesterBadge(actSemester);
                      const actType = getActivityType(act);
                      const typeBadge = getActivityTypeBadge(actType);

                      return (
                        <tr key={act.id} className="hover:bg-slate-50/70 transition">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`font-mono text-xs font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                                act.id.startsWith('A')
                                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                                  : 'bg-blue-50 text-blue-900 border-blue-200'
                              }`}
                            >
                              {act.id}
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              Cấp {act.programLevel} ({act.totalLevelScore}đ)
                            </span>
                          </td>

                          <td className="px-4 py-3 max-w-xs">
                            <span className="font-bold text-slate-900 block truncate" title={act.title}>
                              {act.title}
                            </span>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3" />
                              {act.startDate} {act.endDate && act.endDate !== act.startDate ? `→ ${act.endDate}` : ''}
                            </span>
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${semBadge.bgClass} ${semBadge.textClass} ${semBadge.borderClass}`}
                            >
                              {semBadge.label}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              {act.planYear || '2026-2027'}
                            </span>
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${typeBadge.bgClass} ${typeBadge.textClass} ${typeBadge.borderClass}`}
                            >
                              {typeBadge.label}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-medium text-slate-800 block truncate max-w-[140px]">
                              {act.orgName}
                            </span>
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-bold text-emerald-700 text-xs block">
                              +{participantInfo?.pointsAwarded ?? 0} đ ĐRL
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {participantInfo?.role || 'Tham gia'}
                            </span>
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

        {/* Tab 2: Lịch Sử Minh Chứng Đã Gửi */}
        {viewTab === 'proofs' && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-blue-600" />
              Lịch Sử Minh Chứng Đã Gửi ({filteredStudentProofs.length})
            </h4>

            <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-xs">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Phân Loại</th>
                    <th className="px-4 py-2.5">Nội Dung & Mô Tả</th>
                    <th className="px-4 py-2.5">Điểm Đề Xuất</th>
                    <th className="px-4 py-2.5">Tệp Minh Chứng</th>
                    <th className="px-4 py-2.5">Trạng Thái</th>
                    <th className="px-4 py-2.5">Ghi Chú Phản Hồi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudentProofs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400">
                        Chưa có hồ sơ minh chứng nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredStudentProofs.map(proof => (
                      <tr key={proof.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-800 block">
                            {proof.type === 'KHEN_THUONG'
                              ? 'Khen Thưởng'
                              : proof.type === 'CHUC_VU'
                              ? 'Chức Vụ'
                              : proof.type === 'NCKH'
                              ? 'Nghiên Cứu KH'
                              : proof.type === 'DANG_VIEN_HUONG_DAN'
                              ? 'Đảng Viên HD'
                              : 'Hoạt Động Khác'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{proof.submissionDate}</span>
                        </td>

                        <td className="px-4 py-3 max-w-xs">
                          <span className="font-bold text-slate-900 block truncate">{proof.title}</span>
                          <span className="text-[11px] text-slate-500 block truncate">{proof.description}</span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="font-black text-emerald-700 text-sm">+{proof.scoreClaimed} đ</span>
                          {proof.status === 'Approved' && (
                            <div className="mt-1">
                              {highestApprovedProofMap.get(proof.type) === proof.id ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  ⭐ Đang tính điểm (+{proof.approvedScore ?? proof.scoreClaimed}đ)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                                  ✅ Đã duyệt (Lưu hồ sơ)
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <a
                            href={proof.driveProofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-sky-700 hover:text-sky-800 hover:underline font-semibold"
                          >
                            <HardDrive className="w-3.5 h-3.5 text-sky-600" /> Xem Drive
                          </a>
                        </td>

                        <td className="px-4 py-3">
                          {proof.status === 'Approved' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Hợp lệ (+ĐRL)
                            </span>
                          ) : proof.status === 'Pending' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" /> Đang thẩm định
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-600" /> Từ chối
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-[11px] text-slate-500 max-w-xs truncate">
                          {proof.reviewNotes || 'Chờ thẩm định từ BCH'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Trung Tâm Thông Báo Đẩy NLU (Push Notifications) */}
        {viewTab === 'notifications' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header Controls Bar */}
            <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-emerald-800/60">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm flex items-center gap-2 flex-wrap">
                      Hệ Thống Thông Báo Đẩy (Push Notifications) Sinh Viên NLU
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px] font-mono border border-emerald-400/30">
                        REAL-TIME PUSH
                      </span>
                    </h4>
                    <p className="text-xs text-emerald-200 mt-0.5">
                      Nhận thông báo tức thời trên thiết bị khi kế hoạch hoạt động được duyệt & điểm rèn luyện được cập nhật
                    </p>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {webPushStatus === 'granted' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 rounded-xl text-xs font-bold">
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      Web Push: Đã Kích Hoạt
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await requestNotificationPermission();
                        setWebPushStatus(res);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-sm transition"
                    >
                      <Zap className="w-3.5 h-3.5 text-slate-950 animate-bounce" />
                      Bật Thông Báo Trình Duyệt
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      sendStudentPushNotification(currentStudent.studentId, {
                        type: 'activity_approved',
                        title: '🎉 [Test] Hoạt Động Được Duyệt',
                        message: `Hoạt động "Chiến dịch Tình nguyện Tiếp Sức Mùa Thi NLU 2026" vừa được phê duyệt! Điểm dự kiến: +8đ.`,
                        activityId: 'A001',
                        activityTitle: 'Tiếp Sức Mùa Thi NLU 2026',
                        scoreDiff: 8,
                        linkTab: 'student-portal'
                      });
                    }}
                    title="Mô phỏng nhận thông báo đẩy khi hoạt động được duyệt"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition border border-white/20"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                    Thử Push Duyệt HĐ
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sendStudentPushNotification(currentStudent.studentId, {
                        type: 'score_updated',
                        title: '📈 [Test] Điểm Rèn Luyện Cập Nhật',
                        message: `Điểm rèn luyện của sinh viên ${currentStudent.fullName} vừa được cập nhật: Tổng ${currentStudent.totalScore} điểm (+5đ điểm thưởng) • Xếp loại: ${currentStudent.rankGrade}.`,
                        scoreDiff: 5,
                        linkTab: 'student-portal'
                      });
                    }}
                    title="Mô phỏng nhận thông báo đẩy khi điểm ĐRL được cập nhật"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition border border-white/20"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                    Thử Push Cập Nhật Điểm
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Pills & Bulk Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'ALL', label: `Tất cả (${studentPushNotifs.length})` },
                  { id: 'activity_approved', label: 'Hoạt động được duyệt' },
                  { id: 'score_updated', label: 'Cập nhật Điểm ĐRL' },
                  { id: 'proof_approved', label: 'Minh chứng được duyệt' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPushFilterType(tab.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                      pushFilterType === tab.id
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {studentPushNotifs.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        markAllPushNotificationsAsRead(currentStudent.studentId);
                        showToast('Đã đánh dấu tất cả thông báo đẩy là đã đọc', 'info');
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                    >
                      Đọc tất cả
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        clearPushNotifications(currentStudent.studentId);
                        showToast('Đã xóa danh sách thông báo đẩy của sinh viên', 'info');
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Xóa tất cả
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Notifications Feed */}
            {(() => {
              const filteredPushList = studentPushNotifs.filter(item => {
                if (pushFilterType === 'ALL') return true;
                return item.type === pushFilterType;
              });

              if (filteredPushList.length === 0) {
                return (
                  <div className="py-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
                    <Radio className="w-10 h-10 text-emerald-500 mx-auto opacity-50" />
                    <p className="text-sm font-bold text-slate-700">Chưa có thông báo đẩy nào</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Khi có hoạt động được phê duyệt hoặc điểm rèn luyện thay đổi, hệ thống sẽ phát tín hiệu âm thanh và gửi thông báo đẩy trực tiếp vào đây.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-2.5">
                  {filteredPushList.map(item => (
                    <div
                      key={item.id}
                      onClick={() => markPushNotificationAsRead(item.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        item.isRead
                          ? 'bg-white border-slate-200 hover:border-slate-300'
                          : 'bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-white border-emerald-300 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs ${
                          item.type === 'activity_approved'
                            ? 'bg-gradient-to-tr from-emerald-600 to-teal-600'
                            : item.type === 'score_updated'
                            ? 'bg-gradient-to-tr from-indigo-600 to-blue-600'
                            : 'bg-gradient-to-tr from-sky-600 to-cyan-600'
                        }`}>
                          {item.type === 'activity_approved' ? (
                            <Calendar className="w-5 h-5" />
                          ) : item.type === 'score_updated' ? (
                            <Award className="w-5 h-5" />
                          ) : (
                            <FileCheck className="w-5 h-5" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                item.type === 'activity_approved'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : item.type === 'score_updated'
                                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                                  : 'bg-blue-100 text-blue-800 border border-blue-300'
                              }`}>
                                {item.type === 'activity_approved'
                                  ? 'Hoạt Động Phê Duyệt'
                                  : item.type === 'score_updated'
                                  ? 'Cập Nhật Điểm ĐRL'
                                  : 'Minh Chứng Duyệt'}
                              </span>

                              {item.scoreDiff !== undefined && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono ${
                                  item.scoreDiff >= 0
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                                }`}>
                                  {item.scoreDiff >= 0 ? `+${item.scoreDiff} điểm` : `${item.scoreDiff} điểm`}
                                </span>
                              )}
                            </div>

                            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.createdAt}
                            </span>
                          </div>

                          <h5 className={`text-sm ${item.isRead ? 'font-bold text-slate-800' : 'font-extrabold text-slate-950'}`}>
                            {item.title}
                          </h5>

                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {item.message}
                          </p>

                          {/* Action footer */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              {item.activityId && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewTab('activities');
                                  }}
                                  className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
                                >
                                  Xem danh sách hoạt động →
                                </button>
                              )}
                              {item.type === 'score_updated' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowAuditModal(true);
                                  }}
                                  className="text-indigo-700 font-bold hover:underline inline-flex items-center gap-1"
                                >
                                  Xem vết kiểm toán điểm →
                                </button>
                              )}
                            </div>

                            <span className="text-[11px] text-slate-400">
                              Sinh viên: <strong className="text-slate-600">{item.studentName || currentStudent.fullName}</strong>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Modal: Lịch Sử Thay Đổi & Kiểm Toán Điểm */}
      <ScoreAuditLogModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        initialStudentId={currentStudent.studentId}
      />
    </div>
  );
};
