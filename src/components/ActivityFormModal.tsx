import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  HOST_LEVEL_POINTS,
  calculateProgramLevelScore,
  CURRENT_ACADEMIC_YEAR
} from '../data/mockData';
import { fetchDriveFiles } from '../services/driveService';
import { DriveItem, PlanYearOption } from '../types';
import { logFirestoreWriteDiagnostic } from '../utils/firestoreDiagnosticLogger';
import { normalizeActivityTitle } from '../utils/aiTitleNormalizer';
import { isSchoolYouthUnionOrAssociation } from '../utils/dataIntegrity';
import {
  X,
  Calendar,
  Building,
  Users,
  FileText,
  Award,
  Link as LinkIcon,
  CheckCircle2,
  HardDrive,
  Info,
  ShieldCheck,
  Calculator,
  Sparkles,
  Wand2,
  Loader2
} from 'lucide-react';

interface ActivityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ActivityFormModal: React.FC<ActivityFormModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    addActivity,
    showToast,
    accessToken,
    googleUser,
    organizations,
    branchClasses,
    targetScaleConfig,
    drlCriteria,
    sv5tStandards,
    hoiPrograms,
    doanPrograms
  } = useApp();

  const SV5T_CRITERIA = sv5tStandards.flatMap(std =>
    std.criteria.map(c => ({ id: c.id, title: c.title, group: std.name }))
  );
  const currentLevel = user.currentRole.roleLevel;
  const currentOrgCode = user.currentRole.orgCode;
  const currentClassCode = user.currentRole.classCode;

  // Form Fields (C.1 - C.15)
  const [title, setTitle] = useState(''); // 1. Tên chương trình
  const [isNormalizingTitle, setIsNormalizingTitle] = useState(false);
  const [orgCode, setOrgCode] = useState(currentOrgCode || 'DT'); // 2. Đơn vị tổ chức
  const [branchClass, setBranchClass] = useState(currentClassCode || ''); // 3. Chi đoàn tổ chức
  const [scaleId, setScaleId] = useState(4); // 4. Quy mô đối tượng (1-6)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]); // 5. Ngày tổ chức
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [managerName, setManagerName] = useState(user.fullName); // 6. Người phụ trách
  const [managerStudentId, setManagerStudentId] = useState(user.studentId || '22130001');
  const [signedDocUrl, setSignedDocUrl] = useState(''); // 7. Link VB trình ký (Drive)
  const [proofArticleUrl, setProofArticleUrl] = useState(''); // 8. Link bài viết minh chứng
  const [needsCertificate, setNeedsCertificate] = useState(false);
  const [planYear, setPlanYear] = useState<string>(CURRENT_ACADEMIC_YEAR);
  const [semester, setSemester] = useState<'HK1' | 'HK2' | 'HK_HE'>('HK1');
  const [activityType, setActivityType] = useState<'DOAN' | 'HOI' | 'DOAN_HOI'>('DOAN_HOI');
  const [planYearOption, setPlanYearOption] = useState<PlanYearOption>('Trong kế hoạch năm'); // 10. Thuộc kế hoạch năm (2 lựa chọn)
  const [drlCriteriaId, setDrlCriteriaId] = useState('B2'); // 11. Tiêu chí ĐRL
  const [sv5tCriteriaId, setSv5tCriteriaId] = useState('B8.2'); // 12. Tiêu chí SV5T
  const [hoiProgramId, setHoiProgramId] = useState('3'); // 13. Mảng CT Hội
  const [doanProgramId, setDoanProgramId] = useState('KR2.3'); // 14. Mảng CT Đoàn
  const [dataCommitment, setDataCommitment] = useState(false); // 15. Cam kết dữ liệu

  // Tự động cập nhật học kỳ theo ngày bắt đầu nếu người dùng chọn ngày
  useEffect(() => {
    if (startDate) {
      try {
        const month = new Date(startDate).getMonth() + 1;
        if (month >= 9 || month === 1) setSemester('HK1');
        else if (month >= 2 && month <= 6) setSemester('HK2');
        else if (month >= 7 && month <= 8) setSemester('HK_HE');
      } catch {}
    }
  }, [startDate]);

  // Google Drive File Picker Integration
  const [driveFiles, setDriveFiles] = useState<DriveItem[]>([]);
  const [loadingDrive, setLoadingDrive] = useState(false);
  const [showDrivePicker, setShowDrivePicker] = useState(false);

  // Selected Organization
  const selectedOrg = organizations.find(o => o.code === orgCode) || organizations[0];

  // Logic 3.1: Nếu đơn vị tổ chức là Cấp Khoa -> Tự động hiển thị danh sách Chi đoàn thuộc Khoa đó.
  // Nếu là CLB/Tổ/Đội/Nhóm hoặc Cấp Trường -> Tự động ẨN trường Chi đoàn!
  const isFacultyOrg = selectedOrg?.type === 'KHOA';
  const facultyBranchClasses = branchClasses.filter(c => c.facultyCode === selectedOrg?.code);

  // Auto-select first class when faculty changes
  useEffect(() => {
    if (isFacultyOrg && facultyBranchClasses.length > 0) {
      if (!facultyBranchClasses.some(c => c.code === branchClass)) {
        setBranchClass(facultyBranchClasses[0].code);
      }
    } else {
      setBranchClass('');
    }
  }, [orgCode, isFacultyOrg]);

  // Selected Target Scale
  const selectedScale = targetScaleConfig.find((s: any) => s.id === scaleId) || targetScaleConfig[0];

  // Selected Host Level Points (from organization)
  const hostLevelPts = selectedOrg.hostLevelScorePoint || 3;
  const hostLevelConfig = HOST_LEVEL_POINTS.find(h => h.points === hostLevelPts) || HOST_LEVEL_POINTS[2];

  // Kiểm tra ràng buộc đơn vị Cấp Trường: Đoàn trường / Hội Sinh viên trường
  const isSchoolOrg = isSchoolYouthUnionOrAssociation(orgCode, selectedOrg?.name);

  // Initial calculation (participantCount = 0 before Excel roster upload per requirement)
  // Ràng buộc quy chế NLU: Chương trình của Đoàn trường, Hội Sinh viên trường phải từ Cấp 3 trở lên
  const initialCalculated = calculateProgramLevelScore(
    selectedScale.points,
    0,
    hostLevelPts,
    { orgCode, orgName: selectedOrg?.name }
  );

  // Load user's Google Drive files
  const handleOpenDrivePicker = async () => {
    if (!accessToken) {
      alert('Vui lòng kết nối tài khoản Google Drive ở góc trên màn hình trước khi chọn tệp.');
      return;
    }
    setLoadingDrive(true);
    setShowDrivePicker(true);
    try {
      const files = await fetchDriveFiles(accessToken);
      setDriveFiles(files);
    } catch (err: any) {
      alert('Không thể tải tệp từ Google Drive: ' + (err.message || 'Lỗi'));
    } finally {
      setLoadingDrive(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataCommitment) {
      alert('Vui lòng tích vào mục số 15: Cam kết tính chính xác của dữ liệu chương trình!');
      return;
    }

    if (isSchoolOrg && initialCalculated.programLevel < 3) {
      alert('Ràng buộc quy chế: Chương trình/hoạt động do Đoàn trường, Hội Sinh viên trường tổ chức phải là chương trình Cấp 3 trở lên!');
      return;
    }

    const drl = drlCriteria.find((c: any) => c.id === drlCriteriaId);
    const sv5t = SV5T_CRITERIA.find((s: any) => s.id === sv5tCriteriaId);
    const hoi = hoiPrograms.find((h: any) => h.id === hoiProgramId);
    const doan = doanPrograms.find((d: any) => d.id === doanProgramId);

    const activityPayload = {
      title,
      orgCode,
      orgName: selectedOrg.name,
      branchClass: isFacultyOrg ? branchClass : undefined,
      scaleId,
      scaleName: selectedScale.name,
      scalePoints: selectedScale.points,
      officialParticipantCount: 0,
      participantScorePoints: 0,
      hostLevel: selectedOrg.hostLevel, // 'A' hoặc 'B' để tự động sinh mã A001/B001
      hostLevelId: hostLevelPts,
      hostLevelName: selectedOrg.hostLevelName,
      hostLevelPoints: hostLevelPts,
      totalLevelScore: initialCalculated.totalScore,
      programLevel: initialCalculated.programLevel,
      startDate,
      endDate,
      managerName,
      managerStudentId,
      signedDocUrl: signedDocUrl || 'https://drive.google.com/drive/folders/nlu-youth-activity',
      proofArticleUrl: proofArticleUrl || 'https://tuoitrenonglam.com',
      needsCertificate,
      planYear,
      semester,
      activityType,
      planYearOption,
      drlCriteriaId,
      drlCriteriaText: drl?.title || '',
      sv5tCriteriaId,
      sv5tCriteriaText: sv5t?.title || '',
      hoiProgramId,
      hoiProgramText: hoi?.title || '',
      doanProgramId,
      doanProgramText: doan?.title || '',
      dataCommitment,
    };

    try {
      const success = addActivity(activityPayload);
      if (success !== false) {
        onClose();
      }
    } catch (err) {
      logFirestoreWriteDiagnostic('CREATE_ACTIVITY', activityPayload, err, showToast, {
        email: user?.email,
        id: user?.id,
        roleLevel: user?.currentRole?.roleLevel,
        orgCode: user?.currentRole?.orgCode
      });
    }
  };

  const handleAINormalizeTitle = async () => {
    if (!title.trim()) {
      showToast('Vui lòng nhập tên hoạt động ban đầu trước khi chuẩn hóa!', 'warning');
      return;
    }
    setIsNormalizingTitle(true);
    const selectedOrg = organizations.find(o => o.code === orgCode);
    const res = await normalizeActivityTitle(title, { orgName: selectedOrg?.name });
    setIsNormalizingTitle(false);
    if (res.normalizedTitle && res.normalizedTitle !== title) {
      setTitle(res.normalizedTitle);
      showToast('Đã chuẩn hóa tên chương trình bằng AI thành công!', 'success');
    } else {
      showToast('Tên chương trình đã khá đầy đủ và trọn vẹn ý nghĩa.', 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl max-w-4xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-0 sm:my-6 animate-in fade-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 px-4 sm:px-6 py-3.5 sm:py-4 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-300 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold truncate">
                Đăng Ký Hoạt Động & Chương Trình
              </h3>
              <span className="text-[10px] sm:text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-semibold shrink-0">
                {CURRENT_ACADEMIC_YEAR}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-emerald-100 mt-0.5 line-clamp-1">
              Áp dụng công thức 3 thành phần: Quy mô đối tượng + Số lượng tham gia + Cấp đăng cai
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
          {/* New 3-Component Formula Banner */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-extrabold text-emerald-800 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-emerald-700" />
                Công Thức Phân Cấp Chương Trình (Quy Định Mới NLU 2026-2027)
              </span>
              <span className="px-3 py-1 bg-emerald-700 text-white font-black text-xs rounded-lg shadow-xs">
                Xếp loại: Chương trình Cấp {initialCalculated.programLevel} ({initialCalculated.totalScore} điểm khởi tạo)
              </span>
            </div>
            <p className="text-xs text-slate-700">
              <span className="font-bold">Điểm phân cấp chương trình</span> = Điểm Quy mô đối tượng ({selectedScale.points}đ) + Điểm Số lượng tham gia ({0}đ - mặc định 0 khi đăng ký, cập nhật sau qua file Excel) + Điểm Cấp đăng cai ({hostLevelPts}đ) = <span className="font-extrabold text-emerald-800 text-sm">{initialCalculated.totalScore} điểm</span>.
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-600 pt-1">
              <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200">Cấp 1: 0 - 5đ</span>
              <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200">Cấp 2: 6 - 11đ</span>
              <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200">Cấp 3: 12 - 17đ</span>
              <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-bold text-emerald-800">Cấp 4: ≥ 18đ (Không trần)</span>
            </div>

            {/* Ràng buộc đối với Đoàn trường / Hội Sinh viên trường */}
            {isSchoolOrg && (
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-2.5 flex items-start gap-2 text-xs text-amber-900 mt-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Ràng buộc quy chế Đoàn trường / Hội Sinh viên trường:</span> Chương trình, hoạt động do <strong>{selectedOrg.name}</strong> tổ chức bắt buộc phải là chương trình <strong>Cấp 3 trở lên</strong> (Cấp 3 hoặc Cấp 4).
                  {initialCalculated.isSchoolEnforcedLevel && (
                    <span className="block text-[11px] text-amber-800 mt-0.5">
                      (Đã kích hoạt mức sàn tối thiểu Cấp 3 theo quy chế phân cấp NLU Youth 2026).
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 1: Thông tin cơ bản (C.1 - C.6) */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-1">
              Phần I: Thông tin cơ bản, Đơn vị & Quy mô (C.1 - C.6)
            </h4>

            {/* C.1: Tên chương trình */}
            <div>
              <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                <label className="block text-xs font-bold text-slate-800">
                  1. Tên chương trình / hoạt động <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAINormalizeTitle}
                  disabled={isNormalizingTitle || !title.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition disabled:opacity-50 cursor-pointer"
                  title="Tự động mở rộng từ viết tắt và chuẩn hóa tên chương trình đầy đủ ý nghĩa bằng AI Gemini"
                >
                  {isNormalizingTitle ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  )}
                  <span>{isNormalizingTitle ? 'Đang AI chuẩn hóa...' : 'AI Chuẩn Hóa Tên'}</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Vd: MHX NLU 2026 -> Bấm 'AI Chuẩn Hóa Tên' để tự động mở rộng thành: Chiến dịch Tình nguyện Mùa Hè Xanh Trường Đại học Nông Lâm TP.HCM năm 2026"
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
              />
            </div>

            {/* C.2 & C.3: Đơn vị tổ chức & Chi đoàn (Logic Tự Động) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  2. Đơn vị tổ chức (Lookup D.2 - 53 đơn vị NLU) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={orgCode}
                  onChange={e => setOrgCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                >
                  {organizations.map(org => (
                    <option key={org.code} value={org.code}>
                      [{org.code}] {org.name} ({org.hostLevelName} - {org.hostLevelScorePoint}đ)
                    </option>
                  ))}
                </select>
              </div>

              {/* C.3: Chi đoàn tổ chức (Chỉ hiện khi chọn Khoa, ẩn ở CLB/Trường) */}
              {isFacultyOrg ? (
                <div>
                  <label className="block text-xs font-bold text-emerald-800 mb-1">
                    3. Chi đoàn tổ chức (Tự động hiển thị theo Khoa {selectedOrg.name}) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={branchClass}
                    onChange={e => setBranchClass(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-emerald-300 bg-emerald-50/50 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                  >
                    {facultyBranchClasses.length > 0 ? (
                      facultyBranchClasses.map(cls => (
                        <option key={cls.code} value={cls.code}>
                          {cls.name} ({cls.studentCount} đoàn viên)
                        </option>
                      ))
                    ) : (
                      <option value="">Chi đoàn trực thuộc Khoa {selectedOrg.code}</option>
                    )}
                  </select>
                </div>
              ) : (
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-500 flex items-center">
                  <Info className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                  Mục C.3 (Chi đoàn tổ chức) được tự động ẩn vì đơn vị tổ chức là {selectedOrg.type === 'TRUONG' ? 'Cấp Trường' : 'CLB/Tổ/Đội/Nhóm'}.
                </div>
              )}
            </div>

            {/* C.4: Quy mô đối tượng tham gia (1 - 6 điểm) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  4. Quy mô đối tượng tham gia (Thành phần 1: 1 - 6 điểm) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={scaleId}
                  onChange={e => setScaleId(parseInt(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  {targetScaleConfig.map((scale: any) => (
                    <option key={scale.id} value={scale.id}>
                      {scale.name} ({scale.points} điểm)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Cấp đăng cai tổ chức (Thành phần 3: Tự động từ đơn vị)
                </label>
                <div className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium">
                  {selectedOrg.hostLevelName} <span className="font-bold text-emerald-700">({hostLevelPts} điểm)</span>
                </div>
              </div>
            </div>

            {/* Dates & Manager (C.5, C.6) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  5. Ngày bắt đầu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Ngày kết thúc
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  6. Người phụ trách (C.6 Lookup) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={managerName}
                  onChange={e => setManagerName(e.target.value)}
                  placeholder="Họ và tên cán bộ phụ trách"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Tài liệu & Google Drive Minh chứng (C.7 - C.10) */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-1">
              Phần II: Hồ sơ Văn bản, Google Drive & Kế hoạch (C.7 - C.10)
            </h4>

            {/* C.7: Link VB Trình ký (Drive URL) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-800">
                  7. Link Văn bản trình ký (Google Drive URL) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleOpenDrivePicker}
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
                >
                  <HardDrive className="w-3.5 h-3.5 text-sky-600" />
                  {googleUser ? 'Chọn tệp từ Google Drive' : 'Duyệt Google Drive (OAuth)'}
                </button>
              </div>
              <input
                type="url"
                required
                value={signedDocUrl}
                onChange={e => setSignedDocUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
              />

              {/* Inline Drive File Picker */}
              {showDrivePicker && (
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-sky-600" />
                      Tệp Google Drive của bạn ({googleUser?.email})
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowDrivePicker(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {loadingDrive ? (
                    <p className="text-xs text-slate-500 py-2">Đang tải tệp từ Google Drive...</p>
                  ) : driveFiles.length === 0 ? (
                    <p className="text-xs text-slate-500 py-2">Không tìm thấy tệp nào hoặc chưa kết nối.</p>
                  ) : (
                    <div className="max-h-36 overflow-y-auto divide-y divide-slate-200 text-xs">
                      {driveFiles.map(file => (
                        <div
                          key={file.id}
                          onClick={() => {
                            setSignedDocUrl(file.webViewLink || '');
                            setShowDrivePicker(false);
                          }}
                          className="py-1.5 px-2 hover:bg-emerald-100/50 rounded-md cursor-pointer flex items-center justify-between"
                        >
                          <span className="truncate max-w-md font-medium text-slate-800">{file.name}</span>
                          <span className="text-[10px] text-slate-500">{file.modifiedTime}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* C.8 & C.9 & C.10 (Thuộc kế hoạch năm: 2 lựa chọn) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  8. Link Bài viết minh chứng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={proofArticleUrl}
                  onChange={e => setProofArticleUrl(e.target.value)}
                  placeholder="https://tuoitrenonglam.com/..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* C.10: Thuộc kế hoạch năm (2 lựa chọn chuẩn nghiệp vụ) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  10. Thuộc kế hoạch năm <span className="text-rose-500">*</span>
                </label>
                <select
                  value={planYearOption}
                  onChange={e => setPlanYearOption(e.target.value as PlanYearOption)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-semibold text-emerald-800"
                >
                  <option value="Trong kế hoạch năm">Trong kế hoạch năm</option>
                  <option value="Nằm ngoài kế hoạch năm">Nằm ngoài kế hoạch năm</option>
                </select>
              </div>

              {/* Phân loại Năm học & Học kỳ */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Năm học tổ chức <span className="text-rose-500">*</span>
                </label>
                <select
                  value={planYear}
                  onChange={e => setPlanYear(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                >
                  <option value="2026-2027">Năm học 2026-2027</option>
                  <option value="2025-2026">Năm học 2025-2026</option>
                  <option value="2024-2025">Năm học 2024-2025</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Học kỳ diễn ra <span className="text-rose-500">*</span>
                </label>
                <select
                  value={semester}
                  onChange={e => setSemester(e.target.value as 'HK1' | 'HK2' | 'HK_HE')}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                >
                  <option value="HK1">Học kỳ 1 (HK1)</option>
                  <option value="HK2">Học kỳ 2 (HK2)</option>
                  <option value="HK_HE">Học kỳ Hè (Chiến dịch hè)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Loại hình hoạt động (Đoàn/Hội) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={activityType}
                  onChange={e => setActivityType(e.target.value as 'DOAN' | 'HOI' | 'DOAN_HOI')}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                >
                  <option value="DOAN">Hoạt động Đoàn (Đoàn Thanh niên)</option>
                  <option value="HOI">Hoạt động Hội (Hội Sinh viên)</option>
                  <option value="DOAN_HOI">Liên tịch Phối hợp Đoàn - Hội</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Tiêu chí chuẩn hóa (C.11 - C.14) */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-1">
              Phần III: Tiêu chí ĐRL, SV5T & Mảng Công tác (C.11 - C.14)
            </h4>

            {/* C.11: Tiêu chí ĐRL */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                11. Tiêu chí Điểm Rèn Luyện (C.11 Lookup) <span className="text-rose-500">*</span>
              </label>
              <select
                value={drlCriteriaId}
                onChange={e => setDrlCriteriaId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {drlCriteria.map((c: any, idx: number) => (
                  <option key={`${c.id}_${idx}`} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* C.12: Tiêu chí SV5T */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                12. Tiêu chuẩn Sinh viên 5 Tốt (C.12 Lookup) <span className="text-rose-500">*</span>
              </label>
              <select
                value={sv5tCriteriaId}
                onChange={e => setSv5tCriteriaId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                {SV5T_CRITERIA.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    [{s.group}] {s.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* C.13: Mảng CT Hội */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  13. Mảng CT Hội & Phong trào SV (C.13) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={hoiProgramId}
                  onChange={e => setHoiProgramId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  {hoiPrograms.map((h: any) => (
                    <option key={h.id} value={h.id}>
                      {h.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* C.14: Mảng CT Đoàn */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  14. Mảng CT Đoàn & Phong trào TT (C.14) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={doanProgramId}
                  onChange={e => setDoanProgramId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  {doanPrograms.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* C.15: Cam kết dữ liệu */}
          <div className="bg-amber-50/70 border border-amber-300 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={dataCommitment}
                onChange={e => setDataCommitment(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500"
              />
              <div className="text-xs text-amber-900 leading-relaxed">
                <span className="font-bold">15. Cam kết dữ liệu:</span> Đơn vị cam kết toàn bộ thông tin đăng ký, văn bản trình ký và danh sách minh chứng là hoàn toàn trung thực, tuân thủ đúng Quy chế Đoàn - Hội Đại học Nông Lâm TP.HCM ({CURRENT_ACADEMIC_YEAR}).
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="sticky bottom-0 bg-white dark:bg-slate-900 flex items-center justify-end gap-3 pt-3 pb-1 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 min-h-[44px] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-md transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Gửi Hồ Sơ Phê Duyệt</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
