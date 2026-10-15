import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StudentMembership, getClubCategory } from '../types';
import {
  UserPlus,
  X,
  Save,
  Building,
  GraduationCap,
  Sparkles,
  Users,
  Award,
  BookOpen,
  Trophy,
  Briefcase
} from 'lucide-react';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({ isOpen, onClose }) => {
  const { addStudent, organizations, branchClasses, user, showToast } = useApp();

  const faculties = organizations.filter(o => o.type === 'KHOA');
  const availableClubs = useMemo(() => {
    return organizations.filter(o => o.type === 'CLB_TRUONG' || o.type === 'CLB_KHOA');
  }, [organizations]);

  const userLevel = user.currentRole.roleLevel;
  const userOrg = user.currentRole.orgCode;
  const userClass = user.currentRole.classCode;

  const initialFaculty = userLevel === 3 || userLevel === 2 ? (userOrg || faculties[0]?.code || 'CNTT') : (faculties[0]?.code || 'CNTT');
  const initialClass = userLevel === 2 ? (userClass || '') : '';

  const [studentId, setStudentId] = useState('');
  const [fullName, setFullName] = useState('');
  const [facultyCode, setFacultyCode] = useState(initialFaculty);
  const [classCode, setClassCode] = useState(initialClass);
  const [membershipType, setMembershipType] = useState<StudentMembership>('DOAN_VIEN');
  const [academicYearNumber, setAcademicYearNumber] = useState<number>(1);
  const [selectedClubCodes, setSelectedClubCodes] = useState<string[]>([]);

  // Initial scores
  const [activityScore, setActivityScore] = useState(0);
  const [bonusScore, setBonusScore] = useState(0);
  const [positionScore, setPositionScore] = useState(0);
  const [researchScore, setResearchScore] = useState(0);

  if (!isOpen) return null;

  // Cho phép Cấp 2 (Chi đoàn/Lớp), Cấp 3 (Đoàn khoa/CLB) và Cấp 4 (Cấp trường) có quyền thêm sinh viên
  if (userLevel < 2) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-150">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <X className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Giới Hạn Thẩm Quyền</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Chức năng thêm sinh viên mới vào danh mục chỉ dành cho tài khoản cán bộ Cấp 2 trở lên.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition w-full"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  // Filter available classes by selected faculty
  const availableClasses = branchClasses.filter(c => c.facultyCode === facultyCode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanId = studentId.trim();
    const cleanName = fullName.trim();

    if (!cleanId || cleanId.length < 4) {
      showToast('MSSV phải có ít nhất 4 ký tự hợp lệ!', 'error');
      return;
    }
    if (!cleanName) {
      showToast('Họ và tên sinh viên không được để trống!', 'error');
      return;
    }

    // Enforce role-scoped faculty and class to ensure compliance with Firestore security rules
    const effectiveFaculty = userLevel === 3 || userLevel === 2 ? (userOrg || facultyCode) : facultyCode;
    const effectiveClass = userLevel === 2 ? (userClass || classCode || availableClasses[0]?.code || 'DH24IT01') : (classCode.trim() || availableClasses[0]?.code || 'DH24IT01');

    const assignedClass = effectiveClass;
    const primaryClub = selectedClubCodes[0] || undefined;
    const primaryClubOrg = primaryClub ? availableClubs.find(c => c.code === primaryClub) : undefined;
    const clubCatInfo = primaryClubOrg ? getClubCategory(primaryClubOrg) : undefined;

    const success = addStudent({
      studentId: cleanId,
      fullName: cleanName,
      classCode: assignedClass,
      facultyCode: effectiveFaculty,
      clubCodes: selectedClubCodes,
      clubCode: primaryClub,
      clubName: primaryClubOrg?.name,
      clubCategory: clubCatInfo?.category,
      membershipType,
      academicYearNumber,
      activityScore: Number(activityScore) || 0,
      bonusScore: Number(bonusScore) || 0,
      positionScore: Number(positionScore) || 0,
      researchScore: Number(researchScore) || 0,
    });

    if (success) {
      // Reset form
      setStudentId('');
      setFullName('');
      setSelectedClubCodes([]);
      setActivityScore(0);
      setBonusScore(0);
      setPositionScore(0);
      setResearchScore(0);
      onClose();
    }
  };

  const totalScorePreview =
    Number(activityScore || 0) +
    Number(bonusScore || 0) +
    Number(positionScore || 0) +
    Number(researchScore || 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-0 sm:my-6 animate-in fade-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 px-4 sm:px-6 py-3.5 sm:py-4 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-bold flex items-center gap-2 truncate">
              <UserPlus className="w-5 h-5 text-emerald-300 shrink-0" />
              Thêm Mới Sinh Viên Vào Danh Mục
            </h3>
            <p className="text-[11px] sm:text-xs text-emerald-100 line-clamp-1">
              Dữ liệu được liên kết đồng bộ tức thì với Sổ Điểm, Cổng Sinh Viên & Đánh giá SV5T
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs custom-scrollbar">
          {/* Thông tin định danh */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Mã Số Sinh Viên (MSSV) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: 25130099"
                value={studentId}
                onChange={e => {
                  const val = e.target.value;
                  setStudentId(val);
                  const clean = val.trim();
                  if (clean.length >= 2) {
                    if (clean.startsWith('25') || clean.startsWith('26')) setAcademicYearNumber(1);
                    else if (clean.startsWith('24')) setAcademicYearNumber(2);
                    else if (clean.startsWith('23')) setAcademicYearNumber(3);
                    else if (clean.startsWith('22')) setAcademicYearNumber(4);
                    else if (clean.startsWith('21') || clean.startsWith('20') || clean.startsWith('19')) setAcademicYearNumber(5);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Họ và Tên Sinh Viên <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: Nguyễn Văn An"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Khoa, Chi đoàn, Đối tượng, Khóa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-500" />
                Khoa Đào Tạo
              </label>
              <select
                value={facultyCode}
                onChange={e => {
                  setFacultyCode(e.target.value);
                  setClassCode('');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
              >
                {faculties.map(f => (
                  <option key={f.code} value={f.code}>
                    {f.name} ({f.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                Chi Đoàn / Lớp
              </label>
              <input
                type="text"
                list="branchClassesList"
                placeholder="VD: DH24IT01"
                value={classCode}
                onChange={e => setClassCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 font-mono font-medium text-slate-800"
              />
              <datalist id="branchClassesList">
                {availableClasses.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                Đối Tượng
              </label>
              <select
                value={membershipType}
                onChange={e => setMembershipType(e.target.value as StudentMembership)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
              >
                <option value="DOAN_VIEN">Đoàn viên</option>
                <option value="HOI_VIEN">Hội viên</option>
                <option value="SINH_VIEN">Sinh viên</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Khóa Năm Học</label>
              <select
                value={academicYearNumber}
                onChange={e => setAcademicYearNumber(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
              >
                <option value={1}>Khóa 52 (Năm 1 - Khóa mới)</option>
                <option value={2}>Khóa 51 (Năm 2)</option>
                <option value={3}>Khóa 50 (Năm 3)</option>
                <option value={4}>Khóa 49 (Năm 4)</option>
                <option value={5}>Khóa 48+ (Năm 5+)</option>
              </select>
            </div>
          </div>

          {/* CLB / Đội nhóm trực thuộc theo danh mục */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700 text-xs">
                Câu Lạc Bộ, Tổ, Đội, Nhóm (Theo danh mục)
              </label>
              <span className="text-[10px] text-slate-400">Chọn từ {availableClubs.length} CLB của trường</span>
            </div>

            <div className="relative">
              <select
                value=""
                onChange={e => {
                  const val = e.target.value;
                  if (val && !selectedClubCodes.includes(val)) {
                    setSelectedClubCodes([...selectedClubCodes, val]);
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-700 cursor-pointer"
              >
                <option value="">-- Chọn Câu Lạc Bộ, Tổ, Đội, Nhóm để thêm vào hồ sơ --</option>
                <optgroup label="🏛️ Cấp Trường (Câu Lạc Bộ, Tổ, Đội, Nhóm)">
                  {availableClubs
                    .filter(c => c.type === 'CLB_TRUONG')
                    .map(club => {
                      const cat = getClubCategory(club);
                      return (
                        <option key={club.code} value={club.code} disabled={selectedClubCodes.includes(club.code)}>
                          [{cat.label}] {club.name} ({club.code}) {selectedClubCodes.includes(club.code) ? '✓ Đã chọn' : ''}
                        </option>
                      );
                    })}
                </optgroup>
                <optgroup label="🏢 Cấp Khoa (Câu Lạc Bộ, Đội, Nhóm trực thuộc Khoa)">
                  {availableClubs
                    .filter(c => c.type === 'CLB_KHOA')
                    .map(club => {
                      const cat = getClubCategory(club);
                      return (
                        <option key={club.code} value={club.code} disabled={selectedClubCodes.includes(club.code)}>
                          [{cat.label}] {club.name} ({club.code}) - Khoa {club.facultyCode} {selectedClubCodes.includes(club.code) ? '✓ Đã chọn' : ''}
                        </option>
                      );
                    })}
                </optgroup>
              </select>
            </div>

            {/* Selected Club Tags */}
            {selectedClubCodes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                {selectedClubCodes.map(code => {
                  const clubOrg = availableClubs.find(c => c.code === code);
                  const cat = clubOrg ? getClubCategory(clubOrg) : undefined;
                  return (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-2xs"
                    >
                      {cat && (
                        <span className="text-[10px] px-1 py-0.2 rounded bg-indigo-200 text-indigo-900 font-extrabold uppercase">
                          {cat.label}
                        </span>
                      )}
                      <span>{clubOrg?.name || code}</span>
                      <span className="text-[10px] font-mono text-indigo-500">[{code}]</span>
                      <button
                        type="button"
                        onClick={() => setSelectedClubCodes(selectedClubCodes.filter(c => c !== code))}
                        className="text-indigo-400 hover:text-indigo-700 ml-0.5 cursor-pointer"
                        title="Xóa khỏi danh sách"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Khởi tạo điểm số rèn luyện ban đầu */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-600" />
                Khởi Tạo Điểm Rèn Luyện Ban Đầu (Tùy chọn)
              </span>
              <span className="text-[11px] text-slate-500">Mặc định 0đ nếu là sinh viên mới</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  1. Điểm Hoạt động
                </label>
                <input
                  type="number"
                  min={0}
                  value={activityScore}
                  onChange={e => setActivityScore(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-amber-700 mb-1">
                  2. Điểm Khen thưởng
                </label>
                <input
                  type="number"
                  min={0}
                  value={bonusScore}
                  onChange={e => setBonusScore(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold text-amber-700 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-blue-700 mb-1">
                  3. Điểm Chức vụ
                </label>
                <input
                  type="number"
                  min={0}
                  value={positionScore}
                  onChange={e => setPositionScore(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold text-blue-700 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-purple-700 mb-1">
                  4. Điểm NCKH
                </label>
                <input
                  type="number"
                  min={0}
                  value={researchScore}
                  onChange={e => setResearchScore(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold text-purple-700 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Tổng điểm khởi tạo:</span>
              <span className="text-sm font-black text-emerald-700">{totalScorePreview} điểm</span>
            </div>
          </div>

          {/* Banner liên kết SV5T & Cổng SV */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3 flex items-start gap-2.5 text-emerald-900">
            <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold">Liên kết dữ liệu tự động:</span> Sinh viên sau khi thêm vào danh mục sẽ lập tức được cấp hồ sơ trên <strong>Cổng Sinh Viên</strong>, theo dõi tiến độ xét <strong>Sinh viên 5 tốt (5 tiêu chuẩn)</strong>, cấp Giấy chứng nhận điện tử và tham gia đăng ký hoạt động Đoàn - Hội.
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-xs transition cursor-pointer min-h-[38px]"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow-blue-700/30 transition cursor-pointer min-h-[38px] active:scale-95"
            >
              <Save className="w-4 h-4 text-blue-100" />
              <span>Lưu & Tạo Hồ Sơ Sinh Viên</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
