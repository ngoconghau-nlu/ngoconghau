import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { Organization, BranchClass, ChiDoanRank } from '../types';
import {
  Building2,
  Search,
  Plus,
  Mail,
  Users,
  Shield,
  Layers,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  Edit2,
  Trash2,
  X,
  Save,
  CheckCircle2,
  FileSpreadsheet,
  Filter,
  Award,
  Sparkles,
  Info,
  ShieldAlert,
  Lock,
  LayoutGrid,
  Table as TableIcon,
  AlertTriangle,
  CheckSquare,
  Square
} from 'lucide-react';
import { BulkOrgImportModal } from './BulkOrgImportModal';
import { BulkClassImportModal } from './BulkClassImportModal';

export const CHI_DOAN_QUALITY_RANKS: ChiDoanRank[] = [
  'Hoàn thành xuất sắc nhiệm vụ',
  'Hoàn thành tốt nhiệm vụ',
  'Hoàn thành nhiệm vụ',
  'Không hoàn thành nhiệm vụ',
];

export const OrganizationDirectory: React.FC = () => {
  const {
    organizations,
    addOrganization,
    updateOrganization,
    deleteOrganization,
    batchDeleteOrganizations,
    branchClasses,
    addBranchClass,
    updateBranchClass,
    deleteBranchClass,
    batchDeleteBranchClasses,
    students,
    updateStudent,
    activities,
    user,
    setActiveTab,
    showToast
  } = useApp();

  // Phân quyền theo cấp tài khoản:
  // - Cấp trường (Cấp 4): xem toàn bộ CLB, tổ, đội nhóm, chi đoàn, cấp khoa
  // - Cấp khoa (Cấp 3): xem CLB, tổ, đội nhóm cấp khoa và chi đoàn thuộc Khoa quản lý
  // - Các cấp còn lại (< 3): không hiển thị dữ liệu
  const isLevel4 = user.currentRole.roleLevel === 4;
  const isLevel3 = user.currentRole.roleLevel === 3;
  const isAllowed = isLevel4 || isLevel3;
  const currentFacultyCode = user.currentRole.orgCode || 'CNTT';

  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Lọc xếp loại chất lượng Chi đoàn (4 mức chuẩn)
  const [classRankFilter, setClassRankFilter] = useState<string>('ALL');

  // Bulk Import Modals
  const [showBulkOrgModal, setShowBulkOrgModal] = useState(false);
  const [showBulkClassModal, setShowBulkClassModal] = useState(false);

  // Add Organization Modal State (Thêm trường dữ liệu Thuộc Khoa cho CLB cấp Khoa)
  const [showAddOrgModal, setShowAddOrgModal] = useState(false);
  const [orgForm, setOrgForm] = useState({
    code: '',
    name: '',
    type: 'CLB_TRUONG' as Organization['type'],
    hostLevel: 'B' as 'A' | 'B',
    hostLevelName: 'Ban, CLB, Đội, Nhóm cấp Trường',
    hostLevelScorePoint: 2,
    facultyCode: '', // Trường dữ liệu Thuộc Khoa (dành cho CLB, tổ, đội nhóm cấp Khoa)
    email1: '',
    email2: '',
  });

  // Edit Organization Modal State (Inline / Quick Editing)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editOrgForm, setEditOrgForm] = useState({
    name: '',
    type: 'CLB_TRUONG' as Organization['type'],
    hostLevel: 'B' as 'A' | 'B',
    hostLevelName: '',
    hostLevelScorePoint: 2,
    facultyCode: '', // Trường dữ liệu Thuộc Khoa
    email1: '',
    email2: '',
  });

  // New Class Modal State (Cho phép khoa tạo danh mục chi đoàn)
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [newClassCode, setNewClassCode] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newClassFaculty, setNewClassFaculty] = useState(
    user.currentRole.roleLevel === 3 ? (user.currentRole.orgCode || 'CNTT') : 'CNTT'
  );
  const [newClassYear, setNewClassYear] = useState('2024-2028');
  const [newClassQualityRank, setNewClassQualityRank] = useState<ChiDoanRank | ''>('');

  // Chế độ xem Bảng dữ liệu / Dạng Thẻ cho Đơn vị và Chi đoàn
  const [orgViewMode, setOrgViewMode] = useState<'grid' | 'table'>('table');
  const [classViewMode, setClassViewMode] = useState<'grid' | 'table'>('table');

  // Tìm kiếm và lọc Chi đoàn
  const [classSearchTerm, setClassSearchTerm] = useState('');
  const [classFacultyFilter, setClassFacultyFilter] = useState('ALL');

  // Modal Sửa Chi đoàn
  const [editingClass, setEditingClass] = useState<BranchClass | null>(null);
  const [editClassForm, setEditClassForm] = useState({
    code: '',
    name: '',
    facultyCode: '',
    academicYear: '2024-2028',
    qualityRank: '' as ChiDoanRank | ''
  });

  // Modal Xác nhận Xóa Chi đoàn
  const [deletingClass, setDeletingClass] = useState<BranchClass | null>(null);

  // Modal Xác nhận Xóa Đơn vị
  const [deletingOrg, setDeletingOrg] = useState<Organization | null>(null);

  // Multi-selection states for Bulk Organization & Class Deletion
  const [selectedOrgCodes, setSelectedOrgCodes] = useState<string[]>([]);
  const [showBatchDeleteOrgModal, setShowBatchDeleteOrgModal] = useState(false);
  const [batchDeleteOrgReason, setBatchDeleteOrgReason] = useState('');

  const [selectedClassCodes, setSelectedClassCodes] = useState<string[]>([]);
  const [showBatchDeleteClassModal, setShowBatchDeleteClassModal] = useState(false);
  const [batchDeleteClassReason, setBatchDeleteClassReason] = useState('');

  // Faculty name lookup map
  const facultyMap = useMemo(() => {
    const map: Record<string, string> = {};
    organizations.filter(o => o.type === 'KHOA').forEach(k => {
      map[k.code] = k.name;
    });
    return map;
  }, [organizations]);

  // Tính xếp loại chất lượng Chi đoàn theo 4 mức chuẩn
  const getChiDoanEvaluation = (cls: BranchClass) => {
    const classStudents = students.filter(s => s.classCode === cls.code);
    const liveCount = classStudents.length;
    const avgScore = liveCount > 0
      ? Math.round((classStudents.reduce((acc, s) => acc + s.totalScore, 0) / liveCount) * 10) / 10
      : 0;

    let rank: ChiDoanRank = 'Không hoàn thành nhiệm vụ';
    let badgeStyle = 'bg-rose-50 text-rose-800 border-rose-300';
    let dotStyle = 'bg-rose-500';

    if (cls.qualityRank) {
      rank = cls.qualityRank;
    } else if (avgScore >= 50) {
      rank = 'Hoàn thành xuất sắc nhiệm vụ';
    } else if (avgScore >= 40) {
      rank = 'Hoàn thành tốt nhiệm vụ';
    } else if (avgScore >= 25) {
      rank = 'Hoàn thành nhiệm vụ';
    } else {
      rank = 'Không hoàn thành nhiệm vụ';
    }

    if (rank === 'Hoàn thành xuất sắc nhiệm vụ') {
      badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300';
      dotStyle = 'bg-emerald-500';
    } else if (rank === 'Hoàn thành tốt nhiệm vụ') {
      badgeStyle = 'bg-sky-50 text-sky-800 border-sky-300';
      dotStyle = 'bg-sky-500';
    } else if (rank === 'Hoàn thành nhiệm vụ') {
      badgeStyle = 'bg-amber-50 text-amber-800 border-amber-300';
      dotStyle = 'bg-amber-500';
    } else {
      badgeStyle = 'bg-rose-50 text-rose-800 border-rose-300';
      dotStyle = 'bg-rose-500';
    }

    return { liveCount, avgScore, rank, badgeStyle, dotStyle };
  };

  // Danh mục Chi đoàn cơ sở (theo phân quyền và lọc khoa)
  const baseScopedClasses = useMemo(() => {
    if (!isAllowed) return [];
    if (isLevel4) {
      if (classFacultyFilter !== 'ALL') {
        return branchClasses.filter(c => c.facultyCode === classFacultyFilter);
      }
      return branchClasses;
    } else if (isLevel3) {
      return branchClasses.filter(c => c.facultyCode === currentFacultyCode);
    }
    return [];
  }, [branchClasses, isAllowed, isLevel4, isLevel3, currentFacultyCode, classFacultyFilter]);

  // Thống kê xếp loại 4 mức của tất cả chi đoàn trong phạm vi phân quyền
  const classRankStats = useMemo(() => {
    const baseList = baseScopedClasses;
    const xuatSac = baseList.filter(c => getChiDoanEvaluation(c).rank === 'Hoàn thành xuất sắc nhiệm vụ').length;
    const tot = baseList.filter(c => getChiDoanEvaluation(c).rank === 'Hoàn thành tốt nhiệm vụ').length;
    const hoanThanh = baseList.filter(c => getChiDoanEvaluation(c).rank === 'Hoàn thành nhiệm vụ').length;
    const khongHT = baseList.filter(c => getChiDoanEvaluation(c).rank === 'Không hoàn thành nhiệm vụ').length;
    return { xuatSac, tot, hoanThanh, khongHT, total: baseList.length };
  }, [baseScopedClasses, students]);

  // Danh mục Chi đoàn sau khi lọc theo xếp loại và từ khóa tìm kiếm:
  const scopedBranchClasses = useMemo(() => {
    let list = baseScopedClasses;

    // Lọc theo 4 mức chuẩn xếp loại chất lượng Chi đoàn
    if (classRankFilter !== 'ALL') {
      list = list.filter(c => {
        const ev = getChiDoanEvaluation(c);
        return ev.rank === classRankFilter;
      });
    }

    // Lọc theo từ khóa tìm kiếm (mã lớp, tên chi đoàn, niên khóa, khoa)
    if (classSearchTerm.trim()) {
      const q = classSearchTerm.trim().toLowerCase();
      list = list.filter(c =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.facultyCode.toLowerCase().includes(q) ||
        (facultyMap[c.facultyCode] && facultyMap[c.facultyCode].toLowerCase().includes(q)) ||
        (c.academicYear && c.academicYear.toLowerCase().includes(q))
      );
    }

    return list;
  }, [baseScopedClasses, classRankFilter, classSearchTerm, facultyMap, students]);

  // Danh mục đơn vị:
  // - Cấp trường (Cấp 4): clb, tổ, đội nhóm, chi đoàn, Cấp khoa hiển thị dữ liệu cho cấp trường
  // - Cấp khoa (Cấp 3): clb, tổ, đội nhóm cấp khoa, chi đoàn hiển thị dữ liệu cho cấp khoa
  // - Các cấp còn lại: không hiển thị dữ liệu cho các cấp còn lại
  const filteredOrgs = useMemo(() => {
    if (!isAllowed) return [];

    let list: Organization[] = [];
    if (isLevel4) {
      // Cấp trường: hiển thị đầy đủ CLB, tổ, đội nhóm (cả trường và khoa), Cấp khoa, Cấp trường
      list = organizations;
    } else if (isLevel3) {
      // Cấp khoa: chỉ hiển thị CLB, tổ, đội nhóm cấp khoa thuộc Khoa này
      list = organizations.filter(
        org =>
          org.type === 'CLB_KHOA' &&
          (org.facultyCode === currentFacultyCode || org.parentCode === currentFacultyCode)
      );
    } else {
      return [];
    }

    return list.filter(org => {
      if (filterType !== 'ALL' && org.type !== filterType) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          org.name.toLowerCase().includes(q) ||
          org.code.toLowerCase().includes(q) ||
          org.email1.toLowerCase().includes(q) ||
          (org.email2 && org.email2.toLowerCase().includes(q)) ||
          (org.facultyCode && org.facultyCode.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [organizations, isLevel4, isLevel3, isAllowed, currentFacultyCode, filterType, searchTerm]);

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassCode || !newClassName) return;

    const cleanCode = newClassCode.trim().toUpperCase();
    const faculty = user.currentRole.roleLevel === 3 ? (user.currentRole.orgCode || 'CNTT') : newClassFaculty;

    // Tự động tính dựa vào số sinh viên được upload lên phần mềm
    const computedStudentCount = students.filter(s => s.classCode === cleanCode).length;

    addBranchClass({
      code: cleanCode,
      name: newClassName.trim(),
      facultyCode: faculty,
      academicYear: newClassYear,
      studentCount: computedStudentCount,
      qualityRank: newClassQualityRank ? (newClassQualityRank as ChiDoanRank) : undefined,
    });

    setNewClassCode('');
    setNewClassName('');
    setNewClassQualityRank('');
    setShowAddClassModal(false);
  };

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgForm.code || !orgForm.name) return;

    if (orgForm.type === 'CLB_KHOA' && !orgForm.facultyCode) {
      showToast('CLB/Tổ/Đội nhóm cấp Khoa bắt buộc phải chọn Khoa trực thuộc!', 'error');
      return;
    }

    // Check if code exists
    if (organizations.some(o => o.code.toUpperCase() === orgForm.code.toUpperCase())) {
      showToast(`Mã đơn vị ${orgForm.code} đã tồn tại!`, 'error');
      return;
    }

    addOrganization({
      id: organizations.length + 1,
      code: orgForm.code.toUpperCase(),
      name: orgForm.name,
      type: orgForm.type,
      hostLevel: orgForm.hostLevel,
      hostLevelName: orgForm.hostLevelName || (orgForm.type === 'KHOA' ? 'Đoàn, Hội cấp Khoa' : orgForm.type === 'CLB_KHOA' ? 'Chi đoàn, CLB cấp Khoa' : 'Ban, CLB, Đội, Nhóm'),
      hostLevelScorePoint: Number(orgForm.hostLevelScorePoint) || 2,
      email1: orgForm.email1 || `${orgForm.code.toLowerCase()}@hcmuaf.edu.vn`,
      email2: orgForm.email2 || undefined,
      facultyCode: orgForm.type === 'CLB_KHOA' ? orgForm.facultyCode : undefined,
      parentCode: orgForm.type === 'CLB_KHOA' ? orgForm.facultyCode : undefined,
      activityCount: 0,
    });

    setOrgForm({
      code: '',
      name: '',
      type: 'CLB_TRUONG',
      hostLevel: 'B',
      hostLevelName: 'Ban, CLB, Đội, Nhóm cấp Trường',
      hostLevelScorePoint: 2,
      facultyCode: '',
      email1: '',
      email2: '',
    });
    setShowAddOrgModal(false);
  };

  const handleOpenEditOrg = (org: Organization) => {
    setEditingOrg(org);
    setEditOrgForm({
      name: org.name,
      type: org.type,
      hostLevel: org.hostLevel,
      hostLevelName: org.hostLevelName,
      hostLevelScorePoint: org.hostLevelScorePoint || 2,
      facultyCode: org.facultyCode || org.parentCode || '',
      email1: org.email1,
      email2: org.email2 || '',
    });
  };

  const handleSaveEditOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg) return;

    if (editOrgForm.type === 'CLB_KHOA' && !editOrgForm.facultyCode) {
      showToast('CLB/Tổ/Đội nhóm cấp Khoa bắt buộc phải có thông tin Thuộc Khoa!', 'error');
      return;
    }

    updateOrganization(editingOrg.code, {
      name: editOrgForm.name,
      type: editOrgForm.type,
      hostLevel: editOrgForm.hostLevel,
      hostLevelName: editOrgForm.hostLevelName,
      hostLevelScorePoint: Number(editOrgForm.hostLevelScorePoint),
      facultyCode: editOrgForm.type === 'CLB_KHOA' ? editOrgForm.facultyCode : undefined,
      parentCode: editOrgForm.type === 'CLB_KHOA' ? editOrgForm.facultyCode : undefined,
      email1: editOrgForm.email1,
      email2: editOrgForm.email2 || undefined,
    });

    setEditingOrg(null);
  };

  const canManageOrg = (org: Organization) => {
    if (isLevel4) return true;
    if (isLevel3 && org.type === 'CLB_KHOA' && (org.facultyCode === currentFacultyCode || org.parentCode === currentFacultyCode)) {
      return true;
    }
    return false;
  };

  const handleDeleteOrg = (org: Organization) => {
    if (!canManageOrg(org)) {
      showToast('Bạn không có quyền xóa đơn vị này!', 'error');
      return;
    }
    setDeletingOrg(org);
  };

  // Organization selection & batch delete helpers
  const handleToggleSelectOrg = (code: string) => {
    setSelectedOrgCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleToggleSelectAllOrgs = () => {
    const filterableCodes = filteredOrgs.filter(o => canManageOrg(o)).map(o => o.code);
    const allSelected = filterableCodes.length > 0 && filterableCodes.every(code => selectedOrgCodes.includes(code));
    if (allSelected) {
      setSelectedOrgCodes(prev => prev.filter(code => !filterableCodes.includes(code)));
    } else {
      setSelectedOrgCodes(prev => Array.from(new Set([...prev, ...filterableCodes])));
    }
  };

  const handleConfirmBatchDeleteOrgs = () => {
    if (selectedOrgCodes.length === 0) return;
    const count = batchDeleteOrganizations(selectedOrgCodes);
    if (count > 0) {
      setSelectedOrgCodes([]);
      setShowBatchDeleteOrgModal(false);
      setBatchDeleteOrgReason('');
    }
  };

  // Branch Class selection & batch delete helpers
  const handleToggleSelectClass = (code: string) => {
    setSelectedClassCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleToggleSelectAllClasses = () => {
    const filterableCodes = scopedBranchClasses.filter(c => canManageClass(c)).map(c => c.code);
    const allSelected = filterableCodes.length > 0 && filterableCodes.every(code => selectedClassCodes.includes(code));
    if (allSelected) {
      setSelectedClassCodes(prev => prev.filter(code => !filterableCodes.includes(code)));
    } else {
      setSelectedClassCodes(prev => Array.from(new Set([...prev, ...filterableCodes])));
    }
  };

  const handleConfirmBatchDeleteClasses = () => {
    if (selectedClassCodes.length === 0) return;
    const count = batchDeleteBranchClasses(selectedClassCodes);
    if (count > 0) {
      setSelectedClassCodes([]);
      setShowBatchDeleteClassModal(false);
      setBatchDeleteClassReason('');
    }
  };

  // Handlers for Chi Đoàn Sửa / Xóa
  const canManageClass = (cls: BranchClass) => {
    if (isLevel4) return true;
    if (isLevel3 && cls.facultyCode === currentFacultyCode) return true;
    return false;
  };

  const handleOpenEditClass = (cls: BranchClass) => {
    if (!canManageClass(cls)) {
      showToast('Bạn không có quyền chỉnh sửa chi đoàn này!', 'error');
      return;
    }
    setEditingClass(cls);
    setEditClassForm({
      code: cls.code,
      name: cls.name,
      facultyCode: cls.facultyCode,
      academicYear: cls.academicYear || '2024-2028',
      qualityRank: cls.qualityRank || ''
    });
  };

  const handleUpdateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;

    const trimmedCode = editClassForm.code.trim().toUpperCase();
    if (!trimmedCode) {
      showToast('Mã chi đoàn không được để trống!', 'error');
      return;
    }
    if (!editClassForm.name.trim()) {
      showToast('Tên chi đoàn không được để trống!', 'error');
      return;
    }

    if (trimmedCode !== editingClass.code.toUpperCase()) {
      const exists = branchClasses.some(c => c.code.toUpperCase() === trimmedCode && c.id !== editingClass.id);
      if (exists) {
        showToast(`Mã chi đoàn ${trimmedCode} đã tồn tại trong hệ thống!`, 'error');
        return;
      }
    }

    const oldCode = editingClass.code.toUpperCase();
    updateBranchClass(editingClass.code, {
      code: trimmedCode,
      name: editClassForm.name.trim(),
      facultyCode: editClassForm.facultyCode,
      academicYear: editClassForm.academicYear,
      qualityRank: editClassForm.qualityRank || undefined
    });

    if (trimmedCode !== oldCode) {
      students
        .filter(s => s.classCode?.toUpperCase() === oldCode)
        .forEach(s => {
          updateStudent(
            s.studentId,
            { classCode: trimmedCode, facultyCode: editClassForm.facultyCode },
            `Đồng bộ đổi mã chi đoàn từ ${oldCode} sang ${trimmedCode}`
          );
        });
    }

    setEditingClass(null);
  };

  const handleDeleteClassConfirm = () => {
    if (!deletingClass) return;
    deleteBranchClass(deletingClass.code);
    setDeletingClass(null);
  };

  // Không hiển thị dữ liệu cho các cấp còn lại (Cấp 2, Cấp 1, Cấp 0)
  if (!isAllowed) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Không Có Quyền Xem Dữ Liệu Danh Mục Đơn Vị & Chi Đoàn
          </h2>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-4 border border-slate-200">
            <span>Tài khoản hiện tại:</span>
            <span className="font-bold text-slate-900">{user.currentRole.roleName} (Cấp {user.currentRole.roleLevel})</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs text-slate-600 space-y-2 mb-6">
            <p className="font-bold text-slate-800">Quy định phân quyền hiển thị dữ liệu Danh mục Đơn vị Đoàn - Hội & Quản Lý Chi Đoàn NLU:</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>
                <strong className="text-emerald-800">Cấp Trường (Cấp 4)</strong>: Hiển thị đầy đủ CLB, tổ, đội nhóm, chi đoàn và các Đoàn Khoa toàn trường.
              </li>
              <li>
                <strong className="text-teal-800">Cấp Khoa (Cấp 3)</strong>: Hiển thị CLB, tổ, đội nhóm cấp khoa và danh mục chi đoàn trực thuộc Khoa quản lý.
              </li>
              <li>
                <strong className="text-rose-700">Các cấp còn lại (Cấp 2, Cấp 1, Khách)</strong>: Hệ thống không hiển thị dữ liệu danh mục này.
              </li>
            </ul>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              Về Trang Chủ (Dashboard)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('activities')}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition border border-slate-300"
            >
              Xem Hoạt Động Của Tôi
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleExportOrgExcel = () => {
    // Sheet 1: Organization Directory
    const orgData = filteredOrgs.map((org, idx) => ({
      'STT': idx + 1,
      'Mã Đơn Vị': org.code,
      'Tên Đơn Vị': org.name,
      'Phân Loại': org.type === 'KHOA' ? 'Đoàn Khoa' : org.type === 'CLB_TRUONG' ? 'CLB Cấp Trường' : 'CLB Cấp Khoa',
      'Khoa Trực Thuộc': org.facultyCode || org.parentCode || '-',
      'Email 1': org.email1 || '-',
      'Email 2': org.email2 || '-',
      'Điểm Cộng ĐRL Host': org.hostLevelScorePoint || 2,
    }));

    // Sheet 2: Branch Classes Directory
    const classData = scopedBranchClasses.map((cls, idx) => {
      const ev = getChiDoanEvaluation(cls);
      return {
        'STT': idx + 1,
        'Mã Chi Đoàn': cls.code,
        'Tên Chi Đoàn': cls.name,
        'Mã Khoa': cls.facultyCode,
        'Tổng Sinh Viên': ev.liveCount,
        'Điểm ĐRL Trung Bình': ev.avgScore,
        'Xếp Loại Chất Lượng': ev.rank
      };
    });

    const wb = XLSX.utils.book_new();

    const wsOrg = XLSX.utils.json_to_sheet(orgData);
    wsOrg['!cols'] = [{ wch: 6 }, { wch: 15 }, { wch: 30 }, { wch: 18 }, { wch: 15 }, { wch: 28 }, { wch: 28 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsOrg, 'DanhSach_DonVi');

    const wsClass = XLSX.utils.json_to_sheet(classData);
    wsClass['!cols'] = [{ wch: 6 }, { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsClass, 'DanhSach_ChiDoan');

    XLSX.writeFile(wb, `DanhSach_DonVi_ChiDoan_NLU_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Đã xuất danh sách Đơn vị & Chi đoàn ra file Excel (.xlsx) thành công!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            Danh mục Đơn vị Đoàn - Hội & Quản Lý Chi Đoàn NLU
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isLevel4
              ? 'Chế độ Cấp Trường: Hiển thị dữ liệu toàn bộ CLB, tổ, đội nhóm, chi đoàn và các Đoàn Khoa toàn trường.'
              : `Chế độ Cấp Khoa: Hiển thị dữ liệu CLB, tổ, đội nhóm cấp khoa và chi đoàn trực thuộc Khoa ${facultyMap[currentFacultyCode] || currentFacultyCode}.`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {selectedOrgCodes.length > 0 && (
            <button
              type="button"
              onClick={() => setShowBatchDeleteOrgModal(true)}
              className="inline-flex items-center gap-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Xóa {selectedOrgCodes.length} Đơn Vị Đã Chọn
            </button>
          )}

          {isLevel4 && (
            <>
              <button
                type="button"
                onClick={() => setShowAddOrgModal(true)}
                className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                Thêm Đơn Vị Mới
              </button>
              <button
                type="button"
                onClick={() => setShowBulkOrgModal(true)}
                className="inline-flex items-center gap-1.5 bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition border border-emerald-600"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                Nhập Đơn Vị Bằng Excel
              </button>
            </>
          )}

          {isLevel3 && (
            <button
              type="button"
              onClick={() => {
                setOrgForm({
                  code: '',
                  name: '',
                  type: 'CLB_KHOA',
                  hostLevel: 'B',
                  hostLevelName: 'CLB, Đội, Nhóm cấp Khoa',
                  hostLevelScorePoint: 2,
                  facultyCode: currentFacultyCode,
                  email1: '',
                  email2: '',
                });
                setShowAddOrgModal(true);
              }}
              className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              Thêm CLB Cấp Khoa Mới
            </button>
          )}

          {(isLevel4 || isLevel3) && (
            <>
              <button
                type="button"
                onClick={() => setShowAddClassModal(true)}
                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl transition border border-slate-300"
              >
                <Plus className="w-4 h-4 text-slate-500" />
                Thêm Chi Đoàn Mới
              </button>
              <button
                type="button"
                onClick={() => setShowBulkClassModal(true)}
                className="inline-flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-bold px-3.5 py-2.5 rounded-xl transition border border-teal-300"
              >
                <FileSpreadsheet className="w-4 h-4 text-teal-700" />
                Nhập Chi Đoàn Bằng Excel
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleExportOrgExcel}
            className="inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            title="Tải về danh sách Đơn vị & Chi đoàn ra file Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            Tải Danh Sách Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Thông tin phạm vi phân quyền hiển thị */}
      {isLevel4 ? (
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              L4
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-950 text-xs">
                  Chế độ hiển thị Cấp Trường ({user.currentRole.roleName})
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-bold text-[10px]">
                  Toàn quyền hệ thống
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Hiển thị đầy đủ tất cả CLB/tổ/đội nhóm, các Chi đoàn toàn trường và 13 Đoàn Khoa & Đơn vị trực thuộc NLU.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-emerald-900 font-semibold shrink-0">
            <span className="bg-white px-2.5 py-1 rounded-xl border border-emerald-200">
              {filteredOrgs.length} Đơn vị
            </span>
            <span className="bg-white px-2.5 py-1 rounded-xl border border-emerald-200">
              {scopedBranchClasses.length} Chi đoàn
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-teal-50/70 border border-teal-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              L3
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-teal-950 text-xs">
                  Chế độ hiển thị Cấp Khoa ({user.currentRole.roleName} - {facultyMap[currentFacultyCode] || currentFacultyCode})
                </span>
                <span className="px-2 py-0.5 rounded-full bg-teal-200/80 text-teal-900 font-bold text-[10px]">
                  Phân quyền Khoa
                </span>
              </div>
              <p className="text-[11px] text-teal-800 mt-0.5">
                Hệ thống tự động lọc: Chỉ hiển thị các CLB, tổ, đội nhóm cấp khoa và các Chi đoàn trực thuộc Khoa {facultyMap[currentFacultyCode] || currentFacultyCode}.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-teal-900 font-semibold shrink-0">
            <span className="bg-white px-2.5 py-1 rounded-xl border border-teal-200">
              {filteredOrgs.length} CLB Cấp Khoa
            </span>
            <span className="bg-white px-2.5 py-1 rounded-xl border border-teal-200">
              {scopedBranchClasses.length} Chi đoàn
            </span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={isLevel4 ? "Tìm theo tên đơn vị, mã, email, thuộc khoa..." : `Tìm kiếm CLB, tổ, đội nhóm Khoa ${currentFacultyCode}...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {isLevel4 ? (
            [
              { id: 'ALL', label: `Tất cả (${organizations.length} đơn vị)` },
              { id: 'TRUONG', label: 'Cấp Trường & TW' },
              { id: 'KHOA', label: 'Đoàn Khoa' },
              { id: 'CLB_TRUONG', label: 'CLB Cấp Trường' },
              { id: 'CLB_KHOA', label: 'CLB Cấp Khoa' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  filterType === f.id
                    ? 'bg-emerald-800 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))
          ) : (
            [
              { id: 'ALL', label: `Tất cả CLB Cấp Khoa (${filteredOrgs.length} đơn vị)` },
              { id: 'CLB_KHOA', label: `CLB Trực Thuộc Khoa ${currentFacultyCode}` },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  filterType === f.id
                    ? 'bg-emerald-800 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Organizations Section Header & View Mode Toggle */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200 shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Bảng Dữ Liệu Đơn Vị Đoàn - Hội
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                {filteredOrgs.length} đơn vị
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              {isLevel4 ? 'Toàn bộ 13 Đoàn Khoa, CLB cấp Trường & CLB cấp Khoa' : `Các CLB trực thuộc Khoa ${facultyMap[currentFacultyCode] || currentFacultyCode}`}
            </p>
          </div>
        </div>

        {/* View Mode Toggle: Bảng Dữ Liệu ⟷ Dạng Thẻ */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setOrgViewMode('table')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              orgViewMode === 'table'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Xem dạng Bảng Dữ Liệu chi tiết"
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Xem Dạng Bảng</span>
          </button>
          <button
            type="button"
            onClick={() => setOrgViewMode('grid')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              orgViewMode === 'grid'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Xem dạng Lưới Thẻ"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Dạng Thẻ</span>
          </button>
        </div>
      </div>

      {/* Thanh Thông Báo Chọn Đơn Vị Hàng Loạt */}
      {selectedOrgCodes.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200 shadow-2xs">
          <div className="flex items-center gap-2 text-rose-900 font-bold">
            <CheckSquare className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Đã chọn {selectedOrgCodes.length} / {filteredOrgs.filter(o => canManageOrg(o)).length} đơn vị trong danh sách</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedOrgCodes([])}
              className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Bỏ chọn tất cả
            </button>
            <button
              type="button"
              onClick={() => setShowBatchDeleteOrgModal(true)}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa {selectedOrgCodes.length} Đơn Vị Đã Chọn
            </button>
          </div>
        </div>
      )}

      {/* Organizations View: Table or Grid */}
      {orgViewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10.5px] tracking-wider">
                  <th className="py-3 px-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={
                        filteredOrgs.filter(o => canManageOrg(o)).length > 0 &&
                        filteredOrgs.filter(o => canManageOrg(o)).every(o => selectedOrgCodes.includes(o.code))
                      }
                      onChange={handleToggleSelectAllOrgs}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      title="Chọn / Bỏ chọn tất cả đơn vị có thể quản lý"
                    />
                  </th>
                  <th className="py-3 px-3 text-center w-12">STT</th>
                  <th className="py-3 px-3">Mã Đơn Vị</th>
                  <th className="py-3 px-4">Tên Đơn Vị</th>
                  <th className="py-3 px-3">Phân Loại</th>
                  <th className="py-3 px-3">Thuộc Khoa</th>
                  <th className="py-3 px-3 text-center">Cấp Host</th>
                  <th className="py-3 px-4">Email Liên Hệ</th>
                  <th className="py-3 px-3 text-center">Chi Đoàn</th>
                  {(isLevel4 || isLevel3) && <th className="py-3 px-3 text-right">Thao Tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrgs.length === 0 ? (
                  <tr>
                    <td colSpan={(isLevel4 || isLevel3) ? 10 : 9} className="py-12 text-center text-slate-400">
                      Không tìm thấy tổ chức phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredOrgs.map((org, idx) => {
                    const facultyClasses = branchClasses.filter(c => c.facultyCode === org.code);
                    const typeLabel =
                      org.type === 'KHOA'
                        ? 'Đoàn Khoa'
                        : org.type === 'CLB_TRUONG'
                        ? 'CLB Cấp Trường'
                        : org.type === 'CLB_KHOA'
                        ? 'CLB Cấp Khoa'
                        : 'Cấp Trường & TW';

                    const typeBadge =
                      org.type === 'KHOA'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : org.type === 'CLB_TRUONG'
                        ? 'bg-sky-50 text-sky-800 border-sky-200'
                        : org.type === 'CLB_KHOA'
                        ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200';

                    const isSelected = selectedOrgCodes.includes(org.code);

                    return (
                      <tr key={`org_row_${org.code}_${idx}`} className={`hover:bg-slate-50/80 transition ${isSelected ? 'bg-emerald-50/40' : ''}`}>
                        <td className="py-3 px-3 text-center">
                          {canManageOrg(org) ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectOrg(org.code)}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-mono font-black text-emerald-800">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                            {org.code}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <div>{org.name}</div>
                          <div className="text-[10.5px] text-slate-400 font-normal">{org.hostLevelName}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${typeBadge}`}>
                            {typeLabel}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {org.type === 'CLB_KHOA' ? (
                            <span className="font-bold text-indigo-800">
                              {org.facultyCode || org.parentCode || '-'}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              org.hostLevel === 'A'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-blue-50 text-blue-800 border border-blue-200'
                            }`}
                          >
                            Cấp {org.hostLevel} ({org.hostLevelScorePoint || 2}đ)
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-[11px]">
                          <div className="truncate max-w-[200px]">{org.email1 || '-'}</div>
                          {org.email2 && <div className="text-slate-400 truncate max-w-[200px]">{org.email2}</div>}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {facultyClasses.length > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 text-xs">
                              {facultyClasses.length} lớp
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        {(isLevel4 || isLevel3) && (
                          <td className="py-3 px-3 text-right">
                            {canManageOrg(org) ? (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditOrg(org)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-semibold transition cursor-pointer border border-slate-200"
                                  title={`Sửa thông tin đơn vị ${org.name}`}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span>Sửa</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteOrg(org)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg text-xs font-semibold transition cursor-pointer border border-rose-200"
                                  title={`Xóa đơn vị ${org.name}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Xóa</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-300 text-[11px] italic">Chỉ xem</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrgs.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 p-6 text-slate-500 text-xs">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700">Không tìm thấy tổ chức phù hợp</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc phân loại khác.
              </p>
            </div>
          ) : (
            filteredOrgs.map((org, idx) => {
              const facultyClasses = branchClasses.filter(c => c.facultyCode === org.code);
              const isSelected = selectedOrgCodes.includes(org.code);

              return (
                <div
                  key={`org_card_${org.code}_${idx}`}
                  className={`bg-white rounded-2xl border p-4 shadow-xs transition flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                      : 'border-slate-200 hover:border-emerald-300 hover:shadow-md'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {canManageOrg(org) && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectOrg(org.code)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer mr-1"
                          />
                        )}
                        <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-800 font-extrabold text-[11px] flex items-center justify-center border border-emerald-200">
                          {org.id}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400 font-bold">[{org.code}]</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            org.hostLevel === 'A'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}
                        >
                          Cấp {org.hostLevel} ({org.hostLevelScorePoint || 2}đ)
                        </span>
                      </div>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm mt-2 leading-snug">{org.name}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{org.hostLevelName}</p>

                    {/* CLB, tổ, đội nhóm cấp Khoa */}
                    {org.type === 'CLB_KHOA' && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="inline-flex items-center gap-1.5 font-bold text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                          <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          Thuộc Khoa: {org.facultyCode ? (facultyMap[org.facultyCode] ? `Khoa ${facultyMap[org.facultyCode]}` : `Khoa [${org.facultyCode}]`) : (org.parentCode ? `Khoa [${org.parentCode}]` : 'Chưa gán Khoa')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono font-bold">
                          [{org.facultyCode || org.parentCode || 'N/A'}]
                        </span>
                      </div>
                    )}

                    {/* Emails */}
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{org.email1}</span>
                      </div>
                      {org.email2 && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{org.email2}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    {/* Sub-classes count if faculty */}
                    {facultyClasses.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5" />
                          {facultyClasses.length} Chi đoàn trực thuộc
                        </span>
                        <span className="text-slate-400">Tự động điền C.3</span>
                      </div>
                    )}

                    {/* Edit/Delete Actions */}
                    {canManageOrg(org) && (
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditOrg(org)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-semibold transition cursor-pointer"
                          title={`Sửa thông tin đơn vị ${org.name}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Sửa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteOrg(org)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition cursor-pointer"
                          title={`Xóa đơn vị ${org.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Chi đoàn List Table & Xếp loại chất lượng Chi đoàn 4 mức */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-200 shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Bảng Dữ Liệu Chi Đoàn & Quản Lý Chi Đoàn NLU
                <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-extrabold">
                  {scopedBranchClasses.length} chi đoàn
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isLevel4
                  ? 'Toàn bộ danh mục chi đoàn toàn trường • Sĩ số sinh viên tự động liên kết • Xếp loại chất lượng 4 mức chuẩn Đoàn NLU'
                  : `Danh mục chi đoàn trực thuộc Khoa ${facultyMap[currentFacultyCode] || currentFacultyCode} • Sĩ số sinh viên tự động liên kết`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle: Bảng Dữ Liệu ⟷ Dạng Thẻ */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setClassViewMode('table')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  classViewMode === 'table'
                    ? 'bg-teal-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Xem dạng Bảng Dữ Liệu chi tiết"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Xem Dạng Bảng</span>
              </button>
              <button
                type="button"
                onClick={() => setClassViewMode('grid')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  classViewMode === 'grid'
                    ? 'bg-teal-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Xem dạng Lưới Thẻ"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Dạng Thẻ</span>
              </button>
            </div>

            {(isLevel4 || isLevel3) && (
              <>
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-500" />
                  Thêm Chi Đoàn Mới
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkClassModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-lg border border-teal-200 transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
                  Nạp Excel Chi Đoàn
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tìm kiếm & Lọc Khoa cho Chi Đoàn */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã chi đoàn (vd: DH24IT02), tên lớp, niên khóa, khoa..."
              value={classSearchTerm}
              onChange={e => setClassSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
          </div>

          {isLevel4 && (
            <div className="sm:w-64">
              <select
                value={classFacultyFilter}
                onChange={e => setClassFacultyFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-teal-500 font-medium"
              >
                <option value="ALL">Tất cả các Khoa ({organizations.filter(o => o.type === 'KHOA').length} khoa)</option>
                {organizations
                  .filter(o => o.type === 'KHOA')
                  .map(k => (
                    <option key={k.code} value={k.code}>
                      [{k.code}] Khoa {k.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* Bộ lọc 4 Mức Xếp loại Chất lượng Chi đoàn */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            Xếp loại chất lượng:
          </span>
          {[
            { id: 'ALL', label: `Tất cả (${classRankStats.total})`, color: 'bg-slate-800 text-white' },
            { id: 'Hoàn thành xuất sắc nhiệm vụ', label: `Xuất sắc (${classRankStats.xuatSac})`, color: 'bg-emerald-800 text-white' },
            { id: 'Hoàn thành tốt nhiệm vụ', label: `Tốt (${classRankStats.tot})`, color: 'bg-sky-800 text-white' },
            { id: 'Hoàn thành nhiệm vụ', label: `Hoàn thành (${classRankStats.hoanThanh})`, color: 'bg-amber-800 text-white' },
            { id: 'Không hoàn thành nhiệm vụ', label: `Không hoàn thành (${classRankStats.khongHT})`, color: 'bg-rose-800 text-white' },
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setClassRankFilter(r.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border cursor-pointer ${
                classRankFilter === r.id
                  ? `${r.color} border-transparent shadow-xs`
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Thanh Thông Báo Chọn Chi Đoàn Hàng Loạt */}
        {selectedClassCodes.length > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200 shadow-2xs">
            <div className="flex items-center gap-2 text-rose-900 font-bold">
              <CheckSquare className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Đã chọn {selectedClassCodes.length} / {scopedBranchClasses.filter(c => canManageClass(c)).length} chi đoàn trong danh sách</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedClassCodes([])}
                className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Bỏ chọn tất cả
              </button>
              <button
                type="button"
                onClick={() => setShowBatchDeleteClassModal(true)}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Xóa {selectedClassCodes.length} Chi Đoàn Đã Chọn
              </button>
            </div>
          </div>
        )}

        {/* Chi đoàn Display: Table or Grid */}
        {classViewMode === 'table' ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden mt-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10.5px] tracking-wider">
                    <th className="py-3 px-3 text-center w-10">
                      <input
                        type="checkbox"
                        checked={
                          scopedBranchClasses.filter(c => canManageClass(c)).length > 0 &&
                          scopedBranchClasses.filter(c => canManageClass(c)).every(c => selectedClassCodes.includes(c.code))
                        }
                        onChange={handleToggleSelectAllClasses}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                        title="Chọn / Bỏ chọn tất cả chi đoàn"
                      />
                    </th>
                    <th className="py-3 px-3 text-center w-12">STT</th>
                    <th className="py-3 px-3">Mã Chi Đoàn (Lớp)</th>
                    <th className="py-3 px-4">Tên Chi Đoàn</th>
                    <th className="py-3 px-3">Khoa Trực Thuộc</th>
                    <th className="py-3 px-3 text-center">Niên Khóa</th>
                    <th className="py-3 px-3 text-center">Sĩ Số (Tự Tính)</th>
                    <th className="py-3 px-3 text-center">ĐRL Trung Bình</th>
                    <th className="py-3 px-4 text-center">Xếp Loại Chất Lượng</th>
                    <th className="py-3 px-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scopedBranchClasses.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        Chưa có chi đoàn nào trong phạm vi quản lý hoặc phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    scopedBranchClasses.map((cls, idx) => {
                      const evalData = getChiDoanEvaluation(cls);
                      const isPermitted = canManageClass(cls);
                      const isSelected = selectedClassCodes.includes(cls.code);

                      return (
                        <tr key={`cls_row_${cls.code}_${idx}`} className={`hover:bg-slate-50/80 transition ${isSelected ? 'bg-teal-50/40' : ''}`}>
                          <td className="py-3 px-3 text-center">
                            {isPermitted ? (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectClass(cls.code)}
                                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                              />
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3 font-mono font-black text-teal-800">
                            <span className="px-2 py-0.5 rounded bg-teal-50 border border-teal-200 font-bold">
                              {cls.code}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            <div>{cls.name}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-700">
                              {facultyMap[cls.facultyCode] ? `Khoa ${facultyMap[cls.facultyCode]}` : cls.facultyCode}
                            </span>
                            <span className="ml-1 text-[10.5px] font-mono text-slate-400">[{cls.facultyCode}]</span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-600 font-medium">
                            {cls.academicYear || '-'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 text-xs">
                              {evalData.liveCount} SV
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-800">
                            <span
                              className={`px-2 py-0.5 rounded font-mono ${
                                evalData.avgScore >= 50
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : evalData.avgScore >= 40
                                  ? 'bg-sky-50 text-sky-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {evalData.avgScore} đ
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-bold border ${evalData.badgeStyle}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${evalData.dotStyle}`}></span>
                              {evalData.rank}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {isPermitted ? (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditClass(cls)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded-lg text-xs font-semibold transition cursor-pointer border border-teal-200"
                                  title={`Chỉnh sửa thông tin chi đoàn ${cls.code}`}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span>Sửa</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingClass(cls)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg text-xs font-semibold transition cursor-pointer border border-rose-200"
                                  title={`Xóa chi đoàn ${cls.code}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Xóa</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-300 italic text-[11px]">Chỉ xem</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            {scopedBranchClasses.length === 0 ? (
              <div className="col-span-full py-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                Chưa có chi đoàn nào trong phạm vi quản lý hoặc phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              scopedBranchClasses.map((cls, clsIdx) => {
                const evalData = getChiDoanEvaluation(cls);
                const isPermitted = canManageClass(cls);
                const isSelected = selectedClassCodes.includes(cls.code);

                return (
                  <div
                    key={`cls_card_${cls.code}_${clsIdx}`}
                    className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/20'
                        : 'bg-slate-50 border-slate-200 hover:border-teal-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {isPermitted && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectClass(cls.code)}
                              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                            />
                          )}
                          <span className="font-mono font-bold text-teal-800 text-xs block">{cls.code}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 font-mono">{cls.academicYear}</span>
                      </div>
                      <p className="font-semibold text-slate-800 text-xs mt-1">{cls.name}</p>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200">
                        <span>Khoa: {facultyMap[cls.facultyCode] ? `Khoa ${facultyMap[cls.facultyCode]}` : cls.facultyCode}</span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {evalData.liveCount} SV (Tự tính)
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                        <span>ĐRL Trung bình:</span>
                        <span className="font-bold text-slate-800 font-mono">
                          {evalData.avgScore} đ
                        </span>
                      </div>
                    </div>

                    <div>
                      {/* 4 Mức Xếp loại Chất lượng Chi đoàn */}
                      <div className="mt-2.5 pt-2 border-t border-slate-200">
                        <div className="flex items-center justify-between gap-1 text-[10px] text-slate-500 font-medium mb-1">
                          <span>Xếp loại chất lượng:</span>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 w-full justify-center px-2 py-1 rounded-lg text-[10px] font-bold border ${evalData.badgeStyle}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${evalData.dotStyle}`}></span>
                          {evalData.rank}
                        </span>
                      </div>

                      {/* Action buttons on card */}
                      {isPermitted && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditClass(cls)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded-lg text-[11px] font-semibold transition cursor-pointer border border-teal-200"
                            title={`Sửa chi đoàn ${cls.code}`}
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Sửa</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingClass(cls)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg text-[11px] font-semibold transition cursor-pointer border border-rose-200"
                            title={`Xóa chi đoàn ${cls.code}`}
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Xóa</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Add Organization Modal (Thêm trường dữ liệu Thuộc Khoa cho CLB cấp Khoa) */}
      {showAddOrgModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-emerald-800 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-300" />
                Thêm Đơn Vị Mới Vào Hệ Thống
              </h3>
              <button
                onClick={() => setShowAddOrgModal(false)}
                className="text-emerald-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Mã Đơn Vị (Viết tắt) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Vd: CLB_AI, K_TY, CLB_KN"
                  value={orgForm.code}
                  onChange={e => setOrgForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Tên Đầy Đủ Đơn Vị <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Vd: CLB Trí Tuệ Nhân Tạo & Robotics"
                  value={orgForm.name}
                  onChange={e => setOrgForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Phân Loại Đơn Vị</label>
                  <select
                    value={orgForm.type}
                    onChange={e =>
                      setOrgForm(prev => ({
                        ...prev,
                        type: e.target.value as Organization['type'],
                        hostLevelScorePoint:
                          e.target.value === 'KHOA'
                            ? 3
                            : e.target.value === 'CLB_TRUONG'
                            ? 2
                            : e.target.value === 'TRUONG'
                            ? 4
                            : 1,
                        hostLevel: e.target.value === 'TRUONG' ? 'A' : 'B'
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="CLB_TRUONG">CLB/Đội/Nhóm Cấp Trường</option>
                    <option value="CLB_KHOA">CLB/Đội/Nhóm Cấp Khoa</option>
                    <option value="KHOA">Đoàn/Hội Cấp Khoa</option>
                    <option value="TRUONG">Cấp Trường & TW</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Cấp Mã Hoạt Động</label>
                  <select
                    value={orgForm.hostLevel}
                    onChange={e => setOrgForm(prev => ({ ...prev, hostLevel: e.target.value as 'A' | 'B' }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-bold"
                  >
                    <option value="B">Cấp B (Mã B001, B002..)</option>
                    <option value="A">Cấp A (Mã A001, A002..)</option>
                  </select>
                </div>
              </div>

              {/* Yêu cầu: CLB, tổ, đội nhóm cấp Khoa phải có thêm trường dữ liệu thuộc Khoa */}
              {orgForm.type === 'CLB_KHOA' && (
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                  <label className="block font-bold text-indigo-950 mb-1">
                    Thuộc Khoa <span className="text-rose-500">* (Bắt buộc cho CLB cấp Khoa)</span>
                  </label>
                  <select
                    required
                    value={orgForm.facultyCode}
                    onChange={e => setOrgForm(prev => ({ ...prev, facultyCode: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-indigo-300 bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="">-- Chọn Khoa trực thuộc --</option>
                    {organizations
                      .filter(o => o.type === 'KHOA')
                      .map(k => (
                        <option key={k.code} value={k.code}>
                          [{k.code}] Khoa {k.name}
                        </option>
                      ))}
                  </select>
                  <p className="text-[10px] text-indigo-700 mt-1">
                    CLB/tổ/đội nhóm cấp Khoa trực thuộc một Khoa cụ thể để hỗ trợ phân quyền và lọc dữ liệu sinh viên.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-800 mb-1">Điểm Cấp Tổ Chức (1 - 6 điểm)</label>
                <select
                  value={orgForm.hostLevelScorePoint}
                  onChange={e => setOrgForm(prev => ({ ...prev, hostLevelScorePoint: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-800"
                >
                  <option value={1}>1 điểm: Chi đoàn, CLB trực thuộc Khoa</option>
                  <option value={2}>2 điểm: Ban, CLB, Đội, Nhóm cấp Trường</option>
                  <option value={3}>3 điểm: Đoàn, Hội cấp Khoa</option>
                  <option value={4}>4 điểm: Đoàn, Hội cấp Trường</option>
                  <option value={5}>5 điểm: Cấp Thành</option>
                  <option value={6}>6 điểm: Cấp Trung ương</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Email Liên Hệ Chính Thức</label>
                <input
                  type="email"
                  placeholder="Vd: clb.ai@hcmuaf.edu.vn"
                  value={orgForm.email1}
                  onChange={e => setOrgForm(prev => ({ ...prev, email1: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddOrgModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Khởi Tạo Đơn Vị
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Organization Modal */}
      {editingOrg && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-400" />
                Chỉnh Sửa Đơn Vị [{editingOrg.code}]
              </h3>
              <button
                onClick={() => setEditingOrg(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditOrg} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Tên Đơn Vị</label>
                <input
                  type="text"
                  required
                  value={editOrgForm.name}
                  onChange={e => setEditOrgForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Phân Loại</label>
                  <select
                    value={editOrgForm.type}
                    onChange={e => setEditOrgForm(prev => ({ ...prev, type: e.target.value as Organization['type'] }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="CLB_TRUONG">CLB Cấp Trường</option>
                    <option value="CLB_KHOA">CLB Cấp Khoa</option>
                    <option value="KHOA">Đoàn/Hội Khoa</option>
                    <option value="TRUONG">Cấp Trường/TW</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Cấp Mã (A/B)</label>
                  <select
                    value={editOrgForm.hostLevel}
                    onChange={e => setEditOrgForm(prev => ({ ...prev, hostLevel: e.target.value as 'A' | 'B' }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-bold"
                  >
                    <option value="B">Cấp B</option>
                    <option value="A">Cấp A</option>
                  </select>
                </div>
              </div>

              {/* Yêu cầu: CLB, tổ, đội nhóm cấp Khoa phải có thêm trường dữ liệu thuộc Khoa */}
              {editOrgForm.type === 'CLB_KHOA' && (
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                  <label className="block font-bold text-indigo-950 mb-1">
                    Thuộc Khoa <span className="text-rose-500">* (Bắt buộc cho CLB cấp Khoa)</span>
                  </label>
                  <select
                    required
                    value={editOrgForm.facultyCode}
                    onChange={e => setEditOrgForm(prev => ({ ...prev, facultyCode: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-indigo-300 bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="">-- Chọn Khoa trực thuộc --</option>
                    {organizations
                      .filter(o => o.type === 'KHOA')
                      .map(k => (
                        <option key={k.code} value={k.code}>
                          [{k.code}] Khoa {k.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-800 mb-1">Điểm Cấp Tổ Chức (1-6đ)</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={editOrgForm.hostLevelScorePoint}
                  onChange={e => setEditOrgForm(prev => ({ ...prev, hostLevelScorePoint: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-emerald-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Email 1</label>
                <input
                  type="email"
                  required
                  value={editOrgForm.email1}
                  onChange={e => setEditOrgForm(prev => ({ ...prev, email1: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Email 2 (Không bắt buộc)</label>
                <input
                  type="email"
                  value={editOrgForm.email2}
                  onChange={e => setEditOrgForm(prev => ({ ...prev, email2: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingOrg(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Class Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-emerald-800 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Thêm Danh Mục Chi Đoàn Trực Thuộc</h3>
              <button
                onClick={() => setShowAddClassModal(false)}
                className="text-emerald-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddClass} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Mã Chi đoàn (Mã lớp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Vd: DH24IT02"
                  value={newClassCode}
                  onChange={e => setNewClassCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Tên đầy đủ Chi đoàn <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Vd: Chi đoàn DH24IT02 (K24 CNTT 2)"
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Thuộc Khoa</label>
                  <select
                    value={newClassFaculty}
                    disabled={user.currentRole.roleLevel === 3}
                    onChange={e => setNewClassFaculty(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:text-slate-600"
                  >
                    {organizations
                      .filter(o => o.type === 'KHOA')
                      .map(k => (
                        <option key={k.code} value={k.code}>
                          Khoa {k.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Niên Khóa</label>
                  <input
                    type="text"
                    required
                    placeholder="2024-2028"
                    value={newClassYear}
                    onChange={e => setNewClassYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Xếp loại chất lượng khởi tạo (4 mức chuẩn)
                </label>
                <select
                  value={newClassQualityRank}
                  onChange={e => setNewClassQualityRank(e.target.value as ChiDoanRank | '')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Tự động đánh giá theo ĐRL sinh viên --</option>
                  {CHI_DOAN_QUALITY_RANKS.map(rk => (
                    <option key={rk} value={rk}>
                      {rk}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bỏ mục "Số sinh viên", tự động tính dựa vào số sinh viên được upload lên phần mềm */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <p className="font-bold text-emerald-900 text-xs">Sĩ số sinh viên chi đoàn:</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Đã loại bỏ mục nhập thủ công “Số sinh viên”. Hệ thống sẽ <span className="font-bold underline">tự động tính toán</span> dựa vào số lượng hồ sơ sinh viên được upload lên phần mềm có mã lớp này (hiện có: <span className="font-mono font-bold">{students.filter(s => s.classCode === newClassCode.trim().toUpperCase()).length}</span> sinh viên).
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs"
                >
                  Tạo Chi Đoàn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chỉnh Sửa Chi Đoàn */}
      {editingClass && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-teal-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-teal-300" />
                <span>Chỉnh Sửa Chi Đoàn [{editingClass.code}]</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingClass(null)}
                className="text-teal-200 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateClass} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Mã Chi đoàn (Mã lớp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editClassForm.code}
                  onChange={e => setEditClassForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 font-mono font-bold"
                  placeholder="Vd: DH24IT02"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Tên đầy đủ Chi đoàn <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editClassForm.name}
                  onChange={e => setEditClassForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500"
                  placeholder="Vd: Chi đoàn DH24IT02 (K24 CNTT 2)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Thuộc Khoa</label>
                  <select
                    value={editClassForm.facultyCode}
                    disabled={user.currentRole.roleLevel === 3}
                    onChange={e => setEditClassForm(prev => ({ ...prev, facultyCode: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 disabled:bg-slate-100 disabled:text-slate-600 font-medium"
                  >
                    {organizations
                      .filter(o => o.type === 'KHOA')
                      .map(k => (
                        <option key={k.code} value={k.code}>
                          Khoa {k.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Niên Khóa</label>
                  <input
                    type="text"
                    required
                    value={editClassForm.academicYear}
                    onChange={e => setEditClassForm(prev => ({ ...prev, academicYear: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 font-mono"
                    placeholder="2024-2028"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Xếp loại chất lượng (4 mức chuẩn)
                </label>
                <select
                  value={editClassForm.qualityRank}
                  onChange={e => setEditClassForm(prev => ({ ...prev, qualityRank: e.target.value as ChiDoanRank | '' }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  <option value="">-- Tự động đánh giá theo ĐRL sinh viên --</option>
                  {CHI_DOAN_QUALITY_RANKS.map(rk => (
                    <option key={rk} value={rk}>
                      {rk}
                    </option>
                  ))}
                </select>
              </div>

              {/* Thông tin hồ sơ sinh viên liên quan */}
              <div className="p-3 bg-teal-50 rounded-xl border border-teal-200">
                <p className="font-bold text-teal-900 text-xs">Sĩ số sinh viên chi đoàn:</p>
                <p className="text-[11px] text-teal-700 mt-0.5">
                  Hiện có <span className="font-mono font-bold text-teal-950">{students.filter(s => s.classCode === editingClass.code).length}</span> sinh viên có hồ sơ trong hệ thống liên kết với mã chi đoàn này. Khi lưu, toàn bộ hồ sơ sinh viên sẽ tự động đồng bộ theo mã mới.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-xs transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu Thay Đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác Nhận Xóa Chi Đoàn */}
      {deletingClass && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-rose-700 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-200" />
                <span>Xác Nhận Xóa Chi Đoàn</span>
              </h3>
              <button
                type="button"
                onClick={() => setDeletingClass(null)}
                className="text-rose-200 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <p className="font-bold text-rose-950 text-sm">
                  Bạn có chắc chắn muốn xóa chi đoàn sau?
                </p>
                <div className="space-y-1 text-slate-700 pt-1 text-xs">
                  <div>• Mã Chi đoàn: <strong className="font-mono text-rose-900">{deletingClass.code}</strong></div>
                  <div>• Tên Chi đoàn: <strong className="text-slate-900">{deletingClass.name}</strong></div>
                  <div>• Khoa: <strong className="text-slate-900">{facultyMap[deletingClass.facultyCode] || deletingClass.facultyCode}</strong></div>
                  <div>• Niên khóa: <strong className="text-slate-900">{deletingClass.academicYear}</strong></div>
                </div>
              </div>

              {(() => {
                const count = students.filter(s => s.classCode === deletingClass.code).length;
                if (count > 0) {
                  return (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-amber-950 mb-1">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Lưu ý quan trọng:</span>
                      </div>
                      <p>
                        Hiện có <span className="font-bold underline">{count} hồ sơ sinh viên</span> đang thuộc chi đoàn này. Việc xóa chi đoàn sẽ gỡ bỏ phân cấp danh mục nhưng giữ nguyên dữ liệu điểm của sinh viên.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

              <p className="text-slate-500 text-[11px]">
                Hành động này sẽ gỡ bỏ chi đoàn khỏi danh mục quản lý của hệ thống.
              </p>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeletingClass(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={handleDeleteClassConfirm}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xác Nhận Xóa</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác Nhận Xóa Đơn Vị */}
      {deletingOrg && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-rose-700 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-200" />
                <span>Xác Nhận Xóa Đơn Vị</span>
              </h3>
              <button
                type="button"
                onClick={() => setDeletingOrg(null)}
                className="text-rose-200 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <p className="font-bold text-rose-950 text-sm">
                  Bạn có chắc chắn muốn xóa đơn vị sau khỏi hệ thống?
                </p>
                <div className="space-y-1 text-slate-700 pt-1 text-xs">
                  <div>• Mã đơn vị: <strong className="font-mono text-rose-900">{deletingOrg.code}</strong></div>
                  <div>• Tên đơn vị: <strong className="text-slate-900">{deletingOrg.name}</strong></div>
                  <div>• Phân loại: <strong className="text-slate-900">{deletingOrg.type}</strong></div>
                  {deletingOrg.facultyCode && (
                    <div>• Thuộc khoa: <strong className="text-slate-900">{deletingOrg.facultyCode}</strong></div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeletingOrg(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteOrganization(deletingOrg.code);
                    setDeletingOrg(null);
                  }}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xác Nhận Xóa</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác Nhận Xóa Đơn Vị Hàng Loạt */}
      {showBatchDeleteOrgModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-rose-700 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-200" />
                <span>Xác Nhận Xóa Hàng Loạt {selectedOrgCodes.length} Đơn Vị</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowBatchDeleteOrgModal(false)}
                className="text-rose-200 hover:text-white transition cursor-pointer text-base"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <p className="font-bold text-rose-950 text-sm">
                  Bạn có chắc chắn muốn xóa hàng loạt {selectedOrgCodes.length} đơn vị đã chọn khỏi hệ thống?
                </p>
                <p className="text-rose-800 text-xs">
                  Danh sách đơn vị sẽ bị gỡ bỏ khỏi danh mục tổ chức Đoàn - Hội:
                </p>
                <div className="max-h-36 overflow-y-auto bg-white p-2.5 rounded-lg border border-rose-200 space-y-1">
                  {selectedOrgCodes.map(code => {
                    const org = organizations.find(o => o.code === code);
                    return (
                      <div key={code} className="flex items-center justify-between text-[11px] py-0.5 border-b border-slate-100 last:border-b-0">
                        <span className="font-mono font-bold text-rose-900">[{code}]</span>
                        <span className="text-slate-800 font-medium truncate max-w-[280px]">{org?.name || code}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Lý do xóa hàng loạt đơn vị (Không bắt buộc)
                </label>
                <textarea
                  value={batchDeleteOrgReason}
                  onChange={e => setBatchDeleteOrgReason(e.target.value)}
                  placeholder="Nhập lý do xóa danh mục đơn vị..."
                  rows={2}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBatchDeleteOrgModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBatchDeleteOrgs}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xác Nhận Xóa {selectedOrgCodes.length} Đơn Vị</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác Nhận Xóa Chi Đoàn Hàng Loạt */}
      {showBatchDeleteClassModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-rose-700 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-200" />
                <span>Xác Nhận Xóa Hàng Loạt {selectedClassCodes.length} Chi Đoàn</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowBatchDeleteClassModal(false)}
                className="text-rose-200 hover:text-white transition cursor-pointer text-base"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <p className="font-bold text-rose-950 text-sm">
                  Bạn có chắc chắn muốn xóa hàng loạt {selectedClassCodes.length} chi đoàn đã chọn khỏi danh mục?
                </p>
                <div className="max-h-36 overflow-y-auto bg-white p-2.5 rounded-lg border border-rose-200 space-y-1">
                  {selectedClassCodes.map(code => {
                    const cls = branchClasses.find(c => c.code === code);
                    return (
                      <div key={code} className="flex items-center justify-between text-[11px] py-0.5 border-b border-slate-100 last:border-b-0">
                        <span className="font-mono font-bold text-rose-900">[{code}]</span>
                        <span className="text-slate-800 font-medium truncate max-w-[280px]">{cls?.name || code}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Lý do xóa hàng loạt chi đoàn (Không bắt buộc)
                </label>
                <textarea
                  value={batchDeleteClassReason}
                  onChange={e => setBatchDeleteClassReason(e.target.value)}
                  placeholder="Nhập lý do xóa chi đoàn..."
                  rows={2}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBatchDeleteClassModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBatchDeleteClasses}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xác Nhận Xóa {selectedClassCodes.length} Chi Đoàn</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nhập Đơn Vị Hàng Loạt Bằng Excel (Cấp Trường) */}
      <BulkOrgImportModal
        isOpen={showBulkOrgModal}
        onClose={() => setShowBulkOrgModal(false)}
      />

      {/* Modal Nhập Chi Đoàn Hàng Loạt Bằng Excel (Cấp Trường & Cấp Khoa) */}
      <BulkClassImportModal
        isOpen={showBulkClassModal}
        onClose={() => setShowBulkClassModal(false)}
      />
    </div>
  );
};
