import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { StudentMembership, StudentScoreRecord } from '../types';
import { StudentCollectionIntegrityReport } from '../utils/dataIntegrity';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Users,
  Check,
  Building,
  RefreshCw,
  Info,
  ShieldCheck,
  AlertCircle,
  ShieldAlert,
  RotateCcw,
  Database,
  History,
  CheckCheck,
  Sparkles,
  Search,
  HardDrive
} from 'lucide-react';

interface BulkStudentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'integrity' | 'import';
}

export type ImportMode = 'add_only' | 'update_existing' | 'skip_duplicates';

export interface ParsedStudentRow {
  rowNumber: number;
  studentId: string;
  fullName: string;
  classCode: string;
  facultyCode: string;
  clubCodes?: string[];
  membershipType: StudentMembership;
  action: 'NEW' | 'UPDATE' | 'SKIP' | 'ERROR';
  isValid: boolean;
  isDuplicateInDb: boolean;
  isDuplicateInFile: boolean;
  errorMessage?: string;
}

export const BulkStudentImportModal: React.FC<BulkStudentImportModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'integrity'
}) => {
  const {
    students,
    allStudents,
    bulkImportStudents,
    organizations,
    branchClasses,
    user,
    showToast,
    checkStudentCollectionIntegrity,
    restoreStudentsFromLatestBackup,
    latestStudentBackupInfo,
    createStudentBackupSnapshot,
    autoFixUncatalogedClasses
  } = useApp();

  // Tab State: 'integrity' (Kiểm tra toàn vẹn & Khôi phục) | 'import' (Nhập Excel)
  const [activeTab, setActiveTab] = useState<'integrity' | 'import'>(initialTab);

  // Integrity Check State
  const [integrityReport, setIntegrityReport] = useState<StudentCollectionIntegrityReport | null>(null);
  const [isCheckingIntegrity, setIsCheckingIntegrity] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  // Excel Import State
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>('update_existing');
  const [filterView, setFilterView] = useState<'ALL' | 'NEW' | 'UPDATE' | 'SKIP' | 'ERROR'>('ALL');

  // Tự động kiểm tra tính toàn vẹn của collection sinh viên ngay khi modal mở ra
  const runAutoIntegrityCheck = () => {
    setIsCheckingIntegrity(true);
    try {
      const report = checkStudentCollectionIntegrity();
      setIntegrityReport(report);
    } catch (err) {
      console.error('Lỗi khi tự động kiểm tra tính toàn vẹn collection sinh viên:', err);
    } finally {
      setIsCheckingIntegrity(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      runAutoIntegrityCheck();
    }
  }, [isOpen, initialTab, allStudents.length]);

  // Xử lý khôi phục từ bản sao lưu gần nhất
  const handleConfirmRestore = async () => {
    setIsRestoring(true);
    try {
      const result = await restoreStudentsFromLatestBackup();
      if (result.success) {
        setShowRestoreModal(false);
        // Tự động chạy lại kiểm tra toàn vẹn sau khi khôi phục
        setTimeout(() => {
          runAutoIntegrityCheck();
        }, 300);
      }
    } finally {
      setIsRestoring(false);
    }
  };

  const filteredPreviewRows = useMemo(() => {
    if (filterView === 'ALL') return parsedRows;
    return parsedRows.filter(r => r.action === filterView);
  }, [parsedRows, filterView]);

  if (!isOpen) return null;

  // Cho phép Cấp 2 (Chi đoàn), Cấp 3 (Đoàn khoa/CLB) và Cấp 4 (Cấp trường) có quyền quản lý danh mục sinh viên
  if (user.currentRole.roleLevel < 2) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center animate-in fade-in zoom-in-95 duration-150">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <X className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Giới Hạn Thẩm Quyền</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Chức năng quản lý danh mục và kiểm tra tính toàn vẹn collection sinh viên chỉ dành cho tài khoản cán bộ được phân quyền từ Cấp 2 trở lên.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition w-full cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  // Tải file mẫu Excel
  const handleDownloadTemplate = () => {
    const headers = [
      'MSSV',
      'Họ và tên',
      'Mã Chi đoàn',
      'Mã Khoa',
      'Mã CLB / Tổ / Đội / Nhóm',
      'Đối tượng'
    ];

    const sampleRows = [
      ['24130111', 'Lê Nguyễn Bảo Anh', 'DH24IT01', 'CNTT', 'CLB_PWF, DOI_DXK', 'DOAN_VIEN'],
      ['24140022', 'Phạm Hoàng Khang', 'DH24IT01', 'CNTT', 'HGD', 'DOAN_VIEN'],
      ['24130333', 'Vũ Thị Minh Hạnh', 'DH24IT01', 'CNTT', 'NHOM_TRUYENTHONG', 'HOI_VIEN'],
      ['22140055', 'Nguyễn Tấn Đạt', 'DH22TY01', 'CNTY', 'CLB_DTY', 'DOAN_VIEN'],
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    ws['!cols'] = [
      { wch: 14 },
      { wch: 26 },
      { wch: 16 },
      { wch: 14 },
      { wch: 28 },
      { wch: 16 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mau_Sinh_Vien_NLU');
    XLSX.writeFile(wb, 'Mau_Nhap_Sinh_Vien_Doan_Hoi_NLU_2026.xlsx');
    showToast('Đã tải tệp mẫu Excel chuẩn hóa (.xlsx)!', 'success');
  };

  // Phân tích file Excel
  const parseRowsFromRawData = (data: any[][], mode: ImportMode): ParsedStudentRow[] => {
    if (!data || data.length < 2) return [];

    const existingMap = new Map<string, StudentScoreRecord>();
    students.forEach(s => {
      if (s.studentId) existingMap.set(s.studentId.trim().toLowerCase(), s);
    });

    const seenInFile = new Set<string>();
    const rows: ParsedStudentRow[] = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0 || !row[0]) continue;

      const studentId = String(row[0] || '').trim();
      const fullName = String(row[1] || '').trim();
      const rawClassCode = String(row[2] || '').trim().toUpperCase();
      const rawFacultyCode = String(row[3] || '').trim().toUpperCase();
      const clubStr = String(row[4] || '').trim();
      const clubCodes = clubStr
        ? clubStr.split(',').map(c => c.trim().toUpperCase()).filter(Boolean)
        : [];
      
      let membershipType: StudentMembership = 'DOAN_VIEN';
      const memRaw = String(row[5] || '').toUpperCase();
      if (memRaw.includes('HOI') || memRaw === 'HOI_VIEN') membershipType = 'HOI_VIEN';
      else if (memRaw.includes('SINH_VIEN') || memRaw === 'SV') membershipType = 'SINH_VIEN';

      const roleLevel = user?.currentRole?.roleLevel || 1;
      const userOrg = user?.currentRole?.orgCode;
      const userClass = user?.currentRole?.classCode;

      const defaultFaculty = userOrg || 'CNTT';
      const defaultClass = userClass || 'DH24IT01';

      const facultyCode = (roleLevel === 3 || roleLevel === 2) ? (userOrg || rawFacultyCode || defaultFaculty) : (rawFacultyCode || defaultFaculty);
      const classCode = roleLevel === 2 ? (userClass || rawClassCode || defaultClass) : (rawClassCode || defaultClass);

      let isValid = true;
      let errorMessage = '';

      if (!studentId || studentId.length < 4) {
        isValid = false;
        errorMessage = 'MSSV không hợp lệ (ít nhất 4 ký tự)';
      } else if (!fullName) {
        isValid = false;
        errorMessage = 'Thiếu họ và tên sinh viên';
      }

      const isDuplicateInDb = existingMap.has(studentId.toLowerCase());
      const isDuplicateInFile = seenInFile.has(studentId.toLowerCase());

      let action: 'NEW' | 'UPDATE' | 'SKIP' | 'ERROR' = 'NEW';

      if (!isValid) {
        action = 'ERROR';
      } else if (isDuplicateInFile) {
        action = 'SKIP';
        isValid = false;
        errorMessage = 'Trùng lặp MSSV nhiều lần trong tệp';
      } else if (isDuplicateInDb) {
        if (mode === 'update_existing') {
          action = 'UPDATE';
          isValid = true;
        } else if (mode === 'add_only' || mode === 'skip_duplicates') {
          action = 'SKIP';
          isValid = false;
          errorMessage = 'MSSV đã tồn tại trong hệ thống (chế độ bỏ qua trùng)';
        }
      } else {
        action = 'NEW';
      }

      if (studentId) seenInFile.add(studentId.toLowerCase());

      rows.push({
        rowNumber: i + 1,
        studentId,
        fullName,
        classCode,
        facultyCode,
        clubCodes,
        membershipType,
        action,
        isValid,
        isDuplicateInDb,
        isDuplicateInFile,
        errorMessage
      });
    }

    return rows;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      showToast('Hệ thống chỉ chấp nhận tệp định dạng Excel (.xlsx). Vui lòng chọn tệp .xlsx!', 'error');
      e.target.value = '';
      return;
    }

    setIsProcessing(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });

        if (!data || data.length < 2) {
          showToast('Tệp rỗng hoặc không có dòng dữ liệu hợp lệ!', 'error');
          setIsProcessing(false);
          return;
        }

        const parsed = parseRowsFromRawData(data, importMode);
        setParsedRows(parsed);
        showToast(`Đã đọc ${parsed.length} dòng dữ liệu từ tệp Excel!`, 'info');
      } catch (err: any) {
        showToast(`Lỗi xử lý file Excel: ${err.message || 'Không thể đọc tệp'}`, 'error');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      showToast('Lỗi khi tải file lên trình duyệt!', 'error');
      setIsProcessing(false);
    };

    reader.readAsBinaryString(file);
  };

  const handleModeChange = (mode: ImportMode) => {
    setImportMode(mode);
    if (parsedRows.length > 0) {
      const existingMap = new Map<string, StudentScoreRecord>();
      students.forEach(s => {
        if (s.studentId) existingMap.set(s.studentId.trim().toLowerCase(), s);
      });

      const updated = parsedRows.map(r => {
        if (!r.isValid && r.action === 'ERROR') return r;
        if (r.isDuplicateInFile) return r;

        let action: 'NEW' | 'UPDATE' | 'SKIP' | 'ERROR' = 'NEW';
        let isValid = true;
        let errorMessage = '';

        if (r.isDuplicateInDb) {
          if (mode === 'update_existing') {
            action = 'UPDATE';
            isValid = true;
          } else {
            action = 'SKIP';
            isValid = false;
            errorMessage = 'MSSV đã tồn tại trong hệ thống (chế độ bỏ qua trùng)';
          }
        } else {
          action = 'NEW';
          isValid = true;
        }

        return { ...r, action, isValid, errorMessage };
      });

      setParsedRows(updated);
    }
  };

  const handleConfirmImport = () => {
    const validRows = parsedRows.filter(r => r.isValid && (r.action === 'NEW' || r.action === 'UPDATE'));
    if (validRows.length === 0) {
      showToast('Không có dữ liệu hợp lệ để nhập!', 'error');
      return;
    }

    bulkImportStudents(
      validRows.map(r => ({
        studentId: r.studentId,
        fullName: r.fullName,
        classCode: r.classCode,
        facultyCode: r.facultyCode,
        clubCodes: r.clubCodes,
        membershipType: r.membershipType,
      })),
      importMode === 'update_existing'
    );

    // Chạy lại kiểm tra toàn vẹn sau khi nhập
    setTimeout(() => {
      runAutoIntegrityCheck();
    }, 500);

    onClose();
  };

  const newCount = parsedRows.filter(r => r.action === 'NEW').length;
  const updateCount = parsedRows.filter(r => r.action === 'UPDATE').length;
  const skipCount = parsedRows.filter(r => r.action === 'SKIP').length;
  const errorCount = parsedRows.filter(r => r.action === 'ERROR').length;
  const totalActionable = newCount + updateCount;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200 flex flex-col max-h-[92vh] sm:max-h-[90vh] my-0 sm:my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 px-4 sm:px-6 py-3.5 sm:py-4 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-bold flex items-center gap-2 truncate">
              <ShieldCheck className="w-5 h-5 text-emerald-300 shrink-0" />
              Danh Mục Sinh Viên & Bảo Toàn Dữ Liệu
            </h3>
            <p className="text-[11px] sm:text-xs text-emerald-100/90 mt-0.5 line-clamp-1">
              Tự động kiểm tra tính toàn vẹn, khôi phục từ bản sao lưu & nhập Excel an toàn
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

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('integrity');
              runAutoIntegrityCheck();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'integrity'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-extrabold bg-white dark:bg-slate-800 rounded-t-xl'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Tự Động Kiểm Tra Tính Toàn Vẹn & Khôi Phục</span>
            {integrityReport && integrityReport.status === 'CRITICAL' && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'import'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-extrabold bg-white dark:bg-slate-800 rounded-t-xl'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-600" />
            <span>Nhập Danh Sách Bằng File Excel (.xlsx)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs overflow-y-auto flex-1">
          {activeTab === 'integrity' && (
            <div className="space-y-4">
              {/* Tình trạng sức khỏe toàn vẹn (Integrity Health Status Banner) */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  integrityReport?.status === 'HEALTHY'
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : integrityReport?.status === 'WARNING'
                    ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                    : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                        integrityReport?.status === 'HEALTHY'
                          ? 'bg-emerald-600 text-white'
                          : integrityReport?.status === 'WARNING'
                          ? 'bg-amber-600 text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {integrityReport?.status === 'HEALTHY' ? (
                        <CheckCheck className="w-5 h-5" />
                      ) : integrityReport?.status === 'WARNING' ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <ShieldAlert className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm sm:text-base">
                          {integrityReport?.status === 'HEALTHY'
                            ? 'Collection Sinh Viên Đạt Tính Toàn Vẹn 100%'
                            : integrityReport?.status === 'WARNING'
                            ? 'Phát Hiện Cảnh Báo Tính Toàn Vẹn Của Dữ Liệu'
                            : 'Báo Động Nguy Cơ Mất Mát Thông Tin Hoặc Sai Lệch Dữ Liệu'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/70 dark:bg-slate-800/80 shadow-2xs border border-current">
                          {integrityReport?.status === 'HEALTHY'
                            ? 'Hệ Thống An Toàn'
                            : integrityReport?.status === 'WARNING'
                            ? 'Cần Lưu Ý'
                            : 'Nguy Cơ Thất Lạc'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs opacity-90 leading-relaxed">
                        {integrityReport?.dataLossMessage ||
                          (integrityReport?.status === 'HEALTHY'
                            ? `Toàn bộ ${integrityReport.totalChecked} hồ sơ sinh viên đều hoàn chỉnh, MSSV duy nhất, không phát hiện mất mát thông tin và đã đồng bộ an toàn.`
                            : integrityReport?.status === 'WARNING'
                            ? `Phát hiện ${integrityReport?.issuesCount} vấn đề cần rà soát (mã khoa hoặc chi đoàn chưa đồng bộ).`
                            : 'Phát hiện sự cố sụt giảm số lượng hoặc thiếu thông tin cốt lõi. Hãy nhấn nút Khôi phục từ bản sao lưu gần nhất bên dưới.')}
                      </p>
                    </div>
                  </div>

                  {/* Nút Kiểm Tra Lại */}
                  <button
                    type="button"
                    onClick={runAutoIntegrityCheck}
                    disabled={isCheckingIntegrity}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-2xs transition shrink-0 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-slate-600 dark:text-slate-300 ${isCheckingIntegrity ? 'animate-spin' : ''}`} />
                    <span>{isCheckingIntegrity ? 'Đang kiểm tra...' : 'Kiểm Tra Lại'}</span>
                  </button>
                </div>
              </div>

              {/* Thống kê chi tiết các chỉ số toàn vẹn */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Tổng sinh viên hiện tại</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                      {integrityReport?.activeCount ?? students.length}
                    </span>
                    <span className="text-[11px] text-slate-500">hồ sơ</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    ({integrityReport?.softDeletedCount || 0} hồ sơ trong thùng rác)
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Hồ sơ toàn vẹn 100%</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                      {integrityReport?.validCount ?? students.length}
                    </span>
                    <span className="text-[11px] text-emerald-600/80">hợp lệ</span>
                  </div>
                  <p className="text-[10px] text-emerald-600/70 mt-0.5">Đầy đủ mã lớp, khoa, điểm số</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Cảnh báo / Bất thường</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-xl font-black ${
                      (integrityReport?.issuesCount || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {integrityReport?.issuesCount ?? 0}
                    </span>
                    <span className="text-[11px] text-slate-500">vấn đề</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {integrityReport?.duplicateCount ? `${integrityReport.duplicateCount} trùng MSSV` : '0 trùng lặp'}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Bản sao lưu gần nhất</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                      {latestStudentBackupInfo?.count ?? 0}
                    </span>
                    <span className="text-[11px] text-blue-600/80">hồ sơ</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5" title={latestStudentBackupInfo?.timestamp}>
                    {latestStudentBackupInfo?.timestamp || 'Sẵn sàng'}
                  </p>
                </div>
              </div>

              {/* Khối Tự Động Bổ Sung Mã Lớp Vào Danh Mục Chính Thức */}
              {integrityReport && integrityReport.orphanClassCount > 0 && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                      <Building className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <span className="font-extrabold text-xs block text-amber-950 dark:text-amber-100">
                        Phát hiện {integrityReport.orphanClassCount} sinh viên có mã lớp chưa đăng ký trong danh mục chính thức
                      </span>
                      <span className="text-[11px] opacity-85 text-amber-800 dark:text-amber-300">
                        Nhấn nút bên dưới để tự động bổ sung các mã lớp này vào danh mục Chi đoàn/Lớp và chuẩn hóa dữ liệu 100%.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      autoFixUncatalogedClasses();
                      runAutoIntegrityCheck();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl text-xs shadow-sm hover:shadow-amber-600/30 transition cursor-pointer shrink-0 active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
                    <span>Bổ Sung {integrityReport.orphanClassCount} Lớp Vào Danh Mục</span>
                  </button>
                </div>
              )}

              {/* Khối Thao Tác Giải Quyết Mất Mát Thông Tin */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-md border border-emerald-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    Cơ Chế Khôi Phục Bảo Toàn Dữ Liệu
                  </div>
                  <h4 className="text-sm font-extrabold">
                    Khôi phục dữ liệu để giải quyết triệt để tình trạng mất mát thông tin
                  </h4>
                  <p className="text-xs text-emerald-100/80 leading-relaxed max-w-xl">
                    Nếu danh mục sinh viên bị mất mát, xóa nhầm hoặc sai lệch dữ liệu, bạn có thể khôi phục tức thời từ bản sao lưu gần nhất ({latestStudentBackupInfo?.count || 0} sinh viên, lưu lúc {latestStudentBackupInfo?.timestamp || 'hệ thống'}). Dữ liệu sẽ được tự động đồng bộ lại toàn bộ với Cloud Firestore.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowRestoreModal(true)}
                    disabled={isRestoring}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className={`w-4 h-4 text-slate-950 ${isRestoring ? 'animate-spin' : ''}`} />
                    <span>Khôi Phục Từ Bản Sao Lưu Gần Nhất</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => createStudentBackupSnapshot('Sao lưu chủ động qua Modal')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                    title="Lưu lại bản sao lưu tức thì của trạng thái sinh viên hiện tại"
                  >
                    <Database className="w-4 h-4 text-emerald-300" />
                    <span>Lưu Snapshot Ngay</span>
                  </button>
                </div>
              </div>

              {/* Danh sách các vấn đề phát hiện được (nếu có) */}
              {integrityReport && integrityReport.issues.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Chi Tiết Các Cảnh Báo Tính Toàn Vẹn Cần Xử Lý ({integrityReport.issues.length})
                    </span>
                    <span className="text-[10px] text-slate-400">Tự động phát hiện bởi hệ thống kiểm tra</span>
                  </div>

                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {integrityReport.issues.map(iss => (
                      <div key={iss.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-start gap-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 mt-0.5 ${
                            iss.severity === 'error'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : iss.severity === 'warning'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {iss.type}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{iss.studentId}</span>
                            {iss.fullName && <span className="text-slate-600 dark:text-slate-300 font-medium">({iss.fullName})</span>}
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 mt-0.5">{iss.description}</p>
                          <p className="text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold mt-1">
                            💡 Khắc phục: {iss.suggestedFix}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Khuyến nghị hệ thống */}
              {integrityReport && integrityReport.recommendations.length > 0 && (
                <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-2xl text-[11px] text-blue-900 dark:text-blue-300">
                  <span className="font-bold flex items-center gap-1.5 mb-1 text-xs">
                    <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Khuyến nghị bảo toàn dữ liệu sinh viên:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 opacity-90 pl-1">
                    {integrityReport.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-5">
              {/* Step 1: Download template & Import mode selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Step 1a: Download template */}
                <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex flex-col justify-between">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">Bước 1: Tải tệp Excel mẫu chuẩn hóa</p>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Cột: MSSV, Họ và tên, Mã Chi đoàn, Mã Khoa, CLB trực thuộc, Đối tượng (DOAN_VIEN / HOI_VIEN / SINH_VIEN).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="inline-flex items-center gap-1.5 px-4 py-2 mt-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold w-fit shadow-xs transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Tải File Mẫu Chuẩn (.xlsx)
                  </button>
                </div>

                {/* Step 1b: Chế độ xử lý dữ liệu trùng */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
                  <label className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Chế độ xử lý khi MSSV đã tồn tại:
                  </label>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        value="update_existing"
                        checked={importMode === 'update_existing'}
                        onChange={() => handleModeChange('update_existing')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                        Cập nhật thông tin (Khoa, Lớp, CLB) & bảo toàn điểm rèn luyện
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        value="add_only"
                        checked={importMode === 'add_only'}
                        onChange={() => handleModeChange('add_only')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300">
                        Chỉ thêm sinh viên mới, bỏ qua sinh viên đã có trong hệ thống
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Step 2: Upload Excel File */}
              <div>
                <label className="font-bold text-slate-900 dark:text-slate-100 text-sm block mb-1.5">
                  Bước 2: Tải lên danh sách sinh viên (.xlsx)
                </label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-6 text-center transition bg-slate-50/50 dark:bg-slate-800/40 relative">
                  <input
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mb-2">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {fileName ? fileName : 'Kéo thả file .xlsx vào đây hoặc bấm để chọn tệp'}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 text-[11px] mt-1">
                      Hệ thống tự động kiểm tra định dạng và phân loại từng dòng
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 3: Xem trước dữ liệu */}
              {parsedRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      Bước 3: Xem trước và đối soát dữ liệu ({parsedRows.length} dòng)
                    </span>

                    {/* Filter buttons */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setFilterView('ALL')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          filterView === 'ALL'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Tất cả ({parsedRows.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterView('NEW')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          filterView === 'NEW'
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        Thêm mới ({newCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterView('UPDATE')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          filterView === 'UPDATE'
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        Cập nhật ({updateCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterView('SKIP')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          filterView === 'SKIP'
                            ? 'bg-slate-500 text-white shadow-2xs'
                            : 'text-slate-500'
                        }`}
                      >
                        Bỏ qua ({skipCount})
                      </button>
                      {errorCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setFilterView('ERROR')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            filterView === 'ERROR'
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'text-rose-600'
                          }`}
                        >
                          Lỗi ({errorCount})
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold sticky top-0 z-10">
                        <tr>
                          <th className="py-2.5 px-3">Dòng</th>
                          <th className="py-2.5 px-3">MSSV</th>
                          <th className="py-2.5 px-3">Họ và tên</th>
                          <th className="py-2.5 px-3">Chi đoàn</th>
                          <th className="py-2.5 px-3">Khoa</th>
                          <th className="py-2.5 px-3">CLB / Đội</th>
                          <th className="py-2.5 px-3">Đối tượng</th>
                          <th className="py-2.5 px-3">Tác vụ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredPreviewRows.map((r) => (
                          <tr
                            key={r.rowNumber}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                              r.action === 'ERROR'
                                ? 'bg-rose-50/40 dark:bg-rose-950/20'
                                : r.action === 'SKIP'
                                ? 'opacity-60'
                                : ''
                            }`}
                          >
                            <td className="py-2 px-3 font-mono text-slate-400">{r.rowNumber}</td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">{r.studentId}</td>
                            <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">{r.fullName}</td>
                            <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">{r.classCode}</td>
                            <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">{r.facultyCode}</td>
                            <td className="py-2 px-3 text-slate-500">
                              {r.clubCodes && r.clubCodes.length > 0 ? r.clubCodes.join(', ') : '-'}
                            </td>
                            <td className="py-2 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {r.membershipType}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              {r.action === 'NEW' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                  <Check className="w-3 h-3" /> Thêm mới
                                </span>
                              )}
                              {r.action === 'UPDATE' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                  <RefreshCw className="w-3 h-3" /> Cập nhật
                                </span>
                              )}
                              {r.action === 'SKIP' && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                                  <Info className="w-3.5 h-3.5" /> Bỏ qua
                                </span>
                              )}
                              {r.action === 'ERROR' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                                  <AlertCircle className="w-3.5 h-3.5" /> {r.errorMessage}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-slate-500 dark:text-slate-400 text-xs">
            {activeTab === 'integrity' ? (
              <span>
                Cơ chế tự động kiểm tra tính toàn vẹn bảo vệ an toàn cho {allStudents.length} hồ sơ sinh viên NLU.
              </span>
            ) : parsedRows.length > 0 ? (
              `Sẽ xử lý: ${newCount} thêm mới, ${updateCount} cập nhật (${skipCount + errorCount} bỏ qua/lỗi)`
            ) : (
              'Chọn tệp Excel để tiến hành xem trước dữ liệu.'
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 rounded-xl font-semibold text-xs transition cursor-pointer min-h-[38px]"
            >
              Đóng
            </button>

            {activeTab === 'import' && (
              <button
                type="button"
                disabled={totalActionable === 0 || isProcessing}
                onClick={handleConfirmImport}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow-blue-700/30 transition cursor-pointer min-h-[38px] active:scale-95"
              >
                <Users className="w-4 h-4 text-blue-100" />
                <span>Xác Nhận Nhập ({totalActionable} sinh viên)</span>
              </button>
            )}

            {activeTab === 'integrity' && (
              <button
                type="button"
                onClick={() => setShowRestoreModal(true)}
                disabled={isRestoring}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow-emerald-700/30 transition cursor-pointer min-h-[38px] active:scale-95"
              >
                <RotateCcw className={`w-4 h-4 text-emerald-200 ${isRestoring ? 'animate-spin' : ''}`} />
                <span>Khôi Phục Bản Sao Lưu Gần Nhất</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal Xác Nhận Khôi Phục Từ Bản Sao Lưu Gần Nhất */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-4">
              <RotateCcw className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Xác Nhận Khôi Phục Collection Sinh Viên?
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              Bạn đang yêu cầu khôi phục toàn bộ dữ liệu sinh viên từ <strong className="text-emerald-700 dark:text-emerald-400">bản sao lưu gần nhất</strong>:
            </p>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl mt-3 text-[11px] space-y-1 text-emerald-900 dark:text-emerald-200">
              <div className="flex justify-between">
                <span className="font-semibold">Thời điểm sao lưu:</span>
                <span className="font-mono">{latestStudentBackupInfo?.timestamp || 'Ban đầu'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Số lượng hồ sơ:</span>
                <span className="font-bold">{latestStudentBackupInfo?.count || students.length} sinh viên</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Nguồn dữ liệu:</span>
                <span className="truncate">{latestStudentBackupInfo?.source || 'Hệ thống'}</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl mt-3 text-[11px] text-blue-900 dark:text-blue-300">
              Hệ thống sẽ tái thiết lập danh mục sinh viên trong bộ nhớ, cập nhật bộ nhớ đệm an toàn và đồng bộ hóa tức thời với Cloud Firestore.
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowRestoreModal(false)}
                disabled={isRestoring}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-xl font-semibold text-xs transition cursor-pointer min-h-[38px]"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow-emerald-700/30 transition cursor-pointer min-h-[38px] active:scale-95"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-200" />
                    <span>Đang khôi phục...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-200" />
                    <span>Đồng Ý Khôi Phục Ngay</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
