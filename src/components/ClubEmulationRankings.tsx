import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Organization, ActivitySubmission, ClubCategory, CLUB_CATEGORY_LABELS, getClubCategory, StudentScoreRecord } from '../types';
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
  Building2,
  Layers,
  Flame,
  Check,
  ShieldCheck,
  RotateCcw,
  BookOpen,
  Mail,
  Zap,
  Target,
  UserCheck,
  Percent,
  Compass,
  Tag,
  Calculator
} from 'lucide-react';
import { ReportPdfExportModal } from './ReportPdfExportModal';
import { ExportReportOptions } from '../utils/pdfExportUtils';

export interface ClubEmulationRow {
  rank: number;
  id: number;
  code: string;
  name: string;
  category: ClubCategory;
  categoryName: string;
  type: 'CLB_TRUONG' | 'CLB_KHOA';
  typeName: string;
  facultyCode?: string;
  facultyName?: string;
  email: string;
  totalStudents: number; // Tổng số sinh viên theo danh mục sinh viên
  totalMembers: number; // Tổng số sinh viên
  totalDoanVien: number; // Tổng số đoàn viên (thống kê tại danh mục sinh viên)
  totalHoiVien: number; // Số lượng hội viên
  totalSinhVien: number; // Số lượng sinh viên khác
  doanVienPercentage: number; // Tỷ lệ đoàn viên (%)
  totalActivitiesRegistered: number;
  totalActivitiesApproved: number; // Tổng số hoạt động được phê duyệt
  totalDoanVienParticipations: number; // Tổng số lượt đoàn viên tham gia hoạt động
  totalParticipantsAttended: number; // Tổng lượt tham dự
  emulationScore: number; // Số điểm thi đua = Tổng số lượt đoàn viên tham gia hoạt động / (Tổng số sinh viên * 7)
  emulationScoreExact: number;
  emulationTitle: string;
  badgeStyle: string;
  hostLevelScorePoint: number;
  memberList: StudentScoreRecord[];
}

export interface ClubEmulationRankingsProps {
  onNavigateToRoster?: (code: string) => void;
}

export const ClubEmulationRankings: React.FC<ClubEmulationRankingsProps> = ({ onNavigateToRoster }) => {
  const {
    organizations,
    activities,
    students,
    academicYear,
    user,
    setActiveTab,
    showToast
  } = useApp();

  const currentLevel = user.currentRole.roleLevel;
  const currentOrgCode = user.currentRole.orgCode;

  // Filter States
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | ClubCategory>('ALL'); // Lọc theo danh mục: Câu Lạc Bộ, Tổ, Đội, Nhóm
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CLB_TRUONG' | 'CLB_KHOA'>('ALL');
  const [facultyFilter, setFacultyFilter] = useState<string>('ALL');
  const [titleFilter, setTitleFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClubDetail, setSelectedClubDetail] = useState<ClubEmulationRow | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'members'>('overview');
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);

  // Danh mục 13 Khoa & Đơn vị
  const faculties = useMemo(() => {
    return organizations.filter(o => o.type === 'KHOA' || o.code === 'VC_NLD');
  }, [organizations]);

  // Tính toán kết quả thi đua Câu Lạc Bộ, Tổ, Đội, Nhóm
  const clubEmulationData = useMemo(() => {
    const clubs = organizations.filter(
      o => o.type === 'CLB_TRUONG' || o.type === 'CLB_KHOA'
    );
    const approvedActs = activities.filter(a => a.status === 'Approved');

    const rows: ClubEmulationRow[] = clubs.map(club => {
      const isTruong = club.type === 'CLB_TRUONG';
      const typeName = isTruong ? 'Cấp Trường' : 'Cấp Khoa';
      
      const catInfo = getClubCategory(club);
      const fac = club.facultyCode ? organizations.find(o => o.code === club.facultyCode) : undefined;
      const facultyName = fac ? fac.name : (club.facultyCode ? `Khoa ${club.facultyCode}` : 'Trường ĐH Nông Lâm');

      // 1. Tổng số hoạt động được phê duyệt do Câu Lạc Bộ, Tổ, Đội, Nhóm tổ chức
      const clubActs = activities.filter(a => a.orgCode === club.code);
      const totalActivitiesRegistered = clubActs.length;
      const totalActivitiesApproved = clubActs.filter(a => a.status === 'Approved').length;

      // 2. Tổng số đoàn viên (Phần số lượng đoàn viên được tính theo số đoàn viên có thống kê tại danh mục sinh viên)
      const clubCodeUpper = club.code.trim().toUpperCase();
      const clubNameLower = club.name.trim().toLowerCase();
      const matchedStudents = students.filter(s => {
        if (s.clubCode && s.clubCode.trim().toUpperCase() === clubCodeUpper) return true;
        if (s.clubCodes && Array.isArray(s.clubCodes) && s.clubCodes.some(c => c && c.trim().toUpperCase() === clubCodeUpper)) return true;
        if (s.clubName && s.clubName.trim().toLowerCase() === clubNameLower) return true;
        return false;
      });
      // Đếm chính xác số đoàn viên có trong danh mục sinh viên (membershipType: DOAN_VIEN)
      const totalDoanVien = matchedStudents.filter(s => s.membershipType === 'DOAN_VIEN').length;
      const totalHoiVien = matchedStudents.filter(s => s.membershipType === 'HOI_VIEN').length;
      const totalSinhVien = matchedStudents.filter(s => s.membershipType === 'SINH_VIEN').length;
      // Tổng số sinh viên của đơn vị theo danh mục sinh viên
      const totalStudents = matchedStudents.length;
      const totalMembers = totalStudents;
      const doanVienPercentage = totalStudents > 0
        ? Number(((totalDoanVien / totalStudents) * 100).toFixed(1))
        : 0;

      // 3. Tổng số lượt đoàn viên tham gia hoạt động (Tính chính xác 100% từ danh sách sinh viên tham gia hoạt động)
      const clubDoanVienStudents = matchedStudents.filter(s => s.membershipType === 'DOAN_VIEN');
      const totalDoanVienParticipations = clubDoanVienStudents.reduce((sum, std) => {
        const count = approvedActs.filter(a => a.participants?.some(p => p.studentId === std.studentId)).length;
        return sum + count;
      }, 0);

      // 4. Số điểm thi đua = Tổng số lượt đoàn viên tham gia hoạt động / (Tổng số sinh viên * 7)
      const rawScore = totalStudents > 0
        ? totalDoanVienParticipations / (totalStudents * 7)
        : 0;
      const emulationScore = Number(rawScore.toFixed(2));
      const emulationScoreExact = Number(rawScore.toFixed(4));

      return {
        rank: 1,
        id: club.id,
        code: club.code,
        name: club.name,
        category: catInfo.category,
        categoryName: catInfo.label,
        type: club.type as 'CLB_TRUONG' | 'CLB_KHOA',
        typeName,
        facultyCode: club.facultyCode,
        facultyName,
        email: club.email1 || `${club.code.toLowerCase()}@tuoitrenonglam.com`,
        totalStudents,
        totalMembers,
        totalDoanVien,
        totalHoiVien,
        totalSinhVien,
        doanVienPercentage,
        totalActivitiesRegistered,
        totalActivitiesApproved,
        totalDoanVienParticipations,
        totalParticipantsAttended: totalDoanVienParticipations,
        emulationScore,
        emulationScoreExact,
        emulationTitle: 'Hoàn Thành Nhiệm Vụ',
        badgeStyle: 'bg-slate-100 text-slate-700 border-slate-200',
        hostLevelScorePoint: club.hostLevelScorePoint || (isTruong ? 2 : 1),
        memberList: matchedStudents
      };
    });

    // Được xếp hạng theo số điểm thi đua giảm dần
    rows.sort((a, b) => b.emulationScoreExact - a.emulationScoreExact || b.totalDoanVienParticipations - a.totalDoanVienParticipations);

    // Gán thứ hạng và danh hiệu thi đua
    rows.forEach((r, idx) => {
      r.rank = idx + 1;
      if (r.rank === 1) {
        r.emulationTitle = `Cờ Luân Lưu ${r.categoryName} Xuất Sắc Nhất`;
        r.badgeStyle = 'bg-amber-100 text-amber-900 border-amber-300 ring-1 ring-amber-400 font-bold';
      } else if (r.rank <= 4) {
        r.emulationTitle = `${r.categoryName} Xuất Sắc Dẫn Đầu`;
        r.badgeStyle = 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
      } else if (r.rank <= 12) {
        r.emulationTitle = `${r.categoryName} Thi Đua Tốt`;
        r.badgeStyle = 'bg-sky-100 text-sky-900 border-sky-300 font-bold';
      } else {
        r.emulationTitle = `${r.categoryName} Hoàn Thành Nhiệm Vụ`;
        r.badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200 font-medium';
      }
    });

    return rows;
  }, [organizations, activities, students]);

  // Lọc dữ liệu theo Danh mục (CLB, Tổ, Đội, Nhóm), Phân cấp, Khoa, Danh hiệu & Tìm kiếm
  const filteredRows = useMemo(() => {
    return clubEmulationData.filter(r => {
      if (categoryFilter !== 'ALL' && r.category !== categoryFilter) return false;
      if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;
      if (facultyFilter !== 'ALL' && r.facultyCode !== facultyFilter) return false;
      if (titleFilter !== 'ALL') {
        if (titleFilter === 'Xuất sắc' && !r.emulationTitle.includes('Xuất Sắc')) return false;
        if (titleFilter === 'Tốt' && !r.emulationTitle.includes('Tốt')) return false;
        if (titleFilter === 'Hoàn thành' && !r.emulationTitle.includes('Hoàn Thành')) return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const match =
          r.name.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.categoryName.toLowerCase().includes(q) ||
          (r.facultyName && r.facultyName.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [clubEmulationData, categoryFilter, typeFilter, facultyFilter, titleFilter, searchTerm]);

  // Thống kê tổng quan & Số lượng Đoàn viên theo Câu Lạc Bộ, Tổ, Đội, Nhóm
  const stats = useMemo(() => {
    const total = filteredRows.length;
    const clbTruongCount = filteredRows.filter(r => r.type === 'CLB_TRUONG').length;
    const clbKhoaCount = filteredRows.filter(r => r.type === 'CLB_KHOA').length;

    // Trích xuất danh sách sinh viên & đoàn viên độc nhất từ các đơn vị đang hiển thị (đồng bộ 100% với danh mục sinh viên)
    const getUnitMetrics = (units: ClubEmulationRow[]) => {
      const studentMap = new Map<string, StudentScoreRecord>();
      units.forEach(u => {
        (u.memberList || []).forEach(m => {
          if (m?.studentId && !studentMap.has(m.studentId)) {
            studentMap.set(m.studentId, m);
          }
        });
      });
      const uniqueList = Array.from(studentMap.values());
      const uniqueDoanVien = uniqueList.filter(s => s.membershipType === 'DOAN_VIEN').length;
      const pct = uniqueList.length > 0 ? Number(((uniqueDoanVien / uniqueList.length) * 100).toFixed(1)) : 0;
      return {
        members: uniqueList.length,
        doanVien: uniqueDoanVien,
        pct
      };
    };

    // Tổng số lượng đoàn viên & thành viên (Đồng bộ chuẩn 100% từ Danh mục sinh viên, không trùng lặp)
    const overallMetrics = getUnitMetrics(filteredRows);
    const totalDoanVien = overallMetrics.doanVien;
    const totalMembers = overallMetrics.members;
    const avgDoanVienPct = overallMetrics.pct;

    // Thống kê số lượng đoàn viên theo từng danh mục: Câu Lạc Bộ, Tổ, Đội, Nhóm
    const clbUnits = filteredRows.filter(r => r.category === 'CLB');
    const toUnits = filteredRows.filter(r => r.category === 'TO');
    const doiUnits = filteredRows.filter(r => r.category === 'DOI');
    const nhomUnits = filteredRows.filter(r => r.category === 'NHOM');

    const clbMetrics = getUnitMetrics(clbUnits);
    const toMetrics = getUnitMetrics(toUnits);
    const doiMetrics = getUnitMetrics(doiUnits);
    const nhomMetrics = getUnitMetrics(nhomUnits);

    const clbStats = {
      count: clbUnits.length,
      doanVien: clbMetrics.doanVien,
      members: clbMetrics.members,
      pct: clbMetrics.pct
    };

    const toStats = {
      count: toUnits.length,
      doanVien: toMetrics.doanVien,
      members: toMetrics.members,
      pct: toMetrics.pct
    };

    const doiStats = {
      count: doiUnits.length,
      doanVien: doiMetrics.doanVien,
      members: doiMetrics.members,
      pct: doiMetrics.pct
    };

    const nhomStats = {
      count: nhomUnits.length,
      doanVien: nhomMetrics.doanVien,
      members: nhomMetrics.members,
      pct: nhomMetrics.pct
    };

    const totalActs = filteredRows.reduce((sum, r) => sum + r.totalActivitiesApproved, 0);
    const totalDoanVienParticipations = filteredRows.reduce((sum, r) => sum + r.totalDoanVienParticipations, 0);
    const totalAttendance = filteredRows.reduce((sum, r) => sum + r.totalParticipantsAttended, 0);
    const avgScore = total > 0
      ? Number((filteredRows.reduce((sum, r) => sum + r.emulationScore, 0) / total).toFixed(2))
      : 0;

    return {
      total,
      clbTruongCount,
      clbKhoaCount,
      totalDoanVien,
      totalMembers,
      avgDoanVienPct,
      clbStats,
      toStats,
      doiStats,
      nhomStats,
      totalActs,
      totalDoanVienParticipations,
      totalAttendance,
      avgScore
    };
  }, [filteredRows]);

  // Xuất file Excel chuẩn thi đua Câu Lạc Bộ, Tổ, Đội, Nhóm
  const handleExportExcel = () => {
    try {
      const headers = [
        'Hạng',
        'Mã Đơn Vị',
        'Tên Câu Lạc Bộ / Tổ / Đội / Nhóm',
        'Danh Mục',
        'Phân Cấp',
        'Đơn Vị Chủ Quản',
        'Email Liên Hệ',
        'Tổng Số Đoàn Viên (Thống kê danh mục SV)',
        'Tổng Số Sinh Viên',
        'Tỷ Lệ Đoàn Viên (%)',
        'Tổng HĐ Được Phê Duyệt',
        'Tổng Lượt Đoàn Viên Tham Gia Hoạt Động',
        'Số Điểm Thi Đua (Lượt ĐV / (Tổng SV x 7))',
        'Danh Hiệu Thi Đua'
      ];

      const dataRows = filteredRows.map(r => [
        r.rank,
        r.code,
        r.name,
        r.categoryName,
        r.typeName,
        r.facultyName || 'Trường ĐH Nông Lâm',
        r.email,
        r.totalDoanVien,
        r.totalStudents,
        `${r.doanVienPercentage}%`,
        r.totalActivitiesApproved,
        r.totalDoanVienParticipations,
        r.emulationScore.toFixed(2),
        r.emulationTitle
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'ThongKe_CLB_To_Doi_Nhom');
      XLSX.writeFile(wb, `ThongKe_DoanVien_CLB_To_Doi_Nhom_NLU_${academicYear.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
      showToast(`Đã xuất báo cáo thống kê đoàn viên của ${filteredRows.length} CLB, Tổ, Đội, Nhóm ra file Excel thành công!`, 'success');
    } catch (e) {
      console.error(e);
      showToast('Có lỗi xảy ra khi tạo file Excel', 'error');
    }
  };

  const clubReportOptions: ExportReportOptions = useMemo(() => {
    const scope = facultyFilter === 'ALL' ? 'Toàn trường' : `Khoa ${facultyFilter}`;
    const catLabel = categoryFilter === 'ALL' ? 'Tất cả Câu Lạc Bộ, Tổ, Đội, Nhóm' : `Danh mục: ${CLUB_CATEGORY_LABELS[categoryFilter]}`;
    return {
      title: 'BẢNG THỐNG KÊ ĐOÀN VIÊN & KẾT QUẢ THI ĐUA CÂU LẠC BỘ, TỔ, ĐỘI, NHÓM',
      subTitle: 'HỆ THỐNG QUẢN LÝ ĐOÀN VIÊN & ĐÁNH GIÁ THI ĐUA PHONG TRÀO NLU',
      academicYear,
      semester: 'Cả Năm Học',
      unitName: 'BAN THƯỜNG VỤ ĐOÀN TRƯỜNG ĐH NÔNG LÂM TP.HCM',
      scopeLabel: `${scope} · ${catLabel} · ${typeFilter === 'ALL' ? 'Cấp Trường & Cấp Khoa' : typeFilter === 'CLB_TRUONG' ? 'Cấp Trường' : 'Cấp Khoa'}`,
      generatedBy: `${user?.fullName || 'Ban Quản Lý Đoàn - Hội'} (${user?.currentRole?.roleName || 'Cán bộ Đoàn'})`,
      signerTitle: 'TM. BAN THƯỜNG VỤ ĐOÀN TRƯỜNG\nBÍ THƯ',
      signerName: 'ThS. Nguyễn Văn A',
      orientation: 'landscape',
      summaryStats: [
        { label: 'Tổng số đơn vị', value: filteredRows.length, note: 'Bản ghi được lọc' },
        { label: 'Tổng số đoàn viên', value: stats.totalDoanVien.toLocaleString('vi-VN'), note: `Tỷ lệ ${stats.avgDoanVienPct}% sinh viên` },
        { label: 'Tổng HĐ Phê Duyệt', value: stats.totalActs, note: 'Chương trình được duyệt' },
        { label: 'Tổng Lượt ĐV Tham Gia', value: stats.totalDoanVienParticipations.toLocaleString('vi-VN'), note: 'Lượt đoàn viên' }
      ],
      columns: [
        { header: 'Hạng', key: 'rank', width: '45px', align: 'center' },
        { header: 'Danh Mục', key: 'categoryName', width: '85px', align: 'center' },
        { header: 'Mã ĐV', key: 'code', width: '75px', align: 'center' },
        { header: 'Tên CLB / Tổ / Đội / Nhóm', key: 'name', width: '180px', align: 'left' },
        { header: 'Phân Cấp', key: 'typeName', width: '90px', align: 'center' },
        { header: 'Chủ Quản', key: 'unitLabel', width: '120px', align: 'left' },
        { header: 'Tổng Số ĐV', key: 'totalDoanVien', width: '75px', align: 'right' },
        { header: 'Tổng Số SV', key: 'totalStudents', width: '75px', align: 'right' },
        { header: 'Tỷ Lệ ĐV', key: 'doanVienPercentage', width: '70px', align: 'center' },
        { header: 'HĐ Phê Duyệt', key: 'totalActivitiesApproved', width: '75px', align: 'center' },
        { header: 'Lượt ĐV Tham Gia', key: 'totalDoanVienParticipations', width: '85px', align: 'right' },
        { header: 'Số Điểm Thi Đua', key: 'emulationScore', width: '85px', align: 'right' },
        { header: 'Danh Hiệu Thi Đua', key: 'emulationTitle', width: '150px', align: 'left' }
      ],
      rows: filteredRows.map((r) => ({
        rank: r.rank,
        categoryName: r.categoryName,
        code: r.code,
        name: r.name,
        typeName: r.typeName,
        unitLabel: r.facultyName || 'Trường ĐH Nông Lâm',
        totalDoanVien: r.totalDoanVien,
        totalStudents: r.totalStudents,
        doanVienPercentage: `${r.doanVienPercentage}%`,
        totalActivitiesApproved: r.totalActivitiesApproved,
        totalDoanVienParticipations: r.totalDoanVienParticipations,
        emulationScore: r.emulationScore.toFixed(2),
        emulationTitle: r.emulationTitle
      }))
    };
  }, [categoryFilter, typeFilter, facultyFilter, academicYear, user, filteredRows, stats]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header & Bento Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng số CLB, Tổ, Đội, Nhóm */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tổng CLB, Tổ, Đội, Nhóm
            </span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono mt-1">
              {stats.total} <span className="text-xs font-medium text-slate-400">đơn vị</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              <span className="font-semibold text-indigo-600">{stats.clbTruongCount} Cấp Trường</span> •{' '}
              <span className="font-semibold text-emerald-600">{stats.clbKhoaCount} Cấp Khoa</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: TỔNG SỐ ĐOÀN VIÊN (Trọng tâm yêu cầu) */}
        <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-800/60 rounded-2xl p-4.5 shadow-xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                Tổng Số Đoàn Viên
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                {stats.avgDoanVienPct}%
              </span>
            </div>
            <div className="text-2xl font-black text-blue-700 dark:text-blue-400 font-mono mt-1">
              {stats.totalDoanVien.toLocaleString('vi-VN')} <span className="text-xs font-normal text-blue-600/80">/ {stats.totalMembers.toLocaleString('vi-VN')} SV</span>
            </div>
            <p className="text-[11px] text-blue-700/90 dark:text-blue-300 font-semibold mt-0.5">
              Phần số lượng đoàn viên được tính theo số đoàn viên có thống kê tại danh mục sinh viên
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: TỔNG SỐ HOẠT ĐỘNG ĐƯỢC PHÊ DUYỆT */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tổng HĐ Được Phê Duyệt
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              {stats.totalActs} <span className="text-xs font-normal text-slate-400">hoạt động</span>
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
              Được BTV Đoàn trường / Cấp trên thẩm định duyệt
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: TỔNG SỐ LƯỢT ĐOÀN VIÊN THAM GIA HOẠT ĐỘNG & ĐIỂM THI ĐUA */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tổng Lượt ĐV Tham Gia HĐ
            </span>
            <div className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 font-mono mt-1">
              {stats.totalDoanVienParticipations.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-400">lượt</span>
            </div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5 font-mono">
              Điểm thi đua TB: {stats.avgScore} đ (Lượt/(SV×7))
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Banner Thống Kê Số Lượng Đoàn Viên Theo 4 Danh Mục Chuẩn */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4.5 shadow-xs ring-1 ring-blue-500/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <UserCheck className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Thống Kê Số Lượng Đoàn Viên Theo Danh Mục (CLB, Tổ, Đội, Nhóm)
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                  <CheckCircle2 className="w-3 h-3 text-blue-600" />
                  Được tính theo số đoàn viên có thống kê tại danh mục sinh viên
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Số lượng đoàn viên được đồng bộ tự động từ danh mục sinh viên theo từng Câu Lạc Bộ, Tổ, Đội, Nhóm. Nhấp vào từng danh mục dưới đây để lọc nhanh danh sách đơn vị.
              </p>
            </div>
          </div>

          {categoryFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 self-start sm:self-auto cursor-pointer px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Xem tất cả 4 danh mục
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Danh mục 1: Câu Lạc Bộ */}
          <button
            type="button"
            onClick={() => setCategoryFilter(categoryFilter === 'CLB' ? 'ALL' : 'CLB')}
            className={`p-3.5 rounded-xl border text-left transition cursor-pointer relative overflow-hidden group ${
              categoryFilter === 'CLB'
                ? 'bg-purple-50/90 dark:bg-purple-950/50 border-purple-400 ring-2 ring-purple-500/30'
                : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-purple-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Câu Lạc Bộ (CLB)
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200">
                {stats.clbStats.count} đơn vị
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
                {stats.clbStats.doanVien.toLocaleString('vi-VN')}
              </span>
              <span className="text-xs font-bold text-purple-600">Đoàn viên</span>
              <span className="text-[11px] text-slate-500 font-medium ml-auto font-mono">
                / {stats.clbStats.members} SV ({stats.clbStats.pct}%)
              </span>
            </div>
            <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, stats.clbStats.pct)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-purple-500 shrink-0" />
              Thống kê từ danh mục sinh viên
            </p>
          </button>

          {/* Danh mục 2: Tổ */}
          <button
            type="button"
            onClick={() => setCategoryFilter(categoryFilter === 'TO' ? 'ALL' : 'TO')}
            className={`p-3.5 rounded-xl border text-left transition cursor-pointer relative overflow-hidden group ${
              categoryFilter === 'TO'
                ? 'bg-amber-50/90 dark:bg-amber-950/50 border-amber-400 ring-2 ring-amber-500/30'
                : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Tổ Chuyên Môn
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                {stats.toStats.count} đơn vị
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
                {stats.toStats.doanVien.toLocaleString('vi-VN')}
              </span>
              <span className="text-xs font-bold text-amber-600">Đoàn viên</span>
              <span className="text-[11px] text-slate-500 font-medium ml-auto font-mono">
                / {stats.toStats.members} SV ({stats.toStats.pct}%)
              </span>
            </div>
            <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, stats.toStats.pct)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-amber-500 shrink-0" />
              Thống kê từ danh mục sinh viên
            </p>
          </button>

          {/* Danh mục 3: Đội */}
          <button
            type="button"
            onClick={() => setCategoryFilter(categoryFilter === 'DOI' ? 'ALL' : 'DOI')}
            className={`p-3.5 rounded-xl border text-left transition cursor-pointer relative overflow-hidden group ${
              categoryFilter === 'DOI'
                ? 'bg-rose-50/90 dark:bg-rose-950/50 border-rose-400 ring-2 ring-rose-500/30'
                : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-rose-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Đội Xung Kích / Văn Nghệ
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200">
                {stats.doiStats.count} đơn vị
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
                {stats.doiStats.doanVien.toLocaleString('vi-VN')}
              </span>
              <span className="text-xs font-bold text-rose-600">Đoàn viên</span>
              <span className="text-[11px] text-slate-500 font-medium ml-auto font-mono">
                / {stats.doiStats.members} SV ({stats.doiStats.pct}%)
              </span>
            </div>
            <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-rose-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, stats.doiStats.pct)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-rose-500 shrink-0" />
              Thống kê từ danh mục sinh viên
            </p>
          </button>

          {/* Danh mục 4: Nhóm */}
          <button
            type="button"
            onClick={() => setCategoryFilter(categoryFilter === 'NHOM' ? 'ALL' : 'NHOM')}
            className={`p-3.5 rounded-xl border text-left transition cursor-pointer relative overflow-hidden group ${
              categoryFilter === 'NHOM'
                ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-400 ring-2 ring-emerald-500/30'
                : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Nhóm NCKH / Học Thuật
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                {stats.nhomStats.count} đơn vị
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
                {stats.nhomStats.doanVien.toLocaleString('vi-VN')}
              </span>
              <span className="text-xs font-bold text-emerald-600">Đoàn viên</span>
              <span className="text-[11px] text-slate-500 font-medium ml-auto font-mono">
                / {stats.nhomStats.members} SV ({stats.nhomStats.pct}%)
              </span>
            </div>
            <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, stats.nhomStats.pct)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-emerald-500 shrink-0" />
              Thống kê từ danh mục sinh viên
            </p>
          </button>
        </div>
      </div>

      {/* 3. Banner & Toolbar with Search & Filter */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
                Thống Kê Đoàn Viên & Thi Đua CLB, Tổ, Đội, Nhóm
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                {academicYear}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Thống kê số lượng đoàn viên, tỷ lệ tập hợp thanh niên và kết quả thi đua của các đơn vị CLB, Tổ, Đội, Nhóm theo danh mục.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">

            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              title="Xuất bảng thống kê đoàn viên và thi đua CLB, Tổ, Đội, Nhóm ra file Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất Excel Thống Kê</span>
            </button>
            <button
              type="button"
              onClick={() => setShowPdfModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              title="Xem trước và xuất báo cáo xếp hạng thi đua CLB ra file PDF hoặc tệp ngoại tuyến"
            >
              <Printer className="w-4 h-4" />
              <span>Xuất Báo Cáo PDF</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tên CLB, Tổ, Đội, Nhóm, mã đơn vị, email..."
              className="w-full pl-9.5 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
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
            {/* Lọc Theo Danh Mục: CLB, Tổ, Đội, Nhóm */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value as any)}
                className="bg-transparent border-none text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">Tất cả danh mục (CLB, Tổ, Đội, Nhóm)</option>
                <option value="CLB">Câu Lạc Bộ (CLB)</option>
                <option value="TO">Tổ</option>
                <option value="DOI">Đội</option>
                <option value="NHOM">Nhóm</option>
              </select>
            </div>

            {/* Lọc Phân Cấp */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as any)}
                className="bg-transparent border-none text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">Tất cả cấp bậc</option>
                <option value="CLB_TRUONG">Cấp Trường</option>
                <option value="CLB_KHOA">Trực thuộc Khoa</option>
              </select>
            </div>

            {/* Lọc Khoa chủ quản */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={facultyFilter}
                onChange={e => setFacultyFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">Tất cả Khoa chủ quản</option>
                {faculties.map(f => (
                  <option key={f.code} value={f.code}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Lọc Danh hiệu thi đua */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
              <Award className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={titleFilter}
                onChange={e => setTitleFilter(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">Tất cả danh hiệu</option>
                <option value="Xuất sắc">Xuất sắc dẫn đầu</option>
                <option value="Tốt">Thi đua tốt</option>
                <option value="Hoàn thành">Hoàn thành nhiệm vụ</option>
              </select>
            </div>

            {(categoryFilter !== 'ALL' || typeFilter !== 'ALL' || facultyFilter !== 'ALL' || titleFilter !== 'ALL' || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('ALL');
                  setTypeFilter('ALL');
                  setFacultyFilter('ALL');
                  setTitleFilter('ALL');
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

      {/* 5. Formula & Policy Callout Banner */}
      <div className="bg-gradient-to-r from-amber-50 via-orange-50/50 to-indigo-50/50 dark:from-slate-800 dark:via-slate-850 dark:to-slate-800 rounded-2xl border border-amber-200/80 dark:border-amber-800/40 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <Calculator className="w-4.5 h-4.5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-950 dark:text-amber-200">
                Quy Chuẩn Thống Kê & Công Thức Tính Điểm Thi Đua (CLB, Tổ, Đội, Nhóm)
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                • <strong>Số lượng đoàn viên:</strong> Được tính chính xác theo số đoàn viên có thống kê tại danh mục sinh viên.<br />
                • <strong>Số điểm thi đua:</strong> <code className="bg-amber-100/90 dark:bg-amber-950 px-1.5 py-0.5 rounded font-mono font-bold text-amber-900 dark:text-amber-300">Tổng số lượt đoàn viên tham gia hoạt động / (Tổng số sinh viên × 7)</code>.<br />
                • <strong>Xếp hạng:</strong> Tự động xếp hạng theo số điểm thi đua từ cao xuống thấp.
              </p>
            </div>
          </div>
          <div className="self-end sm:self-center shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 font-bold text-xs border border-amber-300">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              Chuẩn BTV Đoàn Trường
            </span>
          </div>
        </div>
      </div>

      {/* 6. Main Emulation Ranking & Đoàn viên Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Danh sách kết quả & Thống kê đoàn viên ({filteredRows.length} đơn vị)
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-400">
              <UserCheck className="w-3.5 h-3.5" />
              Tổng Đoàn viên: <strong>{stats.totalDoanVien.toLocaleString('vi-VN')}</strong> ({stats.avgDoanVienPct}%)
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Cấp trường: <strong>{stats.clbTruongCount}</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              Cấp khoa: <strong>{stats.clbKhoaCount}</strong>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-[11px] uppercase tracking-wider font-bold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-center w-14">Hạng</th>
                <th className="px-3 py-3 text-center">Danh Mục</th>
                <th className="px-4 py-3">Tên CLB / Tổ / Đội / Nhóm</th>
                <th className="px-4 py-3">Phân Cấp & Chủ Quản</th>
                <th className="px-4 py-3 text-center font-extrabold text-blue-700 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20">
                  Tổng Số Đoàn Viên
                </th>
                <th className="px-4 py-3 text-center font-extrabold text-emerald-700 dark:text-emerald-400">
                  Tổng HĐ Phê Duyệt
                </th>
                <th className="px-4 py-3 text-center font-extrabold text-sky-700 dark:text-sky-400 bg-sky-50/40 dark:bg-sky-950/20">
                  Tổng Lượt ĐV Tham Gia HĐ
                </th>
                <th className="px-4 py-3 text-center font-extrabold text-amber-700 dark:text-amber-400 bg-amber-50/40 dark:bg-amber-950/20">
                  Số Điểm Thi Đua
                </th>
                <th className="px-4 py-3 text-center">Danh Hiệu Thi Đua</th>
                <th className="px-4 py-3 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Info className="w-6 h-6 text-slate-400" />
                      <span>Không tìm thấy CLB, Tổ, Đội, Nhóm nào phù hợp với bộ lọc hiện tại.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const isTop1 = row.rank === 1;
                  const isTop2 = row.rank === 2;
                  const isTop3 = row.rank === 3;

                  // Màu badge danh mục
                  const categoryBadgeColor =
                    row.category === 'CLB'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                      : row.category === 'TO'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      : row.category === 'DOI'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';

                  return (
                    <tr
                      key={`${row.code}-${row.category || ''}`}
                      onClick={() => {
                        setSelectedClubDetail(row);
                        setDetailTab('overview');
                      }}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition cursor-pointer group"
                    >
                      {/* Cột 1: Hạng */}
                      <td className="px-4 py-3.5 text-center">
                        {isTop1 ? (
                          <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-extrabold inline-flex items-center justify-center shadow-xs">
                            🏆 1
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
                          <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold inline-flex items-center justify-center">
                            {row.rank}
                          </span>
                        )}
                      </td>

                      {/* Cột 2: Danh Mục (Badge Câu Lạc Bộ, Tổ, Đội, Nhóm) */}
                      <td className="px-3 py-3.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${categoryBadgeColor}`}>
                          {row.categoryName}
                        </span>
                      </td>

                      {/* Cột 3: Tên Đơn Vị */}
                      <td className="px-4 py-3.5">
                        <div className="font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition">
                          {row.name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded font-bold">
                            {row.code}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[180px]">{row.email}</span>
                        </div>
                      </td>

                      {/* Cột 4: Phân cấp & Chủ Quản */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          row.type === 'CLB_TRUONG'
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        }`}>
                          {row.typeName}
                        </span>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5 truncate max-w-[150px]">
                          {row.facultyName}
                        </div>
                      </td>

                      {/* Cột 5: TỔNG SỐ ĐOÀN VIÊN (Thống kê từ danh mục sinh viên) */}
                      <td className="px-4 py-3.5 text-center bg-blue-50/20 dark:bg-blue-950/10">
                        {onNavigateToRoster ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToRoster(row.code);
                            }}
                            className="flex flex-col items-center group-hover:scale-105 transition cursor-pointer"
                            title="Bấm để tra cứu danh sách đoàn viên & thành viên đơn vị này tại Sổ Điểm Sinh Viên"
                          >
                            <div className="flex items-baseline gap-1 font-mono">
                              <span className="font-black text-blue-700 dark:text-blue-400 text-sm hover:underline">
                                {row.totalDoanVien}
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium">/ {row.totalStudents} SV</span>
                            </div>
                            <div className="w-24 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden mt-1">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full"
                                style={{ width: `${Math.min(100, row.doanVienPercentage)}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                              {row.doanVienPercentage}% Đoàn viên
                            </span>
                          </button>
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="flex items-baseline gap-1 font-mono">
                              <span className="font-black text-blue-700 dark:text-blue-400 text-sm">
                                {row.totalDoanVien}
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium">/ {row.totalStudents} SV</span>
                            </div>
                            <div className="w-24 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden mt-1">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full"
                                style={{ width: `${Math.min(100, row.doanVienPercentage)}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                              {row.doanVienPercentage}% Đoàn viên
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Cột 6: TỔNG SỐ HOẠT ĐỘNG ĐƯỢC PHÊ DUYỆT */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-extrabold text-emerald-700 dark:text-emerald-400 font-mono text-sm">
                          {row.totalActivitiesApproved}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          / {row.totalActivitiesRegistered} HĐ đăng ký
                        </span>
                      </td>

                      {/* Cột 7: TỔNG SỐ LƯỢT ĐOÀN VIÊN THAM GIA HOẠT ĐỘNG */}
                      <td className="px-4 py-3.5 text-center bg-sky-50/20 dark:bg-sky-950/10">
                        <span className="font-extrabold text-sky-700 dark:text-sky-400 font-mono text-sm">
                          {row.totalDoanVienParticipations.toLocaleString('vi-VN')}
                        </span>
                        <span className="text-[10px] text-slate-500 block font-medium">lượt đoàn viên</span>
                      </td>

                      {/* Cột 8: SỐ ĐIỂM THI ĐUA = Lượt ĐV / (Tổng SV × 7) */}
                      <td className="px-4 py-3.5 text-center bg-amber-50/20 dark:bg-amber-950/10">
                        <div 
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-mono font-black text-sm shadow-2xs"
                          title={`Công thức: ${row.totalDoanVienParticipations} / (${row.totalStudents} × 7) = ${row.emulationScoreExact}`}
                        >
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          <span>{row.emulationScore.toFixed(2)}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                          {row.totalDoanVienParticipations} / ({row.totalStudents}×7)
                        </span>
                      </td>

                      {/* Cột 9: Danh hiệu */}
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] border shadow-2xs ${row.badgeStyle}`}>
                          {row.emulationTitle}
                        </span>
                      </td>

                      {/* Cột 10: Chi Tiết */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClubDetail(row);
                            setDetailTab('overview');
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 transition cursor-pointer"
                          title="Xem chi tiết hồ sơ & danh sách đoàn viên"
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

      {/* 6. Club Detail Modal with Member Roster Tab */}
      {selectedClubDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-extrabold text-lg">
                  #{selectedClubDetail.rank}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800">
                      {selectedClubDetail.categoryName}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                      {selectedClubDetail.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedClubDetail.typeName} • Chủ quản: {selectedClubDetail.facultyName} • Email: {selectedClubDetail.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClubDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-Tabs: Tổng quan vs Danh sách Đoàn viên */}
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setDetailTab('overview')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  detailTab === 'overview'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                Tổng Quan Thi Đua
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('members')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  detailTab === 'members'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Danh Sách Đoàn Viên ({selectedClubDetail.totalDoanVien} ĐV)
              </button>
            </div>

            {detailTab === 'overview' ? (
              <>
                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 rounded-2xl text-center border border-amber-200/60">
                    <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300">Điểm Thi Đua</span>
                    <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                      {selectedClubDetail.emulationScore.toFixed(2)} đ
                    </p>
                    <span className="text-[9px] text-amber-800/80 font-mono block mt-0.5" title={`Công thức: ${selectedClubDetail.totalDoanVienParticipations} / (${selectedClubDetail.totalStudents} × 7)`}>
                      {selectedClubDetail.totalDoanVienParticipations}/({selectedClubDetail.totalStudents}×7)
                    </span>
                  </div>

                  <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-2xl text-center border border-blue-200/50">
                    <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300">Tổng Số Đoàn Viên</span>
                    <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                      {selectedClubDetail.totalDoanVien} <span className="text-xs font-normal">/ {selectedClubDetail.totalStudents} SV</span>
                    </p>
                    <span className="text-[10px] font-bold text-blue-700">({selectedClubDetail.doanVienPercentage}%)</span>
                  </div>

                  <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl text-center border border-emerald-200/50">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">HĐ Được Phê Duyệt</span>
                    <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                      {selectedClubDetail.totalActivitiesApproved} <span className="text-xs font-normal text-slate-500">HĐ</span>
                    </p>
                    <span className="text-[10px] text-slate-500 block">/ {selectedClubDetail.totalActivitiesRegistered} đăng ký</span>
                  </div>

                  <div className="p-3 bg-sky-50/70 dark:bg-sky-950/40 rounded-2xl text-center border border-sky-200/50">
                    <span className="text-[10px] uppercase font-bold text-sky-700 dark:text-sky-300">Lượt ĐV Tham Gia HĐ</span>
                    <p className="text-xl font-extrabold text-sky-600 dark:text-sky-400 font-mono mt-0.5">
                      {selectedClubDetail.totalDoanVienParticipations.toLocaleString('vi-VN')}
                    </p>
                    <span className="text-[10px] text-slate-500 block">lượt đoàn viên</span>
                  </div>
                </div>

                {/* Membership Breakdown Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Cơ cấu thành viên thuộc {selectedClubDetail.categoryName} ({selectedClubDetail.totalMembers} người):
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-blue-100/60 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200">
                      <span className="block font-black text-base">{selectedClubDetail.totalDoanVien}</span>
                      <span className="text-[10px] font-semibold">Đoàn viên ({selectedClubDetail.doanVienPercentage}%)</span>
                    </div>
                    <div className="p-2 rounded-xl bg-teal-100/60 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200">
                      <span className="block font-black text-base">{selectedClubDetail.totalHoiVien}</span>
                      <span className="text-[10px] font-semibold">Hội viên</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-200/60 dark:bg-slate-700/50 text-slate-800 dark:text-slate-300">
                      <span className="block font-black text-base">{selectedClubDetail.totalSinhVien}</span>
                      <span className="text-[10px] font-semibold">Sinh viên khác</span>
                    </div>
                  </div>
                </div>

                {/* Emulation Badge Status */}
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                      Danh Hiệu Thi Đua Năm Học {academicYear}:
                    </span>
                    <span className="text-sm font-extrabold text-amber-800 dark:text-amber-300">
                      {selectedClubDetail.emulationTitle}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedClubDetail.badgeStyle}`}>
                    Xếp Hạng #{selectedClubDetail.rank}
                  </span>
                </div>
              </>
            ) : (
              /* Tab Danh Sách Đoàn Viên */
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Danh sách sinh viên / đoàn viên thuộc {selectedClubDetail.categoryName} ({selectedClubDetail.name}):
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px]">
                    {selectedClubDetail.totalDoanVien} Đoàn viên
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedClubDetail.memberList && selectedClubDetail.memberList.length > 0 ? (
                    selectedClubDetail.memberList.map((m) => (
                      <div key={m.studentId} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 transition">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{m.fullName}</span>
                            <span className="font-mono text-slate-500 text-[11px]">({m.studentId})</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                              m.membershipType === 'DOAN_VIEN'
                                ? 'bg-blue-100 text-blue-800'
                                : m.membershipType === 'HOI_VIEN'
                                ? 'bg-teal-100 text-teal-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {m.membershipType === 'DOAN_VIEN' ? 'Đoàn viên' : m.membershipType === 'HOI_VIEN' ? 'Hội viên' : 'Sinh viên'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Chi đoàn: {m.classCode} • Khoa {m.facultyCode} • ĐRL: {m.totalScore}đ
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          {m.approvedActivitiesCount} HĐ
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500">
                      Đang đồng bộ dữ liệu hồ sơ danh sách chi tiết của {selectedClubDetail.totalMembers} thành viên ({selectedClubDetail.totalDoanVien} đoàn viên).
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-500">
                    Có thể cập nhật hoặc gán thêm đoàn viên tại tab Bảng Điểm & Rèn Luyện.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const c = selectedClubDetail.code;
                      setSelectedClubDetail(null);
                      if (onNavigateToRoster) {
                        onNavigateToRoster(c);
                      } else {
                        setActiveTab('score-roster');
                      }
                    }}
                    className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Xem Trong Bảng Điểm →
                  </button>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
              {onNavigateToRoster ? (
                <button
                  type="button"
                  onClick={() => {
                    const c = selectedClubDetail.code;
                    setSelectedClubDetail(null);
                    onNavigateToRoster(c);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  Tra cứu {selectedClubDetail.totalStudents} thành viên ({selectedClubDetail.totalDoanVien} ĐV) trong Sổ Điểm
                </button>
              ) : <div />}
              <button
                type="button"
                onClick={() => setSelectedClubDetail(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Xuất Báo Cáo Thi Đua CLB / Đội Nhóm PDF / Ngoại Tuyến */}
      <ReportPdfExportModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        reportOptions={clubReportOptions}
      />
    </div>
  );
};

