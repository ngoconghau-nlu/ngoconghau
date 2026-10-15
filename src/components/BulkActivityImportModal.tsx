import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  downloadActivity15BlankTemplate,
  parseActivity15Excel,
  ParsedActivity15Row
} from '../utils/activity15TemplateUtils';
import { logFirestoreWriteDiagnostic } from '../utils/firestoreDiagnosticLogger';
import { normalizeActivityTitle, normalizeMultipleTitles } from '../utils/aiTitleNormalizer';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Calendar,
  Sparkles,
  Check,
  Building,
  Info,
  ShieldCheck,
  Clock,
  Layers,
  HelpCircle,
  ExternalLink,
  Loader2
} from 'lucide-react';

interface BulkActivityImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BulkActivityImportModal: React.FC<BulkActivityImportModalProps> = ({ isOpen, onClose }) => {
  const { user, organizations, branchClasses, bulkImportActivities, showToast, academicYear } = useApp();

  const [parsedRows, setParsedRows] = useState<ParsedActivity15Row[]>([]);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [normalizingRowIndex, setNormalizingRowIndex] = useState<number | null>(null);
  const [autoApprove, setAutoApprove] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'valid' | 'invalid'>('all');
  const [showGuide, setShowGuide] = useState(false);

  const handleAINormalizeSingleRow = async (rowIndex: number) => {
    const row = parsedRows.find(r => r.index === rowIndex);
    if (!row || !row.title.trim()) return;

    setNormalizingRowIndex(rowIndex);
    const res = await normalizeActivityTitle(row.title, { orgName: row.orgName });
    setNormalizingRowIndex(null);

    if (res.normalizedTitle && res.normalizedTitle !== row.title) {
      setParsedRows(prev =>
        prev.map(r => (r.index === rowIndex ? { ...r, title: res.normalizedTitle } : r))
      );
      showToast(`Đã dùng AI chuẩn hóa tên hoạt động dòng #${rowIndex}!`, 'success');
    } else {
      showToast('Tên hoạt động đã đầy đủ ý nghĩa.', 'info');
    }
  };

  const handleAIBatchNormalizeImportedRows = async () => {
    if (parsedRows.length === 0) return;
    setIsAIProcessing(true);
    showToast(`Đang dùng AI Gemini chuẩn hóa ${parsedRows.length} tên hoạt động...`, 'info');

    const titles = parsedRows.map(r => r.title);
    const normalized = await normalizeMultipleTitles(titles);

    setParsedRows(prev =>
      prev.map((r, i) => ({
        ...r,
        title: normalized[i] || r.title
      }))
    );

    setIsAIProcessing(false);
    showToast(`Đã chuẩn hóa toàn bộ ${parsedRows.length} tên hoạt động bằng AI Gemini thành công!`, 'success');
  };

  if (!isOpen) return null;

  const currentLevel = user.currentRole.roleLevel;

  // Quyền hạn: Cán bộ từ Cấp 2 trở lên có quyền nạp hàng loạt
  if (currentLevel < 2) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center animate-in fade-in zoom-in-95 duration-150">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
            <X className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Giới Hạn Thẩm Quyền</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Chức năng nạp hàng loạt hoạt động theo biểu mẫu 15 mục chỉ dành cho tài khoản cán bộ Đoàn - Hội (Cấp 2 trở lên).
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition w-full"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  // Tải file mẫu 15 mục
  const handleDownloadTemplate = () => {
    try {
      downloadActivity15BlankTemplate();
      showToast('Đã tải xuống biểu mẫu Excel chuẩn 15 mục thành công!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi tải file mẫu Excel.', 'error');
    }
  };

  // Đọc file tải lên
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      showToast('Hệ thống chỉ chấp nhận tệp định dạng Excel (.xlsx). Vui lòng chọn tệp .xlsx!', 'error');
      e.target.value = '';
      return;
    }

    setFileName(file.name);
    setIsProcessing(true);

    try {
      const rows = await parseActivity15Excel(file, organizations, branchClasses);
      setParsedRows(rows);
      if (rows.length === 0) {
        showToast('Tệp không chứa dữ liệu hoạt động hoặc sai định dạng cột.', 'error');
      } else {
        const validCount = rows.filter(r => r.isValid).length;
        showToast(`Đã đọc ${rows.length} dòng dữ liệu (${validCount} dòng hợp lệ)!`, 'info');
      }
    } catch (error: any) {
      console.error('Lỗi phân tích file Excel hoạt động 15 mục:', error);
      showToast(error.message || 'Không thể đọc file. Vui lòng đảm bảo tệp đúng định dạng Excel (.xlsx).', 'error');
      setParsedRows([]);
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const validRows = parsedRows.filter(r => r.isValid);
  const invalidRows = parsedRows.filter(r => !r.isValid);

  const displayedRows =
    activeTab === 'valid' ? validRows : activeTab === 'invalid' ? invalidRows : parsedRows;

  // Xác nhận nạp hàng loạt vào hệ thống
  const handleConfirmImport = () => {
    if (validRows.length === 0) {
      showToast('Không có dòng hoạt động nào hợp lệ để nạp!', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      const toImport = validRows.map(row => ({
        title: row.title,
        orgCode: row.orgCode,
        orgName: row.orgName,
        branchClass: row.branchClass || undefined,
        scaleId: row.scaleId,
        scaleName: row.scaleName,
        scalePoints: row.scalePoints,
        officialParticipantCount: 0,
        participantScorePoints: 0,
        hostLevel: row.hostLevel,
        hostLevelId: row.hostLevelId,
        hostLevelName: row.hostLevelName,
        hostLevelPoints: row.hostLevelPoints,
        totalLevelScore: row.totalLevelScore,
        programLevel: row.programLevel,
        startDate: row.startDate,
        endDate: row.endDate || row.startDate,
        managerName: row.managerName,
        managerStudentId: row.managerStudentId,
        signedDocUrl: row.signedDocUrl || '',
        proofArticleUrl: row.proofArticleUrl || '',
        needsCertificate: row.needsCertificate,
        planYear: academicYear,
        planYearOption: row.planYearOption,
        drlCriteriaId: row.drlCriteriaId,
        drlCriteriaText: row.drlCriteriaText,
        sv5tCriteriaId: row.sv5tCriteriaId,
        sv5tCriteriaText: row.sv5tCriteriaText,
        hoiProgramId: row.hoiProgramId,
        hoiProgramText: row.hoiProgramText,
        doanProgramId: row.doanProgramId,
        doanProgramText: row.doanProgramText,
        dataCommitment: row.dataCommitment,
        semester: row.semester,
        activityType: row.activityType
      }));

      const res = bulkImportActivities(toImport, autoApprove);

      if (res.successCount > 0) {
        onClose();
      }
    } catch (err) {
      console.error('Error in handleConfirmImport:', err);
      logFirestoreWriteDiagnostic('BULK_IMPORT_ACTIVITIES', validRows, err, showToast, {
        email: user?.email,
        id: user?.id,
        roleLevel: user?.currentRole?.roleLevel,
        orgCode: user?.currentRole?.orgCode
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base sm:text-lg">
                  Tải Hàng Loạt Hoạt Động Theo Mẫu Đăng Ký 15 Mục
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                  Cấp 4 Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Nhập hàng loạt kế hoạch hoạt động phong trào qua tệp Excel/CSV với đầy đủ 15 tiêu chuẩn quy chế NLU
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition"
            >
              <HelpCircle className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              {showGuide ? 'Ẩn 15 mục' : 'Xem 15 mục chuẩn'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* Guide Banner collapsible */}
          {showGuide && (
            <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 animate-in fade-in duration-200">
              <h4 className="text-xs font-bold text-sky-900 dark:text-sky-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Info className="w-4 h-4 text-sky-600" />
                Cấu Trúc 15 Mục Đăng Ký Chuẩn (Quy Chế NLU Youth 2026)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px] text-slate-700 dark:text-slate-300">
                <div className="space-y-1 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-sky-100 dark:border-sky-900">
                  <div className="font-bold text-sky-800 dark:text-sky-300">Nhóm I: Định danh & Đơn vị</div>
                  <p><strong>Mục 1:</strong> Tên chương trình / hoạt động</p>
                  <p><strong>Mục 2:</strong> Mã đơn vị tổ chức (DT, K_CNTT, CLB...)</p>
                  <p><strong>Mục 3:</strong> Mã Chi đoàn tổ chức (nếu có)</p>
                  <p><strong>Mục 4:</strong> Quy mô đối tượng tham gia (1-6)</p>
                  <p><strong>Mục 5:</strong> Thời gian tổ chức (Bắt đầu - Kết thúc)</p>
                </div>
                <div className="space-y-1 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-sky-100 dark:border-sky-900">
                  <div className="font-bold text-sky-800 dark:text-sky-300">Nhóm II: Nhân sự & Minh chứng</div>
                  <p><strong>Mục 6:</strong> Họ tên & MSSV người phụ trách</p>
                  <p><strong>Mục 7:</strong> Link VB trình ký kế hoạch (Drive)</p>
                  <p><strong>Mục 8:</strong> Link bài viết truyền thông / minh chứng</p>
                  <p><strong>Mục 9:</strong> Nhu cầu cấp Giấy chứng nhận (CO/KHONG)</p>
                  <p><strong>Mục 10:</strong> Thuộc kế hoạch năm (Trong/Ngoài)</p>
                </div>
                <div className="space-y-1 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-sky-100 dark:border-sky-900">
                  <div className="font-bold text-sky-800 dark:text-sky-300">Nhóm III: Khung Tiêu chí & Cam kết</div>
                  <p><strong>Mục 11:</strong> Tiêu chí ĐRL (A1 - E3)</p>
                  <p><strong>Mục 12:</strong> Tiêu chí SV5T (A1 - E14)</p>
                  <p><strong>Mục 13:</strong> Mảng chương trình Hội SV (1 - 9)</p>
                  <p><strong>Mục 14:</strong> Mảng chương trình Đoàn TN (KR1.1 - KR5.3)</p>
                  <p><strong>Mục 15:</strong> Cam kết dữ liệu chính xác (CO/KHONG)</p>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-sky-200 dark:border-sky-800 text-[11px] text-sky-900 dark:text-sky-200 font-medium flex items-center gap-1.5">
                <span className="font-bold text-amber-600 dark:text-amber-400">⭐ Ràng buộc quy chế Đoàn - Hội trường:</span>
                <span>Chương trình/hoạt động do Đoàn trường hoặc Hội Sinh viên trường tổ chức bắt buộc phải đạt xếp loại từ <strong>Cấp 3 trở lên</strong> (Cấp 3 hoặc Cấp 4).</span>
              </div>
            </div>
          )}

          {/* Action Row: Template Download & Upload Dropzone */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1: Download Template */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Bước 1
                </span>
                <h4 className="font-bold text-emerald-950 dark:text-emerald-200 text-sm mt-0.5">
                  Tải Biểu Mẫu Chuẩn 15 Mục
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Tải tệp Excel mẫu chứa 15 cột quy chuẩn kèm 4 dòng ví dụ thực tế và trang tra cứu mã tiêu chí.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="mt-3.5 inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Tải File Mẫu (.xlsx)
              </button>
            </div>

            {/* Step 2: Upload File Dropzone */}
            <div className="md:col-span-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col justify-center items-center text-center relative group hover:border-emerald-500 transition">
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-700 shadow-xs flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2 group-hover:scale-105 transition">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {fileName ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Đã chọn: {fileName}
                  </span>
                ) : (
                  'Bước 2: Bấm để chọn tệp hoặc kéo thả file Excel (.xlsx)'
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Hỗ trợ duy nhất định dạng tệp Excel (.xlsx) - Tự động nhận diện 15 mục chuẩn
              </p>
            </div>
          </div>

          {/* Results & Interactive Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 animate-in fade-in duration-200">
              {/* Stats Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 sm:gap-3 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Tổng: <strong>{parsedRows.length}</strong> dòng
                  </span>
                  <span className="h-4 w-px bg-slate-300 dark:bg-slate-600" />
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Hợp lệ: <strong>{validRows.length}</strong>
                  </span>
                  {invalidRows.length > 0 && (
                    <>
                      <span className="h-4 w-px bg-slate-300 dark:bg-slate-600" />
                      <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        Có lỗi: <strong>{invalidRows.length}</strong>
                      </span>
                    </>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition ${
                      activeTab === 'all'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Tất cả ({parsedRows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('valid')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition ${
                      activeTab === 'valid'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                    }`}
                  >
                    Hợp lệ ({validRows.length})
                  </button>
                  {invalidRows.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('invalid')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${
                        activeTab === 'invalid'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
                      }`}
                    >
                      Lỗi ({invalidRows.length})
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleAIBatchNormalizeImportedRows}
                    disabled={isAIProcessing || parsedRows.length === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer disabled:opacity-50 ml-auto"
                    title="Tự động mở rộng từ viết tắt và chuẩn hóa tất cả tên hoạt động bằng AI Gemini"
                  >
                    {isAIProcessing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    )}
                    <span>{isAIProcessing ? 'Đang chuẩn hóa...' : 'AI Chuẩn Hóa Tất Cả Tên'}</span>
                  </button>
                </div>
              </div>

              {/* Status Option for Level 4 */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Chế độ phê duyệt khi nạp hàng loạt (Cấp 4):</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                    <input
                      type="radio"
                      name="autoApprove"
                      checked={autoApprove}
                      onChange={() => setAutoApprove(true)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Tự động Phê Duyệt ngay (Approved)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 font-medium ml-3">
                    <input
                      type="radio"
                      name="autoApprove"
                      checked={!autoApprove}
                      onChange={() => setAutoApprove(false)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Chờ xét duyệt (Pending_L4)</span>
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="max-h-80 overflow-x-auto overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3">STT</th>
                        <th className="py-2.5 px-3">Trạng thái</th>
                        <th className="py-2.5 px-3 min-w-[200px]">1. Tên chương trình</th>
                        <th className="py-2.5 px-3 min-w-[120px]">2. Đơn vị</th>
                        <th className="py-2.5 px-3 min-w-[110px]">3. Chi đoàn</th>
                        <th className="py-2.5 px-3 min-w-[150px]">4. Quy mô</th>
                        <th className="py-2.5 px-3 min-w-[110px]">5. Thời gian</th>
                        <th className="py-2.5 px-3 min-w-[130px]">6. Phụ trách</th>
                        <th className="py-2.5 px-3 min-w-[100px]">9. Cấp GCN</th>
                        <th className="py-2.5 px-3 min-w-[100px]">11. ĐRL</th>
                        <th className="py-2.5 px-3 min-w-[100px]">12. SV5T</th>
                        <th className="py-2.5 px-3 min-w-[100px]">13. Hội</th>
                        <th className="py-2.5 px-3 min-w-[100px]">14. Đoàn</th>
                        <th className="py-2.5 px-3 min-w-[90px]">Cấp ĐK</th>
                        <th className="py-2.5 px-3 min-w-[90px]">Phân cấp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {displayedRows.map(row => (
                        <tr
                          key={row.index}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${
                            !row.isValid ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-500">{row.index}</td>
                          <td className="py-2.5 px-3">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                                <Check className="w-3 h-3" /> Hợp lệ
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 cursor-help"
                                title={row.errors.join('; ')}
                              >
                                <X className="w-3 h-3" /> Lỗi ({row.errors.length})
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                            <div className="flex items-start justify-between gap-1">
                              <span className="flex-1">{row.title}</span>
                              <button
                                type="button"
                                onClick={() => handleAINormalizeSingleRow(row.index)}
                                disabled={normalizingRowIndex === row.index}
                                className="p-1 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/60 rounded-md transition cursor-pointer shrink-0"
                                title="Dùng AI Gemini chuẩn hóa tên hoạt động dòng này"
                              >
                                {normalizingRowIndex === row.index ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                )}
                              </button>
                            </div>
                            {row.errors.length > 0 && (
                              <p className="text-[10px] text-rose-600 dark:text-rose-400 font-normal mt-0.5">
                                {row.errors.join(', ')}
                              </p>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                              {row.orgCode}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">
                              {row.orgName}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {row.branchClass || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-[11px]">
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">
                              {row.scalePoints} điểm
                            </span>
                            <span className="text-slate-400 block truncate max-w-[140px] text-[10px]">
                              {row.scaleName}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {row.startDate}
                          </td>
                          <td className="py-2.5 px-3 text-[11px]">
                            <div className="font-medium text-slate-800 dark:text-slate-200">{row.managerName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{row.managerStudentId}</div>
                          </td>
                          <td className="py-2.5 px-3 text-[11px]">
                            {row.needsCertificate ? (
                              <span className="text-emerald-700 dark:text-emerald-400 font-bold">Có cấp GCN</span>
                            ) : (
                              <span className="text-slate-400">Không</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-sky-700 dark:text-sky-400 text-[11px]">
                            {row.drlCriteriaId}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-indigo-700 dark:text-indigo-400 text-[11px]">
                            {row.sv5tCriteriaId}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                            {row.hoiProgramId}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                            {row.doanProgramId}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-[11px]">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">
                              Cấp {row.hostLevel}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-[11px] text-emerald-700 dark:text-emerald-400">
                            Cấp {row.programLevel} ({row.totalLevelScore}đ)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {validRows.length > 0 ? (
              <span>
                Sẵn sàng nạp <strong>{validRows.length}</strong> hoạt động vào năm học <strong>{academicYear}</strong>
              </span>
            ) : (
              <span>Vui lòng tải lên tệp Excel đúng mẫu 15 mục để tiếp tục</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={isProcessing || validRows.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-white text-xs font-extrabold rounded-xl shadow-xs transition cursor-pointer"
            >
              {isProcessing ? (
                <span>Đang xử lý...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Xác Nhận Nạp {validRows.length} Hoạt Động (Mẫu 15 Mục)
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
