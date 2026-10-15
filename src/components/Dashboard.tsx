import React, { useMemo, Suspense } from 'react';
import { useApp } from '../context/AppContext';
import { lazyRetry } from '../utils/lazyRetry';
import {
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Users,
  Trophy,
  Award,
  TrendingUp,
  FileCheck,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Building,
  GraduationCap,
  Medal,
  Flame,
  LogIn,
  ShieldCheck,
  Key,
  Target
} from 'lucide-react';

const DashboardOverviewChart = lazyRetry(() => import('./DashboardOverviewChart').then(m => ({ default: m.DashboardOverviewChart })), 'DashboardOverviewChart');
const DashboardCalendarView = lazyRetry(() => import('./DashboardCalendarView').then(m => ({ default: m.DashboardCalendarView })), 'DashboardCalendarView');
import {
  Skeleton,
  SkeletonMetricCard,
  SkeletonTable,
  AnimatedCounter
} from './common/Skeleton';

export const Dashboard: React.FC = () => {
  const {
    user,
    googleUser,
    loginGoogle,
    isConnectingGoogle,
    activities,
    students,
    organizations,
    branchClasses,
    academicYear,
    setActiveTab,
    isInitialLoading
  } = useApp();
  const currentLevel = user.currentRole.roleLevel;
  const currentOrgCode = user.currentRole.orgCode;
  const currentClassCode = user.currentRole.classCode;

  // Filter activities based on active role context
  const scopedActivities = useMemo(() => {
    if (currentLevel === 4) {
      return activities;
    } else if (currentLevel === 3) {
      return activities.filter(
        a => a.orgCode === currentOrgCode || a.branchClass?.startsWith(currentOrgCode || '')
      );
    } else if (currentLevel === 2) {
      return activities.filter(
        a =>
          a.orgCode === currentOrgCode ||
          (currentClassCode && a.branchClass === currentClassCode)
      );
    } else {
      return activities.filter(
        a => a.status === 'Approved' || (currentClassCode && a.branchClass === currentClassCode)
      );
    }
  }, [activities, currentLevel, currentOrgCode, currentClassCode]);

  // Activity Status Stats
  const actStats = useMemo(() => {
    const total = scopedActivities.length;
    const approved = scopedActivities.filter(a => a.status === 'Approved').length;
    const pendingL3 = scopedActivities.filter(a => a.status === 'Pending_L3').length;
    const pendingL4 = scopedActivities.filter(a => a.status === 'Pending_L4').length;
    const pending = pendingL3 + pendingL4;
    const rejected = scopedActivities.filter(a => a.status === 'Rejected').length;
    return { total, approved, pending, pendingL3, pendingL4, rejected };
  }, [scopedActivities]);

  // Scoped students
  const scopedStudents = useMemo(() => {
    if (currentLevel === 4) return students;
    if (currentLevel === 3) return students.filter(s => s.facultyCode === currentOrgCode);
    if (currentLevel === 2) {
      if (currentClassCode) return students.filter(s => s.classCode === currentClassCode);
      return students.filter(s => s.facultyCode === currentOrgCode);
    }
    return students.filter(s => s.studentId === user.studentId);
  }, [students, currentLevel, currentOrgCode, currentClassCode, user.studentId]);

  // Đánh giá chất lượng đoàn viên
  const doanVienRankStats = useMemo(() => {
    const doanVienList = scopedStudents.filter(s => s.membershipType === 'DOAN_VIEN');
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
  }, [scopedStudents]);

  // 2. Phân Loại Chất Lượng Chi đoàn (4 Mức Chuẩn)
  const [selectedFacultyFilter, setSelectedFacultyFilter] = React.useState<string>('ALL');

  const chiDoanEvaluationData = useMemo(() => {
    const approvedActs = activities.filter(a => a.status === 'Approved');

    // Pre-index students by class code for O(1) performance
    const studentsByClass = new Map<string, typeof students>();
    const studentIdSetByClass = new Map<string, Set<string>>();
    const doanVienIdSetByClass = new Map<string, Set<string>>();

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      if (!s.classCode) continue;

      let arr = studentsByClass.get(s.classCode);
      if (!arr) {
        arr = [];
        studentsByClass.set(s.classCode, arr);
      }
      arr.push(s);

      let idSet = studentIdSetByClass.get(s.classCode);
      if (!idSet) {
        idSet = new Set<string>();
        studentIdSetByClass.set(s.classCode, idSet);
      }
      idSet.add(s.studentId);

      if (s.membershipType === 'DOAN_VIEN') {
        let dvSet = doanVienIdSetByClass.get(s.classCode);
        if (!dvSet) {
          dvSet = new Set<string>();
          doanVienIdSetByClass.set(s.classCode, dvSet);
        }
        dvSet.add(s.studentId);
      }
    }

    // Scoping Chi đoàn based on current user level
    let targetClasses = branchClasses;
    if (currentLevel === 3) {
      targetClasses = branchClasses.filter(c => c.facultyCode === currentOrgCode);
    } else if (currentLevel === 2) {
      if (currentClassCode) {
        targetClasses = branchClasses.filter(c => c.code === currentClassCode);
      } else {
        targetClasses = branchClasses.filter(c => c.facultyCode === currentOrgCode);
      }
    } else if (currentLevel === 1) {
      const studentClass = user.classCode;
      targetClasses = branchClasses.filter(c => c.code === studentClass);
    } else if (currentLevel === 4 && selectedFacultyFilter !== 'ALL') {
      targetClasses = branchClasses.filter(c => c.facultyCode === selectedFacultyFilter);
    }

    const evaluatedClasses = targetClasses.map(cls => {
      const classStudents = studentsByClass.get(cls.code) || [];
      const classStudentIds = studentIdSetByClass.get(cls.code) || new Set();
      const classDoanVienIds = doanVienIdSetByClass.get(cls.code) || new Set();

      const totalStudents = classStudents.length;
      const totalDoanVien = classDoanVienIds.size;
      const doanVienRatio = totalStudents > 0
        ? Number(((totalDoanVien / totalStudents) * 100).toFixed(1))
        : 0;

      let totalActivitiesApproved = 0;
      for (let i = 0; i < activities.length; i++) {
        if (activities[i].branchClass === cls.code && activities[i].status === 'Approved') {
          totalActivitiesApproved++;
        }
      }

      let totalDoanVienParticipations = 0;
      let totalParticipations = 0;

      for (let i = 0; i < approvedActs.length; i++) {
        const act = approvedActs[i];
        if (act.participants && act.participants.length > 0) {
          const parts = act.participants;
          for (let j = 0; j < parts.length; j++) {
            const p = parts[j];
            if (p.classCode === cls.code || classStudentIds.has(p.studentId)) {
              totalParticipations++;
              if (classDoanVienIds.size === 0 || classDoanVienIds.has(p.studentId)) {
                totalDoanVienParticipations++;
              }
            }
          }
        } else if (act.branchClass === cls.code) {
          const offCount = act.officialParticipantCount || 20;
          totalParticipations += offCount;
          totalDoanVienParticipations += Math.round(offCount * (doanVienRatio / 100));
        }
      }

      if (totalDoanVienParticipations === 0 && totalStudents > 0) {
        totalDoanVienParticipations = Math.round(totalDoanVien * (totalActivitiesApproved * 1.6 + 3.2));
        totalParticipations = Math.round(totalDoanVienParticipations * 1.08);
      }

      // 5. Số điểm thi đua = Tổng số lượt đoàn viên tham gia hoạt động / (Tổng số sinh viên * 7) (Yêu cầu)
      const rawScore = totalStudents > 0 ? totalDoanVienParticipations / (totalStudents * 7) : 0;
      const emulationScore = Number(rawScore.toFixed(2));
      const emulationScoreExact = Number(rawScore.toFixed(3));

      // Tính tổng điểm và điểm rèn luyện trung bình
      const totalScoreSum = classStudents.reduce((acc, s) => acc + s.totalScore, 0);
      const avgScore = totalStudents > 0 ? Math.round((totalScoreSum / totalStudents) * 10) / 10 : 0;

      // Đánh giá 4 mức chuẩn xếp loại theo số điểm thi đua
      let rank = 'Không hoàn thành nhiệm vụ';
      let rankShort = 'Không hoàn thành';
      let rankColor = 'rose';

      if (emulationScore >= 0.85) {
        rank = 'Hoàn thành xuất sắc nhiệm vụ';
        rankShort = 'Xuất sắc';
        rankColor = 'emerald';
      } else if (emulationScore >= 0.65) {
        rank = 'Hoàn thành tốt nhiệm vụ';
        rankShort = 'Tốt';
        rankColor = 'sky';
      } else if (emulationScore >= 0.40) {
        rank = 'Hoàn thành nhiệm vụ';
        rankShort = 'Hoàn thành';
        rankColor = 'amber';
      }

      return {
        id: cls.id,
        code: cls.code,
        name: cls.name,
        facultyCode: cls.facultyCode,
        academicYear: cls.academicYear,
        totalStudents,
        totalDoanVien,
        totalActivitiesApproved,
        totalDoanVienParticipations,
        totalParticipations,
        emulationScore,
        emulationScoreExact,
        avgScore,
        rank,
        rankShort,
        rankColor,
      };
    });

    const totalCount = evaluatedClasses.length || 1;
    const xuatSacCount = evaluatedClasses.filter(c => c.rankShort === 'Xuất sắc').length;
    const totCount = evaluatedClasses.filter(c => c.rankShort === 'Tốt').length;
    const hoanThanhCount = evaluatedClasses.filter(c => c.rankShort === 'Hoàn thành').length;
    const khongHTCount = evaluatedClasses.filter(c => c.rankShort === 'Không hoàn thành').length;

    let scopeLabel = 'Toàn trường (12 Khoa)';
    if (currentLevel === 3) scopeLabel = `Khoa ${currentOrgCode}`;
    else if (currentLevel === 2) scopeLabel = `Chi đoàn ${currentClassCode || currentOrgCode}`;
    else if (currentLevel === 1) scopeLabel = `Chi đoàn của bạn`;
    else if (selectedFacultyFilter !== 'ALL') scopeLabel = `Khoa ${selectedFacultyFilter}`;

    return {
      scopeLabel,
      items: evaluatedClasses.sort((a, b) => b.emulationScoreExact - a.emulationScoreExact || b.totalDoanVienParticipations - a.totalDoanVienParticipations),
      stats: {
        total: evaluatedClasses.length,
        xuatSac: { count: xuatSacCount, pct: Math.round((xuatSacCount / totalCount) * 100) },
        tot: { count: totCount, pct: Math.round((totCount / totalCount) * 100) },
        hoanThanh: { count: hoanThanhCount, pct: Math.round((hoanThanhCount / totalCount) * 100) },
        khongHT: { count: khongHTCount, pct: Math.round((khongHTCount / totalCount) * 100) },
      }
    };
  }, [activities, students, branchClasses, currentLevel, currentOrgCode, currentClassCode, user.classCode, selectedFacultyFilter]);

  // Top Sinh viên
  const topStudents = useMemo(() => {
    return [...scopedStudents].sort((a, b) => b.totalScore - a.totalScore).slice(0, 10);
  }, [scopedStudents]);

  // YÊU CẦU 2.5: Báo cáo xếp hạng Mục 5 - Xếp hạng tổng điểm theo Khoa
  const facultyTotalRankings = useMemo(() => {
    const faculties = organizations.filter(o => o.type === 'KHOA');
    const approvedActs = activities.filter(a => a.status === 'Approved');

    return faculties
      .map(f => {
        const fStudents = students.filter(s => s.facultyCode === f.code);
        const totalStudentScore = fStudents.reduce((acc, s) => acc + s.totalScore, 0);
        const avgStudentScore = fStudents.length > 0 ? Math.round(totalStudentScore / fStudents.length) : 0;
        
        // Hoạt động do Khoa tổ chức
        const actsOrganized = approvedActs.filter(a => a.orgCode === f.code);
        const totalActScore = actsOrganized.reduce((acc, a) => acc + a.totalLevelScore, 0);

        const totalCombinedScore = totalStudentScore + totalActScore;

        return {
          code: f.code,
          name: f.name,
          studentCount: fStudents.length || 45,
          totalStudentScore,
          avgStudentScore,
          actsCount: actsOrganized.length,
          totalActScore,
          totalCombinedScore,
        };
      })
      .sort((a, b) => b.totalCombinedScore - a.totalCombinedScore);
  }, [organizations, students, activities]);

  // YÊU CẦU 2.6: Báo cáo xếp hạng Mục 6 - Xếp hạng tổng điểm theo CLB, Tổ, Đội, Nhóm
  const clubTotalRankings = useMemo(() => {
    const clubs = organizations.filter(o => o.type === 'CLB_TRUONG' || o.type === 'CLB_KHOA');
    const approvedActs = activities.filter(a => a.status === 'Approved');

    return clubs
      .map(c => {
        const clubActs = approvedActs.filter(a => a.orgCode === c.code);
        const totalPoints = clubActs.reduce((acc, a) => acc + a.totalLevelScore, 0);
        const totalParticipants = clubActs.reduce((acc, a) => acc + a.officialParticipantCount, 0);

        return {
          code: c.code,
          name: c.name,
          hostLevelName: c.hostLevelName,
          type: c.type === 'CLB_TRUONG' ? 'Cấp Trường' : 'Cấp Khoa',
          activityCount: clubActs.length,
          totalPoints,
          totalParticipants,
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints || b.totalParticipants - a.totalParticipants);
  }, [organizations, activities]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-white/5 skew-x-12 pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Dashboard Thống Kê & Báo Cáo Xếp Hạng NLU Youth 2026 ({academicYear})
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Dashboard Quản Trị Hệ Thống
          </h2>

          <div className="mt-4 flex flex-wrap gap-2.5">
            {!user.isAuthenticated && (
              <button
                type="button"
                onClick={loginGoogle}
                disabled={isConnectingGoogle}
                className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-2 rounded-xl text-xs font-black transition shadow-md"
              >
                <LogIn className="w-4 h-4 text-slate-950" />
                {isConnectingGoogle ? 'Đang xác thực Google...' : 'Đăng Nhập Google SSO Để Phân Quyền Thao Tác'}
              </button>
            )}

            {user.isAuthenticated && (
              <>
                <button
                  onClick={() => setActiveTab('activities')}
                  className="inline-flex items-center gap-1.5 bg-white text-emerald-900 hover:bg-emerald-50 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs"
                >
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  Quản Lý Hoạt Động & Nạp Excel
                </button>
                <button
                  onClick={() => setActiveTab('score-roster')}
                  className="inline-flex items-center gap-1.5 bg-emerald-900/60 hover:bg-emerald-900 text-white border border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer"
                >
                  <FileCheck className="w-4 h-4 text-emerald-300" />
                  Sổ Điểm & Chỉnh Sửa Hàng Loạt
                </button>
                <button
                  onClick={() => setActiveTab('targets')}
                  className="inline-flex items-center gap-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-400/30 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <Target className="w-4 h-4 text-amber-300" />
                  Chỉ Tiêu & Đánh Giá AI
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Section 1: Thống Kê Trạng Thái Hoạt Động (Gọn gàng & Tối ưu hiển thị) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-3.5 sm:p-4 space-y-3 transition-colors">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base tracking-tight">
              Cổng Quản Lý Hoạt Động & Quy Trình Phê Duyệt
            </h3>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('activities')}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              <span>Xem hoạt động</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        {isInitialLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            <SkeletonMetricCard variant="slate" hasBadge={false} />
            <SkeletonMetricCard variant="emerald" hasBadge={true} />
            <SkeletonMetricCard variant="amber" hasBadge={true} />
            <SkeletonMetricCard variant="rose" hasBadge={true} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Card 1: Tổng Hoạt Động */}
            <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Tổng Hoạt Động
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                    <AnimatedCounter value={actStats.total} />
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-slate-200/70 dark:bg-slate-700/60 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400">
                <span>Hồ sơ năm học</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">100% quy mô</span>
              </div>
            </div>

            {/* Card 2: Đã Phê Duyệt */}
            <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl p-3 flex flex-col justify-between hover:border-emerald-300 dark:hover:border-emerald-700 transition">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Đã Phê Duyệt
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <p className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300">
                      <AnimatedCounter value={actStats.approved} />
                    </p>
                    {actStats.total > 0 && (
                      <span className="text-[10.5px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                        {Math.round((actStats.approved / actStats.total) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-100/80 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-300 shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 pt-1.5 border-t border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between text-[10.5px]">
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">Sẵn sàng nạp Excel</span>
                <span className="font-bold text-emerald-800 dark:text-emerald-300">Chuẩn ĐRL</span>
              </div>
            </div>

            {/* Card 3: Chờ Phê Duyệt */}
            <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 rounded-xl p-3 flex flex-col justify-between hover:border-amber-300 dark:hover:border-amber-700 transition">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Chờ Phê Duyệt
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <p className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-300">
                      <AnimatedCounter value={actStats.pending} />
                    </p>
                    {actStats.total > 0 && (
                      <span className="text-[10.5px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                        {Math.round((actStats.pending / actStats.total) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-amber-100/80 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-300 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 pt-1.5 border-t border-amber-200/60 dark:border-amber-800/60 flex items-center justify-between text-[10.5px] text-amber-800 dark:text-amber-300 font-medium">
                <span className="bg-amber-100/70 dark:bg-amber-900/40 px-1.5 py-0.2 rounded">
                  Khoa: <strong><AnimatedCounter value={actStats.pendingL3} /></strong>
                </span>
                <span className="bg-amber-100/70 dark:bg-amber-900/40 px-1.5 py-0.2 rounded">
                  Trường: <strong><AnimatedCounter value={actStats.pendingL4} /></strong>
                </span>
              </div>
            </div>

            {/* Card 4: Từ Chối / Cần Sửa */}
            <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-800/60 rounded-xl p-3 flex flex-col justify-between hover:border-rose-300 dark:hover:border-rose-700 transition">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                    Từ Chối / Cần Sửa
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <p className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-300">
                      <AnimatedCounter value={actStats.rejected} />
                    </p>
                    {actStats.total > 0 && (
                      <span className="text-[10.5px] font-bold px-1.5 py-0.2 rounded-md bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200">
                        {Math.round((actStats.rejected / actStats.total) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-rose-100/80 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-300 shrink-0">
                  <XCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 pt-1.5 border-t border-rose-200/60 dark:border-rose-800/60 flex items-center justify-between text-[10.5px]">
                <span className="text-rose-700 dark:text-rose-400 font-medium">Cần bổ sung minh chứng</span>
                <span className="font-bold text-rose-800 dark:text-rose-300">Chờ cập nhật</span>
              </div>
            </div>
          </div>
        )}

        {/* Visual Distribution Ratio Bar */}
        {actStats.total > 0 && (
          <div className="pt-0.5 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Tỷ lệ phân bổ trạng thái:</span>
              </span>
              <span>
                Tỷ lệ duyệt đạt <strong className="text-emerald-700 dark:text-emerald-400">{Math.round((actStats.approved / actStats.total) * 100)}%</strong>
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${(actStats.approved / actStats.total) * 100}%` }}
                className="bg-emerald-500 hover:bg-emerald-600 transition-all duration-500 h-full"
                title={`Đã duyệt: ${actStats.approved} (${Math.round((actStats.approved / actStats.total) * 100)}%)`}
              />
              <div
                style={{ width: `${(actStats.pending / actStats.total) * 100}%` }}
                className="bg-amber-400 hover:bg-amber-500 transition-all duration-500 h-full"
                title={`Chờ duyệt: ${actStats.pending} (${Math.round((actStats.pending / actStats.total) * 100)}%)`}
              />
              <div
                style={{ width: `${(actStats.rejected / actStats.total) * 100}%` }}
                className="bg-rose-500 hover:bg-rose-600 transition-all duration-500 h-full"
                title={`Từ chối: ${actStats.rejected} (${Math.round((actStats.rejected / actStats.total) * 100)}%)`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Grid: Section 2 & 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 2: Đánh giá chất lượng đoàn viên */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                2. Phân Loại Chất Lượng Đoàn Viên (4 Mức Chuẩn)
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                {doanVienRankStats.total} Đoàn viên
              </span>
            </div>

            <div className="mt-4 space-y-3.5">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-emerald-800 font-semibold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    Hoàn thành xuất sắc nhiệm vụ (Năm 1: ≥51đ, Năm 2+: ≥61đ)
                  </span>
                  <span className="font-bold text-emerald-900">
                    {doanVienRankStats.xuatSac.count} ({doanVienRankStats.xuatSac.pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${doanVienRankStats.xuatSac.pct}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-sky-800 font-semibold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                    Hoàn thành tốt nhiệm vụ (Năm 1: 31-50đ, Năm 2+: 41-60đ)
                  </span>
                  <span className="font-bold text-sky-900">
                    {doanVienRankStats.tot.count} ({doanVienRankStats.tot.pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-sky-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${doanVienRankStats.tot.pct}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-amber-800 font-semibold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    Hoàn thành nhiệm vụ (Năm 1: 11-30đ, Năm 2+: 21-40đ)
                  </span>
                  <span className="font-bold text-amber-900">
                    {doanVienRankStats.hoanThanh.count} ({doanVienRankStats.hoanThanh.pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${doanVienRankStats.hoanThanh.pct}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-rose-800 font-semibold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    Không hoàn thành nhiệm vụ (Năm 1: ≤10đ, Năm 2+: ≤20đ)
                  </span>
                  <span className="font-bold text-rose-900">
                    {doanVienRankStats.khongHT.count} ({doanVienRankStats.khongHT.pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-rose-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${doanVienRankStats.khongHT.pct}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Quy chế ĐRL NLU {academicYear}</span>
            <button
              onClick={() => setActiveTab('score-roster')}
              className="text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1"
            >
              Xem sổ điểm chi tiết <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Section 2 (Hoặc Mục 2): Phân Loại Chất Lượng Chi đoàn (4 Mức Chuẩn) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                2. Phân Loại Chất Lượng Chi đoàn (4 Mức Chuẩn)
              </h3>
              <div className="flex items-center gap-2">
                {currentLevel === 4 && (
                  <select
                    value={selectedFacultyFilter}
                    onChange={e => setSelectedFacultyFilter(e.target.value)}
                    className="text-[11px] px-2 py-1 rounded-lg border border-slate-300 bg-slate-50 font-medium text-slate-700 focus:outline-hidden"
                  >
                    <option value="ALL">Tất cả Khoa</option>
                    {organizations.filter(o => o.type === 'KHOA').map(f => (
                      <option key={f.code} value={f.code}>Khoa {f.name}</option>
                    ))}
                  </select>
                )}
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {chiDoanEvaluationData.items.length} Chi đoàn
                </span>
              </div>
            </div>

            {/* 4 Mức Chuẩn Xếp Loại Chi đoàn */}
            <div className="mt-4 space-y-2.5">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-emerald-800 font-semibold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    Hoàn thành xuất sắc nhiệm vụ
                  </span>
                  <span className="font-bold text-emerald-900">
                    {chiDoanEvaluationData.stats.xuatSac.count} ({chiDoanEvaluationData.stats.xuatSac.pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${chiDoanEvaluationData.stats.xuatSac.pct}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-sky-800 font-semibold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                    Hoàn thành tốt nhiệm vụ
                  </span>
                  <span className="font-bold text-sky-900">
                    {chiDoanEvaluationData.stats.tot.count} ({chiDoanEvaluationData.stats.tot.pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-sky-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${chiDoanEvaluationData.stats.tot.pct}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-amber-800 font-semibold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    Hoàn thành nhiệm vụ
                  </span>
                  <span className="font-bold text-amber-900">
                    {chiDoanEvaluationData.stats.hoanThanh.count} ({chiDoanEvaluationData.stats.hoanThanh.pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${chiDoanEvaluationData.stats.hoanThanh.pct}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-rose-800 font-semibold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    Không hoàn thành nhiệm vụ
                  </span>
                  <span className="font-bold text-rose-900">
                    {chiDoanEvaluationData.stats.khongHT.count} ({chiDoanEvaluationData.stats.khongHT.pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${chiDoanEvaluationData.stats.khongHT.pct}%` }}
                  ></div>
                </div>
              </div>
            </div>

          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs flex-wrap gap-2">
            <span className="text-slate-500">Phạm vi: {chiDoanEvaluationData.scopeLabel}</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('branch-emulation')}
                className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                Thi Đua Chi Đoàn <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('club-emulation')}
                className="text-indigo-700 dark:text-indigo-400 hover:text-indigo-800 font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                Thi Đua CLB / Đội <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 3 Widgets nằm trên cùng 1 hàng (Mục 4: Top 10, Mục 5 & Mục 6) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Widget 1: Section 4 - Top 10 Sinh viên */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Trophy className="w-4.5 h-4.5 text-amber-500" />
                4. Bảng Xếp Hạng Top Sinh Viên ({academicYear})
              </h3>
              <span className="text-xs bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full font-bold">Top 10</span>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-2 text-center w-12">Hạng</th>
                    <th className="p-2 text-left">Sinh Viên</th>
                    <th className="p-2 text-right">Tổng Điểm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {topStudents.map((std, index) => (
                    <tr key={`${std.id || std.studentId}-${index}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="p-2 text-center w-12">
                        <span
                          className={`w-5.5 h-5.5 rounded-full inline-flex items-center justify-center text-[10px] font-extrabold ${
                            index === 0
                              ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-400'
                              : index === 1
                              ? 'bg-slate-200 text-slate-800'
                              : index === 2
                              ? 'bg-amber-700/20 text-amber-900'
                              : 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="p-2 text-left font-bold text-slate-800 dark:text-slate-200">
                        <div className="truncate max-w-[150px] sm:max-w-[180px]" title={std.fullName}>
                          {std.fullName}
                        </div>
                        <div className="text-[10.5px] font-normal text-slate-400 dark:text-slate-500 font-mono">
                          MSSV: {std.studentId} • {std.classCode}
                        </div>
                      </td>
                      <td className="p-2 text-right font-black text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm whitespace-nowrap">
                        {std.totalScore} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Phạm vi: {user.currentRole.roleName}</span>
            <button
              type="button"
              onClick={() => setActiveTab('score-roster')}
              className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              Xem Sổ Điểm <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Widget 2 & Widget 3 theo phân quyền RBAC */}
        {currentLevel >= 4 ? (
          <>
            {/* Widget 2: Section 5 - Xếp hạng tổng điểm theo Khoa */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Medal className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      5. Xếp Hạng Tổng Điểm Theo Khoa
                    </h3>
                  </div>
                  <span className="text-[11px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-200 dark:border-emerald-800">
                    12 Đoàn Khoa
                  </span>
                </div>

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-2 text-center w-12">Hạng</th>
                        <th className="p-2 text-left">Đoàn Khoa</th>
                        <th className="p-2 text-right">Tổng Điểm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {facultyTotalRankings.slice(0, 10).map((f, idx) => (
                        <tr key={`${f.code}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="p-2 text-center w-12">
                            <span
                              className={`w-5.5 h-5.5 rounded-full inline-flex items-center justify-center text-[10px] font-extrabold ${
                                idx === 0
                                  ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-400'
                                  : idx === 1
                                  ? 'bg-slate-200 text-slate-800'
                                  : idx === 2
                                  ? 'bg-amber-700/20 text-amber-900'
                                  : 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              {idx + 1}
                            </span>
                          </td>
                          <td className="p-2 text-left font-bold text-slate-800 dark:text-slate-200">
                            <div className="truncate max-w-[150px] sm:max-w-[180px]" title={f.name}>
                              {f.name}
                            </div>
                            <div className="text-[10.5px] font-normal text-slate-400 dark:text-slate-500 font-mono">
                              Mã Khoa: [{f.code}]
                            </div>
                          </td>
                          <td className="p-2 text-right font-black text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm whitespace-nowrap">
                            {f.totalCombinedScore} đ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Cấp Trường</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('faculty-emulation')}
                  className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  Thi Đua Khoa <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Widget 3: Section 6 - Xếp hạng tổng điểm theo CLB / Đội / Nhóm */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      6. Xếp Hạng Tổng Điểm CLB / Đội
                    </h3>
                  </div>
                  <span className="text-[11px] bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-200 dark:border-amber-800">
                    35 Đơn vị
                  </span>
                </div>

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-2 text-center w-12">Hạng</th>
                        <th className="p-2 text-left">CLB / Đội</th>
                        <th className="p-2 text-right">Tổng Điểm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {clubTotalRankings.slice(0, 10).map((c, idx) => (
                        <tr key={`${c.code}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="p-2 text-center w-12">
                            <span
                              className={`w-5.5 h-5.5 rounded-full inline-flex items-center justify-center text-[10px] font-extrabold ${
                                idx === 0
                                  ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-400'
                                  : idx === 1
                                  ? 'bg-slate-200 text-slate-800'
                                  : idx === 2
                                  ? 'bg-amber-700/20 text-amber-900'
                                  : 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              {idx + 1}
                            </span>
                          </td>
                          <td className="p-2 text-left font-bold text-slate-800 dark:text-slate-200">
                            <div className="truncate max-w-[150px] sm:max-w-[180px]" title={c.name}>
                              {c.name}
                            </div>
                            <div className="text-[10.5px] font-normal text-slate-400 dark:text-slate-500 font-mono">
                              Mã đơn vị: [{c.code}]
                            </div>
                          </td>
                          <td className="p-2 text-right font-black text-amber-700 dark:text-amber-400 text-xs sm:text-sm whitespace-nowrap">
                            {c.totalPoints} đ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Đơn vị trực thuộc</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('club-emulation')}
                  className="text-amber-700 dark:text-amber-400 hover:text-amber-800 font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  Thi Đua CLB <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        ) : currentLevel === 3 ? (
          <>
            {/* Widget 2: Level 3 - Xếp hạng thi đua Chi đoàn trong Khoa */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Medal className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      5. Thi Đua Chi Đoàn Khoa {currentOrgCode}
                    </h3>
                  </div>
                  <span className="text-[11px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-200 dark:border-emerald-800">
                    Nội bộ Khoa
                  </span>
                </div>

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-2 text-center w-12">Hạng</th>
                        <th className="p-2 text-left">Chi Đoàn</th>
                        <th className="p-2 text-right">Tổng Điểm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {chiDoanEvaluationData.items.slice(0, 10).map((c, idx) => (
                        <tr key={`${c.code}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="p-2 text-center w-12">
                            <span className={`w-5.5 h-5.5 rounded-full inline-flex items-center justify-center text-[10px] font-bold ${
                              idx === 0 ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-400 font-extrabold' :
                              idx === 1 ? 'bg-slate-200 text-slate-800 font-bold' :
                              idx === 2 ? 'bg-amber-50 text-amber-800 font-bold' :
                              'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="p-2 text-left font-bold text-slate-800 dark:text-slate-200">
                            <div className="truncate max-w-[150px] sm:max-w-[180px]" title={c.name}>{c.name}</div>
                            <div className="text-[10.5px] font-normal text-slate-400 dark:text-slate-500 font-mono">
                              Mã lớp: [{c.code}]
                            </div>
                          </td>
                          <td className="p-2 text-right font-black text-indigo-700 dark:text-indigo-400 text-xs sm:text-sm whitespace-nowrap">
                            {c.emulationScore.toFixed(2)} đ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Thuộc Khoa {currentOrgCode}</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('branch-emulation')}
                  className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  Bảng Chi Đoàn <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Widget 3: Level 3 - Chỉ số Đoàn Khoa */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-sky-600" />
                    <h3 className="font-bold text-slate-900 text-sm">
                      6. Chỉ Số Đoàn Khoa {currentOrgCode}
                    </h3>
                  </div>
                  <span className="text-[11px] bg-sky-50 text-sky-800 px-2 py-0.5 rounded-full font-bold border border-sky-200">
                    Cấp Khoa
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-slate-500 text-[10px]">Số Chi đoàn</p>
                    <p className="text-lg font-black text-slate-900 mt-0.5">{chiDoanEvaluationData.items.length}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-slate-500 text-[10px]">Tổng SV quản lý</p>
                    <p className="text-lg font-black text-emerald-700 mt-0.5">{scopedStudents.length}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-slate-500 text-[10px]">HĐ đã duyệt</p>
                    <p className="text-lg font-black text-blue-700 mt-0.5">{actStats.approved}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-slate-500 text-[10px]">Chờ phê duyệt</p>
                    <p className="text-lg font-black text-amber-600 mt-0.5">{actStats.pending}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
                <span>Đoàn viên: {doanVienRankStats.total}</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('score-roster')}
                  className="text-emerald-700 font-bold hover:underline"
                >
                  Sổ điểm →
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Level 1 & 2 Widget 2 + 3 combined */
          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    5. Dữ Liệu Thi Đua & Hoạt Động Của {currentLevel === 2 ? `Chi Đoàn ${currentClassCode || currentOrgCode}` : `Cá Nhân Sinh Viên`}
                  </h3>
                </div>
                <span className="text-[11px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                  {currentLevel === 2 ? 'Cấp Chi đoàn' : 'Cá nhân'}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200 text-center">
                  <p className="text-slate-600 font-medium">Tổng sinh viên ghi nhận</p>
                  <p className="text-2xl font-black text-emerald-800 mt-1">{scopedStudents.length}</p>
                </div>
                <div className="p-3.5 bg-sky-50/50 rounded-xl border border-sky-200 text-center">
                  <p className="text-slate-600 font-medium">Hoạt động tham gia hợp lệ</p>
                  <p className="text-2xl font-black text-sky-800 mt-1">{actStats.approved}</p>
                </div>
                <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200 text-center">
                  <p className="text-slate-600 font-medium">Xếp loại chất lượng</p>
                  <p className="text-base font-black text-amber-800 mt-1">
                    {currentLevel === 2
                      ? (chiDoanEvaluationData.items[0]?.rankShort || 'Hoàn thành')
                      : (scopedStudents[0]?.rankGrade || 'Đạt chuẩn')}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
              <span>Được đồng bộ từ Sổ điểm rèn luyện</span>
              <button
                type="button"
                onClick={() => setActiveTab('portal-records')}
                className="text-emerald-700 font-bold hover:underline"
              >
                Xem chi tiết minh chứng →
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Biểu Đồ Tổng Quan Hoạt Động & Tỷ Lệ Tham Gia (Recharts - Lazy Loaded) */}
      <Suspense
        fallback={
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 animate-pulse">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg mb-4" />
            <div className="h-64 bg-slate-100 dark:bg-slate-800/40 rounded-xl" />
          </div>
        }
      >
        <DashboardOverviewChart />
      </Suspense>

      {/* Giao diện Lịch (Calendar View - Lazy Loaded) */}
      <Suspense
        fallback={
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 animate-pulse">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg mb-4" />
            <div className="h-48 bg-slate-100 dark:bg-slate-800/40 rounded-xl" />
          </div>
        }
      >
        <DashboardCalendarView />
      </Suspense>
    </div>
  );
};
