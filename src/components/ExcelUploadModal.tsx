import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { ActivitySubmission, ParticipantRoleType } from '../types';
import { ROLE_POINTS_MATRIX, getPointsForRole, calculateProgramLevelScore, DEFAULT_PROGRAM_PERSONNEL_QUOTAS } from '../data/mockData';
import { isSchoolYouthUnionOrAssociation } from '../utils/dataIntegrity';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle,
  AlertCircle,
  Download,
  X,
  Users,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  Lock,
  UserCheck,
  Info
} from 'lucide-react';

interface ExcelUploadModalProps {
  activity: ActivitySubmission;
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedRow {
  studentId: string;
  fullName: string;
  classCode: string;
  role: ParticipantRoleType;
  pointsCalculated: number;
}

export const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({ activity, isOpen, onClose }) => {
  const { uploadActivityParticipants, students, programPersonnelQuotas, showToast } = useApp();

  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const isSchoolOrg = isSchoolYouthUnionOrAssociation(activity.orgCode, activity.orgName);

  // Predict new program level if this list is uploaded (áp dụng ràng buộc tối thiểu Cấp 3 nếu là Đoàn/Hội trường)
  const previewCalculation = calculateProgramLevelScore(
    activity.scalePoints,
    parsedRows.length,
    activity.hostLevelPoints,
    { orgCode: activity.orgCode, orgName: activity.orgName }
  );

  // Ràng buộc số lượng Ban tổ chức & Cộng tác viên theo Cấp chương trình
  const effectiveLevel = activity.programLevel || previewCalculation.programLevel || 1;
  const currentQuota = (programPersonnelQuotas || DEFAULT_PROGRAM_PERSONNEL_QUOTAS).find(
    q => q.level === effectiveLevel
  ) || {
    level: effectiveLevel,
    levelName: `Chương trình Cấp ${effectiveLevel}`,
    maxBtc: effectiveLevel === 1 ? 5 : effectiveLevel === 2 ? 10 : effectiveLevel === 3 ? 15 : 20,
    maxCtv: effectiveLevel === 1 ? 10 : effectiveLevel === 2 ? 20 : effectiveLevel === 3 ? 30 : 40,
  };

  const btcRows = parsedRows.filter(r => r.role === 'Ban Tổ chức');
  const ctvRows = parsedRows.filter(r => r.role === 'Cộng tác viên');
  const btcCount = btcRows.length;
  const ctvCount = ctvRows.length;

  const isBtcExceeded = parsedRows.length > 0 && btcCount > currentQuota.maxBtc;
  const isCtvExceeded = parsedRows.length > 0 && ctvCount > currentQuota.maxCtv;
  const hasQuotaViolation = isBtcExceeded || isCtvExceeded;

  // Download template Excel file
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Mã Số Sinh Viên (MSSV)': '22130001',
        'Họ và Tên': 'Nguyễn Công Hậu',
        'Lớp / Chi đoàn': 'DH22IT01',
        'Nhiệm vụ / Vai trò tham gia': 'Ban Tổ chức',
      },
      {
        'Mã Số Sinh Viên (MSSV)': '22130045',
        'Họ và Tên': 'Trần Thị Thu Thảo',
        'Lớp / Chi đoàn': 'DH22IT01',
        'Nhiệm vụ / Vai trò tham gia': 'Giải Nhất',
      },
      {
        'Mã Số Sinh Viên (MSSV)': '22130102',
        'Họ và Tên': 'Lê Hoàng Nam',
        'Lớp / Chi đoàn': 'DH22IT02',
        'Nhiệm vụ / Vai trò tham gia': 'Giải Nhì',
      },
      {
        'Mã Số Sinh Viên (MSSV)': '24130005',
        'Họ và Tên': 'Phạm Ngọc Trân',
        'Lớp / Chi đoàn': 'DH24IT01',
        'Nhiệm vụ / Vai trò tham gia': 'Tham gia dự thi vòng 1 trực tiếp (offline)',
      },
      {
        'Mã Số Sinh Viên (MSSV)': '23130018',
        'Họ và Tên': 'Võ Minh Quân',
        'Lớp / Chi đoàn': 'DH23IT01',
        'Nhiệm vụ / Vai trò tham gia': 'Tham dự',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DanhSachSinhVien');
    XLSX.writeFile(workbook, `Mau_DanhSach_ThamGia_${activity.id}.xlsx`);
    showToast('Đã tải xuống file Excel mẫu thành công!', 'info');
  };

  // Parse Excel file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setErrorMsg('Hệ thống chỉ chấp nhận tệp định dạng Excel (.xlsx). Vui lòng chuyển đổi tệp của bạn sang .xlsx!');
      showToast('Hệ thống chỉ chấp nhận tệp định dạng Excel (.xlsx)!', 'error');
      e.target.value = '';
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = evt => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!rawJson || rawJson.length === 0) {
          setErrorMsg('File Excel không có dữ liệu sinh viên.');
          return;
        }

        const validRoles: ParticipantRoleType[] = [
          'Giải Nhất',
          'Giải Nhì',
          'Giải Ba',
          'Ban Tổ chức',
          'Cộng tác viên',
          'Tham gia dự thi vòng 1 trực tiếp (offline)',
          'Tham dự',
          'Tham gia dự thi 1 vòng trực tuyến (online)',
        ];

        // Format and validate rows
        const rows: ParsedRow[] = rawJson.map((item, index) => {
          // Flexible key lookup
          const studentId =
            item['Mã Số Sinh Viên (MSSV)'] ||
            item['MSSV'] ||
            item['Mssv'] ||
            item['studentId'] ||
            `SV_${index + 1}`;

          const fullName =
            item['Họ và Tên'] ||
            item['Họ và tên'] ||
            item['Họ tên'] ||
            item['fullName'] ||
            'Sinh viên NLU';

          const classCode =
            item['Lớp / Chi đoàn'] ||
            item['Lớp'] ||
            item['Chi đoàn'] ||
            item['classCode'] ||
            'DH22IT01';

          let rawRole =
            item['Nhiệm vụ / Vai trò tham gia'] ||
            item['Vai trò'] ||
            item['role'] ||
            'Tham dự';

          // Match closest role
          let role: ParticipantRoleType = 'Tham dự';
          const matchedRole = validRoles.find(r =>
            rawRole.toString().toLowerCase().includes(r.toLowerCase())
          );
          if (matchedRole) {
            role = matchedRole;
          } else if (rawRole.toString().toLowerCase().includes('nhất')) {
            role = 'Giải Nhất';
          } else if (rawRole.toString().toLowerCase().includes('nhì')) {
            role = 'Giải Nhì';
          } else if (rawRole.toString().toLowerCase().includes('ba')) {
            role = 'Giải Ba';
          } else if (rawRole.toString().toLowerCase().includes('btc') || rawRole.toString().toLowerCase().includes('tổ chức')) {
            role = 'Ban Tổ chức';
          } else if (rawRole.toString().toLowerCase().includes('cộng tác')) {
            role = 'Cộng tác viên';
          } else if (rawRole.toString().toLowerCase().includes('offline')) {
            role = 'Tham gia dự thi vòng 1 trực tiếp (offline)';
          } else if (rawRole.toString().toLowerCase().includes('online')) {
            role = 'Tham gia dự thi 1 vòng trực tuyến (online)';
          }

          // Compute provisional points based on predicted program level
          const pointsCalculated = getPointsForRole(role, previewCalculation.programLevel);

          return {
            studentId: studentId.toString().trim(),
            fullName: fullName.toString().trim(),
            classCode: classCode.toString().trim(),
            role,
            pointsCalculated,
          };
        });

        // Tự động kiểm tra trùng lặp bản ghi trong cùng một hoạt động (Yêu cầu nghiệp vụ)
        const uniqueMap = new Map<string, ParsedRow>();
        let dupCount = 0;
        rows.forEach(r => {
          if (!uniqueMap.has(r.studentId)) {
            uniqueMap.set(r.studentId, r);
          } else {
            dupCount++;
          }
        });
        const uniqueRows = Array.from(uniqueMap.values());
        setParsedRows(uniqueRows);

        // Kiểm tra ràng buộc nhân sự Ban tổ chức & Cộng tác viên
        const btcCountInFile = uniqueRows.filter(r => r.role === 'Ban Tổ chức').length;
        const ctvCountInFile = uniqueRows.filter(r => r.role === 'Cộng tác viên').length;
        const btcOver = btcCountInFile > currentQuota.maxBtc;
        const ctvOver = ctvCountInFile > currentQuota.maxCtv;

        if (btcOver || ctvOver) {
          const reasons: string[] = [];
          if (btcOver) reasons.push(`Ban tổ chức: ${btcCountInFile}/${currentQuota.maxBtc} người (vượt ${btcCountInFile - currentQuota.maxBtc})`);
          if (ctvOver) reasons.push(`Cộng tác viên: ${ctvCountInFile}/${currentQuota.maxCtv} người (vượt ${ctvCountInFile - currentQuota.maxCtv})`);
          setErrorMsg(`Vi phạm ràng buộc nhân sự ${currentQuota.levelName}: ${reasons.join(', ')}. Hệ thống KHÔNG CHO PHÉP nhập dữ liệu, bạn cần điều chỉnh file Excel theo đúng quy định để được phép nhập!`);
          showToast(`Cảnh báo: Danh sách vượt quá định mức nhân sự cho ${currentQuota.levelName}!`, 'error');
        } else {
          setErrorMsg('');
          if (dupCount > 0) {
            showToast(`Đã đối soát và tự động lọc bỏ ${dupCount} bản ghi trùng lặp MSSV!`, 'info');
          } else {
            showToast(`Đã đọc ${uniqueRows.length} sinh viên từ file Excel (Nhân sự BTC/CTV hợp lệ)`, 'success');
          }
        }
      } catch (err: any) {
        console.error(err);
        setErrorMsg('Lỗi khi đọc file Excel. Vui lòng đảm bảo tệp đúng định dạng Excel (.xlsx).');
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;
    if (hasQuotaViolation) {
      setErrorMsg(`Không thể nhập dữ liệu: Danh sách vượt quá số lượng Ban tổ chức hoặc Cộng tác viên quy định cho ${currentQuota.levelName}. Vui lòng điều chỉnh lại file Excel!`);
      showToast(`Không thể nhập: Vui lòng điều chỉnh lại nhân sự BTC/CTV theo yêu cầu!`, 'error');
      return;
    }
    setIsProcessing(true);
    try {
      uploadActivityParticipants(activity.id, parsedRows);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi cập nhật danh sách.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Export current participant list to Excel .xlsx
  const handleExportCurrentParticipants = () => {
    if (!activity.participants || activity.participants.length === 0) {
      showToast('Chương trình hiện chưa có danh sách sinh viên tham gia!', 'warning');
      return;
    }

    const exportData = activity.participants.map((p, idx) => ({
      'STT': idx + 1,
      'Mã Số Sinh Viên (MSSV)': p.studentId,
      'Họ và Tên': p.fullName,
      'Lớp / Chi đoàn': p.classCode,
      'Nhiệm vụ / Vai trò tham gia': p.role || 'Tham gia',
      'Điểm ĐRL': p.pointsAwarded || 0,
      'Thời gian tích lũy': (p as any).registeredAt || new Date().toISOString().split('T')[0]
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 15 },
      { wch: 25 },
      { wch: 15 },
      { wch: 30 },
      { wch: 12 },
      { wch: 18 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSachThamGia');
    XLSX.writeFile(wb, `DanhSach_ThamGia_${activity.id}_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Đã xuất danh sách sinh viên tham gia ra file Excel (.xlsx) thành công!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl max-w-3xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-0 sm:my-6 animate-in fade-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 px-4 sm:px-6 py-3.5 sm:py-4 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-300 shrink-0" />
              <h3 className="text-sm sm:text-base font-bold truncate">
                Tải Lên / Xuất Danh Sách Sinh Viên Tham Gia Qua Excel
              </h3>
            </div>
            <p className="text-[11px] sm:text-xs text-emerald-100 mt-0.5 truncate">
              Chương trình: <span className="font-bold underline text-white">{activity.title}</span> ({activity.id})
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs custom-scrollbar">
          {/* Instructions and Download Template */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-emerald-900 dark:text-emerald-200 text-xs">
                Quy trình đối soát MSSV & Tính điểm rèn luyện tự động:
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5 leading-relaxed">
                Hệ thống sẽ đối chiếu MSSV với cơ sở dữ liệu sinh viên, tự động tính điểm ĐRL theo vai trò và cập nhật quy mô người tham gia chính thức cho hoạt động.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {activity.participants && activity.participants.length > 0 && (
                <button
                  onClick={handleExportCurrentParticipants}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-lg shadow-2xs whitespace-nowrap transition cursor-pointer"
                  title="Xuất danh sách sinh viên hiện tại đã đăng ký ra file Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-sky-200" />
                  Xuất Excel ({activity.participants.length} SV)
                </button>
              )}
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100 font-bold rounded-lg shadow-2xs whitespace-nowrap transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                Tải File Excel Mẫu (.xlsx)
              </button>
            </div>
          </div>

          {/* Quota Rules & Live Status Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-700 text-white font-extrabold text-[11px]">
                  Cấp {effectiveLevel}
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                  Ràng buộc nhân sự: {currentQuota.levelName}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Định mức tối đa: <strong>{currentQuota.maxBtc} BTC</strong> · <strong>{currentQuota.maxCtv} CTV</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div
                className={`p-2.5 rounded-lg border flex items-center justify-between ${
                  isBtcExceeded
                    ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200'
                    : parsedRows.length > 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>Ban Tổ chức (BTC)</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Quy định: Tối đa {currentQuota.maxBtc} người
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-sm">
                    {btcCount} / {currentQuota.maxBtc}
                  </div>
                  <span
                    className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-bold ${
                      isBtcExceeded
                        ? 'bg-rose-600 text-white'
                        : parsedRows.length > 0
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {isBtcExceeded
                      ? `Vượt ${btcCount - currentQuota.maxBtc}`
                      : parsedRows.length > 0
                      ? 'Hợp lệ'
                      : 'Chờ file'}
                  </span>
                </div>
              </div>

              <div
                className={`p-2.5 rounded-lg border flex items-center justify-between ${
                  isCtvExceeded
                    ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200'
                    : parsedRows.length > 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Cộng tác viên (CTV)</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Quy định: Tối đa {currentQuota.maxCtv} người
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-sm">
                    {ctvCount} / {currentQuota.maxCtv}
                  </div>
                  <span
                    className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-bold ${
                      isCtvExceeded
                        ? 'bg-rose-600 text-white'
                        : parsedRows.length > 0
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {isCtvExceeded
                      ? `Vượt ${ctvCount - currentQuota.maxCtv}`
                      : parsedRows.length > 0
                      ? 'Hợp lệ'
                      : 'Chờ file'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Drop Area */}
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              Chọn File Excel danh sách tham gia (.xlsx) <span className="text-rose-500">*</span>
            </label>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-xl p-6 text-center bg-slate-50 dark:bg-slate-800/40 transition cursor-pointer relative">
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="font-bold text-slate-800 dark:text-slate-100">
                {fileName ? fileName : 'Bấm để chọn file Excel (.xlsx) hoặc kéo thả file vào đây'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Hỗ trợ duy nhất định dạng Excel (.xlsx) - MSSV, Họ và tên, Lớp/Chi đoàn, Nhiệm vụ/Vai trò tham gia
              </p>
            </div>
          </div>

          {/* Blocking Quota Violation Alert Banner */}
          {hasQuotaViolation && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-500 dark:border-rose-600 rounded-xl text-rose-800 dark:text-rose-200 space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                <span className="font-extrabold text-sm uppercase tracking-wide text-rose-700 dark:text-rose-300">
                  Hiện Thông Báo: Không Cho Phép Nhập Dữ Liệu
                </span>
              </div>
              <p className="text-xs leading-relaxed text-rose-800 dark:text-rose-200">
                Chương trình này được tạo với phân loại <strong>{currentQuota.levelName}</strong>. Danh sách bạn tải lên vi phạm quy định ràng buộc nhân sự:
              </p>
              <ul className="list-disc pl-5 text-xs space-y-1 font-medium">
                {isBtcExceeded && (
                  <li>
                    <strong>Ban Tổ chức:</strong> Hiện có <span className="underline font-bold">{btcCount} người</span> (Giới hạn tối đa: <strong>{currentQuota.maxBtc} người</strong> → Vượt quá <strong>{btcCount - currentQuota.maxBtc} người</strong>).
                  </li>
                )}
                {isCtvExceeded && (
                  <li>
                    <strong>Cộng Tác Viên:</strong> Hiện có <span className="underline font-bold">{ctvCount} người</span> (Giới hạn tối đa: <strong>{currentQuota.maxCtv} người</strong> → Vượt quá <strong>{ctvCount - currentQuota.maxCtv} người</strong>).
                  </li>
                )}
              </ul>
              <div className="bg-white/90 dark:bg-slate-900/90 p-3 rounded-lg border border-rose-300 dark:border-rose-800 flex items-start gap-2.5 text-rose-950 dark:text-rose-100 text-xs font-semibold mt-1">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Yêu cầu điều chỉnh:</strong> Hệ thống đã khóa nút nhập. Bạn cần điều chỉnh lại danh sách trong file Excel (.xlsx) theo đúng yêu cầu ràng buộc trên thì mới được phép nhập dữ liệu vào phần mềm!
                </span>
              </div>
            </div>
          )}

          {errorMsg && !hasQuotaViolation && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Real-time Impact Preview */}
          {parsedRows.length > 0 && (
            <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-emerald-400 uppercase tracking-wider text-[11px]">
                  Đối soát & Đánh giá lại Cấp chương trình
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-600 text-white font-black text-xs rounded-full">
                  Chương trình Cấp {previewCalculation.programLevel} ({previewCalculation.totalScore} điểm)
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-300 pt-1">
                <div>
                  <span className="text-slate-400 block">Số lượng sinh viên</span>
                  <span className="font-bold text-white text-xs">{parsedRows.length} người</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Điểm thành phần số lượng</span>
                  <span className="font-bold text-emerald-300 text-xs">+{previewCalculation.participantPoints} điểm</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Điểm phân cấp tổng</span>
                  <span className="font-bold text-white text-xs">{previewCalculation.totalScore} điểm</span>
                </div>
              </div>
              {isSchoolOrg && (
                <div className="text-[11px] text-amber-300 bg-amber-950/60 border border-amber-800/80 rounded px-2 py-1 mt-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Ràng buộc: Hoạt động do Đoàn trường / Hội Sinh viên trường tổ chức áp dụng mức sàn tối thiểu từ Cấp 3 trở lên.</span>
                </div>
              )}
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedRows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Xem trước danh sách ({parsedRows.length} sinh viên đối soát thành công)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Điểm ĐRL tự động tính theo Cấp {previewCalculation.programLevel}
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 sticky top-0">
                    <tr>
                      <th className="px-3 py-2">STT</th>
                      <th className="px-3 py-2">MSSV</th>
                      <th className="px-3 py-2">Họ và Tên</th>
                      <th className="px-3 py-2">Chi đoàn</th>
                      <th className="px-3 py-2">Vai trò tham gia</th>
                      <th className="px-3 py-2 text-right">Điểm ĐRL cộng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {parsedRows.map((row, idx) => {
                      const isExisting = students.some(s => s.studentId === row.studentId);
                      const isBtcRole = row.role === 'Ban Tổ chức';
                      const isCtvRole = row.role === 'Cộng tác viên';
                      return (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                          <td className="px-3 py-2 font-mono font-bold text-slate-900 dark:text-slate-100">
                            {row.studentId}
                            {isExisting ? (
                              <span className="ml-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">(Đã có hồ sơ)</span>
                            ) : (
                              <span className="ml-1 text-[9px] text-sky-600 dark:text-sky-400 font-semibold">(Tạo mới)</span>
                            )}
                          </td>
                          <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">{row.fullName}</td>
                          <td className="px-3 py-2">{row.classCode}</td>
                          <td className="px-3 py-2 font-semibold">
                            {isBtcRole ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-bold text-[11px]">
                                {row.role}
                              </span>
                            ) : isCtvRole ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-900/60 text-sky-900 dark:text-sky-200 border border-sky-300 dark:border-sky-700 font-bold text-[11px]">
                                {row.role}
                              </span>
                            ) : (
                              <span className="text-slate-700 dark:text-slate-300">{row.role}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right font-black text-emerald-700 dark:text-emerald-400">
                            +{row.pointsCalculated} đ
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {hasQuotaViolation ? (
                <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  Không thể nhập dữ liệu: Cần điều chỉnh lại file Excel theo đúng ràng buộc
                </span>
              ) : (
                <span>Đã kiểm tra đối soát cấu trúc dữ liệu và điều kiện nhân sự</span>
              )}
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={parsedRows.length === 0 || isProcessing || hasQuotaViolation}
                onClick={handleConfirmImport}
                className={`px-5 py-2 font-bold text-white rounded-lg shadow-sm flex items-center gap-2 transition ${
                  hasQuotaViolation
                    ? 'bg-rose-600 hover:bg-rose-700 cursor-not-allowed opacity-90'
                    : 'bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
                }`}
                title={hasQuotaViolation ? 'Danh sách vượt quá số lượng BTC/CTV cho phép, không thể nạp' : 'Xác nhận nạp danh sách'}
              >
                {hasQuotaViolation ? (
                  <>
                    <Lock className="w-4 h-4 text-white" />
                    <span>Không Cho Phép Nhập (Cần Điều Chỉnh)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    {isProcessing
                      ? 'Đang tính toán...'
                      : `Xác Nhận & Cập Nhật Điểm (${parsedRows.length} SV)`}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
