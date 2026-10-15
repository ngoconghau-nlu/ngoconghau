import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Organization, ActivitySubmission, BranchClass } from '../types';
import { calculateFacultyEmulationMetrics } from '../utils/scoringEngine';
import * as XLSX from 'xlsx';
import {
  Award,
  Trophy,
  Medal,
  TrendingUp,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Users,
  GraduationCap,
  Calendar,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Printer,
  FileSpreadsheet,
  X,
  Info,
  Building2,
  Layers,
  Flame,
  Check,
  RotateCcw
} from 'lucide-react';
import { EmulationComparisonChart } from './EmulationComparisonChart';
import { ReportPdfExportModal } from './ReportPdfExportModal';
import { ExportReportOptions } from '../utils/pdfExportUtils';

export interface FacultyEmulationRow {
  rank: number;
  code: string;
  name: string;
  email: string;
  totalActivitiesRegistered: number; // 1. Tổng số hoạt động đăng ký
  totalActivitiesApproved: number;   // 2. Tổng số hoạt động được phê duyệt
  totalActivitiesPending: number;    // 3. Tổng số hoạt động chờ duyệt
  totalStudents: number;             // 4. Tổng số sinh viên
  totalBranchClasses: number;        // 5. Tổng số chi đoàn
  totalDoanVien: number;             // 6. Tổng số đoàn viên
  totalDoanVienParticipations: number; // 7. Tổng số lượt đoàn viên tham gia hoạt động
  emulationScore: number;            // 8. Số điểm thi đua = Tổng lượt ĐV tham gia / (Tổng SV * 7) * 300
  doanVienRatio: number;
  approvedRate: number;
  emulationTitle: string;
  badgeStyle: string;
}

export interface FacultyEmulationRankingsProps {
  onNavigateToRoster?: (code: string) => void;
}

export const FacultyEmulationRankings: React.FC<FacultyEmulationRankingsProps> = ({ onNavigateToRoster }) => {
  const {
    organizations,
    activities,
    students,
    branchClasses,
    academicYear,
    user,
    setActiveTab,
    showToast,
    updateStudent
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacultyDetail, setSelectedFacultyDetail] = useState<FacultyEmulationRow | null>(null);
  const [showChart, setShowChart] = useState<boolean>(true);
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Hàm tự động đồng bộ dữ liệu thi đua giữa Chi đoàn và Đoàn Khoa / Đơn vị
  const handleSyncBranchData = () => {
    setIsSyncing(true);
    try {
      let syncCount = 0;
      students.forEach(std => {
        if (!std.classCode) return;
        const clsUpper = std.classCode.trim().toUpperCase();
        const matchedBranch = branchClasses.find(b => b.code.trim().toUpperCase() === clsUpper);
        if (matchedBranch && matchedBranch.facultyCode) {
          const expectedFac = matchedBranch.facultyCode.trim().toUpperCase();
          if (!std.facultyCode || std.facultyCode.trim().toUpperCase() !== expectedFac) {
            updateStudent(std.studentId, { facultyCode: expectedFac }, 'Đồng bộ tự động dữ liệu Thi đua Chi Đoàn với Đơn vị Khoa');
            syncCount++;
          }
        }
      });

      if (syncCount > 0) {
        showToast(`Đã đồng bộ thành công ${syncCount} sinh viên khớp dữ liệu Chi Đoàn với Đoàn Khoa/Đơn vị!`, 'success');
      } else {
        showToast('Dữ liệu thi đua Chi Đoàn và Đơn vị đã đồng bộ khớp 100%, không phát hiện sai lệch.', 'info');
      }
    } catch (err) {
      showToast('Xảy ra lỗi trong quá trình đồng bộ dữ liệu thi đua!', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Tính toán kết quả thi đua Khoa & Đơn vị tương đương theo danh mục hợp lệ
  const facultyEmulationData = useMemo(() => {
    // Lấy toàn bộ đơn vị Khoa & Tương đương từ danh mục hệ thống (bỏ whitelist hardcode)
    const faculties = organizations.filter(
      o => o.type === 'KHOA' || o.code === 'VC_NLD'
    );

    const rows = faculties.map(fac => {
      // 2. Chi đoàn thuộc Khoa
      const facultyBranches = branchClasses.filter(c => c.facultyCode === fac.code);
      const branchCodesSet = new Set(facultyBranches.map(c => c.code.trim().toUpperCase()));
      const totalBranchClasses = facultyBranches.length;

      // 1. Hoạt động của Khoa (Khoa đăng ký hoặc Chi đoàn thuộc Khoa đăng ký)
      const facultyActs = activities.filter(a => {
        if (a.orgCode && a.orgCode.trim().toUpperCase() === fac.code.trim().toUpperCase()) return true;
        if (a.branchClass && branchCodesSet.has(a.branchClass.trim().toUpperCase())) return true;
        return false;
      });
      const totalActivitiesRegistered = facultyActs.length;
      const totalActivitiesApproved = facultyActs.filter(a => a.status === 'Approved').length;
      const totalActivitiesPending = facultyActs.filter(
        a => a.status.startsWith('Pending') || a.status === 'Request_Edit'
      ).length;

      // 3. Tổng số sinh viên (ĐỒNG BỘ 100% VỚI CHI ĐOÀN TẠI DANH MỤC & SỔ ĐIỂM)
      const directStudents = students.filter(s => {
        if (s.facultyCode && s.facultyCode.trim().toUpperCase() === fac.code.trim().toUpperCase()) return true;
        if (s.classCode && branchCodesSet.has(s.classCode.trim().toUpperCase())) return true;
        return false;
      });
      const totalStudents = directStudents.length;

      // 4. Tổng số đoàn viên (THỐNG KÊ CHÍNH XÁC THEO SỐ ĐOÀN VIÊN TẠI DANH MỤC SINH VIÊN)
      const directDoanVienCount = directStudents.filter(s => s.membershipType === 'DOAN_VIEN').length;
      const totalDoanVien = directDoanVienCount;

      // 5. Tổng số lượt đoàn viên tham gia hoạt động
      const approvedActs = activities.filter(a => a.status === 'Approved');
      const directDoanVienStudents = directStudents.filter(s => s.membershipType === 'DOAN_VIEN');

      const totalDoanVienParticipations = directDoanVienStudents.reduce((sum, std) => {
        const count = approvedActs.filter(a => a.participants?.some(p => p.studentId === std.studentId)).length;
        return sum + count;
      }, 0);

      // 6. Số điểm thi đua theo chuẩn công thức kế thừa từ scoringEngine
      const metrics = calculateFacultyEmulationMetrics(totalStudents, totalDoanVien, totalDoanVienParticipations);
      const rawScore = metrics.score;
      const emulationScore = metrics.score !== null ? Number(metrics.score.toFixed(2)) : 0;
      const doanVienRatio = metrics.doanVienRatio !== null ? metrics.doanVienRatio : 0;

      const approvedRate = totalActivitiesRegistered > 0
        ? Math.round((totalActivitiesApproved / totalActivitiesRegistered) * 100)
        : 0;

      return {
        rank: 1, // Sẽ gán sau khi sắp xếp
        code: fac.code,
        name: fac.name,
        isEquivalentUnit: fac.code === 'VC_NLD' || fac.type !== 'KHOA',
        email: fac.email1 || `${fac.code.toLowerCase()}@tuoitrenonglam.com`,
        totalActivitiesRegistered,
        totalActivitiesApproved,
        totalActivitiesPending,
        totalStudents,
        totalBranchClasses,
        totalDoanVien,
        totalDoanVienParticipations,
        rawScore,
        emulationScore,
        doanVienRatio,
        isInsufficientData: metrics.isInsufficientData,
        approvedRate,
        emulationTitle: 'Đơn vị Hoàn thành Tốt',
        badgeStyle: 'bg-slate-100 text-slate-800 border-slate-300'
      };
    });

    // Xếp hạng theo số điểm thi đua chưa làm tròn (rawScore) từ cao xuống thấp
    rows.sort((a, b) => {
      const scoreA = a.rawScore !== null ? a.rawScore : -1;
      const scoreB = b.rawScore !== null ? b.rawScore : -1;
      return scoreB - scoreA || b.totalDoanVienParticipations - a.totalDoanVienParticipations;
    });

    // Gán thứ hạng theo Competition Ranking (1, 1, 3 nếu đồng hạng) và danh hiệu thi đua
    let currentRank = 1;
    rows.forEach((r, idx) => {
      if (idx > 0) {
        const prev = rows[idx - 1];
        const scorePrev = prev.rawScore !== null ? prev.rawScore : -1;
        const scoreCurr = r.rawScore !== null ? r.rawScore : -1;
        if (Math.abs(scorePrev - scoreCurr) < 0.0000001) {
          r.rank = currentRank;
        } else {
          currentRank = idx + 1;
          r.rank = currentRank;
        }
      } else {
        r.rank = 1;
      }

      if (r.isInsufficientData) {
        r.emulationTitle = 'Chưa đủ dữ liệu';
        r.badgeStyle = 'bg-slate-100 text-slate-500 border-slate-200 font-normal';
      } else if (r.rank === 1) {
        r.emulationTitle = 'Dẫn đầu bảng xếp hạng (Đề xuất xét)';
        r.badgeStyle = 'bg-amber-100 text-amber-900 border-amber-300 ring-1 ring-amber-400 font-bold';
      } else if (r.rank <= 3) {
        r.emulationTitle = 'Đơn vị Xuất sắc Dẫn đầu (Đề xuất xét)';
        r.badgeStyle = 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
      } else if (r.rank <= 7) {
        r.emulationTitle = 'Đơn vị Thi đua Tốt';
        r.badgeStyle = 'bg-sky-100 text-sky-900 border-sky-300 font-bold';
      } else {
        r.emulationTitle = 'Đơn vị Hoàn thành nhiệm vụ';
        r.badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200 font-medium';
      }
    });

    return rows;
  }, [organizations, activities, students, branchClasses]);

  // Bộ lọc tìm kiếm
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return facultyEmulationData;
    const q = searchTerm.toLowerCase().trim();
    return facultyEmulationData.filter(
      r => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)
    );
  }, [facultyEmulationData, searchTerm]);

  // Thống kê tổng hợp toàn trường
  const overallTotals = useMemo(() => {
    const totalActsReg = facultyEmulationData.reduce((acc, r) => acc + r.totalActivitiesRegistered, 0);
    const totalActsApp = facultyEmulationData.reduce((acc, r) => acc + r.totalActivitiesApproved, 0);
    const totalActsPend = facultyEmulationData.reduce((acc, r) => acc + r.totalActivitiesPending, 0);
    const totalStd = facultyEmulationData.reduce((acc, r) => acc + r.totalStudents, 0);
    const totalCls = facultyEmulationData.reduce((acc, r) => acc + r.totalBranchClasses, 0);
    const totalDv = facultyEmulationData.reduce((acc, r) => acc + r.totalDoanVien, 0);
    const totalParts = facultyEmulationData.reduce((acc, r) => acc + r.totalDoanVienParticipations, 0);
    const topFaculty = facultyEmulationData[0] || null;

    return {
      totalActsReg,
      totalActsApp,
      totalActsPend,
      totalStd,
      totalCls,
      totalDv,
      totalParts,
      topFaculty
    };
  }, [facultyEmulationData]);

  // Xuất file Excel / CSV
  const handleExportExcel = () => {
    try {
      const headers = [
        'Hạng',
        'Mã Khoa',
        'Tên Đoàn Khoa',
        'Tổng HĐ Đăng Ký',
        'Tổng HĐ Đã Duyệt',
        'Tổng HĐ Chờ Duyệt',
        'Tổng Số Sinh Viên',
        'Tổng Số Chi Đoàn',
        'Tổng Số Đoàn Viên',
        'Tỷ Lệ ĐV (%)',
        'Tổng Lượt ĐV Tham Gia',
        'Điểm Thi Đua',
        'Danh Hiệu Thi Đua'
      ];

      const dataRows = filteredRows.map(r => [
        r.rank,
        r.code,
        r.name,
        r.totalActivitiesRegistered,
        r.totalActivitiesApproved,
        r.totalActivitiesPending,
        r.totalStudents,
        r.totalBranchClasses,
        r.totalDoanVien,
        `${r.doanVienRatio}%`,
        r.totalDoanVienParticipations,
        r.emulationScore.toFixed(2),
        r.emulationTitle
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'ThiDua_12_DoanKhoa');
      XLSX.writeFile(wb, `KetQuaThiDua_12_DoanKhoa_NLU_${academicYear.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
      showToast('Đã xuất báo cáo Kết quả thi đua 12 Đoàn khoa thành công!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Có lỗi xảy ra khi tạo file Excel', 'error');
    }
  };

  const facultyReportOptions: ExportReportOptions = useMemo(() => {
    return {
      title: 'BẢNG XẾP HẠNG THI ĐUA ĐOÀN KHOA NĂM HỌC',
      subTitle: 'HỆ THỐNG ĐÁNH GIÁ THI ĐUA & ĐIỂM RÈN LUYỆN ĐOÀN VIÊN NLU',
      academicYear,
      semester: 'Cả Năm Học',
      unitName: 'BAN THƯỜNG VỤ ĐOÀN TRƯỜNG ĐH NÔNG LÂM TP.HCM',
      scopeLabel: '12 Đoàn Khoa Trực Thuộc',
      generatedBy: `${user?.fullName || 'Ban Thi Đua Đoàn Trường'} (${user?.currentRole?.roleName || 'Cán bộ Quản trị'})`,
      signerTitle: 'TM. BAN THƯỜNG VỤ ĐOÀN TRƯỜNG\nBÍ THƯ',
      signerName: 'ThS. Nguyễn Văn A',
      orientation: 'landscape',
      summaryStats: [
        { label: 'Tổng số Đoàn Khoa', value: facultyEmulationData.length, note: '12 đơn vị trực thuộc' },
        { label: 'Đơn Vị Dẫn Đầu', value: overallTotals.topFaculty?.name || 'Khoa CNTT', note: `${overallTotals.topFaculty?.emulationScore.toFixed(1)} Điểm` },
        { label: 'Tổng Hoạt Động', value: overallTotals.totalActsApp, note: 'Đã hoàn thành phê duyệt' },
        { label: 'Lượt ĐV Tham Gia', value: overallTotals.totalParts.toLocaleString('vi-VN'), note: 'Toàn trường' }
      ],
      columns: [
        { header: 'Hạng', key: 'rank', width: '45px', align: 'center' },
        { header: 'Mã Khoa', key: 'code', width: '70px', align: 'center' },
        { header: 'Tên Đoàn Khoa', key: 'name', width: '180px', align: 'left' },
        { header: 'HĐ Đăng Ký', key: 'totalActivitiesRegistered', width: '75px', align: 'center' },
        { header: 'HĐ Đã Duyệt', key: 'totalActivitiesApproved', width: '75px', align: 'center' },
        { header: 'Tổng Số SV', key: 'totalStudents', width: '75px', align: 'right' },
        { header: 'Số Chi Đoàn', key: 'totalBranchClasses', width: '75px', align: 'center' },
        { header: 'Số Đoàn Viên', key: 'totalDoanVien', width: '75px', align: 'right' },
        { header: 'Tỷ Lệ ĐV', key: 'doanVienRatioStr', width: '65px', align: 'center' },
        { header: 'Lượt Tham Gia', key: 'totalDoanVienParticipations', width: '85px', align: 'right' },
        { header: 'Điểm Thi Đua', key: 'emulationScoreStr', width: '80px', align: 'right' },
        { header: 'Danh Hiệu Thi Đua', key: 'emulationTitle', width: '150px', align: 'left' }
      ],
      rows: filteredRows.map((r) => ({
        rank: r.rank,
        code: r.code,
        name: r.name,
        totalActivitiesRegistered: r.totalActivitiesRegistered,
        totalActivitiesApproved: r.totalActivitiesApproved,
        totalStudents: r.totalStudents,
        totalBranchClasses: r.totalBranchClasses,
        totalDoanVien: r.totalDoanVien,
        doanVienRatioStr: `${r.doanVienRatio}%`,
        totalDoanVienParticipations: r.totalDoanVienParticipations,
        emulationScoreStr: r.emulationScore.toFixed(1),
        emulationTitle: r.emulationTitle
      }))
    };
  }, [academicYear, user, facultyEmulationData, overallTotals, filteredRows]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header & KPI Bento Cards - Compact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Khoa Dẫn Đầu */}
        <div className="bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/60 rounded-xl p-3.5 shadow-2xs flex items-center justify-between group">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Hạng 1 Toàn Trường
            </span>
            <div className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5 truncate max-w-[170px]" title={overallTotals.topFaculty?.name}>
              {overallTotals.topFaculty ? overallTotals.topFaculty.name : 'Đang cập nhật'}
            </div>
            <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {overallTotals.topFaculty?.emulationScore.toFixed(2)} điểm thi đua
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-black text-xl border border-amber-200 dark:border-amber-800 shrink-0 group-hover:scale-105 transition-transform">
            🥇
          </div>
        </div>

        {/* Card 2: Tổng Hoạt Động (Đã duyệt / Chờ duyệt) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs flex items-center justify-between group">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Hoạt Động 13 Khoa & Đơn vị
            </span>
            <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
              {overallTotals.totalActsReg}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{overallTotals.totalActsApp} duyệt</span> · <span className="text-amber-600 dark:text-amber-400 font-bold">{overallTotals.totalActsPend} chờ</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shrink-0 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Tổng Sinh Viên & Chi Đoàn */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs flex items-center justify-between group">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              Sinh Viên & Chi Đoàn
            </span>
            <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
              {overallTotals.totalStd.toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Tại <span className="font-bold text-slate-800 dark:text-slate-200">{overallTotals.totalCls} Chi đoàn</span> trực thuộc
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200 dark:border-sky-800 shrink-0 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Tổng Lượt Đoàn Viên Tham Gia */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs flex items-center justify-between group">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Tổng Lượt ĐV Tham Gia
            </span>
            <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
              {overallTotals.totalParts.toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Trên <span className="font-bold text-slate-800 dark:text-slate-200">{overallTotals.totalDv.toLocaleString()} đoàn viên</span> toàn trường
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200 dark:border-teal-800 shrink-0 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Biểu Đồ So Sánh Recharts Biến Động ĐRL & Thi Đua (13 Khoa & Đơn vị, Chi đoàn vs CLB) */}
      {showChart && (
        <EmulationComparisonChart />
      )}

      {/* 3. Banner & Toolbar with Search & Multidimensional Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
                Bảng Xếp Hạng & Đánh Giá Thi Đua 13 Đoàn Khoa & Đơn Vị Trực Thuộc
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                {academicYear}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Thang điểm 300 chuẩn Ban Thường vụ Đoàn trường (Điểm = Tổng lượt ĐV tham gia / (Tổng SV × 7) × 300).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSyncBranchData}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
              title="Tự động đồng bộ 100% dữ liệu Thi đua Chi Đoàn với Đoàn Khoa / Đơn vị"
            >
              <RotateCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Đang Đồng Bộ...' : 'Đồng Bộ Thi Đua Chi Đoàn'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowChart(!showChart)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer border ${
                showChart
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50'
              }`}
              title="Bật/tắt biểu đồ Recharts so sánh biến động ĐRL và thi đua"
            >
              <TrendingUp className="w-4 h-4" />
              <span>{showChart ? 'Ẩn Biểu Đồ Recharts' : 'Biểu Đồ Recharts'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              title="Xuất bảng xếp hạng thi đua ra file Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất Excel Thi Đua</span>
            </button>
            <button
              type="button"
              onClick={() => setShowPdfModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              title="Xem trước và xuất báo cáo xếp hạng thi đua ra file PDF hoặc tệp ngoại tuyến"
            >
              <Printer className="w-4 h-4" />
              <span>Xuất Báo Cáo PDF</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên Khoa, mã đơn vị (Vd: CNTT, CNTY, Kinh tế...)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9.5 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-[11px] font-medium text-slate-500">
            Hiển thị <strong className="text-amber-600 font-bold">{filteredRows.length}</strong> / {facultyEmulationData.length} Đoàn Khoa & Đơn vị
          </div>
        </div>
      </div>

      {/* 4. Bảng Kết Quả 13 Khoa & Đơn vị Đầy Đủ 8 Chỉ Số Chuẩn */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              Bảng Tổng Hợp Chỉ Số & Xếp Hạng Thi Đua {facultyEmulationData.length} Đoàn Khoa & Đơn vị Trực Thuộc
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Được tự động sắp xếp theo <span className="font-bold text-emerald-600 dark:text-emerald-400">Số điểm thi đua</span> giảm dần từ Hạng 1 đến Hạng {facultyEmulationData.length}.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl">
            {filteredRows.length}/{facultyEmulationData.length} Đoàn Khoa & Đơn vị
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-3.5 py-3 text-center w-14">Hạng</th>
                <th className="px-4 py-3 min-w-[200px]">Đoàn Khoa</th>
                <th className="px-3 py-3 text-center" title="Tổng số hoạt động đăng ký">
                  1. Đăng Ký
                </th>
                <th className="px-3 py-3 text-center" title="Tổng số hoạt động được phê duyệt">
                  2. Đã Duyệt
                </th>
                <th className="px-3 py-3 text-center" title="Tổng số hoạt động chờ duyệt">
                  3. Chờ Duyệt
                </th>
                <th className="px-3 py-3 text-right" title="Tổng số sinh viên">
                  4. Tổng SV
                </th>
                <th className="px-3 py-3 text-center" title="Tổng số chi đoàn">
                  5. Chi Đoàn
                </th>
                <th className="px-3 py-3 text-right" title="Tổng số đoàn viên">
                  6. Đoàn Viên
                </th>
                <th className="px-3.5 py-3 text-right" title="Tổng số lượt đoàn viên tham gia hoạt động">
                  7. Lượt ĐV Tham Gia
                </th>
                <th className="px-4 py-3 text-center min-w-[130px]" title="Số điểm thi đua = Tổng lượt ĐV tham gia / (Tổng SV x 7) * 300">
                  8. Điểm Thi Đua
                </th>
                <th className="px-4 py-3 text-center">Danh Hiệu</th>
                <th className="px-4 py-3 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    Không tìm thấy Đoàn khoa nào phù hợp với từ khóa tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const isTop1 = row.rank === 1;
                  const isTop2 = row.rank === 2;
                  const isTop3 = row.rank === 3;

                  return (
                    <tr
                      key={row.code}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition cursor-pointer group"
                      onClick={() => setSelectedFacultyDetail(row)}
                    >
                      {/* Cột 1: Thứ Hạng */}
                      <td className="px-3.5 py-3.5 text-center">
                        <div className="flex items-center justify-center">
                          {isTop1 ? (
                            <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs flex items-center justify-center shadow-xs">
                              🥇 1
                            </span>
                          ) : isTop2 ? (
                            <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-800 border border-slate-300 font-extrabold text-xs flex items-center justify-center shadow-xs">
                              🥈 2
                            </span>
                          ) : isTop3 ? (
                            <span className="w-7 h-7 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-extrabold text-xs flex items-center justify-center shadow-xs">
                              🥉 3
                            </span>
                          ) : (
                            <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center justify-center">
                              {row.rank}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cột 2: Tên Đoàn Khoa */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {row.code}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs leading-snug group-hover:text-emerald-600 transition">
                              {row.name}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate max-w-[200px] block">
                              {row.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 3: Tổng số hoạt động đăng ký */}
                      <td className="px-3 py-3.5 text-center font-bold text-slate-800 dark:text-slate-200">
                        {row.totalActivitiesRegistered}
                      </td>

                      {/* Cột 4: Tổng số hoạt động được phê duyệt */}
                      <td className="px-3 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 text-xs">
                          <Check className="w-3 h-3 text-emerald-600" />
                          {row.totalActivitiesApproved}
                        </span>
                      </td>

                      {/* Cột 5: Tổng số hoạt động chờ duyệt */}
                      <td className="px-3 py-3.5 text-center">
                        {row.totalActivitiesPending > 0 ? (
                          <span className="font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 text-xs">
                            {row.totalActivitiesPending}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      {/* Cột 6: Tổng số sinh viên (Đồng bộ 100% từ Danh mục sinh viên) */}
                      <td className="px-3 py-3.5 text-right font-medium text-slate-700 dark:text-slate-300">
                        {onNavigateToRoster ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToRoster(row.code);
                            }}
                            className="font-bold text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline transition"
                            title="Bấm để tra cứu danh sách sinh viên Khoa này tại Sổ Điểm Sinh Viên"
                          >
                            {row.totalStudents.toLocaleString()} SV
                          </button>
                        ) : (
                          <span>{row.totalStudents.toLocaleString()} SV</span>
                        )}
                      </td>

                      {/* Cột 7: Tổng số chi đoàn */}
                      <td className="px-3 py-3.5 text-center font-medium text-slate-700 dark:text-slate-300">
                        {row.totalBranchClasses} CĐ
                      </td>

                      {/* Cột 8: Tổng số đoàn viên */}
                      <td className="px-3 py-3.5 text-right font-medium text-slate-700 dark:text-slate-300">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{row.totalDoanVien.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400 block">({row.doanVienRatio}%)</span>
                      </td>

                      {/* Cột 9: Tổng số lượt đoàn viên tham gia hoạt động */}
                      <td className="px-3.5 py-3.5 text-right">
                        <span className="font-black text-slate-900 dark:text-slate-100 text-xs">
                          {row.totalDoanVienParticipations.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 block">lượt tham gia</span>
                      </td>

                      {/* Cột 10: SỐ ĐIỂM THI ĐUA = Lượt / (Tổng SV x 7) */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-mono font-extrabold text-sm shadow-2xs">
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          <span>{row.emulationScore.toFixed(2)}</span>
                        </div>
                      </td>

                      {/* Cột 11: Danh hiệu */}
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] border shadow-2xs ${row.badgeStyle}`}>
                          {row.emulationTitle}
                        </span>
                      </td>

                      {/* Cột 12: Nút Xem chi tiết */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFacultyDetail(row);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition"
                          title="Xem hồ sơ thi đua chi tiết"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modal Chi Tiết Hoạt Động & Chi Đoàn Thuộc Khoa */}
      {selectedFacultyDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                    {selectedFacultyDetail.rank}
                  </span>
                  <h3 className="text-base font-bold">
                    Chi Tiết Thi Đua: {selectedFacultyDetail.name} [{selectedFacultyDetail.code}]
                  </h3>
                </div>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Điểm thi đua: <strong className="text-white">{selectedFacultyDetail.emulationScore.toFixed(2)} đ</strong> · {selectedFacultyDetail.emulationTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFacultyDetail(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Modal */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 dark:text-slate-300">
              {/* Thống kê 4 ô Bento */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Sinh Viên / Đoàn Viên</span>
                  <p className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-mono mt-1">
                    {selectedFacultyDetail.totalStudents} / {selectedFacultyDetail.totalDoanVien}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Chi Đoàn Lớp</span>
                  <p className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-mono mt-1">
                    {selectedFacultyDetail.totalBranchClasses} Chi đoàn
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">HĐ Được Duyệt</span>
                  <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                    {selectedFacultyDetail.totalActivitiesApproved} / {selectedFacultyDetail.totalActivitiesRegistered}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Lượt ĐV Tham Gia</span>
                  <p className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 font-mono mt-1">
                    {selectedFacultyDetail.totalDoanVienParticipations}
                  </p>
                </div>
              </div>

              {/* Danh Sách Các Chi Đoàn Thuộc Khoa */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-2 flex items-center justify-between">
                  <span>Danh Sách Chi Đoàn Thuộc Khoa:</span>
                  <span className="text-xs text-emerald-600 font-medium">
                    {branchClasses.filter(c => c.facultyCode === selectedFacultyDetail.code).length} Chi đoàn
                  </span>
                </h4>
                <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                  {branchClasses
                    .filter(c => c.facultyCode === selectedFacultyDetail.code)
                    .map((c, idx) => {
                      const branchStd = students.filter(s => s.classCode === c.code);
                      const branchDv = branchStd.filter(s => s.membershipType === 'DOAN_VIEN');
                      return (
                        <div key={`${c.id || c.code}_${idx}`} className="p-2.5 flex items-center justify-between text-xs hover:bg-white dark:hover:bg-slate-800 transition">
                          <div>
                            <strong className="text-slate-800 dark:text-slate-200">{c.name}</strong>
                            <span className="text-slate-400 ml-2 font-mono">[{c.code}]</span>
                          </div>
                          <span className="text-slate-600 dark:text-slate-400 font-semibold">
                            {branchStd.length} SV ({branchDv.length} ĐV)
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Danh Sách Hoạt Động Của Khoa */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-2 flex items-center justify-between">
                  <span>Hoạt Động Do Khoa Tổ Chức / Đăng Ký:</span>
                  <span className="text-xs text-slate-500 font-medium">
                    {activities.filter(a => a.orgCode === selectedFacultyDetail.code).length} hoạt động
                  </span>
                </h4>
                <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                  {activities.filter(a => a.orgCode === selectedFacultyDetail.code).length === 0 ? (
                    <div className="p-4 text-center text-slate-400">Chưa có hoạt động nào được ghi nhận.</div>
                  ) : (
                    activities
                      .filter(a => a.orgCode === selectedFacultyDetail.code)
                      .map(a => (
                        <div key={a.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-white dark:hover:bg-slate-800 transition">
                          <div>
                            <strong className="text-slate-800 dark:text-slate-200">{a.title}</strong>
                            <p className="text-[10px] text-slate-400 mt-0.5">{a.startDate} · {a.managerName}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ml-2 ${
                            a.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {a.status === 'Approved' ? 'Đã duyệt' : a.status}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              {onNavigateToRoster ? (
                <button
                  type="button"
                  onClick={() => {
                    const c = selectedFacultyDetail.code;
                    setSelectedFacultyDetail(null);
                    onNavigateToRoster(c);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition"
                >
                  <Users className="w-3.5 h-3.5" />
                  Tra cứu {selectedFacultyDetail.totalStudents} SV ({selectedFacultyDetail.totalDoanVien} ĐV) trong Sổ Điểm
                </button>
              ) : <div />}
              <button
                type="button"
                onClick={() => setSelectedFacultyDetail(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl font-semibold text-xs transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xuất Báo Cáo Thi Đua Đoàn Khoa PDF / Ngoại Tuyến */}
      <ReportPdfExportModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        reportOptions={facultyReportOptions}
      />
    </div>
  );
};
