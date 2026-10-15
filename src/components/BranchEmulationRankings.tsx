import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { BranchClass, ChiDoanRank } from '../types';
import * as XLSX from 'xlsx';
import {
  Trophy,
  Award,
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
  Printer,
  FileSpreadsheet,
  X,
  Info,
  Building,
  Layers,
  Flame,
  Check,
  ShieldCheck,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { ReportPdfExportModal } from './ReportPdfExportModal';
import { ExportReportOptions } from '../utils/pdfExportUtils';

export interface BranchEmulationRow {
  rank: number;
  id: string;
  code: string;
  name: string;
  facultyCode: string;
  facultyName: string;
  academicYear: string;
  cohort: string; // e.g. "DH21", "DH22", "DH23", "DH24"
  totalStudents: number;                 // Tổng số sinh viên
  totalDoanVien: number;                 // 1. Tổng số đoàn viên
  doanVienRatio: number;
  totalActivitiesRegistered: number;
  totalActivitiesApproved: number;       // 2. Tổng số hoạt động được phê duyệt
  totalDoanVienParticipations: number;   // 3. Tổng số lượt đoàn viên tham gia hoạt động
  totalParticipations: number;           // Tổng lượt tham gia
  avgDrLScore: number;
  emulationScore: number;                // 4. Số điểm thi đua = Lượt ĐV / (Tổng SV * 7)
  emulationScoreExact: number;
  rankGrade: ChiDoanRank;
  rankShort: string;
  badgeStyle: string;
}

export interface BranchEmulationRankingsProps {
  onNavigateToRoster?: (code: string) => void;
}

export const BranchEmulationRankings: React.FC<BranchEmulationRankingsProps> = ({ onNavigateToRoster }) => {
  const {
    branchClasses,
    organizations,
    activities,
    students,
    academicYear,
    user,
    setActiveTab,
    showToast,
    updateStudent
  } = useApp();

  const currentLevel = user.currentRole.roleLevel;
  const currentOrgCode = user.currentRole.orgCode;

  // Filter States
  const [facultyFilter, setFacultyFilter] = useState<string>(
    currentLevel === 3 && currentOrgCode ? currentOrgCode : 'ALL'
  );
  const [cohortFilter, setCohortFilter] = useState<string>('ALL');
  const [rankFilter, setRankFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranchDetail, setSelectedBranchDetail] = useState<BranchEmulationRow | null>(null);
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

  // Danh mục 13 Khoa & Đơn vị
  const faculties = useMemo(() => {
    return organizations.filter(o => o.type === 'KHOA' || o.code === 'VC_NLD');
  }, [organizations]);

  // Danh sách Khóa sinh viên tự động trích xuất từ mã lớp (DH21, DH22, DH23, DH24...)
  const cohortOptions = useMemo(() => {
    const set = new Set<string>();
    branchClasses.forEach(c => {
      const match = c.code.match(/DH\d{2}/i);
      if (match) set.add(match[0].toUpperCase());
    });
    return Array.from(set).sort();
  }, [branchClasses]);

  // Tính toán bảng xếp hạng thi đua Chi đoàn
  const branchEmulationList = useMemo(() => {
    const approvedActs = activities.filter(a => a.status === 'Approved');

    const rows: BranchEmulationRow[] = branchClasses.map(cls => {
      const fac = organizations.find(o => o.code === cls.facultyCode);
      const facName = fac ? fac.name : `Khoa ${cls.facultyCode}`;

      // 1. Tổng số sinh viên (ĐỒNG BỘ 100% TỪ DANH MỤC SINH VIÊN TẠI SỔ ĐIỂM)
      const classStudents = students.filter(s => s.classCode === cls.code);
      const totalStudents = classStudents.length;

      // 2. Tổng số đoàn viên (THỐNG KÊ CHÍNH XÁC THEO SỐ ĐOÀN VIÊN TẠI DANH MỤC SINH VIÊN)
      const doanVienInClass = classStudents.filter(s => s.membershipType === 'DOAN_VIEN').length;
      const totalDoanVien = doanVienInClass;
      const doanVienRatio = totalStudents > 0
        ? Number(((totalDoanVien / totalStudents) * 100).toFixed(1))
        : 0;

      // 3. Tổng số hoạt động được phê duyệt (Yêu cầu)
      const branchActs = activities.filter(a => a.branchClass === cls.code);
      const totalActivitiesRegistered = branchActs.length;
      const totalActivitiesApproved = branchActs.filter(a => a.status === 'Approved').length;

      // 4. Tổng số lượt đoàn viên tham gia hoạt động (Tính chính xác 100% từ danh sách sinh viên tham gia hoạt động)
      const classDoanVienStudents = classStudents.filter(s => s.membershipType === 'DOAN_VIEN');
      const totalDoanVienParticipations = classDoanVienStudents.reduce((sum, std) => {
        const count = approvedActs.filter(a => a.participants?.some(p => p.studentId === std.studentId)).length;
        return sum + count;
      }, 0);



      // 5. Số điểm thi đua = Tổng số lượt đoàn viên tham gia hoạt động / (Tổng số sinh viên * 7) (Yêu cầu)
      const rawScore = totalStudents > 0
        ? totalDoanVienParticipations / (totalStudents * 7)
        : 0;
      const emulationScore = Number(rawScore.toFixed(2));
      const emulationScoreExact = Number(rawScore.toFixed(3));

      // 6. Điểm rèn luyện trung bình
      const totalDrL = classStudents.reduce((sum, s) => sum + s.totalScore, 0);
      const avgDrLScore = classStudents.length > 0
        ? Math.round((totalDrL / classStudents.length) * 10) / 10
        : 45.0;

      // 7. Xếp loại 4 mức chuẩn dựa theo số điểm thi đua
      let rankGrade: ChiDoanRank = 'Không hoàn thành nhiệm vụ';
      let rankShort = 'Không hoàn thành';
      let badgeStyle = 'bg-rose-100 text-rose-800 border-rose-200';

      if (emulationScore >= 0.85) {
        rankGrade = 'Hoàn thành xuất sắc nhiệm vụ';
        rankShort = 'Xuất sắc';
        badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
      } else if (emulationScore >= 0.65) {
        rankGrade = 'Hoàn thành tốt nhiệm vụ';
        rankShort = 'Tốt';
        badgeStyle = 'bg-sky-100 text-sky-800 border-sky-300 font-bold';
      } else if (emulationScore >= 0.40) {
        rankGrade = 'Hoàn thành nhiệm vụ';
        rankShort = 'Hoàn thành';
        badgeStyle = 'bg-amber-100 text-amber-800 border-amber-300 font-medium';
      }

      // Trích xuất cohort
      const cohortMatch = cls.code.match(/DH\d{2}/i);
      const cohort = cohortMatch ? cohortMatch[0].toUpperCase() : 'Khác';

      return {
        rank: 1,
        id: cls.id,
        code: cls.code,
        name: cls.name,
        facultyCode: cls.facultyCode,
        facultyName: facName,
        academicYear: cls.academicYear,
        cohort,
        totalStudents,
        totalDoanVien,
        doanVienRatio,
        totalActivitiesRegistered,
        totalActivitiesApproved,
        totalDoanVienParticipations,
        totalParticipations: totalDoanVienParticipations,
        avgDrLScore,
        emulationScore,
        emulationScoreExact,
        rankGrade,
        rankShort,
        badgeStyle
      };
    });

    // Sắp xếp thứ tự theo số điểm thi đua giảm dần
    rows.sort((a, b) => b.emulationScoreExact - a.emulationScoreExact || b.totalDoanVienParticipations - a.totalDoanVienParticipations);

    // Gán thứ hạng
    rows.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    return rows;
  }, [branchClasses, organizations, activities, students]);

  // Bộ lọc danh sách
  const filteredRows = useMemo(() => {
    return branchEmulationList.filter(row => {
      if (facultyFilter !== 'ALL' && row.facultyCode !== facultyFilter) return false;
      if (cohortFilter !== 'ALL' && row.cohort !== cohortFilter) return false;
      if (rankFilter !== 'ALL' && row.rankShort !== rankFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const match =
          row.name.toLowerCase().includes(q) ||
          row.code.toLowerCase().includes(q) ||
          row.facultyName.toLowerCase().includes(q) ||
          row.facultyCode.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [branchEmulationList, facultyFilter, cohortFilter, rankFilter, searchTerm]);

  // Thống kê tổng quan
  const stats = useMemo(() => {
    const total = filteredRows.length;
    const xuatSac = filteredRows.filter(r => r.rankShort === 'Xuất sắc').length;
    const tot = filteredRows.filter(r => r.rankShort === 'Tốt').length;
    const hoanThanh = filteredRows.filter(r => r.rankShort === 'Hoàn thành').length;
    const khongHT = filteredRows.filter(r => r.rankShort === 'Không hoàn thành').length;
    const totalSV = filteredRows.reduce((sum, r) => sum + r.totalStudents, 0);
    const totalDoanVien = filteredRows.reduce((sum, r) => sum + r.totalDoanVien, 0);
    const totalActsApproved = filteredRows.reduce((sum, r) => sum + r.totalActivitiesApproved, 0);
    const totalDoanVienParticipations = filteredRows.reduce((sum, r) => sum + r.totalDoanVienParticipations, 0);
    const totalTG = filteredRows.reduce((sum, r) => sum + r.totalParticipations, 0);
    const topBranch = filteredRows[0] || null;
    const avgScore = total > 0
      ? Number((filteredRows.reduce((sum, r) => sum + r.emulationScore, 0) / total).toFixed(2))
      : 0;
    const overallFormulaScore = totalSV > 0
      ? Number((totalDoanVienParticipations / (totalSV * 7)).toFixed(2))
      : 0;

    return {
      total,
      xuatSac,
      tot,
      hoanThanh,
      khongHT,
      totalSV,
      totalDoanVien,
      totalActsApproved,
      totalDoanVienParticipations,
      totalTG,
      topBranch,
      avgScore,
      overallFormulaScore
    };
  }, [filteredRows]);

  // Xuất file Excel chuẩn thi đua Chi đoàn
  const handleExportExcel = () => {
    try {
      const headers = [
        'Hạng',
        'Mã Chi đoàn',
        'Tên Lớp / Chi đoàn',
        'Khoa',
        'Khóa',
        'Tổng Số Sinh Viên',
        'Tổng Số Đoàn Viên',
        'Tỷ Lệ ĐV (%)',
        'Tổng HĐ Được Phê Duyệt',
        'Tổng Lượt ĐV Tham Gia Hoạt Động',
        'Số Điểm Thi Đua = Lượt / (SV x 7)',
        'Xếp Loại Thi Đua'
      ];

      const dataRows = filteredRows.map(r => [
        r.rank,
        r.code,
        r.name,
        r.facultyName,
        r.cohort,
        r.totalStudents,
        r.totalDoanVien,
        `${r.doanVienRatio}%`,
        r.totalActivitiesApproved,
        r.totalDoanVienParticipations,
        r.emulationScore.toFixed(2),
        r.rankGrade
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'ThiDua_ChiDoan');
      XLSX.writeFile(wb, `KetQuaThiDua_ChiDoan_NLU_${academicYear.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
      showToast(`Đã xuất báo cáo thi đua của ${filteredRows.length} chi đoàn ra file Excel thành công!`, 'success');
    } catch (e) {
      console.error(e);
      showToast('Có lỗi xảy ra khi tạo file Excel', 'error');
    }
  };

  const branchReportOptions: ExportReportOptions = useMemo(() => {
    const scope = facultyFilter === 'ALL' ? 'Toàn trường' : `Khoa ${facultyFilter}`;
    return {
      title: 'BẢNG TỔNG HỢP KẾT QUẢ THI ĐUA CHI ĐOÀN',
      subTitle: 'HỆ THỐNG ĐÁNH GIÁ THI ĐUA & PHÂN LOẠI CHI ĐOÀN NLU',
      academicYear,
      semester: 'Cả Năm Học',
      unitName: facultyFilter !== 'ALL' ? `ĐOÀN KHOA ${facultyFilter.toUpperCase()}` : 'BAN THƯỜNG VỤ ĐOÀN TRƯỜNG ĐH NÔNG LÂM TP.HCM',
      scopeLabel: `${scope} · ${cohortFilter === 'ALL' ? 'Tất cả các khóa' : `Khóa ${cohortFilter}`}`,
      generatedBy: `${user?.fullName || 'Cán bộ quản lý'} (${user?.currentRole?.roleName || 'Cán bộ Đoàn'})`,
      signerTitle: facultyFilter !== 'ALL' ? `TM. BAN CHẤP HÀNH ĐOÀN KHOA\nBÍ THƯ` : 'TM. BAN THƯỜNG VỤ ĐOÀN TRƯỜNG\nBÍ THƯ',
      signerName: 'ThS. Nguyễn Văn A',
      orientation: 'landscape',
      summaryStats: [
        { label: 'Tổng số Chi đoàn', value: filteredRows.length, note: 'Bản ghi được lọc' },
        { label: 'Tổng HĐ Được Phê Duyệt', value: stats.totalActsApproved, note: 'Chương trình chi đoàn' },
        { label: 'Tổng Số Đoàn Viên', value: `${stats.totalDoanVien.toLocaleString('vi-VN')} ĐV`, note: `Trên ${stats.totalSV.toLocaleString('vi-VN')} SV` },
        { label: 'Lượt ĐV Tham Gia', value: stats.totalDoanVienParticipations.toLocaleString('vi-VN'), note: 'Toàn bộ hoạt động' },
        { label: 'Điểm Thi Đua TB', value: `${stats.avgScore.toFixed(2)}`, note: 'Công thức: Lượt/(SVx7)' }
      ],
      columns: [
        { header: 'Hạng', key: 'rank', width: '45px', align: 'center' },
        { header: 'Mã Chi đoàn', key: 'code', width: '85px', align: 'center' },
        { header: 'Tên Lớp / Chi đoàn', key: 'name', width: '160px', align: 'left' },
        { header: 'Khoa', key: 'facultyName', width: '110px', align: 'left' },
        { header: 'Khóa', key: 'cohort', width: '60px', align: 'center' },
        { header: 'Tổng SV', key: 'totalStudents', width: '60px', align: 'right' },
        { header: 'Tổng ĐV', key: 'totalDoanVien', width: '60px', align: 'right' },
        { header: 'Tỷ lệ ĐV', key: 'doanVienRatioStr', width: '65px', align: 'center' },
        { header: 'HĐ Được Duyệt', key: 'totalActivitiesApproved', width: '75px', align: 'center' },
        { header: 'Lượt ĐV Tham Gia', key: 'totalDoanVienParticipations', width: '90px', align: 'right' },
        { header: 'Điểm Thi Đua', key: 'emulationScoreStr', width: '85px', align: 'right' },
        { header: 'Xếp Loại Thi Đua', key: 'rankGrade', width: '140px', align: 'left' }
      ],
      rows: filteredRows.map((r) => ({
        rank: r.rank,
        code: r.code,
        name: r.name,
        facultyName: r.facultyName,
        cohort: r.cohort,
        totalStudents: r.totalStudents,
        totalDoanVien: r.totalDoanVien,
        doanVienRatioStr: `${r.doanVienRatio}%`,
        totalActivitiesApproved: r.totalActivitiesApproved,
        totalDoanVienParticipations: r.totalDoanVienParticipations,
        emulationScoreStr: r.emulationScore.toFixed(2),
        rankGrade: r.rankGrade
      }))
    };
  }, [facultyFilter, cohortFilter, academicYear, user, filteredRows, stats]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header & KPI Bento Cards: Thống kê kết quả Chi đoàn theo 4 chỉ số chuẩn */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Chỉ số 1: Tổng số hoạt động được phê duyệt */}
        <div className="bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/60 rounded-2xl p-4.5 shadow-xs flex items-center justify-between group">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              1. HĐ Được Phê Duyệt
            </span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              {stats.totalActsApproved}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Hoạt động cấp Chi đoàn được phê duyệt
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800 group-hover:scale-105 transition-transform">
            <Building className="w-6 h-6" />
          </div>
        </div>

        {/* Chỉ số 2: Tổng số đoàn viên */}
        <div className="bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-900/60 rounded-2xl p-4.5 shadow-xs flex items-center justify-between group">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-300 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              2. Tổng Số Đoàn Viên
            </span>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1">
              {stats.totalDoanVien.toLocaleString('vi-VN')}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Trên <strong className="text-slate-800 dark:text-slate-200">{stats.totalSV.toLocaleString('vi-VN')}</strong> SV ({stats.totalSV > 0 ? Math.round((stats.totalDoanVien / stats.totalSV) * 100) : 0}%)
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Chỉ số 3: Tổng số lượt đoàn viên tham gia hoạt động */}
        <div className="bg-white dark:bg-slate-900 border border-sky-200/80 dark:border-sky-900/60 rounded-2xl p-4.5 shadow-xs flex items-center justify-between group">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-sky-600" />
              3. Lượt ĐV Tham Gia HĐ
            </span>
            <div className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono mt-1">
              {stats.totalDoanVienParticipations.toLocaleString('vi-VN')}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tổng lượt tham gia các hoạt động
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-200 dark:border-sky-800 group-hover:scale-105 transition-transform">
            <Medal className="w-6 h-6" />
          </div>
        </div>

        {/* Chỉ số 4: Số điểm thi đua = Tổng lượt ĐV / (Tổng SV × 7) & Xếp hạng */}
        <div className="bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/60 rounded-2xl p-4.5 shadow-xs flex items-center justify-between group">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              4. Số Điểm Thi Đua TB
            </span>
            <div className="text-2xl font-black text-amber-700 dark:text-amber-400 font-mono mt-1 flex items-baseline gap-1.5">
              <span>{stats.avgScore.toFixed(2)}</span>
              <span className="text-[10px] font-normal text-slate-500 font-sans">Lượt/(SV×7)</span>
            </div>
            <p className="text-[11px] text-amber-800 dark:text-amber-400 font-semibold mt-0.5 truncate max-w-[190px]">
              Dẫn đầu: #{stats.topBranch?.rank || 1} {stats.topBranch?.name || 'Chi đoàn'} ({stats.topBranch?.emulationScore.toFixed(2) || 0} đ)
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-black text-2xl border border-amber-200 dark:border-amber-800 shrink-0 group-hover:scale-105 transition-transform">
            🥇
          </div>
        </div>
      </div>

      {/* Banner & Toolbar with Search & Multidimensional Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
                Bảng Xếp Hạng & Kết Quả Thi Đua Chi Đoàn Lớp
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {academicYear}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Theo dõi và phân loại chất lượng hoạt động chi đoàn theo 4 mức chuẩn (Xuất sắc - Tốt - Hoàn thành - Không hoàn thành).
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
              title="Xem trước và xuất báo cáo xếp hạng thi đua Chi đoàn ra file PDF hoặc tệp ngoại tuyến"
            >
              <Printer className="w-4 h-4" />
              <span>Xuất Báo Cáo PDF</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên chi đoàn, mã lớp (DH22DTA...), khoa..."
              className="w-full pl-9.5 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
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

          {/* Select Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Lọc Đoàn Khoa */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={facultyFilter}
                onChange={e => setFacultyFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">Tất cả Đoàn Khoa & Đơn vị ({faculties.length} Đơn vị)</option>
                {faculties.map(f => (
                  <option key={f.code} value={f.code}>
                    {f.name} ({f.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Lọc Khóa */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={cohortFilter}
                onChange={e => setCohortFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">Tất cả các Khóa</option>
                {cohortOptions.map(c => (
                  <option key={c} value={c}>
                    Khóa {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Lọc Xếp loại */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
              <Award className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={rankFilter}
                onChange={e => setRankFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">Tất cả xếp loại</option>
                <option value="Xuất sắc">Xuất sắc</option>
                <option value="Tốt">Tốt</option>
                <option value="Hoàn thành">Hoàn thành</option>
                <option value="Không hoàn thành">Không hoàn thành</option>
              </select>
            </div>

            {(facultyFilter !== 'ALL' || cohortFilter !== 'ALL' || rankFilter !== 'ALL' || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setFacultyFilter(currentLevel === 3 && currentOrgCode ? currentOrgCode : 'ALL');
                  setCohortFilter('ALL');
                  setRankFilter('ALL');
                  setSearchTerm('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                title="Đặt lại bộ lọc"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Formula Callout Banner */}
      <div className="bg-gradient-to-r from-indigo-50/90 via-sky-50/70 to-emerald-50/80 dark:from-indigo-950/40 dark:via-sky-950/30 dark:to-emerald-950/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
            ∑
          </div>
          <div>
            <div className="text-xs font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
              <span>QUY CHẾ THỐNG KÊ KẾT QUẢ & XẾP HẠNG THI ĐUA CHI ĐOÀN</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-200/80 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-[10px] font-mono font-bold">
                NĂM HỌC {academicYear}
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-medium leading-relaxed">
              <strong>Số điểm thi đua</strong> = <span className="text-indigo-700 dark:text-indigo-300 font-bold underline decoration-indigo-400">Tổng số lượt đoàn viên tham gia hoạt động</span> / (<span className="text-slate-900 dark:text-slate-100 font-bold">Tổng số sinh viên × 7</span>) · <em>Được xếp hạng tự động theo số điểm thi đua từ cao xuống thấp.</em>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-900 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Chỉ tiêu định mức: <strong>7 lượt tham gia / SV / năm</strong></span>
        </div>
      </div>

      {/* 3. Main Emulation Ranking Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Bảng Xếp Hạng Kết Quả Thi Đua Chi Đoàn ({filteredRows.length} Chi đoàn)
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Xuất sắc: <strong>{stats.xuatSac}</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              Tốt: <strong>{stats.tot}</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Hoàn thành: <strong>{stats.hoanThanh}</strong>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-[11px] uppercase tracking-wider font-bold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-3.5 py-3 text-center w-14">Hạng</th>
                <th className="px-3.5 py-3">Chi Đoàn & Lớp</th>
                <th className="px-3.5 py-3">Đoàn Khoa</th>
                <th className="px-3 py-3 text-center">Tổng HĐ Được Phê Duyệt</th>
                <th className="px-3 py-3 text-center">Tổng Số Đoàn Viên</th>
                <th className="px-3 py-3 text-center">Lượt ĐV Tham Gia HĐ</th>
                <th className="px-3.5 py-3 text-center font-black text-indigo-700 dark:text-indigo-400 min-w-[155px]">
                  Số Điểm Thi Đua
                  <span className="block text-[9px] font-normal text-slate-500 lowercase">Lượt ĐV / (Tổng SV × 7)</span>
                </th>
                <th className="px-3.5 py-3 text-center">Xếp Loại Thi Đua</th>
                <th className="px-3 py-3 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Info className="w-6 h-6 text-slate-400" />
                      <span>Không tìm thấy chi đoàn nào phù hợp với bộ lọc hiện tại.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const isTop1 = row.rank === 1;
                  const isTop2 = row.rank === 2;
                  const isTop3 = row.rank === 3;

                  return (
                    <tr
                      key={`${row.code}-${row.facultyCode || ''}`}
                      onClick={() => setSelectedBranchDetail(row)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition cursor-pointer group"
                    >
                      {/* Cột 1: Hạng (Xếp theo điểm thi đua) */}
                      <td className="px-3.5 py-3.5 text-center">
                        {isTop1 ? (
                          <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-extrabold inline-flex items-center justify-center shadow-xs">
                            🥇 1
                          </span>
                        ) : isTop2 ? (
                          <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-800 border border-slate-300 font-extrabold inline-flex items-center justify-center shadow-xs">
                            🥈 2
                          </span>
                        ) : isTop3 ? (
                          <span className="w-7 h-7 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-extrabold inline-flex items-center justify-center shadow-xs">
                            🥉 3
                          </span>
                        ) : (
                          <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold inline-flex items-center justify-center font-mono text-[11px]">
                            {row.rank}
                          </span>
                        )}
                      </td>

                      {/* Cột 2: Chi Đoàn */}
                      <td className="px-3.5 py-3.5">
                        <div className="font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition">
                          {row.name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded font-bold">
                            {row.code}
                          </span>
                          <span className="text-[10px] text-slate-400">Khóa {row.cohort}</span>
                        </div>
                      </td>

                      {/* Cột 3: Khoa */}
                      <td className="px-3.5 py-3.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {row.facultyName}
                        </span>
                      </td>

                      {/* Cột 4: Tổng HĐ Được Phê Duyệt */}
                      <td className="px-3 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {row.totalActivitiesApproved} HĐ
                        </span>
                      </td>

                      {/* Cột 5: Tổng Số Đoàn Viên & Sĩ số SV (Đồng bộ 100% từ Danh mục sinh viên) */}
                      <td className="px-3 py-3.5 text-center">
                        {onNavigateToRoster ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToRoster(row.code);
                            }}
                            className="text-center group-hover:scale-105 transition"
                            title="Bấm để tra cứu danh sách đoàn viên & sinh viên Chi đoàn này tại Sổ Điểm Sinh Viên"
                          >
                            <div className="font-bold text-indigo-700 dark:text-indigo-400 hover:underline">
                              {row.totalDoanVien} ĐV
                            </div>
                            <span className="text-[10px] text-slate-500 font-semibold block">
                              /{row.totalStudents} SV ({row.doanVienRatio}%)
                            </span>
                          </button>
                        ) : (
                          <>
                            <div className="font-bold text-indigo-700 dark:text-indigo-400">
                              {row.totalDoanVien} ĐV
                            </div>
                            <span className="text-[10px] text-slate-500 font-semibold block">
                              /{row.totalStudents} SV ({row.doanVienRatio}%)
                            </span>
                          </>
                        )}
                      </td>

                      {/* Cột 6: Tổng Lượt ĐV Tham Gia Hoạt Động */}
                      <td className="px-3 py-3.5 text-center">
                        <span className="font-extrabold text-sky-700 dark:text-sky-400 font-mono text-sm">
                          {row.totalDoanVienParticipations.toLocaleString('vi-VN')}
                        </span>
                        <span className="text-[10px] text-slate-400 block">lượt ĐV</span>
                      </td>

                      {/* Cột 8: Số Điểm Thi Đua = Lượt ĐV / (Tổng SV x 7) */}
                      <td className="px-3.5 py-3.5 text-center">
                        <div
                          className="inline-flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 shadow-2xs group-hover:scale-105 transition-transform"
                          title={`Công thức tính: ${row.totalDoanVienParticipations} / (${row.totalStudents} × 7) = ${row.emulationScoreExact}`}
                        >
                          <div className="flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-amber-500" />
                            <span className="font-mono font-black text-sm">{row.emulationScore.toFixed(2)}</span>
                          </div>
                          <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-mono">
                            {row.totalDoanVienParticipations}/({row.totalStudents}×7)
                          </span>
                        </div>
                      </td>

                      {/* Cột 9: Xếp Loại Thi Đua */}
                      <td className="px-3.5 py-3.5 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] border shadow-2xs ${row.badgeStyle}`}>
                          {row.rankGrade}
                        </span>
                      </td>

                      {/* Cột 10: Chi Tiết */}
                      <td className="px-3 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBranchDetail(row);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition cursor-pointer"
                          title="Xem phân tích công thức tính điểm thi đua chi tiết"
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

      {/* 4. Branch Detail Emulation Modal */}
      {selectedBranchDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-extrabold text-lg">
                  #{selectedBranchDetail.rank}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    Hồ Sơ Thi Đua: {selectedBranchDetail.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedBranchDetail.facultyName} • Khóa {selectedBranchDetail.cohort} • Niên khóa {selectedBranchDetail.academicYear}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBranchDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 rounded-2xl text-center">
                <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300">Điểm Thi Đua</span>
                <p className="text-xl font-black text-indigo-700 dark:text-indigo-300 font-mono mt-0.5">
                  {selectedBranchDetail.emulationScore.toFixed(2)}
                </p>
                <span className="text-[9px] text-indigo-600 dark:text-indigo-400 block font-mono">
                  Lượt / (SV × 7)
                </span>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900 rounded-2xl text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">HĐ Được Phê Duyệt</span>
                <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">
                  {selectedBranchDetail.totalActivitiesApproved}
                </p>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block">hoạt động</span>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900 rounded-2xl text-center">
                <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300">Tổng Số Đoàn Viên</span>
                <p className="text-xl font-black text-purple-700 dark:text-purple-300 font-mono mt-0.5">
                  {selectedBranchDetail.totalDoanVien}
                </p>
                <span className="text-[9px] text-purple-600 dark:text-purple-400 block">
                  /{selectedBranchDetail.totalStudents} SV ({selectedBranchDetail.doanVienRatio}%)
                </span>
              </div>

              <div className="p-3 bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900 rounded-2xl text-center">
                <span className="text-[10px] uppercase font-bold text-sky-700 dark:text-sky-300">Lượt ĐV Tham Gia HĐ</span>
                <p className="text-xl font-black text-sky-700 dark:text-sky-400 font-mono mt-0.5">
                  {selectedBranchDetail.totalDoanVienParticipations.toLocaleString('vi-VN')}
                </p>
                <span className="text-[9px] text-sky-600 dark:text-sky-400 block">lượt tham gia</span>
              </div>
            </div>

            {/* Chi tiết công thức tính điểm */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <div className="font-bold flex items-center justify-between text-slate-900 dark:text-slate-100">
                <span>Chi tiết công thức điểm thi đua:</span>
                <span className="font-mono text-indigo-700 dark:text-indigo-400 font-bold">
                  {selectedBranchDetail.totalDoanVienParticipations} / ({selectedBranchDetail.totalStudents} × 7) = {selectedBranchDetail.emulationScoreExact}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                • <strong>Tử số</strong>: {selectedBranchDetail.totalDoanVienParticipations} lượt đoàn viên tham gia hoạt động.<br />
                • <strong>Mẫu số</strong>: {selectedBranchDetail.totalStudents} sinh viên × 7 (chỉ tiêu định mức hoạt động năm) = {selectedBranchDetail.totalStudents * 7}.
              </p>
            </div>

            {/* Emulation Badge Status */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                  Xếp Loại Thi Đua Chi Đoàn:
                </span>
                <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                  {selectedBranchDetail.rankGrade}
                </span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedBranchDetail.badgeStyle}`}>
                Xếp Hạng #{selectedBranchDetail.rank}
              </span>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center justify-between gap-2">
              {onNavigateToRoster ? (
                <button
                  type="button"
                  onClick={() => {
                    const c = selectedBranchDetail.code;
                    setSelectedBranchDetail(null);
                    onNavigateToRoster(c);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition"
                >
                  <Users className="w-3.5 h-3.5" />
                  Tra cứu {selectedBranchDetail.totalStudents} SV ({selectedBranchDetail.totalDoanVien} ĐV) trong Sổ Điểm
                </button>
              ) : <div />}
              <button
                type="button"
                onClick={() => setSelectedBranchDetail(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Xuất Báo Cáo Thi Đua Chi Đoàn PDF / Ngoại Tuyến */}
      <ReportPdfExportModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        reportOptions={branchReportOptions}
      />
    </div>
  );
};
